S.modules.<?php echo 'image'; ?>=new function(){
	const M=this;
	
	M.currentTime=null;
	M.currentFile=null;
	
	M.window=document.createElement('div');
	M.window.className='showpony-image-container';
	M.image=document.createElement('img');
	M.image.className='showpony-image';
	M.window.appendChild(M.image);
	
	M.play=function(){
		
	}
	
	M.pause=function(){
		
	}
	
	M.input=function(){
		S.to({file:'+1'});
	}
	
	M.timeUpdate=function(time=0){
		M.currentTime=time;
	}
	
	M.src=function(file=0,time=0){
		return new Promise(function(resolve,reject){
			if(M.currentFile!==file){
				M.image.src=S.files[file].path;
			}
			else content.classList.remove('showpony-loading');
			
			// Go to a scroll point dependent on time
			M.window.scrollTop=M.window.scrollHeight*(time/S.files[file].duration);
			
			resolve();
		});
	}
	
	M.displaySubtitles=function(){
		subtitles.innerHTML='';
		
		subtitles.width=M.window.naturalWidth;
		subtitles.height=M.window.naturalHeight;
		
		var height=content.getBoundingClientRect().height;
		var width=content.getBoundingClientRect().width;
		var shrinkPercent=height/M.window.naturalHeight;
		
		var newHeight=M.window.naturalHeight*shrinkPercent;
		var newWidth=M.window.naturalHeight*shrinkPercent;

		subtitles.style.height=newHeight+'px';
		subtitles.style.width=newWidth+'px';
		
		subtitles.style.left=(width-newWidth)/2+'px';
		
		var phrases=S.subtitles[S.currentSubtitles][M.currentFile];
		var keys=Object.keys(phrases);
		for(var i=0;i<keys.length;i++){
			var block=document.createElement('p');
			block.className='showpony-sub';
			
			block.innerHTML=phrases[keys[i]].content;
			
			var start=phrases[keys[i]].start.split(',');
			var end=phrases[keys[i]].end.split(',');
			
			block.style.left=start[0]+'%';
			block.style.right=(100-end[0])+'%';
			block.style.top=start[1]+'%';
			block.style.bottom=(100-end[1])+'%';
			
			subtitles.appendChild(block);
		}
	}
	
	// Update time on scrolling
	M.window.addEventListener('scroll',function(){
		timeUpdate(Math.round(M.window.scrollTop/M.window.scrollHeight*(S.files[M.currentFile].duration)));
	});
	
	/// BUFFERING ///
	M.image.addEventListener('load',function(){
		content.classList.remove('showpony-loading');
		S.files[M.currentFile].buffered=true;
		getTotalBuffered();
		
		if(S.window.getBoundingClientRect().top<0) S.window.scrollIntoView();
		
		M.window.scrollTop=M.window.scrollHeight*(M.currentTime/S.files[M.currentFile].duration);
	});
}();