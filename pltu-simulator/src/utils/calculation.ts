import { LeverType, SystemState } from '../types';

// Steam power plant specific constants
const BOILER_EFFICIENCY_BASE = 0.85;
const TURBINE_EFFICIENCY_BASE = 0.88;
const GENERATOR_EFFICIENCY = 0.98;
const CONDENSER_PRESSURE_BASE = 5.0; // kPa
const STEAM_TEMP_BASE = 540; // °C
const STEAM_PRESSURE_BASE = 16.5; // MPa
const COAL_CALORIFIC_VALUE = 25000; // kJ/kg

// Smooth factors for different system components (0.01 - 0.2, smaller = slower)
const SMOOTH_FACTORS = {
  coalFeed: 0.05,      // Coal feed: moderate response
  feedwater: 0.08,     // Feedwater: faster response
  boilerPressure: 0.03, // Boiler pressure: slow response (thermal inertia)
  steamTurbine: 0.04,  // Steam turbine: moderate response
  condenser: 0.06,     // Condenser: moderate response
  coolingWater: 0.10,  // Cooling water: fast response
  airSupply: 0.07,     // Air supply: moderate response
  fuelInjection: 0.15, // Fuel injection: fast response (emergency)
  steamFlow: 0.05,     // Steam flow: moderate response
  waterLevel: 0.02,    // Water level: very slow response
  exhaustGas: 0.08,    // Exhaust gas: moderate response
  emergencyValve: 0.20, // Emergency valve: instant response
  steamTemp: 0.04,     // Steam temperature: slow response
  rpm: 0.03,           // RPM: slow response (mechanical inertia)
  pressure: 0.05,      // Pressure: moderate response
  temperature: 0.04    // Temperature: slow response
};

interface CalculationParams {
  coalFeed: number;
  feedwater: number;
  boilerPressure: number;
  steamTurbine: number;
  condenser: number;
  coolingWater: number;
  airSupply: number;
  fuelInjection: number;
  steamFlow: number;
  waterLevel: number;
  exhaustGas: number;
  emergencyValve: number;
  // Additional calculated properties
  mainSteamPressure?: number;
  mainSteamTemp?: number;
  turbineSpeed?: number;
  generatorTemp?: number;
  heater1Temp?: number;
  heater2Temp?: number;
  heater3Temp?: number;
  heater4Temp?: number;
  condenserOutTemp?: number;
  load?: number;
}

interface SystemResponse {
  mainSteamFlow?: number;
  mainSteamTemp?: number;
  mainSteamPressure?: number;
  targetMainSteamFlow?: number;
  targetMainSteamTemp?: number;
  targetMainSteamPressure?: number;
  turbineSpeed?: number;
  load?: number;
  targetTurbineSpeed?: number;
  targetLoad?: number;
  condensateWaterFlow?: number;
  circulatingWaterFlow?: number;
  waterLevel?: number;
}

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

// Thermodynamic calculations
function calculateSteamProperties(temperature: number, pressure: number) {
  // Simplified steam table calculations
  const saturationTemp = 374.15 + (pressure - 22.064) * 0.1; // °C
  const isSuperheated = temperature > saturationTemp;
  
  if (isSuperheated) {
    // Superheated steam
    const specificVolume = 0.4615 * (temperature + 273.15) / (pressure * 1000);
    const specificEnthalpy = 2.0 * temperature + 2500; // kJ/kg
    const specificEntropy = 6.0 + 2.0 * Math.log((temperature + 273.15) / 373.15);
    return { specificVolume, specificEnthalpy, specificEntropy, isSuperheated };
  } else {
    // Saturated steam
    const quality = Math.min(1, Math.max(0, (temperature - (saturationTemp - 50)) / 50));
    const specificVolume = 0.001 + quality * (1.673 - 0.001);
    const specificEnthalpy = 419 + quality * (2676 - 419);
    const specificEntropy = 1.307 + quality * (7.355 - 1.307);
    return { specificVolume, specificEnthalpy, specificEntropy, isSuperheated, quality };
  }
}

function calculateBoilerEfficiency(params: CalculationParams): number {
  const { coalFeed, airSupply, waterLevel } = params;
  
  // Air-fuel ratio affects combustion efficiency
  const airFuelRatio = airSupply / Math.max(coalFeed, 1);
  const optimalRatio = 15.5; // Stoichiometric ratio for coal
  const ratioEfficiency = Math.max(0.7, 1 - Math.abs(airFuelRatio - optimalRatio) / optimalRatio);
  
  // Water level affects heat transfer
  const levelEfficiency = Math.min(1, waterLevel / 50);
  
  // Coal feed rate affects efficiency
  const feedEfficiency = Math.min(1, coalFeed / 80);
  
  return BOILER_EFFICIENCY_BASE * ratioEfficiency * levelEfficiency * feedEfficiency;
}

function calculateSteamGeneration(params: CalculationParams): number {
  const { coalFeed, feedwater, airSupply } = params;
  
  // Calculate heat input from coal
  const coalEnergy = coalFeed * COAL_CALORIFIC_VALUE; // kJ/h
  
  // Calculate combustion efficiency
  const combustionEfficiency = calculateBoilerEfficiency(params);
  
  // Calculate steam generation
  const heatToSteam = coalEnergy * combustionEfficiency;
  const steamGeneration = heatToSteam / 2257; // kJ/kg latent heat
  
  return steamGeneration; // kg/h
}

function calculateElectricalPower(mechanicalPower: number, generatorEfficiency: number): number {
  return mechanicalPower * generatorEfficiency;
}

function calculateFrequency(load: number, baseLoad: number = 600): number {
  // Grid frequency depends on load balance
  const loadRatio = load / baseLoad;
  const frequencyDeviation = (loadRatio - 1) * 0.5; // ±0.5 Hz variation
  return 50 + frequencyDeviation; // Base frequency 50 Hz
}

function calculateMainSteamFlow(params: CalculationParams): number {
  const { coalFeed, feedwater, steamFlow } = params;
  const steamGeneration = calculateSteamGeneration(params);
  const flowEfficiency = steamFlow / 100;
  
  return steamGeneration * flowEfficiency * 3600; // Convert to t/h
}

function calculateMainSteamPressure(params: CalculationParams): number {
  const { boilerPressure, steamFlow, emergencyValve } = params;
  
  // Base pressure from boiler
  let pressure = STEAM_PRESSURE_BASE * (boilerPressure / 100);
  
  // Steam flow affects pressure
  const flowEffect = 1 + (steamFlow - 50) / 100;
  pressure *= flowEffect;
  
  // Emergency valve reduces pressure
  const valveEffect = 1 - (emergencyValve / 100) * 0.3;
  pressure *= valveEffect;
  
  return Math.max(0.1, pressure);
}

function calculateMainSteamTemp(params: CalculationParams): number {
  const { coalFeed, airSupply, boilerPressure } = params;
  
  // Base temperature
  let temperature = STEAM_TEMP_BASE;
  
  // Coal feed affects temperature
  const coalEffect = 1 + (coalFeed - 50) / 100;
  temperature *= coalEffect;
  
  // Air supply affects combustion temperature
  const airEffect = 1 + (airSupply - 50) / 200;
  temperature *= airEffect;
  
  // Pressure affects saturation temperature
  const pressureEffect = 1 + (boilerPressure - 50) / 100;
  temperature *= pressureEffect;
  
  return Math.max(200, Math.min(600, temperature));
}

function calculateTurbineSpeed(params: CalculationParams): number {
  const { steamTurbine, steamFlow, mainSteamPressure = STEAM_PRESSURE_BASE } = params;
  
  // Base speed
  let speed = 3000; // rpm
  
  // Steam turbine control affects speed
  const turbineEffect = steamTurbine / 100;
  speed *= (0.8 + turbineEffect * 0.4);
  
  // Steam flow affects speed
  const flowEffect = steamFlow / 100;
  speed *= (0.9 + flowEffect * 0.2);
  
  // Pressure affects speed
  const pressureEffect = mainSteamPressure / STEAM_PRESSURE_BASE;
  speed *= Math.min(1.1, Math.max(0.9, pressureEffect));
  
  return Math.max(0, Math.min(3600, speed));
}

function calculateCondensateWaterFlow(params: CalculationParams): number {
  const { steamFlow, condenser } = params;
  
  // Condensate flow is proportional to steam flow
  const condensateRatio = condenser / 100;
  const condensateFlow = steamFlow * condensateRatio;
  
  return Math.max(0, condensateFlow);
}

function calculateOilTankLevel(params: CalculationParams): number {
  // Oil tank level is relatively stable
  const baseLevel = 80; // %
  const variation = Math.sin(Date.now() / 10000) * 5; // ±5% variation
  
  return Math.max(60, Math.min(95, baseLevel + variation));
}

function calculateLoad(params: CalculationParams): number {
  const { steamTurbine, steamFlow, mainSteamTemp = STEAM_TEMP_BASE, mainSteamPressure = STEAM_PRESSURE_BASE } = params;
  
  // Calculate mechanical power from steam
  const steamPower = steamFlow * (mainSteamTemp - 40) * mainSteamPressure / 1000; // MW
  
  // Turbine efficiency affects load
  const turbineEfficiency = TURBINE_EFFICIENCY_BASE * (steamTurbine / 100);
  
  // Generator efficiency
  const electricalPower = steamPower * turbineEfficiency * GENERATOR_EFFICIENCY;
  
  return Math.max(0, Math.min(600, electricalPower));
}

function calculateFrequencyFromLoad(load: number): number {
  return calculateFrequency(load);
}

function calculateSteamOutTurbineTemp(params: CalculationParams): number {
  const { mainSteamTemp = STEAM_TEMP_BASE, turbineSpeed = 0 } = params;
  
  // Steam temperature drops through turbine
  const tempDrop = (turbineSpeed / 3000) * 200; // Up to 200°C drop
  const outletTemp = mainSteamTemp - tempDrop;
  
  return Math.max(40, outletTemp);
}

function calculateSurgeTankTemp(params: CalculationParams): number {
  const { mainSteamTemp = STEAM_TEMP_BASE, steamFlow } = params;
  
  // Surge tank temperature is slightly lower than main steam
  const tempDrop = (steamFlow / 100) * 20; // Up to 20°C drop
  const surgeTemp = mainSteamTemp - tempDrop;
  
  return Math.max(200, surgeTemp);
}

function calculateCondenserOutTemp(params: CalculationParams): number {
  const { condenser, coolingWater } = params;
  
  // Condenser outlet temperature depends on cooling water
  const baseTemp = 40; // °C
  const coolingEffect = (coolingWater / 100) * 20; // Up to 20°C cooling
  const outletTemp = baseTemp - coolingEffect;
  
  return Math.max(20, outletTemp);
}

function calculateCoolingWaterTemp(params: CalculationParams): number {
  const { condenserOutTemp = 40 } = params;
  
  // Cooling water temperature is slightly higher than condenser outlet
  const waterTemp = condenserOutTemp + 5;
  
  return Math.max(25, waterTemp);
}

function calculateCondenserPressure(params: CalculationParams): number {
  const { condenser, coolingWater } = params;
  
  // Condenser pressure depends on cooling effectiveness
  const basePressure = CONDENSER_PRESSURE_BASE;
  const coolingEffect = (coolingWater / 100) * 2; // Up to 2 kPa reduction
  const pressure = basePressure - coolingEffect;
  
  return Math.max(1, pressure);
}

function calculateFeedwaterTemp(params: CalculationParams): number {
  const { feedwater, mainSteamTemp } = params;
  
  // Feedwater temperature depends on feedwater flow and steam temperature
  const baseTemp = 150; // °C
  const steamEffect = (mainSteamTemp / STEAM_TEMP_BASE) * 50; // Up to 50°C increase
  const feedwaterTemp = baseTemp + steamEffect;
  
  return Math.max(50, Math.min(250, feedwaterTemp));
}

function calculateFeedwaterPressure(params: CalculationParams): number {
  const { mainSteamPressure, feedwater } = params;
  
  // Feedwater pressure is proportional to main steam pressure
  const pressureRatio = feedwater / 100;
  const feedwaterPressure = mainSteamPressure * pressureRatio * 1.2; // 20% higher
  
  return Math.max(0.1, feedwaterPressure);
}

function calculateHeaterTemps(params: CalculationParams): { h1: number; h2: number; h3: number; h4: number } {
  const { mainSteamTemp } = params;
  
  // Heater temperatures are fractions of main steam temperature
  const h1 = mainSteamTemp * 0.9;
  const h2 = mainSteamTemp * 0.7;
  const h3 = mainSteamTemp * 0.5;
  const h4 = mainSteamTemp * 0.3;
  
  return { h1, h2, h3, h4 };
}

function calculateGeneratorTemp(params: CalculationParams): number {
  const { load } = params;
  
  // Generator temperature depends on load
  const baseTemp = 60; // °C
  const loadEffect = (load / 600) * 40; // Up to 40°C increase at full load
  const generatorTemp = baseTemp + loadEffect;
  
  return Math.max(40, Math.min(100, generatorTemp));
}

function calculateOilCoolerTemp(params: CalculationParams): number {
  const { turbineSpeed } = params;
  
  // Oil cooler temperature depends on turbine speed
  const baseTemp = 45; // °C
  const speedEffect = (turbineSpeed / 3000) * 15; // Up to 15°C increase
  const oilTemp = baseTemp + speedEffect;
  
  return Math.max(35, Math.min(70, oilTemp));
}

function calculateCirculatingWaterFlow(params: CalculationParams): number {
  const { coolingWater, load } = params;
  
  // Circulating water flow depends on cooling water and load
  const baseFlow = 1000; // m³/h
  const coolingEffect = (coolingWater / 100) * 500; // Up to 500 m³/h increase
  const loadEffect = (load / 600) * 300; // Up to 300 m³/h increase at full load
  const totalFlow = baseFlow + coolingEffect + loadEffect;
  
  return Math.max(500, totalFlow);
}

function calculateGeneratorAirCoolerTemp(params: CalculationParams): number {
  const { generatorTemp } = params;
  
  // Air cooler temperature is lower than generator temperature
  const airTemp = generatorTemp - 10;
  
  return Math.max(30, airTemp);
}

function calculateTotalWattageProduced(powerOutput: number, durationSeconds: number): number {
  return powerOutput * durationSeconds / 3600; // MWh
}

function calculateCoalLoadingRate(params: CalculationParams): number {
  const { coalFeed } = params;
  return coalFeed * 10; // t/h
}

function calculateCombustionSpeed(params: CalculationParams): number {
  const { coalFeed, airSupply } = params;
  
  // Combustion speed depends on coal feed and air supply
  const baseSpeed = 50; // %
  const coalEffect = (coalFeed / 100) * 30;
  const airEffect = (airSupply / 100) * 20;
  const combustionSpeed = baseSpeed + coalEffect + airEffect;
  
  return Math.max(0, Math.min(100, combustionSpeed));
}

function calculateWaterLoadingRate(params: CalculationParams): number {
  const { feedwater } = params;
  return feedwater * 5; // t/h
}

function calculateWaterBoilingRate(params: CalculationParams): number {
  const { coalFeed, feedwater } = params;
  
  // Water boiling rate depends on heat input and water availability
  const heatInput = coalFeed * COAL_CALORIFIC_VALUE;
  const waterAvailable = feedwater * 1000; // kg/h
  const boilingRate = Math.min(heatInput / 2257, waterAvailable); // kg/h
  
  return Math.max(0, boilingRate);
}

function calculateSteamGenerationRate(params: CalculationParams): number {
  return calculateSteamGeneration(params);
}

function calculateFuelConsumptionRate(params: CalculationParams): number {
  const { coalFeed } = params;
  return coalFeed * 0.1; // t/h
}

function calculateEfficiency(params: CalculationParams): number {
  const { coalFeed, load } = params;
  
  // Calculate efficiency as electrical output / heat input
  const electricalOutput = load * 3600; // MJ/h
  const heatInput = coalFeed * COAL_CALORIFIC_VALUE; // MJ/h
  const efficiency = (electricalOutput / heatInput) * 100; // %
  
  return Math.max(0, Math.min(50, efficiency));
}

function calculateEmissionsRate(params: CalculationParams): number {
  const { coalFeed, airSupply } = params;
  
  // Emissions depend on combustion efficiency
  const combustionEfficiency = calculateBoilerEfficiency(params);
  const baseEmissions = coalFeed * 2; // kg/h
  const efficiencyEffect = 1 - combustionEfficiency;
  const emissions = baseEmissions * efficiencyEffect;
  
  return Math.max(0, emissions);
}

function calculateHeatRate(params: CalculationParams): number {
  const { coalFeed, load } = params;
  
  // Heat rate = fuel consumption / electrical output
  const fuelConsumption = coalFeed * COAL_CALORIFIC_VALUE; // kJ/h
  const electricalOutput = load * 3600; // kJ/h
  const heatRate = fuelConsumption / Math.max(electricalOutput, 1); // kJ/kWh
  
  return Math.max(8000, Math.min(12000, heatRate));
}

// Realistic gradual change functions - Updated with smoothApproach
function interpolateValue(
  currentValue: number,
  targetValue: number,
  responseTime: number,
  deltaTime: number
): number {
  if (Math.abs(currentValue - targetValue) < 0.01) {
    return targetValue;
  }
  
  // Use smoothApproach for more realistic system inertia
  const smoothFactor = 1 / responseTime; // Convert response time to smooth factor
  return smoothApproach(currentValue, targetValue, smoothFactor, deltaTime);
}

// Complex physics interactions based on real PLTU systems
function calculateBoilerResponse(params: CalculationParams, currentState: Partial<SystemState>, deltaTime: number): SystemResponse {
  const { coalFeed, airSupply, feedwater, coolingWater } = params;
  
  // Get current values with realistic interpolation
  const currentTemp = currentState.mainSteamTemp || STEAM_TEMP_BASE;
  const currentPressure = currentState.mainSteamPressure || STEAM_PRESSURE_BASE;
  const currentFlow = currentState.mainSteamFlow || 0;
  
  // Convert lever values to realistic ranges
  const fuelRate = coalFeed / 100; // 0-1 range
  const airRate = airSupply / 100;
  const feedRate = feedwater / 100;
  const coolingRate = coolingWater / 100;
  
  // Complex boiler physics calculations
  
  // 1. Air-Fuel Ratio Analysis
  const stoichiometricRatio = 15.5; // Optimal air-fuel ratio for coal
  const actualRatio = airRate / Math.max(fuelRate, 0.01);
  const ratioEfficiency = Math.max(0.4, 1 - Math.abs(actualRatio - stoichiometricRatio) / stoichiometricRatio);
  
  // 2. Combustion Efficiency
  const combustionEfficiency = ratioEfficiency * (0.7 + fuelRate * 0.3);
  
  // 3. Heat Transfer Calculations
  const heatInput = fuelRate * COAL_CALORIFIC_VALUE * combustionEfficiency; // kJ/h
  const heatLoss = currentTemp * 0.02 * deltaTime; // Heat loss to environment
  const netHeat = heatInput - heatLoss;
  
  // 4. Temperature Response (with thermal inertia) - Updated with smoothApproach
  const tempChange = (netHeat / (4.186 * 1000)) * deltaTime / 3600; // °C/s
  const targetTemp = currentTemp + tempChange;
  const newTemp = smoothApproach(currentTemp, targetTemp, SMOOTH_FACTORS.temperature, deltaTime);
  
  // 5. Pressure Response (based on steam properties) - Updated with smoothApproach
  const saturationPressure = Math.pow(newTemp / 100, 4) * 0.1; // Simplified steam table
  const targetPressure = saturationPressure * (1 + fuelRate * 0.5);
  const newPressure = smoothApproach(currentPressure, targetPressure, SMOOTH_FACTORS.pressure, deltaTime);
  
  // 6. Steam Generation (with flow dynamics) - Updated with smoothApproach
  const maxSteamFlow = fuelRate * 500; // t/h maximum
  const steamEfficiency = Math.min(1, newTemp / STEAM_TEMP_BASE) * combustionEfficiency;
  const targetSteamFlow = maxSteamFlow * steamEfficiency;
  const newSteamFlow = smoothApproach(currentFlow, targetSteamFlow, SMOOTH_FACTORS.steamFlow, deltaTime);
  
  // 7. Water Level Dynamics
  const evaporationRate = newSteamFlow * 0.1; // t/h
  const feedRate_actual = feedRate * 100; // t/h
  const levelChange = (feedRate_actual - evaporationRate) * deltaTime / 1000; // Level change
  const currentLevel = 60; // Default level
  const newLevel = Math.max(8, Math.min(95, currentLevel + levelChange));
  
  return {
    mainSteamFlow: newSteamFlow,
    mainSteamTemp: newTemp,
    mainSteamPressure: newPressure,
    targetMainSteamFlow: targetSteamFlow,
    targetMainSteamTemp: newTemp + tempChange,
    targetMainSteamPressure: saturationPressure * (1 + fuelRate * 0.5)
  };
}

function calculateTurbineResponse(params: CalculationParams, currentState: Partial<SystemState>, deltaTime: number): SystemResponse {
  const { steamTurbine, steamFlow } = params;
  const mainSteamPressure = currentState.mainSteamPressure || STEAM_PRESSURE_BASE;
  const mainSteamTemp = currentState.mainSteamTemp || STEAM_TEMP_BASE;
  const mainSteamFlow = currentState.mainSteamFlow || 0;
  
  // Get current values
  const currentRPM = currentState.turbineSpeed || 1800;
  const currentLoad = currentState.load || 0;
  
  // Convert lever values to realistic ranges
  const valveOpening = steamTurbine / 100; // 0-1 range
  const loadDemand = steamFlow / 100; // Using steamFlow as load control
  
  // Complex turbine physics calculations
  
  // 1. Steam Conditions Analysis
  const steamEnthalpy = 2.0 * mainSteamTemp + 2500; // kJ/kg (simplified)
  const condenserEnthalpy = 2.0 * 40 + 2500; // kJ/kg at condenser
  const availableWork = steamEnthalpy - condenserEnthalpy; // kJ/kg
  
  // 2. Turbine Efficiency (based on steam conditions and valve opening)
  const pressureRatio = mainSteamPressure / 5.0; // Condenser pressure
  const isentropicEfficiency = TURBINE_EFFICIENCY_BASE * (0.8 + valveOpening * 0.2);
  const actualEfficiency = isentropicEfficiency * Math.min(1, pressureRatio / 3);
  
  // 3. Mechanical Power Calculation
  const steamPower = mainSteamFlow * availableWork * actualEfficiency / 3600; // MW
  const maxMechanicalPower = steamPower * valveOpening;
  
  // 4. Turbine Speed Response (with mechanical inertia) - Updated with smoothApproach
  const targetRPM = 3000 * (maxMechanicalPower / 600); // 600 MW at 3000 RPM
  const newRPM = smoothApproach(currentRPM, targetRPM, SMOOTH_FACTORS.rpm, deltaTime);
  
  // 5. Generator Load Response - Updated with smoothApproach
  const maxElectricalPower = maxMechanicalPower * GENERATOR_EFFICIENCY;
  const targetLoad = Math.min(maxElectricalPower, loadDemand * 600); // 600 MW max
  const newLoad = smoothApproach(currentLoad, targetLoad, SMOOTH_FACTORS.steamTurbine, deltaTime);
  
  // 6. Frequency Control
  const frequency = 50 + (newRPM - 3000) / 60; // Hz
  
  return {
    turbineSpeed: newRPM,
    load: newLoad,
    targetTurbineSpeed: targetRPM,
    targetLoad: targetLoad
  };
}

function calculateWaterSystemResponse(params: CalculationParams, currentState: Partial<SystemState>, deltaTime: number): SystemResponse {
  const { feedwater, coolingWater, condenser } = params;
  const load = currentState.load || 0;
  
  // Convert lever values to simulation values (0-2 range like Pygame)
  const feed = feedwater / 50;
  const cool = coolingWater / 50;
  
  // Simple water system calculations
  const condensateFlow = load * 2; // t/h per MW
  const circulatingWater = 1000 * cool; // m³/h
  
  return {
    condensateWaterFlow: condensateFlow,
    circulatingWaterFlow: circulatingWater
  };
}

export function calculateSystemState(
  leverValues: Record<LeverType, number>, 
  currentState?: Partial<SystemState>,
  deltaTime: number = 0.1
): Partial<SystemState> {
  // Check for trip conditions (like Pygame)
  const boilerTemp = currentState?.mainSteamTemp || STEAM_TEMP_BASE;
  const waterLevel = 60; // Default water level
  const currentTurbineRPM = currentState?.turbineSpeed || 1800;
  
  let trip = currentState?.trip || false;
  
  // Trip conditions based on Pygame logic
  if (boilerTemp > 620 || waterLevel < 8 || waterLevel > 95 || currentTurbineRPM > 3600) {
    trip = true;
  }
  
  // Handle shutdown mode
  if (currentState?.shutdownTime && currentState.shutdownTime > 0) {
    const shutdownTime = currentState.shutdownTime - deltaTime;
    
    // During shutdown, reduce all values gradually
    const shutdownFactor = Math.max(0, shutdownTime / 10);
    
    return {
      trip: true,
      shutdownTime: Math.max(0, shutdownTime),
      mainSteamTemp: boilerTemp * 0.995,
      turbineSpeed: (currentState.turbineSpeed || 1800) * 0.98,
      load: (currentState.load || 0) * shutdownFactor,
      mainSteamFlow: (currentState.mainSteamFlow || 0) * shutdownFactor,
      mainSteamPressure: (currentState.mainSteamPressure || STEAM_PRESSURE_BASE) * shutdownFactor
    };
  }
  
  // If tripped, force fuel and valve to 0
  if (trip) {
    leverValues = {
      ...leverValues,
      coal_feed: 0,
      steam_turbine: 0
    };
  }
  const params: CalculationParams = {
    coalFeed: leverValues.coal_feed,
    feedwater: leverValues.feedwater,
    boilerPressure: leverValues.boiler_pressure,
    steamTurbine: leverValues.steam_turbine,
    condenser: leverValues.condenser,
    coolingWater: leverValues.cooling_water,
    airSupply: leverValues.air_supply,
    fuelInjection: leverValues.fuel_injection,
    steamFlow: leverValues.steam_flow,
    waterLevel: leverValues.water_level,
    exhaustGas: leverValues.exhaust_gas,
    emergencyValve: leverValues.emergency_valve
  };

  // Use current state for realistic gradual changes
  const current = currentState || {
    mainSteamFlow: 0,
    mainSteamPressure: STEAM_PRESSURE_BASE,
    mainSteamTemp: STEAM_TEMP_BASE,
    turbineSpeed: 0,
    load: 0,
    condensateWaterFlow: 0,
    circulatingWaterFlow: 1000
  };

  // Calculate realistic system responses with delays
  const boilerResponse = calculateBoilerResponse(params, current, deltaTime);
  const turbineResponse = calculateTurbineResponse(params, { ...current, ...boilerResponse }, deltaTime);
  const waterResponse = calculateWaterSystemResponse(params, { ...current, ...boilerResponse, ...turbineResponse }, deltaTime);
  
  // Extract values from responses
  const mainSteamFlow = boilerResponse.mainSteamFlow || 0;
  const mainSteamPressure = boilerResponse.mainSteamPressure || STEAM_PRESSURE_BASE;
  const mainSteamTemp = boilerResponse.mainSteamTemp || STEAM_TEMP_BASE;
  const turbineSpeed = turbineResponse.turbineSpeed || 0;
  const load = turbineResponse.load || 0;
  const condensateWaterFlow = waterResponse.condensateWaterFlow || 0;
  const circulatingWaterFlow = waterResponse.circulatingWaterFlow || 1000;
  
  // Calculate frequency based on load
  const frequency = calculateFrequencyFromLoad(load);
  
  // Calculate auxiliary systems
  const oilTankLevel = calculateOilTankLevel(params);
  
  // Calculate temperatures and pressures based on new values
  const steamOutTurbineTemp = calculateSteamOutTurbineTemp({ ...params, mainSteamTemp, turbineSpeed });
  const surgeTankTemp = calculateSurgeTankTemp({ ...params, mainSteamTemp, steamFlow: mainSteamFlow });
  const condenserOutTemp = calculateCondenserOutTemp(params);
  const coolingWaterTemp = calculateCoolingWaterTemp({ ...params, condenserOutTemp });
  const condenserPressure = calculateCondenserPressure(params);
  const feedwaterTemp = calculateFeedwaterTemp(params);
  const feedwaterPressure = calculateFeedwaterPressure({ ...params, mainSteamPressure });
  
  // Calculate heater temperatures
  const heaterTemps = calculateHeaterTemps({ ...params, mainSteamTemp });
  
  // Calculate generator and oil temperatures
  const generatorTemp = calculateGeneratorTemp({ ...params, load });
  const oilCoolerTemp = calculateOilCoolerTemp({ ...params, turbineSpeed });
  
  // Calculate additional flows
  const coalLoadingRate = calculateCoalLoadingRate(params);
  const combustionSpeed = calculateCombustionSpeed(params);
  const waterLoadingRate = calculateWaterLoadingRate(params);
  const waterBoilingRate = calculateWaterBoilingRate(params);
  const steamGenerationRate = calculateSteamGenerationRate(params);
  const fuelConsumptionRate = calculateFuelConsumptionRate(params);
  
  // Calculate efficiency and emissions
  const efficiency = calculateEfficiency({ ...params, load });
  const emissionsRate = calculateEmissionsRate(params);
  const heatRate = calculateHeatRate({ ...params, load });
  
  // Calculate total wattage produced
  const totalWattageProduced = calculateTotalWattageProduced(load, deltaTime);
  
  // Determine system status
  const turbineStatus = turbineSpeed > 0 ? 'running' : 'stopped';
  const generatorStatus = load > 0 ? 'online' : 'offline';
  const condenserStatus = condenserOutTemp < 50 ? 'normal' : 'high_temp';
  const heaterStatus = heaterTemps.h1 < 200 ? 'normal' : 'high_temp';
  
  return {
    mainSteamFlow,
    mainSteamPressure,
    mainSteamTemp,
    turbineSpeed,
    load,
    frequency,
    condensateWaterFlow,
    circulatingWaterFlow,
    oilTankLevel,
    steamOutTurbineTemp,
    surgeTankTemp,
    condenserOutTemp,
    coolingWaterTemp,
    condenserPressure,
    feedwaterTemp,
    feedwaterPressure,
    heater1Temp: heaterTemps.h1,
    heater2Temp: heaterTemps.h2,
    heater3Temp: heaterTemps.h3,
    heater4Temp: heaterTemps.h4,
    generatorTemp,
    oilCoolerTemp,
    coalLoadingRate,
    combustionSpeed,
    waterLoadingRate,
    waterBoilingRate,
    steamGenerationRate,
    fuelConsumptionRate,
    efficiency,
    emissionsRate,
    heatRate,
    totalWattageProduced,
    trip,
    turbineStatus,
    generatorStatus,
    condenserStatus,
    heaterStatus
  };
}

export function calculateEarnings(powerOutput: number, durationSeconds: number): number {
  // Calculate earnings based on power output and duration
  const powerMWh = powerOutput * durationSeconds / 3600; // Convert to MWh
  const ratePerMWh = 1000000; // 1 million Rupiah per MWh
  return powerMWh * ratePerMWh;
}

export function formatNumber(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
} 