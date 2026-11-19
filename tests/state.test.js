import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as simulator from "../engine/simulator.js";
import {
  createSession, selectCard, selectSlot, run, endPlayback,
  resetRouters, openHint, next, restart, summary,
} from "../engine/state.js";

const content = JSON.parse(readFileSync(new URL("../data/rounds.json", import.meta.url)));
const simulate = (s) => (placement) => simulator.run(content.topology, s.defs[s.roundIndex], placement);
const go = (s) => run(s, simulate(s));

/** A fresh session: it opens straight on round 1, with no page to read first. */
// These tests play the four rounds they were written for; the session takes any list of rounds.
const four = ["link-up", "two-way", "save", "loop-save"].map((id) => content.rounds.find((r) => r.id === id));
const started = (rounds = four) => createSession(rounds);
const place = (s, cardId, slotId) => { selectCard(s, cardId); return selectSlot(s, slotId); };
const solveRound1 = (s) => { place(s, "int-g01", "line-1"); place(s, "no-shut", "line-2"); return go(s); };
const failRound1 = (s) => { place(s, "no-shut", "line-1"); place(s, "int-g01", "line-2"); return go(s); };
const snapshot = (s) => JSON.stringify({ ...s, defs: undefined });

// ---- User Story 1 ----------------------------------------------------------------------------

test("a fresh session opens straight on round 1, ready to play (AC1)", () => {
  const s = createSession(four);
  assert.deepEqual([s.view, s.roundIndex, s.showing, s.playing], ["round", 0, "start", false]);
  assert.equal(selectCard(s, "int-g01").type, "selected");
});

test("selecting a card changes selectedCard only", () => {
  const s = started();
  failRound1(s);
  endPlayback(s);
  selectSlot(s, "line-1"); // return a card so there is one to select
  go(s); // empty slot: nothing counted, showing stays as the card change left it
  s.showing = "last-run"; // pretend the panels still show a Run
  const before = snapshot(s);
  assert.equal(selectCard(s, "no-shut").type, "selected");
  assert.equal(s.selectedCard, "no-shut");
  s.selectedCard = null;
  assert.equal(snapshot(s), before);
});

test("place, swap and return a card", () => {
  const s = started();
  assert.equal(place(s, "int-g01", "line-1").type, "placed");
  assert.deepEqual(s.placement, { "line-1": "int-g01" });
  assert.equal(s.selectedCard, null);

  const swap = place(s, "no-shut", "line-1");
  assert.deepEqual([swap.type, swap.card, swap.returned], ["swapped", "no-shut", "int-g01"]);
  assert.deepEqual(s.placement, { "line-1": "no-shut" });

  const back = selectSlot(s, "line-1");
  assert.deepEqual([back.type, back.card], ["returned", "no-shut"]);
  assert.deepEqual(s.placement, {});
  assert.equal(selectSlot(s, "line-1").type, "nothing-to-return");
});

test("a card of the wrong type is refused and nothing else changes", () => {
  const s = createSession(four.slice(1)); // "two-way" has device and config-line slots
  selectCard(s, "r1");
  const refused = selectSlot(s, "route");
  assert.deepEqual([refused.type, refused.slotType], ["wrong-type", "configLine"]);
  assert.deepEqual(s.placement, {});
  assert.equal(s.selectedCard, "r1");
});

test("Run with an empty slot names the slot and counts nothing (AC4)", () => {
  const s = started();
  place(s, "int-g01", "line-1");
  const r = go(s);
  assert.deepEqual([r.type, r.slots], ["empty-slots", ["line-2"]]);
  assert.equal(s.rounds[0].runs, 0);
  assert.equal(s.rounds[0].solved, false);
  assert.equal(s.playing, false);
});

test("a full Run adds one and applies its outcome when Run is pressed (FR-011a)", () => {
  const s = started();
  const r = failRound1(s);
  assert.equal(r.type, "ran");
  // Everything is already recorded while the playback has not even begun.
  assert.equal(s.playing, true);
  assert.equal(s.rounds[0].runs, 1);
  assert.equal(s.lastResult.status, "unsolved");
  assert.equal(s.showing, "last-run");
});

test("a failed Run keeps the cards and the round stays playable (FR-023)", () => {
  const s = started();
  failRound1(s);
  endPlayback(s);
  assert.deepEqual(s.placement, { "line-1": "no-shut", "line-2": "int-g01" });
  assert.equal(s.rounds[0].solved, false);
  assert.equal(go(s).type, "ran");
  assert.equal(s.rounds[0].runs, 2);
});

test("place, return or swap after a failed Run shows the starting state again (FR-019a)", () => {
  const s = started();
  failRound1(s);
  endPlayback(s);
  assert.equal(s.showing, "last-run");
  selectSlot(s, "line-1"); // return
  assert.equal(s.showing, "start");
  assert.equal(s.lastResult.status, "unsolved"); // the last Run's result is kept for the log and trace
});

test("Run during playback is a replay that counts nothing, for a failed Run (FR-011b)", () => {
  const s = started();
  failRound1(s);
  const before = snapshot(s);
  assert.equal(go(s).type, "replay");
  assert.equal(snapshot(s), before);
});

test("a card change during playback ends it and keeps the count (FR-011b)", () => {
  const s = started();
  failRound1(s);
  selectSlot(s, "line-2");
  assert.equal(s.playing, false);
  assert.equal(s.rounds[0].runs, 1);
});

test("a solving Run completes once, locks the cards, replays during playback, then refuses (FR-022, FR-022a)", () => {
  const s = started();
  assert.equal(solveRound1(s).solved, true);
  assert.deepEqual([s.rounds[0].solved, s.rounds[0].firstRun, s.rounds[0].runs], [true, true, 1]);

  // During its playback a press only replays.
  const before = snapshot(s);
  assert.equal(go(s).type, "replay");
  assert.equal(snapshot(s), before);

  // Cards are locked from the moment the round is solved, playback or not.
  assert.equal(selectSlot(s, "line-1").type, "locked");
  assert.equal(selectCard(s, "int-g00").type, "locked");

  // Once playback has ended a further Run is refused, whatever the button says.
  endPlayback(s);
  assert.equal(go(s).type, "refused");
  assert.equal(snapshot(s), snapshot({ ...JSON.parse(before), playing: false, defs: undefined }));
  assert.equal(s.rounds[0].runs, 1);
});

test("the placement that solved a round is kept for the summary", () => {
  const s = started();
  assert.equal(summary(s)[0].solution, null);
  failRound1(s); endPlayback(s);
  assert.equal(summary(s)[0].solution, null); // a failed Run is not a solution
  selectSlot(s, "line-1"); selectSlot(s, "line-2");
  solveRound1(s);
  next(s);
  assert.deepEqual(summary(s)[0].solution, { "line-1": "int-g01", "line-2": "no-shut" });
  assert.deepEqual(s.placement, {}); // the next round starts empty; the solution is a copy
});

test("a round solved on a later Run earns no first-run mark", () => {
  const s = started();
  failRound1(s);
  endPlayback(s);
  selectSlot(s, "line-1");
  selectSlot(s, "line-2");
  solveRound1(s);
  assert.deepEqual([s.rounds[0].solved, s.rounds[0].firstRun, s.rounds[0].runs], [true, false, 2]);
});

test("Next is refused until the round is solved, then opens the next round (FR-005)", () => {
  const s = started();
  assert.equal(next(s).type, "refused");
  solveRound1(s);
  assert.equal(next(s).type, "next-round"); // allowed during playback: the player never waits
  assert.deepEqual([s.view, s.roundIndex, s.playing, s.showing], ["round", 1, false, "start"]);
  assert.deepEqual(s.placement, {});
  assert.equal(s.lastResult, null);
});

// ---- User Story 2 ----------------------------------------------------------------------------

test("the hint is recorded once and changes neither runs nor completion (AC6)", () => {
  const s = started();
  assert.equal(openHint(s).first, true);
  assert.equal(openHint(s).first, false);
  assert.deepEqual([s.rounds[0].hintUsed, s.rounds[0].runs, s.rounds[0].solved], [true, 0, false]);
});

test("a round solved on Run 1 after the hint still earns the first-run mark (FR-025)", () => {
  const s = started();
  openHint(s);
  solveRound1(s);
  assert.deepEqual([s.rounds[0].firstRun, s.rounds[0].hintUsed], [true, true]);
});

test("Reset routers shows the starting state and touches nothing else (FR-019b)", () => {
  const s = started();
  assert.equal(resetRouters(s).type, "nothing-to-reset");

  failRound1(s);
  const before = JSON.parse(snapshot(s));
  assert.equal(resetRouters(s).type, "reset"); // during playback: ends it
  assert.deepEqual(JSON.parse(snapshot(s)), { ...before, showing: "start", playing: false });
  assert.equal(resetRouters(s).type, "nothing-to-reset");

  // The Run that follows starts from the starting state and gives the same result (FR-010).
  const again = go(s);
  assert.deepEqual(again.result, before.lastResult);
});

test("Reset routers is refused once the round is solved", () => {
  const s = started();
  solveRound1(s);
  endPlayback(s);
  assert.equal(resetRouters(s).type, "locked");
  assert.equal(s.showing, "last-run");
});

test("Next after the last round in play opens the summary (AC8)", () => {
  const s = started();
  openHint(s);
  failRound1(s); endPlayback(s);
  selectSlot(s, "line-1"); selectSlot(s, "line-2");
  solveRound1(s); next(s);

  place(s, "r2", "device"); place(s, "route-to-a", "route"); go(s); next(s);
  place(s, "save", "after-config"); go(s); next(s);
  place(s, "save", "in-loop"); place(s, "print", "after-loop"); go(s);
  assert.equal(next(s).type, "summary");
  assert.equal(s.view, "summary");

  assert.deepEqual(summary(s).map(({ runs, hintUsed, firstRun }) => [runs, hintUsed, firstRun]), [
    [2, true, false],
    [1, false, true],
    [1, false, true],
    [1, false, true],
  ]);
});

test("with round 4 out of play the summary follows round 3", () => {
  const s = started(four.slice(0, 3));
  solveRound1(s); next(s);
  place(s, "r2", "device"); place(s, "route-to-a", "route"); go(s); next(s);
  place(s, "save", "after-config"); go(s);
  assert.equal(next(s).type, "summary");
  assert.equal(summary(s).length, 3);
});

test("a confirmed Restart gives a fresh session on round 1 (AC9)", () => {
  const s = started();
  openHint(s);
  failRound1(s);
  const fresh = restart(s);
  assert.equal(snapshot(fresh), snapshot(createSession(four)));
  assert.deepEqual([fresh.view, fresh.roundIndex], ["round", 0]);
  // Cancelling a restart calls no transition, so there is nothing to test beyond `s` being untouched.
  assert.equal(s.rounds[0].runs, 1);
});
