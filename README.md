# Pay2Days - Shopee Price to Working Days Converter

A Chrome extension that converts Shopee item prices into how many working days are needed to afford them. This extension helps provide a more understandable perspective on the value of items based on your daily wage.

## Features

- ✅ Automatically detects Shopee pages
- ✅ Converts item prices to number of working days
- ✅ Monthly salary input for personal calculation
- ✅ Toggle ON/OFF functionality
- ✅ Dynamic content observation (for lazy-loaded products)
- ✅ Debug mode for DOM structure analysis
- ✅ Badge indicator on extension icon

## File Structure

```
Pay2Days/
├── manifest.json       # Extension configuration
├── popup.html         # Extension popup UI
├── popup.js          # Popup script
├── styles.css        # Popup styling
├── content.js        # Content script (DOM manipulation)
├── background.js     # Background service worker
├── struktur_dom.html # Shopee DOM structure reference
└── README.md         # Documentation
```

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked" and select the `Pay2Days` folder
4. The extension will be installed and appear in the toolbar

## How to Use

1. Open a Shopee search page (example: https://shopee.co.id/search?keyword=samsung)
2. Click the Pay2Days extension icon in the toolbar
3. Input your monthly salary in the extension popup
4. The extension will automatically turn ON and display working days for each item
5. Use the toggle button to enable/disable the extension
6. Use the "Debug DOM" button to view DOM structure in console

## How It Works

This extension calculates how many working days are needed to buy an item using the formula:
```
Working Days = (Item Price / Monthly Salary) × 22 working days
```

Assumption: 22 working days in a month (Monday-Friday, 4-5 weeks)

## Technical Details

### Content Script (`content.js`)
- Uses CSS selector to target price elements: `.truncate.text-base\\/5.font-medium`
- Implements MutationObserver to detect dynamic content
- Calculates and displays working days based on price and monthly salary
- Adds `data-pay2days-modified` attribute to prevent duplication
- Periodic check every 3 seconds to ensure nothing is missed

### Background Script (`background.js`)
- Service worker to manage extension state
- Communication between components (popup ↔ content script)
- Badge management (ON/OFF indicator)
- State persistence using chrome.storage

### Popup Interface
- Input field for entering monthly salary
- Toggle button to enable/disable extension
- Status indicator (ON/OFF with different colors)
- Debug button for DOM analysis
- Responsive design with gradient background

## Target Selector

This extension targets price elements with DOM structure like:

```html
<div class="truncate flex items-baseline">
  <span class="font-medium mr-px text-xs/sp14">Rp</span>
  <span class="truncate text-base/5 font-medium">8.999.000</span>
  <span class="font-medium mr-px text-xs/sp14"></span>
</div>
```

And adds working days display below it:
```html
<div class="pay2days-info">
  <span style="color: #1976d2; font-size: 12px;">≈ 3.2 working days</span>
</div>
```

## Permissions

- `storage`: To store extension state
- `activeTab`: To access active tab
- `tabs`: For communication with content script
- `host_permissions`: Access to Shopee domains (*.shopee.*)

## Debugging

1. Open Developer Tools (F12) on Shopee page
2. Click "Debug DOM" button in extension popup
3. Check Console to see:
   - Successfully modified elements
   - Detected DOM structure
   - Extension status

## Security Notes

- This extension is only for personal financial perspective assistance
- Does not collect or send your salary or financial data
- All calculations are performed locally in the browser
- Only modifies local display (does not affect Shopee server)
- Salary data is stored locally and can be deleted anytime

## Browser Support

- Google Chrome (Manifest V3)
- Microsoft Edge (Chromium-based)
- Brave Browser
- Opera (dengan Chromium engine)

## Development

For further development:

1. Edit the desired files
2. Click "Reload" at `chrome://extensions/` for Pay2Days extension
3. Test on Shopee pages
4. Check console for errors or debugging info

## Troubleshooting

**Extension not working:**
- Make sure you're on a Shopee page
- Make sure monthly salary is entered
- Check console for errors
- Reload extension at `chrome://extensions/`

**Working days not showing:**
- Try clicking "Debug DOM" for analysis
- Make sure extension is in ON status
- Make sure monthly salary is inputted
- DOM structure might have changed (need to update selector)

**Badge not appearing:**
- Refresh Shopee page
- Toggle extension OFF then ON again