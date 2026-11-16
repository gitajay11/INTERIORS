/**
 * Console hygiene for the 3D canvases. Import this module for its side effect.
 *
 * React Three Fiber 9 still creates a `THREE.Clock` for every canvas, and
 * three r183+ logs a deprecation warning each time. Nothing in this codebase
 * can act on it (the fix belongs upstream), so that one message is dropped.
 * Every other three.js log, warning and error is passed through untouched.
 */
import { setConsoleFunction } from "three";

type Level = "log" | "warn" | "error";

setConsoleFunction((level: Level, message: unknown, ...rest: unknown[]) => {
  if (
    typeof message === "string" &&
    message.startsWith("THREE.Clock: This module has been deprecated")
  )
    return;
  console[level](message, ...rest);
});
