function Showpony(input){

"use strict";

var eng=this;

//Startup errors
if(!input.window) throw "Error: no window value passed to Showpony object. I recommend passing a <div> element to the window value.";

//Set settings for the engine
Object.assign(eng,{
	window:input.window
	,originalWindow:input.window.cloneNode(true)
	,files:input.files || null
	,path:input.path || ""
	,loadingClass:input.loadingClass || null
	,scrubLoad:input.scrubLoad || false
	,currentFile:
		input.startAt=="first" ? 0
		: input.startAt=="last" ? input.files.length-1
		: input.startAt!==undefined ? input.startAt
		: input.files.length-1
	,query:input.query!==undefined ? input.query
		: "part"
	,timeDisplay:input.timeDisplay || "[0pc] | [0pl]"
	,data:input.data || {}
	,durations:[]
	,defaultDuration:input.defaultDuration || 20
	,totalDuration:0
	,admin:input.admin || false
	,dateFormat:input.dateFormat || {
			year:"numeric"
			,month:"numeric"
			,day:"numeric"
			,hour:"numeric"
			,minute:"numeric"
		}
});

//Set input to null in hopes that garbage collection will come pick it up
input=null;

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
	
	//If we're at the end, run the event
	if(eng.currentFile>=eng.files.length){
		//Go to the final file
		eng.currentFile=eng.files.length-1;
		
		//Run the event that users can read
		eng.window.dispatchEvent(eventEnd);
		return;
	}
	
	if(eng.currentFile<0){
		eng.currentFile=0;
	}
	
	//If we're using queries
	if(eng.query && (!obj || !obj.popstate)){
		history.pushState(
			{}
			,""
			,(document.location.href)
				.split(/\#|\?/)[0] //Get text before any existing hashes or querystrings
				+'?'+eng.query+'='+(eng.currentFile+1) //Append the search query in the header (adding 1 so it looks more normal to users)
		);
	}
	
	//If we aren't moving the bar, update the overlay
	scrubbing===false && eng.scrub();
	
	//Go to the top of the page
	eng.window.scrollIntoView();
	
	var newType=getMedium(eng.files[eng.currentFile]);
	
	//Multimedia engine resets
	eng.lines=null;
	eng.charsHidden=0;
	eng.currentLine=0;
	waitTimer=null;
	content.style.cssText=null; //Remove any styles applied to the content
	waitForInput=false;
	
	var thisType=types[newType];
	
	//If switching types, do some cleanup
	if(currentType!=newType){
		content.innerHTML="";
		console.log(types);
		content.appendChild(thisType);
		
		//Use the general content class
		content.className="showpony-content-"+newType;
	}
	
	var src=(
		eng.files[eng.currentFile][0]=="x"
		? "showpony/showpony-get-file.php?path="+eng.path+"&get="+eng.files[eng.currentFile]
		: eng.path+eng.files[eng.currentFile]
	);
	
	//Refresh the file, if requested we do so
	if(obj && obj.refresh){
		src+=(
			eng.files[eng.currentFile][0]=="x"
				? "&refresh-"+Date.now()
				: '?refresh-'+Date.now()
		);
		
		//Get the duration of the newly-loaded file too
	}
	
	console.log(src);
	
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
					
					content.className="";
					
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
	console.log(currentType);
	
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
	//If no inputPercent was passed, estimate it
	if(typeof(inputPercent)==='undefined'){
		//Use the currentTime of the object, if it has one
		var currentTime=types[currentType] && types[currentType].currentTime || 0;
		
		//Look through the videos for the right one
		var l=eng.currentFile;
		for(var i=0;i<l;i++){
			//Add the times of previous videos 7to get the actual time in the piece
			currentTime+=eng.durations[i];
		}
		
		var inputPercent=currentTime / eng.totalDuration;
		
		var newPart=eng.currentFile;
	}
	else //if inputPercent WAS passed
	{
	
		//Clamp inputPercent between 0 and 1
		inputPercent= inputPercent <= 0 ? 0 : inputPercent >= 1 ? 1 : inputPercent;
		
		//Go to the time
		var newTime=eng.totalDuration*inputPercent;

		var newPart=0;
		
		//Look through the media for the right one
		var l=eng.durations.length;
		for(var i=0;i<l;i++){
			//If the duration's within this one, stop at this one
			if(i==l-1 || newTime<eng.durations[i]){
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
				newTime-=eng.durations[i];
			}
		}
	}
	
	//Move the progress bar
	progress.style.left=(inputPercent*100)+"%";
	
	var current=Math.floor(inputPercent*eng.totalDuration);
	var left=eng.totalDuration-Math.floor(inputPercent*eng.totalDuration);
	var floorValue=1;
	
	//console.log(current,inputPercent,eng.totalDuration,newPart);
	
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
					input[2]=="h" ? eng.totalDuration / 3600
					: input[2]=="m" ? (eng.totalDuration % 3600) / 60
					: eng.totalDuration % 60
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
		+eng.timeDisplay.replace(/\[[^\]]*\]/g,adjustReplace)
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
	
	//Skip comment lines
	if(text[0]=='#'){
		//Go to the next line
		eng.run();
		return;
	}
	
	//Replace any variable placeholders with their values
	var varMatch=text.match(/[^\[]+(?=\])/g);
	
	var l=varMatch ? varMatch.length : 0;
	for(var i=0;i<l;i++){
		//Replace the match with the data value
		text=text.replace(
			'['+varMatch[i]+']'
			,eng.data[varMatch[i]]
		);
	}
	
	var currentTextbox="main";
	//Assume waiting time
	var wait=true;

	if(text[0]==">"){
		var splitValues=text.replace(/>\s+/,'').split(/(?:\s{3,}|\t+)/);
		
		console.log(text,splitValues);
		
		//Consider special text calls
		switch(splitValues[0]){
			//Characters and Backgrounds
			case "CH":
			case "BG":
				//Get the folder, which is the name without anything after a hash
				var folder=splitValues[1].split('#')[0];

				//If an object with that name doesn't exist
				if(!eng.objects[splitValues[1]]){
					//Add a character
					if(splitValues[0]=="CH"){
						eng.objects[splitValues[1]]=new Character();
					}else{
						//Add a background
						eng.objects[splitValues[1]]=m("background");
						content.appendChild(eng.objects[splitValues[1]]);
					}
				}
				
				var images=(splitValues[0]=="CH" ? [] : '');
				
				//images will be either an array or a string
				var imageNames=splitValues[2];
				
				console.log(splitValues);
				
				if(imageNames){
					//Get all the values (colors, etc) out of here as possible
					if(imageNames.indexOf(",")>-1){
						imageNames=imageNames[0].split(",");
					}
					
					console.log(imageNames);
					
					if(splitValues[0]=="CH")
					{
						images.push("url('resources/characters/"+folder+"/"+imageNames+"')");
					}
					else
					{
						if(i>0){
							images+=',';
						}
						
						//If it's a color or gradient, treat it as such
						if(imageNames.match(/(#|gradient\(|rgb\(|rgba\()/)){
							eng.objects[splitValues[1]].style.backgroundColor=imageNames;
						}
						else //Otherwise, assume it's an image
						{
							images+="url('resources/backgrounds/"+imageNames+"')";
						}
					}
					
					/*
					for(var i=0;i<imageNames.length;i++){
						
						if(splitValues[0]=="CH")
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
								eng.objects[splitValues[1]].el.style.backgroundColor=imageNames[i];
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
					
					//Adding the background images
					if(splitValues[0]=="CH"){
						
						//Go through each image and add a div
						let l=images.length;
						for(var i=0;i<l;i++){
							//If the image already exists
							var found=false;
							
							//If the layer exists
							if(eng.objects[splitValues[1]].el.children[i]){
								//If this value doesn't exist in the layer
								
								var search=eng.objects[splitValues[1]].el.children[i].children;
								
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
								eng.objects[splitValues[1]].imgDiv(i,images[i]);
							}
						}
					}else{
						eng.objects[splitValues[1]].style.backgroundImage=images;
					}
				}
				
				//If a 4th value exists, adjust 'left' if a character or 'zIndex' if a background
				if(splitValues[3]){
					eng.objects[splitValues[1]].el.style[splitValues[0]=="CH" ? "left" : "zIndex"]=splitValues[3];
				}
				
				//Go to the next line
				eng.run();
				return;
				break;
			//Styles
			case "ST":
				//If it's the window
				if(splitValues[1]=="window"){
					content.style.cssText+=splitValues[2];
				//If it's a general element
				}else{
					eng[
						(eng.objects[splitValues[1]]
						? "objects"
						: "textboxes")
					][splitValues[1]].style.cssText+=splitValues[2];
				}
				
				//Go to the next line
				eng.run();
				return;
				break;
			//Audio
			case "AU":
				//If the audio doesn't exist
				if(!eng.objects[splitValues[1]]){
					//Add them in!
					let el=document.createElement("audio");
					
					el.src="resources/audio/"+splitValues[1];
					
					el.preload=true;
					
					eng.objects[splitValues[1]]=el;
					
					content.appendChild(eng.objects[splitValues[1]]);
				}
				
				//Go through the passed parameters and apply them
				let l=splitValues.length;
				for(let i=2;i<l;i++){
					switch(splitValues[i]){
						case "loop":
							eng.objects[splitValues[1]].loop=true;
							break;
						case "play":
						case "pause":
							eng.objects[splitValues[1]][splitValues[i]]();
							break;
						case "stop":
							eng.objects[splitValues[1]].currentTime=0;
							eng.objects[splitValues[1]].pause();
							break;
					}
				}
				
				//Go to the next line
				eng.run();
				return;
				break;
			//Wait for reader input before continuing
			case "WT":
				//If there's a waitTimer, clear it out
				clearTimeout(waitTimer);
				
				//If a value was included, wait 
				if(splitValues[1]){
					
					//Set a wait timer (continue after wait)
					waitTimer=setTimeout(
						eng.run
						,parseFloat(splitValues[1])*1000
					);
				}
				return;
				break;
			//Go to a place
			case "GO":
				eng.run(
					eng.lines.indexOf(splitValues[1])+1 || null
				);
				return;
				
				break;
			//End the novel
			case "EN":
				eng.time({part:"next"});
				return;
				break;
			//Set data
			case "DS":
				//If the variable is already set, get its current value
				var curValue=eng.data[splitValues[1]] || 0;
				
				//Update data
				eng.data[splitValues[1]]=
					splitValues[2]=="++" ? parseFloat(curValue)+1
					: splitValues[2]=="--" ? parseFloat(curValue)-1
					: splitValues[2][0]=="+" ? parseFloat(curValue)+parseFloat(splitValues[2].match(/(\d|\.|\,)+$/))
					: splitValues[2][0]=="-" ? parseFloat(curValue)-parseFloat(splitValues[2].match(/(\d|\.|\,)+$/))
					: splitValues[2]
				;

				console.log(eng.data);
				
				//Go to the next line
				eng.run();
				return;
				
				break;
			case "IF":
				//Get the var, the values, and the goTo position
				var checkVar=text.substring(4);
				var checkValues=eng.lines[eng.currentLine+1].split(/\s+/g);
				var goTos=eng.lines[eng.currentLine+2].split(/\s+/g);
				
				console.log(checkVar,eng.data[checkVar]);
				
				//If the object exists
				if(typeof eng.data[checkVar]!=='undefined'){
					//Go through all the values it could be and check for them (if none match, we're just displaying this line as text
					let l=checkValues.length;
					for(var i=0;i<l;i++){
						var goToLine=-1;
						var check=false;
						
						console.log(eng.data[checkVar],checkValues[i]);
						
						switch(checkValues[i][0]){
							//If less than
							case "<":
								if(checkValues[i][1]=="="){
									console.log(eng.data[checkVar],checkValues[i].substr(2));
									
									check=(parseFloat(eng.data[checkVar])<=parseFloat(checkValues[i].substr(2)));
								}else{
									check=(parseFloat(eng.data[checkVar])<parseFloat(checkValues[i].substr(1)));
								}
								break;
							//If greater than
							case ">":
								if(checkValues[i][1]=="="){
									check=(parseFloat(eng.data[checkVar])>=parseFloat(checkValues[i].substr(2)));
								}else{
									check=(parseFloat(eng.data[checkVar])>parseFloat(checkValues[i].substr(1)));
								}
								break;
							case "!":
								check=(eng.data[checkVar]!=checkValues[i].substr(1));
								break;
							default:
								check=(eng.data[checkVar]==checkValues[i]);
							break;
						}
						
						//If the check is true, set the goToLine
						if(check) goToLine=eng.lines.indexOf(goTos[i]);
						
						//As long as that line exists, go to it (otherwise continue)
						if(goToLine>-1){
							eng.run(goToLine+1);
							
							//Escape the loop
							break;
						}
					}
				}
				
				return;
				break;
			//Input Button (players choose between several button options)
			case "IN":
				
				var readLine=eng.currentLine+1;
				
				//While the line has a dash before it
				while(eng.lines[readLine] && eng.lines[readLine][0]=='-'){
					var thisButton=document.createElement("button");
					thisButton.className="kn-choice";
					
					console.log(readLine);
					
					var values=eng.lines[readLine].substr(1).split(/\s+(.+)/);
					
					let cur=values[0];
					thisButton.innerHTML=values[1];
					eng.textboxes["main"].el.appendChild(thisButton);
					
					readLine++;
					
					//On clicking a button, go to the right place
					thisButton.addEventListener("click",function(event){
						event.stopPropagation();
						
						//Progress
						eng.run(eng.lines.indexOf(cur)+1);
						
						waitForInput=false;
					});
				}
				
				waitForInput=true;
				
				return;
				break;
			//Textbox
			case "TB":
				//Get the current textbox
				currentTextbox=splitValues[1];
				
				//Get the text to display
				text=splitValues[2];
				
				//Turn off automatic waiting for this, we're assuming waiting is off
				wait=false;
				break;
			//The default will just fall through to the normal textbox settings
			default:
				break;
		}
	}
	
	//If the textbox hasn't been created, create it!
	if(!eng.textboxes[currentTextbox]){
		eng.textboxes[currentTextbox]=m("textbox");
		content.appendChild(eng.textboxes[currentTextbox]);
	}
	
	//If there's nothing passed, clear the current textbox and continue on to the next line.
	if(splitValues && !splitValues[2]){
		eng.textboxes[currentTextbox].innerHTML="";
		eng.run();
		return;
	}else{ //If we're typing in the old textbox
		eng.textboxes[currentTextbox].innerHTML="";
	}
	
	//STEP 2: Design the text//
	
	//Design defaults
	var charElementDefault=m("kn-char","span");	
	var charElement, baseWaitTime, addAnimations;
	
	//Reset the defaults with this function, or set them inside here!
	function charDefaults(){
		//Use the default element for starting off
		charElement=charElementDefault.cloneNode(true);
		baseWaitTime=.03; //The default wait time
		addAnimations='';
	}
	
	//Use the defaults
	charDefaults();

	//The total time we're waiting until x happens
	var totalWait=0;
	var fragment=document.createDocumentFragment();
	
	l=text.length;
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
					if(values[3].length){
						switch(values[3]){
							case "bold":
								charElement.style.fontWeight="bold";
								break;
							case "italic":
								charElement.style.fontStyle="italic";
								break;
							case "underline":
								charElement.style.textDecoration="underline";
								break;
							//General animations
							default:
								addAnimations=values[3];
								break;
						}
					}
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
			//How to handle punctuation
			case '.':
			case '!':
			case '?':
			case ':':
			case ';':
			case '-':
				if(i!=text.length && text[i+1]==' '){
					waitTime*=20;
				}
				break;
			case ',':
				if(i!=text.length && text[i+1]==' '){
					waitTime*=10;
				}
				break;
			//For regular eng.objects, do nothing
			default:
				break;
		}
		
		//Make the char based on charElement
		var thisChar=charElement.cloneNode(false);
		
		if(addAnimations){
			thisChar.innerHTML="<span style='position:absolute;display:inline-block;'>"+text[i]+"</span><span style='visibility:hidden'>"+text[i]+"</span>"; //we need inline-blocks for animation- BUT we need inlines for proper positioning! So we have a hidden inline text element, and a visible inline-block element positioned over it.
		}else{
			thisChar.innerHTML=text[i];
		}
		
		//This character is adding to the list of hidden eng.objects
		eng.charsHidden++;
		
		//Set the display time here
		thisChar.style.animation="kn-display 0s linear "+totalWait+"s forwards";
		
		//Add any animations necessary (some need to be on at all times to line up right)
		thisChar.dataset.animations=addAnimations;
		
		//Add the char to the document fragment
		fragment.appendChild(thisChar);
		
		totalWait+=waitTime;
	}
	
	//Add the chars to the textbox
	eng.textboxes[currentTextbox].appendChild(fragment);

	//REPLACE ANIMATION SETUPS WITH CLASSES CONTAINING THE ANIMATIONS (this will allow more customizability and simplify things greatly over here)//
	
	//Add animations that span the whole thing, so they're in sync
	var e=eng.textboxes[currentTextbox].children;
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
		
		//Add event listeners to each
		//On displaying, do this:
		e[i].addEventListener("animationstart",function(event){
			//If the animation ended on a child, don't continue! (animations are applied to children for text effects)
			if(this!=event.target){
				return;
			}
			
			//If the element's currently hidden (the animation that ended is for unhiding)
			if(this.style.visibility!="visible"){
				//Show the character and state that one less character is hidden.
				eng.charsHidden--;
				this.style.visibility="visible";
				
				//If animations are set up to be applied
				if(this.dataset.animations){
					this.children[0].classList.add("showpony-kn-char-"+this.dataset.animations);
				}
				
				//If there are no more eng.objects to show
				if(eng.charsHidden<1){
					if(!wait){
						eng.run();
					}
				}
				
				//Scroll to the newly displayed letter
				if(this.getBoundingClientRect().bottom>this.parentNode.getBoundingClientRect().bottom){
					this.parentNode.scrollTop+=this.getBoundingClientRect().height;
				}
			}
		});
		
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
		
			//If all letters are displayed
			if(eng.charsHidden<1){ //failsafe in case this value somehow goes negative
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
							//Remove the delay so they're displayed immediately
							eng.textboxes[key].children[i].style.animationDelay="0s";
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
function POST(onSuccess,formData){
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
		case ".if":
		case ".vn":
		case ".kn":
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
var waitForInput=false;

//The timer for waiting
var waitTimer=null;

//The type of file in use
var currentType=null;

//Whether or not we're moving the scrub bar
var scrubbing=false;

///////////////////////////////////////
//////////INITIALISE OBJECTS///////////
///////////////////////////////////////

var overlay=m("overlay")
	,editor=m("editor-ui")
	,overlayText=m("overlay-text")
	,progress=m("progress")
	,content=m("content");

var types={
	image:m("image","img")
	,audio:m("player","audio")
	,video:m("player","video")
	,multimedia:m("multimedia")
	,text:m("text")
}

var menuButton=m("menu-button showpony-button-preview","button"); menuButton.alt="Menu";
var fullscreenButton=document.createElement("button"); fullscreenButton.alt="Fullscreen"; fullscreenButton.className="showpony-fullscreen-button showpony-button-preview";
var captionsButton=document.createElement("button"); captionsButton.alt="Closed Captions/Subtitles"; captionsButton.className="showpony-captions-button";
frag([progress,overlayText],overlay)

//Objects
//Continue Notification
var continueNotice=m("continue");
continueNotice.innerHTML="...";

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

function getDurations(){
	eng.durations=[];
	eng.totalDuration=0;
	
	//Get lengths of all of the files
	var l=eng.files.length;
	for(let i=0;i<l;i++){
		switch(getMedium(eng.files[i])){
			case "video":
			case "audio":
				let thisMedia=document.createElement(getMedium(eng.files[i]));
			
				thisMedia.preload="metadata";
				thisMedia.src=(eng.files[i][0]=="x" ? "showpony/showpony-get-file.php?path="+eng.path+"&get="+eng.files[i] : eng.path+eng.files[i]);
				
				console.log(thisMedia.src);
				
				//Listen for media loading
				thisMedia.addEventListener(
					"loadedmetadata"
					,function(){
						console.log("Get duration of this!",thisMedia.duration);
						
						//Want to round up for later calculations
						eng.durations[i]=thisMedia.duration;
						eng.totalDuration+=thisMedia.duration;
						
						//if(overlay.classList.contains("showpony-overlay-visible")) eng.scrub();
					}
				);
				
				break;
			default:
				eng.durations[i]=eng.defaultDuration;
				eng.totalDuration+=eng.defaultDuration;
		}
	}
}

//If the window is statically positioned, set it to relative! (so positions of children work)
if(window.getComputedStyle(eng.window).getPropertyValue('position')=="static"){
	eng.window.style.position="relative";
}

//Empty the current window
eng.window.innerHTML="";

//And fill it up again!
frag([content,overlay,menuButton,fullscreenButton,editor],eng.window);

eng.window.classList.add("showpony");

//If querystrings are in use, consider the querystring in the URL
if(eng.query){
	
	window.addEventListener(
		"popstate"
		,function(){
			var page=window.location.href.match(new RegExp(eng.query+'[^&]+','i'));
			
			if(page){
				eng.time({"part":parseInt(page[0].split("=")[1])-1,"popstate":true});
			}
		}
	);
	
	var page=window.location.href.match(new RegExp(eng.query+'[^&]+','i'));
	
	//Add in the time if it needs it, otherwise pass nothing
	eng.time(
		page
		? {
			"part":parseInt(page[0].split("=")[1])-1,"popstate":true
		}
		: null
	);
}else{
	//Start
	eng.time();
}

///////////////////////////////////////
////////////EVENT LISTENERS////////////
///////////////////////////////////////

//On clicking, we open the menu- on the overlay. But we need to be able to disable moving the bar outside the overlay, so we still activate menu here.
window.addEventListener(
	"click"
	,function(event){
		event.stopPropagation();
		eng.menu(event);
	}
);

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
	
	var uploadName=m("editor-name","input");
	uploadName.type="text";
	uploadName.placeholder="Part Title (optional)";
	
	var uploadDate=m("editor-date","input");
	uploadDate.type="text";
	uploadDate.placeholder="YYYY-MM-DD HH:MM:SS";
	
	var newFile=m("new-file","button");
	
	var deleteFile=m("delete-file","button");
	
	var uploadFiles=document.createElement("input");
	uploadFiles.type="file";
	uploadFiles.style.display="none";
	
	var uploadFileButton=m("upload-file","label");
	uploadFileButton.appendChild(uploadFiles);
	
	var logoutButton=m("logout","button");
	
	frag([uploadFileButton,uploadDate,uploadName,deleteFile,newFile,logoutButton],editor);
	
	//Adjust display of header
	overlayText.addEventListener(
		"focus"
		,function(){
			overlayText.innerHTML="<p>"+eng.timeDisplay+"</p>";
		}
	);
	
	overlayText.addEventListener(
		"blur"
		,function(event){
			eng.timeDisplay=overlayText.children[0].innerHTML;
			eng.scrub();
		}
	);
	
	//Edit/adjust file details
	eng.window.addEventListener(
		"contextmenu"
		,function(event){
			event.preventDefault();
			console.log("Context menu!");
			eng.editor();
		}
	);
	
	eng.editor=function(){
		if(loggedIn){
			eng.window.classList.toggle("showpony-editor");
			
			eng.updateEditor();
		}else{
			eng.login();
		}
	}
	
	eng.updateEditor=function(){
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
	
	eng.login=function(tryCookie){
		var formData=new FormData();
		formData.append('call','login');
		formData.append('filePath',eng.path);
		
		//If try
		formData.append(
			'password'
			,(tryCookie ? null : prompt("What's your password?"))
		);
		
		POST(
			function(ajax){
				var response=JSON.parse(ajax.responseText);
				console.log(response);
				
				if(response.success){
					//If logged in successfully
					if(response.admin){
						loggedIn=true;
					
						if(!tryCookie){
							eng.editor();
						}
					}
					
					eng.files=response.files;
					getDurations();
				}else{
					alert(response.message);
				}
			}
			,formData
		);
	}
	
	eng.renameFile=function(){
		var thisFile=eng.currentFile;
		
		var date=uploadDate.value;
		
		//Test that the date is safe (must match setup)
		if(!date.match(/^\d{4}-\d\d-\d\d(\s\d\d:\d\d:\d\d)?$/)){
			eng.alert("Date must formatted as \"YYYY-MM-DD\" or \"YYYY-MM-DD HH-MM-SS\". You passed \""+date+"\"");
			return;
		}
		
		var fileName=date.replace(/:/g,';') //date (replace : with ; so it's Windows safe)
			+" ("+safeFilename(uploadName.value,"to")+")" //name
			+eng.files[thisFile].match(/\.\w+$/) //ext
		;
		
		//return;
		
		var formData=new FormData();
		formData.append('call',"renameFile");
		formData.append('filePath',eng.path);
		formData.append('name',eng.files[thisFile]);
		formData.append('newName',fileName);
		
		POST(
			function(ajax){
				var response=JSON.parse(ajax.responseText);
				
				if(response.success){
					eng.files[thisFile]=response.file;
					eng.scrub();
				}else{
					alert(response.message);
				}
			}
			,formData
		);
	}
	
	//EVENT LISTENERS//
	//On time, update the editor
	eng.window.addEventListener("time"
		,function(){
			eng.updateEditor();
		}
	);
	
	uploadName.addEventListener("change"
		,function(){
			eng.renameFile();
		}
	);
	
	uploadDate.addEventListener("change"
		,function(){
			eng.renameFile();
		}
	);
	
	uploadFiles.addEventListener("change"
		,function(){
			var thisFile=eng.currentFile;
		
			var formData=new FormData();
			formData.append('files',uploadFiles.files[0]);
			formData.append('call',"uploadFile");
			formData.append('filePath',eng.path);
			formData.append('name',eng.files[thisFile]);
			
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
				,formData
			);
		}
	);
	
	deleteFile.addEventListener("click"
		,function(){
			var thisFile=eng.currentFile;
		
			var formData=new FormData();
			formData.append('call',"deleteFile");
			formData.append('filePath',eng.path);
			formData.append('name',eng.files[thisFile]);
			
			POST(
				function(ajax){
					var response=JSON.parse(ajax.responseText);
					console.log(response);
					console.log(eng.currentFile,thisFile,eng.files.length);
					
					if(response.success){
						//Remove the file from the arrays
						eng.totalDuration-=eng.durations[thisFile];
						
						eng.durations.splice(thisFile,1);
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
				,formData
			);
		}
	);
	
	newFile.addEventListener("click"
		,function(){
			var formData=new FormData();
			formData.append('files',uploadFiles.files[0]);
			formData.append('call',"newFile");
			formData.append('filePath',eng.path);
			
			POST(
				function(ajax){
					var response=JSON.parse(ajax.responseText);
					console.log(response);
					
					if(response.success){
						//Add the file to the array
						eng.files.push(response.file);
						eng.durations.push(20);
						eng.totalDuration+=20;
						
						eng.time({part:"last"});
						eng.scrub();
					}else{
						alert(response.message);
					}
				}
				,formData
			);
		}
	);
	
	logoutButton.addEventListener("click"
		,function(){
			var formData=new FormData();
			formData.append('call','logout');
			formData.append('filePath',eng.path);
			
			POST(
				function(ajax){
					var response=JSON.parse(ajax.responseText);
					console.log(response);
					
					if(response.success){
						eng.editor();
						loggedIn=false;
						
						eng.files=response.files;
						getDurations();
					}else{
						alert(response.message);
					}
				}
				,formData
			);
		}
	);
	
	//Try logging in
	eng.login(true);
}else{
	//If not admin, do some things manually

	getDurations();
}

}