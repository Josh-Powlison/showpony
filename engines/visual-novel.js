//VISUAL NOVEL ENGINE//
function VisualNovel(inputObject){
	"use strict"; //Strict Mode
	
	console.log(inputObject);
	
	//Need to set a variable to keep "this" separate from children's "this"
	var eng=this;

	//Variables//
	eng.window=inputObject.window;	
	eng.currentFile=0;
	//Save the original parent
	eng.originalWindow=eng.window.cloneNode(true);
	eng.data={};
		
	//Remove the onclick event that set up this kn-engine
	eng.window.onclick=null;
	eng.window.style.cursor="pointer";
	
	//DEFAULT STYLES//
	//If the window is statically positiond, set it to relative! (so positions of children work)
	if(window.getComputedStyle(eng.window).getPropertyValue('position')=="static"){
		eng.window.style.position="relative";
	}
	
	//Whether the player is choosing between choices or not.
	eng.choices=false;
	
	//Continue Notification
	eng.continue=document.createElement("div");
	eng.continue.style.innerHTML="...";
	eng.continue.style.cssText=`
		color:white;
		background-color:red;
		position:fixed;
		right:0;
		bottom:0;
		z-index:1000;
	`;
	
	//eng.objects//
	function Textbox(){
		var tb=this;
		
		tb.el=document.createElement("div");
		
		tb.el.style.cssText=`
			width:100%;
			background-color:rgba(0,0,0,.8);
			box-sizing:border-box;
			color:#fff;
			font-family:Arial;
			z-index:100;
			position:absolute;
			bottom:0;
			padding:1em;
			height:5em;
			max-height:100%;
			overflow:auto;
			opacity:1;
			transition:all 1s;
			
			user-select:none;
			-webkit-user-select:none;
			-ms-user-select:none;
			-moz-user-select:none;
		`;
	}
	
	function Character(){
		var cha=this;
		
		//On initial creation, set up settings and put into doc
		
		cha.el=document.createElement("div");

		//DEFAULT STYLES//
		cha.el.style.cssText=`
			width:100%;
			height:90%;
			bottom:0%;
			left:0%;
			position:absolute;
			transition:1s left;
			z-index:0;
		`;
		
		//Add a backgroundImage
		cha.imgDiv=function(inputLayer,inputBackground){
			var thisImg=document.createElement("div");
			
			thisImg.style.cssText=`
				width:100%;
				height:100%;
				position:absolute;
				background-image:`+inputBackground+`;
				background-position:50% -20%;
				background-repeat:no-repeat;
				background-size:contain;
				opacity:1;
			`;
			
			//If the layer doesn't exist, add it in
			if(!cha.el.children[inputLayer]){
				var newLayer=document.createElement("div");
				newLayer.style.cssText=`
					width:100%;
					height:100%;
					position:absolute;
				`;
				
				cha.el.appendChild(newLayer);
			}
			
			cha.el.children[inputLayer].appendChild(thisImg);
		}
		
		eng.window.appendChild(cha.el);
	};
	
	function Background(){
		var bg=this;
		bg.el=document.createElement("div");
		
		//DEFAULT STYLES//
		bg.el.style.cssText=`
			width:100%;
			height:100%;
			z-index:-100;
			position:absolute;
			background-position:50% 50%;
			background-repeat:no-repeat;
			background-size:cover;
			transition:all 1s;
		`;
		
		eng.window.appendChild(bg.el);
	};
	
	//A general-use object that doesn't fit anywhere else. Created if you call @ST on an uncreated element.
	function General(){
		var ge=this;
		ge.el=document.createElement("div");
		eng.window.appendChild(ge.el);
	};
	
	function Audio(inputString){
		var au=this;
		au.el=document.createElement("audio");
		
		//If an extension isn't specified, assume .mp3
		if(!inputString.match(/\.[^.]+$/)){
			inputString+=".mp3";
		}
		
		//DEFAULT SETTINGS//
		au.el.src="resources/audio/"+inputString;
		au.el.preload=true;
		eng.window.appendChild(au.el);
	};
	
	//Event Listeners//
	eng.window.addEventListener("click",function(){eng.input(eng);});
	
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
		if(!eng || !eng.lines || eng.currentLine==eng.lines.length){
			
			//If there's another file to play, play it!
			if(eng.currentFile+1<inputObject.parts.length){
				console.log("Ending!");
				eng.currentFile++;
				eng.loadFile(inputObject.parts[eng.currentFile]);
			}else{ //If we have more files, end	
				eng.end();
			}
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
					eng.window.style.cssText+=values.match(/\{[^}]+/)[0].replace('{','');
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
				//var values=text.substring(4).split(/\s+/g);
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
				
				//Make a container for the choices
				var container=document.createElement("div");
				container.style.cssText=`
					position:absolute;
					left:0;
					right:0;
					top:0;
					bottom:2em;
					display:flex;
					flex-direction:column;
					align-items:center;
					align-content:center;
					justify-content:center;
					z-index:1000;
				`;
				
				var readLine=eng.currentLine+1;
				
				//While the line has a dash before it
				while(eng.lines[readLine] && eng.lines[readLine][0]=='-'){
					var thisButton=document.createElement("button");
					thisButton.className="kn-choice";
					thisButton.style.cssText=`
						font-size:1em;
						width:10em;
						max-width:100%;
					`;
					
					console.log(readLine);
					
					var values=eng.lines[readLine].substr(1).split(/\s+(.+)/);
					
					let cur=values[0];
					
					//On clicking a button, go to the right place
					thisButton.addEventListener("click",function(event){
						event.stopPropagation();
						
						//Progress
						eng.run(eng.lines.indexOf(cur)+1);
						
						eng.choices=null;
						
						//Get rid of the buttons
						eng.window.removeChild(container);
					});
					
					thisButton.innerHTML=values[1];
					
					container.appendChild(thisButton);
					
					readLine++;
				}
				
				eng.choices=container;
				
				eng.window.appendChild(container);
				
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
				text=values.replace(/\S+\s*/,'');
				
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
		eng.window.appendChild(eng.textboxes[currentTextbox].el);

		//STEP 4: Display the text//
	}
	
	//When the viewer inputs for the story to progress
	eng.input=function(){
		//If the player is making choices right now
		if(eng.choices){
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
	}
	
	eng.loadFile=function(inputFile){
		//Load the file; on load, run the engine
		var ajax=new XMLHttpRequest();
		ajax.open("GET","stories/"+inputFile+".txt");
		ajax.send();
		
		console.log(eng);
		
		//Add the loading class, if one was passed.
		if(inputObject.loadingClass) eng.window.classList.add(inputObject.loadingClass);
		
		eng.charsHidden=0;
		eng.currentLine=0;
		
		eng.objects={};
		eng.textboxes={};
		eng.waitTimer=null;
		
		eng.window.appendChild(eng.continue);

		ajax.addEventListener(
			"readystatechange"
			,function(event){
				if(ajax.readyState==4){
					if(ajax.status==200){
						
						//Get each line (taking into account and ignoring extra lines)
						eng.lines=ajax.responseText.match(/[^\r\n]+/g);
						
						//Empty the window div, replacing it with a style tag filled with animations!
						eng.window.innerHTML=`
							<style>
								@keyframes kn-display{
									0% {visibility:hidden;}
									100% {visibility:visible;}
								}
								
								@keyframes kn-fade{
									0% {opacity:0;}
									100% {opacity:1;}
								}
								
								@keyframes kn-shout{
									0% {transform:scale(2);}
									100% {transform:scale(1);}
								}
								
								@keyframes kn-sing{
									0% {transform:translate(0,-.2em);}
									50% {transform:translate(0,.2em);}
									100% {transform:translate(0,-.2em);}
								}
								
								@keyframes kn-shake{
									0% {transform:translate(.05em,.125em);} 
									25% {transform:translate(-.05em,-.125em);}
									50% {transform:translate(-.05em,.125em);} 
									75% {transform:translate(.05em,-.125em);} 
									100% {transform:translate(.05em,.125em);}
								}
								
								@keyframes kn-smoke {
								  0% {
									transform:
									  translate(-.5em,-1.5em)
									  rotate(-40deg)
									  skewX(80deg)
									  scale(2);
									opacity: 0;
									filter:blur(.5em);
								  }
								  to {
									transform:none;
									opacity:1;
									filter:blur(0em);
								  }
								}
								
								@keyframes kn-blur {
								  0% {
									opacity:0;
									filter:blur(.5em);
								  }
								  to {
									opacity:1;
									filter:blur(0em);
								  }
								}
								
								@keyframes kn-smoke-mirror {
								  0% {
									transform:
									  translate(.5em,-1.5em)
									  rotate(40deg) 
									  skewX(-80deg)
									  scale(2);
									opacity: 0;
									filter:blur(.5em)
								  }
								  to {
									transform:none;
									opacity:1;
									filter:blur(0em);
									}
								}
								
								@keyframes kn-glitch{
									0% {transform:;}
									100% {opacity:1;}
								}
								
								@keyframes scramble{
									0%{content:'*';visibility:visible;}
									10%{content:'1';}
									20%{content:'/';}
									30%{content:'0';}
									40%{content:'?';}
									50%{content:'1';}
									60%{content:'@';}
									70%{content:'!';}
									80%{content:'&';}
									90%{content:'$';}
								}
								
								.kn-scramble::before{
									visibility:hidden;
									content:'L';
									animation:scramble 1s 1;
									position:absolute;
								}
							</style>
						`;				
						
						//Make text bigger than normal
						eng.window.style.cssText+=`
							font-size:2em;
							overflow:hidden;
							cursor:pointer;
						`;
						
						//Remove the loading class, if one was passed.
						if(inputObject.loadingClass) eng.window.classList.remove(inputObject.loadingClass);
						
						//Start it up!
						eng.run(0);
					}else{
						alert("Failed to load story "+inputFile);
					}
				}
			}
		);
	};
	
	//End the kinetic novel
	eng.end=function(){
		//Replace the container with the original element
		
		//Reset the window to what it was before
		eng.window.parentNode.replaceChild(eng.originalWindow,eng.window);
		//Remove this object
		eng=null;
	}
	
	//Go to a specific place
	eng.time=function(inputNum){
		eng.run(inputNum);
	}
	
	//Start the kinetic novel by loading the first file
	eng.loadFile(inputObject.parts[eng.currentFile]);
};