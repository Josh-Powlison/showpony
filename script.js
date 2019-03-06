var currentShowpony = /#([^\?]+)/.exec(location.href);
if(currentShowpony) currentShowpony = currentShowpony[1];
else currentShowpony = document.getElementById('example-list').children[0].value;

document.getElementById("example-list").addEventListener("change",function(){
	chooseStory(this.value);
});

//Choose the right input value
function chooseStory(id){
	// Set the dropdown's value
	if(document.getElementById("example-list").value !== id){ 
		document.getElementById("example-list").value = id;
	}
	
	// Load Showponies dynamically
	if(document.getElementById(id).children.length === 0){
		var script = document.createElement('script');
		script.defer = true;
		script.async = true;
		
		var showponyWindow = document.getElementById(id);
		script.src = showponyWindow.dataset.path;
		
		showponyWindow.addEventListener('built',function(event){
			displayStory(id);
		});
		
		showponyWindow.appendChild(script);
	}else{
		displayStory(id);
	}
}

var showponies = document.getElementById('showponies').children;

function displayStory(id){
	for(var i = 0; i < showponies.length; i++){
		
		if(showponies[i].id == id){
			showponies[i].classList.remove("hidden");
			showponies[i].active = true;
			
			//Update URL and history
			history.replaceState(null,null,location.href.replace(/#[^$?]+|$/,"#"+showponies[i].id));
		}else{
			showponies[i].classList.add("hidden");
			showponies[i].active = false;
		}
	}
}

// Start
chooseStory(currentShowpony);