import { inject } from '@angular/core';
import { CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { decodeToken } from '../../utils/jwtDecoder';
import { AuthService } from '../../services/auth/auth.service';
import { SnackbarService } from '../../services/snackbar/snackbar.service';
import { InvitationTokenPayload } from '../../constants/token/InvitationTokenPayload';

export const invitationGuard: CanActivateFn = (route, state: RouterStateSnapshot) => {
    const router = inject(Router);
    const authService = inject(AuthService);
    const snackbarService = inject(SnackbarService);

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
            sessionStorage.setItem('invitationToken', invitationToken);
        }

        if (payload && !payload.emailExists) {
            router.navigate(['/auth/signup']);
            snackbarService.error('Please finish the registration to accept the invitation.');
            return false;
        }
    }

    return true;
};
