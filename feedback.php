<?php
/****************************************************************************************
 * LiveZilla feedback.php
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

@set_error_handler("handleError");
if(Server::InitDataProvider())
{
    Server::InitDataBlock(array("DBCONFIG","INTERNAL"));
    LocalizationManager::AutoLoad();
    $fb_html = IOStruct::GetFile(PATH_TEMPLATES . "feedback.tpl");
    $chat = VisitorChat::GetByChatId(intval(Communication::ReadParameter("cid",0)));
    $ticket = Ticket::GetById(intval(Communication::ReadParameter("tid","")));
    $etc = Communication::ReadParameter("etc","");
    $saveFeedback = false;

    if($ticket != null)
        $ticket->Load(true,true);

    if(Feedback::IsFlood())
    {
        $fb_html = str_replace("<!--title-->","<br><br><br>" . str_replace("<!--count-->",MAX_FEEDBACKS_PER_DAY,LocalizationManager::$TranslationStrings["client_feedback_max"]),$fb_html);
        $fb_html = str_replace("<!--visible-->","none",$fb_html);
    }
    else if(!empty($_POST))
    {
        $userid = "";
        $feedback = new Feedback(getId(32));

        $saveFeedback = (isset($_POST["p_save_fb"]) && $_POST["p_save_fb"] == "1");

        if($chat != null)
        {
            $feedback->ChatId = $chat->ChatId;
            $feedback->UserId = $userid = $chat->UserId;
            $feedback->GroupId = $chat->DesiredChatGroup;
            $feedback->OperatorId = $chat->GetHostOperator();
            $visitor = new Visitor($chat->UserId);
            $visitor->LoadVisitorData();
            $feedback->VisitorData = $visitor->VisitorData;
            Visitor::CloseAllOverlays($chat->UserId);
            $visitor->ForceUpdate();
        }
        else if($ticket != null)
        {
            $feedback->UserId = $ticket->SenderUserId;
            $feedback->TicketId = $ticket->Id;
            if(!empty($ticket->Editor))
            {
                $feedback->OperatorId = $ticket->Editor->Editor;
                $feedback->GroupId = $ticket->Group;
            }
            $feedback->VisitorData = UserData::FromTicketMessage($ticket->Messages[0]);

            $visitor = new Visitor($ticket->SenderUserId);
            $visitor->ForceUpdate();

            // close
            $ticket->Load(true,false);
            if(isset($_POST["p_close_ticket"]) && !empty($_POST["p_close_ticket"]))
            {
                if($ticket->Salt == Encoding::Base64UrlDecode($_POST["p_close_ticket"]))
                {
                    if($ticket->Editor != null && $ticket->Editor->Status != 2)
                    {
                        $ticket->Log(0,"",2,$ticket->Editor->Status);
                        $ticket->Editor->Status = 2;
                        $ticket->Editor->Save();
                        $time = SystemTime::GetUniqueMessageTime(DATABASE_TICKETS,"last_update");
                        $ticket->SetLastUpdate($time);
                        CacheManager::SetDataUpdateTime(DATA_UPDATE_KEY_TICKETS);
                    }
                }
            }
        }

        $isSpam = (!empty(Server::$Configuration->File["gl_sfc"]) && Visitor::CreateSPAMFilter($userid,false));
        if(!$isSpam)
        {
            $feedback->AddCriteriaDataFromServerInput();
            if($saveFeedback)
                $feedback->Save();
        }
        else
            Logging::GeneralLog("Feedback matches SPAM filter rule.");

        $fb_html = str_replace("<!--sub_title-->",LocalizationManager::$TranslationStrings["client_feedback_success"],$fb_html);
        $fb_html = str_replace("<!--title-->","<br><br><br>" . LocalizationManager::$TranslationStrings["client_thank_you"],$fb_html);
        $fb_html = str_replace("<!--visible-->","none",$fb_html);
        $fb_html = str_replace("<!--ids-->","",$fb_html);
    }
    else
    {
        $inputs_html = $js_id_list = "";
        foreach(Server::$Configuration->Database["gl_fb"] as $id => $criteria)
        {
            if(!empty($js_id_list))
                $js_id_list .= ",";

            $js_id_list .= "'" . $id . "'";
            $inputs_html .= $criteria->GetHTML();
        }

        $fb_html = str_replace("<!--criteria-->",$inputs_html,$fb_html);
        $fb_html = str_replace("<!--ids-->",$js_id_list,$fb_html);
        $fb_html = str_replace("<!--visible-->","",$fb_html);
        $fb_html = str_replace("<!--sub_title-->","",$fb_html);

        // close ticket
        if(isset($_GET["tid"]) && isset($_GET["close"]) && is_numeric(Encoding::Base64UrlDecode($_GET["tid"])) && isset($_GET["salt"]))
        {
            $fb_html = str_replace("<!--lang_client_send-->","<!--lang_client_close-->",$fb_html);
            $fb_html = str_replace("<!--close_ticket-->",Encoding::Base64UrlEncode($_GET["salt"]),$fb_html);
        }
        else
        {
            $fb_html = str_replace("<!--close_ticket-->","",$fb_html);
            $fb_html = str_replace("<!--lang_client_close_no_feedback-->","",$fb_html);
        }

        if(!empty($etc))
            $fb_html = str_replace("<!--style-->","background:#" . Colors::CorrectHEX($etc),$fb_html);

        if(!empty($chat) && !empty(Server::$Operators[$chat->DesiredChatPartner]) && empty($chat->GroupChat))
            $fb_html = str_replace("<!--title-->",str_replace("<!--fullname-->",Server::$Operators[$chat->DesiredChatPartner]->GetPublicName(),LocalizationManager::$TranslationStrings["client_feedback_title_personal"]),$fb_html);
        else
            $fb_html = str_replace("<!--title-->",LocalizationManager::$TranslationStrings["client_feedback_title"],$fb_html);
    }

    $fb_html = str_replace(array("<!--ids-->","<!--style-->"),"",$fb_html);
    exit(Server::Replace($fb_html));
}
?>