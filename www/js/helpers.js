function _random(len, after){
    // later
    // generate id in following way
    // date + random + user_id
    var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
    var string_length = len ? len :10, randomstring;

    for (var x=0;x<string_length;x++) {

        var letterOrNumber = Math.floor(Math.random() * 2);
        if (letterOrNumber == 0) {
            var newNum = Math.floor(Math.random() * 9);
            randomstring += newNum;
        } else {
            var rnum = Math.floor(Math.random() * chars.length);
            randomstring += chars.substring(rnum,rnum+1);
        }

    }
//    randomstring = after ? (randomstring + after) : randomstring;
    
//    return get_date()+"_"+ (after ? (randomstring + after) : randomstring);
    return get_date()+ (after ? (randomstring + after) : randomstring);
}

function get_date(){
    function formatdate(dd){
        if(parseInt(dd,10)<10){return "0"+dd;}
        return dd;
    }
    var dd = new Date(), date="";
    date+= dd.getFullYear();
    date+= formatdate(dd.getMonth()+1);
    date+= formatdate(dd.getDate());
    date+= formatdate(dd.getHours());
    date+= formatdate(dd.getMinutes());
    date+= formatdate(dd.getSeconds());
    return date;
}

function date_to_string(date){
    //"20130917132042" to "2013-09-17 13:20:42"
    date = date.toString();
    var result="";
    for(var i in date){
        if(i == 4 || i == 6){
            result+="-";
        }
        if(i == 8){
            result+=" ";
        }
        if(i == 10 || i == 12){
            result+=":";
        }
        result+= date[i];        
    }
    return result;
}

function extend(Child, Parent) {
    var F = function() { };
    F.prototype = Parent.prototype;
    Child.prototype = new F();
    Child.prototype.constructor = Child;
    Child.superclass = Parent.prototype;
}
//
//function init(user){
//    Models.TEST(user);
//}