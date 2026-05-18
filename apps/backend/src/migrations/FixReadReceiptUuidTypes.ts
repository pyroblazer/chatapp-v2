import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixReadReceiptUuidTypes1692411234567 implements MigrationInterface {
  name = 'FixReadReceiptUuidTypes1692411234567';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "read_receipts" ALTER COLUMN "message_id" TYPE uuid USING "message_id"::uuid`
    );
    await queryRunner.query(
      `ALTER TABLE "read_receipts" ALTER COLUMN "user_id" TYPE uuid USING "user_id"::uuid`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "read_receipts" ALTER COLUMN "message_id" TYPE varchar USING "message_id"::varchar`
    );
    await queryRunner.query(
      `ALTER TABLE "read_receipts" ALTER COLUMN "user_id" TYPE varchar USING "user_id"::varchar`
    );
  }
}
