new function(){
	const M=this;
	
	M.currentTime=null;
	M.currentFile=null;
	M.currentLine=null;
	M.file = null;
	M.lines=null;
	M.loading=0; // Tracks how many items are currently loading
	M.variables = {};
	
	M.window=document.createElement('div');
	M.window.className='m-vn';
	M.window.dataset.filename = null;
	
	M.subtitles=document.createElement('p');
	M.subtitles.className='m-vn-subtitles';
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
		// Go through objects that were playing- unpause them
		for(var name in objects){
			if(objects[name].playing){
				objects[name].el.play();
			}
		}
		
		var videos = M.window.querySelectorAll('video[data-state="visible"]');
		for(var i = 0; i < videos.length; i++){
			videos[i].play();
		}
		
		// Resume timer
		timer.start();
	}
	
	M.pause = function(){
		// Go through objects that can be played- pause them, and track that
		for(var name in objects){
			// If it can play, and it is playing
			if(objects[name].playing){
				objects[name].el.pause();
			}
		}
		
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

	M.src = async function(file=0,time=0,filename){
		// If this is the current file
		if(M.window.dataset.filename === filename){
			
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
			
			M.currentFile=file;
			M.currentTime=time;
			
			// If this is the current keyframe, resolve
			if(keyframeSelect === M.currentLine){
				content.classList.remove('s-loading');
				return true;
			}
			
			runTo = keyframeSelect;
			
			content.classList.remove('s-loading');
			M.run(0);
			S.displaySubtitles();
			return true;
		}
		
		return fetch(filename,{credentials:'include'})
		.then(response=>{if(response.ok) return response.text();})
		.then(text=>{
			M.window.dataset.filename = filename;
			
			// Remove multiline comments
			text = text.replace(/\/\*[^]*?\*\//g,'');
			
			// Get all non-blank lines
			M.lines = text.match(/.+(?=\S).+/g);
			
			// Get keyframes from the waiting points in the text
			keyframes = [];
			
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
				if(/^engine\.wait$/.test(M.lines[i])){
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
					
					// See if the line ends with an unescaped >; if so, don't add the line
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
			
			runTo = keyframeSelect;
			
			content.classList.remove('s-loading');
			
			// Set file now so M.run knows
			M.currentFile=file;
			M.currentTime=time;
			
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
	M['==']	= function(a,b){return a == b;}
	M['<']	= function(a,b){return a < b;}
	M['>']	= function(a,b){return a > b;}
	M['<=']	= function(a,b){return a <= b;}
	M['>=']	= function(a,b){return a >= b;}
	M['!=']	= function(a,b){return a != b;}
	
	/// TO DO: stop filling up the stack so high; instead, keep running readLine() while it returns true. This way we aren't increasing the stack so heavily
	M.run = function(line = M.currentLine + 1){
		timer.stop();
		continueNotice.remove();
		M.currentLine = line;

		for(M.currentLine; M.currentLine < M.lines.length; M.currentLine++){
			if(!M.readLine(M.currentLine, M.lines[M.currentLine])) break;
		}
		
		if(runTo === 'ending') runTo = false;

		if(M.currentLine >= M.lines.length) S.file++;
	}
	
	M.readLine = function(lineNumber, text){
		// Replace all variables (including variables inside variables) with the right component
		var match;
		while(match = /[^\[]+(?=\])/g.exec(text)) text = text.replace('[' + match[0] + ']', M.variables[match[0]]);
		
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
				// If returns false, skip the next line
				if(!M[command](M.variables[component],parameter)) M.currentLine++;
				
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
			var type = 'character';
			if(/\.mp3/i.test(parameter)) type = 'audio';
			
			if(component === 'textbox') type = 'textbox';
			else if(component === 'engine') type = 'engine';
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
						if(typeof(target[compTarget][commTarget])==='undefined'){
							objects[compTarget][commTarget]();
						}else{
							objects[compTarget][commTarget](target[compTarget][commTarget]);
						}
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
			
			target[component][command] = parameter;
			
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
			objects[component][command] = parameter;
			return true;
		} else {
			notice('"' + component + '" does not have a command called "' + command + '"');
			return false;
		}
	}
	
	// If a value's a number, return it as one
	function ifParse(input){
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
	
	// RELEVANT FOR USING MULTIPLE FILES (for characters): add in this support later
	// var name=/^[^#]+/.exec(object)[0];
	
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
	M.audio=function(input){
		objects[input]=this;
		const O=this;
		O.type='audio';
		
		O.el=document.createElement('audio');
		O.el.preload=true;
		O.el.dataset.name=input;
		O.name=input;
		M.window.appendChild(O.el);
		
		O.filepath='audio/';
		
		// Checks if was playing outside of pausing the Showpony
		O.playing=false;
		
		O.content=function(input){
			if(!/\..+/.test(input)) input+='.mp3';
			var name=input;
			
			if(O.el.dataset.file===name) return true;
			
			O.el.dataset.file=name;
			
			// Can go to the root of the website, or from the current path
			if(name[0]==='/') O.el.src='<?php echo STORIES_PATH; ?>resources'+input;
			else O.el.src='<?php echo STORIES_PATH; ?>resources/'+O.filepath+input;
			
			return true;
		}
		
		O.play=function(){
			O.playing=true;
			S.displaySubtitles();
			if(!paused) O.el.play();
			
			return true;
		}
		
		O.pause=function(){
			O.playing=false;
			O.el.pause();
			
			return true;
		}
		
		O.stop=function(){
			O.playing=false;
			O.el.pause();
			O.el.currentTime=0;
			
			return true;
		}
		
		O.loop=function(input=false){
			O.el.loop=input;
			
			return true;
		}
		
		O.volume=function(input=1){
			O.el.volume=input;
			
			return true;
		}
		
		O.speed=function(input=1){
			O.el.playbackRate=input;
			
			return true;
		}
		
		O.time=function(input=0){
			O.el.currentTime=input;
			
			return true;
		}
		
		O.preload = function(){}
		
		// O.el.addEventListener('load',function(){});
		
		O.el.addEventListener('error',loadingError);
		
		O.el.addEventListener('ended',function(){
			if(!O.el.loop) O.playing = false;
		});
		
		O.el.addEventListener('timeupdate',function(){
			S.displaySubtitles();
		});
		
		function loadingError(e){
			notice('Error loading '+e.target.dataset.file);
		}
		
		objectAddCommonFunctions(O);
	}
	
	M.character = function(input){
		objects[input] = this;
		const O = this;
		O.type = 'character';
		
		O.el = document.createElement('div');
		O.el.className = 'm-vn-character';
		O.el.dataset.name = input;
		O.name = input;
		
		O.filepath = 'images/'+O.name+'/';
		O.defaultExtension = '.png';
		
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
				if(!/\./.test(resource)) resource += O.defaultExtension;
				
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
	
	M.textbox=function(input){
		objects[input]=this;
		const O=this;
		O.type='textbox';
		O.name=input;
		
		O.el=document.createElement('form');
		O.el.className='m-vn-textbox';
		O.el.dataset.name=input;
		O.el.dataset.state='hidden';
		O.el.dataset.done='true';
		
		O.el.addEventListener('submit',function(event){
			event.preventDefault();
		});
		
		M.window.appendChild(O.el);
		
		O.empty=function(){
			O.el.dataset.state='hidden';
			return true;
		}
		
		var charElement = document.createElement('span');
		charElement.className = 'm-vn-letter-container';
		
		O.content=function(input = 'NULL: No text was passed.'){
			O.el.dataset.state = 'normal';
			O.el.dataset.done = 'false';
			
			wait = true; // Assume we're waiting at the end time //XXX
			
			var fragment = document.createDocumentFragment();
			var currentParent = fragment;
			var totalWait = 0;
			var letters = ''; // Have to save actual letters separately; special tags and such can mess with our calculations
			
			// Values for change; the first value is the default
			var baseWaitTime	= [.03];
			var constant		= [false];
			var animation		= [0];
			
			var l = input.length;
			
			// We check beyond the length of the text because that lets us place characters that allow text wrapping in Firefox; if it starts with '+' we skip that character though
			for(let i = ((input[0] === '+') ? 1 : 0); i <= l; i++){
				// If a > is at the end of a text line, continue automatically.
				// Won't interfere with tags, no worries!
				if(i == l-1 && input[i] === '>'){
					wait = false; //XXX
					continue;
				}
				
				// If HTML
				if(input[i]==='<'){
					// Skip over the opening bracket
					i++;
				
					var values='';
					
					// Wait until a closing bracket (or the end of the text)
					// TODO: add support for > inside of quotes; for example, <input value="Go Right >">
					while(input[i]!='>' && i<input.length){
						values+=input[i];
						i++;
					}
					
					// We're closing the element
					if(values[0]==='/'){
						switch(values.substr(1)){
							case 'animation':
								// Revert the attributes to their previous values
								animation.pop();
								break;
							case 'speed':
								// Revert the attributes to their previous values
								baseWaitTime.pop();
								constant.pop();
								break;
							default:
								// If the parent doesn't have a parent (it's top-level)
								if(currentParent.parentElement == null){
									fragment.appendChild(currentParent);
									currentParent = fragment;
								// If a parent element exists, it's the new parent
								} else {
									currentParent = currentParent.parentElement;
								}
								break;
						}
					// We're creating the element
					}else{
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
						
						switch(tag){
							case 'animation':
								if(attributes[0][1]==='offset'){
									animation.push(parseFloat(attributes[0][3]));
								}
								break;
							case 'speed':
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
								
								var setWaitTime = baseWaitTime[baseWaitTime.length-1];
								
								if(setBaseTime!==null){
									if(setBaseTime==='default') setWaitTime = defaultBaseWaitTime;
									else setWaitTime=parseFloat(setBaseTime);
								}
								
								if(setRate!==null){
									setWaitTime*=setRate;
								}
								
								constant.push(setConstant);
								baseWaitTime.push(setWaitTime);
								break;
							case 'br':
								var lineBreak = document.createElement('span');
								lineBreak.style.whiteSpace='pre-line';
								lineBreak.innerHTML=' <wbr>';
								currentParent.appendChild(lineBreak);
								// wbr fixes missing lines breaks in Firefox
								currentParent.appendChild(document.createElement('br'));
								break;
							default:
								var newElement=document.createElement(tag);
								
								for(let ii=0;ii<attributes.length;ii++){
									if(attributes[ii][4]) newElement.setAttribute(attributes[ii][4],true);
									else newElement.setAttribute(attributes[ii][1],attributes[ii][3]);
								}
								
								currentParent.appendChild(newElement);
								
								// If it's not a self-closing tag, make it the new parent
								if(!/^(area|br|col|embed|hr|img|input|link|meta|param|wbr)$/i.test(tag)){
									currentParent=newElement;
								}
								
								// If an input type, wait until input is set and stuff
								if(tag==='input'){
									// Update data based on this
									if(newElement.type==='button' || newElement.type==='submit'){
										newElement.addEventListener('click',function(event){
											if(!O.el.checkValidity()) return false;
											
											O.el.dataset.state='inactive';
											
											// This might just be a continue button, so we need to check
											if(this.dataset.var) M.variables[this.dataset.var]=this.dataset.val;
											
											if(this.dataset.go){
												M.currentLine=M.lines.indexOf(this.dataset.go);
												return true;
											}
											else return true;
											
											// We don't want to run S.input here by clicking on a button
											event.stopPropagation();
											
											// Focus again on the window so keyboard shortcuts work
											view.focus();
										});
									}else{
										// Set data to the defaults of these, in case the user just clicks through
										if(newElement.dataset.var) M.variables[newElement.dataset.var]=newElement.value;
										
										newElement.addEventListener('change',function(){
											M.variables[this.dataset.var]=this.value;
										});
									}
								}
							break;
						}
					}
					
					// Pass over the closing bracket, and read the next character
					continue;
				// If letters
				}else{
					// Escape character
					if(input[i] === '\\' && i + 1 < input.length) i++;
					
					// If skipping multiple lines of text, display immediately
					if(skipping) waitTime = 0;
					else var waitTime = baseWaitTime[baseWaitTime.length-1];
					
					letters += input[i];
				
					// Handle punctuation- at spaces we check, if constant isn't true
					if(input[i]===' ' && !constant[constant.length-1] && i!==input.length){
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
					var charPerpetualAnimation = document.createElement('span') // Perpetual animation character (singing, shaking...)
					charPerpetualAnimation.className = 'm-vn-letter-animation';
					
					// Set the display time here- but if we're paused, or running through the text with runTo, no delay!
					if(!paused && runTo === false) charAppearAnimation.style.animationDelay = totalWait+'s';
					
					// Build the char and add it to the parent (which may be a document fragment)
					charAppearAnimation.appendChild(charPerpetualAnimation);
					charContainer.appendChild(charAppearAnimation);
					charContainer.appendChild(charPositioning);
					currentParent.appendChild(charContainer);
					
					// Set animation timing for charPerpetualAnimation, based on the type of animation
					var thisAnimation = animation[animation.length-1];
					
					if(!isNaN(thisAnimation)){
						charPerpetualAnimation.style.animationDelay=-(letters.length/parseFloat(thisAnimation))+'s';
					}
					
					totalWait += waitTime;
					
					// Spaces
					// and Ending! (needs this to wrap lines correctly on Firefox)
					if(input[i] === ' ' || i === l){
						charContainer.style.whiteSpace = 'pre-line';
						charPositioning.innerHTML= ' <wbr>';
						
						if(runTo !== false) charAppearAnimation.style.visibility = 'visible';
					
						// Last character
						if(i === l){
							charAppearAnimation.addEventListener('animationstart',lastLetterAppear);
						}
					
					// Regular characters
					}else{
						charPositioning.innerText = charPerpetualAnimation.innerText = input[i];
						
						charAppearAnimation.addEventListener('animationstart',scrollText);
					}
				}
			}
			
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
			
			O.el.dataset.done='true';
			
			junction();
		}
		
		objectAddCommonFunctions(O);
	}
	
	// What to do when we aren't sure whether to proceed automatically or wait for input
	function junction(){
		if(runTo !== false && runTo !== 'ending') return;
		
		// If we aren't waiting to continue, continue
		if(!wait){
			M.run();
		// Don't add a continue notice if we ran through a textbox
		}else if(!M.window.querySelector('input') && !M.window.querySelector('.m-vn-textbox[data-done="false"]')){
			M.window.appendChild(continueNotice);
			skipping = false;
		}
	}
}()