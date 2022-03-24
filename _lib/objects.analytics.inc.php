<?php

if (!defined("IN_LIVEZILLA"))
    die();

if (!defined("LIVEZILLA_PATH"))
    define("LIVEZILLA_PATH", dirname(__FILE__) . "/");


const UNIT_NORANGES = 0;
const UNIT_HOURS = 1;
const UNIT_DAYS = 2;
const UNIT_WEEKS = 3;
const UNIT_MONTHS = 4;
const UNIT_QUARTERS = 5;
const UNIT_YEARS = 6;
const UNIT_DECADES = 7;
const UNIT_CENTURIES = 8;
$DATE_UNITS = array('none', 'hours', 'days', 'weeks', 'months', 'quarters', 'years', 'decades', 'centuries');

Server::InitDataProvider();
Server::DefineURL("analytics.php");
Server::$Statistic = new StatisticProvider();
@set_error_handler("handleError");
$html = $thtml = "";
$row = '';
$post = $_POST;
$get = $_GET;
$data = '';
$int = false;
$test = 'test';


class ADI
{
    public static $unit = 1;
    private static $from = array();
    private static $to = array();
    private static $latestDate = array();
    private static $earliestDate = array();
    public static $feedbackCriteria = array();
    public static $totalVisitors = '';
    public static $paddedZeroRanges = array();

    static function GetFeedbackCriteria()
    {
        if (empty(ADI::$feedbackCriteria))
            ADI::$feedbackCriteria = ADI::FilterData(ADI::GetData("SELECT `id`, `name`, `title` FROM `" . DB_PREFIX . DATABASE_FEEDBACK_CRITERIA_CONFIG . "` WHERE `type`=0;"));
        return ADI::$feedbackCriteria;
    }

    static function GetTotalVisitors()
    {
        if (ADI::$totalVisitors == '') {
            $visitorsQuery = "SELECT SUM(`visitors_unique`) FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_VISITORS . "` WHERE " . ADI::GetUnitIntervalCondition(DATABASE_STATS_AGGS_VISITORS, ADI::getFrom(), ADI::getTo(), ADI::$unit) . ";";
            ADI::$totalVisitors = ADI::GetSingleDataFromQuery($visitorsQuery);
        }
        return ADI::$totalVisitors;
    }

    static function GetPreInitData()
    {
        Server::InitDataBlock(array("INTERNAL", "GROUPS", "EVENTS"));
        $res = array(
            'groups' => ADI::GetGroups(),
            'operators' => array_values(ADI::GetOperators()),
            'goals' => array_values(ADI::GetGoals()),
            'events' => array_values(ADI::GetEvents()),
            'servergroups' => Server::$Events,
            'earliestDate' => ADI::getEarliestDate()
        );
        return $res;
    }

    static function GetOverview()
    {
        $operatorsTotalQuery = "SELECT COUNT(DISTINCT `user_id`) AS `operators` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_AVAILABILITIES . "` WHERE " . ADI::GetUnitIntervalCondition(DATABASE_STATS_AGGS, ADI::getFrom(), ADI::getTo(), ADI::$unit) . " AND `user_id`>'' AND `user_id`!='everyoneintern';";

        $ranges = ADI::GetUnitRanges(ADI::getFrom(), ADI::getTo(), ADI::$unit);
        $results = array();
        $queries = array();
        foreach ($ranges as $date => $range) {

            $query = "SELECT COUNT(DISTINCT `user_id`) AS `operators` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_AVAILABILITIES . "` WHERE " . ADI::GetUnitIntervalCondition(DATABASE_STATS_AGGS_AVAILABILITIES, $range['from'], $range['to'], ADI::$unit) . " AND `user_id`>'' AND `user_id`!='everyoneintern';";

            $queries[$date] = $query;
            $results[$date] = intval(ADI::GetSingleDataFromQuery($query));
        };

        $operators = array(
            'name' => 'Operators',
            'total' => ADI::GetSingleDataFromQuery($operatorsTotalQuery),
            'values' => $results
        );

        $returnArray = array(
            ADI::GetLineData(DATABASE_STATS_AGGS_CHATS, 'amount', 'Chats'),
            ADI::GetLineData(DATABASE_STATS_AGGS_TICKETS, 'amount', 'Tickets'),
            ADI::GetLineData(DATABASE_STATS_AGGS_VISITORS, 'visitors_unique', 'Visitors'),
            $operators
        );
        return $returnArray;
    }

    static function GetChats()
    {
        $totalWaitingTimeQuery = "SELECT SUM(`avg_waiting_time`*`amount`)/(SUM(`amount`)) AS `waitingTime` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_CHATS . "` WHERE " . ADI::GetUnitIntervalCondition(DATABASE_STATS_AGGS, ADI::getFrom(), ADI::getTo(), ADI::$unit) . " AND `group_id`>'' ;";
        $totalDurationQuery = "SELECT SUM(`avg_duration`*`accepted`)/(SUM(`accepted`)) AS `duration` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_CHATS . "` WHERE " . ADI::GetUnitIntervalCondition(DATABASE_STATS_AGGS, ADI::getFrom(), ADI::getTo(), ADI::$unit) . " AND `group_id`>'' ;";
        return array(
            ADI::GetLineData(DATABASE_STATS_AGGS_CHATS, 'amount', 'Chats'),
            ADI::GetLineData(DATABASE_STATS_AGGS_CHATS, 'accepted', 'Accepted'),
            ADI::GetLineData(DATABASE_STATS_AGGS_CHATS, 'declined', 'Declined'),
            ADI::GetLineData(DATABASE_STATS_AGGS_CHATS, 'missed', 'Missed'),
        );
    }

    static function GetChatNumbers()
    {

        $avgChatDurationQuery = "SELECT SUM(`avg_duration` * `amount`)/SUM(`amount`) AS `avg` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_CHATS . "` WHERE " . ADI::GetUnitIntervalCondition(DATABASE_STATS_AGGS, ADI::getFrom(), ADI::getTo(), ADI::$unit) . ";";
        $avgChatDuration = round(ADI::GetSingleDataFromQuery($avgChatDurationQuery));

        $avgChatWaitingTimeQuery = "SELECT SUM(`avg_waiting_time` * `amount`)/SUM(`amount`) AS `avg` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_CHATS . "` WHERE " . ADI::GetUnitIntervalCondition(DATABASE_STATS_AGGS, ADI::getFrom(), ADI::getTo(), ADI::$unit) . ";";
        $avgChatWaitingTime = round(ADI::GetSingleDataFromQuery($avgChatWaitingTimeQuery));

        $returnArray = array(
            array(
                'prefix' => 'Ø ',
                'tid' => 'chat_duration',
                'format' => 0,
                'value' => $avgChatDuration
            ),
            array(
                'prefix' => 'Ø ',
                'tid' => 'chat_waiting_time',
                'format' => 0,
                'value' => $avgChatWaitingTime
            )
        );

        $chatsByGroupsQuery = "SELECT SUM(`amount`) as `amount`, `group_id` FROM " . DB_PREFIX . DATABASE_STATS_AGGS_CHATS . " WHERE " . ADI::GetUnitIntervalCondition(DATABASE_STATS_AGGS, ADI::getFrom(), ADI::getTo(), ADI::$unit) . " AND `group_id`!='' GROUP BY `group_id`;";


        $chatsByGroups = array();
        if ($result = DBManager::Execute(true, $chatsByGroupsQuery)) {
            while ($row = DBManager::FetchArray($result, MYSQLI_ASSOC)) {
                $chatsByGroups[] = array(
                    'tid' => $row['group_id'],
                    'value' => $row['amount']
                );
            }
        }

        $returnArray[] = array(
            'tid' => 'by_groups',
            'pie' => true,
            'query' => $chatsByGroupsQuery,
            'value' => $chatsByGroups
        );

        return $returnArray;
    }

    static function GetChatsBar()
    {
        return array(
            ADI::GetBarGraphDataSet(DATABASE_STATS_AGGS_CHATS, 'amount', array('groups', 'operators'), 'chats', '', 'totalChats'),
            ADI::GetBarGraphDataSet(DATABASE_STATS_AGGS_CHATS, 'accepted', array('groups', 'operators'), 'accepted', '', 'accepted'),
            ADI::GetBarGraphDataSet(DATABASE_STATS_AGGS_CHATS, 'declined', array('groups', 'operators'), 'declined', '', 'declined'),
            ADI::GetBarGraphDataSet(DATABASE_STATS_AGGS_CHATS, 'missed', array('groups', 'operators'), 'missed', '', 'missed'),
            ADI::GetBarGraphDataSet(DATABASE_STATS_AGGS_CHATS, 'avg_duration', array('groups', 'operators'), 'chat_duration', 'Ø ', 'chatDuration'),
            ADI::GetBarGraphDataSet(DATABASE_STATS_AGGS_CHATS, 'avg_waiting_time', array('groups', 'operators'), 'chat_waiting_time', 'Ø ', 'chatWaitingTime'),
        );
    }

    static function getTotalTags()
    {

    }

    static function GetTags($type)
    {
        $totalQuery = "SELECT SUM(`amount`) as `amount` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_TAGS . "` WHERE " . ADI::GetUnitIntervalCondition(DATABASE_STATS_AGGS_TAGS, ADI::getFrom(), ADI::getTo(), ADI::$unit) . " AND `type`='" . $type . "';";
        $totalTags = self::GetSingleDataFromQuery($totalQuery);
        $query = "SELECT `tag`, SUM(`amount`) as `amount` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_TAGS . "` WHERE " . ADI::GetUnitIntervalCondition(DATABASE_STATS_AGGS_TAGS, ADI::getFrom(), ADI::getTo(), ADI::$unit) . " AND `type`='" . $type . "' GROUP BY `tag` ORDER BY `amount` DESC LIMIT 100 ;";
        $values = [array('tag', 'absolute', 'relative')];
        if ($result = DBManager::Execute(true, $query)) {
            while ($row = DBManager::FetchArray($result, MYSQLI_NUM)) {
                $row[] = self::formatrelative($row[1], $totalTags);
                $values[] = $row;
            }
        }

        if ($type == 1) {
            $key = 'TicketTags';
            $name = 'Ticket Tags';
            $tid = 'ticket_tags';
        } else {
            $key = 'ChatTags';
            $name = 'Chat Tags';
            $tid = 'chat_tags';
        }
        return array(
            array(
                'tid' => $tid,
                'key' => $key,
                'name' => $name,
                'query' => $query,
                'value' => $values
            )
        );
    }

    static function GetTickets()
    {
        return array(
            ADI::GetLineData(DATABASE_STATS_AGGS_TICKETS, 'amount', 'amount'),
            ADI::GetLineData(DATABASE_STATS_AGGS_TICKETS, 'closed', 'closed'),
            ADI::GetLineData(DATABASE_STATS_AGGS_TICKETS, 'deleted', 'deleted'),
            ADI::GetLineData(DATABASE_STATS_AGGS_TICKETS, 'messages', 'incoming_messages'),
            ADI::GetLineData(DATABASE_STATS_AGGS_TICKETS, 'responses', 'outgoing_messages')
        );
    }

    static function GetTicketNumbers()
    {
        $ticketNumberQuery = "SELECT SUM(`amount`) AS `sum_amount`, SUM(`avg_response_time` * `responses`)/SUM(`responses`) AS `avg_response_time`, SUM(`avg_close_time` * `closed`)/SUM(`closed`) AS `avg_close_time`, IFNULL(SUM(`overdue`)/SUM(`closed`),0) AS `overdue`, IFNULL(SUM(`email_in`),0) AS `sum_email_in`, IFNULL(SUM(`email_converted`),0) AS `sum_email_converted`, IFNULL(SUM(`email_out`),0) AS `sum_email_out`, IFNULL(SUM(`facebook_in`),0) AS `sum_facebook_in`, IFNULL(SUM(`facebook_out`),0) AS `sum_facebook_out`, IFNULL(SUM(`twitter_in`),0) AS `sum_twitter_in`, IFNULL(SUM(`twitter_out`),0) AS `sum_twitter_out`, IFNULL(SUM(`source_email`),0) AS `sum_source_email`, IFNULL(SUM(`source_phone`),0) AS `sum_source_phone`, IFNULL(SUM(`source_misc`),0) AS `sum_source_misc`, IFNULL(SUM(`source_chat`),0) AS `sum_source_chat`, IFNULL(SUM(`source_feedback`),0) AS `sum_source_feedback`, IFNULL(SUM(`source_facebook`),0) AS `sum_source_facebook`, IFNULL(SUM(`source_twitter`),0) AS `sum_source_twitter` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_TICKETS . "` WHERE " . ADI::GetUnitIntervalCondition(DATABASE_STATS_AGGS, ADI::getFrom(), ADI::getTo(), ADI::$unit) . ";";

        $resultValues = ADI::GetSingleRowFromQuery($ticketNumberQuery);

        $numbersArray = array(
            'container' => true,
            'id' => 'ticketSingleNumbers',
            'value' => array(
                array(
                    'prefix' => 'Ø ',
                    'tid' => 'ticket_response_time',
                    'format' => 0,
                    'value' => round($resultValues['avg_response_time'])
                ),
                array(
                    'prefix' => 'Ø ',
                    'tid' => 'ticket_close_time',
                    'format' => 0,
                    'value' => round($resultValues['avg_close_time'])
                ),
                array(
                    'tid' => 'tickets_closed_overdue',
                    'value' => round($resultValues['overdue'] * 100) . "%"
                )
            )
        );


        $inOutBlock = array(
            'container' => true,
            'id' => 'ticketInOutNumbers',
            'value' => array(
                array(
                    'tid' => 'email',
                    'query' => $ticketNumberQuery,
                    'value' => array(
                        array(
                            'tid' => 'incoming',
                            'value' => $resultValues['sum_email_in']
                        ),
                        array(
                            'tid' => 'converted',
                            'value' => $resultValues['sum_email_converted']
                        ),
                        array(
                            'tid' => 'outgoing',
                            'value' => $resultValues['sum_email_out']
                        )
                    )
                ),
                array(
                    'tid' => 'twitter',
                    'value' => array(
                        array(
                            'tid' => 'incoming',
                            'value' => $resultValues['sum_twitter_in']
                        ),
                        array(
                            'tid' => 'outgoing',
                            'value' => $resultValues['sum_twitter_out']
                        )
                    )
                ),
                array(
                    'tid' => 'facebook',
                    'value' => array(
                        array(
                            'tid' => 'incoming',
                            'value' => $resultValues['sum_facebook_in']
                        ),
                        array(
                            'tid' => 'outgoing',
                            'value' => $resultValues['sum_facebook_out']
                        )
                    )
                )
            )
        );

        $ticketsByGroupsQuery = "SELECT SUM(`amount`) as `sum_amount`, `group_id` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_TICKETS . "` WHERE " . ADI::GetUnitIntervalCondition(DATABASE_STATS_AGGS, ADI::getFrom(), ADI::getTo(), ADI::$unit) . " AND `group_id`!='' GROUP BY `group_id`;";

        $ticketsByGroups = array();
        if ($result = DBManager::Execute(true, $ticketsByGroupsQuery)) {
            while ($row = DBManager::FetchArray($result)) {
                $ticketsByGroups[$row['group_id']] = intval($row['sum_amount']);
            }
        }
        Server::InitDataBlock(array("INTERNAL", "GROUPS", "EVENTS"));
        $allGroups = ADI::GetGroups();
        $ticketGroups = array();
        foreach($allGroups as $key => $value){
            $val = 0;
            if(isset($ticketsByGroups[$key]))
                $val = $ticketsByGroups[$key];
            $ticketGroups[] = array(
                'tid' => $key,
                'value' => $val
            );
        }

        $pieContainer = array(
            'container' => true,
            'id' => 'ticketNumbersPieContainer',
            'value' => array(
                array(
                    'tid' => 'sources',
                    'pie' => true,
                    'value' => array(
                        array(
                            'tid' => 'web',
                            'value' => intval($resultValues["sum_amount"]) - (intval($resultValues["sum_source_email"]) + intval($resultValues["sum_source_phone"]) + intval($resultValues["sum_source_misc"]) + intval($resultValues["sum_source_chat"]) + intval($resultValues["sum_source_feedback"]) + intval($resultValues["sum_source_facebook"]) + intval($resultValues["sum_source_twitter"]))
                        ),
                        array(
                            'tid' => 'email',
                            'value' => intval($resultValues["sum_source_email"])
                        ),
                        array(
                            'tid' => 'phone',
                            'value' => intval($resultValues["sum_source_phone"])
                        ),
                        array(
                            'tid' => 'misc',
                            'value' => intval($resultValues["sum_source_misc"])
                        ),
                        array(
                            'tid' => 'chat',
                            'value' => intval($resultValues["sum_source_chat"])
                        ),
                        array(
                            'tid' => 'feedback',
                            'value' => intval($resultValues["sum_source_feedback"])
                        ),
                        array(
                            'tid' => 'facebook',
                            'value' => intval($resultValues["sum_source_facebook"])
                        ),
                        array(
                            'tid' => 'twitter',
                            'value' => intval($resultValues["sum_source_twitter"])
                        )
                    )
                ),
                array(
                    'tid' => 'by_groups',
                    'pie' => true,
                    'query' => $ticketsByGroupsQuery,
                    'value' => $ticketGroups
                )
            )
        );

        $inOutWithPiesBlock = array(
            'container' => true,
            'id' => 'inOut-pie-container',
            'value' => array(
                $inOutBlock,
                $pieContainer
            )
        );

        return array(
            $numbersArray,
            $inOutWithPiesBlock
        );

    }

    static function GetTicketsBar()
    {
        return array(
            ADI::GetBarGraphDataSet(DATABASE_STATS_AGGS_TICKETS, 'amount', array('groups', 'operators'), 'new_tickets', '', 'totalTickets'),
            ADI::GetBarGraphDataSet(DATABASE_STATS_AGGS_TICKETS, 'closed', array('groups', 'operators'), 'closed', '', 'closed'),
            ADI::GetBarGraphDataSet(DATABASE_STATS_AGGS_TICKETS, 'deleted', array('groups', 'operators'), 'deleted', '', 'deleted'),
            ADI::GetBarGraphDataSet(DATABASE_STATS_AGGS_TICKETS, 'messages', array('groups', 'operators'), 'incoming_messages', '', 'incoming_messages'),
            ADI::GetBarGraphDataSet(DATABASE_STATS_AGGS_TICKETS, 'responses', array('groups', 'operators'), 'outgoing_messages', '', 'outgoing_messages'),
            ADI::GetBarGraphDataSet(DATABASE_STATS_AGGS_TICKETS, 'avg_response_time', array('groups', 'operators'), 'ticket_response_time', 'Ø ', 'responseTime'),
            ADI::GetBarGraphDataSet(DATABASE_STATS_AGGS_TICKETS, 'avg_close_time', array('groups', 'operators'), 'ticket_close_time', 'Ø ', 'closeTime'),
        );
    }

    static function GetAvailabilitiesBar()
    {
        return array(
            ADI::GetBarGraphDataSet(DATABASE_STATS_AGGS_AVAILABILITIES, 'seconds', array('groups', 'operators'), 'availability', '', 'availability')
        );
    }

    static function GetVisitors()
    {
        return array(
            ADI::GetLineData(DATABASE_STATS_AGGS_VISITORS, 'visitors_unique', 'Visitors'), // Visitors (Unique)
            ADI::GetLineData(DATABASE_STATS_AGGS_VISITORS, 'visitors_new', 'Recurring'), // Recurring Visitors
            ADI::GetLineData(DATABASE_STATS_AGGS_VISITORS, 'page_impressions', 'Page Impressions'), // Page Impressions
            ADI::GetLineData(DATABASE_STATS_AGGS_VISITORS, 'browser_instances', 'Browser Instances'), // Bounces
            ADI::GetLineData(DATABASE_STATS_AGGS_VISITORS, 'bounces', 'Bounces') // Bounces
        );
    }

    static function GetVisitorNumbers()
    {
        $timePerVisitorQuery = "SELECT SUM(`avg_time_site` * `visitors_unique`)/SUM(`visitors_unique`) AS `avg` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS . "` WHERE " . ADI::GetUnitIntervalCondition(DATABASE_STATS_AGGS, ADI::getFrom(), ADI::getTo(), ADI::$unit) . ";";
        $timePerVisitor = round(ADI::GetSingleDataFromQuery($timePerVisitorQuery));

        $pageImprQuery = "SELECT SUM(`page_impressions`) AS `pageImp` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_VISITORS . "` WHERE " . ADI::GetUnitIntervalCondition(DATABASE_STATS_AGGS, ADI::getFrom(), ADI::getTo(), ADI::$unit) . ";";
        $pageImpr = round(ADI::GetSingleDataFromQuery($pageImprQuery));

        $visitors = ADI::GetTotalVisitors();

        if ($visitors == 0)
            $pagesPerVisitor = 0;
        else
            $pagesPerVisitor = $pageImpr / $visitors;
        if ($pagesPerVisitor == 0)
            $timePerPage = 0;
        else
            $timePerPage = $timePerVisitor / $pagesPerVisitor;

        $bouncesTotalQuery = "SELECT SUM(`bounces`) FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_VISITORS . "` WHERE " . ADI::GetUnitIntervalCondition(DATABASE_STATS_AGGS, ADI::getFrom(), ADI::getTo(), ADI::$unit) . ";";
        $bouncesTotal = round(ADI::GetSingleDataFromQuery($bouncesTotalQuery));

        $trafficSourcesQuery = "SELECT SUM(`from_referrer`), SUM(`search_engine`) FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_VISITORS . "` WHERE " . ADI::GetUnitIntervalCondition(DATABASE_STATS_AGGS, ADI::getFrom(), ADI::getTo(), ADI::$unit) . ";";
        $trafficSourcesData = ADI::GetData($trafficSourcesQuery);

        if ($visitors == 0) {

            $bounceRate = 0;
            $searchEnginesValue = "0 (0%)";
            $fromReferrerValue = "0 (0%)";
            $directAccessValue = "0 (0%)";

        } else {
            $bounceRate = $bouncesTotal / $visitors * 100;
            $searchEnginesValue = "" . $trafficSourcesData[0][1] . " (" . round(intval($trafficSourcesData[0][1]) / $visitors * 100, 2) . "%)";
            $fromReferrerValue = "" . $trafficSourcesData[0][0] . " (" . round(intval($trafficSourcesData[0][0]) / $visitors * 100, 2) . "%)";
            $directAccesses = $visitors - ($trafficSourcesData[0][0] + $trafficSourcesData[0][1]);
            $directAccessValue = "" . $directAccesses . " (" . round($directAccesses / $visitors * 100, 2) . "%)";
        }

        $numbers = array(
            array(
                'key' => 'Ø View time per visitor',
                'prefix' => 'Ø ',
                'tid' => 'average_time_on_site',
                'format' => 0,
                'value' => $timePerVisitor
            ),
            array(
                'key' => 'Ø View time per page',
                'prefix' => 'Ø ',
                'tid' => 'average_time_on_page',
                'format' => 0,
                'value' => $timePerPage
            ),
            array(
                'tid' => 'bounce_rate',
                'key' => 'Bounce Rate',
                'format' => 1,
                'value' => $bounceRate
            )
        );

        $numberContainer = array(
            'id' => 'visitorNumber-numberContainer',
            'container' => true,
            'value' => $numbers
        );

        $visitorSources = array(
                'key' => 'Traffic Scources',
                'tid' => 'traffic_sources',
                'value' => array(
                    array(
                        'key' => 'Search Engines',
                        'tid' => 'search_engines',
                        'value' => $searchEnginesValue
                    ),
                    array(
                        'key' => 'Referrer',
                        'tid' => 'referrer',
                        'value' => $fromReferrerValue
                    ),
                    array(
                        'key' => 'Direct Access',
                        'tid' => 'direct_access',
                        'value' => $directAccessValue
                    )
                )
        );

        $visitorDeviceQuery = "SELECT IFNULL(SUM(`visitors_unique`), 0) AS `sum_unique_visitors`, IFNULL(SUM(`device_tablet`), 0) AS `sum_device_tablet`, IFNULL(SUM(`device_mobile`), 0) AS `sum_device_mobile` FROM " . DB_PREFIX . DATABASE_STATS_AGGS_VISITORS . " WHERE " . ADI::GetUnitIntervalCondition(DATABASE_STATS_AGGS, ADI::getFrom(), ADI::getTo(), ADI::$unit);
        $visitorDeviceData = ADI::GetSingleRowFromQuery($visitorDeviceQuery);
        $visitorDevicePie = array(
            'tid' => 'devices',
            'pie' => true,
            'query' => $visitorDeviceQuery,
            'value' => array(
                array(
                    'tid' => 'mobile',
                    'value' => intval($visitorDeviceData['sum_device_mobile'])
                ),
                array(
                    'tid' => 'tablet',
                    'value' => intval($visitorDeviceData['sum_device_tablet'])
                ),
                array(
                    'tid' => 'desktop',
                    'value' => intval($visitorDeviceData['sum_unique_visitors']) - (intval($visitorDeviceData['sum_device_mobile']) + intval($visitorDeviceData['sum_device_tablet']))
                )
            )
        );

        $visitorSourceContainer = array(
            'container' => true,
            'id' => 'visitor-source-container',
            'value' => array(
                $visitorSources
            )
        );

        $visitorNumberSourceContainer = array(
            'container' => true,
            'id' => 'visitor-number-source-container',
            'value' => array(
                $numberContainer,
                $visitorSourceContainer
            )
        );

        return array(
            $visitorNumberSourceContainer,
            $visitorDevicePie
        );
    }

    static function formatrelative($value, $absolute)
    {
        if (intval($absolute) !== 0)
            return round($value / $absolute * 100, 2) . "%";
        else
            return "0%";
    }

    static function QueryVisitorTops($firstRow, $query, $lookupTable = false, $lookUpIndex = -1)
    {
        $returnData = array($firstRow);
        $rows = array();
        $total = 0;
        if ($result = DBManager::Execute(true, $query)) {
            while ($row = DBManager::FetchArray($result, MYSQLI_NUM)) {
                if(is_array($lookupTable)){
                    if($lookUpIndex > -1)
                        $row[0] = $lookupTable[$row[0]][$lookUpIndex];
                    else
                        $row[0] = $lookupTable[$row[0]];
                }
                $total = $total + intval($row[1]);
                $rows[] = $row;
            }
        }
        foreach( $rows as $index => $row){
            $row[] = self::formatrelative($row[1], $total);
            $returnData[] = $row;
        }
        return $returnData;
    }

    static function GetVisitorTopsTableByName($tid_plural, $tid_singular, $table_suffix, $columnName, $pie = false, $query = false, $lookupTable = false, $lookUpIndex = -1)
    {
        if(!$query)
            $query = ADI::GetVisitorTOPsQuery(constant("DATABASE_VISITOR_DATA_" . $table_suffix), constant("DATABASE_STATS_AGGS_" . $table_suffix), $columnName);
        $tableData = ADI::QueryVisitorTops(array($tid_singular, 'absolute', 'relative'), $query, $lookupTable, $lookUpIndex);
        return array(
            'tid' => $tid_plural,
            'value' => $tableData,
            'query' => $query,
            'pie' => $pie
        );
    }

    static function GetTOPsVisitors()
    {
        global $COUNTRIES, $LANGUAGES;
        $countryDataQuery = "SELECT `country`, SUM(`amount`) AS `sum` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_COUNTRIES . "` WHERE " . ADI::GetUnitIntervalCondition(DATABASE_STATS_AGGS, ADI::getFrom(), ADI::getTo(), ADI::$unit) . " GROUP BY `country` ORDER BY `sum` DESC;";
        $languageDataQuery = "SELECT `language`, SUM(`amount`) AS `sum` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_LANGUAGES . "` WHERE " . ADI::GetUnitIntervalCondition(DATABASE_STATS_AGGS, ADI::getFrom(), ADI::getTo(), ADI::$unit) . " GROUP BY `language` ORDER BY `sum` DESC;";
        $visitsDataQuery = "SELECT `visits`, SUM(`amount`) AS `sum` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_VISITS . "` WHERE " . ADI::GetUnitIntervalCondition(DATABASE_STATS_AGGS, ADI::getFrom(), ADI::getTo(), ADI::$unit) . " GROUP BY `visits` ORDER BY `sum` DESC;";
        $durationsDataQuery = "SELECT `duration`, SUM(`amount`) AS `sum` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_DURATIONS . "` WHERE " . ADI::GetUnitIntervalCondition(DATABASE_STATS_AGGS, ADI::getFrom(), ADI::getTo(), ADI::$unit) . " GROUP BY `duration` ORDER BY `sum` DESC;";

        return array(
            array(
                'pie' => true,
                'tid' => 'systems',
                'value' => ADI::QueryVisitorTops(array('system', 'absolute', 'relative'), ADI::GetVisitorTOPsQuery(DATABASE_VISITOR_DATA_SYSTEMS, DATABASE_STATS_AGGS_SYSTEMS, 'system')),
            ),
            ADI::GetVisitorTopsTableByName('browsers','browser','BROWSERS', 'browser', true),
            ADI::GetVisitorTopsTableByName('resolutions', 'resolution', 'RESOLUTIONS', 'resolution', true),
            ADI::GetVisitorTopsTableByName('cities', 'city', 'CITIES', 'city', true),
            ADI::GetVisitorTopsTableByName('regions', 'region', 'REGIONS', 'region', true),
            ADI::GetVisitorTopsTableByName('countries', 'country', 'COUNTRIES', 'country', true, $countryDataQuery, $COUNTRIES),
            ADI::GetVisitorTopsTableByName('languages', 'language', 'LANGUAGES', 'language', true, $languageDataQuery, $LANGUAGES, 0),
            ADI::GetVisitorTopsTableByName('visits', 'visits', 'VISITS', 'visits', true, $visitsDataQuery),
            ADI::GetVisitorTopsTableByName('time_on_page', 'time_on_page', 'DURATIONS', 'duration', true, $durationsDataQuery)
        );
    }

    static function GetPagesData($firstLine, $query)
    {
        $data = array($firstLine);
        $total = 0;
        $rows = array();
        if ($result = DBManager::Execute(true, $query)) {
            while ($row = DBManager::FetchArray($result, MYSQLI_NUM)) {
                $total = $total + intval($row[1]);
                $rows[] = $row;
            }
        }
        foreach($rows as $index => $row){
            $row[] = self::formatrelative($row[1], $total);
            $data[] = $row;
        }
        return $data;
    }

    static function GetTOPsPages()
    {
        $totalPageImpressions = ADI::GetTotalPageImpressions();


        $pagesDataQuery = "SELECT CONCAT(`" . DB_PREFIX . DATABASE_VISITOR_DATA_DOMAINS . "`.`domain`, `" . DB_PREFIX . DATABASE_VISITOR_DATA_PATHS . "`.`path`) as `url`, SUM(`" . DB_PREFIX . DATABASE_STATS_AGGS_PAGES . "`.`amount`) as `sum` " .
            "FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_PAGES . "` " .
            "INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_PAGES . "` ON `" . DB_PREFIX . DATABASE_STATS_AGGS_PAGES . "`.`url` = `" . DB_PREFIX . DATABASE_VISITOR_DATA_PAGES . "`.`id` " .
            "INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_DOMAINS . "` ON `" . DB_PREFIX . DATABASE_VISITOR_DATA_PAGES . "`.`domain` = `" . DB_PREFIX . DATABASE_VISITOR_DATA_DOMAINS . "`.`id` " .
            "INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_PATHS . "` ON `" . DB_PREFIX . DATABASE_VISITOR_DATA_PAGES . "`.`path` = `" . DB_PREFIX . DATABASE_VISITOR_DATA_PATHS . "`.`id` " .
            "WHERE " . ADI::GetUnitIntervalCondition(DATABASE_STATS_AGGS, ADI::getFrom(), ADI::getTo(), ADI::$unit) . " GROUP BY `url` ORDER BY `sum` DESC;";
        $pagesData = self::GetPagesData(array('page', 'absolute', 'relative'), $pagesDataQuery, $totalPageImpressions);

        $entryPagesDataQuery = "SELECT CONCAT(`" . DB_PREFIX . DATABASE_VISITOR_DATA_DOMAINS . "`.`domain`, `" . DB_PREFIX . DATABASE_VISITOR_DATA_PATHS . "`.`path`) as `url`, SUM(`" . DB_PREFIX . DATABASE_STATS_AGGS_PAGES_ENTRANCE . "`.`amount`) as `sum` " .
            "FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_PAGES_ENTRANCE . "` " .
            "INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_PAGES . "` ON `" . DB_PREFIX . DATABASE_STATS_AGGS_PAGES_ENTRANCE . "`.`url` = `" . DB_PREFIX . DATABASE_VISITOR_DATA_PAGES . "`.`id` " .
            "INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_DOMAINS . "` ON `" . DB_PREFIX . DATABASE_VISITOR_DATA_PAGES . "`.`domain` = `" . DB_PREFIX . DATABASE_VISITOR_DATA_DOMAINS . "`.`id` " .
            "INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_PATHS . "` ON `" . DB_PREFIX . DATABASE_VISITOR_DATA_PAGES . "`.`path` = `" . DB_PREFIX . DATABASE_VISITOR_DATA_PATHS . "`.`id` " .
            "WHERE " . ADI::GetUnitIntervalCondition(DATABASE_STATS_AGGS, ADI::getFrom(), ADI::getTo(), ADI::$unit) . " GROUP BY `url` ORDER BY `sum` DESC;";
        $entryPagesData = self::GetPagesData(array('page', 'absolute', 'relative'), $entryPagesDataQuery, $totalPageImpressions);

        $exitPagesDataQuery = "SELECT CONCAT(`" . DB_PREFIX . DATABASE_VISITOR_DATA_DOMAINS . "`.`domain`, `" . DB_PREFIX . DATABASE_VISITOR_DATA_PATHS . "`.`path`) as `url`, SUM(`" . DB_PREFIX . DATABASE_STATS_AGGS_PAGES_EXIT . "`.`amount`) as `sum` " .
            "FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_PAGES_EXIT . "` " .
            "INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_PAGES . "` ON `" . DB_PREFIX . DATABASE_STATS_AGGS_PAGES_EXIT . "`.`url` = `" . DB_PREFIX . DATABASE_VISITOR_DATA_PAGES . "`.`id` " .
            "INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_DOMAINS . "` ON `" . DB_PREFIX . DATABASE_VISITOR_DATA_PAGES . "`.`domain` = `" . DB_PREFIX . DATABASE_VISITOR_DATA_DOMAINS . "`.`id` " .
            "INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_PATHS . "` ON `" . DB_PREFIX . DATABASE_VISITOR_DATA_PAGES . "`.`path` = `" . DB_PREFIX . DATABASE_VISITOR_DATA_PATHS . "`.`id` " .
            "WHERE " . ADI::GetUnitIntervalCondition(DATABASE_STATS_AGGS, ADI::getFrom(), ADI::getTo(), ADI::$unit) . " GROUP BY `url` ORDER BY `sum` DESC;";
        $exitPagesData = self::GetPagesData(array('page', 'absolute', 'relative'), $exitPagesDataQuery, $totalPageImpressions);

        $searchEnginesDataQuery = ADI::GetVisitorTOPsQuery(DATABASE_VISITOR_DATA_DOMAINS, DATABASE_STATS_AGGS_SEARCH_ENGINES, 'domain');
        $searchEnginesData = self::GetPagesData(array('search_engine', 'absolute', 'relative'), $searchEnginesDataQuery, $totalPageImpressions);

        $crawlersDataQuery = ADI::GetVisitorTOPsQuery(DATABASE_VISITOR_DATA_CRAWLERS, DATABASE_STATS_AGGS_CRAWLERS, 'crawler');
        $crawlersData = self::GetPagesData(array('crawler', 'absolute', 'relative'), $crawlersDataQuery, $totalPageImpressions);

        $domainsDataQuery = ADI::GetVisitorTOPsQuery(DATABASE_VISITOR_DATA_DOMAINS, DATABASE_STATS_AGGS_DOMAINS, 'domain');
        $domainsData = self::GetPagesData(array('domain', 'absolute', 'relative'), $domainsDataQuery, $totalPageImpressions);

        $referrersDataQuery = "SELECT CONCAT(`" . DB_PREFIX . DATABASE_VISITOR_DATA_DOMAINS . "`.`domain`, `" . DB_PREFIX . DATABASE_VISITOR_DATA_PATHS . "`.`path`) as `url`, SUM(`" . DB_PREFIX . DATABASE_STATS_AGGS_REFERRERS . "`.`amount`) as `sum` " .
            "FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_REFERRERS . "` " .
            "INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_PAGES . "` ON `" . DB_PREFIX . DATABASE_STATS_AGGS_REFERRERS . "`.`referrer` = `" . DB_PREFIX . DATABASE_VISITOR_DATA_PAGES . "`.`id` " .
            "INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_DOMAINS . "` ON `" . DB_PREFIX . DATABASE_VISITOR_DATA_PAGES . "`.`domain` = `" . DB_PREFIX . DATABASE_VISITOR_DATA_DOMAINS . "`.`id` " .
            "INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_PATHS . "` ON `" . DB_PREFIX . DATABASE_VISITOR_DATA_PAGES . "`.`path` = `" . DB_PREFIX . DATABASE_VISITOR_DATA_PATHS . "`.`id` " .
            "WHERE " . ADI::GetUnitIntervalCondition(DATABASE_STATS_AGGS, ADI::getFrom(), ADI::getTo(), ADI::$unit) . " AND `" . DB_PREFIX . DATABASE_VISITOR_DATA_DOMAINS . "`.`external`=1  GROUP BY `url` ORDER BY `sum` DESC;";
        $referrersData = self::GetPagesData(array('page', 'absolute', 'relative'), $referrersDataQuery, $totalPageImpressions);

        return array(
            array(
                'links' => true,
                'tid' => 'pages',
                'value' => $pagesData
            ),
            array(
                'links' => true,
                'tid' => 'entrance_pages',
                'value' => $entryPagesData
            ),
            array(
                'links' => true,
                'tid' => 'exit_pages',
                'value' => $exitPagesData
            ),
            array(
                'links' => true,
                'tid' => 'search_engines',
                'value' => $searchEnginesData
            ),
            array(
                'pie' => true,
                'value' => $crawlersData,
                'tid' => 'crawlers'
            ),
            array(
                'links' => true,
                'tid' => 'domains',
                'value' => $domainsData
            ),
            array(
                'links' => true,
                'tid' => 'referrers',
                'value' => $referrersData
            )
        );
    }


    static function GetKBData($tid_singular, $query, $urlParam, $rowIndex, $rated=false)
    {
        $data = array(array($tid_singular, 'absolute', 'relative'));
        $total = 0;
        $rows = array();
        if ($result = DBManager::Execute(true, $query)) {
            while ($row = DBManager::FetchArray($result, MYSQLI_NUM)) {
                $total = $total + intval($row[1]);
                $rows[] = $row;
            }
        }
        foreach($rows as $index => $row){
            $rowData = array();
            $rowData[] = array($row[0], StatisticProvider::$Dereferrer . LIVEZILLA_URL . "knowledgebase.php?" . $urlParam . "=" . Encoding::Base64UrlEncode($row[$rowIndex]));
            if($rated){
                $rowData[] = "" . $row[1] . " / " . $row[2];
                $rowData[] =round($row[3] * 100, 2) . "%";
            }else{
                $rowData[] = $row[1];
                $rowData[] = self::formatrelative($row[1], $total);
            }
            $data[] = $rowData;
        }
        return $data;
    }

    static function GetTOPsKnowledgeBase()
    {
        $kbSearchPhrasesDataQuery = ADI::GetVisitorTOPsQuery(DATABASE_VISITOR_DATA_QUERIES, DATABASE_STATS_AGGS_QUERIES, 'query');
        $kbViewsDataQuery = "SELECT resources.`title`, SUM(" . DB_PREFIX . DATABASE_STATS_AGGS_KNOWLEDGEBASE . ".`views`) AS `sum`, resources.`id` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_KNOWLEDGEBASE . "` INNER JOIN resources ON resources.id = " . DB_PREFIX . DATABASE_STATS_AGGS_KNOWLEDGEBASE . ".res_id WHERE " . ADI::GetUnitIntervalCondition(DATABASE_STATS_AGGS, ADI::getFrom(), ADI::getTo(), ADI::$unit) . " GROUP BY `title` ORDER BY `sum` DESC LIMIT 100;";
        $kbHighestRatedDataQuery = "SELECT resources.`title`, SUM(" . DB_PREFIX . DATABASE_STATS_AGGS_KNOWLEDGEBASE . ".`rate_positive`) as `absolute`, SUM(" . DB_PREFIX . DATABASE_STATS_AGGS_KNOWLEDGEBASE . ".`rate_amount`), (SUM(" . DB_PREFIX . DATABASE_STATS_AGGS_KNOWLEDGEBASE . ".`rate_positive`)/SUM(" . DB_PREFIX . DATABASE_STATS_AGGS_KNOWLEDGEBASE . ".`rate_amount`)) AS `relative`, resources.`id` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_KNOWLEDGEBASE . "` INNER JOIN `resources` ON resources.id = " . DB_PREFIX . DATABASE_STATS_AGGS_KNOWLEDGEBASE . ".res_id WHERE " . DB_PREFIX . DATABASE_STATS_AGGS_KNOWLEDGEBASE . ".`rate_amount`>0 AND " . ADI::GetUnitIntervalCondition(DATABASE_STATS_AGGS, ADI::getFrom(), ADI::getTo(), ADI::$unit) . " GROUP BY `title` ORDER BY `relative` DESC, `absolute` DESC LIMIT 100;";
        $kbLowestRatedDataQuery = "SELECT resources.`title`, SUM(" . DB_PREFIX . DATABASE_STATS_AGGS_KNOWLEDGEBASE . ".`rate_positive`) as `absolute`, SUM(" . DB_PREFIX . DATABASE_STATS_AGGS_KNOWLEDGEBASE . ".`rate_amount`) as `amount`, SUM(" . DB_PREFIX . DATABASE_STATS_AGGS_KNOWLEDGEBASE . ".`rate_positive`)/SUM(" . DB_PREFIX . DATABASE_STATS_AGGS_KNOWLEDGEBASE . ".`rate_amount`) AS `relative`, resources.`id` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_KNOWLEDGEBASE . "` INNER JOIN `resources` ON resources.id = " . DB_PREFIX . DATABASE_STATS_AGGS_KNOWLEDGEBASE . ".res_id WHERE " . DB_PREFIX . DATABASE_STATS_AGGS_KNOWLEDGEBASE . ".`rate_amount`>0 AND " . ADI::GetUnitIntervalCondition(DATABASE_STATS_AGGS, ADI::getFrom(), ADI::getTo(), ADI::$unit) . " GROUP BY `title` ORDER BY `relative`, `absolute` DESC, `amount` DESC LIMIT 100;";

        return array(
            array(
                'kbEq' => true,
                'tid' => 'search_phrases',
                'value' => self::GetKBData('search_phrase', $kbSearchPhrasesDataQuery, 'eq', 0),
                'derefferer' => StatisticProvider::$Dereferrer
            ),
            array(
                'kbEntry' => true,
                'tid' => 'views',
                'value' => self::GetKBData('page', $kbViewsDataQuery, 'eq', 2)
            ),
            array(
                'kbEntry' => true,
                'tid' => 'highest_rated',
                'value' => self::GetKBData('page', $kbHighestRatedDataQuery, 'article', 4, true)
            ),
            array(
                'kbEntry' => true,
                'tid' => 'lowest_rated',
                'value' => self::GetKBData('page', $kbLowestRatedDataQuery, 'article', 4, true)
            )
        );
    }

    static function GetGoalStats()
    {
        return array(
            ADI::GetLineData(DATABASE_STATS_AGGS_EVENTS, 'amount', 'Events'),
            ADI::GetLineData(DATABASE_STATS_AGGS_GOALS, 'amount', 'Goals'),
            ADI::GetLineData(DATABASE_STATS_AGGS_VISITORS, 'visitors_unique', "Visitors"),
            ADI::GetLineData(DATABASE_STATS_AGGS_VISITORS, 'conversions', "Conversions")
        );
    }

    static function GetEventsBar()
    {
        return array(
            ADI::GetBarGraphDataSet(DATABASE_STATS_AGGS_EVENTS, 'amount', array('events'), 'events', '', 'events')
        );
    }

    static function GetGoalsBar()
    {
        return array(
            ADI::GetBarGraphDataSet(DATABASE_STATS_AGGS_GOALS, 'amount', array('goals'), 'goals', '', 'goals')
        );
    }

    static function GetFeedbacksDayNumbers()
    {
        $numbers = array();

        $feedbackCriteria = ADI::GetFeedbackCriteria();

        $character = 'a';
        foreach ($feedbackCriteria as $index => $row) {

            $columnName = 'c' . $character;
            $query = "SELECT IFNULL(SUM(`" . $columnName . "`)/SUM(`amount`) ,0) as `rating` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_FEEDBACKS . "` WHERE " . ADI::GetUnitIntervalCondition(DATABASE_STATS_AGGS_GOALS, ADI::getFrom(), ADI::getTo(), ADI::$unit) . " AND `group_id`>'';";
            $value = ADI::GetSingleDataFromQuery($query);
            $numbers[] = array(
                'key' => $row[0],
                'tid' => $row[0],
                'value' => $value,
                'query' => $query
            );
            $character++;

        }
        return $numbers;
    }

    static function GetFeedbacks()
    {
        $ratingTotalQuery = "SELECT " . ADI::GetRelevantColumn(DATABASE_STATS_AGGS_FEEDBACKS, 'cz') . " FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_FEEDBACKS . "` WHERE " . ADI::GetUnitIntervalCondition(DATABASE_STATS_AGGS_GOALS, ADI::getFrom(), ADI::getTo(), ADI::$unit) . " AND `group_id`>'' ;";

        return array(
            ADI::GetLineData(DATABASE_STATS_AGGS_FEEDBACKS, 'amount', 'Feedbacks'),  //
            ADI::GetLineData(DATABASE_STATS_AGGS_FEEDBACKS, 'cz', 'Rating', $ratingTotalQuery),  //
            ADI::GetLineData(DATABASE_STATS_AGGS_VISITORS, 'visitors_unique', "Visitors")
        );
    }

    static function GetFeedbacksBar()
    {
        $feedbackCriteria = ADI::GetFeedbackCriteria();
        $dataSets = array();

        $dataSets[] = ADI::GetBarGraphDataSet(DATABASE_STATS_AGGS_FEEDBACKS, 'ac', array('groups', 'operators'), 'rating', 'Ø ', 'Rating');
        $dataSets[] = ADI::GetBarGraphDataSet(DATABASE_STATS_AGGS_FEEDBACKS, 'amount', array('groups', 'operators'), 'amount', '', 'Amount');
        $character = 'a';
        foreach ($feedbackCriteria as $index => $row) {
            $dataSets[] = ADI::GetBarGraphDataSet(DATABASE_STATS_AGGS_FEEDBACKS, 'c' . $character, array('groups', 'operators'), $row[0], '', $row[1]);
            $character++;
        }
        return $dataSets;
    }

    static function GetLineData($databaseName, $columnName, $name, $totalQuery = "")
    {

        $query = ADI::GetLineQuery($databaseName, $columnName);

        $values = ADI::GetLineValues($query, $databaseName, $columnName);
        if ($totalQuery != "") {
            $total = ADI::GetSingleDataFromQuery($totalQuery);
        } else {
            $total = array_sum($values[0]);
        }

        return array(
            "values" => $values[0],
            "total" => $total,
            "name" => $name,
//            "query" => $query,
//            "rawValues" => $values[1],
//            "filledRangeArray" => $values[2]
        );
    }

    static function GetLineQuery($tableName, $columnName)
    {
        $hour = "";
        if (ADI::$unit == UNIT_HOURS && $tableName != DATABASE_STATS_AGGS && $tableName != DATABASE_STATS_AGGS_TAGS && $tableName != DATABASE_STATS_AGGS_FEEDBACKS)
            $hour = ", '-', LPAD(`hour`, 2, '0')";
        return "SELECT CONCAT(`year`, '-', LPAD(`month`, 2, '0'), '-', LPAD(`day`, 2, '0')" . $hour . ") as `dateString`, " . ADI::GetRelevantColumn($tableName, $columnName) . " FROM `" . DB_PREFIX . $tableName . "` WHERE " . ADI::GetUnitIntervalCondition(DATABASE_STATS_AGGS, ADI::getFrom(), ADI::getTo(), ADI::$unit) . " " . ADI::GetUniqueCondition($tableName) . " GROUP BY `dateString` ORDER BY `dateString`;";
    }

    static function FilterData($data, $num = true)
    {
        $filteredData = array();
        foreach ($data as $row) {
            $filteredData[] = ADI::FilterRow($row, $num);
        }
        return $filteredData;
    }

    static function FilterRow($row, $num = true)
    {
        $filteredRow = array();
        foreach ($row as $key => $value) {
            if (is_int($key) == $num) {
                $filteredRow[] = $value;
            } else if (!$num) {
                $filteredRow[$key] = $value;
            }
        }
        return $filteredRow;
    }

    static function GetValueFromRow($filteredRow)
    {
        if (count($filteredRow) > 1)
            return array($filteredRow[0], $filteredRow[1]);
        else
            return $filteredRow[0];
    }

    static function GetLineValueData($query)
    {
        $filteredData = ADI::FilterData(ADI::GetData($query));
        $lineValues = array();
        foreach ($filteredData as $row) {
            $date = array_shift($row);
            $value = ADI::GetValueFromRow($row);
            $lineValues[$date] = $value;
        }
        return $lineValues;
    }

    static function GetLineValues($_query)
    {
        $lineValues = ADI::GetLineValueData($_query);
        $filledRangeArray = ADI::GetPaddedZeroRanges(ADI::getFrom(), ADI::getTo(), ADI::$unit);
        $cum = ADI::CummulateDateValuesIntoDisplayDates($lineValues, $filledRangeArray)[0];
        return [$cum, $lineValues, $filledRangeArray];
    }

    static function GetVisitorTOPsQuery($dataTable, $statsTable, $columnName)
    {
        $where = "";
        if ($columnName == 'query')
            $where = " AND `type`='1'";
        return "SELECT `" . DB_PREFIX . $dataTable . "`.`" . $columnName . "`, SUM(`" . DB_PREFIX . $statsTable . "`.`amount`) as `sum` FROM `" . DB_PREFIX . $statsTable . "` INNER JOIN `" . DB_PREFIX . $dataTable . "` ON `" . DB_PREFIX . $dataTable . "`.`id`=`" . DB_PREFIX . $statsTable . "`.`" . $columnName . "` WHERE " . ADI::GetUnitIntervalCondition(DATABASE_STATS_AGGS, ADI::getFrom(), ADI::getTo(), ADI::$unit) . " AND `day`!='0' " . $where . " GROUP BY `" . $columnName . "` ORDER BY `sum` DESC LIMIT 100;";
    }

    static function GetTotalPageImpressionsQuery()
    {
        return "SELECT SUM(`page_impressions`) FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_VISITORS . "` WHERE " . ADI::GetUnitIntervalCondition(DATABASE_STATS_AGGS, ADI::getFrom(), ADI::getTo(), ADI::$unit) . ";";
    }

    static function GetTotalPageImpressions()
    {
        $visitorsQuery = ADI::GetTotalPageImpressionsQuery();
        $result = ADI::GetSingleDataFromQuery($visitorsQuery);
        return $result;
    }

    static function GetTotalKbSearchPhrases()
    {
        return ADI::GetSingleDataFromQuery("SELECT SUM(`amount`) FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_QUERIES . "` WHERE " . ADI::GetUnitIntervalCondition(DATABASE_STATS_AGGS, ADI::getFrom(), ADI::getTo(), ADI::$unit) . " AND `type`='1';");
    }

    static function GetBarLineData_v2($_query)
    {
        $rows = ADI::GetData($_query);
        $lineValues = array();
        foreach ($rows as $row) {
            $filteredRow = ADI::FilterRow($row);
            $date = array_shift($filteredRow);
            $value = ADI::GetValueFromRow($filteredRow);
            $lineValues[$date] = $value;
        }
        $filledRangeArray = ADI::GetPaddedZeroRanges(ADI::getFrom(), ADI::getTo(), ADI::$unit);

        $values = self::CummulateDateValuesIntoDisplayDates($lineValues, $filledRangeArray);
        return $values;
    }

    static function GetDisplayDatesIndexForDateValue($date, $dateKeyCount, $dateKeys)
    {
        $dateEqualsDateKey = (strcmp($date, $dateKeys[0]) == 0);
        if ($dateEqualsDateKey)
            return 0;
        for ($i = 0; $i < $dateKeyCount; $i++) {
            $dateSmallerThanDateKey = (strcmp($date, $dateKeys[$i]) < 0);
            if ($dateSmallerThanDateKey && $i > 0) {
                return $i - 1;
            }
        }
        return $dateKeyCount - 1;
    }

    static function GetAveragedValues($DateValues, $DisplayDates)
    {
        $dateKeys = array_keys($DisplayDates);
        $dateKeyCount = count($dateKeys);
        $avg = array(0, 0);

        foreach ($DateValues as $date => $value) {
            $fittingKey = $dateKeys[self::GetDisplayDatesIndexForDateValue($date, $dateKeyCount, $dateKeys)];
            $cummulated = $DisplayDates[$fittingKey];

            if ($value[1] != 0) {
                $DisplayDates[$fittingKey] = array(($cummulated[0] * $cummulated[1] + $value[0] * $value[1]) / ($cummulated[1] + $value[1]), $cummulated[1] + $value[1]);
                $avg = array(($avg[0] * $avg[1] + $value[0] * $value[1]) / ($avg[1] + $value[1]), $avg[1] + $value[1]);
            }
        }

        return array(array_combine(array_keys($DisplayDates), array_map(function ($n) {
            return $n[0];
        }, array_values($DisplayDates))), $avg[0]);
    }

    static function GetCummulatedValues($DateValues, $DisplayDates)
    {
        $dateKeys = array_keys($DisplayDates);
        $dateKeyCount = count($dateKeys);
        $total = 0;

        foreach ($DateValues as $date => $value) {

            $fittingKey = $dateKeys[self::GetDisplayDatesIndexForDateValue($date, $dateKeyCount, $dateKeys)];
            $DisplayDates[$fittingKey][0] += $value;
            $total += $value;
        }

        return array(array_combine(array_keys($DisplayDates), array_map(function ($n) {
            return $n[0];
        }, array_values($DisplayDates))), $total);
    }

    static function CummulateDateValuesIntoDisplayDates($DateValues, $DisplayDates)
    {
        if (empty($DateValues)) {
            return self::GetCummulatedValues($DateValues, $DisplayDates);
        } else if (!empty($DateValues) && is_array($DateValues[array_rand($DateValues)]) && count($DateValues[array_rand($DateValues)]) > 1) {
            return self::GetAveragedValues($DateValues, $DisplayDates);
        } else {
            return self::GetCummulatedValues($DateValues, $DisplayDates);
        }
    }

    static function GetBarLineQuery($tableName, $columnName, $sectionName, $id)
    {
        $hour = "";
        if (ADI::$unit == UNIT_HOURS && $tableName != DATABASE_STATS_AGGS && $tableName != DATABASE_STATS_AGGS_TAGS && $tableName != DATABASE_STATS_AGGS_FEEDBACKS)
            $hour = ", '-', LPAD(`hour`, 2, '0')";
        return "SELECT CONCAT(`year`, '-', LPAD(`month`, 2, '0'), '-', LPAD(`day`, 2, '0')" . $hour . ") as `dateString`, " . ADI::GetRelevantColumn($tableName, $columnName) . " FROM `" . DB_PREFIX . $tableName . "` WHERE " . ADI::GetUnitIntervalCondition(DATABASE_STATS_AGGS, ADI::getFrom(), ADI::getTo(), ADI::$unit) . " " . ADI::GetUniqueCondition($tableName, $sectionName, $id) . " GROUP BY `dateString` ORDER BY `dateString`;";
    }

    static function GetBarLinesFromSection($sectionName)
    {
        if ($sectionName == 'operators') {
            $sql = "SELECT `system_id` FROM `" . DB_PREFIX . DATABASE_OPERATORS . "`;";
        } else if ($sectionName == 'groups') {
            $sql = "SELECT `id` FROM `" . DB_PREFIX . DATABASE_GROUPS . "` WHERE `dynamic`=0;";
        } else if ($sectionName == 'goals'){
            $sql = "SELECT `id` FROM `" . DB_PREFIX . DATABASE_GOALS . "`;";
        } else if ($sectionName == 'events'){
            $sql = "SELECT `id` FROM `" . DB_PREFIX . DATABASE_EVENTS . "`;";
        }
        $rlist = array();
        if ($result = DBManager::Execute(true, $sql)) {
            while ($row = DBManager::FetchArray($result, MYSQLI_NUM)) {
                $rlist[] = $row[0];
            }
        }
        $flipped = array_flip($rlist);
        return $flipped;
    }

    static function GetSectionData($tableName, $columnName, $sectionName)
    {
        $sectionBarLines = ADI::GetBarLinesFromSection($sectionName);

        $sectionData = array();
        $max = 0;
        foreach ($sectionBarLines as $id => $value) {
            $query = ADI::GetBarLineQuery($tableName, $columnName, $sectionName, $id);
            $barLineData = ADI::GetBarLineData_v2($query);
            $entries = array();
            foreach ($barLineData[0] as $k => $v) {
                $max = max($max, $v);
                $entries[] = array(
                    'key' => $k,
                    'value' => $v
                );
            }
            $sectionData[] = array(
                'key' => $id,
                'value' => $entries,
                'query' => $query,
                'data' => $barLineData[0],
                'total' => $barLineData[1]
            );
        }
        return array($sectionData, $max);
    }

    static function GetSetData($tableName, $columnName, $sections)
    {

        $setData = array();
        $max = 0;
        foreach ($sections as $index => $sectionName) {
            $sectionData = ADI::GetSectionData($tableName, $columnName, $sectionName);
            $max = max($max, $sectionData[1]);
            $setData[] = array(
                'key' => $sectionName,
                'value' => $sectionData[0],
                'max' => $sectionData[1]
            );
        }
        return array($setData, $max);

    }

    static function GetBarGraphDataSet($tableName, $columnName, $sections, $tid, $prefix, $dataSetName)
    {
        $setData = ADI::GetSetData($tableName, $columnName, $sections);
        return array(
            'tid' => $tid,
            'prefix' => $prefix,
            'max' => $setData[1],
            'dataset' => $dataSetName,
            'data' => $setData[0],
            'unit' => ADI::$unit
        );
    }

    static function GetPaddedZeroRanges($from, $to, $unit)
    {
        if (count(ADI::$paddedZeroRanges) == 0) {
            $unitRanges = ADI::GetUnitRanges($from, $to, $unit);
            $paddedZeroRanges = array();
            foreach ($unitRanges as $unitRange => $value) {
                $explodedRange = explode('-', $unitRange);
                $explodedRange[1] = str_pad($explodedRange[1], 2, '0', STR_PAD_LEFT);
                $explodedRange[2] = str_pad($explodedRange[2], 2, '0', STR_PAD_LEFT);
                if (count($explodedRange) > 3)
                    $explodedRange[3] = str_pad($explodedRange[3], 2, '0', STR_PAD_LEFT);
                $implodedRange = implode('-', $explodedRange);
                $paddedZeroRanges[$implodedRange] = array(0, 0);
            }
            ADI::$paddedZeroRanges = $paddedZeroRanges;
        }
        return ADI::$paddedZeroRanges;
    }

    static function GetUnitRanges($from, $to, $unit)
    {
        global $DATE_UNITS;
        $dates = array();
        $first = strtotime(implode('-', $from));
        $current = $first;
        $last = strtotime(implode('-', $to));
        if ($unit == 1) {
            $last = strtotime('+1 day', $last);
            $last = strtotime('-1 hour', $last);
        } else if ($unit == 2) {

        } else if ($unit == 3) {
            $current = strtotime('monday this week', $current);
        } else if ($unit == 4) {
            $current = strtotime('first day of this month', $current);
        } else if ($unit == 5) {
            $current = strtotime('first day of this month', $current);
            $current = strtotime('-' . ((getdate($current)['mon'] - 1) % 3) . ' months', $current);
        } else if ($unit == 6) {
            $current = strtotime('first day of january this year', $current);
        }
        while ($current <= $last) {
            $format = 'Y-m-d';
            if ($unit == 1) {
                $format = 'Y-m-d-G';
            }
            if ($unit == 5)
                $next = strtotime('+ 3 months', $current);
            else {
                $next = strtotime('+1 ' . $DATE_UNITS[$unit], $current);
            }
            if ($unit > 1)
                $next = strtotime('-1 day', $next);
            if ($unit == 1) {
                $dates[date($format, $current)] = array(
                    'from' => array(
                        'year' => date('Y', max($current, $first)),
                        'month' => date('m', max($current, $first)),
                        'day' => date('d', max($current, $first)),
                        'hour' => date('G', max($current, $first))
                    ),
                    'to' => array(
                        'year' => date('Y', min($next, $last)),
                        'month' => date('m', min($next, $last)),
                        'day' => date('d', min($next, $last)),
                        'hour' => date('G', min($next, $last))
                    )
                );
            } else {
                $dates[date($format, $current)] = array(
                    'from' => array(
                        'year' => date('Y', max($current, $first)),
                        'month' => date('m', max($current, $first)),
                        'day' => date('d', max($current, $first))
                    ),
                    'to' => array(
                        'year' => date('Y', min($next, $last)),
                        'month' => date('m', min($next, $last)),
                        'day' => date('d', min($next, $last))
                    )
                );
            }

            if ($unit != 1)
                $current = strtotime('+1 day', $next);
            else
                $current = $next;
        }
        return $dates;
    }

    static function GetUnitIntervalCondition($tableName, $from, $to, $unit)
    {
        if (array_key_exists('hour', $from) && array_key_exists('hour', $to) && $unit == 1 && $tableName != DATABASE_STATS_AGGS && $tableName != DATABASE_STATS_AGGS_TAGS && $tableName != DATABASE_STATS_AGGS_FEEDBACKS)
            return "`year`='" . $from["year"] . "' AND `month`='" . $from["month"] . "' AND `day`='" . $from["day"] . "' AND `hour`='" . $from["hour"] . "'";
        else if($tableName == DATABASE_STATS_AGGS)
            return "CAST(CONCAT(`year`, LPAD(`month`, 2, '0'), LPAD(`day`, 2, '0')) AS UNSIGNED) BETWEEN CAST('" . $from['year'] . str_pad($from['month'], 2, '0', STR_PAD_LEFT) . str_pad($from['day'], 2, '0', STR_PAD_LEFT) . "' AS UNSIGNED) AND CAST('" . str_pad($to['year'], 2, '0', STR_PAD_LEFT) . str_pad($to['month'], 2, '0', STR_PAD_LEFT) . str_pad($to['day'], 2, '0', STR_PAD_LEFT) . "' AS UNSIGNED) AND `month`!='0' AND `day`!='0'";
        else
            return "CAST(CONCAT(`year`, LPAD(`month`, 2, '0'), LPAD(`day`, 2, '0')) AS UNSIGNED) BETWEEN CAST('" . $from['year'] . str_pad($from['month'], 2, '0', STR_PAD_LEFT) . str_pad($from['day'], 2, '0', STR_PAD_LEFT) . "' AS UNSIGNED) AND CAST('" . str_pad($to['year'], 2, '0', STR_PAD_LEFT) . str_pad($to['month'], 2, '0', STR_PAD_LEFT) . str_pad($to['day'], 2, '0', STR_PAD_LEFT) . "' AS UNSIGNED)";
    }


    public static function SetPostData($unit, $from, $to)
    {
        self::$unit = $unit;
        self::$from = $from;
        self::$to = $to;
    }

    static function GetUniqueCondition($tableName, $sectionName = '', $id = '')
    {
        $result = ';';
        switch ($tableName) {
            case DATABASE_STATS_AGGS_CHATS:
            case DATABASE_STATS_AGGS_TICKETS:
                if ($sectionName == 'groups')
                    $result = " AND `group_id`='" . $id . "'";
                else if ($sectionName == 'operators')
                    $result = " AND `user_id`='" . $id . "'";
                else
                    $result = " AND `group_id`>'' ";
                break;
            case DATABASE_STATS_AGGS_VISITORS:
                $result = "";
                break;
            case DATABASE_STATS_AGGS_AVAILABILITIES:
                if ($sectionName == 'groups')
                    $result = " AND `group_id`='" . $id . "'";
                else if ($sectionName == 'operators')
                    $result = " AND `user_id`='" . $id . "'";
                else
                    $result = " AND `user_id`>'' AND `user_id`!='everyoneintern'";
                break;
            case DATABASE_STATS_AGGS_GOALS:
                if ($sectionName == 'goals')
                    $result = " AND `goal`='" . $id . "'";
                else
                    $result = "";
                break;
            case DATABASE_STATS_AGGS_EVENTS:
                if ($sectionName == 'events')
                    $result = " AND `event_id`='" . $id . "'";
                else
                    $result = "";
                break;
            case DATABASE_STATS_AGGS_FEEDBACKS:
                if ($sectionName == 'groups')
                    $result = " AND `group_id`='" . $id . "'";
                else if ($sectionName == 'operators')
                    $result = " AND `operator_id`='" . $id . "'";
                else
                    $result = " AND `group_id`>'' ";
                break;
        }
        return $result;
    }

    static function GetRelevantColumn($tableName, $columnName)
    {
        if ($tableName == DATABASE_STATS_AGGS_CHATS) {
            if ($columnName == 'missed')
                return " IFNULL(SUM(`amount`) - SUM(`declined`) - SUM(`accepted`),0) as `missed`";
            if ($columnName == 'avg_duration')
                return " IFNULL(SUM(`avg_duration`*`accepted`)/(SUM(`accepted`)),0), SUM(`accepted`)";
            if ($columnName == 'avg_waiting_time')
                return " SUM(`avg_waiting_time`*`amount`)/(SUM(`amount`)), SUM(`amount`)";
            if ($columnName == 'avg_response_time')
                return " SUM(`avg_response_time`*`amount`)/(SUM(`amount`)), SUM(`amount`)";
            else
                return " IFNULL(SUM(`" . $columnName . "`),0) ";
        } else if ($tableName == DATABASE_STATS_AGGS_TICKETS) {
            if ($columnName === 'amount')
                return " IFNULL(SUM(`amount`),0) AS `tickets`";
            if ($columnName == 'avg_response_time')
                return " IFNULL(SUM(`avg_response_time`*`responses`)/SUM(`responses`),0), SUM(`responses`)";
            if ($columnName == 'avg_resolve_time')
                return " IFNULL(SUM(`avg_resolve_time`*`resolves`)/SUM(`resolves`),0), SUM(`resolves`)";
            if ($columnName == 'avg_close_time')
                return " IFNULL(SUM(`avg_close_time`*`closed`)/SUM(`closed`),0), SUM(`closed`)";
            else
                return " IFNULL(SUM(`" . $columnName . "`),0)";
        } else if ($tableName == DATABASE_STATS_AGGS_VISITORS) {
            if ($columnName == 'visitors_new')
                return " IFNULL(SUM(`visitors_unique` - `visitors_recurring`),0) as `new` ";
            else
                return " IFNULL(SUM(`" . $columnName . "`),0) as `sum_value`";
        } else if ($tableName == DATABASE_STATS_AGGS_AVAILABILITIES) {
            if ($columnName == 'seconds')
                return " SUM( `seconds`) AS `time`";
            else
                return " COUNT(DISTINCT `user_id`) AS `operators`";
        } else if ($tableName == DATABASE_STATS_AGGS_FEEDBACKS) {
            if ($columnName == 'cz' || $columnName == 'ac') {
                $select = " IFNULL( (";
                $criteria = ADI::GetFeedbackCriteria();
                $criteriaCount = count($criteria);
                $character = 'a';
                foreach ($criteria as $index => $row) {
                    $select = $select . "SUM(`c" . $character . "`) + ";
                    $character++;
                }
                $select = substr($select, 0, -3);

                $select = $select . " ) /(SUM(`amount`) * " . $criteriaCount . "),0), SUM(`amount`) ";
                return $select;
            } else if (preg_match('/c[a-y]/', $columnName)) {
                return " IFNULL( SUM(`" . $columnName . "`)/SUM(`amount`), 0) as `average`, SUM(`amount`) as `amount`";
            }
            return (" IFNULL(SUM(`" . $columnName . "`),0)");


        } else
            return (" IFNULL(SUM(`" . $columnName . "`),0)");
    }

    static function GetSingleDataFromQuery($query)
    {
        if ($result = DBManager::Execute(true, $query)) {
            if ($row = DBManager::FetchArray($result, MYSQLI_NUM)) {
                return $row[0];
            }
        }
        return 0;
    }

    static function GetSingleRowFromQuery($query)
    {
        if ($result = DBManager::Execute(true, $query)) {
            if ($row = DBManager::FetchArray($result, MYSQLI_ASSOC)) {
                return $row;
            }
        }
        return 0;
    }

    static function GetGroups()
    {
        return array_map(function ($in) {
            return array('id' => $in->SystemId, 'name' => strval($in->Fullname), 'openingHours' => $in->OpeningHours);
        }, array_filter(Server::$Groups, function ($in) {
            return $in->IsDynamic == false;
        }));
    }

    static function GetOperators()
    {
        return array_map(function ($in) {
            return array('id' => $in->SystemId, 'name' => strval($in->Fullname));
        }, getOperators());
    }

    static function GetGoals()
    {
        return ADI::GetData("Select `id`, `title` as `name` FROM `" . DB_PREFIX . DATABASE_GOALS . "`;");
    }

    static function GetEvents()
    {
        return ADI::GetData("Select `id`, `name` FROM `" . DB_PREFIX . DATABASE_EVENTS . "`;");
    }

    static function GetData($sql)
    {
        $rlist = array();
        if ($result = DBManager::Execute(true, $sql))
            while ($row = DBManager::FetchArray($result))
                $rlist[] = $row;
        return $rlist;
    }

    static function getEarliestDate()
    {
        if (empty(self::$earliestDate)) {
            $earliest = self::GetData("SELECT `year`, `month`, `day` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_AVAILABILITIES . "` ORDER BY `year` ASC, `month` ASC, `day` ASC LIMIT 1;");
            self::$earliestDate = array(
                $earliest[0][0],
                str_pad($earliest[0][1], 2, "0", STR_PAD_LEFT),
                str_pad($earliest[0][2], 2, "0", STR_PAD_LEFT)
            );
        }
        return self::$earliestDate;
    }

    static function getLatestDate()
    {
        if (empty(self::$latestDate)) {
            $latest = self::GetData("SELECT `year`, `month`, `day` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS . "` ORDER BY `year` DESC, `month` DESC, `day` DESC LIMIT 1;");
            self::$latestDate = array(
                'year' => $latest[0][0],
                'month' => str_pad($latest[0][1], 2, "0", STR_PAD_LEFT),
                'day' => str_pad($latest[0][2], 2, "0", STR_PAD_LEFT)
            );
        }
        return self::$latestDate;
    }

    public static function getFrom()
    {
        if (empty(self::$from))
            self::$from = array(
                'year' => date("Y"),
                'month' => date('m'),
                'day' => date("d")
            );
        return self::$from;
    }

    public static function getTo()
    {
        if (empty(self::$to))
            self::$to = array(
                'year' => date("Y"),
                'month' => date('m'),
                'day' => date("d")
            );
        return self::$to;
    }

}
