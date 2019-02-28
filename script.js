const DEFAULT_SHOWPONY='manga';

var showponies=[];

var currentShowpony=/#([^\?]+)/.exec(location.href);
if(currentShowpony) currentShowpony=currentShowpony[1];
else currentShowpony=DEFAULT_SHOWPONY;

document.getElementById("example-list").addEventListener("change",function(){
	chooseStory(this.value);
});

// Initial setup for Showponies
var keys=Object.keys(showponies);
for(var i=0;i<keys.length;i++){
	document.getElementById(keys[i]).dataset.waspaused='true';
}

//Choose the right input value
function chooseStory(id){
	console.log('RUN chooseStory');
	
	// Set the dropdown's value
	if(document.getElementById("example-list").value!==id){ 
		document.getElementById("example-list").value=id;
	}
	
	// Load Showponies dynamically
	if(typeof showponies[id] === 'undefined'){
		var script = document.createElement('script');
		
		var showponyWindow = document.getElementById(id);
		
		script.src = showponyWindow.dataset.path;
		
		// showponies.push = ();
		showponyWindow.addEventListener('built',function(event){
			console.log('BUILT');
			showponies[id]=event.detail.object;
			console.log(event.detail.message);
			
			/*
				CODE TO CUSTOMIZE THE SHOWPONIES
			*/
			
			displayStory(id);
		});
		
		showponyWindow.appendChild(script);
	}else{
		displayStory(id);
	}
}

function displayStory(id){
	var keys=Object.keys(showponies);
	for(var i=0;i<keys.length;i++){
		
		if(keys[i]==id){
			if(document.getElementById(keys[i]).classList.contains("hidden")){
				document.getElementById(keys[i]).classList.remove("hidden");
				showponies[keys[i]].active = true;
				
				if(document.getElementById(keys[i]).dataset.waspaused=='false'){
					showponies[keys[i]].paused = false;
				}else{
					showponies[keys[i]].paused = true;
				}
			}
			
			//Update URL and history
			history.replaceState(null,null,location.href.replace(/#[^$?]+|$/,"#"+keys[i]));
		}else{
			if(!document.getElementById(keys[i]).classList.contains("hidden")){
				document.getElementById(keys[i]).classList.add("hidden");
				showponies[keys[i]].active = false;
				
				document.getElementById(keys[i]).dataset.waspaused=showponies[keys[i]].paused ? 'true' : 'false';
				
				showponies[keys[i]].paused = true;
			}
		}
	}
	
	currentShowpony=id;
}

// Start
chooseStory(currentShowpony);