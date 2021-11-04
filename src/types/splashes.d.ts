import { DefaultLangCode, LangCode } from "./languages";

/** An object describing all splash texts, sorted under each's language code */
export type SplashesFile = {
    [key in LangCode]?: string[];
} & {
    [key in DefaultLangCode]: string[];
};
