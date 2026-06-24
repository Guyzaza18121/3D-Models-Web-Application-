# FOSTEC FIM — 3D Factory Monitoring Web Application

> ระบบตรวจสอบและควบคุมโรงงานแบบ Real-Time 3D สำหรับเครื่องอัดอากาศ (Air Compressor) และระบบสนับสนุน พร้อมเชื่อมต่อ MQTT / Node-RED

## Features

- **3D Overview** — แสดงภาพมุมมองโรงงาน 3 มิติ (React Three Fiber / Three.js) พร้อม Object แต่ละเครื่อง
- **Dashboard** — ภาพรวม Real-Time แสดงค่าตัวแปรหลัก (Pressure, Flow, kW, etc.)
- **Compressors** — จัดการเครื่องอัดอากาศหลายเครื่อง ดูสถานะ RUNNING / STANDBY / FAULT
- **Air Dryer** — ตรวจสอบและควบคุมระบบลดความชื้น
- **Sensor System** — รองรับ sensor หลายประเภท (Pressure, Flow, Temperature, Humidity, Dew Point, Vibration, Current, Voltage, Power, Level, Speed)
- **Sequence Control** — ควบคุมลำดับการทำงานของเครื่องอัตโนมัติ (AUTO) หรือ Manual
- **Energy** — ติดตามพลังงานและประสิทธิภาพการใช้ไฟ
- **Alarms** — ระบบแจ้งเตือนระดับ CRITICAL / FAULT / WARNING / INFO พร้อม Log
- **System Log** — บันทึกเหตุการณ์ SEQUENCE, CONTROL, ALARM, AUTH, CONFIG, SYSTEM
- **Settings** — ตั้งค่าระบบ (Setpoint, Deadband, Demand, PID)
- **Users & Roles** — ระบบ Login พร้อมสิทธิ์ 4 ระดับ: ADMIN / ENGINEER / OPERATOR / VIEWER

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite + React Three Fiber (Three.js) + Lucide React |
| Backend | Node.js + Express |
| Database | MongoDB (Mongoose) |
| Realtime | MQTT (mqtt.js) + Node-RED |
| Simulation | PID Controller (built-in simulation mode) |

## Project Structure

```
├── src/                     # React Frontend
│   ├── components/          # UI Components (Overview, Login, Gauge, etc.)
│   ├── pages/               # Page views (Dashboard, Compressors, Alarms, ...)
│   ├── api/                 # API clients & MQTT client
│   ├── hooks/               # Custom hooks (useAlarms, useLogs, useSimulation, ...)
│   ├── constants/           # Design tokens, NAV, roles, sensor configs
│   ├── mocks/               # Mock data & simulation service
│   ├── models/              # Data models
│   └── services/            # Business logic (PID service)
│
├── pplook-server/           # Node.js Backend
│   ├── models/              # Mongoose schemas (User, Alarm, Sensor, ...)
│   ├── routes/              # REST API routes
│   ├── middleware/          # Auth middleware
│   ├── mqtt.js              # MQTT broker connection
│   └── server.js            # Express entry point
│
└── public/                  # Static assets (images, 3D models, icons)
```

## Quick Start

### Frontend

```bash
npm install
npm run dev
```

### Backend

```bash
cd pplook-server
npm install
npm start
```

> ตั้งค่า `.env` สำหรับ MongoDB URI, MQTT broker, และ JWT secret ตาม `.env.example`

## MQTT / Node-RED Integration

- ระบบเชื่อมต่อ MQTT broker เพื่อรับ Telemetry และส่งคำสั่งควบคุม
- รองรับ Node-RED Dashboard สำหรับแสดงผลและควบคุมผ่านหน้า Web
- Simulation mode สำหรับทดสอบโดยไม่ต้องต่อ Hardware จริง

## Screenshots

- `public/dashboard.png` — Dashboard overview
- `public/air.jpg` — Air system diagram
- `public/sensor.png` — Sensor layout
- `public/enerygy.png` — Energy monitoring
- `public/seq.png` — Sequence control
- `public/airdry.jpg` — Air dryer panel

## License

Private — FOSTEC Internal Use
