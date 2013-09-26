 
//                            // helpers more out from here
//                        _draw_record_time   : function(){
//                            var time = 0;
//                            this.timer = setInterval(function() {
//                                ++time;
//                                document.getElementById("media_rec_pos").innerHTML = "Audio position: "+time+" sec";
//                            }, 1000);
//                        },
//
//                        _draw_play_time   : function(){
//                            var _this = this;
//                            this.timer = setInterval(function () {
//                                // get my_audio position
//                                _this.audio.getCurrentPosition(
//                                    // success callback
//                                    function (position) {
//                                        if (position >= 0){
//                                            document.getElementById("media_pos").innerHTML = "Audio position: "+position+" sec";
//                                        }else {
//                                            // reached end of media: same as clicked stop-music 
//                                            _this._stop_timer();
//                                            document.getElementById("media_pos").innerHTML = "Audio position: 0 sec";
//                                            document.getElementById('PlayStatusID').innerHTML = "Status: stopped";
//                                        }
//                                    },
//                                    // error callback
//                                    function (e) {
//                                        document.getElementById('PlayStatusID').innerHTML = "Status: Error on getting position - " + e;
//                                        setAudioPosition("Error: " + e);
//                                    });
//                            }, 1000);
//                        },
//                        
//                        _stop_timer : function(){
//                            var _this = this;
//                            if (this.timer !== null) {
//                                clearInterval(_this.timer);
//                                _this.timer = null;
//                            } 
//                        }














  
/*


window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fs) {
//        fs.root.getDirectory("BAO", {create: true, exclusive: false}, function(dir) {
//            var directoryReader = dir.createReader();
            var directoryReader = fs.root.createReader();

            // Get a list of all the entries in the directory
            directoryReader.readEntries(function(dd){
                console.log(dd)
            });
//          console.log(dir);
//        }, function(err1, err2) {
//            console.log(err1);
//            console.log(err2);
//        });
    }, function(err1, err2) {
        console.log(err1);
        console.log(err2);
    }); 

        
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fs) {
    
            fs.root.getDirectory("BAO", {create: true, exclusive: false}, function(dir) {
                console.log(dir);
                var directoryReader = dir.createReader();
                console.log(directoryReader);
                directoryReader.readEntries(function(entries) {
                    console.log(entries);
                  var i;
                  for (i=0; i<entries.length; i++) {
                      console.log(entries[i].name);


                  }
              }, function (error) {
                  alert(error.code);
              });
            }, function(err1, err2) {
                console.log(err1);
                console.log(err2);
            });
    
    
       }, function (error) {
               alert(error.code);
       });


    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fs) {
//    window.requestFileSystem(LocalFileSystem.TEMPORARY, 0, function(fs) {
        fs.root.getDirectory(CONFIG.root_dir, {create: true, exclusive: false}, function(dir) {

            inited_fs = dir;

            server_start();
//                                    return dir;
//                                    _this.fs = dir;
        }, function(err1, err2) {
            console.log(err1);
            console.log(err2);
        });
    }, function(err1, err2) {
        console.log(err1);
        console.log(err2);
    });

    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fs) {

        console.log(fs);


        fs.root.getFile("test_iphone.mp3", {create: true, exclusive: true}, function(fileEntry) {
//        SERVER.PHONE.VoiceMessage.fs.getFile("test1.wav", {create: true, exclusive: true}, function(fileEntry) {

            var fileTransfer = new FileTransfer(),
//                    uri = encodeURI("http://212.8.40.254:5959/uploads/2627a3ea36fc137237f8b1f448ba7acf.wav");
//                    uri = encodeURI("http://212.8.40.254:5959/uploads/eb4f23c5594f0486a41eafc325ed98b0.wav");
                    uri = encodeURI("http://212.8.40.254:5959/uploads/a97c7443f797f70350242beef50ef82c.mp3");

            fileTransfer.download(
                    uri,   
                    fileEntry.fullPath,
                    function(download_entry) {
                        console.log(fileEntry.fullPath);
                        console.log("download_entry");
                        console.log(download_entry);
                        console.log("download complete: " + download_entry.fullPath);
                        var media = new Media(download_entry.fullPath, function() {
                            console.log("ok")

                        }, function(err) {
                            console.log(err)
                        });
                        media.play();
                    },
                    function(error) {
                        console.log("download error source " + error.source);
                        console.log("download error target " + error.target);
                        console.log("upload error code" + error.code);
                    }
            );



        });

    },
            function(error) {
                console.log("error source " + error.source);
                console.log(" error target " + error.target);
                console.log(" error code" + error.code);
            }
    );
        
        */