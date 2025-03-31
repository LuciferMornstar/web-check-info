import { extractPhoneExtension, formatPhoneNumber, formatEmail, formatAddress, formatURL, formatSocialMediaHandle } from './contactRules.js';

export function createContactFromData(name, email, phone, address = {}, url = "", socialHandles = {}, countryCode = "US") {
  const { phone: formattedPhone, extension } = extractPhoneExtension(phone);
  const formattedPhoneNumber = formatPhoneNumber(formattedPhone, countryCode);
  const formattedEmail = formatEmail(email);
  const formattedAddress = formatAddress(address, countryCode);
  const formattedURL = formatURL(url);

  const formattedHandles = {};
  if (socialHandles) {
    for (const [platform, handle] of Object.entries(socialHandles)) {
      formattedHandles[platform] = formatSocialMediaHandle(handle, platform);
    }
  }

  if (!name || !formattedPhoneNumber) return null;

  return {
    name: name.trim(),
    email: formattedEmail,
    phone: formattedPhoneNumber,
    address: formattedAddress,
    url: formattedURL,
    socialHandles: formattedHandles,
    extension,
    source: window.location.href,
  };
}
