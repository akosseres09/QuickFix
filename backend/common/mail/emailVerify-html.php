<?php

use yii\helpers\Html;

/** @var yii\web\View $this */
/** @var common\models\User $user */

$verifyLink = Yii::$app->params['frontendUrl'] . '/auth/verify?token=' . Html::encode($user->verification_token);
?>
<div class="verify-email">
    <p>Hello <?= Html::encode($user->username) ?>,</p>

    <p>You have requested to verify your account.</p>
    <p>Your verification token is: <strong><?= Html::encode($user->verification_token) ?></strong></p>
    <p>Click the link below to verify your account:</p>
    <p><?= Html::a('Verify Account', $verifyLink) ?></p>
</div>