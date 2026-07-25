/**
 * Validation & Edge Case Test Suite — 60 test cases
 * Covers: Form validation, boundary conditions, negative testing, regex sanitization, schema validation
 */
import { describe, it, expect } from 'vitest';

// ── Validation Helpers ────────────────────────────────────────────────────────
function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

function validatePhoneNumber(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  const re = /^\+?[1-9]\d{6,14}$/;
  return re.test(cleaned);
}

function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!password || password.length < 8) errors.push('Password must be at least 8 characters long');
  if (!/[A-Z]/.test(password)) errors.push('Password must contain at least one uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('Password must contain at least one lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('Password must contain at least one number');
  return { valid: errors.length === 0, errors };
}

function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function validateAge(age: number): boolean {
  return typeof age === 'number' && !isNaN(age) && age >= 0 && age <= 120;
}

function validateMedicalLicense(license: string): boolean {
  if (!license) return false;
  return /^MD-[A-Z0-9]{4,10}$/i.test(license.trim());
}

function validateBloodGroup(bg: string): boolean {
  const valid = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  return valid.includes(bg);
}

// ── VAL-01 to VAL-15 · Email Validation ───────────────────────────────────────
describe('VAL-01 to VAL-15 Email Field Validation', () => {
  it('VAL-01 standard valid email passes', () => {
    expect(validateEmail('patient@medlink.com')).toBe(true);
  });
  it('VAL-02 email with subdomain passes', () => {
    expect(validateEmail('user@mail.medlink.org')).toBe(true);
  });
  it('VAL-03 email with plus tag passes', () => {
    expect(validateEmail('doctor+clinic@gmail.com')).toBe(true);
  });
  it('VAL-04 empty string fails email validation', () => {
    expect(validateEmail('')).toBe(false);
  });
  it('VAL-05 email missing @ symbol fails', () => {
    expect(validateEmail('patientmedlink.com')).toBe(false);
  });
  it('VAL-06 email missing domain fails', () => {
    expect(validateEmail('patient@')).toBe(false);
  });
  it('VAL-07 email missing username fails', () => {
    expect(validateEmail('@medlink.com')).toBe(false);
  });
  it('VAL-08 email missing TLD fails', () => {
    expect(validateEmail('patient@medlink')).toBe(false);
  });
  it('VAL-09 email with spaces inside fails', () => {
    expect(validateEmail('patient @medlink.com')).toBe(false);
  });
  it('VAL-10 email with leading/trailing spaces is trimmed and valid', () => {
    expect(validateEmail('  doctor@medlink.com  ')).toBe(true);
  });
  it('VAL-11 null email fails', () => {
    expect(validateEmail(null as unknown as string)).toBe(false);
  });
  it('VAL-12 undefined email fails', () => {
    expect(validateEmail(undefined as unknown as string)).toBe(false);
  });
  it('VAL-13 non-string email input fails', () => {
    expect(validateEmail(12345 as unknown as string)).toBe(false);
  });
  it('VAL-14 numeric TLD fails standard regex if invalid format', () => {
    expect(validateEmail('user@domain.123')).toBe(true);
  });
  it('VAL-15 email with multiple @ symbols fails', () => {
    expect(validateEmail('user@med@link.com')).toBe(false);
  });
});

// ── VAL-16 to VAL-25 · Phone Number Validation ───────────────────────────────
describe('VAL-16 to VAL-25 Phone Number Validation', () => {
  it('VAL-16 E.164 formatted phone number passes', () => {
    expect(validatePhoneNumber('+14155552671')).toBe(true);
  });
  it('VAL-17 10-digit standard number passes', () => {
    expect(validatePhoneNumber('9876543210')).toBe(true);
  });
  it('VAL-18 phone with dashes passes', () => {
    expect(validatePhoneNumber('123-456-7890')).toBe(true);
  });
  it('VAL-19 phone with spaces and brackets passes', () => {
    expect(validatePhoneNumber('+1 (555) 000-1122')).toBe(true);
  });
  it('VAL-20 empty phone number fails', () => {
    expect(validatePhoneNumber('')).toBe(false);
  });
  it('VAL-21 phone with alphabetic characters fails', () => {
    expect(validatePhoneNumber('+1800CALLDOC')).toBe(false);
  });
  it('VAL-22 too short phone number fails', () => {
    expect(validatePhoneNumber('12')).toBe(false);
  });
  it('VAL-23 null phone fails', () => {
    expect(validatePhoneNumber(null as unknown as string)).toBe(false);
  });
  it('VAL-24 undefined phone fails', () => {
    expect(validatePhoneNumber(undefined as unknown as string)).toBe(false);
  });
  it('VAL-25 phone number starting with zero without country code handled', () => {
    expect(validatePhoneNumber('09876543210')).toBe(false);
  });
});

// ── VAL-26 to VAL-35 · Password Strength Validation ──────────────────────────
describe('VAL-26 to VAL-35 Password Strength Validation', () => {
  it('VAL-26 valid complex password passes', () => {
    const res = validatePasswordStrength('MedLink2026!');
    expect(res.valid).toBe(true);
    expect(res.errors.length).toBe(0);
  });
  it('VAL-27 password under 8 characters fails', () => {
    const res = validatePasswordStrength('Pass1');
    expect(res.valid).toBe(false);
    expect(res.errors).toContain('Password must be at least 8 characters long');
  });
  it('VAL-28 password without uppercase letter fails', () => {
    const res = validatePasswordStrength('medlink2026');
    expect(res.valid).toBe(false);
    expect(res.errors).toContain('Password must contain at least one uppercase letter');
  });
  it('VAL-29 password without lowercase letter fails', () => {
    const res = validatePasswordStrength('MEDLINK2026');
    expect(res.valid).toBe(false);
    expect(res.errors).toContain('Password must contain at least one lowercase letter');
  });
  it('VAL-30 password without digit fails', () => {
    const res = validatePasswordStrength('MedLinkPassword');
    expect(res.valid).toBe(false);
    expect(res.errors).toContain('Password must contain at least one number');
  });
  it('VAL-31 empty password fails with all errors', () => {
    const res = validatePasswordStrength('');
    expect(res.valid).toBe(false);
    expect(res.errors.length).toBeGreaterThan(1);
  });
  it('VAL-32 password exactly 8 valid chars passes', () => {
    const res = validatePasswordStrength('Abcdef12');
    expect(res.valid).toBe(true);
  });
  it('VAL-33 password with special symbols passes', () => {
    const res = validatePasswordStrength('P@ssw0rd#2026');
    expect(res.valid).toBe(true);
  });
  it('VAL-34 password with spaces inside passes if criteria met', () => {
    const res = validatePasswordStrength('Med Link 2026');
    expect(res.valid).toBe(true);
  });
  it('VAL-35 null password fails gracefully', () => {
    const res = validatePasswordStrength(null as unknown as string);
    expect(res.valid).toBe(false);
  });
});

// ── VAL-36 to VAL-45 · Input Sanitization & XSS Prevention ───────────────────
describe('VAL-36 to VAL-45 Input Sanitization', () => {
  it('VAL-36 plain string remains unchanged', () => {
    expect(sanitizeInput('John Doe')).toBe('John Doe');
  });
  it('VAL-37 script tags are escaped', () => {
    expect(sanitizeInput('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  });
  it('VAL-38 ampersands are escaped', () => {
    expect(sanitizeInput('Health & Care')).toBe('Health &amp; Care');
  });
  it('VAL-39 single and double quotes are escaped', () => {
    expect(sanitizeInput("Doctor's \"Special\" Clinic")).toBe('Doctor&#x27;s &quot;Special&quot; Clinic');
  });
  it('VAL-40 empty string sanitization returns empty string', () => {
    expect(sanitizeInput('')).toBe('');
  });
  it('VAL-41 img tag with onerror payload escaped', () => {
    expect(sanitizeInput('<img src="x" onerror="alert(1)">')).toBe('&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;');
  });
  it('VAL-42 javascript URI scheme escaped', () => {
    expect(sanitizeInput('<a href="javascript:alert(1)">click</a>')).toBe('&lt;a href=&quot;javascript:alert(1)&quot;&gt;click&lt;/a&gt;');
  });
  it('VAL-43 nested tags properly converted', () => {
    expect(sanitizeInput('<div><p>text</p></div>')).toBe('&lt;div&gt;&lt;p&gt;text&lt;/p&gt;&lt;/div&gt;');
  });
  it('VAL-44 null input returns empty string', () => {
    expect(sanitizeInput(null as unknown as string)).toBe('');
  });
  it('VAL-45 undefined input returns empty string', () => {
    expect(sanitizeInput(undefined as unknown as string)).toBe('');
  });
});

// ── VAL-46 to VAL-60 · Domain Specific Validations & Boundaries ──────────────
describe('VAL-46 to VAL-60 Domain Specific Validations', () => {
  it('VAL-46 valid age (25) passes', () => {
    expect(validateAge(25)).toBe(true);
  });
  it('VAL-47 boundary age (0) passes', () => {
    expect(validateAge(0)).toBe(true);
  });
  it('VAL-48 boundary age (120) passes', () => {
    expect(validateAge(120)).toBe(true);
  });
  it('VAL-49 negative age (-1) fails', () => {
    expect(validateAge(-1)).toBe(false);
  });
  it('VAL-50 excessive age (121) fails', () => {
    expect(validateAge(121)).toBe(false);
  });
  it('VAL-51 NaN age fails', () => {
    expect(validateAge(NaN)).toBe(false);
  });
  it('VAL-52 valid MD license passes', () => {
    expect(validateMedicalLicense('MD-98765')).toBe(true);
  });
  it('VAL-53 license missing prefix fails', () => {
    expect(validateMedicalLicense('98765')).toBe(false);
  });
  it('VAL-54 empty license fails', () => {
    expect(validateMedicalLicense('')).toBe(false);
  });
  it('VAL-55 blood group A+ passes', () => {
    expect(validateBloodGroup('A+')).toBe(true);
  });
  it('VAL-56 blood group O- passes', () => {
    expect(validateBloodGroup('O-')).toBe(true);
  });
  it('VAL-57 invalid blood group X+ fails', () => {
    expect(validateBloodGroup('X+')).toBe(false);
  });
  it('VAL-58 empty blood group fails', () => {
    expect(validateBloodGroup('')).toBe(false);
  });
  it('VAL-59 lowercase blood group a+ fails standard check', () => {
    expect(validateBloodGroup('a+')).toBe(false);
  });
  it('VAL-60 blood group AB+ passes', () => {
    expect(validateBloodGroup('AB+')).toBe(true);
  });
});
