import k from "kleur";

/**
 * Handles an error  
 * // TODO: add logging lib
 * @param msg Short error message
 * @param err Error instance that caused the error
 * @param fatal Exits with code 1 if set to true
 */
export function error(msg: string, err?: Error, fatal = false) {
  console.error("\n" + k.red(msg));
  err && console.error(err);

  fatal && process.exit(1);
}
