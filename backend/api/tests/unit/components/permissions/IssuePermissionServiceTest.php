<?php

namespace api\tests\unit\components\permissions;

use api\components\permissions\IssuePermissionService;
use api\components\permissions\Permissions;
use Codeception\Test\Unit;
use api\tests\UnitTester;
use common\fixtures\IssueFixture;
use common\fixtures\LabelFixture;
use common\fixtures\OrganizationFixture;
use common\fixtures\OrganizationMemberFixture;
use common\fixtures\ProjectFixture;
use common\fixtures\ProjectMemberFixture;
use common\fixtures\UserFixture;
use common\models\Issue;

class IssuePermissionServiceTest extends Unit
{
    protected UnitTester $tester;

    private const USER1_ID  = '01900000-0000-7000-8000-000000000001'; // org1 owner
    private const USER2_ID  = '01900000-0000-7000-8000-000000000002'; // org1 member
    private const USER3_ID  = '01900000-0000-7000-8000-000000000003'; // org1 admin
    private const USER4_ID  = '01900000-0000-7000-8000-000000000004'; // not a member
    private const PROJ1_ID  = '01900000-0000-7002-8000-000000000001';
    private const ISSUE1_ID = '01900000-0000-7004-8000-000000000001';

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
        ];
    }

    // -------------------------------------------------------------------------
    // canViewIssue
    // -------------------------------------------------------------------------

    public function testCanViewIssueForMember()
    {
        $issue = Issue::findOne(self::ISSUE1_ID);
        $this->assertTrue(IssuePermissionService::canViewIssue($issue, self::USER2_ID));
    }

    public function testCannotViewIssueForNonMember()
    {
        $issue = Issue::findOne(self::ISSUE1_ID);
        $this->assertFalse(IssuePermissionService::canViewIssue($issue, self::USER4_ID));
    }

    // -------------------------------------------------------------------------
    // canCreateIssue
    // -------------------------------------------------------------------------

    public function testCanCreateIssueForMember()
    {
        $this->assertTrue(IssuePermissionService::canCreateIssue(self::PROJ1_ID, self::USER2_ID));
    }

    public function testCannotCreateIssueForNonMember()
    {
        $this->assertFalse(IssuePermissionService::canCreateIssue(self::PROJ1_ID, self::USER4_ID));
    }

    // -------------------------------------------------------------------------
    // canUpdateIssue
    // -------------------------------------------------------------------------

    public function testCanUpdateIssueForMember()
    {
        $issue = Issue::findOne(self::ISSUE1_ID);
        $this->assertTrue(IssuePermissionService::canUpdateIssue($issue, self::USER2_ID));
    }

    public function testCannotUpdateIssueForNonMember()
    {
        $issue = Issue::findOne(self::ISSUE1_ID);
        $this->assertFalse(IssuePermissionService::canUpdateIssue($issue, self::USER4_ID));
    }

    // -------------------------------------------------------------------------
    // canDeleteIssue
    // -------------------------------------------------------------------------

    public function testCanDeleteIssueForAdmin()
    {
        $issue = Issue::findOne(self::ISSUE1_ID);
        $this->assertTrue(IssuePermissionService::canDeleteIssue($issue, self::USER3_ID));
    }

    public function testCannotDeleteIssueForMember()
    {
        $issue = Issue::findOne(self::ISSUE1_ID);
        $this->assertFalse(IssuePermissionService::canDeleteIssue($issue, self::USER2_ID));
    }

    public function testCanDeleteIssueForOwner()
    {
        $issue = Issue::findOne(self::ISSUE1_ID);
        $this->assertTrue(IssuePermissionService::canDeleteIssue($issue, self::USER1_ID));
    }
}
