<?php

if(!empty($_GET['return'])){
	require 'settings.php';

	$stories_path=DEFAULT_PATH.($_GET['path'] ?? '');
	$language=$_GET['lang'] ?? DEFAULT_LANGUAGE;
}

$media=[];
$files=[];
$releaseDates=[];
$success=true;
$unhideSubtitles=[];
$unhideSubfiles=[];

// Go to the story's file directory
chdir('../'.$stories_path);

// Unhide a file, including any hidden parent folders
function unhideFile($name){
	// Split the file into its path segments, so we can check all folders for HIDDEN_FILENAME_STARTING_CHAR
	$segments=explode('/',$name);
	$path='';
	
	foreach($segments as $check){
		if(file_exists($path.HIDDEN_FILENAME_STARTING_CHAR.$check)){
			// Remove HIDDEN_FILENAME_STARTING_CHAR
			rename($path.HIDDEN_FILENAME_STARTING_CHAR.$check,$path.$check);
		}
		
		$path.=$check.'/';
	}
}

function readFolder($folder){
	global $stories_path;
	global $media;
	global $files;
	global $releaseDates;
	global $unhideSubtitles;
	global $unhideSubfiles;
	global $success;
	
	// Get the section's title
	preg_match('/\(([^\/]+)\)$/',$folder,$sectionTitle);
	$sectionTitle=$sectionTitle[1] ?? null;
	
	// Run through the files
	foreach(scandir($folder) as &$file){
		// Ignore hidden files and folders
		if($file[0]==='.') continue;
		
		// Read subdirectories
		if(is_dir($folder.'/'.$file) && $file!=='..'  && $file!=='.'){
			// die('folder found! '.$file);
			readFolder($folder.'/'.$file);
			continue;
		}
		
		// If the file was hidden, and is unhid later, we'll set this to true
		$unhid=false;
		$hidden=false;
		
		// Get file info
		preg_match('/(\d{4}-\d\d-\d\d(?:\s\d\d(?::|;)\d\d(?::|;)\d\d)?)?\s?(?:\((.+)\))\s?([^\.]+)?/',$file,$match);
		
		// Ignore files that have dates in their filenames set to later
		if(!empty($match[1])){ // Get the posting date from the file's name; if there is one:
			// If the time is previous to now (replacing ; with : for Windows filename compatibility)
			$date=str_replace(';',':',$match[1]).' UTC';
			
			// Check if the file should be live based on the date passed
			if(strtotime($date)<=time()){
				// $hidden is already false
				
				// If the file is hidden but shouldn't be
				if($file[0]===HIDDEN_FILENAME_STARTING_CHAR){
					// Remove HIDDEN_FILENAME_STARTING_CHAR at the beginning of the filename
					if(rename($folder.'/'.$file,$folder.'/'.($file=substr($file,1)))){
						$unhid=true;
					// If removing HIDDEN_FILENAME_STARTING_CHAR fails
					}else{
						$success=false;
					}
				}
			}else{
				$hidden=true;
				
				// If the file isn't hidden but should be
				if($file[0]!==HIDDEN_FILENAME_STARTING_CHAR){
					// Add HIDDEN_FILENAME_STARTING_CHAR at the beginning of the filename
					if(rename($folder.'/'.$file,$folder.'/'.($file=HIDDEN_FILENAME_STARTING_CHAR.$file))){
						
					// If adding HIDDEN_FILENAME_STARTING_CHAR fails
					}else{
						$success=false;
					}
				}
				
				// The time the next file will go live
				if(RELEASE_DATES && count($releaseDates)<RELEASE_DATES){
					$releaseDates[]=strtotime($date);
				}
				
				// Don't add hidden files if we aren't logged in
				if(empty($_SESSION['showpony_admin'])) continue;
			}
		}else{
			// Still skip hidden files
			if($file[0]===HIDDEN_FILENAME_STARTING_CHAR) continue;
			
			$date=null;
		}
		
		$title='';
		if($sectionTitle){
			$title.=$sectionTitle;
			if(!empty($match[2])) $title.=': '.$match[2];
		}else{
			if(!empty($match[2])) $title=$match[2];
		}
		
		// There must be a better way to get some of this info...
		$fileInfo=[
			'buffered'		=>	[]
			,'date'			=>	$date
			,'duration'		=>	$match[3] ?? DEFAULT_FILE_DURATION
			,'extension'	=>	pathinfo($folder.'/'.$file,PATHINFO_EXTENSION)
			,'mimeType'		=>	mime_content_type($folder.'/'.$file)
			,'name'			=>	$file
			,'path'			=>	$hidden ? 'showpony/get-hidden-file.php?file='.$stories_path.$folder.'/'.$file  : $stories_path.$folder.'/'.$file
			,'size'			=>	filesize($folder.'/'.$file)
			,'subtitles'	=>	false
			,'title'		=>	str_replace(
				// Dissallowed in Windows files: \ / : * ? " < > |
				['[bs]','[fs]','[c]','[a]','[q]','[dq]','[lt]','[gt]','[b]']
				,['\\','/',':','*','?','"','<','>','|']
				,$title
			) ?? null
			,'hidden'		=>	$hidden ?? false
		];
		
		// Get the module based on FILE_DATA_GET_MODULE- first ext, then full mime, then partial mime, then default
		$fileInfo['module']=FILE_DATA_GET_MODULE['ext:'.$fileInfo['extension']]
			?? FILE_DATA_GET_MODULE['mime:'.$fileInfo['mimeType']]
			?? FILE_DATA_GET_MODULE['mime:'.explode('/',$fileInfo['mimeType'])[0]]
			?? FILE_DATA_GET_MODULE['default']
		;
		
		// If the module isn't supported, skip over it
		if($fileInfo['module']===null) continue;
		
		// If this file has been unhid, unhide related files
		if($unhid){
			$unhideSubtitles[]=count($files)+1;
			$unhideSubfiles[]=[$fileInfo['module'],$folder.'/'.$file];
		}
		
		// Add to the items in the module, or set to 1 if it doesn't exist yet
		if(isset($media[$fileInfo['module']])) $media[$fileInfo['module']]++;
		else $media[$fileInfo['module']]=1;
		
		// Add the file to the array
		$files[]=$fileInfo;
	}
}

readFolder($language);

// Load modules
foreach(array_keys($media) as $moduleName){
	require ROOT.'/modules/'.$moduleName.'/functions.php';
}

// Unhide subtitles
if(file_exists('subtitles')){
	foreach(scandir('subtitles') as $subtitleFolder){
		if($subtitleFolder[0]=='.') continue;
		
		foreach($unhideSubtitles as $fileNumber){
			unhideFile('subtitles/'.$subtitleFolder.'/'.str_pad($fileNumber,4,'0',STR_PAD_LEFT).'.vtt');
		}
	}
}

// Unhide children files
foreach($unhideSubfiles as $subfile){
	// die('SUBFILES TO UNHIDE '.json_encode($subfile));
	call_user_func($subfile[0].'UnhideChildren',$subfile[1]);
}

if(!empty($_GET['return'])){
	die(json_encode($files));
}

?>