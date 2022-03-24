<?php
/****************************************************************************************
* LiveZilla functions.internal.process.inc.php
* 
* Copyright 2018 LiveZilla GmbH
* All rights reserved.
* LiveZilla is a registered trademark.
* 
* Improper changes to this file may cause critical errors.
****************************************************************************************/

if(!defined("IN_LIVEZILLA"))
	die();

function processUpdateReport()
{
	$count = 0;
	if(STATS_ACTIVE)
    {
        CacheManager::FlushKey(DATA_CACHE_KEY_STATS);
        Server::$Statistic = new StatisticProvider();
		while(isset($_POST[POST_INTERN_PROCESS_UPDATE_REPORT . "_va_" . $count]))
		{
			$parts = explode("_",$_POST[POST_INTERN_PROCESS_UPDATE_REPORT . "_va_" . $count]);
			if($parts[1]==0)
				$report = new StatisticYear($parts[0],0,0,0,0);
			else if($parts[2]==0)
				$report = new StatisticMonth($parts[0],$parts[1],0,0,0);
			else
				$report = new StatisticDay($parts[0],$parts[1],$parts[2],0,0);
			$report->Update(!empty($_POST[POST_INTERN_PROCESS_UPDATE_REPORT . "_vb_" . $count]));
			$count++;
		}
    }
}

function processAuthentications()
{
	if(isset($_POST[POST_INTERN_PROCESS_AUTHENTICATIONS . "_va"]))
        if(OperatorRequest::IsValidated())
        {
            $users = explode(POST_ACTION_VALUE_SPLITTER,$_POST[POST_INTERN_PROCESS_AUTHENTICATIONS . "_va"]);
            $passwords = explode(POST_ACTION_VALUE_SPLITTER,$_POST[POST_INTERN_PROCESS_AUTHENTICATIONS . "_vb"]);
            foreach($users as $key => $user)
            {
                if($user == CALLER_SYSTEM_ID)
                {
                    Server::$Operators[$user]->ChangePassword($passwords[$key]);
                    Server::$Operators[$user]->SetPasswordChangeNeeded(false);
                    Server::$Response->Authentications = "<val userid=\"".base64_encode($user)."\" />\r\n";
                }
            }
        }
}

function processStatus()
{
	if(isset($_POST["p_user_status"]))
	{
        if(Is::Defined("LOGIN") && Server::$Operators[CALLER_SYSTEM_ID]->Status == USER_STATUS_OFFLINE)
            return;

        if(Server::$Operators[CALLER_SYSTEM_ID]->Status != $_POST["p_user_status"] || !empty($_POST["p_groups_status"]) || isset($_POST["p_user_status_text"]) || (isset($_POST[POST_GLOBAL_TYPING]) && Server::$Operators[CALLER_SYSTEM_ID]->Typing != $_POST[POST_GLOBAL_TYPING]))
        {
            Server::$Operators[CALLER_SYSTEM_ID]->Status = $_POST["p_user_status"];
            Server::$Operators[CALLER_SYSTEM_ID]->SaveUpdated = true;

            if(isset($_POST["p_user_status_text"]) && $_POST["p_user_status_text"] != Server::$Operators[CALLER_SYSTEM_ID]->StatusText)
                Server::$Operators[CALLER_SYSTEM_ID]->SetStatusText($_POST["p_user_status_text"]);

            if(isset($_POST[POST_GLOBAL_TYPING]))
                Server::$Operators[CALLER_SYSTEM_ID]->Typing = $_POST[POST_GLOBAL_TYPING];

            if(!empty($_POST["p_groups_status"]))
            {
                Server::$Operators[CALLER_SYSTEM_ID]->GroupsAway = array();
                $i=0;
                while(isset($_POST["p_groups_status_" . $i]))
                    Server::$Operators[CALLER_SYSTEM_ID]->GroupsAway[] = $_POST["p_groups_status_" . $i++];
            }

            Server::$Operators[CALLER_SYSTEM_ID]->Save(false);
            Server::ForceUpdate(array("INTERNAL"));
        }
        else
        {
            if((time() - Server::$Operators[CALLER_SYSTEM_ID]->LastActive) >= 15)
            {
                Server::$Operators[CALLER_SYSTEM_ID]->Save();
            }
        }
	}
}

function processEvents()
{
    $count = 0;
    while(isset($_POST[POST_INTERN_PROCESS_EVENTS . "_va_" . $count]))
    {
        $event = new Event($_POST[POST_INTERN_PROCESS_EVENTS . "_va_" . $count],$_POST[POST_INTERN_PROCESS_EVENTS . "_vb_" . $count],$_POST[POST_INTERN_PROCESS_EVENTS . "_vc_" . $count],$_POST[POST_INTERN_PROCESS_EVENTS . "_vd_" . $count],$_POST[POST_INTERN_PROCESS_EVENTS . "_ve_" . $count],$_POST[POST_INTERN_PROCESS_EVENTS . "_vf_" . $count],$_POST[POST_INTERN_PROCESS_EVENTS . "_vg_" . $count],$_POST[POST_INTERN_PROCESS_EVENTS . "_vh_" . $count],$_POST[POST_INTERN_PROCESS_EVENTS . "_vk_" . $count],$_POST[POST_INTERN_PROCESS_EVENTS . "_vl_" . $count],$_POST[POST_INTERN_PROCESS_EVENTS . "_vm_" . $count],$_POST[POST_INTERN_PROCESS_EVENTS . "_vn_" . $count],$_POST[POST_INTERN_PROCESS_EVENTS . "_vo_" . $count],$_POST[POST_INTERN_PROCESS_EVENTS . "_vp_" . $count],$_POST[POST_INTERN_PROCESS_EVENTS . "_vq_" . $count],$_POST[POST_INTERN_PROCESS_EVENTS . "_vs_" . $count],$_POST[POST_INTERN_PROCESS_EVENTS . "_vt_" . $count],$_POST[POST_INTERN_PROCESS_EVENTS . "_vu_" . $count],$_POST[POST_INTERN_PROCESS_EVENTS . "_vv_" . $count],$_POST[POST_INTERN_PROCESS_EVENTS . "_vw_" . $count],$_POST[POST_INTERN_PROCESS_EVENTS . "_vy_" . $count],$_POST[POST_INTERN_PROCESS_EVENTS . "_vz_" . $count],$_POST[POST_INTERN_PROCESS_EVENTS . "_vaa_" . $count]);

        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_EVENTS . "` WHERE `id`='" . DBManager::RealEscape($event->Id) . "' LIMIT 1;");
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_EVENT_ACTIONS . "` WHERE NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_EVENTS . "` WHERE `id` = `" . DB_PREFIX . DATABASE_EVENT_ACTIONS . "`.`eid`)");
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_EVENT_ACTION_RECEIVERS . "` WHERE NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_EVENT_ACTIONS . "` WHERE `id` = `" . DB_PREFIX . DATABASE_EVENT_ACTION_RECEIVERS . "`.`action_id`)");
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_EVENT_FUNNELS . "` WHERE NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_EVENT_URLS . "` WHERE `id` = `" . DB_PREFIX . DATABASE_EVENT_FUNNELS . "`.`uid`)");
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_EVENT_FUNNELS . "` WHERE NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_EVENTS . "` WHERE `id` = `" . DB_PREFIX . DATABASE_EVENT_FUNNELS . "`.`eid`)");
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_EVENT_ACTION_SENDERS . "` WHERE NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_EVENT_ACTIONS . "` WHERE `id` = `" . DB_PREFIX . DATABASE_EVENT_ACTION_SENDERS . "`.`pid`)");
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_EVENT_GOALS . "` WHERE NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_GOALS . "` WHERE `id` = `" . DB_PREFIX . DATABASE_EVENT_GOALS . "`.`goal_id`)");
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_EVENT_URLS . "` WHERE NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_EVENTS . "` WHERE `id` = `" . DB_PREFIX . DATABASE_EVENT_URLS . "`.`eid`)");

        if(!isset($_POST[POST_INTERN_PROCESS_EVENTS . "_vx_" . $count]))
        {
            $countdataconditions = 0;
            $event->DataConditions = array();
            while(isset($_POST[POST_INTERN_PROCESS_EVENTS . "_vw_" . $count . "_a_" .$countdataconditions]))
            {
                $event->DataConditions[] = array(base64_encode($_POST[POST_INTERN_PROCESS_EVENTS . "_vw_" . $count . "_a_" .$countdataconditions]),base64_encode($_POST[POST_INTERN_PROCESS_EVENTS . "_vw_" . $count . "_b_" .$countdataconditions]));
                $countdataconditions++;
            }

            DBManager::Execute(true, $event->GetSQL());
            $counturl = 0;
            while(isset($_POST[POST_INTERN_PROCESS_EVENTS . "_vi_" . $count . "_a_" .$counturl]))
            {
                $eventURL = new EventURL($_POST[POST_INTERN_PROCESS_EVENTS . "_vi_" . $count . "_f_" .$counturl],$event->Id,$_POST[POST_INTERN_PROCESS_EVENTS . "_vi_" . $count . "_a_" .$counturl],$_POST[POST_INTERN_PROCESS_EVENTS . "_vi_" . $count . "_b_" .$counturl],$_POST[POST_INTERN_PROCESS_EVENTS . "_vi_" . $count . "_c_" .$counturl],$_POST[POST_INTERN_PROCESS_EVENTS . "_vi_" . $count . "_d_" .$counturl]);
                DBManager::Execute(true, $eventURL->GetSQL());
                if(isset($_POST[POST_INTERN_PROCESS_EVENTS . "_vi_" . $count . "_e_" .$counturl]))
                    DBManager::Execute(true, "INSERT INTO `" . DB_PREFIX . DATABASE_EVENT_FUNNELS . "` (`eid`,`uid`,`ind`) VALUES ('" . DBManager::RealEscape($event->Id) . "','" . DBManager::RealEscape($eventURL->Id) . "','" . DBManager::RealEscape($_POST[POST_INTERN_PROCESS_EVENTS . "_vi_" . $count . "_e_" . $counturl]) . "');");
                $counturl++;
            }

            $countgoals = 0;
            DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_EVENT_GOALS . "` WHERE `event_id` = '" . DBManager::RealEscape($event->Id) . "';");
            while(isset($_POST[POST_INTERN_PROCESS_EVENTS . "_vs_" . $count . "_a_" .$countgoals]))
            {
                DBManager::Execute(true, "INSERT INTO `" . DB_PREFIX . DATABASE_EVENT_GOALS . "` (`event_id`,`goal_id`) VALUES ('" . DBManager::RealEscape($event->Id) . "','" . DBManager::RealEscape($_POST[POST_INTERN_PROCESS_EVENTS . "_vs_" . $count . "_a_" . $countgoals]) . "');");
                $countgoals++;
            }

            $countaction = 0;
            while(isset($_POST[POST_INTERN_PROCESS_EVENTS . "_vj_" . $count . "_a_" .$countaction]))
            {
                $eventAction = new EventAction($event->Id,$_POST[POST_INTERN_PROCESS_EVENTS . "_vj_" . $count . "_a_" .$countaction],$_POST[POST_INTERN_PROCESS_EVENTS . "_vj_" . $count . "_b_" .$countaction],$_POST[POST_INTERN_PROCESS_EVENTS . "_vj_" . $count . "_c_" .$countaction]);
                DBManager::Execute(true, $eventAction->GetSQL());
                if(($eventAction->Type == 2 || $eventAction->Type == 22) && isset($_POST[POST_INTERN_PROCESS_EVENTS . "_vj_" . $count . "_inv_a_" .$countaction]))
                {
                    //$invitationSettings = @unserialize(base64_decode(Server::$Configuration->File["gl_invi"]));
                    //array_walk($invitationSettings,"b64dcode");
                    $countsender = 0;
                    while(isset($_POST[POST_INTERN_PROCESS_EVENTS . "_vj_" . $count . "_inv_i_a_" .$countaction . "_" . $countsender]))
                    {
                        $eventActionInvitationSender = new EventActionSender($eventAction->Id,$_POST[POST_INTERN_PROCESS_EVENTS . "_vj_" . $count . "_inv_i_a_" .$countaction . "_" . $countsender],$_POST[POST_INTERN_PROCESS_EVENTS . "_vj_" . $count . "_inv_i_b_" .$countaction . "_" . $countsender],$_POST[POST_INTERN_PROCESS_EVENTS . "_vj_" . $count . "_inv_i_c_" .$countaction . "_" . $countsender]);
                        $eventActionInvitationSender->SaveSender();
                        $countsender++;
                    }

                    if(!empty($_POST[POST_INTERN_PROCESS_EVENTS . "_vj_" . $count . "_inv_r_" .$countaction]))
                    {
                        $eventActionInvitationSender = new EventActionSender($eventAction->Id,$_POST[POST_INTERN_PROCESS_EVENTS . "_vj_" . $count . "_inv_r_" .$countaction]);
                        $eventActionInvitationSender->SaveSender();
                    }

                }
                else if($eventAction->Type < 2)
                {
                    $countreceiver = 0;
                    while(isset($_POST[POST_INTERN_PROCESS_EVENTS . "_vj_" . $count . "_d_" .$countaction . "_" . $countreceiver]))
                    {
                        $eventActionReceiver = new EventActionReceiver($eventAction->Id,$_POST[POST_INTERN_PROCESS_EVENTS . "_vj_" . $count . "_d_" .$countaction . "_" . $countreceiver],$_POST[POST_INTERN_PROCESS_EVENTS . "_vj_" . $count . "_e_" .$countaction. "_" . $countreceiver]);
                        DBManager::Execute(true, $eventActionReceiver->GetSQL());
                        $countreceiver++;
                    }
                }
                $countaction++;
            }
        }
        $count++;
    }
    if($count>0)
    {
        CacheManager::SetDataUpdateTime(DATA_UPDATE_KEY_EVENTS);
        CacheManager::FlushKey(DATA_CACHE_KEY_EVENTS);
    }
}

function processPosts()
{
	$time = time();
	$count = -1;
	while(isset($_POST[POST_INTERN_PROCESS_POSTS . "_va" . ++$count]))
	{
		$intreceivers = array();
		$post = base64_decode($_POST[POST_INTERN_PROCESS_POSTS . "_va" . $count]);
		$rec = $_POST[POST_INTERN_PROCESS_POSTS . "_vb" . $count];
		
		if($rec == GROUP_EVERYONE_INTERN || isset(Server::$Groups[$rec]))
		{
			if($rec == GROUP_EVERYONE_INTERN || !Server::$Groups[$rec]->IsDynamic)
			{
                $npost = null;
				foreach(Server::$Operators as $internal)
					if(!$internal->IsBot && $internal->SystemId != CALLER_SYSTEM_ID)
						if($_POST[POST_INTERN_PROCESS_POSTS . "_vb" . $count] == GROUP_EVERYONE_INTERN || in_array($_POST[POST_INTERN_PROCESS_POSTS . "_vb" . $count],$internal->Groups))
							if(count(array_intersect($internal->Groups,Server::$Operators[CALLER_SYSTEM_ID]->Groups))>0 || (count(Server::$Operators[CALLER_SYSTEM_ID]->GroupsHidden)==0 && count($internal->GroupsHidden)==0))
								if($internal->Status != USER_STATUS_OFFLINE || !empty(Server::$Configuration->File["gl_ogcm"]))
								{
									$intreceivers[$internal->SystemId]=true;
									$npost = new Post($_POST[POST_INTERN_PROCESS_POSTS . "_vc" . $count],CALLER_SYSTEM_ID,$internal->SystemId,$post,$time,"",Server::$Operators[CALLER_SYSTEM_ID]->Fullname);
									$npost->Translation = $_POST[POST_INTERN_PROCESS_POSTS . "_vd" . $count];
									$npost->TranslationISO = $_POST[POST_INTERN_PROCESS_POSTS . "_ve" . $count];
									$npost->Persistent = true;
									if($_POST[POST_INTERN_PROCESS_POSTS . "_vb" . $count] == GROUP_EVERYONE_INTERN || in_array($_POST[POST_INTERN_PROCESS_POSTS . "_vb" . $count],Server::$Operators[CALLER_SYSTEM_ID]->Groups))
										$npost->ReceiverGroup = $_POST[POST_INTERN_PROCESS_POSTS . "_vb" . $count];
									$npost->Save();
								}

                if((isset(Server::$Groups[$rec]) || $rec == GROUP_EVERYONE_INTERN) && $npost != null)
                {
                    $npost->Receiver = $rec;
                    if(!(!empty(Server::$Configuration->File["gl_rm_gc"]) && empty(Server::$Configuration->File["gl_rm_gc_time"])))
                        $npost->SaveHistory();
                }
			}
			else
			{
				foreach(Server::$Groups[$rec]->Members as $member => $persistent)
				{
					if(empty(Server::$Operators[$member]))
						Post::ProcessPostForExternal(Server::$Operators[CALLER_SYSTEM_ID],$_POST[POST_INTERN_PROCESS_POSTS . "_vc" . $count],$member,$rec,$post,$time,false,$_POST[POST_INTERN_PROCESS_POSTS . "_vd" . $count],$_POST[POST_INTERN_PROCESS_POSTS . "_ve" . $count]);
					else if($member != CALLER_SYSTEM_ID && (Server::$Operators[$member]->Status != USER_STATUS_OFFLINE || (!empty(Server::$Configuration->File["gl_ogcm"]) && !Server::$Groups[$rec]->IsDynamic)))
                        processPostForInternal($member,$post,$time,$count,$rec);
				}
			}
		}
		else
		{
			if(!empty(Server::$Operators[CALLER_SYSTEM_ID]->ExternalChats[$rec]))
            {
                Post::ProcessPostForExternal(Server::$Operators[CALLER_SYSTEM_ID],$_POST[POST_INTERN_PROCESS_POSTS . "_vc" . $count],$rec,$rec,$post,$time,true,$_POST[POST_INTERN_PROCESS_POSTS . "_vd" . $count],$_POST[POST_INTERN_PROCESS_POSTS . "_ve" . $count],$_POST[POST_INTERN_PROCESS_POSTS . "_vw" . $count]==1);
            }
            else if(!empty(Server::$Operators[$rec]))
            {
				$post = processPostForInternal($rec,$post,$time,$count,"");
                if(!(!empty(Server::$Configuration->File["gl_rm_oc"]) && empty(Server::$Configuration->File["gl_rm_oc_time"])))
                    $post->SaveHistory();
            }
		}
	}
}

function processPostForInternal($rec,$post,$time,$count,$rgroup)
{
	$npost = new Post($_POST[POST_INTERN_PROCESS_POSTS . "_vc" . $count],CALLER_SYSTEM_ID,$rec,$post,$time,"",Server::$Operators[CALLER_SYSTEM_ID]->Fullname);
	$npost->ReceiverGroup = $rgroup;
	$npost->Persistent = true;
	$npost->Translation = $_POST[POST_INTERN_PROCESS_POSTS . "_vd" . $count];
	$npost->TranslationISO = $_POST[POST_INTERN_PROCESS_POSTS . "_ve" . $count];

    if(isset($_POST[POST_INTERN_PROCESS_POSTS . "_vf" . $count]))
        $npost->ChatId = intval($_POST[POST_INTERN_PROCESS_POSTS . "_vf" . $count]);

	$npost->Save();
    return $npost;
}

function processChatInvitation()
{
	if(isset($_POST[POST_INTERN_PROCESS_REQUESTS . "_va"]))
    {
        $visitors = explode(POST_ACTION_VALUE_SPLITTER,$_POST[POST_INTERN_PROCESS_REQUESTS . "_va"]);
        $browids = explode(POST_ACTION_VALUE_SPLITTER,$_POST[POST_INTERN_PROCESS_REQUESTS . "_vb"]);
        $reqids = explode(POST_ACTION_VALUE_SPLITTER,$_POST[POST_INTERN_PROCESS_REQUESTS . "_vd"]);
        $reqtexts = explode(POST_ACTION_VALUE_SPLITTER,($_POST[POST_INTERN_PROCESS_REQUESTS . "_ve"]));
        $sendergroup = explode(POST_ACTION_VALUE_SPLITTER,($_POST[POST_INTERN_PROCESS_REQUESTS . "_vf"]));

        foreach($reqids as $key => $requestid)
        {
            $request = new ChatRequest(CALLER_SYSTEM_ID,$sendergroup[$key],$visitors[$key],$browids[$key],base64_decode($reqtexts[$key]));
            $request->Save();
            $v = new Visitor($visitors[$key]);
            $v->ForceUpdate();
        }
    }
}

function processFilters()
{
	if(isset($_POST[POST_INTERN_PROCESS_FILTERS . "_va"]))
    {
        $creators = explode(POST_ACTION_VALUE_SPLITTER,$_POST[POST_INTERN_PROCESS_FILTERS . "_va"]);
        $createds = explode(POST_ACTION_VALUE_SPLITTER,$_POST[POST_INTERN_PROCESS_FILTERS . "_vb"]);
        $editors = explode(POST_ACTION_VALUE_SPLITTER,($_POST[POST_INTERN_PROCESS_FILTERS . "_vc"]));
        $ips = explode(POST_ACTION_VALUE_SPLITTER,$_POST[POST_INTERN_PROCESS_FILTERS . "_vd"]);
        $expiredates = explode(POST_ACTION_VALUE_SPLITTER,$_POST[POST_INTERN_PROCESS_FILTERS . "_ve"]);
        $userids = explode(POST_ACTION_VALUE_SPLITTER,$_POST[POST_INTERN_PROCESS_FILTERS . "_vf"]);
        $filternames = explode(POST_ACTION_VALUE_SPLITTER,$_POST[POST_INTERN_PROCESS_FILTERS . "_vg"]);
        $reasons = explode(POST_ACTION_VALUE_SPLITTER,($_POST[POST_INTERN_PROCESS_FILTERS . "_vh"]));
        $filterids = explode(POST_ACTION_VALUE_SPLITTER,$_POST[POST_INTERN_PROCESS_FILTERS . "_vi"]);
        $activestates = explode(POST_ACTION_VALUE_SPLITTER,$_POST[POST_INTERN_PROCESS_FILTERS . "_vj"]);
        $actiontypes = explode(POST_ACTION_VALUE_SPLITTER,$_POST[POST_INTERN_PROCESS_FILTERS . "_vk"]);
        $exertions = explode(POST_ACTION_VALUE_SPLITTER,$_POST[POST_INTERN_PROCESS_FILTERS . "_vl"]);
        $languages = explode(POST_ACTION_VALUE_SPLITTER,$_POST[POST_INTERN_PROCESS_FILTERS . "_vm"]);
        $countries = explode(POST_ACTION_VALUE_SPLITTER,$_POST[POST_INTERN_PROCESS_FILTERS . "_vp"]);
        $allowchats = explode(POST_ACTION_VALUE_SPLITTER,$_POST[POST_INTERN_PROCESS_FILTERS . "_vq"]);
        $allowtickets = explode(POST_ACTION_VALUE_SPLITTER,$_POST[POST_INTERN_PROCESS_FILTERS . "_vr"]);
        $allowtracking = explode(POST_ACTION_VALUE_SPLITTER,$_POST[POST_INTERN_PROCESS_FILTERS . "_vs"]);
        $types = (isset($_POST[POST_INTERN_PROCESS_FILTERS . "_vt"])) ? explode(POST_ACTION_VALUE_SPLITTER,$_POST[POST_INTERN_PROCESS_FILTERS . "_vt"]) : array();
        $emails = (isset($_POST[POST_INTERN_PROCESS_FILTERS . "_vu"])) ? explode(POST_ACTION_VALUE_SPLITTER,$_POST[POST_INTERN_PROCESS_FILTERS . "_vu"]) : array();
        $subjects = (isset($_POST[POST_INTERN_PROCESS_FILTERS . "_vv"])) ? explode(POST_ACTION_VALUE_SPLITTER,$_POST[POST_INTERN_PROCESS_FILTERS . "_vv"]) : array();

        foreach($filterids as $key => $id)
        {
            $filter = new Filter($filterids[$key]);
            $filter->Creator = $creators[$key];
            $filter->Created = ($createds[$key] != "0") ? $createds[$key] : time();
            $filter->Editor = $editors[$key];
            $filter->Edited = time();
            $filter->IP = $ips[$key];
            $filter->Expiredate = $expiredates[$key];
            $filter->Userid = $userids[$key];
            $filter->Reason = $reasons[$key];
            $filter->Filtername = $filternames[$key];
            $filter->Activestate = $activestates[$key];
            $filter->Exertion = $exertions[$key];
            $filter->Languages = $languages[$key];
            $filter->Countries = $countries[$key];
            $filter->AllowChats = !empty($allowchats[$key]);
            $filter->AllowTickets = !empty($allowtickets[$key]);
            $filter->AllowTracking = !empty($allowtracking[$key]);
            $filter->Type = (isset($types[$key])) ? $types[$key] : 0;
            $filter->Email = (isset($emails[$key])) ? $emails[$key] : "";
            $filter->Subject = (isset($subjects[$key])) ? $subjects[$key] : "";
            if($actiontypes[$key] == POST_ACTION_ADD || $actiontypes[$key] == POST_ACTION_EDIT)
                $filter->Save();
            else if($actiontypes[$key] == POST_ACTION_REMOVE)
                $filter->Destroy();
        }
        CacheManager::SetDataUpdateTime(DATA_UPDATE_KEY_FILTERS);
        Server::ForceUpdate(array("FILTERS"));
    }
}

function processKBActions($count=0,$xml="")
{
    while(isset($_POST[POST_INTERN_PROCESS_KB . "_ca_".$count]))
    {
		// copy
		$kbe = new KnowledgeBaseEntry();
		$kbe->Load($_POST[POST_INTERN_PROCESS_KB . "_ca_".$count]);
		$kbe->Id = getId(32);
		$kbe->ParentId = $_POST[POST_INTERN_PROCESS_KB . "_cb_".$count];
		$kbe->Save();
		$count++;
	}

	$count=0;
	while(isset($_POST[POST_INTERN_PROCESS_KB . "_xa_".$count]))
    {
		// cut
		$kbe = new KnowledgeBaseEntry();
		$kbe->Load($_POST[POST_INTERN_PROCESS_KB . "_xa_".$count]);
		$kbe->ParentId = $_POST[POST_INTERN_PROCESS_KB . "_xb_".$count];
		$kbe->Save();
		$count++;
	}

	$count = 0;

    if(isset($_POST[POST_INTERN_PROCESS_KB . "_va_20"]))
        sleep(1);

    while(isset($_POST[POST_INTERN_PROCESS_KB . "_va_".$count]))
    {
        // create & edit
        $kbe = new KnowledgeBaseEntry();
        $kbe->EditorId = $kbe->OwnerId = CALLER_SYSTEM_ID;
        $kbe->Id = $_POST[POST_INTERN_PROCESS_KB . "_va_".$count];
        $kbe->Value = base64_decode($_POST[POST_INTERN_PROCESS_KB . "_vb_".$count]);
        $kbe->Type = $_POST[POST_INTERN_PROCESS_KB . "_vc_".$count];
        $kbe->Title = base64_decode($_POST[POST_INTERN_PROCESS_KB . "_vd_".$count]);
        $kbe->IsDiscarded = !empty($_POST[POST_INTERN_PROCESS_KB . "_ve_".$count]);
        $kbe->ParentId = $_POST[POST_INTERN_PROCESS_KB . "_vf_".$count];
        $kbe->Rank = $_POST[POST_INTERN_PROCESS_KB . "_vg_".$count];
        $kbe->Size = $_POST[POST_INTERN_PROCESS_KB . "_vh_".$count];

        if(isset($_POST[POST_INTERN_PROCESS_KB . "_vj_".$count]))
            $kbe->Languages = $_POST[POST_INTERN_PROCESS_KB . "_vj_".$count];

        if(isset($_POST[POST_INTERN_PROCESS_KB . "_vi_".$count]))
            $kbe->Tags = $_POST[POST_INTERN_PROCESS_KB . "_vi_".$count];

        $kbe->IsPublic = !empty($_POST[POST_INTERN_PROCESS_KB . "_vk_".$count]);
        $kbe->FulltextSearch = !empty($_POST[POST_INTERN_PROCESS_KB . "_vl_".$count]);

        if(isset($_POST[POST_INTERN_PROCESS_KB . "_vm_".$count]))
            $kbe->ShortcutWord = $_POST[POST_INTERN_PROCESS_KB . "_vm_".$count];

        $kbe->AllowBotAccess = !empty($_POST[POST_INTERN_PROCESS_KB . "_vn_".$count]);

        if(isset($_POST[POST_INTERN_PROCESS_KB . "_vp_".$count]))
            $kbe->GroupId = $_POST[POST_INTERN_PROCESS_KB . "_vp_".$count];

        if(isset($_POST[POST_INTERN_PROCESS_KB . "_vq_".$count]))
            $kbe->OwnerId = $_POST[POST_INTERN_PROCESS_KB . "_vq_".$count];

        if(isset($_POST[POST_INTERN_PROCESS_KB . "_vo_".$count]) && !empty($_POST[POST_INTERN_PROCESS_KB . "_vo_".$count]) && strlen($_POST[POST_INTERN_PROCESS_KB . "_vo_".$count]) >= 8 && $_POST[POST_INTERN_PROCESS_KB . "_vo_".$count] != $kbe->Id)
            $kbe->ChangeId($_POST[POST_INTERN_PROCESS_KB . "_vo_".$count]);

        if(isset($_POST[POST_INTERN_PROCESS_KB . "_vr_".$count]))
            $kbe->OrderKey = $_POST[POST_INTERN_PROCESS_KB . "_vr_".$count];

        if(isset($_POST[POST_INTERN_PROCESS_KB . "_vs_".$count]))
            $kbe->InWidget = $_POST[POST_INTERN_PROCESS_KB . "_vs_".$count];

        if(isset($_POST[POST_INTERN_PROCESS_KB . "_vt_".$count]))
            $kbe->Related = $_POST[POST_INTERN_PROCESS_KB . "_vt_".$count];

        $kbe->Save();

        if($kbe->IsDiscarded)
            $kbe->RemoveSubs();

        $xml .= "<r rid=\"".base64_encode($kbe->Id)."\" disc=\"".base64_encode($_POST[POST_INTERN_PROCESS_KB . "_ve_".$count])."\" />\r\n";
        $count++;
    }
    Server::$Response->SetStandardResponse(1,$xml);
}

function processReceivedPosts()
{
	if(isset($_POST[POST_INTERN_PROCESS_RECEIVED_POSTS]))
    {
    	$pids = explode(POST_ACTION_VALUE_SPLITTER,$_POST[POST_INTERN_PROCESS_RECEIVED_POSTS]);
        foreach($pids as $id)
        {
            $post = new Post($id,"","","","","","");
            $post->UpdatePostStatus(CALLER_SYSTEM_ID, true);
        }
    }
}

function processCancelInvitation()
{
	if(isset($_POST[POST_INTERN_PROCESS_CANCEL_INVITATION]))
	{
		$users = explode(POST_ACTION_VALUE_SPLITTER,utf8_decode($_POST[POST_INTERN_PROCESS_CANCEL_INVITATION]));
		foreach($users as $uid)
		{
			DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_CHAT_REQUESTS . "` SET `closed`=1,`canceled`='" . DBManager::RealEscape(CALLER_SYSTEM_ID) . "' WHERE `canceled`='' AND `accepted`=0 AND `declined`=0 AND `receiver_user_id`='" . DBManager::RealEscape($uid) . "';");
            $v = new Visitor($uid);
            $v->ForceUpdate();
        }
	}
}

function processGoals($count=0)
{
    if(isset($_POST[POST_INTERN_PROCESS_GOALS . "_va_" .$count]))
	{
		DBManager::Execute(true, "TRUNCATE TABLE `" . DB_PREFIX . DATABASE_GOALS . "`;");
        if(isset($_POST[POST_INTERN_PROCESS_GOALS . "_vb_" .$count]))
            while(isset($_POST[POST_INTERN_PROCESS_GOALS . "_va_" .$count]))
            {
                DBManager::Execute(true, "INSERT INTO `" . DB_PREFIX . DATABASE_GOALS . "` (`id`, `title`, `description`, `conversion`, `ind`) VALUES ('" . DBManager::RealEscape($_POST[POST_INTERN_PROCESS_GOALS . "_vb_" . $count]) . "', '" . DBManager::RealEscape($_POST[POST_INTERN_PROCESS_GOALS . "_vd_" . $count]) . "', '" . DBManager::RealEscape($_POST[POST_INTERN_PROCESS_GOALS . "_vc_" . $count]) . "', '" . DBManager::RealEscape($_POST[POST_INTERN_PROCESS_GOALS . "_ve_" . $count]) . "','" . DBManager::RealEscape($count) . "');");
                $count++;
            }
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_EVENT_GOALS . "` WHERE NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_GOALS . "` WHERE `id` = `" . DB_PREFIX . DATABASE_EVENT_GOALS . "`.`goal_id`);");
        CacheManager::FlushKey(DATA_CACHE_KEY_DBCONFIG);
		Server::$Response->SetStandardResponse(1,"");
	}
}

function processAutoReplies($count=0)
{

}

function processTicketActions($count=0)
{
    $temporaryIds = array();
    $updateRequiredTickets=$updateRequiredEmails=false;
	while(isset($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vc"]))
	{
		$type = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vc"];
		if($type == "SetTicketStatus")
		{
            $TicketSub = new Ticket();
            $TicketSub->Id = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_va"];
            $TicketSub->Load();
            $TicketSub->ApplyAttributesFromPost($count);

            if($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_0"] != $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_2"])
                $TicketSub->Log(0,CALLER_SYSTEM_ID,$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_0"],$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_2"]);
            if(!empty($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vb"]) && $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vb"] != $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_3"])
                $TicketSub->Log(2,CALLER_SYSTEM_ID,$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vb"],$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_3"]);
            if($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_1"] != $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_4"])
                $TicketSub->Log(3,CALLER_SYSTEM_ID,$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_1"],$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_4"]);
            if(isset($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vs"]) && $TicketSub->Editor != null && $TicketSub->Editor->SubStatus != $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vs"])
                $TicketSub->Log(26,CALLER_SYSTEM_ID,$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vs"],$TicketSub->Editor->SubStatus);
            if(isset($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vu"]) && $TicketSub->SubChannel != $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vu"])
                $TicketSub->Log(27,CALLER_SYSTEM_ID,$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vu"],$TicketSub->SubChannel);
            if(isset($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vt"]) && $TicketSub->Channel != $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vt"])
                $TicketSub->Log(29,CALLER_SYSTEM_ID,$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vt"],$TicketSub->Channel);

            $TicketEditor = new TicketEditor($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_va"]);
            if(!empty($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vb"]))
                $TicketEditor->Editor = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vb"];

			$TicketEditor->Status = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_0"];
            $TicketEditor->GroupId = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_1"];
            $TicketEditor->ApplyAttributesFromPost($count);
            $TicketEditor->Save();

            if($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_1"] != $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_4"])
                $TicketSub->SetGroup($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_1"]);

            $TicketSub->Editor = $TicketEditor;
            $TicketSub->LoadMessages();
            $time = SystemTime::GetUniqueMessageTime(DATABASE_TICKETS,"last_update");
            $TicketSub->SetLastUpdate($time);
            $updateRequiredTickets = true;
		}
		else if($type == "AddTicketEditorReply")
		{
			$TicketSub = new Ticket($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_va"],$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_3"]);
            $TicketSub->Load(false,false);
			$TicketSub->Group = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_4"];
            $TicketSub->Messages[0]->Id = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_7"];
            $TicketSub->Messages[0]->ChannelId = getId(32);
            $TicketSub->Messages[0]->Hash = $TicketSub->GetHash(false);
			$TicketSub->Messages[0]->SenderUserId = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vb"];
			$TicketSub->Messages[0]->Type = 1;
			$TicketSub->Messages[0]->Text = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_0"];
            $TicketSub->Messages[0]->HTML = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_1"];

            $_POST["p_std_tt"] = $_POST["p_std_tmi"] = "";
            $_POST["p_std_ti"] = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_va"];

            $isMaskedReceiver = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_2"] == "[__[MASKED]__]";

            if(!$isMaskedReceiver)
                $TicketSub->Messages[0]->Email = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_2"];

            if($TicketSub->Channel >= 6 && !empty($TicketSub->ChannelId))
            {
                $twchannel = SocialMediaChannel::GetChannelById($TicketSub->ChannelId);
                if($TicketSub->Channel == 7 && $twchannel->StreamType == 1)
                    $TicketSub->Messages[0]->Text = $twchannel->AddScreenName($TicketSub->Messages[0]->Text,$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_2"]);
                else if($TicketSub->Channel == 6)
                    $TicketSub->Messages[0]->Email = $twchannel->PageId;
            }

            $TicketSub->Messages[0]->Subject = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_5"];
			$TicketSub->Messages[0]->Save($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_va"],time());
			
			$acount=8;
			while(isset($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_" . $acount]))
				$TicketSub->Messages[0]->ApplyAttachment($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_" . $acount++]);

            $TicketSub->SendOperatorReply($TicketSub->Messages[0]->Id,$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_2"],$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_6"],$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_ecc"],$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_ebcc"]);

            if(!empty($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_newst"]))
            {
                $TicketSub->LoadStatus();
                $TicketSub->Editor->Status = intval($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_newst"]);
                $TicketSub->Editor->Save();
            }

            $TicketSub->SetLastUpdate(time());
            $updateRequiredTickets=true;
        }
        else if($type == "SetTicketLanguage")
        {
            $TicketSub = new Ticket($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_0"],$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_1"]);
            $TicketSub->LoadMessages();
            $TicketSub->SetLanguage($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_1"]);
            $TicketSub->Log(1,CALLER_SYSTEM_ID,$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_1"],$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_2"]);
            $TicketSub->SetLastUpdate(time());
            $updateRequiredTickets=true;
        }
        else if($type == "DeleteTicketFromServer")
        {
            $TicketSub = new Ticket($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_0"],"");
            $TicketSub->Destroy();
            $TicketSub->Log(7,CALLER_SYSTEM_ID,0,1);
            $TicketSub->SetLastUpdate(time());
            $updateRequiredTickets=true;
        }
        else if($type == "AddToWatchList")
        {
            $TicketSub = new Ticket($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_0"],"");
            $TicketSub->AddToWatchList($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_1"]);
            $updateRequiredTickets=true;
        }
        else if($type == "RemoveFromWatchList")
        {
            $TicketSub = new Ticket($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_0"],"");
            $TicketSub->RemoveFromWatchList(CALLER_SYSTEM_ID);
            $updateRequiredTickets=true;
        }
        else if($type == "SetPriority")
        {
            $TicketSub = new Ticket($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_0"],"");
            $TicketSub->Load();
            if($TicketSub->Priority != $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_1"])
                $TicketSub->Log(28,CALLER_SYSTEM_ID,$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_1"],$TicketSub->Priority);
            $TicketSub->SetPriority($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_1"]);
            $TicketSub->SetLastUpdate(time(),false);
            $updateRequiredTickets=true;
        }
        else if($type == "AddComment")
        {
            $TicketSub = new TicketMessage($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_1"],"");
            $TicketSub->AddComment(CALLER_SYSTEM_ID,$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_0"],$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_2"]);
            $TicketSub = new Ticket($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_2"],"");
            $TicketSub->SetLastUpdate(time());
            $updateRequiredTickets=true;
        }
        else if($type == "LinkChat")
        {
            if(!empty($temporaryIds[$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_0"]]))
                $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_0"] = $temporaryIds[$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_0"]];

            $TicketSub = new Ticket($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_0"],"");
            $TicketSub->LinkChat($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_1"], getId(32));
            $TicketSub->Log(5,CALLER_SYSTEM_ID,$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_0"],$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_1"]);
            $TicketSub->SetLastUpdate(time());
            $updateRequiredTickets=true;
        }
        else if($type == "LinkTicket")
        {
            $TicketSub = new Ticket($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_1"],"");
            $TicketHost = new Ticket($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_0"],"");
            $TicketHost->LinkTicket($TicketSub->Id, getId(32));
            $TicketSub->SetLastUpdate(time());
            $updateRequiredTickets=true;
        }
        else if($type == "EditMessage")
        {
            $ticket = new Ticket($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_1"],"");
            $ticket->LoadStatus();
            $message = new TicketMessage($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_0"],"");

            $message->Load();
            $message->ChangeValue($ticket,10,CALLER_SYSTEM_ID,$message->Fullname,$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_2"]);
            $message->ChangeValue($ticket,11,CALLER_SYSTEM_ID,$message->Email,$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_3"]);
            $message->ChangeValue($ticket,12,CALLER_SYSTEM_ID,$message->Company,$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_4"]);
            $message->ChangeValue($ticket,11,CALLER_SYSTEM_ID,$message->EmailCC,@$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_ecc"]);
            $message->ChangeValue($ticket,11,CALLER_SYSTEM_ID,$message->EmailBCC,@$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_ebcc"]);
            $message->ChangeValue($ticket,13,CALLER_SYSTEM_ID,$message->Phone,$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_5"]);
            $message->ChangeValue($ticket,14,CALLER_SYSTEM_ID,$message->Subject,$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_6"]);

            if(isset($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_7"]))
                $message->ChangeValue($ticket,15,CALLER_SYSTEM_ID,$message->Text,$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_7"]);

            $message->ApplyCustomFromPost($count,true,$ticket,CALLER_SYSTEM_ID);
            $message->Save($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_1"],true);

            $ticket->SetLastUpdate(time(),false);
            $updateRequiredTickets=true;

            if($ticket->Editor != null)
                $ticket->Editor->Save();
        }
		else if($type == "CreateTicket")
		{
			$TicketSub = new Ticket(CacheManager::GetObjectId("ticket_id",DATABASE_TICKETS),"");
            $temporaryIds[$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_11"]] = $TicketSub->Id;
			$TicketSub->Messages[0]->Id = $TicketSub->Id;
            $TicketSub->Messages[0]->ChannelId = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_4"];
			$TicketSub->Channel = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_3"];
			$TicketSub->Group = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_6"];
            $TicketSub->Language = strtoupper(trim($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_10"]));
            $TicketSub->Tags = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vyx"];

            $TicketSub->Messages[0]->Fullname = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_0"];
            $TicketSub->Messages[0]->Email = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_1"];
            $TicketSub->Messages[0]->Text = base64_decode($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_2"]);
            $TicketSub->Messages[0]->Company = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_7"];
            $TicketSub->Messages[0]->Phone = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_8"];
            $TicketSub->Messages[0]->Type = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_9"];
            $TicketSub->Messages[0]->Subject = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_15"];
            $TicketSub->Messages[0]->ApplyCustomFromPost($count);

            $cid = 0;
			while(isset($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_" . $cid]))
            {
                $value = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_" . $cid++];
                if(strpos($value,"[att]") === 0)
				    $TicketSub->Messages[0]->ApplyAttachment(base64_decode(str_replace("[att]","",$value)));
                else if(strpos($value,"[com]") === 0)
                    $TicketSub->Messages[0]->AddComment(CALLER_SYSTEM_ID,$TicketSub->Id,base64_decode(str_replace("[com]","",$value)));
            }

            $TicketSub->Messages[0]->LoadAttachments();
            if(!empty($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_4"]))
            {
                $email = new TicketEmail($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_4"],false,"");
                $email->Load();
                $email->LoadAttachments();
                $TicketSub->Messages[0]->HTML = DBManager::DecodeField($email->BodyHTML);

                foreach($email->Attachments as $rid => $res)
                    if(empty($TicketSub->Messages[0]->Attachments[$rid]))
                        KnowledgeBase::CreateEntry(CALLER_SYSTEM_ID, $rid, "", RESOURCE_TYPE_FILE_INTERNAL, "", true, 100, 0);

                $email->Destroy(true);

                if(!empty($email->Created))
                    $TicketSub->Messages[0]->Created = $email->Created;

                $TicketSub->Messages[0]->EmailCC = $email->CC;
            }

            $TicketSub->Log(6,CALLER_SYSTEM_ID,$TicketSub->Id,"");

            if(isset($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vx"]))
                $TicketSub->Priority = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vx"];

            if(isset($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vy"]))
                $TicketSub->SenderUserId = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vy"];

            if(isset($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vyy"]))
                Chat::SetTicketId($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vyy"],"",$TicketSub->Id);

            if(isset($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vyz"]))
            {
                $TicketSub->Messages[0]->SenderUserId =
                $TicketSub->SenderUserId = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vyz"];
            }

            if(isset($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vzy"]) && !empty($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vzy"]))
            {
                $TicketSub->SendAutoresponder(new Visitor(""),new VisitorBrowser("",false));
            }

            if(isset($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vz"]))
            {
                $fb = new Feedback($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vz"]);
                $fb->SetTicketId($TicketSub->Id);
            }

			$TicketSub->Save();
            $TicketSub->ApplyAttributesFromPost($count);
            $TicketEditor = new TicketEditor($TicketSub->Id);
            $TicketEditor->Editor = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_13"];
            $TicketEditor->Status = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_12"];
            $TicketEditor->GroupId = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_14"];
            $TicketEditor->ApplyAttributesFromPost($count);
            $TicketEditor->Save();
            $TicketSub->SetLastUpdate(time());
            $updateRequiredTickets = true;
        }
		else if($type == "SetEmailStatus")
		{
            if(isset($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_2"]))
            {
                $Email = new TicketEmail($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_0"],$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_1"],$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_2"]);
                $Email->SetStatus();
                $updateRequiredEmails=true;
            }
		}
        else if($type == "ForwardMessage")
        {
            $message = new TicketMessage($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_0"],"");
            $message->Load();
            $message->Forward($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_1"],$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_2"],$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_3"],$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_4"]);
            $ticket = new Ticket($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_5"],"");
            $ticket->Load(true,true);
            $index = $ticket->GetMessageIndex($message->Id);
            $ticket->Log(9,CALLER_SYSTEM_ID,$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_2"],$index);
        }
        else if($type == "ResendMessage")
        {
            $message = new TicketMessage($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_0"],"");
            $message->Load();

            $ticket = new Ticket($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_5"],"");
            $ticket->Load(true,true);
            $index = $ticket->GetMessageIndex($message->Id);
            $ticket->Log(32,CALLER_SYSTEM_ID,$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_2"],$index);

            $ticket->SendOperatorReply($message->Id,$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_2"]);
        }
        else if($type == "MoveMessageIntoTicket")
        {
            // merge
            $message = new TicketMessage($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_1"],"");
            $message->Load(true);
            $message->ChannelId = getId(32);

            $ticket = new Ticket($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_0"],"");
            $ticket->SetLastUpdate(time());
            $ticket->Load();
            $ticket->Id = $message->Id = CacheManager::GetObjectId("ticket_id",DATABASE_TICKETS);
            $ticket->Messages = array();
            $ticket->Messages[0] = $message;
            $ticket->Save();
            $ticket->Log(8,CALLER_SYSTEM_ID,$ticket->Id,$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_0"]);
            $ticket->SetLastUpdate(time());

            $message->SaveAttachments();
            $message->SaveComments($ticket->Id);

            if($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_3"] == 0)
            {
                $message = new TicketMessage($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_1"],"");
                $message->Destroy();
            }
            $updateRequiredTickets = true;
        }
		else if($type == "DeleteAttachment")
		{
			KnowledgeBase::CreateEntry(CALLER_SYSTEM_ID, $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $count . "_vd_0"], "", RESOURCE_TYPE_FILE_INTERNAL, "", true, "100");
		}
		$count++;
	}

    // save draft
    if(isset($_POST["p_std_ti"]))
    {
        $ticket = new Ticket();
        $ticket->Id = $_POST["p_std_ti"];
        $ticket->Log(30,CALLER_SYSTEM_ID,$_POST["p_std_tt"],"",$_POST["p_std_tmi"]);
        $ticket->SetLastUpdate(time(),false);
        $updateRequiredTickets = true;
    }

    // save last ticket view
    if(isset($_POST["p_rot_ti"]))
    {
        $ticket = new Ticket();
        $ticket->Id = $_POST["p_rot_ti"];
        $ticket->Log(31,CALLER_SYSTEM_ID,time(),"","");
    }

    if($updateRequiredTickets)
        CacheManager::SetDataUpdateTime(DATA_UPDATE_KEY_TICKETS);
    if($updateRequiredEmails)
        CacheManager::SetDataUpdateTime(DATA_UPDATE_KEY_EMAILS);
}

function processButtonIcons()
{
    if(!empty($_POST[POST_INTERN_PROCESS_IMAGE_SET . "_ve"]))
    {
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_IMAGES . "`  WHERE `id`='" . DBManager::RealEscape($_POST[POST_INTERN_PROCESS_IMAGE_SET . "_ve"]) . "' AND `button_type`='" . DBManager::RealEscape($_POST[POST_INTERN_PROCESS_IMAGE_SET . "_vf"]) . "' LIMIT 2;");
        if(!empty($_POST[POST_INTERN_PROCESS_IMAGE_SET . "_vb"]))
        {
            DBManager::Execute(true, "INSERT INTO `" . DB_PREFIX . DATABASE_IMAGES . "` (`id`,`online`,`button_type`,`image_type`,`data`) VALUES ('" . DBManager::RealEscape($_POST[POST_INTERN_PROCESS_IMAGE_SET . "_ve"]) . "',1,'" . DBManager::RealEscape($_POST[POST_INTERN_PROCESS_IMAGE_SET . "_vf"]) . "','" . DBManager::RealEscape($_POST[POST_INTERN_PROCESS_IMAGE_SET . "_vb"]) . "','" . DBManager::RealEscape($_POST[POST_INTERN_PROCESS_IMAGE_SET . "_va"]) . "');");
            DBManager::Execute(true, "INSERT INTO `" . DB_PREFIX . DATABASE_IMAGES . "` (`id`,`online`,`button_type`,`image_type`,`data`) VALUES ('" . DBManager::RealEscape($_POST[POST_INTERN_PROCESS_IMAGE_SET . "_ve"]) . "',0,'" . DBManager::RealEscape($_POST[POST_INTERN_PROCESS_IMAGE_SET . "_vf"]) . "','" . DBManager::RealEscape($_POST[POST_INTERN_PROCESS_IMAGE_SET . "_vd"]) . "','" . DBManager::RealEscape($_POST[POST_INTERN_PROCESS_IMAGE_SET . "_vc"]) . "');");
        }
    }
}

function processChatActions()
{
	$count = 0;
	while(isset($_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_va"]))
	{
		$type = $_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_vd"];
		if($type == "OperatorSignOff")
		{
			$op = Server::$Operators[$_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_0"]];
			$op->SignOff();
            Server::ForceUpdate(array("INTERNAL","GROUPS"));
		}
		else if($type == "SendChatTranscriptTo")
		{
			$value = 1;
			while(!empty($_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_" . $value]))
			{
				$result = DBManager::Execute(false, "SELECT * FROM `" . DB_PREFIX . DATABASE_CHAT_ARCHIVE . "` WHERE `chat_id`='" . DBManager::RealEscape($_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_" . $value]) . "' LIMIT 1;");
                if($result)
                    if($row = DBManager::FetchArray($result))
                        Communication::SendChatTranscript($row,true,$_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_0"]);
                $value++;
			}
		}
		else if($type == "CreatePublicGroup")
		{
			$room = new UserGroup();
			$room->IsDynamic = true;
			$room->Id = $_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_0"];
			$room->Descriptions["EN"] = $_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_1"];
			$room->Owner = $_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_2"];
			$room->Save();
            $room->AddMember($_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_2"], false);
            Server::ForceUpdate(array("INTERNAL","GROUPS"));
		}
        else if($type == "SetVisitorDetails")
        {
            $visitor = new Visitor($_POST['p_vi_id']);
            $visitor->LoadVisitorData();
            $visitor->VisitorData->LoadFromPassThru(true);
            $visitor->ApplyVisitorData();
        }
        else if($type == "RemoveFeedback")
        {
            Feedback::Remove($_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_va"]);
        }
        else if($type == "ToggleScreenSharing")
        {
            $v = new Visitor($_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_va"]);
            $v->ToggleScreenSharing($_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_vb"]);
            $v->ForceUpdate();
        }
        else if($type=="ReloadEmails")
        {
            Mailbox::ResetDownloadTime();
            Server::SetCronjobTime("gl_cj_email_in",0);
            SocialMediaChannel::ResetDownloadTime();
            Server::SetCronjobTime("gl_cj_sm_in",0);
            CacheManager::FlushKey(DATA_CACHE_KEY_DBCONFIG);
        }
		else if($type == "DeletePublicGroup")
		{
			$room = new UserGroup();
			$room->Id = $_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_0"];
			$room->Destroy();
            Server::ForceUpdate(array("INTERNAL","GROUPS"));
		}
        else if($type == "RemoveFromChatArchive")
        {
            $chatId = $_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_0"];
            ChatArchive::Remove($chatId);
        }
		else if($type == "JoinPublicGroup")
		{
            $room = new UserGroup();
            $room->Id = $_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_0"];
            $room->AddMember($_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_2"], false);
            Server::ForceUpdate(array("INTERNAL","GROUPS"));

            if(strpos($_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_2"],'~') !== false)
            {
                $parts = explode('~',$_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_2"]);
                $chat = new VisitorChat($parts[0],$parts[1]);
                $chat->SetPublicGroup($_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_0"]);
            }
		}
		else if($type == "QuitPublicGroup")
		{
			$room = new UserGroup();
			$room->Id = $_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_0"];
			$room->RemoveMember($_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_1"]);

            if(strpos($_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_1"],'~') !== false)
            {
                $parts = explode('~',$_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_1"]);
                $chat = new VisitorChat($parts[0],$parts[1]);
                $chat->SetPublicGroup("");
            }

            Server::ForceUpdate(array("INTERNAL","GROUPS"));
		}
		else if($type == "StartOverlayChat")
		{
			$chat = new VisitorChat($_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_va" ],$_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_vb"]);
			$chat->RequestInitChat(CALLER_SYSTEM_ID);
		}
        else if($type == "ChatSetTags")
        {
            ChatArchive::SetTags($_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_1"],$_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_2"]);
        }
        else if($type == "AddVisitorComment")
        {
            $visitor = new Visitor($_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_0"]);
            $visitor->SaveComment(CALLER_SYSTEM_ID,$_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_1"]);
        }
        else if($type == "RemoveVisitorComment")
        {
            $visitor = new Visitor($_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_0"]);
            $visitor->RemoveComment($_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_1"]);
        }
        else if($type == "SetTranslation")
        {
            $chat = new VisitorChat($_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_va" ],$_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_vb"]);
            $chat->ChatId = $_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_0"];
            $chat->SetTranslation($_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_1"]);
        }
		else if(strlen($_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_vb" ]) > 0 && strlen($_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_va" ]) > 0)
		{
			$chat = new VisitorChat($_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_va" ],$_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_vb" ]);
			$chat->ChatId = $_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_vc"];
			$chat->Load();

			if($type == "SetCallMeBackStatus")
				$chat->SetCallMeBackStatus($_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_0"]);
			else if($type == "JoinChatInvisible")
				$chat->JoinChat(CALLER_SYSTEM_ID,true,!empty($_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_0"]));
			else if($type == "JoinChat")
				$chat->JoinChat(CALLER_SYSTEM_ID,false,!empty($_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_0"]));
			else if($type == "SetPriority")
				$chat->SetPriority($_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_0"]);
			else if($type == "SetTargetOperator")
				$chat->SetTargetOperator($_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_0"]);
			else if($type == "SetTargetGroup")
				$chat->SetTargetGroup($_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_0"]);
			else if($type == "AcceptChat")
				$chat->InternalActivate(CALLER_SYSTEM_ID);
			else if($type == "CloseChat")
				$chat->InternalClose(CALLER_SYSTEM_ID);
			else if($type == "TakeChat")
				$chat->TakeChat($_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_1"],$_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_0"],$_POST[POST_INTERN_PROCESS_CHAT_ACTION . "_" . $count . "_ve_2"]);
			else if($type == "DeclineChat")
				$chat->InternalDecline(CALLER_SYSTEM_ID);
			else if($type == "LeaveChat")
				$chat->LeaveChat(CALLER_SYSTEM_ID);
		}
		$count++;
	}
}
?>