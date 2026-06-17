-- Add userId to Note, backfilling from the recipe owner
ALTER TABLE "Note" ADD COLUMN "userId" TEXT;

UPDATE "Note"
SET "userId" = (SELECT "userId" FROM "Recipe" WHERE "Recipe"."id" = "Note"."recipeId");

ALTER TABLE "Note" ALTER COLUMN "userId" SET NOT NULL;

ALTER TABLE "Note" ADD CONSTRAINT "Note_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
