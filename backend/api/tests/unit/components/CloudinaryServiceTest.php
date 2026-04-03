<?php

namespace api\tests\unit\components;

use api\components\CloudinaryService;
use Codeception\Test\Unit;
use api\tests\UnitTester;
use Cloudinary\Cloudinary;
use Cloudinary\Api\Upload\UploadApi;
use Cloudinary\Api\ApiResponse;
use ReflectionClass;
use Yii;
use yii\base\InvalidConfigException;

class CloudinaryServiceTest extends Unit
{
    protected UnitTester $tester;

    protected function _before()
    {
        parent::_before();

        // Set up default Cloudinary configuration
        Yii::$app->params['cloudinary'] = [
            'cloudName' => 'test-cloud',
            'apiKey' => 'test-api-key',
            'apiSecret' => 'test-api-secret',
        ];
    }

    protected function _after()
    {
        parent::_after();
        // Clean up configuration
        unset(Yii::$app->params['cloudinary']);
    }

    public function testInitWithValidConfiguration()
    {
        $service = new CloudinaryService();

        // Should not throw an exception
        $this->expectNotToPerformAssertions();
        $service->init();
    }

    public function testInitThrowsExceptionWhenCloudNameIsMissing()
    {
        unset(Yii::$app->params['cloudinary']['cloudName']);

        $this->expectException(InvalidConfigException::class);
        $this->expectExceptionMessage('Cloudinary credentials are not configured');

        $service = new CloudinaryService();
        $service->init();
    }

    public function testInitThrowsExceptionWhenApiKeyIsMissing()
    {
        unset(Yii::$app->params['cloudinary']['apiKey']);

        $this->expectException(InvalidConfigException::class);
        $this->expectExceptionMessage('Cloudinary credentials are not configured');

        $service = new CloudinaryService();
        $service->init();
    }

    public function testInitThrowsExceptionWhenApiSecretIsMissing()
    {
        unset(Yii::$app->params['cloudinary']['apiSecret']);

        $this->expectException(InvalidConfigException::class);
        $this->expectExceptionMessage('Cloudinary credentials are not configured');

        $service = new CloudinaryService();
        $service->init();
    }

    public function testInitThrowsExceptionWhenCloudinaryConfigIsMissing()
    {
        unset(Yii::$app->params['cloudinary']);

        $this->expectException(InvalidConfigException::class);
        $this->expectExceptionMessage('Cloudinary credentials are not configured');

        $service = new CloudinaryService();
        $service->init();
    }

    public function testUploadProfilePictureCallsCloudinaryWithCorrectParameters()
    {
        // Create a mock UploadApi
        $uploadApiMock = $this->createMock(UploadApi::class);

        $expectedResult = new ApiResponse(
            [
                'secure_url' => 'https://res.cloudinary.com/test-cloud/image/upload/v123/quickfix/profile-pictures/user-123.webp',
                'public_id' => 'user-123',
            ],
            []
        );

        $uploadApiMock->expects($this->once())
            ->method('upload')
            ->with(
                $this->equalTo('/tmp/test-image.jpg'),
                $this->equalTo([
                    'folder' => 'quickfix/profile-pictures',
                    'public_id' => 'user-123',
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
                ])
            )
            ->willReturn($expectedResult);

        // Create a mock Cloudinary instance
        $cloudinaryMock = $this->createMock(Cloudinary::class);
        $cloudinaryMock->expects($this->once())
            ->method('uploadApi')
            ->willReturn($uploadApiMock);

        // Create a real service instance without calling init
        $service = new CloudinaryService();

        // Inject the mocked Cloudinary instance using reflection
        $reflection = new ReflectionClass(CloudinaryService::class);
        $property = $reflection->getProperty('cloudinary');
        $property->setValue($service, $cloudinaryMock);

        // Execute the method
        $result = $service->uploadProfilePicture('/tmp/test-image.jpg', 'user-123');

        // Assert the result
        $this->assertEquals($expectedResult['secure_url'], $result);
    }

    public function testUploadProfilePictureReturnsSecureUrl()
    {
        $uploadApiMock = $this->createMock(UploadApi::class);

        $apiResponse = new ApiResponse(
            [
                'secure_url' => 'https://res.cloudinary.com/test/image.jpg',
                'public_id' => 'test-id'
            ],
            []
        );

        $uploadApiMock->method('upload')
            ->willReturn($apiResponse);

        $cloudinaryMock = $this->createMock(Cloudinary::class);
        $cloudinaryMock->method('uploadApi')
            ->willReturn($uploadApiMock);

        // Create a real service instance without calling init
        $service = new CloudinaryService();

        // Inject the mocked Cloudinary instance using reflection
        $reflection = new ReflectionClass(CloudinaryService::class);
        $property = $reflection->getProperty('cloudinary');
        $property->setValue($service, $cloudinaryMock);

        $result = $service->uploadProfilePicture('/path/to/image.png', 'user-456');

        $this->assertStringStartsWith('https://', $result);
        $this->assertEquals('https://res.cloudinary.com/test/image.jpg', $result);
    }

    public function testUploadProfilePictureWithDifferentUserIds()
    {
        $uploadApiMock = $this->createMock(UploadApi::class);

        $response1 = new ApiResponse(
            ['secure_url' => 'https://res.cloudinary.com/test/user-1.jpg'],
            []
        );
        $response2 = new ApiResponse(
            ['secure_url' => 'https://res.cloudinary.com/test/user-2.jpg'],
            []
        );

        $uploadApiMock->expects($this->exactly(2))
            ->method('upload')
            ->willReturnOnConsecutiveCalls($response1, $response2);

        $cloudinaryMock = $this->createMock(Cloudinary::class);
        $cloudinaryMock->method('uploadApi')
            ->willReturn($uploadApiMock);

        // Create a real service instance without calling init
        $service = new CloudinaryService();

        // Inject the mocked Cloudinary instance using reflection
        $reflection = new ReflectionClass(CloudinaryService::class);
        $property = $reflection->getProperty('cloudinary');
        $property->setValue($service, $cloudinaryMock);

        $result1 = $service->uploadProfilePicture('/path/image1.jpg', 'user-1');
        $result2 = $service->uploadProfilePicture('/path/image2.jpg', 'user-2');

        $this->assertEquals('https://res.cloudinary.com/test/user-1.jpg', $result1);
        $this->assertEquals('https://res.cloudinary.com/test/user-2.jpg', $result2);
    }
}
