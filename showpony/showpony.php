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

// TESTING ADMIN
// $_SESSION['showpony_admin']=false;

$stories_path = DEFAULT_PATH.($_GET['path'] ?? '');

// Get the query from the paths
$name = preg_match('/[^\/]+(?=\/?$)/',$stories_path,$match) ? $match[0] : 'story';

$saveName = toCamelCase($name).'Data';

// 0 is save system; 1 is save name; 2 is language
if(!empty($_COOKIE[$saveName])) $data = explode('&',$_COOKIE[$saveName]);
else $data = [null,null,null,null];

$save_system	= $data[0]		??	null;
$current_save	= $data[1]		??	'Autosave';
$language		= $_GET['lang']	??	$data[2]	?? DEFAULT_LANGUAGE;
$subtitles		= $_GET['subs']	??	$data[3]	??	null;

function toCamelCase($input){
	return lcfirst(
		str_replace('-','',
			ucwords($input,'-')
		)
	);
}

// We'll store all errors and code that's echoed, so we can send that info to the user (in a way that won't break the JSON object).
ob_start();

require 'get-file-list.php';

// Pass any echoed statements or errors to the response object
$message = ob_get_clean();

header('Content-type: application/javascript');
?>'use strict';

// Add styles if not added already
if(!document.getElementById('s-styles')){
	var styles=document.createElement('style');
	styles.id='s-styles';
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
if(!document.getElementById('s-<?php echo $moduleName; ?>-styles')){
	var styles=document.createElement('style');
	styles.id='s-<?php echo $moduleName; ?>-styles';
	styles.innerHTML=`<?php
		addslashes(readfile(ROOT.'/modules/'.$moduleName.'/styles.css'));
	?>`;
	document.head.appendChild(styles);
}

<?php } ?>

var <?php echo toCamelCase($name); ?>= new function(){

const S = this;

///////////////////////////////////////
///////////PUBLIC VARIABLES////////////
///////////////////////////////////////

S.files					= <?php echo json_encode($files,JSON_NUMERIC_CHECK); ?>;

S.buffered				= [];
S.currentFile			= null;
S.currentLanguage		= <?php echo json_encode($language); ?>;
S.currentModule			= null;
S.currentSubtitles		= <?php echo ($subtitles==='null' ? 'null' : json_encode($subtitles)); ?>;
S.currentTime			= null;
S.data					= {};
S.duration				= S.files.map(function(e){return e.duration;}).reduce((a,b) => a+b,0);
S.fullscreen			= false;
S.gamepad				= null;
S.message				= <?php echo json_encode($message); ?>;
S.modules				= {};
S.name					= <?php echo json_encode(toCamelCase($name)); ?>;
S.path					= <?php echo json_encode($stories_path); ?>;
S.paused				= false;
S.query					= '<?php echo $name; ?>';
S.saveName				= <?php echo json_encode($saveName); ?>;
S.saves					= {
	currentSave	:<?php echo json_encode($current_save); ?>,
	language	:<?php echo json_encode($language); ?>,
	local		:{},
	system		:<?php echo json_encode($save_system); ?>,
	timestamp	:Date.now()
};
S.subtitles				= {};
S.supportedSubtitles	= <?php
	// Get subtitles
	$subtitles=[];
	if(file_exists('subtitles')){
		foreach(scandir('subtitles') as $file){
			// Ignore hidden files
			if(!is_dir('subtitles/'.$file) || $file[0]==='.' || $file[0]===HIDDEN_FILENAME_STARTING_CHAR) continue;

			// TODO: add support for differentiating Closed Captions (maybe append with "cc", like "en-cc" "es-cc"
			
			$subtitles[]=[
				'short'	=>	$file
				,'long'	=>	extension_loaded('intl') ? (Locale::getDisplayLanguage($file)) : $file
			];
		}
	}
	
	echo json_encode($subtitles);
?>;
S.upcomingFiles			= <?php echo json_encode($releaseDates); ?>;
	
S.window				= document.createElement('div');
S.window.className		= 's';
S.window.tabIndex		= 0;
S.window.innerHTML		= `
	<style class="s-style" type="text/css"></style>
	<div class="s-content"></div>
	<?php if(file_exists('cover.jpg')) echo '<img class="s-cover" src="',$stories_path,'cover.jpg">'; ?>
	<div class="s-overlay">
		<button class="s-progress s-hide-on-hold"></button>
		<button class="s-regress s-hide-on-hold"></button>
		<button class="s-pause s-hide-on-hold"></button>
		<div class="s-progress-bar" style="left:0%;"></div>
		<canvas class="s-overlay-buffer" width="1000" height="1"></canvas>
		<div class="s-overlay-text"></div>
		<div class="s-upcoming-file"></div>
		<div class="s-buttons s-hide-on-hold">
			<button class="s-button s-button-comments" alt="Comments" title="Comments"></button>
			<button class="s-button s-button-language" alt="Language" title="Language"></button>
			<button class="s-button s-button-subtitles" alt="Subtitles" title="Subtitles"></button>
			<button class="s-button s-button-bookmark" alt="Bookmark" title="Bookmarks Toggle"></button>
			<button class="s-button s-fullscreen-button" alt="Fullscreen" title="Fullscreen Toggle"></button>
		</div>
		<div class="s-dropdowns s-hide-on-hold">
			<div class="s-dropdown s-dropdown-language"></div>
			<div class="s-dropdown s-dropdown-subtitles"></div>
			<div class="s-dropdown s-dropdown-bookmark"></div>
		</div>
	</div>
`;

///////////////////////////////////////
///////////PRIVATE VARIABLES///////////
///////////////////////////////////////

const captionsButton	= S.window.getElementsByClassName('s-captions-button')[0];
const content			= S.window.getElementsByClassName('s-content')[0];
content.classList.add('s-loading');
const fullscreenButton	= S.window.getElementsByClassName('s-fullscreen-button')[0];
const overlay			= S.window.getElementsByClassName('s-overlay')[0];
const overlayBuffer		= S.window.getElementsByClassName('s-overlay-buffer')[0];
const overlayText		= S.window.getElementsByClassName('s-overlay-text')[0];
const pause				= S.window.getElementsByClassName('s-pause')[0];
const progress			= S.window.getElementsByClassName('s-progress-bar')[0];
const progressBtn		= S.window.getElementsByClassName('s-progress')[0];
const regress			= S.window.getElementsByClassName('s-regress')[0];
const styles			= S.window.getElementsByClassName('s-style')[0];

var actionTimeout		= null;		// Used to start running constant mousedown functions, like fast-forward and rewind
var actionInterval		= null;		// Used to run constant mousedown functions, like fast-forward and rewind
var clickStart			= false;	// Whether a click was started inside Showpony
var checkGamepad		= null;
var framerate			= 60;		// Connected to gamepad use and games
var pos					= 0;		// The current scrub position
var scrubbing			= false;	// Our state of scrubbing
var searchParams		= new URLSearchParams(window.location.search);
var start				= 0;		// Where we're starting the Showpony from

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
S.to = function(obj = {}){
	content.classList.add('s-loading');
	
	/// GET TIME AND FILE ///
	
	// Special values
	if(obj.file==='last') obj.file=S.files.length-1;
	
	// Relative adjustment
	if(/-|\+/.test(obj.file)) obj.file=S.currentFile+parseInt(obj.file);
	obj.file=Math.max(0,obj.file || 0);
	
	// If we're not going to the end, adjust time values; 'end' gets passed to the modules
	if(obj.time!=='end'){
		// Relative adjustment
		if(/-|\+/.test(obj.time)) obj.time=S.currentTime+timeToSeconds(obj.time);
		obj.time=timeToSeconds(obj.time);
		
		// Minimal time and file values are 0
		obj.time=Math.max(0,parseFloat(obj.time) || 0);
		
		// Based on time, get the right file
		for(obj.file;obj.file<S.files.length;obj.file++){
			if(obj.time<S.files[obj.file].duration) break; // We've reached the file
			
			obj.time-=S.files[obj.file].duration;
		}
	}
		
	// If we're past the end, go to the very end
	if(obj.file>=S.files.length){
		obj.file=S.files.length-1;
		obj.time=S.files[obj.file].duration;
		
		// Run the event that users can read
		S.window.dispatchEvent(new CustomEvent('end'));
		
		// Pause
		S.pause();
	}
	
	/// LOAD RIGHT MODULE AND SOURCE ///
	
	// If switching types, do some cleanup
	if(S.currentModule!==S.files[obj.file].module){
		content.innerHTML='';
		content.appendChild(S.modules[S.files[obj.file].module].window);
	}
	
	S.currentModule=S.files[obj.file].module;
	
	// Load the file
	if(S.files[obj.file].buffered===false) S.files[obj.file].buffered='buffering';
	
	S.modules[S.currentModule].src(obj.file,obj.time).then((obj)=>{
		// TODO: condense or remove parts from below. I can't help but think this should all be called in the object.js files, and not touched at all here.
		S.currentFile=S.modules[S.currentModule].currentFile=obj.file;
		S.modules[S.currentModule].currentTime=obj.time;
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
				
				fetch(S.files[i].path).then(()=>{
					S.files[i].buffered=true;
					getTotalBuffered();
				});
			}
		}
	});
}

S.play = function(){
	if(S.paused===false) return;
	
	// Close dropdowns
	var dropdowns=S.window.querySelectorAll('.s-dropdown.s-visible');
	if(dropdowns){
		for(var i=0;i<dropdowns.length;i++){
			dropdowns[i].classList.remove('s-visible')
		}
	}
	
	S.window.classList.remove('s-paused');
	S.paused=false;
	S.modules[S.currentModule].play();
	S.window.dispatchEvent(new CustomEvent('play'));
}

S.pause = function(){
	if(S.paused===true) return;
	
	S.window.classList.add('s-paused');
	S.paused=true;
	if(S.currentModule) S.modules[S.currentModule].pause();
	S.window.dispatchEvent(new CustomEvent('pause'));
}

S.toggle = function(){
	S[S.paused ? 'play' : 'pause']();
}

S.load = function(){
	S.saves=JSON.parse(localStorage.getItem(S.saveName));
	
	/// TODO: add remote bookmark support
	
	switch(S.saves.system){
		case 'local':
			var loadFile=S.saves.local[S.saves.currentSave];
			
			// If the load file can't be found, break
			if(!loadFile) break;
			
			S.data=loadFile.data;
			S.currentLanguage=loadFile.language;
			S.currentSubtitles=loadFile.subtitles;
			
			console.log("RETURNING BOOKMARK",loadFile.bookmark);
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
				bookmark:S.currentTime
				,data:S.data
				,language:S.currentLanguage
				,subtitles:S.currentSubtitles
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
			+'&'+S.currentLanguage
			+'&'+S.currentSubtitles
		)
	;
}

S.changeLanguage = function(newLanguage=<?php echo json_encode($language); ?>){
	if(S.currentLanguage===newLanguage) return;
	
	fetch('showpony/get-file-list.php?return=true&path=<?php echo $_GET['path'] ?? ''; ?>&lang='+newLanguage)
	.then(response=>{return response.json();})
	.then(json=>{
		S.files=json;
		S.currentLanguage=newLanguage;
		
		// Need to set this to -1 to reload the current file
		S.modules[S.currentModule].currentFile=-1;
		
		S.to({time:S.currentTime});
	});
}

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
		
		document.exitFullscreen();
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
// No fullscreen support fullscreen (like for iOS Safari)
else{
	S.fullscreenEnter=function(){
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
		   
		S.fullscreen=true;
		S.window.dispatchEvent(new CustomEvent('fullscreenEnter'));
	}
	
	S.fullscreenExit=function(){
		if(!S.window.classList.contains('s-fullscreen-alt')) return;
		
		S.window.classList.remove('s-fullscreen-alt');
		document.getElementsByTagName('html')[0].classList.remove('s-fullscreen-control');
		
		// Get the original z-index value
		S.window.style.zIndex=S.window.dataset.prevz;
		S.window.removeAttribute('data-prevz');
		
		S.fullscreen=false;
		S.window.dispatchEvent(new CustomEvent('fullscreenExit'));
	}
	
	S.fullscreenToggle=function(){
		if(S.window.classList.contains('s-fullscreen-alt')) S.fullscreenExit();
		else S.fullscreenEnter();
	}
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
	if(bounds.width===0 || bounds.height===0) return false;
	if(y<bounds.top)	return false;
	if(y>bounds.bottom)	return false;
	if(x<bounds.left)	return false;
	if(x>bounds.right)	return false;
	
	return true;
}

function timeUpdate(){
	// Get the current time in the midst of the entire Showpony
	S.currentTime=parseFloat(S.modules[S.currentModule].currentTime);
	for(let i=0;i<S.currentFile;i++) S.currentTime+=parseFloat(S.files[i].duration);
	
	if(scrubbing!==true && scrubbing!=='out') scrub(null,false);
	
	// Update the querystring
	// searchParams.set(S.query, S.currentTime|0);
    // history.replaceState(null,'',window.location.pathname + '?' + searchParams.toString());
	
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
			buffer=[time,parseFloat(time+S.files[i].duration)];
			
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
					time+parseFloat(S.files[i].buffered[ii][0])
					,time+parseFloat(S.files[i].buffered[ii][1])
				];
				
				// Combine buffered arrays, if we're moving forward
				if(buffered.length>0 && buffer[0]<=buffered[buffered.length-1][1]) buffered[buffered.length-1][1]=buffer[1];
				else buffered.push(buffer);
			}
		}
		
		time+=parseFloat(S.files[i].duration);
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
function scrub(inputPercent=null,loadFile=false){
	// If no inputPercent was set, get it!
	if(inputPercent===null) inputPercent=S.currentTime/S.duration;
	
	if(inputPercent<0) inputPercent=0;
	if(inputPercent>1) inputPercent=1;
	
	// Move the progress bar
	progress.style.left=(inputPercent*100)+'%';
	
	// If scrubbing, estimate the new time
	if(scrubbing===true || scrubbing==='out'){
		var time=S.duration*inputPercent;
		
		/// LOADING THE SELECTED FILE ///
		if(loadFile){
			clearTimeout(scrubLoad);
			scrubLoad=null;
			if(checkBuffered(time) || scrubbing==='out') S.to({time:time});
			else{
				// Load the file if we sit in the same spot for a moment
				scrubLoadTime=time;
				scrubLoad=setTimeout(S.to,400,{time:scrubLoadTime});
			}
		}
		
		var file=0;
		var timeCheck=time;
		// Based on time, get the right file
		for(file;file<S.files.length-1;file++){
			if(timeCheck<S.files[file].duration) break; // We've reached the file
			
			timeCheck-=S.files[file].duration;
		}
	}
	// Otherwise, get it based off current values
	else{
		var time=S.currentTime;
		var file=S.currentFile;
	}
	
	<?php
	if($displayType==='file'){
	?>
		
    var completed=infoFile(file+1);
    var remaining=infoFile(S.files.length-(file+1));
	
	<?php
	}else{
	?>
	
	var completed=infoTime(time);
	var remaining=infoTime(S.duration-time);
	
	<?php } ?>
    
    var info = '<p>'+completed+'</p><p>';
	if((S.files[file].title)) info+=S.files[file].title;
	info+='</p><p>'+remaining+'</p>';
	
	// Add info about upcoming parts if not added already
	if(!S.window.querySelector('.s-upcoming-file').innerHTML
		&& file===S.files.length-1 && S.upcomingFiles.length){
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
	
	if(info!==overlayText.innerHTML) overlayText.innerHTML=info;
	
	// We don't want to over-update the title, so we stick with when we're not scrubbing.
	if(info!==document.title) document.title=completed+' - '+remaining;
}

// When the user scrubs, this function runs
function userScrub(event=null,start=false){
	var input;
	
	// Only allow scrubbing when paused
	if(!S.paused) return;
	
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
	const scrubSnap=.0025; // We give ourselves a little snap near the edges
	if(scrubPercent<0+scrubSnap) scrubPercent=0;
	if(scrubPercent>1-scrubSnap) scrubPercent=1;
	
	if(start){
		if(scrubbing===false){
			if(input==='touch') scrubbing=pos;
			else return;
		}
			
		// You have to swipe farther than you move the cursor to adjust the position
		if(scrubbing!==true && scrubbing!=='out'){
			if(input==='joystick'
				|| Math.abs(scrubbing-pos)>screen.width/34 // 34 is an arbitrary percentage of the screen that seems to feel good to trigger scrubbing
			){
				// Don't wait to start a series of actions
				clearTimeout(actionTimeout);
				actionTimeout=null;
				clearInterval(actionInterval);
				actionInterval=null;
				
				if(S.window.querySelector('.s-cover') && checkCollision(event.clientX,event.clientY,S.window)){
					S.window.querySelector('.s-cover').remove();
				}
				
				scrubbing=true;
				S.window.classList.add('s-hold');
			}
			else return;
		}
		
		// Don't want the users to accidentally swipe to another page!
		if(input==='touch') event.preventDefault();
		
		scrub(scrubPercent,true);
	}else{
		// Drag on the menu to go to any part
		
		if(scrubbing===true || scrubbing==='out'){
			if(!checkBuffered(S.duration*scrubPercent)){
				// Load the file our pointer's on
				scrub(scrubPercent,true);
			}
			
			scrubbing=false;
			
			return true; // Exit the function
		}
		
		// scrubbing needs to be set to false here too; either way it's false, but we need to allow the overlay to update above, so we set it to false earlier too.
		scrubbing=false;
	}
}

S.displaySubtitles=function(newSubtitles=S.currentSubtitles){
	// Display the subtitles if they're loaded in
	if(S.subtitles[newSubtitles] || newSubtitles===null){
		S.currentSubtitles=newSubtitles;
		S.modules[S.currentModule].displaySubtitles();
	// Otherwise, load them
	}else{
		fetch('showpony/get-subtitles.php?path=<?php echo $stories_path; ?>&lang='+newSubtitles+'&files='+S.files.length)
		.then(response=>{return response.text();})
		.then(text=>{
			var filesArray=[];
			
			// Loop through files
			var files=text.split('|SPLIT|');
			files.pop(); // Last item is blank, remove it
			for(var i=0;i<files.length;i++){
				var grouping={};
				
				// Loop through sections
				
				// (get rid of surrounding blanks)
				var sections=files[i].replace(/^\s+|\s+$/g,'');
				// Split between lines
				// sections=sections.split(/(?:\n\s*){2,}/g);
				sections=sections.split(/[\r\n]{4,}/g);
				for(var j=0;j<sections.length;j++){
					var name=j;
					var phrase={
						start:null
						,end:null
						,content:''
					};
					
					// Loop through chunk
					var chunk=sections[j].split(/[\r\n]{2,}/g);
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
			
			S.subtitles[newSubtitles]=filesArray;
			S.currentSubtitles=newSubtitles;
			S.modules[S.currentModule].displaySubtitles();
		})
		.catch(response=>{
			S.currentSubtitles=null;
			alert('Subtitles not found!');
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
	if(S.gamepad.input==2) S.progress();
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
		if(scrubbing!==true && scrubbing!=='out'){
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

////////////

const supportedLanguages=<?php
	// Get subtitles
	$languages=[];
	foreach(scandir('.') as $file){
		// Ignore hidden folders and subtitles folder
		if($file==='subtitles' || $file==='resources' || !is_dir($file) || $file[0]==='.' || $file[0]===HIDDEN_FILENAME_STARTING_CHAR) continue;

		$languages[]=[
			'short'	=>	$file
			,'long'	=>	extension_loaded('intl') ? (Locale::getDisplayLanguage($file)) : $file
		];
	}
	
	echo json_encode($languages);
?>;

if(supportedLanguages.length>1){
	function toggleLanguage(){
		// Ignore clicking on same button again
		if(S.currentLanguage===this.dataset.value) return;
		
		// Remove selected class from previous selected item
		var previous=S.window.querySelector('.s-dropdown-language .s-selected');
		if(previous){
			previous.classList.remove('s-selected');
		}
		
		this.classList.add('s-selected');
		S.changeLanguage(this.dataset.value);
	}

	var languageButtons=document.createDocumentFragment();
	for(var i=0;i<supportedLanguages.length;i++){
		var buttonEl=document.createElement('button');
		buttonEl.innerText=supportedLanguages[i]['long'];
		buttonEl.dataset.value=supportedLanguages[i]['short'];
		buttonEl.addEventListener('click',toggleLanguage);
		
		if(S.currentLanguage===supportedLanguages[i]['short']) buttonEl.className='s-selected';
		
		languageButtons.appendChild(buttonEl);
	}
	S.window.querySelector(".s-dropdown-language").appendChild(languageButtons);
}else{
	S.window.querySelector('.s-button-language').remove();
}

if(S.supportedSubtitles.length>0){
	function toggleSubtitle(){
		// Remove selected class from previous selected item
		var previous=S.window.querySelector('.s-dropdown-subtitles .s-selected');
		if(previous){
			previous.classList.remove('s-selected');
		}
		
		// Set subtitles to null if clicking on the same item
		if(S.currentSubtitles===this.dataset.value){
			S.displaySubtitles(null);
			return;
		}
		
		this.classList.add('s-selected');
		S.displaySubtitles(this.dataset.value);
	}

	var subtitleButtons=document.createDocumentFragment();
	for(var i=0;i<S.supportedSubtitles.length;i++){
		var buttonEl=document.createElement('button');
		buttonEl.innerText=S.supportedSubtitles[i]['long'];
		buttonEl.dataset.value=S.supportedSubtitles[i]['short'];
		buttonEl.addEventListener('click',toggleSubtitle);
		
		if(S.currentSubtitles===S.supportedSubtitles[i]['short']) buttonEl.className='s-selected';
		
		subtitleButtons.appendChild(buttonEl);
	}
	S.window.querySelector(".s-dropdown-subtitles").appendChild(subtitleButtons);
}else{
	S.window.querySelector('.s-button-subtitles').remove();
}

// Bookmarks
function toggleBookmark(){
	// Remove selected class from previous selected item
	var previous=S.window.querySelector('.s-dropdown-bookmark .s-selected');
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
	nameEl.addEventListener('click',toggleBookmark);
	
	if(
		S.saves.currentSave===obj.name
		&& S.saves.system===obj.system
	) nameEl.classList.add('s-selected');
	
	bookmarkEl.appendChild(nameEl);
	
	// if(obj.type!=='new'){
		// var deleteEl=document.createElement('button');
		// deleteEl.className='s-bookmark-delete';
		// deleteEl.innerHTML='X';
		// bookmarkEl.appendChild(deleteEl);
	// }
	
	S.window.querySelector(".s-dropdown-bookmark").appendChild(bookmarkEl);
}

///////////////////////////////////////
////////////EVENT LISTENERS////////////
///////////////////////////////////////

// Allow using querystrings for navigation
window.addEventListener(
	'popstate'
	,function(){
		var time=searchParams.get(S.query);
		
		if(time){
			if(time===S.currentTime) return;
		
			S.to({time:time});
		}
	}
);

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
		
		if(event.ctrlKey || event.altKey || event.shiftKey || event.metaKey) return;
		
		switch(event.key){
			case ' ':				S.progress();			break;
			case 'Enter':			S.progress();			break;
			case 'ArrowLeft':		S.regress();			break;
			case 'ArrowRight':		S.progress();			break;
			// case 'Home':			S.to({time:'start'});	break;
			// case 'End':				S.to({time:'end'});		break;
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

window.addEventListener('mouseup',function(event){
    // If the click was started outside of showpony, ignore it
    if (!clickStart) return;
    clickStart = false;
    
	// Allow left-click only
	if(event.button!==0) return;
	
    clearTimeout(actionTimeout);
    actionTimeout=null;
    clearInterval(actionInterval);
    actionInterval=null;
    
    scrubbing=false;
	
	// If we were waiting to load on an interval, load immediately!
	if(scrubLoad){
		clearTimeout(scrubLoad);
		scrubLoad=null;
		S.to({time:scrubLoadTime});
	}
    
    // Ignore scrollbar
    if(event.offsetX>event.target.clientWidth || event.offsetY>event.target.clientHeight) return;
    
	if(S.window.classList.contains('s-hold')){
		S.window.classList.remove('s-hold');
		return;
	}
    
	
	// One event listener for all of the buttons
	switch(event.target){
		case fullscreenButton:
			S.fullscreenToggle();
			break;
		case S.window.querySelector('.s-button-bookmark'):
			if(S.window.querySelector('.s-dropdown-bookmark').classList.toggle('s-visible')){
				// Added
			}else{
				// Removed
			}
			break;
		case S.window.querySelector('.s-button-language'):
			if(S.window.querySelector('.s-dropdown-language').classList.toggle('s-visible')){
				// Added
			}else{
				// Removed
			}
			break;
		case S.window.querySelector('.s-button-subtitles'):
			if(S.window.querySelector('.s-dropdown-subtitles').classList.toggle('s-visible')){
				// Added
			}else{
				// Removed
			}
			break;
		default:
			// Some elements have pointer-events none, but their collisions still matter. We'll see if we're within those buttons here.
		
			// Don't read clicks if the user's clicking an input or button
			if(event.target.tagName==='INPUT') break;
			if(event.target.tagName==='BUTTON') break;
			if(event.target.tagName==='A') break;
			if(event.target.classList.contains('s-dropdown')) return;
			
			// Pause
			if(checkCollision(event.clientX,event.clientY,pause)){
				S.toggle();
				break;
			}
			
			// Progress
			if(checkCollision(event.clientX,event.clientY,progressBtn)){
				S.progress();
				break;
			}
			
			// Regress
			if(checkCollision(event.clientX,event.clientY,regress)){
				S.regress();
				break;
			}
			
			break;
	}
    
});

// On mousedown, we prepare to move the cursor (but not over overlay buttons)
S.window.addEventListener('mousedown',function(event){
    // Click was started inside showpony
    clickStart = true;
    
	// Allow left-click only
	if(event.button!==0) return;
	
    // Do nothing if the user clicked certain elements
	if(event.target.classList.contains('s-dropdown')) return;
	if(event.target.tagName==='INPUT') return;
	if(event.target.tagName==='BUTTON') return;
	if(event.target.tagName==='A') return;
    
    // Ignore if grabbing a scrollbar
    if(event.offsetX>event.target.clientWidth || event.offsetY>event.target.clientHeight) return;

    // Remove the cover image when this is the first time interacting with showpony
    if(S.window.querySelector('.s-cover')){
        S.window.querySelector('.s-cover').remove();
    }
    
	// One event listener for all of the buttons
    // Pause
    if(checkCollision(event.clientX,event.clientY,pause)){
        actionTimeout=setTimeout(function(){
            S.window.classList.add('s-hold');
        },500);
    } else if(checkCollision(event.clientX,event.clientY,progressBtn)){
        // Progress
        actionTimeout=setTimeout(function(){
            S.window.classList.add('s-hold');
            actionInterval=setInterval(function(){
                S.to({time:'+5'});
            },50);
        },500);
    } else if(checkCollision(event.clientX,event.clientY,regress)){
        // Regress
        actionTimeout=setTimeout(function(){
            S.window.classList.add('s-hold');
            actionInterval=setInterval(function(){
                S.to({time:'-5'});
            },50);
        },500);
    }
	
	// Scrubbing will be considered here
	scrubbing=event.clientX;
	window.getSelection().removeAllRanges();
});

// On touch end, don't keep moving the bar to the user's touch
overlay.addEventListener('touchend',userScrub);

// On dragging
window.addEventListener('mousemove',function(event){userScrub(event,true);});
window.addEventListener('touchmove',function(event){userScrub(event,true);});

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

var start = searchParams.get(S.query);
if(start === null || isNaN(start)) start = S.load();
if(start === null || isNaN(start)) start = <?php echo DEFAULT_START; ?>;

// Pause the Showpony
S.pause();
S.to({time:start});

// We don't remove the loading class here, because that should be taken care of when the file loads, not when Showpony finishes loading

// Add the Showpony window to the document
document.currentScript.insertAdjacentElement('afterend',S.window);

///////////////////////////////////////
/////////////////ADMIN/////////////////
///////////////////////////////////////

///// With new admin panel, we just reload the entire Showpony- this avoids risk of any bugs with AJAX vs reality and the like

}();