// ==========================================
// AUTHENTICATION & AUTHORIZATION MODULE
// ==========================================

// Current logged in user
let currentUser = null;

// ==========================================
// PASSWORD UTILITIES
// ==========================================
async function hashPassword(plainPassword) {
    if (typeof bcrypt === 'undefined') {
        console.warn('bcrypt not loaded, using plain password (INSECURE!)');
        return plainPassword;
    }
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(plainPassword, salt);
}

async function verifyPassword(plainPassword, hashedPassword) {
    if (typeof bcrypt === 'undefined') {
        console.warn('bcrypt not loaded, using plain comparison (INSECURE!)');
        return plainPassword === hashedPassword;
    }
    if (!hashedPassword.startsWith('$2')) {
        return plainPassword === hashedPassword;
    }
    return await bcrypt.compare(plainPassword, hashedPassword);
}

// ==========================================
// INITIALIZATION
// ==========================================
async function initAuth() {
    // Initialize admin user if no users exist
    if (!localStorage.getItem('users')) {
        const adminUser = {
            id: 'U001',
            username: 'admin',
            password: await hashPassword('admin123'),
            email: 'admin@bps.go.id',
            role: 'admin',
            name: 'Administrator',
            nip: '-',
            status: 'active',
            createdAt: new Date().toISOString()
        };
        localStorage.setItem('users', JSON.stringify([adminUser]));
    } else {
        const users = JSON.parse(localStorage.getItem('users'));
        let migrated = false;
        
        for (let user of users) {
            if (user.password && !user.password.startsWith('$2')) {
                user.password = await hashPassword(user.password);
                migrated = true;
            }
        }
        
        if (migrated) {
            localStorage.setItem('users', JSON.stringify(users));
            console.log('✅ Passwords migrated to hashed format');
        }
    }
    
    // Check if user is logged in
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
    } else {
        // Set as guest user (public access)
        currentUser = {
            id: 'guest',
            username: 'guest',
            name: 'Pengguna',
            role: 'user',
            isGuest: true
        };
        // Save guest to localStorage so app.js can detect user
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
    
    applyUserRole();
    updateUserDisplay();
}

// ==========================================
// ROLE MANAGEMENT
// ==========================================
function isAdmin() {
    return currentUser && currentUser.role === 'admin' && !currentUser.isGuest;
}

function isUser() {
    return currentUser && (currentUser.role === 'user' || currentUser.isGuest);
}

function isGuest() {
    return currentUser && currentUser.isGuest === true;
}

function isLoggedIn() {
    return currentUser && !currentUser.isGuest;
}

function applyUserRole() {
    const adminOnlyElements = document.querySelectorAll('.admin-only');
    const userOnlyElements = document.querySelectorAll('.user-only');
    const logoutBtn = document.querySelector('.btn-logout');
    const loginBtn = document.querySelector('.btn-login');
    
    if (isAdmin()) {
        // Show admin-only elements
        adminOnlyElements.forEach(el => {
            el.style.display = '';
        });
        // Show user-only elements too (admin can see all)
        userOnlyElements.forEach(el => {
            el.style.display = '';
        });
        // Show logout, hide login
        if (logoutBtn) logoutBtn.style.display = 'flex';
        if (loginBtn) loginBtn.style.display = 'none';
    } else {
        // Hide admin-only elements
        adminOnlyElements.forEach(el => {
            el.style.display = 'none';
        });
        // Show user-only elements
        userOnlyElements.forEach(el => {
            el.style.display = '';
        });
        
        // For guest: show login button, hide logout
        if (isGuest()) {
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (loginBtn) loginBtn.style.display = 'flex';
        } else {
            // Logged in as regular user
            if (logoutBtn) logoutBtn.style.display = 'flex';
            if (loginBtn) loginBtn.style.display = 'none';
        }
    }
    
    // Apply specific restrictions for user role
    if (isUser() && !isAdmin()) {
        // Hide delete buttons for users
        setTimeout(() => {
            document.querySelectorAll('.btn-danger').forEach(btn => {
                if (!btn.closest('.user-can-delete')) {
                    btn.style.display = 'none';
                }
            });
        }, 500);
    }
}

function updateUserDisplay() {
    const nameElement = document.getElementById('displayUserName');
    const roleElement = document.getElementById('displayUserRole');
    
    if (nameElement && currentUser) {
        nameElement.textContent = isGuest() ? 'Pengguna' : currentUser.name;
    }
    
    if (roleElement && currentUser) {
        if (isGuest()) {
            roleElement.textContent = 'Guest';
        } else if (currentUser.role === 'admin') {
            roleElement.textContent = 'Administrator';
        } else {
            roleElement.textContent = 'User';
        }
    }
}

// ==========================================
// CHECK ACCESS
// ==========================================
function checkAccess(requiredRole) {
    if (!currentUser) {
        window.location.href = 'login.html';
        return false;
    }
    
    if (requiredRole === 'admin' && !isAdmin()) {
        showToast('Akses ditolak! Hanya admin yang bisa mengakses fitur ini.', 'error');
        return false;
    }
    
    return true;
}

// ==========================================
// LOGOUT
// ==========================================
async function logout() {
    const confirmed = await showConfirm('Yakin ingin keluar dari sistem?', 'Konfirmasi Logout');
    if (confirmed) {
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    }
}

// ==========================================
// USER MANAGEMENT (Admin Only)
// ==========================================
function getUsers() {
    const users = localStorage.getItem('users');
    return users ? JSON.parse(users) : [];
}

function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

function loadUsersTable() {
    if (!checkAccess('admin')) return;
    
    const users = getUsers();
    const tbody = document.getElementById('usersTableBody');
    
    if (!tbody) return;
    
    tbody.innerHTML = users.map((user, index) => {
        const roleClass = user.role === 'admin' ? 'rusak-berat' : 'tersedia';
        const roleText = user.role === 'admin' ? 'Admin' : 'User';
        const statusClass = user.status === 'active' ? 'dipinjam' : 'pending';
        const statusText = user.status === 'active' ? 'Aktif' : 'Nonaktif';
        
        return `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${user.username}</strong></td>
                <td>${user.name}</td>
                <td>${user.email || '-'}</td>
                <td>${user.nip || '-'}</td>
                <td><span class="status-badge ${roleClass}">${roleText}</span></td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    ${user.username !== 'admin' ? `
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-secondary" onclick="editUser('${user.id}')" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteUser('${user.id}')" title="Hapus">
                                <i class="fas fa-trash"></i>
                            </button>
                            <button class="btn btn-sm btn-primary" onclick="resetPassword('${user.id}')" title="Reset Password">
                                <i class="fas fa-key"></i>
                            </button>
                            <button class="btn btn-sm ${user.status === 'active' ? 'btn-warning' : 'btn-success'}" onclick="toggleUserStatus('${user.id}')" title="${user.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}">
                                <i class="fas ${user.status === 'active' ? 'fa-ban' : 'fa-check'}"></i>
                            </button>
                        </div>
                    ` : '<span class="text-secondary">-</span>'}
                </td>
            </tr>
        `;
    }).join('');
}

async function handleTambahUser(e) {
    e.preventDefault();
    
    try {
        const csrfToken = e.target.querySelector('input[name="csrf_token"]')?.value;
        if (typeof CSRF !== 'undefined') {
            CSRF.validateToken(csrfToken);
        }
    } catch (error) {
        showToast(error.message, 'error');
        return;
    }
    
    if (!checkAccess('admin')) return;
    
    const users = getUsers();
    const username = document.getElementById('newUsername').value.toLowerCase().trim();
    const email = document.getElementById('newEmail').value.toLowerCase().trim();
    
    // Check if username already exists
    if (users.find(u => u.username === username)) {
        showToast('Username sudah digunakan!', 'error');
        return;
    }
    
    // Check if email already exists
    if (email && users.find(u => u.email === email)) {
        showToast('Email sudah terdaftar!', 'error');
        return;
    }
    
    const newUser = {
        id: 'U' + Date.now(),
        username: username,
        password: await hashPassword(document.getElementById('newPassword').value),
        email: email,
        name: document.getElementById('newName').value,
        nip: document.getElementById('newNIP').value || '-',
        role: document.getElementById('newRole').value,
        status: 'active',
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    saveUsers(users);
    
    showToast('User berhasil ditambahkan!');
    closeModal('modalTambahUser');
    document.getElementById('formTambahUser').reset();
    loadUsersTable();
}

async function editUser(userId) {
    if (!checkAccess('admin')) return;
    
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    
    if (user) {
        const newName = await showPrompt('Nama Lengkap:', user.name, 'Edit Nama');
        if (newName !== null && newName.trim() !== '') {
            user.name = newName;
            
            const newNIP = await showPrompt('NIP:', user.nip, 'Edit NIP');
            if (newNIP !== null) {
                user.nip = newNIP || '-';
            }
            
            const newRole = await showPrompt('Role (admin/user):', user.role, 'Edit Role');
            if (newRole !== null && (newRole === 'admin' || newRole === 'user')) {
                user.role = newRole;
            }
            
            saveUsers(users);
            showToast('User berhasil diupdate!');
            loadUsersTable();
        }
    }
}

async function deleteUser(userId) {
    if (!checkAccess('admin')) return;
    
    const confirmed = await showConfirm('Yakin ingin menghapus user ini?', 'Konfirmasi Hapus');
    if (confirmed) {
        try {
            if (typeof BackupManager !== 'undefined') {
                BackupManager.createBackup('before_delete_user');
            }
            
            const users = getUsers().filter(u => u.id !== userId);
            saveUsers(users);
            showToast('User berhasil dihapus!');
            loadUsersTable();
        } catch (error) {
            console.error('❌ deleteUser error:', error);
            showToast('Gagal menghapus user: ' + error.message, 'error');
        }
    }
}

async function resetPassword(userId) {
    if (!checkAccess('admin')) return;
    
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    
    if (user) {
        const newPassword = await showPrompt('Masukkan password baru (min 6 karakter):', '', 'Reset Password');
        if (newPassword !== null) {
            if (newPassword.length < 6) {
                showToast('Password minimal 6 karakter!', 'error');
                return;
            }
            user.password = await hashPassword(newPassword);
            saveUsers(users);
            showToast('Password berhasil direset!');
        }
    }
}

async function toggleUserStatus(userId) {
    if (!checkAccess('admin')) return;
    
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    
    if (user) {
        const newStatus = user.status === 'active' ? 'inactive' : 'active';
        const action = newStatus === 'active' ? 'mengaktifkan' : 'menonaktifkan';
        
        const confirmed = await showConfirm(
            `Yakin ingin ${action} user "${user.name}"?`,
            `Konfirmasi ${action.charAt(0).toUpperCase() + action.slice(1)}`
        );
        if (confirmed) {
            user.status = newStatus;
            saveUsers(users);
            showToast(`User berhasil di${newStatus === 'active' ? 'aktifkan' : 'nonaktifkan'}!`);
            loadUsersTable();
        }
    }
}

// ==========================================
// AUTO-FILL USER INFO FOR FORMS
// ==========================================
function autoFillUserInfo() {
    if (currentUser && isUser() && !isGuest()) {
        // Auto-fill name in peminjaman form
        const namaPeminjam = document.getElementById('namaPeminjam');
        if (namaPeminjam && !namaPeminjam.value) {
            namaPeminjam.value = currentUser.name;
        }
        
        // Auto-fill NIP
        const nip = document.getElementById('nip');
        if (nip && !nip.value && currentUser.nip && currentUser.nip !== '-') {
            nip.value = currentUser.nip;
        }
        
        // Auto-fill pelapor kerusakan
        const pelaporKerusakan = document.getElementById('pelaporKerusakan');
        if (pelaporKerusakan && !pelaporKerusakan.value) {
            pelaporKerusakan.value = currentUser.name;
        }
    }
}

// ==========================================
// INIT USER FORM
// ==========================================
function initUserForm() {
    const formTambahUser = document.getElementById('formTambahUser');
    if (formTambahUser) {
        formTambahUser.addEventListener('submit', handleTambahUser);
    }
}

// Initialize auth when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initAuth();
    initUserForm();
});
