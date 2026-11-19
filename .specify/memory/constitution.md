# Round Trip Constitution

**Purpose:** help network engineers who are new to automation tell apart three things that are
easy to confuse (what a script sent, what the router holds in its configuration, and what traffic
does) by placing code cards into a Netmiko-style script and watching a ping between two simulated
routers.

**Scope:** one mechanic, seven short rounds that build to a challenging last one, and a browser.
A learner who finishes MUST be left able to try writing a Netmiko script of their own: the last
round has them assemble a whole script, and the game hands that script back as real code. The
first build was four rounds in 90 minutes with a coding agent; the scope changes only by amending
this document.

## Core Principles

### I. Technical truth is a release requirement

- The game MUST NOT mark a round solved unless the simulator, applying the documented rules
  to the round's starting state and the placed cards, delivers both the request and the reply.
  In a round with a reload check that means the ping after both routers reload.
- Every outcome MUST be computed by the simulator. Every Run MUST start from the round's starting
  state, so the result depends only on the round and the cards placed.
- Each rule MUST carry a reference with a link and section. A rule with no source, or with only a
  community source, MUST be labelled as such in the spec and README until one is found.
- Router messages MUST be shown as quotations only after they are captured from a real IOS or
  IOS XE device. Until then the feedback paraphrases what the router did.
- Simplifications and exclusions that affect what a player can conclude MUST appear on the round's
  screen and in the README. The diagram and animation illustrate a rule and MUST NOT change it.
- A round whose tray cannot fill its slots, or that has no solving placement, is an authoring
  error: the game MUST show a content error naming the round and MUST NOT grade it.

**Rationale:** the learners will carry these rules to real routers. A game that rewards a wrong
script teaches the misconception it exists to remove.

**Evidence:** every placement of every round runs in tests against expected results that were
worked by hand, not produced by the evaluator. A round with 40 placements or fewer lists each
placement and its result. A larger round is checked two ways, both written by hand without calling
the simulator: a rule that says, for any placement, whether it solves the round and whether the
script crashes, applied to every placement; and a named case for each distinct kind of outcome.
Also: a reference for each rule; the author, in a
review pass separate from the build, checks each rule against its reference and reviews every
shipped note and explanation.

### II. Every round teaches through a decision

- The player's only action is placing cards and pressing Run, and that action MUST exercise the
  round's learning outcome.
- A round MUST open straight on its play screen. There is no page to read before playing. The
  round's one new idea MUST be on that screen, above the script, from the moment the round opens.
  A worked example that differs from the challenge, and the model limits, MUST be one action away
  on the same screen.
- The game teaches how Netmiko works. What each Netmiko call does MUST be written beside that
  call in the script. Every Run's log MUST show, for each script line, what Netmiko sent to the
  router, beside what the router did with it. What Netmiko sends MUST be taken from Netmiko's
  source and referenced.
- The values needed to reason about the answer MUST be on the play screen throughout a round and
  shown by default: every interface address, both router state panels, the full script, and the
  run counter. Each router's state is shown on a card under that router in the diagram; pointing
  at a router, or a details control on its card, may show extra detail, but nothing needed to
  reason about the round may be only there. The player may collapse the log, trace and explanation
  panels. A collapsed panel keeps its heading and reopens with one action, and the game MUST NOT
  collapse or reopen a panel by itself.
- Feedback on every Run MUST say, in this order, what the router did with each line, where the
  traffic stopped, and the rule that explains it. A failed Run names the specific mistake; a
  solving Run explains why it works.
- Rounds follow this sequence, each adding one skill of writing a script: the order of
  configuration lines and silent rejection → choosing which router to connect to → a route in
  each direction → saving a change → saving inside a loop → putting the calls themselves in
  order → assembling a whole script. The last round MUST be the hardest and MUST use every
  earlier skill.
- After the last round the game MUST show the script the player assembled as complete Netmiko
  code they can copy, with what they would change to run it on a real network.
- Each round has exactly one hint. The hint MUST explain the method without naming a card.

**Rationale:** the misconception is that a script that ran without crashing fixed the network.
Only a decision followed by a visible consequence dislodges it.

**Evidence:** the author can connect each card placement to its learning outcome and can say, from the
feedback alone, what a deliberately wrong placement teaches.

### III. Progress is honest and retry is safe

- A round completes only on a Run with every slot filled that ends in a completed round trip.
- A failed Run MUST leave the round playable with the cards still placed.
- A Run with an empty slot MUST give guidance naming that slot and MUST NOT change the run count
  or completion.
- A solving Run completes the round exactly once. Run MUST be disabled once that Run's playback
  ends; a press during its playback only replays it (Principle VIII). The state logic MUST guard
  against a second count or completion independently of the button.
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
- The script log and the ping trace MUST be text, MUST stay on screen unless the player has
  collapsed their panel, and MUST be announced to assistive technology. Success and failure MUST be conveyed in text as well as colour.
- With reduced motion set, the log and trace text MUST appear immediately with no information
  lost. Animation MUST never delay feedback or controls.
- Nothing needed to reason about a round may be hidden behind hover.
- The game MUST remain usable on a typical laptop and in a narrow browser window. Dense panels may
  scroll inside their own labelled container without hiding the action buttons.

**Rationale:** the workshop audience uses a range of devices and assistive technology, and a text
trace is also the easiest thing to test.

**Evidence:** the author completes every round using only the keyboard; a narrow-window check;
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
verified exhaustively: every placement of every round is run.

**Evidence:** a clean browser session plays every round from the project's static files, and
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
interface code, and the rule check in Principle I depends on that.

**Evidence:** inspect one round's data, trace one placement through the simulator to its feedback,
and add a trial round without modifying the simulator.

### VII. Done is demonstrated

- Only the agreed scope ships. The spec, plan, tasks and README MUST describe the same game.
- A feature is complete when its acceptance criteria pass and the result is recorded. A
  screenshot, a ticked task box, or the agent saying "done" is not evidence on its own.
- Every acceptance criterion MUST have a recorded result of pass, fail or not run. Failed and
  unrun checks stay visible.
- When time runs short, scope is cut explicitly and in this order: the last round first, then
  the line-by-line highlight. These MUST NOT be cut: simulator-computed outcomes, the reset on
  every Run, the text trace, the round on a route in each direction, and the test of every
  placement.
- Incorrect teaching and broken core interactions MUST be fixed before any visual polish.

**Rationale:** the workshop is about engineering the loop between a spec and an agent. That loop
is only as good as its evidence.

**Evidence:** run and test commands that reproduce from a fresh checkout, recorded verification
results, a fresh-start playthrough, and a README another attendee can follow.

### VIII. The player never waits, and the ping is always showing

- A Run MUST be counted and its outcome applied at the moment Run is pressed. Playback only
  presents that result.
- No animation or playback may disable or delay a control. While a Run plays, the player MUST be
  able to skip to the result, replay it, change a card (while the round is unsolved), open the
  hint, restart, or (once the round is solved) press Next. Cards lock because a
  round is solved, never because a Run is playing. A replay MUST NOT count another Run.
- Throughout a round the diagram MUST show a ping in motion, repeating, against the state
  currently shown (the starting state or the result of the last Run). The ping is not something
  that appears only after a Run.
- Each packet MUST stop at the router, and for the reason, that the simulator computed for the
  state shown: the link is down, the reply has no route back, a route was lost on reload. The same
  misconfiguration MUST look the same wherever it occurs. The animation MUST NOT decide or
  contradict an outcome, and the text trace MUST state the same result.
- The player MUST be able to pause and resume all motion, and to slow it down. Both act on a
  Run's playback and on the repeating ping. Pausing freezes motion only: every other control
  keeps working, and a Run pressed while paused is still counted at once.
- With reduced motion set, the repeating ping is replaced by a still marker at the point where
  the packet stops, with the same text.

**Rationale:** a learner made to sit through an animation stops experimenting, and a ping that is
always visible keeps "what traffic does" in front of the player beside what the script sent and
what the router holds. If the picture ever disagreed with the simulator it would teach the wrong
rule.

**Evidence:** during a Run, every control responds at once and the counter moves once; for each
kind of failure (link down, one-way route, route lost on reload) the dot stops at the router the
text trace names; a reduced-motion check shows the still marker and the same text.

## Scope and Model Boundaries

- **Model:** a simplified Cisco IOS behaviour model driven by Netmiko method names, on one fixed
  topology (hostA, r1, r2, hostB). Host addresses, gateways and router interface addresses are
  correct and preconfigured. There is no default route.
- **Script language:** a fixed scaffold with typed slots (device, config line, statement). The
  only calls are `ConnectHandler`, `send_config_set`, `send_command` and `save_config`, plus one
  `for` loop form and a no-op `print`. A statement slot can take any of those calls, so a round
  can ask the player to place the calls themselves. A call that uses `conn` before any
  `ConnectHandler` has run stops the script, as Python would. A card fits only slots of its type
  and is used at most once per round.
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
- **First slice:** the simulator and the test of every placement come before any interface work.
  Expected results in that test are the hand-written ones from the spec and MUST NOT be computed
  by calling the simulator under test. A test run that discovers zero tests is a failure.
- **Before release:** every acceptance criterion has a recorded result; the author has completed
  a keyboard-only playthrough and has checked each rule against its reference; the README states what was built, the exact run and test commands, and the remaining limits.
- **Open items carried from the spec:** sources for rules 1 and 2, and captures of the two router
  messages. Each is either closed or listed in the README as a known limit at release.

## Governance

This constitution takes precedence over the spec, plan, tasks and agent instructions. Where they
conflict, the other document is corrected or this one is amended openly.

- **Amendment:** for any material change, record the reason, update the affected spec and plan,
  and rerun analysis. The project has a single author, who decides amendments.
- **Self-checks:** where a principle's Evidence names the author, the check is a self-check. It
  MUST be recorded as a self-check and MUST NOT be presented as independent review. When another
  person does check the game, their result is recorded beside the author's.
- **No convenience weakening:** the build agent MUST NOT relax a principle, an expected result or
  a test to make its implementation pass. It reports the conflict instead.
- **Versioning:** semantic. MAJOR for removing or redefining a principle, MINOR for adding a
  principle or section or materially expanding one, PATCH for clarification and wording.
- **Compliance review:** the plan includes a constitution check; analysis and the release review
  verify each principle against its Evidence line and record the result.

### Amendments

- **1.1.0 (2026-11-17):** added Principle VIII and reworded the solving-Run rule in Principle III.
  Reason: analysis found that "Run MUST be disabled afterwards" conflicted with the clarified
  rule that playback never blocks the player, and the project owner asked that the ping be on
  screen at all times and always stop where the simulated misconfiguration stops it.

- **1.1.1 (2026-11-17):** clarified in Principle VIII that a card can be changed during playback
  only while the round is unsolved. Reason: analysis found that the unqualified wording conflicted
  with cards locking as soon as a round is solved.

- **1.2.0 (2026-11-17):** release evidence that named a teammate, a second person or the
  workshop group now names the author, and a Self-checks rule was added to Governance. Reason: the
  project is built by one person, so those checks could only ever have been recorded as not run.
  A self-check is weaker evidence than the independent one it replaces, which is why it must be
  labelled.

- **2.0.0 (2026-11-17):** Principle II redefined in three places, and Principle VIII extended.
  The separate briefing page before each round is removed: the round's idea sits on the play
  screen and the rest is one action away. Teaching how Netmiko works is now a requirement, through
  a note beside each call and a log of what Netmiko sent. The state, log, trace and explanation
  panels may be collapsed by the player. Pause and Slow are required. Reason: after playing the
  first build the author found the briefing page skippable, wanted the emphasis on Netmiko itself,
  and wanted control over the motion and over how much is on screen. MAJOR because a requirement
  of Principle II (a briefing before any slot can be filled) is removed.

- **2.0.1 (2026-11-17):** Principle II now says where router state is shown (a card under each
  router, with optional extra detail on hover or a details control) and drops router state from
  the list of collapsible panels. Reason: the state moved from a text panel into the diagram to
  make the screen less text heavy. PATCH: the requirement that the state is on screen by default
  is unchanged.

- **3.0.0 (2026-11-19):** the scope grows from four rounds to seven that build to a challenging
  last round, and a new aim is stated: the learner leaves able to try writing a Netmiko script.
  Principle II's round sequence is redefined and gains the requirement to hand back the assembled
  script. The script language now lets statement slots hold any call and adds a crash when `conn`
  is used before connecting. Principle I's evidence replaces "all 19 placements" with every
  placement of every round, with a hand-written rule plus named cases for rounds too large to
  list. Reason: the author asked for five to seven stages leading to a challenging level, with
  players coming away feeling they can try their own script. MAJOR because the scope and the
  round sequence are redefined.

**Version**: 3.0.0 | **Ratified**: 2026-11-17 | **Last Amended**: 2026-11-19
