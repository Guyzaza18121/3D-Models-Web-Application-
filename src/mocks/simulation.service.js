import { clamp, rnd } from '../constants';

export const K = 0.18, VOL = 2.5;

export function computeActualDemand(baseDemand, tick) {
  return clamp(baseDemand + Math.sin(tick * 0.07) * 0.5 + rnd(-0.15, 0.15), 0.1, 20);
}

export function computePressureDelta(supply, demand) {
  return K * (supply - demand) / VOL + rnd(-0.003, 0.003);
}

export function calcCompressorState(c, { sysP, SP }) {
  if (c.status === 'STANDBY') {
    return {
      updated: { ...c, load: 0, curr: 0, press: 0, temp: Math.max(c.temp - 0.02, 30) },
      newFault: null,
    };
  }
  if (c.status !== 'RUNNING') return { updated: c, newFault: null };

  const err     = SP - sysP;
  const tgt     = clamp(60 + err * 18 + rnd(-3, 3), 25, 100);
  const newLoad = clamp(c.load + (tgt - c.load) * 0.15, 0, 100);
  const newCurr = (c.kw * newLoad / 100) / 0.38 * rnd(0.97, 1.03);
  const newTemp = clamp(c.temp + (newLoad > 80 ? 0.1 : -0.04) + rnd(-0.03, 0.03), 30, 110);

  let st = c.status, ft = c.fault, newFault = null;
  if (!ft && Math.random() < 0.0003) {
    newFault = newTemp > 90 ? 'High Temp Trip' : 'Overload Protection';
    ft       = newFault;
    st       = 'FAULT';
  }

  return {
    updated: {
      ...c,
      load:    newLoad,
      curr:    newCurr,
      temp:    newTemp,
      press:   clamp(sysP + rnd(-0.05, 0.05), 0, 13),
      runtime: c.runtime + 1,
      status:  st,
      fault:   ft,
    },
    newFault,
  };
}

export function calcSensorValue(s, { sysP, flowNow }) {
  if (s.type === 'Pressure') {
    return { updated: { ...s, value: clamp(sysP + rnd(-0.05, 0.05), 0, 12) }, isFlowMeter: false };
  }
  if (s.type === 'Flow') {
    const nextValue = clamp(flowNow + rnd(-0.1, 0.1), 0, 15);
    return { updated: { ...s, value: nextValue }, isFlowMeter: true };
  }
  if (s.type === 'Temp') {
    return { updated: { ...s, value: clamp(s.value + rnd(-0.2, 0.2), s.min, s.max) }, isFlowMeter: false };
  }
  return { updated: s, isFlowMeter: false };
}
