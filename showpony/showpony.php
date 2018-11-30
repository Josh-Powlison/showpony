<?php

/*

ABOUT SHOWPONY'S CODE

Showpony is set up to only make 1 file call. So you'll see CSS, JS, etc, all compiled into this one file.

For just one medium, here are all the files that would be called from the client side if it was all split up in a more typical way:
1. Showpony JS
2. Showpony PHP (called by Showpony JS)
3. Showpony CSS
4. Module JS
5. Module CSS

This setup has a few benefits:
1. PHP can be run in JS and CSS files: this lets us customize display and functionality based on server data directly.
2. 1 server call instead of 3+(Modules*2): server calls are generally more expensive than bandwidth. This is meant to speed up the process.
3. Allows us to require just 1 line of code to run: we can pass $_GET info to PHP to retrieve all of the info immediately.

If you'd like to contest this setup, feel free to start up a discussion and let us know why you think an alternative setup would be more resource-efficient.

Thanks!

*/

session_start();

require 'settings.php';

// POST VALUES FOR TESTING

$stories_path=$_GET['path'] ?? DEFAULT_STORIES_PATH;
$language=$_GET['lang'] ?? DEFAULT_LANGUAGE;

// Get the query from the paths
$name=preg_match('/[^\/]+(?=\/?$)/',$stories_path,$match) ? $match[0] : 'story';

// Unhide a file, including any hidden parent folders
function unhideFile($name){
	// Split the file into its path segments, so we can check all folders for HIDDEN_FILENAME_STARTING_CHAR
	$segments=explode('/',$name);
	$path='';
	
	foreach($segments as $check){
		if(file_exists($path.HIDDEN_FILENAME_STARTING_CHAR.$check)){
			// Remove HIDDEN_FILENAME_STARTING_CHAR
			rename($path.HIDDEN_FILENAME_STARTING_CHAR.$check,$path.$check);
		}
		
		$path.=$check.'/';
	}
}

function toCamelCase($input){
	return lcfirst(
		str_replace('-','',
			ucwords($input,'-')
		)
	);
}

// These associative arrays will be sent to the user as JSON
$media=[];
$files=[];
$success=true;

// Go to the story's file directory
chdir('../'.$stories_path);

// We'll store all errors and code that's echoed, so we can send that info to the user (in a way that won't break the JSON object).
ob_start();

// Run through the files
foreach(scandir($language) as &$file){
	// Ignore hidden files and folders
	if($file[0]==='.' || is_dir($file)) continue;
	
	// If the file was hidden, and is unhid later, we'll set this to true
	$unhid=false;
	
	// Ignore files that have dates in their filenames set to later
	if(preg_match('/\d{4}-\d\d-\d\d(\s\d\d(:|;)\d\d(:|;)\d\d)?/',$file,$date)){ // Get the posting date from the file's name; if there is one:
		// If the time is previous to now (replacing ; with : for Windows filename compatibility)
		$date=str_replace(';',':',$date[0]).' UTC';
		
		// Check if the file should be live based on the date passed
		if(strtotime($date)<=time()){
			// $hidden is already false
			
			// If the file is hidden but shouldn't be
			if($file[0]===HIDDEN_FILENAME_STARTING_CHAR){
				// Remove HIDDEN_FILENAME_STARTING_CHAR at the beginning of the filename
				if(rename($language.'/'.$file,$language.'/'.($file=substr($file,1)))){
					$unhid=true;
				// If removing HIDDEN_FILENAME_STARTING_CHAR fails
				}else{
					$success=false;
				}
			}
		}else{
			$hidden=true;
			
			// If the file isn't hidden but should be
			if($file[0]!==HIDDEN_FILENAME_STARTING_CHAR){
				// Add HIDDEN_FILENAME_STARTING_CHAR at the beginning of the filename
				if(rename($language.'/'.$file,$language.'/'.($file=HIDDEN_FILENAME_STARTING_CHAR.$file))){
					
				// If adding HIDDEN_FILENAME_STARTING_CHAR fails
				}else{
					$success=false;
				}
			}
			
			// Don't add hidden files if we aren't logged in
			if(empty($_SESSION['showpony_admin'])) continue;
		}
	}else{
		// Still skip hidden files
		if($file[0]===HIDDEN_FILENAME_STARTING_CHAR) continue;
		
		$date=null;
	}
	
	// There must be a better way to get some of this info...
	$fileInfo=[
		'buffered'		=>	[]
		,'date'			=>	$date
		,'duration'		=>	preg_match('/[^\s)]+(?=\.[^.]+$)/',$file,$match) ? $match[0] : 10
		,'extension'	=>	pathinfo($language.'/'.$file,PATHINFO_EXTENSION)
		,'mimeType'		=>	mime_content_type($language.'/'.$file)
		,'name'			=>	$file
		,'path'			=>	$stories_path.$language.'/'.$file
		,'size'			=>	filesize($language.'/'.$file)
		,'subtitles'	=>	false
		,'title'		=>	preg_match('/([^()])+(?=\))/',$file,$match) ? $match[0] : null
	];
	
	// Get the module based on FILE_DATA_GET_MODULE- first ext, then full mime, then partial mime, then default
	$fileInfo['module']=FILE_DATA_GET_MODULE['ext:'.$fileInfo['extension']]
		?? FILE_DATA_GET_MODULE['mime:'.$fileInfo['mimeType']]
		?? FILE_DATA_GET_MODULE['mime:'.explode('/',$fileInfo['mimeType'])[0]]
		?? FILE_DATA_GET_MODULE['default']
	;
	
	// If the module isn't supported, skip over it
	if($fileInfo['module']===null) continue;
	
	// Load module functions
	foreach(array_keys($media) as $moduleName){
		require_once ROOT.'/modules/'.$moduleName.'/functions.php';
	}
	
	// If this file has been unhid, unhide related files
	if($unhid){
		// Unhide subtitles
		unhideFile('subtitles/'.$language.'/'.$fileInfo['title'].'.vtt');
		
		// Unhide children files
		call_user_func($fileInfo['module'].'UnhideChildren',$language.'/'.$file);
	}
	
	// Add to the items in the module, or set to 1 if it doesn't exist yet
	if(isset($media[$fileInfo['module']])) $media[$fileInfo['module']]++;
	else $media[$fileInfo['module']]=1;
	
	// Add the file to the array
	$files[]=$fileInfo;
}

// Pass any echoed statements or errors to the response object
$message=ob_get_clean();

header('Content-type: application/javascript');
?>'use strict';

// Add styles if not added already
if(!document.getElementById('showpony-styles')){
	var styles=document.createElement('style');
	styles.id='showpony-styles';
	styles.innerHTML=`<?php
		addslashes(readfile(ROOT.'/styles.css'));
	?>`;
	document.head.appendChild(styles);
}

<?php

// Load modules
foreach(array_keys($media) as $moduleName){
	
?>
// Add <?php echo $moduleName; ?> styles if not added already
if(!document.getElementById('showpony-<?php echo $moduleName; ?>-styles')){
	var styles=document.createElement('style');
	styles.id='showpony-<?php echo $moduleName; ?>-styles';
	styles.innerHTML=`<?php
		addslashes(readfile(ROOT.'/modules/'.$moduleName.'/styles.css'));
	?>`;
	document.head.appendChild(styles);
}

<?php } ?>

var <?php echo toCamelCase($name); ?>=new function(){

const S=this;

///////////////////////////////////////
///////////PUBLIC VARIABLES////////////
///////////////////////////////////////

S.window=document.createElement('div');
S.window.className='showpony';
S.window.tabIndex=0;
S.files=<?php echo json_encode($files,JSON_NUMERIC_CHECK); ?>;
S.name='<?php echo toCamelCase($name); ?>';
S.duration=S.files.map(function(e){return e.duration;}).reduce((a,b) => a+b,0);
S.paused=false;
S.modules={};
S.media=<?=json_encode($media,JSON_NUMERIC_CHECK)?>;
S.message='<?php echo addslashes($message); ?>';
S.auto=false; // false, or float between 0 and 10
S.path='<?php echo $stories_path; ?>';

S.window.innerHTML=`
	<style class="showpony-style" type="text/css"></style>
	<div class="showpony-content"></div>
	<div class="showpony-subtitles"></div>
	<div class="showpony-overlay">
		<canvas class="showpony-overlay-buffer" width="1000" height="1"></canvas>
		<div class="showpony-progress" style="left: 14.5688%;"></div>
		<p class="showpony-overlay-text"><span>0</span><span>0</span></p>
		<div class="showpony-dropdowns">
			<div class="showpony-dropdown showpony-dropdown-language"></div>
			<div class="showpony-dropdown showpony-dropdown-subtitles"></div>
			<div class="showpony-dropdown showpony-dropdown-bookmark"></div>
		</div>
		<div class="showpony-buttons">
			<button class="showpony-button-comments" alt="Comments" title="Comments"></button>
			<button class="showpony-button-language" alt="Language" title="Language"></button>
			<button class="showpony-button-subtitles" alt="Subtitles" title="Subtitles"></button>
			<button class="showpony-button-bookmark" alt="Bookmark" title="Bookmarks Toggle"></button>
			<button class="showpony-fullscreen-button" alt="Fullscreen" title="Fullscreen Toggle"></button>
		</div>
	</div>
`;

S.buffered=[];
S.query='<?php echo $name; ?>';
S.infiniteScroll=false;
S.subtitles={};
S.currentLanguage='<?php echo $language; ?>';

/////////////////

var supportedLanguages=<?php
	// Get subtitles
	$languages=[];
	foreach(scandir('.') as $file){
		// Ignore hidden folders and subtitles folder
		if($file==='subtitles' || $file==='resources' || !is_dir($file) || $file[0]==='.' || $file[0]===HIDDEN_FILENAME_STARTING_CHAR) continue;

		$languages[]=[
			'short'	=>	$file
			,'long'	=>	Locale::getDisplayLanguage($file)
		];
	}
	
	echo json_encode($languages);
?>;

if(supportedLanguages.length>1){
	function toggleLanguage(){
		// Remove selected class from previous selected item
		var previous=S.window.querySelector('.showpony-dropdown-language .showpony-selected');
		if(previous){
			previous.classList.remove('showpony-selected');
		}
		
		// Set language to null if clicking on the same item
		if(S.currentLanguage===this.dataset.value){
			// S.displaySubtitles(null);
			return;
		}
		
		this.classList.add('showpony-selected');
		// S.displaySubtitles(this.dataset.value);
	}

	var languageButtons=document.createDocumentFragment();
	for(var i=0;i<supportedLanguages.length;i++){
		var buttonEl=document.createElement('button');
		buttonEl.innerText=supportedLanguages[i]['long'];
		buttonEl.dataset.value=supportedLanguages[i]['short'];
		buttonEl.addEventListener('click',toggleLanguage);
		
		if(S.currentLanguage===supportedLanguages[i]['short']) buttonEl.className='showpony-selected';
		
		languageButtons.appendChild(buttonEl);
	}
	S.window.querySelector(".showpony-dropdown-language").appendChild(languageButtons);

	S.window.querySelector('.showpony-button-language').addEventListener('click',function(){
		if(S.window.querySelector('.showpony-dropdown-language').classList.toggle('showpony-visible')){
			// Added
		}else{
			// Removed
		}
	});
}else{
	S.window.querySelector('.showpony-button-language').remove();
}

var supportedSubtitles=<?php
	// Get subtitles
	$subtitles=[];
	if(file_exists('subtitles')){
		foreach(scandir('subtitles') as $file){
			// Ignore hidden files
			if(!is_dir('subtitles/'.$file) || $file[0]==='.' || $file[0]===HIDDEN_FILENAME_STARTING_CHAR) continue;

			// TODO: add support for differentiating Closed Captions (maybe append with "cc", like "en-cc" "es-cc"
			
			$subtitles[]=[
				'short'	=>	$file
				,'long'	=>	Locale::getDisplayLanguage($file)
			];
		}
	}
	
	echo json_encode($subtitles);
?>;

if(supportedSubtitles.length>0){
	function toggleSubtitle(){
		// Remove selected class from previous selected item
		var previous=S.window.querySelector('.showpony-dropdown-subtitles .showpony-selected');
		if(previous){
			previous.classList.remove('showpony-selected');
		}
		
		// Set subtitles to null if clicking on the same item
		if(S.currentSubtitles===this.dataset.value){
			S.displaySubtitles(null);
			return;
		}
		
		this.classList.add('showpony-selected');
		S.displaySubtitles(this.dataset.value);
	}

	var subtitleButtons=document.createDocumentFragment();
	for(var i=0;i<supportedSubtitles.length;i++){
		var buttonEl=document.createElement('button');
		buttonEl.innerText=supportedSubtitles[i]['long'];
		buttonEl.dataset.value=supportedSubtitles[i]['short'];
		buttonEl.addEventListener('click',toggleSubtitle);
		
		if(S.currentSubtitles===supportedSubtitles[i]['short']) buttonEl.className='showpony-selected';
		
		subtitleButtons.appendChild(buttonEl);
	}
	S.window.querySelector(".showpony-dropdown-subtitles").appendChild(subtitleButtons);

	S.window.querySelector('.showpony-button-subtitles').addEventListener('click',function(){
		if(S.window.querySelector('.showpony-dropdown-subtitles').classList.toggle('showpony-visible')){
			// Added
		}else{
			// Removed
		}
	});
}else{
	S.window.querySelector('.showpony-button-subtitles').remove();
}

// Bookmarks

function toggleBookmark(){
	// Remove selected class from previous selected item
	var previous=S.window.querySelector('.showpony-dropdown-bookmark .showpony-selected');
	if(previous){
		previous.classList.remove('showpony-selected');
	}
	
	console.log(previous,S.saveSystem,this.dataset.value);

	// Set subtitles to null if clicking on the same item
	if(S.saveSystem===this.dataset.value){
		S.saveSystem=false;
		return;
	}
	
	this.classList.add('showpony-selected');
	S.saveSystem=this.dataset.value;
}

var currentBookmarks=['Local','Remote (WIP)'];
var bookmarkButtons=document.createDocumentFragment();
for(var i=0;i<currentBookmarks.length;i++){
	var buttonEl=document.createElement('button');
	buttonEl.innerText=currentBookmarks[i];
	buttonEl.dataset.value=currentBookmarks[i];
	buttonEl.addEventListener('click',toggleBookmark);
	
	if(S.saveSystem===currentBookmarks[i]) buttonEl.className='showpony-selected';
	
	bookmarkButtons.appendChild(buttonEl);
}
S.window.querySelector(".showpony-dropdown-bookmark").appendChild(bookmarkButtons);

S.window.querySelector('.showpony-button-bookmark').addEventListener('click',function(){
	if(S.window.querySelector('.showpony-dropdown-bookmark').classList.toggle('showpony-visible')){
		// Added
	}else{
		// Removed
	}
});

/////////////////

S.data={};
S.saveId='<?php echo substr($_GET['title'] ?? $stories_path ?? gethostname(),0,20); ?>';
S.cover={<?php
	echo 'content:"',$_GET['title'] ?? 'Play','"';
	// Pass a cover if one is found
	if(file_exists('cover.jpg')){
		echo ',image:"',$stories_path,'cover.jpg"';
	}
?>};

S.gamepad=null;

// null before we load
S.currentFile=null;
S.currentTime=null;
S.currentModule=null;
S.currentSubtitles=null;

///////////////////////////////////////
////////////////MODULES////////////////
///////////////////////////////////////
<?php

// Load modules
foreach(array_keys($media) as $moduleName){
	include ROOT.'/modules/'.$moduleName.'/object.js';
}

?>

///////////////////////////////////////
///////////PUBLIC FUNCTIONS////////////
///////////////////////////////////////

// Go to another file
S.to=function(obj={}){
	content.classList.add('showpony-loading');
	
	/// GET TIME AND FILE ///
	
	// Special values
	if(obj.file==='last') obj.file=S.files.length-1;
	if(obj.time==='end') obj.time=S.duration-10;
	
	// Relative adjustments if the values have - or +. If both are relative, file will be relative and time will instead be absolute to avoid strange behavior.
	if(/-|\+/.test(obj.file)) obj.file=S.currentFile+parseInt(obj.file);
	else if(/-|\+/.test(obj.time)) obj.time=S.currentTime+timeToSeconds(obj.time);
	
	obj.time=timeToSeconds(obj.time);
	
	// Minimal time and file values are 0
	obj.file=Math.max(0,obj.file || 0);
	obj.time=Math.max(0,parseFloat(obj.time) || 0);
	
	// Based on time, get the right file
	for(obj.file;obj.file<S.files.length;obj.file++){
		if(obj.time<S.files[obj.file].duration) break; // We've reached the file
		
		obj.time-=S.files[obj.file].duration;
	}
	
	// If we're at the end, pause and run an event
	if(obj.file>=S.files.length){
		obj.file=S.files.length-1;
		
		// Run the event that users can read
		S.window.dispatchEvent(new CustomEvent('end'));
	}
	
	// Only start images at beginning; you can't go into the "middle" of image
	if(S.files[obj.file].module==='image') obj.time=0;
	
	/// LOAD RIGHT module AND SOURCE ///
	
	// If switching types, do some cleanup
	if(S.currentModule!==S.files[obj.file].module){
		content.innerHTML='';
		content.appendChild(S.modules[S.files[obj.file].module].window);
	}
	
	S.currentModule=S.files[obj.file].module;
	
	// Load the file
	if(S.files[obj.file].buffered===false) S.files[obj.file].buffered='buffering';
	
	S.modules[S.currentModule].src(obj.file,obj.time).then(()=>{
		// TODO: condense or remove parts from below. I can't help but think this should all be called in the object.js files, and not touched at all here.
		S.currentFile=S.modules[S.currentModule].currentFile=obj.file;
		S.modules[S.currentModule].timeUpdate(obj.time);
		S.modules[S.currentModule].goToTime=obj.time;
		timeUpdate(obj.time);
		
		// We can preload up to this amount
		var preloadAmount=2097152; // 2 MB
		
		// Don't allow preloading upcoming files if scrubbing
		if(scrubbing) preloadAmount=0;
		
		// Preload upcoming files
		for(let i=obj.file;i<S.files.length;i++){
			// Check if we can preload this
			preloadAmount-=S.files[obj.file].size;
			
			// If not, exit
			if(preloadAmount<=0) break;
			
			// Otherwise, preload
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
// If it's the same and we're using infinite scrolling
if(S.infiniteScroll){// Scroll to the right spot
	var part=document.querySelector('[data-file="'+obj.file+'"]');

	pageTurn.scrollTop=part.offsetTop+part.offsetHeight*(obj.time/S.files[obj.file].duration);
}else{ // Page turn
	
}*/

/*// Use either infinite text or page turn, whichever is requested
if(S.infiniteScroll || S.files[obj.file].module==='text'){
	content.appendChild(pageTurn);
}else{
	content.classList.remove('showpony-loading');
}
*/

// NEED A DIFFERENT SETUP FOR INFINITE SCROLL //
/*
/*if(S.currentModule==='text'){
	fetch(src,{credentials:'include'})
		.then(response=>{
			return response.text();
		})
		.then(text=>{
			// Use either page infinite or page turn, whichever is requested
			if(S.infiniteScroll){
				
				// If file hasn't already been loaded, load it!
				let part=content.querySelector('[data-file="'+obj.file+'"]');
				
				// Safety check; if we're sticking, and trying to load a part that doesn't have a div, something's off and we need to get outta here!
				if(sticky!==false && !part) return;
				
				// If the part hasn't been created, it's not being automatically appended; so empty the div!
				if(!part){
					part=document.createElement('div');
					part.dataset.file=obj.file;
					pageTurn.innerHTML='';
					pageTurn.appendChild(part);
					
					S.currentFile=obj.file;
					
					// Stick to the set file and time
					sticky={file:S.currentFile,time:obj.time};
					console.log(sticky);
				}
				
				var currentPart=content.querySelector('[data-file="'+S.currentFile+'"]');
				var addScroll=pageTurn.scrollTop-currentPart.offsetTop;
				
				if(!part.innerHTML){
					// If adding a file in normally, just add it in
					part.innerHTML=text;
				
					pageTurn.scrollTop=currentPart.offsetTop+addScroll;
				}else{
					// Scroll to spot for file
					pageTurn.scrollTop=part.offsetTop+(obj.time/S.files[obj.file].duration)*part.offsetHeight;
				}
				
				if(sticky!==false){
					var stickyPart=content.querySelector('[data-file="'+sticky.file+'"]');
					
					pageTurn.scrollTop=stickyPart.offsetTop+(sticky.time/S.files[sticky.file].duration)*stickyPart.offsetHeight;
					
					pageTurn.dispatchEvent(new CustomEvent('scroll'));
				}
				
				content.classList.remove('showpony-loading');
				
			}else{ // Page turning
				// Put in the text
				pageTurn.innerHTML=text;
				
				// Scroll to spot
				pageTurn.scrollTop=pageTurn.scrollHeight*(obj.time/S.files[obj.file].duration);
				
				// Stop loading
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
// }
*/

S.play=function(){
	if(S.paused===false) return;
	
	S.window.classList.remove('showpony-paused');
	S.paused=false;
	S.modules[S.currentModule].play();
	S.window.dispatchEvent(new CustomEvent('play'));
}

S.pause=function(){
	if(S.paused===true) return;
	
	S.window.classList.add('showpony-paused');
	S.paused=true;
	if(S.currentModule) S.modules[S.currentModule].pause();
	S.window.dispatchEvent(new CustomEvent('pause'));
}

S.toggle=function(){
	S[S.paused ? 'play' : 'pause']();
}

S.fullscreen=false;

// Toggle fullscreen, basing the functions on the browser's abilities
// Standards fullscreen
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
// Webkit fullscreen
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
// Firefox fullscreen
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
// No fullscreen support fullscreen (like for iOS Safari)
else{
	S.fullscreenEnter=function(){
		if(S.window.classList.contains('showpony-fullscreen-alt')) return;
		
		S.window.classList.add('showpony-fullscreen-alt');
		document.getElementsByTagName('html')[0].classList.add('showpony-fullscreen-control');
		
		S.window.dataset.prevz=S.window.style.zIndex || 'initial';
		
		// From: https://stackoverflow.com/questions/1118198/how-can-you-figure-out-the-highest-z-index-in-your-document
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
		
		// Get the original z-index value
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

// When the viewer inputs to Showpony (click, space, general action)
S.input=function(){
	if(S.paused) S.play();
	else S.modules[S.currentModule].input();
}

///////////////////////////////////////
///////////PRIVATE VARIABLES///////////
///////////////////////////////////////

var styles=				S.window.getElementsByClassName('showpony-style')[0];
var content=			S.window.getElementsByClassName('showpony-content')[0];
var subtitles=			S.window.getElementsByClassName('showpony-subtitles')[0];
var overlay=			S.window.getElementsByClassName('showpony-overlay')[0];
var overlayBuffer=		S.window.getElementsByClassName('showpony-overlay-buffer')[0];
var progress=			S.window.getElementsByClassName('showpony-progress')[0];
var overlayText=		S.window.getElementsByClassName('showpony-overlay-text')[0];
var fullscreenButton=	S.window.getElementsByClassName('showpony-fullscreen-button')[0];
var captionsButton=		S.window.getElementsByClassName('showpony-captions-button')[0];

var scrubbing=false;

var cover=document.createElement('div');
cover.className='showpony-cover';
var pageTurn=document.createElement('div');
pageTurn.className='showpony-page-turn';

var sticky=false;

// Showpony framerate- which is connected not to animations, etc, but to gamepad use and games
var framerate=60;
var checkGamepad=null;

var pos=0;

///////////////////////////////////////
///////////PRIVATE FUNCTIONS///////////
///////////////////////////////////////

function timeUpdate(time){
	if(!isNaN(time)){
		// Don't exceed the file's duration
		var duration=S.files[S.currentFile].duration;
		if(time>duration) time=duration;
		S.modules[S.currentModule].timeUpdate(time);
	}
	
	// Get the current time in the midst of the entire Showpony
	S.currentTime=S.modules[S.currentModule].currentTime
	for(let i=0;i<S.currentFile;i++) S.currentTime+=S.files[i].duration;
	
	S.displaySubtitles();
	
	if(scrubbing!==true) scrub(null,false);
	
	updateHistory('replace');
	
	// Run custom event for checking time
	S.window.dispatchEvent(
		new CustomEvent(
			'timeupdate'
			,{
				detail:{
					file:S.currentFile
					,time:S.currentTime
				}
			}
		)
	);
}

// See if the time passed has been buffered
function checkBuffered(time=0){
	if(S.buffered===true) return true;
	
	for(var i=0;i<S.buffered.length;i++){
		// If before the start time, exit
		// if(time<S.buffered[i][0]) break;
		
		// If the time passed is within the range, it's true
		if(S.buffered[i][0]<=time && time<=S.buffered[i][1]){
			return true;
		}
	}
	
	return false;
}

function getTotalBuffered(){
	var time=0;
	var buffered=[];
	
	// Update amount buffered total
	for(let i=0;i<S.files.length;i++){
		var buffer=false;
		
		if(S.files[i].buffered===true){
			buffer=[time,time+S.files[i].duration];
			
			if(buffer){
				// Combine buffered arrays, if we're moving forward
				if(buffered.length>0 && buffer[0]<=buffered[buffered.length-1][1]) buffered[buffered.length-1][1]=buffer[1];
				else buffered.push(buffer);
			}
		}
		else if(Array.isArray(S.files[i].buffered)){
			// Get working for multiple contained buffers
			for(let ii=0;ii<S.files[i].buffered.length;ii++){
				buffer=[
					time+S.files[i].buffered[ii][0]
					,time+S.files[i].buffered[ii][1]
				];
				
				// Combine buffered arrays, if we're moving forward
				if(buffered.length>0 && buffer[0]<=buffered[buffered.length-1][1]) buffered[buffered.length-1][1]=buffer[1];
				else buffered.push(buffer);
			}
		}
		
		time+=S.files[i].duration;
	}
	
	if(buffered.length===1 && buffered[0][0]===0 && buffered[0][1]>=S.duration) buffered=true;
	if(buffered.length===0) buffered=[];
	
	S.buffered=buffered;
	
	// Show buffer
	var rectRes=1000;
	overlayBuffer.width=rectRes;
	overlayBuffer.height=1;
	var ctx=overlayBuffer.getContext('2d');
	ctx.clearRect(0,0,rectRes,1);
	//ctx.fillStyle='#000';
	
	// Update info on dropdown
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

// Update the scrubber's position
function scrub(inputPercent=null,loadFile=false){
	// "sticky" is an infinite scroll-related variable
	// if(sticky!==false) return;
	
	// If no inputPercent was set, get it!
	if(inputPercent===null) inputPercent=S.currentTime/S.duration;
	
	if(inputPercent<0) inputPercent=0;
	if(inputPercent>1) inputPercent=1;
	
	var timeInTotal=S.duration*inputPercent;
	
	/// LOADING THE SELECTED FILE ///
	if(loadFile){
		if(checkBuffered(timeInTotal) || scrubbing===false) S.to({time:timeInTotal});
	}
	
	// Move the progress bar
	progress.style.left=(inputPercent*100)+'%';
	
	<?php
	// If all the of the files are media that don't need time tracked, show progress with files, not time
	if(($_GET['progress-display'] ?? DEFAULT_PROGRESS_DISPLAY)==='file'){
		?>
	/// INFO TEXT WITH FILE ///
	function infoMake(input){
		return String(input).padStart((String(S.files.length).length),'0');
	}
	
	var newPart=0;
	for(var i=timeInTotal;i>S.files[newPart].duration;i-=S.files[newPart].duration) newPart++;
	
	var info='<span>'+infoMake(newPart+1)+'</span><span>'+infoMake(S.files.length-(newPart+1))+'</span>';
	<?php
	// Show progress with time if any of the files' progress is heavily measured by time
	}else{
	?>
	/// INFO TEXT WITH TIME ///
	function infoMake(input,pad=(String((S.duration / 60)|0).length)){
		// |0 is a shorter way to floor floats.
		return String((input)|0).padStart(pad,'0');
	}
	
	var info='<span>'+infoMake(timeInTotal / 60)+':'+infoMake(timeInTotal % 60,2)+'</span><span>'+infoMake((S.duration-timeInTotal) / 60)+':'+infoMake((S.duration-timeInTotal) % 60,2)+'</span>';
	<?php } ?>
	
	if(info!==overlayText.innerHTML) overlayText.innerHTML=info;
	
	// We don't want to over-update the title, so we stick with when we're not scrubbing.
	if(info!==document.title && scrubbing===false) document.title=info;
}

// Handles starting, running, and ending scrubbing
function userScrub(event=null,start=false){
	var input;
	
	// General events
	if(isNaN(event)){
		// Mouse and touch work slightly differently
		input=event.changedTouches ? 'touch' : 'cursor';
		pos=input==='touch' ? event.changedTouches[0].clientX : event.clientX;
	// Relative scrubbing
	}else{
		input='joystick';
		pos=progress.getBoundingClientRect().left+progress.getBoundingClientRect().width/2+event*5;
	}
	
	var scrubPercent=(pos-S.window.getBoundingClientRect().left)/(S.window.getBoundingClientRect().width);
	if(scrubPercent<0) scrubPercent=0;
	if(scrubPercent>1) scrubPercent=1;
	
	if(start){
		if(scrubbing===false){
			if(input==='touch') scrubbing=pos;
			else return;
		}
			
		// You have to swipe farther than you move the cursor to adjust the position
		if(scrubbing!==true){
			if(input==='joystick' || Math.abs(scrubbing-pos)>screen.width/(input==='touch' ? 20 : 100)){ 
				scrubbing=true;
				
				// On starting to scrub, we save a bookmark of where we were- kinda weird, but this allows us to return later.
				if(checkBuffered(S.duration*scrubPercent)){
					// Add a new state on releasing
					updateHistory('add');
				}
			}
			else return;
		}
		
		// Don't want the users to accidentally swipe to another page!
		if(input==='touch') event.preventDefault();
		
		scrub(scrubPercent,true);
	}else{
		// Drag on the menu to go to any part
		
		if(scrubbing===true){
			scrubbing=false;
		
			// If we don't preload while scrubbing, load the file now that we've stopped scrubbing
			if(!checkBuffered(S.duration*scrubPercent)){
				// Load the file our pointer's on
				scrub(scrubPercent,true);
				
			}
			
			return true; // Exit the function
		}
		
		// scrubbing needs to be set to false here too; either way it's false, but we need to allow the overlay to update above, so we set it to false earlier too.
		scrubbing=false;
	}
}

function updateHistory(action='add'){
	// If using queries with time, adjust query on time update
	var newURL=document.location.href;
	var newQuery='';
	
	// Choose whether to add an ampersand or ?
	// Choose a ? if one doesn't exist or it exists behind the query
	newQuery=(newURL.indexOf('?')===-1 || new RegExp('\\?(?='+S.query+'=)').test(newURL)) ? '?' : '&';
	
	newQuery+=S.query+'='+(Math.floor(S.currentTime));
	
	// Replace either the case or the end
	newURL=newURL.replace(new RegExp('(((\\?|&)'+S.query+')=?[^&#]+)|(?=#)|$'),newQuery);
	
	// console.log('updating',obj.history,location.href,newURL);
	
	if(location.href!==newURL){
		// console.log('We are gonna ',action);
		switch(action){
			case 'replace':
				history.replaceState({},'',newURL);
				break;
			case 'revisit':
				// Nothing needs to be done
				break;
			case 'add':
			default:
				history.pushState({},'',newURL);
				break;
		}
	}
}

S.displaySubtitles=function(newSubtitles=S.currentSubtitles){
	S.currentSubtitles=newSubtitles;
	
	if(newSubtitles===null){
		subtitles.innerHTML='';
		return;
	}
	
	// Display the subtitles if they're loaded in
	if(S.subtitles[newSubtitles]){
		S.modules[S.currentModule].displaySubtitles();
	// Otherwise, load them
	}else{
		fetch('showpony/get-subtitles.php?path=<?php echo $stories_path; ?>&lang='+newSubtitles)
		.then(response=>{return response.text();})
		.then(text=>{
			var filesArray=[];
			
			// Loop through files
			var files=text.split('|SPLIT|');
			files.pop(); // Last item is blank, remove it
			for(var i=0;i<files.length;i++){
				var grouping={};
				
				// Loop through sections (get rid of surrounding blanks
				var sections=files[i].replace(/^\s+|\s+$/g,'').split(/(?:\n\s*){2,}/g);
				for(var j=0;j<sections.length;j++){
					var name=j;
					var phrase={
						start:null
						,end:null
						,content:''
					};
					
					// Loop through chunk
					var chunk=sections[j].split(/\n\s*/g);
					for(var k=0;k<chunk.length;k++){
						// Get time
						if(/-->/.test(chunk[k])){
							var times=chunk[k].split(/\s*-->\s*/);
							phrase.start=times[0];
							phrase.end=times[1];
							
							continue;
						}
						
						// The first line is a name; otherwise, it's content
						if(k===0){
							name=chunk[k];
						}else{
							// Add a <br> tag if this is an additional line
							if(phrase.content.length) phrase.content+='<br>';
							phrase.content+=chunk[k];
						}
					}
					grouping[name]=phrase;
				}
				
				filesArray.push(grouping);
			}
			
			console.log('ALL SUBTITLES',filesArray);
			
			S.subtitles[newSubtitles]=filesArray;
			
			S.modules[S.currentModule].displaySubtitles();
		})
		.catch(response=>{
			console.log(response);
		});
	}
}

// Convert a time to seconds. Useful for to() function, and subtitles
function timeToSeconds(input=0){
	input=String(input);
	var timeFloat=0;
	
	// Check if a negative value was passed; if so, make sure it stays negative!
	var positive=true;
	if(input[0]==='-') positive=false;
	
	// Get seconds, minutes, and hours- from smallest to greatest
	var numbers=input.split(/:/);
	numbers.reverse();
	for(var i=0;i<numbers.length;i++){
		switch(i){
			case 0: timeFloat+=parseFloat(numbers[i].replace(',','.')); break;
			case 1: timeFloat+=numbers[i]*60; break;
			case 2: timeFloat+=numbers[i]*3600; break;
		}
	}
	
	// Flip this to negative if needbe
	if(timeFloat>=0 && !positive) timeFloat*=-1;
	
	return timeFloat;
}

function gamepadControls(){
	if(S.gamepad===null) return;
	if(document.hidden) return;
	
	// If we're not focused or fullscreen
	if(document.activeElement!==S.window && !S.fullscreen) return;
	
	var gamepad=navigator.getGamepads()[S.gamepad.id];
	
	// XBOX Gamepad
	if(/xinput/i.test(gamepad.id)){
		gamepadButton(gamepad,9,'menu');		// Start
		gamepadButton(gamepad,0,'input');		// A
		gamepadButton(gamepad,14,'dpadL');		// Dpad Left
		gamepadButton(gamepad,15,'dpadR');		// Dpad Right
		gamepadButton(gamepad,8,'fullscreen');	// Select
		gamepadButton(gamepad,6,'home');		// Left trigger
		gamepadButton(gamepad,7,'end');			// Right trigger
			
		gamepadAxis(gamepad,0,'analogL');		// Left analogue
	// Normal, average gamepad
	}else{
		gamepadButton(gamepad,9,'menu');		// Start
		gamepadButton(gamepad,0,'input');		// A
		gamepadButton(gamepad,8,'fullscreen');	// Select
		gamepadButton(gamepad,6,'home');		// Left trigger
		gamepadButton(gamepad,7,'end');			// Right trigger
	}
	
	// Register inputs
	if(S.gamepad.menu==2) S.toggle();
	if(S.gamepad.input==2) S.input();
	if(S.gamepad.dpadL==2) S.to({time:'-10'});
	if(S.gamepad.dpadR==2) S.to({time:'+10'});
	if(S.gamepad.end==2) S.to({time:'end'});
	if(S.gamepad.home==2) S.to({time:'start'});
	if(S.gamepad.fullscreen==2) S.fullscreenToggle();
	
	// Scrubbing with the analogue stick
	if(S.gamepad.analogLPress===2){
		overlay.style.opacity=1; // Show the overlay
		pos=0;
	}

	if(S.gamepad.analogL!==0){
		
		scrubbing=S.gamepad.analogL;
		userScrub(S.gamepad.analogL,true);
	}
	
	if(S.gamepad.analogLPress===-2){
		overlay.style.opacity=''; // Hide the overlay
		// If we're not scrubbing, set scrubbing to false and return
		if(scrubbing!==true){
			scrubbing=false;
		}else{
			userScrub(S.gamepad.analogL);
			pos=0;
		}
	}
}

function gamepadAxis(gamepad,number,type){
	// Active space
	var min=S.gamepad.axisMin;
	var max=S.gamepad.axisMax;
	
	// Get amount between -1 and 1 based on distance between values
	if(Math.abs(gamepad.axes[number])>=min){
		if(gamepad.axes[number]>0) S.gamepad[type]=(gamepad.axes[number]-min)/(max-min);
		else S.gamepad[type]=((gamepad.axes[number]-(-max))/(-min-(-max)))-1;
		
		// Set pressing values right
		if(S.gamepad[type+'Press']<0) S.gamepad[type+'Press']=2;
		else S.gamepad[type+'Press']=1;
	}else{
		S.gamepad[type]=0;
		
		// Set pressing values right
		if(S.gamepad[type+'Press']>0) S.gamepad[type+'Press']=-2;
		else S.gamepad[type+'Press']=-1;
	}
}

function gamepadButton(gamepad,number,type){
	if(gamepad.buttons[number].pressed){
		// Set pressing values right
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

// Make sure setup is made of multiple Promises that can run asyncronously- and that they do!

content.classList.add('showpony-loading');

if(S.cover){
	if(S.cover.image) cover.style.backgroundImage='url("'+S.cover.image+'")';
	if(S.cover.content) cover.innerHTML='<p>'+S.cover.content+'</p>';
	S.window.appendChild(cover);
	
	cover.addEventListener('click',function(){
		this.remove();
		cover=null;
		S.play();
	});
}

// And fill it up again!
S.window.appendChild(styles);
S.window.appendChild(content);
S.window.appendChild(subtitles);
S.window.appendChild(overlay);

/////////////////////
//Get Hey Bard account
/////////////////////

// User accounts and bookmarks always on

// Local saving is simple- remote saving, we'll connect straight to the database with a special account (or come up with something else, but we'll get it in PHP)

// Also- why not use local and remote in tandem? If disconnect, we'll save the value in local; and then upload it remotely. Rather than one, why not both so that we keep the info if we have trouble in one place?
// We track Hey Bard time last visited; if we check that against the user's localStorage save time, we'll be golden!

// Priority: Newest > Default Start

var start=null;
S.saveName=S.name+'Bookmark';
S.saveSystem=false;
// S.saveSystem=false;
// S.saveSystem='remote';

S.loadBookmark=function(){
	// Remote bookmark
	/// TODO: add remote bookmark support
	
	// Local bookmark
	var loadData=JSON.parse(localStorage.getItem(S.saveName));
	return parseInt(loadData.bookmark);
}

S.saveBookmark=function(){
	if(!S.saveSystem) return;
	
	// Set up the bookmark values for saving
	var newValues={
		bookmark:Math.floor(S.currentTime),
		data:S.data,
		saveSystem:'local',
		timestamp:Date.now()
	};
	
	var oldValues=JSON.parse(localStorage.getItem(S.saveName));
	
	// Don't save the bookmark if relevant data is the same
	if(
		oldValues!==null
		&& newValues.bookmark===oldValues.bookmark
		&& JSON.stringify(newValues.data)===JSON.stringify(oldValues.data) // objects can easily read different; stringifying them both ensures they'll read the same
	) return;
	
	// Remote bookmark
	/// TODO: add remote bookmark support
	
	// Local bookmark
	localStorage.setItem(S.saveName,JSON.stringify(newValues));
};

var start=S.duration-(S.files[S.files.length-1].duration);
if(S.saveSystem) start=S.loadBookmark();

var page=(new RegExp('(\\?|&)'+S.query+'[^&#]+','i')).exec(window.location.href);
if(page) start=parseInt(page[0].split('=')[1]);

// Pause the Showpony
S.pause();
S.to({time:start,history:'replace'});

// We don't remove the loading class here, because that should be taken care of when the file loads, not when Showpony finishes loading

// Add the Showpony window to the document
document.currentScript.insertAdjacentElement('afterend',S.window);

///////////////////////////////////////
////////////EVENT LISTENERS////////////
///////////////////////////////////////

// Allow using querystrings for navigation
window.addEventListener(
	'popstate'
	,function(){
		var page=(new RegExp('(\\?|&)'+S.query+'[^&#]+','i').exec(window.location.href));
		
		// If we found a page
		if(page){
			page=parseInt(page[0].split('=')[1]);
			
			if(page===S.currentTime) return;
		
			S.to({time:page,history:'revisit'});
		}
	}
);

// Save user bookmarks when leaving the page
window.addEventListener('blur',S.saveBookmark);
window.addEventListener('beforeunload',S.saveBookmark);

// Save the bookmark if the website is hidden
document.addEventListener('visibilitychange',function(){
	if(document.hidden) S.saveBookmark();
});

// Showpony deselection (to help with Firefox and Edge's lack of support for 'beforeunload')
S.window.addEventListener('focusout',S.saveBookmark);
S.window.addEventListener('blur',S.saveBookmark);

// Shortcut keys
S.window.addEventListener(
	'keydown'
	,function(event){
		if(this!==event.target) return;
		
		if(event.ctrlKey || event.altKey || event.shiftKey || event.metaKey) return;
		
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
			case 'm':				S.toggle();				break;
			default:				return;					break;
		}
		
		event.preventDefault();
	}
);

// Scrolling only works on fullscreen
S.window.addEventListener('wheel',function(event){
	if(event.ctrlKey || !S.fullscreen) return;
	
	if(S.paused){
		if(event.deltaY>0) S.to({time:'+10'});
		if(event.deltaY<0) S.to({time:'-10'});
	}else{
		if(S.currentModule==='visualNovel'){
			if(event.deltaY<0){
				S.visualNovel.previousKeyframe();
			}
		}
	}
});

// We need to set this as a variable to remove it later on
// This needs to be click- otherwise, you could click outside of Showpony, release inside, and the menu would toggle. This results in messy scenarios when you're using the UI.
var windowClick=function(event){
	// If we just ended scrubbing, don't toggle the menu at all
	if(scrubbing==='out'){
		scrubbing=false;
		return;
	}
	
	event.stopPropagation();
	
	if(event.target===overlay) S.toggle();
};

// On clicking, we open the menu- on the overlay. But we need to be able to disable moving the bar outside the overlay, so we still activate menu here.
window.addEventListener('click',windowClick);

window.addEventListener('mouseup',function(event){
	// Allow left-click only
	if(event.button!==0) return;
	
	// If we're not scrubbing, set scrubbing to false and return
	if(scrubbing!==true){
		scrubbing=false;
		return;
	}
	
	// Scrub the bar
	userScrub(event);
	
	scrubbing='out';
});

// On mousedown, we prepare to move the cursor (but not over overlay buttons)
overlay.addEventListener('mousedown',function(event){
	// Allow left-click only
	if(event.button!==0) return;
	
	if(event.target===this){
		scrubbing=event.clientX;
		window.getSelection().removeAllRanges();
	}
});

// On touch end, don't keep moving the bar to the user's touch
overlay.addEventListener('touchend',userScrub);

// On dragging
window.addEventListener('mousemove',function(event){userScrub(event,true);});
window.addEventListener('touchmove',function(event){userScrub(event,true);});

// Menu buttons
fullscreenButton.addEventListener('click',S.fullscreenToggle);

content.addEventListener('click',S.input);

// TODO: merge all basic click events into here; it will MUCH more convenient, and use fewer resources
/*S.window.addEventListener('mousedown',function(event){
	switch(event.button){
		// Left button
		case 0:
			//if(!S.paused) S.input();
			//if(S.paused) S.toggle();
			break;
		// Middle button
		case 1:
			break;
		// Right button
		case 2:
			event.stopPropagation();
			event.preventDefault();
			S.toggle();
			break;
	}
});*/

// Toggling the menu

S.window.addEventListener('contextmenu',function(event){
	event.preventDefault();
	event.stopPropagation();
	S.toggle();
});

/*S.window.addEventListener('touchend',function(event){
	if(event.touches.length>1){
		
	}
});*/

/*
	// Right button
		case 2:
			event.stopPropagation();
			event.preventDefault();
			S.toggle();
			break;
	*/

// Update the scrub bar when scrolling
pageTurn.addEventListener('scroll',function(event){
	event.stopPropagation();
	
	if(S.infiniteScroll){
		// if(content.classList.contains('showpony-loading')) return;
		
		console.log(sticky);
		
		// Set current time to percent scrolled
		if(!scrubbing && sticky===false){
			var parts=pageTurn.children;
			for(var i=0;i<parts.length;i++){
				// If we're beyond a part
				if(pageTurn.scrollTop>parts[i].offsetTop+parts[i].offsetHeight) continue;
				
				S.currentFile=parseInt(parts[i].dataset.file);
				
				timeUpdate(S.files[S.currentFile].duration*((pageTurn.scrollTop-parts[i].offsetTop)/parts[i].offsetHeight));
				
				break;
			}
		}
		
		// If 1 page height away from bottom
		if(this.scrollTop>=this.scrollHeight-this.clientHeight*2){
			for(var i=S.currentFile+1;i<S.files.length;i++){
				
				var check=content.querySelector('[data-file="'+i+'"]');
				
				// Not started loading
				if(!check){
					pageTurn.insertAdjacentHTML('beforeend','<div data-file="'+i+'"></div>');
					S.to({file:i});
					return;
				}
				
				// Keep the loop going if it has text
				if(!check.innerHTML){
					return;
				}
			}
		}
		
		// If 1 page height away from top
		if(this.scrollTop<=this.clientHeight){
			for(var i=S.currentFile-1;i>=0;i--){
				console.log(i);
				
				var check=content.querySelector('[data-file="'+i+'"]');
				
				// Not started loading
				if(!check){
					pageTurn.insertAdjacentHTML('afterbegin','<div data-file="'+i+'"></div>');
					S.to({file:i});
					return;
				}
				
				// Keep the loop going if it has text
				if(!check.innerHTML){
					return;
				}
			}
		}
		
		sticky=false;
	}else{
		// Set current time to percent scrolled
		timeUpdate(S.files[S.currentFile].duration*(this.scrollTop/this.scrollHeight));
		
		// If at top
		if(this.scrollTop<=0){
			S.to({time:'-1'});
		}
		
		// If at bottom
		if(this.scrollTop>=this.scrollHeight-this.scrollTop){
			S.to({file:'+1'});
		}
	}
});

// Gamepad support

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
	
	console.log('Connected!',checkGamepad);
	
	if(checkGamepad===null){
		checkGamepad=setInterval(gamepadControls,Math.floor(1000/framerate));
	}
});

window.addEventListener('gamepaddisconnected',function(e){
	// Ignore if it's not the same gamepad
	if(e.gamepad.index!==S.gamepad.id) return;
	
	S.gamepad=null;
	clearInterval(checkGamepad);
	checkGamepad=null;
});

///////////////////////////////////////
/////////////////ADMIN/////////////////
///////////////////////////////////////

///// With new admin panel, we just reload the entire Showpony- this avoids risk of any bugs with AJAX vs reality and the like

}();