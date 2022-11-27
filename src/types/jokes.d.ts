import { JokeFlags } from ".";

export interface JokeFilter {
    categories: JokeCategory[];
    blacklistFlags: (keyof JokeFlags)[];
    type: JokeType;
    contains: string;
    idRange: [number, number];
    lang: string;
}
