'use client';

import { useState } from 'react';
import type { FaultConfig } from '@/hooks/useFaultSimulator';

interface FaultSimulatorProps {
  config:    FaultConfig;
  onChange:  (config: FaultConfig) => void;
}

interface SliderProps {
  label:    string;
  value:    number;
  min:      number;
  max:      number;
  step:     number;
  display:  (v: number) => string;
  onChange: (v: number) => void;
}

function Slider({ label, value, min, max, step, display, onChange }: SliderProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs text-gray-400">
        <span>{label}</span>
        <span className="font-mono text-white">{display(value)}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-blue-500"
      />
    </div>
  );
}

export default function FaultSimulator({ config, onChange }: FaultSimulatorProps) {
  const [open, setOpen] = useState(false);

  const active = config.latencyMs > 0 || config.dropRate > 0 || config.dupRate > 0;

  return (
    <div className="border-t border-gray-700 pt-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-widest text-gray-400 hover:text-white"
      >
        <span>Network faults</span>
        <span className={active ? 'text-yellow-400' : ''}>{active ? '● on' : open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="mt-3 flex flex-col gap-3">
          <Slider
            label="Latency"
            value={config.latencyMs}
            min={0} max={2000} step={50}
            display={(v) => `${v} ms`}
            onChange={(v) => onChange({ ...config, latencyMs: v })}
          />
          <Slider
            label="Drop rate"
            value={config.dropRate}
            min={0} max={0.5} step={0.05}
            display={(v) => `${Math.round(v * 100)}%`}
            onChange={(v) => onChange({ ...config, dropRate: v })}
          />
          <Slider
            label="Duplicate rate"
            value={config.dupRate}
            min={0} max={0.3} step={0.05}
            display={(v) => `${Math.round(v * 100)}%`}
            onChange={(v) => onChange({ ...config, dupRate: v })}
          />
          {active && (
            <button
              onClick={() => onChange({ latencyMs: 0, dropRate: 0, dupRate: 0 })}
              className="text-xs text-red-400 hover:text-red-300"
            >
              Reset all
            </button>
          )}
        </div>
      )}
    </div>
  );
}
