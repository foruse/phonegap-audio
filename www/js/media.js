Voice_message = {
    
    ua : navigator.userAgent.toLowerCase(),
            
    device  :   null,
    
    fs  :   null,
    
    audio   :   null,
    
    path    :   "music/genres/jazz/",
    
    file_name   :   null,

    _phoneCheck : function(){
        if(this.ua.match(/(iphone|ipod|ipad)/i)){
            this.device = "ios";
        }else if(this.ua.match(/android/i)){
            this.device = "android";
        }else if(this.ua.match(/blackberry/i)){
            this.device = "blackberry";
        }else if(this.ua.match(/windows phone os 7.5/i)){
            this.device = "windows";
        }
    },
          
    record_start    :   function(file){
        alert(file);
        var _this = this;
        
        
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fs){
            fs.root.getFile(file, { create: false, exclusive: false }, function(fileEntry){
                alert("***test: File at " + fileEntry.fullPath);
//                console.log("***test: File at " + fileEntry.fullPath);
                
                _this.file_name = fileEntry.fullPath;
                alert(_this.file_name);
                // create media object using full media file name 
                _this.audio = new Media(_this.file_name, _this.recordSuccess, _this.recordError);
                _this.audio.startRecord();
                // specific for iOS device: recording start here in call-back function
                recordNow();
                alert("started record");
                

            }, _this.log.getFileError);
        }, _this.log.fsError);
        
        
//        this.audio = new Media(file, _this.log.recordSuccess, _this.log.recordError);
//        this.audio.startRecord();
    	console.log("***test: new Media() for android ***");
        
        // handle record drwing time
        
        var recTime = 0,
        recInterval = setInterval(function() {
            ++recTime;
            console.log(recTime);
//            setAudioPosition(recTime + " sec");
//            if (recTime >= 10) {
//                clearInterval(recInterval);
//                mediaRec.stopRecord();
//            }
        }, 1000);
    },
            
    record_stop     :   function(){

    },        
    
    play    :   function(){
        
    },
            
    pause   :   function(){

    },
            
    stop    :   function(){
        
    },
    
    _create_file     :   function(file_name){
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fs){
            fs.root.getFile(file_name, { create: true, exclusive: false }, function(fileEntry){
                
            }, null);
        }, null);
    },
    
    _get_fs     :   function(){
        
    },   /* 
           
    INIT    : function(){
//        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem){
//            
//        } , null);
//        var path = 'music/genres/jazz/';
        var _this = this;
        function createDir(rootDirEntry, folders) {
          // Throw out './' or '/' and move on to prevent something like '/foo/.//bar'.
          if (folders[0] == '.' || folders[0] == '') {
            folders = folders.slice(1);
          }
          rootDirEntry.getDirectory(folders[0], {create: true}, function(dirEntry) {
            // Recursively add the new subfolder (if we still have another to create).
            if (folders.length) {
              createDir(dirEntry, folders.slice(1));
            }
          }, errorHandler);
        };

        function onInitFs(fs) {
          createDir(fs.root, _this.path.split('/')); // fs.root is a DirectoryEntry.
        }

        window.requestFileSystem(localFileSystem, 0, onInitFs, function(evt){
            console.log(evt.target.error.code);
        });
        
        setFolderMetadata(LocalFileSystem.PERSISTENT, "Backups", "com.apple.MobileBackup", 1);
    } 
    
    */
       log  :   {
            recordSuccess    :   function(err,err1){
                console.log(err+" RECORD success");
                console.log(err1+" RECORD success");
            },
            recordError      :   function(err,err1){
                console.log(err+" RECORD error");
                console.log(err1+" RECORD error");
            },
            fsError          :   function(err,err1){
                console.log(err+" FS error");
                console.log(err1+" FS error");
            },
            fsSuccess        :   function(err,err1){
                console.log(err+" FS success");
                console.log(err1+" FS success");
            },
            getFileError     :   function(err,err1){
                console.log(err+" getFileError error");
                console.log(err1+" getFileError error");
            },
            getFileSuccess   :   function(err,err1){
                console.log(err+" getFileSuccess success");
                console.log(err1+" getFileSuccess success");
            },
            MediaSuccess     :   function(err,err1){
                console.log(err+" MediaSuccess success");
                console.log(err1+" MediaSuccess success");
            },
            MediaError   :   function(err,err1){
                console.log(err+" MediaError error");
                console.log(err1+" MediaError error");
            }
       }
    
};

Voice_message.record_start("etst.mp3");