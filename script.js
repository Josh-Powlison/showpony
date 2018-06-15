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
		}else{
			if(!stories.item(i).classList.contains("hidden")){
				stories.item(i).dataset.wasPaused=stories.item(i).classList.contains("showpony-paused");
				stories.item(i).classList.add("hidden");
				
				if(showponies[stories.item(i).id].currentFile>-1) showponies[stories.item(i).id].menu(null,"pause");
			}
		}
	}
	
	var prettyJSON=JSON.stringify(showponies[id],null,'\t');
	
	document.getElementById("code").innerText=prettyJSON;
}

var type=/#[^$?]+/.exec(location.href);

chooseStory(type ? type[0].replace('#','') : "comic");
console.log("Type: "+location.href);