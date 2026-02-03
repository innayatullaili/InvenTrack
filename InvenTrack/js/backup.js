const BackupManager = {
    MAX_BACKUPS: 5,
    
    createBackup(reason = 'manual') {
        try {
            const backup = {
                id: 'backup_' + Date.now(),
                timestamp: new Date().toISOString(),
                reason: reason,
                data: {
                    inventaris: getData('inventaris'),
                    peminjaman: getData('peminjaman'),
                    kerusakan: getData('kerusakan'),
                    riwayat: getData('riwayat'),
                    users: getData('users')
                }
            };
            
            const backups = this.getBackups();
            backups.unshift(backup);
            
            if (backups.length > this.MAX_BACKUPS) {
                backups.splice(this.MAX_BACKUPS);
            }
            
            localStorage.setItem('backups', JSON.stringify(backups));
            console.log('✅ Backup created:', backup.id, 'Reason:', reason);
            return backup.id;
        } catch (error) {
            console.error('❌ createBackup error:', error);
            throw error;
        }
    },
    
    getBackups() {
        try {
            const backups = localStorage.getItem('backups');
            return backups ? JSON.parse(backups) : [];
        } catch (error) {
            console.error('❌ getBackups error:', error);
            return [];
        }
    },
    
    restoreBackup(backupId) {
        try {
            const backups = this.getBackups();
            const backup = backups.find(b => b.id === backupId);
            
            if (!backup) {
                throw new Error('Backup tidak ditemukan');
            }
            
            this.createBackup('before_restore');
            
            Object.keys(backup.data).forEach(key => {
                setData(key, backup.data[key]);
            });
            
            console.log('✅ Backup restored:', backupId);
            
            if (typeof showToast === 'function') {
                showToast('Backup berhasil dipulihkan!', 'success');
            }
            
            setTimeout(() => {
                location.reload();
            }, 1500);
            
            return true;
        } catch (error) {
            console.error('❌ restoreBackup error:', error);
            if (typeof showToast === 'function') {
                showToast('Gagal memulihkan backup: ' + error.message, 'error');
            }
            throw error;
        }
    },
    
    deleteBackup(backupId) {
        try {
            const backups = this.getBackups();
            const index = backups.findIndex(b => b.id === backupId);
            
            if (index === -1) {
                throw new Error('Backup tidak ditemukan');
            }
            
            backups.splice(index, 1);
            localStorage.setItem('backups', JSON.stringify(backups));
            
            console.log('✅ Backup deleted:', backupId);
            return true;
        } catch (error) {
            console.error('❌ deleteBackup error:', error);
            throw error;
        }
    },
    
    downloadBackup(backupId) {
        try {
            const backups = this.getBackups();
            const backup = backups.find(b => b.id === backupId);
            
            if (!backup) {
                throw new Error('Backup tidak ditemukan');
            }
            
            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            
            const dateStr = backup.timestamp.split('T')[0];
            const timeStr = backup.timestamp.split('T')[1].substring(0, 5).replace(':', '-');
            link.download = `inventrack_backup_${dateStr}_${timeStr}.json`;
            
            link.click();
            URL.revokeObjectURL(link.href);
            
            console.log('✅ Backup downloaded:', backupId);
            
            if (typeof showToast === 'function') {
                showToast('Backup berhasil diunduh!', 'success');
            }
        } catch (error) {
            console.error('❌ downloadBackup error:', error);
            if (typeof showToast === 'function') {
                showToast('Gagal mengunduh backup: ' + error.message, 'error');
            }
        }
    },
    
    downloadCurrentData() {
        try {
            const currentData = {
                id: 'export_' + Date.now(),
                timestamp: new Date().toISOString(),
                reason: 'manual_export',
                data: {
                    inventaris: getData('inventaris'),
                    peminjaman: getData('peminjaman'),
                    kerusakan: getData('kerusakan'),
                    riwayat: getData('riwayat'),
                    users: getData('users')
                }
            };
            
            const blob = new Blob([JSON.stringify(currentData, null, 2)], { type: 'application/json' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0];
            const timeStr = now.toTimeString().substring(0, 5).replace(':', '-');
            link.download = `inventrack_export_${dateStr}_${timeStr}.json`;
            
            link.click();
            URL.revokeObjectURL(link.href);
            
            console.log('✅ Current data exported');
            
            if (typeof showToast === 'function') {
                showToast('Data berhasil diekspor!', 'success');
            }
        } catch (error) {
            console.error('❌ downloadCurrentData error:', error);
            if (typeof showToast === 'function') {
                showToast('Gagal mengekspor data: ' + error.message, 'error');
            }
        }
    },
    
    uploadBackup(file) {
        return new Promise((resolve, reject) => {
            try {
                const reader = new FileReader();
                
                reader.onload = (e) => {
                    try {
                        const backup = JSON.parse(e.target.result);
                        
                        if (!backup.data || !backup.timestamp) {
                            throw new Error('Format backup tidak valid');
                        }
                        
                        backup.id = 'backup_uploaded_' + Date.now();
                        backup.reason = 'uploaded';
                        
                        const backups = this.getBackups();
                        backups.unshift(backup);
                        
                        if (backups.length > this.MAX_BACKUPS) {
                            backups.splice(this.MAX_BACKUPS);
                        }
                        
                        localStorage.setItem('backups', JSON.stringify(backups));
                        
                        console.log('✅ Backup uploaded:', backup.id);
                        
                        if (typeof showToast === 'function') {
                            showToast('Backup berhasil diunggah!', 'success');
                        }
                        
                        resolve(backup.id);
                    } catch (error) {
                        reject(error);
                    }
                };
                
                reader.onerror = () => {
                    reject(new Error('Gagal membaca file'));
                };
                
                reader.readAsText(file);
            } catch (error) {
                reject(error);
            }
        });
    },
    
    getBackupSize(backupId) {
        try {
            const backups = this.getBackups();
            const backup = backups.find(b => b.id === backupId);
            
            if (!backup) {
                return 0;
            }
            
            const jsonString = JSON.stringify(backup);
            const bytes = new Blob([jsonString]).size;
            
            if (bytes < 1024) return bytes + ' B';
            if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
            return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
        } catch (error) {
            console.error('❌ getBackupSize error:', error);
            return '0 B';
        }
    },
    
    formatTimestamp(isoString) {
        try {
            const date = new Date(isoString);
            const options = {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            };
            return date.toLocaleDateString('id-ID', options);
        } catch (error) {
            return isoString;
        }
    },
    
    getReasonText(reason) {
        const reasons = {
            'manual': 'Manual Backup',
            'before_restore': 'Sebelum Restore',
            'before_delete': 'Sebelum Hapus',
            'uploaded': 'File Upload',
            'auto': 'Backup Otomatis'
        };
        return reasons[reason] || reason;
    }
};

console.log('✅ backup.js loaded');
