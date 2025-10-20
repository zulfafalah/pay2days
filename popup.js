// Pay2Days Extension - Popup Script
// Script untuk popup Chrome extension

document.addEventListener('DOMContentLoaded', function() {
    const toggleBtn = document.getElementById('toggleBtn');
    const statusText = document.getElementById('status');
    const nameInput = document.getElementById('nameInput');
    const salaryInput = document.getElementById('salaryInput');
    const submitBtn = document.getElementById('submitBtn');
    const debugBtn = document.createElement('button');
    
    // Check if essential elements exist
    if (!toggleBtn) {
        console.error('Pay2Days: toggleBtn element not found');
        return;
    }
    if (!statusText) {
        console.error('Pay2Days: status element not found');
        return;
    }
    if (!nameInput || !salaryInput || !submitBtn) {
        console.error('Pay2Days: One or more input elements not found');
        return;
    }
    
    // Load saved values
    loadSavedValues();
    
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
    
    // Input field event listeners
    nameInput.addEventListener('input', function() {
        saveValues();
        updateSubmitButton();
        // Update UI to reflect name change in status
        chrome.runtime.sendMessage({action: 'getState'}, function(response) {
            if (response) {
                updateUI(response.enabled);
            }
        });
    });
    salaryInput.addEventListener('input', function() {
        saveValues();
        updateSubmitButton();
    });
    
    // Submit button event listener
    submitBtn.addEventListener('click', function() {
        const name = nameInput.value.trim();
        const salary = salaryInput.value.trim();
        
        if (!name || !salary) {
            alert('Please fill in both name and monthly salary fields.');
            return;
        }
        
        // Save the submitted data
        const submittedData = {
            name: name,
            salary: parseFloat(salary),
            submittedAt: new Date().toISOString()
        };
        
        chrome.storage.local.set({submittedData: submittedData}, function() {
            console.log('Pay2Days: Data submitted successfully', submittedData);
            
            // Show success message
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Submitted!';
            submitBtn.style.backgroundColor = '#4CAF50';
            
            setTimeout(() => {
                submitBtn.textContent = originalText;
                submitBtn.style.backgroundColor = '#9C27B0';
            }, 2000);
            
            // Update status to show submission
            updateUI(true); // Assuming extension is on
        });
    });
    
    function saveValues() {
        const data = {
            name: nameInput.value,
            salary: salaryInput.value
        };
        chrome.storage.local.set(data, function() {
            console.log('Pay2Days: Values saved');
        });
    }
    
    function loadSavedValues() {
        chrome.storage.local.get(['name', 'salary'], function(result) {
            if (result.name) {
                nameInput.value = result.name;
            }
            if (result.salary) {
                salaryInput.value = result.salary;
            }
            updateSubmitButton();
        });
    }
    
    function updateSubmitButton() {
        const hasName = nameInput.value.trim() !== '';
        const hasSalary = salaryInput.value.trim() !== '';
        
        if (hasName && hasSalary) {
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
        } else {
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.6';
        }
    }
    
    function updateUI(enabled) {
        const userName = nameInput.value ? ` for ${nameInput.value}` : '';
        
        // Check if data has been submitted
        chrome.storage.local.get(['submittedData'], function(result) {
            let statusSuffix = ' - Modifying prices with "test"';
            if (result.submittedData) {
                const submitDate = new Date(result.submittedData.submittedAt).toLocaleDateString();
                statusSuffix = ` - Data submitted on ${submitDate}`;
            }
            
            if (enabled) {
                statusText.textContent = `Extension is ON${userName}${statusSuffix}`;
                statusText.className = 'status on';
                toggleBtn.textContent = 'Turn OFF';
                toggleBtn.className = 'btn btn-off';
            } else {
                statusText.textContent = `Extension is OFF${userName}`;
                statusText.className = 'status off';
                toggleBtn.textContent = 'Turn ON';
                toggleBtn.className = 'btn btn-on';
            }
        });
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