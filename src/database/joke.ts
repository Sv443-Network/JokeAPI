import { Flag } from "@prisma/client";
import { JokeFilter } from "src/types/jokes";
import { prisma } from "./client";

export function getAllJokes() {
    return prisma.joke.findMany();
}

export function getFilteredJokes(filter: Partial<JokeFilter>, amount = 1) {
    return prisma.joke.findMany({
        where: {
            AND: [{
                categories: {
                    hasEvery: filter.categories,
                },
            }, {
                NOT: {
                    flags: {
                        hasSome: filter.blacklistFlags as Flag[],
                    },
                },
            }, {
                type: {
                    equals: filter.type,
                },
            }, {
                OR: [{
                    joke: {
                        contains: filter.contains,
                    },
                }, {
                    joke2: {
                        contains: filter.contains,
                    },
                }],
            }, {
                id: {
                    lte: filter.idRange?.[1],
                },
            }, {
                id: {
                    gte: filter.idRange?.[0],
                },
            }, {
                lang: {
                    equals: filter.lang,
                },
            }],
        },
        take: amount,
    });
}
