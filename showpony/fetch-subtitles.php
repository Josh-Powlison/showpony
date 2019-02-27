<?php

require 'settings.php';

define('FILES_COUNT'		, $_GET['files'] ?? 1);
define('SUBTITLES_FETCHED'	, true);
define('SUBTITLES_PATH'		,
	'../'
	. ($_GET['path'] ?? DEFAULT_STORIES_PATH)
	.'subtitles/'
	. ($_GET['lang'] ?? DEFAULT_LANGUAGE)
);

require 'get-subtitles.php';