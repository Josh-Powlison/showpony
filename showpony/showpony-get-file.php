<?php
	$file='../'.$_GET['path'].$_GET['get'];

	#These headers allow you to scrub MP4s; without them, you can't
	header('Accept-Ranges: bytes');
	header('Content-Length:'.filesize($file));
	
	readfile($file);
?>