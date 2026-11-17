/**
 * Creates the first admin account from ADMIN_* env variables.
 * Admins can't be created through the public /auth/register endpoint.
 *
 *   npm run seed:admin
 */
import { connectDB, disconnectDB } from '../src/config/db';
import { env } from '../src/config/env';
import { UserModel } from '../src/modules/users/user.model';
import { hashPassword } from '../src/shared/utils/password';

async function seedAdmin() {
  const { ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_USERNAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('ADMIN_USERNAME, ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
  }

  await connectDB(env.MONGO_URI);

  const existing = await UserModel.findOne({ email: ADMIN_EMAIL.toLowerCase() });
  if (existing) {
    if (existing.role !== 'admin') {
      existing.role = 'admin';
      await existing.save();
      console.log(`Promoted existing user ${ADMIN_EMAIL} to admin`);
    } else {
      console.log(`Admin ${ADMIN_EMAIL} already exists`);
    }
  } else {
    await UserModel.create({
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
      password: await hashPassword(ADMIN_PASSWORD),
      role: 'admin',
    });
    console.log(`Created admin ${ADMIN_EMAIL}`);
  }

  await disconnectDB();
}

seedAdmin().catch(async (err) => {
  console.error(err);
  await disconnectDB();
  process.exit(1);
});
