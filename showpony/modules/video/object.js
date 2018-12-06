S.modules.video=new function(){
	const M=this;
	
	M.currentTime=null;
	M.currentFile=null;
	
	M.window=document.createElement('video');
	M.window.className='m-video';
	
	M.play=function(){
		M.window.play();
	}
	
	M.pause=function(){
		M.window.pause();
	}
	
	M.regress=function(){
		if(M.currentTime<10) S.to({file:'-1',time:'end'});
		else S.to({time:'-10'});
	}
	
	M.progress=function(){
		if(M.currentTime>S.files[M.currentFile].duration-10) S.to({file:'+1'});
		else S.to({time:'+10'});
	}
	
	M.timeUpdate=function(time=0){
		M.currentTime=M.window.currentTime=time;
	}
	
	M.goToTime=0;
	
	M.src=function(file=0,time=0){
		return new Promise(function(resolve,reject){
			if(time==='end') time=S.files[file].duration-5;
			
			// Change the file if it'd be a new one
			if(M.currentFile!==file) M.window.src=S.files[file].path;
			
			// If we're not paused, play
			if(!S.paused) M.play();
			
			resolve({file:file,time:time});
		});
	}
	
	M.displaySubtitles=function(){
		subtitles.style.cssText=null;
		var currentTime=M.window.currentTime;
		
		var phrases=S.subtitles[S.currentSubtitles][M.currentFile];
		var keys=Object.keys(phrases);
		for(var i=0;i<keys.length;i++){
			
			// Continue if we're before the start
			if(M.currentTime<timeToSeconds(phrases[keys[i]].start)) continue;
			
			// Continue if we're after the end
			if(M.currentTime>timeToSeconds(phrases[keys[i]].end)) continue;
			
			if(subtitles.children.length===0 || subtitles.children[0].innerHTML!==phrases[keys[i]].content){
				subtitles.innerHTML='';
			
				var block=document.createElement('p');
				block.className='showpony-sub';
				block.innerHTML=phrases[keys[i]].content;
				
				subtitles.appendChild(block);
			}
			
			return;
		}
		
		subtitles.innerHTML='';
	}
	
	// Allow playing videos using Showpony in iOS
	M.window.setAttribute('playsinline','');

	// Fix for Safari not going to the right time
	M.window.addEventListener('loadeddata',function(){
		M.currentTime=M.window.currentTime=M.goToTime;
	});

	M.window.addEventListener('canplay',function(){
		content.classList.remove('s-loading');
		// Consider how much has already been loaded; this isn't run on first chunk loaded
		M.window.dispatchEvent(new CustomEvent('progress'));
	});

	M.window.addEventListener('canplaythrough',function(){
		// Consider how much has already been loaded; this isn't run on first chunk loaded
		M.window.dispatchEvent(new CustomEvent('progress'));
	});

	// Buffering
	M.window.addEventListener('progress',function(){
		var bufferedValue=[];
		var timeRanges=M.window.buffered;
		
		for(var i=0;i<timeRanges.length;i++){
			// If it's the first value, and it's everything
			if(i===0 && timeRanges.start(0)==0 && timeRanges.end(0)==M.window.duration){
				bufferedValue=true;
				break;
			}
			
			bufferedValue.push([timeRanges.start(i),timeRanges.end(i)]);
		}
		
		S.files[M.currentFile].buffered=bufferedValue;
		
		getTotalBuffered();
	});
	
	// When we finish playing a video or audio file
	M.window.addEventListener('ended',function(){
		// Only do this if the menu isn't showing (otherwise, while we're scrubbing this can trigger)
		if(!S.paused) S.to({file:'+1'});
	});

	// On moving through time, update info and title
	M.window.addEventListener('timeupdate',function(){
		M.currentTime=M.window.currentTime;
		
		// Consider how much has already been loaded; this isn't run on first chunk loaded
		this.dispatchEvent(new CustomEvent('progress'));
		timeUpdate();
	});
}();