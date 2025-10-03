import { format, parseISO } from 'date-fns';

/**
 * Formats a date string for voice output
 * @param {string} isoDateString - Date in YYYY-MM-DD format
 * @returns {string} - Voice-optimized date string
 */
export function formatSpokenDate(isoDateString) {
  try {
    const date = parseISO(isoDateString);
    return format(date, 'MMMM do, yyyy');
  } catch (error) {
    return isoDateString; // Fallback to original if parsing fails
  }
}

/**
 * Formats digits for voice output (e.g., "7234" -> "7-2-3-4")
 * @param {string} digits - String of digits
 * @returns {string} - Voice-optimized digit string
 */
export function formatSpokenDigits(digits) {
  if (!digits || typeof digits !== 'string') return digits;
  return digits.split('').join('-');
}

/**
 * Formats email for voice output
 * @param {string} email - Email address
 * @returns {string} - Voice-optimized email string
 */
export function formatSpokenEmail(email) {
  if (!email) return email;
  
  return email
    .replace('@', ' at ')
    .replace(/\./g, ' dot ')
    .split('')
    .join('-')
    .replace(/-/g, ' ');
}

/**
 * Formats currency for voice output
 * @param {number} amount - Currency amount
 * @returns {string} - Voice-optimized currency string
 */
export function formatSpokenCurrency(amount) {
  if (typeof amount !== 'number') return amount;
  return `$${amount.toLocaleString()}`;
}

/**
 * Formats address for voice output
 * @param {object} address - Address object
 * @returns {string} - Voice-optimized address string
 */
export function formatSpokenAddress(address) {
  if (!address) return '';
  
  let result = address.street || '';
  if (address.unit) {
    result += `, ${address.unit}`;
  }
  if (address.city) {
    result += `, ${address.city}`;
  }
  if (address.state) {
    result += `, ${address.state}`;
  }
  if (address.zip_code) {
    result += `, ${address.zip_code}`;
  }
  
  return result;
}
