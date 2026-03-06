<?php

use yii\db\Migration;

class m260226_215831_create_label_table extends Migration
{
    /**
     * {@inheritdoc}
     */
    public function safeUp()
    {
        $this->execute('CREATE EXTENSION IF NOT EXISTS pg_trgm;');

        $this->createTable('{{%label}}', [
            'id' => $this->string(36)->notNull(),
            'project_id' => $this->string(36)->notNull(),
            'name' => $this->string(24)->notNull(),
            'description' => $this->string(64)->notNull(),
            'color' => $this->string(32)->notNull(),
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

        $this->execute('
            CREATE INDEX "idx-label-name-trgm"
            ON {{%label}}
            USING GIN (name gin_trgm_ops);
        ');
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
