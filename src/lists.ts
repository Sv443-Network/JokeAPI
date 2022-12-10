import { readFile } from "fs-extra";
import { join } from "path";

export const name = "lists";

type ListType = "blacklisted" | "noLogging" | "whitelisted";

let lists: Record<ListType, string[]> | undefined;
const listsBasePath = "./data/lists/";

export async function init() {
    lists = await getLists();
}

export function isOnList(ip: string, type: ListType) {
    return lists![type].find(i => i === ip) !== undefined;
}

export function isOnAnyOfLists(ip: string, types: ListType[]) {
    for(const type of types)
        if(lists![type].find(i => i === ip))
            return true;
    return false;
}

export function isOnMultipleLists(ip: string, types: ListType[]) {
    for(const type of types)
        if(!lists![type].find(i => i === ip))
            return false;
    return true;
}

async function getLists() {
    const lists2: Partial<typeof lists> = {};
    for(const listType of ["blacklisted", "noLogging", "whitelisted"] as ListType[])
        lists2[listType] = JSON.parse(String(await readFile(join(listsBasePath, `${listType}.json`)))) as string[];
    return lists2 as typeof lists;
}
