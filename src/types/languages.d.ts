import * as LangFile from "../../data/languages.json";

declare type LangFileType = typeof LangFile;


/** All language codes JokeAPI supports */
export type LangCodes = keyof LangFileType;
/** The default / fallback language code */
export type DefaultLangCode = "en";
