# 🔧 SKEMA LOGIKA SIMULASI PLTU - KONTROL → FISIKA → UI

## 📋 STRUKTUR UMUM SIMULASI

```
[ TUAS KONTROL (LEVER) ] 
   ⬇️ mempengaruhi
[ PROSES FISIK PLTU (Boiler, Turbin, Kondensor) ]
   ⬇️ dihitung dengan
[ RUMUS-RUMUS FISIKA TERMODINAMIKA ]
   ⬇️ menghasilkan
[ NILAI-INDIKATOR UI ]
```

## 🎚️ KOMPONEN KONTROL (LEVER) & ALGORITMA FISIKA

### 1. Coal Feed (Pasokan batu bara ke boiler)
**🔁 Input:** `coalFeedPct: number (0–100%)`

**🔬 Rumus & Efek:**
```typescript
// Energi panas dari pembakaran batu bara
const Q_coal = 25e6; // J/kg (25 MJ/kg)
const coalFeed_ton_per_hour = (coalFeedPct / 100) * maxCoalFeed;
const HeatEnergy = (coalFeed_ton_per_hour * 1000 * Q_coal / 3600) * combustionEfficiency;

// Efek ke sistem:
// - Boiler Temp naik (thermal inertia)
// - Steam Flow naik (pressure driven)
// - Combustion Speed naik (linear)
```

**🧮 Output ke UI:** `CombustionSpeed`, `BoilerPressure`, `SteamTemp`, `SteamFlow`, `SteamOutTurbine`

### 2. Feedwater (Air masuk boiler)
**🔁 Input:** `feedWaterPct: number (0–100%)`

**🔬 Rumus:**
```typescript
// Debit air masuk boiler
const FeedWaterFlow = (feedWaterPct / 100) * maxWaterFlowRate;
const waterLevelChange = (FeedWaterFlow - evaporationRate) * dt;

// Efek ke sistem:
// - Menaikkan Water Level
// - Menurunkan suhu jika terlalu dingin
// - Mempengaruhi tekanan boiler
```

**🧮 Output:** `WaterLevel`, `CoolingWater`, `BoilerPressure`

### 3. Air Supply (Pasokan udara)
**🔁 Input:** `airSupplyPct: number (0–100%)`

**🔬 Rumus:**
```typescript
// Rasio stoikiometri untuk pembakaran optimal
const AirFuelRatio = airSupply / Math.max(coalFeed, 1);
const optimalRatio = 15.5; // Stoichiometric ratio untuk coal
const combustionEfficiency = Math.max(0.7, 1 - Math.abs(AirFuelRatio - optimalRatio) / optimalRatio);

// Efek:
// - Terlalu sedikit → incomplete combustion (efisiensi turun)
// - Terlalu banyak → energi hilang
// - Optimal → efisiensi maksimal
```

**🧮 Output:** `CombustionSpeed`, `Efficiency`, `ExhaustGas`

### 4. Fuel Injection (tambahan bahan bakar cair/gas)
**🔁 Input:** `fuelInjectionPct: number (0–100%)`

**🔬 Rumus:**
```typescript
// Boosting cepat untuk SteamTemp
const boostHeat = (fuelInjectionPct / 100) * maxBoostHeat;
const steamTempBoost = boostHeat * responseTime;

// Efek:
// - SteamTemp naik cepat
// - Biaya operasional naik drastis
// - Efisiensi turun (over-firing)
```

**🧮 Output:** `SteamTemp`, `Efficiency`, `OperatingCost`

### 5. Boiler Pressure (kontrol tekanan)
**🔁 Input:** `boilerPressureSetpoint: number (0–100%)`

**🔬 Rumus:**
```typescript
// Sistem kontrol PID untuk tekanan boiler
const pressureError = boilerPressureSetpoint - currentBoilerPressure;
const pressureResponse = pressureError * PID_gain;

if (currentPressure < setpoint) {
    // Increase combustion / close valve
    combustionRate += pressureResponse * dt;
} else {
    // Open valve / reduce heat
    valveOpening += pressureResponse * dt;
}
```

**🧮 Output:** `BoilerPressure`, `SteamFlow`, `ValvePosition`

### 6. Steam Turbine Speed
**🔁 Input:** `turbineThrottlePct: number (0–100%)`

**🔬 Rumus:**
```typescript
// Tenaga turbin berdasarkan aliran uap
const steamMassFlow = (steamFlow / 100) * maxSteamFlow;
const turbinePower = η_turbine × steamMassFlow × (h_steam_in - h_steam_out);

// Energi listrik yang dihasilkan
const PowerOutput = TurbineSpeed × Torque × η_generator;
const turbineRPM = f(steamMassFlow, steamTemp, steamPressure);
```

**🧮 Output:** `TurbineRPM`, `PowerOutput`, `Load`, `Frequency`

### 7. Condenser
**🔁 Input:** `condenserEffPct: number (0–100%)`

**🔬 Rumus:**
```typescript
// Efisiensi kondensasi
const condenserEfficiency = condenserEffPct / 100;
const T_condensate = T_steam_out - (condenserEfficiency × ΔT_max);

// Heat transfer di kondensor
const Q_condenser = steamMassFlow * (h_steam_in - h_condensate);
```

**🧮 Output:** `CondenserOut`, `CondensateFlow`, `CondenserTemp`

### 8. Cooling Water
**🔁 Input:** `coolingWaterPct: number (0–100%)`

**🔬 Rumus:**
```typescript
// Efek langsung pada efisiensi kondensor
const coolingWaterFlow = (coolingWaterPct / 100) * maxCoolingWaterFlow;
const CondenserTemp = f(CoolingWaterFlow, steamTemp);

// Heat transfer coefficient
const U_condenser = f(coolingWaterFlow, condenserDesign);
```

**🧮 Output:** `CoolingWater`, `CondenserOut`, `CoolingWaterTemp`

### 9. Emergency Valve (Katup Darurat)
**🔁 Input:** `emergencyValveState: boolean`

**🔬 Rumus:**
```typescript
// Trip instan jika tekanan > ambang batas
const pressureThreshold = 18.0; // MPa
const emergencyTrip = (boilerPressure > pressureThreshold) || emergencyValveState;

if (emergencyTrip) {
    // Shutdown semua sistem
    boilerPressure = 0;
    turbineSpeed = 0;
    steamFlow = 0;
    powerOutput = 0;
}
```

**🧮 Output:** Semua sistem shutdown, `BoilerPressure = 0`, `TurbineSpeed = 0`

## 📊 INDIKATOR UI & PERHITUNGAN

| Indikator | Rumus / Sumber |
|-----------|----------------|
| **Main Steam Flow** | `Dari SteamFlow lever + fungsi tekanan dan suhu` |
| **Main Steam Press** | `Dari boiler PID kontrol + efek CoalFeed, AirSupply` |
| **Main Steam Temp** | `Hasil pembakaran dari CoalFeed, AirSupply, FuelInjection` |
| **Turbine Speed (RPM)** | `Fungsi dari SteamFlow dan SteamTemp` |
| **Condensate Flow** | `Turunan dari CondenserEff + CoolingWater` |
| **Oil Tank Level** | `Bisa diatur tetap jika tak digunakan` |
| **Load & Frequency** | `Dari TurbineSpeed → PowerOutput → Load` |
| **Revenue** | `PowerOutput × Tarif_per_MWh × time` |
| **Water Level** | `Dari Feedwater + evaporasi akibat HeatEnergy` |

## 💡 CONTOH ALGORITMA SIMPLIFIKASI (Pseudocode)

```typescript
function updateBoilerState() {
  const heatInput = (coalFeed / 100) * maxCoalFeed * calorificValue * combustionEfficiency;
  const waterFlow = (feedWater / 100) * maxWaterFlow;
  
  // Boiler pressure naik jika heat > water capacity
  boilerPressure += (heatInput - waterFlow * specificHeat) * dt;
  steamTemp = f(boilerPressure);
}

function updateTurbineState() {
  const steamMassFlow = (steamFlow / 100) * maxSteamFlow;
  turbineRPM += (steamMassFlow * (steamTemp - condenserTemp)) * dt;
  powerOutput = turbineRPM * constant * generatorEfficiency;
}

function updateCondenser() {
  condenserTemp = steamOutTemp - (coolingWater / 100) * maxDeltaT;
}
```

## ✅ 1. Interpolasi Bertahap (Inersia Sistem)

**🔁 Tuas ke nilai aktual:**
Misal tuas `coalFeed = 100%`, tapi realisasi fisiknya tidak langsung 100%. Kita buat variabel `actualCoalFeed` yang menuju target secara bertahap.

**🔧 Rumus (Interpolasi Eksponensial):**
```typescript
// target: nilai tuas user
// current: nilai aktual dalam sistem
// smoothFactor: 0.01 - 0.2 (semakin kecil semakin lambat)
// dt: delta time per update (detik)

function smoothApproach(current: number, target: number, smoothFactor: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-smoothFactor * dt));
}

// Contoh implementasi:
const actualCoalFeed = smoothApproach(actualCoalFeed, coalFeedTarget, 0.05, deltaTime);
const actualFeedwater = smoothApproach(actualFeedwater, feedwaterTarget, 0.08, deltaTime);
const actualRPM = smoothApproach(actualRPM, rpmTarget, 0.03, deltaTime);
const actualSteamTemp = smoothApproach(actualSteamTemp, steamTempTarget, 0.04, deltaTime);
```

## 🔄 2. Response Time Realistik

**⏱️ Waktu Respons Sistem:**
```typescript
const SYSTEM_RESPONSE_TIMES = {
  boiler: 60,      // Boiler: 60 detik (thermal inertia besar)
  turbine: 30,     // Turbin: 30 detik (mechanical inertia)
  steam: 45,       // Steam system: 45 detik (flow dynamics)
  water: 90,       // Water system: 90 detik (paling lambat)
  temperature: 40, // Temperature: 40 detik (thermal inertia)
  pressure: 20     // Pressure: 20 detik (lebih cepat)
};
```

## 🧮 3. Perhitungan Daya & Pendapatan

**⚡ Rumus Daya:**
```typescript
// Daya dalam MWatt
const PowerOutput = (Temperature × Pressure × RPM) / 1,000,000;

// Pendapatan dalam Rupiah
const Earnings = PowerOutput × 1,000,000 × Duration(hours) × Tarif_per_MWh;
```

## 🎯 4. Implementasi di Code

**📁 File Utama:**
- `src/store/simulatorStore.ts` - State management & kontrol
- `src/utils/calculation.ts` - Algoritma fisika & perhitungan
- `src/components/ControlLever.tsx` - UI kontrol tuas
- `src/components/IndicatorPanel.tsx` - Display indikator

**🔄 Flow Data:**
1. User gerakkan tuas → `ControlLever.tsx`
2. Update state → `simulatorStore.ts`
3. Hitung fisika → `calculation.ts`
4. Update UI → `IndicatorPanel.tsx`

---

**🎮 Simulasi PLTU Realistik** - Menggabungkan kontrol interaktif dengan fisika termodinamika yang akurat! 🚀 