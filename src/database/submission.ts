import { prisma } from "./client";
import { Joke } from "@prisma/client";

interface SubmissionObj {
    joke: Joke;
}

type AnonymousSubmission = { type: "anonymous", author: null } & SubmissionObj;
type UserSubmission = { type: "user", author: string } & SubmissionObj;
type JokeSubmission = AnonymousSubmission | UserSubmission;

export function addSubmission(submission: JokeSubmission) {
    void 0;
}

/** Accepts the submission with the passed ID, turning it into a publicly available joke */
export function acceptSubmission(submissionId: string) {
    void 0;
}

/** #DEBUG# - directly adds a joke */
export function devSubmitJoke(submission: JokeSubmission) {
    const { joke } = submission;

    return prisma.joke.create({
        data: joke,
    });
}
