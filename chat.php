<?php
/****************************************************************************************
* LiveZilla chat.php
* 
* Copyright 2018 LiveZilla GmbH
* All rights reserved.
* LiveZilla is a registered trademark.
* 
* Improper changes to this file may cause critical errors.
***************************************************************************************/ 

define("IN_LIVEZILLA",true);
if(!defined("LIVEZILLA_PATH"))
	define("LIVEZILLA_PATH","./");
	
@ini_set('session.use_cookies', '0');
@error_reporting(E_ALL);

$html = "";

require(LIVEZILLA_PATH . "_definitions/definitions.inc.php");
require(LIVEZILLA_PATH . "_lib/functions.global.inc.php");
require(LIVEZILLA_PATH . "_definitions/definitions.protocol.inc.php");
require(LIVEZILLA_PATH . "_definitions/definitions.dynamic.inc.php");
require(LIVEZILLA_PATH . "_lib/functions.external.inc.php");
require(LIVEZILLA_PATH . "_lib/objects.external.inc.php");

Server::InitDataProvider();
Server::DefineURL(FILE_CHAT);
LocalizationManager::AutoLoad();

if(!DBManager::$Connected)
    exit("Can't connect to database");

$html = IOStruct::GetFile(PATH_TEMPLATES . "chat_v2.tpl");
$html = str_replace("<!--logor-->","<img src=\"". Server::$Configuration->File["gl_cahi"]."\" border=\"0\">",$html);
$html = str_replace("<!--btop-->",((!empty(Server::$Configuration->File["gl_cali"]) || !empty(Server::$Configuration->File["gl_cahi"])) ? "100px" : "0"),$html);
$cid = Communication::GetParameter("linkid","");

if(strlen($cid)==32 && Configuration::GetCodeById($cid) != null)
{
    $html = str_replace("<!--widget-->",Configuration::GetCodeById($cid),$html);
}
else
{
    $html = str_replace("<!--widget-->",OverlayChat::GetDefaultScript(true),$html);
    $html = str_replace("<!--ptdata-->",OverlayChat::GetPassThruObjectKeys(),$html);
}

$html = str_replace("<!--server-->","<!--server-->server.php",$html);
exit(Server::Replace($html));
?>
