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
- **Rationale:** the second reviewer reads every shipped sentence in one file (constitution I),
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
