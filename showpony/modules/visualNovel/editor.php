<?php

// $_POST['name'] = 'test.txt';

preg_match('/^(.+?)([^\/]+)$/',$_POST['path'],$matches);

$path = '../../../' . $matches[1];
$name = $matches[2];

/// Safety checks

if(is_dir($path.$name)) die("That's a directory, no way we're overwriting that.");
// Make sure we're within a story folder (and not moving up to somewhere crazy)

// We'll save the existing file as a backup if it's more than 5 minutes old.
if(file_exists($path . $name)){
	// Make a folder for backups if it doesn't exist
	if(!file_exists($path . '~backups')) mkdir($path . '~backups');
	
	// Prepare the backup for backuping
	$backup = $path . '~backups/backup ' . $name;
	
	// If either a backup doesn't exist or it's more than 5 minutes old, overwrite it
	if(!file_exists($backup) 
		|| filemtime($backup) < strtotime('-5 minutes')
	){
		rename($path . $name, $backup);
	}
};

// This is REALLY insecure right now; definitely not for live, serious use.
file_put_contents($path . $name,$_POST['text']);


?>