import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {
    let component: FooterComponent;
    let fixture: ComponentFixture<FooterComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FooterComponent],
            providers: [provideRouter([])],
        }).compileComponents();

        fixture = TestBed.createComponent(FooterComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should render a footer element', () => {
        expect(fixture.nativeElement.querySelector('footer')).toBeTruthy();
    });

    it('should display QuickFix branding', () => {
        const heading = fixture.nativeElement.querySelector('h3');
        expect(heading.textContent).toContain('QuickFix');
    });

    it('should display the Product section with links', () => {
        const headings = fixture.nativeElement.querySelectorAll('h4');
        const productHeading = Array.from(headings).find((h: any) =>
            h.textContent.includes('Product')
        );
        expect(productHeading).toBeTruthy();

        const links = fixture.nativeElement.querySelectorAll('a');
        const linkTexts = Array.from(links).map((a: any) => a.textContent.trim());
        expect(linkTexts).toContain('Issues');
        expect(linkTexts).toContain('Projects');
        expect(linkTexts).toContain('Worktime');
        expect(linkTexts).toContain('Labels');
    });

    it('should display Company section', () => {
        const headings = fixture.nativeElement.querySelectorAll('h4');
        const companyHeading = Array.from(headings).find((h: any) =>
            h.textContent.includes('Company')
        );
        expect(companyHeading).toBeTruthy();
    });

    it('should display Legal section', () => {
        const headings = fixture.nativeElement.querySelectorAll('h4');
        const legalHeading = Array.from(headings).find((h: any) => h.textContent.includes('Legal'));
        expect(legalHeading).toBeTruthy();
    });

    it('should display copyright text', () => {
        const copyright = fixture.nativeElement.querySelector('.text-center p');
        expect(copyright.textContent).toContain('QuickFix');
        expect(copyright.textContent).toContain('All rights reserved');
    });
});
