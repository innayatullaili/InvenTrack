// ==========================================
// PAGE-SPECIFIC SEARCH FUNCTIONALITY
// ==========================================

// Search Peminjaman
function initSearchPeminjaman() {
    const searchInput = document.getElementById('searchPeminjaman');
    if (searchInput) {
        searchInput.addEventListener('input', function (e) {
            const query = e.target.value.toLowerCase();
            filterTableRows('peminjamanTable', query);
        });
    }
}

// Search Inventaris (already exists in initSearchAndFilters)
function initSearchInventaris() {
    const searchInput = document.getElementById('searchInventaris');
    if (searchInput) {
        searchInput.addEventListener('input', function (e) {
            const query = e.target.value.toLowerCase();
            filterTableRows('inventarisTable', query);
        });
    }
}

// Search Kerusakan
function initSearchKerusakan() {
    const searchInput = document.getElementById('searchKerusakan');
    if (searchInput) {
        searchInput.addEventListener('input', function (e) {
            const query = e.target.value.toLowerCase();
            filterTableRows('kerusakanTable', query);
        });
    }
}

// Search Riwayat
function initSearchRiwayat() {
    const searchInput = document.getElementById('searchRiwayat');
    if (searchInput) {
        searchInput.addEventListener('input', function (e) {
            const query = e.target.value.toLowerCase();
            filterTableRows('riwayatTable', query);
        });
    }
}

// Generic table filter function
function filterTableRows(tableId, query) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const rows = table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const text = row.textContent.toLowerCase();

        if (text.includes(query)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    }
}

// Initialize all search functions
function initAllSearchFunctions() {
    initSearchPeminjaman();
    initSearchInventaris();
    initSearchKerusakan();
    initSearchRiwayat();
}

// Add to initializeApp() - call this after DOM is ready
