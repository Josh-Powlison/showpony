const DEFAULT_SHOWPONY='comic';

var currentShowpony=/#([^\?]+)/.exec(location.href);
if(currentShowpony) currentShowpony=currentShowpony[1];
else currentShowpony=DEFAULT_SHOWPONY;

document.getElementById("example-list").addEventListener("change",function(){
	chooseStory(this.value);
});

// Buttons
document.getElementById('button-previous').addEventListener('click',function(){
	showponies[currentShowpony].to({time:'-10'});
});

document.getElementById('button-next').addEventListener('click',function(){
	showponies[currentShowpony].to({time:'+10'});
});

document.getElementById('button-toggle').addEventListener('click',function(){
	showponies[currentShowpony].toggle();
});

// Add event listeners to them all
for(var key in showponies){
	showponies[key].window.addEventListener('timeupdate',function(event){
		if(this===showponies[currentShowpony].window){
			document.querySelector('[data-obj-print-value="currentTime"]').innerHTML=event.detail.time;
			
			document.querySelector('[data-obj-print-value="currentFile"]').innerHTML=event.detail.file;
		}
	});
	
	showponies[key].window.addEventListener('play',function(event){
		if(this===showponies[currentShowpony].window){
			document.querySelector('[data-obj-print-value="paused"]').innerHTML=showponies[currentShowpony].paused;
			// document.querySelector('[data-obj-print-value="paused"]').innerHTML='<em>'+(showponies[currentShowpony].paused ? 'true' : 'false')+'</em>';
		}
	});
	
	showponies[key].window.addEventListener('pause',function(event){
		if(this===showponies[currentShowpony].window){
			document.querySelector('[data-obj-print-value="paused"]').innerHTML=showponies[currentShowpony].paused;
			// document.querySelector('[data-obj-print-value="paused"]').innerHTML=='<em>'+(showponies[currentShowpony].paused ? 'true' : 'false')+'</em>';
		}
	});
}

//Choose the right input value
function chooseStory(id){
	
	//Set the dropdown's value
	if(document.getElementById("example-list").value!==id){ 
		document.getElementById("example-list").value=id;
	}
	
	var keys=Object.keys(showponies);
	for(var i=0;i<keys.length;i++){
		if(keys[i]==id){
			if(document.getElementById(keys[i]).classList.contains("hidden")){
				document.getElementById(keys[i]).classList.remove("hidden");
				
				console.log(document.getElementById(keys[i]).dataset.wasPaused=='false');
				
				if(document.getElementById(keys[i]).dataset.wasPaused=='false'){
					showponies[keys[i]].play();
				}else{
					showponies[keys[i]].pause();
				}
			}
			
			//Update URL and history
			history.replaceState(null,null,location.href.replace(/#[^$?]+/,'')+"#"+keys[i]);
		}else{
			if(!document.getElementById(keys[i]).classList.contains("hidden")){
				document.getElementById(keys[i]).classList.add("hidden");
				
				document.getElementById(keys[i]).dataset.wasPaused=showponies[keys[i]].window.classList.contains("showpony-paused");
				
				if(showponies[keys[i]].currentFile>-1) showponies[keys[i]].pause();
			}
		}
	}
	
	currentShowpony=id;
	
	listing.updateObjectDisplay(showponies[currentShowpony]);
}

var listing=new ObjList(document.getElementById("code"));

function ObjList(input){
	const O=this;
	O.window=input;
	
	container=null;

	O.updateObjectDisplay=function(obj){
		O.window.innerHTML='Loading...';
		
		container=document.createDocumentFragment();
		
		var openingBracket=document.createElement('p');
		openingBracket.className='obj-print-bracket';
		openingBracket.innerHTML=Array.isArray(obj) ? '[' : '{';
		openingBracket.style.marginLeft='0em';
		container.appendChild(openingBracket);
		
		O.buildObjectList(obj,1);
		
		O.window.innerHTML='';
		O.window.appendChild(container);

		document.getElementById("propertyExplanation").innerHTML='Hover over a property to get info on it!';
	}

	O.buildObjectList=function(obj,level=1,depth=''){
		container.className='obj-print-container';
		
		var keys=Object.keys(obj);
		if(!Array.isArray(obj)) keys=keys.sort();
		
		for(var i=0;i<keys.length;i++){
			var value=obj[keys[i]];
			
			// Build line
			var lineEl=document.createElement('p');
			lineEl.className='obj-print-line';
			lineEl.style.marginLeft=level+'em';
			
			container.appendChild(lineEl);
			
			// Build name
			var nameEl=document.createElement('span');
			nameEl.innerHTML=keys[i];
			if(!Array.isArray(obj)){
				nameEl.className='obj-print-name';
				nameEl.dataset.call=depth+keys[i];
				nameEl.addEventListener("mouseover",function(){
					if(document.querySelector('.obj-print-name-study')) document.querySelector('.obj-print-name-study').classList.remove('obj-print-name-study');
					
					this.classList.add('obj-print-name-study');

					var value='VALUE NOT FOUND';
					
					if(propertyInfo[this.dataset.call]){
						value=propertyInfo[this.dataset.call];
					}else{
						// Try using wildcards in the text
						var split=this.dataset.call.split(':');
						for(var i=0;i<split.length;i++){
							var test=this.dataset.call.replace(split[i],'*');
							if(propertyInfo[test]){
								value=propertyInfo[test];
								break;
							}
						}
					}
					
					document.getElementById("propertyExplanation").innerHTML="<strong>"+this.innerHTML+"</strong>: "+value;
				});
			}else{
				nameEl.dataset.call=depth+'#';
			}
			
			lineEl.appendChild(nameEl);

			// Build value
			var valueEl=document.createElement("span");
			
			var print='';
			
			switch(typeof value){
				case 'number':
					print+=value;
					break;
				case 'boolean':
					print+='<em>'+(value ? 'true' : 'false')+'</em>';
					break;
				case 'string':
					print+='"'+value+'"';
					break;
				case 'object':
					if(value===null) print+='<em>null</em>';
					else{
						print+=Array.isArray(value) ? '[' : '{';
						O.buildObjectList(value,level+1,nameEl.dataset.call+':');
					}
					break;
				case 'function':
					print+='<em>'+/.+?(?={\r)/.exec(value.toString())[0]+'</em>';
					break;
				case 'undefined':
					print+='<em>undefined</em>';
					break;
				default: break;
			}
			
			valueEl.innerHTML=': <span data-obj-print-value="'+nameEl.dataset.call+'">'+print+'</span>';
			
			lineEl.appendChild(valueEl);
			
			
		}
		
		var closingBracket=document.createElement('p');
		closingBracket.className='obj-print-bracket';
		closingBracket.innerHTML=Array.isArray(obj) ? ']' : '}';
		closingBracket.style.marginLeft=(level-1)+'em';
		container.appendChild(closingBracket);
	}
}

var propertyInfo={
	'auto':			'Whether the Showpony will automatically progress. Defaults to <em>false</em>.'
	,'buffered':	'How much of the story has been buffered.'
	,'cover':		'Appears when the Showpony loads. When clicked, will be removed and the Showpony will begin playing.'
		,'cover:content':	'The cover\'s title HTML.'
		,'cover:image':		'The cover\'s image.'
	,'currentFile':		'The current file number in the Showpony.'
	,'currentModule':	'The module the current file is using.'
	,'currentSubtitles':	'The subtitles in use for the current file (if any).'
	,'currentTime':		'The current time in the whole Showpony.'
	,'data':'An object that can be used to save user data. Defaults to <em>{}</em>'
	,'duration':	'The sum of all of the files\' durations.'
	,'files':		'An array of all of the files\' data.'
		,'files:#:buffered':		'An array of the amount of buffered content for a file. Initializes to <em>false</em>'
		,'files:#:date':		'The date and time the file went live.'
		,'files:#:duration':	'The length or estimated length of the file.'
		,'files:#:extension':	'The file\'s extension.'
		,'files:#:mimeType':	'The file\'s mime type.'
		,'files:#:module':		'The module this file will call.'
		,'files:#:name':		'The full filename for this file.'
		,'files:#:path':		'The path to this file.'
		,'files:#:size':		'The file\'s size in bytes.'
		,'files:#:subtitles':	'The file\'s subtitles.'
		,'files:#:title':		'The file\'s title.'
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
		,'modules:*':		'A module for displaying media.'
			,'modules:*:currentFile':		'The module\'s current file.'
			,'modules:*:currentTime':		'The module\'s current file\'s time.'
			,'modules:*:displaySubtitles':		'A function ran for working the subtitles.'
			,'modules:*:input':		'A function ran for user input.'
			,'modules:*:pause':		'A function ran to pause the module.'
			,'modules:*:play':		'A function ran to play the module.'
			,'modules:*:src':		'A function ran to update the source.'
			,'modules:*:timeUpdate':		'A function ran to track the current file\'s time.'
			,'modules:*:window':		'The module\'s window.'
	,'name':		'The Showpony object\'s name.'
	,'pause':		'Run to pause the Showpony.'
	,'paused':		'True if the Showpony is currently paused.'
	,'play':		'Run to play the Showpony.'
	,'query':		'The text in the search bar that tracks where you\'re at in the story. If <em>false</em>, no query is used. Defaults to <em>\'part\'</em>'
	,'saveBookmark':		'Run to save the current bookmark.'
	,'saveId':		'The filename for saving and loading bookmarks.'
	,'saveName':		'The filename for saving and loading bookmarks.'
	,'saveSystem':		'May be <em>false,<em>, "local", or "remote".'
	,'subtitles':		'Contains supported languages and paths to those language\'s subtitles.'
	,'to':			'Run to go to any point in the Showpony file. You can go to an exact position or relative position. Pass an object like so: showpony.to({file:\'15\',time:\'2\'}). Relative values need to be prepended with a + or a - sign.'
	,'toggle':		'Run this function to pause and unpause the Showpony.'
	,'window':		'The element the Showpony is in.'
};

// Start
chooseStory(currentShowpony);