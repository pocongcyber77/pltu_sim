'use client';

import React from 'react';
import { formatCurrency } from '../utils/calculation';

interface EarningsCounterProps {
  totalEarnings: number;
  isRunning: boolean;
  powerOutput: number;
}

export default function EarningsCounter({ totalEarnings, isRunning, powerOutput }: EarningsCounterProps) {
  // Calculate revenue per hour based on power output
  const revenuePerHour = powerOutput * 1500 * 1000; // IDR per hour

  return (
    <div className="bg-gray-800 rounded p-2 lg:p-4 border border-green-500">
      <h3 className="text-sm lg:text-lg font-semibold text-white mb-2 lg:mb-4 text-center">
        Total Revenue
      </h3>
      
      <div className="text-center space-y-2">
        <div className="text-lg lg:text-2xl font-mono text-green-400">
          {formatCurrency(totalEarnings)}
        </div>
        
        <div className={`text-xs lg:text-sm ${
          isRunning ? 'text-green-400' : 'text-red-400'
        }`}>
          {isRunning ? 'Generating revenue...' : 'System stopped'}
        </div>
        
        <div className="text-xs text-gray-400">
          Revenue per Hour: {formatCurrency(revenuePerHour)}
        </div>
      </div>
    </div>
  );
} 