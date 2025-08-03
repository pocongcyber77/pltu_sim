import { LeverType, CalculationParams } from '@/types';

// Base calculation functions
export function calculatePower(temp: number, pressure: number, rpm: number): number {
  // Power = (Temperature * Pressure * RPM) / 1,000,000 (result in MWatt)
  const basePower = (temp * pressure * rpm) / 1_000_000;
  return Math.min(Math.max(basePower, 0), 500); // Cap at 500 MWatt
}

export function calculateTemperature(leverValues: Record<LeverType, number>): number {
  // Temperature influenced by coal feed, fuel injection, and air supply
  const coalFeed = leverValues.coal_feed || 0;
  const fuelInjection = leverValues.fuel_injection || 0;
  const airSupply = leverValues.air_supply || 0;
  
  // Base temperature calculation
  let temp = 200 + (coalFeed * 8) + (fuelInjection * 6) + (airSupply * 4);
  
  // Cooling effect from feedwater and cooling water
  const feedwater = leverValues.feedwater || 0;
  const coolingWater = leverValues.cooling_water || 0;
  temp -= (feedwater * 2) + (coolingWater * 3);
  
  return Math.min(Math.max(temp, 0), 1200); // Cap between 0-1200°C
}

export function calculatePressure(leverValues: Record<LeverType, number>): number {
  // Pressure influenced by boiler pressure, steam flow, and emergency valve
  const boilerPressure = leverValues.boiler_pressure || 0;
  const steamFlow = leverValues.steam_flow || 0;
  const emergencyValve = leverValues.emergency_valve || 0;
  
  let pressure = 20 + (boilerPressure * 10) + (steamFlow * 8);
  
  // Emergency valve reduces pressure
  pressure -= emergencyValve * 15;
  
  return Math.min(Math.max(pressure, 0), 150); // Cap between 0-150 bar
}

export function calculateTurbineRPM(leverValues: Record<LeverType, number>): number {
  // RPM influenced by steam turbine, steam flow, and condenser
  const steamTurbine = leverValues.steam_turbine || 0;
  const steamFlow = leverValues.steam_flow || 0;
  const condenser = leverValues.condenser || 0;
  
  let rpm = 500 + (steamTurbine * 200) + (steamFlow * 150);
  
  // Condenser affects efficiency
  rpm *= (1 + condenser * 0.1);
  
  return Math.min(Math.max(rpm, 0), 3500); // Cap between 0-3500 RPM
}

export function calculateEarnings(powerMW: number, durationSeconds: number): number {
  // 1 KWatt = Rp1, so 1 MWatt = Rp1,000,000 per hour
  // Convert duration to hours and calculate earnings
  const durationHours = durationSeconds / 3600;
  const earningsPerHour = powerMW * 1_000_000;
  return earningsPerHour * durationHours;
}

export function calculateSystemState(leverValues: Record<LeverType, number>): {
  temperature: number;
  pressure: number;
  turbineRPM: number;
  powerOutput: number;
} {
  const temperature = calculateTemperature(leverValues);
  const pressure = calculatePressure(leverValues);
  const turbineRPM = calculateTurbineRPM(leverValues);
  const powerOutput = calculatePower(temperature, pressure, turbineRPM);
  
  return {
    temperature,
    pressure,
    turbineRPM,
    powerOutput
  };
}

// Utility function to format numbers
export function formatNumber(num: number, decimals: number = 1): string {
  return num.toFixed(decimals);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
} 