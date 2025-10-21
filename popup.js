// Pay2Days Extension - Popup Script
// Script untuk popup Chrome extension

document.addEventListener('DOMContentLoaded', function() {
    const toggleBtn = document.getElementById('toggleBtn');
    const nameInput = document.getElementById('nameInput');
    const salaryInput = document.getElementById('salaryInput');
    const workingDaysInput = document.getElementById('workingDaysInput');
    const submitBtn = document.getElementById('submitBtn');
    const debugBtn = document.createElement('button');
    
    // Check if essential elements exist
    if (!toggleBtn) {
        console.error('Pay2Days: toggleBtn element not found');
        return;
    }

    if (!nameInput || !salaryInput || !workingDaysInput || !submitBtn) {
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
        // Format currency sebagai Indonesian Rupiah dengan pemisah ribuan
        formatCurrencyInput(this);
        saveValues();
        updateSubmitButton();
        
        // Update calculations in real-time as user types (with debouncing)
        clearTimeout(salaryInput.updateTimeout);
        salaryInput.updateTimeout = setTimeout(() => {
            if (salaryInput.value.trim() !== '') {
                chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                    if (tabs[0]) {
                        chrome.tabs.sendMessage(tabs[0].id, {
                            action: 'updateSalary'
                        }).catch(error => {
                            console.log('Pay2Days: Content script not available:', error);
                        });
                    }
                });
            }
        }, 500); // 500ms delay untuk debouncing
    });
    
    workingDaysInput.addEventListener('input', function() {
        saveValues();
        updateSubmitButton();
        
        // Update calculations in real-time when working days change
        clearTimeout(workingDaysInput.updateTimeout);
        workingDaysInput.updateTimeout = setTimeout(() => {
            if (workingDaysInput.value.trim() !== '') {
                chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                    if (tabs[0]) {
                        chrome.tabs.sendMessage(tabs[0].id, {
                            action: 'updateSalary'
                        }).catch(error => {
                            console.log('Pay2Days: Content script not available:', error);
                        });
                    }
                });
            }
        }, 500); // 500ms delay untuk debouncing
    });
    
    // Submit button event listener
    submitBtn.addEventListener('click', function() {
        const name = nameInput.value.trim();
        const salary = getNumericValue(salaryInput.value.trim()); // Get numeric value
        const workingDays = workingDaysInput.value.trim();
        
        if (!name || !salary || !workingDays) {
            alert('Please fill in all fields: name, monthly salary, and working days.');
            return;
        }
        
        // Save the submitted data
        const submittedData = {
            name: name,
            salary: parseFloat(salary),
            workingDays: parseInt(workingDays),
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
            
            // Notify content script about salary update
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: 'updateSalary'
                    }).then(response => {
                        console.log('Pay2Days: Salary update sent to content script:', response);
                    }).catch(error => {
                        console.log('Pay2Days: Content script not available for salary update:', error);
                    });
                }
            });
        });
    });
    
    function saveValues() {
        // Ambil nilai numerik dari salary input yang sudah diformat
        const numericSalary = getNumericValue(salaryInput.value);
        const data = {
            name: nameInput.value,
            salary: numericSalary, // Save numeric value without formatting
            workingDays: workingDaysInput.value
        };
        chrome.storage.local.set(data, function() {
            console.log('Pay2Days: Values saved', data);
        });
    }
    
    function loadSavedValues() {
        chrome.storage.local.get(['name', 'salary', 'workingDays'], function(result) {
            if (result.name) {
                nameInput.value = result.name;
            }
            if (result.salary) {
                // Pastikan salary adalah string numerik sebelum formatting
                const numericSalary = result.salary.toString().replace(/[^\d]/g, '');
                if (numericSalary) {
                    salaryInput.value = formatNumberWithDots(numericSalary);
                }
            }
            if (result.workingDays) {
                workingDaysInput.value = result.workingDays;
            }
            updateSubmitButton();
        });
    }
    
    // Function untuk format input currency dengan pemisah ribuan
    function formatCurrencyInput(input) {
        // Ambil posisi kursor
        const cursorPosition = input.selectionStart;
        const originalValue = input.value;
        
        // Hapus semua karakter non-digit
        let numericValue = originalValue.replace(/[^\d]/g, '');
        
        // Format dengan pemisah ribuan (titik)
        const formattedValue = formatNumberWithDots(numericValue);
        
        // Set nilai yang sudah diformat
        input.value = formattedValue;
        
        // Hitung posisi kursor baru berdasarkan jumlah titik yang ditambahkan
        const dotsAdded = formattedValue.length - numericValue.length;
        const newCursorPosition = Math.min(cursorPosition + dotsAdded, formattedValue.length);
        
        // Set posisi kursor
        input.setSelectionRange(newCursorPosition, newCursorPosition);
    }
    
    // Function untuk format angka dengan pemisah ribuan (titik)
    function formatNumberWithDots(number) {
        if (!number || number === '') return '';
        // Pastikan input adalah string dan hanya mengandung angka
        const numStr = number.toString().replace(/[^\d]/g, '');
        if (numStr === '') return '';
        return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
    
    // Function untuk mendapatkan nilai numerik dari input yang sudah diformat
    function getNumericValue(formattedValue) {
        if (!formattedValue) return '';
        return formattedValue.toString().replace(/[^\d]/g, '');
    }
    
    function updateSubmitButton() {
        const hasName = nameInput.value.trim() !== '';
        const hasSalary = getNumericValue(salaryInput.value.trim()) !== '';
        const hasWorkingDays = workingDaysInput.value.trim() !== '';
        
        if (hasName && hasSalary && hasWorkingDays) {
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
                toggleBtn.textContent = 'Turn OFF';
                toggleBtn.className = 'btn btn-off';
                
            } else {
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