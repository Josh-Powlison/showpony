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
		<div id="assets"></div>
	</body>
	</html>
	`);
	
	function saveStringToBuffer(str) {
		// Need the right amount of null chars to initiate correctly; otherwise everything will be off
		str = '\0engine\0textbox\0image\0audio\0content\0remove\0mp3\0\0\0\0' + str + '\n\0';
		for(var i = 0, l = str.length; i < l; i++) {
			E.buffer[i] = str.charCodeAt(i);
		}
	}
	
	assets = E.window.document.getElementById('assets');
	data = E.window.document.getElementById('data');
	
	content = E.window.document.getElementById('content');
	
	E.update = function(input){
		content.innerHTML = input;
		// console.log('hello, set to ',M.currentFile);
		
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
								- Add new lines in the middle (but then would still have to change innerHTML for tons of lines...
								- 
							
							*/
							
							var contentSizing = M.editor.window.document.getElementById('content-sizing');
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
					}
				}))
				.then(instance => {
					M.wasm = instance;
					
					console.log('WASM LOADED');
					M.editor.buffer = new Uint8Array(M.wasm.exports.memory.buffer, M.wasm.exports.getData(0), M.wasm.exports.getLength());
					
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
			
		Inkhana ideas:
		///////////////

		- Button to provide the formatting
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
		M.wasm.exports.readFile(M.currentLine);
		
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
						// CONVERT TO WASM (it's written in a way that will hopefully transfer easier)
						var tabs = '\t';
						
						// Loop through it (writing in a way where we could convert to WASM later)
						var dataD = content.value;
						
						var maxTabbedTo		= 0;
						var lineStart		= 0;
						var linePosition	= 0;
						var tabbed			= 0;
						
						for(var i = 0; i < dataD.length; i ++){
							switch(dataD[i]){
								case '\n':
								case '\r':
									lineStart = 0;
									linePosition = 0;
									tabbed = 0;
									continue;
									break;
								// Add tab spacing
								case '\t':
									// If we're tabbing in the parameter, ignore
									if(tabbed < 2){
										linePosition += (4 - (linePosition % 4)) || 4;
										tabbed = 1;
									}
									continue;
									break;
								case '\0':
									// Exit here
									break;
								default:
									
									break;
							}
							
							// Move position if we haven't tabbed yet
							if(!tabbed) linePosition++;
							else tabbed = 2;
							
							// If we're further along, and we've tabbed
							if(linePosition > maxTabbedTo && tabbed > 0) maxTabbedTo = linePosition;
						}
						
						// If we haven't selected a section, perform this action
						if(content.selectionStart === content.selectionEnd){
							// Default start to selection start
							var start = content.selectionStart;
							
							// Skip forward if we're on a tab though; we want to calculate how much tabbing to add to this line
							while(dataD[start] == '\t') start++;
							
							// Get the current line
							var lineText = /[^\n\r]+$/.exec(dataD.substr(0,start));
							
							// Get the result, or an empty string
							lineText = (lineText ? lineText[0] : '').replace(/\t/g,'1234');
							
							var length = Math.ceil((maxTabbedTo - lineText.length) / 4);
							
							for(var i = 1; i < length; i++){
								tabs += '\t';
							}
							
							E.window.document.execCommand('insertText',false,tabs);
						// If we've selected a section
						} else {
							var multiline = 0;
							
							// Check if it spans multiple lines
							for(var i = content.selectionStart; i < content.selectionEnd; i ++){
								if(dataD[i] == '\n' || dataD[i] == '\r'){
									multiline = 1;
									break;
								}
							}
							
							// If it spans multiple lines, we'll fix tabbing for them all
							if(multiline){
								var s = content.selectionStart;
								var e = content.selectionEnd;
								
								// console.log('text',dataD.substr(s,e-s));
								
								// Find the beginning of the first line
								while(s > 0 && dataD[s - 1] !== '\r' && dataD[s - 1] !== '\n') s--; 
								
								// Find the end of the last line
								while(e < dataD.length && dataD[e + 1] !== '\r' && dataD[e + 1] !== '\n') e++;
								
								linePosition = 0;
								lineStart = 0;
								tabbed = 0;
								
								// Get lines
								for(var i = s; i < e; i ++){
									switch(dataD[i]){
										case '\n':
										case '\r':
											lineStart = 0;
											linePosition = 0;
											tabbed = 0;
											continue;
											break;
										// Add tab spacing
										case '\t':
											// If we're tabbing in the parameter, ignore
											if(tabbed < 2){
												linePosition += (4 - (linePosition % 4)) || 4;
												tabbed = 1;
											}
											continue;
											break;
										case '\0':
											// Exit here
											break;
										default:
											break;
									}
									
									// Move position if we haven't tabbed yet
									if(tabbed == 0) linePosition++;
									else if(tabbed == 1){
										tabbed = 2;
										
										// Consider how many more tabs we need. Add them in.
										
										var length = Math.ceil((maxTabbedTo - linePosition) / 4);
										var tabsHere = '';
										// continue;
										
										for(var j = 0; j < length; j++){
											tabsHere += '\t';
										}
										
										console.log('tabs needed:',length);
										
										// Add in the extra tabs
										if(length > 0){
											console.log('Tabbing...');
											
											dataD = dataD.slice(0,i) + tabsHere + dataD.slice(i);
											// Skip ahead by the # of tabs we added
											i += length;
											e += length;
										}
									}
								}
								// E.window.document.execCommand('insertText',false,dataD);
								content.value = dataD;
							// Otherwise, just write a tab
							} else {
								E.window.document.execCommand('insertText',false,tabs);
							}
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
		fetch('showpony/modules/visualNovel/editor.php',{
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
		fetch('showpony/modules/visualNovel/editor.php',{
			method:'POST'
			,body:formdata
		})
		.then(response => response.text())
		.then(text => {
			var editorJson = JSON.parse(text);

			// Load the new file list
			fetch('showpony/fetch-file-list.php?path=<?php echo $_GET['path'] ?? ''; ?>&lang=' + S.language)
			.then(response=>{return response.json();})
			.then(json=>{
				S.files = json;
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
	
	// Close editor on closing showpony
	window.addEventListener('beforeunload',function(){E.window.close();})
}();