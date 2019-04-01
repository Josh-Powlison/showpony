<?php

require 'settings.php';

if(DEBUG) $time = microtime(true);

define('STORIES_PATH'	, $_GET['path'] ?? DEFAULT_PATH);

// Get the query from the paths
define('NAME'			, preg_match('/[^\/]+(?=\/?$)/',STORIES_PATH,$match) ? $match[0] : 'story');
define('SAVE_NAME'		, urlencode(NAME).'Data');

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

new function(){

// All of these attributes get put on the parent element, so they're easy to reference and call
const S = document.currentScript.parentNode;
var shadow = S.attachShadow({mode: 'open'});

var styles = document.createElement('style');
styles.innerHTML = `<?php
	echo '/* SHOWPONY CSS */\r\n\r\n';
	addslashes(readfile(__DIR__.'/styles.css'));
?>
`;

shadow.appendChild(styles);

const DEBUG = <?php echo DEBUG ? 'true' : 'false'; ?>;

///////////////////////////////////////
///////////PRIVATE VARIABLES///////////
///////////////////////////////////////

const view			= document.createElement('div');
view.tabIndex		= 0;
view.innerHTML		= `
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
			<button class="s-button s-button-bookmark" data-type="bookmark" alt="Bookmark" title="Bookmarks Toggle"></button>
		</div>
		<div class="s-popups">
			<div class="s-popup s-popup-bookmark"></div>
		</div>
		<div class="s-popup s-notice">
			<div class="s-notice-text s-block-scrubbing"></div>
			<button class="s-notice-close">Close Notice</button>
		</div>
	</div>
`;

var file				= null;
var time				= null;
var module				= null;
var language			= <?php echo json_encode($language); ?>;
var subtitles			= <?php echo ($subtitles==='null' ? 'null' : json_encode($subtitles)); ?>;
var quality				= <?php echo json_encode(QUALITY,JSON_NUMERIC_CHECK); ?>;
var fullscreen			= false;
var paused				= true;
var active				= true;
var data				= {};
var debug				= <?php echo DEBUG ? 'true' : 'false'; ?>;

const content			= view.getElementsByClassName('s-content')[0];
content.classList.add('loading');
const overlay			= view.getElementsByClassName('s-menu')[0];
const buffer			= view.getElementsByClassName('s-buffer')[0];
const infoText			= view.getElementsByClassName('s-info-text')[0];
const pause				= view.getElementsByClassName('s-pause')[0];
const scrubber			= view.getElementsByClassName('s-scrubber')[0];
const progressEl		= view.getElementsByClassName('s-progress')[0];
const regressEl			= view.getElementsByClassName('s-regress')[0];
const noticeEl			= view.getElementsByClassName('s-notice')[0];

const contentShadow		= content.attachShadow({mode:'open'});

var contentStyles = document.createElement('style');
contentStyles.innerHTML = `<?php
	// If the story has its own css file, add it in here
	if(file_exists('styles.css')){
		addslashes(readfile('styles.css'));
	} else {
		echo '/* styles.css not found in story folder */';
	}
?>`;
contentShadow.appendChild(document.createElement('style'));	// Module styles
contentShadow.appendChild(contentStyles);						// Story styles
contentShadow.appendChild(document.createElement('div'));		// Module content

const framerate			= 60;		// Connected to gamepad use and games
const queryBookmark		= <?php echo json_encode(NAME); ?>+'-bookmark';
const readingDirection	= <?php echo json_encode($_GET['direction'] ?? DEFAULT_DIRECTION); ?>;
const saveName			= <?php echo json_encode(SAVE_NAME); ?>;

var actionTimeout		= null;		// Used to start running constant mousedown functions, like fast-forward and rewind
var actionInterval		= null;		// Used to run constant mousedown functions, like fast-forward and rewind
var clickStart			= false;	// Whether a click was started inside Showpony
var checkGamepad		= null;
var scrubbing			= false;	// Our state of scrubbing
var searchParams		= new URLSearchParams(window.location.search);
var currentGamepad		= null;

const subtitlesAvailable				= {<?php

	//Immediately load subtitles if called for
	define('FILES_COUNT'		, count($files));
	define('SUBTITLES_FETCHED'	, false);
	define('SUBTITLES_PATH'		, 'subtitles/'.$subtitles);
	
	if($subtitles !== 'null' && !empty($subtitles)) require __DIR__.'/get-subtitles.php';
	
?>};

const modules				= {

<?php

// Load modules
$e = array_keys($media);
$l = count($e);
for($i = 0; $i < $l; $i++){
	echo $e[$i],':';
	require __DIR__.'/modules/'.$e[$i].'/object.js';
	if($i < $l - 1) echo '

,';
}

?>

};

///////////////////////////////////////
///////////PUBLIC VARIABLES////////////
///////////////////////////////////////

S.files					= <?php echo json_encode($files,JSON_NUMERIC_CHECK); ?>;

Object.defineProperty(S, 'time', {
	get: function(input) {
		return time;
	},
	set: function(input){
		if(isNaN(input) && input !== 'end'){
			notice('S.time must be a number or \'end\'.');
			return;
		}
		
		to({time:input});
	}
});

Object.defineProperty(S, 'file', {
	get: function() {
		return file;
	},
	set: function(input){
		// Error handling
		if(isNaN(input)){
			notice('Error: file can only be set to an integer');
			return;
		}
		
		to({file:input});
	}
});

Object.defineProperty(S, 'active', {
	get: function() {
		return active;
	},
	set: function(input){
		// Error handling
		if(input !== true && input !== false){
			notice('Error: active can only be set to true or false');
			return;
		}
		
		if(input){
			if(!paused && module && modules[module].pause) modules[module].play();
			view.classList.remove('s-inactive');
			
			S.dispatchEvent(new CustomEvent('active'));
		}
		else{
			if(module && modules[module].pause) modules[module].pause();
			view.classList.add('s-inactive');
			
			S.dispatchEvent(new CustomEvent('inactive'));
		}
		
		
		
		active = input;
	}
});

// Make language change on changing value
Object.defineProperty(S, 'subtitles', {
	get: function() {
		return subtitles;
	},
	set: function(newSubtitles){
		if(newSubtitles === subtitles) return;
		
		// Make false null
		if(newSubtitles === false) newSubtitles = null;
		
		// Error handling
		if(newSubtitles !== null && !view.querySelector('.s-popup-subtitles [data-value="'+newSubtitles+'"]')){
			notice('Error: subtitles for "' + newSubtitles + '" not found');
			return;
		}
		
		// Remove selected class from previous selected item (if one was selected)
		var previous = view.querySelector('.s-popup-subtitles .s-selected');
		if(previous) previous.classList.remove('s-selected');
		// console.log('hey','.s-popup-subtitles [data-value="'+newSubtitles+'"]');
		if(newSubtitles) view.querySelector('.s-popup-subtitles [data-value="'+newSubtitles+'"]').classList.add('s-selected');
		
		// this.classList.add('s-selected');
		subtitles = newSubtitles;
		S.displaySubtitles(subtitles);
	}
});

// Make language change on changing value
Object.defineProperty(S, 'quality', {
	get: function() {
		return quality;
	},
	set: function(newQuality){
		if(quality === newQuality) return;
		
		// Error handling
		if(isNaN(newQuality) || newQuality < 0 || newQuality > <?php echo $maxQuality; ?>){
			notice('Error: quality must be an integer within the available range, 0 and ' + <?php echo $maxQuality; ?>);
			return;
		}
		
		content.classList.add('loading');
		
		// Remove selected class from previous selected item (if one was selected)
		view.querySelector('.s-popup-quality .s-selected').classList.remove('s-selected');
		view.querySelector('.s-popup-quality [data-value="'+newQuality+'"]').classList.add('s-selected');
		
		quality = newQuality;
		S.time = time;
	}
});

// Make language change on changing value
Object.defineProperty(S, 'language', {
	get: function(){
		return language;
	},
	set: function(newLanguage=<?php echo json_encode($language); ?>){
		if(language === newLanguage) return;
		
		// Error handling
		if(!view.querySelector('.s-popup-language [data-value="'+newLanguage+'"]')){
			notice('Error: the language "'+newLanguage+'" is not supported.');
			return;
		}
		
		content.classList.add('loading');
		
		// Remove selected class from previous selected item
		view.querySelector('.s-popup-language .s-selected').classList.remove('s-selected');
		view.querySelector('.s-popup-language [data-value="'+newLanguage+'"]').classList.add('s-selected');
		
		fetch('showpony/fetch-file-list.php?path=<?php echo $_GET['path'] ?? ''; ?>&lang='+newLanguage)
		.then(response=>{return response.json();})
		.then(json=>{
			S.files = json;
			S.duration = S.files.map(function(e){return e.duration;}).reduce((a,b) => a+b,0);
			
			language = newLanguage;
			
			S.time = time;
		})
		.catch(error=>{
			notice('Failed to load language files. '+error);
		});
	}
});

// Toggle fullscreen, basing the functions on the browser's abilities
// Standards fullscreen
if(view.requestFullscreen){
	Object.defineProperty(S, 'fullscreen', {
		get: function() {
			return fullscreen;
		},
		set: function(input){
			if(input === 'toggle') input = !fullscreen;
			
			// Error handling
			if(input !==true && input !== false){
				notice('Error: fullscreen can only be set to true, false, or "toggle"');
				return;
			}
			
			if(input){
				if(document.fullscreenElement) return;
				
				fullscreen=true;
				view.requestFullscreen();
				S.dispatchEvent(new CustomEvent('fullscreenEnter'));
			}
			else{
				if(!document.fullscreenElement) return;
				
				document.exitFullscreen();
				S.dispatchEvent(new CustomEvent('fullscreenExit'));
			}
		}
	});
	
	document.addEventListener('fullscreenchange',function(){
		fullscreen = (document.fullscreenElement === S);
	});
}
// Webkit fullscreen
else if(view.webkitRequestFullscreen){
	Object.defineProperty(S, 'fullscreen', {
		get: function() {
			return fullscreen;
		},
		set: function(input){
			if(input === 'toggle') input = !fullscreen;
			
			// Error handling
			if(input !==true && input !== false){
				notice('Error: fullscreen can only be set to true, false, or "toggle"');
				return;
			}
			
			if(input){
				if(document.webkitFullscreenElement) return;
				
				view.webkitRequestFullscreen();
				S.dispatchEvent(new CustomEvent('fullscreenEnter'));
			}
			else{
				if(!document.webkitFullscreenElement) return;
				
				document.webkitExitFullscreen();
				S.dispatchEvent(new CustomEvent('fullscreenExit'));
			}
		}
	});
	
	document.addEventListener('webkitfullscreenchange',function(){
		fullscreen = (document.webkitFullscreenElement === S);
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
			
			// Error handling
			if(input !==true && input !== false){
				notice('Error: fullscreen can only be set to true, false, or "toggle"');
				return;
			}
			
			if(input){
				if(view.classList.contains('s-fullscreen-alt')) return;
				
				view.classList.add('s-fullscreen-alt');
				document.getElementsByTagName('html')[0].classList.add('s-fullscreen-control');
				
				view.dataset.prevz=view.style.zIndex || 'initial';
				
				// From: https://stackoverflow.com/questions/1118198/how-can-you-figure-out-the-highest-z-index-in-your-document
				view.style.zIndex=Array.from(document.querySelectorAll('body *'))
				   .map(a => parseFloat(window.getComputedStyle(a).zIndex))
				   .filter(a => !isNaN(a))
				   .sort((a,b)=>a-b)
				   .pop()+1;
				   
				fullscreen = true;
				S.dispatchEvent(new CustomEvent('fullscreenEnter'));
			}
			else{
				if(!view.classList.contains('s-fullscreen-alt')) return;
				
				view.classList.remove('s-fullscreen-alt');
				document.getElementsByTagName('html')[0].classList.remove('s-fullscreen-control');
				
				// Get the original z-index value
				view.style.zIndex=view.dataset.prevz;
				view.removeAttribute('data-prevz');
				
				fullscreen = false;
				S.dispatchEvent(new CustomEvent('fullscreenExit'));
			}
		}
	});
}

S.duration				= S.files.map(function(e){
	if(e.hidden) return 0;
	return e.duration;
}).reduce((a,b) => a+b,0);

S.saves					= {
	currentSave	:<?php echo json_encode(CURRENT_SAVE); ?>,
	language	:<?php echo json_encode($language); ?>,
	local		:{},
	system		:<?php echo json_encode(SAVE_SYSTEM); ?>,
	timestamp	:Date.now()
};

// Make language change on changing value
Object.defineProperty(S, 'paused', {
	get: function() {
		return paused;
	},
	set: function(input){
		if(input === 'toggle') input = !paused;
		
		// Error handling
		if(input !==true && input !== false){
			notice('Error: paused can only be set to true, false, or "toggle"');
			return;
		}
		
		// Play
		if(!input){
			if(paused===false) return;
			
			// Close popups
			while(view.querySelector('.s-visible')) view.querySelector('.s-visible').classList.remove('s-visible');
			
			view.classList.remove('s-paused');
			paused=false;
			if(modules[module].play) modules[module].play();
			S.dispatchEvent(new CustomEvent('play'));
		}
		// Pause
		else{
			if(paused===true) return;
			
			view.classList.add('s-paused');
			paused=true;
			
			if(module && modules[module].pause) modules[module].pause();
			S.dispatchEvent(new CustomEvent('pause'));
		}
	}
});

///////////////////////////////////////
///////////PUBLIC FUNCTIONS////////////
///////////////////////////////////////

///////////////////////////////////////
///////////PRIVATE FUNCTIONS///////////
///////////////////////////////////////

function notice(input){
	S.paused = true;

	var noticeText=noticeEl.querySelector('.s-notice-text');
	
	// If a message is currently up, add new messages to the list rather than overwriting them
	if(noticeEl.classList.contains('s-visible')) noticeText.innerHTML += '<hr class="s-block-scrubbing"><p class="s-block-scrubbing">'+input+'</p>';
	else noticeText.innerHTML = '<p class="s-block-scrubbing">'+input+'</p>';
	
	noticeEl.classList.add('s-visible');
	
	noticeEl.focus();
	
	if(debug) console.log(input);
}

function regress(){
	modules[module].regress();
}

function progress(){
	modules[module].progress();
}

// Go to another file
async function to(obj = {file:file, time:time}){
	content.classList.add('loading');
	
	/// GET TIME AND FILE ///
	
	// Special values
	if(obj.file === 'last' ){
		obj.file = S.files.length-1;
		
		// Go back until find an unhidden file
		while(S.files[obj.file].hidden) obj.file--;
	}
	obj.file = Math.max(0,obj.file || 0);
	
	// If we're not going to the end, adjust time values; 'end' gets passed to the modules
	if(obj.time!=='end'){
		// Minimal time and file values are 0
		obj.time = Math.max(0,parseFloat(obj.time) || 0);
		
		// Based on time, get the right file
		for(obj.file; obj.file < S.files.length;obj.file++){
			// End if find a hidden file
			if(S.files[obj.file].hidden) break;
			
			if(obj.time<S.files[obj.file].duration) break; // We've reached the file
			
			obj.time-=S.files[obj.file].duration;
		}
	}
		
	// If we're past the end, go to the very end
	if(obj.file >= S.files.length || S.files[obj.file].hidden){
		while(obj.file >= S.files.length || S.files[obj.file].hidden) obj.file--;
		
		obj.file = S.files.length-1;
		
		obj.time = S.files[obj.file].duration;
		
		// Run the event that users can read
		S.dispatchEvent(new CustomEvent('end'));
		
		// Pause
		S.paused = true;
	}
	
	/// LOAD RIGHT MODULE AND SOURCE ///
	
	// If switching types, do some cleanup
	if(module!==S.files[obj.file].module){
		// Replace the old styles with the new ones
		console.log(contentShadow,contentShadow.firstChild,contentShadow.firstChild.innerHTML);
		contentShadow.firstChild.innerHTML = modules[S.files[obj.file].module].styles.innerHTML;
		
		// The second element is story styles, so keep that
		
		// Empty and replace the third element's children
		while(contentShadow.children[2].firstChild) contentShadow.children[2].removeChild(contentShadow.children[2].firstChild);

		contentShadow.children[2].appendChild(modules[S.files[obj.file].module].window);
	}
	
	module=S.files[obj.file].module;
	
	// Load the file
	if(S.files[obj.file].buffered === false) S.files[obj.file].buffered = 'buffering';
	
	// Consider file quality
	var filename = S.files[obj.file].path;
	if(S.files[obj.file].quality > 0) filename = filename.replace(/q\d+/,'q' + Math.min(S.files[obj.file].quality, quality));
	
	// Update the module, and post a notice on failure
	if(!await modules[module].src(obj.file, obj.time, filename)){
		notice('Failed to load file '+obj.file);
		return false;
	}
	
	file = obj.file;
	S.displaySubtitles();
	timeUpdate(); // time is set here
	
	/// PRELOAD ///
	if(scrubbing) return;
	
	// We can preload up to this amount
	var preloadBytes=<?php echo PRELOAD_BYTES; ?>;
	
	// Preload upcoming files
	for(let i=file;i<S.files.length;i++){
		// End if find a hidden file
		if(S.files[i].hidden) break;
		
		// Check if we can preload this
		preloadBytes-=S.files[file].size;
		
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
				
				notice('Error buffering file '+S.files[i].path);
			});
		}
	}
}

// Returns true if loaded a savedata, false if none exists by the search terms
function loadBookmark(){
	S.saves=JSON.parse(localStorage.getItem(saveName));
	
	switch(S.saves.system){
		case 'local':
			var loadFile = S.saves.local[S.saves.currentSave];
			
			// If the load file can't be found, break
			if(!loadFile) break;
			
			S.data = loadFile.data;
			S.language = loadFile.language;
			S.subtitles = loadFile.subtitles;
			S.quality = loadFile.quality;
			S.time = loadFile.bookmark;
			
			return true;
			break;
		case 'remote':
			break;
		default:
			break;
	}
	
	return false;
}

function saveBookmark(){
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
				bookmark:	time
				,data:		data
				,language:	language
				,subtitles:	subtitles
				,quality:	quality
				,timestamp:	Date.now()
			};
			break;
		case 'remote':
			break;
		default:
			break;
	}
	
	localStorage.setItem(saveName,JSON.stringify(S.saves));
	
	// Some information is saved to cookies so PHP can access them. We compress it for simplicity and using minimal cookie space.
	document.cookie=saveName+'='
		+encodeURIComponent(
			S.saves.system
			+'&'+S.saves.currentSave
			+'&'+language
			+'&'+subtitles
			+'&'+quality
		)
	;
}

function checkCollision(x=0,y=0,element){
	var bounds=element.getBoundingClientRect();
	
	// If element is collapsed or outside of x and y, return
	if(bounds.width===0 || bounds.height===0
		|| y<bounds.top || y>bounds.bottom
		|| x<bounds.left || x>bounds.right
	) return false;
	
	return true;
}

async function timeUpdate(){
	// Get the current time in the midst of the entire Showpony
	time = parseFloat(modules[module].currentTime);
	for(let i=0;i<file;i++) time += parseFloat(S.files[i].duration);
	
	if(scrubbing!==true) scrub(null);

	// Run custom event for checking time
	S.dispatchEvent(
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

var currentBuffer = [];

// See if the time passed has been buffered
function checkBuffered(time=0){
	if(currentBuffer===true) return true;
	
	for(var i=0;i<currentBuffer.length;i++){
		// If before the start time, exit
		// if(time<currentBuffer[i][0]) break;
		
		// If the time passed is within the range, it's true
		if(currentBuffer[i][0]<=time && time<=currentBuffer[i][1]){
			return true;
		}
	}
	
	return false;
}

async function getTotalBuffered(){
	var time=0;
	var buffered=[];
	
	// Update amount buffered total
	for(let i=0;i<S.files.length;i++){
		// End if find a hidden file
		if(S.files[i].hidden) break;
		
		var bufferTrack=false;
		
		if(S.files[i].buffered===true){
			bufferTrack=[time,parseFloat(time+S.files[i].duration)];
			
			if(bufferTrack){
				// Combine buffered arrays, if we're moving forward
				if(buffered.length>0 && bufferTrack[0]<=buffered[buffered.length-1][1]) buffered[buffered.length-1][1]=bufferTrack[1];
				else buffered.push(bufferTrack);
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
				if(buffered.length>0 && bufferTrack[0]<=buffered[buffered.length-1][1]) buffered[buffered.length-1][1]=bufferTrack[1];
				else buffered.push(bufferTrack);
			}
		}
		
		time+=parseFloat(S.files[i].duration);
	}
	
	if(buffered.length===1 && buffered[0][0]===0 && buffered[0][1]>=S.duration) buffered=true;
	if(buffered.length===0) buffered=[];
	
	// Show buffer
	var ctx = buffer.getContext('2d');
	
	// Update info on popup
	if(buffered === true){
		ctx.fillRect(0,0,buffer.width,1);
	}else if(Array.isArray(buffered)){
		ctx.clearRect(0,0,buffer.width,1);
		for(let i=0;i<buffered.length;i++){
			ctx.fillRect(
				Math.floor(buffered[i][0]/S.duration*buffer.width)
				,0
				,Math.floor((buffered[i][1]-buffered[i][0])/S.duration*buffer.width)
				,1
			);
		}
	}
	
	currentBuffer = buffered;
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
		if(readingDirection === 'left-to-right'){
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
		if(readingDirection === 'left-to-right'){
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
			scrubLoad=setTimeout(to,400,{time:scrubLoadTime});
		}
		
		var displayFile = 0;
		var timeCheck = displayTime;
		// Based on time, get the right file
		for(displayFile; displayFile < S.files.length - 1; displayFile++){
			// End if the next file's hidden
			if(S.files[displayFile + 1].hidden) break;
			
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
	
	var filesTotal = S.files.length;
	while(S.files[filesTotal - 1].hidden) filesTotal--;
	
    var remaining = infoFile(filesTotal - (displayFile + 1));
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
	
	// Add info about upcoming parts if not added already //XXX
	if(displayFile < S.files.length-1 && S.files[displayFile + 1].hidden
		&& !view.querySelector('.s-upcoming-file').innerHTML){
		var upcoming = '';
		for(var i = displayFile + 1; i < S.files.length; i++){
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
			).format(new Date(S.files[i].release) * 1000);
			
			if(i < S.files.length - 1) upcoming += '<br>';
		}
		
		view.querySelector('.s-upcoming-file').innerHTML = '<p>' + upcoming + '</p>';
	}
	
	if(info !== infoText.innerHTML) infoText.innerHTML = info;
	
	// We don't want to over-update the title, so we stick with when we're not scrubbing.
	if(info !== document.title) document.title=completed+' - '+remaining;
}

var pointerXStart = null;
var pointerYStart = null;
var pointerMoved = false;
var multitouch = false; // If set to true, own't perform actions on Showpony; the user may be trying to zoom, etc

// When the user scrubs, this function runs
function userScrub(event){
	// Don't run this if the user is touching with multiple fingers; they may be trying to zoom
	if(multitouch) return;
	
	var pointer;
	if(event.changedTouches) pointer=event.changedTouches[0];
	else pointer=event;
	
	// Don't scrub if touching with 2 or more fingers at once
	// if(event.touches && event.touches.length>1) return;
	
	var percent = (pointer.clientX-view.getBoundingClientRect().left)/(view.getBoundingClientRect().width);
	
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
			
			// view.classList.add('s-hold');
			
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
		> screen.width/30 // 30 is made to not interrupt scrubbing, while still meaning that if we move far enough, we'll ignore scrubbing (like if we're vertically scrolling
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
	
	// Prevent scrolling on mobile
	if(scrubbing === true || view.classList.contains('s-hold')){
		event.preventDefault();
	}
	
	if(scrubbing == true){
		scrub(percent);
	}
}

S.displaySubtitles = async function(newSubtitles = subtitles){
	// If the subtitles don't exist, make them exist
	if(newSubtitles !== null && !subtitlesAvailable[newSubtitles]){
		// If we have these subtitles available raw, get those
		if(subtitlesAvailable[newSubtitles + '-RAW']){
			console.log('processing raw');
			subtitlesAvailable[newSubtitles] = processSubtitles(subtitlesAvailable[newSubtitles + '-RAW'], false);
		// Otherwise, fetch
		}else{
			await fetch('showpony/fetch-subtitles.php?path=<?php echo STORIES_PATH; ?>&lang=' + newSubtitles + '&files=' + S.files.length)
			.then(response=>{if(response.ok) return response.text();})
			.then(text=>{
				subtitlesAvailable[newSubtitles] = processSubtitles(text);
			});
		}
	}

	subtitles = newSubtitles;
	if(modules[module].displaySubtitles) modules[module].displaySubtitles();
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
	if(currentGamepad===null) return;
	if(!active) return;
	if(document.hidden) return;
	
	// If we're not focused or fullscreen
	if(document.activeElement!==view && !fullscreen) return;
	
	var gamepad=navigator.getGamepads()[currentGamepad.id];
	
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
	if(currentGamepad.menu==2) S.paused = 'toggle';
	if(currentGamepad.input==2) progress();
	if(currentGamepad.dpadL==2) regress();
	if(currentGamepad.dpadR==2) progress();
	if(currentGamepad.end==2) to({time:'end'});
	if(currentGamepad.home==2) to({time:'start'});
	if(currentGamepad.fullscreen==2) S.fullscreen = 'toggle';
	
	// TODO: add joystick support back in (once it's working elsewhere)
	/*
	// Scrubbing with the analogue stick
	if(currentGamepad.analogLPress===2){
		overlay.style.opacity=1; // Show the overlay
		pos=0;
	}
	
	if(currentGamepad.analogL!==0){
		
		scrubbing=currentGamepad.analogL;
		userScrub(currentGamepad.analogL,true);
	}
	
	if(currentGamepad.analogLPress===-2){
		overlay.style.opacity=''; // Hide the overlay
		// If we're not scrubbing, set scrubbing to false and return
		if(scrubbing!==true){
			scrubbing=false;
		}else{
			// userScrub(currentGamepad.analogL);
			pos=0;
		}
	}*/
}

function gamepadAxis(gamepad,number,type){
	// Get amount between -1 and 1 based on distance between values
	if(Math.abs(gamepad.axes[number])>=currentGamepad.axisMin){
		if(gamepad.axes[number]>0) currentGamepad[type]=(gamepad.axes[number]-currentGamepad.axisMin)/(currentGamepad.axisMax-currentGamepad.axisMin);
		else currentGamepad[type]=((gamepad.axes[number]-(-currentGamepad.axisMax))/(-currentGamepad.axisMin-(-currentGamepad.axisMax)))-1;
		
		// Set pressing values right
		if(currentGamepad[type+'Press']<0) currentGamepad[type+'Press']=2;
		else currentGamepad[type+'Press']=1;
	}else{
		currentGamepad[type]=0;
		
		// Set pressing values right
		if(currentGamepad[type+'Press']>0) currentGamepad[type+'Press']=-2;
		else currentGamepad[type+'Press']=-1;
	}
}

function gamepadButton(gamepad,number,type){
	if(gamepad.buttons[number].pressed){
		// Set pressing values right
		if(currentGamepad[type]<0) currentGamepad[type]=2;
		else currentGamepad[type]=1;
	}else{
		if(currentGamepad[type]>0) currentGamepad[type]=-2;
		else currentGamepad[type]=-1;
	}
}

////////////

// Toggle popups on clicking buttons
view.getElementsByClassName('s-button-bookmark')[0].addEventListener('click',popupToggle);

function popupToggle(){
	var closePopups = view.querySelectorAll('.s-visible:not(.s-popup-'+this.dataset.type+')');
	for(var i = 0; i < closePopups.length; i++) closePopups[i].classList.remove('s-visible');
	
	view.querySelector('.s-popup-'+this.dataset.type).classList.toggle('s-visible');
}

view.querySelector('.s-notice-close').addEventListener('click',function(){
	view.querySelector('.s-notice').classList.remove('s-visible');
});

function buildButtons(call, array, onClick, nullPossible){
	// If the option doesn't exist or has no options
	if(array !== null){
		if(array.length === 0) return;
		if(!nullPossible && array.length === 1) return;
		
		// Add dropdown
		var dropdown = document.createElement('div');
		dropdown.className = 's-popup s-popup-'+call;
		
		
		for(var i = 0; i < array.length; i++){
			var buttonEl = document.createElement('button');
			buttonEl.innerText = array[i]['long'];
			buttonEl.dataset.value = array[i]['short'];
			buttonEl.addEventListener('click',onClick);
			
			if(S[call] == array[i]['short']) buttonEl.className='s-selected';
			
			dropdown.appendChild(buttonEl);
		}
		
		view.querySelector('.s-popups').appendChild(dropdown);
	}
	
	// Add button
	var button = document.createElement('button');
	button.className = 's-button s-button-'+call;
	button.dataset.type = call;
	button.dataset.alt = call;
	button.dataset.title = call;
	
	// Either toggle the popup, or the function directly if there's no popup
	if(array !== null) button.addEventListener('click',popupToggle);
	else button.addEventListener('click',onClick);
	
	view.querySelector('.s-buttons').appendChild(button);
}

<?php
	// Get languages
	$languages=[];
	foreach(scandir('.') as $file){
		// Ignore hidden files and specialized folders
		if($file==='subtitles' || $file==='resources' || !is_dir($file) || $file[0]==='.' || $file[0]===HIDING_CHAR) continue;

		$languages[]=[
			'short'	=>	$file
			,'long'	=>	extension_loaded('intl') ? (Locale::getDisplayLanguage($file)) : $file
		];
	}

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
	
	// Get quality
	$supportedQuality=[];
	for($i = 0; $i <= $maxQuality; $i++){
		$supportedQuality[]=[
			'short'	=>	$i
			,'long'	=>	QUALITY_NAMES[$i]
		];
	}
?>;

buildButtons('language'
	,<?php echo json_encode($languages); ?>
	,function(){S.language = this.dataset.value;}
	,false
);

buildButtons('subtitles'
	,<?php echo json_encode($supportedSubtitles); ?>
	,function(){
		if(S.subtitles === this.dataset.value) S.subtitles = null;
		else S.subtitles = this.dataset.value;
	}
	,true
);

buildButtons('quality'
	,<?php echo json_encode($supportedQuality); ?>
	,function(){S.quality = this.dataset.value;}
	,false
);

buildButtons('fullscreen'
	,null
	,function(){S.fullscreen = 'toggle';}
	,false
);

// Bookmarks
function toggleBookmark(){
	// Remove selected class from previous selected item
	var previous=view.querySelector('.s-popup-bookmark .s-selected');
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
				searchParams.set(queryBookmark,time|0);
				
				var url = location.host + location.pathname + '?' + searchParams.toString() + location.hash;
				var temporaryInput = document.createElement('textarea');
				temporaryInput.value = url;
				
				this.insertAdjacentElement('afterend',temporaryInput);
				
				temporaryInput.select();
				document.execCommand('copy');
				temporaryInput.remove();
				
				notice('Copied the link to your clipboard!');
			});
			break;
		default:
			notice('Save system not recognized!');
			break;
	}
	
	bookmarkEl.appendChild(nameEl);
	
	view.querySelector(".s-popup-bookmark").appendChild(bookmarkEl);
}

///////////////////////////////////////
////////////EVENT LISTENERS////////////
///////////////////////////////////////

// Save user bookmarks when leaving the page
window.addEventListener('blur',saveBookmark);
window.addEventListener('beforeunload',saveBookmark);

// Save the bookmark if the website is hidden
document.addEventListener('visibilitychange',function(){
	if(document.hidden) saveBookmark();
});

// Showpony deselection (to help with Firefox and Edge's lack of support for 'beforeunload')
view.addEventListener('focusout',saveBookmark);
view.addEventListener('blur',saveBookmark);

// Shortcut keys
view.addEventListener(
	'keydown'
	,function(event){
		if(!active) return;
		if(this!==event.target) return;
		
        // Disable keyboard when scrubbing
		if(scrubbing) return;
		if(event.ctrlKey || event.altKey || event.shiftKey || event.metaKey) return;
		
		switch(event.key){
			case ' ':				progress();			break;
			case 'Enter':			progress();			break;
			case 'ArrowLeft':		(readingDirection === 'right-to-left' ? progress : regress)();	break;
			case 'ArrowRight':		(readingDirection === 'right-to-left' ? regress : progress)();	break;
			// case 'Home':			to({time:'start'});	break;
			// case 'End':				to({time:'end'});		break;
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

contentShadow.addEventListener('click',stop);
contentShadow.addEventListener('mousedown',stop);
contentShadow.addEventListener('touchdown',stop);

function stop(event){
	var pointer;
	
	if(event.touches) pointer = event.touches[0];
	else pointer = event;
	
	// Ignore if grabbing a scrollbar
    if(pointer.offsetX > pointer.target.clientWidth || pointer.offsetY>pointer.target.clientHeight){
		event.stopPropagation();
		return;
	}
	
	// Run through the targeted element and its parents; don't allow it to bubble up to the menu if it's an input, button, or anchor
	var node = pointer.target;
	while(node !== null){
		if(node.tagName==='INPUT'
		|| node.tagName==='BUTTON'
		|| node.tagName==='A'){
			event.stopPropagation();
			return;
		}
		
		node = node.parentNode;
	}
	
	
}

var touching = false;

function pointerDown(event){
	if(!active) return;
	
	// Don't run this if the user is touching with multiple fingers; they may be trying to zoom
	if(multitouch) return;
	
	buttonDown = null; // We don't want to carry any previous states from buttonDown
	pointerMoved = false;
	
	// Don't scrub if touching with 2 or more fingers at once
	if(event.touches && event.touches.length>1){
		multitouch = true;
		
		// Remove these values
		pointerXStart = null;
		pointerYStart = null;
		
		clickStart = false;
		
		clearTimeout(actionTimeout);
		actionTimeout=null;
		clearInterval(actionInterval);
		actionInterval=null;
		
		// Get rid of any active coloring
		while(overlay.querySelector('.s-active')) overlay.querySelector('.s-active').classList.remove('s-active');
		
		var prevScrubState = scrubbing;
		scrubbing=false;
		return;
	}
	
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
    if(view.querySelector('.s-cover')){
        view.querySelector('.s-cover').remove();
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
            view.classList.add('s-hold');
        },500);
	// Progress
    } else if(checkCollision(pointer.clientX,pointer.clientY,progressEl)){
        buttonDown = 'progress';
		progressEl.classList.add('s-active');
        actionTimeout=setTimeout(function(){
			// Don't let moving the cursor stop this function
			pointerXStart = null;
			pointerYStart = null;
			
			// Add the display class
            view.classList.add('s-hold');
            actionInterval=setInterval(progress,50);
        },500);
	// Regress
    } else if(checkCollision(pointer.clientX,pointer.clientY,regressEl)){
        buttonDown = 'regress';
		regressEl.classList.add('s-active');
        actionTimeout=setTimeout(function(){
			// Don't let moving the cursor stop this function
			pointerXStart = null;
			pointerYStart = null;
			
			// Add the display class
            view.classList.add('s-hold');
            actionInterval=setInterval(regress,50);
        },500);
    }
	
	// Scrubbing will be considered here
	scrubbing=pointer.clientX;
	window.getSelection().removeAllRanges();
}

function pointerUp(event){
	if(!active) return;
	
	// Don't run this if the user is touching with multiple fingers; they may be trying to zoom
	if(multitouch){
		if(event.touches && event.touches.length < 2) multitouch = false;
		return;
	}
	
	// Don't scrub if touching with	2 or more fingers at once
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
	if(view.classList.contains('s-hold')){
		view.classList.remove('s-hold');
		
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
	else if(checkCollision(pointer.clientX,pointer.clientY,progressEl) && buttonDown === 'progress'){
		progress();
	}
	// Regress
	else if(checkCollision(pointer.clientX,pointer.clientY,regressEl) && buttonDown === 'regress'){
		regress();
	}
    
    buttonDown = null;
	event.preventDefault(); // Prevents a click event firing right after touchend
}

// Resets to 0 on touch/start click; tracks how much we've moved the pointer since putting it down
var pointerMovement = 0;

view.addEventListener('mousedown',pointerDown);
window.addEventListener('mouseup',pointerUp);

view.addEventListener('touchstart',pointerDown);
window.addEventListener('touchend',pointerUp);

// On dragging
window.addEventListener('mousemove',userScrub);
window.addEventListener('touchmove',userScrub,{passive:false});

// Ignore the context menu on Showpony (for now, later it'd be nice to allow it for copy-pasting and the like)
S.addEventListener('contextmenu',function(event){
	event.preventDefault();
});

// On touch end, don't keep moving the bar to the user's touch
// overlay.addEventListener('touchend',userScrub);

// Gamepad support

window.addEventListener('gamepadconnected',function(e){
	currentGamepad={
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
	if(e.gamepad.index!==currentGamepad.id) return;
	
	currentGamepad=null;
	clearInterval(checkGamepad);
	checkGamepad=null;
});

///////////////////////////////////////
/////////////////START/////////////////
///////////////////////////////////////

// Priority Saves: Newest > Default Start
if(localStorage.getItem(saveName)===null){
	// Set defaults
	localStorage.setItem(saveName,JSON.stringify({
		currentSave	:'Autosave',
		language	:<?php echo json_encode($language); ?>,
		local		:{},
		system		:null,
		timestamp	:Date.now()
	}));
}else{
	S.saves=JSON.parse(localStorage.getItem(saveName));
}

// For now, we'll just support this bookmark
// TODO: allow renaming bookmarks
addBookmark({name:'Autosave',system:'local',type:'default'});
addBookmark({name:'Get Link',system:'url',type:'get'});

// POWER: Hard Link > Bookmark > Soft Link > Default

// Start with the URL Bookmark
var start = searchParams.get(queryBookmark);
searchParams.delete(queryBookmark);
history.replaceState(null,'',window.location.pathname + '?' + searchParams.toString());

// Show we're paused
view.className		= 's s-' + readingDirection;
view.classList.add('s-paused');

S.debug = <?php
	if(DEBUG){
		echo json_encode($debugMessages);
	}
	else{
		echo json_encode('DEBUG = false. No PHP debug info will be passed.');
	}
?>;

// Use the Save Bookmark if the URL Bookmark has nothing
if(!loadBookmark()){
	// Use the Default Bookmark if the Save Bookmark has nothing
	if(start === null || isNaN(start)) start = <?php echo $_GET['start'] ?? DEFAULT_START; ?>;

	// Pause the Showpony
	S.paused = true;
	S.time = start;
}

// We don't remove the loading class here, because that should be taken care of when the file loads, not when Showpony finishes loading

shadow.appendChild(view);
S.dispatchEvent(new CustomEvent('built'));

}();<?php

if(!empty($_GET['export'])) file_put_contents('showpony-export.js',ob_get_clean());

?>