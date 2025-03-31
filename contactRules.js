"use strict";
import { notNames } from "./notNames.js";

/**
 * Validates if a given word is likely a valid name.
 * @param {string} word - The word to validate.
 * @returns {boolean} True if the word is likely a valid name, false otherwise.
 */
export function isValidName(word) {
  if (!word) return false;
  
  // Must start with an uppercase letter
  if (!/^[A-Z]/.test(word)) return false;
  
  // Must not be too short
  if (word.length < 2) return false;
  
  // Must not contain invalid characters
  if (!/^[A-Za-z'\-\s]+$/.test(word)) return false;
  
  // Check against common non-name words
  const forbidden = Object.values(notNames).flat();
  if (forbidden.some(n => n.toLowerCase() === word.toLowerCase())) return false;
  
  // Must not be a common URL or domain
  if (/^(www|http|https|\.com|\.org|\.net)/i.test(word)) return false;
  
  // Must not be a common abbreviation
  if (/^(Inc|Ltd|Co|Corp)\.?$/i.test(word)) return false;
  
  // Must not be a common job title or department
  if (/(CEO|CTO|CFO|COO|Director|Manager|President|Founder|Owner|Head of|Chief|VP|Vice President|Lead|Principal|Senior|Executive|Administrator|Coordinator|Supervisor|Associate|Assistant|Specialist|Sales|Marketing|Support|Customer Service|Technical Support|Customer Care|Help Desk|Contact Us|IT Department|HR Department|Human Resources|Administration|Billing|Accounts|Finance)/i.test(word)) return false;
  
  return true;
}

/**
 * Formats a phone number to E.164 format based on country-specific rules.
 * @param {string} phone - Raw phone number.
 * @param {string} [countryCode="US"] - e.g. "US", "UK".
 * @returns {string} Formatted phone number or empty string.
 */
export function formatPhoneNumber(phone, countryCode = "US") {
  if (!phone || typeof phone !== "string") return "";
  const digits = phone.replace(/\D/g, "");
  const countryFormats = {
    US: { code: "+1", length: 10 },
    UK: { code: "+44", length: 10 },
    CA: { code: "+1", length: 10 },
    AU: { code: "+61", length: 9 },
    DE: { code: "+49", length: 10 },
    FR: { code: "+33", length: 9 },
    IN: { code: "+91", length: 10 },
    JP: { code: "+81", length: 10 },
    BR: { code: "+55", length: 11 },
  };
  const format = countryFormats[countryCode] || countryFormats["US"];
  if (digits.length === format.length) {
    return `${format.code}${digits}`;
  }
  if (
    digits.startsWith(format.code.replace("+", "")) &&
    digits.length === format.length + format.code.length - 1
  ) {
    return `+${digits}`;
  }
  return "";
}

/**
 * Extracts and formats the extension from a phone number.
 * @param {string} phone - The raw phone number.
 * @returns {object} An object containing the cleaned phone number and extension.
 */
export function extractPhoneExtension(phone) {
  let extension = "";
  const extMatch = phone.match(/(?:ext|x|ex|ext\.|extension)[-.\s]?(\d{1,7})/i);
  if (extMatch) {
    extension = extMatch[1];
    phone = phone.replace(/(?:ext|x|ex|ext\.|extension)[-.\s]?(\d{1,7})/i, "").trim();
  }
  return { phone, extension };
}

/**
 * Validates and formats an email address.
 * @param {string} email - The raw email address.
 * @returns {string} The formatted email address, or an empty string if invalid.
 */
export function formatEmail(email) {
  if (!email) return "";
  email = email.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

/**
 * Formats an address according to country-specific rules.
 * @param {object} address - The raw address details.
 * @param {string} [countryCode="US"] - The country code (e.g., "US", "UK", "CA").
 * @returns {string} The formatted address.
 */
export function formatAddress(address, countryCode = "US") {
  if (!address) return "";

  const countryFormats = {
    US: ({ name, street, city, state, zip, country }) =>
      `${name}, ${street}, ${city}, ${state}, ${zip}, ${country}`,
    UK: ({ name, street, town, county, postcode, country }) =>
      `${name}, ${street}, ${town}, ${county ? county + ", " : ""}${postcode}, ${country}`,
    CA: ({ name, street, city, province, postalCode, country }) =>
      `${name}, ${street}, ${city}, ${province}, ${postalCode}, ${country}`,
    DE: ({ name, street, postalCode, city, country }) =>
      `${name}, ${street}, ${postalCode}, ${city}, ${country}`,
    FR: ({ name, street, postalCode, city, country }) =>
      `${name}, ${street}, ${postalCode}, ${city}, ${country}`,
    JP: ({ postalCode, prefecture, municipality, street, building, name, country }) =>
      `${postalCode}, ${prefecture}, ${municipality}, ${street}, ${building ? building + ", " : ""}${name}, ${country}`,
    AU: ({ name, street, suburb, state, postalCode, country }) =>
      `${name}, ${street}, ${suburb}, ${state}, ${postalCode}, ${country}`,
    IN: ({ name, street, area, city, district, state, pin, country }) =>
      `${name}, ${street}, ${area}, ${city}, ${district}, ${state}, ${pin}, ${country}`
  };

  const format = countryFormats[countryCode] || countryFormats["US"];
  return format(address);
}

/**
 * Validates and formats a URL according to standard URL structure rules.
 * @param {string} url - The raw URL.
 * @returns {string} The formatted URL, or an empty string if invalid.
 */
export function formatURL(url) {
  if (!url) return "";

  try {
    const parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return "";
    }
    parsedUrl.hostname = parsedUrl.hostname.toLowerCase();
    parsedUrl.pathname = parsedUrl.pathname.replace(/\/+$/, "");
    return parsedUrl.toString();
  } catch (error) {
    return "";
  }
}

/**
 * Validates and formats a social media handle based on platform-specific rules.
 * @param {string} handle - The raw social media handle.
 * @param {string} platform - The social media platform (e.g., "Twitter", "Instagram", "Facebook", "LinkedIn").
 * @returns {string} The formatted handle with the appropriate prefix, or an empty string if invalid.
 */
export function formatSocialMediaHandle(handle, platform) {
  if (!handle || !platform) return "";

  const platformRules = {
    Twitter: /^@[\w_]{1,15}$/,
    Instagram: /^@[\w.]{1,30}$/,
    Facebook: /^[a-zA-Z0-9.]{5,50}$/,
    LinkedIn: /^(linkedin\.com\/(in|company)\/[\w-]+)$/
  };

  const rule = platformRules[platform];
  if (!rule) return "";

  if (platform === "Twitter" || platform === "Instagram") {
    if (!handle.startsWith("@")) {
      handle = `@${handle}`;
    }
  }

  if (rule.test(handle)) {
    return handle.trim();
  }

  return "";
}
