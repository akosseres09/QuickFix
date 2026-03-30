<?php

namespace common\models;

use yii\behaviors\TimestampBehavior;
use yii\db\ActiveRecord;

abstract class BaseModel extends ActiveRecord
{
    protected string | bool $timestampCreatedAtAttribute = 'created_at';
    protected string | bool $timestampUpdatedAtAttribute = 'updated_at';
    protected string | bool $blameableCreatedByAttribute = 'created_by';
    protected string | bool $blameableUpdatedByAttribute = 'updated_by';

    public function behaviors()
    {
        return [
            'timestamp' => [
                'class' => TimestampBehavior::class,
                'createdAtAttribute' => $this->timestampCreatedAtAttribute,
                'updatedAtAttribute' => $this->timestampUpdatedAtAttribute,
                'attributes' => [
                    ActiveRecord::EVENT_BEFORE_INSERT => array_filter([$this->timestampCreatedAtAttribute]),
                    ActiveRecord::EVENT_BEFORE_UPDATE => array_filter([$this->timestampUpdatedAtAttribute]),
                ],
            ],
            'blameable' => [
                'class' => \yii\behaviors\BlameableBehavior::class,
                'createdByAttribute' => $this->blameableCreatedByAttribute,
                'updatedByAttribute' => $this->blameableUpdatedByAttribute,
                'attributes' => [
                    ActiveRecord::EVENT_BEFORE_INSERT => array_filter([$this->blameableCreatedByAttribute]),
                    ActiveRecord::EVENT_BEFORE_UPDATE => array_filter([$this->blameableUpdatedByAttribute]),
                ],
            ],
        ];
    }
}
