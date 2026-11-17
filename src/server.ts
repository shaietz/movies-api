import { createApp } from './app';
import { connectDB } from './config/db';
import { env } from './config/env';

async function main() {
  await connectDB(env.MONGO_URI);
  const app = createApp();
  app.listen(env.PORT, () => {
    console.log(`Server running on http://localhost:${env.PORT}`);
    console.log(`Swagger docs at http://localhost:${env.PORT}/api-docs`);
  });
}

main().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
