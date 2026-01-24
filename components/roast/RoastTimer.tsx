"use client";

import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Flame } from 'lucide-react';

interface RoastTimerProps {
  onTimeUpdate: (minutes: number) => void;
  initialMinutes?: number;
}

export function RoastTimer({ onTimeUpdate, initialMinutes = 0 }: RoastTimerProps) {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds((seconds) => seconds + 1);
      }, 1000);
    } else if (!isActive && seconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, seconds]);

  useEffect(() => {
    onTimeUpdate(seconds / 60);
  }, [seconds, onTimeUpdate]);

  const toggle = () => setIsActive(!isActive);
  
  const reset = () => {
    setSeconds(0);
    setIsActive(false);
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-900 rounded-[2rem] p-8 text-white flex flex-col items-center justify-center space-y-6 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-1 bg-amber-500/20">
        <div 
          className="h-full bg-amber-500 transition-all duration-1000 ease-linear"
          style={{ width: isActive ? '100%' : '0%' }}
        />
      </div>

      <div className="flex items-center gap-2 text-amber-500 animate-pulse">
        <Flame size={16} fill="currentColor" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Live Roast Timer</span>
      </div>

      <div className="text-7xl font-black italic tracking-tighter tabular-nums">
        {formatTime(seconds)}
      </div>

      <div className="flex gap-4">
        <button
          onClick={toggle}
          className={`p-4 rounded-2xl transition-all ${isActive ? 'bg-white text-slate-900' : 'bg-amber-500 text-slate-900'} hover:scale-110 active:scale-95 shadow-xl`}
        >
          {isActive ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
        </button>
        <button
          onClick={reset}
          className="p-4 rounded-2xl bg-slate-800 text-slate-400 hover:text-white transition-all hover:bg-slate-700 active:scale-95"
        >
          <RotateCcw size={24} />
        </button>
      </div>
    </div>
  );
}
