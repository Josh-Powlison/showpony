S.modules.template=new function(){
	const M=this; // The media Player
	
	M.currentTime=null;
	M.currentFile=null;
	
	M.window=document.createElement('div'); // Or other element
	M.window.className='showpony-block'; // Or other class
	
	M.play=function(){
		// How the medium plays. Can remain empty
	}
	
	M.pause=function(){
		// How the medium pauses. Can remain empty
	}
	
	// What happens when the user activates story input (clicking, spacebar, etc)
	M.input=function(){
		S.toggle(); // Toggles the menu
	}
	
	// Update the time in the current file. May happen automatically, on scrolling, etc
	M.timeUpdate=function(time=0){
		M.currentTime=M.window.currentTime=time;
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