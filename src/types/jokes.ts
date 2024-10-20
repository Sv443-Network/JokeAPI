import { JokeCategory, JokeFlag, JokeType } from "@/types/jokeapi/index.js";

/** Parameters for filtering jokes */
export interface JokeFilter {
  excludeCategories: JokeCategory[];
  includeCategories: JokeCategory[];
  excludeFlags: JokeFlag[];
  includeFlags: JokeFlag[];
  type: JokeType;
  contains: string;
  id: string;
  lang: string;
}
