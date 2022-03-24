<?php
/****************************************************************************************
* LiveZilla getfile.php
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

header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

require(LIVEZILLA_PATH . "_definitions/definitions.inc.php");
require(LIVEZILLA_PATH . "_definitions/definitions.protocol.inc.php");
require(LIVEZILLA_PATH . "_lib/functions.global.inc.php");
require(LIVEZILLA_PATH . "_definitions/definitions.dynamic.inc.php");

if(Server::InitDataProvider())
{
    Server::DefineURL("getfile.php");

    $streamView = false;
    $streamUpdate = false;
    $userId = "";
    $browserId = "";
    $operatorToken = "";

    if(!isset($_GET["id"]) && isset($_GET["userid"]) && strpos($_GET["userid"],".") === false)
        if(isset($_GET["token"]) && strpos($_GET["token"],".") === false)
            if(isset($_GET["browserid"]) && strpos($_GET["browserid"],".") === false)
            {
                Server::InitDataBlock(array("INTERNAL"));
                if(Operator::ValidateToken($_GET["token"]))
                {
                    $operatorToken = $_GET["token"];
                    $streamView = true;

                    $count=0;
                    while($count<30)
                    {
                        $lastFileId = KnowledgeBaseEntry::GetIdByUserId($_GET["userid"],$_GET["browserid"]);

                        if($lastFileId != null)
                        {
                            $userId = $_GET["userid"];
                            $browserId = $_GET["browserid"];
                            $_GET["id"] = $lastFileId;
                            break;
                        }
                        else
                        {
                            $html = "<html><head><meta http-equiv=\"refresh\" content=\"5; url=./getfile.php?userid=".$_GET["userid"]."&browserid=".$_GET["browserid"]."&token=".$_GET["token"]."\" /></head>";
                            $html .= "<body style=\"padding:60px;font-family:arial,verdana;color:#778999;font-weight:bold;text-align:center;font-size:80%;\">Connecting, please wait ...</body>";
                            $html .= "</html>";
                            exit($html);
                        }
                    }
                }
                else
                    exit("505.21");
            }

    if(isset($_GET["id"]))
    {
        $id = $_GET["id"];
        if(strpos($id,".") === false && !Is::Null($res = KnowledgeBaseEntry::GetById($id)))
        {
            if(file_exists("./uploads/" . $res["value"]) && strpos($res["value"],"..") === false)
            {
                if($res["title"] == "screenshot.lzsc")
                {
                    $data = GetScreenshotData($id,$res,$streamView,$userId,$browserId,$operatorToken);
                }
                else
                {
                    $data = GetFileData($res);
                }
                exit($data);
            }
        }
    }
}

function GetFileData($res){

    $mime = To::MIMEType($res["title"]);

    if(empty($mime))
        $mime = "application/octet-stream";

    header('Content-Description: File Transfer');
    header('Content-Type: ' . $mime);

    $att = (Is::ImageFilename($res["title"])) ? "" : "attachment;";

    header('Content-Disposition: ' . $att . 'filename=' . urlencode($res["title"]));

    $data = Encoding::DecryptFile(file_get_contents("./uploads/" . $res["value"]));

    header('Content-Length: ' . strlen($data));

    return $data;
}

function GetScreenshotData($id,$res,$_stream,$_userId,$_browserId="",$_token=""){

    $capdata = Encoding::DecryptFile(file_get_contents("./uploads/" . $res["value"]));
    $capdata = explode("|||",$capdata);

    $url = base64_decode($capdata[1]);

    if(Communication::GetScheme() == SCHEME_HTTP_SECURE)
        if(strpos(strtolower($url),SCHEME_HTTP) === 0)
            $url = str_replace(SCHEME_HTTP,SCHEME_HTTP_SECURE,$url);

    //if(isset($_GET["noresize"]))
      //  $url .= "&noresize=1";

    // firefox and ie require this
    if(strpos($url,"?") !== false)
        $acid = "&" . getId(2) . "=" . getId(2);
    else
        $acid = "?" . getId(2) . "=" . getId(2);

    if(!$_stream || isset($_GET["lzscrcap"]))
        $url .= $acid . "#lzscrcap_" . $id;
    else if($_stream || isset($_GET["lzscrcapstr"]))
        $url .= $acid . "#lzscrcapstr_" . $_userId . "_" . $_browserId . "_" . $_token;

    if(isset($_GET["lzscrcap"]) || isset($_GET["lzscrcapstr"]))
    {
        if(!isset($capdata[7]))
            $capdata[7] = -1;
        if(!isset($capdata[8]))
            $capdata[8] = -1;

        exit("LiveZilla.Engine.ApplyScreenCapture('" . $capdata[0] . "','" . $capdata[2] . "','" . $capdata[5] . "','" . $capdata[6] . "','" . $capdata[7] . "','" . $capdata[8] . "','" . $url . "',".To::BoolString($_stream).");");
    }

    $html = IOStruct::GetFile(PATH_TEMPLATES . "capture.tpl");
    $html = str_replace("<!--w-->",$capdata[3],$html);
    $html = str_replace("<!--h-->",$capdata[4]-5,$html);
    $html = str_replace("<!--name-->",getId(10),$html);
    $html = str_replace("<!--url-->",$url,$html);
    $html = str_replace("<!--id-->",$id,$html);
    $html = str_replace("<!--noresize-->",To::BoolString(isset($_GET["noresize"])),$html);

    return $html;
}

header("HTTP/1.0 404 Not Found");
?>