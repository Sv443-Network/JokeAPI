import { prisma } from "./client";

export function getAllJokes() {
    return prisma.joke.findMany();
}

export function getJoke(filter: JokeFilter) {
    return prisma.joke.findMany();
}
