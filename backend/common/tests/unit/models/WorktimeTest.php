<?php

namespace common\tests\unit\models;

use Codeception\Test\Unit;
use common\fixtures\IssueFixture;
use common\fixtures\LabelFixture;
use common\fixtures\OrganizationFixture;
use common\fixtures\OrganizationMemberFixture;
use common\fixtures\ProjectFixture;
use common\fixtures\ProjectMemberFixture;
use common\fixtures\UserFixture;
use common\fixtures\WorktimeFixture;
use common\models\User;
use common\models\Worktime;
use Yii;

class WorktimeTest extends Unit
{
    protected $tester;

    public function _fixtures(): array
    {
        return [
            'user' => [
                'class'    => UserFixture::class,
                'dataFile' => codecept_data_dir() . 'user.php',
            ],
            'organization' => [
                'class' => OrganizationFixture::class,
            ],
            'organization_member' => [
                'class' => OrganizationMemberFixture::class,
            ],
            'project' => [
                'class' => ProjectFixture::class,
            ],
            'project_member' => [
                'class' => ProjectMemberFixture::class,
            ],
            'label' => [
                'class' => LabelFixture::class,
            ],
            'issue' => [
                'class' => IssueFixture::class,
            ],
            'worktime' => [
                'class' => WorktimeFixture::class,
            ],
        ];
    }

    private function loginFixtureUser(): User
    {
        $user = User::findOne(['username' => 'bayer.hudson']);
        Yii::$app->user->setIdentity($user);
        return $user;
    }

    // -------------------------------------------------------------------------
    // Validation rules
    // -------------------------------------------------------------------------

    public function testRequiredFieldsAreEnforced(): void
    {
        $worktime = new Worktime();

        verify($worktime->validate())->false();
        verify($worktime->errors)->arrayHasKey('issue_id');
        verify($worktime->getErrors('issue_id'))->arrayContains('Issue Id cannot be blank.');
        verify($worktime->errors)->arrayHasKey('minutes_spent');
        verify($worktime->getErrors('minutes_spent'))->arrayContains('Minutes Spent cannot be blank.');
        verify($worktime->errors)->arrayHasKey('logged_at');
        verify($worktime->getErrors('logged_at'))->arrayContains('Logged At cannot be blank.');
    }

    public function testMinutesSpentMustBePositive(): void
    {
        $worktime = new Worktime([
            'issue_id'      => '01900000-0000-0004-0000-000000000001',
            'minutes_spent' => 0,
            'logged_at'     => '2024-01-15',
        ]);

        verify($worktime->validate())->false();
        verify($worktime->errors)->arrayHasKey('minutes_spent');
        verify($worktime->getErrors('minutes_spent'))->arrayContains('Minutes Spent must be no less than 1.');
    }

    public function testMinutesSpentMinIsOne(): void
    {
        $worktime = new Worktime([
            'issue_id'      => '01900000-0000-0004-0000-000000000001',
            'minutes_spent' => 1,
            'logged_at'     => '2024-01-15',
        ]);

        verify($worktime->validate(['minutes_spent']))->true();
    }

    public function testMinutesSpentMustBeInteger(): void
    {
        $worktime = new Worktime([
            'issue_id'      => '01900000-0000-0004-0000-000000000001',
            'minutes_spent' => 'abc',
            'logged_at'     => '2024-01-15',
        ]);

        verify($worktime->validate())->false();
        verify($worktime->errors)->arrayHasKey('minutes_spent');
        verify($worktime->getErrors('minutes_spent'))->arrayContains('Minutes Spent must be an integer.');
    }

    public function testLoggedAtMustBeValidDate(): void
    {
        $worktime = new Worktime([
            'issue_id'      => '01900000-0000-0004-0000-000000000001',
            'minutes_spent' => 60,
            'logged_at'     => 'not-a-date',
        ]);

        verify($worktime->validate())->false();
        verify($worktime->errors)->arrayHasKey('logged_at');
        verify($worktime->getErrors('logged_at'))->arrayContains('The format of Logged At is invalid.');
    }

    public function testLoggedAtFormatMustBeYmd(): void
    {
        $worktime = new Worktime([
            'issue_id'      => '01900000-0000-0004-0000-000000000001',
            'minutes_spent' => 60,
            'logged_at'     => '15/01/2024', // wrong format
        ]);

        verify($worktime->validate())->false();
        verify($worktime->errors)->arrayHasKey('logged_at');
        verify($worktime->getErrors('logged_at'))->arrayContains('The format of Logged At is invalid.');
    }

    public function testIssueIdMustExist(): void
    {
        $worktime = new Worktime([
            'issue_id'      => '00000000-0000-0000-0000-000000000099',
            'minutes_spent' => 30,
            'logged_at'     => '2024-01-15',
        ]);

        verify($worktime->validate())->false();
        verify($worktime->errors)->arrayHasKey('issue_id');
        verify($worktime->getErrors('issue_id'))->arrayContains('Issue Id is invalid.');
    }

    public function testDescriptionDefaultsToEmpty(): void
    {
        $worktime = new Worktime();
        $worktime->validate();

        verify($worktime->description)->equals('');
    }

    public function testValidDataPassesValidation(): void
    {
        $worktime = new Worktime([
            'issue_id'      => '01900000-0000-0004-0000-000000000001',
            'minutes_spent' => 120,
            'logged_at'     => '2024-03-20',
            'description'   => 'Some work description.',
        ]);

        verify($worktime->validate())->true();
    }

    // -------------------------------------------------------------------------
    // beforeSave & UUID generation
    // -------------------------------------------------------------------------

    public function testSaveGeneratesUuid(): void
    {
        $this->loginFixtureUser();

        $worktime = new Worktime([
            'issue_id'      => '01900000-0000-0004-0000-000000000001',
            'minutes_spent' => 45,
            'logged_at'     => '2024-05-10',
            'description'   => 'New entry',
        ]);

        $saved = $worktime->save();
        verify($saved)->true();
        verify($worktime->id)->notEmpty();
        verify($worktime->id)->stringMatchesRegExp(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/'
        );
    }

    // -------------------------------------------------------------------------
    // Fixture data lookups
    // -------------------------------------------------------------------------

    public function testFindFixtureWorktimes(): void
    {
        $wt1 = Worktime::findOne('01900000-0000-0006-0000-000000000001');
        verify($wt1)->notNull();
        verify($wt1->minutes_spent)->equals(90);
        verify($wt1->logged_at)->equals('2024-01-15');
        verify($wt1->description)->equals('Investigated root cause and implemented fix.');

        $wt2 = Worktime::findOne('01900000-0000-0006-0000-000000000002');
        verify($wt2)->notNull();
        verify($wt2->minutes_spent)->equals(30);
        verify($wt2->logged_at)->equals('2024-01-16');

        $wt3 = Worktime::findOne('01900000-0000-0006-0000-000000000003');
        verify($wt3)->notNull();
        verify($wt3->minutes_spent)->equals(1);
        verify($wt3->description)->equals('');
    }

    // -------------------------------------------------------------------------
    // Relations
    // -------------------------------------------------------------------------

    public function testGetIssue(): void
    {
        $worktime = Worktime::findOne('01900000-0000-0006-0000-000000000001');
        verify($worktime->issue)->notNull();
        verify($worktime->issue->issue_key)->equals('TEST-1');
    }

    public function testGetCreator(): void
    {
        $worktime = Worktime::findOne('01900000-0000-0006-0000-000000000001');
        verify($worktime->creator)->notNull();
        verify($worktime->creator->username)->equals('bayer.hudson');
    }

    public function testGetUpdator(): void
    {
        $wt1 = Worktime::findOne('01900000-0000-0006-0000-000000000001');
        verify($wt1->updator)->null();

        $wt2 = Worktime::findOne('01900000-0000-0006-0000-000000000002');
        verify($wt2->updator)->notNull();
        verify($wt2->updator->username)->equals('jane.doe');
    }
}
