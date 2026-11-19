# Feature Specification: Round Trip — first playable game

**Feature Branch**: `001-round-trip-game`

**Created**: 2026-11-17

**Status**: Clarified; revised 2026-11-19 for seven rounds

**Input**: User description: "Copy the ~/Desktop/SPEC.md into StarterKit, then ingest it and let's write a real SPEC.md based on it". Source document: `StarterKit/SPEC.md` (Round Trip · First playable specification). Governing document: `.specify/memory/constitution.md` v3.0.0.

## Summary

Round Trip is a browser game for network engineers who are new to automation. The player finishes a short Netmiko-style script by placing code cards into its blanks, runs it against two simulated routers, and watches whether a ping gets from hostA to hostB and back.

Each round shows a topology, the current state of both routers, and a script with blank slots. The player places cards from a tray into the slots and presses Run. A correct script ends with the request and the reply both delivered. An incorrect script shows the hop where traffic stopped and the script line that caused it. The session ends when all seven rounds are solved.

**The misconception the game targets:** people believe a script that ran without crashing has fixed the network. The game separates three things that are easy to confuse: what the script sent, what the router has in its configuration, and what traffic actually does.

**Learner:** network engineers new to automation, or early-career engineers who know basic IOS CLI. They know what an interface, an IP subnet and a static route are, and have seen Python. No Netmiko experience is needed.

**Session target:** 10–20 minutes for a first playthrough of all seven rounds, with unlimited thinking time. (The first build had four rounds and a 5–10 minute target.)

**What the learner leaves with:** enough of the shape of a Netmiko script (connect, configure, check, save, loop over devices) to try writing one of their own. The last round has them assemble a whole script, and the game hands it back as real code.

### Learning outcomes

| ID | After playing, the learner can… | The game asks them to… | Evidence of success |
| --- | --- | --- | --- |
| LO1 | Order configuration lines so each runs in the right CLI context, and recognise that a rejected line does not stop the script | Place `interface` and `no shutdown` cards in order | *Bring the link up* and *The other end* solved; the link turns up and the ping completes |
| LO2 | Diagnose a one-way path and identify that traffic needs a route in each direction | Choose which router needs a route and which `ip route` card it needs | *A route in each direction* solved; request and reply are both delivered |
| LO4 | Put the calls of a script in an order that works, and assemble a whole script: connect, configure, save, for every router | Place the calls themselves into the blanks | *Calls in order* and *The whole script* solved |
| LO3 | Save a change so it survives a reload, on every router a loop touches | Place the `save_config()` card, including inside or after a `for` loop | *Working is not saved* and *Save on every router* solved; the ping still completes after both routers reload |

## Clarifications

### Session 2026-11-17

- Q: After a failed Run, what should the two router state panels show while the player decides what to change? → A: The failed Run's result until the player changes any card, then the starting state, with a label saying which is shown.
- Q: Should a round still earn the first run mark if the player opened the hint before solving it on their first Run? → A: Yes. The mark means "solved on Run 1" only; hint use is shown in its own column beside it.
- Q: While a Run is still playing line by line, what should happen if the player presses Run again or wants to get to the result faster? → A: Run is disabled during playback, and a separate Skip control jumps to the finished log, trace and feedback; the Run is counted once. (Superseded below: Run is not disabled during playback. Skip stays.)
- Q: Once a round has started, can the player go back and re-read that round's briefing? → A: Yes. A Briefing control reopens it at any time; reopening is not recorded and changes nothing in the round.
- Q: What is the narrowest browser window in which the game must be fully playable and checked before release? → A: 768 px wide; below that the page may scroll but is not checked.
- Q: When the player selects, places, returns or swaps a card, before pressing Run, what feedback must the game give? → A: Every card action shows motion and a one-sentence status message; with reduced motion, the message alone.
- Q: How much should the ping animation show as the packet travels: just the dot moving and stopping, or also the routing decision each router makes? → A: The dot pauses at each router while that router's matching routing-table row is highlighted, or "no matching route" is shown; then it moves on or is dropped.
- Q: If the player has a card selected and then selects a slot that already holds a card of the same type, what should happen? → A: Swap: the selected card goes into the slot and the card that was there returns to the tray. With no card selected, selecting a filled slot returns its card.
- Q: After a round is solved, can the player still move its cards around before pressing Next? → A: No. Cards and slots lock; the solving script and its result stay on screen until Next.
- Q: Must another workshop attendee be able to run the game's automated tests using only a web browser, or is it acceptable for the tests to need Node installed? → A: Node is acceptable. Tests run from a terminal; the README states that Node is needed for tests and not for playing.
- Q: Why force the player to wait while a Run plays, rather than letting them act? → A: Don't. A Run is counted and its result recorded the moment Run is pressed, so playback can be interrupted freely: every control stays available, pressing Run during playback replays it without counting, and playback restarts from the beginning after the briefing or a cancelled restart. This replaces "Run is disabled during playback" above; Skip stays.
- Q: When should the ping animation be moving on the diagram during a round? → A: It loops continuously for the whole round, against whichever state is on screen (the starting state, or the result of the last Run).
- Q: How much should each repeat of the always-running ping show at each router? → A: A plain dot while the starting state is shown (it stops at the right router with no reason given); the full per-router pause and route highlight while the result of a Run is shown.
- Q: In rounds 3 and 4, once a Run has finished playing, what should the repeating ping show? → A: Only the ping after the reload repeats. The first ping and the reload are seen once, in the Run's playback, and again if the player replays it with Run.
- Q: What should a reset button do, given that every Run already starts from the round's original state? → A: A **Reset routers** control returns the panels, diagram and repeating ping to the starting state, with both routers shown as saved. Cards stay placed, the last Run's log, trace and feedback stay, and the run count is unchanged.
- Q: Rules 5 (forwarding) and 7 (loop variables) have no reference in the spec and are not labelled as unsourced, so how should they ship? → A: With references. Three were looked up and read on 2026-11-17 and added to the References table: a Cisco document and RFC 1812 for rule 5, and the Python language reference for rule 7.

### Session 2026-11-17, after the first playable build

Decisions the author made after playing the first build. They replace the answers above about the briefing (re-reading it, and its effect on playback).

- Q: Is the page of text before each round worth keeping? → A: No. A round opens straight on the play screen. Its one idea sits above the script, and the worked example, model limits and sources are one action away in a collapsed "About this round".
- Q: What should the game put more weight on? → A: How Netmiko works. A note beside each call in the script says what Netmiko does there, and the log shows what Netmiko sent to the router for each line beside what the router did.
- Q: Can the player control the motion? → A: Yes. Pause freezes all motion and Slow runs it at reduced speed; both act on a Run's playback and on the repeating ping. Pause stays on until the player resumes.
- Q: Can the player hide parts of the screen? → A: Yes. Script log, Ping trace and What happened and why can each be collapsed. All are open by default, and only the player collapses or reopens one. (Router state was a fourth such panel until it moved into the diagram; see the next session.)

### Session 2026-11-17, visuals and layout

Decisions from three passes over the look of the game, made because it was not obvious that cards go into blanks and the screen was text heavy.

- Q: How does a new player learn that cards go into the blanks? → A: A three-step strip (pick a card, put it in a blank, run the script) lights the current step; blanks look like gaps and glow when a card is picked; cards look like cards and can also be dragged onto a blank.
- Q: Should a router's state pop up on hover? → A: Each router's state sits on a card under that router, always on screen. Pointing at the router, or the card's details control, pops up extra detail only. Router state is no longer a separate collapsible panel.
- Q: What should the top of the page be, now that it is not a briefing? → A: A game status bar and a ticket. The bar holds the wordmark and a level track of the rounds. Each round is a ticket from hostA, with its complaint, a goal shown as two lamps (request reaches hostB, reply reaches hostA) lit from the ping, and the round's idea as a one-line tip. The hosts are drawn as laptops whose faces follow the ping.
- Q: How is the amount of text reduced? → A: The round's idea is one or two short sentences, with the fuller version in About this round; each call note is one short line; before a round's first Run one line stands in for the empty log, trace and explanation; and the explanation no longer repeats the per-line list that the Script log directly above it already gives.

### Session 2026-11-19, seven rounds

- Q: How many rounds should there be, and where should they lead? → A: Seven, each adding one skill of writing a script and building to a challenging last round. See *Curriculum* under Round content.
- Q: What should a player be able to do afterwards? → A: Feel able to try writing their own Netmiko script. After the last round the game shows the script they assembled as complete, copyable code, with what to change to run it on a real network.
- Q: The rounds were numbered 1 to 4. How are they named now? → A: By name. The first build's rounds 1 to 4 are *Bring the link up*, *A route in each direction*, *Working is not saved* and *Save on every router*, now rounds 1, 3, 4 and 5. The requirements below use the names. The clarification answers above this session are a record of what was decided at the time and keep the old numbers; where one says "rounds 3 and 4" it means every round with a reload check.

### Session 2026-11-19, fewer words

- Q: The game is very text based. Can it say less and still teach all of the Netmiko? → A: Yes, by changing form, not content. The script log is a terminal transcript: what Netmiko sent, exactly as before, with what the router did as a short tag on the same line. The ping trace is a row of hops per leg. The explanation is the verdict, one line for where the traffic stopped and why, and each rule in a few words that opens to its full text. Each call's note is a short trailing comment on the call's own line. The ticket is one sentence and the round's idea one line. After a failed Run the screen went from 496 to 318 words in round 1 and from 748 to 486 in the last round.

### Session 2026-11-19, a board, not a page

- Q: Is the layout holding back the game feel? → A: Yes. The play screen becomes one board that fits the window with no scrolling: script on the left, network on the right, so a line running and a router reacting are in one glance; the cards are a hand along the bottom beside a large Run; the script log is a terminal under the script; the reason a ping stopped is a bubble on the router where it stopped; and the verdict sits beside Run and Next, with Next taking the primary look once the round is solved. Restart moves to the status bar.
- Q: What about small windows? → A: The one-screen board applies from 1100 px wide and 720 px tall. A shorter window keeps the script beside the network and lets the page scroll. A narrower window, including the 768 px case, is one column with the network first.

## User Scenarios & Testing *(mandatory)*

The acceptance scenarios keep the source document's identifiers (AC1–AC11) so that release evidence can be recorded against them. All three stories are P1 in the source. They are listed in build order: story 1 alone is a playable single round, story 2 makes it a complete game, and story 3 makes it usable by everyone in the workshop.

### User Story 1 - Make and understand a decision (Priority: P1)

A learner reads the round's one idea above the script, inspects the topology and both routers' state, places cards into the script's blank slots and presses Run. The script plays one line at a time, the state it changes is marked, and a ping trace shows whether the request and the reply were delivered. The learner then reads why, and either retries or moves on.

**Why this priority**: this is the whole teaching mechanic. Without a decision followed by a visible, explained consequence there is no game.

**Independent Test**: play round 1 alone. Place the solving cards and confirm the round trip completes with an explanation. Then place a wrong order and confirm the feedback names the rejected line, the trace shows where traffic stopped, and the round can be retried.

**Acceptance Scenarios**:

1. **AC1** — **Given** a fresh session, **When** the page loads, **Then** I am on round 1's play screen with no page to read first: the round's one idea is shown above the script, each call in the script has a note saying what Netmiko does, and the cards can be placed at once.
2. **AC2** — **Given** round 1, **When** I place `interface GigabitEthernet0/1` then `no shutdown` and press Run, **Then** the link shows up, the trace reads "Request delivered to hostB. Reply delivered to hostA.", and an explanation appears.
3. **AC3** — **Given** round 1, **When** I place `no shutdown` then `interface GigabitEthernet0/1` and press Run, **Then** feedback says the router rejected `no shutdown` because no interface was selected yet and that the script carried on without stopping, the trace shows the request dropped at r1 because the link to r2 is down, the round stays unsolved, and I can retry.
4. **AC4** — **Given** any round with an empty slot, **When** I press Run, **Then** guidance names the empty slot and the run count and completion are unchanged.
5. **AC5** — **Given** any Run with all slots filled, **Then** each script line is highlighted in order and any state it changed is marked, before the ping trace is shown.

---

### User Story 2 - Learn from help and finish the game (Priority: P1)

A learner who is stuck opens the round's hint, which explains the method without giving the answer. Each Run is counted. When a round is solved the learner presses Next, and after the last round sees a summary of how each round went. The learner can restart the whole session after confirming.

**Why this priority**: hints, honest counting and a summary turn a single puzzle into a session a learner can finish and reflect on.

**Independent Test**: play all seven rounds from a fresh start, using the hint in one round and solving another on the first Run. Confirm the counter, the summary, and Restart with both Confirm and Cancel.

**Acceptance Scenarios**:

1. **AC6** — **Given** any round, **When** I open the hint, **Then** it explains the method without naming a card, its use is recorded, and the round is not marked solved.
2. **AC7** — **Given** an unsolved round, **When** I press Run with all slots filled, **Then** the visible run counter goes up by one. **Given** a solving Run, **Then** the round completes once and Run is disabled once its playback ends.
3. **AC8** — **Given** a solved round, **When** I press Next, **Then** the following round opens on its play screen. **Given** the last round is solved, **When** I press Next, **Then** the session summary opens and shows runs, hint use and the first-run mark for every round.
4. **AC9** — **Given** any point in the session, **When** I press Restart, **Then** I am asked to confirm. Confirming clears the session and returns to round 1. Cancelling preserves the session.

---

### User Story 3 - Play with accessible controls (Priority: P1)

A learner plays the whole game from the keyboard, or with assistive technology, or with reduced motion set, and gets the same information and the same outcome as a learner using a mouse and watching the animation.

**Why this priority**: the constitution makes access part of the core game, and release requires all seven rounds to be finished using only the keyboard.

**Independent Test**: complete all seven rounds using only the keyboard. Repeat one round with reduced motion set and confirm the log and trace text appear at once with nothing missing.

**Acceptance Scenarios**:

1. **AC10** — **Given** any round, **Then** cards, slots, Run, Skip, Reset routers, Pause, Slow, Hint, Next, Restart, each router's details control and the panel headings that collapse have visible focus and accessible names, and every one can be operated from the keyboard.
2. **AC11** — **Given** any Run, **Then** the script log and ping trace are text, stay on screen, and are announced to assistive technology. **Given** reduced motion is set, **Then** the log and trace text appear immediately and no information is lost.

---

### Edge Cases

- **Empty slot at Run:** guidance names the empty slot; nothing is counted (AC4).
- **Card and slot of different types:** the placement is refused with a text message saying which type the slot takes. Nothing else changes.
- **Selecting a filled slot with no card selected:** its card returns to the tray, with motion and a status message like any other card action.
- **Selecting a filled slot with a card of the same type selected:** the two swap; the displaced card returns to the tray and the status message names both.
- **Card changed after a failed Run:** the state panels and diagram return to the starting state and their label changes to say so; the last Run's log, trace and feedback remain.
- **Card or slot selected after solving:** nothing moves; the solving script stays as it is.
- **Run pressed again after solving, once playback has ended:** nothing happens; the round completes once and the counter does not move (AC7).
- **Run pressed while a Run is still playing:** playback restarts from the beginning; nothing more is counted.
- **Restart opened and cancelled during playback:** playback restarts from the beginning when the player returns to the round. A confirmed Restart discards it with the rest of the session.
- **Hint opened during playback:** the hint shows and playback carries on.
- **Card changed during playback of a failed Run:** playback ends, and the panels return to the starting state as after any card change. The Run stays counted.
- **No Run yet, or a card changed after a failed Run:** the ping keeps repeating against the starting state and stops where the opening ping stopped.
- **Reset routers pressed after a failed Run:** the panels, diagram and ping return to the starting state; the cards stay placed and the last Run's log, trace and feedback remain.
- **Reset routers pressed while the starting state is already shown:** nothing changes.
- **Skip pressed during playback:** the finished log, trace and feedback appear at once, identical to what full playback would have shown; the Run is counted once.
- **A configuration line the router accepts but that changes nothing** (the route already exists, the interface is already up): feedback says the line was accepted and nothing changed.
- **A rejected line in the middle of a script:** the remaining lines still run (rule 8).
- **A statement placed after the loop:** it acts on the last router only (rule 7).
- **A round with a reload check, first ping passes and second fails:** the round stays unsolved. Only the ping after the reload decides the round.
- **Hint opened before, during or after a failed Run:** recorded once per round; it never changes the run count or completion.
- **Hint opened, then solved on Run 1:** the summary shows both the first-run mark and that the hint was used.
- **"About this round" opened or closed mid-round:** nothing is recorded and nothing in the round changes; playback, if any, carries on.
- **Pause pressed:** the ping and any playback freeze where they are. Every other control keeps working.
- **Run pressed while paused:** the Run is counted at once and its playback waits, frozen, at the first step; the status message says to press Resume or Skip.
- **Slow pressed:** the ping and any playback carry on at reduced speed; the text is unchanged.
- **A panel collapsed, then a Run pressed:** the panel stays collapsed and still receives its text; reopening it shows the whole of it.
- **A panel collapsed, then Next pressed:** it stays collapsed in the next round until the player reopens it.
- **Restart cancelled:** round, placed cards, run counts and hint records are all unchanged.
- **Page reload:** the session starts again from round 1.
- **Broken round content** (the tray cannot fill the slots, or no placement solves the round): a content error naming the round replaces the whole game; nothing is graded and no progress is given.
- **Browser window 768 px wide:** the action buttons stay reachable; dense panels may scroll inside their own labelled area.
- **Browser window narrower than 768 px:** the page may scroll; this is not checked in this version.

## Requirements *(mandatory)*

### Functional Requirements

**Round flow**

- **FR-001**: Each round MUST open straight on its play screen, with no page to read first. The round's one new idea MUST be shown above the script from the moment the round opens. An **About this round** section on the same screen, closed by default and opened with one action, MUST give how to read the state panel, a worked example that differs from the challenge, the model limits that affect what the player can conclude, and the sources.
- **FR-001a**: The top of the play screen MUST show: a level track with one node per round in play, marking the current round, solved rounds, and rounds solved on the first Run; and the round as a ticket from hostA with a one-sentence complaint that states the symptom only, never the fix. The ticket MUST show the goal as two lamps, *request reaches hostB* and *reply reaches hostA*, each saying yes or not yet in text as well as colour, and each taken from the simulator's ping for the state currently shown (FR-012b). The ticket reads *Open* until a solving Run has finished playing, then *Resolved* with hostA's thanks. The track, the lamps and the faces on the hosts add no information that the summary, the ping caption and the trace do not also give in text.
- **FR-002**: Round 1's idea, and the note beside every `send_config_set` call, MUST state that `send_config_set` does not stop when the router rejects a line.
- **FR-002a**: Every call in the script (`ConnectHandler`, `send_config_set`, `send_command`, `save_config`, `print`, and the `for` loop) MUST carry a note beside it, always on screen, saying what Netmiko or Python does at that line. The note is a short trailing comment on the call's own line. A statement slot shows the note for its card once one is placed. Opening or closing About this round is not recorded as assistance and MUST NOT change the placed cards, the run count, the hint record or completion.
- **FR-003**: Every round MUST open with a ping from the starting state. A **ping caption** under the diagram says only where traffic stopped; the reason is left for the player to find in the state panels. The opening ping, and every repeat of it while the starting state is shown (FR-012b), shows a moving dot and that one caption sentence only: it has no per-router pause and no per-router trace lines.
- **FR-004**: Every interface address, both router state panels, the full script and the run counter MUST be on the play screen throughout a round and shown by default. Nothing needed to reason about the round may be hidden behind hover.
- **FR-004a**: The Script log, Ping trace and What happened and why panels MUST each be collapsible by the player. All three are open when the page loads. Before a round's first Run, when all three are empty, one line saying what a Run will show stands in their place. A collapsed panel keeps its heading on screen and reopens with one action. The game MUST NOT collapse or reopen a panel by itself, including when a Run is pressed or a new round opens.
- **FR-005**: Rounds are played in order, 1 to 4. A round advances only when the player presses Next, and Next is enabled only when the round is solved.

**Placing cards**

- **FR-006**: The player places a card by selecting it and then selecting a slot. This MUST work the same way with mouse, touch and keyboard. A card MAY also be dragged onto a slot; dragging is the same action (picking the card up selects it, dropping it selects the slot) and gives the same status message.
- **FR-006a**: The play screen MUST show the three steps of a turn (pick a card, put it in a blank, run the script) and mark the step the player is on, in text as well as colour. An empty slot MUST look like a gap to be filled and MUST say which kind of card it takes.
- **FR-007**: A card fits only slots of its own type (device, config line or statement), and each card is used at most once per round.
- **FR-008**: Selecting a filled slot with no card selected MUST return its card to the tray. Selecting a filled slot with a card of the same type selected MUST swap them: the selected card goes into the slot and the card that was there returns to the tray.

- **FR-008a**: Every card action (select, place, return, swap) MUST show motion on the card and its slot and MUST show a one-sentence status message naming the card and the slot. The message is announced to assistive technology. With reduced motion set, the message appears alone and at once. This feedback never shows or hints at the outcome of a Run.

**Running the script**

- **FR-009**: Run with any empty slot MUST show guidance naming the empty slot and MUST NOT change the run count or completion.
- **FR-010**: Every Run MUST start from the round's starting state. Nothing carries over from an earlier Run, so the outcome depends only on the round and the cards placed.
- **FR-011**: A Run with all slots filled MUST play the script one line at a time, highlighting each line as it runs and marking the state row it changed, and only then show the ping trace.
- **FR-011a**: A Run MUST be counted and its result recorded at the moment Run is pressed; playback only presents that result. A **Skip** control, available during playback, MUST jump to the finished script log, ping trace and feedback. Skipping shows the same text and the same result as full playback.
- **FR-011b**: The player MUST never be made to wait for playback. Every control stays available while a Run plays. Pressing Run during playback restarts the playback from the beginning and MUST NOT count another Run. Opening the hint, or opening About this round, leaves playback running. Cancelling a restart restarts playback from the beginning. Changing a card, pressing Reset routers or pressing Next ends playback.
- **FR-012**: The ping trace MUST be shown both as moving dots on the diagram and as text. Request dots travel left to right and reply dots right to left. A drop is marked on the router where it happened.
- **FR-012a**: In every ping shown against the result of a Run, including each repeat of it (FR-012b) but not any ping shown against the starting state, at each router the dot MUST pause while that router's state panel highlights the routing-table row it used to forward the packet, or shows "no matching route" when there is none; the dot then moves on or is dropped. The text trace MUST carry the same information: under its summary sentence it lists, for each router the packet reached, the route used or that no route matched. It is drawn as one row of hops per leg (the hosts at the ends, each router with the route it used), ending in *delivered* or *dropped*.
- **FR-012b**: Throughout a round the diagram MUST show the ping in motion, repeating, against the state currently shown (FR-019a): the starting state before any Run and after a card change, or the result of the last Run. Every repeat stops at the same router, for the same reason, that the simulator computed for that state. The ping caption under the diagram states, in one sentence, the result of the ping now repeating. It is rewritten and announced when the state shown changes, never on a repeat. The ping trace region is separate and always holds the last Run's trace (FR-019a). With reduced motion set, the repeating ping is replaced by a still marker at the point where the packet stops, with the same text.
- **FR-012c**: A **Pause** control MUST freeze all motion, both a Run's playback and the repeating ping, where it is, and a **Resume** control MUST carry on from there. A **Slow** control MUST run the same motion at reduced speed until the player returns to normal speed. Pausing freezes motion only: every other control keeps working, and a Run pressed while paused is counted at once (FR-011a). Pause stays on until the player resumes. Neither control changes any text. With reduced motion set there is no motion, and the two controls are not shown.
- **FR-013**: In a round with a reload check (*Working is not saved*, *Save on every router*, *Calls in order* and *The whole script*) a Run MUST ping, reload both routers, then ping again. The round is solved only if the second ping completes. Once playback has finished, only the second ping repeats (FR-012b); the first ping and the reload are shown once per playback.
- **FR-014**: Every outcome MUST be computed by applying the rules in *Simulated model* to the starting state and the placed cards. No stored answer key may decide or override an outcome.

**Feedback**

- **FR-015**: After every Run, feedback MUST say, in this order: what the router did with each line, where the traffic stopped, and the rule that explains the result. The verdict itself (solved or not yet, in words and with an icon) is shown beside Run and Next, and the router where the deciding ping stopped carries a bubble saying why. A solving Run explains why it works. On screen these are three panels read top to bottom: the Script log (each line), the Ping trace, and What happened and why (the verdict, where the traffic stopped and the rule). The last panel does not repeat the per-line list. It gives the verdict, one line naming the router where the traffic stopped and why, and each rule that explains the result in its short form, which opens to the rule's full text with one action.
- **FR-015a**: The script log MUST show, for each script line that sends anything, exactly what Netmiko sent to the router, beside what the router did with it. On Cisco IOS that is: `configure terminal` before the first line of a `send_config_set` call and `end` after its last line, each configuration line at the prompt it was sent at (`(config)#` or `(config-if)#`), `write mem` for `save_config()`, and the command itself for `send_command`. `print` sends nothing. What is shown MUST come from Netmiko's source (see References).
- **FR-016**: When the router rejects a line, feedback MUST say which line, why, and that the script carried on. In the script log this is a short tag on the rejected line itself (for example "rejected: no interface selected. Script carries on"), with the full sentence as that line's tooltip.
- **FR-017**: The feedback voice is patient and specific. It never blames the player.
- **FR-018**: A router message MUST be shown as a quotation only once it has been captured from a real IOS or IOS XE device. Until then feedback paraphrases what the router did.

**State display**

- **FR-019**: Each router's state panel MUST show: the state of `Gi0/1` as *up*, *administratively down* (shut on this router) or *down* (the other end is shut); the static routes in the running configuration; the routing table; and a *saved* or *unsaved changes* badge.
- **FR-019c**: Each router's state panel is a card under that router in the diagram, on screen by default. It shows the link state, the saved badge, the routes in the routing table, and any static route that is configured but not installed, marked as such. Pointing at the router in the diagram, or a details control on the card, MAY pop up extra detail (the configuration lines and a legend); nothing needed to reason about the round may be only in that pop-up. The details control MUST be operable from the keyboard.
- **FR-019a**: The state panels and the diagram MUST carry a text label saying which state they show: *Starting state* or *After your last run*. After a failed Run they show the result of that Run. When the player then places or removes any card, they MUST return to the round's starting state. The script log, trace and feedback from the last Run stay on screen.
- **FR-019b**: A **Reset routers** control MUST return the state panels, the diagram and the repeating ping to the round's starting state, labelled *Starting state*, in which both routers show *saved*. It MUST NOT move any card, change the run count, the hint record or completion, or remove the last Run's log, trace and feedback. It is never needed before a Run, because every Run starts from the starting state (FR-010). Pressed during playback it ends the playback, as a card change does. It is unavailable once the round is solved (FR-022a).
- **FR-020**: The diagram MUST draw the r1–r2 link dark when it is down and lit when it is up, and MUST also state the link state in text.

**Progress, help and session**

- **FR-021**: A live **Runs: n** counter sits beside Run. Each Run with all slots filled adds one, until the round is solved.
- **FR-022**: A solving Run completes the round exactly once. Run is disabled once that Run's playback ends; during its playback a press only replays it (FR-011b). A repeated Run MUST NOT count or award progress again.
- **FR-022a**: Once a round is solved its cards and slots MUST lock. The solving script, the state panels labelled *After your last run*, the log, the trace and the feedback stay on screen until Next.
- **FR-023**: A failed Run MUST leave the round playable with the cards still placed.
- **FR-024**: Each round has exactly one hint. It explains the method without naming a card. Using it is recorded and never marks a round solved.
- **FR-025**: After the last round, Next opens a session summary listing each round with its run count, whether the hint was used, and a **first run** mark for rounds solved on the first Run. The mark depends only on the run count: a round solved on Run 1 earns it whether or not the hint was opened, and hint use is shown in its own column.
- **FR-025a**: The session summary MUST also show the script the player assembled in the last round as complete Netmiko code: the game's script line for line, with every blank filled by the card the player placed there, plus the login a real network needs (a prompted password and a username in each router's settings), with those added lines marked. A **Copy script** control MUST copy it, or select it for copying where the browser refuses clipboard access. Beside it the summary lists what to change to run it on a real network. The code shown MUST be valid Python and MUST use only Netmiko calls and parameters that exist (see References).
- **FR-026**: The run counter and the first-run mark are the only scoring. There are no points, lives, timer, leaderboard or streak. Retries and hints carry no penalty.
- **FR-027**: Restart MUST ask for confirmation. Confirming clears the session and returns to round 1. Cancelling preserves the session.
- **FR-028**: Progress is held for the page session only. Reloading the page starts again.

**Access**

- **FR-029**: Cards, slots, Run, Skip, Reset routers, Pause, Slow, Hint, Next, Restart, About this round, each router's details control and the three collapsible panel headings MUST have visible focus and accessible names and MUST be operable from the keyboard.
- **FR-030**: The script log and ping trace MUST be text, stay on screen unless the player has collapsed their panel, and be announced to assistive technology. Success and failure MUST be conveyed in text as well as colour.
- **FR-031**: With reduced motion set, the log and trace text MUST appear immediately with no information lost. Animation MUST never delay feedback or controls.
- **FR-032**: The game MUST be fully playable in a browser window 1024 px wide or more (a typical laptop) and in one 768 px wide: every control reachable, and all text readable without horizontal scrolling of the page. Dense panels may scroll inside their own labelled area. Below 768 px the page may scroll and is not checked in this version.
- **FR-032a**: In a window at least 1100 px wide and 720 px tall, the whole play screen MUST fit the window with no scrolling of the page, in every round and after any Run: the ticket, the script, the script log, the network with both routers' state, the cards and every button. The script, the script log and the results area may scroll inside themselves. In a smaller window the page may scroll vertically.

**Content integrity**

- **FR-033**: All round content MUST be checked before the first round is shown. If any round's tray cannot fill its slots, or any round has no solving placement, or the content is otherwise invalid, the game MUST show a content error naming each affected round in place of the game. Nothing is graded and no progress is given.
- **FR-034**: The game MUST be playable with no account, sign-in, network service or real device.

### Simulated model

A simplified model of Cisco IOS behaviour, driven by method names taken from the Netmiko library. It is a simulator: no real device, remote session or Python interpreter is involved.

**Topology (fixed for every round)**

```text
hostA ───────── r1 ═══════════ r2 ───────── hostB
10.10.0.10   Gi0/0  Gi0/1   Gi0/1  Gi0/0   10.20.0.10
             10.10.0.1  192.0.2.1  192.0.2.2  10.20.0.1
   10.10.0.0/24        192.0.2.0/30        10.20.0.0/24
```

`Gi0/0` on each router faces its host and is always up. `Gi0/1` is the link between the routers.

**Rules**

1. **CLI context.** `no shutdown` and `shutdown` are accepted only after an `interface …` line in the same `send_config_set` call. At global configuration level the router rejects them and nothing changes.
2. **Link state.** The r1–r2 link is up only when `Gi0/1` is enabled on both routers.
3. **Route installation.** A static route in the running configuration is installed in the routing table only if its next hop is inside a connected subnet whose link is up. A connected subnet is in the routing table only while its link is up.
4. **Own address.** The router rejects a static route whose next hop is one of its own interface addresses.
5. **Forwarding.** Each router forwards using the route in its routing table that contains the destination. No two routes overlap in this game. With no matching route the packet is dropped at that router. The reply is a separate packet from hostB to hostA and is forwarded by the same rule.
6. **Persistence.** `save_config()` copies the running configuration to the startup configuration. A reload replaces the running configuration with the startup configuration.
7. **Loop variables.** After a `for` loop ends, `conn` refers to the last connection only, so a call placed after the loop acts on the last router alone.
8. **Silent rejection.** When the router rejects a configuration line, `send_config_set` records the router's message and carries on. The script does not stop.
9. **Script errors.** A call that uses `conn` before any `ConnectHandler` has run fails with a NameError, because the name does not exist yet. Python stops the script at that line: nothing is sent to any router and no later line runs. The ping, and the reload check where the round has one, still happen against whatever state the script left. This is the opposite of rule 8, and the two are taught side by side.

**Script language**

A script is a fixed scaffold with typed blank slots. The only calls are:

| Call | Effect in the simulator |
| --- | --- |
| `conn = ConnectHandler(**device)` | Opens a session to the named router |
| `conn.send_config_set([...])` | Applies each configuration line in order, starting at global configuration level |
| `conn.send_command("show …")` | Reads state; changes nothing |
| `conn.save_config()` | Running configuration becomes startup configuration |

Plus `for device in [r1, r2]:` with an indented body, and `print(...)`, which does nothing.

**Model limits**

- **Assumed correct:** host addresses and gateways; router interface addresses, which are already configured. There is no default route.
- **Not simulated:** ARP, dynamic routing, administrative distance, equal-cost paths, recursive next-hop resolution, exit-interface static routes, IPv6, enable/privilege modes, closing sessions, authentication failures, timeouts, output parsing, and ICMP error messages.
- **Simplified timing:** static routes install and withdraw instantly. A real router can take up to about a minute, because it rechecks next hops periodically.

**References** (checked 2026-11-17)

| Reference | Supports |
| --- | --- |
| Netmiko source, [`base_connection.py`](https://github.com/ktbyers/netmiko/blob/develop/netmiko/base_connection.py), `send_config_set` — `error_pattern` defaults to an empty string; `ConfigInvalidException` is raised only when a pattern is supplied and matches | Rule 8 |
| Netmiko source, [`cisco/cisco_ios.py`](https://github.com/ktbyers/netmiko/blob/develop/netmiko/cisco/cisco_ios.py), `save_config` — sends `write mem` on Cisco IOS | Rule 6 |
| Netmiko source, [`cisco_base_connection.py`](https://github.com/ktbyers/netmiko/blob/develop/netmiko/cisco_base_connection.py) — `config_mode` sends `configure terminal` by default and `exit_config_mode` sends `end`; `send_config_set` in `base_connection.py` calls `config_mode` first and `exit_config_mode` last. `cisco_ios.py`, `session_preparation` — sends `terminal width 511` and calls `disable_paging` | What Netmiko sends (FR-015a) |
| Netmiko source, [`base_connection.py`](https://github.com/ktbyers/netmiko/blob/develop/netmiko/base_connection.py), `BaseConnection.__init__` — takes `host`, `username`, `password` and `device_type`; `disconnect` — "Try to gracefully close the session." (checked 2026-11-19) | The take-away script and its next steps (FR-025a) |
| Netmiko API documentation, [`netmiko.base_connection`](https://ktbyers.github.io/netmiko/docs/netmiko/base_connection.html) | The call names |
| Cisco, [IP Routing Configuration Guide, IOS XE 17.17 (Catalyst 9600), Protocol-Independent Features](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9600/software/release/17-17/configuration_guide/rtng/b_1717_rtng_9600_cg/protocol_independent_features.html) — a static route leaves the routing table when its interface goes down or no valid next hop is found, and stays in the configuration | Rule 3 |
| Cisco, [IOS IP Routing: Protocol-Independent Command Reference, `ip route`](https://www.cisco.com/c/en/us/td/docs/ios/iproute_pi/command/reference/iri_book/iri_pi1.html) — a static route is a candidate only if its next hop resolves to a valid output interface | Rule 3 and the timing note |
| Cisco, [Using the Command-Line Interface, Catalyst 9300, IOS XE 17.17](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-17/command_reference/b_1717_9300_cr/using_the_command_line_interface.html), common CLI error messages | The wording `% Invalid input detected at '^' marker.` and `% Incomplete command.` |
| Cisco Learning Network, [thread 46334](https://learningnetwork.cisco.com/thread/46334) — community report of `%Invalid next hop address (it's this router)` | Rule 4. A forum post, not Cisco documentation |
| Cisco, [Configure Route Selection for Routers](https://www.cisco.com/c/en/us/support/docs/ip/enhanced-interior-gateway-routing-protocol-eigrp/8651-21.html) (Document ID 8651), "Make Forwarding Decisions" — "The longest prefix match always wins among the routes installed in the routing table." | Rule 5: a router forwards on the routing-table route that contains the destination. The game has no overlapping routes, so the one containing route is also the longest match |
| IETF, [RFC 1812, Requirements for IP Version 4 Routers](https://www.rfc-editor.org/rfc/rfc1812.txt), section 5.2.4.3 "Next Hop Address" — "If the set ever becomes empty, the packet is discarded because the destination is unreachable." | Rule 5: with no matching route the packet is dropped. A standards document, not Cisco documentation |
| Python, [Language Reference, 8.3 "The `for` statement"](https://docs.python.org/3/reference/compound_stmts.html#the-for-statement) — "Names in the target list are not deleted when the loop is finished". A name assigned in the loop body, such as `conn`, likewise keeps its last value | Rule 7 |
| Python, [Library Reference, Built-in Exceptions, `NameError`](https://docs.python.org/3/library/exceptions.html#NameError) — "Raised when a local or global name is not found." (checked 2026-11-19) | Rule 9 |
| **No source found yet** | Rule 1's claim that `no shutdown` is rejected at global configuration level; rule 2 |

### Round content

Seven rounds, one mechanic. The pass condition is always the same: request and reply both delivered.

#### Curriculum

| # | Round | The skill it adds | Slots | Placements | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | Bring the link up | The order of lines in `send_config_set`; a rejected line does not stop the script (LO1) | 2 config lines | 6 | Built |
| 2 | The other end | Choosing which router to connect to, by reading which end of the link is shut (LO1) | 1 device, 2 config lines | 12 | Built |
| 3 | A route in each direction | The reply is a separate packet and needs its own route (LO2) | 1 device, 1 config line | 4 | Built |
| 4 | Working is not saved | `save_config()` makes a change survive a reload (LO3) | 1 statement | 3 | Built |
| 5 | Save on every router | A call after a loop runs once, on the last router (LO3) | 2 statements | 6 | Built |
| 6 | Calls in order | Placing the calls themselves: connect, then configure, then save. A call on `conn` before connecting stops the script (LO4) | 3 statements | 6 | Built |
| 7 | The whole script | The challenge: fill the whole loop body and the line after it, using every earlier skill (LO4) | 5 statements | 720 | Built |

Round 2, *The other end*: r1's `Gi0/1` is enabled and r2's is shut, so r1 shows *down* and r2 shows *administratively down*. Both static routes are configured and saved. The script connects to a router chosen by a device slot and sends two configuration lines. The tray is `r1`, `r2`, `interface GigabitEthernet0/1`, `no shutdown` and `interface GigabitEthernet0/0`.

The table below gives the detail for rounds 1, 3, 4 and 5.

| Round | New idea | Starting state | Slots | Tray |
| --- | --- | --- | --- | --- |
| 1 | CLI context; a rejected line does not stop the script (LO1) | r1 `Gi0/1` shut down. r2 `Gi0/1` up. Both static routes configured and saved. | 2 config lines on r1 | `interface GigabitEthernet0/1`, `no shutdown`, `interface GigabitEthernet0/0` |
| 3 | Traffic needs a route in each direction (LO2) | Link up. r1 has its route to 10.20.0.0/24. r2 has none. | 1 device, 1 config line | `r1`, `r2`, `ip route 10.20.0.0 255.255.255.0 192.0.2.2`, `ip route 10.10.0.0 255.255.255.0 192.0.2.1` |
| 4 | A change that works is not yet saved (LO3) | Link up. r2 complete and saved. r1 has no route; the script adds it. | 1 statement after `send_config_set` on r1 | `conn.save_config()`, `conn.send_command("show running-config")`, `print("done")` |
| 5 | A call after a loop runs once, on the last router (LO3) | Link up. Neither router has a route; the loop adds each router's route. | 1 statement inside the loop, 1 after it | `conn.save_config()`, `conn.send_command("show running-config")`, `print("done")` |

**Worked interaction (*A route in each direction*).** The link is up. r1 already has `ip route 10.20.0.0 255.255.255.0 192.0.2.2`; r2 has no static route. The ping caption reads: "Request delivered to hostB. Reply dropped at r2." A player thinking only about the forward direction places `r1` and `ip route 10.20.0.0 255.255.255.0 192.0.2.2`, and presses Run. Feedback: "r1 already had this route, so nothing changed. The request still reaches hostB. The reply is dropped at r2: r2 has no route back to 10.10.0.0/24. Traffic needs a route in each direction." The counter reads Runs: 1. The player swaps to `r2` and `ip route 10.10.0.0 255.255.255.0 192.0.2.1`. The reply dots now travel back to hostA.

### Required outcome cases

This is every possible placement of the first four rounds: 19 in total. The 12 placements of *The other end* follow as cases 20 to 31. Expected results are worked by hand from the rules above, not taken from the game's own evaluator. For *Working is not saved* and *Save on every router* the first ping completes in every case, so only the second ping is listed.

**Bring the link up** (slot 1, slot 2)

| # | Placement | Expected result | Rule |
| --- | --- | --- | --- |
| 1 | `interface Gi0/1`, `no shutdown` | Link up. Both static routes install. Request and reply delivered. **Solved.** | 1, 2, 3 |
| 2 | `no shutdown`, `interface Gi0/1` | `no shutdown` rejected; script carries on. Request dropped at r1: link to r2 is down. | 1, 8 |
| 3 | `interface Gi0/0`, `no shutdown` | No change; `Gi0/0` was already up. Request dropped at r1: link to r2 is down. | 2 |
| 4 | `no shutdown`, `interface Gi0/0` | `no shutdown` rejected; script carries on. Request dropped at r1: link to r2 is down. | 1, 8 |
| 5 | `interface Gi0/1`, `interface Gi0/0` | No change; nothing enabled the interface. Request dropped at r1: link to r2 is down. | 1 |
| 6 | `interface Gi0/0`, `interface Gi0/1` | Same as 5. | 1 |

**A route in each direction** (device, config line)

| # | Placement | Expected result | Rule |
| --- | --- | --- | --- |
| 7 | `r2`, route to 10.10.0.0/24 via 192.0.2.1 | Route installs on r2. Request and reply delivered. **Solved.** | 3, 5 |
| 8 | `r1`, route to 10.20.0.0/24 via 192.0.2.2 | No change; r1 already had it. Request delivered. Reply dropped at r2: no route to 10.10.0.0/24. | 5 |
| 9 | `r1`, route to 10.10.0.0/24 via 192.0.2.1 | Rejected: 192.0.2.1 is r1's own address. Request delivered. Reply dropped at r2. | 4, 8 |
| 10 | `r2`, route to 10.20.0.0/24 via 192.0.2.2 | Rejected: 192.0.2.2 is r2's own address. Request delivered. Reply dropped at r2. | 4, 8 |

**Working is not saved** (statement)

| # | Placement | Expected result after reload | Rule |
| --- | --- | --- | --- |
| 11 | `save_config()` | r1 keeps its route. Request and reply delivered. **Solved.** | 6 |
| 12 | `send_command("show running-config")` | r1 loses its route. Request dropped at r1. | 6 |
| 13 | `print("done")` | Same as 12. | 6 |

**Save on every router** (inside the loop, after the loop)

| # | Placement | Expected result after reload | Rule |
| --- | --- | --- | --- |
| 14 | `save_config()`, `send_command(…)` | Both routers saved. Request and reply delivered. **Solved.** | 6 |
| 15 | `save_config()`, `print("done")` | Same as 14. **Solved.** | 6 |
| 16 | `send_command(…)`, `save_config()` | Only r2 saved. r2 keeps its route, r1 loses its route. Request dropped at r1. | 6, 7 |
| 17 | `print("done")`, `save_config()` | Same as 16. | 6, 7 |
| 18 | `send_command(…)`, `print("done")` | Neither saved. Request dropped at r1. | 6 |
| 19 | `print("done")`, `send_command(…)` | Same as 18. | 6 |

**The other end** (device, slot 1, slot 2)

| # | Placement | Expected result | Rule |
| --- | --- | --- | --- |
| 20 | `r2`, `interface Gi0/1`, `no shutdown` | r2's side enabled. Link up. Both static routes install. Request and reply delivered. **Solved.** | 1, 2, 3 |
| 21 | `r2`, `no shutdown`, `interface Gi0/1` | `no shutdown` rejected; script carries on. Request dropped at r1: link to r2 is down. | 1, 8 |
| 22 | `r2`, `interface Gi0/0`, `no shutdown` | No change; `Gi0/0` was already up. Request dropped at r1. | 2 |
| 23 | `r2`, `no shutdown`, `interface Gi0/0` | `no shutdown` rejected. Request dropped at r1. | 1, 8 |
| 24 | `r2`, `interface Gi0/1`, `interface Gi0/0` | No change. Request dropped at r1. | 1 |
| 25 | `r2`, `interface Gi0/0`, `interface Gi0/1` | Same as 24. | 1 |
| 26 | `r1`, `interface Gi0/1`, `no shutdown` | Both lines accepted and nothing changes: r1's side was never shut. Request dropped at r1. | 2 |
| 27 | `r1`, `no shutdown`, `interface Gi0/1` | `no shutdown` rejected. Request dropped at r1. | 1, 8 |
| 28 | `r1`, `interface Gi0/0`, `no shutdown` | No change; `Gi0/0` was already up. Request dropped at r1. | 2 |
| 29 | `r1`, `no shutdown`, `interface Gi0/0` | `no shutdown` rejected. Request dropped at r1. | 1, 8 |
| 30 | `r1`, `interface Gi0/1`, `interface Gi0/0` | No change. Request dropped at r1. | 1 |
| 31 | `r1`, `interface Gi0/0`, `interface Gi0/1` | Same as 30. | 1 |

**Calls in order** (line 1, line 2, line 3). The cards are the three calls: `conn = ConnectHandler(**r1)`, `conn.send_config_set(["ip route 10.20.0.0 255.255.255.0 192.0.2.2"])` and `conn.save_config()`. r1 starts with no route; r2 is complete and saved. The round has a reload check.

| # | Placement | Expected result | Rule |
| --- | --- | --- | --- |
| 32 | connect, config, save | Route added and saved on r1. First ping completes; after the reload request and reply delivered. **Solved.** | 3, 6 |
| 33 | connect, save, config | The save finds nothing new. The route is then added but not saved. First ping completes; the reload removes the route; request dropped at r1. | 6 |
| 34 | config, connect, save | Script stops at line 1 with a NameError. Nothing is sent. Both pings: request dropped at r1 (it never had a route). | 9 |
| 35 | config, save, connect | Same as 34. | 9 |
| 36 | save, connect, config | Same as 34: `save_config()` also needs `conn`. | 9 |
| 37 | save, config, connect | Same as 34. | 9 |

**The whole script** (four lines inside the loop, one line after it). r1's `Gi0/1` is shut, neither router has a route, and the round has a reload check. The six cards are the calls `conn = ConnectHandler(**device)`, `conn.send_config_set(["interface GigabitEthernet0/1", "no shutdown"])` (the link card), `conn.send_config_set(routes[device["host"]])` (the route card), `conn.save_config()`, `conn.send_command("show running-config")` and `print("done")`. Five are placed and one is left over: 720 placements.

That is too many to list, so the expected result is this rule, worked by hand from rules 1 to 9. The test applies it to all 720 placements without calling the simulator, then compares.

- **The script crashes** (rule 9) when, inside the loop, a card that uses `conn` (the link card, the route card, save or show) comes before the connect card, or the connect card is not inside the loop at all. Only `print` may come before the connect. 144 placements do not crash; 576 do.
- **The ping before the reload completes** exactly when the script does not crash and both the link card and the route card are inside the loop. The route card after the loop reaches r2 only (rule 7).
- **The round is solved** exactly when the loop body is: connect, then the link card and the route card in either order, then save. The card after the loop is then show or print. That is 4 placements.

One named case for each kind of outcome:

| # | Inside the loop; after it | Expected result | Rule |
| --- | --- | --- | --- |
| 38 | connect, link, route, save; print | Both routers configured and saved. Request and reply delivered after the reload. **Solved.** | 1, 2, 3, 6 |
| 39 | connect, route, link, save; show | Same as 38. **Solved.** | 1, 2, 3, 6 |
| 40 | connect, link, route, show; save | First ping completes. The save reaches r2 only. After the reload r1 has lost its route and its link is shut again. Request dropped at r1. | 6, 7 |
| 41 | connect, save, link, route; print | Saved before anything changed. First ping completes. After the reload both routers have lost their routes. Request dropped at r1. | 6 |
| 42 | connect, link, save, route; show | The link is saved, the routes are not. After the reload request dropped at r1: no route. | 6 |
| 43 | connect, route, save, link; print | The routes are saved, the link is not. After the reload r1's `Gi0/1` is shut again, so its saved route is not installed. Request dropped at r1. | 2, 3, 6 |
| 44 | link, connect, route, save; print | NameError on the first line of the first pass. Nothing is sent. Request dropped at r1. | 9 |
| 45 | print, link, route, save; connect | `print` runs, then NameError on the next line. Request dropped at r1. | 9 |
| 46 | print, connect, link, route; save | No crash: `print` does not use `conn`. But the save is now after the loop and reaches r2 only. Request dropped at r1 after the reload. | 6, 7 |
| 47 | connect, route, save, show; link | The link is never brought up on r1. Routes are saved on both routers and never installed. Neither ping completes. | 2, 3 |

### Experience direction

- **Visual metaphor:** the two-router diagram is the scoreboard.
- **Memorable moments:** in *A route in each direction* the request arrives and the reply stops at r2 with a marker on that router. In every round with a reload check the ping works, the routers reload, and the same ping fails.
- **Code acting on a world:** the highlighted script line and the marked state row move together, so the player sees which line did what.
- **Layout:** one board that fits the window. The ticket is a strip across the top; the script is on the left with the terminal (the script log) under it; the network, with each router's state and then the ping trace and the rules, is on the right; the cards are a hand along the bottom beside Run and the other buttons. A window too short or too narrow for that keeps the same parts and lets the page scroll.

### Key Entities

- **Round:** one challenge. Has a ticket (hostA's complaint and thanks), a new idea, its About this round notes (worked example, limits, sources), a hint, a starting state for both routers, a script scaffold, a tray of cards, and a learning outcome.
- **Script scaffold:** the fixed lines of a round's script plus its typed blank slots.
- **Slot:** a blank in the scaffold. Has a type (device, config line or statement) and holds at most one card.
- **Card:** a piece of script the player can place. Has a type and the text it contributes.
- **Router state:** for each router, whether each interface is enabled, the running configuration's static routes, the startup configuration, and the routing table derived from them.
- **Run:** one execution of the filled script from the round's starting state. Produces a line-by-line script log with what Netmiko sent, the state changes, one or two ping traces, and a solved or unsolved result.
- **Ping trace:** the path of the request and of the reply, each ending in *delivered* or *dropped at* a named router with a reason.
- **Session:** the current round, and for each round the placement that solved it, its run count, whether the hint was used, whether it is solved, and whether it was solved on the first Run.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every placement of every round produces the hand-written expected result. For the six rounds small enough to list that is 37 of 37 cases, with exactly 7 solving placements (cases 1, 7, 11, 14, 15, 20 and 32). For *The whole script* it is all 720 placements against the hand-written rule, with exactly 4 solving, plus the ten named cases 38 to 47. A round too large to list (more than 40 placements) is checked by a hand-written rule applied to every placement, plus a named case for each kind of outcome.
- **SC-002**: Every acceptance criterion AC1–AC11 has a recorded result of pass, fail or not run, with the date and environment.
- **SC-003**: A first-time player from the target audience finishes all seven rounds in 10–20 minutes. The project has one author, who is not a first-time player: this is recorded as not run unless such a player is available.
- **SC-004**: The author completes all seven rounds using only the keyboard.
- **SC-005**: With reduced motion set, every Run shows the same log and trace text as without it, with no waiting.
- **SC-005a**: All seven rounds can be completed in a browser window 768 px wide with every control reachable.
- **SC-006**: After a deliberately wrong placement, the author can say which line the router rejected or ignored, where the traffic stopped, and which rule explains it, from the feedback alone.
- **SC-007**: The author, in a review pass separate from the build, has checked each of the eight rules against its reference; the result is recorded as a self-check, and each rule with no reference is listed as a known limit.
- **SC-008**: Someone else can start and play the game from a fresh copy by following the README, which states what was built, the exact run and test commands, and the remaining limits. The README says that the tests need Node and that playing does not.

## Assumptions

- **Build budget:** the first build, of four rounds, had 90 minutes with a coding agent. The three added rounds and the take-away script were built afterwards. If time runs short on any later change, take the last round out of play first (its content and its tests stay, so every placement is still tested), then the line-by-line highlight together with the per-router pause in the ping animation (FR-012a); the text trace keeps its per-router lines. Do not cut the simulator-computed outcomes, the reset on every Run, the text trace, round 2, the 19-placement test, or the repeating ping stopping where the simulator says (it may fall back to a plain dot).
- **Stretch features:** sound and drag-and-drop. Dragging, if added, is layered on the same select-then-select action.
- **Non-goals:** free typing, real Python execution, real devices, accounts, a backend, runtime AI, a leaderboard, a level editor, a third router, alternate paths, and any simulation of the behaviour listed under *Not simulated*.
- **Router wording until captured:** two messages need capturing from an IOS or IOS XE router (lab, CML or a sandbox) before they ship as quotations. Until then feedback paraphrases (FR-018).
  - `no shutdown` at global configuration level. Expected `% Invalid input detected at '^' marker.`, but some platforms may print `% Incomplete command.` instead. Round 1's feedback depends on which.
  - `ip route 10.10.0.0 255.255.255.0 192.0.2.1` on the router that owns 192.0.2.1. Expected `%Invalid next hop address (it's this router)`.
- **Test prerequisite:** the automated tests run from a terminal and need Node installed. Playing the game needs only a browser. The README states both.
- **Rule check:** the references were gathered by the build agent. The author checks each rule against them before release, in a pass separate from the build, and records it as a self-check (SC-007; constitution, Governance).
- **Unsourced rules:** rules 1 and 2 ship labelled as unsourced unless a reference is found.
- **Defaults chosen where the source was silent** (not raised in clarification):
  - A card of the wrong type is refused with a text message. (Adopted in the plan's play-screen contract.)
  - In *Save on every router* the scaffold's fixed lines supply each router's own route; the player places only the two statements. (Adopted in the plan's content contract.)
  - The narrow-window requirement (FR-032) comes from the constitution, not the source document; its 768 px threshold was set in clarification.
