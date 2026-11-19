import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validate, placements, realScript } from "../engine/content.js";

const load = () => JSON.parse(readFileSync(new URL("../data/rounds.json", import.meta.url)));
const round = (content, id) => content.rounds.find((r) => r.id === id);

test("the shipped content validates", () => {
  assert.deepEqual(validate(load()), []);
});

test("the seven rounds have 6, 12, 4, 3, 6, 6 and 720 placements, in play order", () => {
  assert.deepEqual(load().rounds.map((r) => [r.id, placements(r).length]),
    [["link-up", 6], ["other-end", 12], ["two-way", 4], ["save", 3], ["loop-save", 6], ["call-order", 6], ["whole-script", 720]]);
});

// Each broken variant must be rejected with the affected round named.
const rejected = (content, roundId, pattern) => {
  const errors = validate(content);
  assert.ok(errors.some((e) => e.where === roundId && pattern.test(e.message)), JSON.stringify(errors));
};

test("a tray that cannot fill the slots is rejected", () => {
  const content = load();
  round(content, "link-up").tray.splice(1, 2); // one config-line card left for two slots
  rejected(content, "link-up", /cannot fill the slots/);
});

test("a round with no solving placement is rejected", () => {
  const content = load();
  const r = round(content, "save");
  r.tray = r.tray.filter((c) => c.id !== "save");
  rejected(content, "save", /no placement solves/);
});

test("a malformed configuration line is rejected", () => {
  const content = load();
  round(content, "two-way").tray[2].value = "ip route 10.20.0.0 255.0.255.0 192.0.2.2"; // mask not contiguous
  rejected(content, "two-way", /not a valid configuration line/);
});

test("a duplicate slot id is rejected", () => {
  const content = load();
  round(content, "link-up").script[1].lines[1].slot = "line-1";
  rejected(content, "link-up", /slot ids must be unique/);
});

test("a hint that names a card is rejected", () => {
  const content = load();
  round(content, "save").hint = "Try conn.save_config() here.";
  rejected(content, "save", /hint contains the text of card/);
});

test("a statement slot before any connect is rejected unless the tray holds the connect call", () => {
  const content = load();
  const r = round(content, "call-order");
  r.tray = r.tray.filter((c) => c.id !== "connect");
  rejected(content, "call-order", /comes before any connect/);
});

test("a card that needs the loop variable is rejected where no loop comes first", () => {
  const content = load();
  round(content, "call-order").tray[0].value = { op: "connect" }; // conn = ConnectHandler(**device), with no for
  rejected(content, "call-order", /needs the loop variable/);
});

test("the take-away script is the player's script line for line, plus a login", () => {
  const content = load();
  const whole = round(content, "whole-script");
  const placement = { "loop-1": "connect", "loop-2": "linkup", "loop-3": "routes", "loop-4": "save", "after-loop": "print" };
  const lines = realScript(whole, content.topology, content.callNotes, placement);
  // Each call carries its note as a trailing comment; compare the code without the comments.
  const code = lines.filter((l) => !l.text.trimStart().startsWith("#")).map((l) => l.text.replace(/\s+# .*$/, ""));
  assert.deepEqual(code, [
    "from getpass import getpass",
    "from netmiko import ConnectHandler",
    "",
    "password = getpass()",
    "",
    'r1 = {"device_type": "cisco_ios", "host": "r1", "username": "admin", "password": password}',
    'r2 = {"device_type": "cisco_ios", "host": "r2", "username": "admin", "password": password}',
    "routes = {",
    '    "r1": ["ip route 10.20.0.0 255.255.255.0 192.0.2.2"],',
    '    "r2": ["ip route 10.10.0.0 255.255.255.0 192.0.2.1"],',
    "}",
    "",
    "for device in [r1, r2]:",
    "    conn = ConnectHandler(**device)",
    '    conn.send_config_set(["interface GigabitEthernet0/1", "no shutdown"])',
    '    conn.send_config_set(routes[device["host"]])',
    "    conn.save_config()",
    'print("done")',
  ]);
  // Only the login is new: everything else is a line of the game's own script.
  assert.deepEqual(lines.filter((l) => l.added && !l.text.startsWith("#")).map((l) => l.text.split(" ")[0]), ["from", "password", "r1", "r2"]);
  // Every call keeps its Netmiko note, on its own line.
  const noteOf = (call) => lines.find((l) => l.text.includes(call)).text.split("  # ")[1];
  assert.equal(noteOf("ConnectHandler(**device)"), "SSH login → conn");
  assert.equal(noteOf('send_config_set(routes'), "configure terminal → lines → end; never stops on a reject");
  assert.equal(noteOf("save_config()"), "write mem: running → startup");
  // No blank is left in it.
  assert.ok(!lines.some((l) => /\[object|undefined|Slot/.test(l.text)));
});

test("a missing call note is rejected", () => {
  const content = load();
  delete content.callNotes.config;
  assert.ok(validate(content).some((e) => e.where === "callNotes"));
});

test("a message with no short form is rejected", () => {
  const content = load();
  delete content.messages["route-added"].short;
  assert.ok(validate(content).some((e) => e.where === "messages" && /short form/.test(e.message)));
});

test("a missing message for a reason code is rejected", () => {
  const content = load();
  delete content.messages["drop-no-route"];
  assert.ok(validate(content).some((e) => e.where === "messages"));
});
