-- CreateTable
CREATE TABLE "items" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "ai_summary" TEXT,
    "status_id" INTEGER NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "category" TEXT,
    "start_date" DATETIME,
    "end_date" DATETIME,
    "version" TEXT,
    "search_index" TEXT,
    "entities" TEXT,
    "embedding" BLOB,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "items_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "statuses" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "statuses" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "is_closable" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "tags" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "item_tags" (
    "item_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,

    PRIMARY KEY ("item_id", "tag_id"),
    CONSTRAINT "item_tags_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "item_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "item_relations" (
    "source_id" INTEGER NOT NULL,
    "target_id" INTEGER NOT NULL,
    "type" TEXT,
    "score" REAL,

    PRIMARY KEY ("source_id", "target_id"),
    CONSTRAINT "item_relations_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "items" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "item_relations_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "items" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "keywords" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "word" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "item_keywords" (
    "item_id" INTEGER NOT NULL,
    "keyword_id" INTEGER NOT NULL,
    "weight" REAL NOT NULL DEFAULT 1.0,

    PRIMARY KEY ("item_id", "keyword_id"),
    CONSTRAINT "item_keywords_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "item_keywords_keyword_id_fkey" FOREIGN KEY ("keyword_id") REFERENCES "keywords" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "concepts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "item_concepts" (
    "item_id" INTEGER NOT NULL,
    "concept_id" INTEGER NOT NULL,
    "confidence" REAL NOT NULL DEFAULT 1.0,

    PRIMARY KEY ("item_id", "concept_id"),
    CONSTRAINT "item_concepts_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "item_concepts_concept_id_fkey" FOREIGN KEY ("concept_id") REFERENCES "concepts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "system_states" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "version" TEXT NOT NULL DEFAULT 'v0.8.0',
    "content" TEXT NOT NULL,
    "summary" TEXT,
    "metrics" TEXT,
    "context" TEXT,
    "checkpoint" TEXT,
    "relatedItems" TEXT NOT NULL DEFAULT '[]',
    "tags" TEXT NOT NULL DEFAULT '[]',
    "metadata" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false
);

-- CreateIndex
CREATE INDEX "items_type_idx" ON "items"("type");

-- CreateIndex
CREATE INDEX "items_status_id_idx" ON "items"("status_id");

-- CreateIndex
CREATE INDEX "items_priority_idx" ON "items"("priority");

-- CreateIndex
CREATE INDEX "items_category_idx" ON "items"("category");

-- CreateIndex
CREATE INDEX "items_start_date_end_date_idx" ON "items"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "items_created_at_idx" ON "items"("created_at");

-- CreateIndex
CREATE INDEX "items_updated_at_idx" ON "items"("updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "statuses_name_key" ON "statuses"("name");

-- CreateIndex
CREATE INDEX "statuses_sort_order_idx" ON "statuses"("sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE INDEX "item_relations_source_id_idx" ON "item_relations"("source_id");

-- CreateIndex
CREATE INDEX "item_relations_target_id_idx" ON "item_relations"("target_id");

-- CreateIndex
CREATE UNIQUE INDEX "keywords_word_key" ON "keywords"("word");

-- CreateIndex
CREATE INDEX "keywords_word_idx" ON "keywords"("word");

-- CreateIndex
CREATE INDEX "item_keywords_keyword_id_weight_idx" ON "item_keywords"("keyword_id", "weight");

-- CreateIndex
CREATE UNIQUE INDEX "concepts_name_key" ON "concepts"("name");

-- CreateIndex
CREATE INDEX "concepts_name_idx" ON "concepts"("name");

-- CreateIndex
CREATE INDEX "item_concepts_concept_id_confidence_idx" ON "item_concepts"("concept_id", "confidence");

-- CreateIndex
CREATE INDEX "system_states_is_active_idx" ON "system_states"("is_active");

-- CreateIndex
CREATE INDEX "system_states_created_at_idx" ON "system_states"("created_at");
