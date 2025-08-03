'use client';

import React, { useState, useEffect } from 'react';
import { SystemState } from '../types';

interface HeaderPanelProps {
  systemState: SystemState;
}

export default function HeaderPanel({ systemState }: HeaderPanelProps) {
  const [currentDateTime, setCurrentDateTime] = useState('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const date = now.toLocaleDateString('id-ID');
      const time = now.toLocaleTimeString('id-ID');
      setCurrentDateTime(`${date} ${time}`);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-black text-green-400 p-2 lg:p-4 border-b border-green-500">
      <div className="flex justify-between items-center">
        {/* Logo and Title */}
        <div className="flex items-center space-x-2 lg:space-x-4">
          <div className="text-sm lg:text-xl font-bold text-white">PT PLN (PERSERO)</div>
          <div className="text-xs lg:text-sm text-gray-400">PLTU Paiton Unit 4</div>
        </div>
        
        {/* Date/Time and User */}
        <div className="flex items-center space-x-3 lg:space-x-6">
          <div className="text-xs lg:text-sm text-gray-400">
            {currentDateTime}
          </div>
          <div className="text-xs lg:text-sm text-gray-400">Engineer</div>
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex items-center space-x-1 lg:space-x-2">
          <button className="px-2 lg:px-3 py-1 lg:py-1 bg-gray-700 text-green-400 rounded text-xs">PRE</button>
          <button className="px-2 lg:px-3 py-1 lg:py-1 bg-gray-700 text-green-400 rounded text-xs">NEXT</button>
          <button className="px-2 lg:px-3 py-1 lg:py-1 bg-gray-700 text-green-400 rounded text-xs">Graph</button>
          <button className="px-2 lg:px-3 py-1 lg:py-1 bg-gray-700 text-green-400 rounded text-xs">Overview</button>
        </div>
      </div>
      
      {/* Main Indicators Grid */}
      <div className="grid grid-cols-4 lg:grid-cols-8 gap-1 lg:gap-4 mt-2 lg:mt-4">
        <div className="bg-gray-800 rounded p-1 lg:p-2 border border-green-500">
          <div className="text-xs text-gray-400">Main Steam Flow</div>
          <div className="text-sm lg:text-lg font-mono text-green-400">{systemState.mainSteamFlow.toFixed(1)} t/h</div>
        </div>
        
        <div className="bg-gray-800 rounded p-1 lg:p-2 border border-green-500">
          <div className="text-xs text-gray-400">Main Steam Press</div>
          <div className="text-sm lg:text-lg font-mono text-green-400">{systemState.mainSteamPressure.toFixed(1)} MPa</div>
        </div>
        
        <div className="bg-gray-800 rounded p-1 lg:p-2 border border-green-500">
          <div className="text-xs text-gray-400">Main Steam Temp</div>
          <div className="text-sm lg:text-lg font-mono text-green-400">{systemState.mainSteamTemp.toFixed(1)} °C</div>
        </div>
        
        <div className="bg-gray-800 rounded p-1 lg:p-2 border border-green-500">
          <div className="text-xs text-gray-400">Turbine Speed</div>
          <div className="text-sm lg:text-lg font-mono text-green-400">{systemState.turbineSpeed.toFixed(0)} rpm</div>
        </div>
        
        <div className="bg-gray-800 rounded p-1 lg:p-2 border border-green-500">
          <div className="text-xs text-gray-400">Condensate Flow</div>
          <div className="text-sm lg:text-lg font-mono text-green-400">{systemState.condensateWaterFlow.toFixed(1)} t/h</div>
        </div>
        
        <div className="bg-gray-800 rounded p-1 lg:p-2 border border-green-500">
          <div className="text-xs text-gray-400">Oil Tank Level</div>
          <div className="text-sm lg:text-lg font-mono text-green-400">{systemState.oilTankLevel.toFixed(1)} %</div>
        </div>
        
        <div className="bg-gray-800 rounded p-1 lg:p-2 border border-green-500">
          <div className="text-xs text-gray-400">Load</div>
          <div className="text-sm lg:text-lg font-mono text-green-400">{systemState.load.toFixed(1)} MW</div>
        </div>
        
        <div className="bg-gray-800 rounded p-1 lg:p-2 border border-green-500">
          <div className="text-xs text-gray-400">Frequency</div>
          <div className="text-sm lg:text-lg font-mono text-green-400">{systemState.frequency.toFixed(1)} Hz</div>
        </div>
      </div>
      
      {/* Power Output Boxes */}
      <div className="flex justify-center space-x-2 lg:space-x-4 mt-2 lg:mt-4">
        <div className="bg-green-600 rounded p-2 lg:p-3 border border-green-400">
          <div className="text-xs text-white">Power Output</div>
          <div className="text-sm lg:text-xl font-bold text-white">{systemState.powerOutput.toFixed(1)} MW</div>
        </div>
        
        <div className="bg-blue-600 rounded p-2 lg:p-3 border border-blue-400">
          <div className="text-xs text-white">Temperature</div>
          <div className="text-sm lg:text-xl font-bold text-white">{systemState.temperature.toFixed(1)} °C</div>
        </div>
        
        <div className="bg-red-600 rounded p-2 lg:p-3 border border-red-400">
          <div className="text-xs text-white">Pressure</div>
          <div className="text-sm lg:text-xl font-bold text-white">{systemState.pressure.toFixed(1)} MPa</div>
        </div>
      </div>
    </div>
  );
} 