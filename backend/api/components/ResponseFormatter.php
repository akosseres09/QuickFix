<?php

namespace api\components;

use yii\web\Response;

/**
 * Automatically wraps all API responses in a unified envelope:
 *
 *   Success: { "success": true,  "data": ... }
 *   Error:   { "success": false, "error": { "code": ..., "message": ..., "details": ... } }
 *
 * Registered via the response component's `beforeSend` event in config/main.php.
 * Responses already formatted by ResponseMaker (detected by the `success` key) are left untouched.
 */
class ResponseFormatter
{
    public static function handle($event): void
    {
        /** @var Response $response */
        $response = $event->sender;
        $data = $response->data;

        // Skip empty responses (e.g. 204 No Content, OPTIONS preflight)
        if ($data === null || !is_array($data)) {
            return;
        }

        // Already formatted by ResponseMaker — leave as-is
        if (array_key_exists('success', $data)) {
            return;
        }

        $statusCode = $response->statusCode;
        $isSuccess = $statusCode >= 200 && $statusCode < 300;

        if ($isSuccess) {
            $response->data = self::formatSuccess($data);
        } else {
            $response->data = self::formatError($data, $statusCode);
        }
    }

    private static function formatSuccess(array $data): array
    {
        // Paginated response from Serializer (has 'items' envelope from BaseRestController)
        if (isset($data['items']) && is_array($data['items'])) {
            $result = [
                'success' => true,
                'data' => $data['items'],
            ];
            if (isset($data['_meta'])) {
                $result['_meta'] = $data['_meta'];
            }
            if (isset($data['_links'])) {
                $result['_links'] = $data['_links'];
            }
            return $result;
        }

        return [
            'success' => true,
            'data' => $data,
        ];
    }

    private static function formatError(array $data, int $statusCode): array
    {
        // Yii2 built-in validation errors from Serializer: [{field, message}, ...]
        if ($statusCode === 422 && self::isYiiValidationErrorArray($data)) {
            $grouped = [];
            foreach ($data as $item) {
                $grouped[$item['field']][] = $item['message'];
            }
            return [
                'success' => false,
                'error' => [
                    'code' => 422,
                    'message' => 'Validation failed.',
                    'details' => $grouped,
                ],
            ];
        }

        // Yii2 exception responses: {name, message, code, status, type, ...}
        $error = [
            'code' => $statusCode,
            'message' => $data['message'] ?? 'An error occurred.',
        ];

        // Preserve debug info in development
        if (YII_DEBUG) {
            if (isset($data['type'])) {
                $error['type'] = $data['type'];
            }
            if (isset($data['stack-trace'])) {
                $error['stack-trace'] = $data['stack-trace'];
            }
            if (isset($data['previous'])) {
                $error['previous'] = $data['previous'];
            }
        }

        return [
            'success' => false,
            'error' => $error,
        ];
    }

    /**
     * Detects Yii2's built-in validation error format: [{field: "...", message: "..."}, ...]
     */
    private static function isYiiValidationErrorArray(array $data): bool
    {
        if (empty($data) || !isset($data[0])) {
            return false;
        }
        return isset($data[0]['field'], $data[0]['message']);
    }
}
