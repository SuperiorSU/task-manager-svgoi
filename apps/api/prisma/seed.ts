import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const hash = (p: string) => bcrypt.hash(p, 12);

// ─── Helpers ────────────────────────────────────────────────────────────────

const past = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d;
};

const future = (daysAhead: number) => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d;
};

async function main() {
  console.log('🌱  Seeding database...');

  // ─── Departments ──────────────────────────────────────────────────────────

  const [deptCS, deptECE, deptME, deptPhysics, deptChemistry, deptAdmin] =
    await Promise.all([
      prisma.department.upsert({
        where: { code: 'CS' },
        update: {},
        create: {
          name: 'Computer Science',
          code: 'CS',
          description: 'Department of Computer Science & Engineering — handles IT, software, and digital infrastructure tasks.',
        },
      }),
      prisma.department.upsert({
        where: { code: 'ECE' },
        update: {},
        create: {
          name: 'Electronics & Communication',
          code: 'ECE',
          description: 'Department of Electronics & Communication Engineering — manages lab equipment, curriculum, and research coordination.',
        },
      }),
      prisma.department.upsert({
        where: { code: 'ME' },
        update: {},
        create: {
          name: 'Mechanical Engineering',
          code: 'ME',
          description: 'Department of Mechanical Engineering — workshop, machine maintenance, and project coordination.',
        },
      }),
      prisma.department.upsert({
        where: { code: 'PHY' },
        update: {},
        create: {
          name: 'Physics',
          code: 'PHY',
          description: 'Department of Applied Physics — basic sciences teaching and lab management.',
        },
      }),
      prisma.department.upsert({
        where: { code: 'CHEM' },
        update: {},
        create: {
          name: 'Chemistry',
          code: 'CHEM',
          description: 'Department of Applied Chemistry — chemical lab safety, procurement, and curriculum tasks.',
        },
      }),
      prisma.department.upsert({
        where: { code: 'ADMIN' },
        update: {},
        create: {
          name: 'Administration',
          code: 'ADMIN',
          description: 'Central administration — HR, finance, scheduling, and institutional coordination.',
        },
      }),
    ]);

  console.log('✅  Departments created');

  // ─── Super Admin ──────────────────────────────────────────────────────────

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@svgoi.godigitify.com' },
    update: {},
    create: {
      email: 'superadmin@svgoi.godigitify.com',
      passwordHash: await hash('SuperAdmin@123'),
      name: 'Dr. Ramesh Iyer',
      employeeId: 'SA001',
      role: 'SUPER_ADMIN',
      designation: 'Principal & System Administrator',
      isActive: true,
    },
  });

  // ─── Admins (HODs) ────────────────────────────────────────────────────────

  const [adminCS, adminECE, adminME, adminPhy, adminChem, adminAdmin] =
    await Promise.all([
      prisma.user.upsert({
        where: { email: 'hod.cs@svgoi.godigitify.com' },
        update: {},
        create: {
          email: 'hod.cs@svgoi.godigitify.com',
          passwordHash: await hash('Admin@123456'),
          name: 'Dr. Raj Kumar',
          employeeId: 'CS_HOD',
          role: 'ADMIN',
          designation: 'Head of Department — CS',
          departmentId: deptCS.id,
          isActive: true,
        },
      }),
      prisma.user.upsert({
        where: { email: 'hod.ece@svgoi.godigitify.com' },
        update: {},
        create: {
          email: 'hod.ece@svgoi.godigitify.com',
          passwordHash: await hash('Admin@123456'),
          name: 'Dr. Priya Sharma',
          employeeId: 'ECE_HOD',
          role: 'ADMIN',
          designation: 'Head of Department — ECE',
          departmentId: deptECE.id,
          isActive: true,
        },
      }),
      prisma.user.upsert({
        where: { email: 'hod.me@svgoi.godigitify.com' },
        update: {},
        create: {
          email: 'hod.me@svgoi.godigitify.com',
          passwordHash: await hash('Admin@123456'),
          name: 'Prof. Suresh Patil',
          employeeId: 'ME_HOD',
          role: 'ADMIN',
          designation: 'Head of Department — ME',
          departmentId: deptME.id,
          isActive: true,
        },
      }),
      prisma.user.upsert({
        where: { email: 'hod.phy@svgoi.godigitify.com' },
        update: {},
        create: {
          email: 'hod.phy@svgoi.godigitify.com',
          passwordHash: await hash('Admin@123456'),
          name: 'Dr. Anita Joshi',
          employeeId: 'PHY_HOD',
          role: 'ADMIN',
          designation: 'Head of Department — Physics',
          departmentId: deptPhysics.id,
          isActive: true,
        },
      }),
      prisma.user.upsert({
        where: { email: 'hod.chem@svgoi.godigitify.com' },
        update: {},
        create: {
          email: 'hod.chem@svgoi.godigitify.com',
          passwordHash: await hash('Admin@123456'),
          name: 'Dr. Vikram Nair',
          employeeId: 'CHEM_HOD',
          role: 'ADMIN',
          designation: 'Head of Department — Chemistry',
          departmentId: deptChemistry.id,
          isActive: true,
        },
      }),
      prisma.user.upsert({
        where: { email: 'admin@svgoi.godigitify.com' },
        update: {},
        create: {
          email: 'admin@svgoi.godigitify.com',
          passwordHash: await hash('Admin@123456'),
          name: 'Mrs. Meera Desai',
          employeeId: 'ADMIN_HOD',
          role: 'ADMIN',
          designation: 'Administrative Officer',
          departmentId: deptAdmin.id,
          isActive: true,
        },
      }),
    ]);

  console.log('✅  Admin (HOD) users created');

  // ─── Employees ────────────────────────────────────────────────────────────

  const empHash = await hash('Employee@123');

  const [emp1, emp2, emp3, emp4, emp5] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'arjun.mehta@svgoi.godigitify.com' },
      update: {},
      create: {
        email: 'arjun.mehta@svgoi.godigitify.com',
        passwordHash: empHash,
        name: 'Arjun Mehta',
        employeeId: 'CS001',
        role: 'EMPLOYEE',
        designation: 'Assistant Professor',
        departmentId: deptCS.id,
        managerId: adminCS.id,
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'sneha.reddy@svgoi.godigitify.com' },
      update: {},
      create: {
        email: 'sneha.reddy@svgoi.godigitify.com',
        passwordHash: empHash,
        name: 'Sneha Reddy',
        employeeId: 'ECE001',
        role: 'EMPLOYEE',
        designation: 'Lab Technician',
        departmentId: deptECE.id,
        managerId: adminECE.id,
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'rahul.verma@svgoi.godigitify.com' },
      update: {},
      create: {
        email: 'rahul.verma@svgoi.godigitify.com',
        passwordHash: empHash,
        name: 'Rahul Verma',
        employeeId: 'ME001',
        role: 'EMPLOYEE',
        designation: 'Workshop Instructor',
        departmentId: deptME.id,
        managerId: adminME.id,
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'pooja.singh@svgoi.godigitify.com' },
      update: {},
      create: {
        email: 'pooja.singh@svgoi.godigitify.com',
        passwordHash: empHash,
        name: 'Pooja Singh',
        employeeId: 'CS002',
        role: 'EMPLOYEE',
        designation: 'Junior Developer',
        departmentId: deptCS.id,
        managerId: adminCS.id,
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'kiran.kumar@svgoi.godigitify.com' },
      update: {},
      create: {
        email: 'kiran.kumar@svgoi.godigitify.com',
        passwordHash: empHash,
        name: 'Kiran Kumar',
        employeeId: 'ADMIN001',
        role: 'EMPLOYEE',
        designation: 'Office Coordinator',
        departmentId: deptAdmin.id,
        managerId: adminAdmin.id,
        isActive: false, // Suspended for demo
      },
    }),
  ]);

  console.log('✅  Employees created');

  // ─── Set department heads ─────────────────────────────────────────────────

  await Promise.all([
    prisma.department.update({ where: { id: deptCS.id }, data: { headId: adminCS.id } }),
    prisma.department.update({ where: { id: deptECE.id }, data: { headId: adminECE.id } }),
    prisma.department.update({ where: { id: deptME.id }, data: { headId: adminME.id } }),
    prisma.department.update({ where: { id: deptPhysics.id }, data: { headId: adminPhy.id } }),
    prisma.department.update({ where: { id: deptChemistry.id }, data: { headId: adminChem.id } }),
    prisma.department.update({ where: { id: deptAdmin.id }, data: { headId: adminAdmin.id } }),
  ]);

  // ─── Seed default permissions ─────────────────────────────────────────────

  const ADMIN_PERMISSIONS = [
    'task:create', 'task:read:all', 'task:update:all', 'task:update:status',
    'task:assign', 'task:reassign', 'task:bulk', 'user:create', 'user:read',
    'user:update', 'user:deactivate', 'report:view', 'report:download',
  ];

  const EMPLOYEE_PERMISSIONS = ['task:read:own', 'task:update:status'];

  await prisma.userPermission.createMany({
    data: [
      ...Object.values({ t: 'task:create', ta: 'task:read:all', tu: 'task:update:all', tus: 'task:update:status', tas: 'task:assign', tre: 'task:reassign', tb: 'task:bulk', uc: 'user:create', ur: 'user:read', uu: 'user:update', ud: 'user:deactivate', dm: 'dept:manage', rv: 'report:view', rd: 'report:download', av: 'audit:view', sc: 'system:config' }).map((p) => ({ userId: superAdmin.id, permission: p })),
      ...ADMIN_PERMISSIONS.map((p) => ({ userId: adminCS.id, permission: p })),
      ...ADMIN_PERMISSIONS.map((p) => ({ userId: adminECE.id, permission: p })),
      ...ADMIN_PERMISSIONS.map((p) => ({ userId: adminME.id, permission: p })),
      ...ADMIN_PERMISSIONS.map((p) => ({ userId: adminPhy.id, permission: p })),
      ...ADMIN_PERMISSIONS.map((p) => ({ userId: adminChem.id, permission: p })),
      ...ADMIN_PERMISSIONS.map((p) => ({ userId: adminAdmin.id, permission: p })),
      ...EMPLOYEE_PERMISSIONS.map((p) => ({ userId: emp1.id, permission: p })),
      ...EMPLOYEE_PERMISSIONS.map((p) => ({ userId: emp2.id, permission: p })),
      ...EMPLOYEE_PERMISSIONS.map((p) => ({ userId: emp3.id, permission: p })),
      ...EMPLOYEE_PERMISSIONS.map((p) => ({ userId: emp4.id, permission: p })),
      ...EMPLOYEE_PERMISSIONS.map((p) => ({ userId: emp5.id, permission: p })),
    ],
    skipDuplicates: true,
  });

  console.log('✅  Permissions seeded');

  // ─── Tasks ────────────────────────────────────────────────────────────────

  const taskDefs = [
    // CS dept — completed
    {
      title: 'Set up department portal server',
      description: 'Configure Nginx, SSL certificates, and deploy the new CS department portal.',
      priority: 'CRITICAL' as const, status: 'COMPLETED' as const,
      dueDate: past(10), completedAt: past(8),
      creatorId: adminCS.id, assigneeId: emp1.id, departmentId: deptCS.id,
    },
    {
      title: 'Update student lab machines to Ubuntu 22.04',
      priority: 'HIGH' as const, status: 'COMPLETED' as const,
      dueDate: past(5), completedAt: past(3),
      creatorId: adminCS.id, assigneeId: emp4.id, departmentId: deptCS.id,
    },
    // CS dept — in progress
    {
      title: 'Create Python lab exercise module',
      description: 'Develop 20 graded Python exercises covering OOP and data structures.',
      priority: 'HIGH' as const, status: 'IN_PROGRESS' as const,
      dueDate: future(7),
      creatorId: adminCS.id, assigneeId: emp1.id, departmentId: deptCS.id,
    },
    {
      title: 'Prepare semester timetable for Q3',
      priority: 'MEDIUM' as const, status: 'IN_PROGRESS' as const,
      dueDate: future(3),
      creatorId: superAdmin.id, assigneeId: emp4.id, departmentId: deptCS.id,
    },
    // CS dept — overdue
    {
      title: 'Submit NAAC self-assessment report — CS section',
      priority: 'CRITICAL' as const, status: 'PENDING' as const,
      dueDate: past(2),
      creatorId: superAdmin.id, assigneeId: adminCS.id, departmentId: deptCS.id,
    },
    // ECE dept — completed
    {
      title: 'Calibrate oscilloscopes in Lab 3',
      priority: 'HIGH' as const, status: 'COMPLETED' as const,
      dueDate: past(8), completedAt: past(6),
      creatorId: adminECE.id, assigneeId: emp2.id, departmentId: deptECE.id,
    },
    {
      title: 'Procure 50 breadboards for practicals',
      priority: 'MEDIUM' as const, status: 'COMPLETED' as const,
      dueDate: past(12), completedAt: past(10),
      creatorId: adminECE.id, assigneeId: emp2.id, departmentId: deptECE.id,
    },
    // ECE dept — under review
    {
      title: 'Update lab safety manual with new SOPs',
      priority: 'HIGH' as const, status: 'UNDER_REVIEW' as const,
      dueDate: future(2),
      creatorId: adminECE.id, assigneeId: emp2.id, departmentId: deptECE.id,
    },
    // ECE dept — overdue
    {
      title: 'Audit component inventory — ECE stores',
      priority: 'MEDIUM' as const, status: 'ACCEPTED' as const,
      dueDate: past(3),
      creatorId: adminECE.id, assigneeId: emp2.id, departmentId: deptECE.id,
    },
    // ME dept — in progress
    {
      title: 'Service the CNC milling machine',
      priority: 'CRITICAL' as const, status: 'IN_PROGRESS' as const,
      dueDate: future(4),
      creatorId: adminME.id, assigneeId: emp3.id, departmentId: deptME.id,
    },
    {
      title: 'Prepare lathe machine SOP document',
      priority: 'MEDIUM' as const, status: 'PENDING' as const,
      dueDate: future(10),
      creatorId: adminME.id, assigneeId: emp3.id, departmentId: deptME.id,
    },
    // ME dept — completed
    {
      title: 'Schedule preventive maintenance for welding sets',
      priority: 'LOW' as const, status: 'COMPLETED' as const,
      dueDate: past(15), completedAt: past(12),
      creatorId: adminME.id, assigneeId: emp3.id, departmentId: deptME.id,
    },
    // Physics dept — pending
    {
      title: 'Order spectrometer replacement parts',
      priority: 'HIGH' as const, status: 'PENDING' as const,
      dueDate: future(5),
      creatorId: adminPhy.id, assigneeId: adminPhy.id, departmentId: deptPhysics.id,
    },
    {
      title: 'Prepare optics lab manual update',
      priority: 'MEDIUM' as const, status: 'IN_PROGRESS' as const,
      dueDate: future(14),
      creatorId: adminPhy.id, assigneeId: adminPhy.id, departmentId: deptPhysics.id,
    },
    // Chemistry dept — completed
    {
      title: 'Dispose expired reagents following CPCB guidelines',
      priority: 'CRITICAL' as const, status: 'COMPLETED' as const,
      dueDate: past(20), completedAt: past(18),
      creatorId: adminChem.id, assigneeId: adminChem.id, departmentId: deptChemistry.id,
    },
    {
      title: 'Stock annual chemical consumables',
      priority: 'HIGH' as const, status: 'COMPLETED' as const,
      dueDate: past(7), completedAt: past(5),
      creatorId: adminChem.id, assigneeId: adminChem.id, departmentId: deptChemistry.id,
    },
    // Administration dept — in progress
    {
      title: 'Prepare payroll report for June 2026',
      priority: 'HIGH' as const, status: 'IN_PROGRESS' as const,
      dueDate: future(1),
      creatorId: superAdmin.id, assigneeId: adminAdmin.id, departmentId: deptAdmin.id,
    },
    {
      title: 'Coordinate mid-semester exam scheduling',
      priority: 'CRITICAL' as const, status: 'ACCEPTED' as const,
      dueDate: future(6),
      creatorId: superAdmin.id, assigneeId: adminAdmin.id, departmentId: deptAdmin.id,
    },
    // Cross-department task
    {
      title: 'Submit institute AISHE data report 2025-26',
      description: 'Collect data from all departments and submit to AISHE portal before the deadline.',
      priority: 'CRITICAL' as const, status: 'PENDING' as const,
      dueDate: future(8),
      creatorId: superAdmin.id, assigneeId: adminAdmin.id, departmentId: deptAdmin.id,
    },
    // CS — under review
    {
      title: 'Code review and deploy student attendance system',
      priority: 'HIGH' as const, status: 'UNDER_REVIEW' as const,
      dueDate: future(3),
      creatorId: adminCS.id, assigneeId: emp1.id, departmentId: deptCS.id,
    },
  ];

  for (const def of taskDefs) {
    const { completedAt, ...rest } = def as typeof def & { completedAt?: Date };
    await prisma.task.create({
      data: {
        ...rest,
        priority: rest.priority as never,
        status: rest.status as never,
        ...(completedAt ? { completedAt } : {}),
        ...(rest.status !== 'PENDING' ? { acceptedAt: past(Math.floor(Math.random() * 5 + 1)) } : {}),
      },
    });
  }

  console.log(`✅  ${taskDefs.length} tasks created`);

  // ─── Notifications ────────────────────────────────────────────────────────

  const tasks = await prisma.task.findMany({ select: { id: true }, take: 5 });

  if (tasks.length > 0) {
    await prisma.notification.createMany({
      data: [
        {
          userId: emp1.id,
          type: 'TASK_ASSIGNED' as const,
          title: 'New task assigned',
          body: 'You have been assigned "Create Python lab exercise module"',
          taskId: tasks[2]?.id ?? null,
          isRead: false,
        },
        {
          userId: emp1.id,
          type: 'TASK_DUE_SOON' as const,
          title: 'Task due soon',
          body: '"Prepare semester timetable for Q3" is due in 3 days',
          taskId: tasks[3]?.id ?? null,
          isRead: false,
        },
        {
          userId: adminCS.id,
          type: 'TASK_OVERDUE' as const,
          title: 'Overdue task alert',
          body: '"Submit NAAC self-assessment report" is overdue by 2 days',
          taskId: tasks[4]?.id ?? null,
          isRead: false,
        },
        {
          userId: superAdmin.id,
          type: 'TASK_COMPLETED' as const,
          title: 'Task completed',
          body: 'Arjun Mehta completed "Set up department portal server"',
          taskId: tasks[0]?.id ?? null,
          isRead: true,
        },
        {
          userId: adminECE.id,
          type: 'TASK_STATUS_CHANGED' as const,
          title: 'Status update',
          body: '"Update lab safety manual" is now Under Review',
          taskId: tasks[7]?.id ?? null,
          isRead: false,
        },
      ],
      skipDuplicates: true,
    });
  }

  console.log('✅  Notifications seeded');

  // ─── Summary ──────────────────────────────────────────────────────────────

  console.log('\n📋  Seed Complete — credentials:\n');
  console.log('  Super Admin  : superadmin@svgoi.godigitify.com  / SuperAdmin@123');
  console.log('  CS HOD Admin : hod.cs@svgoi.godigitify.com     / Admin@123456');
  console.log('  ECE HOD Admin: hod.ece@svgoi.godigitify.com    / Admin@123456');
  console.log('  Employee (CS): arjun.mehta@svgoi.godigitify.com / Employee@123');
  console.log('  Employee (CS): pooja.singh@svgoi.godigitify.com / Employee@123');
  console.log('  Suspended    : kiran.kumar@svgoi.godigitify.com / Employee@123');
  console.log('\n  All other HODs: <code>@svgoi.godigitify.com / Admin@123456');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
