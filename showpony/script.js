//Get location of the Showpony folder
const ShowponyFolder=document.currentScript.src.replace('/script.js','');

//Find the relative path from ShowponyFolder to ShowponyRunPage
var splitPath=ShowponyFolder.split('/');
var splitStart=location.href.replace(/\/[^\/]+$/,'').split('/');

//Get relative path from Showpony folder to current page (for the sake of PHP)
var ShowponyRunPage='';
for(var i=0;i<splitStart.length;i++){
	//If the paths are the same
	if(splitPath.length>i && splitPath[i]===splitStart[i]){
		//We ignore them!
	//If they differ- we've found the first shared folder!
	}else{
		//Go up as many levels as need to to get to the shared folder
		for(var ii=i;ii<splitPath.length;ii++){
			ShowponyRunPage+='../';
		}
		
		//Now go down to the right folder
		for(var ii=i;ii<splitStart.length;ii++){
			ShowponyRunPage+=splitStart[ii];
			
			if(ii!==splitStart.length-1) ShowponyRunPage+='/'
		}
		
		//Break out of the main for loop
		break;
	}
	
}

//Load CSS if not loaded already
if(!document.querySelector('[href$="showpony/styles.css"]')){
	var styles=document.createElement('link');
	styles.rel='stylesheet';
	styles.href=ShowponyFolder+'/styles.css';
	document.head.appendChild(styles);
}

function Showpony(input){

'use strict';

//If an input object doesn't exist, make one
if(!input) input={};

//If no window was passed, make one!
if(!input.window){
	document.currentScript.insertAdjacentElement('afterend',input.window=document.createElement('div'));
	input.window.className='showpony-default';
}

///////////////////////////////////////
///////////PUBLIC VARIABLES////////////
///////////////////////////////////////

//Engine settings
const S=this;

//Set default values
function d(v,val){S[v]=(input[v]!==undefined ? input[v] : val);}

S.window=input.window;
S.originalWindow=S.window.cloneNode(true);
S.buffered=false;

/*VARIABLE				DEFAULT VALUE										*/
d('get'				,	'files/[lang]/'										);
d('language'		,	'en'												);
d('scrubLoad'		,	false												);
d('info'			,	'[Current File] | [Files Left]'						);
d('credits'			,	null												);
d('data'			,	{}													);
d('defaultDuration'	,	10													);
d('title'			,	false												);
d('dateFormat'		,	{year:'numeric',month:'numeric',day:'numeric'}		);
d('admin'			,	false												);
d('query'			,	'part'												);
d('shortcuts'		,	'focus'												);
d('saveId'			,	location.hostname.substring(0,20)					);
d('localSave'		,	false												);
d('remoteSave'		,	true												);
d('preloadNext'		,	1													);
d('showBuffer'		,	true												);
d('subtitles'		,	null												);
d('currentSubtitles',	null												);
d('cover'			,	null												);
d('infiniteScroll'	,	false												);
d('start'			,	'last'												);

var HeyBardConnection;

///////////////////////////////////////
///////////PUBLIC FUNCTIONS////////////
///////////////////////////////////////

var objectBuffer, keyframes;

//Go to another file
S.to=function(input){
	content.classList.add('showpony-loading');
	
	var obj=input || {};
	
	//Relative file
	if(obj.file && (obj.file[0]==='+' || obj.file[0]==='-')) obj.file=S.currentFile+(parseInt(obj.file.substring(1))*(obj.file[0]==='-' ? -1 : 1));
	
	//Relative time
	if(obj.time && (obj.time[0]==='+' || obj.time[0]==='-')){
		var getTime=0;
		//Add the times of previous videos to get the actual time in the piece
		for(let i=0;i<S.currentFile;i++) getTime+=S.files[i].duration;
		
		getTime+=types[currentType] && types[currentType].currentTime || 0;
		
		obj.time=getTime+(parseFloat(obj.time.substring(1))*(obj.time[0]==='-' ? -1 : 1));
		
		//Don't go below 0
		if(obj.time<0) obj.time=0;
	}
	
	//If a time is passed but no file, get file and time based on the place in the total
	if(obj.time!==undefined && obj.file===undefined){
		obj.file=0;
		
		//Look through the videos for the right one
		var l=S.files.length;
		for(let i=0;i<l;i++){
			var length=S.files[i].duration;
			
			//If we've reached the file, exit
			if(obj.time<length) break;
			//Otherwise go to the next file
			else obj.file++, obj.time-=length;
			
			//If the time passed is greater than the total time, the story will end
		}
	}
	
	Object.assign(obj,{
		file:obj.file!==undefined ? obj.file : S.currentFile
		,time:obj.time || 0
		,refresh:obj.refresh || false
		,reload:obj.reload || false
		,scrollToTop:obj.scrollToTop===undefined ? true : obj.scrollToTop
		,popstate:obj.popstate || false
		,replaceState:obj.replaceState || false
	});
	
	var sameFile=S.currentFile===obj.file;
		
		/*
	//Don't continue if the file is the same and not refreshable
	if(obj.file===S.currentFile && !types[S.files[S.currentFile].medium].hasOwnProperty('currentTime')){
		return;
	}*/
	/*
	
	if(obj.file==S.currentFile && !obj.refresh) return;*/
	
	//Use different options
	obj.file=
		obj.file==='first' ? 0
		: obj.file==='prev' ? S.currentFile-1
		: obj.file==='next' ? S.currentFile+1
		: obj.file==='last' ? S.files.length-1
		: parseInt(obj.file || 0) //Get the file, or 0 if it's undefined
	;
	
	//If we're at the end, run the readable event
	if(obj.file>=S.files.length){
		obj.file=S.files.length-1;
		obj.time=S.files[S.files.length-1].duration;
		if(obj.time<0) obj.time=0;
		
		//If we aren't just trying to reload a file, end; otherwise, get to that last file
		if(!obj || !obj.reload){
			//Run the event that users can read
			S.window.dispatchEvent(new CustomEvent('end'));
			content.classList.remove('showpony-loading');
			return;
		}
	}
	
	if(obj.file<0) obj.file=0;
	if(!S.infiniteScroll){
		S.currentFile=obj.file;
		
		//Update info on file load
		if(!obj.popstate){
			//Only allow adding to history if we aren't scrubbing
			
			//If the same file, and not a medium where time changes it (like images), replace history state instead
			if(sameFile && currentType!=='video' && currentType!=='audio'){
				obj.replaceState=true;
			}
			
			var popstate=!obj.replaceState;
			if(scrubbing===true) popstate=false; //Only replace history if we're scrubbing right now
			
			updateInfo(popstate);
		}
		
		//If we aren't moving the bar, update the overlay
		if(scrubbing===false){
			//Go to the top of the page (if we didn't come here by autoloading)
			if(obj.scrollToTop){
				//Check that it's not below the viewport top already
				if(S.window.getBoundingClientRect().top<0) S.window.scrollIntoView();
			}
		}
	}else if(!content.querySelector('[data-file]')){
		S.currentFile=obj.file;
	}
	
	var newType=S.files[obj.file].medium;
	
	//Multimedia engine resets
	content.style.cssText=null;
	styles.innerHTML='';
	if(waitTimer.remaining>0){
		waitTimer.end();
	}
		
	S.charsHidden=0;
	
	//Remove the continue notice
	continueNotice.remove();
	
	//Get rid of local styles
	for(var key in S.objects){
		//Except for the window and content, of course!
		if(key==='window' || key==='content') continue;
		S.objects[key].removeAttribute('style');
		
		//Empty out textboxes
		if(S.objects[key].classList.contains('showpony-textbox')) S.objects[key].innerHTML='';
	};
	
	//Save buffer to check later
	objectBuffer={window:S.window,content:content};
	
	//If switching types, do some cleanup
	if(currentType!=newType){
		
		content.innerHTML='';
		S.objects={window:S.window,content:content};
		S.lines=[];
		
		//Use either infinite text or page turn, whichever is requested
		if(S.infiniteScroll || newType==='text'){
			content.appendChild(pageTurn);
		}else{
			//General setup
			content.appendChild(types[newType]);
		}
	}
	
	//How we get the file depends on whether or not it's private
	var src=(S.files[obj.file].name[0]=='x' ? ShowponyFolder+'/ajax.php?rel-path'+encodeURIComponent(ShowponyRunPage)+'&get=' : '')+S.files[obj.file].path;
	
	//Refresh the file, if requested we do so, by adding a query
	if(obj.refresh) src+=(S.files[obj.file].name[0]==='x' ? '&' : '?')+'refresh-'+Date.now();
	
	currentType=newType;
	
	//If it's the same file, check the type and see if special action needs to be taken!
	if(sameFile){
		//Special multimedia engine prep
		if(currentType==='multimedia'){
			runTo=Math.round(keyframes.length*(obj.time/S.files[obj.file].duration));
			if(runTo>=keyframes.length) runTo=keyframes[keyframes.length-1];
			else runTo=keyframes[runTo];
			
			runMM(0);
		}else{
			//Infinite scrolling
			if(S.infiniteScroll){//Scroll to the right spot
				var part=document.querySelector('[data-file="'+obj.file+'"]');
			
				pageTurn.scrollTop=part.offsetTop+part.offsetHeight*(obj.time/S.files[obj.file].duration);
			}else{ //Page turn
				if(currentType==='text')
				pageTurn.scrollTop=pageTurn.scrollHeight*(obj.time/S.files[obj.file].duration);
			}
			
			content.classList.remove('showpony-loading');
		}
	//If it's not the same file, load it!
	}else{
		if(S.files[obj.file].buffered===false) S.files[obj.file].buffered='buffering';
		
		//Display the medium based on the file extension
		//Multimedia Engine/Text/Copy
		if(currentType==='multimedia' || currentType==='text'){
			fetch(src,{credentials:'include'})
				.then(response=>{
					return response.text();
				})
				.then(text=>{
					if(currentType==='multimedia'){
						//Remove multiline comments
						text=text.replace(/\/\*.*?\*\//gs,'');
						
						//Get all non-blank lines
						S.lines=text.match(/.+(?=\S).+/g);
						
						console.log(S.lines);
						
						//Get all non-blank lines
						S.lines=text.match(/.+(?=\S).+/g);
						
						//Get keyframes from the text- beginning, end, (? ->)and waiting points
						keyframes=[0];
						
						for(let i=1;i<S.lines.length;i++){
							//If it's a user input spot, add the point immediately after the last keyframe- things let up to this, let it all happen
							if(S.lines[i]==='engine.wait'){
								keyframes.push(keyframes[keyframes.length-1]+1);
								continue;
							}
							
							//Regular text lines (not continuing) can be keyframes
							if(/^\t+(?!\t*\+)/i.test(S.lines[i])) keyframes.push(i);
						}
						
						runTo=Math.round(keyframes.length*(obj.time/S.files[obj.file].duration));
						if(runTo>=keyframes.length) runTo=keyframes[keyframes.length-1];
						else runTo=keyframes[runTo];
						
						console.log(keyframes);
						
						runMM(0);
					//Regular text
					}else{
						//Use either page infinite or page turn, whichever is requested
						if(S.infiniteScroll){
							
							//If file hasn't already been loaded, load it!
							let part=content.querySelector('[data-file="'+obj.file+'"]');
							
							//Safety check; if we're sticking, and trying to load a part that doesn't have a div, something's off and we need to get outta here!
							if(sticky!==false && !part) return;
							
							//If the part hasn't been created, it's not being automatically appended; so empty the div!
							if(!part){
								part=document.createElement('div');
								part.dataset.file=obj.file;
								pageTurn.innerHTML='';
								pageTurn.appendChild(part);
								
								S.currentFile=obj.file;
								
								//Stick to the set file and time
								sticky={file:S.currentFile,time:obj.time};
								console.log(sticky);
							}
							
							var currentPart=content.querySelector('[data-file="'+S.currentFile+'"]');
							var addScroll=pageTurn.scrollTop-currentPart.offsetTop;
							
							if(!part.innerHTML){
								//If adding a file in normally, just add it in
								part.innerHTML=text;
							
								pageTurn.scrollTop=currentPart.offsetTop+addScroll;
							}else{
								//Scroll to spot for file
								pageTurn.scrollTop=part.offsetTop+(obj.time/S.files[obj.file].duration)*part.offsetHeight;
							}
							
							if(sticky!==false){
								var stickyPart=content.querySelector('[data-file="'+sticky.file+'"]');
								
								pageTurn.scrollTop=stickyPart.offsetTop+(sticky.time/S.files[sticky.file].duration)*stickyPart.offsetHeight;
								
								pageTurn.dispatchEvent(new CustomEvent('scroll'));
							}
							
							content.classList.remove('showpony-loading');
							
						}else{ //Page turning
							//Put in the text
							pageTurn.innerHTML=text;
							
							//Scroll to spot
							pageTurn.scrollTop=pageTurn.scrollHeight*(obj.time/S.files[obj.file].duration);
							
							//Stop loading
							content.classList.remove('showpony-loading');
						}
					}
					
					if(S.files[obj.file].buffered!==true){
						S.files[obj.file].buffered=true;
						getTotalBuffered();
					}
				})
				.catch((error)=>{
					alert('329: '+error);
					console.log(error);
				})
			;
		//Image/Audio/Video
		}else{
			if(S.infiniteScroll){
				if(currentType==='image'){
					//If file hasn't already been loaded, load it!
					let part=content.querySelector('[data-file="'+obj.file+'"]');
					
					//Safety check; if we're sticking, and trying to load a part that doesn't have a div, something's off and we need to get outta here!
					if(sticky!==false && !part) return;
					
					//If the part hasn't been created, it's not being automatically appended; so empty the div!
					if(!part){
						part=document.createElement('div');
						part.dataset.file=obj.file;
						pageTurn.innerHTML='';
						pageTurn.appendChild(part);
						
						S.currentFile=obj.file;
						
						//Stick to the set file and time
						sticky={file:S.currentFile,time:obj.time};
						console.log(sticky);
					}
					
					var currentPart=content.querySelector('[data-file="'+S.currentFile+'"]');
					var addScroll=pageTurn.scrollTop-currentPart.offsetTop;
					
					if(!part.innerHTML){
						var img=document.createElement('img');
						img.src=src;
						part.appendChild(img);
						
						img.addEventListener('load',function(){
							content.classList.remove('showpony-loading');
							
							S.files[obj.file].buffered=true;
							getTotalBuffered();
							
							pageTurn.scrollTop=currentPart.offsetTop+addScroll;
							
							if(sticky!==false){
								var stickyPart=content.querySelector('[data-file="'+sticky.file+'"]');
								
								pageTurn.scrollTop=stickyPart.offsetTop+(sticky.time/S.files[sticky.file].duration)*stickyPart.offsetHeight;
								
								pageTurn.dispatchEvent(new CustomEvent('scroll'));
							}
						});
					}else{
						//Scroll to spot for file
						pageTurn.scrollTop=part.offsetTop+(obj.time/S.files[obj.file].duration)*part.offsetHeight;
						content.classList.remove('showpony-loading');
					}
					
				}
			}else{
				types[newType].src=src;
				if((currentType==='video' || currentType==='audio') && !S.window.classList.contains('showpony-paused')){
					types[newType].play();
				}
			}
		}
	}

	//Preload next files, if allowed and/or needed
	for(let i=obj.file+1;i<=obj.file+S.preloadNext;i++){
		if(i>=S.files.length) break;
		if(S.files[i].buffered!==false) continue;
		
		//How we get the file depends on whether or not it's private
		var src=(S.files[i].name[0]=='x' ? ShowponyFolder+'/ajax.php?rel-path'+encodeURIComponent(ShowponyRunPage)+'&get=' : '')+S.files[i].path;
		
		S.files[i].buffered='buffering';
		
		fetch(src).then(()=>{
			S.files[i].buffered=true;
			getTotalBuffered();
		});
	}
	
	////MAY NEED TO PUT THIS ALL IN A "THEN" AFTER A PROMISE SETUP FOR THE DIFFERENT MEDIA (so timing is perfect)
	goToTime=obj.time;
	types[newType].currentTime=obj.time; //Update the time
	timeUpdate();
}

var goToTime=0;

//Toggle the menu
S.menu=function(event,action){
	//We can cancel moving the bar outside of the overlay, but we can't do anything else.
	//Exit if we're not targeting the overlay.
	if(event && event.target!==overlay) return;
	
	//Allow playing and pausing, but return if either's already done
	if(
		action &&
		((S.window.classList.contains('showpony-paused') && action=='pause')
		||
		(!S.window.classList.contains('showpony-paused') && action=='play'))
	) return;
	
	else if(currentType!==null) //If we aren't moving the bar
	{
		//On toggling classes, returns 'true' if just added
		if(S.window.classList.toggle('showpony-paused')){
			//Pause media
			if(types[currentType].play) types[currentType].pause();
		}else{
			//Play media
			if(types[currentType].play) types[currentType].play();
		}
	}
	
	//Send an event when toggling the menu
	S.window.dispatchEvent(
		new CustomEvent('menu'
		,{detail:{
			open:(
				S.window.classList.contains('showpony-paused') ? true
				: false
			)
		}})
	);
};

//Handles starting, running, and ending scrubbing
function userScrub(event,start){
	//Mouse and touch work slightly differently		
	var touch=event.changedTouches ? true : false;
	var pos=touch ? event.changedTouches[0].clientX : event.clientX;
	
	if(start){
		if(scrubbing===false){
			if(touch) scrubbing=pos;
			else return;
		}
			
		//You have to swipe farther than you move the cursor to adjust the position
		if(scrubbing!==true){
			if(Math.abs(scrubbing-pos)>screen.width/(touch ? 20 : 100)){ 
				scrubbing=true;
				
				//On starting to scrub, we save a bookmark of where we were- kinda weird, but this allows us to return later.
				if(S.scrubLoad){
					//Add a new state on releasing
					updateInfo(true);
				}
			}
			else return;
		}
		
		//Don't want the users to accidentally swipe to another page!
		if(touch) event.preventDefault();
		
		scrub(
			(pos-S.window.getBoundingClientRect().left)
			/
			(S.window.getBoundingClientRect().width)
		);
	}else{
		//Drag on the menu to go to any part
		
		if(scrubbing===true){
			scrubbing=false;
		
			//If we don't preload while scrubbing, load the file now that we've stopped scrubbing
			if(S.scrubLoad===false){
				//Load the file our pointer's on
				scrub(
					(pos-S.window.getBoundingClientRect().left)
					/
					(S.window.getBoundingClientRect().width)
				);
				
			}
			
			return true; //Exit the function
		}
		
		//scrubbing needs to be set to false here too; either way it's false, but we need to allow the overlay to update above, so we set it to false earlier too.
		scrubbing=false;
	}
}

//Toggle fullscreen
S.fullscreen=function(type){
	//Get fullscreen type
	var browser=S.window.requestFullscreen ?
			{
				element:'fullscreenElement'
				,request:'requestFullscreen'
				,exit:'exitFullscreen'
			}
		: S.window.webkitRequestFullscreen ?
			{
				element:'webkitFullscreenElement'
				,request:'webkitRequestFullscreen'
				,exit:'webkitExitFullscreen'
			}
		: S.window.mozRequestFullScreen ?
			{
				element:'mozFullScreenElement'
				,request:'mozRequestFullScreen'
				,exit:'mozCancelFullScreen'
			}
		: false
	;
	
	//If a fullscreen-supporting browser wasn't found, use our rigged version
	if(!browser){
		if(!type){
			if(S.window.classList.contains('showpony-fullscreen-alt')) type='exit';
			else type='request';
		}
		
		if(type=='request'){
			S.window.classList.add('showpony-fullscreen-alt');
			document.getElementsByTagName('html')[0].classList.add('showpony-fullscreen-control');
			
			S.window.dataset.prevz=S.window.style.zIndex || 'initial';
			
			//From: https://stackoverflow.com/questions/1118198/how-can-you-figure-out-the-highest-z-index-in-your-document
			S.window.style.zIndex=Array.from(document.querySelectorAll('body *'))
			   .map(a => parseFloat(window.getComputedStyle(a).zIndex))
			   .filter(a => !isNaN(a))
			   .sort((a,b)=>a-b)
			   .pop()+1;
		}else{
			S.window.classList.remove('showpony-fullscreen-alt');
			document.getElementsByTagName('html')[0].classList.remove('showpony-fullscreen-control');
			
			//Get the original z-index value
			S.window.style.zIndex=S.window.dataset.prevz;
			S.window.removeAttribute('data-prevz');
		}
		
		return;
	}
	
	//If fullscreen and not requesting, exit
	if(document[browser.element]){
		if(type!=='request') document[browser.exit]();
	}
	//If not fullscreen and not exiting, request
	else if(type!=='exit') S.window[browser.request]();
}

//When the viewer inputs to Showpony (click, space, general action)
S.input=function(){
	if(S.window.classList.contains('showpony-paused')){
		S.menu(null,'play');
		return;
	}
	
	if(S.infiniteScroll){
		S.menu();
		return;
	}
	
	if(currentType==='image') S.to({file:'+1'});
	else if(currentType==='audio' || currentType==='video') S.menu();
	else if(currentType==='multimedia'){
		//If a wait timer was going, stop it.
		if(waitTimer.remaining>0){
			//Run all animations, end all transitions
			content.classList.add('showpony-loading');
			content.offsetHeight; //Trigger reflow to flush CSS changes
			content.classList.remove('showpony-loading');
			
			waitTimer.end();
		}
		
		//End object animations on going to the next frame
		for(var key in S.objects) S.objects[key].dispatchEvent(new Event('animationend'));
		
		//Remove the continue notice
		continueNotice.remove();
		
		var choices=false;
		
		//If the player is making choices right now
		if(S.objects[multimediaSettings.textbox] && S.objects[multimediaSettings.textbox].querySelector('input')) choices=true;
		
		//If all letters are displayed
		if(!S.objects[multimediaSettings.textbox] || S.objects[multimediaSettings.textbox].children.length===0 || S.objects[multimediaSettings.textbox].lastChild.firstChild.style.visibility=='visible'){
			multimediaSettings.input=false;
			if(!choices) runMM();
		}
		else //If some S.objects have yet to be displayed
		{
			//Run all animations, end all transitions
			content.classList.add('showpony-loading');
			content.offsetHeight; //Trigger reflow to flush CSS changes
			content.classList.remove('showpony-loading'); //Needs to happen before the latter; otherwise, it'll mess up stuff
			
			//Display all letters
			content.querySelectorAll('.showpony-char').forEach(function(key){
				//Skip creating animation, and display the letter
				key.style.animationDelay=null;
				var classes=key.className;
				key.className=classes;
				key.style.animation='initial';
				key.firstChild.dispatchEvent(new CustomEvent('animationstart'));
				key.style.visibility='visible';
			});
			
			if(choices) return;
			
			multimediaSettings.input=true;
			
			//Continue if not waiting
			if(!multimediaSettings.wait) runMM();
		}
	}
}

//Close ShowPony
S.close=function(){
	//Remove the window event listener
	window.removeEventListener('click',windowClick);
	
	//Reset the window to what it was before
	S.window.replaceWith(S.originalWindow);
}

///////////////////////////////////////
///////////PRIVATE VARIABLES///////////
///////////////////////////////////////

var multimediaSettings={
	textbox:'main'
	,text:null
	,go:false
	,input:false
};

//Waiting for user input
var waitForInput=false
	,scrubbing=false
	,waitTimer=new powerTimer(function(){},0)
	,currentType=null
	,loggedIn=false //Logged in as admin
	//Elements
	,overlayText=m('overlay-text','p')
	,overlayBuffer=m('overlay-buffer','canvas')
	,progress=m('progress')
	,content=m('content')
	,subtitles=m('subtitles','div')
	,styles=document.createElement('style')
	//Buttons
	,fullscreenButton=m('button showpony-fullscreen-button','button')
	,captionsButton=m('captions-button','select')
	,showponyLogo=m('logo','a')
	,credits=m('credits','small')
	,overlay=m('overlay','div')
	,cover=m('cover','div')
	,types={
		image:m('block','img')
		,audio:m('block','audio')
		,video:m('block','video')
		,multimedia:m('multimedia')
		,text:m('text')
	}
	//Page turning
	,pageTurn=m('page-turn')
	//Multimedia
	,continueNotice=m('continue')
;

fullscreenButton.alt='Fullscreen';
fullscreenButton.title='Fullscreen Toggle';
captionsButton.alt='Closed Captions/Subtitles';
captionsButton.title='Closed Captions/Subtitles';

styles.type='text/css';

showponyLogo.href='https://showpony.heybard.com/';
showponyLogo.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g stroke-linecap="round" stroke-linejoin="round" transform="translate(0 -197)"><path fill="none" stroke-width="9.5" d="M32.5 245.5v-40.1s-21.9-2.2-21.9 40m56.9.1v-40.1s21.9-2.2 21.9 40"/><circle cx="77.4" cy="275.5" r="9.4" fill="none" stroke-width="7.7"/><circle cx="22.6" cy="275.5" r="9.4" fill="none" stroke-width="7.7"/><path stroke-width=".3" d="M50.1 266.7c-2.4 3-19.1 0-11 8 6.1 5.8 29 2.5 15.2-17-16.4.6-44.4-12.6-15.3-25.7 39.2-17.7 42.5 44.5 23.6 55.6-44.7 26.3-53.5-49-12.5-20.9z"/></g></svg>';
showponyLogo.target='_blank';

S.window.addEventListener('animationend',function(){
	var updateStyle=new RegExp('@keyframes window{100%{[^}]*}}','i').exec(styles.innerHTML);
	
	var styleAdd=/[^{]+;/.exec(updateStyle);
	
	if(styleAdd) this.style.cssText+=styleAdd[0];
	this.style.animation=null;
})

content.addEventListener('animationend',function(){
	var updateStyle=new RegExp('@keyframes content{100%{[^}]*}}','i').exec(styles.innerHTML);
	
	var styleAdd=/[^{]+;/.exec(updateStyle);
	
	if(styleAdd) this.style.cssText+=styleAdd[0];
	this.style.animation=null;
})

if(S.credits) useIcons(S.credits);

frag([overlayBuffer,progress,overlayText,fullscreenButton,captionsButton,showponyLogo,credits],overlay);

///////////////////////////////////////
///////////PRIVATE FUNCTIONS///////////
///////////////////////////////////////

function timeUpdate(time){
	if(!isNaN(time)){
		//Don't exceed the file's duration
		var duration=S.files[S.currentFile].duration;
		if(time>duration) time=duration;
		types[currentType].currentTime=time;
	}
	
	updateInfo();
	displaySubtitles();
	
	//Run custom event for checking time
	S.window.dispatchEvent(
		new CustomEvent(
			'timeupdate'
			,{
				detail:{
					file:(S.currentFile+1)
					,time:getCurrentTime()
				}
			}
		)
	);
}

function displaySubtitles(){
	if(S.currentSubtitles===null){
		subtitles.innerHTML='';
		return;
	}
	
	if(S.files[S.currentFile].subtitles){
		if(currentType==='text'){
			return;
		}
		else if(currentType==='image'){
			subtitles.innerHTML='';
			
			subtitles.width=types.image.naturalWidth;
			subtitles.height=types.image.naturalHeight;
			
			var height=content.getBoundingClientRect().height;
			var width=content.getBoundingClientRect().width;
			var shrinkPercent=height/types.image.naturalHeight;
			
			var newHeight=types.image.naturalHeight*shrinkPercent;
			var newWidth=types.image.naturalHeight*shrinkPercent;

			subtitles.style.height=newHeight+'px';
			subtitles.style.width=newWidth+'px';
			
			subtitles.style.left=(width-newWidth)/2+'px';
			
			var lines=S.files[S.currentFile].subtitles.split(/\s{3,}/g);
			for(let i=0;i<lines.length;i++){
				var block=m('sub','p');
				
				var input=lines[i].split(/\n/);
				block.innerHTML=input[1];
				
				input=input[0].match(/(\d|\.)+/g);
				
				block.style.left=input[0]+'%';
				block.style.width=input[2]-input[0]+'%';
				block.style.top=input[1]+'%';
				block.style.height=input[3]-input[1]+'%';
				
				subtitles.appendChild(block);
			}
		}else if(currentType==='video' || currentType==='audio'){
			subtitles.style.cssText=null;
			var currentTime=types[currentType].currentTime;
			
			var lines=S.files[S.currentFile].subtitles.match(/\b.+/ig);
			
			for(let i=0;i<lines.length;i++){
				if(/\d{2}:\d{2}\.\d{3}.+\d{2}:\d{2}\.\d{3}/.test(lines[i])){
					var times=lines[i].split(/\s*-->\s*/);
					//If between both times
					if(
						currentTime>=times[0].split(/:/)[1]
						&& currentTime<=times[1].split(/:/)[1]
					){
						var newSubtitle='';
						
						var ii=i+1;
						while(!(/\d{2}:\d{2}\.\d{3}.+\d{2}:\d{2}\.\d{3}/.test(lines[ii])) && ii<lines.length){
							if(newSubtitle.length) newSubtitle+='<br>';
							newSubtitle+=lines[ii];
							
							ii++;
						}
						
						if(subtitles.children.length===0 || subtitles.children[0].innerHTML!==newSubtitle){
							subtitles.innerHTML='';
						
							var block=m('sub','p');
							block.innerHTML=newSubtitle;
							
							subtitles.appendChild(block);
						}
						
						break;
					}
					
					if(currentTime<times[0].split(/:/)[0] || i==lines.length-1){
						subtitles.innerHTML='';
						break;
					}
				}
				
				if(i==lines.length-1) subtitles.innerHTML='';
			}
		}else if(currentType==='multimedia'){
			//We only add subtitles for unexplained audio
			//Add support later
			return;
		}
	}else{
		//If don't have the file
		fetch(S.subtitles[S.currentSubtitles]+S.files[S.currentFile].title+'.vtt')
		.then(response=>{return response.text();})
		.then(text=>{
			S.files[S.currentFile].subtitles=text;
			displaySubtitles();
		});
	}
}

function getTotalBuffered(){
	var time=0;
	var buffered=[];
	
	//Update amount buffered total
	for(let i=0;i<S.files.length;i++){
		var buffer=false;
		
		if(S.files[i].buffered===true){
			buffer=[time,time+S.files[i].duration];
			
			if(buffer){
				//Combine buffered arrays, if we're moving forward
				if(buffered.length>0 && buffer[0]<=buffered[buffered.length-1][1]) buffered[buffered.length-1][1]=buffer[1];
				else buffered.push(buffer);
			}
		}
		else if(Array.isArray(S.files[i].buffered)){
			//Get working for multiple contained buffers
			for(let ii=0;ii<S.files[i].buffered.length;ii++){
				buffer=[
					time+S.files[i].buffered[ii][0]
					,time+S.files[i].buffered[ii][1]
				];
				
				//Combine buffered arrays, if we're moving forward
				if(buffered.length>0 && buffer[0]<=buffered[buffered.length-1][1]) buffered[buffered.length-1][1]=buffer[1];
				else buffered.push(buffer);
			}
		}
		
		time+=S.files[i].duration;
	}
	
	if(buffered.length===1 && buffered[0][0]===0 && buffered[0][1]>=S.duration) buffered=true;
	if(buffered.length===0) buffered=false;
	
	S.buffered=buffered;
	
	if(S.showBuffer===false) return;
	
	var rectRes=1000;
	overlayBuffer.width=rectRes;
	overlayBuffer.height=1;
	var ctx=overlayBuffer.getContext('2d');
	ctx.clearRect(0,0,rectRes,1);
	ctx.fillStyle='#95f442';
	
	//Update info on dropdown
	if(S.buffered===true){
		ctx.fillRect(0,0,rectRes,1);
	}else if(Array.isArray(S.buffered)){
		for(let i=0;i<S.buffered.length;i++){
			ctx.fillRect(
				Math.floor(S.buffered[i][0]/S.duration*rectRes)
				,0
				,Math.floor((S.buffered[i][1]-S.buffered[i][0])/S.duration*rectRes)
				,1
			);
		}
	}
}

//Play and pause multimedia
types.multimedia.play=function(){
	
	//Go through objects that were playing- unpause them
	for(var key in S.objects){
		if(S.objects[key].wasPlaying){
			S.objects[key].play();
		}
	}
	
	//Resume waitTimer
	waitTimer.resume();
}

types.multimedia.pause=function(){
	
	//Go through objects that can be played- pause them, and track that
	for(var key in S.objects){
		//If it can play, and it is playing
		if(S.objects[key].play && S.objects[key].paused===false){
			S.objects[key].wasPlaying=true;
			S.objects[key].pause();
		}else{
			S.objects[key].wasPlaying=false;
		}
	}
	
	//Pause waitTimer
	waitTimer.pause();
}

function getCurrentTime(){
	//Use the currentTime of the object, if it has one
	var newTime=types[currentType] && types[currentType].currentTime || 0;
	
	//Add the times of previous videos to get the actual time in the piece
	for(let i=0;i<S.currentFile;i++) newTime+=S.files[i].duration;
	
	return newTime;
}

//Update the scrubber's position
function scrub(inputPercent){
	//if(sticky!==false) return;
	
	//If no inputPercent was passed, estimate it
	if(typeof(inputPercent)==='undefined'){
		var timeInTotal=getCurrentTime();
		
		var inputPercent=timeInTotal / S.duration
			,newPart=S.currentFile;
	}else{ //if inputPercent WAS passed
	
		//Clamp inputPercent between 0 and 1
		inputPercent= inputPercent <= 0 ? 0 : inputPercent >= 1 ? 1 : inputPercent;
		
		//Go to the time
		var timeInTotal=S.duration*inputPercent
			,newTime=S.duration*inputPercent
			,newPart=0
		;
		
		//Look through the media for the right one
		var l=S.files.length;
		for(let i=0;i<l;i++){
			//If the duration's within this one, stop at this one
			if(i==l-1 || newTime<S.files[i].duration){
			//If this is the media!
				//If we allow scrubbing or we're not moving the bar, we can load the file
				if(S.scrubLoad || scrubbing===false) S.to({file:i,time:newTime,scrollToTop:false});
				
				newPart=i;
				
				break;
			//Otherwise, go to the next one (and subtract the duration from the total duration)
			}else newTime-=S.files[i].duration;
		}
	}
	
	//Move the progress bar
	progress.style.left=(inputPercent*100)+'%';
	
	//Set the overlay text
	var newHTML=replaceInfoText(
		S.info
		,newPart
		,Math.floor(timeInTotal)
	);
	if(newHTML!==overlayText.innerHTML) overlayText.innerHTML=newHTML;
	
	//Update the title, if set up for it
	if(S.title){
		var newTitle=replaceInfoText(S.title,S.currentFile);
		if(newTitle!==document.title) document.title=newTitle;
	}
}

function replaceInfoText(value,fileNum,current){
	if(current===undefined){
		//var currentType=S.files[S.currentFile].medium;
		
		//Use the currentTime of the object, if it has one
		var currentTime=types[currentType] && types[currentType].currentTime || 0;
		
		//Add the times of previous videos to get the actual time in the piece
		for(let i=0;i<S.currentFile;i++) currentTime+=S.files[i].duration;
		
		var inputPercent=currentTime / S.duration;
			
		var current=Math.floor(inputPercent*S.duration)
			,left=S.duration-Math.floor(inputPercent*S.duration)
		;
		
		fileNum=S.currentFile;
	}else{
		var left=S.duration-current;
		var inputPercent=current/S.duration;
	}
	
	var fileMedium=S.files[fileNum].medium;
	
	var time=0;
	for(var i=0;i<S.files.length;i++){
		if(current<time+S.files[i].duration){
			
			var currentThis=current-time;
			var leftThis=S.files[i].duration-currentThis;
			var inputPercentThis=currentThis/S.files[i].duration;
			break;
		}
		
		time+=S.files[i].duration;
	}
	
	//Save all the values to instantly pass them through
	var values={
		title:{
			currentAll:		S.files[fileNum].title
		}
		,date:{
			currentAll:		'Undated'
		}
		,medium:{
			currentAll:		'<span class="showpony-info-media showpony-info-'+fileMedium+'"></span>'
		}
		,file:{
			currentAll:		fileNum+1
			,leftAll:		S.files.length-(fileNum+1)
			,totalAll:		S.files.length
		}
		,percent:{
			currentAll:		(inputPercent*100)|0
			,leftAll:		((1-inputPercent)*100)|0
			,totalAll:		100
			,currentThis:	(inputPercentThis*100)|0
			,leftThis:		((1-inputPercentThis)*100)|0
			,totalThis:		100
		}
		,hours:{
			currentAll:		(current / 3600)|0
			,leftAll:		(left / 3600)|0
			,totalAll:		(S.duration / 3600)|0
			,currentThis:	(currentThis / 3600)|0
			,leftThis:		(leftThis / 3600)|0
			,totalThis:		(S.files[fileNum].duration / 3600)|0
		}
		,minutes:{
			currentAll:		((current % 3600) / 60)|0
			,leftAll:		((left % 3600) / 60)|0
			,totalAll:		((S.duration % 3600) / 60)|0
			,currentThis:	((currentThis % 3600) / 60)|0
			,leftThis:		((leftThis % 3600) / 60)|0
			,totalThis:		((S.files[fileNum].duration % 3600) / 60)|0
		}
		,seconds:{
			currentAll:		(current % 60)|0
			,leftAll:		(left % 60)|0
			,totalAll:		(S.duration % 60)|0
			,currentThis:	(currentThis % 60)|0
			,leftThis:		(leftThis % 60)|0
			,totalThis:		(S.files[fileNum].duration % 60)|0
		}
	}
	
	//Get the name, remove the parentheses (skip over 'x')
	var date=S.files[fileNum].date; // /^\d{4}-\d\d-\d\d(\s\d\d:\d\d:\d\d)?$/.exec(files[i])

	//If there's a date, return it; otherwise, return blank space
	if(date){
		date=date[0].split(/[\s-:;]+/);
		
		date=new Date(Date.UTC(
			date[0]			//Year
			,date[1]-1 || 0	//Month
			,date[2] || 0	//Date
			,date[3] || 0	//Hours
			,date[4] || 0	//Minutes
			,date[5] || 0	//Seconds
			,date[6] || 0	//Milliseconds
		));
		
		values.date.current=new Intl.DateTimeFormat(
			undefined //Uses the default locale
			,S.dateFormat
		).format(date);
	}
	
	//Use special naming convention to replace values correctly
	function infoNaming(input){
		//Choose the right type
		
		//Defaults (we don't bother searching for these)
		var type='file', value='current';
		
		//Get the type
		if(/title/i.test(input)) type='title';
		else if(/date|release/i.test(input)) type='date';
		else if(/%|percent/i.test(input)) type='percent';
		else if(/hour/i.test(input)) type='hours';
		else if(/min/i.test(input)) type='minutes';
		else if(/sec/i.test(input)) type='seconds';
		else if(/medi/i.test(input)) type='medium';
		
		//Get the value type
		if(/left|remain/i.test(input)) value='left';
		else if(/total/i.test(input)) value='total';
		
		//Get the modifier
		if(/this/i.test(input)) value+='This';
		else value+='All';
		
		//Return the value
		return String(values[type][value]).padStart(
			/\d+/.exec(input) || 0
			,'0'
		);
	}
	
	return value.replace(/\[[^\]]+\]/g,infoNaming);
}

//Use icons (social media, etc)
function useIcons(input){
	
	var images=input.match(/[^><\s]+(\.logo)/ig);
	
	//If no images, return
	if(!images){
		credits.innerHTML=input;
		return;
	}
	
	credits.classList.add('showpony-loading');
	
	//Create promises for fetching the images
	var promises=[];
	
	for(let i=0;i<images.length;i++){
		var url='https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/'+images[i].toLowerCase().replace('.logo','.svg');
		
		promises[i]=fetch(url)
			.then(response=>{
				//On success
				if(response.status>=200 && response.status<300) return response.text();
				//On failure (404)
				else throw Error('Couldn\'t retrieve file! '+response.status);
			})
			.then(svg=>{
				input=input.replace(images[i],svg);
			})
			.catch(response=>{
				input=input.replace(images[i],images[i].replace('.logo',''));
			})
		;
	}
	
	//Once all SVGs are retrieved, continue
	Promise.all(promises).then(response=>{
		credits.innerHTML=input;
		credits.classList.remove('showpony-loading');
	});
}

//Get a file's date
function getDate(input){
	return input.replace(/x|\s?(\(|\.).+/g,'').replace(/;/g,':');
}

//Make a POST call
function POST(obj){
	//Prepare the form data
	var formData=new FormData();
	formData.append('call',obj.call);
	formData.append('path',S.get.replace(/\[lang[^\]]*\]/gi,S.language));
	formData.append('rel-path',ShowponyRunPage);
	
	//Special values, if passed
	obj.password && formData.append('password',obj.password);
	obj.name && formData.append('name',obj.name);
	obj.newName && formData.append('newName',obj.newName);
	obj.files && formData.append('files',obj.files);
	
	return new Promise(function(resolve,reject){
		
		//Make the call
		fetch(ShowponyFolder+'/ajax.php',{method:'post',body:formData,credentials:'include'})
		.then(response=>{
			return response.json();
		})
		//Work with the json
		.then(json=>{
			if(json.success){
				loggedIn=json.admin;
				if(json.files){
					saveAllFileInfo(json.files);
				}
				
				resolve(json);
			}else reject(json.message);
		})
		.catch(response=>{
			alert('913: '+response);
		});
	});
}

function saveFileInfo(path){
	//Replace language tags for use
	path=path.replace(/\[lang[^\]]*\]/gi,S.language);
	
	var file={
		path:path
		,name:/[^\/]+$/.exec(path)[0]
		,date:null
		,buffered:false
		,subtitles:false
	};
	
	var title=/([^()])+(?=\))/.exec(file.name);
	file.title=safeFilename(title ? title[0] : /.+(?=\.[^.]+$)/.exec(file.name)[0],'from');
	
	var date=/\d{4}-\d\d-\d\d(\s\d\d:\d\d:\d\d)?/.exec(file.name);
	if(date) file.date=date[0];
	
	var medium='text';
	
	//Get the extension- fast!
	switch(path.slice((path.lastIndexOf('.') - 1 >>> 0) + 2)){
		case 'jpg':
		case 'jpeg':
		case 'png':
		case 'gif':
		case 'svg':
			medium='image';
			break;
		case 'mp4':
		case 'webm':
			medium='video';
			break;
		case 'mp3':
		case 'wav':
			medium='audio';
			break;
		case 'mm':
			medium='multimedia';
			break;
		//All else defaults to text
		default:
			break;
	}
	file.medium=medium;
	
	//Return the value in the file or the default duration
	var duration=/[^\s)]+(?=\.[^.]+$)/.exec(file.name);
	
	//If the whole filename is a number (matches the title), it's likely not length, just an identifier. Ignore in that case.
	if(duration==file.title || /(:-)/i.test(duration)){
		duration=S.defaultDuration;
	}else{
		if(duration) duration=parseFloat(duration[0]);
		if(!duration) duration=S.defaultDuration;
	}
	
	file.duration=duration;
	
	return file;
}

//Get all the file info from an array of files
function saveAllFileInfo(files){
	S.files=[];
	
	//Get all the files' info and put it in
	for(let i=0;i<files.length;i++){
		S.files[i]=saveFileInfo(files[i]);
	}
	
	//Combine total length of all parts
	S.duration=S.files.map(function(e){return e.duration;}).reduce((a,b) => a+b,0);
}

//Use documentFragment to append elements faster
function frag(inputArray,inputParent){
	var fragment=document.createDocumentFragment();
	
	for(let i=0, len=inputArray.length;i<len;i++) fragment.appendChild(inputArray[i]);
	
	inputParent.appendChild(fragment);
}

//Create an element with a class
function m(c,el){
	var a=document.createElement(el || 'div');
	a.className='showpony-'+c;
	
	return a;
}

//When video or audio ends
function mediaEnd(){
	//Only do this if the menu isn't showing (otherwise, while we're scrubbing this can trigger)
	if(!S.window.classList.contains('showpony-paused')) S.to({file:'+1'});
}

var runTo=false;

//Run multimedia (interactive fiction, visual novels, etc)
function runMM(inputNum){
	
	//Go to either the specified line or the next one
	S.currentLine=(inputNum!==undefined ? inputNum : S.currentLine+1);
	
	//Run through if we're running to a point; if we're there or beyond though, stop running through
	if(runTo!==false && S.currentLine>=runTo){
		runTo=false;
		multimediaSettings.input=false;
	}
	
	//We've run through!
	if(runTo===false && content.classList.contains('showpony-loading')){
		if(waitTimer.remaining>0){
			waitTimer.end();
		}
		
		//Get rid of unused, uncreated objects
		for(var key in S.objects){
			//Get rid of the object if it doesn't exist
			if(!objectBuffer[key]){
				S.objects[key].remove();
				delete S.objects[key];
			}
		};
		
		content.offsetHeight; //Trigger reflow to flush CSS changes
		content.classList.remove('showpony-loading');
	}
	
	//Update the scrubbar if the frame we're on is a keyframe
	if(runTo===false && keyframes.includes(S.currentLine)){
		//Set the time of the element
		timeUpdate((keyframes.indexOf(S.currentLine)/keyframes.length)*S.files[S.currentFile].duration);
	}
	
	//If we've ended manually or reached the end, stop running immediately and end it all
	if(S.currentLine>=S.lines.length){
		S.to({file:'+1'});
		return;
	}
	
	var text=S.lines[S.currentLine];
	
	//Replace all variables (including variables inside variables) with the right name
	var match;
	while(match=/[^\[]+(?=\])/g.exec(text)) text=text.replace('['+match[0]+']',S.data[match[0]]);
	
	//Skip comments
	if(/^\/\//.test(text)){
		runMM();
		return;
	}
	
	var vals=text.split(/(?:\s{3,}|\t+)/);
	
	var type;
	
	//Data
	if(type=/[+=\-<>!]+$/.exec(vals[0])){
		type=type[0];
		//Remove type from variable name
		vals[0]=vals[0].replace(type,'');
		
		//If a value's a number, return it as one
		function ifParse(input){
			return isNaN(input) ? input : parseFloat(input);
		}
		
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
		
		console.log(type,vals);
		
		switch(type){
			//Operations
			case '=':
			case '+=':
			case '-=':
				S.data[vals[0]]=operators[type](
					ifParse(S.data[vals[0]])
					,ifParse(vals[1])
				);
				
				/*
				//Run an event that the user can track for updated user info
				S.window.dispatchEvent(
					new CustomEvent(
						'data'
						,{
							detail:{
								name:vals[1]
								,value:S.data[vals[1]]
							}
						}
					)
				);*/
				
				runMM();
				break;
			//Comparisons
			default:
				if(operators[type](
					ifParse(S.data[vals[0]])
					,ifParse(vals[1])
				)) runMM(S.lines.indexOf(vals[2]));
				else runMM();
				break;
		}
		return;
	}
	
	type='character';
	if(vals.length===1){
		type='background';
	}
	
	var object=/^[^\.\t]+/.exec(vals[0]);
	if(!object){
		object='main';
		type='textbox';
	}
	else object=object[0];
	
	var command=/\..+/.exec(vals[0]);
	if(!command) command='content';
	else command=command[0].replace('.','');
	
	//Check if audio
	if(/play|pause|stop|loop/.test(command)){
		type='audio';
	}
	
	//Check for images for this character; go through future lines
	if(type==='character') var lines=[vals[1]];		
	
	//If an object with the name doesn't exist, make it!
	if(object!=='engine' && !S.objects[object]){
		//Audio has special requirements
		if(type==='audio'){
			S.objects[object]=document.createElement('audio');
			
			S.objects[object].src='resources/audio/'+object;
			
			//If an extension isn't specified, assume mp3
			if(!/\./.test(object)) S.objects[object].src+='.mp3';
			S.objects[object].preload=true;
			
			content.appendChild(S.objects[object]);
		}else{
			if(type==='textbox'){
				content.appendChild(S.objects[object]=m(type,'form'));
				S.objects[object].addEventListener('submit',function(event){event.preventDefault();});
			}
			else content.appendChild(S.objects[object]=m(type));

			S.objects[object].addEventListener('animationend',function(){
				var objectName=object.replace(/#/g,'id');
				
				var updateStyle=new RegExp('@keyframes '+objectName+'{100%{[^}]*}}','i').exec(styles.innerHTML);
				
				var styleAdd=/[^{]+;/.exec(updateStyle);
				
				if(styleAdd) this.style.cssText+=styleAdd[0];
				this.style.animation=null;
			})
			
			if(type==='character'){
				//Go through the rest of the lines, looking for images to preload
				for(let i=S.currentLine;i<S.lines.length;i++){
					
					//If this character is listed on this line
					if(S.lines[i].indexOf(object+'\t')===0){
						//Add the image names to the images to load
						lines.push(S.lines[i].split(/\s{3,}|\t+/)[1]);
					}
				}
			}
		}
	}
	
	//If we're buffering, add it to the buffer so it's not deleted later
	if(runTo) objectBuffer[object]=S.objects[object];

	//Get the name, which is the file's name (or for characters, the character's name). Anything after a hash is an id; it's not a part of the name.
	var name=/^[^#]+/.exec(object)[0];
	
	switch(command){
		case 'go':
			runMM(S.lines.indexOf(vals[1]));
			//Don't automatically go to the next line, we're going correctly above
			break;
		case 'wait':
			//If there's a waitTimer, clear it out
			if(waitTimer.remaining>0){
				waitTimer.end();
			}
			
			//Skip waiting if we're running through
			if(runTo){
				runMM();
				return;
			}
			
			//If a value was included, wait for the set time
			if(vals[1]) waitTimer=new powerTimer(runMM,parseFloat(vals[1])*1000);
			//Otherwise, let the user know to continue it
			else content.appendChild(continueNotice);
			
			//If we're paused, pause the timer
			if(S.window.classList.contains('showpony-paused')) waitTimer.pause();
			
			//Don't automatically go to the next line
			break;
		case 'style':
			var animationSpeed=/time:[^s]+s/i.exec(vals[1]);
		
			//If running to or not requesting animation, add styles without implementing animation
			if(animationSpeed===null || S.currentLine<runTo){
				S.objects[object].style.cssText+=vals[1];
			}else{
				var objectName=object.replace(/#/g,'id');
				
				animationSpeed=animationSpeed[0].split(':')[1];
				
				var animation='@keyframes '+objectName+'{100%{'+vals[1]+'}}';
			
				//Either replace existing keyframes or append to the end
				styles.innerHTML=styles.innerHTML.replace(new RegExp('(@keyframes '+objectName+'{100%{[^}]*}})|$'),animation);
				S.objects[object].style.animation=objectName+' '+animationSpeed+' forwards';
			}
			
			runMM();
			break;
		case 'content':
			switch(type){
				case 'character':
					var cha=S.objects[vals[0]];
					
					//Character level
					for(let i=0,len=lines.length;i<len;i++){
						
						//Get the image names passed (commas separate layers)
						var imageNames=lines[i].split(',');
					
						//Layer level
						//Go through each passed image and see if it exists
						for(let ii=0,len=imageNames.length;ii<len;ii++){
							//If there's no period, add '.png' to the end- assume the extension
							if(!/\./.test(imageNames[ii])) imageNames[ii]+='.png';
							
							var image='url("resources/characters/'+name+'/'+imageNames[ii]+'")';
							
							//If the image already exists
							var found=false;
							
							//If the layer exists, search it
							if(cha.children[ii]){
								//Search the layer!
								var search=cha.children[ii].children;
								
								//Set the opacity right, and if it's 1, we found the image!
								for(let iii=0,len=search.length;iii<len;iii++){
									var match=search[iii].style.backgroundImage.replace(/'/g,'"')==image.replace(/'/g,'"');
									
									//If this is the first image, it's the one we asked for; we don't want to make preloads visible, after all!
									if(i===0) search[iii].style.opacity=match ? 1 : 0;
									
									if(match==true) found=true;
								}
							//If the layer doesn't exist, make it!
							}else cha.appendChild(document.createElement('div'));
							
							//Image level
							//If the image doesn't exist in the layer, we add it!
							if(!found){
								//Add a backgroundImage
								var thisImg=m('character-image');
								thisImg.style.backgroundImage=image;
								
								//If this isn't the first image, hide it immediately (it's being preloaded, we don't want to see it yet!)
								if(i!==0) thisImg.style.opacity=0;
								
								cha.children[ii].appendChild(thisImg);
							}
						}
					}
					runMM();
					break;
				case 'background':
					S.objects[object].style.backgroundImage='url("resources/backgrounds/'+name+'.jpg")';
					runMM();
					break;
				case 'audio':
					S.objects[object].src=vals[0];
					/*
					//Go through the passed parameters and apply them
					let l=vals.length;
					for(let i=2;i<l;i++){
						switch(vals[i]){
							case 'unloop':
								S.objects[object].loop=false;
								break;
							case 'stop':
								S.objects[object].currentTime=0;
								S.objects[object].wasPlaying=false;
								S.objects[object].pause();
								break;
							default: //Other features
								var value=parseFloat(vals[i].substr(1));
								//Current volume
								if(vals[i][0]==='v') S.objects[object].volume=value;
								//Current time
								else if(vals[i][0]==='t') S.objects[object].currentTime=value;
								//Speed
								else if(vals[i][0]==='s') S.objects[object].playbackRate=value;
								break;
						}
					}*/
					runMM();
					break;
				case 'textbox':
					//var keepGoing=multimediaFunction[vals[0].toLowerCase().substr(0,2)](vals);
	
					//var keepGoing=false;
					//if(!keepGoing) runMM();
					
					//If we're running through, skip displaying text until we get to the right point
					if(runTo){
						objectBuffer[multimediaSettings.textbox]=S.objects[multimediaSettings.textbox];
						runMM(undefined);
						return;
					}
					
					multimediaSettings.wait=true; //Assume we're waiting at the end time
					
					text=text.replace(/^\t+/,'');
					
					//If the line doesn't start with +, replace the text
					if(text[0]!=='+'){
						S.objects[multimediaSettings.textbox].innerHTML='';
						
						if(!S.objects.name) content.appendChild(S.objects.name=m('name'));
						
						//Split up the text so we can have names automatically written
						var nameText=text.split('::');
						if(nameText.length>1){
							text=nameText[1];
							S.objects.name.innerHTML=nameText[0];
							S.objects.name.style.visibility='visible';
						}else{
							S.objects.name.style.visibility='hidden';
						}
						
						multimediaSettings.input=false;
					}
					else text=text.substr(1);
					
					//STEP 2: Design the text//
					
					//Design defaults
					var charElementDefault=m('char-container','span')
						,charElement
						,baseWaitTime
						,constant
					;
					
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
					
					var l=text.length;
					//We check beyond the length of the text because that lets us place characters that allow text wrapping in Firefox
					for(let i=0;i<=l;i++){
						var waitTime=baseWaitTime;
						
						//If a > is at the end of a text line, continue automatically.
						//Won't interfere with tags, no worries!
						if(i==l-1 && text[i]==='>'){
							multimediaSettings.wait=false;
							continue;
						}
						
						//Check the current character//
						switch(text[i]){
							//HTML
							case '<':
								//Skip over the opening bracket
								i++;
							
								var values='';
								
								//Wait until a closing bracket (or the end of the text)
								while(text[i]!='>' && i<text.length){
									values+=text[i];
									i++;
								}
								
								//We're closing the element
								if(values[0]=='/'){
									switch(values){
										case '/shout':
											charElement.classList.remove('showpony-char-shout');
											break;
										case '/sing':
											charElement.classList.remove('showpony-char-sing');
											break;
										case '/shake':
											charElement.classList.remove('showpony-char-shake');
											break;
										case '/fade':
											charElement.classList.remove('showpony-char-fade');
											break;
										case '/speed':
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
											charElement.classList.add('showpony-char-shout');
											break;
										case 'sing':
											charElement.classList.add('showpony-char-sing');
											break;
										case 'shake':
											charElement.classList.add('showpony-char-shake');
											break;
										case 'fade':
											charElement.classList.add('showpony-char-fade');
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
														
														if(this.dataset.go) runMM(S.lines.indexOf(this.dataset.go));
														else runMM();
														
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
							default:
								//Handle punctuation
								if(i!=text.length && (text[i]==' ')){
									/*Pause at:
										. ! ? : ; -
										but if there's a " or ' after it, wait until that's set.
									*/
									
									var start=letters.length-3;
									if(start<0) start=0;
									
									if(!constant){
										//Long pause
										if(/[.!?:;-]["']*$/.test(letters.substr(start,3))) waitTime*=20;
										
										//Short pause
										if(/[,]["']*$/.test(letters.substr(start,3))) waitTime*=10;
									}
								}
								
								letters+=text[i];

								//Make the char based on charElement
								var thisChar=charElement.cloneNode(false);
								
								let showChar=m('char','span');				//Display char (appear, shout, etc), parent to animChar
								let animChar=m('char-anim','span');			//Constant animation character (singing, shaking...)
								let hideChar=m('char-placeholder','span');	//Hidden char for positioning
								
								//Spaces
								//and Ending! (needs this to wrap lines correctly on Firefox)
								if(text[i]==' ' || i==l){
									thisChar.style.whiteSpace='pre-line';
									hideChar.innerHTML=animChar.innerHTML=' <wbr>';
									
									showChar.addEventListener('animationstart',function(event){
										//If the animation ended on a child, don't continue! (animations are applied to children for text effects)
										if(this!=event.target) return;
										
										//If the element's currently hidden (the animation that ended is for unhiding)
										if(this.style.visibility!=='visible'){
											this.style.visibility='visible';
											
											var textbox=this.closest('.showpony-textbox');
											
											//If the letter's below the textbox
											if(this.parentNode.getBoundingClientRect().bottom>textbox.getBoundingClientRect().bottom){
												textbox.scrollTop=this.parentNode.offsetTop+this.parentNode.offsetHeight-textbox.offsetHeight;
											}
											
											//If the letter's above the textbox
											if(this.parentNode.getBoundingClientRect().top<textbox.getBoundingClientRect().top){
												textbox.scrollTop=this.parentNode.offsetTop;
											}
											
										}
									});
								}
								else{
									hideChar.innerHTML=animChar.innerHTML=text[i];
								}
								
								frag([animChar],showChar);
								frag([showChar,hideChar],thisChar);
								
								//Set the display time here- but if we're paused, no delay!
								if(!S.window.classList.contains('showpony-paused') && !multimediaSettings.input) showChar.style.animationDelay=totalWait+'s';
								
								//Set animation timing for animChar, based on the type of animation
								if(thisChar.classList.contains('showpony-char-sing')){
									animChar.style.animationDelay=-(letters.length*.1)+'s';
								}
								
								if(thisChar.classList.contains('showpony-char-shake')){
									animChar.style.animationDelay=-(Math.random()*3)+'s';
								}
								
								//Add the char to the document fragment
								currentParent.appendChild(thisChar);
								totalWait+=waitTime;
								
								lastLetter=showChar;
								
								break;
						}
					}
					
					//If the user's trying to skip text, let them
					if(multimediaSettings.input && text[text.length-1]=='>'){
						console.log('Hey! skip this!');
					}else{
						multimediaSettings.input=false;
					}
					
					lastLetter.addEventListener('animationstart',function(event){
						if(this!==event.target) return;
						
						//If we aren't waiting to continue, continue
						if(!multimediaSettings.wait){
							runMM();
						}else{
							//If we need player's to click to continue (and they have no inputs to fill out or anything), notify them:
							if(!S.objects[multimediaSettings.textbox].querySelector('input')){
								content.appendChild(continueNotice);
							}
						}
					});
					
					//Add the chars to the textbox
					S.objects[multimediaSettings.textbox].appendChild(fragment);
					break;
			}
			break;
		case 'play':
		case 'pause':
			
			//Pause the audio if we're paused; it can start playing later
			if(S.window.classList.contains('showpony-paused')){
				if(command==='play') S.objects[object].wasPlaying=true;
				else{
					S.objects[object].wasPlaying=false;
					S.objects[object].pause();
				}
			}else S.objects[object][command]();
			
			runMM();
			break;
		case 'stop':
			S.objects[object].wasPlaying=false;
			S.objects[object].pause();
			S.objects[object].currentTime=0;
			
			runMM();
			break;
		case 'volume':
			S.objects[object].volume=parseFloat(vals[1]);
			runMM();
			break;
		case 'time':
			S.objects[object].currentTime=parseFloat(vals[1]);
			runMM();
			break;
		case 'speed':
			S.objects[object].playbackRate=parseFloat(vals[1]);
			runMM();
			break;
		case 'loop':
			S.objects[object].loop=true;
			runMM();
			break;
		default:
			break;
	}
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
		window.clearTimeout(timerId);
		pT.remaining=0;
	}
	
    pT.resume();
}

var multimediaFunction={
	/*'en':()=> S.to({file:'+1'})*/
	//EV	event
	'ev':vals=>{
		//Dispatch the event the user requested to
		S.window.dispatchEvent(new CustomEvent(vals[1]));
	}
	,'tb':(vals)=>{
		//Set the current textbox
		multimediaSettings.textbox=vals[1];
	}
}

//Replace unsafe characters for filenames with safe ones, and vice-versa
function safeFilename(string,type){
	var a=['[fs]','[bs]','[gt]','[lt]','[c]','[a]','[q]','[qm]','[b]'];
	var b=['/','\\','>','<',':','*','\'','?','|'];

	//Swap values if changing TO a filename instead of FROM a filename
	if(type!=='from') [a,b]=[b,a];
	
	for(let i=0,len=a.length;i<len;i++) string=string.replace(a[i],b[i]);
	return string;
}

///////////////////////////////////////
////////////EVENT LISTENERS////////////
///////////////////////////////////////

var shortcutKeys={
	' ': 				()=>S.input()
	,'ArrowLeft':		()=>S.to({time:'-10'})
	,'ArrowRight':		()=>S.to({time:'+10'})
	,'Home':			()=>S.to({file:'first'})
	,'End':				()=>S.to({file:'last'})
	,'MediaPrevious':	()=>S.to({file:'-1'})
	,'MediaNext':		()=>S.to({file:'+1'})
	,'MediaPlayPause':	()=>S.menu()
	,'f':				()=>S.fullscreen()
};

//If shortcut keys are enabled
if(S.shortcuts){
	//Keyboard presses
	window.addEventListener(
		'keydown'
		,function(event){
			//Don't use shortcut keys if we're writing into an input right now
			if(event.key==='f' || event.key===' '){
				if(event.target.tagName==='INPUT') return;
			}
			
			//If shortcuts aren't always enabled, perform checks
			if(S.shortcuts!=='always'){
				//Exit if it isn't fullscreen
				if(S.window!==document.webkitFullscreenElement && S.window!==document.mozFullScreenElement && S.window!==document.fullscreenElement){
					//If needs to be focused
					if(S.shortcuts!=='fullscreen' && S.window!==document.activeElement) return;
				}
			}
			
			if(shortcutKeys[event.key]
				&& !event.ctrlKey
				&& !event.altKey
				&& !event.shiftKey
				&& !event.metaKey
			){
				event.preventDefault();
				shortcutKeys[event.key]();
			}
		}
	);
}

//We need to set this as a variable to remove it later on
//This needs to be click- otherwise, you could click outside of Showpony, release inside, and the menu would toggle. This results in messy scenarios when you're using the UI.
var windowClick=function(event){
	//If we just ended scrubbing, don't toggle the menu at all
	if(scrubbing==='out'){
		scrubbing=false;
		return;
	}
	
	event.stopPropagation();
	S.menu(event);
};

//On clicking, we open the menu- on the overlay. But we need to be able to disable moving the bar outside the overlay, so we still activate menu here.
window.addEventListener('click',windowClick);

window.addEventListener('mouseup',function(event){
	//If we're not scrubbing, set scrubbing to false and return
	if(scrubbing!==true){
		scrubbing=false;
		return;
	}
	
	//Scrub the bar
	userScrub(event);
	
	scrubbing='out';
});

//On mousedown, we prepare to move the cursor (but not over overlay buttons)
overlay.addEventListener('mousedown',function(event){
	if(event.target===this){
		scrubbing=event.clientX;
		window.getSelection().removeAllRanges();
	}
});

//On touch end, don't keep moving the bar to the user's touch
overlay.addEventListener('touchend',userScrub);

//On dragging
window.addEventListener('mousemove',function(event){userScrub(event,true);});
overlay.addEventListener('touchmove',function(event){userScrub(event,true);});

//Menu buttons
fullscreenButton.addEventListener(
	'click'
	,event=>{
		S.fullscreen();
	}
);

if(S.subtitles){
	captionsButton.addEventListener(
		'change'
		,function(){
			S.currentSubtitles=this.options[this.selectedIndex].value==='None' ? null : this.value;
			displaySubtitles();
		}
	);
}else captionsButton.remove();

content.addEventListener('click',()=>{S.input();});

var sticky=false;

//Update the scrub bar when scrolling
pageTurn.addEventListener('scroll',function(event){
	event.stopPropagation();
	
	if(S.infiniteScroll){
		//if(content.classList.contains('showpony-loading')) return;
		
		console.log(sticky);
		
		//Set current time to percent scrolled
		if(!scrubbing && sticky===false){
			var parts=pageTurn.children;
			for(var i=0;i<parts.length;i++){
				//If we're beyond a part
				if(pageTurn.scrollTop>parts[i].offsetTop+parts[i].offsetHeight) continue;
				
				S.currentFile=parseInt(parts[i].dataset.file);
				
				timeUpdate(S.files[S.currentFile].duration*((pageTurn.scrollTop-parts[i].offsetTop)/parts[i].offsetHeight));
				
				break;
			}
		}
		
		//If 1 page height away from bottom
		if(this.scrollTop>=this.scrollHeight-this.clientHeight*2){
			for(var i=S.currentFile+1;i<S.files.length;i++){
				
				var check=content.querySelector('[data-file="'+i+'"]');
				
				//Not started loading
				if(!check){
					pageTurn.insertAdjacentHTML('beforeend','<div data-file="'+i+'"></div>');
					S.to({file:i});
					return;
				}
				
				//Keep the loop going if it has text
				if(!check.innerHTML){
					return;
				}
			}
		}
		
		//If 1 page height away from top
		if(this.scrollTop<=this.clientHeight){
			for(var i=S.currentFile-1;i>=0;i--){
				console.log(i);
				
				var check=content.querySelector('[data-file="'+i+'"]');
				
				//Not started loading
				if(!check){
					pageTurn.insertAdjacentHTML('afterbegin','<div data-file="'+i+'"></div>');
					S.to({file:i});
					return;
				}
				
				//Keep the loop going if it has text
				if(!check.innerHTML){
					return;
				}
			}
		}
		
		sticky=false;
	}else{
		//Set current time to percent scrolled
		timeUpdate(S.files[S.currentFile].duration*(this.scrollTop/this.scrollHeight));
		
		//If at top
		if(this.scrollTop<=0){
			S.to({time:'-1'});
		}
		
		//If at bottom
		if(this.scrollTop>=this.scrollHeight-this.scrollTop){
			S.to({file:'+1'});
		}
	}
});

///FINISHED LOADING///
types.image.addEventListener('load',function(){
	content.classList.remove('showpony-loading');
	S.files[S.currentFile].buffered=true;
	getTotalBuffered();
});

//Allow playing videos using Showpony in iOS
types.video.setAttribute('playsinline','');

//Fix for Safari not going to the right time
types.video.addEventListener('loadeddata',function(){
	this.currentTime=goToTime;
	console.log(goToTime,this);
});

types.audio.addEventListener('loadeddata',function(){
	this.currentTime=goToTime;
	console.log(goToTime,this);
});

types.video.addEventListener('canplay',function(){
	content.classList.remove('showpony-loading');
	//Consider how much has already been loaded; this isn't run on first chunk loaded
	this.dispatchEvent(new CustomEvent('progress'));
});
types.audio.addEventListener('canplay',function(){
	content.classList.remove('showpony-loading');
	//Consider how much has already been loaded; this isn't run on first chunk loaded
	this.dispatchEvent(new CustomEvent('progress'));
});

types.video.addEventListener('canplaythrough',function(){
	//Consider how much has already been loaded; this isn't run on first chunk loaded
	this.dispatchEvent(new CustomEvent('progress'));
});
types.audio.addEventListener('canplaythrough',function(){
	//Consider how much has already been loaded; this isn't run on first chunk loaded
	this.dispatchEvent(new CustomEvent('progress'));
});

//Buffering
types.video.addEventListener('progress',function(){
	var bufferedValue=[];
	var timeRanges=types.video.buffered;
	
	for(var i=0;i<timeRanges.length;i++){
		//If it's the first value, and it's everything
		if(i===0 && timeRanges.start(0)==0 && timeRanges.end(0)==types.video.duration){
			bufferedValue=true;
			break;
		}
		
		bufferedValue.push([timeRanges.start(i),timeRanges.end(i)]);
	}
	
	S.files[S.currentFile].buffered=bufferedValue;
	
	getTotalBuffered();
});

types.audio.addEventListener('progress',function(){
	var bufferedValue=[];
	var timeRanges=types.audio.buffered;
	
	for(var i=0;i<timeRanges.length;i++){
		//If it's the first value, and it's everything
		if(i===0 && timeRanges.start(0)==0 && timeRanges.end(0)==types.audio.duration){
			bufferedValue=true;
			break;
		}
		
		bufferedValue.push([timeRanges.start(i),timeRanges.end(i)]);
	}
	
	S.files[S.currentFile].buffered=bufferedValue;
	
	getTotalBuffered();
});

//When we finish playing a video or audio file
types.video.addEventListener('ended',mediaEnd);
types.audio.addEventListener('ended',mediaEnd);

//On moving through time, update info and title
types.video.addEventListener('timeupdate',function(){
	//Consider how much has already been loaded; this isn't run on first chunk loaded
	this.dispatchEvent(new CustomEvent('progress'));
	timeUpdate();
});
types.audio.addEventListener('timeupdate',function(){
	//Consider how much has already been loaded; this isn't run on first chunk loaded
	this.dispatchEvent(new CustomEvent('progress'));
	timeUpdate();
});

function updateInfo(pushState){
	//Update the scrub bar
	if(scrubbing!==true) scrub();
	
	//If using queries with time, adjust query on time update
	if(S.query){
		var newURL=document.location.href
			,newQuery=''
		;
		
		//Choose whether to add an ampersand or ?
		//Choose a ? if one doesn't exist or it exists behind the query
		newQuery=(newURL.indexOf('?')===-1 || new RegExp('\\?(?='+S.query+'=)').test(newURL)) ? '?' : '&';
		
		newQuery+=S.query+'='+(Math.floor(getCurrentTime()));
		
		//Replace either the case or the end
		newURL=newURL.replace(new RegExp('(((\\?|&)'+S.query+')=?[^&#]+)|(?=#)|$'),newQuery);
		
		if(location.href!==newURL) history[pushState ? 'pushState' : 'replaceState']({},'',newURL);
	}
}

//Gamepad support

//Showpony framerate- which is connected not to animations, etc, but to gamepad use and games
S.gamepad=null;
var framerate=60;
var checkGamepad=setInterval(gamepadControls,1000/framerate);

window.addEventListener('gamepadconnected',function(e){
	S.gamepad={
		id:e.gamepad.index
		,menu:-1
		,input:-1
		,analogueL:0
		,dpadL:-1
		,dpadR:-1
		,fullscreen:-1
	}
});

window.addEventListener('gamepaddisconnected',function(e){
	S.gamepad=null;
});

function gamepadControls(){
	if(S.gamepad!==null){
		//If shortcuts aren't always enabled, perform checks
		if(S.shortcuts!=='always'){
			//Exit if it isn't fullscreen
			if(S.window!==document.webkitFullscreenElement && S.window!==document.mozFullScreenElement && S.window!==document.fullscreenElement){
				//If needs to be focused
				if(S.shortcuts!=='fullscreen' && S.window!==document.activeElement) return;
			}
		}
		
		var gamepad=navigator.getGamepads()[S.gamepad.id];
		
		//XBOX Gamepad
		if(/360/.test(gamepad.id)){
			gamepadButton(gamepad,9,'menu');		//Start
			gamepadButton(gamepad,0,'input');		//A
			gamepadButton(gamepad,14,'dpadL');		//Dpad Left
			gamepadButton(gamepad,15,'dpadR');		//Dpad Right
			gamepadButton(gamepad,8,'fullscreen');	//Select
			gamepadButton(gamepad,6,'home');		//Left trigger
			gamepadButton(gamepad,7,'end');			//Right trigger
				
			//ANALOGUE STICK//
			//Use for scrubbing
			//TODO: use for scrubbing
		//Normal, average gamepad
		}else{
			gamepadButton(gamepad,9,'menu');		//Start
			gamepadButton(gamepad,0,'input');		//A
			gamepadButton(gamepad,8,'fullscreen');	//Select
			gamepadButton(gamepad,6,'home');		//Left trigger
			gamepadButton(gamepad,7,'end');			//Right trigger
		}
		
		//Register inputs
		if(S.gamepad.menu==2) S.menu();
		if(S.gamepad.input==2) S.input();
		if(S.gamepad.dpadL==2) S.to({file:'-1'});
		if(S.gamepad.dpadR==2) S.to({file:'+1'});
		if(S.gamepad.end==2) S.to({file:'last'})
		if(S.gamepad.home==2) S.to({file:'first'})
		if(S.gamepad.fullscreen==2) S.fullscreen();
	}
}

function gamepadButton(gamepad,number,type){
	if(gamepad.buttons[number].pressed){
		//Set pressing values right
		if(S.gamepad[type]<0) S.gamepad[type]=2;
		else S.gamepad[type]=1;
	}else{
		if(S.gamepad[type]>0) S.gamepad[type]=-2;
		else S.gamepad[type]=-1;
	}
}


///////////////////////////////////////
/////////////////START/////////////////
///////////////////////////////////////

S.window.classList.add('showpony');

//If the window is statically positioned, set it to relative! (so positions of children work)
if(window.getComputedStyle(S.window).getPropertyValue('position')=='static') S.window.style.position='relative';

//Set tabIndex so it's selectable (if it's not already set)
if(S.window.tabIndex<0) S.window.tabIndex=0;

//Make sure setup is made of multiple Promises that can run asyncronously- and that they do!

//If the user's getting the files remotely, make the call
var getFiles=new Promise(function(resolve,reject){
	content.classList.add('showpony-loading');
	
	//currentFile is -1 before we load
	S.currentFile=-1;
	
	//Empty the current window
	S.window.innerHTML='';
	
	if(S.cover){
		if(S.cover.image) cover.style.backgroundImage='url("'+S.cover.image+'")';
		if(S.cover.content){
			//Assume surrounding <p> tags if it doesn't include surrounding HTML tags
			if(/^<[^>]+>.+<\/[^>]+>$/.test(S.cover.content)) cover.innerHTML=S.cover.content;
			else cover.innerHTML='<p>'+S.cover.content+'</p>';
		}
		S.window.appendChild(cover);
		
		cover.addEventListener('click',function(){
			S.menu(null,'play');
			this.remove();
		});
	}

	//And fill it up again!
	frag([styles,content,subtitles,overlay],S.window);
	
	//If getting, run a promise to check success
	if(typeof(S.get)=='string'){
		POST({call:'getFiles'})
			.then(response=>resolve())
			.catch(response=>reject(response));
	}else{
		S.files=S.get;
		//Skip to next then if an array was passed instead
		saveAllFileInfo(S.files);
		resolve();
	}
});

//Get Hey Bard account
var getHeyBard=new Promise((resolve,reject)=>{
	function getBookmark(){
		var bookmark=null;
		
		if(S.saveId===null){
			if(S.remoteSave) alert('Cannot use remoteSave with saveId set to null! Set saveId or set remoteSave to false!');
			
			if(S.localSave) alert('Cannot use localSave with saveId set to null! Set saveId or set localSave to false!');
			
			return null;
		}
		
		//If Hey Bard is enabled, try it first!
		if(S.remoteSave){
			//Make a button
			var accountButton=m('button showpony-account-button','button');
			overlay.appendChild(accountButton);
			
			accountButton.addEventListener(
				'click'
				,event=>{
					event.stopPropagation();
					
					//Try saving a bookmark before you leave
					if(typeof(S.saveBookmark)==='function'){
						var sB=S.saveBookmark();
						
						//If something was returned (like a promise)
						if(sB){
							sB.then(()=>{
								//Go to Hey Bard's web page to get your account
								location.href=HeyBardConnection.makeLink({url:location.href,query:S.query});
							})
							//If it fails, let the user know
							.catch((response)=>{
								alert('1820: '+response);
								console.log(response);
							})
							;
						//Regardless of whether or not we got something back, go there
						}else{
							location.href=HeyBardConnection.makeLink({url:location.href,query:S.query});
						}
					//If we can't save a bookmark (the user's probably not logged in)
					}else{
						//Just use the link
						location.href=HeyBardConnection.makeLink({url:location.href,query:S.query});
					}
					
					
				}
			);
			accountButton.alt='Hey Bard! Account';
			
			if(typeof HeyBard==='function'){
				//Make a Hey Bard connection
				HeyBardConnection=new HeyBard(S.saveId);
				
				HeyBardConnection.getAccount()
				.then(response=>{
					//If an account exists for the user
					if(response.account!==null){
						//Set the text for the Hey Bard button accordingly
						accountButton.title='Hello, '+response.account+'! We\'ll save your bookmarks for you!';
						accountButton.innerHTML=response.account;
						
						//Set a function to save bookmarks
						S.saveBookmark=function(){
							//Pass either the time or the current file, whichever is chosen by the client
							return HeyBardConnection.saveBookmark(Math.floor(getCurrentTime()));
						}
					}else{
					//If an account doesn't exist for the user
						accountButton.innerHTML='Log in for bookmarks!';
						//Set the text for the Hey Bard button accordingly
						accountButton.title='Save a bookmark with a free Hey Bard! Account';
					}
					
					//'False' can be read as 0, so if bookmark is returned as false don't pass the value.
					if(typeof(response.bookmark)==='undefined') return null;
					else return response.bookmark;
				})
				.catch(response=>{
					accountButton.innerHTML='HEY BARD FAILED';
					//Set the text for the Hey Bard button accordingly
					accountButton.title='Failed to call Hey Bard\'s servers. Please try again later!';
					
					return null;
				})
				;
			}else{
				accountButton.innerHTML='SCRIPT MISSING';
				//Set the text for the Hey Bard button accordingly
				accountButton.title='Failed to load the necessary script to use Hey Bard accounts.';
				
				return null;
			}
		}

		//Try local storage
		if(bookmark===null && S.localSave){
			//Set a function to save bookmarks
			S.saveBookmark=function(){
				var saveValue=Math.floor(getCurrentTime());
				localStorage.setItem(S.saveId,saveValue);
				
				return saveValue;
			}
			
			bookmark=parseInt(localStorage.getItem(S.saveId));
		}
		
		if(typeof(S.saveBookmark)!=='undefined'){
			var saveBookmark=S.saveBookmark;
			
			//Save user bookmarks when leaving the page
			window.addEventListener('blur',saveBookmark);
			window.addEventListener('beforeunload',saveBookmark);
			
			//Showpony deselection (to help with Firefox and Edge's lack of support for 'beforeunload')
			S.window.addEventListener('focusout',saveBookmark);
			S.window.addEventListener('blur',saveBookmark);
		}
		
		//Pass whatever value we've gotten
		return bookmark;
	}
	
	var bookmark=getBookmark();
	
	if(bookmark!==null){
		cover.remove();
	}
	
	//If it's finished loading, we're good!
	if(!S.remoteSave || typeof HeyBard==='function'){
		resolve(bookmark);
		return null;
	}
	
	//Otherwise, if it doesn't exist add the element
	if(!document.querySelector('[src="https://heybard.com/apis/accounts/script.js"]')){
		var script=document.createElement('script');
		script.src='https://heybard.com/apis/accounts/script.js';
		document.head.appendChild(script);
	}
	
	document.querySelector('[src="https://heybard.com/apis/accounts/script.js"]').addEventListener('load',function(){
		resolve(bookmark);
	});
});

//Get bookmarks going
Promise.all([getFiles,getHeyBard]).then(function(start){
	//Start at the first legit number: start, input.start, or the last file
	start=start[1];
	
	if(start===null){
		switch(S.start){
			case 'first':
				start=0;
				break;
			case 'last':
				start=S.files.length-1;
				break;
			default:
				start=parseInt(S.start);
				break;
		}
	}
	
	console.log(S.start,start);
	
	//If querystrings are in use, consider the querystring in the URL
	if(S.query){
		window.addEventListener(
			'popstate'
			,function(){
				var page=(new RegExp('(\\?|&)'+S.query+'[^&#]+','i').exec(window.location.href));
				
				//If we found a page
				if(page){
					page=parseInt(page[0].split('=')[1]);
					
					if(page===getCurrentTime()) return;
				
					S.to({time:page,popstate:true,scrollToTop:false});
				}
			}
		);
		
		var page=window.location.href.match(new RegExp('(\\?|&)'+S.query+'[^&#]+','i'));
		if(page) page=parseInt(page[0].split('=')[1]);
		
		//General pass object
		var passObj={
			popstate:page ? true : false
			,replaceState:page ? false : true //We replace the current state in some instances (like on initial page load) rather than adding a new one
			,scrollToTop:false
			,reload:true
		};
		
		passObj.time=(page!==null) ? page : start;
		
		S.to(passObj);
	//Start
	}else{
		//Use time or file to bookmark, whichever is requested
		S.to({time:start,scrollToTop:false});
	}
	
	//Set input to null in hopes that garbage collection will come pick it up
	input=null;
	
	//We don't remove the loading class here, because that should be taken care of when the file loads, not when Showpony finishes loading
	
	if(S.subtitles){
		var obj=Object.keys(S.subtitles);
		
		//Add captions to options
		
		var option=m('captions-option','option');
		option.innerHTML='None';
		option.value='None';
		option.selected=true;
		option.addEventListener('click',function(){
			S.currentSubtitles=null;
		});
		captionsButton.appendChild(option);
		
		for(let i=0;i<obj.length;i++){
			let option=m('captions-option','option');
			option.innerHTML=obj[i];
			option.value=obj[i];
			option.addEventListener('click',function(){
				S.currentSubtitles=this.value;
			});
			captionsButton.appendChild(option);
		}
	}
	
	//Send an event to let the user know that Showpony has started up!
	S.window.dispatchEvent(
		new CustomEvent('setup'
		,{detail:{
			state:'success'
		}})
	);
})
//On failure (or not getting)
.catch((response)=>{
	alert('Failed to successfully load the Showpony object! '+response);
	console.log(response);
	
	//Send an event to let the user know that Showpony has started up!
	S.window.dispatchEvent(
		new CustomEvent('setup'
		,{detail:{
			state:'failed'
		}})
	);
});

///////////////////////////////////////
/////////////////ADMIN/////////////////
///////////////////////////////////////

if(S.admin){
	if(Array.isArray(S.get)){
		alert('You can\'t use the admin panel with an array for "get"! Set "get" to a folder path instead!');
	}else{
		var editorUI=m('editor-ui')
			,uploadFileButton=m('button showpony-upload-file','label')
			,uploadFile=document.createElement('input')
			,uploadDate=m('button showpony-editor-date','input')
			,uploadName=m('button showpony-editor-name','input')
			,deleteFile=m('button showpony-delete-file','button')
			,newFile=m('button showpony-new-file','button')
			,logoutButton=m('button showpony-logout','button')
		;

		uploadName.type=uploadDate.type='text';
		uploadName.placeholder='File Title (optional)';
		uploadDate.placeholder='YYYY-MM-DD HH:MM:SS';

		uploadFile.type='file';
		uploadFile.style.display='none';
		uploadFile.accept='.jpg,.jpeg,.png,.gif,.svg,.mp3,.wav,.mp4,.webm,.txt,.mm,.html';
		
		uploadFileButton.appendChild(uploadFile);
		
		frag([uploadFileButton,uploadDate,uploadName,deleteFile,newFile,logoutButton],editorUI);
		
		S.window.appendChild(editorUI);
		
		//Edit/adjust file details
		S.window.addEventListener(
			'contextmenu'
			,event=>{
				event.preventDefault();
				editor();
			}
		);
		
		function editor(){
			//If logged in, toggle the editor
			if(loggedIn) S.window.classList.toggle('showpony-editor');
			//Otherwise, try to log in
			else account('login');
		}
		
		function updateEditor(){
			//Remove extra values to get these ones
			uploadName.value=S.files[S.currentFile].title;
			uploadDate.value=S.files[S.currentFile].date;
		}
		
		logoutButton.addEventListener('click',()=>account('logout'));
		
		//Must be set to a variable to be called outside the enclosing 'if' statement
		var account=function(type){
			var pass=null;
			if(type==='login') if(!(pass=prompt('What\'s your password?'))) return;
			
			POST({call:type,password:pass})
			.then(response=>{
				S.window.classList[loggedIn ? 'add' : 'remove']('showpony-editor');
					
				S.to({
					reload:true
					,scrollToTop:false
					,replaceState:true
				});
			})
			.catch(response=>{
				alert('501: '+response);
				console.log(response);
			});
		}
		
		function renameFile(){
			var thisFile=S.currentFile;
			var date=uploadDate.value;
			
			//Test that the date is safe (must match setup)
			if(!(/^\d{4}-\d\d-\d\d(\s\d\d:\d\d:\d\d)?$/.test(date))){
				alert('Date must be formatted as "YYYY-MM-DD" or "YYYY-MM-DD HH-MM-SS". You passed "'+date+'"');
				return;
			}
			
			var fileName=((S.files[thisFile].name[0]==='x') ? 'x': '')
				+date.replace(/:/g,';') //date (replace : with ; so it's Windows safe)
				+' ('+safeFilename(uploadName.value,'to')+')' //title
				+S.files[thisFile].name.match(/\.\w+$/) //ext
			;
			
			POST({
				call:'renameFile'
				,name:S.files[thisFile].name
				,newName:fileName
			})
			.then(response=>{
				S.files[thisFile]=saveFileInfo(S.get+response.file);
				
				//Sort the files by order 
				S.files=S.files.sort(
					//Return>0, 2nd is returned
					function(a,b){
						//If a is first, sort a before
						if(([a.path,b.path].sort)[0]===a.path) -1;
					}
				);
				
				var goToFile=0;
				
				for(let i=0;i<S.files.length;i++){
					if(S.files[i].name===response.file){
						goToFile=i;
						break;
					}
				}
				
				S.to({
					file:goToFile
					,scrollToTop:false
					,replaceState:true
				});
				scrub();
			});
		}
		
		//EVENT LISTENERS//
		//On time, update the editor
		S.window.addEventListener('timeupdate',updateEditor);
		uploadName.addEventListener('change',renameFile);
		uploadDate.addEventListener('change',renameFile);
		
		uploadFile.addEventListener('change'
			,function(){
				var thisFile=S.currentFile;
				
				POST({
					call:'uploadFile'
					,name:S.files[thisFile].name
					,files:uploadFile.files[0]
				})
				.then(response=>{
					S.files[thisFile]=saveFileInfo(S.get+response.file);
					
					//If still on that file, refresh it
					if(S.currentFile===thisFile){
						S.to({
							file:thisFile
							,reload:true
							,refresh:true
							,scrollToTop:false
							,replaceState:true
						});
					}
				});
			}
		);
		
		deleteFile.addEventListener('click'
			,()=>{
				var thisFile=S.currentFile;
				
				POST({call:'deleteFile',name:S.files[thisFile].name})
				.then(response=>{
					//Remove the file from the array
					S.files.splice(thisFile,1);
					
					//Combine total length of all parts
					S.duration=S.files.map(function(e){return e.duration;}).reduce((a,b) => a+b,0);

					//If still on the file we're deleting, reload the file
					if(thisFile===S.currentFile){
						console.log('its teh same!');
						S.to({
							file:thisFile
							,refresh:true
							,replaceState:true
						});
					}
				});
			}
		);
		
		newFile.addEventListener('click'
			,function(){
				POST({call:'newFile'})
				.then(response=>{
					//Add the file to the array
					S.files.push(saveFileInfo(S.get+response.file));
					
					//Combine total length of all parts
					S.duration=S.files.map(function(e){return e.duration;}).reduce((a,b) => a+b,0);
					
					S.to({
						file:'last'
					});
				})
				.catch(
					
				);
			}
		);
	}
}

}