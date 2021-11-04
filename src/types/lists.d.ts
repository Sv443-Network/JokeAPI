export interface ListsObj {
    /** IP addresses that are permanently blocked from visiting and using JokeAPI */
    blacklist: string[];
    /** IP addresses that can bypass rate limiting */
    whitelist: string[];
    /** IP addresses that don't send console messages (usually used to reduce spam from uptime measuring services) */
    consoleBlacklist: string[];
}
