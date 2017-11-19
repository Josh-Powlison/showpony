//BOOK ENGINE
function Book(settings){
	"use strict"; //Strict Mode
	
	//Events
	var eventTime=new Event('time');
	
	//Need to set a variable to keep "this" separate from children's "this"
	var eng=this;
	
	eng.overlay=document.createElement("div");
	eng.overlay.style.cssText=`
		position:absolute;
		left:0;
		top:0;
		right:0;
		bottom:0;
		background-color:rgba(0,0,0,.75);
		visibility:hidden;
		font-family:monospace;
		-ms-user-select:none;
		-moz-user-select:none;
		-webkit-user-select:none;
		user-select:none;
	`;
	
	eng.progress=document.createElement("div");
	eng.progress.style.cssText=`
		position:absolute;
		left:0;
		top:20%;
		bottom:0;
		width:.5em;
		transform:translate(-.25em,0);
		background-color:white;
		cursor:col-resize;
		z-index:1;
		pointer-events:none;
	`;
	
	eng.overlayText=document.createElement("div");
	eng.overlayText.style.cssText=`
		position:absolute;
		left:0;
		top:0;
		bottom:0;
		right:0;
		color:white;
		text-align:center;
		pointer-events:none;
	`;

	eng.overlay.appendChild(eng.progress);
	eng.overlay.appendChild(eng.overlayText);
	
	//Variables//
	settings.window.style.position="relative";
	eng.currentFile=0;
	//Save the original parent
	eng.originalWindow=settings.window.cloneNode(true);
	eng.data={};
		
	//Remove the onclick event that set up this page-flip-engine
	settings.window.onclick=null;
	settings.window.style.cursor="pointer";
	
	eng.page=document.createElement("img");
	eng.page.style.cssText=`
		left:0;
		top:0;
		max-width:100%;
		max-height:100%;
		margin:auto;
		display:block;
	`;
	
	//Empty the current window to make room for the book
	settings.window.innerHTML="";
	settings.window.appendChild(eng.page);
	settings.window.appendChild(eng.overlay);
	
	eng.time=function(obj){
		//If inputPart is set
		if(obj && typeof(obj.part)!==undefined){
			console.log(obj,obj.part);
			
			//Use different options
			switch(obj.part){
				case "first":
					eng.currentFile=0;
					break;
				case "prev":
				case "--":
					eng.currentFile--;
					break;
				case "next":
				case "++":
					eng.currentFile++;
					break;
				case "last":
					eng.currentFile=settings.parts.length-1;
					break;
				default:
					//Get the part, or 0 if it's undefined
					eng.currentFile=parseInt(obj.part ? obj.part : 0);
					break;
			}
		}
		
		//If we're at the end, return
		if(eng.currentFile>=settings.parts.length){
			eng.currentFile=settings.parts.length-1;
			return;
		}
		
		if(eng.currentFile<0){
			eng.currentFile=0;
			return;
		}
		
		eng.page.src=settings.path+settings.parts[eng.currentFile];
		
		//If we're using queries
		if(settings.query && (!obj || !obj.popstate)){
			history.pushState(
				{}
				,""
				,(document.location.href)
					.split(/\#|\?/)[0] //Get text before any existing hashes or querystrings
					+'?'+settings.query+'='+(eng.currentFile+1) //Append the search query in the header (adding 1 so it looks more normal to users)
			);
		}
		
		settings.window.dispatchEvent(eventTime);
		
		//Go to the top of the page
		settings.window.scrollIntoView();
	}
	
	settings.window.addEventListener("click",function(){
		eng.currentFile++;
		eng.time();
	});
	
	eng.moveBar=false;
	
	//On clicking
	eng.scrub=function(){
		//If we're moving the bar right now, ignore clicking but do set moveBar to false
		
		if(eng.moveBar===true){
			eng.moveBar=false;
			return;
		}
		else //If we aren't moving the bar
		{
			if(eng.overlay.style.visibility=="hidden"){
				eng.updateOverlay();
				
				eng.overlay.style.visibility="visible";
			}else{
				eng.overlay.style.visibility="hidden";
			}
		}
		
		eng.moveBar=false;
	};
	
	//On clicking, we scrub
	eng.overlay.addEventListener(
		"click"
		,function(event){
			event.stopPropagation();
			eng.scrub();
		}
	);
	
	//On mousedown, we prepare to move the cursor
	eng.overlay.addEventListener(
		"mousedown"
		,function(event){
			//Only read mousemove over the overlay
			if(event.target!==this) return;
			
			eng.moveBar=event.clientX;
		}
	);
	
	//On dragging
	eng.overlay.addEventListener(
		"mousemove"
		,function(event){
			
			//console.log(event.target);
			
			//Only read mousemove over the overlay
			if(event.target!==this) return;
			
			if(eng.moveBar===false){
				return;
			}
			
			if(eng.moveBar!==true){
				if(Math.abs(eng.moveBar-event.clientX)>screen.width/100){
					eng.moveBar=true;
				}else{
					return;
				}
			}
			
			console.log("Hi!");
			
			eng.updateOverlay(event.offsetX / this.offsetWidth);
		}
	);
	
	
	//On dragging
	eng.overlay.addEventListener(
		"touchmove"
		,function(event){
			
			//Only read mousemove over the overlay
			if(event.target!==this) return;
			
			if(eng.moveBar===false){
				eng.moveBar=event.changedTouches[0].clientX;
			}
			
			//You have to swipe farther than you move the cursor to adjust the position
			if(eng.moveBar!==true){
				if(Math.abs(eng.moveBar-event.changedTouches[0].clientX)>screen.width/20){
					eng.moveBar=true;
				}else{
					return;
				}
			}
			
			//Don't want the users to accidentally swipe to another page!
			event.preventDefault();
			
			eng.updateOverlay((event.changedTouches[0].clientX-settings.window.getBoundingClientRect().left) / this.getBoundingClientRect().width);
		}
	);
	
	//On touch end, don't keep moving the bar to the user's touch
	eng.overlay.addEventListener(
		"touchend"
		,function(event){
			eng.moveBar=false;
		}
	);
	
	//Update the time by a percentage
	eng.updateOverlay=function(inputPercent){
		//If no inputPercent was passed
		if(typeof(inputPercent)==='undefined'){
			var inputPercent=eng.currentFile / settings.parts.length;
		}
		
		//Clamp inputPercent between 0 and 1
		inputPercent= inputPercent <= 0 ? 0 : inputPercent >= 1 ? 1 : inputPercent;
		
		//Go to the time
		var newFile=Math.floor(settings.parts.length*inputPercent);
		
		eng.progress.style.left=(inputPercent*100)+"%";
		
		//Get the part name, if one is set
		var partName=settings.parts[newFile].match(/\([^)]+/);
		
		console.log(partName);
		
		//Set the overlay text (the current time)
		eng.overlayText.innerHTML="<p>"+(newFile+1)+" | "+(settings.parts.length-(newFile+1))+"</p>";
		
		if(newFile!=eng.currentFile){
			eng.time({"part":newFile});
		}
	}
	
	//If querystrings are in use, consider the querystring in the URL
	if(settings.query){
		
		window.addEventListener(
			"popstate"
			,function(){
				console.log("testing!");
				var regex=new RegExp(settings.query+'[^&]+','i');
				
				var page=window.location.href.match(regex);
				
				if(page){
					eng.time({"part":parseInt(page[0].split("=")[1])-1,"popstate":true});
				}
				
			}
		);
		
		var regex=new RegExp(settings.query+'[^&]+','i');
		
		var page=window.location.href.match(regex);
		
		console.log(page);
		
		if(page){
			eng.time({"part":parseInt(page[0].split("=")[1])-1,"popstate":true});
		}
	}else{
		//Start
		eng.time();
	}
}