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

        // Add indexes
        $this->createIndex(
            'idx-project-key',
            '{{%project}}',
            'key'
        );

        $this->createIndex(
            'idx-project-status',
            '{{%project}}',
            'status'
        );

        $this->createIndex(
            'idx-project-owner_id',
            '{{%project}}',
            'owner_id'
        );

        $this->createIndex(
            'idx-project-name',
            '{{%project}}',
            'name'
        );

        $this->createIndex(
            'idx-project-priority',
            '{{%project}}',
            'priority'
        );
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
