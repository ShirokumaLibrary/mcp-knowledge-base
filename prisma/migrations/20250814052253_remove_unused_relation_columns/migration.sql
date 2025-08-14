/*
  Warnings:

  - You are about to drop the column `score` on the `item_relations` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `item_relations` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_item_relations" (
    "source_id" INTEGER NOT NULL,
    "target_id" INTEGER NOT NULL,

    PRIMARY KEY ("source_id", "target_id"),
    CONSTRAINT "item_relations_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "items" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "item_relations_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "items" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_item_relations" ("source_id", "target_id") SELECT "source_id", "target_id" FROM "item_relations";
DROP TABLE "item_relations";
ALTER TABLE "new_item_relations" RENAME TO "item_relations";
CREATE INDEX "item_relations_source_id_idx" ON "item_relations"("source_id");
CREATE INDEX "item_relations_target_id_idx" ON "item_relations"("target_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
