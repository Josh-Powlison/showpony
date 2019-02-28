<?php

require 'settings.php';

define('FILES_COUNT'		, $_GET['files'] ?? 1);
define('SUBTITLES_FETCHED'	, true);
define('SUBTITLES_PATH'		, '../' . $_GET['path'] . 'subtitles/' . $_GET['lang']);

require 'get-subtitles.php';