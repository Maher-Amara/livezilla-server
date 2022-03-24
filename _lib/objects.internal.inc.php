<?php
/****************************************************************************************
* LiveZilla objects.internal.inc.php
* 
* Copyright 2018 LiveZilla GmbH
* All rights reserved.
* LiveZilla is a registered trademark.
* 
* Improper changes to this file may cause critical errors.
***************************************************************************************/ 

if(!defined("IN_LIVEZILLA"))
	die();

class OperatorRequest
{
    static function Validate($_basic=false)
    {
        if(!empty(Server::$Configuration->File["gl_rhts"]) && Communication::GetScheme() != SCHEME_HTTP_SECURE)
        {
            define("AUTH_RESULT",LOGIN_REPLY_HTTPS);
        }
        else if(DBManager::$Connected || Server::IsServerSetup())
        {
            if(!empty($_POST[POST_INTERN_AUTHENTICATION_USER]))
            {
                foreach(Server::$Operators as $sysId => $operator)
                {
                    if(strtolower($operator->UserId) == strtolower($_POST[POST_INTERN_AUTHENTICATION_USER]))
                    {
                        if(!$operator->IsBot && $operator->ValidateLoginAttempt())
                        {
                            if(!empty(CacheManager::$ActiveManager))
                                $operator->LoadUnCacheables();


                            if($operator->ValidateLoginAuthentication())
                            {

                                define("CALLER_SYSTEM_ID",$sysId);
                                if($_basic)
                                {
                                    define("VALIDATED",true);
                                    return;
                                }

                                if(!empty($_POST[POST_INTERN_AUTHENTICATION_CLIENT_SYSTEM_ID]))
                                {
                                    if(empty($_POST["p_db_no_req"]) && !DBManager::$Connected)
                                    {
                                        define("AUTH_RESULT",LOGIN_REPLY_DB);
                                        break;
                                    }

                                    if(!LOGIN && !Server::IsServerSetup())
                                    {
                                        if($operator->Deactivated)
                                        {
                                            define("AUTH_RESULT",LOGIN_REPLY_ACCOUNT_DEACTIVATED);
                                            break;
                                        }
                                        if(!$operator->ClientWeb && $operator->LastActive < (time()-Server::$Configuration->File["timeout_clients"]) && $_POST[POST_INTERN_AUTHENTICATION_CLIENT_SYSTEM_ID] == $operator->ClientSystemId)
                                        {
                                            define("AUTH_RESULT",LOGIN_REPLY_SESSION_TIMEOUT);
                                            break;
                                        }
                                        if(!empty($operator->ClientSystemId) && !empty($_POST[POST_INTERN_AUTHENTICATION_CLIENT_SYSTEM_ID]) && $_POST[POST_INTERN_AUTHENTICATION_CLIENT_SYSTEM_ID] != $operator->ClientSystemId)
                                        {

                                            define("AUTH_RESULT",LOGIN_REPLY_BAD_COMBINATION);
                                            break;
                                        }
                                    }
                                    else if(LOGIN && !Server::IsServerSetup())
                                    {
                                        if(!empty(Server::$Configuration->File["gl_deac"]) && $operator->GetPermission(PERMISSION_SERVER_CONFIGURATION,PERMISSION_NONE) == PERMISSION_NONE)
                                        {
                                            define("AUTH_RESULT",LOGIN_REPLY_DEACTIVATED);
                                            break;
                                        }
                                        else if($operator->Deactivated)
                                        {
                                            define("AUTH_RESULT",LOGIN_REPLY_ACCOUNT_DEACTIVATED);
                                            break;
                                        }
                                        else if(empty($_POST[POST_INTERN_IGNORE_SIGNED_ON]) && $operator->LastActive > (time()-Server::$Configuration->File["timeout_clients"]) && !empty($operator->ClientSystemId) && $_POST[POST_INTERN_AUTHENTICATION_CLIENT_SYSTEM_ID] != $operator->ClientSystemId)
                                        {
                                            define("AUTH_RESULT",LOGIN_REPLY_ALREADY_ONLINE);
                                            break;
                                        }
                                    }
                                    else if(Server::IsServerSetup() && $operator->GetPermission(PERMISSION_SERVER_CONFIGURATION,PERMISSION_NONE) == PERMISSION_NONE)
                                    {
                                        define("AUTH_RESULT",LOGIN_REPLY_NOADMIN);
                                        break;
                                    }

                                    define("VALIDATED",true);

                                    if(isset($_POST[POST_INTERN_NEW_PASSWORD]))
                                    {
                                        $operator->ChangePassword($_POST[POST_INTERN_NEW_PASSWORD]);
                                        Server::$Response->Authentications = "<val userid=\"".base64_encode(CALLER_SYSTEM_ID)."\" />\r\n";
                                    }

                                    if(Is::Defined("VALIDATED_FULL_LOGIN") && Is::Defined("LOGIN") && !Server::IsServerSetup())
                                    {
                                        $operator->ValidateUpdateSession(getId(32), $_POST[POST_INTERN_AUTHENTICATION_CLIENT_SYSTEM_ID]);
                                    }
                                    else if(LOGOFF)
                                    {
                                        $operator->ValidateUpdateSession("", "");
                                    }

                                    define("AUTH_RESULT",LOGIN_REPLY_SUCCEEDED);
                                    break;
                                }
                            }
                            else
                            {
                                $operator->DeleteLoginAttempts();
                                $operator->SignOff(false);

                                if(!empty($_POST[POST_INTERN_AUTHENTICATION_PASSWORD]))
                                    $operator->SaveLoginAttempt(md5($_POST[POST_INTERN_AUTHENTICATION_PASSWORD]));

                                break;
                            }
                        }
                    }
                }
            }
        }
        else
            define("AUTH_RESULT",LOGIN_REPLY_DB);

        if(OperatorRequest::IsValidated() && LOGIN)
        {
            Server::$Operators[CALLER_SYSTEM_ID]->IP = Communication::GetIP();
            Server::$Operators[CALLER_SYSTEM_ID]->FirstActive = time();
            $isex = !empty(Server::$Operators[CALLER_SYSTEM_ID]->Groups) && Server::$Groups[Server::$Operators[CALLER_SYSTEM_ID]->Groups[0]]->IsExternal;
            Server::$Response->Login = Server::$Operators[CALLER_SYSTEM_ID]->GetLoginReply($isex);
        }
        if(!defined("AUTH_RESULT"))
        {

            define("AUTH_RESULT",LOGIN_REPLY_BAD_COMBINATION);
        }
    }

    static function GetConfig($xml="")
    {
        global $_CONFIG;

        $skeys = array("gl_db_user","gl_db_pass");
        $fkeys = array("gl_lzid","gl_pr_cr","gl_db_host","gl_db_user","gl_db_ext","gl_db_eng","gl_db_pass","gl_db_name","gl_db_prefix");
        $hashfile = FILE_CONFIG;
        $cindex = 0;

        foreach($_CONFIG as $index => $server_val)
        {
            if(is_array($server_val))
            {
                $xml .= "<conf key=\"".base64_encode($index)."\">\r\n";
                foreach($server_val as $skey => $sval)
                {
                    if(!is_array($sval))
                    {
                        if(!in_array($skey,$skeys) || is_numeric($skey))
                        {
                            if(isset($_CONFIG['b64']) && $_CONFIG['b64'] === false)
                                $xml .= "<sub key=\"".base64_encode($skey)."\">".base64_encode($sval)."</sub>\r\n";
                            else
                                $xml .= "<sub key=\"".base64_encode($skey)."\">".$sval."</sub>\r\n";
                        }
                        else
                        {
                            $xml .= "<sub key=\"".base64_encode($skey)."\"></sub>\r\n";
                        }
                    }
                }
                $xml .= "</conf>\r\n";
            }
            else if(!(is_int($index) && is_array($server_val)))
            {
                $xml .= "<conf value=\"".base64_encode($server_val)."\" key=\"".base64_encode($index)."\" />\r\n";
            }
        }

        $sxml = "";
        foreach($_CONFIG as $index => $server_val)
        {
            if(is_int($index) && is_array($server_val))
            {
                $sxml .= "<site index=\"".base64_encode($cindex)."\">\r\n";
                foreach($server_val as $key => $site_val)
                {
                    if(is_array($site_val))
                    {
                        $sxml .= "<conf key=\"".base64_encode($key)."\">\r\n";
                        foreach($site_val as $skey => $sval)
                            $sxml .= "<sub key=\"".base64_encode($skey)."\">".($sval)."</sub>\r\n";
                        $sxml .= "</conf>\r\n";
                    }
                    else if(!in_array($key,$skeys) || Server::IsServerSetup())
                        $sxml .= "<conf value=\"". (in_array($key,$fkeys) ? base64_encode($site_val) : $site_val)."\" key=\"".base64_encode($key)."\" />\r\n";
                    else
                        $sxml .= "<conf value=\"".base64_encode("")."\" key=\"".base64_encode($key)."\" />\r\n";
                }
                $cindex++;
                $sxml .= "<db_conf>\r\n";
                if(!empty(Server::$Configuration->Database["cct"]))
                {
                    $sxml .= "<cct>\r\n";
                    foreach(Server::$Configuration->Database["cct"] as $cct)
                        $sxml .= $cct->GetXML();
                    $sxml .= "</cct>\r\n";
                }
                if(!empty(Server::$Configuration->Database["ccpp"]))
                {
                    $sxml .= "<ccpp>\r\n";
                    foreach(Server::$Configuration->Database["ccpp"] as $ccpp)
                        $sxml .= $ccpp->GetXML();
                    $sxml .= "</ccpp>\r\n";
                }
                if(!empty(Server::$Configuration->Database["gl_email"]))
                {
                    $sxml .= "<gl_email>\r\n";
                    foreach(Server::$Configuration->Database["gl_email"] as $mb)
                        $sxml .= $mb->GetXML();
                    $sxml .= "</gl_email>\r\n";
                }
                if(!empty(Server::$Configuration->Database["gl_fb"]))
                {
                    $sxml .= "<gl_fbc>\r\n";
                    foreach(Server::$Configuration->Database["gl_fb"] as $fbc)
                        $sxml .= $fbc->GetXML();
                    $sxml .= "</gl_fbc>\r\n";
                }
                if(!empty(Server::$Configuration->Database["gl_go"]))
                {
                    $sxml .= "<gl_go>\r\n";
                    foreach(Server::$Configuration->Database["gl_go"] as $goal)
                        $sxml .= $goal->GetXML();
                    $sxml .= "</gl_go>\r\n";
                }
                if(!empty(Server::$Configuration->Database["gl_tsd"]))
                {
                    $sxml .= "<gl_tsd>\r\n";
                    foreach(Server::$Configuration->Database["gl_tsd"] as $tsd)
                        $sxml .= $tsd->GetXML();
                    $sxml .= "</gl_tsd>\r\n";
                }
                $sxml .= "</db_conf>\r\n";
                $sxml .= "</site>\r\n";
            }
        }

        $xml .= $sxml;
        $xml .= "<translations>\r\n";
        $files = IOStruct::ReadDirectory(PATH_LOCALIZATION,"index",true);
        foreach($files as $translation)
        {
            if(strpos($translation,".bak.")===false && strpos($translation,"lang")===false && Str::EndsWith($translation,".php"))
            {
                $parts = explode(".",$translation);
                if(count($parts)==3||count($parts)==4)
                {
                    $lang = $parts[0];
                    $client = $parts[1] == "client";
                    $my = $parts[2] == "my";


                    if(!$my && file_exists(PATH_LOCALIZATION . str_replace(".php",".my.php",$translation)))
                        continue;

                    $xml .= "<language m=\"".base64_encode($client?"1":"0")."\" key=\"".base64_encode($lang)."\" blocked=\"".base64_encode("0"). "\" />\r\n";
                }
            }
        }
        $xml .= "</translations>\r\n";
        $fu = IOStruct::ToBytes((!Is::Null(@ini_get("upload_max_filesize")))?ini_get("upload_max_filesize"):-1);
        $pu = IOStruct::ToBytes((!Is::Null(@ini_get("post_max_size")))?ini_get("post_max_size"):-1);
        $uu = /*Server::$Operators[CALLER_SYSTEM_ID]->Webspace!=0*/max($fu,$pu)/* : 0*/;
        $xml .= "<php_cfg_vars post_max_size=\"".base64_encode(min($fu,$uu,$pu))."\" upload_max_filesize=\"".base64_encode(min($fu,$uu,$pu))."\" />\r\n";
        $xml .= "</gl_c>\r\n";
        return "<gl_c h=\"".base64_encode(substr(IOStruct::HashMD5($hashfile),0,5))."\">\r\n" . $xml;
    }

    static function Listen()
    {
        OperatorRequest::Process();

        if(!Server::IsServerSetup() && !LOGIN && Server::$Operators[CALLER_SYSTEM_ID]->Status == USER_STATUS_OFFLINE)
            return;

        Server::$Response->XML = "<listen disabled=\"".base64_encode(((Server::IsAvailable(false)) ?  "0" : "1" ))."\" h=\"<!--gl_all-->\" ".((isset($_POST[POST_INTERN_XMLCLIP_HASH_EXECUTION_TIME])) ? "ex_time=\"<!--execution_time-->\"" : "").">\r\n";
        Server::$Response->Typing = "";
        if(Server::$Response->Login != null)
            Server::$Response->XML .= Server::$Response->Login;

        OperatorRequest::Build();

        processPosts();

        if(($hash = substr(md5(Server::$Response->Typing),0,5)) != @$_POST["p_gl_t"] && strlen(Server::$Response->Typing) > 0)
            Server::$Response->XML .= "<gl_typ h=\"".base64_encode($hash)."\">\r\n" . Server::$Response->Typing . "</gl_typ>\r\n";

        if(!empty(Server::$Response->Events))
            Server::$Response->XML .= Server::$Response->Events;

        if(($hash = substr(md5(Server::$Response->Exceptions),0,5)) != @$_POST["p_gl_e"] && strlen(Server::$Response->Exceptions) > 0)
            Server::$Response->XML .= "<gl_e h=\"".base64_encode($hash)."\">\r\n" . Server::$Response->Exceptions . "</gl_e>\r\n";

        if(!empty(Server::$Response->Internals))
            Server::$Response->XML .= "<int_r>" . Server::$Response->Internals . "</int_r>";

        if(($hash = substr(md5(Server::$Response->Groups),0,5)) != @$_POST["p_int_d"] && strlen(Server::$Response->Groups) > 0)
            Server::$Response->XML .= "<int_d h=\"".base64_encode($hash)."\">\r\n" . Server::$Response->Groups . "</int_d>\r\n";

        if(($hash = substr(md5(Server::$Response->InternalWebcamPictures),0,5)) != @$_POST["p_int_wp"])
            Server::$Response->XML .= "<int_wp h=\"".base64_encode($hash)."\">\r\n" . Server::$Response->InternalWebcamPictures . "</int_wp>\r\n";

        if(!empty(Server::$Response->Visitors))
            Server::$Response->XML .= "<v_users>\r\n" . Server::$Response->Visitors . "</v_users>\r\n";

        if(!empty(Server::$Response->VisitorBrowsers))
            Server::$Response->XML .= "<v_browsers>\r\n" . Server::$Response->VisitorBrowsers . "</v_browsers>\r\n";

        if(!empty(Server::$Response->VisitorBrowserURLs))
            Server::$Response->XML .= "<v_urls>\r\n" . Server::$Response->VisitorBrowserURLs . "</v_urls>\r\n";

        if(Server::$Response->Archive != null)
            Server::$Response->XML .= "<ext_c>\r\n" . Server::$Response->Archive . "</ext_c>\r\n";

        if(Server::$Response->Resources != null)
            Server::$Response->XML .= "<ext_res>\r\n" . Server::$Response->Resources . "</ext_res>\r\n";
        if(Server::$Response->Feedbacks != null)
            Server::$Response->XML .= "<ext_fb>\r\n" . Server::$Response->Feedbacks . "</ext_fb>\r\n";
        if(Server::$Response->Filters != null)
            Server::$Response->XML .= "<ext_b h=\"".base64_encode($hash)."\">\r\n" . Server::$Response->Filters . "</ext_b>\r\n";

        if(Server::$Response->Chats != null)
            Server::$Response->XML .= Server::$Response->Chats;

        if(!empty(Server::$Response->Reports))
            Server::$Response->XML .= Server::$Response->Reports;

        Server::$Response->XML .= Server::$Response->Messages . "\r\n";

        if(strlen(Server::$Response->Authentications) > 0)
            Server::$Response->XML .= "<gl_auths>\r\n" . Server::$Response->Authentications . "\r\n</gl_auths>\r\n";

        if(strlen(Server::$Response->Posts)>0)
            Server::$Response->XML .=  "<usr_p>\r\n" . Server::$Response->Posts . "</usr_p>\r\n";

        if(isset($_POST[POST_INTERN_ACCESSTEST]))
            Server::$Response->XML .= "<permission>" . base64_encode(OperatorRequest::GetPermissions()) . "</permission>";

        if(Server::IsServerSetup() || LOGIN || Server::$Operators[CALLER_SYSTEM_ID]->LastActive <= Server::$Configuration->File["gl_lcut"])
            Server::$Response->XML .= OperatorRequest::GetConfig();

        Server::$Response->XML .= "</listen>";
    }

    static function Process()
    {
        require(LIVEZILLA_PATH . "_lib/functions.internal.process.inc.php");
        processChatActions();
        processAuthentications();
        processStatus();
        processChatInvitation();
        processAutoReplies();
        processFilters();
        processTicketActions();
        processReceivedPosts();
        processCancelInvitation();
        processEvents();
        processGoals();
        processKBActions();

        if(Server::IsServerSetup() && Server::$Operators[CALLER_SYSTEM_ID]->GetPermission(PERMISSION_SERVER_CONFIGURATION,PERMISSION_NONE) == PERMISSION_FULL)
            processButtonIcons();
    }

    static function Build()
    {
        require_once(LIVEZILLA_PATH . "_lib/functions.internal.build.inc.php");
        Server::$Operators[CALLER_SYSTEM_ID]->GetExternalObjects();

        buildIntern();
        demandVisitors();
        demandVisitorBrowsers();
        demandVisitorBrowserURLs();
        demandObjectData();
        demandChats();
        demandEvents();
        buildActions();

        if(!Server::IsServerSetup())
        {
            if(!LOGIN)
            {
                buildNewPosts();
                buildResources();
                demandFeedback();
                demandFilters();
                demandTickets();
                demandEmails();
                demandChatArchive();
                demandReports();
            }
        }
    }

    static function IsValidated()
    {
        return (defined("VALIDATED") && defined("CALLER_SYSTEM_ID") && VALIDATED === true);
    }

    static function MaskData($_value,$_level)
    {
        $_value = utf8_decode($_value);
        $reserved=array("@",".",",","-","_"," ");
        if(!empty($_value))
            for($i=0;$i<strlen($_value);$i++)
                if(!in_array($_value[$i],$reserved))
                    if($_level==1)
                        $_value[$i]="*";
                    else if($_level==2 && $i%2==0)
                        $_value[$i]="*";
                    else if($_level==3 && $i<=(strlen($_value)/2))
                        $_value[$i]="*";
                    else if($_level==4 && $i>(strlen($_value)/2))
                        $_value[$i]="*";
        $_value = utf8_encode($_value);
        return $_value;
    }

    static function IPMatch($_ip, $_range)
    {
        if (strpos($_range, '/') !== false)
        {
            list($_range, $netmask) = explode('/', $_range, 2);
            if (strpos($netmask, '.') !== false)
            {
                $netmask = str_replace('*', '0', $netmask);
                $netmask_dec = ip2long($netmask);
                return ((ip2long($_ip) & $netmask_dec) == (ip2long($_range) & $netmask_dec));
            }
            else
            {
                $x = explode('.', $_range);
                while(count($x)<4) $x[] = '0';
                list($a,$b,$c,$d) = $x;
                $_range = sprintf("%u.%u.%u.%u", empty($a)?'0':$a, empty($b)?'0':$b,empty($c)?'0':$c,empty($d)?'0':$d);
                $range_dec = ip2long($_range);
                $ip_dec = ip2long($_ip);
                $wildcard_dec = pow(2,(32-$netmask)) - 1;
                $netmask_dec = ~ $wildcard_dec;
                return (($ip_dec & $netmask_dec) == ($range_dec & $netmask_dec));
            }
        }
        else
        {
            if(strpos($_range, '*')!==false)
            {
                $lower = str_replace('*', '0', $_range);
                $upper = str_replace('*', '255', $_range);
                $_range = "$lower-$upper";
            }
            if(strpos($_range, '-')!==false)
            {
                list($lower, $upper) = explode('-', $_range, 2);
                $lower_dec = (float)sprintf("%u",ip2long($lower));
                $upper_dec = (float)sprintf("%u",ip2long($upper));
                $ip_dec = (float)sprintf("%u",ip2long($_ip));
                return (($ip_dec>=$lower_dec) && ($ip_dec<=$upper_dec) );
            }
            return false;
        }
    }

    static function UploadFile($id = FILE_ACTION_NONE)
    {
        if(isset($_POST[POST_INTERN_FILE_TYPE]) && $_POST[POST_INTERN_FILE_TYPE] == FILE_TYPE_USERFILE)
        {
            if(empty($_POST["p_kb_fid"]))
                $fid = md5($_FILES["file"]["name"] . CALLER_SYSTEM_ID . time());
            else
                $fid = $_POST["p_kb_fid"];

            $filemask = CALLER_SYSTEM_ID . "_" . $fid;

            $chatid = 0;
            if(isset($_POST["p_chat_id"]))
                $chatid = $_POST["p_chat_id"];

            if(empty($_POST["p_kb_parent_id"]))
            {
                KnowledgeBase::CreateFolders(CALLER_SYSTEM_ID,true);
                KnowledgeBase::CreateEntry(CALLER_SYSTEM_ID, CALLER_SYSTEM_ID, Server::$Operators[CALLER_SYSTEM_ID]->Fullname, 0, Server::$Operators[CALLER_SYSTEM_ID]->Fullname, 0, 4);
                $parentId = CALLER_SYSTEM_ID;
            }
            else
                $parentId = $_POST["p_kb_parent_id"];

            // hidden parents 100=>emails/tickets incoming, 101=> emails/tickets outgoing, 102=>kb add image to text
            KnowledgeBase::CreateEntry(CALLER_SYSTEM_ID, $fid, $filemask, 3, $_FILES["file"]["name"], 0, $parentId, $_FILES["file"]["size"],"",$chatid);

            $tempfile = getId(32);

            if(@move_uploaded_file($_FILES["file"]["tmp_name"], PATH_UPLOADS . $tempfile))
            {
                $contents = file_get_contents(PATH_UPLOADS . $tempfile);
                IOStruct::CreateFile(PATH_UPLOADS . $filemask, Encoding::EncryptFile($contents),true);
                @unlink(PATH_UPLOADS . $tempfile);
                $id = FILE_ACTION_SUCCEEDED;
            }
            else
                $id = FILE_ACTION_ERROR;
        }
        Server::$Response->SetStandardResponse($id,base64_encode($fid));
    }

    static function GetPermissions()
    {
        $directories = Array(PATH_UPLOADS,PATH_CONFIG);
        foreach($directories as $dir)
        {
            $result = IOStruct::IsWriteable($dir);
            if(!$result)
                return 0;
        }
        return 1;
    }
}

class InternalXMLBuilder
{
	public $Caller;
	public $XMLProfilePictures = "";
	public $XMLWebcamPictures = "";
	public $XMLProfiles = "";
	public $XMLInternal = "";
	public $XMLTyping = "";
	public $XMLGroups = "";

	function __construct($_caller)
	{
		$this->Caller = $_caller;
	}

	function Generate()
	{
        Server::InitDataBlock(array("DBCONFIG"));
        $objects = array("group"=>Server::$Groups,"operator"=>Server::$Operators);
        $olu = 0;

        if(count(Server::$Groups) == 0)
            Logging::ErrorLog("No groups available");

        if(count(Server::$Operators) == 0)
            Logging::ErrorLog("No operators available");

        if(!Server::IsServerSetup() && isset($_POST["p_dut_olu"]))
            $olu = intval($_POST["p_dut_olu"]);

        foreach($objects as $type => $list)
            foreach($list as $sysId => $object)
            {
                $arxml="";
                /*
                if(!$object->IsDynamic && !(Server::IsServerSetup() || Server::$Operators[CALLER_SYSTEM_ID]->GetPermission(20) == PERMISSION_NONE || (!Server::$Operators[CALLER_SYSTEM_ID]->IsInGroupWith($object) && Server::$Operators[CALLER_SYSTEM_ID]->GetPermission(20) != PERMISSION_FULL)))
                {
                    foreach($object->AutoReplies as $reply)
                        $arxml .= $reply->GetXML();
                }
                */

                if($type=="group")
                {
                    if(!Server::IsServerSetup() && in_array($sysId,Server::$Operators[CALLER_SYSTEM_ID]->GroupsHidden))
                        continue;

                    $this->XMLGroups .= $object->GetXML();
                    if((Server::IsServerSetup() && !$object->IsDynamic) || $_POST[POST_INTERN_SERVER_ACTION] == INTERN_ACTION_LOGIN || $_POST[POST_INTERN_SERVER_ACTION] == INTERN_ACTION_LISTEN)
                    {
                        if(!$object->IsDynamic)
                        {
                            $this->XMLGroups .= "<f key=\"".base64_encode("gr_ex_sm")."\">".base64_encode($object->ChatFunctions[0])."</f>\r\n";
                            $this->XMLGroups .= "<f key=\"".base64_encode("gr_ex_so")."\">".base64_encode($object->ChatFunctions[1])."</f>\r\n";
                            $this->XMLGroups .= "<f key=\"".base64_encode("gr_ex_pr")."\">".base64_encode($object->ChatFunctions[2])."</f>\r\n";
                            $this->XMLGroups .= "<f key=\"".base64_encode("gr_ex_ra")."\">".base64_encode($object->ChatFunctions[3])."</f>\r\n";
                            $this->XMLGroups .= "<f key=\"".base64_encode("gr_ex_fv")."\">".base64_encode($object->ChatFunctions[4])."</f>\r\n";
                            $this->XMLGroups .= "<f key=\"".base64_encode("gr_ex_fu")."\">".base64_encode($object->ChatFunctions[5])."</f>\r\n";
                        }

                        if(!isset($object->ChatFunctions[6]))
                            $object->ChatFunctions[6] = 0;

                        $this->XMLGroups .= "<f key=\"".base64_encode("gr_ex_ss")."\">".base64_encode($object->ChatFunctions[6])."</f>\r\n";
                        $this->XMLGroups .= "<f key=\"".base64_encode("ci_hidden")."\">\r\n";

                        foreach($object->ChatInputsHidden as $index)
                            $this->XMLGroups .= "<value>".base64_encode($index)."</value>\r\n";
                        $this->XMLGroups .= "</f>\r\n";

                        $this->XMLGroups .= "<f key=\"".base64_encode("ti_hidden")."\">\r\n";
                        foreach($object->TicketInputsHidden as $index)
                            $this->XMLGroups .= "<value>".base64_encode($index)."</value>\r\n";
                        $this->XMLGroups .= "</f>\r\n";

                        $this->XMLGroups .= "<f key=\"".base64_encode("ci_mandatory")."\">\r\n";
                        foreach($object->ChatInputsMandatory as $index)
                            $this->XMLGroups .= "<value>".base64_encode($index)."</value>\r\n";
                        $this->XMLGroups .= "</f>\r\n";

                        $this->XMLGroups .= "<f key=\"".base64_encode("ti_mandatory")."\">\r\n";
                        foreach($object->TicketInputsMandatory as $index)
                            $this->XMLGroups .= "<value>".base64_encode($index)."</value>\r\n";
                        $this->XMLGroups .= "</f>\r\n";

                        $this->XMLGroups .= "<f key=\"".base64_encode("ci_masked")."\">\r\n";
                        foreach($object->ChatInputsMasked as $index => $value)
                            $this->XMLGroups .= "<value key=\"".base64_encode($index)."\">".base64_encode($value)."</value>\r\n";
                        $this->XMLGroups .= "</f>\r\n";

                        $this->XMLGroups .= "<f key=\"".base64_encode("ti_masked")."\">\r\n";
                        foreach($object->TicketInputsMasked as $index => $value)
                            $this->XMLGroups .= "<value key=\"".base64_encode($index)."\">".base64_encode($value)."</value>\r\n";
                        $this->XMLGroups .= "</f>\r\n";

                        $this->XMLGroups .= "<f key=\"".base64_encode("ti_cap")."\">\r\n";
                        foreach($object->TicketInputsCapitalized as $index => $value)
                            $this->XMLGroups .= "<value key=\"".base64_encode($index)."\">".base64_encode($value)."</value>\r\n";
                        $this->XMLGroups .= "</f>\r\n";

                        $this->XMLGroups .= "<f key=\"".base64_encode("ci_cap")."\">\r\n";
                        foreach($object->ChatInputsCapitalized as $index => $value)
                            $this->XMLGroups .= "<value key=\"".base64_encode($index)."\">".base64_encode($value)."</value>\r\n";
                        $this->XMLGroups .= "</f>\r\n";

                        $this->XMLGroups .= "<f key=\"".base64_encode("ti_assign")."\">\r\n";
                        if(is_array($object->TicketAssignment))
                            foreach($object->TicketAssignment as $index => $value)
                                $this->XMLGroups .= "<value key=\"".base64_encode($index)."\">".base64_encode($value)."</value>\r\n";
                        $this->XMLGroups .= "</f>\r\n";

                        $this->XMLGroups .= "<f key=\"".base64_encode("c_prio")."\">\r\n";
                        if(is_array($object->ChatPriorities))
                            foreach($object->ChatPriorities as $index => $value)
                                $this->XMLGroups .= "<value key=\"".base64_encode($index)."\">".base64_encode($value)."</value>\r\n";
                        $this->XMLGroups .= "</f>\r\n";

                        $this->XMLGroups .= "<f key=\"".base64_encode("c_smc")."\">\r\n";
                        if(!empty(Server::$Configuration->Database["gl_sm"]) && is_array(Server::$Configuration->Database["gl_sm"]))
                            foreach(Server::$Configuration->Database["gl_sm"] as $channel)
                                if($channel->GroupId == $sysId)
                                    $this->XMLGroups .= $channel->GetXML();
                        $this->XMLGroups .= "</f>\r\n";
                    }
                    else
                        $this->XMLGroups .= $arxml;

                    $this->XMLGroups .= "</v>\r\n";
                }
                else
                {
                    if($olu > 0 && $olu >= Server::$Operators[$sysId]->Updated)
                        continue;

                    $b64sysId = base64_encode($sysId);

                    /*
                     *
                    $sessiontime = $this->Caller->LastActive;
                    if($sysId != CALLER_SYSTEM_ID && !empty(Server::$Operators[$sysId]->WebcamPicture))
                    {
                        if(Server::$Operators[$sysId]->WebcamPictureTime >= $sessiontime)
                            $this->XMLWebcamPictures .= "<v os=\"".$b64sysId."\" content=\"".Server::$Operators[$sysId]->WebcamPicture."\" />\r\n";
                    }
                    else
                        $this->XMLWebcamPictures .= "<v os=\"".$b64sysId."\" content=\"".base64_encode("")."\" />\r\n";
                    */

                    $DEAC = (Server::$Operators[$sysId]->Deactivated) ? " deac=\"".base64_encode(1)."\"" : "";
                    $CPONL = (Server::$Operators[CALLER_SYSTEM_ID]->Level==USER_LEVEL_ADMIN) ? " cponl=\"".base64_encode(($object->PasswordChangeRequest) ? 1 : 0)."\"" : "";
                    $PASSWORD = (Server::IsServerSetup()) ? " pass=\"".base64_encode(Server::$Operators[$sysId]->Password)."\"" : "";

                    $la = (Server::$Operators[$sysId]->Status==2) ? Server::$Operators[$sysId]->LastActive : 0;
                    $botatts = (Server::$Operators[$sysId]->IsBot) ? " isbot=\"".base64_encode(Server::$Operators[$sysId]->IsBot ? "1" : "0")."\" wm=\"".base64_encode(Server::$Operators[$sysId]->WelcomeManager ? "1" : "0")."\" wmohca=\"".base64_encode(Server::$Operators[$sysId]->WelcomeManagerOfferHumanChatAfter)."\"" : "";

                    $this->XMLInternal .= "<v status=\"".base64_encode(Server::$Operators[$sysId]->Status)."\" id=\"".$b64sysId."\" u=\"".base64_encode(Server::$Operators[$sysId]->Updated)."\" userid=\"".base64_encode(Server::$Operators[$sysId]->UserId)."\"".$botatts." lang=\"".base64_encode(Server::$Operators[$sysId]->Language)."\" sit=\"".base64_encode(Server::$Operators[$sysId]->StatusText)."\" email=\"".base64_encode(Server::$Operators[$sysId]->Email)."\" websp=\"".base64_encode(Server::$Operators[$sysId]->Webspace)."\" loca=\"".base64_encode(Server::$Operators[$sysId]->Location)."\" rols=\"".base64_encode(Server::$Operators[$sysId]->Roles)."\" skils=\"".base64_encode(Server::$Operators[$sysId]->Skills)."\" fn=\"".base64_encode(Server::$Operators[$sysId]->Firstname)."\" ln=\"".base64_encode(Server::$Operators[$sysId]->Lastname)."\" desc=\"".base64_encode(Server::$Operators[$sysId]->Description)."\" perms=\"".base64_encode(Server::$Operators[$sysId]->PermissionSet)."\" ip=\"".base64_encode(Server::$Operators[$sysId]->IP)."\" lipr=\"".base64_encode(Server::$Operators[$sysId]->LoginIPRange)."\" c=\"".base64_encode(Server::$Operators[$sysId]->Color)."\" wmes=\"".base64_encode(Server::$Operators[$sysId]->WelcomeMessage)."\" a=\"".base64_encode(Server::$Operators[$sysId]->UserAPIURL)."\" aac=\"".base64_encode(Server::$Operators[$sysId]->CanAutoAcceptChats)."\" mc=\"".base64_encode(Server::$Operators[$sysId]->MaxChats)."\" la=\"".base64_encode($la)."\" ldap=\"".base64_encode(Server::$Operators[$sysId]->LDAP ? 1 : 0)."\" level=\"".base64_encode(Server::$Operators[$sysId]->Level)."\" ".$DEAC." ".$CPONL." ".$PASSWORD.">\r\n";

                    if(!empty(Server::$Operators[$sysId]->ProfilePicture))
                        $this->XMLInternal .= "<pp>".Server::$Operators[$sysId]->ProfilePicture."</pp>\r\n";

                    foreach(Server::$Operators[$sysId]->Groups as $groupid)
                        $this->XMLInternal .= "<gr>".base64_encode($groupid)."</gr>\r\n";

                    foreach(Server::$Operators[$sysId]->GroupsHidden as $groupid)
                        $this->XMLInternal .= "<gh>".base64_encode($groupid)."</gh>\r\n";

                    foreach(Server::$Operators[$sysId]->MobileExtends as $sid)
                        $this->XMLInternal .= "<me>".base64_encode($sid)."</me>\r\n";

                    foreach(Server::$Groups as $groupid => $group)
                        if($group->IsDynamic)
                            foreach($group->Members as $member => $persistent)
                                if($member == $sysId)
                                    $this->XMLInternal .= "<gr p=\"".base64_encode($persistent ? "1" : "0")."\">".base64_encode($groupid)."</gr>\r\n";

                    if(!empty(Server::$Operators[$sysId]->GroupsAway))
                        foreach(Server::$Operators[$sysId]->GroupsAway as $groupid)
                            $this->XMLInternal .= "<ga>".base64_encode($groupid)."</ga>\r\n";

                    foreach($object->PredefinedMessages as $premes)
                        $this->XMLInternal .= $premes->GetXML();

                    foreach($object->Signatures as $sig)
                        $this->XMLInternal .= $sig->GetXML();

                    if($object->AppClient)
                        $this->XMLInternal .= "<cm>".base64_encode($object->AppOS)."></cm>";

                    if($object->ClientWeb)
                        $this->XMLInternal .= "<cw />";

                    $this->XMLInternal .= $arxml;
                    $this->XMLInternal .= "</v>";

                    if($sysId!=$this->Caller->SystemId && $object->Status != USER_STATUS_OFFLINE)
                        $this->XMLTyping .= "<v id=\"".$b64sysId."\" tp=\"".base64_encode(((Server::$Operators[$sysId]->Typing==CALLER_SYSTEM_ID)?1:0))."\" />";
                }
            }

        foreach(Server::$Roles as $role)
            $this->XMLInternal .= $role->GetXML();

	}
}
?>
