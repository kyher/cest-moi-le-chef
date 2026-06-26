-- CreateEnum
CREATE TYPE "Day" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateTable
CREATE TABLE "WeeklyPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeeklyPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanEntry" (
    "id" TEXT NOT NULL,
    "weeklyPlanId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "day" "Day" NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyPlan_userId_key" ON "WeeklyPlan"("userId");

-- AddForeignKey
ALTER TABLE "WeeklyPlan" ADD CONSTRAINT "WeeklyPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanEntry" ADD CONSTRAINT "PlanEntry_weeklyPlanId_fkey" FOREIGN KEY ("weeklyPlanId") REFERENCES "WeeklyPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanEntry" ADD CONSTRAINT "PlanEntry_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
