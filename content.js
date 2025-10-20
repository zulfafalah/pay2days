// Pay2Days Extension - Content Script
// Extension to add work days information below delivery time on Shopee pages

console.log('Pay2Days Extension: Content script loaded');

function extractPrice(deliveryElement) {
    let searchElement = deliveryElement;
    
    // Go up to parent to find product container
    for (let i = 0; i < 15 && searchElement.parentElement; i++) {
        searchElement = searchElement.parentElement;
        
        // Stop if we reach the main item container
        if (searchElement.classList.contains('shopee-search-item-result__item') || 
            searchElement.classList.contains('flex-col') && searchElement.classList.contains('bg-white')) {
            break;
        }
    }
    
    const priceSelectors = [
        'span.truncate.text-base\\/5.font-medium',
        '.text-shopee-primary span.truncate.text-base\\/5.font-medium',
        '.truncate.flex.items-baseline span.truncate.text-base\\/5.font-medium',
        'span.truncate.text-base\\/5',
        'span[class*="text-base/5"]',
        'span[class*="text-base"][class*="font-medium"]',
        '.text-shopee-primary .font-medium',
        '[class*="shopee-primary"] [class*="font-medium"]',
        '.flex.items-baseline .font-medium',
        '[class*="price"]',
        '[data-testid*="price"]',
        '.shopee-price'
    ];
    
    for (const selector of priceSelectors) {
        try {
            const priceElements = searchElement.querySelectorAll(selector);
            console.log(`Pay2Days: Selector "${selector}" found ${priceElements.length} elements`);
            
            for (const element of priceElements) {
                const priceText = element.textContent.trim();
                console.log(`Pay2Days: Checking text: "${priceText}"`);
                
                // Check if text contains numbers with Indonesian price format
                if (/^\d{1,3}([\.,]\d{3})*$/.test(priceText) || /^\d{7,}$/.test(priceText.replace(/[.,]/g, ''))) {
                    // Convert to number (remove thousand separators)
                    const numericPrice = parseFloat(priceText.replace(/[.,]/g, ''));
                    if (!isNaN(numericPrice) && numericPrice >= 1000) {
                        console.log(`Pay2Days: Found price ${numericPrice} using selector: ${selector}`);
                        return numericPrice;
                    }
                }
            }
        } catch (error) {
            console.log(`Pay2Days: Selector error for "${selector}":`, error.message);
        }
    }
    
    // If not found with specific selectors, try broader regex pattern approach
    console.log('Pay2Days: Trying pattern matching approach...');
    
    const allTextElements = searchElement.querySelectorAll('span, div');
    const potentialPrices = [];
    
    for (const element of allTextElements) {
        const text = element.textContent.trim();
        
        // Skip if element is too long or too short
        if (text.length < 4 || text.length > 15) continue;
        
        // Patterns to detect Indonesian prices
        const pricePatterns = [
            /^(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{3})*)$/,
            /^(\d{7,})$/,
            /Rp\s*(\d{1,3}(?:[.,]\d{3})*)/i,
        ];
        
        for (const pattern of pricePatterns) {
            const match = text.match(pattern);
            if (match) {
                const priceStr = match[1];
                const numericPrice = parseFloat(priceStr.replace(/[.,]/g, ''));
                
                // Validate reasonable price for electronic products (100,000 - 100,000,000)
                if (!isNaN(numericPrice) && numericPrice >= 100000 && numericPrice <= 100000000) {
                    potentialPrices.push({
                        price: numericPrice,
                        element: element,
                        text: text,
                        pattern: pattern.toString()
                    });
                    console.log(`Pay2Days: Found potential price ${numericPrice} from text "${text}"`);
                }
            }
        }
    }
    
    // If there are multiple prices, choose the most reasonable one (usually the largest reasonable price)
    if (potentialPrices.length > 0) {
        // Sort by price, take the largest (usually the main product price)
        potentialPrices.sort((a, b) => b.price - a.price);
        const selectedPrice = potentialPrices[0];
        console.log(`Pay2Days: Selected price ${selectedPrice.price} from ${potentialPrices.length} candidates`);
        return selectedPrice.price;
    }
    
    console.log('Pay2Days: Price not found for element:', deliveryElement);
    return null;
}

function calculateWorkDays(deliveryElement, workDaysInfoElement) {
    console.log('Pay2Days: Starting price extraction for element:', deliveryElement);
    
    const itemPrice = extractPrice(deliveryElement);
    console.log('Pay2Days: Extracted price:', itemPrice);
    
    chrome.storage.local.get(['salary', 'workingDays', 'submittedData'], function(result) {
        console.log('Pay2Days: Storage data:', result);
        
        let monthlySalary = null;
        let workingDaysPerMonth = 22; // default value
        
        // Prioritize submitted data
        if (result.submittedData && result.submittedData.salary) {
            monthlySalary = result.submittedData.salary;
            workingDaysPerMonth = result.submittedData.workingDays || 22;
            console.log('Pay2Days: Using submitted data - salary:', monthlySalary, 'working days:', workingDaysPerMonth);
        } else {
            if (result.salary) {
                monthlySalary = parseFloat(result.salary);
                console.log('Pay2Days: Using input salary:', monthlySalary);
            }
            if (result.workingDays) {
                workingDaysPerMonth = parseInt(result.workingDays);
                console.log('Pay2Days: Using input working days:', workingDaysPerMonth);
            } else {
                console.log('Pay2Days: Using default working days:', workingDaysPerMonth);
            }
        }
        
        if (itemPrice && monthlySalary && monthlySalary > 0 && workingDaysPerMonth > 0) {
            const workingDays = (itemPrice / monthlySalary) * workingDaysPerMonth;
            const roundedDays = Math.ceil(workingDays);
            
            console.log(`Pay2Days: Calculation - Price: ${itemPrice}, Salary: ${monthlySalary}, Working Days per Month: ${workingDaysPerMonth}, Working Days: ${workingDays}, Rounded: ${roundedDays}`);
            
            workDaysInfoElement.textContent = `${roundedDays} hari kerja`;
            workDaysInfoElement.title = `Harga: Rp ${itemPrice.toLocaleString('id-ID')}\nGaji bulanan: Rp ${monthlySalary.toLocaleString('id-ID')}\nHari kerja per bulan: ${workingDaysPerMonth}\nAnda perlu ${roundedDays} hari kerja untuk membeli barang ini`;
            
            // Change color based on number of work days
            if (roundedDays <= 7) {
                workDaysInfoElement.style.backgroundColor = '#4CAF50'; // Green - affordable
            } else if (roundedDays <= 30) {
                workDaysInfoElement.style.backgroundColor = '#FF9800'; // Orange - moderate
            } else {
                workDaysInfoElement.style.backgroundColor = '#F44336'; // Red - expensive
            }
            
            console.log(`Pay2Days: Successfully calculated ${roundedDays} working days`);
        } else {
            // Fallback if data is incomplete
            if (!monthlySalary) {
                workDaysInfoElement.textContent = 'Set gaji dulu';
                workDaysInfoElement.title = 'Silakan atur gaji bulanan di extension popup';
                workDaysInfoElement.style.backgroundColor = '#9E9E9E';
                console.log('Pay2Days: Missing salary data');
            } else if (!itemPrice) {
                workDaysInfoElement.textContent = 'Harga tidak ditemukan';
                workDaysInfoElement.title = 'Tidak dapat menemukan harga produk';
                workDaysInfoElement.style.backgroundColor = '#9E9E9E';
                console.log('Pay2Days: Price extraction failed');
            } else {
                workDaysInfoElement.textContent = 'Error perhitungan';
                workDaysInfoElement.title = 'Terjadi kesalahan dalam perhitungan';
                workDaysInfoElement.style.backgroundColor = '#9E9E9E';
                console.log('Pay2Days: Calculation error');
            }
        }
    });
}

function addWorkDaysInfo() {
    const deliveryTimeSelectors = [
        '.truncate.text-sp10.font-normal.my\\:font-light.km\\:font-light.whitespace-nowrap.text-white',
        'div.truncate.text-sp10.font-normal.my\\:font-light.km\\:font-light.whitespace-nowrap.text-white'
    ];
    
    let modifiedCount = 0;
    
    deliveryTimeSelectors.forEach(selector => {
        const deliveryElements = document.querySelectorAll(selector);
        
        deliveryElements.forEach((element, index) => {
            // Check if already modified (avoid duplication)
            if (!element.hasAttribute('data-pay2days-modified') && 
                element.textContent.match(/(Jam|Hari|Besok|hari ini)/i)) {
                
                element.setAttribute('data-pay2days-modified', 'true');
                
                const workDaysInfo = document.createElement('div');
                workDaysInfo.className = 'pay2days-workdays-info';
                
                calculateWorkDays(element, workDaysInfo);
                
                // Styling for work days info element - placed below delivery time
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
                
                // Hover effect - color will be set by calculateWorkDays
                let originalColor = '#e65100';
                
                workDaysInfo.addEventListener('mouseenter', function() {
                    originalColor = this.style.backgroundColor;
                    // Create darker hover color
                    if (originalColor.includes('rgb(76, 175, 80)') || originalColor === '#4CAF50') {
                        this.style.backgroundColor = '#388E3C';
                    } else if (originalColor.includes('rgb(255, 152, 0)') || originalColor === '#FF9800') {
                        this.style.backgroundColor = '#F57C00';
                    } else if (originalColor.includes('rgb(244, 67, 54)') || originalColor === '#F44336') {
                        this.style.backgroundColor = '#D32F2F';
                    } else {
                        this.style.backgroundColor = '#616161';
                    }
                    this.style.transform = 'scale(1.05)';
                    this.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
                });
                
                workDaysInfo.addEventListener('mouseleave', function() {
                    this.style.backgroundColor = originalColor;
                    this.style.transform = 'scale(1)';
                    this.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';
                });
                
                // Find container that contains delivery info and location
                let targetContainer = element;
                while (targetContainer.parentElement) {
                    const parent = targetContainer.parentElement;
                    if (parent.className && parent.className.includes('flex items-center space-x-1')) {
                        targetContainer = parent;
                        break;
                    }
                    targetContainer = parent;
                    
                    // Don't go too high
                    if (parent.className && parent.className.includes('p-2 flex-1 flex flex-col')) {
                        break;
                    }
                }
                
                // Place workDaysInfo after delivery/location container
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

function observeDOM() {
    const observer = new MutationObserver((mutations) => {
        let shouldModify = false;
        
        mutations.forEach((mutation) => {
            // Check if new nodes are added
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach((node) => {
                    // Check if added node contains delivery time elements
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
        
        // Run modification after short delay to ensure DOM is stable
        if (shouldModify) {
            setTimeout(() => {
                const count = addWorkDaysInfo();
                if (count > 0) {
                    console.log(`Pay2Days: Added work days info to ${count} new delivery time elements`);
                }
            }, 100);
        }
    });
    
    // Start observing the entire document
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    return observer;
}

function initPay2Days() {
    console.log('Pay2Days Extension: Initializing...');
    
    // Wait until DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(startModification, 500);
        });
    } else {
        startModification();
    }
}

function startModification() {
    const initialCount = addWorkDaysInfo();
    console.log(`Pay2Days: Initial modification completed. Added work days info to ${initialCount} delivery time elements.`);
    
    const observer = observeDOM();
    console.log('Pay2Days: DOM observer started for dynamic content');
    
    // Periodic check to ensure nothing is missed
    setInterval(() => {
        const count = addWorkDaysInfo();
        if (count > 0) {
            console.log(`Pay2Days: Periodic check - Added work days info to ${count} additional delivery time elements`);
        }
    }, 3000);
}

function debugDOMStructure() {
    console.log('Pay2Days Debug: Analyzing DOM structure...');
    
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
            
            const price = extractPrice(element);
            console.log(`Price found for element ${index}:`, price);
        }
    });
    
    console.log('\n=== Price Elements Debug ===');
    const priceSelectors = [
        '.text-shopee-primary',
        '[class*="shopee-primary"]',
        '[class*="price"]',
        '[class*="amount"]'
    ];
    
    priceSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        console.log(`Selector "${selector}" found ${elements.length} elements:`);
        
        elements.forEach((el, idx) => {
            if (idx < 5) {
                console.log(`  ${idx}: "${el.textContent.trim()}" - Classes: ${el.className}`);
            }
        });
    });
}

function updateAllWorkDaysCalculations() {
    const workDaysElements = document.querySelectorAll('.pay2days-workdays-info');
    workDaysElements.forEach((workDaysElement) => {
        const deliveryElement = workDaysElement.parentElement?.querySelector('[data-pay2days-modified="true"]');
        if (deliveryElement) {
            calculateWorkDays(deliveryElement, workDaysElement);
        }
    });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'debug') {
        debugDOMStructure();
        sendResponse({status: 'debug completed'});
    } else if (request.action === 'toggleExtension') {
        if (request.enabled) {
            initPay2Days();
            sendResponse({status: 'extension enabled'});
        } else {
            // Reset all changes - remove work days info elements
            const workDaysElements = document.querySelectorAll('.pay2days-workdays-info');
            workDaysElements.forEach(element => {
                element.remove();
            });
            
            // Reset modified attribute
            const modifiedElements = document.querySelectorAll('[data-pay2days-modified="true"]');
            modifiedElements.forEach(element => {
                element.removeAttribute('data-pay2days-modified');
            });
            
            sendResponse({status: 'extension disabled'});
        }
    } else if (request.action === 'updateSalary') {
        // Update all calculations when salary changes
        updateAllWorkDaysCalculations();
        sendResponse({status: 'salary updated'});
    }
});

function isShopeeSearchPage() {
    return window.location.hostname.includes('shopee') && 
           (window.location.pathname.includes('search') || 
            document.querySelector('.shopee-search-item-result__items'));
}

// Auto-start if on appropriate page
if (isShopeeSearchPage()) {
    console.log('Pay2Days: Shopee search page detected, starting extension...');
    initPay2Days();
} else {
    console.log('Pay2Days: Not a Shopee search page, waiting for activation...');
}

// Export for testing if needed
window.Pay2Days = {
    addWorkDaysInfo,
    debugDOMStructure,
    initPay2Days
};