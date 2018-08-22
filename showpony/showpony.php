<?php
#POST VALUES FOR TESTING#
$_POST['call']='getFiles';
$_POST['rel-path']='..';

$language='en';
$_POST['path']=$_GET['path'].'/';

#Get the query from the paths
preg_match('/[^\/]+$/',$_GET['path'],$matches);
$name=$matches[0] ?? 'story';

$infiniteScroll=false;

###PHP 7 required (and recommended, because it's MUCH faster)###

#You can disable this
session_start();

#NULL will disable admin access. Using a string will set that as the password and allow admin access.
static $password=NULL;

#Uncomment the below to show errors
//*
error_reporting(E_ALL);
ini_set('display_errors',1);
//*/

#Log out if there's no password
if(!$password) unset($_SESSION['showpony_admin']);

#Start with it based on current file
$info='file';

#Get a private file
if(!empty($_GET['get'])){
	#If we aren't logged in, block the effort
	if(empty($_SESSION['showpony_admin'])) die('You need to be logged in to access private files.');
	
	#Go to the correct directory
	chdir(($_GET['rel-path'] ?: '..').'/');
	
	#Get the file path
	$file=dirname(__FILE__,2).'/'.$_GET['get'];

	#These headers are required to scrub media (yes, you read that right)
	header('Accept-Ranges: bytes');
	header('Content-Length:'.filesize($file));
	
	readfile($file);
}else{
	#Run called functions
	
	#This object is sent to the user as JSON
	$response=[];
	
	#die(($_POST['rel-path'] ?: '..').'/'.$_POST['path']);
	#Go to the story's file directory
	chdir(($_POST['rel-path'] ?: '..').'/'.$_POST['path']);
	
	#We'll store all errors and code that's echoed, so we can send that info to the user (in a way that won't break the JSON object).
	ob_start();
	
	#If the user's seeking to log out, log them out
	if($_POST['call']==='logout') unset($_SESSION['showpony_admin']);
	
	#If we're making a call that doesn't require admin permissions, check it
	if(
		$_POST['call']==='login'
		|| $_POST['call']==='logout'
		|| $_POST['call']==='getFiles'
	){
		#On login request, attempt to log in; if it fails, let the user know
		if($_POST['call']==='login' && empty($_SESSION['showpony_admin']=$_POST['password']===$password)){
			if($password===NULL) echo 'The admin panel isn\'t accessible for this Showpony!';
			echo 'Wrong password!';
		}
		else{
			#Get files and protect others
			$response['files']=[];
			$response['success']=true;
			
			#Run through the files
			foreach(scandir($language) as &$file){
				#Ignore hidden files and folders
				if($file[0]==='.' || $file[0]==='~' || is_dir($file)) continue;

				#Ignore files that have dates in their filenames set to later
				$date;
				if(preg_match('/[^x][^(]+(?!\()\S?/',$file,$date)){ #Get the posting date from the file's name; if there is one:
					#If the time is previous to now (replacing ; with : for Windows filename compatibility)
					if(strtotime(str_replace(';',':',$date)[0].' UTC')<=time()){
						#Should be live; remove any x at the beginning of the filename
						if($file[0]=='x' && !rename($file,$file=substr($file,1))) $response['success']=false;
					}else{
						#Shouldn't be live; make sure an x is at the beginning of the filename
						if($file[0]!='x' && !rename($file,$file='x'.$file)) $response['success']=false;
						
						#Don't add hidden files if we aren't logged in
						if(empty($_SESSION['showpony_admin'])) continue;
					}
				}
				
				#There must be a better way to get some of this info...
				$fileInfo=[
					'buffered'		=>	false
					,'date'			=>	'' ?? null
					,'duration'		=>	10
					,'medium'		=>	explode('/',mime_content_type($language.'/'.$file))[0]
					,'name'			=>	$file
					,'path'			=>	$_POST['path'].$language.'/'.$file
					,'subtitles'	=>	false
					,'title'		=>	null
				];
				
				#Adjust actions based on the medium
				switch($fileInfo['medium']){
					case 'text':
						#See if it's a VN file
						switch(pathinfo($language.'/'.$file,PATHINFO_EXTENSION)){
							case 'vn':
								$fileInfo['medium']='multimedia';
								$info='time';
								break;
							default:
								$infiniteScroll=true;
								break;
						}
						break;
					case 'audio':
					case 'video':
						$info='time';
						break;
				}
				
				preg_match('/[^\s)]+(?=\.[^.]+$)/',$file,$matches);
				$fileInfo['duration']=$matches[0] ?? 10;
				
				preg_match('/([^()])+(?=\))/',$file,$matches);
				$fileInfo['title']=$matches[0] ?? null;
				
				preg_match('/\d{4}-\d\d-\d\d(\s\d\d:\d\d:\d\d)?/',$file,$matches);
				$fileInfo['date']=$matches[0] ?? null;
				
				#Add the file to the array
				$response['files'][]=$fileInfo;
			}
		}
	}
	#Admin functions: must be logged in
	else{
		#If not logged in (or admin is disabled), let the user know and don't make a call
		if(empty($_SESSION['showpony_admin'])) echo 'You aren\'t logged in or don\'t have admin set up! Try refreshing and logging in again, or check out Showpony\'s wiki on GitHub for setting up or disabling admin.';
		
		#Try renaming the file, and pass the new filename to the user
		elseif($_POST['call']==='renameFile') $response['success']=rename($_POST['name'],$response['file']=$_POST['newName']);

		#Delete the old file, upload the new file with the old name and new extension
		elseif($_POST['call']==='uploadFile') $response['success']=unlink($_POST['name']) && move_uploaded_file($_FILES['files']['tmp_name'],$response['file']=pathinfo($_POST['name'],PATHINFO_FILENAME).'.'.pathinfo($_FILES['files']['name'],PATHINFO_EXTENSION));
		
		#Create a new file for the user to edit and update. We store that new file name in a variable.
		elseif($_POST['call']==='newFile') $response['success']=file_put_contents($response['file']='x2038-01-01 20;00;00 (Untitled '.time().').html','Replace me with your new, better file!');
		
		#Delete a file
		elseif($_POST['call']==='deleteFile') $response['success']=unlink($_POST['name']);
	}
	
	#Pass any echoed statements or errors to the response object
	$response['message']=ob_get_clean();
	$response['admin']=$_SESSION['showpony_admin'] ?? false;
}

###FUNCTIONS###
function toCamelCase($input){
	return lcfirst(
		str_replace('-','',
			ucwords($input,'-')
		)
	);
}

?>'use strict';

var ShowponyFolder='showpony';
var ShowponyRunPage='';

//Load CSS if not loaded already
if(!document.querySelector('[href$="showpony/styles.css"]')){
	var styles=document.createElement('link');
	styles.rel='stylesheet';
	styles.type='text/css';
	styles.href=ShowponyFolder+'/styles.css';
	document.head.appendChild(styles);
}

function Showpony(input={}){

//If no window was passed, make one!
if(!input.window){
	document.currentScript.insertAdjacentElement('afterend',input.window=document.createElement('div'));
}

///////////////////////////////////////
///////////PUBLIC VARIABLES////////////
///////////////////////////////////////

//Engine settings
const S=this;

S.window=input.window;
S.window.className='showpony';

//Set tabIndex so it's selectable
S.window.tabIndex=0;

S.buffered=false;

S.query='<?=$name?>';
S.infiniteScroll='<?=$infiniteScroll?>';
S.subtitles=<?php
	#Get subtitles
	$subtitles=[];
	foreach(scandir('subtitles') as $file){
		#Ignore hidden files and folders
		if($file[0]==='.' || $file[0]==='~') continue;
		
		$subtitles[$file]=$_POST['path'].'subtitles/'.$file.'/';
	}
	
	echo json_encode($subtitles);
?>;

S.scrubLoad=false;
S.data={};
S.title=false;
S.dateFormat={year:'numeric',month:'numeric',day:'numeric'};
S.shortcuts='focus';
S.saveId=location.hostname.substring(0,20);
S.preloadNext=1;
S.showBuffer=true;
S.currentSubtitles=null;
S.cover=null;
S.start='last';
S.data={};

//-1 before we load
S.currentFile=-1;
S.currentTime=-1;

///////////////////////////////////////
///////////PUBLIC FUNCTIONS////////////
///////////////////////////////////////

var objectBuffer, keyframes;

//Go to another file
S.to=function(obj={}){
	content.classList.add('showpony-loading');
	
	//Does not work with relative time and relative file; must be absolute one, absolute both, or relative one
	
	obj.time=obj.time || 0;
	obj.file=obj.file || 0;
	
	if(obj.time==='end') obj.time=S.duration-10;
	if(obj.file==='last') obj.file=S.files.length-1;
	
	//Relative time
	if(/\+|\-/.test(obj.time[0])) obj.time=S.currentTime+parseFloat(obj.time);
	obj.time=Math.max(0,obj.time);

	//Look through the files for the right one
	for(obj.file;obj.file<S.files.length;obj.file++){
		if(obj.time<=S.files[obj.file].duration) break; //We've reached the file
		
		obj.time-=S.files[obj.file].duration;
	}
	
	//Relative file
	if(/\+|\-/.test(obj.file[0])) obj.file=S.currentFile+parseInt(obj.file);
	obj.file=Math.max(0,obj.file);
	
	//If we're at the end, run the readable event
	if(obj.file>=S.files.length){
		obj.file=S.files.length-1;
		obj.time=S.files[S.files.length-1].duration;
		
		//Run the event that users can read
		S.window.dispatchEvent(new CustomEvent('end'));
		
		S[currentType].src(obj.file,obj.time);
		S[currentType].pause();
		return;
	}
	
	
	Object.assign(obj,{
		reload:obj.reload || false
		,scrollToTop:obj.scrollToTop===undefined ? true : obj.scrollToTop
		,popstate:obj.popstate || false
		,replaceState:obj.replaceState || false
	});
	
	if(!S.infiniteScroll){
		S.currentFile=obj.file;
		
		//Update info on file load
		if(!obj.popstate){
			//Only allow adding to history if we aren't scrubbing
			var popstate=!obj.replaceState;
			if(scrubbing===true) popstate=false; //Only replace history if we're scrubbing right now
			
			updateInfo(popstate);
		}
		
		//Go to the top of the page (if we didn't come here by autoloading)
		if(obj.scrollToTop){
			//Check that it's not below the viewport top already
			if(S.window.getBoundingClientRect().top<0) S.window.scrollIntoView();
		}
	}else if(!content.querySelector('[data-file]')){
		S.currentFile=obj.file;
	}
	
	//Multimedia engine resets
	styles.innerHTML='';
	waitTimer.end();
	
	//Remove the continue notice
	continueNotice.remove();
	
	//Save buffer to check later
	objectBuffer={};
	
	//If switching types, do some cleanup
	if(currentType!==S.files[obj.file].medium){
		
		content.innerHTML='';
		S.objects={};
		S.lines=[];
		
		//Use either infinite text or page turn, whichever is requested
		if(S.infiniteScroll || S.files[obj.file].medium==='text'){
			content.appendChild(pageTurn);
		}else{
			//General setup
			content.appendChild(S[S.files[obj.file].medium].window);
		}
	}
	
	currentType=S.files[obj.file].medium;
	
	/*
	//If it's the same and we're using infinite scrolling
	if(S.infiniteScroll){//Scroll to the right spot
		var part=document.querySelector('[data-file="'+obj.file+'"]');
	
		pageTurn.scrollTop=part.offsetTop+part.offsetHeight*(obj.time/S.files[obj.file].duration);
	}else{ //Page turn
		
	}
	
	content.classList.remove('showpony-loading');
	}*/
	
	//Load the file
	if(S.files[obj.file].buffered===false) S.files[obj.file].buffered='buffering';
	S[currentType].src(obj.file,obj.time);
	
	//Preload upcoming files
	for(let i=obj.file;i<obj.file+S.preloadNext;i++){
		if(S.files[i].buffered===false){
			S.files[i].buffered='buffering';
			
			fetch(S.files[i].path).then(()=>{
				S.files[i].buffered=true;
				getTotalBuffered();
			});
		}
	}
}

//NEED A DIFFERENT SETUP FOR INFINITE SCROLL//
/*
/*if(currentType==='text'){
	fetch(src,{credentials:'include'})
		.then(response=>{
			return response.text();
		})
		.then(text=>{
			//Use either page infinite or page turn, whichever is requested
			if(S.infiniteScroll){
				
				//If file hasn't already been loaded, load it!
				let part=content.querySelector('[data-file="'+obj.file+'"]');
				
				//Safety check; if we're sticking, and trying to load a part that doesn't have a div, something's off and we need to get outta here!
				if(sticky!==false && !part) return;
				
				//If the part hasn't been created, it's not being automatically appended; so empty the div!
				if(!part){
					part=document.createElement('div');
					part.dataset.file=obj.file;
					pageTurn.innerHTML='';
					pageTurn.appendChild(part);
					
					S.currentFile=obj.file;
					
					//Stick to the set file and time
					sticky={file:S.currentFile,time:obj.time};
					console.log(sticky);
				}
				
				var currentPart=content.querySelector('[data-file="'+S.currentFile+'"]');
				var addScroll=pageTurn.scrollTop-currentPart.offsetTop;
				
				if(!part.innerHTML){
					//If adding a file in normally, just add it in
					part.innerHTML=text;
				
					pageTurn.scrollTop=currentPart.offsetTop+addScroll;
				}else{
					//Scroll to spot for file
					pageTurn.scrollTop=part.offsetTop+(obj.time/S.files[obj.file].duration)*part.offsetHeight;
				}
				
				if(sticky!==false){
					var stickyPart=content.querySelector('[data-file="'+sticky.file+'"]');
					
					pageTurn.scrollTop=stickyPart.offsetTop+(sticky.time/S.files[sticky.file].duration)*stickyPart.offsetHeight;
					
					pageTurn.dispatchEvent(new CustomEvent('scroll'));
				}
				
				content.classList.remove('showpony-loading');
				
			}else{ //Page turning
				//Put in the text
				pageTurn.innerHTML=text;
				
				//Scroll to spot
				pageTurn.scrollTop=pageTurn.scrollHeight*(obj.time/S.files[obj.file].duration);
				
				//Stop loading
				content.classList.remove('showpony-loading');
			}
			
			if(S.files[obj.file].buffered!==true){
				S.files[obj.file].buffered=true;
				getTotalBuffered();
			}
		})
		.catch((error)=>{
			alert('329: '+error);
			console.log(error);
		})
	;
}else{
//}
*/

//Toggle the menu
S.menu=function(event=null,action=false){
	//We can cancel moving the bar outside of the overlay, but we can't do anything else.
	//Exit if we're not targeting the overlay.
	if(event && event.target!==overlay) return;
	
	//If a cover exists, hide it rather than playing/pausing
	if(typeof(action)==='undefined' || action==='play'){
		console.log(cover);
		if(cover){
			cover.dispatchEvent(new CustomEvent('click'));
			return;
		}
	}
	
	//Allow playing and pausing, but return if either's already done
	if(
		action &&
		((S.window.classList.contains('showpony-paused') && action=='pause')
		||
		(!S.window.classList.contains('showpony-paused') && action=='play'))
	) return;
	
	else if(currentType!==null) //If we aren't moving the bar
	{
		//On toggling classes, returns 'true' if just added
		if(S.window.classList.toggle('showpony-paused')){
			//Pause media
			S[currentType].pause();
		}else{
			//Play media
			S[currentType].play();
		}
	}
	
	//Send an event when toggling the menu
	S.window.dispatchEvent(
		new CustomEvent('menu'
		,{detail:{
			open:(
				S.window.classList.contains('showpony-paused') ? true
				: false
			)
		}})
	);
};

var pos=0;

//Handles starting, running, and ending scrubbing
function userScrub(event=null,start=false){
	var input;
	
	//General events
	if(isNaN(event)){
		//Mouse and touch work slightly differently
		input=event.changedTouches ? 'touch' : 'cursor';
		pos=input==='touch' ? event.changedTouches[0].clientX : event.clientX;
	//Relative scrubbing
	}else{
		input='joystick';
		pos=progress.getBoundingClientRect().left+progress.getBoundingClientRect().width/2+event*5;
	}
	
	if(start){
		if(scrubbing===false){
			if(input==='touch') scrubbing=pos;
			else return;
		}
			
		//You have to swipe farther than you move the cursor to adjust the position
		if(scrubbing!==true){
			if(input==='joystick' || Math.abs(scrubbing-pos)>screen.width/(input==='touch' ? 20 : 100)){ 
				scrubbing=true;
				
				//On starting to scrub, we save a bookmark of where we were- kinda weird, but this allows us to return later.
				if(S.scrubLoad){
					//Add a new state on releasing
					updateInfo(true);
				}
			}
			else return;
		}
		
		//Don't want the users to accidentally swipe to another page!
		if(input==='touch') event.preventDefault();
		
		scrub(
			(pos-S.window.getBoundingClientRect().left)
			/
			(S.window.getBoundingClientRect().width)
		);
	}else{
		//Drag on the menu to go to any part
		
		if(scrubbing===true){
			scrubbing=false;
		
			//If we don't preload while scrubbing, load the file now that we've stopped scrubbing
			if(S.scrubLoad===false){
				//Load the file our pointer's on
				scrub(
					(pos-S.window.getBoundingClientRect().left)
					/
					(S.window.getBoundingClientRect().width)
				);
				
			}
			
			return true; //Exit the function
		}
		
		//scrubbing needs to be set to false here too; either way it's false, but we need to allow the overlay to update above, so we set it to false earlier too.
		scrubbing=false;
	}
}

//Toggle fullscreen
S.fullscreen=function(type='toggle'){
	//Get fullscreen type
	var browser=S.window.requestFullscreen ?
			{
				element:'fullscreenElement'
				,request:'requestFullscreen'
				,exit:'exitFullscreen'
			}
		: S.window.webkitRequestFullscreen ?
			{
				element:'webkitFullscreenElement'
				,request:'webkitRequestFullscreen'
				,exit:'webkitExitFullscreen'
			}
		: S.window.mozRequestFullScreen ?
			{
				element:'mozFullScreenElement'
				,request:'mozRequestFullScreen'
				,exit:'mozCancelFullScreen'
			}
		: false
	;
	
	//If a fullscreen-supporting browser wasn't found, use our rigged version
	if(!browser){
		if(!type || type=='toggle'){
			if(S.window.classList.contains('showpony-fullscreen-alt')) type='exit';
			else type='request';
		}
		
		if(type=='request'){
			S.window.classList.add('showpony-fullscreen-alt');
			document.getElementsByTagName('html')[0].classList.add('showpony-fullscreen-control');
			
			S.window.dataset.prevz=S.window.style.zIndex || 'initial';
			
			//From: https://stackoverflow.com/questions/1118198/how-can-you-figure-out-the-highest-z-index-in-your-document
			S.window.style.zIndex=Array.from(document.querySelectorAll('body *'))
			   .map(a => parseFloat(window.getComputedStyle(a).zIndex))
			   .filter(a => !isNaN(a))
			   .sort((a,b)=>a-b)
			   .pop()+1;
		}else{
			S.window.classList.remove('showpony-fullscreen-alt');
			document.getElementsByTagName('html')[0].classList.remove('showpony-fullscreen-control');
			
			//Get the original z-index value
			S.window.style.zIndex=S.window.dataset.prevz;
			S.window.removeAttribute('data-prevz');
		}
		
		return;
	}
	
	//If fullscreen and not requesting, exit
	if(document[browser.element]){
		if(type!=='request') document[browser.exit]();
	}
	//If not fullscreen and not exiting, request
	else if(type!=='exit') S.window[browser.request]();
}

//When the viewer inputs to Showpony (click, space, general action)
S.input=function(){
	if(S.window.classList.contains('showpony-paused')){
		S.menu(null,'play');
		return;
	}
	
	S[currentType].input();
}

//Close ShowPony
S.close=function(){
	//Remove the window event listener
	window.removeEventListener('click',windowClick);
	
	//Reset the window to what it was before
	S.window.remove();
}

///////////////////////////////////////
/////////////////TEXT//////////////////
///////////////////////////////////////

function makeText(){
	const P=this;
	
	P.currentTime=-1;
	P.currentFile=-1;
	
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
		var src=S.files[file].path;
		
		//If this is the current file
		if(P.currentFile===file){
			pageTurn.scrollTop=pageTurn.scrollHeight*(P.currentTime/S.files[P.currentFile].duration);
			content.classList.remove('showpony-loading');
			return;
		}
		
		fetch(src,{credentials:'include'})
		.then(response=>{
			return response.text();
		})
		.then(text=>{
			P.currentFile=file;
			
			//Put in the text
			pageTurn.innerHTML=text;
			
			//Scroll to spot
			pageTurn.scrollTop=pageTurn.scrollHeight*(P.currentTime/S.files[P.currentFile].duration);
			
			//Stop loading
			content.classList.remove('showpony-loading');
			
			if(S.files[P.currentFile].buffered!==true){
				S.files[P.currentFile].buffered=true;
				getTotalBuffered();
			}
			
			P.timeUpdate(time);
			timeUpdate(time);
		})
		.catch((error)=>{
			alert('329: '+error);
			console.log(error);
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
				S[currentType].displaySubtitles();
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

///////////////////////////////////////
/////////////////IMAGE/////////////////
///////////////////////////////////////

function makeImage(){
	const P=this;
	
	P.currentTime=-1;
	P.currentFile=-1;
	
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
		P.timeUpdate(time);
		
		var src=S.files[file].path;
		
		//Change the file if it'd be a new one
		if(P.currentFile!==file) P.window.src=src;
		else content.classList.remove('showpony-loading');
		
		P.currentFile=file;
		
		timeUpdate(time);
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
				var block=m('sub','p');
				
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
	});
};

S.image=new makeImage();

///////////////////////////////////////
/////////////////MEDIA/////////////////
///////////////////////////////////////

function makeMedia(type='video'){
	const P=this;
	
	P.currentTime=-1;
	P.currentFile=-1;
	
	P.window=document.createElement(type);
	P.window.className='showpony-block';
	
	P.play=function(){
		P.window.play();
	}
	
	P.pause=function(){
		P.window.pause();
	}
	
	P.input=function(){
		S.menu();
	}
	
	P.timeUpdate=function(time=0){
		P.currentTime=P.window.currentTime=time;
	}
	
	P.goToTime=0;
	
	P.src=function(file=0,time=0){
		var src=S.files[file].path;
		
		//Change the file if it'd be a new one
		if(P.currentFile!==file) P.window.src=src;
		
		//If we're not paused, play
		if(!S.window.classList.contains('showpony-paused')) P.play();
		
		P.currentFile=file;
		
		P.timeUpdate(time);
		P.goToTime=time;
		timeUpdate(time);
	}
	
	P.displaySubtitles=function(){
		if(S.currentSubtitles===null){
			subtitles.innerHTML='';
			return;
		}
		
		if(S.files[P.currentFile].subtitles){
			subtitles.style.cssText=null;
			var currentTime=S[currentType].currentTime;
			
			var lines=S.files[P.currentFile].subtitles.match(/\b.+/ig);
			
			for(let i=0;i<lines.length;i++){
				if(/\d{2}:\d{2}\.\d{3}.+\d{2}:\d{2}\.\d{3}/.test(lines[i])){
					var times=lines[i].split(/\s*-->\s*/);
					//If between both times
					if(
						currentTime>=times[0].split(/:/)[1]
						&& currentTime<=times[1].split(/:/)[1]
					){
						var newSubtitle='';
						
						var ii=i+1;
						while(!(/\d{2}:\d{2}\.\d{3}.+\d{2}:\d{2}\.\d{3}/.test(lines[ii])) && ii<lines.length){
							if(newSubtitle.length) newSubtitle+='<br>';
							newSubtitle+=lines[ii];
							
							ii++;
						}
						
						if(subtitles.children.length===0 || subtitles.children[0].innerHTML!==newSubtitle){
							subtitles.innerHTML='';
						
							var block=m('sub','p');
							block.innerHTML=newSubtitle;
							
							subtitles.appendChild(block);
						}
						
						break;
					}
					
					if(currentTime<times[0].split(/:/)[0] || i==lines.length-1){
						subtitles.innerHTML='';
						break;
					}
				}
				
				if(i==lines.length-1) subtitles.innerHTML='';
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
	
	//Allow playing videos using Showpony in iOS
	P.window.setAttribute('playsinline','');

	//Fix for Safari not going to the right time
	P.window.addEventListener('loadeddata',function(){
		P.currentTime=P.window.currentTime=P.goToTime;
	});

	P.window.addEventListener('canplay',function(){
		content.classList.remove('showpony-loading');
		//Consider how much has already been loaded; this isn't run on first chunk loaded
		P.window.dispatchEvent(new CustomEvent('progress'));
	});


	P.window.addEventListener('canplaythrough',function(){
		//Consider how much has already been loaded; this isn't run on first chunk loaded
		P.window.dispatchEvent(new CustomEvent('progress'));
	});


	//Buffering
	P.window.addEventListener('progress',function(){
		var bufferedValue=[];
		var timeRanges=P.window.buffered;
		
		for(var i=0;i<timeRanges.length;i++){
			//If it's the first value, and it's everything
			if(i===0 && timeRanges.start(0)==0 && timeRanges.end(0)==P.window.duration){
				bufferedValue=true;
				break;
			}
			
			bufferedValue.push([timeRanges.start(i),timeRanges.end(i)]);
		}
		
		S.files[P.currentFile].buffered=bufferedValue;
		
		getTotalBuffered();
	});
	
	//When we finish playing a video or audio file
	P.window.addEventListener('ended',function(){
		//Only do this if the menu isn't showing (otherwise, while we're scrubbing this can trigger)
		if(!S.window.classList.contains('showpony-paused')) S.to({file:'+1'});
	});

	//On moving through time, update info and title
	P.window.addEventListener('timeupdate',function(){
		P.currentTime=P.window.currentTime;
		
		//Consider how much has already been loaded; this isn't run on first chunk loaded
		this.dispatchEvent(new CustomEvent('progress'));
		timeUpdate();
	});
};

S.video=new makeMedia('video');
S.audio=new makeMedia('audio');

///////////////////////////////////////
/////////////VISUAL NOVEL//////////////
///////////////////////////////////////

function makeVisualNovel(){
	const P=this;
	
	P.currentTime=-1;
	P.currentFile=-1;
	
	P.window=document.createElement('div');
	P.window.className='showpony-multimedia';
	
	P.play=function(){
		//Go through objects that were playing- unpause them
		for(var key in S.objects){
			if(S.objects[key].wasPlaying){
				S.objects[key].play();
			}
		}
		
		//Resume waitTimer
		waitTimer.resume();
	}
	
	P.pause=function(){
		//Go through objects that can be played- pause them, and track that
		for(var key in S.objects){
			//If it can play, and it is playing
			if(S.objects[key].play && S.objects[key].paused===false){
				S.objects[key].wasPlaying=true;
				S.objects[key].pause();
			}else{
				S.objects[key].wasPlaying=false;
			}
		}
		
		//Pause waitTimer
		waitTimer.pause();
	}
	
	P.input=function(){
		//If a wait timer was going, stop it.
		if(waitTimer.remaining>0){
			//Run all animations, end all transitions
			content.classList.add('showpony-loading');
			S.multimedia.window.offsetHeight; //Trigger reflow to flush CSS changes
			content.classList.remove('showpony-loading');
			
			waitTimer.end();
		}
		
		//Remove the continue notice
		continueNotice.remove();
		
		//End object animations on going to the next frame
		for(var key in S.objects) S.objects[key].dispatchEvent(new Event('animationend'));
		
		var choices=false;
		
		//If the player is making choices right now
		if(S.objects[multimediaSettings.textbox] && S.objects[multimediaSettings.textbox].querySelector('input')) choices=true;
		
		//If all letters are displayed
		if(!S.objects[multimediaSettings.textbox] || S.objects[multimediaSettings.textbox].children.length===0 || S.objects[multimediaSettings.textbox].lastChild.firstChild.style.visibility=='visible'){
			multimediaSettings.input=false;
			if(!choices) runMM();
		}
		else //If some S.objects have yet to be displayed
		{
			//Run all animations, end all transitions
			content.classList.add('showpony-loading');
			S.multimedia.window.offsetHeight; //Trigger reflow to flush CSS changes
			content.classList.remove('showpony-loading'); //Needs to happen before the latter; otherwise, it'll mess up stuff
			
			//Display all letters
			S.multimedia.window.querySelectorAll('.showpony-char').forEach(function(key){
				//Skip creating animation, and display the letter
				key.style.animationDelay=null;
				var classes=key.className;
				key.className=classes;
				key.style.animation='initial';
				key.firstChild.dispatchEvent(new CustomEvent('animationstart'));
				key.style.visibility='visible';
			});
			
			if(choices) return;
			
			multimediaSettings.input=true;
			
			//Continue if not waiting
			if(!multimediaSettings.wait) runMM();
			else S.multimedia.window.appendChild(continueNotice);
		}
	}

	P.timeUpdate=function(time=0){
		P.currentTime=time;
	}
	
	P.src=function(file=0,time=0){
		/////RESET THINGS//////
		//Get rid of local styles
		for(var key in S.objects){
			S.objects[key].removeAttribute('style');
			
			//Empty out textboxes
			if(S.objects[key].classList.contains('showpony-textbox')) S.objects[key].innerHTML='';
		};
		
		/////END RESETTIN//////
		
		//If this is the current file
		if(P.currentFile===file){
			runTo=Math.round(keyframes.length*(P.currentTime/S.files[P.currentFile].duration));
			if(runTo>=keyframes.length) runTo=keyframes[keyframes.length-1];
			else runTo=keyframes[runTo];
			
			runMM(0);
			return;
		}
		
		var src=S.files[file].path;
		
		fetch(src,{credentials:'include'})
		.then(response=>{
			return response.text();
		})
		.then(text=>{
			P.currentFile=file;
			
			//Remove multiline comments
			text=text.replace(/\/\*[^]*?\*\//g,'');
			
			//Get all non-blank lines
			S.lines=text.match(/.+(?=\S).+/g);
			
			//Get keyframes from the text- beginning, end, (? ->)and waiting points
			keyframes=[0];
			
			for(let i=1;i<S.lines.length;i++){
				//If it's a user file spot, add the point immediately after the last keyframe- things let up to this, let it all happen
				if(S.lines[i]==='engine.wait'){
					keyframes.push(keyframes[keyframes.length-1]+1);
					continue;
				}
				
				//Regular text lines (not continuing) can be keyframes
				if(/^\t+(?!\t*\+)/i.test(S.lines[i])) keyframes.push(i);
			}
			
			runTo=Math.round(keyframes.length*(P.currentTime/S.files[file].duration));
			if(runTo>=keyframes.length) runTo=keyframes[keyframes.length-1];
			else runTo=keyframes[runTo];
			
			runMM(0);
			
			if(S.files[file].buffered!==true){
				S.files[file].buffered=true;
				getTotalBuffered();
			}
			
			console.log('MULTIMEDIA ENGINE RAN');
			
			P.timeUpdate(time);
			timeUpdate(time);
		})
		.catch((error)=>{
			alert('329: '+error);
			console.log(error);
		});
	}
	
	P.displaySubtitles=function(){
		if(S.currentSubtitles===null){
			subtitles.innerHTML='';
			return;
		}
		
		if(S.files[P.currentFile].subtitles){
			///NOTHING YET!
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
};

S.multimedia=new makeVisualNovel();

///////////////////////////////////////
///////////PRIVATE VARIABLES///////////
///////////////////////////////////////

var multimediaSettings={
	textbox:'main'
	,text:null
	,go:false
	,input:false
};

//Waiting for user input
var waitForInput=false
	,scrubbing=false
	,waitTimer=new powerTimer(function(){},0)
	,currentType=null
	//Elements
	,overlayText=m('overlay-text','p')
	,overlayBuffer=m('overlay-buffer','canvas')
	,progress=m('progress')
	,content=m('content')
	,subtitles=m('subtitles','div')
	,styles=document.createElement('style')
	//Buttons
	,fullscreenButton=m('button showpony-fullscreen-button','button')
	,captionsButton=m('captions-button','select')
	,overlay=m('overlay','div')
	,cover=m('cover','div')
	//Page turning
	,pageTurn=m('page-turn')
	//Multimedia
	,continueNotice=m('continue')
;

fullscreenButton.alt='Fullscreen';
fullscreenButton.title='Fullscreen Toggle';
captionsButton.alt='Closed Captions/Subtitles';
captionsButton.title='Closed Captions/Subtitles';

styles.type='text/css';

S.window.addEventListener('animationend',function(){
	var updateStyle=new RegExp('@keyframes window{100%{[^}]*}}','i').exec(styles.innerHTML);
	
	var styleAdd=/[^{]+;/.exec(updateStyle);
	
	if(styleAdd) this.style.cssText+=styleAdd[0];
	this.style.animation=null;
})

content.addEventListener('animationend',function(){
	var updateStyle=new RegExp('@keyframes content{100%{[^}]*}}','i').exec(styles.innerHTML);
	
	var styleAdd=/[^{]+;/.exec(updateStyle);
	
	if(styleAdd) this.style.cssText+=styleAdd[0];
	this.style.animation=null;
})

frag([overlayBuffer,progress,overlayText,fullscreenButton,captionsButton],overlay);

///////////////////////////////////////
///////////PRIVATE FUNCTIONS///////////
///////////////////////////////////////

function timeUpdate(time){
	if(!isNaN(time)){
		//Don't exceed the file's duration
		var duration=S.files[S.currentFile].duration;
		if(time>duration) time=duration;
		S[currentType].timeUpdate(time);
	}
	
	updateInfo();
	S.currentTime=getCurrentTime();
	S[currentType].displaySubtitles();
	
	//Run custom event for checking time
	S.window.dispatchEvent(
		new CustomEvent(
			'timeupdate'
			,{
				detail:{
					file:(S.currentFile+1)
					,time:S.currentTime
				}
			}
		)
	);
}

function getTotalBuffered(){
	var time=0;
	var buffered=[];
	
	//Update amount buffered total
	for(let i=0;i<S.files.length;i++){
		var buffer=false;
		
		if(S.files[i].buffered===true){
			buffer=[time,time+S.files[i].duration];
			
			if(buffer){
				//Combine buffered arrays, if we're moving forward
				if(buffered.length>0 && buffer[0]<=buffered[buffered.length-1][1]) buffered[buffered.length-1][1]=buffer[1];
				else buffered.push(buffer);
			}
		}
		else if(Array.isArray(S.files[i].buffered)){
			//Get working for multiple contained buffers
			for(let ii=0;ii<S.files[i].buffered.length;ii++){
				buffer=[
					time+S.files[i].buffered[ii][0]
					,time+S.files[i].buffered[ii][1]
				];
				
				//Combine buffered arrays, if we're moving forward
				if(buffered.length>0 && buffer[0]<=buffered[buffered.length-1][1]) buffered[buffered.length-1][1]=buffer[1];
				else buffered.push(buffer);
			}
		}
		
		time+=S.files[i].duration;
	}
	
	if(buffered.length===1 && buffered[0][0]===0 && buffered[0][1]>=S.duration) buffered=true;
	if(buffered.length===0) buffered=false;
	
	S.buffered=buffered;
	
	if(S.showBuffer===false) return;
	
	var rectRes=1000;
	overlayBuffer.width=rectRes;
	overlayBuffer.height=1;
	var ctx=overlayBuffer.getContext('2d');
	ctx.clearRect(0,0,rectRes,1);
	ctx.fillStyle='#95f442';
	
	//Update info on dropdown
	if(S.buffered===true){
		ctx.fillRect(0,0,rectRes,1);
	}else if(Array.isArray(S.buffered)){
		for(let i=0;i<S.buffered.length;i++){
			ctx.fillRect(
				Math.floor(S.buffered[i][0]/S.duration*rectRes)
				,0
				,Math.floor((S.buffered[i][1]-S.buffered[i][0])/S.duration*rectRes)
				,1
			);
		}
	}
}

function getCurrentTime(){
	//Use the currentTime of the object, if it has one
	var newTime=S[currentType] && S[currentType].currentTime || 0;
	
	//Add the times of previous videos to get the actual time in the piece
	for(let i=0;i<S.currentFile;i++) newTime+=S.files[i].duration;
	
	return newTime;
}

//Update the scrubber's position
function scrub(inputPercent){
	//if(sticky!==false) return;
	
	//If no inputPercent was passed, estimate it
	if(typeof(inputPercent)==='undefined'){
		var timeInTotal=getCurrentTime();
		
		var inputPercent=timeInTotal / S.duration
			,newPart=S.currentFile;
	}else{ //if inputPercent WAS passed
	
		//Clamp inputPercent between 0 and 1
		inputPercent= inputPercent <= 0 ? 0 : inputPercent >= 1 ? 1 : inputPercent;
		
		//Go to the time
		var timeInTotal=S.duration*inputPercent
			,newTime=S.duration*inputPercent
			,newPart=0
		;
		
		//Look through the media for the right one
		var l=S.files.length;
		for(let i=0;i<l;i++){
			//If the duration's within this one, stop at this one
			if(i==l-1 || newTime<S.files[i].duration){
			//If this is the media!
				//If we allow scrubbing or we're not moving the bar, we can load the file
				if(S.scrubLoad || scrubbing===false) S.to({file:i,time:newTime,scrollToTop:false});
				
				newPart=i;
				
				break;
			//Otherwise, go to the next one (and subtract the duration from the total duration)
			}else newTime-=S.files[i].duration;
		}
	}
	
	//Move the progress bar
	progress.style.left=(inputPercent*100)+'%';
	
	//Set the overlay text
	var newHTML=replaceInfoText(
		null
		,newPart
		,Math.floor(timeInTotal)
	);
	if(newHTML!==overlayText.innerHTML) overlayText.innerHTML=newHTML;
	
	//Update the title, if set up for it
	if(S.title){
		var newTitle=replaceInfoText(null,S.currentFile);
		if(newTitle!==document.title) document.title=newTitle;
	}
}

function replaceInfoText(value=null,fileNum,current){
	if(current===undefined){
		//var currentType=S.files[S.currentFile].medium;
		
		//Use the currentTime of the object, if it has one
		var currentTime=S[currentType] && S[currentType].currentTime || 0;
		
		//Add the times of previous videos to get the actual time in the piece
		for(let i=0;i<S.currentFile;i++) currentTime+=S.files[i].duration;
		
		var current=Math.floor(inputPercent*S.duration)
			,left=S.duration-Math.floor(inputPercent*S.duration)
		;
		
		fileNum=S.currentFile;
	}else{
		var left=S.duration-current;
	}
	
	var fileMedium=S.files[fileNum].medium;
	
	var time=0;
	for(var i=0;i<S.files.length;i++){
		if(current<time+S.files[i].duration){
			
			var currentThis=current-time;
			var leftThis=S.files[i].duration-currentThis;
			break;
		}
		
		time+=S.files[i].duration;
	}
	
	<? if($info==='time'){ ?>
		var padLength=String((S.duration / 60)|0).length;
		console.log(padLength);
	
		//Time
		return String((current / 60)|0).padStart(padLength,'0')
			+':'
			+String((current % 60)|0).padStart(2,'0')
			+' | '
			+String((left / 60)|0).padStart(padLength,'0')
			+':'
			+String((left % 60)|0).padStart(2,'0')
		;
	<? }else{ ?>
		var padLength=String(S.files.length).length;
	
		//Files
		return String(fileNum+1).padStart(padLength,'0')
			+' | '
			+String(S.files.length-(fileNum+1)).padStart(padLength,'0')
		;
	<? } ?>
}

//Use documentFragment to append elements faster
function frag(inputArray,inputParent){
	var fragment=document.createDocumentFragment();
	
	for(let i=0, len=inputArray.length;i<len;i++) fragment.appendChild(inputArray[i]);
	
	inputParent.appendChild(fragment);
}

//Create an element with a class
function m(c,el){
	var a=document.createElement(el || 'div');
	a.className='showpony-'+c;
	
	return a;
}

//When video or audio ends
function mediaEnd(){
	//Only do this if the menu isn't showing (otherwise, while we're scrubbing this can trigger)
	if(!S.window.classList.contains('showpony-paused')) S.to({file:'+1'});
}

var runTo=false;

//Run multimedia (interactive fiction, visual novels, etc)
function runMM(inputNum=S.currentLine+1){
	
	//Go to either the specified line or the next one
	S.currentLine=inputNum;
	
	//Run through if we're running to a point; if we're there or beyond though, stop running through
	if(runTo!==false && S.currentLine>=runTo){
		runTo=false;
		multimediaSettings.input=false;
	}
	
	//We've run through!
	if(runTo===false && content.classList.contains('showpony-loading')){
		if(waitTimer.remaining>0){
			waitTimer.end();
		}
		
		//Get rid of unused, uncreated objects
		for(var key in S.objects){
			//Get rid of the object if it doesn't exist
			if(!objectBuffer[key]){
				S.objects[key].remove();
				delete S.objects[key];
			}
		};
		
		S.multimedia.window.offsetHeight; //Trigger reflow to flush CSS changes
		content.classList.remove('showpony-loading');
	}
	
	//Update the scrubbar if the frame we're on is a keyframe
	if(runTo===false && keyframes.includes(S.currentLine)){
		//Set the time of the element
		timeUpdate((keyframes.indexOf(S.currentLine)/keyframes.length)*S.files[S.currentFile].duration);
	}
	
	//If we've ended manually or reached the end, stop running immediately and end it all
	if(S.currentLine>=S.lines.length){
		S.to({file:'+1'});
		return;
	}
	
	var text=S.lines[S.currentLine];
	
	//Replace all variables (including variables inside variables) with the right name
	var match;
	while(match=/[^\[]+(?=\])/g.exec(text)) text=text.replace('['+match[0]+']',S.data[match[0]]);
	
	//Skip comments
	if(/^\/\//.test(text)){
		runMM();
		return;
	}
	
	var vals=text.split(/(?:\s{3,}|\t+)/);
	
	var type;
	
	//Data
	if(type=/[+=\-<>!]+$/.exec(vals[0])){
		type=type[0];
		//Remove type from variable name
		vals[0]=vals[0].replace(type,'');
		
		//If a value's a number, return it as one
		function ifParse(input){
			return isNaN(input) ? input : parseFloat(input);
		}
		
		//Check values inline
		var operators={
			'='		:(a,b)=>	b
			,'+='	:(a,b)=>	a+b
			,'-='	:(a,b)=>	a-b
			,'=='	:(a,b)=>	a==b
			,'<'	:(a,b)=>	a<b
			,'>'	:(a,b)=>	a>b
			,'<='	:(a,b)=>	a<=b
			,'>='	:(a,b)=>	a>=b
			,'!'	:(a,b)=>	a!=b
		};
		
		switch(type){
			//Operations
			case '=':
			case '+=':
			case '-=':
				S.data[vals[0]]=operators[type](
					ifParse(S.data[vals[0]])
					,ifParse(vals[1])
				);
				
				/*
				//Run an event that the user can track for updated user info
				S.window.dispatchEvent(
					new CustomEvent(
						'data'
						,{
							detail:{
								name:vals[1]
								,value:S.data[vals[1]]
							}
						}
					)
				);*/
				
				runMM();
				break;
			//Comparisons
			default:
				if(operators[type](
					ifParse(S.data[vals[0]])
					,ifParse(vals[1])
				)) runMM(S.lines.indexOf(vals[2]));
				else runMM();
				break;
		}
		return;
	}
	
	type='character';
	if(vals.length===1){
		type='background';
	}
	
	var object=/^[^\.\t]+/.exec(vals[0]);
	if(!object){
		object='main';
		type='textbox';
	}
	else object=object[0];
	
	var command=/\..+/.exec(vals[0]);
	if(!command) command='content';
	else command=command[0].replace('.','');
	
	//Check if audio
	if(/play|pause|stop|loop/.test(command)){
		type='audio';
	}
	
	//Check for images for this character; go through future lines
	if(type==='character') var lines=[vals[1]];		
	
	//If an object with the name doesn't exist, make it!
	if(object!=='engine' && !S.objects[object]){
		//Audio has special requirements
		if(type==='audio'){
			S.objects[object]=document.createElement('audio');
			
			S.objects[object].src='url("<?=$_POST['path']?>resources/audio/'+object;
			
			//If an extension isn't specified, assume mp3
			if(!/\./.test(object)) S.objects[object].src+='.mp3';
			S.objects[object].preload=true;
			
			S.multimedia.window.appendChild(S.objects[object]);
		}else{
			if(type==='textbox'){
				S.multimedia.window.appendChild(S.objects[object]=m(type,'form'));
				S.objects[object].addEventListener('submit',function(event){event.preventDefault();});
			}
			else S.multimedia.window.appendChild(S.objects[object]=m(type));

			S.objects[object].addEventListener('animationend',function(event){
				if(this!==event.target) return;
				
				var objectName=object.replace(/#/g,'id');
				
				var updateStyle=new RegExp('@keyframes '+objectName+'{100%{[^}]*}}','i').exec(styles.innerHTML);
				
				var styleAdd=/[^{]+;/.exec(updateStyle);
				
				if(styleAdd) this.style.cssText+=styleAdd[0];
				this.style.animationName=null;
				this.style.animationDuration=null;
				this.style.animationFillMode=null;
			})
			
			if(type==='character'){
				//Go through the rest of the lines, looking for images to preload
				for(let i=S.currentLine;i<S.lines.length;i++){
					
					//If this character is listed on this line
					if(S.lines[i].indexOf(object+'\t')===0){
						//Add the image names to the images to load
						lines.push(S.lines[i].split(/\s{3,}|\t+/)[1]);
					}
				}
			}
		}
	}
	
	//If we're buffering, add it to the buffer so it's not deleted later
	if(runTo) objectBuffer[object]=S.objects[object];

	//Get the name, which is the file's name (or for characters, the character's name). Anything after a hash is an id; it's not a part of the name.
	var name=/^[^#]+/.exec(object)[0];
	
	switch(command){
		case 'go':
			runMM(S.lines.indexOf(vals[1]));
			//Don't automatically go to the next line, we're going correctly above
			break;
		case 'wait':
			//If there's a waitTimer, clear it out
			if(waitTimer.remaining>0){
				waitTimer.end();
			}
			
			//Skip waiting if we're running through
			if(runTo){
				runMM();
				return;
			}
			
			//If a value was included, wait for the set time
			if(vals[1]) waitTimer=new powerTimer(runMM,parseFloat(vals[1])*1000);
			//Otherwise, let the user know to continue it
			else S.multimedia.window.appendChild(continueNotice);
			
			//If we're paused, pause the timer
			if(S.window.classList.contains('showpony-paused')) waitTimer.pause();
			
			//Don't automatically go to the next line
			break;
		case 'style':
			var animationSpeed=/time:[^s]+s/i.exec(vals[1]);
		
			//If running to or not requesting animation, add styles without implementing animation
			if(animationSpeed===null || S.currentLine<runTo){
				S.objects[object].style.cssText+=vals[1];
			}else{
				var objectName=object.replace(/#/g,'id');
				
				animationSpeed=animationSpeed[0].split(':')[1];
				
				var animation='@keyframes '+objectName+'{100%{'+vals[1]+'}}';
			
				//Either replace existing keyframes or append to the end
				styles.innerHTML=styles.innerHTML.replace(new RegExp('(@keyframes '+objectName+'{100%{[^}]*}})|$'),animation);
				S.objects[object].style.animationName=objectName;
				S.objects[object].style.animationFillMode='forwards';
				S.objects[object].style.animationDuration=animationSpeed;
			}
			
			runMM();
			break;
		case 'async':
			S.objects[object].dataset.async=vals[1];
			runMM();
			break;
		case 'content':
			switch(type){
				case 'character':
					var cha=S.objects[vals[0]];
					
					//Character level
					for(let i=0,len=lines.length;i<len;i++){
						
						//Get the image names passed (commas separate layers)
						var imageNames=lines[i].split(',');
					
						//Layer level
						//Go through each passed image and see if it exists
						for(let ii=0,len=imageNames.length;ii<len;ii++){
							//If there's no period, add '.png' to the end- assume the extension
							if(!/\./.test(imageNames[ii])) imageNames[ii]+='.png';
							
							var image='url("<?=$_POST['path']?>resources/characters/'+name+'/'+imageNames[ii]+'")';
							
							//If the image already exists
							var found=false;
							
							//If the layer exists, search it
							if(cha.children[ii]){
								//Search the layer!
								var search=cha.children[ii].children;
								
								//Set the opacity right, and if it's 1, we found the image!
								for(let iii=0,len=search.length;iii<len;iii++){
									var match=search[iii].style.backgroundImage.replace(/'/g,'"')==image.replace(/'/g,'"');
									
									//If this is the first image, it's the one we asked for; we don't want to make preloads visible, after all!
									if(i===0) search[iii].style.opacity=match ? 1 : 0;
									
									if(match==true) found=true;
								}
							//If the layer doesn't exist, make it!
							}else cha.appendChild(document.createElement('div'));
							
							//Image level
							//If the image doesn't exist in the layer, we add it!
							if(!found){
								//Add a backgroundImage
								var thisImg=m('character-image');
								thisImg.style.backgroundImage=image;
								
								//If this isn't the first image, hide it immediately (it's being preloaded, we don't want to see it yet!)
								if(i!==0) thisImg.style.opacity=0;
								
								cha.children[ii].appendChild(thisImg);
							}
						}
					}
					runMM();
					break;
				case 'background':
					S.objects[object].style.backgroundImage='url("<?=$_POST['path']?>resources/backgrounds/'+name+'.jpg")';
					runMM();
					break;
				case 'audio':
					S.objects[object].src=vals[0];
					/*
					//Go through the passed parameters and apply them
					let l=vals.length;
					for(let i=2;i<l;i++){
						switch(vals[i]){
							case 'unloop':
								S.objects[object].loop=false;
								break;
							case 'stop':
								S.objects[object].currentTime=0;
								S.objects[object].wasPlaying=false;
								S.objects[object].pause();
								break;
							default: //Other features
								var value=parseFloat(vals[i].substr(1));
								//Current volume
								if(vals[i][0]==='v') S.objects[object].volume=value;
								//Current time
								else if(vals[i][0]==='t') S.objects[object].currentTime=value;
								//Speed
								else if(vals[i][0]==='s') S.objects[object].playbackRate=value;
								break;
						}
					}*/
					runMM();
					break;
				case 'textbox':
					//var keepGoing=multimediaFunction[vals[0].toLowerCase().substr(0,2)](vals);
	
					//var keepGoing=false;
					//if(!keepGoing) runMM();
					
					//If we're running through, skip displaying text until we get to the right point
					if(runTo){
						objectBuffer[multimediaSettings.textbox]=S.objects[multimediaSettings.textbox];
						runMM(undefined);
						return;
					}
					
					multimediaSettings.wait=true; //Assume we're waiting at the end time
					
					text=text.replace(/^\t+/,'');
					
					//If the line doesn't start with +, replace the text
					if(text[0]!=='+'){
						S.objects[multimediaSettings.textbox].innerHTML='';
						
						if(!S.objects.name) S.multimedia.window.appendChild(S.objects.name=m('name'));
						
						//Split up the text so we can have names automatically written
						var nameText=text.split('::');
						if(nameText.length>1){
							text=nameText[1];
							S.objects.name.innerHTML=nameText[0];
							S.objects.name.style.visibility='visible';
						}else{
							S.objects.name.style.visibility='hidden';
						}
						
						multimediaSettings.input=false;
					}
					else text=text.substr(1);
					
					//STEP 2: Design the text//
					
					//Design defaults
					var charElementDefault=m('char-container','span')
						,charElement
						,baseWaitTime
						,constant
					;
					
					//Reset the defaults with this function, or set them inside here!
					function charDefaults(){
						//Use the default element for starting off
						charElement=charElementDefault.cloneNode(true);
						baseWaitTime=.03; //The default wait time
						constant=false; //Default punctuation pauses
					}
					
					//Use the defaults
					charDefaults();

					//The total time we're waiting until x happens
					var totalWait=0;
					var fragment=document.createDocumentFragment();
					var currentParent=fragment;
					
					var letters=''; //Have to save actual letters separately; special tags and such can mess with our calculations
					
					var lastLetter=null;
					
					var l=text.length;
					//We check beyond the length of the text because that lets us place characters that allow text wrapping in Firefox
					for(let i=0;i<=l;i++){
						var waitTime=baseWaitTime;
						
						//If a > is at the end of a text line, continue automatically.
						//Won't interfere with tags, no worries!
						if(i==l-1 && text[i]==='>'){
							multimediaSettings.wait=false;
							continue;
						}
						
						//Check the current character//
						switch(text[i]){
							//HTML
							case '<':
								//Skip over the opening bracket
								i++;
							
								var values='';
								
								//Wait until a closing bracket (or the end of the text)
								while(text[i]!='>' && i<text.length){
									values+=text[i];
									i++;
								}
								
								//We're closing the element
								if(values[0]=='/'){
									switch(values){
										case '/shout':
											charElement.classList.remove('showpony-char-shout');
											break;
										case '/sing':
											charElement.classList.remove('showpony-char-sing');
											break;
										case '/shake':
											charElement.classList.remove('showpony-char-shake');
											break;
										case '/fade':
											charElement.classList.remove('showpony-char-fade');
											break;
										case '/speed':
											//Adjust by the default wait set up for it
											baseWaitTime=.03;
											constant=false;
											break;
										default:
											//If the parent doesn't have a parent (it's top-level)
											if(currentParent.parentElement==null){
												fragment.appendChild(currentParent);
												currentParent=fragment;
											//If a parent element exists, it's the new parent
											}else{
												currentParent=currentParent.parentElement;
											}
											break;
									}
								//We're creating the element
								}else{
									values=values.split(' ');
									
									switch(values[0]){
										case 'shout':
											charElement.classList.add('showpony-char-shout');
											break;
										case 'sing':
											charElement.classList.add('showpony-char-sing');
											break;
										case 'shake':
											charElement.classList.add('showpony-char-shake');
											break;
										case 'fade':
											charElement.classList.add('showpony-char-fade');
											break;
										case 'speed':
											//Check the attributes
											for(let i=1;i<values.length;i++){
												if(values[i]==='constant'){
													constant=true;
												//It must be speed if not other
												}else baseWaitTime*=parseFloat(/[\d\.]+/.exec(values[i])[0]);
											}
											break;
										case 'br':
											var lineBreak=document.createElement('span');
											lineBreak.style.whiteSpace='pre-line';
											lineBreak.innerHTML=' <wbr>';
											currentParent.appendChild(lineBreak); //wbr fixes missing lines breaks in Firefox
											currentParent.appendChild(document.createElement('br'));
											break;
										case 'wbr':
										case 'img':
										case 'embed':
										case 'hr':
										case 'input':
											var newParent=document.createElement(values[0]);
											
											//Set attributes, if any were passed
											for(let ii=1;ii<values.length;ii++){
												
												if(values[ii].indexOf('=')>-1){
													var attValues=values[ii].substr().split('=');
													
													//Remove surrounding quotes
													if(/['"]/.test(attValues[1])){
														attValues[1]=attValues[1].substr(1,attValues[1].length-2);
													}
													
													newParent.setAttribute(attValues[0],attValues[1]);
												}else{
													newParent.setAttribute(attValues[0],'true');
												}
											}
											
											currentParent.appendChild(newParent);
											
											//If an input type, wait until input is set and stuff
											if(values[0]=='input'){
												//Update data based on this
												if(newParent.type==='button' || newParent.type==='submit'){
													newParent.addEventListener('click',function(event){
														//This might just be a continue button, so we need to check
														if(this.dataset.var) S.data[this.dataset.var]=this.dataset.val;
														
														if(this.dataset.go) runMM(S.lines.indexOf(this.dataset.go));
														else runMM();
														
														//We don't want to run S.input here
														event.stopPropagation();
													});
												}else{
													//Set data to the defaults of these, in case the user just clicks through
													if(newParent.dataset.var) S.data[newParent.dataset.var]=newParent.value;
													
													newParent.addEventListener('change',function(){
														S.data[this.dataset.var]=this.value;
														console.log(this.value);
													});
												}
											}
											break;
										default:
											var newParent=document.createElement(values[0]);
											
											//Set attributes, if any were passed
											for(let ii=1;ii<values.length;ii++){
												
												if(values[ii].indexOf('=')>-1){
													var attValues=values[ii].substr().split('=');
													
													//Remove surrounding quotes
													if(/['"]/.test(attValues[1])){
														attValues[1]=attValues[1].substr(1,attValues[1].length-2);
													}
													
													newParent.setAttribute(attValues[0],attValues[1]);
												}else{
													newParent.setAttribute(attValues[0],'true');
												}
											}
											
											currentParent.appendChild(newParent);
											currentParent=newParent;
										break;
									}
									
								}
								
								//Pass over the closing bracket
								continue;
							default:
								//Handle punctuation
								if(i!=text.length && (text[i]==' ')){
									/*Pause at:
										. ! ? : ; -
										but if there's a " or ' after it, wait until that's set.
									*/
									
									var start=letters.length-3;
									if(start<0) start=0;
									
									if(!constant){
										//Long pause
										if(/[.!?:;-]["']*$/.test(letters.substr(start,3))) waitTime*=20;
										
										//Short pause
										if(/[,]["']*$/.test(letters.substr(start,3))) waitTime*=10;
									}
								}
								
								letters+=text[i];

								//Make the char based on charElement
								var thisChar=charElement.cloneNode(false);
								
								let showChar=m('char','span');				//Display char (appear, shout, etc), parent to animChar
								let animChar=m('char-anim','span');			//Constant animation character (singing, shaking...)
								let hideChar=m('char-placeholder','span');	//Hidden char for positioning
								
								//Spaces
								//and Ending! (needs this to wrap lines correctly on Firefox)
								if(text[i]==' ' || i==l){
									thisChar.style.whiteSpace='pre-line';
									hideChar.innerHTML=animChar.innerHTML=' <wbr>';
									
									showChar.addEventListener('animationstart',function(event){
										//If the animation ended on a child, don't continue! (animations are applied to children for text effects)
										if(this!=event.target) return;
										
										//If the element's currently hidden (the animation that ended is for unhiding)
										if(this.style.visibility!=='visible'){
											this.style.visibility='visible';
											
											var textbox=this.closest('.showpony-textbox');
											
											//If the letter's below the textbox
											if(this.parentNode.getBoundingClientRect().bottom>textbox.getBoundingClientRect().bottom){
												textbox.scrollTop=this.parentNode.offsetTop+this.parentNode.offsetHeight-textbox.offsetHeight;
											}
											
											//If the letter's above the textbox
											if(this.parentNode.getBoundingClientRect().top<textbox.getBoundingClientRect().top){
												textbox.scrollTop=this.parentNode.offsetTop;
											}
											
										}
									});
								}
								else{
									hideChar.innerHTML=animChar.innerHTML=text[i];
								}
								
								frag([animChar],showChar);
								frag([showChar,hideChar],thisChar);
								
								//Set the display time here- but if we're paused, no delay!
								if(!S.window.classList.contains('showpony-paused') && !multimediaSettings.input) showChar.style.animationDelay=totalWait+'s';
								
								//Set animation timing for animChar, based on the type of animation
								if(thisChar.classList.contains('showpony-char-sing')){
									animChar.style.animationDelay=-(letters.length*.1)+'s';
								}
								
								if(thisChar.classList.contains('showpony-char-shake')){
									animChar.style.animationDelay=-(Math.random()*3)+'s';
								}
								
								//Add the char to the document fragment
								currentParent.appendChild(thisChar);
								totalWait+=waitTime;
								
								lastLetter=showChar;
								
								break;
						}
					}
					
					//If the user's trying to skip text, let them
					if(multimediaSettings.input && text[text.length-1]=='>'){
						console.log('Hey! skip this!');
					}else{
						multimediaSettings.input=false;
					}
					
					if(S.objects[multimediaSettings.textbox].dataset.async!=true){
					
						lastLetter.addEventListener('animationstart',function(event){
							if(this!==event.target) return;
							
							//If we aren't waiting to continue, continue
							if(!multimediaSettings.wait){
								runMM();
							}else{
								//If we need players to click to continue (and they have no inputs to fill out or anything), notify them:
								if(!S.objects[multimediaSettings.textbox].querySelector('input')){
									S.multimedia.window.appendChild(continueNotice);
								}
							}
						});
					}
					
					//Add the chars to the textbox
					S.objects[multimediaSettings.textbox].appendChild(fragment);
					
					//Continue if async textbox
					if(S.objects[multimediaSettings.textbox].dataset.async==true) runMM();
					break;
			}
			break;
		case 'play':
		case 'pause':
			
			//Pause the audio if we're paused; it can start playing later
			if(S.window.classList.contains('showpony-paused')){
				if(command==='play') S.objects[object].wasPlaying=true;
				else{
					S.objects[object].wasPlaying=false;
					S.objects[object].pause();
				}
			}else S.objects[object][command]();
			
			runMM();
			break;
		case 'stop':
			S.objects[object].wasPlaying=false;
			S.objects[object].pause();
			S.objects[object].currentTime=0;
			
			runMM();
			break;
		case 'volume':
			S.objects[object].volume=parseFloat(vals[1]);
			runMM();
			break;
		case 'time':
			S.objects[object].currentTime=parseFloat(vals[1]);
			runMM();
			break;
		case 'speed':
			S.objects[object].playbackRate=parseFloat(vals[1]);
			runMM();
			break;
		case 'loop':
			S.objects[object].loop=true;
			runMM();
			break;
		default:
			break;
	}
}

function powerTimer(callback,delay){
	//Thanks to https://stackoverflow.com/questions/3969475/javascript-pause-settimeout

	const pT=this;
	
    var timerId,start;
	pT.remaining=delay;

    pT.pause=function(){
        window.clearTimeout(timerId);
        pT.remaining-=new Date()-start;
    };

    pT.resume=function(){
		if(pT.remaining<=0) return;
		
        start=new Date();
        window.clearTimeout(timerId);
        timerId=window.setTimeout(function(){
			callback();
			pT.end();
		},pT.remaining);
    };

	pT.end=function(){
		if(pT.remaining>0) window.clearTimeout(timerId);
		pT.remaining=0;
	}
	
    pT.resume();
}

var multimediaFunction={
	/*'en':()=> S.to({file:'+1'})*/
	//EV	event
	'ev':vals=>{
		//Dispatch the event the user requested to
		S.window.dispatchEvent(new CustomEvent(vals[1]));
	}
	,'tb':(vals)=>{
		//Set the current textbox
		multimediaSettings.textbox=vals[1];
	}
}

//Replace unsafe characters for filenames with safe ones, and vice-versa
function safeFilename(string,type){
	var a=['[fs]','[bs]','[gt]','[lt]','[c]','[a]','[q]','[qm]','[b]'];
	var b=['/','\\','>','<',':','*','\'','?','|'];

	//Swap values if changing TO a filename instead of FROM a filename
	if(type!=='from') [a,b]=[b,a];
	
	for(let i=0,len=a.length;i<len;i++) string=string.replace(a[i],b[i]);
	return string;
}

///////////////////////////////////////
////////////EVENT LISTENERS////////////
///////////////////////////////////////

var shortcutKeys={
	' ': 				()=>S.input()
	,'Enter': 			()=>S.input()
	,'ArrowLeft':		()=>S.to({time:'-10'})
	,'ArrowRight':		()=>S.to({time:'+10'})
	,'Home':			()=>S.to({time:'start'})
	,'End':				()=>S.to({time:'end'})
	,'MediaPrevious':	()=>S.to({file:'-1'})
	,'MediaNext':		()=>S.to({file:'+1'})
	,'MediaPlayPause':	()=>S.menu()
	,'f':				()=>S.fullscreen()
};

//If shortcut keys are enabled
if(S.shortcuts){
	function shortcutPermission(){
		//If shortcuts aren't always enabled, perform checks
		if(S.shortcuts!=='always'){
			//Exit if it isn't fullscreen
			if(S.window!==document.webkitFullscreenElement && S.window!==document.mozFullScreenElement && S.window!==document.fullscreenElement){
				//If needs to be focused
				if(S.shortcuts!=='fullscreen' && S.window!==document.activeElement) return false;
			}
		}
		
		return true;
	}
	
	//Keyboard presses
	window.addEventListener(
		'keydown'
		,function(event){
			//Don't use shortcut keys if we're writing into an input
			if(event.target.tagName==='INPUT') return;
			if(!shortcutPermission()) return;
			
			if(shortcutKeys[event.key]
				&& !event.ctrlKey
				&& !event.altKey
				&& !event.shiftKey
				&& !event.metaKey
			){
				event.preventDefault();
				shortcutKeys[event.key]();
			}
		}
	);
	
	//Scrolling
	/*content.addEventListener('wheel',function(event){
		if(event.ctrlKey) return;
		if(!shortcutPermission()) return;
		
		//Check if the cursor if over the window
		console.log(event.target);
		
		if(currentType==='multimedia'){
			if(event.deltaY<0){
				//Go back a keyframe's length, so we get to the previous keyframe
				var keyframeLength=S.files[S.currentFile].duration/keyframes.length;
				
				S.to({time:'-'+keyframeLength});
			}
		}
	});*/
}

//We need to set this as a variable to remove it later on
//This needs to be click- otherwise, you could click outside of Showpony, release inside, and the menu would toggle. This results in messy scenarios when you're using the UI.
var windowClick=function(event){
	//If we just ended scrubbing, don't toggle the menu at all
	if(scrubbing==='out'){
		scrubbing=false;
		return;
	}
	
	event.stopPropagation();
	S.menu(event);
};

//On clicking, we open the menu- on the overlay. But we need to be able to disable moving the bar outside the overlay, so we still activate menu here.
window.addEventListener('click',windowClick);

window.addEventListener('mouseup',function(event){
	//If we're not scrubbing, set scrubbing to false and return
	if(scrubbing!==true){
		scrubbing=false;
		return;
	}
	
	//Scrub the bar
	userScrub(event);
	
	scrubbing='out';
});

//On mousedown, we prepare to move the cursor (but not over overlay buttons)
overlay.addEventListener('mousedown',function(event){
	if(event.target===this){
		scrubbing=event.clientX;
		window.getSelection().removeAllRanges();
	}
});

//On touch end, don't keep moving the bar to the user's touch
overlay.addEventListener('touchend',userScrub);

//On dragging
window.addEventListener('mousemove',function(event){userScrub(event,true);});
overlay.addEventListener('touchmove',function(event){userScrub(event,true);});

//Menu buttons
fullscreenButton.addEventListener(
	'click'
	,event=>{
		S.fullscreen();
	}
);

if(S.subtitles){
	captionsButton.addEventListener(
		'change'
		,function(){
			S.currentSubtitles=this.options[this.selectedIndex].value==='None' ? null : this.value;
			S[currentType].displaySubtitles();
		}
	);
}else captionsButton.remove();

content.addEventListener('click',()=>{S.input();});

var sticky=false;

//Update the scrub bar when scrolling
pageTurn.addEventListener('scroll',function(event){
	event.stopPropagation();
	
	if(S.infiniteScroll){
		//if(content.classList.contains('showpony-loading')) return;
		
		console.log(sticky);
		
		//Set current time to percent scrolled
		if(!scrubbing && sticky===false){
			var parts=pageTurn.children;
			for(var i=0;i<parts.length;i++){
				//If we're beyond a part
				if(pageTurn.scrollTop>parts[i].offsetTop+parts[i].offsetHeight) continue;
				
				S.currentFile=parseInt(parts[i].dataset.file);
				
				timeUpdate(S.files[S.currentFile].duration*((pageTurn.scrollTop-parts[i].offsetTop)/parts[i].offsetHeight));
				
				break;
			}
		}
		
		//If 1 page height away from bottom
		if(this.scrollTop>=this.scrollHeight-this.clientHeight*2){
			for(var i=S.currentFile+1;i<S.files.length;i++){
				
				var check=content.querySelector('[data-file="'+i+'"]');
				
				//Not started loading
				if(!check){
					pageTurn.insertAdjacentHTML('beforeend','<div data-file="'+i+'"></div>');
					S.to({file:i});
					return;
				}
				
				//Keep the loop going if it has text
				if(!check.innerHTML){
					return;
				}
			}
		}
		
		//If 1 page height away from top
		if(this.scrollTop<=this.clientHeight){
			for(var i=S.currentFile-1;i>=0;i--){
				console.log(i);
				
				var check=content.querySelector('[data-file="'+i+'"]');
				
				//Not started loading
				if(!check){
					pageTurn.insertAdjacentHTML('afterbegin','<div data-file="'+i+'"></div>');
					S.to({file:i});
					return;
				}
				
				//Keep the loop going if it has text
				if(!check.innerHTML){
					return;
				}
			}
		}
		
		sticky=false;
	}else{
		//Set current time to percent scrolled
		timeUpdate(S.files[S.currentFile].duration*(this.scrollTop/this.scrollHeight));
		
		//If at top
		if(this.scrollTop<=0){
			S.to({time:'-1'});
		}
		
		//If at bottom
		if(this.scrollTop>=this.scrollHeight-this.scrollTop){
			S.to({file:'+1'});
		}
	}
});

function updateInfo(pushState){
	//Update the scrub bar
	if(scrubbing!==true) scrub();
	
	//If using queries with time, adjust query on time update
	if(S.query){
		var newURL=document.location.href
			,newQuery=''
		;
		
		//Choose whether to add an ampersand or ?
		//Choose a ? if one doesn't exist or it exists behind the query
		newQuery=(newURL.indexOf('?')===-1 || new RegExp('\\?(?='+S.query+'=)').test(newURL)) ? '?' : '&';
		
		newQuery+=S.query+'='+(Math.floor(getCurrentTime()));
		
		//Replace either the case or the end
		newURL=newURL.replace(new RegExp('(((\\?|&)'+S.query+')=?[^&#]+)|(?=#)|$'),newQuery);
		
		if(location.href!==newURL) history[pushState ? 'pushState' : 'replaceState']({},'',newURL);
	}
}

//Hiding the webpage
S.hidden=false;

document.addEventListener('visibilitychange',function(){
	S.hidden=document.hidden;
});

//Gamepad support

//Showpony framerate- which is connected not to animations, etc, but to gamepad use and games
S.gamepad=null;
var framerate=60;
var checkGamepad=null;

window.addEventListener('gamepadconnected',function(e){
	S.gamepad={
		id:e.gamepad.index
		,menu:-1
		,input:-1
		,analogL:0
		,analogLPress:-1
		,dpadL:-1
		,dpadR:-1
		,fullscreen:-1
		,axisMin:.25
		,axisMax:1
	};
	
	if(checkGamepad===null) checkGamepad=setInterval(gamepadControls,1000/framerate);
});

window.addEventListener('gamepaddisconnected',function(e){
	//Ignore if it's not the same gamepad
	if(e.gamepad.index!==S.gamepad.id) return;
	
	S.gamepad=null;
	clearInterval(checkGamepad);
	checkGamepad=null;
});

function gamepadControls(){
	//Exit if the window isn't in focus
	if(S.hidden) return;
	
	if(S.gamepad!==null){
		//If shortcuts aren't always enabled, perform checks
		if(S.shortcuts!=='always'){
			//Exit if it isn't fullscreen
			if(S.window!==document.webkitFullscreenElement && S.window!==document.mozFullScreenElement && S.window!==document.fullscreenElement){
				//If needs to be focused
				if(S.shortcuts!=='fullscreen' && S.window!==document.activeElement) return;
			}
		}
		
		var gamepad=navigator.getGamepads()[S.gamepad.id];
		
		//XBOX Gamepad
		if(/xinput/i.test(gamepad.id)){
			gamepadButton(gamepad,9,'menu');		//Start
			gamepadButton(gamepad,0,'input');		//A
			gamepadButton(gamepad,14,'dpadL');		//Dpad Left
			gamepadButton(gamepad,15,'dpadR');		//Dpad Right
			gamepadButton(gamepad,8,'fullscreen');	//Select
			gamepadButton(gamepad,6,'home');		//Left trigger
			gamepadButton(gamepad,7,'end');			//Right trigger
				
			gamepadAxis(gamepad,0,'analogL');		//Left analogue
		//Normal, average gamepad
		}else{
			gamepadButton(gamepad,9,'menu');		//Start
			gamepadButton(gamepad,0,'input');		//A
			gamepadButton(gamepad,8,'fullscreen');	//Select
			gamepadButton(gamepad,6,'home');		//Left trigger
			gamepadButton(gamepad,7,'end');			//Right trigger
		}
		
		//Register inputs
		if(S.gamepad.menu==2) S.menu();
		if(S.gamepad.input==2) S.input();
		if(S.gamepad.dpadL==2) S.to({file:'-1'});
		if(S.gamepad.dpadR==2) S.to({file:'+1'});
		if(S.gamepad.end==2) S.to({time:'end'});
		if(S.gamepad.home==2) S.to({time:'start'});
		if(S.gamepad.fullscreen==2) S.fullscreen();
		
		//Scrubbing with the analogue stick
		if(S.gamepad.analogLPress===2){
			overlay.style.opacity=1; //Show the overlay
			pos=0;
		}
	
		if(S.gamepad.analogL!==0){
			
			scrubbing=S.gamepad.analogL;
			userScrub(S.gamepad.analogL,true);
		}
		
		if(S.gamepad.analogLPress===-2){
			overlay.style.opacity=''; //Hide the overlay
			//If we're not scrubbing, set scrubbing to false and return
			if(scrubbing!==true){
				scrubbing=false;
			}else{
				userScrub(S.gamepad.analogL);
				pos=0;
			}
		}
	}
}

function gamepadAxis(gamepad,number,type){
	//Active space
	var min=S.gamepad.axisMin;
	var max=S.gamepad.axisMax;
	
	//Get amount between -1 and 1 based on distance between values
	if(Math.abs(gamepad.axes[number])>=min){
		if(gamepad.axes[number]>0) S.gamepad[type]=(gamepad.axes[number]-min)/(max-min);
		else S.gamepad[type]=((gamepad.axes[number]-(-max))/(-min-(-max)))-1;
		
		//Set pressing values right
		if(S.gamepad[type+'Press']<0) S.gamepad[type+'Press']=2;
		else S.gamepad[type+'Press']=1;
	}else{
		S.gamepad[type]=0;
		
		//Set pressing values right
		if(S.gamepad[type+'Press']>0) S.gamepad[type+'Press']=-2;
		else S.gamepad[type+'Press']=-1;
	}
}

function gamepadButton(gamepad,number,type){
	if(gamepad.buttons[number].pressed){
		//Set pressing values right
		if(S.gamepad[type]<0) S.gamepad[type]=2;
		else S.gamepad[type]=1;
	}else{
		if(S.gamepad[type]>0) S.gamepad[type]=-2;
		else S.gamepad[type]=-1;
	}
}


///////////////////////////////////////
/////////////////START/////////////////
///////////////////////////////////////

//Make sure setup is made of multiple Promises that can run asyncronously- and that they do!

content.classList.add('showpony-loading');

//Empty the current window
S.window.innerHTML='';

if(S.cover){
	if(S.cover.image) cover.style.backgroundImage='url("'+S.cover.image+'")';
	if(S.cover.content){
		//Assume surrounding <p> tags if it doesn't include surrounding HTML tags
		if(/^<[^>]+>.+<\/[^>]+>$/.test(S.cover.content)) cover.innerHTML=S.cover.content;
		else cover.innerHTML='<p>'+S.cover.content+'</p>';
	}
	S.window.appendChild(cover);
	
	cover.addEventListener('click',function(){
		this.remove();
		cover=null;
		S.menu(null,'play');
	});
}

//And fill it up again!
frag([styles,content,subtitles,overlay],S.window);

var json=<?php echo json_encode($response,JSON_NUMERIC_CHECK); ?>;
S.files=json.files;
S.duration=S.files.map(function(e){return e.duration;}).reduce((a,b) => a+b,0);

/////////////////////
//Get Hey Bard account
/////////////////////

//User accounts and bookmarks always on

//Local saving is simple- remote saving, we'll connect straight to the database with a special account (or come up with something else, but we'll get it in PHP)

//Also- why not use local and remote in tandem? If disconnect, we'll save the value in local; and then upload it remotely. Rather than one, why not both so that we keep the info if we have trouble in one place?
//We track Hey Bard time last visited; if we check that against the user's localStorage save time, we'll be golden!

//Priority: Newest > Default Start

var start=null;

/*function getBookmark(){
	var bookmark=null;
	
		//Set a function to save bookmarks
		S.saveBookmark=function(){
			var saveValue=Math.floor(getCurrentTime());
			localStorage.setItem(S.saveId,saveValue);
			
			return saveValue;
		}
		
		bookmark=parseInt(localStorage.getItem(S.saveId));
	}
}*/

S.saveBookmark=function(){};

var saveBookmark=S.saveBookmark;

//Save user bookmarks when leaving the page
window.addEventListener('blur',saveBookmark);
window.addEventListener('beforeunload',saveBookmark);

//Showpony deselection (to help with Firefox and Edge's lack of support for 'beforeunload')
S.window.addEventListener('focusout',saveBookmark);
S.window.addEventListener('blur',saveBookmark);

//Start at the first legit number: start, input.start, or the last file
if(start===null){
	switch(S.start){
		case 'first':
			start=0;
			break;
		case 'last':
			start=S.files.length-1;
			break;
		default:
			start=parseInt(S.start);
			break;
	}
}

//These are the defaults for passObj, but it can be overwritten if we're using a querystring
var passObj={time:start,scrollToTop:false};

//If querystrings are in use, consider the querystring in the URL
if(S.query){
	window.addEventListener(
		'popstate'
		,function(){
			var page=(new RegExp('(\\?|&)'+S.query+'[^&#]+','i').exec(window.location.href));
			
			//If we found a page
			if(page){
				page=parseInt(page[0].split('=')[1]);
				
				if(page===getCurrentTime()) return;
			
				S.to({time:page,popstate:true,scrollToTop:false});
			}
		}
	);
	
	var page=window.location.href.match(new RegExp('(\\?|&)'+S.query+'[^&#]+','i'));
	if(page) page=parseInt(page[0].split('=')[1]);
	
	//General pass object
	passObj={
		popstate:page ? true : false
		,replaceState:page ? false : true //We replace the current state in some instances (like on initial page load) rather than adding a new one
		,scrollToTop:false
		,reload:true
	};
	
	passObj.time=(page!==null) ? page : start;
	
	S.to(passObj);
}

//Pause the Showpony
//S.menu(null,'pause');

//Use time or file to bookmark, whichever is requested
S.to(passObj);

//Set input to null in hopes that garbage collection will come pick it up
input=null;

//We don't remove the loading class here, because that should be taken care of when the file loads, not when Showpony finishes loading

if(S.subtitles){
	var obj=Object.keys(S.subtitles);
	
	//Add captions to options
	
	var option=m('captions-option','option');
	option.innerHTML='None';
	option.value='None';
	option.selected=true;
	option.addEventListener('click',function(){
		S.currentSubtitles=null;
	});
	captionsButton.appendChild(option);
	
	for(let i=0;i<obj.length;i++){
		let option=m('captions-option','option');
		option.innerHTML=obj[i];
		option.value=obj[i];
		option.addEventListener('click',function(){
			S.currentSubtitles=this.value;
		});
		captionsButton.appendChild(option);
	}
}

//Send an event to let the user know that Showpony has started up!
S.window.dispatchEvent(
	new CustomEvent('setup'
	,{detail:{
		state:'success'
	}})
);

///////////////////////////////////////
/////////////////ADMIN/////////////////
///////////////////////////////////////

/////With new admin panel, we just reload the entire Showpony- this avoids risk of any bugs with AJAX vs reality and the like

}

var <?=toCamelCase($name)?>=new Showpony();