import { validateDob, validateSsnLast4, validateEmail, validateIncome, validateTenure, validateAddress } from '../utils/validators.js';

describe('Validation Utilities', () => {
  describe('validateDob', () => {
    test('should validate correct DOB format', () => {
      expect(validateDob('1985-03-15')).toBe(true);
      expect(validateDob('1990-12-31')).toBe(true);
      expect(validateDob('2000-01-01')).toBe(true);
    });

    test('should reject invalid DOB formats', () => {
      expect(validateDob('1985/03/15')).toBe(false);
      expect(validateDob('Mar 15, 1985')).toBe(false);
      expect(validateDob('15-03-1985')).toBe(false);
      expect(validateDob('1985-3-15')).toBe(false);
    });

    test('should reject future dates', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const futureDateString = futureDate.toISOString().split('T')[0];
      expect(validateDob(futureDateString)).toBe(false);
    });

    test('should reject underage applicants', () => {
      const underageDate = new Date();
      underageDate.setFullYear(underageDate.getFullYear() - 17);
      const underageDateString = underageDate.toISOString().split('T')[0];
      expect(validateDob(underageDateString)).toBe(false);
    });

    test('should handle edge cases', () => {
      expect(validateDob('')).toBe(false);
      expect(validateDob(null)).toBe(false);
      expect(validateDob(undefined)).toBe(false);
      expect(validateDob('invalid')).toBe(false);
    });
  });

  describe('validateSsnLast4', () => {
    test('should validate correct SSN last 4', () => {
      expect(validateSsnLast4('1234')).toBe(true);
      expect(validateSsnLast4('0001')).toBe(true);
      expect(validateSsnLast4('9999')).toBe(true);
    });

    test('should reject invalid SSN formats', () => {
      expect(validateSsnLast4('123')).toBe(false);
      expect(validateSsnLast4('12345')).toBe(false);
      expect(validateSsnLast4('12-34')).toBe(false);
      expect(validateSsnLast4('abcd')).toBe(false);
    });

    test('should reject repeated digits', () => {
      expect(validateSsnLast4('0000')).toBe(false);
      expect(validateSsnLast4('1111')).toBe(false);
      expect(validateSsnLast4('9999')).toBe(true); // 9999 is valid
    });

    test('should handle edge cases', () => {
      expect(validateSsnLast4('')).toBe(false);
      expect(validateSsnLast4(null)).toBe(false);
      expect(validateSsnLast4(undefined)).toBe(false);
    });
  });

  describe('validateEmail', () => {
    test('should validate correct email formats', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('test+tag@example.org')).toBe(true);
    });

    test('should reject invalid email formats', () => {
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test.example.com')).toBe(false);
      expect(validateEmail('test@.com')).toBe(false);
    });

    test('should handle edge cases', () => {
      expect(validateEmail('')).toBe(false);
      expect(validateEmail(null)).toBe(false);
      expect(validateEmail(undefined)).toBe(false);
    });
  });

  describe('validateIncome', () => {
    test('should validate reasonable income amounts', () => {
      expect(validateIncome(1000)).toBe(true);
      expect(validateIncome(5000)).toBe(true);
      expect(validateIncome(10000)).toBe(true);
      expect(validateIncome(50000)).toBe(true);
    });

    test('should reject invalid income amounts', () => {
      expect(validateIncome(0)).toBe(false);
      expect(validateIncome(-1000)).toBe(false);
      expect(validateIncome(100001)).toBe(false);
    });

    test('should handle edge cases', () => {
      expect(validateIncome('5000')).toBe(false);
      expect(validateIncome(null)).toBe(false);
      expect(validateIncome(undefined)).toBe(false);
    });
  });

  describe('validateTenure', () => {
    test('should validate reasonable tenure periods', () => {
      expect(validateTenure(0)).toBe(true);
      expect(validateTenure(12)).toBe(true);
      expect(validateTenure(240)).toBe(true);
      expect(validateTenure(600)).toBe(true);
    });

    test('should reject invalid tenure periods', () => {
      expect(validateTenure(-1)).toBe(false);
      expect(validateTenure(601)).toBe(false);
    });

    test('should handle edge cases', () => {
      expect(validateTenure('24')).toBe(false);
      expect(validateTenure(null)).toBe(false);
      expect(validateTenure(undefined)).toBe(false);
    });
  });

  describe('validateAddress', () => {
    test('should validate complete addresses', () => {
      const validAddress = {
        street: '123 Main St',
        city: 'Denver',
        state: 'Colorado',
        zip_code: '80202'
      };
      expect(validateAddress(validAddress)).toBe(true);
    });

    test('should reject incomplete addresses', () => {
      expect(validateAddress({})).toBe(false);
      expect(validateAddress({ street: '123 Main St' })).toBe(false);
      expect(validateAddress({ street: '123 Main St', city: 'Denver' })).toBe(false);
    });

    test('should validate ZIP code formats', () => {
      const addressWithValidZip = {
        street: '123 Main St',
        city: 'Denver',
        state: 'Colorado',
        zip_code: '80202'
      };
      expect(validateAddress(addressWithValidZip)).toBe(true);

      const addressWithInvalidZip = {
        street: '123 Main St',
        city: 'Denver',
        state: 'Colorado',
        zip_code: '8020'
      };
      expect(validateAddress(addressWithInvalidZip)).toBe(false);
    });

    test('should handle edge cases', () => {
      expect(validateAddress(null)).toBe(false);
      expect(validateAddress(undefined)).toBe(false);
      expect(validateAddress('not an object')).toBe(false);
    });
  });
});
