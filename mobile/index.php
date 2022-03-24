<?php

/****************************************************************************************
 * LiveZilla index.php
 *
 * Copyright 2018 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/

$language = $_SERVER['HTTP_ACCEPT_LANGUAGE'];
$language = explode(',', $language);
$language = strtolower($language[0]);

header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

define("LIVEZILLA_PATH", "./../");

require_once("./../language.php");
require_once("./../_lib/objects.languages.inc.php");

$jsLanguageData = getLanguageJS($language);
$acid = "?acid=" . time();

if (!isset($LANGUAGES[strtoupper($language)])) {
    $parts = explode("-", $language);
    if (strlen($language) <= 6 && !(is_array($parts) && count($parts) > 0 && isset($LANGUAGES[strtoupper($parts[0])])))
        exit("Invalid localization data " . $language);
    //$language = "en";
}

function lzmGetCleanRequestParam($param)
{
    if (preg_match('/^[a-zA-Z0-9_,-]*$/', $param) == 1)
        return htmlentities($param, ENT_QUOTES, 'UTF-8');
    else
        return '';
}

function lzmBase64UrlDecode($str)
{
    return $str;
}

?>

<!DOCTYPE HTML>
<html>

<head>
    <title>Livezilla</title>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
    <meta name="apple-itunes-app" content="app-id=710516100">
    <link rel="stylesheet" type="text/css" href="../fonts/font-awesome.min.css" />
    <link rel="stylesheet" type="text/css" href="./css/livezilla6.css<?php echo $acid ?>" />
    <link rel="stylesheet" type="text/css" href="./css/livezilla6Login.css<?php echo $acid ?>" />
    <link rel="manifest" href="./manifest.php">
    <link rel="shortcut icon" href="../images/favicon.ico" type="image/x-icon">
    <script type="text/javascript" src="./js/jquery-3.4.1.min.js"></script>
    <script type="text/javascript" src="./js/jsglobal.js"></script>
    <script type="text/javascript" src="./js/md5.js"></script>
    <script type="text/javascript" src="./js/sha1.js"></script>
    <script type="text/javascript" src="./js/sha256.js"></script>
    <script type="text/javascript" src="./js/lzm/classes/CommonDeviceInterfaceClass.js<?php echo $acid ?>"></script>
    <script type="text/javascript" src="./js/lzm/classes/CommonWindowsDeviceInterfaceClass.js<?php echo $acid ?>"></script>
    <script type="text/javascript" src="./js/lzm/classes/CommonConfigClass.js<?php echo $acid ?>"></script>
    <script type="text/javascript" src="./js/lzm/classes/CommonToolsClass.js<?php echo $acid ?>"></script>
    <script type="text/javascript" src="./js/lzm/classes/CommonStorageClass.js<?php echo $acid ?>"></script>
    <script type="text/javascript" src="./js/lzm/classes/CommonDisplayClass.js<?php echo $acid ?>"></script>
    <script type="text/javascript" src="./js/lzm/classes/CommonDialogClass.js<?php echo $acid ?>"></script>
    <script type="text/javascript" src="./js/lzm/classes/ChatObjectClasses.js<?php echo $acid ?>"></script>
    <script type="text/javascript" src="./js/lzm/classes/CommonDisplayHelperClass.js<?php echo $acid ?>"></script>
    <script type="text/javascript" src="./js/lzm/classes/CommonInputControlsClass.js<?php echo $acid ?>"></script>
    <script type="text/javascript" src="./js/lzm/classes/CommonDisplayLayoutClass.js<?php echo $acid ?>"></script>
    <script type="text/javascript" src="./js/lzm/classes/CommonTranslationClass.js<?php echo $acid ?>"></script>
    <script type="text/javascript" src="./js/lzm/classes/CommonDeviceInterfaceManager.js<?php echo $acid ?>"></script>
    <script type="text/javascript" src="./js/lzm/index.js<?php echo $acid ?>"></script>
    <?php
    #<script type="text/javascript" src="./js/lzm/translationData.js"></script>
    ?>
    <script type="text/javascript">
        var translationData = <?php echo $jsLanguageData; ?>;
        var detectedLanguage = <?php echo "'" . $language . "'"; ?>;
        var logit = function(myString) {
            try {
                console.log(myString);
            } catch (e) {}
        };
        window.addEventListener('load', function(e) {

            window.applicationCache.addEventListener('error', handleCacheError, false);
            window.applicationCache.addEventListener('checking', handleCacheEvent, false);
            window.applicationCache.addEventListener('cached', handleCacheEvent, false);
            window.applicationCache.addEventListener('downloading', handleCacheEvent, false);
            window.applicationCache.addEventListener('noupdate', handleCacheEvent, false);
            window.applicationCache.addEventListener('obsolete', handleCacheEvent, false);
            window.applicationCache.addEventListener('progress', handleCacheEvent, false);
            window.applicationCache.addEventListener('updateready', handleCacheEvent, false);
        }, false);
        var handleCacheError = function(e) {

        };
        var handleCacheEvent = function(e) {

            switch (e.type) {
                case 'noupdate':
                    break;
                case 'downloading':
                    break;
                case 'checking':
                    break;
                case 'progress':
                    break;
                case 'updateready':
                    try {
                        window.applicationCache.swapCache();
                    } catch (e) {}
                    window.location.reload();
                    break;
                default:
                    break;
            }
        };
        var showCacheIsUpdating = function() {
            var bodyHeight = $(window).height();
            var bodyWidth = $(window).width();
            var updatingDiv = '<div id="application-updating" style="position: absolute; left: 0px; top: 0px;' +
                ' width: ' + bodyWidth + 'px; height: ' + bodyHeight + 'px; background: #fff; opacity: 0.85;' +
                ' background-image: url(\'../images/chat_loading.gif\'); background-repeat: no-repeat;' +
                ' background-position: center;"></div>';

            $('body').append(updatingDiv);
        };
        var hideCacheIsUpdating = function() {
            $('#application-updating').remove();
        };
    </script>
</head>

<body>
    <div style="position:absolute;left:0;bottom:0;overflow:hidden;"><i class="fa fa-cloud bg_icon" id="bg_icon_lb"></i></div>
    <div style="position:absolute;right:0;top:0;overflow:hidden;"><i class="fa fa-cloud bg_icon" style="font-size:30vw;margin:-5vw -5vw 0 0;" id="bg_icon_tr"></i></div>
    <noscript>
        <div id="no-js-warning" style="display: block;">
            <div style="margin-top: 69px; padding:42px; background: url('img/logo.png'); background-position: center; background-repeat: no-repeat;"></div>
            <p style="padding: 0px 20px; font-size: 1.5em;">
                Your browser seems to have Javascript disabled.<br />
                Since Javascript is needed for this application, you have to enable Javascript in your browser settings and reload this page.
            </p>
        </div>
    </noscript>
    <div id="no-storage-warning" style="display: none;">
        <h1>No Cookies/local Storage available</h1>
    </div>
    <div id="headline"></div>
    <div id="login-container">
        <div id="login-form"></div>
    </div>
    <div id="login-copyright-link"></div>
    <form id="data-submit-form" method="post" data-ajax="false">
    </form>
</body>

</html>