<?php

// $fileToModule['mime:image']='image';

function imageUnhideChildren($input){
	// No children
}

?>

S.<?php echo 'image'; ?>=new function(){
	const M=this;
	
	M.currentTime=null;
	M.currentFile=null;
	
	M.window=document.createElement('img');
	M.window.className='showpony-block';
	
	M.play=function(){
		
	}
	
	M.pause=function(){
		
	}
	
	M.input=function(){
		S.to({file:'+1'});
	}
	
	M.timeUpdate=function(time=0){
		M.currentTime=time;
	}
	
	M.src=function(file=0,time=0){
		return new Promise(function(resolve,reject){
			if(M.currentFile!==file) M.window.src=S.files[file].path;
			else content.classList.remove('showpony-loading');
			
			resolve();
		});
	}
	
	M.displaySubtitles=function(){
		if(S.currentSubtitles===null){
			subtitles.innerHTML='';
			return;
		}
		
		if(S.files[M.currentFile].subtitles){
			subtitles.innerHTML='';
			
			subtitles.width=M.window.naturalWidth;
			subtitles.height=M.window.naturalHeight;
			
			var height=content.getBoundingClientRect().height;
			var width=content.getBoundingClientRect().width;
			var shrinkPercent=height/M.window.naturalHeight;
			
			var newHeight=M.window.naturalHeight*shrinkPercent;
			var newWidth=M.window.naturalHeight*shrinkPercent;

			subtitles.style.height=newHeight+'px';
			subtitles.style.width=newWidth+'px';
			
			subtitles.style.left=(width-newWidth)/2+'px';
			
			var lines=S.files[M.currentFile].subtitles.split(/\s{3,}/g);
			for(let i=0;i<lines.length;i++){
				var block=document.createElement('p');
				block.className='showpony-sub';
				
				var input=lines[i].split(/\n/);
				block.innerHTML=input[1];
				
				input=input[0].match(/(\d|\.)+/g);
				
				block.style.left=input[0]+'%';
				block.style.width=input[2]-input[0]+'%';
				block.style.top=input[1]+'%';
				block.style.height=input[3]-input[1]+'%';
				
				subtitles.appendChild(block);
			}
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
		
		if(S.window.getBoundingClientRect().top<0) S.window.scrollIntoView();
	});
}();