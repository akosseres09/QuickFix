<?php

/** @var string $username */
/** @var string $verificationToken */

$verifyLink = Yii::$app->params['frontendUrl'] . '/auth/verify?token=' . $verificationToken;
?>
Hello <?= $username ?>,
You have requested to verify your account.
Your verification token is: <?= $verificationToken ?>
Click the link below to verify your account:
<?= $verifyLink ?>