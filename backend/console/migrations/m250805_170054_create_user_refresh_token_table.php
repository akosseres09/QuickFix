<?php

use yii\db\Migration;

/**
 * Handles the creation of table `{{%user_refresh_token}}`.
 */
class m250805_170054_create_user_refresh_token_table extends Migration
{
    /**
     * {@inheritdoc}
     */
    public function safeUp()
    {
        $this->createTable('{{%user_refresh_token}}', [
            'id' => $this->primaryKey(),
            'user_id' => $this->integer()->notNull(),
            'token' => $this->string()->notNull()->unique(),
            'ip' => $this->string(45)->null(),
            'user_agent' => $this->text()->null(),
            'created_at' => $this->integer()->notNull(),
            'expires_at' => $this->integer()->notNull(),
            'revoked_at' => $this->integer()->null(),
        ]);

        $this->addForeignKey(
            'fk-refresh-token-user',
            '{{%user_refresh_token}}',
            'user_id',
            '{{%user}}',
            'id',
            'CASCADE'
        );

        $this->createIndex(
            'idx-user_refresh_token-token',
            '{{%user_refresh_token}}',
            'token'
        );
        $this->createIndex(
            'idx-user_refresh_token-expires_at',
            '{{%user_refresh_token}}',
            'expires_at'
        );
        $this->createIndex(
            'idx-user_refresh_token-revoked_at',
            '{{%user_refresh_token}}',
            'revoked_at'
        );
    }

    /**
     * {@inheritdoc}
     */
    public function safeDown()
    {
        $this->dropForeignKey(
            'fk-refresh-token-user',
            '{{%user_refresh_token}}'
        );
        $this->dropIndex(
            'idx-user_refresh_token-token',
            '{{%user_refresh_token}}'
        );
        $this->dropIndex(
            'idx-user_refresh_token-expires_at',
            '{{%user_refresh_token}}'
        );
        $this->dropIndex(
            'idx-user_refresh_token-revoked_at',
            '{{%user_refresh_token}}'
        );
        $this->dropTable('{{%user_refresh_token}}');
    }
}
