-- CreateEnum
CREATE TYPE "CustomerRole" AS ENUM ('customer', 'admin');

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "role" "CustomerRole" NOT NULL DEFAULT 'customer';
