// ⚠️  DEVELOPMENT-ONLY SEED SCRIPT
// This script creates mock users with hardcoded passwords.
// Do NOT run in production or when Node-RED is managing real devices.
// Use only for local frontend development without a real PLC/backend.

import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt   from 'bcryptjs';

import User           from '../models/User.js';
import Compressor     from '../models/Compressor.js';
import Sensor         from '../models/Sensor.js';
import AirDryer       from '../models/AirDryer.js';
import SystemSettings from '../models/SystemSettings.js';

// ── Seed data (mirrors src/constants/index.js) ────────────────────────────────

const USERS = [
  { un: 'admin',    pw: 'admin123',  name: 'ผู้ดูแลระบบ',   role: 'ADMIN'    },
  { un: 'engineer', pw: 'eng123',    name: 'วิศวกรระบบ',    role: 'ENGINEER' },
  { un: 'operator', pw: 'op123',     name: 'พนักงานควบคุม', role: 'OPERATOR' },
  { un: 'viewer',   pw: 'view123',   name: 'ผู้ชมรายงาน',   role: 'VIEWER'   },
];

const COMP_COLORS = ['#3B82F6','#0EA5E9','#6366F1','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899'];

const COMPRESSORS = [
  { brand:'Atlas Copco',    model:'GA22+',   type:'Screw',     kw:22, flow:3.7, seq:1 },
  { brand:'Ingersoll Rand', model:'R11i',    type:'Screw',     kw:11, flow:1.8, seq:2 },
  { brand:'Kaeser',         model:'SM15',    type:'VFD Screw', kw:15, flow:2.2, seq:3 },
  { brand:'CompAir',        model:'L37RS',   type:'Screw',     kw:37, flow:6.1, seq:4 },
  { brand:'Sullair',        model:'LS20',    type:'Screw',     kw:18, flow:2.9, seq:5 },
  { brand:'Boge',           model:'C20',     type:'Screw',     kw:15, flow:2.4, seq:6 },
  { brand:'Hitachi',        model:'SRL-22',  type:'VFD Screw', kw:22, flow:3.5, seq:7 },
  { brand:'Kobelco',        model:'AG370A',  type:'Screw',     kw:37, flow:5.8, seq:8 },
].map((c, i) => ({
  ...c,
  name:        c.model,
  maxPressure: 10,
  voltage:     380,
  clr:         COMP_COLORS[i % COMP_COLORS.length],
  note:        '',
  status:      'STANDBY',
  load:        0,
  curr:        0,
  temp:        Math.floor(38 + Math.random() * 12),
  press:       0,
  lead:        i === 0,
  hrs:         Math.floor(200 + Math.random() * 7800),
  fault:       '',
}));

const SENSORS = [
  { name:'Pressure Sensor 1', type:'Pressure', location:'Header Main',      unit:'bar',    value:7.0,  min:0,   max:12,  ok:true, clr:'#3B82F6' },
  { name:'Pressure Sensor 2', type:'Pressure', location:'Header Branch A',  unit:'bar',    value:7.0,  min:0,   max:12,  ok:true, clr:'#10B981' },
  { name:'Flow Meter 1',      type:'Flow',     location:'Outlet Main',       unit:'m³/min', value:3.5,  min:0,   max:15,  ok:true, clr:'#F59E0B' },
  { name:'Temp Sensor 1',     type:'Temp',     location:'Room Ambient',      unit:'°C',     value:28,   min:-10, max:60,  ok:true, clr:'#EF4444' },
  { name:'Dew Point 1',       type:'DewPoint', location:'Dryer Outlet',      unit:'°C',     value:-20,  min:-40, max:10,  ok:true, clr:'#8B5CF6' },
];

// ── Main seed ─────────────────────────────────────────────────────────────────

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Users
  await User.deleteMany({});
  const hashed = await Promise.all(
    USERS.map(async u => ({ ...u, pwHash: await bcrypt.hash(u.pw, 10), pw: undefined }))
  );
  await User.insertMany(hashed);
  console.log(`✅ Seeded ${hashed.length} users`);

  // Compressors
  await Compressor.deleteMany({});
  await Compressor.insertMany(COMPRESSORS);
  console.log(`✅ Seeded ${COMPRESSORS.length} compressors`);

  // Sensors
  await Sensor.deleteMany({});
  await Sensor.insertMany(SENSORS);
  console.log(`✅ Seeded ${SENSORS.length} sensors`);

  // Air Dryer
  await AirDryer.deleteMany({});
  await AirDryer.create({ name:'Air Dryer 1', status:'RUNNING', temp:32, maxTemp:45, voltage:380, flow:2.1, clr:'#06B6D4' });
  console.log('✅ Seeded 1 air dryer');

  // System Settings
  await SystemSettings.deleteMany({});
  await SystemSettings.create({ _id:'system', sp:7.0, db:0.3, demand:1.8, seqMode:'AUTO', pidKp:0.8, pidKi:0.12, pidKd:0.05 });
  console.log('✅ Seeded system settings');

  console.log('\n🎉 Seed complete. Run: npm run dev');
  process.exit(0);
}

seed().catch(err => { console.error('❌ Seed failed:', err); process.exit(1); });
