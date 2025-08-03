'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/utils/calculation';

interface EarningsCounterProps {
  totalEarnings: number;
  isRunning: boolean;
  powerOutput: number;
}

export default function EarningsCounter({ totalEarnings, isRunning, powerOutput }: EarningsCounterProps) {
  const [displayEarnings, setDisplayEarnings] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isRunning) {
        setDisplayEarnings(prev => {
          const increment = (powerOutput * 1000000) / 3600; // Earnings per second
          return prev + increment;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, powerOutput]);

  useEffect(() => {
    setDisplayEarnings(totalEarnings);
  }, [totalEarnings]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-6"
    >
      <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
        Total Pendapatan
      </h3>
      
      <div className="text-center">
        <motion.div
          key={displayEarnings}
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 0.3 }}
          className="text-3xl font-bold text-green-600 mb-2"
        >
          {formatCurrency(displayEarnings)}
        </motion.div>
        
        <div className="text-sm text-gray-600 mb-4">
          {isRunning ? 'Menghasilkan pendapatan...' : 'Sistem berhenti'}
        </div>
        
        {/* Earnings rate indicator */}
        <div className="bg-green-50 rounded-lg p-3">
          <div className="text-sm text-gray-700 mb-1">
            Pendapatan per Jam:
          </div>
          <div className="text-lg font-semibold text-green-700">
            {formatCurrency(powerOutput * 1000000)}
          </div>
        </div>
      </div>
      
      {/* Visual earnings indicator */}
      <div className="mt-4">
        <div className="w-full bg-gray-200 rounded-full h-3">
          <motion.div
            className="bg-green-500 h-3 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: isRunning ? '100%' : '0%' }}
            transition={{ duration: 2, repeat: isRunning ? Infinity : 0 }}
          />
        </div>
      </div>
    </motion.div>
  );
} 