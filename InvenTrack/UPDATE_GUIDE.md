# Update Guide - InvenTrack v14

**INSTRUKSI UNTUK AI:** File ini berisi perubahan yang harus diimplementasikan untuk mengupdate InvenTrack dari versi GitHub ke versi terbaru (v14).

Baca seluruh file ini, lalu implementasikan perubahan satu per satu. Setelah selesai, beritahu pengguna langkah-langkah yang harus dilakukan.

---

## 📋 RINGKASAN PERUBAHAN

| Prioritas | File | Aksi | Deskripsi |
|-----------|------|------|-----------|
| 1 | `js/data.js` | **BUAT BARU** | Modul data management |
| 2 | `js/sync.js` | **REPLACE** | Refactor dengan SyncManager |
| 3 | `js/app.js` | **EDIT** | Hapus fungsi duplikat, fix reference |
| 4 | `index.html` | **EDIT** | Hapus inline script, update script tags |
| 5 | `js/config.js` | **EDIT** | Pastikan format benar |

---

## 1️⃣ BUAT FILE BARU: `js/data.js`

Buat file `js/data.js` dengan isi berikut:

```javascript
console.log('Loading data.js...');

function capitalizeStatus(str) {
    if (!str || typeof str !== 'string') return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function generateId(prefix) {
    var timestamp = Date.now();
    var random = Math.random().toString(36).substring(2, 15);
    return (prefix || 'ID') + timestamp + random;
}

function statusEquals(actual, expected) {
    if (!actual || !expected) return false;
    return actual.toString().toLowerCase() === expected.toString().toLowerCase();
}

function statusNotEquals(actual, expected) {
    return !statusEquals(actual, expected);
}

function normalizeInventaris(item) {
    if (!item) return null;
    return {
        id: item.id || generateId('INV'),
        kode: item.kode || item.id || '',
        nama: item.nama || '',
        merk: item.merk || '',
        spesifikasi: item.spesifikasi || '',
        tahun: item.tahun || new Date().getFullYear(),
        kondisi: item.kondisi || 'Baik',
        status: capitalizeStatus(item.status) || 'Tersedia',
        tanggal: item.tanggal || new Date().toISOString()
    };
}

function normalizePeminjaman(item) {
    if (!item) return null;
    return {
        id: item.id || generateId('PJM'),
        nama: item.nama || '',
        nip: item.nip || '',
        bagian: item.bagian || '',
        noHp: item.noHp || '',
        laptopId: item.laptopId || '',
        laptopNama: item.laptopNama || '',
        laptopKode: item.laptopKode || '',
        tanggalPinjam: item.tanggalPinjam || item.tglPinjam || '',
        tanggalKembali: item.tanggalKembali || item.tglKembali || '',
        keperluan: item.keperluan || '',
        keterangan: item.keterangan || '',
        status: capitalizeStatus(item.status) || 'Aktif',
        createdAt: item.createdAt || new Date().toISOString()
    };
}

function normalizeKerusakan(item) {
    if (!item) return null;
    return {
        id: item.id || generateId('RSK'),
        laptopId: item.laptopId || '',
        laptopNama: item.laptopNama || '',
        laptopKode: item.laptopKode || '',
        dilaporkanOleh: item.dilaporkanOleh || '',
        jenisKerusakan: item.jenisKerusakan || '',
        foto: item.foto || '',
        status: capitalizeStatus(item.status) || 'Dilaporkan',
        createdAt: item.createdAt || new Date().toISOString()
    };
}

function normalizeRiwayat(item) {
    if (!item) return null;
    return {
        id: item.id || generateId('RWT'),
        nama: item.nama || '',
        nip: item.nip || '',
        bagian: item.bagian || '',
        noHp: item.noHp || '',
        laptopId: item.laptopId || '',
        laptopNama: item.laptopNama || '',
        laptopKode: item.laptopKode || '',
        tanggalPinjam: item.tanggalPinjam || item.tglPinjam || '',
        tanggalKembali: item.tanggalKembali || item.tglKembali || '',
        tglPengembalianAktual: item.tglPengembalianAktual || '',
        keperluan: item.keperluan || '',
        kondisiKembali: item.kondisiKembali || 'Baik',
        catatan: item.catatan || '',
        status: capitalizeStatus(item.status) || 'Selesai',
        createdAt: item.createdAt || new Date().toISOString()
    };
}

function normalizeAllData(data) {
    var normalized = {
        inventaris: [],
        peminjaman: [],
        kerusakan: [],
        riwayat: []
    };
    
    if (data.inventaris && Array.isArray(data.inventaris)) {
        normalized.inventaris = data.inventaris
            .map(normalizeInventaris)
            .filter(function(item) { return item !== null; });
    }
    
    if (data.peminjaman && Array.isArray(data.peminjaman)) {
        normalized.peminjaman = data.peminjaman
            .map(normalizePeminjaman)
            .filter(function(item) { return item !== null; });
    }
    
    if (data.kerusakan && Array.isArray(data.kerusakan)) {
        normalized.kerusakan = data.kerusakan
            .map(normalizeKerusakan)
            .filter(function(item) { return item !== null; });
    }
    
    if (data.riwayat && Array.isArray(data.riwayat)) {
        normalized.riwayat = data.riwayat
            .map(normalizeRiwayat)
            .filter(function(item) { return item !== null; });
    }
    
    return normalized;
}

function validateDataConnections(data, cleanOrphans) {
    console.log('Validating data connections...');
    
    var wasModified = false;
    var inventarisIds = new Set(data.inventaris.map(function(i) { return i.id; }));
    
    var orphanedPeminjaman = [];
    data.peminjaman.forEach(function(p) {
        if (p.laptopId && !inventarisIds.has(p.laptopId)) {
            console.warn('Peminjaman "' + p.nama + '" references missing laptop ID: ' + p.laptopId);
            orphanedPeminjaman.push(p.id);
        }
    });
    
    var orphanedKerusakan = [];
    data.kerusakan.forEach(function(k) {
        if (k.laptopId && !inventarisIds.has(k.laptopId)) {
            console.warn('Kerusakan references missing laptop ID: ' + k.laptopId);
            orphanedKerusakan.push(k.id);
        }
    });
    
    if (cleanOrphans) {
        if (orphanedKerusakan.length > 0) {
            var originalKerusakanCount = data.kerusakan.length;
            data.kerusakan = data.kerusakan.filter(function(k) {
                return orphanedKerusakan.indexOf(k.id) === -1;
            });
            console.log('Cleaned ' + (originalKerusakanCount - data.kerusakan.length) + ' orphaned kerusakan records');
            wasModified = true;
        }
    }
    
    var activePeminjamanLaptopIds = new Set(
        data.peminjaman
            .filter(function(p) { return statusEquals(p.status, 'Aktif'); })
            .map(function(p) { return p.laptopId; })
    );
    
    data.inventaris.forEach(function(inv) {
        if (activePeminjamanLaptopIds.has(inv.id)) {
            if (!statusEquals(inv.status, 'Dipinjam')) {
                console.log('Fixing status: ' + inv.nama + ' -> Dipinjam (has active loan)');
                inv.status = 'Dipinjam';
                wasModified = true;
            }
        } else if (statusEquals(inv.status, 'Dipinjam')) {
            console.log('Fixing status: ' + inv.nama + ' -> Tersedia (no active loan)');
            inv.status = 'Tersedia';
            wasModified = true;
        }
    });
    
    var unresolvedKerusakanLaptopIds = new Set(
        data.kerusakan
            .filter(function(k) { return !statusEquals(k.status, 'Selesai'); })
            .map(function(k) { return k.laptopId; })
    );
    
    data.inventaris.forEach(function(inv) {
        if (unresolvedKerusakanLaptopIds.has(inv.id)) {
            if (statusEquals(inv.kondisi, 'Baik')) {
                console.log('Fixing kondisi: ' + inv.nama + ' -> Rusak Ringan (has unresolved damage)');
                inv.kondisi = 'Rusak Ringan';
                wasModified = true;
            }
        }
    });
    
    console.log('Data connection validation complete. Modified:', wasModified);
    
    data._wasModified = wasModified;
    return data;
}

function cleanOrphanedData() {
    console.log('Cleaning orphaned data...');
    
    var allData = getAllData();
    var validatedData = validateDataConnections(allData, true);
    
    if (validatedData._wasModified) {
        delete validatedData._wasModified;
        saveAllData(validatedData, false);
        console.log('Orphaned data cleaned and synced');
        return true;
    }
    
    console.log('No orphaned data found');
    return false;
}

function getData(key) {
    try {
        var storedData = localStorage.getItem(key);
        if (!storedData) return [];
        
        if (typeof CryptoManager !== 'undefined' && localStorage.getItem(key + '_encrypted') === 'true') {
            var decrypted = CryptoManager.decrypt(storedData);
            return decrypted || [];
        }
        
        return JSON.parse(storedData);
    } catch (e) {
        console.error('Error getting data for key:', key, e);
        return [];
    }
}

function setData(key, data, skipSync) {
    try {
        var jsonData = JSON.stringify(data);
        
        if (typeof CryptoManager !== 'undefined' && CryptoManager.isEnabled && CryptoManager.isEnabled()) {
            var encrypted = CryptoManager.encrypt(data);
            localStorage.setItem(key, encrypted);
            localStorage.setItem(key + '_encrypted', 'true');
        } else {
            localStorage.setItem(key, jsonData);
            localStorage.removeItem(key + '_encrypted');
        }
        
        if (!skipSync && typeof autoSyncData === 'function') {
            autoSyncData(key, data);
        }
        
        return true;
    } catch (e) {
        console.error('Error setting data for key:', key, e);
        return false;
    }
}

function addData(key, item) {
    var data = getData(key);
    data.push(item);
    return setData(key, data);
}

function updateData(key, id, updates) {
    var data = getData(key);
    var index = -1;
    
    for (var i = 0; i < data.length; i++) {
        if (data[i].id === id) {
            index = i;
            break;
        }
    }
    
    if (index === -1) return false;
    
    for (var prop in updates) {
        if (updates.hasOwnProperty(prop)) {
            data[index][prop] = updates[prop];
        }
    }
    
    return setData(key, data);
}

function deleteData(key, id) {
    var data = getData(key);
    var filtered = data.filter(function(item) {
        return item.id !== id;
    });
    
    if (filtered.length === data.length) return false;
    
    return setData(key, filtered);
}

function findById(key, id) {
    var data = getData(key);
    for (var i = 0; i < data.length; i++) {
        if (data[i].id === id) return data[i];
    }
    return null;
}

function findByField(key, field, value) {
    var data = getData(key);
    var results = [];
    for (var i = 0; i < data.length; i++) {
        if (data[i][field] === value) results.push(data[i]);
    }
    return results;
}

function getAllData() {
    return {
        inventaris: getData('inventaris'),
        peminjaman: getData('peminjaman'),
        kerusakan: getData('kerusakan'),
        riwayat: getData('riwayat')
    };
}

function saveAllData(allData, skipSync) {
    setData('inventaris', allData.inventaris || [], skipSync);
    setData('peminjaman', allData.peminjaman || [], skipSync);
    setData('kerusakan', allData.kerusakan || [], skipSync);
    setData('riwayat', allData.riwayat || [], skipSync);
}

function clearAllData() {
    localStorage.removeItem('inventaris');
    localStorage.removeItem('peminjaman');
    localStorage.removeItem('kerusakan');
    localStorage.removeItem('riwayat');
}

console.log('data.js loaded successfully');
```

---

## 2️⃣ REPLACE FILE: `js/sync.js`

Replace seluruh isi `js/sync.js` dengan:

```javascript
console.log('Loading sync.js...');

var SyncManager = {
    url: '',
    enabled: false,
    isSyncing: false,
    isLoadingFromCloud: false,
    syncQueue: [],
    isProcessingQueue: false
};

function initSyncModule() {
    console.log('Initializing sync module...');
    
    if (typeof CONFIG !== 'undefined' && CONFIG.APPS_SCRIPT_URL && CONFIG.APPS_SCRIPT_URL !== '') {
        SyncManager.url = CONFIG.APPS_SCRIPT_URL;
        SyncManager.enabled = true;
        updateSyncStatusUI('connected');
        console.log('Sync enabled with URL:', SyncManager.url);
        
        loadFromSpreadsheet();
    } else {
        updateSyncStatusUI('offline');
        console.log('Sync disabled - no URL configured');
    }
}

function updateSyncStatusUI(status) {
    var indicator = document.getElementById('syncStatusIndicator');
    var text = document.getElementById('syncStatusText');
    if (!indicator || !text) return;
    
    var states = {
        'connected': ['sync-indicator connected', 'Online'],
        'syncing': ['sync-indicator syncing', 'Syncing...'],
        'loading': ['sync-indicator syncing', 'Loading...'],
        'success': ['sync-indicator connected', 'Tersinkron'],
        'error': ['sync-indicator error', 'Error'],
        'offline': ['sync-indicator disconnected', 'Offline']
    };
    
    var state = states[status] || states['offline'];
    indicator.className = state[0];
    text.textContent = state[1];
}

function loadFromSpreadsheet() {
    if (!SyncManager.url || !SyncManager.enabled) {
        console.log('Sync not enabled, skipping load');
        return;
    }
    
    if (SyncManager.isLoadingFromCloud) {
        console.log('Already loading, skipping');
        return;
    }
    
    SyncManager.isLoadingFromCloud = true;
    updateSyncStatusUI('loading');
    
    var loadingOverlay = document.getElementById('loadingOverlay');
    var loadingText = document.getElementById('loadingText');
    if (loadingOverlay) loadingOverlay.style.display = 'flex';
    if (loadingText) loadingText.textContent = 'Mengambil data dari server...';
    
    var url = SyncManager.url + '?action=getAllData&t=' + Date.now();
    
    fetch(url)
        .then(function(response) {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(function(result) {
            console.log('Data received from spreadsheet:', result);
            
            if (result.success && result.data) {
                var rawData = {
                    inventaris: result.data.inventaris || [],
                    peminjaman: result.data.peminjaman || [],
                    kerusakan: result.data.kerusakan || [],
                    riwayat: result.data.riwayat || []
                };
                
                var normalizedData = normalizeAllData(rawData);
                console.log('Data normalized:', {
                    inventaris: normalizedData.inventaris.length,
                    peminjaman: normalizedData.peminjaman.length,
                    kerusakan: normalizedData.kerusakan.length,
                    riwayat: normalizedData.riwayat.length
                });
                
                var validatedData = validateDataConnections(normalizedData, true);
                var dataWasFixed = validatedData._wasModified;
                delete validatedData._wasModified;
                
                saveAllData(validatedData, true);
                console.log('Data saved to localStorage');
                
                if (dataWasFixed) {
                    console.log('Data was corrected, syncing fixes back to Spreadsheet...');
                    setTimeout(function() {
                        syncAllToSpreadsheet();
                    }, 500);
                }
                
                if (typeof loadAllData === 'function') loadAllData();
                if (typeof loadDashboardStats === 'function') loadDashboardStats();
                if (typeof initChart === 'function') initChart();
                
                updateSyncStatusUI('connected');
            } else {
                throw new Error('Invalid response format');
            }
        })
        .catch(function(error) {
            console.error('Load from spreadsheet failed:', error);
            updateSyncStatusUI('error');
            setTimeout(function() { updateSyncStatusUI('offline'); }, 3000);
        })
        .finally(function() {
            SyncManager.isLoadingFromCloud = false;
            if (loadingOverlay) loadingOverlay.style.display = 'none';
        });
}

function postDataToSpreadsheet(sheetName, rows) {
    return new Promise(function(resolve) {
        console.log('Syncing', sheetName, 'with', rows.length, 'rows');
        
        var iframe = document.createElement('iframe');
        iframe.name = 'sync_frame_' + Date.now();
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        
        var form = document.createElement('form');
        form.method = 'POST';
        form.action = SyncManager.url;
        form.target = iframe.name;
        form.style.display = 'none';
        
        var actionInput = document.createElement('input');
        actionInput.name = 'action';
        actionInput.value = 'clearAndInsert';
        form.appendChild(actionInput);
        
        var sheetInput = document.createElement('input');
        sheetInput.name = 'sheet';
        sheetInput.value = sheetName;
        form.appendChild(sheetInput);
        
        var rowsInput = document.createElement('input');
        rowsInput.name = 'rows';
        rowsInput.value = JSON.stringify(rows);
        form.appendChild(rowsInput);
        
        document.body.appendChild(form);
        form.submit();
        
        setTimeout(function() {
            form.remove();
            iframe.remove();
            console.log('POST completed for', sheetName);
            resolve(true);
        }, 3000);
    });
}

function syncAllToSpreadsheet() {
    console.log('Starting full sync to spreadsheet...');
    
    if (!SyncManager.enabled || !SyncManager.url) {
        if (typeof showToast === 'function') {
            showToast('URL Spreadsheet belum dikonfigurasi!', 'warning');
        } else {
            alert('URL Spreadsheet belum dikonfigurasi!');
        }
        return Promise.resolve(false);
    }
    
    if (SyncManager.isSyncing) {
        if (typeof showToast === 'function') {
            showToast('Sedang sync, mohon tunggu...', 'warning');
        }
        return Promise.resolve(false);
    }
    
    SyncManager.isSyncing = true;
    updateSyncStatusUI('syncing');
    
    var loadingOverlay = document.getElementById('loadingOverlay');
    var loadingText = document.getElementById('loadingText');
    if (loadingOverlay) loadingOverlay.style.display = 'flex';
    if (loadingText) loadingText.textContent = 'Menyimpan ke server...';
    
    var allData = getAllData();
    var total = allData.inventaris.length + allData.peminjaman.length + 
                allData.kerusakan.length + allData.riwayat.length;
    
    if (total === 0) {
        SyncManager.isSyncing = false;
        if (loadingOverlay) loadingOverlay.style.display = 'none';
        updateSyncStatusUI('connected');
        if (typeof showToast === 'function') {
            showToast('Tidak ada data untuk disync!', 'warning');
        }
        return Promise.resolve(false);
    }
    
    var syncPromises = [];
    syncPromises.push(postDataToSpreadsheet('Inventaris', allData.inventaris));
    syncPromises.push(postDataToSpreadsheet('Peminjaman', allData.peminjaman));
    syncPromises.push(postDataToSpreadsheet('Kerusakan', allData.kerusakan));
    syncPromises.push(postDataToSpreadsheet('Riwayat', allData.riwayat));
    
    return Promise.all(syncPromises)
        .then(function() {
            console.log('Full sync completed!');
            updateSyncStatusUI('success');
            
            if (typeof showToast === 'function') {
                showToast('Berhasil sync ' + total + ' data!');
            }
            
            setTimeout(function() { updateSyncStatusUI('connected'); }, 3000);
            return true;
        })
        .catch(function(error) {
            console.error('Sync error:', error);
            updateSyncStatusUI('error');
            
            if (typeof showToast === 'function') {
                showToast('Gagal sync: ' + error.message, 'error');
            }
            
            setTimeout(function() { updateSyncStatusUI('connected'); }, 3000);
            return false;
        })
        .finally(function() {
            SyncManager.isSyncing = false;
            if (loadingOverlay) loadingOverlay.style.display = 'none';
        });
}

function autoSyncData(key, data) {
    if (!SyncManager.enabled || !SyncManager.url || SyncManager.isLoadingFromCloud) {
        return;
    }
    
    var sheetMap = {
        'inventaris': 'Inventaris',
        'peminjaman': 'Peminjaman',
        'kerusakan': 'Kerusakan',
        'riwayat': 'Riwayat'
    };
    
    var sheetName = sheetMap[key];
    if (!sheetName) return;
    
    SyncManager.syncQueue.push({ sheetName: sheetName, data: data, key: key });
    
    if (!SyncManager.isProcessingQueue) {
        processSyncQueue();
    }
}

function processSyncQueue() {
    if (SyncManager.isProcessingQueue || SyncManager.syncQueue.length === 0) {
        return;
    }
    
    SyncManager.isProcessingQueue = true;
    updateSyncStatusUI('syncing');
    
    var processNext = function() {
        if (SyncManager.syncQueue.length === 0) {
            SyncManager.isProcessingQueue = false;
            updateSyncStatusUI('connected');
            return;
        }
        
        var latestBySheet = {};
        while (SyncManager.syncQueue.length > 0) {
            var item = SyncManager.syncQueue.shift();
            latestBySheet[item.sheetName] = item;
        }
        
        var sheets = Object.keys(latestBySheet);
        var syncOne = function(index) {
            if (index >= sheets.length) {
                console.log('Auto-sync batch completed');
                updateSyncStatusUI('success');
                setTimeout(function() {
                    updateSyncStatusUI('connected');
                    SyncManager.isProcessingQueue = false;
                }, 2000);
                return;
            }
            
            var sheetName = sheets[index];
            var item = latestBySheet[sheetName];
            console.log('Auto-sync:', sheetName, '(' + item.data.length + ' items)');
            
            postDataToSpreadsheet(sheetName, item.data).then(function() {
                syncOne(index + 1);
            });
        };
        
        syncOne(0);
    };
    
    processNext();
}

function refreshFromSpreadsheet() {
    if (confirm('Muat ulang data dari spreadsheet? Data lokal yang belum tersimpan akan hilang.')) {
        loadFromSpreadsheet();
    }
}

console.log('sync.js loaded successfully');
```

---

## 3️⃣ EDIT FILE: `js/app.js`

### 3.1 Hapus fungsi duplikat berikut (jika ada):
- `function getData(key)`
- `function setData(key, value)`
- `function generateId()`
- `function statusEquals()`
- `function statusNotEquals()`

Fungsi-fungsi ini sudah ada di `data.js`.

### 3.2 Ganti semua `SyncConfig` menjadi `SyncManager`:
- Cari: `SyncConfig`
- Ganti dengan: `SyncManager`

---

## 4️⃣ EDIT FILE: `index.html`

### 4.1 Update script tags (sebelum `</body>`):

Cari bagian script tags dan update menjadi:

```html
<!-- Scripts -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="js/config.js?v=14"></script>
<script src="js/data.js?v=14"></script>
<script src="js/sync.js?v=14"></script>
<script src="js/auth.js?v=14"></script>
<script src="js/app.js?v=14"></script>
<script>
document.addEventListener('DOMContentLoaded', function() {
    initSyncModule();
    var btnSync = document.getElementById('btnSyncNow');
    if (btnSync) {
        btnSync.onclick = syncAllToSpreadsheet;
    }
});
</script>
```

### 4.2 Hapus inline script yang panjang (jika ada):

Hapus kode inline yang berisi fungsi-fungsi seperti:
- `loadFromSpreadsheet()`
- `syncToSpreadsheet()`
- `normalizeData()`

Fungsi-fungsi ini sudah ada di `sync.js` dan `data.js`.

---

## 5️⃣ VERIFIKASI `js/config.js`

Pastikan format seperti ini:

```javascript
const CONFIG = {
    APPS_SCRIPT_URL: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
    ENABLE_SYNC: true,
    AUTO_SYNC: true,
    SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID',
    BASE_URL: window.location.origin + window.location.pathname,
    SHEETS: {
        INVENTARIS: 'Inventaris',
        PEMINJAMAN: 'Peminjaman',
        KERUSAKAN: 'Kerusakan',
        RIWAYAT: 'Riwayat',
        USERS: 'Users'
    }
};

function isSyncEnabled() {
    return CONFIG.ENABLE_SYNC && CONFIG.APPS_SCRIPT_URL && CONFIG.APPS_SCRIPT_URL !== '';
}
```

---

## ✅ POST-IMPLEMENTATION CHECKLIST

**WAJIB: Setelah selesai mengimplementasikan semua perubahan di atas, beritahu pengguna:**

```
✅ Update ke v14 selesai!

File yang diubah:
- js/data.js (BARU)
- js/sync.js (REPLACED)
- js/app.js (EDITED - hapus duplikat, fix SyncManager)
- index.html (EDITED - update script tags)

Langkah selanjutnya yang perlu Anda lakukan:

1. Hard refresh browser (Ctrl+Shift+R)
2. Buka console (F12 → Console) dan pastikan muncul:
   - "Loading data.js..."
   - "Loading sync.js..."
   - "data.js loaded successfully"
   - "sync.js loaded successfully"
3. Pastikan tidak ada error merah di console
4. Cek indikator sync di kanan atas menunjukkan "Online" (hijau)
5. Test buat peminjaman baru dan pastikan status laptop berubah ke "Dipinjam"

Jika ada error, copy paste error message dari console dan beritahu saya.
```

---

**Last Updated:** 2026-02-01
