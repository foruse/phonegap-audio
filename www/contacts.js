document.addEventListener("deviceready", onDeviceReady, false);
//
function onDeviceReady(){
    alert("hello")
    Contacts = {
        
        read    : function(callback){
            var options = new ContactFindOptions();
//            options.multiple=true;
            var fields = ["*"];
//            var fields = ["id","name", "displayName", "organizations","emails","phoneNumbers","addresses"];
            navigator.contacts.find(fields, onSuccess, onError, options);
            
           
            function onSuccess(contacts) {
                alert("db_res");  
//                var db_res =[];
//                for (var i=0; i<contacts.length; i++) {
//                    if(contacts[i].displayName){
//                        db_res.push(contacts[i]);
//                    }
//        //            console.log("Display Name = " + contacts[i].displayName);
//                }
        //        alert(db_res);
//                console.log(db_res);
        //        console.log("callback");
        //        console.log(callback);
        //        callback(db_res);
                callback(contacts);
            }
            
            function onError(contactError) {
                alert('onError!');
                console.log(contactError);
            }
            
        }
        
    };
    
    Contacts.read(function(data){
        console.log(data);
    });
    
    
}

//
//document.addEventListener("deviceready", onDeviceReady, false);
//
//    // PhoneGap is ready
//    //
//    function onDeviceReady() {
//        // find all contacts with 'Bob' in any name field
//        var options = new ContactFindOptions();
//        options.filter="Bob"; 
//        var fields = ["displayName", "name"];
//        navigator.contacts.find(fields, onSuccess, onError, options);
//    }
//
//    // onSuccess: Get a snapshot of the current contacts
//    //
//    function onSuccess(contacts) {
//        for (var i=0; i<contacts.length; i++) {
//            console.log("Display Name = " + contacts[i].displayName);
//        }
//    }
//
//    // onError: Failed to get the contacts
//    //
//    function onError(contactError) {
//        alert('onError!');
//    }
