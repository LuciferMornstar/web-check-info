import { isValidName, formatPhoneNumber, extractPhoneExtension, formatEmail, formatAddress, formatURL, formatSocialMediaHandle } from '../contactRules.js';

export function createContactFromData(name, email, phone, address = {}, url = "", socialHandles = {}, countryCode = "US", contactInfo) {
  const { phone: cleanedPhone, extension } = extractPhoneExtension(phone);
  const formattedPhone = formatPhoneNumber(cleanedPhone, countryCode);
  const formattedEmail = formatEmail(email);
  const formattedAddress = formatAddress(address, countryCode);
  const formattedURL = formatURL(url);
  
  // Only create a contact if we have at least a name or a formatted phone/email.
  if (!name && !formattedPhone && !formattedEmail) return;
  
  const contact = { 
    name: name.trim(), 
    email: formattedEmail, 
    phone: formattedPhone,
    address: formattedAddress,
    url: formattedURL,
    socialHandles: Object.entries(socialHandles || {}).reduce((acc, [platform, handle]) => {
      acc[platform] = formatSocialMediaHandle(handle, platform);
      return acc;
    }, {}),
    extension,
    source: window.location.href 
  };
  
  // Add only if not already present
  if (!contactInfo.structured.some(c => c.name === contact.name && c.email === contact.email && c.phone === contact.phone)) {
    contactInfo.structured.push(contact);
    // Immediately broadcast the contact for display updates.
    chrome.runtime.sendMessage({ newStructuredContact: contact });
  }
}
