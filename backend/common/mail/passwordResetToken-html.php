<?php

use yii\helpers\Html;

/** @var yii\web\View $this */
/** @var string $username */
/** @var string $passwordResetToken */

$resetLink = Yii::$app->params['frontendUrl'] . '/auth/reset-password?token=' . Html::encode($passwordResetToken); ?>
<div class="verify-email">
    <p>Hello <?= Html::encode($username) ?>,</p>

    <p>You have requested to reset your password.</p>
    <p>Your verification token is: <strong><?= Html::encode($passwordResetToken) ?></strong></p>
    <p>Click the link below to reset your password:</p>
    <p><?= Html::a('Reset Password', $resetLink) ?></p>
</div>