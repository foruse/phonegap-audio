﻿(function(Chat, NonstaticClass, Panel, HTML, Global, set){
this.Attachment = (function(){
	function Attachment(id, _src){
		///	<summary>
		///	附件。
		///	</summary>
		/// <param name="id" type="string">附件id</param>
		/// <param name="_src" type="string">附件src</param>
		this.assign({
			id : id,
			src : _src
		});
	};
	Attachment = new NonstaticClass(Attachment, "Bao.UI.Control.Chat.Attachment");

	Attachment.properties({
		id : -1,
		src : "javascript:void(0);"
	});

	return Attachment.constructor;
}());

this.ImageBox = (function(imageBoxHtml){
	function ImageBox(src){
		///	<summary>
		///	图片框，用于放大显示图片。
		///	</summary>
		/// <param name="src" type="string">图片路径</param>
		var mask = Global.mask;

		this.combine(imageBoxHtml.create({
			src : src
		}));

		this.attach({
			userclick : function(e, targetEl){
				if(targetEl.between(">aside>button", this).length > 0){
					mask.hide();
					return;
				}
			}
		});

		mask.fillBody(this[0]);
		mask.show("imageBox");
	};
	ImageBox = new NonstaticClass(ImageBox, "Bao.UI.Control.Chat.Attachment", Panel.prototype);

	return ImageBox.constructor;
}(
	// imageBoxHtml
	new HTML([
		'<div class="imageBox">',
			'<aside>',
				'<button>关闭</button>',
			'</aside>',
			'<p>',
				'<img src="{src}" />',
			'</p>',
		'</div>'
	].join(""))
));

this.Message = (function(Attachment, ImageBox, clickDoEvent, clickPraiseEvent, forEach, messageHtml, praiseHtml){
	function Message(msg){
		///	<summary>
		///	单个信息。
		///	</summary>
		/// <param name="msg" type="object">信息数据</param>
		var message = this, attachment = msg.attachment;

		this.assign({
			attachment : attachment ? new Attachment(attachment.id, attachment.src) : undefined,
			color : msg.color,
			id : msg.id,
			poster : msg.poster,
			text : msg.text,
			time : msg.time,
			type : msg.type
		});

		this.combine(messageHtml.create(this));
		
		// 添加赞
		forEach(msg.praise, function(userData){
			this.addPraise(userData);
		}, this);

		// 点击信息内容区域
		this.find(">figure>figcaption").attach({
			userclick : function(e, targetEl){
				if(targetEl.between(">img", this).length > 0){
					new ImageBox(targetEl.src)[0];
					return;
				}

				if(targetEl.between(">a>button", this).length > 0){
					alert("voice");
					return;
				}
			}
		});

		// 点击附属功能区域
		this.find(">figure>nav").attach({
			userclick : function(e, targetEl){
				// 判断点击的是否是 赞 按钮
				if(targetEl.between(".chatList_praise>button", this).length > 0){
					var loginUser = Global.loginUser, userId = loginUser.id;

					if(message.isPraisedBy(userId))
						return;
					
					clickPraiseEvent.setEventAttrs({
						action : "add",
						message : message
					});
					clickPraiseEvent.trigger(targetEl[0]);
					return;
				}
				
				// 判断点击的是否是 do 按钮
				if(targetEl.between(">button", this).length > 0){
					clickDoEvent.setEventAttrs({ message : message });
					clickDoEvent.trigger(targetEl[0]);
					return;
				}

				// 判断点击的是否是 展开赞 按钮
				if(targetEl.between(".chatList_praise>sub>button", this).length > 0){
					message.classList.toggle("morePraised");
					return;
				}
			}
		});
	};
	Message = new NonstaticClass(Message, "Bao.UI.Control.Chat.Message", Panel.prototype);

	Message.properties({
		addPraise : function(userData){
			///	<summary>
			///	添加赞。
			///	</summary>
			/// <param name="userData" type="object">称赞用户的数据</param>
			var userId = userData.id;

			if(this.isPraisedBy(userId))
				return;

			var praisePanel = this.find(".chatList_praise"), praiseEl = praisePanel.find(">button");

			praiseEl.innerHTML = praiseEl.innerHTML - 0 + 1;
			praiseHtml.create(userData).insertTo(praisePanel.find(">p")[0], 0);

			if(userId !== Global.loginUser.id)
				return;
			
			this.setAttribute("praisedbyself", "");
		},
		// 附件信息
		attachment : new Attachment(),
		// 颜色
		color : 0,
		// id
		id : -1,
		// 是否发自自己
		isPostBySelf : false,
		isPraisedBy : function(id){
			///	<summary>
			///	是否被指定id的用户称赞过。
			///	</summary>
			/// <param name="id" type="number">称赞用户的id</param>
			return this.find('.chatList_praise>p>a[userid="' + id + '"]').length > 0;
		},
		// 发送人
		poster : undefined,
		removePraise : function(id){
			///	<summary>
			///	移除赞。
			///	</summary>
			/// <param name="id" type="number">称赞用户的id</param>
			if(!this.isPraisedBy(id))
				return;

			var praisePanel = this.find(".chatList_praise"), praiseEl = praisePanel.find(">button");

			praiseEl.innerHTML = praiseEl.innerHTML - 1;
			praisePanel.find('>p>a[userid="' + id + '"]').remove();

			if(id !== Global.loginUser.id)
				return;
			
			this.removeAttribute("praisedbyself");
		},
		// 信息文本
		text : "",
		// 信息发送时间
		time : 0,
		// 信息种类
		type : "text"
	});

	return Message.constructor;
}(
	this.Attachment,
	this.ImageBox,
	// clickDoEvent
	new jQun.Event("clickdo"),
	// clickPraiseEvent
	new jQun.Event("clickpraise"),
	jQun.forEach,
	// messageHtml
	new HTML([
		'<li class="chatList_message inlineBlock" action="{type}" ispostbyself="{poster.isLoginUser}">',
			'<aside>',
				'<p class="normalAvatarPanel" userid="{poster.id}">',
					'<img src="{poster.avatar}" />',
				'</p>',
			'</aside>',
			'<figure>',
				'<figcaption>',
					'<span>{text}</span>',
					'<a voiceid="{attachment.id}">',
						'<button></button>',
					'</a>',
					'<img src="{?~ attachment.src}" />',
				'</figcaption>',
				'<nav class="whiteFont inlineBlock">',
					'<button>do</button>',
					'<aside class="chatList_praise">',
						'<button>0</button>',
						'<p class="inlineBlock"></p>',
						'<sub>',
							'<button></button>',
						'</sub>',
					'</aside>',
				'</nav>',
				'<p class="message_bg normalRadius projectColor_{color}">',
					'<span></span>',
				'</p>',
			'</figure>',
		'</li>'
	].join("")),
	// praiseHtml
	new HTML([
		'<a class="smallAvatarPanel " title="{name}" userid="{id}">',
			'<img src="{avatar}" />',
		'</a>'
	].join(""))
));

this.MessageList = (function(List, Message){
	function MessageList(){
		///	<summary>
		///	信息列表。
		///	</summary>
	};
	MessageList = new NonstaticClass(MessageList, "Bao.UI.Control.Chat.MessageList", List.prototype);

	MessageList.override({
		push : function(msg){
			///	<summary>
			///	添加信息。
			///	</summary>
			/// <param name="msg" type="object">信息数据</param>
			var message = new Message(msg);

			List.prototype.push.call(this, message);
			return message;
		}
	});

	return MessageList.constructor;
}(
	jQun.List,
	this.Message
));

this.MessageGroup = (function(MessageList, messageAppendedEvent, singleNumRegx, messageGroupHtml){
	function MessageGroup(time){
		///	<summary>
		///	信息分组区域。
		///	</summary>
		var dt = new Date(time),

			desc = "今天", t = this - dt, hours = dt.getHours();
				
		switch(true){
			case t < 0 :
				break;

			case t < 86400000 :
				desc = "昨天";
				break;

			case t < 86400000 * 2 :
				desc = "前天";
				break;

			default :
				desc = dt.getFullYear() + "年" + (dt.getMonth() + 1) + "月" + dt.getDate() + "日";
				break;
		}

		this.combine(
			messageGroupHtml.create({
				// 注意，这里是中文版本，不能用Date.prototype.toLocaleTimeString()，因为很多手机都是英文版本的。
				localTime : [
					desc,
					hours < 12 ? "上午" : "下午",
					// 如果是1位数，转化为2位数
					hours.toString().replace(singleNumRegx, "0$1"),
					":",
					// 如果是1位数，转化为2位数
					dt.getMinutes().toString().replace(singleNumRegx, "0$1")
				].join(" ")
			})
		);

		this.assign({
			messageList : new MessageList()
		});
	};
	MessageGroup = new NonstaticClass(MessageGroup, "Bao.UI.Control.Chat.MessageGroup", Panel.prototype);

	MessageGroup.properties({
		appendMessage : function(message){
			///	<summary>
			///	向信息分组添加信息。
			///	</summary>
			/// <param name="message" type="object">信息数据</param>
			var msg = this.messageList.push(message);

			msg.appendTo(this.find(">dd>ol")[0]);
			messageAppendedEvent.trigger(this[0]);
			return msg;
		},
		messageList : undefined
	});

	return MessageGroup.constructor;
}(
	this.MessageList,
	// messageAppendedEvent
	new jQun.Event("messageappended"),
	// singleNumRegx
	/^(\d)$/,
	// messageGroupHtml
	new HTML([
		'<dl>',
			'<dt class="smallRadius lightBgColor whiteFont">{localTime}</dt>',
			'<dd>',
				'<ol></ol>',
			'</dd>',
		'</dl>'
	].join(""))
));

this.ChatListContent = (function(MessageGroup){
	function ChatListContent(selector){
		///	<summary>
		///	聊天列表内容区域。
		///	</summary>
		/// <param name="selector" type="string, element">对应元素选择器</param>
	};
	ChatListContent = new NonstaticClass(ChatListContent, "Bao.UI.Control.Chat.ChatListContent", Panel.prototype);

	ChatListContent.properties({
		appendMessageToGroup : function(msg){
			///	<summary>
			///	添加信息。
			///	</summary>
			/// <param name="msg" type="object">信息数据</param>
			var messageGroup = this.messageGroup;

			msg = set({
				color : this.color
			}, msg);

			// 如果 messageGroup 存在
			if(messageGroup){
				var messageList = messageGroup.messageList, i = messageList.length - 1;

				// 如果 i > -1，说明消息总数大于0
				if(i > -1){
					// 如果 最后一条信息的时间 与 当前信息的时间 相差5分钟
					if(msg.time - messageList[i].time > 300000){
						this.appendMessageGroup(msg);
						return;
					}
				}
			}
			else {
				this.appendMessageGroup(msg);
				return;
			}

			// 添加消息
			return messageGroup.appendMessage(msg);
		},
		appendMessageGroup : function(message){
			///	<summary>
			///	添加信息分组。
			///	</summary>
			var messageGroup = new MessageGroup(message.time);

			messageGroup.appendTo(this[0]);
			messageGroup.appendMessage(message);

			this.messageGroup = messageGroup;
			return messageGroup;
		},
		clearAllMessages : function(){
			this.innerHTML = "";
			this.messageGroup = undefined;
		},
		color : 0,
		messageGroup : undefined,
		resetColor : function(color){
			this.color = color;
		}
	});

	return ChatListContent.constructor;
}(
	this.MessageGroup
));

this.ChatInput = (function(messageCompletedEvent, reader){
	function ChatInput(selector){
		///	<summary>
		///	聊天输入。
		///	</summary>
		/// <param name="selector" type="string">对应元素选择器</param>
		var chatInput = this, imagePath = "",
		
			inputClassList = chatInput.classList;

		// 点击事件
		this.attach({
			userclick : function(e, targetEl){
				if(targetEl.between(">button", this).length > 0){
					// 移除或添加voice
					inputClassList.toggle("voice");

					// 如果有voice类，说明是语音输入状态
					if(inputClassList.contains("voice")){
						
						return;
					}
					return;
				}
			}
		});

		// 文本框事件
		this.find(">p>input").attach({
			keyup : function(e){
				if(e.keyCode === 13){
					messageCompletedEvent.setEventAttrs({
						message : {
							text : this.value,
							time : new Date().getTime(),
							type : "text"
						}
					});
					messageCompletedEvent.trigger(chatInput[0]);
					
					this.value = "";
					return;
				}
			}
		});

		// 选择文件事件
		this.find(">aside input").attach({
			change : function(){
				var file = this.files[0];

				if(!file){
					return;
				}

				if(!file.type.match(/^image\//)){
					alert("请选择图像文件！");
					this.value = "";
					return;
				}

				imagePath = this.value;
				reader.readAsDataURL(file);
				this.value = "";
			}
		});

		// 选择文件
		reader.onload = function(e){
			messageCompletedEvent.setEventAttrs({
				message : {
					attachment : {
						src : this.result,
						path : imagePath
					},
					text : "",
					time : new Date().getTime(),
					type : "image"
				}
			});
			messageCompletedEvent.trigger(chatInput[0]);
		};
	};
	ChatInput = new NonstaticClass(ChatInput, "Bao.UI.Control.Chat.ChatInput", Panel.prototype);

	return ChatInput.constructor;
}(
	// messageCompletedEvent
	new jQun.Event("messagecompleted"),
	// reader
	new FileReader()
));

this.ChatList = (function(ChatInput, ChatListContent, listPanelHtml){
	function ChatList(){
		///	<summary>
		///	聊天列表。
		///	</summary>
		var chatInput, chatListContent, chatList = this;
		
		this.combine(listPanelHtml.create({ isLeader : Global.loginUser.isLeader }));

		chatListContent = new ChatListContent(this.find(">article")[0]);
		chatInput = new ChatInput(this.find(">footer")[0]);
		
		this.assign({
			chatListContent : chatListContent
		});
		
		chatInput.attach({
			messagecompleted : function(e){
				var message = set({}, e.message), poster = set({}, Global.loginUser);

				poster.isLoginUser = true;

				set(message, {
					isPraisedBySelf : false,
					poster : poster
				});

				chatListContent.appendMessageToGroup(message);
			}
		});
	};
	ChatList = new NonstaticClass(ChatList, "Bao.UI.Control.Chat.ChatList", Panel.prototype);

	ChatList.properties({
		chatListContent : undefined
	});

	return ChatList.constructor;
}(
	this.ChatInput,
	this.ChatListContent,
	// listPanelHtml
	new HTML([
		'<div class="chatList">',
			'<article class="chatList_content" isleader="{isLeader}"></article>',
			'<footer class="chatList_footer inlineBlock">',
				'<button></button>',
				'<p>',
					'<button class="smallRadius">按住说话</button>',
					'<input class="smallRadius" type="text" placeholder="输入文字.." />',
				'</p>',
				'<aside>',
					'<button></button>',
					'<button>',
						'<input type="file" accept="image/*" />',
					'</button>',
				'</aside>',
			'</footer>',
		'</div>'
	].join(""))
));

Chat.members(this);
}.call(
	{},
	Bao.UI.Control.Chat,
	jQun.NonstaticClass,
	Bao.API.DOM.Panel,
	jQun.HTML,
	Bao.Global,
	jQun.set
));