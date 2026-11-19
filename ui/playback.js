// Timing only: walk a Result step by step, and walk a ping across the diagram, once or repeating.
// Everything shown comes from the simulator's Result; nothing here decides an outcome.
// Contract: specs/001-round-trip-game/contracts/ui.md "Playback" and "The repeating ping".

export const TIMING = { step: 400, hop: 550, pause: 700, rest: 1000 };

export const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** A walk checks its token after every wait and stops touching the page once it is cancelled. */
export const newToken = () => ({ cancelled: false });

/** Pause and Slow act on every walk: a Run's playback and the repeating ping alike. */
export const pace = { paused: false, rate: 1 };
export const SLOW_RATE = 0.4;

// Counts down only while not paused, at the current rate. Resolves false once cancelled.
const wait = (ms, token) => new Promise((resolve) => {
  let left = ms;
  let last = performance.now();
  const tick = () => {
    if (token.cancelled) return resolve(false);
    const now = performance.now();
    if (!pace.paused) left -= (now - last) * pace.rate;
    last = now;
    if (left <= 0) resolve(true); else setTimeout(tick, Math.min(40, left / pace.rate));
  };
  setTimeout(tick, Math.min(40, ms));
});

/**
 * One pass of a ping: request left to right, then the reply right to left.
 * Where each dot stops comes only from the simulator's Leg (constitution VIII).
 * With `detail`, the dot pauses at each router while the route it used is shown.
 * Returns false if cancelled.
 */
export async function walkPing(ping, stage, token, detail) {
  stage.clearMarks();
  for (const [name, leg] of [["request", ping.request], ["reply", ping.reply]]) {
    if (!leg) break;
    for (let i = 1; i < leg.hops.length; i += 1) {
      const hop = leg.hops[i];
      await stage.moveDot(name, leg.hops[i - 1].node, hop.node, TIMING.hop);
      if (token.cancelled) return false;
      const atRouter = !leg.delivered || i < leg.hops.length - 1;
      if (atRouter && detail) {
        stage.atRouter(hop.node, hop.route, name, leg.destination);
        if (!(await wait(TIMING.pause, token))) return false;
        stage.leaveRouter();
      }
    }
    stage.mark(leg.delivered ? leg.hops.at(-1).node : leg.droppedAt, leg.delivered ? "delivered" : "dropped", name);
    if (!leg.delivered) break;
  }
  stage.hideDot();
  return true;
}

/** Repeat a ping until cancelled, resting between passes. Writes and announces nothing. */
export async function loopPing(ping, stage, token, detail) {
  while (!token.cancelled) {
    if (!(await walkPing(ping, stage, token, detail))) return;
    if (!(await wait(TIMING.rest, token))) return;
  }
}

/** The same end state as walkPing, with no motion: for reduced motion. */
export function stillPing(ping, stage) {
  stage.clearMarks();
  for (const [name, leg] of [["request", ping.request], ["reply", ping.reply]]) {
    if (!leg) break;
    stage.mark(leg.delivered ? leg.hops.at(-1).node : leg.droppedAt, leg.delivered ? "delivered" : "dropped", name);
  }
}

/**
 * Play a Run: each step, then each ping (with the reload between them when there are two),
 * then the feedback. `hooks` put the text on the page; the same hooks, called without waiting,
 * are what Skip and reduced motion use, so the text is identical by construction.
 * Returns false if cancelled.
 */
export async function walkRun(result, hooks, stage, token) {
  for (let i = 0; i < result.steps.length; i += 1) {
    hooks.step(i);
    if (!(await wait(TIMING.step, token))) return false;
  }
  hooks.endSteps();
  for (let k = 0; k < result.pings.length; k += 1) {
    if (k > 0) {
      hooks.reload();
      if (!(await wait(TIMING.step * 2, token))) return false;
    }
    hooks.trace(k);
    if (!(await walkPing(result.pings[k], stage, token, true))) return false;
    if (k < result.pings.length - 1 && !(await wait(TIMING.step, token))) return false;
  }
  hooks.finish();
  return true;
}

/** The whole Run at once: what Skip and reduced motion show. */
export function showRun(result, hooks) {
  result.steps.forEach((_, i) => hooks.step(i));
  hooks.endSteps();
  result.pings.forEach((_, k) => {
    if (k > 0) hooks.reload();
    hooks.trace(k);
  });
  hooks.finish();
}
