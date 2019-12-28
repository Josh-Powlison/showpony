// FROM GOOGLE: https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String

S.wasm = null;

M.editor = new function(){
	const E = this;
	
	///////////////////////////////////////
	///////////PUBLIC VARIABLES////////////
	///////////////////////////////////////
	
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
				visibility:hidden;
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
			
			header{
				box-sizing:border-box;
				border:1px solid black;
				
				display:flex;
			}
			
			header p{
				margin:0;
			}
			
			header input{
				margin:0;
			}
			
			#file-duration{
				width:5em;
			}
			
			#file-quality{
				width:2em;
			}
			
			#resource-window{
				position:absolute;
				background-color:orange;
				height:6em;
				left:0;
				right:0;
				overflow:auto;
				z-index:1;
				
				resize:vertical;
				
				visibility:hidden;
			}
			
			#resource-list{
				height: 100%;
				clear: both;
				width: 100%;
			}
			
			#resource-list *{
				display:block;
				height:100%;
				max-width:100%;
				float:left;
			}
		</style>
	</head>
	<body>
		<header>
			<button id="export">Export</button>
			<button id="newFile">N</button>
			<button id="saveFile">S</button>
			<button id="autosave">AS</button>
			<p># <span id="file-number"></span></p>
			<p>T <input type="text" placeholder="File Name" id="file-title"></p>
			<p>R <input type="text" placeholder="YYYY-DD-MM HH-MM-SS" id="file-date"></p>
			<p>D <input type="number" placeholder="Duration" id="file-duration"></p>
			<p>Q <input type="number" placeholder="Quality" id="file-quality"></p>
		</header>
		<div id="track"></div>
		<div id="thing">
			<div id="data"></div>
			<pre id="content-sizing" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">Loading...</pre>
			<pre id="content-autocomplete" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"></pre>
			<div id="resource-window">
				<input id="resource-search" type="text">
				<button>Upload New</button>
				<div id="resource-list"></div>
			</div>
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
	
	E.line = 0;
	
	///////////////////////////////////////
	///////////PRIVATE VARIABLES///////////
	///////////////////////////////////////
	
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

	E.dataFragment = null;
	E.highlightFragment = null;
	
	E.prependString = '\0engine\0textbox\0image\0audio\0content\0remove\0mp3\0ogg\0';
	
	E.assets = E.window.document.getElementById('assets');
	E.resourceWindow = E.window.document.getElementById('resource-window');
	E.resourceSearch = E.window.document.getElementById('resource-search');
	var resourceList = E.window.document.getElementById('resource-list');
	E.data = E.window.document.getElementById('data');
	E.content = E.window.document.getElementById('content');
	E.contentSizing = E.window.document.getElementById('content-sizing');
	
	var autosave = false;
	
	var loadedAssets = false;
	
	///////////////////////////////////////
	///////////PUBLIC FUNCTIONS////////////
	///////////////////////////////////////
	
	E.update = function(input){
		E.content.value = input;
		// console.log('hello, set to ',M.currentFile);
		
		// console.log(contentSizing.getClientRects());
		
		new Promise((resolve, reject) => {
			if(!loadedAssets){
				// Load resource list
				fetch('showpony/fetch-resource-list.php?path=<?php echo STORIES_PATH; ?>')
				.then(response => response.text())
				.then(text => {
					// console.log(text);
					var resourceObj = JSON.parse(text);
					
					var frag = document.createDocumentFragment();
					
					var title = document.createElement('p');
					// title.innerHTML = helpText;
					title.innerHTML = 'Testing';
					frag.appendChild(title);
					
					for(var i = 0; i < resourceObj.length; i ++){
						var resource;
						
						// Check the file type
						switch(/[^\.]+$/.exec(resourceObj[i])[0]){
							case 'wav':
							case 'mp3':
							case 'ogg':
								resource = document.createElement('audio');
								resource.src =  '<?php echo STORIES_PATH; ?>/resources/' + resourceObj[i];
								resource.controls = true;
								break;
							case 'jpg':
							case 'jpeg':
							case 'png':
							case 'svg':
							case 'gif':
								resource = document.createElement('img');
								resource.src = '<?php echo STORIES_PATH; ?>/resources/' + resourceObj[i];
								break;
							default:
								resource = null;
								break;
						}
						
						// If it's a supported resource type
						if(resource){
							resource.dataset.path = resourceObj[i].replace(/\.png$/,'');
							
							resource.addEventListener('click',function(){
								content.focus();
								
								var value = '';
								// Add a comma if needbe
								if(E.content.selectionStart > 0
									&& E.content.value[E.content.selectionStart - 1] !== ','
									&& E.content.value[E.content.selectionStart - 1] !== '\t'
								) value += ','
								
								var regex = new RegExp('^' + E.resourceSearch.dataset.component);
								
								// Set either a relative or absolute path for the resource
								var path = this.dataset.path.replace(regex,'');
								if(path === this.dataset.path) value += '/';
								
								value += path;
								
								// Add a comma if needbe
								if(E.content.selectionEnd < E.content.value.length - 1
									&& E.content.value[E.content.selectionEnd] !== ','
									&& E.content.value[E.content.selectionEnd] !== '\r'
									&& E.content.value[E.content.selectionEnd] !== '\n'
								) value += ','
								
								E.window.document.execCommand('insertHTML',false,value);
								// console.log('passed',this.dataset.path);
							});
							
							frag.appendChild(resource);
						}
					}
						
					resourceList.appendChild(frag);
					
					loadedAssets = true;
					
					resolve();
				});
			// We already loaded the asset list
			} else resolve();
		})
		// If we just finished loading WASM or already loaded it previously
		.then(()=>{
			// Update file info at top
			E.window.document.getElementById('file-number').innerHTML = M.currentFile + 1;
			E.window.document.getElementById('file-title').value = S.files[M.currentFile].title;
			
			var date = new Date(S.files[M.currentFile].release * 1000);
			E.window.document.getElementById('file-date').value = String(date.getUTCFullYear()).padStart(2,'0')
				+ '-' + String(date.getUTCMonth() + 1).padStart(2,'0')
				+ '-' + String(date.getUTCDate()).padStart(2,'0')
				+ '-' + String(date.getUTCHours()).padStart(2,'0')
				+ '-' + String(date.getUTCMinutes()).padStart(2,'0')
				+ '-' + String(date.getUTCSeconds()).padStart(2,'0')
			;
			
			E.window.document.getElementById('file-duration').value = S.files[M.currentFile].duration;
			E.window.document.getElementById('file-quality').value = S.files[M.currentFile].quality;
			
			// Put into buffer for WASM to read
			saveStringToBuffer(E.content.value);
			E.resizeThis();
		});
	}
	
	E.resizeThis = function(){
		
		E.content.style.height = '';
		E.content.style.height = E.content.scrollHeight + 16 + 'px';
		
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
		
		E.dataFragment = document.createDocumentFragment();
		E.highlightFragment = document.createDocumentFragment();
		
		// Read the file in WASM
		var totalLines = S.wasm.exports.readFile(M.currentLine);
		
		// Remove extra line numbers
		while(E.data.children[totalLines]) E.data.removeChild(E.data.children[totalLines]);
		
		// Add needed line numbers
		E.data.appendChild(E.dataFragment);
		
		var els = E.window.document.getElementsByClassName('highlight');
		for(var i = els.length - 1; i >= 0; i--){
			els[i].remove();
		}
		
		E.window.document.getElementById('thing').appendChild(E.highlightFragment);
	}
	
	E.saveFile = function(){
		// Update the file and push the changes to the user
		
		var formdata = new FormData();
		formdata.append('text',E.content.value);
		formdata.append('path',S.files[M.currentFile].path);
		formdata.append('type','save');
		formdata.append('fileCount',S.files.length);
		
		formdata.append('title'		, E.window.document.getElementById('file-title').value);
		formdata.append('date'		, E.window.document.getElementById('file-date').value);
		formdata.append('duration'	, E.window.document.getElementById('file-duration').value);
		formdata.append('quality'	, E.window.document.getElementById('file-quality').value);
		
		// Update the file
		fetch('showpony/editor.php',{
			method:'POST'
			,body:formdata
		})
		.then(response => response.text())
		.then(text => {
			reloadFiles(text);
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
			reloadFiles(text);
		});
	}
	
	///////////////////////////////////////
	///////////PRIVATE FUNCTIONS///////////
	///////////////////////////////////////

	function reloadFiles(input){
		// console.log(input);
		var editorJson = JSON.parse(input);

		// console.log('WHERE WE GET IT','showpony/fetch-file-list.php?path=<?php echo STORIES_PATH; ?>&lang=' + S.language);
		
		// Load the new file list
		fetch('showpony/fetch-file-list.php?path=<?php echo STORIES_PATH; ?>&lang=' + S.language)
		.then(response=>{return response.text();})
		.then(text=>{
			// console.log(text);
			
			var oldDuration = S.files[M.currentFile].duration;
			S.files = JSON.parse(text);
			
			// Set filenames in WASM
			var filenames = '';
			for(var i = 0; i < S.files.length; i ++){
				filenames += S.files[i].name;
				filenames += '\0';
			}
			
			filenames += '\0\0';
			
			saveStringToWASM(filenames);
			
			// Get duration from WASM function
			S.duration = S.wasm.exports.getDuration(-1);
			
			// Go to the newly created file
			for(var i = 0; i < S.files.length; i ++){
				if(S.files[i].name === editorJson.filename){
					if(i === M.currentFile){
						// If the duration changed, figure out where we should be
						var newTime = (M.currentTime / oldDuration) * S.files[i].duration;
						// console.log('new time is ',newTime);
						
						/// TODO: don't make this load twice. This, for now, reloads the keyframe, and updates the title
						keyframes = parseFile(E.content.value);
						to({file: i, time: newTime});
						M.src(i, newTime, M.window.dataset.filename, true);
					} else {
						to({file: i, time: 0});
					}
					return;
				}
			}
			
			// Otherwise, just go to the beginning of the replacing file
			to({file: M.currentFile});
			
			// Update the text
		})
		.catch(error=>{
			notice('Failed to reload file list. '+error);
		});
	}
	
	function saveStringToBuffer(str) {
		// Need the right amount of null chars to initiate correctly; otherwise everything will be off
		str = E.prependString + str + '\n\0';
		for(var i = 0, l = str.length; i < l; i++) {
			E.buffer[i] = str.charCodeAt(i);
		}
	}
	
	E.isDelimiter = function(a){
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
	
	E.jsAutocomplete = function(){
		/// AUTOCOMPLETE
		if(
			E.content.selectionStart
			&& E.content.selectionStart === E.content.selectionEnd
		){
			S.wasm.exports.autocomplete(E.content.selectionEnd);
		}
	}
	
	///////////////////////////////////////
	////////////EVENT LISTENERS////////////
	///////////////////////////////////////
	
	E.content.addEventListener('input',function(){
		if(this.value.length > 28000){
			alert('Maximum file character length exceeded! (28000)');
		}else{
			// Put into buffer for WASM to read
			saveStringToBuffer(this.value);
			
			E.resizeThis();
			
			// TODO: prevent running twice, because changeselection event runs now too
			E.jsAutocomplete();
			
			// If we're autosaving, save immediately
			if(autosave) E.saveFile();
		}
	});
	
	// Run shortcut keys on the player if alt is held down
	E.window.addEventListener(
		'keydown'
		,function(event){
			if(S.shortcutKeys(event,true)) event.preventDefault();
		}
	);
	
	// Close editor on closing showpony
	window.addEventListener('beforeunload',function(){E.window.close();})
	
	// Save file
	E.window.document.getElementById('saveFile').addEventListener('click',function(){
		E.saveFile();
	});
	
	// Create a new file
	E.window.document.getElementById('newFile').addEventListener('click',function(){
		E.newFile();
	});
	
	// On changing the selection, show input
	E.window.document.addEventListener('selectionchange',function(event){
		if(E.window.document.activeElement === E.content) E.jsAutocomplete();
	});
	
	E.window.addEventListener('resize',function(){
		if(S.wasm) E.resizeThis();
	});
	
	// Writing shortcut keys
	E.content.addEventListener(
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
					// Move to current line in story
					case 'q':
						//
						break;
					default:
						return;
						break;
				}
			// Normal key functions
			} else {
				switch(event.key){
					case 'Tab':
						var start = E.content.selectionStart;
						var end = E.content.selectionEnd;
					
						var tabsAdded = S.wasm.exports.tabLines(start,end);
						
						// Write the info in
						if(tabsAdded){
							// Reset cursor position
							E.content.selectionStart = E.content.selectionEnd = end + tabsAdded;
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
	
	// Toggle autosaving
	E.window.document.getElementById('autosave').addEventListener('click',function(){
		autosave = !autosave;
		
		this.style.backgroundColor = autosave ? 'green' : 'red';
	});
	
	E.resourceSearch.addEventListener('input',E.resourceRunSearch);
	
	E.resourceRunSearch = function(){
		var regex = new RegExp('^' + E.resourceSearch.value);
									
		// Show and hide the elements as needed
		var child = resourceList.children;
		for(var i = 0; i < child.length; i++){
			if(!regex.test(child[i].dataset.path)) child[i].style.display = 'none';
			else{
				// console.log('check',child[i].dataset.path,E.searchRegex);
				child[i].style.display = 'block';
			}
		}
	}
	
	E.window.document.getElementById('export').addEventListener('click',function(){
		// Update the file
		fetch('showpony/showpony.php?export=1&path=<?php echo STORIES_PATH; ?>')
		.then(response => response.text())
		.then(text => {
			console.log(text);
			E.window.alert('Export appears successful! (This feature is in beta)');
		});
	});
}();