<?php

use yii\db\Migration;

/**
 * Handles the creation of table `{{%organization}}`.
 */
class m260125_164015_create_organization_table extends Migration
{
    public function safeUp()
    {
        $this->execute('CREATE EXTENSION IF NOT EXISTS pg_trgm;');

        $this->createTable('{{%organization}}', [
            'id' => $this->string(36)->notNull(),
            'name' => $this->string(255)->notNull(),
            'slug' => $this->string(16)->notNull(),
            'description' => $this->text(),
            'owner_id' => $this->string(36)->notNull(),
            'logo_url' => $this->text(),
            'created_at' => $this->integer()->notNull(),
            'updated_at' => $this->integer()->null(),
            'deleted_at' => $this->integer()->null(),
        ]);

        // searching on name
        $this->execute('
            CREATE INDEX "idx-organization-name-trgm"
            ON {{%organization}}
            USING GIN (name gin_trgm_ops);
        ');

        $this->createIndex(
            'uq-organization-name-slug',
            '{{%organization}}',
            ['name', 'slug'],
            true
        );

        $this->addForeignKey(
            'fk-organization-owner_id',
            '{{%organization}}',
            'owner_id',
            '{{%user}}',
            'id',
            'RESTRICT'
        );

    }

    public function safeDown()
    {
        $this->execute('DROP INDEX IF EXISTS idx_organization_name_trgm;');
        $this->dropForeignKey('fk-organization-owner_id', '{{%organization}}');
        $this->dropTable('{{%organization}}');
    }
}