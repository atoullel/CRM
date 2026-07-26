-- CreateEnum
CREATE TYPE "column_type" AS ENUM ('TEXT', 'NUMBER', 'DATE', 'PHONE');

-- CreateTable
CREATE TABLE "organizations" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER,
    "nom" TEXT NOT NULL,
    "entreprise" TEXT,
    "telephone" TEXT,
    "date_joined" DATE,
    "score" INTEGER,
    "custom_fields" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "columns" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER,
    "name" TEXT NOT NULL,
    "type" "column_type" NOT NULL,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "columns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_values" (
    "id" SERIAL NOT NULL,
    "value" TEXT NOT NULL,
    "contact_id" INTEGER NOT NULL,
    "column_id" INTEGER NOT NULL,

    CONSTRAINT "contact_values_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "organizations_deleted_at_idx" ON "organizations"("deleted_at");

-- CreateIndex
CREATE INDEX "contacts_deleted_at_idx" ON "contacts"("deleted_at");

-- CreateIndex
CREATE INDEX "columns_deleted_at_idx" ON "columns"("deleted_at");

-- CreateIndex
CREATE INDEX "contact_values_column_id_value_idx" ON "contact_values"("column_id", "value");

-- CreateIndex
CREATE UNIQUE INDEX "contact_values_contact_id_column_id_key" ON "contact_values"("contact_id", "column_id");

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "columns" ADD CONSTRAINT "columns_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_values" ADD CONSTRAINT "contact_values_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_values" ADD CONSTRAINT "contact_values_column_id_fkey" FOREIGN KEY ("column_id") REFERENCES "columns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
