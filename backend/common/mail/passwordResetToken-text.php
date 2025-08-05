<?php

/** @var yii\web\View $this */
/** @var common\models\User $user */

$resetLink = Yii::$app->params['frontendUrl'] . '/auth/reset-password?token=' . $user->password_reset_token;
?>
Hello <?= $user->username ?>,
You have requested to reset your password.
Your verification token is: <?= $user->password_reset_token ?>
Click the link below to reset your password:
<?= $resetLink ?>