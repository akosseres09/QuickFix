<?php

use yii\db\Migration;

/**
 * Handles the creation of table `{{%project}}`.
 */
class m250125_000001_create_project_table extends Migration
{
    /**
     * {@inheritdoc}
     */
    public function safeUp()
    {
        $this->createTable('{{%project}}', [
            'id' => $this->primaryKey(),
            'name' => $this->string(255)->notNull(),
            'key' => $this->string(10)->notNull()->unique(),
            'description' => $this->text()->null(),
            'status' => $this->string(20)->notNull()->defaultValue('active'),
            'start_date' => $this->date()->null(),
            'end_date' => $this->date()->null(),
            'owner_id' => $this->integer()->notNull(),
            'visibility' => $this->string(20)->notNull()->defaultValue('public'),
            'priority' => $this->string(20)->notNull()->defaultValue('medium'),
            'color' => $this->string(7)->null(),
            'progress' => $this->integer()->notNull()->defaultValue(0),
            'budget' => $this->decimal(10, 2)->null(),
            'created_at' => $this->integer()->notNull(),
            'updated_at' => $this->integer()->notNull(),
        ]);

        // Add foreign key for owner_id
        $this->addForeignKey(
            'fk-project-owner_id',
            '{{%project}}',
            'owner_id',
            '{{%user}}',
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
    }

    /**
     * {@inheritdoc}
     */
    public function safeDown()
    {
        $this->dropForeignKey('fk-project-owner_id', '{{%project}}');
        $this->dropTable('{{%project}}');
    }
}
