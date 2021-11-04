//#SECTION base

export type AnalyticsType = "success" | "docs" | "ratelimited" | "error" | "blacklisted" | "docsrecompiled" | "submission";

export interface AnalyticsData {
    ipAddress: string;
    urlPath: string[];
    urlParameters: object;
}

export interface BaseAnalyticsObj {
    type: string;
    data: AnalyticsData;
}

//#SECTION analytics types

export interface SuccessfulRequest extends BaseAnalyticsObj {
    type: "SuccessfulRequest";
}

export interface DocsRequest extends BaseAnalyticsObj {
    type: "Docs";
}

export interface RateLimited extends BaseAnalyticsObj {
    type: "RateLimited";
}

export interface Errored extends BaseAnalyticsObj {
    type: "Error";
    data: {
        ipAddress: string;
        urlPath: string[];
        urlParameters: object;
        errorMessage: string;
    }
}

export interface Submission extends BaseAnalyticsObj {
    type: "JokeSubmission";
    data: {
        ipAddress: string;
        urlPath: string[];
        urlParameters: object;
        submission: object;
    }
}

export interface TokenIncluded extends BaseAnalyticsObj {
    type: "AuthTokenIncluded";
}



/** Represents any object containing analytics data */
export type AnalyticsObject = SuccessfulRequest | DocsRequest | RateLimited | Errored | Submission | TokenIncluded;
