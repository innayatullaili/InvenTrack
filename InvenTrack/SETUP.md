# Setup Guide - InvenTrack

Panduan lengkap untuk setup InvenTrack dari awal.

---

## Persyaratan

- Browser modern (Chrome, Firefox, Edge)
- Akun Google (untuk Google Spreadsheet)
- Web server sederhana (opsional, untuk development)

---

## Langkah 1: Download/Clone Project

```bash
# Clone dari repository
git clone https://github.com/[username]/InvenTrack.git
cd InvenTrack

# Atau download ZIP dan extract
```

---

## Langkah 2: Setup Google Spreadsheet

### 2.1 Buat Spreadsheet Baru

1. Buka [Google Sheets](https://sheets.google.com)
2. Klik **Blank** untuk membuat spreadsheet baru
3. Beri nama: `InvenTrack Database`
4. **Copy ID Spreadsheet** dari URL:
   ```
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
   ```
   Contoh ID: `175Qw4H27QhCnWxG9p8vx39vSqYitKg1hhKQHVnqpcHc`

### 2.2 Setup Google Apps Script

1. Di spreadsheet, klik **Extensions** → **Apps Script**
2. Hapus kode default (`function myFunction() {}`)
3. Copy seluruh isi file `google-apps-script-v2.js` dari project
4. Paste ke Apps Script editor
5. **Ganti SPREADSHEET_ID** di baris pertama:
   ```javascript
   const SPREADSHEET_ID = 'PASTE_ID_SPREADSHEET_ANDA_DISINI';
   ```
6. Klik **Save** (Ctrl+S)
7. Jalankan fungsi **setupSheets**:
   - Klik dropdown di toolbar, pilih `setupSheets`
   - Klik **Run**
   - Authorize jika diminta (pilih akun Google Anda)
   - Klik "Advanced" → "Go to InvenTrack (unsafe)" → "Allow"

### 2.3 Deploy Web App

1. Klik **Deploy** → **New deployment**
2. Klik ikon gear ⚙️ → pilih **Web app**
3. Isi:
   - **Description**: `InvenTrack API`
   - **Execute as**: `Me`
   - **Who has access**: `Anyone`
4. Klik **Deploy**
5. **Copy URL Web App** yang muncul:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```

---

## Langkah 3: Konfigurasi Project

### 3.1 Edit `js/config.js`

```javascript
const CONFIG = {
    // Paste URL Web App dari langkah 2.3
    APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycb.../exec',
    
    // Set true untuk aktifkan sync
    ENABLE_SYNC: true,
    
    // Auto sync setiap ada perubahan
    AUTO_SYNC: true,
    
    // Paste ID Spreadsheet dari langkah 2.1
    SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID',
    
    // Lainnya biarkan default
    ...
};
```

---

## Langkah 4: Jalankan Aplikasi

### Option A: Buka Langsung (Sederhana)

1. Double-click file `index.html`
2. Aplikasi akan terbuka di browser
3. Login dengan:
   - Username: `admin`
   - Password: `admin123`

### Option B: Dengan Web Server (Recommended)

```bash
# Menggunakan Python
python -m http.server 8080

# Atau menggunakan Node.js
npx http-server -p 8080

# Atau menggunakan PHP
php -S localhost:8080
```

Buka browser: `http://localhost:8080`

---

## Langkah 5: Verifikasi Setup

### 5.1 Cek Sync Status

1. Login ke aplikasi
2. Lihat indikator di kanan atas:
   - **Online** (hijau) = Terhubung ke Spreadsheet
   - **Offline** (abu-abu) = Tidak terhubung
   - **Error** (merah) = Ada masalah

### 5.2 Test Sinkronisasi

1. Tambah data inventaris baru
2. Buka Google Spreadsheet
3. Cek apakah data muncul di sheet `Inventaris`

### 5.3 Cek Console Browser

Tekan `F12` → Tab `Console`:
```
✅ Loading data.js...
✅ Loading sync.js...
✅ App initialized successfully
✅ Data received from spreadsheet: {...}
```

---

## Troubleshooting

### "Sync tidak berjalan"

1. Pastikan URL Apps Script benar di `config.js`
2. Pastikan Apps Script sudah di-deploy sebagai Web App
3. Pastikan "Who has access" = "Anyone"
4. Hard refresh browser: `Ctrl+Shift+R`

### "Error 403 Forbidden"

Ini normal untuk iframe POST. Data tetap tersimpan.

### "Data tidak muncul di Spreadsheet"

1. Jalankan `setupSheets()` di Apps Script
2. Cek apakah sheet sudah terbuat: Inventaris, Peminjaman, Kerusakan, Riwayat
3. Cek permission spreadsheet (harus bisa diedit oleh Apps Script)

### "Password admin tidak bekerja"

Default credentials:
- Username: `admin`
- Password: `admin123`

Atau clear localStorage dan register ulang:
```javascript
// Di browser console
localStorage.clear();
location.reload();
```

---

## Struktur File

```
InvenTrack/
├── index.html              # Aplikasi utama
├── login.html              # Halaman login
├── register.html           # Halaman registrasi
├── css/
│   └── style.css           # Stylesheet
├── js/
│   ├── config.js           # ⚠️ EDIT FILE INI
│   ├── data.js             # Manajemen data
│   ├── sync.js             # Sync ke Spreadsheet
│   ├── auth.js             # Autentikasi
│   ├── app.js              # Logika UI
│   ├── backup.js           # Backup system
│   └── crypto.js           # Enkripsi
├── google-apps-script-v2.js # Copy ke Apps Script
├── tests/                  # Test suite
├── SETUP.md                # File ini
└── CHANGELOG.md            # Riwayat perubahan
```

---

## Fitur Aplikasi

| Fitur | Deskripsi |
|-------|-----------|
| Dashboard | Statistik inventaris |
| Peminjaman | Form & daftar peminjaman |
| Pengembalian | Proses pengembalian |
| Inventaris | Kelola data laptop |
| Kerusakan | Laporan kerusakan |
| QR Code | Generate QR untuk akses cepat |
| Riwayat | History peminjaman + export CSV |
| Backup | Backup & restore data |

---

## Keamanan

- Password di-hash dengan bcrypt
- Data sensitif di-enkripsi
- CSRF protection aktif
- XSS protection dengan DOMPurify

---

## Support

- Baca `CHANGELOG.md` untuk riwayat perubahan
- Baca `SECURITY_AUDIT_REPORT.md` untuk info keamanan
- Jalankan `tests/test-runner.html` untuk testing

---

**Dibuat untuk BPS - Badan Pusat Statistik**
