const TestRunner = {
    tests: [],
    results: {
        passed: 0,
        failed: 0,
        skipped: 0,
        total: 0
    },
    
    suite(name, fn) {
        const suite = {
            name: name,
            tests: []
        };
        this.currentSuite = suite;
        fn();
        this.tests.push(suite);
        this.currentSuite = null;
    },
    
    test(name, fn) {
        if (!this.currentSuite) {
            console.error('test() must be called inside suite()');
            return;
        }
        this.currentSuite.tests.push({ name, fn, status: 'pending' });
    },
    
    async runAll() {
        this.results = { passed: 0, failed: 0, skipped: 0, total: 0 };
        const resultsContainer = document.getElementById('testResults');
        resultsContainer.innerHTML = '';
        
        for (const suite of this.tests) {
            const suiteEl = document.createElement('div');
            suiteEl.className = 'test-suite';
            
            const suiteHeader = document.createElement('div');
            suiteHeader.className = 'suite-header';
            suiteHeader.textContent = `📦 ${suite.name}`;
            suiteEl.appendChild(suiteHeader);
            
            for (const test of suite.tests) {
                this.results.total++;
                const testEl = document.createElement('div');
                testEl.className = 'test-item';
                
                const testName = document.createElement('div');
                testName.className = 'test-name';
                testName.textContent = test.name;
                
                const testStatus = document.createElement('div');
                testStatus.className = 'test-status';
                
                const startTime = performance.now();
                try {
                    await test.fn();
                    test.status = 'passed';
                    this.results.passed++;
                    testEl.className = 'test-item passed';
                    
                    const badge = document.createElement('span');
                    badge.className = 'badge passed';
                    badge.textContent = 'Passed';
                    testStatus.appendChild(badge);
                } catch (error) {
                    test.status = 'failed';
                    test.error = error;
                    this.results.failed++;
                    testEl.className = 'test-item failed';
                    
                    const badge = document.createElement('span');
                    badge.className = 'badge failed';
                    badge.textContent = 'Failed';
                    testStatus.appendChild(badge);
                    
                    const errorDetails = document.createElement('div');
                    errorDetails.className = 'error-details';
                    errorDetails.textContent = error.message || error;
                    testName.appendChild(errorDetails);
                }
                const endTime = performance.now();
                
                const timeEl = document.createElement('span');
                timeEl.className = 'test-time';
                timeEl.textContent = `${(endTime - startTime).toFixed(2)}ms`;
                testStatus.appendChild(timeEl);
                
                testEl.appendChild(testName);
                testEl.appendChild(testStatus);
                suiteEl.appendChild(testEl);
            }
            
            resultsContainer.appendChild(suiteEl);
        }
        
        this.updateStats();
    },
    
    updateStats() {
        document.getElementById('passedCount').textContent = this.results.passed;
        document.getElementById('failedCount').textContent = this.results.failed;
        document.getElementById('skippedCount').textContent = this.results.skipped;
        document.getElementById('totalCount').textContent = this.results.total;
    }
};

function expect(actual) {
    return {
        toBe(expected) {
            if (actual !== expected) {
                throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
            }
        },
        toEqual(expected) {
            if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
            }
        },
        toBeTruthy() {
            if (!actual) {
                throw new Error(`Expected truthy value, got ${JSON.stringify(actual)}`);
            }
        },
        toBeFalsy() {
            if (actual) {
                throw new Error(`Expected falsy value, got ${JSON.stringify(actual)}`);
            }
        },
        toContain(substring) {
            if (!actual.includes(substring)) {
                throw new Error(`Expected "${actual}" to contain "${substring}"`);
            }
        },
        not: {
            toContain(substring) {
                if (actual.includes(substring)) {
                    throw new Error(`Expected "${actual}" NOT to contain "${substring}"`);
                }
            },
            toBe(expected) {
                if (actual === expected) {
                    throw new Error(`Expected NOT ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
                }
            },
            toThrow() {
                try {
                    actual();
                    // Function did not throw, which is what we expect
                } catch (e) {
                    throw new Error(`Expected function NOT to throw, but it threw: ${e.message}`);
                }
            }
        },
        toThrow() {
            try {
                actual();
                throw new Error('Expected function to throw, but it did not');
            } catch (e) {
                if (e.message.startsWith('Expected function to throw')) {
                    throw e;
                }
            }
        },
        toBeNull() {
            if (actual !== null) {
                throw new Error(`Expected null, got ${JSON.stringify(actual)}`);
            }
        },
        toBeDefined() {
            if (actual === undefined) {
                throw new Error('Expected value to be defined');
            }
        },
        toBeUndefined() {
            if (actual !== undefined) {
                throw new Error(`Expected undefined, got ${JSON.stringify(actual)}`);
            }
        },
        toBeGreaterThan(expected) {
            if (actual <= expected) {
                throw new Error(`Expected ${actual} to be greater than ${expected}`);
            }
        },
        toBeLessThan(expected) {
            if (actual >= expected) {
                throw new Error(`Expected ${actual} to be less than ${expected}`);
            }
        }
    };
}

TestRunner.suite('DOMPurify Sanitization', () => {
    TestRunner.test('should remove script tags', () => {
        const dirty = '<script>alert("xss")</script>Hello';
        const clean = DOMPurify.sanitize(dirty);
        expect(clean).toBe('Hello');
    });
    
    TestRunner.test('should remove event handlers', () => {
        const dirty = '<div onclick="alert(1)">Click</div>';
        const clean = DOMPurify.sanitize(dirty);
        expect(clean).not.toContain('onclick');
    });
    
    TestRunner.test('should allow safe HTML tags', () => {
        const dirty = '<strong>Bold</strong> <em>Italic</em>';
        const clean = DOMPurify.sanitize(dirty);
        expect(clean).toBe('<strong>Bold</strong> <em>Italic</em>');
    });
    
    TestRunner.test('should remove javascript: protocol', () => {
        const dirty = '<a href="javascript:alert(1)">Link</a>';
        const clean = DOMPurify.sanitize(dirty);
        expect(clean).not.toContain('javascript:');
    });
});

TestRunner.suite('Password Hashing (bcrypt)', () => {
    TestRunner.test('should hash passwords', async () => {
        const plain = 'password123';
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(plain, salt);
        expect(hash).toBeDefined();
        expect(hash.length).toBeGreaterThan(50);
    });
    
    TestRunner.test('should verify correct password', async () => {
        const plain = 'password123';
        const hash = await bcrypt.hash(plain, 10);
        const isValid = await bcrypt.compare(plain, hash);
        expect(isValid).toBe(true);
    });
    
    TestRunner.test('should reject incorrect password', async () => {
        const plain = 'password123';
        const wrong = 'wrongpassword';
        const hash = await bcrypt.hash(plain, 10);
        const isValid = await bcrypt.compare(wrong, hash);
        expect(isValid).toBe(false);
    });
    
    TestRunner.test('should generate different hashes for same password', async () => {
        const plain = 'password123';
        const hash1 = await bcrypt.hash(plain, 10);
        const hash2 = await bcrypt.hash(plain, 10);
        expect(hash1 === hash2).toBe(false);
    });
});

TestRunner.suite('Encryption (CryptoJS)', () => {
    TestRunner.test('should encrypt data', () => {
        const data = { username: 'admin', password: 'secret' };
        const encrypted = CryptoManager.encrypt(data);
        expect(encrypted).toBeDefined();
        expect(typeof encrypted).toBe('string');
    });
    
    TestRunner.test('should decrypt data correctly', () => {
        const data = { username: 'admin', role: 'admin' };
        const encrypted = CryptoManager.encrypt(data);
        const decrypted = CryptoManager.decrypt(encrypted);
        expect(decrypted).toEqual(data);
    });
    
    TestRunner.test('should handle arrays', () => {
        const data = [1, 2, 3, 4, 5];
        const encrypted = CryptoManager.encrypt(data);
        const decrypted = CryptoManager.decrypt(encrypted);
        expect(decrypted).toEqual(data);
    });
    
    TestRunner.test('should handle complex objects', () => {
        const data = {
            id: 'U001',
            user: { name: 'Admin', role: 'admin' },
            permissions: ['read', 'write', 'delete']
        };
        const encrypted = CryptoManager.encrypt(data);
        const decrypted = CryptoManager.decrypt(encrypted);
        expect(decrypted).toEqual(data);
    });
});

TestRunner.suite('CSRF Protection', () => {
    TestRunner.test('should generate CSRF token', () => {
        if (typeof CSRF !== 'undefined') {
            const token = CSRF.generateToken();
            expect(token).toBeDefined();
            expect(token.startsWith('csrf_')).toBe(true);
        } else {
            throw new Error('CSRF object not defined');
        }
    });
    
    TestRunner.test('should store token in sessionStorage', () => {
        if (typeof CSRF !== 'undefined') {
            const token = CSRF.setToken();
            const stored = sessionStorage.getItem('csrf_token');
            expect(stored).toBe(token);
        } else {
            throw new Error('CSRF object not defined');
        }
    });
    
    TestRunner.test('should validate correct token', () => {
        if (typeof CSRF !== 'undefined') {
            const token = CSRF.setToken();
            expect(() => CSRF.validateToken(token)).not.toThrow();
        } else {
            throw new Error('CSRF object not defined');
        }
    });
    
    TestRunner.test('should reject invalid token', () => {
        if (typeof CSRF !== 'undefined') {
            CSRF.setToken();
            expect(() => CSRF.validateToken('invalid_token')).toThrow();
        } else {
            throw new Error('CSRF object not defined');
        }
    });
});

TestRunner.suite('Data Validation', () => {
    TestRunner.test('should validate email format', () => {
        const validEmail = 'user@example.com';
        const invalidEmail = 'notanemail';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        expect(emailRegex.test(validEmail)).toBe(true);
        expect(emailRegex.test(invalidEmail)).toBe(false);
    });
    
    TestRunner.test('should validate required fields', () => {
        const data = { name: 'John', email: 'john@example.com' };
        expect(data.name).toBeDefined();
        expect(data.email).toBeDefined();
        expect(data.phone).toBeUndefined();
    });
    
    TestRunner.test('should sanitize special characters', () => {
        const input = '<script>alert(1)</script>';
        const sanitized = input.replace(/[<>'"]/g, '');
        expect(sanitized).toBe('scriptalert(1)/script');
    });
});

TestRunner.suite('Data Helpers (data.js)', () => {
    TestRunner.test('capitalizeStatus should capitalize first letter', () => {
        if (typeof capitalizeStatus === 'undefined') {
            throw new Error('capitalizeStatus not loaded - data.js required');
        }
        expect(capitalizeStatus('TERSEDIA')).toBe('Tersedia');
        expect(capitalizeStatus('dipinjam')).toBe('Dipinjam');
        expect(capitalizeStatus('RuSak RiNGAN')).toBe('Rusak ringan');
    });
    
    TestRunner.test('capitalizeStatus should handle edge cases', () => {
        if (typeof capitalizeStatus === 'undefined') {
            throw new Error('capitalizeStatus not loaded');
        }
        expect(capitalizeStatus('')).toBe('');
        expect(capitalizeStatus(null)).toBe('');
        expect(capitalizeStatus(undefined)).toBe('');
    });
    
    TestRunner.test('generateId should create unique IDs', () => {
        if (typeof generateId === 'undefined') {
            throw new Error('generateId not loaded - data.js required');
        }
        const id1 = generateId('TEST');
        const id2 = generateId('TEST');
        expect(id1.startsWith('TEST')).toBe(true);
        expect(id2.startsWith('TEST')).toBe(true);
        expect(id1 === id2).toBe(false);
    });
    
    TestRunner.test('statusEquals should compare case-insensitively', () => {
        if (typeof statusEquals === 'undefined') {
            throw new Error('statusEquals not loaded - data.js required');
        }
        expect(statusEquals('Tersedia', 'tersedia')).toBe(true);
        expect(statusEquals('DIPINJAM', 'dipinjam')).toBe(true);
        expect(statusEquals('Aktif', 'AKTIF')).toBe(true);
        expect(statusEquals('Tersedia', 'Dipinjam')).toBe(false);
    });
    
    TestRunner.test('statusNotEquals should return inverse', () => {
        if (typeof statusNotEquals === 'undefined') {
            throw new Error('statusNotEquals not loaded - data.js required');
        }
        expect(statusNotEquals('Tersedia', 'Dipinjam')).toBe(true);
        expect(statusNotEquals('Aktif', 'aktif')).toBe(false);
    });
});

TestRunner.suite('Data Normalizers (data.js)', () => {
    TestRunner.test('normalizeInventaris should normalize raw data', () => {
        if (typeof normalizeInventaris === 'undefined') {
            throw new Error('normalizeInventaris not loaded - data.js required');
        }
        const raw = { id: 'INV001', nama: 'Laptop Test', status: 'TERSEDIA', kondisi: 'baik' };
        const normalized = normalizeInventaris(raw);
        expect(normalized.status).toBe('Tersedia');
        expect(normalized.kondisi).toBe('Baik');
    });
    
    TestRunner.test('normalizeInventaris should provide defaults', () => {
        if (typeof normalizeInventaris === 'undefined') {
            throw new Error('normalizeInventaris not loaded');
        }
        const raw = { nama: 'Test Laptop' };
        const normalized = normalizeInventaris(raw);
        expect(normalized.status).toBe('Tersedia');
        expect(normalized.kondisi).toBe('Baik');
        expect(normalized.id).toBeDefined();
    });
    
    TestRunner.test('normalizePeminjaman should normalize status', () => {
        if (typeof normalizePeminjaman === 'undefined') {
            throw new Error('normalizePeminjaman not loaded - data.js required');
        }
        const raw = { nama: 'John Doe', status: 'AKTIF' };
        const normalized = normalizePeminjaman(raw);
        expect(normalized.status).toBe('Aktif');
        expect(normalized.nama).toBe('John Doe');
    });
    
    TestRunner.test('normalizeKerusakan should normalize status', () => {
        if (typeof normalizeKerusakan === 'undefined') {
            throw new Error('normalizeKerusakan not loaded - data.js required');
        }
        const raw = { laptopId: 'INV001', status: 'PENDING' };
        const normalized = normalizeKerusakan(raw);
        expect(normalized.status).toBe('Pending');
    });
    
    TestRunner.test('normalizeAllData should process all arrays', () => {
        if (typeof normalizeAllData === 'undefined') {
            throw new Error('normalizeAllData not loaded - data.js required');
        }
        const rawData = {
            inventaris: [{ nama: 'Laptop 1', status: 'TERSEDIA' }],
            peminjaman: [{ nama: 'User 1', status: 'AKTIF' }],
            kerusakan: [],
            riwayat: []
        };
        const normalized = normalizeAllData(rawData);
        expect(normalized.inventaris.length).toBe(1);
        expect(normalized.inventaris[0].status).toBe('Tersedia');
        expect(normalized.peminjaman[0].status).toBe('Aktif');
    });
});

TestRunner.suite('Data Validation (data.js)', () => {
    TestRunner.test('validateDataConnections should fix laptop status for active loans', () => {
        if (typeof validateDataConnections === 'undefined') {
            throw new Error('validateDataConnections not loaded - data.js required');
        }
        const data = {
            inventaris: [
                { id: 'INV001', nama: 'Laptop 1', status: 'Tersedia', kondisi: 'Baik' }
            ],
            peminjaman: [
                { id: 'PEM001', laptopId: 'INV001', status: 'Aktif', nama: 'User 1' }
            ],
            kerusakan: [],
            riwayat: []
        };
        const validated = validateDataConnections(data, false);
        expect(validated.inventaris[0].status).toBe('Dipinjam');
        expect(validated._wasModified).toBe(true);
    });
    
    TestRunner.test('validateDataConnections should fix status when no active loan', () => {
        if (typeof validateDataConnections === 'undefined') {
            throw new Error('validateDataConnections not loaded');
        }
        const data = {
            inventaris: [
                { id: 'INV001', nama: 'Laptop 1', status: 'Dipinjam', kondisi: 'Baik' }
            ],
            peminjaman: [],
            kerusakan: [],
            riwayat: []
        };
        const validated = validateDataConnections(data, false);
        expect(validated.inventaris[0].status).toBe('Tersedia');
        expect(validated._wasModified).toBe(true);
    });
    
    TestRunner.test('validateDataConnections should clean orphaned kerusakan when enabled', () => {
        if (typeof validateDataConnections === 'undefined') {
            throw new Error('validateDataConnections not loaded');
        }
        const data = {
            inventaris: [
                { id: 'INV001', nama: 'Laptop 1', status: 'Tersedia', kondisi: 'Baik' }
            ],
            peminjaman: [],
            kerusakan: [
                { id: 'KER001', laptopId: 'NONEXISTENT', status: 'Pending' }
            ],
            riwayat: []
        };
        const validated = validateDataConnections(data, true);
        expect(validated.kerusakan.length).toBe(0);
        expect(validated._wasModified).toBe(true);
    });
});

async function runAllTests() {
    const btn = document.getElementById('runTestsBtn');
    btn.disabled = true;
    btn.textContent = '⏳ Running Tests...';
    
    await TestRunner.runAll();
    
    btn.disabled = false;
    btn.textContent = '▶️ Run All Tests';
    
    const { passed, failed, total } = TestRunner.results;
    if (failed === 0) {
        btn.textContent = `✅ All ${total} Tests Passed!`;
        btn.style.background = '#10B981';
    } else {
        btn.textContent = `❌ ${failed}/${total} Tests Failed`;
        btn.style.background = '#EF4444';
    }
}

console.log('✅ Test suite loaded. Click "Run All Tests" to start.');
