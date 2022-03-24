<?php

/****************************************************************************************
* LiveZilla image.php
* 
* Copyright 2018 LiveZilla GmbH
* All rights reserved.
* LiveZilla is a registered trademark.
* 
* Improper changes to this file may cause critical errors. 
*
***************************************************************************************/ 

define("IN_LIVEZILLA",true);

if(!defined("LIVEZILLA_PATH"))
	define("LIVEZILLA_PATH","./");
	
@set_time_limit(30);

require(LIVEZILLA_PATH . "_definitions/definitions.inc.php");
require(LIVEZILLA_PATH . "_lib/functions.global.inc.php");
require(LIVEZILLA_PATH . "_definitions/definitions.dynamic.inc.php");
require(LIVEZILLA_PATH . "_definitions/definitions.protocol.inc.php");
require(LIVEZILLA_PATH . "_lib/functions.external.inc.php");

@set_error_handler("handleError");
@error_reporting(E_ALL);

header("Pragma: no-cache");
header("Cache-Control: no-cache, must-revalidate");
header("Keep-Alive: timeout=5, max=100");

Server::InitDataProvider();

$html = "";
if(!empty($_GET["id"]) && is_numeric($_GET["id"]))
{
	$prefix = ((!empty($_GET["type"]) && $_GET["type"] == "overlay") ? "overlay" : "inlay");
	if(isChat())
		exit(getFileById($_GET["id"],true,$prefix));
	else
	{
		if(!empty($_GET["cboo"]))
		{
            header('Content-Type: image/gif');
            exit(base64_decode('R0lGODlhAQABAJAAAP8AAAAAACH5BAUQAAAALAAAAAABAAEAAAICBAEAOw=='));

            /*
			header("Content-Type: image/png;");
			exit(file_get_contents(PATH_IMAGES . "avatar.png"));
            */
		}
		else
			exit(getFileById($_GET["id"],false,$prefix));
	}
}
else if(!empty($_GET["tl"]) && !empty($_GET["srv"]))
{
	$html = "<a href=\\\"javascript:void(window.open('<!--server-->','','width=".Server::$Configuration->File["wcl_window_width"].",height=".Server::$Configuration->File["wcl_window_height"].",left=0,top=0,resizable=yes,menubar=no,location=no,status=yes,scrollbars=yes'))\\\" <!--class--><!--css-->><!--text--></a>";
	$html = str_replace("<!--server-->",htmlentities(Encoding::Base64UrlDecode($_GET["srv"]),ENT_QUOTES,"UTF-8"),$html);
	
	if(!empty($_GET["tlont"]) && isChat())
	{
		if(!empty($_GET["tlonc"]))
			$html = str_replace("<!--class-->","class=\\\"".htmlentities(Encoding::Base64UrlDecode($_GET["tlonc"]),ENT_QUOTES,"UTF-8")."\\\"",$html);
		else
			$html = str_replace("<!--class-->","",$html);

        if(!empty($_GET["tlons"]))
            $html = str_replace("<!--css-->","style=\\\"".htmlentities(Encoding::Base64UrlDecode($_GET["tlons"]),ENT_QUOTES,"UTF-8")."\\\"",$html);
        else
            $html = str_replace("<!--css-->","",$html);

		//$html = processPlaceholders($html);
		$html = str_replace("<!--text-->",htmlentities(Encoding::Base64UrlDecode($_GET["tlont"]),ENT_QUOTES,"UTF-8"),$html);
	}
	else if(!empty($_GET["tloft"]) && empty($_GET["tloo"]))
	{
		if(!empty($_GET["tlofc"]))
			$html = str_replace("<!--class-->","class=\\\"".htmlentities(Encoding::Base64UrlDecode($_GET["tlofc"]),ENT_QUOTES,"UTF-8")."\\\"",$html);
		else
			$html = str_replace("<!--class-->","",$html);

        if(!empty($_GET["tlofs"]))
            $html = str_replace("<!--css-->","style=\\\"".htmlentities(Encoding::Base64UrlDecode($_GET["tlofs"]),ENT_QUOTES,"UTF-8")."\\\"",$html);
        else
            $html = str_replace("<!--css-->","",$html);

		$html = str_replace("<!--text-->",htmlentities(Encoding::Base64UrlDecode($_GET["tloft"]),ENT_QUOTES,"UTF-8"),$html);
	}
	else
		$html = "";

	if(!empty($html))
    {
        header("Content-Type: application/javascript;");
        $sid = (isset($_GET["sid"]) && strlen($_GET["sid"])==32) ? $_GET["sid"] : "lz_textlink";
	    exit("var nc = document.createElement('div');nc.style.padding=0;nc.style.margin=0;nc.innerHTML=\"".$html."\";var tlscr = document.getElementById('".$sid."');tlscr.parentNode.insertBefore(nc, tlscr);");
    }
}

function processPlaceholders($html)
{
    /*
	$params = array("el","en","ee","ec","code","eq","eh");
	$placeholders = array("language","name","email","company","code","question","header_url");

	foreach($params as $key => $value)
	{
		if(!empty($_GET[$value]))
			$html = str_replace("&lt;!--replace_me_with_b64url_".$placeholders[$key]."--&gt;",Encoding::Base64UrlEncode(Encoding::Base64UrlDecode($_GET[$value])),$html);
		else
			$html = str_replace("&lt;!--replace_me_with_b64url_".$placeholders[$key]."--&gt;","",$html);
	}

	for($i=0;$i<10;$i++)
	{
		if(!empty($_GET["cf".$i]))
			$html = str_replace("&lt;!--replace_me_with_b64url_custom_".$i."--&gt;",Encoding::Base64UrlEncode(Encoding::Base64UrlDecode($_GET["cf".$i])),$html);
		else
			$html = str_replace("&lt;!--replace_me_with_b64url_custom_".$i."--&gt;","",$html);
	}
	return $html;
    */
}

function getFileById($_id,$_online,$_type)
{
	$result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_IMAGES . "` WHERE `id`='" . DBManager::RealEscape($_id) . "' AND `button_type`='" . DBManager::RealEscape($_type) . "' AND `online`='" . DBManager::RealEscape(($_online) ? "1" : "0") . "' LIMIT 1;");
	if($result && $row = DBManager::FetchArray($result))
	{
		header("Content-Type: image/".$row["image_type"].";");
		return base64_decode($row["data"]);
	}
	else
	{
		header("Content-Type: image/gif;");
		return file_get_contents(PATH_IMAGES . "chat_blank.gif");
	}
}
?>