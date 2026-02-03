# InvenTrack Test Suite

Comprehensive test suite untuk memvalidasi security features dan core functionality InvenTrack.

## 🚀 Running Tests

1. **Browser-based (Recommended)**
   ```
   Buka file: tests/test-runner.html di browser
   Klik tombol "Run All Tests"
   ```

2. **View Results**
   - Passed tests: Hijau (✅)
   - Failed tests: Merah (❌)
   - Test duration: Ditampilkan dalam milliseconds

## 📋 Test Suites

### 1. DOMPurify Sanitization (4 tests)
- ✅ Remove script tags
- ✅ Remove event handlers
- ✅ Allow safe HTML tags
- ✅ Remove javascript: protocol

### 2. Password Hashing - bcrypt (4 tests)
- ✅ Hash passwords
- ✅ Verify correct password
- ✅ Reject incorrect password
- ✅ Generate different hashes for same password

### 3. Encryption - CryptoJS (4 tests)
- ✅ Encrypt data
- ✅ Decrypt data correctly
- ✅ Handle arrays
- ✅ Handle complex objects

### 4. CSRF Protection (4 tests)
- ✅ Generate CSRF token
- ✅ Store token in sessionStorage
- ✅ Validate correct token
- ✅ Reject invalid token

### 5. Data Validation (3 tests)
- ✅ Validate email format
- ✅ Validate required fields
- ✅ Sanitize special characters

## 📊 Coverage

**Total Tests:** 19  
**Estimated Coverage:** ~65% of security features

### Covered Areas:
- ✅ XSS Protection (DOMPurify)
- ✅ Password Hashing (bcrypt)
- ✅ Data Encryption (CryptoJS AES)
- ✅ CSRF Token Management
- ✅ Input Validation
- ✅ Sanitization

### Not Covered (Manual Testing Required):
- ⏭️ UI Interactions
- ⏭️ Google Apps Script Integration
- ⏭️ Chart.js Rendering
- ⏭️ Modal Dialogs
- ⏭️ File Upload/Download
- ⏭️ LocalStorage Operations
- ⏭️ Backup/Restore Functionality

## 🔧 Adding New Tests

```javascript
TestRunner.suite('Suite Name', () => {
    TestRunner.test('should do something', () => {
        const result = someFunction();
        expect(result).toBe(expectedValue);
    });
    
    TestRunner.test('should handle async', async () => {
        const result = await asyncFunction();
        expect(result).toBeDefined();
    });
});
```

## 🎯 Assertions Available

- `expect(value).toBe(expected)` - Strict equality (===)
- `expect(value).toEqual(expected)` - Deep equality
- `expect(value).toBeTruthy()` - Truthy check
- `expect(value).toBeFalsy()` - Falsy check
- `expect(value).toContain(substring)` - String contains
- `expect(fn).toThrow()` - Function throws error
- `expect(value).toBeNull()` - Null check
- `expect(value).toBeDefined()` - Defined check
- `expect(value).toBeUndefined()` - Undefined check
- `expect(value).toBeGreaterThan(n)` - Number comparison
- `expect(value).toBeLessThan(n)` - Number comparison

## 📝 Best Practices

1. **Test Independence**: Each test should be independent
2. **Clear Descriptions**: Use descriptive test names
3. **One Assertion**: Prefer one assertion per test
4. **Clean Up**: Reset state if needed
5. **Fast Execution**: Keep tests fast (<100ms each)

## 🐛 Troubleshooting

**Q: Tests tidak jalan?**  
A: Pastikan semua dependencies (DOMPurify, bcrypt, CryptoJS) sudah loaded

**Q: CSRF tests gagal?**  
A: Buka dari file app.js yang memiliki CSRF object

**Q: Encryption tests gagal?**  
A: Pastikan crypto.js sudah loaded dengan benar

## 📈 Future Improvements

- [ ] Integration tests untuk form submission
- [ ] E2E tests untuk user flows
- [ ] Performance benchmarks
- [ ] Coverage reporting
- [ ] CI/CD integration
- [ ] Screenshot comparison tests
- [ ] API mocking untuk Google Sheets

---

**Note:** Test suite ini fokus pada unit testing security features. Manual testing tetap diperlukan untuk UI/UX validation.
