export interface ControlLever {
  id: string;
  name: string;
  description: string;
  minValue: number;
  maxValue: number;
  currentValue: number;
  targetValue: number; // Target value for gradual movement
  unit: string;
  color: string;
  responseTime: number; // Response time in seconds
  sensitivity: number; // Sensitivity factor (0-1)
}

export interface SystemState {
  // Main indicators (top panel)
  mainSteamFlow: number; // T/h
  mainSteamPressure: number; // MPa
  mainSteamTemp: number; // °C
  turbineSpeed: number; // rpm
  condensateWaterFlow: number; // T/h
  oilTankLevel: number; // m
  load: number; // MW
  frequency: number; // Hz
  
  // System state tracking for realistic delays
  targetMainSteamFlow: number; // Target values for gradual changes
  targetMainSteamPressure: number;
  targetMainSteamTemp: number;
  targetTurbineSpeed: number;
  targetLoad: number;
  
  // Previous values for interpolation
  previousMainSteamFlow: number;
  previousMainSteamPressure: number;
  previousMainSteamTemp: number;
  previousTurbineSpeed: number;
  previousLoad: number;
  
  // System time tracking
  lastUpdateTime: number; // Timestamp of last calculation
  
  // Basic indicators
  temperature: number; // °C
  pressure: number; // bar
  turbineRPM: number; // RPM
  powerOutput: number; // MWatt
  
  // Additional SCADA indicators
  steamOutTurbineTemp: number; // °C
  surgeTankTemp: number; // °C
  condenserOutTemp: number; // °C
  coolingWaterTemp: number; // °C
  condenserPressure: number; // MPa
  feedwaterTemp: number; // °C
  feedwaterPressure: number; // MPa
  heater1Temp: number; // °C
  heater2Temp: number; // °C
  heater3Temp: number; // °C
  heater4Temp: number; // °C
  generatorTemp: number; // °C
  oilCoolerTemp: number; // °C
  circulatingWaterFlow: number; // m³/h
  generatorAirCoolerTemp: number; // °C
  
  // New realtime indicators
  totalWattageProduced: number; // Total wattage from start
  coalLoadingRate: number; // Coal loading to combustion (kg/h)
  combustionSpeed: number; // Combustion speed (kg/h)
  waterLoadingRate: number; // Water loading to tank (m³/h)
  waterBoilingRate: number; // Water boiling rate (kg/h)
  steamGenerationRate: number; // Steam generation (kg/h)
  fuelConsumptionRate: number; // Fuel consumption (kg/h)
  efficiency: number; // Overall plant efficiency (%)
  emissionsRate: number; // CO2 emissions (kg/h)
  heatRate: number; // Heat rate (kJ/kWh)
  
  // System status
  isRunning: boolean;
  startTime: number | null;
  totalEarnings: number; // Rupiah
  
  // Trip and shutdown system (like Pygame)
  trip: boolean;
  shutdownTime: number;
  
  // Additional status indicators
  turbineStatus: 'running' | 'stopped' | 'emergency';
  generatorStatus: 'online' | 'offline' | 'synchronizing';
  condenserStatus: 'normal' | 'high_temp' | 'low_pressure';
  heaterStatus: 'normal' | 'high_temp' | 'low_flow';
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

export interface HeaderIndicator {
  label: string;
  value: number;
  unit: string;
  color: string;
  status: 'normal' | 'warning' | 'critical';
} 