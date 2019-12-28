new function(){
	const M			= this;
	
	M.currentTime	= null;
	M.currentFile	= null;
	M.currentLine	= null;
	M.lines			= null;
	M.loading		= 0; // Tracks how many items are currently loading
	M.variables		= {};
	M.editor		= null;
	
	M.window = document.createElement('div');
	console.log('START UP');
	// M.class (function call for the user) is based on the initial class name, set here.
	M.window.className = 'm-vn';
	M.window.dataset.filename = null;
	
	M.styles = document.createElement('style');
	M.styles.innerHTML = `<?php
		addslashes(readfile(__DIR__.'/styles.css'));
	?>`;
	
	M.subtitles = document.createElement('p');
	M.subtitles.className = 'm-vn-subtitles';
	M.window.appendChild(M.subtitles);
	
	var runTo=false;
	
	var continueNotice=document.createElement('div');
	continueNotice.className='m-vn-continue';
	
	var wait=false; //XXX
	
	// The elements in the vn
	var objects={};
	var target={};
	
	var keyframes=null;
	
	var timer=new function(){
		// Thanks to https://stackoverflow.com/questions/3969475/javascript-pause-settimeout

		const O=this;
		O.id;
		O.startTime;
		O.remaining=0;

		O.start=function(duration=O.remaining){
			if(duration<=0) return;
			O.remaining=duration;
			
			O.startTime=new Date();
			
			O.id=window.setTimeout(function(){
				O.remaining=0;
				M.run();
			},duration);
		}
		
		O.pause=function(){
			window.clearTimeout(O.id);
			if(O.remaining>0) O.remaining-=new Date()-O.startTime;
		}

		O.stop=function(){
			window.clearTimeout(O.id);
			O.remaining=0;
		}
	};
	
	M.play=function(){
		M.window.classList.remove('paused');
		// Go through audio elements that were playing- unpause them
		for(var name in objects){
			if(objects[name].playing){
				objects[name].play(true);
			}
		}
		
		// Play looping videos (that are used as images)
		var videos = M.window.querySelectorAll('video[data-state="visible"]');
		for(var i = 0; i < videos.length; i++){
			videos[i].play();
		}
		
		// Resume timer
		timer.start();
	}
	
	M.pause = function(){
		console.log('paused');
		M.window.classList.add('paused');
		
		// Go through objects that can be played- pause them, and track that
		for(var name in objects){
			if(objects[name].playing){
				objects[name].pause(true);
			}
		}
		
		// Pause looping videos (that are used as images)
		var videos = M.window.querySelectorAll('video');
		for(var i = 0; i < videos.length; i++){
			videos[i].pause();
		}
		
		// Pause timer
		timer.pause();
	}
	
	M.regress = function(){
		// Check if skipped over the current or most recent keyframe; we need to in order to regress
		var skipKeyframe = true;
		
		// Get the correct keyframe
		for(var i = M.currentLine - 1; i > 0; i--){
			var goTo = keyframes.indexOf(i);
			if(goTo !== -1){
				var lineText = M.lines[keyframes[goTo]];
				
				// Skip over comments
				if(/^\s*\/\//.test(lineText)) continue;
				
				// Skip a keyframe, whether it's the current one or most recent one
				if(!skipKeyframe){
					skipKeyframe = true;
					continue;
				}
				
				runTo = keyframes[goTo];
				M.run(0);
				return;
			}
		}
		
		if(M.currentFile>0) to({file:file - 1,time:'end'});
		else S.time = 0;
	}
	
	var skipping = false;
	
	M.progress = function(){
		// Finish all animations
		for(var name in objects) objects[name].el.dispatchEvent(new Event('animationend'));
		
		// If a continue notice exists, or if a timer was going, continue
		if(M.window.querySelector('.m-vn-continue') || timer.remaining > 0){
			return M.run();
		}
		
		// Display all letters immediately
		M.window.querySelectorAll('.m-vn-letter').forEach(function(letter){
			letter.style.animationDelay = null;
			letter.style.animation = 'initial';
			letter.style.visibility = 'visible';
		});
		
		// Set all textboxes to state they're done
		M.window.querySelectorAll('.m-vn-textbox[data-done="false"]').forEach(function(textbox){
			textbox.dataset.done='true';
		});
		
		skipping = true;
		junction();
	}

	// Parse a file correctly, and return the lines
	function parseFile(text){
		// Remove multiline comments
		text = text.replace(/\/\*[^]*?\*\//g,'');
		
		// Get all non-blank lines
		M.lines = text.match(/.+(?=\S).+/g);
		
		// Get keyframes from the waiting points in the text
		var keyframes = [];
		
		// Go through each line
		for(let i = 0; i < M.lines.length; i++){
			// Throw an error if too many keyframes crop up; we're likely creating an accidental infinite loop
			if(keyframes.length > 1000){
				notice("Error: likely recursion. Over 1000 keyframes read.");
				throw "ERROR: too many keyframes";
			}
			
			// Prevent recursion
			if(keyframes.length > 0 && keyframes.indexOf(i) !== -1){
				notice("Error: recursion detected. Revisited keyframe on line "+i+ " reading: "+M.lines[i]);
				return false;
			}
			
			// Look for keyframes
			if(/^engine\.wait\s*$/.test(M.lines[i])){
				keyframes.push(i);
				continue;
			}
			
			// Get "engine.go" keyframes, where possible (where not based on a variable)
			if(/^engine\.go/.test(M.lines[i])){
				var goTo = /\t+(.+)$/.exec(M.lines[i]);
				
				if(M.lines.indexOf(goTo[1]) !== -1) i = M.lines.indexOf(goTo[1]);
				continue;
			}
			
			// Add comments (messes with time display, disabled for now)
			/*if(/^\/\//.test(M.lines[i])){
				keyframes.push(i);
				continue;
			}*/
			
			// Text lines
			if(/^\t+/.test(M.lines[i])){
				// Ignore text lines that are appending
				// if(/^\t+\+/.test(M.lines[i])) continue;
				
				// See if it's part of a tag
				// Anything with a space we'll ignore; you should only have self-closing tags or closing tags at the end of the line
				
				// See if the line ends with an unescaped >; if so, don't add the line. The reason: if you're trying to go back, rapid appending lines can keep you from doing so (because they'll happen faster than you press back)
				if(M.lines[i][M.lines[i].length-1] === '>'){
					//See if it's an ending tag
					var test=document.createElement('div');
					test.innerHTML=M.lines[i];
					var text=test.innerText;
					
					//If it's not an ending tag
					if(text[text.length-1] === '>'){
						var skip=1;
						var j=M.lines[i].length-2;
						while(M.lines[i][j]==='\\'){
							skip*=-1;
							j--;
						}
						if(skip===1) continue;
					}
				}
				
				keyframes.push(i);
			}
		}
		
		return keyframes;
	}
	
	var srcId = 0;
	M.src = async function(file = 0,time = 0,filename = null,refresh = false){
		// If this is the current file
		if(M.window.dataset.filename === filename){
			// return true;
			
			// Get the last keyframe based on 'end'
			if(time === 'end'){
				var keyframeSelect = keyframes[keyframes.length - 1];
				time = S.files[file].duration * ((keyframes.length -1) / keyframes.length);
			// Get the keyframe based on time
			}else{
				var keyframeSelect=Math.floor(keyframes.length*(time/S.files[M.currentFile].duration));
				if(keyframeSelect>=keyframes.length) keyframeSelect=keyframes[keyframes.length-1];
				else keyframeSelect=keyframes[keyframeSelect];
			}
			
			// If this is the current keyframe, resolve
			if(keyframeSelect === M.currentLine && !refresh){
				content.classList.remove('loading');
				return true;
			}
			
			srcId ++;
			if(srcId > 255) srcId = 0;
			
			M.currentFile=file;
			M.currentTime=time;
			
			runTo = keyframeSelect;
			
			content.classList.remove('loading');
			M.run(0);
			S.displaySubtitles();
			return true;
		}
		
		srcId ++;
		if(srcId > 255) srcId = 0;
		
		var currentSrcId = srcId;
		
		return fetch(filename,{credentials:'include'})
		.then(response=>{if(response.ok) return response.text();})
		.then(text=>{
			if(currentSrcId !== srcId) return true;
			
			M.window.dataset.filename = filename;
			
			keyframes = parseFile(text);
			
			// Get the last keyframe based on 'end'
			if(time === 'end'){
				var keyframeSelect = keyframes[keyframes.length - 1];
				time = S.files[file].duration * ((keyframes.length -1) / keyframes.length);
			// Get a keyframe based on time
			}else{
				// Get the keyframe
				var keyframeSelect=Math.round(keyframes.length*(time/S.files[file].duration));
				if(keyframeSelect>=keyframes.length) keyframeSelect=keyframes[keyframes.length-1];
				else keyframeSelect=keyframes[keyframeSelect];
			}
			
			// Run to a keyframe if we need to
			runTo = keyframeSelect;
			
			content.classList.remove('loading');
			
			// Set file now so M.run knows
			M.currentFile=file;
			M.currentTime=time;
			
			// Update the editor
			if(M.editor){
				console.log('updated the editor');
				M.editor.update(text);
			}
			
			M.run(0);
			
			if(S.files[file].buffered!==true){
				S.files[file].buffered=true;
				getTotalBuffered();
			}
			
			S.displaySubtitles();
			
			return true;
		});
	}
	
	M.displaySubtitles=function(){
		// When an audio file updates its time, display subtitles for it
		if(subtitles === null
			|| !subtitlesAvailable[subtitles][M.currentFile]
		){
			M.subtitles.style.display='none';
			return;
		}
		
		var text='';
		
		var phrases=subtitlesAvailable[subtitles][M.currentFile];
		var keys=Object.keys(phrases);
		for(var i=0;i<keys.length;i++){
			
			// Get time in overall VN; time in element; 
			if(/^\d+$/.test(keys[i])) var checkTime=M.currentTime;
			else if(objects[keys[i]] && objects[keys[i]].type==='audio' && objects[keys[i]].playing){
				var checkTime=objects[keys[i]].el.currentTime;
			}else continue;
			
			// Continue if we're before the start- upcoming subtitles might be fore elements
			if(checkTime<timeToSeconds(phrases[keys[i]].start)) continue;
			
			// Continue if we're after the end
			if(checkTime>timeToSeconds(phrases[keys[i]].end)) continue;
			
			M.subtitles.innerHTML=phrases[keys[i]].content;
			M.subtitles.style.display='';
			return;
		}
		
		if(text){
			M.subtitles.innerHTML=phrase.content;
			M.subtitles.style.display='';
		}
		else{
			M.subtitles.style.display='none';
		}
	}
	
	M['=']	= function(a,b){return b;}
	M['+']	= function(a,b){return a + b;}
	M['-']	= function(a,b){return a - b;}
	M['==']	= function(a,b){
		// Use the variable if it's a variable (and not a value)
		var preValue = a;
		// console.log(a,b,M.variables,typeof(M.variables[a]) !== 'undefined');
		if(typeof(M.variables[a]) !== 'undefined') preValue = M.variables[a];
		
		// Test regex, if a regex was passed
		var regexTest = /^\/([^\/]+)\/(.)*$/.exec(b);
		// console.log(regexTest,a,b);
		if(regexTest !== null){
			// console.log("Regular expression ",a,b,regexTest);
			// console.log(M.variables);
			if(regexTest[2] != null){
				var regex = new RegExp(regexTest[1],regexTest[2]);
			}else{
				var regex = new RegExp(regexTest[1]);
			}
			
			// console.log('TEST THIS',regex,a,regex.test(String(a)));
			
			return regex.test(String(preValue));
		}
		
		return preValue == b;
	}
	M['<']	= function(a,b){return a < b;}
	M['>']	= function(a,b){return a > b;}
	M['<=']	= function(a,b){return a <= b;}
	M['>=']	= function(a,b){return a >= b;}
	M['!=']	= function(a,b){return a != b;}
	
	// SLOW AS SIN
	M.run = function(line = M.currentLine + 1){
		// This function either needs to be so fast that scrubbing is no issue, or to stop midway
		
		// return true;
		
		var currentSrcId = srcId;
		
		timer.stop();
		continueNotice.remove();
		M.currentLine = line;

		for(M.currentLine; M.currentLine < M.lines.length; M.currentLine++){
			// Exit if we're loading something new now
			if(currentSrcId !== srcId) return;
			
			// As long as the line returns true, use it
			if(!M.readLine(M.currentLine, M.lines[M.currentLine])) break;
		}
		// return true;
		
		// Update editor
		if(M.editor){
			M.editor.resizeThis();
		}
		
		
		if(runTo === 'ending') runTo = false;

		if(M.currentLine >= M.lines.length) S.file++;
	}
	
	M.readLine = function(lineNumber, text){
		
		// Replace all variables (including variables inside variables) with the right component
		var match;
		while(match = /[^\[]+(?=\])/g.exec(text)) text = text.replace('[' + match[0] + ']', M.variables[match[0]]);
		
		// console.log('TEXT HERE',text);
		
		text = /(^[^\t\.\+\-=<>!]+)?\.?([^\t]+|[+\-=<>!]+)?\t*(.+$)?/.exec(text);
		
		// Skip comments
		if(/^\t*\/\//.test(text)) return true;
		
		var component	= typeof(text[1]) !== 'undefined' ? text[1] : 'textbox';
		var command		= typeof(text[2]) !== 'undefined' ? text[2] : 'content';
		var parameter	= typeof(text[3]) !== 'undefined' ? text[3] : null;
		if(parameter === 'false')	parameter = false;
		if(parameter === 'true')	parameter = true;
		
		// Operations
		switch(command){
			case '=':
			case '+':
			case '-':
				M.variables[component] = M[command](
					ifParse(M.variables[component])
					,ifParse(parameter)
				);
				
				return true;
				break;
			case '==':
			case '<':
			case '>':
			case '<=':
			case '>=':
			case '!':
				console.log('what is passed',component,parameter);
			
				// If returns false, skip the next line
				if(!M[command](component,parameter)) M.currentLine++;
				
				return true;
				break;
			default:
				// Continue; no operation command found
				break;
		}
		
		if(command === 'go'){
			M.go(parameter);
			return true;
		}
		
		// Determine type
		if(objects[component]) var type = objects[component].type;
		else{
			var type = 'image';
			if(/\.(?:mp3|ogg|oga|wav|flac)/i.test(parameter)) type = 'audio';
			
			if(component === 'textbox') type = 'textbox';
			else if(component === 'engine') type = 'engine';
		}
		
		// Creating a new element using the engine command
		if(type === 'engine'){
			switch(command){
				case 'audio':
				case 'textbox':
				case 'image':
					component = parameter;
					type = command;
					command = null;
					break;
				default:
					break;
			}
		}
		
		
		// Run through if we're running to a point; if we're there or beyond though, stop running through
		if(runTo !== false && lineNumber >= runTo){
			M.loading++;
			
			// Reset the engine and delete unnecessary engine target info
			M.style(target.engine ? target.engine.style : null);
			M.class(target.engine ? target.engine.class : null);
			delete target['engine'];
			
			// Adjust everything based on the list
			
			// Get rid of objects that aren't in target
			for(var compObject in objects){
				if(!target[compObject]){
					objects[compObject].remove();
				}
				
			};
			
			// Go through each target; add nonexisting elements and update styles
			/// Todo: speed up this block
			for(var compTarget in target){
				// Make the remaining objects
				if(typeof(objects[compTarget])==='undefined'){
					new M[target[compTarget].type](compTarget);
				}
				// Reset the object's custom CSS (if it already existed)
				else{
					objects[compTarget].style(null);
					objects[compTarget].class(null);
					
					// Preload the files for this object
					if(S.file !== M.currentFile){
						objects[compTarget].preload();
					}
				}
				
				// Go through the object's functions and reset them to their base or passed values
				for(var commTarget in target[compTarget]){
					// Skip over "remove" function- we don't want to run that one :P
					if(commTarget==='remove') continue;
					
					// If playing but shouldn't loop: stop, don't play
					if(commTarget==='play' && (!target[compTarget].loop || target[compTarget].loop==='false')){
						objects[compTarget].stop();
						continue;
					}
					
					// If it's a function to run
					if(typeof(objects[compTarget][commTarget])==='function'){
						// console.log('Target: ' + compTarget + ', Function: ' + commTarget);
						// console.time('function');
						if(typeof(target[compTarget][commTarget])==='undefined'){
							objects[compTarget][commTarget]();
						}else{
							objects[compTarget][commTarget](target[compTarget][commTarget]);
						}
						// console.timeEnd('function');
					// If it's a value to set
					}else if(typeof objects[compTarget][commTarget] !== 'undefined'){
						objects[compTarget][commTarget]=target[compTarget][commTarget];
					// If it doesn't exist
					} else {
						notice('"' + compTarget + '" does not have a command called "' + commTarget + '"');
					}
				}
			}
			
			target={};

			runTo = 'ending';
			
			M.window.offsetHeight; // Trigger reflow to flush CSS changes
			M.loading--;
		}
		
		// If we're running through to a point, add the info to the target
		if(runTo !== false && runTo !== 'ending')
		{
			// Creating elements with the engine
			if(type !== 'engine'){
				if(!target[component]){
					target[component] = {
						'type':type
					};
					
					// Add necessary starting values based on what's passed
					if(type === 'audio') target[component].stop = null;
					else if(type === 'textbox') target[component].empty = null;
				}
			}else{
				if(!target[component]){
					target[component] = {
						'type':type
					};
				}
			}
			
			switch(command){
				case 'content':
					// If nothing was passed for the parameter
					if(parameter === null){
						console.log('Nothing was passed',component,command);
					// If we're all good
					} else {
						// Keyframes never end with >, so get rid of it if it's for automatically continuing
						if(parameter[parameter.length - 1] === '>'){
							//See if it's an ending tag
							var test=document.createElement('div');
							test.innerHTML=parameter;
							var text=test.innerText;
							
							//If it's not an ending tag
							if(text[text.length-1] === '>'){
								var skip=1;
								var j = parameter.length-2;
								while(parameter[j]==='\\'){
									skip*=-1;
									j--;
								}
								if(skip===1){
									parameter = parameter.substring(0,parameter.length - 1);
								}
							}
						}
					
						// Append textbox content if it starts with a "+" this time
						if(target[component].type === 'textbox'
							&& parameter[0] === '+'
						){
							target[component][command]+=parameter.replace(/^\+/,'');
							
							return true;
						}
					}
					break;
				
				case 'remove':
					delete target[component];
					return true;
					break;
					
				case 'empty':
					delete target[component].content;
					return true;
					break;
					
				case 'play':
				case 'pause':
				case 'stop':
					delete target[component].play;
					delete target[component].pause;
					delete target[component].stop;
					break;
					
				case 'go':
					// Go to the right line
					notice('Error: command ' + command + ' made it to an unexpected point in the code.');
					return false;
					break;
					
				case 'end':
				case 'event':
				case 'wait':
					// Don't do anything
					return true;
					break;
					
				case 'style':
					if(!target[component].style) target[component].style='';
				
					// Styles are appended; later ones will override earlier ones. Time is removed here; we don't want to affect that here.
					target[component].style+=parameter.replace(/time:[^;]+;?/i,'');
					
					return true;
					break;
				case null:
					return true;
					break;
				default:
					break;
			}
			
			target[component][command] = ifParse(parameter);
			
			// Continue without creating objects- we'll look at THAT once we've run through and added all the info to the target
			return true;
		}
		
		// Update the scrubbar if the frame we're on is a keyframe
		if(keyframes.includes(lineNumber) && M.currentFile !== null && S.file !== null){
			// See if the display time is within acceptable range; if so, don't update it (so users don't think it went to the wrong time)
			var thisKeyframe = keyframes.indexOf(lineNumber);
			var baseTime = (thisKeyframe/keyframes.length)*S.files[M.currentFile].duration;
			
			if(thisKeyframe + 1 < keyframes.length) var maxTime = ((thisKeyframe + 1)/keyframes.length)*S.files[M.currentFile].duration;
			else var maxTime = S.files[M.currentFile].duration + 1;
			
			if(M.currentTime < baseTime || M.currentTime >= maxTime){
				M.currentTime = baseTime;
				timeUpdate();
			}
		}
		
		// Engine command
		if(type==='engine') return M[command](parameter);
		
		// Create the object if it doesn't exist
		if(!objects[component]) new M[type](component);
		
		// If no command was passed, continue
		if(command === null) return true;
		
		// Run the object command and go to the next line if it returns true
		if(typeof objects[component][command] === 'function'){
			return objects[component][command](parameter);
		}
		// If a variable is passed, set to that instead
		else if (typeof objects[component][command] !== 'undefined'){
			objects[component][command] = ifParse(parameter);
			return true;
		} else {
			notice('"' + component + '" does not have a command called "' + command + '"');
			return false;
		}
	}
	
	// If a value's a number, return it as one
	function ifParse(input){
		// Check for true or false
		if(input === 'true' || input === true) return true;
		else if(input === 'false' || input === false) return false;
		
		// Check if it's a number, and parse it if it is (otherwise, it's a string)
		return isNaN(input) ? input : parseFloat(input);
	}
	
	M.go = function(input){
		var goTo = M.lines.indexOf(input);
		
		if(goTo === -1){
			notice('Error: tried to go to a nonexistent line labeled '+input);
			return false;
		} else {
			M.currentLine = M.lines.indexOf(input);
			return true;
		}
	}
	
	M.end = function(){
		S.file++;
		return false;
	}
	
	M.event = function(input){
		S.dispatchEvent(new CustomEvent(input));
		return true;
	}

	M.wait = function(input){
		// Wait until input
		if(input === null){
			wait = true;
			junction();
		}
		// Wait until time's up
		else {
			// If we're paused, continue instead of waiting for the timer
			if(paused) return true;
			
			timer.start(parseFloat(input) * 1000);
		}
		
		// Don't automatically go to the next line
		return false;
	}

	// STYLE and REMOVE are the same for every instance.
	
	// Pass new objects to this function to add common sub-functions
	function objectAddCommonFunctions(O){
		// Remove element
		O.remove=function(){
			O.el.remove();
			delete objects[O.name];
			
			return true;
		}
		
		var localStyle=document.createElement('style');
		O.el.appendChild(localStyle);
		var cssName=O.el.dataset.name.replace(/#/g,'id');
		
		// Adjust the styles, and add animations
		O.style=function(style=null){
			// If no styles are passed, remove all added styles
			if(style===null){
				O.el.style.cssText='';
				localStyle.innerHTML='';
				return true;
			}
			
			var animationSpeed=/time:[^s;$]+/i.exec(style);
			
			// Add back in to support multiple objects sharing the same file set
			
			// If running to or not requesting animation, add styles without implementing animation
			if(animationSpeed===null || runTo!==false || paused){
				localStyle.innerHTML='';
				
				O.el.style.cssText+=style;
			}else{
				localStyle.innerHTML='@keyframes '+cssName+'{100%{'+style+'}}';
				
				O.el.style.animation=animationSpeed[0].split(':')[1]+'s forwards '+cssName;
			}
			
			return true;
		}
		
		var baseClass=O.el.className;
		O.class=function(className=''){
			if(className===null) className='';
			O.el.className=baseClass+' '+className;
			
			return true;
		}
		
		// Add the animation end function
		O.el.addEventListener('animationend',function(event){
			if(this!==event.target) return;
			
			var styleAdd=/[^{]+;/.exec(new RegExp('@keyframes '+cssName+'{100%{[^}]*}}','i').exec(localStyle.innerHTML));
			
			if(styleAdd) this.style.cssText+=styleAdd[0];
			this.style.animation=null;
		});
	}
	
	// Read window as "engine" object
	M.type = 'engine';
	
	M.el = M.window;
	M.window.dataset.name = 'engine';
	M.name = 'engine';
	
	objectAddCommonFunctions(M);
	
	// Right now, we don't worry about whether or not audio is fully loaded; we don't track that. So audio could be long, and streamed; or even hitch a bit, and we wouldn't prevent the player from running through the KN/VN.
	M.audio = function(input){
		objects[input] = this;
		const O = this;
		O.type = 'audio';
		
		O.el = document.createElement('audio');
		// O.el.preload = true;
		O.el.dataset.name = input;
		O.name = input;
		// M.window.appendChild(O.el);
		
		O.filepath = 'audio/';
		
		O.track = [[]];
		
		// Checks if was playing outside of pausing the Showpony
		O.playing = false;
		
		O.content = function(input){
			// Audio level
			// Get the audio names passed (commas separate layers)
			var fileNames = input.split(',');
			
			// If no extension is specified, assume mp3
			var name = input;
			
			if(O.el.dataset.file === name) return true;
			
			// layersUpdated is an array of promises 
			var layersUpdated = [];
			
			//Convert string to an array that Looper can use
			var layers = input.split(',');
			for(let i = 0; i < layers.length; i++){
				var files = layers[i].split('&');
				
				// Go through the layer's files
				for(let ii = 0; ii < files.length; ii++){
					// Clarify and skip null
					if(files[ii] == 'null'){
						files[ii] = null;
						continue;
					}
					
					// Root folder path
					if(files[ii][0] == '/') files[ii] = '<?php echo STORIES_PATH; ?>resources' + files[ii];
					else files[ii] = '<?php echo STORIES_PATH; ?>resources/audio/' + files[ii];
					
					// Add extension .mp3 if none is present
					if(!/\./.test(files[ii])) files[ii] += '.mp3';
				}
				
				// Update layer(s)
				layersUpdated.push(adjustLayer(i,files));
			}
			
			console.log('STATE OF PLAY',O.playing,O.autoplay,loopDuration);
			// Wait on all updates to load
			Promise.all(layersUpdated).then(()=>{
			// If we're supposed to be playing, but aren't, try using play again
				if(O.autoplay){
				console.log('We should tryy playing');
					O.play();
				}
			});
			
			O.el.dataset.file = name;
			
			return true;
		}
		
		function adjustLayer(layer,files){
			// If layer doesn't exist, add it
			if(!O.track[layer]) O.track[layer] = [];
			
			// Which item in the layer we're getting
			var item = O.currentBar % files.length;
			
			// Pause current layer
			for(var i = 0; i < O.track[layer].length; i++){
				
				// If the file currently playing won't change, don't pause it!
				let getOld = O.currentBar % O.track[layer].length;
				
				if(O.track[layer][getOld] === files[item]) continue;
				
				// If the source exists and isn't the same as the one that it's being set to, stop the old source
				var oldSource = sources[O.track[layer][i]];
				if(oldSource){
					try{ oldSource.stop(0); }
					catch { console.log('Dunno what Safari is doing, but this should keep things from breaking'); }
				}
			}
			
			console.log('WHAT FILES ARE WE LOADING',files,layer);
			
			// Once successfully load any not-loaded files, continue
			return O.load(files).then((values) => {
				console.log('LOOP DURATION',layer,values[0]);
				// If this is the first layer, then update the duration based on its first item
				if(!layer) loopDuration = values[0].duration * 1000;
				
				// Update the layer to match the files passed
				O.track[layer] = files;
				
				// Get the right filename to play
				console.log('PLAY ITEM',files,item);
				
				// Get the file to play
				var fileName = files[item];
				if(fileName == 'null') fileName = null;
				
				var offset = ((new Date().getTime() - timeStartedLoop)/1000) || 0;
				
				// Play the buffer midway (as long as we're not supposed to have a gap here)
				if(O.playing && fileName !== null) playBuffer(fileName,offset);
				
				return true;
			});
		}
		
		O.play = function(fromMenu){
			if(fromMenu) return;
			
			// The menu tried to play us
			
			// If we came from the menu and aren't actually set to be playing
			// if(fromMenu && O.playing !== true){
				// return;
			// }
			
			// We were paused
			
			// We were stopped
			
			// Ignore this if we came from the menu; the menu pauses and plays, but doesn't track things the same way
			// if(S.paused) return;
			
			if(loopDuration === 0){
				O.autoplay = true;
				console.log('Setting autoplay to true so will start once loaded...');
				return true;
			}
			
			O.playing	= true;
			O.autoplay	= false;
			
			console.log('PAUSED?',paused);
			
			// If we're paused start playing again
			if(paused > 0){
				
				// Start up the interval based on pause time
				O.context.resume().then(()=>{
					startTimeout(loopDuration - paused);
					// startTimeout(O.context.currentTime % O.duration);
					
					// Estimate how far into the loop we are
					timeStartedLoop = new Date().getTime() - paused;
					
					paused = 0;
				});
				return true;
			}
			
			//If we're playing, exit
			if(loopTimeout!==null){
				return;
			}
			
			console.log('ABOUT TO CALL STARTTIMEOUT');
			startTimeout();
			O.currentBar = 0;
			playLoop();
			
			return true;
		}
		
		O.pause = function(fromMenu){
			if(fromMenu) return;
			
			//If we're already paused, don't do it!
			if(paused > 0) return;
			
			// Paused is set based on how far into the loop we are, so we start the next timeout in good time
			paused = 0;
			
			O.context.suspend().then(() => {
				paused = new Date().getTime() - timeStartedLoop;
				clearTimeout(loopTimeout);
			});
			
			return true;
		}
		
		O.stop = function(){
			O.playing = false;
			
			for(var file in sources){
				try{ sources[file].stop(0); }
				catch { console.log('Dunno what Safari is doing, but this should keep things from breaking'); }
			}
			
			clearTimeout(loopTimeout);
			loopTimeout		= null;
			O.currentBar	= 0;
			paused			= 0;
			
			return true;
		}
		
		// Other
		
		O.preload = function(){}
		
		// O.el.addEventListener('ended',function(){
			// if(!O.el.loop) O.playing = false;
		// });
		
		// O.el.addEventListener('timeupdate',function(){
			// S.displaySubtitles();
		// });
		
		// function loadingError(e){
			// notice('Error loading ' + e.target.dataset.file);
		// }
		
		// We don't add objectAddCommonFunctions(O) because we don't need it. We do need placeholders though.
		
		O.style = function(){};
		O.class = function(){};
		
		O.remove = function(){
			clearTimeout(loopTimeout);
			O.context.close();
			O.stop();
			
			delete objects[O.name];
			
			return true;
		}
		
		
		//// LOOPER CODE
		
		// Looper isn't recommended for audio files >45 seconds.
		// Except I've changed latencyHint, and we can change sampleRate to see how this goes!

		//Test from https://stackoverflow.com/questions/29373563/audiocontext-on-safari
		var AudioContext = window.AudioContext // Default
		|| window.webkitAudioContext;
		
		O.context = new AudioContext({
			latencyHint:	'playback'//, // "interactive" for more power consumption but more on-point; "balanced" is in the middle. I'm prioritizing low resource consumption here.
			// sampleRate:		44100	// We can lower this for increased performance at the cost of audio quality. If it's off, the best sampleRate will be decided based on the device.
		});
		
		O.currentBar = 0;
		
		// User values
		O.bars = 1;								// How many bars the Looper has (a bar is the length of the first element in the first layer)
		O.repeatFrom = 0;						// Where to repeat from once finish
		O.loop = false;							// Whether to loop
		O.autoplay = input.autoplay || false;	// Whether to automatically play on loading
		
		var loopTimeout = null;
		var buffer = {};
		var sources = {};
		var loopDuration = 0;
		var paused = 0;							// 0 if unpaused; a number of how far into the loop we are; -1 if in the process of pausing
		var timeStartedLoop;
		
		// Load files from an array
		O.load = function(files){
			var promises = [];
			
			// BUFFER FILES //
			for(var i = 0; i < files.length; i++){
				//Skip null
				if(files[i] === null) continue;
				
				// Get all listed files (if we have random choices)
				var fileChoices = files[i].split('||');
				for(var ii = 0; ii < fileChoices.length; ii++){
					// Skip null files
					if(fileChoices[ii] === null) continue;
					
					// Get all the files
					let fileName = fileChoices[ii];
				
					// Skip over buffered and buffering tracks
					if(buffer[fileName]) continue;

					buffer[fileName] = 'LOADING';
				
					promises.push(
						new Promise(function(resolve,reject){
							fetch(fileName)
							.then(response => response.arrayBuffer())
							.then(file => {
								O.context.decodeAudioData(file,function(info){
									buffer[fileName] = info;
									console.log('WE HAVE LOADED:',fileName);
									resolve(info);
								},reject);
							})
						})
					);
				}
			}
			
			//Return a promise with the info
			return Promise.all(promises);
		}
		
		// Removing baseLatency is important
		function startTimeout(waitFor = (loopDuration - O.context.baseLatency)){
			console.log('Going to play the loop',O.currentBar,O.bars,waitFor,loopDuration,O.name);
			loopTimeout = setTimeout(function(){
				O.currentBar++;
				playLoop();
				startTimeout();
			},waitFor);
		}
		
		function playLoop(){
			timeStartedLoop = new Date().getTime();
			
			console.log('LOOP STARTED',timeStartedLoop,O.currentBar,O.bars,O.loop,O.track);
			
			console.log('Checking our loops',O.loop,O.currentBar,O.bars);
			// See if we've passed the number of bars
			if(O.currentBar >= O.bars){
				// If we're not looping, stop
				if(!O.loop){
					O.stop();
					return;
				}
				
				// If we're looping, go back to repeatFrom
				O.currentBar = O.repeatFrom;
			}
			
			// Play all layers
			for(var i = 0 , l = O.track.length; i < l; i++){
				
				var get = O.currentBar % O.track[i].length;
				
				var item = O.track[i][get];
				
				// Skip null items
				if(item === null) continue;
								
				//Skip over unbuffered files as a safeguard
				if(!buffer[item] || buffer[item] === 'LOADING'){
					console.log('CONTINUING');
					continue;
				}
				
				playBuffer(item);
			}
		}
		
		O.volume = function(){};
		
		function playBuffer(fileName,offset = 0){
			if(buffer[fileName]){
				var source			= O.context.createBufferSource();
				source.buffer		= buffer[fileName];
				source.connect(O.context.destination);
				console.log('FILE',fileName,offset);
				source.start(0,offset);
				
				// Track sources
				sources[fileName]	= source;
			}else{
				console.log("Sought buffer doesn't exist! Likely a song tried to be played before loading.",fileName);
			}
		}
	}
	
	M.image = function(input){
		objects[input] = this;
		const O = this;
		O.type = 'image';
		
		O.el = document.createElement('div');
		O.el.className = 'm-vn-character';
		O.el.dataset.name = input;
		O.name = input;
		
		O.filepath = 'images/'+O.name+'/';
		O.ext = '.png';
		
		M.window.appendChild(O.el);

		O.content = function(input, preload = false){
			// Character level
			// Get the image names passed (commas separate layers)
			var imageNames = input.split(',');
		
			// Layer level
			// Go through each passed image and see if it exists
			for(var i = 0; i < imageNames.length; i++){
				// Layer is i+1 because 0 is the style tag
				var layer = i + 1;
				
				var resource = imageNames[i];
				// If no extension, assume png
				if(!/\./.test(resource)) resource += O.ext;
				
				var ext = resource.slice((resource.lastIndexOf(".") - 1 >>> 0) + 2);
				
				// If the layer doesn't exist, add it!
				if(!O.el.children[layer]){
					O.el.appendChild(document.createElement('div'));
				}
				
				// If the resource doesn't exist, add it!
				if(!O.el.children[layer].querySelector('[data-file="'+resource+'"]')){
					M.loading++;
					
					// Add a layer video
					if(ext === 'mp4' || ext === 'webm'){
						var el = document.createElement('video');
						el.addEventListener('canplay',loadingSuccess);
						
						el.loop = true;
						el.preload = true;
						el.disableRemotePlayback = true;
					// Add a layer image
					} else {
						var el = document.createElement('img');
						el.addEventListener('load',loadingSuccess);
					}
					
					el.addEventListener('error',loadingError);
					
					el.className = 'm-vn-character-image';
					el.dataset.file = resource;
					el.dataset.state = 'hidden';
					
					// Can go to the root of the website, or from the current path
					if(resource[0] === '/') el.src = '<?php echo STORIES_PATH; ?>resources' + resource;
					else el.src = '<?php echo STORIES_PATH; ?>resources/' + O.filepath + resource;
					
					O.el.children[layer].appendChild(el);
				}
				
				// Show and hide the correct images if we're done preloading
				if(!preload){
					var resources = O.el.children[layer].children;
					for(var ii = 0; ii < resources.length; ii++){
						var display = (resources[ii].dataset.file === resource) ? 'visible' : 'hidden'
						resources[ii].dataset.state = display;
						
						// If it's a video and we're not paused, consider whether to play or pause it
						if(!paused && resources[ii].tagName === 'VIDEO') resources[ii][display === 'visible' ? 'play' : 'pause']();
					}
				}
			}
			
			return true;
		}
		
		O.preload = function(){
			// Preload images
			for(let i = 0; i < M.lines.length; i++){
				var value = new RegExp(O.name + '(\s{3,}|\t+)(.+$)').exec(M.lines[i]);
				if(value) O.content(value[2],true);
			}
		}
		
		function loadingSuccess(e){
			M.loading--;
		}
		
		function loadingError(e){
			M.loading--;
			notice('Error loading ' + e.target.dataset.file);
		}
		
		objectAddCommonFunctions(O);
		
		O.preload();
	}
	
	M.textbox = function(input){
		objects[input] = this;
		const O = this;
		O.type = 'textbox';
		O.name = input;
		
		O.el = document.createElement('form');
		O.el.className = 'm-vn-textbox';
		O.el.dataset.name = input;
		O.el.dataset.state = 'hidden';
		O.el.dataset.done = 'true';
		O.target = null;
		
		O.el.addEventListener('submit',function(event){ 
			// Focus again on the window so keyboard shortcuts work
			view.focus();
			
			event.preventDefault();
			
			if(O.el.checkValidity()){
				O.el.dataset.done = 'true';
				if(O.target === null) M.run();
				else{
					M.run(O.target);
					O.target = null;
				}
			}
		});
		
		M.window.appendChild(O.el);
		
		O.empty = function(){
			O.el.dataset.state = 'hidden';
			O.el.dataset.done = 'true';
			while(O.el.firstChild) O.el.removeChild(O.el.firstChild);
			return true;
		}
		
		O.defaultWaitTime	= .03;
		O.defaultConstant	= false;
		O.defaultAnimation	= 0;
		O.defaultWait		= true;
		
		var charElement = document.createElement('span');
		charElement.className = 'm-vn-letter-container';
		
		var lastLetter;
		
		O.content = function(input = 'NULL: No text was passed.'){
			O.el.dataset.state = 'normal';
			O.el.dataset.done = 'false';
			
			wait = O.defaultWait; // Assume we're waiting at the end time, unless otherwise set //XXX
			
			var fragment = document.createDocumentFragment();
			var currentParent = fragment;
			var totalWait = 0;
			var letters = ''; // Have to save actual letters separately; special tags and such can mess with our calculations
			
			// Values for change; the first value is the default
			var baseWaitTime	= [O.defaultWaitTime];
			var constant		= [O.defaultConstant];
			var animation		= [O.defaultAnimation];
			
			// Remove extra tabs at the end
			input = input.replace(/\t+$/,'');
			
			var l = input.length;
			
			var escaped = 0;
			
			// We check beyond the length of the text because that lets us place characters that allow text wrapping in Firefox; if it starts with '+' we skip that character though
			for(let i = ((input[0] === '+') ? 1 : 0); i < l; i++){
				
				// If we're at the end, check for a skipping tag
				if(i === l - 1 && input[i] === '>'){
					wait = false;
					break;
				}
				
				// If HTML
				if(input[i] === '<'){
					// Skip over the opening bracket
					i++;
				
					var values='';
					
					// Wait until a closing bracket (or the end of the text)
					// TODO: add support for > inside of quotes; for example, <input value="Go Right >">
					while(input[i]!='>' && i < l){
						values+=input[i];
						i++;
					}
					
					// We're closing the element
					if(values[0]==='/'){
						// Remove animation values if we need to
						if(currentParent.hasAttribute('animationoffset')){
							console.log('We found animationoffset!');
							animation.pop();
						}
						
						// Remove rate values if we need to
						if(currentParent.hasAttribute('rate') || currentParent.hasAttribute('basetime')){
							console.log('We found rate/basetime!');
							baseWaitTime.pop();
						}
						
						// Remove constant values if we need to
						if(currentParent.hasAttribute('constant')){
							console.log('We found constant!');
							constant.pop();
						}
						
						// If the parent doesn't have a parent (it's top-level)
						if(currentParent.parentElement == null){
							fragment.appendChild(currentParent);
							currentParent = fragment;
						// If a parent element exists, it's the new parent
						} else {
							currentParent = currentParent.parentElement;
						}
					// We're creating the element
					}else{
						/// TODO: improve this regex: remove field 4, and take into account escaped quotes
						
						// Get the element's tag and attributes
						var regex=/(\S+)=(['"]?)(.+?)\2(?=\s|$)|(\S+)/g;
						// Capture groups: 4 is attribute name if no value is given. 1 is attribute name if a value is given, and 3 is that value.
						// This takes into account whether single or double quotes are used. However, it doesn't account for escaped single or double-quotes yet. // TODO
						
						var tag=null;
						var attributes=[];
						
						var match;
						while((match=regex.exec(values))!==null){
							if(tag) attributes.push(match);
							else tag=match[0];
						}
						
						/// TODO: allow attributes on <br> tags
						
						// If it's a line break
						if(tag === 'br'){
							var lineBreak = document.createElement('span');
							lineBreak.style.whiteSpace='pre-line';
							lineBreak.innerHTML=' <wbr>';
							currentParent.appendChild(lineBreak);
							// wbr fixes missing lines breaks in Firefox
							currentParent.appendChild(document.createElement('br'));
						}
						// Otherwise, we create the element, read through it, and add the attributes
						else {
							var newElement = document.createElement(tag);
							
							for(let ii = 0; ii < attributes.length; ii++){
								let attributeVal	= null;
								let attributeName	= null;
								
								// See if it has an attributed listed for it; if so, get the attribute
								if(attributes[ii][4]){
									newElement.setAttribute(attributes[ii][4],true);
									
									attributeName	= attributes[ii][4];
									attributeVal	= true;
								}
								else{
									newElement.setAttribute(attributes[ii][1],attributes[ii][3]);
									
									attributeName	= attributes[ii][1];
									attributeVal	= attributes[ii][3];
								}
								
								// Set the attribute
								newElement.setAttribute(attributeName,attributeVal);
								
								// Perform special functions for special attributes
								switch(attributeName){
									// Offset the animation in the element
									case 'animationoffset':
										animation.push(parseFloat(attributeVal));
										break;
									// Set the base time of a letter's speed
									case 'basetime':
										// We're adding to a baseWaitTime array, so we can have nested values
										baseWaitTime.push(
											attributeVal === 'default'
											? defaultBaseWaitTime
											: parseFloat(attributeVal)
										);
										break;
									// Set the speed of the text to constant
									case 'constant':
										constant.push(attributeVal === 'false' ? false : true);
										break;
									// When click on this element, go to the specified line (based on comments in the code)
									case 'goto':
										O.el.dataset.done = 'form';
										
										newElement.addEventListener('click',function(event){
											M.go(attributeVal);
											
											event.stopPropagation();
											// Form submits
										});
										break;
									// Save the value of this input
									case 'name':
										M.variables[newElement.name] = newElement.value;
										
										newElement.addEventListener('change',function(){
											M.variables[this.name] = this.value;
											
											if(debug){
												console.log('Set variable ' + this.name + ' to ' + this.value);
											}
										});
										break;
									// Set the rate of the text (a multiplier)
									case 'rate':
										baseWaitTime.push(baseWaitTime[baseWaitTime.length - 1] * attributeVal);
										break;
									default:
										break;
								}
							}
							
							currentParent.appendChild(newElement);
								
							// If it's not a self-closing tag, make it the new parent
							if(!/^(area|br|col|embed|hr|img|input|link|meta|param|wbr)$/i.test(tag)){
								currentParent = newElement;
							}
						}
						/*
								var setConstant = false;
								var setRate = null;
								var setBaseTime = null;
								for(let ii=0;ii<attributes.length;ii++){
									if(attributes[ii][4]) setConstant = true;
									else{
										switch(attributes[ii][1]){
											case 'constant':
												setConstant = (attributes[ii][3]==='false' ? false : true);
												break;
											case 'rate':
												setRate = attributes[ii][3];
												break;
											case 'basetime':
												setBaseTime = attributes[ii][3];
												break;
										}
									}
								}
								
								var setWaitTime = baseWaitTime[baseWaitTime.length - 1];
								
								if(setBaseTime!==null){
									if(setBaseTime==='default') setWaitTime = defaultBaseWaitTime;
									else setWaitTime=parseFloat(setBaseTime);
								}
								
								if(setRate!==null){
									baseWaitTime.push(baseWaitTime[baseWaitTime.length - 1] * setRate);
								}
								
								constant.push(setConstant);
								baseWaitTime.push(setWaitTime);*/
					}
					
					// Pass over the closing bracket, and read the next character
					continue;
				// If letters
				}else{
					// If a recent character was escaped
					if(escaped) escaped--;
					
					// Escape character
					if(input[i] === '\\' && i + 1 < l){
						i++;
						
						// This way it will last not just for this char, but for a potential upcoming space
						escaped = 2;
					}
					
					var waitTime;
					// If skipping multiple lines of text, display immediately
					if(skipping) waitTime = 0;
					else waitTime = baseWaitTime[baseWaitTime.length-1];
					
					letters += input[i];
				
					// Handle punctuation- at spaces we check, if constant isn't true (and if the character wasn't escaped)
					if(input[i] === ' ' && !constant[constant.length-1] && !escaped){
						letterLoop:
						for(var testLetter = letters.length - 2; testLetter > 0; testLetter--){
							switch(letters[testLetter]){
								// Check the previous character; these ones don't count
								case '"':
								case "'":
								case '~':
									continue;
									break;
								case '.':
								case '!':
								case '?':
								case ':':
								case ';':
								case '-':
									waitTime *= 20;
									break letterLoop;
								case ',':
									waitTime *= 10;
									break letterLoop;
								default:
									// No punctuation found
									break letterLoop;
							}
						}
					}

					// Make the char based on charElement
					var charContainer = charElement.cloneNode(false);
					var charAppearAnimation = document.createElement('span')		// Display animation character (appear, shout, etc), parent to charPerpetualAnimation
					charAppearAnimation.className = 'm-vn-letter';
					var charPositioning = document.createElement('span');		// Hidden char for positioning
					charPositioning.className='m-vn-letter-placeholder';
					
					totalWait += waitTime;
					// Set the display time here- but if we're paused, or running through the text with runTo, no delay!
					// console.log('Paused: ',paused,' runTo: ',runTo);
					if(!paused && (runTo === false || runTo === 'ending')) charAppearAnimation.style.animationDelay = totalWait + 's';
					
					// Build the char and add it to the parent (which may be a document fragment)
					charContainer.appendChild(charAppearAnimation);
					charContainer.appendChild(charPositioning);
					currentParent.appendChild(charContainer);
					
					// Perpetual animation character (singing, shaking...), not always needed
					if(!isNaN(animation[animation.length-1])){
						var charPerpetualAnimation = document.createElement('span');
						charPerpetualAnimation.className = 'm-vn-letter-animation';
						charPerpetualAnimation.style.animationDelay = -(letters.length/parseFloat(animation[animation.length-1])) + 's';
						charPerpetualAnimation.innerText = input[i];
						
						charAppearAnimation.appendChild(charPerpetualAnimation);
					}
					
					// Spaces
					if(input[i] === ' '){
						charContainer.style.whiteSpace = 'pre-line';
						charPositioning.innerHTML = ' <wbr>';
						
						// if(runTo !== false) charAppearAnimation.style.visibility = 'visible';
					// Regular characters
					}else{
						charPositioning.innerText = input[i];
						
						charAppearAnimation.addEventListener('animationstart',scrollText);
					}
					
					lastLetter = charAppearAnimation;
				}
			}
			
			// Last character
			lastLetter.addEventListener('animationstart',lastLetterAppear);
			
			// Add this element for Firefox's spacing to work
			var endingWhitespace = document.createElement('span');
			endingWhitespace.style.whiteSpace = 'pre-line';
			endingWhitespace.innerHTML= ' <wbr>';
			fragment.appendChild(endingWhitespace);
			
			// Remove old text if we aren't appending
			if(input[0] !== '+'){
				while(O.el.firstChild) O.el.removeChild(O.el.firstChild);
				
				// Also, scroll to the top
				O.el.scrollTop = 0;
			}
			
			// Add the chars to the textbox
			O.el.appendChild(fragment);
			
			return false;
		}
		
		O.preload = function(){}
		
		function scrollText(event){
			if(this != event.target) return;
			if(runTo !== false) return;
			if(paused) return;
			
			// If the letter's below the textbox
			var minScroll = this.parentNode.offsetTop - O.el.offsetHeight + (this.parentNode.offsetHeight * 2);
			
			if(O.el.scrollTop < minScroll){
				O.el.scrollTop = minScroll;
			}
		}
		
		function lastLetterAppear(event){
			if(this!==event.target) return;
			
			if(O.el.dataset.done !== 'form') O.el.dataset.done='true';
			
			junction();
		}
		
		objectAddCommonFunctions(O);
	}
	
	// What to do when we aren't sure whether to proceed automatically or wait for input
	function junction(){
		
		if(runTo !== false && runTo !== 'ending') return;
		
		// console.log('test click',runTo);
		// If we aren't waiting to continue, continue
		if(!wait){
			M.run();
		// Don't add a continue notice if we ran through a textbox or are waiting for form input
		}else if(!M.window.querySelector('.m-vn-textbox[data-done="false"]') && !M.window.querySelector('.m-vn-textbox[data-done="form"]')){
			M.window.appendChild(continueNotice);
			skipping = false;
		}
	}
	
	// Load editor if we're in admin mode
	<?php //if(!empty($_SESSION['showpony_admin']))
		include 'editor.js';
	?>
}()