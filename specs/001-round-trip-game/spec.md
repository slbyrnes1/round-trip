# Feature Specification: Round Trip — first playable game

**Feature Branch**: `001-round-trip-game`

**Created**: 2026-11-17

**Status**: Clarified

**Input**: User description: "Copy the ~/Desktop/SPEC.md into StarterKit, then ingest it and let's write a real SPEC.md based on it". Source document: `StarterKit/SPEC.md` (Round Trip · First playable specification). Governing document: `.specify/memory/constitution.md` v1.0.0.

## Summary

Round Trip is a browser game for network engineers who are new to automation. The player finishes a short Netmiko-style script by placing code cards into its blanks, runs it against two simulated routers, and watches whether a ping gets from hostA to hostB and back.

Each round shows a topology, the current state of both routers, and a script with blank slots. The player places cards from a tray into the slots and presses Run. A correct script ends with the request and the reply both delivered. An incorrect script shows the hop where traffic stopped and the script line that caused it. The session ends when all four rounds are solved.

**The misconception the game targets:** people believe a script that ran without crashing has fixed the network. The game separates three things that are easy to confuse: what the script sent, what the router has in its configuration, and what traffic actually does.

**Learner:** network engineers new to automation, or early-career engineers who know basic IOS CLI. They know what an interface, an IP subnet and a static route are, and have seen Python. No Netmiko experience is needed.

**Session target:** 5–10 minutes for a first playthrough, with unlimited thinking time.

### Learning outcomes

| ID | After playing, the learner can… | The game asks them to… | Evidence of success |
| --- | --- | --- | --- |
| LO1 | Order configuration lines so each runs in the right CLI context, and recognise that a rejected line does not stop the script | Place `interface` and `no shutdown` cards in order | Round 1 solved; the link turns up and the ping completes |
| LO2 | Diagnose a one-way path and identify that traffic needs a route in each direction | Choose which router needs a route and which `ip route` card it needs | Round 2 solved; request and reply are both delivered |
| LO3 | Save a change so it survives a reload, on every router a loop touches | Place the `save_config()` card, including inside or after a `for` loop | Rounds 3 and 4 solved; the ping still completes after both routers reload |

## Clarifications

### Session 2026-11-17

- Q: After a failed Run, what should the two router state panels show while the player decides what to change? → A: The failed Run's result until the player changes any card, then the starting state, with a label saying which is shown.
- Q: Should a round still earn the first run mark if the player opened the hint before solving it on their first Run? → A: Yes. The mark means "solved on Run 1" only; hint use is shown in its own column beside it.
- Q: While a Run is still playing line by line, what should happen if the player presses Run again or wants to get to the result faster? → A: Run is disabled during playback, and a separate Skip control jumps to the finished log, trace and feedback; the Run is counted once.
- Q: Once a round has started, can the player go back and re-read that round's briefing? → A: Yes. A Briefing control reopens it at any time; reopening is not recorded and changes nothing in the round.
- Q: What is the narrowest browser window in which the game must be fully playable and checked before release? → A: 768 px wide; below that the page may scroll but is not checked.
- Q: When the player selects, places, returns or swaps a card, before pressing Run, what feedback must the game give? → A: Every card action shows motion and a one-sentence status message; with reduced motion, the message alone.
- Q: How much should the ping animation show as the packet travels: just the dot moving and stopping, or also the routing decision each router makes? → A: The dot pauses at each router while that router's matching routing-table row is highlighted, or "no matching route" is shown; then it moves on or is dropped.
- Q: If the player has a card selected and then selects a slot that already holds a card of the same type, what should happen? → A: Swap: the selected card goes into the slot and the card that was there returns to the tray. With no card selected, selecting a filled slot returns its card.
- Q: After a round is solved, can the player still move its cards around before pressing Next? → A: No. Cards and slots lock; the solving script and its result stay on screen until Next.
- Q: Must another workshop attendee be able to run the game's automated tests using only a web browser, or is it acceptable for the tests to need Node installed? → A: Node is acceptable. Tests run from a terminal; the README states that Node is needed for tests and not for playing.
- Q: Why force the player to wait while a Run plays, rather than letting them act? → A: Don't. A Run is counted and its result recorded the moment Run is pressed, so playback can be interrupted freely: every control stays available, pressing Run during playback replays it without counting, and playback restarts from the beginning after the briefing or a cancelled restart. This replaces "Run is disabled during playback" above; Skip stays.

## User Scenarios & Testing *(mandatory)*

The acceptance scenarios keep the source document's identifiers (AC1–AC11) so that release evidence can be recorded against them. All three stories are P1 in the source. They are listed in build order: story 1 alone is a playable single round, story 2 makes it a complete game, and story 3 makes it usable by everyone in the workshop.

### User Story 1 - Make and understand a decision (Priority: P1)

A learner reads a round's briefing, inspects the topology and both routers' state, places cards into the script's blank slots and presses Run. The script plays one line at a time, the state it changes is marked, and a ping trace shows whether the request and the reply were delivered. The learner then reads why, and either retries or moves on.

**Why this priority**: this is the whole teaching mechanic. Without a decision followed by a visible, explained consequence there is no game.

**Independent Test**: play round 1 alone. Place the solving cards and confirm the round trip completes with an explanation. Then place a wrong order and confirm the feedback names the rejected line, the trace shows where traffic stopped, and the round can be retried.

**Acceptance Scenarios**:

1. **AC1** — **Given** a fresh session, **When** I start, **Then** I see the round 1 briefing before any slots can be filled.
2. **AC2** — **Given** round 1, **When** I place `interface GigabitEthernet0/1` then `no shutdown` and press Run, **Then** the link shows up, the trace reads "Request delivered to hostB. Reply delivered to hostA.", and an explanation appears.
3. **AC3** — **Given** round 1, **When** I place `no shutdown` then `interface GigabitEthernet0/1` and press Run, **Then** feedback says the router rejected `no shutdown` because no interface was selected yet and that the script carried on without stopping, the trace shows the request dropped at r1 because the link to r2 is down, the round stays unsolved, and I can retry.
4. **AC4** — **Given** any round with an empty slot, **When** I press Run, **Then** guidance names the empty slot and the run count and completion are unchanged.
5. **AC5** — **Given** any Run with all slots filled, **Then** each script line is highlighted in order and any state it changed is marked, before the ping trace is shown.

---

### User Story 2 - Learn from help and finish the game (Priority: P1)

A learner who is stuck opens the round's hint, which explains the method without giving the answer. Each Run is counted. When a round is solved the learner presses Next, and after the fourth round sees a summary of how each round went. The learner can restart the whole session after confirming.

**Why this priority**: hints, honest counting and a summary turn a single puzzle into a session a learner can finish and reflect on.

**Independent Test**: play all four rounds from a fresh start, using the hint in one round and solving another on the first Run. Confirm the counter, the summary, and Restart with both Confirm and Cancel.

**Acceptance Scenarios**:

1. **AC6** — **Given** any round, **When** I open the hint, **Then** it explains the method without naming a card, its use is recorded, and the round is not marked solved.
2. **AC7** — **Given** an unsolved round, **When** I press Run with all slots filled, **Then** the visible run counter goes up by one. **Given** a solving Run, **Then** the round completes once and Run is disabled afterwards.
3. **AC8** — **Given** a solved round, **When** I press Next, **Then** the following round's briefing opens. **Given** round 4 is solved, **When** I press Next, **Then** the session summary opens and shows runs, hint use and the first-run mark for every round.
4. **AC9** — **Given** any point in the session, **When** I press Restart, **Then** I am asked to confirm. Confirming clears the session and returns to the first briefing. Cancelling preserves the session.

---

### User Story 3 - Play with accessible controls (Priority: P1)

A learner plays the whole game from the keyboard, or with assistive technology, or with reduced motion set, and gets the same information and the same outcome as a learner using a mouse and watching the animation.

**Why this priority**: the constitution makes access part of the core game, and release requires a teammate to finish all four rounds using only the keyboard.

**Independent Test**: complete all four rounds using only the keyboard. Repeat one round with reduced motion set and confirm the log and trace text appear at once with nothing missing.

**Acceptance Scenarios**:

1. **AC10** — **Given** any round, **Then** cards, slots, Run, Hint, Next and Restart have visible focus and accessible names, and every one can be operated from the keyboard.
2. **AC11** — **Given** any Run, **Then** the script log and ping trace are text, stay on screen, and are announced to assistive technology. **Given** reduced motion is set, **Then** the log and trace text appear immediately and no information is lost.

---

### Edge Cases

- **Empty slot at Run:** guidance names the empty slot; nothing is counted (AC4).
- **Card and slot of different types:** the placement is refused with a text message saying which type the slot takes. Nothing else changes.
- **Selecting a filled slot with no card selected:** its card returns to the tray, with motion and a status message like any other card action.
- **Selecting a filled slot with a card of the same type selected:** the two swap; the displaced card returns to the tray and the status message names both.
- **Card changed after a failed Run:** the state panels and diagram return to the starting state and their label changes to say so; the last Run's log, trace and feedback remain.
- **Card or slot selected after solving:** nothing moves; the solving script stays as it is.
- **Run pressed again after solving:** nothing happens; the round completes once and the counter does not move (AC7).
- **Run pressed while a Run is still playing:** playback restarts from the beginning; nothing more is counted.
- **Briefing opened, or Restart opened and cancelled, during playback:** playback restarts from the beginning when the player returns to the round. A confirmed Restart discards it with the rest of the session.
- **Hint opened during playback:** the hint shows and playback carries on.
- **Card changed during playback of a failed Run:** playback ends, and the panels return to the starting state as after any card change. The Run stays counted.
- **Skip pressed during playback:** the finished log, trace and feedback appear at once, identical to what full playback would have shown; the Run is counted once.
- **A configuration line the router accepts but that changes nothing** (the route already exists, the interface is already up): feedback says the line was accepted and nothing changed.
- **A rejected line in the middle of a script:** the remaining lines still run (rule 8).
- **A statement placed after the loop:** it acts on the last router only (rule 7).
- **Rounds 3 and 4, first ping passes and second fails:** the round stays unsolved. Only the ping after the reload decides the round.
- **Hint opened before, during or after a failed Run:** recorded once per round; it never changes the run count or completion.
- **Hint opened, then solved on Run 1:** the summary shows both the first-run mark and that the hint was used.
- **Briefing reopened mid-round:** closing it returns to the round exactly as it was; nothing is recorded.
- **Restart cancelled:** round, placed cards, run counts and hint records are all unchanged.
- **Page reload:** the session starts again from the round 1 briefing.
- **Broken round content** (the tray cannot fill the slots, or no placement solves the round): a content error naming the round replaces the whole game; nothing is graded and no progress is given.
- **Browser window 768 px wide:** the action buttons stay reachable; dense panels may scroll inside their own labelled area.
- **Browser window narrower than 768 px:** the page may scroll; this is not checked in this version.

## Requirements *(mandatory)*

### Functional Requirements

**Round flow**

- **FR-001**: Each round MUST open with its own briefing, shown before any slot can be filled. The briefing gives the one new idea for the round, the terms and script calls it needs, how to read the state panel, a worked example that differs from the challenge, and the model limits that affect what the player can conclude.
- **FR-002**: The round 1 briefing MUST state that `send_config_set` does not stop when the router rejects a line.
- **FR-002a**: A **Briefing** control on the play screen MUST reopen the current round's briefing at any time. Reopening it is not recorded as assistance and MUST NOT change the placed cards, the run count, the hint record or completion.
- **FR-003**: Every round MUST open with a ping from the starting state. The opening trace says only where traffic stopped; the reason is left for the player to find in the state panels. The opening ping shows a moving dot and one summary sentence only: it has no per-router pause and no per-router trace lines.
- **FR-004**: Every interface address, both router state panels, the full script and the run counter MUST be visible throughout a round. Nothing needed to reason about the round may be hidden behind hover.
- **FR-005**: Rounds are played in order, 1 to 4. A round advances only when the player presses Next, and Next is enabled only when the round is solved.

**Placing cards**

- **FR-006**: The player places a card by selecting it and then selecting a slot. This MUST work the same way with mouse, touch and keyboard.
- **FR-007**: A card fits only slots of its own type (device, config line or statement), and each card is used at most once per round.
- **FR-008**: Selecting a filled slot with no card selected MUST return its card to the tray. Selecting a filled slot with a card of the same type selected MUST swap them: the selected card goes into the slot and the card that was there returns to the tray.

- **FR-008a**: Every card action (select, place, return, swap) MUST show motion on the card and its slot and MUST show a one-sentence status message naming the card and the slot. The message is announced to assistive technology. With reduced motion set, the message appears alone and at once. This feedback never shows or hints at the outcome of a Run.

**Running the script**

- **FR-009**: Run with any empty slot MUST show guidance naming the empty slot and MUST NOT change the run count or completion.
- **FR-010**: Every Run MUST start from the round's starting state. Nothing carries over from an earlier Run, so the outcome depends only on the round and the cards placed.
- **FR-011**: A Run with all slots filled MUST play the script one line at a time, highlighting each line as it runs and marking the state row it changed, and only then show the ping trace.
- **FR-011a**: A Run MUST be counted and its result recorded at the moment Run is pressed; playback only presents that result. A **Skip** control, available during playback, MUST jump to the finished script log, ping trace and feedback. Skipping shows the same text and the same result as full playback.
- **FR-011b**: The player MUST never be made to wait for playback. Every control stays available while a Run plays. Pressing Run during playback restarts the playback from the beginning and MUST NOT count another Run. Opening the hint leaves playback running. Closing the briefing, or cancelling a restart, restarts playback from the beginning. Changing a card or pressing Next ends playback.
- **FR-012**: The ping trace MUST be shown both as moving dots on the diagram and as text. Request dots travel left to right and reply dots right to left. A drop is marked on the router where it happened.
- **FR-012a**: In every ping that follows a Run (not the opening ping), at each router the dot MUST pause while that router's state panel highlights the routing-table row it used to forward the packet, or shows "no matching route" when there is none; the dot then moves on or is dropped. The text trace MUST carry the same information: under its summary sentence it lists, for each router the packet reached, the route used or that no route matched.
- **FR-013**: In rounds 3 and 4 a Run MUST ping, reload both routers, then ping again. The round is solved only if the second ping completes.
- **FR-014**: Every outcome MUST be computed by applying the rules in *Simulated model* to the starting state and the placed cards. No stored answer key may decide or override an outcome.

**Feedback**

- **FR-015**: After every Run, feedback MUST say, in this order: what the router did with each line, where the traffic stopped, and the rule that explains the result. A solving Run explains why it works.
- **FR-016**: When the router rejects a line, feedback MUST say which line, why, and that the script carried on.
- **FR-017**: The feedback voice is patient and specific. It never blames the player.
- **FR-018**: A router message MUST be shown as a quotation only once it has been captured from a real IOS or IOS XE device. Until then feedback paraphrases what the router did.

**State display**

- **FR-019**: Each router's state panel MUST show: the state of `Gi0/1` as *up*, *administratively down* (shut on this router) or *down* (the other end is shut); the static routes in the running configuration; the routing table; and a *saved* or *unsaved changes* badge.
- **FR-019a**: The state panels and the diagram MUST carry a text label saying which state they show: *Starting state* or *After your last run*. After a failed Run they show the result of that Run. When the player then places or removes any card, they MUST return to the round's starting state. The script log, trace and feedback from the last Run stay on screen.
- **FR-020**: The diagram MUST draw the r1–r2 link dark when it is down and lit when it is up, and MUST also state the link state in text.

**Progress, help and session**

- **FR-021**: A live **Runs: n** counter sits beside Run. Each Run with all slots filled adds one, until the round is solved.
- **FR-022**: A solving Run completes the round exactly once. Run is disabled afterwards, and a repeated Run MUST NOT award progress again.
- **FR-022a**: Once a round is solved its cards and slots MUST lock. The solving script, the state panels labelled *After your last run*, the log, the trace and the feedback stay on screen until Next.
- **FR-023**: A failed Run MUST leave the round playable with the cards still placed.
- **FR-024**: Each round has exactly one hint. It explains the method without naming a card. Using it is recorded and never marks a round solved.
- **FR-025**: After round 4, Next opens a session summary listing each round with its run count, whether the hint was used, and a **first run** mark for rounds solved on the first Run. The mark depends only on the run count: a round solved on Run 1 earns it whether or not the hint was opened, and hint use is shown in its own column.
- **FR-026**: The run counter and the first-run mark are the only scoring. There are no points, lives, timer, leaderboard or streak. Retries and hints carry no penalty.
- **FR-027**: Restart MUST ask for confirmation. Confirming clears the session and returns to the round 1 briefing. Cancelling preserves the session.
- **FR-028**: Progress is held for the page session only. Reloading the page starts again.

**Access**

- **FR-029**: Cards, slots, Run, Skip, Briefing, Hint, Next and Restart MUST have visible focus and accessible names and MUST be operable from the keyboard.
- **FR-030**: The script log and ping trace MUST be text, stay on screen, and be announced to assistive technology. Success and failure MUST be conveyed in text as well as colour.
- **FR-031**: With reduced motion set, the log and trace text MUST appear immediately with no information lost. Animation MUST never delay feedback or controls.
- **FR-032**: The game MUST be fully playable on a typical laptop and in a browser window 768 px wide: every control reachable, and all text readable without horizontal scrolling of the page. Dense panels may scroll inside their own labelled area. Below 768 px the page may scroll and is not checked in this version.

**Content integrity**

- **FR-033**: All round content MUST be checked before the first briefing is shown. If any round's tray cannot fill its slots, or any round has no solving placement, or the content is otherwise invalid, the game MUST show a content error naming each affected round in place of the game. Nothing is graded and no progress is given.
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
| Netmiko API documentation, [`netmiko.base_connection`](https://ktbyers.github.io/netmiko/docs/netmiko/base_connection.html) | The call names |
| Cisco, [IP Routing Configuration Guide, IOS XE 17.17 (Catalyst 9600), Protocol-Independent Features](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9600/software/release/17-17/configuration_guide/rtng/b_1717_rtng_9600_cg/protocol_independent_features.html) — a static route leaves the routing table when its interface goes down or no valid next hop is found, and stays in the configuration | Rule 3 |
| Cisco, [IOS IP Routing: Protocol-Independent Command Reference, `ip route`](https://www.cisco.com/c/en/us/td/docs/ios/iproute_pi/command/reference/iri_book/iri_pi1.html) — a static route is a candidate only if its next hop resolves to a valid output interface | Rule 3 and the timing note |
| Cisco, [Using the Command-Line Interface, Catalyst 9300, IOS XE 17.17](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-17/command_reference/b_1717_9300_cr/using_the_command_line_interface.html), common CLI error messages | The wording `% Invalid input detected at '^' marker.` and `% Incomplete command.` |
| Cisco Learning Network, [thread 46334](https://learningnetwork.cisco.com/thread/46334) — community report of `%Invalid next hop address (it's this router)` | Rule 4. A forum post, not Cisco documentation |
| **No source found yet** | Rule 1's claim that `no shutdown` is rejected at global configuration level; rule 2 |

### Round content

Four rounds, one mechanic. The pass condition is always the same: request and reply both delivered.

| Round | New idea | Starting state | Slots | Tray |
| --- | --- | --- | --- | --- |
| 1 | CLI context; a rejected line does not stop the script (LO1) | r1 `Gi0/1` shut down. r2 `Gi0/1` up. Both static routes configured and saved. | 2 config lines on r1 | `interface GigabitEthernet0/1`, `no shutdown`, `interface GigabitEthernet0/0` |
| 2 | Traffic needs a route in each direction (LO2) | Link up. r1 has its route to 10.20.0.0/24. r2 has none. | 1 device, 1 config line | `r1`, `r2`, `ip route 10.20.0.0 255.255.255.0 192.0.2.2`, `ip route 10.10.0.0 255.255.255.0 192.0.2.1` |
| 3 | A change that works is not yet saved (LO3) | Link up. r2 complete and saved. r1 has no route; the script adds it. | 1 statement after `send_config_set` on r1 | `conn.save_config()`, `conn.send_command("show running-config")`, `print("done")` |
| 4 | A call after a loop runs once, on the last router (LO3) | Link up. Neither router has a route; the loop adds each router's route. | 1 statement inside the loop, 1 after it | `conn.save_config()`, `conn.send_command("show running-config")`, `print("done")` |

**Worked interaction (round 2).** The link is up. r1 already has `ip route 10.20.0.0 255.255.255.0 192.0.2.2`; r2 has no static route. The opening trace reads: "Request delivered to hostB. Reply dropped at r2." A player thinking only about the forward direction places `r1` and `ip route 10.20.0.0 255.255.255.0 192.0.2.2`, and presses Run. Feedback: "r1 already had this route, so nothing changed. The request still reaches hostB. The reply is dropped at r2: r2 has no route back to 10.10.0.0/24. Traffic needs a route in each direction." The counter reads Runs: 1. The player swaps to `r2` and `ip route 10.10.0.0 255.255.255.0 192.0.2.1`. The reply dots now travel back to hostA.

### Required outcome cases

This is every possible placement: 19 in total. Expected results are worked by hand from the rules above, not taken from the game's own evaluator. For rounds 3 and 4 the first ping completes in every case, so only the second ping is listed.

**Round 1** (slot 1, slot 2)

| # | Placement | Expected result | Rule |
| --- | --- | --- | --- |
| 1 | `interface Gi0/1`, `no shutdown` | Link up. Both static routes install. Request and reply delivered. **Solved.** | 1, 2, 3 |
| 2 | `no shutdown`, `interface Gi0/1` | `no shutdown` rejected; script carries on. Request dropped at r1: link to r2 is down. | 1, 8 |
| 3 | `interface Gi0/0`, `no shutdown` | No change; `Gi0/0` was already up. Request dropped at r1: link to r2 is down. | 2 |
| 4 | `no shutdown`, `interface Gi0/0` | `no shutdown` rejected; script carries on. Request dropped at r1: link to r2 is down. | 1, 8 |
| 5 | `interface Gi0/1`, `interface Gi0/0` | No change; nothing enabled the interface. Request dropped at r1: link to r2 is down. | 1 |
| 6 | `interface Gi0/0`, `interface Gi0/1` | Same as 5. | 1 |

**Round 2** (device, config line)

| # | Placement | Expected result | Rule |
| --- | --- | --- | --- |
| 7 | `r2`, route to 10.10.0.0/24 via 192.0.2.1 | Route installs on r2. Request and reply delivered. **Solved.** | 3, 5 |
| 8 | `r1`, route to 10.20.0.0/24 via 192.0.2.2 | No change; r1 already had it. Request delivered. Reply dropped at r2: no route to 10.10.0.0/24. | 5 |
| 9 | `r1`, route to 10.10.0.0/24 via 192.0.2.1 | Rejected: 192.0.2.1 is r1's own address. Request delivered. Reply dropped at r2. | 4, 8 |
| 10 | `r2`, route to 10.20.0.0/24 via 192.0.2.2 | Rejected: 192.0.2.2 is r2's own address. Request delivered. Reply dropped at r2. | 4, 8 |

**Round 3** (statement)

| # | Placement | Expected result after reload | Rule |
| --- | --- | --- | --- |
| 11 | `save_config()` | r1 keeps its route. Request and reply delivered. **Solved.** | 6 |
| 12 | `send_command("show running-config")` | r1 loses its route. Request dropped at r1. | 6 |
| 13 | `print("done")` | Same as 12. | 6 |

**Round 4** (inside the loop, after the loop)

| # | Placement | Expected result after reload | Rule |
| --- | --- | --- | --- |
| 14 | `save_config()`, `send_command(…)` | Both routers saved. Request and reply delivered. **Solved.** | 6 |
| 15 | `save_config()`, `print("done")` | Same as 14. **Solved.** | 6 |
| 16 | `send_command(…)`, `save_config()` | Only r2 saved. r2 keeps its route, r1 loses its route. Request dropped at r1. | 6, 7 |
| 17 | `print("done")`, `save_config()` | Same as 16. | 6, 7 |
| 18 | `send_command(…)`, `print("done")` | Neither saved. Request dropped at r1. | 6 |
| 19 | `print("done")`, `send_command(…)` | Same as 18. | 6 |

### Experience direction

- **Visual metaphor:** the two-router diagram is the scoreboard.
- **Memorable moments:** in round 2 the request arrives and the reply stops at r2 with a marker on that router. In rounds 3 and 4 the ping works, the routers reload, and the same ping fails.
- **Code acting on a world:** the highlighted script line and the marked state row move together, so the player sees which line did what.
- **Layout:** diagram on top, script and tray on the left, router state and trace on the right.

### Key Entities

- **Round:** one challenge. Has a new idea, a briefing, a hint, a starting state for both routers, a script scaffold, a tray of cards, and a learning outcome.
- **Script scaffold:** the fixed lines of a round's script plus its typed blank slots.
- **Slot:** a blank in the scaffold. Has a type (device, config line or statement) and holds at most one card.
- **Card:** a piece of script the player can place. Has a type and the text it contributes.
- **Router state:** for each router, whether each interface is enabled, the running configuration's static routes, the startup configuration, and the routing table derived from them.
- **Run:** one execution of the filled script from the round's starting state. Produces a line-by-line script log, the state changes, one or two ping traces, and a solved or unsolved result.
- **Ping trace:** the path of the request and of the reply, each ending in *delivered* or *dropped at* a named router with a reason.
- **Session:** the current round, and for each round its run count, whether the hint was used, whether it is solved, and whether it was solved on the first Run.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 19 placements produce the hand-written expected result: 19 of 19, with exactly 5 solving placements (cases 1, 7, 11, 14 and 15).
- **SC-002**: Every acceptance criterion AC1–AC11 has a recorded result of pass, fail or not run, with the date and environment.
- **SC-003**: A first-time player from the target audience finishes all four rounds in 5–10 minutes.
- **SC-004**: A teammate completes all four rounds using only the keyboard.
- **SC-005**: With reduced motion set, every Run shows the same log and trace text as without it, with no waiting.
- **SC-005a**: All four rounds can be completed in a browser window 768 px wide with every control reachable.
- **SC-006**: After a deliberately wrong placement, a teammate can say which line the router rejected or ignored, where the traffic stopped, and which rule explains it, from the feedback alone.
- **SC-007**: A second person has checked each of the eight rules against its reference, and each rule with no reference is listed as a known limit.
- **SC-008**: Another attendee can start and play the game from a fresh copy by following the README, which states what was built, the exact run and test commands, and the remaining limits. The README says that the tests need Node and that playing does not.

## Assumptions

- **Build budget:** 90 minutes with a coding agent. If time runs short, take round 4 out of play first (its content and its six test cases stay, so all 19 placements are still tested), then the line-by-line highlight together with the per-router pause in the ping animation (FR-012a); the text trace keeps its per-router lines. Do not cut the simulator-computed outcomes, the reset on every Run, the text trace, round 2, or the 19-placement test.
- **Stretch features:** sound and drag-and-drop. Dragging, if added, is layered on the same select-then-select action.
- **Non-goals:** free typing, real Python execution, real devices, accounts, a backend, runtime AI, a leaderboard, a level editor, a third router, alternate paths, and any simulation of the behaviour listed under *Not simulated*.
- **Router wording until captured:** two messages need capturing from an IOS or IOS XE router (lab, CML or a sandbox) before they ship as quotations. Until then feedback paraphrases (FR-018).
  - `no shutdown` at global configuration level. Expected `% Invalid input detected at '^' marker.`, but some platforms may print `% Incomplete command.` instead. Round 1's feedback depends on which.
  - `ip route 10.10.0.0 255.255.255.0 192.0.2.1` on the router that owns 192.0.2.1. Expected `%Invalid next hop address (it's this router)`.
- **Test prerequisite:** the automated tests run from a terminal and need Node installed. Playing the game needs only a browser. The README states both.
- **Second-person rule check:** the references were gathered by the build agent. A named second person checks each rule against them before release (SC-007).
- **Unsourced rules:** rules 1 and 2 ship labelled as unsourced unless a reference is found.
- **Defaults chosen where the source was silent** (not raised in clarification):
  - A card of the wrong type is refused with a text message. (Adopted in the plan's play-screen contract.)
  - In round 4 the scaffold's fixed lines supply each router's own route; the player places only the two statements. (Adopted in the plan's content contract.)
  - The narrow-window requirement (FR-032) comes from the constitution, not the source document; its 768 px threshold was set in clarification.
