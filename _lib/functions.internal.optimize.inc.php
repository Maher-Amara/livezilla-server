<?php

/****************************************************************************************
 * LiveZilla functions.internal.optimize.inc.php
 *
 * Copyright 2018 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 * Improper changes to this file may cause critical errors.
 ***************************************************************************************/

if(!defined("IN_LIVEZILLA"))
	die();

class DatabaseMaintenance
{
    static function Optimize()
    {
        if(!Is::Defined("NO_DB_LOG"))
            define("NO_DB_LOG",true);

        $rand = rand(0,100);

        if(!Configuration::$Loaded)
            return;

        if($rand == 8)
        {
            $result = DBManager::Execute(true, "SELECT `id` FROM `" . DB_PREFIX . DATABASE_VISITOR_DATA_PAGES . "`;");
            while($row = DBManager::FetchArray($result))
            {
                $rows = DBManager::FetchArray(DBManager::Execute(true, "(SELECT COUNT(*) AS `csap` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_PAGES . "` WHERE `url` = '" . $row["id"] . "');"));
                if(!empty($rows["csap"]))
                    continue;
                $rows = DBManager::FetchArray(DBManager::Execute(true, "(SELECT COUNT(*) AS `csap` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_PAGES_EXIT . "` WHERE `url` = '" . $row["id"] . "');"));
                if(!empty($rows["csap"]))
                    continue;
                $rows = DBManager::FetchArray(DBManager::Execute(true, "(SELECT COUNT(*) AS `csap` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_PAGES_ENTRANCE . "` WHERE `url` = '" . $row["id"] . "');"));
                if(!empty($rows["csap"]))
                    continue;
                $rows = DBManager::FetchArray(DBManager::Execute(true, "(SELECT COUNT(*) AS `csap` FROM `" . DB_PREFIX . DATABASE_VISITOR_BROWSER_URLS . "` WHERE `url` = '" . $row["id"] . "' OR `referrer` = '" . $row["id"] . "');"));
                if(!empty($rows["csap"]))
                    continue;
                $rows = DBManager::FetchArray(DBManager::Execute(true, "(SELECT COUNT(*) AS `csap` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_REFERRERS . "` WHERE `referrer` = '" . $row["id"] . "');"));
                if(!empty($rows["csap"]))
                    continue;
                DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_VISITOR_DATA_PAGES . "` WHERE `id`='" . $row["id"] . "';");
            }
            DBManager::Execute(true, "OPTIMIZE TABLE `" . DB_PREFIX . DATABASE_VISITOR_DATA_PAGES . "`;");
            DBManager::Execute(true, "REPAIR TABLE `" . DB_PREFIX . DATABASE_VISITOR_DATA_PAGES . "`;");
        }
        else if($rand == 7)
        {
            DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_VISITOR_DATA_DOMAINS . "` WHERE NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_VISITOR_DATA_PAGES . "` WHERE `domain` = `" . DB_PREFIX . DATABASE_VISITOR_DATA_DOMAINS . "`.`id`) AND NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_DOMAINS . "` WHERE `domain` = `" . DB_PREFIX . DATABASE_VISITOR_DATA_DOMAINS . "`.`id`);");
            DBManager::Execute(true, "OPTIMIZE TABLE `" . DB_PREFIX . DATABASE_VISITOR_DATA_DOMAINS . "`;");
            DBManager::Execute(true, "REPAIR TABLE `" . DB_PREFIX . DATABASE_VISITOR_DATA_DOMAINS . "`;");
        }
        else if($rand == 6)
        {
            DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_VISITOR_DATA_PATHS . "` WHERE NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_VISITOR_DATA_PAGES . "` WHERE `path` = `" . DB_PREFIX . DATABASE_VISITOR_DATA_PATHS . "`.`id`);");
            DBManager::Execute(true, "OPTIMIZE TABLE `" . DB_PREFIX . DATABASE_VISITOR_DATA_PATHS . "`;");
            DBManager::Execute(true, "REPAIR TABLE `" . DB_PREFIX . DATABASE_VISITOR_DATA_PATHS . "`;");
        }
        else if($rand == 5)
        {
            DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_VISITOR_DATA_ISPS . "` WHERE NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_ISPS . "` WHERE `isp` = `" . DB_PREFIX . DATABASE_VISITOR_DATA_ISPS . "`.`id`) AND NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_VISITORS . "` WHERE `isp` = `" . DB_PREFIX . DATABASE_VISITOR_DATA_ISPS . "`.`id`);");
            DBManager::Execute(true, "OPTIMIZE TABLE `" . DB_PREFIX . DATABASE_VISITOR_DATA_ISPS . "`;");
            DBManager::Execute(true, "REPAIR TABLE `" . DB_PREFIX . DATABASE_VISITOR_DATA_ISPS . "`;");
        }
        else if($rand == 4)
        {
            DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_VISITOR_DATA_QUERIES . "` WHERE NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_QUERIES . "` WHERE `query` = `" . DB_PREFIX . DATABASE_VISITOR_DATA_QUERIES . "`.`id`) AND NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_VISITOR_BROWSERS . "` WHERE `query` = `" . DB_PREFIX . DATABASE_VISITOR_DATA_QUERIES . "`.`id`) AND NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_GOALS_QUERIES . "` WHERE `query` = `" . DB_PREFIX . DATABASE_VISITOR_DATA_QUERIES . "`.`id`);");
            DBManager::Execute(true, "OPTIMIZE TABLE `" . DB_PREFIX . DATABASE_VISITOR_DATA_QUERIES . "`;");
            DBManager::Execute(true, "REPAIR TABLE `" . DB_PREFIX . DATABASE_VISITOR_DATA_QUERIES . "`;");
        }
        else if($rand == 3)
        {
            DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_VISITOR_DATA_CITIES . "` WHERE NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_CITIES . "` WHERE `city` = `" . DB_PREFIX . DATABASE_VISITOR_DATA_CITIES . "`.`id`) AND NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_VISITORS . "` WHERE `city` = `" . DB_PREFIX . DATABASE_VISITOR_DATA_CITIES . "`.`id`);");
            DBManager::Execute(true, "OPTIMIZE TABLE `" . DB_PREFIX . DATABASE_VISITOR_DATA_CITIES . "`;");
            DBManager::Execute(true, "REPAIR TABLE `" . DB_PREFIX . DATABASE_VISITOR_DATA_CITIES . "`;");
        }
        else if($rand == 2)
        {
            DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_VISITOR_DATA_REGIONS . "` WHERE NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_REGIONS . "` WHERE `region` = `" . DB_PREFIX . DATABASE_VISITOR_DATA_REGIONS . "`.`id`) AND NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_VISITORS . "` WHERE `region` = `" . DB_PREFIX . DATABASE_VISITOR_DATA_REGIONS . "`.`id`);");
            DBManager::Execute(true, "OPTIMIZE TABLE `" . DB_PREFIX . DATABASE_VISITOR_DATA_REGIONS . "`;");
            DBManager::Execute(true, "REPAIR TABLE `" . DB_PREFIX . DATABASE_VISITOR_DATA_REGIONS . "`;");
        }
        else if($rand == 1)
        {
            DBManager::Execute(true, "OPTIMIZE TABLE `" . DB_PREFIX . DATABASE_DATA_CACHE . "`;");
            DBManager::Execute(true, "OPTIMIZE TABLE `" . DB_PREFIX . DATABASE_POSTS . "`;");
            DBManager::Execute(true, "OPTIMIZE TABLE `" . DB_PREFIX . DATABASE_TICKETS . "`;");
            DBManager::Execute(true, "OPTIMIZE TABLE `" . DB_PREFIX . DATABASE_TICKET_MESSAGES . "`;");
            DBManager::Execute(true, "OPTIMIZE TABLE `" . DB_PREFIX . DATABASE_TICKET_EDITORS . "`;");
            DBManager::Execute(true, "OPTIMIZE TABLE `" . DB_PREFIX . DATABASE_TICKET_CUSTOMS . "`;");
            DBManager::Execute(true, "OPTIMIZE TABLE `" . DB_PREFIX . DATABASE_EVENT_TRIGGERS . "`;");
            DBManager::Execute(true, "OPTIMIZE TABLE `" . DB_PREFIX . DATABASE_CHAT_REQUESTS . "`;");
            DBManager::Execute(true, "OPTIMIZE TABLE `" . DB_PREFIX . DATABASE_VISITOR_DATA_BROWSERS . "`;");
            DBManager::Execute(true, "OPTIMIZE TABLE `" . DB_PREFIX . DATABASE_VISITOR_DATA_SYSTEMS . "`;");
            DBManager::Execute(true, "OPTIMIZE TABLE `" . DB_PREFIX . DATABASE_VISITOR_DATA_RESOLUTIONS . "`;");
            DBManager::Execute(true, "OPTIMIZE TABLE `" . DB_PREFIX . DATABASE_VISITOR_DATA_TITLES . "`;");
            DBManager::Execute(true, "OPTIMIZE TABLE `" . DB_PREFIX . DATABASE_VISITORS . "`;");
            DBManager::Execute(true, "OPTIMIZE TABLE `" . DB_PREFIX . DATABASE_FILTERS . "`;");
            DBManager::Execute(true, "OPTIMIZE TABLE `" . DB_PREFIX . DATABASE_VISITOR_CHATS . "`;");
            DBManager::Execute(true, "REPAIR TABLE `" . DB_PREFIX . DATABASE_VISITOR_CHATS . "`;");
            DBManager::Execute(true, "OPTIMIZE TABLE `" . DB_PREFIX . DATABASE_VISITOR_CHAT_OPERATORS . "`;");
            DBManager::Execute(true, "REPAIR TABLE `" . DB_PREFIX . DATABASE_VISITOR_CHAT_OPERATORS . "`;");
            DBManager::Execute(true, "OPTIMIZE TABLE `" . DB_PREFIX . DATABASE_VISITOR_BROWSERS . "`;");
            DBManager::Execute(true, "REPAIR TABLE `" . DB_PREFIX . DATABASE_VISITOR_BROWSERS . "`;");
            DBManager::Execute(true, "OPTIMIZE TABLE `" . DB_PREFIX . DATABASE_VISITOR_BROWSER_URLS . "`;");
            DBManager::Execute(true, "REPAIR TABLE `" . DB_PREFIX . DATABASE_VISITOR_BROWSER_URLS . "`;");
            DBManager::Execute(true, "OPTIMIZE TABLE `" . DB_PREFIX . DATABASE_OPERATOR_STATUS . "`;");
            DBManager::Execute(true, "OPTIMIZE TABLE `" . DB_PREFIX . DATABASE_OPERATORS . "`;");
            DBManager::Execute(true, "OPTIMIZE TABLE `" . DB_PREFIX . DATABASE_OPERATOR_LOGINS . "`;");
            DBManager::Execute(true, "OPTIMIZE TABLE `" . DB_PREFIX . DATABASE_VISITOR_GOALS . "`;");
        }
        else if($rand == 0)
        {
            DBManager::Execute(true, "OPTIMIZE TABLE `" . DB_PREFIX . DATABASE_STATS_AGGS . "`;");
            DBManager::Execute(true, "OPTIMIZE TABLE `" . DB_PREFIX . DATABASE_STATS_AGGS_BROWSERS . "`;");
            DBManager::Execute(true, "OPTIMIZE TABLE `" . DB_PREFIX . DATABASE_STATS_AGGS_RESOLUTIONS . "`;");
            DBManager::Execute(true, "OPTIMIZE TABLE `" . DB_PREFIX . DATABASE_STATS_AGGS_COUNTRIES . "`;");
            DBManager::Execute(true, "OPTIMIZE TABLE `" . DB_PREFIX . DATABASE_STATS_AGGS_VISITS . "`;");
            DBManager::Execute(true, "OPTIMIZE TABLE `" . DB_PREFIX . DATABASE_STATS_AGGS_SYSTEMS . "`;");
            DBManager::Execute(true, "OPTIMIZE TABLE `" . DB_PREFIX . DATABASE_STATS_AGGS_LANGUAGES . "`;");
            DBManager::Execute(true, "OPTIMIZE TABLE `" . DB_PREFIX . DATABASE_STATS_AGGS_CITIES . "`;");
            DBManager::Execute(true, "OPTIMIZE TABLE `" . DB_PREFIX . DATABASE_STATS_AGGS_REGIONS . "`;");
            DBManager::Execute(true, "OPTIMIZE TABLE `" . DB_PREFIX . DATABASE_STATS_AGGS_ISPS . "`;");
            DBManager::Execute(true, "OPTIMIZE TABLE `" . DB_PREFIX . DATABASE_STATS_AGGS_QUERIES . "`;");
            DBManager::Execute(true, "OPTIMIZE TABLE `" . DB_PREFIX . DATABASE_STATS_AGGS_PAGES . "`;");
            DBManager::Execute(true, "OPTIMIZE TABLE `" . DB_PREFIX . DATABASE_STATS_AGGS_DOMAINS . "`;");
            DBManager::Execute(true, "OPTIMIZE TABLE `" . DB_PREFIX . DATABASE_STATS_AGGS_REFERRERS . "`;");
            DBManager::Execute(true, "OPTIMIZE TABLE `" . DB_PREFIX . DATABASE_STATS_AGGS_AVAILABILITIES . "`;");
            DBManager::Execute(true, "OPTIMIZE TABLE `" . DB_PREFIX . DATABASE_STATS_AGGS_DURATIONS . "`;");
            DBManager::Execute(true, "OPTIMIZE TABLE `" . DB_PREFIX . DATABASE_STATS_AGGS_CHATS . "`;");
            DBManager::Execute(true, "OPTIMIZE TABLE `" . DB_PREFIX . DATABASE_STATS_AGGS_SEARCH_ENGINES . "`;");
            DBManager::Execute(true, "OPTIMIZE TABLE `" . DB_PREFIX . DATABASE_STATS_AGGS_VISITORS . "`;");
            DBManager::Execute(true, "OPTIMIZE TABLE `" . DB_PREFIX . DATABASE_STATS_AGGS_CRAWLERS . "`;");
            DBManager::Execute(true, "OPTIMIZE TABLE `" . DB_PREFIX . DATABASE_STATS_AGGS_PAGES_ENTRANCE . "`;");
            DBManager::Execute(true, "OPTIMIZE TABLE `" . DB_PREFIX . DATABASE_STATS_AGGS_PAGES_EXIT . "`;");
            DBManager::Execute(true, "OPTIMIZE TABLE `" . DB_PREFIX . DATABASE_STATS_AGGS_GOALS . "`;");
        }
    }

    static function Maintain()
    {
        $_timeouts = array(Server::$Configuration->File["poll_frequency_clients"] * 10,86400,86400*7,DATA_LIFETIME);

        if(!Is::Defined("NO_DB_LOG"))
            define("NO_DB_LOG",true);

        if(!Configuration::$Loaded)
            return;

        $dvhd = (isset(Server::$Configuration->File["gl_dvhd"])) ? Server::$Configuration->File["gl_dvhd"] : 3;

        if(!STATS_ACTIVE)
        {
            DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_VISITORS . "` WHERE `closed`<" . DBManager::RealEscape(time() - ($dvhd * 86400)) . ";");
            DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_OPERATOR_STATUS . "` WHERE `" . DB_PREFIX . DATABASE_OPERATOR_STATUS . "`.`confirmed`<" . DBManager::RealEscape(time() - ($dvhd * 86400)) . ";");
        }
        else
        {
            require_once(LIVEZILLA_PATH . "_lib/objects.stats.inc.php");
            StatisticProvider::DeleteHTMLReports();
        }

        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_EVENT_TRIGGERS . "` WHERE NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_VISITORS . "` WHERE `id` = `" . DB_PREFIX . DATABASE_EVENT_TRIGGERS . "`.`receiver_user_id`)");
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_CHAT_ARCHIVE . "` WHERE (`html` = '0' OR `html` = '') AND `time` < " . DBManager::RealEscape(time() - $_timeouts[3]));
        DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_CHAT_ARCHIVE . "` SET `closed`='" . time() . "' WHERE `chat_type`<>1 AND `closed`<`endtime` AND `endtime`<" . (time() - 1800) . ";");
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_CHAT_ARCHIVE . "` WHERE `closed`=0 AND `chat_type`=1 AND NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_VISITOR_CHATS . "` WHERE `chat_id` = `" . DB_PREFIX . DATABASE_CHAT_ARCHIVE . "`.`chat_id`)");
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_POSTS . "` WHERE `time` < " . DBManager::RealEscape(time() - $_timeouts[2]));
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_POSTS . "` WHERE `persistent` = '0' AND `time` < " . DBManager::RealEscape(time() - $_timeouts[1]));
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_POSTS . "` WHERE `repost` = '1' AND `time` < " . DBManager::RealEscape(time() - $_timeouts[0]));
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_OPERATOR_LOGINS . "` WHERE `time` < " . DBManager::RealEscape(time() - $_timeouts[1]));
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_EVENT_ACTION_INTERNALS . "` WHERE `created` < " . DBManager::RealEscape(time() - $_timeouts[0]));

        $clr = "";
        if(!empty(Server::$Configuration->File["gl_colt"]))
            $clr = "`create` < ".intval(time()-(Server::$Configuration->File["gl_colt"]*86400))." AND ";

        $result = DBManager::Execute(true, "SELECT AVG(`duration`) AS `waitingtime` FROM `" . DB_PREFIX . DATABASE_CHAT_ARCHIVE . "` WHERE `chat_type`=1 AND `duration`>30 AND `duration`<3600;");
        if($row = DBManager::FetchArray($result))
        {
            Server::SetConfigValue("gl_qwts",intval($row["waitingtime"]));
        }

        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_USER_DATA . "` WHERE " . $clr . "NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_VISITORS . "` WHERE `data_id` = `" . DB_PREFIX . DATABASE_USER_DATA . "`.`id`) AND NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_FEEDBACKS . "` WHERE `data_id` = `" . DB_PREFIX . DATABASE_USER_DATA . "`.`id`);");
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_FEEDBACKS . "` WHERE `resource_id` != '' AND NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_RESOURCES . "` WHERE `id` = `" . DB_PREFIX . DATABASE_FEEDBACKS . "`.`resource_id`);");
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_CHAT_FORWARDS . "` WHERE NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_VISITOR_CHATS . "` WHERE `chat_id` = `" . DB_PREFIX . DATABASE_CHAT_FORWARDS . "`.`chat_id`)");
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_CHAT_REQUESTS . "` WHERE NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_VISITOR_BROWSERS . "` WHERE `id` = `" . DB_PREFIX . DATABASE_CHAT_REQUESTS . "`.`receiver_browser_id`)");
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_GOALS . "` WHERE NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_GOALS . "` WHERE `id` = `" . DB_PREFIX . DATABASE_STATS_AGGS_GOALS . "`.`goal`)");
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_PAGES . "` WHERE NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_VISITOR_DATA_PAGES . "` WHERE `id` = `" . DB_PREFIX . DATABASE_STATS_AGGS_PAGES . "`.`url`)");
        DBManager::Execute(true, "DELETE `" . DB_PREFIX . DATABASE_TICKETS . "` FROM `" . DB_PREFIX . DATABASE_TICKETS . "` INNER JOIN `" . DB_PREFIX . DATABASE_TICKET_MESSAGES . "` ON `" . DB_PREFIX . DATABASE_TICKETS . "`.`id`=`" . DB_PREFIX . DATABASE_TICKET_MESSAGES . "`.`ticket_id` WHERE `deleted`=1;");
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_TICKET_CUSTOMS . "` WHERE NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_TICKETS . "` WHERE `id` = `" . DB_PREFIX . DATABASE_TICKET_CUSTOMS . "`.`ticket_id`)");
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_TICKET_EDITORS . "` WHERE NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_TICKETS . "` WHERE `id` = `" . DB_PREFIX . DATABASE_TICKET_EDITORS . "`.`ticket_id`)");
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_TICKET_LOGS . "` WHERE NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_TICKETS . "` WHERE `id` = `" . DB_PREFIX . DATABASE_TICKET_LOGS . "`.`ticket_id`)");
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_TICKET_COMMENTS . "` WHERE NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_TICKETS . "` WHERE `id` = `" . DB_PREFIX . DATABASE_TICKET_COMMENTS . "`.`ticket_id`)");
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_TICKET_MESSAGES . "` WHERE NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_TICKETS . "` WHERE `id` = `" . DB_PREFIX . DATABASE_TICKET_MESSAGES . "`.`ticket_id`)");
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_TICKETS . "` WHERE `last_update` < " . DBManager::RealEscape(time() - $_timeouts[1]) . " AND NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_TICKET_MESSAGES . "` WHERE `ticket_id` = `" . DB_PREFIX . DATABASE_TICKETS . "`.`id`)");
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_TICKET_ATTACHMENTS . "` WHERE NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_TICKET_MESSAGES . "` WHERE `id` = `" . DB_PREFIX . DATABASE_TICKET_ATTACHMENTS . "`.`parent_id`) AND NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_TICKET_EMAILS . "` WHERE `email_id` = `" . DB_PREFIX . DATABASE_TICKET_ATTACHMENTS . "`.`parent_id`)");

        if(empty(Server::$Configuration->File["gl_vmac"]) && !Is::Defined("STATS_ACTIVE"))
        {
            DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_VISITORS . "` WHERE `closed`<" . (time() - Server::$Configuration->File["timeout_track"]) . " LIMIT 250;");
        }

        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_VISITOR_BROWSERS . "` WHERE NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_VISITORS . "` WHERE `id` = `" . DB_PREFIX . DATABASE_VISITOR_BROWSERS . "`.`visitor_id`)");
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_VISITOR_BROWSER_URLS . "` WHERE NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_VISITOR_BROWSERS . "` WHERE `id` = `" . DB_PREFIX . DATABASE_VISITOR_BROWSER_URLS . "`.`browser_id`)");
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_VISITOR_CHATS . "` WHERE `exit` > 0 AND `last_active` < " . intval(time() - $_timeouts[1]) . " AND NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_VISITORS . "` WHERE `id` = `" . DB_PREFIX . DATABASE_VISITOR_CHATS . "`.`visitor_id`)");
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_VISITOR_CHATS . "` WHERE `exit`=0 AND `last_active` < " . intval(time() - $_timeouts[1]));
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_VISITOR_CHAT_OPERATORS . "` WHERE NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_VISITOR_CHATS . "` WHERE `chat_id` = `" . DB_PREFIX . DATABASE_VISITOR_CHAT_OPERATORS . "`.`chat_id`)");
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_VISITOR_GOALS . "` WHERE NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_VISITORS . "` WHERE `id` = `" . DB_PREFIX . DATABASE_VISITOR_GOALS . "`.`visitor_id`)");
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_GROUP_MEMBERS . "` WHERE NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_GROUPS . "` WHERE `id` = `" . DB_PREFIX . DATABASE_GROUP_MEMBERS . "`.`group_id`)");
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_GROUPS . "` WHERE NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_GROUP_MEMBERS . "` WHERE `group_id` = `" . DB_PREFIX . DATABASE_GROUPS . "`.`id`) AND `" . DB_PREFIX . DATABASE_GROUPS . "`.`dynamic`=1;");
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_TICKET_EMAILS . "` WHERE `deleted`>=1 AND `edited` < " . DBManager::RealEscape(time() - $_timeouts[3]));
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_VISITOR_COMMENTS . "` WHERE `created` < " . intval(time() - (max(1, @Server::$Configuration->File["gl_colt"]) * 86400)) . " AND NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_CHAT_ARCHIVE . "` WHERE `external_id` = `" . DB_PREFIX . DATABASE_VISITOR_COMMENTS . "`.`visitor_id`) AND NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_TICKETS . "` WHERE `user_id` = `" . DB_PREFIX . DATABASE_VISITOR_COMMENTS . "`.`visitor_id`)");

        if(Server::$Configuration->File["gl_adct"] != 1)
        {
            if(!empty(Server::$Configuration->File["gl_rm_chats"]) && !empty(Server::$Configuration->File["gl_rm_chats_time"]))
                DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_CHAT_ARCHIVE . "` WHERE `chat_type`=1 AND `time` < " . intval(time() - Server::$Configuration->File["gl_rm_chats_time"]));

            if(!empty(Server::$Configuration->File["gl_rm_oc"]) && !empty(Server::$Configuration->File["gl_rm_oc_time"]))
                DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_CHAT_ARCHIVE . "` WHERE `chat_type`=0 AND `time` < " . intval(time() - Server::$Configuration->File["gl_rm_oc_time"]));

            if(!empty(Server::$Configuration->File["gl_rm_gc"]) && !empty(Server::$Configuration->File["gl_rm_gc_time"]))
                DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_CHAT_ARCHIVE . "` WHERE `chat_type`=2 AND `time` < " . intval(time() - Server::$Configuration->File["gl_rm_gc_time"]));

            if(!empty(Server::$Configuration->File["gl_rm_rt"]) && !empty(Server::$Configuration->File["gl_rm_rt_time"]))
            {
                DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_FEEDBACKS . "` WHERE `created` < " . intval(time() - Server::$Configuration->File["gl_rm_rt_time"]));
                DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_FEEDBACK_CRITERIA . "` WHERE NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_FEEDBACKS . "` WHERE `id` = `" . DB_PREFIX . DATABASE_FEEDBACK_CRITERIA . "`.`fid`)");
            }

            if(!empty(Server::$Configuration->File["gl_rm_cf"]))
            {
                DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_RESOURCES . "` SET `discarded`=1,`edited`=UNIX_TIMESTAMP() WHERE `discarded`=0 AND `type`=4 AND `created` < " . intval(time() - Server::$Configuration->File["gl_rm_cf_time"]) . " ORDER BY `created` ASC LIMIT 5;");
                if(!empty(Server::$Operators))
                    foreach(Server::$Operators as $sid => $operator)
                        if(!$operator->IsBot)
                            DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_RESOURCES . "` SET `discarded`=1,`edited`=UNIX_TIMESTAMP() WHERE `discarded`=0 AND `type`=3 AND `parentid`='" . DBManager::RealEscape($sid) . "' AND `created` < " . intval(time() - Server::$Configuration->File["gl_rm_cf_time"]) . " ORDER BY `created` ASC LIMIT 5;");
                DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_RESOURCES . "` SET `discarded`=1,`edited`=UNIX_TIMESTAMP() WHERE `discarded`=0 AND `type`=0 AND `parentid`='5' AND `created` < " . intval(time() - Server::$Configuration->File["gl_rm_cf_time"]) . " ORDER BY `created` ASC LIMIT 5;");
            }

            if(!empty(Server::$Configuration->File["gl_rm_tf"]))
                if($result = DBManager::Execute(true, "SELECT `ta`.`res_id` FROM `" . DB_PREFIX . DATABASE_TICKET_MESSAGES . "` AS `tm` INNER JOIN `" . DB_PREFIX . DATABASE_TICKET_ATTACHMENTS . "` AS `ta` ON `tm`.`id`=`ta`.`parent_id` WHERE `tm`.`created` < " . intval(time() - Server::$Configuration->File["gl_rm_tf_time"]) . ""))
                    while($result && $row = DBManager::FetchArray($result))
                        DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_RESOURCES . "` SET `discarded`=1,`edited`=UNIX_TIMESTAMP() WHERE `discarded`=0 AND `type`=3 AND `id`='" . DBManager::RealEscape($row["res_id"]) . "' ORDER BY `created` ASC LIMIT 1;");

            if(!empty(Server::$Configuration->File["gl_rm_om"]))
                DBManager::Execute(true, "DELETE `" . DB_PREFIX . DATABASE_TICKETS . "` FROM `" . DB_PREFIX . DATABASE_TICKETS . "` INNER JOIN `" . DB_PREFIX . DATABASE_TICKET_MESSAGES . "` ON `" . DB_PREFIX . DATABASE_TICKETS . "`.`id`=`" . DB_PREFIX . DATABASE_TICKET_MESSAGES . "`.`ticket_id` WHERE `" . DB_PREFIX . DATABASE_TICKET_MESSAGES . "`.`time` < " . DBManager::RealEscape(time() - Server::$Configuration->File["gl_rm_om_time"]));

            if(!empty(Server::$Configuration->File["gl_rm_tid"]))
                DBManager::Execute(true, "DELETE `" . DB_PREFIX . DATABASE_TICKETS . "` FROM `" . DB_PREFIX . DATABASE_TICKETS . "` INNER JOIN `" . DB_PREFIX . DATABASE_TICKET_MESSAGES . "` ON `" . DB_PREFIX . DATABASE_TICKETS . "`.`id`=`" . DB_PREFIX . DATABASE_TICKET_MESSAGES . "`.`ticket_id` INNER JOIN `" . DB_PREFIX . DATABASE_TICKET_EDITORS . "` ON `" . DB_PREFIX . DATABASE_TICKETS . "`.`id`=`" . DB_PREFIX . DATABASE_TICKET_EDITORS . "`.`ticket_id` WHERE `" . DB_PREFIX . DATABASE_TICKET_EDITORS . "`.`status`=3 AND `" . DB_PREFIX . DATABASE_TICKET_MESSAGES . "`.`time` < " . DBManager::RealEscape(time() - Server::$Configuration->File["gl_rm_tid_time"]));

            if(!empty(Server::$Operators) && !empty(Server::$Configuration->File["gl_rm_bc"]))
                foreach(Server::$Operators as $sid => $operator)
                    if($operator->IsBot)
                        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_CHAT_ARCHIVE . "` WHERE `chat_type`=1 AND `internal_id`='" . DBManager::RealEscape($sid) . "' AND `time` < " . DBManager::RealEscape(time() - Server::$Configuration->File["gl_rm_bc_time"]));
        }

        KnowledgeBase::RemoveFileUploads(true);

        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_RESOURCES . "` WHERE `discarded`='1' AND `edited`<" . DBManager::RealEscape(time() - $_timeouts[3]));
        DatabaseMaintenance::ApplyTicketAutoStatus();
        DatabaseMaintenance::Optimize();
    }

    static function ApplyTicketAutoStatus()
    {
        $statusUpdates = false;
  
        if($result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_TICKETS . "` WHERE `auto_status_time`>0 AND `auto_status_time`<" . time()))
        {
            while($result && $row = DBManager::FetchArray($result))
            {
                DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_TICKETS . "` SET `auto_status_time`=0,`auto_status_status`=0 WHERE `id`='" . DBManager::RealEscape($row["id"]) . "' LIMIT 1");
                $ticket = new Ticket();
                $ticket->Id = $row["id"];
                $ticket->LoadStatus();
                if($ticket->Editor != null)
                {
                    $statusUpdates = true;
                    $ticket->Log(0,$ticket->Editor->Editor,$row["auto_status_status"],$ticket->Editor->Status);
                    $ticket->Editor->Status = $row["auto_status_status"];
                    $ticket->Editor->Save();
                    $ticket->SetLastUpdate(SystemTime::GetUniqueMessageTime(DATABASE_TICKETS,"last_update"));
                }
            }
        }

        $cpta = 14;
        if(isset(Server::$Configuration->File["gl_cpta"]) && !empty(Server::$Configuration->File["gl_cpta"]))
            $cpta = intval(Server::$Configuration->File["gl_cpta"]);

        if($result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_TICKET_EDITORS . "` WHERE `status`=4 AND `time`<".intval(time()-($cpta*86500))))
            while($result && $row = DBManager::FetchArray($result))
            {
                $ticket = new Ticket();
                $ticket->Id = $row["ticket_id"];
                $ticket->Load(true,false);
                $ticket->Log(0,"",2,$ticket->Editor->Status);
                $ticket->Editor->Status = 2;
                $ticket->Editor->Save();
                $ticket->SetLastUpdate(SystemTime::GetUniqueMessageTime(DATABASE_TICKETS,"last_update"));
                $statusUpdates = true;
            }

        if($statusUpdates)
        {
            CacheManager::SetDataUpdateTime(DATA_UPDATE_KEY_TICKETS);
            CacheManager::Flush();
        }
    }
}
?>