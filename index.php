<!DOCTYPE html>
<html>
<head>
	<title>Showpony Demo</title>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width,initial-scale:1">
	<link rel="stylesheet" href="styles.css">
	<link rel="stylesheet" href="showpony/showpony.css">
</head>
<body>
	<h1>Showpony</h1>
	<p>Showpony is a lightweight multimedia engine that will allow you to work in all popular (and mnay niche), media and upload them to your website quickly and easily.</p>
	<p>You will likely run into bugs and some very unpretty things since this is still in development. Sorry, and please report bugs on the <a href="https://github.com/Josh-Powlison/showpony" target="_blank">GitHub</a> page, where you can also download Showpony!</p>
	<p>Go to the top-left corner of the engine to access the menu.</p>
	<?
	
	#error_reporting(true);
	include('showpony/showpony-classes.php');
	$a=new Showpony();
	
	?>
	
	<div class="story-container" id="showpony"></div>
	<script src="showpony/showpony.js"></script>
	<script>
		var showpony;

		window.addEventListener(
			"load"
			,function(){
				showpony=new Showpony({
					window:document.getElementById("showpony")
					,files:<?php
						echo json_encode($a->getFiles());
					?>
					,path:"parts/"
					,scrubLoad:false
					,startAt:"first"
					//,"timeDisplay":"Part [0pc]: [n]<br>[1mc]:[2sc] | [1ml]:[2sl]<br>[d]"
					,timeDisplay:"Part [0pc]: [n]<br>[1mc]:[2sc] | [1ml]:[2sl]<br>[d]"
					,query:false
					,dateFormat:{
						year:"numeric"
						,month:"long"
						,day:"numeric"
						,hour:"numeric"
					}
					,admin:true
				});
			}
		);
	</script>
</body>

</html>