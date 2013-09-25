function init_app() { //wrapper


    console.log("init_main_html FIRED!!!");

//    Models.User.test_create("", function() {


    var id = "xiao_projects_8w4bk484&20130916170458";
    Models.Project.read(id, function(partners) {

        partners.forEach(function(el, i) {
            i === 0 ? $("#project-info").append('<div>' + el.name + " " + el.description + '</div>') : "";
            $("#project-partners").append(el.name);
        });


    });

//    Models.ProjectChat.chat_init(
//            id, // project_id
//            function(messages) {
//                messages.forEach(function(message) {
//                    if (message.type == "text") {
//                        console.log(message);
//                        $("#chat").append('<p>' + message.content + '  <b>  NOT MY</b>  </p>');
//                        console.log("message--message--message--message--message--message--message--message--message--message--message--message--message--message--");
//                    }
//                    if (message.type == "audio") {
//                        $("#chat").append('<p> VOice message <b> MY Message</b><button class="play-send-voice" vo-id="' + message.id + '">PLAY</button> </p>');
//                    }
//                });
//            }
//    );


    Models.ProjectChat.get_old_messages(
            id, // project_id
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

    $(document).on("click", "#start_record", function() {
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

    $(document).on("click", "#play_record", function() {
        console.log("play_record pushed");
        Models.VoiceMessage.record_play();
    });

    $(document).on("click", "#stop_record", function() {
        console.log("stop_record pushed");
        Models.VoiceMessage.record_stop();
    });

    $(document).on("click", "#send-record", function() {
        console.log("send_record pushed");
        console.log(message);
        Models.ProjectChat.send_message(message, function(data) {
            $("#message-text").val("");
            $("#chat").append('<p> VOice message <b> MY Message</b><button class="play-send-voice" vo-id="' + data.id + '">PLAY</button> </p>');
            console.log(data);
            message = {};
        });
    });

    $(document).on("click", ".play-send-voice", function() {
        console.log("play pushed");
        var id = $(this).attr("vo-id");
        console.log(id);
        Models.VoiceMessage.play(id);
    });

//        $(document).on("click", "#play", function(){
//            console.log("play pushed");
//            Models.VoiceMessage.play();
//        });

    $(document).on("click", "#pause", function() {
        console.log("pause pushed");
        Models.VoiceMessage.pause();
    });

    $(document).on("click", "#stop", function() {
        console.log("stop pushed");
        Models.VoiceMessage.stop();
    });
//}

// document.addEventListener("deviceready", onDeviceReady, false);

//$(document).ready(function(){
//    var id = "xiao_projects_8w4bk484&20130916170458";

    Models.ProjectChat.update_messages(
            "xiao_projects_8w4bk484&20130916170458", // project_id
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

//////////////////


//        function init(){
//            Voice_message.INIT();
//            console.log("inited");
//        //    alert("Window")
//        //    alert(Window)
//        //    alert(window)
//        }
//    });


}
//});