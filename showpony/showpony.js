function Showpony(input){
	"use strict";

	var eng=this;

	//Events
	var eventTime=new Event("time");
	
	//Set settings for the engine
	Object.assign(eng,{
		window:input.window
		,parts:input.parts || null
		,path:input.path || ""
		,loadingClass:input.loadingClass || null
		,scrubLoad:input.scrubLoad || false
		,currentFile:
			input.startAt=="first" ? 0
			: input.startAt=="last" ? input.parts.length-1
			: input.startAt!==undefined ? input.startAt
			: input.parts.length-1
		,query: input.query!==undefined ? input.query
			: "part"
		,timeDisplay: input.timeDisplay || "[0pc] | [0pl]"
		,data: input.data || {}
		,durations:[]
		,defaultDuration: input.defaultDuration || 20
		,totalDuration:0
		,originalWindow:input.window.cloneNode(true)
		,dateFormat:input.dateFormat || {
				year:"numeric"
				,month:"numeric"
				,day:"numeric"
				,hour:"numeric"
				,minute:"numeric"
			}
	});
	
	//Get lengths of all of the files
	for(let i in eng.parts){
		switch(getMedium(eng.parts[i])){
			case "video":
			case "audio":
				let thisMedia=document.createElement(getMedium(eng.parts[i]));
			
				thisMedia.preload="metadata";
				thisMedia.src=eng.path+eng.parts[i];
				
				//Listen for media loading
				thisMedia.addEventListener(
					"loadedmetadata"
					,function(){
						//Want to round up for later calculations
						eng.durations[i]=thisMedia.duration;
						eng.totalDuration+=thisMedia.duration;
					}
				);
				
				break;
			default:
				eng.durations[i]=eng.defaultDuration;
				eng.totalDuration+=eng.defaultDuration;
		}
	}
	
	//If the window is statically positiond, set it to relative! (so positions of children work)
	if(window.getComputedStyle(eng.window).getPropertyValue('position')=="static"){
		eng.window.style.position="relative";
	}
	
	eng.window.classList.add("showpony");
	
	/* //////////IDEA TO REDUCE BELOW CODE
	var ar=["overlay","progress","content"];
	for(let i in ar){
		eng[ar[i]]=document.createElement("div");
		eng[ar[i]].className="showpony-"+ar[i];
	}*/
	
	var overlay=document.createElement("div"); overlay.className="showpony-overlay";
	var overlayText=document.createElement("div"); overlayText.className="showpony-overlaytext";
	var progress=document.createElement("div"); progress.className="showpony-progress";
	var menuButton=document.createElement("button"); menuButton.alt="Menu"; menuButton.className="showpony-menu-button showpony-button-preview";
	var fullscreenButton=document.createElement("button"); fullscreenButton.alt="Fullscreen"; fullscreenButton.className="showpony-fullscreen-button showpony-button-preview";
	var captionsButton=document.createElement("button"); captionsButton.alt="Closed Captions/Subtitles"; captionsButton.className="showpony-captions-button";
	var content=document.createElement("div"); content.className="showpony-content";
	var book=document.createElement("img"); book.className="showpony-book";
	var audio=document.createElement("audio"); audio.className="showpony-player";
	var video=document.createElement("video"); video.className="showpony-player";
	
	//Whether the player is choosing between choices or not.
	var waitForInput=false;
	
	//Objects
	//Continue Notification
	eng.continue=document.createElement("div");
	eng.continue.style.innerHTML="...";
	eng.continue.className="showpony-continue";
	
	function Textbox(){
		this.el=document.createElement("div");
		this.el.className="showpony-textbox";
	}
	
	function Character(){
		var cha=this;
		cha.el=document.createElement("div");

		//DEFAULT STYLES//
		cha.el.className="showpony-character";
		
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
	
	function Background(){
		this.el=document.createElement("div");
		this.el.className="showpony-background";
		content.appendChild(this.el);
	};
	
	//A general-use object that doesn't fit anywhere else. Created if you call @ST on an uncreated element.
	function General(){
		this.el=document.createElement("div");
		content.appendChild(this.el);
	};
	
	function Audio(inputString){
		this.el=document.createElement("audio");
		
		//If an extension isn't specified, assume .mp3
		if(!inputString.match(/\.[^.]+$/)){
			inputString+=".mp3";
		}
		
		//DEFAULT eng.settings//
		this.el.src="resources/audio/"+inputString;
		this.el.preload=true;
		content.appendChild(this.el);
	};
	
	//Empty the current window
	eng.window.innerHTML="";
	
	overlay.appendChild(progress);
	overlay.appendChild(overlayText);
	eng.window.appendChild(content);
	eng.window.appendChild(overlay);
	eng.window.appendChild(menuButton);
	eng.window.appendChild(fullscreenButton);
	
	var currentType=null;
	
	eng.time=function(obj){
		//If inputPart is set
		if(obj && typeof(obj.part)!==undefined){
			//Use different options
			switch(obj.part){
				case "first": eng.currentFile=0; break;
				case "prev": eng.currentFile--; break;
				case "next": eng.currentFile++; break;
				case "last": eng.currentFile=eng.parts.length-1; break;
				default:
					//Get the part, or 0 if it's undefined
					eng.currentFile=parseInt(obj.part ? obj.part : 0);
					break;
			}
		}
		
		//If we're at the end, return
		if(eng.currentFile>=eng.parts.length){
			eng.currentFile=eng.parts.length-1;
			return;
		}
		
		if(eng.currentFile<0){
			eng.currentFile=0;
			return;
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
		
		eng.window.dispatchEvent(eventTime);
		
		//If we aren't moving the bar, update the overlay
		if(eng.moveBar===false){
			eng.scrub();
		}
		
		//Go to the top of the page
		eng.window.scrollIntoView();
		
		var newType=getMedium(eng.parts[eng.currentFile]);
		
		//Multimedia engine resets
		eng.lines=null;
		eng.charsHidden=0;
		eng.currentLine=0;
		eng.waitTimer=null;
		content.style.cssText=null; //Remove any styles applied to the content
		waitForInput=false;
		
		//Display the medium based on the file extension
		switch(newType){
			case "image":
				//If the previous type was different, empty the div and use this one
				if(currentType!=newType){
					content.innerHTML="";
					content.appendChild(book);
					
					//Use the content class for books
					content.className="showpony-content-book";
				}
				
				//Adjust the source
				book.src=eng.path+eng.parts[eng.currentFile];
				break;
			case "video":
				if(currentType!=newType){
					content.innerHTML="";
					content.appendChild(video);
					
					//Use the general content class
					content.className="showpony-content";
				}
				
				//Adjust the source
				video.src=eng.path+eng.parts[eng.currentFile];
				
				if(overlay.style.visibility=="hidden") video.play();
				
				//When the player's finished with a file
				video.addEventListener(
					"ended"
					,function(){
						//If we're scrubbing the media, don't check for ended (this can trigger and interrupt our media scrubbing)
						if(overlay.style.visibility=="visible") return;
						
						eng.time({"part":"next"});
					}
				);
				break;
			case "audio":
				if(currentType!=newType){
					content.innerHTML="";
					content.appendChild(audio);
					
					//Use the general content class
					content.className="showpony-content";
				}
				
				//Adjust the source
				audio.src=eng.path+eng.parts[eng.currentFile];
				
				if(overlay.style.visibility=="hidden") audio.play();
				
				//When the player's finished with a file
				audio.addEventListener(
					"ended"
					,function(){
						//If we're scrubbing the media, don't check for ended (this can trigger and interrupt our media scrubbing)
						if(overlay.style.visibility=="visible") return;
						
						eng.time({"part":"next"});
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
				
				AJAX(
					function(ajax){
						//Get each line (taking into account and ignoring extra lines)
						eng.lines=ajax.responseText.match(/[^\r\n]+/g);
						
						content.className="showpony-content-multimedia";
						
						eng.run(0);
					}
				);
				break;
			case "text":
				content.innerHTML="";
				
				//Use the general content class
				content.className="showpony-content";
				
				AJAX(
					function(ajax){
						content.innerHTML=ajax.responseText;
					}
				);
				break;
			default:
				alert("Extension not recognized or supported!");
				break;
		}
		
		//Track the file type used here for when we next switch
		currentType=getMedium(eng.parts[eng.currentFile]);
	}
	
	var moveBar=false;
	
	//On clicking
	eng.menu=function(event){
		//If we're moving the bar right now, ignore clicking but do set moveBar to false
		
		if(moveBar===true){
			moveBar=false;
		
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
			if(overlay.style.visibility=="visible"){
				overlay.style.visibility="hidden";
				menuButton.classList.add("showpony-button-preview");
				fullscreenButton.classList.add("showpony-button-preview");
				
				if(currentType=="audio"){
					audio.play();
				}else if(currentType=="video"){
					video.play();
				}
			}else{
				eng.scrub();
				overlay.style.visibility="visible";
				menuButton.classList.remove("showpony-button-preview");
				fullscreenButton.classList.remove("showpony-button-preview");
				
				if(currentType=="audio"){
					audio.pause();
				}else if(currentType=="video"){
					video.pause();
				}
			}
		}
		
		moveBar=false;
	};
	
	//Update the time by a percentage
	eng.scrub=function(inputPercent){
		//If no inputPercent was passed, estimate it
		if(typeof(inputPercent)==='undefined'){
			var currentTime=0;
			
			//Set currentTime differently if we can measure it
			if(currentType=="video"){
				currentTime=video.currentTime;
			}else if(currentType=="audio"){
				currentTime=audio.currentTime;
			}
		
			//Look through the videos for the right one
			for(var i=0;i<eng.currentFile;i++){
				//Add the times of previous videos to get the actual time in the piece
				currentTime+=eng.durations[i];
			}
			
			var inputPercent=currentTime / eng.totalDuration;
			console.log(currentTime);
			
			var newPart=eng.currentFile;
		}
		else //if inputPercent WAS passed
		{
		
			//Clamp inputPercent between 0 and 1
			inputPercent= inputPercent <= 0 ? 0 : inputPercent >= 1 ? 1 : inputPercent;
			
			//Go to the time
			var newTime=eng.totalDuration*inputPercent;
			progress.style.left=(inputPercent*100)+"%";

			var newPart=0;
			
			//Look through the media for the right one
			for(var i=0;i<eng.durations.length;i++){
				//If the duration's beyond this one, go to the next one (and subtract the duration from the total duration)
				if(newTime>=eng.durations[i]){
					console.log("Different media!");
					newTime-=eng.durations[i];
				}
				else
				{ //If this is the media!
					console.log("Same media!");
			
					//If we allow scrubbing or we're not moving the bar, we can load the file
					if(eng.scrubLoad!==false || moveBar===false){
						if(i!==eng.currentFile){
							eng.time({"part":i});
						}else{
							
						}
					}
					
					if(i==eng.currentFile){
						//Set the time properly
						if(currentType=="video"){
							video.currentTime=newTime;
						}else if(currentType=="audio"){
							audio.currentTime=newTime;
						}
					}
					newPart=i;
				
					break;
				}
			}
		}
		
		var current=Math.floor(inputPercent*eng.totalDuration);
		var left=eng.totalDuration-Math.floor(inputPercent*eng.totalDuration);
		var floorValue=1;
		
		function adjustReplace(input){
			//Name
			if(input[1]=="n"){
				//Get the name, remove the parentheses
				var name=eng.parts[newPart].match(/\(.*\)/);
				
				//If there's a name, return it; otherwise, return blank space
				if(name){
					return name[0].replace(/(\(|\))/g,'');
				}else{
					return "";
				}
			}else if(input[1]=="d"){
				//Get the name, remove the parentheses
				var date=eng.parts[newPart].match(/[^\(\.]+/);
				
				//If there's a date, return it; otherwise, return blank space
				if(date){
					date=date[0].split(/[\s-]+/);
					
					date=new Date(
						date[0]			//Year
						,date[1]-1 || 0	//Month
						,date[2] || 0	//Date
						,date[3] || 0	//Hours
						,date[4] || 0	//Minutes
						,date[5] || 0	//Seconds
						,date[6] || 0	//Milliseconds
					); //+" 00:00:00 UTC"
					
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
				//Pass a calculation based on whether the number of parts left, total, or the number of the current part was asked for
				floorValue=
					input[3]=="l" ? eng.parts.length-(newPart+1)
					: input[3]=="t" ? eng.parts.length
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
	
	//Close ShowPony
	eng.end=function(){
		//Replace the container with the original element
		
		//Reset the window to what it was before
		eng.window.parentNode.replaceChild(eng.originalWindow,eng.window);
		//Remove this object
		eng=null;
	}
	
	//If querystrings are in use, consider the querystring in the URL
	if(eng.query){
		
		window.addEventListener(
			"popstate"
			,function(){
				var regex=new RegExp(eng.query+'[^&]+','i');
				
				var page=window.location.href.match(regex);
				
				if(page){
					eng.time({"part":parseInt(page[0].split("=")[1])-1,"popstate":true});
				}
				
			}
		);
		
		var regex=new RegExp(eng.query+'[^&]+','i');
		
		var page=window.location.href.match(regex);
		
		//If the value is already in the header
		if(page){
			eng.time({"part":parseInt(page[0].split("=")[1])-1,"popstate":true});
		//If the value's not in the header, default
		}else{
			eng.time();
		}
	}else{
		//Start
		eng.time();
	}
	
	//Toggle fullscreen
	eng.fullscreen=function(type){
		
		//Normal
		if(eng.window.requestFullscreen){
			if(document.fullscreenElement){
				document.exitFullscreen();
			}else{
				eng.window.requestFullscreen();
			}
			
			return;
		}
		
		//Webkit
		if(eng.window.webkitRequestFullscreen){
			console.log("First check...");
			if(document.webkitFullscreenElement){
				document.webkitExitFullscreen();
			}else{
				eng.window.webkitRequestFullscreen();
			}
			
			return;
		}
		
		//Mozilla
		if(eng.window.mozRequestFullScreen){
			if(document.mozFullScreenElement){
				document.mozCancelFullScreen();
			}else{
				eng.window.mozRequestFullScreen();
			}
			
			return;
		}
		
		//IE
		if(eng.window.msRequestFullscreen){
			if(document.msFullscreenElement){
				document.mozCancelFullScreen();
			}else{
				eng.window.msRequestFullscreen();
			}
			
			return;
		}
		
	}
	
	//Make an AJAX call
	function AJAX(onSuccess){
		//Add loadingClass
		if(eng.loadingClass){
			eng.window.classList.add(eng.loadingClass);
		}
		
		var ajax=new XMLHttpRequest();
		ajax.open("GET",eng.path+eng.parts[eng.currentFile]);
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
						alert("Failed to load file called: "+eng.path+eng.parts[eng.currentFile]);
					}
				}
			}
		);
	}
	
	//Functions//
	eng.run=function(inputNum){
		
		//If a specific line isn't specified, go to the next one
		if(typeof(inputNum)==='undefined'){
			eng.currentLine++;
		}else{
			//If a line was specified, go to it
			eng.currentLine=inputNum;
		}
		
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
		var phMatch=text.match(/\[[^\]]+\]/g);
		
		if(phMatch){
			console.log(phMatch);
			for(var i=0;i<phMatch.length;i++){
				//Get the var name
				var varName=phMatch[i].match(/[^\[\]]+/);
				
				console.log(varName,eng.data[varName[0]]);
				
				//Replace the match with the data value
				text=text.replace(
					phMatch[i]
					,eng.data[varName[0]]
				);
				
				console.log(text);
			}
		}
		
		//Consider special text calls
		switch(text.substring(0,3)){
			//Character
			case "@CH":
			//Background
			case "@BG":
				var type=text.substring(0,3);
			
				var values=text.substring(4);
				
				//Get the name
				var name=values.match(/[^(]+/)[0];
				//Get the folder, which is the name without anything after a hash
				var folder=name.split('#')[0];

				//If an object with that name doesn't exist
				if(!eng.objects[name]){
					//Add them in!
					eng.objects[name]=new (type=="@CH" ? Character : Background)();
				}
				
				var images=(type=="@CH" ? [] : '');
				
				//images will be either an array or a string
				var imageNames=values.match(/\(.+\)/);
				
				if(imageNames){
					//Get all the values (colors, etc) out of here as possible
					imageNames=imageNames[0].slice(1,-1).match(/([^(,]+\([^\)]+\)|[^,]+)/g);
					
					for(var i=0;i<imageNames.length;i++){
						
						if(type=="@CH")
						{
							//If there's no extension set, assume .png 
							if(!imageNames[i].match(/\.[^\.]+$/)){
								imageNames[i]+=".png";
							}
							
							images.push("url('resources/characters/"+folder+"/"+imageNames[i]+"')");
						}
						else
						{
							if(i>0){
								images+=',';
							}
							
							//If it's a color or gradient, treat it as such
							if(imageNames[i].match(/(#|gradient\(|rgb\(|rgba\()/)){
								eng.objects[name].el.style.backgroundColor=imageNames[i];
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
					}
					
					//Adding the background images
					if(type=="@CH"){
						
						//Go through each image and add a div
						for(var i=0;i<images.length;i++){
							//If the image already exists
							var found=false;
							
							//If the layer exists
							if(eng.objects[name].el.children[i]){
								//If this value doesn't exist in the layer
								
								var search=eng.objects[name].el.children[i].children;
								
								for(var ii=0;ii<search.length;ii++){
									
									if(search[ii].style.backgroundImage==images[i]){
										found=true;
										search[ii].style.opacity=1;
									}else{
										search[ii].style.opacity=0;
									}
								}
							}
							
							if(!found){
								eng.objects[name].imgDiv(i,images[i]);
							}
						}
					}else{
						eng.objects[name].el.style.backgroundImage=images;
					}
				}
				
				if(type=="@CH"){
					//Adjust the position (if a position is set)
					if(values.match(/\S+%/)){
						eng.objects[name].el.style.left=values.match(/\S+%/)[0];
					}
				}
				else
				{
					
					//Adjust the z-index (if a z-index is set)
					if(values.match(/\s\d+$/)){
						eng.objects[name].el.style.zIndex=values.match(/\s\d+$/)[0];
					}
				}
				
				//Go to the next line
				eng.run();
				return;
				break;
			//Styles
			case "@ST":
				var values=text.substring(4);
				
				//Get the name
				var name=values.match(/[^{]+/);
			
				//If it's a general element
				if(name!="window"){
					//The type of element
					var type=eng.objects;
				
					//If this element doesn't exist in eng.objects
					if(!eng.objects[name]){
						//It's a textbox
						type=eng.textboxes;
						//Unless it doesn't exist in eng.textboxes...
						if(!eng.textboxes[name]){
							//In which case, create a new general object for it!
							eng.objects[name]=new General();
						}
					}
					type[name].el.style.cssText+=values.match(/\{[^}]+/)[0].replace('{','');
				}else{ //They're adjusting window styles
					content.style.cssText+=values.match(/\{[^}]+/)[0].replace('{','');
				}
				
				//Go to the next line
				eng.run();
				return;
				break;
			//Audio
			case "@AU":
				var values=text.substring(4).split(" ");
				
				var name=values[0];
			
				//If the audio doesn't exist
				if(!eng.objects[name]){
					//Add them in!
					eng.objects[name]=new Audio(name);
				}
				
				//Go through the passed parameters and apply them
				for(var i=1;i<values.length;i++){
					switch(values[i]){
						case "loop":
							eng.objects[name].el.loop=true;
							break;
						case "play":
							eng.objects[name].el.play();
							break;
						case "pause":
							eng.objects[name].el.pause();
							break;
						case "stop":
							eng.objects[name].el.currentTime=0;
							eng.objects[name].el.pause();
							break;
					}
				}
				
				//Go to the next line
				eng.run();
				return;
				break;
			//Wait for reader input before continuing
			case "@WT":
				//If a value was included, wait 
				if(text.match(/\d+/)){
					
					//If there's a eng.waitTimer, clear it out
					if(eng.waitTimer!=null){
						clearTimeout(eng.waitTimer);
						eng.waitTimer=null;
					}
					
					var waitTime=parseFloat(text.match(/\d+/)[0])*1000;
					
					console.log(waitTime);
					
					//Set a wait timer (continue after wait)
					eng.waitTimer=setTimeout(eng.run,waitTime);
				}
			
				return;
				break;
			//Go to a place
			case "@GO":
				var goToLine=eng.lines.indexOf(text.substring(4));
				
				//If the line exists, go to it!
				if(goToLine>-1){
					eng.run(goToLine+1);
					return;
				}
				
				break;
			//End the novel
			case "@EN":
				eng.run(eng.lines.length);
				return;
				break;
			//Set data
			case "@DS":
				var values=text.substring(4).split(/\s+/g);
				
				//If the variable is already set, get its current value
				if(typeof(eng.data[values[0]])!=='undefined'){
					var curValue=eng.data[values[0]];
				}
				
				//Increment
				if(values[1]=="++"){
					eng.data[values[0]]=parseFloat(curValue)+1;
				}
				//Decrement
				else if(values[1]=="--")
				{
					eng.data[values[0]]=parseFloat(curValue)-1;
				}
				//Increase by
				else if(values[1].match(/^\+(\d|\.|\,)+$/))
				{
					eng.data[values[0]]=parseFloat(curValue)+parseFloat(values[1].match(/(\d|\.|\,)+$/));
				}
				//Decrease by
				else if(values[1].match(/^\-(\d|\.|\,)+$/))
				{
					eng.data[values[0]]=parseFloat(curValue)-parseFloat(values[1].match(/(\d|\.|\,)+$/));
				}
				else
				{
					//Set the data value
					eng.data[values[0]]=values[1];
				}
				
				console.log(eng.data);
				
				//Go to the next line
				eng.run();
				return;
				
				break;
			case "@IF":
				//Get the var, the values, and the goTo position
				var checkVar=text.substring(4);
				var checkValues=eng.lines[eng.currentLine+1].split(/\s+/g);
				var goTos=eng.lines[eng.currentLine+2].split(/\s+/g);
				
				console.log(checkVar,eng.data[checkVar]);
				
				//If the object exists
				if(typeof eng.data[checkVar]!=='undefined'){
					//Go through all the values it could be and check for them (if none match, we're just displaying this line as text
					for(var i=0;i<checkValues.length;i++){
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
			case "@IN":
				
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
			case "@TB":
				var values=text.substring(4);
				
				//Get the current textbox
				var currentTextbox=values.match(/\S+/)[0];
				
				//If the textbox hasn't been created, create it!
				if(!eng.textboxes[currentTextbox]){
					eng.textboxes[currentTextbox]=new Textbox();;
				}
				
				//Get the text to display
				text=values.replace(/\S+\s?/,'');
				
				//Turn off automatic waiting for this, we're assuming waiting is off
				eng.wait=false;
				
				//If there's nothing passed, clear the current textbox
				if(text==''){
					eng.textboxes[currentTextbox].el.innerHTML="";
					
					eng.run();
					return;
				}
				
				break;
			//The default will adjust the main textbox
			default:
				//If the main textbox hasn't been created, create it!
				if(!eng.textboxes["main"]){
					eng.textboxes["main"]=new Textbox();;
				}
				
				//Clear old textbox first//
				eng.textboxes["main"].el.innerHTML="";
				
				//Assume several values
				currentTextbox="main";
				eng.wait=true;
				
				break;
		}
		
		//NORMAL LINE
		
		//STEP 2: Design the text//
		
		//Design defaults
		var charElementDefault=document.createElement("span");
		charElementDefault.style.cssText=`
			visibility:hidden;
			font-size:1em;
			color:inherit;
			font-weight:inherit;
			font-style:inherit;
		`;
		
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
		
		for(var i=0;i<text.length;i++){	
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
						if(values[0].length>0){
							charElement.style.fontSize=values[0]+"em";
						}
						
						//Speed of the text
						if(values[1].length>0){
							baseWaitTime=parseFloat(values[1]);
						}
						
						//Color
						if(values[2].length>0){
							charElement.style.color=values[2];
						}
						
						//Effect
						if(values[3].length>0){
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
					//charElement.style.color="#0f0";
					
					//Pass over the closing bracket
					continue;
					break;
				//Lines breaks
				case '#':
					var br=document.createElement("br");
					eng.textboxes[currentTextbox].el.appendChild(br);
					
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
			thisChar.innerHTML="<span style='position:absolute;display:inline-block;'>"+text[i]+"</span><span style='visibility:hidden'>"+text[i]+"</span>"; //we need inline-blocks for animation- BUT we need inlines for proper positioning! So we have a hidden inline text element, and a visible inline-block element positioned over it.
			
			//This character is adding to the list of hidden eng.objects
			eng.charsHidden++;
			
			//Set the display time here
			thisChar.style.animation="kn-display 0s linear "+totalWait+"s forwards";
			
			//Add any animations necessary (some need to be on at all times to line up right)
			thisChar.dataset.animations=addAnimations;
			
			//Add the char to the textbox
			eng.textboxes[currentTextbox].el.appendChild(thisChar);
			
			totalWait+=waitTime;
		}

		//Add animations that span the whole thing, so they're in sync
		var e=eng.textboxes[currentTextbox].el.children;
		for(var i=0;i<e.length;i++){
			let localI=i;
			
			switch(e[i].dataset.animations){
				case "sing":
					e[i].children[0].style.animation="kn-sing 1.5s ease-in-out -"+(i/20)+"s infinite";
					break;
				case "shake":
					e[i].children[0].style.animation="kn-shake .2s linear -"+Math.random()+"s infinite";
					break;
				case "scramble":
					e[i].classList.add("kn-scramble");
					console.log(e[i],"scramble");
					break;
			}
			
			//Add event listeners to each
			//On displaying, do this:
			e[i].addEventListener("animationstart",function(event){
				//If the animation ended on a child, don't continue! (animations are applied to children for text effects)
				if(this!=event.target){
					return;
				}
				
				//If the element's currently hidden (the animation that ended is for unhiding)
				if(this.style.visibility=="hidden"){
					//Show the character and state that one less character is hidden.
					eng.charsHidden--;
					this.style.visibility="visible";
					//Remove the animation- so we can add others!
					this.style.animation="";
					
					//Add any animations necessary
					switch(this.dataset.animations){
						case "shout":
							this.children[0].style.animation="kn-shout .1s linear forwards";
							break;
						case "fade":
							this.children[0].style.animation="kn-fade 1s linear forwards";
							break;
						case "blur":
							this.children[0].style.animation="kn-blur 1s linear forwards";
							break;
						case "glitch":
							this.children[0].style.animation="kn-glitch 1s linear infinite";
							break;
						case "smoke":
							this.children[0].style.animation="kn-smoke"+(localI%2 ? "-mirror" :"")+" 1s ease forwards";
							break;
						default:
							break;
					}
					
					//If there are no more eng.objects to show
					if(eng.charsHidden<1){
						if(!eng.wait){
							eng.run();
						}
					}
					
					//Scroll to the letter
					//this.scrollIntoView();
				}
			});
			
		}
		
		//STEP 3: Format the text//
		//Nothing tricky here, the browser will automatically lay it out. We just have to put the textbox where it goes:
		content.appendChild(eng.textboxes[currentTextbox].el);

		//STEP 4: Display the text//
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
				if(waitForInput){
					return;
				};
			
				//If a wait timer was going, stop it.
				if(eng.waitTimer!=null){
					clearTimeout(eng.waitTimer);
					eng.waitTimer=null;
				}
			
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
							for(var i=0;i<eng.textboxes[key].el.children.length;i++){
								//Remove the delay so they're displayed immediately
								eng.textboxes[key].el.children[i].style.animationDelay="0s";
							}
						}
					);
				}
				break;
		}
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
				return "text";
				break;
			default:
				return null
				break;
		}
	}
	
	//EVENT LISTENERS//
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
			
			moveBar=event.clientX;
		}
	);
	
	//On dragging
	window.addEventListener(
		"mousemove"
		,function(event){
			
			//Only read mousemove over the overlay
			//if(event.target!==this) return;
			
			if(moveBar===false){
				return;
			}
			
			if(moveBar!==true){
				if(Math.abs(moveBar-event.clientX)>screen.width/100){
					moveBar=true;
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
			
			if(moveBar===false){
				moveBar=event.changedTouches[0].clientX;
			}
			
			//You have to swipe farther than you move the cursor to adjust the position
			if(moveBar!==true){
				if(Math.abs(moveBar-event.changedTouches[0].clientX)>screen.width/20){
					moveBar=true;
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
			if(moveBar===true){
				moveBar=false;
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
			
			//moveBar needs to be set to false here too; either way it's false, but we need to allow the overlay to update above, so we set it to false earlier too.
			moveBar=false;
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
			
		}
	);
	
	content.addEventListener(
		"click"
		,function(){
			eng.input();
		}
	);
}