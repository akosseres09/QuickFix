<?php

/** @var yii\web\View $this */
/** @var common\models\OrganizationInvitation $invitation */
/** @var string $inviteLink */

?>

Hello,
You have been invited to join the organization <?= $invitation->organization->name ?> by <?= $invitation->inviter->username ?>.
Your invitation token is: <?= $invitation->token ?>
Click the link below to accept the invitation:
<?= $inviteLink ?>