# Implementation Plan: Round Trip — first playable game

**Branch**: `001-round-trip-game` | **Date**: 2026-11-17 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-round-trip-game/spec.md`, with `StarterKit/PLAN.md` as the workshop's planning input. Governed by `.specify/memory/constitution.md` v3.0.0.

**Revised 2026-11-17** after constitution v1.1.0 (Principle VIII) and a second clarification
session: the ping repeats for the whole round, a Reset routers control is added, and Run is
disabled only once a solving Run's playback ends.

**Revised again 2026-11-17** after the first playable build (constitution v2.0.0): the briefing
page is removed, each call carries a note and the log shows what Netmiko sent, the four right-hand
panels collapse, and Pause and Slow are added. See research.md decisions 17 to 20. Three passes over visuals
and layout followed (decisions 21 to 23): a step strip and drag and drop, router state as cards
in the diagram with a pop-up, and less text.

**Revised 2026-11-19** for constitution v3.0.0: seven rounds building to a challenging last one,
rule 9 (a script error stops the script), cards that are whole calls, and the assembled script
handed back as code on the summary. See research.md decisions 25 to 27.

## Summary

A single-page browser game in which the player fills blanks in a Netmiko-style script with cards,
runs it against two simulated routers, and watches a ping. The build is static HTML, CSS and
native JavaScript modules with no dependencies.

The approach has three separable parts. A pure simulator applies the spec's eight rules to a
round's starting state and the placed cards, and returns a structured result. One JSON file holds
all authored content: topology, sources, rule and feedback wording, and the four rounds, each with
its script stored as structured statements. The page renders that content, plays the simulator's
result back one step at a time, keeps a ping repeating on the diagram against whichever state is
shown, and tracks the session.

**Hardest behaviour to get right**

- *In the rules:* route installation (rule 3) together with persistence and the loop variable
  (rules 6 and 7), because a route can be configured but not installed, and saved on one router
  but not the other.
- *On the page:* visual feedback that is engaging and still teaches, as the player places and
  swaps cards and as a Run plays. This is the priority named in `StarterKit/PLAN.md`.

**First evidence**

1. Cases 1 and 2 from the spec pass through the simulator with no page involved. Constitution
   workflow: the simulator and the 19-placement test come before any interface work.
2. On the page, the ping repeats on the diagram from the moment a round opens and stops at the
   router the text names: r1 in round 1 (link down), r2 on the reply in round 2 (no route back).
3. On the page, every card action (select, place, return, swap) produces motion and a status-line
   sentence, and with reduced motion the sentence alone. This makes the starter plan's "animations
   activate whenever a player makes a change" checkable.

## Technical Context

**Language/Version**: HTML, CSS, JavaScript (native ES modules), no build step

**Primary Dependencies**: none

**Storage**: none; session state is in memory and content is one static JSON file

**Testing**: Node's built-in test runner (`node --test tests/`) on the pure engine modules; a recorded manual checklist for the page ([quickstart.md](quickstart.md))

**Target Platform**: a current desktop browser, served over HTTP by any static file server

**Project Type**: static single-page web application

**Performance Goals**: a Run plays at about 400 ms per step; the ping rests about 1 s between repeats; Skip is immediate; no control is ever disabled or delayed by playback or by the repeating ping

**Constraints**: no network calls after load, no randomness or clock in outcomes, keyboard-operable, reduced-motion aware, fully playable at 768 px wide, 90-minute build

**Scale/Scope**: one screen with three views (round, summary, content error), seven rounds, 757 placements (37 across six rounds, 720 in the last), nine rules

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | How the design meets it | Status |
| --- | --- | --- |
| I. Technical truth | Only `engine/simulator.js` decides an outcome, from starting state and placement. The 19 expected results are hand-written data in `tests/cases.js`. Rules carry source ids; quotations are gated by a `captured` flag | Pass |
| II. Teaches through a decision | A round opens on its play screen with its idea above the script and About this round one action away. Each call has a note from `callNotes`; each log entry shows `Step.sent`, which follows Netmiko's source. Panels, script and counter are on screen by default; four panels are native disclosures the page never toggles itself. Feedback is assembled in the order router → traffic → rule | Pass |
| III. Honest progress | Run counting, single completion and the hint record are enforced in `engine/state.js`, independently of button state. Run is disabled once a solving Run's playback ends; before that a press only replays | Pass |
| IV. Access | Native buttons, select-then-select placement, text log and trace in live regions, one playback path with a zero-delay mode | Pass |
| V. Deterministic, self-contained | Static files; the simulator is a pure function; nothing stored or fetched after load | Pass |
| VI. Content and logic separate | All round content and all wording in `data/rounds.json`; validated before play; a new round with existing statements is a data change | Pass |
| VII. Done is demonstrated | One test command, a manual checklist mapped to AC1–AC11, and the spec's cut order carried into the slices below | Pass |
| VIII. Never waits; ping always showing | The state module counts a Run and applies its outcome when Run is pressed, so playback gates nothing. `ui/playback.js` has one ping walker that repeats: plain against the starting state (`openingPing`), with per-router detail against the last Run (`Result.pings`, last entry). Where the dot stops comes only from the simulator's `Leg`. One shared pace (paused, rate) governs every wait and the dot's animation, so Pause and Slow act on playback and ping alike and gate no control. Reduced motion shows a still marker | Pass |

**Post-design re-check:** all eight still pass. One deviation from the starter plan, not from the
constitution: tests run under Node, not on a browser page (research decision 10).

## Project Structure

### Documentation (this feature)

```text
specs/001-round-trip-game/
├── plan.md              # This file
├── research.md          # Design decisions
├── data-model.md        # Content, simulation and session data; session transitions
├── quickstart.md        # Run, test and manual validation
├── contracts/
│   ├── content.md       # data/rounds.json: fields, placement shape, validation rules
│   ├── simulator.md     # run(topology, round, placement) → Result; reason codes
│   └── ui.md            # Controls, card feedback, regions, playback, layout
└── tasks.md             # Created by /speckit-tasks
```

### Source Code (repository root)

```text
index.html               Page shell, regions, module entry point
style.css                Layout, focus, card and state motion, reduced motion
main.js                  Load content → validate → start; wire controls to state and playback
engine/
├── simulator.js         Pure: run, startView, openingPing; grammar, routing table, ping, reload
├── content.js           Pure: validate data/rounds.json; enumerate placements for solvability
├── state.js             Pure: session object and its transitions
└── feedback.js          Pure: Result + messages → log lines, trace sentences, explanation
ui/
├── diagram.js           The topology diagram, the ping dot and its marks (split from render.js)
├── render.js            Round, summary and error views; script-to-Python text with call notes
└── playback.js          Walk a Result step by step; repeat the ping for the state shown; Skip and
                         reduced motion use zero delay and a still marker
data/
└── rounds.json          Topology, sources, rules, messages, router messages, four rounds
tests/
├── cases.js             The 19 placements and hand-written expected results
├── simulator.test.js    Runs the 19 cases; asserts the count and the five solved cases
├── content.test.js      Shipped content validates; broken variants are rejected
├── state.test.js        Counting, completion, hint, first-run mark, restart
├── feedback.test.js     The exact sentences AC2 and AC3 require
└── whole-script.test.js All 720 placements of the last round against a hand-written rule
package.json             Marks the folder as ES modules for Node, so the tests run on older Node too
README.md                What was built, run and test commands, verification results, limits
```

**Structure Decision**: the starter plan's layout, with three changes. `engine/rules.js` is named
`simulator.js`, because it simulates and does not grade a single answer. `ui/controls.js` is
folded into `main.js`, because the controls are a handful of button handlers. `ui/playback.js` is
added, because stepping through a Run is the one piece of page logic with real behaviour. The
content file is `data/rounds.json` and has no level layer.

## Build slices

Each slice ends with evidence before the next begins. Cuts, if time runs short, follow the spec:
round 4 first, then the line-by-line highlight together with the per-router pause in the ping
animation.

| Slice | Deliverable | Evidence |
| --- | --- | --- |
| 1 · Prove the rules | `simulator.js`, `rounds.json` with all four rounds, `cases.js`, `simulator.test.js` | 19 of 19 pass under `node --test` |
| 2 · Guard the content | `content.js`, `content.test.js` | Shipped file validates; each broken variant names its round |
| 3 · One round, end to end | `state.js`, `feedback.js`, page shell, round 1 with its idea and call notes, cards, Run, text log and trace, retry, Next | Manual checks 1–5 and 22; `state.test.js` passes |
| 4 · Make it feel alive | Card motion, line highlight, state-row flash, the repeating ping, Skip, playback interruptions, reduced motion | Manual checks 6, 7, 14, 19 and 20 |
| 5 · The whole game | Rounds 2–4 on the page, reload sequence, hint, About this round, Reset routers, Pause, Slow, collapsible panels, summary, restart | Manual checks 8–12, 16, 21 and 23–25 |
| 6 · Usable and packaged | Focus handling, 768 px layout, touch check, README with recorded results | Manual checks 13, 15, 17 and 18 |

## Complexity Tracking

No constitution violations to justify.
