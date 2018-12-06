<?php

// PHP 7 required //

error_reporting(E_ALL);
ini_set('display_errors',1);

date_default_timezone_set('UTC');

const ROOT=__DIR__;
const DEFAULT_PATH='files/';
const DEFAULT_LANGUAGE='en';
const DEFAULT_FILE_DURATION=10;				// How long files without length data will be assumed to be
const PRELOAD_BYTES=.5*1048576;				// How many file bytes to preload
const RELEASE_DATES=1;						// How many upcoming files to show release dates for
const HIDDEN_FILENAME_STARTING_CHAR='~';	// Change in .htaccess too, to block direct URL access

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