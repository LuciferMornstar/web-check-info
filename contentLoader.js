const EXTENSION_ID = "";

/**
 * Initialize the active tab with the content script
 */
export async function initializeActiveTab() {
  console.log("Initializing active tab...");
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs[0]) {
      console.error("No active tab found");
      return { success: false, error: "No active tab found" };
    }
    
    // First, try to ping the content script to see if it's already loaded
    const pingResult = await sendPingMessage(tabs[0].id);
    console.log("Initial ping result:", pingResult); // Add more logging
    
    if (pingResult.success) {
      console.log("Content script already loaded");
      return { success: true, tabId: tabs[0].id, url: tabs[0].url };
    }
    
    // If the ping failed, try to inject the content script
    try {
      console.log("Content script not loaded, attempting to inject");
      
      // Check permissions first
      const permissions = await chrome.permissions.contains({
        permissions: ['scripting'],
        origins: [tabs[0].url]
      });
      
      if (!permissions) {
        console.warn("Missing required permissions for content script injection");
      }
      
      // Execute script injection with explicit catch
      const results = await chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        files: ["content.js"]
      }).catch(err => {
        console.error("Script injection error:", err);
        throw new Error(`Script injection failed: ${err.message}`);
      });
      
      console.log("Script injection results:", results);
      
      // Wait longer for the content script to initialize
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Try pinging again with longer timeout
      const pingAfterInject = await sendPingMessage(tabs[0].id, 3000);
      console.log("Ping after inject result:", pingAfterInject);
      
      if (!pingAfterInject.success) {
        // Try a direct injection as a last resort
        console.log("Trying direct script injection as fallback");
        await chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: function() {
            // This logs directly in the page context
            console.log("Direct script injection executed");
            // Set a flag that our extension can check
            window.__WEB_CONTACT_FINDER_INJECTED = true;
          }
        });
        
        // Wait again and try one more ping
        await new Promise(resolve => setTimeout(resolve, 500));
        const finalPing = await sendPingMessage(tabs[0].id, 2000);
        
        if (!finalPing.success) {
          console.error("All injection attempts failed");
          return { 
            success: false, 
            error: "Content script injection failed after multiple attempts", 
            tabId: tabs[0].id 
          };
        }
      }
      
      return { 
        success: pingAfterInject.success, 
        tabId: tabs[0].id, 
        url: tabs[0].url,
        message: pingAfterInject.success ? "Content script loaded successfully" : "Failed to load content script"
      };
    } catch (error) {
      console.error("Error injecting script:", error);
      return { 
        success: false, 
        error: `Injection failed: ${error.message}`, 
        tabId: tabs[0].id 
      };
    }
  } catch (error) {
    console.error("Error in initializeActiveTab:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Send a ping message to the content script
 */
export function sendPingMessage(tabId, timeout = 2000) {
  return new Promise(resolve => {
    console.log(`Pinging content script in tab ${tabId} with timeout ${timeout}ms`);
    const timeoutId = setTimeout(() => {
      console.log("Ping timed out");
      resolve({ success: false, error: "Ping timed out" });
    }, timeout);
    
    try {
      chrome.tabs.sendMessage(tabId, { action: "ping" }, response => {
        clearTimeout(timeoutId);
        
        if (chrome.runtime.lastError) {
          console.log("Ping error:", chrome.runtime.lastError.message);
          resolve({ success: false, error: chrome.runtime.lastError.message });
        } else if (response && response.status === "alive") {
          console.log("Content script responded to ping");
          resolve({ success: true, response });
        } else {
          console.log("Invalid ping response:", response);
          resolve({ success: false, error: "Invalid response" });
        }
      });
    } catch (error) {
      clearTimeout(timeoutId);
      console.error("Exception during ping:", error);
      resolve({ success: false, error: error.message });
    }
  });
}
