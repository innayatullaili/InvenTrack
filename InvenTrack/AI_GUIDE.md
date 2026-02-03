# AI Implementation Guide - InvenTrack

**INSTRUKSI UNTUK AI:** Baca seluruh file ini sebelum mengimplementasikan perubahan apapun pada project InvenTrack.

---

## 🎯 PROJECT OVERVIEW

**Nama:** InvenTrack  
**Tipe:** Sistem Pendataan Inventaris Laptop untuk BPS (Badan Pusat Statistik)  
**Tech Stack:** Vanilla JavaScript (ES5), HTML5, CSS3, Google Apps Script, Google Spreadsheet  
**Database:** Google Spreadsheet (via Apps Script API)  
**Storage:** localStorage (dengan enkripsi AES-256)

---

## 📁 FILE STRUCTURE

```
InvenTrack/
├── index.html              # Main SPA application
├── login.html              # Login page (bcrypt verification)
├── register.html           # Registration page (bcrypt hashing)
├── css/
│   └── style.css           # All styles (responsive)
├── js/
│   ├── config.js           # Configuration (URLs, settings)
│   ├── data.js             # Data CRUD, normalization, validation
│   ├── sync.js             # Google Spreadsheet sync (SyncManager)
│   ├── auth.js             # Authentication (bcrypt, sessions)
│   ├── app.js              # UI logic, event handlers
│   ├── backup.js           # Backup/restore system
│   └── crypto.js           # AES-256 encryption
├── tests/
│   ├── test-runner.html    # Browser test runner
│   └── test-suite.js       # 19 automated tests
├── google-apps-script-v2.js # Deploy to Google Apps Script
├── SETUP.md                # Setup guide for new users
├── CHANGELOG.md            # Version history
└── AI_GUIDE.md             # This file
```

---

## 🔧 KEY MODULES

### 1. `js/config.js` - Configuration
```javascript
CONFIG = {
    APPS_SCRIPT_URL: 'https://script.google.com/.../exec',
    ENABLE_SYNC: true,
    AUTO_SYNC: true,
    SPREADSHEET_ID: '...',
    SHEETS: { INVENTARIS, PEMINJAMAN, KERUSAKAN, RIWAYAT, USERS }
}
```

### 2. `js/data.js` - Data Management
**Helpers:**
- `capitalizeStatus(str)` - "dipinjam" → "Dipinjam"
- `generateId(prefix)` - Generate unique ID
- `statusEquals(a, b)` - Case-insensitive compare
- `statusNotEquals(a, b)` - Case-insensitive not-equal

**Normalizers:**
- `normalizeInventaris(item)` - Adds kode, kondisi, capitalizes status
- `normalizePeminjaman(item)` - Normalize peminjaman
- `normalizeKerusakan(item)` - Normalize kerusakan
- `normalizeRiwayat(item)` - Normalize riwayat
- `normalizeAllData(data)` - Normalize all arrays

**Validators:**
- `validateDataConnections(data, cleanOrphans)` - Cross-validate references, auto-fix status

**CRUD:**
- `getData(key)` - Get from localStorage (decrypts if needed)
- `setData(key, data, skipSync)` - Save with optional auto-sync
- `addData(key, item)` - Add new item
- `updateData(key, id, updates)` - Update by ID
- `deleteData(key, id)` - Delete by ID
- `findById(key, id)` - Find single item
- `findByField(key, field, value)` - Find by field
- `getAllData()` - Get all data types
- `saveAllData(data, skipSync)` - Save all at once
- `cleanOrphanedData()` - Remove orphaned records

### 3. `js/sync.js` - Spreadsheet Sync
```javascript
SyncManager = {
    url: '',
    enabled: false,
    isSyncing: false,
    isLoadingFromCloud: false,
    syncQueue: [],
    isProcessingQueue: false
}
```

**Functions:**
- `initSyncModule()` - Initialize sync, load from Spreadsheet
- `loadFromSpreadsheet()` - Fetch, normalize, validate, save
- `syncAllToSpreadsheet()` - Full sync all data
- `autoSyncData(key, data)` - Auto-sync with queue
- `postDataToSpreadsheet(sheetName, rows)` - POST via iframe
- `updateSyncStatusUI(status)` - Update UI indicator

### 4. `js/app.js` - UI Logic
- Dashboard stats and charts
- Peminjaman form and table
- Pengembalian process
- Inventaris CRUD
- Kerusakan reports
- QR Code generation
- Riwayat with CSV export
- User management (admin)
- Backup/restore UI

### 5. `js/auth.js` - Authentication
- `hashPassword(password)` - bcrypt hash
- `verifyPassword(password, hash)` - bcrypt verify
- `login(username, password)` - Async login
- `logout()` - Clear session
- `getCurrentUser()` - Get logged in user
- `isAdmin()` - Check admin role

---

## 📊 DATA MODELS

### Inventaris
```javascript
{
    id: "ID1234567890abc",
    kode: "LPT-001",
    nama: "Laptop Dell XPS",
    merk: "Dell",
    spesifikasi: "i7, 16GB, 512GB SSD",
    tahun: 2024,
    kondisi: "Baik" | "Rusak Ringan" | "Rusak Berat",
    status: "Tersedia" | "Dipinjam",
    tanggal: "2024-01-01T00:00:00.000Z"
}
```

### Peminjaman
```javascript
{
    id: "ID1234567890abc",
    nama: "Budi Santoso",
    nip: "199001012020011001",
    bagian: "IPDS",
    noHp: "081234567890",
    laptopId: "ID...",
    laptopNama: "Laptop Dell XPS",
    laptopKode: "LPT-001",
    tanggalPinjam: "2024-01-01T00:00:00.000Z",
    tanggalKembali: "2024-01-15T00:00:00.000Z",
    keperluan: "Kegiatan Lapangan",
    keterangan: "",
    status: "Aktif" | "Selesai",
    createdAt: "2024-01-01T00:00:00.000Z"
}
```

### Kerusakan
```javascript
{
    id: "ID1234567890abc",
    laptopId: "ID...",
    laptopNama: "Laptop Dell XPS",
    laptopKode: "LPT-001",
    dilaporkanOleh: "Ahmad",
    jenisKerusakan: "Layar tidak menyala, Keyboard rusak",
    foto: "",
    status: "Dilaporkan" | "Diproses" | "Selesai",
    createdAt: "2024-01-01T00:00:00.000Z"
}
```

### Riwayat
```javascript
{
    id: "ID1234567890abc",
    nama: "Budi Santoso",
    nip: "199001012020011001",
    bagian: "IPDS",
    noHp: "081234567890",
    laptopId: "ID...",
    laptopNama: "Laptop Dell XPS",
    laptopKode: "LPT-001",
    tanggalPinjam: "2024-01-01T00:00:00.000Z",
    tanggalKembali: "2024-01-15T00:00:00.000Z",
    tglPengembalianAktual: "2024-01-14T00:00:00.000Z",
    keperluan: "Kegiatan Lapangan",
    kondisiKembali: "Baik",
    catatan: "",
    status: "Selesai"
}
```

---

## 🔄 DATA FLOW

```
SPREADSHEET (raw data)
        │
        ▼ fetch (sync.js)
┌───────────────────────────┐
│   loadFromSpreadsheet()   │
└───────────┬───────────────┘
            │
            ▼ raw JSON
┌───────────────────────────┐
│   normalizeAllData()      │  ← data.js
│   validateDataConnections()│
└───────────┬───────────────┘
            │
            ▼ validated
┌───────────────────────────┐
│   saveAllData()           │  → localStorage
└───────────┬───────────────┘
            │
            ▼ getData()
┌───────────────────────────┐
│   App UI Functions        │  ← app.js
└───────────────────────────┘
```

---

## ⚠️ IMPORTANT RULES

1. **ES5 Syntax Only** - No arrow functions, template literals, const/let in production
2. **Case-Insensitive Status** - Always use `statusEquals()` for comparisons
3. **Normalize on Load** - All data from Spreadsheet must be normalized
4. **Auto-Sync Corrections** - If data is fixed, sync back to Spreadsheet
5. **Skip Sync on Load** - Use `saveAllData(data, true)` to prevent sync loop
6. **Clean Orphans** - Remove kerusakan/peminjaman referencing deleted laptops

---

## 🐛 COMMON ISSUES & FIXES

### "Status laptop tidak sinkron"
- **Cause:** Peminjaman aktif tapi laptop status "Tersedia"
- **Fix:** `validateDataConnections()` auto-fixes this

### "Data kerusakan orphan"
- **Cause:** Laptop dihapus tapi kerusakan masih ada
- **Fix:** `cleanOrphanedData()` atau `validateDataConnections(data, true)`

### "SyncConfig is not defined"
- **Cause:** Old code using SyncConfig instead of SyncManager
- **Fix:** Replace all `SyncConfig` → `SyncManager`

### "403 Error on sync"
- **Cause:** Normal for iframe POST to Google Apps Script
- **Fix:** Ignore, data is still saved

---

## 🚀 QUICK START FOR AI

1. Read `js/config.js` for current configuration
2. Read `js/data.js` for data management patterns
3. Read `js/sync.js` for sync mechanism
4. Read `js/app.js` for UI patterns
5. Test changes at `http://localhost:8080`
6. Verify with browser console (F12)

---

## 📝 CODING CONVENTIONS

- Use `var` instead of `const/let`
- Use `function()` instead of `() =>`
- Use string concatenation instead of template literals
- Always add to existing patterns, don't refactor unnecessarily
- Use `console.log()` for debugging
- Handle errors with try-catch

---

## ✅ POST-IMPLEMENTATION CHECKLIST

**WAJIB: Setelah selesai mengimplementasikan perubahan, AI HARUS memberitahu pengguna langkah-langkah berikut:**

### Instruksi untuk Pengguna:

1. **Hard Refresh Browser**
   ```
   Tekan Ctrl+Shift+R untuk memuat ulang halaman dan menghapus cache
   ```

2. **Verifikasi Perubahan**
   ```
   Buka browser console (F12 → Console) dan pastikan tidak ada error merah
   ```

3. **Test Fitur yang Diubah**
   ```
   Lakukan test manual pada fitur yang baru diimplementasikan
   ```

4. **Cek Sinkronisasi (jika ada perubahan data)**
   ```
   Pastikan indikator sync menunjukkan "Online" (hijau)
   Cek Google Spreadsheet untuk memastikan data tersimpan
   ```

5. **Update Google Apps Script (jika ada perubahan di google-apps-script-v2.js)**
   ```
   1. Buka Google Spreadsheet → Extensions → Apps Script
   2. Replace kode dengan isi file google-apps-script-v2.js terbaru
   3. Save (Ctrl+S)
   4. Deploy → Manage deployments → Edit → New version → Deploy
   ```

6. **Backup (Opsional tapi Disarankan)**
   ```
   Login sebagai admin → Menu Backup → Buat Backup Baru
   ```

### Template Pesan untuk AI:

Setelah implementasi selesai, AI harus menyampaikan pesan seperti ini:

```
✅ Implementasi selesai!

File yang diubah:
- [list file yang diubah]

Langkah selanjutnya yang perlu Anda lakukan:
1. Hard refresh browser (Ctrl+Shift+R)
2. Buka console (F12) dan pastikan tidak ada error
3. Test fitur [nama fitur] dengan [cara test]
4. [Langkah tambahan jika ada, misal update Apps Script]

Jika ada masalah, beritahu saya error message yang muncul di console.
```

---

**Last Updated:** 2026-02-01
