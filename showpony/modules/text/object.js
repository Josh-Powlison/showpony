new function(){
	const M=this;
	
	M.currentTime=null;
	M.currentFile=null;
	M.file = null;
	
	M.window=document.createElement('div');
	M.window.className='m-text';
	M.window.dataset.filename = null;
	
	M.regress=function(){
		// If we're not at the top of the file, scroll up
		if(M.window.scrollTop > 0){
			M.window.scrollTop -= S.window.clientHeight * .75;
			// M.window.scrollTop -= 10;
		}
		// Go back to the previous file otherwise
		else{
			if(file > 0) S.to({file:file - 1,time:'end'});
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
		if(time==='end') time = file.duration;
		
		// If this is the current file
		if(M.window.dataset.filename === filename){
			M.window.scrollTop=M.window.scrollHeight*(time/S.files[file].duration);
			content.classList.remove('s-loading');
			
			M.currentTime = time;
			M.currentFile = file;
			return true;
		}
		
		M.window.dataset.filename = filename;
		
		return fetch(filename,{credentials:'include'})
		.then(response=>{return response.text();})
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
			
			M.currentTime = time;
			M.currentFile = file;
			return true;
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
}()