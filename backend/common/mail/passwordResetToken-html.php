<?php

use yii\helpers\Html;

/** @var yii\web\View $this */
/** @var common\models\User $user */

$resetLink = Yii::$app->params['frontendUrl'] . '/auth/reset-password?token=' . Html::encode($user->password_reset_token); ?>
<div class="verify-email">
    <p>Hello <?= Html::encode($user->username) ?>,</p>

    <p>You have requested to reset your password.</p>
    <p>Your verification token is: <strong><?= Html::encode($user->password_reset_token) ?></strong></p>
    <p>Click the link below to reset your password:</p>
    <p><?= Html::a('Reset Password', $verifyLink) ?></p>
</div>