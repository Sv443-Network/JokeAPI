export type Stringifiable = string | number | boolean | null | undefined | { toString(): string };

export type ResponseFormat = "json" | "xml" | "text";

export enum LogLevel {
  Debug,
  Info,
  Warn,
}
