var AVALIACAO = 0;
var MANAGER = 1;
var SUBTIME = 2;
var NOME_COMPLETO = 3;
var CORE_ID = 4;
var EMAIL_ENVIADO = 5;
var AVALIADOR_1 = 6;
var AVALIADOR_2 = 7;
var FOLDER_ID = 8;
var FORM_LINK = 9;
var FORM_ID = 10;
var RESULTADO_COLETADO = 11;
var COL_REPORT_GEN = 14;

var FORM_TEMPLATE_ID = '........._lx35s';
var MAIN_SHEET_NAME = 'FabricaSw';
var RESPONSE_SHEET_NAME = 'Response';
var CREATED_FORM_EDITORS = ['ematos@motorola.com', 'ejvm@cin.ufpe.br'];

const FORM_HEADERS = ["Assiduidade", "Comprometimento", "Autonomia", "Iniciativa e Inovação", "Comunicação", "Relacionamento interpessoal", "Fluência em inglês", "Qualidade e Produtividade", "Conhecimento Técnico", "Capacidade analítica e análise de riscos", "sugestão de melhoria"]


function onOpen() {
  const ui = SpreadsheetApp.getUi();
  const menu = ui.createMenu('AUTO');
  menu.addItem('Create Forms', 'create_form');
  menu.addItem('Send Emails', 'send_email');
  menu.addItem('Collect Responses', 'collect_responses');
  menu.addItem('Generate Report', 'generate_report');
  menu.addToUi();
}

function create_form() {
  //This value should be the id of your document template that we created in the last step
  var template = DriveApp.getFileById(FORM_TEMPLATE_ID);
  //Here we store the sheet as a variable
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(MAIN_SHEET_NAME)  
  //Now we get all of the values as a 2D array
  var rows = sheet.getDataRange().getValues();

  //Start processing each spreadsheet row
  rows.forEach(function(row, index){
    //Here we check if this row is the headers, if so we skip it
    if (index === 0) return;
    //Here we check if a document has already been generated by looking at 'Document Link', if so we skip it
    if (row[FORM_LINK]) return;

    //Using the row data in a template literal, we make a copy of our template form in our destinationFolder
    var copy = template.makeCopy(`${row[NOME_COMPLETO]} - ${row[AVALIACAO]}`, DriveApp.getFolderById(`${row[FOLDER_ID]}`))
    //Once we have the copy, we then open it using the DocumentApp
    var form = FormApp.openById(copy.getId())
    form.setTitle(`Disciplina - ${row[AVALIACAO]} - ${row[NOME_COMPLETO]}`)
    form.addEditors(CREATED_FORM_EDITORS)

    //Store the url of our new document in a variable
    var url = copy.getUrl();
    //Write that value back to the 'Document Link' column in the spreadsheet. 
    sheet.getRange(index + 1, FORM_LINK + 1).setValue(url)
  })
}

function send_email() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(MAIN_SHEET_NAME)
  //Now we get all of the values as a 2D array
  var rows = sheet.getDataRange().getValues();
  rows.forEach(function(row, index){
    if (index === 0) return;
    if (row[EMAIL_ENVIADO]) return;

    var message = `Olá, 
....
${row[NOME_COMPLETO]}.
.....
${row[FORM_LINK]}

Fábrica de Software I, II, III e IV.
A avaliação em questão é sigilosa e anônima !!!

Best Regards!

Eduardo Matos`;

    var subject = `${row[AVALIACAO]} - ${row[NOME_COMPLETO]}`;
    var bcc = `ematos@motorola.com, ejvm@cin.ufpe.br, ${row[MANAGER]}@motorola.com`;
    var enviado = false;

    if (row[AVALIADOR_1]) {
      GmailApp.sendEmail(`${row[AVALIADOR_1]}@motorola.com`, subject, message, {bcc: bcc});
      enviado = true;
    }
    if (row[AVALIADOR_2]) {
      GmailApp.sendEmail(`${row[AVALIADOR_2]}@motorola.com`, subject, message, {bcc: bcc});
      enviado = true;
    }
    if (enviado) sheet.getRange(index + 1, EMAIL_ENVIADO + 1).setValue('ENVIADO');
  })
}

function collect_response_from_id(form_id) {  
  var response_sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(RESPONSE_SHEET_NAME);
  var form = FormApp.openById(form_id);
  var form_responses = form.getResponses();
  for (var i = 0; i < form_responses.length; i++) {
    var form_response = form_responses[i];
    var items = form_response.getItemResponses();
    var lastIndex = -1;
    for (var j = 0; j < items.length; j++) {
      var line = response_sheet.getLastRow() + 1;
      if (j != lastIndex) {
        response_sheet.getRange(line, 2).setValue(form_id);
        response_sheet.getRange(line, 3).setValue(items[j].getItem().getTitle());
        response_sheet.getRange(line, 4).setValue(items[j].getResponse());
        if (j + 1 < items.length) {
          response_sheet.getRange(line, 5).setValue(items[j+1].getResponse());
          lastIndex = j + 1;
        }
      } 
      if (j == items.length - 1) {
        response_sheet.getRange(line, 2).setValue(form_id);
        response_sheet.getRange(line, 3).setValue(items[j].getItem().getTitle());
        response_sheet.getRange(line, 4).setValue("-");
        response_sheet.getRange(line, 5).setValue(items[j].getResponse());
      }
    }
  }
}

function collect_responses() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(MAIN_SHEET_NAME);
  //Now we get all of the values as a 2D array
  var rows = sheet.getDataRange().getValues();
  rows.forEach(function(row, index){
    // Ignoring header (first line)
    if (index === 0) return;
    // If the result is already collected;
    if (row[RESULTADO_COLETADO]) return;
    if (row[FORM_ID].length > 15) {
      collect_response_from_id(row[FORM_ID])
    }
    sheet.getRange(index + 1, RESULTADO_COLETADO + 1).setValue('Collected');
  });

}

function generate_report() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(MAIN_SHEET_NAME);
  //Now we get all of the values as a 2D array
  var rows = sheet.getDataRange().getValues();
  rows.forEach(function(row, index){
    // Ignoring header (first line)
    if (index === 0) return;
    // If the result is already collected;
    if (row[COL_REPORT_GEN]) return;
    if (row[FORM_ID].length > 15) {
        var form_id = row[FORM_ID]
        var form = FormApp.openById(form_id);
        var itemListResponses = []
        var form_responses = form.getResponses();
        for (var i = 0; i < form_responses.length; i++) {
          var form_response = form_responses[i];
          var responses = form_response.getItemResponses();      
          var lastTitle = "";
          for (var j = 0; j < responses.length; j++) {
            var title = responses[j].getItem().getTitle()
            var value = responses[j].getResponse().valueOf()
            if (title == "Justifique a sua resposta" || title == "Justifique sua resposta") {
              title = lastTitle + " - Comentários";
            } else {
              lastTitle = title
            }
            appendResponseToItemList(itemListResponses, title, value)
          }
        }
        var doc = generateReport(itemListResponses, row[AVALIACAO], row[NOME_COMPLETO])
        var destinationFolder = DriveApp.getFolderById(row[FOLDER_ID]);
        var file = DriveApp.getFileById(doc.getId());
        destinationFolder.addFile(file);  
        sheet.getRange(index + 1, COL_REPORT_GEN + 1).setValue('GERADO!');
    }
  });
}

function appendResponseToItemList(itemListResponses, itemTitle, itemResponse) {
  var i = 0;
  var found = false;
  while (!found && i < itemListResponses.length){
    if (itemListResponses[i].getItemTitle() == itemTitle) {
      itemListResponses[i].appendItemResponse(itemResponse);
      found = true;
    }
    i += 1;
  }
  if (!found) {
    itemListResponses.push(new ResponseItem(itemTitle, itemResponse))
  }
}

function generateReport(itemListResponses, avaliacao, nome) {
  var doc = DocumentApp.create(`${nome} - ${avaliacao}`);
  var body = doc.getBody();  
  
  var par0 = body.appendParagraph(nome);
  par0.setHeading(DocumentApp.ParagraphHeading.HEADING1);
  
  var latestTitle = "ANTHNG";
  for (var i = 0; i < itemListResponses.length; i++) { 

    if (itemListResponses[i].getItemTitle().indexOf("sugestão de melhoria") > 0) {
      latestTitle = itemListResponses[i].getItemTitle();
      // Append a paragraph, with heading 3.
      var par1 = body.appendParagraph(latestTitle);
      par1.setHeading(DocumentApp.ParagraphHeading.HEADING3);
      comments = itemListResponses[i].getItemResponses();
      for (var j = 0; j < comments.length; j++) {
        var comm = body.appendParagraph(comments[j]);
        comm.setBold(false);
      }
    } else if (itemListResponses[i].getItemTitle().indexOf(latestTitle) < 0) {
      latestTitle = itemListResponses[i].getItemTitle();
      // Append a paragraph, with heading 3.
      var par1 = body.appendParagraph(latestTitle);
      par1.setHeading(DocumentApp.ParagraphHeading.HEADING3);
      body.appendParagraph("Notas: " + itemListResponses[i].getItemResponses().join("  e  ") + "  -  Média: " + average(itemListResponses[i].getItemResponses()));
    } else {
      var it = body.appendParagraph("Comentários");
      it.setBold(true);
      comments = itemListResponses[i].getItemResponses();
      for (var j = 0; j < comments.length; j++) {
        var comm = body.appendParagraph(comments[j]);
        comm.setBold(false);
      }
    }   
  } 
  return doc;
}

function average (values) {
  var avg = values.reduce((result, value) => result + parseFloat(value), 0);
  return avg / values.length;
}

class ResponseItem {
  constructor(itemTitle, itemResponse) {
      this.itemTitle = itemTitle;
      this.itemResponses = [itemResponse];
  }

  getItemTitle() {
    return this.itemTitle;
  }

  getItemResponses() {
    return this.itemResponses;
  }

  appendItemResponse(itemResponse) {
    this.itemResponses.push(itemResponse);
  }
}

