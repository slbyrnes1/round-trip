// Turn the simulator's Result into text: log lines, trace sentences and the explanation.
// Pure. Wording for what a router did and why traffic stopped comes from the content file's
// `messages`, keyed by the simulator's reason codes; this module only fills in the values.
//
// ponytail: the trace sentence frames ("Request delivered to hostB.", "used route … via …") are
// fixed strings here, because they restate simulator facts and teach nothing by themselves.
// Move them into data/rounds.json if they ever need review as content.

const fill = (text, values) => text.replace(/\{(\w+)\}/g, (whole, name) => (name in values ? values[name] : whole));

/** A message for a reason code, with its values filled in. Quotes a router message only once captured (FR-018). */
function sentence(content, reason, values) {
  const message = content.messages[reason];
  const quoted = message.quote && content.routerMessages[message.quote];
  const quote = quoted && quoted.captured ? ` The router said: "${quoted.text}"` : "";
  return fill(message.text, values) + quote;
}

/** The router's own message for a reason code, or null until it has been captured from a real device. */
function quoteOf(content, reason) {
  const quoted = content.routerMessages[content.messages[reason].quote];
  return quoted && quoted.captured ? quoted.text : null;
}

/** One log line per executed step: what was sent and what the router did. */
export function logLines(result, content) {
  return result.steps.map((step) => ({
    path: step.path,
    outcome: step.outcome,
    changed: step.changed,
    sent: step.sent, // what Netmiko wrote to the router for this step
    short: fill(content.messages[step.reason].short, step.values), // what the router did, in a few words
    quote: quoteOf(content, step.reason), // the router's own message, once captured (FR-018)
    text: sentence(content, step.reason, step.values),
  }));
}

const legSentence = (name, leg, to) =>
  leg.delivered ? `${name} delivered to ${to}.` : `${name} dropped at ${leg.droppedAt}.`;

/** The one-sentence result of a ping, e.g. "Request delivered to hostB. Reply dropped at r2." */
export function pingSummary(ping) {
  const there = ping.request.hops[0].node; // the host the request left from
  const request = legSentence("Request", ping.request, ping.request.delivered ? ping.request.hops.at(-1).node : "");
  return ping.reply ? `${request} ${legSentence("Reply", ping.reply, there)}` : request;
}

const routeText = (route, destination) =>
  route === null
    ? `no matching route for ${destination}`
    : route.via === "connected"
      ? `used connected route ${route.prefix}`
      : `used route ${route.prefix} via ${route.via}`;

/** Under the summary: for each router the packet reached, the route it used or that none matched (FR-012a). */
export function pingRouterLines(ping) {
  const lines = [];
  for (const [name, leg] of [["Request", ping.request], ["Reply", ping.reply]]) {
    if (!leg) continue;
    for (const hop of leg.hops.slice(1, leg.delivered ? -1 : undefined)) {
      lines.push(`${name} at ${hop.node}: ${routeText(hop.route, leg.destination)}.`);
    }
  }
  return lines;
}

/** Each leg of a ping as hops: the hosts at the ends, and for each router the route it used, or none. */
export function pingLegs(ping) {
  return [["request", ping.request], ["reply", ping.reply]].filter(([, leg]) => leg).map(([name, leg]) => ({
    name,
    delivered: leg.delivered,
    droppedAt: leg.droppedAt,
    destination: leg.destination,
    hops: leg.hops.map((hop, i) => {
      const router = i > 0 && (!leg.delivered || i < leg.hops.length - 1);
      return { node: hop.node, router, via: !router ? null : hop.route === null ? "no route" : hop.route.via };
    }),
  }));
}

const PHASE = { opening: "Starting state", "after-script": "After the script", "after-reload": "After the reload" };

/** The text trace for the pings of a Run: a heading, summary and per-router lines for each. */
export function traceBlocks(result) {
  return result.pings.map((ping) => ({
    heading: PHASE[ping.phase],
    summary: pingSummary(ping),
    lines: pingRouterLines(ping),
    legs: pingLegs(ping), // the same information as `lines`, as hops to draw
  }));
}

/** What the reload did: which routers lost which unsaved lines. */
export function reloadSentence(result) {
  const undone = [];
  for (const [r, lines] of Object.entries(result.reload.lost)) {
    if (lines.length) undone.push(`${r} lost ${lines.map((l) => `\`${l}\``).join(" and ")}`);
  }
  for (const [r, list] of Object.entries(result.reload.reverted)) {
    for (const { interface: name, state } of list) undone.push(`${name} on ${r} is ${state} again`);
  }
  return undone.length ? `Both routers reloaded. ${undone.join("; ")}.` : "Both routers reloaded. Nothing was lost.";
}

/** Why the deciding ping stopped where it did, or null when it completed. */
function dropSentence(ping, content) {
  const leg = ping.request.delivered ? ping.reply : ping.request;
  return leg && !leg.delivered ? sentence(content, leg.reason, leg.values) : null;
}

/**
 * The explanation, in the order FR-015 requires: what the router did with each line, where the
 * traffic stopped, and the rule that explains the result.
 */
export function explanation(result, content) {
  const solved = result.status === "solved";
  const acted = result.steps.filter((s) => s.reason !== "connected");
  const router = acted.map((s) => sentence(content, s.reason, s.values));

  const last = result.pings.at(-1);
  const traffic = [];
  if (result.pings.length === 2) {
    traffic.push(`Before the reload: ${pingSummary(result.pings[0])}`);
    traffic.push(reloadSentence(result));
    traffic.push(`After the reload: ${pingSummary(last)}`);
  } else {
    traffic.push(pingSummary(last));
  }
  const drop = dropSentence(last, content);
  if (drop) traffic.push(drop);

  // Rules: those behind a rejected line, a leftover loop connection and the drop; for a solving
  // Run, those behind the lines that changed something, plus forwarding (rule 5).
  const ruleIds = new Set();
  const cite = (reason) => content.messages[reason].ruleIds.forEach((id) => ruleIds.add(id));
  for (const s of acted) {
    if (["rejected", "crashed"].includes(s.outcome) || s.reason === "after-loop-last-connection" || (solved && s.outcome === "applied")) cite(s.reason);
  }
  const leg = last.request.delivered ? last.reply : last.request;
  if (leg && !leg.delivered) cite(leg.reason);
  if (solved) ruleIds.add(5);
  const rules = content.rules.filter((r) => ruleIds.has(r.id)).map(({ id, name, short, text }) => ({ id, name, short, text }));

  // The one-line reason: where the deciding ping stopped and why, in the short form.
  const stop = leg && !leg.delivered ? { router: leg.droppedAt, reason: fill(content.messages[leg.reason].short, leg.values) } : null;
  const why = stop ? `${stop.router}: ${stop.reason}` : null;
  const workedBefore = result.pings.length === 2 && result.pings[0].request.delivered && result.pings[0].reply?.delivered === true;

  return { solved, router, traffic, rules, crashed: result.crashed, why, stop, workedBefore, reloaded: result.pings.length === 2 };
}
