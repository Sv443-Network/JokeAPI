import { DefaultLangCode, LangCode } from "../../src/types/languages";
import { Submission } from "../types";


//#MARKER submission cache

export type EntryStatus = "added" | "deleted";

export type Cache = {
    [key in LangCode]?: CacheEntry[];
} & {
    [key in DefaultLangCode]: CacheEntry[];
}

export interface CacheEntry {
    /** Timestamp of when this submission was added to the cache */
    added: number;
    /** The submission object */
    sub: Submission;
    /** Last known status of the submission (not guaranteed to be accurate) */
    status?: EntryStatus;
}

