import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { run, openingPing } from "../engine/simulator.js";
import { logLines, pingSummary, pingRouterLines, traceBlocks, explanation } from "../engine/feedback.js";
import { cases } from "./cases.js";

const load = () => JSON.parse(readFileSync(new URL("../data/rounds.json", import.meta.url)));
const content = load();
const resultOf = (id, c = content) => {
  const { round, placement } = cases.find((x) => x.id === id);
  return run(c.topology, c.rounds.find((r) => r.id === round), placement);
};

test("case 1: the trace reads as AC2 requires, with an explanation", () => {
  const result = resultOf(1);
  assert.equal(traceBlocks(result)[0].summary, "Request delivered to hostB. Reply delivered to hostA.");
  const why = explanation(result, content);
  assert.equal(why.solved, true);
  assert.ok(why.rules.length > 0);
});

test("case 2: the rejected line, that the script carried on, and the drop at r1 (AC3)", () => {
  const result = resultOf(2);
  const log = logLines(result, content).map((l) => l.text);
  const rejected = log.find((t) => t.includes("rejected"));
  assert.match(rejected, /r1 rejected `no shutdown` because no interface was selected yet/);
  assert.match(rejected, /carried on without stopping/);

  assert.equal(traceBlocks(result)[0].summary, "Request dropped at r1.");
  const why = explanation(result, content);
  assert.equal(why.solved, false);
  assert.ok(why.traffic.some((t) => /link to r2 is down/.test(t)));
  assert.deepEqual(why.rules.map((r) => r.id), [1, 2, 3, 8]);
});

test("explanation order is router, then traffic, then rule (FR-015)", () => {
  assert.deepEqual(Object.keys(explanation(resultOf(2), content)).slice(0, 4), ["solved", "router", "traffic", "rules"]);
});

test("case 8: the worked interaction from the spec", () => {
  const result = resultOf(8);
  assert.ok(logLines(result, content).some((l) => l.text === "r1 already had this route, so nothing changed."));
  assert.equal(traceBlocks(result)[0].summary, "Request delivered to hostB. Reply dropped at r2.");
  assert.ok(explanation(result, content).traffic.some((t) => /r2 dropped the packet\. It has no route to 10\.10\.0\.0\/24/.test(t)));
});

test("every trace lists the route used or that none matched, per router (FR-012a)", () => {
  assert.deepEqual(traceBlocks(resultOf(8))[0].lines, [
    "Request at r1: used route 10.20.0.0/24 via 192.0.2.2.",
    "Request at r2: used connected route 10.20.0.0/24.",
    "Reply at r2: no matching route for 10.10.0.0/24.",
  ]);
  assert.deepEqual(traceBlocks(resultOf(2))[0].lines, ["Request at r1: no matching route for 10.20.0.0/24."]);
});

test("the opening ping gives a summary sentence; per-router lines are a separate call (FR-003)", () => {
  const ping = openingPing(content.topology, content.rounds.find((r) => r.id === "two-way"));
  assert.equal(pingSummary(ping), "Request delivered to hostB. Reply dropped at r2.");
  assert.equal(pingRouterLines(ping).length, 3);
});

test("rounds with a reload report both pings and what the reload removed", () => {
  const result = resultOf(16); // save placed after the loop: only r2 is saved
  const blocks = traceBlocks(result);
  assert.deepEqual(blocks.map((b) => b.heading), ["After the script", "After the reload"]);
  assert.equal(blocks[0].summary, "Request delivered to hostB. Reply delivered to hostA.");
  assert.equal(blocks[1].summary, "Request dropped at r1.");

  const why = explanation(result, content);
  assert.ok(why.router.some((t) => /after the loop, so `conn` is still the session to r2/.test(t)));
  assert.ok(why.traffic.some((t) => /r1 lost `ip route 10\.20\.0\.0 255\.255\.255\.0 192\.0\.2\.2`/.test(t)));
  assert.ok(why.traffic.some((t) => /never saved on r1, so the reload removed it/.test(t)));
  assert.deepEqual(why.rules.map((r) => r.id), [5, 6, 7]);
});

test("each log line carries what Netmiko sent to the router (FR-015a)", () => {
  // Round 1 solved: one send_config_set call with two lines.
  assert.deepEqual(logLines(resultOf(1), content).map((l) => l.sent), [
    [],
    ["r1# configure terminal", "r1(config)# interface GigabitEthernet0/1"],
    ["r1(config-if)# no shutdown", "r1(config-if)# end"],
  ]);
  // Wrong order: `no shutdown` is sent at global configuration level, where the router rejects it.
  assert.deepEqual(logLines(resultOf(2), content).map((l) => l.sent), [
    [],
    ["r1# configure terminal", "r1(config)# no shutdown"],
    ["r1(config)# interface GigabitEthernet0/1", "r1(config-if)# end"],
  ]);
  // Round 4, save after the loop: write mem reaches r2 only; print sends nothing.
  const sent16 = logLines(resultOf(16), content).flatMap((l) => l.sent);
  assert.deepEqual(sent16.filter((l) => l.endsWith("write mem")), ["r2# write mem"]);
  assert.deepEqual(sent16.filter((l) => l.includes("show running-config")), ["r1# show running-config", "r2# show running-config"]);
  assert.deepEqual(logLines(resultOf(13), content).at(-1).sent, []);
});

test("a script that uses conn before connecting: the log says Python stopped it, and rule 9 is cited", () => {
  const result = resultOf(34); // config, connect, save
  const log = logLines(result, content);
  assert.equal(log.length, 1);
  assert.equal(log[0].outcome, "crashed");
  assert.match(log[0].text, /Python stopped the script here with a NameError/);
  assert.match(log[0].text, /no later line ran/);
  const why = explanation(result, content);
  assert.equal(why.crashed, true);
  assert.deepEqual(why.rules.map((r) => r.id), [5, 9]);
  // Saved before configuring is not a crash: the script finishes, and the reload undoes the route.
  const late = explanation(resultOf(33), content);
  assert.equal(late.crashed, false);
  assert.ok(late.router.some((t) => /had nothing new to save/.test(t)));
  assert.ok(late.traffic.some((t) => /never saved on r1/.test(t)));
});

test("the reload sentence reports an interface setting the reload undid, not just routes", () => {
  const why = explanation(resultOf(43), content); // routes saved, then the link brought up and not saved
  assert.ok(why.traffic.includes("Both routers reloaded. GigabitEthernet0/1 on r1 is shut down again."), JSON.stringify(why.traffic));
  assert.ok(explanation(resultOf(38), content).traffic.includes("Both routers reloaded. Nothing was lost."));
});

test("every log line has a short form: filled in, and still saying what FR-016 requires", () => {
  for (const c of cases) {
    for (const line of logLines(resultOf(c.id), content)) {
      assert.ok(line.short.length > 0 && !/\{\w+\}/.test(line.short), `case ${c.id}: ${line.short}`);
      assert.ok(line.short.split(" ").length <= 12, `case ${c.id}: too long: ${line.short}`);
      if (line.outcome === "rejected") assert.match(line.short, /^rejected: .*Script carries on$/);
      if (line.outcome === "crashed") assert.match(line.short, /NameError.*Script stopped/);
    }
  }
  assert.equal(logLines(resultOf(2), content)[1].short, "rejected: no interface selected. Script carries on");
  assert.equal(logLines(resultOf(9), content).at(-1).short, "rejected: 192.0.2.1 is r1's own address. Script carries on");
});

test("the explanation's one-line reason and short rules", () => {
  const wrongOrder = explanation(resultOf(2), content);
  assert.equal(wrongOrder.why, "r1: route to 10.20.0.0/24 not installed: link to r2 is down");
  assert.deepEqual(wrongOrder.rules.map((r) => r.short), [
    "`no shutdown` works only after an `interface` line in the same call.",
    "A link is up only when both ends are enabled.",
    "A static route is used only while its link is up.",
    "A rejected line does not stop `send_config_set`.",
  ]);
  assert.ok(wrongOrder.rules.every((r) => r.text.length > r.short.length)); // the full text is still carried
  assert.equal(explanation(resultOf(8), content).why, "r2: no route to 10.10.0.0/24");
  const lostOnReload = explanation(resultOf(12), content);
  assert.deepEqual([lostOnReload.why, lostOnReload.workedBefore, lostOnReload.reloaded], ["r1: route to 10.20.0.0/24 was not saved; the reload removed it", true, true]);
  const solved = explanation(resultOf(1), content);
  assert.deepEqual([solved.why, solved.workedBefore, solved.reloaded], [null, false, false]);
  for (const r of content.rules) assert.ok(r.short.split(" ").length <= 14, r.short);
});

test("the trace as hops carries what the sentences carry (FR-012a)", () => {
  const [block] = traceBlocks(resultOf(8)); // request delivered, reply dropped at r2
  assert.deepEqual(block.legs.map((l) => [l.name, l.delivered, l.hops.map((h) => `${h.node}${h.router ? `(${h.via})` : ""}`).join(" > ")]), [
    ["request", true, "hostA > r1(192.0.2.2) > r2(connected) > hostB"],
    ["reply", false, "hostB > r2(no route)"],
  ]);
  assert.equal(block.legs[1].destination, "10.10.0.0/24");
  assert.equal(traceBlocks(resultOf(2))[0].legs.length, 1); // no reply when the request is dropped
});

test("no router message is quoted until it has been captured (FR-018)", () => {
  const paraphrased = logLines(resultOf(2), content).map((l) => l.text).join(" ");
  assert.ok(!paraphrased.includes("% Invalid input"));

  const captured = load();
  captured.routerMessages["ios-invalid-input"].captured = true;
  const quoted = logLines(resultOf(2, captured), captured).map((l) => l.text).join(" ");
  assert.ok(quoted.includes(`The router said: "% Invalid input detected at '^' marker."`));
  // The transcript gets the router's message as its own line only once captured.
  assert.equal(logLines(resultOf(2), content)[1].quote, null);
  assert.equal(logLines(resultOf(2, captured), captured)[1].quote, "% Invalid input detected at '^' marker.");
});

test("every placeholder in every message is filled, for every listed case", () => {
  for (const c of cases) {
    const result = resultOf(c.id);
    const why = explanation(result, content);
    const all = [...logLines(result, content).map((l) => l.text), ...why.router, ...why.traffic].join(" ");
    assert.ok(!/\{\w+\}/.test(all), `case ${c.id}: ${all}`);
  }
});
