S.modules.<?php echo 'image'; ?>=new function(){
	const M=this;
	
	M.currentTime=null;
	M.currentFile=null;
	
	M.window=document.createElement('div');
	M.window.className='m-img-window';
	
	M.container=document.createElement('div');
	M.container.className='m-img-container';
	M.window.appendChild(M.container);

	M.image=document.createElement('img');
	M.image.className='m-img';
	M.container.appendChild(M.image);

	M.subtitles=document.createElement('div');
	M.subtitles.className='m-img-subtitles';
	M.container.appendChild(M.subtitles);
	
	M.play=function(){
		
	}
	
	M.pause=function(){
		
	}
	
	M.regress=function(){
		if(S.currentFile>0) S.to({file:'-1',time:'end'});
		else S.to({time:0});
	}
	
	M.progress=function(){
		S.to({file:'+1'});
	}
	
	M.src=function(file=0,time=0){
		return new Promise(function(resolve,reject){
			if(time==='end') time=M.currentTime=S.files[file].duration;
			
			if(M.currentFile!==file){
				M.image.src=S.files[file].path;
			}
			else{
				content.classList.remove('s-loading');
				// Go to a scroll point dependent on time
				M.window.scrollTop=M.window.scrollHeight*(time/S.files[file].duration);
			}
			
			resolve({file:file,time:time});
		});
	}
	
	M.displaySubtitles=function(){
		if(S.currentSubtitles===null){
			M.subtitles.innerHTML='';
			return;
		}
		
		M.subtitles.dataset.file=M.currentFile;
		M.subtitles.innerHTML='';
		
		var phrases=S.subtitles[S.currentSubtitles][M.currentFile];
		var keys=Object.keys(phrases);
		for(var i=0;i<keys.length;i++){
			if(phrases[keys[i]].content==='') continue;
			
			var block=document.createElement('p');
			block.className='m-img-subtitle';
			
			block.innerHTML=phrases[keys[i]].content;
			
			var start=phrases[keys[i]].start.split(',');
			var end=phrases[keys[i]].end.split(',');
			
			block.style.left=start[0]+'%';
			block.style.right=(100-end[0])+'%';
			block.style.top=start[1]+'%';
			block.style.bottom=(100-end[1])+'%';
			
			M.subtitles.appendChild(block);
		}
	}
	
	// Update time on scrolling
	M.window.addEventListener('scroll',function(){
		M.currentTime=Math.round(M.window.scrollTop/M.window.scrollHeight*(S.files[M.currentFile].duration));
		timeUpdate();
	});
	
	/// BUFFERING ///
	M.image.addEventListener('load',function(){
		S.files[M.currentFile].buffered=true;
		getTotalBuffered();
		
		if(S.window.getBoundingClientRect().top<0) S.window.scrollIntoView();
		
		M.window.scrollTop=M.window.scrollHeight*(M.currentTime/S.files[M.currentFile].duration);
		S.displaySubtitles();
		content.classList.remove('s-loading');
	});
}();