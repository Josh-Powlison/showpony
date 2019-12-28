<?php

session_start();
const DEFAULT_PATH			= 'story/';			// The path to the files we'll play
const DEFAULT_LANGUAGE		= 'en';				// If a language isn't set by the user, assume this one
const DEFAULT_SUBTITLES		= null;				// If subtitles aren't set by the user, assume this one
const DEFAULT_QUALITY		= 1;				// If quality level isn't set by the user, assume this one
const DEFAULT_FILE_DURATION	= 10;				// How long files without a duration in their filename will be assumed to be
const DEFAULT_START			= 0;				// Where we'll start in the Showpony by default
const DEFAULT_PROGRESS		= 'time';			// How to display progress in the menu. 'file', 'time', or 'percent'
const DEFAULT_DIRECTION		= 'left-to-right';	// 'left-to-right' or 'right-to-left'
const HIDING_CHAR			= '~';				// Start a filename with this char to hide it. Change in .htaccess too, to block direct URL access
const PRELOAD_BYTES			= .5 * 1048576;		// How many file bytes to preload
const RELEASE_DATES			= 1;				// How many upcoming files to show release dates for
const DEBUG					= true;				// Passes PHP notices and errors to Showpony's creation event
date_default_timezone_set('UTC');				// The timezone we're reading times in

const QUALITY_NAMES = [
	'480p'		// 0$
	,'720p'		// 1$
	,'1080p'	// 2$
	,'4K'		// 3$
];

// What modules to load for what file types
const FILE_GET_MODULE = [
	'mime:text'			=> 'text'
	,'mime:image'		=> 'image'
	,'ext:svg'			=> 'image' // Not all servers recognize SVGs as images by default
	,'mime:audio'		=> 'audio'
	,'mime:video'		=> 'video'
	,'ext:vn'			=> 'visualNovel'
	,'ext:php'			=> 'visualNovel'
	,'mime:application'	=> null
];

// This function is run on a new file's release. THIS WILL ONLY WORK IF THE FILE IS UNHIDDEN BY ITS DATE, not if a file's just manually added.
function NEW_RELEASE($number, $info){
	// $number: the file's number
	// $info: an array of the file's info, same layout as passed to Showpony JS
}