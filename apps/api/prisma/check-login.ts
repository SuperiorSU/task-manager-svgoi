/** Dev diagnostic: does `Password@123` match each seed account's stored hash? */
import bcrypt from 'bcryptjs';

import { prisma } from '../src/config/database.js';

const PASSWORD = 'Password@123';
const IDS = ['SA001', 'ADM001', 'ADM002', 'EMP001', 'EMP002', 'EMP003'];

async function main() {
  const users = await prisma.user.findMany({
    where: { employeeId: { in: IDS } },
    select: { employeeId: true, email: true, isActive: true, passwordHash: true },
  });
  if (users.length === 0) {
    console.log('No seed accounts found — has the DB been seeded?');
    return;
  }
  for (const u of users) {
    const matches = await bcrypt.compare(PASSWORD, u.passwordHash);
    console.log(
      `${u.employeeId}  active=${u.isActive}  "${PASSWORD}" matches=${matches}  (hash starts ${u.passwordHash.slice(0, 7)})`
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
