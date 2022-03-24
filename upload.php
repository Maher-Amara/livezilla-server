<?php
/****************************************************************************************
 * LiveZilla upload.php
 *
 * Copyright 2018 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 * Improper changes to this file may cause critical errors.
 ***************************************************************************************/

define("IN_LIVEZILLA",true);
header("Access-Control-Allow-Origin: *");
header('Content-Type: text/html; charset=utf-8');
if(!defined("LIVEZILLA_PATH"))
    define("LIVEZILLA_PATH","./");

require(LIVEZILLA_PATH . "_definitions/definitions.inc.php");
require(LIVEZILLA_PATH . "_lib/functions.global.inc.php");
require(LIVEZILLA_PATH . "_definitions/definitions.dynamic.inc.php");
require(LIVEZILLA_PATH . "_definitions/definitions.protocol.inc.php");

@set_error_handler("handleError");

if(Server::InitDataProvider())
{
    if(Logging::IsFileFlood())
        exit("503.7");

    if(!isset($_POST["elem"]))
        exit("503.32");

    $bId = null;
    $uId = null;
    $chat = null;
    $gId = Communication::ReadParameter("gid","");
    $visitor = null;
    $fInd = 1;

    // load chat
    if(isset($_REQUEST["cid"]) && !empty($_REQUEST["cid"]))
    {
        $chat = VisitorChat::GetByChatId(Communication::ReadParameter("cid",0));
        if($chat != null)
        {
            $uId = $chat->UserId;
            $bId = $chat->BrowserId;
            $visitor = new Visitor($uId);
            $visitor->Load();
            $visitor->LoadVisitorData();
        }
    }

    // load visitor
    if(isset($_REQUEST["bid"]) && !empty($_REQUEST["bid"]) && isset($_REQUEST["uid"]) && !empty($_REQUEST["uid"]) && isset($_REQUEST["find"]))
    {
        $uId = Communication::ReadParameter("uid","");
        $bId = Communication::ReadParameter("bid","");
        $fInd = Communication::ReadParameter("find",0);

        if(strlen($bId) <= USER_ID_LENGTH+4 && strlen($uId) == USER_ID_LENGTH && strlen($fInd)<4)
        {
            $visitor = new Visitor($uId);
            $visitor->Load();
            $visitor->LoadVisitorData();
        }
        else
            exit("503.1");
    }

    if(!empty(Server::$Configuration->File["gl_vmac"]) && !($visitor != null && Communication::GetIP() == $visitor->IP))
        exit("503.3");

    if(!empty($visitor->Closed))
        exit("503.4");

    Server::InitDataBlock(array("GROUPS","INPUTS"));

    if(!isset(Server::$Groups[$gId]))
        exit("503.18");

    if($chat != null && $_POST["elem"] == "chat")
    {
        if($chat->ExternalClosed || $chat->InternalClosed)
            exit("503.20");

        if(isset($_POST["form_userfile"]))
        {
            if(isset($_POST["type"]) && $_POST["type"] == "file")
            {
                // chat fu
                if(empty(Server::$Groups[$gId]->ChatFunctions[5]))
                    exit("503.19");

                $fileid = "";
                if(StoreFileChat($visitor->UserId,$chat->GetHostOperator(),$visitor->VisitorData->Fullname,$chat))
                {
                    exit();
                }
            }
            else if(isset($_POST["type"]) && $_POST["type"] == "screenshot")
            {
                // chat screen capture
                if(empty(Server::$Groups[$gId]->ChatFunctions[6]))
                    exit("503.22");

                $fileid = "";

                if(StoreScreenCaptureChat($visitor->UserId,$bId,$chat->GetHostOperator(),$visitor->VisitorData->Fullname,$chat,$fileid))
                {
                    exit();
                }
            }
        }
    }
    else if($_POST["elem"] == "ticket")
    {
        // ticket fu
        if(!isset(Server::$Inputs[$fInd]))
            exit("503.29");

        if(!Server::$Inputs[$fInd]->Active)
            exit("503.21");

        // file upload
        if(isset($_POST["type"]) && $_POST["type"] == "file")
        {
            $fileId = "";
            $fileName = "";

            if(StoreFileTicket($uId,$fInd,$fileId,$fileName))
            {
                exit("");
            }
        }
        else
        {
            // screen capture
            if(isset($_POST["form_userfile"]))
            {
                $fileName = "screenshot.lzsc";
                if(StoreScreenCaptureTicket($uId,$fInd,$fileId,$fileName))
                {
                    exit("");
                }
            }
        }
    }
    else
        exit("503.56");
}

function StoreFileTicket($_userId,$_fInd,&$_fId,&$_fName)
{
    $fileid = GetFileId();

    if($fileid === false)
        return false;

    $filemask = GetFileMask($fileid);

    Logging::SecurityLog("Upload::UploadFileTicket",$filemask);

    if(StoreFile($filemask, $_POST["form_userfile"],false))
    {
        $fname = base64_decode($_POST["fname"]);
        KnowledgeBase::CreateEntry($_userId."_".$_fInd, $fileid, $filemask, 3, $fname, 0, 100, strlen($_POST["form_userfile"]));
        $_fId = $fileid;
        $_fName = IOStruct::GetNamebase($fname);
        return true;
    }
    return false;
}

function StoreScreenCaptureTicket($_userId,$_fInd,&$_fId,&$_fName)
{
    $fileid = getId(32);
    $fname = "screenshot.lzsc";

    Logging::SecurityLog("Upload::UploadFileCapture",$fname);

    $filemask = GetFileMask($fileid);

    if(StoreFile($filemask, $_POST["form_userfile"],true))
    {
        KnowledgeBase::CreateEntry($_userId."_".$_fInd, $fileid, $filemask, 3, $fname, 0, 100, strlen($_POST["form_userfile"]));
        $_fId = $fileid;
        $_fName = IOStruct::GetNamebase($fname);
        return true;
    }
    return false;
}

function StoreScreenCaptureChat($_userId,$_browserId,$_partner,$_fullname,$_chat,&$_fileId)
{
    $fileid = GetFileId();

    if($fileid === false)
        return false;

    $filemask = GetFileMask($fileid);

    if(empty($_fullname))
    {
        LocalizationManager::AutoLoad();
        $_fullname = LocalizationManager::$TranslationStrings["client_guest"] . " " . Visitor::GetNoName($_userId.Communication::GetIP());
    }

    $discarded = 0;
    if(isset($_POST["p_stream"]))
        $discarded = 2;
    else
        Logging::SecurityLog("Upload::UploadScreenCaptureChat",$filemask);

    if(StoreFile($filemask, $_POST["form_userfile"], true))
    {
        KnowledgeBase::CreateFolders($_partner,false);
        KnowledgeBase::CreateEntry($_partner, $_userId, $_fullname, 0, $_fullname, 0, 5);
        KnowledgeBase::CreateEntry($_partner, $fileid, $filemask, 4, "screenshot.lzsc", $discarded, $_userId, strlen($_POST["form_userfile"]),"",$_chat->ChatId, $_browserId);

        if(!isset($_POST["p_stream"]))
        {
            if(!$_chat->Waiting)
                foreach($_chat->Members as $mem)
                {
                    $post = new Post(getId(32),$_chat->SystemId,$mem->SystemId,"screenshot.lzsc"."[__[screenshot:".$fileid."]__]",time(),$_chat->ChatId,$_fullname);
                    $post->ReceiverGroup = $_chat->SystemId;
                    $post->Save();
                }
            else
            {
                $post = new Post(getId(32),$_chat->SystemId,"","screenshot.lzsc"."[__[screenshot:".$fileid."]__]",time(),$_chat->ChatId,$_fullname);
                $post->ReceiverGroup = $_chat->SystemId;
                $post->Save();
            }
        }

        $_fileId = $fileid;
        return true;
    }
    return false;
}

function StoreFileChat($_userId,$_partner,$_fullname,$_chat)
{
    $fileid = GetFileId();

    if($fileid === false)
        return false;

    $filemask = GetFileMask($fileid);
    $fname = base64_decode($_POST["fname"]);

    Logging::SecurityLog("Upload::UploadFileChat",$filemask);

    if(empty($_fullname))
    {
        LocalizationManager::AutoLoad();
        $_fullname = LocalizationManager::$TranslationStrings["client_guest"] . " " . Visitor::GetNoName($_userId.Communication::GetIP());
    }

    if(StoreFile($filemask, $_POST["form_userfile"] ,false))
    {
        KnowledgeBase::CreateFolders($_partner, false);
        KnowledgeBase::CreateEntry($_partner, $_userId, $_fullname, 0, $_fullname, 0, 5);
        KnowledgeBase::CreateEntry($_partner, $fileid, $filemask, 4, $fname, 0, $_userId, strlen($_POST["form_userfile"]),"",$_chat->ChatId);

        if(!$_chat->Waiting)
            foreach($_chat->Members as $mem)
            {
                $post = new Post(getId(32),$_chat->SystemId,$mem->SystemId,$fname."[__[file:".$fileid."]__]",time(),$_chat->ChatId,$_fullname);
                $post->ReceiverGroup = $_chat->SystemId;
                $post->Save();
            }
        else
        {
            $post = new Post(getId(32),$_chat->SystemId,"",$fname."[__[file:".$fileid."]__]",time(),$_chat->ChatId,$_fullname);
            $post->ReceiverGroup = $_chat->SystemId;
            $post->Save();
        }

        return true;
    }
    return false;
}

function StoreFile($_filemask, $_data, $_screenshot=false)
{
    $_data = base64_decode($_data);

    if(!$_screenshot)
        $_data = Str::DataURLToBinary($_data);

    if(!(isset(Server::$Configuration->File["gl_enfu"]) && !Server::$Configuration->File["gl_enfu"]))
        return IOStruct::CreateFile(PATH_UPLOADS . $_filemask, Encoding::EncryptFile($_data) ,false);
    else
        return IOStruct::CreateFile(PATH_UPLOADS . $_filemask, $_data ,false);
}

function GetFileId()
{
    $filename = IOStruct::GetNamebase($_POST["fname"]);

    if(!IOStruct::IsValidUploadFile(base64_decode($filename)))
        return false;
    else
    {
        $fileid = getId(32);
        return $fileid;
    }
}

function GetFileMask($_fileId)
{
    return getId(10) . "_" . $_fileId;
}

?>