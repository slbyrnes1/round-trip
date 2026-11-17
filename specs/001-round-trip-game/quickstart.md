# Quickstart: validating Round Trip

These commands and files do not exist until the feature is implemented. This is the guide for
checking it once it is.

## Prerequisites

- Python 3, for the local web server.
- A recent Node, for the tests (v26 was installed when this was written). The game itself needs only a browser.

## Run the game

From the repository root:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open <http://127.0.0.1:8000>. Opening `index.html` directly from disk is not supported, because
the page loads its modules and `data/rounds.json` over HTTP.

## Run the tests

```sh
node --test tests/
```

Expected: every test passes, and the simulator suite reports 19 cases with cases 1, 7, 11, 14 and
15 solved. A run that finds no tests is a failure.

| Suite | Establishes |
| --- | --- |
| `tests/simulator.test.js` | All 19 placements match the hand-written results in `tests/cases.js` (SC-001) |
| `tests/content.test.js` | `data/rounds.json` validates; each broken variant is rejected with the round named (FR-033) |
| `tests/state.test.js` | Empty-slot Run, repeated Run after solving, hint, first-run mark, Next, Restart confirm and cancel (AC4, AC6–AC9) |

## Manual checks

Record each as pass, fail or not run, with the date, browser and operating system. Contracts:
[content](contracts/content.md), [simulator](contracts/simulator.md), [play screen](contracts/ui.md).

| # | Do this | Expect | Covers |
| --- | --- | --- | --- |
| 1 | Load the page fresh | Round 1 briefing; no slot can be filled yet | AC1 |
| 2 | Round 1: place `interface GigabitEthernet0/1`, `no shutdown`; Run | Lines highlight in order, r1's interface row flashes, link lights, trace reads "Request delivered to hostB. Reply delivered to hostA.", explanation, Next enabled | AC2, AC5 |
| 3 | Reload the page. Round 1: place `no shutdown`, `interface GigabitEthernet0/1`; Run | Feedback says `no shutdown` was rejected and the script carried on; request dropped at r1; Runs: 1; cards still placed | AC3, AC7 |
| 4 | Change one card after that failed Run | Panels and diagram return to "Starting state"; log, trace and feedback remain | FR-019a |
| 5 | Remove a card; Run | Guidance names the empty slot; counter unchanged | AC4 |
| 6 | Select, place, return and swap a card | Each action shows motion and a status-line sentence | Play screen contract |
| 7 | During a Run, press Skip | Final log, trace and feedback appear at once; counted once | FR-011a |
| 8 | Open Hint, then Briefing, then close | Hint names no card; briefing closes to an unchanged round | AC6, FR-002a |
| 9 | Round 2: place `r1` and the route to 10.20.0.0/24; Run | "r1 already had this route…"; the request dot pauses at r1 and r2 with the route used highlighted; the reply stops at r2 with "no matching route"; the trace lists the same per router | Worked interaction, FR-012a |
| 10 | Round 3: place `print("done")`; Run | First ping completes, routers reload, second ping drops at r1 | FR-013 |
| 11 | Solve all four rounds; Next | Summary shows runs, hint use and first-run mark for each round | AC8 |
| 12 | Restart, Cancel; then Restart, Confirm | Cancel changes nothing; Confirm returns to the round 1 briefing | AC9 |
| 13 | Play all four rounds with the keyboard only | Every control reachable with visible focus | AC10, SC-004 |
| 14 | Set reduced motion; Run | Log and trace text appear at once, same wording as check 2 | AC11, SC-005 |
| 15 | Resize the window to 768 px wide; play a round | Every control reachable; no sideways page scroll | FR-032, SC-005a |
| 16 | Reload the page mid-session | Round 1 briefing; progress gone | FR-028 |
| 17 | Fresh clone, follow the README only | The game runs and the tests pass | SC-008 |
| 18 | On a touch screen, or with the browser's touch emulation, select a card then a slot | The card is placed, with the same status sentence as with a mouse | FR-006 |
| 19 | During a Run: press Run again; open Hint; open and close Briefing; open Restart and cancel; change a card | Run and the two returns restart the playback; Hint leaves it running; the card change ends it. The counter moves by one for the whole sequence | FR-011b |

## Release items that are not code

- A second person checks each rule in `data/rounds.json` against its source (SC-007).
- Capture the two router messages and set their `captured` flags, or list them as known limits.
- Find sources for rules 1 and 2, or list them as unsourced in the README.
