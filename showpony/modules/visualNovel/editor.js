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
			
			.character{
				background-color:blue;
			}
			
			.comment{
				background-color:green;
			}
			
			.textbox{
				background-color:black;
			}
			
			.set, .comparison{
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
	
	var assets = E.window.document.getElementById('assets');
	var data = E.window.document.getElementById('data');
	
	var contentSizing = E.window.document.getElementById('content-sizing');
	
	E.update = function(input){
		E.rawText = input;
		E.window.document.getElementById('content').innerHTML = E.rawText;
		E.resizeThis();
	}
	
	var content = E.window.document.getElementById('content');
	
	// We need to figure out the maximum size that can fit within a line; that can speed it up, vs calculating everything
	contentSizing.innerText = 'l';
	var minHeight = contentSizing.clientHeight;
	var heightChars = [0];
	
	E.resizeThis = function(){
		content.style.height = '';
		content.style.height = content.scrollHeight + 16 + 'px';
		
		/*
		
	X	1. Everything should be centered around the text editor
	X	2. Show icons for object type besides its line
	X	3. Line numbers
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
		- Scene folding or something so you can collapse all but the live scene
		
		*/
		
		/// Clear Data
		
		// Objects
		var objectTypes = {};
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
		
		/// HIGHLIGHT LINES ///
		var lines = E.rawText.split(/\r\n?|\n/);
		
		// Track which line we correspond to
		var currentLine = -1;
		
		// Check if we're in a multiline comment
		var multilineComment = false;
		
		var highlightFragment = document.createDocumentFragment();
		
		var yPos = 0;
		
		for(var i = 0; i < lines.length; i ++){
			
			/*
				Can we trust heightChars as an array, or only for the first one?
				
				If only for the first one, we need to remove the arrays.
				
				It will get later values, and in checking those rather than calculating we'll get stuff being on one line but calculated as more lines.
				
				Maybe we need > max instead? Rather than < min? But that could still be wrong.
			*/
			
			var height = null;/*
			// Go through each calculated minHeight and find one
			for(var j = 0; j < heightChars.length; j++){
				// If the height isn't set in this value, break
				if(typeof(heightChars[j]) === 'undefined'){
					break;
				}
				
				// If we know the height already, get it
				if(lines[i].length <= heightChars[j]){
					height = minHeight * (j + 1);
					break;
				}
			}
			
			if(height === null){
				// clientHeight IS REALLY SLOW!!! It causes the whole thing to hang. So we estimate this only if we don't have a corresponding minHeight, and then set that immediately.*/
				contentSizing.innerText = lines[i] || 'l';
				height = contentSizing.clientHeight;
				/*
				// Overwrite or add the amount
				var x = Math.round((height / minHeight) - 1);
				console.log('Write to ',x,heightChars.length);
				if(x >= heightChars.length
					|| typeof(heightChars[x]) === 'undefined'
					|| height <= Math.round(height / minHeight))
				{
					heightChars[x] = lines[i].length;
				}
			}
			*/
			// Check if multiline comment starts
			if(/^\s*\/\*/.test(lines[i])){
				multilineComment = true;
			}
			
			var component	= null;
			var command		= null;
			var parameter	= null;
			var type		= null;
			
			// The styling of the highlight problem
			var style = null;
			
			// If a line is not empty
			if(!/^\s*$/.test(lines[i])){
				
				// Highlight multiline comments
				if(multilineComment){
					style = 'background-color:rgba(255,255,255,.5);z-index:1;';
				// Other lines
				}else{
					currentLine++;
					
					// Current Line
					if(currentLine === E.line){
						// console.log('LINE CHECK', M.lines[E.line]);
						style = 'background-color:rgba(0,255,0,.25);z-index:-1;';
					}
					
					/// ERROR CHECKING ///
					
					// Check if using spaces instead of tabs for separate command and parameter
					if(/^(?!\/{2,})[^\t]* /.test(lines[i])){
						style = 'background-color:rgba(255,0,0,.25);z-index:-1;';
					}
				}
			}else{
				type = '';
			}
			
			// Check if multiline comment ends
			if(/^\s*\*\/\s*$/.test(lines[i])){
				multilineComment = false;
			}
			
			/// AUTOCOMPLETE ///
			
			// Get current line
			var contentToNow = content.value.substr(0, content.selectionEnd);
			if(
				content.selectionStart === content.selectionEnd
				&& content.selectionStart
				&& i === (contentToNow.match(/\n/g) || '').length
			){
				var helpText = '';
				var match = /[^\n]*$/.exec(contentToNow)[0];
				
				if(match !== ''){
					// console.log('current line!', match);
					
					// See if there's something for us to autocomplete
					var keys = Object.keys(objectTypes).sort();
					for(var j = 0; j < keys.length; j++){
						// console.log('COMPARE',match,keys[j],new RegExp('^' + match));
						
						// If this key exists, don't bother passing autocomplete text
						if(match === keys[j]){
							helpText = '';
							break;
						}
						
						// See if it matches
						if(new RegExp('^' + match).test(keys[j])){
							if(helpText !== '' && helpText.length > keys[j]) continue;
							helpText = keys[j];
						}
					}
				}
				
				var autocomplete = E.window.document.getElementById('content-autocomplete');
				// console.log('SHOW',helpText);
				if(helpText === ''){
					autocomplete.style.visibility = 'hidden';
				}else{
					autocomplete.style.visibility = 'visible';
					autocomplete.innerHTML = helpText;
					autocomplete.style.top = yPos + 'px';
				}
			}
			
			/// READ STUFF ///
			
			// Replace all variables (including variables inside variables) with the right component
			var text = /(^[^\t\.\+\-=<>!]+)?\.?([^\t]+|[+\-=<>!]+)?\t*(.+$)?/.exec(lines[i]);
			
			// Skip comments
			if(/^\t*\/\//.test(text)){
				type = 'comment';
			}else if(type === null){
				component	= typeof(text[1]) !== 'undefined' ? text[1] : 'textbox';
				command		= typeof(text[2]) !== 'undefined' ? text[2] : 'content';
				parameter	= typeof(text[3]) !== 'undefined' ? text[3] : null;
				
				// Operations
				switch(command){
					case '=':
					case '+':
					case '-':
						type = 'set';
						break;
					case '==':
					case '<':
					case '>':
					case '<=':
					case '>=':
					case '!':
						type = 'comparison';
						break;
					default:
						// Continue; no operation command found
						break;
				}
				
				if(type === null){
					// Determine type
					if(objectTypes[component]) type = objectTypes[component];
					else{
						type = 'character';
						if(/\.mp3/i.test(parameter)) type = 'audio';
						
						if(component === 'textbox') type = 'textbox';
						else if(component === 'engine') type = 'engine';
					}
				}
				
				// Creating a new element using the engine command
				if(type === 'engine'){
					switch(command){
						case 'audio':
						case 'textbox':
						case 'character':
							component = parameter;
							type = command;
							command = null;

							// If the object already exists, show a warning
							if(objectTypes[component]){
								style = 'background-color:rgba(255,0,0,.25);z-index:-1;';
							}
							break;
						default:
							break;
					}
				}
				
				// Keep track of existing objects
				objectTypes[component] = type;
			}
			
			// Add style
			if(style){
				var highlight = document.createElement('div');
				highlight.className = 'highlight';
				highlight.style.top = yPos + 'px';
				highlight.style.height = height + 'px';
				highlight.dataset.line = currentLine + '|' + i;
				highlight.style.cssText += style;
				highlightFragment.appendChild(highlight);
			}
			
			/// LINE INFO ///
			if(data.children.length <= i){
				var lineData = document.createElement('p');
				lineData.innerHTML = i + 1;
				// dataFragment.appendChild(lineData);
				data.appendChild(lineData);
			}
			
			// Change height if needed
			if(data.children[i].style.height !== height + 'px'){
				data.children[i].style.height = height + 'px';
			}
			
			data.children[i].className = type;
			
			yPos += height;
		}
		
		console.log('TEST',heightChars,minHeight);
		
		while(data.children[lines.length]) data.removeChild(data.children[lines.length]);
		
		var els = E.window.document.getElementsByClassName('highlight');
		for(var i = els.length - 1; i > 0; i--){
			els[i].remove();
		}
		
		E.window.document.getElementById('thing').appendChild(highlightFragment);
	}
	
	E.line = 0;
	
	E.window.document.getElementById('content').addEventListener('input',function(){
		E.rawText = this.value;
		
		E.resizeThis();
	});
	
	E.window.addEventListener('resize',function(){
		heightChars = [0];
		E.resizeThis();
	});
	
	// Writing shortcut keys
	E.window.document.getElementById('content').addEventListener(
		'keydown'
		,function(event){
			
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
		keyframes = parseFile(E.window.document.getElementById('content').value);
		
		M.src(M.currentFile, M.currentTime, M.window.dataset.filename, true);
	}
	
	// Close editor on closing showpony
	window.addEventListener('beforeunload',function(){E.window.close();})
}();