/**
 * Utility formatters for STVMS
 */

/**
 * Format a number as Indian Rupees currency
 */
export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format a Date, Firestore Timestamp, or ISO string to a readable date/time
 */
export const formatDate = (value, { dateOnly = false } = {}) => {
  if (!value) return '—';
  let d;
  if (value?.toDate) {
    d = value.toDate();
  } else if (value instanceof Date) {
    d = value;
  } else {
    d = new Date(value);
  }
  if (isNaN(d.getTime())) return '—';
  if (dateOnly) {
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Format a Karnataka vehicle registration number as user types
 */
export const formatRegNumber = (input) => {
  const raw = input.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 10);
  let result = '';
  if (raw.length > 0) result += raw.slice(0, 2);
  if (raw.length > 2) result += '-' + raw.slice(2, 4);
  if (raw.length > 4) result += '-' + raw.slice(4, 6);
  if (raw.length > 6) result += '-' + raw.slice(6, 10);
  return result;
};

/**
 * Truncate a string to a given length
 */
export const truncate = (str, length = 40) => {
  if (!str) return '';
  return str.length > length ? str.slice(0, length) + '…' : str;
};

/**
 * Get relative time string (e.g. "2 hours ago")
 */
export const timeAgo = (value) => {
  if (!value) return '';
  let d;
  if (value?.toDate) d = value.toDate();
  else if (value instanceof Date) d = value;
  else d = new Date(value);
  if (isNaN(d.getTime())) return '';
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};
