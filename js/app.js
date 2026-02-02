// ==========================================
// SISTEM PENDATAAN INVENTARIS - MAIN APP
// ==========================================

// ==========================================
// GLOBAL ERROR HANDLERS
// ==========================================

// Catch all unhandled errors
window.addEventListener('error', function(event) {
    console.error('❌ Global Error:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
    });
    
    // Show user-friendly message
    if (typeof showToast === 'function') {
        const errorMsg = event.error?.message || event.message || 'Terjadi kesalahan';
        showToast('Terjadi kesalahan: ' + errorMsg, 'error');
    }
    
    // Prevent default browser error handling
    event.preventDefault();
    
    return true;
});

// Catch all unhandled promise rejections
window.addEventListener('unhandledrejection', function(event) {
    console.error('❌ Unhandled Promise Rejection:', {
        reason: event.reason,
        promise: event.promise
    });
    
    // Show user-friendly message
    if (typeof showToast === 'function') {
        const errorMsg = event.reason?.message || event.reason || 'Operasi async gagal';
        showToast('Terjadi kesalahan async: ' + errorMsg, 'error');
    }
    
    // Prevent default browser error handling
    event.preventDefault();
    
    return true;
});

// Console error wrapper for better error tracking
if (typeof console !== 'undefined' && console.error) {
    const originalError = console.error;
    console.error = function(...args) {
        // Log to original console.error
        originalError.apply(console, args);
        
        // Track critical errors (optional: could send to analytics)
        if (args[0] && typeof args[0] === 'string' && args[0].includes('❌')) {
            // This is a critical error - could be sent to error tracking service
            // Example: sendToErrorTracking(args);
        }
    };
}

console.log('✅ Global error handlers initialized');

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    try {
        setTimeout(() => {
            initializeApp().catch(error => {
                console.error('❌ App initialization failed:', error);
                if (typeof showToast === 'function') {
                    showToast('Gagal menginisialisasi aplikasi: ' + error.message, 'error');
                }
            });
        }, 150);
    } catch (error) {
        console.error('❌ DOMContentLoaded error:', error);
        if (typeof showToast === 'function') {
            showToast('Gagal memuat aplikasi: ' + error.message, 'error');
        }
    }
});

async function initializeApp() {
    try {
        console.log('Initializing app...');
    
    if (typeof CryptoManager !== 'undefined') {
        CryptoManager.migrateToEncrypted();
    }
    
    if (typeof initAuth === 'function' && !localStorage.getItem('currentUser')) {
        console.log('No user found, initializing auth...');
        await initAuth();
    }
    
    const user = localStorage.getItem('currentUser');
    console.log('Current user:', user);
    
    setTimeout(() => {
        CSRF.injectTokenToForms();
    }, 100);
    
    if (typeof initSync === 'function') {
        initSync();
    }
    
    // Set current date
    setCurrentDate();
    
    // Initialize navigation
    initNavigation();
    
    // Initialize forms
    initForms();
    
    // Initialize search and filters
    initSearchAndFilters();
    
    // Load data from Spreadsheet first (if sync enabled)
    if (typeof loadDataFromSpreadsheet === 'function' && typeof SyncManager !== 'undefined' && SyncManager.enabled) {
        loadDataFromSpreadsheet().then(() => {
            loadAllData();
            initChart();
        });
    } else {
        loadAllData();
        initChart();
    }
    
    // Set min date for date inputs
    setMinDates();
    
    initNotifications();
    
    updateNotificationBadge();
    
    if (typeof autoFillUserInfo === 'function') {
        autoFillUserInfo();
    }
    
    initSyncButton();
    
    console.log('✅ App initialized successfully');
    
    } catch (error) {
        console.error('❌ initializeApp error:', error);
        if (typeof showToast === 'function') {
            showToast('Gagal menginisialisasi aplikasi: ' + error.message, 'error');
        }
        throw error;
    }
}

// ==========================================
// SYNC BUTTON
// ==========================================
function initSyncButton() {
    try {
        const btnSyncNow = document.getElementById('btnSyncNow');
        if (btnSyncNow) {
            btnSyncNow.addEventListener('click', function() {
                try {
                    console.log('Sync button clicked');
                    if (typeof syncAllToSpreadsheet === 'function') {
                        syncAllToSpreadsheet();
                    } else {
                        showToast('Fungsi sync tidak tersedia', 'error');
                        console.error('syncAllToSpreadsheet function not found');
                    }
                } catch (error) {
                    console.error('❌ Sync button click error:', error);
                    showToast('Gagal melakukan sync: ' + error.message, 'error');
                }
            });
            console.log('Sync button initialized');
        } else {
            console.warn('Sync button not found');
        }
    } catch (error) {
        console.error('❌ initSyncButton error:', error);
    }
}

// ==========================================
// DATE & TIME
// ==========================================
function setCurrentDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date().toLocaleDateString('id-ID', options);
    const element = safeGetElement('currentDate');
    if (element) {
        element.textContent = today;
    }
}

function setMinDates() {
    const today = new Date().toISOString().split('T')[0];
    const tglPinjam = safeGetElement('tglPinjam');
    const tglKembali = safeGetElement('tglKembali');
    
    if (tglPinjam) tglPinjam.min = today;
    if (tglKembali) tglKembali.min = today;
    
    if (tglPinjam && tglKembali) {
        tglPinjam.addEventListener('change', function() {
            tglKembali.min = this.value;
        });
    }
}

function formatDate(dateString) {
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
}

function formatDateTime(dateString) {
    const options = { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('id-ID', options);
}

// ==========================================
// NAVIGATION
// ==========================================
function initNavigation() {
    try {
        const navItems = document.querySelectorAll('.nav-item');
        const sidebar = safeGetElement('sidebar');
        const toggleBtn = safeGetElement('toggleSidebar');
        const overlay = safeGetElement('sidebarOverlay');
        
        navItems.forEach(item => {
            item.addEventListener('click', function(e) {
                try {
                    const page = this.dataset.page;
                    if (page) {
                        showPage(page);
                        
                        navItems.forEach(nav => nav.classList.remove('active'));
                        this.classList.add('active');
                        
                        if (window.innerWidth <= 992 && sidebar) {
                            sidebar.classList.remove('active');
                            if (overlay) overlay.classList.remove('active');
                        }
                    }
                } catch (error) {
                    console.error('❌ Navigation click error:', error);
                    showToast('Gagal navigasi ke halaman', 'error');
                }
            });
        });
        
        if (toggleBtn) {
            toggleBtn.addEventListener('click', function() {
                try {
                    toggleSidebar();
                } catch (error) {
                    console.error('❌ Toggle sidebar error:', error);
                }
            });
        }
    } catch (error) {
        console.error('❌ initNavigation error:', error);
    }
}

// Global toggle sidebar function
function toggleSidebar() {
    const sidebar = safeGetElement('sidebar');
    const overlay = safeGetElement('sidebarOverlay');
    
    if (!sidebar) return;
    
    if (window.innerWidth <= 992) {
        sidebar.classList.toggle('active');
        if (overlay) overlay.classList.toggle('active');
    } else {
        sidebar.classList.toggle('collapsed');
    }
}

function cleanupCurrentPage() {
    try {
        if (window.syncDebounce) {
            clearTimeout(window.syncDebounce);
            window.syncDebounce = null;
        }
        
        if (window.autoRefreshInterval) {
            clearInterval(window.autoRefreshInterval);
            window.autoRefreshInterval = null;
        }
        
        if (window.currentFetchController) {
            window.currentFetchController.abort();
            window.currentFetchController = null;
        }
    } catch (error) {
        console.error('❌ cleanupCurrentPage error:', error);
    }
}

function showPage(pageName) {
    if (!pageName) {
        console.warn('showPage called with empty pageName');
        return;
    }
    
    cleanupCurrentPage();
    
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    const selectedPage = safeGetElement(pageName + 'Page');
    if (selectedPage) {
        selectedPage.classList.add('active');
    }
    
    const titles = {
        'dashboard': 'Dashboard',
        'peminjaman': 'Form Peminjaman',
        'pengembalian': 'Pengembalian',
        'inventaris': 'Daftar Inventaris',
        'kerusakan': 'Laporan Kerusakan',
        'riwayat': 'Riwayat Peminjaman'
    };
    
    const pageTitle = safeGetElement('pageTitle');
    if (pageTitle) {
        pageTitle.textContent = titles[pageName] || 'Dashboard';
    }
    
    if (pageName === 'peminjaman') {
        loadAvailableLaptops();
        loadPeminjamanTable();
        if (typeof autoFillUserInfo === 'function') autoFillUserInfo();
    } else if (pageName === 'pengembalian') {
        loadActivePeminjaman();
    } else if (pageName === 'inventaris') {
        if (typeof checkAccess === 'function' && !checkAccess('admin')) {
            showPage('dashboard');
            return;
        }
        loadInventarisTable();
    } else if (pageName === 'kerusakan') {
        loadKerusakanTable();
        loadLaptopsForKerusakan();
        if (typeof autoFillUserInfo === 'function') autoFillUserInfo();
    } else if (pageName === 'riwayat') {
        if (typeof checkAccess === 'function' && !checkAccess('admin')) {
            showPage('dashboard');
            return;
        }
        loadRiwayatTable();
    } else if (pageName === 'users') {
        if (typeof checkAccess === 'function' && !checkAccess('admin')) {
            showPage('dashboard');
            return;
        }
        if (typeof loadUsersTable === 'function') loadUsersTable();
        if (typeof loadBackupsTable === 'function') loadBackupsTable();
    }
}

function safeGetElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`Element not found: ${id}`);
    }
    return element;
}

function safeQuerySelector(selector) {
    const element = document.querySelector(selector);
    if (!element) {
        console.warn(`Element not found: ${selector}`);
    }
    return element;
}

function sanitizeHTML(html) {
    if (typeof DOMPurify !== 'undefined') {
        return DOMPurify.sanitize(html, {
            ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'span', 'div', 'br', 'small'],
            ALLOWED_ATTR: ['class', 'style']
        });
    }
    return String(html).replace(/[<>'"]/g, '');
}

const CSRF = {
    generateToken: () => 'csrf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 16),
    
    setToken: () => {
        const token = CSRF.generateToken();
        sessionStorage.setItem('csrf_token', token);
        return token;
    },
    
    getToken: () => sessionStorage.getItem('csrf_token'),
    
    validateToken: (submittedToken) => {
        const storedToken = CSRF.getToken();
        if (!storedToken || submittedToken !== storedToken) {
            throw new Error('Invalid CSRF token - possible CSRF attack detected');
        }
        return true;
    },
    
    injectTokenToForms: () => {
        document.querySelectorAll('form').forEach(form => {
            let tokenInput = form.querySelector('input[name="csrf_token"]');
            if (!tokenInput) {
                tokenInput = document.createElement('input');
                tokenInput.type = 'hidden';
                tokenInput.name = 'csrf_token';
                form.appendChild(tokenInput);
            }
            tokenInput.value = CSRF.getToken();
        });
    },
    
    refreshToken: () => {
        CSRF.setToken();
        CSRF.injectTokenToForms();
    }
};

CSRF.setToken();

// Convert file to base64
function convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Preview foto kerusakan
function previewFotoKerusakan(input) {
    const preview = document.getElementById('previewFotoKerusakan');
    const previewImg = document.getElementById('previewImg');
    
    if (input.files && input.files[0]) {
        const file = input.files[0];
        
        // Check file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            showToast('Ukuran foto maksimal 2MB!', 'error');
            input.value = '';
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImg.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

// Remove foto preview
function removeFotoPreview() {
    const preview = document.getElementById('previewFotoKerusakan');
    const previewImg = document.getElementById('previewImg');
    const input = document.getElementById('fotoKerusakan');
    
    previewImg.src = '';
    preview.style.display = 'none';
    input.value = '';
}

// Show foto modal
function showFotoModal(fotoSrc) {
    // Create modal if not exists
    let modal = document.getElementById('fotoModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'fotoModal';
        modal.className = 'foto-modal';
        modal.innerHTML = `
            <div class="foto-modal-content">
                <button class="foto-modal-close" onclick="closeFotoModal()">&times;</button>
                <img id="fotoModalImg" src="" alt="Foto Kerusakan">
            </div>
        `;
        document.body.appendChild(modal);
        
        // Close on click outside
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeFotoModal();
            }
        });
    }
    
    document.getElementById('fotoModalImg').src = fotoSrc;
    modal.style.display = 'flex';
}

// Close foto modal
function closeFotoModal() {
    const modal = document.getElementById('fotoModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Helper: Get tanggal pinjam (backward compatible)
function getTglPinjam(p) {
    return p.tanggalPinjam || p.tglPinjam || '';
}

// Helper: Get tanggal kembali (backward compatible)
function getTglKembali(p) {
    return p.tanggalKembali || p.tglKembali || '';
}

// Initialize sample data if empty
// Data sample dihapus - aplikasi mulai dengan data kosong
// Data akan diambil dari Google Spreadsheet jika sync aktif
function initSampleData() {
    // Tidak ada data sample - aplikasi mulai kosong
    // Data inventaris dan peminjaman akan diinput oleh user
    // atau diambil dari Google Spreadsheet
}

// ==========================================
// LOAD ALL DATA
// ==========================================
function loadAllData() {
    initSampleData();
    loadDashboardStats();
    loadRecentActivity();
    loadActiveLoanTable();
}

// ==========================================
// DASHBOARD
// ==========================================
function loadDashboardStats() {
    const inventaris = getData('inventaris');
    let peminjaman = getData('peminjaman').filter(p => p && statusEquals(p.status, 'Aktif'));
    const kerusakan = getData('kerusakan').filter(k => k && statusNotEquals(k.status, 'Selesai'));
    
    if (typeof isUser === 'function' && isUser() && currentUser) {
        const myPeminjaman = peminjaman.filter(p => 
            p && p.nama && p.nip && currentUser.name && currentUser.nip &&
            (p.nama.toLowerCase() === currentUser.name.toLowerCase() ||
            p.nip === currentUser.nip)
        );
        
        const totalElement = safeGetElement('totalLaptop');
        const tersediaElement = safeGetElement('tersedia');
        const dipinjamElement = safeGetElement('dipinjam');
        const rusakElement = safeGetElement('rusak');
        
        if (totalElement) totalElement.textContent = inventaris.length;
        if (tersediaElement) tersediaElement.textContent = inventaris.filter(i => i && statusEquals(i.status, 'Tersedia')).length;
        if (dipinjamElement) dipinjamElement.textContent = myPeminjaman.length;
        if (rusakElement) rusakElement.textContent = inventaris.filter(i => i && statusNotEquals(i.kondisi, 'Baik')).length;
        
        const dipinjamLabel = safeQuerySelector('#dipinjam + p, #dipinjam');
        const dipinjamInfo = dipinjamLabel ? dipinjamLabel.closest('.stat-info') : null;
        const labelElement = dipinjamInfo ? dipinjamInfo.querySelector('p') : null;
        if (labelElement) labelElement.textContent = 'Pinjaman Saya';
    } else {
        const total = inventaris.length;
        const tersedia = inventaris.filter(i => i && statusEquals(i.status, 'Tersedia')).length;
        const dipinjam = inventaris.filter(i => i && statusEquals(i.status, 'Dipinjam')).length;
        const rusak = inventaris.filter(i => i && statusNotEquals(i.kondisi, 'Baik')).length;
        
        const totalElement = safeGetElement('totalLaptop');
        const tersediaElement = safeGetElement('tersedia');
        const dipinjamElement = safeGetElement('dipinjam');
        const rusakElement = safeGetElement('rusak');
        
        if (totalElement) totalElement.textContent = total;
        if (tersediaElement) tersediaElement.textContent = tersedia;
        if (dipinjamElement) dipinjamElement.textContent = dipinjam;
        if (rusakElement) rusakElement.textContent = rusak;
    }
}

function loadRecentActivity() {
    const activityList = safeGetElement('activityList');
    if (!activityList) return;
    
    const peminjaman = getData('peminjaman');
    const kerusakan = getData('kerusakan');
    const riwayat = getData('riwayat');
    
    let activities = [];
    
    peminjaman.forEach(p => {
        if (p && p.nama && p.laptopNama && p.createdAt) {
            activities.push({
                type: 'pinjam',
                icon: 'fas fa-hand-holding',
                text: `<strong>${sanitizeHTML(p.nama)}</strong> meminjam <strong>${sanitizeHTML(p.laptopNama)}</strong>`,
                date: p.createdAt
            });
        }
    });
    
    riwayat.slice(-5).forEach(r => {
        if (r && r.nama && r.laptopNama && r.tglPengembalianAktual) {
            activities.push({
                type: 'kembali',
                icon: 'fas fa-undo',
                text: `<strong>${sanitizeHTML(r.nama)}</strong> mengembalikan <strong>${sanitizeHTML(r.laptopNama)}</strong>`,
                date: r.tglPengembalianAktual
            });
        }
    });
    
    kerusakan.forEach(k => {
        if (k && k.laptopNama && k.createdAt) {
            activities.push({
                type: 'rusak',
                icon: 'fas fa-exclamation-triangle',
                text: `Kerusakan dilaporkan pada <strong>${sanitizeHTML(k.laptopNama)}</strong>`,
                date: k.createdAt
            });
        }
    });
    
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));
    activities = activities.slice(0, 5);
    
    if (activities.length === 0) {
        activityList.innerHTML = '<li class="text-center" style="padding: 20px; color: var(--text-secondary);">Belum ada aktivitas</li>';
        return;
    }
    
    activityList.innerHTML = activities.map(a => `
        <li class="activity-item">
            <div class="activity-icon ${a.type}">
                <i class="${a.icon}"></i>
            </div>
            <div class="activity-content">
                <p>${a.text}</p>
                <span>${formatDateTime(a.date)}</span>
            </div>
        </li>
    `).join('');
}

function loadActiveLoanTable() {
    let peminjaman = getData('peminjaman').filter(p => statusEquals(p.status, 'Aktif'));
    const tbody = document.querySelector('#activeLoanTable tbody');
    
    if (!tbody) return;
    
    // Guest and Admin can see all active loans
    // Regular logged-in users only see their own loans
    if (typeof isUser === 'function' && typeof isGuest === 'function' && isUser() && !isGuest() && currentUser) {
        peminjaman = peminjaman.filter(p => 
            p.nama.toLowerCase() === currentUser.name.toLowerCase() ||
            p.nip === currentUser.nip
        );
    }
    
    if (peminjaman.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="padding: 30px; color: var(--text-secondary);">Tidak ada peminjaman aktif</td></tr>';
        return;
    }
    
    tbody.innerHTML = peminjaman.slice(0, 5).map(p => {
        const today = new Date();
        const tglKembali = new Date(getTglKembali(p));
        const isLate = today > tglKembali;
        const statusClass = isLate ? 'terlambat' : 'aktif';
        const statusText = isLate ? 'Terlambat' : 'Aktif';
        
        return `
            <tr>
                <td>${sanitizeHTML(p.nama)}</td>
                <td>${sanitizeHTML(p.laptopNama)}</td>
                <td>${formatDate(getTglPinjam(p))}</td>
                <td>${formatDate(getTglKembali(p))}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            </tr>
        `;
    }).join('');
}

// ==========================================
// CHART
// ==========================================
let statusChart = null;

function initChart() {
    const ctx = document.getElementById('statusChart');
    if (!ctx) return;
    
    const inventaris = getData('inventaris');
    const tersedia = inventaris.filter(i => statusEquals(i.status, 'Tersedia') && statusEquals(i.kondisi, 'Baik')).length;
    const dipinjam = inventaris.filter(i => statusEquals(i.status, 'Dipinjam')).length;
    const rusak = inventaris.filter(i => statusNotEquals(i.kondisi, 'Baik')).length;
    
    if (statusChart) {
        statusChart.destroy();
    }
    
    statusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Tersedia', 'Dipinjam', 'Perlu Perbaikan'],
            datasets: [{
                data: [tersedia, dipinjam, rusak],
                backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                }
            },
            cutout: '70%'
        }
    });
}

// ==========================================
// FORMS
// ==========================================
function initForms() {
    try {
        const formPeminjaman = document.getElementById('formPeminjaman');
        if (formPeminjaman) {
            formPeminjaman.addEventListener('submit', async function(e) {
                try {
                    await handlePeminjaman(e);
                } catch (error) {
                    console.error('❌ handlePeminjaman error:', error);
                    showToast('Gagal menyimpan peminjaman: ' + error.message, 'error');
                    hideLoading();
                }
            });
        }
        
        const formPengembalian = document.getElementById('formPengembalian');
        if (formPengembalian) {
            formPengembalian.addEventListener('submit', async function(e) {
                try {
                    await handlePengembalian(e);
                } catch (error) {
                    console.error('❌ handlePengembalian error:', error);
                    showToast('Gagal menyimpan pengembalian: ' + error.message, 'error');
                    hideLoading();
                }
            });
        }
        
        const formTambahInventaris = document.getElementById('formTambahInventaris');
        if (formTambahInventaris) {
            formTambahInventaris.addEventListener('submit', async function(e) {
                try {
                    await handleTambahInventaris(e);
                } catch (error) {
                    console.error('❌ handleTambahInventaris error:', error);
                    showToast('Gagal menyimpan inventaris: ' + error.message, 'error');
                    hideLoading();
                }
            });
        }
        
        const formLaporKerusakan = document.getElementById('formLaporKerusakan');
        if (formLaporKerusakan) {
            formLaporKerusakan.addEventListener('submit', async function(e) {
                try {
                    await handleLaporKerusakan(e);
                } catch (error) {
                    console.error('❌ handleLaporKerusakan error:', error);
                    showToast('Gagal melaporkan kerusakan: ' + error.message, 'error');
                    hideLoading();
                }
            });
        }
        
        const kondisiKembali = document.getElementById('kondisiKembali');
        if (kondisiKembali) {
            kondisiKembali.addEventListener('change', function() {
                try {
                    const kerusakanGroup = document.getElementById('kerusakanGroup');
                    if (this.value === 'Rusak Ringan' || this.value === 'Rusak Berat') {
                        kerusakanGroup.style.display = 'block';
                    } else {
                        kerusakanGroup.style.display = 'none';
                    }
                } catch (error) {
                    console.error('❌ kondisiKembali change error:', error);
                }
            });
        }
        
        const selectPeminjaman = document.getElementById('selectPeminjaman');
        if (selectPeminjaman) {
            selectPeminjaman.addEventListener('change', function() {
                try {
                    showPeminjamanDetail(this.value);
                } catch (error) {
                    console.error('❌ selectPeminjaman change error:', error);
                    showToast('Gagal menampilkan detail peminjaman', 'error');
                }
            });
        }
    } catch (error) {
        console.error('❌ initForms error:', error);
    }
}

// ==========================================
// PEMINJAMAN
// ==========================================
function loadAvailableLaptops() {
    const inventaris = getData('inventaris').filter(i => statusEquals(i.status, 'Tersedia'));
    const select = document.getElementById('laptopPinjam');
    
    if (!select) return;
    
    select.innerHTML = '<option value="">Pilih Laptop</option>' + 
        inventaris.map(i => `<option value="${i.id}">${i.kode || i.id} - ${i.nama}</option>`).join('');
}

function loadPeminjamanTable() {
    let peminjaman = getData('peminjaman');
    const tbody = document.getElementById('peminjamanTableBody');
    
    if (!tbody) return;
    
    // Guest and Admin can see all peminjaman
    // Regular logged-in users only see their own peminjaman
    if (typeof isUser === 'function' && typeof isGuest === 'function' && isUser() && !isGuest() && currentUser) {
        peminjaman = peminjaman.filter(p => 
            p.nama.toLowerCase() === currentUser.name.toLowerCase() ||
            p.nip === currentUser.nip
        );
    }
    
    if (peminjaman.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center" style="padding: 30px; color: var(--text-secondary);">Tidak ada data peminjaman</td></tr>';
        return;
    }
    
    tbody.innerHTML = peminjaman.map((p, index) => {
        const today = new Date();
        const tglKembali = new Date(getTglKembali(p));
        const isLate = today > tglKembali && p.status === 'Aktif';
        const statusClass = p.status === 'Selesai' ? 'selesai' : (isLate ? 'terlambat' : 'aktif');
        const statusText = p.status === 'Selesai' ? 'Selesai' : (isLate ? 'Terlambat' : 'Aktif');
        
        return `
            <tr>
                <td>${index + 1}</td>
                <td>${sanitizeHTML(p.nama)}</td>
                <td>${sanitizeHTML(p.laptopNama)}</td>
                <td>${formatDate(getTglPinjam(p))}</td>
                <td>${formatDate(getTglKembali(p))}</td>
                <td>${sanitizeHTML(p.keperluan)}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    ${p.status === 'Aktif' ? `
                        <button class="btn btn-sm btn-primary" onclick="quickReturn('${p.id}')">
                            <i class="fas fa-undo"></i>
                        </button>
                    ` : '-'}
                </td>
            </tr>
        `;
    }).join('');
}

function handlePeminjaman(e) {
    e.preventDefault();
    console.log('Form peminjaman submitted!');
    
    try {
        const csrfToken = e.target.querySelector('input[name="csrf_token"]')?.value;
        CSRF.validateToken(csrfToken);
    } catch (error) {
        showToast(error.message, 'error');
        return;
    }
    
    showLoading();
    
    const laptopIdElement = safeGetElement('laptopPinjam');
    const laptopId = laptopIdElement ? laptopIdElement.value : null;
    
    if (!laptopId) {
        hideLoading();
        showToast('Pilih laptop terlebih dahulu!', 'error');
        return;
    }
    
    const inventaris = getData('inventaris');
    const laptop = inventaris.find(i => i && i.id === laptopId);
    
    if (!laptop) {
        hideLoading();
        showToast('Laptop tidak ditemukan! Pastikan pilih laptop.', 'error');
        return;
    }
    
    const namaPeminjamElement = safeGetElement('namaPeminjam');
    const nipElement = safeGetElement('nip');
    const bagianElement = safeGetElement('bagian');
    const noHpElement = safeGetElement('noHp');
    const tglPinjamElement = safeGetElement('tglPinjam');
    const tglKembaliElement = safeGetElement('tglKembali');
    const keperluanElement = safeGetElement('keperluan');
    const keteranganElement = safeGetElement('keterangan');
    
    if (!namaPeminjamElement || !nipElement || !bagianElement || !noHpElement || 
        !tglPinjamElement || !tglKembaliElement || !keperluanElement) {
        hideLoading();
        showToast('Form tidak lengkap!', 'error');
        return;
    }
    
    const peminjaman = {
        id: generateId(),
        nama: namaPeminjamElement.value,
        nip: nipElement.value,
        bagian: bagianElement.value,
        noHp: noHpElement.value,
        laptopId: laptopId,
        laptopNama: laptop.nama,
        laptopKode: laptop.kode,
        tanggalPinjam: tglPinjamElement.value,
        tanggalKembali: tglKembaliElement.value,
        keperluan: keperluanElement.value,
        keterangan: keteranganElement ? keteranganElement.value : '',
        status: 'Aktif',
        createdAt: new Date().toISOString()
    };
    
    const peminjamanList = getData('peminjaman');
    peminjamanList.push(peminjaman);
    setData('peminjaman', peminjamanList);
    
    laptop.status = 'Dipinjam';
    setData('inventaris', inventaris);
    
    setTimeout(() => {
        hideLoading();
        showToast('Peminjaman berhasil dicatat!');
        const form = safeGetElement('formPeminjaman');
        if (form) form.reset();
        loadAllData();
        loadPeminjamanTable();
        loadAvailableLaptops();
        initChart();
    }, 500);
}

async function quickReturn(peminjamanId) {
    const confirmed = await showConfirm('Proses pengembalian laptop ini?', 'Konfirmasi Pengembalian');
    if (confirmed) {
        try {
            const peminjaman = getData('peminjaman');
            const pinjam = peminjaman.find(p => p.id === peminjamanId);
            
            if (pinjam) {
                const riwayat = getData('riwayat');
                riwayat.push({
                    ...pinjam,
                    status: 'Selesai',
                    kondisiKembali: 'Baik',
                    tglPengembalianAktual: new Date().toISOString()
            });
            setData('riwayat', riwayat);
            
            const updatedPeminjaman = peminjaman.filter(p => p.id !== peminjamanId);
            setData('peminjaman', updatedPeminjaman);
            
            const inventaris = getData('inventaris');
            const laptop = inventaris.find(i => i.id === pinjam.laptopId);
            if (laptop) {
                laptop.status = 'Tersedia';
                setData('inventaris', inventaris);
            }
            
            showToast('Pengembalian berhasil dicatat!');
            loadAllData();
            loadPeminjamanTable();
            initChart();
            }
        } catch (error) {
            console.error('❌ quickReturn error:', error);
            showToast('Gagal memproses pengembalian: ' + error.message, 'error');
        }
    }
}

// ==========================================
// PENGEMBALIAN
// ==========================================
function loadActivePeminjaman() {
    let peminjaman = getData('peminjaman').filter(p => statusEquals(p.status, 'Aktif'));
    const select = document.getElementById('selectPeminjaman');
    
    if (!select) return;
    
    // If user (not admin), only show their own peminjaman
    if (typeof isUser === 'function' && isUser() && currentUser) {
        peminjaman = peminjaman.filter(p => 
            p.nama.toLowerCase() === currentUser.name.toLowerCase() ||
            p.nip === currentUser.nip
        );
    }
    
    select.innerHTML = '<option value="">Pilih peminjaman yang akan dikembalikan</option>' + 
        peminjaman.map(p => `<option value="${p.id}">${p.nama} - ${p.laptopNama} (${p.laptopKode})</option>`).join('');
}

function showPeminjamanDetail(peminjamanId) {
    const detailBox = document.getElementById('detailPeminjaman');
    
    if (!peminjamanId) {
        detailBox.style.display = 'none';
        return;
    }
    
    const peminjaman = getData('peminjaman').find(p => p.id === peminjamanId);
    
    if (peminjaman) {
        document.getElementById('detailNama').textContent = peminjaman.nama;
        document.getElementById('detailLaptop').textContent = `${peminjaman.laptopKode} - ${peminjaman.laptopNama}`;
        document.getElementById('detailTglPinjam').textContent = formatDate(getTglPinjam(peminjaman));
        document.getElementById('detailTglKembali').textContent = formatDate(getTglKembali(peminjaman));
        detailBox.style.display = 'block';
    }
}

function handlePengembalian(e) {
    e.preventDefault();
    
    try {
        const csrfToken = e.target.querySelector('input[name="csrf_token"]')?.value;
        CSRF.validateToken(csrfToken);
    } catch (error) {
        showToast(error.message, 'error');
        return;
    }
    
    showLoading();
    
    const peminjamanId = document.getElementById('selectPeminjaman').value;
    const kondisi = document.getElementById('kondisiKembali').value;
    
    const peminjaman = getData('peminjaman');
    const pinjam = peminjaman.find(p => p.id === peminjamanId);
    
    if (!pinjam) {
        hideLoading();
        showToast('Data peminjaman tidak ditemukan!', 'error');
        return;
    }
    
    // Get kerusakan if any
    let kerusakanList = [];
    if (kondisi !== 'Baik') {
        const checkboxes = document.querySelectorAll('input[name="kerusakan"]:checked');
        checkboxes.forEach(cb => kerusakanList.push(cb.value));
        
        const kerusakanLainnya = document.getElementById('kerusakanLainnya').value;
        if (kerusakanLainnya) {
            kerusakanList.push(kerusakanLainnya);
        }
        
        // Save kerusakan report
        if (kerusakanList.length > 0) {
            const kerusakanData = getData('kerusakan');
            kerusakanData.push({
                id: generateId(),
                laptopId: pinjam.laptopId,
                laptopNama: pinjam.laptopNama,
                laptopKode: pinjam.laptopKode,
                dilaporkanOleh: pinjam.nama,
                jenisKerusakan: kerusakanList.join(', '),
                status: 'Pending',
                createdAt: new Date().toISOString()
            });
            setData('kerusakan', kerusakanData);
        }
    }
    
    // Move to riwayat
    const riwayat = getData('riwayat');
    riwayat.push({
        ...pinjam,
        status: 'Selesai',
        kondisiKembali: kondisi,
        kerusakan: kerusakanList.join(', '),
        catatan: document.getElementById('catatanPengembalian').value,
        tglPengembalianAktual: new Date().toISOString()
    });
    setData('riwayat', riwayat);
    
    // Remove from peminjaman
    const updatedPeminjaman = peminjaman.filter(p => p.id !== peminjamanId);
    setData('peminjaman', updatedPeminjaman);
    
    // Update laptop status and kondisi
    const inventaris = getData('inventaris');
    const laptop = inventaris.find(i => i.id === pinjam.laptopId);
    if (laptop) {
        laptop.status = 'Tersedia';
        laptop.kondisi = kondisi;
        setData('inventaris', inventaris);
    }
    
    setTimeout(() => {
        hideLoading();
        showToast('Pengembalian berhasil diproses!');
        document.getElementById('formPengembalian').reset();
        document.getElementById('detailPeminjaman').style.display = 'none';
        document.getElementById('kerusakanGroup').style.display = 'none';
        loadAllData();
        loadActivePeminjaman();
        initChart();
    }, 500);
}

// ==========================================
// INVENTARIS
// ==========================================
function loadInventarisTable() {
    const inventaris = getData('inventaris');
    const peminjaman = getData('peminjaman').filter(p => statusEquals(p.status, 'Aktif'));
    const tbody = document.getElementById('inventarisTableBody');
    
    if (!tbody) return;
    
    if (inventaris.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="padding: 30px; color: var(--text-secondary);">Tidak ada data inventaris</td></tr>';
        return;
    }
    
    tbody.innerHTML = inventaris.map((item, index) => {
        const kondisiClass = statusEquals(item.kondisi, 'Baik') ? 'baik' : (statusEquals(item.kondisi, 'Rusak Ringan') ? 'rusak-ringan' : 'rusak-berat');
        const statusClass = statusEquals(item.status, 'Tersedia') ? 'tersedia' : 'dipinjam';
        
        let statusText = item.status;
        if (statusEquals(item.status, 'Dipinjam')) {
            const pinjam = peminjaman.find(p => p.laptopId === item.id);
            if (pinjam) {
                statusText = `Dipinjam oleh ${sanitizeHTML(pinjam.nama)}`;
            }
        }
        
        return `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${sanitizeHTML(item.kode || item.id)}</strong></td>
                <td>${sanitizeHTML(item.nama)}</td>
                <td>${sanitizeHTML(item.spesifikasi || '-')}</td>
                <td><span class="status-badge ${kondisiClass}">${item.kondisi || 'Baik'}</span></td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="editInventaris('${item.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteInventaris('${item.id}')" title="Hapus">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function handleTambahInventaris(e) {
    e.preventDefault();
    
    try {
        const csrfToken = e.target.querySelector('input[name="csrf_token"]')?.value;
        CSRF.validateToken(csrfToken);
    } catch (error) {
        showToast(error.message, 'error');
        return;
    }
    
    const inventaris = getData('inventaris');
    const editId = document.getElementById('formTambahInventaris').dataset.editId;
    
    if (editId) {
        // Edit mode
        const item = inventaris.find(i => i.id === editId);
        if (item) {
            item.kode = document.getElementById('kodeInventaris').value;
            item.nama = document.getElementById('namaInventaris').value;
            item.spesifikasi = document.getElementById('spesifikasi').value;
            item.tahun = document.getElementById('tahunPerolehan').value;
            item.kondisi = document.getElementById('kondisiAwal').value;
            
            setData('inventaris', inventaris);
            showToast('Inventaris berhasil diupdate!');
            
            // Auto sync ke spreadsheet
            if (typeof autoSyncItem === 'function') {
                autoSyncItem('Inventaris', inventaris);
            }
        }
        // Clear edit mode
        delete document.getElementById('formTambahInventaris').dataset.editId;
        document.querySelector('#modalTambahInventaris .modal-header h2').innerHTML = '<i class="fas fa-plus"></i> Tambah Inventaris Baru';
    } else {
        // Add mode
        const newItem = {
            id: generateId(),
            kode: document.getElementById('kodeInventaris').value,
            nama: document.getElementById('namaInventaris').value,
            spesifikasi: document.getElementById('spesifikasi').value,
            tahun: document.getElementById('tahunPerolehan').value,
            kondisi: document.getElementById('kondisiAwal').value,
            status: 'Tersedia'
        };
        
        inventaris.push(newItem);
        setData('inventaris', inventaris);
        showToast('Inventaris berhasil ditambahkan!');
        
        // Auto sync ke spreadsheet
        if (typeof autoSyncItem === 'function') {
            autoSyncItem('Inventaris', inventaris);
        }
    }
    
    closeModal('modalTambahInventaris');
    document.getElementById('formTambahInventaris').reset();
    loadInventarisTable();
    loadDashboardStats();
    initChart();
}

async function deleteInventaris(id) {
    const confirmed = await showConfirm('Yakin ingin menghapus inventaris ini?', 'Konfirmasi Hapus');
    if (confirmed) {
        try {
            if (typeof BackupManager !== 'undefined') {
                BackupManager.createBackup('before_delete_inventaris');
            }
            
            const inventaris = getData('inventaris').filter(i => i.id !== id);
            setData('inventaris', inventaris);
            showToast('Inventaris berhasil dihapus!');
            
            if (typeof autoSyncItem === 'function') {
                autoSyncItem('Inventaris', inventaris);
            }
            
            loadInventarisTable();
            loadDashboardStats();
            initChart();
        } catch (error) {
            console.error('❌ deleteInventaris error:', error);
            showToast('Gagal menghapus inventaris: ' + error.message, 'error');
        }
    }
}

function editInventaris(id) {
    const inventaris = getData('inventaris');
    const item = inventaris.find(i => i.id === id);
    
    if (item) {
        // Fill modal with existing data
        document.getElementById('kodeInventaris').value = item.kode;
        document.getElementById('namaInventaris').value = item.nama;
        document.getElementById('spesifikasi').value = item.spesifikasi || '';
        document.getElementById('tahunPerolehan').value = item.tahun || '';
        document.getElementById('kondisiAwal').value = item.kondisi;
        
        // Set edit mode
        document.getElementById('formTambahInventaris').dataset.editId = id;
        document.querySelector('#modalTambahInventaris .modal-header h2').innerHTML = '<i class="fas fa-edit"></i> Edit Inventaris';
        
        showModal('modalTambahInventaris');
    }
}

// ==========================================
// KERUSAKAN
// ==========================================
function loadLaptopsForKerusakan() {
    const inventaris = getData('inventaris');
    const select = document.getElementById('laptopKerusakan');
    
    if (!select) return;
    
    select.innerHTML = '<option value="">Pilih Laptop</option>' + 
        inventaris.map(i => `<option value="${i.id}" data-nama="${i.nama}" data-kode="${i.kode}">${i.kode} - ${i.nama}</option>`).join('');
}

async function handleLaporKerusakan(e) {
    e.preventDefault();
    
    try {
        const csrfToken = e.target.querySelector('input[name="csrf_token"]')?.value;
        CSRF.validateToken(csrfToken);
    } catch (error) {
        showToast(error.message, 'error');
        return;
    }
    
    showLoading();
    
    const laptopId = document.getElementById('laptopKerusakan').value;
    const select = document.getElementById('laptopKerusakan');
    const selectedOption = select.options[select.selectedIndex];
    
    if (!laptopId) {
        hideLoading();
        showToast('Pilih laptop terlebih dahulu!', 'error');
        return;
    }
    
    // Get selected kerusakan
    const checkboxes = document.querySelectorAll('input[name="jenisKerusakan"]:checked');
    let kerusakanList = [];
    checkboxes.forEach(cb => kerusakanList.push(cb.value));
    
    const kerusakanLain = document.getElementById('deskripsiKerusakanLain').value;
    if (kerusakanLain) {
        kerusakanList.push(kerusakanLain);
    }
    
    if (kerusakanList.length === 0) {
        hideLoading();
        showToast('Pilih minimal satu jenis kerusakan!', 'error');
        return;
    }
    
    // Get foto if uploaded
    const fotoInput = document.getElementById('fotoKerusakan');
    let fotoBase64 = null;
    
    if (fotoInput && fotoInput.files && fotoInput.files[0]) {
        const file = fotoInput.files[0];
        // Check file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            hideLoading();
            showToast('Ukuran foto maksimal 2MB!', 'error');
            return;
        }
        // Convert to base64
        fotoBase64 = await convertFileToBase64(file);
    }
    
    const kerusakanData = getData('kerusakan');
    kerusakanData.push({
        id: generateId(),
        laptopId: laptopId,
        laptopNama: selectedOption.dataset.nama,
        laptopKode: selectedOption.dataset.kode,
        dilaporkanOleh: document.getElementById('pelaporKerusakan').value,
        jenisKerusakan: kerusakanList.join(', '),
        foto: fotoBase64,
        status: 'Pending',
        createdAt: new Date().toISOString()
    });
    setData('kerusakan', kerusakanData);
    
    // Update laptop kondisi
    const inventaris = getData('inventaris');
    const laptop = inventaris.find(i => i.id === laptopId);
    if (laptop) {
        laptop.kondisi = 'Rusak Ringan';
        setData('inventaris', inventaris);
    }
    
    setTimeout(() => {
        hideLoading();
        showToast('Laporan kerusakan berhasil dikirim!');
        document.getElementById('formLaporKerusakan').reset();
        removeFotoPreview(); // Reset foto preview
        loadKerusakanTable();
        loadDashboardStats();
        updateNotificationBadge();
        initChart();
    }, 500);
}

function loadKerusakanTable() {
    const kerusakan = getData('kerusakan');
    const tbody = document.getElementById('kerusakanTableBody');
    
    if (!tbody) return;
    
    const kerusakanPending = document.getElementById('kerusakanPending');
    const kerusakanProses = document.getElementById('kerusakanProses');
    const kerusakanSelesai = document.getElementById('kerusakanSelesai');
    
    if (kerusakanPending) kerusakanPending.textContent = kerusakan.filter(k => statusEquals(k.status, 'Pending')).length;
    if (kerusakanProses) kerusakanProses.textContent = kerusakan.filter(k => statusEquals(k.status, 'Proses')).length;
    if (kerusakanSelesai) kerusakanSelesai.textContent = kerusakan.filter(k => statusEquals(k.status, 'Selesai')).length;
    
    if (kerusakan.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="padding: 30px; color: var(--text-secondary);">Tidak ada laporan kerusakan</td></tr>';
        return;
    }
    
    // Check if user is admin
    const userIsAdmin = typeof isAdmin === 'function' && isAdmin();
    
    tbody.innerHTML = kerusakan.map(k => {
        const statusClass = k.status.toLowerCase();
        
        // Foto column
        const fotoColumn = k.foto 
            ? `<img src="${k.foto}" alt="Foto Kerusakan" class="foto-kerusakan-thumb" onclick="showFotoModal('${k.foto}')" title="Klik untuk memperbesar">`
            : `<span style="color: var(--text-secondary);">-</span>`;
        
        // Admin gets dropdown to change status, User only sees status text
        const aksiColumn = userIsAdmin 
            ? `<select class="btn btn-sm" onchange="updateKerusakanStatus('${k.id}', this.value)">
                    <option value="Pending" ${k.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="Proses" ${k.status === 'Proses' ? 'selected' : ''}>Proses</option>
                    <option value="Selesai" ${k.status === 'Selesai' ? 'selected' : ''}>Selesai</option>
               </select>`
            : `<span style="color: var(--text-secondary); font-size: 0.85rem;">-</span>`;
        
        return `
            <tr>
                <td>${formatDate(k.createdAt)}</td>
                <td>${sanitizeHTML(k.laptopKode)} - ${sanitizeHTML(k.laptopNama)}</td>
                <td>${sanitizeHTML(k.dilaporkanOleh)}</td>
                <td>${sanitizeHTML(k.jenisKerusakan)}</td>
                <td>${fotoColumn}</td>
                <td><span class="status-badge ${statusClass}">${k.status}</span></td>
                <td>${aksiColumn}</td>
            </tr>
        `;
    }).join('');
}

function updateKerusakanStatus(id, newStatus) {
    const kerusakan = getData('kerusakan');
    const item = kerusakan.find(k => k.id === id);
    
    if (item) {
        item.status = newStatus;
        setData('kerusakan', kerusakan);
        
        // If fixed, update laptop kondisi
        if (newStatus === 'Selesai') {
            const inventaris = getData('inventaris');
            const laptop = inventaris.find(i => i.id === item.laptopId);
            if (laptop) {
                laptop.kondisi = 'Baik';
                setData('inventaris', inventaris);
            }
        }
        
        showToast('Status berhasil diupdate!');
        loadKerusakanTable();
        loadDashboardStats();
        initChart();
    }
}

// ==========================================
// RIWAYAT
// ==========================================
function loadRiwayatTable(filteredData = null) {
    const riwayat = filteredData || getData('riwayat');
    const tbody = document.getElementById('riwayatTableBody');
    
    if (!tbody) return;
    
    if (riwayat.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center" style="padding: 30px; color: var(--text-secondary);">Tidak ada riwayat peminjaman</td></tr>';
        return;
    }
    
    const sortedRiwayat = [...riwayat].reverse();
    
    tbody.innerHTML = sortedRiwayat.map((r, index) => {
        const tglPinjam = new Date(r.tglPinjam);
        const tglKembali = new Date(r.tglPengembalianAktual);
        const durasi = Math.ceil((tglKembali - tglPinjam) / (1000 * 60 * 60 * 24));
        const kondisiClass = r.kondisiKembali === 'Baik' ? 'baik' : (r.kondisiKembali === 'Rusak Ringan' ? 'rusak-ringan' : 'rusak-berat');
        
        return `
            <tr>
                <td>${index + 1}</td>
                <td>${r.nama}</td>
                <td>${r.laptopNama}</td>
                <td>${formatDate(r.tglPinjam)}</td>
                <td>${formatDate(r.tglPengembalianAktual)}</td>
                <td>${durasi} hari</td>
                <td><span class="status-badge ${kondisiClass}">${r.kondisiKembali}</span></td>
                <td><span class="status-badge selesai">Selesai</span></td>
            </tr>
        `;
    }).join('');
}

function filterRiwayat() {
    const dari = document.getElementById('filterDari').value;
    const sampai = document.getElementById('filterSampai').value;
    const status = document.getElementById('filterRiwayatStatus').value;
    
    let riwayat = getData('riwayat');
    
    // Filter by date range
    if (dari) {
        riwayat = riwayat.filter(r => new Date(r.tglPinjam) >= new Date(dari));
    }
    if (sampai) {
        riwayat = riwayat.filter(r => new Date(r.tglPinjam) <= new Date(sampai));
    }
    
    // Filter by status/kondisi
    if (status) {
        if (status === 'Terlambat') {
            riwayat = riwayat.filter(r => new Date(r.tglPengembalianAktual) > new Date(r.tglKembali));
        }
    }
    
    loadRiwayatTable(riwayat);
    showToast(`Filter diterapkan! ${riwayat.length} data ditemukan`);
}

function exportRiwayat() {
    const riwayat = getData('riwayat');
    
    if (riwayat.length === 0) {
        showToast('Tidak ada data untuk diexport!', 'warning');
        return;
    }
    
    // Create CSV content
    let csv = 'No,Nama Peminjam,NIP,Laptop,Tgl Pinjam,Tgl Kembali,Keperluan,Kondisi\n';
    
    riwayat.forEach((r, index) => {
        csv += `${index + 1},"${r.nama}","${r.nip}","${r.laptopNama}","${r.tglPinjam}","${r.tglPengembalianAktual}","${r.keperluan}","${r.kondisiKembali}"\n`;
    });
    
    // Download file
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'riwayat_peminjaman_' + new Date().toISOString().split('T')[0] + '.csv';
    link.click();
    
    showToast('Data berhasil diexport!');
}

// ==========================================
// GOOGLE SHEETS INTEGRATION (via sync.js)
// ==========================================
async function sendToGoogleSheets(sheetName, data) {
    // Sync is now handled by sync.js automatically
    // This function is kept for backward compatibility
    if (!CONFIG.APPS_SCRIPT_URL || CONFIG.APPS_SCRIPT_URL === '') {
        console.log('Google Sheets URL not configured, using local storage only');
        return;
    }
    
    try {
        const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'insert',
                sheet: sheetName,
                data: data
            })
        });
        
        console.log('Data sent to Google Sheets');
    } catch (error) {
        console.error('Error sending to Google Sheets:', error);
    }
}

// ==========================================
// MODAL
// ==========================================
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
            
            if (form.dataset.editId) {
                delete form.dataset.editId;
            }
        }
        
        CSRF.refreshToken();
    }
}

// Close modal on outside click
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// ==========================================
// TOAST NOTIFICATION
// ==========================================
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    toast.className = 'toast ' + type;
    toastMessage.textContent = message;
    
    // Update icon
    const icon = toast.querySelector('i');
    if (type === 'error') {
        icon.className = 'fas fa-times-circle';
    } else if (type === 'warning') {
        icon.className = 'fas fa-exclamation-circle';
    } else {
        icon.className = 'fas fa-check-circle';
    }
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ==========================================
// LOADING
// ==========================================
function showLoading() {
    document.getElementById('loadingOverlay').classList.add('active');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('active');
}

function showConfirm(message, title = 'Konfirmasi') {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmDialog');
        const titleEl = document.getElementById('confirmTitle');
        const messageEl = document.getElementById('confirmMessage');
        const okBtn = document.getElementById('confirmOkBtn');
        const cancelBtn = document.getElementById('confirmCancelBtn');
        
        if (!modal || !titleEl || !messageEl || !okBtn || !cancelBtn) {
            resolve(confirm(message));
            return;
        }
        
        titleEl.textContent = title;
        messageEl.textContent = message;
        modal.classList.add('active');
        
        const cleanup = () => {
            modal.classList.remove('active');
            okBtn.removeEventListener('click', handleOk);
            cancelBtn.removeEventListener('click', handleCancel);
            modal.removeEventListener('click', handleOutsideClick);
        };
        
        const handleOk = () => {
            cleanup();
            resolve(true);
        };
        
        const handleCancel = () => {
            cleanup();
            resolve(false);
        };
        
        const handleOutsideClick = (e) => {
            if (e.target === modal) {
                cleanup();
                resolve(false);
            }
        };
        
        okBtn.addEventListener('click', handleOk);
        cancelBtn.addEventListener('click', handleCancel);
        modal.addEventListener('click', handleOutsideClick);
        
        setTimeout(() => okBtn.focus(), 100);
    });
}

function showPrompt(message, defaultValue = '', title = 'Input Data') {
    return new Promise((resolve) => {
        const modal = document.getElementById('promptDialog');
        const titleEl = document.getElementById('promptTitle');
        const messageEl = document.getElementById('promptMessage');
        const inputEl = document.getElementById('promptInput');
        const okBtn = document.getElementById('promptOkBtn');
        const cancelBtn = document.getElementById('promptCancelBtn');
        
        if (!modal || !titleEl || !messageEl || !inputEl || !okBtn || !cancelBtn) {
            resolve(prompt(message, defaultValue));
            return;
        }
        
        titleEl.textContent = title;
        messageEl.textContent = message;
        inputEl.value = defaultValue;
        modal.classList.add('active');
        
        const cleanup = () => {
            modal.classList.remove('active');
            inputEl.value = '';
            okBtn.removeEventListener('click', handleOk);
            cancelBtn.removeEventListener('click', handleCancel);
            modal.removeEventListener('click', handleOutsideClick);
            inputEl.removeEventListener('keypress', handleEnter);
        };
        
        const handleOk = () => {
            cleanup();
            resolve(inputEl.value.trim() || null);
        };
        
        const handleCancel = () => {
            cleanup();
            resolve(null);
        };
        
        const handleOutsideClick = (e) => {
            if (e.target === modal) {
                cleanup();
                resolve(null);
            }
        };
        
        const handleEnter = (e) => {
            if (e.key === 'Enter') {
                handleOk();
            }
        };
        
        okBtn.addEventListener('click', handleOk);
        cancelBtn.addEventListener('click', handleCancel);
        modal.addEventListener('click', handleOutsideClick);
        inputEl.addEventListener('keypress', handleEnter);
        
        setTimeout(() => {
            inputEl.focus();
            inputEl.select();
        }, 100);
    });
}

// ==========================================
// SEARCH & FILTER FUNCTIONS
// ==========================================
function initSearchAndFilters() {
    try {
        const globalSearch = document.querySelector('.search-box input');
        if (globalSearch) {
            globalSearch.addEventListener('input', function(e) {
                try {
                    const query = e.target.value.toLowerCase();
                    if (query.length >= 2) {
                        performGlobalSearch(query);
                    }
                } catch (error) {
                    console.error('❌ Global search input error:', error);
                }
            });
            
            globalSearch.addEventListener('keypress', function(e) {
                try {
                    if (e.key === 'Enter') {
                        const query = e.target.value.toLowerCase();
                        performGlobalSearch(query);
                    }
                } catch (error) {
                    console.error('❌ Global search keypress error:', error);
                }
            });
        }
        
        const searchInventaris = document.getElementById('searchInventaris');
        if (searchInventaris) {
            searchInventaris.addEventListener('input', function(e) {
                try {
                    filterInventarisTable();
                } catch (error) {
                    console.error('❌ Search inventaris error:', error);
                }
            });
        }
        
        const filterKondisi = document.getElementById('filterKondisi');
        if (filterKondisi) {
            filterKondisi.addEventListener('change', function(e) {
                try {
                    filterInventarisTable();
                } catch (error) {
                    console.error('❌ Filter kondisi error:', error);
                }
            });
        }
        
        const filterStatus = document.getElementById('filterStatus');
        if (filterStatus) {
            filterStatus.addEventListener('change', function(e) {
                try {
                    filterPeminjamanTable();
                } catch (error) {
                    console.error('❌ Filter status error:', error);
                }
            });
        }
    } catch (error) {
        console.error('❌ initSearchAndFilters error:', error);
    }
}

function performGlobalSearch(query) {
    try {
        const inventaris = getData('inventaris');
        const peminjaman = getData('peminjaman');
        
        const matchedInventaris = inventaris.filter(i => 
            i.nama.toLowerCase().includes(query) || 
            i.kode.toLowerCase().includes(query)
        );
        
        const matchedPeminjaman = peminjaman.filter(p => 
            p.nama.toLowerCase().includes(query) || 
            p.laptopNama.toLowerCase().includes(query)
        );
        
        if (matchedInventaris.length > 0) {
            showPage('inventaris');
            document.getElementById('searchInventaris').value = query;
            filterInventarisTable();
            showToast(`Ditemukan ${matchedInventaris.length} inventaris`);
        } else if (matchedPeminjaman.length > 0) {
            showPage('peminjaman');
            showToast(`Ditemukan ${matchedPeminjaman.length} peminjaman`);
        } else {
            showToast('Tidak ada hasil ditemukan', 'warning');
        }
    } catch (error) {
        console.error('❌ performGlobalSearch error:', error);
        showToast('Gagal melakukan pencarian', 'error');
    }
}

function filterInventarisTable() {
    const searchQuery = document.getElementById('searchInventaris')?.value.toLowerCase() || '';
    const kondisiFilter = document.getElementById('filterKondisi')?.value || '';
    
    const inventaris = getData('inventaris');
    const peminjaman = getData('peminjaman').filter(p => statusEquals(p.status, 'Aktif'));
    
    let filtered = inventaris;
    
    // Filter by search
    if (searchQuery) {
        filtered = filtered.filter(i => 
            i.nama.toLowerCase().includes(searchQuery) || 
            i.kode.toLowerCase().includes(searchQuery) ||
            (i.spesifikasi && i.spesifikasi.toLowerCase().includes(searchQuery))
        );
    }
    
    // Filter by kondisi
    if (kondisiFilter) {
        filtered = filtered.filter(i => i.kondisi === kondisiFilter);
    }
    
    const tbody = document.getElementById('inventarisTableBody');
    if (!tbody) return;
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="padding: 30px; color: var(--text-secondary);">Tidak ada data ditemukan</td></tr>';
        return;
    }
    
    tbody.innerHTML = filtered.map((item, index) => {
        const kondisiClass = statusEquals(item.kondisi, 'Baik') ? 'baik' : (statusEquals(item.kondisi, 'Rusak Ringan') ? 'rusak-ringan' : 'rusak-berat');
        const statusClass = statusEquals(item.status, 'Tersedia') ? 'tersedia' : 'dipinjam';
        
        let statusText = item.status;
        if (statusEquals(item.status, 'Dipinjam')) {
            const pinjam = peminjaman.find(p => p.laptopId === item.id);
            if (pinjam) {
                statusText = `Dipinjam oleh ${sanitizeHTML(pinjam.nama)}`;
            }
        }
        
        return `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${sanitizeHTML(item.kode || item.id)}</strong></td>
                <td>${sanitizeHTML(item.nama)}</td>
                <td>${sanitizeHTML(item.spesifikasi || '-')}</td>
                <td><span class="status-badge ${kondisiClass}">${item.kondisi || 'Baik'}</span></td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="editInventaris('${item.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteInventaris('${item.id}')" title="Hapus">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function filterPeminjamanTable() {
    const statusFilter = document.getElementById('filterStatus')?.value || '';
    
    let peminjaman = getData('peminjaman');
    
    if (statusFilter) {
        const today = new Date();
        if (statusFilter === 'Aktif') {
            peminjaman = peminjaman.filter(p => {
                const tglKembali = new Date(getTglKembali(p));
                return p.status === 'Aktif' && today <= tglKembali;
            });
        } else if (statusFilter === 'Terlambat') {
            peminjaman = peminjaman.filter(p => {
                const tglKembali = new Date(getTglKembali(p));
                return p.status === 'Aktif' && today > tglKembali;
            });
        } else if (statusFilter === 'Selesai') {
            peminjaman = peminjaman.filter(p => p.status === 'Selesai');
        }
    }
    
    const tbody = document.getElementById('peminjamanTableBody');
    if (!tbody) return;
    
    if (peminjaman.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center" style="padding: 30px; color: var(--text-secondary);">Tidak ada data ditemukan</td></tr>';
        return;
    }
    
    tbody.innerHTML = peminjaman.map((p, index) => {
        const today = new Date();
        const tglKembali = new Date(getTglKembali(p));
        const isLate = today > tglKembali && p.status === 'Aktif';
        const statusClass = p.status === 'Selesai' ? 'selesai' : (isLate ? 'terlambat' : 'aktif');
        const statusText = p.status === 'Selesai' ? 'Selesai' : (isLate ? 'Terlambat' : 'Aktif');
        
        return `
            <tr>
                <td>${index + 1}</td>
                <td>${sanitizeHTML(p.nama)}</td>
                <td>${sanitizeHTML(p.laptopNama)}</td>
                <td>${formatDate(getTglPinjam(p))}</td>
                <td>${formatDate(getTglKembali(p))}</td>
                <td>${sanitizeHTML(p.keperluan)}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    ${p.status === 'Aktif' ? `
                        <button class="btn btn-sm btn-primary" onclick="quickReturn('${p.id}')">
                            <i class="fas fa-undo"></i>
                        </button>
                    ` : '-'}
                </td>
            </tr>
        `;
    }).join('');
}

// ==========================================
// NOTIFICATIONS
// ==========================================
let notificationsList = [];

function initNotifications() {
    const notifIcon = document.querySelector('.notifications');
    if (notifIcon) {
        notifIcon.addEventListener('click', function() {
            showNotificationsModal();
        });
    }
}

function updateNotificationBadge() {
    const peminjaman = getData('peminjaman').filter(p => statusEquals(p.status, 'Aktif'));
    const kerusakan = getData('kerusakan').filter(k => statusEquals(k.status, 'Pending'));
    
    notificationsList = [];
    const today = new Date();
    
    // Check for overdue loans
    peminjaman.forEach(p => {
        const tglKembali = new Date(p.tglKembali);
        const daysLeft = Math.ceil((tglKembali - today) / (1000 * 60 * 60 * 24));
        
        if (daysLeft < 0) {
            notificationsList.push({
                type: 'danger',
                icon: 'fas fa-exclamation-circle',
                title: 'Peminjaman Terlambat!',
                message: `${p.nama} terlambat ${Math.abs(daysLeft)} hari mengembalikan ${p.laptopNama}`,
                time: 'Segera'
            });
        } else if (daysLeft <= 2) {
            notificationsList.push({
                type: 'warning',
                icon: 'fas fa-clock',
                title: 'Jatuh Tempo Segera',
                message: `${p.nama} harus mengembalikan ${p.laptopNama} dalam ${daysLeft} hari`,
                time: formatDate(p.tglKembali)
            });
        }
    });
    
    // Add pending repairs
    kerusakan.forEach(k => {
        notificationsList.push({
            type: 'info',
            icon: 'fas fa-tools',
            title: 'Kerusakan Menunggu',
            message: `${k.laptopNama} - ${k.jenisKerusakan}`,
            time: formatDate(k.createdAt)
        });
    });
    
    // Update badge
    const badge = document.querySelector('.notifications .badge');
    if (badge) {
        badge.textContent = notificationsList.length;
        badge.style.display = notificationsList.length > 0 ? 'block' : 'none';
    }
}

function showNotificationsModal() {
    let modalHtml = `
        <div class="modal active" id="modalNotifications" onclick="if(event.target===this)closeModal('modalNotifications')">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h2><i class="fas fa-bell"></i> Notifikasi</h2>
                    <button class="close-btn" onclick="closeModal('modalNotifications')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body" style="max-height: 400px; overflow-y: auto;">
    `;
    
    if (notificationsList.length === 0) {
        modalHtml += '<p class="text-center" style="padding: 30px; color: var(--text-secondary);">Tidak ada notifikasi</p>';
    } else {
        notificationsList.forEach(notif => {
            modalHtml += `
                <div class="notification-item" style="display: flex; gap: 12px; padding: 12px; border-bottom: 1px solid var(--border-color);">
                    <div class="notif-icon" style="width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: ${notif.type === 'danger' ? '#FEE2E2' : notif.type === 'warning' ? '#FEF3C7' : '#DBEAFE'}; color: ${notif.type === 'danger' ? '#DC2626' : notif.type === 'warning' ? '#D97706' : '#2563EB'};">
                        <i class="${notif.icon}"></i>
                    </div>
                    <div class="notif-content" style="flex: 1;">
                        <strong style="display: block; margin-bottom: 4px;">${sanitizeHTML(notif.title)}</strong>
                        <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 4px;">${sanitizeHTML(notif.message)}</p>
                        <span style="font-size: 0.8rem; color: var(--text-light);">${notif.time}</span>
                    </div>
                </div>
            `;
        });
    }
    
    modalHtml += `
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('modalNotifications');
    if (existingModal) existingModal.remove();
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// ==========================================
// PRINT FUNCTIONS
// ==========================================
function printData(type) {
    let printContent = '';
    let title = '';
    
    if (type === 'inventaris') {
        title = 'Daftar Inventaris Laptop';
        const inventaris = getData('inventaris');
        printContent = `
            <table border="1" cellpadding="8" cellspacing="0" style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #f0f0f0;">
                        <th>No</th>
                        <th>Kode</th>
                        <th>Nama</th>
                        <th>Spesifikasi</th>
                        <th>Kondisi</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${inventaris.map((i, idx) => `
                        <tr>
                            <td>${idx + 1}</td>
                            <td>${i.kode || i.id}</td>
                            <td>${i.nama}</td>
                            <td>${i.spesifikasi || '-'}</td>
                            <td>${i.kondisi || 'Baik'}</td>
                            <td>${i.status}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } else if (type === 'peminjaman') {
        title = 'Daftar Peminjaman Aktif';
        const peminjaman = getData('peminjaman').filter(p => statusEquals(p.status, 'Aktif'));
        printContent = `
            <table border="1" cellpadding="8" cellspacing="0" style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #f0f0f0;">
                        <th>No</th>
                        <th>Nama Peminjam</th>
                        <th>NIP</th>
                        <th>Laptop</th>
                        <th>Tgl Pinjam</th>
                        <th>Tgl Kembali</th>
                        <th>Keperluan</th>
                    </tr>
                </thead>
                <tbody>
                    ${peminjaman.map((p, idx) => `
                        <tr>
                            <td>${idx + 1}</td>
                            <td>${p.nama}</td>
                            <td>${p.nip}</td>
                            <td>${p.laptopNama}</td>
                            <td>${formatDate(p.tglPinjam)}</td>
                            <td>${formatDate(p.tglKembali)}</td>
                            <td>${p.keperluan}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { text-align: center; margin-bottom: 20px; }
                table { font-size: 12px; }
                @media print {
                    body { padding: 0; }
                }
            </style>
        </head>
        <body>
            <h1>${title}</h1>
            <p>Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}</p>
            ${printContent}
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// ==========================================
// EXPORT FUNCTIONS
// ==========================================
function exportInventaris() {
    const inventaris = getData('inventaris');
    
    if (inventaris.length === 0) {
        showToast('Tidak ada data untuk diexport!', 'warning');
        return;
    }
    
    let csv = 'No,Kode,Nama,Spesifikasi,Tahun,Kondisi,Status\n';
    
    inventaris.forEach((i, index) => {
        csv += `${index + 1},"${i.kode}","${i.nama}","${i.spesifikasi || ''}","${i.tahun || ''}","${i.kondisi}","${i.status}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'inventaris_' + new Date().toISOString().split('T')[0] + '.csv';
    link.click();
    
    showToast('Data inventaris berhasil diexport!');
}

function exportPeminjaman() {
    const peminjaman = getData('peminjaman');
    
    if (peminjaman.length === 0) {
        showToast('Tidak ada data untuk diexport!', 'warning');
        return;
    }
    
    let csv = 'No,Nama,NIP,Bagian,No HP,Laptop,Tgl Pinjam,Tgl Kembali,Keperluan,Status\n';
    
    peminjaman.forEach((p, index) => {
        csv += `${index + 1},"${p.nama}","${p.nip}","${p.bagian}","${p.noHp}","${p.laptopNama}","${p.tglPinjam}","${p.tglKembali}","${p.keperluan}","${p.status}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'peminjaman_' + new Date().toISOString().split('T')[0] + '.csv';
    link.click();
    
    showToast('Data peminjaman berhasil diexport!');
}

// ==========================================
// URL HASH NAVIGATION
// ==========================================
window.addEventListener('hashchange', function() {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
        showPage(hash);
        
        // Update nav active state
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === hash) {
                item.classList.add('active');
            }
        });
    }
});

// Check initial hash
if (window.location.hash) {
    const hash = window.location.hash.replace('#', '');
    showPage(hash);
}

// ==========================================
// BACKUP & RESTORE FUNCTIONS
// ==========================================
function loadBackupsTable() {
    try {
        if (typeof BackupManager === 'undefined') {
            console.warn('BackupManager not loaded');
            return;
        }
        
        const backups = BackupManager.getBackups();
        const tbody = document.getElementById('backupsTableBody');
        
        if (!tbody) return;
        
        if (backups.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="padding: 30px; color: var(--text-secondary);">Tidak ada backup tersimpan</td></tr>';
            return;
        }
        
        tbody.innerHTML = backups.map((backup, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${BackupManager.formatTimestamp(backup.timestamp)}</td>
                <td><span class="badge badge-info">${BackupManager.getReasonText(backup.reason)}</span></td>
                <td>${BackupManager.getBackupSize(backup.id)}</td>
                <td class="actions">
                    <button class="btn-action btn-success" onclick="restoreBackupConfirm('${backup.id}')" title="Restore">
                        <i class="fas fa-undo"></i>
                    </button>
                    <button class="btn-action btn-primary" onclick="if(typeof BackupManager !== 'undefined') BackupManager.downloadBackup('${backup.id}')" title="Download">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="btn-action btn-danger" onclick="deleteBackupConfirm('${backup.id}')" title="Hapus">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('❌ loadBackupsTable error:', error);
    }
}

async function restoreBackupConfirm(backupId) {
    const confirmed = await showConfirm(
        '⚠️ PERINGATAN: Restore akan mengganti semua data saat ini dengan data dari backup. Lanjutkan?',
        'Konfirmasi Restore'
    );
    if (confirmed) {
        try {
            if (typeof BackupManager !== 'undefined') {
                BackupManager.restoreBackup(backupId);
            }
        } catch (error) {
            console.error('❌ restoreBackupConfirm error:', error);
            showToast('Gagal restore backup: ' + error.message, 'error');
        }
    }
}

async function deleteBackupConfirm(backupId) {
    const confirmed = await showConfirm('Yakin ingin menghapus backup ini?', 'Konfirmasi Hapus');
    if (confirmed) {
        try {
            if (typeof BackupManager !== 'undefined') {
                BackupManager.deleteBackup(backupId);
                showToast('Backup berhasil dihapus!', 'success');
                loadBackupsTable();
            }
        } catch (error) {
            console.error('❌ deleteBackupConfirm error:', error);
            showToast('Gagal menghapus backup: ' + error.message, 'error');
        }
    }
}

async function handleBackupFileUpload(input) {
    try {
        if (!input.files || input.files.length === 0) {
            return;
        }
        
        const file = input.files[0];
        
        if (!file.name.endsWith('.json')) {
            showToast('File harus berformat JSON!', 'error');
            input.value = '';
            return;
        }
        
        if (typeof BackupManager !== 'undefined') {
            showLoading();
            const backupId = await BackupManager.uploadBackup(file);
            hideLoading();
            
            loadBackupsTable();
            input.value = '';
        }
    } catch (error) {
        hideLoading();
        console.error('❌ handleBackupFileUpload error:', error);
        showToast('Gagal mengupload backup: ' + error.message, 'error');
        input.value = '';
    }
}

// Refresh notifications every minute
setInterval(updateNotificationBadge, 60000);

window.addEventListener('beforeunload', function(e) {
    try {
        cleanupCurrentPage();
        
        if (statusChart) {
            statusChart.destroy();
            statusChart = null;
        }
        
        if (typeof SyncManager !== 'undefined' && SyncManager.isSyncing) {
            e.preventDefault();
            e.returnValue = 'Data sedang disinkronkan. Yakin ingin keluar?';
            return e.returnValue;
        }
    } catch (error) {
        console.error('❌ beforeunload cleanup error:', error);
    }
});

console.log('✅ app.js loaded successfully');

