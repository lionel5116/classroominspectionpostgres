// Classroom comfort range — readings outside this band surface as temp alerts.
const TEMP_MIN_F = 68;
const TEMP_MAX_F = 78;

// Cleanliness ratings are 1-5 stars; 2 or below surfaces as a cleanliness alert.
const CLEANLINESS_ALERT_THRESHOLD = 2;

function rangeToDays(range) {
  if (range === 'week') return 6;
  if (range === 'month') return 29;
  return 0; // 'today' (default)
}

module.exports = { TEMP_MIN_F, TEMP_MAX_F, CLEANLINESS_ALERT_THRESHOLD, rangeToDays };
