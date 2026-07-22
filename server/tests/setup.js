const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
process.env.USE_MEMORY_DB = 'true';

beforeAll(async () => {
  const { dbReadyPromise } = require('../server');
  await dbReadyPromise;
});

afterAll(async () => {
  await mongoose.connection.close(false);
});
