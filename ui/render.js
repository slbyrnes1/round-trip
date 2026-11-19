// Views: the round (intro, script, tray, state panels, log, trace, feedback), summary and content error.
// Rendering only. It never decides whether a placement is correct.

import { slotsOf } from "../engine/simulator.js";
import { cardText, scriptLines } from "../engine/content.js";

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
/** Escape, then show `backticked` spans as code. */
const rich = (s) => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>");
const isSlot = (v) => v !== null && typeof v === "object" && "slot" in v;

export const TYPE_NAMES = { device: "router", configLine: "configuration line", statement: "statement" };

// ---- round intro, summary, error ---------------------------------------------------------------

/** hostA's little face. Its mood is set with a class: "happy" once its ping comes back, else "sad". */
export const FACE = `<svg viewBox="0 0 64 56"><rect class="screen" x="8" y="4" width="48" height="34" rx="5"/>
  <path class="base" d="M2 42h60l-5 8H7z"/><circle class="eye" cx="23" cy="18" r="2.6"/><circle class="eye" cx="41" cy="18" r="2.6"/>
  <path class="mouth smile" d="M24 26q8 7 16 0"/><path class="mouth frown" d="M24 31q8 -7 16 0"/></svg>`;

/** The round as a ticket from hostA: open with its complaint, resolved with its thanks. */
export function renderTicket(els, round, index, resolved) {
  els.tag.textContent = `Ticket #${index + 1}`;
  els.text.textContent = resolved ? round.ticket.thanks : round.ticket.body;
  els.status.textContent = resolved ? "Resolved" : "Open";
  els.status.className = `stamp ${resolved ? "resolved" : "open"}`;
  els.face.innerHTML = FACE;
  els.face.className = `avatar ${resolved ? "happy" : "sad"}`;
}

/** The goal as two lamps, lit from the simulator's ping for the state shown. `ping` null = not known yet. */
export function renderGoal(requestEl, replyEl, ping) {
  const lamp = (el, arrow, what, on) => {
    el.className = `lamp ${on === null ? "pending" : on ? "on" : "off"}`;
    el.innerHTML = `<span class="bulb" aria-hidden="true"></span>${arrow} ${what}: <strong>${on === null ? "…" : on ? "yes" : "not yet"}</strong>`;
  };
  lamp(requestEl, "→", "request to hostB", ping ? ping.request.delivered : null);
  lamp(replyEl, "←", "reply to hostA", ping ? ping.reply?.delivered === true : null);
}

/** The level track: one node per round in play. `rows` come from the session summary. */
export function renderTrack(el, rows, current) {
  el.innerHTML = rows.map((r, i) => {
    const state = r.done ? "done" : i === current ? "current" : "todo";
    const says = r.done ? `solved${r.firstRun ? " on the first run" : ""}` : i === current ? "in play" : "not started";
    return `<li class="${state}${r.firstRun && r.done ? " star" : ""}" aria-label="Round ${i + 1}: ${says}"${i === current ? ' aria-current="step"' : ""}>
      <span class="node" aria-hidden="true">${r.done ? (r.firstRun ? "★" : "✓") : i + 1}</span></li>`;
  }).join("");
}

/** The round's one idea, always on screen, and the rest of its notes one action away. */
export function renderIntro(titleEl, ideaEl, aboutEl, round, index, total, sources) {
  titleEl.textContent = `Round ${index + 1} of ${total}: ${round.title}`;
  const b = round.briefing;
  ideaEl.innerHTML = rich(b.idea);
  const cited = sources.filter((src) => b.sourceIds.includes(src.id));
  aboutEl.innerHTML = `
    <h3>The idea, in full</h3>
    <ul>${b.terms.map((t) => `<li>${rich(t)}</li>`).join("")}</ul>
    <h3>Worked example</h3>
    <p>${rich(b.workedExample)}</p>
    <h3>What this model leaves out</h3>
    <p>${rich(b.limits)}</p>
    ${cited.length ? `<h3>Sources</h3><ul>${cited.map((src) =>
      `<li><a href="${esc(src.url)}" target="_blank" rel="noopener">${esc(src.title)}</a>, ${esc(src.section)}${src.kind === "community" ? " (community source)" : ""}</li>`).join("")}</ul>` : ""}`;
}

export function renderSummary(el, rows) {
  el.innerHTML = `<table>
    <thead><tr><th scope="col">Round</th><th scope="col">Runs</th><th scope="col">Hint</th><th scope="col">First run</th></tr></thead>
    <tbody>${rows.map((r, i) => `<tr>
      <th scope="row">${i + 1}. ${esc(r.title)}</th>
      <td>${r.runs}</td>
      <td>${r.hintUsed ? "Used" : "Not used"}</td>
      <td>${r.firstRun ? "★ Solved on the first run" : "—"}</td>
    </tr>`).join("")}</tbody></table>`;
}

/** The assembled script as text, with the lines the game left out marked. */
export function renderTakeaway(el, lines) {
  el.innerHTML = lines.map((l) => `<span class="${l.added ? "added" : ""}">${esc(l.text)}</span>`).join("\n");
}

export function renderErrors(el, errors) {
  el.innerHTML = errors.map((e) => `<li><strong>${esc(e.where)}:</strong> ${esc(e.message)}</li>`).join("");
}

// ---- script and tray ---------------------------------------------------------------------------

/** Render the script. Slots are buttons; `targetType` makes slots of that type glow. */
export function renderScript(el, round, topology, notes, placement, { locked, targetType }) {
  const cards = Object.fromEntries(round.tray.map((c) => [c.id, c]));
  const numbers = Object.fromEntries(slotsOf(round).map((s, i) => [s.slot, i + 1]));
  const slotButton = (slot) => {
    const card = cards[placement[slot.slot]];
    const name = `Slot ${numbers[slot.slot]}: ${slot.label}`;
    return `<button type="button" class="slot ${card ? "filled" : "empty"} ${slot.type}${slot.type === targetType ? " target" : ""}"
      data-slot="${esc(slot.slot)}" aria-label="${esc(`${name}, ${card ? cardText(card) : "empty"}`)}"${locked ? " disabled" : ""}>${
      card ? esc(cardText(card)) : `<span class="plus" aria-hidden="true">＋</span> ${esc(TYPE_NAMES[slot.type])} card`}</button>`;
  };
  el.innerHTML = scriptLines(round, topology, notes, (slot) => cards[placement[slot]]).map((line) =>
    `<div class="line"${line.path !== undefined ? ` data-path="${line.path}"` : ""} style="--indent:${line.indent ?? 0}">${
      line.parts.map((p) => (isSlot(p) ? slotButton(p) : `<span>${esc(p)}</span>`)).join("")
    }${line.note ? `<span class="note">  ${esc(line.note)}</span>` : ""}<span class="running-tag" hidden> ← running</span></div>`).join("");
}

/** Mark the running line in text as well as colour. A config line inside a per-router list marks its call. */
export function markLine(el, path) {
  el.querySelectorAll(".line.running").forEach((line) => {
    line.classList.remove("running");
    line.querySelector(".running-tag").hidden = true;
  });
  if (!path) return;
  for (let p = [...path]; p.length; p = p.slice(0, -1)) {
    const line = el.querySelector(`[data-path="${p.join(".")}"]`);
    if (line) {
      line.classList.add("running");
      line.querySelector(".running-tag").hidden = false;
      line.scrollIntoView?.({ block: "nearest" });
      return;
    }
  }
}

/** Mark the line where Python stopped the script (rule 9). Stays until the script is redrawn. */
export function markCrash(el, path) {
  for (let p = [...path]; p.length; p = p.slice(0, -1)) {
    const line = el.querySelector(`[data-path="${p.join(".")}"]`);
    if (!line) continue;
    line.classList.add("crashed");
    line.insertAdjacentHTML("beforeend", '<span class="crash-tag"> ✕ NameError: the script stopped here</span>');
    return;
  }
}

export function renderTray(el, round, placement, { locked, selected }) {
  const placed = new Set(Object.values(placement));
  const cards = round.tray.filter((c) => !placed.has(c.id));
  el.innerHTML = cards.length
    ? cards.map((c) => `<button type="button" draggable="true" class="card ${c.type}${c.id === selected ? " selected" : ""}" data-card="${esc(c.id)}"
        aria-pressed="${c.id === selected}" aria-label="${esc(cardText(c) + (c.id === selected ? ", selected" : ""))}"${locked ? " disabled" : ""}>
        <span class="type">${esc(TYPE_NAMES[c.type])}</span><span class="text">${esc(cardText(c))}</span></button>`).join("")
    : '<p class="empty-tray">Every card is placed.</p>';
}

// ---- router state cards (under each router in the diagram) ----------------------------------------

const pinned = new Set(); // routers whose details the player has pinned open; survives re-renders

const maskBits = (dotted) => dotted.split(".").reduce((n, o) => n + Number(o).toString(2).replace(/0/g, "").length, 0);
/** "ip route 10.20.0.0 255.255.255.0 192.0.2.2" → { prefix: "10.20.0.0/24", via: "192.0.2.2" } */
const routeOf = (line) => {
  const [, , network, mask, via] = line.split(" ");
  return { prefix: `${network}/${maskBits(mask)}`, via };
};

/**
 * Both routers' state, as a compact card under each router: link state, the routes it can use,
 * routes that are configured but not installed, and the saved badge. Nothing needed to reason
 * about the round is behind hover; the pop-up adds the raw configuration lines and a legend.
 * `changed` lists the rows the current step changed; each is tagged in text as well as colour.
 */
export function renderPanels(el, views, changed = []) {
  const was = (router, row) => (changed.some((c) => c.router === router && c.row === row) ? " changed" : "");
  const tag = (router, ...rows) => (rows.some((row) => was(router, row)) ? ' <span class="changed-tag">changed</span>' : "");
  el.innerHTML = Object.entries(views).map(([router, v]) => {
    const installed = new Set(v.routingTable.map((e) => e.prefix));
    const waiting = v.runningRoutes.map(routeOf).filter((r) => !installed.has(r.prefix));
    const open = pinned.has(router);
    return `
    <article class="panel${open ? " pinned" : ""}" data-router="${router}" aria-label="${router} state">
      <header>
        <strong class="who">${router}</strong>
        <span class="pill if-${v.linkInterface.replace(/ /g, "-")}${was(router, "interface")}">Gi0/1 ${v.linkInterface}</span>
        <span class="badge ${v.saved ? "saved" : "unsaved"}${was(router, "saved")}">${v.saved ? "saved" : "unsaved changes"}</span>
        <button type="button" class="more" data-more="${router}" aria-expanded="${open}" aria-label="${router} details">details</button>
      </header>
      <ul class="table${was(router, "routingTable")}" aria-label="Routes ${router} can use">${v.routingTable.map((e) =>
        `<li class="chip ${e.via === "connected" ? "connected" : "static"}" data-prefix="${e.prefix}">${e.prefix} <small>${e.via === "connected" ? "connected" : `via ${e.via}`}</small><span class="used-tag"></span></li>`).join("")}${
        waiting.map((r) => `<li class="chip waiting">${r.prefix} <small>not installed</small></li>`).join("")}</ul>${tag(router, "routingTable", "runningRoutes", "interface", "saved")}
      <p class="no-route" hidden></p>
      <div class="pop">
        <h4>Static routes in the running configuration</h4>
        ${v.runningRoutes.length ? `<ul class="config">${v.runningRoutes.map((l) => `<li><code>${esc(l)}</code></li>`).join("")}</ul>` : "<p>none</p>"}
        <h4>Reading this card</h4>
        <p><strong>administratively down</strong>: shut on this router. <strong>down</strong>: the other end is shut. A route is only usable while it is in the routing table. <strong>unsaved changes</strong>: the running configuration differs from the startup configuration, so a reload would undo them.</p>
      </div>
    </article>`;
  }).join("");
}

/** Pin or unpin a router's details (the button on its card). */
export function toggleDetails(el, router) {
  if (pinned.has(router)) pinned.delete(router); else pinned.add(router);
  const card = el.querySelector(`[data-router="${router}"]`);
  card.classList.toggle("pinned", pinned.has(router));
  card.querySelector(".more").setAttribute("aria-expanded", pinned.has(router));
}

/** Show a router's details while the pointer is over that router in the diagram. */
export function peek(el, router, on) {
  el.querySelector(`[data-router="${router}"]`)?.classList.toggle("peek", on);
}

/** While the dot pauses at a router: highlight the route it used, or say that no route matched. */
export function showRouteUsed(el, router, route, leg, destination) {
  clearRouteUsed(el);
  const panel = el.querySelector(`[data-router="${router}"]`);
  if (!panel) return;
  if (route) {
    const row = panel.querySelector(`[data-prefix="${route.prefix}"]`);
    row?.classList.add("used");
    if (row) row.querySelector(".used-tag").textContent = ` ← ${leg}`;
  } else {
    const none = panel.querySelector(".no-route");
    none.textContent = `no matching route for ${destination}: ${leg} dropped`;
    none.hidden = false;
  }
}

export function clearRouteUsed(el) {
  el.querySelectorAll(".used").forEach((row) => {
    row.classList.remove("used");
    row.querySelector(".used-tag").textContent = "";
  });
  el.querySelectorAll(".no-route").forEach((p) => { p.hidden = true; });
}

// ---- log, trace, feedback ----------------------------------------------------------------------

const MARKS = { applied: "✓", "no-change": "=", rejected: "✗", "read-only": "·", reload: "↻", crashed: "✗" };

/**
 * One step of the transcript. What Netmiko sent is shown as it was sent, prompt and all, and what
 * the router did is a short tag on the last of those lines. A step that sends nothing (logging
 * in, print, a crash, the reload) is a single comment line. The full sentence is the tooltip.
 */
export function appendLog(el, line) {
  const li = document.createElement("li");
  li.className = line.outcome;
  li.title = line.text.replace(/`/g, "");
  const result = `<span class="res"><span aria-hidden="true">${MARKS[line.outcome]}</span> ${rich(line.short ?? line.text)}</span>`;
  const quote = line.quote ? `\n<span class="router-said">${esc(line.quote)}</span>` : "";
  if (line.sent?.length) {
    // The tag belongs to the line that did something: the last one, or the one before a closing `end`.
    const rows = line.sent.map(esc);
    const at = rows.length > 1 && / end$/.test(rows.at(-1)) ? rows.length - 2 : rows.length - 1;
    rows[at] += `  ${result}${quote}`;
    li.innerHTML = `<pre class="sent">${rows.join("\n")}</pre>`;
  } else {
    li.innerHTML = `<pre class="sent note"># ${result}</pre>`;
  }
  el.append(li);
  el.scrollTop = el.scrollHeight;
}

/**
 * One ping as a result sentence and, for each leg, a row of hops: the hosts at the ends and, on
 * each router the packet reached, the route it used or that none matched (FR-012a).
 */
export function appendTrace(el, block) {
  const div = document.createElement("div");
  div.className = "trace-block";
  const leg = (l) => `<ol class="leg ${l.name}" aria-label="${l.name}">
    <li class="who">${l.name}</li>
    ${l.hops.map((h) => `<li class="hop${h.router ? " router" : ""}${h.via === "no route" ? " dropped" : ""}">${esc(h.node)}${
      h.router ? ` <small>${h.via === "connected" ? "connected" : h.via === "no route" ? `✗ no route to ${esc(l.destination)}` : `via ${esc(h.via)}`}</small>` : ""}</li>`).join("")}
    <li class="end ${l.delivered ? "ok" : "bad"}">${l.delivered ? "✓ delivered" : "✗ dropped"}</li></ol>`;
  div.innerHTML = `<p class="summary"><span class="phase">${esc(block.heading)}</span> ${esc(block.summary)}</p>${block.legs.map(leg).join("")}`;
  el.append(div);
}

/**
 * The verdict, shown beside Run and Next when a Run has finished playing. Says it in words as
 * well as colour, and never blames the player.
 */
export function renderBanner(el, why) {
  const solvedText = why.reloaded ? "The ping still works after the reload. Press Next." : "Request and reply delivered. Press Next.";
  const failedText = `${why.crashed ? "Python stopped the script. " : why.workedBefore ? "It worked until the reload. " : ""}Change a card and run again.`;
  el.className = `verdict ${why.solved ? "solved" : "unsolved"}`;
  el.innerHTML = `<span class="icon" aria-hidden="true">${why.solved ? "✓" : "↻"}</span>
    <span><strong>${why.solved ? "Solved!" : "Not solved yet."}</strong> ${why.solved ? solvedText : failedText}</span>`;
}

/** A bubble on the router where the deciding ping stopped, saying why. Redrawn with the cards. */
export function markStop(el, stop) {
  const card = el.querySelector(`[data-router="${stop.router}"]`);
  if (!card) return;
  card.classList.add("stopped");
  card.insertAdjacentHTML("beforeend", `<p class="stop-bubble"><span aria-hidden="true">✗</span> The ping stops here: ${rich(stop.reason)}</p>`);
}

/**
 * Why: one line saying where the traffic stopped, and the rule in a few words. Each rule opens to
 * its full text. What the router did with each line is the Script log, and the hops are the Ping
 * trace, so the panels read in the order FR-015 requires: the router, the traffic, the rule.
 */
export function renderFeedback(el, why) {
  el.innerHTML = `
    ${why.why ? `<p class="cause"><span class="label">Stopped at</span> ${rich(why.why)}</p>` : ""}
    <ul class="rules" aria-label="${why.solved ? "Why it works" : "The rule that explains it"}">${why.rules.map((r) => `<li><details>
      <summary><span class="rule-n">Rule ${r.id}</span> ${rich(r.short)}</summary><p>${rich(r.text)}</p></details></li>`).join("")}</ul>`;
}
