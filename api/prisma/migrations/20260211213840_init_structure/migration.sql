/*
  Warnings:

  - The values [NEW,CONTACTED,INTERESTED,NEGOTIATING,CLOSED_WON,CLOSED_LOST] on the enum `FunnelStage` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "FunnelStage_new" AS ENUM ('NOVO', 'CONTATO', 'NEGOCIACAO', 'CADASTRO', 'FINALIZADO', 'SEM_INTERESSE');
ALTER TABLE "Lead" ALTER COLUMN "funnelStage" DROP DEFAULT;
ALTER TABLE "Lead" ALTER COLUMN "funnelStage" TYPE "FunnelStage_new" USING ("funnelStage"::text::"FunnelStage_new");
ALTER TABLE "Contact" ALTER COLUMN "funnelBefore" TYPE "FunnelStage_new" USING ("funnelBefore"::text::"FunnelStage_new");
ALTER TABLE "Contact" ALTER COLUMN "funnelAfter" TYPE "FunnelStage_new" USING ("funnelAfter"::text::"FunnelStage_new");
ALTER TYPE "FunnelStage" RENAME TO "FunnelStage_old";
ALTER TYPE "FunnelStage_new" RENAME TO "FunnelStage";
DROP TYPE "FunnelStage_old";
ALTER TABLE "Lead" ALTER COLUMN "funnelStage" SET DEFAULT 'NOVO';
COMMIT;

-- AlterTable
ALTER TABLE "Lead" ALTER COLUMN "funnelStage" SET DEFAULT 'NOVO';
