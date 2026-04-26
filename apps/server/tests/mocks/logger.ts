// FILE: apps/server/tests/mocks/logger.ts
// PURPOSE: Mock Winston logger for unit tests
// LAST UPDATED: F43 Fix

export const logger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
  http: () => {},
};

export const morganStream = {
  write: () => {},
};