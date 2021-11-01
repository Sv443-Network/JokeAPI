/** Normalized deployment environment name */
export type Env = "prod" | "stage";

/** Environment-dependent global property */
export type EnvDependentProp = "name" | "httpPort" | "baseUrl" | "debug";
