// The local Postgres connection can occasionally drop an idle pooled
// connection or briefly refuse new ones during a restart. Retrying
// immediately can still fail — the pool needs a moment to actually evict the
// dead connection and hand out a fresh one — so a short delay is given
// between attempts rather than retrying in the same tick.
const TRANSIENT_CODES = new Set([
  'ECONNRESET', 'ECONNCLOSED', 'ETIMEOUT',
  '57P01', // admin_shutdown
  '57P02', // crash_shutdown
  '57P03', // cannot_connect_now
  '08000', // connection_exception
  '08003', // connection_does_not_exist
  '08006', // connection_failure
]);
const RETRY_DELAY_MS = 150;
const MAX_ATTEMPTS = 3;

function isTransient(err) {
  return TRANSIENT_CODES.has(err.code) || /connection lost/i.test(err.message || '');
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry(fn) {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (!isTransient(err) || attempt === MAX_ATTEMPTS) {
        throw err;
      }
      await delay(RETRY_DELAY_MS * attempt);
    }
  }
}

module.exports = { withRetry };
