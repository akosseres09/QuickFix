<?php

use common\models\OrganizationInvitation;
use common\models\OrganizationMember;
use yii\db\Migration;

/**
 * Handles the creation of table `{{%organization_invitation}}`.
 */
class m260309_195836_create_organization_invitation_table extends Migration
{
    /**
     * {@inheritdoc}
     */
    public function safeUp()
    {
        $this->createTable('{{%organization_invitation}}', [
            'id' => $this->string(36)->notNull(),
            'organization_id' => $this->string(36)->notNull(),
            'inviter_id' => $this->string(36)->notNull(),
            'email' => $this->string(255)->notNull(),
            'role' => $this->string(64)->notNull()->defaultValue(OrganizationMember::ROLE_VIEWER),
            'status' => $this->string(16)->notNull()->defaultValue(OrganizationInvitation::STATUS_PENDING),
            'token' => $this->string(36)->notNull()->unique(),
            'expires_at' => $this->integer()->notNull(),
            'created_at' => $this->integer()->notNull(),
            'updated_at' => $this->integer()->notNull(),
        ]);

        $this->addPrimaryKey(
            'pk-organization_invitation-id',
            '{{%organization_invitation}}',
            'id'
        );


        $this->addForeignKey(
            'fk-organization_invitation-org_id',
            '{{%organization_invitation}}',
            'organization_id',
            '{{%organization}}',
            'id',
            'CASCADE'
        );

        $this->addForeignKey(
            'fk-organization_invitation-inviter_id',
            '{{%organization_invitation}}',
            'inviter_id',
            '{{%user}}',
            'id',
            'CASCADE'
        );

        $this->createIndex(
            'idx-organization_invitation-token',
            '{{%organization_invitation}}',
            'token'
        );
    }

    /**
     * {@inheritdoc}
     */
    public function safeDown()
    {
        $this->dropTable('{{%organization_invitation}}');
    }
}
