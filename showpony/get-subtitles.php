<?php

// This file returns all subtitle files' text, splitting them by '|SPLIT|'. This way, for 100 small subtitles files, we just make 1 call- save calls.

session_start();
require 'settings.php';

$stories_path=$_GET['path'] ?? DEFAULT_STORIES_PATH;
$language=$_GET['lang'] ?? DEFAULT_LANGUAGE;

chdir('../'.$stories_path.'/subtitles/'.$language);

foreach(scandir('.') as $file){
	if($file[0]==='.' || $file[0]===HIDDEN_FILENAME_STARTING_CHAR || is_dir($file)) continue;

	readfile($file);
	echo '|SPLIT|';
}

?>