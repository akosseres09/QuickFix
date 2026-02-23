<?php

use yii\db\Migration;

/**
 * Handles the creation of table `{{%comment}}`.
 */
class m260221_173459_create_comment_table extends Migration
{
    /**
     * {@inheritdoc}
     */
    public function safeUp()
    {
        $this->createTable('{{%comment}}', [
            'id' => $this->string(36)->notNull(),
            'issue_id' => $this->string(36)->notNull(),
            'created_by' => $this->string(36)->null(),
            'updated_by' => $this->string(36)->null(),
            'created_at' => $this->integer()->notNull(),
            'updated_at'=> $this->integer()->notNull(),
        ]);

        $this->addColumn('{{%comment}}', 'content', 'jsonb NOT NULL');

        $this->addPrimaryKey('pk-comment-id', '{{%comment}}', 'id');
        
        $this->addForeignKey(
            'fk-comment-issue_id',
            '{{%comment}}',
            'issue_id',
            '{{%issue}}',
            'id',
            'CASCADE',
            'CASCADE'
        );

        $this->addForeignKey(
            'fk-comment-created_by',
            '{{%comment}}',
            'created_by',
            '{{%user}}',
            'id',
            'SET NULL'
        );

        $this->addForeignKey(
            'fk-comment-updated_by',
            '{{%comment}}',
            'updated_by',
            '{{%user}}',
            'id',
            'SET NULL'
        );

        $this->createIndex('idx-comment-created_at', '{{%comment}}', 'created_at');
    }

    /**
     * {@inheritdoc}
     */
    public function safeDown()
    {
        $this->dropForeignKey('fk-comment-issue_id', '{{%comment}}');
        $this->dropForeignKey('fk-comment-created_by', '{{%comment}}');
        $this->dropForeignKey('fk-comment-updated_by', '{{%comment}}');
        
        $this->dropTable('{{%comment}}');
    }
}
