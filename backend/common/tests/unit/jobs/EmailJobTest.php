<?php

namespace common\tests\unit\jobs;

use Codeception\Test\Unit;
use common\jobs\EmailJob;
use common\tests\UnitTester;
use Exception;
use Yii;
use yii\mail\MessageInterface;

class EmailJobTest extends Unit
{
    protected UnitTester $tester;

    protected function _before()
    {
        parent::_before();

        // Configure test mailer params
        if (!isset(Yii::$app->params['supportEmail'])) {
            Yii::$app->params['supportEmail'] = 'support@test.com';
        }
        if (!isset(Yii::$app->name)) {
            Yii::$app->name = 'Test App';
        }
    }

    public function testExecuteSuccessfulEmailSend()
    {
        $job = new EmailJob([
            'to' => 'recipient@example.com',
            'subject' => 'Test Subject',
            'template' => 'test-template',
            'data' => ['name' => 'John Doe'],
        ]);

        // Mock the queue parameter (not used in the job but required by interface)
        $queue = $this->createMock(\yii\queue\Queue::class);

        // Create a mock message
        $message = $this->createMock(MessageInterface::class);
        $message->expects($this->once())
            ->method('setFrom')
            ->with([Yii::$app->params['supportEmail'] => Yii::$app->name . ' robot'])
            ->willReturnSelf();

        $message->expects($this->once())
            ->method('setTo')
            ->with('recipient@example.com')
            ->willReturnSelf();

        $message->expects($this->once())
            ->method('setSubject')
            ->with('Test Subject')
            ->willReturnSelf();

        $message->expects($this->once())
            ->method('send')
            ->willReturn(true);

        // Mock the mailer
        $mailer = $this->createMock(\yii\mail\MailerInterface::class);
        $mailer->expects($this->once())
            ->method('compose')
            ->with(
                [
                    'html' => 'test-template-html',
                    'text' => 'test-template-text'
                ],
                ['name' => 'John Doe']
            )
            ->willReturn($message);

        Yii::$app->set('mailer', $mailer);

        // Execute the job - should not throw exception
        $job->execute($queue);

        $this->assertTrue(true); // If we get here, the job executed successfully
    }

    public function testExecuteFailsWhenMailerReturnsFalse()
    {
        $this->expectException(Exception::class);
        $this->expectExceptionMessage('Mailer returned false.');

        $job = new EmailJob([
            'to' => 'recipient@example.com',
            'subject' => 'Test Subject',
            'template' => 'test-template',
            'data' => [],
        ]);

        $queue = $this->createMock(\yii\queue\Queue::class);

        // Create a mock message that returns false when send() is called
        $message = $this->createMock(MessageInterface::class);
        $message->method('setFrom')->willReturnSelf();
        $message->method('setTo')->willReturnSelf();
        $message->method('setSubject')->willReturnSelf();
        $message->method('send')->willReturn(false);

        $mailer = $this->createMock(\yii\mail\MailerInterface::class);
        $mailer->method('compose')->willReturn($message);

        Yii::$app->set('mailer', $mailer);

        $job->execute($queue);
    }

    public function testExecuteThrowsExceptionOnMailerError()
    {
        $this->expectException(Exception::class);
        $this->expectExceptionMessage('SMTP connection failed');

        $job = new EmailJob([
            'to' => 'recipient@example.com',
            'subject' => 'Test Subject',
            'template' => 'test-template',
            'data' => [],
        ]);

        $queue = $this->createMock(\yii\queue\Queue::class);

        // Create a mock message that throws exception when send() is called
        $message = $this->createMock(MessageInterface::class);
        $message->method('setFrom')->willReturnSelf();
        $message->method('setTo')->willReturnSelf();
        $message->method('setSubject')->willReturnSelf();
        $message->method('send')->willThrowException(new Exception('SMTP connection failed'));

        $mailer = $this->createMock(\yii\mail\MailerInterface::class);
        $mailer->method('compose')->willReturn($message);

        Yii::$app->set('mailer', $mailer);

        $job->execute($queue);
    }

    public function testExecuteWithComplexData()
    {
        $job = new EmailJob([
            'to' => 'user@example.com',
            'subject' => 'Complex Data Test',
            'template' => 'invitation',
            'data' => [
                'user' => [
                    'name' => 'Jane Doe',
                    'email' => 'jane@example.com',
                ],
                'organization' => 'ACME Corp',
                'inviteUrl' => 'https://example.com/invite/abc123',
                'expiresAt' => '2026-04-10',
            ],
        ]);

        $queue = $this->createMock(\yii\queue\Queue::class);

        $message = $this->createMock(MessageInterface::class);
        $message->method('setFrom')->willReturnSelf();
        $message->method('setTo')->willReturnSelf();
        $message->method('setSubject')->willReturnSelf();
        $message->method('send')->willReturn(true);

        $mailer = $this->createMock(\yii\mail\MailerInterface::class);
        $mailer->expects($this->once())
            ->method('compose')
            ->with(
                [
                    'html' => 'invitation-html',
                    'text' => 'invitation-text'
                ],
                $this->callback(function ($data) {
                    return isset($data['user'])
                        && isset($data['organization'])
                        && isset($data['inviteUrl'])
                        && $data['organization'] === 'ACME Corp';
                })
            )
            ->willReturn($message);

        Yii::$app->set('mailer', $mailer);

        $job->execute($queue);

        $this->assertTrue(true);
    }

    public function testExecuteWithEmptyData()
    {
        $job = new EmailJob([
            'to' => 'user@example.com',
            'subject' => 'Simple Email',
            'template' => 'simple',
            'data' => [],
        ]);

        $queue = $this->createMock(\yii\queue\Queue::class);

        $message = $this->createMock(MessageInterface::class);
        $message->method('setFrom')->willReturnSelf();
        $message->method('setTo')->willReturnSelf();
        $message->method('setSubject')->willReturnSelf();
        $message->method('send')->willReturn(true);

        $mailer = $this->createMock(\yii\mail\MailerInterface::class);
        $mailer->expects($this->once())
            ->method('compose')
            ->with(
                [
                    'html' => 'simple-html',
                    'text' => 'simple-text'
                ],
                []
            )
            ->willReturn($message);

        Yii::$app->set('mailer', $mailer);

        $job->execute($queue);

        $this->assertTrue(true);
    }

    public function testTemplateFormattingWithDifferentNames()
    {
        $templates = [
            'welcome-email' => ['welcome-email-html', 'welcome-email-text'],
            'password-reset' => ['password-reset-html', 'password-reset-text'],
            'verification' => ['verification-html', 'verification-text'],
        ];

        foreach ($templates as $template => $expected) {
            $job = new EmailJob([
                'to' => 'user@example.com',
                'subject' => 'Test',
                'template' => $template,
                'data' => [],
            ]);

            $queue = $this->createMock(\yii\queue\Queue::class);

            $message = $this->createMock(MessageInterface::class);
            $message->method('setFrom')->willReturnSelf();
            $message->method('setTo')->willReturnSelf();
            $message->method('setSubject')->willReturnSelf();
            $message->method('send')->willReturn(true);

            $mailer = $this->createMock(\yii\mail\MailerInterface::class);
            $mailer->expects($this->once())
                ->method('compose')
                ->with(
                    [
                        'html' => $expected[0],
                        'text' => $expected[1]
                    ],
                    []
                )
                ->willReturn($message);

            Yii::$app->set('mailer', $mailer);

            $job->execute($queue);
        }

        $this->assertTrue(true);
    }

    public function testJobCanBeSerializedForQueue()
    {
        $job = new EmailJob([
            'to' => 'user@example.com',
            'subject' => 'Test Subject',
            'template' => 'test-template',
            'data' => ['key' => 'value'],
        ]);

        // Serialize and unserialize to simulate queue storage
        $serialized = serialize($job);
        $unserialized = unserialize($serialized);

        $this->assertInstanceOf(EmailJob::class, $unserialized);
        $this->assertEquals('user@example.com', $unserialized->to);
        $this->assertEquals('Test Subject', $unserialized->subject);
        $this->assertEquals('test-template', $unserialized->template);
        $this->assertEquals(['key' => 'value'], $unserialized->data);
    }
}
