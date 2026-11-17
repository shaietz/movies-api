/**
 * Database lifecycle for integration + api tests.
 *
 * By default starts a throwaway in-memory MongoDB (mongodb-memory-server).
 * If MONGO_TEST_URI is set, uses that server instead (e.g. `docker compose up -d`
 * and MONGO_TEST_URI=mongodb://127.0.0.1:27017). Each test file gets its own database.
 */
import * as os from 'os';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let memoryServer: MongoMemoryServer | undefined;

beforeAll(async () => {
  let uri = process.env.MONGO_TEST_URI;
  if (!uri) {
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri();
  }
  const dbName = `test_${process.pid}_${Math.random().toString(36).slice(2, 8)}`;
  await mongoose.connect(uri, { dbName, runtimeAdapters: { os } });
  await mongoose.connection.syncIndexes(); // make unique indexes active before tests run
});

afterEach(async () => {
  const collections = await mongoose.connection.db!.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await memoryServer?.stop();
});
