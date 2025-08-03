'use client';

import React, { useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import ControlLever from '../components/ControlLever';
import HeaderPanel from '../components/HeaderPanel';
import Stopwatch from '../components/Stopwatch';
import EarningsCounter from '../components/EarningsCounter';
import { useSimulatorStore } from '../store/simulatorStore';
import { ControlLever as ControlLeverType } from '../types';

// Memoized ControlLever component to prevent unnecessary re-renders
const MemoizedControlLever = React.memo(ControlLever);

export default function PLTUSimulator() {
  const { 
    levers, 
    systemState, 
    updateLever, 
    startSystem, 
    stopSystem, 
    resetSystem, 
    shutdownSystem,
    updateEarnings 
  } = useSimulatorStore();

  // Memoize the system control handlers
  const handleStartSystem = useCallback(() => {
    startSystem();
  }, [startSystem]);

  const handleStopSystem = useCallback(() => {
    stopSystem();
  }, [stopSystem]);

  const handleResetSystem = useCallback(() => {
    resetSystem();
  }, [resetSystem]);

  const handleShutdownSystem = useCallback(() => {
    shutdownSystem();
  }, [shutdownSystem]);

  // Update earnings every second when system is running
  useEffect(() => {
    const interval = setInterval(() => {
      if (systemState.isRunning) {
        updateEarnings();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [systemState.isRunning, updateEarnings]);

  // Memoize the additional indicators to prevent unnecessary re-renders
  const additionalIndicators = useMemo(() => [
    {
      label: 'Steam Out Turbine',
      value: systemState.steamOutTurbineTemp,
      unit: '°C',
      color: 'text-orange-400'
    },
    {
      label: 'Surge Tank',
      value: systemState.surgeTankTemp,
      unit: '°C',
      color: 'text-blue-400'
    },
    {
      label: 'Condenser Out',
      value: systemState.condenserOutTemp,
      unit: '°C',
      color: 'text-cyan-400'
    },
    {
      label: 'Cooling Water',
      value: systemState.coolingWaterTemp,
      unit: '°C',
      color: 'text-green-400'
    },
    {
      label: 'Total Wattage',
      value: systemState.totalWattageProduced / 1000000,
      unit: ' MWh',
      color: 'text-green-400'
    },
    {
      label: 'Coal Loading',
      value: systemState.coalLoadingRate,
      unit: ' t/h',
      color: 'text-orange-400'
    },
    {
      label: 'Combustion Speed',
      value: systemState.combustionSpeed,
      unit: ' t/h',
      color: 'text-red-400'
    },
    {
      label: 'Water Loading',
      value: systemState.waterLoadingRate,
      unit: ' m³/h',
      color: 'text-blue-400'
    },
    {
      label: 'Water Boiling',
      value: systemState.waterBoilingRate,
      unit: ' t/h',
      color: 'text-cyan-400'
    },
    {
      label: 'Steam Generation',
      value: systemState.steamGenerationRate,
      unit: ' t/h',
      color: 'text-purple-400'
    },
    {
      label: 'Fuel Consumption',
      value: systemState.fuelConsumptionRate,
      unit: ' t/h',
      color: 'text-yellow-400'
    },
    {
      label: 'Efficiency',
      value: systemState.efficiency,
      unit: ' %',
      color: 'text-green-400'
    },
    {
      label: 'Emissions',
      value: systemState.emissionsRate,
      unit: ' kg/h',
      color: 'text-red-400'
    },
    {
      label: 'Heat Rate',
      value: systemState.heatRate,
      unit: ' kJ/kWh',
      color: 'text-orange-400'
    }
  ], [
    systemState.steamOutTurbineTemp, 
    systemState.surgeTankTemp, 
    systemState.condenserOutTemp, 
    systemState.coolingWaterTemp,
    systemState.totalWattageProduced,
    systemState.coalLoadingRate,
    systemState.combustionSpeed,
    systemState.waterLoadingRate,
    systemState.waterBoilingRate,
    systemState.steamGenerationRate,
    systemState.fuelConsumptionRate,
    systemState.efficiency,
    systemState.emissionsRate,
    systemState.heatRate
  ]);

  return (
    <div className="h-screen w-screen bg-black text-green-400 overflow-hidden flex flex-col">
      {/* Header Panel - Fixed height */}
      <div className="flex-shrink-0">
        <HeaderPanel systemState={systemState} />
      </div>
      
      {/* Main Content - Takes remaining space */}
      <div className="flex-1 flex min-h-0">
        {/* Main SCADA Area */}
        <div className="flex-1 flex flex-col p-2 lg:p-4 overflow-hidden">
          {/* Title - Fixed height */}
          <div className="text-center mb-2 lg:mb-4 flex-shrink-0">
            <h1 className="text-lg lg:text-2xl xl:text-3xl font-bold text-white mb-1">#1 TURBINE MAIN</h1>
            <p className="text-xs lg:text-sm text-gray-400">PLTU Paiton Unit 4 - SCADA Display</p>
            
            {/* Trip Indicator */}
            {systemState.trip && (
              <div className="mt-2 p-2 bg-red-900 border border-red-500 rounded">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-red-400 font-bold text-sm lg:text-base">
                    {systemState.shutdownTime > 0 ? `SHUTDOWN: ${systemState.shutdownTime.toFixed(1)}s` : 'TRIP!'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* System Controls - Fixed height */}
          <div className="flex justify-center gap-2 lg:gap-4 mb-2 lg:mb-4 flex-shrink-0">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStartSystem}
              disabled={systemState.isRunning}
              className={`px-4 lg:px-6 py-2 lg:py-3 rounded text-xs lg:text-sm font-semibold text-white ${
                systemState.isRunning
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              Start System
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStopSystem}
              disabled={!systemState.isRunning}
              className={`px-4 lg:px-6 py-2 lg:py-3 rounded text-xs lg:text-sm font-semibold text-white ${
                !systemState.isRunning
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              Shutdown
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleShutdownSystem}
              disabled={systemState.trip}
              className={`px-4 lg:px-6 py-2 lg:py-3 rounded text-xs lg:text-sm font-semibold text-white ${
                systemState.trip
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-yellow-600 hover:bg-yellow-700'
              }`}
            >
              Shutdown (10s)
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleResetSystem}
              className="px-4 lg:px-6 py-2 lg:py-3 rounded text-xs lg:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700"
            >
              Restart
            </motion.button>
          </div>

          {/* Control Levers Panel - Fixed height, no scroll */}
          <div className="bg-gray-900 rounded p-2 lg:p-4 mb-2 lg:mb-4 flex-shrink-0">
            <h2 className="text-sm lg:text-lg font-bold text-white mb-2 lg:mb-4 text-center">
              Control Panel
            </h2>
            
            <div className="grid grid-cols-6 gap-1 lg:gap-2">
              {levers.map((lever: ControlLeverType) => (
                <motion.div
                  key={lever.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <MemoizedControlLever
                    lever={lever}
                    onValueChange={(value) => updateLever(lever.id, value)}
                  />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Additional Indicators - Fixed height */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-2 lg:gap-4 mb-2 lg:mb-4 flex-shrink-0">
            {additionalIndicators.map((indicator) => (
              <div key={indicator.label} className="bg-gray-800 rounded p-2 lg:p-4 border border-green-500">
                <div className="text-xs lg:text-sm text-gray-400 mb-1">{indicator.label}</div>
                <div className={`text-sm lg:text-lg font-mono ${indicator.color}`}>
                  {indicator.value.toFixed(1)}{indicator.unit}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Side Panel - Fixed width */}
        <div className="w-48 lg:w-64 xl:w-80 bg-gray-900 p-2 lg:p-4 border-l border-green-500 flex-shrink-0 overflow-y-auto">
          <div className="space-y-2 lg:space-y-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Stopwatch 
                isRunning={systemState.isRunning} 
                startTime={systemState.startTime} 
              />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
            >
              <EarningsCounter 
                totalEarnings={systemState.totalEarnings}
                isRunning={systemState.isRunning}
                powerOutput={systemState.powerOutput}
              />
            </motion.div>

            {/* System Status */}
            <div className="bg-gray-800 rounded p-2 lg:p-4 border border-green-500">
              <h3 className="text-sm lg:text-lg font-semibold text-white mb-2 lg:mb-4 text-center">
                System Status
              </h3>
              
              <div className="space-y-1 lg:space-y-2 text-xs lg:text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Turbine:</span>
                  <span className={`font-semibold ${
                    systemState.turbineStatus === 'running' ? 'text-green-400' : 
                    systemState.turbineStatus === 'emergency' ? 'text-red-400' : 'text-yellow-400'
                  }`}>
                    {systemState.turbineStatus.toUpperCase()}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Generator:</span>
                  <span className={`font-semibold ${
                    systemState.generatorStatus === 'online' ? 'text-green-400' : 
                    systemState.generatorStatus === 'synchronizing' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {systemState.generatorStatus.toUpperCase()}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Condenser:</span>
                  <span className={`font-semibold ${
                    systemState.condenserStatus === 'normal' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {systemState.condenserStatus.toUpperCase()}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Heater:</span>
                  <span className={`font-semibold ${
                    systemState.heaterStatus === 'normal' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {systemState.heaterStatus.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation - Fixed height */}
      <div className="bg-gray-900 border-t border-green-500 p-2 lg:p-4 flex-shrink-0">
        <div className="flex items-center justify-between text-xs lg:text-sm">
          <div className="flex space-x-2 lg:space-x-4 overflow-x-auto">
            <button className="px-2 lg:px-4 py-1 lg:py-2 bg-green-600 text-white rounded whitespace-nowrap">#1 TURBINE</button>
            <button className="px-2 lg:px-4 py-1 lg:py-2 bg-gray-700 text-green-400 rounded whitespace-nowrap">#1 TURAGEN</button>
            <button className="px-2 lg:px-4 py-1 lg:py-2 bg-gray-700 text-green-400 rounded whitespace-nowrap">#1 LUB OIL</button>
            <button className="px-2 lg:px-4 py-1 lg:py-2 bg-gray-700 text-green-400 rounded whitespace-nowrap">#1 ETS</button>
            <button className="px-2 lg:px-4 py-1 lg:py-2 bg-gray-700 text-green-400 rounded whitespace-nowrap">#1 BOILER</button>
            <button className="px-2 lg:px-4 py-1 lg:py-2 bg-gray-700 text-green-400 rounded whitespace-nowrap">COMMON</button>
          </div>
          
          <div className="flex space-x-2 lg:space-x-4">
            <button className="px-2 lg:px-4 py-1 lg:py-2 bg-green-600 text-white rounded whitespace-nowrap">MAIN</button>
            <button className="px-2 lg:px-4 py-1 lg:py-2 bg-gray-700 text-green-400 rounded whitespace-nowrap">SYS GRAPH</button>
          </div>
        </div>
      </div>
    </div>
  );
}
