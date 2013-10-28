(function(Mask, NonstaticClass, StaticClass, HTML, Event, Panel, Global){
this.MaskButton = (function(buttonHtml, clickButtonEvent){
	function MaskButton(_action, _text, _autoClose){
		var maskButton = this;

		this.assign({
			action : _action,
			autoClose : _autoClose,
			text : _text
		});

		this.combine(buttonHtml.create(this));

		this.attach({
			userclick : function(){
				clickButtonEvent.setEventAttrs({ maskButton : maskButton });
				clickButtonEvent.trigger(maskButton[0]);
			}
		});
	};
	MaskButton = new NonstaticClass(MaskButton, "Bao.UI.Control.Mask.MaskButton", Panel.prototype);

	MaskButton.properties({
		action : "ok",
		autoClose : true,
		text : "确定"
	});

	return MaskButton.constructor;
}(
	// buttonHtml
	new HTML('<button class="smallRadius" action="{action}">{text}</button>'),
	// clickButtonEvent
	new Event("clickbutton")
));

this.Confirm = (function(MaskButton, bodyHtml){
	function Confirm(text, _buttons){
		var confirm = this;

		this.assign({
			text : text
		});

		this.combine(bodyHtml.create({ text : text }));
		new MaskButton("close", "", true).appendTo(this.find(">header")[0]);

		if(_buttons){
			var footerEl = this.find(">footer");

			_buttons.forEach(function(button){
				new MaskButton(button.action, button.text, button.autoClose).appendTo(footerEl[0]);
			});
		}

		this.attach({
			clickbutton : function(e){
				if(e.maskButton.autoClose){
					confirm.hide();
				}
			}
		});
	};
	Confirm = new NonstaticClass(Confirm, "Bao.UI.Control.Mask.Confirm", Panel.prototype);

	Confirm.override({
		hide : function(){
			Global.mask.hide();
			Panel.prototype.hide.call(this);
		},
		show : function(text, _buttons){
			var mask = Global.mask;

			mask.fillBody(this[0]);
			mask.show("confirm");
		}
	});

	Confirm.properties({
		text : ""
	});

	return Confirm.constructor;
}(
	this.MaskButton,
	// bodyHtml
	new HTML([
		'<div class="confirm">',
			'<header></header>',
			'<article class="whiteFont">{text}</article>',
			'<footer></footer>',
		'</div>'
	].join(""))
));

Mask.members(this);
}.call(
	{},
	Bao.UI.Control.Mask,
	jQun.NonstaticClass,
	jQun.StaticClass,
	jQun.HTML,
	jQun.Event,
	Bao.API.DOM.Panel,
	Bao.Global
));