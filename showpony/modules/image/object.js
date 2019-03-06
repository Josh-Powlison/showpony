new function(){
	const M=this;
	
	M.currentTime=null;
	M.currentFile=null;
	M.file = null;
	
	M.window=document.createElement('div');
	M.window.className='m-img-window';
	M.window.dataset.filename = null;
	
	M.container=document.createElement('div');
	M.container.className='m-img-container';
	M.window.appendChild(M.container);

	M.image=document.createElement('img');
	M.image.className='m-img';
	M.container.appendChild(M.image);

	M.subtitles=document.createElement('div');
	M.subtitles.className='m-img-subtitles';
	M.container.appendChild(M.subtitles);
	
	M.regress=function(){
		// If we're not at the top of the file, scroll up
		if(M.window.scrollTop > 0){
			M.window.scrollTop -= view.clientHeight * .75;
			// M.window.scrollTop -= 10;
		}
		// Go back to the previous file otherwise
		else{
			if(file > 0) to({file:file - 1,time:'end'});
			else S.time = 0;
		}
	}
	
	M.progress = function(){
		// If we're not at the bottom, scroll down
		if(M.window.scrollTop < M.window.scrollHeight - (M.window.clientHeight * 1.07)) M.window.scrollTop += M.window.clientHeight * .75;
		// Continue to the next file otherwise
		else S.file++;
	}
	
	M.src = async function(file=0,time=0,filename){
		if(time==='end') time = M.currentTime=S.files[file].duration;
		
		// (we have to use dataset because the real src gets tweaked by the browser to be an absolute path)
		if(M.window.dataset.filename === filename){
			// Go to a scroll point dependent on time
			M.window.scrollTop = M.window.scrollHeight * (time/S.files[file].duration);
			content.classList.remove('s-loading');
			
			M.currentFile=file;
			M.currentTime=time;
			return true;
		}else{
			M.window.dataset.filename = M.image.src = filename;
			
			return new Promise((resolve,reject)=>{
				// Resolve the promise after the image loads
				M.image.onload = function(){
					S.files[file].buffered = true;
					getTotalBuffered();
					
					if(view.getBoundingClientRect().top<0) view.scrollIntoView();
					
					M.window.scrollTop=M.window.scrollHeight*(time/S.files[file].duration);
					
					content.classList.remove('s-loading');
					
					M.currentFile=file;
					M.currentTime=time;
					resolve(true);
				}
			});
		}
	}
	
	M.displaySubtitles = function(){
		if(subtitles===null || !subtitlesAvailable[subtitles][M.currentFile]){
			M.subtitles.innerHTML='';
			return;
		}
		
		M.subtitles.innerHTML='';
		
		var phrases=subtitlesAvailable[subtitles][M.currentFile];
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
		if(M.currentFile===null) return;
		
		M.currentTime=Math.round(M.window.scrollTop/M.window.scrollHeight*(S.files[M.currentFile].duration));
		timeUpdate();
	});
}()