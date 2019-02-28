new function(){
	const M=this;
	
	M.currentTime=null;
	M.currentFile=null;
	
	M.window=document.createElement('div');
	M.window.className='m-video-window';
	
	M.video=document.createElement('video');
	M.video.className='m-video';
	M.video.disableRemotePlayback = true;
	M.video.dataset.filename = null;
	M.window.appendChild(M.video);
	
	M.subtitles=document.createElement('p');
	M.subtitles.className='m-video-subtitles';
	M.window.appendChild(M.subtitles);
	
	M.play=function(){
		M.video.play();
	}
	
	M.pause=function(){
		M.video.pause();
	}
	
	M.regress=function(){
		if(M.currentTime<5) S.to({file:file - 1,time:'end'});
		else S.time -= 5;
	}
	
	M.progress=function(){
		if(M.currentTime>S.files[M.currentFile].duration-5) S.file++;
		else S.time += 5;
	}
	
	M.src=function(file=0,time=0,filename){
		return new Promise(function(resolve,reject){
			if(time === 'end') time = S.files[file].duration - 5;
			
			// (we have to use dataset because the real src gets tweaked by the browser to be an absolute path)
			if(M.video.dataset.filename !== filename) M.video.dataset.filename = M.video.src = filename;
			
			M.video.currentTime = time;
			
			// If we're not paused, play
			if(!paused) M.play();
			
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
			
			// Break if we're before the start- all next subtitles wlil be past too
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
	M.video.setAttribute('playsinline','');

	// Fix for Safari not going to the right time
	M.video.addEventListener('loadeddata',function(){
		M.video.currentTime=M.currentTime;
	});

	M.video.addEventListener('canplay',function(){
		content.classList.remove('s-loading');
		// Consider how much has already been loaded; this isn't run on first chunk loaded
		M.window.dispatchEvent(new CustomEvent('progress'));
	});

	M.video.addEventListener('canplaythrough',function(){
		// Consider how much has already been loaded; this isn't run on first chunk loaded
		M.window.dispatchEvent(new CustomEvent('progress'));
	});

	// Buffering
	M.video.addEventListener('progress',function(){
		var bufferedValue=[];
		var timeRanges=M.video.buffered;
		
		for(var i=0;i<timeRanges.length;i++){
			// If it's the first value, and it's everything
			if(i===0 && timeRanges.start(0)==0 && timeRanges.end(0)==M.video.duration){
				bufferedValue=true;
				break;
			}
			
			bufferedValue.push([timeRanges.start(i),timeRanges.end(i)]);
		}
		
		S.files[M.currentFile].buffered=bufferedValue;
		
		getTotalBuffered();
	});
	
	// When we finish playing a video or audio file
	M.video.addEventListener('ended',function(){
		// Only do this if the menu isn't showing (otherwise, while we're scrubbing this can trigger)
		if(!paused) S.time++;
	});

	// On moving through time, update info and title
	M.video.addEventListener('timeupdate',function(){
		M.currentTime=M.video.currentTime;
		
		timeUpdate();
		S.displaySubtitles();
		// Consider how much has already been loaded; this isn't run on first chunk loaded
		this.dispatchEvent(new CustomEvent('progress'));
	});
}()