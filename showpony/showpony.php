<?php

require 'settings.php';

define('STORIES_PATH'	, DEFAULT_PATH.($_GET['path'] ?? ''));

// Get the query from the paths
define('NAME'			, preg_match('/[^\/]+(?=\/?$)/',STORIES_PATH,$match) ? $match[0] : 'story');
define('SAVE_NAME'		, urlencode(NAME).'Data');

// 0 is save system; 1 is save name; 2 is language
if(!empty($_COOKIE[SAVE_NAME])) $data = explode('&',$_COOKIE[SAVE_NAME]);
else $data = [null,null,null,null,null];

define('SAVE_SYSTEM'	, $data[0] ?? null);
define('CURRENT_SAVE'	, $data[1] ?? 'Autosave');
$language				= $data[2] ?? $_GET['language'] ?? DEFAULT_LANGUAGE;
$subtitles				= $data[3] ?? $_GET['subtitles'] ?? DEFAULT_SUBTITLES;
define('QUALITY'		, $data[4] ?? $_GET['quality'] ?? DEFAULT_QUALITY);

// We'll store all errors and code that's echoed, so we can send that info to the user (in a way that won't break the JSON object).
ob_start();

if(DEBUG) echo 'DEBUG = true. PHP debug info will be passed.\n';

require 'get-file-list.php';

// Pass any echoed statements or errors to the response object
$debugMessages = ob_get_clean();

// Can pass 'export' to get to create a loadable file instead of running PHP every time
if(!empty($_GET['export'])){
	ob_start();
	echo '/*
	
	Showpony Export on ',date('D, d M Y H:i:s'),'
	
	This export does not have the following features:
		- Automatically releasing files based on date
		- Connecting to databases for server-based save files or data
		- Multilingual or subtitle support
	
	This export is intended for a static presentation of this story.
	
	THIS FEATURE IS NOT RECOMMENDED. It is provided for desktop applications or situations where you do not have consistent access to PHP.
	
*/
';
}

header('Content-type: application/javascript');
?>'use strict';

// Add styles if not added already
if(!document.getElementById('s-styles')){
	var styles=document.createElement('style');
	styles.id='s-styles';
	styles.innerHTML=`<?php addslashes(readfile(__DIR__.'/styles.css')); ?>`;
	document.head.appendChild(styles);
}

<?php

// Load modules CSS
foreach(array_keys($media) as $moduleName){
	
?>
// Add <?php echo $moduleName; ?> styles if not added already
if(!document.getElementById('s-<?php echo $moduleName; ?>-styles')){
	var styles=document.createElement('style');
	styles.id='s-<?php echo $moduleName; ?>-styles';
	styles.innerHTML=`<?php addslashes(readfile(__DIR__.'/modules/'.$moduleName.'/styles.css')); ?>`;
	document.head.appendChild(styles);
}

<?php } ?>

<?php
// If the story has its own css file, add it in here
if(file_exists('styles.css')){
	
?>
// Load story-specific css
var styles=document.createElement('style');
styles.innerHTML=`<?php
	addslashes(readfile('styles.css'));
?>`;
document.head.appendChild(styles);

<?php } ?>

new function(){

const S = this;

///////////////////////////////////////
///////////PUBLIC VARIABLES////////////
///////////////////////////////////////

S.files					= <?php echo json_encode($files,JSON_NUMERIC_CHECK); ?>;

S.buffered				= [];
S.currentModule			= null;

var file				= null;
var time				= null;
var language			= <?php echo json_encode($language); ?>;
var subtitles			= <?php echo ($subtitles==='null' ? 'null' : json_encode($subtitles)); ?>;
var quality				= <?php echo json_encode(QUALITY,JSON_NUMERIC_CHECK); ?>;
var fullscreen			= false;
var paused				= false;

// Make language change on changing value
Object.defineProperty(S, 'time', {
	get: function() {
		return time;
	},
	set: function(input){
		if(isNaN(input) && input!=='end') input = timeToSeconds(input);
		
		S.to({time:input});
	}
});

// Make language change on changing value
Object.defineProperty(S, 'file', {
	get: function() {
		return file;
	},
	set: function(input){
		S.to({file:input});
	}
});

S.data					= {};
S.duration				= S.files.map(function(e){return e.duration;}).reduce((a,b) => a+b,0);
S.gamepad				= null;
S.maxQuality			= <?php echo $maxQuality; ?>;
S.modules				= {};
S.queryBookmark			= <?php echo json_encode(NAME); ?>+'-bookmark';
S.saveName				= <?php echo json_encode(SAVE_NAME); ?>;
S.saves					= {
	currentSave	:<?php echo json_encode(CURRENT_SAVE); ?>,
	language	:<?php echo json_encode($language); ?>,
	local		:{},
	system		:<?php echo json_encode(SAVE_SYSTEM); ?>,
	timestamp	:Date.now()
};
S.readingDirection		= <?php echo json_encode($_GET['direction'] ?? DEFAULT_DIRECTION); ?>;
S.subtitlesAvailable				= {<?php

	//Immediately load subtitles if called for
	define('FILES_COUNT'		, count($files));
	define('SUBTITLES_FETCHED'	, false);
	define('SUBTITLES_PATH'		, 'subtitles/'.$subtitles);
	
	if($subtitles !== 'null' && !empty($subtitles)) require __DIR__.'/get-subtitles.php';
	
?>};
S.supportedSubtitles	= <?php
	// Get subtitles
	$supportedSubtitles=[];
	if(file_exists('subtitles')){
		foreach(scandir('subtitles') as $file){
			// Ignore hidden files
			if(!is_dir('subtitles/'.$file) || $file[0]==='.' || $file[0]===HIDING_CHAR) continue;

			// Get the subtitles (if ends with -cc, then it's closed captions)
			$subtitleLanguage = str_replace('-cc','',$file,$closedCaptions);
			if(extension_loaded('intl')) $subtitleLanguage = Locale::getDisplayLanguage($subtitleLanguage);
			if($closedCaptions) $subtitleLanguage .= ' (CC)';
			
			$supportedSubtitles[]=[
				'short'	=>	$file
				,'long'	=>	$subtitleLanguage
			];
		}
	}
	
	echo json_encode($supportedSubtitles);
?>;
S.upcomingFiles			= <?php echo json_encode($releaseDates); ?>;
	
S.window				= document.createElement('div');
S.window.className		= 's s-' + S.readingDirection;
S.window.tabIndex		= 0;
S.window.innerHTML		= `
	<div class="s-content"></div>
	<?php if(file_exists('cover.jpg')) echo '<img class="s-cover" src="',STORIES_PATH,'cover.jpg">'; ?>
	<div class="s-menu">
		<button class="s-progress"></button>
		<button class="s-regress"></button>
		<button class="s-pause"></button>
		<div class="s-scrubber" style="left:0%;"></div>
		<canvas class="s-buffer" width="1000" height="1"></canvas>
		<div class="s-info-text"></div>
		<div class="s-upcoming-file"></div>
		<div class="s-buttons s-hide-on-hold">
			<button class="s-button s-button-language" data-type="language" alt="Language" title="Language"></button>
			<button class="s-button s-button-subtitles" data-type="subtitles" alt="Subtitles" title="Subtitles"></button>
			<button class="s-button s-button-quality" data-type="quality" alt="Quality" title="Quality Toggle"></button>
			<button class="s-button s-button-bookmark" data-type="bookmark" alt="Bookmark" title="Bookmarks Toggle"></button>
			<button class="s-button s-button-fullscreen" data-type="fullscreen" alt="Fullscreen" title="Fullscreen Toggle"></button>
		</div>
		<div class="s-popup s-popup-language"></div>
		<div class="s-popup s-popup-subtitles"></div>
		<div class="s-popup s-popup-quality"></div>
		<div class="s-popup s-popup-bookmark"></div>
		<div class="s-popup s-notice">
			<div class="s-notice-text s-block-scrubbing"></div>
			<button class="s-notice-close">Close Notice</button>
		</div>
	</div>
`;

///////////////////////////////////////
///////////PRIVATE VARIABLES///////////
///////////////////////////////////////

const content			= S.window.getElementsByClassName('s-content')[0];
content.classList.add('s-loading');
const overlay			= S.window.getElementsByClassName('s-menu')[0];
const buffer			= S.window.getElementsByClassName('s-buffer')[0];
const infoText			= S.window.getElementsByClassName('s-info-text')[0];
const pause				= S.window.getElementsByClassName('s-pause')[0];
const scrubber			= S.window.getElementsByClassName('s-scrubber')[0];
const progress			= S.window.getElementsByClassName('s-progress')[0];
const regress			= S.window.getElementsByClassName('s-regress')[0];
const noticeEl			= S.window.getElementsByClassName('s-notice')[0];

var actionTimeout		= null;		// Used to start running constant mousedown functions, like fast-forward and rewind
var actionInterval		= null;		// Used to run constant mousedown functions, like fast-forward and rewind
var clickStart			= false;	// Whether a click was started inside Showpony
var checkGamepad		= null;
var framerate			= 60;		// Connected to gamepad use and games
var scrubbing			= false;	// Our state of scrubbing
var searchParams		= new URLSearchParams(window.location.search);

///////////////////////////////////////
////////////////MODULES////////////////
///////////////////////////////////////
<?php

// Load modules
foreach(array_keys($media) as $moduleName){
	require __DIR__.'/modules/'.$moduleName.'/object.js';
}

?>

///////////////////////////////////////
///////////PUBLIC FUNCTIONS////////////
///////////////////////////////////////
var notice = null;

// Make language change on changing value
Object.defineProperty(S, 'notice', {
	get: function() {
		return notice;
	},
	set: function(input){
		if(!paused) S.paused = true;
	
		var noticeText=noticeEl.querySelector('.s-notice-text');
		
		// If a message is currently up, add new messages to the list rather than overwriting them
		if(noticeEl.classList.contains('s-visible')) noticeText.innerHTML += '<hr class="s-block-scrubbing"><p class="s-block-scrubbing">'+input+'</p>';
		else noticeText.innerHTML = '<p class="s-block-scrubbing">'+input+'</p>';
		
		noticeEl.classList.add('s-visible');
		
		notice = input;
		noticeEl.focus();
	}
});

// Go to another file
S.to = function(obj = {file:file, time:time}){
	content.classList.add('s-loading');
	
	/// GET TIME AND FILE ///
	
	// Special values
	if(obj.file==='last') obj.file=S.files.length-1;
	
	obj.file = Math.max(0,obj.file || 0);
	
	// If we're not going to the end, adjust time values; 'end' gets passed to the modules
	if(obj.time!=='end'){
		// Minimal time and file values are 0
		obj.time = Math.max(0,parseFloat(obj.time) || 0);
		
		// Based on time, get the right file
		for(obj.file;obj.file<S.files.length;obj.file++){
			if(obj.time<S.files[obj.file].duration) break; // We've reached the file
			
			obj.time-=S.files[obj.file].duration;
		}
	}
		
	// If we're past the end, go to the very end
	if(obj.file >= S.files.length){
		obj.file = S.files.length-1;
		obj.time = S.files[obj.file].duration;
		
		// Run the event that users can read
		S.window.dispatchEvent(new CustomEvent('end'));
		
		// Pause
		S.paused = true;
	}
	
	/// LOAD RIGHT MODULE AND SOURCE ///
	
	// If switching types, do some cleanup
	if(S.currentModule!==S.files[obj.file].module){
		while(content.firstChild) content.removeChild(content.firstChild);
		content.appendChild(S.modules[S.files[obj.file].module].window);
	}
	
	S.currentModule=S.files[obj.file].module;
	
	// Load the file
	if(S.files[obj.file].buffered===false) S.files[obj.file].buffered='buffering';
	
	S.modules[S.currentModule].src(obj.file,obj.time).then((obj)=>{
		file=S.modules[S.currentModule].currentFile=obj.file;
		S.modules[S.currentModule].currentTime=obj.time;
		S.displaySubtitles();
		timeUpdate();
		
		/// PRELOAD ///
		if(scrubbing) return;
		
		// We can preload up to this amount
		var preloadBytes=<?php echo PRELOAD_BYTES; ?>;
		
		// Preload upcoming files
		for(let i=obj.file;i<S.files.length;i++){
			// Check if we can preload this
			preloadBytes-=S.files[obj.file].size;
			
			// If not, exit
			if(preloadBytes<=0) break;
			
			// Otherwise, preload
			if(Array.isArray(S.files[i].buffered) && S.files[i].buffered.length===0){
				S.files[i].buffered='buffering';
				
				fetch(S.files[i].path)
				.then(response=>{
					if(response.ok){
						S.files[i].buffered=true;
						getTotalBuffered();
						return true;
					}
					
					S.notice = ('Error buffering file '+S.files[i].path);
				});
			}
		}
	})
	.catch(response=>{
		S.notice = ('Error loading File '+obj.file+' at Time '+obj.time+' for Module '+S.currentModule);
	});
}

// Make language change on changing value
Object.defineProperty(S, 'paused', {
	get: function() {
		return paused;
	},
	set: function(input){
		if(input === 'toggle') input = !paused;
		
		// Play
		if(!input){
			if(paused===false) return;
			
			// Close popups
			while(S.window.querySelector('.s-visible')) S.window.querySelector('.s-visible').classList.remove('s-visible');
			
			S.window.classList.remove('s-paused');
			paused=false;
			S.modules[S.currentModule].play();
			S.window.dispatchEvent(new CustomEvent('play'));
		}
		// Pause
		else{
			if(paused===true) return;
			
			S.window.classList.add('s-paused');
			paused=true;
			
			if(S.currentModule) S.modules[S.currentModule].pause();
			S.window.dispatchEvent(new CustomEvent('pause'));
		}
	}
});

S.load = function(){
	S.saves=JSON.parse(localStorage.getItem(S.saveName));
	
	switch(S.saves.system){
		case 'local':
			var loadFile=S.saves.local[S.saves.currentSave];
			
			// If the load file can't be found, break
			if(!loadFile) break;
			
			S.data=loadFile.data;
			language=loadFile.language;
			subtitles=loadFile.subtitles;
			quality=loadFile.quality;
			
			return loadFile.bookmark;
			break;
		case 'remote':
			break;
		default:
			break;
	}
}

S.save = function(){
	// TODO: Don't save the bookmark if relevant data is the same
	// if(
		// oldValues!==null
		// && newValues.bookmark===oldValues.bookmark
		// && JSON.stringify(newValues.data)===JSON.stringify(oldValues.data) // objects can easily read different; stringifying them both ensures they'll read the same
	// ) return;
	
	switch(S.saves.system){
		case 'local':
			// Update the save file before setting it
			S.saves.local[S.saves.currentSave]={
				bookmark:time
				,data:S.data
				,language:language
				,subtitles:subtitles
				,quality:quality
				,timestamp:Date.now()
			};
			break;
		case 'remote':
			break;
		default:
			break;
	}
	
	localStorage.setItem(S.saveName,JSON.stringify(S.saves));
	
	// Some information is saved to cookies so PHP can access them. We compress it for simplicity and using minimal cookie space.
	document.cookie=S.saveName+'='
		+encodeURIComponent(
			S.saves.system
			+'&'+S.saves.currentSave
			+'&'+language
			+'&'+subtitles
			+'&'+quality
		)
	;
} 

// Make language change on changing value
Object.defineProperty(S, 'language', {
	get: function(){
		return language;
	},
	set: function(newLanguage=<?php echo json_encode($language); ?>){
		if(language === newLanguage) return;
		
		fetch('showpony/fetch-file-list.php?path=<?php echo $_GET['path'] ?? ''; ?>&lang='+newLanguage)
		.then(response=>{return response.json();})
		.then(json=>{
			S.files=json;
			language = newLanguage;
			
			// Need to set this to -1 to reload the current file
			S.modules[S.currentModule].currentFile=-1;
			
			S.time = time;
		})
		.catch(error=>{
			S.notice = ('Failed to load language files. '+error);
		});
	}
});

// Toggle fullscreen, basing the functions on the browser's abilities
// Standards fullscreen
if(S.window.requestFullscreen){
	Object.defineProperty(S, 'fullscreen', {
		get: function() {
			return fullscreen;
		},
		set: function(input){
			if(input === 'toggle') input = !fullscreen;
			
			if(input){
				if(document.fullscreenElement) return;
				
				fullscreen=true;
				S.window.requestFullscreen();
				S.window.dispatchEvent(new CustomEvent('fullscreenEnter'));
			}
			else{
				if(!document.fullscreenElement) return;
				
				document.exitFullscreen();
				S.window.dispatchEvent(new CustomEvent('fullscreenExit'));
			}
		}
	});
	
	document.addEventListener('fullscreenchange',function(){
		fullscreen = (document.fullscreenElement === S.window);
	});
}
// Webkit fullscreen
else if(S.window.webkitRequestFullscreen){
	Object.defineProperty(S, 'fullscreen', {
		get: function() {
			return fullscreen;
		},
		set: function(input){
			if(input === 'toggle') input = !fullscreen;
			
			if(input){
				if(document.webkitFullscreenElement) return;
				
				S.window.webkitRequestFullscreen();
				S.window.dispatchEvent(new CustomEvent('fullscreenEnter'));
			}
			else{
				if(!document.webkitFullscreenElement) return;
				
				document.webkitExitFullscreen();
				S.window.dispatchEvent(new CustomEvent('fullscreenExit'));
			}
		}
	});
	
	document.addEventListener('webkitfullscreenchange',function(){
		fullscreen = (document.webkitFullscreenElement === S.window);
	});
}
// No fullscreen support fullscreen (like for iOS Safari)
else{
	Object.defineProperty(S, 'fullscreen', {
		get: function() {
			return fullscreen;
		},
		set: function(input){
			if(input === 'toggle') input = !fullscreen;
			
			if(input){
				if(S.window.classList.contains('s-fullscreen-alt')) return;
				
				S.window.classList.add('s-fullscreen-alt');
				document.getElementsByTagName('html')[0].classList.add('s-fullscreen-control');
				
				S.window.dataset.prevz=S.window.style.zIndex || 'initial';
				
				// From: https://stackoverflow.com/questions/1118198/how-can-you-figure-out-the-highest-z-index-in-your-document
				S.window.style.zIndex=Array.from(document.querySelectorAll('body *'))
				   .map(a => parseFloat(window.getComputedStyle(a).zIndex))
				   .filter(a => !isNaN(a))
				   .sort((a,b)=>a-b)
				   .pop()+1;
				   
				fullscreen = true;
				S.window.dispatchEvent(new CustomEvent('fullscreenEnter'));
			}
			else{
				if(!S.window.classList.contains('s-fullscreen-alt')) return;
				
				S.window.classList.remove('s-fullscreen-alt');
				document.getElementsByTagName('html')[0].classList.remove('s-fullscreen-control');
				
				// Get the original z-index value
				S.window.style.zIndex=S.window.dataset.prevz;
				S.window.removeAttribute('data-prevz');
				
				fullscreen = false;
				S.window.dispatchEvent(new CustomEvent('fullscreenExit'));
			}
		}
	});
}

S.regress = function(){
	S.modules[S.currentModule].regress();
}

S.progress = function(){
	S.modules[S.currentModule].progress();
}

///////////////////////////////////////
///////////PRIVATE FUNCTIONS///////////
///////////////////////////////////////

function checkCollision(x=0,y=0,element){
	var bounds=element.getBoundingClientRect();
	
	// If element is collapsed or outside of x and y, return
	if(bounds.width===0 || bounds.height===0
		|| y<bounds.top || y>bounds.bottom
		|| x<bounds.left || x>bounds.right
	) return false;
	
	return true;
}

function timeUpdate(){
	// Get the current time in the midst of the entire Showpony
	time = parseFloat(S.modules[S.currentModule].currentTime);
	for(let i=0;i<file;i++) time += parseFloat(S.files[i].duration);
	
	if(scrubbing!==true) scrub(null);

	// Run custom event for checking time
	S.window.dispatchEvent(
		new CustomEvent(
			'timeupdate'
			,{
				detail:{
					file:file
					,time:time
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
	S.buffered=[];
	
	// Update amount buffered total
	for(let i=0;i<S.files.length;i++){
		var bufferTrack=false;
		
		if(S.files[i].buffered===true){
			bufferTrack=[time,parseFloat(time+S.files[i].duration)];
			
			if(bufferTrack){
				// Combine buffered arrays, if we're moving forward
				if(S.buffered.length>0 && bufferTrack[0]<=S.buffered[S.buffered.length-1][1]) S.buffered[S.buffered.length-1][1]=bufferTrack[1];
				else S.buffered.push(bufferTrack);
			}
		}
		else if(Array.isArray(S.files[i].buffered)){
			// Get working for multiple contained buffers
			for(let ii=0;ii<S.files[i].buffered.length;ii++){
				bufferTrack=[
					time+parseFloat(S.files[i].buffered[ii][0])
					,time+parseFloat(S.files[i].buffered[ii][1])
				];
				
				// Combine buffered arrays, if we're moving forward
				if(S.buffered.length>0 && bufferTrack[0]<=S.buffered[S.buffered.length-1][1]) S.buffered[S.buffered.length-1][1]=bufferTrack[1];
				else S.buffered.push(bufferTrack);
			}
		}
		
		time+=parseFloat(S.files[i].duration);
	}
	
	if(S.buffered.length===1 && S.buffered[0][0]===0 && S.buffered[0][1]>=S.duration) S.buffered=true;
	if(S.buffered.length===0) S.buffered=[];
	
	// Show buffer
	var ctx = buffer.getContext('2d');
	
	// Update info on popup
	if(S.buffered === true){
		ctx.fillRect(0,0,buffer.width,1);
	}else if(Array.isArray(S.buffered)){
		ctx.clearRect(0,0,buffer.width,1);
		for(let i=0;i<S.buffered.length;i++){
			ctx.fillRect(
				Math.floor(S.buffered[i][0]/S.duration*buffer.width)
				,0
				,Math.floor((S.buffered[i][1]-S.buffered[i][0])/S.duration*buffer.width)
				,1
			);
		}
	}
}

var scrubLoad=null;
var scrubLoadTime=null;

function infoTime(time){
	return (S.duration>3600 ? String(time / 3600|0).padStart(String((S.duration / 3600)|0).length,'0')+':' : '')
		+String(time / 60 % 60|0).padStart(2,'0')+':'
		+String(time % 60|0).padStart(2,'0');
}

function infoFile(input){
	return String(input).padStart((String(S.files.length).length),'0');
}

// This updates the scrub bar's position
function scrub(inputPercent=null){
	// inputPercent will always be from left-to-right; remember that for display reading from right-to-left
	
	// If no inputPercent was set, get it!
	if(inputPercent === null){
		// Left-to-right reading
		if(S.readingDirection === 'left-to-right'){
			inputPercent = time/S.duration;
		// Right-to-left reading
		}else{
			inputPercent = 1 - (time/S.duration);
		}
	}
	
	if(inputPercent<0) inputPercent=0;
	if(inputPercent>1) inputPercent=1;
	
	// Move the progress bar
	scrubber.style.left=(inputPercent*100)+'%';
	
	// If scrubbing, estimate the new time
	if(scrubbing===true){
		var displayTime;
		
		// Left-to-right reading
		if(S.readingDirection === 'left-to-right'){
			displayTime = S.duration * inputPercent;
		// Right-to-left reading
		}else{
			displayTime = S.duration * (1 - inputPercent);
		}
		
		/// LOADING THE SELECTED FILE ///
		clearTimeout(scrubLoad);
		scrubLoad=null;
		if(checkBuffered(displayTime)) S.time = displayTime;
		else{
			// Load the file if we sit in the same spot for a moment
			scrubLoadTime=displayTime;
			scrubLoad=setTimeout(S.to,400,{time:scrubLoadTime});
		}
		
		var displayFile = 0;
		var timeCheck = displayTime;
		// Based on time, get the right file
		for(displayFile; displayFile < S.files.length - 1; displayFile++){
			if(timeCheck < S.files[displayFile].duration) break; // We've reached the file
			
			timeCheck -= S.files[displayFile].duration;
		}
	}
	// Otherwise, get it based off current values
	else{
		var displayTime = time;
		var displayFile = file;
	}
	
	<?php
	switch($_GET['progress'] ?? DEFAULT_PROGRESS){
		case 'file':
			?>
	var completed = infoFile(displayFile + 1);
    var remaining = infoFile(S.files.length - (displayFile + 1));
			<?php
			break;
		case 'time':
			?>
	var completed = infoTime(displayTime);
	var remaining = infoTime(S.duration - displayTime);
			<?php
			break;
		case 'percent':
			?>
	var completed = (Math.round(inputPercent * 100)) + '%';
	var remaining = (Math.round((1 - inputPercent) * 100)) + '%';
			<?php
			break;
	}
	?>
    
    var info = '<p>'+completed+'</p><p>';
	
	if(S.files[displayFile].title) info+=S.files[displayFile].title;
	info+='</p><p>'+remaining+'</p>';
	
	// Add info about upcoming parts if not added already
	if(displayFile===S.files.length-1 && S.upcomingFiles.length
		&& !S.window.querySelector('.s-upcoming-file').innerHTML){
		var upcoming='';
		for(var i=0;i<S.upcomingFiles.length;i++){
			upcoming+='Next Update: '+new Intl.DateTimeFormat(
				undefined //Uses the default locale
				,{
					formatMatcher:'best fit'
					,year:'numeric'
					,month:'numeric'
					,day:'numeric'
					,hour:'numeric'
					,minute:'numeric'
					,second:'numeric'
					,timeZoneName:'short'
				}
			).format(new Date(S.upcomingFiles[i])*1000);;
			
			if(i<S.upcomingFiles.length-1) upcoming+='<br>';
		}
		
		S.window.querySelector('.s-upcoming-file').innerHTML='<p>'+upcoming+'</p>';
	}
	
	if(info!==infoText.innerHTML) infoText.innerHTML=info;
	
	// We don't want to over-update the title, so we stick with when we're not scrubbing.
	if(info!==document.title) document.title=completed+' - '+remaining;
}

var pointerXStart = null;
var pointerYStart = null;
var pointerMoved = false;

// When the user scrubs, this function runs
function userScrub(event){
	var pointer;
	if(event.changedTouches) pointer=event.changedTouches[0];
	else pointer=event;
	
	// Don't scrub if touching with 2 or more fingers at once
	// if(event.touches && event.touches.length>1) return;
	
	event.preventDefault();
	
	var percent = (pointer.clientX-S.window.getBoundingClientRect().left)/(S.window.getBoundingClientRect().width);
	
	// We give ourselves a little snap near the edges
	const scrubSnap=.0025;
	if(percent<0+scrubSnap) percent=0;
	if(percent>1-scrubSnap) percent=1;
	
	// You have to swipe farther than you move the cursor to adjust the position
	if(scrubbing!==true && scrubbing!==false && paused){
		// 34 creates an arbitrary percentage of the screen that seems to feel good to trigger scrubbing
		if(Math.abs(scrubbing-pointer.clientX) >= screen.width/34){
		
			// Don't wait to start a series of actions
			clearTimeout(actionTimeout);
			actionTimeout=null;
			clearInterval(actionInterval);
			actionInterval=null;
			
			// Remove active button, if one exists
			while(overlay.querySelector('.s-active')) overlay.querySelector('.s-active').classList.remove('s-active');
			
			// S.window.classList.add('s-hold');
			
			scrubbing=true;
			
			// Don't let cursor position throw this off
			pointerXStart = null;
			pointerYStart = null;
		}
	}
	
	// Consider if we've moved too far for clicking functions to run
	if(
		scrubbing !== true
		&& !pointerMoved
		&& pointerXStart !== null
		// Distance
		&& Math.abs(
			Math.sqrt(
				Math.pow(pointerXStart - pointer.clientX,2)
				+ Math.pow(pointerYStart - pointer.clientY,2)
			)
		)
		> screen.width/20 // 25 is made to not interrupt scrubbing, while still meaning that if we move far enough, we'll ignore scrubbing (like if we're vertically scrolling
	){
		pointerMoved = true;
		scrubbing = false;
		
		// Remove active button, if one exists
		while(overlay.querySelector('.s-active')) overlay.querySelector('.s-active').classList.remove('s-active');
		
		// Don't let actions happen
		clearTimeout(actionTimeout);
		actionTimeout = null;
		clearInterval(actionInterval);
		actionInterval = null;
		return;
	};
	
	if(scrubbing == true) scrub(percent);
}

S.displaySubtitles = function(newSubtitles = subtitles){
	// Display the subtitles if they're loaded in
	if(S.subtitlesAvailable[newSubtitles] || newSubtitles===null){
		subtitles = newSubtitles;
		S.modules[S.currentModule].displaySubtitles();
	// Otherwise, load them
	}else{
		// If we have these subtitles available raw, get those
		if(S.subtitlesAvailable[newSubtitles + '-RAW']){
			console.log('processing raw');
			S.subtitlesAvailable[newSubtitles] = processSubtitles(S.subtitlesAvailable[newSubtitles + '-RAW'], false);
			subtitles = newSubtitles;
			S.modules[S.currentModule].displaySubtitles();
		// Otherwise, fetch
		} else {
			fetch('showpony/fetch-subtitles.php?path=<?php echo STORIES_PATH; ?>&lang=' + newSubtitles + '&files=' + S.files.length)
			.then(response=>{if(response.ok) return response.text();})
			.then(text=>{
				S.subtitlesAvailable[newSubtitles] = processSubtitles(text);
				subtitles = newSubtitles;
				S.modules[S.currentModule].displaySubtitles();
			})
			.catch(response=>{
				subtitles=null;
				S.notice = ('Error loading subtitles for '+newSubtitles);
			});
		}
	}
}

function processSubtitles(text,fromFetch = true){
	// fromFetch is needed because the line breaks when the text is loaded into JS is different from when it's called with fetch.
	// There's gotta be a better way to do this, this is ridiculous...
	
	var filesArray = [];
			
	// Loop through files
	var files = text.split('|SPLIT|');
	for(var i = 0; i < files.length; i++){
		var grouping = {};
		
		// Loop through sections
		
		// (get rid of surrounding blanks)
		var sections=files[i].replace(/^\s+|\s+$/g,'');
		// Split between lines
		if(fromFetch) sections=sections.split(/[\r\n]{4,}/g);
		else sections=sections.split(/[\r\n]{2,}/g);
		
		for(var j=0;j<sections.length;j++){
			var name=j;
			var phrase={
				start:null
				,end:null
				,content:''
			};
			
			// Loop through chunk
			if(fromFetch) var chunk=sections[j].split(/[\r\n]{2,}/g);
			else var chunk=sections[j].split(/[\r\n]+/g);
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
					name=chunk[k].replace(/\s+/,'');
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
	
	return filesArray;
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
	if(document.activeElement!==S.window && !fullscreen) return;
	
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
	if(S.gamepad.menu==2) S.paused = 'toggle';
	if(S.gamepad.input==2) S.progress();
	if(S.gamepad.dpadL==2) S.regress();
	if(S.gamepad.dpadR==2) S.progress();
	if(S.gamepad.end==2) S.to({time:'end'});
	if(S.gamepad.home==2) S.to({time:'start'});
	if(S.gamepad.fullscreen==2) S.fullscreen = 'toggle';
	
	// TODO: add joystick support back in (once it's working elsewhere)
	/*
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
			// userScrub(S.gamepad.analogL);
			pos=0;
		}
	}*/
}

function gamepadAxis(gamepad,number,type){
	// Get amount between -1 and 1 based on distance between values
	if(Math.abs(gamepad.axes[number])>=S.gamepad.axisMin){
		if(gamepad.axes[number]>0) S.gamepad[type]=(gamepad.axes[number]-S.gamepad.axisMin)/(S.gamepad.axisMax-S.gamepad.axisMin);
		else S.gamepad[type]=((gamepad.axes[number]-(-S.gamepad.axisMax))/(-S.gamepad.axisMin-(-S.gamepad.axisMax)))-1;
		
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

////////////

// Toggle popups on clicking buttons
S.window.getElementsByClassName('s-button-language')[0].addEventListener('click',popupToggle);
S.window.getElementsByClassName('s-button-subtitles')[0].addEventListener('click',popupToggle);
S.window.getElementsByClassName('s-button-bookmark')[0].addEventListener('click',popupToggle);
S.window.getElementsByClassName('s-button-quality')[0].addEventListener('click',popupToggle);
S.window.getElementsByClassName('s-button-fullscreen')[0].addEventListener('click',function(){
	S.fullscreen = 'toggle';
});

function popupToggle(){
	var closePopups = S.window.querySelectorAll('.s-visible:not(.s-popup-'+this.dataset.type+')');
	for(var i = 0; i < closePopups.length; i++) closePopups[i].classList.remove('s-visible');
	
	S.window.querySelector('.s-popup-'+this.dataset.type).classList.toggle('s-visible');
}

S.window.querySelector('.s-notice-close').addEventListener('click',function(){
	S.window.querySelector('.s-notice').classList.remove('s-visible');
});

const supportedLanguages=<?php
	// Get subtitles
	$languages=[];
	foreach(scandir('.') as $file){
		// Ignore hidden folders and subtitles folder
		if($file==='subtitles' || $file==='resources' || !is_dir($file) || $file[0]==='.' || $file[0]===HIDING_CHAR) continue;

		$languages[]=[
			'short'	=>	$file
			,'long'	=>	extension_loaded('intl') ? (Locale::getDisplayLanguage($file)) : $file
		];
	}
	
	echo json_encode($languages);
?>;

if(<?php if(!empty($_GET['export'])) echo 'false || '; ?>supportedLanguages.length>1){
	function toggleLanguage(){
		// Ignore clicking on same button again
		if(language === this.dataset.value) return;
		
		// Remove selected class from previous selected item
		var previous=S.window.querySelector('.s-popup-language .s-selected');
		if(previous){
			previous.classList.remove('s-selected');
		}
		
		this.classList.add('s-selected');
		S.language = this.dataset.value;
	}

	var languageButtons=document.createDocumentFragment();
	for(var i=0;i<supportedLanguages.length;i++){
		var buttonEl=document.createElement('button');
		buttonEl.innerText=supportedLanguages[i]['long'];
		buttonEl.dataset.value=supportedLanguages[i]['short'];
		buttonEl.addEventListener('click',toggleLanguage);
		
		if(language === supportedLanguages[i]['short']) buttonEl.className='s-selected';
		
		languageButtons.appendChild(buttonEl);
	}
	S.window.querySelector('.s-popup-language').appendChild(languageButtons);
}else{
	S.window.querySelector('.s-button-language').remove();
}

if(<?php if(!empty($_GET['export'])) echo 'false || '; ?>S.supportedSubtitles.length>0){
	var subtitleButtons=document.createDocumentFragment();
	for(var i=0;i<S.supportedSubtitles.length;i++){
		var buttonEl=document.createElement('button');
		buttonEl.innerText=S.supportedSubtitles[i]['long'];
		buttonEl.dataset.value=S.supportedSubtitles[i]['short'];
		buttonEl.addEventListener('click',function(){
			S.subtitles = this.dataset.value;
		});
		
		if(subtitles===S.supportedSubtitles[i]['short']) buttonEl.className='s-selected';
		
		subtitleButtons.appendChild(buttonEl);
	}
	S.window.querySelector(".s-popup-subtitles").appendChild(subtitleButtons);
}else{
	S.window.querySelector('.s-button-subtitles').remove();
}

// Make language change on changing value
Object.defineProperty(S, 'subtitles', {
	get: function() {
		return subtitles;
	},
	set: function(newSubtitles){
		// Remove selected class from previous selected item
		var previous=S.window.querySelector('.s-popup-subtitles .s-selected');
		if(previous){
			previous.classList.remove('s-selected');
		}
		
		// Set subtitles to null if clicking on the same item
		if(subtitles===newSubtitles){
			S.displaySubtitles(null);
			return;
		}
		
		// this.classList.add('s-selected');
		S.displaySubtitles(newSubtitles);
	}
});

// delete S.supportedSubtitles;

// Add quality dropdown
if(S.maxQuality > 0){

	// The terms for different levels of quality
	var qualityTerms = <?php echo json_encode(QUALITY_NAMES); ?>;
	
	var qualityButtons=document.createDocumentFragment();
	for(var i=0; i <= S.maxQuality; i++){
		var buttonEl = document.createElement('button');
		
		// Get a quality term and use it here
		if(i >= qualityTerms.length) buttonEl.innerText = '[UNNAMED]';
		else buttonEl.innerText = qualityTerms[i];
		
		buttonEl.dataset.value = i;
		buttonEl.addEventListener('click',function(){
			S.quality = this.dataset.value;
		});
		
		if(quality === i) buttonEl.className='s-selected';
		
		qualityButtons.appendChild(buttonEl);
	}
	S.window.querySelector(".s-popup-quality").appendChild(qualityButtons);
// Remove the quality button if we have no options
} else {
	S.window.querySelector('.s-button-quality').remove();
}

// Make language change on changing value
Object.defineProperty(S, 'quality', {
	get: function() {
		return quality;
	},
	set: function(newQuality){
		// Ignore if re-selecting an old item
		if(quality === newQuality) return;
		
		// Remove selected class from previous selected item
		var previous=S.window.querySelector('.s-popup-quality .s-selected');
		if(previous){
			previous.classList.remove('s-selected');
		}
		
		// if(this.dataset) this.classList.add('s-selected');
		
		quality = newQuality;
		S.to();
	}
});

// Bookmarks
function toggleBookmark(){
	// Remove selected class from previous selected item
	var previous=S.window.querySelector('.s-popup-bookmark .s-selected');
	if(previous){
		previous.classList.remove('s-selected');
	}

	// Set to null if clicking on the same item
	if(S.saves.currentSave===this.dataset.name
		&& S.saves.system===this.dataset.system
	){
		S.saves.system=null;
		S.saves.currentSave=null;
		return;
	}
	
	this.classList.add('s-selected');
	S.saves.system=this.dataset.system;
	S.saves.currentSave=this.dataset.name;
}

// var bookmarkList=Object.keys(S.saves.local);
// for(var i=0;i<bookmarkList.length;i++){
	// addBookmark({
		// name:bookmarkList[i]
		// ,system:'local'
		// ,type:'default'
	// });
// }

function addBookmark(obj){
	var bookmarkEl=document.createElement('div');
	bookmarkEl.className='s-bookmark';
	
	var nameEl=document.createElement('button');
	nameEl.className='s-bookmark-name';
	nameEl.innerText=obj.name;
	nameEl.dataset.name=obj.name;
	nameEl.dataset.system=obj.system;
	
	switch(obj.system){
		// Saving the bookmark in localStorage
		case 'local':
			nameEl.addEventListener('click',toggleBookmark);
			if(
				S.saves.currentSave===obj.name
				&& S.saves.system===obj.system
			) nameEl.classList.add('s-selected');
			break;
		// Saving the page name in the URL/querystring
		case 'url':
			nameEl.addEventListener('click',function(){
				searchParams.set(S.queryBookmark,time|0);
				
				var url = location.host + location.pathname + '?' + searchParams.toString() + location.hash;
				var temporaryInput = document.createElement('textarea');
				temporaryInput.value = url;
				
				this.insertAdjacentElement('afterend',temporaryInput);
				
				temporaryInput.select();
				document.execCommand('copy');
				temporaryInput.remove();
				
				S.notice = 'Copied the link to your clipboard!';
			});
			break;
		default:
			S.notice = 'Save system not recognized!';
			break;
	}
	
	bookmarkEl.appendChild(nameEl);
	
	S.window.querySelector(".s-popup-bookmark").appendChild(bookmarkEl);
}

///////////////////////////////////////
////////////EVENT LISTENERS////////////
///////////////////////////////////////

// Save user bookmarks when leaving the page
window.addEventListener('blur',S.save);
window.addEventListener('beforeunload',S.save);

// Save the bookmark if the website is hidden
document.addEventListener('visibilitychange',function(){
	if(document.hidden) S.save();
});

// Showpony deselection (to help with Firefox and Edge's lack of support for 'beforeunload')
S.window.addEventListener('focusout',S.save);
S.window.addEventListener('blur',S.save);

// Shortcut keys
S.window.addEventListener(
	'keydown'
	,function(event){
		if(this!==event.target) return;
		
        // Disable keyboard when scrubbing
		if(scrubbing) return;
		if(event.ctrlKey || event.altKey || event.shiftKey || event.metaKey) return;
		
		switch(event.key){
			case ' ':				S.progress();			break;
			case 'Enter':			S.progress();			break;
			case 'ArrowLeft':		(S.readingDirection === 'right-to-left' ? S.progress : S.regress)();	break;
			case 'ArrowRight':		(S.readingDirection === 'right-to-left' ? S.regress : S.progress)();	break;
			// case 'Home':			S.to({time:'start'});	break;
			// case 'End':				S.to({time:'end'});		break;
			case 'MediaPrevious':	S.file--;		break;
			case 'MediaNext':		S.file++;		break;
			case 'MediaPlayPause':	S.paused = 'toggle';				break;
			case 'f':				S.fullscreen = 'toggle';	break;
			case 'm':				S.paused = 'toggle';				break;
			default:				return;					break;
		}
		
		event.preventDefault();
	}
);

// TODO: put this somewhere sensible, or decide that here is fine
var buttonDown = null;

var touching = false;

function pointerDown(event){
	buttonDown = null; // We don't want to carry any previous states from buttonDown
	pointerMoved = false;
	
	// Don't scrub if touching with 2 or more fingers at once
	if(event.touches && event.touches.length>1) return;
	
	var pointer;
	
	if(event.touches){
		pointer=event.touches[0];
		touching = true;
	}
	else{
		if(touching) return;
		pointer=event;
	}
	
	// Track movement
	pointerXStart = pointer.clientX;
	pointerYStart = pointer.clientY;
	
	// Allow left-click only
	if(pointer.button && pointer.button!==0) return;
	
	// event.preventDefault();
	
	// Click was started inside showpony
    clickStart = true;
	
    // Do nothing if the user clicked certain elements
	if(pointer.target.classList.contains('s-popup')) return;
	if(pointer.target.classList.contains('s-notice')) return;
	if(pointer.target.classList.contains('s-block-scrubbing')) return;
	
	// Look through the target and its parents; don't run anything further if we are or are inside a button, input, or anchor
	var node = pointer.target;
	while(node !== null){
		if(node.tagName==='INPUT') return;
		if(node.tagName==='BUTTON') return;
		if(node.tagName==='A') return;
		
		node = node.parentNode;
	}
    
    // Ignore if grabbing a scrollbar
    if(pointer.offsetX>pointer.target.clientWidth || pointer.offsetY>pointer.target.clientHeight) return;

    // Remove the cover image when this is the first time interacting with showpony
    if(S.window.querySelector('.s-cover')){
        S.window.querySelector('.s-cover').remove();
    }
    
	// One event listener for all of the buttons
    // Pause
    if(checkCollision(pointer.clientX,pointer.clientY,pause)){
        buttonDown = 'pause';
		pause.classList.add('s-active');
        actionTimeout=setTimeout(function(){
			// Don't let moving the cursor stop this function
			pointerXStart = null;
			pointerYStart = null;
			
			// Add the display class
            S.window.classList.add('s-hold');
        },500);
	// Progress
    } else if(checkCollision(pointer.clientX,pointer.clientY,progress)){
        buttonDown = 'progress';
		progress.classList.add('s-active');
        actionTimeout=setTimeout(function(){
			// Don't let moving the cursor stop this function
			pointerXStart = null;
			pointerYStart = null;
			
			// Add the display class
            S.window.classList.add('s-hold');
            actionInterval=setInterval(S.progress,50);
        },500);
	// Regress
    } else if(checkCollision(pointer.clientX,pointer.clientY,regress)){
        buttonDown = 'regress';
		regress.classList.add('s-active');
        actionTimeout=setTimeout(function(){
			// Don't let moving the cursor stop this function
			pointerXStart = null;
			pointerYStart = null;
			
			// Add the display class
            S.window.classList.add('s-hold');
            actionInterval=setInterval(S.regress,50);
        },500);
    }
	
	// Scrubbing will be considered here
	scrubbing=pointer.clientX;
	window.getSelection().removeAllRanges();
}

function pointerUp(event){
	// Don't scrub if touching with 2 or more fingers at once
	// if(event.touches && event.touches.length>1) return;
	
	var pointer;
	
	// Remove these values
	pointerXStart = null;
	pointerYStart = null;
	
	if(event.changedTouches){
		pointer=event.changedTouches[0];
	}
	else{
		pointer=event;
		
		if(touching){
			touching = false;
			return;
		}
	}
	
	// Allow left-click only
	if(pointer && pointer.button && pointer.button!==0) return;
	
	// If the click was started outside of showpony, ignore it
    if (!clickStart) return;
    clickStart = false;
    
    clearTimeout(actionTimeout);
    actionTimeout=null;
    clearInterval(actionInterval);
    actionInterval=null;
	
	// Get rid of any active coloring
	while(overlay.querySelector('.s-active')) overlay.querySelector('.s-active').classList.remove('s-active');
	
	var prevScrubState = scrubbing;
    scrubbing=false;
	
	// If we were waiting to load on an interval, load immediately!
	if(scrubLoad){
		clearTimeout(scrubLoad);
		scrubLoad=null;
		S.time = scrubLoadTime;
	}
    
    // Ignore scrollbar
    if(pointer.offsetX>pointer.target.clientWidth || pointer.offsetY>pointer.target.clientHeight) return;
    
	// If we were holding the button, remove the class
	if(S.window.classList.contains('s-hold')){
		S.window.classList.remove('s-hold');
		
		// Next and previous buttons shouldn't be activated again on release if they were held down
		if(buttonDown !== 'pause' || paused === false) return;
	}
	
	// If we were moving the pointer, ignore presses
	if(pointerMoved){
		pointerMoved = false;
		return;
	}
	
	// If we were previously scrubbing, don't press buttons
	if(prevScrubState === true) return;
	
	// Some elements have pointer-events none, but their collisions still matter. We'll see if we're within those buttons here.

	// Don't read clicks if the user's clicking an input or button
	if(pointer.target.classList.contains('s-popup')) return;
	
	// Look through the target and its parents; don't run anything further if we are or are inside a button, input, or anchor
	var node = pointer.target;
	while(node !== null){
		if(node.tagName==='INPUT') return;
		if(node.tagName==='BUTTON') return;
		if(node.tagName==='A') return;
		
		node = node.parentNode;
	}
	
	// Pause
	if(checkCollision(pointer.clientX,pointer.clientY,pause) && buttonDown === 'pause'){
		S.paused = 'toggle';
	}
	// Progress
	else if(checkCollision(pointer.clientX,pointer.clientY,progress) && buttonDown === 'progress'){
		S.progress();
	}
	// Regress
	else if(checkCollision(pointer.clientX,pointer.clientY,regress) && buttonDown === 'regress'){
		S.regress();
	}
    
    buttonDown = null;
}

// Resets to 0 on touch/start click; tracks how much we've moved the pointer since putting it down
var pointerMovement = 0;

S.window.addEventListener('mousedown',pointerDown);
window.addEventListener('mouseup',pointerUp);

S.window.addEventListener('touchstart',pointerDown);
window.addEventListener('touchend',pointerUp);

// On dragging
window.addEventListener('mousemove',userScrub);
window.addEventListener('touchmove',userScrub);

// On touch end, don't keep moving the bar to the user's touch
// overlay.addEventListener('touchend',userScrub);

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
/////////////////START/////////////////
///////////////////////////////////////

// Priority Saves: Newest > Default Start
if(localStorage.getItem(S.saveName)===null){
	// Set defaults
	localStorage.setItem(S.saveName,JSON.stringify({
		currentSave	:'Autosave',
		language	:<?php echo json_encode($language); ?>,
		local		:{},
		system		:null,
		timestamp	:Date.now()
	}));
}else{
	S.saves=JSON.parse(localStorage.getItem(S.saveName));
}

// For now, we'll just support this bookmark
// TODO: allow renaming bookmarks
addBookmark({name:'Autosave',system:'local',type:'default'});
addBookmark({name:'Get Link',system:'url',type:'get'});

// POWER: Hard Link > Bookmark > Soft Link > Default

// Start with the URL Bookmark
var start = searchParams.get(S.queryBookmark);
searchParams.delete(S.queryBookmark);
history.replaceState(null,'',window.location.pathname + '?' + searchParams.toString());

// Use the Save Bookmark if the URL Bookmark has nothing
if(start === null || isNaN(start)) start = S.load();

// Use the Default Bookmark if the Save Bookmark has nothing
if(start === null || isNaN(start)) start = <?php echo $_GET['start'] ?? DEFAULT_START; ?>;

// Pause the Showpony
S.paused = true;
S.time = start;

// We don't remove the loading class here, because that should be taken care of when the file loads, not when Showpony finishes loading

// Add the Showpony window to the document
document.currentScript.insertAdjacentElement('afterend',S.window);

// Put this on the containing element
S.window.parentNode.dispatchEvent(
	new CustomEvent(
		'built'
		,{
			detail:{
				object:S
				,debug:<?php
					if(DEBUG) echo json_encode($debugMessages);
					else echo json_encode('DEBUG = false. No PHP debug info will be passed.');
				?>
			}
		}
	)
);

}();<?php

if(!empty($_GET['export'])) file_put_contents('showpony-export.js',ob_get_clean());

?>