<?php

use common\models\ProjectMember;
use yii\db\Migration;

/**
 * Handles the creation of table `{{%project_member}}`.
 */
class m260125_171543_create_project_member_table extends Migration
{
    /**
     * {@inheritdoc}
     */
    public function safeUp()
    {
        $this->createTable('{{%project_member}}', [
            'id' => $this->string(36)->notNull(),
            'project_id' => $this->string(36)->notNull(),
            'user_id' => $this->string(36)->notNull(),
            'role' => $this->integer()->notNull()->defaultValue(ProjectMember::ROLE_GUEST),
            'created_at' => $this->integer()->notNull(),
        ]);

        $this->addPrimaryKey('pk-project_member-id', '{{%project_member}}', 'id');

        // Add foreign key for project_id
        $this->addForeignKey(
            'fk-project_member-project_id',
            '{{%project_member}}',
            'project_id',
            '{{%project}}',
            'id',
            'CASCADE'
        );

        // Add foreign key for user_id
        $this->addForeignKey(
            'fk-project_member-user_id',
            '{{%project_member}}',
            'user_id',
            '{{%user}}',
            'id',
            'CASCADE'
        );

        // Add unique index to prevent duplicate memberships
        $this->createIndex(
            'idx-project_member-unique',
            '{{%project_member}}',
            ['project_id', 'user_id'],
            true
        );

        // Add indexes for queries
        $this->createIndex(
            'idx-project_member-project_id',
            '{{%project_member}}',
            'project_id'
        );

        $this->createIndex(
            'idx-project_member-user_id',
            '{{%project_member}}',
            'user_id'
        );
    }

    /**
     * {@inheritdoc}
     */
    public function safeDown()
    {
        $this->dropForeignKey('fk-project_member-project_id', '{{%project_member}}');
        $this->dropForeignKey('fk-project_member-user_id', '{{%project_member}}');
        $this->dropTable('{{%project_member}}');
    }
}
