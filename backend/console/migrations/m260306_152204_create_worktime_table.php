<?php

use yii\db\Migration;

/**
 * Handles the creation of table `{{%worktime}}`.
 */
class m260306_152204_create_worktime_table extends Migration
{
    /**
     * {@inheritdoc}
     */
    public function safeUp()
    {
        $this->createTable('{{%worktime}}', [
            'id' => $this->string(36)->notNull(),
            'issue_id' => $this->string(36)->notNull(),
            'created_by' => $this->string(36)->notNull(),
            'updated_by' => $this->string(36)->null(),
            'minutes_spent' => $this->integer()->notNull(),
            'description' => $this->text()->notNull()->defaultValue(''),
            'logged_at' => $this->date()->notNull(),
            'created_at' => $this->integer()->notNull(),
            'updated_at' => $this->integer()->null(),
        ]);

        $this->addPrimaryKey('pk-worktime-id', '{{%worktime}}', 'id');

        $this->addForeignKey(
            'fk-worktime-issue_id',
            '{{%worktime}}',
            'issue_id',
            '{{%issue}}',
            'id',
            'CASCADE'
        );

        $this->addForeignKey(
            'fk-worktime-created_by',
            '{{%worktime}}',
            'created_by',
            '{{%user}}',
            'id',
            'CASCADE'
        );

        $this->addForeignKey(
            'fk-worktime-updated_by',
            '{{%worktime}}',
            'updated_by',
            '{{%user}}',
            'id',
            'CASCADE'
        );

        $this->createIndex('idx-worktime-issue_id', '{{%worktime}}', 'issue_id');

        $this->createIndex('idx-worktime-created_by', '{{%worktime}}', 'created_by');

        $this->createIndex('idx-worktime-logged_at', '{{%worktime}}', 'logged_at');

        $this->createIndex('idx-worktime-created_at', '{{%worktime}}', 'created_at');
    }

    /**
     * {@inheritdoc}
     */
    public function safeDown()
    {
        $this->dropForeignKey('fk-worktime-issue_id', '{{%worktime}}');
        $this->dropForeignKey('fk-worktime-created_by', '{{%worktime}}');
        $this->dropForeignKey('fk-worktime-updated_by', '{{%worktime}}');

        $this->dropTable('{{%worktime}}');
    }
}
