export interface TokenObj {
    token: string;
    maxReqs: number | null;
}

export interface TokenAuthorizationResult {
    isAuthorized: boolean;
    token: string;
}
