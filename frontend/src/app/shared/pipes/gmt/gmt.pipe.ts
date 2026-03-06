import { inject, Pipe, PipeTransform } from '@angular/core';
import { DateService } from '../../services/date/date.service';

@Pipe({
    name: 'gmt',
})
export class GMTPipe implements PipeTransform {
    private readonly dateService = inject(DateService);

    transform(value: string | number | Date): string {
        const date = new Date(value);
        return this.dateService.toGMTtime(date);
    }
}
