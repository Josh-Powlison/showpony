<?php

require 'settings.php';

define('STORIES_PATH', !empty($_GET['path']) ? $_GET['path'] : DEFAULT_PATH);
$language = $_GET['lang'] ?? DEFAULT_LANGUAGE;

require 'get-file-list.php';

echo json_encode($files,JSON_NUMERIC_CHECK);