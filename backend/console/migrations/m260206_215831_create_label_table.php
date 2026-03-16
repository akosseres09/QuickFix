<?php

use Symfony\Component\Uid\Uuid;
use yii\db\Migration;

class m260206_215831_create_label_table extends Migration
{
    /**
     * {@inheritdoc}
     */
    public function safeUp()
    {
        $this->execute('CREATE EXTENSION IF NOT EXISTS pg_trgm;');

        $this->createTable('{{%label}}', [
            'id' => $this->string(36)->notNull(),
            'project_id' => $this->string(36),
            'name' => $this->string(24)->notNull(),
            'description' => $this->string(64)->notNull(),
            'index' => $this->integer()->notNull(),
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

        $this->createIndex(
            'idx-label-project_id-index',
            '{{%label}}',
            ['project_id', 'index'],
            true
        );

        $this->execute('
            CREATE INDEX "idx-label-name-trgm"
            ON {{%label}}
            USING GIN (name gin_trgm_ops);
        ');

        $this->createIndex(
            'idx-label-index',
            '{{%label}}',
            'index'
        );

        $this->insert('{{%label}}', [
            'id' => Uuid::v7()->toString(),
            'project_id' => null,
            'name' => 'Open',
            'description' => 'Issue is open and ready for work.',
            'color' => '#14c93e',
            'index' => 0,
        ]);

        $this->insert('{{%label}}', [
            'id' => Uuid::v7()->toString(),
            'project_id' => null,
            'name' => 'Closed',
            'description' => 'Issue is closed and no longer being worked on.',
            'color' => '#cf2a11',
            'index' => 99999
        ]);
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
