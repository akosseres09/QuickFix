<?php

namespace common\components\traits;

use common\jobs\EmailJob;
use Yii;

trait EmailSenderTrait
{
    /**
     * Sends an email to the user.
     *
     * @param string $to
     * @param string $subject
     * @param string $template the base name of the email template (without -html or -text suffix)
     * @param array $data
     * @return mixed the result of the queue push operation
     */
    public function queueEmail(string $to, string $subject, string $template, array $data): mixed
    {
        return Yii::$app->queue->push(new EmailJob([
            'to' => $to,
            'subject' => $subject,
            'template' => $template,
            'data' => $data,
        ]));
    }
}
