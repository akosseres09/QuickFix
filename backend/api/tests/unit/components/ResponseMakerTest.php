<?php

namespace api\tests\unit\components;

use api\components\ResponseMaker;
use Codeception\Test\Unit;
use api\tests\UnitTester;
use Yii;

class ResponseMakerTest extends Unit
{
    protected UnitTester $tester;

    protected function _before()
    {
        parent::_before();
        // Reset response status for each test
        Yii::$app->response->statusCode = 200;
        Yii::$app->response->statusText = 'OK';
    }

    public function testAsSuccessWithDefaultStatusCode()
    {
        $data = ['user' => 'John Doe', 'id' => 123];

        $response = ResponseMaker::asSuccess($data);

        $this->assertTrue($response['success']);
        $this->assertEquals($data, $response['data']);
        $this->assertEquals(200, Yii::$app->response->statusCode);
    }

    public function testAsSuccessWithCustomStatusCode()
    {
        $data = ['id' => 456];

        $response = ResponseMaker::asSuccess($data, 201);

        $this->assertTrue($response['success']);
        $this->assertEquals($data, $response['data']);
        $this->assertEquals(201, Yii::$app->response->statusCode);
    }

    public function testAsSuccessWithEmptyData()
    {
        $response = ResponseMaker::asSuccess();

        $this->assertTrue($response['success']);
        $this->assertEquals([], $response['data']);
        $this->assertEquals(200, Yii::$app->response->statusCode);
    }

    public function testAsErrorWithDefaultStatusCode()
    {
        $message = 'Something went wrong';

        $response = ResponseMaker::asError($message);

        $this->assertFalse($response['success']);
        $this->assertEquals($message, $response['error']['message']);
        $this->assertEquals(400, $response['error']['code']);
        $this->assertEquals(400, Yii::$app->response->statusCode);
        $this->assertEquals($message, Yii::$app->response->statusText);
    }

    public function testAsErrorWithCustomStatusCode()
    {
        $message = 'Not found';

        $response = ResponseMaker::asError($message, 404);

        $this->assertFalse($response['success']);
        $this->assertEquals($message, $response['error']['message']);
        $this->assertEquals(404, $response['error']['code']);
        $this->assertEquals(404, Yii::$app->response->statusCode);
    }

    public function testAsErrorWithDetails()
    {
        $message = 'Invalid input';
        $details = ['field1' => 'error1', 'field2' => 'error2'];

        $response = ResponseMaker::asError($message, 400, $details);

        $this->assertFalse($response['success']);
        $this->assertEquals($message, $response['error']['message']);
        $this->assertEquals($details, $response['error']['details']);
        $this->assertEquals(400, $response['error']['code']);
    }

    public function testAsErrorWithoutDetails()
    {
        $response = ResponseMaker::asError('Error message');

        $this->assertFalse($response['success']);
        $this->assertArrayNotHasKey('details', $response['error']);
    }

    public function testAsValidationError()
    {
        $errors = [
            'username' => 'Username is required',
            'email' => 'Email is invalid',
        ];

        $response = ResponseMaker::asValidationError($errors);

        $this->assertFalse($response['success']);
        $this->assertEquals('Validation failed.', $response['error']['message']);
        $this->assertEquals(422, $response['error']['code']);
        $this->assertEquals($errors, $response['error']['details']);
        $this->assertEquals(422, Yii::$app->response->statusCode);
    }

    public function testAsValidationErrorWithCustomMessage()
    {
        $errors = ['password' => 'Password too weak'];
        $message = 'Form validation errors';

        $response = ResponseMaker::asValidationError($errors, $message);

        $this->assertFalse($response['success']);
        $this->assertEquals($message, $response['error']['message']);
        $this->assertEquals(422, $response['error']['code']);
        $this->assertEquals($errors, $response['error']['details']);
    }

    public function testAsValidationErrorWithEmptyErrors()
    {
        $response = ResponseMaker::asValidationError([]);

        $this->assertFalse($response['success']);
        $this->assertEquals('Validation failed.', $response['error']['message']);
        $this->assertEquals(422, $response['error']['code']);
        $this->assertArrayNotHasKey('details', $response['error']);
    }

    public function testResponseStructureConsistency()
    {
        // Success responses should have 'success' and 'data' keys
        $successResponse = ResponseMaker::asSuccess(['test' => 'data']);
        $this->assertArrayHasKey('success', $successResponse);
        $this->assertArrayHasKey('data', $successResponse);
        $this->assertArrayNotHasKey('error', $successResponse);

        // Error responses should have 'success' and 'error' keys
        $errorResponse = ResponseMaker::asError('Error');
        $this->assertArrayHasKey('success', $errorResponse);
        $this->assertArrayHasKey('error', $errorResponse);
        $this->assertArrayNotHasKey('data', $errorResponse);

        // Error object should have 'code' and 'message' keys
        $this->assertArrayHasKey('code', $errorResponse['error']);
        $this->assertArrayHasKey('message', $errorResponse['error']);
    }

    public function testMultipleSuccessResponsesWithDifferentStatusCodes()
    {
        $statusCodes = [200, 201, 202, 204];

        foreach ($statusCodes as $code) {
            $response = ResponseMaker::asSuccess(['status' => $code], $code);

            $this->assertTrue($response['success']);
            $this->assertEquals($code, Yii::$app->response->statusCode);
        }
    }

    public function testMultipleErrorResponsesWithDifferentStatusCodes()
    {
        $testCases = [
            ['message' => 'Bad Request', 'code' => 400],
            ['message' => 'Unauthorized', 'code' => 401],
            ['message' => 'Forbidden', 'code' => 403],
            ['message' => 'Not Found', 'code' => 404],
            ['message' => 'Internal Server Error', 'code' => 500],
        ];

        foreach ($testCases as $testCase) {
            $response = ResponseMaker::asError($testCase['message'], $testCase['code']);

            $this->assertFalse($response['success']);
            $this->assertEquals($testCase['code'], $response['error']['code']);
            $this->assertEquals($testCase['code'], Yii::$app->response->statusCode);
            $this->assertEquals($testCase['message'], $response['error']['message']);
        }
    }
}
