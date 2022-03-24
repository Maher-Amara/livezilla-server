<?php
/****************************************************************************************
 * LiveZilla functions.php
 *
 * Copyright 2013 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/


require '../_lib/trdp/mobde.php';

function getMobileInformation() {
    $detect = new Mobile_Detect();

    $isMobile = "false";
    $isTablet = "false";
    $mobileOS = '';
    $mobileVersion = '';
    $versionIsSufficient = false;
    if ($detect->isMobile()) {
        $isMobile = "true";
        if ($detect->isTablet()) {
            $isTablet = "true";
        }
        if ($detect->isiOs()) {
            $mobileOS = 'iOS';
            $mobileVersion = $detect->version('iOS');
            $versionArray = explode('_', $mobileVersion);
            if ($versionArray[0] >= 6) {
                $versionIsSufficient = true;
            }
        } elseif ($detect->isAndroidOS()) {
            $mobileOS = 'Android';
            $mobileVersion = $detect->version('Android');
            $versionArray = explode('.', $mobileVersion);
            if ($versionArray[0] >= 4 && $versionArray[1] >= 1) {
                $versionIsSufficient = true;
            }
        } elseif($detect->isWindowsPhoneOS()) {
            $mobileOS = 'WindowsPhoneOS';
            $mobileVersion = $detect->version('WindowsPhoneOS');
        } else {
            $mobileOS = 'Other mobile OS';
            $mobileVersion = 'NONE';
        }
    }
    return Array('isMobile' => $isMobile, 'isTablet' => $isTablet, 'mobileOS' => $mobileOS, 'mobileVersion' => $mobileVersion, 'mobileIsSufficient' => $versionIsSufficient);
}

function readHtmlTemplate($fileName, $isMessageTemplate = true, $isLangFileTemplate = false) {
    $fileContents = file_get_contents('./templates/'.$fileName);
    if ($isMessageTemplate) {
        $fileContents = str_replace(
            array('./images/',"\n","\r","\t","margin-top:6px;", 'cellpadding="4"'),
            array('./img/','','','','margin-top:2px;', 'style="margin-left: 14px"'),
            $fileContents
        );
    } else if ($isLangFileTemplate) {
        $fileContents = str_replace("\r\n", "\n", $fileContents);
        $fileContents = str_replace("\r", "\n", $fileContents);
        $fileContents = str_replace("\n", "%%LINE_BREAK%%", $fileContents);
    }
    return $fileContents;
}

?>
