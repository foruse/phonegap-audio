Voice_message = {
    
    ua : navigator.userAgent.toLowerCase(),
            
    device  :   null,
    
    fs  :   null,
    
    audio   :   null,
    
    path    :   "Bao",
    
    file_name   :   null,
    
    timer   : null,

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
        var _this = this;
        this._create_file(file, function(file_name){
            _this.audio = new Media(file_name, _this.recordSuccess, _this.recordError);
            _this.audio.startRecord();
            _this._draw_record_time();
        });
        
    },
    
    _draw_record_time   : function(){
        var time = 0;
        this.timer = setInterval(function() {
            ++time;
            document.getElementById("media_rec_pos").innerHTML = "Audio position: "+time+" sec";
        }, 1000);
    },
            
    _draw_play_time   : function(){
        var _this = this;
        this.timer = setInterval(function () {
            // get my_audio position
            _this.audio.getCurrentPosition(
                // success callback
                function (position) {
                    if (position >= 0){
                        document.getElementById("media_pos").innerHTML = "Audio position: "+position+" sec";
                    }else {
                        // reached end of media: same as clicked stop-music 
                        _this._stop_timer();
                        document.getElementById("media_pos").innerHTML = "Audio position: 0 sec";
                        document.getElementById('PlayStatusID').innerHTML = "Status: stopped";
                    }
                },
                // error callback
                function (e) {
                    document.getElementById('PlayStatusID').innerHTML = "Status: Error on getting position - " + e;
                    setAudioPosition("Error: " + e);
                });
        }, 1000);
    },
            
    _stop_timer : function(){
        var _this = this;
        if (this.timer !== null) {
            clearInterval(_this.timer);
            _this.timer = null;
        } 
    },
            
    record_stop     :   function(){
        if(this.audio){
            this.audio.stopRecord();
            this.audio = null;
            this._stop_timer();
        }
    },        
    
    play    :   function(){
        console.log("test");
        var _this = this;
        console.log(_this.audio);
        console.log("_this.audio");
        if (this.audio == null) {
//            return false;
            _this.audio = new Media(_this.file_name, _this.recordSuccess, _this.recordError);
            this.audio.play();
            this._draw_play_time();
        }else{ // else play current audio
        // Play audio
            this.audio.play();
            this._draw_play_time();
        }
        // Update my_media position every second
    },
            
    pause   :   function(){
        if (this.audio) {
            this.audio.pause();
        }
    },
            
    stop    :   function(){
        if (this.audio) {
            this.audio.stop();
            this._stop_timer();
        }
    },
    
    _create_file     :   function(file_name, callback){
        var _this = this;
        _this.fs.getFile(file_name, { create: true, exclusive: false }, function(fileEntry){
            _this.file_name = fileEntry.fullPath;
            callback(_this.file_name);
        }, _this.log.getFileError);
    },
    
    _get_fs     :   function(){
        
    },   
           
    INIT    : function(){
//        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem){
//            
//        } , null);
//        var path = 'music/genres/jazz/';
//        var _this = this;
        
//        entry.getDirectory("newDir", {create: true, exclusive: false}, success, fail);
        
        var _this = this;
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fs){
            fs.root.getDirectory(_this.path, { create: true, exclusive: false }, function(dir){
//                _this.file_name = fileEntry.fullPath;
//                callback(_this.file_name);
                _this.fs = dir;
//                alert(dir);
            }, _this.log.getFileError);
        }, _this.log.fsError);
        
        /*
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
        
        */
    },
    
    
       log  :   {
            recordSuccess    :   function(err,err1){
                alert(err+" RECORD success");
                alert(err1+" RECORD success");
            },
            recordError      :   function(err,err1){
                alert(err+" RECORD error");
                alert(err1+" RECORD error");
            },
            fsError          :   function(err,err1){
                alert(err+" FS error");
                alert(err1+" FS error");
            },
            fsSuccess        :   function(err,err1){
                alert(err+" FS success");
                alert(err1+" FS success");
            },
            getFileError     :   function(err,err1){
                alert(err+" getFileError error");
                alert(err1+" getFileError error");
            },
            getFileSuccess   :   function(err,err1){
                alert(err+" getFileSuccess success");
                alert(err1+" getFileSuccess success");
            },
            MediaSuccess     :   function(err,err1){
                alert(err+" MediaSuccess success");
                alert(err1+" MediaSuccess success");
            },
            MediaError   :   function(err,err1){
                alert(err+" MediaError error");
                alert(err1+" MediaError error");
            }
       }
//       log  :   {
//            recordSuccess    :   function(err,err1){
//                console.log(err+" RECORD success");
//                console.log(err1+" RECORD success");
//            },
//            recordError      :   function(err,err1){
//                console.log(err+" RECORD error");
//                console.log(err1+" RECORD error");
//            },
//            fsError          :   function(err,err1){
//                console.log(err+" FS error");
//                console.log(err1+" FS error");
//            },
//            fsSuccess        :   function(err,err1){
//                console.log(err+" FS success");
//                console.log(err1+" FS success");
//            },
//            getFileError     :   function(err,err1){
//                console.log(err+" getFileError error");
//                console.log(err1+" getFileError error");
//            },
//            getFileSuccess   :   function(err,err1){
//                console.log(err+" getFileSuccess success");
//                console.log(err1+" getFileSuccess success");
//            },
//            MediaSuccess     :   function(err,err1){
//                console.log(err+" MediaSuccess success");
//                console.log(err1+" MediaSuccess success");
//            },
//            MediaError   :   function(err,err1){
//                console.log(err+" MediaError error");
//                console.log(err1+" MediaError error");
//            }
//       }
    
};

function start_record(){
    Voice_message.record_start("Igor_test1.wav");
}

function stop_record(){
    Voice_message.record_stop();
}
function play(){
    console.log("pushed");
    Voice_message.play();
}
function pause(){
    Voice_message.pause();
}
function stop(){
    Voice_message.stop();
}
//////////////////


function init(){
    Voice_message.INIT();
    console.log("heeeell");
//    alert("Window")
//    alert(Window)
//    alert(window)
}
