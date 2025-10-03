/**
 * Validates date of birth format and basic logic
 * @param {string} dob - Date in YYYY-MM-DD format
 * @returns {boolean} - Whether the date is valid
 */
export function validateDob(dob) {
  if (!dob || typeof dob !== 'string') return false;
  
  // Check format YYYY-MM-DD
  const dobRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dobRegex.test(dob)) return false;
  
  // Check if it's a valid date
  const date = new Date(dob);
  if (isNaN(date.getTime())) return false;
  
  // Check if date is not in the future
  if (date > new Date()) return false;
  
  // Check if person is at least 18 years old
  const age = new Date().getFullYear() - date.getFullYear();
  if (age < 18) return false;
  
  return true;
}

/**
 * Validates last 4 digits of SSN
 * @param {string} ssn - Last 4 digits of SSN
 * @returns {boolean} - Whether the SSN is valid
 */
export function validateSsnLast4(ssn) {
  if (!ssn || typeof ssn !== 'string') return false;
  
  // Remove any non-digit characters
  const cleanSsn = ssn.replace(/\D/g, '');
  
  // Check if exactly 4 digits
  if (cleanSsn.length !== 4) return false;
  
  // Check if all digits are not the same (e.g., 0000, 1111)
  if (/^(\d)\1{3}$/.test(cleanSsn)) return false;
  
  return true;
}

/**
 * Validates email format
 * @param {string} email - Email address
 * @returns {boolean} - Whether the email is valid
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates income amount
 * @param {number} income - Monthly income
 * @returns {boolean} - Whether the income is valid
 */
export function validateIncome(income) {
  if (typeof income !== 'number') return false;
  if (income <= 0) return false;
  if (income > 100000) return false; // Reasonable upper limit
  
  return true;
}

/**
 * Validates job tenure
 * @param {number} tenure - Tenure in months
 * @returns {boolean} - Whether the tenure is valid
 */
export function validateTenure(tenure) {
  if (typeof tenure !== 'number') return false;
  if (tenure < 0) return false;
  if (tenure > 600) return false; // 50 years max
  
  return true;
}

/**
 * Validates address object
 * @param {object} address - Address object
 * @returns {boolean} - Whether the address is valid
 */
export function validateAddress(address) {
  if (!address || typeof address !== 'object') return false;
  
  const requiredFields = ['street', 'city', 'state', 'zip_code'];
  for (const field of requiredFields) {
    if (!address[field] || typeof address[field] !== 'string') {
      return false;
    }
  }
  
  // Basic ZIP code validation
  const zipRegex = /^\d{5}(-\d{4})?$/;
  if (!zipRegex.test(address.zip_code)) return false;
  
  return true;
}
