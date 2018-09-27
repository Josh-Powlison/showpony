
///////////////////////////////////////
/////////////////TEXT//////////////////
///////////////////////////////////////

function makeText(){
	const P=this;
	
	P.currentTime=null;
	P.currentFile=null;
	
	P.window=document.createElement('div');
	P.window.className='showpony-block';
	
	P.play=function(){}
	
	P.pause=function(){}
	
	P.input=function(){
		//S.to({file:'+1'});
	}
	
	P.timeUpdate=function(time=0){
		P.currentTime=time;
	}
	
	P.src=function(file=0,time=0){
		return new Promise(function(resolve,reject){
			var src=S.files[file].path;
			
			//If this is the current file
			if(P.currentFile===file){
				pageTurn.scrollTop=pageTurn.scrollHeight*(P.currentTime/S.files[P.currentFile].duration);
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
				pageTurn.scrollTop=pageTurn.scrollHeight*(P.currentTime/S.files[file].duration);
				
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
	
	P.displaySubtitles=function(){
		if(S.currentSubtitles===null){
			subtitles.innerHTML='';
			return;
		}
		
		if(S.files[P.currentFile].subtitles){
			///NOT YET! OR PROBABLY EVER... this is text already, after all.
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
	
	///BUFFERING///
	P.window.addEventListener('load',function(){
		content.classList.remove('showpony-loading');
		S.files[P.currentFile].buffered=true;
		getTotalBuffered();
	});
};

S.text=new makeText();