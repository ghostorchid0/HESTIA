require('dotenv').config();
const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const config = require('./config');
const menuRoutes = require('./routes/menu');
const roomRoutes = require('./routes/room');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const pushRoutes = require('./routes/push');
const settingsRoutes = require('./routes/settings');
const reviewsRoutes = require('./routes/reviews');
const demoRoutes = require('./routes/demo');
const seedData = require('./seed');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: config.clientUrl } });

app.set('io', io);
app.use(cors({ origin: config.clientUrl }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/room', roomRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/demo', demoRoutes);
app.use('/api/admin', adminRoutes);

if (process.env.NODE_ENV === 'production') {
  const isServerDir = path.basename(__dirname) === 'server';
  const projectRoot = isServerDir ? path.join(__dirname, '..') : __dirname;
  const staticDir = path.join(projectRoot, 'client/dist');
  app.use(express.static(staticDir));
  app.get('*', (req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

let memoryServer = null;

async function connectWithRetry(uri, retries = 5, delayMs = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(uri);
      return;
    } catch (err) {
      console.error(`MongoDB connection attempt ${attempt}/${retries} failed:`, err.message);
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
}

async function startDatabase() {
  let uri = config.mongoUri;
  if (config.useMemoryDb) {
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri();
    console.log('Using in-memory MongoDB:', uri);
  }
  await connectWithRetry(uri);
  console.log('MongoDB connected');
  await seedData();
}

mongoose.connection.on('error', (err) => {
  console.error('MongoDB runtime error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected');
});

let dbReadyPromise = startDatabase().catch(err => {
  console.error('Fatal: unable to start database:', err.message);
  process.exit(1);
});

if (process.env.NODE_ENV !== 'test') {
  dbReadyPromise.then(() => {
    server.listen(config.port, () => console.log(`Server running on port ${config.port}`));
  });
}

io.on('connection', (socket) => {
  socket.on('join_room_channel', (roomUuid) => {
    socket.join(`room_${roomUuid}`);
  });
  socket.on('join_kitchen', () => {
    socket.join('kitchen');
  });
});

function gracefulShutdown(signal) {
  console.log(`${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await mongoose.connection.close(false);
    if (memoryServer) await memoryServer.stop();
    process.exit(0);
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = { app, server, memoryServer: () => memoryServer, dbReadyPromise };
