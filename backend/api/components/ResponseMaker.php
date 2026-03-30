<?php

namespace api\components;

class ResponseMaker
{
    public static function asSuccess(array $data = [], int $statusCode = 200): array
    {
        \Yii::$app->response->statusCode = $statusCode;
        return [
            'success' => true,
            'data' => $data,
        ];
    }

    public static function asError(string $message, int $statusCode = 400, array $details = [], string $statusText = ''): array
    {
        \Yii::$app->response->statusCode = $statusCode;
        \Yii::$app->response->statusText = $message;

        $errorPayload = [
            'code' => $statusCode,
            'message' => $message,
        ];

        if (!empty($details)) {
            $errorPayload['details'] = $details;
        }

        return [
            'success' => false,
            'error' => $errorPayload,
        ];
    }

    /**
     * Returns a standardized 422 validation error response.
     * The details array maps field names to their validation error messages.
     */
    public static function asValidationError(array $errors, string $message = 'Validation failed.'): array
    {
        return self::asError($message, 422, $errors);
    }
}
