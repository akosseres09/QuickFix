<?php

use api\components\permissions\RoleManager;
use common\models\OrganizationInvitation;
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
            'role' => $this->string(64)->notNull()->defaultValue(RoleManager::ROLE_GUEST),
            'status' => $this->string(16)->notNull()->defaultValue(OrganizationInvitation::STATUS_PENDING),
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
    }

    /**
     * {@inheritdoc}
     */
    public function safeDown()
    {
        $this->dropTable('{{%organization_invitation}}');
    }
}
