<?php

require 'settings.php';

define('STORIES_PATH', DEFAULT_PATH.($_GET['path'] ?? ''));
$language = $_GET['lang'] ?? DEFAULT_LANGUAGE;

require 'get-file-list.php';

echo json_encode($files);