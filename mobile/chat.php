<?php

/****************************************************************************************
 * LiveZilla chat.php
 *
 * Copyright 2018 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/

header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");
header("Access-Control-Allow-Origin: *");

function lzmBase64UrlDecode($str)
{
    $str = str_replace('_', '=', $str);
    $str = str_replace('-', '+', $str);
    $str = str_replace(',', '/', $str);
    $str = base64_decode($str);
    return $str;
}

function lzmBase64UrlEncode($str)
{
    $str = base64_encode($str);
    $str = str_replace('=', '_', $str);
    $str = str_replace('+', '-', $str);
    $str = str_replace('/', ',', $str);

    return $str;
}

function lzmHash($str)
{
    $str = md5($str);
    $str = hash('sha256', $str);
    return $str;
}

function lzmBase64UrlDecodeAndHash($str)
{
    $str = lzmBase64UrlDecode($str);
    $str = lzmHash($str);
    return $str;
}

function lzmGetCleanRequestParam($param)
{
    if (preg_match('/^[a-zA-Z0-9_,-]*$/', $param) == 1)
        return htmlentities($param, ENT_QUOTES, 'UTF-8');
    else
        return '';
}

require './php/common/functions.php';

$requestDataString = serialize($_REQUEST);

$index = !empty($_REQUEST['ndx']) ? $_REQUEST['ndx'] : '';
$login_name = !empty($_REQUEST['lgn']) ? $_REQUEST['lgn'] : '';
$login_passwd = !empty($_REQUEST['psswrd']) ? $_REQUEST['psswrd'] : '';
$ldap = !empty($_REQUEST['ldap']) ? 1 : 0;
$server_port = !empty($_REQUEST['prt']) ? $_REQUEST['prt'] : '';
$server_profile = !empty($_REQUEST['prfl']) ? $_REQUEST['prfl'] : '';
$server_protocol = !empty($_REQUEST['prtcl']) ? $_REQUEST['prtcl'] : '';
$server_url = !empty($_REQUEST['rl']) ? $_REQUEST['rl'] : '';
$mobile_dir = !empty($_REQUEST['mbl_dr']) ? $_REQUEST['mbl_dr'] : 'bW9iaWxl';
$status = !empty($_REQUEST['stts']) ? $_REQUEST['stts'] : '';
$app = !empty($_REQUEST['pp']) ? $_REQUEST['pp'] : 0;
$web = !empty($_REQUEST['wb']) ? $_REQUEST['wb'] : 0;
$awayAfter = !empty($_REQUEST['w_ftr']) ? $_REQUEST['w_ftr'] : 'MA__';
$playIncomingMessageSound = !empty($_REQUEST['pl_ncmng_mssg_snd']) ? $_REQUEST['pl_ncmng_mssg_snd'] : 'MQ__';
$playIncomingChatSound = !empty($_REQUEST['pl_ncmng_cht_snd']) ? $_REQUEST['pl_ncmng_cht_snd'] : 'MQ__';
$repeatIncomingChatSound = !empty($_REQUEST['rpt_ncmng_cht_snd']) ? $_REQUEST['rpt_ncmng_cht_snd'] : 'MQ__';
$playIncomingTicketSound = !empty($_REQUEST['pl_ncmng_tckt_snd']) ? $_REQUEST['pl_ncmng_tckt_snd'] : 'LQ__';
$language = !empty($_REQUEST['lngg']) ? $_REQUEST['lngg'] : '';
$loginId = !empty($_REQUEST['lgnd']) ? $_REQUEST['lgnd'] : '';
$backgroundMode = 'MQ__';
$localDbPrefix = !empty($_REQUEST['lcl_db_prfx']) ? $_REQUEST['lcl_db_prfx'] : '';
$appOs = (!empty($_REQUEST['pps'])) ? $_REQUEST['pps'] : '';
$debug = !empty($_REQUEST['dbg']) ? $_REQUEST['dbg'] : 0;
$lzmVcode = !empty($_REQUEST['psswrd']) ? $_REQUEST['psswrd'] : '';

if (empty($ldap))
    $lzmVcode = lzmBase64UrlEncode($login_name . '~' . lzmBase64UrlDecodeAndHash($lzmVcode));
else
    $lzmVcode = lzmBase64UrlEncode($login_name . '~' . ($lzmVcode));

$isDesktopApp = in_array($appOs, array("desk_win", "desk_linux", "desk_mac"));
$protocolMode = (!empty($_REQUEST['p'])) ? $_REQUEST['p'] : '';
$mobileInformation = getMobileInformation();
$messageInternal = readHtmlTemplate('messageinternal.tpl');
$messageExternal = readHtmlTemplate('messageexternal.tpl');
$messageAdd = readHtmlTemplate('messageadd.tpl');
$messageAddAlt = readHtmlTemplate('messageaddalt.tpl');
$messageRepost = readHtmlTemplate('messagerepost.tpl');
$messageHeader = readHtmlTemplate('header.tpl');
$langFileTemplate = readHtmlTemplate('langFile.tpl', false, true);

define("LIVEZILLA_PATH", "./../");
require "./../language.php";

$language = lzmBase64UrlDecode($language);

require_once(LIVEZILLA_PATH . "_definitions/definitions.inc.php");
require_once(LIVEZILLA_PATH . "_definitions/definitions.dynamic.inc.php");
require_once(LIVEZILLA_PATH . "_definitions/definitions.protocol.inc.php");

Server::InitDataProvider();
Server::InitDataBlock(array("INTERNAL"));

$sysid = Operator::GetSystemId(base64_decode($login_name));

if (isset(Server::$Operators[$sysid])) {
    $oplang = Server::$Operators[$sysid]->Language;
    if (!empty($oplang)) {
        if (strpos($oplang, ",") !== false)
            $oplang = explode(",", $oplang)[0];
        $language = $oplang;
    }
}

//1ax::th
$language = strtolower($language);
$jsLanguageData = getLanguageJS($language);
$acid = "?acid=" . time();
//1ax::th

$title = Server::$Configuration->File["gl_site_name"];

?>
<!DOCTYPE HTML>
<html manifest="lzm.appcache">

<head>
    <title>
        <?php echo $title; ?>
    </title>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
    <meta http-equiv="Pragma" content="no-cache" />
    <meta http-equiv="Expires" content="0" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
    <meta name="google" content="notranslate">
    <meta name="format-detection" content="telephone=no">
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />

    <link rel="stylesheet" type="text/css" href="../fonts/font-awesome.min.css" />
    <link rel="stylesheet" type="text/css" href="./css/livezilla6.css<?php echo $acid ?>" />
    <link rel="manifest" href="./manifest.php">
    <link rel="stylesheet" type="text/css" href="./css/livezilla6TemplateAndServer.css<?php echo $acid ?>" />
    <link rel="shortcut icon" href="../images/favicon.ico" type="image/x-icon">

    <?php
    if ($isDesktopApp) {
        echo "<script>if (typeof module === 'object') {window.module = module; module = undefined;}</script>";
        echo "<script type=\"text/javascript\" src=\"./js/lzm/classes/DesktopDeviceInterfaceClass.js" . $acid . "\"></script>";
    }
    ?>

    <script type="text/javascript" src="./js/jquery-3.4.1.min.js"></script>
    <script type="text/javascript" src="./js/jquery-migrate-1.2.1.min.js"></script>
    <script type="text/javascript" src="./js/jquery-migrate-3.1.0.min.js"></script>
    <script type="text/javascript" src="./js/jquery.blockUI.js"></script>

    <script type="text/javascript" src="js/md5.js"></script>
    <script type="text/javascript" src="js/sha1.js"></script>
    <script type="text/javascript" src="js/sha256.js"></script>
    <script type="text/javascript" src="js/jsglobal.js<?php echo $acid ?>"></script>
    <script type="text/javascript" src="js/wyzz/wyzz.js<?php echo $acid ?>"></script>

    <script type="text/javascript">
        var chosenProfile = {};
        var userStatus = 0;
        var isMobile = <?php echo $mobileInformation['isMobile']; ?>;
        var isTablet = <?php echo $mobileInformation['isTablet']; ?>;
        var localDbPrefix = <?php echo "'" . lzmGetCleanRequestParam($localDbPrefix) . "'"; ?>;
        var mobileOS = <?php echo "'" . $mobileInformation['mobileOS'] . "'"; ?>;
        var mobileVersion = <?php echo "'" . $mobileInformation['mobileVersion'] . "'"; ?>;
        var mobileIsSufficient = <?php echo "'" . $mobileInformation['mobileIsSufficient'] . "'"; ?>;
        var messageTemplates = {
            'internal': <?php echo "'" . $messageInternal . "'"; ?>,
            'external': <?php echo "'" . $messageExternal . "'"; ?>,
            'add': <?php echo "'" . $messageAdd . "'"; ?>,
            'addalt': <?php echo "'" . $messageAddAlt . "'"; ?>,
            'repost': <?php echo "'" . $messageRepost . "'"; ?>,
            'header': <?php echo "'" . $messageHeader . "'"; ?>,
            'system': '<div class="SCMT info_class_placeholder"><i class="fa fa-info-circle"></i>&nbsp;&nbsp;<!--message--></div>',
            'systemadd': '<div class="SCMT info_class_placeholder"><i class="fa fa-info-circle"></i>&nbsp;&nbsp;<!--message--></div>'
        };
        var langFileTemplate = <?php echo "'" . $langFileTemplate . "'"; ?>;
        var web = <?php echo lzmGetCleanRequestParam($web); ?>;
        var app = <?php echo lzmGetCleanRequestParam($app); ?>;
        var appOs = <?php echo "'" . lzmGetCleanRequestParam($appOs) . "'"; ?>;
        var debug = true;
        var translationData = <?php echo $jsLanguageData; ?>;
        var lzmcu =

            window.onerror = function(errorMessage, errorUrl, errorLine) {
                if (typeof handleClientError != 'undefined') {
                    handleClientError(errorMessage, errorUrl, errorLine);
                } else {
                    alert(errorMessage, errorUrl, errorLine);
                }
            };
        $(document).ready(function() {
            var server_url = lz_global_base64_url_decode(<?php echo "'" . lzmGetCleanRequestParam($server_url) . "'"; ?>);
            var mobile_dir = lz_global_base64_url_decode(<?php echo "'" . lzmGetCleanRequestParam($mobile_dir) . "'"; ?>);
            var server_port = lz_global_base64_url_decode(<?php echo "'" . lzmGetCleanRequestParam($server_port) . "'"; ?>);
            var loginId = lz_global_base64_url_decode(<?php echo "'" . lzmGetCleanRequestParam($loginId) . "'"; ?>);
            var language = <?php echo "'" . lzmGetCleanRequestParam($language) . "'"; ?>;
            var backgroundMode = lz_global_base64_url_decode(<?php echo "'" . lzmGetCleanRequestParam($backgroundMode) . "'"; ?>);
            var urlParts = server_url.split('/');
            var urlBase = urlParts[0];
            var urlRest = '';

            for (var i = 1; i < urlParts.length; i++) {
                urlRest += '/' + urlParts[i];
            }

            server_url = urlBase + ':' + server_port + urlRest;

            var protocolMode = lz_global_base64_url_decode(<?php echo "'" . lzmGetCleanRequestParam($protocolMode) . "'"; ?>);

            var serverProtocol = '';
            if (protocolMode == '1')
                serverProtocol = 'https://';
            else if (protocolMode == '0')
                serverProtocol = 'http://';
            else
                serverProtocol = lz_global_base64_url_decode(<?php echo "'" . lzmGetCleanRequestParam($server_protocol) . "'"; ?>)

            chosenProfile = {
                index: lz_global_base64_url_decode(<?php echo "'" . lzmGetCleanRequestParam($index) . "'"; ?>),
                login_name: '',
                login_passwd: '',
                ldap: <?php echo $ldap; ?>,
                server_port: server_port,
                server_profile: lz_global_base64_url_decode(<?php echo "'" . lzmGetCleanRequestParam($server_profile) . "'"; ?>),
                server_protocol: serverProtocol,
                server_url: server_url,
                mobile_dir: mobile_dir,
                user_away_after: lz_global_base64_url_decode(<?php echo "'" . lzmGetCleanRequestParam($awayAfter) . "'"; ?>),
                play_incoming_message_sound: lz_global_base64_url_decode(<?php echo "'" . lzmGetCleanRequestParam($playIncomingMessageSound) . "'"; ?>),
                play_incoming_chat_sound: lz_global_base64_url_decode(<?php echo "'" . lzmGetCleanRequestParam($playIncomingChatSound) . "'"; ?>),
                repeat_incoming_chat_sound: lz_global_base64_url_decode(<?php echo "'" . lzmGetCleanRequestParam($repeatIncomingChatSound) . "'"; ?>),
                play_incoming_ticket_sound: lz_global_base64_url_decode(<?php echo "'" . lzmGetCleanRequestParam($playIncomingTicketSound) . "'"; ?>),
                fake_mac_address: loginId,
                language: language,
                background_mode: backgroundMode,
                login_id: loginId,
                lzmvcode: <?php echo "'" . lzmGetCleanRequestParam($lzmVcode) . "'"; ?>
            };
            userStatus = lz_global_base64_url_decode(<?php echo "'" . lzmGetCleanRequestParam($status) . "'"; ?>);
            if (isMobile && mobileOS == 'iOS') {
                $('#chat_page').css({
                    'overflow-y': 'visible'
                });
            }

        });
    </script>

    <script type="text/javascript" src="./js/lzm/classes/CommonDeviceInterfaceClass.js<?php echo $acid ?>"></script>
    <script type="text/javascript" src="./js/lzm/classes/CommonWindowsDeviceInterfaceClass.js<?php echo $acid ?>"></script>
    <script type="text/javascript" src="./js/lzm/classes/CommonDeviceInterfaceManager.js<?php echo $acid ?>"></script>
    <script type="text/javascript" src="./js/lzm/classes/ChatTranslationEditorClass.js<?php echo $acid ?>"></script>
    <script type="text/javascript" src="./js/lzm/classes/ChatReportsClass.js<?php echo $acid ?>"></script>
    <script type="text/javascript" src="./js/lzm/classes/ChatSettingsClass.js<?php echo $acid ?>"></script>
    <script type="text/javascript" src="./js/lzm/classes/ChatStartpageClass.js<?php echo $acid ?>"></script>
    <script type="text/javascript" src="./js/lzm/classes/ChatCountries.js<?php echo $acid ?>"></script>
    <script type="text/javascript" src="./js/lzm/classes/KnowledgebaseUIClass.js<?php echo $acid ?>"></script>
    <script type="text/javascript" src="./js/lzm/classes/ChatArchiveClass.js<?php echo $acid ?>"></script>
    <script type="text/javascript" src="./js/lzm/classes/ChatVisitorClass.js<?php echo $acid ?>"></script>
    <script type="text/javascript" src="./js/lzm/classes/ChatTicketClass.js<?php echo $acid ?>"></script>
    <script type="text/javascript" src="./js/lzm/classes/ChatUIClass.js<?php echo $acid ?>"></script>
    <script type="text/javascript" src="./js/lzm/classes/CommonConfigClass.js<?php echo $acid ?>"></script>
    <script type="text/javascript" src="./js/lzm/classes/CommonToolsClass.js<?php echo $acid ?>"></script>
    <script type="text/javascript" src="./js/lzm/classes/CommonPermissionClass.js<?php echo $acid ?>"></script>
    <script type="text/javascript" src="./js/lzm/classes/CommonStorageClass.js<?php echo $acid ?>"></script>
    <script type="text/javascript" src="./js/lzm/classes/ChatServerEvaluationClass.js<?php echo $acid ?>"></script>
    <script type="text/javascript" src="./js/lzm/classes/ChatPollServerClass.js<?php echo $acid ?>"></script>
    <script type="text/javascript" src="./js/lzm/classes/ChatUserActionsClass.js<?php echo $acid ?>"></script>
    <script type="text/javascript" src="./js/lzm/classes/ChatDisplayClass.js<?php echo $acid ?>"></script>
    <script type="text/javascript" src="./js/lzm/classes/ChatDisplayHelperClass.js<?php echo $acid ?>"></script>
    <script type="text/javascript" src="./js/lzm/classes/CommonInputControlsClass.js<?php echo $acid ?>"></script>
    <script type="text/javascript" src="./js/lzm/classes/UIRendererClass.js<?php echo $acid ?>"></script>
    <script type="text/javascript" src="./js/lzm/classes/CommonTranslationClass.js<?php echo $acid ?>"></script>
    <script type="text/javascript" src="./js/lzm/classes/ChatEditorClass.js<?php echo $acid ?>"></script>
    <script type="text/javascript" src="./js/lzm/classes/ChatObjectClasses.js<?php echo $acid ?>"></script>
    <script type="text/javascript" src="./js/lzm/classes/CommonDialogClass.js<?php echo $acid ?>"></script>
    <script type="text/javascript" src="./js/lzm/classes/ChatGeotrackingMapClass.js<?php echo $acid ?>"></script>
    <script type="text/javascript" src="./js/lzm/classes/CommonServerEvaluationClass.js<?php echo $acid ?>"></script>
    <script type="text/javascript" src="./js/lzm/classes/ContextMenuClass.js<?php echo $acid ?>"></script>
    <script type="text/javascript" src="js/lzm/chat.js<?php echo $acid ?>"></script>

    <?php if ($isDesktopApp)
        echo "<script>if (window.module) module = window.module;</script>";
    ?>

</head>

<body>

    <div class="lz-menu" id="view-select-panel"></div>

    <div id="usersettings-menu" class="mouse-menu panel-menu" style="display:none;"></div>

    <div id="main_frame">
        <div id="chat_page">
            <div id="main-menu-info-box"></div>
            <div id="main-menu-panel"></div>

            <div id="main-search-box" class="lzm-dialog">
                <div id="main-search-headline" class="lzm-dialog-headline2"></div>
                <div id="main-search-body" class="lzm-dialog-body">
                    <fieldset id="main-search-frame" class="lzm-fieldset-full">
                        <i class="fa fa-search lzm-clickable2" onclick="CommonInputControlsClass.SearchBox.Search()"></i>
                        <input type="text" id="main-search-field" class="input-embedded" autocomplete="off" onkeydown="CommonInputControlsClass.SearchBox.Change()" onchange="CommonInputControlsClass.SearchBox.Change()" onkeyup="CommonInputControlsClass.SearchBox.Change(event)" placeholder="Search">
                        <i class="fa fa-remove lzm-clickable" onclick="CommonInputControlsClass.SearchBox.Reset()"></i>
                    </fieldset>
                    <fieldset class="lzm-fieldset" id="main-search-settings"></fieldset>
                    <fieldset class="lzm-fieldset" id="main-search-tags"></fieldset>
                </div>
            </div>
            <div id="userstatus-menu" class="mouse-menu panel-menu" style="display:none;"></div>
            <div id="minified-dialogs-menu" class="mouse-menu" style="display:none;"></div>

            <div id="chat">
                <div id="chat-container" class="lzm-dialog">
                    <div id="chat-table" class="lzm-dialog-body">
                        <div id="chat-allchats" style="display: none;"></div>
                    </div>
                </div>
                <div id="chat-controls">
                    <div id="chat-progress" style="text-align: left; display: none;"></div>
                    <div id="chat-members" style="text-align: left; display: none;">
                        <div id="chat-members-list"></div>
                        <div id="chat-members-line" class="chat-info-divider"></div>
                        <div id="chat-members-minimize" onclick="CommonUIClass.ToggleMemberList();"><i class="fa fa-chevron-right"></i></div>
                    </div>
                    <div id="chat-qrd-preview" style="text-align: left; display: none;"></div>
                    <div id="chat-buttons" style="display: none;"></div>
                    <div id="chat-action" style="display: none;">
                        <div id="chat-input-controls"></div>
                        <div id="chat-input-body">
                            <textarea id="chat-input" onkeypress="return catchEnterButtonPressedMobile(event);" onkeyup="chatInputTyping(event);"></textarea><br>
                        </div>
                    </div>
                </div>
                <div id="chat-info-body">
                    <div id="chat-info-line" class="chat-info-divider"></div>
                    <div id="chat-info-elements"></div>
                </div>
                <div id="qrd-tree" class="lzm-dialog">
                    <div id="qrd-tree-body" class="lzm-dialog-body"></div>
                </div>
                <div id="operator-list" class="lzm-dialog">
                    <div id="operator-list-headline" class="lzm-dialog-headline"></div>
                    <div id="operator-list-body" class="lzm-dialog-body"></div>
                </div>
                <div id="ticket-list" class="lzm-dialog">
                    <div id="ticket-list-headline" class="lzm-dialog-headline"></div>
                    <div id="ticket-list-headline2" class="lzm-dialog-headline2"></div>
                    <div id="ticket-list-body" class="lzm-dialog-body"></div>
                    <div id="ticket-list-footline" class="lzm-dialog-footline"></div>

                </div>
                <div id="visitor-list" class="lzm-dialog">
                    <div id="visitor-list-headline" class="lzm-dialog-headline"></div>
                    <div id="visitor-list-headline2" class="lzm-dialog-headline2"></div>
                    <div id="visitor-treeview" class="visitor-treeview"></div>
                    <div id="visitor-list-table-div" class="lzm-dialog-body"></div>
                    <div id="geotracking">
                        <div id="geotracking-body" class="lzm-dialog-body"></div>
                        <div id="geotracking-footline" class="lzm-dialog-footline"></div>
                    </div>
                </div>
                <div id="archive" class="lzm-dialog">
                    <div id="archive-headline" class="lzm-dialog-headline"></div>
                    <div id="archive-headline2" class="lzm-dialog-headline2"></div>
                    <div id="archive-body" class="lzm-dialog-body"></div>
                    <div id="archive-footline" class="lzm-dialog-footline"></div>
                </div>
                <div id="startpage" class="lzm-dialog">
                    <div id="startpage-body" class="lzm-dialog-body"></div>
                </div>
                <div id="onboarding" class="lzm-dialog-body"></div>
                <div id="report-list" class="lzm-dialog">
                    <div id="dashboard-headline" class="lzm-dialog-headline2"><span class="lzm-dialog-hl2-info">Dashboard</span></div>
                    <div id="report-list-headline2" class="lzm-dialog-headline2"></div>
                    <div id="report-list-body" class="lzm-dialog-body"></div>
                    <div id="report-list-footline" class="lzm-dialog-footline"></div>
                    <div id="report-rtdb-frame"></div>
                </div>

            </div>
            <div id="errors" style="text-align:left;display:none;"></div>
        </div>
    </div>

    <div id="task-bar-panel"></div>
    <div class="mouse-move"></div>
    <div class="mouse-move"></div>
    <div id="mouse-protect"></div>
    <div id="mouse-stop" class="lzm-clickable2" onclick="CommonToolsClass.AnimationRunStop();"><i class="fa fa-close text-white icon-xxl"></i></div>
</body>

</html>