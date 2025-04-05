"use strict";

// Global flag to indicate the script is loaded
window.contentScriptLoaded = true;
const contentScriptLoadTime = Date.now();
console.log(`Content script loaded at ${new Date(contentScriptLoadTime).toISOString()}`);

/**
 * NOTICE: All JavaScript-based crawling and scraping has been removed.
 * This application now exclusively uses Scrapy (Python-based) for web scraping.
 * See scrapy_spider.py for the implementation.
 */

export {};  // Mark this file as a module