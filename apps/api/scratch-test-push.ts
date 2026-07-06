/**
 * One-off diagnostic script — NOT part of the app, delete after use.
 *
 * Verifies the full task-assignment push notification path end-to-end:
 *   tasksService.create() -> notifyUsers() -> Notification row + BullMQ job
 *   -> notification.worker.ts -> Expo push -> your physical device.
 *
 * Usage (from apps/api/):
 *   npx tsx scratch-test-push.ts check              # read-only: is there a push token to target?
 *   npx tsx scratch-test-push.ts run                # creates a real test task, waits for the push job to finish
 *   npx tsx scratch-test-push.ts cleanup             # deletes the test task + its notifications (reverts DB)
 */
import { prisma } from './src/config/database.js';
import { redis, bullRedis } from './src/config/redis.js';
import { tasksService } from './src/modules/tasks/tasks.service.js';
import { notificationWorker } from './src/jobs/workers/notification.worker.js';
import fs from 'node:fs';
import path from 'node:path';

const STATE_FILE = path.join(process.cwd(), '.scratch-test-push-state.json');
const EMPLOYEE_EMPLOYEE_ID = 'EMP001';
const CREATOR_EMPLOYEE_ID = 'ADM001'; // "CS Admin" — same department as EMP001

async function findTargets() {
  const employee = await prisma.user.findFirst({
    where: { employeeId: EMPLOYEE_EMPLOYEE_ID, isActive: true },
    select: { id: true, name: true, departmentId: true },
  });
  const creator = await prisma.user.findFirst({
    where: { employeeId: CREATOR_EMPLOYEE_ID, isActive: true },
    select: { id: true, name: true },
  });
  const tokens = employee
    ? await prisma.pushToken.findMany({ where: { userId: employee.id } })
    : [];
  return { employee, creator, tokens };
}

async function cmdCheck() {
  const { employee, creator, tokens } = await findTargets();
  console.log('Employee:', employee);
  console.log('Creator (task assigner):', creator);
  console.log('Registered push tokens for employee:', tokens);
  if (!employee || !creator) {
    console.log('\n❌ Missing employee or creator account — check employeeIds match your seed data.');
  } else if (tokens.length === 0) {
    console.log('\n⚠️  No push token yet. Install the new build, log in as this employee, then re-run `check`.');
  } else {
    console.log('\n✅ Ready — run `npx tsx scratch-test-push.ts run` next.');
  }
}

async function cmdRun() {
  const { employee, creator, tokens } = await findTargets();
  if (!employee || !creator) throw new Error('Employee or creator account not found — run `check` first.');
  if (tokens.length === 0) {
    console.log('❌ No push token registered for this employee yet.');
    console.log('   Install the build, log in as the employee on a physical device, then re-run.');
    return;
  }

  console.log(`Creating test task assigned to ${employee.name} (${employee.id})...`);

  const jobResult = new Promise<'completed' | 'failed'>((resolve) => {
    const onCompleted = (job: { name: string }) => {
      if (job.name === 'send') {
        cleanupListeners();
        resolve('completed');
      }
    };
    const onFailed = (job: { name: string } | undefined) => {
      if (job?.name === 'send') {
        cleanupListeners();
        resolve('failed');
      }
    };
    const cleanupListeners = () => {
      notificationWorker.off('completed', onCompleted);
      notificationWorker.off('failed', onFailed);
    };
    notificationWorker.on('completed', onCompleted);
    notificationWorker.on('failed', onFailed);
  });

  const task = await tasksService.create({
    title: '[TEST] Push notification check — safe to ignore',
    description: 'Created by scratch-test-push.ts to verify Expo push delivery. Will be deleted.',
    priority: 'MEDIUM',
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    assigneeId: employee.id,
    ...(employee.departmentId ? { departmentId: employee.departmentId } : {}),
    creatorId: creator.id,
  });

  fs.writeFileSync(STATE_FILE, JSON.stringify({ taskId: task.id }, null, 2));
  console.log(`Task created: ${task.id}`);
  console.log('Waiting up to 15s for the push job to be processed by the worker...');

  const timeout = new Promise<'timeout'>((resolve) => setTimeout(() => resolve('timeout'), 15_000));
  const result = await Promise.race([jobResult, timeout]);

  if (result === 'completed') {
    console.log('\n✅ Push job processed without error by notification.worker.ts.');
    console.log('   Check the physical device now — you should see a "Task assigned" notification.');
  } else if (result === 'failed') {
    console.log('\n❌ Push job failed — check the error logged above by notification.worker.ts.');
  } else {
    console.log('\n⚠️  Timed out waiting for the job. Is the API server (with this worker) running elsewhere?');
    console.log('   This script starts its own worker instance, so a separate `pnpm dev` isn\'t required,');
    console.log('   but if a job stayed queued, Redis/Expo may be slow — check again in a few seconds.');
  }

  console.log(`\nWhen done checking your phone, run: npx tsx scratch-test-push.ts cleanup`);
}

async function cmdCleanup() {
  if (!fs.existsSync(STATE_FILE)) {
    console.log('No state file found — nothing to clean up (or already cleaned).');
    return;
  }
  const { taskId } = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8')) as { taskId: string };

  const deletedNotifications = await prisma.notification.deleteMany({ where: { taskId } });
  // TaskActivity cascades automatically via the schema's onDelete: Cascade.
  await prisma.task.delete({ where: { id: taskId } }).catch((err) => {
    console.error('Failed to delete test task — it may already be gone:', err.message);
  });

  fs.unlinkSync(STATE_FILE);
  console.log(`Deleted test task ${taskId} and ${deletedNotifications.count} notification row(s).`);
  console.log('DB reverted. (The registered push token is real device state and was left untouched.)');
}

async function main() {
  const cmd = process.argv[2];
  try {
    if (cmd === 'check') await cmdCheck();
    else if (cmd === 'run') await cmdRun();
    else if (cmd === 'cleanup') await cmdCleanup();
    else console.log('Usage: npx tsx scratch-test-push.ts <check|run|cleanup>');
  } finally {
    await notificationWorker.close();
    await prisma.$disconnect();
    redis.disconnect();
    bullRedis.disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
