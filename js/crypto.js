const CryptoManager = {
    SECRET_KEY: 'InvenTrack_BPS_2024_SecureKey_' + btoa(window.location.hostname),
    
    encrypt(data) {
        if (typeof CryptoJS === 'undefined') {
            console.warn('CryptoJS not loaded, storing data unencrypted (INSECURE!)');
            return JSON.stringify(data);
        }
        
        try {
            const jsonString = JSON.stringify(data);
            const encrypted = CryptoJS.AES.encrypt(jsonString, this.SECRET_KEY).toString();
            return encrypted;
        } catch (error) {
            console.error('Encryption error:', error);
            return JSON.stringify(data);
        }
    },
    
    decrypt(encryptedData) {
        if (typeof CryptoJS === 'undefined') {
            console.warn('CryptoJS not loaded, reading unencrypted data');
            try {
                return JSON.parse(encryptedData);
            } catch {
                return encryptedData;
            }
        }
        
        if (!encryptedData) return null;
        
        try {
            if (encryptedData.startsWith('[') || encryptedData.startsWith('{')) {
                return JSON.parse(encryptedData);
            }
            
            const decrypted = CryptoJS.AES.decrypt(encryptedData, this.SECRET_KEY);
            const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
            
            if (!jsonString) {
                console.warn('Decryption returned empty string, data may be corrupted');
                return null;
            }
            
            return JSON.parse(jsonString);
        } catch (error) {
            console.error('Decryption error:', error);
            try {
                return JSON.parse(encryptedData);
            } catch {
                return null;
            }
        }
    },
    
    migrateToEncrypted() {
        const keysToEncrypt = ['users', 'currentUser', 'peminjaman', 'inventaris', 'kerusakan', 'riwayat'];
        let migrated = 0;
        
        keysToEncrypt.forEach(key => {
            const data = localStorage.getItem(key);
            if (data && (data.startsWith('[') || data.startsWith('{'))) {
                try {
                    const parsed = JSON.parse(data);
                    const encrypted = this.encrypt(parsed);
                    localStorage.setItem(key, encrypted);
                    localStorage.setItem(`${key}_encrypted`, 'true');
                    migrated++;
                } catch (error) {
                    console.error(`Failed to migrate ${key}:`, error);
                }
            }
        });
        
        if (migrated > 0) {
            console.log(`✅ Migrated ${migrated} localStorage items to encrypted format`);
        }
        
        return migrated;
    },
    
    isEncrypted(key) {
        return localStorage.getItem(`${key}_encrypted`) === 'true';
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CryptoManager;
}
