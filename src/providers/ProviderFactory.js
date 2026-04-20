'use strict';

const MTNProvider = require('./MTNProvider');
const OrangeProvider = require('./OrangeProvider');
const config = require('../config');
const { decrypt } = require('../core/encryption');
const { db } = require('../core/database');
const { NotFoundError, ValidationError } = require('../core/errors');

const REGISTRY = {
  [MTNProvider.id]: { Provider: MTNProvider, defaultBaseUrl: config.providers.mtn.baseUrl },
  [OrangeProvider.id]: { Provider: OrangeProvider, defaultBaseUrl: config.providers.orange.baseUrl }
};

/**
 * Register a new provider at runtime. Extensibility hook for 3rd-party
 * providers without touching factory code directly.
 */
function registerProvider(id, Provider, defaultBaseUrl) {
  REGISTRY[id] = { Provider, defaultBaseUrl };
}

function listProviders() {
  return Object.keys(REGISTRY);
}

/**
 * Instantiate a provider for a given school by loading & decrypting its
 * stored credentials. Throws if the school hasn't configured this provider.
 */
async function getProviderForSchool(schoolId, providerId) {
  const entry = REGISTRY[providerId];
  if (!entry) throw new ValidationError(`Unsupported provider: ${providerId}`);

  const res = await db.query(
    'SELECT * FROM payment_configs WHERE school_id = $1 AND provider = $2 AND is_active = TRUE',
    [schoolId, providerId]
  );
  const row = res.rows[0];
  if (!row) throw new NotFoundError(`Provider ${providerId} not configured for this school`);

  const credentials = {
    api_key: decrypt(row.api_key),
    api_secret: decrypt(row.api_secret)
  };
  const metadata = row.metadata ? JSON.parse(row.metadata) : {};

  return new entry.Provider({
    credentials,
    baseUrl: row.base_url || entry.defaultBaseUrl,
    metadata
  });
}

module.exports = { registerProvider, listProviders, getProviderForSchool, REGISTRY };
