<?php

namespace common\jobs;

use Yii;
use yii\base\BaseObject;
use yii\queue\JobInterface;
use Exception;

class EmailJob extends BaseObject implements JobInterface
{
    public $to;
    public $subject;
    public $template;
    /**
     * @var array Data to be passed to the email view templates 
     * (associative array where keys are variable names in the template)
     */
    public $data = [];

    /**
     * This method is executed by the queue worker in the background.
     * * @param \yii\queue\Queue $queue
     */
    public function execute($queue)
    {
        try {
            $sent = Yii::$app->mailer->compose([
                'html' => "{$this->template}-html",
                'text' => "{$this->template}-text"
            ], $this->data)
                ->setFrom([Yii::$app->params['supportEmail'] => Yii::$app->name . ' robot'])
                ->setTo($this->to)
                ->setSubject($this->subject)
                ->send();

            if (!$sent) {
                throw new Exception("Mailer returned false.");
            }
        } catch (Exception $e) {
            Yii::error("Failed to send invite email to {$this->to}: " . $e->getMessage(), 'queue');
            throw $e;
        }
    }
}
