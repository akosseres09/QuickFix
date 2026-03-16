<?php

use common\models\Issue;
use yii\db\Migration;

/**
 * Handles the creation of table `{{%issue}}`.
 */
class m260207_124907_create_issues_table extends Migration
{
    /**
     * {@inheritdoc}
     */
    public function safeUp()
    {
        $this->execute('CREATE EXTENSION IF NOT EXISTS pg_trgm;');

        $this->createTable('{{%issue}}', [
            'id' => $this->string(36)->notNull(),
            'project_id' => $this->string(36)->notNull(),
            'issue_key' => $this->string(20)->notNull(),
            'title' => $this->string(255)->notNull(),
            'type' => $this->smallInteger()->notNull()->defaultValue(Issue::TYPE_TASK),
            'status_label' => $this->string(36)->notNull(),
            'priority' => $this->smallInteger()->notNull()->defaultValue(Issue::PRIORITY_MEDIUM),
            'created_by' => $this->string(36)->notNull(),
            'updated_by' => $this->string(36)->null(),
            'assigned_to' => $this->string(36)->null(),
            'created_at' => $this->integer()->notNull(),
            'updated_at' => $this->integer()->null(),
            'closed_at' => $this->integer()->null(),
            'due_date' => $this->integer()->null(),
            'is_archived' => $this->boolean()->notNull()->defaultValue(false),
            'is_draft' => $this->boolean()->notNull()->defaultValue(false),
        ]);

        $this->addColumn('{{%issue}}', 'description', 'jsonb');

        $this->addPrimaryKey('pk-issue-id', '{{%issue}}', 'id');

        $this->addForeignKey(
            'fk-issue-project_id',
            '{{%issue}}',
            'project_id',
            '{{%project}}',
            'id',
            'CASCADE',
            'CASCADE'
        );

        $this->addForeignKey(
            'fk-issue-status_label',
            '{{%issue}}',
            'status_label',
            '{{%label}}',
            'id',
            'RESTRICT',
            'CASCADE'
        );

        $this->addForeignKey(
            'fk-issue-created_by',
            '{{%issue}}',
            'created_by',
            '{{%user}}',
            'id',
            'CASCADE'
        );

        $this->addForeignKey(
            'fk-issue-updated_by',
            '{{%issue}}',
            'updated_by',
            '{{%user}}',
            'id',
            'SET NULL'
        );

        $this->addForeignKey(
            'fk-issue-assigned_to',
            '{{%issue}}',
            'assigned_to',
            '{{%user}}',
            'id',
            'SET NULL',
            'SET NULL'
        );

        $this->createIndex(
            'idx-issue-created_by',
            '{{%issue}}',
            'created_by'
        );

        $this->createIndex(
            'idx-issue-updated_by',
            '{{%issue}}',
            'updated_by'
        );

        $this->createIndex(
            'idx-issue-assigned_to',
            '{{%issue}}',
            'assigned_to'
        );

        $this->createIndex(
            'idx-issue-project_id_issue_key',
            '{{%issue}}',
            ['project_id', 'issue_key'],
            true
        );

        $this->execute('
            CREATE INDEX "idx-issue-title-trgm"
            ON {{%issue}}
            USING GIN (title gin_trgm_ops);
        ');

        $this->createIndex(
            'idx-issue-updated_at',
            '{{%issue}}',
            'updated_at'
        );

        // The "Active Issue Dashboard" Index
        // Covers combinations of the equality filters and finishes with the sort column
        $this->execute('
            CREATE INDEX "idx-issue-active-dashboard" 
            ON {{%issue}} (status_label, priority, type, created_at DESC) 
            WHERE is_archived = false;
        ');

        // A fallback index for finding archived items (since the above ignore them)
        // Usually, people just want a list of archived items sorted by newest.
        $this->execute('
            CREATE INDEX "idx-issue-archived-list" 
            ON {{%issue}} (created_at DESC) 
            WHERE is_archived = true;
        ');
    }

    /**
     * {@inheritdoc}
     */
    public function safeDown()
    {
        $this->dropForeignKey('fk-issue-project_id', '{{%issue}}');
        $this->dropForeignKey('fk-issue-created_by', '{{%issue}}');
        $this->dropForeignKey('fk-issue-assigned_to', '{{%issue}}');
        $this->dropForeignKey('fk-issue-status_label', '{{%issue}}');

        $this->dropTable('{{%issue}}');
    }
}
