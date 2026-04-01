<?php

namespace common\tests\unit\components\traits;

use Codeception\Test\Unit;
use common\components\traits\EmailSenderTrait;
use common\tests\UnitTester;

class EmailSenderTraitTest extends Unit
{
    protected UnitTester $tester;

    public function testQueueEmail()
    {
        $service = new class {
            use EmailSenderTrait;
        };

        $to = 'test@example.com';
        $subject = 'Test Subject';
        $template = 'test-email';
        $data = ['name' => 'John Doe'];

        $result = $service->queueEmail($to, $subject, $template, $data);

        // Verify job was queued
        $this->assertNotNull($result, 'Expected queueEmail to return a non-null result indicating the email was queued successfully.');
    }

    public function testQueueEmailWithComplexData()
    {
        $service = new class {
            use EmailSenderTrait;
        };

        $to = 'complex@example.com';
        $subject = 'Complex Test';
        $template = 'complex-template';
        $data = [
            'user' => [
                'name' => 'Jane Doe',
                'email' => 'jane@example.com',
            ],
            'items' => [
                ['id' => 1, 'name' => 'Item 1'],
                ['id' => 2, 'name' => 'Item 2'],
            ],
            'metadata' => [
                'timestamp' => time(),
                'source' => 'test',
            ],
        ];

        $result = $service->queueEmail($to, $subject, $template, $data);

        $this->assertNotNull($result, 'Expected queueEmail to return a non-null result indicating the email was queued successfully.');
    }

    public function testQueueEmailWithEmptyData()
    {
        $service = new class {
            use EmailSenderTrait;
        };

        $to = 'empty@example.com';
        $subject = 'Empty Data Test';
        $template = 'simple-template';
        $data = [];

        $result = $service->queueEmail($to, $subject, $template, $data);

        $this->assertNotNull($result, 'Expected queueEmail to return a non-null result indicating the email was queued successfully.');
    }

    public function testQueueMultipleEmails()
    {
        $service = new class {
            use EmailSenderTrait;
        };

        $emails = [
            ['to' => 'user1@example.com', 'subject' => 'Subject 1', 'template' => 'template1', 'data' => ['key' => 'value1']],
            ['to' => 'user2@example.com', 'subject' => 'Subject 2', 'template' => 'template2', 'data' => ['key' => 'value2']],
            ['to' => 'user3@example.com', 'subject' => 'Subject 3', 'template' => 'template3', 'data' => ['key' => 'value3']],
        ];

        foreach ($emails as $email) {
            $result = $service->queueEmail($email['to'], $email['subject'], $email['template'], $email['data']);
            $this->assertNotNull($result, "Expected queueEmail to return a non-null result for email to {$email['to']}.");
        }
    }

    public function testQueueEmailReturnsValue()
    {
        $service = new class {
            use EmailSenderTrait;
        };

        $result1 = $service->queueEmail('test1@example.com', 'Subject 1', 'template', []);
        $result2 = $service->queueEmail('test2@example.com', 'Subject 2', 'template', []);

        // Both should return non-null values
        $this->assertNotNull($result1, 'Expected queueEmail to return a non-null result for the first email.');
        $this->assertNotNull($result2, 'Expected queueEmail to return a non-null result for the second email.');
    }
}
