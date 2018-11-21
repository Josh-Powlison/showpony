<?php

// $fileToModule['mime:audio']='audio';

function audioUnhideChildren(){
	// Audio doesn't have children
}

?>

S.modules.<?php echo 'audio'; ?>=new function(){
	const M=this;
	
	M.currentTime=null;
	M.currentFile=null;
	
	M.window=document.createElement('audio');
	M.window.className='showpony-block';
	
	M.play=function(){
		M.window.play();
	}
	
	M.pause=function(){
		M.window.pause();
	}
	
	M.input=function(){
		S.toggle();
	}
	
	M.timeUpdate=function(time=0){
		M.currentTime=M.window.currentTime=time;
	}
	
	M.goToTime=0;
	
	M.src=function(file=0,time=0){
		return new Promise(function(resolve,reject){
			//Change the file if it'd be a new one
			if(M.currentFile!==file) M.window.src=S.files[file].path;
			
			//If we're not paused, play
			if(!S.paused) M.play();
			
			resolve();
		});
	}
	
	M.displaySubtitles=function(){
		if(S.currentSubtitles===null){
			subtitles.innerHTML='';
			return;
		}
		
		if(S.files[M.currentFile].subtitles){
			subtitles.style.cssText=null;
			var currentTime=M.window.currentTime;
			
			var lines=S.files[M.currentFile].subtitles.match(/\b.+/ig);
			
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
						
							var block=document.createElement('p');
							block.className='showpony-sub';
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
	
	//Allow playing videos using Showpony in iOS
	M.window.setAttribute('playsinline','');

	//Fix for Safari not going to the right time
	M.window.addEventListener('loadeddata',function(){
		M.currentTime=M.window.currentTime=M.goToTime;
	});

	M.window.addEventListener('canplay',function(){
		content.classList.remove('showpony-loading');
		//Consider how much has already been loaded; this isn't run on first chunk loaded
		M.window.dispatchEvent(new CustomEvent('progress'));
	});

	M.window.addEventListener('canplaythrough',function(){
		//Consider how much has already been loaded; this isn't run on first chunk loaded
		M.window.dispatchEvent(new CustomEvent('progress'));
	});

	//Buffering
	M.window.addEventListener('progress',function(){
		var bufferedValue=[];
		var timeRanges=M.window.buffered;
		
		for(var i=0;i<timeRanges.length;i++){
			//If it's the first value, and it's everything
			if(i===0 && timeRanges.start(0)==0 && timeRanges.end(0)==M.window.duration){
				bufferedValue=true;
				break;
			}
			
			bufferedValue.push([timeRanges.start(i),timeRanges.end(i)]);
		}
		
		S.files[M.currentFile].buffered=bufferedValue;
		
		getTotalBuffered();
	});
	
	//When we finish playing an audio file
	M.window.addEventListener('ended',function(){
		//Only do this if the menu isn't showing (otherwise, while we're scrubbing this can trigger)
		if(!S.paused) S.to({file:'+1'});
	});

	//On moving through time, update info and title
	M.window.addEventListener('timeupdate',function(){
		M.currentTime=M.window.currentTime;
		
		//Consider how much has already been loaded; this isn't run on first chunk loaded
		this.dispatchEvent(new CustomEvent('progress'));
		timeUpdate();
	});
}();
