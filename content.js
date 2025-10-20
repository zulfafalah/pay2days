// Pay2Days Extension - Content Script
// Extension untuk memanipulasi DOM harga di halaman Shopee

console.log('Pay2Days Extension: Content script loaded');

// Fungsi untuk menambahkan string "test" pada harga
function addTestToPrice() {
    // Selector untuk elemen harga berdasarkan struktur DOM
    const priceSelectors = [
        '.truncate.text-base\\/5.font-medium', // Selector utama untuk harga
        'span.truncate.text-base\\/5.font-medium', // Alternatif dengan tag span
        '.text-shopee-primary .truncate.text-base\\/5.font-medium' // Selector yang lebih spesifik
    ];
    
    let modifiedCount = 0;
    
    // Coba setiap selector
    priceSelectors.forEach(selector => {
        const priceElements = document.querySelectorAll(selector);
        
        priceElements.forEach((element, index) => {
            // Cek apakah sudah pernah dimodifikasi (hindari duplikasi)
            if (!element.hasAttribute('data-pay2days-modified')) {
                const originalPrice = element.textContent.trim();
                
                // Tambahkan string "test" pada harga
                element.textContent = originalPrice + ' test';
                
                // Tandai sebagai sudah dimodifikasi
                element.setAttribute('data-pay2days-modified', 'true');
                
                modifiedCount++;
                
                console.log(`Pay2Days: Modified price ${index + 1}: ${originalPrice} → ${element.textContent}`);
            }
        });
    });
    
    return modifiedCount;
}

// Fungsi untuk observasi perubahan DOM (untuk konten dinamis)
function observeDOM() {
    const observer = new MutationObserver((mutations) => {
        let shouldModify = false;
        
        mutations.forEach((mutation) => {
            // Cek apakah ada node baru yang ditambahkan
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach((node) => {
                    // Cek apakah node yang ditambahkan mengandung elemen harga
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const hasPrice = node.querySelector && (
                            node.querySelector('.truncate.text-base\\/5.font-medium') ||
                            node.classList.contains('truncate') && node.classList.contains('text-base/5') && node.classList.contains('font-medium')
                        );
                        
                        if (hasPrice) {
                            shouldModify = true;
                        }
                    }
                });
            }
        });
        
        // Jalankan modifikasi setelah delay singkat untuk memastikan DOM sudah stabil
        if (shouldModify) {
            setTimeout(() => {
                const count = addTestToPrice();
                if (count > 0) {
                    console.log(`Pay2Days: Modified ${count} new price elements`);
                }
            }, 100);
        }
    });
    
    // Mulai observasi pada seluruh document
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    return observer;
}

// Fungsi utama yang dijalankan ketika extension aktif
function initPay2Days() {
    console.log('Pay2Days Extension: Initializing...');
    
    // Tunggu hingga DOM siap
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(startModification, 500);
        });
    } else {
        startModification();
    }
}

function startModification() {
    // Modifikasi harga yang sudah ada
    const initialCount = addTestToPrice();
    console.log(`Pay2Days: Initial modification completed. Modified ${initialCount} price elements.`);
    
    // Mulai observasi untuk konten dinamis
    const observer = observeDOM();
    console.log('Pay2Days: DOM observer started for dynamic content');
    
    // Periksa secara berkala (untuk memastikan tidak ada yang terlewat)
    setInterval(() => {
        const count = addTestToPrice();
        if (count > 0) {
            console.log(`Pay2Days: Periodic check - Modified ${count} additional price elements`);
        }
    }, 3000);
}

// Fungsi untuk debugging - menampilkan informasi DOM
function debugDOMStructure() {
    console.log('Pay2Days Debug: Analyzing DOM structure...');
    
    // Cari semua elemen yang mungkin mengandung harga
    const potentialPriceElements = document.querySelectorAll('[class*="price"], [class*="amount"], .text-shopee-primary, [class*="truncate"]');
    
    console.log(`Found ${potentialPriceElements.length} potential price elements:`);
    
    potentialPriceElements.forEach((element, index) => {
        if (element.textContent.match(/\d{1,3}(\.\d{3})*|\d+/)) {
            console.log(`Element ${index}:`, {
                tagName: element.tagName,
                className: element.className,
                textContent: element.textContent.trim(),
                innerHTML: element.innerHTML
            });
        }
    });
}

// Event listener untuk pesan dari popup atau background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'debug') {
        debugDOMStructure();
        sendResponse({status: 'debug completed'});
    } else if (request.action === 'toggleExtension') {
        if (request.enabled) {
            initPay2Days();
            sendResponse({status: 'extension enabled'});
        } else {
            // Reset semua perubahan
            const modifiedElements = document.querySelectorAll('[data-pay2days-modified="true"]');
            modifiedElements.forEach(element => {
                element.textContent = element.textContent.replace(' test', '');
                element.removeAttribute('data-pay2days-modified');
            });
            sendResponse({status: 'extension disabled'});
        }
    }
});

// Cek apakah sedang berada di halaman Shopee
function isShopeeSearchPage() {
    return window.location.hostname.includes('shopee') && 
           (window.location.pathname.includes('search') || 
            document.querySelector('.shopee-search-item-result__items'));
}

// Auto-start jika berada di halaman yang sesuai
if (isShopeeSearchPage()) {
    console.log('Pay2Days: Shopee search page detected, starting extension...');
    initPay2Days();
} else {
    console.log('Pay2Days: Not a Shopee search page, waiting for activation...');
}

// Export untuk testing (jika diperlukan)
window.Pay2Days = {
    addTestToPrice,
    debugDOMStructure,
    initPay2Days
};