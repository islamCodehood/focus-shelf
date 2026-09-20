/* Configure Script Properties: SPREADSHEET_ID, API_SECRET, COVER_FOLDER_ID. */
function doPost(e){
 var lock=LockService.getScriptLock();
 try{
  var envelope=JSON.parse(e.postData.contents),props=PropertiesService.getScriptProperties();
  var secret=props.getProperty('API_SECRET');if(!secret||secret.length<32)fail('CONFIG','Backend configuration is incomplete.');
  if(typeof envelope.body!=='string'||typeof envelope.signature!=='string')fail('AUTH','Unauthorized.');
  var bytes=Utilities.computeHmacSha256Signature(envelope.body,secret,Utilities.Charset.UTF_8);
  var expected=bytes.map(function(n){return ('0'+((n+256)%256).toString(16)).slice(-2);}).join('');
  var diff=expected.length^envelope.signature.length;for(var k=0;k<expected.length;k++)diff|=expected.charCodeAt(k)^(envelope.signature.charCodeAt(k)||0);
  if(diff)fail('AUTH','Unauthorized.');
  var req=JSON.parse(envelope.body);if(typeof req.at!=='number'||Math.abs(Date.now()-req.at)>120000)fail('AUTH','Request expired.');
  if(typeof req.requestId!=='string'||!/^[\w-]{16,80}$/.test(req.requestId))fail('VALIDATION','Invalid request ID.');
  lock.waitLock(15000);
  var book=SpreadsheetApp.openById(props.getProperty('SPREADSHEET_ID'));
  var events=readEvents_(book),snapshot=reduceEvents(events);
  if(req.action==='cover')return respond_({ok:true,data:readCover_(snapshot,req.payload.id,props)});
  if(req.action==='uploadCover')return respond_({ok:true,data:uploadCover_(req.payload,req.requestId,props)});
  if(req.action!=='snapshot'){
   var event=makeEvent(snapshot,req.action,req.payload,req.requestId,new Date().toISOString(),Utilities.getUuid());
   if(!events.some(function(x){return x.requestId===req.requestId;})){
    // Commit the event first. Projections can always be rebuilt after an interrupted request.
    book.getSheetByName('Events').appendRow([event.id,event.requestId,event.itemId,event.kind,event.at,event.delta,event.unit,event.fromState,event.toState,JSON.stringify(event.payload)]);
    SpreadsheetApp.flush();events.push(event);snapshot=reduceEvents(events);
   }
  }
  project_(book,snapshot);
  return respond_({ok:true,data:snapshot});
 }catch(err){return respond_({ok:false,code:err.code||'BACKEND',message:err.code?err.message:'Google Sheets could not complete the request. Try again.'});}
 finally{if(lock.hasLock())lock.releaseLock();}
}
function respond_(data){return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);}
function readEvents_(book){var sheet=book.getSheetByName('Events');if(!sheet)fail('CONFIG','Events sheet is missing.');if(sheet.getLastRow()<2)return [];return sheet.getRange(2,1,sheet.getLastRow()-1,10).getValues().filter(function(r){return r[0];}).map(function(r){return {id:r[0],requestId:r[1],itemId:r[2],kind:r[3],at:r[4] instanceof Date?r[4].toISOString():r[4],delta:Number(r[5]),unit:r[6],fromState:r[7],toState:r[8],payload:JSON.parse(r[9])};});}
function safeCell_(value){if(value===null||value===undefined)return '';if(typeof value==='string'&&/^[=+\-@]/.test(value))return "'"+value;return value;}
function writeProjection_(sheet,rows,width){if(!sheet)fail('CONFIG','A required sheet is missing.');if(rows.length+1>sheet.getMaxRows())sheet.insertRowsAfter(sheet.getMaxRows(),rows.length+1-sheet.getMaxRows());if(rows.length)sheet.getRange(2,1,rows.length,width).setValues(rows.map(function(r){return r.map(safeCell_);}));var tail=sheet.getLastRow()-rows.length-1;if(tail>0)sheet.getRange(rows.length+2,1,tail,width).clearContent();}
function project_(book,s){writeProjection_(book.getSheetByName('Learning Items'),s.items.map(function(i){return ITEM_KEYS.map(function(k){return i[k];});}),ITEM_KEYS.length);writeProjection_(book.getSheetByName('Weekly Reviews'),s.reviews.map(function(r){return [r.weekStart,r.learned,r.adjust,r.nextStep,r.updatedAt,r.version];}),6);}
function uploadCover_(p,requestId,props){
 if(!p||['image/jpeg','image/png','image/webp'].indexOf(p.mime)<0||typeof p.base64!=='string'||p.base64.length>700000)fail('VALIDATION','Use a JPG, PNG, or WebP image under 500 KB.');
 var bytes=Utilities.base64Decode(p.base64);if(bytes.length>500000)fail('VALIDATION','The cover is too large.');
 var u=function(i){return (bytes[i]+256)%256;};
 var valid=p.mime==='image/jpeg'?u(0)===255&&u(1)===216:p.mime==='image/png'?u(0)===137&&u(1)===80&&u(2)===78&&u(3)===71:u(0)===82&&u(1)===73&&u(2)===70&&u(3)===70&&u(8)===87&&u(9)===69&&u(10)===66&&u(11)===80;
 if(!valid)fail('VALIDATION','The image format does not match its content.');
 var folder=DriveApp.getFolderById(props.getProperty('COVER_FOLDER_ID')),name='cover-'+requestId;
 var previous=folder.getFilesByName(name);var file=previous.hasNext()?previous.next():folder.createFile(Utilities.newBlob(bytes,p.mime,name));return {fileId:file.getId()};
}
function readCover_(s,id,props){if(!s.items.some(function(i){return i.coverFileId===id;}))fail('NOT_FOUND','Cover not found.');var file=DriveApp.getFileById(id),parents=file.getParents(),allowed=false;while(parents.hasNext())if(parents.next().getId()===props.getProperty('COVER_FOLDER_ID'))allowed=true;if(!allowed)fail('AUTH','Cover is outside the app folder.');return {base64:Utilities.base64Encode(file.getBlob().getBytes()),mime:file.getMimeType()};}
function verifySetup(){var p=PropertiesService.getScriptProperties();var book=SpreadsheetApp.openById(p.getProperty('SPREADSHEET_ID'));['Learning Items','Events','Weekly Reviews'].forEach(function(n){if(!book.getSheetByName(n))throw new Error('Missing sheet: '+n);});DriveApp.getFolderById(p.getProperty('COVER_FOLDER_ID'));if((p.getProperty('API_SECRET')||'').length<32)throw new Error('Set API_SECRET to at least 32 characters.');console.log('Focus Shelf configuration is valid.');}
