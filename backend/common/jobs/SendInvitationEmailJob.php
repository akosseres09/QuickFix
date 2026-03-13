<?php

namespace common\jobs;

use Yii;
use yii\base\BaseObject;
use yii\queue\JobInterface;
use common\models\OrganizationInvitation;
use Exception;

class SendInvitationEmailJob extends BaseObject implements JobInterface
{
    /**
     * @var int The ID of the OrganizationInvitation record
     */
    public $invitationId;

    /**
     * This method is executed by the queue worker in the background.
     * * @param \yii\queue\Queue $queue
     */
    public function execute($queue)
    {
        $invitation = OrganizationInvitation::find()
            ->byId($this->invitationId)
            ->joinWith('organization')
            ->joinWith('inviter')
            ->one();

        // If the invite was somehow deleted before the queue processed it, just exit gracefully.
        if (!$invitation) {
            Yii::warning("Invitation ID {$this->invitationId} not found. Skipping email.", 'queue');
            return;
        }

        $frontendUrl = Yii::$app->params['frontendUrl'] ?? 'http://localhost:4200';
        $inviteLink = $frontendUrl . '/invitation?token=' . $invitation->token;

        try {
            $sent = Yii::$app->mailer->compose([
                'html' => 'invite-html',
                'text' => 'invite-text'
            ], [
                'inviteLink' => $inviteLink,
                'invitation' => $invitation
            ])
                ->setFrom([Yii::$app->params['supportEmail'] => Yii::$app->name . ' robot'])
                ->setTo($invitation->email)
                ->setSubject("You have been invited to join an organization!")
                ->send();

            if (!$sent) {
                throw new Exception("Mailer returned false.");
            }
        } catch (Exception $e) {
            Yii::error("Failed to send invite email to {$invitation->email}: " . $e->getMessage(), 'queue');
            throw $e;
        }
    }
}
