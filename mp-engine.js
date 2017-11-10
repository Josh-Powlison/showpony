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
	
	//Get the media type of a file
	eng.getMediaType=function(inputFile){
		//NOTE: we gotta find a way to differentiate between video and audio oggs and mp4s
		
		console.log(inputFile,inputFile.match(/\.[^.]+$/));
		
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
	
	console.log(eng,inputElement);
	
	eng.sources=inputFiles;
	eng.durations=[];
	eng.totalDuration=0;
	eng.currentSource=0;
	
	console.log(eng.window);
	
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
	for(i=0;i<eng.sources.length;i++){
		//Keep thisMedia local to this for loop
		let thisMedia=document.createElement(eng.getMediaType(eng.sources[i]));
		
		thisMedia.src="stories/"+eng.sources[i];
		thisMedia.preload="metadata";
		
		
		//Listen for media loading
		thisMedia.addEventListener(
			"loadedmetadata"
			,function(){
				eng.durations.push(thisMedia.duration);
				console.log(thisMedia.duration);
				eng.totalDuration+=thisMedia.duration;
			}
		);
		
		console.log(thisMedia);
		
	}
	
	//DEFAULT STYLES//
	//If the window is statically positiond, set it to relative! (so positions of children work)
	if(window.getComputedStyle(eng.window).getPropertyValue('position')=="static"){
		eng.window.style.position="relative";
	}
	
	console.log(eng.window);
	//eng.window.innerHTML="";
	
	eng.overlay=document.createElement("div");
	eng.overlay.style.cssText=`
		position:absolute;
		left:0;
		top:0;
		right:0;
		bottom:0;
		background-color:rgba(0,0,0,.5);
		color:white;
		text-align:center;
	`;
	
	eng.window.appendChild(eng.overlay);
	
	eng.play=function(){
		eng.player.play();
		eng.overlay.style.visibility="hidden";
	}
	
	eng.pause=function(){
		eng.player.pause();
		
		//Set up the display for the overlay
		eng.overlay.style.visibility="visible";
		
		var currentTime=eng.player.currentTime;
		
		//Look through the videos for the right one
		for(i=0;i<eng.currentSource;i++){
			currentTime+=eng.durations[i];
		}
		
		eng.overlay.innerHTML="<p>"+currentTime.toFixed(2)+"/"+eng.totalDuration.toFixed(2)+"</p>";
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
			//If paused, then play; if playing, then pause.
			eng[
				eng.player.paused
				? "play"
				: "pause"
			]();
		}
	);
	
	//On dragging
	eng.window.addEventListener(
		"contextmenu"
		,function(event){
			
			eng.time(event.offsetX / this.offsetWidth);
		}
	);
	
	//Update the time by a percentage
	eng.time=function(inputPercent){
		//Go to the time
		var newTime=eng.totalDuration*inputPercent;
	
		//Look through the videos for the right one
		for(i=0;i<eng.durations.length;i++){
			//If the duration's beyond this one, go to the next one (and subtract the duration from the total duration)
			if(newTime>eng.durations[i]){
				newTime-=eng.durations[i];
				whichVideo=i;
			}
			else{ //If this is the video!
				//Set it up to play
				
				//If we have to change the source
				if(i!=eng.currentSource){
					eng.currentSource=i;
					eng.player.src="stories/"+eng.sources[eng.currentSource];
				}
				
				//Set the time properly
				eng.player.currentTime=newTime;
				
				console.log(newTime,eng.totalDuration,eng.currentSource);
				break;
			}
		}
	}
	
	eng.pause();
}