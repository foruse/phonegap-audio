document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady(){
    
    Contacts = {
        
        read    : function(callback){
            var options = new ContactFindOptions();
            options.multiple=true; ; 
        //    var fields = ["*"];
            var fields = ["id","name", "displayName", "organizations","emails","phoneNumbers","addresses"];
            navigator.contacts.find(fields, callback, onError, options);
            
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
