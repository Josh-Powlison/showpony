S.modules.audio=new function(){
	const M=this;
	
	M.currentTime=null;
	M.currentFile=null;
	
	M.window=document.createElement('div');
	M.window.className='m-audio-window';
	
	M.audio=document.createElement('audio');
	M.audio.className='m-audio';
	M.audio.disableRemotePlayback = true;
	M.audio.dataset.filename = null;
	M.window.appendChild(M.audio);
	
	M.subtitles=document.createElement('p');
	M.subtitles.className='m-audio-subtitles';
	M.window.appendChild(M.subtitles);
	
	M.play=function(){
		M.audio.play();
	}
	
	M.pause=function(){
		M.audio.pause();
	}
	
	M.regress=function(){
		if(M.currentTime<5) S.to({file:'-1',time:'end'});
		else S.to({time:'-5'});
	}
	
	M.progress=function(){
		if(M.currentTime>S.files[M.currentFile].duration-5) S.to({file:'+1'});
		else S.to({time:'+5'});
	}
	
	M.src=function(file=0,time=0){
		return new Promise(function(resolve,reject){
			if(time==='end') time=S.files[file].duration-5;
			
			var filename =  S.files[file].path;
			
			// Consider file quality
			if(S.files[file].quality > 0) filename = filename.replace(/\d+\$/,Math.min(S.files[file].quality, quality) + '$');
			
			// Change the file if it'd be a new one
			// (we have to use dataset because the real src gets tweaked by the browser to be an absolute path)
			if(M.audio.dataset.filename !== filename) M.audio.dataset.filename = M.audio.src = filename;
			
			M.audio.currentTime=time;
			
			// If we're not paused, play
			if(!S.paused) M.play();
			
			resolve({file:file,time:time});
		});
	}
	
	M.displaySubtitles=function(){
		if(subtitles===null || !S.subtitlesAvailable[subtitles][M.currentFile]){
			M.subtitles.style.display='none';
			return;
		}
		
		var phrases=S.subtitlesAvailable[subtitles][M.currentFile];
		var keys=Object.keys(phrases);
		for(var i=0;i<keys.length;i++){
			
			// Break if we're before the start- all next subtitles will be past too
			if(M.currentTime<timeToSeconds(phrases[keys[i]].start)) break;
			
			// Continue if we're after the end
			if(M.currentTime>timeToSeconds(phrases[keys[i]].end)) continue;
			
			M.subtitles.innerHTML=phrases[keys[i]].content;
			M.subtitles.style.display='';
			return;
		}
		
		M.subtitles.style.display='none';
	}
	
	// Allow playing videos using Showpony in iOS
	M.audio.setAttribute('playsinline','');

	// Fix for Safari not going to the right time
	M.audio.addEventListener('loadeddata',function(){
		M.audio.currentTime=M.currentTime;
	});

	M.audio.addEventListener('canplay',function(){
		content.classList.remove('s-loading');
		// Consider how much has already been loaded; this isn't run on first chunk loaded
		M.window.dispatchEvent(new CustomEvent('progress'));
	});

	M.audio.addEventListener('canplaythrough',function(){
		// Consider how much has already been loaded; this isn't run on first chunk loaded
		M.window.dispatchEvent(new CustomEvent('progress'));
	});

	// Buffering
	M.audio.addEventListener('progress',function(){
		var bufferedValue=[];
		var timeRanges=M.audio.buffered;
		
		for(var i=0;i<timeRanges.length;i++){
			// If it's the first value, and it's everything
			if(i===0 && timeRanges.start(0)==0 && timeRanges.end(0)==M.audio.duration){
				bufferedValue=true;
				break;
			}
			
			bufferedValue.push([timeRanges.start(i),timeRanges.end(i)]);
		}
		
		S.files[M.currentFile].buffered=bufferedValue;
		
		getTotalBuffered();
	});
	
	// When we finish playing an audio file
	M.audio.addEventListener('ended',function(){
		// Only do this if the menu isn't showing (otherwise, while we're scrubbing this can trigger)
		if(!S.paused) S.to({file:'+1'});
	});

	// On moving through time, update info and title
	M.audio.addEventListener('timeupdate',function(){
		M.currentTime=M.audio.currentTime;
		
		// Consider how much has already been loaded; this isn't run on first chunk loaded
		this.dispatchEvent(new CustomEvent('progress'));
		timeUpdate();
		S.displaySubtitles();
	});
}();