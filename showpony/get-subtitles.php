<?php

// This file returns all subtitle files' text, splitting them by '|SPLIT|'. This way, for 100 small subtitles files, we just make 1 call- save calls.

$fetched = true;

// Only load settings and adjust variables if they haven't already been set
if(!isset($_SESSION)){
	require 'settings.php';

	$filesCount = $_GET['files'] ?? 1;
	
	$subtitlesPath = 
		'../'
		. ($_GET['path'] ?? DEFAULT_STORIES_PATH)
		.'subtitles/'
		. ($_GET['lang'] ?? DEFAULT_LANGUAGE)
	;
}
// If this has already been called
else{
	$filesCount = count($files);
	
	$subtitlesPath = 'subtitles/'.$subtitles;
	
	$fetched = false;
}

if(!file_exists($subtitlesPath)){
	http_response_code(500);
	die('500: Subtitles don\'t exist in that language!');
}

// Add surrounding for subs if they exist
if(!$fetched){
	echo json_encode($subtitles.'-RAW'),':`';
}

// Get all subtitles files that exist
for($i=1;$i<$filesCount+1;$i++){
	$filepath = $subtitlesPath.'/'.str_pad($i,4,'0',STR_PAD_LEFT).'.vtt';
	
	if(file_exists($filepath)) readfile($filepath);
	
	if($i<$filesCount) echo '|SPLIT|';
}

// Add surrounding for subs if they exist
if(!$fetched){
	echo '`';
}

?>