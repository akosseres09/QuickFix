<?php

use yii\helpers\Html;

/** @var yii\web\View $this */
/** @var string $username */
/** @var string $verificationToken */

$verifyLink = Yii::$app->params['frontendUrl'] . '/auth/verify?token=' . Html::encode($verificationToken);
?>
<div class="verify-email">
    <p>Hello <?= Html::encode($username) ?>,</p>

    <p>You have requested to verify your account.</p>
    <p>Your verification token is: <strong><?= Html::encode($verificationToken) ?></strong></p>
    <p>Click the link below to verify your account:</p>
    <p><?= Html::a('Verify Account', $verifyLink) ?></p>
</div>