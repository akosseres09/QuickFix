<?php

namespace api\components;

use Yii;
use Cloudinary\Cloudinary;
use yii\base\Component;
use yii\base\InvalidConfigException;

class CloudinaryService extends Component
{
    private Cloudinary $cloudinary;

    public function init(): void
    {
        parent::init();

        $params = Yii::$app->params;

        $cloudName = $params['cloudinary']['cloudName'] ?? null;
        $apiKey = $params['cloudinary']['apiKey'] ?? null;
        $apiSecret = $params['cloudinary']['apiSecret'] ?? null;

        if (!$cloudName || !$apiKey || !$apiSecret) {
            throw new InvalidConfigException('Cloudinary credentials are not configured. Set cloudinary params in params-local.php.');
        }

        $this->cloudinary = new Cloudinary([
            'cloud' => [
                'cloud_name' => $cloudName,
                'api_key' => $apiKey,
                'api_secret' => $apiSecret,
            ],
            'url' => [
                'secure' => true,
            ],
        ]);
    }

    /**
     * Upload a profile picture to Cloudinary with optimization.
     * Images are resized to max 400x400, converted to WebP, and quality-optimized.
     *
     * @param string $filePath Local path to the uploaded file
     * @param string $userId User ID for organizing uploads
     * @return string The secure URL of the uploaded image
     */
    public function uploadProfilePicture(string $filePath, string $userId): string
    {
        $result = $this->cloudinary->uploadApi()->upload($filePath, [
            'folder' => 'quickfix/profile-pictures',
            'public_id' => $userId,
            'overwrite' => true,
            'invalidate' => true,
            'transformation' => [
                [
                    'width' => 400,
                    'height' => 400,
                    'crop' => 'fill',
                    'gravity' => 'face',
                ],
                [
                    'quality' => 'auto:low',
                    'fetch_format' => 'auto',
                ],
            ],
        ]);

        return $result['secure_url'];
    }
}
