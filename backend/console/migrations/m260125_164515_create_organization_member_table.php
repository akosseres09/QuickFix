<?php

use common\models\OrganizationMember;
use yii\db\Migration;

class m260125_164515_create_organization_member_table extends Migration
{
    public function safeUp()
    {
        $this->createTable('{{%organization_member}}', [
            'id' => $this->string(36)->notNull(),
            'organization_id' => $this->string(36)->notNull(),
            'user_id' => $this->string(36)->notNull(),
            'role' => $this->string(16)->notNull()->defaultValue(OrganizationMember::ROLE_VIEWER),
            'created_at' => $this->integer()->notNull(),
        ]);

        $this->addPrimaryKey(
            'pk-organization_member-id',
            '{{%organization_member}}',
            'id'
        );

        $this->addForeignKey(
            'fk-organization_member-organization_id',
            '{{%organization_member}}',
            'organization_id',
            '{{%organization}}',
            'id',
            'CASCADE',
            'CASCADE'
        );

        $this->addForeignKey(
            'fk-organization_member-user_id',
            '{{%organization_member}}',
            'user_id',
            '{{%user}}',
            'id',
            'CASCADE',
            'CASCADE'
        );

        $this->createIndex(
            'idx-organization_member-user_id',
            '{{%organization_member}}',
            'user_id'
        );

        // Unique constraint (no duplicate memberships)
        $this->createIndex(
            'uq-organization_member-organization_id-user_id',
            '{{%organization_member}}',
            ['organization_id', 'user_id'],
            true
        );
    }

    public function safeDown()
    {
        $this->dropForeignKey(
            'fk-organization_member-organization_id',
            '{{%organization_member}}'
        );
        $this->dropForeignKey(
            'fk-organization_member-user_id',
            '{{%organization_member}}'
        );
        $this->dropTable('{{%organization_member}}');
    }
}