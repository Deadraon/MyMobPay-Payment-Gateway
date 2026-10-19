/**
 * Sensitive Data Masking Utility
 * 
 * Mask-by-default for bank accounts, UPI IDs, API keys, phone numbers, and tax credentials.
 */

export function maskBankAccount(accountNumber) {
  if (!accountNumber) return 'Not configured';
  const clean = String(accountNumber).trim();
  if (clean.length <= 4) return '••••';
  const last4 = clean.slice(-4);
  return `•••• •••• ${last4}`;
}

export function maskPhone(phone) {
  if (!phone) return 'Not set';
  const clean = String(phone).trim().replace(/\s+/g, '');
  if (clean.length < 6) return '••••';
  const prefix = clean.slice(0, 4);
  const suffix = clean.slice(-2);
  return `${prefix} •••• ••${suffix}`;
}

export function maskUpi(upiId) {
  if (!upiId || upiId === 'pending@upi' || upiId === 'Not configured') return upiId || 'Not configured';
  const parts = String(upiId).split('@');
  if (parts.length !== 2) return upiId;
  const [handle, vpaProvider] = parts;
  if (handle.length <= 2) return `${handle.charAt(0)}•@${vpaProvider}`;
  const maskedHandle = `${handle.charAt(0)}••••${handle.slice(-1)}`;
  return `${maskedHandle}@${vpaProvider}`;
}

export function maskApiKey(key) {
  if (!key) return '(no key)';
  const str = String(key);
  if (str.length <= 8) return '••••••••';
  return `${str.slice(0, 6)}••••••••••••${str.slice(-4)}`;
}

export function maskPan(pan) {
  if (!pan) return 'N/A';
  const clean = String(pan).trim().toUpperCase();
  if (clean.length !== 10) return '••••••••••';
  return `${clean.slice(0, 3)}•••••${clean.slice(-2)}`;
}

export function maskGstin(gstin) {
  if (!gstin) return 'N/A';
  const clean = String(gstin).trim().toUpperCase();
  if (clean.length < 6) return '•••••••••••••••';
  return `${clean.slice(0, 2)}••••••••••${clean.slice(-3)}`;
}

/**
 * Applies default masking to a merchant profile object for safe API serialization.
 */
export function maskMerchantRecord(merchant, allowReveal = false) {
  if (!merchant) return null;
  if (allowReveal) return merchant;

  return {
    ...merchant,
    bank_account_number_masked: maskBankAccount(merchant.bank_account_number),
    phone_number_masked: maskPhone(merchant.phone_number),
    upi_id_masked: maskUpi(merchant.upi_id),
    api_key_masked: maskApiKey(merchant.api_key),
    gstin_masked: maskGstin(merchant.gstin),
    // Remove raw sensitive credentials from unpermissioned payload
    bank_account_number: maskBankAccount(merchant.bank_account_number),
    api_key: maskApiKey(merchant.api_key),
  };
}
