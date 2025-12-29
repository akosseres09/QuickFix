import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { NavbarComponent } from '../../common/navbar/navbar.component';

@Component({
    selector: 'app-home',
    imports: [CommonModule, NavbarComponent, RouterLink],
    templateUrl: './home.component.html',
    styleUrl: './home.component.css',
    animations: [
        trigger('fadeInUp', [
            transition(':enter', [
                style({ opacity: 0, transform: 'translateY(40px)' }),
                animate('700ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
            ]),
        ]),
        trigger('fadeInLeft', [
            transition(':enter', [
                style({ opacity: 0, transform: 'translateX(-50px)' }),
                animate('600ms 200ms ease-out', style({ opacity: 1, transform: 'translateX(0)' })),
            ]),
        ]),
        trigger('fadeInRight', [
            transition(':enter', [
                style({ opacity: 0, transform: 'translateX(50px)' }),
                animate('600ms 200ms ease-out', style({ opacity: 1, transform: 'translateX(0)' })),
            ]),
        ]),
        trigger('scaleUp', [
            transition(':enter', [
                style({ opacity: 0, transform: 'scale(0.9)' }),
                animate('500ms 300ms ease-out', style({ opacity: 1, transform: 'scale(1)' })),
            ]),
        ]),
        trigger('staggerAnimation', [
            transition('* => *', [
                query(
                    ':enter',
                    [
                        style({ opacity: 0, transform: 'translateY(30px)' }),
                        stagger(100, [
                            animate(
                                '500ms ease-out',
                                style({ opacity: 1, transform: 'translateY(0)' })
                            ),
                        ]),
                    ],
                    { optional: true }
                ),
            ]),
        ]),
    ],
})
export class HomeComponent implements OnInit {
    features = [
        {
            icon: '🎯',
            title: 'Issue Tracking',
            description:
                'Track and manage issues with powerful boards, filters, and real-time updates.',
            color: 'blue',
        },
        {
            icon: '📊',
            title: 'Project Analytics',
            description:
                'Visualize team performance with intuitive dashboards and detailed reports.',
            color: 'purple',
        },
        {
            icon: '⏱️',
            title: 'Time Management',
            description:
                'Log work hours, track project time, and generate comprehensive timesheets.',
            color: 'green',
        },
        {
            icon: '🚀',
            title: 'Fast & Reliable',
            description: 'Built for speed with modern architecture ensuring 99.9% uptime.',
            color: 'orange',
        },
    ];

    benefits = [
        { icon: '✅', text: 'Free 14-day trial' },
        { icon: '🔒', text: 'Bank-level security' },
        { icon: '📱', text: 'Mobile responsive' },
        { icon: '🌐', text: 'Cloud-based platform' },
    ];

    showContent = false;

    ngOnInit() {
        setTimeout(() => (this.showContent = true), 100);
    }
}
