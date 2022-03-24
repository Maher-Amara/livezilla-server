<?php
/****************************************************************************************
 * LiveZilla print.php
 *
 * Copyright 2017 LiveZilla GmbH
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

$print = "";
@set_error_handler("handleError");
if(Server::InitDataProvider())
{
    Server::DefineURL("print.php");
    if(!empty($_GET[GET_TRACK_CHATID]) && !empty($_GET[GET_TRACK_BROWSERID]) && !empty($_GET[GET_TRACK_USERID]))
    {
        $archive = new Chat();
        $archive->ChatId = intval(Communication::GetParameter("c",""));
        $archive->Load();
        $chat = VisitorChat::GetByChatId($archive->ChatId);
        if($chat != null)
        {
            $chat->LastActive = time();
            if($chat->BrowserId == Communication::GetParameter(GET_TRACK_BROWSERID,"") && $chat->UserId == Communication::GetParameter(GET_TRACK_USERID,"") &&  $chat->LastActive > (time()-3600))
            {
                LocalizationManager::AutoLoad();
                $visitor = new Visitor($chat->UserId);
                $visitor->LoadVisitorData();
                $print = IOStruct::GetFile(PATH_TEMPLATES . "print.tpl");
                $archive->Generate($archive->ChatId,$visitor->VisitorData->Fullname,true,true);
                $print = str_replace("<!--chat_id-->",$archive->ChatId,$print);
                $print = str_replace("<!--transcript-->",nl2br($archive->PlainText),$print);
                $print = Mailbox::FinalizeDataBlock($print,true);
                $print = Server::Replace($print,true,true,false,false,false);
            }
        }
        exit($print);
    }
}
?>