# Round Trip · Implementation plan

This is the workshop's planning input, brought into line with the working plan in `specs/001-round-trip-game/plan.md`. Where the two differ, the working plan and its contracts are authoritative.

## Build target

Implement the clarified specification for Round Trip within the workshop build block. First prove the rules with no page involved. Then deliver one complete round with correct outcomes, explanatory feedback, retry, and advance. Then add content and polish through the same implementation.

**Hardest behavior to get right:**

- *In the rules:* route installation (rule 3) together with persistence and the loop variable (rules 6 and 7). A route can be configured but not installed, and saved on one router but not the other.
- *On the page:* visual feedback that is engaging and still teaches, as the player places and swaps code cards and as a Run plays.

**First evidence we'll check:**

1. Cases 1 and 2 from the spec pass through the simulator, with no page involved.
2. On the page, every card action (select, place, return, swap) produces motion and a status-line sentence. With reduced motion set, the sentence appears alone.

## Stack and serving

- Semantic HTML, CSS, and native JavaScript modules. No framework, bundler, backend, or runtime model.
- Native buttons plus one inline SVG for the topology diagram. No rendering dependency.
- `data/rounds.json` for authored content; load it over HTTP using a relative URL.
- In-memory session state. Reload starts a fresh session, as specified. No persistence in v1.
- Static hosting, including a repository subpath such as GitHub Pages. Use relative asset paths and case-correct filenames.

Preview from the repository root after implementation creates `index.html`:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open **http://127.0.0.1:8000**. On Windows use `py` in place of `python3`. Native modules and JSON fetching need a web server; opening the HTML with `file://` is not the supported run path. [MDN reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules).

## Proposed files and responsibilities

```text
index.html                   Page shell, regions, module entry point
style.css                    Layout, focus, card and state motion, reduced motion
main.js                      Load → validate → start; wire controls to state and playback
engine/
  simulator.js               Pure: config-line grammar, apply script, routing table, ping, reload
  content.js                 Pure: validate data/rounds.json; enumerate placements for solvability
  state.js                   Pure: session object and its transitions
  feedback.js                Pure: result + messages → log lines, trace sentences, explanation
ui/
  render.js                  Briefing, round, summary and error views; script-to-Python text; diagram
  playback.js                Walk a result step by step; Skip and reduced motion use zero delay
data/
  rounds.json                Topology, sources, rules, messages, router messages, four rounds
tests/
  cases.js                   The 19 placements and hand-written expected results
  simulator.test.js          Runs the 19 cases; asserts the count and the five solved cases
  content.test.js            Shipped content validates; broken variants are rejected
  state.test.js              Counting, completion, hint, first-run mark, restart
  feedback.test.js           The exact sentences the acceptance criteria require
README.md                    Actual run instructions, behavior, and evidence
```

## Data contract

Define one document containing `schemaVersion`, `topology`, `sources`, `rules`, `messages`, `routerMessages` and `rounds`. This game has one mechanic and four rounds, so there is no level layer: `rounds` is a flat, ordered list. Each round has a unique ID, title, learning outcome, briefing, source IDs, one hint, a starting state, a script and a tray.

**Domain fields:**

- `topology`: hosts and routers by ID (`hostA`, `hostB`, `r1`, `r2`); each interface has a full name (`GigabitEthernet0/1`), an IPv4 dotted-quad `address`, and an integer `prefixLength` from 0 to 32. There are no units; nothing in the model is timed or measured.
- Each round has `start`: for each router, `shutdown` (a list of interface names) and `routes` (a list of `ip route …` lines). Every round starts saved.
- Each round has `script`: an ordered list of statements, each with an `op` of `connect`, `config`, `save`, `show`, `print` or `for`, with typed slots sitting where the blanks are. The page renders Python text from this list and the simulator executes the same list.
- Each round has `tray`: cards with an `id`, a `type` (`device`, `configLine` or `statement`) and a `value`.
- Configuration lines are strings in one of four forms: `interface <name>`, `no shutdown`, `shutdown`, `ip route <network> <mask> <next-hop>`.
- Each round also has `reloadCheck` (true or false): whether the Run pings, reloads both routers and pings again.
- A round may have `inPlay: false`, which takes it out of the play sequence while keeping it validated and tested.

**Choice representation:** a placement, which is a map from slot ID to card ID, for example `{ "in-loop": "show", "after-loop": "save" }`. It is complete when every slot holds a card of its own type and no card is used twice.

**Validation rules:** reject the file, naming the round, when any of these is true.

- A required field is missing or has the wrong type, or `schemaVersion` is not 1.
- A round, slot or card ID is duplicated.
- A router, interface or source ID does not exist.
- A configuration line does not match one of the four forms.
- A statement uses `conn` before any `connect`.
- The tray has fewer cards of a type than the round has slots of that type.
- No placement solves the round (found by running every placement through the simulator).
- Any placement leaves a router with two overlapping routes, which is this game's unsupported tie.
- The hint contains the text of a card.
- A reason code the simulator can report has no feedback message.

The full contract, with a worked round 4 example, is in `specs/001-round-trip-game/contracts/content.md`.

The loader must validate the whole content file before starting. Any content error stops the game and shows an error naming the round; it is never counted as a learner attempt. Briefings reference source records with a title, URL, section, and supported claim. All fixed wording lives in data; the values in a sentence are filled in from the simulator's result.

## Domain evaluation contract

```text
run(topology, round, placement) → {
  status: "solved" | "unsolved" | "invalid-input",
  emptySlots: slot IDs, for invalid-input only,
  steps: one entry per executed line, each with an outcome, a reason code,
         the state rows it changed, and the state after it,
  pings: one, or two when the round has a reload check; each with a request
         and a reply leg, and the route each router used,
  reload: the configuration each router lost, or null,
  finalState: both routers' interface state, routes, routing table and saved flag
}
startView(topology, round) → both routers' state before any Run
openingPing(topology, round) → the ping from the starting state
```

- These are pure functions: same inputs, same result; no DOM, timer, network, random choice, or score changes.
- Compute the result by building the round's starting state, substituting each slot with its card, executing the statements in order with one `conn` variable, deriving each router's routing table, forwarding the request and then the reply, and for rounds 3 and 4 reloading both routers and pinging again. The UI must not choose the correct answer by position, label, or animation destination.
- Distinguish a learner's unsolved Run from invalid input (an empty slot). Broken authored content is caught by the validator before any round is shown, and is never a result.
- There are no equivalent answers to define: a placement is exact. Round 4 has two solving placements because the simulator says so, not because a list does.
- Expected results in tests are the 19 hand-written cases from the spec. Don't calculate them by calling the simulator being tested.

**Feedback example:** round 2, placement `r1` with `ip route 10.20.0.0 255.255.255.0 192.0.2.2`. The step's reason code is `route-already-present` and the reply leg's is `drop-no-route` at r2. The feedback reads: "r1 already had this route, so nothing changed. The request still reaches hostB. The reply is dropped at r2: r2 has no route back to 10.10.0.0/24. Traffic needs a route in each direction."

The full contract, with every reason code, is in `specs/001-round-trip-game/contracts/simulator.md`.

## Session transitions

```text
loading → briefing → round
                     ├─ card selected, placed, returned or swapped → round (panels show the starting state)
                     ├─ Run with an empty slot → guidance → round (nothing counted)
                     ├─ Run → playing → unsolved → feedback → retry, cards still placed
                     └─ Run → playing → solved → feedback, cards locked → Next → next briefing or summary
loading with a content error → error screen naming the round
confirmed Restart → fresh first briefing
```

The state module owns run counts, hint use, solved rounds, the current round, the placement, and the current view. Selecting a card, opening the hint and reopening the briefing do not start a Run. Count a Run only when every slot is filled and the round is unsolved. A Run is counted and its outcome applied when Run is pressed, so playback never blocks the player: pressing Run during playback replays it without counting, and every other control stays available. Disable Run after success; guard it in state logic as well. Advance only through explicit Next. Restart requires confirmation; cancellation changes nothing.

## Interaction and visual direction

Translate the two-router diagram, which is the scoreboard, into a compact play screen: diagram on top, script and tray on the left, router state and trace on the right, with a persistent explanation area. Use a clear type hierarchy and one consistent visual language. Motion should reveal a consequence, such as the script line lighting up together with the state row it changed, the link lighting when both ends are enabled, and the traffic dot pausing at a router while the route it used is highlighted, then moving on or stopping there.

Every card action gets motion and a status sentence: the card lifts when selected, slots of its type glow, the card settles into its slot, and a displaced card drops back into the tray.

Use native controls, move focus deliberately after screen changes, and announce feedback through a live region. Respect `prefers-reduced-motion`. Display textual values alongside the diagram. A learner must not need animation, color vision, pointer precision, or hover to reason about the answer.

The full contract is in `specs/001-round-trip-game/contracts/ui.md`.

## Implementation order

| Slice | Deliverable | Evidence before the next slice |
| --- | --- | --- |
| 1 · Prove the rules | Simulator, content file with all four rounds, the 19 cases and their test | 19 of 19 pass under `node --test` |
| 2 · Guard the content | Content validator and its test | Shipped file validates; each broken variant names its round |
| 3 · One round, end to end | Session state, feedback, page shell, round 1 with briefing, cards, Run, text log and trace, retry, Next | One solving and one failing path work in the browser |
| 4 · Make it feel alive | Card motion, line highlight, state-row flash, traffic dots, Skip, reduced motion | Card actions and playback checked by hand |
| 5 · The whole game | Rounds 2–4 on the page, reload sequence, hint, briefing control, summary, restart | Fresh start to summary |
| 6 · Usable and packaged | Focus handling, 768 px layout, README with recorded results | Another attendee can run and explain the game |

The task list is `specs/001-round-trip-game/tasks.md`.

## Verification and reporting

Run the tests from the repository root with Node's built-in test runner. Node is needed for the tests only; playing needs just a browser.

```sh
node --test tests/
```

The simulator suite asserts that it ran exactly 19 cases, so an empty or truncated case list fails.

| Check | What must be established |
| --- | --- |
| Domain cases | All 19 placements match their hand-written results; exactly five solve |
| Input/content failures | A Run with an empty slot is not counted; malformed content cannot be played |
| State transitions | Retry, hint, repeated Run, round completion, final summary, restart and cancel |
| Source review | A second person checks each rule, briefing and explanation against its source |
| Browser playthrough | Fresh start to summary, keyboard-only, readable feedback |
| Layout/motion | Typical laptop, 768 px wide window, reduced motion |
| Hosting, if used | Assets and data load under the published repository path |

For each acceptance criterion, record **pass / fail / not run**, the date, environment, and evidence in the README. The tests check code behavior; a human still reviews the teaching content and the actual interaction. The manual checklist is `specs/001-round-trip-game/quickstart.md`.

## Scope controls

No persistence, multiplayer, runtime AI, procedural scenario generator, editor, or audio in v1. If time runs short, take round 4 out of play first, then cut the line-by-line highlight together with the per-router pause in the ping animation. Never cut the simulator-computed outcomes, the reset on every Run, the text trace, round 2, or the 19-placement test. Do not hide skipped checks or silently weaken correctness.
