// ==========================================
// DATA MANAGEMENT MODULE
// CRUD Operations + Data Normalization
// ==========================================

console.log('Loading data.js...');

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Capitalize first letter, lowercase the rest
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
function capitalizeStatus(str) {
    if (!str || typeof str !== 'string') return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Generate unique ID
 * @param {string} prefix - Optional prefix
 * @returns {string} Unique ID
 */
function generateId(prefix = 'ID') {
    return prefix + Date.now() + Math.random().toString(36).substr(2, 9);
}

/**
 * Case-insensitive status comparison
 * @param {string} actual - Actual status value
 * @param {string} expected - Expected status value
 * @returns {boolean} True if equal (case-insensitive)
 */
function statusEquals(actual, expected) {
    if (!actual || !expected) return false;
    return actual.toLowerCase() === expected.toLowerCase();
}

/**
 * Case-insensitive status not equal comparison
 * @param {string} actual - Actual status value
 * @param {string} expected - Expected status value
 * @returns {boolean} True if not equal (case-insensitive)
 */
function statusNotEquals(actual, expected) {
    if (!actual) return true;
    return actual.toLowerCase() !== expected.toLowerCase();
}

// ==========================================
// DATA NORMALIZATION FUNCTIONS
// Ensures consistent data format from Spreadsheet
// ==========================================

/**
 * Normalize inventaris data
 * @param {Object} item - Raw inventaris item from Spreadsheet
 * @returns {Object|null} Normalized inventaris object
 */
function normalizeInventaris(item) {
    if (!item) return null;
    
    // Get kondisi with fallback
    let kondisi = item.kondisi || item.condition || '';
    kondisi = capitalizeStatus(kondisi) || 'Baik';
    
    // Get status with fallback
    let status = item.status || '';
    status = capitalizeStatus(status) || 'Tersedia';
    
    return {
        id: item.id || generateId('INV'),
        kode: item.kode || item.id || 'N/A',
        nama: item.nama || item.name || 'Unknown',
        merk: item.merk || item.brand || '',
        spesifikasi: item.spesifikasi || item.specs || '',
        tahun: item.tahun || item.year || new Date().getFullYear(),
        kondisi: kondisi,
        status: status,
        tanggal: item.tanggal || item.createdAt || new Date().toISOString()
    };
}

/**
 * Normalize peminjaman data
 * @param {Object} item - Raw peminjaman item from Spreadsheet
 * @returns {Object|null} Normalized peminjaman object
 */
function normalizePeminjaman(item) {
    if (!item) return null;
    
    let status = item.status || '';
    status = capitalizeStatus(status) || 'Aktif';
    
    return {
        id: item.id || generateId('PEM'),
        nama: item.nama || item.peminjam || '',
        nip: item.nip || '',
        bagian: item.bagian || item.divisi || '',
        noHp: item.noHp || item.telepon || item.hp || '',
        laptopId: item.laptopId || '',
        laptopNama: item.laptopNama || '',
        laptopKode: item.laptopKode || '',
        tanggalPinjam: item.tanggalPinjam || item.tglPinjam || '',
        tanggalKembali: item.tanggalKembali || item.tglKembali || '',
        keperluan: item.keperluan || '',
        keterangan: item.keterangan || '',
        status: status,
        createdAt: item.createdAt || new Date().toISOString()
    };
}

/**
 * Normalize kerusakan data
 * @param {Object} item - Raw kerusakan item from Spreadsheet
 * @returns {Object|null} Normalized kerusakan object
 */
function normalizeKerusakan(item) {
    if (!item) return null;
    
    let status = item.status || '';
    status = capitalizeStatus(status) || 'Pending';
    
    return {
        id: item.id || generateId('KER'),
        laptopId: item.laptopId || '',
        laptopNama: item.laptopNama || '',
        laptopKode: item.laptopKode || '',
        dilaporkanOleh: item.dilaporkanOleh || item.pelapor || '',
        jenisKerusakan: item.jenisKerusakan || item.kerusakan || '',
        deskripsi: item.deskripsi || item.keterangan || '',
        foto: item.foto || '',
        status: status,
        createdAt: item.createdAt || new Date().toISOString()
    };
}

/**
 * Normalize riwayat data
 * @param {Object} item - Raw riwayat item from Spreadsheet
 * @returns {Object|null} Normalized riwayat object
 */
function normalizeRiwayat(item) {
    if (!item) return null;
    
    return {
        id: item.id || generateId('RIW'),
        nama: item.nama || '',
        nip: item.nip || '',
        bagian: item.bagian || '',
        noHp: item.noHp || '',
        laptopId: item.laptopId || '',
        laptopNama: item.laptopNama || '',
        laptopKode: item.laptopKode || '',
        tglPinjam: item.tglPinjam || item.tanggalPinjam || '',
        tglKembali: item.tglKembali || item.tanggalKembali || '',
        tglPengembalianAktual: item.tglPengembalianAktual || '',
        keperluan: item.keperluan || '',
        kondisiKembali: item.kondisiKembali || 'Baik',
        catatan: item.catatan || '',
        status: 'Selesai'
    };
}

/**
 * Normalize all data arrays
 * @param {Object} data - Object containing all data arrays
 * @returns {Object} Normalized data object
 */
function normalizeAllData(data) {
    const normalized = {
        inventaris: [],
        peminjaman: [],
        kerusakan: [],
        riwayat: []
    };
    
    if (data.inventaris && Array.isArray(data.inventaris)) {
        normalized.inventaris = data.inventaris
            .map(normalizeInventaris)
            .filter(item => item !== null);
    }
    
    if (data.peminjaman && Array.isArray(data.peminjaman)) {
        normalized.peminjaman = data.peminjaman
            .map(normalizePeminjaman)
            .filter(item => item !== null);
    }
    
    if (data.kerusakan && Array.isArray(data.kerusakan)) {
        normalized.kerusakan = data.kerusakan
            .map(normalizeKerusakan)
            .filter(item => item !== null);
    }
    
    if (data.riwayat && Array.isArray(data.riwayat)) {
        normalized.riwayat = data.riwayat
            .map(normalizeRiwayat)
            .filter(item => item !== null);
    }
    
    return normalized;
}

// ==========================================
// DATA VALIDATION & CONNECTION
// Ensures data integrity across features
// ==========================================

/**
 * Validate and fix data connections between features
 * @param {Object} data - Normalized data object
 * @param {boolean} cleanOrphans - If true, remove orphaned records (default: false)
 * @returns {Object} Validated data with fixed connections and wasModified flag
 */
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
                return !orphanedKerusakan.includes(k.id);
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

var syncDebounceTimers = {};

function setData(key, data, skipSync) {
    if (skipSync === undefined) skipSync = false;
    
    try {
        if (typeof CryptoManager !== 'undefined') {
            var encrypted = CryptoManager.encrypt(data);
            localStorage.setItem(key, encrypted);
            localStorage.setItem(key + '_encrypted', 'true');
        } else {
            localStorage.setItem(key, JSON.stringify(data));
        }
        
        if (!skipSync && typeof autoSyncData === 'function') {
            if (syncDebounceTimers[key]) clearTimeout(syncDebounceTimers[key]);
            syncDebounceTimers[key] = setTimeout(function() {
                autoSyncData(key, data);
            }, 1500);
        }
    } catch (e) {
        console.error('Error setting data for key:', key, e);
    }
}

/**
 * Add item to data array
 * @param {string} key - Storage key
 * @param {Object} item - Item to add
 * @returns {Object} Added item with ID
 */
function addData(key, item) {
    const data = getData(key);
    
    // Ensure item has ID
    if (!item.id) {
        const prefixMap = {
            'inventaris': 'INV',
            'peminjaman': 'PEM',
            'kerusakan': 'KER',
            'riwayat': 'RIW'
        };
        item.id = generateId(prefixMap[key] || 'ID');
    }
    
    data.push(item);
    setData(key, data);
    
    return item;
}

/**
 * Update item in data array
 * @param {string} key - Storage key
 * @param {string} id - Item ID to update
 * @param {Object} updates - Fields to update
 * @returns {Object|null} Updated item or null if not found
 */
function updateData(key, id, updates) {
    const data = getData(key);
    const index = data.findIndex(item => item.id === id);
    
    if (index === -1) {
        console.warn('Item not found:', key, id);
        return null;
    }
    
    data[index] = { ...data[index], ...updates };
    setData(key, data);
    
    return data[index];
}

/**
 * Delete item from data array
 * @param {string} key - Storage key
 * @param {string} id - Item ID to delete
 * @returns {boolean} True if deleted
 */
function deleteData(key, id) {
    const data = getData(key);
    const index = data.findIndex(item => item.id === id);
    
    if (index === -1) {
        console.warn('Item not found:', key, id);
        return false;
    }
    
    data.splice(index, 1);
    setData(key, data);
    
    return true;
}

/**
 * Find item by ID
 * @param {string} key - Storage key
 * @param {string} id - Item ID
 * @returns {Object|null} Found item or null
 */
function findById(key, id) {
    const data = getData(key);
    return data.find(item => item.id === id) || null;
}

/**
 * Find items by field value
 * @param {string} key - Storage key
 * @param {string} field - Field name
 * @param {*} value - Value to match
 * @returns {Array} Matching items
 */
function findByField(key, field, value) {
    const data = getData(key);
    return data.filter(item => item[field] === value);
}

/**
 * Save all data to localStorage
 * @param {Object} allData - Object with all data arrays
 * @param {boolean} skipSync - Skip auto-sync
 */
function saveAllData(allData, skipSync = false) {
    if (allData.inventaris) setData('inventaris', allData.inventaris, skipSync);
    if (allData.peminjaman) setData('peminjaman', allData.peminjaman, skipSync);
    if (allData.kerusakan) setData('kerusakan', allData.kerusakan, skipSync);
    if (allData.riwayat) setData('riwayat', allData.riwayat, skipSync);
}

/**
 * Get all data from localStorage
 * @returns {Object} Object with all data arrays
 */
function getAllData() {
    return {
        inventaris: getData('inventaris'),
        peminjaman: getData('peminjaman'),
        kerusakan: getData('kerusakan'),
        riwayat: getData('riwayat')
    };
}

/**
 * Clear all data from localStorage
 */
function clearAllData() {
    localStorage.removeItem('inventaris');
    localStorage.removeItem('peminjaman');
    localStorage.removeItem('kerusakan');
    localStorage.removeItem('riwayat');
    console.log('All data cleared from localStorage');
}

// ==========================================
// EXPORT CHECK
// ==========================================

console.log('data.js loaded successfully:', {
    helpers: ['capitalizeStatus', 'generateId', 'statusEquals', 'statusNotEquals'],
    normalizers: ['normalizeInventaris', 'normalizePeminjaman', 'normalizeKerusakan', 'normalizeRiwayat', 'normalizeAllData'],
    validators: ['validateDataConnections'],
    crud: ['getData', 'setData', 'addData', 'updateData', 'deleteData', 'findById', 'findByField', 'saveAllData', 'getAllData', 'clearAllData']
});
