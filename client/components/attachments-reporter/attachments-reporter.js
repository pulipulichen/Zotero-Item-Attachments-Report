/* global ClipboardUtils, ipcRenderer, ElectronUtils, dayjs, FileUtils, shell */

module.exports = {
  data () {
    
    return {
      cacheKey: 'attachments-reporter',
      cacheAttrs: ['sqlitePath', 'itemID', 'tag', 'zoteroUserID', 'typeFilterText', 'itemTitle', 'spreadsheetURL', 'zoteroURL', 'zoteroAddedTag'],
      inited: false,
      
      zoteroUserID: '',
      sqlitePath: '',
      spreadsheetURL: '',
      zoteroURL: '',
      itemTitle: '',
      itemID: '',
      typeFilterText: `.pdf
.epub
.mobi
.chm
.xps
.djvu
.cbz
.cbr`,
      attachmentRows: [],
      tag: '',
      
      isLoading: false,
      coverURL: '',
      
      zoteroAddedTag: 'ToReadListAdded'
    }
  },
  async mounted () {
    this.dataLoad()
    
    this.inited = true
    //this.queryProjectFileList()
  },
  watch: {
    zoteroUserID () {
      this.dataSave()
    },
    sqlitePath () {
      this.dataSave()
    },
    itemID () {
      this.dataSave()
    },
    typeFilterText () {
      this.dataSave()
    },
    itemTitle () {
      this.dataSave()
    },
    spreadsheetURL () {
      this.dataSave()
    },
    zoteroURL () {
      this.dataSave()
    },
    tag () {
      this.dataSave()
    },
    zoteroAddedTag () {
      this.dataSave()
    },
  },
  computed: {
    attachmentRowsFiltered () {
      return this.attachmentRows.filter(a => {
        let title = a.title
        
        for (let i = 0; i < this.typeFilter.length; i++) {
          if (title.endsWith(this.typeFilter[i])) {
            return true
          }
        }
        
        return false
      })
    },
    attachmentsText () {
      return this.attachmentRowsFiltered.map(attachment => {
        return [
          attachment.title,
          '',
          attachment.key,
          0,
          '',
          'FALSE',
          this.bookTitle,
          dayjs().subtract(7, 'day').format('M/DD/YYYY hh:mm:ss')
        ].join('\t')
      }).join('\n')
    },
    bookTitle () {
      if (this.attachmentRowsFiltered.length === 0) {
        return ''
      }
      else {
        let title = this.attachmentRowsFiltered[0].book.trim()
        if (title.indexOf('=')) {
          title = title.slice(0, title.indexOf('=')).trim()
        }
        if (title.indexOf(' by ') && title.length > 10) {
          title = title.slice(0, title.indexOf(' by ')).trim()
        }
        return title
      }
    },
    bookText () {
      return [
          this.bookTitle,
          this.coverThumbnail,
          this.tag,
          this.itemID,
          '',
          dayjs().subtract(7, 'day').format('M/DD/YYYY hh:mm:ss')
        ].join('\t')
    },
    typeFilter () {
      return this.typeFilterText.trim().split('\n').map(l => l.trim())
    },
    bookKey () {
      let keys = []
      this.attachmentRowsFiltered.map(attachment => {
        if (keys.indexOf(attachment.bookKey) === -1) {
          keys.push(attachment.bookKey)
        }
      })
      
      return keys
    },
    isOpenSpreadsheetDisabled () {
      return (this.spreadsheetURL === '' 
              || !this.spreadsheetURL.startsWith('https://docs.google.com/spreadsheets/d/'))
    },
    isOpenZoteroDisabled () {
      return (this.zoteroURL === '' 
              || !this.zoteroURL.startsWith('https://www.zotero.org/'))
    },
    isCopyCoverThumbnailDisabled () {
      return (this.coverURL === '')
    },
    coverThumbnail () {
      if (this.isCopyCoverThumbnailDisabled) {
        return ''
      }
      if (this.coverURL.startsWith('https://drive.google.com/file/d/')) {
        let fileID = this.coverURL.split('/')[5]
        let url = `https://drive.google.com/thumbnail?id=${fileID}&sz=w1600-h1600`
        return url
      }
      else {
        return this.coverURL.trim()
      }
    }
  },
  methods: {
    dataLoad () {
      let projectFileListData = localStorage.getItem(this.cacheKey)
      if (!projectFileListData) {
        return false
      }
      
      projectFileListData = JSON.parse(projectFileListData)
      for (let key in projectFileListData) {
        this[key] = projectFileListData[key]
      }
    },
    dataSave () {
      if (this.inited === false) {
        return false
      }
      
      let keys = this.cacheAttrs
      
      let data = {}
      keys.forEach(key => {
        data[key] = this[key]
      })
      
      data = JSON.stringify(data)
      localStorage.setItem(this.cacheKey, data)
    },
    searchItem () {
      let url = `https://www.zotero.org/${this.zoteroUserID}/search/${this.itemTitle}/titleCreatorYear`
      shell.openExternal(url)
    },
    getAttachments () {
      //console.log('搜尋', this.itemID, this.sqlitePath)
      this.attachmentRows = []
      
      //console.log(this.projectPath)
      
      let callbackID = ElectronUtils.getCallbackID('getAttachments')
      ipcRenderer.on(callbackID, (event, rows) => {
        //console.log(rows)
        if (rows === false || Array.isArray(rows) === false) {
          this.isLoading = false
          return window.alert('Zotero SQLite Database is busy: ' + rows)
        }
        
        if (rows.length === 0) {
          this.isLoading = false
          return window.alert('Not found')
        }
        
        this.attachmentRows = rows
        this.isLoading = false
        this.coverURL = ''
        
        if (this.bookKey[0] && this.itemID === '') {
          this.itemID = this.bookKey[0]
        }
        
        setTimeout(() => {
          this.$refs.CopyAttachmentsTextButton.scrollIntoView()
          this.$refs.CopyAttachmentsTextButton.focus()
          this.isLoading = false
        }, 0)
      })
      
      this.isLoading = true
      ipcRenderer.send('getAttachments', {
        sqlitePath: this.sqlitePath,
        itemID: this.itemID,
        itemTitle: this.itemTitle,
      }, callbackID);
    },
    copyAttachmentsText () {
      ClipboardUtils.copyPlainString(this.attachmentsText)
    },
    copyBookText () {
      ClipboardUtils.copyPlainString(this.bookText)
    },
    copyZoteroAddedTag () {
      ClipboardUtils.copyPlainString(this.zoteroAddedTag)
    },
    openLinks () {
      this.attachmentRowsFiltered.map(row => {
        return `https://drive.google.com/drive/u/0/search?zotero=true&q=type:folder%20` + row.key
      }).forEach(url => {
        shell.openExternal(url)
      })
    },
    openSearchCover () {
      // https://www.google.com/search?q=JavaScript+%E7%BC%96%E7%A8%8B%E7%B2%BE%E8%A7%A3
      let url = 'https://www.google.com/search?q=' + encodeURIComponent(this.bookTitle) + '&sxsrf=ALeKk00pGeE5eDj08uTpzRjZNVhcByrW_w:1612533809783&source=lnms&tbm=isch&sa=X&ved=2ahUKEwjhjK7H9NLuAhXlyosBHZXSAWgQ_AUoAnoECAYQBA&biw=931&bih=568'
      shell.openExternal(url)
    },
    openSpreadsheetURL () {
      shell.openExternal(this.spreadsheetURL)
    },
    openZoteroURL () {
      shell.openExternal(this.zoteroURL)
    },
    copyCoverThumbnail () {
      // https://drive.google.com/file/d/1XfMjPCu1srYdlOYY9NbFIZMONETavBJm/view?usp=sharing
      //let url = this.coverURL
      
      let fileID = this.coverURL.split('/')[5]
      let url = `https://drive.google.com/thumbnail?id=${fileID}&sz=w1600-h1600`
      // https://drive.google.com/thumbnail?id=1XfMjPCu1srYdlOYY9NbFIZMONETavBJm&sz=w1600-h1600
      
      
      ClipboardUtils.copyPlainString(url)
    },
  }
}