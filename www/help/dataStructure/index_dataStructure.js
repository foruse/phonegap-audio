﻿(function(){
with(this){
	this.DS_user = {
		id : 1, // number
		name : "mj", // string
		pinyin : "a", // string : the first letter of the user's name
		avatar : "../../image/avatar.png", // string
		company : "北京视宽加速有限公司", // string
		companyAdress : "beijing", // string
		position : "coder", // string : job title ?
		phoneNum : "010-12345678", // string
		email : "mj@BaoPiQi.com", // string
		adress : "beijing", // string : home adress
		isNewUser : false, // boolean : if the user is first login, return true, else return false
		isLeader : false, // boolean : if the user has authority to create project, return true, else return false
		QRCode : "../../image/qrcode" // string
	};

	this.DS_users = [
		DS_user,
		// ...
		DS_user
	];

	this.DS_attachment = {
		id : 1, // number
		type : "map", // string : "map", "voice" or "image"
		src : "src.png" // string
	};

	this.DS_message = {
		id : 1, // number
		text : "abc", // string
		poster : DS_user,
		attachment : DS_attachment,
		praise : DS_users, // array : who has praised the message.
		time : new Date().getTime(), // number : the milliseconds since 1970/01/01
		type : "text" // string : "text", "voice" or "image", there are three types of message
	};

	this.DS_group = {
		id : 1, // number
		name : "group's name" // string
	};

	this.DS_project = {
		attachments : [
			DS_attachment,
			//..
			DS_attachment
		],
		id : 1, // number
		level : 1, // number : from 1 to 3
		title : "my title", // string
		color : 1, // number : from 0 to 5(0 : orange, 1 : tan, 2 : cyan, 3 : blue, 4 : henna, 5 : purple)
		users : DS_users,
		creator : DS_user,
		creationTime : new Date().getTime(), // number : the milliseconds since 1970/01/01
		lastMessage : "12345", // string
		unread : 66, // number : the max is 99
		desc : "abc" // string : description of the project
	};

	this.DS_toDoInfo = {
		id : 1,
		color : 1, // number : from 0 to 5(0 : orange, 1 : tan, 2 : cyan, 3 : blue, 4 : henna, 5 : purple)
		title : "sss",
		desc : "aaa",
		attachments : [
			DS_attachment,
			// ...
			DS_attachment
		],
		messages : [
			DS_message,
			// ...
			DS_message
		],
		endTime : new Date().getTime()
	};
}
window.index_dataStructure = this;
}.call({}));