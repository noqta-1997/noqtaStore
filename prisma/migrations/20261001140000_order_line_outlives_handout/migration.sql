-- A handout whose orders are all delivered or cancelled can now be deleted.
-- Its order lines stay: `handoutId` becomes nullable and is set null with the
-- delete, and the lines stand on what they keep of it — the title and teacher
-- copied at ordering (20261001120000_order_line_snapshot), and the cover and
-- branch copied by the delete action into the two columns added here. Both
-- stay null on lines whose handout still exists.
--
-- The guard against deleting a handout that open orders still need lives in
-- the delete action, not here: the foreign key only says what happens once
-- the delete is allowed.

-- DropForeignKey
ALTER TABLE "handout_order_items" DROP CONSTRAINT "handout_order_items_handoutId_fkey";

-- AlterTable
ALTER TABLE "handout_order_items" ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "coverUrl" TEXT,
ALTER COLUMN "handoutId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "handout_order_items" ADD CONSTRAINT "handout_order_items_handoutId_fkey" FOREIGN KEY ("handoutId") REFERENCES "handouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
