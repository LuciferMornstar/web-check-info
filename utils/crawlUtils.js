"use strict";

/**
 * NOTICE: All JavaScript-based crawling and scraping has been removed.
 * This application now exclusively uses Scrapy (Python-based) for web scraping.
 * See scrapy_spider.py for the implementation.
 */

// Helper to format contacts from Scrapy results
export function formatScrapyResults(scrapyData) {
  if (!scrapyData || !scrapyData.structuredContacts) {
    return { structuredContacts: [] };
  }
  
  return {
    structuredContacts: scrapyData.structuredContacts,
    emailCount: scrapyData.emailCount || 0,
    phoneCount: scrapyData.phoneCount || 0,
    nameCount: scrapyData.nameCount || 0
  };
}
