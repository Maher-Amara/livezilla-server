<?php

/****************************************************************************************
 * LiveZilla ticket.php
 *
 * Copyright 2018 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 * Improper changes to this file may cause critical errors.
 ***************************************************************************************/

define("IN_LIVEZILLA",true);
header('Content-Type: text/html; charset=utf-8');
if(!defined("LIVEZILLA_PATH"))
    define("LIVEZILLA_PATH","./");

require(LIVEZILLA_PATH . "_definitions/definitions.inc.php");
require(LIVEZILLA_PATH . "_lib/functions.global.inc.php");
require(LIVEZILLA_PATH . "_definitions/definitions.dynamic.inc.php");
require(LIVEZILLA_PATH . "_definitions/definitions.protocol.inc.php");

if(is_numeric($_GET["inputid"]))
{
    if(Is::WildcardMatch(strtolower(Encoding::Base64UrlDecode($_GET["data"])),strtolower($_GET["value"])))
    {
        echo "lz_validate_input_result(true,".intval($_GET["inputid"]).");";
        exit();
    }
    else
    {
        echo "lz_validate_input_result(false,".intval($_GET["inputid"]).");";
        exit();
    }
}
?>