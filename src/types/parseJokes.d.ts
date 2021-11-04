import { JokeSubmission } from "./jokes";
import { LangCode } from "./languages";


export interface CategoryAliasObj {
    /** Name of the alias */
    alias: string;
    /** The value this alias resolves to */
    value: string;
}

export type JokeSubmissionParams = JokeSubmission & { lang: LangCode };

export interface ValidationResult {
    /** Whether or not this joke's format is valid */
    valid: boolean;
    /** Array of error strings */
    errorStrings: string[];
    /** An object describing all valid and invalid parameters - If set to `null`, the joke couldn't be parsed (invalid JSON) */
    jokeParams: JokeSubmissionParams;
}

export type FileFormat = "xml" | "yaml" | "json" | "txt";
