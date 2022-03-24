<?php
/****************************************************************************************
 * LiveZilla log.php
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

require(LIVEZILLA_PATH . "_definitions/definitions.inc.php");
require(LIVEZILLA_PATH . "_lib/functions.global.inc.php");
require(LIVEZILLA_PATH . "_definitions/definitions.dynamic.inc.php");
require(LIVEZILLA_PATH . "_definitions/definitions.protocol.inc.php");

@set_error_handler("handleError");
$content = "";
if(Server::InitDataProvider())
{
    Server::DefineURL("log.php");
    if(isset($_GET["t"]) && isset($_GET["v"]))
    {
        Server::InitDataBlock(array("INTERNAL"));
        if(Operator::ValidateToken($_GET["v"]))
        {
            if(isset($_GET["d"]))
            {
                if($_GET["t"]=="php" && file_exists(FILE_ERROR_LOG))
                    unlink(FILE_ERROR_LOG);
                if($_GET["t"]=="sql" && file_exists(FILE_SQL_ERROR_LOG))
                    unlink(FILE_SQL_ERROR_LOG);
                if($_GET["t"]=="email" && file_exists(FILE_EMAIL_LOG))
                    unlink(FILE_EMAIL_LOG);
                if($_GET["t"]=="debug" && file_exists(FILE_GENERAL_LOG))
                    unlink(FILE_GENERAL_LOG);
                if($_GET["t"]=="ldap" && file_exists(FILE_LDAP_LOG))
                    unlink(FILE_LDAP_LOG);
            }
            else{
                if($_GET["t"]=="php")
                    $content = IOStruct::GetFile(FILE_ERROR_LOG);
                if($_GET["t"]=="sql")
                    $content = IOStruct::GetFile(FILE_SQL_ERROR_LOG);
                if($_GET["t"]=="email")
                    $content = IOStruct::GetFile(FILE_EMAIL_LOG);
                if($_GET["t"]=="debug")
                    $content = IOStruct::GetFile(FILE_GENERAL_LOG);
                if($_GET["t"]=="ldap")
                    $content = IOStruct::GetFile(FILE_LDAP_LOG);
            }
        }
    }
}
exit($content);
?>