// The session and its transitions (data-model.md "Session state").
// No page, timer or network. Each transition changes the session it is given and returns
// { type, ... } saying what happened, so the page can word a status message.
// Counting and completion are decided here, independently of any button (constitution III).

import { slotsOf } from "./simulator.js";

/** A fresh session on the first round. `rounds` are the rounds in play, in order. */
export function createSession(rounds) {
  return {
    defs: rounds,
    view: "round",
    roundIndex: 0,
    placement: {},
    selectedCard: null,
    playing: false,
    lastResult: null,
    showing: "start",
    rounds: rounds.map(() => ({ runs: 0, hintUsed: false, solved: false, firstRun: false, solution: null })),
  };
}

const def = (s) => s.defs[s.roundIndex];
const progress = (s) => s.rounds[s.roundIndex];
const card = (s, id) => def(s).tray.find((c) => c.id === id);
const slot = (s, id) => slotsOf(def(s)).find((x) => x.slot === id);
const placed = (s, cardId) => Object.values(s.placement).includes(cardId);

// A card change always returns the panels to the starting state and ends any playback (FR-019a, FR-011b).
const cardChanged = (s) => { s.showing = "start"; s.playing = false; };

/** Select a card in the tray, or deselect it. Changes selectedCard only. */
export function selectCard(s, cardId) {
  if (s.view !== "round" || !card(s, cardId) || placed(s, cardId)) return { type: "ignored" };
  if (progress(s).solved) return { type: "locked" };
  s.selectedCard = s.selectedCard === cardId ? null : cardId;
  return { type: s.selectedCard ? "selected" : "deselected", card: cardId };
}

/** Select a slot: place or swap the selected card, or return the slot's card to the tray. */
export function selectSlot(s, slotId) {
  const target = slot(s, slotId);
  if (s.view !== "round" || !target) return { type: "ignored" };
  if (progress(s).solved) return { type: "locked" };
  const current = s.placement[slotId];

  if (s.selectedCard === null) {
    if (current === undefined) return { type: "nothing-to-return", slot: slotId };
    delete s.placement[slotId];
    cardChanged(s);
    return { type: "returned", card: current, slot: slotId };
  }
  const chosen = card(s, s.selectedCard);
  if (chosen.type !== target.type) return { type: "wrong-type", slot: slotId, slotType: target.type };
  s.placement[slotId] = chosen.id;
  s.selectedCard = null;
  cardChanged(s);
  return current === undefined
    ? { type: "placed", card: chosen.id, slot: slotId }
    : { type: "swapped", card: chosen.id, returned: current, slot: slotId };
}

/**
 * Run. `simulate(placement)` returns the simulator's Result.
 * The Run is counted and its outcome applied here, at the moment Run is pressed (FR-011a).
 */
export function run(s, simulate) {
  if (s.view !== "round") return { type: "ignored" };
  if (s.playing) return { type: "replay", result: s.lastResult }; // counts nothing, changes nothing (FR-011b)
  const p = progress(s);
  if (p.solved) return { type: "refused" }; // a second completion is impossible (FR-022)
  const empty = slotsOf(def(s)).filter((x) => !(x.slot in s.placement)).map((x) => x.slot);
  if (empty.length) return { type: "empty-slots", slots: empty };
  const result = simulate({ ...s.placement });
  if (result.status === "invalid-input") return { type: "empty-slots", slots: result.emptySlots };

  p.runs += 1;
  s.lastResult = result;
  s.showing = "last-run";
  s.playing = true;
  s.selectedCard = null;
  if (result.status === "solved") {
    p.solved = true;
    p.firstRun = p.runs === 1;
    p.solution = { ...s.placement }; // the script the player wrote, kept for the summary
  }
  return { type: "ran", result, solved: p.solved };
}

/** Playback finished by itself or by Skip. Presentation only. */
export function endPlayback(s) {
  if (!s.playing) return { type: "ignored" };
  s.playing = false;
  return { type: "playback-ended" };
}

/** Show the starting state again. Touches showing and playing only (FR-019b). */
export function resetRouters(s) {
  if (s.view !== "round") return { type: "ignored" };
  if (progress(s).solved) return { type: "locked" };
  if (s.showing === "start" && !s.playing) return { type: "nothing-to-reset" };
  s.showing = "start";
  s.playing = false;
  return { type: "reset" };
}

/** Open the hint. Recorded once; never changes runs or completion (FR-024). */
export function openHint(s) {
  if (s.view !== "round") return { type: "ignored" };
  const first = !progress(s).hintUsed;
  progress(s).hintUsed = true;
  return { type: "hint", first };
}

/** Next: the following round, or the summary after the last round in play (FR-005). */
export function next(s) {
  if (s.view !== "round" || !progress(s).solved) return { type: "refused" };
  s.playing = false;
  s.placement = {};
  s.selectedCard = null;
  s.lastResult = null;
  s.showing = "start";
  if (s.roundIndex === s.defs.length - 1) {
    s.view = "summary";
    return { type: "summary" };
  }
  s.roundIndex += 1;
  return { type: "next-round" };
}

/** A confirmed Restart: a fresh session. Cancelling a restart calls nothing. */
export function restart(s) {
  return createSession(s.defs);
}

/** One row per round in play, for the summary view (FR-025). */
export function summary(s) {
  return s.defs.map((round, i) => ({
    title: round.title,
    runs: s.rounds[i].runs,
    hintUsed: s.rounds[i].hintUsed,
    firstRun: s.rounds[i].firstRun,
    solved: s.rounds[i].solved,
    solution: s.rounds[i].solution,
  }));
}
