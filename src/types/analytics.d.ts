/** Represents any object containing analytics data */
export type AnalyticsObject = ISuccessfulRequest | IDocsRequest | IRateLimited | IErrored | ISubmission | ITokenIncluded;


declare interface IBaseAnalyticsObj {
    type: string;
    data: {
        ipAddress: string;
        urlPath: string[];
        urlParameters: object;
    }
}


export interface ISuccessfulRequest implements Required<IBaseAnalyticsObj> {
    type: "SuccessfulRequest";
    data: {
        ipAddress: string;
        urlPath: string[];
        urlParameters: object;
    }
}

export interface IDocsRequest implements Required<IBaseAnalyticsObj> {
    type: "Docs";
    data: {
        ipAddress: string;
        urlPath: string[];
        urlParameters: object;
    }
}

export interface IRateLimited implements Required<IBaseAnalyticsObj> {
    type: "RateLimited";
    data: {
        ipAddress: string;
        urlPath: string[];
        urlParameters: object;
    }
}

export interface IErrored implements Required<IBaseAnalyticsObj> {
    type: "Error";
    data: {
        ipAddress: string;
        urlPath: string[];
        urlParameters: object;
        errorMessage: string;
    }
}

export interface ISubmission implements Required<IBaseAnalyticsObj> {
    type: "JokeSubmission";
    data: {
        ipAddress: string;
        urlPath: string[];
        urlParameters: object;
        submission: object;
    }
}

export interface ITokenIncluded implements Required<IBaseAnalyticsObj> {
    type: "AuthTokenIncluded";
    data: {
        ipAddress: string;
        urlPath: string[];
        urlParameters: object;
    }
}
