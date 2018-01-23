function Showpony(input){

"use strict";

//If an input object doesn't exist, make one
if(!input) input={};

//If no window was passed, make one!
if(!input.window){
	document.currentScript.insertAdjacentElement('afterend',input.window=document.createElement("div"));
	input.window.className="showpony-default";
}

///////////////////////////////////////
///////////PUBLIC VARIABLES////////////
///////////////////////////////////////

//Engine settings
const S=this;

//Set default values
function d(v,val){S[v]=(input[v]!==undefined ? input[v] : val);}

S.window=input.window;
S.originalWindow=S.window.cloneNode(true);
d('files','get');
d('path','files/');
d('language','');
d('loadingClass',null);
d('scrubLoad',false);
d('info','[Current File] | [Files Left]');
d('data',{});
d('defaultDuration',10);
d('title',false);
d('dateFormat',{year:"numeric",month:"numeric",day:"numeric"});
d('admin',false);
d('query','file');
d('shortcuts','focus');
d('user',null);
d('object',location.hostname.substring(0,30));

///////////////////////////////////////
///////////PUBLIC FUNCTIONS////////////
///////////////////////////////////////

//Go to another file
S.to=function(input){
	console.log(input);
	
	var obj=input || {};
	
	//Relative file
	if(obj.file && (obj.file[0]==='+' || obj.file[0]==='-')) obj.file=S.currentFile+(parseInt(obj.file.substring(1))*(obj.file[0]==='-' ? -1 : 1));
	
	//Relative time
	if(obj.time && (obj.time[0]==='+' || obj.time[0]==='-')){
		var getTime=0;
		//Add the times of previous videos to get the actual time in the piece
		for(var i=0;i<S.currentFile;i++) getTime+=getLength(S.files[i]);
		
		getTime+=types[currentType] && types[currentType].currentTime || 0;
		
		obj.time=getTime+(parseFloat(obj.time.substring(1))*(obj.time[0]==='-' ? -1 : 1));
		
		//Don't go below 0
		if(obj.time<0) obj.time=0;
	}
	
	//If a time is passed but no file, get file and time based on the place in the total
	if(obj.time!==undefined && obj.file===undefined){
		obj.file=0;
		
		//Look through the videos for the right one
		var l=S.files.length;
		for(var i=0;i<l;i++){
			var length=getLength(S.files[i]);
			
			//If we've reached the file, exit
			if(obj.time<length) break;
			//Otherwise go to the next file
			else obj.file++, obj.time-=length;
			
			//If the time passed is greater than the total time, the story will end
		}
		
		console.log(obj.time,obj.file);
	}
	
	Object.assign(obj,{
		file:obj.file!==undefined ? obj.file : S.currentFile
		,time:obj.time || 0
		,refresh:obj.refresh || false
		,reload:obj.reload || false
		,scrollToTop:obj.scrollToTop===undefined ? true : obj.scrollToTop
		,popstate:obj.popstate || false
		,replaceState:obj.replaceState || false
	});
		
		/*
	//Don't continue if the file is the same and we aren't trying to refresh
	if(obj.file==S.currentFile){
		//Set the time to the new time though
		if(thisType){
			thisType.currentTime=obj.time;
		}
	}
	
	console.log(obj.file,S.currentFile,thisType,obj.time);
	
	//Change the title if requested
	if(S.title) document.title=replaceInfoText(S.title,S.currentFile);
	
	if(obj.file==S.currentFile && !obj.refresh) return;*/
	
	//Use different options
	S.currentFile=
		obj.file==="first" ? 0
		: obj.file==="prev" ? S.currentFile-1
		: obj.file==="next" ? S.currentFile+1
		: obj.file==="last" ? S.files.length-1
		: parseInt(obj.file || 0) //Get the file, or 0 if it's undefined
	;
	
	//If we're at the end, run the readable event
	if(S.currentFile>=S.files.length){
		//Go to the final file
		S.currentFile=S.files.length-1;
		
		//If we aren't just trying to reload a file, end; otherwise, get to that last file
		if(!obj || !obj.reload){
			//Run the event that users can read
			S.window.dispatchEvent(new CustomEvent("end"));
			
			console.log("Ended!");
			return;
		}
	}
	
	if(S.currentFile<0) S.currentFile=0;
	
	//If we're using queries
	if(S.query && !obj.popstate){
		var search=new RegExp('(\\?|&)'+S.query+'=','i')
			,newURL=document.location.href;
		
		if(search.test(newURL)) newURL=newURL.replace(new RegExp('((\\?|&)'+S.query+')=?[^&]+','i'),'$1='+(S.currentFile+1));
		else newURL+=(newURL.indexOf("?")>-1 ? '&' : '?') +(S.query+'='+(S.currentFile+1));
		
		console.log(newURL);
		
		//Either replace or push the state
		history[obj.replaceState ? "replaceState" : "pushState"]({},"",newURL);
	}
	
	//If we aren't moving the bar, update the overlay
	scrubbing===false && scrub();
	
	//Go to the top of the page (if we didn't come here by autoloading)
	obj.scrollToTop && S.window.scrollIntoView();
	
	var newType=getMedium(S.files[S.currentFile])
		,thisType=types[newType];
	
	//Multimedia engine resets
	S.lines=null;
	S.charsHidden=0;
	S.currentLine=0;
	content.style.cssText=null; //Remove any styles applied to the content
	waitForInput=false;
	waitTimer=null;
	
	//If switching types, do some cleanup
	if(currentType!=newType || newType==='multimedia'){ //Reset for multimedia engine- for now!
		content.innerHTML="";
		console.log(types);
		content.appendChild(thisType);
		S.objects={window:S.window};
		S.textboxes={};
		S.lines=[];
	}
	
	//How we get the file depends on whether or not it's private
	var src=(S.files[S.currentFile][0]=="x" ? "showpony/ajax.php?get=" : "")+S.path+S.language+S.files[S.currentFile];
	
	//Refresh the file, if requested we do so, by adding a query
	if(obj.refresh) src+=(S.files[S.currentFile][0]==="x" ? "&" : "?")+"refresh-"+Date.now();
	
	currentType=newType;
	
	//Display the medium based on the file extension
	if(currentType==='text') GET(src,ajax=>{content.innerHTML=ajax.responseText;});
	else if(currentType==='multimedia'){
		GET(src,ajax=>{
			S.lines=ajax.responseText.match(/[^\r\n]+/g); //Get each line (taking into account and ignoring extra lines)
			runMM(0);
		});
	}else{
		//Adjust the source
		thisType.src=src;
		if(currentType==='video' || currentType==='audio') !overlay.classList.contains("showpony-overlay-visible") && thisType.play();
	}
	
	thisType.currentTime=obj.time; //Update the time
	if(S.title) document.title=replaceInfoText(S.title,S.currentFile); //Update the title if it's set
	
	//Run custom event for checking time
	S.window.dispatchEvent(
		new CustomEvent(
			"time"
			,{
				detail:{
					file:(S.currentFile+1)
					,time:thisType.currentTime
				}
			}
		)
	);
}

//Toggle the menu
S.menu=function(event){
	//If we're moving the bar right now, ignore clicking (only for clicking, touches are checked elsewhere)
	if(event && !event.changedTouches && userScrub(event)) return;
	
	//We can cancel moving the bar outside of the overlay, but we can't do anything else.
	//Exit if we're not targeting the overlay.
	if(event && event.target!==overlay) return;
	
	else //If we aren't moving the bar
	{
		//On toggling classes, returns "true" if just added
		if(overlay.classList.toggle("showpony-overlay-visible")){
			scrub();
			
			//Play/pause video or audio
			types[currentType].play && types[currentType].pause();
		}else types[currentType].play && types[currentType].play();
	}
	
	//Send an event when toggling the menu
	S.window.dispatchEvent(
		new CustomEvent("menu"
		,{detail:{
			open:(
				overlay.classList.contains("showpony-overlay-visible") ? true
				: false
			)
		}})
	);
};

function userScrub(){
	var touch=event.changedTouches ? true : false;
	var pos=touch ? event.changedTouches[0].clientX : event.clientX;
	
	if(scrubbing===true){
		scrubbing=false;
	
		//If we don't preload while scrubbing, load the file now that we've stopped scrubbing
		if(S.scrubLoad==false){
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

//Toggle fullscreen
S.fullscreen=function(type){
	//Get fullscreen type
	var browser=S.window.requestFullscreen ?
			{
				element:"fullscreenElement"
				,request:"requestFullscreen"
				,exit:"exitFullscreen"
			}
		: S.window.webkitRequestFullscreen ?
			{
				element:"webkitFullscreenElement"
				,request:"webkitRequestFullscreen"
				,exit:"webkitExitFullscreen"
			}
		: S.window.mozRequestFullScreen ?
			{
				element:"mozFullScreenElement"
				,request:"mozRequestFullScreen"
				,exit:"mozCancelFullScreen"
			}
		: null
	;
	
	//If a fullscreen-supporting browser wasn't found, return
	if(!browser) return;
	
	//If fullscreen and not requesting, exit
	if(document[browser.element]) type!=="request" && document[browser.exit]();
	//If not fullscreen and not exiting, request
	else type!=="exit" && S.window[browser.request]();
}

//When the viewer inputs to Showpony (click, space, general action)
S.input=function(){
	console.log(currentType);
	
	//Function differently depending on medium
	switch(currentType){
		case "image":
			S.to({file:"+1"}); break;
		case "audio": case "video":
			S.menu(); break;
		case "multimedia":
			//If the player is making choices right now
			if(waitForInput) return;
		
			//If a wait timer was going, stop it.
			clearTimeout(waitTimer);
		
			console.log(S.charsHidden);
		
			//If all letters are displayed
			if(S.charsHidden<1) runMM();
			else //If some S.objects have yet to be displayed
			{
				console.log(S.textboxes);
				
				//Go through each textbox and display all of its text
				Object.keys(S.textboxes).forEach(
					function(key){
						let l=S.textboxes[key].children.length;
						for(let i=0;i<l;i++){
							//Skip over non-span tags
							if(S.textboxes[key].children[i].tagName!=="SPAN") continue;
							
							//Remove the delay so they're displayed immediately
							S.textboxes[key].children[i].children[0].style.animationDelay="0s";
						}
					}
				);
			}
			break;
	}
}

//Close ShowPony
S.close=function(){
	//Remove the window event listener
	window.removeEventListener("click",windowClick);
	
	//Reset the window to what it was before
	S.window.parentNode.replaceChild(S.originalWindow,S.window);
}

///////////////////////////////////////
///////////PRIVATE VARIABLES///////////
///////////////////////////////////////

var multimediaSettings={
	textbox:"main"
	,text: null
	,go:false
};

//Waiting for user input
var waitForInput=false
	,scrubbing=false
	,waitTimer=null
	,currentType=null
	,loggedIn=false //Logged in as admin
	//Elements
	,overlay=m("overlay")
	,overlayText=m("overlay-text")
	,progress=m("progress")
	,content=m("content")
	//Buttons
	,menuButton=m("button showpony-menu-button showpony-button-preview","button")
	,fullscreenButton=m("button showpony-fullscreen-button showpony-button-preview","button")
	,captionsButton=m("captions-button","button")
	,accountButton=m("button showpony-account-button showpony-button-preview","button")
	,menuButtons=m("menu-buttons","div")
	,types={
		image:m("block","img")
		,audio:m("block","audio")
		,video:m("block","video")
		,multimedia:m("multimedia")
		,text:m("text")
	}
	
	,continueNotice=m("continue")
;

content.className="showpony-content";

menuButton.alt="Menu";
fullscreenButton.alt="Fullscreen";
accountButton.alt="Hey Bard! Account";
captionsButton.alt="Closed Captions/Subtitles";
continueNotice.innerHTML="...";

frag([menuButton,fullscreenButton,accountButton],menuButtons);
frag([progress,overlayText],overlay);

///////////////////////////////////////
///////////PRIVATE FUNCTIONS///////////
///////////////////////////////////////

function startup(){
	//currentFile is -1 before we load
	S.currentFile=-1;
	
	//If not an int, get the final part (like if the text reads "last")
	S.start=parseInt(input.start) || S.files.length-1;
	
	//For now, all stories will get remote accounts from heybard.com
	POSTRemote(
		false
		,function(response){
			//If a bookmark was set, use it; otherwise, use the default part
			if(!isNaN(response.bookmark)) S.start=response.bookmark;
			
			//If querystrings are in use, consider the querystring in the URL
			if(S.query){
				window.addEventListener(
					"popstate"
					,function(){
						var page=window.location.href.match(new RegExp(S.query+'[^&]+','i'));
						
						if(page) S.to({file:parseInt(page[0].split("=")[1])-1,popstate:true,scrollToTop:false});
					}
				);
				
				var page=window.location.href.match(new RegExp(S.query+'[^&]+','i'));
			
				//Add in the time if it needs it, otherwise pass nothing
				S.to({
					file: page ? parseInt(page[0].split("=")[1])-1 : S.start
					,popstate:page ? true : false
					,replaceState:page ? false : true //We replace the current state in some instances (like on initial page load) rather than adding a new one
					,scrollToTop:false
				});
			//Start
			}else S.to({file:S.start,scrollToTop:false});
			
			//Set input to null in hopes that garbage collection will come pick it up
			input=null;
		}
		,{'call':'get'}
	);
}

//Update the scrubber's position
function scrub(inputPercent){
	var duration=S.files.map(function(e){return getLength(e);}).reduce((a,b) => a+b,0);
	
	//If no inputPercent was passed, estimate it
	if(typeof(inputPercent)==='undefined'){
		//Use the currentTime of the object, if it has one
		var currentTime=types[currentType] && types[currentType].currentTime || 0;
		
		//Add the times of previous videos to get the actual time in the piece
		for(var i=0;i<S.currentFile;i++) currentTime+=getLength(S.files[i]);
		
		var inputPercent=currentTime / duration
			,newPart=S.currentFile;
	}else{ //if inputPercent WAS passed
	
		//Clamp inputPercent between 0 and 1
		inputPercent= inputPercent <= 0 ? 0 : inputPercent >= 1 ? 1 : inputPercent;
		
		//Go to the time
		var newTime=duration*inputPercent
			,newPart=0
		;
		
		//Look through the media for the right one
		var l=S.files.length;
		for(var i=0;i<l;i++){
			//If the duration's within this one, stop at this one
			if(i==l-1 || newTime<getLength(S.files[i])){
			//If this is the media!
				//If we allow scrubbing or we're not moving the bar, we can load the file
				if(S.scrubLoad!==false || scrubbing===false) S.to({file:i,time:newTime});
				
				newPart=i;
			
				break;
			//Otherwise, go to the next one (and subtract the duration from the total duration)
			}else newTime-=getLength(S.files[i]);
		}
	}
	
	//Move the progress bar
	progress.style.left=(inputPercent*100)+"%";

	//Set the overlay text (the current time)
	overlayText.innerHTML="<p>"+replaceInfoText(
		S.info
		,newPart
		,Math.floor(newTime)
	)+"</p>";
}

//Drag on the menu to go to any part
function moveOverlay(event){
	//Mouse and touch work slightly differently
	var touch=event.changedTouches ? true : false;
	var pos=touch ? event.changedTouches[0].clientX : event.clientX;
	
	if(scrubbing===false){
		if(touch) scrubbing=pos;
		else return;
	}
		
	//You have to swipe farther than you move the cursor to adjust the position
	if(scrubbing!==true){
		if(Math.abs(scrubbing-pos)>screen.width/(touch ? 20 : 100)) scrubbing=true;
		else return;
	}
	
	//Don't want the users to accidentally swipe to another page!
	if(touch) event.preventDefault();
	
	scrub(
		(pos-S.window.getBoundingClientRect().left)
		/
		(S.window.getBoundingClientRect().width)
	);
}

function replaceInfoText(value,fileNum,current){
	var duration=S.files.map(function(e){return getLength(e);}).reduce((a,b) => a+b,0);
	
	if(current===undefined){
		//var currentType=getMedium(S.files[S.currentFile]);
		
		//Use the currentTime of the object, if it has one
		var currentTime=types[currentType] && types[currentType].currentTime || 0;
		
		//Add the times of previous videos 7to get the actual time in the piece
		for(var i=0;i<S.currentFile;i++) currentTime+=getLength(S.files[i]);
		
		var inputPercent=currentTime / duration
			,newPart=S.currentFile;
			
		var current=Math.floor(inputPercent*duration)
			,left=duration-Math.floor(inputPercent*duration)
		;
	}else var left=duration-current;
	
	//Save all the values to instantly pass them through
	var values={
		name:{
			current:getName(S.files[fileNum])
		}
		,date:{
			current:"Undated"
		}
		,file:{
			current:	fileNum+1
			,left:		S.files.length-(fileNum+1)
			,total:		S.files.length
		}
		,percent:{
			current:	(inputPercent*100)|0
			,left:		((1-inputPercent)*100)|0
			,total:		100
		}
		,hours:{
			current:	(current / 3600)|0
			,left:		(left / 3600)|0
			,total:		(duration / 3600)|0
		}
		,minutes:{
			current:	((current % 3600) / 60)|0
			,left:		((left % 3600) / 60)|0
			,total:		((duration % 3600) / 60)|0
		}
		,seconds:{
			current:	(current % 60)|0
			,left:		(left % 60)|0
			,total:		(duration % 60)|0
		}
	}
	
	//Get the name, remove the parentheses (skip over "x")
	var date=/^\d{4}-\d\d-\d\d(\s\d\d:\d\d:\d\d)?$/.exec(S.files[fileNum]);

	//If there's a date, return it; otherwise, return blank space
	if(date){
		date=date[0].split(/[\s-:;]+/);
		
		console.log(date);
		
		date=new Date(Date.UTC(
			date[0]			//Year
			,date[1]-1 || 0	//Month
			,date[2] || 0	//Date
			,date[3] || 0	//Hours
			,date[4] || 0	//Minutes
			,date[5] || 0	//Seconds
			,date[6] || 0	//Milliseconds
		));
		
		values.date.current=new Intl.DateTimeFormat(
			"default"
			,S.dateFormat
		).format(date);
	}
	
	//Use special naming convention to replace values correctly
	function infoNaming(input){
		//Choose the right type
		
		//Defaults (we don't bother searching for these)
		var type="file", value="current";
		
		//Get the type
		if(/name|title/i.test(input)) type="name";
		else if(/date|release/i.test(input)) type="date";
		else if(/%|percent/i.test(input)) type="percent";
		else if(/hour/i.test(input)) type="hours";
		else if(/min/i.test(input)) type="minutes";
		else if(/sec/i.test(input)) type="seconds";
		
		//Get the value type
		if(/left|remain/i.test(input)) value="left";
		else if(/total|all/i.test(input)) value="total";
		
		var pad=parseInt(input.match(/[0-9]+/i)) || 0;
		
		//Return the value
		return padStart(values[type][value],pad);
	}
	
	return value.replace(/\[[^\]]+\]/g,infoNaming);
}

//Pad the beginning of a value with leading zeroes
function padStart(input,length){
	//Make input a string
	input=String(input);
	
	//Return if length is 0
	if(!length) return input;
	
	var padded=('000000000'+input).slice(-length);
	
	//Return either the input or the padded value, whichever is longer
	return input.length>padded.length ? input : padded;
}

//Get a file's name
function getName(input){
	return safeFilename(
		input.replace(/(^[^(]+\()|(\)[^)]+$)/g,'')
		,"from"
	)
};

//Get a file's date
function getDate(input){
	return input.replace(/x|\s?(\(|\.).+/g,'').replace(/;/g,':');
}

//Make a GET call
function GET(src,onSuccess){
	//Add loadingClass
	S.loadingClass && S.window.classList.add(S.loadingClass);
	
	var ajax=new XMLHttpRequest();
	ajax.open("GET",src);
	ajax.send();
	
	ajax.addEventListener(
		"readystatechange"
		,function(){
			if(ajax.readyState==4){
				if(ajax.status==200){
					onSuccess(ajax);
					//Remove loadingClass
					if(S.loadingClass) content.classList.remove(S.loadingClass);
				}else{
					alert("Failed to load file called: "+S.path+S.language+S.files[S.currentFile]);
				}
			}
		}
	);
}

//Make a POST call
function POST(onSuccess,obj){
	//Prepare the form data
	var formData=new FormData();
	formData.append('call',obj.call);
	formData.append('path',S.path+S.language);
	
	//Special values, if passed
	obj.password && formData.append('password',obj.password);
	obj.name && formData.append('name',obj.name);
	obj.newName && formData.append('newName',obj.newName);
	obj.files && formData.append('files',obj.files);
	
	var ajax=new XMLHttpRequest();
	ajax.open("POST","showpony/ajax.php");
	ajax.send(formData);
	
	ajax.addEventListener(
		"readystatechange"
		,function(){
			if(ajax.readyState==4){
				if(ajax.status==200){
					var response=JSON.parse(ajax.responseText);
					console.log(response);
					
					if(response.success){
						loggedIn=response.admin;
						
						if(response.files) S.files=response.files;
						
						onSuccess(response);
					}else alert(response.message);
				}else alert("Failed to load Showpony class file.");
			}
		}
	);
}

//Make a POST call to heybard.com
function POSTRemote(event,onSuccess,obj){
	//Defaults to a bookmark update
	obj=obj || {};
	
	//Prepare the form data
	var formData=new FormData();
	formData.append('call',obj.call || 'bookmark');
	formData.append('object',S.object);
	
	//Special values, if passed
	formData.append('file',S.currentFile);
	
	var ajax=new XMLHttpRequest();
	ajax.open("POST","http://localhost/heybard/api/account.php");
	ajax.send(formData);
	
	ajax.addEventListener(
		"readystatechange"
		,function(){
			if(ajax.readyState==4){
				if(ajax.status==200){
					var response=JSON.parse(ajax.responseText);
					
					if(response.success) onSuccess && onSuccess(response);
					else console.log(response.message);
				}else{
					console.log("Failed to load Hey Bard account.");
				}
			}
		}
	);
}

//Get the medium of a file
function getMedium(name){
	//Get the extension- fast!
	switch(name.slice((name.lastIndexOf(".") - 1 >>> 0) + 2)){
		case "jpg":
		case "jpeg":
		case "png":
		case "gif":
		case "svg":
			return "image";
			break;
		case "mp4":
		case "webm":
			return "video";
			break;
		case "mp3":
		case "wav":
			return "audio";
			break;
		case "mm":
			return "multimedia";
			break;
		//All else defaults to text
		default:
			return "text";
			break;
	}
}

function getLength(file){
	var get=/[^\s)]+(?=\.)/.exec(file);

	//Return the value in the file or the default duration
	return (get ? parseFloat(get[0]) : S.defaultDuration);
}

//Use documentFragment to append elements faster
function frag(inputArray,inputParent){
	var fragment=document.createDocumentFragment();
	
	for(var i=0, len=inputArray.length;i<len;i++) fragment.appendChild(inputArray[i]);
	
	inputParent.appendChild(fragment);
}

//Create an element with a class
function m(c,el){
	var a=document.createElement(el || "div");
	a.className="showpony-"+c;
	
	return a;
}

//When video or audio ends
function mediaEnd(){
	//Only do this if the menu isn't showing (otherwise, while we're scrubbing this can trigger)
	if(!overlay.classList.contains("showpony-overlay-visible")) S.to({file:"+1"});
}

//Run multimedia (interactive fiction, visual novels, etc)
function runMM(inputNum){
	
	//Go to either the specified line or the next one
	S.currentLine=(inputNum!==undefined ? inputNum : S.currentLine+1);
	
	//If we've ended manually or reached the end, stop running immediately and end it all
	if(S.currentLine>=S.lines.length){
		console.log("Ending!");
		S.to({file:"+1"});
		return;
	}
	
	var text=S.lines[S.currentLine];
	
	//Replace all variables (including variables inside variables) with the right name
	var match;
	while(match=/[^\[]+(?=\])/g.exec(text)) text=text.replace('['+match[0]+']',S.data[match[0]]);

	var wait=true; //Assume waiting time
	
	if(text[0]==">"){
		var vals=text.replace(/^>\s+/,'').split(/(?:\s{3,}|\t+)/);
		
		console.log(text,vals);
		
		//We run a function based on the value passed.
		//If it returns multimediaSettings, we use those new ones over the old ones.
		multimediaSettings=multimediaFunction[vals[0].toLowerCase().substr(0,2)](vals,multimediaSettings) || multimediaSettings;
		//console.log(multimediaSettings,S.currentLine);
		
		if(!multimediaSettings.go) return;
		multimediaSettings.go=false;
	}
	
	//If the textbox hasn't been created, create it!
	if(!S.textboxes[multimediaSettings.textbox]) content.appendChild(S.textboxes[multimediaSettings.textbox]=m("textbox"));
	
	S.textboxes[multimediaSettings.textbox].innerHTML="";
	
	//STEP 2: Design the text//
	
	//Design defaults
	var charElementDefault=m("char-container","span")
		,charElement
		,baseWaitTime
	;
	
	//Reset the defaults with this function, or set them inside here!
	function charDefaults(){
		//Use the default element for starting off
		charElement=charElementDefault.cloneNode(true);
		baseWaitTime=.03; //The default wait time
	}
	
	//Use the defaults
	charDefaults();

	//The total time we're waiting until x happens
	var totalWait=0;
	var fragment=document.createDocumentFragment();
	
	var l=text.length;
	for(let i=0;i<l;i++){	
		var waitTime=baseWaitTime;
		
		//Check the current character//
		switch(text[i]){
			case '{':
				//Skip over the opening bracket
				i++;
			
				var values='';
			
				//Wait until a closing bracket (or the end of the text)
				while(text[i]!='}' && i<text.length){
					values+=text[i];
					i++;
				}
				
				//If nothing's inside, reset to defaults
				if(values=='') charDefaults();
				else //If code's inside, adjust display
				{
					values=values.split(',');
					
					//MSCE (Missy) format (Multiplier, Speed, Color, Effect)
					
					//M: Text multiplier
					if(values[0].length) charElement.style.fontSize=values[0]+"em";
					
					//Speed of the text
					if(values[1].length) baseWaitTime=parseFloat(values[1]);
					
					//Color
					if(values[2].length) charElement.style.color=values[2];
					
					//Effect
					if(values[3].length) charElement.classList.add("showpony-char-"+values[3]);
				}
				
				//Adjust the styles of charElement based on what's passed (this will impact all future S.objects)
				
				//Pass over the closing bracket
				continue;
			//Lines breaks
			case '#':
				fragment.appendChild(document.createElement("br"));
				continue;
			default:
				//Handle punctuation
				if(i!=text.length && text[i+1]==' '){
					if(/[.!?:;-]/.test(text[i])) waitTime*=20;
					if(/[,]/.test(text[i])) waitTime*=10;
				}

				break;
		}
		
		//Make the char based on charElement
		var thisChar=charElement.cloneNode(false);
		
		let showChar=m("char","span");
		let hideChar=m("char-placeholder","span");
		hideChar.innerHTML=showChar.innerHTML=text[i];
		
		frag([showChar,hideChar],thisChar);
		
		//This character is adding to the list of hidden S.objects
		S.charsHidden++;
		
		//Set the display time here
		showChar.style.animationDelay=totalWait+"s";
		
		//Add the char to the document fragment
		fragment.appendChild(thisChar);
		
		totalWait+=waitTime;
		
		//Add event listeners to each
		//On displaying, do this:
		showChar.addEventListener("animationstart",function(event){
			//If the animation ended on a child, don't continue! (animations are applied to children for text effects)
			if(this!=event.target) return;
			
			//If the element's currently hidden (the animation that ended is for unhiding)
			if(this.style.visibility!=="visible"){		
				S.charsHidden--;
				this.style.visibility="visible";
				
				//If there are no more S.objects to show
				if(S.charsHidden<1){
					if(!wait){
						runMM();
						return;
					}
				}
				
				//Scroll to the newly displayed letter
				if(this.getBoundingClientRect().bottom>this.parentNode.getBoundingClientRect().bottom) this.parentNode.scrollTop+=this.getBoundingClientRect().height;
			}
		});
	}
	
	//Add the chars to the textbox
	S.textboxes[multimediaSettings.textbox].appendChild(fragment);

	/*
	//Add animations that span the whole thing, so they're in sync
	var e=S.textboxes[multimediaSettings.textbox].children;
	l=e.length;
	for(let i=0;i<l;i++){

		if(
			e[i].dataset.animations=="shake"
			|| e[i].dataset.animations=="sing"
		){
			e[i].children[0].classList.add("showpony-kn-char-"+e[i].dataset.animations);
			e[i].children[0].style.animationDelay=
				(e[i].dataset.animations=="sing"
					? "-"+(i/20)+"s"
					: "-"+Math.random()+"s"
			);
		}
	}*/
}

var multimediaFunction={
	'en':()=> S.to({file:"+1"})
	,'go':vals=> runMM(S.lines.indexOf(vals[1])!==-1 ? S.lines.indexOf(vals[1])+1 : null)
	,'in':vals=>{
		var thisButton=m("kn-choice","button");
		thisButton.innerHTML=vals[2];
		
		S.textboxes["main"].appendChild(thisButton);
		
		//On clicking a button, go to the right place
		thisButton.addEventListener("click",function(event){
			event.stopPropagation();
			
			//Progress
			runMM(S.lines.indexOf(vals[1])+1);
			
			waitForInput=false;
		});
		
		waitForInput=true;
		
		runMM();
	}
	//IF	val		==	val		goto
	,'if':vals=>{
		if(operators[vals[2]](vals[1],vals[3])) runMM(S.lines.indexOf(vals[4])+1 || null);
		else runMM();
	}
	//DS	var		=	val
	,'ds':vals=>{
		//If a value's a number, return it as one
		function ifParse(input){
			return isNaN(input) ? input : parseFloat(input);
		}
		
		S.data[vals[1]]=operators[vals[2]](
			ifParse(S.data[vals[1]])
			,ifParse(vals[3])
		);
		
		//Run an event that the user can track for updated user info
		S.window.dispatchEvent(
			new CustomEvent(
				"data"
				,{
					detail:{
						name:vals[1]
						,value:S.data[vals[1]]
					}
				}
			)
		);
		
		//Go to the next line
		runMM();
	}
	//EV	event
	,'ev':vals=>{
		//Dispatch the event the user requested to
		S.window.dispatchEvent(new CustomEvent(vals[1]));
		
		//Go to the next line
		runMM();
	}
	,'wt':vals=>{
		//If there's a waitTimer, clear it out
		clearTimeout(waitTimer);
		
		//If a value was included, wait 
		waitTimer=vals[1] && setTimeout(runMM,parseFloat(vals[1])*1000);
	}
	,'au':vals=>{
		//If the audio doesn't exist
		if(!S.objects[vals[1]]){
			//Add them in!
			var el=S.objects[vals[1]]=document.createElement("audio");
			
			el.src="resources/audio/"+vals[1];
			el.preload=true;
			
			content.appendChild(S.objects[vals[1]]);
		}
		
		//Go through the passed parameters and apply them
		let l=vals.length;
		for(let i=2;i<l;i++){
			switch(vals[i]){
				case "loop":
					S.objects[vals[1]].loop=true;
					break;
				case "play":
				case "pause":
					S.objects[vals[1]][vals[i]]();
					break;
				case "stop":
					S.objects[vals[1]].currentTime=0;
					S.objects[vals[1]].pause();
					break;
			}
		}
		
		//Go to the next line
		runMM();
	}
	,'st':vals=>{
		//Update style of either the object or textbox
		(S.objects[vals[1]] || S.textboxes[vals[1]]).style.cssText+=vals[2];
		
		//Go to the next line
		runMM();
	}
	,'ch':vals=>{
		//Get the folder, which is the name without anything after a hash
		var folder=vals[1].split('#')[0];
		
		//If an object with that name doesn't exist, make it!
		if(!S.objects[vals[1]]) content.appendChild(S.objects[vals[1]]=m("character"));
		
		var cha=S.objects[vals[1]];
		
		//Get the image names
		var imageNames=vals[2].split(",");
		
		//Go through each image and add a div
		for(var i=0, len=imageNames.length;i<len;i++){
			var image="url('resources/characters/"+folder+"/"+imageNames[i]+"')";
			
			//If the image already exists
			var found=false;
			
			//If the layer exists
			if(cha.children[i]){
				//If this value doesn't exist in the layer
				
				var search=cha.children[i].children;
				
				//Set the opacity right, and if it's 1, we found the image!
				for(var ii=0,len=search.length;ii<len;ii++) if(search[ii].style.opacity=(search[ii].style.backgroundImage==image ? 1 : 0)) found=true;
			//If the layer doesn't exist, make it
			}else cha.appendChild(document.createElement("div"));
			
			//If either the layer or the image doesn't exist, we add it!
			if(!found){
				//Add a backgroundImage
				var thisImg=m("character-image");
				thisImg.style.backgroundImage=image;
				
				cha.children[i].appendChild(thisImg);
			}
		}
		
		//If a 4th value exists, adjust 'left' if a character or 'zIndex' if a background
		if(vals[3]) S.objects[vals[1]].style.left=vals[3];
		
		//Go to the next line
		runMM();
	}
	,'bg':vals=>{
		//If the background doesn't exist, make it
		if(!S.objects[vals[1]]) content.appendChild(S.objects[vals[1]]=m("background"));
		
		//If it's a color or gradient, treat it as such
		if(/(#|gradient\(|rgb\(|rgba\()/.test(vals[2])) S.objects[vals[1]].style.backgroundColor=vals[2];
		else S.objects[vals[1]].style.backgroundImage="url('resources/backgrounds/"+vals[2]+"')";
		
		//Go to the next line
		runMM();
	}
	,'tb':(vals,multimediaSettings)=>{
		//Set the current textbox
		multimediaSettings.textbox=vals[1];
		
		//Get the text to display
		multimediaSettings.text=vals[2];
		
		//Turn off automatic waiting for this, we're assuming waiting is off
		multimediaSettings.wait=false;
		multimediaSettings.go=true;
		
		return multimediaSettings;
	}
}

//Check values inline
var operators={
	'+'		:(a,b)=> a+b
	,'-'	:(a,b)=> a-b
	,'='	:(a,b)=> b
	,'=='	:(a,b)=> a==b
	,'<'	:(a,b)=> a<b
	,'>'	:(a,b)=> a>b
	,'<='	:(a,b)=> a<=b
	,'>='	:(a,b)=> a>=b
	,'!'	:(a,b)=> a!=b
};

//Replace unsafe characters for filenames with safe ones, and vice-versa
function safeFilename(string,type){
	var a=["[fs]","[bs]","[gt]","[lt]","[c]","[a]","[q]","[qm]","[b]"];
	var b=["/","\\",">","<",":","*",'"',"?","|"];

	//Swap values if changing TO a filename instead of FROM a filename
	if(type!=='from') [a,b]=[b,a];
	
	for(var i=0,len=a.length;i<len;i++) string=string.replace(a[i],b[i]);
	return string;
}

///////////////////////////////////////
////////////EVENT LISTENERS////////////
///////////////////////////////////////

//If shortcut keys are enabled
if(S.shortcuts){
	//Keyboard presses
	window.addEventListener(
		"keydown"
		,function(event){
			//If shortcuts aren't always enabled, perform checks
			if(S.shortcuts!=='always'){
				//Exit if it isn't fullscreen
				if(S.window!==document.webkitFullscreenElement && S.window!==document.mozFullScreenElement && S.window!==document.fullscreenElement){
					console.log("Not full");
					//If needs to be focused
					if(S.shortcuts!=='fullscreen' && S.window!==document.activeElement) return;
				}
			}
			
			var shortcutKeys={
				32: 	()=>S.input()				//Spacebar
				,37:	()=>S.to({time:"-10"})		//Left arrow
				,39:	()=>S.to({time:"+10"})		//Right arrow
				,36:	()=>S.to({file:"first"})	//Home
				,35:	()=>S.to({file:"last"})		//End
				,177:	()=>S.to({file:"-1"})		//Previous
				,176:	()=>S.to({file:"+1"})		//Next
				,179:	()=>S.menu()				//Play/pause
			};
			
			if(shortcutKeys[event.keyCode]){
				event.preventDefault();
				shortcutKeys[event.keyCode]();
			}
		}
	);
}

//We need to set this as a variable to remove it later on
var windowClick=function(event){
	event.stopPropagation();
	S.menu(event);
};

//On clicking, we open the menu- on the overlay. But we need to be able to disable moving the bar outside the overlay, so we still activate menu here.
window.addEventListener("click",windowClick);

//On mousedown, we prepare to move the cursor (but not over overlay buttons)
overlay.addEventListener("mousedown",function(event){if(event.target===this) scrubbing=event.clientX;});

//If mouse goes up and we aren't scrubbing, set scrubbing to false. Otherwise, right-clicks can be read wrong.
window.addEventListener("mouseup",function(){if(scrubbing!==true) scrubbing=false;});
//On touch end, don't keep moving the bar to the user's touch
overlay.addEventListener("touchend",userScrub);

//On dragging
window.addEventListener("mousemove",moveOverlay);
overlay.addEventListener("touchmove",moveOverlay);

//Menu buttons
menuButton.addEventListener(
	"click"
	,event=>{
		event.stopPropagation();
		S.menu();
	}
);

fullscreenButton.addEventListener(
	"click"
	,event=>{
		event.stopPropagation();
		S.fullscreen();
	}
);

accountButton.addEventListener(
	"click"
	,event=>{
		event.stopPropagation();
		window.open("http://localhost/heybard/index.html");
	}
);

captionsButton.addEventListener(
	"click"
	,event=> event.stopPropagation()
);

content.addEventListener("click",()=> S.input());

//When we finish playing a video or audio file
types.video.addEventListener("ended",mediaEnd);
types.audio.addEventListener("ended",mediaEnd);

//Update title info
if(S.title){
	function updateTitle(){document.title=replaceInfoText(S.title,S.currentFile);}
	
	types.audio.addEventListener("timeupdate",updateTitle);
	types.video.addEventListener("timeupdate",updateTitle);
}

//Update the bookmark
	//Also, before unload (Need to add in)
window.addEventListener("blur",POSTRemote);

///////////////////////////////////////
/////////////////START/////////////////
///////////////////////////////////////

//If the window is statically positioned, set it to relative! (so positions of children work)
if(window.getComputedStyle(S.window).getPropertyValue('position')=="static") S.window.style.position="relative";

//Empty the current window
S.window.innerHTML="";

//And fill it up again!
frag([content,overlay,menuButtons],S.window);

S.window.classList.add("showpony");

//Set tabIndex so it's selectable (if it's not already set)
if(S.window.tabIndex<0) S.window.tabIndex=0;

//If the user's getting the files remotely, make the call
if(S.files==="get") POST(startup,{call:"getFiles"});
else startup();

///////////////////////////////////////
/////////////////ADMIN/////////////////
///////////////////////////////////////

if(S.admin){
	var editorUI=m("editor-ui")
		,uploadFileButton=m("button showpony-upload-file","label")
		,uploadFile=document.createElement("input")
		,uploadDate=m("button showpony-editor-date","input")
		,uploadName=m("button showpony-editor-name","input")
		,deleteFile=m("button showpony-delete-file","button")
		,newFile=m("button showpony-new-file","button")
		,logoutButton=m("button showpony-logout","button")
	;

	uploadName.type=uploadDate.type="text";
	uploadName.placeholder="File Title (optional)";
	uploadDate.placeholder="YYYY-MM-DD HH:MM:SS";

	uploadFile.type="file";
	uploadFile.style.display="none";
	uploadFile.accept=".jpg,.jpeg,.png,.gif,.svg,.mp3,.wav,.mp4,.webm,.txt,.mm,.html";
	
	uploadFileButton.appendChild(uploadFile);
	
	frag([uploadFileButton,uploadDate,uploadName,deleteFile,newFile,logoutButton],editorUI);
	
	S.window.appendChild(editorUI);
	
	//Edit/adjust file details
	S.window.addEventListener(
		"contextmenu"
		,event=>{
			event.preventDefault();
			editor();
		}
	);
	
	function editor(){
		//If logged in, toggle the editor
		if(loggedIn) S.window.classList.toggle("showpony-editor");
		//Otherwise, try to log in
		else account("login");
	}
	
	function updateEditor(){
		//Remove extra values to get these ones
		uploadName.value=getName(S.files[S.currentFile]);
		uploadDate.value=getDate(S.files[S.currentFile]);
	}
	
	logoutButton.addEventListener("click",()=>account("logout"));
	
	//Must be set to a variable to be called outside the enclosing "if" statement
	var account=function(type){
		var pass=null;
		if(type==="login") if(!(pass=prompt("What's your password?"))) return;
		
		POST(
			response=>{
				S.window.classList[loggedIn ? "add" : "remove"]("showpony-editor");
				
				S.to({reload:true,scrollToTop:false,replaceState:true});
			}
			,{call:type,password:pass}
		);
	}
	
	function renameFile(){
		var thisFile=S.currentFile;
		var date=uploadDate.value;
		
		//Test that the date is safe (must match setup)
		if(!(/^\d{4}-\d\d-\d\d(\s\d\d:\d\d:\d\d)?$/.test(date))){
			alert("Date must be formatted as \"YYYY-MM-DD\" or \"YYYY-MM-DD HH-MM-SS\". You passed \""+date+"\"");
			return;
		}
		
		var fileName=(S.files[thisFile][0]==='x') ? 'x': ''
			+date.replace(/:/g,';') //date (replace : with ; so it's Windows safe)
			+" ("+safeFilename(uploadName.value,"to")+")" //name
			+S.files[thisFile].match(/\.\w+$/) //ext
		;
		
		POST(
			response=>{
				S.files[thisFile]=response.file;
				
				//Sort the files by order
				S.files.sort();
				
				S.to({file:S.files.indexOf(response.file),scrollToTop:false,replaceState:true});
				scrub();
			}
			,{call:"renameFile",name:S.files[thisFile],newName:fileName}
		);
	}
	
	//EVENT LISTENERS//
	//On time, update the editor
	S.window.addEventListener("time",updateEditor);
	uploadName.addEventListener("change",renameFile);
	uploadDate.addEventListener("change",renameFile);
	
	uploadFile.addEventListener("change"
		,function(){
			var thisFile=S.currentFile;
			
			POST(
				response=>{
					S.files[thisFile]=response.file;
					
					//If still on that file, refresh it
					S.currentFile===thisFile && S.to({file:thisFile,refresh:true,scrollToTop:false,replaceState:true})
				}
				,{
					call:"uploadFile"
					,name:S.files[thisFile]
					,files:uploadFile.files[0]
				}
			);
		}
	);
	
	deleteFile.addEventListener("click"
		,()=>{
			var thisFile=S.currentFile;
			
			POST(
				function(response){
					//Remove the file from the array
					S.files.splice(thisFile,1);

					//If still on the file we're deleting, reload the file
					if(thisFile===S.currentFile) S.to({file:thisFile,reload:true,replaceState:true})
				}
				,{call:"deleteFile",name:S.files[thisFile]}
			);
		}
	);
	
	newFile.addEventListener("click"
		,()=>POST(
			response=>{
				//Add the file to the array
				S.files.push(response.file);
				S.to({file:"last"});
			}
			,{call:"newFile"}
		)
	);
}

}