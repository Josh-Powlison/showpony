<?php

// PHP 7 required //

session_start();

const DEBUG = true;								// Posts more data and information for users

error_reporting(DEBUG ? E_ALL : 0);

date_default_timezone_set('UTC');				// The timezone we're reading times in

const ROOT					= __DIR__;			// The directory Showpony is in
const DEFAULT_PATH			= 'story/';			// The path to the files we'll play
const DEFAULT_LANGUAGE		= 'en';				// If a language isn't set by the user, assume this one
const DEFAULT_SUBTITLES		= null;				// If subtitles aren't set by the user, assume this one
const DEFAULT_QUALITY		= 1;				// If quality level isn't set by the user, assume this one
const DEFAULT_FILE_DURATION	= 10;				// How long files without a duration in their filename will be assumed to be
const DEFAULT_START			= 0;				// Where we'll start in the Showpony by default
const PRELOAD_BYTES			= .5*1048576;		// How many file bytes to preload
const RELEASE_DATES			= 1;				// How many upcoming files to show release dates for
const HIDING_CHAR			= '~';				// Start a filename with this char to hide it. Change in .htaccess too, to block direct URL access
const READING_DIRECTION		= 'left-to-right';	// left-to-right, right-to-left, or (to add) top-to-bottom for infinite scroll

// The names of varying levels of quality, if needed. From lowest to highest.
const QUALITY_NAMES = [
	'480p'		// 0$
	,'720p'		// 1$
	,'1080p'	// 2$
	,'4K'		// 3$
];

// What modules to load for what file types
const FILE_DATA_GET_MODULE = [
	'default'			=>	null
	,'mime:text'		=>	'text'
	,'mime:image'		=>	'image'
	,'ext:svg'			=>	'image' // Not all servers recognize SVGs as images
	,'mime:audio'		=>	'audio'
	,'mime:video'		=>	'video'
	,'ext:vn'			=>	'visualNovel'
	,'mime:application'	=>	null
];

// If run into one of these modules, will change the display type to this
const MODULE_SET_DISPLAY = [
	'default'			=> 'file'
	,'audio'			=> 'time'
	,'video'			=> 'time'
	,'visualNovel'		=> 'time'
];

// This function is run on a new file's release. THIS WILL ONLY WORK IF THE FILE IS UNHIDDEN BY ITS DATE, not if a file's just manually added.
function NEW_RELEASE($number, $info){
	/* Put any functionality you want to in here:
		- Message a mailing list
		- Send tweets
		- Email yourself as a reminder
		
		Over time, we'll add some of this functionality. If you're interested in anything specific being included as part of Showpony, be sure to ask for it!
		
		$number: the file's number
		$info: an associative array with the following file info (using "2018-05-26 (Breakdown) 90.vn" for example)
			buffered		// Will always be an empty array
			date			// Release date for the file		"2018-05-26 UTC"
			duration		// The file's duration in seconds	90
			extension		// The file's extension				"vn"
			mimeType		// The file's mime type				"text/plain"
			name			// The file's name					"2018-05-26 (Breakdown) 90.vn"
			path			// The path to the file				"story/en/2018-05-26 (Breakdown) 90.vn"
			quality			// Quality available for the file	0
			size			// Filesize in bytes				7217
			title			// The file's title					"Breakdown"
			hidden			// Since it's gone live, will always be "true"
	*/
}

?>