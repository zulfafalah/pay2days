// Pay2Days Extension - Background Script
// Mengelola state extension dan komunikasi antar komponen

console.log('Pay2Days Background: Service worker started');

// State management untuk extension
let extensionState = {
    enabled: true,
    activeTabId: null
};

// Event listener ketika extension pertama kali diinstal atau diupdate
chrome.runtime.onInstalled.addListener((details) => {
    console.log('Pay2Days: Extension installed/updated', details);
    
    // Set default state
    chrome.storage.local.set({
        enabled: true,
        lastActivated: Date.now()
    });
    
    // Tampilkan badge untuk menunjukkan extension aktif
    chrome.action.setBadgeText({text: "ON"});
    chrome.action.setBadgeBackgroundColor({color: "#4CAF50"});
});

// Event listener untuk komunikasi dengan content script dan popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Pay2Days Background: Message received', request);
    
    switch(request.action) {
        case 'getState':
            sendResponse({
                enabled: extensionState.enabled,
                tabId: sender.tab?.id
            });
            break;
            
        case 'toggleExtension':
            extensionState.enabled = request.enabled;
            
            // Update badge
            if (extensionState.enabled) {
                chrome.action.setBadgeText({text: "ON"});
                chrome.action.setBadgeBackgroundColor({color: "#4CAF50"});
            } else {
                chrome.action.setBadgeText({text: "OFF"});
                chrome.action.setBadgeBackgroundColor({color: "#FF5722"});
            }
            
            // Simpan state ke storage
            chrome.storage.local.set({
                enabled: extensionState.enabled,
                lastToggled: Date.now()
            });
            
            sendResponse({status: 'state updated', enabled: extensionState.enabled});
            break;
            
        case 'debugInfo':
            sendResponse({
                state: extensionState,
                timestamp: Date.now(),
                tabInfo: sender.tab
            });
            break;
            
        default:
            sendResponse({error: 'Unknown action'});
    }
    
    return true; // Indicates that the response is sent asynchronously
});

// Event listener ketika tab aktif berubah
chrome.tabs.onActivated.addListener((activeInfo) => {
    extensionState.activeTabId = activeInfo.tabId;
    
    // Cek apakah tab baru adalah halaman Shopee
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (tab.url && tab.url.includes('shopee')) {
            console.log('Pay2Days: Shopee tab activated', tab.url);
            
            // Kirim pesan ke content script dengan current state
            chrome.tabs.sendMessage(activeInfo.tabId, {
                action: 'toggleExtension',
                enabled: extensionState.enabled
            }).catch(() => {
                // Content script mungkin belum siap, ini normal
                console.log('Pay2Days: Content script not ready yet');
            });
        }
    });
});

// Event listener ketika URL tab berubah
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Jika halaman selesai dimuat dan ini adalah halaman Shopee
    if (changeInfo.status === 'complete' && tab.url && tab.url.includes('shopee')) {
        console.log('Pay2Days: Shopee page loaded', tab.url);
        
        // Delay sebentar untuk memastikan content script sudah dimuat
        setTimeout(() => {
            // Selalu kirim current state ke content script
            chrome.tabs.sendMessage(tabId, {
                action: 'toggleExtension',
                enabled: extensionState.enabled
            }).catch(() => {
                console.log('Pay2Days: Content script not ready on page load');
            });
        }, 1000);
    }
});

// Load state dari storage saat startup
chrome.storage.local.get(['enabled'], (result) => {
    if (result.enabled !== undefined) {
        extensionState.enabled = result.enabled;
        
        // Update badge berdasarkan state yang disimpan
        if (extensionState.enabled) {
            chrome.action.setBadgeText({text: "ON"});
            chrome.action.setBadgeBackgroundColor({color: "#4CAF50"});
        } else {
            chrome.action.setBadgeText({text: "OFF"});
            chrome.action.setBadgeBackgroundColor({color: "#FF5722"});
        }
    }
});

// Fungsi utility untuk debugging
function getExtensionInfo() {
    return {
        state: extensionState,
        manifest: chrome.runtime.getManifest(),
        timestamp: Date.now()
    };
}

// Export untuk debugging (dalam service worker context)
globalThis.Pay2DaysBackground = {
    getState: () => extensionState,
    getInfo: getExtensionInfo
};