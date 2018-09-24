<?php
if(isset($_GET['call']) and $_GET['call']==='css'){

header('Content-type: text/css');

?>
/*/////////////////////////////////////
////////////////GENERAL////////////////
/////////////////////////////////////*/

.showpony{
	background-color:#000;
	overflow:hidden;
	position:relative;
	width:100%;
	height:100%;
}

/*Loading Setup*/
.showpony-loading::after{
	content:" ";
	display:block;
	position:absolute;
	border-radius:100%;
	top:50%;
	left:50%;
	width:2em;
	height:2em;
	pointer-events:none;
}

/*Automatic loading with these, and disable animations*/
.showpony-loading,.showpony-loading *
,.showpony-paused .showpony-content, .showpony-paused  .showpony-content *{
	animation-play-state:paused !important; /*Disables general animations and text animations, so we freeze while loading*/
}

.showpony-cover{
	z-index:2;
	position:absolute;
	width:100%;
	height:100%;
	background-size:cover;
	background-position:50%;
	cursor:pointer;
	display:flex;
	font-size:3em;
	justify-content:center;
	align-items:center;
	color:white;
}

.showpony-cover>p{
	background-color:rgba(0,0,0,0.5);
	box-sizing:border-box;
	padding:1em;
	transition:transform .25s;
	transform:scale(1);
	text-align:center;
}

.showpony-cover>p:hover{
	transform:scale(1.1);
}

/*/////////////////////////////////////
/////////////////MENU//////////////////
/////////////////////////////////////*/

.showpony-overlay{
	position:absolute;
	top:0;
	left:0;
	right:0;
	bottom:0;
	opacity:0;
	color:#000;
	background-color:rgba(255,255,255,.5);
	
	-ms-user-select:none;
	-moz-user-select:none;
	-webkit-user-select:none;
	user-select:none;
}

.showpony-paused .showpony-overlay{
	opacity:1;
}

.showpony-paused .showpony-overlay{
	background-color:rgba(255,255,255,.5);
}

.showpony-overlay-text{
	position:absolute;
	width:100%;
	height:100%;
	pointer-events:none;
	
	font-family:monospace;
	font-size:2.5em;
	margin:0;
	padding:.25em;
}

.showpony-overlay button{
	border:none;
	width:3rem;
	height:3rem;
	pointer-events:auto;
	cursor:pointer;
}

.showpony-overlay-buffer{
	width:100%;
	top:3.25em;
	height:.25em;
	position:absolute;
	pointer-events:none;
	opacity:.5;
	background-color:black;
}

/*Menu scrub bar*/
.showpony-progress{
	position:absolute;
	top:3.25em;
	
	width:1em;
	height:.25em;
	background-color:#fff;
	transform:translate(-.5em,0);
	pointer-events:none;
}

.showpony-content{
	width:100%;
	height:100%;
	position:absolute;
	
	-ms-user-select:none;
	-moz-user-select:none;
	-webkit-user-select:none;
	user-select:none;
	
	color:white;
	z-index:0;
}

.showpony-block{
	left:0;
	top:0;
	width:100%;
	height:100%;
	cursor:pointer;
	object-fit:contain;
}

/*Fullscreen display*/
:-webkit-full-screen{
	width:100%;
	height:100%;
}

:-webkit-full-screen:focus{
	outline:none;
}

/*If fullscreen isn't supported, this is applied to the element*/
.showpony-fullscreen-alt{
	position:fixed !important;
	top:0;
	left:0;
	right:0;
	bottom:0;
	height:100%;
	width:100%;
	margin:0;
	padding:0;
}

/*Control goes on html to prevent scrolling*/
.showpony-fullscreen-control{
	overflow:hidden;
}

.showpony-fullscreen-alt:focus{
	outline:none;
}

/*/////////////////////////////////////
///////////////SUBTITLES///////////////
/////////////////////////////////////*/

.showpony-subtitles{
	position:absolute;
	width:100%;
	height:100%;
	pointer-events:none;
}

.showpony-sub{
	position:absolute;
	background-color:rgba(0,0,0,0.64);
	color:white;
	overflow:auto;
	font-size:1.5em;
	padding:.5em;
	box-sizing:border-box;
	margin:0;
	pointer-events:auto;
	
	left:10%;
	width:80%;
	top:70%;
	height:20%;
}

/*/////////////////////////////////////
/////////////////TEXT//////////////////
/////////////////////////////////////*/

.showpony-page-turn{
	overflow:auto;
	height:100%;
	width:100%;
	padding:1em;
	box-sizing:border-box;
	background-color:white;
	color:black;
	word-break:break-word;
}

/*/////////////////////////////////////
/////////////VISUAL NOVEL//////////////
/////////////////////////////////////*/

.showpony-textbox{
	width:100%;
	background-color:rgba(0,0,0,.8);
	box-sizing:border-box;
	color:#fff;
	font-family:Arial;
	z-index:10;
	position:absolute;
	bottom:0;
	padding:1em;
	height:4em;
	max-height:100%;
	overflow:auto;
	opacity:1;
	
	user-select:none;
	-webkit-user-select:none;
	-ms-user-select:none;
	-moz-user-select:none;
	font-size:2em;
	
	word-wrap:break-word;
	word-break:normal;
	break-word:normal;
	overflow-wrap:break-word;
	white-space:nowrap;
}

.showpony-textbox input{
	pointer-events:auto;
	font-size:1em;
	padding:0;
	border:none;
	padding:.25em;
	background-color:#fff;
}

.showpony-textbox input[type="button"]
,.showpony-textbox input[type="submit"]{
	cursor:pointer;
	background-color:#e9e9e9;
}

.showpony-textbox input[type="button"]:hover
,.showpony-textbox input[type="submit"]:hover{
	background-color:#bcbcbc;
}

.showpony-textbox input[type="button"]{
	cursor:pointer;
	background-color:#e9e9e9;
	margin:.25em;
}

.showpony-name{
	background-color:#000;
	padding:.4em;
	left:0;
	position:absolute;
	z-index:11;
	bottom:4em;
	font-size:2em;
	font-family:Arial;
	font-weight:bold;
}

.showpony-background{
	width:100%;
	height:100%;
	z-index:0;
	position:absolute; /*The background flickers when switching between parts if the background is the same with this on. If we run into problems later on with background positioning, we may need to turn this back on.*/
	background-position:50% 50%;
	background-repeat:no-repeat;
	background-size:cover;
	
	pointer-events:none; /*Sometimes backgrounds are in front of scrollable elements. We need to not let that mess things up.*/
}

.showpony-character{
	width:100%;
	height:90%;
	bottom:0%;
	left:0%;
	position:absolute;
	z-index:5;
	
	pointer-events:none; /*Sometimes characters are in front of scrollable elements. We need to not let that mess things up.*/
}

.showpony-character-image{
	background-position:50% -20%;
	background-repeat:no-repeat;
	background-size:contain;
	opacity:1;
}
.showpony-character div{
	width:100%;
	height:100%;
	position:absolute;
}

.showpony-continue{
	color:white;
	position:absolute;
	right:0;
	bottom:0;
	z-index:11;
	margin:1.75em 2em;
	width:3em;
	height:3em;
	pointer-events:none;
	visibility:hidden;
	animation:arrow-point 1s ease infinite alternate 3s;
	background-size:contain;
	background-repeat:no-repeat;
	background-image:url("data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none' viewBox='0 0 10 10'%3E%3Cg fill='%23fff'%3E%3Cpath d='M.35 3.14h3.27v3.71H.35z'/%3E%3Cpath d='M2.23.7L9.65 5 2.23 9.3z'/%3E%3C/g%3E%3C/svg%3E");
	filter:drop-shadow(0 0 1px #000);
}

@keyframes arrow-point{
	0%{
		transform:translate(0em,0);
		visibility:visible;
	}
	100%{
		transform:translate(-.5em,0);
		visibility:visible;
	}
}

.showpony-char-container{
	visibility:hidden;
	font-size:1em;
	color:inherit;
	font-weight:inherit;
	font-style:inherit;
}

.showpony-char{
	position:absolute;
	display:inline-block;
}

.showpony-char-anim{
	position:relative;
	display:inline-block;
}

.showpony-char-placeholder{
	visibility:hidden;
}

.showpony-char-container>.showpony-char{
	animation:kn-display 1s linear;
	animation-fill-mode:forwards;
}

@keyframes kn-display{
	0% {visibility:visible;}
	100% {visibility:visible;}
}

.showpony-char-shout>.showpony-char{
	animation:kn-shout .1s linear forwards;
}

@keyframes kn-shout{
	0% {visibility:visible;transform:scale(2);}
	100% {visibility:visible;transform:scale(1);}
}

.showpony-char-fade>.showpony-char{
	animation:kn-fade .1s linear forwards;
}

@keyframes kn-fade{
	0% {visibility:visible;opacity:0;}
	100% {visibility:visible;opacity:1;}
}

.showpony-char-sing .showpony-char-anim{
	animation:kn-sing 1.5s ease-in-out infinite;
}

@keyframes kn-sing{
	0%{transform:translate(0,-.2em);}
	50%{transform:translate(0,.2em);}
	100%{transform:translate(0,-.2em);}
}

.showpony-char-shake .showpony-char-anim{
	animation:kn-shake .2s linear infinite;
}

@keyframes kn-shake{
	0%{transform:translate(.05em,.125em);}
	25%{transform:translate(-.05em,-.125em);}
	50%{transform:translate(-.05em,.125em);}
	75%{transform:translate(.05em,-.125em);}
	100%{transform:translate(.05em,.125em);}
}
<?
	die('/*CSS generated by PHP*/');
}

header('Content-type: application/javascript');

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

$media=[
	'text'			=>false
	,'image'		=>false
	,'audio'		=>false
	,'video'		=>false
	,'multimedia'	=>false
];

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
								break;
							default:
								$infiniteScroll=true;
								break;
						}
						break;
					case 'image':
						break;
					case 'audio':
					case 'video':
						break;
				}
				
				$media[$fileInfo['medium']]=true;
				
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
if(!document.querySelector('[href$="showpony.php?call=css"]')) document.head.insertAdjacentHTML('beforeend','<link type="text/css" rel="stylesheet" href="'+ShowponyFolder+'/showpony.php?call=css">');

function Showpony(input={}){

//Engine settings
const S=this;

S.window=document.createElement('div');
S.window.className='showpony';
S.window.tabindex='0';
S.paused=false;

S.name='<?=toCamelCase($name)?>';

S.window.innerHTML=`
	<style class="showpony-style" type="text/css"></style>
	<div class="showpony-content"></div>
	<div class="showpony-subtitles"></div>
	<div class="showpony-overlay">
		<canvas class="showpony-overlay-buffer" width="1000" height="1"></canvas>
		<div class="showpony-progress" style="left: 14.5688%;"></div>
		<p class="showpony-overlay-text">1 | 3</p>
		<button class="showpony-button showpony-fullscreen-button" alt="Fullscreen" title="Fullscreen Toggle"></button>
		<select class="showpony-captions-button" title="Closed Captions/Subtitles" alt="Closed Captions/Subtitles"></select>
	</div>
`;

var styles=				S.window.getElementsByClassName('showpony-style')[0];
var content=			S.window.getElementsByClassName('showpony-content')[0];
var subtitles=			S.window.getElementsByClassName('showpony-subtitles')[0];
var overlay=			S.window.getElementsByClassName('showpony-overlay')[0];
var overlayBuffer=		S.window.getElementsByClassName('showpony-overlay-buffer')[0];
var progress=			S.window.getElementsByClassName('showpony-progress')[0];
var overlayText=		S.window.getElementsByClassName('showpony-overlay-text')[0];
var fullscreenButton=	S.window.getElementsByClassName('showpony-fullscreen-button')[0];
var captionsButton=		S.window.getElementsByClassName('showpony-captions-button')[0];
var captionsButton=		S.window.getElementsByClassName('showpony-captions-button')[0];

document.currentScript.insertAdjacentElement('afterend',S.window);

///////////////////////////////////////
///////////PUBLIC VARIABLES////////////
///////////////////////////////////////

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
S.saveId=location.hostname.substring(0,20);
S.preloadNext=1;
S.currentSubtitles=null;
S.cover=null;

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
	
	///GET TIME AND FILE///
	
	//Special values
	if(obj.file==='last') obj.file=S.files.length-1;
	if(obj.time==='end') obj.time=S.duration-10;
	
	//Relative adjustments if the values have - or +. If both are relative, file will be relative and time will instead be absolute to avoid strange behavior.
	if(/-|\+/.test(obj.file)) obj.file=S.currentFile+parseInt(obj.file);
	else if(/-|\+/.test(obj.time)) obj.time=S.currentTime+parseFloat(obj.time);
	
	//Minimal time and file values are 0
	obj.file=Math.max(0,obj.file || 0);
	obj.time=Math.max(0,parseFloat(obj.time) || 0);
	
	//Based on time, get the right file
	for(obj.file;obj.file<S.files.length;obj.file++){
		if(obj.time<S.files[obj.file].duration) break; //We've reached the file
		
		obj.time-=S.files[obj.file].duration;
	}
	
	//If we're at the end, pause and run an event
	if(obj.file>=S.files.length){
		obj.file=S.files.length-1;
		
		//Run the event that users can read
		S.window.dispatchEvent(new CustomEvent('end'));
	}
	
	//Only start images at beginning; you can't go into the "middle" of image
	if(S.files[obj.file].medium==='image') obj.time=0;
	
	///LOAD RIGHT MEDIUM AND SOURCE///
	
	//If switching types, do some cleanup
	if(currentType!==S.files[obj.file].medium){
		content.innerHTML='';
		content.appendChild(S[S.files[obj.file].medium].window);
	}
	
	currentType=S.files[obj.file].medium;
	
	//Load the file
	if(S.files[obj.file].buffered===false) S.files[obj.file].buffered='buffering';
	
	S[currentType].src(obj.file,obj.time).then(()=>{
		S.currentFile=S[currentType].currentFile=obj.file;
		S[currentType].timeUpdate(obj.time);
		S[currentType].goToTime=obj.time;
		timeUpdate(obj.time);
		
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
		
		updateHistory(obj.history);
	});
}

/*
Updating file with infinite scroll

}else if(!content.querySelector('[data-file]')){
	S.currentFile=obj.file;
}*/

/*
//If it's the same and we're using infinite scrolling
if(S.infiniteScroll){//Scroll to the right spot
	var part=document.querySelector('[data-file="'+obj.file+'"]');

	pageTurn.scrollTop=part.offsetTop+part.offsetHeight*(obj.time/S.files[obj.file].duration);
}else{ //Page turn
	
}*/

/*//Use either infinite text or page turn, whichever is requested
if(S.infiniteScroll || S.files[obj.file].medium==='text'){
	content.appendChild(pageTurn);
}else{
	content.classList.remove('showpony-loading');
}
*/

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

S.play=function(){
	if(S.paused===false) return;
	
	S.window.classList.remove('showpony-paused');
	S.paused=false;
	S[currentType].play();
	S.window.dispatchEvent(new CustomEvent('play'));
}

S.pause=function(){
	if(S.paused===true) return;
	
	S.window.classList.add('showpony-paused');
	S.paused=true;
	S[currentType].pause();
	S.window.dispatchEvent(new CustomEvent('pause'));
}

S.toggle=function(){
	S[S.paused ? 'play' : 'pause']();
}

S.fullscreen=false;

//Toggle fullscreen, basing the functions on the browser's abilities
if(S.window.requestFullscreen){
	S.fullscreenEnter=function(){
		if(document.fullscreenElement) return;
		
		S.fullscreen=true;
		S.window.requestFullscreen();
		S.window.dispatchEvent(new CustomEvent('fullscreenEnter'));
	}
	
	S.fullscreenExit=function(){
		if(!document.fullscreenElement) return;
		
		document.fullscreenExit();
		S.window.dispatchEvent(new CustomEvent('fullscreenExit'));
	}
	
	S.fullscreenToggle=function(){
		if(document.fullscreenElement) S.fullscreenExit();
		else S.fullscreenEnter();
	}
	
	document.addEventListener('fullscreenchange',function(){
		if(document.fullscreenElement===S.window) S.fullscreen=true;
		else S.fullscreen=false;
	});
}
else if(S.window.webkitRequestFullscreen){
	S.fullscreenEnter=function(){
		if(document.webkitFullscreenElement) return;
		
		S.window.webkitRequestFullscreen();
		S.window.dispatchEvent(new CustomEvent('fullscreenEnter'));
	}
	
	S.fullscreenExit=function(){
		if(!document.webkitFullscreenElement) return;
		
		document.webkitExitFullscreen();
		S.window.dispatchEvent(new CustomEvent('fullscreenExit'));
	}
	
	S.fullscreenToggle=function(){
		if(document.webkitFullscreenElement) S.fullscreenExit();
		else S.fullscreenEnter();
	}
	
	document.addEventListener('webkitfullscreenchange',function(){
		if(document.webkitFullscreenElement===S.window) S.fullscreen=true;
		else S.fullscreen=false;
	});
}
else if(S.window.mozRequestFullScreen){
	S.fullscreenEnter=function(){
		if(document.mozFullScreenElement) return;
		
		S.window.mozRequestFullScreen();
		S.window.dispatchEvent(new CustomEvent('fullscreenEnter'));
	}
	
	S.fullscreenExit=function(){
		if(!document.mozFullScreenElement) return;
		
		document.mozCancelFullScreen();
		S.window.dispatchEvent(new CustomEvent('fullscreenExit'));
	}
	
	S.fullscreenToggle=function(){
		if(document.mozFullScreenElement) S.fullscreenExit();
		else S.fullscreenEnter();
	}
	
	document.addEventListener('mozfullscreenchange',function(){
		if(document.mozFullScreenElement===S.window) S.fullscreen=true;
		else S.fullscreen=false;
	});
}
else{
	S.fullscreenEnter=function(){
		if(S.window.classList.contains('showpony-fullscreen-alt')) return;
		
		S.window.classList.add('showpony-fullscreen-alt');
		document.getElementsByTagName('html')[0].classList.add('showpony-fullscreen-control');
		
		S.window.dataset.prevz=S.window.style.zIndex || 'initial';
		
		//From: https://stackoverflow.com/questions/1118198/how-can-you-figure-out-the-highest-z-index-in-your-document
		S.window.style.zIndex=Array.from(document.querySelectorAll('body *'))
		   .map(a => parseFloat(window.getComputedStyle(a).zIndex))
		   .filter(a => !isNaN(a))
		   .sort((a,b)=>a-b)
		   .pop()+1;
		   
		S.fullscreen=true;
		S.window.dispatchEvent(new CustomEvent('fullscreenEnter'));
	}
	
	S.fullscreenExit=function(){
		if(!S.window.classList.contains('showpony-fullscreen-alt')) return;
		
		S.window.classList.remove('showpony-fullscreen-alt');
		document.getElementsByTagName('html')[0].classList.remove('showpony-fullscreen-control');
		
		//Get the original z-index value
		S.window.style.zIndex=S.window.dataset.prevz;
		S.window.removeAttribute('data-prevz');
		
		S.fullscreen=false;
		S.window.dispatchEvent(new CustomEvent('fullscreenExit'));
	}
	
	S.fullscreenToggle=function(){
		if(S.window.classList.contains('showpony-fullscreen-alt')) S.fullscreenExit();
		else S.fullscreenEnter();
	}
}

//When the viewer inputs to Showpony (click, space, general action)
S.input=function(){
	if(S.paused) S.play();
	else S[currentType].input();
}

///////////////////////////////////////
///////////PRIVATE VARIABLES///////////
///////////////////////////////////////

var scrubbing=false
	,waitTimer=new powerTimer(function(){},0)
	,currentType=null
;

var cover=document.createElement('div');
cover.className='showpony-cover';
var pageTurn=document.createElement('div');
pageTurn.className='showpony-page-turn';

frag([overlayBuffer,progress,overlayText,fullscreenButton,captionsButton],overlay);

///////////////////////////////////////
///////////PRIVATE FUNCTIONS///////////
///////////////////////////////////////

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
	
	var scrubPercent=(pos-S.window.getBoundingClientRect().left)/(S.window.getBoundingClientRect().width);
	
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
					updateHistory('add');
				}
			}
			else return;
		}
		
		//Don't want the users to accidentally swipe to another page!
		if(input==='touch') event.preventDefault();
		
		scrub(scrubPercent,true);
	}else{
		//Drag on the menu to go to any part
		
		if(scrubbing===true){
			scrubbing=false;
		
			//If we don't preload while scrubbing, load the file now that we've stopped scrubbing
			if(S.scrubLoad===false){
				//Load the file our pointer's on
				scrub(scrubPercent,true);
				
			}
			
			return true; //Exit the function
		}
		
		//scrubbing needs to be set to false here too; either way it's false, but we need to allow the overlay to update above, so we set it to false earlier too.
		scrubbing=false;
	}
}

function timeUpdate(time){
	if(!isNaN(time)){
		//Don't exceed the file's duration
		var duration=S.files[S.currentFile].duration;
		if(time>duration) time=duration;
		S[currentType].timeUpdate(time);
	}
	
	//Get the current time in the midst of the entire Showpony
	S.currentTime=S[currentType].currentTime
	for(let i=0;i<S.currentFile;i++) S.currentTime+=S.files[i].duration;
	
	S[currentType].displaySubtitles();
	
	if(scrubbing!==true) scrub(null,false);
	
	updateHistory('replace');
	
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
	
	//Show buffer//
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

//Update the scrubber's position
function scrub(inputPercent=null,loadFile=false){
	//"sticky" is an infinite scroll-related variable
	//if(sticky!==false) return;
	
	//If no inputPercent was set, get it!
	if(inputPercent===null) inputPercent=S.currentTime/S.duration;
	
	if(inputPercent<0) inputPercent=0;
	if(inputPercent>1) inputPercent=1;
	
	var timeInTotal=S.duration*inputPercent;
	
	///LOADING THE SELECTED FILE///
	if(loadFile){
		if(S.scrubLoad || scrubbing===false) S.to({time:timeInTotal});
	}
	
	//Move the progress bar
	progress.style.left=(inputPercent*100)+'%';
	
	<? if($media['audio'] || $media['video'] || $media['multimedia']){ ?>
	///INFO TEXT WITH TIME///
	function infoMake(input,pad=(String((S.duration / 60)|0).length)){
		//|0 is a shorter way to floor floats.
		return String((input)|0).padStart(pad,'0');
	}
	
	var info=infoMake(timeInTotal / 60)+':'+infoMake(timeInTotal % 60,2)+' | '+infoMake((S.duration-timeInTotal) / 60)+':'+infoMake((S.duration-timeInTotal) % 60,2)
	;
	<? }else{ ?>
	///INFO TEXT WITH FILE///
	function infoMake(input){
		return String(input).padStart((String(S.files.length).length),'0');
	}
	
	var newPart=0;
	for(var i=timeInTotal;i>S.files[newPart].duration;i-=S.files[newPart].duration) newPart++;
	
	var info=infoMake(newPart+1)+' | '+infoMake(S.files.length-(newPart+1))
	;
	<? } ?>
	
	if(info!==overlayText.innerHTML) overlayText.innerHTML=info;
	
	//We don't want to over-update the title, so we stick with when we're not scrubbing.
	if(info!==document.title && scrubbing===false) document.title=info;
}

//Use documentFragment to append elements faster
function frag(inputArray,inputParent){
	var fragment=document.createDocumentFragment();
	
	for(let i=0, len=inputArray.length;i<len;i++) fragment.appendChild(inputArray[i]);
	
	inputParent.appendChild(fragment);
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

<?php if($media['text']){ ?>

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

<?php }

if($media['image']){
	
?>

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

<?php }

if($media['audio'] or $media['video']){

?>

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
		S.toggle();
	}
	
	P.timeUpdate=function(time=0){
		P.currentTime=P.window.currentTime=time;
	}
	
	P.goToTime=0;
	
	P.src=function(file=0,time=0){
		return new Promise(function(resolve,reject){
			//Change the file if it'd be a new one
			if(P.currentFile!==file) P.window.src=S.files[file].path;
			
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
						
							var block=document.createElement('p');
							block.className='showpony-sub';
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
		if(!S.paused) S.to({file:'+1'});
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

<?php }

if($media['multimedia']){

?>

///////////////////////////////////////
/////////////VISUAL NOVEL//////////////
///////////////////////////////////////
function makeVisualNovel(){
	const P=this;
	
	P.currentTime=-1;
	P.currentFile=-1;
	P.currentLine=-1;
	
	P.window=document.createElement('div');
	P.window.className='showpony-multimedia';
	
	var runTo=false;
	var continueNotice=document.createElement('div');
	continueNotice.className='showpony-continue';
	var inputting=false;
	var wait=false;
	var currentTextbox='main';
	
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
			if(typeof(S.objects[key].wasPlaying)!=='undefined'){
				S.objects[key].pause();
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
		for(var key in S.objects){
			if(S.objects[key].tagName) S.objects[key].dispatchEvent(new Event('animationend'));
			else{
				console.log(S.objects[key]);
				S.objects[key].el.dispatchEvent(new Event('animationend'));
			}
		}
		
		var choices=false;
		
		//If the player is making choices right now
		if(S.objects[currentTextbox] && S.objects[currentTextbox].el.querySelector('input')) choices=true;
		
		//If all letters are displayed
		if(!S.objects[currentTextbox] || S.objects[currentTextbox].el.children.length===0 || S.objects[currentTextbox].el.lastChild.firstChild.style.visibility=='visible'){
			inputting=false;
			if(!choices) P.progress();
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
			
			inputting=true;
			
			//Continue if not waiting
			if(!wait) P.progress();
			else S.multimedia.window.appendChild(continueNotice);
		}
	}

	P.timeUpdate=function(time=0){
		P.currentTime=time;
	}
	
	P.src=function(file=0,time=0){
		return new Promise(function(resolve,reject){
			/////RESET THINGS//////
			//Get rid of local styles
			for(var key in S.objects){
				if(S.objects[key].tagName){
					S.objects[key].removeAttribute('style');
					//Empty out textboxes
					if(S.objects[key].classList.contains('showpony-textbox')) S.objects[key].innerHTML='';
				}
				else S.objects[key].el.removeAttribute('style');
			};
			
			//Multimedia engine resets
			styles.innerHTML='';
			waitTimer.end();
			
			/////END RESETTIN//////
			
			//If this is the current file
			if(P.currentFile===file){
				runTo=Math.round(keyframes.length*(time/S.files[P.currentFile].duration));
				if(runTo>=keyframes.length) runTo=keyframes[keyframes.length-1];
				else runTo=keyframes[runTo];
				
				console.log(runTo);
				
				P.progress(0);
				resolve();
			}
			
			//Save buffer to check later
			objectBuffer={};
			S.objects={};
			P.lines=[];
			
			var src=S.files[file].path;
			
			fetch(src,{credentials:'include'})
			.then(response=>{
				return response.text();
			})
			.then(text=>{
				//Remove multiline comments
				text=text.replace(/\/\*[^]*?\*\//g,'');
				
				//Get all non-blank lines
				P.lines=text.match(/.+(?=\S).+/g);
				
				//Get keyframes from the text- beginning, end, (? ->)and waiting points
				keyframes=[0];
				
				for(let i=1;i<P.lines.length;i++){
					//If it's a user file spot, add the point immediately after the last keyframe- things let up to this, let it all happen
					if(P.lines[i]==='engine.wait'){
						keyframes.push(keyframes[keyframes.length-1]+1);
						continue;
					}
					
					//Regular text lines (not continuing) can be keyframes
					if(/^\t+(?!\t*\+)/i.test(P.lines[i])) keyframes.push(i);
				}
				
				runTo=Math.round(keyframes.length*(P.currentTime/S.files[file].duration));
				if(runTo>=keyframes.length) runTo=keyframes[keyframes.length-1];
				else runTo=keyframes[runTo];
				
				P.currentFile=S.currentFile=file;
				P.progress(0);
				
				if(S.files[file].buffered!==true){
					S.files[file].buffered=true;
					getTotalBuffered();
				}
				
				console.log('MULTIMEDIA ENGINE RAN');
				
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
	
	//Run multimedia (interactive fiction, visual novels, etc)
	P.progress=function(inputNum=P.currentLine+1){
		//Go to either the specified line or the next one
		P.currentLine=inputNum;
		
		//Skip comments
		if(/^\/\//.test(P.lines[P.currentLine])){
			P.progress();
			return;
		}
		
		//Run through if we're running to a point; if we're there or beyond though, stop running through
		if(runTo!==false && P.currentLine>=runTo){
			runTo=false;
			inputting=false;
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
		if(runTo===false && keyframes.includes(P.currentLine)){
			//Set the time of the element
			timeUpdate((keyframes.indexOf(P.currentLine)/keyframes.length)*S.files[P.currentFile].duration);
		}
		
		//If we've ended manually or reached the end, stop running immediately and end it all
		if(P.currentLine>=P.lines.length){
			S.to({file:'+1'});
			return;
		}
		
		var vals=P.lines[P.currentLine];
		
		//Replace all variables (including variables inside variables) with the right name
		var match;
		while(match=/[^\[]+(?=\])/g.exec(vals)) vals=vals.replace('['+match[0]+']',S.data[match[0]]);
		
		vals=vals.split(/(?:\s{3,}|\t+)/);
		
		//Determine the type of object//
		var command=/\..+/.exec(vals[0]);
		if(!command) command='content';
		else command=command[0].replace('.','');
		
		var type='character';
		if(vals.length===1){
			type='background';
		}
		
		//Check if audio
		if(/play|pause|stop|loop/.test(command)){
			type='audio';
		}
		
		var object=/^[^\.\t]+/.exec(vals[0]);
		if(!object){
			object='main';
			type='textbox';
		}
		else object=object[0];
		
		//If an object with the name doesn't exist, make it!
		if(!S.objects[object] && object!=='engine'){
			switch(type){
				case 'audio': S.objects[object]=new audio(object); break;
				case 'background': S.objects[object]=new background(object); break;
				case 'character': S.objects[object]=new character(object); break;
				case 'textbox': S.objects[object]=new textbox(object); break;
				case 'name': S.objects[object]=new name(object); break;
				default: break;
			}
		}
		
		//If we're buffering, add it to the buffer so it's not deleted later
		if(runTo) objectBuffer[object]=S.objects[object];
		
		var target=S.objects[object];
		
		//The engine's the target! Gasp!
		if(/go|end|runEvent|setTextbox|wait/.test(command)) target=P;
		
		if(target[command]) target[command](vals[1]);
		//Operations need to be functions of the parent
		///TODO: get operations working again, but as engine.commands
				
		//Don't automatically continue on text updates or engine commands
		if(type==='textbox' && command==='content') return;
		if(type==='engine') return;
		
		P.progress();
	}
	
	//If a value's a number, return it as one
	function ifParse(input){
		return isNaN(input) ? input : parseFloat(input);
	}
	
	//Data
	P.operation=function(vals){
		
		var type=/[+=\-<>!]+$/.exec(vals[0]);
		console.log('RUNNING OPERATION',vals,type);
		
		if(!type) return;
		
		type=type[0];
		//Remove type from variable name
		var name=vals[0].replace(type,'');
		
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
				S.data[name]=operators[type](
					ifParse(S.data[name])
					,ifParse(vals[1])
				);
				
				P.progress();
				break;
			//Comparisons
			default:
				if(operators[type](
					ifParse(S.data[name])
					,ifParse(vals[1])
				)) P.progress(P.lines.indexOf(vals[2]));
				else P.progress();
				break;
		}
	}
	
	P.go=function(input){
		P.progress(P.lines.indexOf(input));
	}
	
	P.end=function(){
		S.to({file:'+1'});
	}
	
	P.runEvent=function(input){
		S.window.dispatchEvent(new CustomEvent(input));
		P.progress();
	}
	
	P.setTextbox=function(input){
		currentTextbox=input;
		P.progress();
	}
	
	P.wait=function(input){
		//If there's a waitTimer, clear it out
		if(waitTimer.remaining>0){
			waitTimer.end();
		}
		
		//Skip waiting if we're running through
		if(runTo){
			P.progress();
			return;
		}
		
		//If a value was included, wait for the set time
		if(input) waitTimer=new powerTimer(P.progress,parseFloat(input)*1000);
		//Otherwise, let the user know to continue it
		else S.multimedia.window.appendChild(continueNotice);
		
		//If we're paused, pause the timer
		if(S.paused) waitTimer.pause();
		
		//Don't automatically go to the next line
	}
	
	/*
X	textbox
X		content
X		style
	name
		content
		style
X	character
X		content
X		style
X	background
X		content
X		style
X	audio
X		content
X		play
X		pause
X		speed
X		time
X		loop
X		volume
	*/

	//STYLE and REMOVE are the same for every instance.
	
	//RELEVANT FOR USING MULTIPLE FILES: add in this support later
	//var name=/^[^#]+/.exec(object)[0];
	
	//Pass new objects to this function to add common sub-functions
	function objectAddCommonFunctions(O){
		//Remove element
		O.remove=function(){
			O.el.remove();
		}
		
		var localStyle=document.createElement('style');
		O.el.appendChild(localStyle);
		var cssName=O.el.dataset.name.replace(/#/g,'id');
		
		//Adjust the styles, and add animations
		O.style=function(style){
			var animationSpeed=/time:[^s;$]+/i.exec(style);
			
			//Add back in to support multiple objects sharing the same file set
			
			//If running to or not requesting animation, add styles without implementing animation
			if(animationSpeed===null || P.currentLine<runTo){
				O.el.style.cssText+=style;
			}else{
				localStyle.innerHTML='@keyframes '+cssName+'{100%{'+style+'}}';
				
				O.el.style.animation=animationSpeed[0].split(':')[1]+'s forwards '+cssName;
			}
		}
		
		//Add the animation end function
		O.el.addEventListener('animationend',function(event){
			if(this!==event.target) return;
			
			var styleAdd=/[^{]+;/.exec(new RegExp('@keyframes '+cssName+'{100%{[^}]*}}','i').exec(localStyle.innerHTML));
			
			if(styleAdd) this.style.cssText+=styleAdd[0];
			this.style.animation=null;
		});
	}
	
	function audio(input){
		const O=this;
		const name=input;
		
		O.el=document.createElement('audio');
		O.el.src='<?=$_POST['path']?>resources/audio/'+name+'.mp3';
		O.el.preload=true;
		O.el.dataset.name=input;
		P.window.appendChild(O.el);
		
		//Checks if was playing outside of pausing the Showpony
		O.wasPlaying=false;
		
		O.content=function(input){
			if(Array.isArray(input)) input=input[0];
			
			O.el.src=input;
		}
		
		O.play=function(){
			if(S.paused) O.wasPlaying=true;
			if(!S.paused) O.el.play();
		}
		
		O.pause=function(){
			if(S.paused) O.wasPlaying=false;
			O.el.pause();
		}
		
		O.stop=function(){
			if(S.paused) O.wasPlaying=false;
			O.el.pause();
			O.el.currentTime=0;
		}
		
		O.loop=function(input){
			O.el.loop=input;
		}
		
		O.volume=function(input){
			O.el.volume=input;
		}
		
		O.speed=function(input){
			O.el.playbackRate=input;
		}
		
		O.time=function(input){
			O.el.currentTime=input;
		}
		
		objectAddCommonFunctions(O);
	}
	
	function background(input){
		const O=this;
		O.el=document.createElement('div');
		O.el.className='showpony-background';
		O.el.dataset.name=input;
		const name=input;
		
		P.window.appendChild(O.el);

		O.content=function(input=name){
			O.el.style.backgroundImage='url("<?=$_POST['path']?>resources/backgrounds/'+input+'.jpg")';
		}
		
		objectAddCommonFunctions(O);
	}
	
	function character(input){
		const O=this;
		O.el=document.createElement('div');
		O.el.className='showpony-character';
		O.el.dataset.name=input;
		const name=input;
		
		P.window.appendChild(O.el);
		
		/*
		var lines=input;
		
		//Go through the rest of the lines, looking for images to preload
		for(let i=P.currentLine;i<P.lines.length;i++){
			
			//If this character is listed on this line
			if(P.lines[i].indexOf(object+'\t')===0){
				//Add the image names to the images to load
				lines.push(P.lines[i].split(/\s{3,}|\t+/)[1]);
			}
		}*/
		
		O.content=function(input,hide=false){
			//Character level
			//Get the image names passed (commas separate layers)
			var imageNames=input.split(',');
		
			//Layer level
			//Go through each passed image and see if it exists
			for(var i=0;i<imageNames.length;i++){
				let layer=i+1;
				
				//Assume .png
				var image=imageNames[i]+='.png';
				
				//If the layer doesn't exist, add it!
				if(!O.el.children[layer]){
					O.el.appendChild(document.createElement('div'));
				}
				
				//If the image doesn't exist, add it!
				if(!O.el.children[layer].querySelector('div[data-image="'+image+'"]')){
					//Add a layer image
					var thisImg=document.createElement('div');
					thisImg.className='showpony-character-image';
					thisImg.dataset.image=image;
					thisImg.style.backgroundImage='url("<?=$_POST['path']?>resources/characters/'+name+'/'+image+'")';
					
					O.el.children[layer].appendChild(thisImg);
				}
				
				//Set the matching images' opacity to 1, and all the others to 0
				var images=O.el.children[layer].children;
				for(let ii=0;ii<images.length;ii++){
					if(images[ii].dataset.image===image){
						 images[ii].style.opacity=1;
					}else{
						images[ii].style.opacity=0;
					}
				}
			}
		}
		
		objectAddCommonFunctions(O);
		
		//if(input) O.content();
	}
	
	function textbox(input){
		const O=this;
		const name=input;
		
		O.el=document.createElement('form');
		O.el.className='showpony-textbox';
		O.el.dataset.name=input;
		O.el.addEventListener('submit',function(event){
			event.preventDefault();
		});
		P.window.appendChild(O.el);
		
		O.content=function(input){
			//var keepGoing=multimediaFunction[vals[0].toLowerCase().substr(0,2)](vals);
		
			//var keepGoing=false;
			//if(!keepGoing) P.progress();
			
			//If we're running through, skip displaying text until we get to the right point
			if(runTo){
				objectBuffer[currentTextbox]=S.objects[currentTextbox];
				P.progress(undefined);
				return;
			}
			
			wait=true; //Assume we're waiting at the end time
			
			input=input.replace(/^\t+/,'');
			
			//If the line doesn't start with +, replace the text
			if(input[0]!=='+'){
				O.el.innerHTML='';
				/*
				if(!S.objects.name) S.multimedia.window.appendChild(S.objects.name=document.createElement('div'));
				
				S.objects.name.className='showpony-name';
				
				//Split up the text so we can have names automatically written
				var nameText=input.split('::');
				if(nameText.length>1){
					input=nameText[1];
					S.objects.name.innerHTML=nameText[0];
					S.objects.name.style.visibility='visible';
				}else{
					S.objects.name.style.visibility='hidden';
				}*/
				
				inputting=false;
			}
			else input=input.substr(1);
			
			//STEP 2: Design the text//
			
			//Design defaults
			var charElementDefault=document.createElement('span');
			charElementDefault.className='showpony-char-container';
			var charElement;
			var baseWaitTime;
			var constant;
			
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
			
			var l=input.length;
			//We check beyond the length of the text because that lets us place characters that allow text wrapping in Firefox
			for(let i=0;i<=l;i++){
				var waitTime=baseWaitTime;
				
				//If a > is at the end of a text line, continue automatically.
				//Won't interfere with tags, no worries!
				if(i==l-1 && input[i]==='>'){
					wait=false;
					continue;
				}
				
				//Check the current character//
				switch(input[i]){
					//HTML
					case '<':
						//Skip over the opening bracket
						i++;
					
						var values='';
						
						//Wait until a closing bracket (or the end of the text)
						while(input[i]!='>' && i<input.length){
							values+=input[i];
							i++;
						}
						
						//We're closing the element
						if(values[0]=='/'){
							values=values.substr(1);
							
							switch(values){
								case 'shout':
								case 'shake':
								case 'sing':
								case 'fade':
									charElement.classList.remove('showpony-char-'+values);
									break;
								case 'speed':
									///TODO: allow nested <speed> tags, so it'll go back to the speed of the parent element
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
								case 'sing':
								case 'shake':
								case 'fade':
									charElement.classList.add('showpony-char-'+values);
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
												
												if(this.dataset.go) P.progress(P.lines.indexOf(this.dataset.go));
												else P.progress();
												
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
						letters+=input[i];
					
						//Handle punctuation- at spaces we check, if constant isn't true
						if(i!==input.length && (input[i]===' ') && !constant){
							var testLetter=letters.length-2;
							
							/*
								Go back before the following:
									" ' ~
								That way sentences can end with those and still have a beat for the punctuation.
							*/
							while(/["'~]/.test(letters[testLetter])){
								testLetter--;
							}
							
							switch(letters[testLetter]){
								case '.':
								case '!':
								case '?':
								case ':':
								case ';':
								case '-':
									waitTime*=20;
									break;
								case ',':
									waitTime*=10;
									break;
							}
						}

						//Make the char based on charElement
						var thisChar=charElement.cloneNode(false);
						
						let showChar=document.createElement('span')				//Display char (appear, shout, etc), parent to animChar
						showChar.className='showpony-char';
						let animChar=document.createElement('span')			//Constant animation character (singing, shaking...)
						animChar.className='showpony-char-anim';
						let hideChar=document.createElement('span');	//Hidden char for positioning
						hideChar.className='showpony-char-placeholder';
						
						//Spaces
						//and Ending! (needs this to wrap lines correctly on Firefox)
						if(input[i]==' ' || i==l){
							thisChar.style.whiteSpace='pre-line';
							hideChar.innerHTML=animChar.innerHTML=' <wbr>';
							
							showChar.addEventListener('animationstart',function(event){
								//If the animation ended on a child, don't continue! (animations are applied to children for text effects)
								if(this!=event.target) return;
								
								//If the element's currently hidden (the animation that ended is for unhiding)
								if(this.style.visibility!=='visible'){
									this.style.visibility='visible';
									//If the letter's below the textbox
									if(this.parentNode.getBoundingClientRect().bottom>O.el.getBoundingClientRect().bottom){
										O.el.scrollTop=this.parentNode.offsetTop+this.parentNode.offsetHeight-O.el.offsetHeight;
									}
									
									//If the letter's above the textbox
									if(this.parentNode.getBoundingClientRect().top<O.el.getBoundingClientRect().top){
										O.el.scrollTop=this.parentNode.offsetTop;
									}
									
								}
							});
						}
						else{
							hideChar.innerHTML=animChar.innerHTML=input[i];
						}
						
						frag([animChar],showChar);
						frag([showChar,hideChar],thisChar);
						
						//Set the display time here- but if we're paused, no delay!
						if(!S.paused && !inputting) showChar.style.animationDelay=totalWait+'s';
						
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
			if(inputting && input[input.length-1]=='>'){
				console.log('Hey! skip this!');
			}else{
				inputting=false;
			}
			
			//if(S.objects[currentTextbox].dataset.async!=true){
			
				lastLetter.addEventListener('animationstart',function(event){
					if(this!==event.target) return;
					
					//If we aren't waiting to continue, continue
					if(!wait){
						P.progress();
					}else{
						//If we need players to click to continue (and they have no inputs to fill out or anything), notify them:
						if(!O.el.querySelector('input')){
							S.multimedia.window.appendChild(continueNotice);
						}
					}
				});
			//}
			
			//Add the chars to the textbox
			O.el.appendChild(fragment);
			
			//Continue if async textbox
			//if(S.objects[currentTextbox].dataset.async==true) P.progress();
		}
		
		objectAddCommonFunctions(O);
	}
}

S.multimedia=new makeVisualNovel();

<? } ?>

///////////////////////////////////////
////////////EVENT LISTENERS////////////
///////////////////////////////////////

//Shortcut keys
S.window.addEventListener(
	'keydown'
	,function(event){
		if(document.activeElement.tagName==='INPUT' || event.ctrlKey || event.altKey || event.shiftKey || event.metaKey) return;
		
		switch(event.key){
			case ' ':				S.input();				break;
			case 'Enter':			S.input();				break;
			case 'ArrowLeft':		S.to({time:'-10'});		break;
			case 'ArrowRight':		S.to({time:'+10'});		break;
			case 'Home':			S.to({time:'start'});	break;
			case 'End':				S.to({time:'end'});		break;
			case 'MediaPrevious':	S.to({file:'-1'});		break;
			case 'MediaNext':		S.to({file:'+1'});		break;
			case 'MediaPlayPause':	S.toggle();				break;
			case 'f':				S.fullscreenToggle();	break;
			default:				return;					break;
		}
		
		event.preventDefault();
	}
);

//Scrolling only works on fullscreen
S.window.addEventListener('wheel',function(event){
	if(event.ctrlKey || !S.fullscreen) return;
	
	if(S.paused){
		if(event.deltaY>0) S.to({time:'+10'});
		if(event.deltaY<0) S.to({time:'-10'});
	}else{
		if(currentType==='multimedia'){
			if(event.deltaY<0){
				//Go back a keyframe's length, so we get to the previous keyframe
				var keyframeLength=S.files[S.currentFile].duration/keyframes.length;
				
				S.to({time:'-'+keyframeLength});
			}
		}
	}
});

//We need to set this as a variable to remove it later on
//This needs to be click- otherwise, you could click outside of Showpony, release inside, and the menu would toggle. This results in messy scenarios when you're using the UI.
var windowClick=function(event){
	//If we just ended scrubbing, don't toggle the menu at all
	if(scrubbing==='out'){
		scrubbing=false;
		return;
	}
	
	event.stopPropagation();
	
	if(event.target===overlay) S.toggle();
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
fullscreenButton.addEventListener('click',S.fullscreenToggle);

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

function updateHistory(action='add'){
	//If using queries with time, adjust query on time update
	var newURL=document.location.href;
	var newQuery='';
	
	//Choose whether to add an ampersand or ?
	//Choose a ? if one doesn't exist or it exists behind the query
	newQuery=(newURL.indexOf('?')===-1 || new RegExp('\\?(?='+S.query+'=)').test(newURL)) ? '?' : '&';
	
	newQuery+=S.query+'='+(Math.floor(S.currentTime));
	
	//Replace either the case or the end
	newURL=newURL.replace(new RegExp('(((\\?|&)'+S.query+')=?[^&#]+)|(?=#)|$'),newQuery);
	
	//console.log('updating',obj.history,location.href,newURL);
	
	if(location.href!==newURL){
		//console.log('We are gonna ',action);
		switch(action){
			case 'replace':
				history.replaceState({},'',newURL);
				break;
			case 'revisit':
				//Nothing needs to be done
				break;
			case 'add':
			default:
				history.pushState({},'',newURL);
				break;
		}
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
		if(S.gamepad.menu==2) S.toggle();
		if(S.gamepad.input==2) S.input();
		if(S.gamepad.dpadL==2) S.to({file:'-1'});
		if(S.gamepad.dpadR==2) S.to({file:'+1'});
		if(S.gamepad.end==2) S.to({time:'end'});
		if(S.gamepad.home==2) S.to({time:'start'});
		if(S.gamepad.fullscreen==2) S.fullscreenToggle();
		
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
		S.play();
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
			var saveValue=Math.floor(S.currentTime);
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

//These are the defaults for passObj, but it can be overwritten if we're using a querystring
var start=<?php
	#Get Hey Bard start
	
	##########
	
	#Start from the last file
	echo 'S.files.length-1';
?>;

//If querystrings are in use, consider the querystring in the URL
window.addEventListener(
	'popstate'
	,function(){
		var page=(new RegExp('(\\?|&)'+S.query+'[^&#]+','i').exec(window.location.href));
		
		//If we found a page
		if(page){
			page=parseInt(page[0].split('=')[1]);
			
			if(page===S.currentTime) return;
		
			S.to({time:page,history:'revisit'});
		}
	}
);

var page=(new RegExp('(\\?|&)'+S.query+'[^&#]+','i')).exec(window.location.href);
if(page) start=parseInt(page[0].split('=')[1]);

S.to({time:start,history:'replace'});

//Pause the Showpony
S.pause();

//Set input to null in hopes that garbage collection will come pick it up
input=null;

//We don't remove the loading class here, because that should be taken care of when the file loads, not when Showpony finishes loading

if(S.subtitles){
	var obj=Object.keys(S.subtitles);
	
	//Add captions to options
	
	var option=document.createElement('option');
	option.className='showpony-captions-option';
	option.innerHTML='None';
	option.value='None';
	option.selected=true;
	option.addEventListener('click',function(){
		S.currentSubtitles=null;
	});
	captionsButton.appendChild(option);
	
	for(let i=0;i<obj.length;i++){
		let option=document.createElement('option');
		option.className='showpony-captions-option';
		option.innerHTML=obj[i];
		option.value=obj[i];
		option.addEventListener('click',function(){
			S.currentSubtitles=this.value;
		});
		captionsButton.appendChild(option);
	}
}

///////////////////////////////////////
/////////////////ADMIN/////////////////
///////////////////////////////////////

/////With new admin panel, we just reload the entire Showpony- this avoids risk of any bugs with AJAX vs reality and the like

}

var <?=toCamelCase($name)?>=new Showpony();

<?php die('/*JS generated by PHP*/'); ?>