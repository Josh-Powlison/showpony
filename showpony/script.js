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
d('credits',null);
d('data',{});
d('defaultDuration',10);
d('title',false);
d('dateFormat',{year:"numeric",month:"numeric",day:"numeric"});
d('admin',false);
d('query','part');
d('shortcuts','focus');
d('user',null);
d('HeyBardID',location.hostname.substring(0,30));
d('bookmark',"file");
d('startPaused',false);
d('preloadNext',true);

var HeyBardConnection;

///////////////////////////////////////
///////////PUBLIC FUNCTIONS////////////
///////////////////////////////////////

//Go to another file
S.to=function(input){
	content.classList.add("showpony-loading");
	
	var obj=input || {};
	
	//Relative file
	if(obj.file && (obj.file[0]==='+' || obj.file[0]==='-')) obj.file=S.currentFile+(parseInt(obj.file.substring(1))*(obj.file[0]==='-' ? -1 : 1));
	
	//Relative time
	if(obj.time && (obj.time[0]==='+' || obj.time[0]==='-')){
		var getTime=0;
		//Add the times of previous videos to get the actual time in the piece
		for(let i=0;i<S.currentFile;i++) getTime+=getLength(S.files[i]);
		
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
		for(let i=0;i<l;i++){
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
	
	var sameFile=S.currentFile===obj.file;
		
		/*
	//Don't continue if the file is the same and not refreshable
	if(obj.file===S.currentFile && !types[getMedium(S.files[S.currentFile])].hasOwnProperty('currentTime')){
		return;
	}*/
	/*
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
	
	//Update info on file load
	if(!obj.popstate){
		console.log("Update info!",scrubbing);
		//Only allow adding to history if we aren't scrubbing
		
		//If the same file, and not a medium where time changes it (like images), replace history state instead
		if(sameFile && currentType!=="video" && currentType!=="audio"){
			console.log("Same!");
			obj.replaceState=true;
		}
		
		var popstate=!obj.replaceState;
		if(scrubbing===true) popstate=false; //Only replace history if we're scrubbing right now
		
		updateInfo(null,popstate);
	}
	
	
	//If we aren't moving the bar, update the overlay
	if(scrubbing===false){
		scrub();
		//Go to the top of the page (if we didn't come here by autoloading)
		if(obj.scrollToTop){
			S.window.scrollIntoView();
		}
	}
	
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
	//Multmedia Engine/Text/Copy
	if(currentType==='multimedia' || currentType==='text'){
		fetch(src,{credentials:'include'})
			.then(response=>{
				return response.text();
			})
			.then(text=>{
				if(currentType==='multimedia'){
					//Get each line (taking into account and ignoring extra lines)
					S.lines=text.match(/[^\r\n]+/g);
					runMM(0);
				//Regular text
				}else content.innerHTML=text;
				
				content.classList.remove("showpony-loading");
			})
			.catch((error)=>{
				content.classList.remove("showpony-loading");
				alert(error);
			})
			//After all that, try preloading the next file
			.then(()=>{
				//If we can't preload or are on the last file, don't preload!
				if(!S.preloadNext || S.currentFile>=S.files.length-1) return;
				
				//How we get the file depends on whether or not it's private
				var src=(S.files[S.currentFile+1][0]=="x" ? "showpony/ajax.php?get=" : "")+S.path+S.language+S.files[S.currentFile];
				
				//Preload next file, if there is a next file
				console.log("Preloading next!");
				fetch(src);
			})
		;
	//Image/Audio/Video
	}else{
		//Adjust the source
		thisType.src=src;
		if(currentType==='video' || currentType==='audio') !overlay.classList.contains("showpony-overlay-show") && thisType.play();
	}
	
	thisType.currentTime=obj.time; //Update the time
	
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
	//We can cancel moving the bar outside of the overlay, but we can't do anything else.
	//Exit if we're not targeting the overlay.
	if(event && event.target!==overlay) return;
	
	else //If we aren't moving the bar
	{
		//On toggling classes, returns "true" if just added
		if(overlay.classList.toggle("showpony-overlay-show")){
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
				overlay.classList.contains("showpony-overlay-show") ? true
				: false
			)
		}})
	);
};

function userScrub(event){
	var touch=event.changedTouches ? true : false;
	var pos=touch ? event.changedTouches[0].clientX : event.clientX;
	
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
	if(currentType==='image') S.to({file:"+1"});
	else if(currentType==='audio' || currentType==='video') S.menu();
	else if(currentType==='multimedia'){
		//If the player is making choices right now
		if(waitForInput) return;
	
		//If a wait timer was going, stop it.
		clearTimeout(waitTimer);
	
		console.log(S.charsHidden);
	
		//If all letters are displayed
		if(S.charsHidden<1) runMM();
		else //If some S.objects have yet to be displayed
		{
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
	}
}

//Close ShowPony
S.close=function(){
	//Remove the window event listener
	window.removeEventListener("click",windowClick);
	
	//Reset the window to what it was before
	S.window.replaceWith(S.originalWindow);
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
	,overlayText=m("overlay-text")
	,progress=m("progress")
	,content=m("content")
	//Buttons
	,fullscreenButton=m("button showpony-fullscreen-button","button")
	,captionsButton=m("captions-button","button")
	,showponyLogo=m("logo","a")
	,credits=m("credits","small")
	,overlay=m("overlay","div")
	,types={
		image:m("block","img")
		,audio:m("block","audio")
		,video:m("block","video")
		,multimedia:m("multimedia")
		,text:m("text")
	}
	,continueNotice=m("continue")
;

if(S.startPaused) overlay.classList.add("showpony-overlay-show");

content.className="showpony-content";

fullscreenButton.alt="Fullscreen";
fullscreenButton.title="Fullscreen Toggle";
captionsButton.alt="Closed Captions/Subtitles";
continueNotice.innerHTML="...";

showponyLogo.href="https://showpony.heybard.com/";
showponyLogo.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g stroke-linecap="round" stroke-linejoin="round" transform="translate(0 -197)"><path fill="none" stroke-width="9.5" d="M32.5 245.5v-40.1s-21.9-2.2-21.9 40m56.9.1v-40.1s21.9-2.2 21.9 40"/><circle cx="77.4" cy="275.5" r="9.4" fill="none" stroke-width="7.7"/><circle cx="22.6" cy="275.5" r="9.4" fill="none" stroke-width="7.7"/><path stroke-width=".3" d="M50.1 266.7c-2.4 3-19.1 0-11 8 6.1 5.8 29 2.5 15.2-17-16.4.6-44.4-12.6-15.3-25.7 39.2-17.7 42.5 44.5 23.6 55.6-44.7 26.3-53.5-49-12.5-20.9z"/></g></svg>';
showponyLogo.target="_blank";

if(S.credits) useIcons(S.credits);

frag([progress,overlayText,fullscreenButton,showponyLogo,credits],overlay);

///////////////////////////////////////
///////////PRIVATE FUNCTIONS///////////
///////////////////////////////////////

function getCurrentTime(){
	//Use the currentTime of the object, if it has one
	var newTime=types[currentType] && types[currentType].currentTime || 0;
	
	//Add the times of previous videos to get the actual time in the piece
	for(let i=0;i<S.currentFile;i++) newTime+=getLength(S.files[i]);
	
	return newTime;
}

//Update the scrubber's position
function scrub(inputPercent){
	var duration=S.files.map(function(e){return getLength(e);}).reduce((a,b) => a+b,0);
	
	//If no inputPercent was passed, estimate it
	if(typeof(inputPercent)==='undefined'){
		//Use the currentTime of the object, if it has one
		var newTime=getCurrentTime();
		
		var inputPercent=newTime / duration
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
		for(let i=0;i<l;i++){
			//If the duration's within this one, stop at this one
			if(i==l-1 || newTime<getLength(S.files[i])){
			//If this is the media!
				//If we allow scrubbing or we're not moving the bar, we can load the file
				if(S.scrubLoad!==false || scrubbing===false) S.to({file:i,time:newTime,scrollToTop:false});
				
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
		if(Math.abs(scrubbing-pos)>screen.width/(touch ? 20 : 100)){ 
			scrubbing=true;
			
			//On starting to scrub, we save a bookmark of where we were- kinda weird, but this allows us to return later.
			if(S.scrubLoad){
				console.log("Release!");
				//Add a new state on releasing
				updateInfo(null,true);
			}
		}
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
		
		//Add the times of previous videos to get the actual time in the piece
		for(let i=0;i<S.currentFile;i++) currentTime+=getLength(S.files[i]);
		
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
		
		//Return the value
		return String(values[type][value]).padStart(
			/\d+/.exec(input) || 0
			,'0'
		);
	}
	
	return value.replace(/\[[^\]]+\]/g,infoNaming);
}

//Use icons (social media, etc)
function useIcons(input){
	
	var images=input.match(/[^><\s]+(\.logo)/ig);
	
	//If no images, return
	if(!images){
		credits.innerHTML=input;
		return;
	}
	
	credits.classList.add("showpony-loading");
	
	//Create promises for fetching the images
	var promises=[];
	
	for(let i=0;i<images.length;i++){
		var url="https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/"+images[i].toLowerCase().replace(".logo",".svg");
		
		promises[i]=fetch(url)
			.then(response=>{
				//On success
				if(response.status>=200 && response.status<300) return response.text();
				//On failure (404)
				else throw Error("Couldn't retrieve file! "+response.status);
			})
			.then(svg=>{
				input=input.replace(images[i],svg);
			})
			.catch(response=>{
				input=input.replace(images[i],images[i].replace(".logo",""));
			})
		;
	}
	
	//Once all SVGs are retrieved, continue
	Promise.all(promises).then(response=>{
		credits.classList.remove("showpony-loading");
		credits.innerHTML=input;
	});
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

//Make a POST call
function POST(obj){
	//Prepare the form data
	var formData=new FormData();
	formData.append('call',obj.call);
	formData.append('path',S.path+S.language);
	
	//Special values, if passed
	obj.password && formData.append('password',obj.password);
	obj.name && formData.append('name',obj.name);
	obj.newName && formData.append('newName',obj.newName);
	obj.files && formData.append('files',obj.files);
	
	return new Promise(function(resolve,reject){
		
		//Make the call
		fetch("showpony/ajax.php",{method:'post',body:formData,credentials:'include'})
		.then(response=>{
			return response.json();
		})
		//Work with the json
		.then(json=>{
			if(json.success){
				loggedIn=json.admin;
				if(json.files) S.files=json.files;
				
				resolve(json);
			}else reject(json.message);
		})
		.catch(response=>{
			alert(response);
		});
	});
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
	
	for(let i=0, len=inputArray.length;i<len;i++) fragment.appendChild(inputArray[i]);
	
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
	if(!overlay.classList.contains("showpony-overlay-show")) S.to({file:"+1"});
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
		for(let i=0, len=imageNames.length;i<len;i++){
			var image="url('resources/characters/"+folder+"/"+imageNames[i]+"')";
			
			//If the image already exists
			var found=false;
			
			//If the layer exists
			if(cha.children[i]){
				//If this value doesn't exist in the layer
				
				var search=cha.children[i].children;
				
				//Set the opacity right, and if it's 1, we found the image!
				for(let ii=0,len=search.length;ii<len;ii++) if(search[ii].style.opacity=(search[ii].style.backgroundImage==image ? 1 : 0)) found=true;
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
	
	for(let i=0,len=a.length;i<len;i++) string=string.replace(a[i],b[i]);
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
//This needs to be click- otherwise, you could click outside of Showpony, release inside, and the menu would toggle. This results in messy scenarios when you're using the UI.
var windowClick=function(event){
	//If we just ended scrubbing, don't toggle the menu at all
	if(scrubbing==="out"){
		scrubbing=false;
		return;
	}
	
	event.stopPropagation();
	S.menu(event);
};

//On clicking, we open the menu- on the overlay. But we need to be able to disable moving the bar outside the overlay, so we still activate menu here.
window.addEventListener("click",windowClick);

window.addEventListener("mouseup",function(event){
	//If we're not scrubbing, set scrubbing to false and return
	if(scrubbing!==true){
		scrubbing=false;
		return;
	}
	
	//Scrub the bar
	userScrub(event);
	
	scrubbing="out";
});

//On mousedown, we prepare to move the cursor (but not over overlay buttons)
overlay.addEventListener("mousedown",function(event){if(event.target===this) scrubbing=event.clientX;});

//On touch end, don't keep moving the bar to the user's touch
overlay.addEventListener("touchend",userScrub);

//On dragging
window.addEventListener("mousemove",moveOverlay);
overlay.addEventListener("touchmove",moveOverlay);

//Menu buttons
fullscreenButton.addEventListener(
	"click"
	,event=>{
		S.fullscreen();
	}
);

captionsButton.addEventListener(
	"click"
	,event=> event.stopPropagation()
);

content.addEventListener("click",()=>{S.input();});

//On loading resources, don't show loading
types.image.addEventListener("load",function(){
	content.classList.remove("showpony-loading");
	
	if(!S.preloadNext) return;
	
	//Preload next file, if there is a next file
	if(S.currentFile!==S.files.length-1){
		var src=(S.files[S.currentFile+1][0]=="x" ? "showpony/ajax.php?get=" : "")+S.path+S.language+S.files[S.currentFile+1];
		
		console.log("Preloading");
		
		var img=new Image();
		img.src=src;
	}
});
types.video.addEventListener("canplay",function(){content.classList.remove("showpony-loading");});
types.audio.addEventListener("canplay",function(){content.classList.remove("showpony-loading");});

//Preload next file, if there is a next file
/*types.video.addEventListener("canplay",function(){content.classList.remove("showpony-loading");});
types.audio.addEventListener("canplay",function(){content.classList.remove("showpony-loading");});*/

//When we finish playing a video or audio file
types.video.addEventListener("ended",mediaEnd);
types.audio.addEventListener("ended",mediaEnd);

//On moving through time, update info and title
types.audio.addEventListener("timeupdate",updateInfo);
types.video.addEventListener("timeupdate",updateInfo);

function updateInfo(event,pushState){
	//Update the title, if set up for it
	if(S.title) document.title=replaceInfoText(S.title,S.currentFile);
	
	//Update the scrub bar
	if(scrubbing!==true) scrub();
	
	//If using queries with time, adjust query on time update
	if(S.query){
		var newURL=document.location.href
			,newQuery=""
		;
		
		//Choose whether to add an ampersand or ?
		//Choose a ? if one doesn't exist or it exists behind the query
		newQuery=(newURL.indexOf("?")===-1 || new RegExp("\\?(?="+S.query+"=)").test(newURL)) ? "?" : "&";
		
		newQuery+=S.query+"="+(
			S.bookmark==="time"
			? (Math.floor(getCurrentTime()))	//Time
			: (S.currentFile+1)					//File
		);
		
		//Replace either the case or the end
		newURL=newURL.replace(new RegExp("(((\\?|&)"+S.query+")=?[^&]+)|$"),newQuery);
		
		history[pushState ? "pushState" : "replaceState"]({},"",newURL);
	}
}

///////////////////////////////////////
/////////////////START/////////////////
///////////////////////////////////////

//If the window is statically positioned, set it to relative! (so positions of children work)
if(window.getComputedStyle(S.window).getPropertyValue('position')=="static") S.window.style.position="relative";

S.window.classList.add("showpony");

//Set tabIndex so it's selectable (if it's not already set)
if(S.window.tabIndex<0) S.window.tabIndex=0;

//If the user's getting the files remotely, make the call
new Promise(function(resolve,reject){
	content.classList.add("showpony-loading");
	
	//currentFile is -1 before we load
	S.currentFile=-1;
	
	//If getting, run a promise to check success
	if(S.files==="get"){
		console.log("Return stuff!");
		POST({call:"getFiles"})
			.then(response=>resolve(response))
			.catch(response=>reject(response));
	}else{
		//Skip to catch if not true
		resolve();
	}
	
	//Empty the current window
	S.window.innerHTML="";

	//And fill it up again!
	frag([content,overlay],S.window);
})
//Get Hey Bard account
.then(()=>new Promise(function(resolve,reject){
	//If Hey Bard is disabled, skip over this!
	if(S.HeyBardID===null){
		console.log("Hey Bard accounts aren't enabled for this Showpony.");
		resolve();
		return;
	}else{
	//If Hey Bard is enabled
		//Make a button
		var accountButton=m("button showpony-account-button","button");
		overlay.appendChild(accountButton);
		
		accountButton.addEventListener(
			"click"
			,event=>{
				event.stopPropagation();
				
				//Try saving a bookmark before you leave
				if(typeof(S.saveBookmark)==='function'){
					console.log("hey!");
					var sB=S.saveBookmark();
					
					//If something was returned (like a promise)
					if(sB){
						console.log(sB);
						sB.then(()=>{
							console.log("Success saving!");
							
							//Go to Hey Bard's web page to get your account
							location.href=HeyBardConnection.makeLink({url:location.href,query:S.query});
						})
						//If it fails, let the user know
						.catch((response)=>alert(response))
						;
					//Regardless of whether or not we got something back, go there
					}else{
						location.href=HeyBardConnection.makeLink({url:location.href,query:S.query});
					}
				//If we can't save a bookmark (the user's probably not logged in)
				}else{
					//Just use the link
					location.href=HeyBardConnection.makeLink({url:location.href,query:S.query});
				}
				
				
			}
		);
		accountButton.alt="Hey Bard! Account";
		
		if(typeof HeyBard==='function'){
			//Make a Hey Bard connection
			HeyBardConnection=new HeyBard(S.HeyBardID);
			
			console.log(HeyBardConnection);
			
			HeyBardConnection.getAccount()
			.then(response=>{
				console.log("Success!",response);
				
				//If an account exists for the user
				if(response.account!==null){
					//Set the text for the Hey Bard button accordingly
					accountButton.title="Hello, "+response.account+"! We'll save your bookmarks for you!";
					accountButton.innerHTML=response.account;
					
					//Set a function to save bookmarks
					S.saveBookmark=function(){
						//Pass either the time or the current file, whichever is chosen by the client
						return HeyBardConnection.saveBookmark(S.bookmark==="time" ? Math.floor(getCurrentTime()) : S.currentFile);
					}
					
					var saveBookmark=S.saveBookmark;
					
					//Save user bookmarks when leaving the page
					window.addEventListener("blur",saveBookmark);
					window.addEventListener("beforeunload",saveBookmark);
					
					//Showpony deselection (to help with Firefox and Edge's lack of support for "beforeunload")
					S.window.addEventListener("focusout",saveBookmark);
					S.window.addEventListener("blur",saveBookmark);
					console.log("Update!");
				}else{
				//If an account doesn't exist for the user
					accountButton.innerHTML="Log in for bookmarks!";
					//Set the text for the Hey Bard button accordingly
					accountButton.title="Save a bookmark with a free Hey Bard! Account";
				}
				
				console.log(HeyBardConnection);
				
				//"False" can be read as 0, so if bookmark is returned as false don't pass the value.
				if(response.bookmark===false) resolve();
				else resolve(response.bookmark);
			})
			.catch(response=>{
				accountButton.innerHTML="HEY BARD FAILED";
				//Set the text for the Hey Bard button accordingly
				accountButton.title="Failed to call Hey Bard's servers. Please try again later!";
				
				resolve();
			})
			;
		}else{
			accountButton.innerHTML="SCRIPT MISSING";
			//Set the text for the Hey Bard button accordingly
			accountButton.title="Failed to load the necessary script to use Hey Bard accounts.";
			
			console.log("Script for enabling HeyBard isn't loaded.");
			resolve();
		}
	}
}))
//Get bookmarks going
.then((start)=>{
	//Start at the first legit number: start, input.start, or the last file
	S.start=(
		!isNaN(start)
		? start
		: !isNaN(input.start)
		? parseInt(input.start)
		: S.files.length-1
	);
	
	//If querystrings are in use, consider the querystring in the URL
	if(S.query){
		window.addEventListener(
			"popstate"
			,function(){
				var page=(new RegExp(S.query+'[^&]+','i').exec(window.location.href));
				
				//If we found a page
				if(page){
					if(S.bookmark==="time"){
						page=parseInt(page[0].split("=")[1]);
						
						console.log(S,page,getCurrentTime());
						if(page===getCurrentTime()) return;
					
						S.to({time:page,popstate:true,scrollToTop:false});
					}else{
						page=parseInt(page[0].split("=")[1])-1;
						
						console.log(S,page,S.currentFile);
						if(page===S.currentFile) return;
					
						S.to({file:page,popstate:true,scrollToTop:false});
					}
				}
			}
		);
		
		var page=window.location.href.match(new RegExp(S.query+'[^&]+','i'));
		if(page) page=parseInt(page[0].split("=")[1]);
		
		//General pass object
		var passObj={
			popstate:page ? true : false
			,replaceState:page ? false : true //We replace the current state in some instances (like on initial page load) rather than adding a new one
			,scrollToTop:false
		};
		
		if(S.bookmark==="time") passObj.time=(page!==null) ? page : S.start;
		else passObj.file=(page!==null) ? page-1 : S.start;
		
		S.to(passObj);
	//Start
	}else{
		//Use time or file to bookmark, whichever is requested
		if(S.bookmark==="time") S.to({time:S.start,scrollToTop:false});
		else S.to({file:S.start,scrollToTop:false});
	}
	
	//Set input to null in hopes that garbage collection will come pick it up
	input=null;
	
	//We don't remove the loading class here, because that should be taken care of when the file loads, not when Showpony finishes loading
	
	//if(scrubbing===false) updateInfo();
})
//On failure (or not getting)
.catch((response)=>{
	alert("Failed to sucessfully load the Showpony object! "+response);
})

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
		
		POST({call:type,password:pass})
		.then(response=>{
			S.window.classList[loggedIn ? "add" : "remove"]("showpony-editor");
				
			S.to({reload:true,scrollToTop:false,replaceState:true});
		})
		.catch(response=>{
			alert(response);
		});
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
		
		POST({call:"renameFile",name:S.files[thisFile],newName:fileName})
		.then(response=>{
			S.files[thisFile]=response.file;
			
			//Sort the files by order
			S.files.sort();
			
			S.to({file:S.files.indexOf(response.file),scrollToTop:false,replaceState:true});
			scrub();
		});
	}
	
	//EVENT LISTENERS//
	//On time, update the editor
	S.window.addEventListener("time",updateEditor);
	uploadName.addEventListener("change",renameFile);
	uploadDate.addEventListener("change",renameFile);
	
	uploadFile.addEventListener("change"
		,function(){
			var thisFile=S.currentFile;
			
			POST({
				call:"uploadFile"
				,name:S.files[thisFile]
				,files:uploadFile.files[0]
			})
			.then(response=>{
				S.files[thisFile]=response.file;
				
				//If still on that file, refresh it
				S.currentFile===thisFile && S.to({file:thisFile,refresh:true,scrollToTop:false,replaceState:true})
			});
		}
	);
	
	deleteFile.addEventListener("click"
		,()=>{
			var thisFile=S.currentFile;
			
			POST({call:"deleteFile",name:S.files[thisFile]})
			.then(response=>{
				//Remove the file from the array
				S.files.splice(thisFile,1);

				//If still on the file we're deleting, reload the file
				if(thisFile===S.currentFile) S.to({file:thisFile,reload:true,replaceState:true})
			});
		}
	);
	
	newFile.addEventListener("click"
		,function(){
			POST({call:"newFile"})
			.then(response=>{
				//Add the file to the array
				S.files.push(response.file);
				S.to({file:"last"});
			})
			.catch(
				
			);
		}
	);
}

}