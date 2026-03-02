<?php

use yii\db\Migration;

/**
 * Handles adding columns to table `{{%project}}`.
 */
class m260302_100212_add_archive_columns_to_project_table extends Migration
{
    /**
     * {@inheritdoc}
     */
    public function safeUp()
    {
        $this->addColumn("{{%project}}", "is_archived", 'boolean');
        $this->addColumn('{{%project}}', 'archived_at', 'integer');

        $this->createIndex('idx_project_is-archived', '{{%project}}', 'is_archived');
        $this->createIndex('idx_project_archived-at', '{{%project}}', 'archived_at');
    }

    /**
     * {@inheritdoc}
     */
    public function safeDown()
    {
        $this->dropIndex('idx_project_is-archived', '{{%project}}');
        $this->dropIndex('idx_project_archived-at', '{{%project}}');

        $this->dropColumn('{{%project}}', 'is_archived');
        $this->dropColumn('{{%project}}', 'archived_at');

    }
}
