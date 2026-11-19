// The last round has 720 placements: too many to list by hand. So the expected result is a rule,
// written here from the game's nine rules and worked out on paper, that says for ANY placement
// whether the script crashes, whether the ping before the reload completes, and whether the round
// is solved. It never calls the simulator. Every one of the 720 placements is then run through
// the simulator and compared with it. (constitution, Principle I, evidence for large rounds)

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { run } from "../engine/simulator.js";

const content = JSON.parse(readFileSync(new URL("../data/rounds.json", import.meta.url)));
const round = content.rounds.find((r) => r.id === "whole-script");

const CARDS = ["connect", "linkup", "routes", "save", "show", "print"];
const SLOTS = ["loop-1", "loop-2", "loop-3", "loop-4", "after-loop"];
const USES_CONN = new Set(["linkup", "routes", "save", "show"]); // print does not touch conn

/**
 * The rule, by hand:
 * - Crash (rule 9). conn does not exist until the connect card has run. The loop body holds four
 *   cards, so at least two of them use conn. If the first of those comes before the connect card
 *   in the body, or the connect card is not in the body at all, the first pass of the loop stops
 *   with a NameError and nothing is sent.
 * - Ping before the reload. With no crash, the request and reply are delivered exactly when the
 *   link was brought up on r1 and both routers got their route: that is, when both config cards
 *   are in the loop body. (The route card after the loop reaches r2 only, so r1 would have none.)
 * - Solved. After the reload each router keeps only what it saved. r1 needs its link setting and
 *   its route saved, so on r1 the save must come after both config cards, inside the loop. With
 *   the connect that is four cards in four blanks: connect first, the two config cards in either
 *   order, save last. The card after the loop then changes nothing that matters.
 */
function byHand(placement) {
  const body = SLOTS.slice(0, 4).map((s) => placement[s]);
  const connectAt = body.indexOf("connect");
  const firstUse = body.findIndex((c) => USES_CONN.has(c));
  const crashed = connectAt === -1 || firstUse < connectAt;
  const bothConfigs = body.includes("linkup") && body.includes("routes");
  const firstPingOk = !crashed && bothConfigs;
  const solved = !crashed && bothConfigs && body[0] === "connect" && body[3] === "save";
  return { crashed, firstPingOk, solved };
}

/** Every way to put five of the six cards into the five blanks. Written here, not borrowed from the game. */
function everyPlacement() {
  const out = [];
  const fill = (i, placement, used) => {
    if (i === SLOTS.length) return void out.push({ ...placement });
    for (const card of CARDS) {
      if (used.includes(card)) continue;
      fill(i + 1, { ...placement, [SLOTS[i]]: card }, [...used, card]);
    }
  };
  fill(0, {}, []);
  return out;
}

const complete = (ping) => ping.request.delivered && ping.reply?.delivered === true;
const all = everyPlacement();

test("there are 720 placements: 6 x 5 x 4 x 3 x 2", () => {
  assert.equal(all.length, 720);
  assert.equal(new Set(all.map((p) => JSON.stringify(p))).size, 720);
});

test("all 720 placements match the hand-written rule", () => {
  const solved = [];
  for (const placement of all) {
    const expected = byHand(placement);
    const result = run(content.topology, round, placement);
    const label = JSON.stringify(placement);
    assert.equal(result.crashed, expected.crashed, `crashed: ${label}`);
    assert.equal(complete(result.pings[0]), expected.firstPingOk, `ping before the reload: ${label}`);
    assert.equal(result.status, expected.solved ? "solved" : "unsolved", `status: ${label}`);
    if (result.status === "solved") solved.push(SLOTS.map((s) => placement[s]).join(" "));
  }
  // Exactly four scripts work, and they are the four the rule predicts.
  assert.deepEqual(solved.sort(), [
    "connect linkup routes save print",
    "connect linkup routes save show",
    "connect routes linkup save print",
    "connect routes linkup save show",
  ]);
});

test("the rule's own counts, worked by hand", () => {
  // connect in the body with nothing that uses conn before it: connect first (5x4x3 = 60 bodies),
  // or print then connect (4x3 = 12 bodies). Each body leaves 2 cards for the last blank.
  const noCrash = all.filter((p) => !byHand(p).crashed);
  assert.equal(noCrash.length, (60 + 12) * 2);
  assert.equal(all.filter((p) => byHand(p).solved).length, 4);
});
