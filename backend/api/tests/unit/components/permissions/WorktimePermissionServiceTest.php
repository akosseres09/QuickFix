<?php

namespace api\tests\unit\components\permissions;

use api\components\permissions\Permissions;
use api\components\permissions\WorktimePermissionService;
use Codeception\Test\Unit;
use api\tests\UnitTester;
use common\fixtures\IssueFixture;
use common\fixtures\LabelFixture;
use common\fixtures\OrganizationFixture;
use common\fixtures\OrganizationMemberFixture;
use common\fixtures\ProjectFixture;
use common\fixtures\ProjectMemberFixture;
use common\fixtures\UserFixture;
use common\fixtures\WorktimeFixture;
use common\models\Worktime;

class WorktimePermissionServiceTest extends Unit
{
    protected UnitTester $tester;

    private const USER1_ID    = '01900000-0000-7000-8000-000000000001'; // org1 owner
    private const USER2_ID    = '01900000-0000-7000-8000-000000000002'; // org1 member
    private const USER3_ID    = '01900000-0000-7000-8000-000000000003'; // org1 admin
    private const USER4_ID    = '01900000-0000-7000-8000-000000000004'; // not a member
    private const ORG1_ID     = '01900000-0000-7001-8000-000000000001';
    private const WORKTIME1_ID = '01900000-0000-7006-8000-000000000001'; // issue1, created_by user1
    private const WORKTIME2_ID = '01900000-0000-7006-8000-000000000002'; // issue1, created_by user2

    public function _fixtures(): array
    {
        return [
            'users'               => UserFixture::class,
            'organizations'       => OrganizationFixture::class,
            'organizationMembers' => OrganizationMemberFixture::class,
            'projects'            => ProjectFixture::class,
            'projectMembers'      => ProjectMemberFixture::class,
            'labels'              => LabelFixture::class,
            'issues'              => IssueFixture::class,
            'worktime'            => WorktimeFixture::class,
        ];
    }

    // -------------------------------------------------------------------------
    // canViewWorktime
    // -------------------------------------------------------------------------

    public function testCanViewWorktimeForMember()
    {
        $this->assertTrue(WorktimePermissionService::canViewWorktime(self::ORG1_ID, self::USER2_ID));
    }

    public function testCannotViewWorktimeForNonMember()
    {
        $this->assertFalse(WorktimePermissionService::canViewWorktime(self::ORG1_ID, self::USER4_ID));
    }

    // -------------------------------------------------------------------------
    // canCreateWorktime
    // -------------------------------------------------------------------------

    public function testCanCreateWorktimeForMember()
    {
        $this->assertTrue(WorktimePermissionService::canCreateWorktime(self::ORG1_ID, self::USER2_ID));
    }

    public function testCannotCreateWorktimeForNonMember()
    {
        $this->assertFalse(WorktimePermissionService::canCreateWorktime(self::ORG1_ID, self::USER4_ID));
    }

    // -------------------------------------------------------------------------
    // canUpdateWorktime
    // -------------------------------------------------------------------------

    public function testCanUpdateWorktimeViaOwnership()
    {
        $worktime = Worktime::findOne(self::WORKTIME1_ID);
        $this->assertTrue(WorktimePermissionService::canUpdateWorktime($worktime, self::USER1_ID));
    }

    public function testCanUpdateWorktimeViaUpdateAnyPermission()
    {
        // user3 is org admin -> has WORKTIME_UPDATE_ANY at project level
        $worktime = Worktime::findOne(self::WORKTIME2_ID);
        $this->assertTrue(WorktimePermissionService::canUpdateWorktime($worktime, self::USER3_ID));
    }

    public function testCannotUpdateWorktimeWithoutPermissionOrOwnership()
    {
        // user2 is member (no WORKTIME_UPDATE_ANY), and doesn't own worktime1
        $worktime = Worktime::findOne(self::WORKTIME1_ID);
        $this->assertFalse(WorktimePermissionService::canUpdateWorktime($worktime, self::USER2_ID));
    }

    // -------------------------------------------------------------------------
    // canDeleteWorktime
    // -------------------------------------------------------------------------

    public function testCanDeleteWorktimeViaOwnership()
    {
        $worktime = Worktime::findOne(self::WORKTIME1_ID);
        $this->assertTrue(WorktimePermissionService::canDeleteWorktime($worktime, self::USER1_ID));
    }

    public function testCanDeleteWorktimeViaDeleteAnyPermission()
    {
        $worktime = Worktime::findOne(self::WORKTIME2_ID);
        $this->assertTrue(WorktimePermissionService::canDeleteWorktime($worktime, self::USER3_ID));
    }

    public function testCannotDeleteWorktimeWithoutPermissionOrOwnership()
    {
        $worktime = Worktime::findOne(self::WORKTIME1_ID);
        $this->assertFalse(WorktimePermissionService::canDeleteWorktime($worktime, self::USER2_ID));
    }
}
