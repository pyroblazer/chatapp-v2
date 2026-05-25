import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGroupCallSupport1748000000002 implements MigrationInterface {
  name = 'AddGroupCallSupport1748000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Make recipient_id nullable (group calls don't have a single recipient)
    await queryRunner.query(`ALTER TABLE calls ALTER COLUMN recipient_id DROP NOT NULL`);

    // Add group_id column to calls
    await queryRunner.query(`ALTER TABLE calls ADD COLUMN IF NOT EXISTS group_id uuid`);

    // Create call_participants table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS call_participants (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        call_id uuid NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
        user_id uuid NOT NULL,
        status varchar(20) NOT NULL DEFAULT 'invited',
        joined_at TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // Index for call_participants lookups
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_call_participants_call_id ON call_participants (call_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_call_participants_user_id ON call_participants (user_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_call_participants_call_user ON call_participants (call_id, user_id)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_call_participants_call_user`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_call_participants_user_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_call_participants_call_id`);
    await queryRunner.query(`DROP TABLE IF EXISTS call_participants`);
    await queryRunner.query(`ALTER TABLE calls DROP COLUMN IF EXISTS group_id`);
    await queryRunner.query(`ALTER TABLE calls ALTER COLUMN recipient_id SET NOT NULL`);
  }
}
