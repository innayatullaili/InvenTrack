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
