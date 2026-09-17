-- An order remembers the code whose use it spent.
--
-- A coupon's use was spent at checkout and never came back: an order that
-- was cancelled, or deleted, kept the count where it was, and with only the
-- discount on the row there was no way to tell which code it had been. The
-- code is written with the order now (placeOrder), so cancelling gives the
-- use back and bringing the order back takes it again — the way the copies
-- already move on and off the shelf. Orders placed before this column exist
-- carry null and are left as they are.

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "couponCode" TEXT;
