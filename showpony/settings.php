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

// Will be impacted by modules if they want another display type. Set the default here.
$displayType='file';

?>