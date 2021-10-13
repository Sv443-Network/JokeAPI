import Endpoint, { EndpointMeta } from "../classes/Endpoint";


export interface HttpMetrics {
    /** `Date` instance set to the time the request arrived at the server */
    requestArrival: Date;
}

export interface EpObject {
    /** File name */
    name: string;
    /** Meta object */
    meta: EndpointMeta;
    /** Absolute path to endpoint class */
    absPath: string;
    /** Path at which to call this endpoint */
    pathName: string;
    /** An instance of the endpoint subclass. Use this to call the endpoint, execute base class methods, etc. */
    instance: Endpoint;
}
