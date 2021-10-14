import { JokeSubmission } from "../src/types/jokes";
import { LangCodes } from "../src/types/languages";


//#SECTION submissions

/**
 * A single joke submission
 */
export interface Submission {
    /** The submission itself */
    joke: JokeSubmission;
    /** Unique identification of the client (usually IP hash) */
    client: string;
    /** Submission timestamp (Unix-13) */
    timestamp: number;
    errors: null | string[];
}

/**
 * This object contains all submissions
 */
export type AllSubmissions = {
    [key in LangCodes]?: Submission;
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
