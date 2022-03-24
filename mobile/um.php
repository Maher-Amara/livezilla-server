<?php

/****************************************************************************************
 * LiveZilla um.php
 *
 * Copyright 2018 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/

require './php/common/functions.php';

function lzmBase64UrlDecode($str)
{
    $str = str_replace('_', '=', $str);
    $str = str_replace('-', '+', $str);
    $str = str_replace(',', '/', $str);
    $str = base64_decode($str);

    return $str;
}

function lzmGetCleanRequestParam($param)
{
    if (preg_match('/^[a-zA-Z0-9_,-]*$/', $param) == 1) {
        return htmlentities($param, ENT_QUOTES, 'UTF-8');
    } else {
        return '';
    }
}

$language = (!empty($_GET['lang'])) ? $_GET['lang'] : 'ZW4_';

define("LIVEZILLA_PATH", "./../");
require "./../language.php";
$jsLanguageData = getLanguageJS(lzmBase64UrlDecode($language));
$acid = "?acid=" . time();
?>
<!DOCTYPE HTML>
<html manifest="lzm.appcache">

<head>
    <title>
        LiveZilla
    </title>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">

    <link rel="stylesheet" type="text/css" href="../fonts/font-awesome.min.css" />
    <link rel="stylesheet" type="text/css" href="./css/livezilla6.css<?php echo $acid ?>" />
    <link rel="stylesheet" type="text/css" href="./css/livezilla6TemplateAndServer.css<?php echo $acid ?>" />
    <link rel="shortcut icon" href="../images/favicon.ico" type="image/x-icon">

    <script type="text/javascript" src="./js/jquery-3.4.1.min.js"></script>
    <script type="text/javascript" src="./js/jquery-migrate-1.2.1.min.js"></script>
    <script type="text/javascript" src="./js/jquery-migrate-3.1.0.min.js"></script>
    <script type="text/javascript" src="./js/jsglobal.js"></script>
    <script type="text/javascript" src="./js/md5.js"></script>
    <script type="text/javascript" src="./js/sha1.js"></script>
    <script type="text/javascript" src="./js/sha256.js"></script>
    <script type="text/javascript" src="./js/lzm/classes/CommonConfigClass.js<?php echo $acid ?>"></script>
    <script type="text/javascript" src="./js/lzm/classes/CommonInputControlsClass.js<?php echo $acid ?>"></script>
    <script type="text/javascript" src="./js/lzm/classes/CommonTranslationClass.js<?php echo $acid ?>"></script>
    <script type="text/javascript" src="./js/lzm/classes/CommonToolsClass.js<?php echo $acid ?>"></script>
    <script type="text/javascript" src="./js/lzm/classes/CommonPermissionClass.js<?php echo $acid ?>"></script>
    <script type="text/javascript" src="./js/lzm/classes/CommonServerEvaluationClass.js<?php echo $acid ?>"></script>
    <script type="text/javascript" src="./js/lzm/classes/CommonDialogClass.js<?php echo $acid ?>"></script>
    <script type="text/javascript" src="./js/lzm/classes/AdminDisplayLayoutClass.js<?php echo $acid ?>"></script>
    <script type="text/javascript" src="./js/lzm/classes/AdminUserManagementClass.js<?php echo $acid ?>"></script>
    <script type="text/javascript" src="./js/lzm/classes/AdminPollServerClass.js<?php echo $acid ?>"></script>
    <script type="text/javascript" src="./js/lzm/classes/ChatObjectClasses.js<?php echo $acid ?>"></script>
    <script type="text/javascript" src="./js/lzm/admin.js<?php echo $acid ?>"></script>

    <script type="text/javascript">
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

        var handleCacheError = function(e) {};
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
                    } catch (e) {

                    }
                    window.location.reload();
                    break;
                default:
                    break;
            }
        };
        var logit = function(logString) {
            try {
                console.log(logString);
            } catch (ex) {}
        }
    </script>

    <script type="text/javascript">
        var translationData = <?php echo $jsLanguageData; ?>;
        var language = lz_global_base64_url_decode(<?php echo "'" . lzmGetCleanRequestParam($language) . "'"; ?>);
        $(document).ready(function() {
            <?php
            if (!empty($_GET['type']) && $_GET['type'] == 'user_management') {
                echo "loadUserManagement();\r\n";
            }
            ?>
        });
    </script>

</head>

<body>

    <?php
    $adminTypes = array('user_management');
    if (!empty($_GET['acid']) && !empty($_GET['type']) && in_array($_GET['type'], $adminTypes)) {
        $pageContent = readHtmlTemplate('adminuser.tpl', false, false);
    }
    echo $pageContent;
    ?>

</body>

</html>