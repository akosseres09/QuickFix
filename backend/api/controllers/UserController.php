<?php

namespace api\controllers;

use Yii;
use api\components\CloudinaryService;
use api\components\ResponseMaker;
use common\models\resource\UserResource;
use Symfony\Component\Uid\Uuid;
use yii\web\BadRequestHttpException;
use yii\web\ForbiddenHttpException;
use yii\web\NotFoundHttpException;
use yii\web\ServerErrorHttpException;
use yii\web\UploadedFile;

class UserController extends BaseRestController
{
    public $modelClass = UserResource::class;

    private const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    private const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    public function behaviors(): array
    {
        $behaviors = parent::behaviors();
        unset($behaviors["projectTranslator"], $behaviors["organizationTranslator"]);
        return $behaviors;
    }

    public function actions()
    {
        $actions = parent::actions();
        $actions["view"]["findModel"] = [$this, "findModel"];
        $actions["update"]["findModel"] = [$this, "findModel"];
        $actions["delete"]["findModel"] = [$this, "findModel"];

        return $actions;
    }

    public function actionUploadProfilePicture(string $id): array
    {
        $user = $this->findModel($id);

        $currentUserId = Yii::$app->user->id;
        if ($user->id !== $currentUserId) {
            throw new ForbiddenHttpException('You can only update your own profile picture.');
        }

        $file = UploadedFile::getInstanceByName('profile_picture');
        if (!$file) {
            throw new BadRequestHttpException('No file uploaded.');
        }

        if ($file->size > self::MAX_FILE_SIZE) {
            throw new BadRequestHttpException('File size exceeds the 5MB limit.');
        }

        if (!in_array($file->type, self::ALLOWED_MIME_TYPES, true)) {
            throw new BadRequestHttpException('Invalid file type. Allowed: JPEG, PNG, WebP, GIF.');
        }

        /** @var CloudinaryService $cloudinary */
        $cloudinary = Yii::$app->cloudinary;

        try {
            $url = $cloudinary->uploadProfilePicture($file->tempName, $user->id);
        } catch (\Throwable $e) {
            Yii::error('Cloudinary upload failed: ' . $e->getMessage(), __METHOD__);
            throw new ServerErrorHttpException('Failed to upload image.');
        }

        $user->profile_picture_url = $url;
        if (!$user->save(false, ['profile_picture_url', 'updated_at'])) {
            throw new ServerErrorHttpException('Failed to save profile picture URL.');
        }

        return ResponseMaker::asSuccess([
            'profilePictureUrl' => $user->profile_picture_url,
        ]);
    }

    public function findModel($id)
    {
        $query = UserResource::find();

        $isValidUuid = Uuid::isValid($id);
        if ($isValidUuid) {
            $query->byId($id);
        } else if (str_contains($id, "@")) {
            $query->byEmail($id);
        } else {
            $query->byUsername($id);
        }

        $model = $query->one();
        if (!$model) {
            throw new NotFoundHttpException("User not found");
        }

        return $model;
    }
}
