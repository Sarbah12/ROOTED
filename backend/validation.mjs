import { badRequest } from './errors.mjs';

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function assertBody(value) {
  if (!isPlainObject(value)) {
    throw badRequest('Request body must be a JSON object');
  }

  return value;
}

export function rejectUnknownKeys(value, allowedKeys, context) {
  const unknownKeys = Object.keys(value).filter((key) => !allowedKeys.includes(key));

  if (unknownKeys.length > 0) {
    throw badRequest(`Unknown ${context} field(s): ${unknownKeys.join(', ')}`);
  }
}

export function optionalTrimmedString(value) {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw badRequest('Expected a string value');
  }

  return value.trim();
}

export function requiredTrimmedString(value, fieldName) {
  const result = optionalTrimmedString(value);

  if (!result) {
    throw badRequest(`${fieldName} is required`);
  }

  return result;
}

export function optionalArrayOfStrings(value, fieldName) {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw badRequest(`${fieldName} must be an array of strings`);
  }

  return value.map((item) => item.trim()).filter(Boolean);
}

export function optionalBoolean(value, fieldName) {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== 'boolean') {
    throw badRequest(`${fieldName} must be a boolean`);
  }

  return value;
}

export function optionalEnum(value, allowedValues, fieldName) {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (!allowedValues.includes(value)) {
    throw badRequest(`${fieldName} must be one of: ${allowedValues.join(', ')}`);
  }

  return value;
}
