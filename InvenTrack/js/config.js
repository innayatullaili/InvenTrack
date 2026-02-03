// ==========================================
// KONFIGURASI SISTEM INVENTARIS
// ==========================================

const CONFIG = {
    // ==========================================
    // GOOGLE SPREADSHEET SYNC
    // ==========================================
    // URL Google Apps Script Web App
    // LANGKAH SETUP:
    // 1. Buka Google Drive, buat Spreadsheet baru
    // 2. Copy ID dari URL: docs.google.com/spreadsheets/d/[ID_INI]/edit
    // 3. Buka Extensions > Apps Script
    // 4. Copy kode dari file google-apps-script-v2.js ke Apps Script
    // 5. Ganti SPREADSHEET_ID di Apps Script dengan ID spreadsheet Anda
    // 6. Jalankan fungsi setupSheets() sekali
    // 7. Deploy > New Deployment > Web App > Anyone
    // 8. Copy URL Web App dan paste di bawah ini
    
    // PASTE URL WEB APP GOOGLE APPS SCRIPT DI SINI:
    // Contoh: 'https://script.google.com/macros/s/AKfycbx.../exec'
APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbzjuNXtFBD5W3uOFdUQkYv0-LEP8lZs_5bwoniXzKBu8ENj03yeHL9DHLnfmI-9fyiTWQ/exec',
    
    // Set true untuk aktifkan sync otomatis ke Spreadsheet
    ENABLE_SYNC: true,
    
    // Auto sync setiap ada perubahan data
    AUTO_SYNC: true,
    
    // ID Spreadsheet (untuk referensi, opsional)
    // Contoh: '1ABC123xyz456...'
    SPREADSHEET_ID: '1JQL1QIPtWeFFRry3X0eXQ7TQg83R9pz0qpmJ5x7vv9w',
    
    // ==========================================
    // GENERAL CONFIG
    // ==========================================
    
    // Base URL website (untuk generate QR Code)
    BASE_URL: window.location.origin + window.location.pathname,
    
    // Nama sheet di Spreadsheet
    SHEETS: {
        INVENTARIS: 'Inventaris',
        PEMINJAMAN: 'Peminjaman',
        KERUSAKAN: 'Kerusakan',
        RIWAYAT: 'Riwayat',
        USERS: 'Users'
    }
};

// Check if sync is configured
function isSyncEnabled() {
    return CONFIG.ENABLE_SYNC && CONFIG.APPS_SCRIPT_URL && CONFIG.APPS_SCRIPT_URL !== '';
}
