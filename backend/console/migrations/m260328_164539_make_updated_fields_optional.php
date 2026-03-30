<?php

use yii\db\Migration;

class m260328_164539_make_updated_fields_optional extends Migration
{
    /**
     * {@inheritdoc}
     */
    public function safeUp()
    {
        $this->alterColumn('{{%user}}', 'updated_at', $this->integer()->null());
        $this->alterColumn('{{%project}}', 'updated_at', $this->integer()->null());
        $this->alterColumn('{{%comment}}', 'updated_at', $this->integer()->null());
        $this->alterColumn('{{%organization_invitation}}', 'updated_at', $this->integer()->null());

        return true;
    }

    /**
     * {@inheritdoc}
     */
    public function safeDown()
    {
        return true;
    }

    /*
    // Use up()/down() to run migration code without a transaction.
    public function up()
    {

    }

    public function down()
    {
        echo "m260328_164539_make_updated_fields_optional cannot be reverted.\n";

        return false;
    }
    */
}
