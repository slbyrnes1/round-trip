# Round Trip Constitution

**Purpose:** help network engineers who are new to automation tell apart three things that are
easy to confuse (what a script sent, what the router holds in its configuration, and what traffic
does) by placing code cards into a Netmiko-style script and watching a ping between two simulated
routers.

**First release:** one mechanic, four short rounds, a browser, and a 90-minute build with a coding
agent. This budget changes only by amending the agreed scope.

## Core Principles

### I. Technical truth is a release requirement

- The game MUST NOT mark a round solved unless the simulator, applying the eight documented rules
  to the round's starting state and the placed cards, delivers both the request and the reply.
  In rounds 3 and 4 that means the ping after both routers reload.
- Every outcome MUST be computed by the simulator. Every Run MUST start from the round's starting
  state, so the result depends only on the round and the cards placed.
- Each rule MUST carry a reference with a link and section. A rule with no source, or with only a
  community source, MUST be labelled as such in the spec and README until one is found.
- Router messages MUST be shown as quotations only after they are captured from a real IOS or
  IOS XE device. Until then the feedback paraphrases what the router did.
- Simplifications and exclusions that affect what a player can conclude MUST appear in the round
  briefing and the README. The diagram and animation illustrate a rule and MUST NOT change it.
- A round whose tray cannot fill its slots, or that has no solving placement, is an authoring
  error: the game MUST show a content error naming the round and MUST NOT grade it.

**Rationale:** the learners will carry these rules to real routers. A game that rewards a wrong
script teaches the misconception it exists to remove.

**Evidence:** all 19 placements in the spec run in tests and match expected results that were
worked by hand, not produced by the evaluator; a reference for each rule; a second person checks
each rule against its reference and reviews every shipped briefing and explanation.

### II. Every round teaches through a decision

- The player's only action is placing cards and pressing Run, and that action MUST exercise the
  round's learning outcome.
- Each round MUST open with a briefing that introduces its one new idea, the terms it needs, and a
  worked example that differs from the challenge, before any slot can be filled.
- The values needed to reason about the answer MUST be on screen at all times: every interface
  address, both router state panels, the full script, and the run counter.
- Feedback on every Run MUST say, in this order, what the router did with each line, where the
  traffic stopped, and the rule that explains it. A failed Run names the specific mistake; a
  solving Run explains why it works.
- Rounds follow this sequence: CLI context and silent rejection → a route in each direction →
  saving a change → saving inside a loop.
- Each round has exactly one hint. The hint MUST explain the method without naming a card.

**Rationale:** the misconception is that a script that ran without crashing fixed the network.
Only a decision followed by a visible consequence dislodges it.

**Evidence:** a teammate can connect each card placement to LO1, LO2 or LO3 and can describe what
they learned from a deliberately wrong placement.

### III. Progress is honest and retry is safe

- A round completes only on a Run with every slot filled that ends in a completed round trip.
- A failed Run MUST leave the round playable with the cards still placed.
- A Run with an empty slot MUST give guidance naming that slot and MUST NOT change the run count
  or completion.
- A solving Run completes the round exactly once. Run MUST be disabled afterwards, and the state
  logic MUST guard against a second completion independently of the button.
- The run counter and the first-run mark are the only scoring. The game MUST NOT have points,
  lives, a timer, a leaderboard or a streak. Hints and retries carry no penalty.
- Hint use MUST be recorded and shown separately from completion, and MUST never mark a round
  solved. The summary shows runs, hint use and the first-run mark for every round.
- Rounds advance only through Next. Restart MUST ask for confirmation; Cancel preserves the
  session.

**Rationale:** a learner who is afraid of a wrong answer stops experimenting, and a summary that
overstates mastery misleads the learner and the instructor.

**Evidence:** checks for a failed Run, an empty slot, a repeated Run after solving, hint use,
completion, and Restart with both Confirm and Cancel all match the specification.

### IV. Access is part of the core game

- Cards, slots, Run, Hint, Next and Restart MUST be operable from the keyboard with visible focus
  and accessible names. Placing a card is select-card-then-select-slot on mouse, touch and
  keyboard alike; dragging is a stretch feature layered on that same action.
- The script log and the ping trace MUST be text, MUST stay on screen, and MUST be announced to
  assistive technology. Success and failure MUST be conveyed in text as well as colour.
- With reduced motion set, the log and trace text MUST appear immediately with no information
  lost. Animation MUST never delay feedback or controls.
- Nothing needed to reason about a round may be hidden behind hover.
- The game MUST remain usable on a typical laptop and in a narrow browser window. Dense panels may
  scroll inside their own labelled container without hiding the action buttons.

**Rationale:** the workshop audience uses a range of devices and assistive technology, and a text
trace is also the easiest thing to test.

**Evidence:** a teammate completes all four rounds using only the keyboard; a narrow-window check;
a reduced-motion check. Record what was actually checked and do not claim accessibility
certification.

### V. The first version is deterministic and self-contained

- The game ships authored content and a deterministic simulator. It MUST NOT require an account,
  backend, real device, SSH session, Python interpreter, model or API key.
- No randomness, clock or network call may influence an outcome.
- Session progress is held in memory for the page session. Reload starts again.
- AI may write code and assets during development. Its output receives the same review as any
  other contribution.
- Runtime AI, free typing and generated content are out of scope. Adding any of them requires
  amending this constitution, the specification and the verification approach first.

**Rationale:** a 90-minute build has no room for infrastructure, and a deterministic game can be
verified exhaustively: 19 placements cover every possible input.

**Evidence:** a clean browser session plays all four rounds from the project's static files, and
no external service decides an outcome.

### VI. Content and logic can be reviewed separately

- Round content (starting state, scaffold, slots, tray, briefing, hint, sources) MUST live in
  editable data, separate from the simulator, the rendering and the progress tracking.
- Content MUST be validated before a round is presented.
- Feedback MUST be derived from what the simulator did. A hand-authored answer key MUST NOT
  override the simulator, and the interface MUST NOT decide correctness by card position or label.
- Adding a round that uses the existing mechanic and calls MUST need only a data change and its
  hand-worked cases, with no new scoring path or screen.

**Rationale:** a network engineer can review the rules and the rounds without reading the
interface code, and the second-person rule check in Principle I depends on that.

**Evidence:** inspect one round's data, trace one placement through the simulator to its feedback,
and add a trial round without modifying the simulator.

### VII. Done is demonstrated

- Only the agreed scope ships. The spec, plan, tasks and README MUST describe the same game.
- A feature is complete when its acceptance criteria pass and the result is recorded. A
  screenshot, a ticked task box, or the agent saying "done" is not evidence on its own.
- Every acceptance criterion MUST have a recorded result of pass, fail or not run. Failed and
  unrun checks stay visible.
- When time runs short, scope is cut explicitly and in this order: round 4 first, then the
  line-by-line highlight. These MUST NOT be cut: simulator-computed outcomes, the reset on every
  Run, the text trace, round 2, and the 19-placement test.
- Incorrect teaching and broken core interactions MUST be fixed before any visual polish.

**Rationale:** the workshop is about engineering the loop between a spec and an agent. That loop
is only as good as its evidence.

**Evidence:** run and test commands that reproduce from a fresh checkout, recorded verification
results, a fresh-start playthrough, and a README another attendee can follow.

## Scope and Model Boundaries

- **Model:** a simplified Cisco IOS behaviour model driven by Netmiko method names, on one fixed
  topology (hostA, r1, r2, hostB). Host addresses, gateways and router interface addresses are
  correct and preconfigured. There is no default route.
- **Script language:** a fixed scaffold with typed slots (device, config line, statement). The
  only calls are `ConnectHandler`, `send_config_set`, `send_command` and `save_config`, plus one
  `for` loop form and a no-op `print`. A card fits only slots of its type and is used at most once
  per round.
- **Excluded behaviour:** ARP, dynamic routing, administrative distance, equal-cost paths,
  recursive next-hop resolution, exit-interface static routes, IPv6, enable/privilege modes,
  closing sessions, authentication failures, timeouts, output parsing and ICMP error messages.
  Static routes install and withdraw instantly, where a real router can take up to about a minute.
- **Non-goals:** free typing, real Python execution, real devices, accounts, a backend, runtime
  AI, a leaderboard, a level editor, a third router and alternate paths.
- **Stretch only:** sound and drag-and-drop. Neither may delay or replace a required behaviour.

## Development Workflow and Quality Gates

- Work follows the Spec Kit sequence: constitution → specify → clarify → plan → tasks → analyze →
  implement.
- **Before implement:** analysis reports no unresolved conflict between this constitution, the
  spec, the plan and the tasks.
- **First slice:** the simulator and the 19-placement test come before any interface work.
  Expected results in that test are the hand-written ones from the spec and MUST NOT be computed
  by calling the simulator under test. A test run that discovers zero tests is a failure.
- **Before release:** every acceptance criterion has a recorded result; a teammate completes a
  keyboard-only playthrough; a second person has checked each rule against its reference; the
  README states what was built, the exact run and test commands, and the remaining limits.
- **Open items carried from the spec:** sources for rules 1 and 2, and captures of the two router
  messages. Each is either closed or listed in the README as a known limit at release.

## Governance

This constitution takes precedence over the spec, plan, tasks and agent instructions. Where they
conflict, the other document is corrected or this one is amended openly.

- **Amendment:** for any material change, record the reason, update the affected spec and plan,
  and rerun analysis. Changes are agreed with the workshop group before they take effect.
- **No convenience weakening:** the build agent MUST NOT relax a principle, an expected result or
  a test to make its implementation pass. It reports the conflict instead.
- **Versioning:** semantic. MAJOR for removing or redefining a principle, MINOR for adding a
  principle or section or materially expanding one, PATCH for clarification and wording.
- **Compliance review:** the plan includes a constitution check; analysis and the release review
  verify each principle against its Evidence line and record the result.

**Version**: 1.0.0 | **Ratified**: 2026-11-17 | **Last Amended**: 2026-11-17
