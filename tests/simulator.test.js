import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { run, openingPing } from "../engine/simulator.js";
import { cases, openingPings } from "./cases.js";

const content = JSON.parse(readFileSync(new URL("../data/rounds.json", import.meta.url)));
const roundById = Object.fromEntries(content.rounds.map((r) => [r.id, r]));
// How many placements each round has, counted by hand from its slots and tray.
const EXPECTED_COUNTS = { "link-up": 6, "other-end": 12, "two-way": 4, save: 3, "loop-save": 6, "call-order": 6 };

// Reduce a simulator Leg to the hand-written shape in cases.js.
const leg = (l) => (l === null ? null : l.delivered ? { delivered: true } : { droppedAt: l.droppedAt });
const shape = (ping) => ({ request: leg(ping.request), reply: leg(ping.reply) });
const complete = (ping) => ping.request.delivered && ping.reply?.delivered === true;

let ran = 0;
const solved = [];

for (const c of cases) {
  test(`case ${c.id} (${c.round})`, () => {
    const result = run(content.topology, roundById[c.round], c.placement);
    ran += 1;
    if (result.status === "solved") solved.push(c.id);

    assert.equal(result.status, c.expect.status);
    assert.deepEqual(shape(result.pings.at(-1)), c.expect.lastPing);
    assert.deepEqual(
      result.steps.filter((s) => s.outcome === "rejected").map((s) => s.line),
      c.expect.rejected,
    );
    assert.equal(result.crashed, c.expect.crashed ?? false);
    if (c.expect.crashed) {
      // The crash is the last thing that happened, and it changed nothing.
      assert.equal(result.steps.at(-1).outcome, "crashed");
      assert.deepEqual(result.steps.at(-1).changed, []);
      assert.equal(result.steps.flatMap((s) => s.sent).length, 0, "nothing reached a router");
    }
    if (c.expect.noChange) {
      assert.deepEqual(result.steps.filter((s) => s.outcome === "no-change").map((s) => s.line), c.expect.noChange);
    }
    if (c.expect.firstPingOk !== undefined) {
      assert.equal(result.pings.length, 2);
      assert.equal(complete(result.pings[0]), c.expect.firstPingOk);
    } else {
      assert.equal(result.pings.length, 1);
    }
    if (c.expect.saved) {
      const afterScript = result.steps.at(-1).state;
      assert.deepEqual(["r1", "r2"].filter((r) => afterScript[r].saved), c.expect.saved);
    }
    if (c.expect.shutAgain) {
      assert.deepEqual(["r1", "r2"].filter((r) => result.reload.reverted[r].some((x) => x.state === "shut down")), c.expect.shutAgain);
    }
    if (c.expect.lostOnReload) {
      assert.deepEqual(["r1", "r2"].filter((r) => result.reload.lost[r].length > 0), c.expect.lostOnReload);
    }
  });
}

test("every listed case ran, and exactly cases 1, 7, 11, 14, 15, 20, 32, 38 and 39 are solved", () => {
  assert.equal(cases.length, 47);
  assert.equal(ran, 47);
  assert.deepEqual(solved, [1, 7, 11, 14, 15, 20, 32, 38, 39]);
});

test("the listed cases are every placement of their rounds, each exactly once", () => {
  for (const round of content.rounds) {
    if (!(round.id in EXPECTED_COUNTS)) continue; // too large to list: see whole-script.test.js
    const listed = cases.filter((c) => c.round === round.id).map((c) => JSON.stringify(Object.entries(c.placement).sort()));
    assert.equal(new Set(listed).size, listed.length, `${round.id}: a placement is listed twice`);
    assert.equal(listed.length, EXPECTED_COUNTS[round.id], `${round.id}: wrong number of cases`);
  }
});

test("every Run starts from the starting state (same input, same result)", () => {
  const round = roundById["link-up"];
  const placement = cases[0].placement;
  assert.deepEqual(run(content.topology, round, placement), run(content.topology, round, placement));
});

test("an incomplete placement is invalid input and executes nothing", () => {
  const result = run(content.topology, roundById["link-up"], { "line-1": "int-g01" });
  assert.equal(result.status, "invalid-input");
  assert.deepEqual(result.emptySlots, ["line-2"]);
  assert.equal(result.steps.length, 0);
});

for (const [id, expected] of Object.entries(openingPings)) {
  test(`opening ping, ${id}`, () => {
    const ping = openingPing(content.topology, roundById[id]);
    assert.equal(ping.phase, "opening");
    assert.deepEqual(shape(ping), expected);
  });
}
