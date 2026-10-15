'use client';

import { useCallback, useRef, useState } from 'react';

export interface FaultConfig {
  latencyMs: number;   // artificial delay added to every outgoing message (0–2000 ms)
  dropRate:  number;   // probability a message is silently dropped  (0–0.5)
  dupRate:   number;   // probability a message is sent a second time (0–0.3)
}

const DEFAULT_CONFIG: FaultConfig = { latencyMs: 0, dropRate: 0, dupRate: 0 };

export function useFaultSimulator(sendEdit: (content: string) => void) {
  const [config, setConfig] = useState<FaultConfig>(DEFAULT_CONFIG);
  const configRef           = useRef<FaultConfig>(config);
  configRef.current         = config;   // always up-to-date inside callbacks

  const faultySend = useCallback((content: string) => {
    const { latencyMs, dropRate, dupRate } = configRef.current;

    if (Math.random() < dropRate) return;   // drop

    const doSend = () => {
      sendEdit(content);
      if (Math.random() < dupRate) sendEdit(content);   // duplicate
    };

    if (latencyMs > 0) setTimeout(doSend, latencyMs);
    else doSend();
  }, [sendEdit]);

  return { faultySend, config, setConfig };
}
