new function(){
	const M=this;
	
	M.currentTime=null;
	M.currentFile=null;
	M.file = null;
	
	M.window=document.createElement('div');
	M.window.className='m-audio-window';
	M.window.dataset.filename = null;
	
	M.styles = document.createElement('style');
	M.styles.innerHTML = `<?php
		addslashes(readfile(__DIR__.'/styles.css'));
	?>`;
	
	M.audio=document.createElement('audio');
	M.audio.className='m-audio';
	M.audio.disableRemotePlayback = true;
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
		if(M.currentTime<5) to({file:file - 1,time:'end'});
		else S.time -= 5;
	}
	
	M.progress=function(){
		if(M.currentTime>S.files[M.currentFile].duration-5) S.file++;
		else S.time += 5;
	}
	
	M.src = async function(file=0,time=0,filename){
		if(time === 'end') time = S.files[file].duration-5;
		
		// (we have to use dataset because the real src gets tweaked by the browser to be an absolute path)
		if(M.window.dataset.filename !== filename){
			loadedData = false;
			M.window.dataset.filename = M.audio.src = filename;
		}
		
		M.audio.currentTime=time;
		M.currentTime=time;
		M.currentFile=file;
		
		// If we're not paused, play
		if(!paused) M.play();
		
		return true;
	}
	
	M.displaySubtitles=function(){
		if(subtitles===null || !subtitlesAvailable[subtitles][M.currentFile]){
			M.subtitles.style.display='none';
			return;
		}
		
		var phrases=subtitlesAvailable[subtitles][M.currentFile];
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

	var loadedData = false;
	// Fix for Safari not going to the right time
	M.audio.addEventListener('loadeddata',function(){
		loadedData = true;
		M.audio.currentTime = M.currentTime;
	});

	M.audio.addEventListener('canplay',function(){
		content.classList.remove('loading');
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
		if(!paused) S.file++;
	});

	// On moving through time, update info and title
	M.audio.addEventListener('timeupdate',function(){
		if(loadedData) M.currentTime = M.audio.currentTime;
		
		timeUpdate();
		S.displaySubtitles();
		// Consider how much has already been loaded; this isn't run on first chunk loaded
		this.dispatchEvent(new CustomEvent('progress'));
	});
}()