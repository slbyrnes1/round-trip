// Content validation and the text of script statements and cards.
// Pure. Contract: specs/001-round-trip-game/contracts/content.md "Validation" (checks 1 to 13).

import { run, parseLine, slotsOf, REASON_CODES } from "./simulator.js";

const isSlot = (x) => x !== null && typeof x === "object" && "slot" in x;
const SLOT_TYPES = ["device", "configLine", "statement"];

// ---- text of statements and cards (shared by the validator and the page) -----------------------

/** A statement as the Python line it stands for. */
export function statementText(st) {
  if (st.op === "connect") return `conn = ConnectHandler(**${st.device ?? "device"})`;
  if (st.op === "config") {
    return st.linesByDevice
      ? 'conn.send_config_set(routes[device["host"]])'
      : `conn.send_config_set([${st.lines.map((l) => `"${l}"`).join(", ")}])`;
  }
  if (st.op === "save") return "conn.save_config()";
  if (st.op === "show") return `conn.send_command("${st.command}")`;
  if (st.op === "print") return `print("${st.text}")`;
  return st.op;
}

/** A card's visible text, rendered from its value the same way the script is. */
export function cardText(card) {
  return card.type === "statement" ? statementText(card.value) : card.value;
}

/**
 * The script as lines of Python text, built from the same statement list the simulator executes.
 * Each call carries a short note, from the content's `callNotes`, saying what Netmiko does there:
 * a trailing comment on the call's own line. A statement slot gets its note once a card is placed.
 */
export function scriptLines(round, topology, notes, cardIn) {
  const lines = [{ parts: ["from netmiko import ConnectHandler"] }, { parts: [""] }];
  let pending = null; // the note for the next line pushed
  const note = (op) => { pending = `# ${notes[op]}`; };
  const push = (line) => { lines.push(pending ? { ...line, note: pending } : line); pending = null; };
  for (const r of Object.keys(topology.routers)) {
    lines.push({ parts: [`${r} = {"device_type": "cisco_ios", "host": "${r}"}`] });
  }
  const perDevice = (statements) => statements.flatMap((st) =>
    st.op === "for" ? perDevice(st.body) : st.op === "config" && st.linesByDevice ? [st.linesByDevice] : []);
  // Per-router lines can also arrive on a card (a config call the player places).
  const onCards = round.tray.filter((c) => c.type === "statement" && c.value.linesByDevice).map((c) => c.value.linesByDevice);
  for (const table of [...perDevice(round.script), ...onCards]) {
    lines.push({ parts: ["routes = {"] });
    for (const [r, list] of Object.entries(table)) {
      lines.push({ indent: 1, parts: [`"${r}": [${list.map((l) => `"${l}"`).join(", ")}],`] });
    }
    lines.push({ parts: ["}"] });
  }
  lines.push({ parts: [""] });

  const walk = (statements, prefix, indent) => statements.forEach((st, i) => {
    const path = [...prefix, i].join(".");
    if (isSlot(st)) {
      const placed = cardIn(st.slot);
      if (placed) note(placed.value.op);
      push({ path, indent, parts: [st] });
    } else if (st.op === "connect") {
      note("connect");
      push({ path, indent, parts: ["conn = ConnectHandler(**", st.device === undefined ? "device" : st.device, ")"] });
    } else if (st.op === "config" && st.linesByDevice) {
      note("config");
      push({ path, indent, parts: ['conn.send_config_set(routes[device["host"]])'] });
    } else if (st.op === "config") {
      note("config");
      push({ indent, parts: ["conn.send_config_set(["] });
      st.lines.forEach((line, j) => push({ path: `${path}.${j}`, indent: indent + 1, parts: ['"', line, '",'] }));
      push({ indent, parts: ["])"] });
    } else if (st.op === "for") {
      note("for");
      push({ indent, parts: [`for device in [${st.devices.join(", ")}]:`] });
      walk(st.body, [...prefix, i], indent + 1);
    } else {
      note(st.op);
      push({ path, indent, parts: [statementText(st)] });
    }
  });
  walk(round.script, [], 0);
  return lines;
}

/**
 * The script the player assembled, as plain text they can take away and run.
 * It is the game's script line for line, with the blanks filled by the placed cards, plus the
 * login a real network needs, which the game leaves out. Lines the game did not have are flagged
 * `added`. Returns [{ text, added }].
 */
export function realScript(round, topology, notes, placement) {
  const cards = Object.fromEntries(round.tray.map((c) => [c.id, c]));
  const lines = [
    { text: "from getpass import getpass", added: true },
  ];
  let devicesDone = false;
  const game = scriptLines(round, topology, notes, (slot) => cards[placement[slot]]);
  const hasRoutesTable = game.some((line) => line.parts[0] === "routes = {");
  for (const line of game) {
    const text = line.parts.map((p) => (isSlot(p) ? cardText(cards[placement[p.slot]]) : p)).join("") + (line.note ? `  ${line.note}` : "");
    const device = /^(\w+) = \{"device_type": "cisco_ios", "host": "(\w+)"\}$/.exec(text);
    if (device) {
      if (!devicesDone) {
        lines.push({ text: "# Asks for the password when the script starts, so it is never written in the file.", added: true });
        lines.push({ text: "password = getpass()", added: true });
        lines.push({ text: "", added: false });
        lines.push({ text: '# "host" is the address or name of each router. Change these to yours.', added: true });
        if (hasRoutesTable) lines.push({ text: '# If you do, change the keys of `routes` below to match: the script looks each router up by its "host".', added: true });
        devicesDone = true;
      }
      lines.push({ text: `${device[1]} = {"device_type": "cisco_ios", "host": "${device[2]}", "username": "admin", "password": password}`, added: true });
    } else {
      lines.push({ text: "    ".repeat(line.indent ?? 0) + text, added: false });
    }
  }
  return lines;
}

// ---- placements ------------------------------------------------------------------------------

/**
 * Every complete placement of a round.
 * ponytail: plain enumeration, at most 6 per round today. It grows factorially with slots and
 * cards; a much larger round needs a cap or a smarter search.
 */
export function placements(round) {
  const slots = slotsOf(round);
  const out = [];
  const fill = (i, placement, used) => {
    if (i === slots.length) return void out.push({ ...placement });
    for (const card of round.tray) {
      if (card.type !== slots[i].type || used.has(card.id)) continue;
      used.add(card.id);
      fill(i + 1, { ...placement, [slots[i].slot]: card.id }, used);
      used.delete(card.id);
    }
  };
  fill(0, {}, new Set());
  return out;
}

// ---- validation ------------------------------------------------------------------------------

const text = (v) => typeof v === "string" && v.trim() !== "";
const overlap = (a, b) => {
  const [na, la] = a.split("/"), [nb, lb] = b.split("/");
  const len = Math.min(Number(la), Number(lb));
  const net = (dotted) => Math.floor(dotted.split(".").reduce((n, o) => n * 256 + Number(o), 0) / 2 ** (32 - len));
  return net(na) === net(nb);
};

/** Returns a list of { where, message }. Empty means the content is valid. */
export function validate(content) {
  const errors = [];
  const err = (where, message) => errors.push({ where, message });

  // 1. Shape of the top level.
  if (content?.schemaVersion !== 1) return [{ where: "schemaVersion", message: "must be 1" }];
  const topLevel = { topology: "object", sources: "array", rules: "array", callNotes: "object", messages: "object", routerMessages: "object", rounds: "array" };
  for (const [field, kind] of Object.entries(topLevel)) {
    const v = content[field];
    const ok = kind === "array" ? Array.isArray(v) : v !== null && typeof v === "object" && !Array.isArray(v);
    if (!ok) err(field, `must be an ${kind}`);
  }
  if (errors.length) return errors;

  const { topology } = content;
  const routers = Object.keys(topology.routers ?? {});
  const sourceIds = new Set(content.sources.map((s) => s.id));

  // 1. Every call the script language has carries a note saying what Netmiko does.
  for (const op of ["connect", "config", "save", "show", "print", "for"]) {
    if (!text(content.callNotes[op])) err("callNotes", `no note for "${op}"`);
  }

  // 4. Rule ids are exactly 1 to 8; every sourceIds entry names a source.
  if (content.rules.map((r) => r.id).join() !== "1,2,3,4,5,6,7,8,9") err("rules", "ids must be exactly 1 to 9, in order");
  for (const rule of content.rules) {
    if (!text(rule.short) || !text(rule.text)) err("rules", `rule ${rule.id} needs a short form and a full text`);
    for (const id of rule.sourceIds ?? []) if (!sourceIds.has(id)) err("rules", `rule ${rule.id} cites unknown source "${id}"`);
  }

  // 9. Messages match the simulator's reason codes; quotes name router messages.
  for (const code of REASON_CODES) {
    if (!text(content.messages[code]?.text)) err("messages", `no message for reason code "${code}"`);
    else if (!text(content.messages[code].short)) err("messages", `no short form for reason code "${code}"`);
  }
  for (const [code, message] of Object.entries(content.messages)) {
    if (!REASON_CODES.includes(code)) err("messages", `"${code}" is not a reason code`);
    if (message.quote !== undefined && !(message.quote in content.routerMessages)) {
      err("messages", `"${code}" quotes unknown router message "${message.quote}"`);
    }
  }

  // 2. Round ids are unique.
  const ids = content.rounds.map((r) => r.id);
  if (new Set(ids).size !== ids.length) err("rounds", "round ids must be unique");

  content.rounds.forEach((round, index) => {
    const where = text(round.id) ? round.id : `rounds[${index}]`;
    const before = errors.length;
    const bad = (message) => err(where, message);

    // 1. Shape of the round.
    if (!text(round.id)) bad("id must be a non-empty string");
    if (!text(round.title)) bad("title must be a non-empty string");
    if (typeof round.reloadCheck !== "boolean") bad("reloadCheck must be true or false");
    if (round.inPlay !== undefined && typeof round.inPlay !== "boolean") bad("inPlay must be true or false");
    if (!Array.isArray(round.script) || !Array.isArray(round.tray) || typeof round.start !== "object" || round.start === null) {
      return bad("start, script and tray are required");
    }

    // 3. Learning outcome, briefing and hint.
    if (!["LO1", "LO2", "LO3", "LO4"].includes(round.learningOutcome)) bad("learningOutcome must be LO1 to LO4");
    const b = round.briefing ?? {};
    for (const field of ["idea", "workedExample", "limits"]) if (!text(b[field])) bad(`briefing.${field} must not be empty`);
    if (!Array.isArray(b.terms) || b.terms.length === 0 || !b.terms.every(text)) bad("briefing.terms must be a list of non-empty strings");
    if (!text(round.hint)) bad("hint must not be empty");
    for (const field of ["body", "thanks"]) if (!text(round.ticket?.[field])) bad(`ticket.${field} must not be empty`);
    // 4. Briefing sources exist.
    for (const id of b.sourceIds ?? []) if (!sourceIds.has(id)) bad(`briefing cites unknown source "${id}"`);
    if (!Array.isArray(b.sourceIds)) bad("briefing.sourceIds must be a list");

    // 5 and 6. Start names both routers, with real interfaces; 7. start routes match the grammar.
    for (const r of routers) if (!(r in round.start)) bad(`start has no entry for ${r}`);
    for (const [r, config] of Object.entries(round.start)) {
      if (!routers.includes(r)) { bad(`start names unknown router "${r}"`); continue; }
      for (const name of config.shutdown ?? []) {
        if (!(name in topology.routers[r].interfaces)) bad(`start shuts unknown interface "${name}" on ${r}`);
      }
      for (const line of config.routes ?? []) {
        if (parseLine(line, topology)?.kind !== "route") bad(`start route "${line}" on ${r} is not a valid ip route line`);
      }
    }

    // Cards: 2. unique ids; values of the right kind; 5. device cards name routers; 7. grammar.
    const cardIds = round.tray.map((c) => c.id);
    if (new Set(cardIds).size !== cardIds.length) bad("card ids must be unique");
    for (const card of round.tray) {
      if (!SLOT_TYPES.includes(card.type)) bad(`card "${card.id}" has unknown type "${card.type}"`);
      else if (card.type === "device" && !routers.includes(card.value)) bad(`card "${card.id}" names unknown router "${card.value}"`);
      else if (card.type === "configLine" && !parseLine(card.value, topology)) bad(`card "${card.id}" is not a valid configuration line: "${card.value}"`);
      else if (card.type === "statement") {
        const v = card.value ?? {};
        if (!["connect", "config", "save", "show", "print"].includes(v.op)) bad(`card "${card.id}" must be a connect, config, save, show or print statement`);
        else if (v.op === "connect" && v.device !== undefined && !routers.includes(v.device)) bad(`card "${card.id}" names unknown router "${v.device}"`);
        else if (v.op === "config") {
          const lists = v.linesByDevice ? Object.values(v.linesByDevice) : [v.lines];
          if (v.linesByDevice && Object.keys(v.linesByDevice).some((r) => !routers.includes(r))) bad(`card "${card.id}" names an unknown router`);
          if (!lists.every((list) => Array.isArray(list) && list.every((l) => typeof l === "string" && parseLine(l, topology)))) {
            bad(`card "${card.id}" must hold valid configuration lines, with no slots`);
          }
        } else if (v.op === "show" && !/^show /.test(v.command ?? "")) bad(`card "${card.id}": a show command must start with "show "`);
      }
    }

    // Script: 2. unique slot ids; 5. router ids; 7. grammar; 8. structure.
    // A round whose tray holds the connect call lets a statement slot come before any connect:
    // placing the calls in order is the point, and rule 9 says what a wrong order does.
    const connectCard = round.tray.some((c) => c.type === "statement" && c.value?.op === "connect");
    // A card that uses the loop variable (a connect with no device, or per-router lines) only makes
    // sense in or after a for.
    const loopCard = round.tray.some((c) => c.type === "statement" &&
      ((c.value?.op === "connect" && c.value.device === undefined) || c.value?.linesByDevice));
    let seenFor = false;
    const slotIds = [];
    const checkSlot = (slot, type) => {
      slotIds.push(slot.slot);
      if (slot.type !== type) bad(`slot "${slot.slot}" must be of type ${type} where it stands`);
      if (!text(slot.label)) bad(`slot "${slot.slot}" needs a label`);
    };
    const walk = (statements, inFor, connected) => {
      for (const st of statements) {
        if (isSlot(st)) {
          checkSlot(st, "statement");
          if (!connected && !connectCard) bad(`statement slot "${st.slot}" comes before any connect`);
          if (loopCard && !inFor && !seenFor) bad(`statement slot "${st.slot}" could take a card that needs the loop variable, but no for comes before it`);
        } else if (st.op === "connect") {
          if (st.device === undefined) { if (!inFor) bad("a connect without a device is only allowed inside a for"); }
          else if (isSlot(st.device)) checkSlot(st.device, "device");
          else if (!routers.includes(st.device)) bad(`connect names unknown router "${st.device}"`);
          connected = true;
        } else if (st.op === "config") {
          if (!connected) bad("a config comes before any connect");
          if (st.linesByDevice) {
            if (!inFor) bad("linesByDevice is only allowed inside a for");
            for (const [r, lines] of Object.entries(st.linesByDevice)) {
              if (!routers.includes(r)) bad(`linesByDevice names unknown router "${r}"`);
              for (const line of lines) if (!parseLine(line, topology)) bad(`"${line}" is not a valid configuration line`);
            }
          } else if (Array.isArray(st.lines)) {
            for (const line of st.lines) {
              if (isSlot(line)) checkSlot(line, "configLine");
              else if (!parseLine(line, topology)) bad(`"${line}" is not a valid configuration line`);
            }
          } else bad("a config needs lines or linesByDevice");
        } else if (st.op === "save" || st.op === "show" || st.op === "print") {
          if (st.op !== "print" && !connected) bad(`a ${st.op} comes before any connect`);
          if (st.op === "show" && !/^show /.test(st.command ?? "")) bad('a show command must start with "show "');
        } else if (st.op === "for") {
          for (const r of st.devices ?? []) if (!routers.includes(r)) bad(`for names unknown router "${r}"`);
          if (!Array.isArray(st.body)) bad("a for needs a body"); else walk(st.body, true, connected);
          seenFor = true;
          connected = connected || (st.body ?? []).some((s) => s.op === "connect");
        } else bad(`unknown statement op "${st.op}"`);
      }
    };
    walk(round.script, false, false);
    if (new Set(slotIds).size !== slotIds.length) bad("slot ids must be unique");

    // Playability needs a structurally sound round.
    if (errors.length > before) return;
    const slots = slotsOf(round);

    // 10. The tray can fill the slots.
    for (const type of SLOT_TYPES) {
      const need = slots.filter((s) => s.type === type).length;
      const have = round.tray.filter((c) => c.type === type).length;
      if (have < need) bad(`the tray cannot fill the slots: ${need} ${type} slot(s) but ${have} ${type} card(s)`);
    }
    if (errors.length > before) return;

    // 11. At least one placement solves the round; 12. no placement leaves overlapping routes.
    let solvable = false;
    let overlapping = false;
    for (const placement of placements(round)) {
      const result = run(topology, round, placement);
      if (result.status === "solved") solvable = true;
      for (const state of [...result.steps.map((s) => s.state), result.finalState]) {
        for (const view of Object.values(state)) {
          const prefixes = [...new Set(view.routingTable.map((e) => e.prefix))];
          if (prefixes.length !== view.routingTable.length) overlapping = true;
          prefixes.forEach((p, i) => prefixes.slice(i + 1).forEach((q) => { if (overlap(p, q)) overlapping = true; }));
        }
      }
    }
    if (!solvable) bad("no placement solves the round");
    if (overlapping) bad("a placement leaves a router with overlapping routes");

    // 13. The hint names no card.
    for (const card of round.tray) {
      if (round.hint.includes(cardText(card))) bad(`the hint contains the text of card "${card.id}"`);
    }
  });

  return errors;
}
