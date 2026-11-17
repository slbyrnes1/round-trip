---

description: "Task list for Round Trip — first playable game"
---

# Tasks: Round Trip — first playable game

**Input**: Design documents from `/specs/001-round-trip-game/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/content.md, contracts/simulator.md, contracts/ui.md, quickstart.md

**Tests**: Included. The spec requires all 19 placements to be run in tests (SC-001), and the constitution puts the simulator and that test before any interface work.

**Organization**: Tasks are grouped by user story. All paths are relative to the repository root.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story the task belongs to (US1, US2, US3)
- **Manual** tasks need a person at a browser; record each result as pass, fail or not run

## Phase 1: Setup

**Purpose**: The file layout from plan.md

- [ ] T001 Create the layout from plan.md "Source Code": `index.html`, `style.css`, `main.js` (empty module), and the directories `engine/`, `ui/`, `data/`, `tests/`. `index.html` loads `style.css` and `main.js` as a module with relative paths

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Prove the rules and guard the content before any page work (plan slices 1 and 2; constitution I and VI)

**⚠️ CRITICAL**: No user story work begins until `node --test tests/` passes 19 of 19

- [ ] T002 [P] Write the 19 placements and their expected results in `tests/cases.js`, copied by hand from spec.md "Required outcome cases" in the shape given in contracts/simulator.md "Test contract". Do not import or call the simulator in this file
- [ ] T003 [P] Write the structural content in `data/rounds.json` per contracts/content.md: `schemaVersion`, `topology`, `sources` (from spec.md "References"), `rules` (the eight rules; `data-model.md` `Rule.id`; `sourceIds` empty for rules 1 and 2), `routerMessages` (both with `captured: false`), and for each of the four rounds its `id`, `learningOutcome`, `reloadCheck`, `start`, `script` and `tray` from spec.md "Round content"
- [ ] T004 Write `tests/simulator.test.js` using `node:test`: load `data/rounds.json` and `tests/cases.js`, run each case through `run`, compare with its expected result, and assert that exactly 19 cases ran and that exactly cases 1, 7, 11, 14 and 15 are solved. Also check `openingPing` for each round against the hand-worked results in contracts/simulator.md "Test contract" (depends on T002, T003)
- [ ] T005 Implement `run(topology, round, placement)`, `startView(topology, round)` and `openingPing(topology, round)` in `engine/simulator.js` per contracts/simulator.md: placement check, starting state (`data-model.md` `RouterConfig.shutdown`, `RouterConfig.routes`), the config-line grammar from contracts/content.md, script execution with one `conn` variable, routing table and ping with a `Hop.route` per router, reload, and the `Result` shape with reason codes. Pure: no page, timer, network or randomness
- [ ] T006 Run `node --test tests/` and fix `engine/simulator.js` until 19 of 19 pass. Never change `tests/cases.js` to make a case pass; if a case looks wrong, stop and report it
- [ ] T007 Add the teaching text to `data/rounds.json`: each round's `title`, `briefing` (`idea`, `terms`, `workedExample`, `limits`, `sourceIds`; spec.md FR-001, and FR-002 for round 1) and `hint` (FR-024, names no card), plus a `messages` entry for every reason code in contracts/simulator.md, worded per FR-015 to FR-017 and paraphrased per FR-018 (depends on T003)
- [ ] T008 Implement `validate(content)` in `engine/content.js` with the 13 checks in contracts/content.md "Validation", including solvability by enumerating placements through `run`. Return a list of errors that each name the round or top-level field (depends on T005)
- [ ] T009 Write `tests/content.test.js`: the shipped `data/rounds.json` validates with no errors; a copy with a card removed (tray cannot fill slots), a copy with the solving card removed (no solving placement), a copy with a malformed config line and a copy with a duplicate slot id are each rejected with the round named (depends on T007, T008)

**Checkpoint**: `node --test tests/` passes. The rules are proven and the content is guarded

---

## Phase 3: User Story 1 - Make and understand a decision (Priority: P1) 🎯 MVP

**Goal**: A player reads a briefing, places cards, presses Run, watches the script and the ping play back, reads why, and retries or moves on

**Independent Test**: quickstart.md manual checks 1 to 7, 9 and 10

### Tests for User Story 1

- [ ] T010 [P] [US1] Write `tests/state.test.js` for the round transitions in data-model.md "Transitions": place, return and swap a card; wrong-type refusal; Run with an empty slot counts nothing (AC4); Run with all slots filled adds one; a failed Run keeps the cards (FR-023); changing a card after a failed Run sets `showing` to `start` (FR-019a); a solving Run sets `solved`, locks cards and refuses a second Run (FR-022, FR-022a); a Run's count and outcome are applied when Run is pressed (FR-011a); Run while `playing` is a replay that counts nothing; a card change while `playing` ends playback and keeps the count (FR-011b)
- [ ] T011 [P] [US1] Write `tests/feedback.test.js`: case 1 gives the trace "Request delivered to hostB. Reply delivered to hostA." (AC2); case 2 gives a log line saying `no shutdown` was rejected and the script carried on, and a trace with the request dropped at r1 (AC3); case 8 gives "nothing changed" for the route and the reply dropped at r2; each trace lists the route used or "no matching route" per router (FR-012a); no router message is quoted while `captured` is false (FR-018)

### Implementation for User Story 1

- [ ] T012 [P] [US1] Implement the session object and round transitions in `engine/state.js` per data-model.md "Session state": fields `Session.view`, `Session.roundIndex`, `Session.placement`, `Session.selectedCard`, `Session.playing`, `Session.lastResult`, `Session.showing`, `Session.rounds[i].runs`, `Session.rounds[i].solved`, `Session.rounds[i].firstRun` as defined there, and the rules under "Rules the state module enforces". Include Next between rounds (FR-005). Pure; each transition returns what happened so the page can word a status message
- [ ] T013 [P] [US1] Implement `engine/feedback.js`: turn a `Result` plus `messages`, `rules` and `routerMessages` into script log lines, a trace summary sentence with per-router lines, and an explanation in the order router → traffic → rule (FR-015, FR-016). Fill `{placeholders}` from step and leg evidence; quote a router message only when `captured` is true
- [ ] T014 [US1] Run `node --test tests/` and fix `engine/state.js` and `engine/feedback.js` until T010 and T011 pass (depends on T012, T013)
- [ ] T015 [US1] Build the page shell in `index.html` per contracts/ui.md "Regions" and "Controls": diagram, script, tray, two state panels, status line, script log, ping trace, feedback, run counter, and the buttons Briefing, Run, Skip, Hint, Next and Restart. Status line, log, trace and feedback are polite live regions
- [ ] T016 [US1] Implement `ui/render.js`: briefing view; round view with the script rendered to Python text from the statement list (slots as buttons, the `routes = {...}` line for `linesByDevice` per research.md decision 5); tray; state panels from `RouterView` with the state label (FR-019, FR-019a); inline SVG diagram with every interface address and the link state in text (FR-004, FR-020); run counter (FR-021); content-error view naming the round (FR-033) (depends on T015)
- [ ] T017 [US1] Implement `ui/playback.js` per contracts/ui.md "Playback" and research.md decision 8: walk `Result.steps` (line highlight, state-row flash, log line), then each ping after the Run (dot pauses at each router while the route used is highlighted or "no matching route" shows, trace lines appear), the reload between pings when present, then the feedback. One walk with a delay option; zero delay shows everything at once. The walk can be cancelled and started again from the beginning at any point (depends on T016)
- [ ] T018 [US1] Wire it together in `main.js`: fetch and validate `data/rounds.json`; show the content error or the round 1 briefing (AC1); build the play sequence from the rounds whose `inPlay` is not `false`; on entering a round show `startView` and play `openingPing` as a plain dot with its summary sentence only (FR-003); card and slot handlers that call the state transitions and write a status-line sentence for select, place, return, swap and wrong-type refusal (FR-006 to FR-008a); Run (empty-slot guidance naming the slot, FR-009; otherwise compute the result, play it, then apply the outcome); Skip (FR-011a); interruptions during playback per contracts/ui.md "Playback": Run replays, Hint carries on, Briefing close and Restart cancel replay, a card change or Next ends it (FR-011b); Next (depends on T012, T013, T016, T017)
- [ ] T019 [US1] Style the page in `style.css` per contracts/ui.md "Layout" and "Visual feedback on every card action": diagram on top, script and tray left, state and trace right; card lift, slot glow, settle and return motion; running-line and changed-row highlight, each paired with text; link dark when down and lit when up; traffic dots; a visible focus ring on every button (depends on T015)
- [ ] T020 [US1] Manual: serve with `python3 -m http.server 8000 --bind 127.0.0.1` and run quickstart.md checks 1 to 7, 9 and 10. Record each result for the README

**Checkpoint**: All four rounds can be played and solved in order, with full feedback. This is the MVP

---

## Phase 4: User Story 2 - Learn from help and finish the game (Priority: P1)

**Goal**: A hint per round, a re-readable briefing, a session summary, and a confirmed restart

**Independent Test**: quickstart.md manual checks 8, 11, 12 and 16

### Tests for User Story 2

- [ ] T021 [US2] Extend `tests/state.test.js`: opening the hint sets `hintUsed` once and changes neither runs nor completion (AC6); a round solved on Run 1 after the hint still earns the first-run mark (FR-025); reopening the briefing changes nothing but the view (FR-002a); Next after round 4 opens the summary with runs, hint use and first-run mark per round (AC8); Restart confirmed gives a fresh session at the round 1 briefing and Restart cancelled changes nothing (AC9)

### Implementation for User Story 2

- [ ] T022 [US2] Add to `engine/state.js` the hint, briefing-reopen, summary and restart transitions per data-model.md "Transitions", using `Session.rounds[i].hintUsed` and the `summary` value of `Session.view` as defined there. Run `node --test tests/` until T021 passes
- [ ] T023 [US2] Add to `ui/render.js` the hint display, the reopened briefing with a Close control, the restart confirmation with Confirm and Cancel, and the summary view listing each round's run count, hint use and first-run mark (FR-025, FR-026)
- [ ] T024 [US2] Wire Hint, Briefing, Restart and the summary into `main.js` (depends on T022, T023)
- [ ] T025 [US2] Manual: run quickstart.md checks 8, 11, 12 and 16. Record each result for the README

**Checkpoint**: A full session from first briefing to summary, with help and restart

---

## Phase 5: User Story 3 - Play with accessible controls (Priority: P1)

**Goal**: The same game and the same information from the keyboard, with assistive technology, with reduced motion, and at 768 px wide

**Independent Test**: quickstart.md manual checks 13, 14, 15, 18 and 19

- [ ] T026 [US3] Audit `index.html` and `ui/render.js` against contracts/ui.md "Controls": every card, slot and button is a native button with the accessible name listed there (cards say "selected", slots say "empty" or their card), in the stated Tab order; success and failure are stated in text wherever colour is used (FR-029, FR-030)
- [ ] T027 [US3] Implement focus handling in `main.js` per contracts/ui.md "Focus": focus moves to the heading of a briefing, hint, confirmation or summary when it opens and returns to the opening control when it closes; after a Run it stays on Run when unsolved and moves to Next when solved
- [ ] T028 [US3] Honour reduced motion: a `prefers-reduced-motion` block in `style.css` removes card, highlight and dot motion, and `ui/playback.js` uses zero delay when the preference is set, so the log, trace and feedback text appear at once (FR-031)
- [ ] T029 [US3] Make the layout hold at 768 px in `style.css` per contracts/ui.md "Layout": two narrower columns, state panels and log scroll inside their own labelled areas, action buttons visible, no sideways page scroll (FR-032)
- [ ] T030 [US3] Manual: run quickstart.md checks 13, 14, 15, 18 and 19, with a teammate who has not played before doing the keyboard-only playthrough (SC-004). Time that first playthrough against the 5–10 minute target (SC-003). Record each result for the README, and record the touch check as not run if no touch input is available

**Checkpoint**: All three stories work

---

## Phase 6: Polish & Release Evidence

**Purpose**: The README and the release items in spec.md "Assumptions" and quickstart.md

- [ ] T031 Replace the template `README.md` with the real one: what was built, the run command, the test command and that tests need Node while playing does not (SC-008), the model and its limits, the references table, and the rules that are unsourced or community-sourced (rules 1, 2 and 4)
- [ ] T032 Record verification in `README.md`: the `node --test tests/` totals, and a result of pass, fail or not run with date, browser and operating system for each of AC1 to AC11 and each manual check in quickstart.md (SC-002). Keep failed and unrun checks visible
- [ ] T033 Manual: from a fresh clone, follow `README.md` only and confirm the game runs and the tests pass (quickstart.md check 17)
- [ ] T034 Manual, second person: check each of the eight rules in `data/rounds.json` against its source and review every briefing, hint and message; record the reviewer's name and findings in `README.md` (SC-007)
- [ ] T035 Manual: capture the two router messages listed in spec.md "Assumptions" from an IOS or IOS XE device. For each one captured, set its text and `captured: true` in `data/rounds.json` and rerun `node --test tests/`; list any not captured as a known limit in `README.md`
- [ ] T036 Manual, teammate: after the playthrough in T030, the teammate makes one deliberately wrong placement and says, from the feedback alone, which line the router rejected or ignored, where the traffic stopped and which rule explains it, and names the learning outcome each round's card placement exercises (constitution II evidence; SC-006). Record the result in `README.md`
- [ ] T037 Check constitution VI's evidence and record it in `README.md`: inspect one round in `data/rounds.json`; trace one placement from `run` through `engine/feedback.js` to its sentences; and add a trial round built from existing statements to a copy of `data/rounds.json`, confirming it validates and solves through `engine/content.js` with no change to `engine/simulator.js`. Do not ship the trial round

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: none
- **Foundational (Phase 2)**: after Setup; blocks every story
- **US1 (Phase 3)**: after Foundational
- **US2 (Phase 4)**: after US1; it extends `engine/state.js`, `ui/render.js` and `main.js`
- **US3 (Phase 5)**: after US1; T027 also touches what US2 adds, so it is simplest after US2
- **Polish (Phase 6)**: after the stories being shipped

### Within Phase 2

T002 and T003 in parallel → T004 → T005 → T006 → T007 → T008 → T009

### Within US1

T010, T011, T012 and T013 in parallel → T014 → T015 → T016 → T017 → T018 → T019 → T020. T019 can start as soon as T015 is done

### Parallel Opportunities

```text
Phase 2:  T002 tests/cases.js            ∥  T003 data/rounds.json (structure)
US1:      T010 tests/state.test.js       ∥  T011 tests/feedback.test.js
          T012 engine/state.js           ∥  T013 engine/feedback.js
```

---

## Implementation Strategy

### MVP first

1. Phases 1 and 2: stop at the checkpoint and confirm 19 of 19
2. Phase 3 (US1): stop and run the manual checks; this is a playable game
3. Phases 4 and 5, then Phase 6

### If time runs short (from spec.md "Assumptions")

1. Take round 4 out of play: set `"inPlay": false` on round 4 in `data/rounds.json`, so the session ends after round 3 and the summary lists three rounds, and say so in `README.md`. Round 4's content and cases 14 to 19 stay, and `node --test tests/` still runs all 19
2. Then cut the line-by-line highlight and the per-router pause in T017; the text log and per-router trace lines stay

Never cut: simulator-computed outcomes, the reset on every Run, the text trace, round 2, or the placement test.

---

## Notes

- A task is done when its evidence exists, not when its box is ticked (constitution VII)
- If a principle and an implementation conflict, report it; do not relax the principle, an expected result or a test (constitution, Governance)
