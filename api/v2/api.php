<?php
/****************************************************************************************
*
* API version 2.0
*
* Copyright 2018 LiveZilla GmbH
* All rights reserved.
* LiveZilla is a registered trademark.
* 
***************************************************************************************/

define("IN_LIVEZILLA",true);
define("IN_API",true);
define("LIVEZILLA_PATH","../../");

@set_time_limit(30);

require(LIVEZILLA_PATH . "_definitions/definitions.inc.php");
require(LIVEZILLA_PATH . "_lib/functions.global.inc.php");
require(LIVEZILLA_PATH . "_definitions/definitions.dynamic.inc.php");
require(LIVEZILLA_PATH . "_definitions/definitions.protocol.inc.php");
require(LIVEZILLA_PATH . "_lib/objects.internal.inc.php");

@set_error_handler("handleError");
@error_reporting(E_ALL);

header("Pragma: no-cache");
header("Cache-Control: no-cache, must-revalidate");
header("Keep-Alive: timeout=5, max=100");

Server::InitDataProvider();
Server::DefineURL("api.php");
Server::InitDataBlock(array("INTERNAL","INPUTS","DBCONFIG"));
OperatorRequest::Validate(true);

if(OperatorRequest::IsValidated() && Is::Defined("CALLER_SYSTEM_ID"))
{
    if(Server::$Operators[CALLER_SYSTEM_ID]->GetPermission(46,PERMISSION_NONE) != PERMISSION_NONE)
    {
        if(!defined("CALLER_TIMEOUT"))
            define("CALLER_TIMEOUT", 30);

        require("objects.apiv2.inc.php");
        $apiv2 = new ApiV2(isset($_POST["p_json_pretty"]));
        if($apiv2->RunActions() && empty($apiv2->ErrorField) && !empty($apiv2->JSONOutput))
        {
            CacheManager::Flush();
            exit($apiv2->JSONOutput);
        }
        else
        {
			APIErrorExit("LZAV20003: " . $apiv2->GetErrorCodes());
        }
    }
	else
	{
		APIErrorExit("LZAV20002: No API access permission or invalid authentication.");
	}
}
else
	APIErrorExit("LZAV20001: No API access permission or invalid authentication.");
	
APIErrorExit("LZAV20000");
function APIErrorExit($_code)
{
	if(defined("AUTH_RESULT"))
		$_code .= ";".AUTH_RESULT;
	header("HTTP/1.1 403 Forbidden");
	exit("HTTP/1.1 403 Forbidden (Error:".$_code.")");
}
?>