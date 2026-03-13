<?php

use yii\helpers\Html;

/** @var yii\web\View $this */
/** @var common\models\OrganizationInvitation $invitation */
/** @var string $inviteLink */
?>

<div class="invite-email">
    <p>Hello,</p>

    <p>You have been invited to join the organization <strong><?= Html::encode($invitation->organization->name) ?></strong> by <?= Html::encode($invitation->inviter->username) ?>.</p>
    <p>Your invitation token is: <strong><?= Html::encode($invitation->token) ?></strong></p>
    <p>Click the link below to accept the invitation:</p>
    <p><?= Html::a('Accept Invitation', $inviteLink) ?></p>
</div>