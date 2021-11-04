// This file contains all types needed by the CLI tools in this folder

import { Joke, JokeSubmission } from "../src/types/jokes";
import { LangCode } from "../src/types/languages";


//#MARKER generic

/** Contains all info about a pressed key from the `keypress` package */
export interface Keypress {
    /** Final character(s) that would've been printed with the current key combination (e.g. `shift + a` => `A`) */
    name: string;
    /** Whether the control / CTRL key was held down */
    ctrl: boolean;
    /** Whether the meta / ALT key was held down */
    meta: boolean;
    /** Whether the shift key was held down */
    shift: boolean;
    /** If the keys produce an escape sequence, it will be put in here */
    sequence?: string;
    /** Some other kind of code that only appears sometimes, idk */
    code?: string;
}


//#MARKER submissions

/** A single joke submission */
export interface Submission {
    /** The submission itself */
    joke: JokeSubmission & { safe: boolean };
    /** Unique identification of the client (usually IP hash) */
    client: string;
    /** Submission timestamp (Unix-13) */
    timestamp: number;
    errors: null | string[];
    lang: LangCode;
    /** Absolute path to the joke submission */
    path: string;
}

/** This object contains all submissions */
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

export interface ClientColorMapping {
    [/**Color code*/ key: string]: /**Client IP hashes*/ string[];
}

//#MARKER add-joke

export type AddJoke = Joke & { formatVersion: number, lang: LangCode, safe: boolean };

/** Makes all properties `P` in object `T` also accept `null` as a value */
export type NullableObj<T> = {
    [P in keyof T]: (T[P] | null);
};

//#MARKER info

export interface SubmissionInfoResult
{
    submCount: number;
    submLangs: LangCode[];
}

export interface InfoCategoryValues {
    name: string;
    value: string | number | string[] | number[];
}
