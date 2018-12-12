S.modules.template=new function(){
	const M=this;
	
	M.currentTime=null;
	M.currentFile=null;
	
	M.window=document.createElement('div'); // Or other element
	M.window.className='m-temp'; // Or other class
	
	M.play=function(){
		// How the module plays. Can remain empty
	}
	
	M.pause=function(){
		// How the module pauses. Can remain empty
	}
	
	M.regress=function(){
		// How the medium pauses. Can remain empty
	}
	
	M.progress=function(){
		
	}
	
	// Update the time in the current file. May happen automatically, on scrolling, etc
	M.timeUpdate=function(time=0){
		M.currentTime=time;
	}
	
	M.src=function(file=0,time=0){
		return new Promise(function(resolve,reject){
			// Change the file if it'd be a new one
			if(M.currentFile!==file){
				var filePath=S.files[file].path;
			}
			
			// If we're not paused, play
			if(!S.paused) M.play();
			
			resolve();
		});
	}
	
	M.displaySubtitles=function(){
		// Add them in to the element, as you want them to be displayed
		// subtitles.innerHTML=S.files[M.currentFile].subtitles;
	}
}();