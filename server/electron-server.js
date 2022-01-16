/* global __dirname */

const {app, BrowserWindow, dialog, Menu, Tray, globalShortcut, ipcMain, session, shell} = require('electron');
let fs = require('fs');
var path = require('path');
let config = require('../config.js')
const { exec } = require("child_process");

const sqlite3 = require("sqlite3").verbose();

let events = {
  getAttachments: function (event, parameters, _callback_id) {

    let {sqlitePath, itemID, itemTitle} = parameters
    
    if (fs.existsSync(sqlitePath) === false) {
      return event.sender.send(_callback_id, 'SQLite is not found in ' + sqlitePath)
    }
    
    var db = new sqlite3.Database(sqlitePath)
    db.configure('busyTimeout', 15000)
    
    let sql
    if (itemID) {
      sql = `select substr(itemAttachments.path, 9) as title, attachmentItem.key, itemDataValues.value as book, bookItem.key as bookKey
from items as bookItem, items as attachmentItem, itemAttachments, fields, itemDataValues, itemData
where itemAttachments.parentItemID = bookItem.itemID
and itemAttachments.itemID = attachmentItem.itemID
and fields.fieldName = 'title'
and fields.fieldID = itemData.fieldID
and itemData.valueID = itemDataValues.valueID
and itemData.itemID = bookItem.itemID
and bookItem.key = '${itemID}'
and substr(itemAttachments.path, 9) IS NOT NULL
order by title asc`
    }
    else if (itemTitle) {
      sql = `select substr(itemAttachments.path, 9) as title, attachmentItem.key, itemDataValues.value as book, bookItem.key as bookKey
from items as bookItem, items as attachmentItem, itemAttachments, fields, itemDataValues, itemData
where itemAttachments.parentItemID = bookItem.itemID
and itemAttachments.itemID = attachmentItem.itemID
and fields.fieldName = 'title'
and fields.fieldID = itemData.fieldID
and itemData.valueID = itemDataValues.valueID
and itemData.itemID = bookItem.itemID
and itemDataValues.value LIKE '%${itemTitle}%'
and substr(itemAttachments.path, 9) IS NOT NULL
order by title asc`
    }
    
    //console.log(sql)
    
    db.all(sql, function(err,rows){
      // console.log(rows)
      if (err) {
        return event.sender.send(_callback_id, err)
      }
      
      event.sender.send(_callback_id, rows)
    })
  }
}

// -----------------
// 以下不要變動

module.exports = {
  setup: function () {
    for (let event in events) {
      ipcMain.on(event, events[event])
    }
  }
}