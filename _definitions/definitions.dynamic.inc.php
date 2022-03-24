<?php

/****************************************************************************************
* LiveZilla definitions.dynamic.inc.php
* 
* Copyright 2017 LiveZilla GmbH
* All rights reserved.
* LiveZilla is a registered trademark.
* 
***************************************************************************************/ 

define("TEMPLATE_HTML_INDEX",PATH_TEMPLATES . "index.tpl");
define("TEMPLATE_SCRIPT_ALERT",PATH_TEMPLATES . "alert.tpl");
define("TEMPLATE_HTML_MESSAGE_EXTERN",PATH_TEMPLATES . "messageexternal.tpl");
define("TEMPLATE_HTML_MESSAGE_SYSTEM",PATH_TEMPLATES . "messagesystem.tpl");
define("TEMPLATE_HTML_MESSAGE_INTERN",PATH_TEMPLATES . "messageinternal.tpl");
define("TEMPLATE_HTML_MESSAGE_ADD",PATH_TEMPLATES . "messageadd.tpl");
define("TEMPLATE_HTML_MESSAGE_ADD_ALTERNATE",PATH_TEMPLATES . "messageaddalt.tpl");

define("TEMPLATE_HTML_SUPPORT",PATH_TEMPLATES . "support.tpl");
define("TEMPLATE_HTML_RATEBOX",PATH_TEMPLATES . "ratebox.tpl");
define("TEMPLATE_HTML_STATS_BODY",PATH_TEMPLATES . "stats_body.tpl");
define("TEMPLATE_HTML_STATS_HOURS",PATH_TEMPLATES . "stats_hours.tpl");
define("TEMPLATE_HTML_STATS_DAYS",PATH_TEMPLATES . "stats_days.tpl");
define("TEMPLATE_HTML_STATS_OPERATORS",PATH_TEMPLATES . "stats_operators.tpl");
define("TEMPLATE_HTML_STATS_GROUPS",PATH_TEMPLATES . "stats_groups.tpl");
define("TEMPLATE_HTML_STATS_MONTHS",PATH_TEMPLATES . "stats_months.tpl");
define("TEMPLATE_HTML_STATS_BASE",PATH_TEMPLATES . "stats_base.tpl");
define("TEMPLATE_HTML_STATS_BASE_TABLE",PATH_TEMPLATES . "stats_base_table.tpl");
define("TEMPLATE_HTML_STATS_TOP_TABLE",PATH_TEMPLATES . "stats_top_table.tpl");
define("TEMPLATE_HTML_STATS_TOP_TABLE_INNER",PATH_TEMPLATES . "stats_top_table_inner.tpl");
define("TEMPLATE_HTML_STATS_TOP_URL_TABLE",PATH_TEMPLATES . "stats_top_url_table.tpl");
define("TEMPLATE_HTML_STATS_TOP_ROW",PATH_TEMPLATES . "stats_top_row.tpl");
define("TEMPLATE_HTML_STATS_TOP_ROW_INNER",PATH_TEMPLATES . "stats_top_row_inner.tpl");
define("TEMPLATE_HTML_STATS_SPAN_TABLE",PATH_TEMPLATES . "stats_span_table.tpl");
define("TEMPLATE_HTML_STATS_SPAN_ROW",PATH_TEMPLATES . "stats_span_row.tpl");
define("TEMPLATE_HTML_STATS_HOURS_HIDDEN_ROW",PATH_TEMPLATES . "stats_hours_hidden_row.tpl");
define("TEMPLATE_HTML_STATS_BASE_ROW",PATH_TEMPLATES . "stats_base_row.tpl");
define("TEMPLATE_HTML_STATS_USERS_BODY",PATH_TEMPLATES . "stats_users_body.tpl");
define("TEMPLATE_HTML_STATS_USERS_USER",PATH_TEMPLATES . "stats_users_user.tpl");
define("TEMPLATE_HTML_STATS_USERS_URL",PATH_TEMPLATES . "stats_users_url.tpl");
define("TEMPLATE_HTML_MAP",PATH_TEMPLATES . "map.tpl");
define("TEMPLATE_PHP_CONFIG",PATH_TEMPLATES . "config.tpl");
define("TEMPLATE_LOGIN_TRAP",PATH_TEMPLATES . "login_trap.tpl");

$version = "ahgzixd7";

define("TEMPLATE_SCRIPT_TRACK",PATH_TEMPLATES . "".$version."/jstrack.tpl");
define("TEMPLATE_SCRIPT_CONNECTOR",PATH_TEMPLATES . "".$version."/jsconnector.tpl");
define("TEMPLATE_SCRIPT_GROUPS",PATH_TEMPLATES . "".$version."/jsgroups.tpl");
define("TEMPLATE_SCRIPT_GLOBAL",PATH_TEMPLATES . "".$version."/jsglobal.js");
define("TEMPLATE_SCRIPT_INVITATION",PATH_TEMPLATES . "invitations/");

define("TEMPLATE_SCRIPT_OVERLAY_CHAT",PATH_TEMPLATES . "overlays/chat_".$version."/");
define("TEMPLATE_HTML_MESSAGE_OVERLAY_CHAT_STATUS",PATH_TEMPLATES . "overlays/chat_".$version."/messagestatus.tpl");
define("TEMPLATE_HTML_MESSAGE_OVERLAY_CHAT_PICTURE",PATH_TEMPLATES . "overlays/chat_".$version."/messagepicture.tpl");

define("PATH_USERS",LIVEZILLA_PATH . "_internal/");
define("PATH_STATS",LIVEZILLA_PATH . "stats/");
define("PATH_FRAMES",PATH_TEMPLATES . "frames/");
?>