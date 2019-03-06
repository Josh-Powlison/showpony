<?php

// Look at cached file and consider if we should update
if(empty($_SESSION['showpony_admin']) && file_exists('public-cache.json')){
	// if so, ignore all of the following and grab the cached file; also need to make a cached file from $files[] at the end, if requested
	
	/*
	1. Know the last time an edit was made
	2. Compare that to the caching date
	3. Either load or update the file
	*/
	
	/*
	Methods:
	1. Dated (dumb): just update a file every day (or other set interval)
	2. Update-based (smart): update the listing based on
		a: last change dates and
		b: dates for files going live
	*/
}

$files				= [];
$maxQuality			= 0;
$media				= [];
$upcomingFiles		= [];
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
	global $upcomingFiles;
	global $success;
	global $unhideSubtitles;
	global $unhideSubfiles;
	
	// Get the section's title
	preg_match('/(?<={).+(?=})/',$folder,$sectionTitle);
	$sectionTitle = $sectionTitle[0] ?? null;
	
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
		
		$filename = pathinfo($file)['filename'];
		
		// Get file info
		preg_match('/(?<={).+(?=})/',$filename,$match);
		$title		= $match[0] ?? null;
		
		preg_match('/(?<=q)[\d]+/',$filename,$match);
		$quality	= $match[0] ?? null;
		
		preg_match('/[\d]+-[\d-]+/',$filename,$match);
		if($match){
			$release = '';
			$releaseData = explode('-',$match[0]);
			for($i = 0; $i < count($releaseData); $i++){
				switch($i){
					case 0: break;
					case 1: case 2:
						$release .= '-';
						break;
					case 3:
						$release .= ' ';
						break;
					case 4: case 5:
						$release .= ':';
						break;
				}
				
				$release .= $releaseData[$i];
			}
			
			$release .= ' UTC';
		}else $release = null;
		
		preg_match('/[\d\.]+(?=s)/',$filename,$match);
		$duration	= $match[0] ?? null;
		
		/*
			$match[0] = Whole Match
			$match[1] = Quality
			$match[2] = Release
			$match[3] = Title
			$match[4] = Length
		*/
		
		// The base quality is always 0- so if we've found higher than that, just increase the value of the previously added file in the array
		if(!empty($quality)){
			$files[count($files)-1]['quality'] = intval($quality);
			
			// Update max quality
			if($maxQuality < intval($quality)) $maxQuality = intval($quality);
			continue;
		}
		
		// Ignore files that have dates in their filenames set to later
		if(!empty($release)){ // Get the release date from the file's name; if there is one:
			// Check if the file should be live based on the release passed
			if(strtotime($release)<=time()){
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
				
				// Ignore if we need to
				if(count($upcomingFiles) >= RELEASE_DATES && empty($_SESSION['showpony_admin'])) continue;
			}
		}else{
			// Still skip hidden files
			if($file[0] === HIDING_CHAR) continue;
			
			$release=null;
		}
		
		if($sectionTitle){
			if($title) $title = $sectionTitle.': '.$title;
			else $title = $sectionTitle;
		}
		
		// Hidden files
		if($hidden){
			$upcomingFiles[]=[
				'hidden'		=>	true
				,'release'		=>	strtotime($release)
				,'duration'		=>	0
			];
			
			continue;
		}
		// Public files
		else{
			// There must be a better way to get some of this info...
			$fileInfo=[
				'buffered'		=>	[]
				,'duration'		=>	$duration ?? DEFAULT_FILE_DURATION
				,'name'			=>	$file
				,'path'			=>	$hidden ? 'showpony/get-hidden-file.php?file='.STORIES_PATH.$folder.'/'.$file  : STORIES_PATH.$folder.'/'.$file
				,'quality'		=>	0 // Defaults to 0; if higher quality files are found, we consider those
				,'release'		=>	strtotime($release)
				,'size'			=>	filesize($folder.'/'.$file)
				,'title'		=>	str_replace(
					// Dissallowed in Windows files: \ / : * ? " < > |
					['[bs]','[fs]','[c]','[a]','[q]','[dq]','[lt]','[gt]','[b]']
					,['\\','/',':','*','?','"','<','>','|']
					,$title
				) ?? null
				,'hidden'		=>	$hidden ?? false
			];
		}
		
		$extension = pathinfo($folder.'/'.$file,PATHINFO_EXTENSION);
		$mimeType = mime_content_type($folder.'/'.$file);
		
		// Get the module based on FILE_GET_MODULE- first ext, then full mime, then partial mime, then ignore (it could be a dangerous file)
		$fileInfo['module'] = FILE_GET_MODULE['ext:'.$extension]
			?? FILE_GET_MODULE['mime:'.$mimeType]
			?? FILE_GET_MODULE['mime:'.explode('/',$mimeType)[0]]
			?? null
		;
		
		// If the module isn't supported, skip over it
		if($fileInfo['module'] === null) continue;
		
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

// Set them back in alphabetical order (HIDDEN_CHAR being removed can mess with order)
sort($files);
sort($upcomingFiles);

// Add files and upcomingFiles together in order
$files = array_merge($files,$upcomingFiles);

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