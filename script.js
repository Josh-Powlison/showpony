const DEFAULT_SHOWPONY='comic';

var currentShowpony=/#([^\?]+)/.exec(location.href);
if(currentShowpony) currentShowpony=currentShowpony[1];
else currentShowpony=DEFAULT_SHOWPONY;

document.getElementById("example-list").addEventListener("change",function(){
	chooseStory(this.value);
});

// Add event listeners to them all
for(var key in showponies){
	showponies[key].window.addEventListener('timeupdate',function(event){
		if(this===showponies[currentShowpony].window){
			document.querySelector('[data-value="currentTime"]').innerHTML=event.detail.time;
			
			document.querySelector('[data-value="currentFile"]').innerHTML=event.detail.file;
		}
	});
	
	showponies[key].window.addEventListener('play',function(event){
		if(this===showponies[currentShowpony].window){
			document.querySelector('[data-value="paused"]').innerHTML=showponies[currentShowpony].paused;
			// document.querySelector('[data-obj-print-value="paused"]').innerHTML='<em>'+(showponies[currentShowpony].paused ? 'true' : 'false')+'</em>';
		}
	});
	
	showponies[key].window.addEventListener('pause',function(event){
		if(this===showponies[currentShowpony].window){
			document.querySelector('[data-value="paused"]').innerHTML=showponies[currentShowpony].paused;
			// document.querySelector('[data-obj-print-value="paused"]').innerHTML=='<em>'+(showponies[currentShowpony].paused ? 'true' : 'false')+'</em>';
		}
	});
}

// Initial setup for Showponies
var keys=Object.keys(showponies);
for(var i=0;i<keys.length;i++){
	document.getElementById(keys[i]).dataset.waspaused='true';
}

//Choose the right input value
function chooseStory(id){
	console.log('RUN chooseStory');
	
	//Set the dropdown's value
	if(document.getElementById("example-list").value!==id){ 
		document.getElementById("example-list").value=id;
	}
	
	var keys=Object.keys(showponies);
	for(var i=0;i<keys.length;i++){
		
		if(keys[i]==id){
			if(document.getElementById(keys[i]).classList.contains("hidden")){
				document.getElementById(keys[i]).classList.remove("hidden");
				
				if(document.getElementById(keys[i]).dataset.waspaused=='false'){
					showponies[keys[i]].play();
				}else{
					showponies[keys[i]].pause();
				}
			}
			
			//Update URL and history
			history.replaceState(null,null,location.href.replace(/#[^$?]+|$/,"#"+keys[i]));
		}else{
			if(!document.getElementById(keys[i]).classList.contains("hidden")){
				document.getElementById(keys[i]).classList.add("hidden");
				
				document.getElementById(keys[i]).dataset.waspaused=showponies[keys[i]].paused ? 'true' : 'false';
				
				showponies[keys[i]].pause();
			}
		}
	}
	
	currentShowpony=id;
	
	printer.print(showponies[currentShowpony]);
}

var printer=new ObjPrint({
	window:document.getElementById("code")
	,explanationWindow:document.getElementById("propertyExplanation")
	,properties:{
	'auto':			'Whether the Showpony will automatically progress. Defaults to <em>false</em>.'
	,'buffered':	'An array of how much of the story has been buffered. If the story hasn\'t been buffered, this will be an empty array; if it has been fully loaded, it will be <em>true</em>.'
	,'cover':		'Appears when the Showpony loads. When clicked, will be removed and the Showpony will begin playing.'
		,'cover.content':	'The cover\'s title HTML.'
		,'cover.image':		'The cover\'s image.'
	,'currentFile':		'The current file number in the Showpony.'
	,'currentModule':	'The module the current file is using.'
	,'currentSubtitles':	'The subtitles in use for the current file (if any).'
	,'currentTime':		'The current time in the whole Showpony.'
	,'data':'An object that can be used to save user data. Defaults to <em>{}</em>'
	,'duration':	'The sum of all of the files\' durations.'
	,'files':		'An array of all of the files\' data.'
		,'files.#.buffered':		'An array of the amount of buffered content for a file. If nothing has yet been loaded, this will be an empty array. Once a file has fully loaded, this will be <em>true</em>.'
		,'files.#.date':		'The date and time the file went live.'
		,'files.#.duration':	'The length or estimated length of the file.'
		,'files.#.extension':	'The file\'s extension.'
		,'files.#.mimeType':	'The file\'s mime type.'
		,'files.#.module':		'The module this file will call.'
		,'files.#.name':		'The full filename for this file.'
		,'files.#.path':		'The path to this file.'
		,'files.#.size':		'The file\'s size in bytes.'
		,'files.#.subtitles':	'The file\'s subtitles.'
		,'files.#.title':		'The file\'s title.'
	,'fullscreen':			'Whether the Showpony is currently in fullscreen.'
	,'fullscreenEnter':		'Run to enter fullscreen.'
	,'fullscreenExit':		'Run to exit fullscreen.'
	,'fullscreenToggle':	'Run to toggle fullscreen.'
	,'gamepad':				'The gamepad currently in use with Showpony. Initializes to <em>null</em>.'
	,'infiniteScroll':		'Not yet in use.'
	,'input':		'General user input, like clicking.'
	,'loadBookmark':		'Load the user\'s bookmark.'
	,'media':		'Contains a count of how many of each module are in use.'
	,'message':		'A message from Showpony\'s PHP file. Should be empty if everything worked correctly; otherwise, it may contain important information.'
	,'modules':		'The modules in use by this Showpony.'
		// ,'modules.*':		'A module for displaying media.'
			// ,'modules.*.currentFile':		'The module\'s current file.'
			// ,'modules.*.currentTime':		'The module\'s current file\'s time.'
			// ,'modules.*.displaySubtitles':		'A function ran for working the subtitles.'
			// ,'modules.*.input':		'A function ran for user input.'
			// ,'modules.*.pause':		'A function ran to pause the module.'
			// ,'modules.*.play':		'A function ran to play the module.'
			// ,'modules.*.src':		'A function ran to update the source.'
			// ,'modules.*.timeUpdate':		'A function ran to track the current file\'s time.'
			// ,'modules.*.window':		'The module\'s window.'
	,'name':		'The Showpony object\'s name.'
	,'pause':		'Run to pause the Showpony.'
	,'paused':		'True if the Showpony is currently paused.'
	,'play':		'Run to play the Showpony.'
	,'query':		'The text in the search bar that tracks where you\'re at in the story. If <em>false</em>, no query is used. Defaults to <em>\'part\'</em>'
	,'saveBookmark':		'Run to save the current bookmark.'
	,'saveId':		'The filename for saving and loading bookmarks.'
	,'saveName':		'The filename for saving and loading bookmarks.'
	,'saveSystem':		'May be <em>false</em>, "local", or "remote".'
	,'subtitles':		'Contains supported languages and paths to those language\'s subtitles.'
	,'to':			'Go to a place in the Showpony file. You can go to an exact position or relative position. Pass an object like so: showpony.to({file:\'15\',time:\'2\'}). Relative values need to be prepended with a + or a - sign.'
	,'to(obj)':			'Has optional parameters <strong>time</strong> and <strong>file</strong>. You can set these to exact positions or relative ones: for example, {file:1}, {file:"+1"}, or {file:"-1"}.'
	,'toggle':		'Run this function to pause and unpause the Showpony.'
	,'window':		'The element the Showpony is in.'
	}
	,unsetAction:'default'
});

// Start
chooseStory(currentShowpony);