// ============================================================
// GOOGLE APPS SCRIPT — Pegar en Google Sheets > Extensions > Apps Script
// ============================================================
//
// PASOS DE CONFIGURACIÓN:
//
// 1. Abre Google Sheets → crea una hoja nueva (ej: "CRM Backup")
// 2. Click en Extensiones → Apps Script
// 3. Borra todo el código que aparece
// 4. Copia y pega TODO este archivo (desde "var HEADERS" hasta el final)
// 5. Click en Implementar → Nueva implementación
// 6. Tipo: "Aplicación web"
// 7. "Ejecutar como": Yo mismo
// 8. "Quién tiene acceso": Cualquier persona
// 9. Click en Implementar → Autorizar acceso → Permitir
// 10. Copia la URL que aparece
// 11. Abre crm.html → ⚙ Settings → pega la URL en "Google Sheets Sync"
// 12. Click en "⬆ Sync to Sheets" para probar
// 13. Revisa tu Google Sheet — los datos deben aparecer en una pestaña "CRM"
//
// ============================================================

var HEADERS = [
  'id','name','source','type','industry','linkedin_url','website',
  'email_or_phone','first_contact_date','first_contact_message',
  'bump1','bump1_date','bump2','bump2_date','bump3','bump3_date',
  'response','loom_sent','sales_call','notes','answer','revenue',
  'status','linkedin_photo','linkedin_headline','linkedin_company',
  'linkedin_location','website_title','website_description',
  'enriched_at','created_at','updated_at'
];

var BOOL_FIELDS = ['bump1','bump2','bump3','response','loom_sent','sales_call'];
var NUM_FIELDS  = ['revenue','id'];

/* ─── POST: recibe contactos del CRM ─── */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    if (data.action === 'sync') {
      return respond(syncContacts(data.contacts));
    }
    return respond({ error: 'Unknown action' });
  } catch (err) {
    return respond({ error: err.message });
  }
}

/* ─── GET: devuelve contactos al CRM ─── */
function doGet(e) {
  try {
    return respond(getAllContacts());
  } catch (err) {
    return respond({ error: err.message });
  }
}

/* ─── Respuesta JSON ─── */
function respond(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ─── Sync: reemplaza toda la hoja con los contactos recibidos ─── */
function syncContacts(contacts) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('CRM') || ss.insertSheet('CRM');

  sheet.clear();
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
  sheet.setFrozenRows(1);

  if (!contacts || contacts.length === 0) {
    return { success: true, count: 0 };
  }

  var rows = contacts.map(function(c) {
    return HEADERS.map(function(h) {
      var val = c[h];
      if (val === true)  return 'TRUE';
      if (val === false) return 'FALSE';
      if (val === null || val === undefined) return '';
      return String(val);
    });
  });

  sheet.getRange(2, 1, rows.length, HEADERS.length).setValues(rows);

  return { success: true, count: contacts.length };
}

/* ─── Pull: lee todos los contactos de la hoja ─── */
function getAllContacts() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('CRM');

  if (!sheet) return { contacts: [] };

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { contacts: [] };

  var headers = data[0];
  var contacts = [];

  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      var h = String(headers[j]);
      var val = data[i][j];

      if (BOOL_FIELDS.indexOf(h) >= 0) {
        obj[h] = (val === 'TRUE' || val === true);
      } else if (NUM_FIELDS.indexOf(h) >= 0) {
        obj[h] = Number(val) || 0;
      } else {
        obj[h] = (val === '' || val === null || val === undefined) ? '' : String(val);
      }
    }
    if (obj.name) contacts.push(obj);
  }

  return { contacts: contacts };
}
