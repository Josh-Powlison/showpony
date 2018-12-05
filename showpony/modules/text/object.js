S.modules.text=new function(){
	const M=this;
	
	M.currentTime=null;
	M.currentFile=null;
	
	M.window=document.createElement('div');
	M.window.className='showpony-text';
	
	var prevButton=document.createElement('button');
	prevButton.className='showpony-text-prev';
	prevButton.addEventListener('click',function(){
		var file=M.currentFile-1;
		var time=0;
		if(file>=0) time=S.files[file].duration-1;
		S.to({file:file,time:time});
	});
	
	var nextButton=document.createElement('button');
	nextButton.className='showpony-text-next';
	nextButton.addEventListener('click',function(){
		var file=M.currentFile+1;
		S.to({file:file});
	});
	
	M.play=function(){}
	
	M.pause=function(){}
	
	M.regress=function(){
		S.to({file:'-1'});
	}
	
	M.progress=function(){
		S.to({file:'+1'});
	}
	
	M.timeUpdate=function(time=0){
		M.currentTime=time;
	}
	
	M.src=function(file=0,time=0){
		return new Promise(function(resolve,reject){
			var src=S.files[file].path;
			
			// If this is the current file
			if(M.currentFile===file){
				M.window.scrollTop=M.window.scrollHeight*(time/S.files[file].duration);
				content.classList.remove('s-loading');
				resolve();
			}
			
			fetch(src,{credentials:'include'})
			.then(response=>{
				return response.text();
			})
			.then(text=>{
				
				// Put in the text
				M.window.innerHTML=text;
				
				// Put in the buttons (as needed)
				if(file>0) M.window.insertBefore(prevButton,M.window.firstChild);
				if(file<S.files.length-1) M.window.appendChild(nextButton);
				
				// Scroll to spot
				M.window.scrollTop=M.window.scrollHeight*(time/S.files[file].duration);
				
				// Stop loading
				content.classList.remove('s-loading');
				
				if(S.files[file].buffered!==true){
					S.files[file].buffered=true;
					getTotalBuffered();
				}
				
				if(S.window.getBoundingClientRect().top<0) S.window.scrollIntoView();
				
				resolve();
			});
		});
	}
	
	M.displaySubtitles=function(){
		/// NOT YET! OR PROBABLY EVER... this is text already, after all.
	}
	
	// Update time on scrolling
	M.window.addEventListener('scroll',function(){
		timeUpdate(Math.round(M.window.scrollTop/M.window.scrollHeight*(S.files[M.currentFile].duration)));
	});
}();