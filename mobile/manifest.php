<?php
/****************************************************************************************
 * LiveZilla manifest.php
 *
 * Copyright 2019 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/

define("IN_LIVEZILLA",true);

if(!defined("LIVEZILLA_PATH"))
    define("LIVEZILLA_PATH","./../");

require(LIVEZILLA_PATH . "_definitions/definitions.inc.php");
require(LIVEZILLA_PATH . "_lib/functions.global.inc.php");
require(LIVEZILLA_PATH . "_definitions/definitions.dynamic.inc.php");
require(LIVEZILLA_PATH . "_definitions/definitions.protocol.inc.php");

Server::DefineURL("manifest.php");

$md = "
{
    \"name\": \"LiveZilla\",
    \"short_name\": \"LiveZilla\",
    \"icons\": [
        {
            \"src\": \"img/icon192.png\",
            \"sizes\": \"192x192\",
            \"type\": \"image/png\"
        },
        {
            \"src\": \"img/icon512.png\",
            \"sizes\": \"512x512\",
            \"type\": \"image/png\"
        }
    ],
    \"theme_color\": \"#1a364c\",
    \"background_color\": \"#1a364c\",
    \"display\": \"standalone\",
    \"scope\": \"./\",
    \"prefer_related_applications\": false,
    \"start_url\": \"./\"
}";

header('Content-Type: application/json');

exit($md);