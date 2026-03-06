<?php

use common\models\Project;
use yii\db\Migration;

/**
 * Handles the creation of table `{{%project}}`.
 */
class m260125_165015_create_project_table extends Migration
{
    /**
     * {@inheritdoc}
     */
    public function safeUp()
    {
        $this->execute('CREATE EXTENSION IF NOT EXISTS pg_trgm;');

        $this->createTable('{{%project}}', [
            'id' => $this->string(36)->notNull(),
            'organization_id' => $this->string(36)->notNull(),
            'name' => $this->string(255)->notNull(),
            'key' => $this->string(10)->notNull()->unique(),
            'description' => $this->text()->null(),
            'status' => $this->string(20)->notNull()->defaultValue(Project::STATUS_ACTIVE),
            'owner_id' => $this->string(36)->notNull(),
            'visibility' => $this->string(20)->notNull()->defaultValue(Project::VISIBILITY_PUBLIC),
            'priority' => $this->integer()->notNull()->defaultValue(Project::PRIORITY_MEDIUM),
            'created_at' => $this->integer()->notNull(),
            'updated_at' => $this->integer()->notNull(),
            'is_archived' => $this->boolean()->notNull()->defaultValue(false),
            'archived_at' => $this->integer()->null(),
        ]);

        $this->addPrimaryKey('pk-project-id', '{{%project}}', 'id');

        // Add foreign key for owner_id
        $this->addForeignKey(
            'fk-project-owner_id',
            '{{%project}}',
            'owner_id',
            '{{%user}}',
            'id',
            'CASCADE'
        );

        $this->addForeignKey(
            'fk-project-organization_id',
            '{{%project}}',
            'organization_id',
            '{{%organization}}',
            'id',
            'CASCADE'
        );

        $this->createIndex(
            'idx-project-organization_id',
            '{{%project}}',
            'organization_id'
        );

        $this->createIndex(
            'idx-project-owner_id',
            '{{%project}}',
            'owner_id'
        );

        // Add indexes
        $this->execute('
            CREATE INDEX "idx-project-name-trgm"
            ON {{%project}}
            USING GIN (name gin_trgm_ops);
        ');

        // for sorting on name
        $this->createIndex(
            'idx-project-name-sort',
            '{{%project}}',
            'name'
        );

        // The "Active Project Dashboard" Index
        // Handles filters on status/priority and sorts by created_at
        $this->execute('
            CREATE INDEX "idx-project-active-dashboard" 
            ON {{%project}} (status, priority, created_at DESC) 
            WHERE is_archived = false;
        ');

        // A fallback index for finding archived items
        // Usually, people just want a list of archived items sorted by newest.
        $this->execute('
            CREATE INDEX "idx-project-archived-list" 
            ON {{%project}} (created_at DESC) 
            WHERE is_archived = true;
        ');
    }

    /**
     * {@inheritdoc}
     */
    public function safeDown()
    {
        $this->dropForeignKey('fk-project-owner_id', '{{%project}}');
        $this->dropForeignKey('fk-project-organization_id', '{{%project}}');
        $this->dropPrimaryKey('pk-project-id', '{{%project}}');
        $this->dropTable('{{%project}}');
    }
}
