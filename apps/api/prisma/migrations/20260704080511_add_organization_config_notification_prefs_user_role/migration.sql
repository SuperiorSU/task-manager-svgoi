-- CreateTable
CREATE TABLE "OrganizationConfig" (
    "id" TEXT NOT NULL,
    "singleton" INTEGER NOT NULL DEFAULT 1,
    "orgName" TEXT NOT NULL DEFAULT 'SVGOI',
    "allowCrossDeptEmployeeAssignment" BOOLEAN NOT NULL DEFAULT true,
    "workingDays" JSONB NOT NULL DEFAULT '[1,2,3,4,5,6]',
    "workingHoursStart" TEXT NOT NULL DEFAULT '09:00',
    "workingHoursEnd" TEXT NOT NULL DEFAULT '17:00',
    "weeklyHoliday" INTEGER NOT NULL DEFAULT 0,
    "defaultPriority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "defaultDueWindowDays" INTEGER NOT NULL DEFAULT 3,
    "taskCategories" JSONB NOT NULL DEFAULT '[]',
    "requireProofOfWork" BOOLEAN NOT NULL DEFAULT true,
    "autoApproveLowPriority" BOOLEAN NOT NULL DEFAULT false,
    "onRejection" TEXT NOT NULL DEFAULT 'REASSIGN_TO_CREATOR',
    "approverScope" TEXT NOT NULL DEFAULT 'DEPT_ADMIN',
    "reviewWithinHours" INTEGER NOT NULL DEFAULT 24,
    "escalateOverdueReviews" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mutedTypes" JSONB NOT NULL DEFAULT '[]',
    "quietHoursEnabled" BOOLEAN NOT NULL DEFAULT false,
    "quietHoursStart" TEXT NOT NULL DEFAULT '22:00',
    "quietHoursEnd" TEXT NOT NULL DEFAULT '07:00',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationConfig_singleton_key" ON "OrganizationConfig"("singleton");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
