<?php

$files				= [];
$maxQuality			= 0;
$media				= [];
$releaseDates		= [];
$success			= true;
$unhideSubtitles	= [];
$unhideSubfiles		= [];

if(!file_exists('../'.STORIES_PATH)){
	http_response_code(500);
	die('500: Story folder doesn\'t exist!');
}

// Go to the story's file directory
chdir('../'.STORIES_PATH);

// Unhide a file, including any hidden parent folders
function unhideFile($name){
	// Split the file into its path segments, so we can check all folders for HIDING_CHAR
	$segments=explode('/',$name);
	$path='';
	
	foreach($segments as $check){
		if(file_exists($path.HIDING_CHAR.$check)){
			// Remove HIDING_CHAR
			rename($path.HIDING_CHAR.$check,$path.$check);
		}
		
		$path.=$check.'/';
	}
}

function readFolder($folder){
	global $files;
	global $maxQuality;
	global $media;
	global $releaseDates;
	global $success;
	global $unhideSubtitles;
	global $unhideSubfiles;
	
	// Get the section's title
	preg_match('/\(([^\/]+)\)$/',$folder,$sectionTitle);
	$sectionTitle=$sectionTitle[1] ?? null;
	
	
	// Run through the files
	foreach(scandir($folder) as &$file){
		// Ignore hidden files and folders
		if($file[0] === '.') continue;
		
		// Read subdirectories
		if(is_dir($folder.'/'.$file) && $file!=='..'  && $file!=='.'){
			// If it's a hidden folder or hidden subfolder and we're not an admin skip over it pass that info
			if($file[0] === HIDING_CHAR && empty($_SESSION['showpony_admin'])){
				continue;
			}
			
			readFolder($folder.'/'.$file);
			continue;
		}
		
		// If the file was hidden, and is unhid later, we'll set this to true
		$unhid=false;
		$hidden=false;
		
		// Get file info
		preg_match('/(?:(\d+)\$)?(\d{4}-\d\d-\d\d(?:\s\d\d(?::|;)\d\d(?::|;)\d\d)?)?\s?(?:\((.+)\))\s?([^\.]+)?/',$file,$match);
		/*
			$match[0] = Whole Match
			$match[1] = Quality
			$match[2] = Date
			$match[3] = Title
			$match[4] = Length
		*/
		
		// The base quality is always 0- so if we've found higher than that, just increase the value of the previously added file in the array
		if(!empty($match[1])){
			$files[count($files)-1]['quality'] = intval($match[1]);
			
			// Update max quality
			if($maxQuality < intval($match[1])) $maxQuality = intval($match[1]);
			continue;
		}
		
		// Ignore files that have dates in their filenames set to later
		if(!empty($match[2])){ // Get the posting date from the file's name; if there is one:
			// If the time is previous to now (replacing ; with : for Windows filename compatibility)
			$date=str_replace(';',':',$match[2]).' UTC';
			
			// Check if the file should be live based on the date passed
			if(strtotime($date)<=time()){
				// $hidden is already false
				
				// If the file is hidden but shouldn't be
				if($file[0]===HIDING_CHAR){
					// Remove HIDING_CHAR at the beginning of the filename
					if(rename($folder.'/'.$file,$folder.'/'.($file=substr($file,1)))){
						$unhid=true;
					// If removing HIDING_CHAR fails
					}else{
						$success=false;
					}
				}
			}else{
				$hidden=true;
				
				// If the file isn't hidden but should be
				if($file[0]!==HIDING_CHAR){
					// Add HIDING_CHAR at the beginning of the filename
					if(rename($folder.'/'.$file,$folder.'/'.($file=HIDING_CHAR.$file))){
						
					// If adding HIDING_CHAR fails
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
			if($file[0]===HIDING_CHAR) continue;
			
			$date=null;
		}
		
		$title='';
		if($sectionTitle){
			$title.=$sectionTitle;
			if(!empty($match[3])) $title.=': '.$match[3];
		}else{
			if(!empty($match[3])) $title=$match[3];
		}
		
		// There must be a better way to get some of this info...
		$fileInfo=[
			'buffered'		=>	[]
			,'date'			=>	$date
			,'duration'		=>	$match[4] ?? DEFAULT_FILE_DURATION
			,'extension'	=>	pathinfo($folder.'/'.$file,PATHINFO_EXTENSION)
			,'mimeType'		=>	mime_content_type($folder.'/'.$file)
			,'name'			=>	$file
			,'path'			=>	$hidden ? 'showpony/get-hidden-file.php?file='.STORIES_PATH.$folder.'/'.$file  : STORIES_PATH.$folder.'/'.$file
			,'quality'		=>	0 // Defaults to 0; if higher quality files are found, we consider those
			,'size'			=>	filesize($folder.'/'.$file)
			,'title'		=>	str_replace(
				// Dissallowed in Windows files: \ / : * ? " < > |
				['[bs]','[fs]','[c]','[a]','[q]','[dq]','[lt]','[gt]','[b]']
				,['\\','/',':','*','?','"','<','>','|']
				,$title
			) ?? null
			,'hidden'		=>	$hidden ?? false
		];
		
		// Get the module based on FILE_GET_MODULE- first ext, then full mime, then partial mime, then ignore (it could be a dangerous file)
		$fileInfo['module']=FILE_GET_MODULE['ext:'.$fileInfo['extension']]
			?? FILE_GET_MODULE['mime:'.$fileInfo['mimeType']]
			?? FILE_GET_MODULE['mime:'.explode('/',$fileInfo['mimeType'])[0]]
			?? null
		;
		
		// If the module isn't supported, skip over it
		if($fileInfo['module']===null) continue;
		
		// If this file has been unhid
		if($unhid){
			// Unhide related files
			$unhideSubtitles[]=count($files)+1;
			$unhideSubfiles[]=[$fileInfo['module'],$folder.'/'.$file];
			
			// Run new release function and any sub-functions
			NEW_RELEASE(count($files)+1, $fileInfo);
		}
		
		// Add to the items in the module, or set to 1 if it doesn't exist yet
		if(isset($media[$fileInfo['module']])) $media[$fileInfo['module']]++;
		else $media[$fileInfo['module']]=1;
		
		// Add the file to the array
		$files[]=$fileInfo;
	}
}

// If the language requested doesn't exist, set it to the DEFAULT_LANGUAGE
if(!file_exists($language)){
	if(!file_exists(DEFAULT_LANGUAGE)){
		http_response_code(500);
		die('500: A story folder doesn\'t exist in that language!');
	}else{
		$language = DEFAULT_LANGUAGE;
	}
}else{
	
}

// Read the folder if it doesn't start with the hiding char or if we're an admin (this could be used for a sneaky way to access files otherwise)
if($language[0] !== HIDING_CHAR || !empty($_SESSION['showpony_admin'])) readFolder($language);

// Load modules
foreach(array_keys($media) as $moduleName){
	if(file_exists(__DIR__.'/modules/'.$moduleName.'/functions.php')) require __DIR__.'/modules/'.$moduleName.'/functions.php';
}

// Unhide subtitles
if(file_exists('subtitles')){
	foreach(scandir('subtitles') as $subtitleFolder){
		if($subtitleFolder[0] == '.' || $subtitleFolder[0] === HIDING_CHAR) continue;
		
		foreach($unhideSubtitles as $fileNumber){
			unhideFile('subtitles/'.$subtitleFolder.'/'.str_pad($fileNumber,4,'0',STR_PAD_LEFT).'.vtt');
		}
	}
}

// Unhide children files
foreach($unhideSubfiles as $subfile){
	if(function_exists($subfile[0].'UnhideChildren')) call_user_func($subfile[0].'UnhideChildren',$subfile[1]);
}