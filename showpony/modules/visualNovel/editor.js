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
			
			#content{
				position:absolute;
				margin:0;
				width:100%;
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
		<div id="thing">
			<textarea id="content" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">Loading...</textarea>
			<div id="highlights"></div>
		</div>
		<button id="update">Update</button>
		<p>[Asset Manager]</p>
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
	E.updateHighlights = function(){
		//Highlights
		var lines = E.rawText.split(/\r\n?|\n/);
		// console.log(lines);
		var html = '';
		
		// Track which line we correspond to
		var currentLine = -1;
		
		// Check if we're in a multiline comment
		var multilineComment = false;
		
		var yPos = 0;
		for(var i = 0; i < lines.length; i ++){
			
			var linesTall = 1;
			var lineLength = 0;
			
			//Register actual line length (remember, we got a monospace font)
			for(var j = 0; j < lines[i].length; j ++){
				if(lines[i][j] === '\t') lineLength += 4 - (lineLength % 4);
				else lineLength ++;
			}
			
			if(lineLength){
				// How many lines the text is estimated to take up
				linesTall = Math.ceil((charWidth * lineLength) / E.window.document.getElementById('content').offsetWidth);
			}
			
			
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
					html += '<div class="highlight" style="top:' + (yPos * 16) + 'px;height:' + (linesTall * 16) + 'px;' + style + '" data-line="' + currentLine + '|' + E.line + '"></div>';
				}
			}
			
			// Check if multiline comment ends
			if(/^\s*\*\/\s*$/.test(lines[i])){
				multilineComment = false;
			}
			
			yPos += linesTall;
		}
		
		var els = E.window.document.getElementById('thing').children;
		for(var i = els.length - 1; i > 0; i--){
			els[i].remove();
		}
		
		E.window.document.getElementById('content').insertAdjacentHTML('afterend',html);
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
					default:				return;					break;
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