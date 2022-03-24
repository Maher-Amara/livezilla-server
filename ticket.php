<?php
/****************************************************************************************
 * LiveZilla ticket.php
 *
 * Copyright 2018 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 * Improper changes to this file may cause critical errors.
 ***************************************************************************************/

define("IN_LIVEZILLA",true);
header('Content-Type: text/html; charset=utf-8');
if(!defined("LIVEZILLA_PATH"))
    define("LIVEZILLA_PATH","./");

require(LIVEZILLA_PATH . "_definitions/definitions.inc.php");
require(LIVEZILLA_PATH . "_lib/functions.global.inc.php");
require(LIVEZILLA_PATH . "_definitions/definitions.dynamic.inc.php");
require(LIVEZILLA_PATH . "_definitions/definitions.protocol.inc.php");

@set_error_handler("handleError");
$html = $thtml = "";
if(isset($_GET["id"]) && isset($_GET["hash"]) && is_numeric($_GET["id"]) && isset($_GET["salt"]) && Server::InitDataProvider())
{
    $subject = "";
    $ticket = new Ticket();
    $ticket->Id = $_GET["id"];
    $ticket->Load(true,true);
    $ticket->Messages = array_reverse($ticket->Messages);
    $email = "";

    if($ticket->GetHash() == $_GET["hash"] && !empty($_GET["hash"]))
    {
        if($ticket->Salt == $_GET["salt"] && !empty($_GET["salt"]))
        {
            $status = 0;

            if($ticket->Editor != null)
                $status = $ticket->Editor->Status;

            $html = IOStruct::GetFile(PATH_TEMPLATES . "ticket.tpl");
            Server::InitDataBlock(array("INTERNAL","GROUPS"));
            LocalizationManager::AutoLoad();

            $count = count($ticket->Messages);
            foreach($ticket->Messages as $message)
            {
                $senderName = $message->Fullname;

                if(empty($senderName) && !empty($message->SenderUserId) && isset(Server::$Operators[$message->SenderUserId]))
                    $senderName = Server::$Operators[$message->SenderUserId]->Fullname;

                $text = htmlentities($message->Text,ENT_QUOTES,"UTF-8");
                $text = preg_replace('/(?:(?:\r\n|\r|\n)\s*){2}/s', "<br><br>", trim($text));

                $ftext = "";
                $issig = false;
                $text = explode("<br><br>",$text);
                foreach($text as $line)
                {
                    if(!$issig && strpos($line,"--") !== false)
                    {
                        $issig = true;
                        $ftext .= "<br><i>";
                    }

                    if(trim($line) == "&gt;" || trim($line) == "")
                        continue;

                    if($issig || strpos($line,"&gt;")===0)
                    {
                        $ftext .= "<br>" . $line;
                    }
                    else
                        $ftext .= "<br><br>" . $line;
                }

                if($issig)
                    $ftext .= "</i>";

                if(is_array($message->Attachments) && count($message->Attachments) > 0)
                {
                    $ftext .= "<br><br>";
                    foreach($message->Attachments as $key => $att)
                    {
                        $ftext .= "<div class=\"enum_attachment\"><a target=\"_blank\" href=\"./getfile.php?file=".urlencode($att)."&id=".urlencode($key)."\">" . htmlentities($att,ENT_QUOTES,"UTF-8") . "</a></div>";
                    }
                }

                $thtml .= "<div class=\"number\">#".$count--."</div><div class=\"text_message\"><div class=\"text_date\">".$message->Created."</div><b>" . htmlentities($senderName,ENT_QUOTES,"UTF-8") . "</b>" . $ftext ."</div>";
                $subject = $message->Subject;
            }

            $group = Server::$Groups[$ticket->Group];

            if(!empty($group->TicketEmailOut))
            {
                $mb = Mailbox::GetById($group->TicketEmailOut);
                $email = $mb->Email;
            }

            if(empty($email))
                $html = str_replace("<br><!--lang_index_ticket_reply-->","",$html);

            $html = str_replace("<!--close_button_style-->",$status == 0 || $status == 2 || $status == 3 ? "display:none;" : "",$html);
            $html = str_replace("<!--id-->",$_GET["id"],$html);
            $html = str_replace("<!--tid-->",Encoding::Base64UrlEncode($_GET["id"]),$html);
            $html = str_replace("<!--subject-->",htmlentities($subject,ENT_QUOTES,"UTF-8"),$html);
            $html = str_replace("<!--tickets-->",$thtml,$html);
            $html = str_replace("<!--status-->",$status,$html);
            $html = str_replace("<!--salt-->",$ticket->Salt,$html);
            $html = str_replace("<!--logo-->","<img src=\"". Server::$Configuration->File["gl_cali"]."\" border=\"0\">",$html);
            $html = Server::Replace($html);
            $html = str_replace("<!--src-->",Server::$Configuration->File["gl_cpar"],$html);
            $html = str_replace("<!--em_address-->","<a href=\"mailto:".$email."?subject=".$ticket->GetHash(true)."\">" . $email . "</a>",$html);
            $html = str_replace("<!--em_subject-->","<a href=\"mailto:".$email."?subject=".$ticket->GetHash(true)."\">" . $ticket->GetHash(true) . "</a>",$html);
        }
    }
    exit($html);
}
?>