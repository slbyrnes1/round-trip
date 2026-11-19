# Research: Round Trip — first playable game

No unknowns remained in the Technical Context after clarification. These are the design decisions
the plan rests on.

## 1. Stack

- **Decision:** semantic HTML, CSS and native JavaScript modules, served as static files. No
  framework, bundler, backend or package dependencies.
- **Rationale:** the starter plan's default; fits a 90-minute build; satisfies constitution V
  (self-contained) with nothing to install.
- **Alternatives considered:** a component framework (build step and setup time for a single
  screen); a canvas or game library (loses native buttons, focus and text, which constitution IV
  requires).

## 2. How a round's script is stored

- **Decision:** a short list of structured statements with slots in place, executed directly by
  the simulator and rendered to Python text by one function. See
  [contracts/content.md](contracts/content.md).
- **Rationale:** what the player reads and what runs come from the same data, so they cannot
  disagree (constitution VI). No Python parser is needed.
- **Alternatives considered:** Python text with slot markers (needs a parser, and display and
  behaviour can drift); a per-round table of placements and outcomes (an answer key, which
  constitution I and VI forbid).

## 3. Configuration lines are strings with one grammar

- **Decision:** starting routes, scaffold lines and config-line cards are all stored as the IOS
  line itself, parsed by one four-form grammar.
- **Rationale:** the simulator has to parse card lines anyway, so starting state reuses that
  parser. The state panel shows routes as they appear in a running configuration.
- **Alternatives considered:** structured route objects for starting state (a second
  representation of the same thing).

## 4. Starting state is one configuration per router

- **Decision:** `start` gives one configuration per router; the startup configuration begins
  equal to it.
- **Rationale:** all four rounds start saved.
- **Limit:** a future round that starts with unsaved changes needs a separate startup field.

## 5. Round 4's loop supplies each router's own route

- **Decision:** a `config` statement inside a `for` may carry `linesByDevice`. It renders as a
  `routes = {...}` line above the loop and `conn.send_config_set(routes[device["host"]])` inside
  it.
- **Rationale:** the spec says "the loop adds each router's route", and the two routers need
  different routes. This resolves the open assumption in the spec.
- **Alternatives considered:** two separate `send_config_set` calls outside a loop (removes the
  loop that rule 7 is about).

## 6. Feedback wording lives in data, keyed by reason code

- **Decision:** the simulator emits reason codes and values; `messages` in the content file maps
  each code to wording and rule numbers. Real router messages sit in `routerMessages` with a
  `captured` flag and are quoted only when it is `true`.
- **Rationale:** the rule check reads every shipped sentence in one file (constitution I),
  and FR-018 becomes a data flag that is flipped when the captures arrive.
- **Alternatives considered:** wording inside the feedback module (reviewer must read code);
  free-text feedback per placement (an answer key in disguise).

## 7. Solvability is checked by enumeration

- **Decision:** the content validator runs every complete placement of a round through the
  simulator and requires at least one to solve it.
- **Rationale:** FR-033 requires it, and the largest round has 6 placements.
- **Limit:** factorial growth; a much larger round needs a cap.

## 8. One playback path

- **Decision:** a Run is computed in full first. Playback then walks the result's steps with a
  delay between them; Skip and reduced motion run the same walk with a delay of zero.
- **Rationale:** the text shown is identical in all three modes by construction (FR-011a, FR-031),
  and the outcome can never depend on animation.
- **Alternatives considered:** separate animated and static renderers (two things to keep in
  step).

## 9. Motion

- **Decision:** CSS transitions and keyframes toggled by classes; an inline SVG diagram. The
  topology is a straight line, so traffic dots are a horizontal translate. A
  `prefers-reduced-motion` media query removes the motion.
- **Rationale:** no library, and the card, script-line, state-row and dot effects the starter plan
  owner asked for are all class toggles.
- **Alternatives considered:** an animation library (a dependency for effects CSS already does);
  canvas (no text or focus).

## 10. Tests

- **Decision:** Node's built-in test runner, `node --test tests/`, importing the same pure engine
  modules the page uses. No browser test page.
- **Rationale:** zero dependencies, one command, and the build agent can run it itself after
  every change. The engine has no page code in it, so nothing is lost by testing outside a
  browser.
- **Deviation from the starter plan,** which suggests a browser runner at `tests/index.html`. An
  attendee without Node cannot run the tests; the README says so.
- **Alternatives considered:** the browser runner (the agent cannot read its result without
  browser automation); both (two runners to maintain).

## 11. Card placement

- **Decision:** cards and slots are native buttons. Select a card, then a slot. Placing into a
  filled slot of the same type swaps. A slot of the wrong type refuses with a text message.
- **Rationale:** one interaction for mouse, touch and keyboard (FR-006); resolves the spec's
  remaining wrong-type assumption.
- **Alternatives considered:** drag-and-drop first (a stretch feature in the spec; pointer-only).

## 12. Session state

- **Decision:** one in-memory object owned by `engine/state.js`, changed only through named
  transitions. Nothing is stored in the browser.
- **Rationale:** FR-028; and the guard against double completion (FR-022) lives in one place.

## 13. The repeating ping

- **Decision:** `ui/playback.js` has one ping walker, used both inside a Run's playback and for
  the ping that repeats afterwards. It takes a `Ping` and a detail flag, and repeats with a rest of
  about 1 s. Against the starting state it walks `openingPing` plainly; against the last Run it
  walks the last entry of `Result.pings` with the per-router pause. With reduced motion it draws a
  still marker once and does not repeat.
- **Rationale:** constitution VIII and FR-012b. One walker means the repeat cannot stop anywhere
  other than where the playback stopped, and both read the simulator's `Leg`. No new simulator
  function is needed.
- **Alternatives considered:** a CSS-only infinite animation (cannot pause at a router in step
  with the row highlight); a second, simpler animation for the repeat (two things to keep in
  step).
- **Limit:** the ping moves for as long as a round is open. Reduced motion is the only way to
  stop it; a Pause control was offered in clarification and not chosen.

## 14. Text for the repeating ping

- **Decision:** a ping caption under the diagram holds the summary sentence of the ping now
  repeating. It is rewritten only when the state shown changes. The trace region keeps the last
  Run's trace.
- **Rationale:** after a card change the panels show the starting state while the last Run's
  trace stays on screen (FR-019a). Without a caption the moving dot and the nearest text would
  describe different states. Writing once per change keeps a screen reader from hearing every
  repeat.

## 15. Reset routers is a view change

- **Decision:** one state transition that sets `showing` to `start` and ends playback. It touches
  nothing else.
- **Rationale:** every Run already starts from the starting state (FR-010), and that state is
  always saved, so there is no router state to reset; the control only changes what is displayed
  (FR-019b).

## 16. Restart confirmation

- **Decision:** the restart confirmation is a page dialog with no session field.
- **Rationale:** the session changes only on Confirm, so Cancel has nothing to undo. (The `started`
  flag this decision once added went away with the briefing page; see decision 17.)

## 17. No page before a round

- **Decision:** the `briefing` view and its Start/Close control are removed. A round opens on the
  play screen. `briefing.idea` is shown above the script; `terms`, `workedExample`, `limits` and
  the sources sit in a native `details`, closed when a round opens.
- **Rationale:** the author found the page skippable after playing the first build. The idea the
  round needs is one or two sentences and reads better next to the script it is about.
- **Alternatives considered:** keeping the page but shortening it (still a click before playing);
  dropping the worked example and limits (constitution I and II require them on the round's
  screen).

## 18. Teaching Netmiko in place

- **Decision:** two additions. (a) `callNotes` in the content file holds one sentence per call;
  the script renders it as a `#` comment above every such call. (b) The simulator records on each
  step what Netmiko wrote to the router (`Step.sent`), and the log shows it above what the router
  did.
- **Rationale:** the lesson is what Netmiko does with a line of the player's script. A comment
  says it before the Run; the sent lines prove it after. `send_config_set` wrapping the lines in
  `configure terminal` and `end`, `(config)#` against `(config-if)#`, and `write mem` reaching one
  router or two are each visible this way without extra reading.
- **Source:** read on 2026-11-17 in Netmiko's `develop` branch: `config_mode` defaults to
  `configure terminal` and `exit_config_mode` to `end` (`cisco_base_connection.py`);
  `send_config_set` calls them first and last (`base_connection.py`); `save_config` on Cisco IOS
  sends `write mem`, and `session_preparation` sends `terminal width 511` and calls
  `disable_paging` (`cisco/cisco_ios.py`).
- **Limit:** the command `disable_paging` sends was not confirmed, so the log says "turns off
  paging" and does not name it. Prompts are the standard IOS forms built from the router's name;
  no router output is shown, so FR-018 (no uncaptured quotations) is not touched.
- **Alternatives considered:** a separate Netmiko glossary panel (text away from the code it
  explains); showing sent lines only in the explanation (the log is where each line is already
  listed).

## 19. Pause and Slow

- **Decision:** one shared pace object (`paused`, `rate`) in `ui/playback.js`. Every wait counts
  down against it, and the diagram applies it to the dot's animation. Slow is 0.4 of normal
  speed. Pause is sticky: it stays on until Resume, including across a Run and a new round. The
  two buttons are hidden with reduced motion.
- **Rationale:** one pace means playback and the repeating ping cannot disagree. Sticky pause
  respects a player who paused because motion bothers them. This also closes the earlier limit
  that the repeating ping could be stopped only by the system's reduced-motion setting.
- **Alternatives considered:** resuming automatically when Run is pressed (motion restarting
  unasked); a speed slider (two speeds are enough).

## 20. Collapsible panels

- **Decision:** Router state, Script log, Ping trace and What happened and why are native
  `details` elements, open in the markup. The page never sets their `open` state.
- **Rationale:** native disclosure gives keyboard operation and an accessible state for free, and
  because the elements persist across rounds, a panel stays as the player left it.
- **Limit:** a live region inside a collapsed panel is not announced. That is the player's choice,
  and the status line still reports every Run's result.

## 21. Making the mechanic visible

- **Decision:** a three-step strip whose current step is derived from the session (a card
  selected → step 2; every slot filled → step 3; otherwise step 1; none once solved); empty slots
  drawn as wide dashed gaps naming the card type; cards drawn raised with a grip; drag and drop
  added as the same two state transitions as select-then-select.
- **Rationale:** the first build showed slots as dashed text inside a code block, which read as
  code. Drag and drop was a stretch feature in the spec and is the gesture most players try first.
- **Detail:** the tray is not redrawn during a drag, because replacing the dragged element cancels
  the drag.

## 22. Router state in the diagram

- **Decision:** `renderPanels` draws a compact card under each router instead of a text panel in
  the right column. A pop-up with the raw configuration lines and a legend shows while the pointer
  is on the router in the diagram, or when pinned with the card's details button.
- **Rationale:** the author suggested state on hover. Hover-only would break the rule that nothing
  needed to reason about a round is hidden, so the needed state is on the card and only extras are
  in the pop-up.
- **Alternatives considered:** state only on hover (breaks constitution II and IV, and fails on
  touch and keyboard); keeping the text panel as well (the duplication the change set out to cut).

## 23. Less text

- **Decision:** shorter `idea` and `callNotes` in the content, with the fuller idea moved to the
  first entry of `terms`; one placeholder line instead of three empty panels before a round's
  first Run; the explanation panel no longer renders the per-line list, which the Script log
  directly above already gives.
- **Rationale:** FR-015's order (router, traffic, rule) is kept by the order of the three panels.
- **Not done:** the rule texts in the explanation are still shown in full, up to four of them. They
  are what the constitution requires the feedback to say; trimming which rules are cited would be
  a change to `engine/feedback.js`.

## 24. The top of the page as a game

- **Decision:** a status bar (wordmark and level track) and the round as a ticket from hostA: a
  face, a one-or-two-sentence complaint, an Open or Resolved stamp, and the goal as two lamps.
  The round's idea stays on screen as a one-line tip in the ticket. Hosts are drawn as laptops
  with faces and routers as pucks, all inline SVG, so there are still no image files to load.
- **Rationale:** the top was three lines of prose. The pass condition is the same every round
  (request delivered, reply delivered), so two lamps state the puzzle with no sentence: round 2
  opens with one lit and one dark, and in rounds 3 and 4 they light and then go dark at the reload.
- **Truth:** lamps, faces and stamp are set from the simulator's ping and the session, the same
  values the ping caption and summary give in text. The ticket and the track's tick wait until a
  solving Run has finished playing, so they do not give the result away early. Ticket wording is
  content (`ticket` in `data/rounds.json`) and gives the symptom only.
- **Not done:** a title card when a round opens.

## 25. Seven rounds, one skill each

- **Decision:** the four rounds of the first build stay, with three added: *The other end*
  (second), *Calls in order* (sixth) and *The whole script* (last). Round ids are names, not
  numbers. See the Curriculum table in the spec.
- **Rationale:** each round adds one thing a person writing a script has to get right: the order
  of lines, which device, both directions, saving, the loop, the order of calls, all of it. The
  last round uses every earlier one, and each kind of mistake in it fails the way the round that
  taught it failed.
- **Alternatives considered:** a third router or new protocols (more network, not more script);
  free typing (out of scope, and it cannot be checked exhaustively).

## 26. Cards that are calls, and rule 9

- **Decision:** a statement slot takes any statement, so a card can be `ConnectHandler` or a
  `send_config_set` call. A `config`, `save` or `show` that runs while `conn` has never been set
  ends execution with a `crashed` step. The loop variable, like `conn`, keeps its last value.
- **Rationale:** placing the calls is as close to writing a script as cards allow. Once the
  connect can be misplaced the simulator must say what Python does, and what it does is stop,
  which is the useful contrast with rule 8.
- **Limit:** only this one script error is modelled.

## 27. Testing a round too big to list, and the take-away

- **Decision:** `tests/whole-script.test.js` holds a rule, worked by hand and written without
  calling the simulator, for crashed, first ping and solved; it is applied to all 720 placements
  and the four solving scripts are listed by name. Ten named cases cover each kind of outcome.
- **Rationale:** constitution I requires expected results that do not come from the evaluator. A
  second, independent statement of the outcome, checked on every input, keeps that for a round
  that cannot be listed.
- **Take-away:** `realScript` builds the summary's code from the same `scriptLines` the play
  screen uses, with the solving placement filled in, so it cannot differ from what the player
  built. It adds only a prompted password and a username, and marks those lines. The session keeps
  each round's solving placement for this.
- **Checked:** the generated script compiles as Python. It was not run against Netmiko, which
  was not installed on the build machine.

## 28. Fewer words, same lesson

- **Decision:** change the form of the output, not its content. Messages and rules gain a `short`
  field; the log renders as a terminal transcript with the short outcome tagged on the line that
  caused it; the trace renders as hops; the explanation shows a verdict, one cause line and short
  rules that open to their full text; call notes become trailing comments.
- **Rationale:** what teaches Netmiko is the code, the lines Netmiko sent and the router's
  response. Those are all still on screen. What went is prose restating them.
- **Measured** (words on screen after a failed Run): round 1, 496 to 318; the last round, 748 to
  486. Before a Run: 273 to 215 and 284 to 226.
- **Constitution:** Principle II requires the feedback to say the rule. The short form is a
  statement of the rule, and the full text is one action away in a native disclosure. The full
  outcome sentence is a tooltip only, so it must never hold anything the short form lacks; a test
  checks that a rejected line's short form still says rejected, why, and that the script carries
  on.

## 29. A board that fits the window

- **Decision:** the play screen is a CSS grid filling the window: ticket strip, then script and
  terminal on the left and the network and results on the right, then the hand of cards and the
  buttons. The DOM order is the Tab order (cards, blanks, Run, ...), and grid areas place the
  parts, so the hand can sit at the bottom without the cards coming last for a keyboard player.
  The verdict is rendered into the status line beside Run and Next; the reason a ping stopped is a
  bubble on that router's card. The diagram is drawn on a 664-unit canvas so its text stays
  readable in half the window.
- **Rationale:** before this the script, the network and the explanation were in three different
  places and the page was about 1,400 px tall after a Run. Cause and effect are now in one glance.
- **Fallbacks:** below 720 px tall the same grid scrolls as a page; below 1100 px wide it becomes
  one column with the network first. A banner over the network was tried and dropped: it cost
  40 px of a short pane and repeated the status line.
- **Not done:** the terminal does not type character by character (lines appear one per step),
  and there is no celebration animation beyond hostA's face and the stamp.

