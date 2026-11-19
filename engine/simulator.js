// The simulator: the only thing that decides an outcome (constitution I).
// Pure: same inputs, same Result. No page, timer, network, randomness or session state.
// Contract: specs/001-round-trip-game/contracts/simulator.md

export const REASON_CODES = [
  "connected", "interface-selected", "interface-enabled", "interface-disabled", "interface-unchanged",
  "no-interface-context", "route-added", "route-already-present", "next-hop-is-own-address",
  "config-saved", "config-already-saved", "show-reads-only", "print-does-nothing",
  "after-loop-last-connection", "conn-not-defined", "drop-link-down", "drop-no-route", "drop-route-lost-on-reload",
];

// ---- addresses -------------------------------------------------------------------------------

const toInt = (dotted) => dotted.split(".").reduce((n, octet) => n * 256 + Number(octet), 0);
const maskOf = (length) => (length === 0 ? 0 : (2 ** 32 - 2 ** (32 - length)));
const networkOf = (address, length) => Math.floor(toInt(address) / 2 ** (32 - length)) * 2 ** (32 - length);
const toDotted = (n) => [24, 16, 8, 0].map((shift) => Math.floor(n / 2 ** shift) % 256).join(".");
const prefixText = (network, length) => `${toDotted(network)}/${length}`;
const contains = (entry, address) => networkOf(address, entry.length) === entry.network;

const isDottedQuad = (s) => /^\d{1,3}(\.\d{1,3}){3}$/.test(s) && s.split(".").every((o) => Number(o) <= 255);
// A contiguous mask is ones followed by zeros; returns its length, or -1.
const maskLength = (dotted) => {
  const bits = toInt(dotted).toString(2).padStart(32, "0");
  return /^1*0*$/.test(bits) ? bits.indexOf("0") === -1 ? 32 : bits.indexOf("0") : -1;
};

// ---- the config-line grammar (contracts/content.md) ------------------------------------------

/** Parse one configuration line. Returns null when the line is not in the grammar. */
export function parseLine(line, topology) {
  if (line === "no shutdown") return { kind: "no-shutdown" };
  if (line === "shutdown") return { kind: "shutdown" };
  let m = /^interface (\S+)$/.exec(line);
  if (m) {
    const known = Object.values(topology.routers).some((r) => m[1] in r.interfaces);
    return known ? { kind: "interface", name: m[1] } : null;
  }
  m = /^ip route (\S+) (\S+) (\S+)$/.exec(line);
  if (m && m.slice(1).every(isDottedQuad) && maskLength(m[2]) >= 0) {
    const length = maskLength(m[2]);
    const network = networkOf(m[1], length);
    return { kind: "route", network, length, nextHop: m[3], prefix: prefixText(network, length) };
  }
  return null;
}

// ---- content helpers -------------------------------------------------------------------------

const isSlot = (x) => x !== null && typeof x === "object" && "slot" in x;

/** Every slot of a round, in the order it appears in the script. */
export function slotsOf(round) {
  const found = [];
  const walk = (statements) => {
    for (const st of statements) {
      if (isSlot(st)) found.push(st);
      else if (st.op === "connect" && isSlot(st.device)) found.push(st.device);
      else if (st.op === "config" && st.lines) found.push(...st.lines.filter(isSlot));
      else if (st.op === "for") walk(st.body);
    }
  };
  walk(round.script);
  return found;
}

// ---- router state ----------------------------------------------------------------------------

const cloneConfig = (c) => ({ shutdown: new Set(c.shutdown), routes: [...c.routes] });
const sameConfig = (a, b) =>
  a.shutdown.size === b.shutdown.size && [...a.shutdown].every((i) => b.shutdown.has(i)) &&
  a.routes.length === b.routes.length && a.routes.every((r) => b.routes.includes(r));

function startState(round) {
  const state = {};
  for (const [router, config] of Object.entries(round.start)) {
    state[router] = { running: cloneConfig(config), startup: cloneConfig(config) };
  }
  return state;
}

/** The interface on `router` that faces `peer`. */
const facing = (topology, router, peer) =>
  Object.entries(topology.routers[router].interfaces).find(([, i]) => i.faces === peer)?.[0];

/** Is this interface up? Shut on this router is down; so is a link whose other end is shut (rule 2). */
function interfaceState(topology, state, router, name) {
  if (state[router].running.shutdown.has(name)) return "administratively down";
  const peer = topology.routers[router].interfaces[name].faces;
  if (peer in topology.routers && state[peer].running.shutdown.has(facing(topology, peer, router))) return "down";
  return "up";
}

/** Rule 3: connected subnets whose link is up, then static routes whose next hop is inside one. */
function routingTable(topology, state, router) {
  const table = [];
  for (const [name, iface] of Object.entries(topology.routers[router].interfaces)) {
    if (interfaceState(topology, state, router, name) !== "up") continue;
    const network = networkOf(iface.address, iface.prefixLength);
    table.push({ network, length: iface.prefixLength, prefix: prefixText(network, iface.prefixLength), via: "connected" });
  }
  const connected = [...table];
  for (const line of state[router].running.routes) {
    const route = parseLine(line, topology);
    if (connected.some((c) => contains(c, route.nextHop))) {
      table.push({ network: route.network, length: route.length, prefix: route.prefix, via: route.nextHop });
    }
  }
  return table;
}

const linkPeer = (topology, router) =>
  Object.values(topology.routers[router].interfaces).map((i) => i.faces).find((f) => f in topology.routers);

function viewOf(topology, state, router) {
  const peer = linkPeer(topology, router);
  return {
    linkInterface: interfaceState(topology, state, router, facing(topology, router, peer)),
    runningRoutes: [...state[router].running.routes],
    routingTable: routingTable(topology, state, router).map(({ prefix, via }) => ({ prefix, via })),
    saved: sameConfig(state[router].running, state[router].startup),
  };
}

const viewsOf = (topology, state) =>
  Object.fromEntries(Object.keys(topology.routers).map((r) => [r, viewOf(topology, state, r)]));

const ROWS = ["linkInterface", "runningRoutes", "routingTable", "saved"];
const ROW_NAMES = { linkInterface: "interface", runningRoutes: "runningRoutes", routingTable: "routingTable", saved: "saved" };

function changedRows(before, after) {
  const changed = [];
  for (const router of Object.keys(after)) {
    for (const row of ROWS) {
      if (JSON.stringify(before[router][row]) !== JSON.stringify(after[router][row])) {
        changed.push({ router, row: ROW_NAMES[row] });
      }
    }
  }
  return changed;
}

// ---- ping (rules 2, 3, 5) --------------------------------------------------------------------

function forwardLeg(topology, state, from, to, phase, lost) {
  const target = topology.hosts[to];
  const destination = prefixText(networkOf(target.address, target.prefixLength), target.prefixLength);
  const leg = { delivered: false, hops: [{ node: from, route: null }], droppedAt: null, reason: null, destination, values: {} };
  let router = topology.hosts[from].router;

  // Each router is visited at most once on this line topology; the bound stops a routing loop.
  for (let i = 0; i < Object.keys(topology.routers).length; i += 1) {
    const entry = routingTable(topology, state, router).find((e) => contains(e, target.address));
    if (!entry) {
      leg.hops.push({ node: router, route: null });
      leg.droppedAt = router;
      const configured = state[router].running.routes.some((l) => contains(parseLine(l, topology), target.address));
      const wasLost = phase === "after-reload" &&
        (lost?.[router] ?? []).some((l) => contains(parseLine(l, topology), target.address));
      leg.reason = configured ? "drop-link-down" : wasLost ? "drop-route-lost-on-reload" : "drop-no-route";
      leg.values = { router, destination, peer: linkPeer(topology, router) };
      return leg;
    }
    leg.hops.push({ node: router, route: { prefix: entry.prefix, via: entry.via } });
    if (entry.via === "connected") {
      leg.hops.push({ node: to, route: null });
      leg.delivered = true;
      return leg;
    }
    router = Object.keys(topology.routers).find((r) =>
      Object.values(topology.routers[r].interfaces).some((iface) => iface.address === entry.via));
  }
  leg.droppedAt = router;
  leg.reason = "drop-no-route";
  leg.values = { router, destination, peer: linkPeer(topology, router) };
  return leg;
}

function ping(topology, state, phase, lost) {
  const [a, b] = Object.keys(topology.hosts);
  const request = forwardLeg(topology, state, a, b, phase, lost);
  const reply = request.delivered ? forwardLeg(topology, state, b, a, phase, lost) : null;
  return { phase, request, reply };
}

const completed = (p) => p.request.delivered && p.reply !== null && p.reply.delivered;

// ---- script execution (rules 1, 4, 6, 7, 8) --------------------------------------------------

function applyLine(topology, state, router, line, context) {
  const parsed = parseLine(line, topology);
  const config = state[router].running;
  const values = { router, line };
  if (parsed.kind === "interface") {
    context.selected = parsed.name;
    return { outcome: "applied", reason: "interface-selected", values: { ...values, interface: parsed.name } };
  }
  if (parsed.kind === "no-shutdown" || parsed.kind === "shutdown") {
    if (!context.selected) return { outcome: "rejected", reason: "no-interface-context", values };
    const name = context.selected;
    const wantShut = parsed.kind === "shutdown";
    if (config.shutdown.has(name) === wantShut) {
      return { outcome: "no-change", reason: "interface-unchanged",
        values: { ...values, interface: name, state: wantShut ? "shut down" : "up" } };
    }
    if (wantShut) config.shutdown.add(name); else config.shutdown.delete(name);
    return { outcome: "applied", reason: wantShut ? "interface-disabled" : "interface-enabled",
      values: { ...values, interface: name } };
  }
  // ip route
  const own = Object.values(topology.routers[router].interfaces).some((i) => i.address === parsed.nextHop);
  if (own) return { outcome: "rejected", reason: "next-hop-is-own-address", values: { ...values, nextHop: parsed.nextHop } };
  if (config.routes.includes(line)) return { outcome: "no-change", reason: "route-already-present", values };
  config.routes.push(line);
  return { outcome: "applied", reason: "route-added", values };
}

/** Rule 9: Python stops the script. Thrown to unwind the walk; never leaves execute(). */
class ScriptStopped extends Error {}

function execute(topology, round, placement) {
  const cards = Object.fromEntries(round.tray.map((c) => [c.id, c]));
  const fill = (x) => (isSlot(x) ? cards[placement[x.slot]].value : x);
  const state = startState(round);
  const steps = [];
  let conn = null;
  let device = null; // the loop variable; like conn, it keeps its last value after the loop (rule 7)
  let crashed = false;
  let connIsLeftover = false; // true after a for loop ends, until the next connect (rule 7)

  // `sent` is what Netmiko writes to the router for this step, on Cisco IOS: see the Netmiko
  // source rows in data/rounds.json "sources" (configure terminal / end / write mem).
  const record = (path, iteration, line, effect, sent = []) => {
    const before = steps.length ? steps.at(-1).state : viewsOf(topology, startState(round));
    const after = viewsOf(topology, state);
    steps.push({ path, iteration, router: conn, line, sent, ...effect, changed: changedRows(before, after), state: after });
  };
  const noteLeftover = (path) => {
    if (connIsLeftover) {
      record(path, null, null, { outcome: "read-only", reason: "after-loop-last-connection", values: { router: conn } });
    }
  };

  // Rule 9: a call on conn before any ConnectHandler has run is a NameError, and the script stops.
  const needConn = (path, iteration) => {
    if (conn !== null) return;
    record(path, iteration, null, { outcome: "crashed", reason: "conn-not-defined", values: {} });
    throw new ScriptStopped();
  };

  const walk = (statements, prefix, iteration) => {
    statements.forEach((raw, index) => {
      const st = fill(raw);
      const path = [...prefix, index];
      if (st.op === "connect") {
        conn = st.device === undefined ? device : fill(st.device);
        connIsLeftover = false;
        record(path, iteration, null, { outcome: "applied", reason: "connected", values: { router: conn } });
      } else if (st.op === "config") {
        needConn(path, iteration);
        noteLeftover(path);
        const lines = st.linesByDevice ? st.linesByDevice[conn] : st.lines.map(fill);
        const context = { selected: null }; // every call starts at global configuration level
        const prompt = () => `${conn}(${context.selected ? "config-if" : "config"})#`;
        lines.forEach((line, j) => {
          const sent = j === 0 ? [`${conn}# configure terminal`] : [];
          sent.push(`${prompt()} ${line}`);
          const effect = applyLine(topology, state, conn, line, context);
          if (j === lines.length - 1) sent.push(`${prompt()} end`);
          record([...path, j], iteration, line, effect, sent);
        });
      } else if (st.op === "save") {
        needConn(path, iteration);
        noteLeftover(path);
        const router = state[conn];
        const had = sameConfig(router.running, router.startup);
        router.startup = cloneConfig({ shutdown: [...router.running.shutdown], routes: router.running.routes });
        record(path, iteration, null, had
          ? { outcome: "no-change", reason: "config-already-saved", values: { router: conn } }
          : { outcome: "applied", reason: "config-saved", values: { router: conn } }, [`${conn}# write mem`]);
      } else if (st.op === "show") {
        needConn(path, iteration);
        noteLeftover(path);
        record(path, iteration, null, { outcome: "read-only", reason: "show-reads-only", values: { router: conn } }, [`${conn}# ${st.command}`]);
      } else if (st.op === "print") {
        record(path, iteration, null, { outcome: "read-only", reason: "print-does-nothing", values: { router: conn } });
      } else if (st.op === "for") {
        for (const each of st.devices) {
          device = each;
          walk(st.body, path, each);
        }
        connIsLeftover = true;
      }
    });
  };
  try {
    walk(round.script, [], null);
  } catch (stop) {
    if (!(stop instanceof ScriptStopped)) throw stop;
    crashed = true;
  }
  return { state, steps, crashed };
}

// ---- public API ------------------------------------------------------------------------------

/** The round's starting state, for the panels and the diagram. */
export function startView(topology, round) {
  return viewsOf(topology, startState(round));
}

/** A ping from the starting state, using the same forwarding code as run. */
export function openingPing(topology, round) {
  return ping(topology, startState(round), "opening", null);
}

/** Apply the eight rules to the round's starting state and the placed cards. */
export function run(topology, round, placement) {
  const slots = slotsOf(round);
  const cards = Object.fromEntries(round.tray.map((c) => [c.id, c]));
  const emptySlots = slots.filter((s) => !(s.slot in placement)).map((s) => s.slot);
  const used = slots.map((s) => placement[s.slot]).filter((id) => id !== undefined);
  const wrong = slots.some((s) => s.slot in placement && cards[placement[s.slot]]?.type !== s.type);
  if (emptySlots.length || wrong || new Set(used).size !== used.length) {
    return { status: "invalid-input", emptySlots, crashed: false, steps: [], pings: [], reload: null, finalState: startView(topology, round) };
  }

  const { state, steps, crashed } = execute(topology, round, placement);
  const pings = [ping(topology, state, "after-script", null)];
  let reload = null;
  if (round.reloadCheck) {
    const lost = {};
    const reverted = {}; // interfaces whose unsaved shutdown / no shutdown the reload undid
    for (const [router, config] of Object.entries(state)) {
      lost[router] = config.running.routes.filter((l) => !config.startup.routes.includes(l));
      reverted[router] = Object.keys(topology.routers[router].interfaces)
        .filter((name) => config.running.shutdown.has(name) !== config.startup.shutdown.has(name))
        .map((name) => ({ interface: name, state: config.startup.shutdown.has(name) ? "shut down" : "up" }));
      config.running = cloneConfig({ shutdown: [...config.startup.shutdown], routes: config.startup.routes });
    }
    reload = { lost, reverted };
    pings.push(ping(topology, state, "after-reload", lost));
  }
  return {
    status: completed(pings.at(-1)) ? "solved" : "unsolved",
    emptySlots: [],
    crashed, // rule 9: Python stopped the script before its last line
    steps,
    pings,
    reload,
    finalState: viewsOf(topology, state),
  };
}
