<?php

// $fileToModule['mime:text']='text';

function textUnhideChildren($input){
	// text includes files as paths
	$handle=fopen($input,'r');

	while(($line=fgets($handle))!==false){
		// Remove line breaks on line
		$line=trim($line,"\r\n");
		
		// src="file.ext"
		// href="file.ext"
		// url("file.ext")
		
		// Go through every regex and look for matches in the line
		$regexChecks=[
			'/(src|href)="(\/|https?:\/\/[^\/]+\/)?([^"]+)"/i'
			,"/(src|href)='(\/|https?:\/\/[^\/]+\/)?([^']+)'/i"
			,'/(url)\(["\']?(\/|https?:\/\/[^\/]+\/)?([^)]+)["\']\)?/i'
		];
		
		foreach($regexChecks as $regex){
			if(preg_match_all($regex,$line,$matches,PREG_SET_ORDER)){
				foreach($matches as $match){
					
					// Absolute path or from root
					if($match[2][0]==='/' || preg_match('/https?:\/\//',$match[2])){
						// This will not work with subdomains or redirects in Apache; it assumes that the current website's root is the server's root
						
						// If a file doesn't exist, it simply won't be unhidden (if it was hidden in the first place). The script will continue to run.
						
						unhideFile($_SERVER['DOCUMENT_ROOT'].'/'.$match[3]);
					}
					// Relative path
					else{
						unhideFile($parentDir.$match[3]);
					}
				}
			}
		}
	}
		
	fclose($handle);
}

?>

S.modules.<?php echo 'text'; ?>=new function(){
	const M=this;
	
	M.currentTime=null;
	M.currentFile=null;
	
	M.window=document.createElement('div');
	M.window.className='showpony-block';
	
	M.play=function(){}
	
	M.pause=function(){}
	
	M.input=function(){
		//S.to({file:'+1'});
	}
	
	M.timeUpdate=function(time=0){
		M.currentTime=time;
	}
	
	M.src=function(file=0,time=0){
		return new Promise(function(resolve,reject){
			var src=S.files[file].path;
			
			//If this is the current file
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
				
				//Put in the text
				pageTurn.innerHTML=text;
				
				//Scroll to spot
				pageTurn.scrollTop=pageTurn.scrollHeight*(M.currentTime/S.files[file].duration);
				
				//Stop loading
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
		if(S.currentSubtitles===null){
			subtitles.innerHTML='';
			return;
		}
		
		if(S.files[M.currentFile].subtitles){
			///NOT YET! OR PROBABLY EVER... this is text already, after all.
		}else{
			//If don't have the file
			fetch(S.subtitles[S.currentSubtitles]+S.files[M.currentFile].title+'.vtt')
			.then(response=>{return response.text();})
			.then(text=>{
				S.files[M.currentFile].subtitles=text;
				M.displaySubtitles();
			});
		}
	}
	
	///BUFFERING///
	M.window.addEventListener('load',function(){
		content.classList.remove('showpony-loading');
		S.files[M.currentFile].buffered=true;
		getTotalBuffered();
	});
}();
