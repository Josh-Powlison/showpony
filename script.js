const DEFAULT_SHOWPONY='manga';

var currentShowpony=/#([^\?]+)/.exec(location.href);
if(currentShowpony) currentShowpony=currentShowpony[1];
else currentShowpony=DEFAULT_SHOWPONY;

document.getElementById("example-list").addEventListener("change",function(){
	chooseStory(this.value);
});

document.getElementById('refreshPrint').addEventListener('click',function(){
	printer.print(showponies[currentShowpony]);
});

// Initial setup for Showponies
var keys=Object.keys(showponies);
for(var i=0;i<keys.length;i++){
	document.getElementById(keys[i]).dataset.waspaused='true';
}

//Choose the right input value
function chooseStory(id){
	console.log('RUN chooseStory');
	
	// Set the dropdown's value
	if(document.getElementById("example-list").value!==id){ 
		document.getElementById("example-list").value=id;
	}
	
	// Load Showponies dynamically
	if(typeof showponies[id] === 'undefined'){
		var script = document.createElement('script');
		
		var showponyWindow = document.getElementById(id);
		
		script.src = showponyWindow.dataset.path;
		
		// showponies.push = ();
		showponyWindow.addEventListener('built',function(event){
			console.log('BUILT');
			showponies[id]=event.detail.object;
			
			/*
				CODE TO CUSTOMIZE THE SHOWPONIES
			*/

			if(id === 'manga'){
				// Make Game Plan! read from right-to-left
				showponies[id].window.classList.remove('s-left-to-right');
				showponies[id].window.classList.add('s-right-to-left');
				showponies[id].readingDirection = 'right-to-left';
				// showponies[id].to();
			}
			
			displayStory(id);
		});
		
		showponyWindow.appendChild(script);
	}else{
		displayStory(id);
	}
}

function displayStory(id){
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
	
	printer.print(showponies[currentShowpony]);
	
	currentShowpony=id;
}

var printer=new ObjPrint({
window:document.getElementById("properties")
,explanationWindow:document.getElementById("propertyExplanation")
,properties:{
	'auto':								'Whether the Showpony will automatically progress. Defaults to <em>false</em>.'
	,'buffered':						'An array of how much of the story has been buffered. If the story hasn\'t been buffered, this will be an empty array; if it has been fully loaded, it will be <em>true</em>.'
	,'cover':							'Appears when the Showpony loads. When clicked, will be removed and the Showpony will begin playing.'
		,'cover.content':				'The cover\'s title HTML.'
		,'cover.image':					'The cover\'s image.'
	,'changeLanguage':					'Switches the language. Recommended you use the dropdown built into showpony rather than this function.'
		,'changeLanguage(newLanguage)':	'The language to switch to.'
	,'currentFile':						'The current file number in the Showpony.'
	,'currentLanguage':					'The current language we\'re experiencing the story in.'
	,'currentModule':					'The module the current file is using.'
	,'currentSubtitles':				'The subtitles in use for the current file (if any).'
	,'currentTime':						'The current time in the whole Showpony.'
	,'data':'An object that can be used to save user data. Defaults to <em>{}</em>'
	,'displaySubtitles':				'Used to change the subtitles. Recommended you use the dropdown in Showpony instead.'
	,'displaySubtitles(newSubtitles)':	'The subtitles to switch to.'
	,'duration':						'The sum of all of the files\' durations.'
	,'files':							'An array of all of the files\' data.'
		,'files.#':						'A file.'
			,'files.#.buffered':		'An array of the amount of buffered content for a file. If nothing has yet been loaded, this will be an empty array. Once a file has fully loaded, this will be <em>true</em>.'
			,'files.#.date':			'The date and time the file went live.'
			,'files.#.duration':		'The length or estimated length of the file.'
			,'files.#.extension':		'The file\'s extension.'
			,'files.#.hidden':			'Whether a file is publicly available. If you\'re an admin, you may have hidden files accessible to you.'
			,'files.#.mimeType':		'The file\'s mime type.'
			,'files.#.module':			'The module this file will call.'
			,'files.#.name':			'The full filename for this file.'
			,'files.#.path':			'The path to this file.'
			,'files.#.size':			'The file\'s size in bytes.'
			,'files.#.subtitles':		'The file\'s subtitles.'
			,'files.#.title':			'The file\'s title.'
	,'fullscreen':						'Whether the Showpony is currently in fullscreen.'
	,'fullscreenEnter':					'Run to enter fullscreen.'
	,'fullscreenExit':					'Run to exit fullscreen.'
	,'fullscreenToggle':				'Run to toggle fullscreen.'
	,'gamepad':							'The gamepad currently in use with Showpony. Initializes to <em>null</em>.'
	,'infiniteScroll':					'Not yet in use.'
	,'input':							'General user input, like clicking.'
	,'load':							'Load the user\'s save data.'
	,'media':							'Contains a count of how many of each module are in use.'
	,'message':							'A message from Showpony\'s PHP file. Should be empty if everything worked correctly; otherwise, it may contain important information.'
	,'modules':							'The modules in use by this Showpony. I recommended you don\'t access any of these functions directly; use the main Showpony\'s functions.'
	,'name':							'The Showpony object\'s name.'
	,'path':							'The path from the homepage to the files.'
	,'pause':							'Run to pause the Showpony and show the menu.'
	,'paused':							'True if the Showpony is currently paused.'
	,'play':							'Run to unpause the Showpony and hide the menu.'
	,'progress':						'Run to progress in the story. Its effect will vary depending on the module.'
	,'queryBookmark':							'The text in the search bar that tracks where you\'re at in the story. If you load a webpage with queryBookmark, you\'ll load that bookmark. If you have a Save Bookmark though, that will be loaded instead (unless queryHardLink is used and set to true).'
	,'queryHardLink':					'If this value is set to <em>true</em> in the URL, the location in queryBookmark will override any saved bookmarks.'
	,'regress':							'Run to regress (go back) in the story. Its effect will vary depending on the module.'
	,'save':							'Run to save the Showpony info.'
	,'saveName':						'The filename for saving and loading bookmarks.'
	,'saves':							'Contains info on the save data. Some of the data is also copied to cookies so it can be read on the server-side (like story language and bookmark system).'
		,'saves.currentSave':			'The name of the current save file.'
		,'saves.system':				'The current save system in use.'
		,'saves.timestamp':				'The time of the last save.'
		,'saves.local':					'Local save files.'
			,'saves.local.*':			'A local save file.'
			,'saves.local.*.bookmark':	'The saved time in the story.'
			,'saves.local.*.data':		'The saved data in the Showpony.'
			,'saves.local.*.language':	'The language in use by the save.'
			,'saves.local.*.subtitles':	'The subtitles in use by the save.'
			,'saves.local.*.timestamp':	'The last time this was saved.'
	,'saveSystem':						'May be <em>false</em>, "local", or "remote".'
	,'subtitles':						'Contains supported languages and paths to those language\'s subtitles.'
	,'to':								'Go to a place in the Showpony file. You can go to an exact position or relative position. Pass an object like so: showpony.to({file:\'15\',time:\'2\'}). You can also write times as timestamps ("1:15:00", or 1 hour, 15 minutes). Relative values need to be prepended with a + or a - sign.'
	,'to(obj)':							'Has optional parameters <strong>time</strong> and <strong>file</strong>. You can set these to exact positions or relative ones: for example, {file:1}, {file:"+1"}, or {file:"-1"}.'
	,'toggle':							'Run this function to pause and unpause the Showpony.'
	,'upcomingFiles':					'Tracks what files are coming up.'
	,'window':							'The element the Showpony is in.'
}
	,unsetAction:'default'
});

// Start
chooseStory(currentShowpony);