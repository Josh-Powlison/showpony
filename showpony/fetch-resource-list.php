<?php

require 'settings.php';

define('STORIES_PATH', !empty($_GET['path']) ? $_GET['path'] : DEFAULT_PATH);

chdir('../'.STORIES_PATH.'/resources');

$files = [];

function readFolder($folder){
	global $files;
	
	$fileList = scandir($folder);
	
	if($folder == '.') $folder = '';
	else $folder .= '/';
	
	foreach($fileList as $file){
		if($file=='.' || $file=='..') continue;
		
		// Directory
		if(is_dir($folder.$file)){
			readFolder($folder.$file);
		}
		// File
		else{
			$files[] = $folder.$file;
		}
	}
}

readFolder('.');

echo json_encode($files);

?>