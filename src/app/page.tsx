'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import ControlLever from '@/components/ControlLever';
import IndicatorPanel from '@/components/IndicatorPanel';
import Stopwatch from '@/components/Stopwatch';
import EarningsCounter from '@/components/EarningsCounter';
import { useSimulatorStore } from '@/store/simulatorStore';

export default function PLTUSimulator() {
  const { 
    levers, 
    systemState, 
    updateLever, 
    startSystem, 
    stopSystem, 
    resetSystem, 
    updateEarnings 
  } = useSimulatorStore();

  // Update earnings every second when system is running
  useEffect(() => {
    const interval = setInterval(() => {
      if (systemState.isRunning) {
        updateEarnings();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [systemState.isRunning, updateEarnings]);

  const handleLeverChange = (leverId: string, value: number) => {
    updateLever(leverId, value);
  };

  const handleStartSystem = () => {
    startSystem();
  };

  const handleStopSystem = () => {
    stopSystem();
  };

  const handleResetSystem = () => {
    resetSystem();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            PLTU Simulator
          </h1>
          <p className="text-xl text-gray-600">
            Pembangkit Listrik Tenaga Uap Paiton Unit 4
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Simulator Interaktif untuk Pelatihan Operator PLTU
          </p>
        </motion.div>

        {/* Control Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-lg p-6 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Panel Kontrol
          </h2>
          
          {/* Control Levers Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {levers.map((lever, index) => (
              <motion.div
                key={lever.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <ControlLever
                  lever={lever}
                  onValueChange={(value) => handleLeverChange(lever.id, value)}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* System Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center gap-4 mb-8"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStartSystem}
            disabled={systemState.isRunning}
            className={`px-8 py-3 rounded-lg font-semibold text-white ${
              systemState.isRunning
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            Start System
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStopSystem}
            disabled={!systemState.isRunning}
            className={`px-8 py-3 rounded-lg font-semibold text-white ${
              !systemState.isRunning
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            Shutdown
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleResetSystem}
            className="px-8 py-3 rounded-lg font-semibold text-white bg-blue-500 hover:bg-blue-600"
          >
            Restart
          </motion.button>
        </motion.div>

        {/* Indicators Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Indicator Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="lg:col-span-2"
          >
            <IndicatorPanel systemState={systemState} />
          </motion.div>

          {/* Side Panels */}
          <div className="space-y-6">
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
          </div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center mt-8 text-gray-600"
        >
          <p className="text-sm">
            © 2024 PLTU Simulator - Dibuat untuk Pelatihan Operator dan Edukasi Teknik
          </p>
        </motion.div>
      </div>
    </div>
  );
} 