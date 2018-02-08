//Get the current script tag and 
var me=document.querySelector('script[src="http://localhost/showpony/showpony/remote.js');

var script=document.createElement("script");
script.src="http://localhost/showpony/showpony/script.js";

var css=document.createElement("link");
css.rel="stylesheet";
css.href="http://localhost/showpony/showpony/styles.css";

me.insertAdjacentElement('beforebegin',css);
me.insertAdjacentElement('beforebegin',script);

var localScript=document.createElement("script");
localScript.innerHTML="new Showpony;";

script.onload=function(){
	me.insertAdjacentElement('afterend',localScript);
	
	//Remove remote call js
	me.remove();
};