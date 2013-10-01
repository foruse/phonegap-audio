function init_app() { //wrapper


    console.log("init_main_html FIRED!!!");

//    Models.User.test_create("", function() {

        var id = "xiao_projects_8w4bk484&20130916170458";
        Models.Project.read(id, function(project) {
            if(project.id){
                console.log(project);
                $("#project-info").append('<div>title: ' + project.title + ", description: " + project.desc + '</div>');
                project.users.forEach(function(el, i) {
                    $("#project-partners").append(el.name);
                });

                project.messages.forEach(function(message) {
                    if (message.type == "text") {
                        $("#chat").append('<p><span>from:' + message.poster.name + '</span> -"' + message.text + '"</p>');
                    }
                    if (message.type == "audio") {
                        $("#chat").append('<p><span>from:' + message.poster.name + '</span> -<button class="play-send-voice" vo-id="' + message.id + '">PLAY</button></p>');
                    }
                });
            }
        });

        Models.ProjectChat.chat_init(
                id, // project_id
                function(messages) {
                    console.log(messages);
                    messages.forEach(function(message) {
                        if (message.type == "text") {
                            $("#chat").append('<p><span>from:' + message.poster.name + '</span> -"' + message.text + '"</p>');
                        }
                        if (message.type == "audio") {
                            $("#chat").append('<p><span>from:' + message.poster.name + '</span> -<button class="play-send-voice" vo-id="' + message.id + '">PLAY</button></p>');
                        }
                    });
                }
        );

        $(document).on("touchend", "#send", function() {
            var mess = $("#message-text").val();

            var data = {
                //                content     :   "hello world",
                text: mess,
                type: "text",
                project_id: "xiao_projects_8w4bk484&20130916170458"
                        //                            user_id     :   "dsadasdas1212312"
                        //                user_id     :   SESSION.get("user_id")
            };

            Models.ProjectChat.send_message(data, function(message) {
                $("#message-text").val("");
                $("#chat").append('<p><b>ME: </b> ' + message.text + '</p>');
                console.log(message);
            });
        });

        var message = {};

        $(document).on("touchend", "#start_record", function() {
            console.log("start_record PUSHED");
            Models.VoiceMessage.record_start(function(file_path) {
                console.log(file_path);
                message = {
                    text: "",
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
                $("#chat").append('<p><b>ME: </b><button class="play-send-voice" vo-id="' + data.id + '">PLAY</button></p>');
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


        $(document).on("touchend", "#pause", function() {
            console.log("pause pushed");
            Models.VoiceMessage.pause();
        });

        $(document).on("touchend", "#stop", function() {
            console.log("stop pushed");
            Models.VoiceMessage.stop();
        });


//    });
}