// FILE: apps/server/tests/helpers/globalTeardown.ts
// PURPOSE: Closes all connections after all test suites run
// LAST UPDATED: F44 Fix

import { disconnectRedis } from "../../src/config/redis";
import prisma from "../../src/config/database";

export default async function globalTeardown(): Promise<void> {
  await disconnectRedis();
  await prisma.$disconnect();
}