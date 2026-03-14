<?php

use yii\helpers\Html;

/** @var yii\web\View $this */
/** @var string $inviter */
/** @var string $organization */
/** @var string $inviteLink */
?>

<div class="invite-email">
    <p>Hello,</p>

    <p>You have been invited to join the organization <strong><?= Html::encode($organization) ?></strong> by <?= Html::encode($inviter) ?>.</p>
    <p>Click the link below to accept the invitation:</p>
    <p><?= Html::a('Accept Invitation', $inviteLink) ?></p>
</div>