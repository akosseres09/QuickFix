import { inject } from '@angular/core';
import { CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { decodeToken } from '../../utils/jwtDecoder';
import { AuthService } from '../../services/auth/auth.service';
import { SnackbarService } from '../../services/snackbar/snackbar.service';
import { InvitationTokenPayload } from '../../constants/token/InvitationTokenPayload';
import { OrganizationInvitationService } from '../../services/organization-invitation/organization-invitation.service';
import { UserService } from '../../services/user/user.service';

export const invitationGuard: CanActivateFn = (route, state: RouterStateSnapshot) => {
    const router = inject(Router);
    const authService = inject(AuthService);
    const snackbarService = inject(SnackbarService);
    const invitationService = inject(OrganizationInvitationService);
    const userService = inject(UserService);

    let currRoute = route;
    let payload: InvitationTokenPayload | null = null;
    let invitationToken: string = '';

    while (currRoute) {
        if (currRoute.queryParams['invitationToken']) {
            invitationToken = currRoute.queryParams['invitationToken'];
            payload = decodeToken<InvitationTokenPayload>(invitationToken);
            break;
        }
        currRoute = currRoute.firstChild!;
    }

    // If the user isn't authenticated yet, check if the email exists and save the token
    if (!authService.getAccessToken()) {
        if (payload && invitationToken) {
            invitationService.setInvitationToken(invitationToken);
        }

        if (payload) {
            if (payload.emailExists) {
                sessionStorage.setItem('redirectUrl', state.url);
                router.navigate(['/auth/login']);
                snackbarService.error('Please log in.');
                return false;
            } else {
                return userService.getUserByEmail(payload.email).pipe(
                    map(() => {
                        sessionStorage.setItem('redirectUrl', state.url);
                        router.navigate(['/auth/login']);
                        snackbarService.error('Please log in.');
                        return false;
                    }),
                    catchError(() => {
                        sessionStorage.setItem('redirectUrl', state.url);
                        router.navigate(['/auth/signup']);
                        snackbarService.error(
                            'Please finish the registration to accept the invitation.'
                        );
                        return of(false);
                    })
                );
            }
        }
    }

    return true;
};
