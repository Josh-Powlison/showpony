function Showpony(input){

"use strict";

//Startup errors
if(!input.window) throw "Error: no window value passed to Showpony object. I recommend passing a <div> element to the window value.";

///////////////////////////////////////
///////////PUBLIC VARIABLES////////////
///////////////////////////////////////

//Engine settings
const S=this;
S.window			=input.window;
S.originalWindow	=input.window.cloneNode(true);
S.files				=input.files			|| "get";
S.path				=input.path				|| "";
S.loadingClass		=input.loadingClass		|| null;
S.scrubLoad			=input.scrubLoad		|| false;
S.info				=input.info				|| "[0pc] | [0pl]";
S.data				=input.data				|| {};
S.defaultDuration	=input.defaultDuration	|| 10;
S.title				=input.title			|| false;
S.dateFormat		=input.dateFormat		|| {year:"numeric",month:"numeric",day:"numeric"};
S.admin				=input.admin			|| false;
S.query				=input.query !==undefined ? input.query : "file";
S.shortcuts			=input.shortcuts !==undefined ? input.shortcuts : "focus";

///////////////////////////////////////
///////////PUBLIC FUNCTIONS////////////
///////////////////////////////////////

//Go to another file
S.to=function(input){
	//console.log(input);
	
	var obj=input || {};
	
	//Relative file
	if(obj.file && (obj.file[0]==='+' || obj.file[0]==='-')){
		obj.file=S.currentFile+(parseInt(obj.file.substring(1))*(obj.file[0]==='-' ? -1 : 1))
	}
	
	//Relative time
	if(obj.time && (obj.time[0]==='+' || obj.time[0]==='-')){
		var getTime=0;
		//Add the times of previous videos to get the actual time in the piece
		for(var i=0;i<S.currentFile;i++){
			getTime+=getLength(S.files[i]);
		}
		
		getTime+=types[currentType] && types[currentType].currentTime || 0;
		
		//console.log(getTime);
		
		obj.time=getTime+(parseFloat(obj.time.substring(1))*(obj.time[0]==='-' ? -1 : 1));
		
		//console.log(obj.time);
		
		//Don't go below 0
		if(obj.time<0) obj.time=0;
	}
	
	//If a time is passed but no file, get file and time based on the place in the total
	if(obj.time!==undefined && obj.file===undefined){
		obj.file=0;
		
		//Relative time
		/*if(obj.time[0]==='+') obj.time=
		if(obj.time[0]==='-') obj.time=*/
		
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
		
		//console.log(obj.time,obj.file);
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
	
	//console.log(obj.file,S.currentFile,thisType,obj.time);
	
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
			
			//console.log("Ended!");
			return;
		}
	}
	
	if(S.currentFile<0) S.currentFile=0;
	
	//If we're using queries
	if(S.query && !obj.popstate){
		var search=new RegExp('(\\?|&)'+S.query+'=','i')
			,newURL=document.location.href;
		
		if(search.test(newURL)){
			var replace=new RegExp('((\\?|&)'+S.query+')=?[^&]+','i');
			newURL=newURL.replace(replace,'$1='+(S.currentFile+1));
		}else{
			newURL+=(newURL.indexOf("?")>-1 ? '&' : '?') +(S.query+'='+(S.currentFile+1));
		}
		
		//console.log(newURL);
		
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
	if(currentType!=newType){
		content.innerHTML="";
		//console.log(types);
		content.appendChild(thisType);
	}
	
	var src=(
		S.files[S.currentFile][0]=="x"
		? "showpony/showpony.php?showpony-get="+S.path+S.files[S.currentFile]
		: S.path+S.files[S.currentFile]
	);
	
	//Refresh the file, if requested we do so
	if(obj.refresh){
		src+=(
			S.files[S.currentFile][0]=="x"
				? "&refresh-"+Date.now()
				: '?refresh-'+Date.now()
		);
	}
	
	//Display the medium based on the file extension
	switch(newType){
		case "image":
			thisType.src=src;
			break;
		case "video":
			thisType.src=src;
			
			//console.log(thisType.src);
			
			!overlay.classList.contains("showpony-overlay-visible") && thisType.play();
			
			//When the player's finished with a file
			thisType.addEventListener(
				"ended"
				,function(){
					//If we're scrubbing the media, don't check for ended (this can trigger and interrupt our media scrubbing)
					if(overlay.classList.contains("showpony-overlay-visible")) return;
					
					S.to({file:"+1"});
				}
			);
			break;
		case "audio":
			//Adjust the source
			thisType.src=src;
			
			!overlay.classList.contains("showpony-overlay-visible") && thisType.play();
			
			//When the player's finished with a file
			thisType.addEventListener(
				"ended"
				,function(){
					//If we're scrubbing the media, don't check for ended (this can trigger and interrupt our media scrubbing)
					if(overlay.classList.contains("showpony-overlay-visible")) return;
					
					S.to({file:"+1"});
				}
			);
			break;
		//Visual Novels/Kinetic Novels/Interactive Fiction
		case "multimedia":
			//console.log(currentType);
		
			//If the previous type was different, use the new type (or if we're scrubbing and not moving along as normal)
			//if(currentType!=newType || overlay.style.visibility=="visible"){
				content.innerHTML="";
				S.objects={};
				S.textboxes={};
			//}
			
			GET(
				src
				,function(ajax){
					//Get each line (taking into account and ignoring extra lines)
					S.lines=ajax.responseText.match(/[^\r\n]+/g);
					
					runMM(0);
				}
			);
			break;
		case "text":
			GET(src,function(ajax){content.innerHTML=ajax.responseText;});
			break;
		default:
			alert("Extension not recognized or supported!");
			break;
	}
	
	//Update the time
	thisType.currentTime=obj.time;
	
	//Track the file type used here for when we next switch
	currentType=getMedium(S.files[S.currentFile]);
	
	//Update the title if it's set
	if(S.title) document.title=replaceInfoText(S.title,S.currentFile);
	
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
	//If we're moving the bar right now, ignore clicking but do set scrubbing to false
	
	if(scrubbing===true){
		scrubbing=false;
	
		//If we don't preload while scrubbing, load the file now that we've stopped scrubbing
		if(S.scrubLoad==false){
			//Load the file our cursor's on
			scrub(
				(event.clientX-S.window.getBoundingClientRect().left)
				/
				(S.window.getBoundingClientRect().width)
			);
		}
		
		return;
	}
	
	//We can cancel moving the bar outside of the overlay, but we can't do anything else.
	//Exit if we're not targeting the overlay.
	if(event && event.target!==overlay) return;
	
	else //If we aren't moving the bar
	{
		menuButton.classList.toggle("showpony-button-preview");
		fullscreenButton.classList.toggle("showpony-button-preview");
		
		//On toggling classes, returns "true" if just added
		if(overlay.classList.toggle("showpony-overlay-visible")){
			scrub();
			
			//Play/pause video or audio
			types[currentType].play && types[currentType].pause();
		}else{
			types[currentType].play && types[currentType].play();
		}
	}
	
	scrubbing=false;
	
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

//Toggle fullscreen
S.fullscreen=function(type){
	//Get fullscreen type
	var fs=S.window.requestFullscreen //Normal
			? [
				"fullscreenElement"
				,"exitFullscreen"
				,"requestFullscreen"
			]
		: S.window.webkitRequestFullscreen //Webkit
			? [
				"webkitFullscreenElement"
				,"webkitExitFullscreen"
				,"webkitRequestFullscreen"
			]
		: //FF
			[
				"mozFullScreenElement"
				,"mozCancelFullScreen"
				,"mozRequestFullScreen"
			]
	;
	
	//Use the 3 fullscreen values above to use fullscreen mode on various browsers.
	document[fs[0]]
		? document[fs[1]]()
		: S.window[fs[2]]()
	;
	
	return;
}

//When the viewer inputs to Showpony (click, space, general action)
S.input=function(){
	//console.log(currentType);
	
	//Function differently depending on medium
	switch(currentType){
		case "image":
			S.to({file:"+1"});
			break;
		case "audio":
		case "video":
			S.menu();
			break;
		case "multimedia":
			//If the player is making choices right now
			if(waitForInput) return;
		
			//If a wait timer was going, stop it.
			clearTimeout(waitTimer);
		
			//console.log(S.charsHidden);
		
			//If all letters are displayed
			if(S.charsHidden<1){
				runMM();
			}
			else //If some S.objects have yet to be displayed
			{
				//console.log(S.textboxes);
				
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
	//Replace the container with the original element
	
	//console.log(windowClick);
	
	//Remove the window event listener
	window.removeEventListener("click",windowClick);
	
	//Reset the window to what it was before
	S.window.parentNode.replaceChild(S.originalWindow,S.window);
	
	//Remove this object
	S=null;
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
	,menuButton=m("menu-button showpony-button-preview","button")
	,fullscreenButton=m("fullscreen-button showpony-button-preview","button")
	,captionsButton=m("captions-button","button")
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
captionsButton.alt="Closed Captions/Subtitles";
continueNotice.innerHTML="...";

frag([progress,overlayText],overlay);

///////////////////////////////////////
///////////PRIVATE FUNCTIONS///////////
///////////////////////////////////////

function startup(){
	//currentFile is -1 before we load
	S.currentFile=-1;
	
	//Find where to start from
	S.start=!isNaN(input.start) ? input.start : S.files.length-1;
	
	//If querystrings are in use, consider the querystring in the URL
	if(S.query){
		window.addEventListener(
			"popstate"
			,function(){
				var page=window.location.href.match(new RegExp(S.query+'[^&]+','i'));
				
				if(page){
					S.to({file:parseInt(page[0].split("=")[1])-1,popstate:true,scrollToTop:false});
				}
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
	}else{
		//Start
		S.to({file:S.start,scrollToTop:false});
	}
	
	//Set input to null in hopes that garbage collection will come pick it up
	input=null;
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
			}else{
				//Otherwise, go to the next one (and subtract the duration from the total duration)
				newTime-=getLength(S.files[i]);
			}
		}
	}
	
	//Move the progress bar
	progress.style.left=(inputPercent*100)+"%";
	////console.log(current,inputPercent,duration,newPart);
	
	//Set the overlay text (the current time)
	overlayText.innerHTML="<p>"+replaceInfoText(
		S.info
		,newPart
		,Math.floor(newTime)
		,duration-Math.floor(newTime)
	)+"</p>";
}

function replaceInfoText(value,fileNum,current,left){
	var floorValue=1;
	var duration=S.files.map(function(e){return getLength(e);}).reduce((a,b) => a+b,0);
	
	if(fileNum===undefined) fileNum=S.currentFile;
	
	//console.log(current,left,types[currentType]);
	
	if(current===undefined){
		//var currentType=getMedium(S.files[S.currentFile]);
		
		//Use the currentTime of the object, if it has one
		var currentTime=types[currentType] && types[currentType].currentTime || 0;
		
		//var currentTime=0;
		
		//console.log(currentTime);
		
		//Look through the videos for the right one
		var l=S.currentFile;
		for(var i=0;i<l;i++){
			//Add the times of previous videos 7to get the actual time in the piece
			currentTime+=getLength(S.files[i]);
		}
		
		var inputPercent=currentTime / duration
			,newPart=S.currentFile;
			
		var current=Math.floor(inputPercent*duration)
			,left=duration-Math.floor(inputPercent*duration)
		;
	}
	
	//Use special naming convention to replace values correctly
	function infoNaming(input){
		//Name
		if(input[1]=="n"){
			//Get the name, remove the parentheses
			var name=S.files[fileNum].match(/\(.*\)/);
			
			//If there's a name, return it; otherwise, return blank space
			if(name){
				//Get rid of the parentheses, but also replace safemark characters
				return safeFilename(
					name[0].replace(/(^\(|\)$)/g,'')
					,"from"
				);
			}else{
				return "";
			}
		}else if(input[1]=="d"){
			//Get the name, remove the parentheses (skip over "x")
			var date=S.files[fileNum].match(/\d[^(]+(?!\()\S?/);
			
			//If there's a date, return it; otherwise, return blank space
			if(date){
				date=date[0]
					.split(/[\s-:;]+/)
				;
				
				date=new Date(Date.UTC(
					date[0]			//Year
					,date[1]-1 || 0	//Month
					,date[2] || 0	//Date
					,date[3] || 0	//Hours
					,date[4] || 0	//Minutes
					,date[5] || 0	//Seconds
					,date[6] || 0	//Milliseconds
				));
				
				return new Intl.DateTimeFormat(
					"default"
					,S.dateFormat
				).format(date);
			}else{
				return "";
			}
			
			
		}
		//Percentage complete
		if(input[2]=="%"){
			//Pass a calculation based on whether it's the percentage left or the current percentage (the total is, of course, 100)
			floorValue=
				input[3]=="l" ? ((1-inputPercent)*100)
				: (inputPercent*100)
			;
		}else
		//File numbers
		if(input[2]=="p"){
			//Pass a calculation based on whether the number of files left, total, or the number of the current file was asked for
			floorValue=
				input[3]=="l" ? S.files.length-(fileNum+1)
				: input[3]=="t" ? S.files.length
				: fileNum+1
			;
		}
		else //Times
		{
			//Total times
			if(input[3]=="t"){
				//Pass a calculation based on whether hours, minutes, or seconds were asked for
				floorValue=
					input[2]=="h" ? duration / 3600
					: input[2]=="m" ? (duration % 3600) / 60
					: duration % 60
				;
			}else{ //Current time or time left
				var val=
					input[3]=="l"
					? left
					: current
				;
				
				//Pass a calculation based on whether hours, minutes, or seconds were asked for
				floorValue=
					input[2]=="h" ? val / 3600
					: input[2]=="m" ? (val % 3600) / 60
					: val % 60
				;
			}
		}
		
		//Return the value
		return padStart(String(
			Math.floor(floorValue)
		),input[1]);
	}
	
	return value.replace(/\[[^\]]*\]/g,infoNaming);
}

//Pad the beginning of a value with leading zeroes
function padStart(input,length){
	//Return if length is 0
	if(!length || length==0) return input;
	
	var padded=('000000000'+String(input)).slice(-length);
	
	//Return either the input or the padded value, whichever is longer
	return input.length>padded.length ? input : padded;
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
					if(S.loadingClass){
						content.classList.remove(S.loadingClass);
					}
				}else{
					alert("Failed to load file called: "+S.path+S.files[S.currentFile]);
				}
			}
		}
	);
}

//Make a POST call
function POST(onSuccess,obj){
	//Prepare the form data
	var formData=new FormData();
	formData.append('showpony-call',obj.call);
	formData.append('path',S.path);
	
	//Special values, if passed
	obj.password && formData.append('password',obj.password);
	obj.name && formData.append('name',obj.name);
	obj.newName && formData.append('newName',obj.newName);
	obj.files && formData.append('files',obj.files);
	
	var ajax=new XMLHttpRequest();
	ajax.open("POST","showpony/showpony.php");
	ajax.send(formData);
	
	ajax.addEventListener(
		"readystatechange"
		,function(){
			if(ajax.readyState==4){
				if(ajax.status==200){
					var response=JSON.parse(ajax.responseText);
					//console.log(response);
					
					if(response.success){
						onSuccess(response);
					}else{
						alert(response.message);
					}
				}else{
					alert("Failed to load Showpony class file.");
				}
			}
		}
	);
}

//Get the medium of a file
function getMedium(name){
	//Get the extension
	switch(name.match(/\.[^.]+$/)[0]){
		case ".jpg":
		case ".jpeg":
		case ".png":
		case ".gif":
		case ".svg":
			return "image";
			break;
		case ".mp4":
		case ".webm":
			return "video";
			break;
		case ".mp3":
		case ".wav":
			return "audio";
			break;
		case ".txt":
		case ".kn":
		case ".vn":
		case ".mm":
			return "multimedia";
			break;
		case ".html":
		case ".txt":
			return "text";
			break;
		default:
			return null;
			break;
	}
}

function getLength(file){
	var get=file.match(/[^\s)]+(?=\..+$)/);

	//Return the value in the file or the default duration
	return (get ? parseFloat(get[0]) : S.defaultDuration);
}

//Use documentFragment to append elements faster
function frag(inputArray,inputParent){
	var fragment=document.createDocumentFragment();
	
	var l=inputArray.length;
	for(var i=0;i<l;i++){
		fragment.appendChild(inputArray[i]);
	}
	
	inputParent.appendChild(fragment);
}

//Create an element with a class
function m(c,el){
	var a=document.createElement(el || "div");
	a.className="showpony-"+c;
	
	return a;
}

//Run multimedia (interactive fiction, visual novels, etc)
function runMM(inputNum){
	
	//Go to either the specified line or the next one
	S.currentLine=(inputNum!==undefined ? inputNum : S.currentLine+1);
	
	//If we've ended manually or reached the end, stop running immediately and end it all
	if(S.currentLine>=S.lines.length){
		//console.log("Ending!");
		S.to({file:"+1"});
		return;
	}

	var text=S.lines[S.currentLine];
	
	//Replace all variables (including variables inside variables) with the right name
	while(text.match(/[^\[]+(?=\])/g)){
		var match=text.match(/[^\[]+(?=\])/g)[0];
		
		text=text.replace(
			'['+match+']'
			,S.data[match]
		);
	}

	var wait=true; //Assume waiting time
	
	if(text[0]==">"){
		var vals=text.replace(/^>\s+/,'').split(/(?:\s{3,}|\t+)/);
		
		//console.log(text,vals);
		
		//We run a function based on the value passed.
		//If it returns multimediaSettings, we use those new ones over the old ones.
		multimediaSettings=multimediaFunction[vals[0].toLowerCase().substr(0,2)](vals,multimediaSettings) || multimediaSettings;
		
		if(multimediaSettings.text){
			text=multimediaSettings.text;
			multimediaSettings.text=null;
		}
		
		if(multimediaSettings.wait){
			wait=multimediaSettings.wait;
			multimediaSettings.wait=null;
		}
		
		////console.log(multimediaSettings,S.currentLine);
		
		if(!multimediaSettings.go){
			return;
		}else{
			multimediaSettings.go=false;
		}
	}
	
	//If the textbox hasn't been created, create it!
	if(!S.textboxes[multimediaSettings.textbox]){
		S.textboxes[multimediaSettings.textbox]=m("textbox");
		content.appendChild(S.textboxes[multimediaSettings.textbox]);
	}
	
	//If there's nothing passed, clear the current textbox and continue on to the next line.
	if(vals && !vals[2]){
		S.textboxes[multimediaSettings.textbox].innerHTML="";
		runMM();
		return;
	}else{ //If we're typing in the old textbox
		S.textboxes[multimediaSettings.textbox].innerHTML="";
	}
	
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
				if(values==''){
					//Reset to defaults
					charDefaults();
				}
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
				break;
			//Lines breaks
			case '#':
				fragment.appendChild(document.createElement("br"));
				continue;
				break;
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
			if(this!=event.target){
				return;
			}
			
			//If the element's currently hidden (the animation that ended is for unhiding)
			if(this.style.visibility!="visible"){		
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
				if(this.getBoundingClientRect().bottom>this.parentNode.getBoundingClientRect().bottom){
					this.parentNode.scrollTop+=this.getBoundingClientRect().height;
				}
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
	'en':function(){
		S.to({file:"+1"});
	}
	,'go':function(vals){
		runMM(S.lines.indexOf(vals[1])+1 || null);
	}
	,'in':function(vals){
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
	,'if':function(vals){
		//IF	val		==	val		goto
		if(operators[vals[2]](
			ifParse(vals[1])
			,ifParse(vals[3])
		)){
			runMM(S.lines.indexOf(vals[4])+1 || null);
		}else{
			runMM();
		}
	}
	,'ds':function(vals){
		//DS	var		=	val
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
	,'ev':function(vals){
		//EV	event
		
		//Dispatch the event the user requested to
		S.window.dispatchEvent(new CustomEvent(vals[1]));
		
		//Go to the next line
		runMM();
	}
	,'wt':function(vals){
		//If there's a waitTimer, clear it out
		clearTimeout(waitTimer);
		
		//If a value was included, wait 
		waitTimer=vals[1] && setTimeout(runMM,parseFloat(vals[1])*1000);
	}
	,'au':function(vals){
		//If the audio doesn't exist
		if(!S.objects[vals[1]]){
			//Add them in!
			let el=document.createElement("audio");
			
			el.src="resources/audio/"+vals[1];
			el.preload=true;
			
			S.objects[vals[1]]=el;
			
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
	,'st':function(vals){
		//If it's the window
		if(vals[1]=="window"){
			content.style.cssText+=vals[2];
		//If it's a general element
		}else{
			(S.objects[vals[1]] || S.textboxes[vals[1]]).style.cssText+=vals[2];
		}
		
		//Go to the next line
		runMM();
	}
	,'ch':function(vals){
		//Get the folder, which is the name without anything after a hash
		var folder=vals[1].split('#')[0];

		//If an object with that name doesn't exist
		if(!S.objects[vals[1]]){
			S.objects[vals[1]]=new Character();
		}
		
		var images=[];
		
		//images will be either an array or a string
		var imageNames=vals[2];
		
		//console.log(vals);
		
		if(imageNames){
			//Get all the values (colors, etc) out of here as possible
			if(imageNames.indexOf(",")>-1){
				imageNames=imageNames[0].split(",");
			}
			
			//console.log(imageNames);
			
			images.push("url('resources/characters/"+folder+"/"+imageNames+"')");
			
			/*
			for(var i=0;i<imageNames.length;i++){
				
				if(vals[0]=="ch")
				{
					images.push("url('resources/characters/"+folder+"/"+imageNames[i]+"')");
				}
				else
				{
					if(i>0){
						images+=',';
					}
					
					//If it's a color or gradient, treat it as such
					if(imageNames[i].match(/(#|gradient\(|rgb\(|rgba\()/)){
						S.objects[vals[1]].el.style.backgroundColor=imageNames[i];
					}
					else //Otherwise, assume it's an image
					{
						//If there's no extension set, assume .jpg 
						if(!imageNames[i].match(/\.[^\.]+$/)){
							imageNames[i]+=".jpg";
						}
						
						images+="url('resources/backgrounds/"+imageNames[i]+"')";
					}
				}
			}*/
			
			//Go through each image and add a div
			let l=images.length;
			for(var i=0;i<l;i++){
				//If the image already exists
				var found=false;
				
				//If the layer exists
				if(S.objects[vals[1]].el.children[i]){
					//If this value doesn't exist in the layer
					
					var search=S.objects[vals[1]].el.children[i].children;
					
					let ll=search.length;
					for(var ii=0;ii<ll;ii++){
						
						if(search[ii].style.backgroundImage==images[i]){
							found=true;
							search[ii].style.opacity=1;
						}else{
							search[ii].style.opacity=0;
						}
					}
				}
				
				if(!found){
					S.objects[vals[1]].imgDiv(i,images[i]);
				}
			}
		}
		
		//If a 4th value exists, adjust 'left' if a character or 'zIndex' if a background
		if(vals[3]){
			S.objects[vals[1]].el.style.left=vals[3];
		}
		
		//Go to the next line
		runMM();
	}
	,'bg':function(vals){
		//Get the folder, which is the name without anything after a hash
		var folder=vals[1].split('#')[0];

		//If an object with that name doesn't exist
		if(!S.objects[vals[1]]){
			//Add a background
			S.objects[vals[1]]=m("background");
			content.appendChild(S.objects[vals[1]]);
		}
		
		var images=(vals[0]=="ch" ? [] : '');
		
		//images will be either an array or a string
		var imageNames=vals[2];
		
		//console.log(vals);
		
		if(imageNames){
			//Get all the values (colors, etc) out of here as possible
			if(imageNames.indexOf(",")>-1){
				imageNames=imageNames[0].split(",");
			}
			
			//console.log(imageNames);
			
			//if(i>0){
			//	images+=',';
			//}
			
			//If it's a color or gradient, treat it as such
			if(/(#|gradient\(|rgb\(|rgba\()/.test(imageNames)){
				S.objects[vals[1]].style.backgroundColor=imageNames;
			}
			else //Otherwise, assume it's an image
			{
				images+="url('resources/backgrounds/"+imageNames+"')";
			}
			
			/*
			for(var i=0;i<imageNames.length;i++){
				
				if(i>0){
					images+=',';
				}
				
				//If it's a color or gradient, treat it as such
				if(imageNames[i].match(/(#|gradient\(|rgb\(|rgba\()/)){
					S.objects[vals[1]].el.style.backgroundColor=imageNames[i];
				}
				else //Otherwise, assume it's an image
				{
					//If there's no extension set, assume .jpg 
					if(!imageNames[i].match(/\.[^\.]+$/)){
						imageNames[i]+=".jpg";
					}
					
					images+="url('resources/backgrounds/"+imageNames[i]+"')";
				}
			}*/
			
			S.objects[vals[1]].style.backgroundImage=images;
		}
		
		//If a 4th value exists, adjust 'left' if a character or 'zIndex' if a background
		if(vals[3]){
			S.objects[vals[1]].el.style.zIndex=vals[3];
		}
		
		//Go to the next line
		runMM();
	}
	,'tb':function(vals,multimediaSettings){
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
	'+'		:function(a,b){return a+b;}
	,'-'	:function(a,b){return a-b;}
	,'='	:function(a,b){return b;}
	,'=='	:function(a,b){return a==b;}
	,'<'	:function(a,b){return a<b;}
	,'>'	:function(a,b){return a>b;}
	,'<='	:function(a,b){return a<=b;}
	,'>='	:function(a,b){return a>=b;}
	,'!'	:function(a,b){return a!=b;}
};

//If a value's a number, return it as one
function ifParse(input){
	return parseFloat(input)==input
		? parseFloat(input)
		: input
	;
}

function Character(){
	var cha=this;
	cha.el=m("character");

	//Add a backgroundImage
	cha.imgDiv=function(inputLayer,inputBackground){
		var thisImg=document.createElement("div");
		
		thisImg.style.cssText=`
			background-image:`+inputBackground+`;
			background-position:50% -20%;
			background-repeat:no-repeat;
			background-size:contain;
			opacity:1;
		`;
		
		//If the layer doesn't exist, add it in
		if(!cha.el.children[inputLayer]){
			var newLayer=document.createElement("div");				
			cha.el.appendChild(newLayer);
		}
		
		cha.el.children[inputLayer].appendChild(thisImg);
	}
	
	/*
	//Go through the file and add in all of the images
	for(let i=0;i<S.lines.length;i++){
		if(S.lines[i].match(/@CH ben/)){
			//console.log(S.lines[i]);
			//cha.imgDiv(i,images[i]);
		}
	}*/
	
	content.appendChild(cha.el);
};

//Replace unsafe characters for filenames with safe ones
function safeFilename(string,type){
	if(type=="from"){
		string=replaceArray(
			string
			,["[fs]","[bs]","[gt]","[lt]","[c]","[a]","[q]","[qm]","[b]"]
			,["/","\\",">","<",":","*",'"',"?","|"]
		);
	}else{
		string=replaceArray(
			string
			,["/","\\",">","<",":","*",'"',"?","|"]
			,["[fs]","[bs]","[gt]","[lt]","[c]","[a]","[q]","[qm]","[b]"]
		);
	}
	
	return string;
}

//Replace an array of values
function replaceArray(string,fromArray,toArray){
	var l=fromArray.length;
	for(var i=0;i<l;i++){
		string=string.replace(fromArray[i],toArray[i])
	}
	
	return string;
}

///////////////////////////////////////
////////////EVENT LISTENERS////////////
///////////////////////////////////////

//Keyboard presses
window.addEventListener(
	"keydown"
	,function(event){
		//console.log(document.activeElement);
		
		//Adjust response based on shortcuts setting
		if(S.shortcuts==='always'){
			//Proceed if always enabled
		}
		else if(!S.shortcuts || S.shortcuts==='never'){
			//If shortcuts disabled
			return;
		}else if(S.shortcuts==='fullscreen'){
			//If isn't fullscreen
			if(S.window!==document.webkitFullscreenElement && S.window!==document.mozFullScreenElement && S.window!==document.msFullscreenElement) return;
		}else{ //Default to "focus"
			//Return if not focused
			if(
				//If isn't selected
				(S.window!==document.activeElement)
				&&
				//If isn't fullscreen
				(S.window!==document.webkitFullscreenElement && S.window!==document.mozFullScreenElement && S.window!==document.msFullscreenElement)
			) return;
		}
		
		//event.preventDefault();

		var keys={
			32: function(){S.input();}				//Spacebar
			,37: function(){S.to({time:"-10"});}	//Left arrow
			,39: function(){S.to({time:"+10"});}	//Right arrow
			,36: function(){S.to({file:"first"});}	//Home
			,35: function(){S.to({file:"last"});}	//End
			,177: function(){S.to({file:"-1"});}	//Previous
			,176: function(){S.to({file:"+1"});}	//Next
			,179: function(){S.menu();}				//Play/pause
		};
		
		if(keys[event.keyCode]){
			event.preventDefault();
			keys[event.keyCode]();
		}
	}
);

//We need to set this as a variable to remove it later on
var windowClick=function(event){
	event.stopPropagation();
	S.menu(event);
};

//On clicking, we open the menu- on the overlay. But we need to be able to disable moving the bar outside the overlay, so we still activate menu here.
window.addEventListener("click",windowClick);

//On mousedown, we prepare to move the cursor
overlay.addEventListener(
	"mousedown"
	,function(event){
		//Only read mousemove over the overlay
		if(event.target!==this) return;
		
		scrubbing=event.clientX;
	}
);

window.addEventListener(
	"mouseup"
	,function(){
		//If mouse goes up and we aren't scrubbing, set scrubbing to false.
		//Otherwise, right-clicks can be read wrong
		if(scrubbing!==true) scrubbing=false;
	}
);

//On dragging
window.addEventListener(
	"mousemove"
	,function(event){
		
		//Only read mousemove over the overlay
		//if(event.target!==this) return;
		
		if(scrubbing===false){
			return;
		}
		
		if(scrubbing!==true){
			if(Math.abs(scrubbing-event.clientX)>screen.width/100){
				scrubbing=true;
			}else{
				return;
			}
		}
		
		scrub(
			(event.clientX-S.window.getBoundingClientRect().left)
			/
			(S.window.getBoundingClientRect().width)
		);
	}
);

//On dragging
overlay.addEventListener(
	"touchmove"
	,function(event){
		
		if(scrubbing===false){
			scrubbing=event.changedTouches[0].clientX;
		}
		
		//You have to swipe farther than you move the cursor to adjust the position
		if(scrubbing!==true){
			if(Math.abs(scrubbing-event.changedTouches[0].clientX)>screen.width/20){
				scrubbing=true;
			}else{
				return;
			}
		}
		
		//Don't want the users to accidentally swipe to another page!
		event.preventDefault();
		
		scrub(
			(event.changedTouches[0].clientX-S.window.getBoundingClientRect().left)
			/
			(S.window.getBoundingClientRect().width)
		);
	}
);

//On touch end, don't keep moving the bar to the user's touch
overlay.addEventListener(
	"touchend"
	,function(event){
		
		//If we were scrubbing
		if(scrubbing===true){
			scrubbing=false;
			//console.log("We were scrubbing!");
			//If we don't preload while scrubbing, load the file now that we've stopped scrubbing
			if(S.scrubLoad==false){
				//Load the file our pointer's on
			scrub(
					(event.changedTouches[0].clientX-S.window.getBoundingClientRect().left)
					/
					(S.window.getBoundingClientRect().width)
				);
			}
		}
		
		//scrubbing needs to be set to false here too; either way it's false, but we need to allow the overlay to update above, so we set it to false earlier too.
		scrubbing=false;
	}
);

menuButton.addEventListener(
	"click"
	,function(event){
		event.stopPropagation();
		S.menu();
	}
);


fullscreenButton.addEventListener(
	"click"
	,function(event){
		event.stopPropagation();
		S.fullscreen();
	}
);

captionsButton.addEventListener(
	"click"
	,function(){
		event.stopPropagation();
	}
);

content.addEventListener(
	"click"
	,function(){
		S.input();
	}
);

if(S.title){
	types.audio.addEventListener(
		"timeupdate"
		,function(){
			document.title=replaceInfoText(S.title,S.currentFile);
		}
	);
	
	types.video.addEventListener(
		"timeupdate"
		,function(){
			document.title=replaceInfoText(S.title,S.currentFile);
		}
	);
}

///////////////////////////////////////
/////////////////START/////////////////
///////////////////////////////////////

//If the window is statically positioned, set it to relative! (so positions of children work)
if(window.getComputedStyle(S.window).getPropertyValue('position')=="static"){
	S.window.style.position="relative";
}

//Empty the current window
S.window.innerHTML="";

//And fill it up again!
frag([content,overlay,menuButton,fullscreenButton],S.window);

S.window.classList.add("showpony");

//Set tabIndex so it's selectable (if it's not already set)
if(S.window.tabIndex<0) S.window.tabIndex=0;

//If the user's getting the files remotely, make the call
if(S.files==="get"){
	POST(
		function(response){
			S.files=response.files;
			loggedIn=response.admin;
			startup();
		}
		,{call:"getFiles"}
	);
}else startup();

///////////////////////////////////////
/////////////////ADMIN/////////////////
///////////////////////////////////////

if(S.admin){
	var editorUI=m("editor-ui")
		,uploadFileButton=m("upload-file","label")
		,uploadFile=document.createElement("input")
		,uploadDate=m("editor-date","input")
		,uploadName=m("editor-name","input")
		,deleteFile=m("delete-file","button")
		,newFile=m("new-file","button")
		,logoutButton=m("logout","button")
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
		,function(event){
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
		//Get the name, remove the parentheses
		uploadName.value=safeFilename(
			(S.files[S.currentFile].match(/\(.*\)/) || [""])[0].replace(/(^\(|\)$)/g,'')
			,"from"
		);
		
		uploadDate.value=(S.files[S.currentFile].match(/\d(.(?!\())+\d*/) || [""])[0].replace(/;/g,':');
	}
	
	logoutButton.addEventListener("click",function(){account("logout");});
	
	//Must be set to a variable to be called outside the enclosing "if" statement
	var account=function(type){
		var pass=null;
		if(type==="login") if(!(pass=prompt("What's your password?"))) return;
		
		//console.log(type,pass);
		
		POST(
			function(response){
				S.files=response.files;
				
				S.window.classList[(loggedIn=response.admin) ? "add" : "remove"]("showpony-editor");
				
				S.to({reload:true,scrollToTop:false,replaceState:true});
			}
			,{call:type,password:pass}
		);
	}
	
	function renameFile(){
		var thisFile=S.currentFile;
		var date=uploadDate.value;
		var x=(S.files[thisFile][0]=='x') ? 'x': '';
		
		//Test that the date is safe (must match setup)
		if(!(/^\d{4}-\d\d-\d\d(\s\d\d:\d\d:\d\d)?$/.test(date))){
			alert("Date must be formatted as \"YYYY-MM-DD\" or \"YYYY-MM-DD HH-MM-SS\". You passed \""+date+"\"");
			return;
		}
		
		var fileName=x
			+date.replace(/:/g,';') //date (replace : with ; so it's Windows safe)
			+" ("+safeFilename(uploadName.value,"to")+")" //name
			+S.files[thisFile].match(/\.\w+$/) //ext
		;
		
		POST(
			function(response){
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
				function(response){
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
		,function(){
			var thisFile=S.currentFile;
			
			POST(
				function(response){
					//Remove the file from the arrays
					S.files.splice(thisFile,1);

					//console.log(thisFile,S.files.length);
					
					//If still on that file, refresh it
					if(thisFile===S.currentFile){
					
						//Don't go past the last file
						if(thisFile>=S.files.length){
							thisFile=S.files.length-1;
						}
						
						//console.log(thisFile,S.currentFile);
						
						S.to({file:thisFile,refresh:true,replaceState:true})
					}
				}
				,{call:"deleteFile",name:S.files[thisFile]}
			);
		}
	);
	
	newFile.addEventListener("click"
		,function(){
			POST(
				function(response){
					//Add the file to the array
					S.files.push(response.file);
					
					S.to({file:"last"});
					scrub();
				}
				,{call:"newFile"}
			);
		}
	);
	
	//console.log(account);
}

}