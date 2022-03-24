<?php
/****************************************************************************************
* LiveZilla objects.global.users.inc.php
* 
* Copyright 2018 LiveZilla GmbH
* All rights reserved.
* LiveZilla is a registered trademark.
* 
* Improper changes to this file may cause critical errors.
***************************************************************************************/ 

if(!defined("IN_LIVEZILLA"))
	die();
	
require(LIVEZILLA_PATH . "_lib/objects.global.inc.php");

class BaseUser extends BaseObject
{
	public $SessId;
	public $UserId;
	public $Language;
	public $SystemId;
	public $Messages = array();
	public $Status = 2;
	public $Type;
	public $Folder;
	public $SessionFile;
	public $FirstActive;
	public $LastActive;
    public $IsDynamic = false;
	public $Typing = false;
    public $AutoReplies = array();
    public $FullyLoaded = false;

	function __construct($_userid)
   	{
		$this->UserId = $_userid;
   	}

	function AppendPersonalData()
	{

	}
}

class ChatMember
{
	public $SystemId;
	public $Status;
	public $Declined;
	public $Joined;
	public $Left;
	
	function __construct($_systemId, $_status, $_declined=false, $_joined=0, $_left=0)
	{
		$this->SystemId = $_systemId;
		$this->Status = $_status;
		$this->Declined = $_declined;
		$this->Joined = $_joined;
		$this->Left = $_left;
	}

    function GetXML()
    {
        return "<m i=\"" . base64_encode($this->SystemId) . "\" s=\"".base64_encode($this->Status)."\" d=\"".base64_encode(($this->Declined)?1:0)."\" />\r\n";
    }
}

class UserGroup extends BaseUser
{
	public $Descriptions;
	public $DescriptionArray;
	public $IsExternal;
	public $IsInternal;
	public $IsStandard;
	public $PredefinedMessages = array();
    public $Signatures = array();
	public $Created;
	public $Email;
	public $ChatFunctions;
	public $VisitorFilters;
	public $ChatInputsHidden = array();
	public $ChatInputsMandatory = array();
    public $ChatInputsMasked = array();
    public $ChatInputsCapitalized = array();
    public $ChatPriorities = array();
    public $ChatPrioritySleep;
	public $TicketInputsHidden = array();
	public $TicketInputsMandatory = array();
    public $TicketInputsMasked = array();
    public $TicketInputsCapitalized = array();
    public $TicketAssignment = array();
	public $TicketSenderName;
	public $OpeningHours = array();
	public $Members;
	public $Owner;
    public $TicketEmailOut;
    public $TicketEmailIn = array();
    public $TicketHandleUnknownEmails;
    public $ChatEmailOut;
    public $Position = 0;
    public $SendTicketNotifier = false;

	function __construct()
	{
		if(func_num_args() > 0)
		{
			$this->Id = $this->SystemId = func_get_arg(0);
			$row = (func_num_args() > 1) ? func_get_arg(1) : null;
			
			if(!empty($row))
			{
				if(!empty($row["dynamic"]))
				{
					$this->Owner = $row["owner"];
					$this->IsDynamic = true;
					$this->Descriptions["EN"] = $row["name"];
					$this->LoadMembers();
				}
				else
				{
					$this->Descriptions = @unserialize($row["description"]);
					$this->DescriptionArray = $row["description"];

					$this->IsInternal = !empty($row["internal"]);
					$this->IsExternal = !empty($row["external"]);
					$this->IsStandard = !empty($row["standard"]);

                    if($row["max_chats"] < 1)
                        $this->MaxChatAmount = 9999;
                    else if($row["max_chats"] > 30)
                    {
                        $this->MaxChatsStatus = USER_STATUS_AWAY;
                        $this->MaxChatAmount = $row["max_chats"]-30;
                    }
                    else
                        $this->MaxChatAmount = $row["max_chats"];

                    $this->MaxChats = $row["max_chats"];
					$this->Created = $row["created"];

                    if(!empty($row["opening_hours"]))
					    $this->OpeningHours = @unserialize($row["opening_hours"]);
                    else
                        $this->OpeningHours = array();

					$this->Email = $row["email"];

                    $this->ChatPrioritySleep = !empty($row["priority_sleep"]);
                    $this->SendTicketNotifier = !empty($row["ticket_notifier"]);

                    if(isset($row["position"]))
                        $this->Position = $row["position"];
						
					$this->VisitorFilters = (!empty($row["visitor_filters"])) ? @unserialize($row["visitor_filters"]) : array();
					$this->ChatFunctions = str_split($row["functions"]);

                    $this->ChatInputsHidden = (!empty($row["chat_inputs_hidden"])) ? @unserialize($row["chat_inputs_hidden"]) : array();
                    $this->ChatInputsMandatory = (!empty($row["chat_inputs_required"])) ? @unserialize($row["chat_inputs_required"]) : array();
                    $this->TicketInputsHidden = (!empty($row["ticket_inputs_hidden"])) ? @unserialize($row["ticket_inputs_hidden"]) : array();
                    $this->TicketInputsMandatory = (!empty($row["ticket_inputs_required"])) ? @unserialize($row["ticket_inputs_required"]) : array();

                    $this->ChatInputsMasked = (!empty($row["chat_inputs_masked"])) ? @unserialize($row["chat_inputs_masked"]) : array();
                    $this->TicketInputsMasked = (!empty($row["ticket_inputs_masked"])) ? @unserialize($row["ticket_inputs_masked"]) : array();
                    $this->ChatInputsCapitalized = (!empty($row["chat_inputs_cap"])) ? @unserialize($row["chat_inputs_cap"]) : array();
                    $this->TicketInputsCapitalized = (!empty($row["ticket_inputs_cap"])) ? @unserialize($row["ticket_inputs_cap"]) : array();
                    $this->ChatPriorities = (!empty($row["priorities"])) ? @unserialize($row["priorities"]) : array();

                    $this->TicketAssignment = (!empty($row["ticket_assignment"])) ? @unserialize($row["ticket_assignment"]) : array();
                    $this->TicketEmailIn = @unserialize(@$row["ticket_email_in"]);
                    $this->TicketEmailOut = @$row["ticket_email_out"];
                    $this->TicketHandleUnknownEmails = @$row["ticket_handle_unknown"];
                    $this->ChatEmailOut = @$row["chat_email_out"];
                    $this->TicketSenderName = $row["ticket_sender_name"];
				}
			}
		}
	}

    function GetTicketSenderName($_ticket)
    {
        $opName = "";
        $_ticket->LoadStatus();
        if($_ticket->Editor != null && isset($_ticket->Editor->Editor) && isset(Server::$Operators[$_ticket->Editor->Editor]))
        {
            $opName = Server::$Operators[$_ticket->Editor->Editor]->Fullname;
        }

        if($this->TicketSenderName == "1")
        {
            // group name
            return $this->GetDescription($_ticket->Language,false);
        }
        else if($this->TicketSenderName == "2")
        {
            // operator name
            return $opName;
        }
        else if(strpos($this->TicketSenderName,";") !== false)
        {
            // custom name
            $parts = explode(";",$this->TicketSenderName);
            $text = base64_decode($parts[1]);
            $text = str_replace("%group_title%",$this->GetDescription($_ticket->Language,false),$text);
            $text = str_replace(array("%name%","%operator_name%"),$opName,$text);
            return $text;
        }
        // default mailbox name
        return "";
    }

	function LoadMembers()
	{
        $this->Members = array();
		$result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_GROUP_MEMBERS . "` WHERE `group_id`='" . DBManager::RealEscape($this->Id) . "';");
		if($result)
			while($row = DBManager::FetchArray($result))
				$this->Members[$row["user_id"]] = !empty($row["persistent"]);
	}

    function IsOpeningHour($_ignoreBots=true)
    {
        Server::InitDataBlock(array("INTERNAL"));
        if(!$_ignoreBots && $this->ContainsBot())
            return true;

		$sofday = time() - mktime(0,0,0);

		foreach($this->OpeningHours as $hour)
		{
			if(date("N") == $hour[0])
			{
				if($sofday >= $hour[1] && $sofday <= $hour[2])
					return true;
			}
		}
		return (count($this->OpeningHours) == 0);
	}

    function IsHumanAvailable($_ignoreExternal=false,$_ignoreOpeningHours=false)
    {
        $list = $this->GetAvailableOperators($_ignoreExternal,$_ignoreOpeningHours);
        return count($list) > 0;
    }

	function GetAvailableOperators($_ignoreExternal=false,$_ignoreOpeningHours=false)
	{
        $list = array();
		foreach(Server::$Operators as $internaluser)
			if(in_array($this->Id,$internaluser->Groups) && !$internaluser->IsBot)
			{
				$isex = $internaluser->IsExternal(Server::$Groups, null, array($this->Id), $_ignoreExternal,$_ignoreOpeningHours);
				if($isex && $internaluser->Status < USER_STATUS_OFFLINE)
                    $list[] = $internaluser;
			}
		return $list;
	}

    function GetOperators()
    {
        $list = array();
        foreach(Server::$Operators as $internaluser)
            if(in_array($this->Id,$internaluser->Groups) && !$internaluser->IsBot)
            {
                $list[] = $internaluser;
            }
        return $list;
    }

    function ContainsBot()
    {
        foreach(Server::$Operators as $internaluser)
            if(in_array($this->Id,$internaluser->Groups) && $internaluser->IsBot && !$internaluser->Deactivated)
                return true;
        return false;
    }

	function HasWelcomeManager()
	{
		
		foreach(Server::$Operators as $internaluser)
		{
			if(in_array($this->Id,$internaluser->Groups) && $internaluser->IsBot && $internaluser->WelcomeManager && !$internaluser->Deactivated)
				return true;
		}
		return false;
	}
	
	function LoadPredefinedMessages()
	{
		if(DBManager::$Connected)
		{
			$this->PredefinedMessages = array();
			$result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_PREDEFINED . "` WHERE `group_id`='" . DBManager::RealEscape($this->Id) . "'");
			if($result)
				while($row = DBManager::FetchArray($result))
					$this->PredefinedMessages[strtolower($row["lang_iso"])] = new PredefinedMessage($row["lang_iso"],$row);
            $this->SetDefaultPredefinedMessage();
        }
	}

    function SetDefaultPredefinedMessage()
    {
        $isdefault = false;
        foreach($this->PredefinedMessages as $message)
            if($message->IsDefault)
                $isdefault = true;
        if(!$isdefault)
            if(!empty($this->PredefinedMessages["en"]))
                $this->PredefinedMessages["en"]->IsDefault = true;
    }

    function LoadSignatures()
    {
        if(DBManager::$Connected)
        {
            $this->Signatures = array();
            $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_SIGNATURES . "` WHERE `group_id`='" . DBManager::RealEscape($this->Id) . "'");
            if($result)
                while($row = DBManager::FetchArray($result))
                    $this->Signatures[strtolower($row["id"])] = new Signature($row);
        }
    }

    function Load()
    {
        $this->LoadPredefinedMessages();
        $this->LoadSignatures();
    }

	function GetXML()
	{
		if($this->IsDynamic)
		{
			$xml = "<v i=\"".base64_encode($this->Id)."\" n=\"".base64_encode($this->Descriptions["EN"])."\" o=\"".base64_encode($this->Owner)."\">";
			foreach($this->Members as $member => $persistent)
				$xml .= "<crm i=\"".base64_encode($member)."\" />";
		}
		else
		{
			$xml = "<v oh=\"".base64_encode($this->IsOpeningHour() ? "1" : "0")."\" id=\"".base64_encode($this->Id)."\" p=\"".base64_encode($this->Position)."\" desc=\"".base64_encode($this->DescriptionArray)."\" created=\"".base64_encode($this->Created)."\"  email=\"".base64_encode($this->Email)."\" mc=\"".base64_encode($this->MaxChats)."\" ps=\"".base64_encode($this->ChatPrioritySleep ? "1" : "0")."\" external=\"".base64_encode($this->IsExternal)."\"  internal=\"".base64_encode($this->IsInternal)."\" standard=\"".base64_encode($this->IsStandard)."\" teo=\"".base64_encode($this->TicketEmailOut)."\" tesn=\"".base64_encode($this->TicketSenderName)."\" ceo=\"".base64_encode($this->ChatEmailOut)."\" tino=\"".base64_encode($this->SendTicketNotifier ? 1 : 0)."\" thue=\"".base64_encode($this->TicketHandleUnknownEmails)."\">\r\n";
			if(is_array($this->VisitorFilters))
				foreach($this->VisitorFilters as $filt => $ex)
					$xml .= "<vfilt ex=\"".base64_encode((is_array($ex))?serialize($ex):$ex)."\">".$filt."</vfilt>\r\n";
			
            if(is_array($this->TicketEmailIn))
                foreach($this->TicketEmailIn as $teid)
                    $xml .= "<tei id=\"".base64_encode($teid)."\" />\r\n";
					
			if(is_array($this->PredefinedMessages))
				foreach($this->PredefinedMessages as $premes)
					$xml .= $premes->GetXML();

            if(is_array($this->Signatures))
                foreach($this->Signatures as $sig)
                    $xml .= $sig->GetXML();

			if(is_array($this->OpeningHours))
				foreach($this->OpeningHours as $hour)
					$xml .= "<oh open=\"".base64_encode($hour[1])."\" close=\"".base64_encode($hour[2])."\">".base64_encode($hour[0])."</oh>\r\n";
		}
		return $xml;
	}
	
	function Save()
	{
		if($this->IsDynamic)
			DBManager::Execute(true, "INSERT INTO `" . DB_PREFIX . DATABASE_GROUPS . "` (`id`, `name`, `owner`,`dynamic`, `description`, `opening_hours`,`chat_inputs_hidden`, `ticket_inputs_hidden`, `chat_inputs_required`, `ticket_inputs_required`, `chat_inputs_masked`, `ticket_inputs_masked`, `chat_inputs_cap`, `ticket_inputs_cap`,`visitor_filters`,`ticket_sender_name`,`ticket_email_in`,`ticket_assignment`,`priorities`,`priority_sleep`,`position`) VALUES ('" . DBManager::RealEscape($this->Id) . "', '" . DBManager::RealEscape($this->Descriptions["EN"]) . "','" . DBManager::RealEscape($this->Owner) . "',1,'','','','','','','','','','','','','','','',0,0);");
    }
	
	function Destroy()
	{
		DBManager::Execute(false, "DELETE FROM `" . DB_PREFIX . DATABASE_GROUPS . "` WHERE `id` = '" . DBManager::RealEscape($this->Id) . "' LIMIT 1;");
	}
	
	function RemoveMember($_id)
	{
        if(strpos($_id,"~")!==false)
        {
            $_id = explode("~",$_id);
            $_id = $_id[0];
        }
		DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_GROUP_MEMBERS . "` WHERE `user_id` LIKE '%" . DBManager::RealEscape($_id) . "%' AND `group_id` = '" . DBManager::RealEscape($this->Id) . "';");
	    CacheManager::FlushKey(DATA_CACHE_KEY_GROUPS);
    }

	function AddMember($_id,$_persistant=false)
	{
		DBManager::Execute(true, "REPLACE INTO `" . DB_PREFIX . DATABASE_GROUP_MEMBERS . "` (`user_id`, `group_id`, `persistent`) VALUES ('" . DBManager::RealEscape($_id) . "', '" . DBManager::RealEscape($this->Id) . "', " . (($_persistant) ? "1" : "0") . ");");
        CacheManager::FlushKey(DATA_CACHE_KEY_GROUPS);
    }

    function GetWaitingLinks($_question,$_language, $html="", $count=0)
    {
        /*
        $knowledgebase = false;
        $answers = ChatAutoReply::GetMatches($this->AutoReplies, $_question, $_language, null, null);
        if(!empty(Server::$Configuration->File["gl_knbq"]) && count($answers) == 0)
        {
            $root = Communication::ReadParameter("ckf","");
            $answers = KnowledgeBase::GetMatches($root,$_question,Visitor::$BrowserLanguage);
            $knowledgebase = true;
            $color = ExternalChat::ReadTextColor();
        }

        if(count($answers)>0)
        {
            foreach($answers as $qa)
            {
                if((!empty($qa->ResourceId) || !empty($qa->Answer)) && $qa->Waiting)
                {
                    $res = KnowledgeBaseEntry::GetById($qa->ResourceId);
                    $target = ($qa->NewWindow) ? "target=\"_blank\" " : "";
                    $html .= "<li>";

                    if($res==null)
                        $html .= $qa->Answer;
                    else if($res["type"] == 2)
                        $html .= "<a class=\"lz_chat_link\" href=\"". $res["value"]. "\" ".$target.">" . $res["title"]. "</a>";
                    else if($res["type"] == 3 || $res["type"] == 4)
                        $html .= "<a class=\"lz_chat_link\" href=\"". LIVEZILLA_URL . "getfile.php?id=" . $res["id"]. "\" ".$target.">" . $res["title"]. "</a>";
                    else
                        $html .= "<b>" . $res["title"]. "</b><br>" . str_replace("<a ", "<a ".$target,str_replace("<A","<a",$res["value"]));

                    $html .= "</li>";
                }
                else if($knowledgebase)
                {
                    $ehtml = trim($qa->GetHTML($color,true,false));
                    if(!empty($ehtml))
                        $html .= $ehtml;
                }

                if(++$count > 5)
                    break;
            }
            if(!empty($html))
            {
                $html = "<div id=\"lz_chat_waiting_links\">" . LocalizationManager::$TranslationStrings["client_while_waiting"] . "<ul>" . $html . "</ul></div>";
                return $html;
            }
        }
        return "";
        */
    }

    function GetDescription($_language="",$_defaultId=true)
    {
        if(!empty($_language) && isset($this->Descriptions[strtoupper($_language)]))
            return base64_decode($this->Descriptions[strtoupper($_language)]);
        else if(isset($this->Descriptions[strtoupper(Server::$Configuration->File["gl_default_language"])]))
           return base64_decode($this->Descriptions[strtoupper(Server::$Configuration->File["gl_default_language"])]);
        else if(isset($this->Descriptions["EN"]))
            return base64_decode($this->Descriptions["EN"]);
        else if(is_array($this->Descriptions))
            return base64_decode(current($this->Descriptions));
        else if($_defaultId)
            return $this->Id;
        else
            return "";
    }

    function GetServerInput($_input,$_chat=true,$default="",&$changed=false)
    {
        $cap = (($_chat) ? isset($this->ChatInputsCapitalized[$_input->Index]) : isset($this->TicketInputsCapitalized[$_input->Index]));
        return $_input->GetServerInput($default,$changed,$cap);
    }

    function GetChatPriority($_operatorId)
    {
        if(!empty($this->ChatPriorities) && isset($this->ChatPriorities[$_operatorId]))
            return $this->ChatPriorities[$_operatorId];
        return 0;
    }

    function TextReplace($_text,$_language)
    {
        $_text = str_replace(array("%group_name%","%group_id%","%TARGETGROUP%"),$this->Id,$_text);
        $_text = str_replace(array("%group_description%","%group_title%"),$this->GetDescription($_language),$_text);
        return $_text;
    }

    static function RemoveNonPersistantMember($_id)
    {
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_GROUP_MEMBERS . "` WHERE `user_id`='" . DBManager::RealEscape($_id) . "' AND `persistent`=0;");
        if(DBManager::GetAffectedRowCount()>0)
            CacheManager::FlushKey(DATA_CACHE_KEY_GROUPS);
    }

    static function IsDynamicGroup()
    {
        foreach(Server::$Groups as $group)
            if($group->IsDynamic)
                return true;
        return false;
    }

    static function PersistentJoin($_userId,$_systemId,$joined=false)
    {
        if(UserGroup::IsDynamicGroup())
        {
            if(!empty(VisitorChat::$DynamicGroup))
            {
                if(isset(Server::$Groups[VisitorChat::$DynamicGroup]))
                {
                    Server::$Groups[VisitorChat::$DynamicGroup]->AddMember($_systemId,false);
                    Server::$Groups[VisitorChat::$DynamicGroup]->LoadMembers();
                    $joined = true;
                }
            }
            else
            {
                $gToJoin = array();
                $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_GROUP_MEMBERS . "` WHERE `persistent`=1 AND `user_id` LIKE '%" . DBManager::RealEscape($_userId) . "%';");
                if($result)
                {
                    while($row = DBManager::FetchArray($result))
                        if($row["user_id"] != $_systemId)
                        {
                            if(!isset($gToJoin[$row["group_id"]]))
                                $gToJoin[$row["group_id"]] = true;
                        }
                        else
                        {
                            $gToJoin[$row["group_id"]] = false;
                            $joined = true;
                        }

                    foreach($gToJoin as $gid => $join)
                        if($join)
                        {
                            Server::$Groups[$gid]->AddMember($_systemId,true);
                            Server::$Groups[$gid]->LoadMembers();
                            $joined = true;
                        }
                }
            }
        }
        return $joined;
    }

    static function RemoveFromAllChatGroups($_systemId)
    {
        foreach(Server::$Groups as $group)
        {
            if($group->IsDynamic && isset($group->Members[$_systemId]))
            {
                $group->RemoveMember($_systemId);
            }
        }
    }

    static function ReadParams()
    {
        $group = "";

        if(!empty($_GET["eg"]))
        {
            $group = Communication::GetParameter("eg","",$c,FILTER_SANITIZE_SPECIAL_CHARS,null,32,false,false);
        }
        else if(!empty($_GET["group"]))
        {
            $group = Communication::GetParameter("group","",$c,FILTER_SANITIZE_SPECIAL_CHARS,null,32,false,false);
        }
        else if(!empty($_GET["intgroup"]))
        {
            // deprecated, compatibility
            $group = Communication::GetParameter("intgroup","",$c,FILTER_SANITIZE_SPECIAL_CHARS,null,32);
        }

        if(!empty($group) && isset(Server::$Groups[$group]))
            return $group;

        return "";
    }
}

class Role
{
    public $Id = "";
    public $Name = "";
    public $Description = "";
    public $Permissions = "";

    function __construct()
    {
        if(func_num_args() == 1)
        {
            $row = func_get_arg(0);
            $this->Id = $row["id"];
            $this->Name = $row["name"];
            $this->Description = $row["description"];
            $this->Permissions = $row["permissions"];
        }
    }

    function GetXML()
    {
        return "<r i=\"".base64_encode($this->Id)."\" d=\"".base64_encode($this->Description)."\" n=\"".base64_encode($this->Name)."\" p=\"".base64_encode($this->Permissions)."\" />";
    }

    function Save()
    {
        DBManager::Execute(true, "REPLACE INTO `" . DB_PREFIX . DATABASE_ROLES. "` (`id`, `name`, `description`, `permissions`) VALUES ('" . DBManager::RealEscape($this->Id) . "', '" . DBManager::RealEscape($this->Name) . "','" . DBManager::RealEscape($this->Description)  . "', '" . DBManager::RealEscape($this->Permissions) . "')");
    }

    function Destroy()
    {
        DBManager::Execute(false, "DELETE FROM `" . DB_PREFIX . DATABASE_ROLES . "` WHERE `id` = '" . DBManager::RealEscape($this->Id) . "' LIMIT 1;");
    }
}

class Operator extends BaseUser
{
    public $Firstname = "";
	public $Lastname = "";
	public $Webspace = 0;
	public $ClientSystemId;
    public $Token;
	public $Password;
	public $PasswordChangeRequest;
	public $Description;
	public $LCAFile;
	public $Authenticated = false;
	public $ExternalChats;
    public $ExternalChatCount = -1;
	public $PermissionSet;
	public $Groups = array();
	public $GroupsArray = array();
	public $GroupsAway = array();
	public $GroupsHidden;
	public $PredefinedMessages = array();
    public $Signatures = array();
	public $InExternalGroup;
    public $Level = 0;
	public $ProfilePicture;
	public $ProfilePictureTime = 0;
	public $LastChatAllocation;
    public $LastActiveDB;
	public $CanAutoAcceptChats;
	public $LoginIPRange = "";
	public $WebsitesConfig;
	public $SignOffRequest;
	public $IsBot = false;
	public $WelcomeManager = false;
	public $WelcomeManagerOfferHumanChatAfter = 0;
    public $WelcomeMessage = "";
    public $Deactivated;
    public $ClientWeb = false;
    public $AppClient = false;
    public $AppDeviceId = "testid";
    public $AppBackgroundMode = true;
    public $AppOS = "";
    public $MobileExtends = array();
    public $FirstCall = true;
    public $PictureFile;
    public $ChatFile;
    public $LDAP = false;
    public $Color;
    public $Updated = 0;
    public $SaveUpdated = false;
    public $UserAPIURL = "";
    public $StatusText = "";
    public $Skills = "";
    public $Location = "";
    public $Roles = "";
    public $CalculatedPermissionSet = null;
    public $Languages = "";

	function __construct()
   	{
        if(func_num_args() == 2)
        {
            $this->LastActive = 0;
            $this->SystemId = func_get_arg(0);
            $this->UserId = func_get_arg(1);
            $this->ExternalChats = array();
            $this->Type = 1;
            $this->GroupsHidden = array();

            if(defined("FILE_CHAT"))
            {
                $this->PictureFile = $this->GetOperatorPictureFile();
                $this->ChatFile = FILE_CHAT . "?operator=".urlencode($this->UserId);
            }
        }
   	}
	
	function SignOff($_init=true)
	{
        if($_init && ($this->LastActive < (time()-Server::$Configuration->File["timeout_clients"])))
            DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_OPERATORS . "` SET `updated`=".time().",`sign_off`=0,`status`=2,`token`='' WHERE `system_id`='" . DBManager::RealEscape($this->SystemId) . "' LIMIT 1; ");
        else if($_init && $this->Status != USER_STATUS_OFFLINE)
            DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_OPERATORS . "` SET `updated`=".time().",`sign_off`=1,`status`=2,`token`='' WHERE `system_id`='" . DBManager::RealEscape($this->SystemId) . "' LIMIT 1; ");
        else if(!$_init)
            DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_OPERATORS . "` SET `updated`=".time().",`sign_off`=0 WHERE `system_id`='" . DBManager::RealEscape($this->SystemId) . "' LIMIT 1; ");
    }
	
	function GetAutoReplies($_question,$_chat,$_visitor,&$_apiREQobject,&$_apiRESobject)
	{
        $html = "";
        $root = Communication::ReadParameter("ckf","");
        $kbresults = KnowledgeBase::GetMatches($root,$_question,Visitor::$BrowserLanguage,true);

        //$merged = array();
        if($this->IsBot)
        {
            $searchKB = false;
            if(!empty($this->UserAPIURL))
            {
                $_apiREQobject = array();

                $loutREQobj = Post::GetLastAPIObject($_chat->ChatId, "request");
                $loutRESobj = Post::GetLastAPIObject($_chat->ChatId, "response");

                if($loutREQobj != null)
                    $_apiREQobject["RequestNumber"] = $loutREQobj->RequestNumber+1;
                else
                    $_apiREQobject["RequestNumber"] = 0;

                if($loutRESobj != null)
                    $_apiREQobject["ResponseTo"] = $loutRESobj->Id;
                else
                    $_apiREQobject["ResponseTo"] = "";

                $_apiREQobject["Value"] = $_question;
                $_apiREQobject["BotId"] = $this->SystemId;
                $_apiREQobject["BotName"] = $this->Fullname;
                $_apiREQobject["VisitorName"] = $_visitor->VisitorData->Fullname;
                $_apiREQobject["VisitorId"] = $_visitor->UserId;
                $_apiREQobject["GroupId"] = $_chat->GroupId;
                $_apiREQobject["Language"] = $_visitor->Language;
                $_apiREQobject["HumanAvailable"] = false;
                $_apiREQobject["KBMatchCount"] = count($kbresults);

                if($loutRESobj != null && isset($loutRESobj->Tag))
                    $_apiREQobject["Tag"] = $loutRESobj->Tag;

                if(isset(Server::$Groups[$_chat->GroupId]) && Server::$Groups[$_chat->GroupId]->IsHumanAvailable())
                    $_apiREQobject["HumanAvailable"] = true;

                $_apiREQobject["Operators"] = array();
                $_apiREQobject["Customs"] = $_visitor->VisitorData->Customs;

                foreach(Server::$Operators as $op)
                {
                    $obObj = array();
                    $obObj["Id"] = $op->UserId;
                    $obObj["Status"] = $op->Status;
                    $obObj["Fullname"] = $op->Fullname;
                    $obObj["Groups"] = $op->Groups;
                    $_apiREQobject["Operators"][] = $obObj;
                }

                $response = Communication::CallUserAPI($this->UserAPIURL,array("livezilla_user_api_request"=>json_encode($_apiREQobject)));

                if($response != null)
                {
                    $_apiRESobject = json_decode($response);

                    $autoReply = new ChatAutoReply($_apiRESobject->Id,"string",$_apiRESobject->Value);
                    if(isset($_apiRESobject->Select))
                        $autoReply->Select = $_apiRESobject->Select;

                    $html .= $this->ProcessBotUserAPIReplies($autoReply,$_apiRESobject,$_visitor);

                    if(isset($_apiRESobject->SearchKB) && $_apiRESobject->SearchKB)
                    {
                        //if(!empty($autoReply->Answer))
                          //  $html .= "<br><br>";

                        $searchKB = true;
                    }
                }
                else
                    $searchKB = true;
            }
            else
            {
                sleep(1);
                $searchKB = true;
            }

            if($searchKB && $_question != "[__[EXIT]__]")
            {
                $_question = str_replace(array("!",",",".","?","=",")","(","-","_",":","#","~","�"),"",strtolower($_question));
                $answers = ChatAutoReply::GetMatches($kbresults, $_question, Visitor::$BrowserLanguage, $_chat, $this);
                $html .= $this->FormatBotAutoReplies($_chat,$answers);
            }
        }
        return (strlen($html)>0) ? $html : null;
	}

    function ProcessBotUserAPIReplies($_autoReply,$_apiRESobject,$_visitor)
    {
        $html = $_autoReply->Answer;
        $js = "";
        if(isset($_apiRESobject->Data))
        {
            $_visitor->VisitorData->LoadFromBotAPI($_apiRESobject);
            $_visitor->ApplyVisitorData();

            global $OVERLAY;
            $OVERLAY->RepollRequired = true;
        }
        if(isset($_autoReply->Select))
            foreach($_autoReply->Select as $option)
            {
                $html .= "<div onclick=\"";

                if(isset($option->url))
                    $html .="window.open('".$option->url."');OverlayChatWidgetV2.APIButtonClick('".base64_encode($option->return)."');";

                if(isset($option->script))
                    $html .= "eval(lz_global_base64_decode('".base64_encode($option->script)."'));";

                if(isset($option->action))
                {
                    $operatorid = (isset($option->operator)) ? "'" . ($option->operator) . "'" : "null";
                    $groupid = (isset($option->group)) ? "'" . ($option->group). "'" : "null";

                    if($option->action == "chat")
                    {
                        $html .= "OverlayChatWidgetV2.ExitBotChat(true,true,1);OverlayChatWidgetV2.InitChat(".$operatorid.",".$groupid.");";
                    }
                    else if($option->action == "message")
                        $html .= "OverlayChatWidgetV2.SetMode('ticket',true,".$groupid.");";
                }
                if(isset($option->return))
                    $html .= "OverlayChatWidgetV2.APIButtonClick('".base64_encode($option->return)."');";

                $html .= "lz_stop_propagation(arguments[0]);\" class=\"lz_chat_bot_button\">".$option->title."</div>";
            }


        if(isset($_apiRESobject->Action))
        {
            $operatorid = (isset($_apiRESobject->Operator)) ? "'" . $_apiRESobject->Operator . "'" : "null";
            $groupid = (isset($_apiRESobject->Group)) ? "'" . $_apiRESobject->Group . "'" : "null";

            if($_apiRESobject->Action == "chat")
                $js .= "OverlayChatWidgetV2.ExitBotChat(true,true,2);OverlayChatWidgetV2.InitChat(".$operatorid.",".$groupid.");";
            else if($_apiRESobject->Action == "message")
                $js .= "OverlayChatWidgetV2.SetMode('ticket',true,".$groupid.");";
        }

        if(isset($_apiRESobject->Block))
        {
            $js .= "OverlayChatWidgetV2.InputState(false,".To::BoolString($_apiRESobject->Block).");";
        }

        if(!empty($js))
            VisitorMonitoring::$Visitor->AddFunctionCall($js,false);

        return $html;
    }

    function FormatBotAutoReplies($_chat,$_answers,$_alternate=true,$html="",$single="")
    {
        $tth = "";

        if(!empty(Server::$Groups[$_chat->DesiredChatGroup]) && Server::$Groups[$_chat->DesiredChatGroup]->IsHumanAvailable())
        {
            $resultpc = DBManager::Execute(false, "SELECT * FROM `" . DB_PREFIX . DATABASE_POSTS . "` WHERE `chat_id`='" . DBManager::RealEscape($_chat->ChatId) . "' AND `repost`=0 AND `receiver`='" . DBManager::RealEscape($this->SystemId) . "';");
            if($this->WelcomeManager && DBManager::GetRowCount($resultpc) >= $this->WelcomeManagerOfferHumanChatAfter && $this->WelcomeManagerOfferHumanChatAfter < 6)
            {
                $tth = "<div class=\"lz_chat_bot_button keep_alive\" onclick=\"OverlayChatWidgetV2.ExitBotChat(true,true,3);OverlayChatWidgetV2.InitChat();\">".LocalizationManager::$TranslationStrings["client_talk_to_human"]."</div>";
            }
        }

        $lm = (empty(Server::$Configuration->File["gl_dtfbc"])) ? "<br><br><div onclick=\"OverlayChatWidgetV2.SetMode('ticket',true);\" class=\"lz_chat_bot_button keep_alive\">".LocalizationManager::$TranslationStrings["client_leave_a_message"]."</div>" : "";
        if(count($_answers)==0)
        {
            if(empty($lm))
                $tth = "<br><br>" . $tth;

            return LocalizationManager::$TranslationStrings["client_no_bot_result"] . $lm . $tth;
        }
        else if(count($_answers)>0)
        {
            $html .= LocalizationManager::$TranslationStrings["client_your_result"] . "<br>";
            $html .= "<ul class=\"lz_chat_bot_resource\">";
            foreach($_answers as $qa)
            {
                if(!empty($qa->ResourceId))
                {
                    $res = KnowledgeBaseEntry::GetById($qa->ResourceId);

                    $inWidget = !empty($res["in_widget"]);
                    $target = (!$inWidget) ? "target=\"_blank\" " : "";

                    $html .= "<li class=\"lz_chat_bot_button\">";

                    if($res["type"] == 1)
                        $html .= KnowledgeBase::GetURL($res["id"],"",$res["title"],array(),true,true);
                    else if($res["type"] == 2)
                        $html .= "<a class=\"lz_chat_link\" href=\"". $res["value"]. "\" ".$target.">" . $res["title"]. "</a>";
                    else if($res["type"] == 3 || $res["type"] == 4)
                        $html .= "<a class=\"lz_chat_link\" href=\"". LIVEZILLA_URL . "getfile.php?id=" . $res["id"]. "\" ".$target.">" . $res["title"]. "</a>";
                    else
                        $html .= "<b>" . $res["title"]. "</b><br><br>" . str_replace("<a ", "<a ".$target,str_replace("<A","<a",$res["value"]));

                    $html .= "</li>";
                }
                else if(!empty($qa->Answer))
                {
                    $single = $qa->Answer . "<br><br>";
                    break;
                }
            }
            $html .= "</ul>";
        }

        if(!empty($single))
            $html = $single;

        $html = Server::$Groups[$_chat->DesiredChatGroup]->TextReplace($html,Visitor::$BrowserLanguage);
        $html = $_chat->TextReplace($html);
        $html = $this->TextReplace($html);
        $html = Configuration::Replace($html);
        return $html . (($_alternate) ? (LocalizationManager::$TranslationStrings["client_bot_result_found"] . $lm . $tth) : "");
    }

    function FormatHumanAutoReplies($_chat,$_answers)
    {
        /*
        foreach($_answers as $qa)
            if($qa->Send || $qa->SendInactivityTimeInternal > -1 || $qa->SendInactivityTimeExternal > -1)
            {
                $html = "";
                if(empty($qa->Answer))
                {
                    $res = KnowledgeBaseEntry::GetById($qa->ResourceId);
                    $target = ($qa->NewWindow) ? "target=\"_blank\" " : "";

                    if($res["type"] == 2)
                        $html .= "<a class=\"lz_chat_link\" href=\"". $res["value"]. "\" ".$target.">" . $res["title"]. "</a>";
                    else if($res["type"] == 3 || $res["type"] == 4)
                        $html .= "<a class=\"lz_chat_link\" href=\"". LIVEZILLA_URL . "getfile.php?id=" . $res["id"]. "\" ".$target.">" . $res["title"]. "</a>";
                    else
                        $html .= str_replace("<a ", "<a ".$target,str_replace("<A","<a",$res["value"]));
                }
                else
                    $html = $qa->Answer;

                $html = Server::$Groups[$_chat->DesiredChatGroup]->TextReplace($html,Visitor::$BrowserLanguage);
                $html = $_chat->TextReplace($html);
                $html = $this->TextReplace($html);
                $html = Configuration::Replace($html);
                return $html;
            }
        return null;
        */
    }
	
	function Save($_create=false)
	{
		if($_create)
        {
			DBManager::Execute(true, "INSERT INTO `" . DB_PREFIX . DATABASE_OPERATORS . "` (`id`, `system_id`, `firstname`, `lastname`, `email`, `permissions`,`webspace`,`updated`,`status`, `level`, `ip`, `typing`, `groups_status`, `reposts`, `groups`, `languages`, `groups_hidden`, `websites_users`, `websites_config`, `mobile_ex`, `image`, `api_url`, `welcome_message`, `skills`, `location`, `roles`) VALUES ('" . DBManager::RealEscape($this->UserId) . "','" . DBManager::RealEscape($this->SystemId) . "','" . DBManager::RealEscape($this->Firstname) . "','" . DBManager::RealEscape($this->Lastname) . "','" . DBManager::RealEscape($this->Email) . "','" . DBManager::RealEscape($this->PermissionSet) . "','" . DBManager::RealEscape($this->Webspace) . "',".time().", '" . DBManager::RealEscape($this->Status) . "', 1, '" . DBManager::RealEscape($this->IP) . "', '" . DBManager::RealEscape($this->Typing) . "', '" . DBManager::RealEscape(serialize($this->GroupsAway)) . "','" . DBManager::RealEscape(serialize(/*$this->Reposts*/array())) . "','" . DBManager::RealEscape(base64_encode(serialize($this->Groups))) . "','" . DBManager::RealEscape($this->Language) . "','YTowOnt9','YTowOnt9','YTowOnt9','a:0:{}','','','','" . DBManager::RealEscape($this->Skills) . "','" . DBManager::RealEscape($this->Location) . "','" . DBManager::RealEscape($this->Roles) . "');");
		    $this->ChangePassword($this->Password);
        }
        else
		{
			$ca = (count($this->ExternalChats)==0) ? ",`last_chat_allocation`=0" : "";
            if($this->SaveUpdated)
            {
                $this->SaveUpdated = false;
                $this->AppClient = !empty($_POST["p_app"]);
                $this->ClientWeb = !empty($_POST["p_web"]);
			    DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_OPERATORS . "` SET `updated`=" . time() . ",`first_active`='" . DBManager::RealEscape($this->FirstActive) . "',`groups_status`='" . DBManager::RealEscape(serialize($this->GroupsAway)) . "',`typing`='" . DBManager::RealEscape($this->Typing) . "',`level`='" . DBManager::RealEscape($this->Level) . "',`status`='" . DBManager::RealEscape($this->Status) . "',`ip`='" . DBManager::RealEscape(Communication::GetIP(true)) . "',`lweb`='" . DBManager::RealEscape($this->ClientWeb ? 1 : 0) . "',`lapp`='" . DBManager::RealEscape($this->AppClient ? 1 : 0) . "',`last_active`=" . time() . $ca . " WHERE `system_id`='" . DBManager::RealEscape($this->SystemId) . "' LIMIT 1; ");
            }
            else
                DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_OPERATORS . "` SET `last_active`=" . time() . " WHERE `system_id`='" . DBManager::RealEscape($this->SystemId) . "' LIMIT 1;");
        }
	}

    function SetStatusText($_text)
    {
        DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_OPERATORS . "` SET `status_info`='" . DBManager::RealEscape($_text) . "' WHERE `system_id`='" . DBManager::RealEscape($this->SystemId) . "' LIMIT 1;");
    }

    function GetPublicName(){

        if(isset(Server::$Configuration->File["gl_sfnc"]) && Server::$Configuration->File["gl_sfnc"] === "0")
            $name = $this->Firstname;
        else
            $name = $this->Fullname;

        return $name;
    }

    function Delete()
    {
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_OPERATORS . "` WHERE `id`='" . DBManager::RealEscape($this->UserId) . "' LIMIT 1;");
    }

    function SetDynamicValues($_row)
    {
        $this->AppClient = !empty($_row["lapp"]);
        $this->AppBackgroundMode = !empty($_row["mobile_background"]);
        $this->AppDeviceId = @$_row["mobile_device_id"];
        $this->AppOS = @$_row["mobile_os"];
        $this->ClientWeb = !empty($_row["lweb"]);
        $this->ClientSystemId = @$_row["client_system_id"];
        $this->Token = @$_row["token"];
        $this->LastActiveDB =
        $this->LastActive = $_row["last_active"];
        $this->Updated = isset($_row["updated"]) ? $_row["updated"] : 0;
        $this->Deactivated = ($_row["sign_off"]==2);
        $this->SignOffRequest = !empty($_row["sign_off"]);

        if(!empty($_row["mobile_ex"]))
            $this->MobileExtends = @unserialize($_row["mobile_ex"]);

        $this->Typing = $_row["typing"];
        $this->FirstActive = ($_row["first_active"]<(time()-@Server::$Configuration->File["timeout_clients"]))?time():$_row["first_active"];
        $this->LastChatAllocation = $_row["last_chat_allocation"];
        $this->Status = $_row["status"];
        if($_row["status"] != USER_STATUS_OFFLINE)
        {
            if(!empty($_row["mobile_device_id"]) && !empty($_row["mobile_os"]) && strpos($_row["mobile_os"],"desk") === false && $_row["last_active"]>(time()-(30*86400)) && Server::IsAvailable())
                $this->LastActive = time();
            else if($_row["last_active"]<(time()-Server::$Configuration->File["timeout_clients"]) && !$this->IsBot)
                $this->Status = USER_STATUS_OFFLINE;
            else if($_row["last_active"]<(time()-(Server::$Configuration->File["poll_frequency_clients"]+30)) && !$this->IsBot)
                $this->Status = USER_STATUS_AWAY;
        }
        $this->PasswordChangeRequest = !empty($_row["password_change_request"]);
        $this->UserAPIURL = isset($_row["api_url"]) ? $_row["api_url"] : "";
    }

    function SetValues($_row)
    {
        $this->Email = $_row["email"];
        $this->Webspace = $_row["webspace"];
        $this->Level = $_row["level"];
        $this->Description = $_row["description"];

        $this->Firstname = @$_row["firstname"];
        $this->Lastname = @$_row["lastname"];
        $this->Fullname = trim($this->Firstname . " " . $this->Lastname);

        $this->Language = $_row["languages"];
        $this->ProfilePicture = $_row["image"];
        $this->Groups = @unserialize(base64_decode($_row["groups"]));

        if(isset($_row["max_chats"]))
        {
            if($_row["max_chats"] < 1)
                $this->MaxChatAmount = 9999;
            else if($_row["max_chats"] > 30)
            {
                $this->MaxChatsStatus = USER_STATUS_AWAY;
                $this->MaxChatAmount = $_row["max_chats"]-30;
            }
            else
                $this->MaxChatAmount = $_row["max_chats"];
            $this->MaxChats = $_row["max_chats"];
        }

        if(!empty($this->Groups))
            array_walk($this->Groups,"b64dcode");
        $this->GroupsHidden = @unserialize(base64_decode($_row["groups_hidden"]));
        if(!empty($this->GroupsHidden))
            array_walk($this->GroupsHidden,"b64dcode");

        $this->GroupsArray = $_row["groups"];
        $this->PermissionSet = $_row["permissions"];
        $this->CanAutoAcceptChats = (isset($_row["auto_accept_chats"])) ? $_row["auto_accept_chats"] : 1;
        $this->LoginIPRange = $_row["login_ip_range"];
        $this->IsBot = !empty($_row["bot"]);
        $this->FirstCall = ($_row["first_active"]<(time()-@Server::$Configuration->File["timeout_clients"]));
        $this->Password = $_row["password"];
        $this->SetDynamicValues($_row);
        $this->Level = $_row["level"];
        $this->IP = $_row["ip"];
        $this->LDAP = !empty($_row["ldap"]);
        $this->Color = @$_row["color"];

        $this->StatusText = @$_row["status_info"];
        $this->Skills = @$_row["skills"];
        $this->Location = @$_row["location"];
        $this->Roles = @$_row["roles"];

        if(!empty($_row["groups_status"]))
            $this->GroupsAway = @unserialize($_row["groups_status"]);

        if($this->IsBot)
        {
            $this->FirstCall =
            $this->FirstActive =
            $this->LastActive = time();
            $this->Status = USER_STATUS_ONLINE;
            $this->WelcomeManager = !empty($_row["wm"]);
            $this->WelcomeManagerOfferHumanChatAfter = $_row["wmohca"];
            $this->WelcomeMessage = $_row["welcome_message"];
        }

        if(empty($this->GroupsAway))
            $this->GroupsAway = array();
    }
	
	function Load()
	{
		$this->LoadPredefinedMessages();
        $this->LoadSignatures();
	}

    function LoadUnCacheables()
    {
        if(DBManager::$Connected)
        {
            $result = DBManager::Execute(false, "SELECT * FROM `" . DB_PREFIX . DATABASE_OPERATORS . "` WHERE `system_id`='" . DBManager::RealEscape($this->SystemId) . "';");
            if($result && $row = DBManager::FetchArray($result))
                $this->SetDynamicValues($row);
        }
    }
	
	function SetLastChatAllocation()
	{
		DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_OPERATORS . "` SET `updated`=".time().",`last_chat_allocation`='" . DBManager::RealEscape(time()) . "' WHERE `system_id`='" . DBManager::RealEscape($this->SystemId) . "' LIMIT 1; ");
	}

	function GetExternalObjects()
	{
		$result = DBManager::Execute(true, $d = "SELECT * FROM `" . DB_PREFIX . DATABASE_VISITOR_CHATS . "` AS `t1` INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_CHAT_OPERATORS . "` AS `t2` ON `t1`.`chat_id`=`t2`.`chat_id` WHERE `t1`.`exit`=0 AND `t2`.`status`<9;");
        if($result)
			while($row = DBManager::FetchArray($result))
			{
				$chat = new VisitorChat($row);
				if($chat->LastActive<(time()-Server::$Configuration->File["timeout_chats"]) && !(!empty($chat->OperatorId) && Server::$Operators[$chat->OperatorId]->IsBot))
					$chat->ExternalClose();
				else if($row["user_id"] == $this->SystemId)
					$this->ExternalChats[$chat->SystemId] = $chat;
			}
	}

    function HasAccessToTicket($_ticket)
    {
        return ($this->GetPermission(PERMISSION_TICKETS) != PERMISSION_NONE && ($this->IsInGroup($_ticket->Group) || $this->GetPermission(PERMISSION_TICKETS) == PERMISSION_FULL));
    }

    function HasAccessToEmail($_group)
    {
        return ($this->GetPermission(22) != PERMISSION_NONE && ($this->IsInGroup($_group) || $this->GetPermission(22) == PERMISSION_FULL));
    }

    function IsInPushMessageState()
    {
        return (!empty($this->AppDeviceId) && $this->AppBackgroundMode);
    }
	
	function IsInGroupWith($_comparer)
	{
        if(!isset($_comparer->Groups))
            return in_array($_comparer->SystemId,$this->Groups);
		foreach($this->Groups as $gid)
			if(in_array($gid,$_comparer->Groups))
				return true;
		return false;
	}

    function IsInGroup($_groupId)
    {
        return in_array($_groupId,$this->Groups);
    }

    function IsAvailableForChat()
    {
        return $this->Status < USER_STATUS_OFFLINE && ($this->LastActive > (time()-Server::$Configuration->File["timeout_clients"]));
    }

    function PrioritySleep($_groupId)
    {
        if($this->IsBot)
            return false;

        if(isset(Server::$Groups[$_groupId]) && Server::$Groups[$_groupId]->ChatPrioritySleep)
        {
            $myPrio = (isset(Server::$Groups[$_groupId]->ChatPriorities[$this->SystemId])) ? Server::$Groups[$_groupId]->ChatPriorities[$this->SystemId] : 0;
            foreach(Server::$Groups[$_groupId]->ChatPriorities as $systemId => $prio)
            {
                if(!isset(Server::$Operators[$systemId]))
                    continue;
                if($systemId == $this->SystemId || Server::$Operators[$systemId]->IsBot)
                    continue;
                if(!Server::$Operators[$systemId]->IsInGroup($_groupId))
                    continue;
                if($prio > $myPrio && Server::$Operators[$systemId]->IsAvailableForChat() && Server::$Operators[$systemId]->GetMaxChatAmountStatus(Server::$Groups[$_groupId]) != USER_STATUS_AWAY)
                    return true;
            }
        }
        return false;
    }

    function MobileSleep()
    {
        if($this->IsBot)
            return false;

        if(!empty($this->MobileExtends))
        {
            foreach($this->MobileExtends as $sid)
                if(isset(Server::$Operators[$sid]) && Server::$Operators[$sid]->LastActive > (time()-Server::$Configuration->File["timeout_clients"]) && Server::$Operators[$sid]->Status != USER_STATUS_OFFLINE)
                {
                    return true;
                }
        }
        return false;
    }

    function GetMaxChatAmountStatus($_group=null)
    {
        if($this->IsMaxChatAmount() && $this->GetExternalChatAmount() >= $this->MaxChatAmount)
        {
            return $this->MaxChatsStatus;
        }
        else if($_group != null && $_group->IsMaxChatAmount() && $this->GetExternalChatAmount() >= $_group->MaxChatAmount)
        {
            return $_group->MaxChatsStatus;
        }
        return $this->Status;
    }
	
	function IsExternal($_groupList, $_exclude=null, $_include=null, $_ignoreExternal=false, $_ignoreOpeningHours=false, $_ignoreStatus=false)
	{
        if($this->IsBot)
            $_ignoreOpeningHours = true;

        if($this->Deactivated)
            return false;

		Server::InitDataBlock(array("GROUPS"));
        if(!empty($this->Groups))
            foreach($this->Groups as $groupid)
                if(isset(Server::$Groups[$groupid]) && !Server::$Groups[$groupid]->IsDynamic)
                    if($_ignoreStatus || ((((Server::$Groups[$groupid]->IsOpeningHour()||$_ignoreOpeningHours) && !in_array($groupid,$this->GroupsAway) && $this->GetMaxChatAmountStatus(Server::$Groups[$groupid]) != USER_STATUS_AWAY))))
                    {
                        $group_incl = !empty($_include) && in_array($groupid,$_include);
                        $group_excl = (!empty($_exclude) && in_array($groupid,$_exclude)) || (!$group_incl && empty($_exclude) && !empty($_include));

                        if(!empty($_groupList[$groupid]) && ($_groupList[$groupid]->IsExternal || $_ignoreExternal) && ($group_incl || !$group_excl))
                        {
                            $this->InExternalGroup = true;

                            if($this->MobileSleep())
                                return false;

                            if(!empty(VisitorChat::$DynamicGroup))
                                if(isset(Server::$Groups[VisitorChat::$DynamicGroup]) && !isset(Server::$Groups[VisitorChat::$DynamicGroup]->Members[$this->SystemId]))
                                    return false;

                            return true;
                        }
                    }

        return $this->InExternalGroup=false;
	}
	
	function GetGroupList($_excludeAwayGroups=false)
	{
		if(!$_excludeAwayGroups)
			return $this->Groups;
		else
		{
			$groupl = array();
			foreach($this->Groups as $groupid)
				if(!in_array($groupid,$this->GroupsAway))
					$groupl[] = $groupid;
			return $groupl;
		}
	}

    function GetChatPriority($_groupObj)
    {
        if($this->IsInGroup($_groupObj->Id))
            return $_groupObj->GetChatPriority($this->SystemId);
        return 0;
    }
	
	function GetExternalChatAmount()
	{
        if($this->Status == 2)
            return 0;
        if($this->LastActive<(time()-Server::$Configuration->File["timeout_clients"]))
            return 0;
        if($this->ExternalChatCount > -1)
            return $this->ExternalChatCount;
        
		$result = DBManager::Execute(true, "SELECT COUNT(*) as `ccount` FROM `" . DB_PREFIX . DATABASE_VISITOR_CHATS . "` AS `t1` INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_CHAT_OPERATORS . "` AS `t2` ON `t1`.`chat_id`=`t2`.`chat_id` WHERE `t1`.`exit`=0 AND `t1`.`internal_declined`=0 AND `t2`.`status`<9 AND `t2`.`user_id`='" . DBManager::RealEscape($this->SystemId) . "';");
        if($row = DBManager::FetchArray($result))
			return $this->ExternalChatCount = $row["ccount"];
		
		return $this->ExternalChatCount = 0;
	}
	
    function LoadSignatures()
    {
        if(DBManager::$Connected)
        {
            $this->Signatures = array();
            $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_SIGNATURES . "` WHERE `operator_id`='" . DBManager::RealEscape($this->SystemId) . "'");
            if($result)
                while($row = DBManager::FetchArray($result))
                    $this->Signatures[strtolower($row["id"])] = new Signature($row);
        }
    }
	
	function IsVisitorFiltered($_visitor, $blmatch=false, $wlmatch=false, $iswl=false)
	{
        $filtered = empty(Server::$Configuration->File["gl_vmac"]) && !$_visitor->IsInChat(true);

         if(!$filtered && !empty(Server::$Configuration->File["gl_hide_inactive"]))
            $filtered = !$_visitor->IsActivity(null,true,false);

		foreach($this->Groups as $groupid)
		{
			if(empty(Server::$Groups[$groupid]->VisitorFilters))
				return $filtered;
			foreach(Server::$Groups[$groupid]->VisitorFilters as $value => $filter)
			{
                $value = str_replace("*","",base64_decode($value));
                $urlmatch=false;

                if($filter=="Whitelist")
                    $iswl = true;

				foreach($_visitor->Browsers as $BROWSER)
				{
					if(count($BROWSER->History)==0)
						$BROWSER->LoadHistory();
						
					for($i = 0;$i < count($BROWSER->History);$i++)
        				if(strpos(strtolower($BROWSER->History[$i]->Url->GetAbsoluteUrl()),strtolower($value)) !== false)
							$urlmatch = true;
				}

                if($filter=="Blacklist" && $urlmatch)
                    $blmatch = true;
				if($filter=="Whitelist" && $urlmatch)
                    $wlmatch = true;
			}
		}
        if($blmatch)
            return true;
        if($wlmatch)
            return false;
        if($iswl)
            return true;

		return $filtered;
	}
	
	function ValidateLoginAttempt($_clear=false)
	{
		if(DBManager::$Connected)
		{
			if(!empty($this->LoginIPRange))
			{
				$match = false;
				$ranges = explode(",",$this->LoginIPRange);
				foreach($ranges as $range)
					if(Communication::GetIP(true) == trim($range) || OperatorRequest::IPMatch(Communication::GetIP(true),trim($range)))
						$match = true;
				if(!$match)
					return false;
			}
            if(!empty($_POST[POST_INTERN_AUTHENTICATION_PASSWORD]))
            {
                $result = DBManager::Execute(true, "SELECT `id`,`password` FROM `" . DB_PREFIX . DATABASE_OPERATOR_LOGINS . "` WHERE `ip`='" . DBManager::RealEscape(Communication::GetIP(true)) . "' AND `user_id`='" . DBManager::RealEscape($this->UserId) . "' AND `time` > '" . DBManager::RealEscape(time() - 86400) . "';");
                if(DBManager::GetRowCount($result) >= MAX_LOGIN_ATTEMPTS)
                {
                    if(!$_clear)
                    {
                        $this->DeleteLoginAttempts();
                        return $this->ValidateLoginAttempt(true);
                    }
                    return false;
                }
            }
		}
        else
            return false;
		return true;
	}

    function ValidateUpdateSession($_token,$_clientSystemId)
    {
        $this->Token = $_token;
        $this->ClientSystemId = $_clientSystemId;
        DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_OPERATORS . "` SET `updated`=".time().",`ip`='".DBManager::RealEscape(Communication::GetIP(true))."',`client_system_id`='" . DBManager::RealEscape($this->ClientSystemId) . "',`token`='" . DBManager::RealEscape($this->Token) . "' WHERE `system_id`='" . DBManager::RealEscape($this->SystemId) . "' LIMIT 1;");
    }

    function ValidateLoginAuthentication()
    {
        if(isset($_POST["p_ldap"]) && !empty(Server::$Configuration->File["gl_ldap"]) && !empty($_POST[POST_INTERN_AUTHENTICATION_PASSWORD]) && Server::$Operators[$this->SystemId]->LDAP)
        {
            require_once(LIVEZILLA_PATH . "_lib/objects.ldap.inc.php");

            $ldapAuth = LDAPManager::ValidateUser($this->UserId,Encoding::Base64UrlDecode($_POST[POST_INTERN_AUTHENTICATION_PASSWORD]));
            if($ldapAuth === true)
            {
                define("VALIDATED_FULL_LOGIN",true);
                return true;
            }
        }
        else if(!empty($this->Password) || isset($_POST["p_ldap"]))
        //else if(!empty($this->Password) && !Server::$Operators[$this->SystemId]->LDAP)
        {
            if(!empty($_POST[POST_INTERN_AUTHENTICATION_PASSWORD]) && !Server::$Operators[$this->SystemId]->LDAP)
            {
                if(!empty($this->Password))
                {
                    if($this->Password == $_POST[POST_INTERN_AUTHENTICATION_PASSWORD])
                    {
                        // 1.) v2 api login >= 5.4.x.;
                        // 2.) v2 comp login when no pw hash api
                        // 3.) pw reset fallback

                        define("VALIDATED_FULL_LOGIN",true);
                        return true;
                    }

                    if(hash("sha256",$this->Password) == $_POST[POST_INTERN_AUTHENTICATION_PASSWORD])
                    {
                        // v2 login >= 5.4.x.;
                        define("VALIDATED_FULL_LOGIN",true);
                        return true;
                    }

                    if(Server::IsPasswordAPI())
                    {
                        if(password_verify($_POST[POST_INTERN_AUTHENTICATION_PASSWORD], $this->Password))
                        {
                            // v3 login >= 7.0.6.x.;
                            define("VALIDATED_FULL_LOGIN",true);
                            return true;
                        }
                        if(password_verify(hash("sha256",$_POST[POST_INTERN_AUTHENTICATION_PASSWORD]), $this->Password))
                        {
                            // v3 api login >= 7.0.6.x.;
                            define("VALIDATED_FULL_LOGIN",true);
                            return true;
                        }
                    }
                    else
                    {
                        /*
                        if($this->Password == hash("sha256",$_POST[POST_INTERN_AUTHENTICATION_PASSWORD]))
                        {
                            // v2 api login >= 7.0.6.x. without hash for PHP < 5.5;
                            return true;
                        }
                        */
                    }
                }
            }

            if(!empty($this->Token) && !empty($_POST[POST_INTERN_AUTHENTICATION_TOKEN]))
            {
                if($this->IsValidToken($_POST[POST_INTERN_AUTHENTICATION_TOKEN]))
                {
                    define("VALIDATED_TOKEN",true);
                    return true;
                }
            }
        }
        return false;
    }

    function IsValidToken($_token)
    {
        if(!empty($_token) && !empty($this->Token))
            if(hash("sha256",$this->Token) == $_token)
                return true;
        return false;
    }

    function SaveLoginAttempt($_password)
    {
        if(DBManager::$Connected)
            DBManager::Execute(true, "INSERT IGNORE INTO `" . DB_PREFIX . DATABASE_OPERATOR_LOGINS . "` (`id` ,`user_id` ,`ip` ,`time` ,`password`) VALUES ('" . DBManager::RealEscape(getId(32)) . "', '" . DBManager::RealEscape($this->UserId) . "', '" . DBManager::RealEscape(Communication::GetIP(true)) . "', '" . DBManager::RealEscape(time()) . "', '" . DBManager::RealEscape($_password) . "');");
    }
	
	function DeleteLoginAttempts()
	{
		if(DBManager::$Connected)
			DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_OPERATOR_LOGINS . "` WHERE `time`<" . (time() - 86400) . " AND `ip`='" . DBManager::RealEscape(Communication::GetIP(true)) . "' AND `user_id`='" . DBManager::RealEscape($this->UserId) . "';");
	}
	
	function ChangePassword($_password,$_isHashed=false)
	{
		if(OperatorRequest::IsValidated() && Is::Defined("VALIDATED_FULL_LOGIN"))
		{
            if(empty($_password))
                return;

            Logging::SecurityLog("Operator->ChangePassword",$_password,Is::Defined("CALLER_SYSTEM_ID"));

            if(!$_isHashed)
                $_password = $this->HashPassword($_password);

			DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_OPERATORS . "` SET `updated`=".time().",`password`='" . DBManager::RealEscape($_password) . "' WHERE `system_id`='" . DBManager::RealEscape($this->SystemId) . "' LIMIT 1;");
        }
	}
	
	function SetPasswordChangeNeeded($_active=true)
	{
        if(OperatorRequest::IsValidated() && Is::Defined("VALIDATED_FULL_LOGIN"))
		{
            Logging::SecurityLog("Operator->SetPasswordChangeNeeded",intval($_active ? 1 : 0),Is::Defined("CALLER_SYSTEM_ID"));
			$this->PasswordChangeRequest = $_active;
			DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_OPERATORS . "` SET `updated`=".time().",`password_change_request`=".intval($_active ? 1 : 0)." WHERE `system_id`='" . DBManager::RealEscape($this->SystemId) . "' LIMIT 1;");
		}
	}

    function HashPassword($_password)
    {
        if(Server::IsPasswordAPI())
            return password_hash($_password, PASSWORD_DEFAULT);
        return $_password;
    }

    function CalculatePermissions()
    {
        $cpermissions = "";
        $permissionset = "";

        $roles = explode(",",$this->Roles);

        foreach($roles as $key)
        {
            if(!isset(Server::$Roles[$key]))
                continue;

            $role = Server::$Roles[$key];

            $rperms = str_split($role->Permissions);

            foreach($rperms as $index => $rkey)
            {
                $dp = strlen($permissionset) > $index ? intval(substr($permissionset,$index,1)) : 0;
                $rp = intval(substr($role->Permissions,$index,1));

                if($rp > $dp)
                {
                    $cpermissions .= $rp;
                }
                else
                {
                    $cpermissions .= $dp;
                }
            }
            $permissionset = $cpermissions;

            $cpermissions = "";
        }

        return $permissionset;
    }

	function GetPermission($_type, $_fallBack=PERMISSION_NONE)
	{
        if($this->CalculatedPermissionSet == null)
            $this->CalculatedPermissionSet = $this->CalculatePermissions();

        if(strlen($this->CalculatedPermissionSet)>$_type)
		    return substr($this->CalculatedPermissionSet,$_type,1);

        return $_fallBack;
	}
	
	function GetOperatorPictureFile()
	{
		$url = "picture.php?operator=".urlencode($this->UserId);
		return $url;
	}

	function GetLoginReply($_extern,$_oocount=0)
	{
		foreach(Server::$Operators as $internaluser)
			if($internaluser->Status != USER_STATUS_OFFLINE && !$internaluser->IsBot)
				$_oocount++;
		return "<login>\r\n<login_return t=\"".base64_encode($this->Token)."\" oo=\"".base64_encode($_oocount)."\" group=\"".base64_encode($this->GroupsArray)."\" name=\"".base64_encode($this->Fullname)."\" loginid=\"".base64_encode($this->ClientSystemId)."\" cp=\"".base64_encode($this->PasswordChangeRequest)."\" level=\"".base64_encode(0)."\" sess=\"".base64_encode($this->SystemId)."\" extern=\"".base64_encode($_extern)."\" perms=\"".base64_encode($this->PermissionSet)."\" phpv=\"".base64_encode(@phpversion())."\" sip=\"".base64_encode(@$_SERVER["SERVER_ADDR"])."\" uip=\"".base64_encode(@$_SERVER["REMOTE_ADDR"])."\" /></login>";
	}

    function SaveMobileParameters()
    {
        if(!Server::IsServerSetup())
        {
            $cos = (!empty($_POST["p_app_os"])) ? $_POST["p_app_os"] : "";
            $cbg = (!empty($_POST["p_app_background"])) ? 1 : 0;
            $cdi = (!empty($_POST["p_app_device_id"])) ? $_POST["p_app_device_id"] : "";
            if($this->AppDeviceId != $cdi || empty($this->AppBackgroundMode)!=empty($cbg) || $this->AppOS!=$cos)
            {
                if(empty($this->AppBackgroundMode)!=empty($cbg) && empty($cbg))
                    DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_PUSH_MESSAGES . "` WHERE `device_hash`='" . DBManager::RealEscape(md5($this->AppDeviceId)) . "'; ");

                DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_OPERATORS . "` SET `updated`=".time().",`mobile_os`='" . DBManager::RealEscape($cos) . "',`mobile_device_id`='" . DBManager::RealEscape($cdi) . "',`mobile_background`='" . DBManager::RealEscape($cbg) . "' WHERE `system_id`='" . DBManager::RealEscape($this->SystemId) . "' LIMIT 1; ");
            }
        }
    }

    function AddPushMessage($_chatId, $_chatPartnerId, $_chatPartnerName, $_pushKey, $_pushValue="")
    {
        if(!empty(Server::$Configuration->File["gl_mpm"]) && ($this->LastActiveDB<(time()-Server::$Configuration->File["poll_frequency_clients"]*3)) && $this->Status != 2)
        {
            /*
            $_pushValue = Str::EscapePushMessage($_pushValue);

            if($_pushValue===null)
                return;
            */

            if(!defined("IS_PUSH_MESSAGE"))
                define("IS_PUSH_MESSAGE",true);

            $text = ($_pushKey == 0) ? ("Someone wants to chat with you") : ("New Chat Message");
            $text = Str::Cut($text,90,true);

            DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_PUSH_MESSAGES . "` WHERE `sent`=1 AND `created` < " . DBManager::RealEscape(time() - 60));
            DBManager::Execute(true, "INSERT IGNORE INTO `" . DB_PREFIX . DATABASE_PUSH_MESSAGES . "` (`id`, `created`, `device_id`, `device_hash`, `device_os`, `chat_id`, `chat_partner_id`, `push_key`, `push_value`, `IP`) VALUES ('" . DBManager::RealEscape(getId(32)) . "', " . time() . ", '" . DBManager::RealEscape($this->AppDeviceId) . "', '" . DBManager::RealEscape(md5($this->AppDeviceId)) . "',  '" . DBManager::RealEscape($this->AppOS) . "', '" . DBManager::RealEscape($_chatId) . "', '" . DBManager::RealEscape($_chatPartnerId) . "', '" . DBManager::RealEscape($_pushKey) . "', '" . DBManager::RealEscape($text) . "', '" . DBManager::RealEscape(Communication::GetIP()) . "');");
        }
    }

    function GetInputMaskLevel($_inputIndex,$_chat=true)
    {
        $lvl = 100;
        foreach($this->Groups as $groupid)
            if(isset(Server::$Groups[$groupid]))
            {
                if(Server::$Groups[$groupid]->IsDynamic)
                    continue;
                if($_chat)
                    $lvl = (isset(Server::$Groups[$groupid]->ChatInputsMasked[$_inputIndex])) ? min($lvl,Server::$Groups[$groupid]->ChatInputsMasked[$_inputIndex]) : 0;
                else
                    $lvl = (isset(Server::$Groups[$groupid]->TicketInputsMasked[$_inputIndex])) ? min($lvl,Server::$Groups[$groupid]->TicketInputsMasked[$_inputIndex]) : 0;
            }
        return ($lvl==100) ? 0 : $lvl;
    }

    function TextReplace($_text)
    {
        $_text = str_replace(array("%operator_name%","%name%"),$this->Fullname,$_text);
        $_text = str_replace(array("%operator_firstname%","%firstname%"),$this->Firstname,$_text);
        $_text = str_replace(array("%operator_lastname%","%lastname%"),$this->Lastname,$_text);
        $_text = str_replace(array("%id%","%operator_id%"),$this->UserId,$_text);
        $_text = str_replace(array("%operator_email%"),$this->Email,$_text);
        return $_text;
    }

    function AffectsStatistic($_allowBot=false)
    {
        return (($_allowBot || !$this->IsBot) /*&& $this->GetPermission(46) == PERMISSION_NONE*/);
    }

    static function GetSystemId($_userId)
    {
        if(is_array(Server::$Operators))
            foreach(Server::$Operators as $sysId => $intern)
                if($intern->UserId == $_userId)
                    return $sysId;
        return null;
    }

    static function GetUserId($_systemId)
    {
        foreach(Server::$Operators as $sysId => $intern)
            if($sysId == $_systemId)
                return $intern->UserId;
        return null;
    }

    static function IPValidate()
    {
        foreach(Server::$Operators as $op)
        {
            if(Communication::GetIP(true) == $op->IP && !empty($op->IP))
                return true;
        }
        return false;
    }

    static function PrepareConnection()
    {
        if(isset($_POST[POST_INTERN_REQUEST]) && $_POST[POST_INTERN_REQUEST]==CALLER_TYPE_INTERNAL)
        {
            Server::$Response = new Response();
            if(!isset($_POST[POST_INTERN_ADMINISTRATE]))
            {
                header("Content-Type: text/xml; charset=UTF-8");
                if(!Server::IsAvailable() && $_POST[POST_INTERN_SERVER_ACTION]==INTERN_ACTION_LOGIN && !isset($_POST[POST_INTERN_ACCESSTEST]))
                {
                    Server::$Response->SetValidationError(LOGIN_REPLY_DEACTIVATED);
                    exit(Server::$Response->GetXML());
                }
            }
        }
    }

    static function ReadParams()
    {
        if(!empty($_POST[POST_EXTERN_REQUESTED_INTERNID]))
            return Communication::GetParameter(POST_EXTERN_REQUESTED_INTERNID,"",$c,FILTER_SANITIZE_SPECIAL_CHARS,null,32);
        else if(!empty($_GET["operator"]))
        {
            $userid = Communication::GetParameter("operator","",$c,FILTER_SANITIZE_SPECIAL_CHARS,null,32,false,false);
            $sysid = Operator::GetSystemId($userid);

            if($sysid != null)
                return $userid;

            if(isset(Server::$Operators[$userid]))
                return Server::$Operators[$userid]->UserId;
        }
        //deprecated, compatibility
        else if(!empty($_GET["intid"]))
        {
            $userid = Communication::GetParameter("intid","",$c,FILTER_SANITIZE_SPECIAL_CHARS,null,32);
            $sysid = Operator::GetSystemId($userid);

            if($sysid != null)
                return $userid;

            if(isset(Server::$Operators[$userid]))
                return Server::$Operators[$userid]->UserId;
        }
        return "";
    }

    static function ValidateToken($_token)
    {
        foreach(Server::$Operators as $op)
            if($op->IsValidToken($_token))
                return true;
        return false;
    }

    static function GetSystemOperator(){
        $sop = new Operator();
        $sop->UserId =
        $sop->Name =
        $sop->SystemId = SYSTEM;
        return $sop;
    }
}

class Visitor extends BaseUser
{
	public $Browsers;
    public $ChatRequests = null;
	public $Response;
	public $IsChat = false;
	public $SystemInfo;
	public $Resolution;
	public $Host;
	public $Visits = 1;
	public $VisitsDay = 1;
	public $VisitId;
	public $VisitLast;
	public $GeoCity;
	public $GeoCountryName;
	public $GeoCountryISO2;
	public $GeoRegion;
	public $GeoLongitude = -522;
	public $GeoLatitude = -522;
	public $GeoTimezoneOffset = "+00:00";
	public $GeoISP;
	public $GeoResultId = 0;
	public $StaticInformation = false;
	public $ExitTime;
	public $Browser;
	public $OperatingSystem;
	public $Javascript;
	public $Signature;
	public $SignatureMismatch;
	public $IsCrawler;
	public $HasAcceptedChatRequest;
	public $HasDeclinedChatRequest;
	public $Comments = null;
    public $RecentVisits = null;
    public $FirstCall = true;
    public $VisitorData;
    public $Edited = 0;
    public $Device = 0;
    public $ScreenSharingStream;

    public static $IsActiveOverlayChat;
    public static $OpenChatExternal;
    public static $BrowserLanguage;
    public static $PollCount = -1;

	function __construct()
   	{
        $this->VisitorData = new UserData();
		$this->VisitId = getId(7);
		$this->Browsers = array();
		$this->UserId = func_get_arg(0);
		$this->FirstActive = time();
		$this->VisitLast = time();
   	}

    function GetRecentXML()
    {
        $xml = "<rdl v=\"".base64_encode($this->UserId)."\">";
        if(is_array($this->RecentVisits))
        {
            $this->LoadComments();
            $xml .= $this->GetCommentsXML();

            $this->LoadChatRequests();
            $xml .= $this->GetInvitesXML();

            foreach($this->RecentVisits as $entrance => $visit_id)
                $xml .= "<rv id=\"".base64_encode($visit_id)."\" e=\"".base64_encode($entrance)."\" />\r\n";
        }
        $xml .= "</rdl>";
        return $xml;
    }

    function LoadRecentVisits()
    {
        $result = DBManager::Execute(true, "SELECT `entrance`,`visit_id` FROM `" . DB_PREFIX . DATABASE_VISITORS . "` WHERE `visit_id`!='" . DBManager::RealEscape($this->VisitId) . "' AND `id`='" . DBManager::RealEscape($this->UserId) . "' ORDER BY `entrance` DESC;");
        while($row = DBManager::FetchArray($result))
        {
            $this->RecentVisits[$row["entrance"]] = $row["visit_id"];
        }
    }
	
	function Load()
	{
		if(func_num_args() == 1)
		{
			$this->SetDetails(func_get_arg(0),false);
		}
		else
		{
			$result = DBManager::Execute(true, "SELECT *,(SELECT count(*) FROM `" . DB_PREFIX . DATABASE_VISITORS . "` WHERE `id`='" . DBManager::RealEscape($this->UserId) . "') as `dcount` FROM `" . DB_PREFIX . DATABASE_VISITORS . "` WHERE `id`='" . DBManager::RealEscape($this->UserId) . "' ORDER BY `entrance` DESC;");
			if(DBManager::GetRowCount($result) >= 1)
				$this->SetDetails(DBManager::FetchArray($result),true);
		}
	}
	
	function SetDetails($_data,$_self,$_userData=true)
	{
		$this->FirstCall = ($_data["closed"] > 0);
		$this->VisitId = $_data["visit_id"];
        $this->Edited = $_data["edited"];

		if($_self && $this->FirstCall)
		{
			$this->Visits = $_data["visits"]+1;
			$this->VisitId = $_data["visit_id"] = getId(7);
			$this->VisitsDay = $_data["dcount"]+1;
			$this->FirstActive = time();
		}
		else
		{
			$this->Visits =	$_data["visits"];
            if($_self)
			    $this->VisitsDay = $_data["dcount"];
            else
                $this->Id = $_data["id"];
			$this->FirstActive = $_data["entrance"];
		}

		$this->VisitLast = $_data["visit_last"];
		$this->ExitTime = $_data["closed"];
		$this->IP = $_data["ip"];
		$this->SystemInfo = $_data["system"];
		$this->Language = $_data["language"];
        $this->Device = @$_data["device"];
		$this->Resolution = $_data["resolution"];
		$this->Host = $_data["host"];
		$this->GeoTimezoneOffset = $_data["timezone"];
		
		if(!empty($_data["longitude"]))
		{
			$this->GeoLongitude = $_data["longitude"];
			$this->GeoLatitude = $_data["latitude"];
		}
		if(!empty($_data["city"]))
			$this->GeoCity = $_data["city"];
		
		$this->GeoCountryISO2 = $_data["country"];
		if(isset($_data["countryname"]))
			$this->GeoCountryName = $_data["countryname"];

		$this->GeoRegion = $_data["region"];
		$this->GeoResultId = $_data["geo_result"];
		$this->GeoISP = $_data["isp"];
		$this->Browser = $_data["browser"];
		$this->OperatingSystem = $_data["system"];
		$this->Javascript = $_data["js"];
        $this->ScreenSharingStream = $_data["ss_stream"];

        if($_userData)
        {
            $this->VisitorData->Id = @$_data["data_id"];
            if(isset($_data["h_fullname"]))
                $this->VisitorData->SetDetails($_data,'data_id');
        }
	}

    function GetEntranceTime()
    {
        $t = time();
        foreach($this->Browsers as $browser)
        {
            $et = ($browser->History != null && isset($browser->History[0])) ? $browser->History[0]->Entrance : $t;
            $t = min($t,$et);
        }
        return $t;
    }

    function GetXML($row)
    {
        $xml = "<v i=\"".base64_encode($this->Id)."\" sss=\"".base64_encode($this->ScreenSharingStream)."\" ed=\"".base64_encode($this->Edited)."\" e=\"".base64_encode($this->FirstActive)."\" res=\"".base64_encode($this->Resolution)."\" ip=\"".base64_encode($this->IP)."\" tzo=\"".base64_encode($this->GeoTimezoneOffset)."\" lat=\"".base64_encode($this->GeoLatitude)."\" long=\"".base64_encode($this->GeoLongitude)."\" city=\"".base64_encode($this->GeoCity)."\" ctryi2=\"".base64_encode($this->GeoCountryISO2)."\" region=\"".base64_encode($this->GeoRegion)."\" js=\"".base64_encode($this->Javascript)."\" lang=\"".base64_encode($this->Language)."\" vts=\"".base64_encode($this->Visits)."\" ho=\"".base64_encode($this->Host)."\" gr=\"".base64_encode($this->GeoResultId)."\" isp=\"".base64_encode($this->GeoISP)."\" sys=\"".base64_encode($this->OperatingSystem)."\" dt=\"".base64_encode($this->Device)."\" bro=\"".base64_encode($this->Browser)."\" vl=\"".base64_encode($this->VisitLast)."\">";
        $ud = new UserData($row["h_fullname"],$row["h_email"],$row["h_company"],$row["h_phone"],@unserialize($row["h_customs"]),$row["h_text"]);
        $xml .= $ud->GetXML();

        $this->LoadComments();
        $xml .= $this->GetCommentsXML();

        $this->LoadChatRequests();
        $xml .= $this->GetInvitesXML();

        return $xml . "</v>";
    }

    function GetInvitesXML(){
        $xml = "";
        if(!empty($this->ChatRequests))
            foreach($this->ChatRequests as $invite)
                $xml .= $invite->GetXML();
        return $xml;
    }

    function GetCommentsXML()
    {
        $xml = "";
        if(!empty($this->Comments))
            foreach($this->Comments as $cid => $carray)
                $xml .=  " <c id=\"".base64_encode($cid)."\" c=\"".base64_encode($carray["created"])."\" o=\"".base64_encode($carray["operator_id"])."\">".base64_encode($carray["comment"])."</c>\r\n";
        return $xml;
    }

	function LoadBrowsers($_expired=false)
	{
		$this->Browsers = array();
        $limiter = (!$_expired) ? " AND `last_active` > ".(time()-Server::$Configuration->File["timeout_track"])." " : "";
        if($result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_VISITOR_BROWSERS . "` WHERE `visit_id`='" . DBManager::RealEscape($this->VisitId) . "' AND `visitor_id`='" . DBManager::RealEscape($this->UserId) . "'" . $limiter . "ORDER BY `created` ASC;"))
        {
            $this->FullyLoaded = true;
            while($row = DBManager::FetchArray($result))
            {
                $browser = $this->CreateBrowser($row,$_expired);
                $this->Browsers[count($this->Browsers)] = $browser;
            }
		}
	}

    function CreateBrowser($_row,$_loadHistory=false,$_loadChat=true)
    {
        if(empty($_row["is_chat"]))
        {
            $browser = new VisitorBrowser($_row["id"],$_row["visitor_id"],$_loadHistory);
            $browser->Query = (!empty($_row["query"])) ? CacheManager::GetDataTableValueFromId(DATABASE_VISITOR_DATA_QUERIES,"query",$_row["query"]) : "";
        }
        else
        {
            $browser = new VisitorChat($_row["visitor_id"],$_row["id"],false);
            if($_loadChat)
            {
                $browser->Load();
                if($browser->LastActive<(time()-Server::$Configuration->File["timeout_chats"]) && !empty($browser->OperatorId) && !Server::$Operators[$browser->OperatorId]->IsBot)
                {
                    $browser->CloseChat();
                    $browser->CloseWindow();
                }
            }
        }
        $browser->Created = $_row["created"];
        $browser->Overlay = !empty($_row["overlay"]);
        $browser->OverlayContainer = !empty($_row["overlay_container"]);
        $browser->LastActive = $_row["last_active"];
        return $browser;
    }

    function ApplyOverlayInputValues($group)
    {
        $newData = (!empty($this->VisitorData)) ? new UserData($this->VisitorData->Fullname,$this->VisitorData->Email,$this->VisitorData->Company,$this->VisitorData->Phone,$this->VisitorData->Customs,$this->VisitorData->Text) : new UserData();
        $newData->LoadFromLogin($group);
        if($this->VisitorData->IsDifference($newData))
        {
            $this->VisitorData = $newData;
            return true;
        }
        return false;
    }

    function LoadComments()
    {
        $this->Comments = array();
        if($result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_VISITOR_COMMENTS . "` WHERE `visitor_id`='" . DBManager::RealEscape($this->UserId) . "' ORDER BY `created` DESC;"))
            while($row = DBManager::FetchArray($result))
                $this->Comments[$row["id"]] = array("created"=>$row["created"],"operator_id"=>$row["operator_id"],"comment"=>$row["comment"]);
    }

    function SaveComment($_operatorId,$_comment)
    {
        DBManager::Execute(true, "INSERT IGNORE INTO `" . DB_PREFIX . DATABASE_VISITOR_COMMENTS . "` (`id`, `visitor_id`, `created`, `operator_id`, `comment`) VALUES ('" . DBManager::RealEscape(getId(32)) . "','" . DBManager::RealEscape($this->UserId) . "','" . DBManager::RealEscape(time()) . "','" . DBManager::RealEscape($_operatorId) . "','" . DBManager::RealEscape($_comment) . "');");
        $this->ForceUpdate();
    }

    function RemoveComment($_comment)
    {
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_VISITOR_COMMENTS . "` WHERE `visitor_id`='" . DBManager::RealEscape($this->UserId) . "' AND `comment`='" . DBManager::RealEscape($_comment) . "';");
        $this->ForceUpdate();
    }

    function ForceUpdate()
    {
        DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_VISITORS . "` SET `edited`='" . DBManager::RealEscape(time()) . "' WHERE `id`='" . DBManager::RealEscape($this->UserId) . "' ORDER BY `entrance` DESC LIMIT 1;");
    }

    function SetLanguage($_lang)
    {
        DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_VISITORS . "` SET `language`='" . DBManager::RealEscape($_lang) . "' WHERE `id`='" . DBManager::RealEscape($this->UserId) . "' ORDER BY `entrance` DESC LIMIT 1;");
    }

	function IsInChatWith($_operator)
	{
        if(is_array(Server::$Chats))
            foreach(Server::$Chats as $chat)
            {
                if($chat->UserId == $this->UserId && $chat->LastActive > (time()-Server::$Configuration->File["timeout_track"]) && $chat->LastActive > (time()-Server::$Configuration->File["timeout_chats"]) && !$chat->Closed)
                    if(isset($chat->Members[$_operator->SystemId]))
                        return true;
            }

		return false;
	}

	function Save($_resolution="",$_color="",$_timezone="",$_lat=0,$_long=0,$_countryiso2="",$_city="",$_region="",$_geotimezone="",$_isp="",$_geosspan=0,$_grid=1,$_js=true,$_fromCookie=false)
	{
        if($this->FirstCall)
		{
			if(!Is::Null(Cookie::Get("visits")) && $this->Visits==1)
				$this->Visits = Cookie::Get("visits")+1;

            Cookie::Set("visits",$this->Visits);

			if(!Is::Null(Cookie::Get("last_visit")))
				$this->VisitLast = Cookie::Get("last_visit");

            Cookie::Set("last_visit",time());

			$this->IP = Communication::GetIP();
    		$this->SystemInfo = ((isset($_SERVER["HTTP_USER_AGENT"])) ? trim($_SERVER["HTTP_USER_AGENT"]) : "");
			
			$localization = LocalizationManager::GetBrowserLocalization();
			$this->Language = $localization[0];
			
			if(!empty($localization[1]))
				$this->GeoCountryISO2 = $localization[1];

			$this->Resolution = (!empty($_resolution) && count($_resolution) == 2 && !empty($_resolution[0]) && !empty($_resolution[1])) ? $_resolution[0] . " x " . $_resolution[1] : "";
			$this->Resolution .= (!empty($_color)) ? " (" . $_color . " Bit)" : "";
			$this->GeoTimezoneOffset = SystemTime::GetLocalTimezone($_timezone);
			$this->GeoResult = 0;

			if(!empty(Server::$Configuration->File["gl_use_ngl"]) && $_js)
			{
                if(!Is::Null(Cookie::Get("geo_data")) && !Is::Null(Cookie::Get(GEO_LATITUDE)))
                {
                    $this->GeoLatitude = Cookie::Get(GEO_LATITUDE);
                    $this->GeoLongitude = Cookie::Get(GEO_LONGITUDE);
                    $this->GeoCountryISO2 = Cookie::Get(GEO_COUNTRY_ISO_2);
                    $this->GeoCity = Cookie::Get(GEO_CITY);
                    $this->GeoRegion = Cookie::Get(GEO_REGION);
                    $this->GeoTimezoneOffset = Cookie::Get(GEO_TIMEZONE);
                    $this->GeoISP = Cookie::Get(GEO_ISP);
                    $_fromCookie = true;
                }
				else if(!empty($_lat) && $_lat > -180)
				{
					Cookie::Set(GEO_LATITUDE,$this->GeoLatitude = $_lat);
					Cookie::Set(GEO_LONGITUDE,$this->GeoLongitude = $_long);
					Cookie::Set(GEO_COUNTRY_ISO_2,$this->GeoCountryISO2 = $_countryiso2);
					Cookie::Set(GEO_CITY,$this->GeoCity = $_city);
					Cookie::Set(GEO_REGION,$this->GeoRegion = $_region);
					Cookie::Set(GEO_TIMEZONE,$this->GeoTimezoneOffset = $_geotimezone);
					Cookie::Set(GEO_ISP,$this->GeoISP = $_isp);
					Cookie::Set("geo_data",time());
				}
				else if(!empty($_lat))
				{
					$this->GeoLatitude = $_lat;
					$this->GeoLongitude = $_long;
				}

				GeoTracking::SpanRemove(false);
				if($_fromCookie)
					$this->GeoResultId = 6;
				else if(!Is::Null($span=GeoTracking::SpanExists()))
				{
					if($span > (time()+CONNECTION_ERROR_SPAN))
						$this->GeoResultId = 5;
					else
						$this->GeoResultId = 4;
				}
				else
				{
					if($_lat == -777)
						$this->GeoResultId = 5;
					else if($_lat == -522)
						$this->GeoResultId = 2;
					else if($_grid != 4)
						$this->GeoResultId = 3;
					else
						$this->GeoResultId = $_grid;
				}
			}
			else
				$this->GeoResultId = 7;
				
			Server::InitDataBlock(array("COUNTRIES"));
			if(isset(Server::$CountryAliases[$this->GeoCountryISO2]))
				$this->GeoCountryISO2 = Server::$CountryAliases[$this->GeoCountryISO2];

			$detector = new DeviceDetector();
			$detector->DetectBrowser($this->Host);

			if($detector->AgentType == AGENT_TYPE_BROWSER || $detector->AgentType == AGENT_TYPE_UNKNOWN)
			{
				$detector->DetectOperatingSystem($this->Host);
				$bid = $this->GetBrowserId($detector->Browser,$detector->AgentType);
				$oid = $this->GetOSId($detector->OperatingSystem);
				$this->CreateSignature();

                $devicetype = 0;
                if($detector->IsTablet)
                    $devicetype = 1;
                else if($detector->IsMobile)
                    $devicetype = 2;

                DBManager::Execute(true, $d= "INSERT IGNORE INTO `" . DB_PREFIX . DATABASE_VISITORS . "` (`id`, `entrance`, `host`,`ip`,`system`,`browser`, `visits`,`visit_id`,`visit_last`,`resolution`, `language`, `country`, `city`, `region`, `isp`, `timezone`, `latitude`, `longitude`, `geo_result`, `js`, `signature`, `data_id`, `device`) VALUES ('" . DBManager::RealEscape($this->UserId) . "', '" . DBManager::RealEscape(time()) . "', '" . DBManager::RealEscape($this->Host) . "', '" . DBManager::RealEscape($this->IP) . "', '" . DBManager::RealEscape($oid) . "','" . DBManager::RealEscape($bid) . "', '" . DBManager::RealEscape($this->Visits) . "', '" . DBManager::RealEscape($this->VisitId) . "','" . DBManager::RealEscape($this->VisitLast) . "', '" . DBManager::RealEscape(CacheManager::GetDataTableIdFromValue(DATABASE_VISITOR_DATA_RESOLUTIONS, "resolution", $this->Resolution, false, 32)) . "', '" . DBManager::RealEscape(substr(strtoupper($this->Language), 0, 5)) . "','" . DBManager::RealEscape($this->GeoCountryISO2) . "', '" . DBManager::RealEscape(CacheManager::GetDataTableIdFromValue(DATABASE_VISITOR_DATA_CITIES, "city", $this->GeoCity, false)) . "', '" . DBManager::RealEscape(CacheManager::GetDataTableIdFromValue(DATABASE_VISITOR_DATA_REGIONS, "region", $this->GeoRegion, false)) . "', '" . DBManager::RealEscape(CacheManager::GetDataTableIdFromValue(DATABASE_VISITOR_DATA_ISPS, "isp", utf8_encode($this->GeoISP), false)) . "', '" . DBManager::RealEscape($this->GeoTimezoneOffset) . "', '" . DBManager::RealEscape($this->GeoLatitude) . "', '" . DBManager::RealEscape($this->GeoLongitude) . "', '" . DBManager::RealEscape($this->GeoResultId) . "', '" . DBManager::RealEscape($_js ? 1 : 0) . "', '" . DBManager::RealEscape($this->Signature) . "', '" . DBManager::RealEscape($this->VisitorData->Save()) . "', " . intval($devicetype) . ");");

                if($this->VisitsDay > 1 && DBManager::GetAffectedRowCount() == 1)
                    DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_VISITORS . "` SET `visit_latest`=0 WHERE `id`='" . DBManager::RealEscape($this->UserId) . "' AND `visit_id`!='" . DBManager::RealEscape($this->VisitId) . "';");
            }
			else if(STATS_ACTIVE)
			{
				$this->IsCrawler = true;
				Server::$Statistic->ProcessAction(ST_ACTION_LOG_CRAWLER_ACCESS,array($this->GetCrawlerId($detector->Browser),null));
			}
		}
        else if(isset($_GET["pto"]))
        {
            $localization = LocalizationManager::GetBrowserLocalization();
            if(is_array($localization) && !empty($localization[0]) && $localization[0] != $this->Language)
            {
                $this->SetLanguage($localization[0]);
                $this->ForceUpdate();
            }
        }
	}
	
	function ResolveHost()
	{
		$this->Host = Communication::GetHost();
	}
	
	function CreateSignature()
	{
		$sig = @$_SERVER["HTTP_USER_AGENT"].@$_SERVER["HTTP_ACCEPT"].@$_SERVER["HTTP_ACCEPT_LANGUAGE"].@$_SERVER["HTTP_ACCEPT_CHARSET"];
		$this->Signature = md5(Communication::GetIP() . $sig);
	}
	
	function GetCrawlerId($_crawler)
	{
        return CacheManager::GetDataTableIdFromValue(DATABASE_VISITOR_DATA_CRAWLERS,"crawler",$_crawler);
	}

	function GetOSId($_osname)
	{
        return CacheManager::GetDataTableIdFromValue(DATABASE_VISITOR_DATA_SYSTEMS,"system",$_osname);
	}
	
	function GetBrowserId($_browser)
	{
        return CacheManager::GetDataTableIdFromValue(DATABASE_VISITOR_DATA_BROWSERS,"browser",$_browser);
	}

	function SaveTicket($_group,$_country,$_cmb=false,$_custom=true,$_url="",$changed=false)
	{
        $this->Load();

        $isSpam = (!empty(Server::$Configuration->File["gl_sft"]) && Visitor::CreateSPAMFilter($this->UserId));

        $group = Server::$Groups[$_group];

        $browserLangDetect = true; //!((isset(Server::$Configuration->File["gl_dsbl"]) && !Server::$Configuration->File["gl_dsbl"]));

        $lang = strtoupper((!empty($this->Language) && $browserLangDetect) ? $this->Language : Server::$Configuration->File["gl_default_language"]);

        $plang = LocalizationManager::ReadParams();
        if(!empty($plang))
            $lang = strtoupper($plang);

        $pdm = PredefinedMessage::GetByLanguage($group->PredefinedMessages,$lang);
        if($pdm != null)
            $lang = $pdm->LangISO;

        $ticket = null;
        $message = null;
        $saveTicket = true;

		if(!(isset(Server::$Configuration->File["gl_mmvt"]) && empty(Server::$Configuration->File["gl_mmvt"])))
        {
			$existingOpenTicket = Ticket::GetOpenByUserId($this->UserId,$this->FirstActive);
			if($existingOpenTicket != null)
			{
				if($existingOpenTicket->Group == $_group)
				{
					$ticket = $existingOpenTicket;
					$message = new TicketMessage(getId(32),true);
					$ticket->Messages[] = $message;
					$ticket->Language = $lang;
					$ticket->SetLanguage($lang);
					$saveTicket = false;
				}
			}
		}

        if($ticket == null)
        {
		    $ticket = new Ticket(CacheManager::GetObjectId("ticket_id",DATABASE_TICKETS),$lang);
            $message = $ticket->Messages[0];
            $message->Id = $ticket->Id;
        }

        $message->IP = Communication::GetIP();
        $email = $group->GetServerInput(Server::$Inputs[112],false,"",$changed);

        Server::InitDataBlock(array("FILTERS"));

        if(Server::$Filters->MatchEmail($email,""))
        {
            $this->AddFunctionCall("lz_chat_mail_callback(true);",false);
            return false;
        }

		if(!isTicketFlood() && !$isSpam && !(defined("FILTER_ALLOW_TICKETS") && !FILTER_ALLOW_TICKETS))
		{
            Chat::SetTicketId("",$this->UserId,$ticket->Id);
			Server::InitDataBlock(array("INPUTS"));
			$ticket->SenderUserId = $message->SenderUserId = $this->UserId;
			$ticket->Group = $_group;
            $ticket->Channel = ($_cmb) ? 2 : 0;
            $message->Fullname = $this->Browsers[0]->Fullname = $group->GetServerInput(Server::$Inputs[111],false,"",$changed);
            $message->Email = $this->Browsers[0]->Email = $email;
            $message->Company = $this->Browsers[0]->Company = $group->GetServerInput(Server::$Inputs[113],false,"",$changed);
            $message->Phone = $this->Browsers[0]->Phone = $group->GetServerInput(Server::$Inputs[116],false,"",$changed);
            $message->Text = $group->GetServerInput(Server::$Inputs[114],false,"",$changed);
            $message->CallMeBack = $_cmb;
            $message->Country = $_country;
            $message->EmailId = getId(32);
            $message->ChannelId = getId(32);
            $message->Edited = $message->Created = time();
            $message->AttachTemporaryFiles($this->UserId);

            if(empty($_url))
                $_url = Visitor::GetLastURLFromVisitor($this->UserId);

            $message->Subject = $_url;
			$this->Browsers[0]->DesiredChatGroup = $ticket->Group;
			$this->Browsers[0]->SetCookieGroup();

			if($_custom)
            {
				foreach(Server::$Inputs as $index => $input)
				{
 					if($input->Active && $input->Custom)
					{
                        $value = $group->GetServerInput($input,false,"",$changed);

    					if($input->Type != "File" && (!empty($value)||$value==="0"))
                        {
                            $message->Customs[$index] = $value;
                            $this->Browsers[0]->Customs[$index] = $value;
                        }
					}
				}

                $ud = new UserData($message->Fullname,$message->Email,$message->Company,$message->Phone,$message->Customs);
                $ud->Save();
                $ud->SaveToCookie();
            }

			if(Server::$Configuration->File["gl_adct"] == 1 || !(!empty(Server::$Configuration->File["gl_rm_om"]) && Server::$Configuration->File["gl_rm_om_time"] == 0))
            {
                if($saveTicket)
                {
                    $ticket->Save();
                    $ticket->AutoAssignEditor();
                }
                else
                {
                    $message->Save($ticket->Id);
                }
                $ticket->SetLastUpdate(time());
            }

			$this->AddFunctionCall("lz_chat_mail_callback(true);",false);

            if(!empty($_POST[POST_EXTERN_REQUESTED_INTERNID]) && !empty(Server::$Operators[Operator::GetSystemId(Encoding::Base64UrlDecode($_POST[POST_EXTERN_REQUESTED_INTERNID]))]))
            {
                $TicketEditor = new TicketEditor($ticket->Id);
                $TicketEditor->Editor = Operator::GetSystemId(Encoding::Base64UrlDecode($_POST[POST_EXTERN_REQUESTED_INTERNID]));
                $TicketEditor->Status = 0;
                $TicketEditor->Save();
            }

            if(!empty(Server::$Configuration->File["gl_mpm"]))
                foreach(Server::$Operators as $operator)
                    if($operator->IsInPushMessageState())
                        if($operator->HasAccessToTicket($ticket))
                            $operator->AddPushMessage($ticket->Id, $this->SystemId, $message->Fullname, 2, $message->Text);

			return $ticket;
		}
		else
			$this->AddFunctionCall("lz_chat_mail_callback(false);",false);
		return false;
	}
	
	function AddFunctionCall($_call,$_overwrite=false,$_prepend=false)
	{
        $spacer = "";//\r\n\r\n";
		if(empty($this->Response))
			$this->Response = "";
        if($_prepend)
            $this->Response = $spacer . $_call . $spacer . $this->Response;
		else if($_overwrite)
			$this->Response = $spacer . $_call;
		else
			$this->Response .= $spacer . $_call;
	}

    function AddBrowser($_browser)
    {
        for($i=0;$i<count($this->Browsers);$i++)
        {
            if($this->Browsers[$i]->BrowserId == $_browser->BrowserId)
            {
                $this->Browsers[$i] = $_browser;
                return;
            }
        }
        $this->Browsers[$i] = $_browser;
    }

    function GetBrowser($_bid)
    {
        for($i=0;$i<count($this->Browsers);$i++)
        {
            if($this->Browsers[$i]->BrowserId == $_bid)
            {
                return $this->Browsers[$i];
            }
        }
        return null;
    }
	
	function IsActivity($_browser,$_noBotChats=false,$_fromDatabase=true)
	{
		if($this->IsInChat($_noBotChats,null,$_fromDatabase))
			return true;
		if($_browser != null && $_browser->IsActivity())
			return true;
        else if($_browser == null)
            foreach($this->Browsers as $browser)
                if($browser->IsActivity())
                    return true;
		return false;
	}
	
	function IsInChat($_noBotChats=false,$_browser=null,$_fromDatabase=false)
	{
        if(!$_fromDatabase)
        {
            foreach($this->Browsers as $browser)
            {
                if($browser->Type == BROWSER_TYPE_CHAT && $browser->LastActive > (time()-Server::$Configuration->File["timeout_chats"]) && (!empty($browser->ChatId) || $browser->Waiting) && !$browser->Declined)
                {
                    if(!$_noBotChats || (!empty($browser->OperatorId) && !Server::$Operators[$browser->OperatorId]->IsBot) || $browser->Waiting)
                        if(!(!empty($_browser) && $_browser->BrowserId == $browser->BrowserId) || Str::EndsWith($browser->BrowserId,"_OVL"))
                        {
                            return true;
                        }
                }
                if(is_array(Server::$Chats))
                    foreach(Server::$Chats as $chat)
                    {
                        if($chat->UserId == $this->UserId && $chat->LastActive > (time()-Server::$Configuration->File["timeout_track"]) && $chat->LastActive > (time()-Server::$Configuration->File["timeout_chats"]) && !$chat->Closed)
                            return true;
                    }
            }
        }
        else
        {
            $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_VISITOR_CHATS . "` WHERE `visitor_id`='" . DBManager::RealEscape($this->UserId) . "' AND `last_active` > " . (time() - Server::$Configuration->File["timeout_chats"]) . " AND (`status` > 0 OR `waiting`=1) AND `internal_declined`=0 AND `exit`=0;");
            while($row = DBManager::FetchArray($result))
            {
                if(!$_noBotChats || (!empty(Server::$Operators[$row["request_operator"]]) && !Server::$Operators[$row["request_operator"]]->IsBot) || !empty($row["waiting"]))
                    if(!(!empty($_browser) && $_browser->BrowserId == $row["browser_id"]) || Str::EndsWith($row["browser_id"],"_OVL"))
                        return true;
            }
        }
		return false;
	}

    function GetLastChatOperator($_noBotChats=false)
    {
        $result = DBManager::Execute(true, "SELECT `chat_id`,`internal_id` FROM `" . DB_PREFIX . DATABASE_CHAT_ARCHIVE . "` WHERE `external_id` = '" . DBManager::RealEscape($this->UserId) . "';");
        while($row = DBManager::FetchArray($result))
            if(!$_noBotChats || (!empty(Server::$Operators[$row["internal_id"]]) && !Server::$Operators[$row["internal_id"]]->IsBot))
                return $row["internal_id"];
        return "";
    }

	function WasInChat($_checkArchive=true)
	{
        $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_VISITOR_CHATS . "` WHERE `visitor_id`='" . DBManager::RealEscape($this->UserId) . "' AND `chat_id`>0;");
        if($row = DBManager::FetchArray($result))
        {
            return true;
        }

        if($_checkArchive)
        {
            $lco = $this->GetLastChatOperator(false);
            if(!empty($lco))
                return true;
        }

        return false;
	}
	
	function GetChatRequestResponses()
	{
		if($result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_CHAT_REQUESTS . "` WHERE `receiver_user_id`='" . DBManager::RealEscape($this->UserId) . "' ORDER BY `closed` ASC,`created` DESC;"))
		{
			while($row = DBManager::FetchArray($result))
			{
				if(!empty($row["declined"]))
					$this->HasDeclinedChatRequest = true;
				if(!empty($row["accepted"]))
					$this->HasAcceptedChatRequest = true;
			}
		}
	}

    function LoadChatRequests($_timeout=false)
    {
        if(!is_array($this->ChatRequests))
        {
            $this->ChatRequests = array();
            if($result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_CHAT_REQUESTS . "` WHERE `receiver_user_id`='" . DBManager::RealEscape($this->UserId) . "' ORDER BY `created` DESC;"))
                while($row = DBManager::FetchArray($result))
                {
                    if(!empty($row["declined"]))
                        $this->HasDeclinedChatRequest = true;
                    if(!empty($row["accepted"]))
                        $this->HasAcceptedChatRequest = true;

                    $request = new ChatRequest($row);
                    $found = false;

                    foreach($this->Browsers as $browser)
                        if($browser->BrowserId == $row["receiver_browser_id"])
                        {
                            if($browser->ChatRequests == null)
                                $browser->ChatRequests = array();

                            $browser->ChatRequests[] = $request;

                            $found=true;
                        }
                    if($_timeout && !$found && empty($this->Canceled) && !$request->Closed)
                        $request->Cancel("Timeout","1");

                    $this->ChatRequests[] = $request;
                }
        }
    }

    function GetInputData($_inputIndex,$_chat=true)
    {
        $data = array(111=>$this->VisitorData->Fullname,112=>$this->VisitorData->Email,113=>$this->VisitorData->Company,114=>$this->VisitorData->Text,116=>$this->VisitorData->Phone);
        if(isset($data[$_inputIndex]))
            $value = $data[$_inputIndex];
        else if(isset($this->VisitorData->Customs[$_inputIndex]))
            $value = $this->VisitorData->Customs[$_inputIndex];
        else
            return "";

        if(isset(Server::$Operators[CALLER_SYSTEM_ID]))
        {
            $lvl = Server::$Operators[CALLER_SYSTEM_ID]->GetInputMaskLevel($_inputIndex,$_chat);
            if($lvl > 0)
                return OperatorRequest::MaskData($value,$lvl);
        }
        return $value;
    }

    function TextReplace($_text)
    {
        Server::InitDataBlock(array("COUNTRIES"));
        $_text = str_replace("%external_ip%",$this->IP,$_text);
        $_text = str_replace("%location_city%",CacheManager::GetDataTableValueFromId(DATABASE_VISITOR_DATA_CITIES,"city",$this->GeoCity,false,true),$_text);
        $_text = str_replace("%location_country_iso%",$this->GeoCountryISO2,$_text);
        $_text = str_replace("%location_country%",@Server::$Countries[$this->GeoCountryISO2],$_text);
        $_text = str_replace("%location_region%",CacheManager::GetDataTableValueFromId(DATABASE_VISITOR_DATA_REGIONS,"region",$this->GeoRegion,false,true),$_text);

        $_text = str_replace(array("%external_name%","%USERNAME%"),$this->VisitorData->Fullname,$_text);
        $nameparts = explode(" ",$this->VisitorData->Fullname);

        if(count($nameparts)>2)
        {
            $_text = str_replace(array("%external_firstname%"),trim($nameparts[0]),$_text);
            $nameparts[0] = "";
            $_text = str_replace(array("%external_lastname%"),trim(implode(" ",$nameparts)),$_text);
        }
        else if(count($nameparts)==2)
        {
            $_text = str_replace(array("%external_firstname%"),trim($nameparts[0]),$_text);
            $_text = str_replace(array("%external_lastname%"),trim($nameparts[1]),$_text);
        }
        else if(count($nameparts)==1)
        {
            $_text = str_replace(array("%external_firstname%","%USERNAME%"),trim($nameparts[0]),$_text);
            $_text = str_replace(array("%external_lastname%","%USERNAME%"),"",$_text);
        }
        else
        {
            $_text = str_replace(array("%external_firstname%","%USERNAME%"),"",$_text);
            $_text = str_replace(array("%external_lastname%","%USERNAME%"),"",$_text);
        }


        $_text = str_replace(array("%external_email%","%USEREMAIL%"),$this->VisitorData->Email,$_text);
        $_text = str_replace(array("%external_company%","%USERCOMPANY%"),$this->VisitorData->Company,$_text);
        $_text = str_replace("%external_phone%",$this->VisitorData->Phone,$_text);
        //$_text = str_replace(array("%question%","%USERQUESTION%","%mailtext%"),$this->VisitorData->Text,$_text);

        foreach(Server::$Inputs as $index => $input)
            if($input->Active && $input->Custom)
            {
                if($input->Type == "CheckBox")
                    $_text = str_replace("%custom".($index)."%",((!empty($this->VisitorData->Customs[$index])) ? LocalizationManager::$TranslationStrings["client_yes"] : LocalizationManager::$TranslationStrings["client_no"]),$_text);
                else if(!empty($this->VisitorData->Customs[$index]))
                    $_text = str_replace("%custom".($index)."%",$input->GetClientValue($this->VisitorData->Customs[$index]),$_text);
                else
                    $_text = str_replace("%custom".($index)."%","",$_text);
            }
            else
                $_text = str_replace("%custom".($index)."%","",$_text);


        return $_text;
    }

    function ReloadGroups($_overlay=false,$_preSelect=true)
    {
        Server::InitDataBlock(array("INTERNAL","FILTERS"));

        $grParam = UserGroup::ReadParams();
        $opParam = Operator::ReadParams();

        if(!empty($this->Browsers[0]->GroupId) && Visitor::$IsActiveOverlayChat)
            $this->Browsers[0]->DesiredChatGroup = $this->Browsers[0]->GroupId;
        else if(!empty($grParam) && empty($this->Browsers[0]->DesiredChatGroup))
            $this->Browsers[0]->DesiredChatGroup = $grParam;

        if(!empty($opParam))
            $this->Browsers[0]->SetDesiredChatPartner(Operator::GetSystemId($opParam));

        $groupbuilder = new GroupBuilder($this->Browsers[0]->DesiredChatGroup,$this->Browsers[0]->DesiredChatPartner);
        $groupbuilder->Generate($this,true);

        if(in_array($this->Browsers[0]->DesiredChatGroup,$groupbuilder->GroupValues["groups_hidden"]))
            $this->Browsers[0]->DesiredChatGroup = $grParam;

        if(!empty($opParam))
            $this->Browsers[0]->SetDesiredChatPartner(Operator::GetSystemId($opParam));

        $_preSelect = ($_preSelect) ? Encoding::Base64UrlEncode($this->Browsers[0]->DesiredChatGroup) : "";

        $this->AddFunctionCall("OverlayChatWidgetV2.SetGroups(\"" . $groupbuilder->Result . "\",'". $_preSelect ."');",false,$_overlay);
    }

    function LoadVisitorData()
    {
        $result = DBManager::Execute(true, "SELECT *,`t2`.`id` AS `id` FROM `" . DB_PREFIX . DATABASE_VISITORS . "` AS `t1` INNER JOIN `" . DB_PREFIX . DATABASE_USER_DATA . "` AS `t2` ON `t1`.`data_id`=`t2`.`id` WHERE `t1`.`id`='" . DBManager::RealEscape($this->UserId) . "';");
        if($result)
            if($row = DBManager::FetchArray($result))
            {
                $vd = new UserData();
                $vd->SetDetails($row);
                $this->VisitorData = $vd;
                return !$vd->IsEmpty();
            }
        return false;
    }

    function ApplyVisitorData()
    {
        DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_VISITORS . "` SET `data_id`='" . DBManager::RealEscape($this->VisitorData->Save()) . "' WHERE `id`='" . DBManager::RealEscape($this->UserId) . "';");
        if(DBManager::GetAffectedRowCount()>0)
            $this->ForceUpdate();
    }

    function ToggleScreenSharing($_browserId)
    {
        DBManager::Execute(true, $d = "UPDATE `" . DB_PREFIX . DATABASE_VISITORS . "` SET `ss_stream`='" . DBManager::RealEscape($_browserId) . "' WHERE `id`='" . DBManager::RealEscape($this->UserId) . "' ORDER BY `entrance` DESC LIMIT 1;");
    }

    static function CreateSPAMFilter($_userId,$_base64=true)
    {
        if(!empty(Server::$Configuration->File["gl_sfa"]))
        {
            $filterkeys = array(0=>Server::$Configuration->File["gl_sfv"]);
            if(strpos(Server::$Configuration->File["gl_sfv"],",") !== -1)
                $filterkeys = explode(",",Server::$Configuration->File["gl_sfv"]);

            foreach($filterkeys as $fvalue)
            {
                $fvalue = trim($fvalue);
                foreach($_GET as $gvalue)
                {
                    $ivalue = ($_base64) ? Encoding::Base64UrlDecode($gvalue) : $gvalue;
                    if(Is::WildcardMatch($fvalue,$ivalue,true))
                    {
                        Filter::Create(Communication::GetIP(),$_userId,"AUTO SPAM Filter: " . $fvalue);
                        return true;
                    }
                }
                foreach($_POST as $pvalue)
                {
                    $ivalue = ($_base64) ? Encoding::Base64UrlDecode($pvalue) : $pvalue;
                    if(Is::WildcardMatch($fvalue,$ivalue,true))
                    {
                        Filter::Create(Communication::GetIP(),$_userId,"AUTO SPAM Filter: " . $fvalue);
                        return true;
                    }
                }
            }
        }
        return false;
    }

    static function IDValidate($_id="")
    {
        if(empty($_id))
            return getId(USER_ID_LENGTH);
        else if(strlen($_id) != USER_ID_LENGTH)
            return getId(USER_ID_LENGTH);
        else if(function_exists("ctype_alnum") && !ctype_alnum($_id))
            return getId(USER_ID_LENGTH);
        return $_id;
    }

    static function GetLastURLFromVisitor($_visitorId)
    {
        $result = DBManager::Execute(true, "SELECT `untouched` FROM `" . DB_PREFIX . DATABASE_VISITOR_BROWSERS . "` AS `t1` INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_BROWSER_URLS . "` AS `t2` ON `t1`.`id`=`t2`.`browser_id` WHERE `untouched` NOT LIKE '%/chat.php%' AND `t1`.`visitor_id`='" . DBManager::RealEscape($_visitorId) . "' ORDER BY `t2`.`entrance` DESC LIMIT 1;");
        while($row = DBManager::FetchArray($result))
            return $row["untouched"];
        return "";
    }

    static function Build($_fullList=false,$_sqlwhere="",$_limit="",$_created=0)
    {
        if(DBManager::$Connected)
        {
            Server::InitDataBlock(array("COUNTRIES"));
            Server::$Visitors = $tvisitors = $tbrowsers = array();

            if(!$_fullList)
                $_sqlwhere = " WHERE `closed`=0";

            $result = DBManager::Execute(true, "SELECT *,`t1`.`id` AS `id` FROM `" . DB_PREFIX . DATABASE_VISITORS . "` AS `t1` INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_CITIES . "` AS `t3` ON `t1`.`city`=`t3`.`id` INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_REGIONS . "` AS `t4` ON `t1`.`region`=`t4`.`id` INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_ISPS . "` AS `t5` ON `t1`.`isp`=`t5`.`id` INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_SYSTEMS . "` AS `t6` ON `t1`.`system`=`t6`.`id` INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_RESOLUTIONS . "` AS `t8` ON `t1`.`resolution`=`t8`.`id` INNER JOIN `" . DB_PREFIX . DATABASE_USER_DATA . "` AS `t9` ON `t1`.`data_id`=`t9`.`id`" . $_sqlwhere . " ORDER BY `entrance` ASC" . $_limit . ";");

            if(!$result)
                return 0;

            while($row = DBManager::FetchArray($result))
            {
                $fa = $row["entrance"];
                if(isset($tvisitors[$row["id"]]))
                    $fa = min($tvisitors[$row["id"]]->FirstActive,$fa);
                if(!empty(Server::$Countries[$row["country"]]))
                    $row["countryname"] = Server::$Countries[$row["country"]];
                if(!isset($vcount[$row["id"]]))
                    $vcount[$row["id"]]=0;

                $vcount[$row["id"]]++;
                $row["dcount"] = $vcount[$row["id"]];
                $visitor = new Visitor($row["id"]);
                $visitor->Load($row);
                $visitor->FirstActive = $fa;
                $tvisitors[$row["id"]] = $visitor;
                $tvisitors[$row["id"]]->FirstActive = min($tvisitors[$row["id"]]->FirstActive,$row["entrance"]);
            }

            $minEntrance = time();

            if($_fullList)
                $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_VISITOR_BROWSERS . "` WHERE `created` > " . intval($_created) . " ORDER BY `created` ASC;");
            else
                $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_VISITOR_BROWSERS . "` WHERE `last_active` > " . intval(time() - @Server::$Configuration->File["timeout_track"]) . " ORDER BY `created` ASC;");

            if($result)
                while($row = DBManager::FetchArray($result))
                {
                    if(isset($tvisitors[$row["visitor_id"]]) && ($tvisitors[$row["visitor_id"]]->VisitId == $row["visit_id"] || $_fullList))
                    {
                        $browser = $tvisitors[$row["visitor_id"]]->CreateBrowser($row,false,false);
                        $tbrowsers[$browser->BrowserId] = $browser;
                        $minEntrance = min($minEntrance,$row["created"]);
                    }
                }

            if($_fullList)
            {
                if($result = DBManager::Execute(true, "SELECT `" . DB_PREFIX . DATABASE_VISITOR_BROWSER_URLS . "_sorted`.`browser_id`,`" . DB_PREFIX . DATABASE_VISITOR_BROWSER_URLS . "_sorted`.`title` as `url_title`,`treftitle`.`title` as `ref_title`,`turldom`.`domain` as `url_dom`,`turlpath`.`path` as `url_path`,`trefdom`.`domain` as `ref_dom`,`trefpath`.`path` as `ref_path`,`entrance`,`params`,`untouched`,`ref_untouched` FROM (SELECT * FROM `" . DB_PREFIX . DATABASE_VISITOR_BROWSER_URLS . "` ORDER BY `entrance` ASC) AS `" . DB_PREFIX . DATABASE_VISITOR_BROWSER_URLS . "_sorted` INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_PAGES . "` AS `turl` ON `" . DB_PREFIX . DATABASE_VISITOR_BROWSER_URLS . "_sorted`.`url`=`turl`.`id` INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_PAGES . "` AS `tref` ON `" . DB_PREFIX . DATABASE_VISITOR_BROWSER_URLS . "_sorted`.`referrer`=`tref`.`id` INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_DOMAINS . "` AS `trefdom` ON `tref`.`domain`=`trefdom`.`id` INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_DOMAINS . "` AS `turldom` ON `turl`.`domain`=`turldom`.`id` INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_PATHS . "` AS `trefpath` ON `tref`.`path`=`trefpath`.`id` INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_PATHS . "` AS `turlpath` ON `turl`.`path`=`turlpath`.`id` INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_TITLES . "` AS `treftitle` ON `tref`.`title`=`treftitle`.`id`;"))
                    while($row = DBManager::FetchArray($result))
                        if(isset($tbrowsers[$row["browser_id"]]))
                            $tbrowsers[$row["browser_id"]]->History[] = new HistoryURL($row);
            }
            else
            {
                if($result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_VISITOR_BROWSER_URLS . "` WHERE `entrance` >= " . intval($minEntrance) . " ORDER BY `entrance` ASC;"))
                    while($row = DBManager::FetchArray($result))
                        if(isset($tbrowsers[$row["browser_id"]]))
                            $tbrowsers[$row["browser_id"]]->History[] = new HistoryURL($row,true);
            }

            foreach($tbrowsers as $i => $browser)
            {
                $tbrowsers[$i]->SetFirstCall(count($browser->History)==0);
                if(isset($tvisitors[$browser->UserId]))
                {
                    if($_fullList && count($browser->History)==0)
                        continue;

                    $tvisitors[$browser->UserId]->Browsers[count($tvisitors[$browser->UserId]->Browsers)] = $browser;
                }
            }

            foreach($tvisitors as $vid => $visitor)
                if(count($visitor->Browsers)>0)
                    Server::$Visitors[$vid] = $visitor;

            return count($tvisitors);
        }
        return 0;
    }

    static function GetNoName($_basename)
    {
        $mod = 111;
        for ($i = 0; $i < strlen($_basename); $i++)
        {
            $digit = substr($_basename,$i,1);

            if(is_numeric($digit))
            {
                $mod = ($mod + ($mod * (16 + $digit)) % 1000);
                if ($mod % 10 == 0)
                    $mod += 1;
            }
        }
        return substr($mod,strlen($mod)-4,4);
    }

    static function CloseAllOverlays($_visitorId)
    {
    }
}

class VisitorBrowser
{
    public $DesiredChatGroup;
    public $DesiredChatPartner;
	public $BrowserId;
	public $History;
	public $ChatRequests = array();
	public $OverlayBox;
	public $Alert;
	public $Type = BROWSER_TYPE_BROWSER;
	public $Query;
    public $Code = "";
	public $VisitId;
    public $FirstActive;
    public $LastActive;
	public $Overlay;
	public $OverlayContainer;
    public $UpdateParams = array();
    public $Created;
    public $Closed;

    private $FirstCall = true;

    function __construct($_browserid,$_userid,$_history=true)
    {
        $this->BrowserId = $_browserid;
        $this->UserId = $_userid;
        $this->SystemId = $this->UserId . "~" . $this->BrowserId;

        if($_history)
        {
            $this->FirstCall = $this->LoadHistory();
        }
    }

	function GetFirstCall()
	{
		return $this->FirstCall;
	}

    function SetFirstCall($_value)
    {
        $this->FirstCall = $_value;
    }

	function LoadHistory()
	{
        $firstCall = true;
        $this->History = array();
        if($result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_VISITOR_BROWSER_URLS . "` WHERE `" . DB_PREFIX . DATABASE_VISITOR_BROWSER_URLS . "`.`browser_id`='" . DBManager::RealEscape($this->BrowserId) . "' ORDER BY `" . DB_PREFIX . DATABASE_VISITOR_BROWSER_URLS . "`.`entrance` ASC;"))
            while($row = DBManager::FetchArray($result))
            {
                $hu = new HistoryURL($row, true);
    			$this->History[] = $hu;
                /*
                if($row["closed"]==0)*/
                    $firstCall = false;

            }
        return $firstCall;
	}

	function SetQuery($_referrer,$issearchengine=false,$parammatch=false,$encoding="")
	{
		$parts = parse_url(strtolower($_referrer));
		$uparts = explode("&",@$parts["query"]);
		foreach(HistoryUrl::$SearchEngines as $sparam => $engines)
			foreach($uparts as $param)
			{
				$kv = explode("=",$param);
				$parammatch = ($kv[0] == $sparam && !empty($kv[1]));
				
				foreach($engines as $engine)
				{
					if(isset($parts["host"]) && Is::WildcardMatch($engine,$parts["host"]))
						$issearchengine = true;

					if($issearchengine && $parammatch)
					{
						if(empty($encoding))
							foreach(HistoryUrl::$SearchEngineEncodings as $enc => $eengines)
								foreach($eengines as $eengine)
									if($eengine==$engine)
										$encoding = $enc;
						$this->Query = (empty($encoding)) ? urldecode(trim($kv[1])) : html_entity_decode(@iconv($encoding,"UTF-8",urldecode(trim($kv[1]))), ENT_QUOTES, 'UTF-8');
						
						if(!empty($this->Query) && Is::Null(Cookie::Get("sp")))
							Cookie::Set("sp",$this->Query);

                        $this->UpdateParams["query"] = $this->GetQueryId($this->Query,$_referrer);

						DBManager::Execute(true, $d = "UPDATE `" . DB_PREFIX . DATABASE_VISITOR_BROWSERS . "` SET `query`='" . DBManager::RealEscape($this->UpdateParams["query"]) . "' WHERE `id`='" . DBManager::RealEscape($this->BrowserId) . "' LIMIT 1;");
                        return true;
					}
				}
			}
		return $issearchengine;
	}
	
	function GetQueryId($_query,$_referrer,$_maxlength=255,$_self=false)
	{
		if(empty($_query))
			$_query = "";
	
		if(!$_self && $_maxlength != null && strlen($_query) > $_maxlength)
			$_query = substr($_query,0,$_maxlength);
		
		$result = DBManager::Execute(false, "INSERT INTO `" . DB_PREFIX . DATABASE_VISITOR_DATA_QUERIES . "` (`id`, `query`) VALUES (NULL, '" . DBManager::RealEscape($_query) . "');");
		if(!$_self && !empty($_query) && !$result && !Is::Null(DBManager::GetErrorCode()) && DBManager::GetErrorCode() != 1062)
			$this->GetQueryId(utf8_encode(urldecode($_query)),$_referrer,$_maxlength,true);

		$row = DBManager::FetchArray(DBManager::Execute(true, "SELECT `id` FROM `" . DB_PREFIX . DATABASE_VISITOR_DATA_QUERIES . "` WHERE `query`='" . DBManager::RealEscape($_query) . "';"));
		return $row["id"];
	}

    function Load()
    {

        $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_VISITOR_BROWSERS . "` WHERE `id`='" . DBManager::RealEscape($this->BrowserId) . "';");
        if(DBManager::GetRowCount($result) >= 1)
            $this->SetValues(DBManager::FetchArray($result),true);
    }

	function Save()
	{
        if($this->Type==1 || strpos($this->BrowserId,'_OVL') !== false)
            return false;

		if($this->FirstCall && $res = DBManager::Execute(true, "INSERT IGNORE INTO `" . DB_PREFIX . DATABASE_VISITOR_BROWSERS . "` (`id`, `visitor_id`, `visit_id`, `created`, `last_active`, `is_chat`,`pre_message`,`overlay`,`overlay_container`) VALUES ('" . DBManager::RealEscape($this->BrowserId) . "','" . DBManager::RealEscape($this->UserId) . "','" . DBManager::RealEscape($this->VisitId) . "','" . DBManager::RealEscape(time()) . "','" . DBManager::RealEscape(time()) . "','" . DBManager::RealEscape($this->Type) . "',''," . ($this->Overlay ? 1 : 0) . "," . ($this->OverlayContainer ? 1 : 0) . ");"))
        {
            $rowsInserted = DBManager::GetAffectedRowCount();
            if($rowsInserted == 0)
            {
                //Logging::ErrorLog("Can't save browser: " . $this->BrowserId . " / " . $this->UserId . " / " . @$_GET["ue"]);
                return false;
            }
        }
        else if(!$this->FirstCall)
        {
            $fields = "";
            DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_VISITOR_BROWSERS . "` SET `last_active`=" . time() . $fields . " WHERE `closed`=0 AND `id`='" . DBManager::RealEscape($this->BrowserId) . "' AND `visitor_id`='" . DBManager::RealEscape($this->UserId) . "' LIMIT 1;");
            if(DBManager::GetAffectedRowCount()==0)
            {
                $this->Load();
                if($this->Closed>0)
                {
                    //Logging::ErrorLog("Browser is closed 27: " . $this->BrowserId . " / " . $this->UserId . " / " . @$_GET["ue"]);
                    return false;
                }
            }
        }
        return true;
    }
	
	function Destroy()
	{
        DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_VISITOR_BROWSERS . "` SET `last_active`=`last_active`-" . DBManager::RealEscape(Server::$Configuration->File["timeout_track"]) . " WHERE `id`='" . DBManager::RealEscape($this->BrowserId) . "' LIMIT 1;");
	}

    function Close()
    {
        DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_VISITOR_BROWSERS . "` SET `closed`=" . time() . " WHERE `id`='" . DBManager::RealEscape($this->BrowserId) . "' LIMIT 1;");
    }
	
    function IsActivity()
    {
        if(count($this->History)==0)
            $this->LoadHistory();
        if(count($this->History) > 0 && $this->History[count($this->History)-1]->Entrance >= (time()-((Server::$Configuration->File["gl_inti"]*60))))
            return true;
        return false;
    }

    function TextReplace($_text)
    {
        $_text = str_replace("%searchstring%",$this->Query,$_text);
        if(count($this->History) > 0)
        {
            $_text = str_replace("%page_title%",$this->History[count($this->History)-1]->Url->PageTitle,$_text);
            $_text = str_replace("%url%",$this->History[count($this->History)-1]->Url->GetAbsoluteUrl(),$_text);
        }
        return $_text;
    }

    function SetValues($_row)
    {
        $this->BrowserId = $_row["id"];
        $this->VisitId = $_row["visit_id"];
        $this->Created = $_row["created"];
        $this->LastActive = $_row["last_active"];
        $this->Closed = $_row["closed"];
    }

    function GetXMLV2($_visitorId)
    {
        return "<b v=\"".base64_encode($_visitorId)."\" vi=\"".base64_encode($this->VisitId)."\" id=\"".base64_encode($this->BrowserId)."\" c=\"".base64_encode($this->Closed)."\" e=\"".base64_encode($this->Created)."\" l=\"".base64_encode($this->LastActive)."\" />";
    }

    function ReplaceLoginDetails($_user,$_reset=false,$_fileUploads=false,$values="",$keys="",$comma="",$files="")
    {
        Server::InitDataBlock(array("INPUTS"));
        foreach(Server::$Inputs as $index => $input)
        {
            $data = $input->GetValue($_user);
            $data = (!empty($data)) ? $data : $input->GetServerInput();

            //if($index == 114)
              //  $data = "";

            $values .= $comma . $input->GetJavascript($data);
            $keys .= $comma . "'".$index."'";

            if($_fileUploads)
            {
                $iffiles = "";
                $ifcomma = "";
                if($input->Type == "File" && $input->Active)
                {
                    $tfiles = KnowledgeBase::GetTemporaryTicketFiles($_user->UserId,$index);
                    foreach($tfiles as $tfile)
                    {
                        $iffiles .= $ifcomma . "['" . md5($tfile["id"]) . "','" . base64_encode($tfile["title"]) . "']";
                        $ifcomma = ",";
                    }
                }
                $files .= $comma . "[".$iffiles."]";
            }
            $comma = ",";
        }

        if($_reset)
            $_user->AddFunctionCall("LiveZillaData.InputFieldValues=null;LiveZillaData.InputFieldIndices=null;",false);

        $_user->AddFunctionCall("if(LiveZillaData.InputFieldIndices==null)LiveZillaData.InputFieldIndices = [".$keys."];",false);
        $_user->AddFunctionCall("if(LiveZillaData.InputFieldValues==null)LiveZillaData.InputFieldValues = [".$values."];",false);

        if($_fileUploads && !empty($files))
            $_user->AddFunctionCall("LiveZillaData.InputFieldFiles = [".$files."];",false);

        return $_user;
    }

    static function FromCache($_uid,$_bid)
    {
        $browser = new VisitorBrowser($_bid,$_uid,true);
        return $browser;
    }
}


class VisitorChat extends VisitorBrowser
{
	public $Waiting;
	public $Chat;
	public $Type = BROWSER_TYPE_CHAT;
	public $ConnectingMessageDisplayed = null;
	public $Members;
	public $TranscriptEmail;
	public $ChatId;
	public $ResponseTime;
	public $ArchiveCreated = 0;
	public $Activated;
	public $Closed;
    public $GroupId;
	public $Declined = 0;
	public $InternalActivation;
	public $ExternalClosed;
	public $InternalClosed;
	public $OperatorId;
	public $LastActive = 0;
	public $Priority = 2;
	public $AllocatedTime = 0;
	public $ChatTicketId = "";
	public $CallMeBack = false;
	public $InitChatWith;
    public $TranslationSettings;
    public $FirstCall = true;
    public $Typing;
    public $Status;
    public $HistoryCounts;
    public $GroupChat;
    public $Subject;
    public $Exit;

    public static $DynamicGroup;
    public static $Router;

	function __construct()
   	{
        $loadParentHistory=true;
		if(func_num_args() == 2)
		{
			$this->UserId = func_get_arg(0);
			$this->BrowserId = func_get_arg(1);
			$this->FirstCall = true;
		}
        else if(func_num_args() == 3)
        {
            $this->UserId = func_get_arg(0);
            $this->BrowserId = func_get_arg(1);
            $this->FirstCall = false;
            $loadParentHistory = false;
        }
		else if(func_num_args() == 4)
		{
			$this->UserId = func_get_arg(0);
			$this->BrowserId = func_get_arg(1);
			$this->DesiredChatGroup = func_get_arg(2);
			$this->SetDesiredChatPartner(func_get_arg(3));
			$this->FirstCall = true;
		}
		else if(func_num_args() == 1)
		{
			$this->SetValues(func_get_arg(0));
		}
		parent::__construct($this->BrowserId,$this->UserId,$loadParentHistory);
   	}

    function GetChatXML($_visitorId)
    {
        $atts = array();
        $atts["v"] = $_visitorId;
        $atts["a"] = $this->AllocatedTime;
        $atts["i"] = $this->ChatId;
		$atts["f"] = $this->FirstActive;
        $atts["l"] = $this->LastActive;
        $atts["p"] = $this->Priority;
        $atts["s"] = $this->Subject;
        $atts["b"] = $this->BrowserId;
        $atts["t"] = $this->Typing;
        $atts["e"] = $this->Exit;
        $atts["c"] = $this->Closed;
        $atts["w"] = $this->Waiting;
        $atts["tid"] = $this->ChatTicketId;
		$atts["dcg"] = $this->DesiredChatGroup;
		$atts["dcp"] = $this->DesiredChatPartner;
        $atts["cmb"] = $this->CallMeBack;

        $atts["ai"] = $this->InternalActivation;
        $atts["ae"] = true;

        $atts["ce"] = $this->ExternalClosed;
        $atts["ci"] = $this->InternalClosed;
        $atts["di"] = $this->Declined;

        $innerXML = "";

        $this->LoadMembers();
        if(is_array($this->Members))
            foreach($this->Members as $member)
                $innerXML .= $member->GetXML();

        return To::XMLTag("c",$innerXML,$atts);
    }
	
    function SetTranslation($_value)
    {
        DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_VISITOR_CHATS . "` SET `translation`='" . DBManager::RealEscape($_value) . "' WHERE `chat_id`='" . DBManager::RealEscape($this->ChatId) . "' LIMIT 1;");
    }
	
	function SetCookieGroup()
	{
		if(!empty($this->DesiredChatGroup))
			Cookie::Set("login_group",$this->DesiredChatGroup);
	}

	function SetCallMeBackStatus($_cmb)
	{
		DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_CHAT_ARCHIVE . "` SET `call_me_back`=" . intval($_cmb) . " WHERE `chat_id`='" . DBManager::RealEscape($this->ChatId) . "' LIMIT 1;");
		DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_VISITOR_CHATS . "` SET `call_me_back`=" . intval($_cmb) . " WHERE `chat_id`='" . DBManager::RealEscape($this->ChatId) . "' LIMIT 1;");
	}
	
	function Load()
	{
		$this->Status = CHAT_STATUS_OPEN;
    	$this->LastActive = time();
		$this->Members = array();

        $historyEntry = false;

        $count = 0;
		$result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_VISITOR_CHATS . "` WHERE `visitor_id`='" . DBManager::RealEscape($this->UserId) . "' AND `browser_id`='" . DBManager::RealEscape($this->BrowserId) . "' ORDER BY `first_active` DESC LIMIT 2;");
		if($result)
			while($row = DBManager::FetchArray($result))
			{
				if(empty($row["external_close"]))
				{
					$this->FirstCall = !empty($row["exit"]);
					$this->SetValues($row);
				}

                if($historyEntry && empty(Server::$Configuration->File["gl_save_op"]))
                    continue;

				if(!empty($row["request_operator"]) && empty($this->DesiredChatPartner))
					$this->SetDesiredChatPartner($row["request_operator"]);

				if(!empty($row["request_group"]) && empty($this->DesiredChatGroup))
					$this->DesiredChatGroup = $row["request_group"];

                $historyEntry = true;

                $count++;
			}
		$this->LoadMembers();
	}
	
	function LoadMembers()
	{
        if(empty($this->ChatId))
            return;

		Server::InitDataBlock(array("INTERNAL"));
		$result = DBManager::Execute(true,"SELECT * FROM `" . DB_PREFIX . DATABASE_VISITOR_CHAT_OPERATORS . "` WHERE `status`<9 AND `chat_id`='" . DBManager::RealEscape($this->ChatId) . "' ORDER BY `status` DESC, `dtime` DESC;");

        while($row = DBManager::FetchArray($result))
			if(isset(Server::$Operators[$row["user_id"]]))
			{
				$this->Members[$row["user_id"]] = new ChatMember($row["user_id"],$row["status"],!empty($row["declined"]),$row["jtime"],$row["ltime"]);
                if($row["status"] < 2)
					$this->OperatorId = $row["user_id"];
				$this->Declined = $row["dtime"];
			}
	}

    function GetHostOperator()
    {
        $fallback = "";
        if(empty($this->Members))
            $this->LoadMembers();
        if(is_array($this->Members))
        {
            foreach($this->Members as $member)
                if($member->Status == 0)
                    return $member->SystemId;
                else if($member->Status == 1 && empty($fallback))
                    $fallback = $member->SystemId;
        }
        return $fallback;
    }

    function GetTotalWaitingTime(&$_startMarker,&$_endMarker)
    {
        if(!empty($this->Declined))
        {
            $_startMarker = 2;
            $waitingTime = $this->Declined-$this->FirstActive;
        }
        else if($this->InternalActivation)
        {
            $_startMarker = 1;
            $waitingTime = $this->AllocatedTime-$this->FirstActive;
        }
        else
        {
            $_startMarker = 0;
            $waitingTime = $this->LastActive-$this->FirstActive;
        }

        if(($this->InternalActivation && $this->InternalClosed) || $this->Declined)
            $_endMarker = 1;

        $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_VISITOR_CHATS . "` WHERE `visitor_id`='" . DBManager::RealEscape($this->UserId) . "' AND `browser_id`='" . DBManager::RealEscape($this->BrowserId) . "' AND `visit_id`='" . DBManager::RealEscape($this->VisitId) . "' AND `archive_created`=2 AND `first_active`<" . intval($this->FirstActive) . ";");
        while($row = DBManager::FetchArray($result))
            $waitingTime += $row["last_active"]-$row["first_active"];
        return max($waitingTime,0);
    }

    function GetTotalDuration()
    {
        return ($this->AllocatedTime>0 && $this->LastActive>$this->AllocatedTime) ? $this->LastActive-$this->AllocatedTime : max($this->LastActive-$this->FirstActive,10);
    }
	
	function SetValues($row)
	{
        $this->LastActive = $row["last_active"];
        $this->AllocatedTime = $row["allocated"];
        $this->Waiting = $row["waiting"];
        $this->FirstActive = $row["first_active"];
        $this->Subject = @$row["subject"];

        if(empty(Server::$Configuration->File["gl_cmsp"]))
            $this->Typing = (!empty($row["typing"]) && $row["last_active"] > (time()-30));
        else
            $this->Typing = $row["typing"];

        $this->ChatId = $row["chat_id"];
        $this->VisitId = $row["visit_id"];
        $this->SetDesiredChatPartner($row["request_operator"]);
        $this->DesiredChatGroup =
        $this->GroupId = $row["request_group"];
        $this->Priority = $row["priority"];
        $this->ChatTicketId = $row["chat_ticket_id"];
        $this->ArchiveCreated = $row["archive_created"];
        $this->InternalActivation = !empty($row["internal_active"]);
        $this->Declined = !empty($row["internal_declined"]);
        $this->Closed = !empty($row["exit"]);
        $this->Exit = $row["exit"];
        $this->CallMeBack = $row["call_me_back"];
        $this->ExternalClosed = !empty($row["external_close"]);
        $this->FirstActive = $row["first_active"];
        $this->InternalClosed = !empty($row["internal_closed"]);
        $this->LastActive = $row["last_active"];
        $this->InitChatWith = $row["init_chat_with"];
        $this->UserId = $row["visitor_id"];
        $this->BrowserId = $row["browser_id"];
        $this->Status = $row["status"];
        $this->HistoryCounts = $row["history"];
        $this->GroupChat = $row["dgc"];
        $this->Activated = (($this->InternalActivation) ? CHAT_STATUS_ACTIVE : CHAT_STATUS_OPEN);
        $this->TranslationSettings = (!empty($row["translation"])) ? explode(",",$row["translation"]) : null;
    }
	
	function SetChatId()
	{
		if(isset($_POST[POST_EXTERN_CHAT_ID]) && $this->Status != CHAT_STATUS_OPEN)
		{
			$this->ChatId = Encoding::Base64UrlDecode($_POST[POST_EXTERN_CHAT_ID]);
		}
		else
		{
			$result = DBManager::Execute(true, "SELECT `chat_id` FROM `" . DB_PREFIX . DATABASE_INFO . "`");
			$row = DBManager::FetchArray($result);
			$cid = $row["chat_id"]+1;
			DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_INFO . "` SET `chat_id`='" . DBManager::RealEscape($cid) . "' WHERE `chat_id`='" . DBManager::RealEscape($row["chat_id"]) . "'");
			if(DBManager::GetAffectedRowCount() == 0)
			{
				$this->ChatId = $this->SetChatId();
				return $this->ChatId;
			}
			else
			{
				$this->ChatId = $cid;
			}
		}

		$this->FirstActive = time();

		DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_VISITOR_CHATS . "` SET `last_active`='" . DBManager::RealEscape(time()) . "',`first_active`='" . DBManager::RealEscape(time()) . "',`chat_id`='" . DBManager::RealEscape($this->ChatId) . "' WHERE `exit`=0 AND `visitor_id`='" . DBManager::RealEscape($this->UserId) . "' AND `browser_id`='" . DBManager::RealEscape($this->BrowserId) . "' ORDER BY `first_active` DESC LIMIT 1;");
        if(DBManager::GetAffectedRowCount() == 0)
        {
            return false;
        }
        else
        {
            $this->SetTargetGroup($this->DesiredChatGroup);
        }
        return $this->ChatId;
	}
	
	function SetStatus($_status)
	{
		DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_VISITOR_CHATS . "` SET `last_active`='" . DBManager::RealEscape(time()) . "',`status`='" . DBManager::RealEscape($_status) . "' WHERE `chat_id`='" . DBManager::RealEscape($this->ChatId) . "';");
	}

    function SetPublicGroup($_groupId)
    {
        DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_VISITOR_CHATS . "` SET `dgc`='" . DBManager::RealEscape($_groupId) . "' WHERE `visitor_id`='" . DBManager::RealEscape($this->UserId) . "' AND `exit`=0 AND `browser_id`='" . DBManager::RealEscape($this->BrowserId) . "';");
    }
	
	function SetWaiting($_waiting)
	{
		$this->Waiting=$_waiting;
		DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_VISITOR_CHATS . "` SET `waiting`='" . DBManager::RealEscape((($_waiting) ? 1 : 0)) . "' WHERE `chat_id`='" . DBManager::RealEscape($this->ChatId) . "';");
	}
	
	function UpdateArchive($_tcemail)
	{
		DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_CHAT_ARCHIVE . "` SET `transcript_receiver`='" . DBManager::RealEscape($_tcemail) . "' WHERE `chat_id`='" . DBManager::RealEscape($this->ChatId) . "';");
	}

	function JoinChat($_internalUser,$_invisible=false,$_rePost=false)
	{
        if(!empty($this->ChatId))
        {
            DBManager::Execute(false, "INSERT IGNORE INTO `" . DB_PREFIX . DATABASE_VISITOR_CHAT_OPERATORS . "` (`chat_id`,`user_id`,`jtime`,`status`,`alloc`) VALUES ('" . DBManager::RealEscape($this->ChatId) . "','" . DBManager::RealEscape($_internalUser) . "'," . (($_invisible) ? 0 : time()) . "," . (($_invisible) ? 2 : 1) . ",0);");
            if(DBManager::GetAffectedRowCount() != 1)
            {
                $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_VISITOR_CHAT_OPERATORS . "` WHERE `chat_id`='" . DBManager::RealEscape($this->ChatId) . "' AND `user_id`='" . DBManager::RealEscape($_internalUser) . "' LIMIT 1;");
                if($row = DBManager::FetchArray($result))
                {
                    $jtime = ($_invisible && ($row["status"] == 1 || $row["status"] == 0)) ? "`jtime`" : (($_invisible) ? 0 : time());
                    DBManager::Execute(false, "UPDATE `" . DB_PREFIX . DATABASE_VISITOR_CHAT_OPERATORS . "` SET `ltime`=" . (($_invisible) ? time() : 0) . ",`jtime`=" . $jtime . ",`dtime`=0,`declined`=0,`status`=" . (($_invisible) ? 2 : 1) . " WHERE `chat_id` = '" . DBManager::RealEscape($this->ChatId) . "' AND `user_id`='" . DBManager::RealEscape($_internalUser) . "' LIMIT 1;");
                }
            }
            if($_rePost)
            {
                $this->RepostChatHistory(1,$this->ChatId,$_internalUser,0,0,"",$this->ChatId);
                return;
            }
        }
	}
	
	function LeaveChat($_internalUser)
	{
		if(count($this->Members)>=2 && !empty($this->Members[$_internalUser]) && $this->Members[$_internalUser]->Status == 0)
			foreach($this->Members as $sysid => $member)
				if($member->Status == 1)
				{
					$this->SetHost($sysid);
					break;
				}

		DBManager::Execute(false, "DELETE FROM `" . DB_PREFIX . DATABASE_VISITOR_CHAT_OPERATORS . "` WHERE `chat_id` = '" . DBManager::RealEscape($this->ChatId) . "' AND `user_id`='" . DBManager::RealEscape($_internalUser) . "' AND `status`=2 LIMIT 1;");
        if(!empty($this->ChatId))
            DBManager::Execute(false, "UPDATE `" . DB_PREFIX . DATABASE_VISITOR_CHAT_OPERATORS . "` SET `status`=9,`ltime`=" . time() . " WHERE `chat_id` = '" . DBManager::RealEscape($this->ChatId) . "' AND `user_id`='" . DBManager::RealEscape($_internalUser) . "' LIMIT 1;");
	}

    function ValidateOperator()
    {
        if(!empty($this->GroupChat) || !empty(VisitorChat::$DynamicGroup) || empty($this->OperatorId))
            return;

        if(count($this->Members) == 1 && Server::$Operators[$this->OperatorId]->Status == USER_STATUS_OFFLINE)
        {
            $this->CloseChat(4);
        }
        else
        {
            foreach($this->Members as $sid => $member)
                if(Server::$Operators[$sid]->Status == USER_STATUS_OFFLINE)
                    $this->LeaveChat($sid);

            if($this->OperatorId != $this->DesiredChatPartner)
                $this->SetDesiredChatPartner($this->OperatorId);
        }
    }
	
	function SetHost($_internalUser)
	{
        if(!empty($this->ChatId))
        {
		    DBManager::Execute(false, "UPDATE `" . DB_PREFIX . DATABASE_VISITOR_CHAT_OPERATORS . "` SET `status`=0 WHERE `chat_id` = '" . DBManager::RealEscape($this->ChatId) . "' AND `user_id`='" . DBManager::RealEscape($_internalUser) . "' LIMIT 1;");
		    if(DBManager::GetAffectedRowCount() != 1)
			    DBManager::Execute(false, "INSERT IGNORE INTO `" . DB_PREFIX . DATABASE_VISITOR_CHAT_OPERATORS . "` (`chat_id`,`user_id`,`status`) VALUES ('" . DBManager::RealEscape($this->ChatId) . "','" . DBManager::RealEscape($_internalUser) . "',0);");
            DBManager::Execute(false, "UPDATE `" . DB_PREFIX . DATABASE_VISITOR_CHAT_OPERATORS . "` SET `status`=1 WHERE `status`=0 AND `chat_id` = '" . DBManager::RealEscape($this->ChatId) . "' AND `user_id`!='" . DBManager::RealEscape($_internalUser) . "';");
	    }
    }
	
	function SetPriority($_priority)
	{
		DBManager::Execute(false, "UPDATE `" . DB_PREFIX . DATABASE_VISITOR_CHATS . "` SET `priority`='" . DBManager::RealEscape($_priority) . "' WHERE `chat_id` = '" . DBManager::RealEscape($this->ChatId) . "' LIMIT 1;");
	}

    function SetDesiredChatPartner($_systemId)
    {
        $this->DesiredChatPartner = $_systemId;
    }
	
	function SetTargetOperator($_internalUser)
	{
        if(!empty($this->ChatId))
        {
		    DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_VISITOR_CHATS . "` SET `request_operator`='" . DBManager::RealEscape($_internalUser) . "' WHERE `chat_id`=" . DBManager::RealEscape($this->ChatId) . " LIMIT 1;");
	    }
    }
	
	function RequestInitChat($_internalUser)
	{
		DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_VISITOR_CHATS . "` SET `init_chat_with`='" . DBManager::RealEscape($_internalUser) . "' WHERE `browser_id` = '" . DBManager::RealEscape($this->BrowserId) . "' AND `visitor_id` = '" . DBManager::RealEscape($this->UserId) . "';");
	}
	
	function SetTargetGroup($_groupId)
	{
        $this->GroupId = $_groupId;
		DBManager::Execute(false, "UPDATE `" . DB_PREFIX . DATABASE_VISITOR_CHATS . "` SET `request_group`='" . DBManager::RealEscape($_groupId) . "' WHERE `chat_id` = '" . DBManager::RealEscape($this->ChatId) . "' LIMIT 1;");
	}
	
	function TakeChat($_internalUser,$_groupId,$_activate)
	{
		$this->SetHost($_internalUser);
		$_groupId = (!empty($_groupId)) ? ",`request_group`='".DBManager::RealEscape($_groupId)."'" : "";
		DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_VISITOR_CHAT_OPERATORS . "` SET `status`=0,`declined`=0,`dtime`=0,`ltime`=0,`jtime`=" . time() . " WHERE `chat_id` = '" . DBManager::RealEscape($this->ChatId) . "' AND `user_id`='" . DBManager::RealEscape($_internalUser) . "' LIMIT 1;");
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_VISITOR_CHAT_OPERATORS . "` WHERE `chat_id` = '" . DBManager::RealEscape($this->ChatId) . "' AND `user_id`!='" . DBManager::RealEscape($_internalUser) . "';");
        DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_VISITOR_CHATS . "` SET `internal_active`=".($_activate==1 ? 1 : 0).",`status`=1,`waiting`=0,`request_operator`='" . DBManager::RealEscape($_internalUser) . "'" . $_groupId . " WHERE `chat_id` = '" . DBManager::RealEscape($this->ChatId) . "' LIMIT 1;");
    }
	
    function RemoteActivate($_internalUser)
    {
        if(!Is::Defined("CALLER_SYSTEM_ID"))
        {
            define("CALLER_SYSTEM_ID",$_internalUser->SystemId);
            $this->InternalActivate(null);

            if($_internalUser->IsBot)
                $this->ExternalActivate();
            $this->SetStatus(CHAT_STATUS_ACTIVE);
        }
    }

    function CreateSPAMFilter()
    {
        if(!empty(Server::$Configuration->File["gl_sfc"]) && Visitor::CreateSPAMFilter($this->UserId))
            return true;
        return false;
    }
	
	function CreateChat($_internalUser, $_visitor, $_host=false, $custom="", $etpl="", $_customsInTranscript=true, $_externalSelf=true, $pdm=null)
	{
        if(empty($this->ChatId))
            return false;

        if(!empty($_internalUser))
        {
		    $this->OperatorId = $_internalUser->SystemId;
            $_internalUser->SetLastChatAllocation();
        }
        else
            $this->OperatorId = "";

		$this->SetStatus(CHAT_STATUS_WAITING);
		Server::InitDataBlock(array("INPUTS"));
	    DBManager::Execute(true,"INSERT IGNORE INTO `" . DB_PREFIX . DATABASE_VISITOR_CHAT_OPERATORS . "` (`chat_id`,`user_id`,`jtime`,`status`) VALUES ('" . DBManager::RealEscape($this->ChatId) . "','" . DBManager::RealEscape($this->OperatorId) . "'," . time() . "," . (($_host) ? 0 : 1) . ");");

        $this->CreateArchiveEntry($_internalUser, $_visitor, $custom, $etpl, $_customsInTranscript, $pdm);

		if($_internalUser->IsBot)
		{
			$this->RemoteActivate($_internalUser);
		}
		else if(!empty($_internalUser->AppDeviceId) && $_internalUser->AppBackgroundMode)
        {
            $name = (!empty($_visitor->VisitorData->Fullname)) ? $_visitor->VisitorData->Fullname : Visitor::GetNoName($this->UserId.Communication::GetIP());
            $_internalUser->AddPushMessage($this->ChatId, $this->SystemId, $name, 0);
        }
        return true;
	}

    function CreateArchiveEntry($_internalUser, $_visitor, $custom="", $etpl="", $_customsInTranscript=true, $pdm=null)
    {
        if(!empty($this->ArchiveCreated))
            return;

        if($_visitor != null)
            $_visitor->Load();

        if(Server::$Inputs[111]->Active)
            $custom .= strip_tags(Server::$Inputs[111]->Caption) . " %efullname%\r\n";
        if(Server::$Inputs[112]->Active)
            $custom .= strip_tags(Server::$Inputs[112]->Caption) . " %eemail%\r\n";
        if(!empty($this->Company) && Server::$Inputs[113]->Active)
            $custom .= strip_tags(Server::$Inputs[113]->Caption) . " " . trim($_visitor->VisitorData->Company) . "\r\n";
        if(!empty($this->Question) && Server::$Inputs[114]->Active)
            $custom .= strip_tags(Server::$Inputs[114]->Caption) . " " . trim($_visitor->VisitorData->Text) . "\r\n";
        if(!empty($this->Phone) && Server::$Inputs[116]->Active)
            $custom .= strip_tags(Server::$Inputs[116]->Caption) . " " . trim($_visitor->VisitorData->Phone) . "\r\n";

        $customs = array();

        if($_visitor != null)
        {
            $customs = $_visitor->VisitorData->FormatChatArchiveArray();

            if(is_array($_visitor->VisitorData->Customs))
                foreach($_visitor->VisitorData->Customs as $cind => $value)
                    if(Server::$Inputs[$cind]->Active && Server::$Inputs[$cind]->Custom)
                    {
                        if(!isset(Server::$Groups[$this->DesiredChatGroup]->ChatInputsHidden[$cind]) && $_customsInTranscript)
                        {
                            if(Server::$Inputs[$cind]->Type == "CheckBox")
                                $custom .= strip_tags(Server::$Inputs[$cind]->Caption). " " . ((!empty($value)) ? "<!--lang_client_yes-->" : "<!--lang_client_no-->") . "\r\n";
                            else if(Server::$Inputs[$cind]->Type == "ComboBox")
                                $custom .= strip_tags(Server::$Inputs[$cind]->Caption). " " . Server::$Inputs[$cind]->GetClientValue($value) . "\r\n";
                            else
                                $custom .= strip_tags(Server::$Inputs[$cind]->Caption). " " . $value . "\r\n";
                        }
                    }
        }

        $tsData = array("","");
        if(!empty(Server::$Groups[$this->DesiredChatGroup]->PredefinedMessages))
        {
            $pdm = PredefinedMessage::GetByLanguage(Server::$Groups[$this->DesiredChatGroup]->PredefinedMessages,$_visitor->Language);
            if(!empty($pdm->EmailChatTranscriptBodyPlaintext))
                $tsData[0] = $pdm->EmailChatTranscriptBodyPlaintext;
            if(!empty($pdm->EmailChatTranscriptBodyHTML))
                $tsData[1] = $pdm->EmailChatTranscriptBodyHTML;
        }

        for($i=0;$i<count($tsData);$i++)
        {
            $tsData[$i] = str_replace("%chat_id%",$this->ChatId,$tsData[$i]);
            $tsData[$i] = str_replace("%details%",$custom,$tsData[$i]);
            $tsData[$i] = str_replace("%external_name%","%efullname%",$tsData[$i]);
            $tsData[$i] = str_replace("%external_email%","%eemail%",$tsData[$i]);
            $tsData[$i] = str_replace("%external_company%",$_visitor->VisitorData->Company,$tsData[$i]);
            $tsData[$i] = str_replace("%external_phone%",$_visitor->VisitorData->Phone,$tsData[$i]);
            $tsData[$i] = str_replace("%question%",$_visitor->VisitorData->Text,$tsData[$i]);
            $tsData[$i] = str_replace("%feedback_link%",Feedback::GetLink("cid=" . Encoding::Base64UrlEncode($this->ChatId)),$tsData[$i]);

            if($_visitor != null)
                $tsData[$i] = $_visitor->TextReplace($tsData[$i]);
            $tsData[$i] = Configuration::Replace($tsData[$i]);
        }

        $code = "";

        if($_visitor != null && isset($_visitor->Browsers[1]) && isset($_visitor->Browsers[1]->History[0]))
            $code = $_visitor->Browsers[1]->History[0]->Url->AreaCode;

        $subject = ($pdm != null) ? $pdm->SubjectChatTranscript : "";

        if($_visitor != null)
            $subject = Mailbox::GetSubject($subject,$_visitor->VisitorData->Email,$_visitor->VisitorData->Fullname,$this->DesiredChatGroup,$this->ChatId,$_visitor->VisitorData->Company,$_visitor->VisitorData->Phone,Communication::GetIP(),$_visitor->VisitorData->Text,Server::$Groups[$this->DesiredChatGroup]->GetDescription($_visitor->Language),$_visitor->VisitorData->Customs);

        $internal = ($_internalUser != null && $_internalUser->IsBot) ? $_internalUser->SystemId : "";

        $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_CHAT_ARCHIVE . "` WHERE `chat_id`='" . DBManager::RealEscape($this->ChatId) . "';");
        if($result && DBManager::GetRowCount($result) == 0)
        {
            if(Server::$Configuration->File["gl_adct"] == 1 || (!empty(Server::$Configuration->File["gl_rm_chats_time"]) || empty(Server::$Configuration->File["gl_rm_chats"])))
            {
                $url = Visitor::GetLastURLFromVisitor($this->UserId,true);


                if(!(($result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_CHAT_ARCHIVE . "` WHERE `chat_id`='" . DBManager::RealEscape($this->ChatId) . "';")) && $row = DBManager::FetchArray($result)))
                    DBManager::Execute(true, "INSERT INTO `" . DB_PREFIX . DATABASE_CHAT_ARCHIVE . "` (`time`,`endtime`,`closed`,`chat_id`,`external_id`,`fullname`,`internal_id`,`group_id`,`area_code`,`html`,`plaintext`,`transcript_text`,`transcript_html`,`email`,`company`, `phone`, `call_me_back`, `iso_language`,`iso_country`,`host`,`ip`,`gzip`,`transcript_sent`,`transcript_receiver`,`question`,`customs`,`subject`,`ticket_id`,`wait`,`duration`,`accepted`,`ended`,`chat_type`,`ref_url`) VALUES ('" . DBManager::RealEscape($this->FirstActive) . "',0,0,'" . DBManager::RealEscape($this->ChatId) . "','" . DBManager::RealEscape($this->UserId) . "','','" . DBManager::RealEscape($internal) . "','','" . DBManager::RealEscape($code) . "','','','" . DBManager::RealEscape($tsData[0]) . "','" . DBManager::RealEscape($tsData[1]) . "','','','',0,'" . DBManager::RealEscape($_visitor->Language) . "','" . DBManager::RealEscape($_visitor->GeoCountryISO2) . "','" . DBManager::RealEscape(Str::Cut($_visitor->Host,63,false)) . "','" . DBManager::RealEscape($_visitor->IP) . "',0,0,'" . DBManager::RealEscape($_visitor->VisitorData->Email) . "','','" . DBManager::RealEscape(@serialize($customs)) . "','" . DBManager::RealEscape($subject) . "','" . DBManager::RealEscape($this->ChatTicketId) . "',0,0,0,0,1,'" . DBManager::RealEscape($url) . "');");
            }
            $this->ArchiveCreated = 1;
            ChatRequest::AcceptAll($this->UserId);
        }
    }

	function RepostChatHistory($_caller,$_chatId,$_internalSystemId,$_from=0,$_last=0,$_receiverGroup="",$_targetChatId="",$_targetReceiverGroup="",$_external=false,$_botonly=false,$_externalSelf=true)
	{

	}
	
	function PostsReceived($_sender)
	{
		$result = DBManager::Execute(true, "SELECT COUNT(*) as `pcount`,SUM(received) as `rcount` FROM `" . DB_PREFIX . DATABASE_POSTS . "` WHERE `sender`='" . DBManager::RealEscape($_sender) . "' AND `receiver`='" . DBManager::RealEscape($this->SystemId) . "' AND `repost`=0");
		if($result)
			while($row = DBManager::FetchArray($result))
				return $row["pcount"]+$row["rcount"];
		return true;
	}
	
	function GetLastInvitationSender()
	{
		$result = DBManager::Execute(true, "SELECT `sender_system_id` FROM `" . DB_PREFIX . DATABASE_CHAT_REQUESTS . "` WHERE `receiver_user_id`='" . DBManager::RealEscape($this->UserId) . "' ORDER BY `created` DESC LIMIT 1");
		if($result)
			while($row = DBManager::FetchArray($result))
				return $row["sender_system_id"];
		return null;
	}
	
	function CloseChat()
	{
		$this->ExternalClose();
		$this->Closed=true;
	}
	
	function CloseWindow()
	{
		$this->ExternalClose();
		$this->Destroy();
	}
	
	function Save()
	{
        if(empty($this->UserId) || empty($this->VisitId))
        {
            Logging::DebugLog("Invalid Visitor Data: " . $this->UserId . " / " . $this->VisitId);
            return;
        }

		$_new = (func_num_args() > 0) ? func_get_arg(0) : false;
		if($_new)
		{
			$this->FirstCall = true;
			$this->Status = CHAT_STATUS_OPEN;
		}

        if(empty($this->ChatId) && empty(Server::$Configuration->File["gl_save_op"]) && $this->BrowserId != "API")
            $this->SetDesiredChatPartner("");

		if(empty($this->FirstActive))
			$this->FirstActive = time();

		if($this->FirstCall)
        {
            $pdbc = 0;
            $pdbt = 0;
            $hc = $pdbc.";".$pdbt;
			DBManager::Execute(true, "INSERT IGNORE INTO `" . DB_PREFIX . DATABASE_VISITOR_CHATS . "` (`visitor_id`,`browser_id`,`visit_id`,`priority`,`call_me_back`, `typing` ,`first_active` ,`last_active` ,`request_operator` ,`request_group` , `chat_ticket_id`, `queue_posts`, `history`, `dgc`, `subject`) VALUES ('" . DBManager::RealEscape($this->UserId) . "','" . DBManager::RealEscape($this->BrowserId) . "','" . DBManager::RealEscape($this->VisitId) . "','" . DBManager::RealEscape($this->Priority) . "'," . DBManager::RealEscape(($this->CallMeBack) ? 1 : 0) . ",'','" . DBManager::RealEscape($this->FirstActive) . "','" . DBManager::RealEscape($this->LastActive) . "','" . DBManager::RealEscape($this->DesiredChatPartner) . "','" . DBManager::RealEscape($this->DesiredChatGroup) . "','" . DBManager::RealEscape($this->ChatTicketId) . "','','" . DBManager::RealEscape($hc) . "','" . DBManager::RealEscape(VisitorChat::$DynamicGroup) . "','" . DBManager::RealEscape($this->Subject) . "');");
        }
        else
        {
			DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_VISITOR_CHATS . "` SET `typing`='" . DBManager::RealEscape(Str::Cut($this->Typing,200,true)) . "',`archive_created`=" . intval($this->ArchiveCreated) . ",`request_operator`='" . DBManager::RealEscape($this->DesiredChatPartner) . "',`chat_ticket_id`='" . DBManager::RealEscape($this->ChatTicketId) . "',`subject`='" . DBManager::RealEscape($this->Subject) . "',`last_active`='" . DBManager::RealEscape(time()) . "' WHERE `browser_id`='" . DBManager::RealEscape($this->BrowserId) . "' AND `visitor_id`='" . DBManager::RealEscape($this->UserId) . "' AND `chat_id`='" . DBManager::RealEscape($this->ChatId) . "' LIMIT 1;");
        }
        parent::Save();
	}

	function Destroy()
	{
		parent::Destroy();
	}
	
	function InternalDecline($_internal,$remopcount=0)
	{
		if(!isset($this->Members[$_internal]))
			return;
			
		foreach($this->Members as $member)
			if(empty($member->Left))
				$remopcount++;

        if($this->Activated)
            return;

		DBManager::Execute(false, "UPDATE `" . DB_PREFIX . DATABASE_VISITOR_CHAT_OPERATORS . "` SET `declined`=1,`dtime`=" . time() . ",`ltime`=" . time() . " WHERE `chat_id`='" . DBManager::RealEscape($this->ChatId) . "' AND `user_id`='" . DBManager::RealEscape($_internal) . "' LIMIT 1;");
		if($remopcount==1 || !isset($this->Members[$_internal]))
			$this->UpdateUserStatus(false, false, true, false);
		else if(count($this->Members)>1 && isset($this->Members[$_internal]) && $this->Members[$_internal]->Status==0)
			foreach($this->Members as $sysid => $member)
				if($_internal != $sysid)
				{
					$this->SetHost($sysid);
					break;
				}
	}
	
	function InternalClose()
	{
		$this->UpdateUserStatus(false, true, false, false);
	}
	
	function InternalActivate($_owner)
	{
        $activate = false;
        if($_owner != null)
        {
            $this->LoadMembers();
            if(isset($this->Members[$_owner]))
                $activate = true;
        }
        else
            $activate = true;

        if($activate)
        {
            DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_CHAT_ARCHIVE . "` SET `time`='" . DBManager::RealEscape(time()) . "' WHERE `closed`=0 AND `chat_id`='" . DBManager::RealEscape($this->ChatId) . "' LIMIT 1;");
            $this->UpdateUserStatus(true, false, false, false);
        }
	}
	
	function ExternalActivate()
	{
		$this->UpdateUserStatus(false, false, false, false);
	}
		
	function ExternalClose()
	{
		$this->UpdateUserStatus(false, false, false, true);
	}

    function SetExternalClosed()
    {
        DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_VISITOR_CHATS . "` SET `external_close`='1' WHERE `chat_id`='" . DBManager::RealEscape($this->ChatId) . "' LIMIT 1;");
    }
	
	function UpdateUserStatus($_internalActivated, $_internalClosed, $_internalDeclined=false, $_externalClose=false)
	{
		if(!empty($this->ChatId))
		{
			$this->Status = ($_externalClose || $_internalDeclined || $_internalClosed) ? CHAT_CLOSED : $this->Status;
			if($_internalActivated)
			{
				DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_VISITOR_CHATS . "` SET `internal_active`='1',`allocated`='" . DBManager::RealEscape(time()) . "' WHERE `internal_active`=0 AND `chat_id`='" . DBManager::RealEscape($this->ChatId) . "' LIMIT 1;");
				if(DBManager::GetAffectedRowCount() == 1)
				{
					DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_VISITOR_CHAT_OPERATORS . "` SET `status`=0 WHERE `chat_id`='" . DBManager::RealEscape($this->ChatId) . "' AND `user_id`='" . DBManager::RealEscape(CALLER_SYSTEM_ID) . "';");
					DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_VISITOR_CHAT_OPERATORS . "` SET `status`=9,`ltime`=" . time() . ",`jtime`=0 WHERE `chat_id`='" . DBManager::RealEscape($this->ChatId) . "' AND `user_id`!='" . DBManager::RealEscape(CALLER_SYSTEM_ID) . "' AND `status`<=1;");
				}
			}
			else
			{
                $where = "`chat_id`='" . DBManager::RealEscape($this->ChatId) . "'";

				if($_externalClose && empty($this->InternalClosed))
					$update = "`external_close`=1,`status`=2,`waiting`=0,`exit`=".intval(time()+1);
				else if($_externalClose && !empty($this->InternalClosed))
					$update = "`external_close`='1'";
				else if($_internalClosed && empty($this->InternalClosed))
					$update = "`internal_closed`='1',`exit`=".intval(time()+1);
				else if($_internalDeclined && empty($this->InternalDeclined))
                {
					$update = "`internal_declined`='1'";
                    $where .= " AND `internal_active`=0";
                }
				else
					$update = "`external_active`='1'";


				if(($_internalClosed || $_externalClose) && !empty($this->AllocatedTime))
				{
                    UserGroup::RemoveNonPersistantMember($this->SystemId);
					$params = $this->CalculateChatResponseTime();
					$update .= ",`response_time`=" . abs($params[0]) . ",`chat_posts`=" . abs($params[1]);
				}
				DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_VISITOR_CHATS . "` SET " . $update . " WHERE " . $where . " LIMIT 1;");
			}
			DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_CHAT_ARCHIVE . "` SET `endtime`=" . $this->LastActive . ((!empty($this->AllocatedTime)) ? (",`time`=" . $this->AllocatedTime) : "") . " WHERE `chat_id`='" . DBManager::RealEscape($this->ChatId) . "' LIMIT 1;");
		}
	}
	
	function CalculateChatResponseTime($start=0,$postcount=0)
	{
		$durations = array();
		$result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_POSTS . "` WHERE `chat_id`='" . DBManager::RealEscape($this->ChatId) . "' ORDER BY `time` ASC;");
		if($result)
			while($row = DBManager::FetchArray($result))
			{
				if(empty($start) && strpos($row["sender"],"~") !== false)
					$start = max($this->AllocatedTime,$row["time"]);
				else if(strpos($row["sender"],"~") === false)
				{
					$postcount++;
					if(!empty($start))
					{
						$durations[] = $row["time"]-$start;
						$start = 0;
					}
				}
			}
		if(count($durations) > 0)
			return array(0=>floor(array_sum($durations) / count($durations)),1=>$postcount);
		else
			return array(0=>0,1=>$postcount);
	}

    function IsMaxWaitingTime($_queue=false)
    {
        if(!$_queue)
        {
            if(!empty(Server::$Configuration->File["gl_mcwt"]) && $this->Status == CHAT_STATUS_WAITING && is_array($this->Members) && empty($this->InternalActivation))
                foreach($this->Members as $member)
                    if((time()-$member->Joined) > Server::$Configuration->File["gl_mcwt"])
                    {
                        return true;
                    }
        }
        else
        {
            if(!empty(Server::$Configuration->File["gl_mqwt"]) && (time()-$this->FirstActive) > (Server::$Configuration->File["gl_mqwt"]*60))
            {
                return true;
            }
        }
        return false;
    }

    function GetForwards()
    {
        $list = array();
        $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_CHAT_FORWARDS . "` WHERE `target_group_id`='" . DBManager::RealEscape($this->DesiredChatGroup) . "' AND `visitor_id`='" . DBManager::RealEscape($this->UserId) . "' AND `browser_id`='" . DBManager::RealEscape($this->BrowserId) . "' ORDER BY `created` ASC;");
        while($row = DBManager::FetchArray($result))
            $list[] = new Forward($row);
        return $list;
    }

    function GetMaxWaitingTimeAction($_queue=false)
    {
        if($this->IsMaxWaitingTime($_queue))
        {
            if(Server::$Configuration->File["gl_alloc_mode"] != ALLOCATION_MODE_ALL && !empty(Server::$Configuration->File["gl_mcwf"]))
                return "FORWARD";
            else if(Server::$Configuration->File["gl_mcwf"] != 1)
                return "MESSAGE";
        }
        return false;
    }

    function GetLastActiveChatId()
    {
        $result = DBManager::Execute(true, "SELECT `chat_id` FROM `" . DB_PREFIX . DATABASE_VISITOR_CHATS . "` WHERE `chat_id`>0 AND `status`>1 AND `browser_id`='" . DBManager::RealEscape($this->BrowserId) . "' AND `visitor_id`='" . DBManager::RealEscape($this->UserId) . "' ORDER BY `chat_id` DESC LIMIT 1;");
        if($result)
            if($row = DBManager::FetchArray($result))
                return $row["chat_id"];
        return 0;
    }

    function FindOperator($_router,$_user,$_allowBots=false,$_requireBot=false,$_exclude=null,$_closeOnError=true)
    {
        $_router->TargetGroupId = $this->DesiredChatGroup;
        $_router->PreviousOperatorSystemId = $this->DesiredChatPartner;
        $result = $_router->Find($_user,$_allowBots,$_requireBot,$_exclude,false);
        $this->SetDesiredChatPartner($_router->TargetOperatorSystemId);

        if(!$result && $_closeOnError)
            $this->CloseChat(3);

        if($_router->IsPredefined)
            $this->SetTargetOperator($this->DesiredChatPartner);

        return $result;
    }

    function CorrectInvalidTarget($_botmode)
    {
        if(!empty($this->DesiredChatPartner) && Server::$Operators[$this->DesiredChatPartner]->IsBot && !$_botmode)
            $this->SetDesiredChatPartner("");
    }

    function SetTargetOperatorId($_router,$_user,$_allowBots=false,$_requireBot=false,$_exclude=null,$_closeOnError=true,$_isForward=false,$_botmode=false)
    {
        $this->CorrectInvalidTarget($_botmode);
        $this->FindOperator($_router,$_user,$_allowBots,$_requireBot,$_exclude,$_closeOnError,false);

        if($this->Status > CHAT_STATUS_OPEN && !$this->Closed)
        {
            $this->SetDesiredChatPartner($this->OperatorId);
        }
        // init chat
        else if(!empty($this->InitChatWith) && Server::$Operators[$this->InitChatWith]->Status < USER_STATUS_OFFLINE)
        {
            $_user->AddFunctionCall("OverlayChatWidgetV2.__ModeBot = false;",false);
            $_user->AddFunctionCall("OverlayChatWidgetV2.InputState(false);",false);
            $this->SetDesiredChatPartner($this->InitChatWith);
        }
        // chat invite
        else if(!empty($_user->Browsers[1]->ChatRequests) && !$_user->Browsers[1]->ChatRequests[0]->IsAnswered(true))
        {
            $gs = "";
            $routToAutoInviteSender = false;
            if(!empty($_user->Browsers[1]->ChatRequests[0]->EventActionId))
            {
                Server::InitDataBlock(array("EVENTS"));
                $eva = Server::$Events->GetActionById($_user->Browsers[1]->ChatRequests[0]->EventActionId);
                $gs = $eva->Invitation->GetGroupSender();
                $routToAutoInviteSender = empty(Server::$Configuration->File["gl_iada"]);
            }

            if(empty($gs) || $routToAutoInviteSender)
            {
                $routToManualInviteSender = (empty(Server::$Configuration->File["gl_imda"]) && empty($_user->Browsers[1]->ChatRequests[0]->EventActionId));
                if($routToManualInviteSender || $routToAutoInviteSender)
                {
                    if(!Server::$Operators[$_user->Browsers[1]->ChatRequests[0]->SenderSystemId]->IsBot)
                        $this->SetDesiredChatPartner($_user->Browsers[1]->ChatRequests[0]->SenderSystemId);
                }
                else
                    $this->SetDesiredChatPartner("");
            }
        }
        // default allocation
        else
        {
            // just dont ovwr
        }
    }

    function CreateAutoForward($_user)
    {
        if(Server::$Configuration->File["gl_alloc_mode"] == ALLOCATION_MODE_ALL)
            return false;

        $currentOperator = '';
        $lastForward = null;
        $iaf = false;
        $allForwards = $this->GetForwards();
        foreach($allForwards as $forward)
        {
            if($forward->Created > (time()-(Server::$Configuration->File["gl_mcwt"]+10)))
                $iaf = true;
        }

        foreach($this->Members as $member)
            $currentOperator = $member->SystemId;

        if(!$iaf)
        {
            $targets = array();
            $this->FindOperator(VisitorChat::$Router,$_user,false,false,array($currentOperator=>$currentOperator),false,false);
            $isTargetAvailable = (count(VisitorChat::$Router->OperatorsAvailable)>=2 || (count(VisitorChat::$Router->OperatorsAvailable)==1 && !empty($currentOperator) && !isset(VisitorChat::$Router->OperatorsAvailable[$currentOperator])));

            if($isTargetAvailable)
            {
                $forwardedToCount = array();

                foreach(VisitorChat::$Router->OperatorsAvailable as $opsysId => $ccount)
                {
                    $lastForwardToTime = $ccount;
                    foreach($allForwards as $forward)
                    {
                        if($forward->TargetSessId == $opsysId)
                        {
                            $lastForwardToTime = max($forward->Created,$lastForwardToTime);
                            if(!isset($forwardedToCount[$opsysId]))
                                $forwardedToCount[$opsysId] = 0;
                            $forwardedToCount[$opsysId]++;
                        }
                    }
                    $targets[$opsysId] = $lastForwardToTime;
                }

                if(count($forwardedToCount)>0)
                    $forwardedToCount = min($forwardedToCount);
                else
                    $forwardedToCount = 0;

                if(!empty(Server::$Configuration->File["gl_mcfc"]) && is_numeric(Server::$Configuration->File["gl_mcfc"]))
                    if(Server::$Configuration->File["gl_mcfc"] <= $forwardedToCount)
                        return false;

                if(!empty($targets))
                {
                    asort($targets);

                    foreach($targets as $targetsysid => $time)
                    {
                        if($targetsysid != $currentOperator)
                        {
                            $forward = new Forward($this->ChatId,$this->DesiredChatPartner);
                            $forward->InitiatorSystemId = $currentOperator;
                            $forward->ReceiverUserId = $this->UserId;
                            $forward->ReceiverBrowserId = $this->BrowserId;
                            $forward->TargetSessId = $targetsysid;
                            $forward->TargetGroupId = $this->DesiredChatGroup;

                            if($lastForward != null && $lastForward->TargetSessId == $forward->TargetSessId)
                                return true;

                            $forward->Save();
                            $post = new Post(getId(32),"",$currentOperator,$targetsysid."[__[auto_forward:".$this->ChatId."]__]",time(),"","");
                            $post->ReceiverGroup = $this->SystemId;
                            $post->Save();
                            return true;
                        }
                    }
                }
            }
        }
        return true;
    }

    function ShowQueueInformation($_visitor,$_chatPosition,$_chatWaitingTime,$_html)
    {
        $_visitor->AddFunctionCall("OverlayChatWidgetV2.ShowQueueMessage(".$_chatPosition.",".min($_chatWaitingTime,30).",'".base64_encode($_html)."');",false);
    }

    function ShowConnecting($_visitor,$_resume=false)
    {
        if($_resume)
            $_visitor->AddFunctionCall("lz_chat_show_connected(false,true);",false);
        else
            $_visitor->AddFunctionCall("lz_chat_show_connected(".To::BoolString(empty(VisitorChat::$DynamicGroup)).",false);",false);
    }

    function TextReplace($_text)
    {
        $_text = parent::TextReplace($_text);
        $_text = str_replace(array("%chat_id%","%CHATID%"),$this->ChatId,$_text);
        return $_text;
    }

    static function FromCache($_uid,$_bid)
    {
        $br = new VisitorChat($_uid,$_bid);
        $br->Load();
        return $br;
    }

    static function GetByChatId($_chatId)
    {
        if(!empty($_chatId))
        {
            $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_VISITOR_CHATS . "` WHERE `chat_id`='" . DBManager::RealEscape($_chatId) . "';");
            if($result)
                if($row = DBManager::FetchArray($result))
                    return new VisitorChat($row);
        }
        return null;
    }

    static function GetBySystemId($_systemId)
    {
        $parts = explode("~",$_systemId);
        if(count($parts)==2)
        {
            $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_VISITOR_CHATS . "` WHERE `visitor_id`='" . DBManager::RealEscape($parts[0]) . "' AND `browser_id`='" . DBManager::RealEscape($parts[1]) . "' ORDER BY `chat_id` DESC;");
            if($result)
                if($row = DBManager::FetchArray($result))
                    return new VisitorChat($row);
        }
        return null;
    }

    static function GetByUserId($_userId)
    {
        $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_VISITOR_CHATS . "` WHERE `visitor_id`='" . DBManager::RealEscape($_userId) . "' ORDER BY `chat_id` DESC;");
        if($result)
            if($row = DBManager::FetchArray($result))
                return new VisitorChat($row);
        return null;
    }

    static function IsChatBrowserIdAvailable($_browserId, $_allowExisting=true)
    {
        if(empty($_browserId))
            return false;

        $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_VISITOR_BROWSERS . "` WHERE `id`='" . DBManager::RealEscape($_browserId) . "';");
        if($result)
            if($row = DBManager::FetchArray($result))
            {
                if(!$_allowExisting)
                    return false;

                if(!empty($row["overlay_container"]) || empty($row["is_chat"]))
                    return false;
            }

        return true;
    }

    static function ApplyDynamicGroup()
    {
        if(!empty($_GET[GET_EXTERN_PUBLIC_CHAT_GROUP]))
        {
            $tgroup = Communication::ReadParameter(GET_EXTERN_PUBLIC_CHAT_GROUP,"");
            if(isset(Server::$Groups[$tgroup]) && Server::$Groups[$tgroup]->IsDynamic)
                VisitorChat::$DynamicGroup = $tgroup;
        }
    }
}
?>