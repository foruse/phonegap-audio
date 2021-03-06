// this file consists of:
// 1) Models section (AppModel function and inside Models ) - have models and methods to comunicate with server and db
// 2) server section:
//    a) API - sync local db sqlite with server
//    b) DB  - makes queries to local sqlite db (also have orm helpers)
//    c) SESSION - (localstorage which saves temporary local data like last-table-sync-time, user-id, company-id etc)
//    d) PHONE - communication to Phonegap API
//      1. Phone - basic class for phonegap API --- all listed below are clildren of this class
//      2. VoiceMessage - API for voice messages
//      3. Files - FS object
//      4. Conatcts - API for Phone COntacts
//    e) SOCKET - web-sockets. The main need is project and todo chat. And they are used as a basic server-browser transport
//  ALL queries are going to local db and if server connection is esteblished then tables are sync with server
//   - othervise data which needed to be synced is triggerred to sync table and will be synced when connection to server will be esteblished
//
// For PreProduction we use recreation local db and storage each time _init_storage and _init_db methods (see last lines of this file)
// All the application CONFIGS are in the CONFIG section (line 45)
// routes are saved in the CONFIG
// to get route url from the application we use ROUTE(url)   --> line63
//
// ALSO for production SERVER must be private variable (var SERVER)  --> to debug we use it like GLOBAL   --> SERVER   === for production put "var"
//
// See helpers.js file also   ---> we use helper function from this file(like ID generation, some time functions etc)
//
// in each function I have commented test data --> I commented it to see what data should be ---> also is used for tests
//
// all new DB tables should be added to array SERVER.DB._init_tables   ---> this array is used for sync method and for DB creation
//
// all files downloads/uploads from/to server are go throught SERVER.PHONE.FILES.upload/dowload ---> which saves all in local FS
//
// to tell the front-end part the application to START we use EVENTS (find lines below in this file)
//        var a = document.createEvent("HTMLEvents");
//        a.initEvent("appload", true, true);
//        document.dispatchEvent(a);
//
// ABOUT ORM+SYNC USAGE:
// - basicly we just use API methods like read, insert, update etc
// - but if we need to make query to sereral tables one afeter one etc --> we manualy sync DBs like : API._sync([tables.....]) and then make queries to this DBs like DB.select() and then DB.query(callback)
// - when we manually make queries to DB they are saved to the array of tables needed to synced -to reset this manualy use API._clear_tables_to_sync method
//
//  Liji has file Callserver.js ---> see it in the / or in common/javascript (see that one which is currently used in html)
//              this file is used to trigger Models methods ---> to get some data ;)
//
// PLEASE MENTION THAT SOCKET no interten method should be improved with .on("error"  ...etc   ---> in production

var CURRENT_DEVICE;
BROWSER_TEST_VERSION = function check_dev() {
    var ua = navigator.userAgent.toLowerCase(), device;
    if (ua.match(/(iphone|ipod|ipad)/i)) {
        device = "ios";
        CURRENT_DEVICE = "ios";
    } else if (ua.match(/android/i)) {
        device = "android";
        CURRENT_DEVICE = "android";
    } else if (ua.match(/blackberry/i)) {
        device = "blackberry";
    } else if (ua.match(/windows phone os 7.5/i)) {
        device = "windows";
    } else {
        device = "desktop";
    }
    console.log(device);
    return device === "desktop" ? true : false;
//    return true;
}();
Models = {}; // Models are needed to be created in the following method. As they are used before the device ready actually. They are filled later.
Models.UsersCounter = {  // moved out here while login is not finished
                // uncomment all the stuff below for PRODUCTION
                read: function(callback) {
//                    SOCKET.request("counter", {}, function(result) {
//                        if (result) {
//                            callback(result);
//                        } else {
                    callback({count: 100000, validationImage: "src"});
//                        }
//                    });
                }

            };
//BROWSER_TEST_VERSION ? onDeviceReady() : document.addEventListener("deviceready", onDeviceReady, false);

onDeviceReady();
//Models.VoiceMessage.record_start(function(data){console.log(data);})
//Models.VoiceMessage.record_stop();
//Models.ProjectChat.send_message({project_id:"20131022135459bTtL3QFT_xiao_projects", content:"",type:"voice", local_path:"file:///storage/emulated/0/BAO/20131023131801u5d32Igor.amr"},function(data){console.log(data);})
function onDeviceReady() {
    // APPLICATION CONFIGS
    // APPLICATION CONFIGS
    // APPLICATION CONFIGS
    var CONFIG = {
        routes: {
            sync: "sync",
            sync_chat: "syncchat",
            file_upload_url: "upload",
            sockets: ""
        },
        server_url: "http://115.28.131.52:3000",
//        server_url: "http://192.168.200.110:3000",
//        server_url: "http://212.8.40.254:5959",
//        server_url: "http://gbksoft.com:5959",
//        audio_format: "wav",
        audio_format: CURRENT_DEVICE === "ios" ? "wav" : "amr",
        root_dir: "BAO",
        default_user_avatar: "../../common/image/avatar_default.jpg"
    };

    var ROUTE = function(url) { //server route helper
        return  CONFIG.server_url + "/" + CONFIG.routes[url];
    };
    // APPLICATION CONFIGS
    // APPLICATION CONFIGS
    // APPLICATION CONFIGS

        var a = document.createEvent("HTMLEvents"); //fire up frontend part Event ---> event created
        a.initEvent("appload", true, true); //init event -----------------> see the last line in the App_model--->the event is dispatched there

        App_model = function(SERVER) {
            /* Private */
            var API = SERVER.API,  //redefine all the stuff here for more simple usage
                    DB = SERVER.DB,
                    SESSION = SERVER.SESSION,
                    PHONE = SERVER.PHONE,
                    SOCKET = SERVER.SOCKET;
            /* Private */

            // Models
            // Models
            // Models
            Models.Contacts = {
                // we do not save contacts to any DB (local or remote) as they are already stored in the phone
                // so we simply query them from phone

                // still an implementation of getPhoneNumber is needed
                // need to use a custom plugin OR user should enter the phonenumber
                read: function(callback) {
                    PHONE.Contacts.read(function(contacts) {
                        callback(contacts);
                    });
                },
                // find: when new user appear in the compay we trigger this method(FIND) to find this user in our contact list by phone or email
                // 
                // I need to add using this method to _sync method...
                // if(table === "xiao_users"){
                //    Contacts.find(user_record, callback)
                // }
                find: function(params, callback) {
                    // check params format needed
                    PHONE.Contacts.filter(params, function(contacts) {
                        callback(contacts);
                    });
                },
                invite_via_email: function(emails, callback) {
                    //  we need just "to" here
                    var data = {};
                    data.to = emails;
                    data.from = SESSION.get("user_email");
                    callback ? SOCKET.request("email", data, callback) : SOCKET.request("email", data);
                },
                invite_via_sms: function() {
                    // Kyle told not to use any stuff for sms
                    // just basic phone send sms features --> so in HTML <a href="sms:+380978822222222"
                    // or phonegap plugin
                }
            };

//            Models.UsersCounter = {
//                // uncomment all the stuff below for PRODUCTION
//                read: function(callback) {
//                    SOCKET.request("counter", {}, function(result) {
//                        if (result) {
//                            callback(result);
//                        } else {
//                            callback({count: 100000, validationImage: "src"});
//                        }
//                    });
//                }
//
//            };

            Models.Partner = {
                read: function(id, callback) { // if id is specified we get one partner else all partners
                    if (typeof(id) === "function") {// no id
                        callback = id;
                        console.log("all partners");
                        // all partners
                        DB.select("u.id, u.name, u.pinyin, u.local_path as avatar, u.company_id, u.position, u.phoneNum, u.email, u.adress, u.isNewUser, u.QRCode, c.title as company, c.companyAdress");
                        DB.from("xiao_company_partners AS p");
                        DB.join("xiao_users AS u", "u.id = p.user_id");
                        DB.join("xiao_companies AS c", "u.company_id = c.id");
                        DB.where('c.id ="' + SESSION.get("company_id") + '"'); // actually not needed
//                            DB.where('p.user_id ="' + SESSION.get("user_id") + '"');
                        DB.where('p.user_id <>"' + SESSION.get("user_id") + '"');
                        API.read(callback);
                    } else if (id) {
                        console.log("partner by id");
                        // partner by id
                        DB.select("u.id, u.name, u.pinyin, u.local_path as avatar, u.company_id, u.position, u.phoneNum, u.email, u.adress, u.isNewUser, u.QRCode, c.title as company, c.companyAdress");
                        DB.from("xiao_users AS u");
                        DB.join("xiao_company_partners AS p", "p.user_id = u.id");
                        DB.join("xiao_companies AS c", "p.company_id = c.id");
                        DB.where('u.id ="' + id + '"');
                        API.row(callback);
                    }
                },
                remove: function(user_id, callback) {
                    // remove partner from company
//                        API.remove("xiao_company_partners", 'user_id="' + user_id + '"', callback);
                    var s_counter = 0;
                    DB.remove("xiao_company_partners", 'user_id="' + user_id + '"', make_sync);
                    DB.remove("xiao_project_partners", 'user_id="' + user_id + '"', make_sync);
                    DB.remove("xiao_partner_group_users", 'user_id="' + user_id + '"', make_sync);
                    function make_sync() {
                        ++s_counter;
                        if (s_counter === 3)
                            callback ? API._sync(['xiao_company_partners', 'xiao_project_partners', 'xiao_partner_group_users'], callback) : API._sync(['xiao_company_partners', 'xiao_project_partners', 'xiao_partner_group_users']);
                    }
                }

            };

            Models.Partner_Groups = {
                read: function(callback) {  // get all groups NAMES
                    DB.select("g.id, g.name");
                    DB.from("xiao_partner_groups AS g");
                    DB.where('g.creator_id ="' + SESSION.get("user_id") + '"');
                    API.read(callback);
                },
                get_group_users: function(id, callback) {
                    DB.select("u.id, u.name, u.pinyin, u.local_path as avatar, u.company_id, u.position, u.phoneNum, u.email, u.adress, u.isNewUser, u.QRCode, c.title as company, c.companyAdress");
                    DB.from("xiao_partner_groups AS g");
                    DB.join("xiao_partner_group_users AS gu", "gu.group_id = g.id");
                    DB.join("xiao_users AS u", "u.id = gu.user_id");
                    DB.join("xiao_companies AS c", "u.company_id = c.id");
//                        DB.left_join("xiao_partner_group_users AS gu", "gu.group_id = g.id");
//                        DB.left_join("xiao_users AS u", "u.id = gu.user_id");
//                        DB.left_join("xiao_companies AS c", "u.company_id = c.id");
                    DB.where('g.creator_id ="' + SESSION.get("user_id") + '"');
                    if (id != -1)
                        DB.where('g.id = "' + id + '"'); // if id is (-1) then we get ALL users in ALL groups
                    API.read(callback);
                },
                create: function(data, callback) {
                    // data is following:
//                        data = {
//                            name: "Igor_group",
//                            users: ['3232323','23123dfsd','321312f444']
//                        };
                    if (data) {
                        DB.insert('xiao_partner_groups', {
                            name: data.name,
                            creator_id: SESSION.get("user_id")
                        }, function(insert_id) {
                            if (callback) {
                                callback(insert_id);
                            }
                            if (data.users && data.users.length > 0) {
                                var partners = [];
                                for (var i in data.users) {
                                    partners.push({
                                        group_id: insert_id,
                                        user_id: data.users[i].id
                                    });
                                }
                                DB.batch_insert('xiao_partner_group_users', partners, function() {
                                    API._sync(['xiao_partner_groups', 'xiao_partner_group_users']);
                                });
                            } else {
                                API._sync(['xiao_partner_groups']);
                            }
                        });
                    }
                }

            };
            Models.User = {
                
                update: function(data, callback) {

//                        data = {
//                            name: "Igor",
//                            avatar: "src?sdsd/../fsdfsd",     --->    local_path
//                            pinyin: "x",
//                            pwd: "testuser_123",
//                            email: "testuser_123",
//                            QRCode: "testuser_123",
//                            adress: "testuser_123",
//                            phoneNum: "testuser_123",
//                            position: "testuser_123",
//                            isNewUser: 1,
//                            company_id: 1
//                        };
//                    for(var i in data){
//                        alert(i);
//                        alert(data[i]);
//                    }
                    if("avatar" in data && data.avatar == "" && data.avatar === null){
//                        alert("avatar empty")
                        delete data.avatar;
                    }
                    if("avatar" in data && data.avatar != "" && data.avatar !== null){
//                        alert("avatar not emt")
                        data.local_path = data.avatar;
                        delete data.avatar;
//                        data.server_path = ""; //  ----->>   HOOK TO KNOW in sync THAT avatar was updated
                        data.avatar_update = "1"; //  ----->>   HOOK TO KNOW in sync THAT avatar was updated
                    }
                    if("password" in data){
                        data.pwd = data.password;
                        delete data.password;
                    }
                    console.log("update_user_data")
                    console.log(data)
                    callback ?
                            API.update('xiao_users', data, 'id="' + SESSION.get("user_id") + '"', function(){
                                DB.select("u.id, u.name, u.pinyin, u.local_path, u.server_path, u.company_id, u.position, u.phoneNum, u.email, u.adress, u.isNewUser, u.QRCode, c.title as company, c.companyAdress");
                                DB.from("xiao_users AS u");
                                DB.left_join("xiao_companies AS c", "u.company_id = c.id");
                                DB.where('u.id ="' + SESSION.get("user_id") + '"');
                                DB.row(function(new_user_data){
                                    new_user_data.avatar = (new_user_data.local_path != "" && new_user_data.local_path != CONFIG.default_user_avatar) ? new_user_data.local_path : new_user_data.server_path;
                                    callback(new_user_data);
                                });
                            }) :
                            API.update('xiao_users', data, 'id="' + SESSION.get("user_id") + '"');
                },
                read: function(callback) {
                    // get user data
                    DB.select("u.id, u.name, u.pinyin, u.local_path, u.server_path, u.company_id, u.position, u.phoneNum, u.email, u.adress, u.isNewUser, u.QRCode, c.title as company, c.companyAdress");
                    DB.from("xiao_users AS u");
                    DB.left_join("xiao_companies AS c", "u.company_id = c.id");
                    DB.where('u.id ="' + SESSION.get("user_id") + '"');
//                    API.row(callback);
                    API.row(function(data){
                        data.avatar = (data.local_path != "" && data.local_path != null && data.local_path !== CONFIG.default_user_avatar ) ? data.local_path : data.server_path;
                        callback(data);
                    });
                },
//                    create: function(data, callback) {
//
////                        data = {
////                            name: _random(4, "new_user"),
////                            avatar: _random(4, "avatar_"),
////                            pinyin: "x",
////                            pwd: _random(4, "pwd"),
////                            email: _random(4, "email"),
////                            QRCode: _random(4, "QRCOEDE"),
////                            adress: "testuser_123",
////                            phoneNum: "testuser_123",
////                            position: "testuser_123",
////                            isNewUser: 1,
////                            company_id: 1
////                        };
//
//                        API.insert('xiao_users', data, function(insert_id) {
//                            SESSION.set("user_id", insert_id);
//                            SESSION.set("user_name", "new_test_user");
//                            callback(data);
//                        });
//                    },

                login: function(data, callback) {
//                        var data = {
//                            pwd: "123",
//                            email: "test@mail.ru"
//                        };
                    if (!data.pwd || !data.email) {
                        callback({status: -1});
                    }
//                        var _this = this;
//                        this.test_create(data, function(user_id) {
//                            SESSION.set("user_id", user_id);
//                            SESSION.set("user_name", "new_test_user");
//                            _this.read(function(user_data) {
//                                callback({
//                                    status: 0,
//                                    user: user_data
//                                });
//                            });
//                        });
//                    console.log(SESSION.get("saved_user_data"));
//                    if( SESSION.get("saved_user_data") ){
//                        alert("12")
//                        callback(JSON.parse(SESSION.get("saved_user_data")))
//                    }else{

                    if(SESSION.get("user_pass")){
                        var old_user_data = SESSION.get("saved_user_data"),
                            json_old_user_data = JSON.parse(old_user_data);
                        console.log({
                            status  :   0,
                            user    :   json_old_user_data
                        });
                        callback({
                            status  :   0,
                            user    :   json_old_user_data
                        });
                    }else{
                        SOCKET.request("login", data, function(result) {
                            console.log(result);
                            if (result !== false) {
                                if (result.user) {
                                    SERVER.SESSION._init_storage(1);
                                    SERVER.DB._init_db(1);                   
//                                    result.user.isNewUser = 0;
                                    SESSION.set("saved_user_data", JSON.stringify(result.user));
                                    SESSION.set("user_id", result.user.id);
                                    SESSION.set("user_name", result.user.name);
                                    SESSION.set("user_email", result.user.email);
                                    SESSION.set("user_pwd", result.user.pwd);
                                    callback(result);
    //                                    if (result.user.isNewUser == 1){
    //    //                                    alert("cool");
    //                                        API.update("xiao_users", {isNewUser: 0}, 'id="' + result.user.id + '"');
    //                                    }
                                    console.log(result);
                                    //                                callback(result);
                                } else if (result.error) {
                                    console.log(result);
                                    callback(result);
                                } else {
                                    console.log(result);
                                    callback({
                                        status: -1,
                                        error: {
                                            type: "email",
                                            idx: 1,
                                            desc: "data is not correct"
                                        }
                                    });
                                }
                            } else {
                                alert("no internet");
                            }
                            //                            } else {
                            //                                console.log(data)
                            //                                //offline like this for now in development
                            //                                if (SESSION.get("user_id") && SESSION.get("user_pwd") && SESSION.get("user_name") && SESSION.get("user_email")) {
                            //                                    if (SESSION.get("user_pwd") == md5(data.pwd) && SESSION.get("user_email") == data.email) {
                            //                                        Models.User.read(function(offline_user) {
                            //
                            //                                            callback({user: offline_user, status: 0});
                            //                                        });
                            ////                                        callback({
                            ////                                            status: 0
                            ////                                        });
                            //                                    } else {
                            //                                        callback({
                            //                                            status: -1
                            //                                        });
                            //                                    }
                            //                                } else {
                            //                                    callback({
                            //                                        status: -1
                            //                                    });
                            //                                }
                            //                            }
                        });
//                    }
                    }

                },
                        
                logout: function(callback){
                    //session
//                    SESSION.clear();
                    callback();
                },
                        
                create: function(data, callback) {
//                        data = {
//                            name: "Igor",
//                            avatar: "src?sdsd/../fsdfsd",    ----> local_path
//                            pwd: "testuser_123",
//                            email: "testuser_123",
//                            adress: "testuser_123",
//                            phoneNum: "testuser_123",
//                            position: "testuser_123"
//                        };
                    if("avatar" in data){
                        data.local_path = data.avatar;
                        delete data.avatar;
                        data.server_path = "";
                    }
                    SOCKET.request("registration", data, function(result) {
                        if (result !== false) {
                            if (result.user) {
                                API._sync(['xiao_users', 'xiao_company_partners'], function() {

                                    DB.insert_with_id('xiao_users', result.user);
                                    API._clear_tables_to_sync();
                                    SESSION.set("user_id", result.user.id);
                                    SESSION.set("user_name", result.user.name);
                                    callback({
                                        status: 0,
                                        user: result.user
                                    });

                                });
                            } else if (result.error.code == 2) {
                                console.log(result.error.message);
                                callback({
                                    status: -1
                                });
                            } else {
                                console.log(result.error.message);
                                callback({
                                    status: -1
                                });
                            }
                        } else {
                            alert("no internet connection");
                        }
                    });
                }

            };
            Models.VoiceMessage = {
                _last_play_id: null,
                _last_play_path: null,
                _last_record_path: null,
                record_start: function(callback) {
                    // we need to return record path
                    var _this = this;
                    PHONE.VoiceMessage.record_start(function(path) {
                        console.log(path);
                        _this._last_record_path = path;
                        callback(path);
                    });
                },
                record_stop: function() {
                    PHONE.VoiceMessage.record_stop();
                },
                record_play: function() {
                    //                        if(this._last_record_path === null){return false;}
                    PHONE.VoiceMessage.record_play(this._last_record_path);
                },
                play: function(id, type, callback) {
                    var _this = this;
                    if (id == this._last_play_id && this._last_play_path != null) {
                        console.log("PLAY SAME FILE!!!");
                        // if continue to play current media file
                        PHONE.VoiceMessage.play(this._last_play_path, function(dur){
//                            callback(Math.ceil(dur));
                            PHONE.VoiceMessage.getPlayTime(function(pos){
                                callback(Math.ceil(dur), Math.ceil(pos));
                            });
                        });
                    } else {
                        // if new media file
                        // we check db if this file exists in local fs
                        if(type != "project" && type != "todo"){console.log("type:");console.log(type);alert(type);alert("no type");return;}
                                DB.select('pc.id, pc.local_path, pc.server_path');
                                DB.from('xiao_'+type+'_comments AS pc');
                                DB.where('pc.id="' + id + '"');
                                DB.row(function(data) {
                                    console.log("PLAY data");
                                    console.log(data);
                                    if (data.local_path != "" && data.local_path != undefined) {
                                        console.log("file exists");
                                        // if this file exists in local db then there is a local path in the db
                                        PHONE.VoiceMessage.play_and_get_duration(data['local_path'], function(dur){
//                                            callback(Math.ceil(dur));
                                            PHONE.VoiceMessage.getPlayTime(function(pos){
                                                callback(Math.ceil(dur), Math.ceil(pos));
                                            });
                                        });
                                        _this._last_play_path = data.local_path;
                                        _this._last_play_id = id;
                                    } else {
                                        console.log("no file");
                                        PHONE.VoiceMessage.download(data['server_path'], function(new_local_path) {
                                            console.log("new_local_path");
                                            console.log(new_local_path);
                                            PHONE.VoiceMessage.play_and_get_duration(new_local_path, function(dur){
//                                                callback(Math.ceil(dur));
                                                PHONE.VoiceMessage.getPlayTime(function(pos){
                                                    callback(Math.ceil(dur), Math.ceil(pos));
                                                });
                                            });
                                            _this._last_play_path = new_local_path;
                                            _this._last_play_id = id;
                                            DB.update('xiao_'+type+'_comments', {local_path: new_local_path}, 'id="' + id + '"');
                                        });
                                    }
                                });
                                API._clear_tables_to_sync();
                    }
                },
                stop: function() {
                    // stop current media
                    PHONE.VoiceMessage.stop();
                },
                pause: function() {
                    // pause current media
                    PHONE.VoiceMessage.pause();
                },
                get_current_position : function(callback){
                    PHONE.VoiceMessage.getPlayTime(callback);
                },
                set_current_position: function(pos){
                    PHONE.VoiceMessage.seekTo(pos);
                }

            };
            
            Models.Picture = {
                camera: function(callback){
                    console.log("camera")
                    PHONE.Photos.camera(callback);
                },
                album: function(callback){
                    console.log("album")
                    PHONE.Photos.album(callback);
                },
                download: function(table, id, callback){
                    DB.select('server_path');
                    DB.from('xiao_'+table);
                    DB.where('id = "'+id+'"');
                    DB.col(function(server_path){
                        if(server_path && server_path != ""){
                            PHONE.Files.download(server_path, function(local_path){
                                callback(local_path);
                                DB.update('xiao_'+table, {local_path:local_path}, 'id = "'+id+'"', function(){
//                                    API._remove_from_sync('xiao_'+table);
                                });
                            });
                        }else{
                            callback(false);
                        }
                    });
                    API._clear_tables_to_sync();
                }
            };
            
            Models.Project = {
                create: function(data, callback) {
                    // data is following:
//                        data = {
//                            project: {
//                                title: "sssss",
//                                descr: "sssss",
//                                color: "7",
//                                creationTime: new Date().getTime()
//                            }, 
//                            users: ["sdasdaad3232323","sdasdaad3232323sasd"],
//                        };

                    data.project['creator_id'] = SESSION.get("user_id");

                    data.users.push(SESSION.get("user_id"));
                    if (data.project) {
                        DB.insert('xiao_projects', data.project, function(insert_id) {
                            if (data.users && data.users.length > 0) {
                                var partners = [];
                                for (var i in data.users) {
                                    partners.push({
                                        project_id: insert_id,
                                        user_id: data.users[i]
                                    });
                                }
                                DB.batch_insert('xiao_project_partners', partners, function(){
                                    API._sync(['xiao_projects', 'xiao_project_partners'], callback);
                                });
                            }else{
                                API._sync(['xiao_projects'], callback);
                            }
                        });
                    }
                },
                last_page_index: null,
                read: function(params, callback) {
                    if ("id" in params) {
                        // get inside project page
                        var result = {};
                        API._sync(["xiao_projects", "xiao_project_partners", "xiao_users", "xiao_project_comments", "xiao_companies"], function() {
                            DB.select("p.id, p.level, p.title, p.color, p.creator_id, p.creationTime, p.completeDate, p.descr, u.id as uid, u.name, u.pinyin, u.local_path, u.server_path, u.company_id, u.position, u.phoneNum, u.email, u.adress, u.isNewUser, u.QRCode, c.title as company, c.companyAdress, c.creator_id as company_creator_id, pp.isLeader");
                            DB.from("xiao_projects AS p");
                            DB.join("xiao_project_partners AS pp", "pp.project_id = p.id");
                            DB.join("xiao_users AS u", "u.id = pp.user_id");
                            DB.join("xiao_companies AS c", "u.company_id = c.id");
                            DB.where('p.id ="' + params.id + '"');

                            DB.query(function(partners) {
                                var project = {};
                                if (partners.length > 0) {
                                    project = {
                                        id: partners[0].id,
                                        level: partners[0].level,
                                        title: partners[0].title,
                                        color: partners[0].color,
                                        creationTime: partners[0].creationTime,
                                        completeDate: partners[0].completeDate,
                                        unread: 0,
                                        desc: partners[0].descr,
                                        attachments: []
                                    };
                                    project.users = [];
                                    partners.forEach(function(pp) {
                                        project.users.push({
                                            id: pp.uid,
                                            name: pp.name,
                                            pinyin: pp.pinyin,
//                                            avatar: pp.avatar,
                                            avatar: (pp.local_path != "" && pp.local_path != CONFIG.default_user_avatar) ? pp.local_path : pp.server_path,
                                            company: pp.company,
                                            companyAdress: pp.companyAdress,
                                            position: pp.position,
                                            phoneNum: pp.phoneNum,
                                            email: pp.email,
                                            adress: pp.adress,
                                            isNewUser: pp.isNewUser,
                                            QRCode: pp.QRCode
                                        });
                                    });
                                }
//                                console.log(project)
                                make_callback({project: project});
                            });
                            
                            DB.select("p.id, p.level, p.title, p.color, p.creator_id, p.creationTime, p.completeDate, p.descr, u.id as uid, u.name, u.pinyin, u.local_path, u.server_path, u.company_id, u.position, u.phoneNum, u.email, u.adress, u.isNewUser, u.QRCode, c.title as company, c.companyAdress, c.creator_id as company_creator_id");
                            DB.from("xiao_projects AS p");
                            DB.join("xiao_users AS u", "u.id = p.creator_id");
                            DB.join("xiao_companies AS c", "u.company_id = c.id");
                            DB.where('p.id ="' + params.id + '"');
                            DB.row(function(creator) {
                                
                                var cr_user = {};
                                if (creator) {
                                    cr_user = {
                                        id: creator.uid,
                                        name: creator.name,
                                        pinyin: creator.pinyin,
//                                        avatar: creator.avatar,
                                        avatar: (creator.local_path != "" && creator.local_path != CONFIG.default_user_avatar) ? creator.local_path : creator.server_path,
                                        company: creator.company,
                                        companyAdress: creator.companyAdress,
                                        position: creator.position,
                                        phoneNum: creator.phoneNum,
                                        email: creator.email,
                                        adress: creator.adress,
                                        isNewUser: creator.isNewUser,
//                                            isLeader: leader,
                                        QRCode: creator.QRCode
                                    };
                                }
                                make_callback({creator: cr_user});
                            });

                            API._clear_tables_to_sync();
                            function make_callback(data) {
//                                console.log(data)
                                if (data.project) {
                                    result.project = data.project;
                                    if (data.project.users) {
                                        result.users = data.project.users;
                                    }
                                }
                                if (data.creator) {
                                    result.creator = data.creator;
                                }
                                if (data.users) {
                                    result.users = data.users;
                                }
                                if (result.project && result.creator && result.users) {
                                    var res = {};
                                    res = result.project;
                                    res.creator = result.creator;
                                    res.users = result.users;
                                    res.attachments = [];
//                                    console.log(res)
                                    callback(res);
                                    DB.update("xiao_project_comments", {read:"1"}, 'project_id = "'+ params.id +'" ', function(){
//                                        API._remove_from_sync("xiao_project_comments");
                                    });
                                }
                            }
                        });
                    } else {
                        // get ALL projects page
                        if (params.pageIndex === this.last_page_index && params.pageIndex !== 1)
                            return;
                        this.last_page_index = params.pageIndex;
                        if ("pageIndex" in params && "pageSize" in params) {
                            var result = [], logged_user = SESSION.get("user_id");
//                            console.log(params)
                            params.othersOffset = (params.othersOffset ? params.othersOffset : 0);
                            API._sync(["xiao_projects", "xiao_project_partners", "xiao_users", "xiao_project_comments", "xiao_companies", "xiao_todo_comments"], function() {
                                // get all projects with ME
                                DB.select("p.id, p.level, p.title, p.color, p.creator_id, p.creationTime, p.completeDate, p.descr, u.id as uid, u.name, u.pinyin, u.local_path, u.server_path, u.company_id, u.position, u.phoneNum, u.email, u.adress, u.isNewUser, u.QRCode, c.title as company, c.companyAdress, c.creator_id as company_creator_id, 1 as status");
                                DB.from("xiao_project_partners AS pp");
//                                DB.from("xiao_projects AS p");
                                DB.join("xiao_projects AS p", "pp.project_id = p.id");
                                DB.join("xiao_users AS u", "u.id = p.creator_id");
                                DB.join("xiao_companies AS c", "u.company_id = c.id");
                                DB.where('pp.user_id = "' + logged_user + '"');
                                DB.where('p.archived <> "1"');
                                DB.group_by('p.id');
//                                DB.having('pp.user_id = "' + logged_user + '"');
                                DB.limit(params.pageSize, (params.pageIndex - 1) * params.pageSize);

                                DB.query(function(projects) {
                                    var others_limit = params.pageSize - projects.length;
                                    if (others_limit > 0) {
                                        //if project length < page size(8) 
                                        // then GET also some projects without me
                                        DB.select("DISTINCT p.id, p.level, p.title, p.color, p.creator_id, p.creationTime, p.completeDate, p.descr, u.id as uid, u.name, u.pinyin, u.local_path, u.server_path, u.company_id, u.position, u.phoneNum, u.email, u.adress, u.isNewUser, u.QRCode, c.title as company, c.companyAdress, c.creator_id as company_creator_id, 2 as status");
                                        DB.from("xiao_projects AS p");
                                        DB.left_join("xiao_project_partners AS pp", "pp.project_id = p.id");
                                        DB.left_join("xiao_users AS u", "u.id = p.creator_id");
                                        DB.left_join("xiao_companies AS c", "u.company_id = c.id");
                                        DB.where('p.archived <> "1"');
                                        DB.group_by('p.id');
                                        DB.having('p.id NOT IN ( SELECT project_id FROM xiao_project_partners WHERE user_id = "' + logged_user + '" )');
                                        DB.limit(others_limit, params.othersOffset);
                                        DB.query(function(projects_others) {
                                            
                                            projects = projects.concat(projects_others); // add not status 2 project to the end
                                            if (projects.length > 0) {

                                                projects.forEach(function(pr) {

                                                    DB.select("u.id as uid, u.name, u.pinyin, u.server_path as avatar, u.company_id, u.position, u.phoneNum, u.email, u.adress, u.isNewUser, u.QRCode, c.title as company, c.companyAdress, c.creator_id as company_creator_id, pp.isLeader");
//                                                    DB.select("u.id as uid, u.name, u.pinyin, u.local_path as avatar, u.company_id, u.position, u.phoneNum, u.email, u.adress, u.isNewUser, u.QRCode, c.title as company, c.companyAdress, c.creator_id as company_creator_id, pp.isLeader");
                                                    DB.from("xiao_projects AS p");
                                                    DB.join("xiao_project_partners AS pp", "pp.project_id = p.id");
                                                    DB.join("xiao_users AS u", "u.id = pp.user_id");
                                                    DB.join("xiao_companies AS c", "u.company_id = c.id");
                                                    DB.where('p.id ="' + pr.id + '"');
                                                    DB.query(function(partners) {
                                                        DB.select('SUM(r) FROM (SELECT COUNT(tc.read) as r FROM xiao_todo_comments AS tc INNER JOIN xiao_todos as t ON t.id = tc.todo_id WHERE t.project_id = "'+pr.id+'" AND tc.read = "0" AND (t.user_id = "'+logged_user+'" OR t.creator_id = "'+logged_user+'" ) UNION SELECT COUNT(pc.read) as r FROM xiao_project_comments as pc WHERE pc.project_id = "'+pr.id+'" AND pc.read = "0")');
                                                        
                                                        
                                                        
//                                                        DB.select('COUNT(pc.read) as unread');
//                                                        DB.from("xiao_project_comments AS pc");
//                                                        DB.where('pc.project_id ="' + pr.id + '"');
//                                                        DB.where('pc.read ="0"');
                                                        DB.col(function(unread1) {
                                                            
                                                            
//                                                            DB.select('COUNT(tc.read) AS unread');
//                                                            DB.from('xiao_todo_comments AS tc');
//                                                            DB.join('xiao_todos AS t','tc.todo_id = t.id');
//                                                            DB.where('t.project_id = "'+pr.id+'"');
//                                                            DB.where('tc.read = "0"');
//                                                            DB.where('(t.user_id = "'+logged_user+'" OR t.creator_id = "'+logged_user+'" )');
//                                                            
//                                                            DB.col(function(unread2) {
                                                            
                                                                DB.select("pc.content, pc.type");
                                                                DB.from("xiao_project_comments AS pc");
                                                                DB.where('pc.project_id ="' + pr.id + '"');
                                                                DB.order_by_desc('pc.time');                                                            
                                                                DB.row(function(last_message) {
//                                                                    if(typeof(last_message) !== "undefined"){
//                                                                        switch(last_message.type){
//                                                                            case "voice":
//                                                                                last_message.content = "new_voice_message";
//                                                                                break;
//                                                                            case "image":
//                                                                                last_message.content = "new_voice_message";
//                                                                                break;
//                                                                            default:
//                                                                                break;
//                                                                        } 
//                                                                    }else{
//                                                                        last_message = {content : ""};
//                                                                    }
                                                                    if(typeof(last_message) === "undefined"){
                                                                        last_message = {content : "", type:"text"};
                                                                    }
                                                                    result.push({
                                                                        status: pr.status,
                                                                        id: pr.id,
                                                                        level: pr.level,
                                                                        title: pr.title,
                                                                        color: pr.color,
                                                                        creationTime: pr.creationTime,
                                                                        completeDate: pr.completeDate,
//                                                                        unread: unread,
//                                                                        unread: parseInt(unread1,10)+parseInt(unread2,10),
                                                                        unread: parseInt(unread1,10),
                                                                        desc: pr.descr,
                                                                        lastMessage: last_message,
//                                                                        lastMessage: last_message.content,
                                                                        creator: {
                                                                            id: pr.uid,
                                                                            name: pr.name,
                                                                            pinyin: pr.pinyin,
//                                                                            avatar: pr.avatar,
                                                                            avatar: (pr.local_path != "" && pr.local_path != CONFIG.default_user_avatar) ? pr.local_path : pr.server_path,
                                                                            company: pr.company,
                                                                            companyAdress: pr.companyAdress,
                                                                            position: pr.position,
                                                                            phoneNum: pr.phoneNum,
                                                                            email: pr.email,
                                                                            adress: pr.adress,
                                                                            isNewUser: pr.isNewUser,
                                                                            isLeader: "1",
                                                                            QRCode: pr.QRCode
                                                                        },
                                                                        users: partners
                                                                    });
                                                                    if (result.length == projects.length) {
                                                                        if (params.pageSize - projects.length === 0) {
                                                                            DB.select("create_projects");
                                                                            DB.from("xiao_users");
                                                                            DB.where('id="' + SESSION.get('user_id') + '"');
                                                                            DB.col(function(createProjects) {
                                                                                callback({
                                                                                    projects: result,
                                                                                    pageIndex: params.pageIndex,
                                                                                    pageSize: params.pageSize,
        //                                                                            createProjects: createProjects,
                                                                                    othersOffset: params.othersOffset + others_limit,
                                                                                    emptyFolders: params.pageSize - projects.length
                                                                                });
                                                                            });

                                                                        } else {
                                                                            callback({
                                                                                projects: result,
                                                                                pageIndex: params.pageIndex,
                                                                                pageSize: params.pageSize,
                                                                                othersOffset: params.othersOffset + others_limit,
                                                                                emptyFolders: params.pageSize - projects.length
                                                                            });
                                                                        }
                                                                    }
                                                                });
                                                            });
//                                                        });

                                                        API._clear_tables_to_sync();
                                                    });
                                                    API._clear_tables_to_sync();
                                                });

                                            } else {
                                                DB.select("create_projects");
                                                DB.from("xiao_users");
                                                DB.where('id="' + SESSION.get('user_id') + '"');
                                                DB.col(function(createProjects) {
                                                    callback({
                                                        projects: [],
                                                        pageIndex: params.pageIndex,
                                                        pageSize: params.pageSize,
//                                                        createProjects: createProjects,
                                                        othersOffset: params.othersOffset + others_limit,
                                                        emptyFolders: params.pageSize - projects.length
                                                    });
                                                });
                                            }

                                        });

                                    } else {

                                        projects.forEach(function(pr) {

                                            DB.select("u.id as uid, u.name, u.pinyin, u.server_path as avatar, u.company_id, u.position, u.phoneNum, u.email, u.adress, u.isNewUser, u.QRCode, c.title as company, c.companyAdress, c.creator_id as company_creator_id, pp.isLeader");
                                            DB.from("xiao_projects AS p");
                                            DB.join("xiao_project_partners AS pp", "pp.project_id = p.id");
                                            DB.join("xiao_users AS u", "u.id = pp.user_id");
                                            DB.join("xiao_companies AS c", "u.company_id = c.id");
                                            DB.where('p.id ="' + pr.id + '"');
                                            DB.query(function(partners) {
                                                
//                                                DB.select("COUNT(pc.read) as unread");
//                                                DB.from("xiao_project_comments AS pc");
//                                                DB.where('pc.project_id ="' + pr.id + '"');
//                                                DB.where('pc.read ="0"');
                                                DB.select('SUM(r) FROM (SELECT COUNT(tc.read) as r FROM xiao_todo_comments AS tc INNER JOIN xiao_todos as t ON t.id = tc.todo_id WHERE t.project_id = "'+pr.id+'" AND tc.read = "0" AND (t.user_id = "'+logged_user+'" OR t.creator_id = "'+logged_user+'" ) UNION SELECT COUNT(pc.read) as r FROM xiao_project_comments as pc WHERE pc.project_id = "'+pr.id+'" AND pc.read = "0")');
                                                DB.col(function(unread1) {
                                                    
//                                                    DB.select('COUNT(tc.read) AS unread');
//                                                    DB.from('xiao_todo_comments AS tc');
//                                                    DB.join('xiao_todos AS t','tc.todo_id = t.id');
//                                                    DB.where('t.project_id = "'+pr.id+'"');
//                                                    DB.where('tc.read = "0"');
//                                                    DB.where('(t.user_id = "'+logged_user+'" OR t.creator_id = "'+logged_user+'" )');
//                                                    DB.col(function(unread2) {
                                                    
                                                        DB.select("pc.content, pc.type");
                                                        DB.from("xiao_project_comments AS pc");
                                                        DB.where('pc.project_id ="' + pr.id + '"');
                                                        DB.order_by_desc('pc.time');                                                            
                                                        DB.row(function(last_message) {
//                                                            if(typeof(last_message) !== "undefined"){
//                                                                switch(last_message.type){
//                                                                    case "voice":
//                                                                        last_message.content = "new_voice_message";
//                                                                        break;
//                                                                    case "image":
//                                                                        last_message.content = "new_voice_message";
//                                                                        break;
//                                                                    default:
//                                                                        break;
//                                                                } 
//                                                            }else{
//                                                                last_message = {content : ""};
//                                                            }
                                                            if(typeof(last_message) === "undefined"){
                                                                last_message = {content : "", type:"text"};
                                                            }
                                                            result.push({
                                                                status: pr.status,
                                                                id: pr.id,
                                                                level: pr.level,
                                                                title: pr.title,
                                                                color: pr.color,
                                                                creationTime: pr.creationTime,
                                                                unread: parseInt(unread1,10),
//                                                                unread: unread,
                                                                descr: pr.descr,
//                                                                lastMessage: last_message.content,
                                                                lastMessage: last_message,
                                                                creator: {
                                                                    id: pr.uid,
                                                                    name: pr.name,
                                                                    pinyin: pr.pinyin,
                                                                    avatar: (pr.local_path != "" && pr.local_path != CONFIG.default_user_avatar) ? pr.local_path : pr.server_path,
                                                                    company: pr.company,
                                                                    companyAdress: pr.companyAdress,
                                                                    position: pr.position,
                                                                    phoneNum: pr.phoneNum,
                                                                    email: pr.email,
                                                                    adress: pr.adress,
                                                                    isNewUser: pr.isNewUser,
                                                                    isLeader: "1",
                                                                    QRCode: pr.QRCode
                                                                },
                                                                users: partners
                                                            });
                                                            if (result.length == projects.length) {
                                                                if (params.pageSize - projects.length === 0) {
                                                                    DB.select("create_projects");
                                                                    DB.from("xiao_users");
                                                                    DB.where('id="' + SESSION.get('user_id') + '"');
                                                                    DB.col(function(createProjects) {
                                                                        callback({
                                                                            projects: result,
                                                                            pageIndex: params.pageIndex,
                                                                            pageSize: params.pageSize,
        //                                                                    createProjects: createProjects,
                                                                            emptyFolders: params.pageSize - projects.length
                                                                        });
                                                                    });

                                                                } else {
                                                                    callback({
                                                                        projects: result,
                                                                        pageIndex: params.pageIndex,
                                                                        pageSize: params.pageSize,
                                                                        emptyFolders: params.pageSize - projects.length
                                                                    });
                                                                }
                                                            }
//                                                        });
                                                    });
                                                });

                                                API._clear_tables_to_sync();
                                            });
                                            API._clear_tables_to_sync();
                                        });
                                    }
                                });
                                API._clear_tables_to_sync();

                            });
                        }
                    }

                },
                
                update: function(params, callback){
//                    var params = {project_id: "sdasd121212", userIds:[1,2,3,4]}
                    DB.select("pp.user_id");
                    DB.from("xiao_project_partners as pp");
                    DB.where('pp.project_id ="'+params.project_id+'"');
                    API.read(function(data){
                        var db_users = data, all_new_users = params.users, remove_array = "", add_array = [];
//                        data.forEach(function(el){
//                            users.push(el.user_id);
//                        });
                        // if in db no such user ---> add it
                        all_new_users.forEach(function(el){
                            if(db_users.indexOf(el) === -1){
                                add_array.push({
                                    project_id  :   params.project_id,
                                    user_id     :   el
                                });
                            }
                        });
                        // if in new array of users no DB user ----> remove it
                        db_users.forEach(function(el){
                            if(all_new_users.indexOf(el) === -1){
//                                remove_array.push(el);
                                if(remove_array!="")remove_array+=",";
                                remove_array+='"'+el+'"';
                            }
                        });
                        if(add_array.length > 0)API.batch_insert('xiao_project_partners', add_array);
                        if(remove_array.length > 0)API.remove('xiao_project_partners', 'project_id = "'+params.project_id+'" AND user_id IN('+remove_array+')');
                    });
                },
                
                remove: function(id, callback) {
                    // Удаление проекта
                    // У меня вопрос:
                    // - удаление проекта, которое должно быть в БЕТА, что имееться ввиду под удлением(удаление самого преокта? или удаление себя из проекта? кто может это делать?)
//                        
                    // ответ:
                    //  Только для АДМИНА. Удаление проекта
                    /*
                     if(SESSION.get("isAdmin") == 1){
                     API.remove("xiao_projects", 'id="'+id+'"', callback);
                     }
                     */
                    callback ? API.remove("xiao_projects", 'id="' + id + '"', callback) : API.remove("xiao_projects", 'id="' + id + '"');
                },
                
                archive: function(id, callback){
                    callback ? API.update("xiao_projects", {archived:1}, 'id="'+id+'"', callback) : API.update("xiao_projects", {archived:1}, 'id="'+id+'"');
                }
                
            };
            Models.ProjectChat = {
//                _inited_chats: [],
                chat_init: function(project_id, callback) {
                    console.log("chat_init");
//                    if(this._inited_chats.indexOf(project_id) > 0 )return;
//                    this._inited_chats.push(project_id);
                    // existing messages
                    var login_user = SESSION.get("user_id");
                    API._sync(["xiao_project_comments", "xiao_users", "xiao_companies", "xiao_project_comments_likes"], function() {
                        
//                        DB.select("pc.id, pc.content, pc.type, pc.server_path, pc.local_path, pc.project_id, pc.user_id, pc.time, pc.read, u.id as uid, u.name, u.pinyin, u.local_path as av_local_path, u.server_path as av_server_path, u.company_id, u.position, u.phoneNum, u.email, u.adress, u.isNewUser, u.QRCode, c.title as company, c.companyAdress, c.creator_id as company_creator_id, clu.id as cl_uid, clu.name as cl_name, clu.pinyin as cl_pinyin, clu.local_path as cl_local_path, clu.server_path as cl_server_path, clu.position as cl_position, clu.phoneNum as cl_phoneNum, clu.email as cl_email, clu.adress as cl_adress, clu.isNewUser as cl_isNewUser, clu.QRCode as cl_QRCode");
                        DB.select("pc.id, pc.content, pc.type, pc.server_path, pc.local_path, pc.project_id, pc.user_id, strftime('%d %m %Y %H:%M:%S', pc.time) as time, pc.read, u.id as uid, u.name, u.pinyin, u.local_path as av_local_path, u.server_path as av_server_path, u.company_id, u.position, u.phoneNum, u.email, u.adress, u.isNewUser, u.QRCode, c.title as company, c.companyAdress, c.creator_id as company_creator_id, clu.id as cl_uid, clu.name as cl_name, clu.pinyin as cl_pinyin, clu.local_path as cl_local_path, clu.server_path as cl_server_path, clu.position as cl_position, clu.phoneNum as cl_phoneNum, clu.email as cl_email, clu.adress as cl_adress, clu.isNewUser as cl_isNewUser, clu.QRCode as cl_QRCode");
                        DB.from("xiao_project_comments AS pc");
                        DB.left_join("xiao_users AS u", "u.id = pc.user_id");
                        DB.left_join("xiao_companies AS c", "u.company_id = c.id");
                        DB.left_join("xiao_project_comments_likes AS cl", "cl.comment_id = pc.id");
                        DB.left_join("xiao_users AS clu", "clu.id = cl.user_id");
//                        DB.left_join("xiao_users AS u", "u.id = pc.user_id");
//                        DB.left_join("xiao_companies AS c", "u.company_id = c.id");
//                        DB.left_join("xiao_project_comments_likes AS cl", "cl.comment_id = pc.id");
//                        DB.left_join("xiao_users AS clu", "clu.id = cl.user_id");
                        DB.where('pc.project_id ="' + project_id + '"');
                        DB.order_by(' pc.time, pc.id');
    //                    API.read(function(messages) {
                        DB.query(function(messages) {
                            console.log("__________messages")
                            var mess_result = [], unread = 0, indexes = [];
                            if (messages.length > 0) {
                                messages.forEach(function(mess) {
                                    console.log(mess)
                                    if(indexes.lastIndexOf(mess.id) === -1){
                                        indexes.push(mess.id);
                                        unread += (mess.read == 0 ? 1 : 0);
                                        mess_result.push({
                                            id: mess.id,
                                            text: mess.content,
                                            poster: {
                                                id: mess.cl_id,
                                                name: mess.name,
                                                pinyin: mess.pinyin,
                                                avatar: (mess.av_local_path != "" && mess.av_local_path != null && mess.av_local_path != "null" && mess.av_local_path != CONFIG.default_user_avatar) ? mess.av_local_path : mess.av_server_path,
                                                company: mess.company,
                                                companyAdress: mess.companyAdress,
                                                position: mess.position,
                                                phoneNum: mess.phoneNum,
                                                email: mess.email,
                                                adress: mess.adress,
                                                isNewUser: mess.isNewUser,
                                                isLoginUser: login_user == mess.uid,
                                                QRCode: mess.QRCode
                                            },
                                            attachment: {
                                                id: mess.id,
                                                type: mess.type,
                                                src: (mess.local_path != "" && mess.local_path != null) ? mess.local_path : mess.server_path,
//                                                src: mess.server_path,
                                                from: "project"
                                            },
                                            praise: [],
                                            time: new Date(websql_date_to_number(mess.time)).getTime(),
                                            type: mess.type
                                        });
                                        
                                        if(mess.cl_uid != null && typeof(mess.cl_uid) !== "undefined")
                                            mess_result[mess_result.length-1].praise.push({
                                                id: mess.cl_uid,
                                                name: mess.cl_name,
                                                pinyin: mess.cl_pinyin,
//                                                avatar: mess.cl_avatar,
                                                avatar: (mess.cl_local_path != "" && mess.cl_local_path != CONFIG.default_user_avatar) ? mess.cl_local_path : mess.cl_server_path,
                                                company: mess.cl_company,
                                                companyAdress: mess.cl_companyAdress,
                                                position: mess.cl_position,
                                                phoneNum: mess.cl_phoneNum,
                                                email: mess.cl_email,
                                                adress: mess.cl_adress,
                                                isNewUser: mess.cl_isNewUser,
                                                isLoginUser: login_user == mess.cl_uid,
                                                QRCode: mess.cl_QRCode
                                            });
                                    }else{
                                        mess_result[mess_result.length-1].praise.push({
                                            id: mess.cl_uid,
                                            name: mess.cl_name,
                                            pinyin: mess.cl_pinyin,
                                            avatar: (mess.cl_local_path != "" && mess.cl_local_path != CONFIG.default_user_avatar) ? mess.cl_local_path : mess.cl_server_path,
                                            company: mess.cl_company,
                                            companyAdress: mess.cl_companyAdress,
                                            position: mess.cl_position,
                                            phoneNum: mess.cl_phoneNum,
                                            email: mess.cl_email,
                                            adress: mess.cl_adress,
                                            isNewUser: mess.cl_isNewUser,
                                            isLoginUser: login_user == mess.cl_uid,
                                            QRCode: mess.cl_QRCode
                                        });
                                    }
                                });
                            }
                            console.log(mess_result);
                            callback(mess_result);
    //                            make_callback({messages: mess_result, unread: unread});
    //SELECT pc.id, pc.content, pc.type, pc.server_path, pc.project_id, pc.user_id, u.id as uid, u.name, u.pinyin, u.company_id, u.position, u.phoneNum, u.email, u.adress, u.isNewUser, u.QRCode, c.title as company, c.companyAdress, c.creator_id as company_creator_id,    clu.id as cl_id, clu.name as cl_name, clu.pinyin as cl_pinyin, clu.position as cl_position, clu.phoneNum as cl_phoneNum, clu.email as cl_email, clu.adress as cl_adress, clu.isNewUser as cl_isNewUser, clu.QRCode as cl_QRCode  FROM xiao_project_comments AS pc LEFT JOIN xiao_users AS u ON u.id = pc.user_id LEFT JOIN xiao_companies AS c ON u.company_id = c.id LEFT JOIN xiao_project_comments_likes AS cl ON cl.comment_id = pc.id LEFT JOIN xiao_users AS clu ON clu.id = cl.user_id WHERE pc.project_id ="20131028100530255489Rd_xiao_projects" ORDER BY pc.id
                        });


                        // new cooming messages
    //                        if (this._inited_chats.lastIndexOf(project_id) === -1)
                        SOCKET.updatechat({type: "project", id: project_id}, function(socket_messages) { // new messages ARRAY
                            console.log("UPDATE CHAT EVENT");
                            console.log(socket_messages)
                            var in_m = "";
                            socket_messages.forEach(function(m, i) {
                                in_m += (i != 0 ? "," : "");
                                in_m += '"' + m.id + '"';
                            });
//                            DB.select("pc.id, pc.content, pc.type, pc.server_path, pc.local_path, pc.project_id, pc.user_id, pc.time, u.id as uid, u.name, u.pinyin, u.local_path, u.server_path, u.company_id, u.position, u.phoneNum, u.email, u.adress, u.isNewUser, u.QRCode, c.title as company, c.companyAdress, c.creator_id as company_creator_id, clu.id as cl_uid, clu.name as cl_name, clu.pinyin as cl_pinyin, clu.local_path as cl_local_path, clu.server_path as cl_server_path, clu.position as cl_position, clu.phoneNum as cl_phoneNum, clu.email as cl_email, clu.adress as cl_adress, clu.isNewUser as cl_isNewUser, clu.QRCode as cl_QRCode");
                            DB.select("pc.id, pc.content, pc.type, pc.server_path, pc.local_path, pc.project_id, pc.user_id, strftime('%d %m %Y %H:%M:%S', pc.time) as time, u.id as uid, u.name, u.pinyin, u.local_path, u.server_path, u.company_id, u.position, u.phoneNum, u.email, u.adress, u.isNewUser, u.QRCode, c.title as company, c.companyAdress, c.creator_id as company_creator_id, clu.id as cl_uid, clu.name as cl_name, clu.pinyin as cl_pinyin, clu.local_path as cl_local_path, clu.server_path as cl_server_path, clu.position as cl_position, clu.phoneNum as cl_phoneNum, clu.email as cl_email, clu.adress as cl_adress, clu.isNewUser as cl_isNewUser, clu.QRCode as cl_QRCode");
                            DB.from("xiao_project_comments AS pc");
                            DB.join("xiao_users AS u", "u.id = pc.user_id");
                            DB.join("xiao_companies AS c", "u.company_id = c.id");
                            DB.left_join("xiao_project_comments_likes AS cl", "cl.comment_id = pc.id");
                            DB.left_join("xiao_users AS clu", "clu.id = cl.user_id");
                            DB.where('pc.id IN (' + in_m + ')');
    //                        DB.order_by('pc.update_time');
//                            DB.order_by('pc.id, pc.time');
                            DB.order_by('pc.time, pc.id');
                            API._clear_tables_to_sync();
                            DB.query(function(messages) {
                                var mess_result = [], indexes = [];
                                messages.forEach(function(mess) {
                                    if(indexes.lastIndexOf(mess.id) === -1){
                                        indexes.push(mess.id);
    //                                    var leader = mess.company_creator_id == mess.uid ? true : false,
    //                                            new_user = mess.isNewUser == 0 ? true : false;
                                        mess_result.push({
                                            id: mess.id,
                                            text: mess.content,
                                            poster: {
                                                id: mess.uid,
                                                name: mess.name,
                                                pinyin: mess.pinyin,
                                                avatar: (mess.local_path != "" && mess.local_path != CONFIG.default_user_avatar) ? mess.local_path : mess.server_path,
                                                company: mess.company,
                                                companyAdress: mess.companyAdress,
                                                position: mess.position,
                                                phoneNum: mess.phoneNum,
                                                email: mess.email,
                                                adress: mess.adress,
                                                isNewUser: mess.isNewUser,
                                                isLoginUser: login_user == mess.uid,
        //                                            isLeader: leader,
                                                QRCode: mess.QRCode
                                            },
                                            attachment: {
                                                id: mess.id,
                                                type: mess.type,
                                                src: (mess.local_path != "" && mess.local_path != null) ? mess.local_path : mess.server_path,
//                                                src: mess.server_path,
                                                from: "project"
                                            },
                                            praise: [],
                                            time: new Date(websql_date_to_number(mess.time)).getTime(),
                                            type: mess.type
                                        });
                                        if(mess.cl_uid != null && typeof(mess.cl_uid) !== "undefined")
                                            mess_result[mess_result.length-1].praise.push({
                                                id: mess.cl_uid,
                                                name: mess.cl_name,
                                                pinyin: mess.cl_pinyin,
//                                                avatar: mess.cl_avatar,
                                                avatar: (mess.cl_local_path != "" && mess.cl_local_path != CONFIG.default_user_avatar) ? mess.cl_local_path : mess.cl_server_path,
                                                company: mess.cl_company,
                                                companyAdress: mess.cl_companyAdress,
                                                position: mess.cl_position,
                                                phoneNum: mess.cl_phoneNum,
                                                email: mess.cl_email,
                                                adress: mess.cl_adress,
                                                isNewUser: mess.cl_isNewUser,
                                                isLoginUser: login_user == mess.cl_uid,
                                                QRCode: mess.cl_QRCode
                                            });
                                    }else{
                                        mess_result[mess_result.length-1].praise.push({
                                            id: mess.cl_uid,
                                            name: mess.cl_name,
                                            pinyin: mess.cl_pinyin,
//                                            avatar: mess.cl_avatar,
                                            avatar: (mess.cl_local_path != "" && mess.cl_local_path != CONFIG.default_user_avatar) ? mess.cl_local_path : mess.cl_server_path,
                                            company: mess.cl_company,
                                            companyAdress: mess.cl_companyAdress,
                                            position: mess.cl_position,
                                            phoneNum: mess.cl_phoneNum,
                                            email: mess.cl_email,
                                            adress: mess.cl_adress,
                                            isNewUser: mess.cl_isNewUser,
                                            isLoginUser: login_user == mess.cl_uid,
                                            QRCode: mess.cl_QRCode
                                        });
                                    }
                                });
                                callback(mess_result);
                            });

                        });
                    });
                },
                send_message: function(message, callback) {
//                    alert("sending mesage...");
                    console.log("sending mesage...");
                    message['user_id'] = SESSION.get("user_id"); // push user_id to message data
                    message['read'] = '1';
                    API.insert("xiao_project_comments", message, function(insert_id) {
                        message['id'] = insert_id;
                        console.log('API.insert("xiao_project_comments"');
                        console.log(message);
                        callback(message);
                    });
//                    else{
//                        console.log("Image!!")
//                        console.log(message);
//                        console.log(message.local_path);
//                        PHONE.Files.base64image_to_file(message.local_path, message.fake_path, function(decoded_file_path){
//                            console.log("base64image_to_file callback");
//                            message.local_path = decoded_file_path;
//                            delete message.fake_path;
//                            API.insert("xiao_project_comments", message, function(insert_id) {
//                                message['id'] = insert_id;
//                                console.log('API.insert("xiao_project_comments"');
//                                console.log(message);
//                                callback(message);
//                            });
//                        });
//                    }
//                        alert(SESSION.get("user_id"));
                },
                        
                like: function(comment_id, callback){ // comment_id is the id of liked message
                    if(!comment_id || typeof(comment_id) === "function")return callback(false);
                    API.insert("xiao_project_comments_likes", {comment_id: comment_id, user_id: SESSION.get("user_id")}, callback);
                }
                
            };
            Models.Todo = {
                create: function(todo, attachments, callback) {
//                        var todo = {
//                            color : 1, // number : from 0 to 5(0 : orange, 1 : tan, 2 : cyan, 3 : blue, 4 : henna, 5 : purple)
//                            title : "sss",
//                            descr : "aaa",
//                            endTime : new Date().getTime(),
//                            user_id : 4, // performer
//                            project_id : "201310011115357d1e32i5_xiao_projects"
//                        };

                    todo.creator_id = SESSION.get("user_id");

                    DB.insert("xiao_todos", todo, function(insert_id) {
                        todo.id = insert_id;
                        if (callback)
                            callback(todo);
                        if(attachments.length > 0){
                            var atch_ar = [];
                            attachments.forEach(function(atch){
                                atch_ar.push({
                                    type: atch.type,
                                    local_path: atch.src,
                                    todo_id: insert_id
                                });
                            });
                            DB.insert("xiao_todo_attachments", atch_ar, function(){
                                API.sync(['xiao_todos','xiao_todo_attachments']);
                            });
                        }else{
                            API.sync(['xiao_todos']);
                        }
                    });
                },
                read: function(params, callback) {
                    console.log(params);
                    if ("project_id" in params) {
                        // get Todo LIST
//                            DB.select();
//                            DB.from("xiao_todos as t");
//                            DB.where('t.project_id = "'+params.id+'"');
//                            DB.where('t.user_id = "'+SESSION.get("user_id")+'"');
//                            API.read(callback);
                        var result = {};
                        API._sync(["xiao_todos"], function() {
                            DB.select('t.id, t.title, t.descr as desc, t.endTime, t.user_id');
                            DB.from("xiao_todos as t");
                            DB.where('t.project_id = "' + params.project_id + '"');
                            DB.where('(t.user_id = "' + SESSION.get("user_id") + '" OR t.creator_id = "' + SESSION.get("user_id") + '")');
                            DB.where('t.finished <> "1"');
                            DB.order_by("t.endTime");
                            DB.query(function(todos) {
                                make_callback({uncompleted: todos});
                            });
                            DB.select('t.id, t.title, t.descr as desc, t.endTime, t.user_id');
                            DB.from("xiao_todos as t");
                            DB.where('t.project_id = "' + params.project_id + '"');
                            DB.where('(t.user_id = "' + SESSION.get("user_id") + '" OR t.creator_id = "' + SESSION.get("user_id") + '")');
                            DB.where('t.finished = "1"');
                            DB.order_by("t.endTime");
                            DB.query(function(todos) {
                                make_callback({completed: todos});
                            });
                            API._clear_tables_to_sync();

                            function make_callback(data) {
                                if (data.completed) {
                                    result.completed = data.completed;
                                }
                                if (data.uncompleted) {
                                    result.uncompleted = data.uncompleted;
                                }
                                if (result.completed && result.uncompleted) {
                                    callback(result);
                                }
                            }
                        });
                    } else if ("id" in params) {
                        //get ONE todo
                        var login_user = SESSION.get("user_id");
                        API._sync(["xiao_todos", "xiao_users"], function(){
                            DB.select('t.id, t.title, t.descr, t.endTime, t.user_id, p.color');
                            DB.from("xiao_todos as t");
                            DB.join("xiao_projects as p", 'p.id = t.project_id');
                            DB.where('t.id = "' + params.id + '"');
                            DB.row(function(data){
                                if(typeof(data) !== "undefined"){
                                    console.log("data")
                                    console.log(data)
                                    DB.select("u.id as uid, u.name, u.pinyin, u.local_path, u.server_path, u.company_id, u.position, u.phoneNum, u.email, u.adress, u.isNewUser, u.QRCode, c.title as company, c.companyAdress");
                                    DB.from("xiao_users as u");
                                    DB.join("xiao_companies AS c", "u.company_id = c.id");
                                    DB.where('u.id="'+data.user_id+'"');
                                    DB.row(function(user_data){
                                        
                                        DB.select("at.id, at.type, at.server_path, at.local_path");
                                        DB.from("xiao_todos as t");
                                        DB.join("xiao_todo_attachments as at", "t.id = at.todo_id");
                                        DB.where('t.id = "' + params.id + '"');
                                        DB.query(function(atch){
                                            var atch_ar = [];
                                            atch.forEach(function(cur_atch){
                                                atch_ar.push({
                                                    id: cur_atch.id,
                                                    src: (cur_atch.local_path != "" && cur_atch.local_path != null) ? cur_atch.local_path : cur_atch.server_path,
                                                    type: cur_atch.type
                                                });
                                            });
                                            callback({
                                                id    : data.id,
                                                title : data.title,
                                                desc  : data.descr,
                                                color : data.color,
                                                user : {
                                                    id: user_data.uid,
                                                    name: user_data.name,
                                                    pinyin: user_data.pinyin,
    //                                                avatar: user_data.avatar,
                                                    avatar: (user_data.local_path != "" && user_data.local_path != CONFIG.default_user_avatar) ? user_data.local_path : user_data.server_path,
                                                    company: user_data.company,
                                                    companyAdress: user_data.companyAdress,
                                                    position: user_data.position,
                                                    phoneNum: user_data.phoneNum,
                                                    email: user_data.email,
                                                    adress: user_data.adress,
                                                    isNewUser: user_data.isNewUser,
                                                    isLoginUser: login_user == user_data.uid,
            //                                            isLeader: leader,
                                                    QRCode: user_data.QRCode
                                                },
                                                attachments : atch_ar,
                                                endTime : data.endTime
                                            });
                                            API._clear_tables_to_sync();
                                            API.update("xiao_todo_comments",{read:"1"}, 'todo_id = "'+ params.id +'" ');
                                        });
                                    });
                                }else{
                                    callback(false);
                                }
                            });
                        });
//                        DB.select();
//                        DB.from("xiao_todos AS t");
////                            DB.where('t.user_id = "'+SESSION.get("user_id")+'"');
//                        DB.where('t.id = "' + params.id + '"');
////                            API.row(callback);
//                        API.row(function(data) {
//                            console.log(data);
//                            data.attachments = [];
//                            data.messages = [];
//                            callback(data);
//                        });
                    }
                },
                update: function(id, data, callback) {

                },
                done: function(id, callback) {

                }

            };
            Models.TodoChat = {
                chat_init: function(project_id, callback) {
//                    alert("todochat init")
                    API._sync(['xiao_todo_comments','xiao_users','xiao_companies','xiao_project_comments_likes'],function(){
                        
                        // existing messages
//                        DB.select("tc.id, tc.content, tc.type, tc.server_path, tc.local_path, tc.todo_id, tc.user_id, tc.time, tc.read, u.id as uid, u.name, u.pinyin, u.local_path, u.server_path, u.company_id, u.position, u.phoneNum, u.email, u.adress, u.isNewUser, u.QRCode, c.title as company, c.companyAdress, c.creator_id as company_creator_id, clu.id as cl_uid, clu.name as cl_name, clu.pinyin as cl_pinyin, clu.local_path as cl_local_path, clu.server_path as cl_server_path, clu.position as cl_position, clu.phoneNum as cl_phoneNum, clu.email as cl_email, clu.adress as cl_adress, clu.isNewUser as cl_isNewUser, clu.QRCode as cl_QRCode");
                        DB.select("tc.id, tc.content, tc.type, tc.server_path, tc.local_path, tc.todo_id, tc.user_id, strftime('%d %m %Y %H:%M:%S', tc.time) as time, tc.read, u.id as uid, u.name, u.pinyin, u.local_path, u.server_path, u.company_id, u.position, u.phoneNum, u.email, u.adress, u.isNewUser, u.QRCode, c.title as company, c.companyAdress, c.creator_id as company_creator_id, clu.id as cl_uid, clu.name as cl_name, clu.pinyin as cl_pinyin, clu.local_path as cl_local_path, clu.server_path as cl_server_path, clu.position as cl_position, clu.phoneNum as cl_phoneNum, clu.email as cl_email, clu.adress as cl_adress, clu.isNewUser as cl_isNewUser, clu.QRCode as cl_QRCode");
                        DB.from("xiao_todo_comments AS tc");
                        DB.left_join("xiao_users AS u", "u.id = tc.user_id");
                        DB.left_join("xiao_companies AS c", "u.company_id = c.id");
                        DB.left_join("xiao_todo_comments_likes AS cl", "cl.comment_id = tc.id");
                        DB.left_join("xiao_users AS clu", "clu.id = cl.user_id");
                        DB.where('tc.todo_id ="' + project_id + '"');
    //                    DB.order_by('tc.update_time');
                        DB.order_by('tc.time, tc.id');
//                        DB.order_by('tc.id, tc.time');
                        var login_user = SESSION.get("user_id");
                        DB.query(function(messages) {
    //                    API.read(function(messages) {
                            var mess_result = [], unread = 0, indexes = [];
                            if (messages.length > 0) {
                                messages.forEach(function(mess) {
                                    if(indexes.lastIndexOf(mess.id) === -1){
                                        indexes.push(mess.id);
    //                                console.log(mess.uid)
    //                                    var leader = mess.isLeader == "1" ? true : false,
    //                                            new_user = mess.isNewUser == "0" ? true : false;
                                        unread += (mess.read == 0 ? 1 : 0);
                                        mess_result.push({
                                            id: mess.id,
                                            text: mess.content,
                                            poster: {
                                                id: mess.uid,
                                                name: mess.name,
                                                pinyin: mess.pinyin,
//                                                avatar: mess.avatar,
                                                avatar: (mess.local_path != "" && mess.local_path != CONFIG.default_user_avatar) ? mess.local_path : mess.server_path,
                                                company: mess.company,
                                                companyAdress: mess.companyAdress,
                                                position: mess.position,
                                                phoneNum: mess.phoneNum,
                                                email: mess.email,
                                                adress: mess.adress,
                                                isNewUser: mess.isNewUser,
                                                isLoginUser: login_user == mess.uid,
        //                                            isLeader: mess.isLeader,
                                                QRCode: mess.QRCode
                                            },
                                            attachment: {
                                                id: mess.id,
                                                type: mess.type,
                                                src: (mess.local_path != "" && mess.local_path != null) ? mess.local_path : mess.server_path,
//                                                src: mess.server_path,
                                                from: "todo"
                                            },
                                            praise: [],
                                            time: new Date(websql_date_to_number(mess.time)).getTime(),
                                            type: mess.type
                                        });
                                        if(mess.cl_uid != null && typeof(mess.cl_uid) !== "undefined")
                                            mess_result[mess_result.length-1].praise.push({
                                                id: mess.cl_uid,
                                                name: mess.cl_name,
                                                pinyin: mess.cl_pinyin,
//                                                avatar: mess.cl_avatar,
                                                avatar: (mess.cl_local_path != "" && mess.cl_local_path != CONFIG.default_user_avatar) ? mess.cl_local_path : mess.cl_server_path,
                                                company: mess.cl_company,
                                                companyAdress: mess.cl_companyAdress,
                                                position: mess.cl_position,
                                                phoneNum: mess.cl_phoneNum,
                                                email: mess.cl_email,
                                                adress: mess.cl_adress,
                                                isNewUser: mess.cl_isNewUser,
                                                isLoginUser: login_user == mess.cl_uid,
                                                QRCode: mess.cl_QRCode
                                            });
                                    }else{
                                        mess_result[mess_result.length-1].praise.push({
                                            id: mess.cl_uid,
                                            name: mess.cl_name,
                                            pinyin: mess.cl_pinyin,
//                                            avatar: mess.cl_avatar,
                                            avatar: (mess.cl_local_path != "" && mess.cl_local_path != CONFIG.default_user_avatar) ? mess.cl_local_path : mess.cl_server_path,
                                            company: mess.cl_company,
                                            companyAdress: mess.cl_companyAdress,
                                            position: mess.cl_position,
                                            phoneNum: mess.cl_phoneNum,
                                            email: mess.cl_email,
                                            adress: mess.cl_adress,
                                            isNewUser: mess.cl_isNewUser,
                                            isLoginUser: login_user == mess.cl_uid,
                                            QRCode: mess.cl_QRCode
                                        });
                                    }
                                });
                            }
                            callback(mess_result);
    //                            make_callback({messages: mess_result, unread: unread});
                        });


                        // new cooming messages
                        SOCKET.updatechat({type: "todo", id: project_id}, function(socket_messages) { // new messages ARRAY
                            console.log("UPDATE TODO CHAT EVENT");
                            var in_m = "";
                            socket_messages.forEach(function(m, i) {
                                in_m += (i != 0 ? "," : "");
                                in_m += '"' + m.id + '"';
                            });
//                            DB.select("tc.id, tc.content, tc.type, tc.server_path, tc.local_path, tc.todo_id, tc.user_id, tc.time, u.id as uid, u.name, u.pinyin, u.local_path, u.server_path, u.company_id, u.position, u.phoneNum, u.email, u.adress, u.isNewUser, u.QRCode, c.title as company, c.companyAdress, c.creator_id as company_creator_id, clu.id as cl_uid, clu.name as cl_name, clu.pinyin as cl_pinyin, clu.local_path as cl_local_path, clu.server_path as cl_server_path, clu.position as cl_position, clu.phoneNum as cl_phoneNum, clu.email as cl_email, clu.adress as cl_adress, clu.isNewUser as cl_isNewUser, clu.QRCode as cl_QRCode");
                            DB.select("tc.id, tc.content, tc.type, tc.server_path, tc.local_path, tc.todo_id, tc.user_id, strftime('%d %m %Y %H:%M:%S', tc.time) as time, u.id as uid, u.name, u.pinyin, u.local_path, u.server_path, u.company_id, u.position, u.phoneNum, u.email, u.adress, u.isNewUser, u.QRCode, c.title as company, c.companyAdress, c.creator_id as company_creator_id, clu.id as cl_uid, clu.name as cl_name, clu.pinyin as cl_pinyin, clu.local_path as cl_local_path, clu.server_path as cl_server_path, clu.position as cl_position, clu.phoneNum as cl_phoneNum, clu.email as cl_email, clu.adress as cl_adress, clu.isNewUser as cl_isNewUser, clu.QRCode as cl_QRCode");
                            DB.from("xiao_todo_comments AS tc");
                            DB.join("xiao_users AS u", "u.id = tc.user_id");
                            DB.join("xiao_companies AS c", "u.company_id = c.id");
                            DB.left_join("xiao_todo_comments_likes AS cl", "cl.comment_id = tc.id");
                            DB.left_join("xiao_users AS clu", "clu.id = cl.user_id");
                            DB.where('tc.id IN (' + in_m + ')');
    //                        DB.order_by('tc.update_time');
//                            DB.order_by('tc.time');
                            DB.order_by('tc.time, tc.id');
                            API._clear_tables_to_sync();
                            DB.query(function(messages) {
                                var mess_result = [], indexes = [];
                                messages.forEach(function(mess) {
                                    if(indexes.lastIndexOf(mess.id) === -1){
                                        indexes.push(mess.id);
    //                                    var leader = mess.company_creator_id == mess.uid ? true : false,
    //                                            new_user = mess.isNewUser == 0 ? true : false;
                                    mess_result.push({
                                        id: mess.id,
                                        text: mess.content,
                                        poster: {
                                            id: mess.uid,
                                            name: mess.name,
                                            pinyin: mess.pinyin,
//                                            avatar: mess.avatar,
                                            avatar: (mess.local_path != "" && mess.local_path != CONFIG.default_user_avatar) ? mess.local_path : mess.server_path,
                                            company: mess.company,
                                            companyAdress: mess.companyAdress,
                                            position: mess.position,
                                            phoneNum: mess.phoneNum,
                                            email: mess.email,
                                            adress: mess.adress,
                                            isNewUser: mess.isNewUser,
                                            isLoginUser: login_user == mess.uid,
    //                                            isLeader: leader,

                                            QRCode: mess.QRCode
                                        },
                                        attachment: {
                                            id: mess.id,
                                            type: mess.type,
                                            src: (mess.local_path != "" && mess.local_path != null) ? mess.local_path : mess.server_path,
//                                            src: mess.server_path,
                                            from: "todo"
                                        },
                                        praise: [],
                                        time: new Date(websql_date_to_number(mess.time)).getTime(),
                                        type: mess.type
                                    });
                                    if(mess.cl_uid != null && typeof(mess.cl_uid) !== "undefined")
                                        mess_result[mess_result.length-1].praise.push({
                                            id: mess.cl_uid,
                                            name: mess.cl_name,
                                            pinyin: mess.cl_pinyin,
//                                            avatar: mess.cl_avatar,
                                            avatar: (mess.cl_local_path != "" && mess.cl_local_path != CONFIG.default_user_avatar) ? mess.cl_local_path : mess.cl_server_path,
                                            company: mess.cl_company,
                                            companyAdress: mess.cl_companyAdress,
                                            position: mess.cl_position,
                                            phoneNum: mess.cl_phoneNum,
                                            email: mess.cl_email,
                                            adress: mess.cl_adress,
                                            isNewUser: mess.cl_isNewUser,
                                            isLoginUser: login_user == mess.cl_uid,
                                            QRCode: mess.cl_QRCode
                                        });
                                    }else{
                                        mess_result[mess_result.length-1].praise.push({
                                            id: mess.cl_uid,
                                            name: mess.cl_name,
                                            pinyin: mess.cl_pinyin,
//                                            avatar: mess.cl_avatar,
                                            avatar: (mess.cl_local_path != "" && mess.cl_local_path != CONFIG.default_user_avatar) ? mess.cl_local_path : mess.cl_server_path,
                                            company: mess.cl_company,
                                            companyAdress: mess.cl_companyAdress,
                                            position: mess.cl_position,
                                            phoneNum: mess.cl_phoneNum,
                                            email: mess.cl_email,
                                            adress: mess.cl_adress,
                                            isNewUser: mess.cl_isNewUser,
                                            isLoginUser: login_user == mess.cl_uid,
                                            QRCode: mess.cl_QRCode
                                        });
                                    }
                                });
                                callback(mess_result);
                            });

                        });
                    });

                },
                send_message: function(message, callback) {
//                    console.log("sending mesage...");
                    message['user_id'] = SESSION.get("user_id"); // push user_id to message data
                    API.insert("xiao_todo_comments", message, function(insert_id) {
                        message['id'] = insert_id;
//                        console.log('API.insert("xiao_todo_comments"');
//                        console.log(message);
                        callback(message);
                    });
//                        alert(SESSION.get("user_id"));
                },
                like: function(comment_id, callback){ // comment_id is the id of liked message
                    if(!comment_id || typeof(comment_id) === "function")return callback(false);
                    API.insert("xiao_todo_comments_likes", {comment_id: comment_id, user_id: SESSION.get("user_id")}, callback);
                }
            };
            
            Models.Calendar = {
                read: function(day, callback) {
                    var logged_user = SESSION.get("user_id");
                    DB.select();
                    DB.from('xiao_todos as t');
                    DB.where('t.endTime = "' + day + '"');
                    DB.where('(t.user_id = "' + logged_user + '" OR t.creator_id = "' + logged_user + '" )');
//                        API.read(callback);
                    API.read(function(data) {
                        callback({time: day, todos: data});
                    });
                }

            };
            
            Models.Archive = {
                    read : function(params, callback){
                        var logged_user = SESSION.get("user_id");
                        if (params !== null && params.id !== null) {
                            API._sync(["xiao_projects", "xiao_project_partners", "xiao_users", "xiao_project_comments", "xiao_companies", "xiao_todo_comments"], function() {
                                var result = {project:{},todoList:[]}, counter = 3;
                                
                                DB.select("p.id, p.level, p.title, p.color, p.creator_id, p.creationTime, p.completeDate, p.descr, u.id as uid, u.name, u.pinyin, u.local_path as avatar, u.company_id, u.position, u.phoneNum, u.email, u.adress, u.isNewUser, u.QRCode, c.title as company, c.companyAdress, c.creator_id as company_creator_id, pp.isLeader");
                                DB.from("xiao_projects AS p");
                                DB.join("xiao_project_partners AS pp", "pp.project_id = p.id");
                                DB.join("xiao_users AS u", "u.id = pp.user_id");
                                DB.join("xiao_companies AS c", "u.company_id = c.id");
                                DB.where('p.id ="' + params.id + '"');
                                DB.query(function(partners) {
                                    if (partners.length > 0) {
                                        result.project = {
                                            id : partners[0].id,
                                            level : partners[0].level,
                                            title : partners[0].title,
                                            color : partners[0].color,
                                            creationTime : partners[0].creationTime,
                                            completeDate : partners[0].completeDate,
                                            unread : 0,
                                            desc : partners[0].descr,
                                            users : [],
                                            attachments : []
                                        };
                                        partners.forEach(function(pp) {
                                            result.project.users.push({
                                                id: pp.uid,
                                                name: pp.name,
                                                pinyin: pp.pinyin,
                                                avatar: pp.avatar,
                                                company: pp.company,
                                                companyAdress: pp.companyAdress,
                                                position: pp.position,
                                                phoneNum: pp.phoneNum,
                                                email: pp.email,
                                                adress: pp.adress,
                                                isNewUser: pp.isNewUser,
                                                QRCode: pp.QRCode
                                            });
                                        });
                                    }
                                    make_callback();
                                });
                                
                                DB.select("p.id, p.level, p.title, p.color, p.creator_id, p.creationTime, p.completeDate, p.descr, u.id as uid, u.name, u.pinyin, u.local_path as avatar, u.company_id, u.position, u.phoneNum, u.email, u.adress, u.isNewUser, u.QRCode, c.title as company, c.companyAdress, c.creator_id as company_creator_id");
                                DB.from("xiao_projects AS p");
                                DB.join("xiao_users AS u", "u.id = p.creator_id");
                                DB.join("xiao_companies AS c", "u.company_id = c.id");
                                DB.where('p.id ="' + params.id + '"');
                                DB.row(function(creator) {
                                    if (creator) {
                                        result.project.creator = {
                                            id: creator.uid,
                                            name: creator.name,
                                            pinyin: creator.pinyin,
                                            avatar: creator.avatar,
                                            company: creator.company,
                                            companyAdress: creator.companyAdress,
                                            position: creator.position,
                                            phoneNum: creator.phoneNum,
                                            email: creator.email,
                                            adress: creator.adress,
                                            isNewUser: creator.isNewUser,
    //                                            isLeader: leader,
                                            QRCode: creator.QRCode
                                        };
                                    }
                                    make_callback();
                                });
                                
                                DB.select('t.id, t.title, t.descr as desc, t.endTime, t.user_id');
                                DB.from("xiao_todos as t");
                                DB.where('t.project_id = "' + params.id + '"');
//                                DB.where('(t.user_id = "' + SESSION.get("user_id") + '" OR t.creator_id = "' + SESSION.get("user_id") + '")');
                                DB.order_by("t.endTime");
                                DB.query(function(todos) {
                                    result.todoList = todos;
                                    make_callback();
                                });
                                
                                function make_callback(){
                                    --counter;
                                    if(counter<=0){
                                        console.log(result)
                                        callback(result);
                                        
                                    }
                                }
                                
                           });
                        } else {
                            
                           var result = [];
                           API._sync(["xiao_projects", "xiao_project_partners", "xiao_users", "xiao_project_comments", "xiao_companies", "xiao_todo_comments"], function() {
                                // get all projects with ME
                                DB.select("p.id, p.level, p.title, p.color, p.creator_id, p.creationTime, p.completeDate, p.descr, u.id as uid, u.name, u.pinyin, u.local_path as avatar, u.company_id, u.position, u.phoneNum, u.email, u.adress, u.isNewUser, u.QRCode, c.title as company, c.companyAdress, c.creator_id as company_creator_id, 1 as status");
                                DB.from("xiao_project_partners AS pp");
                                DB.join("xiao_projects AS p", "pp.project_id = p.id");
                                DB.join("xiao_users AS u", "u.id = p.creator_id");
                                DB.join("xiao_companies AS c", "u.company_id = c.id");
                                DB.where('pp.user_id = "' + logged_user + '"');
                                DB.where('p.archived = "1"');
                                DB.group_by('p.id');
                                DB.query(function(projects) {
                                    projects.length > 0 ? projects.forEach(function(pr) {

                                        DB.select("u.id as uid, u.name, u.pinyin, u.local_path as avatar, u.company_id, u.position, u.phoneNum, u.email, u.adress, u.isNewUser, u.QRCode, c.title as company, c.companyAdress, c.creator_id as company_creator_id, pp.isLeader");
                                        DB.from("xiao_projects AS p");
                                        DB.join("xiao_project_partners AS pp", "pp.project_id = p.id");
                                        DB.join("xiao_users AS u", "u.id = p.creator_id");
                                        DB.join("xiao_companies AS c", "u.company_id = c.id");
                                        DB.where('p.id ="' + pr.id + '"');
                                        DB.query(function(partners) {

                                            result.push({
                                                id: pr.id,
                                                title: pr.title,
                                                desc: pr.descr,
//                                                descr: pr.descr,
                                                status: pr.status,
                                                level: pr.level,
                                                color: pr.color,
                                                creationTime: pr.creationTime,
                                                unread: 0,
                                                lastMessage: "",
                                                creator: {
                                                    id: pr.uid,
                                                    name: pr.name,
                                                    pinyin: pr.pinyin,
                                                    avatar: pr.avatar,
                                                    company: pr.company,
                                                    companyAdress: pr.companyAdress,
                                                    position: pr.position,
                                                    phoneNum: pr.phoneNum,
                                                    email: pr.email,
                                                    adress: pr.adress,
                                                    isNewUser: pr.isNewUser,
                                                    isLeader: "1",
                                                    QRCode: pr.QRCode
                                                },
                                                users: partners
                                            });
                                            if (result.length == projects.length){
                                                callback(result);
                                            }

                                            API._clear_tables_to_sync();
                                        });
                                        API._clear_tables_to_sync();
                                    }) : callback([]);
                                });
                                API._clear_tables_to_sync();

                            });
                           
                            
                            
                           
                        }
                    }
                };
                
                Models.Search = {
                    global: function(str, callback){
                        var sync_tables = ['xiao_projects'], counter = sync_tables.length, result = {};
                        API._sync(sync_tables, function(){
                            
                            //search projects
                            DB.select();
                            DB.from('xiao_projects as p');
                            DB.where("p.title LIKE '%"+str+"%' OR p.descr LIKE '%"+str+"%'");
                            DB.query(function(projects){
                                result.projects = projects;
                                make_callback();
                            });
                            
                            //search projects comments
                            DB.select();
                            DB.from('xiao_projects_comments as pc');
                            DB.where("pc.content LIKE '%"+str+"%'");
                            DB.query(function(project_comments){
                                result.project_comments = project_comments;
                                make_callback();
                            });
                            
                            // search todo
                            DB.select();
                            DB.from('xiao_todos as t');
                            DB.where("t.title LIKE '%"+str+"%' OR t.descr LIKE '%"+str+"%'");
                            DB.query(function(todos){
                                result.todos = todos;
                                make_callback();
                            });
                            
                        });
                        
                        function make_callback(){
                            --counter;
                            if(counter <= 0)callback(result);
                        }
                    },
                    project: function(str, callback){
                        
                    }
                };
//            };
            // Models
            // Models
            // Models 


            document.dispatchEvent(a);
            if(!BROWSER_TEST_VERSION)navigator.splashscreen.hide();

        }(
                // PRIVATE
                        // PRIVATE
                                // PRIVATE
                                        function() {
                                            var SERVER = {
//                                            SERVER = {
                                                SOCKET: {
                                                    socket: null,  // current socket Object is stores here after init
                                                    init: function() { // function is used to init io object (socket.io lib)
                                                        if(typeof(io) === "undefined")return this;
                                                        this.socket = io.connect(ROUTE("sockets"));
                                                        this.socket.on('connect_failed', function() {
                                                            console.log("fail");
                                                            console.log("fail");
                                                            console.log("fail");
                                                        });
                                                        return this;
                                                        // need to make more exeptions here on error ...reconnect  etc
                                                    },
                                                            
                                                    
                                                    
                                                    connection_code: function() {// connection code is used to make application safe from double socket events---> normally they shouldn't appear
                                                        return _random(12, _random(3, "_ccode"));
                                                    },
                                                    _inited_chats: { // used to store inited chats ..also for avoid double events
                                                        project: [],
                                                        todo: []
                                                    },
                                                            
                                                    request: function(url, data, callback) {  // the MAIN Routing method
                                                        var sockets_route = (ROUTE('sockets').match(/\/$/) ? ROUTE('sockets').substring(0, ROUTE('sockets').length - 1) : ROUTE('sockets'));
                                                        
                                                        if(typeof(io) === "undefined")return callback(false);
                                                        io.sockets[sockets_route].open === false ? callback(false) : this.socket.on(url + data.connection_code, callback);
                                                        
                                                        var connection_code = this.connection_code();
                                                        this.socket.emit(url, {
                                                            body: data,
                                                            connection_code: connection_code
                                                        });
                                                        this.socket.on(url + "_result" + connection_code, callback);
                                                        // need more exeptions here
                                                        // need more exeptions here
                                                        // need more exeptions here
                                                    },
                                                    
                                                    //  ALL below :
                                                    //  SOCKET.IO METHODS in the application
                                                    // all methods triggeres request method
                                                    sync: function(data, callback) { // the main application method used to post data to server
                                                        this.request("sync", data, callback);
                                                    },
                                                    updatechat: function(connect_data, callback) { // another method used to update chat
                                                        // in data we specify id and type
                                                        console.log("_____________updatechat")
                                                        
                                                        if(typeof(io) === "undefined")return callback([]);
//                                                        if(io.sockets[sockets_route].open === false)return callback([]);
                                                        
                                                        if (connect_data.id && this._inited_chats[connect_data['type']].lastIndexOf(connect_data.id) === -1) {
//                                                            console.log("update chat INITED");
                                                            this._inited_chats[connect_data['type']].push(connect_data.id);
//                                                            console.log(this._inited_chats)
                                                            this.socket.emit('addroom', connect_data);
                                                            this.socket.on("updatechat", function(data) { // data just contain message that we need to sync DB
                                                                console.log("updatechat data");
                                                                console.log(data);

                                                                // FAST FIX ---> On SERVER Array changed to Object ---> the same here below
                                                                // FAST FIX ---> On SERVER Array changed to Object ---> the same here below
                                                                // FAST FIX ---> On SERVER Array changed to Object ---> the same here below
                                                                // FAST FIX ---> On SERVER Array changed to Object ---> the same here below
                                                                // FAST FIX ---> On SERVER Array changed to Object ---> the same here below
                                                                
                                                                // so data ---> [data]
                                                                    
                                                                if("project_id" in data){
                                                                    SERVER.DB.batch_insert_or_ignore_with_id("xiao_project_comments", [data], function() {
                                                                        SERVER.API._remove_from_sync("xiao_project_comments", function(){
                                                                            callback([data]);
                                                                        });
                                                                    });
                                                                }
                                                                if("todo_id" in data){
                                                                    SERVER.DB.batch_insert_or_ignore_with_id("xiao_todo_comments", [data], function() {
                                                                        SERVER.API._remove_from_sync("xiao_todo_comments", function(){
                                                                            callback([data]);
                                                                        });
                                                                    });
                                                                }
                                                            });
                                                        }
                                                    }
                                                    

                                                },
                                                // DB        
                                                // DB        
                                                // DB
                                                DB: function(db) { // works with local SQLite DB 
                                                    // DB is normally triggered via API
                                                    // but we often need to make several DB opeartion and then sync all the stuff at one time
                                                    // in this case we use manually API._sync after all

                                                    return {
                                                        _sql: "", // saves current sql query
                                                        select: function(data) {
                                                            var select = (data ? data : "*");
                                                            return this._sql = 'SELECT ' + select + ' ';
                                                        },
                                                        from: function(table) {
                                                            this._sql += ' FROM ' + table;
                                                            return SERVER.API._tables_to_sync.push(table.match(/([A-z0-9_]+)/ig)[0]);
                                                        },
                                                        where: function(where) {
                                                            this._sql += (this._sql.match(/( WHERE )/g) ? " AND " : " WHERE ");
                                                            return this._sql += where;
                                                        },
                                                        join: function(table, on) {
                                                            SERVER.API._tables_to_sync.push(table.match(/([A-z0-9_]+)/ig)[0]);
                                                            return this._sql += ' INNER JOIN ' + table + ' ON ' + on;
                                                        },
                                                        left_join: function(table, on) {
                                                            SERVER.API._tables_to_sync.push(table.match(/([A-z0-9_]+)/ig)[0]);
                                                            return this._sql += ' LEFT JOIN ' + table + ' ON ' + on;
                                                        },
                                                        order_by: function(order) {
                                                            return this._sql += ' ORDER BY ' + order;
                                                        },
                                                        order_by_desc: function(order) {
                                                            return this._sql += ' ORDER BY ' + order + ' DESC';
                                                        },
                                                        group_by: function(group) {
                                                            return this._sql += ' GROUP BY ' + group;
                                                        },
                                                        having: function(having) {
                                                            return this._sql += ' HAVING ' + having;
                                                        },
                                                        limit: function(limit, offset) {
                                                            return this._sql += ' LIMIT ' + limit + (offset ? (" OFFSET " + offset) : "");
                                                        },
                                                        query: function(callback) {
                                                            this._executeSQL(this._sql, callback);
                                                        },
                                                        row: function(callback) {
                                                            // return one row
                                                            this._executeSQL(this._sql + ' LIMIT 1', function(data) {
//                                                                data.length > 0 ? callback(data[0]) : callback([]);
                                                                callback(data[0]);
                                                            });
                                                        },
                                                        col: function(callback) {
                                                            // return one col
                                                            this._executeSQL(this._sql + ' LIMIT 1', function(data) {
                                                                
                                                                if(data.length > 0 ){
                                                                    for (var i in data[0]) {
                                                                        callback(data[0][i]);
    //                                                                    return;
                                                                        break;
                                                                    }
                                                                }else{
                                                                    callback([]);
                                                                }
                                                            });
                                                        },
                                                        _executeSQL: function(sql, callback) { // main DB method which makes query to DB
//                                                            console.log(sql);
                                                            function querySuccess(tx, results) {
                                                                var len = results.rows.length, db_result = [];
                                                                for (var i = 0; i < len; i++) {
//                                                                    console.log(results.rows.item(i))
                                                                    db_result[i] = results.rows.item(i);
                                                                }
//                                                                console.log(db_result);
                                                                if (db_result.length == 0 && !(sql.match(/sync/)))
                                                                    console.log(sql);

                                                                return (callback ? callback(db_result) : true);
                                                            }
                                                            function errorCB(err) {
                                                                console.log("Error processing SQL code: " + err.code);
                                                                console.log("Error processing SQL error below ");
                                                                console.log(err);
                                                                console.log(sql);
                                                            }
                                                            db.transaction(queryDB, errorCB);
                                                            function queryDB(tx) {
                                                                tx.executeSql(sql, [], querySuccess, errorCB);
                                                            }
                                                        },
                                                        insert: function(table, data, callback) {
                                                            var insert_id = this._make_id(table),
                                                                    sql = 'INSERT INTO ' + table + ' (id';
                                                            for (var key in data) { // we put id first
                                                                sql += "," + key;
                                                            }
                                                            sql += ') VALUES ("' + insert_id + '"';
                                                            for (var key in data) {
                                                                sql += ',"' + data[key] + '"';
                                                            }
                                                            sql += ')';
                                                            return (callback ? this._executeSQL(sql, function() {
                                                                callback(insert_id);
                                                            }) : this._executeSQL(sql));
                                                        },
                                                        insert_with_id: function(table, data, callback) {
                                                            var sql = 'INSERT INTO ' + table + ' (', i = 0;
                                                            for (var key in data) {
                                                                sql += (i == 0 ? key : "," + key);
                                                                ++i;
                                                            }
                                                            i = 0;
                                                            sql += ') VALUES (';
                                                            for (var key in data) {
                                                                sql += (i == 0 ? '"' + data[key] + '"' : ',"' + data[key] + '"');
                                                                ++i;
                                                            }
                                                            sql += ')';
                                                            return (callback ? this._executeSQL(sql, function(res) {
                                                                callback(res.insertId);
                                                            }) : this._executeSQL(sql));
                                                        },
                                                        batch_insert: function(table, data, callback) {
                                                            if (typeof table != "string")
                                                                return false; // table is a string not an array
                                                            if (data instanceof Array === false)
                                                                return false; // data is array here
                                                            var i = 0, _this = this, sql = 'INSERT INTO ' + table + ' (id';
                                                            for (var key in data[0]) {
                                                                sql += "," + key;
                                                            }
                                                            sql += ')';
                                                            for (var j in data) {
                                                                for (var ij in data[j]) {
                                                                    if (i == 0) {
                                                                        j == 0 ? sql += ' SELECT "' + _this._make_id(table) + '" as id' : sql += ' UNION SELECT "' + _this._make_id(table) + '" as id';
                                                                    }
                                                                    if (j == 0) {
                                                                        sql += ', "' + data[j][ij] + '" as ' + ij + ''
                                                                    } else {
                                                                        sql += ', "' + data[j][ij] + '"';
                                                                    }
                                                                    ++i;
                                                                }
                                                                i = 0;
                                                            }
                                                            return (
                                                                    callback ? this._executeSQL(sql, function() {
                                                                callback();
                                                            }) : this._executeSQL(sql)
                                                                    );
                                                        },
                                                        batch_insert_or_ignore: function(table, data, callback) {
                                                            if (typeof table != "string")
                                                                return false; // table is a string not an array
                                                            if (data instanceof Array === false)
                                                                return false; // data is array here
                                                            var i = 0, _this = this, sql = 'INSERT OR IGNORE INTO ' + table + ' (', ij = 0;
                                                            for (var key in data[0]) {
                                                                if (ij != 0) {
                                                                    sql += ",";
                                                                }
                                                                sql += key;
                                                                ++ij;
                                                            }
                                                            var ijk = 0;
                                                            sql += ')';
                                                            for (var j in data) {
                                                                for (var ij in data[j]) {
                                                                    if (i == 0) {
                                                                        j == 0 ? sql += ' SELECT ' : sql += ' UNION SELECT ';
                                                                    }
                                                                    if (j == 0) {
                                                                        if (ijk != 0) {
                                                                            sql += ",";
                                                                        }
                                                                        sql += '"' + data[j][ij] + '" as ' + ij + ''
                                                                    } else {
                                                                        if (ijk != 0) {
                                                                            sql += ",";
                                                                        }
                                                                        sql += '"' + data[j][ij] + '"';
                                                                    }
                                                                    ++i;
                                                                    ++ijk;
                                                                }
                                                                i = 0;
                                                                ijk = 0;
                                                            }
                                                            return (
                                                                    callback ? this._executeSQL(sql, function() {
                                                                callback();
                                                            }) : this._executeSQL(sql)
                                                                    );
                                                        },
                                                        batch_insert_with_id: function(table, data, callback) {
                                                            if (typeof table != "string")
                                                                return false; // table is a string not an array
                                                            if (data instanceof Array === false)
                                                                return false; // data is array here
                                                            var i = 0, _this = this, sql = 'INSERT INTO ' + table + ' (', ij = 0;
                                                            for (var key in data[0]) {
                                                                if (ij != 0) {
                                                                    sql += ",";
                                                                }
                                                                sql += key;
                                                                ++ij;
                                                            }
                                                            var ijk = 0;
                                                            sql += ')';
                                                            for (var j in data) {
                                                                for (var ij in data[j]) {
                                                                    if (i == 0) {
                                                                        j == 0 ? sql += ' SELECT ' : sql += ' UNION SELECT ';
                                                                    }
                                                                    if (j == 0) {
                                                                        if (ijk != 0) {
                                                                            sql += ",";
                                                                        }
                                                                        sql += '"' + data[j][ij] + '" as ' + ij + ''
                                                                    } else {
                                                                        if (ijk != 0) {
                                                                            sql += ",";
                                                                        }
                                                                        sql += '"' + data[j][ij] + '"';
                                                                    }
                                                                    ++i;
                                                                    ++ijk;
                                                                }
                                                                i = 0;
                                                                ijk = 0;
                                                            }
                                                            return (
                                                                    callback ? this._executeSQL(sql, callback) : this._executeSQL(sql)
                                                                    );
                                                        },
                                                        batch_insert_or_ignore_with_id: function(table, data, callback) {
                                                            if (typeof table != "string")
                                                                return false; // table is a string not an array
                                                            if (data instanceof Array === false)
                                                                return false; // data is array here
                                                            var i = 0, _this = this, sql = 'INSERT OR IGNORE INTO ' + table + ' (', ij = 0;
                                                            for (var key in data[0]) {
                                                                if (ij != 0) {
                                                                    sql += ",";
                                                                }
                                                                sql += key;
                                                                ++ij;
                                                            }
                                                            var ijk = 0;
                                                            sql += ')';
                                                            for (var j in data) {
                                                                for (var ij in data[j]) {
                                                                    if (i == 0) {
                                                                        j == 0 ? sql += ' SELECT ' : sql += ' UNION SELECT ';
                                                                    }
                                                                    if (j == 0) {
                                                                        if (ijk != 0) {
                                                                            sql += ",";
                                                                        }
                                                                        sql += '"' + data[j][ij] + '" as ' + ij + ''
                                                                    } else {
                                                                        if (ijk != 0) {
                                                                            sql += ",";
                                                                        }
                                                                        sql += '"' + data[j][ij] + '"';
                                                                    }
                                                                    ++i;
                                                                    ++ijk;
                                                                }
                                                                i = 0;
                                                                ijk = 0;
                                                            }
                                                            return (
                                                                    callback ? this._executeSQL(sql, callback) : this._executeSQL(sql)
                                                                    );
                                                        },
                                                        update: function(table, data, where, callback) {
                                                            var i = 0, j = 0, sql = "", sql = "UPDATE " + table + " SET ";
                                                            for (var key in data) {
                                                                if (i != 0) {
                                                                    sql += ",";
                                                                }
                                                                sql += key + '="' + data[key] + '"';
                                                                ++i;
                                                            }
                                                            if (where != "" && where != false) {
                                                                sql += " WHERE " + where;
                                                            }
                                                            return (
                                                                    callback ? this._executeSQL(sql, function() {
                                                                callback();
                                                            }) : this._executeSQL(sql)
                                                                    );
                                                        },
                                                        remove: function(table, where, callback) {
                                                            var sql = 'DELETE FROM ' + table + ' WHERE ' + where;
                                                            return (
                                                                    callback ? this._executeSQL(sql, function() {
                                                                callback();
                                                            }) : this._executeSQL(sql)
                                                                    );
                                                        },
                                                        batch_remove: function(table, data, callback) {
                                                            var sql = 'DELETE FROM ' + table + ' WHERE id IN (';
                                                            data.forEach(function(row, i) {
                                                                sql += (i == 0 ? '"' + row.id + '"' : ',"' + row.id + '"');
                                                            });
                                                            sql += ")";
                                                            return (
                                                                    callback ? this._executeSQL(sql, function() {
                                                                callback();
                                                            }) : this._executeSQL(sql)
                                                                    );
                                                        },
                                                        replace: function(table, data, callback) {
                                                            var i = 0, j = 0, sql = "", all_sql = "REPLACE INTO " + table + " ( ";
                                                            for (var str in data) {
                                                                if (i != 0) {
                                                                    all_sql += ",";
                                                                }
                                                                all_sql += str;
                                                                ++i;
                                                            }
                                                            all_sql += ") VALUES (";

                                                            for (var i in data) {
                                                                if (j != 0) {
                                                                    sql += ',';
                                                                }
                                                                sql += '"' + data[i] + '"';
                                                                ++j;
                                                            }
                                                            all_sql += sql + ')';

                                                            return (
                                                                    callback ? this._executeSQL(sql, function() {
                                                                callback();
                                                            }) : this._executeSQL(sql)
                                                                    );
                                                        },
                                                        batch_replace: function(table, data, callback) {
                                                            var i = 0, sql = "REPLACE INTO " + table + " ( ";
                                                            for (var key in data[0]) {
                                                                if (i != 0) {
                                                                    sql += ",";
                                                                }
                                                                sql += key;
                                                                ++i;
                                                            }
                                                            sql += ") ", i = 0;
                                                            for (var j in data) {
                                                                for (var ij in data[j]) {
                                                                    if (i == 0) {
                                                                        j == 0 ? sql += ' SELECT ' : sql += ' UNION SELECT ';
                                                                    } else {
                                                                        sql += ",";
                                                                    }
                                                                    if (j == 0) {
                                                                        sql += ' "' + data[j][ij] + '" as ' + ij + ''
                                                                    } else {
                                                                        sql += ' "' + data[j][ij] + '"';
                                                                    }
                                                                    ++i;
                                                                }
                                                                i = 0;
                                                            }
                                                            return (
                                                                    callback ? this._executeSQL(sql, function() {
                                                                callback();
                                                            }) : this._executeSQL(sql)
                                                                    );
                                                        },
//                                                        _for_sync_insert_batch_on_duplicate_update: function(table, data, callback) {
//                                                            var _this = this, len = data.length;
//                                                            this.batch_insert_or_ignore(table, data, function() {
//                                                                data.forEach(function(row, i) {
//                                                                    
//                                                                    if (table === "xiao_project_comments" || table === "xiao_todo_comments" ||
//                                                                        table === "xiao_project_attachments" || table === "xiao_todo_attachments" ||
//                                                                        table === "xiao_users" ) {
//                                                                    
//                                                                        switch (table) {
//                                                                            case "xiao_project_comments":
//                                                                                if(row['type'] === "image"){
//                                                                                    SERVER.PHONE.Files.download(row['server_path'])
//                                                                                }else{
//                                                                                    
//                                                                                }
//                                                                                break;
//                                                                            case "xiao_todo_comments":
//                                                                                
//                                                                                break;
//                                                                        }
//                                                                            if (i == len - 1) {
//                                                                                _this.update(table, row, 'id = "' + row.id + '"', callback);
//                                                                            } else {
//                                                                                _this.update(table, row, 'id = "' + row.id + '"');
//                                                                            }
//                                                                    }
//                                                                    
//                                                                });
//                                                            });
//                                                        },
                                                        insert_batch_on_duplicate_update: function(table, data, callback) {
                                                            var _this = this, len = data.length;
                                                            this.batch_insert_or_ignore(table, data, function() {
                                                                data.forEach(function(row, i) {
                                                                    if (i == len - 1) {
                                                                        _this.update(table, row, 'id = "' + row.id + '"', callback);
                                                                    } else {
                                                                        _this.update(table, row, 'id = "' + row.id + '"');
                                                                    }
                                                                });
                                                            });
                                                        },
                                                        _make_id: function(table) {//method we use to generate local id
                                                            return _random(8, "_" + table);
                                                        },
                                                                
                                                        // _init_tables is an array we store all the tables names ---> we use this array to init tables and to save sync time of them to lcoalStorage
                                                        // so very important to add each new table here
                                                        _init_tables: ['xiao_company_partners', 'xiao_projects', 'xiao_users', 'xiao_project_partners',
                                                            'xiao_partner_groups', 'xiao_partner_group_users', 'xiao_project_comments',
                                                            'xiao_companies', 'xiao_todos', 'xiao_todo_comments',
                                                            'xiao_project_comments_likes', 'xiao_todo_comments_likes'],
                                                        _init_db: function(clear) {
                                                            var _this = this;
                                                            console.log("start init");
                                                            db.transaction(createDB, error_create_DB);
                                                            function createDB(tx) {
                                                                // DON't FORGET TO ADD TABLE TO init_tables     for test
                                                                if (clear) {
                                                                    _this._init_tables.forEach(function(drop_table) {
                                                                        tx.executeSql('DROP TABLE IF EXISTS ' + drop_table);
                                                                    });

                                                                    tx.executeSql('DROP TABLE IF EXISTS sync');
                                                                    tx.executeSql('DROP TABLE IF EXISTS sync_delete');
                                                                }
                                                                tx.executeSql('CREATE TABLE IF NOT EXISTS xiao_project_partners(\n\
                                                                    server_id VARCHAR(255) NULL,\n\
                                                                    id VARCHAR(255) NOT NULL, \n\
                                                                    project_id VARCHAR(255) NOT NULL,\n\
                                                                    user_id INTEGER NOT NULL,\n\
                                                                    isLeader VARCHAR(255) NULL,\n\
                                                                    update_time varchar(255) NULL,\n\
                                                                    deleted INTEGER DEFAULT 0,\n\
                                                                    company_id INTEGER NOT NULL DEFAULT ' + SERVER.SESSION.get("company_id") + ',\n\
                                                                    UNIQUE(id))'
                                                                        ); 
                                                                tx.executeSql('CREATE TABLE IF NOT EXISTS xiao_companies(\n\
                                                                    id INTEGER NULL,\n\
                                                                    title VARCHAR(255) NOT NULL,\n\
                                                                    descr TEXT NULL,\n\
                                                                    creator_id INTEGER NOT NULL,\n\
                                                                    companyAdress VARCHAR(255) NOT NULL,\n\
                                                                    deleted INTEGER DEFAULT 0,\n\
                                                                    update_time varchar(255) NULL,\n\
                                                                    UNIQUE(id))'
                                                                        ); 
                                                                tx.executeSql('CREATE TABLE IF NOT EXISTS xiao_projects (\n\
                                                                    server_id VARCHAR(255) NULL,\n\
                                                                    id VARCHAR(255) NOT NULL,\n\
                                                                    creator_id INTEGER NULL,\n\
                                                                    title VARCHAR(255) NOT NULL,\n\
                                                                    descr TEXT NULL,\n\
                                                                    color INTEGER NULL,\n\
                                                                    level VARCHAR(255) NULL,\n\
                                                                    archived INTEGER DEFAULT 0,\n\
                                                                    update_time varchar(255) NULL,\n\
                                                                    creationTime varchar(255) NULL,\n\
                                                                    completeDate varchar(255) NULL,\n\
                                                                    deleted INTEGER DEFAULT 0,\n\
                                                                    company_id INTEGER NOT NULL DEFAULT ' + SERVER.SESSION.get("company_id") + ',\n\
                                                                    UNIQUE(id))'
                                                                        );   
                                                                tx.executeSql('CREATE TABLE IF NOT EXISTS xiao_company_partners(\n\
                                                                    id INTEGER NOT NULL,\n\
                                                                    user_id INTEGER NOT NULL,\n\
                                                                    update_time varchar(255) NULL,\n\
                                                                    deleted INTEGER DEFAULT 0,\n\
                                                                    company_id INTEGER NOT NULL DEFAULT ' + SERVER.SESSION.get("company_id") + ',\n\
                                                                    UNIQUE(id))'
                                                                        ); 
                                                                tx.executeSql('CREATE TABLE IF NOT EXISTS xiao_users(\n\
                                                                    id INTEGER NULL,\n\
                                                                    name varchar(255) NOT NULL,\n\
                                                                    email varchar(100) NOT NULL,\n\
                                                                    server_path TEXT NULL,\n\
                                                                    local_path varchar(255) DEFAULT "'+CONFIG.default_user_avatar+'",\n\
                                                                    pinyin varchar(255) NULL,\n\
                                                                    QRCode varchar(255) NULL,\n\
                                                                    adress varchar(255) NULL,\n\
                                                                    phoneNum varchar(255) NULL,\n\
                                                                    position varchar(255) NULL,\n\
                                                                    create_projects INTEGER NULL DEFAULT 10,\n\
                                                                    avatar_update INTEGER NULL DEFAULT 0,\n\
                                                                    update_time VARCHAR(255) NULL,\n\
                                                                    deleted INTEGER DEFAULT 0,\n\
                                                                    company_id INTEGER NOT NULL DEFAULT ' + SERVER.SESSION.get("company_id") + ',\n\
                                                                    isNewUser INTEGER NULL,\n\
                                                                    UNIQUE(id))'
                                                                        );   
                                                                tx.executeSql('CREATE TABLE IF NOT EXISTS xiao_partner_groups (\n\
                                                                    server_id VARCHAR(255) NULL,\n\
                                                                    id varchar(255) NOT NULL,\n\
                                                                    name varchar(255) NOT NULL,\n\
                                                                    creator_id VARCHAR(255) NOT NULL,\n\
                                                                    update_time VARCHAR(255) NULL,\n\
                                                                    deleted INTEGER DEFAULT 0,\n\
                                                                    company_id INTEGER NOT NULL DEFAULT ' + SERVER.SESSION.get("company_id") + ',\n\
                                                                    UNIQUE(id))'
                                                                        );    
                                                                tx.executeSql('CREATE TABLE IF NOT EXISTS xiao_partner_group_users (\n\
                                                                    server_id VARCHAR(255) NULL,\n\
                                                                    id varchar(255) NOT NULL,\n\
                                                                    group_id varchar(255) NOT NULL,\n\
                                                                    user_id INTEGER NOT NULL,\n\
                                                                    update_time VARCHAR(255) NULL,\n\
                                                                    deleted INTEGER DEFAULT 0,\n\
                                                                    company_id INTEGER NOT NULL DEFAULT ' + SERVER.SESSION.get("company_id") + ',\n\
                                                                    UNIQUE(id))'
                                                                        );   
                                                                tx.executeSql('CREATE TABLE IF NOT EXISTS xiao_project_comments (\n\
                                                                    server_id VARCHAR(255) NULL,\n\
                                                                    id varchar(255) NOT NULL,\n\
                                                                    content TEXT NULL,\n\
                                                                    type VARCHAR(255) NULL,\n\
                                                                    server_path TEXT NULL,\n\
                                                                    local_path TEXT NULL,\n\
                                                                    project_id VARCHAR(255) NOT NULL,\n\
                                                                    user_id VARCHAR(255) NOT NULL,\n\
                                                                    time TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,\n\
                                                                    update_time VARCHAR(255) NULL,\n\
                                                                    read INTEGER DEFAULT 0,\n\
                                                                    deleted INTEGER DEFAULT 0,\n\
                                                                    company_id INTEGER NOT NULL DEFAULT ' + SERVER.SESSION.get("company_id") + ',\n\
                                                                    UNIQUE(id))'
                                                                        );
                                                                tx.executeSql('CREATE TABLE IF NOT EXISTS xiao_todos (\n\
                                                                    server_id VARCHAR(255) NULL,\n\
                                                                    id VARCHAR(255) NOT NULL ,\n\
                                                                    title VARCHAR(255) NOT NULL ,\n\
                                                                    descr TEXT NULL DEFAULT NULL,\n\
                                                                    color INTEGER NULL DEFAULT NULL,\n\
                                                                    finished INTEGER DEFAULT 0,\n\
                                                                    endTime DATETIME DEFAULT NULL,\n\
                                                                    user_id INTEGER NOT NULL ,\n\
                                                                    creator_id INTEGER NOT NULL ,\n\
                                                                    project_id VARCHAR(255) NOT NULL ,\n\
                                                                    update_time TIMESTAMP NULL DEFAULT NULL,\n\
                                                                    deleted INTEGER DEFAULT 0,\n\
                                                                    company_id INTEGER NOT NULL DEFAULT ' + SERVER.SESSION.get("company_id") + ',\n\
                                                                    UNIQUE(id))'
                                                                        );
                                                                tx.executeSql('CREATE TABLE IF NOT EXISTS xiao_todo_comments (\n\
                                                                    server_id VARCHAR(255) NULL DEFAULT NULL,\n\
                                                                    id VARCHAR(255) NOT NULL,\n\
                                                                    content VARCHAR(255) NULL DEFAULT NULL,\n\
                                                                    type VARCHAR(255) NOT NULL,\n\
                                                                    server_path TEXT NULL,\n\
                                                                    local_path TEXT NULL,\n\
                                                                    todo_id VARCHAR(255) NOT NULL,\n\
                                                                    user_id INTEGER NOT NULL,\n\
                                                                    time TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,\n\
                                                                    update_time VARCHAR(255) NULL,\n\
                                                                    read INTEGER DEFAULT 0,\n\
                                                                    deleted INTEGER DEFAULT 0,\n\
                                                                    company_id INTEGER NOT NULL DEFAULT ' + SERVER.SESSION.get("company_id") + ',\n\
                                                                    UNIQUE(id))'
                                                                        );
//                                                                tx.executeSql('CREATE TABLE IF NOT EXISTS xiao_project_attachments (\n\
//                                                                    server_id VARCHAR(255) NULL DEFAULT NULL,\n\
//                                                                    id VARCHAR(255) NOT NULL,\n\
//                                                                    type VARCHAR(255) DEFAULT NULL,\n\
//                                                                    server_path MEDIUMTEXT DEFAULT NULL,\n\
//                                                                    local_path MEDIUMTEXT DEFAULT NULL,\n\
//                                                                    project_id VARCHAR(255) DEFAULT NULL,\n\
//                                                                    update_time TIMESTAMP NULL DEFAULT NULL,\n\
//                                                                    deleted INTEGER DEFAULT 0,\n\
//                                                                    company_id INTEGER NOT NULL DEFAULT ' + SERVER.SESSION.get("company_id") + ',\n\
//                                                                    UNIQUE(id))'
//                                                                        ); 
                                                                tx.executeSql('CREATE TABLE IF NOT EXISTS xiao_todo_attachments (\n\
                                                                    server_id VARCHAR(255) NULL DEFAULT NULL,\n\
                                                                    id VARCHAR(255) NOT NULL,\n\
                                                                    type VARCHAR(255) DEFAULT NULL,\n\
                                                                    server_path MEDIUMTEXT DEFAULT NULL,\n\
                                                                    local_path MEDIUMTEXT DEFAULT NULL,\n\
                                                                    todo_id VARCHAR(255) DEFAULT NULL,\n\
                                                                    update_time TIMESTAMP NULL DEFAULT NULL,\n\
                                                                    deleted INTEGER DEFAULT 0,\n\
                                                                    company_id INTEGER NOT NULL DEFAULT ' + SERVER.SESSION.get("company_id") + ',\n\
                                                                    UNIQUE(id))'
                                                                        );  
                                                                tx.executeSql('CREATE TABLE IF NOT EXISTS xiao_project_comments_likes (\n\
                                                                    server_id VARCHAR(255) NULL DEFAULT NULL,\n\
                                                                    id VARCHAR(255) NOT NULL,\n\
                                                                    comment_id VARCHAR(255) NOT NULL,\n\
                                                                    user_id INTEGER NOT NULL ,\n\
                                                                    update_time TIMESTAMP NULL DEFAULT NULL,\n\
                                                                    deleted INTEGER DEFAULT 0,\n\
                                                                    company_id INTEGER NOT NULL DEFAULT ' + SERVER.SESSION.get("company_id") + ',\n\
                                                                    UNIQUE(id))'
                                                                        );
                                                                tx.executeSql('CREATE TABLE IF NOT EXISTS xiao_todo_comments_likes (\n\
                                                                    server_id VARCHAR(255) NULL DEFAULT NULL,\n\
                                                                    id VARCHAR(255) NOT NULL,\n\
                                                                    comment_id VARCHAR(255) NOT NULL,\n\
                                                                    user_id INTEGER NOT NULL ,\n\
                                                                    deleted INTEGER DEFAULT 0,\n\
                                                                    update_time TIMESTAMP NULL DEFAULT NULL,\n\
                                                                    company_id INTEGER NOT NULL DEFAULT ' + SERVER.SESSION.get("company_id") + ',\n\
                                                                    UNIQUE(id))'
                                                                        );
                                                                            
                                                                //  very important to add each new table to this._init_tables array
                                                                //  very important to add each new table to this._init_tables array
                                                                //  very important to add each new table to this._init_tables array
                                                                //  very important to add each new table to this._init_tables array

                                                                tx.executeSql('CREATE TABLE IF NOT EXISTS sync_delete (\n\
                                                                    `sid` INTEGER NOT NULL PRIMARY KEY,\n\
                                                                    `table_name` VARCHAR( 255 ) NOT NULL,\n\
                                                                    `time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,\n\
                                                                    `row_id` varchar(255) NOT NULL )'
                                                                        );
                                                                tx.executeSql('CREATE TABLE IF NOT EXISTS sync (\n\
                                                                    sid INTEGER NOT NULL PRIMARY KEY,\n\
                                                                    table_name VARCHAR( 255 ) NOT NULL,\n\
                                                                    time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,\n\
                                                                    row_id varchar(255) NOT NULL)'
                                                                        );
                                                                if (clear) {
                                                                    _this._init_tables.forEach(function(cur) { // triggers are used to paste data to sync table
                                                                        if(cur !== "xiao_todo_comments" && cur !== "xiao_project_comments"){
                                                                            var sql = 'CREATE TRIGGER update_' + cur + ' AFTER UPDATE ON ' + cur + ' FOR EACH ROW BEGIN INSERT INTO sync(table_name, row_id) VALUES("' + cur + '", NEW.id); END; ';
                                                                            tx.executeSql(sql);
                                                                        }
                                                                        var sql = 'CREATE TRIGGER insert_' + cur + ' AFTER INSERT ON ' + cur + ' FOR EACH ROW BEGIN INSERT INTO sync(table_name, row_id) VALUES("' + cur + '", NEW.id); END; ';
                                                                        tx.executeSql(sql);
//                                                                        var sql = 'CREATE TRIGGER delete_' + cur + ' BEFORE DELETE ON ' + cur + ' FOR EACH ROW BEGIN INSERT INTO sync(table_name, row_id, deleted_flag) VALUES("' + cur + '", OLD.id, "1"); END; ';
                                                                        var sql = 'CREATE TRIGGER delete_' + cur + ' BEFORE DELETE ON ' + cur + ' FOR EACH ROW BEGIN INSERT INTO sync_delete(table_name, row_id) VALUES("' + cur + '", OLD.id); END; ';
                                                                        tx.executeSql(sql);
                                                                    });
                                                                }
                                                            }
                                                            function error_create_DB(tx, err) {
                                                                console.log(tx);
                                                                console.log(err);
                                                            }
                                                            console.log("inited");
                                                            return this;
                                                        }
                                                    };
                                                }(window.openDatabase("BaoPiQi", "1.0", "xiao_db3", 200000)),
                                                // DB        
                                                // DB        
                                                // DB        



                                                // API
                                                // API
                                                // API
                                                API: {
                                                    _tables_to_sync: [], //used in all DB select methods
                                                    _clear_tables_to_sync: function(table) { // used to remove a table from sync array above
                                                        table ? delete this._tables_to_sync[table] : this._tables_to_sync = [];
                                                    },
                                                            
                                                    /* methods to make queries to DB object */
                                                    /* methods to make queries to DB object */
                                                    /* methods to make queries to DB object */

                                                    remove: function(table, where, callback) {
                                                        var _this = this;
                                                        SERVER.DB.remove(table, where, function() {
                                                            if (callback)
                                                                callback();
                                                            _this._sync([table]);
                                                        });
                                                    },
                                                    read: function(callback) {
                                                        // WHEN READ sync first then EXECUTE SQL
                                                        this._sync(this._tables_to_sync, function() {
                                                            SERVER.DB.query(callback);
                                                        });
                                                    },
                                                    row: function(callback) {
                                                        // return one row
                                                        this._sync(this._tables_to_sync, function() {
                                                            SERVER.DB.row(callback);
                                                        });
                                                    },
                                                    col: function(callback) {
                                                        // return one col
                                                        this._sync(this._tables_to_sync, function() {
                                                            SERVER.DB.col(callback);
                                                        });
                                                    },
//                        insert  :  function(table, data, callback, timeout){ // timeout need to be set to true if we want to get callback after synchronization with server
                                                    insert: function(table, data, callback) { // timeout need to be set to true if we want to get callback after synchronization with server
                                                        if (typeof table != "string")
                                                            return false; // table is just text here not an array
                                                        if (data instanceof Array)
                                                            return false;
                                                        // WHEN CREATE :
                                                        //  we use orm in api to MAKE QUERY and return generated id in callback momentary if query was success
                                                        //  after that sync performed asynchronously
                                                        var _this = this;
                                                        SERVER.DB.insert(table, data, function(insert_id) {
//                                if(callback && timeout === true){
//                                    _this._sync( [table], function(){ callback(insert_id); });
//                                }else     
                                                            console.log("________________table")
                                                            console.log(table)
                                                            if (callback) {
                                                                callback(insert_id);
                                                                _this._sync([table]);
                                                            } else {
                                                                _this._sync([table]);
                                                            }
                                                        });
                                                    },
                                                    batch_insert: function(table, data, callback, timeout) {
                                                        // batch insert method to query an array in one time F.E Project partners insert
                                                        if (typeof table != "string")
                                                            return false; // table is a string not an array
                                                        if (data instanceof Array === false)
                                                            return false; // data is array here
                                                        var _this = this;
                                                        SERVER.DB.batch_insert(table, data, function() {
                                                            if (callback && timeout === true) {
                                                                _this._sync([table], function() {
                                                                    callback();
                                                                });
                                                            } else if (callback) {
                                                                callback();
                                                                _this._sync([table]);
                                                            } else {
                                                                _this._sync([table]);
                                                            }
                                                        });
                                                    },
                                                    update: function(table, data, where, callback) {
                                                        if (typeof where == "function") {
                                                            callback = where;
                                                            where = false;
                                                        }
                                                        var _this = this;
                                                        SERVER.DB.update(table, data, where, function() {
                                                            if (callback) {
                                                                _this._sync([table], callback);
                                                            } else {
                                                                _this._sync([table]);
                                                            }
//                                                            return (
//                                                                    callback ? _this._sync([table], function() {
//                                                                callback();
//                                                            }) : _this._sync([table])
//                                                                    );
                                                        });

                                                    },
                                                    /* END methods to make queries to DB object */
                                                    /* END methods to make queries to DB object */
                                                    /* END methods to make queries to DB object */


                                                    _check_local_DB_and_fs: function(table_name, callback) { //method is used to check local updates before sync
                                                        // it checks local db and file system
                                                        var result = {updated: []}, counter = 0,
                                                                sql = 'SELECT * FROM sync as s INNER JOIN ' + table_name + ' as t ON s.row_id = t.id WHERE s.table_name ="' + table_name + '"',
                                                                sql_del = 'SELECT * FROM sync_delete WHERE table_name ="' + table_name + '"';
                                                        SERVER.DB._executeSQL(sql, function(data) {
                                                            counter = data.length;
                                                            data.length > 0 ? data.forEach(function(el, i) {
                                                                
                                                                if (table_name === "xiao_project_comments" || table_name === "xiao_todo_comments" ||
                                                                    table_name === "xiao_project_attachments" || table_name === "xiao_todo_attachments"
                                                                ) {
                                                                    
                                                                    if (el.type === "image" || el.type === "voice") {
                                                                        
                                                                        SERVER.PHONE.Files.upload(el.local_path, el.type, function(server_path) {
                                                                            var copy_el = {};
                                                                            for(var c_i in el){
                                                                                copy_el[c_i] = el[c_i];
                                                                            }
                                                                            copy_el.server_path = server_path;
//                                                                            el.server_path = server_path;
//                                                                            result.updated.push(el);
                                                                            result.updated.push(copy_el);
                                                                            make_callback_v2();
                                                                        });
                                                                        
                                                                    }else if (el.type === "text") {
                                                                        result.updated.push(el);
                                                                        make_callback_v2();
//                                                                        alert("text")
                                                                    }
//                                                                    alert("11")
                                                                }else if(table_name === "xiao_users"){
//                                                                    alert("xiao_users")
//                                                                    if (el.local_path !== CONFIG.default_user_avatar && el.server_path == "") {
                                                                    if (el.avatar_update == "1") {
                                                                        // if the file is not default avatar and we have a "" as server_path then we need to upload
//                                                                        alert("server_path == ")
                                                                        SERVER.PHONE.Files.upload(el.local_path, "image", function(server_path) {
//                                                                            alert("upload")
                                                                            var copy_el = {};
                                                                            for(var c_i in el){
                                                                                copy_el[c_i] = el[c_i];
                                                                            }
                                                                            copy_el.server_path = server_path;
//                                                                            el['server_path'] = server_path;
//                                                                            result.updated.push(el);
                                                                            result.updated.push(copy_el);
                                                                            make_callback_v2();
                                                                        });
                                                                    } else {
                                                                        result.updated.push(el);
                                                                        make_callback_v2();
                                                                    }
                                                                    
                                                                }else{
//                                                                    alert("else");
                                                                    result.updated.push(el);
                                                                    make_callback_v2();
                                                                }
                                                                
                                                            }) : make_callback_v2();
                                                            
                                                        });
                                                        
                                                        SERVER.DB._executeSQL(sql_del, function(del_data) {
                                                            result.deleted = del_data;
                                                            make_callback_v2();
                                                        });

                                                        function make_callback_v2(){
                                                            --counter;
                                                            if (result.deleted && result.updated && counter <= 0) {
//                                                                console.log("make_callback");
//                                                                console.log("___________result")
//                                                                console.log(result)
                                                                callback({
                                                                    name: table_name,
                                                                    last_sync: SERVER.SESSION._get_sync_time(table_name),
                                                                    updated: result.updated, // move here
                                                                    deleted: result.deleted
                                                                });
                                                            }
                                                        }
                                                            
                                                    },
                                                    _sync: function(tables, callback) { // the main application method
                                                        // used to sync local db and remote
                                                        // also used to sync chat messages
                                                        var sync_data = [], _this = this;
//                                                        console.log("sync_____tables")
//                                                        console.log(tables)
//                                                        console.log("sync_____sync_data")
//                                                        var c = sync_data;
//                                                        console.log(c)
                                                        tables.forEach(function(table_name, table_num) {
//                                                                 console.log("_before______sync_data")
//                                                                console.log(sync_data)
                                                            _this._check_local_DB_and_fs(table_name, function(data) {
                                                                sync_data.push(data);
//                                                                console.log("_______data")
//                                                                console.log(data)
//                                                                console.log("_______sync_data")
//                                                                console.log(sync_data)
                                                                if (table_num == (tables.length - 1)) {
                                                                    callback ? _this._make_socket_request(sync_data, callback) : _this._make_socket_request(sync_data);
                                                                }
                                                            });
                                                        });
                                                    },
                                                    _make_socket_request: function(sync_data, callback) {//used to post socket request with all updates to server or request them
                                                        var _this = this;
                                                        this._tables_to_sync = [];
//                                                        console.log("OLD ___SERVER REQUEST: ");
                                                        console.log("SERVER REQUEST: ");
                                                        console.log(sync_data);
//                                                        var fix_sync_data = [];
//                                                        if(sync_data.length > 1){
//                                                            
//                                                            sync_data.forEach(function(sd, sd_i){
//                                                                console.log(sd_i);
//                                                                console.log(sync_data[sd_i-1].name);
//                                                                if(sd_i > 0){
//                                                                    if(sync_data[sd_i-1].name !== sd.name){
//                                                                        fix_sync_data.push(sd);
//                                                                    }
//                                                                }else{
//                                                                    fix_sync_data.push(sd);
//                                                                }
//                                                            });
//                                                            
//                                                        }else{
//                                                            fix_sync_data = sync_data;
//                                                        }
//                                                        console.log("SERVER REQUEST: ");
//                                                        console.log(fix_sync_data);
                                                        SERVER.SOCKET.sync({
//                                                            tables: fix_sync_data,
                                                            tables: sync_data,
                                                            info: SERVER.SESSION.local_data()
                                                        }, function(server) {
                                                            if (server) {
                                                                console.log("SERVER RESPONCE: ");
                                                                console.log(server);
                                                                var changes = server.response;
                                                                changes.forEach(function(ij, num) {
                                                                    // apply changes
                                                                    if ((ij.updated && ij.updated.length > 0) ||
                                                                            (ij.deleted && ij.deleted.length > 0)
                                                                            ) {
                                                                        //if need to UPDATE or CREATE something  ~~~ GOES IN ONE METHOD with replace
                                                                        if (ij.deleted.length > 0) {
                                                                            SERVER.DB.batch_remove(ij.table, ij.deleted, function() {
                                                                                _this._sync_delete_clear(ij.table);
//                                                                                _this._sync_delete_clear(ij.table, server.info.time);
                                                                            });
                                                                        }
                                                                        if (ij.updated.length > 0) {
                                                                            if(ij.table === "xiao_project_comments" || ij.table === "xiao_todo_comments" ||
                                                                                ij.table === "xiao_project_attachments" || ij.table === "xiao_todo_attachments" ||
                                                                                ij.table === "xiao_users"
                                                                            ){
                                                                                SERVER.DB.insert_batch_on_duplicate_update(ij.table, ij.updated, function() {
                                                                                    make_callback();
                                                                                });
                                                                                if(ij.table === "xiao_users"){
                                                                                    SERVER.DB._executeSQL('UPDATE xiao_users SET avatar_update = "0"');
                                                                                }
                                                                            } else {
                                                                                SERVER.DB.batch_replace(ij.table, ij.updated, function() {
                                                                                    make_callback();
                                                                                });
                                                                            }
                                                                        }
                                                                    } else {
                                                                        make_callback();
                                                                    }

                                                                    function make_callback() {
                                                                        _this._sync_clear(ij.table, server.info.time);
                                                                        if (num == (changes.length - 1)) {
                                                                            _this._sync_delete_clear();
                                                                            return (callback ? callback() : true);
                                                                        }
                                                                    }
                                                                });
                                                            } else {
                                                                console.log("no server");
                                                                return (callback ? callback() : false);
                                                            }
                                                        });
                                                    },
                                                    _sync_clear: function(table, time) {
                                                        SERVER.DB._executeSQL('DELETE FROM sync WHERE table_name = "' + table + '"');
                                                        SERVER.SESSION._update_sync_time(table, time);
                                                    },
                                                            
                                                    _remove_from_sync: function(table, callback){
                                                        callback ? SERVER.DB._executeSQL('DELETE FROM sync WHERE table_name = "' + table + '"', callback) : SERVER.DB._executeSQL('DELETE FROM sync WHERE table_name = "' + table + '"');
                                                    },
                                                    
                                                    _sync_delete_clear: function(table, time) {
                                                        if (table) {
                                                            SERVER.DB._executeSQL('DELETE FROM sync_delete WHERE table_name = "' + table + '"');
                                                        } else {
                                                            SERVER.DB._executeSQL('DELETE FROM sync_delete');
                                                        }
//                                                        SERVER.SESSION._update_sync_time(table, time);
                                                    }

                                                },
                                                // API
                                                // API
                                                // API
                                                
                                                Sync : function(tables){
                                                    //will be used as new SERVER.Sync(tables) to incapsulate the connection
                                                },
                                                
                                                
                                                // Storage
                                                // Storage
                                                // Storage
                                                SESSION: function(storage) { // simple LocalStorage  helper 
                                                    // in lcoalstorage we savelast sync SQLite tables times and user info
                                                    return {
                                                        _get_sync_time: function(table) {
                                                            return storage.getItem(table);
                                                        },
                                                        _update_sync_time: function(table, time) {
                                                            storage.setItem(table, time);
                                                        },
                                                        local_data: function() {
                                                            return {
                                                                user_id: storage.getItem("user_id"),
                                                                company_id: storage.getItem("company_id"),
                                                                project_id: storage.getItem("project_id"),
                                                                todo_id: storage.getItem("todo_id")
                                                            };
                                                            var data = {};
                                                            for (var i in storage) {
                                                                if (i != "length") {
                                                                    data[i] = storage[i];
                                                                }
                                                            }
                                                            return data;
                                                        },
                                                        set: function(data, value) {
                                                            return storage.setItem(data, value);
                                                        },
                                                        get: function(data) {
                                                            return storage.getItem(data);
                                                        },
                                                        clear: function() {
                                                            storage.clear();
                                                        },
                                                        _init_storage: function(clear) { //used to init storage  ---> the main idea for login new user
                                                            var _this = this,
//                                    test_user_id = (this.get("user_id") ? this.get("user_id") : "dsadasdas1212312");
                                                                    test_user_id = "dsadasdas1212312";
//                                                            if( this.get("saved_user_data") ){
//                                                                var old_user = JSON.parse(this.get("saved_user_data"));
//                                                            }
                                                            this.clear();
//                                                            if(old_user)this.set("saved_user_data", JSON.stringify(old_user));
                                                            this.set("user_id", test_user_id);
                                                            this.set("user_name", "Igor");
                                                            this.set("company_id", 1);
                                                            SERVER.DB._init_tables.forEach(function(cur) {
                                                                _this._update_sync_time(cur, 1);
                                                            });

                                                            return this;
                                                        }

                                                    };

                                                }(window.localStorage),
                                                //Storage
                                                //Storage
                                                //Storage


                                                // PHONEGAP
                                                // PHONEGAP
                                                // PHONEGAP
                                                PHONE: function() {
                                                    // PARENT class which conatins device type, browser type, file_system entry, and file creation ability...also logger 
                                                    function Phone() {
                                                        this.ua = navigator.userAgent.toLowerCase();
                                                        this.device = function() {
                                                            var device;
                                                            var ua = navigator.userAgent.toLowerCase();
                                                            if (ua.match(/(iphone|ipod|ipad)/i)) {
                                                                device = "ios";
                                                            } else if (ua.match(/android/i)) {
                                                                device = "android";
                                                            } else if (ua.match(/blackberry/i)) {
                                                                device = "blackberry";
                                                            } else if (ua.match(/windows phone os 7.5/i)) {
                                                                device = "windows";
                                                            } else {
                                                                device = "desktop";
                                                            }
                                                            return device;
                                                        }();

                                                        this.log_error = function(err, err1) {
                                                            console.log("Phone_error");
                                                            console.log(err);
                                                            console.log(err1);
//                                                            alert(err + " " + err1);
                                                        };
                                                        this.log_success = function() {
                                                            console.log(" success ");
                                                        };


                                                    };
                                                    /* PARENT */


                                                    function Files() {
                                                        Files.superclass.constructor.call(this);
//                                                        this.fs = inited_fs; // see the start of this file
                                                        this.fs = null; // see the start of this file
                                                        this.file_path = null;
                                                        this.short_name = null;
                                                        
//                                                        this.encode64_and_create = function(data, callback){
//                                                            
//                                                        };
                                                        
//                                                        this._create_file = function(after, callback) {
                                                        this._create_file = function(file_obj, callback) {
//                                                            var file_obj = {
//                                                                name: "test or test.jpg",
//                                                                type: "image/voice etc",
//                                                                format: 'jpg or ""'
//                                                            };
                                                            
//                                                            var _this = this, new_file_name = _random(5, after);
                                                            var _this = this, new_file_name = _random(5, file_obj.name);
//                                                            new_file_name += (/\.[A-Za-z0-9]+$/.test(after) ? "" : "." + CONFIG.audio_format);
                                                            new_file_name = (function(){
                                                                if((!"format" in file_obj) || file_obj.format === ""){
                                                                    return new_file_name;
                                                                }else{
                                                                    return new_file_name+"."+file_obj.format;
                                                                }
                                                            }());
                                                            
                                                            if(this.fs === null){
                                                                
                                                                window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fs) {
                                                                    fs.root.getDirectory(CONFIG.root_dir, {create: true, exclusive: false}, function(dir) {
                                                                        _this.fs = dir;
                                                                        _this.fs.getFile(new_file_name, {create: true, exclusive: false}, function(fileEntry) {
                                                                            _this.file_path = fileEntry.fullPath;
                                                                            _this.short_name = fileEntry;
                                                                            callback(fileEntry.fullPath, fileEntry);
                                                                        }, _this.log_error);

                                                                    }, function(err1) {
                                                                        console.log(err1);
                                                                    });
                                                                }, function(err1) {
                                                                    console.log(err1);
                                                                });
                                                                
                                                            }else{
                                                                
                                                                 // if file name dpn't have format we specify it
                                                                this.fs.getFile(new_file_name, {create: true, exclusive: false}, function(fileEntry) {
                                                                    _this.file_path = fileEntry.fullPath;
                                                                    _this.short_name = fileEntry;
                                                                    callback(fileEntry.fullPath, fileEntry);
                                                                }, _this.log_error);
                                                                
                                                            }
                                                        };

                                                        this.download = function(server_path, callback) {

                                                            var fileTransfer = new FileTransfer(),
                                                                    uri = encodeURI(server_path),
                                                                    new_file_name = server_path.substring(server_path.lastIndexOf('/') + 1);
                                                            console.log("donwloading");
                                                            console.log(new_file_name);
                                                            console.log(uri);
                                                            this._create_file({name:new_file_name}, function(local_path) {
                                                                fileTransfer.download(
                                                                        uri,
                                                                        local_path,
                                                                        function(download_entry) {
                                                                            console.log("download_entry");
                                                                            console.log(download_entry);
                                                                            console.log("download complete: " + download_entry.fullPath);
                                                                            callback(download_entry.fullPath);
                                                                        },
                                                                        function(error) {
                                                                            console.log("download error source " + error.source);
                                                                            console.log("download error target " + error.target);
                                                                            console.log("upload error code" + error.code);
                                                                        }
                                                                //                                {
                                                                //                                    headers: {
                                                                //                                        "Authorization": "Basic dGVzdHVzZXJuYW1lOnRlc3RwYXNzd29yZA=="
                                                                //                                    }
                                                                //                                }
                                                                );

                                                            });

                                                        };
                                                        
                                                        this.base64image_to_file = function(base64_str, fake_path, callback){
                                                            console.log("base64image_to_file");
//                                                            var image_format = base64_str.match(/data:[a-z]*\/([a-z]*);base64,/)[1];
                                                            var image_format = base64_str.match(/data:[a-z]*\/([a-z]*);base64,/),
                                                                _this = this;
                                                            if(image_format === null){
                                                                image_format = fake_path.match(/\.([a-zA-Z0-9]*)$/);
//                                                                image_format = image_format[0];
                                                            }
                                                            console.log(image_format);
                                                            image_format = image_format[1];
                                                            
//                                                                alert(image_format);
//                                                             image_format = image_format[1];
//                                                                var image_data = Base64.decode( replace("/data:[a-z]*\/[a-z]*;base64,/", "", base64_str) ),
//                                                                var image_data = Base64.decode( base64_str.replace(/data:[a-z]*\/[a-z]*;base64,/, "") ),
                                                            var image_data = Base64.decode( base64_str.replace(/data:[a-z]*\/?[a-z]*;?base64,/, "") ); 
                                                                
                                                            this._create_file({name:SERVER.SESSION.get("user_name"), format:image_format}, function(file_path, entry){
                                                                _this._file_writer(entry, image_data, function(){
                                                                    callback(file_path);
                                                                });
                                                            });
                                                        };
                                                        
                                                        /*
                                                        this.upload = function(local_path, type, callback) {
                                                            // local_path --- is file path in phone local fs
                                                            // type       --- is type of file we want to upload 
                                                            //                              F.E. image or audio
                                                            // mime types:
                                                            // audio/mpeg
                                                            // image/jpeg
                                                            
                                                            if (!local_path || !type || (type != "image" && type != "voice")) {
                                                                return false;
                                                            } // we use just image upload and audio
                                                            var options = new FileUploadOptions(),
                                                                    ft = new FileTransfer(),
                                                                            _this = this;
                                                            options.fileKey = "file";
                                                            
                                                            if(type === "image" && local_path.length >= 500){
                                                                // if this is image we have base64 encode string with file data 
                                                                // so that what we do is:
                                                                // decode base64
                                                                // write data to file 
                                                                // finally we get image file
                                                                var image_format = local_path.match(/data:[a-z]*\/([a-z]*);base64,/)[1];
                                                                console.log("image_format");
                                                                console.log(image_format);
                                                                var image_data = Base64.decode( preg_replace("/data:[a-z]*\/[a-z]*;base64,/", "", local_path) );
                                                                this._create_file({name:SERVER.SESSION.get("user_name"), format:image_format}, function(file_path, entry){
                                                                    _this._file_writer(entry, image_data, function(){
                                                                        options.fileName = file_path.substr(file_path.lastIndexOf('/') + 1);
                                                                        options.mimeType = "image/jpeg";
                                                                        options.params = {type: type};
                                                                        
                                                                        ft.upload(file_path, encodeURI(ROUTE("file_upload_url")), function(node_obj) {
                                                                            callback(node_obj.response);
                                                                        }, fail, options);
                                                                    });
                                                                });
                                                                
                                                            }else if(type === "voice"){
                                                                // voice file is already created file with Phonegap so just upload file to server
                                                                options.fileName = local_path.substr(local_path.lastIndexOf('/') + 1);
                                                                options.mimeType = "audio/mpeg";
                                                                options.params = {type: type};
                                                                
                                                                ft.upload(local_path, encodeURI(ROUTE("file_upload_url")), function(node_obj) {
                                                                    callback(node_obj.response);
                                                                }, fail, options);
                                                            }
                                                            
//                                                            console.log(local_path);
//                                                            console.log(options.fileName);

                                                            

//                                                            switch (type) {
//                                                                case "image":
//                                                                    options.mimeType = "image/jpeg";
//                                                                    break;
//                                                                case "voice":
//                                                                    options.mimeType = "audio/mpeg";
//                                                                    break;
//                                                            }
//                                                            options.params = {type: type};
//
//                                                            ft.upload(local_path, encodeURI(ROUTE("file_upload_url")), function(node_obj) {
//                                                                callback(node_obj.response);
//                                                            }, fail, options);

                                                            function fail(error) {
                                                                //                                alert("An error has occurred: Code = " + error.code);
                                                                console.log("upload error ");
                                                                console.log(error);
                                                                console.log("upload error source " + error.source);
                                                                console.log("upload error target " + error.target);
                                                                callback();
                                                            }
                                                        };
                                                        */
                                                        
                                                        this.upload = function(local_path, type, callback) {
                                                            // local_path --- is file path in phone local fs
                                                            // type       --- is type of file we want to upload 
                                                            //                              F.E. image or audio
                                                            // mime types:
                                                            // audio/mpeg
                                                            // image/jpeg
//                                                            alert("upload")
//                                                            alert(type)
//                                                            alert(local_path)
                                                            if (!local_path || !type || (type != "image" && type != "voice")) {
                                                                return false;
                                                            } // we use just image upload and audio
                                                            var options = new FileUploadOptions(),
                                                                    ft = new FileTransfer();
                                                            options.fileKey = "file";
                                                            options.fileName = local_path.substr(local_path.lastIndexOf('/') + 1);
                                                            console.log(local_path);
                                                            console.log(options.fileName);
                                                            switch (type) {
                                                                case "image":
                                                                    options.mimeType = "image/jpeg";
                                                                    break;
                                                                case "voice":
                                                                    options.mimeType = "audio/mpeg";
                                                                    break;
                                                            }
                                                            options.params = {type: type};

                                                            ft.upload(local_path, encodeURI(ROUTE("file_upload_url")), function(node_obj) {
                                                                console.log("___________file");
                                                                console.log(node_obj);
                                                                callback(node_obj.response);
                                                            }, fail, options);

                                                            function fail(error) {
                                                                //                                alert("An error has occurred: Code = " + error.code);
                                                                console.log("upload error ");
                                                                console.log(error);
//                                                                alert("error");
                                                                console.log("upload error source " + error.source);
                                                                console.log("upload error target " + error.target);
                                                                callback();
                                                            }
                                                        };
                                                        
                                                        this._file_writer = function(entry, image_data, callback){
//                                                            var _this = this;
                                                            
                                                            entry.createWriter(gotFileWriter, this.log_error);
                                                            
                                                            function gotFileWriter(writer) {
//                                                                writer.onwrite = _this._log_success;
                                                                writer.onwrite = callback;
                                                                writer.write(image_data);
//                                                                alert(entry);
                                                            };
                                                        };
                                                    }
                                                    extend(Files, Phone);
                                                    
                                                    /* Photos */
                                                    
                                                    function Photos(){
//                                                        Photos.superclass.constructor.call(this);
                                                        this.camera = function(callback){
                                                            this._get_picture(Camera.PictureSourceType.CAMERA, callback);
                                                        };
                                                        this.album = function(callback){
                                                            this._get_picture(Camera.PictureSourceType.PHOTOLIBRARY, callback);
                                                        };
                                                        this._get_picture = function(source, callback){
                                                            navigator.camera.getPicture(
                                                                function(imageURI){
                                                                    console.log(imageURI);
                                                                    callback(imageURI);
                                                                },
                                                                function(fail){
                                                                    // fail or cancel
                                                                    callback(false);
                                                                    console.log(fail);
                                                                }, 
                                                                {
                                                                    quality: 50,
                                                                    sourceType: source,
                                                                    destinationType: navigator.camera.DestinationType.FILE_URI
                                                            });
                                                        };
                                                    }
//                                                    extend(Photos, Phone);
                                                    
                                                    /* Photos */
                                                    
                                                    
                                                    /* Voice_message */
                                                    function VoiceMessage() {
                                                        VoiceMessage.superclass.constructor.call(this);

                                                        this.audio = null;

                                                        this.last_record_path = null;

                                                        this.record_start = function(callback) {
                                                            var _this = this;
                                                            this._create_file({name:SERVER.SESSION.get("user_name"), format:CONFIG.audio_format}, function(file_path) { // callback
                                                                _this.audio = new Media(file_path, _this.log_success, _this.log_error);
                                                                _this.audio.startRecord();
                                                                _this.last_record_path = file_path;
                                                                callback(file_path);
                                                            });
                                                        };

                                                        this.record_stop = function() {
                                                            if (this.audio) {
                                                                var _this = this;
                                                                this.audio.stopRecord();
                                                                _this.audio = null;
                                                                _this.last_record_path = null;
                                                            }
                                                        };

                                                        this.record_play = function(file) {
                                                            this.audio = new Media(file, this.log_success, this.log_error);
                                                            this.audio.play();
                                                        };

                                                        this.play = function(file, callback) { //used to continue playing
//                                                            alert(file);
//                                                            this.audio = null;
//                                                            this.audio = new Media(file, this.log_success, this.log_error);
                                                            this.audio.play();
                                                            if(callback)callback(this.audio.getDuration());
//                                                            var _this = this;
//                                                            console.log(this.file_path);
//                                                            if (this.audio === null || this.file_path != file) {
//                                                                console.log("new");
//                                                                this.audio = new Media(file, this.log_success, this.log_error);
//                                                                this.audio.play();
//                                                            } else { // else play current audio
//                                                                console.log("old");
//                                                                // Play audio
//                                                                this.audio.play();
//                                                            }

//                                                            alert("play")
                                                        };
                                                        
                                                        this.play_and_get_duration = function(file, callback){ //used to play new file
                                                            if(this.audio !== null){this.audio.stop();}
                                                            this.audio = null;
                                                            var _this = this, counter = 0;
                                                            this.audio = new Media(file, this.log_success, this.log_error);
                                                            var normal_duration = this.audio.getDuration();
                                                            if(normal_duration > 0){
                                                                callback(normal_duration);
                                                            }else{
                                                                this.audio.play();this.audio.stop();
                                                                var timerDur = setInterval(function() {
                                                                    counter = counter + 100;
                                                                    if (counter > 2000) {
                                                                        callback(false);
                                                                        clearInterval(timerDur);
                                                                    }
                                                                    var dur = _this.audio.getDuration();
                                                                    if (dur > 0) {
                                                                        if(callback)callback(dur);
                                                                        _this.audio.play();
                                                                        clearInterval(timerDur);
                                                                    }
                                                                }, 100);
                                                            }
                                                        };

                                                        this.pause = function() {
                                                            if (this.audio !== null)
                                                                this.audio.pause();
                                                        };

                                                        this.stop = function() {
                                                            if (this.audio !== null) 
                                                                this.audio.stop();
                                                        };

                                                        this.getPlayTime = function(callback) {
                                                            this.audio.getCurrentPosition(
                                                                    function(pos) {
                                                                        callback(pos);
                                                                    },
                                                                    function(err) {

                                                                    });
                                                        };
                                                        
//                                                        this.getDuration = function(){
//                                                            // synchronous function
//                                                            return this.audio.getDuration();
//                                                        };
                                                        
                                                        this.seekTo = function(pos){ //seek to somewhere
                                                            if (this.audio !== null) 
                                                                return this.audio.seekTo(pos);
                                                        };
                                                        
                                                    }
                                                    extend(VoiceMessage, Files);
                                                    /* Voice_message */

                                                    function Contacts() { //we don't need to store contacts in the DB as they are already saved in the phone!!!!
                                                        Contacts.superclass.constructor.call(this);

                                                        this.filter = function(params, callback) { //method to find contact

                                                            // ANY data format may be like this or not - the main point is that we need Object
//                                                            var params = {
//                                                                email   : "",
//                                                                phone   : ""
//                                                            };

                                                            var q = [], _this = this, result = [];
                                                            for (var el in params) {
                                                                q.push(params[el]); // Object to array
                                                            }
                                                            q.forEach(function(f, i) {
                                                                _this._getContacts(f, function(data) {
                                                                    result.concat(data);
                                                                    if (i == q.length)
                                                                        callback(result);
                                                                });
                                                            });
                                                        };

                                                        this.read = function(callback) { //get all
                                                            this._getContacts(callback);
                                                        };

                                                        this._getContacts = function(filter, callback) { //get all
                                                            var options = new ContactFindOptions(), fields = ["name", "displayName", "nickname", "emails", "phoneNumbers"];
                                                            options.multiple = true;
                                                            //            var fields = ["*"];
                                                            //            var fields = ["id","name", "displayName", "organizations","emails","phoneNumbers","addresses"];
                                                            typeof(filter) == "function" ? callback = filter : options.filter = filter;
                                                            navigator.contacts.find(fields, parseContacts, this.log_error, options);

                                                            function parseContacts(contacts) {
                                                                var result = [];
                                                                if (contacts.length > 0) {
                                                                    contacts.forEach(function(c) {
                                                                        //get name starts
                                                                        var name = "";
                                                                        if (c.displayName != null) {
                                                                            name = c.displayName;
                                                                        } else {
                                                                            for (var i in c.name) {
                                                                                if (c.name[i] != null)
                                                                                    name += c.name[i] + " ";

                                                                            }
                                                                        }
                                                                        //get name ends

                                                                        //get phones starts
//                                                                        var phones = [];
                                                                        var phones = "";
                                                                        if (c.phoneNumbers != null && c.phoneNumbers.length > 0) {
                                                                            c.phoneNumbers.forEach(function(ph, i) {
                                                                                if (ph.value != null)
                                                                                    phones += (i == 0 ? ph.value : " | " + ph.value);
//                                                                                    phones.push(ph.value);
                                                                            });
                                                                        }
                                                                        //get phones ends

                                                                        //get emails starts
//                                                                        var emails = [];
                                                                        var emails = "";
                                                                        if (c.emails != null && c.emails.length > 0) {
                                                                            c.emails.forEach(function(em, i) {
                                                                                if (em.value != null)
                                                                                    emails += (i == 0 ? em.value : " | " + em.value);
//                                                                                    emails.push(em.value);
                                                                            });
                                                                        }
                                                                        //get emails ends
                                                                        result.push({
                                                                            name: name.trim(),
                                                                            phones: phones,
                                                                            emails: emails
                                                                        });
                                                                    });
                                                                }
                                                                callback(result);
                                                            }
                                                        };

                                                    };
                                                    extend(Contacts, Phone);

                                                    return {
                                                        VoiceMessage: new VoiceMessage(),
                                                        Files: new Files(),
                                                        Photos: new Photos(),
                                                        Contacts: new Contacts()
                                                    };




                                                }() // ,
                                                        // PHONEGAP
                                                        // PHONEGAP
                                                        // PHONEGAP

                                            };

                                            return {
                                                //                API     : SERVER.API,
                                                //                DB      : SERVER.DB,
                                                //                SESSION : SERVER.SESSION,
                                                //                PHONE   : SERVER.PHONE,
                                                //                SOCKET  : SERVER.SOCKET
                                                SOCKET: SERVER.SOCKET.init(),
                                                API: SERVER.API,
                                                SESSION: SERVER.SESSION,
                                                DB: SERVER.DB,
//                                                DB: SERVER.DB._init_db(),
                                                // if it is needed to RECREATE DB AND STORAGE 
                                                // uncomment lines below
                                                // than comment again after refresh

//                                                SESSION: SERVER.SESSION._init_storage(1),
//                                                DB: SERVER.DB._init_db(1),
                                                PHONE: SERVER.PHONE

                                            };

                                        }()

                                        );

//                            }
                }