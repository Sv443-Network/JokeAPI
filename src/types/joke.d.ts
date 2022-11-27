export type JokeType = "single" | "twopart";

export type JokeCategory = "Misc" | "Programming" | "Dark" | "Pun" | "Spooky" | "Christmas";

export interface JokeFlags {
    nsfw: boolean;
    racist: boolean;
    religious: boolean;
    political: boolean;
    sexist: boolean;
    explicit: boolean;
}

export interface JokeBase {
    category: JokeCategory;
    type: JokeType;
    flags: JokeFlags;
    id: number;
}

export interface SingleJoke extends JokeBase {
    type: "single";
    joke: string;
}

export interface TwopartJoke extends JokeBase {
    type: "twopart";
    setup: string;
    delivery: string;
}

export type Joke = SingleJoke | TwopartJoke;
