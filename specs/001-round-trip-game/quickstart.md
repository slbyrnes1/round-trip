# Quickstart: validating Round Trip

These commands and files do not exist until the feature is implemented. This is the guide for
checking it once it is.

## Prerequisites

- Python 3, for the local web server.
- A recent Node, for the tests (v26 was installed when this was written). The game itself needs only a browser.

## Run the game

From the repository root:

```sh
python3 serve.py
```

`serve.py` serves the folder with caching turned off. With a server that allows caching, reload
without the cache (Cmd+Shift+R or Ctrl+Shift+R) after any change to the game's files.

Open <http://127.0.0.1:8000>. Opening `index.html` directly from disk is not supported, because
the page loads its modules and `data/rounds.json` over HTTP.

## Run the tests

```sh
node --test tests/
```

Expected: 110 tests pass. The simulator suite runs 47 hand-worked cases, with cases 1, 7, 11, 14,
15, 20, 32, 38 and 39 solved, and the last round's suite runs all 720 of its placements against a
hand-written rule, with exactly 4 solved. A run that finds no tests is a failure.

| Suite | Establishes |
| --- | --- |
| `tests/simulator.test.js` | Every placement of the six smaller rounds, and ten named cases of the last, match the hand-written results in `tests/cases.js` (SC-001) |
| `tests/whole-script.test.js` | All 720 placements of *The whole script* match a rule written by hand in the test, which never calls the simulator (SC-001) |
| `tests/content.test.js` | `data/rounds.json` validates; each broken variant is rejected with the round named (FR-033) |
| `tests/state.test.js` | Empty-slot Run, repeated Run after solving, replay during playback, Reset routers, hint, first-run mark, Next, Restart (AC4, AC6–AC9, FR-011b, FR-019b) |
| `tests/feedback.test.js` | The sentences AC2 and AC3 require; per-router trace lines; no quotation while uncaptured (FR-012a, FR-018) |

## Manual checks

Record each as pass, fail or not run, with the date, browser and operating system. Contracts:
[content](contracts/content.md), [simulator](contracts/simulator.md), [play screen](contracts/ui.md).

| # | Do this | Expect | Covers |
| --- | --- | --- | --- |
| 1 | Load the page fresh | Round 1's play screen, with no page to read first: its idea above the script, a note beside each call, cards ready to place | AC1, FR-001, FR-002a |
| 2 | Round 1: place `interface GigabitEthernet0/1`, `no shutdown`; Run | Lines highlight in order, r1's interface row flashes, link lights, trace reads "Request delivered to hostB. Reply delivered to hostA.", explanation, Next enabled | AC2, AC5 |
| 3 | Reload the page. Round 1: place `no shutdown`, `interface GigabitEthernet0/1`; Run | Feedback says `no shutdown` was rejected and the script carried on; request dropped at r1; Runs: 1; cards still placed | AC3, AC7 |
| 4 | Change one card after that failed Run | Panels and diagram return to "Starting state"; log, trace and feedback remain | FR-019a |
| 5 | Remove a card; Run | Guidance names the empty slot; counter unchanged | AC4 |
| 6 | Select, place, return and swap a card | Each action shows motion and a status-line sentence | Play screen contract |
| 7 | During a Run, press Skip | Final log, trace and feedback appear at once; counted once | FR-011a |
| 8 | Open Hint and close it; open About this round and close it | Hint names no card; About shows the worked example, limits and sources; the round is unchanged | AC6, FR-001 |
| 9 | *A route in each direction*: place `r1` and the route to 10.20.0.0/24; Run | "r1 already had this route…"; the request dot pauses at r1 and r2 with the route used highlighted; the reply stops at r2 with "no matching route"; the trace lists the same per router | Worked interaction, FR-012a |
| 10 | *Working is not saved*: place `print("done")`; Run | First ping completes, routers reload, second ping drops at r1 | FR-013 |
| 11 | Solve all seven rounds; Next | Summary shows runs, hint use and first-run mark for each round | AC8 |
| 12 | Restart, Cancel; then Restart, Confirm | Cancel changes nothing; Confirm returns to round 1 | AC9 |
| 13 | Play all seven rounds with the keyboard only | Every control reachable with visible focus | AC10, SC-004 |
| 14 | Set reduced motion; open a round; Run | No moving dot: a still marker where the packet stops, with the caption. Log and trace text appear at once, same wording as check 2 | AC11, SC-005, FR-012b |
| 15 | Resize the window to 768 px wide; play a round | One column, network first. Every control reachable; no sideways page scroll | FR-032, SC-005a |
| 16 | Reload the page mid-session | Round 1; progress gone | FR-028 |
| 17 | Fresh clone, follow the README only | The game runs and the tests pass | SC-008 |
| 18 | On a touch screen, or with the browser's touch emulation, select a card then a slot | The card is placed, with the same status sentence as with a mouse | FR-006 |
| 19 | During a Run: press Run again; open Hint; open Restart and cancel; change a card | Run and the cancelled restart start the playback again; Hint leaves it running; the card change ends it. The counter moves by one for the whole sequence | FR-011b |
| 20 | Open rounds 1 and 2 and wait; then make a failed Run in round 2 and wait; then check 10's Run in round 3 and wait | Before any Run a plain dot repeats and stops at r1 (round 1) and on the reply at r2 (round 2), matching the caption. After the Run the repeat pauses at each router with the route highlighted. In round 3 only the ping after the reload repeats. No control is ever disabled by the ping | FR-003, FR-012a, FR-012b, FR-013, constitution VIII |
| 21 | After a failed Run, press Reset routers; then press Run | Panels, diagram and ping return to "Starting state", both routers saved; cards, counter, log, trace and feedback unchanged. The Run that follows gives the same result as before | FR-019b, FR-010 |
| 22 | Solve a round and press Run during its playback, then again after it ends | During playback it replays and nothing is counted; afterwards Run is disabled | FR-022, AC7 |
| 23 | With the ping moving, press Pause; select a card; press Resume; press Slow; press Run, then Pause during it | Pause freezes the dot where it is and every other control still works; Resume carries on; Slow runs at well under half speed; the Run is counted at the press and its playback freezes and resumes | FR-012c |
| 24 | After a Run, collapse each of Script log, Ping trace and What happened and why; press Run; press Next | Each collapses to its heading and reopens with one action; none reopens by itself on Run or in the next round; all three are open on a fresh load. Before a round's first Run one line stands in their place | FR-004a |
| 25 | Round 1 wrong order, then round 4 with `save_config()` after the loop | The log shows `r1# configure terminal`, `r1(config)# no shutdown`, `r1(config)# interface GigabitEthernet0/1`, `r1(config-if)# end`; in round 4 `write mem` is sent to r2 only. Placing a statement card shows its note in the script | FR-015a, FR-002a |
| 26 | On a fresh round: watch the step strip while you pick a card, place it, and fill the last blank; then drag a card onto a blank | Step 1, then 2, then 1 again, then 3 with Run glowing; blanks glow while a card is picked; a dragged card lands and the status line says so | FR-006, FR-006a |
| 27 | Read each router's card; point at r1 in the diagram; press r2's details button, run a script, press it again | State is readable without hovering; the pop-up shows under the router pointed at and goes when the pointer leaves; the pinned pop-up survives the Run and closes on the second press; during a ping the route used lights on the card | FR-019c, FR-012a |
| 28 | Compare the screen before and after a Run | One or two short sentences of idea; one short note per call; the explanation gives the verdict, where the traffic stopped and the rule, without repeating the log | FR-001, FR-015 |
| 29 | Play rounds 1 to 3, solving round 1 on the first Run and failing once in rounds 2 and 3 | Round 1 opens with both lamps "not yet" and a sad hostA; solving it lights both, stamps the ticket Resolved with hostA's thanks, and stars node 1 on the track. Round 2 opens with the request lamp lit and the reply lamp dark. In round 3 a failed Run lights both lamps after the first ping and darkens them after the reload. Nothing is stamped or ticked until a solving Run has finished playing | FR-001a |
| 30 | *The other end*: connect to `r1` with `interface GigabitEthernet0/1` then `no shutdown`; Run. Then change the router card to `r2` | First: both lines accepted, "nothing changed", request still dropped at r1. Then: solved | Cases 26 and 20 |
| 31 | *Calls in order*: place config, connect, save; Run. Then connect, save, config. Then connect, config, save | First: the first line turns red with "NameError: the script stopped here", one log entry, rule 9 cited, and the mark stays until a card changes. Second: works, then the route is lost at the reload. Third: solved | Rule 9, cases 34, 33, 32 |
| 32 | *The whole script*: try save after the loop; a call before the connect; the link card after the save; then connect, link, route, save with print after the loop | In turn: r1 loses everything at the reload (rule 7); crash (rule 9); "GigabitEthernet0/1 on r1 is shut down again" and the saved route is not installed; solved | Cases 40, 44, 43, 38 |
| 33 | Finish the last round; Next; press Copy script | The summary shows the script as you placed it, with the login lines highlighted and six next steps. Copy says "Copied.", or selects the text and says how to copy it. Pasted into a file, it is valid Python | FR-025a |
| 34 | Make a failed Run in round 1 (wrong order) and read only what is on screen, without hovering | The transcript shows `r1(config)# no shutdown` tagged "rejected: no interface selected. Script carries on"; the trace is one row of hops ending "dropped"; the explanation is the verdict, a "Stopped at" line and four one-line rules, each opening to its full text. Nothing a player needs is only in a tooltip | FR-015, FR-016, FR-012a |
| 35 | In a window about 1280 by 800 or larger, play the first and last rounds, failing once in each | Nothing on the page scrolls: script left, network right, cards and buttons along the bottom. During a Run the terminal fills in under the script. After a failed Run the router where the ping stopped has a bubble saying why, and the verdict is beside Run. After solving, Next takes the bright look | FR-032a |

## Release items that are not code

- The author checks each rule in `data/rounds.json` against its source, in a pass separate from the build, recorded as a self-check (SC-007).
- Capture the two router messages and set their `captured` flags, or list them as known limits.
- Find sources for rules 1 and 2, or list them as unsourced in the README.
