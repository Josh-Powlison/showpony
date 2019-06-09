<?php

$json = [
	$message = ''
];

ob_start();

// This is REALLY insecure right now; definitely not for live, serious use.

preg_match('/^(.+?)([^\/]+)$/',$_POST['path'],$matches);

$path		= '../' . $matches[1];
$name		= $matches[2];
$deleteOld	= false; // Delete the existing file

/// Safety checks

if(is_dir($path.$name)) die("That's a directory, no way we're overwriting that.");
// Make sure we're within a story folder (and not moving up to somewhere crazy)


// Create a new file
if($_POST['type'] == 'new'){
	$fileCount = 0;
	
	$files = glob($path .'*');
	if($files) $fileCount = count($files);
	
	$newName = str_pad($fileCount,3,'0',STR_PAD_LEFT) . ' ' . gmdate('Y-m-d-G-i-s') . ' {File ' . $fileCount . '} 10s.vn';
	
	$_POST['text']		= '	This is File ' . $fileCount . '. Ah, a fresh start!';
// Existing paths
}else{
	// Save the updated the file name info
	$newName = preg_replace(
		[
			'/{[^}]*}/'
			,'/\d+s/'
		]
		,[
			'{'.$_POST['title'].'}'
			,$_POST['duration'].'s'
		]
		,$name
	);
	
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
		} else $deleteOld = true;
	};
}

$json['filename']	= $newName;

// This is REALLY insecure right now; definitely not for live, serious use.

// Delete original file if needbe
if($deleteOld) unlink($path . $name);

// Create new one
file_put_contents($path . $newName,$_POST['text']);

$json['message'] = ob_get_flush();

echo json_encode($json);

?>