-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "Like_recipeId_idx" ON "Like"("recipeId");

-- CreateIndex
CREATE INDEX "Note_recipeId_idx" ON "Note"("recipeId");

-- CreateIndex
CREATE INDEX "Note_userId_idx" ON "Note"("userId");

-- CreateIndex
CREATE INDEX "PlanEntry_weeklyPlanId_idx" ON "PlanEntry"("weeklyPlanId");

-- CreateIndex
CREATE INDEX "PlanEntry_recipeId_idx" ON "PlanEntry"("recipeId");

-- CreateIndex
CREATE INDEX "Recipe_userId_idx" ON "Recipe"("userId");

-- CreateIndex
CREATE INDEX "Recipe_forkedFromId_idx" ON "Recipe"("forkedFromId");

-- CreateIndex
CREATE INDEX "RecipeTag_tagId_idx" ON "RecipeTag"("tagId");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Tag_userId_idx" ON "Tag"("userId");
