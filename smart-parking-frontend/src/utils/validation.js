export function nowLocalInputValue() {
  const now = new Date();
  now.setSeconds(0, 0);
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

export function validateSearchFilters({ location, startTime, endTime }) {
  const errors = {};
  const minDurationMs = 60 * 60 * 1000;
  const now = new Date();

  if (!location || !location.trim()) {
    errors.location = "Location is required";
  }

  if (!startTime) {
    errors.startTime = "From date-time is required";
  }

  if (!endTime) {
    errors.endTime = "Until date-time is required";
  }

  if (startTime) {
    const start = new Date(startTime);
    if (start < now) {
      errors.startTime = "From date-time cannot be in the past";
    }
  }

  if (startTime && endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (end <= start) {
      errors.endTime = "Until must be greater than From";
    } else if (end.getTime() - start.getTime() < minDurationMs) {
      errors.endTime = "Minimum booking duration is 1 hour";
    }
  }

  return errors;
}

export function isObjectEmpty(obj) {
  return Object.keys(obj).length === 0;
}

export function composeDateTime(date, time) {
  if (!date || !time) return "";
  return `${date}T${time}`;
}

export function validateSearchForm({ location, date, startTime, endTime }) {
  const errors = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!location?.trim()) errors.location = "Location is required";
  if (!date) errors.date = "Date is required";
  if (!startTime) errors.startTime = "Start time is required";
  if (!endTime) errors.endTime = "End time is required";

  if (date) {
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    if (selectedDate < today) errors.date = "Date cannot be in the past";
  }

  if (date && startTime && endTime) {
    const start = new Date(composeDateTime(date, startTime));
    const end = new Date(composeDateTime(date, endTime));
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      errors.endTime = "Enter valid time values";
    } else if (end <= start) {
      errors.endTime = "End time must be after start time";
    }
  }

  return errors;
}
