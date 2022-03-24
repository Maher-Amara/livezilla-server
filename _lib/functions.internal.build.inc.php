<?php
/****************************************************************************************
* LiveZilla intern.build.inc.php
*
* Copyright 2019 LiveZilla GmbH
* All rights reserved.
* LiveZilla is a registered trademark.
*
* Improper changes to this file may cause critical errors.
***************************************************************************************/

if(!defined("IN_LIVEZILLA"))
	die();

function demandEvents()
{
    Server::InitDataBlock(array("EVENTS"));
    if(!CacheManager::IsDataUpdate(POST_INTERN_DUT_EVENTS,DATA_UPDATE_KEY_EVENTS))
    {
        Server::$Response->Events = "<ev dut=\"".base64_encode(CacheManager::$DataUpdateTimes[DATA_UPDATE_KEY_EVENTS])."\" nu=\"".base64_encode(1)."\" />";
        return;
    }
	Server::$Response->Events = "";
	if(!empty(Server::$Events))
    {
		foreach(Server::$Events->Events as $event)
			Server::$Response->Events .= $event->GetXML();
        Server::$Response->Events = "<ev dut=\"".base64_encode(CacheManager::$DataUpdateTimes[DATA_UPDATE_KEY_EVENTS])."\">\r\n" . Server::$Response->Events . "</ev>";
    }
}

function buildActions()
{
	$ac = "";
    if(count(Server::$Events->Events)>0 && Server::$Events->IsInternalAction())
    {
        if($result = DBManager::Execute(true, "SELECT `trigger_id`,`action_id`,`dbtr`.`receiver_user_id`,`dbtr`.`receiver_browser_id` FROM `" . DB_PREFIX . DATABASE_EVENT_ACTION_INTERNALS . "` INNER JOIN `" . DB_PREFIX . DATABASE_EVENT_TRIGGERS . "` AS `dbtr` ON `" . DB_PREFIX . DATABASE_EVENT_ACTION_INTERNALS . "`.`trigger_id`=`dbtr`.`id` WHERE `" . DB_PREFIX . DATABASE_EVENT_ACTION_INTERNALS . "`.`receiver_user_id` = '" . DBManager::RealEscape(CALLER_SYSTEM_ID) . "' GROUP BY `action_id` ORDER BY `" . DB_PREFIX . DATABASE_EVENT_ACTION_INTERNALS . "`.`created` ASC"))
            while($row = DBManager::FetchArray($result))
            {
                $internalaction = new EventActionInternal($row);
                $ac .= $internalaction->GetXML($row["receiver_user_id"],$row["receiver_browser_id"]);
            }
	    DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_EVENT_ACTION_INTERNALS . "` WHERE `" . DB_PREFIX . DATABASE_EVENT_ACTION_INTERNALS . "`.`receiver_user_id` = '" . DBManager::RealEscape(CALLER_SYSTEM_ID) . "';");
    }
    if(!empty($ac))
    {
        Server::$Response->XML .= "<int_ac>" . $ac . "</int_ac>";
    }
}

function buildResources($xml = "", $last = 0)
{
    if(isset($_POST[POST_INTERN_XMLCLIP_RESOURCES_END_TIME]))
    {
        if($_POST[POST_INTERN_XMLCLIP_RESOURCES_END_TIME] == XML_CLIP_NULL)
            $_POST[POST_INTERN_XMLCLIP_RESOURCES_END_TIME] = 0;

        $count = 0;
        if($result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_RESOURCES . "` WHERE `edited` > '" . DBManager::RealEscape($_POST[POST_INTERN_XMLCLIP_RESOURCES_END_TIME]) . "' AND `discarded`<2 AND `edited`<=" . DBManager::RealEscape(time()) . " AND `parentid` NOT IN (100,101,102) ORDER BY `edited` ASC"))
        {
            while($row = DBManager::FetchArray($result))
            {
                $res = new KnowledgeBaseEntry($row);
                if(++$count <= DATA_ITEM_LOADS || $res->Edited == $last)
                    $xml .= $res->GetXML();
                else
                    break;
                $last = $res->Edited;
            }
        }
    }
	Server::$Response->Resources = (strlen($xml) > 0) ? $xml : null;
}

function demandFilters()
{
    if(!CacheManager::IsDataUpdate(POST_INTERN_DUT_FILTERS,DATA_UPDATE_KEY_FILTERS))
        return;

    $xml = "";
    foreach(Server::$Filters->Filters as $filter)
    {
        if($filter->Expiredate != -1 && ($filter->Expiredate + $filter->Created) < time())
            $filter->Destroy();
        else if($filter->Filtername != "OOTF")
            $xml .= $filter->GetXML();
    }
    Server::$Response->Filters = "<dfi t=\"".base64_encode(count(Server::$Filters->Filters))."\" dut=\"".base64_encode(CacheManager::$DataUpdateTimes[DATA_UPDATE_KEY_FILTERS])."\">".$xml."</dfi>";
}

function demandObjectData()
{
    if(isset($_POST[POST_INTERN_DUT_VISITORS_FULL_DATA]))
    {
        // visits
        $visitor = new Visitor($_POST[POST_INTERN_DUT_VISITORS_FULL_DATA]);
        $visitor->Load();
        $visitor->LoadRecentVisits();
        Server::$Response->Visitors .= $visitor->GetRecentXML();

        //browsers
        $_recentBrowserList = array();
        $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_VISITOR_BROWSERS . "` WHERE `visitor_id`= '" . DBManager::RealEscape($_POST[POST_INTERN_DUT_VISITORS_FULL_DATA]) . "' ORDER BY `created` ASC;");
        if($result)
        {
            while($row = DBManager::FetchArray($result))
            {
                $browser = new VisitorBrowser("","",false);
                $browser->SetValues($row);
                $_recentBrowserList[] = $row["id"];
                Server::$Response->VisitorBrowsers .= $browser->GetXMLV2($row["visitor_id"]);
            }
            $_recentBrowserList = implode("','",$_recentBrowserList);
        }

        // urls
        if($result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_VISITOR_BROWSER_URLS . "` WHERE `browser_id` IN ('" . $_recentBrowserList . "') ORDER BY `entrance` ASC"))
            while($row = DBManager::FetchArray($result))
            {
                $hu = new HistoryURL($row, true);
                Server::$Response->VisitorBrowserURLs .= $hu->GetXML($row["browser_id"]);
            }

        // tickets
        $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_TICKETS . "` LEFT JOIN `".DB_PREFIX.DATABASE_TICKET_EDITORS."` AS `te` ON `".DB_PREFIX.DATABASE_TICKETS."`.`id`=`te`.`ticket_id` LEFT JOIN `".DB_PREFIX.DATABASE_TICKET_WATCHER."` AS `twl` ON `".DB_PREFIX.DATABASE_TICKETS."`.`id`=`twl`.`ticket_id` WHERE `deleted`=0 AND `user_id`= '" . DBManager::RealEscape($_POST[POST_INTERN_DUT_VISITORS_FULL_DATA]) . "' ORDER BY `id` DESC;");
        if($result)
        {
            $arTickets = "";
            while($row = DBManager::FetchArray($result))
            {
                $ticket = new Ticket($row,null,null);
                $ticket->LoadLogs();

                if(count($ticket->Messages) > 0)
                    $arTickets .= $ticket->GetXML(true,true);
            }
            if(!empty($arTickets))
                Server::$Response->Messages .= "<at id=\"".base64_encode($_POST[POST_INTERN_DUT_VISITORS_FULL_DATA])."\">" . $arTickets . "</at>";
        }

        // chats
        $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_CHAT_ARCHIVE . "` WHERE (`external_id`='" . DBManager::RealEscape($_POST[POST_INTERN_DUT_VISITORS_FULL_DATA]) . "' OR (`group_id`='" . DBManager::RealEscape($_POST[POST_INTERN_DUT_VISITORS_FULL_DATA]) . "' AND `internal_id`='' AND `external_id`='') OR `internal_id`='" . DBManager::RealEscape($_POST[POST_INTERN_DUT_VISITORS_FULL_DATA]) . "') AND `closed`>0 ORDER BY `time` DESC LIMIT 50;");
        if($result)
        {
            $arChats = "";
            while($row = DBManager::FetchArray($result))
            {
                $chat = new Chat();
                $chat->SetValues($row);
                $arChats .= $chat->GetXML($chat->Permission(CALLER_SYSTEM_ID),true,false);
            }
            if(!empty($arChats))
                Server::$Response->Archive .= "<ac id=\"".base64_encode($_POST[POST_INTERN_DUT_VISITORS_FULL_DATA])."\">" . $arChats . "</ac>";
        }

        // feedbacks
        $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_FEEDBACKS . "` WHERE `user_id`='" . DBManager::RealEscape($_POST[POST_INTERN_DUT_VISITORS_FULL_DATA]) . "' ORDER BY `created` DESC LIMIT 50;");
        if($result)
        {
            $arFeedbacks = "";
            while($row = DBManager::FetchArray($result))
            {
                $fb = new Feedback($row["id"],$row);
                $fb->LoadCriteriaList();
                $arFeedbacks .= $fb->GetXML();
            }
            if(!empty($arFeedbacks))
                Server::$Response->Feedbacks .= "<af id=\"".base64_encode($_POST[POST_INTERN_DUT_VISITORS_FULL_DATA])."\">" . $arFeedbacks . "</af>";
        }
    }
}

function demandVisitors()
{
    if(!isset($_POST[POST_INTERN_DUT_VISITORS]))
        return;

    $dut = intval($_POST[POST_INTERN_DUT_VISITORS]);
    $where = "`t1`.`entrance`<" . time(). " AND `t1`.`edited`<" . time() . " AND ";
    if($dut == 0)
    {
        $where .= "`t1`.`closed`=0";
    }
    else
    {
        $where .= "`t1`.`closed`=0 AND (`t1`.`entrance` > " . intval($dut) . " OR `t1`.`edited` > " . intval($dut) .")";
    }
    $xml = "";
    $result = DBManager::Execute(true, "SELECT *,`t1`.`id` AS `id` FROM `" . DB_PREFIX . DATABASE_VISITORS . "` AS `t1` INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_CITIES . "` AS `t3` ON `t1`.`city`=`t3`.`id` INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_REGIONS . "` AS `t4` ON `t1`.`region`=`t4`.`id` INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_ISPS . "` AS `t5` ON `t1`.`isp`=`t5`.`id` INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_SYSTEMS . "` AS `t6` ON `t1`.`system`=`t6`.`id` INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_RESOLUTIONS . "` AS `t8` ON `t1`.`resolution`=`t8`.`id` INNER JOIN `" . DB_PREFIX . DATABASE_USER_DATA . "` AS `t9` ON `t1`.`data_id`=`t9`.`id` INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_BROWSERS . "` AS `t10` ON `t1`.`browser`=`t10`.`id` WHERE " . $where . " ORDER BY `t1`.`entrance` ASC;");

    if($result)
    {

        while($row = DBManager::FetchArray($result))
        {
            $visitor = new Visitor($row["id"]);
            $visitor->SetDetails($row,false);
            $dut = max($dut,$visitor->FirstActive);
            $dut = max($dut,$visitor->Edited);
            $xml .= $visitor->GetXML($row);
        }
    }

    if($dut>=time())
        Logging::ErrorLog("Invalid VISITOR DUT=time");

    if(!empty($xml))
        $xml .= "<dut e=\"".base64_encode($dut)."\" />";

    Server::$Response->Visitors = $xml;
}

function demandVisitorBrowsers()
{
    if(!isset($_POST[POST_INTERN_DUT_VISITOR_BROWSERS_ENTRANCE]))
        return;

    $dut = intval($_POST[POST_INTERN_DUT_VISITOR_BROWSERS_ENTRANCE]);

    if($dut == 0)
    {
        $where = "`closed`=0 AND `created`<" . time();
    }
    else
    {
        $where = "`closed`<" . time(). " AND `created`<" . time();
        $where .= " AND (`closed`>" . intval($dut). " OR `created`>" . intval($dut). ")";
    }

    $xml = "";
    $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_VISITOR_BROWSERS . "` WHERE " . $where . " ORDER BY `created` ASC;");
    if($result)
    {
        while($row = DBManager::FetchArray($result))
        {
            $browser = new VisitorBrowser("","",false);
            $browser->SetValues($row);
            $dut = max($dut,$browser->Closed);
            $dut = max($dut,$browser->Created);
            $xml .= $browser->GetXMLV2($row["visitor_id"]);
        }
    }

    if($dut==time())
        Logging::ErrorLog("Invalid BROWSER DUT=time");

    if(!empty($xml))
        $xml .= "<dut e=\"".base64_encode($dut)."\" />";

    Server::$Response->VisitorBrowsers = $xml;
}

function demandVisitorBrowserURLs()
{
    if(!isset($_POST[POST_INTERN_DUT_VISITOR_BROWSER_URLS]))
        return;

    if($_POST[POST_INTERN_DUT_VISITOR_BROWSER_URLS] == 0)
    {
        $where = "`closed`=0";
    }
    else
    {
        $where = "`entrance`>" . intval($_POST[POST_INTERN_DUT_VISITOR_BROWSER_URLS]);
    }

    $xml = "";
    if($result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_VISITOR_BROWSER_URLS . "` WHERE " . $where . " AND `entrance`<" . intval(time()) . " ORDER BY `entrance` ASC"))
        while($row = DBManager::FetchArray($result))
        {
            $hu = new HistoryURL($row, true);
            $xml .= $hu->GetXML($row["browser_id"]);
        }
    Server::$Response->VisitorBrowserURLs = $xml;
}

function demandFeedback($xml="")
{
    $permission = Server::$Operators[CALLER_SYSTEM_ID]->GetPermission(PERMISSION_FEEDBACK);
    if($permission == PERMISSION_NONE)
        return;

    if(!CacheManager::IsDataUpdate(POST_INTERN_DUT_FEEDBACKS,DATA_UPDATE_KEY_FEEDBACKS))
        return;

    $loads = (!empty($_POST["p_fb_l"]) && is_numeric($_POST["p_fb_l"])) ? $_POST["p_fb_l"] : DATA_DEMAND_LOADS;
    $limit = (!empty($_POST["p_fb_p"]) && is_numeric($_POST["p_fb_p"]) && $_POST["p_fb_p"]>1) ? ($_POST["p_fb_p"]-1)*$loads : 0;

    $sql_joined = array();
    $sort_direction = (!empty($_POST["p_fb_sd"]) && $_POST["p_fb_sd"]!="1") ? "ASC" : "DESC";
    $sort_column = (isset($_POST["p_fb_si"])) ? $_POST["p_fb_si"] : "created";
    $search_value = (isset($_POST["p_fb_q"])) ? $_POST["p_fb_q"] : null;

    $sql_search_ijoin = $sql_sort_ijoin = $sql_sort_where = $sql_search_where = $sql_order = "";

    // sort
    if($sort_column !== null && isset(Server::$Configuration->Database["gl_fb"][$sort_column]))
    {
        $sql_sort_where = " WHERE `cid`='".DBManager::RealEscape($sort_column)."' ";
        $sql_order = " ORDER BY `value` ".$sort_direction." ";
    }
    else if(in_array($sort_column,array("h_fullname","h_email","h_company","h_phone")))
    {
        $sql_joined[DATABASE_USER_DATA] = true;
        $sql_sort_ijoin = " INNER JOIN `".DB_PREFIX.DATABASE_USER_DATA."` AS `t3` ON `t1`.`data_id`=`t3`.`id` ";
        $sql_order = " ORDER BY LOWER(`t3`.`".$sort_column."`) ".$sort_direction." ";
    }
    else if($sort_column == "o_fullname")
    {
        $sql_joined[DATABASE_OPERATORS] = true;
        $sql_sort_ijoin = " INNER JOIN `".DB_PREFIX.DATABASE_OPERATORS."` AS `t3` ON `t1`.`operator_id`=`t3`.`system_id` ";
        $sql_order = " ORDER BY LOWER(`t3`.`firstname`) ".$sort_direction." ";
    }
    else if($sort_column == "group")
    {
        $sql_order = " ORDER BY LOWER(`group_id`) ".$sort_direction." ";
    }
    else if(!empty($sort_column))
    {
        $sql_order = " ORDER BY `".$sort_column."` ".$sort_direction." ";
    }

    // search
    if(!empty($search_value))
    {
        if(!isset($sql_joined[DATABASE_USER_DATA]))
            $sql_search_ijoin = " INNER JOIN `".DB_PREFIX.DATABASE_USER_DATA."` AS `t4` ON `t1`.`data_id`=`t4`.`id` ";
        if(!isset($sql_joined[DATABASE_OPERATORS]))
            $sql_search_ijoin .= " INNER JOIN `".DB_PREFIX.DATABASE_OPERATORS."` AS `t5` ON `t1`.`operator_id`=`t5`.`system_id` ";

        if(empty($sql_sort_where))
            $sql_search_where = " WHERE ";
        else
            $sql_search_where .= " AND ";

        $q = DBManager::RealEscape(strtolower($search_value),true);
        $sql_search_where .= "(LOWER(`value`) LIKE '%".$q."%' OR LOWER(`group_id`) LIKE '%".$q."%' OR LOWER(`fullname`) LIKE '%".$q."%' OR LOWER(`h_fullname`) LIKE '%".$q."%' OR LOWER(`h_email`) LIKE '%".$q."%' OR LOWER(`h_company`) LIKE '%".$q."%' OR LOWER(`h_phone`) LIKE '%".$q."%')";
    }

    $sql_perm_where = ($permission==1) ? (" AND `operator_id`='".DBManager::RealEscape(CALLER_SYSTEM_ID)."'") : "";
    $sql_query = "SELECT t1.*,t2.* FROM `".DB_PREFIX.DATABASE_FEEDBACKS."` AS `t1` INNER JOIN `".DB_PREFIX.DATABASE_FEEDBACK_CRITERIA."` AS `t2` ON `t1`.`id`=`t2`.`fid`".$sql_sort_ijoin.$sql_search_ijoin.$sql_sort_where.$sql_search_where."AND `resource_id`=''".$sql_perm_where." GROUP BY `fid`".$sql_order;
    $result = DBManager::Execute(true, ($sql_query . "LIMIT " . intval($limit) . "," . intval($loads) . ";"));

    if($result)
        while($row = DBManager::FetchArray($result))
        {
            $fb = new Feedback($row["id"],$row);
            $fb->LoadCriteriaList();
            $xml .= $fb->GetXML();
        }

    $q_count["total"] = "SELECT COUNT(*) AS `total`";
    $q_count["totalquery"] = "(SELECT COUNT(*) FROM (".$sql_query.") AS `stb`) AS `totalquery`";
    $result = DBManager::Execute(true, $q_count["total"] . "," . $q_count["totalquery"] . " FROM `" . DB_PREFIX . DATABASE_FEEDBACKS . "` WHERE `resource_id`=''" . $sql_perm_where);
    $row = DBManager::FetchArray($result);
    Server::$Response->Feedbacks = "<dfb t=\"".base64_encode($row["total"])."\" l=\"".base64_encode($loads)."\" q=\"".base64_encode($row["totalquery"])."\" dut=\"".base64_encode(CacheManager::$DataUpdateTimes[DATA_UPDATE_KEY_FEEDBACKS])."\">".$xml."</dfb>";
}

function demandReports()
{
    if(!STATS_ACTIVE || !isset($_POST["p_dr_p"]) || Server::$Operators[CALLER_SYSTEM_ID]->GetPermission(PERMISSION_REPORTS) == PERMISSION_NONE)
        return;

    if(!CacheManager::IsDataUpdate(POST_INTERN_DUT_REPORTS,DATA_UPDATE_KEY_REPORTS))
        return;

    $limit = (!empty($_POST["p_dr_p"]) && is_numeric($_POST["p_dr_p"]) && $_POST["p_dr_p"]>1) ? ($_POST["p_dr_p"]-1)*DATA_DEMAND_LOADS : 0;
    $type = (!empty($_POST["p_dr_t"]) && in_array($_POST["p_dr_t"],array(STATISTIC_PERIOD_TYPE_DAY,STATISTIC_PERIOD_TYPE_MONTH,STATISTIC_PERIOD_TYPE_YEAR))) ? $_POST["p_dr_t"] : STATISTIC_PERIOD_TYPE_DAY;
    $xml = "";

    if($type == STATISTIC_PERIOD_TYPE_DAY)
        $gcrit = "`day` > 0";
    else if($type == STATISTIC_PERIOD_TYPE_MONTH)
        $gcrit = "`month` > 0 AND `day`=0";
    else if($type == STATISTIC_PERIOD_TYPE_YEAR)
        $gcrit = "`year` > 0 AND `day`=0 AND `month`=0";

    $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_STATS_AGGS . "` WHERE " . $gcrit . " ORDER BY `time` DESC,`mtime` DESC LIMIT " . $limit . "," . DBManager::RealEscape(DATA_DEMAND_LOADS) . ";");
    if($result)
    {
        while($row = DBManager::FetchArray($result))
        {
            if($row["month"]== 0 && $row["day"]==0)
                $report = new StatisticYear($row["year"],0,0,$row["aggregated"],$row["mtime"]);
            else if($row["day"]==0)
                $report = new StatisticMonth($row["year"],$row["month"],0,$row["aggregated"],$row["mtime"]);
            else
                $report = new StatisticDay($row["year"],$row["month"],$row["day"],$row["aggregated"],$row["mtime"]);

            $chats = 0;
            $qmonth = ($report->Type == STATISTIC_PERIOD_TYPE_YEAR) ? "" : " AND `month`='".DBManager::RealEscape($row["month"])."'";
            $qday = ($report->Type != STATISTIC_PERIOD_TYPE_DAY) ? "" : " AND `day`='".DBManager::RealEscape($row["day"])."'";
            if($results = DBManager::Execute(true, "SELECT (SUM(`amount`)-SUM(`multi`)) AS `samount` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_CHATS . "` WHERE `user_id`='' AND `year`='" . DBManager::RealEscape($row["year"]) . "'" . $qmonth . $qday . ""))
                if(DBManager::GetRowCount($results) == 1)
                {
                    $rows = DBManager::FetchArray($results);
                    if(is_numeric($rows["samount"]))
                        $chats = $rows["samount"];
                }
            $convrate = ($row["sessions"]>0) ? round(((100*$row["conversions"])/$row["visitors_unique"]),StatisticProvider::$RoundPrecision) : 0;
            $convrate = min(100,$convrate);


            // tickets
            if($type == STATISTIC_PERIOD_TYPE_DAY)
                $ticrit = "`year`=".intval($row["year"])." AND `day`=".intval($row["day"])." AND `month`=".intval($row["month"]);
            else if($type == STATISTIC_PERIOD_TYPE_MONTH)
                $ticrit = "`year`=".intval($row["year"])." AND `month`=".intval($row["month"]);
            else if($type == STATISTIC_PERIOD_TYPE_YEAR)
                $ticrit = "`year`=".intval($row["year"]);

            $resultt = DBManager::Execute(true, "SELECT SUM(`amount`) AS `tamount` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_TICKETS . "` WHERE `group_id`!='' AND " . $ticrit);
            $tamount = 0;
            if($resultt)
            {
                if($rowt = DBManager::FetchArray($resultt))
                {
                    $tamount = $rowt["tamount"];
                }
            }
            $xml .= "<r i=\"".base64_encode($report->GetHash())."\" a=\"".base64_encode($row["aggregated"])."\" ti=\"".base64_encode($tamount)."\" ch=\"".base64_encode($chats)."\" c=\"".base64_encode($convrate)."\" r=\"".base64_encode($report->Type)."\" s=\"".base64_encode($row["sessions"])."\" v=\"".base64_encode($row["visitors_unique"])."\" t=\"".base64_encode($row["time"])."\" mt=\"".base64_encode($row["mtime"])."\" y=\"".base64_encode($row["year"])."\" m=\"".base64_encode($row["month"])."\" d=\"".base64_encode($row["day"])."\"></r>\r\n";
        }
    }
    $result = DBManager::Execute(true, "SELECT count(`time`) AS `total` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS . "`;");
    $trow = DBManager::FetchArray($result);
    $result = DBManager::Execute(true, "SELECT count(`time`) AS `ttotal` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS . "` WHERE " . $type . ";");
    $ttrow = DBManager::FetchArray($result);
    Server::$Response->Reports = "<dr dut=\"".base64_encode(CacheManager::$DataUpdateTimes[DATA_UPDATE_KEY_REPORTS])."\" p=\"".base64_encode(DATA_ITEM_LOADS)."\" t=\"".base64_encode($trow["total"])."\" q=\"".base64_encode($ttrow["ttotal"])."\">\r\n" . $xml . "\r\n</dr>";
}

function demandEmails($xml="",$countActive=0,$countDeleted=0,$lmc=0,$c_name="",$c_text="")
{
    if(!CacheManager::IsDataUpdate(POST_INTERN_DUT_EMAILS,DATA_UPDATE_KEY_EMAILS))
        return;

    $permissione = Server::$Operators[CALLER_SYSTEM_ID]->GetPermission(22);
    $full = $permissione != PERMISSION_NONE;

    $groupPermissionSQL_W = ($permissione == PERMISSION_RELATED) ? " WHERE `group_id` IN ('".implode("','",Server::$Operators[CALLER_SYSTEM_ID]->Groups)."')" : "";
    $groupPermissionSQL_A = ($permissione == PERMISSION_RELATED) ? " AND `group_id` IN ('".implode("','",Server::$Operators[CALLER_SYSTEM_ID]->Groups)."')" : "";

    if($full)
    {
        $result = DBManager::Execute(true, "SELECT `t1`.`email_id`,`t1`.`deleted`,`t1`.`editor_id` FROM `" . DB_PREFIX . DATABASE_TICKET_EMAILS . "` AS `t1` INNER JOIN `" . DB_PREFIX . DATABASE_MAILBOXES . "` AS `t2` ON `t1`.`mailbox_id`=`t2`.`id`" . $groupPermissionSQL_W);
        if($result)
        {
            while($row = DBManager::FetchArray($result))
            {
                if(empty($row["deleted"]))
                    $countActive++;
                else if(!empty($row["editor_id"]))
                    $countDeleted++;
            }
        }
    }

    if($countActive>0 || $countDeleted>0)
    {
        // active
        if(!empty($_POST["p_de_a"]) && is_numeric($_POST["p_de_a"]))
        {
            $result = DBManager::Execute(true, "SELECT `t1`.*,`t2`.`email` AS `receiver_mail` FROM `" . DB_PREFIX . DATABASE_TICKET_EMAILS . "` AS `t1` INNER JOIN `" . DB_PREFIX . DATABASE_MAILBOXES . "` AS `t2` ON `t1`.`mailbox_id`=`t2`.`id` WHERE `t1`.`deleted`=0".$groupPermissionSQL_A." ORDER BY `created` ASC" . " LIMIT 0," . $_POST["p_de_a"] . ";");
            if($result)
                while($row = DBManager::FetchArray($result))
                {
                    $full = $permissione != PERMISSION_NONE;
                    $email = new TicketEmail($row);
                    $email->LoadAttachments();
                    $xml .= $email->GetXML($full);
                }
        }

        // deleted
        if(!empty($_POST["p_de_ad"]) && is_numeric($_POST["p_de_ad"]))
        {
            $result = DBManager::Execute(true, "SELECT `t1`.*,`t2`.`email` AS `receiver_mail` FROM `" . DB_PREFIX . DATABASE_TICKET_EMAILS . "` AS `t1` INNER JOIN `" . DB_PREFIX . DATABASE_MAILBOXES . "` AS `t2` ON `t1`.`mailbox_id`=`t2`.`id` WHERE `t1`.`deleted`=1 AND `t1`.`editor_id`!=''".$groupPermissionSQL_A." ORDER BY `created` DESC" . " LIMIT 0," . $_POST["p_de_ad"] . ";");
            if($result)
                while($row = DBManager::FetchArray($result))
                {
                    $email = new TicketEmail($row);
                    $xml .= $email->GetXML(false);
                }
        }

        $result = DBManager::Execute(true, "SELECT `created` AS `lmc`,`sender_name`,`sender_email`,`body` FROM `" . DB_PREFIX . DATABASE_TICKET_EMAILS . "`".$groupPermissionSQL_W." ORDER BY `created` DESC LIMIT 1;");
        if($result && $row = DBManager::FetchArray($result))
        {
            $lmc = $row["lmc"];
            $sn = DBManager::DecodeField($row["sender_name"]);
            $c_name = (!empty($sn) ? $sn : $row["sender_email"]);
            $c_text = DBManager::DecodeField($row["body"]);
        }
    }
    Server::$Response->Messages .= "<de dut=\"".base64_encode(CacheManager::$DataUpdateTimes[DATA_UPDATE_KEY_EMAILS])."\" lmc=\"".base64_encode($lmc)."\" elmn=\"".base64_encode($c_name)."\" elmt=\"".base64_encode(Str::Cut($c_text,5000,true))."\" c=\"".base64_encode($countActive)."\" cd=\"".base64_encode($countDeleted)."\">\r\n" . $xml . "\r\n</de>";
}

function demandChatArchive($xml="",$q_filter="",$q_searchw="")
{
    if(!CacheManager::IsDataUpdate(POST_INTERN_DUT_CHAT_ARCH,DATA_UPDATE_KEY_CHAT_ARCH))
        return;

    $loads = (!empty($_POST["p_dc_l"]) && is_numeric($_POST["p_dc_l"])) ? $_POST["p_dc_l"] : DATA_DEMAND_LOADS;
    $limit = (!empty($_POST["p_dc_p"]) && is_numeric($_POST["p_dc_p"]) && $_POST["p_dc_p"]>1) ? ($_POST["p_dc_p"]-1)*$loads : 0;

    if(!empty($_POST["p_dc_fg"]))
        $q_filter = "`chat_type`=2 AND `group_id`='" . DBManager::RealEscape($_POST["p_dc_fg"]) . "'";
    else if(!empty($_POST["p_dc_fe"]))
        $q_filter = "`chat_type`=1 AND `external_id`='" . DBManager::RealEscape($_POST["p_dc_fe"]) . "'";
    else if(!empty($_POST["p_dc_fi"]))
        $q_filter = "`chat_type`=0 AND `internal_id`='" . DBManager::RealEscape($_POST["p_dc_fi"]) . "'";
    else
    {
        if(!isset($_POST["p_dc_f"]))
            $_POST["p_dc_f"] = "012";

        $fchars=str_split($_POST["p_dc_f"]);
        foreach($fchars as $fchar)
            if(is_numeric($fchar))
                if(!empty($fchar))
                    $q_filter.= (empty($q_filter)) ? "`chat_type`=".$fchar : " OR `chat_type`=".$fchar;
                else
                    $q_filter.= (empty($q_filter)) ? "`chat_type`=0" : " OR `chat_type`=0";

        if(!empty($_POST["p_dc_q"]) || !empty($_POST["p_dc_t"]))
        {
            $q = DBManager::RealEscape(strtolower($_POST["p_dc_q"]),true);
            $q_searchw = ChatArchive::GetSearchQuery($q,$_POST["p_dc_t"]);
            $q_searchw = " AND (" . $q_searchw . ")";
        }
    }

    Server::InitDataBlock(array("INPUTS"));

    $q_base = "`closed`>0";
    $q_grperm = Chat::GetPermissionSQL(CALLER_SYSTEM_ID);

    if(!empty($q_filter))
        $q_filter = " AND (" . $q_filter . ")";

    $q_inner = "FROM `".DB_PREFIX.DATABASE_CHAT_ARCHIVE."` WHERE ". $q_base . $q_filter . $q_searchw . $q_grperm ." ORDER BY `closed` DESC";
    $result = DBManager::Execute(true, "SELECT * " . $q_inner . " LIMIT " . $limit . "," . DBManager::RealEscape($loads) . ";");

    if($result)
        while($row = DBManager::FetchArray($result))
        {
            $chat = new Chat();
            $chat->SetValues($row);
            $xml .= $chat->GetXML($chat->Permission(CALLER_SYSTEM_ID),true,false);
        }

    $q_count["total"] = "SELECT COUNT(*) AS `total`";
    $q_count["totalperm"] = "(SELECT COUNT(*) FROM (SELECT `".DB_PREFIX.DATABASE_CHAT_ARCHIVE."`.`chat_id` FROM `".DB_PREFIX.DATABASE_CHAT_ARCHIVE."` WHERE ". $q_base . $q_grperm .") AS `sta`) AS `totalperm`";
    $q_count["totalquery"] = "(SELECT COUNT(*) FROM (SELECT `".DB_PREFIX.DATABASE_CHAT_ARCHIVE."`.`chat_id` ". $q_inner .") AS `stb`) AS `totalquery`";
    $result = DBManager::Execute(true, $q=$q_count["total"] . "," . $q_count["totalperm"] . "," . $q_count["totalquery"] . " FROM `" . DB_PREFIX . DATABASE_CHAT_ARCHIVE . "`");

    $row = DBManager::FetchArray($result);
    $c_total = min($row["total"],$row["totalperm"]);
    $c_totalquery = min($row["totalquery"],$row["totalperm"]);
    Server::$Response->Archive .= "<dc dut=\"".base64_encode(CacheManager::$DataUpdateTimes[DATA_UPDATE_KEY_CHAT_ARCH])."\" p=\"".base64_encode($loads)."\" t=\"".base64_encode($c_total)."\" q=\"".base64_encode($c_totalquery)."\">\r\n" . $xml . "\r\n</dc>";
}

function demandTickets($xml="",$q_content_filter="",$q_count_filter="",$q_searchw="",$q_searchf="",$c_total=0,$c_totalall=0,$c_totalread=0,$c_totalquery=0,$c_totalmy=0,$c_totalmygroups=0,$c_totalst0=0,$c_totalst1=0,$c_totalst2=0,$c_totalst3=0,$c_totalst4=0,$c_totaldue=0,$c_totaltsd="",$c_lmi=0,$c_lmc=0,$c_name="",$c_text="",$wlxml = "",$loads=0)
{
    $permission = Server::$Operators[CALLER_SYSTEM_ID]->GetPermission(PERMISSION_TICKETS);
    if($permission != PERMISSION_NONE)
    {
        if(!CacheManager::IsDataUpdate(POST_INTERN_DUT_TICKETS,DATA_UPDATE_KEY_TICKETS) && CacheManager::$DataUpdateTimes[DATA_UPDATE_KEY_TICKETS]!=0)
            return;

        SystemTime::GetExecutionTime();

        if(!empty($_POST["p_dt_q"]))
            unset($_POST["p_dt_f"],$_POST["p_dt_fc"],$_POST["p_dt_fp"],$_POST["p_dt_fg"]);

        if(!isset($_POST["p_dt_f"]))
            $_POST["p_dt_f"] = "01234";
        else if($_POST["p_dt_f"]=="")
            $_POST["p_dt_f"] = "9";

        $overdue = false;
        if(Str::EndsWith($_POST["p_dt_f"],"od"))
        {
            $overdue = true;
            $_POST["p_dt_f"] = str_replace("od","",$_POST["p_dt_f"]);
        }

        if(!isset($_POST["p_dt_fc"]))
            $_POST["p_dt_fc"] = "01234567";
        else if($_POST["p_dt_fc"]=="")
            $_POST["p_dt_fc"] = "9";

        $loads = (!empty($_POST["p_dt_l"]) && is_numeric($_POST["p_dt_l"])) ? $_POST["p_dt_l"] : DATA_DEMAND_LOADS;
        $limit = (!empty($_POST["p_dt_p"]) && is_numeric($_POST["p_dt_p"]) && $_POST["p_dt_p"]>1) ? ($_POST["p_dt_p"]-1)*$loads : 0;
        $ignoreQuickFilter = (isset($_POST["p_dt_fg"]) || isset($_POST["p_dt_fwl"]) || isset($_POST["p_dt_fp"]));

        $q_sort = array();

        $sortdefdesc = !empty($_POST["p_dt_s_d"]) && $_POST["p_dt_s_d"] == "ASC" ? "ASC" : "DESC";
        $sortdefasc = !empty($_POST["p_dt_s_d"]) && $_POST["p_dt_s_d"] == "DESC" ? "DESC" : "ASC";

        $q_sort["id"] = " GROUP BY `".DB_PREFIX.DATABASE_TICKETS."`.`id` ORDER BY `".DB_PREFIX.DATABASE_TICKETS."`.`id` " . $sortdefdesc;
        $q_sort["update"] = " GROUP BY `".DB_PREFIX.DATABASE_TICKETS."`.`id` ORDER BY `".DB_PREFIX.DATABASE_TICKETS."`.`last_update` " . $sortdefdesc;
        $q_sort["priority"] = " GROUP BY `".DB_PREFIX.DATABASE_TICKETS."`.`id` ORDER BY `".DB_PREFIX.DATABASE_TICKETS."`.`priority` " . $sortdefdesc . ",`".DB_PREFIX.DATABASE_TICKETS."`.`last_update` DESC";
        $q_sort["wait"] = " GROUP BY `".DB_PREFIX.DATABASE_TICKETS."`.`id` ORDER BY `".DB_PREFIX.DATABASE_TICKETS."`.`wait_begin` " . $sortdefasc . ",`".DB_PREFIX.DATABASE_TICKETS."`.`last_update` DESC";
        $q_sort["status"] = " GROUP BY `".DB_PREFIX.DATABASE_TICKETS."`.`id` ORDER BY `te`.`status` " . ($sortdefasc . ",`te`.`sub_status` ASC,`".DB_PREFIX.DATABASE_TICKETS."`.`last_update` DESC");
        $q_sort["sub_status"] = " GROUP BY `".DB_PREFIX.DATABASE_TICKETS."`.`id` ORDER BY if(`te`.`sub_status` = '' or `te`.`sub_status` is null,1,0),`te`.`sub_status` " . $sortdefasc;
        $q_sort["channel_type"] = " GROUP BY `".DB_PREFIX.DATABASE_TICKETS."`.`id` ORDER BY field(`channel_type`,4,1,6,5,3,2,7,0) " . ($sortdefasc . ",`sub_channel` ASC");
        $q_sort["sub_channel"] = " GROUP BY `".DB_PREFIX.DATABASE_TICKETS."`.`id` ORDER BY if(`sub_channel` = '' or `sub_channel` is null,1,0),`sub_channel` " . $sortdefasc;

        $sort_index = (!empty($_POST["p_dt_s"]) && !empty($q_sort[$_POST["p_dt_s"]])) ? $_POST["p_dt_s"] : "id";

        if(isset($_POST["p_dt_f"]) && strlen($_POST["p_dt_f"]) < 5 && $_POST["p_dt_f"] != 9)
        {
            $fchars=str_split($_POST["p_dt_f"]);
            foreach($fchars as $fchar)
                if(is_numeric($fchar))
                    if(!empty($fchar))
                        $q_content_filter.= (empty($q_content_filter)) ? "`te`.`status`=".$fchar : " OR `te`.`status`=".$fchar;
                    else
                        $q_content_filter.= (empty($q_content_filter)) ? "`te`.`status` IS NULL OR `te`.`status`=0" : " OR `te`.`status` IS NULL OR `te`.`status`=0";
        }

        if(isset($_POST["p_dt_fc"]) && strlen($_POST["p_dt_fc"]) < 8 && $_POST["p_dt_fc"] != 9)
        {
            $fchars=str_split($_POST["p_dt_fc"]);
            $q_filter_channel = "";
            foreach($fchars as $fchar)
                if(is_numeric($fchar))
                    if(!empty($fchar))
                        $q_filter_channel .= (empty($q_filter_channel)) ? "`channel_type`=".$fchar : " OR `channel_type`=".$fchar;
                    else
                        $q_filter_channel.= (empty($q_filter_channel)) ? "`channel_type` IS NULL OR `channel_type`=0" : " OR `channel_type` IS NULL OR `channel_type`=0";
            $q_content_filter = (empty($q_content_filter)) ? $q_filter_channel : "(" . $q_content_filter . ") AND (" . $q_filter_channel . ")";
            $q_count_filter = DBManager::ConditionAdd($q_count_filter,$q_filter_channel);
        }

        if(!empty($_POST["p_dt_fp"]) && !isset($_POST["p_dt_fwl"]))
        {
            $fval = "`te`.`editor_id`='".DBManager::RealEscape(CALLER_SYSTEM_ID)."'";
            $q_content_filter = DBManager::ConditionAdd($q_content_filter,$fval);
        }

        if(isset($_POST["p_dt_fg"]) && !empty($_POST["p_dt_fg"]))
        {
            $fval = "`target_group_id` IN ('".implode("','",Server::$Operators[CALLER_SYSTEM_ID]->Groups)."')";
            $q_content_filter = DBManager::ConditionAdd($q_content_filter,$fval);
        }

        if(isset($_POST["p_dt_fgl"]) && !empty($_POST["p_dt_fgl"]))
        {
            $fval = "`target_group_id` IN (".$_POST["p_dt_fgl"].")";
            if(!$ignoreQuickFilter)
                $q_content_filter = DBManager::ConditionAdd($q_content_filter,$fval);
            $q_count_filter = DBManager::ConditionAdd($q_count_filter,$fval);
        }

        if(isset($_POST["p_dt_fss"]) && !empty($_POST["p_dt_fss"]))
        {
            $fval = "(`te`.`sub_status` = '".DBManager::RealEscape($_POST["p_dt_fss"])."')";
            $q_content_filter = DBManager::ConditionAdd($q_content_filter,$fval);
        }

        $ticketDueTime = intval(Server::$Configuration->File["gl_tidt"])*3600;
        if($overdue)
        {
            $fval = "(`wait_begin` < ".(time()-$ticketDueTime).")";
            $q_content_filter = DBManager::ConditionAdd($q_content_filter,$fval);
        }

        if(isset($_POST["p_dt_fsc"]) && !empty($_POST["p_dt_fsc"]))
        {
            $sscs = explode(',',$_POST["p_dt_fsc"]);
            $scfco = $scfct = '';
            foreach($sscs as $scf)
            {
                $scf = base64_decode($scf);
                $pindex = substr($scf,0,1);
                $schan = substr($scf,1,strlen($scf)-1);

                if(!empty($scfco))
                    $scfco .= " OR ";

                $scfco .= "(`channel_type` = ".intval($pindex)." AND `sub_channel` = '".DBManager::RealEscape($schan)."' OR `sub_channel` = '')";
            }

            if(!$ignoreQuickFilter)
            {
                if(empty($q_content_filter))
                    $q_content_filter.= "(" . $scfco . ")";
                else
                    $q_content_filter = "((" . $q_content_filter . ") AND (" . $scfco . "))";
            }

            if(empty($q_count_filter))
                $q_count_filter.= "(" . $scfco . ")";
            else
                $q_count_filter = "((" . $q_count_filter . ") AND (" . $scfco . "))";
        }

        $q_watchlist = "";
        if(isset($_POST["p_dt_fwl"]))
        {
            $fval = "`twl`.`operator_id`='".DBManager::RealEscape(CALLER_SYSTEM_ID)."'";
            $q_content_filter = DBManager::ConditionAdd($q_content_filter,$fval);
            $q_watchlist = " LEFT JOIN `".DB_PREFIX.DATABASE_TICKET_WATCHER."` AS `twl` ON `".DB_PREFIX.DATABASE_TICKETS."`.`id`=`twl`.`ticket_id`"; // 7.0.9.5
        }

        $tags = isset($_POST["p_dt_t"]) ? $_POST["p_dt_t"] : "";

        if(!empty($_POST["p_dt_q"]) || !empty($tags))
        {
            $q = DBManager::RealEscape(Str::ToLower($_POST["p_dt_q"],"utf-8"),true);
            $q_searchf = " LEFT JOIN `".DB_PREFIX.DATABASE_TICKET_CUSTOMS."` AS `tc` ON `".DB_PREFIX.DATABASE_TICKETS."`.`id`=`tc`.`ticket_id`";
            $q_searchf .= " LEFT JOIN `".DB_PREFIX.DATABASE_TICKET_MESSAGES."` AS `tm` ON `".DB_PREFIX.DATABASE_TICKETS."`.`id`=`tm`.`ticket_id` ";
            $q_searchf .= " LEFT JOIN `".DB_PREFIX.DATABASE_OPERATORS."` AS `do` ON `te`.`editor_id`=`do`.`system_id` ";

            if(isset($_POST["p_dt_q_ss"]) && is_numeric($_POST["p_dt_q_ss"]) && strlen($_POST["p_dt_q_ss"]) > 13 && substr($_POST["p_dt_q_ss"],13,1) == 1)
                $q_searchf .= " LEFT JOIN `".DB_PREFIX.DATABASE_TICKET_COMMENTS."` AS `tcom` ON `".DB_PREFIX.DATABASE_TICKETS."`.`id`=`tcom`.`ticket_id` ";

            $q_searchw = Ticket::GetSearchQuery($q,$tags);
        }

        Server::InitDataBlock(array("INPUTS"));
        $q_content_filter = (!empty($q_content_filter)) ? " AND (" . $q_content_filter . ")": "";
        $q_count_filter = (!empty($q_count_filter)) ? " AND (" . $q_count_filter . ")": "";
        $q_grperm = (isset($_POST["p_dt_fwl"]) || $permission == PERMISSION_FULL) ? "" : "`target_group_id` IN ('".implode("','",Server::$Operators[CALLER_SYSTEM_ID]->Groups)."') AND ";
        $q_inner = "FROM `".DB_PREFIX.DATABASE_TICKETS."` LEFT JOIN `".DB_PREFIX.DATABASE_TICKET_EDITORS."` AS `te` ON `".DB_PREFIX.DATABASE_TICKETS."`.`id`=`te`.`ticket_id`" . $q_watchlist . " ". $q_searchf ."WHERE ". $q_grperm ."`deleted`=0". $q_content_filter . $q_searchw . $q_sort[$sort_index];

        $result = DBManager::Execute(true, $q = "SELECT *,`te`.`ticket_id` " . $q_inner . " LIMIT " . $limit . "," . DBManager::RealEscape($loads) . ";");

        if($result)
            while($row = DBManager::FetchArray($result))
            {
                $ticket = new Ticket($row,null,null);
                $ticket->LoadLogs();

                if(count($ticket->Messages) > 0)
                {
                    $xml .= $ticket->GetXML(true,true);
                }
            }

        $q_grperm = ($permission == PERMISSION_FULL) ? "" : " WHERE `target_group_id` IN ('".implode("','",Server::$Operators[CALLER_SYSTEM_ID]->Groups)."')";
        $q_count["total"] = "SELECT COUNT(*) AS `total`";
        $q_count["totalperm"] = "(SELECT COUNT(*) FROM (SELECT `".DB_PREFIX.DATABASE_TICKETS."`.`id` FROM `".DB_PREFIX.DATABASE_TICKETS."`". $q_grperm .") AS `sta`) AS `totalperm`";
        $q_count["totalquery"] = "(SELECT COUNT(*) FROM (SELECT `".DB_PREFIX.DATABASE_TICKETS."`.`id` ". $q_inner .") AS `stb`) AS `totalquery`";

        $q_grperm = ($permission == PERMISSION_FULL) ? "" : " AND `target_group_id` IN ('".implode("','",Server::$Operators[CALLER_SYSTEM_ID]->Groups)."')";
        $q_count["totalall"] = ",(SELECT COUNT(*) FROM `".DB_PREFIX.DATABASE_TICKETS."` LEFT JOIN `".DB_PREFIX.DATABASE_TICKET_EDITORS."` AS `te` ON `".DB_PREFIX.DATABASE_TICKETS."`.`id`=`te`.`ticket_id` WHERE `deleted`=0".$q_grperm.$q_count_filter.") AS `totalall`";
        $q_count["totalread"] = "";
        $q_count["totalmy"] = ",(SELECT COUNT(*) FROM `".DB_PREFIX.DATABASE_TICKETS."` LEFT JOIN `".DB_PREFIX.DATABASE_TICKET_EDITORS."` AS `te` ON `".DB_PREFIX.DATABASE_TICKETS."`.`id`=`te`.`ticket_id` WHERE `deleted`=0".$q_grperm.$q_count_filter." AND `status`<=1 AND `editor_id`='".DBManager::RealEscape(CALLER_SYSTEM_ID)."') AS `totalmy`";
        $q_count["totalmygroups"] = ",(SELECT COUNT(*) FROM `".DB_PREFIX.DATABASE_TICKETS."` LEFT JOIN `".DB_PREFIX.DATABASE_TICKET_EDITORS."` AS `te` ON `".DB_PREFIX.DATABASE_TICKETS."`.`id`=`te`.`ticket_id` WHERE `deleted`=0 AND `target_group_id` IN ('".implode("','",Server::$Operators[CALLER_SYSTEM_ID]->Groups)."') AND (`te`.`status`<=1 OR `te`.`status` IS NULL)) AS `totalmygroups`";
        $q_count["totalst0"] = ",(SELECT COUNT(*) FROM `".DB_PREFIX.DATABASE_TICKETS."` LEFT JOIN `".DB_PREFIX.DATABASE_TICKET_EDITORS."` AS `te` ON `".DB_PREFIX.DATABASE_TICKETS."`.`id`=`te`.`ticket_id` WHERE `deleted`=0".$q_grperm.$q_count_filter." AND (`te`.`status`<=0 OR `te`.`status` IS NULL)) AS `totalst0`";
        $q_count["totalst1"] = ",(SELECT COUNT(*) FROM `".DB_PREFIX.DATABASE_TICKETS."` LEFT JOIN `".DB_PREFIX.DATABASE_TICKET_EDITORS."` AS `te` ON `".DB_PREFIX.DATABASE_TICKETS."`.`id`=`te`.`ticket_id` WHERE `deleted`=0".$q_grperm.$q_count_filter." AND `status`=1) AS `totalst1`";
        $q_count["totalst2"] = ",(SELECT COUNT(*) FROM `".DB_PREFIX.DATABASE_TICKETS."` LEFT JOIN `".DB_PREFIX.DATABASE_TICKET_EDITORS."` AS `te` ON `".DB_PREFIX.DATABASE_TICKETS."`.`id`=`te`.`ticket_id` WHERE `deleted`=0".$q_grperm.$q_count_filter." AND `status`=2) AS `totalst2`";
        $q_count["totalst3"] = ",(SELECT COUNT(*) FROM `".DB_PREFIX.DATABASE_TICKETS."` LEFT JOIN `".DB_PREFIX.DATABASE_TICKET_EDITORS."` AS `te` ON `".DB_PREFIX.DATABASE_TICKETS."`.`id`=`te`.`ticket_id` WHERE `deleted`=0".$q_grperm.$q_count_filter." AND `status`=3) AS `totalst3`";
        $q_count["totalst4"] = ",(SELECT COUNT(*) FROM `".DB_PREFIX.DATABASE_TICKETS."` LEFT JOIN `".DB_PREFIX.DATABASE_TICKET_EDITORS."` AS `te` ON `".DB_PREFIX.DATABASE_TICKETS."`.`id`=`te`.`ticket_id` WHERE `deleted`=0".$q_grperm.$q_count_filter." AND `status`=4) AS `totalst4`";
        $q_count["totaltsd"] = "";
        $q_count["totaldue"] = ",(SELECT COUNT(*) FROM `".DB_PREFIX.DATABASE_TICKETS."` LEFT JOIN `".DB_PREFIX.DATABASE_TICKET_EDITORS."` AS `te` ON `".DB_PREFIX.DATABASE_TICKETS."`.`id`=`te`.`ticket_id` WHERE `deleted`=0".$q_grperm.$q_count_filter." AND `status`<2 AND `wait_begin` < ".(time()-$ticketDueTime).") AS `totaldue`";

        if(!empty(Server::$Configuration->Database["gl_tsd"]))
            foreach(Server::$Configuration->Database["gl_tsd"] as $tsd)
                $q_count["totaltsd"] .= ",(SELECT COUNT(*) FROM `".DB_PREFIX.DATABASE_TICKETS."` LEFT JOIN `".DB_PREFIX.DATABASE_TICKET_EDITORS."` AS `te` ON `".DB_PREFIX.DATABASE_TICKETS."`.`id`=`te`.`ticket_id` WHERE `status`='".DBManager::RealEscape($tsd->ParentId)."' AND `deleted`=0 AND `sub_status`='".DBManager::RealEscape($tsd->Id)."' ".$q_grperm.$q_count_filter.") AS `ttsd".$tsd->GetShortId()."`";

        $result = DBManager::Execute(true, $d=($q_count["total"] . "," . $q_count["totalperm"] . "," . $q_count["totalquery"] . $q_count["totalread"] . $q_count["totalall"] . $q_count["totalmy"] . $q_count["totalmygroups"] . $q_count["totalst0"] . $q_count["totalst1"] . $q_count["totalst2"] . $q_count["totalst3"] . $q_count["totalst4"] . $q_count["totaltsd"] . $q_count["totaldue"] . " FROM `" . DB_PREFIX . DATABASE_TICKETS . "` WHERE `deleted`=0;"));

        if($row = DBManager::FetchArray($result))
        {
            if(!isset($row["totalall"]))$row["totalall"] = 0;
            if(!isset($row["totalread"]))$row["totalread"] = 0;
            if(!isset($row["totalmy"]))$row["totalmy"] = 0;
            if(!isset($row["totalmygroups"]))$row["totalmygroups"] = 0;
            if(!isset($row["totalst0"]))$row["totalst0"] = 0;
            if(!isset($row["totalst1"]))$row["totalst1"] = 0;
            if(!isset($row["totalst2"]))$row["totalst2"] = 0;
            if(!isset($row["totalst3"]))$row["totalst3"] = 0;
            if(!isset($row["totalst4"]))$row["totalst4"] = 0;
            if(!isset($row["totalwl"]))$row["totalwl"] = 0;
            if(!isset($row["totaldue"]))$row["totaldue"] = 0;

            $c_total = min($row["total"],$row["totalperm"]);
            $c_totalall = $row["totalall"];
            $c_totalread = min($row["totalread"],$row["totalperm"]);
            $c_totalquery = min($row["totalquery"],$row["totalperm"]);
            $c_totalmy = $row["totalmy"];
            $c_totalmygroups = $row["totalmygroups"];
            $c_totalst0 = $row["totalst0"];
            $c_totalst1 = $row["totalst1"];
            $c_totalst2 = $row["totalst2"];
            $c_totalst3 = $row["totalst3"];
            $c_totalst4 = $row["totalst4"];
            $c_totaldue = $row["totaldue"];

            if(!empty(Server::$Configuration->Database["gl_tsd"]))
                foreach(Server::$Configuration->Database["gl_tsd"] as $tsd)
                    $c_totaltsd .= " ttsd" . $tsd->GetShortId()."=\"" . base64_encode($row["ttsd" . $tsd->GetShortId()]) . "\"";

            // notification
            $q_grperm = ($permission == PERMISSION_FULL) ? "" : "`target_group_id` IN ('".implode("','",Server::$Operators[CALLER_SYSTEM_ID]->Groups)."')";
            if(isset($_POST["p_dt_fgl"]) && !empty($_POST["p_dt_fgl"]))
            {
                $fval = "`target_group_id` IN (".$_POST["p_dt_fgl"].")";

                if(!empty($q_grperm))
                    $q_grperm .= " AND ";

                $q_grperm .= $fval;
            }

            $ignore = false;
            $result = DBManager::Execute(true, $e = "SELECT `created`,`fullname`,`text`,`ticket_id` FROM `" . DB_PREFIX . DATABASE_TICKET_MESSAGES . "` WHERE (`type`=0 OR `type`=3 OR `type`=4) ORDER BY `time` DESC LIMIT 1;");
            if($result && $row = DBManager::FetchArray($result))
            {
                if(!empty($q_grperm))
                {
                    $resultpc = DBManager::Execute(true, "SELECT `target_group_id` FROM `" . DB_PREFIX . DATABASE_TICKETS . "` WHERE `id`=".intval($row["ticket_id"])." AND " . $q_grperm);
                    if(DBManager::GetRowCount($resultpc) == 0)
                        $ignore = true;
                }
                if(!$ignore)
                {
                    $c_lmi = $row["ticket_id"];
                    $c_lmc = $row["created"];
                    $c_name = $row["fullname"];
                    $c_text = $row["text"];
                }
            }

            $wlmu = 0;
            $result = DBManager::Execute(true, "SELECT `ticket_id`,`last_update` FROM `" . DB_PREFIX . DATABASE_TICKET_WATCHER . "` AS `twl` INNER JOIN `" . DB_PREFIX . DATABASE_TICKETS . "` AS `ti` ON `ti`.`id`=`twl`.`ticket_id` WHERE `ti`.`deleted`=0 AND `twl`.`operator_id`='" . DBManager::RealEscape(CALLER_SYSTEM_ID) . "';");

            while($row = DBManager::FetchArray($result))
            {
                $wlmu = max($wlmu,$row["last_update"]);
                $wlxml .= "<w>" . base64_encode($row["ticket_id"]) . "</w>";
            }
            if(!empty($wlxml))
                $wlxml = "<wl u=\"".base64_encode($wlmu)."\">" . $wlxml . "</wl>";
        }
        else
            Logging::DatabaseLog("Invalid query:" . $q);
    }

    Server::$Response->Messages .= "<dt dut=\"".base64_encode(CacheManager::$DataUpdateTimes[DATA_UPDATE_KEY_TICKETS])."\" lmi=\"".base64_encode($c_lmi)."\" lmc=\"".base64_encode($c_lmc)."\" lmn=\"".base64_encode($c_name)."\" lmt=\"".base64_encode($c_text)."\" p=\"".base64_encode($loads)."\" ta=\"".base64_encode($c_totalall)."\" t=\"".base64_encode($c_total)."\" r=\"".base64_encode($c_totalread)."\" q=\"".base64_encode($c_totalquery)."\" tm=\"".base64_encode($c_totalmy)."\" tmg=\"".base64_encode($c_totalmygroups)."\" tst0=\"".base64_encode($c_totalst0)."\" tst1=\"".base64_encode($c_totalst1)."\" tst2=\"".base64_encode($c_totalst2)."\" tst3=\"".base64_encode($c_totalst3)."\" tst4=\"".base64_encode($c_totalst4)."\" tdue=\"".base64_encode($c_totaldue)."\" ".$c_totaltsd.">\r\n" . $wlxml . $xml . "\r\n</dt>";
}

function demandChats()
{
    if(!isset($_POST[POST_INTERN_XMLCLIP_CHATS_ACTIVE_END_TIME]))
        $_POST[POST_INTERN_XMLCLIP_CHATS_ACTIVE_END_TIME] = time()-(600);
    else if($_POST[POST_INTERN_XMLCLIP_CHATS_ACTIVE_END_TIME]=='N')
        return;

    if(!isset($_POST[POST_INTERN_XMLCLIP_CHATS_CLOSED_END_TIME]))
        $_POST[POST_INTERN_XMLCLIP_CHATS_CLOSED_END_TIME] = time()-(600);

    $xml = "";
    $dut_active = $_POST[POST_INTERN_XMLCLIP_CHATS_ACTIVE_END_TIME];
    $dut_closed = $_POST[POST_INTERN_XMLCLIP_CHATS_CLOSED_END_TIME];

    $counta = 0;
    $countc = 0;

    $modChats = array();
    if(isset($_POST["p_ext_cl_pci"]))
    {
        $prchatid = explode(",",$_POST["p_ext_cl_pci"]);
        foreach($prchatid as $cid)
            $modChats[] = intval($cid);
    }

    if(!empty($modChats))
        $modChats = " OR `chat_id` IN (" . implode(",",$modChats).")";
    else
        $modChats = "";

    Chat::KeepAliveAPIChats();

    // active
    $result = DBManager::Execute(true, "SELECT * FROM `".DB_PREFIX.DATABASE_VISITOR_CHATS."` WHERE (`last_active` >= " . intval($dut_active) . $modChats . ") AND `chat_id` > 0 ORDER BY `chat_id` DESC;");
    while($row = DBManager::FetchArray($result))
    {
        $vc = new VisitorChat($row);
        $xml .= $vc->GetChatXML($row["visitor_id"]) . "\r\n";
        Server::$Chats[$vc->ChatId] = $vc;

        $dut_active = max($vc->LastActive,$dut_active);

		if(strpos($modChats,$vc->ChatId)!==false)
		{
            $cp = Chat::GetPostsOfChat($vc->ChatId);
    	    $xml .= "<pc cid=\"".base64_encode($vc->ChatId)."\">".To::XMLTags($cp)."</pc>";
		}
        $counta++;
    }

    // closed
    $result = DBManager::Execute(true, "SELECT * FROM `".DB_PREFIX.DATABASE_VISITOR_CHATS."` WHERE (`exit` >= " . intval($dut_closed) . ") AND `chat_id` > 0 ORDER BY `chat_id` DESC;");
    while($row = DBManager::FetchArray($result))
    {
        $vc = new VisitorChat($row);
        $xml .= $vc->GetChatXML($row["visitor_id"]) . "\r\n";
        Server::$Chats[$vc->ChatId] = $vc;
        $dut_closed = max($vc->Exit,$dut_closed);
        $countc++;
    }
    Server::$Response->Chats .= "<ext_cl duta=\"".base64_encode($dut_active-1)."\" dutc=\"".base64_encode($dut_closed-1)."\">" . $xml . "</ext_cl>";
}

function buildNewPosts()
{
	foreach(Chat::GetMyPosts(CALLER_SYSTEM_ID) as $post)
	{
		Server::$Response->Posts .= $post->GetXml();
	}
    $suXml = "";
    $suMaxUpdated = 0;
    if(!isset($_POST["p_lpsu"]))
        $_POST["p_lpsu"] = 0;

    if($result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_POSTS . "` WHERE (`received`=1 OR `noticed`=1) AND `updated` > ".intval($_POST["p_lpsu"])." AND `updated` < ".time()." AND `sender`='".DBManager::RealEscape(CALLER_SYSTEM_ID)."' ORDER BY `time` ASC, `micro` ASC;"))
        while($row = DBManager::FetchArray($result))
        {
            $suMaxUpdated = max($suMaxUpdated,$row["updated"]);
            $np = new Post($row);
            $suXml .= $np->GetStatusXml($row["received"]==1,$row["noticed"]==1);
        }

    if(!empty($suXml))
        Server::$Response->Posts .= "<psul u=\"" . base64_encode($suMaxUpdated). "\">" . $suXml . "</psul>";
}

function buildIntern()
{
	$builder = new InternalXMLBuilder(Server::$Operators[CALLER_SYSTEM_ID]);
	$builder->Generate();
	Server::$Response->Internals = $builder->XMLInternal;
	Server::$Response->Typing .= $builder->XMLTyping;
	//Server::$Response->InternalProfilePictures = $builder->XMLProfilePictures;
	//Server::$Response->InternalWebcamPictures = $builder->XMLWebcamPictures;
	Server::$Response->Groups = $builder->XMLGroups;
}

?>
