<?php

use common\models\UserRole;
use yii\db\Migration;

/**
 * Handles adding columns to table `{{%user}}`.
 */
class m250803_162354_add_is_admin_column_to_user_table extends Migration
{
    /**
     * {@inheritdoc}
     */
    public function safeUp()
    {
        $this->addColumn('{{%user}}', 'is_admin', $this->tinyInteger()->defaultValue(0));
        $this->addColumn('{{%user}}', 'deleted_at', $this->integer()->defaultValue(null));
    }

    /**
     * {@inheritdoc}
     */
    public function safeDown()
    {
        $this->dropColumn('{{%user}}', 'is_admin');
        $this->dropColumn('{{%user}}', 'deleted_at');
    }
}
