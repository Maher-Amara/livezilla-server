<?php
/****************************************************************************************
 * LiveZilla ovl.php
 *
 * Copyright 2017 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 * Improper changes to this file may cause critical errors.
 ***************************************************************************************/

if(!defined("LIVEZILLA_PATH"))
    define("LIVEZILLA_PATH","./");

@ini_set('session.use_cookies', '0');
@error_reporting(E_ALL);

require_once(LIVEZILLA_PATH . "_lib/functions.external.inc.php");
require_once(LIVEZILLA_PATH . "_lib/objects.external.inc.php");

@set_time_limit(Server::$Configuration->File["timeout_chats"]);
if(!isset($_GET["file"]))
    @set_error_handler("handleError");
if(!isset($_GET[GET_TRACK_BROWSERID]))
    exit();

LocalizationManager::AutoLoad();
Server::InitDataBlock(array("INTERNAL","GROUPS","FILTERS","INPUTS"));
Server::$Operators[SYSTEM] = Operator::GetSystemOperator();

$OVERLAY = new OverlayChat();
$OVERLAY->Version = 2;

VisitorMonitoring::$Visitor->Browsers[0] = new VisitorChat(VisitorMonitoring::$Visitor->UserId,VisitorMonitoring::$Visitor->UserId . "_OVL");
VisitorMonitoring::$Visitor->Browsers[1] = VisitorMonitoring::$Browser;
VisitorMonitoring::$Visitor->Browsers[0]->VisitId = VisitorMonitoring::$Visitor->VisitId;

$OVERLAY->GroupBuilder = new GroupBuilder(VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatGroup,VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatPartner,false);
$OVERLAY->GroupBuilder->Generate(null,true);

VisitorMonitoring::$Visitor->Browsers[0]->Overlay = true;
VisitorMonitoring::$Visitor->Browsers[0]->Load();

$OVERLAY->KnowledgebaseSearch();

if(IS_FILTERED && !FILTER_ALLOW_CHATS)
{
    VisitorMonitoring::$Visitor->Browsers[0]->CloseChat();
    VisitorMonitoring::$Visitor->Browsers[0]->Destroy();

    if(!FILTER_ALLOW_TICKETS)
        VisitorMonitoring::$Visitor->AddFunctionCall("lz_tracking_remove_overlay_chat();",true);
}

$OVERLAY->DefineTargets();
$OVERLAY->DefineModes();
$OVERLAY->IsHumanChatAvailable = $OVERLAY->HumanGeneral;
$OVERLAY->CreateChatTemplate();
$OVERLAY->RemoveTicketFile();
$OVERLAY->ProcessTicket(VisitorMonitoring::$Visitor);

if(isset($_GET["ri"]))
    VisitorMonitoring::$Visitor->Browsers[0]->ReplaceLoginDetails(VisitorMonitoring::$Visitor,false,true);
if((VisitorMonitoring::$Visitor->Browsers[0]->Status > CHAT_STATUS_OPEN || !empty(VisitorMonitoring::$Visitor->Browsers[0]->InitChatWith) || VisitorMonitoring::$Visitor->Browsers[0]->Waiting) && !VisitorMonitoring::$Visitor->Browsers[0]->Closed)
    Visitor::$IsActiveOverlayChat = $OVERLAY->IsHumanChatAvailable = !VisitorMonitoring::$Visitor->Browsers[0]->Declined;
else if(VisitorMonitoring::$Visitor->Browsers[0]->Closed && VisitorMonitoring::$Visitor->Browsers[0]->LastActive > (time()-Server::$Configuration->File["timeout_chats"]) || !empty($_GET["mi0"]))
    Visitor::$IsActiveOverlayChat = !VisitorMonitoring::$Visitor->Browsers[0]->Declined;

if(!empty(VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatGroup) && isset(Server::$Groups[VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatGroup]) && !(IS_FILTERED && !FILTER_ALLOW_CHATS && !FILTER_ALLOW_TICKETS))
{
    $group = Server::$Groups[VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatGroup];
    $changed = (Visitor::$PollCount!=1) ? VisitorMonitoring::$Visitor->ApplyOverlayInputValues($group) : false;

    if(empty(VisitorMonitoring::$Visitor->Browsers[0]->Subject) && !empty($_GET["mp0"]))
        VisitorMonitoring::$Visitor->Browsers[0]->Subject = Str::Cut(Encoding::Base64UrlDecode($_GET["mp0"]),600);

    if(Communication::ReadParameter("tc",-1) != -1)
        $changed = true;

    if((VisitorMonitoring::$Visitor->Browsers[0]->Status > CHAT_STATUS_OPEN || VisitorMonitoring::$Visitor->Browsers[0]->Waiting) && isset($_GET["di"]) && ($changed || VisitorMonitoring::$Visitor->VisitorData->Id != $_GET["di"]))
    {
        VisitorMonitoring::$Visitor = VisitorMonitoring::$Visitor->Browsers[0]->ReplaceLoginDetails(VisitorMonitoring::$Visitor,true,true);
        VisitorMonitoring::$Visitor->AddFunctionCall("lz_chat_load_input_values(true);",false);
        VisitorMonitoring::$Visitor->AddFunctionCall("lz_chat_update_name();",false);
        VisitorMonitoring::$Visitor->VisitorData->SaveToCookie();
    }

    if($changed)
    {
        VisitorMonitoring::$Visitor->ApplyVisitorData();
        if(!VisitorMonitoring::$Visitor->Browsers[0]->Closed)
            VisitorMonitoring::$Visitor->Browsers[0]->UpdateArchive((Communication::ReadParameter("tc",-1) == 1) ? VisitorMonitoring::$Visitor->VisitorData->Email : "");
    }

    if(Visitor::$PollCount == 1)
    {
        VisitorMonitoring::$Response .= "var lz_default_info_text = '<!--lang_client_type_message-->';
                                            var lz_text_not_available = '<!--lang_client_chat_not_available-->';
                                            var lz_text_connecting_info = '<!--lang_client_trying_to_connect_you-->';
                                            var lz_text_save = '<!--lang_client_save-->';
                                            var lz_text_back = '<!--lang_client_back-->';
                                            var lz_text_send_message = '<!--lang_client_send_message-->';
                                            var lz_text_start_chat = '<!--lang_client_start_chat-->';
                                            var lz_text_ticket_header = '<!--lang_client_ticket_header-->';
                                            var lz_text_please_select = '<!--lang_client_please_select-->';
                                            var lz_text_chat_information = '<!--lang_client_start_chat_information-->';
                                            var lz_text_chat_information_offline = '<!--lang_client_start_chat_information_offline-->';
                                            var lz_text_leave_message = '<!--lang_client_leave_message-->';
                                            var lz_text_change_details = '<!--lang_client_change_my_details-->';
                                            var lz_text_arrives = '<!--lang_client_intern_arrives-->';
                                            var lz_text_left = '<!--lang_client_intern_left-->';
                                            var lz_text_speaking_to = '<!--lang_client_now_speaking_to-->';
                                            var lz_ec_header = '<!--lang_client_ec_text-->';
                                            var lz_ec_o_header = '<!--lang_client_ec_o_text-->';
                                            var lz_ec_sub_header = '<!--lang_client_ec_sub_text-->';
                                            var lz_ec_o_sub_header = '<!--lang_client_ec_o_sub_text-->';
                                            var lz_guest_name = '<!--lang_client_guest-->';
                                            var lz_req_callback = '<!--lang_client_request_callback-->';
                                            var lz_call_me = '<!--lang_client_call_me_later-->';
                                            var lz_header_on = '<!--header_online-->';
                                            var lz_header_off = '<!--header_offline-->';
                                            var lz_text_phone = '<!--lang_client_your_phone-->';
                                            var lz_text_callback_information = '<!--lang_client_request_callback_information_offline-->';
                                            var lz_text_ticket_information = '<!--lang_client_ticket_information-->';
                                            var lz_text_wm = {chat:'<!--lang_client_wm_chat-->',ticket:'<!--lang_client_wm_ticket-->',phone_in:'<!--lang_client_wm_phone_inbound-->',phone_out:'<!--lang_client_wm_phone_outbound-->',knowledgebase:'<!--lang_client_wm_knowledgebase-->',facebook:'<!--lang_client_wm_facebook-->',youtube:'<!--lang_client_wm_youtube-->',twitter:'<!--lang_client_wm_twitter-->',google:'<!--lang_client_wm_google-->'};
                                            var lz_text_wm_s = {chat:'<!--lang_client_wm_s_chat-->',ticket:'<!--lang_client_wm_s_ticket-->',phone_in:'<!--lang_client_wm_s_phone_inbound-->',phone_out:'<!--lang_client_wm_s_phone_outbound-->',knowledgebase:'<!--lang_client_wm_s_knowledgebase-->',facebook:'<!--lang_client_wm_s_facebook-->',youtube:'<!--lang_client_wm_s_youtube-->',twitter:'<!--lang_client_wm_s_twitter-->',google:'<!--lang_client_wm_s_google-->',whatsapp:'<!--lang_client_wm_s_whatsapp-->',linkedin:'<!--lang_client_wm_s_linkedin-->',instagram:'<!--lang_client_wm_s_instagram-->',telegram:'<!--lang_client_wm_s_telegram-->'};";

        VisitorMonitoring::$Response = str_replace("<!--header_offline-->",base64_encode(Communication::GetParameter("ovlto",LocalizationManager::$TranslationStrings["client_overlay_title_offline"],$c,FILTER_HTML_ENTITIES)),VisitorMonitoring::$Response);
        VisitorMonitoring::$Response = str_replace("<!--header_online-->",base64_encode(Communication::GetParameter("ovlt",LocalizationManager::$TranslationStrings["client_overlay_title_online"],$c,FILTER_HTML_ENTITIES)),VisitorMonitoring::$Response);

        VisitorMonitoring::$Response = Server::Replace(VisitorMonitoring::$Response,true,false,false,false,true);

        $ovlw = Communication::ReadParameter("ovlw",380);
        $ovlh = Communication::ReadParameter("ovlh",DataInput::GetMaxHeight());
        $text = ($OVERLAY->IsHumanChatAvailable) ? Communication::GetParameter("ovlt",LocalizationManager::$TranslationStrings["client_overlay_title_online"],$c,FILTER_HTML_ENTITIES) : Communication::GetParameter("ovlto",LocalizationManager::$TranslationStrings["client_overlay_title_offline"],$c,FILTER_HTML_ENTITIES);

        $ml = 0;
        $mt = 0;

        $mr = Communication::GetParameter("ovlmr",40,$nu,FILTER_SANITIZE_NUMBER_INT);
        $mb = Communication::GetParameter("ovlmb",30,$nu,FILTER_SANITIZE_NUMBER_INT);
        $br = Communication::GetParameter("ovlbr",6,$nu,FILTER_SANITIZE_NUMBER_INT);

        $wmHTML = OverlayChat::ReplaceColors(IOStruct::GetFile(TEMPLATE_SCRIPT_OVERLAY_CHAT."wm.tpl"),false);

        VisitorMonitoring::$Response .= "LiveZilla.Engine.AddChatWidget('".base64_encode($OVERLAY->ChatHTML)."','".base64_encode(Server::$Configuration->File["gl_site_name"])."',".$ovlw.",".$ovlh.",".$ml.",".$mt.",".$mr.",".$mb.",'".Communication::ReadParameter("ovlp",22)."',".$br.");";
        VisitorMonitoring::$Response .= "lz_tracking_add_welcome_manager('".base64_encode($wmHTML)."',".$ml.",".$mt.",".$mr.",".$mb.",".To::BoolString(VisitorMonitoring::$IsChatAvailable).");";
    }

    if(Communication::ReadParameter("clch","")=="1")
    {
        $OVERLAY->CloseChat();
    }

    $setGroup = false;
    $showWidgets = true;

    if(isset($_GET["ovlio"]) && !($OVERLAY->IsHumanChatAvailable && !empty(VisitorMonitoring::$Visitor->Browsers[1]->ChatRequests)))
        $showWidgets = false;
    else if(isset($_GET["ovloo"]) && !$OVERLAY->IsHumanChatAvailable)
        $showWidgets = false;

    $declined = false;
    $OVERLAY->LastPostReceived = "null";
    $OVERLAY->LastMessageReceived = "null";
    $OVERLAY->IsChatAvailable = $OVERLAY->Botmode;
    $OVERLAY->FullLoad = (!empty($_GET["full"]));
    $OVERLAY->Flags["LPR"] = Communication::ReadParameter("lpr","");
    $OVERLAY->Flags["LMR"] = Communication::ReadParameter("lmr","");
    $OVERLAY->LastPoster = Communication::ReadParameter("lp","");

    $OVERLAY->UpdatePostStatus();

    if(VisitorMonitoring::$Visitor->Browsers[0]->Declined)
    {
        $OVERLAY->IsChatAvailable = true;
    }
    else if(VisitorMonitoring::$Visitor->Browsers[0]->Status > CHAT_STATUS_OPEN && !VisitorMonitoring::$Visitor->Browsers[0]->Closed)
    {
        $OVERLAY->IsChatAvailable = true;
        if($OVERLAY->IsBotChat())
            if(($OVERLAY->OperatorCount > 0 && !$OVERLAY->Botmode) && !VisitorMonitoring::$Visitor->Browsers[0]->ExternalClosed)
            {
                foreach(VisitorMonitoring::$Visitor->Browsers[0]->Members as $sid => $member)
                    if(!Server::$Operators[$sid]->IsBot)
                        VisitorMonitoring::$Visitor->Browsers[0]->LeaveChat($sid);

                VisitorMonitoring::$Visitor->Browsers[0]->ExternalClose();
                VisitorMonitoring::$Visitor->Browsers[0]->Closed = true;
            }
        if(VisitorMonitoring::$Visitor->Browsers[0]->Activated == CHAT_STATUS_ACTIVE && VisitorMonitoring::$Visitor->Browsers[0]->Status != CHAT_STATUS_ACTIVE)
            VisitorMonitoring::$Visitor->Browsers[0]->SetStatus(CHAT_STATUS_ACTIVE);

        $action = VisitorMonitoring::$Visitor->Browsers[0]->GetMaxWaitingTimeAction(false);
        if($action == "MESSAGE" || ($action == "FORWARD" && !VisitorMonitoring::$Visitor->Browsers[0]->CreateAutoForward(VisitorMonitoring::$Visitor)))
            $declined = true;
    }
    else
        $OVERLAY->IsChatAvailable = $OVERLAY->OperatorCount > 0;

    if(!$OVERLAY->IsChatAvailable)
        $OVERLAY->SetHost(null);

    $OVERLAY->ProcessIdleExit(VisitorMonitoring::$Visitor->Browsers[0],VisitorMonitoring::$Visitor);
    $OVERLAY->ProcessPosts();
    $OVERLAY->Listen();

    if($declined || VisitorMonitoring::$Visitor->Browsers[0]->Declined)
    {
        VisitorMonitoring::$Visitor->AddFunctionCall("OverlayChatWidgetV2.ExitBotChat(false,false,5);",false);
        $OVERLAY->AddHTML(str_replace("<!--message-->",$OVERLAY->GetDeclinedMessage(),IOStruct::GetFile(TEMPLATE_HTML_MESSAGE_OVERLAY_CHAT_STATUS)),"sys","CDM");
        VisitorMonitoring::$Visitor->Browsers[0]->ExternalClose();
    }

    if(empty(VisitorMonitoring::$Visitor->Browsers[0]->GroupChat) && $OVERLAY->IsChatAvailable && ((!(!empty(VisitorMonitoring::$Visitor->Browsers[1]->ChatRequests) && !VisitorMonitoring::$Visitor->Browsers[1]->ChatRequests[0]->Closed) && empty(VisitorMonitoring::$Visitor->Browsers[0]->OperatorId) && !VisitorMonitoring::$Visitor->Browsers[0]->Waiting) || ($OVERLAY->IsBotChat() && $OVERLAY->Flags["LMR"]=="ONM01") || $OVERLAY->FullLoad))
    {
        if(($OVERLAY->Flags["LMR"]!="ONM01" || $OVERLAY->FullLoad) && (!$OVERLAY->Botmode || (!empty(VisitorMonitoring::$Visitor->Browsers[0]->OperatorId) && !Server::$Operators[VisitorMonitoring::$Visitor->Browsers[0]->OperatorId]->IsBot) || (!empty(VisitorMonitoring::$Visitor->Browsers[1]->ChatRequests) && !VisitorMonitoring::$Visitor->Browsers[1]->ChatRequests[0]->Closed)))
        {
            if(!$OVERLAY->Botmode && (!empty(VisitorMonitoring::$Visitor->Browsers[0]->ChatId) && !VisitorMonitoring::$Visitor->Browsers[0]->InternalActivation && !VisitorMonitoring::$Visitor->Browsers[0]->Closed && !VisitorMonitoring::$Visitor->Browsers[0]->Declined && !VisitorMonitoring::$Visitor->Browsers[0]->Waiting) && !isset($_GET["pgc"]))
            {
                $OVERLAY->AddHTML(str_replace("<!--message-->",LocalizationManager::$TranslationStrings["client_int_is_connected"],IOStruct::GetFile(TEMPLATE_HTML_MESSAGE_OVERLAY_CHAT_STATUS)),"sys","ONM01");
            }
            else if($OVERLAY->FullLoad && VisitorMonitoring::$Visitor->Browsers[0]->Status == CHAT_STATUS_OPEN && !VisitorMonitoring::$Visitor->Browsers[0]->Waiting && !isset($_GET["pgc"]))
            {
                $OVERLAY->AddHTML(str_replace("<!--message-->",LocalizationManager::$TranslationStrings["client_chat_available"],IOStruct::GetFile(TEMPLATE_HTML_MESSAGE_OVERLAY_CHAT_STATUS)),"sys","ONM01");
            }
            else if(isset($_GET["pgc"]))
            {
                $OVERLAY->AddHTML(str_replace("<!--message-->",LocalizationManager::$TranslationStrings["client_joined_chat"],IOStruct::GetFile(TEMPLATE_HTML_MESSAGE_OVERLAY_CHAT_STATUS)),"sys","ONM01");
            }
        }
        else if($OVERLAY->Botmode && (($OVERLAY->Flags["LMR"]!="OBM01" || $OVERLAY->FullLoad) && ((empty(VisitorMonitoring::$Visitor->Browsers[0]->OperatorId) && empty($OVERLAY->CurrentOperatorId)) || $OVERLAY->IsBotChat())))
        {
            VisitorMonitoring::$Visitor->Browsers[0]->FindOperator(VisitorChat::$Router,VisitorMonitoring::$Visitor,true,true);
            if(!empty(Server::$Operators[VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatPartner]) && Server::$Operators[VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatPartner]->IsBot)
            {
                $bwmes = trim(Server::$Operators[VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatPartner]->WelcomeMessage);
                $text = (empty($bwmes)) ? @LocalizationManager::$TranslationStrings["client_now_speaking_to_va"] : $bwmes;
                if(!empty(VisitorMonitoring::$Visitor->Browsers[0]->GroupChat))
                    $text = "";
                else if(!$OVERLAY->Human)
                {
                    $text = (empty($bwmes)) ? @LocalizationManager::$TranslationStrings["client_now_speaking_to_va_offline"] : $bwmes;
                }

                VisitorMonitoring::$Visitor->AddFunctionCall("OverlayChatWidgetV2.__ModeBot = true;",false);
                VisitorMonitoring::$Visitor->AddFunctionCall("OverlayChatWidgetV2.InputState(false);",false);

                if(!empty($text))
                    $OVERLAY->AddHTML($OVERLAY->GetPostHTML(str_replace("<!--operator_name-->", Server::$Operators[VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatPartner]->Fullname, $text), "", true, Server::$Operators[VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatPartner]->Fullname, time(), VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatPartner, Server::$Operators[VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatPartner]->IsBot,"BotWelcomeMessage"),"sys","OBM01");

                $OVERLAY->SetHost(VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatPartner);
            }
        }
    }

    $OVERLAY->SetMembers();

    $offlineInvites = true; //<--debug

    $OVERLAY->BotTitle = ($OVERLAY->Botmode && !empty(Server::$Operators[VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatPartner]) && Server::$Operators[VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatPartner]->IsBot) ? base64_encode(str_replace(array("%name%","%operator_name%"),Server::$Operators[VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatPartner]->Fullname,LocalizationManager::$TranslationStrings["client_bot_overlay_title"])) : "";
    if($offlineInvites/* || $OVERLAY->IsChatAvailable && !Visitor::$OpenChatExternal && !empty(VisitorMonitoring::$Visitor->Browsers[1]->ChatRequests) && Server::$Operators[VisitorMonitoring::$Visitor->Browsers[1]->ChatRequests[0]->SenderSystemId]->IsExternal(Server::$Groups,null,null)*/)
    {
        if(!isset($_GET["hinv"]))
        {
            foreach(VisitorMonitoring::$Visitor->Browsers[1]->ChatRequests as $chatrequest)
            {
                if(!$chatrequest->Closed /*&& !$chatrequest->Accepted && VisitorMonitoring::$Visitor->Browsers[0]->Status == 0*/)
                {
                    $sound = (!empty(Server::$Configuration->File["gl_cips"]) && !$chatrequest->Displayed);

                    //if($OVERLAY->FullLoad)
                      //  $chatrequest->Displayed = false;
    
                    if(!$chatrequest->Displayed || $OVERLAY->FullLoad)
                    {
                        $chatrequest->Load();

                        $OVERLAY->AddHTML($OVERLAY->GetInviteHTML($chatrequest->SenderSystemId,$chatrequest->Text,$chatrequest->Id),"sys",$OVERLAY->LastMessageReceived,!$chatrequest->Declined,true,$chatrequest->Type == 2);
                        $OVERLAY->ChatInviteCount++;

                        $setGroup = true;
                        VisitorMonitoring::$Visitor->Browsers[0]->GroupId = $chatrequest->SenderGroupId;

                        if(!Server::$Operators[$chatrequest->SenderSystemId]->IsBot)
                            VisitorMonitoring::$Visitor->AddFunctionCall("OverlayChatWidgetV2.ExitBotChat(true,false,4,true);",false);

                        VisitorMonitoring::$Visitor->AddFunctionCall("OverlayChatWidgetV2.UpdateUI();",false);

                        if(!$chatrequest->Displayed)
                        {
                            $chatrequest->SetStatus(true,false,false);
                            $chatrequest->Displayed = true;
                        }

                        VisitorMonitoring::$Visitor->Browsers[0]->SetTargetGroup($chatrequest->SenderGroupId);
                    }
    
                    if(!empty($_GET["mi0"]))
                    {
                        ChatRequest::AcceptAll(VisitorMonitoring::$Visitor->UserId);
                    }
                }
                else
                {
                    VisitorMonitoring::$Visitor->AddFunctionCall("OverlayChatWidgetV2.RemoveInvite('".$chatrequest->Id."');",false);
                }
            }
        }
    }

    if($setGroup)
        VisitorMonitoring::$Visitor->AddFunctionCall("OverlayChatWidgetV2.SetUIGroup('".Encoding::Base64UrlEncode(VisitorMonitoring::$Visitor->Browsers[0]->GroupId)."',true);",false);

    $tymes = (!empty(VisitorMonitoring::$Visitor->Browsers[0]->OperatorId) && Server::$Operators[VisitorMonitoring::$Visitor->Browsers[0]->OperatorId]->Typing==VisitorMonitoring::$Visitor->Browsers[0]->SystemId) ? "'".base64_encode(str_replace("<!--operator_name-->",Server::$Operators[VisitorMonitoring::$Visitor->Browsers[0]->OperatorId]->Fullname,LocalizationManager::$TranslationStrings["client_representative_is_typing"]))."'" : "null";

    if(empty(VisitorMonitoring::$Visitor->Browsers[0]->GroupChat))
        VisitorMonitoring::$Visitor->AddFunctionCall("lz_chat_set_typing(".$tymes.",false);",false);
    else
        VisitorMonitoring::$Visitor->AddFunctionCall("lz_chat_set_typing(null,false);",false);

    $OVERLAY->BuildElements();

    if($OVERLAY->FullLoad)
        $OVERLAY->OperatorPostCount=0;

    if($OVERLAY->Flags["LPP"] == VisitorMonitoring::$Visitor->Browsers[0]->SystemId)
        $OVERLAY->OperatorPostCount=-1;

    if(!empty($OVERLAY->SpeakingToHTML) && !$OVERLAY->SpeakingToAdded)
        $OVERLAY->AddHTML($OVERLAY->SpeakingToHTML,"sys","SPKT" . Server::$Operators[VisitorMonitoring::$Visitor->Browsers[0]->OperatorId]->SystemId);

    if(!empty($OVERLAY->Posts))
    {
        foreach($OVERLAY->Posts as $post)
            $OVERLAY->AddHTML($post,$OVERLAY->Flags["LPP"]);
    }

    if($OVERLAY->PlaySound)
        VisitorMonitoring::$Visitor->AddFunctionCall("lz_chat_play_sound(OverlayChatWidgetV2.MessageSound);",false);

    if(!empty($OVERLAY->NewMessages))
        VisitorMonitoring::$Visitor->AddFunctionCall("OverlayChatWidgetV2.AddMessages('".base64_encode(json_encode($OVERLAY->NewMessages))."',true,".$OVERLAY->LastPostReceived.",".$OVERLAY->LastMessageReceived.",'".base64_encode($OVERLAY->LastPoster)."','".base64_encode(Communication::ReadParameter("lp",""))."');",false);

    if(!$OVERLAY->IsChatAvailable)
        VisitorMonitoring::$Visitor->AddFunctionCall("OverlayChatWidgetV2.SetConnectionState(false,'".VisitorMonitoring::$Visitor->Browsers[0]->SystemId."',null,0);",false);
    else
        VisitorMonitoring::$Visitor->AddFunctionCall("OverlayChatWidgetV2.SetConnectionState(".To::BoolString(empty(VisitorMonitoring::$Visitor->Browsers[0]->GroupChat) && !$OVERLAY->Botmode && (!empty(VisitorMonitoring::$Visitor->Browsers[0]->ChatId) && !VisitorMonitoring::$Visitor->Browsers[0]->InternalActivation && !VisitorMonitoring::$Visitor->Browsers[0]->Closed && !VisitorMonitoring::$Visitor->Browsers[0]->Declined)).",'".VisitorMonitoring::$Visitor->Browsers[0]->SystemId."',".$OVERLAY->GetWaitingMessage().",".intval(Server::$Configuration->File["gl_wmes"]).");",false);

    if($OVERLAY->RepollRequired)
        VisitorMonitoring::$Visitor->AddFunctionCall("LiveZilla.Engine.Poll(1211);",false);

    if(VisitorMonitoring::$Visitor->Browsers[0]->TranslationSettings != null)
        VisitorMonitoring::$Visitor->AddFunctionCall("lz_chat_set_translation(". VisitorMonitoring::$Visitor->Browsers[0]->TranslationSettings[0] . ",'". base64_encode(VisitorMonitoring::$Visitor->Browsers[0]->TranslationSettings[1]) . "','" . base64_encode(VisitorMonitoring::$Visitor->Browsers[0]->TranslationSettings[2]) . "');",false);
    else
        VisitorMonitoring::$Visitor->AddFunctionCall("lz_chat_set_translation(null,null,null);",false);

    if($OVERLAY->FullLoad)
        VisitorMonitoring::$Visitor->AddFunctionCall("lz_chat_load_input_values(false);",false);

    VisitorMonitoring::$Visitor->ReloadGroups(true,Visitor::$PollCount == 1);

    if(!empty(VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatGroup))
        VisitorMonitoring::$Visitor->AddFunctionCall("OverlayChatWidgetV2.UpdateFormUI();",false);
    else
        VisitorMonitoring::$Visitor->AddFunctionCall(false,false,false,false);

    VisitorMonitoring::$Visitor->AddFunctionCall("OverlayChatWidgetV2.SetChat(".VisitorMonitoring::$Visitor->Browsers[0]->ChatId.");",false);
    VisitorMonitoring::$Visitor->AddFunctionCall("OverlayChatWidgetV2.SetStatus(".To::BoolString(!$showWidgets).",".To::BoolString($OVERLAY->IsChatAvailable).",".To::BoolString($OVERLAY->Botmode).",".To::BoolString($OVERLAY->HumanGeneral).",'".$OVERLAY->BotTitle."',".$OVERLAY->GetChatStatus().",".To::BoolString(VisitorMonitoring::$Visitor->Browsers[0]->Declined).");",false);

    if(!empty($OVERLAY->EyeCatcher))
        VisitorMonitoring::$Visitor->AddFunctionCall($OVERLAY->EyeCatcher,false);
}
OverlayChat::$Response = VisitorMonitoring::$Visitor->Response;
?>
