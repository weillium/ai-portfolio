import { useEffect, useMemo, useState } from 'react';
import type { CustomAgentProps } from '../types/customAgents';

interface WeatherState {
  location: string;
  temperature: number;
  condition: string;
  updated_at: string;
}

const sampleConditions = ['Sunny', 'Cloudy', 'Rainy', 'Stormy', 'Snowy'];

export default function WeatherVisualizer({
  agent,
  sessionState,
  onUpdateSessionState
}: CustomAgentProps) {
  const [weather, setWeather] = useState<WeatherState | null>(sessionState.weather ?? null);

  useEffect(() => {
    if (sessionState.weather) {
      setWeather(sessionState.weather as WeatherState);
    }
  }, [sessionState]);

  const gradient = useMemo(() => {
    switch (weather?.condition) {
      case 'Sunny':
        return 'from-amber-400/30 to-orange-500/40';
      case 'Rainy':
        return 'from-blue-400/30 to-sky-500/40';
      case 'Stormy':
        return 'from-gray-500/40 to-slate-700/40';
      case 'Snowy':
        return 'from-sky-200/40 to-slate-100/30';
      default:
        return 'from-emerald-400/30 to-cyan-500/40';
    }
  }, [weather?.condition]);

  const randomizeWeather = async () => {
    const nextWeather: WeatherState = {
      location: weather?.location ?? 'Seattle, WA',
      temperature: Math.round(Math.random() * 25 + 50),
      condition: sampleConditions[Math.floor(Math.random() * sampleConditions.length)],
      updated_at: new Date().toISOString()
    };
    setWeather(nextWeather);
    await onUpdateSessionState({ ...sessionState, weather: nextWeather });
  };

  const updateLocation = async (location: string) => {
    const baseWeather: WeatherState =
      weather ?? {
        location,
        temperature: 70,
        condition: 'Sunny',
        updated_at: new Date().toISOString()
      };
    const nextWeather = { ...baseWeather, location };
    setWeather(nextWeather);
    await onUpdateSessionState({ ...sessionState, weather: nextWeather });
  };

  return (
    <div className="grid gap-6 md:grid-cols-[1.5fr_1fr]">
      <div className={`relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br ${gradient} p-8 shadow-xl shadow-black/30`}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 flex h-full flex-col justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-white/70">{agent.name}</p>
            <h3 className="mt-4 text-5xl font-semibold text-white">
              {weather?.temperature ?? '--'}°F
            </h3>
            <p className="mt-2 text-xl text-white/80">{weather?.condition ?? 'Tap refresh to generate weather.'}</p>
          </div>
          <div className="space-y-2 text-xs text-white/70">
            <p>Location: {weather?.location ?? 'Unknown'}</p>
            <p>Updated: {weather?.updated_at ? new Date(weather.updated_at).toLocaleString() : 'Not yet'}</p>
          </div>
        </div>
      </div>
      <div className="rounded-3xl border border-white/5 bg-midnight-900/70 p-6 shadow-xl shadow-black/30 space-y-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">Location</label>
          <input
            type="text"
            defaultValue={weather?.location ?? 'Seattle, WA'}
            onBlur={(event) => updateLocation(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-midnight-800/80 px-4 py-3 text-sm text-gray-100 outline-none focus:border-white/30"
          />
        </div>
        <button
          onClick={randomizeWeather}
          className="w-full rounded-2xl bg-midnight-500 py-3 text-sm font-semibold text-white transition hover:bg-midnight-400"
        >
          Refresh weather snapshot
        </button>
        <p className="text-xs text-gray-400">
          This custom agent demonstrates how fully-coded experiences can be embedded alongside config-driven agents. Use it
          as a starting point for data visualizations, dashboards, or specialized tools.
        </p>
      </div>
    </div>
  );
}
