// TapTrust design tokens
export const colors = {
  primary: '#6366f1',
  primaryDark: '#4f46e5',
  primaryLight: '#818cf8',
  primaryBg: '#eef2ff',
  white: '#ffffff',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',
  success: '#10b981',
  successBg: '#d1fae5',
  warning: '#f59e0b',
  warningBg: '#fef3c7',
  error: '#ef4444',
  errorBg: '#fee2e2',
  info: '#3b82f6',
  infoBg: '#dbeafe',
};

export const shadows = {
  sm: '0 1px 2px rgba(0,0,0,0.05)',
  md: '0 4px 6px rgba(0,0,0,0.07)',
  lg: '0 10px 15px rgba(0,0,0,0.1)',
  card: '0 2px 8px rgba(99,102,241,0.08)',
};

export const radius = {
  sm: '6px',
  md: '10px',
  lg: '16px',
  full: '9999px',
};

export const STATUS_COLORS = {
  Booked: { bg: '#dbeafe', text: '#1d4ed8' },
  Accepted: { bg: '#d1fae5', text: '#065f46' },
  'In Progress': { bg: '#fef3c7', text: '#92400e' },
  Completed: { bg: '#d1fae5', text: '#065f46' },
  Cancelled: { bg: '#f3f4f6', text: '#6b7280' },
  Rejected: { bg: '#fee2e2', text: '#991b1b' },
  Pending: { bg: '#fef3c7', text: '#92400e' },
  Verified: { bg: '#d1fae5', text: '#065f46' },
};

/**
 * Format a number as Indian Rupees (₹).
 * e.g. formatINR(1500) → "₹1,500"
 *      formatINR(1500.5) → "₹1,500.50"
 */
export function formatINR(amount) {
  if (amount === null || amount === undefined || amount === '') return '₹0';
  const num = parseFloat(amount);
  if (isNaN(num)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}
