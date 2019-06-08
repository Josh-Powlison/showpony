// FROM GOOGLE: https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String

function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint16Array(buf));
}

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

var data;
var dataFragment;
var highlightFragment;

M.wasm = null;

M.editor = new function(){
	var content;
	var assets;
	
	const E = this;
	
	E.window = window.open('','','width=500,height=300,location=0,menubar=0,status=0,toolbar=0,titlebar=0');
	//,left=' + S.window.offsetLeft + ',top=' + S.window.offsetTop
	
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
				height:90vh;
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
				
				border:none;
				outline:none;
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
				
				background-image:url('showpony/modules/visualNovel/icons.svg');
				background-size:cover;
			}
			
			/* Components */
			#assets div{
				border:solid black 1px;
			}
			#assets div p{
				margin:0;
			}
			
			.component{
				color:gray;
			}
			
			.component.active{
				color:black;
			}
			
		</style>
	</head>
	<body>
		<button id="newFile">New File</button>
		<button id="saveFile">Save File</button>
		<div id="track"></div>
		<div id="thing">
			<div id="data"></div>
			<pre id="content-sizing" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">Loading...</pre>
			<pre id="content-autocomplete" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"></pre>
			<textarea id="content" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">Loading...</textarea>
			<div id="highlights"></div>
		</div>
		<h1>In Scene</h1>
		<div id="assets">
			<div class="empty"></div>
			<div class="engine"></div>
			<div class="set"></div>
			<div class="get"></div>
			<div class="comment"></div>
			<div class="textbox"></div>
			<div class="image"></div>
			<div class="audio"></div>
		</div>
	</body>
	</html>
	`);
	
	var prependString = '\0engine\0textbox\0image\0audio\0content\0remove\0mp3\0ogg\0';
	
	function saveStringToBuffer(str) {
		// Need the right amount of null chars to initiate correctly; otherwise everything will be off
		str = prependString + str + '\n\0';
		for(var i = 0, l = str.length; i < l; i++) {
			E.buffer[i] = str.charCodeAt(i);
		}
	}
	
	assets = E.window.document.getElementById('assets');
	data = E.window.document.getElementById('data');
	
	content = E.window.document.getElementById('content');
	
	function isDelimiter(a){
		switch(a){
			case '\t':
			case '\r':
			case '\n':
			case '.':
			case '=':
			case '<':
			case '>':
			case '-':
			case '+':
			case '!':
			case ',':
			case '\/':
			case '\\':
			case '\0':
				return 1;
				break;
			default:
				return 0;
				break;
		}
	}
	
	var contentSizing = E.window.document.getElementById('content-sizing');
	
	E.update = function(input){
		content.innerHTML = input;
		// console.log('hello, set to ',M.currentFile);
		
		// console.log(contentSizing.getClientRects());
		
		new Promise((resolve, reject) => {
			if(M.wasm === null){
				// Load WASM
				fetch('showpony/modules/visualNovel/script.wasm')
				.then(response => response.arrayBuffer())
				.then(bits => WebAssembly.compile(bits))
				.then(module => new WebAssembly.Instance(module, {
					env:{
						jsLogString: function(position, length){
							var string = new Uint8Array(M.wasm.exports.memory.buffer, position, length);
							
							console.log('Log from WASM:','A:',string, 'B:',ab2str(string));
						}
						,jsLogInt: function(input){
							console.log('Log from WASM:',input);
						}
						,jsCreateLine: function(number,type,position,length){
							var string = ab2str(new Uint8Array(M.wasm.exports.memory.buffer, position, length));

							/*
							
							Ways to speed up:
								**- Only calculate new strings**
								- Anytime you type in something, it should just calculate new strings
								- Unless we resize the window, then it's really slow still...
								
								- Figure out what line the change took place on (if new line or pre-existing one)
									- If we're before that, ignore and respond with the default value
									- If we're on that line, recalculate its size
									- If we've added a line, update all lines based on previous value
								
								- Check line #(s, could be copy-paste to add or replace) where change(s) occurred
								- Look to see if lines were added
								- Just adjust those lines (and their highlights)
							*/
							
							contentSizing.innerText = (string.length ? string : '_');
							var height = contentSizing.clientHeight;
							
							var target;
							
							// Create line if it doesn't exist
							if(!data.children[number]){
								target = document.createElement('p');
								target.innerHTML = '<span class="icon"></span><span>' + (number + 1) + '</span>';
								dataFragment.appendChild(target);
							}
							// Change line's class name if needbe
							else{
								target = data.children[number];
							}
							
							// if(target.className !== types[type]) target.className = types[type];
							target.children[0].style.backgroundPosition = '50% ' + type + '0%';
							if(parseFloat(target.style.height) !== height) target.style.height = height + 'px';
							
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
						,jsRecommendation: function(position,length){
							var helpText = ab2str(new Uint8Array(M.wasm.exports.memory.buffer, position, length));
							var autocomplete = M.editor.window.document.getElementById('content-autocomplete');
							
							// console.log('hey');
							
							// If we got passed a null chars
							if(helpText[0] === '\0'){
								autocomplete.style.visibility = 'hidden';
							// If there is text we can use
							}else{
								var content = M.editor.window.document.getElementById('content');
								autocomplete.style.visibility = 'visible';
								autocomplete.innerHTML = helpText;
								
								// Get the line number
								var line = content.value.substr(0,content.selectionStart).match(/\n/g);
								// If no previous lines exist, get the first line.
								line = (line ? line.length : 0);
								// Get the top of the line number element
								var top = data.children[line].offsetTop;
								autocomplete.style.top = top + 'px';
							}
						}
						,jsDisplayObjects: function(position){
							// position returns the beginning of the array pointing to every component
							
							/// Clear Data
							for(var i = 0; i < assets.children.length; i++){
								var el = assets.children[i];
								while(el.firstChild) el.removeChild(el.firstChild);
							}
							
							var objArray = new Uint32Array(M.wasm.exports.memory.buffer, position, 50);
							// console.log(objArray);
							
							var fullData = prependString + content.value;
							
							// Test getting objects from WASM
							// console.log('///////////');
							for(var i = 0; i < 50; i ++){
								// Don't continue if we have no more objects
								if(objArray[i] === 0) break;
								
								// console.log('starts with ',content.value[objArray[i] - prependString.length]);
								var objInfo = new Uint32Array(M.wasm.exports.memory.buffer, M.wasm.exports.getObject(i), 2);
								
								/// ASSETS ///
								var obj = document.createElement('p');
								// Show if the object's currently active in the scene
								obj.className = 'component' + (objInfo[1] ? ' active' : '');
								
								// Get the length of the name, and display it
								var length = 0;
								for(length; length < 50; length++){
									if(isDelimiter(fullData[objArray[i] + length])) break;
								}
								
								obj.innerHTML = fullData.substr(objArray[i],length);
								assets.children[objInfo[0]].appendChild(obj);
							}
							
							// Get a list of all the objects
							// Read them out
							
							/*
							// Variables
							var variableKeys = Object.keys(M.variables);
							
							for(var i = 0; i < variableKeys.length; i++){
								var input = document.createElement('input');
								input.value = M.variables[variableKeys[i]];
								assets.appendChild(input);
							}*/
						}
						, jsOverwriteText: function(position, length){
							// Updates text while preserving undo/redo history
							content.focus();
							E.window.document.execCommand('selectAll',false);
							
							var el = document.createElement('p');
							el.innerText = ab2str(new Uint8Array(M.wasm.exports.memory.buffer, position, length));
							
							E.window.document.execCommand('insertHTML',false,el.innerHTML);
							// E.window.document.execCommand('insertText',false,ab2str(new Uint8Array(M.wasm.exports.memory.buffer, position, length)));
							
							// content.value = ab2str(new Uint8Array(M.wasm.exports.memory.buffer, position, length));
						}
					}
				}))
				.then(instance => {
					M.wasm = instance;
					
					console.log('WASM LOADED');
					M.editor.buffer = new Uint8Array(M.wasm.exports.memory.buffer, M.wasm.exports.getData(0), M.wasm.exports.getBufferLength());
					
					resolve();
				});
			// We already loaded WASM
			} else resolve();
		})
		// If we just finished loading WASM or already loaded it previously
		.then(()=>{
			// Put into buffer for WASM to read
			saveStringToBuffer(content.value);
			E.resizeThis();
		});
	}
	
	E.resizeThis = function(){
		
		if(M.wasm === null) return;
		
		content.style.height = '';
		content.style.height = content.scrollHeight + 16 + 'px';
		
		/*
		
		
		4. Have a place showing the current objects and variables in the scene
		5. Have a section where can upload resources (audio, images, video).
			- In this section, can see/hear pieces stacked on
			- Will figure out potential displays based on folder names, and allow toggling images (for example, will display sub-folders of characters in same section, and allow toggling between) (I should probably just allow layering as many as desired, since not everyone will follow that structure exactly)
		6. Only update line height when we change those lines
			
			
		Josh ideas:
		1. A shortcut to jump to the current line in the file
		2. A shortcut to move the story to the currently selected line in the file
			
		Inkhana ideas:

		- Button to provide the formatting
		- Syntax highlighting? (maybe not with Showpony's code)
		
		*/
		
		dataFragment = document.createDocumentFragment();
		highlightFragment = document.createDocumentFragment();
		
		// Read the file in WASM
		var totalLines = M.wasm.exports.readFile(M.currentLine);
		
		// Remove extra line numbers
		while(data.children[totalLines]) data.removeChild(data.children[totalLines]);
		
		// Add needed line numbers
		data.appendChild(dataFragment);
		
		var els = E.window.document.getElementsByClassName('highlight');
		for(var i = els.length - 1; i >= 0; i--){
			els[i].remove();
		}
		
		E.window.document.getElementById('thing').appendChild(highlightFragment);
	}
	
	E.line = 0;
	
	content.addEventListener('input',function(){
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
		// console.log(E.buffer);
		
		/// AUTOCOMPLETE
		if(
			content.selectionStart
			&& content.selectionStart === content.selectionEnd
		){
			M.wasm.exports.autocomplete(content.selectionEnd);
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
						E.saveFile();
						break;
					default:
						return;
						break;
				}
			// Normal key functions
			} else {
				switch(event.key){
					case 'Tab':
						var start = content.selectionStart;
						var end = content.selectionEnd;
					
						var tabsAdded = M.wasm.exports.tabLines(content.selectionStart,content.selectionEnd);
						
						// Write the info in
						if(tabsAdded){
							// Reset cursor position
							content.selectionStart = content.selectionEnd = end + tabsAdded;
						// If a tab was not passed, write it
						}else{
							E.window.document.execCommand('insertHTML',false,'\t');
						}
						
					break;
					default:
						return;
						break;
				}
			}
			event.preventDefault();
		}
	);
	
	// Save file
	E.window.document.getElementById('saveFile').addEventListener('click',function(){
		E.saveFile();
	});
	
	// Create a new file
	E.window.document.getElementById('newFile').addEventListener('click',function(){
		E.newFile();
	});
	
	E.saveFile = function(){
		// Update the file and push the changes to the user
		
		var formdata = new FormData();
		formdata.append('text',content.value);
		formdata.append('path',S.files[M.currentFile].path);
		formdata.append('type','save');
		formdata.append('fileCount',S.files.length);
		
		// Update the file
		fetch('showpony/editor.php',{
			method:'POST'
			,body:formdata
		})
		.then(response => response.text())
		.then(text => {
			// Update the text
			keyframes = parseFile(content.value);
			M.src(M.currentFile, M.currentTime, M.window.dataset.filename, true);
		});
	}
	
	E.newFile = function(){
		// Update the file and push the changes to the user
		
		var formdata = new FormData();
		formdata.append('type','new');
		formdata.append('path',S.files[M.currentFile].path);
		formdata.append('fileCount',S.files.length);
		
		// Update the file
		fetch('showpony/editor.php',{
			method:'POST'
			,body:formdata
		})
		.then(response => response.text())
		.then(text => {
			var editorJson = JSON.parse(text);

			// console.log('WHERE WE GET IT','showpony/fetch-file-list.php?path=<?php echo $_GET['path'] ?? ''; ?>&lang=' + S.language);
			
			// Load the new file list
			fetch('showpony/fetch-file-list.php?path=<?php echo $_GET['path'] ?? ''; ?>&lang=' + S.language)
			.then(response=>{return response.text();})
			.then(text=>{
				// console.log(text);
				
				S.files = JSON.parse(text);
				S.duration = S.files.map(function(e){return e.duration;}).reduce((a,b) => a+b,0);
				
				// Go to the newly created file
				for(var i = 0; i < S.files.length; i ++){
					if(S.files[i].name === editorJson.filename){
						S.file = i;
						break;
					}
				}
			})
			.catch(error=>{
				notice('Failed to reload file list. '+error);
			});
		});
	}
	
	// Run shortcut keys on the player if alt is held down
	E.window.addEventListener(
		'keydown'
		,function(event){
			if(S.shortcutKeys(event,true)) event.preventDefault();
		}
	);
	
	// Close editor on closing showpony
	window.addEventListener('beforeunload',function(){E.window.close();})
}();