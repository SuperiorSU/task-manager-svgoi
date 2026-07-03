-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "integrityHash" TEXT,
ADD COLUMN     "previousHash" TEXT;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "batchId" TEXT,
ADD COLUMN     "isGovernance" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "DepartmentSettings" (
    "id" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "workingDays" JSONB NOT NULL DEFAULT '[1,2,3,4,5]',
    "workingHoursStart" TEXT NOT NULL DEFAULT '09:00',
    "workingHoursEnd" TEXT NOT NULL DEFAULT '18:00',
    "weeklyHoliday" INTEGER NOT NULL DEFAULT 0,
    "defaultPriority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "defaultDueWindowDays" INTEGER NOT NULL DEFAULT 3,
    "membersSeeOnlyOwnTasks" BOOLEAN NOT NULL DEFAULT false,
    "taskCategories" JSONB NOT NULL DEFAULT '[]',
    "requireProofOfWork" BOOLEAN NOT NULL DEFAULT true,
    "autoApproveLowPriority" BOOLEAN NOT NULL DEFAULT false,
    "onRejection" TEXT NOT NULL DEFAULT 'REASSIGN_TO_CREATOR',
    "approverScope" TEXT NOT NULL DEFAULT 'DEPT_ADMIN',
    "reviewWithinHours" INTEGER NOT NULL DEFAULT 24,
    "escalateOverdueReviews" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepartmentSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskBatch" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "isolationNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "creatorId" TEXT NOT NULL,
    "departmentId" TEXT,

    CONSTRAINT "TaskBatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DepartmentSettings_departmentId_key" ON "DepartmentSettings"("departmentId");

-- CreateIndex
CREATE INDEX "TaskBatch_creatorId_idx" ON "TaskBatch"("creatorId");

-- CreateIndex
CREATE INDEX "TaskBatch_departmentId_idx" ON "TaskBatch"("departmentId");

-- CreateIndex
CREATE INDEX "Task_batchId_idx" ON "Task"("batchId");

-- CreateIndex
CREATE INDEX "Task_isGovernance_idx" ON "Task"("isGovernance");

-- AddForeignKey
ALTER TABLE "DepartmentSettings" ADD CONSTRAINT "DepartmentSettings_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "TaskBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskBatch" ADD CONSTRAINT "TaskBatch_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskBatch" ADD CONSTRAINT "TaskBatch_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
