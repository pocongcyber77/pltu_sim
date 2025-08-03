'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { formatTime } from '@/utils/calculation';

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
        const currentTime = Date.now();
        const elapsed = Math.floor((currentTime - startTime) / 1000);
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
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-lg shadow-lg p-6"
    >
      <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
        Waktu Operasional
      </h3>
      
      <div className="text-center">
        <div className="text-4xl font-mono font-bold text-blue-600 mb-2">
          {formatTime(elapsedTime)}
        </div>
        
        <div className="text-sm text-gray-600">
          {isRunning ? 'Sistem Berjalan' : 'Sistem Berhenti'}
        </div>
      </div>
      
      {/* Visual timer indicator */}
      <div className="mt-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="bg-blue-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: isRunning ? '100%' : '0%' }}
            transition={{ duration: 1, repeat: isRunning ? Infinity : 0 }}
          />
        </div>
      </div>
    </motion.div>
  );
} 