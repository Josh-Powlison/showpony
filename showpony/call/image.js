///////////////////////////////////////
/////////////////IMAGE/////////////////
///////////////////////////////////////

function makeImage(){
	const P=this;
	
	P.currentTime=null;
	P.currentFile=null;
	
	P.window=document.createElement('img');
	P.window.className='showpony-block';
	
	P.play=function(){
		
	}
	
	P.pause=function(){
		
	}
	
	P.input=function(){
		S.to({file:'+1'});
	}
	
	P.timeUpdate=function(time=0){
		P.currentTime=time;
	}
	
	P.src=function(file=0,time=0){
		return new Promise(function(resolve,reject){
			if(P.currentFile!==file) P.window.src=S.files[file].path;
			else content.classList.remove('showpony-loading');
			
			resolve();
		});
	}
	
	P.displaySubtitles=function(){
		if(S.currentSubtitles===null){
			subtitles.innerHTML='';
			return;
		}
		
		if(S.files[P.currentFile].subtitles){
			subtitles.innerHTML='';
			
			subtitles.width=P.window.naturalWidth;
			subtitles.height=P.window.naturalHeight;
			
			var height=content.getBoundingClientRect().height;
			var width=content.getBoundingClientRect().width;
			var shrinkPercent=height/P.window.naturalHeight;
			
			var newHeight=P.window.naturalHeight*shrinkPercent;
			var newWidth=P.window.naturalHeight*shrinkPercent;

			subtitles.style.height=newHeight+'px';
			subtitles.style.width=newWidth+'px';
			
			subtitles.style.left=(width-newWidth)/2+'px';
			
			var lines=S.files[P.currentFile].subtitles.split(/\s{3,}/g);
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
			fetch(S.subtitles[S.currentSubtitles]+S.files[P.currentFile].title+'.vtt')
			.then(response=>{return response.text();})
			.then(text=>{
				S.files[P.currentFile].subtitles=text;
				S[currentType].displaySubtitles();
			});
		}
	}
	
	///BUFFERING///
	P.window.addEventListener('load',function(){
		content.classList.remove('showpony-loading');
		S.files[P.currentFile].buffered=true;
		getTotalBuffered();
		
		if(S.window.getBoundingClientRect().top<0) S.window.scrollIntoView();
	});
};

S.image=new makeImage();