<?php
/****************************************************************************************
 * LiveZilla resource.php
 *
 * Copyright 2018 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 * Improper changes to this file may cause critical errors.
 ***************************************************************************************/

$ftype = (true) ? "min." : "";
$paramIndex = 1;
$code = "";
$version = "ahgzixd7";

while(isset($_REQUEST[$paramIndex]))
{
    if(strtolower($_REQUEST[$paramIndex])=="style.min.css")
        $code .= file_get_contents("./templates/style.".$ftype."css");
    else if(strtolower($_REQUEST[$paramIndex])=="chat_".$version."/style.min.css")
    {
        $code .= file_get_contents("./templates/overlays/chat_".$version."/style.".$ftype."css");
    }
    else if(strtolower($_REQUEST[$paramIndex])=="jsglobal.min.js")
    {
        $code .= file_get_contents("./templates/".$version."/jsglobal.".$ftype."js");
        $code .= file_get_contents("./templates/".$version."/icons.".$ftype."js");
    }
    else if(strtolower($_REQUEST[$paramIndex])=="jsbox.min.js")
    {
        $code .= file_get_contents("./templates/".$version."/jsbox.".$ftype."js");
        $code .= file_get_contents("./templates/".$version."/jsboxv2.".$ftype."js");
    }
    else if(strtolower($_REQUEST[$paramIndex])=="jstrack.min.js")
        $code .= file_get_contents("./templates/".$version."/jstrack.".$ftype."js");
    else if(strtolower($_REQUEST[$paramIndex])=="jsextern.min.js")
        $code .= file_get_contents("./templates/overlays/chat_".$version."/jsextern.".$ftype."js");

    $paramIndex++;
}
if($_REQUEST["t"]=="css")
    header("Content-Type: text/css");
else
    header("Content-Type: application/javascript");

$expires = 60*60*24*365;

header("Pragma: public");
header("Cache-Control: maxage=".$expires);
header('Expires: ' . gmdate('D, d M Y H:i:s', time()+$expires) . ' GMT');
exit($code);
?>