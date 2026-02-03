// ==========================================
// GOOGLE APPS SCRIPT - INVENTRACK DATABASE
// Spreadsheet sebagai sumber data utama
// ==========================================

const SPREADSHEET_ID = '175Qw4H27QhCnWxG9p8vx39vSqYitKg1hhKQHVnqpcHc';

function sanitizeInput(input) {
  if (typeof input === 'string') {
    return input.replace(/[<>'"]/g, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+=/gi, '')
                .substring(0, 10000);
  }
  if (typeof input === 'object' && input !== null) {
    var sanitized = {};
    for (var key in input) {
      if (input.hasOwnProperty(key)) {
        sanitized[sanitizeInput(key)] = sanitizeInput(input[key]);
      }
    }
    return sanitized;
  }
  return input;
}

function validateSheetName(sheetName) {
  var allowedSheets = ['Inventaris', 'Peminjaman', 'Kerusakan', 'Riwayat', 'Users'];
  return allowedSheets.indexOf(sheetName) !== -1;
}

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    var params = e.parameter || {};
    var action = sanitizeInput(params.action);
    var sheetName = sanitizeInput(params.sheet);
    var result = { success: true };
    
    if (sheetName && !validateSheetName(sheetName)) {
      return ContentService
        .createTextOutput(JSON.stringify({ 
          success: false, 
          error: 'Invalid sheet name' 
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === 'getAllData') {
      result = getAllSheets();
    }
    else if (action === 'getSheet' && sheetName) {
      result = getSheetData(sheetName);
    }
    else if (action === 'clearAndInsert' && sheetName && params.rows) {
      var rows = typeof params.rows === 'string' ? JSON.parse(params.rows) : params.rows;
      var sanitizedRows = rows.map(function(row) {
        return sanitizeInput(row);
      });
      result = saveData(sheetName, sanitizedRows);
    }
    else {
      result.message = 'InvenTrack API v2 - Spreadsheet as Database';
      result.actions = ['getAllData', 'getSheet', 'clearAndInsert'];
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Ambil semua data dari semua sheet
function getAllSheets() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var result = {
    success: true,
    timestamp: new Date().toISOString(),
    data: {
      inventaris: [],
      peminjaman: [],
      kerusakan: [],
      riwayat: [],
      users: []
    }
  };
  
  var sheets = ['Inventaris', 'Peminjaman', 'Kerusakan', 'Riwayat', 'Users'];
  
  sheets.forEach(function(name) {
    var sheet = ss.getSheetByName(name);
    if (sheet && sheet.getLastRow() > 1) {
      var data = sheet.getDataRange().getValues();
      var headers = data[0];
      var rows = [];
      
      for (var i = 1; i < data.length; i++) {
        var obj = {};
        for (var j = 0; j < headers.length; j++) {
          obj[headers[j]] = data[i][j];
        }
        rows.push(obj);
      }
      
      result.data[name.toLowerCase()] = rows;
    }
  });
  
  return result;
}

// Ambil data dari satu sheet
function getSheetData(sheetName) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(sheetName);
  
  if (!sheet || sheet.getLastRow() < 2) {
    return { success: true, data: [], count: 0 };
  }
  
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var rows = [];
  
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    rows.push(obj);
  }
  
  return { success: true, data: rows, count: rows.length };
}

// Simpan data ke sheet (clear & insert)
function saveData(sheetName, rows) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  
  if (!rows || rows.length === 0) {
    sheet.clear();
    return { success: true, message: 'Sheet cleared', count: 0 };
  }
  
  var headers = Object.keys(rows[0]);
  sheet.clear();
  
  // Header row
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#4F46E5')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold');
  sheet.setFrozenRows(1);
  
  // Data rows
  var data = rows.map(function(row) {
    return headers.map(function(h) {
      return row[h] !== undefined ? row[h] : '';
    });
  });
  
  if (data.length > 0) {
    sheet.getRange(2, 1, data.length, headers.length).setValues(data);
  }
  
  return { success: true, count: rows.length };
}

// Setup sheets awal
function setupSheets() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheets = ['Inventaris', 'Peminjaman', 'Kerusakan', 'Riwayat', 'Users'];
  
  sheets.forEach(function(name) {
    if (!ss.getSheetByName(name)) {
      ss.insertSheet(name);
    }
  });
  
  return { success: true, message: 'Sheets created' };
}
