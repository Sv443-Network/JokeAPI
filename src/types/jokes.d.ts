//#SECTION dependency types

/** All joke types */
export type JokeType = "single" | "twopart";

/** All joke categories (excluding aliases) */
export type JokeCategory = "Misc" | "Programming" | "Dark" | "Pun" | "Spooky" | "Christmas";

/** All blacklist flags */
export interface JokeFlags {
    nsfw: boolean;
    racist: boolean;
    religious: boolean;
    political: boolean;
    sexist: boolean;
    explicit: boolean;
}


//#SECTION base interfaces

/** Base interface for all kinds of jokes, internal or submission */
declare interface JokeBase {
    category: JokeCategory;
    type: JokeType;
    flags: JokeFlags;
}

/** Base interface for internal jokes (ones that are saved to the local JSON files) */
declare interface InternalJokeBase extends JokeBase {
    safe: boolean;
    id: number;
}

/** Base interface for joke submissions */
declare interface SubmissionBase extends JokeBase {
    formatVersion: number;
}


//#SECTION internal jokes

/** An internal joke of type `single` */
export interface SingleJoke extends InternalJokeBase {
    type: "single";
    joke: string;
}

/** An internal joke of type `twopart` */
export interface TwopartJoke extends InternalJokeBase {
    type: "twopart";
    setup: string;
    delivery: string;
}

/** An internal joke of any type */
export type Joke = SingleJoke | TwopartJoke;

/** Represents an internal joke file */
export interface JokesFile {
    info: {
        formatVersion: number;
    }
    jokes: Joke[];
}


//#SECTION submissions

/** A joke submission of type `single` */
export interface JokeSubmissionSingle extends SubmissionBase {
    type: "single";
    joke: string;
}

/** A joke submission of type `twopart` */
export interface JokeSubmissionTwopart extends SubmissionBase {
    type: "twopart";
    setup: string;
    delivery: string;
}

/** A joke submission of any type */
export type JokeSubmission = JokeSubmissionSingle | JokeSubmissionTwopart;
