export interface IssueStats {
    totals: {
        total: number;
    };
    statuses: { label: string; color: string; count: number }[];
    priorities: {
        low: number;
        medium: number;
        high: number;
        critical: number;
    };
    types: {
        bug: number;
        feature: number;
        task: number;
        incident: number;
    };
    activity: {
        createdToday: number;
        closedToday: number;
    };
    trend: { labels: string[]; created: number[]; closed: number[] };
}
