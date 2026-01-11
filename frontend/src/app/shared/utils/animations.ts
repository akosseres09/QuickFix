import {
    animate,
    keyframes,
    query,
    stagger,
    state,
    style,
    transition,
    trigger,
} from '@angular/animations';

export const scrollAnimation = trigger('scrollAnimation', [
    state(
        'hidden',
        style({
            opacity: 0,
            transform: 'translateY(50px)',
        })
    ),
    state(
        'visible',
        style({
            opacity: 1,
            transform: 'translateY(0)',
        })
    ),
    transition('hidden => visible', [animate('700ms cubic-bezier(0.35, 0, 0.25, 1)')]),
]);

export const fadeInUp = trigger('fadeInUp', [
    transition(':enter', [
        style({ opacity: 0, transform: 'translateY(40px)' }),
        animate('700ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
    ]),
]);

export const fadeInLeft = trigger('fadeInLeft', [
    transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-50px)' }),
        animate('600ms 200ms ease-out', style({ opacity: 1, transform: 'translateX(0)' })),
    ]),
]);

export const fadeInRight = trigger('fadeInRight', [
    transition(':enter', [
        style({ opacity: 0, transform: 'translateX(50px)' }),
        animate('600ms 200ms ease-out', style({ opacity: 1, transform: 'translateX(0)' })),
    ]),
]);

export const staggerAnimation = trigger('staggerAnimation', [
    transition('* => *', [
        query(
            ':enter',
            [
                style({ opacity: 0, transform: 'translateY(30px)' }),
                stagger(100, [
                    animate('500ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
                ]),
            ],
            { optional: true }
        ),
    ]),
]);

export const scaleUp = trigger('scaleUp', [
    transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.9)' }),
        animate('500ms 300ms ease-out', style({ opacity: 1, transform: 'scale(1)' })),
    ]),
]);

export const speedDialTogglerAnimation = trigger('speedDialToggler', [
    state('open', style({ transform: 'rotate(45deg)' })),
    state('closed', style({ transform: 'rotate(0deg)' })),
    transition('open <=> closed', [animate('200ms cubic-bezier(0.4, 0.0, 0.2, 1)')]),
]);

export const speedDialStaggerAnimation = trigger('speedDialStagger', [
    transition('* => *', [
        query(':enter', style({ opacity: 0 }), { optional: true }),
        query(
            ':enter',
            stagger('40ms', [
                animate(
                    '200ms cubic-bezier(0.4, 0.0, 0.2, 1)',
                    keyframes([
                        style({ opacity: 0, transform: 'translateY(10px)' }),
                        style({ opacity: 1, transform: 'translateY(0)' }),
                    ])
                ),
            ]),
            { optional: true }
        ),
        query(
            ':leave',
            animate(
                '200ms cubic-bezier(0.4, 0.0, 0.2, 1)',
                keyframes([style({ opacity: 1 }), style({ opacity: 0 })])
            ),
            { optional: true }
        ),
    ]),
]);
