S.modules.visualNovel=new function(){
	const M=this;
	
	M.currentTime=null;
	M.currentFile=null;
	M.currentLine=null;
	M.lines=null;
	M.loading=0; // Tracks how many items are currently loading
	
	M.window=document.createElement('div');
	M.window.className='m-vn';
	
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
		
		// Resume timer
		timer.start();
	}
	
	M.pause=function(){
		// Go through objects that can be played- pause them, and track that
		for(var name in objects){
			// If it can play, and it is playing
			if(objects[name].playing){
				objects[name].el.pause();
			}
		}
		
		// Pause timer
		timer.pause();
	}
	
	M.regress=function(){
		// Get the correct keyframe
		for(var i=M.currentLine-1;i>0;i--){
			if(keyframes.indexOf(i)!==-1){
				// Skip over comments
				if(/^\s*\/\//.test(keyframes[keyframes.indexOf(i)])) continue;

				runTo=keyframes[keyframes.indexOf(i)];
				M.run(0);
				return;
			}
		}
		
		if(M.currentFile>0) S.to({file:'-1',time:'end'});
		else S.to({time:0});
	}
	
	M.progress=function(){
		// Finish all animations
		for(var name in objects){
			objects[name].el.dispatchEvent(new Event('animationend'));
		}
		loadingTracker(1);
		M.window.offsetHeight; // Trigger reflow to flush CSS changes
		loadingTracker();
		
		// If a continue notice exists, continue!
		if(M.window.querySelector('.m-vn-continue')){
			M.run();
			return;
		}
		
		// Continue if the timer was going
		if(timer.remaining>0){
			timer.stop();
			M.run();
			return;
		}
		
		// Display all letters
		M.window.querySelectorAll('.m-vn-letter').forEach(function(letter){
			// Skip creating animation, and display the letter
			letter.style.animationDelay=null;
			var classes=letter.className;
			letter.className=classes;
			letter.style.animation='initial';
			// letter.firstChild.dispatchEvent(new CustomEvent('animationstart'));
			letter.style.visibility='visible';
		});
		
		// Set all textboxes to state they're done
		M.window.querySelectorAll('.m-vn-textbox').forEach(function(textbox){
			textbox.dataset.done='true';
		});
		
		// If we're inputting, exit
		/// TODO: Add this in for multiple textboxes
		// if(objects.textbox.el.querySelector('input')) return;
		
		junction();
	}

	M.src=function(file=0,time=0){
		return new Promise(function(resolve,reject){
			if(time==='end') time=S.files[file].duration;
			
			// Visual Novel engine resets
			timer.stop();
			
			// If this is the current file
			if(M.currentFile===file){
				
				// Get the keyframe
				var keyframeSelect=Math.round(keyframes.length*(time/S.files[M.currentFile].duration));
				if(keyframeSelect>=keyframes.length) keyframeSelect=keyframes[keyframes.length-1];
				else keyframeSelect=keyframes[keyframeSelect];
				
				// If this is the current keyframe, resolve
				// if(keyframeSelect===M.currentLine){
					// loadingTracker();
					// resolve({file:file,time:time});
					// return;
				// }
				
				runTo=keyframeSelect;
				
				content.classList.remove('s-loading');
				M.run(0);
				S.displaySubtitles();
				resolve({file:file,time:time});
				return;
			}
			
			var src=S.files[file].path;
			
			fetch(src,{credentials:'include'})
			.then(response=>{
				return response.text();
			})
			.then(text=>{
				// Remove multiline comments
				text=text.replace(/\/\*[^]*?\*\//g,'');
				
				// Get all non-blank lines
				M.lines=text.match(/.+(?=\S).+/g);
				
				// Get keyframes from the waiting points in the text
				keyframes=[];
				
				// Go through each line
				for(let i=0;i<M.lines.length;i++){
					// Look for keyframes
					if(/^engine\.wait$/.test(M.lines[i])){
						keyframes.push(i);
						continue;
					}
					
					// Text lines
					if(/^\t+/.test(M.lines[i])){
						// Ignore text lines that are appending
						if(/^\t+\+/.test(M.lines[i])) continue;
						
						// See if it's part of a tag
						// Anything with a space we'll ignore; you should only have self-closing tags or closing tags at the end of the line
						
						// See if the line ends with an unescaped >; if so, don't add the line
						if(M.lines[i][M.lines[i].length-1]==='>'){
							//See if it's an ending tag
							var test=document.createElement('div');
							test.innerHTML=M.lines[i];
							var text=test.innerText;
							
							
							//If it's not an ending tag
							if(text[text.length-1]==='>'){
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
				
				// Get the keyframe
				var keyframeSelect=Math.round(keyframes.length*(time/S.files[file].duration));
				if(keyframeSelect>=keyframes.length) keyframeSelect=keyframes[keyframes.length-1];
				else keyframeSelect=keyframes[keyframeSelect];
				
				runTo=keyframeSelect;
				
				M.currentFile=S.currentFile=file;
				content.classList.remove('s-loading');
				M.run(0);
				
				if(S.files[file].buffered!==true){
					S.files[file].buffered=true;
					getTotalBuffered();
				}
				
				S.displaySubtitles();
				resolve({file:file,time:time});
			});
		});
	}
	
	M.displaySubtitles=function(){
		// When an audio file updates its time, display subtitles for it
		if(S.currentSubtitles===null || !S.subtitles[S.currentSubtitles][M.currentFile]){
			M.subtitles.style.display='none';
			return;
		}
		
		var text='';
		
		var phrases=S.subtitles[S.currentSubtitles][M.currentFile];
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
	
	var operations={
		'='		:(a,b)=>	b
		,'+'	:(a,b)=>	a+b
		,'-'	:(a,b)=>	a-b
		,'=='	:(a,b)=>	a==b
		,'<'	:(a,b)=>	a<b
		,'>'	:(a,b)=>	a>b
		,'<='	:(a,b)=>	a<=b
		,'>='	:(a,b)=>	a>=b
		,'!'	:(a,b)=>	a!=b
	};
	
	/// TO DO: stop filling up the stack so high; instead, keep running readLine() while it returns true. This way we aren't increasing the stack so heavily
	M.run=function(line=M.currentLine+1){
		M.currentLine=line;
		continueNotice.remove();

		while(M.currentLine<M.lines.length && M.readLine(M.currentLine)) M.currentLine++;

		if(M.currentLine>=M.lines.length) S.to({file:'+1'});
	}
	
	M.readLine=function(line){
		// Skip comments
		if(/^\/\//.test(M.lines[line])){
			return true;
		}
		
		var vals=M.lines[line];
		
		// Replace all variables (including variables inside variables) with the right component
		var match;
		while(match=/[^\[]+(?=\])/g.exec(vals)) vals=vals.replace('['+match[0]+']',S.data[match[0]]);
		
		vals=/(^[^\t\.\+\-=<>!]+)?(?:\.([^\t]+)|([+\-=<>!]+))?\t*(.+$)?/.exec(vals);
		
		var component	=typeof(vals[1])!=='undefined' ? vals[1] : 'textbox';
		var command		=typeof(vals[2])!=='undefined' ? vals[2] : 'content';
		var operation	=typeof(vals[3])!=='undefined' ? vals[3] : null;
		var parameter	=typeof(vals[4])!=='undefined' ? vals[4] : null;
		
		// Operations
		switch(operation){
			case '=':
			case '+':
			case '-':
				S.data[component]=operations[operation](
					ifParse(S.data[component])
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
				// If returns true, read the next line
				if(operations[operation](
					ifParse(S.data[component])
					,ifParse(parameter)
				)) return true;
				// Otherwise, skip it
				else{
					line+=1;
					return true;
				}
				
				return;
				break;
			default:
				// Continue; no operation found
				break;
		}
		
		// Determine type
		if(objects[component]) var type=objects[component].type;
		else{
			var type='character';
			if(/^(?:go|end|event|wait)$/.test(command)) type='engine';
			else if(/\.mp3/.test(parameter)) type='audio';
			
			if(component==='textbox') type='textbox';
			else if(component==='engine') type='engine';
		}
		
		// Creating a new element using the engine command
		if(type==='engine'){
			switch(command){
				case 'audio':
				case 'textbox':
				case 'character':
					component=parameter;
					type=command;
					command=null;
					break;
				default:
					break;
			}
		}
		
		// Run through if we're running to a point; if we're there or beyond though, stop running through
		if(runTo!==false && line>=runTo){
			
			loadingTracker(1);
			
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
					
					if(typeof(objects[compTarget][commTarget])==='function'){
						if(typeof(target[compTarget][commTarget])==='undefined'){
							objects[compTarget][commTarget]();
						}else{
							objects[compTarget][commTarget](target[compTarget][commTarget]);
						}
					}else{
						objects[compTarget][commTarget]=target[compTarget][commTarget];
					}
				}
			}
			
			target={};

			runTo=false;
			
			M.window.offsetHeight; // Trigger reflow to flush CSS changes
			loadingTracker();
		}
		
		// If we're running through to a point, add the info to the target
		if(runTo!==false && !/^(?:go|end|event|wait)$/.test(command)){
			
			// Remove the element if requested
			if(command==='remove'){
				delete target[component];
				return true;
			}
			
			// Creating elements with the engine
			if(type==='engine'){
			}else{
				if(!target[component]){
					target[component]={
						'type':type
					};
					
					// Add necessary starting values based on what's passed
					if(type==='audio') target[component].stop=null;
					else if(type==='textbox') target[component].empty=null;
				}
			}
			
			// Ignore adding a command if there is none to return
			if(command===null) return true;
			
			// Add styles; everything else is replaced
			if(command==='style'){
				if(!target[component].style) target[component].style='';
				
				// Styles are appended; later ones will override earlier ones. Time is removed here; we don't want to affect that here.
				target[component].style+=parameter.replace(/time:[^;]+;?/i,'');
				
				return true;
			}
			
			// Append textbox content if it starts with a "+" this time
			if(target[component].type==='textbox'
				&& command==='content'
				&& parameter[0]==='+'
			){
				target[component][command]+=parameter.replace(/^\+/,'');
				
				return true;
			}
			
			// When it comes to conflicting commands, choose only the latest
			switch(command){
				case 'play':
					delete target[component].pause;
					delete target[component].stop;
					break;
				case 'pause':
					delete target[component].play;
					delete target[component].stop;
					break;
				case 'stop':
					delete target[component].play;
					delete target[component].pause;
					break;
				case 'empty':
					delete target[component].content;
					break;
				case 'content':
					delete target[component].empty;
					break;
				default:
					break;
			}
			
			target[component][command]=parameter;
			
			// Continue without creating objects- we'll look at THAT once we've run through and added all the info to the target
			return true;
		}
		
		// Update the scrubbar if the frame we're on is a keyframe
		if(runTo===false && keyframes.includes(line)){
			M.currentTime=(keyframes.indexOf(line)/keyframes.length)*S.files[M.currentFile].duration;
			timeUpdate();
		}
		
		// Engine command
		if(type==='engine') return M[command](parameter);
		
		// Create the object if it doesn't exist
		if(!objects[component]) new M[type](component);
		
		// If no command was passed, continue
		if(command===null) return true;
		
		// Run the object command and go to the next line if it returns true
		return objects[component][command](parameter);
	}
	
	// If a value's a number, return it as one
	function ifParse(input){
		return isNaN(input) ? input : parseFloat(input);
	}
	
	M.go=function(input){
		M.currentLine=M.lines.indexOf(input);
		return true;
	}
	
	M.end=function(){
		S.to({file:'+1'});
		return false;
	}
	
	M.event=function(input){
		S.window.dispatchEvent(new CustomEvent(input));
		return true;
	}

	M.wait=function(input){
		// Skip waiting if we're running through, or we're paused
		if(runTo!==false || S.paused){
			return true;
		}
		
		if(input){
			timer.start(parseFloat(input)*1000);
		}
		// Otherwise, let the user know to continue it
		else{
			junction();
		}
		
		// If we're paused, pause the timer
		if(S.paused) timer.pause();
		
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
			if(animationSpeed===null || runTo!==false || S.paused){
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
	
	function loadingTracker(increase=-1){
		if(increase.target) increase=-1;
		M.loading+=increase;

		if(M.loading>0){
			content.classList.add('s-loading');
		}else{
			content.classList.remove('s-loading');
		}
	}
	
	// Read window as "engine" object
	M.type='engine';
	
	M.el=M.window;
	M.window.dataset.name='engine';
	M.name='engine';
	
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
			
			// loadingTracker(1);
			O.el.src='<?php echo $stories_path; ?>resources/'+O.filepath+input;
			
			return true;
		}
		
		O.play=function(){
			O.playing=true;
			if(!S.paused) O.el.play();
			
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
			O.el.loop=(input=="false" ? false : true);
			
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
		
		// O.el.addEventListener('load',function(){});
		
		O.el.addEventListener('error',loadingError);
		
		O.el.addEventListener('ended',function(){
			if(!O.el.loop) O.playing=false;
		});
		
		O.el.addEventListener('timeupdate',function(){
			M.displaySubtitles();
		});
		
		function loadingError(e){
			S.notice('Error loading '+e.target.dataset.file);
		}
		
		objectAddCommonFunctions(O);
	}
	
	M.character=function(input){
		objects[input]=this;
		const O=this;
		O.type='character';
		
		O.el=document.createElement('div');
		O.el.className='m-vn-character';
		O.el.dataset.name=input;
		O.name=input;
		
		O.filepath='images/'+O.name+'/';
		
		var preloading=false;
		
		M.window.appendChild(O.el);

		O.content=function(input,preloading=false){
			// Preload the files when we first display one
			if(preloading===false){
				var preloading='ongoing';
				
				// Preload images
				for(let i=0;i<M.lines.length;i++){
					var value=new RegExp(O.name+'(\s{3,}|\t+)(.+$)').exec(M.lines[i]);
					if(value) O.content(value[2],true);
				}
				
				preloading='complete';
			}
			
			// Character level
			// Get the image names passed (commas separate layers)
			var imageNames=input.split(',');
		
			// Layer level
			// Go through each passed image and see if it exists
			for(var i=0;i<imageNames.length;i++){
				// Layer is i+1 because 0 is the style tag
				var layer=i+1;
				
				var image=imageNames[i];
				// If no extension, assume png
				if(!/\./.test(image)) image+='.png';
				
				// If the layer doesn't exist, add it!
				if(!O.el.children[layer]){
					O.el.appendChild(document.createElement('div'));
				}
				
				// If the image doesn't exist, add it!
				if(!O.el.children[layer].querySelector('img[data-file="'+image+'"]')){
					// Add a layer image
					var img=document.createElement('img');
					img.className='m-vn-character-image';
					img.dataset.file=image;
					
					loadingTracker(1);
					img.addEventListener('load',loadingTracker);
					img.addEventListener('error',loadingError);
					
					// Can go to the root of the website, or from the current path
					if(image[0]==='/') img.src='<?php echo $stories_path; ?>resources/'+image;
					else img.src='<?php echo $stories_path; ?>resources/'+O.filepath+image;
					
					O.el.children[layer].appendChild(img);
					
					if(preloading==='complete') img.style.opacity=0;
				}
				
				if(preloading!=='complete') continue;
				
				// Set the matching images' opacity to 1, and all the others to 0 (visibility:hidden, display:none would result in flashing images on some browsers)
				var images=O.el.children[layer].children;
				for(let ii=0;ii<images.length;ii++){
					if(images[ii].dataset.file===image){
						 images[ii].style.opacity=1;
					}else{
						images[ii].style.opacity=0;
					}
				}
			}
			
			if(preloading='complete') return true;
		}
		
		function loadingError(e){
			loadingTracker();
			S.notice('Error loading '+e.target.dataset.file);
		}
		
		objectAddCommonFunctions(O);
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
		
		O.content=function(input='NULL: No text was passed.'){
			O.el.dataset.state='normal';
			O.el.dataset.done='false';
			
			wait=true; // Assume we're waiting at the end time //XXX
			
			// If the line doesn't start with +, replace the text
			if(input[0]!=='+'){
				O.el.innerHTML='';
				O.el.scrollTop=0;
			}
			else input=input.substr(1);
			
			// STEP 2: Design the text//
			
			// Design defaults
			const defaultBaseWaitTime=.03;
			const defaultConstant=false;
			
			var charElementDefault=document.createElement('span');
			
			var charElement=document.createElement('span');
			charElement.className='m-vn-letter-container';
			var baseWaitTime=defaultBaseWaitTime;
			var constant=defaultConstant;
			
			// Tracks nested attributes
			var nestedAttributes={
				speed:[]
				,animation:[]
			};

			// The total time we're waiting until x happens
			var totalWait=0;
			var fragment=document.createDocumentFragment();
			var currentParent=fragment;
			
			var letters=''; // Have to save actual letters separately; special tags and such can mess with our calculations
			
			var lastLetter=null;
			
			var l=input.length;
			// We check beyond the length of the text because that lets us place characters that allow text wrapping in Firefox
			for(let i=0;i<=l;i++){
				// If a > is at the end of a text line, continue automatically.
				// Won't interfere with tags, no worries!
				if(i==l-1 && input[i]==='>'){
					wait=false; //XXX
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
						var tag=values.substr(1);
						
						switch(tag){
							case 'animation':
								// Revert the attributes to their previous values
								var attributes=nestedAttributes.animation.pop();
								break;
							case 'speed':
								// Revert the attributes to their previous values
								var attributes=nestedAttributes.speed.pop();
								baseWaitTime=attributes.waitTime;
								constant=attributes.constant;
								break;
							default:
								// If the parent doesn't have a parent (it's top-level)
								if(currentParent.parentElement==null){
									fragment.appendChild(currentParent);
									currentParent=fragment;
								// If a parent element exists, it's the new parent
								}else{
									currentParent=currentParent.parentElement;
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
									nestedAttributes.animation.push(parseFloat(attributes[0][3]));
								}
								break;
							case 'speed':
								// Save the previous speed values
								nestedAttributes.speed.push({
									constant:constant
									,waitTime:baseWaitTime
								});
							
								var setConstant=false;
								var setRate=null;
								var setBaseTime=null;
								for(let ii=0;ii<attributes.length;ii++){
									if(attributes[ii][4]) setConstant=true;
									else{
										switch(attributes[ii][1]){
											case 'constant':
												setConstant=(attributes[ii][3]==='false' ? false : true);
												break;
											case 'rate':
												setRate=attributes[ii][3];
												break;
											case 'basetime':
												setBaseTime=attributes[ii][3];
												break;
										}
									}
								}
								
								constant=setConstant;
								
								if(setBaseTime!==null){
									if(setBaseTime==='default') baseWaitTime=defaultBaseWaitTime;
									else baseWaitTime=parseFloat(setBaseTime);
								}
								
								if(setRate!==null){
									baseWaitTime*=setRate;
								}
								
								break;
							case 'br':
								var lineBreak=document.createElement('span');
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
											if(this.dataset.var) S.data[this.dataset.var]=this.dataset.val;
											
											if(this.dataset.go){
												M.currentLine=M.lines.indexOf(this.dataset.go);
												return true;
											}
											else return true;
											
											// We don't want to run S.input here by clicking on a button
											event.stopPropagation();
											
											// Focus again on the window so keyboard shortcuts work
											S.window.focus();
										});
									}else{
										// Set data to the defaults of these, in case the user just clicks through
										if(newElement.dataset.var) S.data[newElement.dataset.var]=newElement.value;
										
										newElement.addEventListener('change',function(){
											S.data[this.dataset.var]=this.value;
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
					if(input[i]==='\\' && i+1<input.length) i++;
					
					var waitTime=baseWaitTime;
					letters+=input[i];
				
					// Handle punctuation- at spaces we check, if constant isn't true
					if(input[i]===' ' && !constant && i!==input.length){
						var testLetter=letters.length-2;
						
						/*
							Go back before the following:
								" ' ~
							That way sentences can end with those and still have a beat for the punctuation.
						*/
						while(/["'~]/.test(letters[testLetter])){
							testLetter--;
						}
						
						switch(letters[testLetter]){
							case '.':
							case '!':
							case '?':
							case ':':
							case ';':
							case '-':
								waitTime*=20;
								break;
							case ',':
								waitTime*=10;
								break;
							default:
								// No punctuation found
								break;
						}
					}

					// Make the char based on charElement
					var thisChar=charElement.cloneNode(false);
					
					let showChar=document.createElement('span')			// Display animation character (appear, shout, etc), parent to animChar
					showChar.className='m-vn-letter';
					let animChar=document.createElement('span')			// Perpetual animation character (singing, shaking...)
					animChar.className='m-vn-letter-animation';
					let hideChar=document.createElement('span');		// Hidden char for positioning
					hideChar.className='m-vn-letter-placeholder';
					
					// Spaces
					// and Ending! (needs this to wrap lines correctly on Firefox)
					if(input[i]===' ' || i===l){
						thisChar.style.whiteSpace='pre-line';
						hideChar.innerHTML=animChar.innerHTML=' <wbr>';
						
						showChar.addEventListener('animationstart',function(event){
							// If the animation ended on a child, don't continue! (animations are applied to children for text effects)
							if(this!=event.target) return;
							
							// If the element's currently hidden (the animation that ended is for unhiding)
							if(this.style.visibility!=='visible'){
								this.style.visibility='visible';
								
								// If running to a spot, ignore all of this
								if(runTo!==false || S.paused) return;
								
								// If the letter's below the textbox
								if(this.parentNode.getBoundingClientRect().bottom>O.el.getBoundingClientRect().bottom){
									O.el.scrollTop=this.parentNode.offsetTop+this.parentNode.offsetHeight-O.el.offsetHeight;
								}
								
								// If the letter's above the textbox
								if(this.parentNode.getBoundingClientRect().top<O.el.getBoundingClientRect().top){
									O.el.scrollTop=this.parentNode.offsetTop;
								}
								
							}
						});
					}else{
						hideChar.innerText=animChar.innerText=input[i];
					}
					
					// Set the display time here- but if we're paused, or running through the text with runTo, no delay!
					if(!S.paused && runTo===false) showChar.style.animationDelay=totalWait+'s';
					
					// Set animation timing for animChar, based on the type of animation
					var animation=nestedAttributes.animation;
					animation=animation[animation.length-1];
					
					if(!isNaN(animation)){
						animChar.style.animationDelay=-(letters.length/parseFloat(animation))+'s';
					}
					
					// Build the char and add it to the parent (which may be a document fragment)
					showChar.appendChild(animChar);
					thisChar.appendChild(showChar);
					thisChar.appendChild(hideChar);
					currentParent.appendChild(thisChar);
					
					totalWait+=waitTime;
					
					lastLetter=showChar;
				}
			}
			
			lastLetter.addEventListener('animationstart',function(event){
				if(this!==event.target) return;
				
				// console.log("RUN ANIMATION START");
				O.el.dataset.done='true';
				
				junction();
			});
			
			// Add the chars to the textbox
			O.el.appendChild(fragment);
			
			return false;
		}
		
		objectAddCommonFunctions(O);
	}
	/*
	function lastLetterAppear(target){
		if(this!==target) return;
				
		console.log("RUN ANIMATION START");
		this.dataset.done='true';
		
		// If we aren't waiting to continue, continue
		if(!wait){ //XXX
			M.run();
		}else{
			if(!O.el.querySelector('input')){
				junction();
			}
		}
	}*/
	
	// What to do when we aren't sure whether to proceed automatically or wait for input
	function junction(){
		// If we aren't waiting to continue, continue
		if(!wait){
			M.run();
		}else{
			if(!M.window.querySelector('input')){
				// if(S.auto){
					// M.run();
				// }
				// else{
					// Don't add a continue notice if we ran through a textbox
					if(runTo===false && M.window.querySelectorAll('.m-vn-textbox').length===M.window.querySelectorAll('[data-done="true"]').length){
						// console.log("ADD CONTINUE NOTICE");
						M.window.appendChild(continueNotice);
					}
				// }
			}
		}
		
		
	}
}();