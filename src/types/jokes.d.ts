import { JokeFlags } from ".";

export interface JokeFilter {
    categories: JokeCategory[];
    blacklistFlags: keyof JokeFlags[];
}
