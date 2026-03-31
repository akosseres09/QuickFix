<?php

namespace common\fixtures;

use common\models\OrganizationInvitation;
use yii\test\ActiveFixture;

/**
 * Note: Tests that instantiate OrganizationInvitation models directly need
 * a 'jwt' component configured in the test app config, because the model
 * calls Yii::$app->get('jwt') in its init() method.
 * This fixture only inserts raw data via SQL so it is safe to load without
 * the jwt component configured.
 */
class OrganizationInvitationFixture extends ActiveFixture
{
    public $modelClass = OrganizationInvitation::class;
    public $dataFile = __DIR__ . '/../tests/_data/organization_invitation.php';
    public $depends = [OrganizationFixture::class, UserFixture::class];
}
