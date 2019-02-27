<?php

session_start();

// If we aren't logged in, block the effort
if(empty($_SESSION['showpony_admin'])) die('You need to be logged in to access private files.');

// Go to the correct directory
chdir(($_GET['rel-path'] ?? '..').'/');

// Get the file path
$file=dirname(__FILE__,2).'/'.$_GET['file'];

// These headers are required to scrub media (yes, you read that right)
header('Accept-Ranges: bytes');
header('Content-Length:'.filesize($file));

readfile($file);