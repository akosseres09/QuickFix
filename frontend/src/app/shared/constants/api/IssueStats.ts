export interface IssueStats {
    totals: {
        total: number;
        open: number;
        inProgress: number;
        inReview: number;
        resolved: number;
        closed: number;
    };
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
}
