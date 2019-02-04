<?php

// PHP 7 required //

error_reporting(E_ALL);
ini_set('display_errors',1);

date_default_timezone_set('UTC');			// The timezone we're reading times in

const ROOT=__DIR__;							// The directory Showpony is in
const DEFAULT_PATH='story/';				// The path to the files we'll play
const DEFAULT_LANGUAGE='en';				// If a language isn't set by the user, assume this one
const DEFAULT_SUBTITLES=null;				// If subtitles aren't set by the user, assume this one
const DEFAULT_QUALITY=1;					// If quality level isn't set by the user, assume this one
const DEFAULT_FILE_DURATION=10;				// How long files without a duration in their filename will be assumed to be
const DEFAULT_START=0;						// Where we'll start in the Showpony by default
const PRELOAD_BYTES=.5*1048576;				// How many file bytes to preload
const RELEASE_DATES=1;						// How many upcoming files to show release dates for
const HIDDEN_FILENAME_STARTING_CHAR='~';	// Change in .htaccess too, to block direct URL access

// The names of varying levels of quality, if needed. From lowest to highest.
const QUALITY_NAMES=[
	'480p'
	,'720p'
	,'1080p'
	,'4K'
];

const FILE_DATA_GET_MODULE=[
	'default'			=>	null
	,'mime:text'		=>	'text'
	,'mime:image'		=>	'image'
	,'mime:audio'		=>	'audio'
	,'mime:video'		=>	'video'
	,'ext:vn'			=>	'visualNovel'
	,'mime:application'	=>	null
];

// Will be impacted by modules if they want another display type. Set the default here.
$displayType='file';

?>