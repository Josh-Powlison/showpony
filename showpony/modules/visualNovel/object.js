/// TODO: fix general bugs
/// TODO: condense and optimize (I suspect we can get this down by a large amount)

S.modules.<?php echo 'visualNovel'; ?>=new function(){
	const M=this;
	
	M.currentTime=null;
	M.currentFile=null;
	M.currentLine=null;
	
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
	
	//The elements in the vn
	var objects={};
	
	M.play=function(){
		//Go through objects that were playing- unpause them
		for(var key in objects){
			if(objects[key].wasPlaying){
				objects[key].play();
			}
		}
		
		//Resume waitTimer
		waitTimer.resume();
	}
	
	M.pause=function(){
		//Go through objects that can be played- pause them, and track that
		for(var key in objects){
			//If it can play, and it is playing
			if(typeof(objects[key].wasPlaying)!=='undefined'){
				objects[key].pause();
			}
		}
		
		//Pause waitTimer
		waitTimer.pause();
	}
	
	M.input=function(){
		//If a wait timer was going, stop it.
		if(waitTimer.remaining>0){
			//Run all animations, end all transitions
			content.classList.add('showpony-loading');
			M.window.offsetHeight; //Trigger reflow to flush CSS changes
			content.classList.remove('showpony-loading');
			
			waitTimer.end();
		}
		
		//Remove the continue notice
		continueNotice.remove();
		
		//End object animations on going to the next frame
		for(var key in objects){
			if(objects[key].tagName) objects[key].dispatchEvent(new Event('animationend'));
			else{
				console.log(objects[key]);
				objects[key].el.dispatchEvent(new Event('animationend'));
			}
		}
		
		var choices=false;
		
		//If the player is making choices right now
		if(objects[currentTextbox] && objects[currentTextbox].el.querySelector('input')) choices=true;
		
		//If all letters are displayed
		if(!objects[currentTextbox] || objects[currentTextbox].el.children.length===0 || objects[currentTextbox].el.lastChild.firstChild.style.visibility=='visible'){
			inputting=false;
			if(!choices) M.progress();
		}
		else //If some objects have yet to be displayed
		{
			//Run all animations, end all transitions
			content.classList.add('showpony-loading');
			M.window.offsetHeight; //Trigger reflow to flush CSS changes
			content.classList.remove('showpony-loading'); //Needs to happen before the latter; otherwise, it'll mess up stuff
			
			//Display all letters
			M.window.querySelectorAll('.showpony-char').forEach(function(key){
				//Skip creating animation, and display the letter
				key.style.animationDelay=null;
				var classes=key.className;
				key.className=classes;
				key.style.animation='initial';
				key.firstChild.dispatchEvent(new CustomEvent('animationstart'));
				key.style.visibility='visible';
			});
			
			if(choices) return;
			
			inputting=true;
			
			//Continue if not waiting
			if(!wait) M.progress();
			else{
				//If automatically progressing, do so
				///TODO: allow setting a value to progressing time
				if(S.auto){
					// M.progress();
				}
				//Else, if waiting for user input
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
			//Visual Novel engine resets
			waitTimer.end();
			
			//If this is the current file
			if(M.currentFile===file){
				// Get the correct keyframe position
				runTo=Math.round(keyframes.length*(time/S.files[M.currentFile].duration));
				if(runTo>=keyframes.length) runTo=keyframes[keyframes.length-1];
				else runTo=keyframes[runTo];
				
				console.log(M.currentLine,{time,runTo,keyframes},M.lines[runTo]);
				// console.log(M.lines);
				
				// If this is the current keyframe, resolve
				if(runTo===M.currentLine){
					resolve();
					return;
				}
				
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
				//Remove multiline comments
				text=text.replace(/\/\*[^]*?\*\//g,'');
				
				//Get all non-blank lines
				M.lines=text.match(/.+(?=\S).+/g);
				
				//Get keyframes from the text- beginning, end, (? ->)and waiting points
				keyframes=[0];
				
				for(let i=1;i<M.lines.length;i++){
					//If it's a user file spot, add the point immediately after the last keyframe- things let up to this, let it all happen
					if(M.lines[i]==='engine.wait'){
						keyframes.push(keyframes[keyframes.length-1]+1);
						continue;
					}
					
					//Regular text lines (not continuing) can be keyframes
					if(/^\t+(?!\t*\+)/i.test(M.lines[i])) keyframes.push(i);
				}
				
				runTo=Math.round(keyframes.length*(M.currentTime/S.files[file].duration));
				if(runTo>=keyframes.length) runTo=keyframes[keyframes.length-1];
				else runTo=keyframes[runTo];
				
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
			///NOTHING YET!
		}else{
			//If don't have the file
			fetch(S.subtitles[S.currentSubtitles]+S.files[M.currentFile].title+'.vtt')
			.then(response=>{return response.text();})
			.then(text=>{
				S.files[M.currentFile].subtitles=text;
				M.displaySubtitles();
			});
		}
	}
	
	//Run visual novel
	M.progress=function(inputNum=M.currentLine+1){
		//Go to either the specified line or the next one
		M.currentLine=inputNum;
		
		//Skip comments
		if(/^\/\//.test(M.lines[M.currentLine])){
			M.progress();
			return;
		}
		
		//Run through if we're running to a point; if we're there or beyond though, stop running through
		if(runTo!==false && M.currentLine>=runTo){
			runTo=false;
			inputting=false;
			
			console.log('TARGET',target);
			console.log('OBJECTS',objects);
			
			// Delete unnecessary target info
			delete target['engine'];
			
			//Adjust everything based on the list
			
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
					switch(target[name].type){
						case 'audio': objects[name]=new audio(name); break;
						case 'background': objects[name]=new background(name); break;
						case 'character': objects[name]=new character(name); break;
						case 'textbox': objects[name]=new textbox(name); break;
						case 'name': objects[name]=new name(name); break;
						default: break;
					}
				}
				
				// Reset the object's custom CSS
				objects[name].style();
				
				// Go through the object's functions and reset them to their base or passed values
				for(var check in target[name]){
					// Skip over "remove" function- we don't want to run that one :P
					if(check==='remove') continue;
					
					// console.log('CHECKING THIS:',name,check,typeof(objects[name][check]),target[name][check]);
					
					if(typeof(objects[name][check])==='function'){
						if(typeof(target[name][check])==='undefined'){
							objects[name][check]();
						}else{
							// console.log('PASSING TO ',name,',',check,':',target[name][check]);
							objects[name][check](target[name][check]);
						}
						
					}
				}
			}
			
			target={};
			// console.log('TARGET AT END',target);
			waitTimer.end();
			
			M.window.offsetHeight; //Trigger reflow to flush CSS changes
			content.classList.remove('showpony-loading');
			
			// console.log('OBJECTS AT END',objects);
		}
		
		//If we've ended manually or reached the end, stop running immediately and end it all
		if(M.currentLine>=M.lines.length){
			S.to({file:'+1'});
			return;
		}
		
		//Update the scrubbar if the frame we're on is a keyframe
		if(runTo===false && keyframes.includes(M.currentLine)){
			//Set the time of the element
			timeUpdate((keyframes.indexOf(M.currentLine)/keyframes.length)*S.files[M.currentFile].duration);
		}
		
		var vals=M.lines[M.currentLine];
		
		//Replace all variables (including variables inside variables) with the right name
		var match;
		while(match=/[^\[]+(?=\])/g.exec(vals)) vals=vals.replace('['+match[0]+']',S.data[match[0]]);
		
		vals=vals.split(/(?:\s{3,}|\t+)/);
		
		//Determine the type of object//
		var command=/\..+/.exec(vals[0]);
		if(!command) command='content';
		else command=command[0].replace('.','');
		
		var type='character';
		if(vals.length===1){
			type='background';
		}
		
		//Check if audio
		if(/play|pause|stop|loop/.test(command)){
			type='audio';
		}
		
		var name=/^[^\.\t]+/.exec(vals[0]);
		if(!name){
			name='textbox';
			type='textbox';
		}
		else name=name[0];
		
		//The engine's the object! Gasp!
		if(/go|end|runEvent|setTextbox|wait/.test(command)) name='engine';
		
		//If we're running through to a point, add the info to the target
		if(runTo){
			
			if(!target[name]){
				target[name]={
					'type':type
				};
			}
			
			// Add styles; everything else is replaced
			if(command==='style'){
				if(!target[name].style) target[name].style='';
				
				//Styles are appended; later ones will override earlier ones. Time is removed here; we don't want to affect that here.
				var value=vals[1].replace(/time:[^;]+;?/i,'');
				target[name].style+=value;
			}else{
				var value=vals[1];
				target[name][command]=value;
			}
			
			// Continue without creating objects- we'll look at THAT once we've run through and added all the info to the target
			M.progress();
			return;
		}
		
		//If an object with the name doesn't exist, make it!
		if(!objects[name] && name!=='engine'){
			switch(type){
				case 'audio': objects[name]=new audio(name); break;
				case 'background': objects[name]=new background(name); break;
				case 'character': objects[name]=new character(name); break;
				case 'textbox': objects[name]=new textbox(name); break;
				case 'name': objects[name]=new name(name); break;
				default: break;
			}
		}
		
		// Run an engine command or object command
		if(name==='engine'){
			M[command](vals[1]);
			return;
		}else{
			objects[name][command](vals[1]);
		}
		
		//Operations need to be functions of the parent
		///TODO: get operations working again, but as engine.commands
				
		//Don't automatically continue on text updates or engine commands
		if(type==='textbox' && command==='content') return;
		
		M.progress();
	}
	
	//If a value's a number, return it as one
	function ifParse(input){
		return isNaN(input) ? input : parseFloat(input);
	}
	
	//Data
	M.operation=function(vals){
		
		var type=/[+=\-<>!]+$/.exec(vals[0]);
		console.log('RUNNING OPERATION',vals,type);
		
		if(!type) return;
		
		type=type[0];
		//Remove type from variable name
		var name=vals[0].replace(type,'');
		
		//Check values inline
		var operators={
			'='		:(a,b)=>	b
			,'+='	:(a,b)=>	a+b
			,'-='	:(a,b)=>	a-b
			,'=='	:(a,b)=>	a==b
			,'<'	:(a,b)=>	a<b
			,'>'	:(a,b)=>	a>b
			,'<='	:(a,b)=>	a<=b
			,'>='	:(a,b)=>	a>=b
			,'!'	:(a,b)=>	a!=b
		};
		
		switch(type){
			//Operations
			case '=':
			case '+=':
			case '-=':
				S.data[name]=operators[type](
					ifParse(S.data[name])
					,ifParse(vals[1])
				);
				
				M.progress();
				break;
			//Comparisons
			default:
				if(operators[type](
					ifParse(S.data[name])
					,ifParse(vals[1])
				)) M.progress(M.lines.indexOf(vals[2]));
				else M.progress();
				break;
		}
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
	
	M.setTextbox=function(input){
		currentTextbox=input;
		M.progress();
	}
	
	M.wait=function(input){
		//If there's a waitTimer, clear it out
		if(waitTimer.remaining>0){
			waitTimer.end();
		}
		
		//Skip waiting if we're running through
		if(runTo){
			M.progress();
			return;
		}
		
		//If a value was included, wait for the set time
		if(input) waitTimer=new powerTimer(M.progress,parseFloat(input)*1000);
		//Otherwise, let the user know to continue it
		else{
			//If we're automatically proceeding
			if(S.auto){
				// M.progress();
			}
			//If we're waiting for player input
			else{
				M.window.appendChild(continueNotice);
			}
		}
		
		//If we're paused, pause the timer
		if(S.paused) waitTimer.pause();
		
		//Don't automatically go to the next line
	}
	
	/*
	ADD:
	name
		content
		style
	*/

	//STYLE and REMOVE are the same for every instance.
	
	//RELEVANT FOR USING MULTIPLE FILES (for characters): add in this support later
	//var name=/^[^#]+/.exec(object)[0];
	
	//Pass new objects to this function to add common sub-functions
	function objectAddCommonFunctions(O){
		//Remove element
		O.remove=function(){
			O.el.remove();
			delete objects[O.name];
		}
		
		var localStyle=document.createElement('style');
		O.el.appendChild(localStyle);
		var cssName=O.el.dataset.name.replace(/#/g,'id');
		
		//Adjust the styles, and add animations
		O.style=function(style=null){
			// If no styles are passed, remove all added styles
			if(style===null){
				// console.log('Removed styles for ',O.name);
				O.el.style.cssText='';
				localStyle.innerHTML='';
				return;
			}
			
			var animationSpeed=/time:[^s;$]+/i.exec(style);
			
			//Add back in to support multiple objects sharing the same file set
			
			//If running to or not requesting animation, add styles without implementing animation
			if(animationSpeed===null || M.currentLine<runTo){
				O.el.style.cssText+=style;
			}else{
				localStyle.innerHTML='@keyframes '+cssName+'{100%{'+style+'}}';
				
				O.el.style.animation=animationSpeed[0].split(':')[1]+'s forwards '+cssName;
			}
		}
		
		//Add the animation end function
		O.el.addEventListener('animationend',function(event){
			if(this!==event.target) return;
			
			var styleAdd=/[^{]+;/.exec(new RegExp('@keyframes '+cssName+'{100%{[^}]*}}','i').exec(localStyle.innerHTML));
			
			if(styleAdd) this.style.cssText+=styleAdd[0];
			this.style.animation=null;
		});
	}
	
	function audio(input){
		const O=this;
		O.type='audio';
		O.name=input;
		
		O.el=document.createElement('audio');
		O.el.src='<?php echo $stories_path; ?>resources/audio/'+O.name+'.mp3';
		O.el.preload=true;
		O.el.dataset.name=input;
		M.window.appendChild(O.el);
		
		//Checks if was playing outside of pausing the Showpony
		O.wasPlaying=false;
		
		O.content=function(input){
			if(Array.isArray(input)) input=input[0];
			
			O.el.src=input;
		}
		
		O.play=function(){
			if(S.paused) O.wasPlaying=true;
			if(!S.paused) O.el.play();
		}
		
		O.pause=function(){
			if(S.paused) O.wasPlaying=false;
			O.el.pause();
		}
		
		O.stop=function(){
			if(S.paused) O.wasPlaying=false;
			O.el.pause();
			O.el.currentTime=0;
		}
		
		O.loop=function(input=true){
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
		
		objectAddCommonFunctions(O);
	}
	
	function background(input){
		const O=this;
		O.type='background';
		
		O.el=document.createElement('div');
		O.el.className='showpony-background';
		O.el.dataset.name=input;
		O.name=input;
		
		M.window.appendChild(O.el);

		O.content=function(input=O.name){
			O.el.style.backgroundImage='url("<?php echo $stories_path; ?>resources/backgrounds/'+input+'.jpg")';
		}
		
		objectAddCommonFunctions(O);
	}
	
	function character(input){
		const O=this;
		O.type='character';
		
		O.el=document.createElement('div');
		O.el.className='showpony-character';
		O.el.dataset.name=input;
		O.name=input;
		
		M.window.appendChild(O.el);
		
		/*
		var lines=input;
		
		//Go through the rest of the lines, looking for images to preload
		for(let i=M.currentLine;i<M.lines.length;i++){
			
			//If this character is listed on this line
			if(M.lines[i].indexOf(object+'\t')===0){
				//Add the image names to the images to load
				lines.push(M.lines[i].split(/\s{3,}|\t+/)[1]);
			}
		}*/
		
		O.content=function(input,hide=false){
			//Character level
			//Get the image names passed (commas separate layers)
			var imageNames=input.split(',');
		
			//Layer level
			//Go through each passed image and see if it exists
			for(var i=0;i<imageNames.length;i++){
				let layer=i+1;
				
				//Assume .png
				var image=imageNames[i]+='.png';
				
				//If the layer doesn't exist, add it!
				if(!O.el.children[layer]){
					O.el.appendChild(document.createElement('div'));
				}
				
				//If the image doesn't exist, add it!
				if(!O.el.children[layer].querySelector('div[data-image="'+image+'"]')){
					//Add a layer image
					var thisImg=document.createElement('div');
					thisImg.className='showpony-character-image';
					thisImg.dataset.image=image;
					thisImg.style.backgroundImage='url("<?php echo $stories_path; ?>resources/characters/'+O.name.split('#')[0]+'/'+image+'")';
					
					O.el.children[layer].appendChild(thisImg);
				}
				
				//Set the matching images' opacity to 1, and all the others to 0
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
		
		//if(input) O.content();
	}
	
	function textbox(input){
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
		
		O.content=function(input='NULL: No text was passed.'){
			//var keepGoing=multimediaFunction[vals[0].toLowerCase().substr(0,2)](vals);
		
			//var keepGoing=false;
			//if(!keepGoing) M.progress();
			
			//If we're running through, skip displaying text until we get to the right point
			if(runTo){
				M.progress(undefined);
				return;
			}
			
			wait=true; //Assume we're waiting at the end time
			
			input=input.replace(/^\t+/,'');
			
			//If the line doesn't start with +, replace the text
			if(input[0]!=='+'){
				O.el.innerHTML='';
				/*
				if(!objects.name) M.window.appendChild(objects.name=document.createElement('div'));
				
				objects.name.className='showpony-name';
				
				//Split up the text so we can have names automatically written
				var nameText=input.split('::');
				if(nameText.length>1){
					input=nameText[1];
					objects.name.innerHTML=nameText[0];
					objects.name.style.visibility='visible';
				}else{
					objects.name.style.visibility='hidden';
				}*/
				
				inputting=false;
			}
			else input=input.substr(1);
			
			//STEP 2: Design the text//
			
			//Design defaults
			var charElementDefault=document.createElement('span');
			charElementDefault.className='showpony-char-container';
			var charElement;
			var baseWaitTime;
			var constant;
			
			//Reset the defaults with this function, or set them inside here!
			function charDefaults(){
				//Use the default element for starting off
				charElement=charElementDefault.cloneNode(true);
				baseWaitTime=.03; //The default wait time
				constant=false; //Default punctuation pauses
			}
			
			//Use the defaults
			charDefaults();

			//The total time we're waiting until x happens
			var totalWait=0;
			var fragment=document.createDocumentFragment();
			var currentParent=fragment;
			
			var letters=''; //Have to save actual letters separately; special tags and such can mess with our calculations
			
			var lastLetter=null;
			
			var l=input.length;
			//We check beyond the length of the text because that lets us place characters that allow text wrapping in Firefox
			for(let i=0;i<=l;i++){
				var waitTime=baseWaitTime;
				
				//If a > is at the end of a text line, continue automatically.
				//Won't interfere with tags, no worries!
				if(i==l-1 && input[i]==='>'){
					wait=false;
					continue;
				}
				
				//If HTML
				if(input[i]==='<'){
					//Skip over the opening bracket
					i++;
				
					var values='';
					
					//Wait until a closing bracket (or the end of the text)
					while(input[i]!='>' && i<input.length){
						values+=input[i];
						i++;
					}
					
					//We're closing the element
					if(values[0]=='/'){
						values=values.substr(1);
						
						switch(values){
							case 'shout':
							case 'shake':
							case 'sing':
							case 'fade':
								charElement.classList.remove('showpony-char-'+values);
								break;
							case 'speed':
								///TODO: allow nested <speed> tags, so it'll go back to the speed of the parent element
								//Adjust by the default wait set up for it
								baseWaitTime=.03;
								constant=false;
								break;
							default:
								//If the parent doesn't have a parent (it's top-level)
								if(currentParent.parentElement==null){
									fragment.appendChild(currentParent);
									currentParent=fragment;
								//If a parent element exists, it's the new parent
								}else{
									currentParent=currentParent.parentElement;
								}
								break;
						}
					//We're creating the element
					}else{
						values=values.split(' ');
						
						switch(values[0]){
							case 'shout':
							case 'sing':
							case 'shake':
							case 'fade':
								charElement.classList.add('showpony-char-'+values);
								break;
							case 'speed':
								//Check the attributes
								for(let i=1;i<values.length;i++){
									if(values[i]==='constant'){
										constant=true;
									//It must be speed if not other
									}else baseWaitTime*=parseFloat(/[\d\.]+/.exec(values[i])[0]);
								}
								break;
							case 'br':
								var lineBreak=document.createElement('span');
								lineBreak.style.whiteSpace='pre-line';
								lineBreak.innerHTML=' <wbr>';
								currentParent.appendChild(lineBreak); //wbr fixes missing lines breaks in Firefox
								currentParent.appendChild(document.createElement('br'));
								break;
							case 'wbr':
							case 'img':
							case 'embed':
							case 'hr':
							case 'input':
								var newParent=document.createElement(values[0]);
								
								//Set attributes, if any were passed
								for(let ii=1;ii<values.length;ii++){
									
									if(values[ii].indexOf('=')>-1){
										var attValues=values[ii].substr().split('=');
										
										//Remove surrounding quotes
										if(/['"]/.test(attValues[1])){
											attValues[1]=attValues[1].substr(1,attValues[1].length-2);
										}
										
										newParent.setAttribute(attValues[0],attValues[1]);
									}else{
										newParent.setAttribute(attValues[0],'true');
									}
								}
								
								currentParent.appendChild(newParent);
								
								//If an input type, wait until input is set and stuff
								if(values[0]=='input'){
									//Update data based on this
									if(newParent.type==='button' || newParent.type==='submit'){
										newParent.addEventListener('click',function(event){
											//This might just be a continue button, so we need to check
											if(this.dataset.var) S.data[this.dataset.var]=this.dataset.val;
											
											if(this.dataset.go) M.progress(M.lines.indexOf(this.dataset.go));
											else M.progress();
											
											//We don't want to run S.input here
											event.stopPropagation();
										});
									}else{
										//Set data to the defaults of these, in case the user just clicks through
										if(newParent.dataset.var) S.data[newParent.dataset.var]=newParent.value;
										
										newParent.addEventListener('change',function(){
											S.data[this.dataset.var]=this.value;
											console.log(this.value);
										});
									}
								}
								break;
							default:
								var newParent=document.createElement(values[0]);
								
								//Set attributes, if any were passed
								for(let ii=1;ii<values.length;ii++){
									
									if(values[ii].indexOf('=')>-1){
										var attValues=values[ii].substr().split('=');
										
										//Remove surrounding quotes
										if(/['"]/.test(attValues[1])){
											attValues[1]=attValues[1].substr(1,attValues[1].length-2);
										}
										
										newParent.setAttribute(attValues[0],attValues[1]);
									}else{
										newParent.setAttribute(attValues[0],'true');
									}
								}
								
								currentParent.appendChild(newParent);
								currentParent=newParent;
							break;
						}
						
					}
					
					//Pass over the closing bracket
					continue;
				//If letters
				}else{
					letters+=input[i];
				
					//Handle punctuation- at spaces we check, if constant isn't true
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

					//Make the char based on charElement
					var thisChar=charElement.cloneNode(false);
					
					let showChar=document.createElement('span')				//Display char (appear, shout, etc), parent to animChar
					showChar.className='showpony-char';
					let animChar=document.createElement('span')			//Constant animation character (singing, shaking...)
					animChar.className='showpony-char-anim';
					let hideChar=document.createElement('span');	//Hidden char for positioning
					hideChar.className='showpony-char-placeholder';
					
					//Spaces
					//and Ending! (needs this to wrap lines correctly on Firefox)
					if(input[i]===' ' || i===l){
						thisChar.style.whiteSpace='pre-line';
						hideChar.innerHTML=animChar.innerHTML=' <wbr>';
						
						showChar.addEventListener('animationstart',function(event){
							//If the animation ended on a child, don't continue! (animations are applied to children for text effects)
							if(this!=event.target) return;
							
							//If the element's currently hidden (the animation that ended is for unhiding)
							if(this.style.visibility!=='visible'){
								this.style.visibility='visible';
								//If the letter's below the textbox
								if(this.parentNode.getBoundingClientRect().bottom>O.el.getBoundingClientRect().bottom){
									O.el.scrollTop=this.parentNode.offsetTop+this.parentNode.offsetHeight-O.el.offsetHeight;
								}
								
								//If the letter's above the textbox
								if(this.parentNode.getBoundingClientRect().top<O.el.getBoundingClientRect().top){
									O.el.scrollTop=this.parentNode.offsetTop;
								}
								
							}
						});
					}else{
						hideChar.innerHTML=animChar.innerHTML=input[i];
					}
					
					//Set the display time here- but if we're paused, no delay!
					if(!S.paused && !inputting) showChar.style.animationDelay=totalWait+'s';
					
					//Set animation timing for animChar, based on the type of animation
					if(thisChar.classList.contains('showpony-char-sing')){
						animChar.style.animationDelay=-(letters.length*.1)+'s';
					}
					
					if(thisChar.classList.contains('showpony-char-shake')){
						animChar.style.animationDelay=-(letters.length/3)+'s';
					}
					
					//Build the char and add it to the parent (which may be a document fragment)
					showChar.appendChild(animChar);
					thisChar.appendChild(showChar);
					thisChar.appendChild(hideChar);
					currentParent.appendChild(thisChar);
					
					totalWait+=waitTime;
					
					lastLetter=showChar;
				}
			}
			
			//If the user's trying to skip text, let them
			if(inputting && input[input.length-1]=='>'){
				console.log('Hey! skip this!');
			}else{
				inputting=false;
			}
			
			//if(objects[currentTextbox].dataset.async!=true){
			
				lastLetter.addEventListener('animationstart',function(event){
					if(this!==event.target) return;
					
					//If we aren't waiting to continue, continue
					if(!wait){
						M.progress();
					}else{
						//If we need players to click to continue (and they have no inputs to fill out or anything), notify them:
						if(!O.el.querySelector('input')){
							//If we're automatically continuing
							if(S.auto){
								// M.progress();
							//If we're waiting for user input
							}else{
								M.window.appendChild(continueNotice);
							}
						}
					}
				});
			//}
			
			//Add the chars to the textbox
			O.el.appendChild(fragment);
			
			//Continue if async textbox
			//if(objects[currentTextbox].dataset.async==true) M.progress();
		}
		objectAddCommonFunctions(O);
	}
	
	M.previousKeyframe=function(){
		//Go back a keyframe's length, so we get to the previous keyframe
		var keyframeLength=S.files[S.currentFile].duration/keyframes.length;
		
		///TODO: account for starting at the end of a previous KN file
		S.to({time:'-'+keyframeLength});
	}
	
	function powerTimer(callback,delay){
		//Thanks to https://stackoverflow.com/questions/3969475/javascript-pause-settimeout

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