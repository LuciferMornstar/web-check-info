"use strict";
import { extractContacts, patterns } from "./regexUtils.js";
import { formatPhoneNumber, extractPhoneExtension } from '../contactRules.js';

const EXTENSION_ID = "";

// NEW: Anti-scraping settings and helper functions

const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36"
];
function getRandomUserAgent() {
    return userAgents[Math.floor(Math.random() * userAgents.length)];
}

const referrers = [
    "https://www.google.com/",
    "https://www.bing.com/",
    "https://duckduckgo.com/"
];
function getRandomReferrer() {
    return referrers[Math.floor(Math.random() * referrers.length)];
}

function getRandomCookie() {
    // Generate a pseudo-random session cookie value
    return "session=" + Math.random().toString(36).substring(2, 15);
}

function randomDelay(min = 300, max = 1500) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function detectCaptcha(html) {
    // Enhanced check for captcha keywords in the HTML
    return /captcha|recaptcha|are you a robot/i.test(html);
}

async function fetchWithTimeout(url, timeout = 10000, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  
  // NEW: If a NetNut API key is provided, rewrite URL to use NetNut API for anti‐scraping bypass
  if (options.netnutApiKey) {
    console.log("Using NetNut proxy for anti-scraping bypass");
    url = `https://api.netnut.io/generate?target=${encodeURIComponent(url)}&api_key=${options.netnutApiKey}`;
  }
  
  // Build anti-scraping headers without Cookie
  const headers = Object.assign({}, options.headers, {
    "User-Agent": getRandomUserAgent(),
    "Referer": getRandomReferrer()
    // Removed "Cookie" header to ignore cookies
  });
  
  if (options.proxies && Array.isArray(options.proxies) && options.proxies.length > 0) {
      const proxy = options.proxies[Math.floor(Math.random() * options.proxies.length)];
      url = proxy + "?url=" + encodeURIComponent(url);
  }
  try {
    const response = await fetch(url, { signal: controller.signal, headers });
    clearTimeout(timer);
    return response;
  } catch (error) {
    clearTimeout(timer);
    console.error("Fetch error for", url, error);
    throw error;
  }
}

// NEW: Advanced fetch helper with retries, extra headers, and randomized delays with debug callback
async function advancedFetch(url, options = {}, retries = 3, delayMs = 500, debugCallback = () => {}) {
  debugCallback(`advancedFetch: Starting fetch for ${url}`);

  // Domain-specific override: use a mobile User-Agent for NHS contact page
  if (url.includes("england.nhs.uk/contact-us")) {
    options.headers = options.headers || {};
    options.headers["User-Agent"] = "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1";
  }

  // Aggressive anti-bot measures (only if bypassAntiBot is true)
  if (options.bypassAntiBot) {
    debugCallback("advancedFetch: Aggressive anti-bot measures ENABLED");
    // Add more headers
    options.headers = {
      ...options.headers,
      'sec-ch-ua': '"Chromium";v="118", "Google Chrome";v="118", ";Not A Brand";v="99"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'none',
      'sec-fetch-user': '?1',
      'upgrade-insecure-requests': '1'
    };
    // Reduce delay
    delayMs = Math.max(delayMs / 2, 100);
  }

  // Merge extra headers inspired by advanced scraping techniques
  const extraHeaders = {
    "Accept-Language": "en-US,en;q=0.9",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none"
  };
  options.headers = Object.assign({}, options.headers, extraHeaders);
  for (let i = 0; i < retries; i++) {
    debugCallback(`advancedFetch: Attempt ${i+1} for ${url}`);
    try {
      const response = await fetchWithTimeout(url, options.timeout || 10000, options);
      if (response.ok && response.status < 400) {
        debugCallback(`advancedFetch: Success for ${url} on attempt ${i+1}`);
        const html = await response.text();
        if (detectCaptcha(html)) {
          debugCallback(`advancedFetch: CAPTCHA detected on ${url}`);
          // Signal to popup that CAPTCHA needs solving
          chrome.runtime.sendMessage(EXTENSION_ID, { action: 'captchaDetected', url: url });
          throw new Error("Captcha detected; user intervention required.");
        }
        return response;
      }
      throw new Error(`Response error: ${response.status}`);
    } catch (err) {
      debugCallback(`advancedFetch: Attempt ${i+1} failed for ${url} - ${err.message}`);
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs + randomDelay(100, 500)));
      } else {
        throw err;
      }
    }
  }
}

// Add ethical crawling delays and rate limiting
const RATE_LIMIT = {
  requestsPerMinute: 20,
  lastRequest: 0,
  requestCount: 0
};

async function ethicalFetch(url, options = {}) {
  // Respect rate limits
  const now = Date.now();
  if (now - RATE_LIMIT.lastRequest < 60000) {
    if (RATE_LIMIT.requestCount >= RATE_LIMIT.requestsPerMinute) {
      await new Promise(resolve => 
        setTimeout(resolve, 60000 - (now - RATE_LIMIT.lastRequest))
      );
      RATE_LIMIT.requestCount = 0;
    }
  } else {
    RATE_LIMIT.requestCount = 0;
  }
  RATE_LIMIT.requestCount++;
  RATE_LIMIT.lastRequest = now;

  // Add proper headers
  const headers = {
    'User-Agent': 'Contact Finder Bot/1.0 (https://yoursite.com/bot)',
    'Accept': 'text/html,application/xhtml+xml',
    'Accept-Language': 'en-US,en;q=0.9',
    ...options.headers
  };

  // Add random delay between requests
  await new Promise(resolve => setTimeout(resolve, randomDelay(1000, 3000)));

  return fetchWithTimeout(url, options.timeout || 10000, { ...options, headers });
}

async function crawlWebsite(options = {}, cancelToken = { cancelled: false }) {
	console.log("Starting web scraping for URL:", options.url);
	if (!options.url) throw new Error("No URL provided for scraping.");
	const response = await fetchWithTimeout(options.url, 15000, options);
	if (!response.ok) throw new Error("Network error: " + response.status);
	const html = await response.text();
	if (detectCaptcha(html)) {
		throw new Error("Captcha detected; unable to scrape the page.");
	}
	const parser = new DOMParser();
	const doc = parser.parseFromString(html, "text/html");
	const contacts = extractContacts(doc);
	console.log("Scraping result:", contacts);
	return contacts; // { names, emails, phonesFound }
}

// Helper: Zip aggregated arrays into an array of contact objects
function zipContacts(aggregated) {
  // Ensure arrays are defined
  const namesArr = Array.isArray(aggregated.names) ? aggregated.names : [];
  const emailsArr = Array.isArray(aggregated.emails) ? aggregated.emails : [];
  const phonesArr = Array.isArray(aggregated.phonesFound) ? aggregated.phonesFound : [];
  
  // Create a map for contacts
  const contactMap = new Map();
  
  // Add names as potential contact anchors
  namesArr.forEach((name) => {
    if (!name) return;
    if (!contactMap.has(name)) {
      contactMap.set(name, { name, emails: [], phone: '' });
    }
  });
  
  // Associate emails with names when possible or create new entries
  emailsArr.forEach(email => {
    if (!email) return;
    
    const emailName = email.split('@')[0].replace(/[._-]/g, ' ');
    let matched = false;
    contactMap.forEach((contact, key) => {
      if (emailName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(emailName.toLowerCase())) {
        contact.emails.push(email);
        matched = true;
      }
    });
    
    if (!matched) {
      const displayName = emailName
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      contactMap.set('email_' + email, { name: displayName, emails: [email], phone: '' });
    }
  });
  
  // Associate phone numbers by trying to assign them to an existing contact that lacks one.
  phonesArr.forEach(phone => {
    if (!phone) return;
    let assigned = false;
    for (const contact of contactMap.values()){
      if (!contact.phone) {
        contact.phone = phone;
        assigned = true;
        break;
      }
    }
    if (!assigned) {
      contactMap.set('phone_' + phone, { name: '', emails: [], phone });
    }
  });
  
  const contacts = Array.from(contactMap.values());
  
  // Fallback if nothing was added
  if (contacts.length === 0 && (namesArr.length || emailsArr.length || phonesArr.length)) {
    const maxLen = Math.max(namesArr.length, emailsArr.length, phonesArr.length);
    for (let i = 0; i < maxLen; i++) {
      contacts.push({
        name: namesArr[i] || '',
        emails: emailsArr[i] ? [emailsArr[i]] : [],
        phone: phonesArr[i] || ''
      });
    }
  }
  
  return contacts;
}

// NEW: Updated findContactPages to dynamically identify contact pages based on content
async function findContactPages(baseUrl, options = {}, debugCallback = () => {}) {
  const domain = new URL(baseUrl).origin;
  const commonContactPaths = [
    '/contact',
    '/contact-us',
    '/contact-us-royal-derby-hospital',
    '/contact-us-queens-hospital-burton',
    '/contact_us',
    '/contactus',
    '/get-in-touch',
    '/reach-us',
    '/about-us/contact',
    '/about/contact',
    '/support/contact'
  ];

  const contactUrls = [];
  const keywords = ["contact", "telephone", "email", "address"];

  for (const path of commonContactPaths) {
    const potentialUrl = `${domain}${path}`;
    debugCallback(`Checking if contact page exists at: ${potentialUrl}`);
    try {
      const response = await fetchWithTimeout(potentialUrl, 5000, {
        headers: { "User-Agent": getRandomUserAgent() }
      });

      if (response.ok) {
        const pageText = (await response.text()).toLowerCase();
        const containsKeyword = keywords.some(keyword => pageText.includes(keyword));
        if (containsKeyword) {
          debugCallback(`Found contact page at: ${potentialUrl}`);
          contactUrls.push(potentialUrl);
        } else {
          debugCallback(`URL ${potentialUrl} did not contain contact keywords.`);
        }
      }
    } catch (error) {
      debugCallback(`Failed to check ${potentialUrl}: ${error.message}`);
    }
  }

  return contactUrls;
}

// NEW: Improved helper to find contact links on a page
function findContactPageLinks(doc, baseUrl) {
  const contactLinks = [];
  const anchors = Array.from(doc.querySelectorAll("a[href]"));
  
  // Contact-related keywords to look for in link text and URLs
  const contactKeywords = ['contact', 'reach us', 'get in touch', 'talk to us', 'support'];
  
  for (const a of anchors) {
    const text = (a.textContent || "").toLowerCase().trim();
    const href = (a.getAttribute("href") || "").toLowerCase();
    
    // Check if any of our keywords are in the text or href
    const isContactLink = contactKeywords.some(keyword => 
      text.includes(keyword) || href.includes(keyword)
    );
    
    if (isContactLink) {
      try {
        const fullUrl = new URL(a.getAttribute("href"), baseUrl).href;
        contactLinks.push(fullUrl);
      } catch (e) {
        // Skip invalid URLs
      }
    }
  }
  
  return contactLinks;
}

// NEW: Function to crawl the entire site recursively with real-time updates and debug logging
async function crawlEntireSite(options = {}, updateCallback, cancelToken = { cancelled: false }, debugCallback = () => {}) {
  if (!options.url) throw new Error("No URL provided for crawling.");
  const baseUrl = options.url;
  let baseDomain;
  try {
    baseDomain = new URL(baseUrl).hostname;
  } catch (e) {
    throw new Error("Invalid start URL");
  }
  
  debugCallback(`crawlEntireSite: Starting crawl at ${baseUrl}`);
  const aggregated = { names: [], emails: [], phonesFound: [] };
  const parser = new DOMParser();
  const visited = new Set();

  // Define a queue of objects: each with { url, offsite } where offsite indicates if this link is from a different domain.
  const queue = [{ url: baseUrl, offsite: false }];
  
  while (queue.length > 0 && !cancelToken.cancelled) {
    const { url, offsite } = queue.shift();
    if (visited.has(url)) continue;
    visited.add(url);
    debugCallback(`Crawling ${url} (offsite: ${offsite})`);
    
    try {
      const response = await ethicalFetch(url, options);
      if (!response.ok) {
        debugCallback(`Skipping ${url} due to non-OK response`);
        continue;
      }
      const html = await response.text();
      if (detectCaptcha(html)) {
        debugCallback(`Captcha detected at ${url}`);
        continue;
      }
      const doc = parser.parseFromString(html, "text/html");
      const contacts = extractContacts(doc) || {};
      aggregated.names.push(...(Array.isArray(contacts.names) ? contacts.names : []));
      aggregated.emails.push(...(Array.isArray(contacts.emails) ? contacts.emails : []));
      aggregated.phonesFound.push(...(Array.isArray(contacts.phonesFound) ? contacts.phonesFound : []));
      debugCallback(`Extracted from ${url}: ${contacts.names.length} names, ${contacts.emails.length} emails, ${contacts.phonesFound.length} phones`);
      if (typeof updateCallback === "function") {
        updateCallback({ 
          currentUrl: url,
          contacts: zipContacts(aggregated),
          aggregated: {
            names: Array.from(new Set(aggregated.names)),
            emails: Array.from(new Set(aggregated.emails)),
            phonesFound: Array.from(new Set(aggregated.phonesFound))
          }
        });
      }
      
      // Only extract further links if this page is from the base site.
      if (!offsite) {
        const anchors = doc.querySelectorAll("a[href]");
        anchors.forEach(a => {
          try {
            const linkUrl = new URL(a.getAttribute("href"), url).href;
            // Skip if already visited.
            if (visited.has(linkUrl)) return;
            const linkDomain = new URL(linkUrl).hostname;
            if (linkDomain === baseDomain) {
              // Same domain: add for full recursive crawling.
              queue.push({ url: linkUrl, offsite: false });
            } else {
              // Offsite: only add one page deep.
              queue.push({ url: linkUrl, offsite: true });
            }
          } catch (e) {
            // Skip invalid URLs.
          }
        });
      }
    } catch (e) {
      debugCallback(`Error crawling ${url}: ${e.message}`);
      console.error("Error crawling", url, e);
    }
    await new Promise(resolve => setTimeout(resolve, randomDelay(300, 1200)));
  }
  
  debugCallback("crawlEntireSite: Crawl complete");
  return {
    contacts: zipContacts(aggregated),
    aggregated: {
      names: Array.from(new Set(aggregated.names)),
      emails: Array.from(new Set(aggregated.emails)),
      phonesFound: Array.from(new Set(aggregated.phonesFound))
    }
  };
}

export { crawlWebsite, crawlEntireSite };
