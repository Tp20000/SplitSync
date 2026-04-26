// FILE: apps/server/tests/mocks/queue.ts
// PURPOSE: Mock BullMQ queues for unit tests
// LAST UPDATED: F43 Fix

export const emailQueue = {};
export const notificationQueue = {};
export const recurringExpenseQueue = {};
export const paymentReminderQueue = {};
export const QUEUE_NAMES = {};
export const addEmailJob = async () => {};
export const addNotificationJob = async () => {};
export const addRecurringExpenseJob = async () => {};
export const addPaymentReminderJob = async () => {};
export const closeAllQueues = async () => {};
export const Worker = class {};