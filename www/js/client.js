function init_app() { //wrapper
    console.log("init_main_html FIRED!!!");
    Models.User.test_create("", function() {


        var id = "xiao_projects_8w4bk484&20130916170458";
        Models.Project.read(id, function(partners) {

            partners.forEach(function(el, i) {
                i === 0 ? $("#project-info").append('<div>' + el.name + " " + el.description + '</div>') : "";
                $("#project-partners").append(el.name);
            });

            Models.ProjectChat.chat_init(
                id, // project_id
                /* get message event*/
                        function(messages) {
                            messages.forEach(function(message) {
                                if (message.type == "text") {
                                    console.log(message);
                                    $("#chat").append('<p>' + message.content + '  <b>  NOT MY</b>  </p>');
                                    console.log("message--message--message--message--message--message--message--message--message--message--message--message--message--message--");
                                }
                                if (message.type == "audio") {
                                    $("#chat").append('<p> VOice message <b> MY Message</b><button class="play-send-voice" vo-id="' + message.id + '">PLAY</button> </p>');
                                }
                            });
                        }
                );

        });

//        Models.ProjectChat.chat_init(
//                id, // project_id
//                /* get message event*/
//                        function(messages) {
//                            console.log("Models.ProjectChat.chat_init");
//                            messages.forEach(function(message) {
//                                if (message.type == "text") {
//                                    console.log(message);
//                                    $("#chat").append('<p>' + message.content + '  <b>  DB message</b>  </p>');
//                                    console.log("message--message--message--message--message--message--message--message--message--message--message--message--message--message--");
//                                }
//                                if (message.type == "audio") {
//                                    $("#chat").append('<p> VOice message <b> DB message</b><button class="play-send-voice" vo-id="' + message.id + '">PLAY</button> </p>');
//                                }
//                            });
//                        }
//                );
//                    Models.Project.read(id, function(data) {
//                        // asynchronous method which have several events (project info and chat messages)
//
//                        console.log(data);
//                        if (data.partners) {
//                            data.partners.forEach(function(el, i) {
//                                i === 0 ? $("#project-info").append('<div>' + el.name + " " + el.description + '</div>') : "";
//                                $("#project-partners").append(el.name);
//                            });
//                        }
//                        if (data.chat) {
//                            data.chat.forEach(function(message, i) {
////                                $("#chat").append('<p>' + el.content + ' <b>DB message</b> </p>');
//                                if(message.type == "text"){
//                                                    
//                                    console.log(message);
//                                    $("#chat").append('<p>' + message.content + '  <b>  NOT MY</b>  </p>');
//                                    console.log("message--message--message--message--message--message--message--message--message--message--message--message--message--message--");
//                                }
//                                if(message.type == "audio"){
//                                    $("#chat").append('<p> VOice message <b> MY Message</b><button class="play-send-voice" vo-id="' + message.id + '">PLAY</button> </p>');
//                                }
//                            });
//                            Models.ProjectChat.update_chat(
//                                id, // project_id
//                                /* get message event*/
//                                function(messages) {
//                                    messages.forEach(function(message){
//                                        if(message.type == "text"){
//                                            console.log(message);
//                                            $("#chat").append('<p>' + message.content + '  <b>  NOT MY</b>  </p>');
//                                            console.log("message--message--message--message--message--message--message--message--message--message--message--message--message--message--");
//                                        }
//                                        if(message.type == "audio"){
//                                            $("#chat").append('<p> VOice message <b> MY Message</b><button class="play-send-voice" vo-id="' + message.id + '">PLAY</button> </p>');
//                                        }
//                                    });
//                                }
//                            );
//                        }
//                    });
                //        });

                $(document).on("touchend", "#send", function() {
                    var mess = $("#message-text").val();

                    var data = {
                        //                content     :   "hello world",
                        content: mess,
                        type: "text",
                        project_id: "xiao_projects_8w4bk484&20130916170458"
                                //                            user_id     :   "dsadasdas1212312"
                                //                user_id     :   SESSION.get("user_id")
                    };

                    Models.ProjectChat.send_message(data, function(message) {
                        $("#message-text").val("");
                        $("#chat").append('<p>' + message.content + ' <b> MY Message</b> </p>');
                        console.log(message);
                    });
                });

                var message = {};

                $(document).on("touchend", "#start_record", function() {
                    console.log("start_record pushed");
                    Models.VoiceMessage.record_start(function(file_path) {
                        console.log(file_path);
                        message = {
                            content: "",
                            type: "audio",
                            project_id: "xiao_projects_8w4bk484&20130916170458",
                            local_path: file_path
                        };
                    });
                });

                $(document).on("touchend", "#play_record", function() {
                    console.log("play_record pushed");
                    Models.VoiceMessage.record_play();
                });

                $(document).on("touchend", "#stop_record", function() {
                    console.log("stop_record pushed");
                    Models.VoiceMessage.record_stop();
                });

                $(document).on("touchend", "#send-record", function() {
                    console.log("send_record pushed");
                    console.log(message);
                    Models.ProjectChat.send_message(message, function(data) {
                        $("#message-text").val("");
                        $("#chat").append('<p> VOice message <b> MY Message</b><button class="play-send-voice" vo-id="' + data.id + '">PLAY</button> </p>');
                        console.log(data);
                        message = {};
                    });
                });

                $(document).on("touchend", ".play-send-voice", function() {
                    console.log("play pushed");
                    var id = $(this).attr("vo-id");
                    console.log(id);
                    Models.VoiceMessage.play(id);
                });

                //        $(document).on("click", "#play", function(){
                //            console.log("play pushed");
                //            Models.VoiceMessage.play();
                //        });

                $(document).on("touchend", "#pause", function() {
                    console.log("pause pushed");
                    Models.VoiceMessage.pause();
                });

                $(document).on("touchend", "#stop", function() {
                    console.log("stop pushed");
                    Models.VoiceMessage.stop();
                });
                //////////////////


                //        function init(){
                //            Voice_message.INIT();
                //            console.log("inited");
                //        //    alert("Window")
                //        //    alert(Window)
                //        //    alert(window)
                //        }
            });
}