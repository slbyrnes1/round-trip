// Load content → validate → start; wire the controls to the state module and the playback.
// The state module decides counting and completion; the simulator decides every outcome.
// Nothing here disables a control because something is playing (constitution VIII).

import { validate, cardText, realScript } from "./engine/content.js";
import * as simulator from "./engine/simulator.js";
import * as state from "./engine/state.js";
import * as feedback from "./engine/feedback.js";
import * as view from "./ui/render.js";
import * as diagram from "./ui/diagram.js";
import { walkRun, showRun, loopPing, stillPing, reducedMotion, newToken, pace, SLOW_RATE } from "./ui/playback.js";

const $ = (id) => document.getElementById(id);
const VIEWS = ["loading", "error", "round", "summary"];
const LABELS = { start: "Starting state", run: "After your last run" };

let content;
let s; // the session
let token = null; // the walk now on screen: a Run's playback or the repeating ping
let takeawayText = ""; // the script shown on the summary, for the Copy button

const round = () => s.defs[s.roundIndex];
const progress = () => s.rounds[s.roundIndex];
const simulate = (placement) => simulator.run(content.topology, round(), placement);

function showView(name) {
  for (const v of VIEWS) $(`view-${v}`).hidden = v !== name;
}

const setStatus = (text) => { $("status").className = ""; $("status").textContent = text; };
const setStateLabel = (text) => document.querySelectorAll(".state-label").forEach((el) => { el.textContent = text; });
// Written only when it changes, so a repeat of the ping announces nothing (FR-012b).
const setCaption = (text) => { if ($("ping-caption").textContent !== text) $("ping-caption").textContent = text; };

// ---- what the diagram and panels show ----------------------------------------------------------

const stage = {
  moveDot: diagram.moveDot,
  hideDot: diagram.hideDot,
  mark: diagram.mark,
  clearMarks: diagram.clearMarks,
  atRouter: (router, route, leg, destination) => view.showRouteUsed($("panels"), router, route, leg, destination),
  leaveRouter: () => view.clearRouteUsed($("panels")),
};

function stopMotion() {
  if (token) token.cancelled = true;
  token = null;
  diagram.hideDot();
  diagram.clearMarks();
  view.clearRouteUsed($("panels"));
  view.markLine($("script"), null);
}

function showState(views, label, changed = []) {
  view.renderPanels($("panels"), views, changed);
  diagram.setLink(views, $("link-text"));
  setStateLabel(label);
}

/** Keep a ping in motion against the state now shown; a still marker with reduced motion. */
function repeatPing(ping, detail) {
  if (reducedMotion()) return stillPing(ping, stage);
  token = newToken();
  loopPing(ping, stage, token, detail);
}

/** The goal lamps and the hosts' faces follow the ping for the state shown. */
function showGoal(ping) {
  view.renderGoal($("lamp-request"), $("lamp-reply"), ping);
  if (ping) diagram.setMood(ping);
}

function showStart() {
  stopMotion();
  showState(simulator.startView(content.topology, round()), LABELS.start);
  const ping = simulator.openingPing(content.topology, round());
  showGoal(ping);
  setCaption(feedback.pingSummary(ping));
  repeatPing(ping, false); // a plain dot: where it stops, not why (FR-003)
}

function showLastRun() {
  stopMotion();
  const result = s.lastResult;
  showState(result.finalState, LABELS.run);
  // The result lands on the board: a bubble on the router where the ping stopped, saying why.
  const why = feedback.explanation(result, content);
  if (why.stop) view.markStop($("panels"), why.stop);
  const ping = result.pings.at(-1); // in rounds 3 and 4, the ping after the reload (FR-013)
  showGoal(ping);
  setCaption(`${result.reload ? "After the reload: " : ""}${feedback.pingSummary(ping)}`);
  repeatPing(ping, true);
}

// ---- Pause and Slow (FR-012c) ------------------------------------------------------------------

/** Each button says what pressing it will do. Both act on the playback and on the repeating ping. */
function setPace(change) {
  Object.assign(pace, change);
  diagram.setPace(pace);
  $("btn-pause").textContent = pace.paused ? "Resume" : "Pause";
  $("btn-slow").textContent = pace.rate === 1 ? "Slow" : "Normal speed";
}

// ---- a Run's playback --------------------------------------------------------------------------

/** Empty the log, trace and explanation. `waiting` shows one line in their place until a Run fills them. */
function clearOutput(waiting = true) {
  $("output").classList.toggle("empty", waiting);
  $("log").innerHTML = "";
  $("trace").innerHTML = "";
  $("feedback").innerHTML = "";
}

function hooksFor(result) {
  const log = feedback.logLines(result, content);
  const blocks = feedback.traceBlocks(result);
  return {
    step(i) {
      view.markLine($("script"), log[i].path);
      showState(result.steps[i].state, LABELS.run, log[i].changed);
      view.appendLog($("log"), log[i]);
      if (log[i].outcome === "crashed") view.markCrash($("script"), log[i].path);
    },
    endSteps() { view.markLine($("script"), null); },
    reload() {
      showState(result.finalState, LABELS.run);
      view.appendLog($("log"), { outcome: "reload", text: feedback.reloadSentence(result), short: feedback.reloadSentence(result) });
    },
    trace(k) { view.appendTrace($("trace"), blocks[k]); showGoal(result.pings[k]); },
    finish() { view.renderFeedback($("feedback"), feedback.explanation(result, content)); },
  };
}

/** Play the last Run from the beginning. The Run is already counted and its outcome applied. */
function startPlayback() {
  const result = s.lastResult;
  stopMotion();
  clearOutput(false);
  showState(simulator.startView(content.topology, round()), LABELS.run); // every Run starts here (FR-010)
  setCaption("Running your script…");
  showGoal(null);
  refresh();
  if (reducedMotion()) {
    showRun(result, hooksFor(result));
    return finishPlayback();
  }
  token = newToken();
  const mine = token;
  walkRun(result, hooksFor(result), stage, mine).then((completed) => { if (completed && token === mine) finishPlayback(); });
}

function finishPlayback() {
  // Move focus only if it is still on Run or Skip; focus the player moved elsewhere is left alone.
  const follow = [$("btn-run"), $("btn-skip")].includes(document.activeElement);
  state.endPlayback(s);
  showLastRun();
  refresh();
  view.renderBanner($("status"), feedback.explanation(s.lastResult, content)); // the verdict, beside Run and Next
  if (follow) (progress().solved ? $("btn-next") : $("btn-run")).focus();
}

function skip() {
  if (!s.playing) return;
  stopMotion();
  clearOutput(false);
  showRun(s.lastResult, hooksFor(s.lastResult));
  finishPlayback();
}

/** Back on the round after a cancelled restart: carry on from the session's state. */
function resume() {
  if (s.playing) startPlayback(); // from the beginning (FR-011b)
  else if (s.showing === "start") showStart();
  else showLastRun();
}

// ---- rendering the round -----------------------------------------------------------------------

/** Redraw the tray, script and buttons from the session. Keeps focus on the same card or slot. */
function refresh(focus) {
  const p = progress();
  const selected = round().tray.find((c) => c.id === s.selectedCard);
  view.renderTray($("tray"), round(), s.placement, { locked: p.solved, selected: s.selectedCard });
  view.renderScript($("script"), round(), content.topology, content.callNotes, s.placement,
    { locked: p.solved, targetType: selected?.type });
  // Redrawing the script wipes the mark on a crashed line; put it back while that Run is still shown.
  const crash = s.showing === "last-run" && !s.playing && s.lastResult?.crashed ? s.lastResult.steps.at(-1) : null;
  if (crash) view.markCrash($("script"), crash.path);
  $("runs").textContent = `Runs: ${p.runs}`;
  $("btn-run").disabled = p.solved && !s.playing; // disabled once a solving Run's playback ends (FR-022)
  $("btn-skip").hidden = !s.playing;
  $("btn-reset").disabled = p.solved;
  $("btn-next").disabled = !p.solved;
  // The ticket is resolved, and the track ticks over, once a solving Run has finished playing.
  const resolved = p.solved && !s.playing;
  view.renderTicket({ tag: $("ticket-tag"), text: $("ticket-text"), status: $("ticket-status"), face: $("ticket-face") },
    round(), s.roundIndex, resolved);
  showTrack();
  showStep();
  if (focus) document.querySelector(focus)?.focus();
}

/** Light the step the player is on: pick a card, put it in a blank, run. Text says it too. */
function showStep() {
  const filled = simulator.slotsOf(round()).every((x) => x.slot in s.placement);
  const now = progress().solved ? 0 : s.selectedCard ? 2 : filled ? 3 : 1;
  for (const li of $("steps").children) {
    const on = Number(li.dataset.step) === now;
    li.classList.toggle("now", on);
    if (on) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
  }
  $("btn-run").classList.toggle("ready", now === 3);
}

function showTrack() {
  const rows = state.summary(s).map((r, i) => ({ firstRun: r.firstRun, done: r.solved && !(i === s.roundIndex && s.playing && s.view === "round") }));
  view.renderTrack($("track"), rows, s.view === "summary" ? -1 : s.roundIndex);
}

/** A round opens straight on the play screen: its idea above the script, the rest one action away. */
function enterRound() {
  view.renderIntro($("round-title"), $("round-idea"), $("about-body"), round(), s.roundIndex, s.defs.length, content.sources);
  $("about").open = false;
  clearOutput();
  setStatus("Pick a card, then click a blank. Or drag it there.");
  $("hint").hidden = true;
  $("hint-text").textContent = round().hint;
  showView("round");
  refresh();
  showStart();
  $("round-title").focus();
}

function showSummary() {
  stopMotion();
  showTrack();
  const rows = state.summary(s);
  view.renderSummary($("summary-body"), rows);
  // Hand back the script from the last round: what the player wrote, as code they can run.
  const last = s.defs.at(-1);
  takeawayText = "";
  if (rows.at(-1).solution) {
    const lines = realScript(last, content.topology, content.callNotes, rows.at(-1).solution);
    takeawayText = lines.map((l) => l.text).join("\n") + "\n";
    view.renderTakeaway($("takeaway-code"), lines);
  }
  $("takeaway").hidden = !takeawayText;
  $("copy-status").textContent = "";
  showView("summary");
  $("summary-title").focus();
}

// ---- card and slot actions (FR-006 to FR-008a) -------------------------------------------------

const cardName = (id) => `\`${cardText(round().tray.find((c) => c.id === id))}\``;
const slotName = (id) => {
  const slots = simulator.slotsOf(round());
  const i = slots.findIndex((x) => x.slot === id);
  return `slot ${i + 1} (${slots[i].label})`;
};
const animate = (selector, name) => document.querySelector(selector)?.classList.add(name);

function onCard(id) {
  const event = state.selectCard(s, id);
  if (event.type === "selected") setStatus(`Selected ${cardName(id)}. Choose a slot.`);
  else if (event.type === "deselected") setStatus(`${cardName(id)} is no longer selected.`);
  else return;
  refresh(`[data-card="${id}"]`);
}

function onSlot(id) {
  const wasShowingRun = s.showing === "last-run";
  const event = state.selectSlot(s, id);
  const slotSelector = `[data-slot="${id}"]`;
  if (event.type === "wrong-type") {
    return setStatus(`${cardName(s.selectedCard)} does not fit there: that slot takes a ${view.TYPE_NAMES[event.slotType]} card. Nothing changed.`);
  }
  if (event.type === "nothing-to-return") return setStatus(`${slotName(id)} is empty. Select a card first, then this slot.`);
  if (!["placed", "swapped", "returned"].includes(event.type)) return;

  if (event.type === "placed") setStatus(`${cardName(event.card)} placed in ${slotName(id)}.`);
  if (event.type === "swapped") setStatus(`${cardName(event.card)} placed in ${slotName(id)}; ${cardName(event.returned)} returned to the tray.`);
  if (event.type === "returned") setStatus(`${cardName(event.card)} returned to the tray from ${slotName(id)}.`);
  refresh(slotSelector);
  if (event.type !== "returned") {
    animate(slotSelector, "settle");
    document.querySelector(slotSelector)?.closest(".line")?.classList.add("pulse");
  }
  const back = event.type === "returned" ? event.card : event.returned;
  if (back) animate(`[data-card="${back}"]`, "drop-back");
  // A card change after a Run puts the panels, the caption and the ping back on the starting state (FR-019a).
  if (wasShowingRun) showStart();
}

// ---- controls ----------------------------------------------------------------------------------

function onRun() {
  const event = state.run(s, simulate);
  if (event.type === "empty-slots") {
    const names = event.slots.map(slotName);
    return setStatus(`${names.join(" and ").replace(/^s/, "S")} ${names.length > 1 ? "are" : "is"} empty. Place a card there, then press Run. Nothing was counted.`);
  }
  if (event.type === "ran" || event.type === "replay") {
    const what = event.type === "ran" ? `Run ${progress().runs} counted` : "Replaying; nothing more is counted";
    setStatus(pace.paused && !reducedMotion() ? `${what}. Paused: press Resume or Skip to result.` : `${what}.`);
    startPlayback();
  }
}

function onReset() {
  const event = state.resetRouters(s);
  const focusLost = document.activeElement === $("btn-skip");
  if (event.type === "reset") {
    showStart();
    refresh();
    setStatus("Routers shown in their starting state. Cards and run count unchanged.");
    if (focusLost) $("btn-run").focus();
  } else if (event.type === "nothing-to-reset") {
    setStatus("The routers are already shown in their starting state.");
  }
}

function onHint() {
  state.openHint(s); // playback, if any, carries on
  $("hint").hidden = false;
  $("hint-title").focus();
}

function onNext() {
  const event = state.next(s);
  if (event.type === "next-round") enterRound();
  if (event.type === "summary") showSummary();
}

function wire() {
  $("tray").addEventListener("click", (e) => { const b = e.target.closest("[data-card]"); if (b) onCard(b.dataset.card); });
  $("script").addEventListener("click", (e) => { const b = e.target.closest("[data-slot]"); if (b) onSlot(b.dataset.slot); });
  // Dragging is the same action as select-then-select: picking up a card selects it, dropping it
  // on a blank selects that slot. The tray is not redrawn mid-drag, which would cancel the drag.
  $("tray").addEventListener("dragstart", (e) => {
    const b = e.target.closest("[data-card]");
    if (!b) return;
    if (s.selectedCard !== b.dataset.card && state.selectCard(s, b.dataset.card).type !== "selected") return e.preventDefault();
    e.dataTransfer.setData("text/plain", b.dataset.card);
    e.dataTransfer.effectAllowed = "move";
    b.classList.add("selected");
    const type = round().tray.find((c) => c.id === b.dataset.card).type;
    document.querySelectorAll(`.slot.${type}`).forEach((el) => el.classList.add("target"));
    setStatus(`Selected ${cardName(b.dataset.card)}. Drop it on a blank.`);
    showStep();
  });
  $("tray").addEventListener("dragend", () => refresh());
  $("script").addEventListener("dragover", (e) => { if (s.selectedCard && e.target.closest("[data-slot]")) e.preventDefault(); });
  $("script").addEventListener("drop", (e) => {
    const b = e.target.closest("[data-slot]");
    if (!b) return;
    e.preventDefault();
    onSlot(b.dataset.slot);
  });
  $("btn-run").addEventListener("click", onRun);
  $("btn-skip").addEventListener("click", skip);
  $("btn-reset").addEventListener("click", onReset);
  $("btn-hint").addEventListener("click", onHint);
  $("btn-hint-close").addEventListener("click", () => { $("hint").hidden = true; $("btn-hint").focus(); });
  $("btn-next").addEventListener("click", onNext);

  // Router details: the button on a card pins them; pointing at the router in the diagram shows them.
  $("panels").addEventListener("click", (e) => { const b = e.target.closest("[data-more]"); if (b) view.toggleDetails($("panels"), b.dataset.more); });
  for (const node of $("diagram").querySelectorAll("[data-node]")) {
    node.addEventListener("mouseenter", () => view.peek($("panels"), node.dataset.node, true));
    node.addEventListener("mouseleave", () => view.peek($("panels"), node.dataset.node, false));
  }

  $("btn-pause").addEventListener("click", () => {
    setPace({ paused: !pace.paused });
    setStatus(pace.paused ? "Paused. Every other control still works." : "Resumed.");
  });
  $("btn-slow").addEventListener("click", () => {
    setPace({ rate: pace.rate === 1 ? SLOW_RATE : 1 });
    setStatus(pace.rate === 1 ? "Normal speed." : "Slow motion.");
  });
  $("motion-controls").hidden = reducedMotion(); // with reduced motion nothing moves, so there is nothing to pause

  $("btn-copy").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(takeawayText);
      $("copy-status").textContent = "Copied.";
    } catch { // no clipboard access: select the text so one keystroke copies it
      const range = document.createRange();
      range.selectNodeContents($("takeaway-code"));
      getSelection().removeAllRanges();
      getSelection().addRange(range);
      $("copy-status").textContent = "The script is selected. Press Ctrl+C or Cmd+C to copy it.";
    }
  });

  // Restart always asks first. The session changes only on Confirm, so Cancel has nothing to undo.
  const dialog = $("confirm-restart");
  $("btn-restart").addEventListener("click", () => {
    if (s.view === "round") stopMotion();
    dialog.returnValue = "";
    dialog.showModal();
    $("confirm-title").focus();
  });
  $("btn-confirm").addEventListener("click", () => dialog.close("confirm"));
  $("btn-cancel").addEventListener("click", () => dialog.close(""));
  dialog.addEventListener("close", () => { // also reached by Escape, which cancels
    if (dialog.returnValue === "confirm") {
      s = state.restart(s);
      return enterRound();
    }
    if (s.view === "round") resume();
    $("btn-restart").focus();
  });
}

// ---- start -------------------------------------------------------------------------------------

async function start() {
  let errors;
  try {
    content = await (await fetch("data/rounds.json")).json();
    errors = validate(content);
  } catch (e) {
    errors = [{ where: "data/rounds.json", message: `could not be loaded (${e.message}). Serve the folder over HTTP; opening index.html from disk is not supported.` }];
  }
  if (errors.length) { // nothing is graded and no progress is given (FR-033)
    view.renderErrors($("error-list"), errors);
    $("btn-restart").hidden = true;
    showView("error");
    return $("error-title").focus();
  }
  s = state.createSession(content.rounds.filter((r) => r.inPlay !== false));
  diagram.drawDiagram($("diagram"), content.topology);
  wire();
  enterRound();
}

start();
