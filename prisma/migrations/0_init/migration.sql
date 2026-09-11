-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'REPAIRER', 'ADMIN');

-- CreateEnum
CREATE TYPE "DeviceCategory" AS ENUM ('SMARTPHONE', 'LAPTOP', 'TABLET', 'HEADPHONES', 'MONITOR');

-- CreateEnum
CREATE TYPE "DeviceCondition" AS ENUM ('EXCELLENT', 'GOOD', 'FAIR', 'DEGRADED', 'CRITICAL');

-- CreateEnum
CREATE TYPE "UrgencyLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('REQUESTED', 'ACCEPTED', 'DIAGNOSING', 'WAITING_FOR_PART', 'REPAIRING', 'TESTING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RecommendedAction" AS ENUM ('REPAIR', 'DIY', 'REPLACE', 'RESELL', 'RECYCLE');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('ACCEPTED', 'DIAGNOSING', 'WAITING_FOR_PART', 'REPAIRING', 'TESTING', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "DeviceCategory" NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "purchaseDate" TIMESTAMP(3),
    "purchasePrice" DOUBLE PRECISION,
    "warrantyExpiry" TIMESTAMP(3),
    "currentValue" DOUBLE PRECISION,
    "condition" "DeviceCondition" NOT NULL DEFAULT 'GOOD',
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepairRequest" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "urgency" "UrgencyLevel" NOT NULL DEFAULT 'MEDIUM',
    "status" "RequestStatus" NOT NULL DEFAULT 'REQUESTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RepairRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Diagnosis" (
    "id" TEXT NOT NULL,
    "repairRequestId" TEXT NOT NULL,
    "issueCategory" TEXT NOT NULL,
    "possibleIssue" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "evidence" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Diagnosis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepairRecommendation" (
    "id" TEXT NOT NULL,
    "repairRequestId" TEXT NOT NULL,
    "repairabilityScore" DOUBLE PRECISION NOT NULL,
    "economicScore" DOUBLE PRECISION NOT NULL,
    "recommendedAction" "RecommendedAction" NOT NULL,
    "estimatedCostMin" DOUBLE PRECISION NOT NULL,
    "estimatedCostMax" DOUBLE PRECISION NOT NULL,
    "reasoning" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RepairRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Repairer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalJobs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Repairer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepairerSpecialization" (
    "id" TEXT NOT NULL,
    "repairerId" TEXT NOT NULL,
    "deviceCategory" "DeviceCategory" NOT NULL,
    "brand" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,

    CONSTRAINT "RepairerSpecialization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "repairRequestId" TEXT NOT NULL,
    "repairerId" TEXT NOT NULL,
    "estimatedCost" DOUBLE PRECISION NOT NULL,
    "estimatedDays" INTEGER NOT NULL,
    "notes" TEXT,
    "status" "QuoteStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepairJob" (
    "id" TEXT NOT NULL,
    "repairRequestId" TEXT NOT NULL,
    "repairerId" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'ACCEPTED',
    "agreedCost" DOUBLE PRECISION NOT NULL,
    "actualCost" DOUBLE PRECISION,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RepairJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepairHistory" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "repairJobId" TEXT NOT NULL,
    "repairType" TEXT NOT NULL,
    "issue" TEXT NOT NULL,
    "partsReplaced" TEXT[],
    "cost" DOUBLE PRECISION NOT NULL,
    "repairerId" TEXT NOT NULL,
    "repairDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'VERIFIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RepairHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "repairJobId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "repairerId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "Device_userId_idx" ON "Device"("userId");

-- CreateIndex
CREATE INDEX "Device_category_idx" ON "Device"("category");

-- CreateIndex
CREATE INDEX "Device_serialNumber_idx" ON "Device"("serialNumber");

-- CreateIndex
CREATE INDEX "RepairRequest_deviceId_idx" ON "RepairRequest"("deviceId");

-- CreateIndex
CREATE INDEX "RepairRequest_userId_idx" ON "RepairRequest"("userId");

-- CreateIndex
CREATE INDEX "RepairRequest_status_idx" ON "RepairRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Diagnosis_repairRequestId_key" ON "Diagnosis"("repairRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "RepairRecommendation_repairRequestId_key" ON "RepairRecommendation"("repairRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "Repairer_userId_key" ON "Repairer"("userId");

-- CreateIndex
CREATE INDEX "Repairer_verificationStatus_idx" ON "Repairer"("verificationStatus");

-- CreateIndex
CREATE INDEX "Repairer_rating_idx" ON "Repairer"("rating");

-- CreateIndex
CREATE INDEX "RepairerSpecialization_repairerId_idx" ON "RepairerSpecialization"("repairerId");

-- CreateIndex
CREATE INDEX "RepairerSpecialization_deviceCategory_brand_idx" ON "RepairerSpecialization"("deviceCategory", "brand");

-- CreateIndex
CREATE INDEX "Quote_repairRequestId_idx" ON "Quote"("repairRequestId");

-- CreateIndex
CREATE INDEX "Quote_repairerId_idx" ON "Quote"("repairerId");

-- CreateIndex
CREATE INDEX "Quote_status_idx" ON "Quote"("status");

-- CreateIndex
CREATE UNIQUE INDEX "RepairJob_repairRequestId_key" ON "RepairJob"("repairRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "RepairJob_quoteId_key" ON "RepairJob"("quoteId");

-- CreateIndex
CREATE INDEX "RepairJob_repairerId_idx" ON "RepairJob"("repairerId");

-- CreateIndex
CREATE INDEX "RepairJob_status_idx" ON "RepairJob"("status");

-- CreateIndex
CREATE UNIQUE INDEX "RepairHistory_repairJobId_key" ON "RepairHistory"("repairJobId");

-- CreateIndex
CREATE INDEX "RepairHistory_deviceId_idx" ON "RepairHistory"("deviceId");

-- CreateIndex
CREATE INDEX "RepairHistory_repairerId_idx" ON "RepairHistory"("repairerId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_repairJobId_key" ON "Review"("repairJobId");

-- CreateIndex
CREATE INDEX "Review_repairerId_idx" ON "Review"("repairerId");

-- CreateIndex
CREATE INDEX "Review_userId_idx" ON "Review"("userId");

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairRequest" ADD CONSTRAINT "RepairRequest_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairRequest" ADD CONSTRAINT "RepairRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Diagnosis" ADD CONSTRAINT "Diagnosis_repairRequestId_fkey" FOREIGN KEY ("repairRequestId") REFERENCES "RepairRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairRecommendation" ADD CONSTRAINT "RepairRecommendation_repairRequestId_fkey" FOREIGN KEY ("repairRequestId") REFERENCES "RepairRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Repairer" ADD CONSTRAINT "Repairer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairerSpecialization" ADD CONSTRAINT "RepairerSpecialization_repairerId_fkey" FOREIGN KEY ("repairerId") REFERENCES "Repairer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_repairRequestId_fkey" FOREIGN KEY ("repairRequestId") REFERENCES "RepairRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_repairerId_fkey" FOREIGN KEY ("repairerId") REFERENCES "Repairer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairJob" ADD CONSTRAINT "RepairJob_repairRequestId_fkey" FOREIGN KEY ("repairRequestId") REFERENCES "RepairRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairJob" ADD CONSTRAINT "RepairJob_repairerId_fkey" FOREIGN KEY ("repairerId") REFERENCES "Repairer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairJob" ADD CONSTRAINT "RepairJob_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairHistory" ADD CONSTRAINT "RepairHistory_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairHistory" ADD CONSTRAINT "RepairHistory_repairJobId_fkey" FOREIGN KEY ("repairJobId") REFERENCES "RepairJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairHistory" ADD CONSTRAINT "RepairHistory_repairerId_fkey" FOREIGN KEY ("repairerId") REFERENCES "Repairer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_repairJobId_fkey" FOREIGN KEY ("repairJobId") REFERENCES "RepairJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_repairerId_fkey" FOREIGN KEY ("repairerId") REFERENCES "Repairer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

