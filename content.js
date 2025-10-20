// Pay2Days Extension - Content Script
// Extension untuk menambahkan informasi hari kerja di bawah delivery time pada halaman Shopee

console.log('Pay2Days Extension: Content script loaded');

// Fungsi untuk menambahkan informasi hari kerja di bawah lokasi
function addWorkDaysInfo() {
    // Selector untuk elemen delivery time berdasarkan struktur DOM
    const deliveryTimeSelectors = [
        '.truncate.text-sp10.font-normal.my\\:font-light.km\\:font-light.whitespace-nowrap.text-white', // Selector utama untuk delivery time
        'div.truncate.text-sp10.font-normal.my\\:font-light.km\\:font-light.whitespace-nowrap.text-white' // Alternatif dengan tag div
    ];
    
    let modifiedCount = 0;
    
    // Coba setiap selector
    deliveryTimeSelectors.forEach(selector => {
        const deliveryElements = document.querySelectorAll(selector);
        
        deliveryElements.forEach((element, index) => {
            // Cek apakah sudah pernah dimodifikasi (hindari duplikasi)
            if (!element.hasAttribute('data-pay2days-modified') && 
                element.textContent.match(/(Jam|Hari|Besok|hari ini)/i)) {
                
                // Tandai sebagai sudah dimodifikasi
                element.setAttribute('data-pay2days-modified', 'true');
                
                // Buat elemen info hari kerja
                const workDaysInfo = document.createElement('div');
                workDaysInfo.className = 'pay2days-workdays-info';
                workDaysInfo.textContent = '12 hari kerja';
                workDaysInfo.title = 'Anda perlu 12 hari kerja untuk membeli barang ini';
                
                // Styling untuk elemen info hari kerja - ditempatkan di bawah delivery time
                workDaysInfo.style.cssText = `
                    display: block;
                    margin-top: 8px;
                    margin-left: 0;
                    margin-right: auto;
                    padding: 3px 8px;
                    background-color: #e65100;
                    color: white;
                    font-size: 10px;
                    border-radius: 4px;
                    font-weight: 500;
                    cursor: help;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
                    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                    transition: all 0.2s ease;
                    width: fit-content;
                    max-width: 100%;
                    text-align: left;
                `;
                
                // Efek hover
                workDaysInfo.addEventListener('mouseenter', function() {
                    this.style.backgroundColor = '#d84315';
                    this.style.transform = 'scale(1.05)';
                    this.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
                });
                
                workDaysInfo.addEventListener('mouseleave', function() {
                    this.style.backgroundColor = '#e65100';
                    this.style.transform = 'scale(1)';
                    this.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';
                });
                
                // Cari container yang berisi delivery info dan location
                // Naik ke parent sampai ketemu container dengan class "flex items-center space-x-1"
                let targetContainer = element;
                while (targetContainer.parentElement) {
                    const parent = targetContainer.parentElement;
                    if (parent.className && parent.className.includes('flex items-center space-x-1')) {
                        targetContainer = parent;
                        break;
                    }
                    targetContainer = parent;
                    
                    // Jangan naik terlalu tinggi
                    if (parent.className && parent.className.includes('p-2 flex-1 flex flex-col')) {
                        break;
                    }
                }
                
                // Tempatkan workDaysInfo setelah container delivery/location
                if (targetContainer.parentElement) {
                    targetContainer.parentElement.insertBefore(workDaysInfo, targetContainer.nextSibling);
                    
                    modifiedCount++;
                    
                    console.log(`Pay2Days: Added work days info below delivery time ${index + 1}`);
                }
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
                    // Cek apakah node yang ditambahkan mengandung elemen delivery time
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const hasDeliveryTime = node.querySelector && (
                            node.querySelector('.truncate.text-sp10.font-normal.my\\:font-light.km\\:font-light.whitespace-nowrap.text-white') ||
                            node.querySelector('.text-white') ||
                            (node.classList.contains('truncate') && 
                             node.classList.contains('text-sp10') && 
                             node.classList.contains('font-normal') && 
                             node.classList.contains('text-white'))
                        );
                        
                        if (hasDeliveryTime) {
                            shouldModify = true;
                        }
                    }
                });
            }
        });
        
        // Jalankan modifikasi setelah delay singkat untuk memastikan DOM sudah stabil
        if (shouldModify) {
            setTimeout(() => {
                const count = addWorkDaysInfo();
                if (count > 0) {
                    console.log(`Pay2Days: Added work days info to ${count} new delivery time elements`);
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
    // Modifikasi delivery time yang sudah ada
    const initialCount = addWorkDaysInfo();
    console.log(`Pay2Days: Initial modification completed. Added work days info to ${initialCount} delivery time elements.`);
    
    // Mulai observasi untuk konten dinamis
    const observer = observeDOM();
    console.log('Pay2Days: DOM observer started for dynamic content');
    
    // Periksa secara berkala (untuk memastikan tidak ada yang terlewat)
    setInterval(() => {
        const count = addWorkDaysInfo();
        if (count > 0) {
            console.log(`Pay2Days: Periodic check - Added work days info to ${count} additional delivery time elements`);
        }
    }, 3000);
}

// Fungsi untuk debugging - menampilkan informasi DOM
function debugDOMStructure() {
    console.log('Pay2Days Debug: Analyzing DOM structure...');
    
    // Cari semua elemen yang mungkin mengandung delivery time
    const potentialDeliveryElements = document.querySelectorAll('[class*="text-white"], [class*="delivery"], .text-sp10, [class*="truncate"]');
    
    console.log(`Found ${potentialDeliveryElements.length} potential delivery time elements:`);
    
    potentialDeliveryElements.forEach((element, index) => {
        if (element.textContent.match(/(Jam|Hari|Besok|hari ini)/i) || element.classList.contains('text-white')) {
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
            // Reset semua perubahan - hapus elemen info hari kerja
            const workDaysElements = document.querySelectorAll('.pay2days-workdays-info');
            workDaysElements.forEach(element => {
                element.remove();
            });
            
            // Reset attribute modified
            const modifiedElements = document.querySelectorAll('[data-pay2days-modified="true"]');
            modifiedElements.forEach(element => {
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
    addWorkDaysInfo,
    debugDOMStructure,
    initPay2Days
};