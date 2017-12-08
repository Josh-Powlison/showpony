function Showpony(input){

"use strict";

var eng=this;

//Startup errors
if(!input.window) throw "Error: no window value passed to Showpony object. I recommend passing a <div> element to the window value.";

//Set settings for the engine
Object.assign(eng,{
	window:input.window
	,originalWindow:input.window.cloneNode(true)
	,files:input.files || "get"
	,path:input.path || ""
	,loadingClass:input.loadingClass || null
	,scrubLoad:input.scrubLoad || false
	,query:input.query!==undefined ? input.query
		: "part"
	,info:input.info || "[0pc] | [0pl]"
	,data:input.data || {}
	,defaultDuration:input.defaultDuration || 10
	,admin:input.admin || false
	,dateFormat:input.dateFormat || {year:"numeric",month:"numeric",day:"numeric"}
	,autoplay:input.autoplay!==undefined ? input.autoplay : true
});

///////////////////////////////////////
///////////OBJECT FUNCTIONS////////////
///////////////////////////////////////

//Go to another file
eng.time=function(obj){
	//If inputPart is set
	if(obj && typeof(obj.part)!==undefined){
		//Use different options
		switch(obj.part){
			case "first": eng.currentFile=0; break;
			case "prev": eng.currentFile--; break;
			case "next": eng.currentFile++; break;
			case "last": eng.currentFile=eng.files.length-1; break;
			default:
				//Get the part, or 0 if it's undefined
				eng.currentFile=parseInt(obj.part ? obj.part : 0);
				break;
		}
	}
	
	//If we're at the end, run the readable event
	if(eng.currentFile>=eng.files.length){
		//Go to the final file
		eng.currentFile=eng.files.length-1;
		
		//Run the event that users can read.
		eng.window.dispatchEvent(eventEnd);
		console.log("Ended!");
		
		return;
	}
	
	if(eng.currentFile<0){
		eng.currentFile=0;
	}
	
	//If we're using queries
	if(eng.query && (!obj || !obj.popstate)){
		var search=new RegExp('(\\?|&)'+eng.query+'=','i');
		var newURL=document.location.href;
		
		if(document.location.href.match(search)){
			var replace=new RegExp('((\\?|&)'+eng.query+')=?[^&]+','i');
			newURL=newURL.replace(replace,'$1='+(eng.currentFile+1));
		}else{
			newURL+=newURL.indexOf("?")>-1 ? '&' : '?';
			
			newURL+=eng.query+'='+(eng.currentFile+1);
		}
		
		console.log(newURL);
		
		history.pushState(
			{}
			,""
			,newURL
		);
	}
	
	//If we aren't moving the bar, update the overlay
	scrubbing===false && eng.scrub();
	
	//Go to the top of the page (if we didn't come here by autoloading)
	if(!obj || !obj.autoload){
		eng.window.scrollIntoView();
	}
	
	var newType=getMedium(eng.files[eng.currentFile]);
	var thisType=types[newType];
	
	//Multimedia engine resets
	eng.lines=null;
	eng.charsHidden=0;
	eng.currentLine=0;
	content.style.cssText=null; //Remove any styles applied to the content
	waitForInput=false;
	waitTimer=null;
	
	//If switching types, do some cleanup
	if(currentType!=newType){
		content.innerHTML="";
		console.log(types);
		content.appendChild(thisType);
		
		//Use the general content class
		content.className="showpony-content";//+newType;
	}
	
	var src=(
		eng.files[eng.currentFile][0]=="x"
		? "showpony/showpony-classes.php?showpony-get="+eng.path+eng.files[eng.currentFile]
		: eng.path+eng.files[eng.currentFile]
	);
	
	//Refresh the file, if requested we do so
	if(obj && obj.refresh){
		src+=(
			eng.files[eng.currentFile][0]=="x"
				? "&refresh-"+Date.now()
				: '?refresh-'+Date.now()
		);
	}
	
	//Display the medium based on the file extension
	switch(newType){
		case "image":
			//Adjust the source
			thisType.src=src;
			break;
		case "video":
			//Adjust the source
			thisType.src=src;
			
			console.log(thisType.src);
			
			!overlay.classList.contains("showpony-overlay-visible") && thisType.play();
			
			//When the player's finished with a file
			thisType.addEventListener(
				"ended"
				,function(){
					//If we're scrubbing the media, don't check for ended (this can trigger and interrupt our media scrubbing)
					if(overlay.classList.contains("showpony-overlay-visible")) return;
					
					eng.time({part:"next"});
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
					
					eng.time({part:"next"});
				}
			);
			break;
		//Visual Novels/Kinetic Novels/Interactive Fiction
		case "multimedia":
			console.log(currentType);
		
			//If the previous type was different, use the new type (or if we're scrubbing and not moving along as normal)
			//if(currentType!=newType || overlay.style.visibility=="visible"){
				content.innerHTML="";
				eng.objects={};
				eng.textboxes={};
			//}
			
			GET(
				src
				,function(ajax){
					//Get each line (taking into account and ignoring extra lines)
					eng.lines=ajax.responseText.match(/[^\r\n]+/g);
					
					eng.run(0);
				}
			);
			break;
		case "text":
			GET(
				src
				,function(ajax){
					content.innerHTML=ajax.responseText;
				}
			);
			break;
		default:
			alert("Extension not recognized or supported!");
			break;
	}
	
	//Track the file type used here for when we next switch
	currentType=getMedium(eng.files[eng.currentFile]);
	
	eng.window.dispatchEvent(eventTime);
}

//Toggle the menu
eng.menu=function(event){
	//If we're moving the bar right now, ignore clicking but do set scrubbing to false
	
	if(scrubbing===true){
		scrubbing=false;
	
		//If we don't preload while scrubbing, load the file now that we've stopped scrubbing
		if(eng.scrubLoad==false){
			//Load the part our cursor's on
			eng.scrub(
				(event.clientX-eng.window.getBoundingClientRect().left)
				/
				(eng.window.getBoundingClientRect().width)
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
			eng.scrub();
			
			//Play/pause video or audio
			types[currentType].play && types[currentType].pause();
		}else{
			types[currentType].play && types[currentType].play();
		}
	}
	
	scrubbing=false;
	
	eng.window.dispatchEvent(eventMenu);
};

//Update the scrubber's position
eng.scrub=function(inputPercent){
	var duration=eng.files.map(function(e){return getLength(e);}).reduce((a,b) => a+b,0);
	
	//If no inputPercent was passed, estimate it
	if(typeof(inputPercent)==='undefined'){
		//Use the currentTime of the object, if it has one
		var currentTime=types[currentType] && types[currentType].currentTime || 0;
		
		//Look through the videos for the right one
		var l=eng.currentFile;
		for(var i=0;i<l;i++){
			//Add the times of previous videos 7to get the actual time in the piece
			currentTime+=getLength(eng.files[i]);
		}
		
		var inputPercent=currentTime / duration
			,newPart=eng.currentFile;
	}else{ //if inputPercent WAS passed
	
		//Clamp inputPercent between 0 and 1
		inputPercent= inputPercent <= 0 ? 0 : inputPercent >= 1 ? 1 : inputPercent;
		
		//Go to the time
		var newTime=duration*inputPercent
			,newPart=0
		;
		
		//Look through the media for the right one
		var l=eng.files.length;
		for(var i=0;i<l;i++){
			//If the duration's within this one, stop at this one
			if(i==l-1 || newTime<getLength(eng.files[i])){
			//If this is the media!
				//If we allow scrubbing or we're not moving the bar, we can load the file
				if(eng.scrubLoad!==false || scrubbing===false){
					if(i!==eng.currentFile){
						eng.time({"part":i});
					}
					
					//Set the time properly for the current file
					if(i==eng.currentFile && types[currentType]) types[currentType].currentTime=newTime;
				}
				
				newPart=i;
			
				break;
			}else{
				//Otherwise, go to the next one (and subtract the duration from the total duration)
				newTime-=getLength(eng.files[i]);
			}
		}
	}
	
	//Move the progress bar
	progress.style.left=(inputPercent*100)+"%";
	
	var current=Math.floor(inputPercent*duration)
		,left=duration-Math.floor(inputPercent*duration)
		,floorValue=1
	;
	
	//console.log(current,inputPercent,duration,newPart);
	
	function adjustReplace(input){
		//Name
		if(input[1]=="n"){
			//Get the name, remove the parentheses
			var name=eng.files[newPart].match(/\(.*\)/);
			
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
			var date=eng.files[newPart].match(/\d[^(]+(?!\()\S?/);
			
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
					,eng.dateFormat
				).format(date);
			}else{
				return "";
			}
			
			
		}
		//Percentage complete
		if(input[2]=="%"){
			floorValue=(inputPercent*100);
		}else
		//Part numbers
		if(input[2]=="p"){
			//Pass a calculation based on whether the number of files left, total, or the number of the current part was asked for
			floorValue=
				input[3]=="l" ? eng.files.length-(newPart+1)
				: input[3]=="t" ? eng.files.length
				: newPart+1
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
		return String(
			Math.floor(floorValue)
		).padStart(input[1],'0');
	}
	
	//Set the overlay text (the current time)
	overlayText.innerHTML="<p>"
		+eng.info.replace(/\[[^\]]*\]/g,adjustReplace)
	+"</p>";
}

//Toggle fullscreen
eng.fullscreen=function(type){
	//Get fullscreen type
	var fs=eng.window.requestFullscreen //Normal
			? [
				"fullscreenElement"
				,"exitFullscreen"
				,"requestFullscreen"
			]
		: eng.window.webkitRequestFullscreen //Webkit
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
		: eng.window[fs[2]]()
	;
	
	return;
}

var multimediaSettings={
	textbox:"main"
	,text: null
	,go:false
};

//Run multimedia (interactive fiction, visual novels, etc)
eng.run=function(inputNum){
	
	//Go to either the specified line or the next one
	eng.currentLine=(inputNum!==undefined ? inputNum : eng.currentLine+1);
	
	//If we've ended manually or reached the end, stop running immediately and end it all
	if(eng.currentLine>=eng.lines.length){
		console.log("Ending!");
		eng.time({"part":"next"});
		return;
	}

	var text=eng.lines[eng.currentLine];
	
	//Replace all variables (including variables inside variables) with the right name
	while(text.match(/[^\[]+(?=\])/g)){
		var match=text.match(/[^\[]+(?=\])/g)[0];
		
		text=text.replace(
			'['+match+']'
			,eng.data[match]
		);
	}

	var wait=true; //Assume waiting time
	
	if(text[0]==">"){
		var vals=text.replace(/^>\s+/,'').split(/(?:\s{3,}|\t+)/);
		
		console.log(text,vals);
		
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
		
		//console.log(multimediaSettings,eng.currentLine);
		
		if(!multimediaSettings.go){
			return;
		}else{
			multimediaSettings.go=false;
		}
	}
	
	//If the textbox hasn't been created, create it!
	if(!eng.textboxes[multimediaSettings.textbox]){
		eng.textboxes[multimediaSettings.textbox]=m("textbox");
		content.appendChild(eng.textboxes[multimediaSettings.textbox]);
	}
	
	//If there's nothing passed, clear the current textbox and continue on to the next line.
	if(vals && !vals[2]){
		eng.textboxes[multimediaSettings.textbox].innerHTML="";
		eng.run();
		return;
	}else{ //If we're typing in the old textbox
		eng.textboxes[multimediaSettings.textbox].innerHTML="";
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
				
				//Adjust the styles of charElement based on what's passed (this will impact all future eng.objects)
				
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
					if(text[i].match(/[.!?:;-]/)) waitTime*=20;
					if(text[i].match(/[,]/)) waitTime*=10;
				}

				break;
		}
		
		//Make the char based on charElement
		var thisChar=charElement.cloneNode(false);
		
		let showChar=m("char","span");
		let hideChar=m("char-placeholder","span");
		hideChar.innerHTML=showChar.innerHTML=text[i];
		
		frag([showChar,hideChar],thisChar);
		
		//This character is adding to the list of hidden eng.objects
		eng.charsHidden++;
		
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
				eng.charsHidden--;
				this.style.visibility="visible";
				
				//If there are no more eng.objects to show
				if(eng.charsHidden<1){
					if(!wait){
						eng.run();
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
	eng.textboxes[multimediaSettings.textbox].appendChild(fragment);

	/*
	//Add animations that span the whole thing, so they're in sync
	var e=eng.textboxes[multimediaSettings.textbox].children;
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
		eng.time({part:"next"});
	}
	,'go':function(vals){
		eng.run(eng.lines.indexOf(vals[1])+1 || null);
	}
	,'in':function(vals){
		var thisButton=m("kn-choice","button");
		thisButton.innerHTML=vals[2];
		
		eng.textboxes["main"].appendChild(thisButton);
		
		//On clicking a button, go to the right place
		thisButton.addEventListener("click",function(event){
			event.stopPropagation();
			
			//Progress
			eng.run(eng.lines.indexOf(vals[1])+1);
			
			waitForInput=false;
		});
		
		waitForInput=true;
		
		eng.run();
	}
	,'if':function(vals){
		//IF	val		==	val		goto
		if(operators[vals[2]](
			ifParse(vals[1])
			,ifParse(vals[3])
		)){
			eng.run(eng.lines.indexOf(vals[4])+1 || null);
		}else{
			eng.run();
		}
	}
	,'ds':function(vals){
		//DS	var		=	val
		eng.data[vals[1]]=operators[vals[2]](
			ifParse(eng.data[vals[1]])
			,ifParse(vals[3])
		);
		
		//Go to the next line
		eng.run();
	}
	,'wt':function(vals){
		//If there's a waitTimer, clear it out
		clearTimeout(waitTimer);
		
		//If a value was included, wait 
		waitTimer=vals[1] && setTimeout(eng.run,parseFloat(vals[1])*1000);
	}
	,'au':function(vals){
		//If the audio doesn't exist
		if(!eng.objects[vals[1]]){
			//Add them in!
			let el=document.createElement("audio");
			
			el.src="resources/audio/"+vals[1];
			el.preload=true;
			
			eng.objects[vals[1]]=el;
			
			content.appendChild(eng.objects[vals[1]]);
		}
		
		//Go through the passed parameters and apply them
		let l=vals.length;
		for(let i=2;i<l;i++){
			switch(vals[i]){
				case "loop":
					eng.objects[vals[1]].loop=true;
					break;
				case "play":
				case "pause":
					eng.objects[vals[1]][vals[i]]();
					break;
				case "stop":
					eng.objects[vals[1]].currentTime=0;
					eng.objects[vals[1]].pause();
					break;
			}
		}
		
		//Go to the next line
		eng.run();
	}
	,'st':function(vals){
		//If it's the window
		if(vals[1]=="window"){
			content.style.cssText+=vals[2];
		//If it's a general element
		}else{
			(eng.objects[vals[1]] || eng.textboxes[vals[1]]).style.cssText+=vals[2];
		}
		
		//Go to the next line
		eng.run();
	}
	,'ch':function(vals){
		//Get the folder, which is the name without anything after a hash
		var folder=vals[1].split('#')[0];

		//If an object with that name doesn't exist
		if(!eng.objects[vals[1]]){
			eng.objects[vals[1]]=new Character();
		}
		
		var images=[];
		
		//images will be either an array or a string
		var imageNames=vals[2];
		
		console.log(vals);
		
		if(imageNames){
			//Get all the values (colors, etc) out of here as possible
			if(imageNames.indexOf(",")>-1){
				imageNames=imageNames[0].split(",");
			}
			
			console.log(imageNames);
			
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
						eng.objects[vals[1]].el.style.backgroundColor=imageNames[i];
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
				if(eng.objects[vals[1]].el.children[i]){
					//If this value doesn't exist in the layer
					
					var search=eng.objects[vals[1]].el.children[i].children;
					
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
					eng.objects[vals[1]].imgDiv(i,images[i]);
				}
			}
		}
		
		//If a 4th value exists, adjust 'left' if a character or 'zIndex' if a background
		if(vals[3]){
			eng.objects[vals[1]].el.style.left=vals[3];
		}
		
		//Go to the next line
		eng.run();
	}
	,'bg':function(vals){
		//Get the folder, which is the name without anything after a hash
		var folder=vals[1].split('#')[0];

		//If an object with that name doesn't exist
		if(!eng.objects[vals[1]]){
			//Add a background
			eng.objects[vals[1]]=m("background");
			content.appendChild(eng.objects[vals[1]]);
		}
		
		var images=(vals[0]=="ch" ? [] : '');
		
		//images will be either an array or a string
		var imageNames=vals[2];
		
		console.log(vals);
		
		if(imageNames){
			//Get all the values (colors, etc) out of here as possible
			if(imageNames.indexOf(",")>-1){
				imageNames=imageNames[0].split(",");
			}
			
			console.log(imageNames);
			
			//if(i>0){
			//	images+=',';
			//}
			
			//If it's a color or gradient, treat it as such
			if(imageNames.match(/(#|gradient\(|rgb\(|rgba\()/)){
				eng.objects[vals[1]].style.backgroundColor=imageNames;
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
					eng.objects[vals[1]].el.style.backgroundColor=imageNames[i];
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
			
			eng.objects[vals[1]].style.backgroundImage=images;
		}
		
		//If a 4th value exists, adjust 'left' if a character or 'zIndex' if a background
		if(vals[3]){
			eng.objects[vals[1]].el.style.zIndex=vals[3];
		}
		
		//Go to the next line
		eng.run();
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

//When the viewer inputs to Showpony (click, space, general action)
eng.input=function(){
	console.log(currentType);
	
	//Function differently depending on medium
	switch(currentType){
		case "image":
			eng.time({"part":"next"});
			break;
		case "audio":
		case "video":
			eng.menu();
			break;
		case "multimedia":
			//If the player is making choices right now
			if(waitForInput) return;
		
			//If a wait timer was going, stop it.
			clearTimeout(waitTimer);
		
			console.log(eng.charsHidden);
		
			//If all letters are displayed
			if(eng.charsHidden<1){
				eng.run();
			}
			else //If some eng.objects have yet to be displayed
			{
				console.log(eng.textboxes);
				
				//Go through each textbox and display all of its text
				Object.keys(eng.textboxes).forEach(
					function(key){
						let l=eng.textboxes[key].children.length;
						for(let i=0;i<l;i++){
							//Skip over non-span tags
							if(eng.textboxes[key].children[i].tagName!=="SPAN") continue;
							
							//Remove the delay so they're displayed immediately
							eng.textboxes[key].children[i].children[0].style.animationDelay="0s";
						}
					}
				);
			}
			break;
	}
}

//Close ShowPony
eng.close=function(){
	//Replace the container with the original element
	
	console.log(windowClick);
	
	//Remove the window event listener
	window.removeEventListener("click",windowClick);
	
	//Reset the window to what it was before
	eng.window.parentNode.replaceChild(eng.originalWindow,eng.window);
	
	//Remove this object
	eng=null;
}

///////////////////////////////////////
////////////LOCAL FUNCTIONS////////////
///////////////////////////////////////

//Make a GET call
function GET(src,onSuccess){
	//Add loadingClass
	if(eng.loadingClass){
		eng.window.classList.add(eng.loadingClass);
	}
	
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
					if(eng.loadingClass){
						content.classList.remove(eng.loadingClass);
					}
				}else{
					alert("Failed to load file called: "+eng.path+eng.files[eng.currentFile]);
				}
			}
		}
	);
}

//Make a POST call
function POST(onSuccess,call,inputVal,inputVal2){
	//Prepare the form data
	var formData=new FormData();
	formData.append('showpony-call',call);
	formData.append('path',eng.path);
	
	//If we're a logged-in admin
	if(eng.admin &&  loggedIn){
		formData.append('password',inputVal || null);
		formData.append('name',inputVal || null);
		formData.append('newName',inputVal2 || null);
		formData.append('files',uploadFile.files[0] || null);
	}

	var ajax=new XMLHttpRequest();
	ajax.open("POST","showpony/showpony-classes.php");
	ajax.send(formData);
	
	ajax.addEventListener(
		"readystatechange"
		,function(){
			if(ajax.readyState==4){
				if(ajax.status==200){
					onSuccess(ajax);
				}else{
					alert("Failed to load Showpony class file.");
				}
			}
		}
	);
}

//Get the medium from the file extensions
function getMedium(inputFileType){
	switch(inputFileType.match(/\.[^.]+$/)[0]){
		case ".jpg":
		case ".jpeg":
		case ".png":
		case ".gif":
		case ".svg":
		case ".tiff":
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
	return (get ? parseFloat(get[0]) : eng.defaultDuration);
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
function m(input,el){
	var a=document.createElement(el || "div");
	a.className="showpony-"+input;
	
	return a;
}

//Check values inline
var operators={
	'+':function(a,b){return a+b;}
	,'-':function(a,b){return a-b;}
	,'=':function(a,b){return b;}
	,'==':function(a,b){return a==b;}
	,'<':function(a,b){return a<b;}
	,'>':function(a,b){return a>b;}
	,'<=':function(a,b){return a<=b;}
	,'>=':function(a,b){return a>=b;}
	,'!':function(a,b){return a!=b;}
};

//If a value's a number, return it as one
function ifParse(input){
	return parseFloat(input)==input
		? parseFloat(input)
		: input
	;
}

///////////////////////////////////////
////////////////OBJECTS////////////////
///////////////////////////////////////

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
	for(let i=0;i<eng.lines.length;i++){
		if(eng.lines[i].match(/@CH ben/)){
			console.log(eng.lines[i]);
			//cha.imgDiv(i,images[i]);
		}
	}*/
	
	content.appendChild(cha.el);
};

///////////////////////////////////////
///////////LOCAL FUNCTIONS/////////////
///////////////////////////////////////

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
///////////LOCAL VARIABLES/////////////
///////////////////////////////////////

//Waiting for user input
var waitForInput=false
	,scrubbing=false
	,waitTimer=null
	,currentType=null
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

menuButton.alt="Menu";
fullscreenButton.alt="Fullscreen";
captionsButton.alt="Closed Captions/Subtitles";
continueNotice.innerHTML="...";

frag([progress,overlayText],overlay)

///////////////////////////////////////
/////////////CUSTOM EVENTS/////////////
///////////////////////////////////////

//On moving to another part
var eventTime=new Event(
	"time"
	,{
		current:eng.currentFile+1
	}
);

//On ending (reaching the very end)
var eventEnd=new Event("end");

//On toggling the menu
var eventMenu=new Event(
	"menuopen"
	,{
		function(){
			opened:(
				overlay.classList.contains("showpony-overlay-visible") ? true
				: false
			)
		}
	}
);

///////////////////////////////////////
/////////////////START/////////////////
///////////////////////////////////////

//If the user's getting the files remotely, make the call
if(eng.files=="get"){
	eng.files=[];
	POST(
		function(ajax){
			var response=JSON.parse(ajax.responseText);
			console.log(response);
			
			if(response.success){
				eng.files=response.files;
				startup();
			}else{
				alert(response.message);
			}
		}
		,"getFiles"
	);
}else{
	startup();
}

function startup(){
	if(!eng.autoplay) eng.menu();
	
	//Go to the part if it's a number, otherwise go to the end.
	eng.currentFile=!isNaN(input.start) ? input.start : eng.files.length-1;
	
	console.log(eng.currentFile,eng.files.length);
	
	//If querystrings are in use, consider the querystring in the URL
	if(eng.query){
		window.addEventListener(
			"popstate"
			,function(){
				var page=window.location.href.match(new RegExp(eng.query+'[^&]+','i'));
				
				if(page){
					eng.time({part:parseInt(page[0].split("=")[1])-1,popstate:true,autoload:true});
				}
			}
		);
		
		var page=window.location.href.match(new RegExp(eng.query+'[^&]+','i'));
	
		//Add in the time if it needs it, otherwise pass nothing
		eng.time(
			page
			? {
				part:parseInt(page[0].split("=")[1])-1
				,popstate:true
				,autoload:true
			}
			: null
		);
	}else{
		//Start
		eng.time({autoload:true});
	}
	
	//Set input to null in hopes that garbage collection will come pick it up
	input=null;
}

//If the window is statically positioned, set it to relative! (so positions of children work)
if(window.getComputedStyle(eng.window).getPropertyValue('position')=="static"){
	eng.window.style.position="relative";
}

//Empty the current window
eng.window.innerHTML="";

//And fill it up again!
frag([content,overlay,menuButton,fullscreenButton],eng.window);

eng.window.classList.add("showpony");

///////////////////////////////////////
////////////EVENT LISTENERS////////////
///////////////////////////////////////

//We need to set this as a variable to remove it later on
var windowClick=function(event){
	event.stopPropagation();
	eng.menu(event);
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
		
		eng.scrub(
			(event.clientX-eng.window.getBoundingClientRect().left)
			/
			(eng.window.getBoundingClientRect().width)
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
		
		eng.scrub(
			(event.changedTouches[0].clientX-eng.window.getBoundingClientRect().left)
			/
			(eng.window.getBoundingClientRect().width)
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
			console.log("We were scrubbing!");
			//If we don't preload while scrubbing, load the file now that we've stopped scrubbing
			if(eng.scrubLoad==false){
				//Load the part our pointer's on
			eng.scrub(
					(event.changedTouches[0].clientX-eng.window.getBoundingClientRect().left)
					/
					(eng.window.getBoundingClientRect().width)
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
		eng.menu();
	}
);


fullscreenButton.addEventListener(
	"click"
	,function(event){
		event.stopPropagation();
		eng.fullscreen();
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
		eng.input();
	}
);

///////////////////////////////////////
/////////////////ADMIN/////////////////
///////////////////////////////////////

if(eng.admin){
	var loggedIn=false;
	
	overlayText.contentEditable=true;
	overlayText.style.pointerEvents="auto";
	
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
	uploadName.placeholder="Part Title (optional)";
	
	uploadDate.placeholder="YYYY-MM-DD HH:MM:SS";

	uploadFile.type="file";
	uploadFile.style.display="none";
	
	uploadFileButton.appendChild(uploadFile);
	
	frag([uploadFileButton,uploadDate,uploadName,deleteFile,newFile,logoutButton],editorUI);
	
	eng.window.appendChild(editorUI);
	
	//Adjust display of header
	overlayText.addEventListener(
		"focus"
		,function(){
			overlayText.innerHTML="<p>"+eng.info+"</p>";
		}
	);
	
	overlayText.addEventListener(
		"blur"
		,function(event){
			eng.info=overlayText.children[0].innerHTML;
			eng.scrub();
		}
	);
	
	//Edit/adjust file details
	eng.window.addEventListener(
		"contextmenu"
		,function(event){
			event.preventDefault();
			console.log("Context menu!");
			editor();
		}
	);
	
	function editor(){
		if(loggedIn){
			eng.window.classList.toggle("showpony-editor");
			updateEditor();
		}else{
			account("login");
		}
	}
	
	function updateEditor(){
		var date=(eng.files[eng.currentFile].match(/\d(.(?!\())+\d*/) || [""])[0].replace(/;/g,':');
		
		//Get the name, remove the parentheses
		var name=safeFilename(
			(eng.files[eng.currentFile].match(/\(.*\)/) || [""])[0].replace(/(^\(|\)$)/g,'')
			,"from"
		);
		
		uploadName.value=name;
		uploadDate.value=date;
	}
	
	eng.alert=function(message){
		alert(message);
	}
	
	logoutButton.addEventListener("click"
		,function(){account("logout");}
	);
	
	function account(type,tryCookie){
		var pass=null;
		if(type==="login"){
			if(!tryCookie){
				pass=prompt("What's your password?");
				if(!pass) return;
			}
		}
		
		console.log(type,tryCookie,pass);
		
		POST(
			function(ajax){
				var response=JSON.parse(ajax.responseText);
				console.log(response);
				
				if(response.success){
					//Logged in
					if(response.admin){
						console.log("Hello!");
						loggedIn=true;
					
						if(!tryCookie){
							editor();
						}
					}else{ //Not logged in
						editor();
						loggedIn=false;
					}
					
					eng.files=response.files;
				}else{
					alert(response.message);
				}
			}
			,type
			,pass
		);
	}
	
	function renameFile(){
		var thisFile=eng.currentFile;
		var date=uploadDate.value;
		var x=(eng.files[thisFile][0]=='x') ? 'x': '';
		
		//Test that the date is safe (must match setup)
		if(!date.match(/^\d{4}-\d\d-\d\d(\s\d\d:\d\d:\d\d)?$/)){
			eng.alert("Date must formatted as \"YYYY-MM-DD\" or \"YYYY-MM-DD HH-MM-SS\". You passed \""+date+"\"");
			return;
		}
		
		var fileName=x
			+date.replace(/:/g,';') //date (replace : with ; so it's Windows safe)
			+" ("+safeFilename(uploadName.value,"to")+")" //name
			+eng.files[thisFile].match(/\.\w+$/) //ext
		;
		
		POST(
			function(ajax){
				var response=JSON.parse(ajax.responseText);
				
				if(response.success){
					eng.files[thisFile]=response.file;
					
					//Sort the files by order
					eng.files.sort();
					
					eng.time({part:eng.files.indexOf(response.file)});
					eng.scrub();
				}else{
					alert(response.message);
				}
			}
			,"renameFile"
			,eng.files[thisFile]
			,fileName
		);
	}
	
	//EVENT LISTENERS//
	//On time, update the editor
	eng.window.addEventListener("time"
		,function(){
			updateEditor();
		}
	);
	
	uploadName.addEventListener("change"
		,function(){
			renameFile();
		}
	);
	
	uploadDate.addEventListener("change"
		,function(){
			renameFile();
		}
	);
	
	uploadFile.addEventListener("change"
		,function(){
			var thisFile=eng.currentFile;
			
			POST(
				function(ajax){
					var response=JSON.parse(ajax.responseText);
					console.log(response);
					
					if(response.success){
						eng.files[thisFile]=response.file;
						
						//If still on that file, refresh it
						if(eng.currentFile===thisFile) eng.time({part:thisFile,refresh:true})
					}else{
						alert(response.message);
					}
				}
				,"uploadFile"
				,eng.files[thisFile]
			);
		}
	);
	
	deleteFile.addEventListener("click"
		,function(){
			var thisFile=eng.currentFile;
			
			POST(
				function(ajax){
					var response=JSON.parse(ajax.responseText);
					console.log(response);
					console.log(eng.currentFile,thisFile,eng.files.length);
					
					if(response.success){
						//Remove the file from the arrays
						eng.files.splice(thisFile,1);

						console.log(thisFile,eng.files.length);
						
						//If still on that file, refresh it
						if(thisFile===eng.currentFile){
						
							//Don't go past the last file
							if(thisFile>=eng.files.length){
								thisFile=eng.files.length-1;
							}
							
							console.log(thisFile,eng.currentFile);
							
							eng.time({part:thisFile,refresh:true})
						}
					}else{
						alert(response.message);
					}
				}
				,"deleteFile"
				,eng.files[thisFile]
			);
		}
	);
	
	newFile.addEventListener("click"
		,function(){
			POST(
				function(ajax){
					var response=JSON.parse(ajax.responseText);
					console.log(response);
					
					if(response.success){
						//Add the file to the array
						eng.files.push(response.file);
						
						eng.time({part:"last"});
						eng.scrub();
					}else{
						alert(response.message);
					}
				}
				,"newFile"
			);
		}
	);
	
	//Try logging in
	account("login",true);
}

}