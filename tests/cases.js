// Every placement from spec.md "Required outcome cases", copied by hand.
// Case numbers are stable: 1 to 19 are the first four rounds, later rounds were appended.
// This file MUST NOT import or call the simulator: these are the expected results it is tested against.
//
// expect fields:
//   status        "solved" | "unsolved"
//   lastPing      the ping that decides the round (after the reload in rounds 3 and 4)
//                 request / reply: { delivered: true } or { droppedAt: "<router>" }; reply null when the request was dropped
//   rejected      configuration lines the router rejected, in order
//   firstPingOk   rounds 3 and 4: the ping before the reload completes (true in every case)
//   saved         rounds 3 and 4: routers whose running configuration matches startup when the script ends
//   lostOnReload  rounds 3 and 4: routers that lose a route in the reload
//   shutAgain     routers whose Gi0/1 the reload shuts again, because `no shutdown` was not saved
//   crashed       Python stopped the script (rule 9); absent means it ran to the end

const G01 = "interface GigabitEthernet0/1";
const NOSHUT = "no shutdown";
const TO_A = "ip route 10.10.0.0 255.255.255.0 192.0.2.1";
const TO_B = "ip route 10.20.0.0 255.255.255.0 192.0.2.2";

const ok = { delivered: true };
const roundTrip = { request: ok, reply: ok };
const dropAtR1 = { request: { droppedAt: "r1" }, reply: null };
const replyDropAtR2 = { request: ok, reply: { droppedAt: "r2" } };

export const cases = [
  // Round 1 (slot 1, slot 2)
  { id: 1, round: "link-up", placement: { "line-1": "int-g01", "line-2": "no-shut" },
    expect: { status: "solved", lastPing: roundTrip, rejected: [] } },
  { id: 2, round: "link-up", placement: { "line-1": "no-shut", "line-2": "int-g01" },
    expect: { status: "unsolved", lastPing: dropAtR1, rejected: [NOSHUT] } },
  { id: 3, round: "link-up", placement: { "line-1": "int-g00", "line-2": "no-shut" },
    expect: { status: "unsolved", lastPing: dropAtR1, rejected: [] } },
  { id: 4, round: "link-up", placement: { "line-1": "no-shut", "line-2": "int-g00" },
    expect: { status: "unsolved", lastPing: dropAtR1, rejected: [NOSHUT] } },
  { id: 5, round: "link-up", placement: { "line-1": "int-g01", "line-2": "int-g00" },
    expect: { status: "unsolved", lastPing: dropAtR1, rejected: [] } },
  { id: 6, round: "link-up", placement: { "line-1": "int-g00", "line-2": "int-g01" },
    expect: { status: "unsolved", lastPing: dropAtR1, rejected: [] } },

  // Round 2 (device, config line)
  { id: 7, round: "two-way", placement: { device: "r2", route: "route-to-a" },
    expect: { status: "solved", lastPing: roundTrip, rejected: [] } },
  { id: 8, round: "two-way", placement: { device: "r1", route: "route-to-b" },
    expect: { status: "unsolved", lastPing: replyDropAtR2, rejected: [] } },
  { id: 9, round: "two-way", placement: { device: "r1", route: "route-to-a" },
    expect: { status: "unsolved", lastPing: replyDropAtR2, rejected: [TO_A] } },
  { id: 10, round: "two-way", placement: { device: "r2", route: "route-to-b" },
    expect: { status: "unsolved", lastPing: replyDropAtR2, rejected: [TO_B] } },

  // Round 3 (statement)
  { id: 11, round: "save", placement: { "after-config": "save" },
    expect: { status: "solved", lastPing: roundTrip, rejected: [], firstPingOk: true, saved: ["r1", "r2"], lostOnReload: [] } },
  { id: 12, round: "save", placement: { "after-config": "show" },
    expect: { status: "unsolved", lastPing: dropAtR1, rejected: [], firstPingOk: true, saved: ["r2"], lostOnReload: ["r1"] } },
  { id: 13, round: "save", placement: { "after-config": "print" },
    expect: { status: "unsolved", lastPing: dropAtR1, rejected: [], firstPingOk: true, saved: ["r2"], lostOnReload: ["r1"] } },

  // Round 4 (inside the loop, after the loop)
  { id: 14, round: "loop-save", placement: { "in-loop": "save", "after-loop": "show" },
    expect: { status: "solved", lastPing: roundTrip, rejected: [], firstPingOk: true, saved: ["r1", "r2"], lostOnReload: [] } },
  { id: 15, round: "loop-save", placement: { "in-loop": "save", "after-loop": "print" },
    expect: { status: "solved", lastPing: roundTrip, rejected: [], firstPingOk: true, saved: ["r1", "r2"], lostOnReload: [] } },
  { id: 16, round: "loop-save", placement: { "in-loop": "show", "after-loop": "save" },
    expect: { status: "unsolved", lastPing: dropAtR1, rejected: [], firstPingOk: true, saved: ["r2"], lostOnReload: ["r1"] } },
  { id: 17, round: "loop-save", placement: { "in-loop": "print", "after-loop": "save" },
    expect: { status: "unsolved", lastPing: dropAtR1, rejected: [], firstPingOk: true, saved: ["r2"], lostOnReload: ["r1"] } },
  { id: 18, round: "loop-save", placement: { "in-loop": "show", "after-loop": "print" },
    expect: { status: "unsolved", lastPing: dropAtR1, rejected: [], firstPingOk: true, saved: [], lostOnReload: ["r1", "r2"] } },
  { id: 19, round: "loop-save", placement: { "in-loop": "print", "after-loop": "show" },
    expect: { status: "unsolved", lastPing: dropAtR1, rejected: [], firstPingOk: true, saved: [], lostOnReload: ["r1", "r2"] } },
];

// The other end (device, slot 1, slot 2): r2's side of the link is shut, so only r2 can bring it up.
const other = (id, device, a, b, expect) => ({ id, round: "other-end", placement: { device, "line-1": a, "line-2": b }, expect });
cases.push(
  other(20, "r2", "int-g01", "no-shut", { status: "solved", lastPing: roundTrip, rejected: [] }),
  other(21, "r2", "no-shut", "int-g01", { status: "unsolved", lastPing: dropAtR1, rejected: [NOSHUT] }),
  other(22, "r2", "int-g00", "no-shut", { status: "unsolved", lastPing: dropAtR1, rejected: [] }),
  other(23, "r2", "no-shut", "int-g00", { status: "unsolved", lastPing: dropAtR1, rejected: [NOSHUT] }),
  other(24, "r2", "int-g01", "int-g00", { status: "unsolved", lastPing: dropAtR1, rejected: [] }),
  other(25, "r2", "int-g00", "int-g01", { status: "unsolved", lastPing: dropAtR1, rejected: [] }),
  // On r1 the same lines are accepted and change nothing: r1's side was never shut.
  other(26, "r1", "int-g01", "no-shut", { status: "unsolved", lastPing: dropAtR1, rejected: [], noChange: [NOSHUT] }),
  other(27, "r1", "no-shut", "int-g01", { status: "unsolved", lastPing: dropAtR1, rejected: [NOSHUT] }),
  other(28, "r1", "int-g00", "no-shut", { status: "unsolved", lastPing: dropAtR1, rejected: [], noChange: [NOSHUT] }),
  other(29, "r1", "no-shut", "int-g00", { status: "unsolved", lastPing: dropAtR1, rejected: [NOSHUT] }),
  other(30, "r1", "int-g01", "int-g00", { status: "unsolved", lastPing: dropAtR1, rejected: [] }),
  other(31, "r1", "int-g00", "int-g01", { status: "unsolved", lastPing: dropAtR1, rejected: [] }),
);

// Calls in order (line 1, line 2, line 3): the three calls of a script, shuffled. r1 has no route.
// Any call on conn before the connect is a NameError: the script stops and nothing reaches a router.
const order = (id, a, b, c, expect) => ({ id, round: "call-order", placement: { "line-1": a, "line-2": b, "line-3": c }, expect });
const crashedAtOnce = { status: "unsolved", crashed: true, lastPing: dropAtR1, rejected: [], firstPingOk: false, saved: ["r1", "r2"], lostOnReload: [] };
cases.push(
  order(32, "connect", "config", "save", { status: "solved", crashed: false, lastPing: roundTrip, rejected: [], firstPingOk: true, saved: ["r1", "r2"], lostOnReload: [] }),
  // Saved first, configured second: the route works until the reload, then it is gone.
  order(33, "connect", "save", "config", { status: "unsolved", crashed: false, lastPing: dropAtR1, rejected: [], firstPingOk: true, saved: ["r2"], lostOnReload: ["r1"] }),
  order(34, "config", "connect", "save", crashedAtOnce),
  order(35, "config", "save", "connect", crashedAtOnce),
  order(36, "save", "connect", "config", crashedAtOnce),
  order(37, "save", "config", "connect", crashedAtOnce),
);

// The whole script (four lines inside the loop, one after it): six call cards, 720 placements.
// Too many to list, so tests/whole-script.test.js checks all 720 against a hand-written rule.
// These are one named case for each kind of outcome, worked by hand in full.
const whole = (id, a, b, c, d, after, expect) => ({ id, round: "whole-script",
  placement: { "loop-1": a, "loop-2": b, "loop-3": c, "loop-4": d, "after-loop": after }, expect: { rejected: [], ...expect } });
const solvedWhole = { status: "solved", crashed: false, lastPing: roundTrip, firstPingOk: true, saved: ["r1", "r2"], lostOnReload: [] };
const crashedWhole = { status: "unsolved", crashed: true, lastPing: dropAtR1, firstPingOk: false, saved: ["r1", "r2"], lostOnReload: [] };
cases.push(
  whole(38, "connect", "linkup", "routes", "save", "print", solvedWhole),
  whole(39, "connect", "routes", "linkup", "save", "show", solvedWhole),
  // The save after the loop reaches r2 only (rule 7): r1 loses its link setting and its route.
  whole(40, "connect", "linkup", "routes", "show", "save", { status: "unsolved", crashed: false, lastPing: dropAtR1, firstPingOk: true, saved: ["r2"], lostOnReload: ["r1"] }),
  // Saved before anything changed: nothing is kept on either router.
  whole(41, "connect", "save", "linkup", "routes", "print", { status: "unsolved", crashed: false, lastPing: dropAtR1, firstPingOk: true, saved: [], lostOnReload: ["r1", "r2"] }),
  // Saved between the two changes: the link survives the reload, the routes do not.
  whole(42, "connect", "linkup", "save", "routes", "show", { status: "unsolved", crashed: false, lastPing: dropAtR1, firstPingOk: true, saved: [], lostOnReload: ["r1", "r2"], shutAgain: [] }),
  // Routes saved, link not: after the reload r1's side is shut again, so its saved route is not installed.
  whole(43, "connect", "routes", "save", "linkup", "print", { status: "unsolved", crashed: false, lastPing: dropAtR1, firstPingOk: true, saved: ["r2"], lostOnReload: [], shutAgain: ["r1"] }),
  // A call on conn before the connect: NameError on the first pass of the loop (rule 9).
  whole(44, "linkup", "connect", "routes", "save", "print", crashedWhole),
  // No connect inside the loop at all: print runs, then the next line crashes.
  whole(45, "print", "linkup", "routes", "save", "connect", crashedWhole),
  // print before the connect is harmless; but then there is no room for the save inside the loop.
  whole(46, "print", "connect", "linkup", "routes", "save", { status: "unsolved", crashed: false, lastPing: dropAtR1, firstPingOk: true, saved: ["r2"], lostOnReload: ["r1"] }),
  // The link is never brought up inside the loop: routes are saved on both routers but not installed.
  whole(47, "connect", "routes", "save", "show", "linkup", { status: "unsolved", crashed: false, lastPing: dropAtR1, firstPingOk: false, saved: ["r1", "r2"], lostOnReload: [] }),
);

// Hand-worked opening pings, from contracts/simulator.md "Test contract".
export const openingPings = {
  "link-up": dropAtR1,
  "other-end": dropAtR1,
  "two-way": replyDropAtR2,
  "save": dropAtR1,
  "loop-save": dropAtR1,
  "call-order": dropAtR1,
  "whole-script": dropAtR1,
};
