// Pay2Days Extension - Popup Script
// Script untuk popup Chrome extension

document.addEventListener('DOMContentLoaded', function() {
    const toggleBtn = document.getElementById('toggleBtn');
    const statusText = document.getElementById('status');
    const debugBtn = document.createElement('button');
    
    // Tambahkan debug button
    debugBtn.textContent = 'Debug DOM';
    debugBtn.className = 'btn btn-debug';
    debugBtn.style.marginTop = '10px';
    debugBtn.style.backgroundColor = '#2196F3';
    debugBtn.style.color = 'white';
    debugBtn.style.border = 'none';
    debugBtn.style.padding = '8px 16px';
    debugBtn.style.borderRadius = '4px';
    debugBtn.style.cursor = 'pointer';
    document.querySelector('.container').appendChild(debugBtn);
    
    // Get current state dari background script
    chrome.runtime.sendMessage({action: 'getState'}, function(response) {
        if (response) {
            updateUI(response.enabled);
        }
    });
    
    // Toggle button click handler
    toggleBtn.addEventListener('click', function() {
        chrome.runtime.sendMessage({action: 'getState'}, function(response) {
            const currentState = response ? response.enabled : true;
            const newState = !currentState;
            
            // Update background script state
            chrome.runtime.sendMessage({
                action: 'toggleExtension', 
                enabled: newState
            }, function(bgResponse) {
                if (bgResponse && bgResponse.status === 'state updated') {
                    updateUI(newState);
                    
                    // Send message to content script
                    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                        if (tabs[0]) {
                            chrome.tabs.sendMessage(tabs[0].id, {
                                action: 'toggleExtension',
                                enabled: newState
                            }).then(response => {
                                console.log('Pay2Days Popup: Content script response:', response);
                            }).catch(error => {
                                console.log('Pay2Days Popup: Content script not available:', error);
                            });
                        }
                    });
                }
            });
        });
    });
    
    // Debug button click handler
    debugBtn.addEventListener('click', function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'debug'
                }).then(response => {
                    console.log('Pay2Days Debug: Response:', response);
                    alert('Debug information logged to console. Check Developer Tools.');
                }).catch(error => {
                    console.log('Pay2Days Debug: Error:', error);
                    alert('Debug failed. Make sure you are on a Shopee page.');
                });
            }
        });
    });
    
    function updateUI(enabled) {
        if (enabled) {
            statusText.textContent = 'Extension is ON - Modifying prices with "test"';
            statusText.className = 'status on';
            toggleBtn.textContent = 'Turn OFF';
            toggleBtn.className = 'btn btn-off';
        } else {
            statusText.textContent = 'Extension is OFF';
            statusText.className = 'status off';
            toggleBtn.textContent = 'Turn ON';
            toggleBtn.className = 'btn btn-on';
        }
    }
});

// Add CSS untuk styling button
const style = document.createElement('style');
style.textContent = `
    .btn-debug:hover {
        background-color: #1976D2 !important;
        transform: translateY(-1px);
        transition: all 0.2s ease;
    }
    
    .btn-debug:active {
        transform: translateY(0);
    }
`;
document.head.appendChild(style);