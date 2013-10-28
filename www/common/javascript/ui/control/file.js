(function(File, NonstaticClass, StaticClass, HTML, Event, Panel, fullName){
this.ImageFile = (function(inputHtml, fileReader, imageLoadedEvent){
	function FileReader(){
		var FileReader = this;
		
		fileReader.onload = function(){
			imageLoadedEvent.setEventAttrs({
				file : FileReader.file,
				base64 : this.result
			});

			imageLoadedEvent.trigger(FileReader.fileElement);

			FileReader.file = undefined;
			FileReader.fileElement = undefined;
		};
	};
	FileReader = new StaticClass(FileReader);

	FileReader.properties({
		file : undefined,
		fileElement : undefined,
		read : function(file, element){
			this.file = file;
			this.fileElement = element;
			fileReader.readAsDataURL(file);
		}
	});

	function ImageFile(_selector){
		if(!_selector){
			this.combine(inputHtml.create());
		}

		this.attach({
			change : function(){
				var file = this.files[0];

				if(!file){
					return;
				}

				if(!file.name.match(/\.(png|jpg|jpeg|bmp|gif)$/)){
					alert("请选择图像文件！");
					this.value = "";
					return;
				}

				imagePath = this.value;
				FileReader.read(file, this);
				this.value = "";
			}
		});
	};
	ImageFile = new NonstaticClass(ImageFile, fullName("ImageFile"), Panel.prototype);

	return ImageFile.constructor;
}(
	// inputHtml
	new HTML('<input class="imageFile" type="file" accept="image/*" />'),
	// fileReader
	new FileReader(),
	// imageLoadedEvent
	new Event("imageloaded")
));

this.VoiceRecorder = (function(voiceHtml, Global, Voice, stopRecordEvent){
	function VoiceRecorder(_selector){
		var voiceRecorder = this;

		if(!_selector){
			this.combine(voiceHtml.create());
		}

		this.attach({
			touchstart : function(e){
				voiceRecorder.start();
			}
		}, true);

		jQun(window).attach({
			touchend : function(){
				voiceRecorder.stop();
			},
			touchcancel : function(){
				voiceRecorder.stop();
			}
		});
	};
	VoiceRecorder = new NonstaticClass(VoiceRecorder, fullName("VoiceRecorder"), Panel.prototype);

	VoiceRecorder.properties({
		isRecording : false,
		start : function(){
			if(this.isRecording)
				return;

			this.isRecording = true;
			Global.mask.fillBody("", true);
			Global.mask.show("voiceRecording");
			Voice.recordStart();
		},
		stop : function(){
			if(!this.isRecording)
				return;

			this.isRecording = false;
			Global.mask.hide();

			stopRecordEvent.setEventAttrs({
				voiceSrc : Voice.recordStop()
			});
			stopRecordEvent.trigger(this[0]);
		}
	});

	return VoiceRecorder.constructor;
}(
	// voiceHtml
	new HTML('<button class="voiceRecorder"></button>'),
	Bao.Global,
	Bao.API.Media.Voice,
	// stopRecordEvent
	new Event("stoprecord")
));

this.Attachment = (function(ImageFile, VoiceRecorder, attachmentHtml, attchmentCompletedEvent){
	function Attachment(){
		var attachment = this;

		this.combine(attachmentHtml.create());

		new VoiceRecorder().appendTo(this.find('li[atype="voice"]')[0]);
		new ImageFile().appendTo(this.find('li[atype="image"]')[0]);

		this.attach({
			imageloaded : function(e){
				attachment.completed("image", e.file);
			},
			stoprecord : function(e){
				attachment.completed("voice", e.voiceSrc);
			}
		});
	};
	Attachment = new NonstaticClass(Attachment, fullName("Attachment"), Panel.prototype);

	Attachment.properties({
		completed : function(type, src){
			attchmentCompletedEvent.setEventAttrs({
				attachmentType : type,
				attachmentSrc : src
			});
			attchmentCompletedEvent.trigger(this[0]);
		}
	});

	return Attachment.constructor;
}(
	this.ImageFile,
	this.VoiceRecorder,
	// attachmentHtml
	new HTML([
		'<div class="attachment">',
			'<ul class="inlineBlock lightBdColor smallRadius">',
				'<li class="lightBdColor" atype="voice"></li>',
				'<li class="lightBdColor" atype="image"></li>',
				'<li class="lightBdColor" atype="map"></li>',
			'</ul>',
		'</div>'
	].join("")),
	// attchmentCompletedEvent
	new Event("attachmentcompleted")
));

File.members(this);
}.call(
	{},
	Bao.UI.Control.File,
	jQun.NonstaticClass,
	jQun.StaticClass,
	jQun.HTML,
	jQun.Event,
	Bao.API.DOM.Panel,
	// fullName
	function(name){
		return "Bao.UI.Control.File." + name;
	}
));