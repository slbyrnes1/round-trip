---

description: "Task list for Round Trip — first playable game"
---

# Tasks: Round Trip — first playable game

**Input**: Design documents from `/specs/001-round-trip-game/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/content.md, contracts/simulator.md, contracts/ui.md, quickstart.md. Governed by `.specify/memory/constitution.md` v3.0.0

**Tests**: Included. The spec requires all 19 placements to be run in tests (SC-001), and the constitution puts the simulator and that test before any interface work.

**Organization**: Tasks are grouped by user story. All paths are relative to the repository root.

**Regenerated 2026-11-17** for constitution v1.1.0 (Principle VIII) and the second clarification session: the repeating ping, Reset routers, and Run disabled only once a solving Run's playback ends.

**Extended 2026-11-17** with Phase 7, after the first playable build (constitution v2.0.0). Phase 7 removes the briefing page, so where a completed task in Phases 3 to 5 mentions a briefing, a Briefing control, Start, Close or the `started` field, Phase 7 is what the code now does.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story the task belongs to (US1, US2, US3)
- **Manual** tasks need a person at a browser; record each result as pass, fail or not run

## Phase 1: Setup

**Purpose**: The file layout from plan.md

- [X] T001 Create the layout from plan.md "Source Code": `index.html`, `style.css`, `main.js` (empty module), and the directories `engine/`, `ui/`, `data/`, `tests/`. `index.html` loads `style.css` and `main.js` as a module with relative paths

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Prove the rules and guard the content before any page work (plan slices 1 and 2; constitution I and VI)

**⚠️ CRITICAL**: No user story work begins until `node --test tests/` passes 19 of 19

- [X] T002 [P] Write the 19 placements and their expected results in `tests/cases.js`, copied by hand from spec.md "Required outcome cases" in the shape given in contracts/simulator.md "Test contract". Do not import or call the simulator in this file
- [X] T003 [P] Write the structural content in `data/rounds.json` per contracts/content.md: `schemaVersion`, `topology`, `sources` (every row of spec.md "References", including the three for rules 5 and 7), `rules` (the eight rules; `data-model.md` `Rule.id`; `sourceIds` empty for rules 1 and 2 only), `routerMessages` (both with `captured: false`), and for each of the four rounds its `id`, `learningOutcome`, `reloadCheck`, `start`, `script` and `tray` from spec.md "Round content"
- [X] T004 Write `tests/simulator.test.js` using `node:test`: load `data/rounds.json` and `tests/cases.js`, run each case through `run`, compare with its expected result, and assert that exactly 19 cases ran and that exactly cases 1, 7, 11, 14 and 15 are solved. Also check `openingPing` for each round against the hand-worked results in contracts/simulator.md "Test contract" (depends on T002, T003)
- [X] T005 Implement `run(topology, round, placement)`, `startView(topology, round)` and `openingPing(topology, round)` in `engine/simulator.js` per contracts/simulator.md: placement check, starting state (`data-model.md` `RouterConfig.shutdown`, `RouterConfig.routes`), the config-line grammar from contracts/content.md, script execution with one `conn` variable, routing table and ping with a `Hop.route` per router, reload, and the `Result` shape with reason codes. Pure: no page, timer, network or randomness
- [X] T006 Run `node --test tests/` and fix `engine/simulator.js` until 19 of 19 pass. Never change `tests/cases.js` to make a case pass; if a case looks wrong, stop and report it
- [X] T007 Add the teaching text to `data/rounds.json`: each round's `title`, `briefing` (`idea`, `terms`, `workedExample`, `limits`, `sourceIds`; spec.md FR-001, and FR-002 for round 1) and `hint` (FR-024, names no card), plus a `messages` entry for every reason code in contracts/simulator.md, worded per FR-015 to FR-017 and paraphrased per FR-018 (depends on T003)
- [X] T008 Implement `validate(content)` in `engine/content.js` with the 13 checks in contracts/content.md "Validation", including solvability by enumerating placements through `run`. Return a list of errors that each name the round or top-level field (depends on T005)
- [X] T009 Write `tests/content.test.js`: the shipped `data/rounds.json` validates with no errors; a copy with a card removed (tray cannot fill slots), a copy with the solving card removed (no solving placement), a copy with a malformed config line and a copy with a duplicate slot id are each rejected with the round named (depends on T007, T008)

**Checkpoint**: `node --test tests/` passes. The rules are proven and the content is guarded

---

## Phase 3: User Story 1 - Make and understand a decision (Priority: P1) 🎯 MVP

**Goal**: A player reads round 1's briefing, sees the ping repeating against the starting state, places cards, presses Run, watches the script and the ping play back without ever being made to wait, reads why, and retries or moves on

**Independent Test**: play round 1 alone: quickstart.md manual checks 1 to 7 and 22

### Tests for User Story 1

- [X] T010 [P] [US1] Write `tests/state.test.js` for the round transitions in data-model.md "Transitions": Start sets `started`; selecting a card changes `selectedCard` only; place, return and swap a card; wrong-type refusal; Run with an empty slot counts nothing (AC4); Run with all slots filled adds one and applies the outcome at that moment (FR-011a); a failed Run keeps the cards (FR-023); place, return or swap after a failed Run sets `showing` to `start` (FR-019a); Run while `playing` is a replay that counts nothing, for a failed and for a solving Run; a card change while `playing` ends playback and keeps the count (FR-011b); a solving Run sets `solved` and locks cards, and once `playing` is false a further Run is refused and nothing is counted or completed again (FR-022, FR-022a)
- [X] T011 [P] [US1] Write `tests/feedback.test.js`: case 1 gives the trace "Request delivered to hostB. Reply delivered to hostA." (AC2); case 2 gives a log line saying `no shutdown` was rejected and the script carried on, and a trace with the request dropped at r1 (AC3); case 8 gives "nothing changed" for the route and the reply dropped at r2; each trace lists the route used or "no matching route" per router (FR-012a); the opening ping gives a summary sentence with no per-router lines (FR-003); no router message is quoted while `captured` is false (FR-018)

### Implementation for User Story 1

- [X] T012 [P] [US1] Implement the session object and round transitions in `engine/state.js` per data-model.md "Session state": fields `Session.view`, `Session.roundIndex`, `Session.placement`, `Session.selectedCard`, `Session.playing`, `Session.lastResult`, `Session.showing`, `Session.rounds[i].started`, `Session.rounds[i].runs`, `Session.rounds[i].solved`, `Session.rounds[i].firstRun` as defined there, and the rules under "Rules the state module enforces" that concern cards, Run, playback and Next (FR-005). Pure; each transition returns what happened so the page can word a status message
- [X] T013 [P] [US1] Implement `engine/feedback.js`: turn a `Result` plus `messages`, `rules` and `routerMessages` into script log lines, a trace summary sentence with per-router lines, and an explanation in the order router → traffic → rule (FR-015, FR-016); and turn a single `Ping` into its summary sentence for the ping caption. Fill `{placeholders}` from step and leg evidence; quote a router message only when `captured` is true
- [X] T014 [US1] Run `node --test tests/` and fix `engine/state.js` and `engine/feedback.js` until T010 and T011 pass (depends on T012, T013)
- [X] T015 [US1] Build the page shell in `index.html` per contracts/ui.md "Regions" and "Controls": diagram, ping caption, script, tray, two state panels, status line, script log, ping trace, feedback, run counter, and the buttons Briefing, Run, Skip, Reset routers, Hint, Next and Restart. Ping caption, status line, log, trace and feedback are polite live regions
- [X] T016 [US1] Implement `ui/render.js`: briefing view with Start; round view with the script rendered to Python text from the statement list (slots as buttons, the `routes = {...}` line for `linesByDevice` per research.md decision 5); tray; state panels from `RouterView` with the state label (FR-019, FR-019a); inline SVG diagram with every interface address and the link state in text (FR-004, FR-020); run counter (FR-021); content-error view naming the round (FR-033) (depends on T015)
- [X] T017 [US1] Implement `ui/playback.js` per contracts/ui.md "Playback" and "The repeating ping", and research.md decisions 8 and 13. One ping walker that takes a `Ping` and a detail flag, reads where the dot stops only from its `Leg`, and repeats with a rest of about 1 s without writing or announcing text on a repeat (FR-012, FR-012b). One Run walk at about 400 ms per step: `Result.steps` (line highlight, state-row flash, log line), then the ping with the per-router pause and route highlight or "no matching route" (FR-012a), then the feedback; when it ends the walker keeps repeating that ping. A delay option of zero shows everything at once. Both can be cancelled and started again from the beginning at any point (depends on T016)
- [X] T018 [US1] Wire it together in `main.js`: fetch and validate `data/rounds.json`; show the content error or the round 1 briefing (AC1); build the play sequence from the rounds whose `inPlay` is not `false`; on entering a round show `startView`, write the `openingPing` sentence to the ping caption and start the plain repeating ping (FR-003, FR-012b); card and slot handlers that call the state transitions and write a status-line sentence for select, place, return, swap and wrong-type refusal (FR-006 to FR-008a), and after a place, return or swap switch the panels, caption and repeating ping back to the starting state (FR-019a); Run: with an empty slot, guidance naming the slot (FR-009); otherwise compute the result, call the state transition so the count and outcome are applied at once, then play it (FR-011a); Run during playback replays; Skip; a card change or Next ends playback (FR-011b); Run disabled only when the round is solved and playback has ended (FR-022); Next. No handler disables a control because of playback or the repeating ping (constitution VIII) (depends on T012, T013, T016, T017)
- [X] T019 [US1] Style the page in `style.css` per contracts/ui.md "Layout", "Visual feedback on every card action" and "The repeating ping": diagram and caption on top, script and tray left, state and trace right; card lift, slot glow, settle and return motion; running-line and changed-row highlight, each paired with text; link dark when down and lit when up; request and reply dots; one drop marker used for every drop; a visible focus ring on every button (depends on T015)
- [ ] T020 [US1] Manual: serve with `python3 -m http.server 8000 --bind 127.0.0.1` and run quickstart.md checks 1 to 7 and 22. Record each result for `README.md`

**Checkpoint**: Round 1 is playable end to end, with the ping repeating and full feedback. This is the MVP. Rounds 2 to 4 load from the same data and code; their checks belong to US2

---

## Phase 4: User Story 2 - Learn from help and finish the game (Priority: P1)

**Goal**: All four rounds including the reload sequence, a hint per round, a re-readable briefing, Reset routers, a session summary, and a confirmed restart

**Independent Test**: quickstart.md manual checks 8 to 12, 16, 19, 20 and 21

### Tests for User Story 2

- [X] T021 [US2] Extend `tests/state.test.js`: opening the hint sets `hintUsed` once and changes neither runs nor completion (AC6); a round solved on Run 1 after the hint still earns the first-run mark (FR-025); reopening the briefing changes nothing but the view, and `started` stays true (FR-002a); Reset routers after a failed Run sets `showing` to `start` and `playing` to false and changes no other field, does nothing when `showing` is already `start`, and is refused when the round is solved (FR-019b); Next after the last round in play opens the summary with runs, hint use and first-run mark per round (AC8); a confirmed Restart gives a fresh session at the round 1 briefing (AC9)

### Implementation for User Story 2

- [X] T022 [US2] Add to `engine/state.js` the hint, briefing-reopen, Reset routers, summary and restart transitions per data-model.md "Transitions" and "Rules the state module enforces", using `Session.rounds[i].hintUsed` and the `summary` value of `Session.view` as defined there. Run `node --test tests/` until T021 passes
- [X] T023 [US2] Extend the Run walk in `ui/playback.js` for rounds with a reload check, per contracts/ui.md "Playback": first ping, then the reload (panels change, log line), then the second ping, then the feedback; when it ends only the ping after the reload repeats (FR-013)
- [X] T024 [US2] Add to `ui/render.js` the hint display, the reopened briefing with a Close control (shown when `started` is true), the restart confirmation dialog with Confirm and Cancel, and the summary view listing each round's run count, hint use and first-run mark (FR-025, FR-026)
- [X] T025 [US2] Wire Hint, Briefing, Reset routers, Restart and the summary into `main.js`, with their effect on a playback in progress per contracts/ui.md "Playback": Hint leaves it running; closing the briefing or cancelling a restart restarts it from the beginning; Reset routers ends it and switches the panels, caption and repeating ping to the starting state (FR-011b, FR-019b). Cancelling a restart calls no state transition (depends on T022, T023, T024)
- [ ] T026 [US2] Manual: run quickstart.md checks 8 to 12, 16, 19, 20, 21 and 23 to 35. Record each result for `README.md`

**Checkpoint**: A full session from first briefing to summary, with help, Reset routers and restart

---

## Phase 5: User Story 3 - Play with accessible controls (Priority: P1)

**Goal**: The same game and the same information from the keyboard, with assistive technology, with reduced motion, and at 768 px wide

**Independent Test**: quickstart.md manual checks 13, 14, 15 and 18

- [X] T027 [US3] Audit `index.html` and `ui/render.js` against contracts/ui.md "Controls" and "Regions": every card, slot and button, including Skip, Reset routers and Briefing, is a native button with the accessible name listed there (cards say "selected", slots say "empty" or their card), in the stated Tab order; success and failure are stated in text wherever colour is used; the ping caption is announced once per change of state and never on a repeat (FR-029, FR-030, FR-012b)
- [X] T028 [US3] Implement focus handling in `main.js` per contracts/ui.md "Focus": focus moves to the heading of a briefing, hint, confirmation or summary when it opens and returns to the opening control when it closes; when a Run's playback ends, and only if focus is still on Run or Skip, it goes to Run when unsolved and to Next when solved; focus the player has moved elsewhere is left alone
- [X] T029 [US3] Honour reduced motion: a `prefers-reduced-motion` block in `style.css` removes card, highlight and dot motion; `ui/playback.js` uses zero delay when the preference is set, so the log, trace and feedback text appear at once, and draws a still drop marker (or delivered marks) in place of the repeating ping, with the same caption (FR-031, FR-012b)
- [X] T030 [US3] Make the layout hold at 768 px in `style.css` per contracts/ui.md "Layout": two narrower columns, state panels and log scroll inside their own labelled areas, every action button visible, no sideways page scroll (FR-032)
- [ ] T031 [US3] Manual: run quickstart.md checks 13, 14, 15 and 18, doing the keyboard-only playthrough yourself and recording it as a self-check (SC-004; constitution, Governance). Record SC-003 (a first-time player finishes in 5–10 minutes) as not run unless a first-time player is available. Record each result for `README.md`, and record the touch check as not run if no touch input is available

**Checkpoint**: All three stories work

---

## Phase 6: Polish & Release Evidence

**Purpose**: The README and the release items in spec.md "Assumptions" and quickstart.md

- [X] T032 Replace the template `README.md` with the real one: what was built, the run command, the test command and that tests need Node while playing does not (SC-008), the model and its limits, the references table, the rules that are unsourced or community-sourced (rules 1, 2 and 4), and the known limit that the repeating ping can be stopped only by the reduced-motion setting (research.md decision 13)
- [X] T033 Record verification in `README.md`: the `node --test tests/` totals, and a result of pass, fail or not run with date, browser and operating system for each of AC1 to AC11 and each manual check in quickstart.md (SC-002). Mark every check the author ran as evidence for a principle as a self-check, never as independent review (constitution, Governance). Keep failed and unrun checks visible
- [ ] T034 Manual: from a fresh clone, follow `README.md` only and confirm the game runs and the tests pass (quickstart.md check 17)
- [ ] T035 Manual, the author, in a pass separate from the build: check each of the eight rules in `data/rounds.json` against its source and review every round note, call note, hint and message; record the findings in `README.md`, labelled as a self-check (SC-007; constitution, Governance)
- [ ] T036 Manual: capture the two router messages listed in spec.md "Assumptions" from an IOS or IOS XE device. For each one captured, set its text and `captured: true` in `data/rounds.json` and rerun `node --test tests/`; list any not captured as a known limit in `README.md`
- [ ] T037 Manual, the author: after the playthrough in T031, make one deliberately wrong placement and say, from the feedback alone, which line the router rejected or ignored, where the traffic stopped and which rule explains it, and name the learning outcome each round's card placement exercises (constitution II evidence; SC-006). Record the result in `README.md`, labelled as a self-check
- [X] T038 Check constitution VI's evidence and record it in `README.md`: inspect one round in `data/rounds.json`; trace one placement from `run` through `engine/feedback.js` to its sentences; and add a trial round built from existing statements to a copy of `data/rounds.json`, confirming it validates and solves through `engine/content.js` with no change to `engine/simulator.js`. Do not ship the trial round

---

## Phase 7: Changes after the first playable build

**Purpose**: Four changes the author asked for after playing: no page before a round, more weight on how Netmiko works, collapsible panels, and Pause and Slow (spec.md "Session 2026-11-17, after the first playable build"; research.md decisions 17 to 20)

- [X] T039 Remove the briefing view from the session in `engine/state.js` per data-model.md "Session state" and "Transitions": `Session.view` has no `briefing` value, there is no `started` field and no briefing transitions, a session opens on round 1, and Next opens the next round. Update `tests/state.test.js` to match (AC1, AC8, AC9)
- [X] T040 Record what Netmiko sends on each step in `engine/simulator.js` as `Step.sent`, per contracts/simulator.md "What Netmiko sends", and carry it on each log line in `engine/feedback.js`. Add cases to `tests/feedback.test.js` for round 1 solved, round 1 wrong order, round 4 with the save after the loop, and `print` sending nothing (FR-015a)
- [X] T041 Add `callNotes` and the `netmiko-cisco-base` source to `data/rounds.json` per contracts/content.md; reword the `connected`, `show-reads-only`, `print-does-nothing` and `config-saved` messages; drop the `briefing.terms` entries that only explained a call. Validate `callNotes` in `engine/content.js` and add a broken variant to `tests/content.test.js` (FR-002a)
- [X] T042 Replace the briefing view in `index.html`, `ui/render.js` and `main.js` with the round intro: heading, the round's idea always shown, and About this round as a closed `details`. A round opens straight on the play screen and focus goes to its heading (FR-001, AC1)
- [X] T043 Render a `#` comment from `callNotes` above every call in the script in `ui/render.js`, and above a statement slot once a card is placed in it; show `sent` lines in each log entry (FR-002a, FR-015a)
- [X] T044 Make Router state, Script log, Ping trace and What happened and why native `details` in `index.html`, open by default, never toggled by `main.js`; style them in `style.css` (FR-004a)
- [X] T045 Add Pause and Slow: a shared pace in `ui/playback.js` that every wait counts down against, `setPace` in `ui/diagram.js` for the dot, the two buttons in `index.html` and their handlers in `main.js`; hidden with reduced motion; a Run pressed while paused is counted at once and the status line says so (FR-012c)
- [X] T046 Rerun `node --test tests/` and the browser checks; update `README.md` for the four changes, the new references and the removed known limit about pausing

---

## Phase 8: Visuals and layout

**Purpose**: Three passes over the look of the game (spec.md "Session 2026-11-17, visuals and layout"; research.md decisions 21 to 23)

- [X] T047 Make the mechanic visible: the step strip in `index.html` and `showStep` in `main.js`; empty slots and cards restyled in `style.css` and `ui/render.js`; drag and drop in `main.js` as the same transitions as select-then-select (FR-006, FR-006a)
- [X] T048 Move router state into the diagram: `renderPanels`, `toggleDetails` and `peek` in `ui/render.js` draw a card under each router with a pop-up; `data-node` on the routers in `ui/diagram.js`; hover and details wiring in `main.js`; the Router state panel removed from `index.html` (FR-019c, FR-004a)
- [X] T049 Cut the text: shorter `idea` and `callNotes` in `data/rounds.json`, with the fuller idea first in `terms`; the output placeholder in `index.html` and `main.js`; the explanation in `ui/render.js` without the per-line list; state label and ping caption on one line (FR-001, FR-015)
- [X] T050 Rerun `node --test tests/` and the browser checks; update `README.md`
- [X] T051 Make the top of the page a game (research.md decision 24): the status bar and level track in `index.html`, `renderTrack` in `ui/render.js` and `showTrack` in `main.js`; the ticket with `ticket` text in `data/rounds.json` (validated in `engine/content.js`), `renderTicket` and the goal lamps `renderGoal` in `ui/render.js`, set from the ping in `main.js`; hosts as laptops with faces and routers as pucks in `ui/diagram.js`, with `setMood`; styles in `style.css` (FR-001a)

---

## Phase 9: Seven rounds, and a script to take away

**Purpose**: Grow the game from four rounds to seven that build to a challenging last one, so a player leaves able to try writing their own Netmiko script (spec.md "Session 2026-11-19, seven rounds" and "Curriculum"; constitution v3.0.0)

- [X] T052 Add round 2, *The other end*, to `data/rounds.json` (r2's side of the link shut; a device slot and two configuration-line slots) with its ticket, notes and hint; rename the round ids by topic (`link-up`, `other-end`, `two-way`, `save`, `loop-save`); add its 12 hand-worked cases (20 to 31) to `tests/cases.js`; assert in `tests/simulator.test.js` that the listed cases are every placement of their round
- [X] T053 Add rule 9 to `engine/simulator.js`: a call that uses `conn` before any `ConnectHandler` has run stops the script; later lines do not run. Let a statement card hold a `connect` or `config` statement. Add the reason code, message, source and `Result` field; update `engine/content.js` checks 8 and the card rules; render the crash in the log and on the script
- [X] T054 Add round 6, *Calls in order*, with learning outcome LO4, its 6 hand-worked cases, and tests
- [X] T055 Add round 7, *The whole script* (five statement slots, six call cards, 720 placements): a hand-written rule in `tests/` for solved and crashed, applied to every placement without calling the simulator, plus a named case per kind of outcome
- [X] T056 After the last round, show the assembled script as complete, copyable Netmiko code with what to change to run it for real
- [X] T057 Renumber the rounds by name through `spec.md`, the contracts, `quickstart.md` and `README.md`; rerun every browser check on seven rounds

---

## Phase 10: Fewer words, same lesson

**Purpose**: Make the game less verbose without losing any Netmiko learning (spec.md "Session 2026-11-19, fewer words"; research.md decision 28)

- [X] T058 Add `short` to every message in `data/rounds.json`, validate it in `engine/content.js`, carry it on each log line in `engine/feedback.js`, and render the script log as a terminal transcript in `ui/render.js` (FR-015a, FR-016)
- [X] T059 Add `short` to every rule; return the trace as hops (`pingLegs`) and the explanation's one-line cause from `engine/feedback.js`; render hop rows and the compact explanation in `ui/render.js` (FR-012a, FR-015)
- [X] T061 Rebuild the play screen as one board that fits the window (research.md decision 29): the markup in `index.html` in Tab order with grid areas in `style.css`; the hand of cards and the buttons along the bottom; the script log as a terminal under the script; the verdict in the status line (`renderBanner`) and the stop bubble on the router (`markStop`) in `ui/render.js` and `main.js`; the diagram on a narrower canvas in `ui/diagram.js`; fallbacks for short and narrow windows; Restart in the status bar (FR-032a)
- [X] T060 Shorten the ticket (drop `subject`), the ideas, the call notes (now trailing comments from `scriptLines`), the goal lamps, the status messages and the output placeholder; rerun the tests and browser checks; update `README.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: none
- **Foundational (Phase 2)**: after Setup; blocks every story
- **US1 (Phase 3)**: after Foundational
- **US2 (Phase 4)**: after US1; it extends `engine/state.js`, `ui/playback.js`, `ui/render.js` and `main.js`
- **US3 (Phase 5)**: after US1; T028 and T029 also touch what US2 adds, so it is simplest after US2
- **Polish (Phase 6)**: after the stories being shipped
- **Phase 7**: after US1 to US3; T039 to T041 (engine and content) before T042 to T045 (page)

### Within Phase 2

T002 and T003 in parallel → T004 → T005 → T006 → T007 → T008 → T009

### Within US1

T010, T011, T012 and T013 in parallel → T014 → T015 → T016 → T017 → T018 → T019 → T020. T019 can start as soon as T015 is done

### Within US2

T021 → T022; T023 and T024 can follow in either order → T025 → T026

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
2. Phase 3 (US1): stop and run the manual checks; round 1 is a playable game
3. Phases 4 and 5, then Phase 6

### If time runs short (from spec.md "Assumptions")

1. Take round 4 out of play: set `"inPlay": false` on round 4 in `data/rounds.json`, so the session ends after round 3 and the summary lists three rounds, and say so in `README.md`. Round 4's content and cases 14 to 19 stay, and `node --test tests/` still runs all 19
2. Then cut the line-by-line highlight and the per-router pause in T017. The text log and per-router trace lines stay, and the ping still repeats as a plain dot that stops where the simulator says

Never cut: simulator-computed outcomes, the reset on every Run, the text trace, round 2, the placement test, or the repeating ping stopping at the simulator's router (constitution VII and VIII).

---

## Notes

- A task is done when its evidence exists, not when its box is ticked (constitution VII)
- If a principle and an implementation conflict, report it; do not relax the principle, an expected result or a test (constitution, Governance)
- Constitution VIII's evidence is quickstart.md checks 14, 19, 20 and 22, recorded by T033
