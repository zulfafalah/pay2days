# Pay2Days - Price Manipulator Extension

Chrome extension yang dapat memanipulasi DOM untuk menambahkan string "test" pada harga-harga di halaman Shopee. Extension ini dibuat untuk tujuan demonstrasi manipulasi DOM.

## Fitur

- ✅ Otomatis mendeteksi halaman Shopee
- ✅ Menambahkan string "test" pada semua harga yang ditemukan
- ✅ Toggle ON/OFF functionality
- ✅ Observasi konten dinamis (untuk produk yang dimuat secara lazy loading)
- ✅ Debug mode untuk analisis struktur DOM
- ✅ Badge indicator di extension icon

## Struktur File

```
Pay2Days/
├── manifest.json       # Configuration extension
├── popup.html         # UI popup extension
├── popup.js          # Script popup
├── styles.css        # Styling popup
├── content.js        # Content script (manipulasi DOM)
├── background.js     # Background service worker
├── struktur_dom.html # Referensi struktur DOM Shopee
└── README.md         # Dokumentasi
```

## Cara Instalasi

1. Buka Chrome dan navigasi ke `chrome://extensions/`
2. Aktifkan "Developer mode" di pojok kanan atas
3. Klik "Load unpacked" dan pilih folder `Pay2Days`
4. Extension akan terpasang dan muncul di toolbar

## Cara Penggunaan

1. Buka halaman pencarian Shopee (contoh: https://shopee.co.id/search?keyword=samsung)
2. Klik icon extension Pay2Days di toolbar
3. Extension akan otomatis ON dan menambahkan "test" pada harga
4. Gunakan toggle button untuk mengaktifkan/menonaktifkan
5. Gunakan tombol "Debug DOM" untuk melihat struktur DOM di console

## Detail Teknis

### Content Script (`content.js`)
- Menggunakan selector CSS untuk menargetkan elemen harga: `.truncate.text-base\\/5.font-medium`
- Implementasi MutationObserver untuk mendeteksi konten dinamis
- Menambahkan atribut `data-pay2days-modified` untuk mencegah duplikasi
- Periodic check setiap 3 detik untuk memastikan tidak ada yang terlewat

### Background Script (`background.js`)
- Service worker untuk mengelola state extension
- Komunikasi antar komponen (popup ↔ content script)
- Badge management (ON/OFF indicator)
- State persistence menggunakan chrome.storage

### Popup Interface
- Toggle button untuk mengaktifkan/menonaktifkan extension
- Status indicator (ON/OFF dengan warna berbeda)
- Debug button untuk analisis DOM
- Responsive design dengan gradient background

## Target Selector

Extension ini menargetkan elemen harga dengan struktur DOM seperti:

```html
<div class="truncate flex items-baseline">
  <span class="font-medium mr-px text-xs/sp14">Rp</span>
  <span class="truncate text-base/5 font-medium">8.999.000</span>
  <span class="font-medium mr-px text-xs/sp14"></span>
</div>
```

## Permissions

- `storage`: Untuk menyimpan state extension
- `activeTab`: Untuk mengakses tab aktif
- `tabs`: Untuk komunikasi dengan content script
- `host_permissions`: Akses ke domain Shopee (*.shopee.*)

## Debugging

1. Buka Developer Tools (F12) di halaman Shopee
2. Klik tombol "Debug DOM" di popup extension
3. Check Console untuk melihat:
   - Elemen yang berhasil dimodifikasi
   - Struktur DOM yang terdeteksi
   - Status extension

## Catatan Keamanan

- Extension ini hanya untuk demonstrasi dan pembelajaran
- Tidak mengumpulkan atau mengirim data pengguna
- Hanya memodifikasi tampilan lokal (tidak mempengaruhi server)
- Perubahan hilang setelah refresh halaman

## Browser Support

- Google Chrome (Manifest V3)
- Microsoft Edge (Chromium-based)
- Brave Browser
- Opera (dengan Chromium engine)

## Development

Untuk development lebih lanjut:

1. Edit file yang diinginkan
2. Klik "Reload" di `chrome://extensions/` untuk extension Pay2Days
3. Test di halaman Shopee
4. Check console untuk error atau debugging info

## Troubleshooting

**Extension tidak berfungsi:**
- Pastikan sudah di halaman Shopee
- Check console untuk error
- Reload extension di `chrome://extensions/`

**Harga tidak berubah:**
- Coba klik "Debug DOM" untuk analisis
- Pastikan extension dalam status ON
- Struktur DOM mungkin berubah (perlu update selector)

**Badge tidak muncul:**
- Refresh halaman Shopee
- Toggle extension OFF lalu ON kembali