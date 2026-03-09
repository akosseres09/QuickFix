<?php

namespace common\components\behaviors;

use Yii;
use yii\base\Behavior;
use yii\base\InvalidConfigException;
use yii\db\BaseActiveRecord;

/**
 * This class is used to delete the cache keys of Active Record models
 */
class InvalidateCacheBehavior extends Behavior
{
    public array $cacheKeys = [];

    public function events(): array
    {
        return [
            BaseActiveRecord::EVENT_BEFORE_UPDATE => 'invalidateCache',
            BaseActiveRecord::EVENT_BEFORE_DELETE => 'invalidateCache',
            BaseActiveRecord::EVENT_AFTER_INSERT => 'invalidateCache',
        ];
    }

    public function invalidateCache(): void
    {
        if (empty($this->cacheKeys) || !is_array($this->cacheKeys)) {
            throw new InvalidConfigException(
                'CacheInvalidationBehavior requires at least one cache key.'
            );
        }

        foreach ($this->cacheKeys as $key) {
            Yii::$app->cache->delete($key);
        }
    }
}