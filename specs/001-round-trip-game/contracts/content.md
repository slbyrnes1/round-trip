# Contract: authored content (`data/rounds.json`)

One JSON document holds everything a reviewer needs to check the teaching: the topology, the
sources, the rule wording, the feedback wording, and the four rounds. The simulator holds the
behaviour; this file holds no answers.

## Why the script is structured data, not text

A round's script is stored as a short list of operations with slots in it, not as Python text.
The simulator executes that list directly and the screen renders Python text from the same list,
so what the player reads and what the simulator runs cannot drift apart. No Python parser is
needed.

## Top level

| Field | Type | Meaning |
| --- | --- | --- |
| `schemaVersion` | integer, must be `1` | Rejects a file written for a different contract |
| `topology` | object | The fixed four-node network; see below |
| `sources` | array of Source | References for the rules and briefings |
| `rules` | array of Rule | The eight rules, with their wording and sources |
| `messages` | object, reason code → Message | Feedback wording for each thing the simulator can report |
| `routerMessages` | object, key → RouterMessage | Real IOS message text, each with a `captured` flag |
| `rounds` | array of Round, in play order | The four rounds |

The starter kit's `levels → rounds` nesting is flattened to `rounds`. This game has one mechanic
and four rounds, so a level layer would hold nothing.

## Topology

```json
"topology": {
  "hosts": {
    "hostA": { "address": "10.10.0.10", "prefixLength": 24, "gateway": "10.10.0.1", "router": "r1" },
    "hostB": { "address": "10.20.0.10", "prefixLength": 24, "gateway": "10.20.0.1", "router": "r2" }
  },
  "routers": {
    "r1": { "interfaces": {
      "GigabitEthernet0/0": { "address": "10.10.0.1", "prefixLength": 24, "faces": "hostA" },
      "GigabitEthernet0/1": { "address": "192.0.2.1", "prefixLength": 30, "faces": "r2" } } },
    "r2": { "interfaces": {
      "GigabitEthernet0/0": { "address": "10.20.0.1", "prefixLength": 24, "faces": "hostB" },
      "GigabitEthernet0/1": { "address": "192.0.2.2", "prefixLength": 30, "faces": "r1" } } }
  }
}
```

- `address`, `gateway`: IPv4 dotted-quad strings.
- `prefixLength`: integer 0–32.
- `faces`: the id of the node on the other end. An interface that faces a host is always up.

## Source, Rule, Message, RouterMessage

```json
{ "id": "netmiko-base", "title": "Netmiko source, base_connection.py", "url": "https://…",
  "section": "send_config_set", "claim": "error_pattern defaults to an empty string…",
  "kind": "library" }
```

`kind` is `vendor`, `library` or `community`. A rule whose only sources are `community`, or that
has none, is shown as such in the README.

```json
{ "id": 8, "name": "Silent rejection", "text": "When the router rejects a configuration line…",
  "sourceIds": ["netmiko-base"] }
```

`sourceIds` may be empty (rules 1 and 2 today). Empty means "unsourced", not an error.

```json
"messages": {
  "no-interface-context": {
    "text": "The router rejected `{line}` because no interface was selected yet. The script carried on.",
    "ruleIds": [1, 8], "quote": "invalid-input" }
}
```

- The key is a reason code from the [simulator contract](simulator.md). Every reason code the
  simulator can emit must have an entry.
- `{name}` placeholders are filled from the step's or trace's evidence.
- `quote` (optional) names a RouterMessage to show as a quotation.

```json
"routerMessages": {
  "invalid-input": { "text": "% Invalid input detected at '^' marker.", "captured": false }
}
```

A quotation is shown only when `captured` is `true`. Until a message is captured from a real
router, feedback uses the paraphrase in `messages` alone (FR-018).

## Round

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | string, unique | For example `round-2` |
| `title` | string | Shown in the briefing and the summary |
| `learningOutcome` | `LO1`, `LO2` or `LO3` | Which outcome the round exercises |
| `briefing` | object | `idea`, `terms` (array), `workedExample`, `limits`, `sourceIds` (array); all text non-empty |
| `hint` | string | The single hint; must not contain any card's text |
| `reloadCheck` | boolean | `true` in rounds 3 and 4: ping, reload both routers, ping again |
| `inPlay` | boolean, optional, default `true` | `false` takes the round out of the play sequence and the summary. It is still validated, and its cases are still tested |
| `start` | object, router id → StartConfig | Each router's configuration at the start of every Run |
| `script` | array of Statement | The scaffold, with slots in place |
| `tray` | array of Card | The cards on offer |

### StartConfig

```json
"start": {
  "r1": { "shutdown": ["GigabitEthernet0/1"],
          "routes": ["ip route 10.20.0.0 255.255.255.0 192.0.2.2"] },
  "r2": { "shutdown": [],
          "routes": ["ip route 10.10.0.0 255.255.255.0 192.0.2.1"] }
}
```

- `shutdown`: interface names that are shut down on this router.
- `routes`: static routes, written as the configuration line that would create them.
- Every round starts saved: the startup configuration equals this configuration. A round that
  needs to start with unsaved changes would need a second field; none does today.

### Statement

Each entry in `script` (and in a `for` body) is one of:

| `op` | Other fields | Rendered as |
| --- | --- | --- |
| `connect` | `device`: router id, or a device Slot. Omitted inside a `for` to mean the loop variable | `conn = ConnectHandler(**r1)` |
| `config` | `lines`: array of config-line strings and/or config-line Slots. Or `linesByDevice`: router id → array of strings, inside a `for` only | `conn.send_config_set([...])` |
| `save` | none | `conn.save_config()` |
| `show` | `command`: string starting with `show ` | `conn.send_command("show …")` |
| `print` | `text`: string | `print("…")` |
| `for` | `devices`: array of router ids; `body`: array of Statement | `for device in [r1, r2]:` |

A statement Slot may stand anywhere a Statement can.

### Slot

```json
{ "slot": "after-loop", "type": "statement", "label": "Statement after the loop" }
```

- `slot`: id, unique within the round.
- `type`: `device`, `configLine` or `statement`.
- `label`: the slot's accessible name, and the name used in "this slot is empty" guidance.
- Slots are numbered for the player in the order they appear in the script.

### Card

```json
{ "id": "save", "type": "statement", "value": { "op": "save" } }
{ "id": "r2", "type": "device", "value": "r2" }
{ "id": "route-to-a", "type": "configLine", "value": "ip route 10.10.0.0 255.255.255.0 192.0.2.1" }
```

- `id`: unique within the round.
- `value`: a router id for `device`; a config-line string for `configLine`; a `save`, `show` or
  `print` Statement for `statement`.
- The card's visible text is rendered from `value`, the same way the script is.

### Config-line grammar

The only configuration lines the simulator accepts, wherever they appear (start routes, scaffold
lines, cards):

```text
interface <name>          name is an interface of the topology
no shutdown
shutdown
ip route <network> <mask> <next-hop>     three IPv4 dotted quads; mask is contiguous
```

## Placement (the player's answer)

A placement is a map from slot id to card id:

```json
{ "in-loop": "show", "after-loop": "save" }
```

It is complete when every slot of the round has a card, every card's type equals its slot's type,
and no card appears twice.

## Worked example: round 4

```json
{
  "id": "round-4",
  "title": "Save on every router",
  "learningOutcome": "LO3",
  "briefing": { "idea": "…", "terms": ["…"], "workedExample": "…", "limits": "…",
                "sourceIds": ["netmiko-ios"] },
  "hint": "…",
  "reloadCheck": true,
  "start": { "r1": { "shutdown": [], "routes": [] },
             "r2": { "shutdown": [], "routes": [] } },
  "script": [
    { "op": "for", "devices": ["r1", "r2"], "body": [
      { "op": "connect" },
      { "op": "config", "linesByDevice": {
          "r1": ["ip route 10.20.0.0 255.255.255.0 192.0.2.2"],
          "r2": ["ip route 10.10.0.0 255.255.255.0 192.0.2.1"] } },
      { "slot": "in-loop", "type": "statement", "label": "Statement inside the loop" }
    ] },
    { "slot": "after-loop", "type": "statement", "label": "Statement after the loop" }
  ],
  "tray": [
    { "id": "save",  "type": "statement", "value": { "op": "save" } },
    { "id": "show",  "type": "statement", "value": { "op": "show", "command": "show running-config" } },
    { "id": "print", "type": "statement", "value": { "op": "print", "text": "done" } }
  ]
}
```

## Validation

The whole file is validated before the first briefing is shown. Any failure replaces the game with
a content error that names each affected round (or the top-level field). Nothing is graded.

**Shape**

1. `schemaVersion` is `1`; every field above is present with the stated type.
2. Round ids are unique. Within a round, slot ids and card ids are unique.
3. Every `learningOutcome` is `LO1`–`LO3`; every briefing text and the hint are non-empty.
4. Every `sourceIds` entry names an existing source. Rule ids are exactly 1–8.

**References**

5. Every router id (in `start`, `connect`, `for`, `linesByDevice`, device cards) exists in the
   topology, and every `start` names both routers.
6. Every interface name in `shutdown` exists on that router.
7. Every config-line string matches the grammar above.
8. A `connect` without `device`, and a `config` with `linesByDevice`, appear only inside a `for`.
   Every `config`, `save`, `show` and statement slot comes after a `connect`.
9. Every `messages` key is a known reason code and every known reason code has a message. Every
   `quote` names an existing router message.

**Playability**

10. For each slot type, the tray has at least as many cards of that type as the round has slots.
11. At least one complete placement solves the round. The validator finds this by running every
    complete placement through the simulator.
12. No placement leaves a router with two routes that overlap (rule 5 assumes none do).
13. The hint does not contain the rendered text of any card in the round's tray.

Check 11 enumerates placements, which is at most 6 per round here. It grows factorially with
slots and cards, so a round with many more of either would need a cap or a smarter search.
