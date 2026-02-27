<?php

use yii\db\Migration;

class m260226_215831_craete_label_table extends Migration
{
    /**
     * {@inheritdoc}
     */
    public function safeUp()
    {
        $this->createTable('{{%label}}', [
            'id' => $this->string(36)->notNull(),
            'project_id' => $this->string(36)->notNull(),
            'name' => $this->string(24)->notNull(),
            'color' => $this->string(7)->null(),
        ]);

        $this->addPrimaryKey('pk-label-id', '{{%label}}', 'id');

        $this->addForeignKey(
            'fk-label-project_id',
            '{{%label}}',
            'project_id',
            '{{%project}}',
            'id',
            'CASCADE'
        );

        $this->createIndex(
            'idx-label-project_id-name',
            '{{%label}}',
            ['project_id', 'name'],
            true
        );

    }

    /**
     * {@inheritdoc}
     */
    public function safeDown()
    {
        $this->dropForeignKey('fk-label-project_id', '{{%label}}');
        $this->dropTable('{{%label}}');
    }
}
