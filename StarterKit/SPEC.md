# Round Trip · First playable specification

*Working title. Input to the Spec Kit **specify** step. Build budget: 90 minutes with a coding agent.*

## The pitch

**You finish a short Netmiko-style script by placing code cards into its blanks, run it against two simulated routers, and watch whether a ping gets from hostA to hostB and back.**

The player is an automation engineer responsible for two routers. Each round shows a topology, the current device state, and a script with blank slots. The player places cards from a tray into the slots and presses Run. A correct script ends with the ping request and its reply both delivered, and the traffic dots complete the round trip. An incorrect script shows the hop where traffic stopped and the script line that caused it. The session ends when all four rounds are solved.

## Who this is for

- **Learner:** network engineers who are new to automation, or early-career engineers who know basic IOS CLI.
- **Assumed knowledge:** what an interface, an IP subnet and a static route are. Has seen Python. No Netmiko experience needed.
- **What the briefing teaches:** the script calls that round uses, how to read the state panel, and the one new idea for that round. The round 1 briefing states that `send_config_set` does not stop when the router rejects a line.
- **Why interaction helps:** people believe a script that ran without crashing has fixed the network. The game separates three things that are easy to confuse: what the script sent, what the router has in its configuration, and what traffic actually does.
- **Session target:** 5–10 minutes for a first playthrough, with unlimited thinking time.

## Learning outcomes and evidence

| ID | After playing, the learner can… | The game asks them to… | Evidence of success |
| --- | --- | --- | --- |
| LO1 | Order configuration lines so each runs in the right CLI context, and recognise that a rejected line does not stop the script | Place `interface` and `no shutdown` cards in order | Round 1 solved; the link turns up and the ping completes |
| LO2 | Diagnose a one-way path and identify that traffic needs a route in each direction | Choose which router needs a route and which `ip route` card it needs | Round 2 solved; request and reply are both delivered |
| LO3 | Save a change so it survives a reload, on every router a loop touches | Place the `save_config()` card, including inside or after a `for` loop | Rounds 3 and 4 solved; the ping still completes after both routers reload |

## The technical model

### Topology (fixed for every round)

```text
hostA ───────── r1 ═══════════ r2 ───────── hostB
10.10.0.10   Gi0/0  Gi0/1   Gi0/1  Gi0/0   10.20.0.10
             10.10.0.1  192.0.2.1  192.0.2.2  10.20.0.1
   10.10.0.0/24        192.0.2.0/30        10.20.0.0/24
```

`Gi0/0` on each router faces its host and is always up. `Gi0/1` is the link between the routers.

### Rules being taught

1. **CLI context.** `no shutdown` and `shutdown` are accepted only after an `interface …` line in the same `send_config_set` call. At global configuration level the router rejects them and nothing changes.
2. **Link state.** The r1–r2 link is up only when `Gi0/1` is enabled on both routers.
3. **Route installation.** A static route in the running configuration is installed in the routing table only if its next hop is inside a connected subnet whose link is up. A connected subnet is in the routing table only while its link is up.
4. **Own address.** The router rejects a static route whose next hop is one of its own interface addresses.
5. **Forwarding.** Each router forwards using the route in its routing table that contains the destination. No two routes overlap in this game. With no matching route the packet is dropped at that router. The reply is a separate packet from hostB to hostA and is forwarded by the same rule.
6. **Persistence.** `save_config()` copies the running configuration to the startup configuration. A reload replaces the running configuration with the startup configuration.
7. **Loop variables.** After a `for` loop ends, `conn` refers to the last connection only, so a call placed after the loop acts on the last router alone.
8. **Silent rejection.** When the router rejects a configuration line, `send_config_set` records the router's message and carries on. The script does not stop.

### Script language

A script is a fixed scaffold with typed blank slots. The only calls are:

| Call | Effect in the simulator |
| --- | --- |
| `conn = ConnectHandler(**device)` | Opens a session to the named router |
| `conn.send_config_set([...])` | Applies each configuration line in order, starting at global configuration level |
| `conn.send_command("show …")` | Reads state; changes nothing |
| `conn.save_config()` | Running configuration becomes startup configuration |

Plus `for device in [r1, r2]:` with an indented body, and `print(...)`, which does nothing. Slot types are **device**, **config line** and **statement**; a card fits only slots of its own type. Each card is used at most once per round.

**Every Run starts from the round's starting state.** Nothing carries over from an earlier run, so the outcome depends only on the round and the cards placed.

### Context, assumptions and exclusions

- **Context:** a simplified model of Cisco IOS behaviour, driven by method names taken from the Netmiko library. It is a simulator; no real device, SSH session or Python interpreter is involved.
- **Assumptions:** host addresses and gateways are correct. Router interface addresses are already configured. There is no default route.
- **Excluded behaviour:** ARP, dynamic routing, administrative distance, equal-cost paths, recursive next-hop resolution, exit-interface static routes, IPv6, enable/privilege modes, closing sessions, authentication failures, timeouts, output parsing, and ICMP error messages.
- **Simplified timing:** the game installs and withdraws static routes instantly. Cisco's `ip route` reference says a real router can take up to about a minute, because it rechecks next hops periodically.
- **References** (checked 2026-11-17):
  - Netmiko source, [`base_connection.py`](https://github.com/ktbyers/netmiko/blob/develop/netmiko/base_connection.py), `send_config_set` — `error_pattern` defaults to an empty string and `ConfigInvalidException` is raised only when a pattern is supplied and matches. Supports rule 8. The same method enters and leaves configuration mode by default.
  - Netmiko source, [`cisco/cisco_ios.py`](https://github.com/ktbyers/netmiko/blob/develop/netmiko/cisco/cisco_ios.py), `save_config` — sends `write mem` on Cisco IOS. Supports rule 6.
  - Netmiko API documentation, [`netmiko.base_connection`](https://ktbyers.github.io/netmiko/docs/netmiko/base_connection.html) — supports the call names.
  - Cisco, [IP Routing Configuration Guide, IOS XE 17.17 (Catalyst 9600), Protocol-Independent Features](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9600/software/release/17-17/configuration_guide/rtng/b_1717_rtng_9600_cg/protocol_independent_features.html) — a static route is removed from the routing table when its interface goes down or no valid next hop can be found, and stays in the configuration. Supports rule 3.
  - Cisco, [IOS IP Routing: Protocol-Independent Command Reference, `ip route`](https://www.cisco.com/c/en/us/td/docs/ios/iproute_pi/command/reference/iri_book/iri_pi1.html) — a static route is a candidate only if its next hop resolves to a valid output interface. Supports rule 3 and the timing note.
  - Cisco, [Using the Command-Line Interface, Catalyst 9300, IOS XE 17.17](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-17/command_reference/b_1717_9300_cr/using_the_command_line_interface.html), common CLI error messages — gives the wording `% Invalid input detected at '^' marker.` and `% Incomplete command.`
  - Cisco Learning Network, [thread 46334](https://learningnetwork.cisco.com/thread/46334) — community report of `%Invalid next hop address (it's this router)`. Supports rule 4, but it is a forum post, not Cisco documentation.
  - **No source found yet** for rule 1's claim that `no shutdown` is rejected at global configuration level, or for rule 2.

The briefing for each round states these limits in plain language.

## The repeatable game loop

1. **Brief:** one new idea, the terms it needs, and a worked example that differs from the challenge. Each of the four rounds has its own short briefing.
2. **Inspect:** the topology diagram, a compact state panel for each router, and the script with its blank slots. Every round opens with a ping from the starting state. The opening trace says only where traffic stopped; the reason is left for the player to find in the state panels.
3. **Choose:** the player places cards into slots, then presses **Run**. A live **Runs: n** counter sits beside the button.
4. **Explain:** the script runs one line at a time. Each line is highlighted as it runs, and the state row it changed flashes. Then the ping trace plays as moving dots and as text, followed by the rule that explains the result.
5. **Retry or advance:** a failed ping leaves the round playable with the cards still placed; a completed round trip enables **Next**.
6. **Reflect:** the session summary lists each round with its run count, whether the hint was used, and a **first run** mark for rounds solved on the first Run.

**Placing cards:** select a card, then select a slot. This works with mouse, touch and keyboard. Selecting a filled slot returns its card to the tray. Dragging is a stretch feature layered on the same action.

**State panel (per router):** the state of `Gi0/1`, shown as *up*, *administratively down* (shut on this router) or *down* (the other end is shut); the static routes in the running configuration; the routing table; and a *saved* or *unsaved changes* badge.

**Worked interaction (round 2).** The link is up. r1 already has `ip route 10.20.0.0 255.255.255.0 192.0.2.2`; r2 has no static route. The opening trace reads: "Request delivered to hostB. Reply dropped at r2." The script has a device slot and one config-line slot. A player thinking only about the forward direction places `r1` and `ip route 10.20.0.0 255.255.255.0 192.0.2.2`, and presses Run. Feedback: "r1 already had this route, so nothing changed. The request still reaches hostB. The reply is dropped at r2: r2 has no route back to 10.10.0.0/24. Traffic needs a route in each direction." The counter reads Runs: 1. The player swaps to `r2` and `ip route 10.10.0.0 255.255.255.0 192.0.2.1`. The reply dots now travel back to hostA.

## Required stories and acceptance criteria

### US1 · Make and understand a decision — P1

- **AC1:** Given a fresh session, when I start, then I see the round 1 briefing before any slots can be filled.
- **AC2:** Given round 1, when I place `interface GigabitEthernet0/1` then `no shutdown` and press Run, then the link shows up, the trace reads "Request delivered to hostB. Reply delivered to hostA.", and an explanation appears.
- **AC3:** Given round 1, when I place `no shutdown` then `interface GigabitEthernet0/1` and press Run, then feedback says the router rejected `no shutdown` because no interface was selected yet and that the script carried on without stopping, the trace shows the request dropped at r1 because the link to r2 is down, the round stays unsolved, and I can retry.
- **AC4:** Given any round with an empty slot, when I press Run, then guidance names the empty slot and the run count and completion are unchanged.
- **AC5:** Given any Run with all slots filled, then each script line is highlighted in order and any state it changed is marked, before the ping trace is shown.

### US2 · Learn from help and finish the game — P1

- **AC6:** Each round has one hint, which explains the method without naming a card. Using it is recorded and never marks a round solved.
- **AC7:** Each Run with all slots filled adds one to the visible run counter until the round is solved. A solving run completes the round once; Run is disabled afterwards.
- **AC8:** Next opens the following round's briefing; after round 4 it opens the session summary, which shows runs, hint use and the first-run mark for every round.
- **AC9:** Restart asks for confirmation, then clears the session and returns to the first briefing. Cancel preserves the session.

### US3 · Play with accessible controls — P1

- **AC10:** Cards, slots, Run, Hint, Next and Restart have visible focus and accessible names, and every one can be operated from the keyboard.
- **AC11:** The script log and ping trace are text, stay on screen, and are announced to assistive technology. With reduced motion set, the log and trace text appear immediately and no information is lost.

## Version-one content

Four rounds, one mechanic. The pass condition is always the same: request and reply both delivered. In rounds 3 and 4 the game pings, reloads both routers, then pings again, and the round is solved only if the second ping completes.

| Round | New idea | Starting state | Slots | Tray |
| --- | --- | --- | --- | --- |
| 1 | CLI context; a rejected line does not stop the script (LO1) | r1 `Gi0/1` shut down. r2 `Gi0/1` up. Both static routes configured and saved. | 2 config lines on r1 | `interface GigabitEthernet0/1`, `no shutdown`, `interface GigabitEthernet0/0` |
| 2 | Traffic needs a route in each direction (LO2) | Link up. r1 has its route to 10.20.0.0/24. r2 has none. | 1 device, 1 config line | `r1`, `r2`, `ip route 10.20.0.0 255.255.255.0 192.0.2.2`, `ip route 10.10.0.0 255.255.255.0 192.0.2.1` |
| 3 | A change that works is not yet saved (LO3) | Link up. r2 complete and saved. r1 has no route; the script adds it. | 1 statement after `send_config_set` on r1 | `conn.save_config()`, `conn.send_command("show running-config")`, `print("done")` |
| 4 | A call after a loop runs once, on the last router (LO3) | Link up. Neither router has a route; the loop adds each router's route. | 1 statement inside the loop, 1 after it | `conn.save_config()`, `conn.send_command("show running-config")`, `print("done")` |

**Progression:** sequential; retry without penalty. The run counter and first-run mark are the only scoring. No points, lives, timer, leaderboard or streak.

**Session behaviour:** progress is held in memory for the page session. Reload starts again.

## Cases the implementation must satisfy

This is every possible placement: 19 in total. Expected results are worked by hand from the rules above, not taken from the evaluator. For rounds 3 and 4 the first ping completes in every case, so only the second ping is listed.

**Round 1** (slot 1, slot 2):

| # | Placement | Expected result | Rule |
| --- | --- | --- | --- |
| 1 | `interface Gi0/1`, `no shutdown` | Link up. Both static routes install. Request and reply delivered. **Solved.** | 1, 2, 3 |
| 2 | `no shutdown`, `interface Gi0/1` | `no shutdown` rejected; script carries on. Request dropped at r1: link to r2 is down. | 1, 8 |
| 3 | `interface Gi0/0`, `no shutdown` | No change; `Gi0/0` was already up. Request dropped at r1: link to r2 is down. | 2 |
| 4 | `no shutdown`, `interface Gi0/0` | `no shutdown` rejected; script carries on. Request dropped at r1: link to r2 is down. | 1, 8 |
| 5 | `interface Gi0/1`, `interface Gi0/0` | No change; nothing enabled the interface. Request dropped at r1: link to r2 is down. | 1 |
| 6 | `interface Gi0/0`, `interface Gi0/1` | Same as 5. | 1 |

**Round 2** (device, config line):

| # | Placement | Expected result | Rule |
| --- | --- | --- | --- |
| 7 | `r2`, route to 10.10.0.0/24 via 192.0.2.1 | Route installs on r2. Request and reply delivered. **Solved.** | 3, 5 |
| 8 | `r1`, route to 10.20.0.0/24 via 192.0.2.2 | No change; r1 already had it. Request delivered. Reply dropped at r2: no route to 10.10.0.0/24. | 5 |
| 9 | `r1`, route to 10.10.0.0/24 via 192.0.2.1 | Rejected: 192.0.2.1 is r1's own address. Request delivered. Reply dropped at r2. | 4, 8 |
| 10 | `r2`, route to 10.20.0.0/24 via 192.0.2.2 | Rejected: 192.0.2.2 is r2's own address. Request delivered. Reply dropped at r2. | 4, 8 |

**Round 3** (statement):

| # | Placement | Expected result after reload | Rule |
| --- | --- | --- | --- |
| 11 | `save_config()` | r1 keeps its route. Request and reply delivered. **Solved.** | 6 |
| 12 | `send_command("show running-config")` | r1 loses its route. Request dropped at r1. | 6 |
| 13 | `print("done")` | Same as 12. | 6 |

**Round 4** (inside the loop, after the loop):

| # | Placement | Expected result after reload | Rule |
| --- | --- | --- | --- |
| 14 | `save_config()`, `send_command(…)` | Both routers saved. Request and reply delivered. **Solved.** | 6 |
| 15 | `save_config()`, `print("done")` | Same as 14. **Solved.** | 6 |
| 16 | `send_command(…)`, `save_config()` | Only r2 saved. r2 keeps its route, r1 loses its route. Request dropped at r1. | 6, 7 |
| 17 | `print("done")`, `save_config()` | Same as 16. | 6, 7 |
| 18 | `send_command(…)`, `print("done")` | Neither saved. Request dropped at r1. | 6 |
| 19 | `print("done")`, `send_command(…)` | Same as 18. | 6 |

**Unsupported content:** a round whose tray cannot fill its slots, or with no solving placement, shows a content error naming the round. It is not graded and gives no progress.

## Experience direction

- **Visual metaphor:** the two-router diagram is the scoreboard. Links are drawn dark when down and lit when up. Request dots travel left to right, reply dots right to left.
- **Memorable moments:** in round 2 the request arrives and the reply stops at r2 with a marker on that router. In rounds 3 and 4 the ping works, the routers reload, and the same ping fails.
- **Code acting on a world:** the highlighted script line and the flashing state row move together, so the player sees which line did what.
- **Always visible:** every interface address, both state panels, the full script, and the run counter.
- **Feedback voice:** patient and specific. Say what the router did with the line, then where the traffic stopped, then the rule.
- **Layout:** diagram on top, script and tray on the left, router state and trace on the right. Nothing is hidden behind hover.

## Non-goals

No free typing, real Python execution, real devices, accounts, backend, runtime AI, leaderboard or level editor. No third router, no alternate paths, and no simulation of the excluded behaviour listed above. Sound and drag-and-drop are stretch features.

## Open decisions for clarify

- **Router wording: decided, two captures needed.** Feedback quotes real IOS messages. Both need capturing from an IOS or IOS XE router (lab, CML or a sandbox) before they ship as quotes:
  - `no shutdown` typed at global configuration level. Expected `% Invalid input detected at '^' marker.`, but some platforms have global commands beginning with `shutdown` and may print `% Incomplete command.` instead. Round 1's feedback depends on which.
  - `ip route 10.10.0.0 255.255.255.0 192.0.2.1` on the router that owns 192.0.2.1. Expected `%Invalid next hop address (it's this router)`.
- **Rule check by a second person.** The references above were gathered by the build agent. The workshop constitution asks for someone else to check each rule against them.

## Release evidence

Every acceptance criterion has a recorded result. All 19 placements above are run in tests and match their hand-written expected results. A teammate completes all four rounds using only the keyboard. The README describes what was built, the exact run and test commands, and the remaining limits.

**If time runs short:** cut round 4 first, then the line-by-line highlight. Do not cut the simulator-computed outcomes, the reset on every Run, the text trace, round 2, or the 19-placement test.
