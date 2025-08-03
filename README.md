# PLTU Simulator - Pembangkit Listrik Tenaga Uap Paiton Unit 4

## 📌 Tujuan Proyek

Simulator visual interaktif dari sistem pembangkit listrik tenaga uap (PLTU) Paiton Unit 4 yang mensimulasikan perilaku dan kontrol operasional PLTU seperti tuas daya, indikator suhu/tekanan, dan akumulasi output listrik.

## 🚀 Fitur Utama

### 🕹️ Kontrol Interaktif
- **12 Tuas Kontrol** yang dapat diatur secara real-time
- **Drag & Drop** interface untuk mengatur parameter
- **Touchscreen Support** untuk mobile dan tablet
- **Visual Feedback** dengan animasi smooth

### 📊 Panel Indikator Real-Time
- **Temperatur**: 0 – 1200°C
- **Tekanan**: 0 – 150 bar  
- **RPM Turbin**: 0 – 3500 RPM
- **Daya Output**: 0 – 500 MWatt
- **Stopwatch**: durasi operasional
- **Total Pendapatan**: akumulasi dalam Rupiah

### ⚙️ Parameter Kontrol
1. **Coal Feed** - Pasokan batu bara ke boiler
2. **Feedwater** - Sirkulasi air ke boiler
3. **Boiler Pressure** - Tekanan boiler
4. **Steam Turbine** - Kecepatan turbin uap
5. **Condenser** - Kondensasi uap
6. **Cooling Water** - Air pendingin
7. **Air Supply** - Pasokan udara pembakaran
8. **Fuel Injection** - Injeksi bahan bakar
9. **Steam Flow** - Aliran uap ke turbin
10. **Water Level** - Level air dalam boiler
11. **Exhaust Gas** - Gas buang
12. **Emergency Valve** - Katup darurat

## 🛠️ Teknologi yang Digunakan

- **Framework**: Next.js 14 dengan TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Animasi**: Framer Motion
- **Responsive Design**: Mobile-first approach

## 📦 Instalasi

### Prerequisites
- Node.js 18+ 
- npm atau yarn

### Langkah Instalasi

```bash
# Clone repository
git clone <repository-url>
cd pltu-simulator

# Install dependencies
npm install

# Run development server
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000`

### Build untuk Production

```bash
# Build aplikasi
npm run build

# Start production server
npm start
```

## 🎮 Cara Penggunaan

### 1. Memulai Simulator
- Klik tombol **"Start System"** untuk mengaktifkan sistem
- Timer akan mulai berjalan dan pendapatan mulai terakumulasi

### 2. Mengatur Parameter
- **Drag** tuas kontrol ke atas/bawah untuk mengatur nilai
- Setiap tuas mempengaruhi parameter sistem secara real-time
- Indikator akan berubah sesuai dengan pengaturan tuas

### 3. Monitoring Sistem
- **Panel Indikator** menampilkan nilai real-time
- **Stopwatch** menunjukkan durasi operasional
- **Earnings Counter** menampilkan total pendapatan

### 4. Kontrol Sistem
- **Shutdown**: Hentikan sistem (timer berhenti)
- **Restart**: Reset semua parameter ke nilai awal

## 📈 Logika Perhitungan

### Rumus Daya
```
Power (MWatt) = (Temperature × Pressure × RPM) / 1,000,000
```

### Rumus Pendapatan
```
Earnings (Rupiah) = Power (MWatt) × 1,000,000 × Duration (hours)
```

### Parameter Pengaruh
- **Temperatur**: Dipengaruhi oleh coal feed, fuel injection, air supply
- **Tekanan**: Dipengaruhi oleh boiler pressure, steam flow, emergency valve
- **RPM**: Dipengaruhi oleh steam turbine, steam flow, condenser

## 🎯 Tujuan Edukasi

Simulator ini dirancang untuk:

- **Pelatihan Teknisi/Operator PLTU**
- **Proyek Edukasi SMK/Kampus Teknik**
- **Pameran Visualisasi Energi**
- **Penelitian & Proof of Concept**

## 📱 Responsive Design

- **Desktop**: Layout penuh dengan semua kontrol
- **Tablet**: Layout yang dioptimalkan untuk touchscreen
- **Mobile**: Layout vertikal dengan kontrol yang mudah diakses

## 🔧 Development

### Struktur Direktori
```
src/
├── components/          # Komponen React
│   ├── ControlLever.tsx
│   ├── IndicatorPanel.tsx
│   ├── Stopwatch.tsx
│   └── EarningsCounter.tsx
├── store/              # State management
│   └── simulatorStore.ts
├── types/              # TypeScript definitions
│   └── index.ts
├── utils/              # Utility functions
│   └── calculation.ts
└── app/                # Next.js app router
    └── page.tsx
```

### Menambah Tuas Kontrol Baru

1. Tambahkan definisi di `src/types/index.ts`
2. Update `src/store/simulatorStore.ts`
3. Tambahkan logika perhitungan di `src/utils/calculation.ts`

## 🤝 Kontribusi

Kontribusi sangat diterima! Silakan:

1. Fork repository
2. Buat feature branch
3. Commit perubahan
4. Push ke branch
5. Buat Pull Request

## 📄 Lisensi

Proyek ini dibuat untuk tujuan edukasi dan pelatihan.

## 📞 Kontak

Untuk pertanyaan atau saran, silakan hubungi tim pengembang.

---

**PLTU Simulator** - Membuat pembelajaran teknik energi menjadi interaktif dan menyenangkan! 🚀 