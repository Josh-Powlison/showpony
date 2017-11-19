//INTERACTIVE FICTION ENGINE//
function InteractiveFiction(inputObject){
	
	"use strict"; //Strict Mode
	
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
	
	//DEFAULT STYLES//
	eng.window.innerHTML="";
	eng.window.style.overflow="auto";
	
	//Functions//
	eng.run=function(){
		
		//If we've ended manually or reached the end, stop running immediately and end it all
		if(!eng || !eng.lines || eng.currentLine==eng.lines.length){
			
			//If there's another file to play, play it!
			if(eng.currentFile+1<inputObject.parts.length){
				console.log("Ending!");
				eng.next();
			}else{ //If we have more files, end	
				eng.end();
			}
			return;
		}

		var text=eng.lines[eng.currentLine];
		
		//Skip comment lines
		if(text[0]=='#'){
			//Go to the next line
			eng.currentLine++;
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
				
				//Replace the match with the data value
				text=text.replace(
					phMatch[i]
					,eng.data[varName[0]]
				);
				
				//console.log(text);
			}
		}
		
		//Consider special text calls
		switch(text.substring(0,3)){
			//Go to a place
			case "@GO":
				var goToLine=eng.lines.indexOf(text.substring(4));
				
				//If the line exists, go to it!
				if(goToLine>-1){
					eng.currentLine=goToLine+1;
					eng.run();
					return;
				}
				
				break;
			//End the novel
			case "@EN":
				eng.end();
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
				eng.currentLine++;
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
							eng.currentLine=goToLine+1;
							eng.run();
							
							//Exit the loop
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
				
				var readLine=eng.currentLine+1;
				
				//While the line has a dash before it
				while(eng.lines[readLine] && eng.lines[readLine][0]=='-'){
					var thisButton=document.createElement("button");
					thisButton.style.cssText=`
						width:10em;
						max-width:100%;
						display:block;
						text-align:left;
						margin:auto;
					`;
					
					console.log(readLine);
					
					var values=eng.lines[readLine].substr(1).split(/\s+(.+)/);
					
					let cur=values[0];
					
					//On clicking a button, go to the right place
					thisButton.addEventListener("click",function(){
						//Get rid of the buttons
						container.innerHTML=this.innerHTML;
						
						//Styles for player choices
						container.style.cssText=`
							font-weight:bold;
						`;

						//Progress
						eng.currentLine=eng.lines.indexOf(cur)+1;
						eng.run();
					});
					
					thisButton.innerHTML=values[1];
					
					container.appendChild(thisButton);
					
					readLine++;
				}
				
				eng.window.appendChild(container);
				
				return;
				break;
			default:
				eng.window.insertAdjacentHTML('beforeend','<p>'+text+'</p>');
				eng.currentLine++;
				eng.run();
			break;
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
		
		eng.currentLine=0;
		
		eng.objects={};
		eng.textboxes={};
		eng.waitTimer=null;

		ajax.addEventListener(
			"readystatechange"
			,function(event){
				if(ajax.readyState==4){
					if(ajax.status==200){
						//Get each line (taking into account and ignoring extra lines)
						eng.lines=ajax.responseText.match(/[^\r\n]+/g);
						
						//Remove the loading class
						if(inputObject.loadingClass) eng.window.classList.remove(inputObject.loadingClass);
						
						//Start it up!
						eng.run();
					}else{
						alert("Failed to load story "+inputFile);
					}
				}
			}
		);
	};
	
	//End the interactive fiction
	eng.end=function(){
		//Replace the container with the original element
		eng.window.parentNode.replaceChild(eng.originalWindow,eng.window);
		//Remove this object
		eng=null;
	}
	
	//Start the interactive fiction by loading the first file
	eng.loadFile(inputObject.parts[eng.currentFile]);
};