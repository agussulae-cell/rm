var SHEET_USERS = "Users";
var SHEET_MASTER = "Master";
var SHEET_HISTORY = "History";

function doGet(e) {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Stock Control App')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getSpreadsheet() {
  // Ganti dengan SpreadsheetApp.openById("ID_SPREADSHEET") jika menggunakan file terpisah
  return SpreadsheetApp.getActiveSpreadsheet();
}

function setupDatabase() {
  const ss = getSpreadsheet();
  
  let sheetUsers = ss.getSheetByName(SHEET_USERS);
  if (!sheetUsers) {
    sheetUsers = ss.insertSheet(SHEET_USERS);
    sheetUsers.appendRow(['username', 'password', 'fullname', 'role']);
    sheetUsers.appendRow(['admin', '123', 'Super Admin', 'PPIC']);
    sheetUsers.appendRow(['in_user', '123', 'User IN', 'IN']);
    sheetUsers.appendRow(['out_user', '123', 'User OUT', 'OUT']);
    sheetUsers.setFrozenRows(1);
  }
  
  let sheetMaster = ss.getSheetByName(SHEET_MASTER);
  if (!sheetMaster) {
    sheetMaster = ss.insertSheet(SHEET_MASTER);
    sheetMaster.appendRow(['part_no', 'part_name', 'initial_stock', 'min_stock', 'max_stock']);
    sheetMaster.setFrozenRows(1);
  } else {
    var headers = sheetMaster.getRange(1, 1, 1, sheetMaster.getLastColumn()).getValues()[0];
    if (headers.indexOf('min_stock') === -1) {
      sheetMaster.getRange(1, headers.length + 1).setValue('min_stock');
      sheetMaster.getRange(1, headers.length + 2).setValue('max_stock');
    }
  }
  
  let sheetHistory = ss.getSheetByName(SHEET_HISTORY);
  if (!sheetHistory) {
    sheetHistory = ss.insertSheet(SHEET_HISTORY);
    sheetHistory.appendRow(['id', 'timestamp', 'type', 'username', 'part_no', 'qty', 'remark']);
    sheetHistory.setFrozenRows(1);
  } else {
    var headers = sheetHistory.getRange(1, 1, 1, sheetHistory.getLastColumn()).getValues()[0];
    if (headers.indexOf('remark') === -1) {
      sheetHistory.getRange(1, headers.length + 1).setValue('remark');
    }
  }
}

function loginUser(username, password) {
  var sheet = getSpreadsheet().getSheetByName(SHEET_USERS);
  if(!sheet) return { success: false, message: 'Jalankan setupDatabase() dulu' };
  
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == username && data[i][1] == password) {
      return { success: true, user: { username: data[i][0], fullname: data[i][2], role: data[i][3] } };
    }
  }
  return { success: false, message: 'Username atau Password salah!' };
}

function getProductionDate(d) {
  var prod = new Date(d.getTime());
  var h = prod.getHours();
  // Jika jam < 7 pagi, dianggap produksi hari sebelumnya
  if (h < 7) {
    prod.setDate(prod.getDate() - 1);
  }
  prod.setHours(0,0,0,0);
  return prod;
}

function getShift(d) {
  var h = d.getHours();
  var m = d.getMinutes();
  // Shift 1: 07:00 - 19:29
  if ( (h > 7 || (h === 7 && m >= 0)) && (h < 19 || (h === 19 && m <= 29)) ) {
    return 1;
  }
  return 2;
}

function getDashboardData() {
  var ss = getSpreadsheet();
  var masterData = ss.getSheetByName(SHEET_MASTER).getDataRange().getValues();
  var historyData = ss.getSheetByName(SHEET_HISTORY).getDataRange().getValues();
  
  var stockMap = {};
  // Map Columns
  var mapCol = { part_no: 0, part_name: 1, initial: 2, min: 3, max: 4 };
  var headers = masterData[0] || [];
  for(var i=0; i<headers.length; i++) {
    if(headers[i] == 'min_stock') mapCol.min = i;
    if(headers[i] == 'max_stock') mapCol.max = i;
  }

  for (var i = 1; i < masterData.length; i++) {
    var pNo = masterData[i][mapCol.part_no];
    if (!pNo) continue;
    stockMap[pNo] = {
      part_no: pNo,
      part_name: masterData[i][mapCol.part_name],
      initial_stock: Number(masterData[i][mapCol.initial]) || 0,
      min_stock: Number(masterData[i][mapCol.min]) || 0,
      max_stock: Number(masterData[i][mapCol.max]) || 0,
      in_qty: 0,
      out_qty: 0
    };
  }
  
  var shiftData = { s1_in: 0, s1_out: 0, s2_in: 0, s2_out: 0 };
  var todayProd = getProductionDate(new Date());
  var todayTransactions = [];

  for (var i = 1; i < historyData.length; i++) {
    var tsStr = historyData[i][1];
    var type = historyData[i][2];
    var pNo = historyData[i][4];
    var qty = Number(historyData[i][5]) || 0;
    
    // Summing totals (Ignore LOG_MASTER / LOG_REVISI for total qty)
    if (stockMap[pNo] && (type === 'IN' || type === 'OUT')) {
      if (type === 'IN') stockMap[pNo].in_qty += qty;
      else if (type === 'OUT') stockMap[pNo].out_qty += qty;
    }

    // Hari ini (Shift calc)
    if (type === 'IN' || type === 'OUT') {
      var ts = new Date(tsStr);
      if (getProductionDate(ts).getTime() === todayProd.getTime()) {
        var shift = getShift(ts);
        if (shift === 1 && type === 'IN') shiftData.s1_in += qty;
        if (shift === 1 && type === 'OUT') shiftData.s1_out += qty;
        if (shift === 2 && type === 'IN') shiftData.s2_in += qty;
        if (shift === 2 && type === 'OUT') shiftData.s2_out += qty;
        
        todayTransactions.push({
          timestamp: tsStr,
          type: type,
          part_no: pNo,
          part_name: stockMap[pNo] ? stockMap[pNo].part_name : '-',
          qty: qty,
          username: historyData[i][3],
          shift: shift,
          remark: historyData[i][6] || '-'
        });
      }
    }
  }

  todayTransactions.sort(function(a, b) {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
  
  var resultItems = [];
  var overStockCount = 0;
  var criticalStockCount = 0;

  for (var key in stockMap) {
    var s = stockMap[key];
    s.current_stock = s.initial_stock + s.in_qty - s.out_qty;
    
    // Overstock / Critical logic
    if (s.max_stock > 0 && s.current_stock > s.max_stock) overStockCount++;
    if (s.min_stock > 0 && s.current_stock <= s.min_stock) criticalStockCount++;
    
    resultItems.push(s);
  }
  
  return {
    items: resultItems,
    shiftData: shiftData,
    overStockCount: overStockCount,
    criticalStockCount: criticalStockCount,
    todayTransactions: todayTransactions
  };
}

function recordTransaction(type, part_no, qty, username, remark) {
  var sheet = getSpreadsheet().getSheetByName(SHEET_HISTORY);
  var id = Utilities.getUuid();
  sheet.appendRow([id, new Date().toISOString(), type, username, part_no, Number(qty), remark || ""]);
  return { success: true };
}

function getHistory() {
  var data = getSpreadsheet().getSheetByName(SHEET_HISTORY).getDataRange().getValues();
  var master = getSpreadsheet().getSheetByName(SHEET_MASTER).getDataRange().getValues();
  
  var partNames = {};
  for (var i = 1; i < master.length; i++) {
    partNames[master[i][0]] = master[i][1];
  }
  
  var res = [];
  for (var i = 1; i < data.length; i++) {
    res.push({
      id: data[i][0],
      timestamp: data[i][1],
      type: data[i][2],
      username: data[i][3],
      part_no: data[i][4],
      part_name: partNames[data[i][4]] || '-',
      qty: data[i][5],
      remark: data[i][6] || '-'
    });
  }
  return res.reverse();
}

function updateHistoryQty(id, newQty, username) {
  var sheet = getSpreadsheet().getSheetByName(SHEET_HISTORY);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      var oldQty = data[i][5];
      var partNo = data[i][4];
      
      // Update data aslinya agar kalkulasi balance berubah
      sheet.getRange(i + 1, 6).setValue(Number(newQty));
      
      // Catat di history bahwa admin merevisi
      var logId = Utilities.getUuid();
      var remark = 'Rev: ' + oldQty + ' -> ' + newQty;
      sheet.appendRow([logId, new Date().toISOString(), 'LOG_REVISI', username, partNo, 0, remark]);
      
      return { success: true };
    }
  }
  return { success: false, message: 'Data tidak ditemukan' };
}

function saveMaster(part_no, part_name, initial_stock, min_stock, max_stock, username) {
  var sheet = getSpreadsheet().getSheetByName(SHEET_MASTER);
  var data = sheet.getDataRange().getValues();
  var found = false;
  
  var mapCol = { part_no: 0, part_name: 1, initial: 2, min: 3, max: 4 };
  var headers = data[0] || [];
  for(var i=0; i<headers.length; i++) {
    if(headers[i] == 'min_stock') mapCol.min = i;
    if(headers[i] == 'max_stock') mapCol.max = i;
  }

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === part_no) {
      sheet.getRange(i + 1, mapCol.part_name + 1).setValue(part_name);
      sheet.getRange(i + 1, mapCol.initial + 1).setValue(Number(initial_stock));
      sheet.getRange(i + 1, mapCol.min + 1).setValue(Number(min_stock));
      sheet.getRange(i + 1, mapCol.max + 1).setValue(Number(max_stock));
      found = true;
      break;
    }
  }
  if (!found) {
    var newRow = [];
    newRow[mapCol.part_no] = part_no;
    newRow[mapCol.part_name] = part_name;
    newRow[mapCol.initial] = Number(initial_stock);
    newRow[mapCol.min] = Number(min_stock);
    newRow[mapCol.max] = Number(max_stock);
    sheet.appendRow(newRow);
  }
  
  // Log perubahan admin ke history
  var histSheet = getSpreadsheet().getSheetByName(SHEET_HISTORY);
  histSheet.appendRow([Utilities.getUuid(), new Date().toISOString(), 'LOG_MASTER', username, part_no, 0, 'Update Master']);
  
  return { success: true };
}

function uploadCSV(partsArray, username) {
  var sheet = getSpreadsheet().getSheetByName(SHEET_MASTER);
  var histSheet = getSpreadsheet().getSheetByName(SHEET_HISTORY);
  var data = sheet.getDataRange().getValues();
  
  var mapCol = { part_no: 0, part_name: 1, initial: 2, min: 3, max: 4 };
  var headers = data[0] || [];
  for(var i=0; i<headers.length; i++) {
    if(headers[i] == 'min_stock') mapCol.min = i;
    if(headers[i] == 'max_stock') mapCol.max = i;
  }

  var added = 0;
  var updated = 0;

  for(var p=0; p<partsArray.length; p++) {
    var part = partsArray[p];
    var found = false;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] == part.partNo) {
        sheet.getRange(i + 1, mapCol.part_name + 1).setValue(part.partName);
        sheet.getRange(i + 1, mapCol.initial + 1).setValue(Number(part.initialStock));
        sheet.getRange(i + 1, mapCol.min + 1).setValue(Number(part.minStock));
        sheet.getRange(i + 1, mapCol.max + 1).setValue(Number(part.maxStock));
        histSheet.appendRow([Utilities.getUuid(), new Date().toISOString(), 'LOG_MASTER', username, part.partNo, 0, 'Update via CSV']);
        updated++;
        found = true;
        break;
      }
    }
    
    if (!found) {
      var newRow = [];
      newRow[mapCol.part_no] = part.partNo;
      newRow[mapCol.part_name] = part.partName;
      newRow[mapCol.initial] = Number(part.initialStock);
      newRow[mapCol.min] = Number(part.minStock);
      newRow[mapCol.max] = Number(part.maxStock);
      sheet.appendRow(newRow);
      histSheet.appendRow([Utilities.getUuid(), new Date().toISOString(), 'LOG_MASTER', username, part.partNo, 0, 'Insert via CSV']);
      added++;
    }
  }

  return { success: true, message: 'Sukses! ' + added + ' data baru, ' + updated + ' diupdate.' };
}

function getHistoryByPart(partNo) {
  var allHistory = getHistory();
  var filtered = [];
  for(var i=0; i<allHistory.length; i++) {
    if(allHistory[i].part_no === partNo) {
      filtered.push(allHistory[i]);
      if(filtered.length >= 8) break;
    }
  }
  return filtered;
}
