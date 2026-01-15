export interface successResponse {
    success: boolean;
    data: Array<any>;
}

export interface errorResponse {
    success: boolean;
    error: {
        code: number;
        message: string;
        details: {
            [key: string]: Array<string>;
        };
    };
}
