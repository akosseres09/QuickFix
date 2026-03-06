<?php

use yii\db\Migration;

/**
 * Handles adding columns to table `{{%user}}`.
 */
class m260126_133322_add_more_columns_to_user_table extends Migration
{
    /**
     * {@inheritdoc}
     */
    public function safeUp()
    {
        $this->addColumn('{{%user}}', 'first_name', $this->string()->null()->after('status'));
        $this->addColumn('{{%user}}', 'last_name', $this->string()->null()->after('first_name'));
        $this->addColumn('{{%user}}', 'phone_number', $this->string()->null()->after('last_name'));
        $this->addColumn('{{%user}}', 'date_of_birth', $this->date()->null()->after('phone_number'));
        $this->addColumn('{{%user}}', 'profile_picture_url', $this->string()->null()->after('date_of_birth'));
    }

    /**
     * {@inheritdoc}
     */
    public function safeDown()
    {
        $this->dropColumn('{{%user}}', 'first_name');
        $this->dropColumn('{{%user}}', 'last_name');
        $this->dropColumn('{{%user}}', 'phone_number');
        $this->dropColumn('{{%user}}', 'date_of_birth');
        $this->dropColumn('{{%user}}', 'profile_picture_url');
    }
}
