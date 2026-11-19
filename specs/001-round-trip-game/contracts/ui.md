# Contract: play screen

What the player can operate and what the page announces. This is the checklist for the keyboard,
reduced-motion and 768 px checks.

## Controls

Every control is a native button or a native disclosure (`details`/`summary`), reachable by Tab, with a
visible focus ring. Tab order on the play screen: About this round, Pause, Slow, cards, slots, Run,
Skip, Reset routers, Hint, Next, the three panel headings, Restart. The two router details buttons come
before Pause.

| Control | Accessible name | Available | Effect |
| --- | --- | --- | --- |
| About this round | "About this round: a worked example, what the model leaves out, sources" | Always during a round; closed when a round opens | A native disclosure. Shows how to read the state panel, the worked example, the model limits and the sources. Records nothing and changes nothing in the round |
| Pause | "Pause", or "Resume" while paused | During a round; not shown with reduced motion | Freezes the repeating ping and any playback where they are; Resume carries on. Stays on until resumed. No other control is affected |
| Slow | "Slow", or "Normal speed" while slow | During a round; not shown with reduced motion | Runs the repeating ping and any playback at 0.4 of normal speed, until pressed again |
| Card | The card's text, plus "selected" when selected | In the tray, while the round is unsolved | Selects the card; selecting it again deselects |
| Slot | The slot's label, plus "empty" or the placed card's text | While the round is unsolved | With a card selected: places it. With none selected and the slot filled: returns its card to the tray |
| Run | "Run" | Enabled while the round is unsolved, and during the playback of any Run including the solving one. Disabled once a solved round's playback has ended | Starts a Run. During playback: restarts the playback, counting nothing |
| Skip | "Skip to result" | Only while a Run is playing | Shows the finished log, trace and feedback at once |
| Reset routers | "Reset routers" | While the round is unsolved | Panels, diagram and repeating ping return to the starting state, both routers saved. Cards, run count, log, trace and feedback are untouched. Ends a playback in progress. Does nothing when the starting state is already shown |
| Hint | "Hint" | Always during a round | Shows the hint and records its use |
| Next | "Next" | Enabled once the round is solved | Opens the next round on its play screen, or the summary after the last round in play |
| Panel heading × 3 | "Script log", "Ping trace", "What happened and why" | Once the round has had a Run | A native disclosure. Collapses or reopens its panel. All three are open at page load; the page never changes one by itself, including on Run and on Next |
| Router details × 2 | "r1 details", "r2 details" | Always during a round | A button on each router's card. Pins or unpins that router's pop-up (`aria-expanded`). Pointing at the router in the diagram shows the same pop-up while the pointer is there |
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
| Place a card, by selecting a slot or by dropping a dragged card on it | The card settles into the slot; the script line pulses once | Status line: "`<card>` placed in `<slot label>`." |
| Return a card | The slot empties; the card drops back into the tray | Status line: "`<card>` returned to the tray." |
| Swap | Both movements above, together | Status line names both cards |
| Any card change after a failed Run, or Reset routers | State panels and diagram cross-fade to the starting state; the ping repeats against it | State label changes to "Starting state"; the ping caption changes to the starting state's sentence |

## Regions

| Region | Content | Announced |
| --- | --- | --- |
| Diagram | The four nodes (hosts drawn as laptops, routers as round pucks), every interface address, link state as "up" or "down" in text, the state label, the repeating ping. hostA's face smiles when the reply reaches it and hostB's when the request does; decoration only | No |
| Ping caption | Under the diagram, beside the state label: the summary sentence of the ping now repeating, e.g. "Request dropped at r1.", or "After the reload: …" in rounds 3 and 4. Written when the state shown changes, never on a repeat | Yes, politely, once per change |
| Status bar | The wordmark and the level track: one node per round in play. Each node's accessible name says "Round n: in play", "not started", "solved" or "solved on the first run" | No |
| Ticket | The round's heading (which takes focus when a round opens), "Ticket #n", an Open or Resolved stamp, hostA's face and its complaint (its thanks once resolved), the two goal lamps, the round's idea as a tip line, and About this round. Resolved only once a solving Run has finished playing | No |
| Goal lamps | "→ request reaches hostB: yes / not yet / …" and "← reply reaches hostA: …". Set from the same ping as the ping caption; "…" while a Run's script is still playing; updated as each ping of a Run is traced, so in rounds 3 and 4 they can light and then go dark after the reload | No (the ping caption announces the same result) |
| Script | The scaffold with its slots. A line where Python stopped the script (rule 9) turns red and says "✕ NameError: the script stopped here" until a card changes or a new Run starts. A statement slot may hold a whole call. Above each call, a comment from the content's `callNotes` saying what Netmiko or Python does there; a statement slot gets its comment once a card is placed. The running line is marked with text ("running") as well as colour | No |
| Tray | Unplaced cards | No |
| Steps | "1 Pick a card", "2 Put it in a blank", "3 Run the script"; the current step is marked with `aria-current` as well as colour. None is marked once the round is solved | No |
| Router card × 2 | Under each router in the diagram: link state pill, saved badge, the routing table as chips (prefix, and "connected" or its next hop), and each static route that is configured but not installed, marked "configured, not installed". The pop-up adds the raw configuration lines and a legend | No |
| Take-away (summary view) | The last round's script as code with the added login lines marked, a Copy script button with a polite status beside it, and six next steps. Shown only when the last round in play was solved | Copy status only |
| Output placeholder | One line in place of the log, trace and explanation until the round's first Run | No |
| Status line | The result of the last card action, and empty-slot guidance | Yes, politely |
| Script log | A terminal transcript. One entry per executed step: the lines Netmiko sent (`Step.sent`), with what the router did as a short tag (a mark and the message's `short`) on the line that did it. A step that sends nothing is one comment line. The full sentence is the entry's tooltip. A captured router message, when there is one, is its own line | Yes, politely |
| Ping trace | For each ping: its phase, its summary sentence, and a row of hops per leg (hosts at the ends; each router with "via …", "connected" or "no route to …"), ending in "delivered" or "dropped". Formerly: one summary sentence per ping, e.g. "Request delivered to hostB. Reply dropped at r2.", then one line per router reached: the route it used, or "no matching route" | Yes, politely |
| Status line | Beside the buttons. The result of the last card action, empty-slot guidance, and, when a Run has finished playing, the verdict: an icon and "Solved!" or "Not solved yet." with a few words of context | Yes, politely |
| Stop bubble | On the card of the router where the deciding ping stopped: "The ping stops here:" and the reason in its short form. Gone when the starting state is shown again | No (the status line and the rules panel say the same) |
| Feedback | A "Stopped at" line naming the router and the reason in its short form, and each rule as its short form in a native disclosure that opens to the full text. It sits under the log and the trace, so the three read in the order router, traffic, rule | Yes, politely |

The log, trace and feedback remain on screen until the next Run replaces them. They always
describe the last Run; the ping caption describes the state now shown, which may be the starting
state.

## The repeating ping

A ping is in motion on the diagram for the whole round. It runs, rests about 1 s, and runs again.

| State shown | Ping that repeats | Detail |
| --- | --- | --- |
| Starting state (round opened, card changed, or Reset routers) | `openingPing` | Plain dot. It stops at the router where the packet is dropped, with a drop marker and no reason |
| After your last run | The last entry of `Result.pings` (in rounds 3 and 4, the ping after the reload) | The dot pauses at each router while the routing-table row it used is highlighted, or "no matching route" shows |

- Where each dot stops, and whether a reply is sent, comes only from the simulator's `Leg`
  (`delivered`, `droppedAt`, `hops`). The page never works out a drop itself.
- A drop looks the same wherever it happens: the same marker on the router, and in the detailed
  form the same wording for the same reason code.
- A repeat writes no text and announces nothing.
- The repeating ping never disables, covers or delays a control.
- With reduced motion set there is no moving dot: a still drop marker sits on the router where the
  packet stops (or a "delivered" mark on both hosts), with the same caption.

## Playback

A Run plays in this order: each step (line highlight, state row flash, log line), then the ping
(the dot pauses at each router while the routing-table row it used is highlighted, or "no matching
route" is shown, and the trace lines appear), then for rounds 3 and 4 the reload (panels change, log line) and the
second ping, then the feedback. When playback ends, by itself or by Skip, the last ping carries on
repeating as described above. Skip and reduced motion both show the same final text immediately.
Nothing is disabled during playback. The Run was counted and its outcome applied when Run was
pressed, so interrupting playback loses nothing:

- Run restarts the playback from the beginning.
- Skip shows the finished text at once.
- Hint opens beside the playback, which carries on.
- Restart then Cancel restarts the playback from the beginning on return.
- About this round opens and closes without touching the playback.
- Pause freezes the playback where it is; Resume carries on. A Run pressed while paused is counted at
  once, waits at its first step, and the status line says to press Resume or Skip.
- Slow runs it at 0.4 of normal speed.
- A card change, Reset routers or Next ends the playback.

Playback steps take about 400 ms each.

The opening ping on entering a round is the plain repeating ping: the dot moves without pausing
and the ping caption shows its summary sentence only, with no per-router lines. It has no Skip.

## Layout

- From 1100 px wide and 720 px tall: one board that fits the window, with no page scroll. The
  ticket strip across the top. Left: the script, and under it the script log as a terminal. Right:
  the network (diagram, the two router cards, the state label and caption, Pause and Slow), and
  under it the ping trace and the rules. Bottom: the hand of cards on the left; Run, Skip, Reset
  routers, Hint, Next, the run counter and the status line on the right. The script, the terminal
  and the results area scroll inside themselves. Restart is in the status bar.
- Wide but shorter than 720 px: the same arrangement, and the page scrolls.
- Narrower than 1100 px: one column, in the order ticket, network and results, cards, script and
  terminal, buttons; the page scrolls. The Tab order is the same at every size: About this round,
  cards, blanks, the script log, Run, Skip, Reset routers, Hint, Next, the router details buttons,
  Pause, Slow, the trace and rules headings, Restart.
- At 768 px: the one-column arrangement. The script, the terminal and the results may scroll
  inside their own labelled areas. No control needs the page to scroll sideways.
- Below 768 px: the same one column; not checked in this version.

## Focus

- When a round opens, focus moves to the round's heading.
- Opening the hint, the restart confirmation or the summary moves focus to its heading; closing
  returns focus to the control that opened it.
- When a Run's playback ends, focus moves only if it is still on Run or Skip: it goes to Run if
  the round is unsolved and to Next if it is solved. Focus that the player has moved elsewhere is
  left alone.
- When Skip goes away while it has focus, the same rule applies.
