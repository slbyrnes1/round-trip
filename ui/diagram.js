// The topology diagram: four nodes on a line, the r1–r2 link, the moving ping dot and its marks.
// It only draws what it is told; where a dot stops is decided by the simulator.

const Y = 86;
const XS = [62, 232, 432, 602];
const EDGE = 48; // from a node's centre to just outside its box
const short = (name) => name.replace("GigabitEthernet", "Gi");
const subnet = (address, length) => {
  const n = address.split(".").reduce((acc, o) => acc * 256 + Number(o), 0);
  const net = Math.floor(n / 2 ** (32 - length)) * 2 ** (32 - length);
  return `${[24, 16, 8, 0].map((s) => Math.floor(net / 2 ** s) % 256).join(".")}/${length}`;
};

let root = null;
let x = {};
let motion = null;
let pace = { paused: false, rate: 1 };

/** Freeze, resume or slow the dot: applies to the move in progress and to every later one. */
export function setPace(next) {
  pace = { ...next };
  if (!motion) return;
  motion.playbackRate = pace.rate;
  if (pace.paused) motion.pause(); else motion.play();
}

/** Draw the diagram once per page load. Node order: host, its router, the other router, its host. */
export function drawDiagram(el, topology) {
  const [hostA, hostB] = Object.keys(topology.hosts);
  const order = [hostA, topology.hosts[hostA].router, topology.hosts[hostB].router, hostB];
  x = Object.fromEntries(order.map((node, i) => [node, XS[i]]));
  const half = (node) => (node in topology.hosts ? 27 : 28);

  const wires = order.slice(0, -1).map((node, i) => {
    const next = order[i + 1];
    const core = node in topology.routers && next in topology.routers;
    const iface = Object.values(topology.routers[core || !(node in topology.routers) ? next : node].interfaces)
      .find((f) => f.faces === (core || !(node in topology.routers) ? node : next));
    const mid = (x[node] + x[next]) / 2;
    return `<line ${core ? 'id="core-link"' : ""} class="wire up" x1="${x[node] + half(node)}" x2="${x[next] - half(next)}" y1="${Y}" y2="${Y}"/>
      <text class="subnet" x="${mid}" y="${Y - 14}">${subnet(iface.address, iface.prefixLength)}</text>`;
  }).join("");

  const nodes = order.map((node) => {
    const cx = x[node];
    if (node in topology.hosts) { // a little laptop with a face
      return `<g class="host-icon sad" id="face-${node}">
          <rect class="node host" x="${cx - 26}" y="${Y - 21}" width="52" height="35" rx="5"/>
          <path class="base" d="M${cx - 33} ${Y + 17}h66l-5 7h-56z"/>
          <circle class="eye" cx="${cx - 9}" cy="${Y - 8}" r="2.3"/><circle class="eye" cx="${cx + 9}" cy="${Y - 8}" r="2.3"/>
          <path class="mouth smile" d="M${cx - 7} ${Y + 1}q7 6 14 0"/><path class="mouth frown" d="M${cx - 7} ${Y + 6}q7 -6 14 0"/>
        </g>
        <text class="name" x="${cx}" y="${Y + 40}">${node}</text>
        <text class="addr" x="${cx}" y="${Y + 54}">${topology.hosts[node].address}</text>
        <text class="mark" id="mark-${node}" x="${cx}" y="${Y - 34}"></text>`;
    }
    let labels = "";
    for (const [name, iface] of Object.entries(topology.routers[node].interfaces)) {
      const side = x[iface.faces] < cx ? -1 : 1;
      labels += `<text class="addr" x="${cx + side * 62}" y="${Y + 40}">${short(name)}</text>
        <text class="addr" x="${cx + side * 62}" y="${Y + 54}">${iface.address}</text>`;
    }
    // a router: a round puck with the two-way arrows
    return `<circle class="node router" data-node="${node}" cx="${cx}" cy="${Y}" r="28"/>
      <path class="glyph" d="M${cx - 10} ${Y - 10}h18m-5 -4l5 4l-5 4M${cx + 10} ${Y - 1}h-18m5 -4l-5 4l5 4"/>
      <text class="name" x="${cx}" y="${Y + 18}">${node}</text>${labels}
      <text class="mark" id="mark-${node}" x="${cx}" y="${Y - 34}"></text>`;
  }).join("");

  el.innerHTML = `<svg viewBox="0 38 664 108" role="img" aria-label="hostA, router r1, router r2 and hostB in a line. The moving dot is a ping; the caption below says where it stops.">
    ${wires}${nodes}
    <g id="dot" hidden><circle r="8"/></g>
  </svg>`;
  root = el;
}

/** Light or darken the r1–r2 link, and say its state in text (FR-020). */
export function setLink(views, textEl) {
  const up = Object.values(views).every((v) => v.linkInterface === "up");
  root.querySelector("#core-link").setAttribute("class", `wire ${up ? "up" : "down"}`);
  textEl.textContent = `Link r1–r2: ${up ? "up" : "down"}`;
}

/** Move the dot from one node to the next. Resolves when it arrives or the motion is stopped. */
export function moveDot(leg, from, to, ms) {
  const dot = root.querySelector("#dot");
  const y = leg === "request" ? Y - 7 : Y + 7; // request above the wire, reply below it
  dot.setAttribute("class", leg);
  // Which leg it is shows in its place (request above the wire, reply below) and its colour; the
  // marks and the caption say it in words.
  dot.removeAttribute("hidden");
  // Travel from the edge of one node to the edge of the next, so the dot never covers a node's name
  // and is seen waiting beside a router while that router decides.
  const dir = Math.sign(x[to] - x[from]);
  const [x1, x2] = [x[from] + dir * EDGE, x[to] - dir * EDGE];
  motion = dot.animate(
    [{ transform: `translate(${x1}px, ${y}px)` }, { transform: `translate(${x2}px, ${y}px)` }],
    { duration: ms, easing: "ease-in-out", fill: "forwards" },
  );
  motion.playbackRate = pace.rate;
  if (pace.paused) motion.pause();
  return motion.finished.catch(() => {});
}

/** The hosts' faces follow the ping: hostA smiles when its reply comes back, hostB when the request arrives. */
export function setMood(ping) {
  const [a, b] = [...root.querySelectorAll(".host-icon")];
  a.setAttribute("class", `host-icon ${ping.reply?.delivered ? "happy" : "sad"}`);
  b.setAttribute("class", `host-icon ${ping.request.delivered ? "happy" : "sad"}`);
}

export function hideDot() {
  motion?.cancel();
  motion = null;
  root?.querySelector("#dot").setAttribute("hidden", "");
}

/** Mark where a packet ended: the same mark for every drop, wherever it happens. */
export function mark(node, kind, leg) {
  const el = root.querySelector(`#mark-${node}`);
  const text = kind === "dropped" ? `✕ ${leg} dropped` : `✓ ${leg} delivered`;
  el.textContent = el.textContent ? `${el.textContent} · ${text}` : text;
  el.setAttribute("class", `mark ${kind}`);
}

export function clearMarks() {
  root?.querySelectorAll(".mark").forEach((el) => { el.textContent = ""; });
}
