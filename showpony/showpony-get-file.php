<?php
	$file='../'.$_GET['path'].$_GET['get'];

	header('Accept-Ranges: bytes');
	header('Content-Length:'.filesize($file));
	
	#read a file
	readfile($file);
?>