# Implementation Plan: Round Trip — first playable game

**Branch**: `001-round-trip-game` | **Date**: 2026-11-17 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-round-trip-game/spec.md`, with `StarterKit/PLAN.md` as the workshop's planning input.

## Summary

A single-page browser game in which the player fills blanks in a Netmiko-style script with cards,
runs it against two simulated routers, and watches a ping. The build is static HTML, CSS and
native JavaScript modules with no dependencies.

The approach has three separable parts. A pure simulator applies the spec's eight rules to a
round's starting state and the placed cards, and returns a structured result. One JSON file holds
all authored content: topology, sources, rule and feedback wording, and the four rounds, each with
its script stored as structured statements. The page renders that content, plays the simulator's
result back one step at a time, and tracks the session.

**Hardest behaviour to get right**

- *In the rules:* route installation (rule 3) together with persistence and the loop variable
  (rules 6 and 7), because a route can be configured but not installed, and saved on one router
  but not the other.
- *On the page:* visual feedback that is engaging and still teaches, as the player places and
  swaps cards and as a Run plays. This is the priority named in `StarterKit/PLAN.md`.

**First evidence**

1. Cases 1 and 2 from the spec pass through the simulator with no page involved. Constitution
   workflow: the simulator and the 19-placement test come before any interface work.
2. On the page, every card action (select, place, return, swap) produces motion and a status-line
   sentence, and with reduced motion the sentence alone. This makes the starter plan's "animations
   activate whenever a player makes a change" checkable.

## Technical Context

**Language/Version**: HTML, CSS, JavaScript (native ES modules), no build step

**Primary Dependencies**: none

**Storage**: none; session state is in memory and content is one static JSON file

**Testing**: Node's built-in test runner (`node --test tests/`) on the pure engine modules; a recorded manual checklist for the page ([quickstart.md](quickstart.md))

**Target Platform**: a current desktop browser, served over HTTP by any static file server

**Project Type**: static single-page web application

**Performance Goals**: a card action responds within 100 ms; a Run plays at about 400 ms per step; Skip is immediate

**Constraints**: no network calls after load, no randomness or clock in outcomes, keyboard-operable, reduced-motion aware, fully playable at 768 px wide, 90-minute build

**Scale/Scope**: one screen with four views (briefing, round, summary, content error), four rounds, 19 placements, eight rules

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | How the design meets it | Status |
| --- | --- | --- |
| I. Technical truth | Only `engine/simulator.js` decides an outcome, from starting state and placement. The 19 expected results are hand-written data in `tests/cases.js`. Rules carry source ids; quotations are gated by a `captured` flag | Pass |
| II. Teaches through a decision | Briefing view precedes each round; panels, script and counter are always on screen; feedback is assembled in the order router → traffic → rule | Pass |
| III. Honest progress | Run counting, single completion and the hint record are enforced in `engine/state.js`, independently of button state | Pass |
| IV. Access | Native buttons, select-then-select placement, text log and trace in live regions, one playback path with a zero-delay mode | Pass |
| V. Deterministic, self-contained | Static files; the simulator is a pure function; nothing stored or fetched after load | Pass |
| VI. Content and logic separate | All round content and all wording in `data/rounds.json`; validated before play; a new round with existing statements is a data change | Pass |
| VII. Done is demonstrated | One test command, a manual checklist mapped to AC1–AC11, and the spec's cut order carried into the slices below | Pass |

**Post-design re-check:** all seven still pass. One deviation from the starter plan, not from the
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
├── render.js            Briefing, round, summary and error views; script-to-Python text; diagram
└── playback.js          Walk a Result step by step; Skip and reduced motion use zero delay
data/
└── rounds.json          Topology, sources, rules, messages, router messages, four rounds
tests/
├── cases.js             The 19 placements and hand-written expected results
├── simulator.test.js    Runs the 19 cases; asserts the count and the five solved cases
├── content.test.js      Shipped content validates; broken variants are rejected
├── state.test.js        Counting, completion, hint, first-run mark, restart
└── feedback.test.js     The exact sentences AC2 and AC3 require
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
| 3 · One round, end to end | `state.js`, `feedback.js`, page shell, round 1 with briefing, cards, Run, text log and trace, retry, Next | Manual checks 1–5; `state.test.js` passes |
| 4 · Make it feel alive | Card motion, line highlight, state-row flash, traffic dots, Skip, reduced motion | Manual checks 6, 7 and 14 |
| 5 · The whole game | Rounds 2–4 on the page, reload sequence, hint, briefing control, summary, restart | Manual checks 8–12 and 16 |
| 6 · Usable and packaged | Focus handling, 768 px layout, README with recorded results | Manual checks 13, 15 and 17 |

## Complexity Tracking

No constitution violations to justify.
