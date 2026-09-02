// Bank of Diva - Master Web Client
const BANK_CONFIG = {
  API_BASE_URL: 'https://script.google.com/macros/s/AKfycbwy_TnX5TE_jz6AX3XLv5aY9-A20ToQ07fqZKm7PTQ9NmaJUTnqmPHmewiAMUtuFMg/exec',
  CASH_APP_HANDLE: '$BrianDivaCox',
  CASH_APP_URL: 'https://cash.app/$BrianDivaCox',
  VENMO_HANDLE: '@BrianDivaCox',
  VENMO_URL: 'https://venmo.com/u/BrianDivaCox',
  DEFAULT_APR: 27.90
};

// API Client Helper
async function fetchBankApi(endpoint, params = {}) {
  try {
    const url = new URL(BANK_CONFIG.API_BASE_URL);
    url.searchParams.set('api', endpoint);
    Object.keys(params).forEach(k => url.searchParams.set(k, params[k]));

    const res = await fetch(url.toString(), { redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`Bank API (${endpoint}) offline or blocked:`, err);
    return null;
  }
}

// Utility: Format Currency
function formatMoney(amount) {
  const num = Number(amount) || 0;
  return '$' + Math.abs(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
