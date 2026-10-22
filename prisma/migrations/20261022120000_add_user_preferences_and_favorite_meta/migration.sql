-- AlterTable
ALTER TABLE "User" ADD COLUMN     "preferences" JSONB;

-- AlterTable
ALTER TABLE "Favorite" ADD COLUMN     "visitCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "icon" TEXT;
