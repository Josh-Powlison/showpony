S.modules.text=new function(){
	const M=this;
	
	M.currentTime=null;
	M.currentFile=null;
	M.src = null;
	
	M.window=document.createElement('div');
	M.window.className='showpony-text';
	
	M.play=function(){}
	
	M.pause=function(){}
	
	M.regress=function(){
		// If we're not at the top of the file, scroll up
		if(M.window.scrollTop > 0){
			M.window.scrollTop -= S.window.clientHeight * .75;
			// M.window.scrollTop -= 10;
		}
		// Go back to the previous file otherwise
		else{
			if(S.currentFile>0) S.to({file:'-1',time:'end'});
			else S.to({time:0});
		}
	}
	
	M.progress=function(){
		// If we're not at the bottom, scroll down
		if(M.window.scrollTop < M.window.scrollHeight - (M.window.clientHeight * 1.07)) M.window.scrollTop += M.window.clientHeight * .75;
		// Continue to the next file otherwise
		else S.to({file:'+1'});
	}
	
	M.src=function(file=0,time=0){
		return new Promise(function(resolve,reject){
			if(time==='end') time=S.files[file].duration;
			
			var filename =  S.files[file].path;
			
			// Consider file quality
			if(S.files[file].quality > 0) filename = filename.replace(/\d+\$/,Math.min(S.files[file].quality, S.currentQuality) + '$');
			
			// If this is the current file
			if(M.src === filename){
				M.window.scrollTop=M.window.scrollHeight*(time/S.files[file].duration);
				content.classList.remove('s-loading');
				resolve({time:time,file:file});
				return;
			}
			
			M.src = filename;
			
			fetch(filename,{credentials:'include'})
			.then(response=>{
				return response.text();
			})
			.then(text=>{
				
				// Put in the text
				M.window.innerHTML=text;
				
				// Scroll to spot
				M.window.scrollTop=M.window.scrollHeight*(time/S.files[file].duration);
				
				// Stop loading
				content.classList.remove('s-loading');
				
				if(S.files[file].buffered!==true){
					S.files[file].buffered=true;
					getTotalBuffered();
				}
				
				if(S.window.getBoundingClientRect().top<0) S.window.scrollIntoView();
				
				resolve({time:time,file:file});
			});
		});
	}
	
	M.displaySubtitles=function(){
		/// NOT YET! OR PROBABLY EVER... this is text already, after all.
	}
	
	// Update time on scrolling
	M.window.addEventListener('scroll',function(){
		M.currentTime=Math.round(M.window.scrollTop/M.window.scrollHeight*(S.files[M.currentFile].duration));
		timeUpdate();
	});
}();