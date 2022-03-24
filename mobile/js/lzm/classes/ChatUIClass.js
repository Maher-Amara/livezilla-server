/****************************************************************************************
 * LiveZilla ChatUI.js
 *
 * Copyright 2018 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/

function ChatUI() {
    this.columnCount = 0;
    this.SelectedNode = 'all-chats-all-active';
    this.PreviewChatObj = null;
    this.ChatGroups = {};
    this.SelectedRow = null;
    this.CategorySelect = false;
    this.ObserverMode = false;
    this.ObserverModePossible = true;
    this.EditorBlocked = false;
}

ChatUI.ChatsSoundPlayed = [];
ChatUI.ChatsQueueSoundPlayed = [];
ChatUI.RowHash = '';

ChatUI.prototype.CreateChatList = function() {
    var that = this;
    $('#chat-allchats').html('<div id="chat-allchats-headline" class="lzm-dialog-headline2" style="top:0;"></div>' +
        '<div id="all-chats-tree"></div>'+
        '<div id="all-chats-body" style="top:35px;"></div>'+
        '<div id="all-chats-preview" style="top:35px;">' +
            '<div id="all-chats-preview-loading" class="lz_point_load"><span></span><span></span><span></span></div>' +
            '<div id="all-chats-preview-logo"><i class="fa fa-eye bg_icon"></i><div id="all-chats-preview-permission" style="display:none;">'+ tid('no_permission')+'</div></div>' +
            '<div id="all-chats-preview-inner"></div>'+
        '</div>').trigger('create');
    $('#all-chats-body').html(that.CreateChatsHtml());

    var buttons = '<span class="left-button-list">';
    buttons += lzm_inputControls.createButton('allchats-tree-switch', '', 'handleAllChatsTree();','', '<i class="fa fa-list-ul"></i>', 'lr',{'margin-left': '4px','margin-right': '0px'}, '', -1,'e');

    buttons += '</span><span class="right-button-list">';
    buttons += lzm_inputControls.createButton('allchats-create-group-chat', '', 'createPublicGroup();', tid('group_chat_create'), '<i class="fa fa-plus"></i>', 'force-text', {'margin-right':'4px'}, '',-1,'e');
    buttons += lzm_inputControls.createButton('allchats-observer-mode', '', 'switchObserverMode();', 'Observer Mode', '<i class="fa fa-eye"></i>', 'lr', {'margin-right':'4px'}, '',-1,'e');
    buttons += lzm_inputControls.createButton('allchats-open-group-chat', '', '', tid('open'), '', 'force-text', {'margin-right':'4px'}, '',-1,'e');
    buttons += '</span>';

    this.ObserverMode = lzm_commonStorage.loadValue('observer_mode_' + DataEngine.myId) != 0;

    $('#chat-allchats-headline').html(buttons);

    if(this.ObserverMode)
        $('#allchats-observer-mode').addClass('lzm-button-b-pushed');

    $('.chats_col_header').unbind("contextmenu");
    $('.chats_col_header').contextmenu(function(){
        var cm = {id: 'chats_header_cm',entries: [{label: tid('settings'),onClick : 'LocalConfiguration.__OpenTableSettings(\'chats\')'}]};
        if(ContextMenuClass.BuildMenu(event,cm))
            return false;
    });
};

ChatUI.prototype.CreateChatTree = function() {

    var that=this,paddings =['5px','20px','35px','50px','70px'];
    var html = '<div id="all-chats-all" class="lzm-unselectable" onclick="ChatUI.__TreeClick(this.id);" style="padding-left:'+paddings[0]+';"><i class="fa fa-caret-down icon-light"></i>'+tid('all_chats')+' ('+ChatManager.Counts.All+')</div>'+
        '<div id="all-chats-all-active" class="lzm-unselectable" onclick="ChatUI.__TreeClick(this.id);" style="padding-left:'+paddings[1]+';"><i class="fa fa-caret-down icon-light"></i><b>'+tid('active')+' ('+ChatManager.Counts.AllActive+')</b></div>'+
        '<div id="all-chats-my" class="lzm-unselectable" onclick="ChatUI.__TreeClick(this.id);" style="padding-left:'+paddings[2]+';"></i>'+tid('my_chats')+' ('+ChatManager.Counts.My+')</div>'+
        '<div id="all-chats-queue" class="lzm-unselectable" onclick="ChatUI.__TreeClick(this.id);" style="padding-left:'+paddings[2]+';"><i class="fa fa-clock-o icon"></i>'+tid('queue')+' ('+ChatManager.Counts.Queued+')</div>'+
        '<div id="all-chats-waiting" class="lzm-unselectable" onclick="ChatUI.__TreeClick(this.id);" style="padding-left:'+paddings[2]+';"><i class="fa fa-bell-o icon"></i>'+tid('waiting')+' ('+ChatManager.Counts.Waiting+')</div>'+
        '<div id="all-chats-active" class="lzm-unselectable" onclick="ChatUI.__TreeClick(this.id);" style="padding-left:'+paddings[2]+';"><i class="fa fa-comments icon"></i>'+tid('ticket_status_1')+' ('+ChatManager.Counts.Active+')</div>'+
        '<div id="all-chats-closed" class="lzm-unselectable" onclick="ChatUI.__TreeClick(this.id);" style="padding-left:'+paddings[1]+';"><i class="fa fa-check icon-light"></i>'+tid('closed')+' ('+ChatManager.Counts.Closed+')</div>'+
        '<div id="all-chats-missed" class="lzm-unselectable" onclick="ChatUI.__TreeClick(this.id);" style="padding-left:'+paddings[1]+';"><i class="fa fa-warning'+ (ChatManager.Counts.Missed > 0 ? ' icon-orange' : '')+'"></i>'+tid('missed')+' ('+ChatManager.Counts.Missed+')</div>'+
        '<div id="all-chats-bot" class="lzm-unselectable" onclick="ChatUI.__TreeClick(this.id);" style="padding-left:'+paddings[1]+';"><i class="fa fa-microchip"></i>'+tid('bot')+' ('+ChatManager.Counts.Bot+')</div>';

    var col,owner,gname,ghtml='',vcount,gc= 0,gl = DataEngine.groups.getGroupList('name',false,true);
    var ocount,group;
    for(var key in gl)
    {
        ocount=0;
        group = gl[key];
        if(d(group.members))
        {
            for(var mkey in group.members)
            {
                var operator = DataEngine.operators.getOperator(group.members[mkey].i);
                if(operator != null && operator.status != 2)
                {
                    ocount++;
                }
            }

            owner = DataEngine.operators.getOperator(group.o);
            if(owner != null)
            {
                var isInvToMe = !DataEngine.operators.IsVisibleTo(owner,DataEngine.operators.getOperator(DataEngine.myId));

                if(isInvToMe)
                    continue;
            }

            vcount = (d(this.ChatGroups[group.id])) ? this.ChatGroups[group.id].count : 0;
            gname = lzm_commonTools.SubStr(group.name,12,true) + ' (' + vcount.toString() + ' / ' + ocount.toString() + ')';
            gname = (vcount>0) ? '<b>'+gname+'</b>' : gname;

            col = (vcount>0) ? ' icon-green' :'';
            ghtml += '<div id="all-chats-group-'+group.id+'" oncontextmenu="openChatLineContextMenu(\'' + group.id + '\',\'chat-allchats\', event);" class="lzm-unselectable" ondblclick="OpenChatWindow(\''+group.id+'\');" onclick="ChatUI.__TreeClick(this.id);" style="padding-left:'+paddings[2]+';"><i class="fa fa-group icon-light'+col+'"></i>' + gname + '</div>';
            gc++;
        }
    }
    html += '<div id="all-chats-group" style="cursor:default;padding-left:'+paddings[1]+';"><i class="fa fa-caret-'+(gc>0 ? 'down' : 'right')+' icon-light"></i>'+tid('group_chats')+' ('+gc+')</div>';
    html += ghtml;

    if(this.SelectedNode.indexOf('all-chats-group-')===0 && !lzm_chatDisplay.IsFullscreenMode())
    {
        $('#allchats-open-group-chat').css({display:'inline'});
        $('#allchats-open-group-chat').unbind("click");
        $('#allchats-open-group-chat').click(function(){
            OpenChatWindow(that.SelectedNode.replace('all-chats-group-',''));
        });
    }
    else
        $('#allchats-open-group-chat').css({display:'none'});

    return html;

};

ChatUI.prototype.InitChatPreview = function(chatId) {

    $('#all-chats-preview-inner').html('');

    var chatobj = DataEngine.ChatManager.GetChat(chatId,'i');

    if(chatobj==null)
    {
        $('#all-chats-preview-permission').css('display','none');
        $('#all-chats-preview-loading').css('display','none');
        $('#all-chats-preview-logo').css('display','block');
        return;
    }

    if (!chatobj.CanPreview(DataEngine.myId) /*permRequired && !PermissionEngine.checkUserPermissions(DataEngine.myId, 'chats', 'join_invisible', {})*/)
    {
        this.PreviewChatObj = null;
        $('#all-chats-preview-permission').css('display','block');
        $('#all-chats-preview-loading').css('display','none');
        $('#all-chats-preview-logo').css('display','block');
    }
    else if(this.ObserverMode)
    {
        $('#all-chats-preview-permission').css('display','none');
        $('#all-chats-preview-loading').css('display','block');
        $('#all-chats-preview-logo').css('display','none');

        if(chatobj.GetChatGroup()!= null)
        {
            this.PreviewChatObj = null;
            this.UpdateChatPreview();
        }
        else
        {
            if(!(this.PreviewChatObj != null && this.PreviewChatObj.i == chatId))
            {
                this.PreviewChatObj = lzm_commonTools.clone(chatobj);
                this.PreviewChatObj.Messages = [];
            }
            CommunicationEngine.InstantPoll(true);
        }
    }
    else
        this.PreviewChatObj = null;
};


var debugpollstop = false;

ChatUI.prototype.UpdateChatList = function(_selectedNodeId) {

    if(d(_selectedNodeId))
    {
        this.SelectedNode = _selectedNodeId;
    }

    if(debugpollstop)
        return;

    var uiupdate = (lzm_chatDisplay.selected_view == 'mychats' && TaskBarManager.GetActiveWindow() == null);
    var that = this,isPublicGroup = (d(this.SelectedNode) && this.SelectedNode.indexOf('all-chats-group-')===0);
    if ($('#all-chats-list').length == 0)
    {
        that.CreateChatList();
    }
    else
    {
        if(uiupdate)
        {
            var counterHtml = t('Active Chats: <!--number_active--> (<!--number_queue--> in queue)',[['<!--number_active-->', DataEngine.ChatManager.GetActive().length], ['<!--number_queue-->', DataEngine.ChatManager.GetQueued().length]]);

            $('#allchats-counter').html(counterHtml);

            var lines = this.CreateVisitorChatLines(false);
            if(isPublicGroup)
                lines += this.CreateOperatorChatLines();

            if(ChatUI.RowHash != md5(lines))
            {
                $('#all-chats-list').children('tbody').html(lines);
                ChatUI.RowHash = md5(lines);
                if (this.SelectedRow != null)
                {
                    if($('#allchats-line-' + this.SelectedRow).length)
                    {
                        $('#allchats-line-' + this.SelectedRow).addClass('selected-table-line');
                    }
                    else
                        this.SelectedRow = this.PreviewChatObj = null;
                }
            }

            this.UpdateChatPreview();
            UIRenderer.resizeAllChats();
        }
        else
        {
            this.CreateVisitorChatLines(true);
        }
    }

    if(uiupdate)
    {
        $('#all-chats-operators-list').css({visibility:(isPublicGroup)?'visible':'hidden'});
        $('#all-chats-tree').html(that.CreateChatTree());
        $('#all-chats-tree div').removeClass('selected-treeview-div');
        $('#'+this.SelectedNode).addClass('selected-treeview-div');
        $('#groupchat-operator-list-offline').change(function(){

            console.log(444);
            CommonUIClass.UpdateUserList = true;
            lzm_commonStorage.saveValue('gc_op_list_onlonl_' + DataEngine.myId,$('#groupchat-operator-list-offline').prop('checked')?'0':'1');
            that.UpdateChatList();

        });
    }
};

ChatUI.prototype.UpdateChatPreview = function(_forceUpdate){

    $('#all-chats-preview-loading').css('display','none');
    var chatHtmlString='';

    if(this.PreviewChatObj != null)
    {
        var i,prco = DataEngine.ChatManager.GetChat(this.PreviewChatObj.i,'i');
        if(prco!=null && prco.Messages.length && (prco.Messages.length != this.PreviewChatObj.Messages.length || !$('#all-chats-preview-inner').html().length) || _forceUpdate)
        {
            var cpc = new ChatPostController();
            for (i=0; i<prco.Messages.length; i++)
            {
                cpc.chatObj = prco;
                cpc.postObj = prco.Messages[i];
                cpc = lzm_chatDisplay.GetPostHTML(cpc,false,false,false);
                chatHtmlString += cpc.html;
            }

            chatHtmlString += '</div>';
            chatHtmlString += lzm_chatDisplay.GetTypingHTML(prco);

            this.PreviewChatObj = lzm_commonTools.clone(prco);

            $('#all-chats-preview-inner').html(chatHtmlString);
            if(chatHtmlString.length>0)
                $('#all-chats-preview-inner').scrollTop($('#all-chats-preview-inner')[0].scrollHeight);
        }
    }
    else
        $('#all-chats-preview-inner').html('');

    $('#all-chats-preview-logo').css('display',$('#all-chats-preview-inner').html().length==0 ? 'block' : 'none');
};

ChatUI.prototype.CreateChatsHtml = function(){
    var i;
    var bodyHtml;
    if(lzm_chatDisplay.IsFullscreenMode()){
        bodyHtml = '<table id="all-chats-list" class="lzm-unselectable visible-list-table">';
        bodyHtml +=  '<thead><tr><th style="padding:0;"></th><th style="padding:0;"></th><th style="padding:0;"></th>';

        this.columnCount = 3;
        for (i=0; i<LocalConfiguration.TableColumns.allchats.length; i++) {
            var thisAllchatsColumn = LocalConfiguration.TableColumns.allchats[i];
            if (thisAllchatsColumn.display == 1)
            {
                this.columnCount++;
                var cellId = (typeof thisAllchatsColumn.cell_id != 'undefined') ? ' id="' + thisAllchatsColumn.cell_id + '"' : '';
                var cellClass = (typeof thisAllchatsColumn.cell_class != 'undefined') ? ' ' + thisAllchatsColumn.cell_class : '';
                var cellStyle = (typeof thisAllchatsColumn.cell_style != 'undefined') ? ' style="white-space: nowrap; ' + thisAllchatsColumn.cell_style + '"' : ' style="white-space: nowrap;"';
                var cellOnclick = (typeof thisAllchatsColumn.cell_onclick != 'undefined') ? ' onclick="' + thisAllchatsColumn.cell_onclick + '"' : '';
                bodyHtml += '<th class="chats_col_header'+cellClass+'" id="'+thisAllchatsColumn.cid+'" ' + cellId + cellStyle + cellOnclick + '>' + t(thisAllchatsColumn.title) +'';
                if(typeof thisAllchatsColumn.sort != 'undefined')
                    bodyHtml += '<span style="position:absolute;right:4px;"><i class="fa fa-caret-down"></i></span>';
                bodyHtml += '</th>';
            }
        }

        bodyHtml += '</tr></thead>';
    }else{
        bodyHtml = '<table id="all-chats-list" class="lzm-unselectable alternating-rows-table visible-list-table">';
    }

    bodyHtml += '<tbody>';
    bodyHtml += this.CreateVisitorChatLines(false);
    bodyHtml += '</tbody></table>';
    return bodyHtml;
};

ChatUI.prototype.CreateOperatorChatLines = function(){

    var c=0,html = '';
    var group = DataEngine.groups.getGroup(this.SelectedNode.replace('all-chats-group-',''));
    var onlineOnly = lzm_commonStorage.loadValue('gc_op_list_onlonl_' + DataEngine.myId)=='1';

    if(group != null && d(group.members))
    {
        for(var key in group.members)
        {
            var operator = DataEngine.operators.getOperator(group.members[key].i);
            if(operator != null)
                if(!onlineOnly || operator.status!=2)
                {

                    var ondblclick = 'ondblclick="OpenChatWindow(\''+operator.id+'\');"';
                    html += '<tr '+ondblclick+' oncontextmenu="openChatLineContextMenu(\'' + operator.id + '\',\'chat-allchats\',event);" class="lzm-clickable allchats-operator-line"><td></td><td><div style="background-image:url(\'' + lzm_commonConfig.lz_user_states[operator.status].icon + '\');"></div></td><td>'+operator.name+'</td><td colspan="'+(this.columnCount-1)+'"><i style="color:#839bae;">' + lzm_commonTools.escapeHtml(operator.sit) + '</i></td></tr>';
                    c++;
                }
        }
    }
    var onoffToggle = lzm_inputControls.createCheckbox('groupchat-operator-list-offline',tid('show_offline'),!onlineOnly,'left-space','display:inline-block');
    html = '<tr class="lzm-unselectable split-table-line split-line-light"><td colspan="'+(this.columnCount-2)+'"><b>'+tid('operators')+' ('+c.toString()+')</b></td><td colspan="2">'+onoffToggle+'</td></tr>' + html;
    return html;
};

ChatUI.prototype.CreateVisitorChatLines = function(_countsOnly){

    var curChat,linesBot='',linesHtml = '',linesMy='',linesClosed='',linesGroup='',linesActive='',linesWaiting='',linesMissed='',linesQueued='',i,lsa='',lsm='',lsmy='';
    var emptyLine = '<tr><td colspan="'+(this.columnCount)+'" style="background:#fff;" class="unselectable text-center text-gray"><br></td></tr>';

    this.ChatGroups = {};
    ChatManager.Counts.Closed =
    ChatManager.Counts.Missed =
    ChatManager.Counts.My =
    ChatManager.Counts.Queued =
    ChatManager.Counts.Waiting =
    ChatManager.Counts.Active =
    ChatManager.Counts.ChatGroup =
    ChatManager.Counts.Operator =
    ChatManager.Counts.Hidden =
    ChatManager.Counts.Internal =
    ChatManager.Counts.Bot =
    ChatManager.Counts.Group = 0;

    for(var key in DataEngine.ChatManager.Chats)
    {
        var ichat = DataEngine.ChatManager.Chats[key];
        if(ichat.Type != Chat.Visitor && ichat.IsWindowOpen)
            ChatManager.Counts.Internal++;
    }

    var line,list = DataEngine.ChatManager.GetChats(Chat.Visitor,true);
    list = lzm_commonTools.SortByProperty(list,'i',true);

    for (i=0; i<list.length; i++)
    {
        curChat = list[i];
        var cg = curChat.GetChatGroup();
        var vperm = PermissionEngine.checkUserChatPermissions(DataEngine.myId, 'view', curChat);

        if(!vperm)
        {
            ChatManager.Counts.Hidden++;
            continue;
        }
        if(curChat.GetStatus() != Chat.Closed && cg == null && curChat.IsMember(DataEngine.myId))
        {
            if(!_countsOnly)
                linesMy += this.CreateListLine(curChat);
            ChatManager.Counts.My++;
        }
        if(curChat.IsBotChat() && curChat.GetStatus() != Chat.Closed)
        {
            ChatManager.Counts.Bot++;
            if(!_countsOnly)
                linesBot += this.CreateListLine(curChat,true);
        }
        else if(curChat.IsMissed())
        {
            ChatManager.Counts.Missed++;
            if(!_countsOnly)
                linesMissed += this.CreateListLine(curChat);
        }
        else if(cg != null && curChat.GetStatus() != Chat.Closed)
        {
            ChatManager.Counts.ChatGroup++;
            if(!_countsOnly)
            {
                line = this.CreateListLine(curChat);
                linesGroup += line;
            }

            if(!d(this.ChatGroups[cg.id]))
                this.ChatGroups[cg.id] = {count:0,html:''};
            this.ChatGroups[cg.id].html += line;
            this.ChatGroups[cg.id].count++;
        }
        else if(curChat.GetStatus() == Chat.Queue)
        {
            ChatManager.Counts.Queued++;
            if(!_countsOnly)
                linesQueued += this.CreateListLine(curChat);
        }
        else if(curChat.GetStatus() == Chat.Open)
        {
            ChatManager.Counts.Waiting++;
            if(!_countsOnly)
                linesWaiting += this.CreateListLine(curChat);
        }
        else if(curChat.GetStatus() == Chat.Active)
        {
            ChatManager.Counts.Active++;
            if(!_countsOnly)
                linesActive += this.CreateListLine(curChat);
        }
        else if(curChat.GetStatus() == Chat.Closed)
        {
            ChatManager.Counts.Closed++;
            if(!_countsOnly)
                linesClosed += this.CreateListLine(curChat);
        }
    }

    ChatManager.Counts.All = list.length - ChatManager.Counts.Group - ChatManager.Counts.Operator - ChatManager.Counts.Hidden;
    ChatManager.Counts.AllActive = list.length - ChatManager.Counts.Closed - ChatManager.Counts.Missed - ChatManager.Counts.Group - ChatManager.Counts.Operator - ChatManager.Counts.Hidden;

    if(!_countsOnly)
    {
        if(this.SelectedNode == 'all-chats-my')
        {
            linesHtml += linesMy;
            linesHtml += emptyLine;
        }
        if(this.SelectedNode == 'all-chats-all' || this.SelectedNode == 'all-chats-all-active' || this.SelectedNode == 'all-chats-queue')
        {
            if(this.SelectedNode == 'all-chats-all' || this.SelectedNode == 'all-chats-all-active')
                linesHtml += '<tr class="lzm-unselectable split-table-line split-line-light"><td colspan="'+(this.columnCount)+'">'+lsmy+'<b>'+tid('queue')+' ('+ChatManager.Counts.Queued.toString()+')</b></td></tr>';
            linesHtml += linesQueued;
            linesHtml += emptyLine;
        }
        if(this.SelectedNode == 'all-chats-all' || this.SelectedNode == 'all-chats-all-active' || this.SelectedNode == 'all-chats-waiting')
        {
            if(this.SelectedNode == 'all-chats-all' || this.SelectedNode == 'all-chats-all-active')
                linesHtml += '<tr class="lzm-unselectable split-table-line split-line-light"><td colspan="'+(this.columnCount)+'">'+lsmy+'<b>'+tid('waiting')+' ('+ChatManager.Counts.Waiting.toString()+')</b></td></tr>';
            linesHtml += linesWaiting;
            linesHtml += emptyLine;
        }
        if(this.SelectedNode == 'all-chats-all' || this.SelectedNode == 'all-chats-all-active' || this.SelectedNode == 'all-chats-active')
        {
            if(this.SelectedNode == 'all-chats-all' || this.SelectedNode == 'all-chats-all-active')
                linesHtml += '<tr class="lzm-unselectable split-table-line split-line-light"><td colspan="'+(this.columnCount)+'">'+lsa+'<b>'+tid('active')+' ('+ChatManager.Counts.Active.toString()+')</b></td></tr>';
            linesHtml += linesActive;
            linesHtml += emptyLine;
        }
        if(this.SelectedNode == 'all-chats-all' || this.SelectedNode == 'all-chats-all-active' || this.SelectedNode.indexOf('all-chats-group-')===0)
        {
            if(this.SelectedNode.indexOf('all-chats-group-')===0)
            {
                var gid = this.SelectedNode.replace('all-chats-group-','');
                if(d(this.ChatGroups[gid]))
                {
                    linesHtml += '<tr class="lzm-unselectable split-table-line split-line-light"><td colspan="'+(this.columnCount)+'"><b>'+tid('visitors')+' ('+this.ChatGroups[gid].count.toString()+')</b></td></tr>';
                    linesHtml += this.ChatGroups[gid].html + emptyLine;
                }
            }
            else
            {
                linesHtml += '<tr class="lzm-unselectable split-table-line split-line-light"><td colspan="'+(this.columnCount)+'">'+lsm+'<b>'+tid('group_chats')+' ('+ChatManager.Counts.ChatGroup.toString()+')</b></td></tr>';
                linesHtml += linesGroup;
                linesHtml += emptyLine;
            }
        }
        if(this.SelectedNode == 'all-chats-all' || this.SelectedNode == 'all-chats-all-active' || this.SelectedNode == 'all-chats-bot')
        {
            if(this.SelectedNode == 'all-chats-all' || this.SelectedNode == 'all-chats-all-active')
                linesHtml += '<tr class="lzm-unselectable split-table-line split-line-light"><td colspan="'+(this.columnCount)+'">'+lsa+'<b>'+tid('bot')+' ('+ChatManager.Counts.Bot.toString()+')</b></td></tr>';

            linesHtml += linesBot;
            linesHtml += emptyLine;
        }
        if(this.SelectedNode == 'all-chats-all' || this.SelectedNode == 'all-chats-closed')
        {
            if(this.SelectedNode == 'all-chats-all')
                linesHtml += '<tr class="lzm-unselectable split-table-line split-line-light"><td colspan="'+(this.columnCount)+'">'+lsa+'<b>'+tid('closed')+' ('+ChatManager.Counts.Closed.toString()+')</b></td></tr>';
            linesHtml += linesClosed;
            linesHtml += emptyLine;
        }
        if(this.SelectedNode == 'all-chats-all' || this.SelectedNode == 'all-chats-missed')
        {
            if(this.SelectedNode == 'all-chats-all')
                linesHtml += '<tr class="lzm-unselectable split-table-line split-line-light"><td colspan="'+(this.columnCount)+'">'+lsm+'<b>'+tid('missed')+' ('+ChatManager.Counts.Missed.toString()+')</b></td></tr>';
            linesHtml += linesMissed;
        }
    }
    return linesHtml;
};

ChatUI.prototype.CreateListLine = function (_chat, _isBot){

    _isBot = d(_isBot) ? _isBot : false;

    var missed = _chat.IsMissed();
    var closed = _chat.GetStatus()==Chat.Closed;
    var that = this,i;
    var chatStatus = (closed && !missed) ? tid('closed') : ((_chat.GetStatus()==Chat.Active) ? tid('ticket_status_1') : (_chat.GetStatus()==Chat.Queue) ? tid('queue') : t('Waiting for operator'));
    var startTimeObject = lzm_chatTimeStamp.getLocalTimeObject(_chat.f * 1000, true);
    var startTime = lzm_commonTools.getHumanDate(startTimeObject, 'time', lzm_chatDisplay.userLanguage);
    var duration= 0,waitingTime = 0;
    var exitTime = _chat.e;

    if(_chat.e == 0 && _chat.l > 0)
        exitTime = _chat.l;

    if(missed)
        waitingTime = that.GetTimeDifference(_chat.f, exitTime);
    else if(closed || _chat.IsAccepted())
        waitingTime = that.GetTimeDifference(_chat.f, _chat.a);
    else
        waitingTime = that.GetTimeDifference(_chat.f, lzm_chatTimeStamp.getServerTimeString(null, true, 1000));

    if(missed)
        duration = that.GetTimeDifference(_chat.f, exitTime);
    else if(closed)
        duration = that.GetTimeDifference(_chat.a, exitTime);
    else
        duration = that.GetTimeDifference(_chat.f, lzm_chatTimeStamp.getServerTimeString(null, true, 1000));

    var igc = false;
    var group = _chat.GetChatGroup();

    if(group==null)
        group = DataEngine.groups.getGroup(_chat.dcg);
    else
        igc = true;

    if(group==null)
        group = {id:'',name:''};

    var operators = _chat.GetOperatorNameList();
    var active_chat_name = DataEngine.inputList.getInputValueFromVisitor(111,_chat.Visitor,32);
    var active_chat_email = DataEngine.inputList.getInputValueFromVisitor(112,_chat.Visitor,32);
    var active_chat_company = DataEngine.inputList.getInputValueFromVisitor(113,_chat.Visitor,32);
    var active_chat_question = DataEngine.inputList.getInputValueFromVisitor(114,_chat.Visitor);
    var onclickAction = ' onclick="' + (((!IFManager.IsAppFrame && !IFManager.IsMobileOS) || IFManager.IsDesktopApp()) ? 'ChatUI.__RowClick(this,\'' + _chat.i + '\');' : 'openChatLineContextMenu(\'' + _chat.i + '\',\'chat-allchats\', event);')+'"';

    if(igc)
        operators = '-';

    var oncontextmenuAction = (!IFManager.IsMobileOS) ? ' oncontextmenu="openChatLineContextMenu(\'' + _chat.i + '\',\'chat-allchats\', event);"' : '';
    var columnContents = [{cid: 'status', contents: chatStatus}, {cid: 'chat_id', contents: _chat.i},
        {cid: 'duration', contents: duration[0], cell_id: 'allchats-duration-' + _chat.i},
        {cid: 'start_time', contents: startTime},
        {cid: 'waiting_time', contents: waitingTime, cell_id: 'allchats-waitingtime-' + _chat.i},
        {cid: 'name', contents: active_chat_name}, {cid: 'question', contents: active_chat_question},
        {cid: 'priority', contents: tid('priority_' + _chat.p.toString())},
        {cid: 'group', contents: group.name},
        {cid: 'ip', contents: _chat.Visitor.ip},
        {cid: 'operators', contents: operators},
        {cid: 'website_name', contents: VisitorManager.GetWebsiteNames(_chat.Visitor)},
        {cid: 'email', contents: active_chat_email}, {cid: 'company', contents: active_chat_company}];

    LocalConfiguration.AddCustomBlock(columnContents);

    var iconf='',lineHtml;
    var missedClass = (missed || closed) ? ' allchats-missed-line' : '';
    if(lzm_chatDisplay.IsFullscreenMode())
    {
        iconf = that.GetIconField(_chat,missed,closed,_isBot);
        lineHtml = '<tr class="allchats-line'+missedClass+'" id="allchats-line-' + _chat.i + '"' + onclickAction + oncontextmenuAction + ' style="cursor: pointer;">' + that.GetButtonField(_chat)+iconf;

        for (i=0; i<LocalConfiguration.TableColumns.allchats.length; i++)
        {
            for (var j=0; j<columnContents.length; j++)
            {
                if(LocalConfiguration.TableColumns.allchats[i].cid == columnContents[j].cid && LocalConfiguration.TableColumns.allchats[i].display == 1)
                {
                    if(!LocalConfiguration.IsCustom(columnContents[j].cid))
                    {
                        var cellId = (typeof columnContents[j].cell_id != 'undefined') ? ' id="' + columnContents[j].cell_id + '"' : '';
                        var cellstyle = (d(LocalConfiguration.TableColumns.allchats[i].cell_style)) ? ' style="' + LocalConfiguration.TableColumns.allchats[i].cell_style + '"' : '';
                        var celltitle = (d(LocalConfiguration.TableColumns.allchats[i].contenttitle)) ? ' title="' + columnContents[j].contents + '"' : '';

                        if(LocalConfiguration.TableColumns.allchats[i].cid == 'waiting_time')
                            lineHtml += that.GetWaitingTimeField(_chat, missed, closed, columnContents[j].contents);
                        else
                            lineHtml += '<td' + cellId + cellstyle + celltitle + '>' + lzm_commonTools.SubStr(columnContents[j].contents,100,true) + '</td>';
                    }
                    else
                    {
                        var inputText,cindex = columnContents[j].cid.replace('c','');
                        var myCustomInput = DataEngine.inputList.getCustomInput(DataEngine.inputList.idList[cindex]);

                        if (myCustomInput.active == 1)
                        {
                            var val = DataEngine.inputList.getInputValueFromVisitor(cindex,_chat.Visitor,32);
                            inputText = (myCustomInput.type != 'CheckBox') ? val : (val == '1' || val == tid('yes')) ? tid('yes') : tid('no');
                            inputText = (inputText != '') ? inputText : '-';
                            lineHtml += '<td>' + inputText + '</td>';
                        }
                    }
                }
            }
        }
    }
    else
    {
        lineHtml = '<tr class="allchats-line' + missedClass + '" id="allchats-line-' + _chat.i + '"' + onclickAction + oncontextmenuAction + ' style="cursor: pointer;"><td>';
        lineHtml += '<div class="mobile-chat-line">';

        var av, avatar;
        if(LocalConfiguration.UIShowAvatars)
        {
            lineHtml += '<div class="mobile-chat-line-avatar-div">';
            if(_chat.Type == Chat.Operator)
            {
                av = getAvatarURL('',_chat.SystemId);
                avatar = '<span class="mobile-chat-line-avatar" style="background-image: url(\'' + av + '\') !important;"></span>';
            }
            else if(_chat.Type == Chat.Visitor)
            {
                av = getAvatarURL(_chat.GetName(),'');
                avatar = '<span class="mobile-chat-line-avatar" style="background-image: url(\'' + av + '\') !important;"></span>';
            }
            lineHtml += avatar;
            lineHtml += '</div>';
        }
        var avatarClass = LocalConfiguration.UIShowAvatars ? 'avatar' : '';

        lineHtml += '<div class="mobile-chat-line-message ' + avatarClass + '" >';
        lineHtml += '<b>' + _chat.GetName() + '</b>' + '<br>';

        lineHtml += active_chat_question;
        lineHtml += '</div>';

        lineHtml += '<div class="mobile-chat-line-icon-time-button">';
        lineHtml += this.getCombinedIconTimeAndButton(_chat, missed, closed, _isBot, waitingTime);
        lineHtml += '</div>';

        lineHtml += '</div></td>';
    }
    return lineHtml + '</tr>';
};

ChatUI.prototype.getCombinedIconTimeAndButton = function(_chat, _isMissed, _isClosed, _isBot, _waitingTime){
    var iconField = this.GetMobileIcon(_chat, _isMissed, _isClosed, _isBot);
    var waitingTime = this.GetWaitingTimeMobile (_chat, _isMissed, _isClosed, _waitingTime);
    var button = [''];//this.GetButtonAndStyle(_chat);

    var result = '<div class="mobile-chat-line-icon">';
    result += iconField;
    result += '</div>';

    result += '<div class="mobile-chat-line-time">';
    result += waitingTime;
    result += '</div>';


    result += '<div class="mobile-chat-line-button nobg noibg nic button-field"' + button[1] + '>';
    result += button[0];
    result += '</div>';

    return result;
};

ChatUI.prototype.CalcWaitingTime = function(_chat, missed, closed, waitingTime) {

    var bgcolor = (waitingTime[1] <= 120) ? '' : (waitingTime[1] <= 300) ? '' : '';
    var forcolor = (waitingTime[1] <= 120) ? ' text-green' : ((waitingTime[1] <= 300) ? ' text-orange' : ' text-gray');

    if(missed || closed || _chat.GetChatGroup()!=null)
    {
        bgcolor = '';
        forcolor = ' text-gray';
    }
    else
        bgcolor += ' ';

    return[bgcolor,forcolor,waitingTime[0]];
};

ChatUI.prototype.GetWaitingTimeMobile = function (_chat, missed, closed, waitingTime) {
    var waitTime = this.CalcWaitingTime(_chat, missed, closed, waitingTime);
    return '<div id="allchats-waitingtime-' + _chat.i + '" class="' + waitTime[1] + ' text-center text-bold nobg">' + waitTime[2] + '</div>';
};

ChatUI.prototype.GetWaitingTimeField = function (_chat, missed, closed, waitingTime) {
    var waitTime = this.CalcWaitingTime(_chat, missed, closed, waitingTime);
    return '<td id="allchats-waitingtime-' + _chat.i + '" class="'+waitTime[0]+waitTime[1]+' text-center text-bold noibg">'+waitTime[2]+'</td>';
};

ChatUI.prototype.GetWTBGColor = function(_chat) {

    var waitingTime = (_chat.a == 0) ? this.GetTimeDifference(_chat.f) : this.GetTimeDifference(_chat.f, _chat.a);
    return (_chat.GetStatus()!=Chat.Closed && !_chat.IsMissed()) ? '#fff' : ((_chat.IsMissed() || _chat.GetStatus()==Chat.Closed) ? '#fafafa' : (waitingTime[1] <= 120) ? '#f5fff5' : (waitingTime[1] <= 300) ? '#fffbf5' : '#fff5f5');
};

ChatUI.prototype.GetWTFGColor = function(_chat) {

    var waitingTime = (_chat.a == 0) ? this.GetTimeDifference(_chat.f) : this.GetTimeDifference(_chat.f, _chat.a);
    return (_chat.GetStatus()==Chat.Closed && !_chat.IsMissed() || _chat.GetChatGroup()!=null) ? '#74b924' : ((waitingTime[1] <= 120) ? '#5f991d' : (waitingTime[1] <= 300) ? '#ff7800' : '#ff4c4c');
};

ChatUI.prototype.GetIconField = function(_chat,_missed,_closed,_bot){
    var iconFieldData = this.CalcIconField(_chat,_missed,_closed,_bot);
    var html='',color = (_missed) ? '' : ' style="color:'+iconFieldData[3]+' !important;"';

    html += '<td'+iconFieldData[0]+iconFieldData[1]+'>';
    html += '<div style="margin-top:-1px;background-image: url(\'./php/common/flag.php?cc=' + _chat.Visitor.ctryi2 + '\');" class="visitor-list-flag"></div>';
    html += '</td>';

    html += '<td id="allchats-icon-' + _chat.i + '"'+iconFieldData[0]+iconFieldData[1]+'>';
    html += '<i class="fa fa-'+iconFieldData[2]+'"'+iconFieldData[3]+color+'></i></td>';

    return html;
};

ChatUI.prototype.GetMobileIcon = function(_chat,_missed,_closed,_bot){
    var iconFieldData = this.CalcIconField(_chat,_missed,_closed,_bot);
    var color = (_missed) ? '' : ' style="color:'+iconFieldData[3]+';"';
    return '<div id="allchats-icon-' + _chat.i + '"'+iconFieldData[0]+'style="text-align:center;"'+'><i class="fa fa-'+iconFieldData[2]+'"'+color+'></i></div>';
};

ChatUI.prototype.CalcIconField = function(_chat,_missed,_closed,_bot){
    _missed = (d(_missed)) ? _missed : false;
    _closed = (d(_closed)) ? _closed : false;
    _bot = d(_bot) ? _bot : false;

    var j,inv=false;

    var forcolor = this.GetWTFGColor(_chat);
    var style = ' style="text-align:center;"';
    var clss = ' class="icon-column noibg"';

    if(!_closed)
        for (j=0; j<_chat.Members.length; j++)
            if (_chat.Members[j].i == DataEngine.myId && _chat.Members[j].s == 2)
            {
                //inv = true;
                forcolor = '#3399ff';
            }

    //var color = (_missed && false) ? '' : ' style="color:'+forcolor+' !important;"';
    var icon = (_closed && !_missed) ? 'check' : ((_missed) ? 'warning' : ((_chat.GetStatus()==Chat.Queue) ? 'clock-o' : (_chat.GetStatus()!=Chat.Active) ? 'bell-o' : (inv) ? 'eye' : 'comments'));

    if(_bot)
        icon = 'microchip';
    if(_chat.GetChatGroup()!=null)
        icon = 'comments';
    else if(_chat.AutoForwardCountdown != null && _chat.GetStatus() == Chat.Open && DataEngine.getConfigValue('gl_mcwf',false)=='1')
        icon = 'repeat';

    return [clss, style, icon, forcolor];
};

ChatUI.prototype.GetButtonField = function(_chat){
    var button = this.GetButtonAndStyle(_chat);
    return '<td'+button[1]+' class="nobg noibg nic button-field">'+button[0]+'</td>';
};

ChatUI.prototype.GetButtonAndStyle = function(_chat){
    var button='',bgcolor = this.GetWTBGColor(_chat);
    var style = ' style="text-align:center;';

    if(_chat.IsMissed() || _chat.GetStatus()==Chat.Closed)
        button = lzm_inputControls.createButton('ac-create-ticket-'+_chat.i, '', 'Chat.CreateTicket(\''+_chat.i+'\');', tid('create_ticket'), '', 'force-text',{margin:'0',display:'block',width:'90px',padding:'13px;'}, '', 17, 'd');
    else if(_chat.GetChatGroup() != null)
        button = (this.SelectedNode.indexOf('all-chats-group-')===0) ? '' : lzm_inputControls.createButton('ac-ban-chat-'+_chat.i, '', 'ChatUI.__ListButtonClick(this,\''+_chat.SystemId+'\',\'filter\',event);', tid('ban'), '', 'force-text',{margin:'0',display:'block',width:'90px',padding:'13px'}, '', 17, 'd');
    else if(_chat.GetStatus() == Chat.Open && _chat.IsMember(DataEngine.myId))
    {
        var uiText = tid('start_chat');
        if(_chat.AutoForwardCountdown != null)
            uiText += ' (' + Math.max(0,_chat.AutoForwardTimeLeft).toString() + ')';
        button = lzm_inputControls.createButton('ac-accept-chat-'+_chat.i, (_chat.AcceptInitiated ? 'ui-disabled' : ''), 'ChatUI.__ListButtonClick(this,\''+_chat.SystemId+'\',\'accept\',event);', uiText, '', 'force-text',{margin:'0',display:'block',width:'90px',padding:'13px'}, '', 17, 'd');
    }
    else if(_chat.GetStatus() == Chat.Queue || _chat.IsBotChat())
        button = lzm_inputControls.createButton('ac-take-chat-'+_chat.i, '', 'ChatUI.__ListButtonClick(this,\''+_chat.SystemId+'\',\'take\',event);', tid('take'), '', 'force-text',{margin:'0',display:'block',width:'90px',padding:'13px'}, '', 17, 'd');
    else if(_chat.GetStatus() == Chat.Active && _chat.IsHost(DataEngine.myId))
        button = lzm_inputControls.createButton('ac-open-chat-'+_chat.i, '', 'ChatUI.__ListButtonClick(this,\''+_chat.SystemId+'\',\'open\',event);', tid('open'), '', 'force-text',{margin:'0',display:'block',width:'90px',padding:'13px'}, '', 17, 'd');
    else if(_chat.GetStatus() == Chat.Active && _chat.IsMember(DataEngine.myId))
        button = lzm_inputControls.createButton('ac-open-chat-'+_chat.i, '', 'ChatUI.__ListButtonClick(this,\''+_chat.SystemId+'\',\'open\',event);', tid('open'), '', 'force-text',{margin:'0',display:'block',width:'90px',padding:'13px'}, '', 17, 'd');

    style += ((button.length) ? '' : 'padding:0 !important;') + '"';

    return [button,style];
};

ChatUI.prototype.GetTimeDifference = function(intervallStart, intervallEnd){
    intervallEnd = (typeof intervallEnd != 'undefined') ? intervallEnd : lzm_chatTimeStamp.getServerTimeString(null, true, 1000);
    var duration = intervallEnd - intervallStart;
    var hours = Math.floor(duration / 3600);
    var minutes = Math.floor((duration - hours * 3600)  / 60);
    var seconds = duration - hours * 3600 - minutes * 60;
    return [lzm_commonTools.pad(hours, 2) + ':' + lzm_commonTools.pad(minutes, 2) + ':' + lzm_commonTools.pad(seconds, 2), duration];
};

ChatUI.prototype.BlockEditor = function() {

    //this.EditorBlocked = true;
};

ChatUI.prototype.UnblockEditor = function() {

    //this.EditorBlocked = false;
};

ChatUI.prototype.CreateChatContextMenu = function(myObject, _place) {
    var disabledClass, onclickAction, contextMenuHtml = '';

    disabledClass = (!myObject.IsMember(DataEngine.myId) && myObject.Type != Chat.ChatGroup) ? ' class="ui-disabled"' : '';
    onclickAction = 'OpenChatWindow(\'' + myObject.SystemId + '\');';
    contextMenuHtml += '<div' + disabledClass + ' onclick="' + onclickAction + 'removeChatLineContextMenu();"><span class="cm-line">' + tid('open') + '</span></div><hr />';

    disabledClass = (myObject.IsMissed() || myObject.Type == Chat.ChatGroup) ? ' class="ui-disabled"' : '';
    onclickAction = 'ChatVisitorClass.ShowVisitorInformation(\'' + myObject.v + '\');';
    contextMenuHtml += '<div' + disabledClass + ' onclick="' + onclickAction + 'removeChatLineContextMenu();"><span id="show-allchats-details" class="cm-line">' + t('Details') + '</span></div><hr />';

    disabledClass = (myObject.IsMissed() || myObject.GetStatus() != Chat.Active || myObject.IsMember(DataEngine.myId) || myObject.IsBotChat()) ? ' class="ui-disabled"' : '';
    onclickAction = 'JoinChat(\'' + myObject.v + '\', \'' + myObject.b + '\', \'' + myObject.i + '\', false);';
    contextMenuHtml += '<div' + disabledClass + ' onclick="' + onclickAction + 'removeChatLineContextMenu();">' + '<span id="join-allchats" class="cm-line cm-click">' + tid('join') + '</span></div>';

    disabledClass = (myObject.IsMissed() || myObject.GetStatus() != Chat.Active || myObject.IsMember(DataEngine.myId) || myObject.IsBotChat()) ? ' class="ui-disabled"' : '';
    onclickAction = 'JoinChat(\'' + myObject.v + '\', \'' + myObject.b + '\', \'' + myObject.i + '\', true);';
    contextMenuHtml += '<div' + disabledClass + ' onclick="' + onclickAction + 'removeChatLineContextMenu();"><span id="join-allchats-invisible" class="cm-line">' + tid('join_mentor') + '</span></div><hr />';

    var gro = myObject.GetChatGroup();
    var groid = (gro != null) ? gro.id : '';

    disabledClass = (myObject.IsMissed() || myObject.IsHost(DataEngine.myId) || myObject.Type == Chat.ChatGroup) ? ' class="ui-disabled"' : '';
    onclickAction = 'takeChat(\'' + myObject.v + '\', \'' + myObject.b + '\', \'' + myObject.i + '\', \'' + myObject.dcg + '\');';
    contextMenuHtml += '<div' + disabledClass + ' onclick="' + onclickAction + 'removeChatLineContextMenu();"><span id="take-allchats" class="cm-line cm-click">' + tid('take') + '</span></div><hr />';

    disabledClass = (myObject.GetStatus() == Chat.Closed || myObject.Type != Chat.Visitor || myObject.IsAccepted()) ? ' class="ui-disabled"' : '';
    onclickAction = 'ChatUI.SetPriority(\'' + myObject.i + '\');';
    contextMenuHtml += '<div' + disabledClass + ' onclick="' + onclickAction + '"><span id="priority-allchats" class="cm-line cm-click">' + tid('priority') + '</span></div><hr />';

    disabledClass = (myObject.IsMissed() || myObject.GetStatus() != Chat.Active || !myObject.IsMember(DataEngine.myId)) ? ' class="ui-disabled"' : '';
    onclickAction = 'leaveChat(\'' + myObject.i + '\');';
    contextMenuHtml += '<div' + disabledClass + ' onclick="' + onclickAction + 'removeChatLineContextMenu();"><span id="leave-allchats" class="cm-line cm-click">' + t('Leave') + '</span></div>';

    disabledClass = (myObject.IsMissed() || myObject.Type == Chat.ChatGroup) ? ' class="ui-disabled"' : '';
    onclickAction = 'forwardChat(\'' + myObject.i + '\');';
    contextMenuHtml += '<div' + disabledClass + ' onclick="' + onclickAction + 'removeChatLineContextMenu();"><span id="forward-allchats" class="cm-line cm-click">' + t('Forward') + '</span></div>';

    disabledClass = (myObject.IsMissed() || myObject.Type == Chat.ChatGroup) ? ' class="ui-disabled"' : '';
    onclickAction = 'forwardChat(\'' + myObject.i + '\', \'invite\');';
    contextMenuHtml += '<div' + disabledClass + ' onclick="' + onclickAction + 'removeChatLineContextMenu();"><span id="invite-allchats" class="cm-line cm-click">' + t('Invite Operator') + '</span></div><hr />';

    disabledClass = (myObject.Type == Chat.ChatGroup || gro != null || myObject.GetStatus() == Chat.Closed || myObject.GetStatus() == Chat.Queue) ? ' class="ui-disabled"' : '';
    contextMenuHtml += '<div' + disabledClass + ' onclick="addToChatGroup(\'' + myObject.v + '\', \'' + myObject.b + '\', \'' + myObject.i + '\');removeVisitorChatActionContextMenu();"><span class="cm-line cm-click">' + tid('group_chat_add') + '</span></div>';

    disabledClass = (myObject.Type == Chat.ChatGroup || gro == null || myObject.GetStatus() == Chat.Closed) ? ' class="ui-disabled"' : '';
    contextMenuHtml += '<div' + disabledClass + ' onclick="removeFromChatGroup(\'' + myObject.SystemId + '\', \'' + groid + '\');removeVisitorChatActionContextMenu();"><span class="cm-line cm-click">' + tid('group_chat_remove') + '</span></div><hr />';

    disabledClass = (!myObject.IsChatGroup()) ? ' class="ui-disabled"' : '';
    contextMenuHtml += '<div' + disabledClass + ' onclick="deleteChatGroup(\'' + myObject.SystemId + '\');removeVisitorChatActionContextMenu();"><span class="cm-line cm-click">' + tid('group_chat_delete') + '</span></div><hr />';

    disabledClass = (!(myObject.IsChatGroup()  && myObject.IsMember(DataEngine.myId))) ? ' class="ui-disabled"' : '';
    contextMenuHtml += '<div' + disabledClass + ' onclick="removeFromChatGroup(\'' + DataEngine.myId + '\',\'' + myObject.SystemId + '\');removeVisitorChatActionContextMenu();"><span class="cm-line cm-click">' + tid('leave_group') + '</span></div><hr />';

    disabledClass = (myObject.Type != Chat.Visitor) ? ' class="ui-disabled"' : '';
    onclickAction = 'ChatVisitorClass.ShowVisitorInformation(\'' + myObject.v + '\', 5);';
    contextMenuHtml += '<div' + disabledClass + ' onclick="' + onclickAction + 'removeChatLineContextMenu();"><span id="show-allchats-archive" class="cm-line cm-click">' + tid('archive') + '</span></div><hr />';

    disabledClass = (myObject.Type != Chat.Visitor) ? ' class="ui-disabled"' : '';
    contextMenuHtml += '<div' + disabledClass + ' onclick="Chat.CreateTicket(\''+myObject.i+'\');removeChatLineContextMenu();"><span class="cm-line cm-click">' + tid('create_ticket') + '</span></div><hr />';

    disabledClass = (myObject.Type != Chat.Visitor) ? ' class="ui-disabled"' : '';
    onclickAction = 'showFilterCreation(\'visitor\', \'' + myObject.v + '\');';
    contextMenuHtml += '<div' + disabledClass + ' onclick="' + onclickAction + 'removeChatLineContextMenu();"><span id="ban-allchats" class="cm-line cm-click">' + t('Ban (add filter)') + '</span></div>';

    if(_place == 'task-bar-panel')
        contextMenuHtml += '<hr /><div onclick="TaskBarManager.CloseOffline();removeChatLineContextMenu();"><span id="chat-close-all-offline" class="cm-line cm-click">' + t('Close all offline chats') + '</span></div>';


    return contextMenuHtml;
};

ChatUI.__ListButtonClick = function(_button,_chatSystemId,_type,_event) {

    var chatObj = DataEngine.ChatManager.GetChat(_chatSystemId);
    if(_type=='open')
        OpenChatWindow(_chatSystemId);
    if(_type=='take')
        takeChat(chatObj.v,chatObj.b,chatObj.i,chatObj.dcg,chatObj.GetStatus()!=Chat.Queue);
    if(_type=='accept')
        AcceptChat(_chatSystemId);
    if(_type=='filter')
        showFilterCreation('visitor',chatObj.v);
    if(_type=='archive')
        showArchivedChat(chatObj.v,'',chatObj.i, 1);

    if(_type=='accept'||_type=='take')
        $(_button).addClass('ui-disabled');

    _event.stopPropagation();

    setTimeout(function(){
        lzm_chatDisplay.RemoveAllContextMenus();
    },100);
};

ChatUI.__RowClick = function(_row,_chatId) {

    if(_row.timerID)
    {
        clearTimeout(_row.timerID);
        _row.timerID=null;
        var chatobj = DataEngine.ChatManager.GetChat(_chatId,'i');
        if(chatobj.GetStatus() != Chat.Closed)
            takeChat(chatobj.v,chatobj.b,chatobj.i,chatobj.dcg, true);
    }
    else
    {
        _row.timerID=setTimeout(function()
        {
            _row.timerID=null;

        },300);

        if(lzm_chatDisplay.ChatsUI.SelectedRow == _chatId)
        {
            return;
        }

        $('.allchats-line').removeClass('selected-table-line');
        $('#allchats-line-' + _chatId).addClass('selected-table-line');
        lzm_chatDisplay.ChatsUI.SelectedRow = _chatId;

        setTimeout(function(){
            lzm_chatDisplay.ChatsUI.InitChatPreview(_chatId);
        },400);
    }
};

ChatUI.__TreeClick = function(_id) {
    lzm_chatDisplay.ChatsUI.UpdateChatList(_id);
    if(lzm_chatDisplay.ChatsUI.CategorySelect)
        handleAllChatsTree();
};

ChatUI.SetPriority = function(_chatId){

    removeChatLineContextMenu();
    if (PermissionEngine.checkUserPermissions('', 'chats', 'set_priority', {}))
    {
        var chatObj = DataEngine.ChatManager.GetChat(_chatId,'i');
        var prioList = [
            {text:tid('priority_4'),value:4},
            {text:tid('priority_3'),value:3},
            {text:tid('priority_2'),value:2},
            {text:tid('priority_1'),value:1},
            {text:tid('priority_0'),value:0}
        ];

        var prioHTML = lzm_inputControls.createSelect('set-chat-priority','','','','',{},'',prioList,chatObj.p,'');
        lzm_commonDialog.createAlertDialog(prioHTML, [{id: 'ok', name: t('Ok')}, {id: 'cancel', name: t('Cancel')}]);


        $('#alert-btn-ok').click(function() {
            chatObj.p = $('#set-chat-priority').val();
            CommunicationEngine.pollServerSpecial(chatObj, 'set-priority');
            $('#alert-btn-cancel').click();
        });
        $('#alert-btn-cancel').click(function() {
            lzm_commonDialog.removeAlertDialog();
        });
    }
    else
        showNoPermissionMessage();
};

