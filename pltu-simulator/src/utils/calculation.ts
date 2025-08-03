import { LeverType, SystemState } from '../types';

// Physical constants
const GRAVITY = 9.81; // m/s²
const SPECIFIC_HEAT_WATER = 4.186; // kJ/kg·K
const SPECIFIC_HEAT_STEAM = 2.0; // kJ/kg·K
const LATENT_HEAT_VAPORIZATION = 2257; // kJ/kg
const GAS_CONSTANT = 8.314; // J/mol·K
const MOLECULAR_WEIGHT_WATER = 18.015; // g/mol
const ATMOSPHERIC_PRESSURE = 101.325; // kPa

// Steam power plant specific constants
const BOILER_EFFICIENCY_BASE = 0.85;
const TURBINE_EFFICIENCY_BASE = 0.88;
const GENERATOR_EFFICIENCY = 0.98;
const CONDENSER_PRESSURE_BASE = 5.0; // kPa
const FEEDWATER_TEMP_BASE = 150; // °C
const STEAM_TEMP_BASE = 540; // °C
const STEAM_PRESSURE_BASE = 16.5; // MPa
const COAL_CALORIFIC_VALUE = 25000; // kJ/kg

// System response time constants (in seconds) - More realistic for PLTU
const BOILER_RESPONSE_TIME = 60; // Boiler takes 60 seconds to respond (large thermal mass)
const TURBINE_RESPONSE_TIME = 30; // Turbine takes 30 seconds to respond (mechanical inertia)
const STEAM_RESPONSE_TIME = 45; // Steam system takes 45 seconds (flow dynamics)
const WATER_RESPONSE_TIME = 90; // Water system takes 90 seconds (slowest)
const TEMPERATURE_RESPONSE_TIME = 40; // Temperature changes take 40 seconds (thermal inertia)
const PRESSURE_RESPONSE_TIME = 20; // Pressure changes take 20 seconds (faster but still realistic)

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
  const levelEfficiency = Math.max(0.8, 1 - Math.abs(waterLevel - 50) / 50);
  
  // Coal feed rate affects combustion stability
  const feedEfficiency = Math.max(0.6, coalFeed / 100);
  
  return BOILER_EFFICIENCY_BASE * ratioEfficiency * levelEfficiency * feedEfficiency;
}

function calculateSteamGeneration(params: CalculationParams): number {
  const { coalFeed, feedwater, airSupply, steamTurbine } = params;
  const boilerEfficiency = calculateBoilerEfficiency(params);
  
  // Coal heating value (kJ/kg)
  const coalHeatingValue = 25000; // Typical bituminous coal
  const coalEnergy = coalFeed * coalHeatingValue;
  
  // Feedwater enthalpy
  const feedwaterEnthalpy = SPECIFIC_HEAT_WATER * (feedwater * 2 + 50); // kJ/kg
  
  // Steam enthalpy (superheated)
  const steamEnthalpy = 2.0 * (STEAM_TEMP_BASE + steamTurbine * 2) + 2500;
  
  // Steam generation rate (kg/s)
  const steamGeneration = (coalEnergy * boilerEfficiency) / (steamEnthalpy - feedwaterEnthalpy);
  
  return Math.max(0, steamGeneration);
}

function calculateTurbineWork(steamFlow: number, inletPressure: number, inletTemp: number, outletPressure: number): number {
  const steamProps = calculateSteamProperties(inletTemp, inletPressure);
  const outletProps = calculateSteamProperties(inletTemp - 100, outletPressure);
  
  // Isentropic expansion work
  const isentropicWork = steamFlow * (steamProps.specificEnthalpy - outletProps.specificEnthalpy);
  
  // Turbine efficiency based on steam conditions
  const pressureRatio = inletPressure / outletPressure;
  const efficiency = TURBINE_EFFICIENCY_BASE * (1 - 0.1 * Math.log(pressureRatio));
  
  return isentropicWork * efficiency;
}

function calculateCondenserHeatTransfer(steamFlow: number, coolingWaterFlow: number, condenserPressure: number): number {
  // Steam enthalpy at condenser pressure
  const condenserTemp = 40 + (5 - condenserPressure) * 10; // °C
  const steamEnthalpy = 2.0 * condenserTemp + 2500;
  const waterEnthalpy = SPECIFIC_HEAT_WATER * condenserTemp;
  
  // Heat rejected to condenser
  const heatRejected = steamFlow * (steamEnthalpy - waterEnthalpy);
  
  // Cooling water heat absorption
  const coolingWaterHeat = coolingWaterFlow * SPECIFIC_HEAT_WATER * 15; // 15°C temperature rise
  
  return Math.min(heatRejected, coolingWaterHeat);
}

function calculateFeedwaterHeating(params: CalculationParams): number {
  const { feedwater } = params;
  const heater1Temp = params.heater1Temp || 150;
  const heater2Temp = params.heater2Temp || 130;
  const heater3Temp = params.heater3Temp || 110;
  const heater4Temp = params.heater4Temp || 90;
  
  // Multi-stage feedwater heating
  const heater1Heat = feedwater * SPECIFIC_HEAT_WATER * (heater1Temp - 50);
  const heater2Heat = feedwater * SPECIFIC_HEAT_WATER * (heater2Temp - heater1Temp);
  const heater3Heat = feedwater * SPECIFIC_HEAT_WATER * (heater3Temp - heater2Temp);
  const heater4Heat = feedwater * SPECIFIC_HEAT_WATER * (heater4Temp - heater3Temp);
  
  return heater1Heat + heater2Heat + heater3Heat + heater4Heat;
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
  const { steamTurbine, steamFlow, mainSteamPressure } = params;
  
  // Base speed
  let speed = 3000; // rpm
  
  // Steam turbine control affects speed
  const turbineEffect = steamTurbine / 100;
  speed *= (0.8 + turbineEffect * 0.4);
  
  // Steam flow affects speed
  const flowEffect = steamFlow / 100;
  speed *= (0.9 + flowEffect * 0.2);
  
  // Pressure affects speed
  const pressureEffect = (mainSteamPressure || STEAM_PRESSURE_BASE) / STEAM_PRESSURE_BASE;
  speed *= pressureEffect;
  
  return Math.max(0, Math.min(3600, speed));
}

function calculateCondensateWaterFlow(params: CalculationParams): number {
  const { steamFlow, condenser } = params;
  
  // Condensate flow is related to steam flow
  let condensateFlow = steamFlow * 0.95; // 95% recovery
  
  // Condenser efficiency affects recovery
  const condenserEffect = condenser / 100;
  condensateFlow *= condenserEffect;
  
  return Math.max(0, condensateFlow);
}

function calculateOilTankLevel(params: CalculationParams): number {
  const { turbineSpeed, generatorTemp } = params;
  
  // Oil consumption depends on turbine speed
  const consumptionRate = (turbineSpeed || 0) / 3000 * 0.1; // %/minute
  
  // Oil level decreases over time
  let level = 100 - consumptionRate * 10; // Simplified model
  
  // Generator temperature affects oil consumption
  const tempEffect = Math.max(0.5, 1 - ((generatorTemp || 60) - 60) / 100);
  level *= tempEffect;
  
  return Math.max(0, Math.min(100, level));
}

function calculateLoad(params: CalculationParams): number {
  const { steamTurbine, steamFlow } = params;
  const mainSteamTemp = params.mainSteamTemp ?? 540;
  const mainSteamPressure = params.mainSteamPressure ?? 16.5;

  // Calculate mechanical power from steam
  const steamProps = calculateSteamProperties(mainSteamTemp, mainSteamPressure);
  const condenserProps = calculateSteamProperties(40, CONDENSER_PRESSURE_BASE);

  const steamWork = steamFlow * (steamProps.specificEnthalpy - condenserProps.specificEnthalpy);
  const turbineEfficiency = TURBINE_EFFICIENCY_BASE * (steamTurbine / 100);

  const mechanicalPower = steamWork * turbineEfficiency / 1000; // Convert to MW

  // Apply generator efficiency
  const electricalPower = calculateElectricalPower(mechanicalPower, GENERATOR_EFFICIENCY);

  return Math.max(0, Math.min(600, electricalPower));
}

function calculateFrequencyFromLoad(load: number): number {
  return calculateFrequency(load);
}

function calculateSteamOutTurbineTemp(params: CalculationParams): number {
  const { turbineSpeed, steamFlow } = params;
  const mainSteamTemp = params.mainSteamTemp ?? 540;
  
  // Steam temperature after turbine expansion
  let outletTemp = mainSteamTemp - 200; // Typical expansion cooling
  
  // Turbine speed affects expansion
  const speedEffect = (turbineSpeed || 0) / 3000;
  outletTemp *= (0.8 + speedEffect * 0.4);
  
  // Steam flow affects cooling
  const flowEffect = steamFlow / 100;
  outletTemp *= (0.9 + flowEffect * 0.2);
  
  return Math.max(40, Math.min(300, outletTemp));
}

function calculateSurgeTankTemp(params: CalculationParams): number {
  const { steamFlow } = params;
  const mainSteamTemp = params.mainSteamTemp ?? 540;
  
  // Surge tank temperature is related to steam temperature
  let tankTemp = mainSteamTemp * 0.8;
  
  // Steam flow affects heat transfer
  const flowEffect = steamFlow / 100;
  tankTemp *= (0.9 + flowEffect * 0.2);
  
  return Math.max(50, Math.min(400, tankTemp));
}

function calculateCondenserOutTemp(params: CalculationParams): number {
  const { condenser, coolingWater } = params;
  
  // Condenser outlet temperature
  let outletTemp = 40; // Base temperature
  
  // Condenser efficiency affects temperature
  const condenserEffect = condenser / 100;
  outletTemp += (60 - outletTemp) * (1 - condenserEffect);
  
  // Cooling water affects temperature
  const coolingEffect = coolingWater / 100;
  outletTemp *= (0.8 + coolingEffect * 0.4);
  
  return Math.max(30, Math.min(80, outletTemp));
}

function calculateCoolingWaterTemp(params: CalculationParams): number {
  const { coolingWater, condenserOutTemp } = params;
  const condenserOut = condenserOutTemp ?? 40;
  
  // Cooling water temperature
  let waterTemp = 25; // Inlet temperature
  
  // Cooling water flow affects temperature rise
  const flowEffect = coolingWater / 100;
  const tempRise = 15 * (1 - flowEffect * 0.5);
  waterTemp += tempRise;
  
  // Condenser outlet affects water temperature
  waterTemp = Math.max(waterTemp, condenserOut - 10);
  
  return Math.max(20, Math.min(50, waterTemp));
}

function calculateCondenserPressure(params: CalculationParams): number {
  const { condenser, coolingWater } = params;
  
  // Condenser pressure
  let pressure = CONDENSER_PRESSURE_BASE;
  
  // Condenser efficiency affects pressure
  const condenserEffect = condenser / 100;
  pressure *= (1.2 - condenserEffect * 0.4);
  
  // Cooling water affects pressure
  const coolingEffect = coolingWater / 100;
  pressure *= (1.1 - coolingEffect * 0.2);
  
  return Math.max(1, Math.min(10, pressure));
}

function calculateFeedwaterTemp(params: CalculationParams): number {
  const { feedwater } = params;
  const heater1Temp = params.heater1Temp ?? 150;
  const heater2Temp = params.heater2Temp ?? 130;
  const heater3Temp = params.heater3Temp ?? 110;
  const heater4Temp = params.heater4Temp ?? 90;
  
  // Feedwater temperature after heating
  let temp = 50; // Initial temperature
  
  // Multi-stage heating
  const heater1Effect = heater1Temp / 100;
  temp += 50 * heater1Effect;
  
  const heater2Effect = heater2Temp / 100;
  temp += 50 * heater2Effect;
  
  const heater3Effect = heater3Temp / 100;
  temp += 50 * heater3Effect;
  
  const heater4Effect = heater4Temp / 100;
  temp += 50 * heater4Effect;
  
  return Math.max(50, Math.min(250, temp));
}

function calculateFeedwaterPressure(params: CalculationParams): number {
  const { feedwater } = params;
  const mainSteamPressure = params.mainSteamPressure ?? 16.5;
  
  // Feedwater pressure
  let pressure = mainSteamPressure * 1.2; // Higher than steam pressure
  
  // Feedwater flow affects pressure
  const flowEffect = feedwater / 100;
  pressure *= (0.8 + flowEffect * 0.4);
  
  return Math.max(0.1, pressure);
}

function calculateHeaterTemps(params: CalculationParams): { h1: number; h2: number; h3: number; h4: number } {
  const { steamFlow, mainSteamTemp } = params;
  
  // Heater temperatures based on steam extraction
  const steamEffect = steamFlow / 100;
  
  const h1 = 200 + steamEffect * 100;
  const h2 = 180 + steamEffect * 80;
  const h3 = 160 + steamEffect * 60;
  const h4 = 140 + steamEffect * 40;
  
  return {
    h1: Math.max(100, Math.min(300, h1)),
    h2: Math.max(80, Math.min(280, h2)),
    h3: Math.max(60, Math.min(260, h3)),
    h4: Math.max(40, Math.min(240, h4))
  };
}

function calculateGeneratorTemp(params: CalculationParams): number {
  const load = params.load ?? 0;
  const turbineSpeed = params.turbineSpeed ?? 0;
  
  // Generator temperature
  let temp = 60; // Base temperature
  
  // Load affects temperature
  const loadEffect = load / 600;
  temp += 40 * loadEffect;
  
  // Turbine speed affects temperature
  const speedEffect = turbineSpeed / 3000;
  temp += 20 * speedEffect;
  
  return Math.max(40, Math.min(120, temp));
}

function calculateOilCoolerTemp(params: CalculationParams): number {
  const generatorTemp = params.generatorTemp ?? 60;
  const turbineSpeed = params.turbineSpeed ?? 0;
  
  // Oil cooler temperature
  let temp = 40; // Base temperature
  
  // Generator temperature affects oil cooler
  const genEffect = generatorTemp / 100;
  temp += 20 * genEffect;
  
  // Turbine speed affects oil temperature
  const speedEffect = turbineSpeed / 3000;
  temp += 15 * speedEffect;
  
  return Math.max(30, Math.min(80, temp));
}

function calculateCirculatingWaterFlow(params: CalculationParams): number {
  const { coolingWater, condenser } = params;
  
  // Circulating water flow
  let flow = 1000; // Base flow (t/h)
  
  // Cooling water affects flow
  const coolingEffect = coolingWater / 100;
  flow *= (0.7 + coolingEffect * 0.6);
  
  // Condenser efficiency affects flow
  const condenserEffect = condenser / 100;
  flow *= (0.8 + condenserEffect * 0.4);
  
  return Math.max(500, Math.min(2000, flow));
}

function calculateGeneratorAirCoolerTemp(params: CalculationParams): number {
  const generatorTemp = params.generatorTemp ?? 60;
  const load = params.load ?? 0;
  
  // Generator air cooler temperature
  let temp = 35; // Base temperature
  
  // Generator temperature affects air cooler
  const genEffect = generatorTemp / 100;
  temp += 15 * genEffect;
  
  // Load affects air cooler
  const loadEffect = load / 600;
  temp += 10 * loadEffect;
  
  return Math.max(25, Math.min(60, temp));
}

// New indicator calculations
function calculateTotalWattageProduced(powerOutput: number, durationSeconds: number): number {
  // Convert MW to kW and calculate total energy produced
  const energyKWh = (powerOutput * 1000) * (durationSeconds / 3600);
  return energyKWh * 1000; // Convert to Watt-hours
}

function calculateCoalLoadingRate(params: CalculationParams): number {
  const { coalFeed } = params;
  // Coal loading rate in tons per hour
  return coalFeed * 2; // Scale factor for realistic values
}

function calculateCombustionSpeed(params: CalculationParams): number {
  const { coalFeed, airSupply } = params;
  // Combustion speed depends on coal feed and air supply
  const airFuelRatio = airSupply / Math.max(coalFeed, 1);
  const optimalRatio = 15.5;
  const efficiency = Math.max(0.6, 1 - Math.abs(airFuelRatio - optimalRatio) / optimalRatio);
  return coalFeed * efficiency * 3; // Tons per hour
}

function calculateWaterLoadingRate(params: CalculationParams): number {
  const { feedwater } = params;
  // Water loading rate in tons per hour
  return feedwater * 5; // Scale factor for realistic values
}

function calculateWaterBoilingRate(params: CalculationParams): number {
  const { coalFeed, feedwater } = params;
  const steamGeneration = calculateSteamGeneration(params);
  // Water boiling rate in tons per hour
  return steamGeneration * 3600; // Convert from kg/s to t/h
}

function calculateSteamGenerationRate(params: CalculationParams): number {
  const steamGeneration = calculateSteamGeneration(params);
  // Steam generation rate in tons per hour
  return steamGeneration * 3600; // Convert from kg/s to t/h
}

function calculateFuelConsumptionRate(params: CalculationParams): number {
  const { coalFeed } = params;
  // Fuel consumption rate in tons per hour
  return coalFeed * 2.5; // Scale factor for realistic values
}

function calculateEfficiency(params: CalculationParams): number {
  const boilerEfficiency = calculateBoilerEfficiency(params);
  const turbineEfficiency = TURBINE_EFFICIENCY_BASE;
  const generatorEfficiency = GENERATOR_EFFICIENCY;
  
  // Overall plant efficiency
  return boilerEfficiency * turbineEfficiency * generatorEfficiency * 100; // Percentage
}

function calculateEmissionsRate(params: CalculationParams): number {
  const { coalFeed, airSupply } = params;
  const efficiency = calculateEfficiency(params);
  
  // CO2 emissions rate in kg per hour
  const coalCarbonContent = 0.7; // 70% carbon content
  const co2PerCarbon = 44 / 12; // CO2/C ratio
  
  const emissions = coalFeed * coalCarbonContent * co2PerCarbon * (100 - efficiency) / 100;
  return emissions * 1000; // Convert to kg/h
}

function calculateHeatRate(params: CalculationParams): number {
  const { coalFeed } = params;
  const load = params.load ?? 0;
  const efficiency = calculateEfficiency(params);
  
  // Heat rate in kJ/kWh
  if (load <= 0 || efficiency <= 0) return 0;
  
  const coalEnergy = coalFeed * COAL_CALORIFIC_VALUE; // kJ/h
  const electricalEnergy = load * 1000 * 3600; // kJ/h (1 kWh = 3600 kJ)
  
  return coalEnergy / electricalEnergy;
}

// Realistic gradual change functions
function interpolateValue(
  currentValue: number,
  targetValue: number,
  responseTime: number,
  deltaTime: number
): number {
  if (Math.abs(currentValue - targetValue) < 0.01) {
    return targetValue;
  }
  
  // Exponential decay for realistic response
  const timeConstant = responseTime / 3; // Time to reach 95% of target
  const factor = 1 - Math.exp(-deltaTime / timeConstant);
  
  return currentValue + (targetValue - currentValue) * factor;
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
  
  // 4. Temperature Response (with thermal inertia)
  const tempChange = (netHeat / (SPECIFIC_HEAT_WATER * 1000)) * deltaTime / 3600; // °C/s
  const newTemp = interpolateValue(currentTemp, currentTemp + tempChange, TEMPERATURE_RESPONSE_TIME, deltaTime);
  
  // 5. Pressure Response (based on steam properties)
  const saturationPressure = Math.pow(newTemp / 100, 4) * 0.1; // Simplified steam table
  const newPressure = interpolateValue(currentPressure, saturationPressure * (1 + fuelRate * 0.5), PRESSURE_RESPONSE_TIME, deltaTime);
  
  // 6. Steam Generation (with flow dynamics)
  const maxSteamFlow = fuelRate * 500; // t/h maximum
  const steamEfficiency = Math.min(1, newTemp / STEAM_TEMP_BASE) * combustionEfficiency;
  const targetSteamFlow = maxSteamFlow * steamEfficiency;
  const newSteamFlow = interpolateValue(currentFlow, targetSteamFlow, STEAM_RESPONSE_TIME, deltaTime);
  
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
  
  // 4. Turbine Speed Response (with mechanical inertia)
  const targetRPM = 3000 * (maxMechanicalPower / 600); // 600 MW at 3000 RPM
  const rpmChange = (targetRPM - currentRPM) * deltaTime / TURBINE_RESPONSE_TIME;
  const newRPM = interpolateValue(currentRPM, targetRPM, TURBINE_RESPONSE_TIME, deltaTime);
  
  // 5. Generator Load Response
  const maxElectricalPower = maxMechanicalPower * GENERATOR_EFFICIENCY;
  const targetLoad = Math.min(maxElectricalPower, loadDemand * 600); // 600 MW max
  const newLoad = interpolateValue(currentLoad, targetLoad, TURBINE_RESPONSE_TIME, deltaTime);
  
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
  const heaterTemps = calculateHeaterTemps({ ...params, mainSteamTemp, steamFlow: mainSteamFlow });
  
  // Calculate equipment temperatures
  const generatorTemp = calculateGeneratorTemp({ ...params, load, turbineSpeed });
  const oilCoolerTemp = calculateOilCoolerTemp({ ...params, generatorTemp, turbineSpeed });
  const generatorAirCoolerTemp = calculateGeneratorAirCoolerTemp({ ...params, generatorTemp, load });
  
  // Calculate new indicators
  const totalWattageProduced = calculateTotalWattageProduced(load, 0); // Will be calculated in store
  const coalLoadingRate = calculateCoalLoadingRate(params);
  const combustionSpeed = calculateCombustionSpeed(params);
  const waterLoadingRate = calculateWaterLoadingRate(params);
  const waterBoilingRate = calculateWaterBoilingRate(params);
  const steamGenerationRate = calculateSteamGenerationRate(params);
  const fuelConsumptionRate = calculateFuelConsumptionRate(params);
  const efficiency = calculateEfficiency(params);
  const emissionsRate = calculateEmissionsRate(params);
  const heatRate = calculateHeatRate(params);
  
  // Calculate basic indicators
  const temperature = mainSteamTemp;
  const pressure = mainSteamPressure;
  const turbineRPM = turbineSpeed;
  const powerOutput = load;

  return {
    // Main indicators
    mainSteamFlow,
    mainSteamPressure,
    mainSteamTemp,
    turbineSpeed,
    condensateWaterFlow,
    oilTankLevel,
    load,
    frequency,
    
    // Trip system
    trip,
    
    // Basic indicators
    temperature,
    pressure,
    turbineRPM,
    powerOutput,
    
    // Additional SCADA indicators
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
    circulatingWaterFlow,
    generatorAirCoolerTemp,
    
    // New real-time indicators
    totalWattageProduced,
    coalLoadingRate,
    combustionSpeed,
    waterLoadingRate,
    waterBoilingRate,
    steamGenerationRate,
    fuelConsumptionRate,
    efficiency,
    emissionsRate,
    heatRate
  };
}

export function calculateEarnings(powerOutput: number, durationSeconds: number): number {
  // Electricity price: Rp1 per 100 KWatt = Rp0.01 per KWatt
  const electricityPrice = 0.01; // IDR/kW
  
  // Convert MW to kW and calculate energy
  const energyKWh = (powerOutput * 1000) * (durationSeconds / 3600);
  
  // Calculate earnings
  const earnings = energyKWh * electricityPrice;
  
  return Math.max(0, earnings);
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