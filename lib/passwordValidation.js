/**
 * Password validation utilities for MyMobPay merchant accounts.
 * Enforces strong passwords:
 * - At least 8 characters
 * - At least one uppercase letter (A-Z)
 * - At least one number (0-9)
 * - At least one special character (!@#$%^&*...)
 * - No sequential numbers (e.g. 123, 456, 789, 987, 321)
 * - No repeating numbers (e.g. 111, 222, 333)
 */

export function validateStrongPassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required.' };
  }

  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long.' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter (A-Z).' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number (0-9).' };
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one special character (e.g. !@#$%&*).' };
  }

  // Check for repeating numbers (3 identical digits in a row, e.g. 111, 222, 999)
  if (/(\d)\1\1/.test(password)) {
    return { valid: false, error: 'Password cannot contain repeating numbers (like 111, 222).' };
  }

  // Check for sequential numbers (3 consecutive increasing or decreasing digits, e.g. 123, 456, 987)
  for (let i = 0; i < password.length - 2; i++) {
    const c1 = password.charCodeAt(i);
    const c2 = password.charCodeAt(i + 1);
    const c3 = password.charCodeAt(i + 2);
    const isD1 = c1 >= 48 && c1 <= 57;
    const isD2 = c2 >= 48 && c2 <= 57;
    const isD3 = c3 >= 48 && c3 <= 57;
    if (isD1 && isD2 && isD3) {
      if ((c2 === c1 + 1 && c3 === c2 + 1) || (c2 === c1 - 1 && c3 === c2 - 1)) {
        return { valid: false, error: 'Password cannot contain sequential numbers (like 123, 456, or 987).' };
      }
    }
  }

  return { valid: true };
}

export function getPasswordCriteria(password = '') {
  const pwd = String(password || '');
  const hasMinLength = pwd.length >= 8;
  const hasUppercase = /[A-Z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(pwd);

  let hasSequence = false;
  for (let i = 0; i < pwd.length - 2; i++) {
    const c1 = pwd.charCodeAt(i);
    const c2 = pwd.charCodeAt(i + 1);
    const c3 = pwd.charCodeAt(i + 2);
    if (c1 >= 48 && c1 <= 57 && c2 >= 48 && c2 <= 57 && c3 >= 48 && c3 <= 57) {
      if ((c2 === c1 + 1 && c3 === c2 + 1) || (c2 === c1 - 1 && c3 === c2 - 1)) {
        hasSequence = true;
        break;
      }
    }
  }

  const hasRepeats = /(\d)\1\1/.test(pwd);
  const noSequenceOrRepeat = !hasSequence && !hasRepeats;

  const allMet = hasMinLength && hasUppercase && hasNumber && hasSpecial && noSequenceOrRepeat;

  return {
    hasMinLength,
    hasUppercase,
    hasNumber,
    hasSpecial,
    noSequenceOrRepeat,
    allMet,
    isValid: allMet,
  };
}
