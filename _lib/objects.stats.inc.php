<?php
/****************************************************************************************
 * LiveZilla objects.stats.inc.php
 *
 * Copyright 2018 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 * Improper changes to this file may cause critical errors.
 ***************************************************************************************/

if (!defined("IN_LIVEZILLA"))
    die();

class StatisticProvider
{
    public $CurrentDay;
    public $CurrentMonth;
    public $CurrentYear;
    public static $Rendertimes;
    public static $DayItemAmount;
    public static $MaxUsersAmount;
    public static $Dereferrer;
    public static $AggregateDomains;
    public static $HiddenFilenames;
    public static $AllowedParameters;
    public static $TimeoutTrack;
    public static $Domains;
    public static $Blacklist;
    public static $SearchEngines;
    public static $RoundPrecision;
    public static $AllGoalsRequiredForConversion;
    public static $AutoUpdateTime = 3600;
    public static $StatisticKey;
    public static $Durations;
    public static $DrawChartImages;
    public static $UpdateInterval;
    public static $OpeningHours = 24;
    public static $GraphOverallWidth = 670;

    function __construct()
    {
        StatisticProvider::DefineConfiguration();
        $results = array();
        if (!empty(CacheManager::$ActiveManager) && CacheManager::$ActiveManager->GetData(DATA_CACHE_KEY_STATS, $results)) {
            if (isset($results["day"]) && $results["day"] == date("z")) {
                if (!empty($results["aggs_done"])) {
                    if (!empty($results["create_done"])) {
                        return;
                    }
                }
            }
        }

        $results["day"] = date("z");
        if ($this->CloseAggregations()) {
            $results["aggs_done"] = true;
            if ($this->CreateItems())
                $results["create_done"] = true;
        }

        if (!empty(CacheManager::$ActiveManager))
            CacheManager::$ActiveManager->SetData(DATA_CACHE_KEY_STATS, $results);
    }

    function CreateItems()
    {

        $this->CurrentDay = new StatisticDay(date("Y"), date("n"), date("j"), 0, 0);
        if ($this->CurrentDay->CreateReport)
            $this->CurrentDay->Save();

        $this->CurrentMonth = new StatisticMonth(date("Y"), date("n"), 0, 0, 0);
        if ($this->CurrentMonth->CreateReport)
            $this->CurrentMonth->Save();

        $this->CurrentYear = new StatisticYear(date("Y"), 0, 0, 0, 0);
        if ($this->CurrentYear->CreateReport)
            $this->CurrentYear->Save();

        return true;
    }

    function CloseAggregations()
    {
        if (date("G") == "0")
            return false;

        $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_STATS_AGGS . "` WHERE ((`day`<'" . DBManager::RealEscape(date("d")) . "' AND `month`='" . DBManager::RealEscape(date("n")) . "' AND `year`='" . DBManager::RealEscape(date("Y")) . "') OR (`year`<'" . DBManager::RealEscape(date("Y")) . "') OR (`month`<'" . DBManager::RealEscape(date("n")) . "')) AND (`aggregated`=0 OR `aggregated`>" . (time() - 300) . ") AND `month`>0 AND `day`>0 ORDER BY `year` ASC,`month` ASC,`day` ASC LIMIT 1;");
        if ($result)
            while ($row = DBManager::FetchArray($result)) {
                if (empty($row["aggregated"])) {
                    DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_STATS_AGGS . "` SET `aggregated`=" . time() . " WHERE `year`='" . $row["year"] . "' AND `month`='" . $row["month"] . "' AND `day`='" . $row["day"] . "' LIMIT 1;");
                    $time = mktime(1, 1, 1, $row["month"], $row["day"], $row["year"]);
                    $this->AggregateDay(date("Y", $time), date("n", $time), date("d", $time));
                }
                return false;
            }
        $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_STATS_AGGS . "` WHERE `month`>0 AND ((`year`='" . DBManager::RealEscape(date("Y")) . "' AND `month`<'" . DBManager::RealEscape(date("n")) . "') OR (`year`<'" . DBManager::RealEscape(date("Y")) . "')) AND (`aggregated`=0 OR `aggregated`>" . (time() - 300) . ") AND `day`=0 ORDER BY `year` ASC,`month` ASC LIMIT 1;");
        if ($result)
            while ($row = DBManager::FetchArray($result)) {
                if (empty($row["aggregated"])) {
                    DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_STATS_AGGS . "` SET `aggregated`=" . time() . " WHERE `year`=" . $row["year"] . " AND `month`=" . $row["month"] . " AND `day`=0 LIMIT 1;");
                    $this->AggregateMonth($row["year"], $row["month"]);
                }
                return false;
            }
        $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_STATS_AGGS . "` WHERE `year`>0 AND `year`<'" . date("Y") . "' AND `day`=0  AND `month`=0 AND (`aggregated`=0 OR `aggregated`>" . (time() - 300) . ") ORDER BY `year` ASC LIMIT 1;");
        if ($result)
            while ($row = DBManager::FetchArray($result)) {
                if (empty($row["aggregated"])) {
                    DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_STATS_AGGS . "` SET `aggregated`=" . time() . " WHERE `year`=" . $row["year"] . " AND `month`=0 AND `day`=0 LIMIT 1;");
                    $this->AggregateYear($row["year"]);
                }
                return false;
            }
        return true;
    }

    function AggregateYear($_year)
    {
        $year = new StatisticYear($_year, 0, 0, 0, 0);
        $year->Close();
    }

    function AggregateMonth($_year, $_month)
    {
        $month = new StatisticMonth($_year, $_month, 0, 0, 0);
        $month->Close();
    }

    function AggregateDay($_year, $_month, $_day)
    {
        $day = new StatisticDay($_year, $_month, $_day, 0, 0);
        $day->Close();
    }

    function ProcessAction($_actionType, $_params = null)
    {
        if ($this->CurrentDay == null)
            if ($_actionType != ST_ACTION_LOG_STATUS)
                $this->CreateItems();
        if ($_actionType == ST_ACTION_FORWARDED_CHAT)
            DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_STATS_AGGS . "` SET `chats_forwards`=`chats_forwards`+1 WHERE" . $this->CurrentDay->GetDateMatch(true, true, true) . ";");
        else if ($_actionType == ST_ACTION_INTERNAL_POST)
            DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_STATS_AGGS . "` SET `chats_posts_internal`=`chats_posts_internal`+1 WHERE" . $this->CurrentDay->GetDateMatch(true, true, true) . ";");
        else if ($_actionType == ST_ACTION_EXTERNAL_POST)
            DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_STATS_AGGS . "` SET `chats_posts_external`=`chats_posts_external`+1 WHERE" . $this->CurrentDay->GetDateMatch(true, true, true) . ";");
        else if ($_actionType == ST_ACTION_LOG_STATUS)
            $this->LogStatus($_params[0]);
        else if ($_actionType == ST_ACTION_LOG_CRAWLER_ACCESS)
            $this->LogCrawlerAccess($_params[0]);
        else if ($_actionType == ST_ACTION_GOAL)
            $this->MarkGoalReached($_params[0], $_params[1], $_params[2], $_params[3]);
    }

    function MarkGoalReached($_visitorId, $_goalId, $_firstVisit, $_queryId)
    {
        DBManager::Execute(true, "INSERT IGNORE INTO `" . DB_PREFIX . DATABASE_VISITOR_GOALS . "` (`visitor_id`,`goal_id`,`time`,`first_visit`,`query`) VALUES ('" . DBManager::RealEscape($_visitorId) . "','" . DBManager::RealEscape($_goalId) . "','" . time() . "','" . DBManager::RealEscape($_firstVisit) . "','" . DBManager::RealEscape($_queryId) . "');");
    }

    function LogCrawlerAccess($_crawlerId)
    {
        DBManager::Execute(true, "INSERT IGNORE INTO `" . DB_PREFIX . DATABASE_STATS_AGGS_CRAWLERS . "` (`year`,`month`,`day`,`crawler`) VALUES (" . $this->CurrentDay->GetSQLDateValues() . ",'" . DBManager::RealEscape($_crawlerId) . "');");
        DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_STATS_AGGS_CRAWLERS . "` SET `amount`=`amount`+1 WHERE `crawler`='" . DBManager::RealEscape($_crawlerId) . "' AND" . $this->CurrentDay->GetDateMatch() . ";");
    }

    function LogStatus($_user)
    {
        if (!$_user->AffectsStatistic())
            return;

        $minstate = $minuserstate = USER_STATUS_OFFLINE;
        foreach ($_user->Groups as $groupid) {
            $groupstate = USER_STATUS_OFFLINE;
            if (isset(Server::$Groups[$groupid]) && Server::$Groups[$groupid]->IsOpeningHour())
                foreach (Server::$Operators as $user)
                    if ($user->Status != USER_STATUS_OFFLINE && $user->AffectsStatistic() && in_array($groupid, $user->Groups))
                        $groupstate = min($groupstate, ((!in_array($groupid, $user->GroupsAway)) ? $user->Status : USER_STATUS_OFFLINE));

            $identities[$groupid] = $groupstate;
            $minstate = min($minstate, $groupstate);
            $minuserstate = min($minuserstate, ((!in_array($groupid, $_user->GroupsAway)) ? max($_user->Status, $groupstate) : USER_STATUS_OFFLINE));
        }

        $identities[$_user->SystemId] = $minuserstate;
        $identities[GROUP_EVERYONE_INTERN] = $minstate;
        foreach ($identities as $userid => $status) {
            $createHour = false;
            $result = DBManager::Execute(true, "SELECT `status`,`time`,`confirmed` FROM `" . DB_PREFIX . DATABASE_OPERATOR_STATUS . "` WHERE `internal_id`='" . DBManager::RealEscape($userid) . "' ORDER BY `confirmed` DESC LIMIT 1;");
            if ($result && $row = DBManager::FetchArray($result)) {
                if ($row["confirmed"] > time() - 30 && $row["status"] == $status) {
                    continue;
                }

                $openSpan = (date("H", $row["confirmed"]) == date("H", $row["time"]) && date("z", $row["time"]) == date("z") && date("m", $row["time"]) == date("m")); // open span when confirmed hour not next hour and same day and same month
                $closeSpan = $openSpan && $row["status"] == $status; // open and status matches current

                if (date("z", $row["time"]) > date("z") || (date("z", $row["time"]) == date("z") && date("H", $row["time"]) > date("H")))
                    return;

                if ($closeSpan && date("H", $row["time"]) == date("H")) {
                    DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_OPERATOR_STATUS . "` SET `confirmed`='" . DBManager::RealEscape(time()) . "' WHERE `internal_id`='" . DBManager::RealEscape($userid) . "' ORDER BY `time` DESC LIMIT 1;");
                } else if (date("i", $row["confirmed"]) >= 58) {
                    $time = mktime(date("H", $row["time"]) + 1, 0, 0, date("n", $row["time"]), date("d", $row["time"]), date("Y", $row["time"]));
                    DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_OPERATOR_STATUS . "` SET `confirmed`='" . DBManager::RealEscape($time) . "' WHERE `internal_id`='" . DBManager::RealEscape($userid) . "' ORDER BY `time` DESC LIMIT 1;");
                } else {
                    $createHour = true;
                }
            } else {
                $createHour = true;
            }

            if ($createHour) {
                if (date("i") <= 2) {
                    $time = mktime(date("H"), 0, 0, date("n"), date("d"), date("Y"));
                    DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_OPERATOR_STATUS . "` WHERE `internal_id`='" . DBManager::RealEscape($userid) . "' AND `time`=" . intval($time) . " LIMIT 1;");
                    DBManager::Execute(true, "INSERT IGNORE INTO `" . DB_PREFIX . DATABASE_OPERATOR_STATUS . "` (`time` ,`confirmed` ,`internal_id` ,`status`) VALUES ('" . DBManager::RealEscape($time) . "','" . DBManager::RealEscape(time()) . "','" . DBManager::RealEscape($userid) . "','" . DBManager::RealEscape($status) . "');");
                } else
                    DBManager::Execute(true, "INSERT IGNORE INTO `" . DB_PREFIX . DATABASE_OPERATOR_STATUS . "` (`time` ,`confirmed` ,`internal_id` ,`status`) VALUES ('" . DBManager::RealEscape(time() - 1) . "','" . DBManager::RealEscape(time()) . "','" . DBManager::RealEscape($userid) . "','" . DBManager::RealEscape($status) . "');");
            }
        }
    }

    function ResetData()
    {
        $tables = array(DATABASE_VISITOR_GOALS, DATABASE_VISITOR_DATA_CRAWLERS, DATABASE_VISITOR_DATA_BROWSERS, DATABASE_VISITOR_DATA_TITLES, DATABASE_VISITOR_DATA_PATHS, DATABASE_VISITOR_DATA_CITIES, DATABASE_VISITOR_DATA_REGIONS, DATABASE_VISITOR_DATA_ISPS, DATABASE_VISITOR_DATA_PAGES, DATABASE_VISITOR_DATA_DOMAINS, DATABASE_VISITOR_DATA_QUERIES, DATABASE_VISITOR_DATA_SYSTEMS, DATABASE_VISITOR_DATA_RESOLUTIONS);
        foreach ($tables as $table)
            DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . $table . "`;");
    }

    function ResetDays()
    {
        $tables = array(DATABASE_STATS_AGGS_FEEDBACKS, DATABASE_STATS_AGGS_EVENTS, DATABASE_STATS_AGGS_GOALS, DATABASE_STATS_AGGS_GOALS_QUERIES, DATABASE_STATS_AGGS_PAGES_ENTRANCE, DATABASE_STATS_AGGS_PAGES_EXIT, DATABASE_STATS_AGGS, DATABASE_STATS_AGGS_CRAWLERS, DATABASE_STATS_AGGS_AVAILABILITIES, DATABASE_STATS_AGGS_DOMAINS, DATABASE_STATS_AGGS_BROWSERS, DATABASE_STATS_AGGS_RESOLUTIONS, DATABASE_STATS_AGGS_COUNTRIES, DATABASE_STATS_AGGS_VISITS, DATABASE_STATS_AGGS_SYSTEMS, DATABASE_STATS_AGGS_LANGUAGES, DATABASE_STATS_AGGS_CITIES, DATABASE_STATS_AGGS_REGIONS, DATABASE_STATS_AGGS_ISPS, DATABASE_STATS_AGGS_QUERIES, DATABASE_STATS_AGGS_PAGES, DATABASE_STATS_AGGS_REFERRERS, DATABASE_STATS_AGGS_DURATIONS, DATABASE_STATS_AGGS_CHATS, DATABASE_STATS_AGGS_SEARCH_ENGINES, DATABASE_STATS_AGGS_VISITORS, DATABASE_STATS_AGGS_KNOWLEDGEBASE, DATABASE_STATS_AGGS_FEEDBACKS);
        foreach ($tables as $table)
            DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . $table . "`;");
    }

    function ResetAll()
    {
        $tables = array(DATABASE_VISITOR_BROWSERS, DATABASE_VISITOR_BROWSER_URLS, DATABASE_VISITORS, DATABASE_OPERATOR_STATUS, DATABASE_VISITOR_CHATS, DATABASE_VISITOR_CHAT_OPERATORS);
        foreach ($tables as $table)
            DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . $table . "`;");
        $this->ResetDays();
        $this->ResetData();
    }

    static function LogProcess($_process)
    {

    }

    static function SetExecutionPoint($_partId)
    {
        self::$Rendertimes[] = array($_partId, SystemTime::GetMicroTimeFloat(microtime()));
    }

    static function GetExecutionTime()
    {
        $parts = "(" . self::$Rendertimes[0][0] . ")";
        for ($int = 1; $int < count(self::$Rendertimes); $int++)
            $parts .= " | " . round(self::$Rendertimes[$int][1] - self::$Rendertimes[$int - 1][1], 3) . " (" . self::$Rendertimes[$int][0] . ")";
        return $parts;
    }

    static function DeleteHTMLReports()
    {
        if (!empty(Server::$Configuration->File["gl_st_ders"]) && is_numeric(Server::$Configuration->File["gl_st_derd"])) {
            foreach (array(STATISTIC_PERIOD_TYPE_MONTH, STATISTIC_PERIOD_TYPE_YEAR, STATISTIC_PERIOD_TYPE_DAY) as $type) {
                $files = IOStruct::ReadDirectory(PATH_STATS . $type, "");
                foreach ($files as $file) {
                    $mtime = @filemtime(PATH_STATS . $type . "/" . $file);
                    if (!empty($mtime) && $mtime < (time() - (86400 * Server::$Configuration->File["gl_st_derd"])))
                        @unlink(PATH_STATS . $type . "/" . $file);
                }
            }
            $tables = array(DATABASE_STATS_AGGS_GOALS, DATABASE_STATS_AGGS_GOALS_QUERIES, DATABASE_STATS_AGGS_PAGES_ENTRANCE, DATABASE_STATS_AGGS_PAGES_EXIT, DATABASE_STATS_AGGS_CRAWLERS, DATABASE_STATS_AGGS_DOMAINS, DATABASE_STATS_AGGS_BROWSERS, DATABASE_STATS_AGGS_RESOLUTIONS, DATABASE_STATS_AGGS_COUNTRIES, DATABASE_STATS_AGGS_VISITS, DATABASE_STATS_AGGS_SYSTEMS, DATABASE_STATS_AGGS_LANGUAGES, DATABASE_STATS_AGGS_CITIES, DATABASE_STATS_AGGS_REGIONS, DATABASE_STATS_AGGS_ISPS, DATABASE_STATS_AGGS_QUERIES, DATABASE_STATS_AGGS_PAGES, DATABASE_STATS_AGGS_REFERRERS, DATABASE_STATS_AGGS_AVAILABILITIES, DATABASE_STATS_AGGS_DURATIONS, DATABASE_STATS_AGGS_CHATS, DATABASE_STATS_AGGS_SEARCH_ENGINES, DATABASE_STATS_AGGS_VISITORS);
            $result = DBManager::Execute(true, "SELECT `year`,`month`,`day` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS . "` WHERE `year`<" . date("Y") . " AND `aggregated`>0 AND `time`<" . (time() - (86400 * Server::$Configuration->File["gl_st_derd"])) . " LIMIT 1;");
            if ($result)
                if ($row = DBManager::FetchArray($result)) {
                    foreach ($tables as $table)
                        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . $table . "` WHERE `year`<" . date("Y") . " AND `day`=" . $row["day"] . " AND `month`=" . $row["month"] . " AND `year`=" . $row["year"]);
                    DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_STATS_AGGS . "` WHERE `year`<" . date("Y") . " AND `aggregated`>0 AND `day`=" . $row["day"] . " AND `month`=" . $row["month"] . " AND `year`=" . $row["year"] . " LIMIT 1;");
                }
        }
    }

    static function DefineConfiguration()
    {
        StatisticProvider::$DayItemAmount = 25;//Server::$Configuration->File["gl_st_toam"];
        StatisticProvider::$MaxUsersAmount = Server::$Configuration->File["gl_st_muvl"];
        StatisticProvider::$Dereferrer = "http://dereferrer.livezilla.info/?url=";//Server::$Configuration->File["gl_st_dere"];
        StatisticProvider::$AggregateDomains = false;//!empty(Server::$Configuration->File["gl_st_agdo"]);
        StatisticProvider::$HiddenFilenames = explode(",", "index.php,index.htm,index.html,home.html,index.asp");//explode(",",Server::$Configuration->File["gl_st_hifi"]);
        StatisticProvider::$AllowedParameters = explode(",", "id,module,area,product,category,article");//explode(",",Server::$Configuration->File["gl_st_getp"]);
        StatisticProvider::$UpdateInterval = isset(Server::$Configuration->File["gl_st_upinh"]) ? abs(Server::$Configuration->File["gl_st_upinh"]) : 6;
        StatisticProvider::$UpdateInterval = max(1, StatisticProvider::$UpdateInterval);
        StatisticProvider::$UpdateInterval *= (60 * 60);
        StatisticProvider::$TimeoutTrack = Server::$Configuration->File["timeout_track"];
        StatisticProvider::$RoundPrecision = 2;//Server::$Configuration->File["gl_st_ropr"];
        StatisticProvider::$AllGoalsRequiredForConversion = false;//Server::$Configuration->File["gl_st_atrc"];
        StatisticProvider::$StatisticKey = substr(md5(Server::$Configuration->File["gl_lzid"]), 0, 12);
        StatisticProvider::$Durations = array(1 => "00 - 01 min", 2 => "01 - 05 min", 3 => "05 - 10 min", 4 => "10 - 15 min", 5 => "15 - 30 min", 6 => "30 - 60 min", 7 => "> 60 min");
        StatisticProvider::$DrawChartImages = true;//!empty(Server::$Configuration->File["gl_st_drch"]);
    }

    static function GetReportFromHash($_hash, $_year, $_month, $_day, $_users)
    {
        if (is_numeric($_year) && is_numeric($_month) && is_numeric($_day)) {
            $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_STATS_AGGS . "` WHERE `day`='" . DBManager::RealEscape($_day) . "' AND `month`='" . DBManager::RealEscape($_month) . "' AND `year`='" . DBManager::RealEscape($_year) . "' LIMIT 1;");
            while ($row = DBManager::FetchArray($result)) {
                if ($row["month"] == 0)
                    $report = new StatisticYear($row["year"], 0, 0, $row["aggregated"], $row["mtime"]);
                else if ($row["day"] == 0)
                    $report = new StatisticMonth($row["year"], $row["month"], 0, $row["aggregated"], $row["mtime"]);
                else
                    $report = new StatisticDay($row["year"], $row["month"], $row["day"], $row["aggregated"], $row["mtime"]);

                if ($report->GetHash() == $_hash && @file_exists($report->GetFilename(true, $_users))) {
                    return $report->GetReportHTML($_users);
                }
            }
        }
        return false;
    }

    static function GetDynamicDateFrame($_t)
    {
        return "<script>document.write(new Date(" . date("Y", $_t) . "," . (date("n", $_t) - 1) . "," . date("j", $_t) . "," . date("G", $_t) . ", " . date("i", $_t) . ", " . date("s", $_t) . ", 0).toLocaleDateString());</script>";
    }
}


class StatisticMonth extends StatisticPeriod
{
    function __construct($_year, $_month, $_day, $_aggregated, $_microtime)
    {
        parent::__construct($_year, $_month, $_day, $_aggregated, $_microtime);
        $this->DayCount = date("t", strtotime($_year . "-" . $_month . "-01"));
        $this->Type = STATISTIC_PERIOD_TYPE_MONTH;
        $this->StartTime = mktime(0, 0, 0, $_month, 1, $_year);
        $this->EndTime = strtotime("-1 second", strtotime("+1 month", strtotime($_month . "/01/" . $_year . " 00:00:00")));
        $this->Delimiters = array($this->StartTime, $this->EndTime);
        $this->DefineConfiguration();
        $this->Closed = ($_month != date("n"));
    }

    function DefineConfiguration()
    {
        $this->CreateReport = true;//!empty(Server::$Configuration->File["gl_st_marp"]);
        $this->IncludeBHVisitors = true;//!empty(Server::$Configuration->File["gl_st_mbhv"]);
        $this->IncludeBHChats = true;//!empty(Server::$Configuration->File["gl_st_mbhc"]);
        $this->IncludeBDVisitors = true;//!empty(Server::$Configuration->File["gl_st_mbdv"]);
        $this->IncludeBDChats = true;//!empty(Server::$Configuration->File["gl_st_mbdc"]);
        $this->IncludeTOPSystems = true;//!empty(Server::$Configuration->File["gl_st_mtsy"]);
        $this->IncludeTOPOrigins = true;//!empty(Server::$Configuration->File["gl_st_mtor"]);
        $this->IncludeTOPVisits = true;//!empty(Server::$Configuration->File["gl_st_mtvi"]);
        $this->IncludeTOPISPs = true;//!empty(Server::$Configuration->File["gl_st_mtis"]);
        $this->IncludeTOPPages = true;//!empty(Server::$Configuration->File["gl_st_mtpa"]);
        $this->IncludeTOPEntranceExit = true;//!empty(Server::$Configuration->File["gl_st_mtee"]);
        $this->IncludeTOPSearch = true;//!empty(Server::$Configuration->File["gl_st_mtse"]);
        $this->IncludeTOPReferrers = true;//!empty(Server::$Configuration->File["gl_st_mtre"]);
        $this->IncludeTOPKnowledgebase = true;//!empty(Server::$Configuration->File["gl_st_mtkb"]);
        $this->IncludeTOPDomains = true;//!empty(Server::$Configuration->File["gl_st_mtdo"]);
        $this->IncludeBOAvailability = true;//!empty(Server::$Configuration->File["gl_st_mboa"]);
        $this->IncludeBOChats = true;//!empty(Server::$Configuration->File["gl_st_mboc"]);
        $this->IncludeBOTickets = true;//!empty(Server::$Configuration->File["gl_st_mbot"]);
        $this->IncludeBOInvites = true;//!empty(Server::$Configuration->File["gl_st_mboi"]);
        $this->IncludeBOFeedbacks = true;//!empty(Server::$Configuration->File["gl_st_mbof"]);
    }

    function Load()
    {
        if (date("Y") == $this->Year && date("n") < $this->Month)
            return false;

        if ($this->Type == STATISTIC_PERIOD_TYPE_MONTH) {
            $result = DBManager::Execute(true, "SELECT SUM(`on_chat_page`) AS `spages`,SUM(`browser_instances`) AS `bi`,SUM(`from_referrer`) AS `ref`,SUM(`search_engine`) AS `se`,SUM(`bounces`) AS `bounc`,SUM(`page_impressions`) AS `pi`,SUM(`visitors_unique`) AS `cvunique`,SUM(`js`) AS `json`,SUM(`visitors_recurring`) AS `rec` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_VISITORS . "` WHERE" . $this->GetDateMatch(true, true, false) . ";");
            $row = DBManager::FetchArray($result);
            $this->VisitorsTotal = (!empty($row["cvunique"])) ? $row["cvunique"] : 0;
            $this->ChatPagesTotal = (!empty($row["spages"])) ? $row["spages"] : 0;
            $this->JavascriptTotal = $row["json"];
            $this->VisitorsRecurringTotal = $row["rec"];
            $this->PageImpressionsTotal = ((!empty($row["pi"])) ? $row["pi"] : 0) - $this->ChatPagesTotal;
            $this->VisitorBouncesTotal = $row["bounc"];
            $this->FromSearchEngineTotal = $row["se"];
            $this->FromReferrerTotal = $row["ref"];
            $this->BrowserInstancesTotal = $row["bi"];
        }
        return parent::Load();
    }

    function LoadDays()
    {
        for ($i = 0; $i < $this->DayCount; $i++) {
            $time = $this->StartTime + ($i * 86400);
            $day = date("d", $time);
            if (!isset($this->Days[$day])) {
                $this->Days[$day] = new StatisticDay(date("Y", $time), date("n", $time), $day, 0, 0);
                if (date("Y", $time) == date("Y") && date("n", $time) == date("n") && $day == date("d")) {
                    $this->Days[$day]->SaveReportToFile();
                } else
                    $this->Days[$day]->Load();
            }
        }
        ksort($this->Days);
    }

    function GetHTML()
    {
        $html = parent::GetHTML();
        $month = ($this->Type == STATISTIC_PERIOD_TYPE_MONTH) ? $this->Month . " / " : "";
        $html = str_replace("<!--header_span_overview-->", $month . $this->Year, $html);
        return $html;
    }

    function Aggregate()
    {
        $_daySQL = " AND `day`>0 ";
        foreach (array($this->TopVisitorTables, $this->TopBrowserURLTables) as $tables)
            foreach ($tables as $table => $field)
                $this->AggregateValueCount(DB_PREFIX . $table, array($field), $_daySQL);

        $this->AggregateValueCount(DB_PREFIX . DATABASE_STATS_AGGS_QUERIES, array("query"), $_daySQL, true, " AND `type`=0");
        $this->AggregateValueCount(DB_PREFIX . DATABASE_STATS_AGGS_QUERIES, array("query"), $_daySQL, false, " AND `type`=1");
        $this->AggregateValueCount(DB_PREFIX . DATABASE_STATS_AGGS_CRAWLERS, array("crawler"), $_daySQL);
        $this->AggregateValueCount(DB_PREFIX . DATABASE_STATS_AGGS_GOALS, array("goal"), $_daySQL);
        $this->AggregateValueCount(DB_PREFIX . DATABASE_STATS_AGGS_GOALS_QUERIES, array("goal", "query"), $_daySQL);
        $this->AggregateValueCount(DB_PREFIX . DATABASE_STATS_AGGS_DOMAINS, array("domain"), $_daySQL);
        $this->AggregateSingleValues($_daySQL);
        $this->AggregateDurations($_daySQL);
    }

    function AggregateSingleValues($_daySQL)
    {
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_STATS_AGGS . "` WHERE" . $this->GetDateMatch() . ";");
        $result = DBManager::Execute(true, "SELECT SUM(`conversions`) AS `sconversions`,SUM(`sessions`) AS `svisitors`,SUM(`visitors_unique`) AS `uvisitors`,AVG(`avg_time_site`) AS `aavg_time_site`, SUM(`chats_posts_external`) AS `schats_posts_external`, SUM(`chats_posts_internal`) AS `schats_posts_internal`,SUM(`chats_forwards`) as `schats_forwards` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS . "` WHERE" . $this->GetDateMatch(true, get_class($this) == "StatisticMonth", false) . $_daySQL . ";");
        while ($row = DBManager::FetchArray($result)) {
            $time = SystemTime::GetMicroTime();
            DBManager::Execute(true, "INSERT IGNORE INTO `" . DB_PREFIX . DATABASE_STATS_AGGS . "` (`year`, `month`, `day`,`time`,`mtime`,`sessions`,`visitors_unique`,`conversions`,`aggregated`, `chats_forwards`, `chats_posts_internal`, `chats_posts_external`, `avg_time_site`) VALUES (" . $this->GetSQLDateValues() . "," . $time[1] . "," . $time[0] . ",'" . DBManager::RealEscape($row["svisitors"]) . "','" . DBManager::RealEscape($row["uvisitors"]) . "','" . DBManager::RealEscape($row["sconversions"]) . "','" . DBManager::RealEscape(($this->Closed) ? time() : 0) . "','" . DBManager::RealEscape($row["schats_forwards"]) . "','" . DBManager::RealEscape($row["schats_posts_internal"]) . "','" . DBManager::RealEscape($row["schats_posts_external"]) . "','" . DBManager::RealEscape($row["aavg_time_site"]) . "')");
        }
    }

    function AggregateDurations($_daySQL)
    {
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_DURATIONS . "` WHERE" . $this->GetDateMatch() . ";");
        $result = DBManager::Execute(true, "SELECT `duration`,SUM(`amount`) AS `samount` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_DURATIONS . "` WHERE" . $this->GetDateMatch(true, get_class($this) == "StatisticMonth", false) . $_daySQL . " GROUP BY `duration`;");
        while ($row = DBManager::FetchArray($result))
            DBManager::Execute(true, "INSERT IGNORE INTO `" . DB_PREFIX . DATABASE_STATS_AGGS_DURATIONS . "` ( `year` ,`month`,`day` ,`duration` ,`amount`) VALUES (" . $this->GetSQLDateValues() . ",'" . DBManager::RealEscape($row["duration"]) . "','" . DBManager::RealEscape($row["samount"]) . "')");
    }

    function AggregateValueCount($_table, $_fields, $_daySQL, $_clear = true, $_addWhere = "")
    {
        $field_a = $_fields[0];
        $field_b = (count($_fields) > 1) ? ",`" . $_fields[1] . "`" : "";
        if ($_clear)
            DBManager::Execute(true, "DELETE FROM `" . $_table . "` WHERE" . $this->GetDateMatch() . ";");

        if (DATABASE_STATS_AGGS_PAGES == $_table)
            $result = DBManager::Execute(true, "SELECT *,SUM(`amount`) AS `sumfield` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_PAGES . "` INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_PAGES . "` AS `t1` ON `" . DB_PREFIX . DATABASE_STATS_AGGS_PAGES . "`.`url`=`t1`.`id` INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_PATHS . "` AS `t2` ON `t1`.`path` = t2.`id` WHERE" . $this->GetDateMatch(true, get_class($this) == "StatisticMonth", false) . $_daySQL . " GROUP BY `t1`.`id` ORDER BY `sumfield` DESC,`t1`.`id` DESC");
        else
            $result = DBManager::Execute(true, "SELECT *,SUM(`amount`) AS `sumfield` FROM `" . $_table . "` WHERE" . $this->GetDateMatch(true, get_class($this) == "StatisticMonth", false) . $_daySQL . $_addWhere . " GROUP BY `" . $field_a . "`" . $field_b . " ORDER BY `sumfield` DESC;");

        $index = 0;
        while ($row = DBManager::FetchArray($result)) {
            if (count($_fields) == 2)
                $index = $row[$_fields[0]];
            if (!isset($count[$index]))
                $count[$index] = 0;

            if ($row["sumfield"] > 0 && $count[$index]++ < StatisticProvider::$DayItemAmount) {
                if (isset($row["type"]))
                    DBManager::Execute(true, "INSERT IGNORE INTO `" . $_table . "` (`year`,`month`,`day`,`" . $_fields[0] . "`,`amount`,`type`) VALUES (" . $this->GetSQLDateValues() . ",'" . DBManager::RealEscape($row[$_fields[0]]) . "','" . DBManager::RealEscape($row["sumfield"]) . "'," . intval($row["type"]) . ")");
                else if (count($_fields) == 1)
                    DBManager::Execute(true, "INSERT IGNORE INTO `" . $_table . "` (`year`,`month`,`day`,`" . $_fields[0] . "`,`amount`) VALUES (" . $this->GetSQLDateValues() . ",'" . DBManager::RealEscape($row[$_fields[0]]) . "','" . DBManager::RealEscape($row["sumfield"]) . "')");
                else
                    DBManager::Execute(true, "INSERT IGNORE INTO `" . $_table . "` (`year`,`month`,`day`,`" . $_fields[0] . "`,`" . $_fields[1] . "`,`amount`) VALUES (" . $this->GetSQLDateValues() . ",'" . DBManager::RealEscape($row[$_fields[0]]) . "','" . DBManager::RealEscape($row[$_fields[1]]) . "','" . DBManager::RealEscape($row["sumfield"]) . "')");
            }
        }
    }
}

class StatisticYear extends StatisticMonth
{
    function __construct($_year, $_month, $_day, $_aggregated, $_microtime)
    {
        parent::__construct($_year, $_month, $_day, $_aggregated, $_microtime);
        $this->DayCount = date("z", mktime(0, 0, 0, 12, 31, $_year)) + 1;
        $this->Type = STATISTIC_PERIOD_TYPE_YEAR;
        $this->StartTime = mktime(0, 0, 0, 1, 1, $_year);
        $this->EndTime = strtotime("12/31/" . $_year . " 23:59:59");
        $this->Delimiters = array($this->StartTime, $this->EndTime);
        $this->Closed = ($_year != date("Y"));
        $this->DefineConfiguration();
    }

    function DefineConfiguration()
    {
        $this->CreateReport = true;//!empty(Server::$Configuration->File["gl_st_yarp"]);
        $this->IncludeBHVisitors = true;//!empty(Server::$Configuration->File["gl_st_ybhv"]);
        $this->IncludeBHChats = true;//!empty(Server::$Configuration->File["gl_st_ybhc"]);
        $this->IncludeBMVisitors = true;//!empty(Server::$Configuration->File["gl_st_ybmv"]);
        $this->IncludeBMChats = true;//!empty(Server::$Configuration->File["gl_st_ybmc"]);
        $this->IncludeTOPSystems = true;//!empty(Server::$Configuration->File["gl_st_ytsy"]);
        $this->IncludeTOPOrigins = true;//!empty(Server::$Configuration->File["gl_st_ytor"]);
        $this->IncludeTOPVisits = true;//!empty(Server::$Configuration->File["gl_st_ytvi"]);
        $this->IncludeTOPISPs = true;//!empty(Server::$Configuration->File["gl_st_ytis"]);
        $this->IncludeTOPPages = true;//!empty(Server::$Configuration->File["gl_st_ytpa"]);
        $this->IncludeTOPEntranceExit = true;//!empty(Server::$Configuration->File["gl_st_ytee"]);
        $this->IncludeTOPSearch = true;//!empty(Server::$Configuration->File["gl_st_ytse"]);
        $this->IncludeTOPReferrers = true;//!empty(Server::$Configuration->File["gl_st_ytre"]);
        $this->IncludeTOPKnowledgebase = true;//!empty(Server::$Configuration->File["gl_st_ytkb"]);
        $this->IncludeTOPDomains = true;//!empty(Server::$Configuration->File["gl_st_ytdo"]);
        $this->IncludeBOAvailability = true;//!empty(Server::$Configuration->File["gl_st_yboa"]);
        $this->IncludeBOChats = true;//!empty(Server::$Configuration->File["gl_st_yboc"]);
        $this->IncludeBOTickets = true;//!empty(Server::$Configuration->File["gl_st_ybot"]);
        $this->IncludeBOInvites = true;//!empty(Server::$Configuration->File["gl_st_yboi"]);
        $this->IncludeBOFeedbacks = true;//!empty(Server::$Configuration->File["gl_st_ybof"]);
    }

    function Load()
    {
        $result = DBManager::Execute(true, "SELECT SUM(`on_chat_page`) AS `spages`,SUM(`browser_instances`) AS `bi`,SUM(`from_referrer`) AS `ref`,SUM(`search_engine`) AS `se`,SUM(`bounces`) AS `bounc`,SUM(`page_impressions`) AS `pi`,SUM(`visitors_unique`) AS `cvunique`,SUM(`js`) AS `json`,SUM(`visitors_recurring`) AS `rec` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_VISITORS . "` WHERE" . $this->GetDateMatch(true, false, false) . ";");
        $row = DBManager::FetchArray($result);
        $this->VisitorsTotal = (!empty($row["cvunique"])) ? $row["cvunique"] : 0;
        $this->ChatPagesTotal = (!empty($row["spages"])) ? $row["spages"] : 0;
        $this->JavascriptTotal = $row["json"];
        $this->VisitorsRecurringTotal = $row["rec"];
        $this->PageImpressionsTotal = ((!empty($row["pi"])) ? $row["pi"] : 0) - $this->ChatPagesTotal;
        $this->VisitorBouncesTotal = $row["bounc"];
        $this->FromSearchEngineTotal = $row["se"];
        $this->FromReferrerTotal = $row["ref"];
        $this->BrowserInstancesTotal = $row["bi"];
        return parent::Load();
    }

    function LoadMonths()
    {
        for ($i = 1; $i <= 12; $i++) {
            $time = mktime(0, 0, 0, $i, 1, $this->Year);
            $this->Months[$i] = new StatisticMonth(date("Y", $time), $i, 0, 0, 0);
            if (date("Y", $time) == date("Y") && date("n", $time) == date("n"))
                $this->Months[$i]->SaveReportToFile();
            else
                $this->Months[$i]->Load();
        }
        ksort($this->Months);
    }

    function GetHTML()
    {
        $html = parent::GetHTML();
        $html = str_replace("<!--header_span_overview-->", $this->Year, $html);
        return $html;
    }

    function Aggregate()
    {
        $_daySQL = " AND `month`>0 AND `day`=0 ";
        foreach (array($this->TopVisitorTables, $this->TopBrowserURLTables) as $tables)
            foreach ($tables as $table => $field)
                $this->AggregateValueCount(DB_PREFIX . $table, array($field), $_daySQL);

        $this->AggregateValueCount(DB_PREFIX . DATABASE_STATS_AGGS_QUERIES, array("query"), $_daySQL, true, " AND `type`=0");
        $this->AggregateValueCount(DB_PREFIX . DATABASE_STATS_AGGS_QUERIES, array("query"), $_daySQL, false, " AND `type`=1");
        $this->AggregateValueCount(DB_PREFIX . DATABASE_STATS_AGGS_CRAWLERS, array("crawler"), $_daySQL);
        $this->AggregateValueCount(DB_PREFIX . DATABASE_STATS_AGGS_GOALS, array("goal"), $_daySQL);
        $this->AggregateValueCount(DB_PREFIX . DATABASE_STATS_AGGS_GOALS_QUERIES, array("goal", "query"), $_daySQL);
        $this->AggregateValueCount(DB_PREFIX . DATABASE_STATS_AGGS_DOMAINS, array("domain"), $_daySQL);
        $this->AggregateSingleValues($_daySQL);
        $this->AggregateDurations($_daySQL);
    }
}

class StatisticDay extends StatisticPeriod
{
    function __construct()
    {
        $this->Type = STATISTIC_PERIOD_TYPE_DAY;
        $this->DayCount = 1;
        if (func_num_args() >= 3) {
            $year = func_get_arg(0);
            $months = func_get_arg(1);
            $day = func_get_arg(2);
            $aggregated = func_get_arg(3);
            $microtime = func_get_arg(4);
            parent::__construct($year, $months, $day, $aggregated, $microtime);
            $this->Delimiters = array(mktime(0, 0, 0, $this->Month, $this->Day, $this->Year), mktime(23, 59, 59, $this->Month, $this->Day, $this->Year));
            if ($day != date("d"))
                $this->Closed = true;
        } else {
            $time = func_get_arg(0);
            parent::__construct(date("Y", $time), date("n", $time), date("d", $time), 0, 0);
        }
        $this->DefineConfiguration();
    }

    function DefineConfiguration()
    {
        $this->CreateReport = true;//!empty(Server::$Configuration->File["gl_st_darp"]);
        $this->CreateVisitorList = true;//!empty(Server::$Configuration->File["gl_st_davl"]);
        $this->IncludeBHVisitors = true;//!empty(Server::$Configuration->File["gl_st_dbhv"]);
        $this->IncludeBHChats = true;//!empty(Server::$Configuration->File["gl_st_dbhc"]);
        $this->IncludeTOPSystems = true;//!empty(Server::$Configuration->File["gl_st_dtsy"]);
        $this->IncludeTOPOrigins = true;//!empty(Server::$Configuration->File["gl_st_dtor"]);
        $this->IncludeTOPVisits = true;//!empty(Server::$Configuration->File["gl_st_dtvi"]);
        $this->IncludeTOPISPs = true;//!empty(Server::$Configuration->File["gl_st_dtis"]);
        $this->IncludeTOPPages = true;//!empty(Server::$Configuration->File["gl_st_dtpa"]);
        $this->IncludeTOPEntranceExit = true;//!empty(Server::$Configuration->File["gl_st_dtee"]);
        $this->IncludeTOPSearch = true;//!empty(Server::$Configuration->File["gl_st_dtse"]);
        $this->IncludeTOPReferrers = true;//!empty(Server::$Configuration->File["gl_st_dtre"]);
        $this->IncludeTOPKnowledgebase = true;//!empty(Server::$Configuration->File["gl_st_dtkb"]);
        $this->IncludeTOPDomains = true;//!empty(Server::$Configuration->File["gl_st_dtdo"]);
        $this->IncludeBOAvailability = true;//!empty(Server::$Configuration->File["gl_st_dboa"]);
        $this->IncludeBOChats = true;//!empty(Server::$Configuration->File["gl_st_dboc"]);
        $this->IncludeBOTickets = true;//!empty(Server::$Configuration->File["gl_st_dbot"]);
        $this->IncludeBOInvites = true;//!empty(Server::$Configuration->File["gl_st_dboi"]);
        $this->IncludeBOFeedbacks = true;//!empty(Server::$Configuration->File["gl_st_dbof"]);
    }

    function Load()
    {
        $row = DBManager::FetchArray(DBManager::Execute(true, "SELECT SUM(`on_chat_page`) AS `spages`,SUM(`browser_instances`) AS `bi`,SUM(`from_referrer`) AS `ref`,SUM(`search_engine`) AS `se`,SUM(`bounces`) AS `bounc`,SUM(`page_impressions`) AS `pi`,SUM(`visitors_unique`) AS `cvunique`,SUM(`js`) AS `json`,SUM(`visitors_recurring`) AS `rec` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_VISITORS . "` WHERE" . $this->GetDateMatch() . ";"));
        $this->VisitorsTotal = (!empty($row["cvunique"])) ? $row["cvunique"] : 0;
        $this->ChatPagesTotal = (!empty($row["spages"])) ? $row["spages"] : 0;
        $this->JavascriptTotal = $row["json"];
        $this->VisitorsRecurringTotal = $row["rec"];
        $this->PageImpressionsTotal = ((!empty($row["pi"])) ? $row["pi"] : 0) - $this->ChatPagesTotal;
        $this->VisitorBouncesTotal = $row["bounc"];
        $this->FromSearchEngineTotal = $row["se"];
        $this->FromReferrerTotal = $row["ref"];
        $this->BrowserInstancesTotal = $row["bi"];
        return parent::Load();
    }

    function GetVisitorsHTML()
    {
        $html = parent::GetVisitorsHTML();
        $html = str_replace("<!--header_span_overview-->", StatisticProvider::GetDynamicDateFrame(mktime(0, 0, 0, $this->Month, $this->Day, $this->Year)), $html);
        return $html;
    }

    function GetHTML()
    {
        $html = parent::GetHTML();
        $html = str_replace("<!--header_span_overview-->", StatisticProvider::GetDynamicDateFrame(mktime(0, 0, 0, $this->Month, $this->Day, $this->Year)), $html);
        return $html;
    }

    function PrepareTicketHourArray(&$_array, $_userId, $_hour)
    {
        if (!isset($_array[$_userId]))
            $_array[$_userId] = array();
        if (!isset($_array[$_userId][$_hour]))
            $_array[$_userId][$_hour] = array("amount" => 0, "open" => 0, "closed" => 0, "close_time" => 0, "overdue" => 0, "deleted" => 0, "messages" => 0, "responses" => 0, "response_time" => 0, "resolves" => 0, "resolve_time" => 0, "email_in" => 0, "email_converted" => 0, "email_out" => 0, "facebook_in" => 0, "facebook_out" => 0, "twitter_in" => 0, "twitter_out" => 0, "source_email" => 0, "source_phone" => 0, "source_misc" => 0, "source_chat" => 0, "source_feedback" => 0, "source_facebook" => 0, "source_twitter" => 0);
    }

    function Aggregate()
    {
        $this->AggregateSingleValues("");
        $this->AggregateOperatorTime("");
        $this->AggregateDurations("");
        $this->AggregateChats();
        $this->AggregateTickets();
        $this->AggregateFeedbacks();
        $this->AggregateTOPS();
        $this->AggregateKnowledgebase();
    }

    function AggregateTOPS()
    {
        foreach ($this->TopVisitorTables as $table => $field)
            $this->AggregateValueCount(DB_PREFIX . $table, DB_PREFIX . DATABASE_VISITORS, $field, "entrance", true);

        $this->AggregateValueCount(DB_PREFIX . DATABASE_STATS_AGGS_QUERIES, DB_PREFIX . DATABASE_VISITOR_BROWSERS, "query", "last_active");
        $this->AggregateDayPageCount(DB_PREFIX . DATABASE_STATS_AGGS_DOMAINS, "domain", "`t1`.`domain`", "`t1`.`domain`");
        $this->AggregateDayPageCount(DB_PREFIX . DATABASE_STATS_AGGS_PAGES, "url", "`" . DB_PREFIX . "visitor_browser_urls`.`url`", ((StatisticProvider::$AggregateDomains) ? "`t1`.`path`" : "`" . DB_PREFIX . "visitor_browser_urls`.`url`"));
        $this->AggregateDayEntranceExitPageCount(DB_PREFIX . DATABASE_STATS_AGGS_PAGES_ENTRANCE, false, ",`t1`.`domain`");
        $this->AggregateDayEntranceExitPageCount(DB_PREFIX . DATABASE_STATS_AGGS_PAGES_EXIT, true, ",`t1`.`domain`");
        $this->AggregateDayReferrerCount(DB_PREFIX . DATABASE_STATS_AGGS_REFERRERS);
        $this->AggregateDaySearchEngineCount(DB_PREFIX . DATABASE_STATS_AGGS_SEARCH_ENGINES);
        $this->AggregateDayTags();
        $this->AggregateDayGoals();
        $this->AggregateDayEvents();
    }

    function AggregateSingleValues()
    {
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_VISITORS . "` WHERE" . $this->GetDateMatch() . ";");
        $row = DBManager::FetchArray(DBManager::Execute(true, "SELECT COUNT(DISTINCT(`id`)) `uvisitors` FROM `" . DB_PREFIX . DATABASE_VISITORS . "` WHERE `entrance`>=" . DBManager::RealEscape($this->Delimiters[0]) . " AND `entrance`<=" . DBManager::RealEscape($this->Delimiters[1]) . ";"));
        $this->VisitorsUnique = $row["uvisitors"];

        for ($i = 0; $i < 24; $i++) {
            $hour_delimiters = array(mktime($i, 0, 0, $this->Month, $this->Day, $this->Year), mktime($i, 59, 59, $this->Month, $this->Day, $this->Year));
            $row = DBManager::FetchArray(DBManager::Execute(true, "SELECT COUNT(`id`) as `cvunique`,(SELECT COUNT(DISTINCT(`id`)) FROM `" . DB_PREFIX . DATABASE_VISITORS . "` WHERE `js`=0 AND `entrance`>=" . DBManager::RealEscape($hour_delimiters[0]) . " AND `entrance`<=" . DBManager::RealEscape($hour_delimiters[1]) . ") as `json` FROM `" . DB_PREFIX . DATABASE_VISITORS . "` WHERE `entrance`>=" . DBManager::RealEscape($hour_delimiters[0]) . " AND `entrance`<=" . DBManager::RealEscape($hour_delimiters[1]) . ";"));

            $this->VisitorsUniqueHour = $row["cvunique"];
            $this->JavascriptHour = $row["cvunique"] - $row["json"];

            $row = DBManager::FetchArray(DBManager::Execute(true, "SELECT COUNT(`id`) as `cvrec` FROM `" . DB_PREFIX . DATABASE_VISITORS . "` WHERE `visits`>1 AND `entrance`>=" . DBManager::RealEscape($hour_delimiters[0]) . " AND `entrance`<=" . DBManager::RealEscape($hour_delimiters[1]) . ";"));
            $this->VisitorsRecurringHour = $row["cvrec"];

            $row = DBManager::FetchArray(DBManager::Execute(true, "SELECT COUNT(`device`) AS `count_tablet`  FROM `" . DB_PREFIX . DATABASE_VISITORS . "` WHERE `device`=1 AND `entrance`>=" . DBManager::RealEscape($hour_delimiters[0]) . " AND `entrance`<=" . DBManager::RealEscape($hour_delimiters[1]) . ";"));
            $this->DeviceTabletHour = $row["count_tablet"];

            $row = DBManager::FetchArray(DBManager::Execute(true, "SELECT COUNT(`device`) AS `count_mobile`  FROM `" . DB_PREFIX . DATABASE_VISITORS . "` WHERE `device`=2 AND `entrance`>=" . DBManager::RealEscape($hour_delimiters[0]) . " AND `entrance`<=" . DBManager::RealEscape($hour_delimiters[1]) . ";"));
            $this->DeviceMobileHour = $row["count_mobile"];

            $row = DBManager::FetchArray(DBManager::Execute(true, "SELECT COUNT(`browser_id`) as `urls` FROM `" . DB_PREFIX . DATABASE_VISITOR_BROWSER_URLS . "` INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_PAGES . "` AS `t1` ON `" . DB_PREFIX . DATABASE_VISITOR_BROWSER_URLS . "`.`url`=`t1`.`id` INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_DOMAINS . "` AS `t2` ON `t1`.`domain` = `t2`.`id` WHERE `t2`.`search`=0 AND `t2`.`external`=0 AND `entrance`>=" . DBManager::RealEscape($hour_delimiters[0]) . " AND `entrance`<=" . DBManager::RealEscape($hour_delimiters[1]) . ";"));
            $this->PageImpressionsHour = $row["urls"];

            $row = DBManager::FetchArray(DBManager::Execute(true, "SELECT COUNT(`id`) as `browsers`,(SELECT COUNT(`id`) FROM `" . DB_PREFIX . DATABASE_VISITOR_BROWSERS . "` WHERE is_chat=1 AND `created`>=" . DBManager::RealEscape($hour_delimiters[0]) . " AND `created`<=" . DBManager::RealEscape($hour_delimiters[1]) . ") as cpages FROM `" . DB_PREFIX . DATABASE_VISITOR_BROWSERS . "` WHERE `created`>=" . DBManager::RealEscape($hour_delimiters[0]) . " AND `overlay`=0 AND `created`<=" . DBManager::RealEscape($hour_delimiters[1]) . ";"));
            $this->BrowserInstancesHour = $row["browsers"];
            $this->ChatPagesHour = $row["cpages"];
            $this->VisitorBouncesHour = DBManager::GetRowCount(DBManager::Execute(true, "SELECT COUNT(`visitor_id`) as `bvisitors` FROM `" . DB_PREFIX . DATABASE_VISITORS . "` INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_BROWSERS . "` ON `" . DB_PREFIX . DATABASE_VISITORS . "`.`id`=`" . DB_PREFIX . DATABASE_VISITOR_BROWSERS . "`.`visitor_id` INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_BROWSER_URLS . "` ON `" . DB_PREFIX . DATABASE_VISITOR_BROWSERS . "`.`id`=`" . DB_PREFIX . DATABASE_VISITOR_BROWSER_URLS . "`.`browser_id` WHERE `" . DB_PREFIX . DATABASE_VISITOR_BROWSERS . "`.`overlay`=0 AND `" . DB_PREFIX . DATABASE_VISITORS . "`.`closed` > 0 AND `" . DB_PREFIX . DATABASE_VISITORS . "`.`entrance`>=" . DBManager::RealEscape($hour_delimiters[0]) . " AND `" . DB_PREFIX . DATABASE_VISITORS . "`.`entrance`<=" . DBManager::RealEscape($hour_delimiters[1]) . " GROUP BY `visitor_id` HAVING `bvisitors`=1;"));

            $row = DBManager::FetchArray(DBManager::Execute(true, "SELECT COUNT(*) AS `fseh` FROM `" . DB_PREFIX . DATABASE_VISITOR_BROWSER_URLS . "`  INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_PAGES . "` AS `t1` ON `" . DB_PREFIX . DATABASE_VISITOR_BROWSER_URLS . "`.`referrer`=`t1`.`id` INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_DOMAINS . "` AS `t2` ON `t1`.`domain` = `t2`.`id` WHERE `t2`.`search`=1 AND `t2`.`external`=1 AND `" . DB_PREFIX . DATABASE_VISITOR_BROWSER_URLS . "`.`entrance`>=" . DBManager::RealEscape($hour_delimiters[0]) . " AND `" . DB_PREFIX . DATABASE_VISITOR_BROWSER_URLS . "`.`entrance`<=" . DBManager::RealEscape($hour_delimiters[1]) . " AND `t2`.`domain`!='';"));
            $this->FromSearchEngineHour = $row["fseh"];

            $row = DBManager::FetchArray(DBManager::Execute(true, "SELECT COUNT(*) AS `frh` FROM `" . DB_PREFIX . DATABASE_VISITOR_BROWSER_URLS . "`  INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_PAGES . "` AS `t1` ON `" . DB_PREFIX . DATABASE_VISITOR_BROWSER_URLS . "`.`referrer`=`t1`.`id` INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_DOMAINS . "` AS `t2` ON `t1`.`domain` = `t2`.`id` WHERE `t2`.`search`=0 AND `t2`.`external`=1 AND `" . DB_PREFIX . DATABASE_VISITOR_BROWSER_URLS . "`.`entrance`>=" . DBManager::RealEscape($hour_delimiters[0]) . " AND `" . DB_PREFIX . DATABASE_VISITOR_BROWSER_URLS . "`.`entrance`<=" . DBManager::RealEscape($hour_delimiters[1]) . " AND `t2`.`domain`!='';"));
            $this->FromReferrerHour = $row["frh"];

            $conversionQuery = "SELECT COUNT(*) AS `conversions` FROM `" . DB_PREFIX . DATABASE_VISITOR_GOALS . "` as `dbvg` INNER JOIN `" . DB_PREFIX . DATABASE_GOALS . "` AS `dbg` ON `dbvg`.`goal_id`=`dbg`.`id` WHERE `dbg`.`conversion`=1 AND `dbvg`.`time`>=" . DBManager::RealEscape($hour_delimiters[0]) . " AND `dbvg`.`time`<=" . DBManager::RealEscape($hour_delimiters[1]) . " ;";
            $row = DBManager::FetchArray(DBManager::Execute(true, $conversionQuery));
            $this->ConversionsHour = $row["conversions"];


            if ($this->ChatPagesHour > 0 || $this->VisitorsUniqueHour > 0 || $this->PageImpressionsHour > 0 || $this->VisitorsRecurringHour > 0 || $this->VisitorBouncesHour > 0 || $this->FromSearchEngineHour > 0 || $this->FromReferrerHour > 0 || $this->ConversionsHour > 0 || $this->DeviceTabletHour > 0 || $this->DeviceMobileHour > 0)
                DBManager::Execute(true, "INSERT IGNORE INTO `" . DB_PREFIX . DATABASE_STATS_AGGS_VISITORS . "` (`year`,`month`,`day`,`hour`,`visitors_unique`,`page_impressions`,`visitors_recurring`,`bounces`,`conversions`,`search_engine`,`from_referrer`,`browser_instances`,`js`,`on_chat_page`,`device_tablet`,`device_mobile`) VALUES (" . $this->GetSQLDateValues() . ",'" . DBManager::RealEscape($i) . "','" . DBManager::RealEscape($this->VisitorsUniqueHour) . "','" . DBManager::RealEscape($this->PageImpressionsHour) . "','" . DBManager::RealEscape($this->VisitorsRecurringHour) . "','" . DBManager::RealEscape($this->VisitorBouncesHour) . "','" . DBManager::RealEscape($this->ConversionsHour) . "','" . DBManager::RealEscape($this->FromSearchEngineHour) . "','" . DBManager::RealEscape($this->FromReferrerHour) . "','" . DBManager::RealEscape($this->BrowserInstancesHour) . "','" . DBManager::RealEscape($this->JavascriptHour) . "','" . DBManager::RealEscape($this->ChatPagesHour) . "','" . DBManager::RealEscape($this->DeviceTabletHour) . "','" . DBManager::RealEscape($this->DeviceMobileHour) . "');");
        }
        $endOfAggregatedDay = min(time(),mktime(23, 59, 59, $this->Month, $this->Day, $this->Year));
        $row = DBManager::FetchArray(DBManager::Execute(true, "SELECT AVG(IF(`closed` > 0, `closed`, " . $endOfAggregatedDay . ")-`entrance`) as `avgs`,COUNT(`id`) as `cv` FROM `" . DB_PREFIX . DATABASE_VISITORS . "` WHERE `entrance`>=" . DBManager::RealEscape($this->Delimiters[0]) . " AND `entrance`<=" . DBManager::RealEscape($this->Delimiters[1]) . ";"));
        $this->AVGTimeOnSiteTotal = (!empty($row["avgs"])) ? round($row["avgs"], 4) : 0;
        $this->VisitorsTotal = $row["cv"];

        if (!StatisticProvider::$AllGoalsRequiredForConversion)
            $row = DBManager::FetchArray(DBManager::Execute(true, "SELECT COUNT(DISTINCT(`t1`.`visitor_id`)) as `cvconv` FROM `" . DB_PREFIX . DATABASE_VISITOR_GOALS . "` as `t1` INNER JOIN `" . DB_PREFIX . DATABASE_GOALS . "` as `t2` ON `t1`.`goal_id`=`t2`.`id` WHERE `t2`.`conversion`=1 AND `t1`.`time`>=" . DBManager::RealEscape($this->Delimiters[0]) . " AND `t1`.`time`<=" . DBManager::RealEscape($this->Delimiters[1]) . ";"));
        else
            $row = DBManager::FetchArray(DBManager::Execute(true, "SELECT (SELECT COUNT(*) FROM `" . DB_PREFIX . DATABASE_GOALS . "` WHERE `conversion`=1) AS `tcount`, (SELECT COUNT(`visitor_id`) FROM (SELECT `visitor_id`, COUNT(`visitor_id`) as `vtcount` FROM `" . DB_PREFIX . DATABASE_VISITOR_GOALS . "` as `t1` INNER JOIN `" . DB_PREFIX . DATABASE_GOALS . "` as `t2` ON `t1`.`goal_id`=`t2`.`id` WHERE `t2`.`conversion`=1 AND `t1`.`time`>=" . DBManager::RealEscape($this->Delimiters[0]) . " AND `t1`.`time`<=" . DBManager::RealEscape($this->Delimiters[1]) . " GROUP BY `t1`.`visitor_id`) AS `t3` WHERE `t3`.`vtcount`=`tcount`) as `cvconv`;"));

        $this->ConversionsTotal = $row["cvconv"];
        $time = SystemTime::GetMicroTime();

        DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_STATS_AGGS . "` SET `time`=" . $time[1] . ",`mtime`=" . $time[0] . ",`conversions`='" . DBManager::RealEscape($this->ConversionsTotal) . "',`sessions`=" . intval($this->VisitorsTotal) . ",`visitors_unique`='" . DBManager::RealEscape($this->VisitorsUnique) . "',`avg_time_site`='" . DBManager::RealEscape($this->AVGTimeOnSiteTotal) . "' WHERE" . $this->GetDateMatch() . ";");
    }

    function AggregateChats()
    {
        $values = array();
        $ids = array();
        $ndids = array();
        $result = DBManager::Execute(true, $d = "SELECT `" . DB_PREFIX . DATABASE_VISITOR_CHATS . "`.*,`" . DB_PREFIX . DATABASE_VISITOR_CHATS . "`.`status` AS `cstatus`,`vco`.`status` AS `inchatstatus`,`vco`.`user_id`,`vco`.`declined`,`vco`.`dtime`,`vco`.`jtime`,`vco`.`ltime`,`vco`.`alloc` FROM `" . DB_PREFIX . DATABASE_VISITOR_CHATS . "` LEFT JOIN `" . DB_PREFIX . DATABASE_VISITOR_CHAT_OPERATORS . "` AS `vco` ON `" . DB_PREFIX . DATABASE_VISITOR_CHATS . "`.`chat_id`=`vco`.`chat_id` WHERE (`" . DB_PREFIX . DATABASE_VISITOR_CHATS . "`.`status`>0 OR `" . DB_PREFIX . DATABASE_VISITOR_CHATS . "`.`waiting`=1) AND `" . DB_PREFIX . DATABASE_VISITOR_CHATS . "`.`first_active`>=" . DBManager::RealEscape($this->Delimiters[0]) . " AND `" . DB_PREFIX . DATABASE_VISITOR_CHATS . "`.`archive_created`>0 AND `" . DB_PREFIX . DATABASE_VISITOR_CHATS . "`.`first_active`<=" . DBManager::RealEscape($this->Delimiters[1]) . ";");

        while ($row = DBManager::FetchArray($result)) {
            if ($row["status"] >= 2) {
                $elements = array();
                if (!empty($row["jtime"]) || true) {
                    if (!empty($row["user_id"])) {
                        if (isset(Server::$Operators[$row["user_id"]]) && Server::$Operators[$row["user_id"]]->AffectsStatistic(true))
                            $elements[$row["user_id"]] = $row["user_id"];
                        else
                            continue;
                    } else if (!empty($row["request_group"]) && !empty($row["jtime"]))
                        foreach (Server::$Operators as $operator) {
                            if (!$operator->AffectsStatistic(true))
                                continue;

                            $results = DBManager::Execute(true, "SELECT `internal_id` FROM `" . DB_PREFIX . DATABASE_OPERATOR_STATUS . "` WHERE `time`<=" . $row["last_active"] . "  AND `confirmed`>=" . DBManager::RealEscape($row["last_active"]) . " AND `internal_id`='" . DBManager::RealEscape($operator->SystemId) . "'  AND status<=1 LIMIT 1;");
                            if (DBManager::GetRowCount($results) > 0)
                                if (in_array($row["request_group"], $operator->Groups))
                                    $elements[$operator->SystemId] = $operator->SystemId;
                        }
                    $elements[$row["request_group"]] = $row["request_group"];
                }

                foreach ($elements as $elementid) {
                    if ($row["archive_created"] == 2 && isset($ids[$row["chat_id"]]) && isset(Server::$Groups[$elementid]))
                        continue;

                    if (!isset($values[$elementid]))
                        $values[$elementid] = array();
                    if (!isset($values[$elementid][date("G", $row["first_active"])]))
                        $values[$elementid][date("G", $row["first_active"])] = array(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);

                    if (empty($ndids[$elementid . "-" . $row["chat_id"]]))
                        $ndids[$elementid . "-" . $row["chat_id"]] = $row["chat_id"];
                    else {
                        $values[$elementid][date("G", $row["first_active"])][0] -= 1;
                        $values[$elementid][date("G", $row["first_active"])][1] -= ($row["internal_active"]) ? 1 : 0;
                        $values[$elementid][date("G", $row["first_active"])][2] -= ($row["internal_active"]) ? 0 : $row["internal_declined"];
                    }

                    if (empty($ids[$row["chat_id"]]))
                        $ids[$row["chat_id"]] = $row["chat_id"];
                    else if (isset(Server::$Operators[$elementid]))
                        $values[$elementid][date("G", $row["first_active"])][9] += 1;

                    $values[$elementid][date("G", $row["first_active"])][0] += 1;
                    $values[$elementid][date("G", $row["first_active"])][1] += ($row["internal_active"]) ? 1 : 0;

                    if (isset(Server::$Operators[$elementid])) {
                        if ($row["jtime"] == 0)
                            $values[$elementid][date("G", $row["first_active"])][1] -= ($row["internal_active"]) ? 1 : 0;
                        if ($row["declined"] == 1)
                            $values[$elementid][date("G", $row["first_active"])][2] += 1;
                    } else {
                        $values[$elementid][date("G", $row["first_active"])][2] += ($row["internal_active"]) ? 0 : $row["internal_declined"];
                    }

                    if ($row["dtime"] > 0)
                        $values[$elementid][date("G", $row["first_active"])][3] += ($row["dtime"] - $row["first_active"]);
                    else
                        $values[$elementid][date("G", $row["first_active"])][3] += ($row["allocated"] > 0) ? ($row["allocated"] - $row["first_active"]) : $row["last_active"] - $row["first_active"];

                    if (!empty($row["internal_active"]) && empty($row["declined"]) && !empty($row["jtime"])) {
                        $values[$elementid][date("G", $row["first_active"])][4] += ($row["allocated"] > 0 && $row["last_active"] > $row["allocated"]) ? $row["last_active"] - $row["allocated"] : $row["last_active"] - $row["first_active"];
                        $values[$elementid][date("G", $row["first_active"])][5] += 1;

                        if (!empty($row["response_time"]))
                            $values[$elementid][date("G", $row["first_active"])][8] += 1;
                    }
                    $values[$elementid][date("G", $row["first_active"])][6] += $row["response_time"];
                    $values[$elementid][date("G", $row["first_active"])][7] += $row["chat_posts"];
                }
            }
        }

        $result = DBManager::Execute(true, "SELECT `request_group`,`first_active`,`request_operator` FROM `" . DB_PREFIX . DATABASE_VISITOR_CHATS . "` WHERE (`request_operator`='' AND `" . DB_PREFIX . DATABASE_VISITOR_CHATS . "`.`waiting`=1) AND `" . DB_PREFIX . DATABASE_VISITOR_CHATS . "`.`first_active`>=" . DBManager::RealEscape($this->Delimiters[0]) . "  AND `" . DB_PREFIX . DATABASE_VISITOR_CHATS . "`.`first_active`<=" . DBManager::RealEscape($this->Delimiters[1]) . ";");
        while ($row = DBManager::FetchArray($result)) {
            $grid = $row["request_group"];
            if (!isset($values[$grid][date("G", $row["first_active"])]))
                $values[$grid][date("G", $row["first_active"])] = array(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
            $values[$grid][date("G", $row["first_active"])][0] += 1;
        }

        $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_CHAT_REQUESTS . "` WHERE `created`>=" . DBManager::RealEscape($this->Delimiters[0]) . "  AND `created`<=" . DBManager::RealEscape($this->Delimiters[1]) . ";");
        while ($row = DBManager::FetchArray($result)) {
            $senders = array($row["sender_system_id"], $row["sender_group_id"]);
            foreach ($senders as $sender) {
                if (!isset($values[$sender][date("G", $row["created"])]))
                    $values[$sender][date("G", $row["created"])] = array(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
                $values[$sender][date("G", $row["created"])][10] += 1;
                if (!empty($row["event_action_id"]))
                    $values[$sender][date("G", $row["created"])][11] += 1;
                if (!empty($row["accepted"]))
                    $values[$sender][date("G", $row["created"])][12] += 1;
                if (!empty($row["declined"]))
                    $values[$sender][date("G", $row["created"])][13] += 1;
            }
        }

        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_CHATS . "` WHERE" . $this->GetDateMatch() . ";");
        foreach ($values as $userid => $hours)
            foreach ($hours as $hour => $amount) {
                $gid = (isset(Server::$Groups[$userid])) ? $userid : "";
                $uid = (isset(Server::$Operators[$userid])) ? $userid : "";
                DBManager::Execute(true, "INSERT IGNORE INTO `" . DB_PREFIX . DATABASE_STATS_AGGS_CHATS . "` (`year`,`month`,`day`,`hour`,`user_id`,`group_id`,`amount`,`accepted`,`declined`,`avg_duration`,`avg_waiting_time`,`avg_response_time`,`chat_posts`,`multi`,`invites`,`invites_auto`,`invites_accepted`,`invites_declined`) VALUES (" . $this->GetSQLDateValues() . ",'" . DBManager::RealEscape($hour) . "','" . DBManager::RealEscape($uid) . "','" . DBManager::RealEscape($gid) . "','" . DBManager::RealEscape($amount[0]) . "','" . DBManager::RealEscape($amount[1]) . "','" . DBManager::RealEscape($amount[2]) . "','" . DBManager::RealEscape(Num::Divide($amount[4], $amount[5], 4)) . "','" . DBManager::RealEscape(Num::Divide($amount[3], $amount[0], 4)) . "','" . DBManager::RealEscape(Num::Divide($amount[6], $amount[8], 4)) . "','" . DBManager::RealEscape($amount[7]) . "','" . DBManager::RealEscape($amount[9]) . "','" . DBManager::RealEscape($amount[10]) . "','" . DBManager::RealEscape($amount[11]) . "','" . DBManager::RealEscape($amount[12]) . "','" . DBManager::RealEscape($amount[13]) . "');");
            }
    }

    function AggregateTickets()
    {
        $ticketDueTime = intval(Server::$Configuration->File["gl_tidt"]);

        $values = array();
        $result = DBManager::Execute(true, $d = "SELECT `ti`.`target_group_id`,`tme`.`ticket_id`,`ted`.`editor_id`,`tme`.`created`,`ted`.`status`, `ted`.`time` FROM `" . DB_PREFIX . DATABASE_TICKETS . "` AS `ti` LEFT JOIN `" . DB_PREFIX . DATABASE_TICKET_EDITORS . "` AS `ted` ON `ti`.`id`=`ted`.`ticket_id` INNER JOIN `" . DB_PREFIX . DATABASE_TICKET_MESSAGES . "` AS `tme` ON `ti`.`id`=`tme`.`ticket_id` WHERE `tme`.`id`=`tme`.`ticket_id` AND `tme`.`created`>=" . DBManager::RealEscape($this->Delimiters[0]) . "  AND `tme`.`created`<=" . DBManager::RealEscape($this->Delimiters[1]) . ";");
        while ($row = DBManager::FetchArray($result)) {
            $operators = array();
            if (!empty($row["editor_id"]))
                $operators[$row["editor_id"]] = $row["editor_id"];
            $operators[$row["target_group_id"]] = $row["target_group_id"];

            foreach ($operators as $request_operator) {
                $this->PrepareTicketHourArray($values, $request_operator, date("G", $row["created"]));
                $values[$request_operator][date("G", $row["created"])]["amount"] += 1;
            }
        }

        $result = DBManager::Execute(true, $d = "SELECT `ti`.`target_group_id`,`tme`.`ticket_id`,`ted`.`editor_id`,`tme`.`created`,`ted`.`status`, `ted`.`time` FROM `" . DB_PREFIX . DATABASE_TICKETS . "` AS `ti` LEFT JOIN `" . DB_PREFIX . DATABASE_TICKET_EDITORS . "` AS `ted` ON `ti`.`id`=`ted`.`ticket_id` INNER JOIN `" . DB_PREFIX . DATABASE_TICKET_MESSAGES . "` AS `tme` ON `ti`.`id`=`tme`.`ticket_id` WHERE `tme`.`id`=`tme`.`ticket_id` AND `ted`.`time`>=" . DBManager::RealEscape($this->Delimiters[0]) . "  AND `ted`.`time`<=" . DBManager::RealEscape($this->Delimiters[1]) . ";");
        while ($row = DBManager::FetchArray($result)) {
            $operators = array();
            if (!empty($row["editor_id"]))
                $operators[$row["editor_id"]] = $row["editor_id"];
            $operators[$row["target_group_id"]] = $row["target_group_id"];

            foreach ($operators as $request_operator) {
                $this->PrepareTicketHourArray($values, $request_operator, date("G", $row["time"]));
                $values[$request_operator][date("G", $row["time"])]["open"] += ((!empty($row["editor_id"]) && $row["status"] == 0) ? 1 : 0);
                $values[$request_operator][date("G", $row["time"])]["closed"] += ((!empty($row["editor_id"]) && $row["status"] == 2) ? 1 : 0);
                $values[$request_operator][date("G", $row["time"])]["close_time"] += ((!empty($row["editor_id"]) && $row["status"] == 2) ? (self::GetCloseTimeByTicketID($row["ticket_id"], $row['time'])) : 0);
                $values[$request_operator][date("G", $row["time"])]["overdue"] += ((!empty($row["editor_id"]) && $row["status"] == 2 && self::CheckTicketOverdueByTicketID($row["ticket_id"], $ticketDueTime, $row['time'])) ? 1 : 0);
                $values[$request_operator][date("G", $row["time"])]["deleted"] += ((!empty($row["editor_id"]) && $row["status"] == 3) ? 1 : 0);
            }
        }
        $lastTicket = "";

        $results = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_TICKET_MESSAGES . "` WHERE `created`>=" . DBManager::RealEscape($this->Delimiters[0]) . "  AND `created`<=" . DBManager::RealEscape($this->Delimiters[1]) . " ORDER BY `ticket_id` ASC, `created` ASC;");

        while ($row = DBManager::FetchArray($results)) {
            if ($lastTicket != $row["ticket_id"]) {
                $Ticket = new Ticket();
                $Ticket->Id = $row["ticket_id"];
                $Ticket->Load();

                if (count($Ticket->Messages) == 0)
                    continue;

                $lastTicket = $Ticket->Id;

                $Ticket->Created = $Ticket->Messages[0]->Created;
                $openSpan = false;
            }

            foreach ($Ticket->Messages as $message) {
                if ($message->Type == 0 || $message->Type == 3 || $message->Type == 4) {
                    $openSpan = $message->Created;
                    if (!empty($Ticket->Editor->Editor) && $row["id"] == $message->Id) {
                        $this->PrepareTicketHourArray($values, $Ticket->Editor->Editor, date("G", $row["created"]));
                        $values[$Ticket->Editor->Editor][date("G", $row["created"])]["messages"] += 1;
                    }
                    if (!empty($Ticket->Group) && $row["id"] == $message->Id) {
                        $this->PrepareTicketHourArray($values, $Ticket->Group, date("G", $row["created"]));
                        $values[$Ticket->Group][date("G", $row["created"])]["messages"] += 1;
                    }
                } else if (!empty($openSpan) && $message->Type == 1 && $row["id"] == $message->Id) {
                    if (!empty($Ticket->Editor)) {
                        $this->PrepareTicketHourArray($values, $Ticket->Editor->Editor, date("G", $row["created"]));
                        $this->PrepareTicketHourArray($values, $Ticket->Group, date("G", $row["created"]));
                        $values[$Ticket->Editor->Editor][date("G", $row["created"])]["responses"] += 1;
                        $values[$Ticket->Editor->Editor][date("G", $row["created"])]["response_time"] += ($row["created"] - $openSpan);
                        $values[$Ticket->Group][date("G", $row["created"])]["responses"] += 1;
                        $values[$Ticket->Group][date("G", $row["created"])]["response_time"] += ($row["created"] - $openSpan);

                        if ($Ticket->Editor->Status == 2 && $Ticket->GetLastOutgoingMessageId() == $message->Id) {
                            $values[$Ticket->Editor->Editor][date("G", $row["created"])]["resolves"] += 1;
                            $values[$Ticket->Editor->Editor][date("G", $row["created"])]["closed"] += 1;
                            $values[$Ticket->Editor->Editor][date("G", $row["created"])]["overdue"] += ($message->Created - $Ticket->Created > $ticketDueTime * 3600) ? 1 : 0;
                            $values[$Ticket->Editor->Editor][date("G", $row["created"])]["close_time"] += max($message->Created - $Ticket->Created, 0);
                            $values[$Ticket->Editor->Editor][date("G", $row["created"])]["resolve_time"] += max($message->Created - $Ticket->Created, 0);
                            $values[$Ticket->Group][date("G", $row["created"])]["resolves"] += 1;
                            $values[$Ticket->Group][date("G", $row["created"])]["closed"] += 1;
                            $values[$Ticket->Group][date("G", $row["created"])]["overdue"] += self::CheckTicketOverdue($message, $Ticket, $ticketDueTime) ? 1 : 0;
                            $values[$Ticket->Group][date("G", $row["created"])]["close_time"] += max(self::GetCloseTime($message, $Ticket), 0);
                            $values[$Ticket->Group][date("G", $row["created"])]["resolve_time"] += max($message->Created - $Ticket->Created, 0);
                        }
                    }
                } else if (!empty($Ticket->Group) && $Ticket->Channel == 6 && $row["id"] == $message->Id) {
                    $this->PrepareTicketHourArray($values, $Ticket->Group, date("G", $row["created"]));
                    if ($message->Type == 1)
                        $values[$Ticket->Group][date("G", $row["created"])]["facebook_out"] += 1;
                    else
                        $values[$Ticket->Group][date("G", $row["created"])]["facebook_in"] += 1;
                } else if (!empty($Ticket->Group) && $Ticket->Channel == 7 && $row["id"] == $message->Id) {
                    $this->PrepareTicketHourArray($values, $Ticket->Group, date("G", $row["created"]));
                    if ($message->Type == 1)
                        $values[$Ticket->Group][date("G", $row["created"])]["twitter_out"] += 1;
                    else
                        $values[$Ticket->Group][date("G", $row["created"])]["twitter_in"] += 1;
                }
                if (!empty($Ticket->Group) && $Ticket->Channel != 7 && $Ticket->Channel != 6 && $row["id"] == $message->Id && $message->Type == 1) {
                    $this->PrepareTicketHourArray($values, $Ticket->Group, date("G", $row["created"]));
                    $values[$Ticket->Group][date("G", $row["created"])]["email_out"] += 1;
                }
                if (!empty($Ticket->Group) && $row["id"] == $message->Id && $message->Type != 1) {
                    $this->PrepareTicketHourArray($values, $Ticket->Group, date("G", $row["created"]));

                    switch ($Ticket->Channel) {
                        case 1:
                            $values[$Ticket->Group][date("G", $row["created"])]["source_email"] += 1;
                            break;
                        case 2:
                            $values[$Ticket->Group][date("G", $row["created"])]["source_phone"] += 1;
                            break;
                        case 3:
                            $values[$Ticket->Group][date("G", $row["created"])]["source_misc"] += 1;
                            break;
                        case 4:
                            $values[$Ticket->Group][date("G", $row["created"])]["source_chat"] += 1;
                            break;
                        case 5:
                            $values[$Ticket->Group][date("G", $row["created"])]["source_feedback"] += 1;
                            break;
                        case 6:
                            $values[$Ticket->Group][date("G", $row["created"])]["source_facebook"] += 1;
                            break;
                        case 7:
                            $values[$Ticket->Group][date("G", $row["created"])]["source_twitter"] += 1;
                            break;
                        default:
                            break;
                    }
                }
            }
        }

        $results = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_TICKET_EMAILS . "` WHERE `created`>=" . DBManager::RealEscape($this->Delimiters[0]) . "  AND `created`<=" . DBManager::RealEscape($this->Delimiters[1]) . ";");

        while($row = DBManager::FetchArray($results))
        {
            $this->PrepareTicketHourArray($values,$row["group_id"],date("G",$row["created"]));
            $values[$row["group_id"]][date("G",$row["created"])]["email_in"] +=1;
            if($row["deleted"] == 2)
                $values[$row["group_id"]][date("G",$row["created"])]["email_converted"] +=1;
        }

        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_TICKETS . "` WHERE " . $this->GetDateMatch() . ";");
        foreach ($values as $userid => $hours)
            foreach ($hours as $hour => $amount) {
                $groupid = (isset(Server::$Groups[$userid])) ? $userid : "";
                DBManager::Execute(true, "INSERT IGNORE INTO `" . DB_PREFIX . DATABASE_STATS_AGGS_TICKETS . "` (`year`,`month`,`day`,`hour`,`user_id`,`group_id`,`amount`,`open`,`closed`,`avg_close_time`,`overdue`,`deleted`,`messages`,`responses`,`avg_response_time`,`resolves`,`avg_resolve_time`,`email_in`,`email_converted`,`email_out`,`facebook_in`,`facebook_out`,`twitter_in`,`twitter_out`, `source_email`, `source_phone`, `source_misc`, `source_chat`, `source_feedback`, `source_facebook`, `source_twitter`) VALUES (" . $this->GetSQLDateValues() . ",'" . DBManager::RealEscape($hour) . "','" . DBManager::RealEscape($userid) . "','" . DBManager::RealEscape($groupid) . "','" . DBManager::RealEscape($amount["amount"]) . "','" . DBManager::RealEscape($amount["open"]) . "','" . DBManager::RealEscape($amount["closed"]) . "','" . DBManager::RealEscape(Num::Divide($amount["close_time"], $amount["closed"], 4)) . "','" . DBManager::RealEscape($amount["overdue"]) . "','" . DBManager::RealEscape($amount["deleted"]) . "','" . DBManager::RealEscape($amount["messages"]) . "','" . DBManager::RealEscape($amount["responses"]) . "','" . DBManager::RealEscape((Num::Divide($amount["response_time"], $amount["responses"], 4))) . "','" . DBManager::RealEscape($amount["resolves"]) . "','" . DBManager::RealEscape(Num::Divide($amount["resolve_time"], $amount["resolves"], 4)) . "','" . DBManager::RealEscape($amount["email_in"]) . "','" . DBManager::RealEscape($amount["email_converted"]) . "','" . DBManager::RealEscape($amount["email_out"]) . "','" . DBManager::RealEscape($amount["facebook_in"]) . "','" . DBManager::RealEscape($amount["facebook_out"]) . "','" . DBManager::RealEscape($amount["twitter_in"]) . "','" . DBManager::RealEscape($amount["twitter_out"]) . "','" . DBManager::RealEscape($amount["source_email"]) . "','" . DBManager::RealEscape($amount["source_phone"]) . "','" . DBManager::RealEscape($amount["source_misc"]) . "','" . DBManager::RealEscape($amount["source_chat"]) . "','" . DBManager::RealEscape($amount["source_feedback"]) . "','" . DBManager::RealEscape($amount["source_facebook"]) . "','" . DBManager::RealEscape($amount["source_twitter"]) . "');");
            }
    }

    function GetCloseTimeByTicketID($ticketID, $created)
    {
        $Ticket = new Ticket();
        $Ticket->Id = $ticketID;
        $Ticket->Load();
        $lastMessage = $Ticket->Messages[count($Ticket->Messages) - 1];
        if (count($Ticket->Messages) == 1) {
            $result = $lastMessage->Edited - $lastMessage->Created;
            return $result;
        }

        return self::GetCloseTime($lastMessage, $Ticket);
    }

    function GetCloseTime($message, $Ticket)
    {
        $result = $message->Created - $Ticket->Messages[0]->Created;
        return $result;
    }

    function CheckTicketOverdueByTicketID($ticketID, $ticketDueTime, $created)
    {
        $Ticket = new Ticket();
        $Ticket->Id = $ticketID;
        $Ticket->Load();
        $lastMessage = $Ticket->Messages[count($Ticket->Messages) - 1];
        if (count($Ticket->Messages) == 1) {
            return ($lastMessage->Edited - $lastMessage->Created) > ($ticketDueTime * 3600);
        }

        return self::CheckTicketOverdue($lastMessage, $Ticket, $ticketDueTime);
    }

    function CheckTicketOverdue($message, $Ticket, $ticketDueTime)
    {
        $result = ($message->Created - $Ticket->Messages[0]->Created) > ($ticketDueTime * 3600);
        return $result;
    }

    function AggregateFeedbacks()
    {
        Server::InitDataBlock(array("DBCONFIG"));
        $result = DBManager::Execute(true, $d = "SELECT * FROM `" . DB_PREFIX . DATABASE_FEEDBACKS . "` AS `fb` INNER JOIN `" . DB_PREFIX . DATABASE_FEEDBACK_CRITERIA . "` AS `fc` ON `fb`.`id`=`fc`.`fid` WHERE `fb`.`operator_id` != '' AND `fb`.`group_id` != '' AND `fb`.`created`>=" . DBManager::RealEscape($this->Delimiters[0]) . " AND `fb`.`created`<=" . DBManager::RealEscape($this->Delimiters[1]) . " ORDER BY `fb`.`id` ASC;");
        $values = array("operator_id" => array(), "group_id" => array());
        $currentFeedback = "";
        $up = false;

        while($row = DBManager::FetchArray($result))
        {
            if ($currentFeedback != $row["id"])
                $up = true;

            foreach($values as $typekey => $x)
            {
                if(empty($values[$typekey][$row[$typekey]]))
                {
                    $values[$typekey][$row[$typekey]] = FeedbackCriteria::GetStatArray();
                    $values[$typekey][$row[$typekey]]["amount"] = 0;
                }

                if(isset($values[$typekey][$row[$typekey]][$row["cid"]]))
                {
                    $values[$typekey][$row[$typekey]][$row["cid"]] += $row["value"];
                }

                if($up)
                    $values[$typekey][$row[$typekey]]["amount"]++;
            }
            $currentFeedback = $row["id"];
            $up = false;
        }

        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_FEEDBACKS . "` WHERE" . $this->GetDateMatch() . ";");

        foreach ($values as $tarray)
            foreach ($tarray as $elementid => $cvalues)
            {
                $gid = (isset(Server::$Groups[$elementid])) ? $elementid : "";
                $uid = (isset(Server::$Operators[$elementid])) ? $elementid : "";

                $nvalues = array();
                foreach ($cvalues as $avg)
                    $nvalues[] = $avg;

                while (count($nvalues) < 9)
                    $nvalues[] = 0;

                DBManager::Execute(true, "INSERT IGNORE INTO `" . DB_PREFIX . DATABASE_STATS_AGGS_FEEDBACKS . "` (`year`,`month`,`day`,`operator_id`,`group_id`,`amount`,`ca`,`cb`,`cc`,`cd`,`ce`,`cf`,`cg`,`ch`,`ci`) VALUES (" . $this->GetSQLDateValues() . ",'" . DBManager::RealEscape($uid) . "','" . DBManager::RealEscape($gid) . "','" . DBManager::RealEscape($cvalues["amount"]) . "','" . DBManager::RealEscape($nvalues[0]) . "','" . DBManager::RealEscape($nvalues[1]) . "','" . DBManager::RealEscape($nvalues[2]) . "','" . DBManager::RealEscape($nvalues[3]) . "','" . DBManager::RealEscape($nvalues[4]) . "','" . DBManager::RealEscape($nvalues[5]) . "','" . DBManager::RealEscape($nvalues[6]) . "','" . DBManager::RealEscape($nvalues[7]) . "','" . DBManager::RealEscape($nvalues[8]) . "');");
            }
    }

    function AggregateOperatorTime()
    {
        global $ONTIME;
        $ONTIME = array();
        $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_OPERATOR_STATUS . "` WHERE `time`>=" . DBManager::RealEscape($this->Delimiters[0]) . " AND `time`<=" . DBManager::RealEscape($this->Delimiters[1]) . " AND `status`<" . USER_STATUS_OFFLINE . " ORDER BY `time`,`confirmed` ASC;");
        while ($row = DBManager::FetchArray($result)) {
            if (!isset($ONTIME[$row["internal_id"]])) {
                $ONTIME[$row["internal_id"]][USER_STATUS_ONLINE] = array(0 => 0, 1 => 0, 2 => 0, 3 => 0, 4 => 0, 5 => 0, 6 => 0, 7 => 0, 8 => 0, 9 => 0, 10 => 0, 11 => 0, 12 => 0, 13 => 0, 14 => 0, 15 => 0, 16 => 0, 17 => 0, 18 => 0, 19 => 0, 20 => 0, 21 => 0, 22 => 0, 23 => 0);
                $ONTIME[$row["internal_id"]][USER_STATUS_BUSY] = array(0 => 0, 1 => 0, 2 => 0, 3 => 0, 4 => 0, 5 => 0, 6 => 0, 7 => 0, 8 => 0, 9 => 0, 10 => 0, 11 => 0, 12 => 0, 13 => 0, 14 => 0, 15 => 0, 16 => 0, 17 => 0, 18 => 0, 19 => 0, 20 => 0, 21 => 0, 22 => 0, 23 => 0);
            }
            $ONTIME[$row["internal_id"]][$row["status"]][date("G", $row["time"])] += max($row["confirmed"] - $row["time"], 0);
        }

        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_AVAILABILITIES . "` WHERE" . $this->GetDateMatch() . ";");
        foreach ($ONTIME as $userid => $states)
            foreach ($states as $status => $hours)
                foreach ($hours as $hour => $amount)
                    if ($amount > 0) {
                        $gid = (isset(Server::$Groups[$userid])) ? $userid : "";
                        $uid = (isset(Server::$Operators[$userid]) || $userid == "everyoneintern") ? $userid : "";
                        if (!empty($gid) || !empty($uid))
                            DBManager::Execute(true, "INSERT IGNORE INTO `" . DB_PREFIX . DATABASE_STATS_AGGS_AVAILABILITIES . "` (`year`,`month`,`day`,`hour`,`user_id`,`group_id`,`status`,`seconds`) VALUES (" . $this->GetSQLDateValues() . ",'" . DBManager::RealEscape($hour) . "','" . DBManager::RealEscape($uid) . "','" . DBManager::RealEscape($gid) . "','" . DBManager::RealEscape($status) . "','" . DBManager::RealEscape($amount) . "');");
                    }
    }

    function AggregateValueCount($_table, $_sourceTable, $_valueField, $_delimiterField, $_unique = false)
    {
        DBManager::Execute(true, "DELETE FROM `" . $_table . "` WHERE" . $this->GetDateMatch() . ";");
        $result = DBManager::Execute(true, "SELECT `" . $_valueField . "` , count( `" . $_valueField . "` ) AS `vamount` FROM `" . $_sourceTable . "` WHERE `" . $_valueField . "`!='0' AND `" . $_delimiterField . "`>=" . DBManager::RealEscape($this->Delimiters[0]) . " AND `" . $_delimiterField . "`<=" . DBManager::RealEscape($this->Delimiters[1]) . " GROUP BY `" . $_valueField . "` ORDER BY `vamount` DESC LIMIT " . StatisticProvider::$DayItemAmount . ";");
        while ($row = DBManager::FetchArray($result))
            DBManager::Execute(true, "INSERT IGNORE INTO `" . $_table . "` (`year`,`month`,`day`,`" . $_valueField . "`,`amount`) VALUES (" . $this->GetSQLDateValues() . ",'" . DBManager::RealEscape($row[$_valueField]) . "','" . DBManager::RealEscape($row["vamount"]) . "');");
    }

    function AggregateDayPageCount($_table, $_field, $_countField, $_groupField)
    {
        DBManager::Execute(true, "DELETE FROM `" . $_table . "` WHERE" . $this->GetDateMatch() . ";");
        $result = DBManager::Execute(true, "SELECT COUNT( " . $_countField . " ) AS `vamount`,`" . DB_PREFIX . DATABASE_VISITOR_BROWSER_URLS . "`.`url`,`t1`.`domain` AS `domain` FROM `" . DB_PREFIX . DATABASE_VISITOR_BROWSER_URLS . "` INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_BROWSERS . "` AS `vb` ON `" . DB_PREFIX . DATABASE_VISITOR_BROWSER_URLS . "`.`browser_id`=`vb`.`id` INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_PAGES . "` AS t1 ON `" . DB_PREFIX . DATABASE_VISITOR_BROWSER_URLS . "`.`url`=t1.`id` INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_DOMAINS . "` AS t2 ON t1.`domain` = t2.`id` INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_TITLES . "` AS t3 ON t1.`title` = t3.`id` WHERE `vb`.`is_chat`=0 AND t2.`search`=0 AND t2.`external`=0 AND t2.`domain`!='' AND `" . DB_PREFIX . DATABASE_VISITOR_BROWSER_URLS . "`.`entrance`>=" . DBManager::RealEscape($this->Delimiters[0]) . " AND `" . DB_PREFIX . DATABASE_VISITOR_BROWSER_URLS . "`.`entrance`<=" . DBManager::RealEscape($this->Delimiters[1]) . " GROUP BY " . $_groupField . " ORDER BY `vamount` DESC,`" . DB_PREFIX . "visitor_browser_urls`.`url` LIMIT " . (StatisticProvider::$DayItemAmount) . ";");
        while ($row = DBManager::FetchArray($result))
            DBManager::Execute(true, "INSERT IGNORE INTO `" . $_table . "` (`year`,`month`,`day`,`" . $_field . "`,`amount`) VALUES (" . $this->GetSQLDateValues() . ",'" . DBManager::RealEscape($row[$_field]) . "','" . DBManager::RealEscape($row["vamount"]) . "');");
    }

    function AggregateDayEntranceExitPageCount($_table, $_exit = false, $_secondaryGroupField = "")
    {
        DBManager::Execute(true, "DELETE FROM `" . $_table . "` WHERE" . $this->GetDateMatch() . ";");

        if (!$_exit)
            $query = "SELECT SUM(`is_entrance`) as `pamount`,bu.url as urli FROM `" . DB_PREFIX . DATABASE_VISITOR_BROWSER_URLS . "` AS `bu` INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_BROWSERS . "` AS `vb` ON `bu`.`browser_id`=`vb`.`id` WHERE `vb`.`is_chat`=0 AND `entrance`>=" . DBManager::RealEscape($this->Delimiters[0]) . " AND `entrance`<=" . DBManager::RealEscape($this->Delimiters[1]) . " GROUP BY `urli` ORDER BY `pamount` DESC LIMIT " . (StatisticProvider::$DayItemAmount) . ";";
        else
            $query = "SELECT SUM(`is_exit`) as `pamount`,bu.url as urli FROM `" . DB_PREFIX . DATABASE_VISITOR_BROWSER_URLS . "` AS `bu` INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_BROWSERS . "` AS `vb` ON `bu`.`browser_id`=`vb`.`id` WHERE `vb`.`is_chat`=0 AND `vb`.`last_active` < " . (time() - StatisticProvider::$TimeoutTrack) . " AND `entrance`>=" . DBManager::RealEscape($this->Delimiters[0]) . " AND `entrance`<=" . DBManager::RealEscape($this->Delimiters[1]) . " GROUP BY `urli` ORDER BY `pamount` DESC LIMIT " . (StatisticProvider::$DayItemAmount) . ";";

        $result = DBManager::Execute(true, $query);
        while ($row = DBManager::FetchArray($result))
            DBManager::Execute(true, "INSERT IGNORE INTO `" . $_table . "` (`year`,`month`,`day`,`url`,`amount`) VALUES (" . $this->GetSQLDateValues() . ",'" . DBManager::RealEscape($row["urli"]) . "','" . DBManager::RealEscape($row["pamount"]) . "');");
    }

    function AggregateDayReferrerCount($_table)
    {
        DBManager::Execute(true, "DELETE FROM `" . $_table . "` WHERE" . $this->GetDateMatch() . ";");
        $result = DBManager::Execute(true, "SELECT COUNT( `t1`.`path` ) AS `vamount`,`" . DB_PREFIX . DATABASE_VISITOR_BROWSER_URLS . "`.`referrer` FROM `" . DB_PREFIX . DATABASE_VISITOR_BROWSER_URLS . "`  INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_PAGES . "` AS t1 ON `" . DB_PREFIX . DATABASE_VISITOR_BROWSER_URLS . "`.`referrer`=t1.`id` INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_DOMAINS . "` AS t2 ON t1.`domain` = t2.`id` WHERE t2.`search`=0 AND t2.`external`=1 AND t2.`domain`!='' AND `" . DB_PREFIX . DATABASE_VISITOR_BROWSER_URLS . "`.`entrance`>=" . DBManager::RealEscape($this->Delimiters[0]) . " AND `" . DB_PREFIX . DATABASE_VISITOR_BROWSER_URLS . "`.`entrance`<=" . DBManager::RealEscape($this->Delimiters[1]) . " GROUP BY `" . DB_PREFIX . DATABASE_VISITOR_BROWSER_URLS . "`.`referrer` ORDER BY `vamount` DESC LIMIT " . (StatisticProvider::$DayItemAmount) . ";");
        while ($row = DBManager::FetchArray($result))
            DBManager::Execute(true, "INSERT IGNORE INTO `" . $_table . "` (`year`,`month`,`day`,`referrer`,`amount`) VALUES (" . $this->GetSQLDateValues() . ",'" . DBManager::RealEscape($row["referrer"]) . "','" . DBManager::RealEscape($row["vamount"]) . "');");
    }

    function AggregateDaySearchEngineCount($_table)
    {
        DBManager::Execute(true, "DELETE FROM `" . $_table . "` WHERE" . $this->GetDateMatch() . ";");
        $result = DBManager::Execute(true, $d = "SELECT COUNT( `t1`.`path` ) AS `vamount`,`t1`.`domain` FROM `" . DB_PREFIX . DATABASE_VISITOR_BROWSER_URLS . "`  INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_PAGES . "` AS `t1` ON `" . DB_PREFIX . DATABASE_VISITOR_BROWSER_URLS . "`.`referrer`=`t1`.`id` INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_DOMAINS . "` AS `t2` ON `t1`.`domain`=`t2`.`id` WHERE `t2`.`search`=1 AND `t2`.`external`=1 AND `t2`.`domain`!='' AND `" . DB_PREFIX . DATABASE_VISITOR_BROWSER_URLS . "`.`entrance`>=" . DBManager::RealEscape($this->Delimiters[0]) . " AND `" . DB_PREFIX . DATABASE_VISITOR_BROWSER_URLS . "`.`entrance`<=" . DBManager::RealEscape($this->Delimiters[1]) . " GROUP BY `t1`.`domain` ORDER BY `vamount` DESC LIMIT " . (StatisticProvider::$DayItemAmount) . ";");
        while ($row = DBManager::FetchArray($result))
            DBManager::Execute(true, "INSERT IGNORE INTO `" . $_table . "` (`year`,`month`,`day`,`domain`,`amount`) VALUES (" . $this->GetSQLDateValues() . ",'" . DBManager::RealEscape($row["domain"]) . "','" . DBManager::RealEscape($row["vamount"]) . "');");
    }

    function AggregateTags($result, $type)
    {
        $tags = array();
        while ($row = DBManager::FetchArray($result)) {
            $tags_array = explode(",", $row["tags"]);
            foreach ($tags_array as $tag) {
                if (array_key_exists($tag, $tags))
                    $tags[$tag] = $tags[$tag] + 1;
                else
                    $tags[$tag] = 1;
            }
        }
        foreach ($tags as $tag => $amount) {
            if ($tag != '')
                DBManager::Execute(true, "INSERT IGNORE INTO `" . DB_PREFIX . DATABASE_STATS_AGGS_TAGS . "` (`year`,`month`,`day`,`tag`,`amount`,`type`) VALUES (" . $this->GetSQLDateValues() . ",'" . DBManager::RealEscape($tag) . "','" . DBManager::RealEscape($amount) . "','" . DBManager::RealEscape($type) . "');");
        }
    }

    function AggregateDayTags()
    {
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_TAGS . "` WHERE" . $this->GetDateMatch() . ";");

        $chatTags = DBManager::Execute(true, "SELECT `tags` FROM `" . DB_PREFIX . DATABASE_CHAT_ARCHIVE . "` WHERE `time`>=" . DBManager::RealEscape($this->Delimiters[0]) . " AND `time`<=" . DBManager::RealEscape($this->Delimiters[1]) . ";");
        self::AggregateTags($chatTags, 0);

        $ticketTags = DBManager::Execute(true, "SELECT `ti`.`tags` FROM `" . DB_PREFIX . DATABASE_TICKETS . "` AS `ti` INNER JOIN `" . DB_PREFIX . DATABASE_TICKET_MESSAGES . "` AS `tme` ON `ti`.`id`=`tme`.`ticket_id` WHERE `tme`.`id`=`tme`.`ticket_id` AND `tme`.`created`>=" . DBManager::RealEscape($this->Delimiters[0]) . "  AND `tme`.`created`<=" . DBManager::RealEscape($this->Delimiters[1]) . ";");
        self::AggregateTags($ticketTags, 1);

    }

    function AggregateDayGoals()
    {
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_GOALS_QUERIES . "` WHERE" . $this->GetDateMatch() . ";");

        $result = DBManager::Execute(true, "SELECT `goal_id`, COUNT(`goal_id`) as `tamount` FROM `" . DB_PREFIX . DATABASE_VISITOR_GOALS . "` WHERE `time`>=" . DBManager::RealEscape($this->Delimiters[0]) . " AND `time`<=" . DBManager::RealEscape($this->Delimiters[1]) . " GROUP BY `goal_id` ORDER BY `tamount` DESC LIMIT " . StatisticProvider::$DayItemAmount . ";");
        while ($row = DBManager::FetchArray($result)) {
            $results = DBManager::Execute(true, "SELECT `goal_id`,`t1`.`query`,COUNT(`t1`.`query`) as `qamount` FROM `" . DB_PREFIX . DATABASE_VISITOR_GOALS . "` AS `t1` INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_QUERIES . "` AS `t2` ON `t1`.`query`=`t2`.`id` WHERE `t2`.`query` != '' AND `goal_id`='" . DBManager::RealEscape($row["goal_id"]) . "' GROUP BY `t1`.`query` ORDER BY `qamount` DESC LIMIT " . StatisticProvider::$DayItemAmount . ";");
            while ($rows = DBManager::FetchArray($results)) {
                DBManager::Execute(true, "INSERT IGNORE INTO `" . DB_PREFIX . DATABASE_STATS_AGGS_GOALS_QUERIES . "` (`year`,`month`,`day`,`goal`,`query`,`amount`) VALUES (" . $this->GetSQLDateValues() . ",'" . DBManager::RealEscape($rows["goal_id"]) . "','" . DBManager::RealEscape($rows["query"]) . "','" . DBManager::RealEscape($rows["qamount"]) . "');");
            }
        }

        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_GOALS . "` WHERE" . $this->GetDateMatch() . ";");
        for ($i = 0; $i < 24; $i++) {
            $hour_delimiters = array(mktime($i, 0, 0, $this->Month, $this->Day, $this->Year), mktime($i, 59, 59, $this->Month, $this->Day, $this->Year));
            $thisQuery = "SELECT `goal_id`, COUNT(`goal_id`) as `gamount` FROM `" . DB_PREFIX . DATABASE_VISITOR_GOALS . "` WHERE `time`>=" . DBManager::RealEscape($hour_delimiters[0]) . " AND `time`<=" . DBManager::RealEscape($hour_delimiters[1]) . " GROUP BY `goal_id` DESC LIMIT " . StatisticProvider::$DayItemAmount . ";";
            $result = DBManager::Execute(true, $thisQuery);
            $goalIds = array();
            while ($row = DBManager::FetchArray($result)) {
                if (!isset($goalIds[$row["goal_id"]]))
                    $goalIds[$row["goal_id"]] = 0;

                $goalIds[$row["goal_id"]] += $row["gamount"];

            }
            foreach ($goalIds as $gid => $count)
                DBManager::Execute(true, "INSERT IGNORE INTO `" . DB_PREFIX . DATABASE_STATS_AGGS_GOALS . "` (`year`,`month`,`day`,`hour`,`goal`,`amount`) VALUES (" . $this->GetSQLDateValues() . "," . $i . ",'" . DBManager::RealEscape($gid) . "','" . DBManager::RealEscape($count) . "');");

        }
    }

    function AggregateDayEvents()
    {
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_EVENTS . "` WHERE" . $this->GetDateMatch() . ";");
        for ($i = 0; $i < 24; $i++) {
            $hour_delimiters = array(mktime($i, 0, 0, $this->Month, $this->Day, $this->Year), mktime($i, 59, 59, $this->Month, $this->Day, $this->Year));
            $result = DBManager::Execute(true, $d = "SELECT `event_id` FROM `" . DB_PREFIX . DATABASE_EVENT_TRIGGERS . "` WHERE `event_id`!='' AND `time`>=" . DBManager::RealEscape($hour_delimiters[0]) . " AND `time`<=" . DBManager::RealEscape($hour_delimiters[1]) . " GROUP BY `receiver_user_id`,`receiver_browser_id`,`event_id` LIMIT " . StatisticProvider::$DayItemAmount . ";");
            $eventIds = array();
            while ($row = DBManager::FetchArray($result)) {
                if (!isset($eventIds[$row["event_id"]]))
                    $eventIds[$row["event_id"]] = 0;

                $eventIds[$row["event_id"]]++;
            }
            foreach ($eventIds as $eid => $count)
                DBManager::Execute(true, "INSERT IGNORE INTO `" . DB_PREFIX . DATABASE_STATS_AGGS_EVENTS . "` (`year`,`month`,`day`,`hour`,`event_id`,`amount`) VALUES (" . $this->GetSQLDateValues() . "," . $i . ",'" . DBManager::RealEscape($eid) . "','" . DBManager::RealEscape($count) . "');");
        }
    }

    function AggregateKnowledgebase()
    {
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_QUERIES . "` WHERE" . $this->GetDateMatch() . " AND `type`=1;");
        $result = DBManager::Execute(true, "SELECT `query`, COUNT(`query`) as `qamount` FROM `" . DB_PREFIX . DATABASE_KNOWLEDGEBASE_QUERIES . "` WHERE `time`>=" . DBManager::RealEscape($this->Delimiters[0]) . " AND `time`<=" . DBManager::RealEscape($this->Delimiters[1]) . " GROUP BY `query` ORDER BY `qamount` DESC LIMIT " . StatisticProvider::$DayItemAmount . ";");
        while ($row = DBManager::FetchArray($result))
            DBManager::Execute(true, "INSERT IGNORE INTO `" . DB_PREFIX . DATABASE_STATS_AGGS_QUERIES . "` (`year`,`month`,`day`,`query`,`amount`,`type`) VALUES (" . $this->GetSQLDateValues() . "," . intval($row["query"]) . "," . intval($row["qamount"]) . ",1);");

        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_KNOWLEDGEBASE . "` WHERE" . $this->GetDateMatch() . ";");
        $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_KNOWLEDGEBASE_VIEWS . "` WHERE `time`>=" . DBManager::RealEscape($this->Delimiters[0]) . " AND `time`<=" . DBManager::RealEscape($this->Delimiters[1]) . ";");
        while ($row = DBManager::FetchArray($result)) {
            DBManager::Execute(true, "INSERT IGNORE INTO `" . DB_PREFIX . DATABASE_STATS_AGGS_KNOWLEDGEBASE . "` (`year`,`month`,`day`,`res_id`,`views`) VALUES (" . $this->GetSQLDateValues() . ",'" . DBManager::RealEscape($row["res_id"]) . "',1);");
            if (DBManager::GetAffectedRowCount() <= 0)
                DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_STATS_AGGS_KNOWLEDGEBASE . "` SET `views`=`views`+1 WHERE" . $this->GetDateMatch() . " AND `res_id`='" . DBManager::RealEscape($row["res_id"]) . "' LIMIT 1;");
        }
        $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_FEEDBACKS . "` AS `t1` INNER JOIN `" . DB_PREFIX . DATABASE_FEEDBACK_CRITERIA . "` AS `t2` ON `t1`.`id`=`t2`.`fid` WHERE `t2`.`cid`='hf' AND `t1`.`resource_id` != '' AND `t1`.`created`>=" . DBManager::RealEscape($this->Delimiters[0]) . " AND `t1`.`created`<=" . DBManager::RealEscape($this->Delimiters[1]) . ";");
        while ($row = DBManager::FetchArray($result)) {
            DBManager::Execute(true, "INSERT IGNORE INTO `" . DB_PREFIX . DATABASE_STATS_AGGS_KNOWLEDGEBASE . "` (`year`,`month`,`day`,`res_id`,`rate_amount`,`rate_positive`) VALUES (" . $this->GetSQLDateValues() . ",'" . DBManager::RealEscape($row["resource_id"]) . "',1," . intval(!empty($row["value"]) ? 1 : 0) . ");");
            if (DBManager::GetAffectedRowCount() <= 0) {
                DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_STATS_AGGS_KNOWLEDGEBASE . "` SET `rate_amount`=`rate_amount`+1 WHERE" . $this->GetDateMatch() . " AND `res_id`='" . DBManager::RealEscape($row["resource_id"]) . "' LIMIT 1;");

                if (!empty($row["value"]))
                    DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_STATS_AGGS_KNOWLEDGEBASE . "` SET `rate_positive`=`rate_positive`+1 WHERE" . $this->GetDateMatch() . " AND `res_id`='" . DBManager::RealEscape($row["resource_id"]) . "' LIMIT 1;");
            }
        }
    }

    function AggregateDurations()
    {
        $endOfAggregatedDay = min(time(),mktime(23, 59, 59, $this->Month, $this->Day, $this->Year));
        $result = DBManager::Execute(true, "SELECT
		(SELECT count((id)) FROM `" . DB_PREFIX . DATABASE_VISITORS . "` WHERE (IF(`closed`>0,`closed`," . $endOfAggregatedDay . ")-`entrance`)>=3600 AND `" . DB_PREFIX . DATABASE_VISITORS . "`.`entrance`>=" . DBManager::RealEscape($this->Delimiters[0]) . " AND `" . DB_PREFIX . DATABASE_VISITORS . "`.`entrance`<=" . DBManager::RealEscape($this->Delimiters[1]) . ") as `A7`,
		(SELECT count((id)) FROM `" . DB_PREFIX . DATABASE_VISITORS . "` WHERE (IF(`closed`>0,`closed`," . $endOfAggregatedDay . ")-`entrance`)<3600 AND (IF(`closed`>0,`closed`," . $endOfAggregatedDay . ")-`entrance`)>=1800 AND `" . DB_PREFIX . DATABASE_VISITORS . "`.`entrance`>=" . DBManager::RealEscape($this->Delimiters[0]) . " AND `" . DB_PREFIX . DATABASE_VISITORS . "`.`entrance`<=" . DBManager::RealEscape($this->Delimiters[1]) . ") as `A6`,
		(SELECT count((id)) FROM `" . DB_PREFIX . DATABASE_VISITORS . "` WHERE (IF(`closed`>0,`closed`," . $endOfAggregatedDay . ")-`entrance`)<1800 AND (IF(`closed`>0,`closed`," . $endOfAggregatedDay . ")-`entrance`)>=900 AND `" . DB_PREFIX . DATABASE_VISITORS . "`.`entrance`>=" . DBManager::RealEscape($this->Delimiters[0]) . " AND `" . DB_PREFIX . DATABASE_VISITORS . "`.`entrance`<=" . DBManager::RealEscape($this->Delimiters[1]) . ") as `A5`,
		(SELECT count((id)) FROM `" . DB_PREFIX . DATABASE_VISITORS . "` WHERE (IF(`closed`>0,`closed`," . $endOfAggregatedDay . ")-`entrance`)<900 AND (IF(`closed`>0,`closed`," . $endOfAggregatedDay . ")-`entrance`)>=600 AND `" . DB_PREFIX . DATABASE_VISITORS . "`.`entrance`>=" . DBManager::RealEscape($this->Delimiters[0]) . " AND `" . DB_PREFIX . DATABASE_VISITORS . "`.`entrance`<=" . DBManager::RealEscape($this->Delimiters[1]) . ") as `A4`,
		(SELECT count((id)) FROM `" . DB_PREFIX . DATABASE_VISITORS . "` WHERE (IF(`closed`>0,`closed`," . $endOfAggregatedDay . ")-`entrance`)<600 AND (IF(`closed`>0,`closed`," . $endOfAggregatedDay . ")-`entrance`)>=300 AND `" . DB_PREFIX . DATABASE_VISITORS . "`.`entrance`>=" . DBManager::RealEscape($this->Delimiters[0]) . " AND `" . DB_PREFIX . DATABASE_VISITORS . "`.`entrance`<=" . DBManager::RealEscape($this->Delimiters[1]) . ") as `A3`,
		(SELECT count((id)) FROM `" . DB_PREFIX . DATABASE_VISITORS . "` WHERE (IF(`closed`>0,`closed`," . $endOfAggregatedDay . ")-`entrance`)<300 AND (IF(`closed`>0,`closed`," . $endOfAggregatedDay . ")-`entrance`)>=60 AND `" . DB_PREFIX . DATABASE_VISITORS . "`.`entrance`>=" . DBManager::RealEscape($this->Delimiters[0]) . " AND `" . DB_PREFIX . DATABASE_VISITORS . "`.`entrance`<=" . DBManager::RealEscape($this->Delimiters[1]) . ") as `A2`,
		(SELECT count((id)) FROM `" . DB_PREFIX . DATABASE_VISITORS . "` WHERE (IF(`closed`>0,`closed`," . $endOfAggregatedDay . ")-`entrance`)<60 AND `" . DB_PREFIX . DATABASE_VISITORS . "`.`entrance`>=" . DBManager::RealEscape($this->Delimiters[0]) . " AND `" . DB_PREFIX . DATABASE_VISITORS . "`.`entrance`<=" . DBManager::RealEscape($this->Delimiters[1]) . ") as `A1`
		FROM `" . DB_PREFIX . DATABASE_VISITORS . "`;");
        $row = DBManager::FetchArray($result);

        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_DURATIONS . "` WHERE" . $this->GetDateMatch() . ";");
        for ($int = 1; $int < 8; $int++)
            if (!empty($row["A" . $int]))
                DBManager::Execute(true, "INSERT IGNORE INTO `" . DB_PREFIX . DATABASE_STATS_AGGS_DURATIONS . "` (`year`,`month`,`day`,`duration`,`amount`) VALUES (" . $this->GetSQLDateValues() . ",'" . DBManager::RealEscape($int) . "','" . DBManager::RealEscape($row["A" . $int]) . "');");
    }
}

class StatisticPeriod
{
    public $DayCount;
    public $Delimiters;
    public $Day = 0;
    public $Month = 0;
    public $Year;
    public $Loaded = false;
    public $ConversionsTotal;
    public $VisitorsUniqueHour;
    public $VisitorsTotal;
    public $VisitorsUnique;
    public $VisitorsRecurringHour;
    public $VisitorsRecurringTotal;
    public $PageImpressionsHour = 0;
    public $PageImpressionsTotal = 0;
    public $AVGTimeOnSiteTotal = 0;
    public $AVGTimeOnPageTotal = 0;
    public $AVGTimeInChat = 0;
    public $AVGWaitingTime = 0;
    public $AVGPagesTotal = 0;
    public $AVGTicketResponseTime = 0;
    public $AVGTicketResolveTime = 0;
    public $VisitorBouncesHour = 0;
    public $VisitorBouncesTotal = 0;
    public $ChatsTotal = 0;
    public $TicketsTotal = 0;
    public $ChatsPagesTotal = 0;
    public $ChatsPagesHour = 0;
    public $ChatsDeclinedTotal = 0;
    public $ChatsAcceptedTotal = 0;
    public $ChatsMissedTotal = 0;
    public $FromSearchEngineHour = 0;
    public $FromSearchEngineTotal = 0;
    public $FromReferrerHour = 0;
    public $ConversionsHour = 0;
    public $FromReferrerTotal = 0;
    public $ChatAvailabilitySpans;
    public $ChatAvailabilityTotal = 0;
    public $BrowserInstancesTotal = 0;
    public $ChatPagesTotal = 0;
    public $BrowserInstancesHour = 0;
    public $AVGBrowserInstances = 0;
    public $JavascriptTotal = 0;
    public $JavascriptHour = 0;
    public $ChatPagesHour = 0;
    public $DeviceTabletHour = 0;
    public $DeviceMobileHour = 0;
    public $QueryAmountTotal = 0;
    public $DirectAccessTotal = 0;
    public $CrawlerAccessTotal = 0;
    public $KnowledgebaseQueryAmountTotal = 0;
    public $Microtime = 0;
    public $Aggregated = 0;
    public $TCP = 0;
    public $Tops;
    public $Type;
    public $TopVisitorTables;
    public $TopBrowserURLTables;
    public $Closed;
    public $Days;
    public $Months;
    public $CreateReport;
    public $CreateVisitorList;
    public $IncludeBHVisitors;
    public $IncludeBHChats;
    public $IncludeBDVisitors;
    public $IncludeBDChats;
    public $IncludeBMVisitors;
    public $IncludeBMChats;
    public $IncludeBOAvailability;
    public $IncludeBOChats;
    public $IncludeBOFeedbacks;
    public $IncludeBOTickets;
    public $IncludeBOInvites;
    public $IncludeTOPSystems;
    public $IncludeTOPOrigins;
    public $IncludeTOPVisits;
    public $IncludeTOPISPs;
    public $IncludeTOPPages;
    public $IncludeTOPEntranceExit;
    public $IncludeTOPSearch;
    public $IncludeTOPReferrers;
    public $IncludeTOPDomains;
    public $IncludeTOPKnowledgebase;

    function __construct($_year, $_month, $_day, $_aggregated, $_microtime)
    {
        $this->Year = $_year;
        $this->Month = $_month;
        $this->Day = $_day;
        $this->Aggregated = $_aggregated;
        $this->Microtime = $_microtime;
        $this->TopVisitorTables = array(DATABASE_STATS_AGGS_BROWSERS => "browser", DATABASE_STATS_AGGS_RESOLUTIONS => "resolution", DATABASE_STATS_AGGS_VISITS => "visits", DATABASE_STATS_AGGS_COUNTRIES => "country", DATABASE_STATS_AGGS_SYSTEMS => "system", DATABASE_STATS_AGGS_LANGUAGES => "language", DATABASE_STATS_AGGS_CITIES => "city", DATABASE_STATS_AGGS_REGIONS => "region", DATABASE_STATS_AGGS_ISPS => "isp");
        $this->TopBrowserURLTables = array(DATABASE_STATS_AGGS_REFERRERS => "referrer", DATABASE_STATS_AGGS_PAGES => "url", DATABASE_STATS_AGGS_PAGES_EXIT => "url", DATABASE_STATS_AGGS_PAGES_ENTRANCE => "url", DATABASE_STATS_AGGS_SEARCH_ENGINES => "domain");
    }

    function GetNoneAggregatedDateMatch()
    {
        if ($this->Type == STATISTIC_PERIOD_TYPE_DAY)
            $_sql = " `day`='" . DBManager::RealEscape($this->Day) . "' AND `month`='" . DBManager::RealEscape($this->Month) . "' AND `year`='" . DBManager::RealEscape($this->Year) . "'";
        else if ($this->Type == STATISTIC_PERIOD_TYPE_MONTH)
            $_sql = " `month`='" . DBManager::RealEscape($this->Month) . "' AND `year`='" . DBManager::RealEscape($this->Year) . "'";
        else
            $_sql = " `year`='" . DBManager::RealEscape($this->Year) . "'";
        return $_sql;
    }

    function GetDateMatch($_year = true, $_month = true, $_day = true, $_sql = "")
    {
        if ($_day) $_sql .= " `day`='" . DBManager::RealEscape(($this->Type == STATISTIC_PERIOD_TYPE_DAY) ? $this->Day : 0) . "'";
        if ($_month) $_sql .= ((!empty($_sql)) ? " AND" : "") . " `month`='" . DBManager::RealEscape(($this->Type != STATISTIC_PERIOD_TYPE_YEAR) ? $this->Month : 0) . "'";
        if ($_year) $_sql .= ((!empty($_sql)) ? " AND" : "") . " `year`='" . DBManager::RealEscape($this->Year) . "'";
        return $_sql;
    }

    function GetSQLDateValues()
    {
        if ($this->Type == STATISTIC_PERIOD_TYPE_DAY)
            return "'" . DBManager::RealEscape($this->Year) . "','" . DBManager::RealEscape($this->Month) . "','" . DBManager::RealEscape($this->Day) . "'";
        else if ($this->Type == STATISTIC_PERIOD_TYPE_MONTH)
            return "'" . DBManager::RealEscape($this->Year) . "','" . DBManager::RealEscape($this->Month) . "','" . DBManager::RealEscape(0) . "'";
        else
            return "'" . DBManager::RealEscape($this->Year) . "','" . DBManager::RealEscape(0) . "','" . DBManager::RealEscape(0) . "'";
    }

    function Load()
    {
        $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_STATS_AGGS . "` WHERE" . $this->GetDateMatch() . ";");
        if (DBManager::GetRowCount($result) === 1) {
            $this->Loaded = true;
            $row = DBManager::FetchArray($result);
            $this->AVGTimeOnSiteTotal = $row["avg_time_site"];
            $this->VisitorsTotal = $row["sessions"];
            $this->VisitorsUnique = $row["visitors_unique"];
            $this->ConversionsTotal = $row["conversions"];

            $resultc = DBManager::Execute(true, "SELECT SUM(`amount`) AS `csam`,SUM(`multi`) AS `csmu`,SUM(`declined`) AS `csde`,SUM(`accepted`) AS `csac` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_CHATS . "` WHERE" . $this->GetNoneAggregatedDateMatch() . " AND `group_id`!='';");
            if ($rowc = DBManager::FetchArray($resultc)) {
                $this->ChatsTotal = abs($rowc["csam"]);
                $this->ChatsDeclinedTotal = abs($rowc["csde"]);
                $this->ChatsAcceptedTotal = abs($rowc["csac"]);
                $this->ChatsMissedTotal = abs(($rowc["csam"]) - ($rowc["csde"] + $rowc["csac"]));
            }

            $resultc = DBManager::Execute(true, "SELECT avg_duration,avg_waiting_time,amount FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_CHATS . "` WHERE" . $this->GetNoneAggregatedDateMatch() . " AND `group_id`!='';");
            while ($rowc = DBManager::FetchArray($resultc)) {
                $this->AVGTimeInChat += abs($rowc["avg_duration"] * $rowc["amount"]);
                $this->AVGWaitingTime += abs($rowc["avg_waiting_time"] * $rowc["amount"]);
            }

            if (!empty($this->ChatsTotal)) {
                $this->AVGWaitingTime = Num::Divide($this->AVGWaitingTime, $this->ChatsTotal, false, true);
                $this->AVGTimeInChat = Num::Divide($this->AVGTimeInChat, $this->ChatsTotal, false, true);
            }

            $row = DBManager::FetchArray(DBManager::Execute(true, "SELECT SUM(`seconds`) AS `avail` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_AVAILABILITIES . "` WHERE `user_id`='everyoneintern' AND" . $this->GetNoneAggregatedDateMatch() . ";"));
            $this->ChatAvailabilityTotal = $row["avail"];

            $row = DBManager::FetchArray(DBManager::Execute(true, "SELECT SUM(`amount`) AS `ttickets`, SUM(`responses`) AS `tresponses`, SUM(`avg_response_time`*`responses`) AS `tavgresponses`, SUM(`resolves`) AS `tresolves`, SUM(`avg_resolve_time`*`resolves`) AS `tavgresolves` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_TICKETS . "` WHERE `group_id` != '' AND" . $this->GetNoneAggregatedDateMatch() . ";"));
            $this->TicketsTotal = $row["ttickets"];
            $this->AVGTicketResponseTime = $row["tavgresponses"] / max($row["tresponses"], 1);
            $this->AVGTicketResolveTime = $row["tavgresolves"] / max($row["tresolves"], 1);

            $row = DBManager::FetchArray(DBManager::Execute(true, "SELECT SUM(`amount`) AS `queries` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_QUERIES . "` INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_QUERIES . "` ON `" . DB_PREFIX . DATABASE_STATS_AGGS_QUERIES . "`.query=`" . DB_PREFIX . DATABASE_VISITOR_DATA_QUERIES . "`.id WHERE`" . DB_PREFIX . DATABASE_VISITOR_DATA_QUERIES . "`.`query`!='' AND `" . DB_PREFIX . DATABASE_STATS_AGGS_QUERIES . "`.`type`=0 AND" . $this->GetDateMatch() . ";"));
            $this->QueryAmountTotal = $row["queries"];

            $row = DBManager::FetchArray(DBManager::Execute(true, "SELECT SUM(`amount`) AS `queries` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_QUERIES . "` INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_QUERIES . "` ON `" . DB_PREFIX . DATABASE_STATS_AGGS_QUERIES . "`.query=`" . DB_PREFIX . DATABASE_VISITOR_DATA_QUERIES . "`.id WHERE`" . DB_PREFIX . DATABASE_VISITOR_DATA_QUERIES . "`.`query`!='' AND `" . DB_PREFIX . DATABASE_STATS_AGGS_QUERIES . "`.`type`=1 AND" . $this->GetDateMatch() . ";"));
            $this->KnowledgebaseQueryAmountTotal = $row["queries"];

            $row = DBManager::FetchArray(DBManager::Execute(true, "SELECT SUM(`amount`) AS `crawlers` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_CRAWLERS . "` WHERE" . $this->GetDateMatch() . ";"));
            $this->CrawlerAccessTotal = $row["crawlers"];

            if ($this->VisitorsTotal > 0) {
                $this->AVGPagesTotal = Num::Divide($this->PageImpressionsTotal, $this->VisitorsTotal, StatisticProvider::$RoundPrecision);
                $this->AVGBrowserInstances = Num::Divide($this->BrowserInstancesTotal, $this->VisitorsTotal, StatisticProvider::$RoundPrecision);
            }
            if ($this->AVGTimeOnSiteTotal > 0 && $this->AVGPagesTotal > 0)
                $this->AVGTimeOnPageTotal = Num::Divide($this->AVGTimeOnSiteTotal, $this->AVGPagesTotal, 4);

            $this->DirectAccessTotal = $this->VisitorsTotal - $this->FromReferrerTotal - $this->FromSearchEngineTotal;
            $this->TCP = round($this->PageImpressionsTotal * 0.50 / 1000, 4);
            $this->LoadTopTable(3, 100, array(DATABASE_STATS_AGGS_QUERIES, DATABASE_VISITOR_DATA_QUERIES), array("query", "query"), " AND `" . DB_PREFIX . DATABASE_STATS_AGGS_QUERIES . "`.`type`=0", $this->QueryAmountTotal);
            $this->LoadTopTable(0, 32, array(DATABASE_STATS_AGGS_BROWSERS, DATABASE_VISITOR_DATA_BROWSERS), array("browser", "browser"), true, $this->VisitorsTotal);
            $this->LoadTopTable(1, 32, array(DATABASE_STATS_AGGS_SYSTEMS, DATABASE_VISITOR_DATA_SYSTEMS), array("system", "system"), true, $this->VisitorsTotal);
            $this->LoadTopTable(2, 32, array(DATABASE_STATS_AGGS_COUNTRIES), array("country", "country"), true, $this->VisitorsTotal);
            $this->LoadTopTable(4, 32, array(DATABASE_STATS_AGGS_CITIES, DATABASE_VISITOR_DATA_CITIES), array("city", "city"), true, $this->VisitorsTotal);
            $this->LoadTopTable(5, 32, array(DATABASE_STATS_AGGS_RESOLUTIONS, DATABASE_VISITOR_DATA_RESOLUTIONS), array("resolution", "resolution"), true, $this->VisitorsTotal);
            $this->LoadTopTable(6, 32, array(DATABASE_STATS_AGGS_LANGUAGES), array("language", "language"), true, $this->VisitorsTotal);
            $this->LoadTopTable(7, 32, array(DATABASE_STATS_AGGS_REGIONS, DATABASE_VISITOR_DATA_REGIONS), array("region", "region"), true, $this->VisitorsTotal);
            $this->LoadTopTable(11, 32, array(DATABASE_STATS_AGGS_VISITS), array("visits", "visits"), true, $this->VisitorsTotal, false);
            $this->LoadTopTable(12, 100, array(DATABASE_STATS_AGGS_ISPS, DATABASE_VISITOR_DATA_ISPS), array("isp", "isp"), true, $this->VisitorsTotal, false);
            $this->LoadTopTable(16, 100, array(DATABASE_STATS_AGGS_CRAWLERS, DATABASE_VISITOR_DATA_CRAWLERS), array("crawler", "crawler"), true, $this->CrawlerAccessTotal, false);
            $this->LoadTopTable(13, 32, array(DATABASE_STATS_AGGS_DURATIONS), array("duration", "duration"), true, $this->VisitorsTotal, false, "amount", "duration", "ASC");
            $this->LoadTopTable(14, 100, array(DATABASE_STATS_AGGS_DOMAINS, DATABASE_VISITOR_DATA_DOMAINS), array("domain", "domain"), true, $this->PageImpressionsTotal);
            $this->LoadURLTable(DATABASE_STATS_AGGS_PAGES, 9, 90, false, $this->PageImpressionsTotal);
            $this->LoadURLTable(DATABASE_STATS_AGGS_PAGES, 10, 90, true, $this->PageImpressionsTotal);
            $this->LoadURLTable(DATABASE_STATS_AGGS_PAGES_ENTRANCE, 17, 90, false, $this->BrowserInstancesTotal - $this->ChatPagesTotal);
            $this->LoadURLTable(DATABASE_STATS_AGGS_PAGES_ENTRANCE, 18, 90, true, $this->BrowserInstancesTotal - $this->ChatPagesTotal);
            $this->LoadURLTable(DATABASE_STATS_AGGS_PAGES_EXIT, 19, 90, false, $this->BrowserInstancesTotal - $this->ChatPagesTotal);
            $this->LoadURLTable(DATABASE_STATS_AGGS_PAGES_EXIT, 20, 90, true, $this->BrowserInstancesTotal - $this->ChatPagesTotal);
            $this->LoadReferrerTable(30, 80, DATABASE_STATS_AGGS_REFERRERS, true, $this->FromReferrerTotal);
            $this->LoadReferrerTable(31, 80, DATABASE_STATS_AGGS_REFERRERS, false, $this->FromReferrerTotal, "`" . DB_PREFIX . DATABASE_VISITOR_DATA_DOMAINS . "`.`domain`");
            $this->LoadSearchEngineTable(15, 80);
            $this->LoadKnowledgebaseTables();

            $this->Tops[21] = array();
            $result = DBManager::Execute(true, "SELECT `title`,`description`,`id` AS `gid`,(SELECT SUM(`amount`) FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_GOALS . "` WHERE" . $this->GetDateMatch() . " AND `goal`=`" . DB_PREFIX . DATABASE_GOALS . "`.`id`) AS `gcount` FROM `" . DB_PREFIX . DATABASE_GOALS . "` ORDER BY `ind` ASC;");
            while ($row = DBManager::FetchArray($result)) {
                if ($this->VisitorsTotal > 0 && !empty($row["gcount"])) {
                    $tqueries = array();
                    $results = DBManager::Execute(true, "SELECT `t1`.`amount`,`t2`.`query` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_GOALS_QUERIES . "` AS `t1` INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_QUERIES . "` AS `t2` ON `t1`.`query`=`t2`.`id` WHERE" . $this->GetDateMatch() . " AND `t1`.`goal`='" . DBManager::RealEscape($row["gid"]) . "' ORDER BY `t1`.`amount` DESC LIMIT " . StatisticProvider::$DayItemAmount . ";");
                    while ($rows = DBManager::FetchArray($results))
                        $tqueries[] = array("qa", $rows["query"], $rows["amount"]);
                    $this->Tops[21][$row["gid"]] = array($row["gcount"], Num::Divide((100 * $row["gcount"]), $this->VisitorsUnique, StatisticProvider::$RoundPrecision), 100 - Num::Divide((100 * $row["gcount"]), $this->VisitorsUnique, false, true), $row["title"], $row["description"], $tqueries);
                } else
                    $this->Tops[21][$row["gid"]] = array(0, 0, 100, $row["title"], $row["description"]);
            }
            return true;
        }
        return false;
    }

    function GetVisitorsHTML()
    {
        $html_users = "";
        $html_user = IOStruct::GetFile(TEMPLATE_HTML_STATS_USERS_USER);
        $html_url = IOStruct::GetFile(TEMPLATE_HTML_STATS_USERS_URL);
        $html_body = IOStruct::GetFile(TEMPLATE_HTML_STATS_USERS_BODY);
        $html_body = str_replace("<!--status-->", ($this->Closed) ? "<!--lang_stats_status_closed-->" : "<!--lang_stats_status_open-->", $html_body);
        $vcount = Visitor::Build(true, " WHERE `entrance`>='" . DBManager::RealEscape($this->Delimiters[0]) . "' AND `entrance`<='" . DBManager::RealEscape($this->Delimiters[1]) . "'", " LIMIT " . StatisticProvider::$MaxUsersAmount, $this->Delimiters[0]);
        $count = 1;
        foreach (Server::$Visitors as $visitor) {
            $user = $html_user;
            $user = str_replace("<!--entrance-->", date("H:i:s", $visitor->FirstActive), $user);
            $user = str_replace("<!--exit-->", date("H:i:s", $visitor->ExitTime), $user);
            $user = str_replace("<!--visits-->", max($visitor->VisitsDay, $visitor->Visits), $user);
            $user = str_replace("<!--visits_day-->", $visitor->VisitsDay, $user);
            $user = str_replace("<!--system-->", ((!empty($visitor->OperatingSystem)) ? $visitor->OperatingSystem : "<!--lang_stats_unknown-->"), $user);
            $user = str_replace("<!--browser-->", ((!empty($visitor->Browser)) ? $visitor->Browser : "<!--lang_stats_unknown-->"), $user);
            $user = str_replace("<!--country_name-->", ((!empty($visitor->GeoCountryName)) ? $visitor->GeoCountryName : "<!--lang_stats_unknown-->"), $user);
            $user = str_replace("<!--city-->", ((!empty($visitor->GeoCity)) ? $visitor->GeoCity : "<!--lang_stats_unknown-->"), $user);
            $user = str_replace("<!--region-->", $visitor->GeoRegion, $user);
            $user = str_replace("<!--isp-->", str_replace("'", "", $visitor->GeoISP), $user);
            $user = str_replace("<!--ip-->", $visitor->IP, $user);
            $user = str_replace("<!--host-->", str_replace("'", "", $visitor->Host), $user);
            $user = str_replace("<!--id-->", $visitor->UserId, $user);
            $user = str_replace("<!--vclass-->", (max($visitor->VisitsDay, $visitor->Visits) == 1) ? "vn" : (($visitor->VisitsDay > 1) ? "vm" : "vs"), $user);
            $urls = "";
            $id = 1;
            $oid = 1;
            $bcount = 1;
            foreach ($visitor->Browsers as $browser) {
                if ($browser->Overlay || empty($browser->History))
                    continue;

                $ucount = 0;
                foreach ($browser->History as $hurl) {
                    if ($id == 1 && !Is::Null($hurl->Referrer->GetAbsoluteUrl()) && $hurl->Referrer->GetAbsoluteUrl() != $hurl->Url->GetAbsoluteUrl()) {
                        $url = $html_url;
                        $url = str_replace("<!--page-->", "Referrer:&nbsp;&nbsp;<a href=\"" . @htmlentities(StatisticProvider::$Dereferrer . $hurl->Referrer->GetAbsoluteUrl(), ENT_QUOTES, 'UTF-8') . "\" target=\"_blank\"><b>" . @htmlentities($hurl->Referrer->GetAbsoluteUrl(), ENT_QUOTES, 'UTF-8') . "</b></a>", $url);
                        $url = str_replace("<!--entrance-->", "&nbsp;", $url);
                        $url = str_replace("<!--id-->", "&nbsp;", $url);
                        $url = str_replace("<!--oid-->", $oid++, $url);
                        $urls .= $url;
                    }
                    $urls = str_replace("<!--exit-->", date("H:i:s", $hurl->Entrance), $urls);
                    $url = $html_url;
                    $url = str_replace("<!--page-->", "<!--lang_stats_browser--> " . $bcount . ":&nbsp;&nbsp;<a href=\"" . htmlentities(StatisticProvider::$Dereferrer . $hurl->Url->GetAbsoluteUrl(), ENT_QUOTES, 'UTF-8') . "\" target=\"_blank\"><b>" . @htmlentities($hurl->Url->GetAbsoluteUrl(), ENT_QUOTES, 'UTF-8') . "</b></a>", $url);
                    $url = str_replace("<!--entrance-->", date("H:i:s", $hurl->Entrance), $url);
                    $url = str_replace("<!--id-->", $id++, $url);
                    $url = str_replace("<!--oid-->", $oid++, $url);
                    $urls .= $url;
                    $ucount++;
                }

                if ($ucount > 0)
                    $bcount++;

                if ($browser->Type == BROWSER_TYPE_CHAT)
                    $urls = str_replace("<!--exit-->", date("H:i:s", $browser->LastActive + Server::$Configuration->File["timeout_track"]), $urls);
                else
                    $urls = str_replace("<!--exit-->", date("H:i:s", $browser->LastActive), $urls);
            }

            if ($id > 1) {
                $user = str_replace("<!--pages-->", $id - 1, $user);
                $html_users .= $user . str_replace("<!--exit-->", date("H:i:s", $visitor->ExitTime), $urls);
                $html_users = str_replace("<!--number-->", $count++, $html_users);
            }
        }
        $html_body = str_replace("<!--visitors-->", $html_users, $html_body);
        $html_body = str_replace("<!--amount-->", $vcount, $html_body);

        Server::$Visitors = array();
        Visitor::Build();
        return $html_body;
    }

    function GetHTML()
    {
        $html = IOStruct::GetFile(TEMPLATE_HTML_STATS_BODY);
        $html = str_replace("<!--quick_value_11-->", number_format($this->VisitorsTotal, 0, ".", "."), $html);
        $html = str_replace("<!--quick_value_17-->", number_format($this->VisitorsUnique, 0, ".", "."), $html);
        $html = str_replace("<!--quick_value_18-->", Num::Divide((100 * $this->VisitorsUnique), $this->VisitorsTotal, StatisticProvider::$RoundPrecision), $html);
        $html = str_replace("<!--quick_value_12-->", "const", $html);
        $html = str_replace("<!--quick_value_13-->", number_format($this->VisitorsTotal - $this->VisitorsRecurringTotal, 0, ".", "."), $html);
        $html = str_replace("<!--quick_value_14-->", Num::Divide((100 * ($this->VisitorsTotal - $this->VisitorsRecurringTotal)), $this->VisitorsTotal, StatisticProvider::$RoundPrecision), $html);
        $html = str_replace("<!--quick_value_15-->", number_format($this->VisitorsRecurringTotal, 0, ".", "."), $html);
        $html = str_replace("<!--quick_value_16-->", Num::Divide((100 * $this->VisitorsRecurringTotal), $this->VisitorsTotal, StatisticProvider::$RoundPrecision), $html);
        $html = str_replace("<!--quick_value_21-->", Num::Divide((100 * $this->VisitorBouncesTotal), $this->VisitorsTotal, StatisticProvider::$RoundPrecision), $html);
        $html = str_replace("<!--quick_value_22-->", "const", $html);
        $html = str_replace("<!--quick_value_23-->", number_format($this->VisitorBouncesTotal, 0, ".", "."), $html);
        $html = str_replace("<!--quick_value_31-->", number_format($this->ChatsTotal, 0, ".", "."), $html);
        $html = str_replace("<!--quick_value_32-->", "const", $html);
        $html = str_replace("<!--quick_value_33-->", $this->FormatTimespan($this->AVGWaitingTime), $html);
        $html = str_replace("<!--quick_value_41-->", Num::Divide((100 * $this->ChatAvailabilityTotal), $this->GetSecondsOfPeriodGroup(null, true), StatisticProvider::$RoundPrecision), $html);
        $html = str_replace("<!--quick_value_42-->", "const", $html);
        $html = str_replace("<!--quick_value_43-->", $this->FormatTimespan($this->ChatAvailabilityTotal), $html);
        $html = str_replace("<!--quick_value_44-->", $this->FormatTimespan($this->GetSecondsOfPeriodGroup(null, true)), $html);
        $html = str_replace("<!--quick_value_51-->", Num::Divide((100 * $this->ConversionsTotal), $this->VisitorsUnique, StatisticProvider::$RoundPrecision), $html);
        $html = str_replace("<!--quick_value_52-->", "const", $html);
        $html = str_replace("<!--quick_value_53-->", number_format($this->ConversionsTotal, 0, ".", "."), $html);
        $html = str_replace("<!--quick_value_tickets-->", number_format($this->TicketsTotal, 0, ".", "."), $html);
        $html = str_replace("<!--quick_value_ticket_response_time-->", $this->FormatTimespan($this->AVGTicketResponseTime), $html);
        $html = str_replace("<!--quick_value_ticket_resolve_time-->", $this->FormatTimespan($this->AVGTicketResolveTime), $html);
        $html = str_replace("<!--status-->", ($this->Closed) ? "<!--lang_stats_status_closed-->" : "<!--lang_stats_status_open-->", $html);
        $html = str_replace("<!--stat_type-->", $this->Type, $html);
        $html = str_replace("<--show_links_months-->", ($this->Type == STATISTIC_PERIOD_TYPE_YEAR) ? "" : " style=\"display:none;\"", $html);
        $html = str_replace("<--show_links_days-->", ($this->Type == STATISTIC_PERIOD_TYPE_MONTH) ? "" : " style=\"display:none;\"", $html);
        $html = str_replace("<!--stats_top_browsers-->", (($this->IncludeTOPSystems) ? $this->RenderTopTable(0, "<!--lang_stats_browsers-->", "<!--lang_stats_browser-->") . "<br>" : ""), $html);
        $html = str_replace("<!--stats_top_systems-->", (($this->IncludeTOPSystems) ? $this->RenderTopTable(1, "<!--lang_stats_systems-->", "<!--lang_stats_system-->") . "<br>" : ""), $html);
        $html = str_replace("<!--stats_top_resolutions-->", (($this->IncludeTOPSystems) ? $this->RenderTopTable(5, "<!--lang_stats_resolutions-->", "<!--lang_stats_resolution-->") . "<br>" : ""), $html);
        $html = str_replace("<!--stats_top_countries-->", (($this->IncludeTOPOrigins) ? $this->RenderTopTable(2, "<!--lang_stats_countries-->", "<!--lang_stats_country-->") . "<br>" : ""), $html);
        $html = str_replace("<!--stats_top_languages-->", (($this->IncludeTOPOrigins) ? $this->RenderTopTable(6, "<!--lang_stats_languages-->", "<!--lang_stats_language-->") . "<br>" : ""), $html);
        $html = str_replace("<!--stats_top_regions-->", (($this->IncludeTOPOrigins) ? $this->RenderTopTable(7, "<!--lang_stats_regions-->", "<!--lang_stats_region-->") . "<br>" : ""), $html);
        $html = str_replace("<!--stats_top_cities-->", (($this->IncludeTOPOrigins) ? $this->RenderTopTable(4, "<!--lang_stats_cities-->", "<!--lang_stats_city-->") . "<br>" : ""), $html);
        $html = str_replace("<!--stats_top_visits-->", (($this->IncludeTOPVisits) ? $this->RenderTopTable(11, "<!--lang_stats_visits-->", "<!--lang_stats_visits-->") . "<br>" : ""), $html);
        $html = str_replace("<!--stats_top_isps-->", (($this->IncludeTOPISPs) ? $this->RenderTopTable(12, "<!--lang_stats_isps-->", "<!--lang_stats_isp-->") . "<br>" : ""), $html);
        $html = str_replace("<!--stats_top_duration-->", (($this->IncludeTOPVisits) ? $this->RenderTopTable(13, "<!--lang_stats_time_on_page-->", "<!--lang_stats_duration-->") . "<br>" : ""), $html);
        $html = str_replace("<!--topvs-->", (($this->IncludeTOPSystems) ? "" : "none"), $html);
        $html = str_replace("<!--topvso-->", (($this->IncludeTOPSystems && $this->IncludeTOPOrigins) ? "" : "none"), $html);
        $html = str_replace("<!--topvo-->", (($this->IncludeTOPOrigins) ? "" : "none"), $html);
        $html = str_replace("<!--topvov-->", (($this->IncludeTOPVisits && ($this->IncludeTOPSystems || $this->IncludeTOPOrigins)) ? "" : "none"), $html);
        $html = str_replace("<!--topvv-->", (($this->IncludeTOPVisits) ? "" : "none"), $html);
        $html = str_replace("<!--topvvi-->", (($this->IncludeTOPISPs && ($this->IncludeTOPSystems || $this->IncludeTOPOrigins || $this->IncludeTOPVisits)) ? "" : "none"), $html);
        $html = str_replace("<!--topvi-->", (($this->IncludeTOPISPs) ? "" : "none"), $html);
        $html = str_replace("<!--topv-->", (($this->IncludeTOPSystems || $this->IncludeTOPOrigins || $this->IncludeTOPVisits || $this->IncludeTOPISPs) ? "" : "none"), $html);
        $html = str_replace("<!--stats_top_queries-->", (($this->IncludeTOPSearch) ? $this->RenderTopTable(3, "<!--lang_stats_search_phrases-->", "<!--lang_stats_search_phrase-->") : ""), $html);
        $html = str_replace("<!--stats_top_referrers-->", (($this->IncludeTOPReferrers) ? $this->RenderTopURLTable(30, "<!--lang_stats_referrers-->", "<!--lang_stats_referrer-->", true, "URL", "Domains") . "<br>" : ""), $html);
        $html = str_replace("<!--stats_top_pages-->", (($this->IncludeTOPPages) ? $this->RenderTopURLTable(9, "<!--lang_stats_pages-->", "<!--lang_stats_page-->") . "<br>" : ""), $html);
        $html = str_replace("<!--stats_top_pages_entrance-->", (($this->IncludeTOPEntranceExit) ? $this->RenderTopURLTable(17, "<!--lang_stats_entrance_pages-->", "<!--lang_stats_page-->") . "<br>" : ""), $html);
        $html = str_replace("<!--stats_top_pages_exit-->", (($this->IncludeTOPEntranceExit) ? $this->RenderTopURLTable(19, "<!--lang_stats_exit_pages-->", "<!--lang_stats_page-->") . "<br>" : ""), $html);
        $html = str_replace("<!--stats_top_search_engines-->", (($this->IncludeTOPSearch) ? $this->RenderTopTable(15, "<!--lang_stats_search_engines-->", "<!--lang_stats_search_engines-->") : ""), $html);
        $html = str_replace("<!--stats_top_domains-->", (($this->IncludeTOPDomains) ? $this->RenderTopTable(14, "<!--lang_stats_domains-->", "<!--lang_stats_domain-->") . "<br>" : ""), $html);
        $html = str_replace("<!--stats_top_crawlers-->", (($this->IncludeTOPSearch) ? $this->RenderTopTable(16, "<!--lang_stats_crawlers-->", "<!--lang_stats_crawler-->") . "<br>" : ""), $html);
        $html = str_replace("<!--stats_top_knowledgebase_views-->", (($this->IncludeTOPKnowledgebase) ? $this->RenderTopTable(28, "<!--lang_client_views-->", "<!--lang_stats_page-->") . "<br>" : ""), $html);
        $html = str_replace("<!--stats_top_knowledgebase_highest_rated-->", (($this->IncludeTOPKnowledgebase) ? $this->RenderTopTable(27, "<!--lang_stats_highest_rated-->", "<!--lang_stats_page-->") . "<br>" : ""), $html);
        $html = str_replace("<!--stats_top_knowledgebase_lowest_rated-->", (($this->IncludeTOPKnowledgebase) ? $this->RenderTopTable(26, "<!--lang_stats_lowest_rated-->", "<!--lang_stats_page-->") . "<br>" : ""), $html);
        $html = str_replace("<!--stats_top_knowledgebase_queries-->", (($this->IncludeTOPKnowledgebase) ? $this->RenderTopTable(29, "<!--lang_stats_search_phrases-->", "<!--lang_stats_search_phrase-->") . "<br>" : ""), $html);
        $html = str_replace("<!--toppp-->", (($this->IncludeTOPPages) ? "" : "none"), $html);
        $html = str_replace("<!--topppe-->", (($this->IncludeTOPPages && $this->IncludeTOPEntranceExit) ? "" : "none"), $html);
        $html = str_replace("<!--toppe-->", (($this->IncludeTOPEntranceExit) ? "" : "none"), $html);
        $html = str_replace("<!--toppes-->", (($this->IncludeTOPSearch && ($this->IncludeTOPPages || $this->IncludeTOPEntranceExit)) ? "" : "none"), $html);
        $html = str_replace("<!--topps-->", (($this->IncludeTOPSearch) ? "" : "none"), $html);
        $html = str_replace("<!--toppsr-->", (($this->IncludeTOPReferrers && ($this->IncludeTOPSearch || $this->IncludeTOPEntranceExit || $this->IncludeTOPPages)) ? "" : "none"), $html);
        $html = str_replace("<!--toppr-->", (($this->IncludeTOPReferrers) ? "" : "none"), $html);
        $html = str_replace("<!--topprd-->", (($this->IncludeTOPDomains && ($this->IncludeTOPSearch || $this->IncludeTOPEntranceExit || $this->IncludeTOPPages || $this->IncludeTOPReferrers)) ? "" : "none"), $html);
        $html = str_replace("<!--toppd-->", (($this->IncludeTOPDomains) ? "" : "none"), $html);
        $html = str_replace("<!--topp-->", (($this->IncludeTOPPages || $this->IncludeTOPReferrers || $this->IncludeTOPDomains || $this->IncludeTOPSearch || $this->IncludeTOPEntranceExit) ? "" : "none"), $html);
        $html = str_replace("<!--toppk-->", (($this->IncludeTOPKnowledgebase) ? "" : "none"), $html);
        $html_hours = str_replace("<!--stats_hours_visitors-->", (($this->IncludeBHVisitors) ? $this->GetVisitorsByHour("visitors_unique", "<!--lang_stats_visitors-->") . "<br>" : ""), IOStruct::GetFile(TEMPLATE_HTML_STATS_HOURS));
        $html_hours = str_replace("<!--stats_hours_impressions-->", (($this->IncludeBHVisitors) ? $this->GetVisitorsByHour("page_impressions", "<!--lang_stats_page_impressions-->") . "<br>" : ""), $html_hours);
        $html_hours = str_replace("<!--stats_hours_chats-->", (($this->IncludeBHChats) ? $this->GetChatsByHour() . "<br>" : ""), $html_hours);
        $html_hours = str_replace("<!--stats_hours_operators-->", (($this->IncludeBHChats) ? $this->GetOperatorsByHour() . "<br>" : ""), $html_hours);
        $html = str_replace("<!--hours-->", (($this->IncludeBHVisitors || $this->IncludeBHChats) ? $html_hours : ""), $html);
        $html_operators = str_replace("<!--stats_operator_chats-->", (($this->IncludeBOChats) ? $this->GetChatsByOperator() . "<br>" : ""), IOStruct::GetFile(TEMPLATE_HTML_STATS_OPERATORS));
        $html_operators = str_replace("<!--stats_operator_chat_duration-->", (($this->IncludeBOChats) ? $this->GetChatDurationByOperator() . "<br>" : ""), $html_operators);
        $html_operators = str_replace("<!--stats_operator_chat_response_times-->", (($this->IncludeBOChats) ? $this->GetChatResponseTimeByOperator() . "<br>" : ""), $html_operators);
        $html_operators = str_replace("<!--stats_operator_availability-->", (($this->IncludeBOAvailability) ? $this->GetAvailabilityByOperator() . "<br>" : ""), $html_operators);
        $html_operators = str_replace("<!--stats_operator_tickets-->", (($this->IncludeBOTickets) ? $this->GetTicketsByOperator() . "<br>" : ""), $html_operators);
        $html_operators = str_replace("<!--stats_operator_ticket_response_times-->", (($this->IncludeBOTickets) ? $this->GetTicketResponseTimesByOperator() . "<br>" : ""), $html_operators);
        $html_operators = str_replace("<!--stats_operator_feedbacks-->", (($this->IncludeBOFeedbacks) ? $this->GetFeedbacksByOperator() . "<br>" : ""), $html_operators);
        $html_operators = str_replace("<!--stats_operator_invites-->", (($this->IncludeBOInvites) ? $this->GetInvitesByOperator() . "<br>" : ""), $html_operators);
        $html_groups = str_replace("<!--stats_group_chats-->", (($this->IncludeBOChats) ? $this->GetChatsByGroup() . "<br>" : ""), IOStruct::GetFile(TEMPLATE_HTML_STATS_GROUPS));
        $html_groups = str_replace("<!--stats_group_chat_duration-->", (($this->IncludeBOChats) ? $this->GetChatDurationByGroup() . "<br>" : ""), $html_groups);
        $html_groups = str_replace("<!--stats_group_chat_response_times-->", (($this->IncludeBOChats) ? $this->GetChatResponseTimeByGroup() . "<br>" : ""), $html_groups);
        $html_groups = str_replace("<!--stats_group_availability-->", (($this->IncludeBOAvailability) ? $this->GetAvailabilityByGroup() . "<br>" : ""), $html_groups);
        $html_groups = str_replace("<!--stats_group_tickets-->", (($this->IncludeBOTickets) ? $this->GetTicketsByGroup() . "<br>" : ""), $html_groups);
        $html_groups = str_replace("<!--stats_group_ticket_response_times-->", (($this->IncludeBOTickets) ? $this->GetTicketResponseTimesByGroup() . "<br>" : ""), $html_groups);
        $html_groups = str_replace("<!--stats_group_feedbacks-->", (($this->IncludeBOFeedbacks) ? $this->GetFeedbacksByGroup() . "<br>" : ""), $html_groups);
        $html_groups = str_replace("<!--stats_group_invites-->", (($this->IncludeBOInvites) ? $this->GetInvitesByGroup() . "<br>" : ""), $html_groups);
        $html = str_replace("<!--operators-->", (($this->IncludeBOAvailability || $this->IncludeBOChats || $this->IncludeBOInvites || $this->IncludeBOTickets) ? $html_operators : ""), $html);
        $html = str_replace("<!--groups-->", (($this->IncludeBOAvailability || $this->IncludeBOChats || $this->IncludeBOInvites || $this->IncludeBOTickets) ? $html_groups : ""), $html);
        $html = str_replace("<!--bhvcv-->", (($this->IncludeBHChats && $this->IncludeBHVisitors) ? "" : "none"), $html);
        $html = str_replace("<!--bhcv-->", (($this->IncludeBHChats) ? "" : "none"), $html);
        $html = str_replace("<!--boav-->", (($this->IncludeBOAvailability) ? "" : "none"), $html);
        $html = str_replace("<!--bocv-->", (($this->IncludeBOChats) ? "" : "none"), $html);
        $html = str_replace("<!--bofv-->", (($this->IncludeBOFeedbacks) ? "" : "none"), $html);
        $html = str_replace("<!--boti-->", (($this->IncludeBOTickets) ? "" : "none"), $html);
        $html = str_replace("<!--boin-->", (($this->IncludeBOInvites) ? "" : "none"), $html);
        $html = str_replace("<!--bhvv-->", (($this->IncludeBHVisitors) ? "" : "none"), $html);
        $html = str_replace("<!--boavcv-->", (($this->IncludeBOChats && $this->IncludeBOAvailability) ? "" : "none"), $html);
        $html = str_replace("<!--boav-->", (($this->IncludeBOAvailability) ? "" : "none"), $html);
        if ($this->Type == STATISTIC_PERIOD_TYPE_MONTH) {
            $html_days = str_replace("<!--stats_days_visitors-->", (($this->IncludeBDVisitors) ? $this->GetVisitorsByDays() . "<br>" : ""), IOStruct::GetFile(TEMPLATE_HTML_STATS_DAYS));
            $html_days = str_replace("<!--stats_days_impressions-->", (($this->IncludeBDVisitors) ? $this->GetVisitorsByDays(true) . "<br>" : ""), $html_days);
            $html_days = str_replace("<!--stats_days_chats-->", (($this->IncludeBDChats) ? $this->GetChatsByDays() . "<br>" : ""), $html_days);
            $html_days = str_replace("<!--stats_days_operators-->", (($this->IncludeBDChats) ? $this->GetOperatorsByDays() . "<br>" : ""), $html_days);
            $html_days = str_replace("<!--bdvv-->", (($this->IncludeBDVisitors) ? "" : "none"), $html_days);
            $html_days = str_replace("<!--bdvcv-->", (($this->IncludeBDChats && $this->IncludeBDVisitors) ? "" : "none"), $html_days);
            $html_days = str_replace("<!--bdcv-->", (($this->IncludeBDChats) ? "" : "none"), $html_days);
            $html = str_replace("<!--days-->", (($this->IncludeBDVisitors || $this->IncludeBDChats) ? $html_days : ""), $html);
            $html = str_replace("<!--months-->", "", $html);
        } else if ($this->Type == STATISTIC_PERIOD_TYPE_YEAR) {
            $html_months = str_replace("<!--stats_months_visitors-->", (($this->IncludeBMVisitors) ? $this->GetVisitorsByMonths() . "<br>" : ""), IOStruct::GetFile(TEMPLATE_HTML_STATS_MONTHS));
            $html_months = str_replace("<!--stats_months_impressions-->", (($this->IncludeBMVisitors) ? $this->GetVisitorsByMonths(true) . "<br>" : ""), $html_months);
            $html_months = str_replace("<!--stats_months_chats-->", (($this->IncludeBMChats) ? $this->GetChatsByMonths() . "<br>" : ""), $html_months);
            $html_months = str_replace("<!--stats_months_operators-->", (($this->IncludeBMChats) ? $this->GetOperatorsByMonths() . "<br>" : ""), $html_months);
            $html_months = str_replace("<!--bmvv-->", (($this->IncludeBMVisitors) ? "" : "none"), $html_months);
            $html_months = str_replace("<!--bmvcv-->", (($this->IncludeBMChats && $this->IncludeBMVisitors) ? "" : "none"), $html_months);
            $html_months = str_replace("<!--bmcv-->", (($this->IncludeBMChats) ? "" : "none"), $html_months);
            $html = str_replace("<!--months-->", (($this->IncludeBMVisitors || $this->IncludeBMChats) ? $html_months : ""), $html);
            $html = str_replace("<!--days-->", "", $html);
        } else
            $html = str_replace("<!--days-->", "", $html);

        $html = str_replace("<!--goals-->", $this->GetGoalTable(), $html);
        $html = str_replace("<!--stats_base_table_general-->", $this->GetBaseTable("<!--lang_stats_visitors-->", array("<!--lang_stats_page_impressions-->" => array(number_format($this->PageImpressionsTotal, 0, ".", "."), "const"), "<!--lang_stats_pages_per_visitor-->" => array($this->AVGPagesTotal, "const"), "<!--lang_stats_browser_instances-->" => array(number_format($this->BrowserInstancesTotal, 0, ".", "."), "const"), "<!--lang_stats_browser_instances_per_visitor-->" => array($this->AVGBrowserInstances, "const"), "&#216; <!--lang_stats_average_time_on_site-->" => array($this->FormatTimespan($this->AVGTimeOnSiteTotal), "const"), "&#216; <!--lang_stats_average_time_on_page-->" => array($this->FormatTimespan($this->AVGTimeOnPageTotal), "const"))), $html);
        $html = str_replace("<!--stats_base_table_chat-->", $this->GetBaseTable("Chats", array("Chats" => array(number_format($this->ChatsTotal, 0, ".", "."), "const"), "Chats <!--lang_stats_accepted-->" => array(number_format($this->ChatsAcceptedTotal, 0, ".", ".") . " (" . Num::Divide((100 * $this->ChatsAcceptedTotal), $this->ChatsTotal, StatisticProvider::$RoundPrecision) . "%)", "const"), "Chats <!--lang_stats_declined-->" => array(number_format($this->ChatsDeclinedTotal, 0, ".", ".") . "  (" . Num::Divide((100 * $this->ChatsDeclinedTotal), $this->ChatsTotal, StatisticProvider::$RoundPrecision) . "%)", "const"), "Chats <!--lang_stats_missed-->" => array(number_format($this->ChatsMissedTotal, 0, ".", ".") . "  (" . Num::Divide((100 * $this->ChatsMissedTotal), $this->ChatsTotal, StatisticProvider::$RoundPrecision) . "%)", "const"), "&#216; <!--lang_stats_chat_average_time-->" => array($this->FormatTimespan($this->AVGTimeInChat), "const"), "&#216; <!--lang_stats_chat_average_waiting_time-->" => array($this->FormatTimespan($this->AVGWaitingTime), "const"))), $html);
        $html = str_replace("<!--stats_base_table_sources-->", $this->GetBaseTable("<!--lang_stats_traffic_sources-->", array("<!--lang_stats_search_engines-->" => array(number_format($this->FromSearchEngineTotal, 0, ".", ".") . " (" . Num::Divide((100 * $this->FromSearchEngineTotal), $this->VisitorsTotal, StatisticProvider::$RoundPrecision) . "%)", "const"), "<!--lang_stats_referrer-->" => array(number_format($this->FromReferrerTotal, 0, ".", ".") . " (" . Num::Divide((100 * $this->FromReferrerTotal), $this->VisitorsTotal, StatisticProvider::$RoundPrecision) . "%)", "const"), "<!--lang_stats_direct_access-->" => array(number_format($this->DirectAccessTotal, 0, ".", ".") . " (" . Num::Divide((100 * ($this->DirectAccessTotal)), $this->VisitorsTotal, StatisticProvider::$RoundPrecision) . "%)", "const"))), $html);
        $html = str_replace("<!--stats_base_table_js-->", $this->GetBaseTable("Javascript", array("<!--lang_stats_status_activated-->" => array(number_format($this->JavascriptTotal, 0, ".", ".") . " (" . Num::Divide((100 * $this->JavascriptTotal), $this->VisitorsTotal, StatisticProvider::$RoundPrecision) . "%)", "const"))), $html);
        $html = str_replace("<!--trend-->", "&nbsp;", $html);
        return $html;
    }

    function GetReportHTML($_users)
    {
        $html = IOStruct::GetFile($this->GetFilename(true, $_users));
        $html = str_replace("<!--body_part-->", $html, IOStruct::GetFile(TEMPLATE_HTML_STATS_BASE));
        $html = str_replace("<!--server-->", LIVEZILLA_URL, $html);
        return $html;
    }

    private function GetChatsByOperator($counter = 0, $hrows = "")
    {
        $trow = IOStruct::GetFile(TEMPLATE_HTML_STATS_TOP_ROW);
        $rows = array();
        $graphData = array();
        $result = DBManager::Execute(true, "SELECT *,SUM(`amount`) AS `am`,SUM(`accepted`) AS `acc`,SUM(`declined`) AS `dec`,(SELECT SUM(`amount`) FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_CHATS . "` WHERE" . $this->GetNoneAggregatedDateMatch() . " AND `user_id`!='') AS `total` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_CHATS . "` WHERE" . $this->GetNoneAggregatedDateMatch() . " AND `user_id`!='' GROUP BY `user_id` ORDER BY `am` DESC;");
        while ($row = DBManager::FetchArray($result)) {
            if (isset(Server::$Operators[$row["user_id"]]) && Server::$Operators[$row["user_id"]]->AffectsStatistic(true)) {
                $rows[$row["user_id"]] = str_replace("<!--title-->", ((isset(Server::$Operators[$row["user_id"]])) ? Server::$Operators[$row["user_id"]]->Fullname : "<!--lang_stats_unknown-->"), $trow);
                $rows[$row["user_id"]] = str_replace("<!--rel_amount-->", Num::Divide((100 * $row["am"]), $row["total"], StatisticProvider::$RoundPrecision), $rows[$row["user_id"]]);
                $details = (isset(Server::$Operators[$row["user_id"]]) && Server::$Operators[$row["user_id"]]->IsBot) ? "" : " (" . $row["acc"] . " / " . $row["dec"] . " / " . ($row["am"] - $row["dec"] - $row["acc"]) . ")";
                $rows[$row["user_id"]] = str_replace("<!--abs_amount-->", $row["am"] . $details, $rows[$row["user_id"]]);
                $rows[$row["user_id"]] = str_replace("<!--count-->", ++$counter, $rows[$row["user_id"]]);
                $graphData[$this->GetGraphOperatorIndex(Server::$Operators[$row["user_id"]])] = array($row["am"], $row["acc"], $row["dec"], $row["am"] - $row["dec"] - $row["acc"]);
            }
        }

        foreach (Server::$Operators as $id => $operator)
            if (!isset($rows[$id]) && $operator->AffectsStatistic(true)) {
                $rows[$id] = str_replace("<!--title-->", $operator->Fullname, $trow);
                $rows[$id] = str_replace("<!--rel_amount-->", 0, $rows[$id]);
                $rows[$id] = str_replace("<!--abs_amount-->", "-", $rows[$id]);
                $rows[$id] = str_replace("<!--count-->", ++$counter, $rows[$id]);
                $graphData[$this->GetGraphOperatorIndex($operator)] = array(0, 0, 0, 0);
            }

        foreach ($rows as $hrow)
            $hrows .= $hrow;

        $html = str_replace("<!--rows-->", $hrows, IOStruct::GetFile(TEMPLATE_HTML_STATS_TOP_TABLE));
        $html = str_replace("<!--column_count_width-->", "12", $html);
        $html = str_replace("<!--expand_all-->", "none", $html);
        $html = str_replace("<!--expand_all_block-->", "", $html);
        $html = str_replace("<!--graph-->", $this->GetGraphImageTag($graphData, array(LocalizationManager::$TranslationStrings["stats_chats"], LocalizationManager::$TranslationStrings["stats_chats"], LocalizationManager::$TranslationStrings["stats_accepted"], LocalizationManager::$TranslationStrings["stats_declined"], LocalizationManager::$TranslationStrings["stats_missed"]), true), $html);
        $html = str_replace("<!--width-->", $this->GetGraphWidth(), $html);
        $html = str_replace("<!--column_value_title-->", "<!--lang_stats_operator-->", $html);
        $html = str_replace("<!--description-->", "<!--lang_stats_absolute-->: <!--lang_stats_description_operator_chats-->", $html);
        return str_replace("<!--title-->", "Chats", $html);
    }

    private function GetChatsByGroup($counter = 0, $hrows = "")
    {
        $trow = IOStruct::GetFile(TEMPLATE_HTML_STATS_TOP_ROW);
        $rows = array();
        $graphData = array();
        $result = DBManager::Execute(true, "SELECT *,SUM(`amount`) AS `am`,SUM(`accepted`) AS `acc`,SUM(`declined`) AS `dec`,(SELECT SUM(`amount`) FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_CHATS . "` WHERE" . $this->GetNoneAggregatedDateMatch() . " AND `group_id`!= '') AS `total` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_CHATS . "` WHERE" . $this->GetNoneAggregatedDateMatch() . " AND `group_id`!= '' GROUP BY `group_id` ORDER BY `am` DESC;");
        while ($row = DBManager::FetchArray($result)) {
            if (isset(Server::$Groups[$row["group_id"]])) {
                $rows[$row["group_id"]] = str_replace("<!--title-->", ((isset(Server::$Groups[$row["group_id"]])) ? Server::$Groups[$row["group_id"]]->Id : "<!--lang_stats_unknown-->"), $trow);
                $rows[$row["group_id"]] = str_replace("<!--rel_amount-->", Num::Divide((100 * $row["am"]), $row["total"], StatisticProvider::$RoundPrecision), $rows[$row["group_id"]]);
                $details = " (" . $row["acc"] . " / " . $row["dec"] . " / " . ($row["am"] - $row["dec"] - $row["acc"]) . ")";
                $rows[$row["group_id"]] = str_replace("<!--abs_amount-->", $row["am"] . $details, $rows[$row["group_id"]]);
                $rows[$row["group_id"]] = str_replace("<!--count-->", ++$counter, $rows[$row["group_id"]]);
                $graphData[$row["group_id"]] = array($row["am"], $row["acc"], $row["dec"], $row["am"] - $row["dec"] - $row["acc"]);
            }
        }
        foreach (Server::$Groups as $id => $group)
            if (!isset($rows[$id]) && !$group->IsDynamic) {
                $rows[$id] = str_replace("<!--title-->", $group->Id, $trow);
                $rows[$id] = str_replace("<!--rel_amount-->", 0, $rows[$id]);
                $rows[$id] = str_replace("<!--abs_amount-->", "-", $rows[$id]);
                $rows[$id] = str_replace("<!--count-->", ++$counter, $rows[$id]);
                $graphData[$id] = array(0, 0, 0, 0);
            }
        foreach ($rows as $hrow)
            $hrows .= $hrow;
        $html = str_replace("<!--rows-->", $hrows, IOStruct::GetFile(TEMPLATE_HTML_STATS_TOP_TABLE));
        $html = str_replace("<!--column_count_width-->", "12", $html);
        $html = str_replace("<!--expand_all-->", "none", $html);
        $html = str_replace("<!--expand_all_block-->", "", $html);
        $html = str_replace("<!--graph-->", $this->GetGraphImageTag($graphData, array(LocalizationManager::$TranslationStrings["stats_chats"], LocalizationManager::$TranslationStrings["stats_chats"], LocalizationManager::$TranslationStrings["stats_accepted"], LocalizationManager::$TranslationStrings["stats_declined"], LocalizationManager::$TranslationStrings["stats_missed"]), true), $html);
        $html = str_replace("<!--width-->", $this->GetGraphWidth(), $html);
        $html = str_replace("<!--column_value_title-->", "<!--lang_stats_group-->", $html);
        $html = str_replace("<!--description-->", "<!--lang_stats_absolute-->: <!--lang_stats_description_operator_chats-->", $html);
        return str_replace("<!--title-->", "Chats", $html);
    }

    private function GetTicketsByOperator($counter = 0, $hrows = "")
    {
        $trow = IOStruct::GetFile(TEMPLATE_HTML_STATS_TOP_ROW);
        $rows = array();
        $graphData = array();
        $result = DBManager::Execute(true, "SELECT *,SUM(`amount`) AS `am`,SUM(`resolves`) AS `res`,SUM(`messages`) AS `mes`,SUM(`responses`) AS `resp`,(SELECT SUM(`amount`) FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_TICKETS . "` WHERE" . $this->GetNoneAggregatedDateMatch() . " AND `user_id` IN ('" . implode("','", array_keys(Server::$Operators)) . "')) AS `total` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_TICKETS . "` WHERE" . $this->GetNoneAggregatedDateMatch() . " GROUP BY `user_id` ORDER BY `am` DESC;");
        while ($row = DBManager::FetchArray($result)) {
            if (isset(Server::$Operators[$row["user_id"]]) && Server::$Operators[$row["user_id"]]->AffectsStatistic()) {
                $rows[$row["user_id"]] = str_replace("<!--title-->", ((isset(Server::$Operators[$row["user_id"]])) ? Server::$Operators[$row["user_id"]]->Fullname : "<!--lang_stats_unknown-->"), $trow);
                $rows[$row["user_id"]] = str_replace("<!--rel_amount-->", Num::Divide((100 * $row["am"]), $row["total"], StatisticProvider::$RoundPrecision), $rows[$row["user_id"]]);
                $rows[$row["user_id"]] = str_replace("<!--abs_amount-->", $row["am"] . " (" . $row["res"] . " / " . $row["mes"] . " / " . $row["resp"] . ")", $rows[$row["user_id"]]);
                $rows[$row["user_id"]] = str_replace("<!--count-->", ++$counter, $rows[$row["user_id"]]);
                $graphData[$this->GetGraphOperatorIndex(Server::$Operators[$row["user_id"]])] = array($row["am"], $row["res"], $row["mes"], $row["resp"]);
            }
        }
        foreach (Server::$Operators as $id => $user)
            if (!isset($rows[$id]) && $user->AffectsStatistic()) {
                $rows[$id] = str_replace("<!--title-->", $user->Fullname, $trow);
                $rows[$id] = str_replace("<!--rel_amount-->", 0, $rows[$id]);
                $rows[$id] = str_replace("<!--abs_amount-->", "-", $rows[$id]);
                $rows[$id] = str_replace("<!--count-->", ++$counter, $rows[$id]);
                $graphData[$this->GetGraphOperatorIndex($user)] = array(0, 0, 0, 0);
            }
        foreach ($rows as $hrow)
            $hrows .= $hrow;

        $html = str_replace("<!--rows-->", $hrows, IOStruct::GetFile(TEMPLATE_HTML_STATS_TOP_TABLE));
        $html = str_replace("<!--column_count_width-->", "12", $html);
        $html = str_replace("<!--expand_all-->", "none", $html);
        $html = str_replace("<!--expand_all_block-->", "", $html);
        $html = str_replace("<!--column_value_title-->", "<!--lang_stats_operator-->", $html);
        $html = str_replace("<!--description-->", "<!--lang_stats_absolute-->: <!--lang_stats_new_tickets--> (<!--lang_stats_resolved_tickets--> / <!--lang_stats_incoming_messages--> / <!--lang_stats_outgoing_messages-->)", $html);
        $html = str_replace("<!--graph-->", $this->GetGraphImageTag($graphData, array(LocalizationManager::$TranslationStrings["stats_tickets"], LocalizationManager::$TranslationStrings["stats_new_tickets"], LocalizationManager::$TranslationStrings["stats_resolved_tickets"], LocalizationManager::$TranslationStrings["stats_incoming_messages"], LocalizationManager::$TranslationStrings["stats_outgoing_messages"]), true), $html);
        $html = str_replace("<!--width-->", $this->GetGraphWidth(), $html);
        return str_replace("<!--title-->", "<!--lang_stats_tickets-->", $html);
    }

    private function GetTicketsByGroup($counter = 0, $hrows = "")
    {
        $trow = IOStruct::GetFile(TEMPLATE_HTML_STATS_TOP_ROW);
        $rows = array();
        $graphData = array();
        $result = DBManager::Execute(true, "SELECT *,SUM(`amount`) AS `am`,SUM(`resolves`) AS `res`,SUM(`messages`) AS `mes`,SUM(`responses`) AS `resp`,(SELECT SUM(`amount`) FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_TICKETS . "` WHERE" . $this->GetNoneAggregatedDateMatch() . " AND `user_id` IN ('" . implode("','", array_keys(Server::$Groups)) . "')) AS `total` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_TICKETS . "` WHERE" . $this->GetNoneAggregatedDateMatch() . " GROUP BY `user_id` ORDER BY `am` DESC;");
        while ($row = DBManager::FetchArray($result)) {
            if (isset(Server::$Groups[$row["user_id"]])) {
                $rows[$row["user_id"]] = str_replace("<!--title-->", ((isset(Server::$Groups[$row["user_id"]])) ? Server::$Groups[$row["user_id"]]->Id : "<!--lang_stats_unknown-->"), $trow);
                $rows[$row["user_id"]] = str_replace("<!--rel_amount-->", Num::Divide((100 * $row["am"]), $row["total"], StatisticProvider::$RoundPrecision), $rows[$row["user_id"]]);
                $rows[$row["user_id"]] = str_replace("<!--abs_amount-->", $row["am"] . " (" . $row["res"] . " / " . $row["mes"] . " / " . $row["resp"] . ")", $rows[$row["user_id"]]);
                $rows[$row["user_id"]] = str_replace("<!--count-->", ++$counter, $rows[$row["user_id"]]);
                $graphData[$row["user_id"]] = array($row["am"], $row["res"], $row["mes"], $row["resp"]);
            }
        }
        foreach (Server::$Groups as $id => $group)
            if (!isset($rows[$id]) && !$group->IsDynamic) {
                $rows[$id] = str_replace("<!--title-->", $group->Id, $trow);
                $rows[$id] = str_replace("<!--rel_amount-->", 0, $rows[$id]);
                $rows[$id] = str_replace("<!--abs_amount-->", "-", $rows[$id]);
                $rows[$id] = str_replace("<!--count-->", ++$counter, $rows[$id]);
                $graphData[$id] = array(0, 0, 0, 0);
            }
        foreach ($rows as $hrow)
            $hrows .= $hrow;

        $html = str_replace("<!--rows-->", $hrows, IOStruct::GetFile(TEMPLATE_HTML_STATS_TOP_TABLE));
        $html = str_replace("<!--column_count_width-->", "12", $html);
        $html = str_replace("<!--expand_all-->", "none", $html);
        $html = str_replace("<!--expand_all_block-->", "", $html);
        $html = str_replace("<!--column_value_title-->", "<!--lang_stats_group-->", $html);
        $html = str_replace("<!--description-->", "<!--lang_stats_absolute-->: <!--lang_stats_new_tickets--> (<!--lang_stats_resolved_tickets--> / <!--lang_stats_incoming_messages--> / <!--lang_stats_outgoing_messages-->)", $html);
        $html = str_replace("<!--graph-->", $this->GetGraphImageTag($graphData, array(LocalizationManager::$TranslationStrings["stats_tickets"], LocalizationManager::$TranslationStrings["stats_new_tickets"], LocalizationManager::$TranslationStrings["stats_resolved_tickets"], LocalizationManager::$TranslationStrings["stats_incoming_messages"], LocalizationManager::$TranslationStrings["stats_outgoing_messages"]), true), $html);
        $html = str_replace("<!--width-->", $this->GetGraphWidth(), $html);
        return str_replace("<!--title-->", "<!--lang_stats_tickets-->", $html);
    }

    private function GetFeedbacksByOperator($counter = 0, $hrows = "")
    {
        $trow = IOStruct::GetFile(TEMPLATE_HTML_STATS_TOP_ROW);
        $rows = array();
        $graphData = array();
        $statTitles = FeedbackCriteria::GetStatArray(true);

        if (count($statTitles) == 0)
            return "<!--no_stat_array-->";

        $ff = "";
        $char = "a";
        for($i=0;$i<9;$i++)
        {
            $ff .= "SUM(`c".$char."`) AS `tc".$i."`,";
            $char++;
        }

        // SUM(`ca`) AS `tc0`,SUM(`cb`) AS `tc1`,SUM(`cc`) AS `tc2`,SUM(`cd`) AS `tc3`

        $result = DBManager::Execute(true, "SELECT `operator_id`,SUM(`amount`) AS `totalop`,".$ff."(SELECT SUM(`amount`) FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_FEEDBACKS . "` WHERE" . $this->GetNoneAggregatedDateMatch() . " AND `operator_id`!= '') AS `totalall` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_FEEDBACKS . "` WHERE" . $this->GetNoneAggregatedDateMatch() . " AND `operator_id`!= '' GROUP BY `operator_id`;");
        while ($row = DBManager::FetchArray($result)) {
            if (isset(Server::$Operators[$row["operator_id"]])) {
                $gindex = $this->GetGraphOperatorIndex(Server::$Operators[$row["operator_id"]]);
                $graphData[$gindex] = array();
                foreach ($statTitles as $title)
                    $graphData[$gindex][] = Num::Divide($row["tc" . count($graphData[$gindex])], $row["totalop"]);

                $avg = Num::Divide(array_sum($graphData[$gindex]), count($graphData[$gindex]), 2);
                $rows[$row["operator_id"]] = str_replace("<!--title-->", ((isset(Server::$Operators[$row["operator_id"]])) ? Server::$Operators[$row["operator_id"]]->Fullname : "<!--lang_stats_unknown-->"), $trow);
                $rows[$row["operator_id"]] = str_replace("<!--rel_amount-->", Num::Divide((100 * $row["totalop"]), $row["totalall"], StatisticProvider::$RoundPrecision), $rows[$row["operator_id"]]);
                $rows[$row["operator_id"]] = str_replace("<!--abs_amount-->", $row["totalop"] . " (" . $avg . ")", $rows[$row["operator_id"]]);
                $rows[$row["operator_id"]] = str_replace("<!--count-->", ++$counter, $rows[$row["operator_id"]]);
            }
        }
        foreach (Server::$Operators as $id => $operator)
            if (!isset($rows[$id]) && $operator->AffectsStatistic()) {
                $rows[$id] = str_replace("<!--title-->", $operator->Fullname, $trow);
                $rows[$id] = str_replace("<!--rel_amount-->", 0, $rows[$id]);
                $rows[$id] = str_replace("<!--abs_amount-->", "-", $rows[$id]);
                $rows[$id] = str_replace("<!--count-->", ++$counter, $rows[$id]);

                $graphData[$this->GetGraphOperatorIndex($operator)] = array();
                foreach ($statTitles as $title)
                    $graphData[$this->GetGraphOperatorIndex($operator)][] = 0;
            }

        foreach ($rows as $hrow)
            $hrows .= $hrow;

        $html = str_replace("<!--rows-->", $hrows, IOStruct::GetFile(TEMPLATE_HTML_STATS_TOP_TABLE));
        $html = str_replace("<!--column_count_width-->", "12", $html);
        $html = str_replace("<!--expand_all-->", "none", $html);
        $html = str_replace("<!--expand_all_block-->", "", $html);
        $tlist = array(LocalizationManager::$TranslationStrings["stats_stars"]);

        foreach ($statTitles as $title)
            $tlist[] = (isset(LocalizationManager::$TranslationStrings[$title])) ? LocalizationManager::$TranslationStrings[$title] : $title;

        $html = str_replace("<!--graph-->", $this->GetGraphImageTag($graphData, $tlist, true), $html);
        $html = str_replace("<!--width-->", $this->GetGraphWidth(), $html);
        $html = str_replace("<!--column_value_title-->", "<!--lang_stats_operator-->", $html);
        $html = str_replace("<!--description-->", "<!--lang_stats_absolute-->: <!--lang_stats_feedbacks--> (&#216; " . LocalizationManager::$TranslationStrings["stats_stars"] . ")", $html);
        return str_replace("<!--title-->", "<!--lang_stats_feedbacks-->", $html);
    }

    private function GetInvitesByOperator($counter = 0, $hrows = "")
    {
        $trow = IOStruct::GetFile(TEMPLATE_HTML_STATS_TOP_ROW);
        $rows = array();
        $graphData = array();
        $result = DBManager::Execute(true, "SELECT *,SUM(`invites`) AS `invto`,SUM(`invites_auto`) AS `invau`,SUM(`invites_accepted`) AS `invacc`,SUM(`invites_declined`) AS `invdecc`,(SELECT SUM(`invites`) FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_CHATS . "` WHERE" . $this->GetNoneAggregatedDateMatch() . " AND `group_id`!= '') AS `total` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_CHATS . "` WHERE" . $this->GetNoneAggregatedDateMatch() . " AND `user_id`!= '' GROUP BY `user_id` ORDER BY `invto` DESC;");
        while ($row = DBManager::FetchArray($result)) {
            if (isset(Server::$Operators[$row["user_id"]])) {
                $rows[$row["user_id"]] = str_replace("<!--title-->", ((isset(Server::$Operators[$row["user_id"]])) ? Server::$Operators[$row["user_id"]]->Fullname : "<!--lang_stats_unknown-->"), $trow);
                $rows[$row["user_id"]] = str_replace("<!--rel_amount-->", Num::Divide((100 * $row["invto"]), $row["total"], StatisticProvider::$RoundPrecision), $rows[$row["user_id"]]);
                $details = " (" . $row["invdecc"] . " / " . $row["invacc"] . " / " . $row["invau"] . ")";
                $rows[$row["user_id"]] = str_replace("<!--abs_amount-->", $row["invto"] . $details, $rows[$row["user_id"]]);
                $rows[$row["user_id"]] = str_replace("<!--count-->", ++$counter, $rows[$row["user_id"]]);
                $graphData[$this->GetGraphOperatorIndex(Server::$Operators[$row["user_id"]])] = array($row["invto"], $row["invdecc"], $row["invacc"], $row["invau"]);
            }
        }
        foreach (Server::$Operators as $id => $user)
            if ($user->AffectsStatistic() && !isset($rows[$id])) {
                $rows[$id] = str_replace("<!--title-->", $user->Fullname, $trow);
                $rows[$id] = str_replace("<!--rel_amount-->", 0, $rows[$id]);
                $rows[$id] = str_replace("<!--abs_amount-->", "-", $rows[$id]);
                $rows[$id] = str_replace("<!--count-->", ++$counter, $rows[$id]);
                $graphData[$this->GetGraphOperatorIndex($user)] = array(0, 0, 0, 0);
            }
        foreach ($rows as $hrow)
            $hrows .= $hrow;
        $html = str_replace("<!--rows-->", $hrows, IOStruct::GetFile(TEMPLATE_HTML_STATS_TOP_TABLE));
        $html = str_replace("<!--column_count_width-->", "12", $html);
        $html = str_replace("<!--expand_all-->", "none", $html);
        $html = str_replace("<!--expand_all_block-->", "", $html);
        $html = str_replace("<!--graph-->", $this->GetGraphImageTag($graphData, array(LocalizationManager::$TranslationStrings["stats_chat_invites"], LocalizationManager::$TranslationStrings["stats_chat_invites"], LocalizationManager::$TranslationStrings["stats_declined"], LocalizationManager::$TranslationStrings["stats_accepted"], LocalizationManager::$TranslationStrings["stats_auto"]), true), $html);
        $html = str_replace("<!--width-->", $this->GetGraphWidth(), $html);
        $html = str_replace("<!--column_value_title-->", "<!--lang_stats_operator-->", $html);
        $html = str_replace("<!--description-->", "<!--lang_stats_absolute-->: <!--lang_stats_chat_invites--> (<!--lang_stats_declined--> / <!--lang_stats_accepted--> / <!--lang_stats_auto-->)", $html);
        return str_replace("<!--title-->", "<!--lang_stats_chat_invites-->", $html);
    }

    private function GetFeedbacksByGroup($counter = 0, $hrows = "")
    {
        $trow = IOStruct::GetFile(TEMPLATE_HTML_STATS_TOP_ROW);
        $rows = array();
        $graphData = array();

        $statTitles = FeedbackCriteria::GetStatArray(true);

        if (count($statTitles) == 0)
            return "";

        $ff = "";
        $char = "a";
        for($i=0;$i<9;$i++)
        {
            $ff .= "SUM(`c".$char."`) AS `tc".$i."`,";
            $char++;
        }

        $result = DBManager::Execute(true, "SELECT `group_id`,SUM(`amount`) AS `totalgroup`,".$ff."(SELECT SUM(`amount`) FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_FEEDBACKS . "` WHERE" . $this->GetNoneAggregatedDateMatch() . " AND `group_id`!= '') AS `totalall` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_FEEDBACKS . "` WHERE" . $this->GetNoneAggregatedDateMatch() . " AND `group_id`!= '' GROUP BY `group_id`;");
        while ($row = DBManager::FetchArray($result)) {
            if (isset(Server::$Groups[$row["group_id"]])) {
                $graphData[$row["group_id"]] = array();
                foreach ($statTitles as $title)
                    if (isset($graphData[$row["group_id"]]) && !empty($row["totalgroup"]))
                        $graphData[$row["group_id"]][] = Num::Divide($row["tc" . count($graphData[$row["group_id"]])], $row["totalgroup"]);

                $avg = Num::Divide(array_sum($graphData[$row["group_id"]]), count($graphData[$row["group_id"]]), 2);
                $rows[$row["group_id"]] = str_replace("<!--title-->", ((isset(Server::$Groups[$row["group_id"]])) ? Server::$Groups[$row["group_id"]]->Id : "<!--lang_stats_unknown-->"), $trow);
                $rows[$row["group_id"]] = str_replace("<!--rel_amount-->", Num::Divide((100 * $row["totalgroup"]), $row["totalall"], StatisticProvider::$RoundPrecision), $rows[$row["group_id"]]);
                $rows[$row["group_id"]] = str_replace("<!--abs_amount-->", $row["totalgroup"] . " (" . $avg . ")", $rows[$row["group_id"]]);
                $rows[$row["group_id"]] = str_replace("<!--count-->", ++$counter, $rows[$row["group_id"]]);
            }
        }
        foreach (Server::$Groups as $id => $group)
            if (!isset($rows[$id]) && !$group->IsDynamic) {
                $rows[$id] = str_replace("<!--title-->", $group->Id, $trow);
                $rows[$id] = str_replace("<!--rel_amount-->", 0, $rows[$id]);
                $rows[$id] = str_replace("<!--abs_amount-->", "-", $rows[$id]);
                $rows[$id] = str_replace("<!--count-->", ++$counter, $rows[$id]);
                $graphData[$id] = array();
                foreach ($statTitles as $title)
                    $graphData[$id][] = 0;
            }

        foreach ($rows as $hrow)
            $hrows .= $hrow;

        $html = str_replace("<!--rows-->", $hrows, IOStruct::GetFile(TEMPLATE_HTML_STATS_TOP_TABLE));
        $html = str_replace("<!--column_count_width-->", "12", $html);
        $html = str_replace("<!--expand_all-->", "none", $html);
        $html = str_replace("<!--expand_all_block-->", "", $html);
        $tlist = array(LocalizationManager::$TranslationStrings["stats_stars"]);
        foreach ($statTitles as $title)
            if (isset(LocalizationManager::$TranslationStrings[$title]))
                $tlist[] = LocalizationManager::$TranslationStrings[$title];
        $html = str_replace("<!--graph-->", $this->GetGraphImageTag($graphData, $tlist, true), $html);
        $html = str_replace("<!--width-->", $this->GetGraphWidth(), $html);
        $html = str_replace("<!--column_value_title-->", "<!--lang_stats_group-->", $html);
        $html = str_replace("<!--description-->", "<!--lang_stats_absolute-->: <!--lang_stats_feedbacks--> (&#216; " . LocalizationManager::$TranslationStrings["stats_stars"] . ")", $html);
        return str_replace("<!--title-->", "<!--lang_stats_feedbacks-->", $html);
    }

    private function GetInvitesByGroup($counter = 0, $hrows = "")
    {
        $trow = IOStruct::GetFile(TEMPLATE_HTML_STATS_TOP_ROW);
        $rows = array();
        $graphData = array();
        $result = DBManager::Execute(true, "SELECT *,SUM(`invites`) AS `invto`,SUM(`invites_auto`) AS `invau`,SUM(`invites_accepted`) AS `invacc`,SUM(`invites_declined`) AS `invdecc`,(SELECT SUM(`invites`) FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_CHATS . "` WHERE" . $this->GetNoneAggregatedDateMatch() . " AND `group_id`!= '') AS `total` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_CHATS . "` WHERE" . $this->GetNoneAggregatedDateMatch() . " AND `group_id`!= '' GROUP BY `group_id` ORDER BY `invto` DESC;");
        while ($row = DBManager::FetchArray($result)) {
            if (isset(Server::$Groups[$row["group_id"]])) {
                $rows[$row["group_id"]] = str_replace("<!--title-->", ((isset(Server::$Groups[$row["group_id"]])) ? Server::$Groups[$row["group_id"]]->Id : "<!--lang_stats_unknown-->"), $trow);
                $rows[$row["group_id"]] = str_replace("<!--rel_amount-->", Num::Divide((100 * $row["invto"]), $row["total"], StatisticProvider::$RoundPrecision), $rows[$row["group_id"]]);
                $details = " (" . $row["invdecc"] . " / " . $row["invacc"] . " / " . $row["invau"] . ")";
                $rows[$row["group_id"]] = str_replace("<!--abs_amount-->", $row["invto"] . $details, $rows[$row["group_id"]]);
                $rows[$row["group_id"]] = str_replace("<!--count-->", ++$counter, $rows[$row["group_id"]]);
                $graphData[$row["group_id"]] = array($row["invto"], $row["invdecc"], $row["invacc"], $row["invau"]);
            }
        }
        foreach (Server::$Groups as $id => $group)
            if (!isset($rows[$id]) && !$group->IsDynamic) {
                $rows[$id] = str_replace("<!--title-->", $group->Id, $trow);
                $rows[$id] = str_replace("<!--rel_amount-->", 0, $rows[$id]);
                $rows[$id] = str_replace("<!--abs_amount-->", "-", $rows[$id]);
                $rows[$id] = str_replace("<!--count-->", ++$counter, $rows[$id]);
                $graphData[$id] = array(0, 0, 0, 0);
            }
        foreach ($rows as $hrow)
            $hrows .= $hrow;
        $html = str_replace("<!--rows-->", $hrows, IOStruct::GetFile(TEMPLATE_HTML_STATS_TOP_TABLE));
        $html = str_replace("<!--column_count_width-->", "12", $html);
        $html = str_replace("<!--expand_all-->", "none", $html);
        $html = str_replace("<!--expand_all_block-->", "", $html);
        $html = str_replace("<!--graph-->", $this->GetGraphImageTag($graphData, array(LocalizationManager::$TranslationStrings["stats_chat_invites"], LocalizationManager::$TranslationStrings["stats_chat_invites"], LocalizationManager::$TranslationStrings["stats_declined"], LocalizationManager::$TranslationStrings["stats_accepted"], LocalizationManager::$TranslationStrings["stats_auto"]), true), $html);
        $html = str_replace("<!--width-->", $this->GetGraphWidth(), $html);
        $html = str_replace("<!--column_value_title-->", "<!--lang_stats_group-->", $html);
        $html = str_replace("<!--description-->", "<!--lang_stats_absolute-->: <!--lang_stats_chat_invites--> (<!--lang_stats_declined--> / <!--lang_stats_accepted--> / <!--lang_stats_auto-->)", $html);
        return str_replace("<!--title-->", "<!--lang_stats_chat_invites-->", $html);
    }

    private function GetChatResponseTimeByOperator($counter = 0, $hrows = "")
    {
        $trow = IOStruct::GetFile(TEMPLATE_HTML_STATS_TOP_ROW);
        $rows = array();
        $graphData = array();
        $result = DBManager::Execute(true, "SELECT *,SUM(`chat_posts`) AS `stotal`,(SUM(`avg_response_time`)/COUNT(*)) AS `am`,(SELECT (SUM(`avg_response_time`)/COUNT(*)) as `total` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_CHATS . "` WHERE" . $this->GetNoneAggregatedDateMatch() . " GROUP BY `user_id` ORDER BY `total` DESC LIMIT 1) AS `total` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_CHATS . "` WHERE" . $this->GetNoneAggregatedDateMatch() . " GROUP BY `user_id` ORDER BY `am` DESC;");
        while ($row = DBManager::FetchArray($result)) {
            if (isset(Server::$Operators[$row["user_id"]]) && Server::$Operators[$row["user_id"]]->AffectsStatistic()) {
                $rows[$row["user_id"]] = str_replace("<!--title-->", ((isset(Server::$Operators[$row["user_id"]])) ? Server::$Operators[$row["user_id"]]->Fullname : "<!--lang_stats_unknown-->"), $trow);
                $rows[$row["user_id"]] = str_replace("<!--rel_amount-->", Num::Divide((100 * $row["am"]), $row["total"], StatisticProvider::$RoundPrecision), $rows[$row["user_id"]]);
                $rows[$row["user_id"]] = str_replace("<!--rel_floor_amount-->", 100 - Num::Divide((100 * $row["am"]), $row["total"], false, true), $rows[$row["user_id"]]);
                $rows[$row["user_id"]] = str_replace("<!--abs_amount-->", $this->FormatTimespan($row["am"]) . " (" . $row["stotal"] . ")", $rows[$row["user_id"]]);
                $rows[$row["user_id"]] = str_replace("<!--count-->", ++$counter, $rows[$row["user_id"]]);
                $graphData[$this->GetGraphOperatorIndex(Server::$Operators[$row["user_id"]])] = array(round($row["am"], 1));
            }
        }
        foreach (Server::$Operators as $id => $user)
            if (!isset($rows[$id]) && $user->AffectsStatistic()) {
                $rows[$id] = str_replace("<!--title-->", $user->Fullname, $trow);
                $rows[$id] = str_replace("<!--rel_amount-->", 0, $rows[$id]);
                $rows[$id] = str_replace("<!--rel_floor_amount-->", 100, $rows[$id]);
                $rows[$id] = str_replace("<!--abs_amount-->", "-", $rows[$id]);
                $rows[$id] = str_replace("<!--count-->", ++$counter, $rows[$id]);
                $graphData[$this->GetGraphOperatorIndex($user)] = array(0);
            }
        foreach ($rows as $hrow)
            $hrows .= $hrow;

        $html = str_replace("<!--rows-->", $hrows, IOStruct::GetFile(TEMPLATE_HTML_STATS_TOP_TABLE));
        $html = str_replace("<!--column_count_width-->", "12", $html);
        $html = str_replace("<!--expand_all-->", "none", $html);
        $html = str_replace("<!--expand_all_block-->", "", $html);
        $html = str_replace("<!--description-->", "<!--lang_stats_absolute-->: &#216; <!--lang_stats_chat_response_times--> (hh:mm:ss) / <!--lang_stats_total_messages-->", $html);
        $html = str_replace("<!--graph-->", $this->GetGraphImageTag($graphData, array(LocalizationManager::$TranslationStrings["stats_seconds"], LocalizationManager::$TranslationStrings["stats_chat_response_times"])), $html);
        $html = str_replace("<!--width-->", $this->GetGraphWidth(), $html);
        $html = str_replace("<!--column_value_title-->", "<!--lang_stats_operator-->", $html);
        return str_replace("<!--title-->", "<!--lang_stats_chat_response_times-->", $html);
    }

    private function GetChatResponseTimeByGroup($counter = 0, $hrows = "")
    {
        $trow = IOStruct::GetFile(TEMPLATE_HTML_STATS_TOP_ROW);
        $rows = array();
        $graphData = array();
        $result = DBManager::Execute(true, "SELECT *,SUM(`chat_posts`) AS `stotal`,(SUM(`avg_response_time`)/COUNT(*)) AS `am`,(SELECT (SUM(`avg_response_time`)/COUNT(*)) as `total` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_CHATS . "` WHERE" . $this->GetNoneAggregatedDateMatch() . " AND `group_id` != '' GROUP BY `group_id` ORDER BY `total` DESC LIMIT 1) AS `total` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_CHATS . "` WHERE" . $this->GetNoneAggregatedDateMatch() . "  AND `group_id` != '' GROUP BY `group_id` ORDER BY `am` DESC;");
        while ($row = DBManager::FetchArray($result)) {
            if (isset(Server::$Groups[$row["group_id"]])) {
                $rows[$row["group_id"]] = str_replace("<!--title-->", ((isset(Server::$Groups[$row["group_id"]])) ? Server::$Groups[$row["group_id"]]->Id : "<!--lang_stats_unknown-->"), $trow);
                $rows[$row["group_id"]] = str_replace("<!--rel_amount-->", Num::Divide((100 * $row["am"]), $row["total"], StatisticProvider::$RoundPrecision), $rows[$row["group_id"]]);
                $rows[$row["group_id"]] = str_replace("<!--abs_amount-->", $this->FormatTimespan($row["am"]) . " / " . $row["stotal"], $rows[$row["group_id"]]);
                $rows[$row["group_id"]] = str_replace("<!--count-->", ++$counter, $rows[$row["group_id"]]);
                $graphData[$row["group_id"]] = array(round($row["am"], 1));
            }
        }
        foreach (Server::$Groups as $id => $group)
            if (!isset($rows[$id]) && !$group->IsDynamic) {
                $rows[$id] = str_replace("<!--title-->", $id, $trow);
                $rows[$id] = str_replace("<!--rel_amount-->", 0, $rows[$id]);
                $rows[$id] = str_replace("<!--abs_amount-->", "-", $rows[$id]);
                $rows[$id] = str_replace("<!--count-->", ++$counter, $rows[$id]);
                $graphData[$id] = array(0);
            }
        foreach ($rows as $hrow)
            $hrows .= $hrow;

        $html = str_replace("<!--rows-->", $hrows, IOStruct::GetFile(TEMPLATE_HTML_STATS_TOP_TABLE));
        $html = str_replace("<!--column_count_width-->", "12", $html);
        $html = str_replace("<!--expand_all-->", "none", $html);
        $html = str_replace("<!--expand_all_block-->", "", $html);
        $html = str_replace("<!--description-->", "<!--lang_stats_absolute-->: &#216; <!--lang_stats_chat_response_times--> (hh:mm:ss) / <!--lang_stats_total_messages-->", $html);
        $html = str_replace("<!--graph-->", $this->GetGraphImageTag($graphData, array(LocalizationManager::$TranslationStrings["stats_seconds"], LocalizationManager::$TranslationStrings["stats_chat_response_times"])), $html);
        $html = str_replace("<!--width-->", $this->GetGraphWidth(), $html);
        $html = str_replace("<!--column_value_title-->", "<!--lang_stats_group-->", $html);
        return str_replace("<!--title-->", "<!--lang_stats_chat_response_times-->", $html);
    }

    private function GetTicketResponseTimesByOperator($counter = 0, $hrows = "")
    {
        $trow = str_replace("%", "", IOStruct::GetFile(TEMPLATE_HTML_STATS_TOP_ROW));
        $rows = array();
        $graphData = array();
        $result = DBManager::Execute(true, "SELECT *,SUM(`responses`) AS `stotal`,(SUM(`avg_response_time`)/SUM(`responses`)) AS `am`,(SUM(`avg_resolve_time`)/SUM(`resolves`)) AS `res` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_TICKETS . "` WHERE" . $this->GetNoneAggregatedDateMatch() . " GROUP BY `user_id` ORDER BY `am` DESC;");
        while ($row = DBManager::FetchArray($result)) {
            if (isset(Server::$Operators[$row["user_id"]]) && Server::$Operators[$row["user_id"]]->AffectsStatistic()) {
                $rows[$row["user_id"]] = str_replace("<!--title-->", ((isset(Server::$Operators[$row["user_id"]])) ? Server::$Operators[$row["user_id"]]->Fullname : "<!--lang_stats_unknown-->"), $trow);
                $rows[$row["user_id"]] = str_replace("<!--rel_amount-->", "-", $rows[$row["user_id"]]);
                $rows[$row["user_id"]] = str_replace("<!--rel_floor_amount-->", 100, $rows[$row["user_id"]]);
                $rows[$row["user_id"]] = str_replace("<!--abs_amount-->", $this->FormatTimespan($row["am"]) . " / " . $this->FormatTimespan($row["res"]), $rows[$row["user_id"]]);
                $rows[$row["user_id"]] = str_replace("<!--count-->", ++$counter, $rows[$row["user_id"]]);
                $graphData[$this->GetGraphOperatorIndex(Server::$Operators[$row["user_id"]])] = array(round(($row["am"] / 3600), 1), round(($row["res"] / 3600), 1));
            }
        }
        foreach (Server::$Operators as $id => $operator)
            if (!isset($rows[$id]) && $operator->AffectsStatistic()) {
                $rows[$id] = str_replace("<!--title-->", $operator->Fullname, $trow);
                $rows[$id] = str_replace("<!--rel_amount-->", "-", $rows[$id]);
                $rows[$id] = str_replace("<!--rel_floor_amount-->", 100, $rows[$id]);
                $rows[$id] = str_replace("<!--abs_amount-->", "-", $rows[$id]);
                $rows[$id] = str_replace("<!--count-->", ++$counter, $rows[$id]);
                $graphData[$this->GetGraphOperatorIndex($operator)] = array(0, 0);
            }
        foreach ($rows as $hrow)
            $hrows .= $hrow;

        $html = str_replace("<!--rows-->", $hrows, IOStruct::GetFile(TEMPLATE_HTML_STATS_TOP_TABLE));
        $html = str_replace("<!--column_count_width-->", "12", $html);
        $html = str_replace("<!--expand_all-->", "none", $html);
        $html = str_replace("<!--expand_all_block-->", "", $html);
        $html = str_replace("<!--description-->", "<!--lang_stats_absolute-->: &#216; <!--lang_stats_ticket_response_time--> / &#216; <!--lang_stats_ticket_resolve_time-->", $html);
        $html = str_replace("<!--column_value_title-->", "<!--lang_stats_group-->", $html);
        $html = str_replace("<!--graph-->", $this->GetGraphImageTag($graphData, array(LocalizationManager::$TranslationStrings["stats_hours"], LocalizationManager::$TranslationStrings["stats_ticket_response_time"], LocalizationManager::$TranslationStrings["stats_ticket_resolve_time"])), $html);
        $html = str_replace("<!--width-->", $this->GetGraphWidth(), $html);
        return str_replace("<!--title-->", "<!--lang_stats_ticket_response_time-->", $html);
    }

    private function GetTicketResponseTimesByGroup($counter = 0, $hrows = "")
    {
        $trow = str_replace("%", "", IOStruct::GetFile(TEMPLATE_HTML_STATS_TOP_ROW));
        $rows = array();
        $graphData = array();
        $result = DBManager::Execute(true, $d = "SELECT *,SUM(`responses`) AS `stotal`,(SUM(`avg_response_time`)/SUM(`responses`)) AS `am`,(SUM(`avg_resolve_time`)/SUM(`resolves`)) AS `res` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_TICKETS . "` WHERE" . $this->GetNoneAggregatedDateMatch() . " GROUP BY `user_id` ORDER BY `am` DESC;");

        while ($row = DBManager::FetchArray($result)) {

            if (isset(Server::$Groups[$row["user_id"]])) {
                $rows[$row["user_id"]] = str_replace("<!--title-->", ((isset(Server::$Groups[$row["user_id"]])) ? Server::$Groups[$row["user_id"]]->Id : "<!--lang_stats_unknown-->"), $trow);
                $rows[$row["user_id"]] = str_replace("<!--rel_amount-->", "-", $rows[$row["user_id"]]);
                $rows[$row["user_id"]] = str_replace("<!--abs_amount-->", $this->FormatTimespan($row["am"]) . " / " . $this->FormatTimespan($row["res"]) . "", $rows[$row["user_id"]]);
                $rows[$row["user_id"]] = str_replace("<!--count-->", ++$counter, $rows[$row["user_id"]]);
                $graphData[$row["user_id"]] = array(round(($row["am"] / 3600), 1), round(($row["res"] / 3600), 1));
            }
        }
        foreach (Server::$Groups as $id => $group)
            if (!isset($rows[$id]) && !$group->IsDynamic) {
                $rows[$id] = str_replace("<!--title-->", $id, $trow);
                $rows[$id] = str_replace("<!--rel_amount-->", "-", $rows[$id]);
                $rows[$id] = str_replace("<!--abs_amount-->", "-", $rows[$id]);
                $rows[$id] = str_replace("<!--count-->", ++$counter, $rows[$id]);
                $graphData[$id] = array(0, 0);
            }
        foreach ($rows as $hrow)
            $hrows .= $hrow;

        $html = str_replace("<!--rows-->", $hrows, IOStruct::GetFile(TEMPLATE_HTML_STATS_TOP_TABLE));
        $html = str_replace("<!--column_count_width-->", "12", $html);
        $html = str_replace("<!--expand_all-->", "none", $html);
        $html = str_replace("<!--expand_all_block-->", "", $html);
        $html = str_replace("<!--description-->", "<!--lang_stats_absolute-->: &#216; <!--lang_stats_ticket_response_time--> / &#216; <!--lang_stats_ticket_resolve_time-->", $html);
        $html = str_replace("<!--graph-->", $this->GetGraphImageTag($graphData, array(LocalizationManager::$TranslationStrings["stats_hours"], LocalizationManager::$TranslationStrings["stats_ticket_response_time"], LocalizationManager::$TranslationStrings["stats_ticket_resolve_time"])), $html);
        $html = str_replace("<!--width-->", $this->GetGraphWidth(), $html);
        $html = str_replace("<!--column_value_title-->", "<!--lang_stats_group-->", $html);
        return str_replace("<!--title-->", "<!--lang_stats_ticket_response_time-->", $html);
    }

    private function GetChatDurationByOperator($counter = 0, $hrows = "")
    {
        $trow = IOStruct::GetFile(TEMPLATE_HTML_STATS_TOP_ROW);
        $rows = array();
        $graphData = array();
        $result = DBManager::Execute(true, "SELECT *,(SUM(`avg_duration`*`amount`)/(SUM(`amount`))) AS `am`,(SUM(`avg_waiting_time`*`amount`)/(SUM(`amount`))) AS `awt`,(SELECT (SUM(`avg_duration`*`amount`)/(SUM(`amount`))) as `total` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_CHATS . "` WHERE" . $this->GetNoneAggregatedDateMatch() . " GROUP BY `user_id` ORDER BY `total` DESC LIMIT 1) AS `total` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_CHATS . "` WHERE" . $this->GetNoneAggregatedDateMatch() . " GROUP BY `user_id` ORDER BY `am` DESC;");
        while ($row = DBManager::FetchArray($result)) {
            if (isset(Server::$Operators[$row["user_id"]]) && Server::$Operators[$row["user_id"]]->AffectsStatistic()) {
                $rows[$row["user_id"]] = str_replace("<!--title-->", ((isset(Server::$Operators[$row["user_id"]])) ? Server::$Operators[$row["user_id"]]->Fullname : "<!--lang_stats_unknown-->"), $trow);
                $rows[$row["user_id"]] = str_replace("<!--rel_amount-->", Num::Divide((100 * $row["am"]), $row["total"], StatisticProvider::$RoundPrecision), $rows[$row["user_id"]]);
                $rows[$row["user_id"]] = str_replace("<!--rel_floor_amount-->", 100 - Num::Divide((100 * $row["am"]), $row["total"], false, true), $rows[$row["user_id"]]);
                $rows[$row["user_id"]] = str_replace("<!--abs_amount-->", $this->FormatTimespan($row["am"]) . " / " . $this->FormatTimespan($row["awt"]), $rows[$row["user_id"]]);
                $rows[$row["user_id"]] = str_replace("<!--count-->", ++$counter, $rows[$row["user_id"]]);
                $graphData[$this->GetGraphOperatorIndex(Server::$Operators[$row["user_id"]])] = array(round(($row["am"] / 60), 1), round(($row["awt"] / 60), 1));
            }
        }
        foreach (Server::$Operators as $id => $operator)
            if (!isset($rows[$id]) && $operator->AffectsStatistic()) {
                $rows[$id] = str_replace("<!--title-->", $operator->Fullname, $trow);
                $rows[$id] = str_replace("<!--rel_amount-->", 0, $rows[$id]);
                $rows[$id] = str_replace("<!--rel_floor_amount-->", 100, $rows[$id]);
                $rows[$id] = str_replace("<!--abs_amount-->", "-", $rows[$id]);
                $rows[$id] = str_replace("<!--count-->", ++$counter, $rows[$id]);
                $graphData[$this->GetGraphOperatorIndex($operator)] = array(0, 0);
            }
        foreach ($rows as $hrow)
            $hrows .= $hrow;

        $html = str_replace("<!--rows-->", $hrows, IOStruct::GetFile(TEMPLATE_HTML_STATS_TOP_TABLE));
        $html = str_replace("<!--column_count_width-->", "12", $html);
        $html = str_replace("<!--expand_all-->", "none", $html);
        $html = str_replace("<!--expand_all_block-->", "", $html);
        $html = str_replace("<!--description-->", "<!--lang_stats_absolute-->: &#216; <!--lang_stats_chat_average_duration--> (hh:mm:ss) / &#216; <!--lang_stats_chat_average_waiting_time--> (hh:mm:ss)", $html);
        $html = str_replace("<!--graph-->", $this->GetGraphImageTag($graphData, array(LocalizationManager::$TranslationStrings["stats_minutes"], LocalizationManager::$TranslationStrings["stats_chat_average_duration"], LocalizationManager::$TranslationStrings["stats_chat_average_waiting_time"])), $html);
        $html = str_replace("<!--width-->", $this->GetGraphWidth(), $html);
        $html = str_replace("<!--column_value_title-->", "<!--lang_stats_operator-->", $html);
        $html = str_replace("<!--title-->", "<!--lang_stats_chat_average_duration--> (&#216;)", $html);

        $counter = 0;
        $hrows = "";
        $rows = array();
        $graphData = array();
        $result = DBManager::Execute(true, "SELECT *,SUM(`avg_duration`*`accepted`) AS `am`,(SELECT SUM(`avg_duration`*`accepted`) as `total` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_CHATS . "` WHERE" . $this->GetNoneAggregatedDateMatch() . " GROUP BY `user_id` ORDER BY `total` DESC LIMIT 1) AS `total` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_CHATS . "` WHERE" . $this->GetNoneAggregatedDateMatch() . " GROUP BY `user_id` ORDER BY `am` DESC;");
        while ($row = DBManager::FetchArray($result)) {
            if (isset(Server::$Operators[$row["user_id"]]) && Server::$Operators[$row["user_id"]]->AffectsStatistic()) {
                $rows[$row["user_id"]] = str_replace("<!--title-->", ((isset(Server::$Operators[$row["user_id"]])) ? Server::$Operators[$row["user_id"]]->Fullname : "<!--lang_stats_unknown-->"), $trow);
                $rows[$row["user_id"]] = str_replace("<!--rel_amount-->", Num::Divide((100 * $row["am"]), $row["total"], StatisticProvider::$RoundPrecision), $rows[$row["user_id"]]);
                $rows[$row["user_id"]] = str_replace("<!--rel_floor_amount-->", 100 - Num::Divide((100 * $row["am"]), $row["total"], false, true), $rows[$row["user_id"]]);
                $rows[$row["user_id"]] = str_replace("<!--abs_amount-->", $this->FormatTimespan($row["am"]), $rows[$row["user_id"]]);
                $rows[$row["user_id"]] = str_replace("<!--count-->", ++$counter, $rows[$row["user_id"]]);
                $graphData[$this->GetGraphOperatorIndex(Server::$Operators[$row["user_id"]])] = array(round(($row["am"] / 60), 1));
            }
        }
        foreach (Server::$Operators as $id => $operator)
            if (!isset($rows[$id]) && $operator->AffectsStatistic()) {
                $rows[$id] = str_replace("<!--title-->", $operator->Fullname, $trow);
                $rows[$id] = str_replace("<!--rel_amount-->", 0, $rows[$id]);
                $rows[$id] = str_replace("<!--rel_floor_amount-->", 100, $rows[$id]);
                $rows[$id] = str_replace("<!--abs_amount-->", "-", $rows[$id]);
                $rows[$id] = str_replace("<!--count-->", ++$counter, $rows[$id]);
                $graphData[$this->GetGraphOperatorIndex($operator)] = array(0);
            }
        foreach ($rows as $hrow)
            $hrows .= $hrow;

        $html .= str_replace("<!--rows-->", $hrows, IOStruct::GetFile(TEMPLATE_HTML_STATS_TOP_TABLE));
        $html = str_replace("<!--column_count_width-->", "12", $html);
        $html = str_replace("<!--expand_all-->", "none", $html);
        $html = str_replace("<!--expand_all_block-->", "", $html);
        $html = str_replace("<!--description-->", "<!--lang_stats_absolute-->: <!--lang_stats_chat_total_duration--> (hh:mm:ss)", $html);
        $html = str_replace("<!--graph-->", $this->GetGraphImageTag($graphData, array(LocalizationManager::$TranslationStrings["stats_minutes"], LocalizationManager::$TranslationStrings["stats_chat_total_duration"])), $html);
        $html = str_replace("<!--width-->", $this->GetGraphWidth(), $html);
        $html = str_replace("<!--column_value_title-->", "<!--lang_stats_operator-->", $html);
        return str_replace("<!--title-->", "<!--lang_stats_chat_total_duration-->", $html);
    }

    private function GetChatDurationByGroup($counter = 0, $hrows = "")
    {
        $trow = IOStruct::GetFile(TEMPLATE_HTML_STATS_TOP_ROW);
        $rows = array();
        $graphData = array();
        $result = DBManager::Execute(true, "SELECT *,(SUM(`avg_duration`*`amount`)/(SUM(`amount`))) AS `am`,(SUM(`avg_waiting_time`*`amount`)/(SUM(`amount`))) AS `awt`,(SELECT (SUM(`avg_duration`*`amount`)/(SUM(`amount`))) as `total` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_CHATS . "` WHERE" . $this->GetNoneAggregatedDateMatch() . " AND `group_id`!= '' GROUP BY `group_id` ORDER BY `total` DESC LIMIT 1) AS `total` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_CHATS . "` WHERE" . $this->GetNoneAggregatedDateMatch() . " GROUP BY `group_id` ORDER BY `am` DESC;");
        while ($row = DBManager::FetchArray($result)) {
            if (isset(Server::$Groups[$row["group_id"]])) {
                $rows[$row["group_id"]] = str_replace("<!--title-->", ((isset(Server::$Groups[$row["group_id"]])) ? Server::$Groups[$row["group_id"]]->Id : "<!--lang_stats_unknown-->"), $trow);
                $rows[$row["group_id"]] = str_replace("<!--rel_amount-->", Num::Divide((100 * $row["am"]), $row["total"], StatisticProvider::$RoundPrecision), $rows[$row["group_id"]]);
                $rows[$row["group_id"]] = str_replace("<!--abs_amount-->", $this->FormatTimespan($row["am"]) . " (" . $this->FormatTimespan($row["awt"]) . ")", $rows[$row["group_id"]]);
                $rows[$row["group_id"]] = str_replace("<!--count-->", ++$counter, $rows[$row["group_id"]]);
                $graphData[$row["group_id"]] = array(round(($row["am"] / 60), 1), round(($row["awt"] / 60), 1));
            }
        }
        foreach (Server::$Groups as $id => $group)
            if (!isset($rows[$id]) && !$group->IsDynamic) {
                $rows[$id] = str_replace("<!--title-->", $group->Id, $trow);
                $rows[$id] = str_replace("<!--rel_amount-->", 0, $rows[$id]);
                $rows[$id] = str_replace("<!--abs_amount-->", "-", $rows[$id]);
                $rows[$id] = str_replace("<!--count-->", ++$counter, $rows[$id]);
                $graphData[$id] = array(0, 0);
            }
        foreach ($rows as $hrow)
            $hrows .= $hrow;

        $html = str_replace("<!--rows-->", $hrows, IOStruct::GetFile(TEMPLATE_HTML_STATS_TOP_TABLE));
        $html = str_replace("<!--column_count_width-->", "12", $html);
        $html = str_replace("<!--expand_all-->", "none", $html);
        $html = str_replace("<!--expand_all_block-->", "", $html);
        $html = str_replace("<!--description-->", "<!--lang_stats_absolute-->: &#216; <!--lang_stats_chat_average_duration--> (hh:mm:ss) / &#216; <!--lang_stats_chat_average_waiting_time--> (hh:mm:ss)", $html);
        $html = str_replace("<!--graph-->", $this->GetGraphImageTag($graphData, array(LocalizationManager::$TranslationStrings["stats_minutes"], LocalizationManager::$TranslationStrings["stats_chat_average_duration"], LocalizationManager::$TranslationStrings["stats_chat_average_waiting_time"])), $html);
        $html = str_replace("<!--width-->", $this->GetGraphWidth(), $html);
        $html = str_replace("<!--column_value_title-->", "<!--lang_stats_group-->", $html);
        $html = str_replace("<!--title-->", "<!--lang_stats_chat_average_duration--> (&#216;)", $html);

        $counter = 0;
        $hrows = "";
        $rows = array();
        $graphData = array();
        $result = DBManager::Execute(true, $d = "SELECT *,SUM(`avg_duration`*`accepted`) AS `am`,(SELECT SUM(`avg_duration`*`accepted`) as `total` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_CHATS . "` WHERE" . $this->GetNoneAggregatedDateMatch() . " AND `group_id`!= '' GROUP BY `group_id` ORDER BY `total` DESC LIMIT 1) AS `total` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_CHATS . "` WHERE" . $this->GetNoneAggregatedDateMatch() . " GROUP BY `group_id` ORDER BY `am` DESC;");
        while ($row = DBManager::FetchArray($result)) {
            if (isset(Server::$Groups[$row["group_id"]])) {
                $rows[$row["group_id"]] = str_replace("<!--title-->", ((isset(Server::$Groups[$row["group_id"]])) ? Server::$Groups[$row["group_id"]]->Id : "<!--lang_stats_unknown-->"), $trow);
                $rows[$row["group_id"]] = str_replace("<!--rel_amount-->", Num::Divide((100 * $row["am"]), $row["total"], StatisticProvider::$RoundPrecision), $rows[$row["group_id"]]);
                $rows[$row["group_id"]] = str_replace("<!--abs_amount-->", $this->FormatTimespan($row["am"]), $rows[$row["group_id"]]);
                $rows[$row["group_id"]] = str_replace("<!--count-->", ++$counter, $rows[$row["group_id"]]);
                $graphData[$row["group_id"]] = array(round(($row["am"] / 60), 1));
            }
        }
        foreach (Server::$Groups as $id => $group)
            if (!isset($rows[$id]) && !$group->IsDynamic) {
                $rows[$id] = str_replace("<!--title-->", $group->Id, $trow);
                $rows[$id] = str_replace("<!--rel_amount-->", 0, $rows[$id]);
                $rows[$id] = str_replace("<!--abs_amount-->", "-", $rows[$id]);
                $rows[$id] = str_replace("<!--count-->", ++$counter, $rows[$id]);
                $graphData[$id] = array(0);
            }
        foreach ($rows as $hrow)
            $hrows .= $hrow;

        $html .= str_replace("<!--rows-->", $hrows, IOStruct::GetFile(TEMPLATE_HTML_STATS_TOP_TABLE));
        $html = str_replace("<!--column_count_width-->", "12", $html);
        $html = str_replace("<!--expand_all-->", "none", $html);
        $html = str_replace("<!--expand_all_block-->", "", $html);
        $html = str_replace("<!--description-->", "<!--lang_stats_absolute-->: <!--lang_stats_chat_total_duration--> (hh:mm:ss)", $html);
        $html = str_replace("<!--graph-->", $this->GetGraphImageTag($graphData, array(LocalizationManager::$TranslationStrings["stats_minutes"], LocalizationManager::$TranslationStrings["stats_chat_total_duration"])), $html);
        $html = str_replace("<!--width-->", $this->GetGraphWidth(), $html);
        $html = str_replace("<!--column_value_title-->", "<!--lang_stats_group-->", $html);
        $html = str_replace("<!--title-->", "<!--lang_stats_chat_total_duration-->", $html);
        return $html;
    }

    private function GetAvailabilityByOperator($counter = 0, $hrows = "")
    {
        $trow = IOStruct::GetFile(TEMPLATE_HTML_STATS_TOP_ROW);
        $rows = array();
        $graphData = array();
        $result = DBManager::Execute(true, "SELECT *,SUM(`seconds`) as `am` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_AVAILABILITIES . "` WHERE" . $this->GetNoneAggregatedDateMatch() . " GROUP BY `user_id` ORDER BY `am` DESC;");
        while ($row = DBManager::FetchArray($result)) {
            if (isset(Server::$Operators[$row["user_id"]]) && Server::$Operators[$row["user_id"]]->AffectsStatistic()) {
                $secondsInPeriod = $this->GetSecondsOfPeriodOperator($row["user_id"]);
                $rows[$row["user_id"]] = str_replace("<!--title-->", ((isset(Server::$Operators[$row["user_id"]])) ? Server::$Operators[$row["user_id"]]->Fullname : "<!--lang_stats_unknown-->"), $trow);
                $rows[$row["user_id"]] = str_replace("<!--rel_amount-->", Num::Divide((100 * $row["am"]), $secondsInPeriod, StatisticProvider::$RoundPrecision), $rows[$row["user_id"]]);
                $rows[$row["user_id"]] = str_replace("<!--abs_amount-->", $this->FormatTimespan($row["am"]), $rows[$row["user_id"]]);
                $rows[$row["user_id"]] = str_replace("<!--count-->", ++$counter, $rows[$row["user_id"]]);
                $graphData[$this->GetGraphOperatorIndex(Server::$Operators[$row["user_id"]])] = array(($secondsInPeriod / 3600), round(($row["am"] / 3600), 1));
            }
        }
        foreach (Server::$Operators as $id => $user)
            if (!isset($rows[$id]) && $user->AffectsStatistic()) {
                $secondsInPeriod = $this->GetSecondsOfPeriodOperator($id);
                $rows[$id] = str_replace("<!--title-->", $user->Fullname, $trow);
                $rows[$id] = str_replace("<!--rel_amount-->", 0, $rows[$id]);
                $rows[$id] = str_replace("<!--abs_amount-->", $this->FormatTimespan(0), $rows[$id]);
                $rows[$id] = str_replace("<!--count-->", ++$counter, $rows[$id]);
                $graphData[$this->GetGraphOperatorIndex($user)] = array(($secondsInPeriod / 3600), 0);
            }
        foreach ($rows as $hrow)
            $hrows .= $hrow;
        $html = str_replace("<!--rows-->", $hrows, IOStruct::GetFile(TEMPLATE_HTML_STATS_TOP_TABLE));
        $html = str_replace("<!--column_count_width-->", "12", $html);
        $html = str_replace("<!--expand_all-->", "none", $html);
        $html = str_replace("<!--expand_all_block-->", "", $html);
        $html = str_replace("<!--graph-->", $this->GetGraphImageTag($graphData, array(LocalizationManager::$TranslationStrings["stats_hours"], LocalizationManager::$TranslationStrings["stats_target_availability"], LocalizationManager::$TranslationStrings["stats_availability"])), $html);
        $html = str_replace("<!--width-->", $this->GetGraphWidth(), $html);
        $html = str_replace("<!--description-->", "<!--lang_stats_absolute-->: <!--lang_stats_availability--> (hh:mm:ss)", $html);
        $html = str_replace("<!--column_value_title-->", "<!--lang_stats_operator-->", $html);
        return str_replace("<!--title-->", "<!--lang_stats_operator_availability-->", $html);
    }

    private function GetAvailabilityByGroup($counter = 0, $hrows = "")
    {
        $trow = IOStruct::GetFile(TEMPLATE_HTML_STATS_TOP_ROW);
        $rows = array();
        $graphData = array();
        $result = DBManager::Execute(true, "SELECT *,SUM(`seconds`) as `am` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_AVAILABILITIES . "` WHERE" . $this->GetNoneAggregatedDateMatch() . " AND `group_id`!='' GROUP BY `group_id` ORDER BY `am` DESC;");
        while ($row = DBManager::FetchArray($result)) {
            if ($row["group_id"] != GROUP_EVERYONE_INTERN && !empty($row["group_id"]) && isset(Server::$Groups[$row["group_id"]])) {
                $secondsInPeriod = $this->GetSecondsOfPeriodGroup($row["group_id"]);
                $rows[$row["group_id"]] = str_replace("<!--title-->", ((isset(Server::$Groups[$row["group_id"]])) ? Server::$Groups[$row["group_id"]]->Id : "<!--lang_stats_unknown-->"), $trow);
                $rows[$row["group_id"]] = str_replace("<!--rel_amount-->", Num::Divide((100 * $row["am"]), $secondsInPeriod, StatisticProvider::$RoundPrecision), $rows[$row["group_id"]]);
                $rows[$row["group_id"]] = str_replace("<!--abs_amount-->", $this->FormatTimespan($row["am"]), $rows[$row["group_id"]]);
                $rows[$row["group_id"]] = str_replace("<!--count-->", ++$counter, $rows[$row["group_id"]]);
                $graphData[$row["group_id"]] = array(($secondsInPeriod / 3600), round(($row["am"] / 3600), 1));
            }
        }
        foreach (Server::$Groups as $id => $group)
            if (!isset($rows[$id]) && !$group->IsDynamic) {
                $secondsInPeriod = $this->GetSecondsOfPeriodGroup($id);
                $rows[$id] = str_replace("<!--title-->", $group->Id, $trow);
                $rows[$id] = str_replace("<!--rel_amount-->", 0, $rows[$id]);
                $rows[$id] = str_replace("<!--abs_amount-->", $this->FormatTimespan(0), $rows[$id]);
                $rows[$id] = str_replace("<!--count-->", ++$counter, $rows[$id]);
                $graphData[$id] = array(($secondsInPeriod / 3600), 0);
            }
        foreach ($rows as $hrow)
            $hrows .= $hrow;

        $html = str_replace("<!--rows-->", $hrows, IOStruct::GetFile(TEMPLATE_HTML_STATS_TOP_TABLE));
        $html = str_replace("<!--column_count_width-->", "12", $html);
        $html = str_replace("<!--expand_all-->", "none", $html);
        $html = str_replace("<!--expand_all_block-->", "", $html);
        $html = str_replace("<!--graph-->", $this->GetGraphImageTag($graphData, array(LocalizationManager::$TranslationStrings["stats_hours"], LocalizationManager::$TranslationStrings["stats_target_availability"], LocalizationManager::$TranslationStrings["stats_availability"])), $html);
        $html = str_replace("<!--width-->", $this->GetGraphWidth(), $html);
        $html = str_replace("<!--column_value_title-->", "<!--lang_stats_group-->", $html);
        $html = str_replace("<!--description-->", "<!--lang_stats_absolute-->: <!--lang_stats_availability--> (hh:mm:ss)", $html);
        return str_replace("<!--title-->", "<!--lang_stats_group_availability-->", $html);
    }

    private function GetGoalTable($counter = 0, $rows = "")
    {
        $html = str_replace("<!--title-->", "<!--lang_stats_goals-->", IOStruct::GetFile(TEMPLATE_HTML_STATS_TOP_TABLE));
        $rowt = IOStruct::GetFile(TEMPLATE_HTML_STATS_TOP_ROW);
        $rowti = IOStruct::GetFile(TEMPLATE_HTML_STATS_TOP_ROW_INNER);
        foreach ($this->Tops[21] as $id => $values) {
            $queries = "";
            if (!empty($values[5]) > 0) {
                $qcount = 1;
                foreach ($values[5] as $qparts) {
                    if (!empty($qparts[1])) {
                        $row = str_replace("<!--title-->", "<a href=\"http://www.google.com/search?q=" . urlencode($qparts[1]) . "\" target=\"_blank\">" . $qparts[1] . "</a>", $rowti);
                        $row = str_replace("<!--rel_amount-->", Num::Divide((100 * $qparts[2]), $values[0], StatisticProvider::$RoundPrecision), $row);
                        $row = str_replace("<!--rel_floor_amount-->", 100 - Num::Divide((100 * $qparts[2]), $values[0], false, true), $row);
                        $row = str_replace("<!--abs_amount-->", number_format($qparts[2], 0, ".", "."), $row);
                        $queries .= str_replace("<!--count-->", $qcount++, $row);
                    }
                }
            }

            if (!empty($queries)) {
                $queries = str_replace("<!--rows-->", $queries, IOStruct::GetFile(TEMPLATE_HTML_STATS_TOP_TABLE_INNER));
                $queries = str_replace("<!--link_title-->", "<!--lang_stats_search_phrases--> (" . ($qcount - 1) . ")", $queries);
                $queries = str_replace("<!--expand_all-->", "none", $queries);
                $queries = str_replace("<!--column_value_title-->", "<!--lang_stats_search_phrases-->", $queries);
                $queries = str_replace("<!--expand_all_block-->", $id, $queries);
            }

            $counter++;
            $row = str_replace("<!--trend-->", "const", str_replace("<!--title-->", "<b>" . $values[3] . "</b><br>" . $values[4] . $queries, str_replace("<!--value-->", $values[0], $rowt)));
            $row = str_replace("<!--rel_amount-->", $values[1], $row);
            $row = str_replace("<!--rel_floor_amount-->", $values[2], $row);
            $row = str_replace("<!--abs_amount-->", number_format($values[0], 0, ".", "."), $row);
            $rows .= str_replace("<!--count-->", $counter, $row);
        }
        if (count($this->Tops[21]) == 0) {
            $rows .= str_replace("<!--trend-->", "const", str_replace("<!--title-->", "<!--lang_stats_none-->", str_replace("<!--count-->", "", str_replace("<!--abs_amount-->", 0, str_replace("<!--rel_floor_amount-->", 100, str_replace("<!--rel_amount-->", 0, str_replace("<!--value-->", "-", $rowt)))))));
        }
        $html = str_replace("<!--trend-->", "<!--lang_stats_trend-->", $html);
        $html = str_replace("<!--column_count_width-->", "12", $html);
        $html = str_replace("<!--expand_all-->", "none", $html);
        $html = str_replace("<!--expand_all_block-->", "", $html);
        $html = str_replace("<!--column_value_title-->", "<!--lang_stats_goals-->", $html);
        return str_replace("<!--rows-->", $rows, $html);
    }

    function GetBaseTable($_title, $_values, $rows = "")
    {
        $table = str_replace("<!--title-->", $_title, IOStruct::GetFile(TEMPLATE_HTML_STATS_BASE_TABLE));
        $row = IOStruct::GetFile(TEMPLATE_HTML_STATS_BASE_ROW);
        foreach ($_values as $title => $values)
            $rows .= str_replace("<!--trend_value-->", $values[1], str_replace("<!--title-->", $title, str_replace("<!--value-->", $values[0], $row)));
        return str_replace("<!--rows-->", $rows, $table);
    }

    function GetSecondsOfPeriodGroup($_group, $_all = false)
    {
        $seconds = 0;
        if (isset(Server::$Groups[$_group])) {
            if (count(Server::$Groups[$_group]->OpeningHours) > 0) {
                foreach (Server::$Groups[$_group]->OpeningHours as $hour) {
                    if ($this->Type == STATISTIC_PERIOD_TYPE_DAY) {
                        if ($hour[0] == date("N"))
                            $seconds += ($hour[2] - $hour[1]);
                    } else {
                        $st = $this->StartTime;
                        while ($st < $this->EndTime) {
                            if ($hour[0] == date("N", $st))
                                $seconds += ($hour[2] - $hour[1]);

                            $st += 86400;
                        }
                    }
                }
                return $seconds;
            }
        } else if ($_all) {
            Server::InitDataBlock(array("GROUPS"));
            foreach (Server::$Groups as $gid => $group)
                $seconds = max($seconds, $this->GetSecondsOfPeriodGroup($gid));
            return $seconds;
        }
        return 3600 * StatisticProvider::$OpeningHours * $this->DayCount;
    }

    function GetSecondsOfPeriodOperator($_operator)
    {
        $seconds = 0;
        if (isset(Server::$Operators[$_operator])) {
            foreach (Server::$Operators[$_operator]->Groups as $groupid)
                $seconds = max($this->GetSecondsOfPeriodGroup($groupid), $seconds);

            if ($seconds > 0)
                return $seconds;
        }
        return 3600 * StatisticProvider::$OpeningHours * $this->DayCount;
    }

    function GetVisitorsByMonths($_impressions = false, $html = "")
    {
        $hrow = IOStruct::GetFile(TEMPLATE_HTML_STATS_SPAN_ROW);
        $total = 0;

        foreach ($this->Months as $month)
            $total = max($total, ($_impressions) ? $month->PageImpressionsTotal : $month->VisitorsTotal);
        foreach ($this->Months as $month) {
            $value = ($_impressions) ? $month->PageImpressionsTotal : $month->VisitorsTotal;
            $html .= str_replace("<!--title-->", "<!--lang_stats_month_" . strtolower(date("F", mktime(0, 0, 0, $month->Month, 1, $month->Year))) . "-->", $hrow);
            if ($total > 0)
                $html = str_replace("<!--rel_floor_amount-->", 100 - Num::Divide((100 * $value), $total, false, true), $html);
            else
                $html = str_replace("<!--rel_floor_amount-->", 100, $html);
            $html = str_replace("<!--abs_amount-->", number_format($value, 0, ".", "."), $html);
            $html = str_replace("<!--count-->", date("m", mktime(0, 0, 0, $month->Month, 1, $month->Year)) . "/" . $month->Year, $html);
        }
        $html = str_replace("<!--rows-->", $html, IOStruct::GetFile(TEMPLATE_HTML_STATS_SPAN_TABLE));
        $html = str_replace("<!--column_count_width-->", "70", $html);
        $html = str_replace("<!--column_value_title-->", "<!--lang_stats_by_days-->", $html);
        return str_replace("<!--title-->", ($_impressions) ? "<!--lang_stats_page_impressions-->" : "<!--lang_stats_visitors-->", $html);
    }

    function GetOperatorsByMonths($counter = 0, $html = "", $crow = "")
    {

        $hrow = IOStruct::GetFile(TEMPLATE_HTML_STATS_HOURS_HIDDEN_ROW);
        $trow = IOStruct::GetFile(TEMPLATE_HTML_STATS_TOP_ROW);
        $rows = array();

        foreach ($this->Months as $month)
            $months[intval($month->Month)] = 0;

        $result = DBManager::Execute(true, "SELECT *,SUM(`seconds`) as `am` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_AVAILABILITIES . "` WHERE" . $this->GetNoneAggregatedDateMatch() . " GROUP BY `user_id`,`year`,`month` ORDER BY `user_id`,`year`,`month` ASC;");
        while ($row = DBManager::FetchArray($result)) {
            $secondsInPeriod = 3600 * 24 * $this->Months[$month->Month]->DayCount;
            if (isset(Server::$Operators[$row["user_id"]]) && Server::$Operators[$row["user_id"]]->AffectsStatistic()) {
                if (!isset($count[$row["month"]]))
                    $count[$row["month"]] = 0;

                $rows[$row["month"]][$row["user_id"]] = str_replace("<!--title-->", ((isset(Server::$Operators[$row["user_id"]])) ? Server::$Operators[$row["user_id"]]->Fullname : "<!--lang_stats_unknown-->"), $hrow);
                $rows[$row["month"]][$row["user_id"]] = str_replace("<!--rel_amount-->", Num::Divide((100 * $row["am"]), $secondsInPeriod, StatisticProvider::$RoundPrecision), $rows[$row["month"]][$row["user_id"]]);
                $rows[$row["month"]][$row["user_id"]] = str_replace("<!--rel_floor_amount-->", 100 - Num::Divide((100 * $row["am"]), $secondsInPeriod, false, true), $rows[$row["month"]][$row["user_id"]]);
                $rows[$row["month"]][$row["user_id"]] = str_replace("<!--abs_amount-->", $this->FormatTimespan($row["am"]), $rows[$row["month"]][$row["user_id"]]);
                $rows[$row["month"]][$row["user_id"]] = str_replace("<!--count-->", ++$count[$row["month"]], $rows[$row["month"]][$row["user_id"]]);
                $rows[$row["month"]][$row["user_id"]] = str_replace("<!--id-->", "ma_" . $row["month"] . "<!--number-->", $rows[$row["month"]][$row["user_id"]]);
            } else
                $months[$row["month"]] += $row["am"];
        }

        foreach ($this->Months as $month) {
            $secondsInPeriod = 3600 * 24 * $this->Months[$month->Month]->DayCount;
            $monthnumb = intval($month->Month);
            $counter = 1;
            $orows = "";
            if (isset($rows[$monthnumb])) {
                $crow .= str_replace("<!--title-->", "<a href=\"javascript:switchRowVisibility('ma_" . $monthnumb . "');\"><!--lang_stats_month_" . strtolower(date("F", mktime(0, 0, 0, $month->Month, 1, $month->Year))) . "--></a>", $trow);
                foreach ($rows[$monthnumb] as $row)
                    $orows .= str_replace("<!--number-->", $counter++, $row);
            } else
                $crow .= str_replace("<!--title-->", "<!--lang_stats_month_" . strtolower(date("F", mktime(0, 0, 0, $month->Month, 1, $month->Year))) . "-->", $trow);

            $crow = str_replace("<!--rel_amount-->", Num::Divide((100 * $months[$monthnumb]), $secondsInPeriod, StatisticProvider::$RoundPrecision), $crow);
            $crow = str_replace("<!--rel_floor_amount-->", 100 - Num::Divide((100 * $months[$monthnumb]), $secondsInPeriod, false, true), $crow);
            $crow = str_replace("<!--abs_amount-->", $this->FormatTimespan($months[$monthnumb]), $crow);
            $crow = str_replace("<!--count-->", date("m", mktime(0, 0, 0, $month->Month, 1, $month->Year)) . "/" . $month->Year, $crow);
            $crow .= $orows;
        }
        $html = str_replace("<!--rows-->", $crow, IOStruct::GetFile(TEMPLATE_HTML_STATS_TOP_TABLE));
        $html = str_replace("<!--column_count_width-->", "70", $html);
        $html = str_replace("<!--expand_all-->", "", $html);
        $html = str_replace("<!--expand_all_block-->", "ma", $html);
        $html = str_replace("<!--column_value_title-->", "<!--lang_stats_hour-->", $html);
        return str_replace("<!--title-->", "<!--lang_stats_operator_availability-->", $html);
    }

    function GetChatsByMonths($crow = "", $max = 0)
    {
        $rows = array();
        foreach ($this->Months as $month)
            $months[intval($month->Month)] = array(0, 0, 0);
        $hrow = IOStruct::GetFile(TEMPLATE_HTML_STATS_HOURS_HIDDEN_ROW);
        $trow = IOStruct::GetFile(TEMPLATE_HTML_STATS_TOP_ROW);
        $result = DBManager::Execute(true, "SELECT *,SUM(`amount`) AS `amount`,SUM(`accepted`) AS `acc`,SUM(`declined`) AS `dec`,(SELECT SUM(`amount`) FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_CHATS . "` WHERE" . $this->GetNoneAggregatedDateMatch() . " AND `group_id`='') AS total,(SELECT `amount` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_CHATS . "` WHERE" . $this->GetNoneAggregatedDateMatch() . " AND `group_id` = '' ORDER BY `amount` DESC LIMIT 1) AS `mamount` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_CHATS . "` WHERE" . $this->GetNoneAggregatedDateMatch() . " AND `group_id` = '' GROUP BY `user_id`,`year`,`month` ORDER BY `user_id`,`year`,`month` ASC;");
        while ($row = DBManager::FetchArray($result)) {
            if (isset(Server::$Operators[$row["user_id"]])) {
                if (!isset($count[$row["month"]]))
                    $count[$row["month"]] = 0;

                $rows[$row["month"]][$row["user_id"]] = str_replace("<!--title-->", ((isset(Server::$Operators[$row["user_id"]])) ? Server::$Operators[$row["user_id"]]->Fullname : "<!--lang_stats_unknown-->"), $hrow);
                $rows[$row["month"]][$row["user_id"]] = str_replace("<!--rel_amount-->", Num::Divide((100 * $row["amount"]), $row["total"], StatisticProvider::$RoundPrecision), $rows[$row["month"]][$row["user_id"]]);
                $rows[$row["month"]][$row["user_id"]] = str_replace("<!--rel_floor_amount-->", 100 - Num::Divide((100 * $row["amount"]), $row["total"], false, true), $rows[$row["month"]][$row["user_id"]]);
                $rows[$row["month"]][$row["user_id"]] = str_replace("<!--abs_amount-->", $row["amount"] . " (" . $row["acc"] . " / " . $row["dec"] . " / " . ($row["amount"] - $row["dec"] - $row["acc"]) . ")", $rows[$row["month"]][$row["user_id"]]);
                $rows[$row["month"]][$row["user_id"]] = str_replace("<!--count-->", ++$count[$row["month"]], $rows[$row["month"]][$row["user_id"]]);
                $rows[$row["month"]][$row["user_id"]] = str_replace("<!--id-->", "cbd_" . $row["month"] . "<!--number-->", $rows[$row["month"]][$row["user_id"]]);
            }
            $months[$row["month"]][0] += $row["amount"];
            $months[$row["month"]][1] += $row["dec"];
            $months[$row["month"]][2] += $row["acc"];
            $max = $row["total"];
        }

        foreach ($this->Months as $month) {
            $int = intval($month->Month);
            $counter = 1;
            $orows = "";
            if (isset($rows[$int])) {
                $crow .= str_replace("<!--title-->", "<a href=\"javascript:switchRowVisibility('cbd_" . $int . "');\"><!--lang_stats_month_" . strtolower(date("F", mktime(0, 0, 0, $month->Month, 1, $month->Year))) . "--></a>", $trow);
                foreach ($rows[$int] as $row)
                    $orows .= str_replace("<!--number-->", $counter++, $row);
            } else
                $crow .= str_replace("<!--title-->", "<!--lang_stats_month_" . strtolower(date("F", mktime(0, 0, 0, $month->Month, 1, $month->Year))) . "-->", $trow);

            $crow = str_replace("<!--rel_amount-->", Num::Divide((100 * $months[$int][0]), $max, StatisticProvider::$RoundPrecision), $crow);
            $crow = str_replace("<!--rel_floor_amount-->", 100 - Num::Divide((100 * $months[$int][0]), $max, false, true), $crow);
            $crow = str_replace("<!--abs_amount-->", $months[$int][0] . " (" . $months[$int][2] . " / " . $months[$int][1] . " / " . ($months[$int][0] - $months[$int][1] - $months[$int][2]) . ")", $crow);
            $crow = str_replace("<!--count-->", date("m", mktime(0, 0, 0, $month->Month, 1, $month->Year)) . "/" . $month->Year, $crow);
            $crow .= $orows;
        }
        $html = str_replace("<!--rows-->", $crow, IOStruct::GetFile(TEMPLATE_HTML_STATS_TOP_TABLE));
        $html = str_replace("<!--column_count_width-->", "70", $html);
        $html = str_replace("<!--expand_all-->", "", $html);
        $html = str_replace("<!--expand_all_block-->", "cbd", $html);
        $html = str_replace("<!--column_value_title-->", "<!--lang_stats_hour-->", $html);
        $html = str_replace("<!--description-->", "<!--lang_stats_absolute-->: <!--lang_stats_description_operator_chats-->", $html);
        return str_replace("<!--title-->", "Chats", $html);
    }

    function GetVisitorsByDays($_impressions = false, $html = "")
    {
        $hrow = IOStruct::GetFile(TEMPLATE_HTML_STATS_SPAN_ROW);
        $total = 0;
        foreach ($this->Days as $day)
            $total = max($total, ($_impressions) ? $day->PageImpressionsTotal : $day->VisitorsTotal);
        foreach ($this->Days as $day) {
            $value = ($_impressions) ? $day->PageImpressionsTotal : $day->VisitorsTotal;
            $html .= str_replace("<!--title-->", "&nbsp;", $hrow);
            if ($total > 0) {
                $html = str_replace("<!--rel_floor_amount-->", 100 - Num::Divide((100 * $value), $total, false, true), $html);
            } else {
                $html = str_replace("<!--rel_floor_amount-->", 100, $html);
            }
            $html = str_replace("<!--abs_amount-->", number_format($value, 0, ".", "."), $html);
            $html = str_replace("<!--count-->", StatisticProvider::GetDynamicDateFrame(mktime(0, 0, 0, $day->Month, $day->Day, $day->Year)), $html);
        }
        $html = str_replace("<!--rows-->", $html, IOStruct::GetFile(TEMPLATE_HTML_STATS_SPAN_TABLE));
        $html = str_replace("<!--column_count_width-->", "70", $html);
        $html = str_replace("<!--column_value_title-->", "&nbsp;", $html);
        return str_replace("<!--title-->", ($_impressions) ? "<!--lang_stats_page_impressions-->" : "<!--lang_stats_visitors-->", $html);
    }

    function GetOperatorsByDays($counter = 0, $html = "", $crow = "")
    {

        $hrow = IOStruct::GetFile(TEMPLATE_HTML_STATS_HOURS_HIDDEN_ROW);
        $trow = IOStruct::GetFile(TEMPLATE_HTML_STATS_TOP_ROW);
        $rows = array();

        foreach ($this->Days as $day)
            $days[intval($day->Day)] = 0;

        $secondsInPeriod = 3600 * 24;
        $result = DBManager::Execute(true, "SELECT *,SUM(`seconds`) as `am` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_AVAILABILITIES . "` WHERE" . $this->GetNoneAggregatedDateMatch() . " AND `group_id`='' GROUP BY `user_id`,`year`,`month`,`day` ORDER BY `user_id`,`day` ASC;");
        while ($row = DBManager::FetchArray($result)) {
            if (isset(Server::$Operators[$row["user_id"]]) && Server::$Operators[$row["user_id"]]->AffectsStatistic()) {
                if (!isset($count[$row["day"]]))
                    $count[$row["day"]] = 0;

                $rows[$row["day"]][$row["user_id"]] = str_replace("<!--title-->", ((isset(Server::$Operators[$row["user_id"]])) ? Server::$Operators[$row["user_id"]]->Fullname : "<!--lang_stats_unknown-->"), $hrow);
                $rows[$row["day"]][$row["user_id"]] = str_replace("<!--rel_amount-->", Num::Divide((100 * $row["am"]), $secondsInPeriod, StatisticProvider::$RoundPrecision), $rows[$row["day"]][$row["user_id"]]);
                $rows[$row["day"]][$row["user_id"]] = str_replace("<!--rel_floor_amount-->", 100 - Num::Divide((100 * $row["am"]), $secondsInPeriod, false, true), $rows[$row["day"]][$row["user_id"]]);
                $rows[$row["day"]][$row["user_id"]] = str_replace("<!--abs_amount-->", $this->FormatTimespan($row["am"]), $rows[$row["day"]][$row["user_id"]]);
                $rows[$row["day"]][$row["user_id"]] = str_replace("<!--count-->", ++$count[$row["day"]], $rows[$row["day"]][$row["user_id"]]);
                $rows[$row["day"]][$row["user_id"]] = str_replace("<!--id-->", "da_" . $row["day"] . "<!--number-->", $rows[$row["day"]][$row["user_id"]]);
            } else
                $days[$row["day"]] += $row["am"];
        }

        foreach ($this->Days as $day) {
            $daynumb = intval($day->Day);
            $counter = 1;
            $orows = "";
            if (isset($rows[$daynumb])) {
                $crow .= str_replace("<!--title-->", "<a href=\"javascript:switchRowVisibility('da_" . $daynumb . "');\">" . StatisticProvider::GetDynamicDateFrame(mktime(0, 0, 0, $day->Month, $day->Day, $day->Year)) . "</a>", $trow);
                foreach ($rows[$daynumb] as $row)
                    $orows .= str_replace("<!--number-->", $counter++, $row);
            } else
                $crow .= str_replace("<!--title-->", StatisticProvider::GetDynamicDateFrame(mktime(0, 0, 0, $day->Month, $day->Day, $day->Year)), $trow);

            $crow = str_replace("<!--rel_amount-->", Num::Divide((100 * $days[$daynumb]), $secondsInPeriod, StatisticProvider::$RoundPrecision), $crow);
            $crow = str_replace("<!--rel_floor_amount-->", 100 - Num::Divide((100 * $days[$daynumb]), $secondsInPeriod, false, true), $crow);
            $crow = str_replace("<!--abs_amount-->", $this->FormatTimespan($days[$daynumb]), $crow);
            $crow = str_replace("<!--count-->", "&nbsp;", $crow);
            $crow .= $orows;
        }
        $html = str_replace("<!--rows-->", $crow, IOStruct::GetFile(TEMPLATE_HTML_STATS_TOP_TABLE));
        $html = str_replace("<!--column_count_width-->", "25", $html);
        $html = str_replace("<!--expand_all-->", "", $html);
        $html = str_replace("<!--expand_all_block-->", "da", $html);
        $html = str_replace("<!--column_value_title-->", "<!--lang_stats_by_days-->", $html);
        return str_replace("<!--title-->", "<!--lang_stats_operator_availability-->", $html);
    }

    function GetChatsByDays($counter = 0, $html = "", $crow = "", $max = 0)
    {
        $rows = array();
        foreach ($this->Days as $day)
            $days[intval($day->Day)] = array(0, 0, 0);

        $hrow = IOStruct::GetFile(TEMPLATE_HTML_STATS_HOURS_HIDDEN_ROW);
        $trow = IOStruct::GetFile(TEMPLATE_HTML_STATS_TOP_ROW);
        $result = DBManager::Execute(true, "SELECT *,SUM(`amount`) AS `am`,SUM(`accepted`) AS `acc`,SUM(`declined`) AS `dec`,(SELECT SUM(`amount`) FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_CHATS . "` WHERE" . $this->GetNoneAggregatedDateMatch() . " AND `group_id` = '') AS `total` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_CHATS . "` WHERE" . $this->GetNoneAggregatedDateMatch() . " AND group_id = '' GROUP BY `user_id`,`year`,`month`,`day` ORDER BY `user_id`,`day` ASC;");

        while ($row = DBManager::FetchArray($result)) {
            if (isset(Server::$Operators[$row["user_id"]])) {
                if (!isset($count[$row["day"]]))
                    $count[$row["day"]] = 0;

                $rows[$row["day"]][$row["user_id"]] = str_replace("<!--title-->", ((isset(Server::$Operators[$row["user_id"]])) ? Server::$Operators[$row["user_id"]]->Fullname : "<!--lang_stats_unknown-->"), $hrow);
                $rows[$row["day"]][$row["user_id"]] = str_replace("<!--rel_amount-->", Num::Divide((100 * $row["am"]), $row["total"], StatisticProvider::$RoundPrecision), $rows[$row["day"]][$row["user_id"]]);
                $rows[$row["day"]][$row["user_id"]] = str_replace("<!--rel_floor_amount-->", 100 - Num::Divide((100 * $row["am"]), $row["total"], false, true), $rows[$row["day"]][$row["user_id"]]);
                $rows[$row["day"]][$row["user_id"]] = str_replace("<!--abs_amount-->", $row["am"] . " (" . $row["acc"] . " / " . $row["dec"] . " / " . ($row["am"] - $row["dec"] - $row["acc"]) . ")", $rows[$row["day"]][$row["user_id"]]);
                $rows[$row["day"]][$row["user_id"]] = str_replace("<!--count-->", ++$count[$row["day"]], $rows[$row["day"]][$row["user_id"]]);
                $rows[$row["day"]][$row["user_id"]] = str_replace("<!--id-->", "cbd_" . $row["day"] . "<!--number-->", $rows[$row["day"]][$row["user_id"]]);
            }

            $days[$row["day"]][0] += $row["am"];
            $days[$row["day"]][1] += $row["dec"];
            $days[$row["day"]][2] += $row["acc"];
            $max = $row["total"];
        }

        foreach ($this->Days as $day) {
            $int = intval($day->Day);
            $counter = 1;
            $orows = "";
            if (isset($rows[$int])) {
                $crow .= str_replace("<!--title-->", "<a href=\"javascript:switchRowVisibility('cbd_" . $int . "');\">" . StatisticProvider::GetDynamicDateFrame(mktime(0, 0, 0, $day->Month, $day->Day, $day->Year)) . "</a>", $trow);
                foreach ($rows[$int] as $row)
                    $orows .= str_replace("<!--number-->", $counter++, $row);
            } else
                $crow .= str_replace("<!--title-->", StatisticProvider::GetDynamicDateFrame(mktime(0, 0, 0, $day->Month, $day->Day, $day->Year)), $trow);

            $crow = str_replace("<!--rel_amount-->", Num::Divide((100 * $days[$int][0]), $max, StatisticProvider::$RoundPrecision), $crow);
            $crow = str_replace("<!--rel_floor_amount-->", 100 - Num::Divide((100 * $days[$int][0]), $max, false, true), $crow);
            $crow = str_replace("<!--abs_amount-->", $days[$int][0] . " (" . $days[$int][2] . " / " . $days[$int][1] . " / " . ($days[$int][0] - $days[$int][2] - $days[$int][1]) . ")", $crow);
            $crow = str_replace("<!--count-->", "&nbsp;", $crow);
            $crow .= $orows;
        }
        $html = str_replace("<!--rows-->", $crow, IOStruct::GetFile(TEMPLATE_HTML_STATS_TOP_TABLE));
        $html = str_replace("<!--column_count_width-->", "25", $html);
        $html = str_replace("<!--expand_all-->", "", $html);
        $html = str_replace("<!--expand_all_block-->", "cbd", $html);
        $html = str_replace("<!--column_value_title-->", "<!--lang_stats_by_days-->", $html);
        $html = str_replace("<!--description-->", "<!--lang_stats_absolute-->: <!--lang_stats_description_operator_chats-->", $html);
        return str_replace("<!--title-->", "Chats", $html);
    }

    function GetVisitorsByHour($_field, $_title, $counter = 0, $crow = "", $total = 0)
    {
        $hours = array(0 => 0, 1 => 0, 2 => 0, 3 => 0, 4 => 0, 5 => 0, 6 => 0, 7 => 0, 8 => 0, 9 => 0, 10 => 0, 11 => 0, 12 => 0, 13 => 0, 14 => 0, 15 => 0, 16 => 0, 17 => 0, 18 => 0, 19 => 0, 20 => 0, 21 => 0, 22 => 0, 23 => 0);
        $hrow = IOStruct::GetFile(TEMPLATE_HTML_STATS_SPAN_ROW);
        $result = DBManager::Execute(true, "SELECT *,(SELECT SUM(`" . $_field . "`) AS `maxval` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_VISITORS . "` WHERE" . $this->GetNoneAggregatedDateMatch() . " GROUP BY `hour` ORDER BY `maxval` DESC LIMIT 1) as `mtotal` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_VISITORS . "` WHERE" . $this->GetNoneAggregatedDateMatch() . " ORDER BY `hour` ASC;");
        while ($row = DBManager::FetchArray($result)) {
            $hours[$row["hour"]] += $row[$_field];
            $total = max($total, $row["mtotal"]);
        }
        foreach ($hours as $hour => $amount) {
            $crow .= str_replace("<!--title-->", date("H:i", mktime($hour, 0, 0)), $hrow);
            if ($total > 0)
                $crow = str_replace("<!--rel_floor_amount-->", 100 - Num::Divide((100 * $amount), $total, false, true), $crow);
            else
                $crow = str_replace("<!--rel_floor_amount-->", 100, $crow);
            $crow = str_replace("<!--abs_amount-->", number_format($amount, 0, ".", "."), $crow);
            $crow = str_replace("<!--count-->", "&nbsp;", $crow);
        }
        $html = str_replace("<!--rows-->", $crow, IOStruct::GetFile(TEMPLATE_HTML_STATS_SPAN_TABLE));
        $html = str_replace("<!--column_count_width-->", "25", $html);
        $html = str_replace("<!--column_value_title-->", "<!--lang_stats_hour-->", $html);
        return str_replace("<!--title-->", $_title, $html);
    }

    function GetChatsByHour($crow = "", $max = 0)
    {
        $rows = array();
        $hours = array(array(0, 0, 0), array(0, 0, 0), array(0, 0, 0), array(0, 0, 0), array(0, 0, 0), array(0, 0, 0), array(0, 0, 0), array(0, 0, 0), array(0, 0, 0), array(0, 0, 0), array(0, 0, 0), array(0, 0, 0), array(0, 0, 0), array(0, 0, 0), array(0, 0, 0), array(0, 0, 0), array(0, 0, 0), array(0, 0, 0), array(0, 0, 0), array(0, 0, 0), array(0, 0, 0), array(0, 0, 0), array(0, 0, 0), array(0, 0, 0));
        $hrow = IOStruct::GetFile(TEMPLATE_HTML_STATS_HOURS_HIDDEN_ROW);
        $trow = IOStruct::GetFile(TEMPLATE_HTML_STATS_TOP_ROW);
        $result = DBManager::Execute(true, "SELECT *,(SELECT SUM(`amount`) FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_CHATS . "` WHERE" . $this->GetNoneAggregatedDateMatch() . " AND `group_id` = '') AS `total` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_CHATS . "` WHERE" . $this->GetNoneAggregatedDateMatch() . " AND `group_id` = '' ORDER BY `user_id`,`hour` ASC;");
        while ($row = DBManager::FetchArray($result)) {
            if (!isset($hours[$row["hour"]][$row["user_id"]]))
                $hours[$row["hour"]][$row["user_id"]] = array(0, 0, 0);

            if (isset(Server::$Operators[$row["user_id"]]) && Server::$Operators[$row["user_id"]]->AffectsStatistic(true)) {
                if (!isset($hours[$row["hour"]][$row["user_id"]]))
                    $hours[$row["hour"]][$row["user_id"]] = array(0, 0, 0);

                $hours[$row["hour"]][$row["user_id"]][0] += $row["amount"];
                $hours[$row["hour"]][$row["user_id"]][1] += $row["declined"];
                $hours[$row["hour"]][$row["user_id"]][2] += $row["accepted"];
            }

            if (!isset($hours[$row["hour"]]["total"]))
                $hours[$row["hour"]]["total"] = array(0, 0, 0);

            $hours[$row["hour"]]["total"][0] += $row["amount"];
            $hours[$row["hour"]]["total"][1] += $row["declined"];
            $hours[$row["hour"]]["total"][2] += $row["accepted"];
            $max = $row["total"];
        }

        foreach ($hours as $hour => $objar)
            foreach ($objar as $uid => $values) {
                if ($uid == "total" || !isset(Server::$Operators[$uid]))
                    continue;

                $rows[$hour][$uid] = str_replace("<!--title-->", Server::$Operators[$uid]->Fullname, $hrow);
                $rows[$hour][$uid] = str_replace("<!--rel_amount-->", Num::Divide((100 * $values[0]), $max, StatisticProvider::$RoundPrecision), $rows[$hour][$uid]);
                $rows[$hour][$uid] = str_replace("<!--rel_floor_amount-->", 100 - Num::Divide((100 * $values[0]), $max, false, true), $rows[$hour][$uid]);
                $rows[$hour][$uid] = str_replace("<!--abs_amount-->", $values[0] . " (" . $values[2] . " / " . $values[1] . " / " . ($values[0] - $values[1] - $values[2]) . ")", $rows[$hour][$uid]);
                $rows[$hour][$uid] = str_replace("<!--id-->", "cbh_" . $hour . "<!--number-->", $rows[$hour][$uid]);
            }

        for ($int = 0; $int < 24; $int++) {
            $counter = 1;
            $orows = "";
            if (isset($rows[$int])) {
                $crow .= str_replace("<!--title-->", "<a href=\"javascript:switchRowVisibility('cbh_" . $int . "');\">" . date("H:i", mktime($int, 0, 0)) . "</a>", $trow);
                foreach ($rows[$int] as $row) {
                    $orows .= str_replace("<!--number-->", $counter, $row);
                    $orows = str_replace("<!--count-->", $counter++, $orows);
                }
            } else
                $crow .= str_replace("<!--title-->", date("H:i", mktime($int, 0, 0)), $trow);

            if (!isset($hours[$int]["total"]))
                $hours[$int]["total"] = array(0, 0, 0);

            $crow = str_replace("<!--rel_amount-->", ($max > 0) ? Num::Divide((100 * $hours[$int]["total"][0]), $max, StatisticProvider::$RoundPrecision) : "0", $crow);
            $crow = str_replace("<!--rel_floor_amount-->", 100 - Num::Divide((100 * $hours[$int]["total"][0]), $max, false, true), $crow);
            $crow = str_replace("<!--abs_amount-->", $hours[$int]["total"][0] . " (" . $hours[$int]["total"][2] . " / " . $hours[$int]["total"][1] . " / " . ($hours[$int]["total"][0] - $hours[$int]["total"][2] - $hours[$int]["total"][1]) . ")", $crow);
            $crow = str_replace("<!--count-->", "&nbsp;", $crow);
            $crow .= $orows;
        }
        $html = str_replace("<!--rows-->", $crow, IOStruct::GetFile(TEMPLATE_HTML_STATS_TOP_TABLE));
        $html = str_replace("<!--column_count_width-->", "25", $html);
        $html = str_replace("<!--expand_all-->", "", $html);
        $html = str_replace("<!--expand_all_block-->", "cbh", $html);
        $html = str_replace("<!--column_value_title-->", "<!--lang_stats_hour-->", $html);
        $html = str_replace("<!--description-->", "<!--lang_stats_absolute-->: <!--lang_stats_description_operator_chats-->", $html);
        return str_replace("<!--title-->", "Chats", $html);
    }

    function GetOperatorsByHour($crow = "")
    {

        $hrow = IOStruct::GetFile(TEMPLATE_HTML_STATS_HOURS_HIDDEN_ROW);
        $trow = IOStruct::GetFile(TEMPLATE_HTML_STATS_TOP_ROW);
        $rows = array();
        $hours = array(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
        $ontime = array();
        $secondsInPeriod = 3600 * $this->DayCount;

        $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_AVAILABILITIES . "` WHERE" . $this->GetNoneAggregatedDateMatch() . " GROUP BY `user_id`,`day`,`hour`,`status` ORDER BY `user_id` ASC,`hour` ASC,`status` ASC;");

        while ($row = DBManager::FetchArray($result)) {
            $row["seconds"] = min($row["seconds"], 3600);

            if (isset(Server::$Operators[$row["user_id"]]) && Server::$Operators[$row["user_id"]]->AffectsStatistic()) {
                $rows[$row["hour"]][$row["user_id"]] = str_replace("<!--title-->", ((isset(Server::$Operators[$row["user_id"]])) ? (Server::$Operators[$row["user_id"]]->Fullname) : "<!--lang_stats_unknown-->"), $hrow);
                $rows[$row["hour"]][$row["user_id"]] = str_replace("<!--id-->", "oa_" . $row["hour"] . "<!--number-->", $rows[$row["hour"]][$row["user_id"]]);

                if (!isset($ontime[$row["user_id"]][$row["hour"]]))
                    $ontime[$row["user_id"]][$row["hour"]] = array(USER_STATUS_BUSY => 0, USER_STATUS_ONLINE => 0);

                $ontime[$row["user_id"]][$row["hour"]][$row["status"]] += $row["seconds"];
            } else if ($row["user_id"] == "everyoneintern")
                $hours[$row["hour"]] += $row["seconds"];
        }

        for ($int = 0; $int < 24; $int++) {
            $counter = 1;
            $orows = "";
            $count[$int] = 1;

            if (isset($rows[$int])) {
                $crow .= str_replace("<!--title-->", "<a href=\"javascript:switchRowVisibility('oa_" . $int . "');\">" . date("H:i", mktime($int, 0, 0)) . "</a>", $trow);
                foreach ($rows[$int] as $sysid => $row) {
                    $secval = $ontime[$sysid][$int][USER_STATUS_ONLINE];
                    $busystr = $this->FormatTimespan($ontime[$sysid][$int][USER_STATUS_BUSY]);
                    $totalval = $secval + $ontime[$sysid][$int][USER_STATUS_BUSY];

                    $row = str_replace("<!--rel_amount-->", Num::Divide((100 * $totalval), $secondsInPeriod, StatisticProvider::$RoundPrecision), $row);
                    $row = str_replace("<!--rel_floor_amount-->", 100 - Num::Divide((100 * $totalval), $secondsInPeriod, false, true), $row);
                    $row = str_replace("<!--abs_amount-->", $this->FormatTimespan($secval) . "&nbsp;(" . $busystr . ")", $row);

                    $row = str_replace("<!--count-->", $count[$int]++, $row);
                    $orows .= str_replace("<!--number-->", $counter++, $row);
                }
            } else
                $crow .= str_replace("<!--title-->", date("H:i", mktime($int, 0, 0)), $trow);

            $crow = str_replace("<!--rel_amount-->", Num::Divide((100 * $hours[$int]), $secondsInPeriod, StatisticProvider::$RoundPrecision), $crow);
            $crow = str_replace("<!--rel_floor_amount-->", 100 - Num::Divide((100 * $hours[$int]), $secondsInPeriod, false, true), $crow);
            $crow = str_replace("<!--abs_amount-->", $this->FormatTimespan($hours[$int]), $crow);
            $crow = str_replace("<!--count-->", "&nbsp;", $crow);
            $crow .= $orows;
        }
        $html = str_replace("<!--rows-->", $crow, IOStruct::GetFile(TEMPLATE_HTML_STATS_TOP_TABLE));
        $html = str_replace("<!--column_count_width-->", "25", $html);
        $html = str_replace("<!--expand_all-->", "", $html);
        $html = str_replace("<!--expand_all_block-->", "oa", $html);
        $html = str_replace("<!--column_value_title-->", "<!--lang_stats_hour-->", $html);
        $html = str_replace("<!--description-->", "<!--lang_stats_absolute-->: <!--lang_stats_status_online--> (<!--lang_stats_status_busy-->)", $html);
        return str_replace("<!--title-->", "<!--lang_stats_operator_availability-->", $html);
    }

    function LoadURLTable($_table, $_id, $_maxlength, $_title, $_max, $counter = 0)
    {
        $result = DBManager::Execute(true, "SELECT `" . DB_PREFIX . DATABASE_VISITOR_DATA_PAGES . "`.`domain` as did,`" . DB_PREFIX . DATABASE_VISITOR_DATA_PAGES . "`.`path` as pid,`" . DB_PREFIX . DATABASE_VISITOR_DATA_DOMAINS . "`.`domain`,`" . DB_PREFIX . DATABASE_VISITOR_DATA_PATHS . "`.`path`,`amount` as abs FROM `" . DB_PREFIX . $_table . "` INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_PAGES . "` ON `" . DB_PREFIX . $_table . "`.`url` = `" . DB_PREFIX . DATABASE_VISITOR_DATA_PAGES . "`.`id` INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_DOMAINS . "` ON `" . DB_PREFIX . DATABASE_VISITOR_DATA_PAGES . "`.`domain` = `" . DB_PREFIX . DATABASE_VISITOR_DATA_DOMAINS . "`.`id` INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_PATHS . "` ON `" . DB_PREFIX . DATABASE_VISITOR_DATA_PAGES . "`.`path` = `" . DB_PREFIX . DATABASE_VISITOR_DATA_PATHS . "`.`id` WHERE" . $this->GetDateMatch() . " AND `" . DB_PREFIX . DATABASE_VISITOR_DATA_DOMAINS . "`.`domain`!='' ORDER BY `abs` DESC,`title` DESC LIMIT " . DBManager::RealEscape(StatisticProvider::$DayItemAmount) . ";");
        while (($row = DBManager::FetchArray($result))) {
            if ($row["abs"] > 0 && $_max > 0) {
                $url = new BaseURL($row["domain"], $row["path"], "", "");
                $results = DBManager::Execute(true, "SELECT dbt.`title` FROM `" . DB_PREFIX . DATABASE_VISITOR_DATA_PAGES . "` INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_TITLES . "` AS `dbt` ON `dbt`.`id` = `" . DB_PREFIX . DATABASE_VISITOR_DATA_PAGES . "`.`title` WHERE `" . DB_PREFIX . DATABASE_VISITOR_DATA_PAGES . "`.`path`='" . DBManager::RealEscape($row["pid"]) . "' AND `" . DB_PREFIX . DATABASE_VISITOR_DATA_PAGES . "`.`domain`='" . DBManager::RealEscape($row["did"]) . "';");
                $rows = DBManager::FetchArray($results);

                $url->Params = "";
                $title = ((!$_title) ? substr(((StatisticProvider::$AggregateDomains) ? $url->Path : $url->GetAbsoluteUrl()), 0, $_maxlength) : ($rows["title"]));
                if (empty($title))
                    $title = "<!--lang_stats_unknown-->";
                $title = "<a href=\"" . @htmlentities(StatisticProvider::$Dereferrer . $url->GetAbsoluteUrl(), ENT_QUOTES, 'UTF-8') . "\" target=\"_blank\">" . $title . "</a>";
                $this->Tops[$_id][++$counter] = array($title, Num::Divide((100 * $row["abs"]), $_max, StatisticProvider::$RoundPrecision), 100 - Num::Divide((100 * $row["abs"]), $_max, false, true), $row["abs"]);
            }
        }
        if ($counter == 0)
            $this->Tops[$_id][++$counter] = array("<!--lang_stats_none-->", 0, 100, 0);
    }

    function LoadSearchEngineTable($_id, $_maxlength, $counter = 0)
    {
        $row = DBManager::FetchArray(DBManager::Execute(true, "SELECT SUM(`amount`) AS `total` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_SEARCH_ENGINES . "` INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_DOMAINS . "` ON `" . DB_PREFIX . DATABASE_STATS_AGGS_SEARCH_ENGINES . "`.`domain` = `" . DB_PREFIX . DATABASE_VISITOR_DATA_DOMAINS . "`.`id` WHERE `" . DB_PREFIX . DATABASE_VISITOR_DATA_DOMAINS . "`.`domain` != '' AND" . $this->GetDateMatch() . " LIMIT " . DBManager::RealEscape(StatisticProvider::$DayItemAmount) . ";"));
        $_total = $row["total"];

        $result = DBManager::Execute(true, "SELECT `" . DB_PREFIX . DATABASE_VISITOR_DATA_DOMAINS . "`.`domain`,`amount` AS `tam` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_SEARCH_ENGINES . "` INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_DOMAINS . "` ON `" . DB_PREFIX . DATABASE_STATS_AGGS_SEARCH_ENGINES . "`.`domain` = `" . DB_PREFIX . DATABASE_VISITOR_DATA_DOMAINS . "`.`id` WHERE" . $this->GetDateMatch() . " ORDER BY `tam` DESC LIMIT " . DBManager::RealEscape(StatisticProvider::$DayItemAmount) . ";");
        while (($row = DBManager::FetchArray($result))) {
            if (!empty($row["domain"])) {
                $url = new BaseURL($row["domain"], "", "", "");
                $title = "<a href=\"" . @htmlentities(StatisticProvider::$Dereferrer . $url->GetAbsoluteUrl(), ENT_QUOTES, 'UTF-8') . "\" target=\"_blank\">" . @htmlentities(substr($url->GetAbsoluteUrl(), 0, $_maxlength), ENT_QUOTES, 'UTF-8') . "</a>";
                $this->Tops[$_id][++$counter] = array($title, Num::Divide((100 * $row["tam"]), $_total, StatisticProvider::$RoundPrecision), 100 - Num::Divide((100 * $row["tam"]), $_total, false, true), $row["tam"]);
            }
        }
        if ($counter == 0)
            $this->Tops[$_id][++$counter] = array("<!--lang_stats_none-->", 0, 100, 0);
    }

    function LoadKnowledgebaseTables($counter = 0)
    {
        $row = DBManager::FetchArray(DBManager::Execute(true, "SELECT SUM(`views`) AS `vtotal` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_KNOWLEDGEBASE . "` WHERE" . $this->GetNoneAggregatedDateMatch() . ";"));
        $_totalViews = max(1, $row["vtotal"]);

        $result = DBManager::Execute(true, "SELECT *,SUM(`views`) AS `tviews` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_KNOWLEDGEBASE . "` AS `t1` INNER JOIN `" . DB_PREFIX . DATABASE_RESOURCES . "` AS `t2` ON `t1`.`res_id`=`t2`.`id` WHERE" . $this->GetNoneAggregatedDateMatch() . " GROUP BY `res_id` ORDER BY `tviews` DESC LIMIT " . DBManager::RealEscape(StatisticProvider::$DayItemAmount) . ";");
        while (($row = DBManager::FetchArray($result))) {
            $title = "<a href=\"" . @htmlentities(StatisticProvider::$Dereferrer . LIVEZILLA_URL . "knowledgebase.php?article=" . urlencode($row["id"])) . "\" target=\"_blank\">" . @htmlentities(Str::Cut($row["title"], 56, true)) . "</a>";
            $this->Tops[28][++$counter] = array($title, Num::Divide((100 * $row["tviews"]), $_totalViews, StatisticProvider::$RoundPrecision), 100 - Num::Divide((100 * $row["tviews"]), $_totalViews, false, true), $row["tviews"]);
        }

        if ($counter == 0)
            $this->Tops[28][++$counter] = array("<!--lang_stats_none-->", 0, 100, 0);

        $min_votes = 1;
        $sort_alg = "((`rate_amount` / (`rate_amount`+" . $min_votes . ")) * ((`rate_positive`*100)/`rate_amount`) + (" . $min_votes . " / (`rate_amount`+" . $min_votes . ")) * 0.5) as `orderate`";
        $ratingtypes = array(27 => "DESC", 26 => "ASC");
        foreach ($ratingtypes as $id => $sorting) {
            $counter = 0;
            $result = DBManager::Execute(true, "SELECT *,((`rate_positive`*100)/`rate_amount`) as `avgrate`," . $sort_alg . " FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_KNOWLEDGEBASE . "` AS `t1` INNER JOIN `" . DB_PREFIX . DATABASE_RESOURCES . "` AS `t2` ON `t1`.`res_id`=`t2`.`id` WHERE" . $this->GetNoneAggregatedDateMatch() . " AND `rate_amount`>=" . $min_votes . " GROUP BY `res_id` ORDER BY `orderate` " . $sorting . " LIMIT " . DBManager::RealEscape(StatisticProvider::$DayItemAmount) . ";");
            while ($row = DBManager::FetchArray($result)) {
                $title = "<a href=\"" . @htmlentities(StatisticProvider::$Dereferrer . LIVEZILLA_URL . "knowledgebase.php?article=" . urlencode($row["id"])) . "\" target=\"_blank\">" . @htmlentities(Str::Cut($row["title"], 56, true)) . "</a>";
                $this->Tops[$id][++$counter] = array($title, @round($row["avgrate"], StatisticProvider::$RoundPrecision), 0, $row["rate_positive"] . " / " . $row["rate_amount"]);
            }

            if ($counter == 0)
                $this->Tops[$id][++$counter] = array("<!--lang_stats_none-->", 0, 100, 0);
        }

        $row = DBManager::FetchArray(DBManager::Execute(true, "SELECT SUM(`amount`) AS `qtotal` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_QUERIES . "` WHERE" . $this->GetDateMatch() . " AND type=1;"));
        $_totalQueries = $row["qtotal"];

        $counter = 0;
        $result = DBManager::Execute(true, "SELECT *,SUM(`amount`) AS `tamount` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_QUERIES . "` AS `t1` INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_QUERIES . "` AS `t2` ON `t1`.`query`=`t2`.`id` WHERE" . $this->GetDateMatch() . " AND `type`=1 GROUP BY `t1`.`query` ORDER BY `amount` DESC LIMIT " . DBManager::RealEscape(StatisticProvider::$DayItemAmount) . ";");
        while ($row = DBManager::FetchArray($result)) {
            $title = "<a href=\"" . @htmlentities(StatisticProvider::$Dereferrer . LIVEZILLA_URL . "knowledgebase.php?eq=" . urlencode($row["query"])) . "\" target=\"_blank\">" . @htmlentities(Str::Cut($row["query"], 56, true)) . "</a>";
            $this->Tops[29][++$counter] = array($title, Num::Divide((100 * $row["tamount"]), $_totalQueries, StatisticProvider::$RoundPrecision), 0, $row["tamount"]);
        }

        if ($counter == 0)
            $this->Tops[29][++$counter] = array("<!--lang_stats_none-->", 0, 100, 0);
    }

    function LoadReferrerTable($_id, $_maxlength, $_table, $_fullUrl, $_total, $_group = "", $counter = 0)
    {
        if (!empty($_group)) {
            $amount = "SUM(`amount`)";
            $groupBy = " GROUP BY " . $_group;
        } else {
            $amount = "`amount`";
            $groupBy = "";
        }

        $row = DBManager::FetchArray(DBManager::Execute(true, "SELECT SUM(`amount`) as `total` FROM `" . DB_PREFIX . $_table . "` INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_PAGES . "` ON `" . DB_PREFIX . $_table . "`.`referrer` = `" . DB_PREFIX . DATABASE_VISITOR_DATA_PAGES . "`.`id` INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_DOMAINS . "` ON `" . DB_PREFIX . DATABASE_VISITOR_DATA_PAGES . "`.`domain` = `" . DB_PREFIX . DATABASE_VISITOR_DATA_DOMAINS . "`.`id` INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_PATHS . "` ON `" . DB_PREFIX . DATABASE_VISITOR_DATA_PAGES . "`.`path` = `" . DB_PREFIX . DATABASE_VISITOR_DATA_PATHS . "`.`id` AND `" . DB_PREFIX . DATABASE_VISITOR_DATA_DOMAINS . "`.`domain` != '' WHERE" . $this->GetDateMatch() . " LIMIT " . DBManager::RealEscape(StatisticProvider::$DayItemAmount) . ";"));
        $_total = $row["total"];

        $result = DBManager::Execute(true, "SELECT `" . DB_PREFIX . DATABASE_VISITOR_DATA_DOMAINS . "`.`domain`,`" . DB_PREFIX . DATABASE_VISITOR_DATA_PATHS . "`.`path`," . $amount . " AS `tam` FROM `" . DB_PREFIX . $_table . "` INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_PAGES . "` ON `" . DB_PREFIX . $_table . "`.`referrer` = `" . DB_PREFIX . DATABASE_VISITOR_DATA_PAGES . "`.`id` INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_DOMAINS . "` ON `" . DB_PREFIX . DATABASE_VISITOR_DATA_PAGES . "`.`domain` = `" . DB_PREFIX . DATABASE_VISITOR_DATA_DOMAINS . "`.`id` INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_PATHS . "` ON `" . DB_PREFIX . DATABASE_VISITOR_DATA_PAGES . "`.`path` = `" . DB_PREFIX . DATABASE_VISITOR_DATA_PATHS . "`.`id` WHERE" . $this->GetDateMatch() . "" . $groupBy . " ORDER BY `tam` DESC LIMIT " . DBManager::RealEscape(StatisticProvider::$DayItemAmount) . ";");
        while (($row = DBManager::FetchArray($result))) {
            if (!empty($row["domain"])) {
                $url = new BaseURL($row["domain"], (($_fullUrl) ? $row["path"] : ""), "", "");
                $title = "<a href=\"" . @htmlentities(StatisticProvider::$Dereferrer . $url->GetAbsoluteUrl(), ENT_QUOTES, 'UTF-8') . "\" target=\"_blank\">" . @htmlentities(substr($url->GetAbsoluteUrl(), 0, $_maxlength), ENT_QUOTES, 'UTF-8') . "</a>";
                $this->Tops[$_id][++$counter] = array($title, Num::Divide((100 * $row["tam"]), $_total, StatisticProvider::$RoundPrecision), 100 - Num::Divide((100 * $row["tam"]), $_total, false, true), $row["tam"]);
            }
        }
        if ($counter == 0)
            $this->Tops[$_id][++$counter] = array("<!--lang_stats_none-->", 0, 100, 0);
    }

    function LoadTopTable($_id, $_maxlength, $_tables, $_fields, $_blanks, $_relSource, $_isURL = false, $_countField = "amount", $_orderField = "amount", $_direction = "DESC")
    {
        $counter = 0;
        if ($_relSource > 0) {
            if (count($_tables) == 2) {
                $_blanks = ($_blanks === true) ? "" : (($_blanks === false) ? " AND `" . DB_PREFIX . DBManager::RealEscape($_tables[1]) . "`.`" . DBManager::RealEscape($_fields[0]) . "`!=''" : $_blanks);
                $result = DBManager::Execute(true, "SELECT `" . DB_PREFIX . DBManager::RealEscape($_tables[1]) . "`.`" . DBManager::RealEscape($_fields[0]) . "`,`" . $_countField . "` FROM `" . DB_PREFIX . DBManager::RealEscape($_tables[0]) . "` INNER JOIN `" . DB_PREFIX . DBManager::RealEscape($_tables[1]) . "` ON `" . DB_PREFIX . DBManager::RealEscape($_tables[0]) . "`.`" . DBManager::RealEscape($_fields[1]) . "`=`" . DB_PREFIX . DBManager::RealEscape($_tables[1]) . "`.`id` WHERE " . $this->GetDateMatch() . $_blanks . "  ORDER BY `" . $_orderField . "` " . $_direction . "  LIMIT " . DBManager::RealEscape(StatisticProvider::$DayItemAmount) . ";");
            } else
                $result = DBManager::Execute(true, "SELECT `" . DB_PREFIX . DBManager::RealEscape($_tables[0]) . "`.`" . DBManager::RealEscape($_fields[0]) . "`,`" . $_countField . "` FROM `" . DB_PREFIX . DBManager::RealEscape($_tables[0]) . "` WHERE " . $this->GetDateMatch() . " ORDER BY `" . $_orderField . "` " . $_direction . "  LIMIT " . DBManager::RealEscape(StatisticProvider::$DayItemAmount) . ";");

            $values = array();
            while ($row = DBManager::FetchArray($result)) {
                if (!Is::Null(trim($row[$_fields[0]]))) {
                    if ($_id != 6)
                        $row[$_fields[0]] = ($_isURL) ? "<a href=\"" . @htmlentities(StatisticProvider::$Dereferrer . $row[$_fields[0]], ENT_QUOTES, 'UTF-8') . "\" target=\"_blank\">" . @htmlentities(substr($row[$_fields[0]], 0, $_maxlength), ENT_QUOTES, 'UTF-8') . "</a>" : @htmlentities(substr($row[$_fields[0]], 0, $_maxlength), ENT_QUOTES, 'UTF-8');
                    else
                        $row[$_fields[0]] = $row[$_fields[0]];

                    $title = $row[$_fields[0]];
                } else
                    $title = "<!--lang_stats_unknown-->";

                if (!isset($values[$title]))
                    $values[$title] = 0;

                $values[$title] += $row[$_countField];
            }
            foreach ($values as $title => $amount)
                $this->Tops[$_id][++$counter] = array($title, Num::Divide((100 * $amount), $_relSource, StatisticProvider::$RoundPrecision), 100 - Num::Divide((100 * $amount), $_relSource), $amount);
        }
        if ($counter == 0)
            $this->Tops[$_id][++$counter] = array("<!--lang_stats_none-->", 0, 100, 0);
    }

    function RenderTopURLTable($_id, $_title, $_column, $_trend = true, $_tabTitle1 = "URL", $_tabTitle2 = "<!--lang_stats_titles-->", $html = "")
    {
        $hrow = IOStruct::GetFile(TEMPLATE_HTML_STATS_TOP_ROW);
        $html = IOStruct::GetFile(TEMPLATE_HTML_STATS_TOP_URL_TABLE);
        for ($i = 1; $i <= 2; $i++) {
            $crow = "";

            if (!is_array($this->Tops[$_id + ($i - 1)])) {
                return "";
            }

            foreach ($this->Tops[$_id + ($i - 1)] as $count => $values) {
                $crow .= str_replace("<!--title-->", $values[0], $hrow);
                $crow = str_replace("<!--rel_amount-->", $values[1], $crow);
                $crow = str_replace("<!--rel_floor_amount-->", $values[2], $crow);
                $crow = str_replace("<!--abs_amount-->", number_format($values[3], 0, ".", "."), $crow);
                $crow = str_replace("<!--trend-->", "const", $crow);
                $crow = str_replace("<!--count-->", $count, $crow);
            }
            $html = str_replace("<!--rows_" . $i . "-->", $crow, $html);
        }
        $html = str_replace("<!--column_value_title-->", $_column, $html);
        $html = str_replace("<!--id-->", $_id, $html);
        $html = str_replace("<!--tab_title_1-->", $_tabTitle1, $html);
        $html = str_replace("<!--tab_title_2-->", $_tabTitle2, $html);
        $html = str_replace("<!--id-->", $_id, $html);
        return str_replace("<!--title-->", $_title, $html);
    }

    function RenderTopTable($_id, $_title, $_column, $_trend = true, $crow = "")
    {
        $hrow = IOStruct::GetFile(TEMPLATE_HTML_STATS_TOP_ROW);
        if ($_id == 6)
            Server::InitDataBlock(array("LANGUAGES"));
        else if ($_id == 2)
            Server::InitDataBlock(array("COUNTRIES"));

        if (!isset($this->Tops[$_id]))
            Logging::DebugLog("Invalid tops:" . $_id);
        else
            foreach ($this->Tops[$_id] as $count => $values) {
                if ($_id == 6 && isset(Server::$Languages[strtoupper($values[0])][0]))
                    $crow .= str_replace("<!--title-->", Server::$Languages[strtoupper($values[0])][0], $hrow);
                else if ($_id == 2 && isset(Server::$Countries[strtoupper($values[0])]))
                    $crow .= str_replace("<!--title-->", Server::$Countries[strtoupper($values[0])], $hrow);
                else if ($_id == 13 && isset(StatisticProvider::$Durations[$values[0]]))
                    $crow .= str_replace("<!--title-->", StatisticProvider::$Durations[$values[0]], $hrow);
                else
                    $crow .= str_replace("<!--title-->", $values[0], $hrow);

                $crow = str_replace("<!--rel_amount-->", $values[1], $crow);
                $crow = str_replace("<!--rel_floor_amount-->", $values[2], $crow);
                if (!is_numeric($values[3]) && strpos($values[3], " / ") !== false)
                    $crow = str_replace("<!--abs_amount-->", $values[3], $crow);
                else
                    $crow = str_replace("<!--abs_amount-->", number_format($values[3], 0, ".", "."), $crow);
                $crow = str_replace("<!--trend-->", "const", $crow);
                $crow = str_replace("<!--count-->", $count, $crow);
            }
        $html = str_replace("<!--rows-->", $crow, IOStruct::GetFile(TEMPLATE_HTML_STATS_TOP_TABLE));
        $html = str_replace("<!--column_count_width-->", "16", $html);
        $html = str_replace("<!--expand_all-->", "none", $html);
        $html = str_replace("<!--expand_all_block-->", "", $html);
        $html = str_replace("<!--column_value_title-->", $_column, $html);
        return str_replace("<!--title-->", $_title, $html);
    }

    function GetHash()
    {
        return (md5($this->Type . $this->Aggregated . $this->Microtime));
    }

    function GetGraphOperatorIndex($_user)
    {
        return Str::Cut($_user->Fullname, 15, true);
    }

    function GetGraphWidth()
    {
        if (!StatisticProvider::$DrawChartImages || !function_exists("gd_info"))
            return "0px";
        return StatisticProvider::$GraphOverallWidth . "px";
    }

    function GetGraphImageTag($_data, $_texts, $_metric = true)
    {
        if (!StatisticProvider::$DrawChartImages || !function_exists("gd_info"))
            return "";

        require_once(LIVEZILLA_PATH . "_lib/trdp/pchart/class/pData.class.php");
        require_once(LIVEZILLA_PATH . "_lib/trdp/pchart/class/pDraw.class.php");
        require_once(LIVEZILLA_PATH . "_lib/trdp/pchart/class/pImage.class.php");

        $MyData = new pData();
        $dv1 = array();
        $dobject = array();
        foreach ($_data as $obid => $values) {
            foreach ($values as $key => $val)
                $values[$key] = round($val, 1);

            $dv1[] = $values[0];
            if (count($values) > 1)
                $dv2[] = $values[1];
            if (count($values) > 2)
                $dv3[] = $values[2];
            if (count($values) > 3)
                $dv4[] = $values[3];
            $dobject[] = $obid;
            if (count($dobject) == 5)
                break;
        }

        if (isset($_texts[1])) {

            $MyData->addPoints($dv1, $_texts[1] . "   ");
            if (isset($dv2) && isset($_texts[2]))
                $MyData->addPoints($dv2, $_texts[2] . "   ");
            if (isset($dv3) && isset($_texts[3]))
                $MyData->addPoints($dv3, $_texts[3] . "   ");
            if (isset($dv4) && isset($_texts[4]))
                $MyData->addPoints($dv4, $_texts[4] . "   ");

            $MyData->setAxisName(0, $_texts[0]);
            $MyData->setAxisDisplay(0, $_metric ? AXIS_FORMAT_METRIC : AXIS_FORMAT_RAW);
            $MyData->addPoints($dobject, "Groups");
            $MyData->setSerieDescription("Groups", "Group");
            $MyData->setAbscissa("Groups");
            $myPicture = new pImage(630, 210, $MyData);
            $myPicture->Antialias = FALSE;

            $myPicture->setFontProperties(array("FontName" => __DIR__ . "/trdp/pchart/fonts/arimo.ttf", "FontSize" => 8, "R" => 120, "G" => 120, "B" => 120));
            $myPicture->setGraphArea(46, 0, 620, 160);
            $scaleSettings = array("GridR" => 200, "GridG" => 200, "GridB" => 200, "DrawSubTicks" => TRUE, "YMargin" => 12, "CycleBackground" => TRUE);
            $myPicture->drawScale($scaleSettings);
            $myPicture->drawLegend(40, 190, array("Style" => LEGEND_BOX, "Mode" => LEGEND_HORIZONTAL, "BoxSize" => 4, "R" => 200, "G" => 200, "B" => 200, "Surrounding" => 20, "Alpha" => 30));
            $myPicture->setShadow(TRUE, array("X" => 1, "Y" => 1, "R" => 0, "G" => 0, "B" => 0, "Alpha" => 10));
            $myPicture->setShadow(TRUE, array("X" => 1, "Y" => 1, "R" => 0, "G" => 0, "B" => 0, "Alpha" => 10));
            $settings = array("Surrounding" => -30, "InnerSurrounding" => 30, "DisplayValues" => TRUE);
            $myPicture->drawBarChart($settings);
            $file = PATH_STATS . $this->Type . "/temp.png";
            $myPicture->render($file);

            return "<img src=\"data:image/png;base64," . IOStruct::ToBase64($file) . "\" />";
        }
        return "";
    }

    function FormatTimespan($_span)
    {
        $formatted = "";
        $hrsmins = array(3600, 60);
        foreach ($hrsmins as $val)
            if ($_span >= $val) {
                if (Num::Divide($_span, $val, false, true) >= 10)
                    $formatted .= Num::Divide($_span, $val, false, true) . ":";
                else
                    $formatted .= "0" . Num::Divide($_span, $val, false, true) . ":";
                $_span -= Num::Divide($_span, $val, false, true) * $val;
            } else
                $formatted .= "00:";
        if ($_span >= 10)
            $formatted .= floor($_span);
        else if ($_span > 0)
            $formatted .= "0" . floor($_span);
        else
            $formatted .= "00";
        return $formatted;
    }

    function Save()
    {
        $time = SystemTime::GetMicroTime();
        DBManager::Execute(true, "INSERT IGNORE INTO `" . DB_PREFIX . DATABASE_STATS_AGGS . "` (`year`,`month`,`day`,`time`,`mtime`) VALUES (" . $this->GetSQLDateValues() . "," . $time[1] . "," . $time[0] . ");");
    }

    function Update()
    {
        $result = DBManager::Execute(true, "SELECT `time` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS . "` WHERE `year`='" . DBManager::RealEscape($this->Year) . "' AND `month`='" . DBManager::RealEscape($this->Month) . "' AND `day`='" . DBManager::RealEscape($this->Day) . "' AND `aggregated`=0 LIMIT 1;");
        if ($result) {
            if ($row = DBManager::FetchArray($result)) {
                if ($this->Type == STATISTIC_PERIOD_TYPE_DAY)
                    $this->SaveVisitorListToFile();
                $this->SaveReportToFile();
            } else if (@file_exists($this->GetFilename(true, false))) {
                $result = DBManager::Execute(true, "SELECT `time`,`mtime` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS . "` WHERE `year`='" . DBManager::RealEscape($this->Year) . "' AND `month`='" . DBManager::RealEscape($this->Month) . "' AND `day`='" . DBManager::RealEscape($this->Day) . "' LIMIT 1;");
                if ($result) {
                    if ($row = DBManager::FetchArray($result)) {
                        $parts = explode("_", $_POST[POST_INTERN_XMLCLIP_REPORTS_END_TIME]);
                        if ($parts[0] > $row["time"])
                            $_POST[POST_INTERN_XMLCLIP_REPORTS_END_TIME] = $row["time"] . "_" . ($row["mtime"] - 1);
                    }
                }
            }
        }

    }

    function GetFilename($_fullPath, $_visitorList)
    {
        $month = ($this->Type != STATISTIC_PERIOD_TYPE_YEAR) ? "_" . date("m", mktime(0, 0, 0, $this->Month, 1, $this->Year)) : "";
        $day = ($this->Type == STATISTIC_PERIOD_TYPE_DAY) ? "_" . date("d", mktime(0, 0, 0, $this->Month, $this->Day, $this->Year)) : "";
        if (!$_fullPath)
            return $this->Year . $month . $day . (($_visitorList) ? "_u" : "") . "_" . StatisticProvider::$StatisticKey;
        else
            return PATH_STATS . $this->Type . "/" . $this->Year . $month . $day . (($_visitorList) ? "_u" : "") . "_" . StatisticProvider::$StatisticKey;
    }

    function SaveReportToFile()
    {
        Server::SetTimeLimit(300);

        if ($this->Type == STATISTIC_PERIOD_TYPE_MONTH)
            $this->LoadDays();
        else if ($this->Type == STATISTIC_PERIOD_TYPE_YEAR)
            $this->LoadMonths();

        $this->Aggregate();
        $this->Load();

        if ($this->CreateReport && $this->Loaded)
            IOStruct::CreateFile($this->GetFilename(true, false), $this->GetHTML(), true, true);

        CacheManager::SetDataUpdateTime(DATA_UPDATE_KEY_REPORTS);
    }

    function SaveVisitorListToFile()
    {
        Server::SetTimeLimit(300);
        if ($this->CreateVisitorList)
            IOStruct::CreateFile($this->GetFilename(true, true), $this->GetVisitorsHTML(), true, true);
    }

    function SendReportByEmail($email = "", $subject = "", $date = "")
    {
        if ($this->Type == STATISTIC_PERIOD_TYPE_DAY) {
            $email = Server::$Configuration->File["gl_sred"];
            $subject = LocalizationManager::$TranslationStrings["stats_report_email_subject_day"];
            $date = $this->Year . "-" . date("m", mktime(0, 0, 0, $this->Month, $this->Day, $this->Year)) . "-" . date("d", mktime(0, 0, 0, $this->Month, $this->Day, $this->Year));
        } else if ($this->Type == STATISTIC_PERIOD_TYPE_MONTH) {
            $email = Server::$Configuration->File["gl_srem"];
            $subject = LocalizationManager::$TranslationStrings["stats_report_email_subject_month"];
            $date = $this->Year . "-" . date("m", mktime(0, 0, 0, $this->Month, 1, $this->Year));
        } else if ($this->Type == STATISTIC_PERIOD_TYPE_YEAR) {
            $email = Server::$Configuration->File["gl_srey"];
            $subject = LocalizationManager::$TranslationStrings["stats_report_email_subject_year"];
            $date = $this->Year;
        }

        if (empty($email))
            return;

        LocalizationManager::AutoLoad(strtolower(Server::$Configuration->File["gl_default_language"]), true);
        $html = Server::Replace($this->GetReportHTML(false), true, false, false, true);
        $tempfile = PATH_STATS . $this->Type . "/temp.html";
        IOStruct::CreateFile($tempfile, $html, true);
        $mailbox = Mailbox::GetDefaultOutgoing();

        if ($mailbox != null)
            Communication::SendEmail($mailbox, $email, "", "", $mailbox->Email, "", "", $subject . " (" . $date . ")", false, Array($tempfile => str_replace("-", "_", $date) . ".html"));
        else
            Logging::ErrorLog("No -default- email account to send reports to mail account.");

        @unlink($tempfile);
    }

    function Close()
    {
        Server::InitDataBlock(array("INTERNAL"));
        LocalizationManager::AutoLoad(strtolower(Server::$Configuration->File["gl_default_language"]), true);
        if ($this->Type == STATISTIC_PERIOD_TYPE_DAY) {
            $dvhd = (isset(Server::$Configuration->File["gl_dvhd"])) ? Server::$Configuration->File["gl_dvhd"] : 3;
            $this->CleanDatabases($dvhd * 2);
            if ($this->CreateReport) {
                $this->SaveReportToFile();
            }

            if ($this->CreateVisitorList) {
                $this->SaveVisitorListToFile();
            }
            $this->CleanDatabases($dvhd);
        } else if ($this->CreateReport)
            $this->SaveReportToFile();

        $this->SendReportByEmail();
        LocalizationManager::AutoLoad("", true);
    }

    function CleanDatabases($_days)
    {
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_VISITORS . "` WHERE `closed`<" . (time() - (max(1, $_days) * 86400)) . ";");
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_OPERATOR_STATUS . "` WHERE `" . DB_PREFIX . DATABASE_OPERATOR_STATUS . "`.`confirmed`<" . DBManager::RealEscape(time() - (max(1, $_days) * 86400)) . ";");
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_KNOWLEDGEBASE_QUERIES . "` WHERE `time`<" . (time() - 86400) . ";");
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_KNOWLEDGEBASE_VIEWS . "` WHERE `time`<" . (time() - 86400) . ";");
    }
}

?>