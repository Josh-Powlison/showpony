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
			}
			
			#content{
				position:absolute;
				margin:0;
				width:100%;
				height:100%;
				
				font-size:16px;
				font-family:'Courier';
				border:0;
				box-shadow:none;
				padding:0;
				
				line-height:16px;
				
				-moz-tab-size:4;
				tab-size:4;
			}
			
			#highlights{
				position:absolute;
				left:0;
				right:0;
				
				opacity:.2;
				
				pointer-events:none;
			}
			
			#highlights div{
				position:absolute;
				left:0;
				right:0;
				
				height:1em;
			}
		</style>
	</head>
	<body>
		<div id="thing">
			<textarea id="content">Text text</textarea>
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
		
		
	}
	
	E.updateCurrentLine = function(line){
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
			
			// console.log(lines[currentLine],lineLength);
			
			if(lineLength){
				// How many lines the text is estimated to take up
				linesTall = Math.ceil((charWidth * lineLength) / E.window.document.getElementById('content').offsetWidth);
			}
			
			var color = null;
			
			// Check if this line counts- it's not blank space or part of a multiline comment
			if(!/^\s*$/.test(lines[i]) && !multilineComment){
				currentLine++;
				
				// Current Line
				if(currentLine === line){
					color = 'orange';
				}
				
				// See if the line is an obvious error
			}
			
			if(color){
				html += '<div style="top:' + (yPos * 16) + 'px;height:' + (linesTall * 16) + 'px;background-color:' + color + ';"></div>';
			}
			
			/*
			// Nothing
			if(lines[i].length == 0){}
			// Content
			else if(/(^[^\.]*|\.content)s+/.test(lines[i])){
				color = 'orange';
			}
			// Style
			else if(/\.style\s+/.test(lines[i])){
				color = 'blue';
			}
			// Variable
			else if(/[^\=]=\s+/.test(lines[i])){
				color = 'yellow';
			}*/
			
			
			
			yPos += linesTall;
		}
		
		E.window.document.getElementById('highlights').innerHTML = html;
	}
	
	E.window.document.getElementById('content').addEventListener('input',function(){
		E.rawText = this.value;
		resizeThis();
	});
	
	E.window.addEventListener('resize',resizeThis);
	
	// Save
	E.window.document.getElementById('update').addEventListener('click',function(){
		// Update the file and push the changes to the user
		
		// Update the file
		
		// Update the text
		keyframes = parseFile(E.window.document.getElementById('content').value);
		
		M.src(M.currentFile, M.currentTime, M.window.dataset.filename, true);
	});
	
	// Close editor on closing showpony
	window.addEventListener('beforeunload',function(){E.window.close();})
}();