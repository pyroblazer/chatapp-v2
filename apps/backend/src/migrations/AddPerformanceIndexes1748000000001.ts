import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPerformanceIndexes1748000000001 implements MigrationInterface {
  name = 'AddPerformanceIndexes1748000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable pg_trgm for full-text search
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);

    // Messages table indexes
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages (conversation_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_messages_parent_message_id ON messages (parent_message_id) WHERE parent_message_id IS NOT NULL`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages (created_at DESC)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_messages_author_id ON messages (author_id)`);

    // Group messages table indexes
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_group_messages_group_id ON group_messages (group_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_group_messages_parent_message_id ON group_messages (parent_message_id) WHERE parent_message_id IS NOT NULL`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_group_messages_created_at ON group_messages (created_at DESC)`);

    // Calls table indexes
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_calls_caller_initiated ON calls (caller_id, initiated_at DESC)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_calls_recipient_initiated ON calls (recipient_id, initiated_at DESC)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_calls_group_id ON calls (group_id) WHERE group_id IS NOT NULL`);

    // Friends table indexes
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_friends_sender_id ON friends (sender_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_friends_receiver_id ON friends (receiver_id)`);

    // Friend requests table indexes
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_friend_requests_sender_status ON friend_requests (sender_id, status)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver_status ON friend_requests (receiver_id, status)`);

    // Message reactions
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions (message_id)`);

    // Message attachments
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_message_attachments_message_id ON message_attachments (message_id)`);

    // Full-text search GIN indexes
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_messages_content_trgm ON messages USING gin (content gin_trgm_ops)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_group_messages_content_trgm ON group_messages USING gin (content gin_trgm_ops)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_group_messages_content_trgm`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_messages_content_trgm`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_message_attachments_message_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_message_reactions_message_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_friend_requests_receiver_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_friend_requests_sender_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_friends_receiver_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_friends_sender_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_calls_group_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_calls_recipient_initiated`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_calls_caller_initiated`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_group_messages_created_at`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_group_messages_parent_message_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_group_messages_group_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_messages_author_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_messages_created_at`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_messages_parent_message_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_messages_conversation_id`);
  }
}
