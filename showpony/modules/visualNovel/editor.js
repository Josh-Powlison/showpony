// FROM GOOGLE: https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String

function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint16Array(buf));
}


var instanceLive;	
var data;
var dataFragment;
var highlightFragment;
var contentSizing;
var minHeight;
var oneLineMaxChars;

var types = [
	''
	,'engine'
	,'set'
	,'get'
	,'comment'
	,'textbox'
	,'image'
	,'audio'
];

fetch('showpony/modules/visualNovel/script.wasm')
.then(response => response.arrayBuffer())
.then(bits => WebAssembly.compile(bits))
.then(module => new WebAssembly.Instance(module, {
	env:{
		jsLogString: function(position, length){
			var string = new Uint8Array(instanceLive.exports.memory.buffer, position, length);
			
			console.log('Log from WASM:','A:',string, 'B:',ab2str(string));
		}
		,jsLogInt: function(input){
			console.log('Log from WASM:',input);
		}
		,jsCreateLine: function(number,type,position,length){
			var string = ab2str(new Uint8Array(instanceLive.exports.memory.buffer, position, length));
			// console.log(string);
			// var string = '_';
			// console.log(string);
			
			// var height = null;

			var height;
			
			// If this is shorter than the total length that fits on one line, just get that height
			if(string.length <= oneLineMaxChars){
				height = minHeight;
			// Otherwise, calculate the line's height
			} else {
				contentSizing.innerText = (string.length ? string : '_');
			
				height = contentSizing.clientHeight;
				
				// Change the max length a line can be befoe spilling over; this can save us processing power
				if(height <= minHeight) oneLineMaxChars = string.length;
			}
			
			// Create line if it doesn't exist
			if(!data.children[number]){
				let test = document.createElement('p');
				test.innerHTML = number + 1;
				dataFragment.appendChild(test);
				test.className = types[type];
				test.style.height = height + 'px';
			}
			// Change line's class name if needbe
			else{
				data.children[number].className = types[type];
				data.children[number].style.height = height + 'px';
			}
			
			return height;
		}
		,jsCreateHighlight: function(top,height){
			// console.log('HIGHLIGHT',top,height);
			
			var highlight = document.createElement('div');
			highlight.className = 'highlight';
			
			highlight.style.top = top + 'px';
			highlight.style.height = height + 'px';
			// highlight.dataset.line = currentLine + '|' + i;

			// Current Line
			highlight.style.backgroundColor = 'rgba(0,255,0,.25)';
			highlight.style.zIndex = '-1';
			
			// Error
			// highlight.style.cssText = 'background-color:rgba(255,0,0,.25);z-index:-1;';
			
			highlightFragment.appendChild(highlight);
			// console.log(highlight);
		}
		/*
			Line number:
			Value:
			Name of the value:
		*/
		/*,jsLog: function(pointer, type, length){
			var memory = new Int32Array(instanceLive.exports.memory.buffer, position, length);
			switch(type){
				// INT
				case 8:
					console.log('WASM INT:',memory);
					break;
				// ARRAY
				case 16:
					var memory = new Int32Array(instanceLive.exports.memory.buffer, position, length);
					console.log('WASM ARR:',input);
					break;
				// STRING
				case 32:
					var memory = new Int32Array(instanceLive.exports.memory.buffer, position, length);
					console.log('WASM STR:',ab2str(input));
					break;
				case 64:
					break;
			}
		}*/
	}
}))
.then(instance => {
	instanceLive = instance;

	M.editor = new function(){
		const E = this;
		
		E.window = window.open('','','width=500,height=300,location=0,menubar=0,status=0,toolbar=0,titlebar=0');
		//,left=' + S.window.offsetLeft + ',top=' + S.window.offsetTop
		E.rawText = null;
		
		E.keyframePositions = [];
		
		E.window.document.write(`
		<!DOCTYPE html>
		<head>
			<title>Showpony Editor</title>
			<style>
				body{
					margin:0;
					padding:0;
				}
				
				#thing{
					width:100%;
					height:300px;
					overflow:auto;
					position:relative;
				}
				
				#data{
					position:absolute;
					width:4em;
					padding:0;
					padding-right:1em;
					left:0;
					
					
					background:none;
					
					font-size:16px;
					font-family:'Courier';
					border:0;
					box-shadow:none;
					
					line-height:16px;
					
					resize:none;
				}
				
				#data p{
					margin:0;
					text-align:right;
				}
				
				#content, #content-sizing, #content-autocomplete{
					position:absolute;
					margin:0;
					width:calc(100% - 5em);
					right:0;
					padding:0;
					
					background:none;
					
					font-size:16px;
					font-family:'Courier';
					border:0;
					box-shadow:none;
					
					line-height:16px;
					
					-moz-tab-size:4;
					tab-size:4;
					
					resize:none;
				}
				
				#content-sizing{
					pointer-events:none;
					visibility:hidden;
					
					white-space:-moz-pre-wrap;
					white-space:pre-wrap;
					word-wrap:break-word;
				}
				
				#content-autocomplete{
					pointer-events:none;
					opacity:.5;
					
					white-space:-moz-pre-wrap;
					white-space:pre-wrap;
					word-wrap:break-word;
				}
				
				#highlights{
					position:absolute;
					left:0;
					right:0;
					
					opacity:.2;
					
					pointer-events:none;
				}
				
				.highlight{
					position:absolute;
					left:0;
					right:0;
					
					pointer-events:none;
					
					height:1em;
				}
				
				/* Icons */
				.icon{
					height:1em;
					width:1em;
					
					display:inline-block;
					float:left;
				}
				
				.engine{
					background-color:yellow;
				}
				
				.audio{
					background-color:orange;
				}
				
				.image{
					background-color:#ccf;
				}
				
				.comment{
					background-color:#cfc;
				}
				
				.textbox{
					background-color:#ccc;
				}
				
				.set, .get{
					background-color:purple;
				}
			</style>
		</head>
		<body>
			<div id="track"></div>
			<div id="thing">
				<div id="data"></div>
				<pre id="content-sizing" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">Loading...</pre>
				<pre id="content-autocomplete" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">Test test test test</pre>
				<textarea id="content" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">Loading...</textarea>
				<div id="highlights"></div>
			</div>
			<button id="update">Update</button>
			<h1>In Scene</h1>
			<div id="assets"></div>
		</body>
		</html>
		`);
		
		console.log('WASM LOADED');
		var buffer = new Uint8Array(instance.exports.memory.buffer, instance.exports.getData(0), instance.exports.getLength());
		
		function saveStringToBuffer(str) {
			// Need the right amount of null chars to initiate correctly; otherwise everything will be off
			str = '\0engine\0textbox\0image\0audio\0content\0remove\0\0\0\0\0\0\0\0' + str + '\n\0';
			for(var i = 0, l = str.length; i < l; i++) {
				buffer[i] = str.charCodeAt(i);
			}
		}
		
		var assets = E.window.document.getElementById('assets');
		data = E.window.document.getElementById('data');
		
		contentSizing = E.window.document.getElementById('content-sizing');
		var content = E.window.document.getElementById('content');
				
		// We need to figure out the maximum size that can fit within a line; that can speed it up, vs calculating everything
		contentSizing.innerHTML = '<span id="letter-width">_</span>';
		var letterWidth = E.window.document.getElementById('letter-width').clientWidth;
		minHeight = contentSizing.clientHeight;
		
		var run = false;
		
		E.update = function(input){
			E.rawText = input;
			content.innerHTML = E.rawText;
			
			// Put into buffer for WASM to read
			saveStringToBuffer(content.value);
			
			E.resizeThis();
		}
		
		E.resizeThis = function(){
			// Don't bother if no text is passed
			if(E.rawText === null) return;
			
			content.style.height = '';
			content.style.height = content.scrollHeight + 16 + 'px';
			
			// Calculate the maximum number of characters on a line
			oneLineMaxChars	= Math.floor(content.innerWidth / letterWidth);
			
			/*
			
		X	4. Have a place showing the current objects and variables in the scene
			5. Have a section where can upload resources (audio, images, video).
				- In this section, can see/hear pieces stacked on
				- Will figure out potential displays based on folder names, and allow toggling images (for example, will display sub-folders of characters in same section, and allow toggling between) (I should probably just allow layering as many as desired, since not everyone will follow that structure exactly)
				
			Inkhana ideas:
			///////////////

			- Auto-indents with sensitivity to context so you don't have to manually position
				(which, after testing, I think is easy enough although I'm still thinking an optional auto-indent for writing dialogue would be great...haha)
			- Button to provide the formatting
		X	- Code suggestions as you type (including character names)
			- Syntax highlighting? (maybe not with Showpony's code)
			
			*/
			
			/// Clear Data
			
			/*while(assets.firstChild) assets.removeChild(assets.firstChild);
			
			
			/// ASSETS ///
			var objectKeys = Object.keys(objects);
			
			for(var i = 0; i < objectKeys.length; i++){
				var obj = document.createElement('p');
				obj.innerHTML = objectKeys[i] + ' (' + objects[objectKeys[i]].type + ')';
				assets.appendChild(obj);
			}
			
			// Variables
			var variableKeys = Object.keys(M.variables);
			
			for(var i = 0; i < variableKeys.length; i++){
				var input = document.createElement('input');
				input.value = M.variables[variableKeys[i]];
				assets.appendChild(input);
			}*/
			
			dataFragment = document.createDocumentFragment();
			highlightFragment = document.createDocumentFragment();
			
			// Read the file in WASM
			instance.exports.readFile(M.currentLine);
			
			data.appendChild(dataFragment);
			
			var els = E.window.document.getElementsByClassName('highlight');
			for(var i = els.length - 1; i >= 0; i--){
				els[i].remove();
			}
			
			E.window.document.getElementById('thing').appendChild(highlightFragment);
		}
		
		E.line = 0;
		
		content.addEventListener('input',function(){
			E.rawText = this.value;
			
			if(this.value.length > 28000){
				alert('Maximum file character length exceeded! (28000)');
			}else{
				// Put into buffer for WASM to read
				saveStringToBuffer(this.value);
				
				E.resizeThis();
				jsAutocomplete();
			}
		});
		
		function jsAutocomplete(){
			// console.log("SELECTION POSITION",content.selectionStart);
			// console.log(buffer);
			
			/// AUTOCOMPLETE
			if(
				content.selectionStart
				&& content.selectionStart === content.selectionEnd
			){
				var helpText = ab2str(new Uint8Array(instanceLive.exports.memory.buffer, instance.exports.autocomplete(content.selectionEnd), 10));
				var autocomplete = E.window.document.getElementById('content-autocomplete');
				
				// If we got passed a null chars
				if(helpText[0] === '\0'){
					autocomplete.style.visibility = 'hidden';
				// If there is text we can use
				}else{
					autocomplete.style.visibility = 'visible';
					autocomplete.innerHTML = helpText;
					autocomplete.style.top = yPos + 'px';
				}
			}
		}
		
		content.addEventListener('click',jsAutocomplete);
		
		E.window.addEventListener('resize',function(){
			E.resizeThis();
		});
		
		// Writing shortcut keys
		content.addEventListener(
			'keydown'
			,function(event){
				
				// console.log('testing');
				
				if(event.altKey || event.shiftKey || event.metaKey) return;
				
				// Ctrl key functions
				if(event.ctrlKey){
					switch(event.key){
						case 's':
							E.save();
							break;
						default:
							return;
							break;
					}
				// Normal key functions
				} else {
					switch(event.key){
						case 'Tab':
							console.log('Add tab');
							// E.window.document.execCommand('insertText',false,'\t');
							E.window.document.execCommand('insertText',false,'\t');
						break;
						default:
							return;
							break;
					}
				}
				event.preventDefault();
			}
		);
		
		// Save
		E.window.document.getElementById('update').addEventListener('click',E.save);
		
		E.save = function(){
			// Update the file and push the changes to the user
			
			// Update the file
			
			// Update the text
			keyframes = parseFile(content.value);
			
			M.src(M.currentFile, M.currentTime, M.window.dataset.filename, true);
		}
		
		// Close editor on closing showpony
		window.addEventListener('beforeunload',function(){E.window.close();})
	}();
});