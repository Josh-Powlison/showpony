<?php

// PHP 7 required //

error_reporting(E_ALL);
ini_set('display_errors',1);

const ROOT=__DIR__;
const DEFAULT_STORIES_PATH='files/';
const DEFAULT_LANGUAGE='en';
const DEFAULT_PROGRESS_DISPLAY='time'; // 'time' or 'file'
const HIDDEN_FILENAME_STARTING_CHAR='~'; // Change in .htaccess too, to block direct URL access

const FILE_DATA_GET_MODULE=[
	'default'			=>	null
	,'mime:text'		=>	'text'
	,'mime:image'		=>	'image'
	,'mime:audio'		=>	'audio'
	,'mime:video'		=>	'video'
	,'ext:vn'			=>	'visualNovel'
	,'mime:application'	=>	null
];


?>