import cron from 'node-cron';
import { Expo } from 'expo-server-sdk';
import type { FastifyBaseLogger } from 'fastify';

import { redis } from '../../config/redis.js';
import { prisma } from '../../config/database.js';

const expo = new Expo();
const PENDING_RECEIPTS_HASH = 'push:pending-receipts';

// Expo receipts are usually ready ~15 minutes after send; checking hourly
// keeps dead tokens from being retried forever without over-polling Expo.
export const checkPushReceipts = async (log: FastifyBaseLogger): Promise<void> => {
  const pending = await redis.hgetall(PENDING_RECEIPTS_HASH);
  const ticketIds = Object.keys(pending);
  if (ticketIds.length === 0) return;

  const chunks = expo.chunkPushNotificationReceiptIds(ticketIds);
  for (const chunk of chunks) {
    try {
      const receipts = await expo.getPushNotificationReceiptsAsync(chunk);
      for (const ticketId of chunk) {
        const receipt = receipts[ticketId];
        const token = pending[ticketId];
        if (receipt?.status === 'error' && receipt.details?.error === 'DeviceNotRegistered' && token) {
          await prisma.pushToken.delete({ where: { token } }).catch(() => undefined);
        }
      }
    } catch (err) {
      log.error({ err }, '[PushReceiptCheck] Failed to fetch a receipt chunk — will retry next run');
      continue; // leave these ticket ids in the hash for the next run
    }
    await redis.hdel(PENDING_RECEIPTS_HASH, ...chunk);
  }
};

export const startPushReceiptCheck = (log: FastifyBaseLogger) =>
  cron.schedule('0 * * * *', () => {
    checkPushReceipts(log).catch((err) => log.error({ err }, '[PushReceiptCheck] run failed'));
  });
