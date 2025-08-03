# PLTU Paiton Unit 4 Simulator

An interactive visual simulator for the Paiton Unit 4 Steam Power Plant (PLTU), designed to simulate operational controls and real-time monitoring of a coal-fired power plant.

## 🎯 Project Overview

This simulator provides a virtual control room experience for PLTU operations, allowing users to:
- Control 12 operational levers representing critical power plant parameters
- Monitor real-time indicators including temperature, pressure, RPM, power output
- Experience realistic physics-based simulation with gradual response times
- Track operational earnings and system efficiency
- Learn about steam power plant operations through hands-on interaction

## ✨ Key Features

### 🕹️ Interactive Controls
- **12 Control Levers**: Coal feed, feedwater, boiler pressure, steam turbine, condenser, cooling water, air supply, fuel injection, steam flow, water level, exhaust gas, emergency valve
- **Gradual Movement**: Realistic response times with smooth transitions (2-25 seconds depending on control type)
- **Touch Support**: Fully compatible with mobile and tablet devices
- **Arrow Controls**: Precise step-by-step adjustment with arrow buttons

### 📊 Real-Time Monitoring
- **Main Indicators**: Steam flow, pressure, temperature, turbine speed, load, frequency
- **SCADA Indicators**: 20+ interconnected parameters including:
  - Steam properties (flow, pressure, temperature)
  - Equipment temperatures (generator, oil cooler, heaters)
  - Water systems (circulating water, feedwater, condensate)
  - Performance metrics (efficiency, heat rate, emissions)
- **Operational Metrics**: Total wattage produced, coal loading rate, combustion speed, water loading rate, water boiling rate

### 🔬 Physics-Based Simulation
- **Realistic Response Times**: System delays based on actual PLTU behavior (10-45 seconds)
- **Complex Interactions**: All controls affect multiple indicators through physical laws
- **Gradual Changes**: Exponential decay interpolation for smooth, realistic transitions
- **Thermodynamic Calculations**: Steam properties, boiler efficiency, turbine work
- **Fluid Dynamics**: Water flow, steam generation, condenser heat transfer
- **Electrical Systems**: Generator efficiency, frequency control, load management
- **Environmental Impact**: CO2 emissions calculation, heat rate analysis

### 💰 Revenue Tracking
- **Real-time Earnings**: Rp1 per 100 KWatt calculation
- **Operational Timer**: Tracks system runtime and accumulated revenue
- **Performance Metrics**: Efficiency monitoring and optimization feedback

## 🛠️ Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Physics Engine**: Custom thermodynamic calculations

## 📁 Project Structure

```
pltu-simulator/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Main application page
│   │   ├── layout.tsx            # Root layout
│   │   └── globals.css           # Global styles
│   ├── components/
│   │   ├── ControlLever.tsx      # Interactive control levers
│   │   ├── HeaderPanel.tsx       # SCADA header with main indicators
│   │   ├── Stopwatch.tsx         # Operational timer
│   │   └── EarningsCounter.tsx   # Revenue display
│   ├── store/
│   │   └── simulatorStore.ts     # Zustand state management
│   ├── utils/
│   │   └── calculation.ts        # Physics and calculation engine
│   └── types/
│       └── index.ts              # TypeScript type definitions
├── public/                       # Static assets
└── package.json                  # Dependencies and scripts
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pltu-simulator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

### Build for Production
```bash
npm run build
npm start
```

## 🎮 How to Use

### Starting the System
1. Click "Start System" to begin simulation
2. The stopwatch will start counting operational time
3. Revenue calculation begins based on power output

### Controlling the Plant
1. **Drag Levers**: Click and drag any control lever to adjust values
2. **Arrow Controls**: Use arrow buttons for precise adjustments
3. **Real-time Response**: Watch indicators change gradually based on physics
4. **Monitor Status**: Check system status panel for equipment conditions

### Key Controls
- **Coal Feed**: Controls fuel input to boiler
- **Feedwater**: Manages water supply to boiler
- **Boiler Pressure**: Regulates steam pressure
- **Steam Turbine**: Controls turbine speed and power output
- **Emergency Valve**: Emergency pressure relief system

### Understanding Indicators
- **Green Values**: Normal operating range
- **Yellow/Orange**: Approaching limits
- **Red Values**: Critical conditions requiring attention
- **Status Indicators**: Equipment operational status

## 🔬 Physics Simulation Details

### Thermodynamic Model
The simulator implements realistic steam power plant physics:

- **Steam Properties**: Temperature, pressure, enthalpy calculations
- **Boiler Efficiency**: Based on air-fuel ratio, water level, coal feed
- **Turbine Work**: Isentropic expansion with efficiency losses
- **Heat Transfer**: Condenser and feedwater heating calculations

### Interconnected Systems
All controls affect multiple indicators through complex physical laws:
- **Coal Feed** → Combustion → Heat Transfer → Steam Generation → Turbine Power → Electrical Output
- **Air Supply** → Air-Fuel Ratio → Combustion Efficiency → Heat Input → Temperature Response
- **Feedwater** → Water Level → Heat Transfer → Steam Pressure → Turbine Efficiency
- **Steam Turbine** → Valve Opening → Steam Flow → Mechanical Power → Generator Load
- **Cooling Water** → Condenser Performance → Back Pressure → Turbine Efficiency
- **Emergency Valve** → Pressure Relief → System Safety → Trip Conditions

### Response Times
Realistic delays simulate actual power plant behavior:
- **Pressure Changes** (20s): Steam pressure responds moderately fast
- **Temperature Changes** (40s): Thermal inertia causes slower response
- **Steam System** (45s): Steam flow and generation delays
- **Turbine Response** (30s): Mechanical system inertia
- **Boiler Response** (60s): Large thermal mass causes very slow response
- **Water System** (90s): Water level and flow changes are slowest

## 📱 Responsive Design

The simulator is fully responsive across all devices:
- **Mobile**: Portrait and landscape optimized
- **Tablet**: Touch-friendly controls and readable indicators
- **Desktop**: Full SCADA interface with detailed monitoring

## 🎯 Educational Applications

This simulator is designed for:
- **Technical Training**: Operator training and certification
- **Educational Institutions**: Engineering and technical education
- **Exhibitions**: Public demonstrations of power generation
- **Research**: Power plant optimization and efficiency studies

## 🔧 Customization

### Adding New Controls
1. Define lever in `src/types/index.ts`
2. Add to `initialLevers` in store
3. Implement physics calculations in `src/utils/calculation.ts`
4. Add UI component in `src/components/`

### Modifying Physics
1. Edit constants in `src/utils/calculation.ts`
2. Adjust calculation functions for different plant types
3. Update response times in store configuration

### Styling Changes
1. Modify Tailwind classes in components
2. Update color schemes in `src/app/globals.css`
3. Adjust responsive breakpoints as needed

## 🐛 Troubleshooting

### Common Issues
- **Port 3000 in use**: Application will automatically use next available port
- **Build errors**: Ensure all dependencies are installed with `npm install`
- **Performance issues**: Check browser console for memory leaks

### Development Tips
- Use browser dev tools to monitor state changes
- Check network tab for any failed requests
- Monitor console for TypeScript errors

## 📄 License

This project is developed for educational and training purposes.

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For questions or support, please contact the development team.

---

**Note**: This simulator is for educational purposes and does not represent actual PLTU Paiton Unit 4 operations. Always follow proper safety procedures in real power plant environments.
