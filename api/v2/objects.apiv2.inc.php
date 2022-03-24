<?php

/****************************************************************************************
*
* API version 2.0
*
* Copyright 2017 LiveZilla GmbH
* All rights reserved.
* LiveZilla is a registered trademark.
* 
***************************************************************************************/

if(!defined("IN_LIVEZILLA"))
    die();

class ApiV2
{
    public $ErrorField = "";
    public $ErrorFilter = "";
    public $ActionPerformed = "";
    public $JSONOutput = "";
    public $JSONParams;

    function __construct($_prettyPrint=false)
    {
        if($_prettyPrint && defined("JSON_PRETTY_PRINT"))
            $this->JSONParams = JSON_PRETTY_PRINT;
    }

    function RunActions()
    {
        if(!empty($_POST["p_operator_create"]))
        {
            $this->OperatorCreate();
            return true;
        }
        else if(!empty($_POST["p_operator_delete"]))
        {
            $this->OperatorDelete();
            return true;
        }
        else if(!empty($_POST["p_operators_list"]))
        {
            $this->OperatorsList();
            return true;
        }
        else if(!empty($_POST["p_chats_list"]))
        {
            $this->ChatsList();
            return true;
        }
        else if(!empty($_POST["p_chat_create"]))
        {
            $this->ChatCreate();
            return true;
        }
        else if(!empty($_POST["p_chat_sessions_list"]))
        {
            $this->ChatSessionsList();
            return true;
        }
        else if(!empty($_POST["p_chat_close"]))
        {
            $this->ChatClose();
            return true;
        }
        else if(!empty($_POST["p_chat_add_message"]))
        {
            $this->ChatAddMessage();
            return true;
        }
        else if(!empty($_POST["p_tickets_list"]))
        {
            $this->TicketsList();
            return true;
        }
        else if(!empty($_POST["p_ticket_create"]))
        {
            $this->TicketCreate();
            return true;
        }
        else if(!empty($_POST["p_ticketmessage_create"]))
        {
            $this->TicketMessageCreate();
            return true;
        }
        else if(!empty($_POST["p_ticketeditor_assign"]))
        {
            $this->TicketEditorAssign();
            return true;
        }
        else if(!empty($_POST["p_knowledgebase_entries_list"]))
        {
            $this->KnowledgebaseEntriesList();
            return true;
        }
        else if(!empty($_POST["p_knowledgebase_entry_create"]))
        {
            $this->KnowledgebaseEntryCreate();
            return true;
        }
        else if(!empty($_POST["p_cronjob_execute"]))
        {
            $mt = isset($_POST["p_maintenance"]) && $_POST["p_maintenance"]=="1";
            $sct = isset($_POST["p_send_chat_transcripts"]) && $_POST["p_send_chat_transcripts"]=="1";
            $rm = isset($_POST["p_receive_emails"]) && $_POST["p_receive_emails"]=="1";
            $sm = isset($_POST["p_social_media"]) && $_POST["p_social_media"]=="1";

            Server::RunCronJobs(true,$mt,$sct,$rm,$sm);
            $this->JSONOutput = "SUCCESS";
            return true;
        }
        return false;
    }

    function GetErrorCodes()
    {
        if(!empty($this->ErrorField) && !empty($this->ErrorFilter))
            return " (Field:".$this->ErrorField.", Filter: ".$this->ErrorFilter.")";
        else if(!empty($this->ErrorField))
            return " (Field: ".$this->ErrorField.")";
        else if(!empty($this->ErrorFilter))
            return " (Filter: ".$this->ErrorFilter.")";
        else
            return "";
    }

    function OperatorCreate()
    {
        $op = new Operator(getId(10),getId(10));

        $params = ApiV2::GetObjectFields("Operator");
        if($op = $this->CreateFromJSON($params,json_decode($_POST["p_data"]),$op,"Operator"))
        {
            Logging::SecurityLog("Operator->Create (API)",$op->UserId,Is::Defined("CALLER_SYSTEM_ID"));
            foreach(Server::$Operators as $operator)
                if($operator->UserId == $op->UserId)
                {
                    $this->ErrorField = "UserId";
                    return;
                }
            $op->Created = time();
            array_walk($op->Groups,"b64ecode");
            $op->Password = hash("sha256",$op->Password);

            $op->Save(true);
            array_walk($op->Groups,"b64dcode");
            $this->JSONOutput = APIV2::Encode(array("Operator"=>ApiV2::ClearObject($params,$op)), $this->JSONParams);
            CacheManager::FlushKey(DATA_CACHE_KEY_OPERATORS);
            CacheManager::FlushKey(DATA_CACHE_KEY_ROLES);
        }
    }

    function OperatorsList()
    {
        $output = array("Operators"=>array());
        foreach(Server::$Operators as $operator)
        {
            if(!empty($_POST["p_userid"]) && $operator->UserId != $_POST["p_userid"])
                continue;
            if(isset($_POST["p_status"]) && $operator->Status != $_POST["p_status"])
                //if(!empty($_POST["p_status"]) && $operator->Status != $_POST["p_status"])
                continue;
            if(!empty($_POST["p_group"]) && !in_array($_POST["p_group"],$operator->Groups))
                continue;

            $operator->GetExternalChatAmount();

            if(!empty($_POST["p_full_chats"]))
                $operator->GetExternalObjects();

            $output["Operators"][] = array("Operator"=>ApiV2::ClearObject(ApiV2::GetObjectFields("Operator"),$operator));
        }
        $this->JSONOutput = APIV2::Encode($output, $this->JSONParams);
    }

    function OperatorDelete()
    {
        $op = new Operator(getId(10),getId(10));
        Logging::SecurityLog("Operator->Delete (API)",$op->UserId,Is::Defined("CALLER_SYSTEM_ID"));
        $params = array("UserId"=>array("Input"=>true,"Output"=>true,"Type"=>"string","Required"=>true));
        if($op = $this->CreateFromJSON($params,json_decode($_POST["p_data"]),$op,"Operator"))
        {
            foreach(Server::$Operators as $operator)
            {
                if(strtolower($operator->UserId) == $op->UserId)
                {
                    $operator->Delete();
                    $this->JSONOutput = APIV2::Encode(ApiV2::ClearObject(ApiV2::GetObjectFields("Operator"),$operator), $this->JSONParams);
                    CacheManager::FlushKey(DATA_CACHE_KEY_OPERATORS);
                    return;
                }
            }
        }
        $this->ErrorFilter = "UserId";
    }

    function ChatsList()
    {
        $sql_limit="";
        if(!empty($_POST["p_limit"]))
        {
            if(is_numeric($_POST["p_limit"]))
                $sql_limit = " LIMIT ". $_POST["p_limit"];
            else
            {
                $this->ErrorFilter = "Limit";
                return;
            }
        }
        $sql_where = "WHERE `closed`>0";
        if(!empty($_POST["p_chatid"]))
        {
            $sql_where .= " AND `chat_id`='".DBManager::RealEscape($_POST["p_chatid"])."'";
        }
		if(!empty($_POST["p_group"]))
		{
			$sql_where .= " AND `group_id`='".DBManager::RealEscape($_POST["p_group"])."'";
		}
		if(!empty($_POST["p_operator"]))
		{
			$opsid = Operator::GetSystemId($_POST["p_operator"]);
			if($opsid!=null)
				$sql_where .= " AND `internal_id`='".DBManager::RealEscape($opsid)."'";
			else
			{
				$this->ErrorFilter = "Operator";
				return;
			}
		}
		if(!empty($_POST["p_start_after"]))
		{
			if(is_numeric($_POST["p_start_after"]) && !empty($_POST["p_start_after"]))
				$sql_where .= " AND `time` > ". $_POST["p_start_after"];
			else
			{
				$this->ErrorFilter = "Start After";
				return;
			}
		}
		if(!empty($_POST["p_start_before"]))
		{
			if(is_numeric($_POST["p_start_before"]) && !empty($_POST["p_start_before"]))
				$sql_where .= " AND `time` < ". $_POST["p_start_before"];
			else
			{
				$this->ErrorFilter = "Start Before";
				return;
			}
		}

        $results = array("Chats"=>array());
        $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_CHAT_ARCHIVE . "` " . $sql_where . " ORDER BY `chat_id` ASC " . $sql_limit . ";");
        while($row = DBManager::FetchArray($result))
        {
            $chat = new Chat($row["chat_id"]);
			$chat->SetValues($row,true);
			
			if(isset($_POST["p_output"]))
			{
				if($_POST["p_output"]=="HTML")
					unset($chat->Plaintext);
				if($_POST["p_output"]=="Plaintext")
					unset($chat->HTML);
			}
            
            $results["Chats"][] = array("Chat"=>ApiV2::ClearObject(ApiV2::GetObjectFields("ChatTranscript"),$chat));
        }
        $this->JSONOutput = APIV2::Encode($results, $this->JSONParams);
    }

    function ChatAddMessage()
    {
        $message = new Message();
        $params = ApiV2::GetObjectFields("Message");
        $message = $this->CreateFromJSON($params,json_decode($_POST["p_data"]),$message,"Message");

        $chat = VisitorChat::GetByChatId($message->ChatId);
        if(!($chat != null && empty($chat->Exit)))
        {
            $this->ErrorField = "ChatId";
            return;
        }

        $sender = $chat->SystemId;

        if(isset($message->SystemId) && !empty($message->SystemId))
            $sender = $message->SystemId;

        $chat->LoadMembers();

        $visitor = new Visitor($chat->UserId);
        $visitor->Load();
        $visitor->LoadVisitorData();

        $id = md5(time() . $chat->SystemId . $chat->ChatId . $message->Text);
        $post = new Post($id,$sender,"",$message->Text,time(),$chat->ChatId,$visitor->VisitorData->Fullname);
        $post->BrowserId = $chat->BrowserId;

        foreach($chat->Members as $systemid => $member)
        {
            if(!empty($member->Declined))
                continue;

            if(!empty(Server::$Operators[$systemid]))
            {
                $post->ChatId = $chat->ChatId;
                $post->ReceiverOriginal =
                $post->Receiver = $systemid;
                $post->ReceiverGroup = $chat->SystemId;
                $post->Received=false;
                $post->Save();
            }
        }

        $results = array("Message"=>array());
        $results["Posts"][] = array("Message"=>ApiV2::ClearObject(ApiV2::GetObjectFields("Message"),$post));
        $this->JSONOutput = APIV2::Encode($results, $this->JSONParams);
    }

    function ChatClose()
    {
        $chat = VisitorChat::GetByChatId($_POST["p_chat_id"]);

        if($chat != null)
        {
            $chat->ExternalClose();
            $results = array("Chats"=>array());
            $results["Chats"][] = array("Chat"=>ApiV2::ClearObject(ApiV2::GetObjectFields("Chat"),$chat));
            $this->JSONOutput = APIV2::Encode($results, $this->JSONParams);
        }
        else
            $this->ErrorField = "ChatId";
    }

    function ChatCreate()
    {
        require(LIVEZILLA_PATH . "_lib/objects.devices.inc.php");
        require(LIVEZILLA_PATH . "_lib/objects.external.inc.php");

        Server::InitDataBlock(array("INTERNAL","GROUPS"));

        $chat = new VisitorChat("","",false);
        $params = ApiV2::GetObjectFields("Chat");
        $chat = $this->CreateFromJSON($params,json_decode($_POST["p_data"]),$chat,"Chat");

        $input_browserid = getId(16);
        $input_userid = getId(32);

        if(isset($chat->UserId) && !empty($chat->UserId))
            $input_userid = $chat->UserId;

        $exChat = VisitorChat::GetByUserId($input_userid);
        if($exChat != null && empty($exChat->Exit))
        {
            $this->ErrorField = "UserId";
            return;
        }

        $input_name = "Guest";
        if(isset($chat->Fullname) && !empty($chat->Fullname))
            $input_name = $chat->Fullname;

        $input_email = "";
        if(isset($chat->Email) && !empty($chat->Email))
            $input_email = $chat->Email;

        $input_company = "";
        if(isset($chat->Company) && !empty($chat->Company))
            $input_company = $chat->Company;

        $input_phone = "";
        if(isset($chat->Phone) && !empty($chat->Phone))
            $input_phone = $chat->Phone;

        $input_group = "support";
        if(isset($chat->Group) && !empty($chat->Group))
            $input_group = $chat->Group;

        $input_operator = "";
        if(isset($chat->Operator) && !empty($chat->Operator))
            $input_operator = $chat->Operator;

        $input_country = "US";
        if(isset($chat->Country) && !empty($chat->Country))
            $input_country = $chat->Country;

        $input_language = "EN";
        if(isset($chat->Language) && !empty($chat->Language))
            $input_language = $chat->Language;

        $input_identifier = "API CHAT";
        if(isset($chat->Identifier) && !empty($chat->Identifier))
            $input_identifier = $chat->Identifier;

        $input_ip = "0.0.0.0";
        if(isset($chat->IP) && !empty($chat->IP))
            $input_ip = $chat->IP;

        $input_webhook = "";
        if(isset($chat->Webhook) && !empty($chat->Webhook))
            $input_webhook = $chat->Webhook;

        $input_customs = array();
        if(isset($chat->Customs) && !empty($chat->Customs))
        {
            $input_customs = ApiV2::ToNameBasedArray($chat->Customs);
            $input_customs = DataInput::ToIndexBased($input_customs);
        }

        $def_visitid = "A_" . strtoupper(getId(5));

        $_SERVER["HTTP_ACCEPT_LANGUAGE"] = $input_language . "-". $input_country;

        // visitor data
        $data = new UserData($input_name,$input_email,$input_company,$input_phone,$input_customs);
        $data->Text = $input_identifier;
        $data->Save();

        // visitor browser
        $browser = new VisitorBrowser($input_browserid,$input_userid,false);
        $browser->VisitId = $def_visitid;
        $browser->Save();

        // visitor
        $visitor = new Visitor($input_userid);
        $visitor->VisitId = $def_visitid;
        $visitor->IP = $input_ip;
        $visitor->VisitorData = $data;
        $visitor->Browsers[0] = $browser;
        $visitor->Save("","","","","",$input_country);

        // chat
        $chat = new VisitorChat($input_userid,$input_browserid);
        $chat->VisitId = $def_visitid;
        $chat->LastActive = 2000000000;
        $chat->AllocatedTime = time();
        $chat->DesiredChatGroup = $input_group;
        $chat->Subject = $input_webhook;

        $chat->Save();
        $chat->SetChatId();

        // operator
        $operator = null;
        if(!empty($input_operator))
        {
            $operator = Server::$Operators[$input_operator];
            $chat->DesiredChatPartner = $input_operator;
        }
        else
        {
            $chat->FindOperator(new ChatRouter(),$visitor,false,false,null,false);
            $input_operator = $chat->DesiredChatPartner;
        }

        $chat->SetHost($input_operator);
        $chat->CreateArchiveEntry($operator,$visitor);

        // url
        $url = new HistoryUrl("about:_blank",$input_identifier,"","",time());
        $url->Save($input_browserid,time());

        $results = array("Chats"=>array());
        $results["Chats"][] = array("Chat"=>ApiV2::ClearObject(ApiV2::GetObjectFields("Chat"),$chat));
        $this->JSONOutput = APIV2::Encode($results, $this->JSONParams);
    }

    function TicketsList()
    {
        $sql_limit="";
        if(!empty($_POST["p_limit"]))
        {
            if(is_numeric($_POST["p_limit"]))
                $sql_limit = " LIMIT ". $_POST["p_limit"];
            else
            {
                $this->ErrorFilter = "Limit";
                return;
            }
        }
        $sql_where = "WHERE `t1`.`deleted`=0 AND `t1`.`id`>0 ";
        if(!empty($_POST["p_id"]))
        {
            $sql_where .= " AND `t1`.`id`='".DBManager::RealEscape($_POST["p_id"])."'";
        }
        else
        {
            $joinEditor = false;
            if(!empty($_POST["p_group"]))
            {
                //$joinEditor = true;
                $sql_where .= " AND `t1`.`target_group_id`='".DBManager::RealEscape($_POST["p_group"])."'";
            }
            if(!empty($_POST["p_operator"]))
            {
                $joinEditor = true;
                $opsid = Operator::GetSystemId($_POST["p_operator"]);
                if($opsid!=null)
                    $sql_where .= " AND `t3`.`editor_id`='".DBManager::RealEscape($opsid)."'";
                else
                {
                    $this->ErrorFilter = "Operator";
                    return;
                }
            }
            if(!empty($_POST["p_created_after"]))
            {
                if(is_numeric($_POST["p_created_after"]) && !empty($_POST["p_created_after"]))
                    $sql_where .= " AND `t2`.`created` > ". intval($_POST["p_created_after"]);
                else
                {
                    $this->ErrorFilter = "Created After";
                    return;
                }
            }
            if(!empty($_POST["p_created_before"]))
            {
                if(is_numeric($_POST["p_created_before"]) && !empty($_POST["p_created_before"]))
                    $sql_where .= " AND `t2`.`created` < ". intval($_POST["p_created_before"]);
                else
                {
                    $this->ErrorFilter = "Created Before";
                    return;
                }
            }
            if(isset($_POST["p_status"]) && strlen($_POST["p_status"]) > 0)
            {
                $joinEditor = true;
                $sql_status = "";
                $statuses = explode(',',$_POST["p_status"]);
                if(!empty($statuses))
                    foreach($statuses as $status)
                        $sql_status .= ((!empty($sql_status)) ? " or " : "") . "`t3`.`status` = " . intval($status);

                if(!empty($sql_status))
                    $sql_where .= " AND (".$sql_status.")";
                else
                {
                    $this->ErrorFilter = "Status";
                    return;
                }
            }
        }
        $results = array("Tickets"=>array());

        $joinEditor = ($joinEditor)? " INNER JOIN `".DB_PREFIX.DATABASE_TICKET_EDITORS."` as `t3` ON `t1`.`id`=`t3`.`ticket_id` " : " ";
        $result = DBManager::Execute(true, $d = "SELECT t1.*,t2.* FROM `" . DB_PREFIX . DATABASE_TICKETS . "` as `t1` INNER JOIN `" . DB_PREFIX . DATABASE_TICKET_MESSAGES . "` as `t2` ON `t1`.`id`=`t2`.`id`" . $joinEditor . $sql_where . " ORDER BY `t1`.`id` ASC " . $sql_limit . ";");
	
		while($row = DBManager::FetchArray($result))
        {
            $ticket = new Ticket($row,true,true);
            $results["Tickets"][] = array("Ticket"=>ApiV2::ClearObject(ApiV2::GetObjectFields("Ticket"),$ticket));
        }

        $this->JSONOutput = APIV2::Encode($results, $this->JSONParams);
    }

    function ChatSessionsList()
    {
        $sql_limit = " LIMIT 100";

        $results = array("Chats"=>array());

        $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_VISITOR_CHATS . "` WHERE `exit`=0 AND `external_close`=0 AND `internal_closed`=0 AND `internal_declined`=0 ORDER BY `first_active` DESC" . $sql_limit . ";");

        while($row = DBManager::FetchArray($result))
        {
            $chat = new VisitorChat($row);

            $visitor = new Visitor();
            $visitor->UserId = $chat->UserId;
            $visitor->LoadVisitorData();
            $visitor->Load();

            $chat->Fullname = $visitor->VisitorData->Fullname;
            $chat->Email = $visitor->VisitorData->Email;
            $chat->Company = $visitor->VisitorData->Company;
            $chat->Phone = $visitor->VisitorData->Phone;
            $chat->Customs = $visitor->VisitorData->Customs;
            $chat->Identifier = $visitor->VisitorData->Text;
            $chat->Group = $row["request_group"];
            $chat->Operator = $row["request_operator"];
            $chat->Country = $visitor->GeoCountryISO2;
            $chat->Language = $visitor->Language;
            $chat->IP = $visitor->IP;
            $chat->Webhook = $chat->Subject;

            $results["Chats"][] = array("Chat"=>ApiV2::ClearObject(ApiV2::GetObjectFields("Chat"),$chat));
        }

        $this->JSONOutput = APIV2::Encode($results, $this->JSONParams);
    }

    function TicketCreate()
    {
        $ticket = new Ticket();
        $params = ApiV2::GetObjectFields("Ticket");
        if($ticket = $this->CreateFromJSON($params,json_decode($_POST["p_data"]),$ticket,"Ticket"))
        {
            $ticket->Id = CacheManager::GetObjectId("ticket_id",DATABASE_TICKETS);
            if(!isset(Server::$Groups[$ticket->Group]))
                $this->ErrorField = "Group";
            else
            {
                $ticket->Language = strtoupper($ticket->Language);
                $ticket->Save();
                $this->JSONOutput = APIV2::Encode(array("Ticket"=>ApiV2::ClearObject($params,$ticket)), $this->JSONParams);
            }
        }
        CacheManager::SetDataUpdateTime(DATA_UPDATE_KEY_TICKETS);
    }

    function TicketMessageCreate()
    {
        Server::InitCacheManager();
        Server::InitDataBlock(array("INTERNAL","GROUPS"));
        $message = new TicketMessage();
        $params = ApiV2::GetObjectFields("TicketMessage");

        if($message = $this->CreateFromJSON($params,json_decode($_POST["p_data"]),$message,"TicketMessage"))
        {
            $ticket = new Ticket($message->TicketId,true);
            $ticket->LoadMessages();

            if(count($ticket->Messages)==0)
                $message->Id = $ticket->Id;
            else
                $message->Id = getid(32);

            if(!empty($message->SenderId))
               if(Operator::GetSystemId($message->SenderId)!=null)
                   $message->SenderUserId = Operator::GetSystemId($message->SenderId);

            if(is_array($message->Customs))
            {
                $message->Customs = ApiV2::ToNameBasedArray($message->Customs);
                $message->Customs = DataInput::ToIndexBased($message->Customs);
            }

            if(is_array($message->Comments))
                foreach($message->Comments as $comar)
                    $message->AddComment($comar[0],$ticket->Id,$comar[1]);

            if(empty($message->ChannelId))
                $message->ChannelId = getId(32);

            $message->Hash = $ticket->GetHash();
            $message->Save($ticket->Id);

            if(!empty($_POST["p_sendemailreply"]))
            {
                $ticket->Load();
                $ticket->SendOperatorReply($message->Id,$message->Email,(!empty($_POST["p_quotemessageid"]) ? $_POST["p_quotemessageid"] : ""));
            }
            if(!empty($_POST["p_sendemailresponder"]))
            {
                $ticket->Load();
                $ticket->SendAutoresponder(null,null,$message);
            }
            $ticket->SetLastUpdate(time());
            $this->JSONOutput = APIV2::Encode(array("TicketMessage"=>ApiV2::ClearObject($params,$message)), $this->JSONParams);
        }
        CacheManager::SetDataUpdateTime(DATA_UPDATE_KEY_TICKETS);
    }

    function TicketEditorAssign()
    {
        $editor = new TicketEditor();
        $params = ApiV2::GetObjectFields("TicketEditor");
        if($editor = $this->CreateFromJSON($params,json_decode($_POST["p_data"]),$editor,"TicketEditor"))
        {
            $Ticket = new Ticket();
            $Ticket->Id = $editor->Id;
            if($Ticket->Load())
            {
                $editor->Editor = Operator::GetSystemId($editor->Editor);
                if(isset(Server::$Operators[$editor->Editor]))
                {
                    $editor->Save();
                    $Ticket->Editor = $editor;
                    $Ticket->LoadMessages();
                    $Ticket->SetLastUpdate(time());
                    $this->JSONOutput = APIV2::Encode(array("TicketEditor"=>ApiV2::ClearObject($params,$editor)), $this->JSONParams);
                    CacheManager::SetDataUpdateTime(DATA_UPDATE_KEY_TICKETS);
                }
                else
                    $this->ErrorField = "Editor";
            }
            else
                $this->ErrorField = "Id";
        }
        CacheManager::SetDataUpdateTime(DATA_UPDATE_KEY_TICKETS);
    }

    function KnowledgebaseEntriesList()
    {
        $sql_limit="";
        if(!empty($_POST["p_limit"]))
        {
            if(is_int($_POST["p_limit"]))
                $sql_limit = " LIMIT ". intval($_POST["p_limit"]);
            else
            {
                $this->ErrorFilter = "Limit";
                return;
            }

            if(!empty($_POST["p_offset"]))
            {
                if(is_int($_POST["p_offset"]))
                    $sql_limit .= " OFFSET ". intval($_POST["p_offset"]);
                else
                {
                    $this->ErrorFilter = "Offset";
                    return;
                }
            }
        }
        $sql_where = "WHERE `discarded`=0 AND `parentid`<>100";

        if(!empty($_POST["p_id"]))
            $sql_where .= " AND `id`='".DBManager::RealEscape($_POST["p_id"])."'";
        if(empty($_POST["p_show_private"]))
            $sql_where .= " AND `kb_public`=1";
        if(!empty($_POST["p_parent_id"]))
            $sql_where .= " AND `parentid`='".DBManager::RealEscape($_POST["p_parent_id"])."'";

        $results = array("KnowledgeBaseEntries"=>array());
        $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_RESOURCES . "` " . $sql_where . " ORDER BY `title` ASC " . $sql_limit . ";");

        while($row = DBManager::FetchArray($result))
        {
            $kbe = new KnowledgeBaseEntry($row);
            $results["KnowledgeBaseEntries"][] = array("KnowledgeBaseEntry"=>ApiV2::ClearObject(ApiV2::GetObjectFields("KnowledgeBaseEntry"),$kbe));
        }

        $this->JSONOutput = APIV2::Encode($results, $this->JSONParams);
    }

    function KnowledgebaseEntryCreate()
    {
        $kbEntry = new KnowledgeBaseEntry();
        $params = ApiV2::GetObjectFields("KnowledgeBaseEntry");
        if($kbEntry = $this->CreateFromJSON($params,json_decode($_POST["p_data"]),$kbEntry,"KnowledgeBaseEntry"))
        {
            $parent = KnowledgeBaseEntry::GetById($kbEntry->ParentId,false);
            if(!($parent != null && $parent["type"] == 0))
                $this->ErrorFilter = "ParentId";
            else
            {
                $kbEntry->CalculateRank();
                $kbEntry->EditorId = CALLER_SYSTEM_ID;

                if(empty($kbEntry->OwnerId))
                    $kbEntry->OwnerId = CALLER_SYSTEM_ID;

                $kbEntry->Edited =
                $kbEntry->Created = time()+1;
                if(empty($kbEntry->Id))
                    $kbEntry->Id = getId(32);
                $kbEntry->Save();
                $this->JSONOutput = APIV2::Encode(array("KnowledgeBaseEntry"=>ApiV2::ClearObject($params,$kbEntry)), $this->JSONParams);
            }
        }
    }

    function CreateFromJSON($_params,$_jobject,$_object,$_objname)
    {
        if(!isset($_jobject->{$_objname}))
        {
            $this->ErrorField = $_objname;
            return false;
        }
        foreach ($_params as $fid => $field)
        {
            if(!$field["Input"])
                continue;
            $error = false;
            if(isset($_jobject->{$_objname}->{$fid}))
            {
                $value = $_jobject->{$_objname}->{$fid};
                if($field["Type"]=="int" && intval($value) != $value)
                    $error = true;
                else if($field["Type"]=="array" && !(is_array($_jobject->{$_objname}->{$fid}) && !empty($_jobject->{$_objname}->{$fid})))
                    $error = true;
                else if($field["Type"]=="string" && $field["Required"] && empty($value))
                    $error = true;
            }
            else if($field["Required"])
                $error = true;
            if($error)
            {
                $this->ErrorField = $fid;
                return false;
            }

            if(isset($_jobject->{$_objname}->{$fid}))
                $_object->{$fid} = $_jobject->{$_objname}->{$fid};
        }
        return $_object;
    }

    static function Encode($_toEncode,$_params)
    {
        if(Server::CheckPhpVersion(5,3,0))
            return json_encode($_toEncode, $_params);
        else
            return json_encode($_toEncode);
    }

    static function ToNameBasedArray($_indexBased)
    {
        $nameBased = array();
        foreach($_indexBased as $array)
        {

            $nameBased[$array[0]] = $array[1];
        }
        return $nameBased;
    }

    static function ClearObject($_params,$_object,$onlyOutput=false)
    {
        $stObjectTypes = array("int","string","array","boolean");

        if($_object==null)
            return;

        $cobject = clone $_object;
        $reflection = new ReflectionClass($cobject);
        foreach ($reflection->getProperties() as $property)
        {
            if($property->isStatic())
                continue;

            if(!isset($_params[$property->getName()]) || ($onlyOutput && isset($_params[$property->getName()]) && !$_params[$property->getName()]["Input"]) || (!$onlyOutput && isset($_params[$property->getName()]) && !$_params[$property->getName()]["Output"]))
            {
                unset($cobject->{$property->getName()});
            }
            else
            {
                $type = $_params[$property->getName()]["Type"];

                $obj = $property->getValue($cobject);
                if(!empty($obj) && !in_array($type,$stObjectTypes))
                {
                    if(strpos($type,"array<")===0)
                    {
                        $subtype = str_replace(array("array<",">"),"",$type);
                        foreach($obj as $ind => $subj)
                        {
                            if(class_exists($subtype))
                            {
                                $obj[$ind] = array($subtype=>ApiV2::ClearObject(ApiV2::GetObjectFields($subtype),$subj[$subtype],$onlyOutput));
                            }
                        }
                        $property->setValue($cobject,$obj);
                    }
                    else if(class_exists($type) && !empty($obj[$type]))
                    {
                        $property->SetValue($cobject,ApiV2::ClearObject(ApiV2::GetObjectFields($type),$obj[$type],$onlyOutput));
                    }
                }
            }

        }
        return $cobject;
    }

    static function GetGeneralDefinitions()
    {
        $general["Authentication"]["User"] = array("Type"=>"string","Required"=>true,"Description"=>"API Authentication User","Example"=>"administrator");
        $general["Authentication"]["Pass"] = array("Type"=>"string","Required"=>true,"Description"=>"API Authentication Password (md5 encoded)","Example"=>"md5('password')");
        $general["Parameters"]["JSON_Pretty"] = array("Type"=>"int","Required"=>false,"Description"=>"Activates PHP JSON Pretty Print output","Example"=>"1");
        return $general;
    }

    static function GetObjectDefinitions($_operatorA,$_chatA,$_ticketA,$_voucherA,$_ticketMessageA,$_ticketEditorA,$_kbEntry)
    {
        $objects["Operator"]["Fields"] = ApiV2::GetObjectFields("Operator");

        foreach($objects["Operator"]["Fields"] as $fid => $field)
            if(isset($field["Code"]))
                $_operatorA->{$fid} = $field["Code"];
            else
                $_operatorA->{$fid} = $field["Example"];

        $_operatorOut = ApiV2::ClearObject($objects["Operator"]["Fields"],$_operatorA,true);

        $objects["Operator"]["Functions"]["List"]["Version"] = "5.2.5.0";
        $objects["Operator"]["Functions"]["List"]["Title"] = "List Operators";
        $objects["Operator"]["Functions"]["List"]["Call"] = "POST /api/v2/api.php";
        $objects["Operator"]["Functions"]["List"]["Param"] = "POST /api/v2/api.php p_operators_list=1";
        $objects["Operator"]["Functions"]["List"]["CURL"] = "curl {yourdomain}{livezilla_folder}/api/v2/api.php<br>-d {authenthication}<br>-d p_operators_list=1";
        $objects["Operator"]["Functions"]["List"]["Response"] = "JSON code of operator(s)";
        $objects["Operator"]["Functions"]["List"]["Fields"] = array("true");
        $objects["Operator"]["Functions"]["List"]["Filters"] = array("UserId"=>array("Type"=>"string","Required"=>false,"Comment"=>"Response will be the Operator matching this login Id.","Example"=>"john_doe"),"Status"=>array("Type"=>"int","Required"=>false,"Comment"=>"Returns all operators having this status.","Example"=>"1"),"Group"=>array("Type"=>"string","Required"=>false,"Comment"=>"Returns all operators that are member of this group.","Example"=>"groupid1"),"Full Chats"=>array("Type"=>"bool","Required"=>false,"Comment"=>"Return full list of external chat objects (LiveZilla 5.4.0.1).","Example"=>"1"));
        $objects["Operator"]["Functions"]["List"]["OutputObject"] = array("Operators"=>array(array("Operator"=>$_operatorOut),array("Operator"=>$_operatorOut)));

        $objects["Operator"]["Functions"]["Create"]["Version"] = "5.2.5.0";
        $objects["Operator"]["Functions"]["Create"]["Title"] = "Create Operator";
        $objects["Operator"]["Functions"]["Create"]["Call"] = "POST /api/v2/api.php";
        $objects["Operator"]["Functions"]["Create"]["Param"] = "POST /api/v2/api.php p_operator_create=1";
        $objects["Operator"]["Functions"]["Create"]["CURL"] = "curl {yourdomain}{livezilla_folder}/api/v2/api.php<br>-d {authenthication}<br>-d p_operator_create=1";
        $objects["Operator"]["Functions"]["Create"]["Response"] = "JSON code of created operator";
        $objects["Operator"]["Functions"]["Create"]["Fields"] = array("true");
        $objects["Operator"]["Functions"]["Create"]["Filters"] = array();
        $objects["Operator"]["Functions"]["Create"]["OutputObject"] = array("Operator"=>$_operatorOut);
        $objects["Operator"]["Functions"]["Create"]["InputObject"] = $objects["Operator"]["Fields"];

        $objects["Operator"]["Functions"]["Delete"]["Version"] = "5.2.5.0";
        $objects["Operator"]["Functions"]["Delete"]["Title"] = "Delete Operator";
        $objects["Operator"]["Functions"]["Delete"]["Call"] = "POST /api/v2/api.php";
        $objects["Operator"]["Functions"]["Delete"]["Param"] = "POST /api/v2/api.php p_operator_delete=1";
        $objects["Operator"]["Functions"]["Delete"]["CURL"] = "curl {yourdomain}{livezilla_folder}/api/v2/api.php<br>-d {authenthication}<br>-d p_operator_delete=1";
        $objects["Operator"]["Functions"]["Delete"]["Response"] = "JSON code of deleted operator";
        $objects["Operator"]["Functions"]["Delete"]["Fields"] = array("UserId");
        $objects["Operator"]["Functions"]["Delete"]["Filters"] = array();
        $objects["Operator"]["Functions"]["Delete"]["OutputObject"] = array("Operator"=>$_operatorOut);
        $objects["Operator"]["Functions"]["Delete"]["InputObject"] = array("UserId"=>array("Input"=>true,"Output"=>true,"Type"=>"string","Description"=>"The alphanumeric login ID of the operators.","Required"=>true,"Example"=>"john_doe"));


        $objects["Chat"]["Fields"] = ApiV2::GetObjectFields("Chat");
        $chatsession = new VisitorChat("","",false);
        foreach($objects["Chat"]["Fields"] as $fid => $field)
            if(isset($field["Code"]))
                $chatsession->{$fid} = $field["Code"];
            else
                $chatsession->{$fid} = $field["Example"];
        $chatsession = ApiV2::ClearObject($objects["Chat"]["Fields"],$chatsession);
        $chatsession->ChatId = 12212;
        unset($chatsession->SystemId);

        $objects["Chat"]["Functions"]["List"]["Version"] = "8.0.0.7";
        $objects["Chat"]["Functions"]["List"]["Title"] = "List active Chat Sessions";
        $objects["Chat"]["Functions"]["List"]["Call"] = "POST /api/v2/api.php";
        $objects["Chat"]["Functions"]["List"]["Param"] = "POST /api/v2/api.php p_chat_sessions_list=1";
        $objects["Chat"]["Functions"]["List"]["CURL"] = "curl {yourdomain}{livezilla_folder}/api/v2/api.php<br>-d {authenthication}<br>-d p_chat_sessions_list=1";
        $objects["Chat"]["Functions"]["List"]["Response"] = "JSON code of active chats";
        $objects["Chat"]["Functions"]["List"]["Fields"] = array("true");
        $objects["Chat"]["Functions"]["List"]["Filters"] = array();
        $objects["Chat"]["Functions"]["List"]["OutputObject"] = array("Chats"=>array(array("Chat"=>$chatsession)));

        $objects["Chat"]["Functions"]["Create"]["Version"] = "8.0.0.0";
        $objects["Chat"]["Functions"]["Create"]["Title"] = "Create Chat Session";
        $objects["Chat"]["Functions"]["Create"]["Call"] = "POST /api/v2/api.php";
        $objects["Chat"]["Functions"]["Create"]["Param"] = "POST /api/v2/api.php p_chat_create=1";
        $objects["Chat"]["Functions"]["Create"]["CURL"] = "curl {yourdomain}{livezilla_folder}/api/v2/api.php<br>-d {authenthication}<br>-d p_chat_create=1";
        $objects["Chat"]["Functions"]["Create"]["Response"] = "JSON code of chat created";
        $objects["Chat"]["Functions"]["Create"]["Fields"] = array("true");
        $objects["Chat"]["Functions"]["Create"]["Filters"] = array();
        $objects["Chat"]["Functions"]["Create"]["OutputObject"] = array("Chat"=>$chatsession);
        $objects["Chat"]["Functions"]["Create"]["InputObject"] = $objects["Chat"]["Fields"];

        $objects["Chat"]["Functions"]["Close"]["Version"] = "8.0.0.6";
        $objects["Chat"]["Functions"]["Close"]["Title"] = "Close Chat Session";
        $objects["Chat"]["Functions"]["Close"]["Call"] = "POST /api/v2/api.php";
        $objects["Chat"]["Functions"]["Close"]["Param"] = "POST /api/v2/api.php p_chat_close=1";
        $objects["Chat"]["Functions"]["Close"]["CURL"] = "curl {yourdomain}{livezilla_folder}/api/v2/api.php<br>-d {authenthication}<br>-d p_chat_close=1<br>-d p_chat_id=12212";
        $objects["Chat"]["Functions"]["Close"]["Response"] = "JSON code of chat closed";
        $objects["Chat"]["Functions"]["Close"]["Fields"] = array("true");
        $objects["Chat"]["Functions"]["Close"]["Filters"] = array();
        $objects["Chat"]["Functions"]["Close"]["OutputObject"] = array("Chat"=>$chatsession);
        $objects["Chat"]["Functions"]["Close"]["Filters"] = array("Chat_Id"=>array("Type"=>"string","Required"=>false,"Comment"=>"Chat id of the chat to close.","Example"=>"12212"));

        $message = new Message();
        $message->Text = "Hi, I have a question";
        $message->ChatId = 12212;
        $objects["Chat"]["Functions"]["Message"]["Version"] = "8.0.0.0";
        $objects["Chat"]["Functions"]["Message"]["Title"] = "Add Chat Message";
        $objects["Chat"]["Functions"]["Message"]["Call"] = "POST /api/v2/api.php";
        $objects["Chat"]["Functions"]["Message"]["Param"] = "POST /api/v2/api.php p_chat_add_message=1";
        $objects["Chat"]["Functions"]["Message"]["CURL"] = "curl {yourdomain}{livezilla_folder}/api/v2/api.php<br>-d {authenthication}<br>-d p_chat_add_message=1<br>-d p_data={<br>    \"Message\": {<br>        \"ChatId\": \"12212\",<br>        \"Text\": \"Hi, I have a question\"<br>    }<br>}";
        $objects["Chat"]["Functions"]["Message"]["Response"] = "JSON code of chat created";
        $objects["Chat"]["Functions"]["Message"]["Fields"] = array("true");
        $objects["Chat"]["Functions"]["Message"]["Filters"] = array();
        $objects["Chat"]["Functions"]["Message"]["OutputObject"] = array("Message"=>$message);


        $objects["ChatTranscript"]["Fields"] = ApiV2::GetObjectFields("ChatTranscript");
        foreach($objects["ChatTranscript"]["Fields"] as $fid => $field)
            if(isset($field["Code"]))
                $_chatA->{$fid} = $field["Code"];
            else
                $_chatA->{$fid} = $field["Example"];

        $_chatOut = ApiV2::ClearObject($objects["ChatTranscript"]["Fields"],$_chatA);
        $objects["ChatTranscript"]["Functions"]["List"]["Version"] = "5.2.5.0";
        $objects["ChatTranscript"]["Functions"]["List"]["Title"] = "List Chat Transcripts";
        $objects["ChatTranscript"]["Functions"]["List"]["Call"] = "POST /api/v2/api.php";
        $objects["ChatTranscript"]["Functions"]["List"]["Param"] = "POST /api/v2/api.php p_chats_list=1";
        $objects["ChatTranscript"]["Functions"]["List"]["CURL"] = "curl {yourdomain}{livezilla_folder}/api/v2/api.php<br>-d {authenthication}<br>-d p_chats_list=1<br>-d p_limit=10";
        $objects["ChatTranscript"]["Functions"]["List"]["Response"] = "JSON code of chat transcript(s)";
        $objects["ChatTranscript"]["Functions"]["List"]["Fields"] = array("true");
        $objects["ChatTranscript"]["Functions"]["List"]["Filters"] = array("ChatId"=>array("Type"=>"string","Required"=>false,"Comment"=>"Return the chat matching this chat Id.","Example"=>"11123"),"Group"=>array("Type"=>"string","Required"=>false,"Comment"=>"Return all chats of this group.","Example"=>"groupid1"),"Operator"=>array("Type"=>"string","Required"=>false,"Comment"=>"Return all chats of this operator.","Example"=>"john_doe"),"Start After"=>array("Type"=>"string","Required"=>false,"Comment"=>"Return all chats with start time later than<br>UNIX Timestamp","Example"=>"1505167200"),"Start Before"=>array("Type"=>"string","Required"=>false,"Comment"=>"Return all chats with start time earlier than<br>UNIX Timestamp","Example"=>"1505167200"),"Output"=>array("Type"=>"string","Required"=>false,"Comment"=>"HTML | Plaintext","Example"=>"Plaintext"),"Limit"=>array("Type"=>"int","Required"=>false,"Comment"=>"Maximum number of chats to return.","Example"=>"100"));
        $objects["ChatTranscript"]["Functions"]["List"]["OutputObject"] = array("Chats"=>array(array("ChatTranscript"=>$_chatOut)));

        $objects["Ticket"]["Fields"] = ApiV2::GetObjectFields("Ticket");
        foreach($objects["Ticket"]["Fields"] as $fid => $field)
            if(isset($field["Code"]))
                $_ticketA->{$fid} = $field["Code"];
            else
                $_ticketA->{$fid} = $field["Example"];

        $_ticketA = ApiV2::ClearObject($objects["Ticket"]["Fields"],$_ticketA);

        $objects["Ticket"]["Functions"]["List"]["Version"] = "5.2.5.0";
        $objects["Ticket"]["Functions"]["List"]["Title"] = "List Tickets";
        $objects["Ticket"]["Functions"]["List"]["Call"] = "POST /api/v2/api.php";
        $objects["Ticket"]["Functions"]["List"]["Param"] = "POST /api/v2/api.php p_tickets_list=1";
        $objects["Ticket"]["Functions"]["List"]["CURL"] = "curl {yourdomain}{livezilla_folder}/api/v2/api.php<br>-d {authenthication}<br>-d p_tickets_list=1<br>-d p_limit=10";
        $objects["Ticket"]["Functions"]["List"]["Response"] = "JSON code of ticket(s)";
        $objects["Ticket"]["Functions"]["List"]["Fields"] = array("true");
        $objects["Ticket"]["Functions"]["List"]["Filters"] = array("Id"=>array("Type"=>"string","Required"=>false,"Comment"=>"Return the ticket matching this Id.","Example"=>"11123"),"Group"=>array("Type"=>"string","Required"=>false,"Comment"=>"Return all tickets of this group.","Example"=>"groupid1"),"Operator"=>array("Type"=>"string","Required"=>false,"Comment"=>"Return all tickets of this operator.","Example"=>"john_doe"),"Created After"=>array("Type"=>"string","Required"=>false,"Comment"=>"Return all tickets created later than<br>UNIX Timestamp","Example"=>"1505167200"),"Created Before"=>array("Type"=>"string","Required"=>false,"Comment"=>"Return all tickets created earlier than<br>UNIX Timestamp","Example"=>"1505167200"),"Limit"=>array("Type"=>"int","Required"=>false,"Comment"=>"Maximum number of tickets to return.","Example"=>"100"),"Status"=>array("Type"=>"string","Required"=>false,"Comment"=>"Return all tickets with specific status. Comma-separated list of statuses <br><br>[0] = Open<br>[1] = In Progress<br>[2] = Closed<br>[3] = Deleted<br>[4] = Pending","Example"=>"0,2,3"));
        $objects["Ticket"]["Functions"]["List"]["OutputObject"] = array("Tickets"=>array(array("Ticket"=>$_ticketA)));

        $objects["Ticket"]["Functions"]["Create"]["Version"] = "5.2.5.0";
        $objects["Ticket"]["Functions"]["Create"]["Title"] = "Create Ticket";
        $objects["Ticket"]["Functions"]["Create"]["Call"] = "POST /api/v2/api.php";
        $objects["Ticket"]["Functions"]["Create"]["Param"] = "POST /api/v2/api.php p_ticket_create=1";
        $objects["Ticket"]["Functions"]["Create"]["CURL"] = "curl {yourdomain}{livezilla_folder}/api/v2/api.php<br>-d {authenthication}<br>-d p_ticket_create=1";
        $objects["Ticket"]["Functions"]["Create"]["Response"] = "JSON code of created ticket";
        $objects["Ticket"]["Functions"]["Create"]["Fields"] = array("true");
        $objects["Ticket"]["Functions"]["Create"]["Filters"] = array();
        $objects["Ticket"]["Functions"]["Create"]["OutputObject"] = array("Ticket"=>$_ticketA);
        $objects["Ticket"]["Functions"]["Create"]["InputObject"] = $objects["Ticket"]["Fields"];

        $objects["TicketMessage"]["Fields"] = ApiV2::GetObjectFields("TicketMessage");
        $objects["TicketMessage"]["Parent"] = "Ticket";

        foreach($objects["TicketMessage"]["Fields"] as $fid => $field)
            if(isset($field["Code"]))
                $_ticketMessageA->{$fid} = $field["Code"];
            else
                $_ticketMessageA->{$fid} = $field["Example"];

        $_ticketMessageA = ApiV2::ClearObject($objects["TicketMessage"]["Fields"],$_ticketMessageA);

        $objects["TicketMessage"]["Functions"]["Create"]["Version"] = "5.2.5.0";
        $objects["TicketMessage"]["Functions"]["Create"]["Title"] = "Create Ticket Message";
        $objects["TicketMessage"]["Functions"]["Create"]["Call"] = "POST /api/v2/api.php";
        $objects["TicketMessage"]["Functions"]["Create"]["Param"] = "POST /api/v2/api.php p_ticketmessage_create=1";
        $objects["TicketMessage"]["Functions"]["Create"]["CURL"] = "curl {yourdomain}{livezilla_folder}/api/v2/api.php<br>-d {authenthication}<br>-d p_ticketmessage_create=1";
        $objects["TicketMessage"]["Functions"]["Create"]["Response"] = "JSON code of created ticket message";
        $objects["TicketMessage"]["Functions"]["Create"]["Fields"] = array("true");
        $objects["TicketMessage"]["Functions"]["Create"]["Filters"] = array("SendEmailResponder"=>array("Input"=>true,"Output"=>false,"Type"=>"bool","Comment"=>"Send autoresponder email to sender of message","Required"=>false,"Example"=>"1"),"SendEmailReply"=>array("Input"=>true,"Output"=>false,"Type"=>"bool","Comment"=>"Send operator reply email to receiver of message","Required"=>false,"Example"=>"1"),"QuoteMessageId"=>array("Input"=>true,"Output"=>false,"Type"=>"string","Comment"=>"The Ticket Message ID of the Message the Operator is replying to.","Required"=>false,"Example"=>"90f9cf..."));
        $objects["TicketMessage"]["Functions"]["Create"]["OutputObject"] = array("TicketMessage"=>$_ticketMessageA);
        $objects["TicketMessage"]["Functions"]["Create"]["InputObject"] = $objects["TicketMessage"]["Fields"];

        $objects["TicketEditor"]["Fields"] = ApiV2::GetObjectFields("TicketEditor");
        $objects["TicketEditor"]["Parent"] = "Ticket";

        foreach($objects["TicketEditor"]["Fields"] as $fid => $field)
            if(isset($field["Code"]))
                $_ticketEditorA->{$fid} = $field["Code"];
            else
                $_ticketEditorA->{$fid} = $field["Example"];

        $_ticketEditorA = ApiV2::ClearObject($objects["TicketEditor"]["Fields"],$_ticketEditorA);

        $objects["TicketEditor"]["Functions"]["Assign"]["Version"] = "5.2.5.0";
        $objects["TicketEditor"]["Functions"]["Assign"]["Title"] = "Assign Ticket Editor";
        $objects["TicketEditor"]["Functions"]["Assign"]["Call"] = "POST /api/v2/api.php";
        $objects["TicketEditor"]["Functions"]["Assign"]["Param"] = "POST /api/v2/api.php p_ticketeditor_assign=1";
        $objects["TicketEditor"]["Functions"]["Assign"]["CURL"] = "curl {yourdomain}{livezilla_folder}/api/v2/api.php<br>-d {authenthication}<br>-d p_ticketeditor_assign=1";
        $objects["TicketEditor"]["Functions"]["Assign"]["Response"] = "JSON code of ticket editor";
        $objects["TicketEditor"]["Functions"]["Assign"]["Fields"] = array("true");
        $objects["TicketEditor"]["Functions"]["Assign"]["Filters"] = array();
        $objects["TicketEditor"]["Functions"]["Assign"]["OutputObject"] = array("TicketEditor"=>$_ticketEditorA);
        $objects["TicketEditor"]["Functions"]["Assign"]["InputObject"] = $objects["TicketEditor"]["Fields"];

        $objects["KnowledgeBaseEntry"]["Fields"] = ApiV2::GetObjectFields("KnowledgeBaseEntry");
        $_kbEntryOut = ApiV2::ClearObject($objects["KnowledgeBaseEntry"]["Fields"],$_kbEntry,true);

        $objects["KnowledgeBaseEntry"]["Functions"]["List"]["Version"] = "6.0.0.0";
        $objects["KnowledgeBaseEntry"]["Functions"]["List"]["Title"] = "List Knowledgebase Entries";
        $objects["KnowledgeBaseEntry"]["Functions"]["List"]["Call"] = "POST /api/v2/api.php";
        $objects["KnowledgeBaseEntry"]["Functions"]["List"]["Param"] = "POST /api/v2/api.php p_knowledgebase_entries_list=1";
        $objects["KnowledgeBaseEntry"]["Functions"]["List"]["CURL"] = "curl {yourdomain}{livezilla_folder}/api/v2/api.php<br>-d {authenthication}<br>-d p_knowledgebase_entries_list=1";
        $objects["KnowledgeBaseEntry"]["Functions"]["List"]["Response"] = "JSON code of List of Knowledgebase entries";
        $objects["KnowledgeBaseEntry"]["Functions"]["List"]["Fields"] = array("true");
        $objects["KnowledgeBaseEntry"]["Functions"]["List"]["Filters"] = array("Show Private"=>array("Input"=>true,"Output"=>false,"Type"=>"bool","Comment"=>"Private (non-public) entries will be returned.","Required"=>false,"Example"=>"1"),"Id"=>array("Input"=>true,"Output"=>false,"Type"=>"string","Comment"=>"Will return the entry matching the given Id.","Required"=>false,"Example"=>"14t733d03f64db3b72af327d0d835ebd"),"Limit"=>array("Type"=>"int","Required"=>false,"Comment"=>"Maximum number of tickets to return.","Example"=>"100"),"Offset"=>array("Type"=>"int","Required"=>false,"Comment"=>"Index where to start returning records (requires Limit parameter).","Example"=>"101"),"Parent Id"=>array("Type"=>"string","Required"=>false,"Comment"=>"All child nodes of parent will be returned.","Example"=>"14t733d03f64db3b72af327d0d835ebd"));
        $objects["KnowledgeBaseEntry"]["Functions"]["List"]["OutputObject"] = array("KnowledgeBaseEntries"=>array(array("KnowledgeBaseEntry"=>$_kbEntryOut)));

        $objects["KnowledgeBaseEntry"]["Functions"]["Create"]["Version"] = "6.0.0.0";
        $objects["KnowledgeBaseEntry"]["Functions"]["Create"]["Title"] = "Create Knowledgebase Entry";
        $objects["KnowledgeBaseEntry"]["Functions"]["Create"]["Call"] = "POST /api/v2/api.php";
        $objects["KnowledgeBaseEntry"]["Functions"]["Create"]["Param"] = "POST /api/v2/api.php p_knowledgebase_entry_create=1";
        $objects["KnowledgeBaseEntry"]["Functions"]["Create"]["CURL"] = "curl {yourdomain}{livezilla_folder}/api/v2/api.php<br>-d {authenthication}<br>-d p_knowledgebase_entry_create=1";
        $objects["KnowledgeBaseEntry"]["Functions"]["Create"]["Response"] = "JSON code of KB entry";
        $objects["KnowledgeBaseEntry"]["Functions"]["Create"]["Fields"] = array("true");
        $objects["KnowledgeBaseEntry"]["Functions"]["Create"]["Filters"] = array();
        $objects["KnowledgeBaseEntry"]["Functions"]["Create"]["OutputObject"] = array("KnowledgeBaseEntry"=>$_kbEntryOut);
        $objects["KnowledgeBaseEntry"]["Functions"]["Create"]["InputObject"] = $objects["KnowledgeBaseEntry"]["Fields"];

        $objects["Cronjob"]["Functions"]["Execute"]["Version"] = "7.0.0.3";
        $objects["Cronjob"]["Functions"]["Execute"]["Title"] = "Execute Cronjob";
        $objects["Cronjob"]["Functions"]["Execute"]["Call"] = "POST /api/v2/api.php";
        $objects["Cronjob"]["Functions"]["Execute"]["Param"] = "POST /api/v2/api.php p_cronjob_execute=1";
        $objects["Cronjob"]["Functions"]["Execute"]["CURL"] = "curl {yourdomain}{livezilla_folder}/api/v2/api.php<br>-d {authenthication}<br>-d p_cronjob_execute=1<br>-d p_cronjob_maintain=1<br>-d p_send_chat_transcripts=1<br>-d p_receive_emails=1<br>-d p_social_media=1";
        $objects["Cronjob"]["Functions"]["Execute"]["Response"] = "Result (SUCCESS/FAIL)";
        $objects["Cronjob"]["Functions"]["Execute"]["Fields"] = array("true");
        $objects["Cronjob"]["Functions"]["Execute"]["Filters"] = array(
            "Send Chat Transcripts"=>array("Input"=>true,"Output"=>false,"Type"=>"bool","Comment"=>"Closed chats will be archived and chat transcripts will be sent. Call every 10-20 hours.","Required"=>true,"Example"=>"1"),
            "Receive Emails"=>array("Input"=>true,"Output"=>false,"Type"=>"bool","Comment"=>"Emails will be downloaded from mailboxes. Call every 2-5 minutes.","Required"=>true,"Example"=>"1"),
            "Maintenance"=>array("Type"=>"bool","Required"=>true,"Comment"=>"Pruning and optimizing databases. Call every 10-120 seconds.","Example"=>"1"),
            "Social Media"=>array("Type"=>"bool","Required"=>true,"Comment"=>"Download messages from Social Media. Call every 10-120 seconds.","Example"=>"1"));

        $objects["Cronjob"]["Functions"]["Execute"]["OutputObject"] = "SUCCESS";
        $objects["Cronjob"]["Functions"]["Execute"]["InputObject"] = array();

        return $objects;
    }

    static function GetObjectFields($_objName)
    {
        if($_objName=="Operator")
            return array(
                "UserId"=>array("Input"=>true,"Output"=>true,"Type"=>"string","Description"=>"The alphanumeric login ID of the operators.","Required"=>true,"Example"=>"john_doe"),
                "Firstname"=>array("Input"=>true,"Output"=>true,"Type"=>"string","Description"=>"Operators First Name.","Required"=>true,"Example"=>"John"),
                "Lastname"=>array("Input"=>true,"Output"=>true,"Type"=>"string","Description"=>"Operators Last Name.","Required"=>true,"Example"=>"Doe"),
                "Email"=>array("Input"=>true,"Output"=>true,"Type"=>"string","Description"=>"Operators email.","Required"=>true,"Example"=>"john@doe.com"),
                "Language"=>array("Input"=>true,"Output"=>true,"Type"=>"string","Description"=>"ISO two letter language code.","Required"=>true,"Example"=>"EN"),
                "Webspace"=>array("Input"=>true,"Output"=>true,"Type"=>"int","Description"=>"Webspace in MB operator is allowed to use for file uploads (0=deactivated).","Required"=>true,"Example"=>100),
                "Password"=>array("Input"=>true,"Output"=>false,"Type"=>"string","Description"=>"Operators password (MD5 encoded).","Required"=>true,"Example"=>"md5('johns_password')","Code"=>md5('johns_password')),
                "Groups"=>array("Input"=>true,"Output"=>true,"Type"=>"array","Description"=>"List of group IDs representing the groups the operators is a member of.","Required"=>true,"Example"=>"groupid1,groupid2","Code"=>array('groupid1','groupid2')),
                "Roles"=>array("Input"=>true,"Output"=>true,"Type"=>"string","Description"=>"Comma separated list of roles (added in 8.0.0.0)","Required"=>false,"Example"=>"d9729feb74992cc3482b350163a1a010,5c7cf4770753999d060d5e8a56cc1740"),
                "Location"=>array("Input"=>true,"Output"=>true,"Type"=>"string","Description"=>"Comma separated list of locations (added in 8.0.0.0)","Required"=>false,"Example"=>"germany"),
                "Skills"=>array("Input"=>true,"Output"=>true,"Type"=>"string","Description"=>"Comma separated list of skills (added in 8.0.0.0)","Required"=>false,"Example"=>"purchase,ship,hire"),
                "Description"=>array("Input"=>true,"Output"=>true,"Type"=>"string","Description"=>"Description Text","Required"=>false,"Example"=>"Nice guy"),
                "Level"=>array("Input"=>true,"Output"=>true,"Type"=>"int","Description"=>"Defines if operator is server administrator.","Required"=>false,"Example"=>"1"),
                "Status"=>array("Input"=>false,"Output"=>true,"Type"=>"int","Description"=>"Operator's current online status (0=Online,1=Busy,2=Offline,3=Away).","Required"=>false,"Example"=>"0"),
                "PictureFile"=>array("Input"=>false,"Output"=>true,"Type"=>"string","Description"=>"Operator's Image File, add to full URL.","Required"=>false,"Example"=>"picture.php?operator..."),
                "ChatFile"=>array("Input"=>false,"Output"=>true,"Type"=>"string","Description"=>"File to initiate chat with Operator, add to full URL.","Required"=>false,"Example"=>"chat.php?operator..."),
				"IsBot"=>array("Input"=>false,"Output"=>true,"Type"=>"boolean","Description"=>"Is bot (or human).","Required"=>false,"Example"=>"1"),
                "ExternalChats"=>array("Input"=>false,"Output"=>true,"Type"=>"array","Description"=>"List of active (external) chat objects. (added in 5.4.0.1)","Required"=>false,"Example"=>"chat1,chat2"),
                "ExternalChatCount"=>array("Input"=>false,"Output"=>true,"Type"=>"int","Description"=>"Count of active (external) chats. (added in 5.4.0.1)","Required"=>false,"Example"=>"1")
			);
        if($_objName=="Message")
            return array(
                "ChatId"=>array("Input"=>true,"Output"=>true,"Type"=>"string","Description"=>"","Required"=>true,"Example"=>""),
                "Text"=>array("Input"=>true,"Output"=>true,"Type"=>"string","Description"=>"","Required"=>false,"Example"=>""),
            );
        if($_objName=="ChatTranscript")
            return array(
                "ChatId"=>array("Input"=>false,"Output"=>true,"Type"=>"string","Description"=>"The chat ID","Required"=>true,"Example"=>"11123"),
                "TimeStart"=>array("Input"=>false,"Output"=>true,"Type"=>"int","Description"=>"UNIX Timestamp of chat's start time","Required"=>false,"Example"=>"1395332157"),
                "TimeEnd"=>array("Input"=>false,"Output"=>true,"Type"=>"int","Description"=>"UNIX Timestamp of chat's end time","Required"=>false,"Example"=>"1395332206"),
                "Language"=>array("Input"=>false,"Output"=>true,"Type"=>"string","Description"=>"Visitor's langauge (ISO two letter)","Required"=>false,"Example"=>"EN"),
                "OperatorId"=>array("Input"=>false,"Output"=>true,"Type"=>"string","Description"=>"Operator's User Id","Required"=>false,"Example"=>"john_doe"),
                "VisitorId"=>array("Input"=>false,"Output"=>false,"Type"=>"string","Description"=>"Visitor's Id","Required"=>false,"Example"=>"bd1e10d650"),
                "Group"=>array("Input"=>false,"Output"=>true,"Type"=>"string","Description"=>"Group Id","Required"=>false,"Example"=>"groupid1"),
                "HTML"=>array("Input"=>false,"Output"=>true,"Type"=>"string","Description"=>"HTML Chat Transcript","Required"=>false,"Example"=>htmlentities("<table width=\"97%\" border=\"0\"....")),
                "PlainText"=>array("Input"=>false,"Output"=>true,"Type"=>"string","Description"=>"Plain Text Chat Transcript","Required"=>false,"Example"=>"| 20.03.2014 17:15:59 | Stefa..."),
                "Fullname"=>array("Input"=>false,"Output"=>true,"Type"=>"string","Description"=>"Visitor's name","Required"=>false,"Example"=>"Johanna Doe"),
                "Email"=>array("Input"=>false,"Output"=>true,"Type"=>"string","Description"=>"Visitor's email","Required"=>false,"Example"=>"johanna@jdscompany.com"),
                "Company"=>array("Input"=>false,"Output"=>true,"Type"=>"string","Description"=>"Visitor's company","Required"=>false,"Example"=>"Jdscompany Ltd."),
                "Question"=>array("Input"=>false,"Output"=>true,"Type"=>"string","Description"=>"Visitor's question","Required"=>false,"Example"=>"Can you help me?"),
                "Country"=>array("Input"=>false,"Output"=>true,"Type"=>"string","Description"=>"Visitor's country","Required"=>false,"Example"=>"US"),
                "Phone"=>array("Input"=>false,"Output"=>true,"Type"=>"string","Description"=>"Visitor's phone #","Required"=>false,"Example"=>"004988373728"),
                "Host"=>array("Input"=>false,"Output"=>true,"Type"=>"string","Description"=>"Visitor's host","Required"=>false,"Example"=>"19453972n@serviceprovider.domain"),
                "IP"=>array("Input"=>false,"Output"=>true,"Type"=>"string","Description"=>"Visitor's IP","Required"=>false,"Example"=>"192.168.1.222"),
                "Customs"=>array("Input"=>false,"Output"=>true,"Type"=>"array<int,array<str, str>>","Description"=>"Custom input field values<br><br>array&lt;index,array&lt;input_name, input_value&gt;&gt;","Required"=>false,"Example"=>"","MultilineDescription"=>true),
                "Tags"=>array("Input"=>true,"Output"=>true,"Type"=>"string","Description"=>"Comma separated Tag list","Required"=>false,"Example"=>"Cars, Bikes")
            );
        if($_objName=="Chat")
            return array(
                "UserId"=>array("Input"=>true,"Output"=>false,"Type"=>"string","Description"=>"Unique identifier of the user, max 32 chars","Required"=>true,"Example"=>"d9729feb63a1a010"),
                "ChatId"=>array("Input"=>true,"Output"=>true,"Type"=>"string","Description"=>"The chat ID","Required"=>false,"Example"=>"11123"),
                "Fullname"=>array("Input"=>true,"Output"=>false,"Type"=>"string","Description"=>"User full name","Required"=>false,"Example"=>"John Doe"),
                "Email"=>array("Input"=>true,"Output"=>true,"Type"=>"string","Description"=>"User email","Required"=>false,"Example"=>"john@doe.com"),
                "Company"=>array("Input"=>true,"Output"=>false,"Type"=>"string","Description"=>"User company","Required"=>false,"Example"=>"Doe Ltd."),
                "Phone"=>array("Input"=>true,"Output"=>false,"Type"=>"string","Description"=>"User phone","Required"=>false,"Example"=>"004977311894432"),
                "Customs"=>array("Input"=>true,"Output"=>false,"Type"=>"string","Description"=>"Custom input field values<br><br>array&lt;index,array&lt;input_name, input_value&gt;&gt;","Required"=>false,"Example"=>""),
                "Group"=>array("Input"=>true,"Output"=>false,"Type"=>"string","Description"=>"Chat target group id","Required"=>true,"Example"=>"support"),
                "Operator"=>array("Input"=>true,"Output"=>false,"Type"=>"string","Description"=>"Chat target operator id","Required"=>false,"Example"=>"fc6a5761d39598c"),
                "Country"=>array("Input"=>true,"Output"=>false,"Type"=>"string","Description"=>"ISO two letter county code","Required"=>false,"Example"=>"ES"),
                "Language"=>array("Input"=>true,"Output"=>false,"Type"=>"string","Description"=>"ISO two letter language code","Required"=>false,"Example"=>"DE"),
                "Identifier"=>array("Input"=>true,"Output"=>false,"Type"=>"string","Description"=>"Custom indentifier text","Required"=>false,"Example"=>"This is an API chat"),
                "IP"=>array("Input"=>true,"Output"=>false,"Type"=>"string","Description"=>"User IP","Required"=>false,"Example"=>"111.111.111.111"),
                "Webhook"=>array("Input"=>true,"Output"=>false,"Type"=>"string","Description"=>"Webhook URL to receive operator messages","Required"=>true,"Example"=>"http://website.com/hook.php")
            );
        if($_objName=="Ticket")
            return array(
                "Id"=>array("Input"=>false,"Output"=>true,"Type"=>"int","Description"=>"The serial ticket ID","Required"=>false,"Example"=>"11123"),
                "Group"=>array("Input"=>true,"Output"=>true,"Type"=>"string","Description"=>"Group Id","Required"=>true,"Example"=>"groupid1"),
                "Channel"=>array("Input"=>true,"Output"=>true,"Type"=>"int","Description"=>"Channel<br><br>[0] = Web<br>[1] = Email<br>[2] = Phone<br>[3] = Misc<br>[4] = Chat<br>[5] = Rating","Required"=>false,"Example"=>"0","MultilineDescription"=>true),
                "SubChannel"=>array("Input"=>true,"Output"=>true,"Type"=>"string","Description"=>"Sub-Channel Name","Required"=>false,"Example"=>"Sub Channel Name","MultilineDescription"=>false),
                "Language"=>array("Input"=>true,"Output"=>true,"Type"=>"string","Description"=>"Ticket's Langauge (ISO two letter)","Required"=>false,"Example"=>"EN"),
                "LastUpdated"=>array("Input"=>false,"Output"=>true,"Type"=>"int","Description"=>"Last updated time (UNIX Timestamp)","Required"=>false,"Example"=>"1395332206"),
                "WaitBegin"=>array("Input"=>false,"Output"=>true,"Type"=>"int","Description"=>"Wait begin time (UNIX Timestamp)","Required"=>false,"Example"=>"1395332157"),
                "Messages"=>array("Input"=>false,"Output"=>true,"Type"=>"array<TicketMessage>","Description"=>"Ticket Messages","TypeLinkObject"=>"TicketMessage","Required"=>false,"Example"=>""),
                "Editor"=>array("Input"=>false,"Output"=>true,"Type"=>"TicketEditor","TypeLinkObject"=>"TicketEditor","Description"=>"Ticket Editor (Operator)","Required"=>false,"Example"=>""),
                "Tags"=>array("Input"=>true,"Output"=>true,"Type"=>"string","Description"=>"Comma separated Tag list","Required"=>false,"Example"=>"Cars, Bikes"),
                "Hash"=>array("Input"=>false,"Output"=>true,"Type"=>"string","Description"=>"Ticket Hash","Required"=>false,"Example"=>"66662EEB7EFD"),
                "Salt"=>array("Input"=>false,"Output"=>true,"Type"=>"string","Description"=>"Ticket Salt","Required"=>false,"Example"=>"5c7cf4770753999d060d5e8a56cc1740"),
                "PublicLink"=>array("Input"=>false,"Output"=>true,"Type"=>"string","Description"=>"Public Ticket Link","Required"=>false,"Example"=>"http://www.website.domain/livezilla/ticket.php?id=...")
            );
        if($_objName=="TicketMessage")
            return array(
                "Id"=>array("Input"=>false,"Output"=>true,"Type"=>"string","Description"=>"Message ID<br><br>First message's ID must be equal to ticket ID.","Required"=>false,"Example"=>"246733d03f64db3b72af327d0d835ebd","MultilineDescription"=>true),
                "TicketId"=>array("Input"=>true,"Output"=>true,"Type"=>"string","Description"=>"Ticket ID","Required"=>true,"Example"=>"11701"),
                "Fullname"=>array("Input"=>true,"Output"=>true,"Type"=>"string","Description"=>"Visitor's name","Required"=>false,"Example"=>"Johanna Doe"),
                "Email"=>array("Input"=>true,"Output"=>true,"Type"=>"string","Description"=>"Visitor's email","Required"=>false,"Example"=>"johanna@jdscompany.com"),
                "Company"=>array("Input"=>true,"Output"=>true,"Type"=>"string","Description"=>"Visitor's company","Required"=>false,"Example"=>"Jdscompany Ltd."),
                "Phone"=>array("Input"=>true,"Output"=>true,"Type"=>"string","Description"=>"Visitor's phone #","Required"=>false,"Example"=>"004988373728"),
                "IP"=>array("Input"=>true,"Output"=>true,"Type"=>"string","Description"=>"Visitor's IP","Required"=>false,"Example"=>"192.168.1.222"),
                "CallMeBack"=>array("Input"=>true,"Output"=>true,"Type"=>"boolean","Description"=>"Callback Required","Required"=>false,"Example"=>"true"),
                "Type"=>array("Input"=>true,"Output"=>true,"Type"=>"int","Description"=>"Message Type<br><br>[0] = Incoming widget message<br>[1] = Outgoing Email<br>[2] = Linked Chat<br>[3] = Incoming Email<br>[4] = (Missed) Chat from archive","Required"=>false,"Example"=>"0","MultilineDescription"=>true),
                "Subject"=>array("Input"=>true,"Output"=>true,"Type"=>"string","Description"=>"Subject / URL","Required"=>false,"Example"=>"Can you help?"),
                "SenderUserId"=>array("Input"=>true,"Output"=>true,"Type"=>"string","Description"=>"Operator or Visitor Id","Required"=>false,"Example"=>"john_doe"),
                "ChannelId"=>array("Input"=>true,"Output"=>true,"Type"=>"string","Description"=>"","Required"=>false,"Example"=>""),
                "Comments"=>array("Input"=>true,"Output"=>true,"Type"=>"array<int,array<str, str>>","Description"=>"Ticket Comments<br><br>array&lt;index,array&lt;operator_id, comment_text&gt;&gt;","TypeLinkObject"=>"","Required"=>false,"Example"=>"","MultilineDescription"=>true),
                "Attachments"=>array("Input"=>false,"Output"=>true,"Type"=>"array<Attachment>","Description"=>"File attachments","Required"=>false,"Example"=>""),
                "Edited"=>array("Input"=>false,"Output"=>true,"Type"=>"int","Description"=>"Last edited time (UNIX Timestamp)","Required"=>false,"Example"=>"1395332206"),
                "Created"=>array("Input"=>false,"Output"=>true,"Type"=>"int","Description"=>"Created (UNIX Timestamp)","Required"=>false,"Example"=>"1395332206"),
                "Customs"=>array("Input"=>true,"Output"=>true,"Type"=>"array<int,array<str, str>>","Description"=>"Custom input field values<br><br>array&lt;index,array&lt;input_name, input_value&gt;&gt;","Required"=>false,"Example"=>"","MultilineDescription"=>true),
                "Text"=>array("Input"=>true,"Output"=>true,"Type"=>"string","Description"=>"Message Plaintext","Required"=>false,"Example"=>"Hello, please help me.")
            );
        if($_objName=="TicketEditor")
            return array(
                "Editor"=>array("Input"=>true,"Output"=>true,"Type"=>"string","Description"=>"Editor (=Operator) ID","Required"=>true,"Example"=>"john_doe"),
                "Status"=>array("Input"=>true,"Output"=>true,"Type"=>"int","Description"=>"Ticket Status<br><br>[0] = Open<br>[1] = In Progress<br>[2] = Closed<br>[3] = Deleted<br>[4] = Pending","Required"=>false,"Example"=>"0","MultilineDescription"=>true),
                "SubStatus"=>array("Input"=>true,"Output"=>true,"Type"=>"string","Description"=>"Ticket Sub-Status","Required"=>false,"Example"=>"Sub-Status Name","MultilineDescription"=>false),
                "Id"=>array("Input"=>true,"Output"=>true,"Type"=>"string","Description"=>"Ticket ID","Required"=>true,"Example"=>"11123")
            );
        if($_objName=="KnowledgeBaseEntry")
            return array(
                "Id"=>array("Input"=>true,"Output"=>true,"Type"=>"string","Description"=>"Unique ID (32 chars)","Required"=>false,"Example"=>"14t733d03f64db3b72af327d0d835ebd"),
                "Tags"=>array("Input"=>true,"Output"=>true,"Type"=>"string","Description"=>"Tags (comma separated)","Required"=>false,"Example"=>"car,sharing,stations"),
                "Value"=>array("Input"=>true,"Output"=>true,"Type"=>"string","Description"=>"Content (HTML, URL or Filename)","Required"=>true,"Example"=>"..."),
                "Title"=>array("Input"=>true,"Output"=>true,"Type"=>"string","Description"=>"Title","Required"=>true,"Example"=>"Where to find car sharing stations?"),
                "Languages"=>array("Input"=>true,"Output"=>true,"Type"=>"string","Description"=>"Languages (comma-separated iso 2 letter code)","Required"=>false,"Example"=>"de,fr"),
                "Type"=>array("Input"=>true,"Output"=>true,"Type"=>"int","Description"=>"Resource Type (0=Folder, 1=HTML/Text, 2=Link, 3=Operator File, 4=Customer File)","Required"=>true,"Example"=>"0"),
                "ParentId"=>array("Input"=>true,"Output"=>true,"Type"=>"string","Description"=>"Parent's Id (root = 1)","Required"=>true,"Example"=>"ae33b353c9174c3f97628067f8104405"),
                "IsPublic"=>array("Input"=>true,"Output"=>true,"Type"=>"int","Description"=>"Defines if entry can be found in Knowledgebase","Required"=>false,"Example"=>"1"),
                "FulltextSearch"=>array("Input"=>true,"Output"=>true,"Type"=>"int","Description"=>"Defines if fulltext (= content) search will be used","Required"=>false,"Example"=>"1"),
                "ShortcutWord"=>array("Input"=>true,"Output"=>true,"Type"=>"string","Description"=>"Shortword for operator client","Required"=>false,"Example"=>"myshortcut"),
                "GroupId"=>array("Input"=>true,"Output"=>true,"Type"=>"string","Description"=>"Group ID (owner) (LiveZilla 6.1.1.0)","Required"=>false,"Example"=>"support"),
                "OwnerId"=>array("Input"=>true,"Output"=>true,"Type"=>"string","Description"=>"Operator ID (owner) (LiveZilla 6.1.1.0)","Required"=>false,"Example"=>"d351dc9"),
                "AllowBotAccess"=>array("Input"=>true,"Output"=>true,"Type"=>"int","Description"=>"Defines if entry will be used by Virtual Assistance","Required"=>true,"Example"=>"1")
            );
        return array();
    }
}

?>