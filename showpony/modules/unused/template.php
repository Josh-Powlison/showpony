<?php

/*
// On renaming, replace instances of the word template:
// $filetoModule settings
// templateUnhideChildren
// S.template=
*/

// You can associate this module with files based on file extension, full mime types, or partial mime types. They will be checked in that order.
$fileToModule['ext:xyz']='template';
// $fileToModule['mime:text/plain']='template';
// $fileToModule['mime:application']='template';

function templateUnhideChildren($input){
	// Unhides children of the file, if any are present. If none are, this can be kept blank.
}

?>

S.<?php echo 'template'; ?>=new function(){
	const P=this; //The media Player
	
	P.currentTime=null;
	P.currentFile=null;
	
	P.window=document.createElement('div'); //Or other element
	P.window.className='showpony-block'; //Or other class
	
	P.play=function(){
		//How the medium plays. Can remain empty
	}
	
	P.pause=function(){
		//How the medium pauses. Can remain empty
	}
	
	//What happens when the user activates story input (clicking, spacebar, etc)
	P.input=function(){
		S.toggle(); //Toggles the menu
	}
	
	//Update the time in the current file. May happen automatically, on scrolling, etc
	P.timeUpdate=function(time=0){
		P.currentTime=P.window.currentTime=time;
	}
	
	P.src=function(file=0,time=0){
		return new Promise(function(resolve,reject){
			//Change the file if it'd be a new one
			if(P.currentFile!==file){
				var filePath=S.files[file].path;
			}
			
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
			//Add them in
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
}();