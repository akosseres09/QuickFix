import { Injectable } from '@angular/core';
import { CLOSED, IN_PROGRESS, Issue, OPEN, TO_DO } from '../../model/Issue';
import { UserService } from '../user/user.service';
import { User } from '../../model/User';

@Injectable({
    providedIn: 'root',
})
export class IssueService {
    constructor(private userService: UserService) {}

    getIssues(): Array<Issue> {
        return [];
    }
}
