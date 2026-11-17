# Contract: simulator (`engine/simulator.js`)

The simulator is the only thing that decides an outcome. It is a pure function: the same inputs
give the same result, and it touches no page, timer, network, random number or session state.

```text
run(topology, round, placement) → Result
```

`topology` and `round` come from the [content file](content.md). `placement` is a map from slot id
to card id.

Two more pure functions serve the screen before any card is placed:

```text
startView(topology, round) → { r1: RouterView, r2: RouterView }
openingPing(topology, round) → Ping        // phase: "opening"
```

`startView` gives the state panels and diagram their *Starting state*. `openingPing` forwards a
request and reply from that state, using the same routing and forwarding code as `run`.

## Algorithm

1. **Check the placement.** If any slot is empty, a card's type differs from its slot's, or a card
   is used twice, return `status: "invalid-input"` and stop. Nothing is executed.
2. **Build the starting state** from `round.start`: for each router, a running configuration and
   an identical startup configuration.
3. **Fill the script** by substituting each slot with its card's value, then execute the
   statements in order with one variable, `conn`:
   - `connect` sets `conn` to the named router (or to the loop variable).
   - `config` applies each line in order, starting at global configuration level with no interface
     selected. A rejected line is recorded and the next line still runs (rule 8).
     - `interface X` selects X.
     - `no shutdown` / `shutdown` with no interface selected is rejected (rule 1); otherwise it
       enables or disables the selected interface.
     - `ip route N M H` is rejected if H is one of this router's own addresses (rule 4); otherwise
       it is added to the running configuration unless already present.
   - `save` copies running to startup on `conn`'s router (rule 6).
   - `show` and `print` change nothing.
   - `for` runs its body once per device. It does not reset `conn` afterwards, so a statement
     after the loop acts on the last router (rule 7).
4. **Ping.** Derive each router's routing table, then forward the request from hostA to hostB and,
   if it arrives, the reply from hostB to hostA.
   - The r1–r2 link is up only if `Gi0/1` is enabled on both routers (rule 2).
   - A connected subnet is in the table only while its link is up. A static route is in the table
     only if its next hop is inside a connected subnet that is in the table (rule 3).
   - Each router forwards on the one route containing the destination, or drops the packet
     (rule 5).
5. **If `round.reloadCheck`:** replace each router's running configuration with its startup
   configuration, then ping again.
6. **Status** is `solved` when the last ping delivered both request and reply; otherwise
   `unsolved`.

## Result

```text
{
  status: "solved" | "unsolved" | "invalid-input",
  emptySlots: [slotId],            // invalid-input only
  steps: [Step],                   // one per executed script line or config line, in order
  pings: [Ping],                   // one, or two when the round has a reload check
  reload: { lost: { r1: [configLine], r2: [configLine] } } | null,
  finalState: { r1: RouterView, r2: RouterView }
}
```

```text
Step {
  path: [index, …],        // position of the statement in the script, for highlighting
  iteration: routerId | null,      // which pass of a for loop
  router: routerId,                // the router conn refers to
  line: string | null,             // the config line, for steps inside send_config_set
  outcome: "applied" | "no-change" | "rejected" | "read-only",
  reason: ReasonCode,
  changed: [ { router, row } ],    // row: "interface" | "runningRoutes" | "routingTable" | "saved"
  state: { r1: RouterView, r2: RouterView }   // state after this step
}

Ping {
  phase: "opening" | "after-script" | "after-reload",
  request: Leg,
  reply: Leg | null                // null when the request was dropped
}

Leg {
  delivered: boolean,
  hops: [Hop],                     // nodes reached, in order
  droppedAt: routerId | null,
  reason: ReasonCode | null,
  destination: "10.20.0.0/24" | "10.10.0.0/24"
}

Hop {
  node: nodeId,
  route: { prefix, via } | null   // for a router: the routing-table entry it forwarded on,
                                  // or null when no route matched; always null for a host
}

RouterView {
  linkInterface: "up" | "administratively down" | "down",
  runningRoutes: [configLine],
  routingTable: [ { prefix, via: "connected" | nextHop } ],
  saved: boolean                   // running equals startup
}
```

`changed` lists rows on either router: enabling `Gi0/1` on r1 changes r2's interface row and
routing table too.

## Reason codes

Every code has an entry in the content file's `messages`, which supplies the wording and the rule
numbers. The simulator supplies only the code and the values.

| Code | Outcome | When |
| --- | --- | --- |
| `connected` | applied | `connect` |
| `interface-selected` | applied | `interface X` |
| `interface-enabled` | applied | `no shutdown` on a shut interface |
| `interface-disabled` | applied | `shutdown` on an enabled interface |
| `interface-unchanged` | no-change | `no shutdown` / `shutdown` that matches the current state |
| `no-interface-context` | rejected | `no shutdown` / `shutdown` with no interface selected |
| `route-added` | applied | `ip route` accepted and new |
| `route-already-present` | no-change | `ip route` accepted and already in the running configuration |
| `next-hop-is-own-address` | rejected | `ip route` whose next hop is this router's address |
| `config-saved` | applied | `save` when running differed from startup |
| `config-already-saved` | no-change | `save` when they were equal |
| `show-reads-only` | read-only | `show` |
| `print-does-nothing` | read-only | `print` |
| `drop-link-down` | (leg) | A route to the destination is configured but not installed because the link is down |
| `drop-no-route` | (leg) | No route to the destination is configured on this router |
| `drop-route-lost-on-reload` | (leg) | As `drop-no-route`, in the after-reload ping, where the route was in `reload.lost` |

## Content errors

The simulator assumes validated content. Broken content is caught by the validator in
`engine/content.js` before any round is shown, and is reported as a content error naming the
round, never as a `Result`.

## Test contract

`tests/cases.js` holds the 19 placements from the spec as hand-written data, copied from the
spec's tables and not produced by calling `run`:

```text
{ id: 16, round: "round-4", placement: { "in-loop": "show", "after-loop": "save" },
  expect: { status: "unsolved", lastPing: { request: { droppedAt: "r1" } }, saved: ["r2"] } }
```

`tests/simulator.test.js` runs each case and compares. It also asserts that it ran exactly 19
cases and that exactly cases 1, 7, 11, 14 and 15 are solved, so an empty or truncated case list
fails.

It checks `openingPing` for each round against these hand-worked results: round 1, request
dropped at r1; round 2, request delivered and reply dropped at r2; rounds 3 and 4, request dropped
at r1.
