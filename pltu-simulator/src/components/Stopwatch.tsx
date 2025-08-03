'use client';

import React, { useState, useEffect } from 'react';
import { formatTime } from '../utils/calculation';

interface StopwatchProps {
  isRunning: boolean;
  startTime: number | null;
}

export default function Stopwatch({ isRunning, startTime }: StopwatchProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && startTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    } else {
      setElapsedTime(0);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, startTime]);

  return (
    <div className="bg-gray-800 rounded p-2 lg:p-4 border border-green-500">
      <h3 className="text-sm lg:text-lg font-semibold text-white mb-2 lg:mb-4 text-center">
        Operational Time
      </h3>
      
      <div className="text-center">
        <div className="text-lg lg:text-2xl font-mono text-green-400 mb-2">
          {formatTime(elapsedTime)}
        </div>
        
        <div className={`text-xs lg:text-sm font-semibold ${
          isRunning ? 'text-green-400' : 'text-red-400'
        }`}>
          {isRunning ? 'System Running' : 'System Stopped'}
        </div>
      </div>
    </div>
  );
} 