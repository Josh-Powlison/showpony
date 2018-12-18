<?php

// This file returns all subtitle files' text, splitting them by '|SPLIT|'. This way, for 100 small subtitles files, we just make 1 call- save calls.

session_start();
require 'settings.php';

$stories_path=$_GET['path'] ?? DEFAULT_STORIES_PATH;
$language=$_GET['lang'] ?? DEFAULT_LANGUAGE;
$files=$_GET['files'] ?? 1;

if(!file_exists('../'.$stories_path.'/subtitles/'.$language)){
	http_response_code(500);
	die('500: Subtitles don\'t exist in that language!');
}

chdir('../'.$stories_path.'/subtitles/'.$language);

// Get all subtitles files that exist
for($i=1;$i<$files+1;$i++){
	$file=str_pad($i,4,'0',STR_PAD_LEFT).'.vtt';
	if(file_exists($file)) readfile($file);
	
	if($i<$files-2) echo '|SPLIT|';
}

?>