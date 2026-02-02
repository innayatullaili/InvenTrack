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
