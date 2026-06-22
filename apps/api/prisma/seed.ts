import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const superAdminHash = await bcrypt.hash('SuperAdmin@123', 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@svgoi.godigitify.com' },
    update: {},
    create: {
      email: 'superadmin@svgoi.godigitify.com',
      passwordHash: superAdminHash,
      name: 'Super Admin',
      employeeId: 'SA001',
      role: 'SUPER_ADMIN',
      designation: 'System Administrator',
    },
  });

  const csDept = await prisma.department.upsert({
    where: { code: 'CS' },
    update: {},
    create: {
      name: 'Computer Science',
      code: 'CS',
      description: 'Computer Science Department',
    },
  });

  const adminHash = await bcrypt.hash('Admin@123456', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin.cs@svgoi.godigitify.com' },
    update: {},
    create: {
      email: 'admin.cs@svgoi.godigitify.com',
      passwordHash: adminHash,
      name: 'CS Admin',
      employeeId: 'ADM001',
      role: 'ADMIN',
      designation: 'Department Head',
      departmentId: csDept.id,
    },
  });

  const empHash = await bcrypt.hash('Employee@123', 12);
  await prisma.user.upsert({
    where: { email: 'employee@svgoi.godigitify.com' },
    update: {},
    create: {
      email: 'employee@svgoi.godigitify.com',
      passwordHash: empHash,
      name: 'Test Employee',
      employeeId: 'EMP001',
      role: 'EMPLOYEE',
      designation: 'Lab Assistant',
      departmentId: csDept.id,
      managerId: admin.id,
    },
  });

  await prisma.department.update({
    where: { id: csDept.id },
    data: { headId: admin.id },
  });

  console.log('Seed complete.');
  console.log(`Super Admin: superadmin@svgoi.godigitify.com / SuperAdmin@123`);
  console.log(`Admin (CS): admin.cs@svgoi.godigitify.com / Admin@123456`);
  console.log(`Employee: employee@svgoi.godigitify.com / Employee@123`);

  void superAdmin;
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
