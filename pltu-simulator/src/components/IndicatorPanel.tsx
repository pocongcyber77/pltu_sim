'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { SystemState } from '../types';
import { formatNumber } from '../utils/calculation';

interface IndicatorPanelProps {
  systemState: SystemState;
}

export default function IndicatorPanel({ systemState }: IndicatorPanelProps) {
  const indicators = [
    {
      label: 'Temperatur',
      value: systemState.temperature,
      unit: '°C',
      maxValue: 1200,
      color: 'bg-red-500',
      bgColor: 'bg-red-100'
    },
    {
      label: 'Tekanan',
      value: systemState.pressure,
      unit: 'bar',
      maxValue: 150,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-100'
    },
    {
      label: 'RPM Turbin',
      value: systemState.turbineRPM,
      unit: 'RPM',
      maxValue: 3500,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-100'
    },
    {
      label: 'Daya Output',
      value: systemState.powerOutput,
      unit: 'MWatt',
      maxValue: 500,
      color: 'bg-green-500',
      bgColor: 'bg-green-100'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Panel Indikator PLTU Paiton Unit 4
      </h2>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {indicators.map((indicator, index) => {
          const percentage = (indicator.value / indicator.maxValue) * 100;
          
          return (
            <motion.div
              key={indicator.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`${indicator.bgColor} rounded-lg p-4 border-2 border-gray-200`}
            >
              <div className="text-center">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  {indicator.label}
                </h3>
                
                <div className="text-3xl font-bold text-gray-800 mb-2">
                  {formatNumber(indicator.value)}
                  <span className="text-lg text-gray-600">{indicator.unit}</span>
                </div>
                
                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <motion.div
                    className={`h-3 rounded-full ${indicator.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                
                <div className="text-xs text-gray-600">
                  0 - {indicator.maxValue}{indicator.unit}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {/* Status indicator */}
      <div className="mt-6 text-center">
        <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
          systemState.isRunning 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          <div className={`w-2 h-2 rounded-full mr-2 ${
            systemState.isRunning ? 'bg-green-500' : 'bg-red-500'
          }`} />
          {systemState.isRunning ? 'Sistem Aktif' : 'Sistem Nonaktif'}
        </div>
      </div>
    </div>
  );
} 