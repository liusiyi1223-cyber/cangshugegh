-- AlterTable
ALTER TABLE "User" ADD COLUMN "openid" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_openid_key" ON "User"("openid");
