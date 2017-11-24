<!DOCTYPE html>
<html>
<head>
	<title>Showpony Demo</title>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width,initial-scale:1">
	<link rel="stylesheet" href="styles.css">
	<link rel="stylesheet" href="engine/showpony.css">
</head>
<body>
	<p>Sorry this page is ugly, Showpony's under crazy construction!</p>
	<h1>Showpony (Demo)</h1>
	<p>Showpony is a lightweight multimedia engine that will allow you to work in all popular (and mnay niche), media and upload them to your website quickly and easily.</p>
	<p>You will likely run into bugs and some very unpretty things since this is still in development. Sorry, and please report bugs on the <a href="https://github.com/Josh-Powlison/showpony" target="_blank">GitHub</a> page, where you can also download Showpony!</p>
	<p>Go to the top-left corner of the engine to access the menu. For now, the first 4 parts should work (comics); the rest is iffy, 'specially cross-browser, and under construction.</p>
	
	<?php include ('engine/showpony-classes.php'); easyShowpony("parts"); ?>
	
	<!--
	<div class="story-container" id="showpony"></div>
	<script src="engine/showpony.js"></script>
	<script>
		var comic,engine;
	
		window.addEventListener(
			"load"
			,function(){
				comic=document.getElementById("showpony");
				
				engine=new Showpony({
					"window":comic
					,"parts":<?=json_encode(array_slice(scandir('stories'),2))?>
					,"path":"parts/"
					,"loadingClass":"loading"
					,"scrubLoad":true
				});
			}
		);
	</script>-->
</body>

</html>