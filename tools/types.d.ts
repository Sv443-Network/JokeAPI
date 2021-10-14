import { JokeSubmission } from "../src/types/jokes";
import { LangCodes } from "../src/types/languages";


//#SECTION submissions

/**
 * A single joke submission
 */
export interface Submission {
    joke: JokeSubmission;
    ipHash: string;
    timestamp: number;
}

/**
 * This object contains all submissions
 */
export type AllSubmissions = {
    [key in LangCodes]?: Submission;
};
// & {
//     [key in DefaultLangCode]: Submission;
// };
