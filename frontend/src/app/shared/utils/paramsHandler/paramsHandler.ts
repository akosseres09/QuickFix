import { HttpParams } from '@angular/common/http';
import { ApiQueryParams } from '../../constants/api/ApiQueryParams';

export class ParamsHandler {
    static convertToHttpParams(params: ApiQueryParams): HttpParams {
        let httpParams = new HttpParams();

        Object.entries(params).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                httpParams = httpParams.set(key, value.toString());
            }
        });

        return httpParams;
    }
}
