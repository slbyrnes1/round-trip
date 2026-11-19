---
# ARCADE SUBMISSION — fill this file in, commit it to the ROOT of your game repository as ARCADE.md,
# then send John your GitHub URL. Everything between the two --- lines is machine-read.
#
# INSTRUCTIONS FOR THE BUILD AGENT (the coding agent that built this game):
#  1. You were there. Fill every field from your own session, your files and your tool list.
#  2. Do NOT invent. If something was not recorded or you do not know it, write "unknown".
#     A truthful "unknown" is better than a confident guess. Never estimate tokens or cost.
#  3. Ask the human ONLY for the fields marked (HUMAN): name, location, links, consent, first-project.
#  4. Keep strings on one line, quote any value containing a colon. Lists use [a, b, c] or "- item".
#  5. Do not put secrets, API keys, tokens, private URLs or file paths from the human's machine here.
#  6. Run the game once yourself and confirm the Runtime section is correct before you finish.
#  7. Then fill in the three short prose sections below the frontmatter. Plain language, no hype.
arcade_version: 1

game:
  title: "Round Trip"
  slug: "round-trip"
  tagline: "Finish the script, run it, and watch whether the ping makes it there and back."
  summary: "The player places code cards into the blanks of a short Netmiko-style script, runs it against two simulated routers, and watches a ping travel from hostA to hostB and back. They learn that a script that ran without crashing has not necessarily fixed the network, by keeping apart what the script sent, what the router holds in its configuration, and what traffic does."
  topics: [Netmiko, Cisco IOS CLI, static routes, running vs startup config, network automation]
  category: "automation"
  skill_level: "beginner"
  play_minutes: 15           # middle of the README's 10-20 minute target; not measured with a first-time player
  levels: 7
  card_image: ""             # no image file exists in the repo yet
  card_image_alt: ""
  repo: "https://github.com/slbyrnes1/round-trip"
  repo_path: ""
  license: "Apache-2.0"

creator:                     # (HUMAN) ask the human for every field here
  name: "Shannon Byrnes"
  github: "slbyrnes1"
  location: "Arizona, USA"
  organization: ""
  links: []
  first_spec_project: true
  workshop: "NAF AC6"
  consent_to_publish: true

build:                       # the BUILD environment — what made the game
  started: "2026-11-17T16:59Z"   # first prompt of the first build session in the harness transcripts
  finished: "2026-11-19T17:14Z"  # last message of the last build session
  wall_time: "unknown"           # the build ran in sittings across two days; no single wall time was recorded
  spec_driven:
    framework: "GitHub Spec Kit"
    framework_version: "1.4.2.dev0"
    artifacts: [constitution, spec, clarify, plan, tasks, checklists, research, data-model, contracts, quickstart]  # analyze was run four times but writes no file, so no analysis artifact is in the repo
    task_count: 61           # 54 are checked off in tasks.md
    loops_or_phases: 10      # phases in tasks.md; three /loop runs were also used (see "How it was built")
  model: "claude-fable-5-2"
  helper_models: ["claude-haiku-5-5 (called by the harness itself; purpose not recorded)"]  # no sub-agents were launched
  harness: "Claude Code"
  harness_version: "2.1.326"
  mcp_servers: []            # no MCP tool was called in any build session; the harness had unrelated account-level connectors configured, none of which the build used
  rag_and_sources:
    - "The author's own SPEC.md design document for the game"
    - "NAF AC6 workshop lab instructions and StarterKit (github.com/automateyournetwork/NAF_AC6)"
    - "Netmiko source, fetched: base_connection.py, cisco_base_connection.py, cisco/cisco_ios.py"
    - "IETF RFC 1812, fetched from rfc-editor.org"
    - "Cisco, Configure Route Selection for Routers (Document ID 8651), fetched"
    - "Python Language Reference 8.3 (the for statement) and Library Reference (NameError), fetched"
    - "Other references listed in the README (Netmiko API docs, three Cisco IOS/IOS XE guides, a Cisco Learning Network thread) are cited in the spec; whether the agent fetched them is unknown"
  skills_and_plugins:
    - "Spec Kit skills as slash commands: speckit-constitution, speckit-specify, speckit-clarify, speckit-plan, speckit-tasks, speckit-analyze, speckit-implement"
    - "Claude Code /loop (three loop runs, eight scheduled iterations)"
  other_tools: ["node --test (Node v26.11.1)", "headless Google Chrome 157 driven by script", "python3 http.server via serve.py", "specify CLI", "git", "gh", "curl", "WebFetch", "WebSearch"]
  human_prompts: 54          # prompts of human origin in the four build sessions, counting slash commands and one-letter clarification answers; scheduled loop iterations excluded
  usage:
    input_tokens: 90403347   # main model only: 652 uncached + 1479993 cache-write + 88922702 cache-read
    output_tokens: 582368    # main model only
    cost_note: "Token counts are summed from the harness session transcripts for claude-fable-5-2; helper-model tokens and the billing arrangement are unknown"
  ai_generated_assets: ["images: none (no image files; the diagram, faces and icons are HTML, CSS and inline SVG written by the build agent)", "audio: none"]

runtime:                     # what someone needs to PLAY the finished game
  kind: "static-web"
  stack: [HTML, CSS, ES modules, JSON content file, no framework, no build step]
  start: "python3 serve.py"
  url_after_start: "http://127.0.0.1:8000"
  hosted_url: ""
  static_root: "."
  requires_install: false
  requires_network: false
  requires_api_key: false
  uses_ai_at_runtime: false
  browsers: ["Chrome 157 (headless, driven by script; no person has played it through)"]
  accessibility: "Tested by script in headless Chrome only: all seven rounds completed with keyboard focus and key events, and reduced motion emulated. Screen-reader output was not listened to, touch was not checked, and the author has not yet run their own check."
  save_state: "none (progress lasts for the page session only)"

verification:
  tests: "node --test tests/"
  tests_passing: 110
  facts_sourced_from:
    - "Netmiko source: base_connection.py, cisco_base_connection.py, cisco/cisco_ios.py"
    - "Netmiko API documentation, netmiko.base_connection"
    - "Cisco IP Routing Configuration Guide, IOS XE 17.17 (Catalyst 9600), Protocol-Independent Features"
    - "Cisco IOS IP Routing Protocol-Independent Command Reference, ip route"
    - "Cisco Using the Command-Line Interface, Catalyst 9300, IOS XE 17.17"
    - "Cisco Configure Route Selection for Routers (Document ID 8651)"
    - "IETF RFC 1812, section 5.2.4.3"
    - "Python Language Reference 8.3 and Library Reference (NameError)"
    - "Cisco Learning Network thread 46334 (a forum post, not Cisco documentation)"
  known_limits:
    - "A simplified simulator of Cisco IOS behaviour; no real device, remote session or Python interpreter is involved"
    - "Not modelled: ARP, dynamic routing, administrative distance, equal-cost paths, recursive next hops, exit-interface static routes, IPv6, privilege modes, authentication failures, timeouts, ICMP errors"
    - "Rules 1 and 2 (CLI context and link state) have no reference; rule 4 rests on a forum post"
    - "Two router messages were not captured from a real device, so the game paraphrases them"
    - "The take-away script was checked against Netmiko's source but never run against Netmiko or a real router"
    - "Only one script error is modelled: using conn before connecting"
    - "The rule-by-rule check against references and the author's own playthrough have not been done"
    - "Below 768 px wide and touch input are unchecked"
---

## In one paragraph

Round Trip is a browser game for network engineers who are new to automation. Each of its seven rounds is a short Netmiko-style script with blanks: you place code cards, press Run, and watch a ping try to go from hostA to hostB and back across two simulated routers. After every Run the game shows what Netmiko sent, what each router did with it, where the traffic stopped and the rule behind it. It targets one misconception, that a script which ran without crashing has fixed the network. The last round has you assemble a whole script, which you can copy away as real Netmiko code.

## How it was built

The build ran in Claude Code with GitHub Spec Kit, over sittings on two days. The author brought their own SPEC.md. From it we wrote the constitution, then the spec, then two rounds of clarification, the plan, the tasks, and an analysis pass, and committed those before any code. A fresh session reran analysis, clarified again, replanned, and then implemented the first playable build of four rounds.

The author changed direction several times. Early on they asked why a Run should force the player to wait; that became a constitution rule that the player never waits, a ping that repeats on the diagram, and a Reset routers button. After playing the first build they asked for Pause and Slow and collapsible panels. Three `/loop` runs followed: one on visuals and layout, one that grew the game from four rounds to seven with a take-away script, and one that cut the on-screen text. Each change went back into the spec and tasks.

One thing broke. During the seven-round loop the author reported the game no longer worked. The code and tests were fine; the cause, inferred and then reproduced, was the browser mixing cached old modules with new ones under `python3 -m http.server`. The fix was `serve.py`, which sends `Cache-Control: no-store`, and a start-up error message in place of an endless "Loading".

## What we'd tell the next builder

- Serve ES modules with caching turned off while the agent is changing them. A stale module fails silently and looks like a broken game.
- Keep the expected results in a file worked by hand that never calls the simulator. Ours checks every placement of every round, so content changes cannot quietly change an answer.
- Record who verified what. Our browser checks were run by the agent in headless Chrome; the README says so and leaves the author's own column empty until a person plays it.
