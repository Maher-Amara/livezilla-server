<?php
/****************************************************************************************
 * LiveZilla email.php
 *
 * Copyright 2017 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 * Improper changes to this file may cause critical errors.
 ***************************************************************************************/

define("IN_LIVEZILLA",true);
header('Content-Type: text/html; charset=utf-8');
if(!defined("LIVEZILLA_PATH"))
    define("LIVEZILLA_PATH","./");

if(!isset($_GET["no_sec"]))
{
    //header('X-Frame-Options: SAMEORIGIN');
    header("Content-Security-Policy: default-src 'self'; script-src 'self';");
    header("X-Content-Security-Policy: default-src 'self'; script-src 'self';");
}

require(LIVEZILLA_PATH . "_definitions/definitions.inc.php");
require(LIVEZILLA_PATH . "_lib/functions.global.inc.php");
require(LIVEZILLA_PATH . "_definitions/definitions.dynamic.inc.php");
require(LIVEZILLA_PATH . "_definitions/definitions.protocol.inc.php");

@set_error_handler("handleError");
if(isset($_GET["id"]) && Server::InitDataProvider())
{
    Server::InitDataBlock(array("INTERNAL"));
    if(Operator::IPValidate())
    {
        if(empty(Server::$Configuration->File["gl_avhe"]))
            exit("HTML content is currently not being saved for security reasons. Please check your LiveZilla configuration:<br><br>LiveZilla Client -> Server Configuration -> Emails");

        $c=null;

        $html = TicketEmail::GetHTML(Communication::GetParameter("id","",$c,null,null));

        if(empty($html))
            $html = TicketMessage::GetHTML(Communication::GetParameter("id","",$c,null,null));

        if(!empty($html))
        {
            if(isset($_GET["no_sec"]))
                $html = str_replace("<!--secure_file-->","getfile.php",$html);

            $html = str_replace("<a ","<a target=\"_blank\" ",$html);
            $html = str_replace("</html>","",$html);
            $html .= "<script></script></html>";
            $html = "<!DOCTYPE html><html><head><link rel=\"stylesheet\" type=\"text/css\" href=\"./mobile/css/livezilla6.css\"/></head><body style=\"padding:10px;font-size:14px;background:#fff;\">".$html."</body></html>";

            exit($html);
        }
        exit("Sorry, email/message does not exist or no HTML content was found.");
    }
    else
        exit("Invalid IP".Communication::GetIP(true));
}
?>