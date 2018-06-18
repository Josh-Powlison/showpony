document.getElementById("show-comic").addEventListener("click",function(){
	chooseStory('comic');
});

document.getElementById("show-video").addEventListener("click",function(){
	chooseStory('video');
});

document.getElementById("show-text").addEventListener("click",function(){
	chooseStory('text');
});

document.getElementById("show-kn").addEventListener("click",function(){
	chooseStory('kn');
});

document.getElementById("show-audio").addEventListener("click",function(){
	chooseStory('audio');
});

console.log("HEEEEEEEEEEEEY");

function chooseStory(id){
	var stories=document.getElementsByClassName("story");
	
	if(document.querySelector(".show-selected")) document.querySelector(".show-selected").classList.remove("show-selected");
	document.getElementById("show-"+id).classList.add("show-selected");
	
	for(var i=0;i<stories.length;i++){
		if(stories.item(i).id==id){
			if(stories.item(i).classList.contains("hidden")){
				stories.item(i).classList.remove("hidden");
				
				if(stories.item(i).dataset.wasPaused){
					if(showponies[stories.item(i).id].currentFile>-1) showponies[stories.item(i).id].menu(null,stories.item(i).dataset.wasPaused=="true" ? "pause" : "play");
				}
			}
			
			//Update URL and history
			history.replaceState(null,null,location.href.replace(/#[^$?]+/,'')+"#"+id);
		}else{
			if(!stories.item(i).classList.contains("hidden")){
				stories.item(i).dataset.wasPaused=stories.item(i).classList.contains("showpony-paused");
				stories.item(i).classList.add("hidden");
				
				if(showponies[stories.item(i).id].currentFile>-1) showponies[stories.item(i).id].menu(null,"pause");
			}
		}
	}
	
	document.getElementById("current-medium").innerHTML={
		"comic":"comic"
		,"text":"serial novel"
		,"kn":"kinetic novel"
		,"audio":"dramatized audiobook"
		,"video":"video series"
	}[id];
	
	var container=document.createElement("span");
	
	var objects=Object.keys(showponyInputs[id]);
	
	for(var i=0;i<objects.length;i++){
		var line=document.createElement("span");
		
		line.innerHTML+='\t<span class="obj-name">'+objects[i]+'</span>: ';
		var value=showponyInputs[id][objects[i]];
		
		var print='';
		var valuePrint=document.createElement("span");
		
		switch(typeof value){
			case 'number':
				print+=value;
				break;
			case 'boolean':
				print+=value ? 'true' : 'false';
				break;
			case 'string':
				print+='"'+value+'"';
				break;
			case 'object':
				if(value && value.id) print+='document.getElementById("'+value.id+'")';
				else print+=JSON.stringify(value,null,'\t');
				break;
			default:
				//
				break;
		}
		
		valuePrint.innerText=print;

		line.appendChild(valuePrint);
		container.appendChild(line);
		
		if(i<objects.length-1){
			container.innerHTML+=',<br>';
		}
	}
	document.getElementById("code").innerHTML=container.innerHTML;
	document.getElementById("propertyExplanation").innerHTML='Hover over a property to get info on it!';
	
	var properties=document.querySelectorAll(".obj-name");
	for(var i=0;i<properties.length;i++){
		properties[i].addEventListener("mouseover",function(){
			if(document.querySelector('.obj-name-study')) document.querySelector('.obj-name-study').classList.remove('obj-name-study');
			
			this.classList.add('obj-name-study');
			
			document.getElementById("propertyExplanation").innerHTML="<strong>"+this.innerHTML+"</strong>: "+(propertyInfo[this.innerHTML]);
		});
	}
	
}

var propertyInfo={
	window:"The element to put Showpony into. Ideally a div. If unset or <em>null</em>, will create an element."
	,start:"What file to start at if one isn't set in the querystring or bookmark. Can be a number or the value <em>'last'</em>. Defaults to <em>'last'</em>"
	,get:"If set to a folder, will automatically get all files in that folder (unless they're not ready to be released yet, more info in the Wiki). If an array of paths to files, will just get those files. [lang] will be replaced with the <strong>language</strong> value and can be placed anywhere in the <strong>get</strong> value. Defaults to 'files/[lang]/'"
	,language:"The language to use. Defaults to <em>'en'</em>"
	,scrubLoad:"If <em>false</em>, don't load files while scrubbing. If <em>true</em>, load files while scrubbing. Defaults to <em>false</em>"
	,info:"The text displayed at the top of Showpony. Defaults to <em>'[Current File] | [Files Left]'</em>"
	,credits:"The text displayed at the bottom-right of Showpony. Can write CompanyName.logo to automatically load in a logo from simpleicons.org. If <em>null</em>, no credits are shown. Defaults to <em>null</em>."
	,data:"An object that can be used to save user data. Defaults to <em>{}</em>"
	,defaultDuration:"The assumed length for files with a duration in their filename. Defaults to <em>10</em>"
	,title:"Info to show in the website title that shows up in the tab. If null, won't impact the website title. Defaults to null"
	,dateFormat:"How to format dates. Defaults to <em>{year:'numeric',month:'numeric',day:'numeric'}</em>"
	,admin:"Whether or not to allow use of the admin panel, set up in the PHP file. Defaults to <em>false</em>"
	,query:"The text in the search bar that tracks where you're at in the story. If <em>false</em>, no query is used. Defaults to <em>'part'</em>"
	,shortcuts:"Allows keyboard shortcuts for Showpony. <em>'always'</em> means always use shortcut keys. <em>'focus'</em> means only when the element is focused on. <em>'fullscreen'</em> means only when Showpony is fullscreened. <em>false</em> means don't allow shortcut keys. Defaults to <em>'focus'</em>"
	,saveId:"The id to use for saving bookmarks, both locally and remotely. Defaults to <em>location.hostname.substring(0,20)</em>"
	,remoteSave:"Save user bookmarks remotely to a user's Hey Bard account, so they can be accessed from any machine. If the user loads the webpage without a query, the bookmark will automatically be loaded. Defaults to <em>true</em>"
	,localSave:"Save user bookmarks locally. If the user loads the webpage without a query, the bookmark will automatically be loaded. Defaults to <em>false</em>"
	,bookmark:"<em>'file'</em> means queries and bookmarks are saved based on the current file. <em>'time'</em> means it's based on the total time we are into the story. Defaults to <em>'file'</em>"
	,preloadNext:"Preload upcoming files. Can set to any positive integer you like, or to 0 to not preload. Defaults to <em>1</em>"
	,showBuffer:"Show the file buffer at the top. For media where loading is incredibly fast, displaying this might just be weird. Defaults to <em>true</em>"
};

var type=/#[^$?]+/.exec(location.href);

chooseStory(type ? type[0].replace('#','') : "comic");