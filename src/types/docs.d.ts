/** Encodings supported by JokeAPI - excludes "identity" */
export type EncodingName = "gzip" | "deflate" | "brotli";

/** All possible encoding values supported by JokeAPI, including "identity" */
export type AllEncodings = EncodingName | "identity";
