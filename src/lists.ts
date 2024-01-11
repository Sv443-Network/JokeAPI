import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { exists } from "./utils.js";

export const name = "lists";

const listTypes = [
  "blocklist",
  "noLogging",
  "allowlist",
] as const;

type ListType = typeof listTypes[number];

let lists: Record<ListType, string[]>;
const listsBasePath = "./data/lists/";

export async function init() {
  lists = await loadLists();
}

/** Checks if an IP hash is on the given list */
export function isOnList(ipHash: string, type: ListType) {
  return lists![type].find(i => i === ipHash) !== undefined;
}

/** Checks if an IP hash is on any of the given lists */
export function isOnAnyOfLists(ipHash: string, types: ListType[]) {
  for(const type of types)
    if(lists![type].find(i => i === ipHash))
      return true;
  return false;
}

/** Checks if an IP hash is on all of the given lists */
export function isOnMultipleLists(ipHash: string, types: ListType[]) {
  for(const type of types)
    if(!lists![type].find(i => i === ipHash))
      return false;
  return true;
}

/** Loads all lists from the corresponding JSON files and returns them */
async function loadLists() {
  const initLists: Partial<typeof lists> = {};
  for(const type of listTypes) {
    const listPath = join(listsBasePath, `${type}.json`);
    const fileExists = await exists(listPath);
    initLists[type] = (fileExists ? JSON.parse(String(await readFile(listPath))) : []) as string[];
  }
  return initLists as typeof lists;
}
