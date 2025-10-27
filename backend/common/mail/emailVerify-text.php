<?php

/** @var yii\web\View $this */
/** @var common\models\User $user */

$verifyLink = Yii::$app->params['frontendUrl'] . '/auth/verify?token=' . $user->verification_token;
?>
Hello <?= $user->username ?>,
You have requested to verify your account.
Your verification token is: <?= $user->verification_token ?>
Click the link below to verify your account:
<?= $verifyLink ?>