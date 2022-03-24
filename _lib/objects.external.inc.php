<?php
/****************************************************************************************
* LiveZilla objects.external.inc.php
* 
* Copyright 2017 LiveZilla GmbH
* All rights reserved.
* LiveZilla is a registered trademark.
* 
* Improper changes to this file may cause critical errors.
***************************************************************************************/ 

if(!defined("IN_LIVEZILLA"))
	die();
	
class GroupBuilder
{
	public $InternalUsers;
	public $GroupAvailable = false;
	public $GroupValues = array();
	public $Result;
	public $ErrorHTML = "''";
	public $ReqGroup;
	public $ReqOperator;
	public $Parameters;
	
	function __construct($_reqGroup="",$_reqOperator="",$allowCom=true)
	{
        $reqGroup = UserGroup::ReadParams();
		$this->ReqGroup = (!empty($reqGroup)) ? $reqGroup : $_reqGroup;
		$this->ReqOperator = (!empty($_GET["operator"])) ? Operator::ReadParams() : $_reqOperator;
		$this->GroupValues["groups_online"] = array();
		$this->GroupValues["groups_offline"] = array();
		$this->GroupValues["groups_online_amounts"] = array();
		$this->GroupValues["groups_output"] = array();
		$this->GroupValues["groups_hidden"] = array();
		$this->GroupValues["set_by_get_user"] = null;
		$this->GroupValues["set_by_get_group"] = null;
		$this->GroupValues["set_by_cookie"] = null;
		$this->GroupValues["set_by_standard"] = null;
		$this->GroupValues["set_by_online"] = null;
		$this->GroupValues["req_for_user"] = !empty($this->ReqOperator);
		$this->GroupValues["req_for_group"] = !empty($this->ReqGroup);
		$this->Parameters = Communication::GetTargetParameters($allowCom);

		if($this->Parameters["include_group"] != null || $this->Parameters["include_user"] != null)
		{
			foreach(Server::$Groups as $gid => $group)
				if(!($this->Parameters["include_group"] != null && in_array($gid,$this->Parameters["include_group"])))
				{
					if(!($this->Parameters["include_user"] != null && in_array($gid,Server::$Operators[Operator::GetSystemId($this->Parameters["include_user"])]->GetGroupList(false))))
						$this->GroupValues["groups_hidden"][] = $gid;
				}
		}
		if($this->Parameters["exclude"] != null)
			$this->GroupValues["groups_hidden"] = $this->Parameters["exclude"];
	}
	
	function GetTargetGroup(&$_operatorCount,$_prInternalId="",$_prGroupId="",$offdef = null,$offdefocunt=0)
	{
		$groups = array_merge($this->GroupValues["groups_output"],$this->GroupValues["groups_offline"]);
		if(!empty($_prInternalId) && !empty(Server::$Operators[$_prInternalId]) && Server::$Operators[$_prInternalId]->Status < USER_STATUS_OFFLINE)
        {
            if(!empty($_prGroupId) && Server::$Operators[$_prInternalId]->IsInGroup($_prGroupId))
                if(Server::$Groups[$_prGroupId]->IsExternal && !in_array($_prGroupId,$this->GroupValues["groups_hidden"]) && Server::$Groups[$_prGroupId]->IsOpeningHour(false))
                {
                    $_operatorCount = (!empty($this->GroupValues["groups_online_amounts"][$_prGroupId])) ? $this->GroupValues["groups_online_amounts"][$_prGroupId] : 0;
                    return $_prGroupId;
                }

			foreach(Server::$Operators[$_prInternalId]->GetGroupList(true) as $id)
				if(Server::$Groups[$id]->IsExternal && !in_array($id,$this->GroupValues["groups_hidden"]) && Server::$Groups[$id]->IsOpeningHour(false))
				{
					$_operatorCount = (!empty($this->GroupValues["groups_online_amounts"][$id])) ? $this->GroupValues["groups_online_amounts"][$id] : 0;
                    return $id;
				}
        }

		if(defined("IGNORE_WM") || empty($this->GroupValues["set_by_get_group"]))
		{
			$_operatorCount = 0;
			foreach($groups as $id => $values)
				if(Server::$Groups[$id]->IsExternal && !in_array($id,$this->GroupValues["groups_hidden"]) && Server::$Groups[$id]->IsOpeningHour(false) && Server::$Groups[$id]->IsHumanAvailable() /*&& !Server::$Groups[$id]->HasWelcomeManager()*/)
				{
					$_operatorCount = (!empty($this->GroupValues["groups_online_amounts"][$id])) ? $this->GroupValues["groups_online_amounts"][$id] : 0;
                    return $id;
				}
		}

		$_operatorCount = 0;
		foreach($groups as $id => $values)
			if(Server::$Groups[$id]->IsExternal && !in_array($id,$this->GroupValues["groups_hidden"]) && Server::$Groups[$id]->IsOpeningHour(false))
			{
				$_operatorCount = (!empty($this->GroupValues["groups_online_amounts"][$id])) ? $this->GroupValues["groups_online_amounts"][$id] : 0;
                return $id;
			}
			else if(Server::$Groups[$id]->IsStandard || empty($offdef))
			{
				$offdefocunt = (!empty($this->GroupValues["groups_online_amounts"][$id])) ? $this->GroupValues["groups_online_amounts"][$id] : 0;
                $offdef = $id;
			}
		$_operatorCount = $offdefocunt;
		return $offdef;
	}
	
	function GetHTML($_language)
	{
		$html_groups = "";
		foreach(Server::$Groups as $id => $group)
			if($group->IsExternal && !in_array($id,$this->GroupValues["groups_hidden"]))
				$html_groups .= "<option value=\"".$id."\">".$group->GetDescription($_language)."</option>";
		return $html_groups;
	}
	
	function Generate($_visitor=null,$_allowBots=false)
	{
        global $LZLANG;
		foreach(Server::$Operators as $operator)
		{
			if($operator->LastActive > (time()-Server::$Configuration->File["timeout_clients"]) && $operator->Status < USER_STATUS_OFFLINE && ($_allowBots || !$operator->IsBot) && !$operator->MobileSleep())
			{
                if(!$operator->IsExternal(Server::$Groups))
                    continue;

				$igroups = $operator->GetGroupList(true);
				for($count=0;$count<count($igroups);$count++)
				{
					if($operator->UserId == $this->ReqOperator)
						if(!($this->GroupValues["req_for_group"] && $igroups[$count] != $this->ReqGroup) || (isset($_GET[GET_EXTERN_PREFERENCE]) && Encoding::Base64UrlDecode($_GET[GET_EXTERN_PREFERENCE]) == "user"))
							$this->GroupValues["set_by_get_user"] = $igroups[$count];

					if(!isset($this->GroupValues["groups_online_amounts"][$igroups[$count]]))
						$this->GroupValues["groups_online_amounts"][$igroups[$count]] = 0;

					if($operator->IsBot)
						$this->GroupValues["groups_online_amounts"][$igroups[$count]]+=1;
					else if(isset(Server::$Groups[$igroups[$count]]))
                    {
                        if($operator->GetMaxChatAmountStatus(Server::$Groups[$igroups[$count]]) != USER_STATUS_AWAY)
						    $this->GroupValues["groups_online_amounts"][$igroups[$count]]+=2;
                    }
				}
			}
		}
		$counter = 0;
        if(is_array(Server::$Groups))
		    foreach(Server::$Groups as $id => $group)
            {
                if(!$group->IsExternal)
                    continue;

                $used = false;
                $language = LocalizationManager::GetBrowserLocalization();
                $language = $language[0];
                $amount = (isset($this->GroupValues["groups_online_amounts"]) && is_array($this->GroupValues["groups_online_amounts"]) && array_key_exists($id,$this->GroupValues["groups_online_amounts"]) && $group->IsOpeningHour()) ? $this->GroupValues["groups_online_amounts"][$id] : 0;
                $transport = base64_encode($id) . "," . base64_encode($amount) . "," . base64_encode($group->GetDescription($language)) . "," . base64_encode($group->Email);

                if($this->GroupValues["req_for_group"] && $id == $this->ReqGroup)
                    {$this->GroupValues["set_by_get_group"] = $id;$used=true;}
                elseif(Cookie::Get("login_group") != null && $id == Cookie::Get("login_group") && !isset($requested_group) && !empty(Server::$Configuration->File["gl_save_op"]))
                    {$this->GroupValues["set_by_cookie"] = $id;$used=true;}
                elseif($group->IsStandard)
                    {$this->GroupValues["set_by_standard"] = $id;$used=true;}
                elseif(empty($this->GroupValues["set_by_online"]))
                    {$this->GroupValues["set_by_online"] = $id;$used=true;}

                if(!in_array($id,$this->GroupValues["groups_hidden"]) && ($group->IsExternal || $used))
                {
                    $counter++;
                    if($amount > 0)
                    {
                        $this->GroupAvailable = true;
                        $this->GroupValues["groups_online"][$id] = $transport;
                    }
                    else
                    {
                        if($group->IsStandard)
                        {
                            $na[$id] = $transport;
                            $na = array_merge($na,$this->GroupValues["groups_offline"]);
                            $this->GroupValues["groups_offline"] = $na;
                        }
                        else
                            $this->GroupValues["groups_offline"][$id] = $transport;
                    }
                }
            }
		if(isset($_GET[GET_EXTERN_PREFERENCE]) && Encoding::Base64UrlDecode($_GET[GET_EXTERN_PREFERENCE]) == "group")
		{
			if(isset($this->GroupValues["groups_online_amounts"][$this->ReqGroup]) && $this->GroupValues["groups_online_amounts"][$this->ReqGroup] > 0)
			{
				$this->GroupValues["set_by_get_user"] = null;
				$this->GroupValues["req_for_user"] = false;
			}
		}

		if(!empty($this->GroupValues["set_by_get_user"]) && isset($this->GroupValues["groups_online"][$this->GroupValues["set_by_get_user"]]))
			$this->GroupValues["groups_output"][$this->GroupValues["set_by_get_user"]] = $this->GroupValues["groups_online"][$this->GroupValues["set_by_get_user"]];
		else if(!empty($this->GroupValues["set_by_get_group"]) && isset($this->GroupValues["groups_online"][$this->GroupValues["set_by_get_group"]]))
			$this->GroupValues["groups_output"][$this->GroupValues["set_by_get_group"]] = $this->GroupValues["groups_online"][$this->GroupValues["set_by_get_group"]];
		else if(!empty($this->GroupValues["set_by_cookie"]) && isset($this->GroupValues["groups_online"][$this->GroupValues["set_by_cookie"]]))
			$this->GroupValues["groups_output"][$this->GroupValues["set_by_cookie"]] = $this->GroupValues["groups_online"][$this->GroupValues["set_by_cookie"]];
		else if(!empty($this->GroupValues["set_by_standard"]) && isset($this->GroupValues["groups_online"][$this->GroupValues["set_by_standard"]]))
			$this->GroupValues["groups_output"][$this->GroupValues["set_by_standard"]] = $this->GroupValues["groups_online"][$this->GroupValues["set_by_standard"]];
		else if(!empty($this->GroupValues["set_by_online"]) && isset($this->GroupValues["groups_online"][$this->GroupValues["set_by_online"]]))
			$this->GroupValues["groups_output"][$this->GroupValues["set_by_online"]] = $this->GroupValues["groups_online"][$this->GroupValues["set_by_online"]];
		else if(!empty($this->GroupValues["set_by_cookie"]) && empty($this->GroupValues["groups_output"]) && !empty($this->GroupValues["groups_offline"][$this->GroupValues["set_by_cookie"]]))
			$this->GroupValues["groups_output"][$this->GroupValues["set_by_cookie"]] = $this->GroupValues["groups_offline"][$this->GroupValues["set_by_cookie"]];
		else if(!empty($this->GroupValues["set_by_get_group"]) && empty($this->GroupValues["groups_output"]) && !empty($this->GroupValues["groups_offline"][$this->GroupValues["set_by_get_group"]]))
			$this->GroupValues["groups_output"][$this->GroupValues["set_by_get_group"]] = $this->GroupValues["groups_offline"][$this->GroupValues["set_by_get_group"]];
		
		foreach($this->GroupValues["groups_online"] as $id => $transport)
			if(!isset($this->GroupValues["groups_output"][$id]))
				$this->GroupValues["groups_output"][$id] = $transport;

		if(empty($this->GroupValues["set_by_get_group"]) || empty($this->GroupValues["groups_online_amounts"][$this->GroupValues["set_by_get_group"]]))
		{
			$ngroups = array();
			foreach($this->GroupValues["groups_output"] as $id => $group)
			{
				$ngroups[$id] = (!empty($this->GroupValues["groups_online_amounts"][$id])) ? $this->GroupValues["groups_online_amounts"][$id] : 0;
				
				if($id == $this->GroupValues["set_by_standard"])
					$ngroups[$id] = 10000;
			}
			arsort($ngroups);
			$nsgroups = array();
			foreach($ngroups as $id => $amount)
				$nsgroups[$id] = $this->GroupValues["groups_output"][$id];
			$this->GroupValues["groups_output"] = $nsgroups;
		}

		$result = array_merge($this->GroupValues["groups_output"],$this->GroupValues["groups_offline"]);
		
		foreach($result as $key => $value)
		{
			$chat_input_fields = "new Array(";
			$count = 0;
			foreach(Server::$Groups[$key]->ChatInputsHidden as $index)
			{
				if($count > 0)$chat_input_fields.=",";
				$chat_input_fields.="'".$index."'";
				$count++;
			}
			$value .= ",".base64_encode($chat_input_fields . ");");
			$chat_input_fields = "new Array(";
			$count = 0;
			foreach(Server::$Groups[$key]->ChatInputsMandatory as $index)
			{
				if($count > 0)$chat_input_fields.=",";
				$chat_input_fields.="'".$index."'";
				$count++;
			}
			$value .= ",".base64_encode($chat_input_fields . ");");
		
			$ticket_input_fields = "new Array(";
			$count = 0;
			foreach(Server::$Groups[$key]->TicketInputsHidden as $index)
			{
				if($count > 0)$ticket_input_fields.=",";
				$ticket_input_fields.="'".$index."'";
				$count++;
			}
			$value .= ",".base64_encode($ticket_input_fields . ");");

            $ticket_input_fields = "new Array(";
			$count = 0;
			foreach(Server::$Groups[$key]->TicketInputsMandatory as $index)
			{
				if($count > 0)$ticket_input_fields.=",";
				$ticket_input_fields.="'".$index."'";
				$count++;
			}
			$value .= ",".base64_encode($ticket_input_fields . ");");

            $language = (($_visitor != null) ? $_visitor->Language : "");

            if(empty($language))
            {
                $language = LocalizationManager::GetBrowserLocalization();
                $language = $language[0];
            }

            $ptlang = LocalizationManager::ReadParams();
            if($ptlang != "" && strlen($ptlang) < 6)
                $language = strtoupper($ptlang);

			$mes = PredefinedMessage::GetByLanguage(Server::$Groups[$key]->PredefinedMessages,$language);
			if($mes != null)
			{
				$value .= ",".base64_encode($mes->ChatInformation);
                $value .= ",".base64_encode($mes->ChatInformationOffline);
				$value .= ",".base64_encode($mes->CallMeBackInformation);
				$value .= ",".base64_encode($mes->TicketInformation);
                $value .= ",".base64_encode($mes->TOSChat);
                $value .= ",".base64_encode($mes->TOSTicket);
                $value .= ",".base64_encode($mes->TOSCallback);
			}
			else
			{
				$value .= ",".base64_encode("");
				$value .= ",".base64_encode("");
				$value .= ",".base64_encode("");
                $value .= ",".base64_encode("");
                $value .= ",".base64_encode("");
                $value .= ",".base64_encode("");
                $value .= ",".base64_encode("");
			}

            $chat_functions = "[";
            $count = 0;
            foreach(Server::$Groups[$key]->ChatFunctions as $index)
            {
                if($count > 0)$chat_functions.=",";
                $chat_functions.="'".$index."'";
                $count++;
            }
            $value .= ",".base64_encode($chat_functions . "]");

			if(!empty($this->Result))
				$this->Result .= ";" . $value;
			else
				$this->Result = $value;
		}
		if($counter == 0)
			$this->ErrorHTML = $LZLANG["client_error_groups"];
	}

    static function GetLanguageSelects($_mylang,$tlanguages="")
    {
        foreach(Server::$Languages as $iso => $langar)
            if($langar[1])
                $tlanguages .= "<option value=\"".strtolower($iso)."\"".(($_mylang[0]==$iso || (strtolower($iso) == strtolower(Server::$Configuration->File["gl_default_language"]) && (empty($_mylang[0]) || (!empty($_mylang[0]) && isset(Server::$Languages[$_mylang[0]]) && !Server::$Languages[$_mylang[0]][1]))))?" SELECTED":"").">".$langar[0]."</option>";
        return $tlanguages;
    }
}

class ExternalChat
{
    static function ReadTextColor()
    {
        return Communication::ReadParameter("etc","#2e8ae5");
    }

    static function ReadBackgroundColor()
    {
        return Communication::ReadParameter("epc","#3091f2");
    }

    static function Login($_user,$_group)
    {

    }

    static function Listen($_user,$init=false)
    {

    }

    static function GetAllowedParameters()
    {
        return Communication::GetTargetParameterString("",null);
    }

    static function ReplaceLogo($_html)
    {
        $hlurl = LocalizationManager::ReaderHeaderParam();
        if(!empty($hlurl))
            $_html = str_replace("<!--logo-->","<img src=\"".$hlurl."\" border=\"0\"><br>",$_html);
        if(!empty(Server::$Configuration->File["gl_cahi"]))
            $_html = str_replace("<!--background-->","<img src=\"".Server::$Configuration->File["gl_cahi"]."\" border=\"0\"><br>",$_html);
        return $_html;
    }
}

class ChatRouter
{
    public $OperatorsBusy;
    public $OperatorsAvailable;
    public $TargetGroupId;
    public $TargetOperatorSystemId;
    public $PreviousOperatorSystemId;
    public $WasTarget = false;
    public $IsPredefined = false;

    public static $WelcomeManager;

    function Find($_visitor,$_allowBots=false,$_requireBot=false,$_exclude=null)
    {
        $util=0;
        $this->OperatorsAvailable = array();
        $this->OperatorsBusy = array();
        $backup_target = null;
        $direct_target = null;
        $result = true;
        $fromDepartment = $fromDepartmentBusy = false;
        $this->TargetOperatorSystemId = $this->PreviousOperatorSystemId;
        $predefined = $this->GetPredefinedOperator($_visitor,$direct_target,$_allowBots,$_requireBot);
        $this->WasTarget = (!empty($this->PreviousOperatorSystemId) || !empty($predefined));

        foreach(Server::$Groups as $id => $group)
            $utilization[$id] = 0;

        foreach(Server::$Operators as $systemId => $internal)
        {
            if(!empty($_exclude) && in_array($systemId,$_exclude))
                continue;

            if(!$internal->IsExternal(Server::$Groups,null,null,false))
                continue;

            $prioSleep = $internal->PrioritySleep($this->TargetGroupId);

            if(!$internal->MobileSleep($_visitor->Browsers[0]) && !$prioSleep && $internal->Status != USER_STATUS_OFFLINE && ($_allowBots || !$internal->IsBot) && (!$_requireBot || $internal->IsBot))
            {
                $group_chats[$systemId] = $internal->GetExternalChatAmount();
                $group_names[$systemId] = $internal->Fullname;
                $group_available[$systemId] = GROUP_STATUS_UNAVAILABLE;
                if(in_array($this->TargetGroupId,$internal->GetGroupList(true)))
                {
                    $intstatus = $internal->GetMaxChatAmountStatus(Server::$Groups[$this->TargetGroupId]);
                    $intlca = (empty(VisitorChat::$DynamicGroup)) ? $internal->LastChatAllocation : 0;

                    if(ChatRouter::$WelcomeManager && $internal->IsBot && $internal->WelcomeManager)
                        $this->TargetOperatorSystemId = $systemId;

                    if(($intstatus == USER_STATUS_ONLINE && ($intlca < (time()-10) || $internal->IsBot)))
                    {
                        $group_available[$systemId] = GROUP_STATUS_AVAILABLE;
                    }
                    elseif($intstatus == USER_STATUS_BUSY || ($intlca >= (time()-10) && !$internal->IsBot))
                    {
                        $group_available[$systemId] = GROUP_STATUS_BUSY;
                        $this->OperatorsBusy[$systemId] = $systemId;
                        if(empty($direct_target) && $predefined == $systemId)
                        {
                            if($this->TargetOperatorSystemId != $predefined)
                            {
                                $this->TargetOperatorSystemId = $predefined;
                                $this->IsPredefined = true;
                            }
                        }
                    }
                }
                else
                {
                    $intstatus = $internal->GetMaxChatAmountStatus();
                    if($intstatus == USER_STATUS_ONLINE)
                        $backup_target = $internal;
                    else if($intstatus == USER_STATUS_BUSY && empty($backup_target))
                        $backup_target = $internal;

                    if(!$this->IsPredefined && !empty($this->TargetOperatorSystemId) && $this->TargetOperatorSystemId == $systemId)
                        $this->TargetOperatorSystemId = null;
                }
                $igroups = $internal->GetGroupList(true);
                for($count=0;$count<count($igroups);$count++)
                {
                    if($this->TargetGroupId == $igroups[$count])
                    {
                        if(!is_array($utilization[$igroups[$count]]))
                            $utilization[$igroups[$count]] = array();
                        if($group_available[$systemId] == GROUP_STATUS_AVAILABLE)
                            $utilization[$igroups[$count]][$systemId] = $group_chats[$systemId];
                    }
                }
            }
        }
        if(isset($utilization[$this->TargetGroupId]) && is_array($utilization[$this->TargetGroupId]))
        {
            arsort($utilization[$this->TargetGroupId]);
            reset($utilization[$this->TargetGroupId]);
            $util = end($utilization[$this->TargetGroupId]);
            $this->OperatorsAvailable = $utilization[$this->TargetGroupId];
        }
        if(isset($group_available) && is_array($group_available) && in_array(GROUP_STATUS_AVAILABLE,$group_available))
            $fromDepartment = true;
        elseif(isset($group_available) && is_array($group_available) && in_array(GROUP_STATUS_BUSY,$group_available))
            $fromDepartmentBusy = true;

        if(isset($group_chats) && is_array($group_chats) && isset($fromDepartment) && $fromDepartment)
            foreach($group_chats as $systemId => $amount)
                if(($group_available[$systemId] == GROUP_STATUS_AVAILABLE && $amount <= $util))
                    $available_internals[] = $systemId;

        if($fromDepartment && sizeof($available_internals) > 0)
        {
            if(is_array($available_internals))
            {
                if(!empty($predefined) && (in_array($predefined,$available_internals) || Server::$Operators[$predefined]->Status == USER_STATUS_ONLINE))
                    $matching_internal = $predefined;
                else
                {
                    /*
                    $isInvite = !Is::Null($inv_sender = $_visitor->Browsers[0]->GetLastInvitationSender());
                    $routToManualInviteSender = $isInvite && (empty(Server::$Configuration->File["gl_imda"]) && empty($_visitor->ChatRequests[0]->EventActionId));
                    $routToAutoInviteSender = $isInvite && (empty(Server::$Configuration->File["gl_iada"]) && !empty($_visitor->ChatRequests[0]->EventActionId));
                    */
                    if(false /*&& ($routToManualInviteSender || $routToAutoInviteSender) && in_array($inv_sender,$available_internals)*/)
                    {
                        //$matching_internal = $inv_sender;
                    }
                    else
                    {
                        $available_internals_prio = array();
                        $available_internals_prio_max = array();
                        $maxp = 0;

                        foreach($available_internals as $systemId)
                        {
                            $available_internals_prio[$systemId] = Server::$Groups[$this->TargetGroupId]->GetChatPriority($systemId);
                            $maxp = max($maxp,$available_internals_prio[$systemId]);
                        }

                        foreach($available_internals_prio as $systemId => $prio)
                        {
                            if($prio == $maxp)
                            {
                                $available_internals_prio_max[$systemId] = $prio;
                            }
                        }

                        if($maxp > 0)
                        {
                            $matching_internal = array_rand($available_internals_prio_max,1);
                        }
                        else
                        {
                            $matching_internal = array_rand($available_internals,1);
                            $matching_internal = $available_internals[$matching_internal];
                        }
                    }
                }
            }

            if((!$this->IsPredefined && Server::$Configuration->File["gl_alloc_mode"] != ALLOCATION_MODE_ALL) || $direct_target == $matching_internal || Server::$Operators[$matching_internal]->IsBot || !empty(VisitorChat::$DynamicGroup))
                $this->TargetOperatorSystemId = $matching_internal;
        }
        else if(!$fromDepartmentBusy)
        {
            $result = false;
            $this->OperatorsAvailable = array();
        }
        return $result;
    }

    function GetPredefinedOperator($_user,&$direct_target,$_allowBots,$_requireBot,$desired="")
    {
        if(!empty($this->TargetOperatorSystemId) && isset(Server::$Operators[$this->TargetOperatorSystemId]) && Server::$Operators[$this->TargetOperatorSystemId]->Status < USER_STATUS_OFFLINE)
        {
            if(!(!empty($this->TargetGroupId) && !in_array($this->TargetGroupId,Server::$Operators[$this->TargetOperatorSystemId]->GetGroupList(true))))
                $desired = $this->TargetOperatorSystemId;
        }
        else
        {
            $this->TargetOperatorSystemId = null;
            $opParam = Operator::ReadParams();
            if(!empty($opParam))
                $desired = $direct_target = Operator::GetSystemId($opParam);
            else if(!Is::Null(Cookie::Get("internal_user")) && !empty(Server::$Configuration->File["gl_save_op"]))
            {
                $desired = Operator::GetSystemId(Cookie::Get("internal_user"));
                if(!empty(Server::$Operators[$desired]) && !(!empty($this->TargetGroupId) && !in_array($this->TargetGroupId,Server::$Operators[$desired]->GetGroupList(true))))
                    $direct_target = $desired;
                else
                    $desired = "";
            }
            else if(empty($desired) && !empty(Server::$Configuration->File["gl_save_op"]))
            {
                $desired = $_user->GetLastChatOperator(true);
            }
        }

        if(!empty($desired) && Server::$Operators[$desired]->MobileSleep($_user->Browsers[0]))
            $this->TargetOperatorSystemId = $desired = "";
        else if(!empty($desired) && !$_allowBots && Server::$Operators[$desired]->IsBot)
            $this->TargetOperatorSystemId = $desired = "";
        else if(!empty($desired) && $_requireBot && !Server::$Operators[$desired]->IsBot)
            $this->TargetOperatorSystemId = $desired = "";

        return $desired;
    }

    function GetQueuePosition($_targetGroup,$_startTime=0,$_position = 1)
    {
        VisitorMonitoring::$Visitor->Browsers[0]->SetStatus(CHAT_STATUS_OPEN);
        $result = DBManager::Execute(true, "SELECT `priority`,`request_operator`,`request_group`,`chat_id`,`first_active` FROM `" . DB_PREFIX . DATABASE_VISITOR_CHATS . "` WHERE `status`='0' AND `exit`='0' AND `chat_id`>0 AND `last_active`>" . (time() - Server::$Configuration->File["timeout_chats"]) . " ORDER BY `priority` DESC,`first_active` ASC;");
        if($result)
        {
            while($row = DBManager::FetchArray($result))
            {
                if($row["chat_id"] == VisitorMonitoring::$Visitor->Browsers[0]->ChatId)
                {
                    $_startTime = $row["first_active"];
                    break;
                }
                else if($row["request_group"]==$_targetGroup && $row["request_operator"]==VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatPartner)
                {
                    $_position++;
                }
                else if($row["request_group"]==$_targetGroup && ($row["request_operator"]!=VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatPartner && empty($row["request_operator"])))
                {
                    $_position++;
                }
                else if(!empty(VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatPartner) && VisitorMonitoring::$Visitor->Browsers[0]->DesiredChatPartner==$row["request_operator"])
                {
                    $_position++;
                }
            }
        }
        define("CHAT_START_TIME",$_startTime);
        return $_position;
    }

    function GetQueueWaitingTime($_position,$min=1)
    {
        $busy = max(1,count($this->OperatorsBusy));

        $waitingTimeAVGSec = 60;
        if(isset(Server::$Configuration->File["gl_qwts"]))
            $waitingTimeAVGSec = Server::$Configuration->File["gl_qwts"];

        if(!empty($waitingTimeAVGSec))
            $min = ($waitingTimeAVGSec/60)/$busy;
        else
            $min = $min/$busy;

        $minb = $min;
        for($i = 1;$i < $_position; $i++)
        {
            $minb *= 0.9;
            $min += $minb;
        }
        $min /= Server::$Configuration->File["gl_sim_ch"];
        $min -= abs((time() - CHAT_START_TIME) / 60);
        if($min <= 0)
            $min = 1;

        return min(10,ceil($min));
    }
}
?>
