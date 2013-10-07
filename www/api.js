// this file consists of:
// 1) Models section (AppModel function and inside Models ) - have models and methods to comunicate with server and db
// 2) server section:
//    a) API - sync local db sqlite with server
//    b) DB  - makes queries to local sqlite db (also have orm helpers)
//    c) SESSION - (localstorage which saves temporary local data like last-table-sync-time, user-id, company-id etc)
//    d) PHONE - communication to Phonegap API
//      1. Phone - basic class for phonegap API --- all listed below are clildren of this class
//      2. VoiceMessage - API for voice messages
//    e) SOCKET - web-sockets for project and todo chat
//  ALL queries are going to local db and if server connection is esteblished then tables are sync with server
//   - othervise data which needed to be synced is triggerred to sync table and will be synced when connection to server will be esteblished
//
//local DB automaticaly created but to fix something or to reload we can use Models.TEST.INIT() or other methods there -- also see last lines of this file
BROWSER_TEST_VERSION = true;

BROWSER_TEST_VERSION ? onDeviceReady() : document.addEventListener("deviceready", onDeviceReady, false);

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
        server_url: "http://212.8.40.254:5959",
//        server_url: "http://192.168.200.110:3000",
        audio_format: "wav",
        route: function(url) {
            return  this.server_url + this.routes[url];
        },
        root_dir: "BAO"
    };

    var ROUTE = function(url) {
        return  CONFIG.server_url + "/" + CONFIG.routes[url];
    };
    // APPLICATION CONFIGS
    // APPLICATION CONFIGS
    // APPLICATION CONFIGS

    var inited_fs = null;

    if (!BROWSER_TEST_VERSION) {

        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fs) {
            fs.root.getDirectory(CONFIG.root_dir, {create: true, exclusive: false}, function(dir) {

                inited_fs = dir;

                server_start();
            }, function(err1, err2) {
                console.log(err1);
                console.log(err2);
            });
        }, function(err1, err2) {
            console.log(err1);
            console.log(err2);
        });

    } else {
//        alert("BROWSER_TEST_VERSION WITHOUT FS");
        server_start();
    }

    function server_start() {
//        var a = new window.Event("applicationload");

        App_model = function(SERVER) {
            /* Private */
            //            console.log(SERVER)
            var API = SERVER.API,
                    DB = SERVER.DB,
                    SESSION = SERVER.SESSION,
                    PHONE = SERVER.PHONE,
                    SOCKET = SERVER.SOCKET;

            /* Private */

            // Models
            // Models
            // Models
//            return Models = {
            Models = {
                Contacts: {
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
                    invite_via_email: function() {
                        //  request to server
                    },
                    invite_via_sms: function() {
                        //  request to server
                    }
                },
                UsersCounter: {
                    read: function(callback) {
                        callback({count: 100000, validationImage: "src"});
//                        SOCKET.request("counter", {}, function(result) {
//                            
//                        });
                    }

                },
                Partner: {
                    read: function(id, callback) { // if id is specified we get one partner else all partners
                        if (typeof(id) === "function") {// no id
                            callback = id;
                            // all partners
                            DB.select("u.id, u.name, u.pinyin, u.avatar, u.company_id, u.position, u.phoneNum, u.email, u.adress, u.isNewUser, u.QRCode, c.title as company, c.companyAdress");
                            DB.from("xiao_company_partners AS p");
                            DB.join("xiao_users AS u", "u.id = p.user_id");
                            DB.join("xiao_companies AS c", "u.company_id = c.id");
                            DB.where('c.id ="' + SESSION.get("company_id") + '"'); // actually not needed
//                            DB.where('p.user_id ="' + SESSION.get("user_id") + '"');
                            API.read(callback);
                        } else if (id) {
                            // partner by id
                            DB.select("u.id, u.name, u.pinyin, u.avatar, u.company_id, u.position, u.phoneNum, u.email, u.adress, u.isNewUser, u.QRCode, c.title as company, c.companyAdress");
                            DB.from("xiao_users AS u");
                            DB.join("xiao_company_partners AS p", "p.company_id = u.id");
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

                },
                Partner_Groups: {
                    read: function(callback) {  // get all groups NAMES
                        DB.select("g.id, g.name");
                        DB.from("xiao_partner_groups AS g");
                        DB.where('g.creator_id ="' + SESSION.get("user_id") + '"');
                        API.read(callback);
                    },
                    get_group_users: function(id, callback) {
                        DB.select("u.id, u.name, u.pinyin, u.avatar, u.company_id, u.position, u.phoneNum, u.email, u.adress, u.isNewUser, u.QRCode, c.title as company, c.companyAdress");
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
                                            user_id: data.users[i]
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

                },
                User: {
                    update: function(data, callback) {

//                        data = {
//                            name: "Igor",
//                            avatar: "src?sdsd/../fsdfsd",
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
                        callback ?
                                API.update('xiao_users', data, 'id="' + SESSION.get("user_id") + '"', callback) :
                                API.update('xiao_users', data, 'id="' + SESSION.get("user_id") + '"');
                    },
                    read: function(callback) {
                        // get user data
                        DB.select("u.id, u.name, u.pinyin, u.avatar, u.company_id, u.position, u.phoneNum, u.email, u.adress, u.isNewUser, u.QRCode, c.title as company, c.companyAdress");
                        DB.from("xiao_users AS u");
                        DB.left_join("xiao_companies AS c", "u.company_id = c.id");
                        DB.where('u.id ="' + SESSION.get("user_id") + '"');
                        API.row(callback);
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
                        SOCKET.request("login", data, function(result) {
                            console.log(result);
                            if (result !== false) {
                                if (result.user) {
                                    SESSION.set("user_id", result.user.id);
                                    SESSION.set("user_name", result.user.name);
                                    SESSION.set("user_email", result.user.email);
                                    SESSION.set("user_pwd", result.user.pwd);
                                    if (result.user.isNewUser == 1)
                                        API.update("xiao_users", {isNewUser: 0}, 'id="' + result.user.id + '"');
                                    callback({
                                        status: 0,
                                        user: result.user
                                    });
                                } else if (result.error) {
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
                                console.log(data)
                                //offline like this for now in development
                                if (SESSION.get("user_id") && SESSION.get("user_pwd") && SESSION.get("user_name") && SESSION.get("user_email")) {
                                    if (SESSION.get("user_pwd") == md5(data.pwd) && SESSION.get("user_email") == data.email) {
                                        Models.User.read(function(offline_user) {

                                            callback({user: offline_user, status: 0});
                                        });
//                                        callback({
//                                            status: 0
//                                        });
                                    } else {
                                        callback({
                                            status: -1
                                        });
                                    }
                                } else {
                                    callback({
                                        status: -1
                                    });
                                }
                            }
                        });
                    },
                    create: function(data, callback) {
//                        data = {
//                            name: "Igor",
//                            avatar: "src?sdsd/../fsdfsd",
//                            pwd: "testuser_123",
//                            email: "testuser_123",
//                            adress: "testuser_123",
//                            phoneNum: "testuser_123",
//                            position: "testuser_123"
//                        };
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
                    },
                    test_create: function(data, callback) {
                        callback();
//                        var name = _random(4, "new_user");
//                        data = {
//                            name: name,
//                            avatar: _random(4, "avatar_"),
//                            pinyin: "x",
//                            pwd: _random(4, "pwd"),
//                            email: _random(4, "email"),
//                            QRCode: _random(4, "QRCOEDE"),
//                            adress: "testuser_123",
//                            phoneNum: "testuser_123",
//                            position: "testuser_123",
//                            isNewUser: 1,
//                            company_id: 1
//                        };
//
//                        DB.insert('xiao_users', data, function(insert_id) {
//                            SESSION.set("user_id", insert_id);
//                            SESSION.set("user_name", name);
//                            DB.insert('xiao_project_partners', {
//                                project_id: "xiao_projects_8w4bk484&20130916170458",
//                                user_id: insert_id
//                            });
//                            partner_data = {
//                                name: name,
//                                avatar: _random(4, "avatar_"),
//                                pinyin: "x",
//                                pwd: _random(4, "pwd"),
//                                email: _random(4, "email"),
//                                QRCode: _random(4, "QRCOEDE"),
//                                adress: "testuser_123",
//                                phoneNum: "testuser_123",
//                                position: "testuser_123",
//                                isNewUser: 1,
//                                company_id: 1
//                            };
//                            DB.insert('xiao_users', partner_data, function(partner_id) {
//                                DB.insert('xiao_partners', {
//                                    user_id: insert_id,
//                                    partner_id: partner_id
//                                }, callback);
//                                API._sync(['xiao_users', 'xiao_project_partners', 'xiao_partners']);
//                            });
//                        });
//                        API.insert('xiao_users', data, function(insert_id) {
//                            SESSION.set("user_id", insert_id);
//                            SESSION.set("user_name", name);
//                            API.insert('xiao_project_partners', {
//                                project_id: "xiao_projects_8w4bk484&20130916170458",
//                                user_id: insert_id
//                            }, callback);
//                        });
                    }

                },
                VoiceMessage: {
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
                    play: function(id) {
                        var _this = this;
                        if (id == this._last_play_id && this._last_play_path != null) {
                            console.log("PLAY SAME FILE!!!");
                            // if continue to play current media file
                            PHONE.VoiceMessage.play(this._last_play_path);
                        } else {
                            // if new media file
                            // we check db if this file exists in local fs
                            DB.select('pc.id, pc.local_path, pc.server_path');
                            DB.from('xiao_project_comments AS pc');
                            DB.where('pc.id="' + id + '"');
                            DB.row(function(data) {
                                console.log("PLAY data");
                                console.log(data);
                                if (data.local_path != "" && data.local_path != undefined) {
                                    console.log("file exists");
                                    // if this file exists in local db then there is a local path in the db
                                    PHONE.VoiceMessage.play(data['local_path']);
                                    _this._last_play_path = data.local_path;
                                } else {
                                    console.log("no file");
                                    PHONE.VoiceMessage.download(data['server_path'], function(new_local_path) {
                                        console.log("new_local_path");
                                        console.log(new_local_path);
                                        PHONE.VoiceMessage.play(new_local_path);
                                        _this._last_play_path = new_local_path;
                                        DB.update("xiao_project_comments", {local_path: new_local_path}, 'id="' + id + '"');
                                    });
                                    // if local_path is empty we need to download file from server
                                    // and then play
//                                        PHONE.VoiceMessage.play(_this._last_play_path);
                                }
                            });
                            API._clear_tables_to_sync();
                            /*
                             API.read(function(data){
                             console.log(data);
                             if(data.local_path != ""){
                             // if this file exists in local db then there is a local path in the db
                             _this._last_play_path = data.local_path;
                             PHONE.VoiceMessage.play(_this._last_play_path);
                             }else{
                             // if local_path is empty we need to download file from server
                             // and then play
                             PHONE.VoiceMessage.play(_this._last_play_path);
                             }
                             }); */
                            //       Models.Voice.play(path)
                            //    }else{
                            //      Models.File.download(id, function(path){
                            //          Models.Voice.play(path)
                            //      })  
                            //    }
                        }
                    },
                    stop: function() {
                        // probably we will need to pass file name here
                        PHONE.VoiceMessage.stop();
                    },
                    pause: function() {
                        // probably we will need to pass file name here
                        PHONE.VoiceMessage.pause();
                    },
                    save: function() {
                        /* here we save file to db and make try to upload to server */
                    }

                },
                Project: {
                    create: function(data, callback) {
                        // data is following:
//                        data = {
//                            project: {
//                                title: "sssss",
//                                descr: "sssss",
//                                color: "7",
//                                creationTime: new Date().getTime()
//                            }, 
//                            users: ["sdasdaad3232323","sdasdaad3232323sasd"]
//                        };

                        data.project['creator_id'] = SESSION.get("user_id");
                        data.project['company_id'] = SESSION.get("company_id");

                        data.users.push(SESSION.get("user_id"));

                        if (data.project) {
                            API.insert('xiao_projects', data.project, function(insert_id) {
                                if (data.users.length > 0) {
                                    var partners = [];
                                    for (var i in data.users) {
                                        partners.push({
                                            project_id: insert_id,
                                            user_id: data.users[i]
                                        });
                                    }
                                    API.batch_insert('xiao_project_partners', partners, callback);
                                } else {
                                    callback();
                                }
                            });
                        }
                    },
                    read: function(params, callback) {
                        if ("id" in params) {
                            // get inside project page
                            var result = {};
                            API._sync(["xiao_projects", "xiao_project_partners", "xiao_users", "xiao_project_comments", "xiao_companies"], function() {
                                DB.select("p.id, p.level, p.title, p.color, p.creator_id, p.creationTime, p.descr, u.id as uid, u.name, u.pinyin, u.avatar, u.company_id, u.position, u.phoneNum, u.email, u.adress, u.isNewUser, u.QRCode, c.title as company, c.companyAdress, c.creator_id as company_creator_id, pp.isLeader");
                                DB.from("xiao_projects AS p");
                                DB.left_join("xiao_project_partners AS pp", "pp.project_id = p.id");
                                DB.left_join("xiao_users AS u", "u.id = pp.user_id");
                                DB.left_join("xiao_companies AS c", "u.company_id = c.id");
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
                                            unread: 0,
                                            descr: partners[0].descr,
                                            attachments: []
                                        };
                                        project.users = [];
                                        partners.forEach(function(pp) {
                                            project.users.push({
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
                                    make_callback({project: project});
                                });
                                DB.select("p.id, p.level, p.title, p.color, p.creator_id, p.creationTime, p.descr, u.id as uid, u.name, u.pinyin, u.avatar, u.company_id, u.position, u.phoneNum, u.email, u.adress, u.isNewUser, u.QRCode, c.title as company, c.companyAdress, c.creator_id as company_creator_id");
                                DB.from("xiao_projects AS p");
                                DB.left_join("xiao_users AS u", "u.id = p.creator_id");
                                DB.left_join("xiao_companies AS c", "u.company_id = c.id");
                                DB.where('p.id ="' + params.id + '"');

                                DB.row(function(creator) {
                                    var cr_user = {};
                                    if (creator) {
                                        cr_user = {
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
                                    make_callback({creator: cr_user});
                                });

                                DB.select("u.id as uid, u.name, u.pinyin, u.avatar, u.company_id, u.position, u.phoneNum, u.email, u.adress, u.isNewUser, u.QRCode, c.title as company, c.companyAdress, c.creator_id as company_creator_id, pp.isLeader");
                                DB.from("xiao_projects AS p");
                                DB.left_join("xiao_project_partners AS pp", "pp.project_id = p.id");
                                DB.left_join("xiao_users AS u", "u.id = p.creator_id");
                                DB.left_join("xiao_companies AS c", "u.company_id = c.id");
                                DB.where('p.id ="' + params.id + '"');

                                DB.query(function(partners) {
                                    make_callback({users: partners});
                                });

//                                DB.select("pc.id, pc.content, pc.type, pc.server_path, pc.local_path, pc.project_id, pc.user_id, pc.update_time, pc.read, u.id as uid, u.name, u.pinyin, u.avatar, u.company_id, u.position, u.phoneNum, u.email, u.adress, u.isNewUser, u.QRCode, c.title as company, c.companyAdress, c.creator_id as company_creator_id");
//                                DB.from("xiao_project_comments AS pc");
//                                DB.left_join("xiao_users AS u", "u.id = pc.user_id");
//                                DB.left_join("xiao_companies AS c", "u.company_id = c.id");
//                                DB.where('pc.project_id ="' + params.id + '"');
//                                DB.order_by('pc.update_time');
//
//
//                                DB.query(function(messages) {
//                                    var mess_result = [], unread = 0;
//                                    if (messages.length > 0) {
//                                        messages.forEach(function(mess) {
//                                            var leader = mess.isLeader == "1" ? true : false,
//                                                    new_user = mess.isNewUser == "0" ? true : false;
//                                            unread += (mess.read == 0 ? 1 : 0);
//                                            mess_result.push({
//                                                id: mess.id,
//                                                text: mess.content,
//                                                poster: {
//                                                    id: mess.uid,
//                                                    name: mess.name,
//                                                    pinyin: mess.pinyin,
//                                                    avatar: mess.avatar,
//                                                    company: mess.company,
//                                                    companyAdress: mess.companyAdress,
//                                                    position: mess.position,
//                                                    phoneNum: mess.phoneNum,
//                                                    email: mess.email,
//                                                    adress: mess.adress,
//                                                    isNewUser: new_user,
//                                                    isLeader: leader,
//                                                    QRCode: mess.QRCode
//                                                },
//                                                attachment: {
//                                                    id: mess.id,
//                                                    type: mess.type,
//                                                    src: mess.server_path
//                                                },
//                                                praise: [],
//                                                time: mess.update_time,
//                                                type: mess.type
//                                            });
//                                        });
//                                    }
//                                    make_callback({messages: mess_result, unread: unread});
//                                });
                                API._clear_tables_to_sync();
                                function make_callback(data) {

                                    if (data.project) {
                                        result.project = data.project;
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
                                        callback(res);
                                    }
                                }
                            });
                        } else {
                            // get ALL projects page
                            if ("pageIndex" in params && "pageSize" in params) {
                                var result = [];
                                API._sync(["xiao_projects", "xiao_project_partners", "xiao_users", "xiao_project_comments", "xiao_companies"], function() {
                                    DB.select("p.id, p.level, p.title, p.color, p.creator_id, p.creationTime, p.descr, u.id as uid, u.name, u.pinyin, u.avatar, u.company_id, u.position, u.phoneNum, u.email, u.adress, u.isNewUser, u.QRCode, c.title as company, c.companyAdress, c.creator_id as company_creator_id");
                                    DB.from("xiao_project_partners AS pp");
                                    DB.left_join("xiao_projects AS p", "pp.project_id = p.id");
                                    DB.left_join("xiao_users AS u", "u.id = p.creator_id");
                                    DB.left_join("xiao_companies AS c", "u.company_id = c.id");
                                    DB.where('pp.user_id = "' + SESSION.get("user_id") + '"');
                                    DB.limit(params.pageSize, (params.pageIndex - 1) * params.pageSize);

                                    DB.query(function(projects) {
                                        if (projects.length > 0) {
                                            projects.forEach(function(pr) {

                                                DB.select("u.id as uid, u.name, u.pinyin, u.avatar, u.company_id, u.position, u.phoneNum, u.email, u.adress, u.isNewUser, u.QRCode, c.title as company, c.companyAdress, c.creator_id as company_creator_id, pp.isLeader");
                                                DB.from("xiao_projects AS p");
                                                DB.left_join("xiao_project_partners AS pp", "pp.project_id = p.id");
                                                DB.left_join("xiao_users AS u", "u.id = p.creator_id");
                                                DB.left_join("xiao_companies AS c", "u.company_id = c.id");
                                                DB.where('p.id ="' + pr.id + '"');

                                                DB.query(function(partners) {

                                                    DB.select("COUNT(pc.read) as unread");
                                                    DB.from("xiao_project_comments AS pc");
                                                    DB.where('pc.project_id ="' + pr.id + '"');
                                                    DB.where('pc.read ="0"');
                                                    DB.group_by('pc.read');

                                                    DB.col(function(unread) {
                                                        result.push({
                                                            id: pr.id,
                                                            level: pr.level,
                                                            title: pr.title,
                                                            color: pr.color,
                                                            creationTime: pr.creationTime,
                                                            unread: unread,
                                                            descr: pr.descr,
                                                            lastMessage: "12345",
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
                                                        if (result.length == projects.length) {
                                                            callback({
                                                                projects: result,
                                                                pageIndex: params.pageIndex,
                                                                pageSize: params.pageSize,
                                                                emptyFolders: params.pageSize - projects.length
                                                            });
                                                        }
                                                    });

                                                    API._clear_tables_to_sync();
                                                });
                                                API._clear_tables_to_sync();
                                            });
                                        } else {
                                            callback({
                                                projects: [],
                                                pageIndex: params.pageIndex,
                                                pageSize: params.pageSize,
                                                emptyFolders: params.pageSize - projects.length
                                            });
                                        }
                                    });
                                    API._clear_tables_to_sync();

                                });
                            }
                        }

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
                        ;
                    }

                },
                ProjectChat: {
                    _inited_chats: [],
                    chat_init: function(project_id, callback) {

                        // existing messages
                        DB.select("pc.id, pc.content, pc.type, pc.server_path, pc.local_path, pc.project_id, pc.user_id, pc.update_time, pc.read, u.id as uid, u.name, u.pinyin, u.avatar, u.company_id, u.position, u.phoneNum, u.email, u.adress, u.isNewUser, u.QRCode, c.title as company, c.companyAdress, c.creator_id as company_creator_id");
                        DB.from("xiao_project_comments AS pc");
                        DB.left_join("xiao_users AS u", "u.id = pc.user_id");
                        DB.left_join("xiao_companies AS c", "u.company_id = c.id");
                        DB.where('pc.project_id ="' + project_id + '"');
                        DB.order_by('pc.update_time');
                        var login_user = SESSION.get("user_id");
//                        DB.query(function(messages) {
                        API.read(function(messages) {
                            var mess_result = [], unread = 0;
                            if (messages.length > 0) {
                                messages.forEach(function(mess) {
                                    unread += (mess.read == 0 ? 1 : 0);
                                    mess_result.push({
                                        id: mess.id,
                                        text: mess.content,
                                        poster: {
                                            id: mess.uid,
                                            name: mess.name,
                                            pinyin: mess.pinyin,
                                            avatar: mess.avatar,
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
                                            src: mess.server_path
                                        },
                                        praise: [],
                                        time: mess.update_time,
                                        type: mess.type
                                    });
                                });
                            }
                            console.log(mess_result)
                            callback(mess_result);
//                            make_callback({messages: mess_result, unread: unread});
                        });


                        // new cooming messages
//                        if (this._inited_chats.lastIndexOf(project_id) === -1)
                        SOCKET.updatechat({type: "project", id: project_id}, function(socket_messages) { // new messages ARRAY
                            console.log("UPDATE CHAT EVENT");
                            var in_m = "";
                            socket_messages.forEach(function(m, i) {
                                in_m += (i != 0 ? "," : "");
                                in_m += '"' + m.id + '"';
                            });
                            DB.select("pc.id, pc.content, pc.type, pc.server_path, pc.local_path, pc.project_id, pc.user_id, pc.update_time, u.id as uid, u.name, u.pinyin, u.avatar, u.company_id, u.position, u.phoneNum, u.email, u.adress, u.isNewUser, u.QRCode, c.title as company, c.companyAdress, c.creator_id as company_creator_id");
                            DB.from("xiao_project_comments AS pc");
                            DB.join("xiao_users AS u", "u.id = pc.user_id");
                            DB.join("xiao_companies AS c", "u.company_id = c.id");
                            DB.where('pc.id IN (' + in_m + ')');
                            DB.order_by('pc.update_time');
                            API._clear_tables_to_sync();
                            DB.query(function(messages) {
                                var mess_result = [];
                                messages.forEach(function(mess) {
//                                    var leader = mess.company_creator_id == mess.uid ? true : false,
//                                            new_user = mess.isNewUser == 0 ? true : false;
                                    mess_result.push({
                                        id: mess.id,
                                        text: mess.content,
                                        poster: {
                                            id: mess.uid,
                                            name: mess.name,
                                            pinyin: mess.pinyin,
                                            avatar: mess.avatar,
                                            company: mess.company,
                                            companyAdress: mess.companyAdress,
                                            position: mess.position,
                                            phoneNum: mess.phoneNum,
                                            email: mess.email,
                                            adress: mess.adress,
                                            isNewUser: mess.isNewUser,
//                                            isLeader: leader,
                                            QRCode: mess.QRCode
                                        },
                                        attachment: {
                                            id: mess.id,
                                            type: mess.type,
                                            src: mess.server_path
                                        },
                                        praise: [],
                                        time: mess.update_time,
                                        type: mess.type
                                    });
                                });
                                callback(mess_result);
                            });

                        });
                    },
                    send_message: function(message, callback) {
                        console.log("sending mesage...");
                        message['user_id'] = SESSION.get("user_id"); // push user_id to message data
                        API.insert("xiao_project_comments", message, function(insert_id) {
                            message['id'] = insert_id;
                            console.log('API.insert("xiao_project_comments"');
                            console.log(message);
                            callback(message);
                        });
//                        alert(SESSION.get("user_id"));
                    }

                },
                Todo: {
                    create: function(todo, callback) {
//                        var todo = {
//                            color : 1, // number : from 0 to 5(0 : orange, 1 : tan, 2 : cyan, 3 : blue, 4 : henna, 5 : purple)
//                            title : "sss",
//                            descr : "aaa",
//                            endTime : new Date().getTime(),
//                            user_id : 4, // performer
//                            project_id : "201310011115357d1e32i5_xiao_projects"
//                        };

                        todo.creator_id = SESSION.get("user_id");

                        API.insert("xiao_todos", todo, function(insert_id) {
                            todo.id = insert_id;
                            if (callback)
                                callback(todo);
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
                                DB.select();
                                DB.from("xiao_todos as t");
                                DB.where('t.project_id = "' + params.project_id + '"');
                                DB.where('t.user_id = "' + SESSION.get("user_id") + '"');
                                DB.where('t.finished = "0"');
                                DB.query(function(todos) {
                                    make_callback({uncompleted: todos});
                                });
                                DB.select();
                                DB.from("xiao_todos as t");
                                DB.where('t.project_id = "' + params.project_id + '"');
                                DB.where('t.user_id = "' + SESSION.get("user_id") + '"');
                                DB.where('t.finished = "1"');
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
                            DB.select();
                            DB.from("xiao_todos AS t");
//                            DB.where('t.user_id = "'+SESSION.get("user_id")+'"');
                            DB.where('t.id = "' + params.id + '"');
//                            API.row(callback);
                            API.row(function(data) {
                                console.log(data);
                                data.attachments = [];
                                data.messages = [];
                                callback(data);
                            });
                        }
                    },
                    update: function(id, data, callback) {

                    },
                    done: function(id, callback) {

                    }

                },
                TodoChat: {
                    chat_init: function(project_id, callback) {

                        // existing messages
                        DB.select("tc.id, tc.content, tc.type, tc.server_path, tc.local_path, tc.todo_id, tc.user_id, tc.update_time, tc.read, u.id as uid, u.name, u.pinyin, u.avatar, u.company_id, u.position, u.phoneNum, u.email, u.adress, u.isNewUser, u.QRCode, c.title as company, c.companyAdress, c.creator_id as company_creator_id");
                        DB.from("xiao_todo_comments AS tc");
                        DB.left_join("xiao_users AS u", "u.id = tc.user_id");
                        DB.left_join("xiao_companies AS c", "u.company_id = c.id");
                        DB.where('tc.todo_id ="' + project_id + '"');
                        DB.order_by('tc.update_time');
                        var login_user = SESSION.get("user_id");
//                        DB.query(function(messages) {
                        API.read(function(messages) {
                            var mess_result = [], unread = 0;
                            if (messages.length > 0) {
                                messages.forEach(function(mess) {
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
                                            avatar: mess.avatar,
                                            company: mess.company,
                                            companyAdress: mess.companyAdress,
                                            position: mess.position,
                                            phoneNum: mess.phoneNum,
                                            email: mess.email,
                                            adress: mess.adress,
                                            isNewUser: mess.isNewUser,
                                            isLoginUser: login_user === mess.uid,
//                                            isLeader: mess.isLeader,
                                            QRCode: mess.QRCode
                                        },
                                        attachment: {
                                            id: mess.id,
                                            type: mess.type,
                                            src: mess.server_path
                                        },
                                        praise: [],
                                        time: mess.update_time,
                                        type: mess.type
                                    });
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
                            DB.select("tc.id, tc.content, tc.type, tc.server_path, tc.local_path, tc.todo_id, tc.user_id, tc.update_time, u.id as uid, u.name, u.pinyin, u.avatar, u.company_id, u.position, u.phoneNum, u.email, u.adress, u.isNewUser, u.QRCode, c.title as company, c.companyAdress, c.creator_id as company_creator_id");
                            DB.from("xiao_todo_comments AS tc");
                            DB.join("xiao_users AS u", "u.id = tc.user_id");
                            DB.join("xiao_companies AS c", "u.company_id = c.id");
                            DB.where('tc.id IN (' + in_m + ')');
                            DB.order_by('tc.update_time');
                            API._clear_tables_to_sync();
                            DB.query(function(messages) {
                                var mess_result = [];
                                messages.forEach(function(mess) {
//                                    var leader = mess.company_creator_id == mess.uid ? true : false,
//                                            new_user = mess.isNewUser == 0 ? true : false;
                                    mess_result.push({
                                        id: mess.id,
                                        text: mess.content,
                                        poster: {
                                            id: mess.uid,
                                            name: mess.name,
                                            pinyin: mess.pinyin,
                                            avatar: mess.avatar,
                                            company: mess.company,
                                            companyAdress: mess.companyAdress,
                                            position: mess.position,
                                            phoneNum: mess.phoneNum,
                                            email: mess.email,
                                            adress: mess.adress,
                                            isNewUser: mess.isNewUser,
//                                            isLeader: leader,
                                            QRCode: mess.QRCode
                                        },
                                        attachment: {
                                            id: mess.id,
                                            type: mess.type,
                                            src: mess.server_path
                                        },
                                        praise: [],
                                        time: mess.update_time,
                                        type: mess.type
                                    });
                                });
                                callback(mess_result);
                            });

                        });

                    },
                    send_message: function(message, callback) {
                        console.log("sending mesage...");
                        message['user_id'] = SESSION.get("user_id"); // push user_id to message data
                        API.insert("xiao_todo_comments", message, function(insert_id) {
                            message['id'] = insert_id;
                            console.log('API.insert("xiao_todo_comments"');
                            console.log(message);
                            callback(message);
                        });
//                        alert(SESSION.get("user_id"));
                    }

                },
                Calendar: {
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

                }
            };
            // Models
            // Models
            // Models 


//            window.dispatchEvent(a);

        }(
                // PRIVATE
                        // PRIVATE
                                // PRIVATE
                                        function() {
                                            //            var SERVER = {
                                            SERVER = {
                                                SOCKET: {
                                                    socket: null,
                                                    init: function() {
                                                        this.socket = io.connect(ROUTE("sockets"));
                                                        this.socket.on('connect_failed', function() {
                                                            console.log("fail");
                                                            console.log("fail");
                                                            console.log("fail");
                                                        });
                                                        return this;
                                                    },
                                                    sync: function(data, callback) {
//                                                        var sockets_route = (ROUTE('sockets').match(/\/$/) ? ROUTE('sockets').substring(0, ROUTE('sockets').length - 1) : ROUTE('sockets'));
//                                                        data.connection_code = this.connection_code();
//                                                        this.socket.emit("sync", data);
//                                                        io.sockets[sockets_route].open === false ? callback(false) : "";
//                                                        this.socket.on("sync_result" + data.connection_code, callback);

                                                        this.request("sync", data, callback);
                                                    },
                                                    // connection code is used to make application safe from double socket events
                                                    // normally they shouldn't appear
                                                    connection_code: function() {
                                                        return _random(12, _random(3, "_ccode"));
                                                    },
                                                    _inited_chats: {
                                                        project: [],
                                                        todo: []
                                                    },
                                                    updatechat: function(connect_data, callback) { // in data we specify id and type
                                                        console.log(connect_data)
                                                        console.log(typeof(connect_data.id))
                                                        console.log(this._inited_chats[connect_data['type']].lastIndexOf(connect_data.id))
                                                        if (connect_data.id && this._inited_chats[connect_data['type']].lastIndexOf(connect_data.id) === -1) {
                                                            console.log("update chat INITED");
                                                            this._inited_chats[connect_data['type']].push(connect_data.id);
                                                            console.log(this._inited_chats)
                                                            this.socket.emit('addroom', connect_data);
                                                            this.socket.on("updatechat", function(data) { // data just contain message that we need to sync DB
                                                                console.log("updatechat data");
                                                                console.log(data);
//                                                            SERVER.DB.batch_insert_with_id("xiao_project_comments", data, function() {
                                                                SERVER.DB.batch_insert_or_ignore_with_id("xiao_project_comments", data, function() {
                                                                    callback(data);
                                                                });
                                                            });
                                                        }
                                                    },
                                                    request: function(url, data, callback) {
                                                        var connection_code = this.connection_code();
                                                        this.socket.emit(url, {
                                                            body: data,
                                                            connection_code: connection_code
                                                        });
                                                        var sockets_route = (ROUTE('sockets').match(/\/$/) ? ROUTE('sockets').substring(0, ROUTE('sockets').length - 1) : ROUTE('sockets'));
                                                        this.socket.on(url + "_result" + connection_code, callback);
                                                        io.sockets[sockets_route].open === false ? callback(false) : this.socket.on(url + data.connection_code, callback);
                                                    }

                                                },
                                                // DB        
                                                // DB        
                                                // DB
                                                DB: function(db) {


                                                    return {
                                                        _sql: "",
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
                                                        group_by: function(group) {
                                                            return this._sql += ' ORDER BY ' + group;
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
                                                                callback(data[0]);
                                                            });
                                                        },
                                                        col: function(callback) {
                                                            // return one col
                                                            this._executeSQL(this._sql + ' LIMIT 1', function(data) {
                                                                for (var i in data[0]) {
                                                                    callback(data[0][i]);
                                                                    return;
                                                                }
                                                            });
                                                        },
                                                        _executeSQL: function(sql, callback) {
//                                                            console.log(sql);
                                                            function querySuccess(tx, results) {
                                                                var len = results.rows.length, db_result = [];
                                                                for (var i = 0; i < len; i++) {
                                                                    db_result[i] = results.rows.item(i);
                                                                }

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
                                                        _make_id: function(table) {
                                                            return _random(8, "_" + table);
                                                        },
                                                        _init_tables: ['xiao_company_partners', 'xiao_projects', 'xiao_users', 'xiao_project_partners',
                                                            'xiao_partner_groups', 'xiao_partner_group_users', 'xiao_project_comments',
                                                            'xiao_companies', 'xiao_todos', 'xiao_todo_comments'],
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
                                                                tx.executeSql('CREATE TABLE IF NOT EXISTS xiao_projects(\n\
                                                                    server_id VARCHAR(255) NULL,\n\
                                                                    id VARCHAR(255) NOT NULL,\n\
                                                                    creator_id INTEGER NULL,\n\
                                                                    title VARCHAR(255) NOT NULL,\n\
                                                                    descr TEXT NULL,\n\
                                                                    color INTEGER NULL,\n\
                                                                    level VARCHAR(255) NULL,\n\
                                                                    update_time varchar(255) NULL,\n\
                                                                    creationTime varchar(255) NULL,\n\
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
                                                                    avatar varchar(255) NULL,\n\
                                                                    pinyin varchar(255) NULL,\n\
                                                                    QRCode varchar(255) NULL,\n\
                                                                    adress varchar(255) NULL,\n\
                                                                    phoneNum varchar(255) NULL,\n\
                                                                    position varchar(255) NULL,\n\
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
                                                                    update_time TIMESTAMP NULL DEFAULT NULL,\n\
                                                                    read INTEGER DEFAULT 0,\n\
                                                                    deleted INTEGER DEFAULT 0,\n\
                                                                    company_id INTEGER NOT NULL DEFAULT ' + SERVER.SESSION.get("company_id") + ',\n\
                                                                    UNIQUE(id))'
                                                                        );

                                                                //                                tx.executeSql('CREATE TABLE IF NOT EXISTS xiao_project_comment_adds (\n\
                                                                //                                                server_id VARCHAR(255) NULL,\n\
                                                                //                                                id varchar(255) NOT NULL,\n\
                                                                //                                                comment_id VARCHAR(255) NULL,\n\
                                                                //                                                type VARCHAR(255) NULL,\n\
                                                                //                                                server_path TEXT NULL,\n\
                                                                //                                                local_path TEXT NULL,\n\
                                                                //                                                update_time DATETIME,\n\
                                                                //                                                company_id VARCHAR(255) NOT NULL DEFAULT '+SERVER.SESSION.get("company_id")+',\n\
                                                                //                                                UNIQUE(id))'
                                                                //                                );

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
                                                                    _this._init_tables.forEach(function(cur) {
                                                                        var sql = 'CREATE TRIGGER update_' + cur + ' AFTER UPDATE ON ' + cur + ' FOR EACH ROW BEGIN INSERT INTO sync(table_name, row_id) VALUES("' + cur + '", NEW.id); END; ';
                                                                        tx.executeSql(sql);
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
                                                    _tables_to_sync: [],
                                                    _clear_tables_to_sync: function(table) {
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
                                                        //                        console.log(SERVER.DB);
                                                        // WHEN READ sync first then EXECUTE SQL
                                                        this._sync(this._tables_to_sync, function() {
                                                            SERVER.DB.query(callback);
                                                        });
                                                    },
                                                    row: function(callback) {
                                                        //                      // return one row
                                                        this._sync(this._tables_to_sync, function() {
                                                            SERVER.DB.row(callback);
                                                        });
                                                    },
                                                    col: function(callback) {
                                                        //                      // return one row
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
                                                            return (
                                                                    callback ? _this._sync([table], function() {
                                                                callback();
                                                            }) : _this._sync([table])
                                                                    );
                                                        });

                                                    },
                                                    /* END methods to make queries to DB object */
                                                    /* END methods to make queries to DB object */
                                                    /* END methods to make queries to DB object */

//                        _sync    :   function(tables, callback){
//                            var sync_data = [], _this = this, user_data = SERVER.SESSION.local_data();
//                            tables.forEach(function(table_name, table_num){
//                                if(table_name  == "xiao_project_comments" || table_name == "xiao_todo_comments" ){
//                                    _this._sync_chat(table_name);
//                                }else{
//                                    var sql= 'SELECT * FROM sync as s INNER JOIN '+table_name+' as t ON s.row_id = t.id WHERE s.table_name ="'+table_name+'"';
//                                    SERVER.DB._executeSQL(sql, function(data){
//                                        sync_data.push({
//                                            name        :   table_name,
//                                            last_sync   :   SERVER.SESSION._get_sync_time(table_name),
//                                            updated     :   data, // move here
//                                            deleted     :   []
//                                        });
//                                        if(table_num == (tables.length-1)){
//                                            _this._tables_to_sync = []; // new // for now here
//                                            // if this is the last table needed to be synced
//                                            _this._request( CONFIG.route("sync"),
//                                            {
//                                                tables  :   sync_data,
//                                                info    :   user_data
//                                            },
//                                            function(server){
//                                                console.log(server);
//                                                if(server){
//                                                    console.log("server");
//                                                    var changes = server.response;
//                                                    changes.forEach(function(ij, num){
//                                                         // apply changes
//                                                        if( (ij.updated && ij.updated.length > 0) ||
//                                                            (ij.deleted && ij.deleted.length > 0)
//                                                        ){
//                                                            //if need to UPDATE or CREATE something  ~~~ GOES IN ONE METHOD with replace
//                                                            if(ij.updated.length > 0){
//                                                                // need remove
//                                                                // need remove
//                                                                // need remove
//                                                        /*        if(ij.table == "xiao_project_comments"){
//                                                                    SERVER.DB.insert_batch_on_duplicate_update(ij.table, ij.updated, function(data){
//                                                                        _this._sync_clear(ij.table,  server.info.time);
//                                                                        if( num == (changes.length-1) ){
//                                                                            return (callback ? callback() : true);
//                                                                        }
//                                                                    });
//                                                                // need remove
//                                                                // need remove
//                                                                // need remove
//                                                                }else{ */
//                                                                    SERVER.DB.batch_replace(ij.table, ij.updated, function(data){
//                                                                        _this._sync_clear(ij.table,  server.info.time);
//                                                                        if( num == (changes.length-1) ){
//                                                                            return (callback ? callback() : true);
//                                                                        }
//                                                                    });
////                                                                }
//                                                            }
//                                                        }else{
//                                                            if(num == (changes.length-1)){
//                                                                console.log(tables);
//                                                                _this._sync_clear(ij.table,  server.info.time);
//                                                                return (callback ? callback() : true);
//                                                            }
//                                                        }
//                                                    });
//                                                }else{
//                                                    console.log("no server");
//                                                    return (callback ? callback() : false);
//                                                }
//                                            });
//                                        }
//                                    });
//                                }
//                            });
//                        },


                                                    _check_local_DB_and_fs: function(table_name, callback) {
                                                        var result = {},
                                                                sql = 'SELECT * FROM sync as s INNER JOIN ' + table_name + ' as t ON s.row_id = t.id WHERE s.table_name ="' + table_name + '"',
                                                                sql_del = 'SELECT * FROM sync_delete WHERE table_name ="' + table_name + '"';
                                                        SERVER.DB._executeSQL(sql, function(data) {
                                                            if (table_name == "xiao_project_comments" || table_name == "xiao_todo_comments") {
                                                                data.length > 0 ? data.forEach(function(el, i) {
                                                                    // if audio we need to proceed uload 
                                                                    if (el.type == "audio") {
                                                                        SERVER.PHONE.VoiceMessage.upload(el.local_path, "audio", function(server_path) {
                                                                            data[i].server_path = server_path;
                                                                            var new_data = data[i];
                                                                            var datadata = {};
                                                                            for (var ijk in new_data) {
                                                                                datadata[ijk] = new_data[ijk];
                                                                            }
                                                                            datadata['server_path'] = server_path;
                                                                            make_callback({updated: [datadata]});
                                                                        });
                                                                    } else if (el.type == "text") {
                                                                        if (i == (data.length - 1)) {
                                                                            make_callback({updated: data});
                                                                        }
                                                                    }
                                                                    // filter removing local_path from array

                                                                }) : make_callback({updated: data});
                                                            } else {
                                                                make_callback({updated: data});
                                                            }

                                                        });

                                                        SERVER.DB._executeSQL(sql_del, function(del_data) {
                                                            make_callback({deleted: del_data});
                                                        });

                                                        function make_callback(data) {

                                                            if (data.updated) {
                                                                result.updated = data.updated;
                                                            }

                                                            if (data.deleted) {
                                                                result.deleted = data.deleted;
                                                            }

                                                            if (result.deleted && result.updated) {
                                                                callback({
                                                                    name: table_name,
                                                                    last_sync: SERVER.SESSION._get_sync_time(table_name),
                                                                    updated: result.updated, // move here
                                                                    deleted: result.deleted
                                                                });
                                                            }
                                                        }
                                                    },
                                                    _sync: function(tables, callback) {
                                                        var sync_data = [], _this = this;
                                                        tables.forEach(function(table_name, table_num) {
                                                            _this._check_local_DB_and_fs(table_name, function(data) {
                                                                sync_data.push(data);
                                                                if (table_num == (tables.length - 1)) {
                                                                    callback ? _this._make_socket_request(sync_data, callback) : _this._make_socket_request(sync_data);
                                                                }
                                                            });
                                                        });
                                                    },
                                                    _make_socket_request: function(sync_data, callback) {
                                                        var _this = this;
                                                        this._tables_to_sync = [];
                                                        console.log("SERVER REQUEST: ");
                                                        console.log(sync_data);
                                                        SERVER.SOCKET.sync({
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
                                                                            if (ij.table == "xiao_project_comments" || ij.table == "xiao_todo_comments") {
                                                                                SERVER.DB.insert_batch_on_duplicate_update(ij.table, ij.updated, function() {
                                                                                    make_callback();
                                                                                });
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
                                                    /*         _sync_chat  : function(table, callback){
                                                     console.log("_sync_chat");
                                                     // this method is used to send new data to server
                                                     // and to pull new data from server_db to local_db
                                                     //                            SERVER.DB.select('pc.id, pc.content, pc.type, pc.local_path, pc.project_id, pc.user_id, pc.update_time, pc.company_id');
                                                     var info = {
                                                     table_name  :   table,
                                                     last_sync   :   SERVER.SESSION._get_sync_time(table),
                                                     user_data   :   SERVER.SESSION.local_data()
                                                     }, _this = this,
                                                     //                            SERVER.DB.select();
                                                     //                            SERVER.DB.from("sync as s");
                                                     //                            SERVER.DB.join(table+" as pc", "pc.id = s.row_id");
                                                     //                            SERVER.DB.where('s.table_name = "'+table+'"');
                                                     //                            SERVER.DB.query(function(data){
                                                     sql = 'SELECT * FROM sync as s INNER JOIN '+table+' as pc ON s.row_id = pc.id WHERE s.table_name ="'+table+'"';
                                                     SERVER.DB._executeSQL(sql, function(data){
                                                     console.log("inside sync_chat callback");
                                                     data.length > 0 ? data.forEach(function(el, i){
                                                     // if audio we need to proceed uload 
                                                     if(el.type == "audio"){
                                                     SERVER.PHONE.VoiceMessage.upload(el.local_path, "audio", function(server_path){
                                                     data[i].server_path = server_path;
                                                     delete data[i].local_path;
                                                     //                                            el.server_path = server_path;
                                                     //                                            delete el.local_path;
                                                     if(i == (data.length-1)){
                                                     SERVER.SOCKET.sync_chat({messages:data, info: info}, function(server){
                                                     SERVER.DB.insert_batch_on_duplicate_update(table, server.responce, function(){
                                                     _this._sync_clear(table,  server.info.time);
                                                     return (callback ? callback() : true);
                                                     });
                                                     }); 
                                                     }
                                                     });
                                                     }else if(el.type == "text"){
                                                     if(i == (data.length-1)){
                                                     SERVER.SOCKET.sync_chat({messages:data, info: info}, function(server){
                                                     SERVER.DB.insert_batch_on_duplicate_update(table, server.responce, function(){
                                                     _this._sync_clear(table,  server.info.time);
                                                     return (callback ? callback() : true);
                                                     });
                                                     }); 
                                                     }
                                                     }
                                                     // filter removing local_path from array
                                                     
                                                     }) : SERVER.SOCKET.sync_chat({messages:data, info: info}, function(server){
                                                     console.log("empty sync chat callback");
                                                     console.log(server);
                                                     SERVER.DB.insert_batch_on_duplicate_update(table, server.responce, function(){
                                                     _this._sync_clear(table,  server.info.time);
                                                     return (callback ? callback() : true);
                                                     });
                                                     });
                                                     });
                                                     //                            this._clear_tables_to_sync(table);
                                                     }, */

                                                    _sync_clear: function(table, time) {
                                                        SERVER.DB._executeSQL('DELETE FROM sync WHERE table_name = "' + table + '"');
                                                        SERVER.SESSION._update_sync_time(table, time);
                                                    },
                                                    _sync_delete_clear: function(table, time) {
                                                        if (table) {
                                                            SERVER.DB._executeSQL('DELETE FROM sync_delete WHERE table_name = "' + table + '"');
                                                        } else {
                                                            SERVER.DB._executeSQL('DELETE FROM sync_delete');
                                                        }
//                                                        SERVER.SESSION._update_sync_time(table, time);
                                                    }

                                                    /*             _request : function(url, params, callback){
                                                     
                                                     $.post(url, params, function(data){
                                                     if(data){
                                                     console.log("server");
                                                     callback(data);
                                                     }else{
                                                     console.log("NO server");
                                                     callback([]);
                                                     }
                                                     //                            callback(data);
                                                     }).fail(function() { console.log("NO SERVER"); callback(false); });
                                                     /*
                                                     var self = this;
                                                     var data = new FormData();
                                                     data.append('user', 'person');
                                                     
                                                     var XHR = new window.XMLHttpRequest(),
                                                     data = JSON.stringify(params);
                                                     //                        console.log(data)
                                                     XHR.overrideMimeType = 'application/json;charset=UTF-8';
                                                     XHR.open("POST", url, true);
                                                     XHR.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                                                     XHR.onreadystatechange = function () {
                                                     var serverAnswer;
                                                     if(4 === XHR.readyState) {
                                                     try {
                                                     serverAnswer = JSON.parse(XHR.responseText);
                                                     } catch(e) {
                                                     serverAnswer = XHR.responseText;
                                                     }
                                                     //                                self.log('Server answered: ');
                                                     //                                self.log(serverAnswer);
                                                     //I want only json/object as response
                                                     if(XHR.status == 200 && serverAnswer instanceof Object) {
                                                     console.log(serverAnswer);
                                                     callback(serverAnswer);
                                                     } else {
                                                     serverAnswer = {
                                                     result : 'ERROR',
                                                     status : XHR.status,
                                                     message : XHR.statusText
                                                     };
                                                     console.log(serverAnswer);
                                                     callBack(serverAnswer);
                                                     }
                                                     }
                                                     };
                                                     
                                                     XHR.send(data);
                                                     */
                                                },
                                                // API
                                                // API
                                                // API

                                                // Storage
                                                // Storage
                                                // Storage
                                                SESSION: function(storage) {

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
                                                        _init_storage: function(clear) {
                                                            var _this = this,
//                                    test_user_id = (this.get("user_id") ? this.get("user_id") : "dsadasdas1212312");
                                                                    test_user_id = "dsadasdas1212312";
                                                            this.clear();
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


                                                    }
                                                    ;
                                                    /* PARENT */
                                                    

                                                    function Files() {
                                                        Files.superclass.constructor.call(this);
                                                        this.fs = inited_fs; // see the start of this file
                                                        this.file_path = null;
                                                        this.short_name = null;

                                                        this._create_file = function(after, callback) {
                                                            var _this = this, new_file_name = _random(5, after);
                                                            new_file_name += (/\.[A-Za-z0-9]+$/.test(after) ? "" : "." + CONFIG.audio_format); // if file name dpn't have format we specify it
                                                            this.fs.getFile(new_file_name, {create: true, exclusive: false}, function(fileEntry) {
                                                                _this.file_path = fileEntry.fullPath;
                                                                _this.short_name = fileEntry;
                                                                callback(fileEntry.fullPath);
                                                            }, _this.log_error);
                                                        };

                                                        this.download = function(server_path, callback) {

                                                            var fileTransfer = new FileTransfer(),
                                                                    uri = encodeURI(server_path),
                                                                    new_file_name = server_path.substring(server_path.lastIndexOf('/') + 1);
                                                            console.log("donwloading");
                                                            console.log(new_file_name);
                                                            console.log(uri);
                                                            this._create_file(new_file_name, function(local_path) {
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

                                                        this.upload = function(local_path, type, callback) {
                                                            // local_path --- is file path in phone local fs
                                                            // type       --- is type of file we want to upload 
                                                            //                              F.E. image or audio
                                                            // mime types:
                                                            // audio/mpeg
                                                            // image/jpeg
                                                            if (!local_path || !type || (type != "image" && type != "audio")) {
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
                                                                case "audio":
                                                                    options.mimeType = "audio/mpeg";
                                                                    break;
                                                            }
                                                            options.params = {type: type};

                                                            ft.upload(local_path, encodeURI(ROUTE("file_upload_url")), function(node_obj) {
                                                                callback(node_obj.response);
                                                            }, fail, options);

                                                            function fail(error) {
                                                                //                                alert("An error has occurred: Code = " + error.code);
                                                                console.log("upload error ");
                                                                console.log(error);
                                                                console.log("upload error source " + error.source);
                                                                console.log("upload error target " + error.target);
                                                                callback();
                                                            }
                                                        };
                                                    }
                                                    extend(Files, Phone);
                                                    
                                                    /* Voice_message */
                                                    function VoiceMessage() {
                                                        VoiceMessage.superclass.constructor.call(this);

                                                        this.audio = null;

                                                        this.last_record_path = null;

                                                        this.record_start = function(callback) {
                                                            var _this = this;
                                                            this._create_file(SERVER.SESSION.get("user_name"), function(file_path) { // callback
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

                                                        this.play = function(file) {
//                                                            alert(file);
                                                            this.audio = null;
                                                            this.audio = new Media(file, this.log_success, this.log_error);
                                                            this.audio.play();

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

                                                        };

                                                        this.pause = function() {
                                                            if (this.audio) {
                                                                this.audio.pause();
                                                            }
                                                        };

                                                        this.stop = function() {
                                                            if (this.audio) {
                                                                this.audio.stop();
                                                            }
                                                        };

                                                        this.getPlayTime = function(callback) {
                                                            this.audio.getCurrentPosition(
                                                                    function(pos) {
                                                                        callback(pos);
                                                                    },
                                                                    function(err) {

                                                                    });
                                                        };

                                                    }
//                                                    extend(VoiceMessage, Phone);
                                                    extend(VoiceMessage, Files);
                                                    /* Voice_message */

                                                    //                    function PhoneFiles(){
                                                    //                        PhoneFiles.superclass.constructor.call(this);
                                                    //                        
                                                    //                        
                                                    //                        
                                                    //                        
                                                    //                    }
                                                    //                    
                                                    //                    extend(PhoneFiles, Phone);

                                                    function Contacts() {
                                                        Contacts.superclass.constructor.call(this);

                                                        this.filter = function(params, callback) {

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

                                                        this.read = function(callback) {
                                                            this._getContacts(callback);
                                                        };

                                                        this._getContacts = function(filter, callback) {
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
                                                                            //                            if (trim(name) == "" && c.nickname != null) {
                                                                            //                                name = c.nickname;
                                                                            //                            }
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
                                                                            name: trim(name),
                                                                            phones: phones,
                                                                            emails: emails
                                                                        });
                                                                    });
                                                                }
                                                                callback(result);
                                                            }
                                                        };

                                                    }
                                                    ;
                                                    extend(Contacts, Phone);

                                                    return {
                                                        VoiceMessage: new VoiceMessage(),
                                                        Files: new Files(),
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
//                                                SESSION: SERVER.SESSION,
//                                                DB: SERVER.DB._init_db(),
                                                // if it is needed to RECREATE DB AND STORAGE 
                                                // uncomment lines below
                                                // than comment again after refresh

                                                SESSION: SERVER.SESSION._init_storage(1),
                                                DB: SERVER.DB._init_db(1),
                                                PHONE: SERVER.PHONE

                                            };

                                        }()

                                        );



//                                init_app(); // start wrapper functon

                            }
                }