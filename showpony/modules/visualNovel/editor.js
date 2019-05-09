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
				width:3em;
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
			
			#content, #content-sizing{
				position:absolute;
				margin:0;
				width:90%;
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
		</style>
	</head>
	<body>
		<div id="track"></div>
		<div id="thing">
			<div id="data"></div>
			<pre id="content-sizing" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">Loading...</pre>
			<textarea id="content" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">Loading...</textarea>
			<div id="highlights"></div>
		</div>
		<button id="update">Update</button>
		<h1>In Scene</h1>
		<div id="assets"></div>
	</body>
	</html>
	`);
	
	E.update = function(input){
		E.rawText = input;
		E.window.document.getElementById('content').innerHTML = E.rawText;
		resizeThis();
	}
	
	// Get the length of a letter (it's monospace, so we're fine)
	var canvas = document.createElement('canvas');
	var context = canvas.getContext('2d');
	context.font = '16px Courier';
	var charWidth = context.measureText('_').width;
	
	function resizeThis(){
		var content = E.window.document.getElementById('content');
		content.style.height = '';
		content.style.height = content.scrollHeight + 16 + 'px';
		
		E.updateHighlights();
	}
	
	E.line = 0;
	
	var assets = E.window.document.getElementById('assets');
	var data = E.window.document.getElementById('data');
	
	var contentSizing = E.window.document.getElementById('content-sizing');
	
	E.updateHighlights = function(){
		
		/*
		
	X	1. Everything should be centered around the text editor
		2. Show icons for object type besides its line
	X	3. Line numbers
	X	4. Have a place showing the current objects and variables in the scene
		
		*/
		
		/// Clear Data
		
		// Objects
		while(assets.firstChild) assets.removeChild(assets.firstChild);
		
		// Line Info
		while(data.firstChild) data.removeChild(data.firstChild);
		
		/// ASSETS ///
		
		
		var assetHTML = '';
		
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
		}
		
		/// HIGHLIGHT LINES ///
		var lines = E.rawText.split(/\r\n?|\n/);
		// console.log(lines);
		var html = '';
		
		// Track which line we correspond to
		var currentLine = -1;
		
		// Check if we're in a multiline comment
		var multilineComment = false;
		
		var dataFragment = document.createDocumentFragment();
		var highlightFragment = document.createDocumentFragment();
		
		var yPos = 0;
		for(var i = 0; i < lines.length; i ++){
			
			contentSizing.innerText = lines[i];
			var height = contentSizing.clientHeight;
			
			// Check if multiline comment starts
			if(/^\s*\/\*/.test(lines[i])){
				multilineComment = true;
			}
			
			// Ignore empty lines
			if(!/^\s*$/.test(lines[i])){
				var style = null;
				
				// Highlight multiline comments
				if(multilineComment){
					style = 'background-color:rgba(255,255,255,.5);z-index:1;';
				// Other lines
				}else{
					currentLine++;
					
					// Current Line
					if(currentLine === E.line){
						style = 'background-color:rgba(0,255,0,.25);z-index:-1;';
					}
					
					/// ERROR CHECKING ///
					
					// Check if using spaces instead of tabs for separate command and parameter
					if(/^(?!\/{2,})[^\t]* /.test(lines[i])){
						style = 'background-color:rgba(255,0,0,.25);z-index:-1;';
					}
				}
				
				// Add style
				if(style){
					var highlight = document.createElement('div');
					highlight.className = 'highlight';
					highlight.style.top = yPos + 'px';
					highlight.style.height = height + 'px';
					highlight.dataset.line = currentLine + '|' + i;
					highlight.style.cssText += style;
					// console.log('highlight this',highlight,highlightFragment);
					highlightFragment.appendChild(highlight);
				}
			}
			
			// Check if multiline comment ends
			if(/^\s*\*\/\s*$/.test(lines[i])){
				multilineComment = false;
			}
			
			/// LINE INFO ///
			var lineData = document.createElement('p');
			lineData.innerHTML = i;
			if(height > 1) lineData.style.height = height + 'px';
			dataFragment.appendChild(lineData);
			
			yPos += height;
		}
		
		// Data HTML
		E.window.document.getElementById('data').appendChild(dataFragment);
		
		var els = E.window.document.getElementById('thing').children;
		for(var i = els.length - 1; i > 2; i--){
			els[i].remove();
		}
		
		E.window.document.getElementById('thing').appendChild(highlightFragment);
	}
	
	E.window.document.getElementById('content').addEventListener('input',function(){
		E.rawText = this.value;
		resizeThis();
	});
	
	E.window.addEventListener('resize',resizeThis);
	
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