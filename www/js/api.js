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

 document.addEventListener("deviceready", onDeviceReady, false);
 
    function onDeviceReady() {
        
        var inited_fs = null;
        
        var CONFIG =    {
            server_url       : "http://212.8.40.254:5959/",
            file_upload_url  : "http://212.8.40.254:5959/upload",
            project_chat_url : "http://212.8.40.254:5959/",
            todo_chat_url    : "http://212.8.40.254:5959/todo",

            route  : function(url){ return  this.server_url+this.routes[url];},

            routes  :   {
                sync    :   "sync"
            },                    
            root_dir    :   "BAO"
        };
        
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fs){
            fs.root.getDirectory(CONFIG.root_dir, { create: true, exclusive: false }, function(dir){

                inited_fs =  dir;
                
                server_start();
//                                    return dir;
//                                    _this.fs = dir;
            }, function(err1, err2){
                console.log(err1);
                console.log(err2);
            });
            }, function(err1, err2){
                console.log(err1);
                console.log(err2);
        });

        function server_start(){
            
        App_model = function(SERVER){
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
            return Models = {

                Partner :  {

                    read : function(){
                        DB.select("u.id, u.name, u.avatar, u.pinyin");
                        DB.from("xiao_partners AS p");
                        DB.join("xiao_users AS u","u.id = p.partner_id");
                        DB.where('p.user_id ="'+ SESSION.get("user_id")+'"');

                        API.read(function(data){
                            console.log(data);
                        });
                    }

                },
                        
                Partner_Groups  :   {
                    
                    read    :   function(){  // get all groups NAMES
                        DB.select("g.id, g.name");
                        DB.from("xiao_partner_groups AS g");
                        DB.where('g.creator_id ="'+ SESSION.get("user_id")+'"');
                        
                        API.read(function(data){
                            console.log(data);
                        });
                    },
                            
                    get_group_users : function(id){
//                        id = "xiao_partner_groups_8l52ai82&20130909085640";

                        DB.select("g.id as group_id, g.name as group_name, u.name, u.avatar, u.pinyin, u.QRCode, u.email, u.adress, u.phoneNum");
                        DB.from("xiao_partner_groups AS g");
                        DB.join("xiao_partner_group_users AS gu","gu.group_id = g.id");
                        DB.join("xiao_users AS u","u.id = gu.user_id");
                        DB.where('g.creator_id ="'+ SESSION.get("user_id")+'"');
                        if(id){DB.where('g.id = "'+id+'"');}
                            
                        API.read(function(data){
                            console.log(data);
                        });
                    },
                            
                    create    : function(data){
                        // data is following:
                        data = {
                            name    :   "Igor_group",
    //                        users   :   [1,2,3,4]
                            users   :   ['sdasdaad3232323']
                        };
                        if(data){
                            API.insert('xiao_partner_groups', {
                                name        :   data.name,
                                creator_id  :   SESSION.get("user_id")
                            }, function(insert_id){
                                console.log(insert_id);
                                if(data.users.length > 0){
                                    var partners=[];
                                    for(var i in data.users){
                                        partners.push({
                                            group_id    :   insert_id,
                                            user_id     :   data.users[i]
                                        });
                                    }
                                    API.batch_insert('xiao_partner_group_users', partners);
                                }
                            });
                        }
                        
                    }

                },

                Project : {

                    create : function(data){
                        // data is following:
                        data = {
                            project: {
                                creator_id: SESSION.get("user_id"),
                                company_id: SESSION.get("company_id"),
                                name: "sssss",
                                description:"sssss",
                                color:"7"
                            },
    //                        project_partners  : [{id:1},{id:2}]  
//                            project_partners  : ["dasdas355656756","dasdf655685790p89gjkfh","dasdser343234","sdasd23424fgghjhgjkg","dfsdfsdhgj56756756"]  
                            project_partners  : ["sdasdaad3232323"]  
                        };

                        if(data.project){
                            API.insert('xiao_projects', data.project, function(insert_id){
                                if(data.project_partners.length > 0){
                                    var partners=[];
                                    for(var i in data.project_partners){
                                        partners.push({
                                            project_id  :   insert_id,
                                            user_id     :   data.project_partners[i]
                                        });
                                    }
                                    API.batch_insert('xiao_project_partners', partners);
                                } 
                            });
                        }
                    },
                    
                    read    : function(id, callback){
                        
                        if(id){ // get inside project page
                        // if id is set we need to get a project page with all comments
                            SESSION.set("project_id", id);
                            API._sync(["xiao_projects","xiao_project_partners","xiao_users", "xiao_project_comments"], function(){
                                
                                DB.select();
                                DB.from("xiao_projects AS p");
                                DB.left_join("xiao_project_partners AS pp", "p.id = pp.project_id");
                                // DB.join("xiao_project_partners AS pp", "p.id = pp.project_id");
                                DB.join("xiao_users AS u", "u.id = pp.user_id");
                                DB.where('p.id ="'+ id +'"');

                                DB.query(function(partners){
                                    callback({partners:partners});
                                });

                                DB.select();
                                DB.from("xiao_projects AS p");
                                DB.join("xiao_project_comments AS pc", "pc.project_id = p.id");
                                DB.where('p.id ="'+ id +'"');
                                DB.order_by('pc.update_time');

                                DB.query(function(chat){
                                    callback({chat:chat});
                                });
                                API._clear_tables_to_sync();
                                /*
                                DB.query(function(partners){
                                    var result = {};
                                    result.partners = partners;
                                    DB.select();
                                    DB.from("xiao_projects AS p");
                                    DB.join("xiao_project_comments AS pc", "pc.project_id = p.id");
                                    DB.where('p.id ="'+ id +'"');
                                    DB.query(function(chat){
                                        result.chat = chat;
                                        console.log(result);
                                        callback(result);
                                    });
                                });
                                */
                            });
                        }else{
                            DB.select();
                            DB.from("xiao_projects AS p");
                            DB.left_join("xiao_project_partners AS pp", "p.id = pp.project_id");
                            // DB.join("xiao_project_partners AS pp", "p.id = pp.project_id");
                            DB.join("xiao_users AS u", "u.id = pp.user_id");
                            API.read(function(data){
                                console.log(data);
                                callback(data);
                            });
                        }
                                    
                        
                    } /*,
                            
                    add_comment     :   function(data){
                        // data is following:
                        data = {
                            type        :   "text",
                            content     :   "test message",
                            project_id  :   "xiao_projects_7Zn8eFu4&20130907155346"
                        };
                        
                        if(data){
                            API.insert("xiao_project_comments", data, function(insert_id){
                                
                            });
                        }
                    } */

                },
                        
                
                
                User :  {
                    
                    update : function(data){
                        
                        data = {
                            name            :   "Igor",
                            avatar          :   "src?sdsd/../fsdfsd",
                            pinyin          :   "x",
                            password        :   "testuser_123",
                            email           :   "testuser_123",
                            QRCode          :   "testuser_123",
                            adress          :   "testuser_123",
                            phoneNum        :   "testuser_123",
                            position        :   "testuser_123",
                            company_id      :   1
                        };
                        
                        API.update('xiao_users', data, 'id="'+SESSION.get("user_id")+'"', function(data){
                            console.log(data);
                        });
                    },
                    
                    read    :   function(){
                        // get user data
                        DB.select();
                        DB.from("xiao_users AS u ");
                        DB.where('u.id = "'+ SESSION.get("user_id")+'"');
                                    
                        API.read(function(data){
                            console.log(data);
                        });
                        
                    },
                            
                    create  : function(data){
                
                data = {
                            name            :   _random(4, "new_user"),
                            avatar          :   _random(4, "avatar_"),
                            pinyin          :   "x",
                            password        :   _random(4, "password"),
                            email           :   _random(4, "email"),
                            QRCode          :   _random(4, "QRCOEDE"),
                            adress          :   "testuser_123",
                            phoneNum        :   "testuser_123",
                            position        :   "testuser_123",
                            company_id      :   1
                        };
                
                        API.insert('xiao_users', data, function(insert_id){
                            SESSION.set("user_id", insert_id);
                        });
                    }

                },
                        
                Todo    :   {
            
                    create  :   function(data){
                        
                    },
                            
                    read     :   function(id){
                        
                    },
                            
                    update   :   function(id, data){
                        
                    }
                
                },
                        
                VoiceMessage    :   {
                    
                    _last_play_id     : null,
                            
                    _last_play_path   : null,
                    
                    _last_record_path : null,
                    
                    record_start    :   function(callback){
                        // we need to return record path
                        var _this = this;
                        PHONE.VoiceMessage.record_start(function(path){
                            console.log(path);
                            _this._last_record_path = path;
                            callback(path);
                        });
                    },
                            
                    record_stop    :   function(){
                        PHONE.VoiceMessage.record_stop();
                    },
                            
                    record_play    : function(){
                        if(this._last_record_path === null){return false;}
                        PHONE.VoiceMessage.record_play(this._last_record_path);
                    },
                            
                    play    : function(id){
                        var _this = this;
                        if(id == this._last_play_id && this._last_play_path){
                            // if continue to play current media file
                            PHONE.VoiceMessage.play(this._last_play_path);
                        }else{
                            // if new media file
                            // we check db if this file exists in local fs
                            DB.select('pc.id, pc.local_path, pc.server_path');
                            DB.from('xiao_project_comments AS pc');
                            DB.where('pc.id="'+id+'" ');
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
                            });
                            //       Models.Voice.play(path)
                            //    }else{
                            //      Models.File.download(id, function(path){
                            //          Models.Voice.play(path)
                            //      })  
                            //    }
                        }
                    },
                                                        
                    stop    : function(){
                        // probably we will need to pass file name here
                        PHONE.VoiceMessage.stop();
                    },
                            
                    pause    : function(){
                        // probably we will need to pass file name here
                        PHONE.VoiceMessage.pause();
                    },
                            
                    save    :   function(){
                        /* here we save file to db and make try to upload to server */
                    }
                    
                },   
                 
//                TEST : function(user){
//                    DB._init_db(1);
//                    SESSION._init_storage();
//                    if(user){
//                        Models.User.create({
//                            name            :   _random(4, "new_user"),
//                            avatar          :   _random(4, "avatar_"),
//                            pinyin          :   "x",
//                            password        :   _random(4, "password"),
//                            email           :   _random(4, "email"),
//                            QRCode          :   _random(4, "QRCOEDE"),
//                            adress          :   "testuser_123",
//                            phoneNum        :   "testuser_123",
//                            position        :   "testuser_123",
//                            company_id      :   1
//                        });
//                    }
//                },
                        
                ProjectChat     :   {
                    
                    update_chat    :   function(id, callback){ // id - projectId    
                        //store project_id in Session
                        SESSION.set("project_id", id);
                        // we use it to start socket.io session with server
                        // callback fires up when room get message
                        SOCKET.connect("project", id, function(message){ // message we need to display
                            console.log(message);
                            // sync DB and display query new message from DB
                            API._sync(['xiao_project_comments','xiao_users','xiao_project_comment_adds']);
                            callback(message);
//                            DB.select();
//                            DB.from("xiao_project_comments AS pc ");
//                            DB.join("xiao_users AS u", "pc.user_id = u.id");
//                            DB.where('pc.id IN('+messages+')');
//                            DB.where('DATETIME(pc.update_time, "+3 hour") > "'+ date_to_string(SESSION.get('xiao_project_comments')) +'"');
//SELECT DATETIME(update_time) FROM xiao_project_comments WHERE DATETIME(update_time) > '2013-09-17 13:20:42'
//                            API.read(function(data){
//                                console.log(data);
//                                // in callback we define actions which need to be proceeded when message arrives
//                                callback(data);
//                            });
                            // this.init(id,callback); // do not need
                        });
                    },

                    send_message    :   function(data, callback){
                        // 1. save message to db
                        // 2. sync db
                        // 3. send socket message to all users to sync db
                        
//                        var data = {
//                            content     :   "hello world",
//                            type        :   "text",
//                            project_id  :   "xiao_projects_8w4bk484&20130916170458"
////                            user_id     :   "dsadasdas1212312"
//                        };
                        // 1. save message to db
                        // 2. sync db
                        data['user_id'] = SESSION.get("user_id");

                        API.insert("xiao_project_comments", data, function(insert_id){
                            // 3. send socket message to all users to sync db
                            data['id'] = insert_id;
//                            SESSION.push_message(insert_id);
                            SOCKET.sendchat(data);
                            console.log(data);
                            callback(data);
                        });
                        
                    }
                    
                } 
            };
            // Models
            // Models
            // Models
            

        }(
                
                
                
                
          // PRIVATE
          // PRIVATE
          // PRIVATE
        function(){
            console.log("hello");
//            var SERVER = {
             SERVER = {

                SOCKET  : {
                    
                    socket : null,
                    type    : null,
                    id      : null,
                    
                    connect : function(type, id, callback){
                        // type is project or todo
                        var _this = this, url;
                        
                        if(!this.socket || !this.type || this.type != type || this.id != id){
                            url = CONFIG[type+'_chat_url'];
                            if(typeof(url) === "undefined"){console.log("ERROR");return false;}
                            this.socket = io.connect(url);
                            this.id = id;
                            this.type = type;
                            this.socket.on('connect', function(){
                                // call the server-side and make room with id or add to existing one
                                console.log("CONNECT");
                                _this.socket.emit('addroom', {id:id});
                            });
                            this.socket.on("updatechat", function(data){ // data just contain message that we need to sync DB
                                // fires when new message arrive
                                console.log("upDATE");
                                console.log(data);
                                callback(data);
                            }); 
                        }// else same connection
                    },

                    sendchat    :   function(message){
                        this.socket.emit("sendchat", message);
                    }

                },
                            
                // DB        
                // DB        
                // DB
                DB : function(db){


                    return {

                        // _sql : "", _tables_to_sync : [],
                        _sql : "", 

                        select      :   function(data){
//                            var select = (data == "" ? "*" : data);
                            var select = (data ? data : "*");
                            // this._tables_to_sync = [];
                            // SERVER.API._tables_to_sync = [];
                            return this._sql = 'SELECT '+select+' ';
                        },

                        from    :   function(table){
                            this._sql += ' FROM '+table;
                            // return this._tables_to_sync.push(table.match(/([A-z0-9_]+)/ig)[0]);
                            return SERVER.API._tables_to_sync.push(table.match(/([A-z0-9_]+)/ig)[0]);
                        },

                        where   :   function(where){
                            this._sql += (this._sql.match(/( WHERE )/g) ? " AND " : " WHERE ");
                            return this._sql+= where;
                        },

                        join    :   function(table, on){
                            // this._tables_to_sync.push(table.match(/([A-z0-9_]+)/ig)[0]);
                            SERVER.API._tables_to_sync.push(table.match(/([A-z0-9_]+)/ig)[0]);
                            return this._sql+=' INNER JOIN '+table+' ON '+ on;
                        },

                        left_join    :   function(table, on){
                            // this._tables_to_sync.push(table.match(/([A-z0-9_]+)/ig)[0]);
                            SERVER.API._tables_to_sync.push(table.match(/([A-z0-9_]+)/ig)[0]);
                            return this._sql+=' LEFT JOIN '+table+' ON '+ on;
                        },
                        
                        order_by    : function(order){
                            return this._sql+=' ORDER BY '+ order;
                        },

//                        right_join    :   function(table, on){
//                            // this._tables_to_sync.push(table.match(/([A-z0-9_]+)/ig)[0]);
//                            SERVER.API._tables_to_sync.push(table.match(/([A-z0-9_]+)/ig)[0]);
//                            return this._sql+=' RIGHT JOIN '+table+' ON '+ on;
//                        },
//
//                        full_join    :   function(table, on){
//                            // this._tables_to_sync.push(table.match(/([A-z0-9_]+)/ig)[0]);
//                            SERVER.API._tables_to_sync.push(table.match(/([A-z0-9_]+)/ig)[0]);
//                            return this._sql+=' FULL OUTER JOIN '+table+' ON '+ on;
//                        },

                        query   :   function(callback){
                            //as we make all queries throught API we don't allow without sync
//                            return (
//                                this._tables_to_sync.length > 0 ?
//                                this._executeSQL(this._sql, function(data){
//                                    callback(data);
//                                })  : false
//                            );
                            this._executeSQL(this._sql, function(data){
                                callback(data);
                            });
                        },
                                
                        row   :   function(callback){
                            // retunr one row
                            this._executeSQL(this._sql+' LIMIT 1', function(data){
                                callback(data[0]);
                            });
                        },
                                
                        col   :   function(callback){
                            // retunr one row
                            this._executeSQL(this._sql+' LIMIT 1', function(data){
                                for(var i in data[0]){
                                    console.log(data[0][i])
                                    callback(data[0][i]);
                                    return;
                                }
                            });
                        },

                        _executeSQL   : function(sql, callback){
                            console.log(sql);
                            function querySuccess(tx, results) {
                                var len = results.rows.length, db_result = [];
                                for (var i=0; i<len; i++){
                                    db_result[i] = results.rows.item(i);
                                }
                                console.log(db_result);
                                return (callback ? callback(db_result) : true);
                            }
                            function errorCB(err) {
                                console.log("Error processing SQL: "+err.code);
                            }
                            db.transaction(queryDB, errorCB);
                            function queryDB(tx) {
                                tx.executeSql(sql, [], querySuccess, errorCB);
                            }
                        },

                        insert : function(table, data, callback){
                            var insert_id = this._make_id(table),                        
                            sql = 'INSERT INTO '+table+' (id';
                            for(var key in data){ // we put id first
                                sql+= ","+key;
                            }
                            sql+= ') VALUES ("'+insert_id+'"';
                            for(var key in data){
                                sql+= ',"'+data[key]+'"';
                            }
                            sql+= ')';
                            return (
                                callback ? this._executeSQL(sql, function(){
                                    callback(insert_id);
                                }) : this._executeSQL(sql)
                            );
                        },
                
                        batch_insert   : function(table, data, callback){
                            if(typeof table != "string") return false; // table is a string not an array
                            if(data instanceof Array === false) return false; // data is array here
                            var i = 0, _this = this, sql = 'INSERT INTO '+table+' (id';
                            for(var key in data[0]){
                                sql+=","+key;
                            }
                            sql+=')';
                            for(var j in data){
                                for(var ij in data[j]){
                                    if(i == 0){
                                        j == 0 ? sql+= ' SELECT "'+ _this._make_id(table) + '" as id' : sql+= ' UNION SELECT "'+ _this._make_id(table) + '" as id';
                                    }
                                    if(j == 0){
                                        sql+=', "'+data[j][ij]+'" as '+ ij + ''
                                    }else{
                                        sql+=', "'+data[j][ij]+'"';
                                    }
                                    ++i;
                                }
                                i=0;
                            }
                            return (
                                callback ? this._executeSQL(sql, function(){
                                    callback();
                                }) : this._executeSQL(sql)
                            );
                        },
                        
                        update :   function(table, data, where, callback){
                            var i = 0, j = 0, sql="", sql = "UPDATE "+table+" SET ";
                            for(var key in data){
                                if(i != 0){sql+=",";}
                                sql += key+'="'+data[key]+'"';
                                ++i;
                            }
                            if(where!=""&& where!=false){
                                sql+=" WHERE "+where;
                            }
                            return (
                                callback ? this._executeSQL(sql, function(){
                                    callback();
                                }) : this._executeSQL(sql)
                            );
                        },
                        
                        replace : function(table, data, callback){
                            var i = 0, j = 0, sql="", all_sql = "REPLACE INTO "+table+" ( ";
                            for(var str in data){
                                if(i != 0){all_sql+=",";}
                                all_sql += str;
                                ++i;
                            }
                            all_sql += ") VALUES (";
                                                    
                            for(var i in data){
                                if(j!= 0){sql+=',';}
                                sql+= '"'+ data[i] +'"';
                                ++j;
                            }
                            all_sql +=sql+')';
                            
                            return (
                                callback ? this._executeSQL(sql, function(){
                                    callback();
                                }) : this._executeSQL(sql)
                            );
                        },
                        
                        batch_replace : function(table, data, callback){
                            var i = 0, sql = "REPLACE INTO "+table+" ( ";
                            for(var key in data[0]){
                                if(i != 0){sql+=",";}
                                sql += key;
                                ++i;
                            }
                            sql += ") ", i= 0;
                            for(var j in data){
                                for(var ij in data[j]){
                                    if(i == 0){
                                        j == 0 ? sql+= ' SELECT ': sql+= ' UNION SELECT ';
                                    }else{
                                        sql+= ",";
                                    }
                                    if(j == 0){
                                        sql+=' "'+data[j][ij]+'" as '+ ij + ''
                                    }else{
                                        sql+=' "'+data[j][ij]+'"';
                                    }
                                    ++i;
                                }
                                i=0;
                            }
                            return (
                                callback ? this._executeSQL(sql, function(){
                                    callback();
                                }) : this._executeSQL(sql)
                            );
                        },
                                
                        _make_id :   function(table){
                            return _random(8, table+"_");
                        },

                        _init_tables : ['xiao_partners', 'xiao_projects', 'xiao_users', 'xiao_project_partners',
                                        'xiao_partner_groups', 'xiao_partner_group_users', 'xiao_project_comments',
                                        'xiao_project_comment_adds'],
                        
                        _init_db : function(clear){
                            var _this = this;
                            console.log("start init");
                            db.transaction(createDB, error_create_DB);
                            function createDB(tx) {
                                // DON't FORGET TO ADD TABLE TO init_tables     for test
                                if(clear){
                                    _this._init_tables.forEach(function(drop_table){
                                        tx.executeSql('DROP TABLE IF EXISTS '+drop_table);
                                    });

                                    tx.executeSql('DROP TABLE IF EXISTS sync');
                                    tx.executeSql('DROP TABLE IF EXISTS sync_delete');
                                }
                                tx.executeSql('CREATE TABLE IF NOT EXISTS xiao_project_partners(\n\
                                                server_id VARCHAR(255) NULL,\n\
                                                id VARCHAR(255) NOT NULL, \n\
                                                project_id VARCHAR(255) NOT NULL,\n\
                                                user_id VARCHAR(255) NOT NULL,\n\
                                                update_time varchar(255) NULL,\n\
                                                company_id VARCHAR(255) NOT NULL DEFAULT '+SERVER.SESSION.get("company_id")+',\n\
                                                UNIQUE(id))'
                                );
                                tx.executeSql('CREATE TABLE IF NOT EXISTS xiao_projects(\n\
                                                server_id VARCHAR(255) NULL,\n\
                                                id VARCHAR(255) NOT NULL,\n\
                                                creator_id VARCHAR(255) NULL,\n\
                                                company_id VARCHAR(255) NOT NULL DEFAULT '+SERVER.SESSION.get("company_id")+',\n\
                                                name VARCHAR(255) NOT NULL,\n\
                                                description VARCHAR(255) NULL,\n\
                                                color VARCHAR(255) NOT NULL,\n\
                                                level VARCHAR(255) NULL,\n\
                                                status VARCHAR(255)  NULL,\n\
                                                update_time varchar(255) NULL,\n\
                                                UNIQUE(id))'
                                );
                                tx.executeSql('CREATE TABLE IF NOT EXISTS xiao_partners(\n\
                                                server_id VARCHAR(255) NULL,\n\
                                                id VARCHAR(255) NOT NULL,\n\
                                                user_id INTEGER,\n\
                                                partner_id INTEGER,\n\
                                                update_time varchar(255) NULL,\n\
                                                company_id VARCHAR(255) NOT NULL DEFAULT '+SERVER.SESSION.get("company_id")+')'
                                ); 
                                tx.executeSql('CREATE TABLE IF NOT EXISTS xiao_users(\n\
                                                server_id VARCHAR(255) NULL,\n\
                                                id VARCHAR(255) NOT NULL,\n\
                                                name varchar(255) NOT NULL,\n\
                                                avatar varchar(255) NOT NULL,\n\
                                                pinyin varchar(255) NOT NULL,\n\
                                                password varchar(255) NOT NULL,\n\
                                                email varchar(100) NOT NULL,QRCode varchar(255) NULL,\n\
                                                adress varchar(255) NULL,phoneNum int(11) NULL,\n\
                                                position varchar(255) NULL,\n\
                                                update_time VARCHAR(255) NULL,\n\
                                                company_id VARCHAR(255) NOT NULL DEFAULT '+SERVER.SESSION.get("company_id")+',\n\
                                                UNIQUE(id))'
                                );
                                tx.executeSql('CREATE TABLE IF NOT EXISTS xiao_partner_groups (\n\
                                                server_id VARCHAR(255) NULL,\n\
                                                id varchar(255) NOT NULL,\n\
                                                name varchar(255) NOT NULL,\n\
                                                creator_id VARCHAR(255) NOT NULL,\n\
                                                update_time VARCHAR(255) NULL,\n\
                                                company_id VARCHAR(255) NOT NULL DEFAULT '+SERVER.SESSION.get("company_id")+',\n\
                                                UNIQUE(id))'
                                );     
                                tx.executeSql('CREATE TABLE IF NOT EXISTS xiao_partner_group_users (\n\
                                                server_id VARCHAR(255) NULL,\n\
                                                id varchar(255) NOT NULL,\n\
                                                group_id varchar(255) NOT NULL,\n\
                                                user_id VARCHAR(255) NOT NULL,\n\
                                                update_time VARCHAR(255) NULL,\n\
                                                company_id VARCHAR(255) NOT NULL DEFAULT '+SERVER.SESSION.get("company_id")+',\n\
                                                UNIQUE(id))'
                                );
                                tx.executeSql('CREATE TABLE IF NOT EXISTS sync (\n\
                                                sid INTEGER NOT NULL PRIMARY KEY,\n\
                                                table_name VARCHAR( 255 ) NOT NULL,\n\
                                                time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,\n\
                                                row_id varchar(255) NOT NULL )'
                                );
                                tx.executeSql('CREATE TABLE IF NOT EXISTS xiao_project_comments (\n\
                                                server_id VARCHAR(255) NULL,\n\
                                                id varchar(255) NOT NULL,\n\
                                                content TEXT NULL,\n\
                                                project_id VARCHAR(255) NOT NULL,\n\
                                                user_id VARCHAR(255) NOT NULL,\n\
                                                update_time DATETIME,\n\
                                                company_id VARCHAR(255) NOT NULL DEFAULT '+SERVER.SESSION.get("company_id")+',\n\
                                                UNIQUE(id))'
                                );
                                    
                                tx.executeSql('CREATE TABLE IF NOT EXISTS xiao_project_comment_adds (\n\
                                                server_id VARCHAR(255) NULL,\n\
                                                id varchar(255) NOT NULL,\n\
                                                comment_id VARCHAR(255) NULL,\n\
                                                type VARCHAR(255) NULL,\n\
                                                server_path TEXT NULL,\n\
                                                local_path TEXT NULL,\n\
                                                update_time DATETIME,\n\
                                                company_id VARCHAR(255) NOT NULL DEFAULT '+SERVER.SESSION.get("company_id")+',\n\
                                                UNIQUE(id))'
                                );
                                
                                tx.executeSql('CREATE TABLE IF NOT EXISTS sync_delete (\n\
                                                `sid` INTEGER NOT NULL PRIMARY KEY,\n\
                                                `table_name` VARCHAR( 255 ) NOT NULL,\n\
                                                `time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,\n\
                                                `row_id` varchar(255) NOT NULL )'
                                );
                                if(clear){
                                    _this._init_tables.forEach(function(cur){
                                        var sql ='CREATE TRIGGER update_'+cur+' AFTER UPDATE ON '+cur+' FOR EACH ROW BEGIN INSERT INTO sync(table_name, row_id) VALUES("'+cur+'", NEW.id); END; ';
                                        tx.executeSql(sql);
                                        var sql ='CREATE TRIGGER insert_'+cur+' AFTER INSERT ON '+cur+' FOR EACH ROW BEGIN INSERT INTO sync(table_name, row_id) VALUES("'+cur+'", NEW.id); END; ';
                                        tx.executeSql(sql);
                                        var sql ='CREATE TRIGGER delete_'+cur+' BEFORE DELETE ON '+cur+' FOR EACH ROW BEGIN INSERT INTO sync_delete(table_name, row_id) VALUES("'+cur+'", OLD.id); END; ';
                                        tx.executeSql(sql);
                                    });
                                }
                            }
                            function error_create_DB(tx, err){console.log(tx);console.log(err);}
                            console.log("inited");
                            
                            return this;
                        }
                    };
                }(window.openDatabase("Database", "1.0", "xiao_db1", 200000)),
                // DB        
                // DB        
                // DB        
                        
                

                // API
                // API
                // API
                 API : {

                    _tables_to_sync :   [],
                            
                    _clear_tables_to_sync: function(){
                        this._tables_to_sync = [];
                    },
                            
                    read    :   function(callback){
//                        console.log(SERVER.DB);
                        // WHEN READ sync first then EXECUTE SQL
                        // this._sync(SERVER.DB._tables_to_sync, function(data){
                        this._sync(this._tables_to_sync, function(data){
                            SERVER.DB.query(function(result){
                                callback(result);
                            });
                        });
                    },
                    
                    row    :   function(callback){
//                      // return one row
                        this._sync(this._tables_to_sync, function(data){
                            SERVER.DB.row(function(result){
                                callback(result);
                            });
                        });
                    },
                    
                    col    :   function(callback){
//                      // return one row
                        this._sync(this._tables_to_sync, function(data){
                            SERVER.DB.col(function(result){
                                callback(result);
                            });
                        });
                    },

                    insert  :  function(table, data, callback, timeout){ // timeout need to be set to true if we want to get callback after synchronization with server
                        if(typeof table != "string") return false; // table is just text here not an array
                        if(data instanceof Array) return false;
                        // WHEN CREATE :
                        //  we use orm in api to MAKE QUERY and return generated id in callback momentary if query was success
                        //  after that sync performed asynchronously
                        var _this = this;
                        SERVER.DB.insert(table, data, function(insert_id){
                            if(callback && timeout === true){
                                _this._sync( [table], function(){ callback(insert_id); });
                            }else if(callback){
                                callback(insert_id);
                                _this._sync([table]);
                            }else{_this._sync([table]);}
                        });
                    },

                    batch_insert  :  function(table, data, callback, timeout){
                        // batch insert method to query an array in one time F.E Project partners insert
                        if(typeof table != "string") return false; // table is a string not an array
                        if(data instanceof Array === false) return false; // data is array here
                        var _this = this;
                        SERVER.DB.batch_insert(table, data, function(){
                            if(callback && timeout === true){
                                _this._sync( [table], function(){ callback(); });
                            }else if(callback){
                                callback();
                                _this._sync([table]);
                            }else{_this._sync([table]);}
                        });
                    },

                    update  :  function(table, data, where, callback){
                        if(typeof where == "function"){ callback = where; where=false;}
                        console.log(callback);
                        console.log(where);
                        var _this = this;
                        SERVER.DB.update(table, data, where, function(){
                            return (
                                    callback    ?   _this._sync([table], function(){
                                        callback();
                                    })          :   _this._sync([table])
                            );
                        });

                    },

                    _sync    :   function(tables, callback){
                        var sync_data = [], _this = this, user_data = SERVER.SESSION.local_data();
                        tables.forEach(function(table_name, table_num){
                            var sql= 'SELECT * FROM sync as s  INNER JOIN '+table_name+' as t ON s.row_id = t.id WHERE table_name ="'+table_name+'"';
                            SERVER.DB._executeSQL(sql, function(data){
                                sync_data.push({
                                    name        :   table_name,
                                    last_sync   :   SERVER.SESSION._get_sync_time(table_name),
                                    updated     :   data, // move here
                                    deleted     :   []
                                });
                                if(table_num == (tables.length-1)){
                                    _this._tables_to_sync = []; // new // for now here
                                    // if this is the last table needed to be synced
                                    _this._request( CONFIG.route("sync"),
                                    {
                                        tables  :   sync_data,
                                        info    :   user_data
                                    },
                                    function(server){
                                        console.log(server);
                                        if(server){
                                            console.log("server");
                                            var changes = server.response;
                                            changes.forEach(function(ij, num){
                                                 // apply changes
                                                if( (ij.updated && ij.updated.length > 0) ||
                                                    (ij.deleted && ij.deleted.length > 0)
                                                ){
                                                    //if need to UPDATE or CREATE something  ~~~ GOES IN ONE METHOD with replace
                                                    if(ij.updated.length > 0){
                                                        SERVER.DB.batch_replace(ij.table, ij.updated, function(data){
                                                            _this._sync_clear(ij.table,  server.info.time);
                                                            if( num == (changes.length-1) ){
                                                                return (callback ? callback() : true);
                                                            }
                                                        });
                                                    }
                                                }else{
                                                    if(num == (changes.length-1)){
                                                        console.log(tables)
                                                        _this._sync_clear(ij.table,  server.info.time);
                                                        return (callback ? callback() : true);
                                                    }
                                                }
                                            });
                                        }else{
                                            console.log("no server");
                                            return (callback ? callback() : false);
                                        }
                                    });
                                }
                            });
                        });
                    },

                    _sync_clear  : function(table, time){
                        var _this = this;
                        SERVER.DB._executeSQL('DELETE FROM sync WHERE table_name = "'+table+'"');
                        SERVER.SESSION._update_sync_time(table, time);
                    },

                    _request : function(url, params, callback){

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
                    }

//                    _config: {
//
//                        server_url : "http://212.8.40.254:5959/",
////                        server_url : "http://192.168.200.110:3000/",
//
//                        route  : function(url){ return  this.server_url+this.routes[url];},
//
//                        routes  :   {
//                            sync    :   "sync/sync"
//                        }
//                    }
                },
                // API
                // API
                // API

                // Storage
                // Storage
                // Storage
                 SESSION : function(storage){

                    return {

                        _get_sync_time      :   function(table){
                            return storage.getItem(table);
                        },

                        _update_sync_time   :   function(table, time){
                            storage.setItem(table,time);
                        },

                        local_data  :   function(){
                            return {
                                user_id     :   storage.getItem("user_id"),
                                company_id  :   storage.getItem("company_id"),
                                project_id  :   storage.getItem("project_id"),
                                todo_id     :   storage.getItem("todo_id")
                            };
                            var data = {};
                            for(var i in storage){
                                if(i != "length"){   
                                    data[i] = storage[i];
                                }
                            }
                            return data;
                        },
                                
//                        push_message : function(id){
//                            
//                        },
//                                
//                        not_pushed_messages : function(){
//                    
//                        },

                        set     :   function(data, value){
                            return storage.setItem(data,value);
                        },

                        get     :   function(data){
                            return storage.getItem(data);
                        },
                                
                        clear   :   function(){
                            storage.clear();
                        },

                        _init_storage : function(clear){
                            var _this = this, test_user_id = (this.get("user_id") ? this.get("user_id") : "dsadasdas1212312");
                            this.clear();
                            this.set("user_id", test_user_id);
                            this.set("user_name", "Igor");
                            this.set("company_id", 1);
                            SERVER.DB._init_tables.forEach(function(cur){
//                                console.log(cur)
                                _this._update_sync_time(cur, 1);
                            });
//                            SERVER.DB.select("u.name");
//                            SERVER.DB.from('xiao_users as u');
//                            SERVER.DB.where('u.id = "'+test_user_id+'" ');
//                            SERVER.DB.col(function(user_name){
//                                console.log(user_name);
//                                _this.set("user_name", user_name);
//                            });
                            
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
                PHONE   : function(){
                    // PARENT class which conatins device type, browser type, file_system entry, and file creation ability...also logger 
                    function Phone(){
                        this.ua = navigator.userAgent.toLowerCase();
                        this.device  = function(){
                            var device;
                            var ua = navigator.userAgent.toLowerCase();
                            console.log(ua);
                            if(ua.match(/(iphone|ipod|ipad)/i)){
                                device = "ios";
                            }else if(ua.match(/android/i)){
                                device = "android";
                            }else if(ua.match(/blackberry/i)){
                                device = "blackberry";
                            }else if(ua.match(/windows phone os 7.5/i)){
                                device = "windows";
                            }else{
                                device = "desktop";
                            }
                            return device;
                        }();
                        
                        this.fs = inited_fs; // see the start of this file
                        this.file_path = null;
                        this.short_name = null;
                        
                        this._create_file = function(after, callback){
                            var _this = this;
                            this.fs.getFile( _random(5, after) , { create: true, exclusive: false }, function(fileEntry){
                                _this.file_path = fileEntry.fullPath;
                                _this.short_name = fileEntry;
//                                callback(_this.file_path);
                                callback(fileEntry.fullPath);
                            }, _this.log_error);
                        };
                        
                        this.log_error = function(err, err1){
                            console.log("Phone_error");
                            console.log(err+ " "+ err1);
                            alert(err+ " "+ err1);
                        };
                        this.log_success = function(){
                            console.log(" success ");
                        };
                        
                        this.download = function(server_path, callback){
                            
                            var fileTransfer = new FileTransfer();
                            var uri = encodeURI(server_path);
                            this._create_file( server_path.substring(server_path.lastIndexOf('/')+1) , function(local_path){
                                
                                fileTransfer.download(
                                    uri,
                                    local_path,
                                    function(entry) {
                                        console.log("download complete: " + entry.fullPath);
                                        callback(entry.fullPath);
                                    },
                                    function(error) {
                                        console.log("download error source " + error.source);
                                        console.log("download error target " + error.target);
                                        console.log("upload error code" + error.code);
                                        return false;
                                    },
                                    true//,
    //                                {
    //                                    headers: {
    //                                        "Authorization": "Basic dGVzdHVzZXJuYW1lOnRlc3RwYXNzd29yZA=="
    //                                    }
    //                                }
                                );
                                
                            });
                                
                        };
                        
                        this.upload = function(local_path, type, callback){
                            // local_path --- is file path in phone local fs
                            // type       --- is type of file we want to upload 
                            //                              F.E. image or audio
                            // mime types:
                            // audio/mpeg
                            // image/jpeg
                            if(!local_path || !type || (type!= "image" && type!= "audio") ){return false;} // we use just image upload and audio
                            var options = new FileUploadOptions(), 
                                ft = new FileTransfer();
                            options.fileKey="file";
                            options.fileName=local_path.substr(local_path.lastIndexOf('/')+1);
                            switch (type){
                                case "image":
                                    options.mimeType="image/jpeg";
                                    break;
                                case "audio":
                                    options.mimeType="audio/mpeg";
                                    break;
                            }
                            options.params = {type:type};

                            ft.upload(local_path, encodeURI(CONFIG.file_upload_url), callback, fail, options);
                            
                            function fail(error) {
                                alert("An error has occurred: Code = " + error.code);
                                console.log("upload error source " + error.source);
                                console.log("upload error target " + error.target);
                            }
                        };
                    };
                    /* PARENT */
                    
                    /* Voice_message */
                    function VoiceMessage(){
                        VoiceMessage.superclass.constructor.call(this);
                        
                        this.audio = null;
                        
                        this.last_record_path = null;
                        
                        this.record_start    =   function(callback){
                            var _this = this;
                            this._create_file(SERVER.SESSION.get("user_name"), function(file_path){ // callback
                                _this.audio = new Media(file_path, _this.log_success, _this.log_error);
                                _this.audio.startRecord();
                                _this.last_record_path = file_path;
//                                _this._draw_record_time();
                                console.log(file_path);
                                callback(file_path);
                            });

                        };
                        
                        this.record_stop     =   function(){
                            if(this.audio){
                                var _this = this;
                                this.audio.stopRecord();
                                this.upload(this.file_path, "audio", function(data){
                                    console.log(data);
                                    _this.audio = null;
                                    _this.last_record_path = null;
                                });
//                                this._stop_timer();
                            }
                        };
                        
                        this.record_play    =   function(file){
                            if(this.last_record_path != file){
                                this.audio = new Media(file, this.log_success, this.log_error);
                            }
                            this.audio.play();
                        };
                        
                        this.play    =   function(file){
//                            if(!file){return false;}
                            var _this = this;
                            if (this.audio === null || this.file_path != file) {
                                console.log("first")
                                console.log(file)
                    //            return false;
//                                this.audio = new Media(file, _this.recordSuccess, _this.recordError);
                                this.audio = new Media(file, this.log_success, this.log_error);
                                this.audio.play();
//                                this._draw_play_time();
                            }else{ // else play current audio
                                console.log("second")
                            // Play audio
                                this.audio.play();
//                                this._draw_play_time();
                            }
                            // Update my_media position every second
                        };

                        this.pause   =   function(){
                            if (this.audio) {
                                this.audio.pause();
                            }
                        };

                        this.stop    =   function(){
                            if (this.audio) {
                                this.audio.stop();
//                                this._stop_timer();
                            }
                        };

                        this.getPlayTime = function(callback){
                            this.audio.getCurrentPosition(
                                function(pos){
                                    callback(pos);
                                },
                                function(err){

                            });
                        };
                        
                    }
                    extend(VoiceMessage, Phone);
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

                    
                    
                    return {
                        VoiceMessage : new VoiceMessage()
                    };
                    
                    

                    
                }() // ,
                // PHONEGAP
                // PHONEGAP
                // PHONEGAP
                
//                CONFIG  :   {
//                    server_url       : "http://212.8.40.254:5959/",
//                    file_upload_url  : "http://212.8.40.254:5959/upload",
//                    project_chat_url : "http://212.8.40.254:5959/",
//                    todo_chat_url    : "http://212.8.40.254:5959/todo",
//
//                    route  : function(url){ return  this.server_url+this.routes[url];},
//
//                    routes  :   {
//                        sync    :   "sync"
//                    },                    
//                    root_dir    :   "BAO"
//                }
                
                
            };
            
//            document.addEventListener("deviceready", onDeviceReady, false);
//            function onDeviceReady() {

                return {

     //                API     : SERVER.API,
     //                DB      : SERVER.DB,
     //                SESSION : SERVER.SESSION,
     //                PHONE   : SERVER.PHONE,
     //                SOCKET  : SERVER.SOCKET
                     API        : SERVER.API,
                     DB         : SERVER.DB._init_db(1),
                     SESSION    : SERVER.SESSION._init_storage(1),
                     PHONE      : SERVER.PHONE,
                     SOCKET     : SERVER.SOCKET

                };
                
                
//           };
    
        }()


 
    );




        init_main_html();
        
        
    }
}