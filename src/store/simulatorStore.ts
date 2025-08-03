import { create } from 'zustand';
import { ControlLever, LeverType, SystemState } from '@/types';
import { calculateSystemState, calculateEarnings } from '@/utils/calculation';

interface SimulatorStore {
  // Control levers
  levers: ControlLever[];
  
  // System state
  systemState: SystemState;
  
  // Actions
  updateLever: (leverId: string, value: number) => void;
  startSystem: () => void;
  stopSystem: () => void;
  resetSystem: () => void;
  updateEarnings: () => void;
}

const initialLevers: ControlLever[] = [
  {
    id: 'coal_feed',
    name: 'Coal Feed',
    description: 'Pasokan batu bara ke boiler',
    minValue: 0,
    maxValue: 100,
    currentValue: 0,
    unit: '%',
    color: 'bg-orange-500'
  },
  {
    id: 'feedwater',
    name: 'Feedwater',
    description: 'Sirkulasi air ke boiler',
    minValue: 0,
    maxValue: 100,
    currentValue: 0,
    unit: '%',
    color: 'bg-blue-500'
  },
  {
    id: 'boiler_pressure',
    name: 'Boiler Pressure',
    description: 'Tekanan boiler',
    minValue: 0,
    maxValue: 100,
    currentValue: 0,
    unit: '%',
    color: 'bg-red-500'
  },
  {
    id: 'steam_turbine',
    name: 'Steam Turbine',
    description: 'Kecepatan turbin uap',
    minValue: 0,
    maxValue: 100,
    currentValue: 0,
    unit: '%',
    color: 'bg-green-500'
  },
  {
    id: 'condenser',
    name: 'Condenser',
    description: 'Kondensasi uap',
    minValue: 0,
    maxValue: 100,
    currentValue: 0,
    unit: '%',
    color: 'bg-cyan-500'
  },
  {
    id: 'cooling_water',
    name: 'Cooling Water',
    description: 'Air pendingin',
    minValue: 0,
    maxValue: 100,
    currentValue: 0,
    unit: '%',
    color: 'bg-indigo-500'
  },
  {
    id: 'air_supply',
    name: 'Air Supply',
    description: 'Pasokan udara pembakaran',
    minValue: 0,
    maxValue: 100,
    currentValue: 0,
    unit: '%',
    color: 'bg-yellow-500'
  },
  {
    id: 'fuel_injection',
    name: 'Fuel Injection',
    description: 'Injeksi bahan bakar',
    minValue: 0,
    maxValue: 100,
    currentValue: 0,
    unit: '%',
    color: 'bg-purple-500'
  },
  {
    id: 'steam_flow',
    name: 'Steam Flow',
    description: 'Aliran uap ke turbin',
    minValue: 0,
    maxValue: 100,
    currentValue: 0,
    unit: '%',
    color: 'bg-pink-500'
  },
  {
    id: 'water_level',
    name: 'Water Level',
    description: 'Level air dalam boiler',
    minValue: 0,
    maxValue: 100,
    currentValue: 0,
    unit: '%',
    color: 'bg-teal-500'
  },
  {
    id: 'exhaust_gas',
    name: 'Exhaust Gas',
    description: 'Gas buang',
    minValue: 0,
    maxValue: 100,
    currentValue: 0,
    unit: '%',
    color: 'bg-gray-500'
  },
  {
    id: 'emergency_valve',
    name: 'Emergency Valve',
    description: 'Katup darurat',
    minValue: 0,
    maxValue: 100,
    currentValue: 0,
    unit: '%',
    color: 'bg-red-600'
  }
];

const initialSystemState: SystemState = {
  temperature: 0,
  pressure: 0,
  turbineRPM: 0,
  powerOutput: 0,
  isRunning: false,
  startTime: null,
  totalEarnings: 0
};

export const useSimulatorStore = create<SimulatorStore>((set, get) => ({
  levers: initialLevers,
  systemState: initialSystemState,

  updateLever: (leverId: string, value: number) => {
    set((state) => {
      const updatedLevers = state.levers.map(lever => 
        lever.id === leverId 
          ? { ...lever, currentValue: Math.max(lever.minValue, Math.min(lever.maxValue, value)) }
          : lever
      );

      // Convert levers to lever values for calculation
      const leverValues = updatedLevers.reduce((acc, lever) => {
        acc[lever.id as LeverType] = lever.currentValue;
        return acc;
      }, {} as Record<LeverType, number>);

      // Calculate new system state
      const newSystemState = calculateSystemState(leverValues);

      return {
        levers: updatedLevers,
        systemState: {
          ...state.systemState,
          ...newSystemState
        }
      };
    });
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
    set({
      levers: initialLevers,
      systemState: initialSystemState
    });
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
  }
})); 