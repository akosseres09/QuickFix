<?php

use yii\db\Migration;

class m260125_164515_create_organization_member_table extends Migration
{
    public function safeUp()
    {
        $this->createTable('{{%organization_member}}', [
            'id' => $this->string(36)->notNull(),
            'organization_id' => $this->string(36)->notNull(),
            'user_id' => $this->string(36)->notNull(),
            'role' => $this->string(50)->notNull(),
            'created_at' => $this->integer()->notNull(),
        ]);

        $this->addPrimaryKey(
            'pk-organization-id',
            '{{%organization}}',
            'id'
        );

        // Unique constraint (no duplicate memberships)
        $this->createIndex(
            'uq-organization-organization_id-user_id',
            '{{%organization_member}}',
            ['organization_id', 'user_id'],
            true
        );

        $this->createIndex(
            'idx-organization-member-organization_id',
            '{{%organization_member}}',
            'organization_id'
        );

        $this->createIndex(
            'idx-organization-memberuser_id',
            '{{%organization_member}}',
            'user_id'
        );

        $this->addForeignKey(
            'fk-organization-member-organization_id',
            '{{%organization_member}}',
            'organization_id',
            '{{%organization}}',
            'id',
            'CASCADE',
            'CASCADE'
        );

        $this->addForeignKey(
            'fk-organization-member-user_id',
            '{{%organization_member}}',
            'user_id',
            '{{%user}}',
            'id',
            'CASCADE',
            'CASCADE'
        );
    }

    public function safeDown()
    {
        $this->dropForeignKey(
            'fk-organization-member-organization_id',
            '{{%organization_member}}'
        );
        $this->dropForeignKey(
            'fk-organization-member-user_id',
            '{{%organization_member}}'
        );
        $this->dropTable('{{%organization_member}}');
    }
}