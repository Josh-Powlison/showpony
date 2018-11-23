/// TODO: fix general bugs
/// TODO: condense and optimize (I suspect we can get this down by a large amount)

S.modules.visualNovel=new function(){
	const M=this;
	
	M.currentTime=null;
	M.currentFile=null;
	M.currentLine=null;
	M.lines=null;
	
	M.window=document.createElement('div');
	M.window.className='showpony-visual-novel';
	
	var runTo=false;
	var continueNotice=document.createElement('div');
	continueNotice.className='showpony-continue';
	var inputting=false;
	var wait=false;
	var currentTextbox='textbox';
	var target={};
	var keyframes=null;
	var waitTimer=new powerTimer(function(){},0)
	
	// The elements in the vn
	var objects={};
	
	M.play=function(){
		// Go through objects that were playing- unpause them
		for(var name in objects){
			// console.log('PLAY',objects[name].playing);
			if(objects[name].playing){
				objects[name].el.play();
			}
		}
		
		// Resume waitTimer
		waitTimer.resume();
	}
	
	M.pause=function(){
		// Go through objects that can be played- pause them, and track that
		for(var name in objects){
			// If it can play, and it is playing
			if(objects[name].playing){
				objects[name].el.pause();
			}
		}
		
		// Pause waitTimer
		waitTimer.pause();
	}
	
	M.input=function(){
		// If a wait timer was going, stop it.
		if(waitTimer.remaining>0){
			// Run all animations, end all transitions
			content.classList.add('showpony-loading');
			M.window.offsetHeight; // Trigger reflow to flush CSS changes
			content.classList.remove('showpony-loading');
			
			waitTimer.end();
		}
		
		// Remove the continue notice
		continueNotice.remove();
		
		// End object animations on going to the next frame
		for(var key in objects){
			if(objects[key].tagName) objects[key].dispatchEvent(new Event('animationend'));
			else{
				objects[key].el.dispatchEvent(new Event('animationend'));
			}
		}
		
		var choices=false;
		
		// If the player is making choices right now
		if(objects[currentTextbox] && objects[currentTextbox].el.querySelector('input')) choices=true;
		
		// If all letters are displayed
		if(!objects[currentTextbox] || objects[currentTextbox].el.children.length===0 || objects[currentTextbox].el.lastChild.firstChild.style.visibility=='visible'){
			inputting=false;
			if(!choices) M.progress();
		}
		else // If some objects have yet to be displayed
		{
			// Run all animations, end all transitions
			content.classList.add('showpony-loading');
			M.window.offsetHeight; // Trigger reflow to flush CSS changes
			content.classList.remove('showpony-loading'); // Needs to happen before the latter; otherwise, it'll mess up stuff
			
			// Display all letters
			M.window.querySelectorAll('.showpony-char').forEach(function(key){
				// Skip creating animation, and display the letter
				key.style.animationDelay=null;
				var classes=key.className;
				key.className=classes;
				key.style.animation='initial';
				key.firstChild.dispatchEvent(new CustomEvent('animationstart'));
				key.style.visibility='visible';
			});
			
			if(choices) return;
			
			inputting=true;
			
			// Continue if not waiting
			if(!wait) M.progress();
			else{
				// If automatically progressing, do so
				/// TODO: allow setting a value to progressing time
				if(S.auto){
					// M.progress();
				}
				// Else, if waiting for user input
				else{
					M.window.appendChild(continueNotice);
				}
			}
		}
	}

	M.timeUpdate=function(time=0){
		M.currentTime=time;
	}
	
	M.src=function(file=0,time=0){
		return new Promise(function(resolve,reject){
			// Visual Novel engine resets
			waitTimer.end();
			
			// If this is the current file
			if(M.currentFile===file){
				// Get the keyframe
				var keyframeSelect=Math.round(keyframes.length*(time/S.files[M.currentFile].duration));
				if(keyframeSelect>=keyframes.length) keyframeSelect=keyframes[keyframes.length-1];
				else keyframeSelect=keyframes[keyframeSelect];
				
				// If this is the current keyframe, resolve
				if(keyframeSelect===M.currentLine){
					content.classList.remove('showpony-loading');
					resolve();
					return;
				}
				
				runTo=keyframeSelect;
				
				M.progress(0);
				resolve();
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
				
				// Get keyframes from the text- beginning, end, (? ->)and waiting points
				keyframes=[0];
				
				// Regular text lines and waits can be keyframes
				for(let i=1;i<M.lines.length;i++){
					if(/^(\t+|engine\.wait$)/.test(M.lines[i])) keyframes.push(i);
				}
				
				// Get the keyframe
				var keyframeSelect=Math.round(keyframes.length*(time/S.files[file].duration));
				if(keyframeSelect>=keyframes.length) keyframeSelect=keyframes[keyframes.length-1];
				else keyframeSelect=keyframes[keyframeSelect];
				
				runTo=keyframeSelect;
				
				M.currentFile=S.currentFile=file;
				M.progress(0);
				
				if(S.files[file].buffered!==true){
					S.files[file].buffered=true;
					getTotalBuffered();
				}
				
				console.log('VISUAL NOVEL ENGINE RAN');
				
				resolve();
			});
		});
	}
	
	M.displaySubtitles=function(){
		if(S.currentSubtitles===null){
			subtitles.innerHTML='';
			return;
		}
		
		if(S.files[M.currentFile].subtitles){
			// /NOTHING YET!
		}else{
			// If don't have the file
			fetch(S.subtitles[S.currentSubtitles]+S.files[M.currentFile].title+'.vtt')
			.then(response=>{return response.text();})
			.then(text=>{
				S.files[M.currentFile].subtitles=text;
				M.displaySubtitles();
			});
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
	
	M.progress=function(inputNum=M.currentLine+1){
		// Go to either the specified line or the next one
		M.currentLine=inputNum;
		
		// If we've ended manually or reached the end, stop running immediately and end it all
		if(M.currentLine>=M.lines.length){
			S.to({file:'+1'});
			return;
		}
		
		// Skip comments
		if(/^\/\//.test(M.lines[M.currentLine])){
			M.progress();
			return;
		}
		
		var vals=M.lines[M.currentLine];
		
		// Replace all variables (including variables inside variables) with the right name
		var match;
		while(match=/[^\[]+(?=\])/g.exec(vals)) vals=vals.replace('['+match[0]+']',S.data[match[0]]);
		
		vals=vals.split(/(?:\s{3,}|\t+)/);
		
		// Operations
		var type=/[+=\-<>!]+$/.exec(vals[0]);
		if(type){
			type=type[0];
			// Remove type from variable name
			var name=vals[0].replace(type,'');
			
			switch(type){
				// Operations
				case '=':
				case '+':
				case '-':
					S.data[name]=operations[type](
						ifParse(S.data[name])
						,ifParse(vals[1])
					);
					
					M.progress();
					break;
				// Comparisons
				default:
					if(operations[type](
						ifParse(S.data[name])
						,ifParse(vals[1])
					)) M.progress(M.lines.indexOf(vals[2]));
					else M.progress();
					break;
			}
			
			return;
		}
		
		// Run through if we're running to a point; if we're there or beyond though, stop running through
		if(runTo!==false && M.currentLine>=runTo){
			
			inputting=false;
			
			// Delete unnecessary target info
			delete target['engine'];
			
			// Adjust everything based on the list
			
			// Get rid of objects that aren't in target
			for(var name in objects){
				if(!target[name] || target[name].type!==objects[name].type){
					objects[name].remove();
				}
				
			};
			
			// Go through each target; add nonexisting elements and update styles
			for(var name in target){
				// Make the remaining objects
				if(typeof(objects[name])==='undefined'){
					objects[name]=new M[target[name].type](name);
				}
				
				// Reset the object's custom CSS
				objects[name].style();
				
				// Go through the object's functions and reset them to their base or passed values
				for(var command in target[name]){
					// Skip over "remove" function- we don't want to run that one :P
					if(command==='remove') continue;
					
					if(typeof(objects[name][command])==='function'){
						if(typeof(target[name][command])==='undefined'){
							objects[name][command]();
						}else{
							objects[name][command](target[name][command]);
						}
					}
				}
			}
			
			target={};
			waitTimer.end();

			runTo=false;
			
			M.window.offsetHeight; // Trigger reflow to flush CSS changes
			content.classList.remove('showpony-loading');
		}
		
		/*
		object.command		value
		variableOperation	value
		
		type is assumed
		*/
		
		// Determine command
		var command=/\..+/.exec(vals[0]);
		if(!command) command='content';
		else command=command[0].replace('.','');
		
		// Determine type
		var type='character';
		if(vals.length===1) type='background';
		if(/play|pause|stop|loop/.test(command)) type='audio';
		if(/go|end|runEvent|wait/.test(command)) type='engine';
		
		// Determine name
		var name=/^[^\.\t]+/.exec(vals[0]);
		if(name) name=name[0]
		else{
			name='textbox';
			type='textbox';
		}
		
		// If we're running through to a point, add the info to the target
		if(runTo!==false && type!=='engine'){
			if(!target[name]){
				target[name]={
					'type':type
				};
			}
			
			// Add styles; everything else is replaced
			if(command==='style'){
				if(!target[name].style) target[name].style='';
				
				// Styles are appended; later ones will override earlier ones. Time is removed here; we don't want to affect that here.
				target[name].style+=vals[1].replace(/time:[^;]+;?/i,'');
			}else{
				// Append textbox content if it starts with a "+" this time
				if(target[name].type==='textbox' && command==='content' && vals[1][0]==='+'){
					target[name][command]+=vals[1].replace(/^\+/,'');
				}
				// Update values
				else{
					// When it comes to conflicting commands, choose only the latest
					switch(command){
						case 'play':
							delete target[name].pause;
							delete target[name].stop;
							break;
						case 'pause':
							delete target[name].play;
							delete target[name].stop;
							break;
						case 'stop':
							delete target[name].play;
							delete target[name].pause;
							break;
					}
					
					target[name][command]=vals[1];
				}
			}
			
			// Continue without creating objects- we'll look at THAT once we've run through and added all the info to the target
			M.progress();
			return;
		}
		
		if(type==='engine'){
			// Engine command
			M[command](vals[1]);
			return;
		}else{
			// If an object with the name doesn't exist, make it!
			if(!objects[name]){
				objects[name]=new M[type](name);
			}
			
			// Object command
			objects[name][command](vals[1]);
		}
		
		// Update the scrubbar if the frame we're on is a keyframe
		if(runTo===false && keyframes.includes(M.currentLine)){
			timeUpdate((keyframes.indexOf(M.currentLine)/keyframes.length)*S.files[M.currentFile].duration);
		}
				
		// Don't automatically continue on text updates or engine commands
		if(type==='textbox' && command==='content') return;
		
		M.progress();
	}
	
	// If a value's a number, return it as one
	function ifParse(input){
		return isNaN(input) ? input : parseFloat(input);
	}
	
	M.go=function(input){
		M.progress(M.lines.indexOf(input));
	}
	
	M.end=function(){
		S.to({file:'+1'});
	}
	
	M.runEvent=function(input){
		S.window.dispatchEvent(new CustomEvent(input));
		M.progress();
	}

	M.wait=function(input){
		// If there's a waitTimer, clear it out
		if(waitTimer.remaining>0){
			waitTimer.end();
		}
		
		// Skip waiting if we're running through
		if(runTo!==false){
			M.progress();
			return;
		}
		
		// If a value was included, wait for the set time
		if(input) waitTimer=new powerTimer(M.progress,parseFloat(input)*1000);
		// Otherwise, let the user know to continue it
		else{
			// If we're automatically proceeding
			if(S.auto){
				// M.progress();
			}
			// If we're waiting for player input
			else{
				M.window.appendChild(continueNotice);
			}
		}
		
		// If we're paused, pause the timer
		if(S.paused) waitTimer.pause();
		
		// Don't automatically go to the next line
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
				return;
			}
			
			var animationSpeed=/time:[^s;$]+/i.exec(style);
			
			// Add back in to support multiple objects sharing the same file set
			
			// If running to or not requesting animation, add styles without implementing animation
			if(animationSpeed===null || runTo!==false){
				O.el.style.cssText+=style;
			}else{
				localStyle.innerHTML='@keyframes '+cssName+'{100%{'+style+'}}';
				
				O.el.style.animation=animationSpeed[0].split(':')[1]+'s forwards '+cssName;
			}
		}
		
		// Add the animation end function
		O.el.addEventListener('animationend',function(event){
			if(this!==event.target) return;
			
			var styleAdd=/[^{]+;/.exec(new RegExp('@keyframes '+cssName+'{100%{[^}]*}}','i').exec(localStyle.innerHTML));
			
			if(styleAdd) this.style.cssText+=styleAdd[0];
			this.style.animation=null;
		});
	}
	
	M.audio=function(input){
		const O=this;
		O.type='audio';
		O.name=input;
		
		O.el=document.createElement('audio');
		O.el.src='<?php echo $stories_path; ?>resources/audio/'+O.name+'.mp3';
		O.el.preload=true;
		O.el.dataset.name=input;
		M.window.appendChild(O.el);
		
		// Checks if was playing outside of pausing the Showpony
		O.playing=false;
		
		O.content=function(input){
			if(Array.isArray(input)) input=input[0];
			
			O.el.src=input;
		}
		
		O.play=function(){
			O.playing=true;
			if(!S.paused) O.el.play();
		}
		
		O.pause=function(){
			O.playing=false;
			O.el.pause();
		}
		
		O.stop=function(){
			O.playing=false;
			O.el.pause();
			O.el.currentTime=0;
		}
		
		O.loop=function(input=false){
			O.el.loop=(input=="false" ? false : true);
		}
		
		O.volume=function(input=1){
			O.el.volume=input;
		}
		
		O.speed=function(input=1){
			O.el.playbackRate=input;
		}
		
		O.time=function(input=0){
			O.el.currentTime=input;
		}
		
		O.el.addEventListener('ended',function(){
			if(!O.el.loop) O.playing=false;
		});
		
		objectAddCommonFunctions(O);
	}
	
	M.background=function(input){
		const O=this;
		O.type='background';
		
		O.el=document.createElement('div');
		O.el.className='showpony-background';
		O.el.dataset.name=input;
		O.name=input;
		
		M.window.appendChild(O.el);

		O.content=function(input=O.name){
			O.el.style.backgroundImage='url("<?php echo $stories_path; ?>resources/backgrounds/'+input.split('#')[0]+'.jpg")';
		}
		
		objectAddCommonFunctions(O);
	}
	
	M.character=function(input){
		const O=this;
		O.type='character';
		
		O.el=document.createElement('div');
		O.el.className='showpony-character';
		O.el.dataset.name=input;
		O.name=input;
		
		M.window.appendChild(O.el);

		O.content=function(input,preloading=false){
			// Character level
			// Get the image names passed (commas separate layers)
			var imageNames=input.split(',');
		
			// Layer level
			// Go through each passed image and see if it exists
			for(var i=0;i<imageNames.length;i++){
				let layer=i+1;
				
				// Assume .png
				var image=imageNames[i]+='.png';
				
				// If the layer doesn't exist, add it!
				if(!O.el.children[layer]){
					O.el.appendChild(document.createElement('div'));
				}
				
				// If the image doesn't exist, add it!
				if(!O.el.children[layer].querySelector('div[data-image="'+image+'"]')){
					// Add a layer image
					var thisImg=document.createElement('div');
					thisImg.className='showpony-character-image';
					thisImg.dataset.image=image;
					thisImg.style.backgroundImage='url("<?php echo $stories_path; ?>resources/characters/'+O.name.split('#')[0]+'/'+image+'")';
					
					O.el.children[layer].appendChild(thisImg);
					
					if(preloading) thisImg.style.opacity=0;
				}
				
				if(preloading) continue;
				
				// Set the matching images' opacity to 1, and all the others to 0 (visibility:hidden, display:none would result in flashing images on some browsers)
				var images=O.el.children[layer].children;
				for(let ii=0;ii<images.length;ii++){
					if(images[ii].dataset.image===image){
						 images[ii].style.opacity=1;
					}else{
						images[ii].style.opacity=0;
					}
				}
			}
		}
		
		objectAddCommonFunctions(O);
		
		// Preload images
		for(let i=M.currentLine;i<M.lines.length;i++){
			var value=new RegExp(O.name+'(\s{3,}|\t+)(.+$)').exec(M.lines[i]);
			if(value) O.content(value[2],true);
		}
	}
	
	M.nameplate=function(input){
		const O=this;
		O.type='nameplate';
		O.name=input;
		
		O.el=document.createElement('p');
		O.el.className='showpony-nameplate';
		O.el.dataset.name=input;
		M.window.appendChild(O.el);
		
		O.content=function(input){
			if(input){
				O.el.innerHTML=input;
				O.el.style.visibility='visible';
			}else{
				O.el.style.visibility='hidden';
			}
		}
		
		objectAddCommonFunctions(O);
	}
	
	M.textbox=function(input){
		const O=this;
		O.type='textbox';
		O.name=input;
		
		O.el=document.createElement('form');
		O.el.className='showpony-textbox';
		O.el.dataset.name=input;
		O.el.addEventListener('submit',function(event){
			event.preventDefault();
		});
		M.window.appendChild(O.el);
		
		O.empty=function(){
			O.el.classList.add('showpony-textbox-hidden');
		}
		
		O.content=function(input='NULL: No text was passed.'){
			O.el.classList.remove('showpony-textbox-hidden');
			O.el.classList.remove('showpony-textbox-form-inactive');
			
			wait=true; // Assume we're waiting at the end time
			
			// If the line doesn't start with +, replace the text
			if(input[0]!=='+'){
				O.el.innerHTML='';
				O.el.scrollTop=0;
				
				inputting=false;
				
				// Split text by nameplate
				if(!objects.nameplate){
					objects.nameplate=new M.nameplate('nameplate');
				}
				
				var matches=/(.+)::(.*)/.exec(input);
				if(matches){
					objects.nameplate.content(matches[1]);
					input=matches[2];
				}else{
					objects.nameplate.content();
				}
				
			}
			else input=input.substr(1);
			
			// STEP 2: Design the text//
			
			// Design defaults
			var charElementDefault=document.createElement('span');
			charElementDefault.className='showpony-char-container';
			var charElement;
			var baseWaitTime;
			var constant;
			
			// Reset the defaults with this function, or set them inside here!
			function charDefaults(){
				// Use the default element for starting off
				charElement=charElementDefault.cloneNode(true);
				baseWaitTime=.03; // The default wait time
				constant=false; // Default punctuation pauses
			}
			
			// Use the defaults
			charDefaults();

			// The total time we're waiting until x happens
			var totalWait=0;
			var fragment=document.createDocumentFragment();
			var currentParent=fragment;
			
			var letters=''; // Have to save actual letters separately; special tags and such can mess with our calculations
			
			var lastLetter=null;
			
			var l=input.length;
			// We check beyond the length of the text because that lets us place characters that allow text wrapping in Firefox
			for(let i=0;i<=l;i++){
				var waitTime=baseWaitTime;
				
				// If a > is at the end of a text line, continue automatically.
				// Won't interfere with tags, no worries!
				if(i==l-1 && input[i]==='>'){
					wait=false;
					continue;
				}
				
				// If HTML
				if(input[i]==='<'){
					// Skip over the opening bracket
					i++;
				
					var values='';
					
					// Wait until a closing bracket (or the end of the text)
					while(input[i]!='>' && i<input.length){
						values+=input[i];
						i++;
					}
					
					// We're closing the element
					if(values[0]==='/'){
						values=values.substr(1);
						
						switch(values){
							case 'shout':
							case 'shake':
							case 'sing':
							case 'fade':
								charElement.classList.remove('showpony-char-'+values);
								break;
							case 'speed':
								// /TODO: allow nested <speed> tags, so it'll go back to the speed of the parent element
								// Adjust by the default wait set up for it
								baseWaitTime=.03;
								constant=false;
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
							case 'shout':
							case 'sing':
							case 'shake':
							case 'fade':
								charElement.classList.add('showpony-char-'+tag);
								break;
							case 'speed':
								for(let ii=0;ii<attributes.length;ii++){
									if(attributes[ii][4]) constant=true;
									else{
										if(attributes[ii][1]==='constant') constant=(attributes[ii][3]==='false' ? false : true);
										if(attributes[ii][1]==='rate') baseWaitTime*=parseFloat(attributes[ii][3]);
									}
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
											O.el.classList.add('showpony-textbox-form-inactive');
											
											// This might just be a continue button, so we need to check
											if(this.dataset.var) S.data[this.dataset.var]=this.dataset.val;
											
											if(this.dataset.go) M.progress(M.lines.indexOf(this.dataset.go));
											else M.progress();
											
											// We don't want to run S.input here
											event.stopPropagation();
										});
									}else{
										// Set data to the defaults of these, in case the user just clicks through
										if(newElement.dataset.var) S.data[newElement.dataset.var]=newElement.value;
										
										newElement.addEventListener('change',function(){
											S.data[this.dataset.var]=this.value;
											console.log(this.value);
										});
									}
								}
							break;
						}
					}
					
					// Pass over the closing bracket
					continue;
				// If letters
				}else{
					letters+=input[i];
				
					// Handle punctuation- at spaces we check, if constant isn't true
					if(i!==input.length && (input[i]===' ') && !constant){
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
						}
					}

					// Make the char based on charElement
					var thisChar=charElement.cloneNode(false);
					
					let showChar=document.createElement('span')				// Display char (appear, shout, etc), parent to animChar
					showChar.className='showpony-char';
					let animChar=document.createElement('span')			// Constant animation character (singing, shaking...)
					animChar.className='showpony-char-anim';
					let hideChar=document.createElement('span');	// Hidden char for positioning
					hideChar.className='showpony-char-placeholder';
					
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
								if(runTo!==false) return;
								
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
						hideChar.innerHTML=animChar.innerHTML=input[i];
					}
					
					// Set the display time here- but if we're paused, or running through the text with runTo, no delay!
					if(!S.paused && !inputting && runTo===false) showChar.style.animationDelay=totalWait+'s';
					
					// Set animation timing for animChar, based on the type of animation
					if(thisChar.classList.contains('showpony-char-sing')){
						animChar.style.animationDelay=-(letters.length*.1)+'s';
					}
					
					if(thisChar.classList.contains('showpony-char-shake')){
						animChar.style.animationDelay=-(letters.length/3)+'s';
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
			
			// If the user's trying to skip text, let them
			if(inputting && input[input.length-1]=='>'){
				console.log('Hey! skip this!');
			}else{
				inputting=false;
			}
			
			lastLetter.addEventListener('animationstart',function(event){
				if(this!==event.target) return;
				
				// If we aren't waiting to continue, continue
				if(!wait){
					M.progress();
				}else{
					// If we need players to click to continue (and they have no inputs to fill out or anything), notify them:
					if(!O.el.querySelector('input')){
						// If we're automatically continuing
						if(S.auto){
							// M.progress();
						// If we're waiting for user input
						}else{
							M.window.appendChild(continueNotice);
						}
					}
				}
			});
			
			// Add the chars to the textbox
			O.el.appendChild(fragment);
		}
		objectAddCommonFunctions(O);
	}
	
	M.previousKeyframe=function(){
		// Go back a keyframe's length, so we get to the previous keyframe
		var keyframeLength=S.files[S.currentFile].duration/keyframes.length;
		
		// /TODO: account for starting at the end of a previous KN file
		S.to({time:'-'+keyframeLength});
	}
	
	function powerTimer(callback,delay){
		// Thanks to https://stackoverflow.com/questions/3969475/javascript-pause-settimeout

		const pT=this;
		
		var timerId,start;
		pT.remaining=delay;

		pT.pause=function(){
			window.clearTimeout(timerId);
			pT.remaining-=new Date()-start;
		};

		pT.resume=function(){
			if(pT.remaining<=0) return;
			
			start=new Date();
			window.clearTimeout(timerId);
			timerId=window.setTimeout(function(){
				callback();
				pT.end();
			},pT.remaining);
		};

		pT.end=function(){
			if(pT.remaining>0) window.clearTimeout(timerId);
			pT.remaining=0;
		}
		
		pT.resume();
	}
}();