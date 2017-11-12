//MEDIA PLAYER ENGINE
function MediaPlayer(inputElement,inputFiles,inputLoading){
	//Need to set a variable to keep "this" separate from children's "this"
	var eng=this;
	
	//Variables//
	eng.window=inputElement;	
	//Save the original parent
	eng.originalWindow=eng.window.cloneNode(true);
	eng.data={};
		
	//Remove the onclick event that set up this kn-engine
	eng.window.onclick=null;
	eng.window.style.cursor="pointer";
	
	//Get the media type of a file
	eng.getMediaType=function(inputFile){
		//NOTE: we gotta find a way to differentiate between video and audio oggs and mp4s
		
		//Check for video format; if it's not a video format, assume it's audio
		switch(inputFile.match(/\.[^.]+$/)[0]){
			case ".webm":
			case ".mp4":
				return "video";
				break;
			default:
				break;
		}
		
		//If we don't find a video format, assume it's audio.
		return "audio";
	}
	
	eng.sources=inputFiles;
	eng.durations=[];
	eng.totalDuration=0;
	eng.currentSource=0;
	
	eng.player=document.createElement(eng.getMediaType(eng.sources[0]));
	eng.player.style.cssText=`
		position:absolute;
		left:0;
		top:0;
		width:100%;
		height:100%;
	`;
	eng.player.src="stories/"+eng.sources[eng.currentSource];
	eng.window.appendChild(eng.player);
	
	
	//Get lengths of all of the videos
	for(let i=0;i<eng.sources.length;i++){		
		//Keep thisMedia local to this for loop
		let thisMedia=document.createElement(eng.getMediaType(eng.sources[i]));
		
		thisMedia.src="stories/"+eng.sources[i];
		thisMedia.preload="metadata";
		
		//Listen for media loading
		thisMedia.addEventListener(
			"loadedmetadata"
			,function(){
				//Want to round up for later calculations
				eng.durations[i]=thisMedia.duration;
				eng.totalDuration+=thisMedia.duration;
			}
		);
		
	}
	
	//DEFAULT STYLES//
	//If the window is statically positiond, set it to relative! (so positions of children work)
	if(window.getComputedStyle(eng.window).getPropertyValue('position')=="static"){
		eng.window.style.position="relative";
	}
	
	eng.overlay=document.createElement("div");
	eng.overlay.style.cssText=`
		position:absolute;
		left:0;
		top:0;
		right:0;
		bottom:0;
		background-color:rgba(0,0,0,.75);
		font-family:monospace;
		-webkit-user-select:none;
	`;
	
	eng.progress=document.createElement("div");
	eng.progress.style.cssText=`
		position:absolute;
		left:0;
		top:20%;
		bottom:0;
		width:.5em;
		transform:translate(-.25em,0);
		background-color:white;
		cursor:col-resize;
		z-index:1;
		pointer-events:none;
	`;
	
	eng.overlayText=document.createElement("div");
	eng.overlayText.style.cssText=`
		position:absolute;
		left:0;
		top:0;
		bottom:0;
		right:0;
		color:white;
		text-align:center;
		pointer-events:none;
	`;

	eng.overlay.appendChild(eng.progress);
	eng.overlay.appendChild(eng.overlayText);
	
	//Fullscreen Button
	eng.fullscreenButton=document.createElement("button");
	eng.fullscreenButton.innerHTML="+/-";
	
	eng.fullscreenButton.style.cssText=`
		position:absolute;
		right:0;
		background:none;
		color:#fff;
		font-size:2em;
		font-weight:bold;
		border:none;
		padding:0 .25em;
	`;
	
	eng.fullscreenButton.addEventListener(
		"click"
		,function(){
			event.stopPropagation();
			
			if(!document.webkitFullscreenElement){
				eng.window.webkitRequestFullscreen();
				eng.window.style.width="100%";
				eng.window.style.height="100%";
			}else{
				document.webkitExitFullscreen();
				eng.window.style.width=null;
				eng.window.style.height=null;
			}
		}
	);
	
	eng.overlay.appendChild(eng.fullscreenButton);

	//Captions Button
	eng.captionsButton=document.createElement("button");
	eng.captionsButton.innerHTML="cc";
	
	eng.captionsButton.style.cssText=`
		position:absolute;
		left:0;
		background:none;
		color:#fff;
		font-size:2em;
		font-weight:bold;
		border:none;
		padding:0 .25em;
	`;

	eng.captionsButton.addEventListener(
		"click"
		,function(){
			event.stopPropagation();
			/*
			if(!document.webkitFullscreenElement){
				eng.window.webkitRequestFullscreen();
				eng.window.style.width="100%";
				eng.window.style.height="100%";
			}else{
				document.webkitExitFullscreen();
				eng.window.style.width=null;
				eng.window.style.height=null;
			}*/
		}
	);
	
	//eng.overlay.appendChild(eng.captionsButton);
	
	eng.window.appendChild(eng.overlay);
	
	eng.play=function(){
		eng.player.play();
		eng.overlay.style.visibility="hidden";
	}
	
	eng.pause=function(){
		eng.player.pause();
		
		eng.moveBar=false;
		
		//Set up the display for the overlay
		eng.overlay.style.visibility="visible";
		
		var currentTime=eng.player.currentTime;
		
		//Look through the videos for the right one
		for(i=0;i<eng.currentSource;i++){
			currentTime+=eng.durations[i];
		}
		
		eng.time(currentTime / eng.totalDuration);
	}
	
	//Format is hh:mm:ss
	eng.secondsToTime=function(inputSeconds){
		
		var hours=Math.floor(inputSeconds / 3600);
		var minutes=Math.floor((inputSeconds % 3600) / 60);
		var seconds=Math.floor(inputSeconds % 60);
		
		return String(hours).padStart(2,'0')+':'+String(minutes).padStart(2,'0')+':'+String(seconds).padStart(2,'0');
	}
	
	eng.stop=function(){
		eng.player.pause();
		eng.currentSource=0;
		eng.player.src="stories/"+eng.sources[eng.currentSource];
		eng.player.currentTime=0;
	}
	
	//When the player's finished with a file
	eng.player.addEventListener(
		"ended"
		,function(){
			//If we're scrubbing the media, don't check for ended (this can trigger and interrupt our media scrubbing)
			if(eng.overlay.style.visibility=="visible") return;
			
			if(eng.currentSource<eng.sources.length-1){
				eng.currentSource++;
				eng.player.src="stories/"+eng.sources[eng.currentSource];
				eng.play();
			}else{
				eng.stop();
			}
		}
	);
	
	//On clicking
	eng.window.addEventListener(
		"click"
		,function(){
			//If we're moving the bar right now, ignore clicking but do set moveBar to false
			if(eng.moveBar===true){
				eng.moveBar=false;
				return;
			}
			
			//If paused, then play; if playing, then pause.
			eng[
				eng.player.paused
				? "play"
				: "pause"
			]();
		}
	);
	eng.moveBar=false;
	
	//On mousedown, we prepare to move the cursor
	eng.overlay.addEventListener(
		"mousedown"
		,function(event){
			//Only read mousemove over the overlay
			if(event.target!==this) return;
			
			eng.moveBar=event.clientX;
		}
	);
	
	//On dragging
	eng.overlay.addEventListener(
		"mousemove"
		,function(event){
			
			//Only read mousemove over the overlay
			if(event.target!==this) return;
			
			if(eng.moveBar===false){
				return;
			}
			
			if(eng.moveBar!==true){
				if(Math.abs(eng.moveBar-event.clientX)>screen.width/100){
					eng.moveBar=true;
				}else{
					return;
				}
			}
			
			eng.time(event.offsetX / this.offsetWidth);
		}
	);
	
	
	//On dragging
	eng.overlay.addEventListener(
		"touchmove"
		,function(event){
			
			//Only read mousemove over the overlay
			if(event.target!==this) return;
			
			if(eng.moveBar===false){
				eng.moveBar=event.changedTouches[0].clientX;
			}
			
			//You have to swipe farther than you move the cursor to adjust the position
			if(eng.moveBar!==true){
				if(Math.abs(eng.moveBar-event.changedTouches[0].clientX)>screen.width/20){
					eng.moveBar=true;
				}else{
					return;
				}
			}
			
			//Don't want the users to accidentally swipe to another page!
			event.preventDefault();
			
			eng.time((event.changedTouches[0].clientX-eng.window.offsetLeft) / this.offsetWidth);
		}
	);
	
	//On touch end, don't keep moving the bar to the user's touch
	eng.overlay.addEventListener(
		"touchend"
		,function(event){
			eng.moveBar=false;
		}
	);
	
	//Update the time by a percentage
	eng.time=function(inputPercent){
		//Clamp inputPercent between 0 and 1
		inputPercent= inputPercent <= 0 ? 0 : inputPercent >= 1 ? 1 : inputPercent;
		
		//Go to the time
		var newTime=eng.totalDuration*inputPercent;
		eng.progress.style.left=(inputPercent*100)+"%";
	
		//Look through the media for the right one
		for(i=0;i<eng.durations.length;i++){
			//If the duration's beyond this one, go to the next one (and subtract the duration from the total duration)
			if(newTime>eng.durations[i]){
				newTime-=eng.durations[i];
			}
			else
			{ //If this is the media!
				//Set it up to play
				
				//If we have to change the source
				if(i!==eng.currentSource){
					eng.currentSource=i;
					eng.player.src="stories/"+eng.sources[eng.currentSource];
				}
			
				break;
			}
		}
		
		//Set the time properly
		eng.player.currentTime=newTime;
		
		var currentTime=eng.player.currentTime;
		
		//Look through the videos for the right one
		for(i=0;i<eng.currentSource;i++){
			currentTime+=eng.durations[i];
		}
		
		//Set the overlay text (the current time)
		eng.overlayText.innerHTML="<p>"+eng.secondsToTime(currentTime)+" | "+eng.secondsToTime(eng.totalDuration-currentTime)+"</p>";
		//eng.overlayText.innerHTML="<p>"+eng.secondsToTime(currentTime)+"</p><hr><p>"+eng.secondsToTime(eng.totalDuration)+"</p>";
	}
	
	eng.play();
	
	THIS=eng;
}