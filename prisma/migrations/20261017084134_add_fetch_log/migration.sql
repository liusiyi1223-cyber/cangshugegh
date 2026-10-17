-- CreateTable
CREATE TABLE "FetchLog" (
    "id" TEXT NOT NULL,
    "platform" TEXT,
    "url" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FetchLog_pkey" PRIMARY KEY ("id")
);
