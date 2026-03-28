import { Component, computed, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PageEvent } from '@angular/material/paginator';

@Component({
    selector: 'app-mobile-paginator',
    imports: [MatIconModule, MatButtonModule],
    templateUrl: './mobile-paginator.component.html',
    styleUrl: './mobile-paginator.component.css',
})
export class MobilePaginatorComponent {
    pageIndex = input<number>(0);
    pageSize = input<number>(20);
    length = input<number>(0);
    disabled = input<boolean>(false);

    page = output<PageEvent>();

    totalPages = computed(() => {
        const size = this.pageSize();
        return size > 0 ? Math.ceil(this.length() / size) : 0;
    });

    currentPage = computed(() => this.pageIndex() + 1);

    isFirstPage = computed(() => this.pageIndex() === 0);
    isLastPage = computed(() => this.pageIndex() >= this.totalPages() - 1);

    goToFirst(): void {
        this.emitPage(0);
    }

    goToPrevious(): void {
        this.emitPage(this.pageIndex() - 1);
    }

    goToNext(): void {
        this.emitPage(this.pageIndex() + 1);
    }

    goToLast(): void {
        this.emitPage(this.totalPages() - 1);
    }

    private emitPage(newIndex: number): void {
        const previousPageIndex = this.pageIndex();
        this.page.emit({
            pageIndex: newIndex,
            previousPageIndex,
            pageSize: this.pageSize(),
            length: this.length(),
        });
    }
}
