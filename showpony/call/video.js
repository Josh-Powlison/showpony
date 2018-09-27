///////////////////////////////////////
/////////////////VIDEO/////////////////
///////////////////////////////////////

function makeVideo(){
	const P=this;
	
	P.currentTime=null;
	P.currentFile=null;
	
	P.window=document.createElement('video');
	P.window.className='showpony-block';
	
	P.play=function(){
		P.window.play();
	}
	
	P.pause=function(){
		P.window.pause();
	}
	
	P.input=function(){
		S.toggle();
	}
	
	P.timeUpdate=function(time=0){
		P.currentTime=P.window.currentTime=time;
	}
	
	P.goToTime=0;
	
	P.src=function(file=0,time=0){
		return new Promise(function(resolve,reject){
			//Change the file if it'd be a new one
			if(P.currentFile!==file) P.window.src=S.files[file].path;
			
			//If we're not paused, play
			if(!S.paused) P.play();
			
			resolve();
		});
	}
	
	P.displaySubtitles=function(){
		if(S.currentSubtitles===null){
			subtitles.innerHTML='';
			return;
		}
		
		if(S.files[P.currentFile].subtitles){
			subtitles.style.cssText=null;
			var currentTime=P.window.currentTime;
			
			var lines=S.files[P.currentFile].subtitles.match(/\b.+/ig);
			
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
			fetch(S.subtitles[S.currentSubtitles]+S.files[P.currentFile].title+'.vtt')
			.then(response=>{return response.text();})
			.then(text=>{
				S.files[P.currentFile].subtitles=text;
				P.displaySubtitles();
			});
		}
	}
	
	//Allow playing videos using Showpony in iOS
	P.window.setAttribute('playsinline','');

	//Fix for Safari not going to the right time
	P.window.addEventListener('loadeddata',function(){
		P.currentTime=P.window.currentTime=P.goToTime;
	});

	P.window.addEventListener('canplay',function(){
		content.classList.remove('showpony-loading');
		//Consider how much has already been loaded; this isn't run on first chunk loaded
		P.window.dispatchEvent(new CustomEvent('progress'));
	});

	P.window.addEventListener('canplaythrough',function(){
		//Consider how much has already been loaded; this isn't run on first chunk loaded
		P.window.dispatchEvent(new CustomEvent('progress'));
	});

	//Buffering
	P.window.addEventListener('progress',function(){
		var bufferedValue=[];
		var timeRanges=P.window.buffered;
		
		for(var i=0;i<timeRanges.length;i++){
			//If it's the first value, and it's everything
			if(i===0 && timeRanges.start(0)==0 && timeRanges.end(0)==P.window.duration){
				bufferedValue=true;
				break;
			}
			
			bufferedValue.push([timeRanges.start(i),timeRanges.end(i)]);
		}
		
		S.files[P.currentFile].buffered=bufferedValue;
		
		getTotalBuffered();
	});
	
	//When we finish playing a video or audio file
	P.window.addEventListener('ended',function(){
		//Only do this if the menu isn't showing (otherwise, while we're scrubbing this can trigger)
		if(!S.paused) S.to({file:'+1'});
	});

	//On moving through time, update info and title
	P.window.addEventListener('timeupdate',function(){
		P.currentTime=P.window.currentTime;
		
		//Consider how much has already been loaded; this isn't run on first chunk loaded
		this.dispatchEvent(new CustomEvent('progress'));
		timeUpdate();
	});
};

S.video=new makeVideo();