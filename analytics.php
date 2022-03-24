<?php
/****************************************************************************************
 * LiveZilla analytics.php
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
header("Access-Control-Allow-Origin: *");

require(LIVEZILLA_PATH . "_definitions/definitions.inc.php");
require(LIVEZILLA_PATH . "_lib/functions.global.inc.php");
require(LIVEZILLA_PATH . "_lib/objects.countries.inc.php");
require(LIVEZILLA_PATH . "_lib/objects.languages.inc.php");
require(LIVEZILLA_PATH . "_lib/objects.stats.inc.php");
require(LIVEZILLA_PATH . "_definitions/definitions.dynamic.inc.php");
require(LIVEZILLA_PATH . "_definitions/definitions.protocol.inc.php");
require(LIVEZILLA_PATH . "_lib/objects.analytics.inc.php");

if(isset($_POST["request"])){
    if(isset($_POST["unit"])){
        $P_UNIT = intval($_POST["unit"]);
        $P_FROM = array(
            "year" => intval($_POST["year"]),
            "month" => intval($_POST["month"]),
            "day" => intval($_POST["day"])
        );
        $P_TO = array(
            "year" => intval($_POST["toyear"]),
            "month" => intval($_POST["tomonth"]),
            "day" => intval($_POST["today"])
        );
        ADI::SetPostData($P_UNIT, $P_FROM, $P_TO);
    }

    $knownRequests = array(
        'preInit' => function(){
            return ADI::GetPreInitData();
        },
        'overview' => function(){
            return ADI::GetOverview();
        },
        'chats' => function(){
            return ADI::GetChats();
        },
        'chatNumbers' => function(){
            return ADI::GetChatNumbers();
        },
        'chatsBar' => function(){
            return ADI::GetChatsBar();
        },
        'chatTags' => function(){
            return ADI::GetTags(0);
        },
        'tickets' => function(){
            return ADI::GetTickets();
        },
        'ticketNumbers' => function(){
            return ADI::GetTicketNumbers();
        },
        'ticketsBar' => function(){
            return ADI::GetTicketsBar();
        },
        'ticketTags' => function(){
            return ADI::GetTags(1);
        },
        'availability' => function(){
            return ADI::GetAvailabilitiesBar();
        },
        'visitors' => function(){
            return ADI::GetVisitors();
        },
        'visitorNumbers' => function(){
            return ADI::GetVisitorNumbers();
        },
        'TOPsVisitors' => function(){
            return ADI::GetTOPsVisitors();
        },
        'TOPsPages' => function(){
            return ADI::GetTOPsPages();
        },
        'TOPsKnowledgeBase' => function(){
            return ADI::GetTOPsKnowledgeBase();
        },
        'goalsDayNumbers' => function(){
            return ADI::GetGoalsDayNumbers();
        },
        'events' => function(){
            return ADI::GetGoalStats();
        },
        'eventsBar' => function(){
            return ADI::GetEventsBar();
        },
        'goalsBar' => function(){
            return ADI::GetGoalsBar();
        },
        'feedbacksDayNumbers' => function(){
            return ADI::GetFeedbacksDayNumbers();
        },
        'feedbacks' => function(){
            return ADI::GetFeedbacks();
        },
        'feedbacksBar' => function(){
            return ADI::GetFeedbacksBar();
        }
    );


    if(!isset($knownRequests[$_POST["request"]]))
    {
        exit('error unknown request');
    }
    else
    {
        $res = $knownRequests[$_POST["request"]]();
        exit(json_encode($res));
    }
}

if(isset($_GET["token"]) && isset($_GET["from"]) && isset($_GET["to"]))
{
    $tokens = array_map(function($row){return $row['token'];},ADI::GetData("SELECT `token` FROM `" . DB_PREFIX . DATABASE_OPERATORS . "`;"));

    if(!in_array($_GET["token"], $tokens))
        exit('Invalid Link (ERROR 444286492)');

    $fromUnixTimestamp = intval($_GET["from"]);
    $toUnixTimestamp = intval($_GET["to"]);

    if( $fromUnixTimestamp > $toUnixTimestamp)
        exit('Invalid Date Range (ERROR 4411864921)');

    $html = IOStruct::GetFile(PATH_TEMPLATES . "analytics.tpl");
    $html = str_replace("<!--acid-->","?acid=" . md5(time()),$html);
    $html = str_replace("<!--from-->",intval($_GET["from"]),$html);
    $html = str_replace("<!--to-->",intval($_GET["to"]),$html);

    $feedbackCriteria = ADI::GetFeedbackCriteria();
    $feedbackCriteriaTranslation = '';
    foreach($feedbackCriteria as $index => $row)
    {
        $feedbackCriteriaTranslation = $feedbackCriteriaTranslation . $row[0] . ": '" . $row[2] ."'" . ", ";
    }
    $feedbackCriteriaTranslation = substr($feedbackCriteriaTranslation, 0, -1);
    $html = str_replace("<!--feedback_criteria-->",$feedbackCriteriaTranslation,$html);
    $html = Server::Replace($html, true, true, true, true, false);
    exit($html);
}


