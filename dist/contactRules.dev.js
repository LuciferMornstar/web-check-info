"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isValidName = isValidName;
exports.formatPhoneNumber = formatPhoneNumber;
exports.extractPhoneExtension = extractPhoneExtension;
exports.formatEmail = formatEmail;
exports.formatAddress = formatAddress;
exports.formatURL = formatURL;
exports.formatSocialMediaHandle = formatSocialMediaHandle;

var _notNames = require("./notNames.js");

/**
 * Validates if a given word is likely a valid name.
 * @param {string} word - The word to validate.
 * @returns {boolean} True if the word is likely a valid name, false otherwise.
 */
function isValidName(word) {
  if (!word) return false; // Must start with an uppercase letter

  if (!/^[A-Z]/.test(word)) return false; // Must not be too short

  if (word.length < 2) return false; // Must not contain invalid characters

  if (!/^[A-Za-z'\-\s]+$/.test(word)) return false; // Check against common non-name words

  var forbidden = Object.values(_notNames.notNames).flat();
  if (forbidden.some(function (n) {
    return n.toLowerCase() === word.toLowerCase();
  })) return false; // Must not be a common URL or domain

  if (/^(www|http|https|\.com|\.org|\.net)/i.test(word)) return false; // Must not be a common abbreviation

  if (/^(Inc|Ltd|Co|Corp)\.?$/i.test(word)) return false; // Must not be a common job title or department

  if (/(CEO|CTO|CFO|COO|Director|Manager|President|Founder|Owner|Head of|Chief|VP|Vice President|Lead|Principal|Senior|Executive|Administrator|Coordinator|Supervisor|Associate|Assistant|Specialist|Sales|Marketing|Support|Customer Service|Technical Support|Customer Care|Help Desk|Contact Us|IT Department|HR Department|Human Resources|Administration|Billing|Accounts|Finance)/i.test(word)) return false;
  return true;
}
/**
 * Formats a phone number to E.164 format based on country-specific rules.
 * @param {string} phone - Raw phone number.
 * @param {string} [countryCode="US"] - e.g. "US", "UK".
 * @returns {string} Formatted phone number or empty string.
 */


function formatPhoneNumber(phone) {
  var countryCode = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "US";
  if (!phone || typeof phone !== "string") return "";
  var digits = phone.replace(/\D/g, "");
  var countryFormats = {
    US: {
      code: "+1",
      length: 10
    },
    UK: {
      code: "+44",
      length: 10
    },
    CA: {
      code: "+1",
      length: 10
    },
    AU: {
      code: "+61",
      length: 9
    },
    DE: {
      code: "+49",
      length: 10
    },
    FR: {
      code: "+33",
      length: 9
    },
    IN: {
      code: "+91",
      length: 10
    },
    JP: {
      code: "+81",
      length: 10
    },
    BR: {
      code: "+55",
      length: 11
    }
  };
  var format = countryFormats[countryCode] || countryFormats["US"];

  if (digits.length === format.length) {
    return "".concat(format.code).concat(digits);
  }

  if (digits.startsWith(format.code.replace("+", "")) && digits.length === format.length + format.code.length - 1) {
    return "+".concat(digits);
  }

  return "";
}
/**
 * Extracts and formats the extension from a phone number.
 * @param {string} phone - The raw phone number.
 * @returns {object} An object containing the cleaned phone number and extension.
 */


function extractPhoneExtension(phone) {
  var extension = "";
  var extMatch = phone.match(/(?:ext|x|ex|ext\.|extension)[-.\s]?(\d{1,7})/i);

  if (extMatch) {
    extension = extMatch[1];
    phone = phone.replace(/(?:ext|x|ex|ext\.|extension)[-.\s]?(\d{1,7})/i, "").trim();
  }

  return {
    phone: phone,
    extension: extension
  };
}
/**
 * Validates and formats an email address.
 * @param {string} email - The raw email address.
 * @returns {string} The formatted email address, or an empty string if invalid.
 */


function formatEmail(email) {
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


function formatAddress(address) {
  var countryCode = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "US";
  if (!address) return "";
  var countryFormats = {
    US: function US(_ref) {
      var name = _ref.name,
          street = _ref.street,
          city = _ref.city,
          state = _ref.state,
          zip = _ref.zip,
          country = _ref.country;
      return "".concat(name, ", ").concat(street, ", ").concat(city, ", ").concat(state, ", ").concat(zip, ", ").concat(country);
    },
    UK: function UK(_ref2) {
      var name = _ref2.name,
          street = _ref2.street,
          town = _ref2.town,
          county = _ref2.county,
          postcode = _ref2.postcode,
          country = _ref2.country;
      return "".concat(name, ", ").concat(street, ", ").concat(town, ", ").concat(county ? county + ", " : "").concat(postcode, ", ").concat(country);
    },
    CA: function CA(_ref3) {
      var name = _ref3.name,
          street = _ref3.street,
          city = _ref3.city,
          province = _ref3.province,
          postalCode = _ref3.postalCode,
          country = _ref3.country;
      return "".concat(name, ", ").concat(street, ", ").concat(city, ", ").concat(province, ", ").concat(postalCode, ", ").concat(country);
    },
    DE: function DE(_ref4) {
      var name = _ref4.name,
          street = _ref4.street,
          postalCode = _ref4.postalCode,
          city = _ref4.city,
          country = _ref4.country;
      return "".concat(name, ", ").concat(street, ", ").concat(postalCode, ", ").concat(city, ", ").concat(country);
    },
    FR: function FR(_ref5) {
      var name = _ref5.name,
          street = _ref5.street,
          postalCode = _ref5.postalCode,
          city = _ref5.city,
          country = _ref5.country;
      return "".concat(name, ", ").concat(street, ", ").concat(postalCode, ", ").concat(city, ", ").concat(country);
    },
    JP: function JP(_ref6) {
      var postalCode = _ref6.postalCode,
          prefecture = _ref6.prefecture,
          municipality = _ref6.municipality,
          street = _ref6.street,
          building = _ref6.building,
          name = _ref6.name,
          country = _ref6.country;
      return "".concat(postalCode, ", ").concat(prefecture, ", ").concat(municipality, ", ").concat(street, ", ").concat(building ? building + ", " : "").concat(name, ", ").concat(country);
    },
    AU: function AU(_ref7) {
      var name = _ref7.name,
          street = _ref7.street,
          suburb = _ref7.suburb,
          state = _ref7.state,
          postalCode = _ref7.postalCode,
          country = _ref7.country;
      return "".concat(name, ", ").concat(street, ", ").concat(suburb, ", ").concat(state, ", ").concat(postalCode, ", ").concat(country);
    },
    IN: function IN(_ref8) {
      var name = _ref8.name,
          street = _ref8.street,
          area = _ref8.area,
          city = _ref8.city,
          district = _ref8.district,
          state = _ref8.state,
          pin = _ref8.pin,
          country = _ref8.country;
      return "".concat(name, ", ").concat(street, ", ").concat(area, ", ").concat(city, ", ").concat(district, ", ").concat(state, ", ").concat(pin, ", ").concat(country);
    }
  };
  var format = countryFormats[countryCode] || countryFormats["US"];
  return format(address);
}
/**
 * Validates and formats a URL according to standard URL structure rules.
 * @param {string} url - The raw URL.
 * @returns {string} The formatted URL, or an empty string if invalid.
 */


function formatURL(url) {
  if (!url) return "";

  try {
    var parsedUrl = new URL(url);

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


function formatSocialMediaHandle(handle, platform) {
  if (!handle || !platform) return "";
  var platformRules = {
    Twitter: /^@[\w_]{1,15}$/,
    Instagram: /^@[\w.]{1,30}$/,
    Facebook: /^[a-zA-Z0-9.]{5,50}$/,
    LinkedIn: /^(linkedin\.com\/(in|company)\/[\w-]+)$/
  };
  var rule = platformRules[platform];
  if (!rule) return "";

  if (platform === "Twitter" || platform === "Instagram") {
    if (!handle.startsWith("@")) {
      handle = "@".concat(handle);
    }
  }

  if (rule.test(handle)) {
    return handle.trim();
  }

  return "";
}