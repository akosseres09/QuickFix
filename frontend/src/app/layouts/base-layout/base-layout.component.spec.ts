import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { BaseLayoutComponent } from './base-layout.component';
import { NavbarComponent } from '../../common/navbar/navbar.component';
import { FooterComponent } from '../../common/footer/footer.component';

// Stub child components to isolate the layout
@Component({ selector: 'app-navbar', template: '', standalone: true })
class StubNavbarComponent {}

@Component({ selector: 'app-footer', template: '', standalone: true })
class StubFooterComponent {}

describe('BaseLayoutComponent', () => {
    let component: BaseLayoutComponent;
    let fixture: ComponentFixture<BaseLayoutComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [BaseLayoutComponent, NoopAnimationsModule],
            providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
        })
            .overrideComponent(BaseLayoutComponent, {
                remove: { imports: [NavbarComponent, FooterComponent] },
                add: { imports: [StubNavbarComponent, StubFooterComponent] },
            })
            .compileComponents();

        fixture = TestBed.createComponent(BaseLayoutComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('template', () => {
        it('should contain a main element', () => {
            const main = fixture.nativeElement.querySelector('main');
            expect(main).toBeTruthy();
        });

        it('should render app-navbar', () => {
            const navbar = fixture.nativeElement.querySelector('app-navbar');
            expect(navbar).toBeTruthy();
        });

        it('should render app-footer', () => {
            const footer = fixture.nativeElement.querySelector('app-footer');
            expect(footer).toBeTruthy();
        });

        it('should contain a router-outlet', () => {
            const outlet = fixture.nativeElement.querySelector('router-outlet');
            expect(outlet).toBeTruthy();
        });

        it('should render navbar before the content area and footer after', () => {
            const main = fixture.nativeElement.querySelector('main');
            const children = Array.from(main.children) as HTMLElement[];
            const navbarIndex = children.findIndex((el) => el.tagName === 'APP-NAVBAR');
            const footerIndex = children.findIndex((el) => el.tagName === 'APP-FOOTER');
            expect(navbarIndex).toBeLessThan(footerIndex);
        });
    });
});
