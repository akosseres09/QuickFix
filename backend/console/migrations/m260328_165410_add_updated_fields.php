<?php

use yii\db\Migration;

class m260328_165410_add_updated_fields extends Migration
{
    /**
     * {@inheritdoc}
     */
    public function safeUp()
    {
        $this->addColumn('{{%organization}}', 'updated_by', $this->string(36)->null());
        $this->addForeignKey(
            'fk-organization-updated_by',
            '{{%organization}}',
            'updated_by',
            '{{%user}}',
            'id',
            'SET NULL'
        );

        $this->addColumn('{{%organization_member}}', 'updated_by', $this->string(36)->null());
        $this->addForeignKey(
            'fk-organization_member-updated_by',
            '{{%organization_member}}',
            'updated_by',
            '{{%user}}',
            'id',
            'SET NULL'
        );

        $this->addColumn('{{%organization_member}}', 'created_by', $this->string(36)->notNull());
        $this->addForeignKey(
            'fk-organization_member-created_by',
            '{{%organization_member}}',
            'created_by',
            '{{%user}}',
            'id',
            'SET NULL'
        );

        $this->addColumn('{{%organization_member}}', 'updated_at', $this->integer()->null());

        $this->addColumn('{{%project}}', 'updated_by', $this->string(36)->null());
        $this->addForeignKey(
            'fk-project-updated_by',
            '{{%project}}',
            'updated_by',
            '{{%user}}',
            'id',
            'SET NULL'
        );

        $this->addColumn('{{%project_member}}', 'updated_by', $this->string(36)->null());
        $this->addForeignKey(
            'fk-project_member-updated_by',
            '{{%project_member}}',
            'updated_by',
            '{{%user}}',
            'id',
            'SET NULL'
        );

        $this->addColumn('{{%project_member}}', 'created_by', $this->string(36)->null());
        $this->addForeignKey(
            'fk-project_member-created_by',
            '{{%project_member}}',
            'created_by',
            '{{%user}}',
            'id',
            'SET NULL'
        );

        $this->addColumn('{{%project_member}}', 'updated_at', $this->integer()->null());

        return true;
    }

    /**
     * {@inheritdoc}
     */
    public function safeDown()
    {
        $this->dropColumn('{{%project_member}}', 'updated_at');
        $this->dropForeignKey('fk-project_member-updated_by', '{{%project_member}}');
        $this->dropColumn('{{%project_member}}', 'updated_by');
        $this->dropForeignKey('fk-project_member-created_by', '{{%project_member}}');
        $this->dropColumn('{{%project_member}}', 'created_by');


        $this->dropForeignKey('fk-project-updated_by', '{{%project}}');
        $this->dropColumn('{{%project}}', 'updated_by');

        $this->dropColumn('{{%organization_member}}', 'updated_at');
        $this->dropForeignKey('fk-organization_member-updated_by', '{{%organization_member}}');
        $this->dropColumn('{{%organization_member}}', 'updated_by');
        $this->dropForeignKey('fk-organization_member-created_by', '{{%organization_member}}');
        $this->dropColumn('{{%organization_member}}', 'created_by');

        $this->dropForeignKey('fk-organization-updated_by', '{{%organization}}');
        $this->dropColumn('{{%organization}}', 'updated_by');

        return true;
    }

    /*
    // Use up()/down() to run migration code without a transaction.
    public function up()
    {

    }

    public function down()
    {
        echo "m260328_165410_add_updated_fields cannot be reverted.\n";

        return false;
    }
    */
}
