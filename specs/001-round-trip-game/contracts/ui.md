# Contract: play screen

What the player can operate and what the page announces. This is the checklist for the keyboard,
reduced-motion and 768 px checks.

## Controls

Every control is a native button, reachable by Tab in the order below, with a visible focus ring.

| Control | Accessible name | Available | Effect |
| --- | --- | --- | --- |
| Briefing | "Briefing" | Always during a round | Opens the round's briefing; closing returns to the round unchanged |
| Card | The card's text, plus "selected" when selected | In the tray, while the round is unsolved | Selects the card; selecting it again deselects |
| Slot | The slot's label, plus "empty" or the placed card's text | While the round is unsolved | With a card selected: places it. With none selected and the slot filled: returns its card to the tray |
| Run | "Run" | Enabled when the round is unsolved, and during playback | Starts a Run. During playback: restarts the playback, counting nothing |
| Skip | "Skip to result" | Only while a Run is playing | Shows the finished log, trace and feedback at once |
| Hint | "Hint" | Always during a round | Shows the hint and records its use |
| Next | "Next" | Enabled once the round is solved | Opens the next briefing, or the summary after round 4 |
| Restart | "Restart" | Always | Opens a confirmation with Confirm and Cancel |

Placing a card into a filled slot of the same type swaps: the old card returns to the tray.
Selecting a slot of a different type from the selected card places nothing and shows a text
message naming the type the slot takes.

## Visual feedback on every card action

Each action below produces motion and a text change. With reduced motion set, the text change
happens alone and at once.

| Action | Motion | Text |
| --- | --- | --- |
| Select a card | The card lifts; slots of its type glow | Status line: "Selected `<card>`. Choose a slot." |
| Place a card | The card settles into the slot; the script line pulses once | Status line: "`<card>` placed in `<slot label>`." |
| Return a card | The slot empties; the card drops back into the tray | Status line: "`<card>` returned to the tray." |
| Swap | Both movements above, together | Status line names both cards |
| Any card change after a failed Run | State panels and diagram cross-fade to the starting state | State label changes to "Starting state" |

## Regions

| Region | Content | Announced |
| --- | --- | --- |
| Diagram | The four nodes, every interface address, link state as "up" or "down" in text, the state label | No |
| Script | The scaffold with its slots; the running line is marked with text ("running") as well as colour | No |
| Tray | Unplaced cards | No |
| State panel × 2 | Interface state, running routes, routing table, saved badge, the state label | No |
| Status line | The result of the last card action, and empty-slot guidance | Yes, politely |
| Script log | One text line per executed step: what was sent and what the router did | Yes, politely |
| Ping trace | One summary sentence per ping, e.g. "Request delivered to hostB. Reply dropped at r2.", then one line per router reached: the route it used, or "no matching route" | Yes, politely |
| Feedback | What the router did, where traffic stopped, the rule | Yes, politely |

The log, trace and feedback remain on screen until the next Run replaces them.

## Playback

A Run plays in this order: each step (line highlight, state row flash, log line), then the ping
(the dot pauses at each router while the routing-table row it used is highlighted, or "no matching
route" is shown, and the trace lines appear), then for rounds 3 and 4 the reload (panels change, log line) and the
second ping, then the feedback. Skip and reduced motion both show the same final text immediately.
Nothing is disabled during playback. The Run was counted and its outcome applied when Run was
pressed, so interrupting playback loses nothing:

- Run restarts the playback from the beginning.
- Skip shows the finished text at once.
- Hint opens beside the playback, which carries on.
- Briefing, and Restart then Cancel, restart the playback from the beginning on return.
- A card change or Next ends the playback.

The opening ping on entering a round is simpler: the dot moves without pausing and the trace shows
its summary sentence only, with no per-router lines. It has no Skip.

## Layout

- From 1024 px: diagram across the top; script and tray on the left; state panels, log, trace and
  feedback on the right.
- At 768 px: the same two columns, narrower. The state panels and the log may scroll inside their
  own labelled areas. Run, Skip, Hint, Next and Restart stay visible without scrolling the page
  sideways.
- Below 768 px: one column; not checked in this version.

## Focus

- Opening a briefing, the hint, the restart confirmation or the summary moves focus to its
  heading; closing returns focus to the control that opened it.
- After a Run ends, focus stays on Run if the round is unsolved and moves to Next if it is solved.
