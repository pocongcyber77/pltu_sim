import { create } from 'zustand';
import { ControlLever, LeverType, SystemState } from '../types';
import { calculateSystemState, calculateEarnings } from '../utils/calculation';

// Smooth factors for different system components (0.01 - 0.2, smaller = slower)
const SMOOTH_FACTORS = {
  coal_feed: 0.05,      // Coal feed: moderate response
  feedwater: 0.08,      // Feedwater: faster response
  boiler_pressure: 0.03, // Boiler pressure: slow response (thermal inertia)
  steam_turbine: 0.04,  // Steam turbine: moderate response
  condenser: 0.06,      // Condenser: moderate response
  cooling_water: 0.10,  // Cooling water: fast response
  air_supply: 0.07,     // Air supply: moderate response
  fuel_injection: 0.15, // Fuel injection: fast response (emergency)
  steam_flow: 0.05,     // Steam flow: moderate response
  water_level: 0.02,    // Water level: very slow response
  exhaust_gas: 0.08,    // Exhaust gas: moderate response
  emergency_valve: 0.20, // Emergency valve: instant response
};

// ✅ Interpolasi Bertahap (Inersia Sistem) - Implementasi Baru
/**
 * Smooth approach function untuk simulasi inersia sistem
 * @param current - nilai aktual dalam sistem
 * @param target - nilai target dari tuas user
 * @param smoothFactor - faktor kehalusan (0.01 - 0.2, semakin kecil semakin lambat)
 * @param dt - delta time per update (detik)
 * @returns nilai baru yang mendekati target secara bertahap
 */
function smoothApproach(current: number, target: number, smoothFactor: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-smoothFactor * dt));
}

interface SimulatorStore {
  // Control levers
  levers: ControlLever[];
  
  // System state
  systemState: SystemState;
  
  // Actual system values (hasil smoothApproach)
  actualSystemValues: Record<string, number>;
  
  // Actions
  updateLever: (leverId: string, value: number) => void;
  startSystem: () => void;
  stopSystem: () => void;
  resetSystem: () => void;
  shutdownSystem: () => void;
  updateEarnings: () => void;
  updateGradualMovement: () => void;
}

const initialLevers: ControlLever[] = [
  {
    id: 'coal_feed',
    name: 'Coal Feed',
    description: 'Pasokan batu bara ke boiler',
    minValue: 0,
    maxValue: 100,
    currentValue: 0,
    targetValue: 0,
    unit: '%',
    color: 'bg-orange-500',
    responseTime: 15, // 15 seconds to reach target
    sensitivity: 0.3
  },
  {
    id: 'feedwater',
    name: 'Feedwater',
    description: 'Sirkulasi air ke boiler',
    minValue: 0,
    maxValue: 100,
    currentValue: 0,
    targetValue: 0,
    unit: '%',
    color: 'bg-blue-500',
    responseTime: 8, // 8 seconds to reach target
    sensitivity: 0.4
  },
  {
    id: 'boiler_pressure',
    name: 'Boiler Pressure',
    description: 'Tekanan boiler',
    minValue: 0,
    maxValue: 100,
    currentValue: 0,
    targetValue: 0,
    unit: '%',
    color: 'bg-red-500',
    responseTime: 20, // 20 seconds to reach target
    sensitivity: 0.2
  },
  {
    id: 'steam_turbine',
    name: 'Steam Turbine',
    description: 'Kecepatan turbin uap',
    minValue: 0,
    maxValue: 100,
    currentValue: 0,
    targetValue: 0,
    unit: '%',
    color: 'bg-green-500',
    responseTime: 12, // 12 seconds to reach target
    sensitivity: 0.35
  },
  {
    id: 'condenser',
    name: 'Condenser',
    description: 'Kondensasi uap',
    minValue: 0,
    maxValue: 100,
    currentValue: 0,
    targetValue: 0,
    unit: '%',
    color: 'bg-cyan-500',
    responseTime: 10, // 10 seconds to reach target
    sensitivity: 0.4
  },
  {
    id: 'cooling_water',
    name: 'Cooling Water',
    description: 'Air pendingin',
    minValue: 0,
    maxValue: 100,
    currentValue: 0,
    targetValue: 0,
    unit: '%',
    color: 'bg-indigo-500',
    responseTime: 6, // 6 seconds to reach target
    sensitivity: 0.5
  },
  {
    id: 'air_supply',
    name: 'Air Supply',
    description: 'Pasokan udara pembakaran',
    minValue: 0,
    maxValue: 100,
    currentValue: 0,
    targetValue: 0,
    unit: '%',
    color: 'bg-yellow-500',
    responseTime: 5, // 5 seconds to reach target
    sensitivity: 0.6
  },
  {
    id: 'fuel_injection',
    name: 'Fuel Injection',
    description: 'Injeksi bahan bakar',
    minValue: 0,
    maxValue: 100,
    currentValue: 0,
    targetValue: 0,
    unit: '%',
    color: 'bg-purple-500',
    responseTime: 8, // 8 seconds to reach target
    sensitivity: 0.4
  },
  {
    id: 'steam_flow',
    name: 'Steam Flow',
    description: 'Aliran uap ke turbin',
    minValue: 0,
    maxValue: 100,
    currentValue: 0,
    targetValue: 0,
    unit: '%',
    color: 'bg-pink-500',
    responseTime: 10, // 10 seconds to reach target
    sensitivity: 0.35
  },
  {
    id: 'water_level',
    name: 'Water Level',
    description: 'Level air dalam boiler',
    minValue: 0,
    maxValue: 100,
    currentValue: 0,
    targetValue: 0,
    unit: '%',
    color: 'bg-teal-500',
    responseTime: 25, // 25 seconds to reach target
    sensitivity: 0.15
  },
  {
    id: 'exhaust_gas',
    name: 'Exhaust Gas',
    description: 'Gas buang',
    minValue: 0,
    maxValue: 100,
    currentValue: 0,
    targetValue: 0,
    unit: '%',
    color: 'bg-gray-500',
    responseTime: 8, // 8 seconds to reach target
    sensitivity: 0.4
  },
  {
    id: 'emergency_valve',
    name: 'Emergency Valve',
    description: 'Katup darurat',
    minValue: 0,
    maxValue: 100,
    currentValue: 0,
    targetValue: 0,
    unit: '%',
    color: 'bg-red-600',
    responseTime: 2, // 2 seconds to reach target (emergency)
    sensitivity: 0.8
  }
];

const initialSystemState: SystemState = {
  // Main indicators (top panel)
  mainSteamFlow: 0,
  mainSteamPressure: 0,
  mainSteamTemp: 0,
  turbineSpeed: 0,
  condensateWaterFlow: 0,
  oilTankLevel: 0,
  load: 0,
  frequency: 0,
  
  // Basic indicators
  temperature: 0,
  pressure: 0,
  turbineRPM: 0,
  powerOutput: 0,
  
  // Additional SCADA indicators
  steamOutTurbineTemp: 0,
  surgeTankTemp: 0,
  condenserOutTemp: 0,
  coolingWaterTemp: 0,
  condenserPressure: 0,
  feedwaterTemp: 0,
  feedwaterPressure: 0,
  heater1Temp: 0,
  heater2Temp: 0,
  heater3Temp: 0,
  heater4Temp: 0,
  generatorTemp: 0,
  oilCoolerTemp: 0,
  circulatingWaterFlow: 0,
  generatorAirCoolerTemp: 0,
  
  // New real-time indicators
  totalWattageProduced: 0,
  coalLoadingRate: 0,
  combustionSpeed: 0,
  waterLoadingRate: 0,
  waterBoilingRate: 0,
  steamGenerationRate: 0,
  fuelConsumptionRate: 0,
  efficiency: 0,
  emissionsRate: 0,
  heatRate: 0,
  
  // System state tracking for realistic delays
  targetMainSteamFlow: 0,
  targetMainSteamPressure: 16.5,
  targetMainSteamTemp: 540,
  targetTurbineSpeed: 0,
  targetLoad: 0,
  
  // Previous values for interpolation
  previousMainSteamFlow: 0,
  previousMainSteamPressure: 16.5,
  previousMainSteamTemp: 540,
  previousTurbineSpeed: 0,
  previousLoad: 0,
  
  // System time tracking
  lastUpdateTime: Date.now(),
  
  // System status
  isRunning: false,
  startTime: null,
  totalEarnings: 0,
  
  // Trip and shutdown system
  trip: false,
  shutdownTime: 0,
  
  // Additional status indicators
  turbineStatus: 'stopped',
  generatorStatus: 'offline',
  condenserStatus: 'normal',
  heaterStatus: 'normal'
};

// Debounce function to prevent excessive updates
let updateTimeout: NodeJS.Timeout | null = null;
let gradualUpdateInterval: NodeJS.Timeout | null = null;

export const useSimulatorStore = create<SimulatorStore>((set, get) => ({
  levers: initialLevers,
  systemState: initialSystemState,
  actualSystemValues: {}, // Initialize actualSystemValues

  updateLever: (leverId: string, value: number) => {
    // Update lever value immediately for responsive UI
    set((state) => {
      const updatedLevers = state.levers.map(lever => 
        lever.id === leverId 
          ? { 
              ...lever, 
              currentValue: Math.max(lever.minValue, Math.min(lever.maxValue, value)),
              targetValue: Math.max(lever.minValue, Math.min(lever.maxValue, value))
            }
          : lever
      );

      return { levers: updatedLevers };
    });

    // Debounce the expensive calculation
    if (updateTimeout) {
      clearTimeout(updateTimeout);
    }

    updateTimeout = setTimeout(() => {
      const state = get();
      const leverValues = state.levers.reduce((acc, lever) => {
        acc[lever.id as LeverType] = lever.currentValue;
        return acc;
      }, {} as Record<LeverType, number>);

      // Calculate new system state with realistic delays
      const currentTime = Date.now();
      const lastUpdateTime = state.systemState.lastUpdateTime || currentTime;
      const deltaTime = (currentTime - lastUpdateTime) / 1000; // Convert to seconds
      
      const newSystemState = calculateSystemState(leverValues, state.systemState, deltaTime);

      // Calculate earnings and total wattage
      const durationSeconds = state.systemState.startTime ? (Date.now() - state.systemState.startTime) / 1000 : 0;
      const earnings = calculateEarnings(newSystemState.powerOutput || 0, durationSeconds);
      const totalWattageProduced = (newSystemState.powerOutput || 0) * 1000 * durationSeconds / 3600 * 1000; // Convert to Watt-hours

      // Determine system status based on indicators
      const turbineStatus = (newSystemState.turbineSpeed || 0) > 0 ? 'running' : 'stopped';
      const generatorStatus = (newSystemState.load || 0) > 0 ? 'online' : 'offline';
      const condenserStatus = (newSystemState.condenserOutTemp || 0) > 70 ? 'high_temp' : 'normal';
      const heaterStatus = (newSystemState.heater1Temp || 0) > 200 ? 'high_temp' : 'normal';

      set((state) => ({
        systemState: {
          ...state.systemState,
          ...newSystemState,
          totalEarnings: earnings,
          totalWattageProduced,
          lastUpdateTime: currentTime,
          turbineStatus,
          generatorStatus,
          condenserStatus,
          heaterStatus
        }
      }));
    }, 200); // 200ms debounce
  },

  startSystem: () => {
    set((state) => ({
      systemState: {
        ...state.systemState,
        isRunning: true,
        startTime: state.systemState.startTime || Date.now()
      }
    }));
  },

  stopSystem: () => {
    set((state) => ({
      systemState: {
        ...state.systemState,
        isRunning: false
      }
    }));
  },

  resetSystem: () => {
    if (updateTimeout) {
      clearTimeout(updateTimeout);
    }
    if (gradualUpdateInterval) {
      clearInterval(gradualUpdateInterval);
      gradualUpdateInterval = null;
    }
    set({
      levers: initialLevers,
      systemState: {
        ...initialSystemState,
        trip: false,
        shutdownTime: 0
      },
      actualSystemValues: {} // Reset actualSystemValues
    });
  },

  shutdownSystem: () => {
    set((state) => ({
      systemState: {
        ...state.systemState,
        shutdownTime: 10, // 10 second shutdown
        trip: true
      }
    }));
  },

  updateEarnings: () => {
    set((state) => {
      if (!state.systemState.isRunning || !state.systemState.startTime) {
        return state;
      }

      const currentTime = Date.now();
      const durationSeconds = (currentTime - state.systemState.startTime) / 1000;
      const newEarnings = calculateEarnings(state.systemState.powerOutput, durationSeconds);

      return {
        systemState: {
          ...state.systemState,
          totalEarnings: newEarnings
        }
      };
    });
  },

  updateGradualMovement: () => {
    // This function is called periodically to update gradual movements
    const state = get();
    let hasChanges = false;
    
    const updatedLevers = state.levers.map(lever => {
      if (Math.abs(lever.currentValue - lever.targetValue) > 0.1) {
        hasChanges = true;
        const smoothFactor = SMOOTH_FACTORS[lever.id as LeverType] || 0.05; // Default to 0.05 if not found
        const currentActualValue = state.actualSystemValues[lever.id] || lever.currentValue;
        const newActualValue = smoothApproach(currentActualValue, lever.targetValue, smoothFactor, 0.1); // Update every 100ms

        set((state) => ({
          actualSystemValues: {
            ...state.actualSystemValues,
            [lever.id]: newActualValue
          }
        }));

        return {
          ...lever,
          currentValue: newActualValue // Update lever's currentValue to the smoothed value
        };
      }
      return lever;
    });

    if (hasChanges) {
      set({ levers: updatedLevers });
    }
  }
})); 