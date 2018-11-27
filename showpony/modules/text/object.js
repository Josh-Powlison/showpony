S.modules.text=new function(){
	const M=this;
	
	M.currentTime=null;
	M.currentFile=null;
	
	M.window=document.createElement('div');
	M.window.className='showpony-block';
	
	M.play=function(){}
	
	M.pause=function(){}
	
	M.input=function(){
		// S.to({file:'+1'});
	}
	
	M.timeUpdate=function(time=0){
		M.currentTime=time;
	}
	
	M.src=function(file=0,time=0){
		return new Promise(function(resolve,reject){
			var src=S.files[file].path;
			
			// If this is the current file
			if(M.currentFile===file){
				pageTurn.scrollTop=pageTurn.scrollHeight*(M.currentTime/S.files[M.currentFile].duration);
				content.classList.remove('showpony-loading');
				resolve();
			}
			
			fetch(src,{credentials:'include'})
			.then(response=>{
				return response.text();
			})
			.then(text=>{
				
				// Put in the text
				pageTurn.innerHTML=text;
				
				// Scroll to spot
				pageTurn.scrollTop=pageTurn.scrollHeight*(M.currentTime/S.files[file].duration);
				
				// Stop loading
				content.classList.remove('showpony-loading');
				
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
	
	/// BUFFERING ///
	M.window.addEventListener('load',function(){
		content.classList.remove('showpony-loading');
		S.files[M.currentFile].buffered=true;
		getTotalBuffered();
	});
}();