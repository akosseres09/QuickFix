<?php

/** @var string $username */
/** @var string $passwordResetToken */

$resetLink = Yii::$app->params['frontendUrl'] . '/auth/reset-password?token=' . $passwordResetToken;
?>
Hello <?= $username ?>,
You have requested to reset your password.
Your verification token is: <?= $passwordResetToken ?>
Click the link below to reset your password:
<?= $resetLink ?>