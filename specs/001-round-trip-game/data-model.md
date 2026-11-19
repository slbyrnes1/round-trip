# Data model: Round Trip — first playable game

Three kinds of data: authored content (fixed), simulation state (rebuilt on every Run), and
session state (lives for the page session).

## Authored content

Defined in full in [contracts/content.md](contracts/content.md).

| Entity | Key fields | Relationships |
| --- | --- | --- |
| Topology | hosts, routers, interfaces with address and prefix length | Shared by all rounds |
| Source | id, title, url, section, claim, kind | Referenced by rules and round notes |
| Rule | id 1–8, name, text, sourceIds | Cited by messages |
| CallNote | one text per call: connect, config, save, show, print, for | Shown as a comment beside each call in the script |
| Message | reason code, text with placeholders, ruleIds, optional quote | One per simulator reason code |
| RouterMessage | text, captured | Quoted by a message only when captured |
| Round | id, title, ticket, learningOutcome, briefing, hint, reloadCheck, start, script, tray | Ordered list of four |
| Statement | op, and its fields | Makes up a round's script; may contain slots |
| Slot | id, type, label | Sits inside a script; filled by one card of the same type |
| Card | id, type, value | Belongs to one round's tray |

## Simulation state

Built from `round.start` at the beginning of every Run and discarded afterwards (FR-010).

| Entity | Fields | Notes |
| --- | --- | --- |
| RouterConfig | shutdown: set of interface names; routes: list of config lines | Two per router: running and startup |
| RoutingTable | entries of prefix and connected-or-next-hop | Derived from the running configuration and link state; never stored |
| Result | status, steps, pings, reload, finalState | Defined in [contracts/simulator.md](contracts/simulator.md) |

Derived values:

- **Link up** = `Gi0/1` enabled on r1 and on r2.
- **Interface state shown** = *administratively down* if shut on this router; *down* if enabled
  here and shut on the other; otherwise *up*.
- **Saved** = running configuration equals startup configuration.

## Session state

One object, changed only through the transitions below.

| Field | Type | Meaning |
| --- | --- | --- |
| view | `round`, `summary`, `content-error` | What is on screen |
| roundIndex | 0 to (rounds in play − 1) | The current round, counted among the rounds in play |
| placement | slot id → card id | Cards placed in the current round |
| selectedCard | card id or none | The card waiting for a slot |
| playing | boolean | The last Run is still being played back. Presentation only: the Run is already counted and its outcome applied. The repeating ping is not playback and does not set this |
| lastResult | Result or none | The last Run of the current round |
| showing | `start` or `last-run` | Which state the panels and diagram show |
| rounds[i].runs | integer ≥ 0 | Runs counted |
| rounds[i].hintUsed | boolean | The hint was opened |
| rounds[i].solved | boolean | The round is complete |
| rounds[i].firstRun | boolean | Solved when runs was 1 |
| rounds[i].solution | placement or none | A copy of the placement that solved the round; shown as code on the summary for the last round |

### Transitions

```text
load ── content valid ──▶ round(1)                   showing = start
     └─ content invalid ─▶ content-error (replaces the game; names each affected round)

round(n) ── select card ──▶ round(n)                              selectedCard only
round(n) ── place / return / swap card ──▶ round(n)               showing = start
round(n) ── Reset routers ──▶ round(n)                            showing = start; nothing else
round(n) ── Hint ──▶ round(n)                                     hintUsed = true
round(n) ── Run, a slot empty ──▶ round(n)                        guidance; nothing counted
round(n) ── Run, all slots filled ──▶ round(n), playing           runs += 1; lastResult set; showing = last-run
            ├─ unsolved: cards stay placed
            └─ solved:   solved = true, firstRun = (runs == 1), cards lock, Next enabled
round(n), playing ── Run ──▶ round(n), playing                    replay; nothing counted
round(n), playing ── playback ends, Skip, card change, Reset routers or Next ──▶ playing = false
round(n) solved ── Next ──▶ round(n+1), or summary after the last round in play
any ── Restart confirmed ──▶ round(1) with a fresh session
```

The restart confirmation is a page dialog, not session state: the session changes only when
Confirm is pressed, so Cancel has nothing to undo.

Pause, Slow, About this round and the collapsed state of a panel are page state, not session state:
they affect only what is shown and how fast, never a count or an outcome.

Which ping repeats on the diagram is derived, not stored: `openingPing` when `showing` is `start`,
the last entry of `lastResult.pings` when it is `last-run`.

### Rules the state module enforces

- Run while `playing` is a replay: it counts nothing and changes no field. Otherwise Run is
  refused when the round is `solved`. Both are decided in the state module as well as on the
  page (FR-011b, FR-022).
- `runs` increases only on a Run with every slot filled, and only while the round is unsolved
  (FR-021).
- `hintUsed` never affects `solved` or `firstRun` (FR-024, FR-025).
- Card changes and Reset routers are refused once the round is `solved` (FR-022a, FR-019b).
- Reset routers changes `showing` and `playing` only: never `placement`, `runs`, `hintUsed`,
  `solved` or `lastResult` (FR-019b).
- Selecting a card changes `selectedCard` only; `showing` changes on place, return and swap
  (FR-019a).
- `playing` gates nothing except Run. It becomes false when playback finishes, on Skip, on a card
  change, on Reset routers and on Next. Hint leaves it true. Cancelling a restart leaves it
  true and the page restarts the playback.
- Next is refused unless the round is `solved` (FR-005).
