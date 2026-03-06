<?php

use yii\db\Migration;

/**
 * Handles adding columns to table `{{%issue}}`.
 */
class m260302_100811_add_draft_column_to_issue_table extends Migration
{
    /**
     * {@inheritdoc}
     */
    public function safeUp()
    {
        $this->addColumn("{{%issue}}", "is_draft", "boolean");

        $this->createIndex("idx_issue_is-draft", "{{%issue}}", "is_draft");
    }

    /**
     * {@inheritdoc}
     */
    public function safeDown()
    {
        $this->dropIndex("idx_issue_is-draft", "{{%issue}}");
        $this->dropColumn("{{%issue}}", "is_draft");
    }
}
