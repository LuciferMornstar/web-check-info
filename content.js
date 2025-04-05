"use strict";

import { crawlWebsite, crawlEntireSite } from './utils/crawlUtils.js';

// Global flag to indicate the script is loaded
window.contentScriptLoaded = true;
const contentScriptLoadTime = Date.now();
console.log(`Content script loaded at ${new Date(contentScriptLoadTime).toISOString()}`);

const EXTENSION_ID = "";

let crawlCancelToken = { cancelled: false };

function performCrawl(sendResponse) {
  const crawlResults = [];
  let currentIndex = 0;

  function crawlNext() {
    if (currentIndex < document.links.length) {
      const link = document.links[currentIndex];
      console.log(`Crawling link: ${link.href}`);
      crawlResults.push(link.href);
      currentIndex++;
      setTimeout(crawlNext, 100); // Simulate async crawling
    } else {
      console.log("Crawl completed.");
      sendResponse({ status: "crawled", result: crawlResults });
    }
  }

  crawlNext();
}

export {};  // Mark this file as a module