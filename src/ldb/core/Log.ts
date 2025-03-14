// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

export enum LogItemLevel {
  debug = 0,
  verbose = 1,
  message = 2,
  error = 3,
  important = 4,
  operationStarted = 10,
  operationEnded = 11,
}

export function error(message: string, context?: string, category?: string) {
  console.log(message, LogItemLevel.error, context, category);
}

export function assert(condition: boolean, message?: string, context?: string) {
  if (!condition) {
    if (!message) {
      console.debug("Assertion failed.", context);
    } else {
      console.debug("Assertion failed: " + message, context);
    }
  }
}
