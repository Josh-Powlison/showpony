//BOOK ENGINE
function Book(settings){
	"use strict"; //Strict Mode
	
	//Need to set a variable to keep "this" separate from children's "this"
	var eng=this;
	
	//Variables//
	eng.window=settings.window;	
	eng.window.style.position="relative";
	eng.currentFile=0;
	//Save the original parent
	eng.originalWindow=eng.window.cloneNode(true);
	eng.data={};
		
	//Remove the onclick event that set up this page-flip-engine
	eng.window.onclick=null;
	eng.window.style.cursor="pointer";
	
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
	eng.window.innerHTML="";
	eng.window.appendChild(eng.page);
	
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
					eng.currentFile=obj.part ? obj.part : 0;
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
					+'?'+settings.query+'='+eng.currentFile //Append the search query in the header
			);
		}
	}
	
	eng.window.addEventListener("click",function(){
		eng.currentFile++;
		eng.time();
	});
	
	//If querystrings are in use, consider the querystring in the URL
	if(settings.query){
		
		window.addEventListener(
			"popstate"
			,function(){
				console.log("testing!");
				var regex=new RegExp(settings.query+'[^&]+','i');
				
				var page=window.location.href.match(regex);
				
				if(page){
					eng.time({"part":page[0].split("=")[1],"popstate":true});
				}
				
			}
		);
		
		var regex=new RegExp(settings.query+'[^&]+','i');
				
		var page=window.location.href.match(regex);
		
		console.log(page);
		
		if(page){
			eng.time({"part":page[0].split("=")[1],"popstate":true});
		}
	}else{
		//Start
		eng.time();
	}
}