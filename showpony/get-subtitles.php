<?php

// This file returns all subtitle files' text, splitting them by '|SPLIT|'. This way, for 100 small subtitles files, we just make 1 call- save calls.

if(file_exists(SUBTITLES_PATH)){
	// Add surrounding for subs if they exist
	if(!SUBTITLES_FETCHED){
		echo json_encode($subtitles.'-RAW'),':`';
	}

	// Get all subtitles files that exist
	for($i = 0; $i < FILES_COUNT; $i++){
		$filepath = SUBTITLES_PATH.'/'.str_pad($i + 1,4,'0',STR_PAD_LEFT).'.vtt';
		
		if(file_exists($filepath)) readfile($filepath);
		
		if($i < FILES_COUNT) echo '|SPLIT|';
	}

	// Add surrounding for subs if they exist
	if(!SUBTITLES_FETCHED){
		echo '`';
	}
// If the subtitles don't exist
}else{
	// If fetched, return this error
	if(SUBTITLES_FETCHED){
		http_response_code(500);
		echo '500: Subtitles don\'t exist in requested option "',SUBTITLES_PATH,'"!';
	}
	// If called on initial Showpony creation, do this instead
	else{
		$message .= '500: Subtitles don\'t exist in requested option "'.SUBTITLES_PATH.'"!';
	}
}