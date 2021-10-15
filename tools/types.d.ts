import { JokeSubmission } from "../src/types/jokes";
import { LangCode } from "../src/types/languages";


//#SECTION submissions

/**
 * A single joke submission
 */
export interface Submission {
    /** The submission itself */
    joke: JokeSubmission & { safe: boolean };
    /** Unique identification of the client (usually IP hash) */
    client: string;
    /** Submission timestamp (Unix-13) */
    timestamp: number;
    errors: null | string[];
    lang: LangCode;
}

/**
 * This object contains all submissions
 */
export type AllSubmissions = {
    [key in LangCode]?: Submission;
};
// to make "en" a required property:
// & {
//     [key in DefaultLangCode]: Submission;
// };

export interface ParsedFileName {
    /** Unique identification of the client (usually IP hash) */
    client: string;
    timestamp: number;
    /** Index that gets incremented if a file name is duplicate (default = 0) */
    index: number;
}

export interface ReadSubmissionsResult {
    submissions: AllSubmissions;
    amount: number;
}

export type LastEditedSubmission = "accepted_safe" | "accepted_unsafe" | "edited" | "deleted";

export interface KeypressResult {
    name: string;
    ctrl: boolean;
    meta: boolean;
    shift: boolean;
    sequence?: string;
    code?: string;
}
