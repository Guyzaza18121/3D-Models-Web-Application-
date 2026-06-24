import { clamp } from '../constants';

// ──────────────────────────────────────────────────────────────────────────────
// PID Controller — pure function, no React, no side-effects
// Called every simulation tick (or real sensor tick when backend connected).
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Run one PID iteration.
 * @param {{ err: number, prevErr: number, integral: number, Kp: number, Ki: number, Kd: number }} p
 * @returns {{ output: number, newIntegral: number, pTerm: number, iTerm: number, dTerm: number }}
 */
export function pidTick({ err, prevErr, integral, Kp, Ki, Kd }) {
  const newIntegral = clamp(integral + err, -10, 10);
  const dErr        = err - prevErr;
  const pTerm       = Kp * err;
  const iTerm       = Ki * newIntegral;
  const dTerm       = Kd * dErr;
  const output      = clamp(pTerm + iTerm + dTerm, -5, 5);
  return { output, newIntegral, pTerm, iTerm, dTerm };
}
