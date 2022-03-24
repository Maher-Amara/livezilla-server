<?php
/****************************************************************************************
* LiveZilla server.php
* 
* Copyright 2018 LiveZilla GmbH
* All rights reserved.
* LiveZilla is a registered trademark.
* 
* Improper changes to this file may cause critical errors.
***************************************************************************************/

define("IN_LIVEZILLA",true);
define("LIVEZILLA_PATH","./");

@error_reporting(E_ALL);

require(LIVEZILLA_PATH . "_definitions/definitions.inc.php");
require(LIVEZILLA_PATH . "_definitions/definitions.protocol.inc.php");
require(LIVEZILLA_PATH . "_lib/functions.global.inc.php");
require(LIVEZILLA_PATH . "_lib/objects.devices.inc.php");

define("ACCESSTIME",SystemTime::GetRuntime());

if(Server::IsServerSetup())
    CacheManager::Flush();

Operator::PrepareConnection();

require(LIVEZILLA_PATH . "_definitions/definitions.dynamic.inc.php");
Server::InitDataProvider();
Server::DefineURL("server.php");

if(isset(Server::$Configuration->File["timeout_clients"]))
    Server::SetTimeLimit(Server::$Configuration->File["timeout_clients"]);

@ini_set('session.use_cookies', '0');
if(DEBUG_MODE)
    @ini_set('display_errors', '1');

@set_error_handler("handleError");

header("Access-Control-Allow-Origin: *");

$getRequest = Communication::GetParameterAlias("rqst");

if(isset($_POST[POST_INTERN_REQUEST]) || !empty($getRequest))
{
	if(DBManager::$Connected && STATS_ACTIVE)
		Server::InitStatisticProvider();

	if(DBManager::$Connected && $getRequest == CALLER_TYPE_TRACK)
	{
		define("CALLER_TYPE",CALLER_TYPE_TRACK);
        define("CALLER_TIMEOUT", Server::$Configuration->File["timeout_track"]);
		header("Content-Type: text/javascript; charset=UTF-8");
		header("Cache-Control: no-cache, must-revalidate");
		require(LIVEZILLA_PATH . "track.php");
		$response = VisitorMonitoring::$Response;
	}
	else if(DBManager::$Connected && isset($_POST[POST_INTERN_REQUEST]) && $_POST[POST_INTERN_REQUEST]==CALLER_TYPE_EXTERNAL)
	{
		define("CALLER_TYPE",CALLER_TYPE_EXTERNAL);
        define("CALLER_TIMEOUT", Server::$Configuration->File["timeout_chats"]);
		header("Content-Type: text/xml; charset=UTF-8");
		require(LIVEZILLA_PATH . "extern.php");
		$response = utf8_encode("<?xml version=\"1.0\" encoding=\"UTF-8\" ?><livezilla_js>" . base64_encode(((isset($EXTERNSCRIPT)) ? $EXTERNSCRIPT : "")) . "</livezilla_js>");
	}
	else if(isset($_POST[POST_INTERN_REQUEST]) && $_POST[POST_INTERN_REQUEST]==CALLER_TYPE_INTERNAL)
	{
		define("CALLER_TYPE",CALLER_TYPE_INTERNAL);
        if(DBManager::$Connected)
            define("CALLER_TIMEOUT", Server::$Configuration->File["timeout_clients"]);

		header("Connection: close");
		header("Cache-Control: no-cache, must-revalidate");
		require(LIVEZILLA_PATH . "intern.php");

        if(!empty($response))
            header("Content-Type: text/xml; charset=UTF-8");
        else
            header("Content-Type: text/html; charset=UTF-8");

        $response = utf8_encode($response);
	}
    else if($getRequest == CALLER_TYPE_VISION)
    {
        exit(Server::GetVisionData());
    }

    if(DBManager::$Connected && Is::Defined("CALLER_TYPE") && !Server::IsServerSetup() && !Is::Defined("LOGIN"))
        Server::RunCronJobs(false);
}

if(!isset($response))
	exit(IOStruct::GetFile(TEMPLATE_HTML_SUPPORT));

Communication::SendPushMessages();

if(file_exists("_lib/tests.inc.php"))
{
    //require("_lib/tests.inc.php");
    //Tests::CreateRandomVisitors(1,true,1);
    //Tests::RandomizeOperatorStatus(10);
    //Tests::AddChatArchiveEntries(1);
}

Server::UnloadDataProvider();

exit(trim($response));
?>