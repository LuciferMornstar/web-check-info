import { isValidName } from '../contactRules.js';
import { createContactFromData } from './contactCreation.js';

export function extractContacts(document, contactType, contactInfo) {
  console.log('Starting extraction...');
  const nameRegex = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/g;
  const emailRegex = /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/g;
  const phoneRegex = /(\+?\d[\d\-\s()]{7,}\d)/g;
  const text = document.body?.innerText || "";
  if (!text) return [];
  const names = [...new Set(text.match(nameRegex) || [])];
  const emails = [...new Set(text.match(emailRegex) || [])];
  const phones = [...new Set(text.match(phoneRegex) || [])];

  names.forEach(n => contactInfo.names.add(n));
  emails.forEach(e => contactInfo.emails.add(e));
  phones.forEach(p => contactInfo.phones.add(p));

  // Process structured contact elements
  const structured = findStructuredContacts(document);
  structured.forEach(c => {
    if (!contactInfo.structured.some(item => item.name === c.name && item.email === c.email && item.phone === c.phone))
      contactInfo.structured.push(c);
  });
  // Return immediate results based on contactType
  if (contactType === 'names') return names;
  if (contactType === 'emails') return emails;
  if (contactType === 'phones') return phones;
  return [];
}

function findStructuredContacts(document) {
  const contacts = [];
  document.querySelectorAll('.vcard, .h-card').forEach(card => {
    const name = card.querySelector('.fn, .p-name')?.innerText.trim() || "";
    const email = card.querySelector('.email, .u-email')?.innerText.trim() || "";
    const phone = card.querySelector('.tel, .p-tel')?.innerText.trim() || "";
    if (name || email || phone) {
      contacts.push({ name, email, phone, source: window.location.href });
    }
  });
  return contacts;
}
