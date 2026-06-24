import 'dotenv/config';
import express    from 'express';
import cors       from 'cors';
import mongoose   from 'mongoose';

import { connectMqtt } from './mqtt.js';

import authRoutes        from './routes/auth.routes.js';
import usersRoutes       from './routes/users.routes.js';
import compressorsRoutes from './routes/compressors.routes.js';
import sensorsRoutes     from './routes/sensors.routes.js';
import alarmsRoutes      from './routes/alarms.routes.js';
import logsRoutes        from './routes/logs.routes.js';
import airDryerRoutes    from './routes/airDryer.routes.js';
import settingsRoutes    from './routes/settings.routes.js';

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }));
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/users',       usersRoutes);
app.use('/api/compressors', compressorsRoutes);
app.use('/api/sensors',     sensorsRoutes);
app.use('/api/alarms',      alarmsRoutes);
app.use('/api/logs',        logsRoutes);
app.use('/api/air-dryers',  airDryerRoutes);
app.use('/api/settings',    settingsRoutes);

app.get('/api/health', (_, res) => res.json({ ok: true, ts: new Date() }));

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Internal server error' });
});

// ── MongoDB + start ───────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log(`✅ MongoDB connected → ${process.env.MONGODB_URI}`);
    app.listen(process.env.PORT, () => {
      console.log(`🚀 Server running on http://localhost:${process.env.PORT}`);
      connectMqtt();
    });
  })
  .catch(err => { console.error('❌ MongoDB connection failed:', err.message); process.exit(1); });
