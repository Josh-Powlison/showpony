M.editor = new function(){
	const E = this;
	E.window = window.open('','','width=500,height=300,location=0,menubar=0,status=0,toolbar=0,titlebar=0');
	//,left=' + S.window.offsetLeft + ',top=' + S.window.offsetTop
	E.rawText = null;
	
	
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
	
	function resizeThis(){
		var content = E.window.document.getElementById('content');
		content.style.height = '';
		content.style.height = content.scrollHeight + 16 + 'px';
		
		// FIX: TABS BREAK DISPLAY
		
		//Highlights
		var lines = E.rawText.split(/\r\n?|\n/);
		console.log(lines);
		var html = '';
		
		var canvas = document.createElement('canvas');
		var context = canvas.getContext('2d');
		context.font = '16px Courier';
		
		console.log("HIGHLIGHTS!!!");
		var yPos = 0;
		for(var i = 0; i < lines.length; i ++){
			var linesTall = 1;
			if(lines[i].length){
				// How many lines the text is estimated to take up
				linesTall = Math.ceil(context.measureText(lines[i]).width / E.window.document.getElementById('content').offsetWidth);
				// if(!linesTall) linesTall = 1;
				// console.log('Testing lines',E.window.document.getElementById('content').offsetWidth,context.measureText(lines[i]).width);
			}
			
			// console.log(lines[i],"Lines Tall ", linesTall);
			
			var color = null;
			
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
			}
			
			if(color){
				html += '<div style="top:' + (yPos * 16) + 'px;height:' + (linesTall * 16) + 'px;background-color:' + color + ';"></div>';
			}
			
			yPos += linesTall;
		}
		
		console.log("These highlights",html);
		
		E.window.document.getElementById('highlights').innerHTML = html;
	}
	
	E.window.document.getElementById('content').addEventListener('input',function(){
		E.rawText = this.value;
		resizeThis();
	});
	
	// Save
	E.window.document.getElementById('update').addEventListener('click',function(){
		// Update the file and push the changes to the user
		
		// Update the file
		
		// Update the text
		keyframes = parseFile(E.window.document.getElementById('content').value);
		
		M.src(M.currentFile, M.currentTime, M.window.dataset.filename, true);
	});
	
}();