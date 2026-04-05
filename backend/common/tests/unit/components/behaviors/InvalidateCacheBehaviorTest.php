<?php

namespace common\tests\unit\components\behaviors;

use Codeception\Test\Unit;
use common\components\behaviors\InvalidateCacheBehavior;
use common\tests\UnitTester;
use Yii;
use yii\base\InvalidConfigException;
use yii\db\ActiveRecord;

class InvalidateCacheBehaviorTest extends Unit
{
    protected UnitTester $tester;

    protected function _before()
    {
        parent::_before();
        Yii::$app->cache->flush();
    }

    public function testInvalidateCacheOnUpdate()
    {
        $model = $this->createMockModel();
        $model->attachBehavior('cache', [
            'class' => InvalidateCacheBehavior::class,
            'cacheKeys' => ['test_key_1', 'test_key_2'],
        ]);

        // Set cache values
        Yii::$app->cache->set('test_key_1', 'value1');
        Yii::$app->cache->set('test_key_2', 'value2');

        $this->assertEquals('value1', Yii::$app->cache->get('test_key_1'), 'Cache key test_key_1 should have the value "value1".');
        $this->assertEquals('value2', Yii::$app->cache->get('test_key_2'), 'Cache key test_key_2 should have the value "value2".');

        // Trigger update event
        $model->trigger(ActiveRecord::EVENT_BEFORE_UPDATE);

        // Cache should be invalidated
        $this->assertFalse(Yii::$app->cache->get('test_key_1'), 'Cache key test_key_1 should be invalidated and return false.');
        $this->assertFalse(Yii::$app->cache->get('test_key_2'), 'Cache key test_key_2 should be invalidated and return false.');
    }

    public function testInvalidateCacheOnDelete()
    {
        $model = $this->createMockModel();
        $model->attachBehavior('cache', [
            'class' => InvalidateCacheBehavior::class,
            'cacheKeys' => ['test_key_delete'],
        ]);

        Yii::$app->cache->set('test_key_delete', 'value');
        $this->assertEquals('value', Yii::$app->cache->get('test_key_delete'), 'Cache key test_key_delete should have the value "value".');

        $model->trigger(ActiveRecord::EVENT_BEFORE_DELETE);

        $this->assertFalse(Yii::$app->cache->get('test_key_delete'), 'Cache key test_key_delete should be invalidated and return false.');
    }

    public function testInvalidateCacheOnInsert()
    {
        $model = $this->createMockModel();
        $model->attachBehavior('cache', [
            'class' => InvalidateCacheBehavior::class,
            'cacheKeys' => ['test_key_insert'],
        ]);

        Yii::$app->cache->set('test_key_insert', 'value');
        $this->assertEquals('value', Yii::$app->cache->get('test_key_insert'), 'Cache key test_key_insert should have the value "value".');

        $model->trigger(ActiveRecord::EVENT_AFTER_INSERT);

        $this->assertFalse(Yii::$app->cache->get('test_key_insert'), 'Cache key test_key_insert should be invalidated and return false.');
    }

    public function testThrowsExceptionWhenNoCacheKeys()
    {
        $this->expectException(InvalidConfigException::class);
        $this->expectExceptionMessage('CacheInvalidationBehavior requires at least one cache key.');

        $model = $this->createMockModel();
        $model->attachBehavior('cache', [
            'class' => InvalidateCacheBehavior::class,
            'cacheKeys' => [],
        ]);

        $model->trigger(ActiveRecord::EVENT_BEFORE_UPDATE);
    }

    public function testInvalidateMultipleCacheKeys()
    {
        $model = $this->createMockModel();
        $cacheKeys = ['key1', 'key2', 'key3', 'key4'];
        $model->attachBehavior('cache', [
            'class' => InvalidateCacheBehavior::class,
            'cacheKeys' => $cacheKeys,
        ]);

        // Set all cache keys
        foreach ($cacheKeys as $key) {
            Yii::$app->cache->set($key, 'value_' . $key);
        }

        // Verify all are set
        foreach ($cacheKeys as $key) {
            $this->assertEquals('value_' . $key, Yii::$app->cache->get($key), "Cache key $key should have the value 'value_$key'.");
        }

        // Trigger event
        $model->trigger(ActiveRecord::EVENT_BEFORE_UPDATE);

        // All should be invalidated
        foreach ($cacheKeys as $key) {
            $this->assertFalse(Yii::$app->cache->get($key), "Cache key $key should be invalidated and return false.");
        }
    }

    private function createMockModel()
    {
        return new class extends ActiveRecord {
            public static function tableName()
            {
                return 'test_table';
            }
        };
    }
}
