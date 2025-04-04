"use strict";
import { formatPhoneNumber, extractPhoneExtension } from '../contactRules.js';

export const patterns = {
  // Maximum change: allow extended international names and titles
  name: /(?:(?:Dr|Prof|Professor|Mr|Mrs|Ms|Miss|Sir|Dame|Revd|Rev|Hon|Lady)\s+)?(?:[A-Z][a-z]{1,20}(?:\s+[A-Z][a-z]{1,20}){1,4})/g,
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
  phone: /(?:\+?(?:1|44|33|49|61|7|8[01]|9[0-9]|[2-9])\s?)?(?:\(?\d{3,4}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}(?:(?:\s?(?:x|ext|extension)[\s.]?)?\d{1,5})?/gi,
  specialty: /(?:Specialty|Speciality|Practice):\s*([A-Za-z\s&]+)/gi,
  location: /(?:Location|Address|Hospital|Office):\s*([A-Za-z0-9\s,.'&-]+)/gi
};

// Filter functions remain unchanged
function filterValidEmails(emails) {
  return emails.filter(email => 
    !email.includes('example.com') && 
    !email.includes('domain.com') &&
    !email.includes('test.com') &&
    !email.match(/\d{10,}/)
  );
}

function filterValidPhones(phones) {
  return phones.filter(phone => {
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 7 && digits.length <= 15;
  });
}

function filterValidNames(names) {
  const commonNonNames = [
    'Privacy Policy', 'Terms Of Service', 'All Rights Reserved', 'Contact Us', 
    'Read More', 'Learn More', 'Sign Up', 'Log In', 'Sign In'
  ];
  return names.filter(name => {
    if (commonNonNames.includes(name)) return false;
    if (name.length < 2 || name.length > 40) return false;
    if (name.match(/[0-9@#$%^&*()_+=[\]{}|\\:;"'<>,.?/~`]/)) return false;
    if (name === name.toUpperCase()) return false;
    return true;
  });
}

/**
 * Extract contacts only from the page text with basic regex matching.
 * Enhanced to detect structured contact information blocks.
 */
export function extractContacts(document) {
  if (!document.body) return { names: [], emails: [], phonesFound: [] };
  
  let text = document.body.innerText;
  if (!text || text.trim().length < 50) {
    console.warn("document.body.innerText is insufficient, falling back to document.documentElement.innerText");
    text = document.documentElement.innerText || "";
  }
  
  // Try to detect contact blocks with name, job title, phone, email pattern
  const contactBlocks = extractContactBlocks(text);
  
  // Extract individual elements
  const names = filterValidNames([...new Set(text.match(patterns.name) || [])]);
  const emails = filterValidEmails([...new Set(text.match(patterns.email) || [])]);
  const phoneMatches1 = text.match(patterns.phone) || [];
  const phoneMatches2 = text.match(/\b(?:\+?\d[\d\s.-]{8,}\d)\b/g) || [];
  let phonesFound = [...new Set([...phoneMatches1, ...phoneMatches2])];
  phonesFound = filterValidPhones(phonesFound);
  
  // Additional context information
  const specialties = [];
  const locations = [];
  
  let specialtyMatch;
  while ((specialtyMatch = patterns.specialty.exec(text)) !== null) {
    if (specialtyMatch[1] && specialtyMatch[1].trim()) {
      specialties.push(specialtyMatch[1].trim());
    }
  }
  
  let locationMatch;
  while ((locationMatch = patterns.location.exec(text)) !== null) {
    if (locationMatch[1] && locationMatch[1].trim()) {
      locations.push(locationMatch[1].trim());
    }
  }
  
  // Format phone numbers and include extension
  const formattedPhones = phonesFound.map(phone => {
    const { phone: cleanedPhone, extension } = extractPhoneExtension(phone);
    
    // Check if this might be a UK number (starts with 0)
    const isUkNumber = /^0/.test(cleanedPhone) || /^44/.test(cleanedPhone);
    
    // Format based on detected country
    let formatted;
    if (isUkNumber) {
      // Handle UK number - preserve leading zero
      if (cleanedPhone.startsWith('44')) {
        // Convert +44 to 0
        formatted = '0' + cleanedPhone.substring(2).replace(/\D/g, '');
      } else {
        // Already has leading zero
        formatted = cleanedPhone.replace(/\D/g, '');
      }
      
      // Format UK area codes - common formats like 01xxx xxxxxx or 02x xxxx xxxx
      if (formatted.length >= 10) {
        const areaCodeMap = {
          '01': 5, // 01xxx area codes - 5 digits including the 0
          '02': 3, // 020, 023, etc. - 3 digits
          '03': 4, // 0300, etc. - 4 digits
          '07': 5, // 07xxx mobile - 5 digits
          '08': 4  // 0800, etc. - 4 digits
        };
        
        const prefix = formatted.substring(0, 2);
        const areaCodeLength = areaCodeMap[prefix] || 5; // Default to 5 if unknown
        
        // Insert spaces for better readability
        formatted = formatted.substring(0, areaCodeLength) + ' ' + 
                    formatted.substring(areaCodeLength).replace(/(\d{4})(?=\d)/g, '$1 ').trim();
      }
    } else {
      // Use default formatting for non-UK numbers
      formatted = formatPhoneNumber(cleanedPhone, "US");
    }
    
    if (formatted && extension) {
      formatted += ` ext. ${extension}`;
    } else if (!formatted) {
      formatted = phone;
    }
    return formatted;
  }).filter(phone => phone);
  
  phonesFound = formattedPhones;
  
  console.log("Extracted contacts:", { 
    names: names.length, 
    emails: emails.length, 
    phones: phonesFound.length,
    specialties: specialties.length,
    locations: locations.length,
    contactBlocks: contactBlocks.length
  });
  
  return { 
    names, 
    emails, 
    phonesFound,
    specialties,
    locations,
    contactBlocks
  };
}

/**
 * Attempts to extract structured contact blocks from text.
 */
function extractContactBlocks(text) {
  const blocks = [];
  const sections = text.split(/\n{2,}/);
  
  for (const section of sections) {
    // Reset regex state for each test using global flags
    patterns.name.lastIndex = 0;
    patterns.phone.lastIndex = 0;
    patterns.email.lastIndex = 0;
    
    const hasName = patterns.name.test(section);
    patterns.name.lastIndex = 0;
    const hasPhone = patterns.phone.test(section);
    patterns.phone.lastIndex = 0;
    const hasEmail = patterns.email.test(section);
    patterns.email.lastIndex = 0;
    
    if ((hasName && hasPhone) || (hasName && hasEmail) || (hasPhone && hasEmail)) {
      blocks.push(section.trim());
    }
  }
  
  return blocks;
}
