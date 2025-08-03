export interface ControlLever {
  id: string;
  name: string;
  description: string;
  minValue: number;
  maxValue: number;
  currentValue: number;
  unit: string;
  color: string;
}

export interface SystemState {
  temperature: number; // °C
  pressure: number; // bar
  turbineRPM: number; // RPM
  powerOutput: number; // MWatt
  isRunning: boolean;
  startTime: number | null;
  totalEarnings: number; // Rupiah
}

export interface IndicatorPanel {
  temperature: number;
  pressure: number;
  turbineRPM: number;
  powerOutput: number;
  stopwatch: number; // seconds
  earnings: number;
}

export type LeverType = 
  | 'coal_feed'
  | 'feedwater'
  | 'boiler_pressure'
  | 'steam_turbine'
  | 'condenser'
  | 'cooling_water'
  | 'air_supply'
  | 'fuel_injection'
  | 'steam_flow'
  | 'water_level'
  | 'exhaust_gas'
  | 'emergency_valve';

export interface CalculationParams {
  temperature: number;
  pressure: number;
  turbineRPM: number;
  leverValues: Record<LeverType, number>;
} 