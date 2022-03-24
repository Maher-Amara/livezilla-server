/****************************************************************************************
 * LiveZilla ChatTicketClass.js
 *
 * Copyright 2018 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/

function ChatTicketClass() {
    this.notifyNewTicket = false;
    this.setNotifyNewTicket = false;
    this.updatedTicket = null;
    this.selectedEmailNo = 0;
    this.CategorySelect = false;
    this.logCategories = ['ChangeStatus','ChangeLanguage','ChangeEditor','ChangeGroup','LinkTicket','LinkChat','CreateTicket','DeleteTicket','MoveIntoNewTicket','ForwardMessage','ChangeFullname','ChangeEmail','ChangeCompany','ChangePhone','ChangeSubject','ChangeText','ChangeCustom1','ChangeCustom2','ChangeCustom3','ChangeCustom4','ChangeCustom5','ChangeCustom6','ChangeCustom7','ChangeCustom8','ChangeCustom9','ChangeCustom10','ChangeSubStatus','ChangeSubChannel','ChangePriority','ChangeChannel','SaveDraft','LastViewTicket','ResendMessage'];
}

ChatTicketClass.m_TicketChannels = [];
ChatTicketClass.m_BlockReplyDrop = false;
ChatTicketClass.EmailCount = 0;
ChatTicketClass.IsUnreadTicket = false;
ChatTicketClass.LoadingTimer = null;
ChatTicketClass.TreeSwitchWidth = 650;
ChatTicketClass.PreviewSwitchWidth = 900;
ChatTicketClass.EmailListUpdate = false;
ChatTicketClass.ComposerLastCursorPosition = 0;
ChatTicketClass.ComposerAutoSearchWord = '';
ChatTicketClass.TextEditor = null;
ChatTicketClass.SignatureEditor = null;
ChatTicketClass.LastActiveTicket = null;
ChatTicketClass.SelectedTicketId = '';
ChatTicketClass.LastDraftSave = 0;
ChatTicketClass.InsertPlaceholder = '';
ChatTicketClass.SelectedMessageNo = 0;
ChatTicketClass.LastTicketTake = 0;

ChatTicketClass.prototype.CreateTicketList = function(tickets, ticketGlobalValues, page, sort, sortDir, query, filter, inDialog, elementId) {
    var that = this;
    lzm_chatDisplay.ticketListTickets = tickets;

    var ticketList = that.CreateTicketListHtml(tickets, ticketGlobalValues, page, sort, sortDir, query, filter, elementId);

    var ticketListHtml = ticketList[0];
    var numberOfPages = ticketList[1];
    var activeLines = ticketList[2];

    $('#ticket-list').html(ticketListHtml).trigger('create');

    if(this.isFullscreenMode())
        ChatTicketClass.HandleTicketClick(lzm_chatDisplay.selectedTicketRow, true, inDialog, elementId);

    if (page == 1)
    {
        $('#ticket-page-all-backward').addClass('ui-disabled');
        $('#ticket-page-one-backward').addClass('ui-disabled');
    }
    if (page == numberOfPages)
    {
        $('#ticket-page-one-forward').addClass('ui-disabled');
        $('#ticket-page-all-forward').addClass('ui-disabled');
    }

    var scols = lzm_displayHelper.getSortableRows('ticket');
    for(var key in scols)
        if(sort != scols[key])
            $('#ticket-sort-' + scols[key].replace(/_/g,'-')+elementId).addClass('inactive-sort-column');

    UIRenderer.resizeTicketList();
    lzm_chatDisplay.styleTicketClearBtn();


    $('#ticket-create-new').click(function() {
        if (PermissionEngine.checkUserPermissions('', 'tickets', 'create_tickets', {}))
            ChatTicketClass.__ShowTicket('', false);
        else
            showNoPermissionMessage();
    });
    $('#ticket-show-emails').click(function() {
        //if(ChatTicketClass.EmailCount==0)
          //  return;
        if (PermissionEngine.checkUserPermissions('', 'tickets', 'review_emails', {}))
            toggleEmailList();
        else
            showNoPermissionMessage();
    });
    $('#ticket-reload-emails').click(function() {
        $('#ticket-reload-emails').addClass('ui-disabled');
        setTimeout(function(){
            $('#ticket-reload-emails').removeClass('ui-disabled');
        },10000);
        CommunicationEngine.pollServerSpecial({}, 'reload_emails');
    });

    $('#ticket-list').click(function(){
        that.LastActivity = lz_global_timestamp();
    });

    $('.ticket_col_header').unbind("contextmenu");
    $('.ticket_col_header').contextmenu(function(){
        var cm = {id: 'ticket_header_cm',entries: [{label: tid('settings'),onClick : 'LocalConfiguration.__OpenTableSettings(\'tickets\')'}]};
        if(ContextMenuClass.BuildMenu(event,cm))
            return false;
    });

    if (isNaN(numberOfPages))
        switchTicketListPresentation(DataEngine.ticketFetchTime, 0);

    if(page > 1 && activeLines == 0)
        pageTicketList(1);
};

ChatTicketClass.prototype.GetTicketById = function(_id,returnEmpty){
    returnEmpty = (d(returnEmpty)) ? returnEmpty : false;
    var i, x;

    for (i=0; i<lzm_chatDisplay.ticketListTickets.length; i++)
        if (lzm_chatDisplay.ticketListTickets[i].id == _id)
            return lzm_chatDisplay.ticketListTickets[i];
    for (i in lzm_chatDisplay.ticketControlTickets)
        for (x=0; x<lzm_chatDisplay.ticketControlTickets[i].length; x++)
            if (lzm_chatDisplay.ticketControlTickets[i][x].id == _id)
                return lzm_chatDisplay.ticketControlTickets[i][x];

    for(i in VisitorManager.LoadedFullDataUsers)
    {
        if(d(VisitorManager.LoadedFullDataUsers[i].ArchivedTickets) && VisitorManager.LoadedFullDataUsers[i].ArchivedTickets.length)
            for(x in VisitorManager.LoadedFullDataUsers[i].ArchivedTickets)
                if(VisitorManager.LoadedFullDataUsers[i].ArchivedTickets[x].id == _id)
                    return VisitorManager.LoadedFullDataUsers[i].ArchivedTickets[x];
    }

    if(TaskBarManager.GetWindow(_id) != null)
        return TaskBarManager.GetWindow(_id).Tag;

    if(returnEmpty)
        return {};

    return null;
};

ChatTicketClass.prototype.UpdateTicketList = function(tickets, ticketGlobalValues, page, sort, sortDir, query, filter, forceRecreate, pollObject) {

    var selectedTicketExistsInList = false, that = this;
    for (var i=0; i<tickets.length; i++)
        if (tickets[i].id == lzm_chatDisplay.selectedTicketRow || lzm_chatDisplay.selectedTicketRow == '')
            selectedTicketExistsInList = true;

    if (!selectedTicketExistsInList)
        try
        {
            lzm_chatDisplay.selectedTicketRow = (tickets.length > lzm_chatDisplay.selectedTicketRowNo) ?
                tickets[lzm_chatDisplay.selectedTicketRowNo].id : tickets[tickets.length - 1].id;
        }
        catch(ex)
        {

        }

    pollObject = (typeof pollObject != 'undefined') ? pollObject : null;
    forceRecreate = (typeof forceRecreate != 'undefined') ? forceRecreate : false;
    forceRecreate = (forceRecreate || lzm_chatDisplay.ticketGlobalValues.updating != ticketGlobalValues.updating);

    var ticketDutHasChanged = (lzm_chatDisplay.ticketGlobalValues['dut'] != ticketGlobalValues['dut']);
    var customDemandToken = (pollObject != null && pollObject.p_cdt != 0) ? pollObject.p_cdt : false;
    var notificationPushText = '';

    if(customDemandToken && customDemandToken != 'linker')
        lzm_chatDisplay.ticketControlTickets[customDemandToken] = lzm_commonTools.clone(tickets);

    //emails
    if (!isNaN(parseInt(ticketGlobalValues.elmc)) && (!isNaN(parseInt(lzm_chatDisplay.ticketGlobalValues.elmc)) && parseInt(ticketGlobalValues.elmc) > parseInt(lzm_chatDisplay.ticketGlobalValues.elmc)))
    {
        if(lzm_chatDisplay.selected_view != 'tickets')
            this.notifyNewTicket = true;

        notificationPushText = (ticketGlobalValues.elmn != '') ? tid('notification_new_message',[['<!--sender-->', ticketGlobalValues.elmn], ['<!--text-->', ticketGlobalValues.elmt]]) : t('New Message');
        NotificationManager.NotifyEmail(ticketGlobalValues.elmt,ticketGlobalValues.elmn,notificationPushText);
    }

    // tickets
    if(DataEngine.TicketLatestReceivedTime < ticketGlobalValues.tlmc)
    {
        DataEngine.TicketLatestReceivedTime = ticketGlobalValues.tlmc;

        if(lzm_chatDisplay.selected_view!='tickets')
            this.notifyNewTicket = true;

        notificationPushText = (ticketGlobalValues.tlmn != '') ? tid('notification_new_message',[['<!--sender-->', ticketGlobalValues.tlmn], ['<!--text-->', ticketGlobalValues.tlmt]]) : t('New Message');

        var name = (ticketGlobalValues.tlmn != '') ? ticketGlobalValues.tlmn : 'LiveZilla';
        var text = (ticketGlobalValues.tlmt != '') ? ticketGlobalValues.tlmt : tid('new_message');

        NotificationManager.NotifyTicket(text,name,notificationPushText);
    }

    try
    {
        lzm_chatDisplay.ticketGlobalValues = lzm_chatDisplay.lzm_commonTools.clone(ticketGlobalValues);
        var selectedTicket = {id: ''};
        for (var j=0; j<tickets.length; j++)
        {
            var ticketEditor = (typeof tickets[j].editor != 'undefined' && tickets[j].editor != false) ? tickets[j].editor.ed : '';
            if (lzm_commonTools.checkTicketReadStatus(tickets[j].id, lzm_chatDisplay.ticketReadArray, tickets) == -1 &&
                (!lzm_chatDisplay.ticketReadStatusChecked || ticketEditor == lzm_chatDisplay.myId || ticketEditor == '')) {
                lzm_chatDisplay.ticketReadArray = lzm_commonTools.removeTicketFromReadStatusArray(tickets[j].id, lzm_chatDisplay.ticketReadArray, true);
            }
            if (lzm_chatDisplay.ticketReadStatusChecked && ticketEditor != lzm_chatDisplay.myId && ticketEditor != '' && tickets[j].u > lzm_chatDisplay.ticketGlobalValues.mr) {
                lzm_chatDisplay.ticketReadArray = lzm_commonTools.addTicketToReadStatusArray(tickets[j].id, lzm_chatDisplay.ticketReadArray, tickets);
            }
            if (tickets[j].id == lzm_chatDisplay.selectedTicketRow)
            {
                for (var k=0; k<lzm_chatDisplay.ticketListTickets.length; k++)
                {
                    if (tickets[j].id == lzm_chatDisplay.ticketListTickets[k].id && tickets[j].md5 != lzm_chatDisplay.ticketListTickets[k].md5)
                    {
                        selectedTicket = tickets[j];
                    }
                }
            }
        }

        if(!customDemandToken)
            lzm_chatDisplay.ticketListTickets  = tickets;

        var numberOfUnreadTickets = lzm_chatDisplay.ticketGlobalValues.r - lzm_chatDisplay.ticketReadArray.length + lzm_chatDisplay.ticketUnreadArray.length;
        numberOfUnreadTickets = (typeof numberOfUnreadTickets == 'number' && numberOfUnreadTickets >= 0) ? numberOfUnreadTickets : 0;

        if (!customDemandToken && lzm_chatDisplay.ticketGlobalValues.u != numberOfUnreadTickets)
            lzm_chatDisplay.ticketGlobalValues.u = numberOfUnreadTickets;

        ChatTicketClass.EmailCount = lzm_chatDisplay.ticketGlobalValues['e'];

        $('#ticket-show-emails').children('span').html(t('Emails <!--number_of_emails-->',[['<!--number_of_emails-->', '(' + ChatTicketClass.EmailCount + ')']]));

        if (ChatTicketClass.EmailCount > 0)
        {
            $('#ticket-show-emails').addClass('lzm-button-b-active');
            $('#ticket-reload-emails').addClass('lzm-button-b-active');
        }
        else
        {
            $('#ticket-show-emails').removeClass('lzm-button-b-active');
            $('#ticket-reload-emails').removeClass('lzm-button-b-active');
        }

        if (!customDemandToken)
        {
            if (lzm_chatDisplay.selected_view == 'tickets')
                if (ticketDutHasChanged || forceRecreate)
                    that.CreateTicketList(lzm_chatDisplay.ticketListTickets, ticketGlobalValues, page, sort, sortDir, query, filter, false, '');

            lzm_chatDisplay.numberOfUnreadTickets = numberOfUnreadTickets;

            if (TaskBarManager.WindowExists(selectedTicket.id+'_reply'))
            {
                that.showOtherOpEditWarning(selectedTicket);
            }

            if(($('#ticket-message-placeholder').length == 1) && ($('#ticket-history-div').length == 1) && selectedTicket.id != '')
            {
                that.updateTicketDetails(selectedTicket);
            }
        }
        else if(customDemandToken && customDemandToken != 'linker')
        {
            if ($('#visitor-info-d-'+customDemandToken+'-placeholder').length > 0) {
                var numberOfTickets = tickets.length;
                $('#matching-tickets-d-'+customDemandToken+'-table').html(that.CreateMatchingTicketsTableContent(tickets, 'd-'+customDemandToken));
                $('#visitor-info-d-'+customDemandToken+'-placeholder-tab-6').html(t('Tickets (<!--number_of_tickets-->)', [['<!--number_of_tickets-->', numberOfTickets]]));
                if(numberOfTickets>0){
                    $('#visitor-info-d-'+customDemandToken+'-placeholder-tab-6').removeClass('ui-disabled');
                    $('#visitor-info-d-'+customDemandToken+'-placeholder-tab-6').addClass('lzm-tabs-message');
                }
                ChatTicketClass.HandleTicketClick('',true,true,'d-'+customDemandToken);
            }
            if ($('#visitor-info-e-'+customDemandToken+'-placeholder').length > 0) {
                var numberOfTickets = tickets.length;
                $('#matching-tickets-e-'+customDemandToken+'-table').html(that.CreateMatchingTicketsTableContent(tickets, 'e-'+customDemandToken));
                $('#visitor-info-e-'+customDemandToken+'-placeholder-tab-6').html(t('Tickets (<!--number_of_tickets-->)', [['<!--number_of_tickets-->', numberOfTickets]]));
                if(numberOfTickets>0){
                    $('#visitor-info-e-'+customDemandToken+'-placeholder-tab-6').removeClass('ui-disabled');
                    $('#visitor-info-e-'+customDemandToken+'-placeholder-tab-6').addClass('lzm-tabs-message');
                }
                ChatTicketClass.HandleTicketClick('',true,true,'e-'+customDemandToken);
            }
        }

        if (customDemandToken && customDemandToken != 'linker' && $('#ticket-linker-first').length > 0) {

            var position = $('#ticket-linker-first').data('search').split('~')[0];
            var linkerType = $('#ticket-linker-first').data('search').split('~')[1];
            var inputChangeId = $('#ticket-linker-first').data('input');
            if (linkerType == 'ticket')
            {
                that.fillLinkData(position, $('#' + inputChangeId).val(), false, true);
            }
        }
    }
    catch(e)
    {
        deblog(e);
    }

    lzm_chatDisplay.UpdateViewSelectPanel();
};

ChatTicketClass.prototype.showOtherOpEditWarning = function(selectedTicket) {

    if (selectedTicket.id != '')
    {
        if (typeof selectedTicket.editor != 'undefined' && typeof selectedTicket.editor.ed != 'undefined' && selectedTicket.editor.ed != lzm_chatDisplay.myId)
        {
            var otherOp = DataEngine.operators.getOperator(selectedTicket.editor.ed);

            if(otherOp == null)
                return;

            if(ChatTicketClass.LastTicketTake > (lzm_chatTimeStamp.getServerTimeString() - 15))
                return;

            var opName = (otherOp != null) ? otherOp.name : tid('another_operator').toLowerCase();
            var warningMsg = tid('ticket_processed_other_op', [['<!--op_name-->', opName]]);

            warningMsg += '<br><br><b>' + selectedTicket.id + ' (' +selectedTicket.messages[0].fn + ')</b>';

            lzm_commonDialog.createAlertDialog(warningMsg, [{id: 'close', name: tid('close')},{id: 'ignore', name: tid('ignore')}]);

            $('#alert-btn-close').click(function() {
                lzm_commonDialog.removeAlertDialog();
                if(TaskBarManager.WindowExists(selectedTicket.id + '_reply'))
                {
                    TaskBarManager.Close(selectedTicket.id + '_reply');
                    $('#alert-btn-ok').click();
                }
                if(TaskBarManager.WindowExists(selectedTicket.id))
                {
                    TaskBarManager.Close(selectedTicket.id);
                }
            });
            $('#alert-btn-ignore').click(function() {
                lzm_commonDialog.removeAlertDialog();
            });
        }
    }
};

ChatTicketClass.prototype.CreateTicketListHtml = function(tickets, ticketGlobalValues, page, sort, sortDir, query, filter, elementId) {

    var fullScreenMode = this.isFullscreenMode(), that = this, i;
    var totalTickets = ticketGlobalValues.t;
    var unreadTickets = Math.max(0, ticketGlobalValues.r - lzm_chatDisplay.ticketReadArray.length + lzm_chatDisplay.ticketUnreadArray.length);
    lzm_chatDisplay.ticketGlobalValues.u = unreadTickets;

    var filteredTickets = ticketGlobalValues.q;
    ChatTicketClass.EmailCount = ticketGlobalValues.e;

    var ticketListInfo1 = t('<!--total_tickets--> total entries, <!--unread_tickets--> new entries, <!--filtered_tickets--> matching filter', [['<!--total_tickets-->', totalTickets], ['<!--unread_tickets-->', unreadTickets], ['<!--filtered_tickets-->', filteredTickets]]);
    var ticketListInfo2 = t('<!--total_tickets--> total entries, <!--unread_tickets--> new entries', [['<!--total_tickets-->', totalTickets], ['<!--unread_tickets-->', unreadTickets]]);
    var ticketListHtml = '<div id="ticket-list-headline2" class="lzm-dialog-headline2">';

    ticketListHtml += '<span class="left-button-list">';

    var ttclass = '';
    if(LocalConfiguration.ShowTicketTree)
        ttclass = 'lzm-button-b-pushed';

    ticketListHtml += lzm_inputControls.createButton('ticket-tree', ttclass, 'handleTicketTree();', '', '<i class="fa fa-list-ul"></i>', 'lr',{'margin-left': '4px'}, '', -1,'e');
    ticketListHtml += '</span><span class="right-button-list">';
    ticketListHtml += lzm_inputControls.createButton('ticket-filter', '', 'setTicketFilter();',tid('filter'), '<i class="fa fa-filter"></i>', 'lr',{'margin-right': '4px'}, '', -1,'e');

    var searchVisible = (CommonInputControlsClass.SearchBox.ShowTicket) ? 'none' : 'inline';
    ticketListHtml += lzm_inputControls.createButton('ticket-search', '', 'CommonInputControlsClass.SearchBox.ToggleSearchDialog(true);','', '<i class="fa fa-search"></i>', 'lr',{'margin-right': '4px',display:searchVisible}, '', -1,'e');
    ticketListHtml += '</span>';

    if (lzm_chatDisplay.windowWidth > ChatTicketClass.TreeSwitchWidth)
    {
        var ticketListInfo = (CommunicationEngine.ticketFilterStatus.length == 4 && CommunicationEngine.ticketQuery == '') ? ticketListInfo2 : ticketListInfo1;
        ticketListHtml += '<span class="lzm-dialog-hl2-info">' + ticketListInfo + '</span>';
    }

    ticketListHtml += '</div>';

    var ticketListBodyCss = ((IFManager.IsAppFrame || IFManager.IsMobileOS) || lzm_chatDisplay.windowWidth <= 1000) ? ' style="overflow: auto;"' : '';
    ticketListHtml += '<div id="ticket-list-body" class="lzm-dialog-body" onclick="removeTicketContextMenu();"' + ticketListBodyCss + '>';
    ticketListHtml += this.GetTicketTreeViewHTML(ticketGlobalValues);
    ticketListHtml += '<div id="ticket-list-left" class="ticket-list">';
    ticketListHtml += '<table class="visible-list-table alternating-rows-table lzm-unselectable">';

    ticketListHtml += this.GetTableHeader(sortDir, elementId, true);

    ticketListHtml += '<tbody>';

    var lineCounter = 0;
    var numberOfTickets = (typeof ticketGlobalValues.q != 'undefined') ? ticketGlobalValues.q : ticketGlobalValues.t;
    var numberOfPages = Math.max(1, Math.ceil(numberOfTickets / ticketGlobalValues.p));
    if (ticketGlobalValues.updating)
        ticketListHtml += '<tr><td colspan="15" style="font-weight: bold; font-size: 16px; text-align: center; padding: 20px;">' + t('The ticket database is updating.') +'</td></tr>';
    else if (!isNaN(numberOfPages))
        for (i=0; i<tickets.length; i++)
            if (tickets[i].del == 0)
            {
                ticketListHtml += that.CreateTicketListLine(tickets[i], lineCounter, false, elementId, fullScreenMode);
                lineCounter++;
            }

    ticketListHtml += '</tbody></table></div>';

    var footline = '<div id="ticket-list-footline">';
    if (!isNaN(numberOfPages))
    {
        footline += lzm_inputControls.createButton('ticket-page-all-backward', 'ticket-list-page-button', 'pageTicketList(1);', '', '<i class="fa fa-fast-backward"></i>', 'l',{'border-right-width': '1px'},'',-1,'e') +
            lzm_inputControls.createButton('ticket-page-one-backward', 'ticket-list-page-button', 'pageTicketList(' + (page - 1) + ');', '', '<i class="fa fa-backward"></i>', 'r',{'border-left-width': '1px'},'',-1,'e') +
            '<span style="padding: 0 15px;">' + t('Page <!--this_page--> of <!--total_pages-->',[['<!--this_page-->', page], ['<!--total_pages-->', numberOfPages]]) + '</span>' +
            lzm_inputControls.createButton('ticket-page-one-forward', 'ticket-list-page-button', 'pageTicketList(' + (page + 1) + ');', '', '<i class="fa fa-forward"></i>', 'l',{'border-right-width': '1px'},'',-1,'e') +
            lzm_inputControls.createButton('ticket-page-all-forward', 'ticket-list-page-button', 'pageTicketList(' + numberOfPages + ');', '', '<i class="fa fa-fast-forward"></i>', 'r',{'border-left-width': '1px'},'',-1,'e');
    }
    footline += '</div>';

    ticketListHtml += footline;

    ticketListHtml += '<div id="ticket-list-right" class="ticket-list"></div>';
    ticketListHtml += '<div id="ticket-list-actions" class="ticket-list"><span style="float:left;">';
    ticketListHtml += lzm_inputControls.createButton('ticket-action-comment', 'ui-disabled ticket-action', 'ChatTicketClass.AddComment();', tid('comment'), '', 'r',{'margin-left':'4px'},'',-1,'e');
    ticketListHtml += '</span><span style="float:right;">';
    ticketListHtml += lzm_inputControls.createButton('ticket-action-translate', 'ui-disabled ticket-action', 'showTicketMsgTranslator();', tid('translate'), '', 'r',{'margin-right':'4px'},'',-1,'e');
    ticketListHtml += '</span></div>';
    ticketListHtml += '</div>';


    return [ticketListHtml, numberOfPages, lineCounter];
};

ChatTicketClass.prototype.GetTicketTreeViewHTML = function(_amounts){

    function getSelClass(_id){
        return (_id == LocalConfiguration.TicketTreeCategory || LocalConfiguration.TicketTreeCategory == null && _id == 'tnFilterStatusActive') ? ' class="selected-treeview-div"' : '';
    }
    function getSubStatuses(_parentNumber, _parentId){
        var key,elemHtml ="";
        if(d(DataEngine.global_configuration.database))
            for(key in DataEngine.global_configuration.database['tsd'])
            {
                var elem = DataEngine.global_configuration.database['tsd'][key];
                {
                    var oncevs = ' onclick="ChatTicketClass.HandleTicketTreeClickEvent(this.id,\''+_parentId+'\',\''+elem.name+'\');"';
                    if(_parentNumber == elem.parent && elem.type == 0)
                        elemHtml += '<div id="'+elem.sid+'" style="padding-left:'+paddings[3]+';"'+getSelClass(elem.sid)+oncevs+'><i class="fa fa-caret-right icon-light"></i>'+elem.name+' ('+_amounts['ttsd' + elem.sid]+')</div>';
                }
            }
        return elemHtml;
    }

    var paddings =['5px','20px','35px','50px'],cactive = parseInt(_amounts['ttst0'])+parseInt(_amounts['ttst1']);
    var oncev = ' onclick="ChatTicketClass.HandleTicketTreeClickEvent(this.id,null);"';

    var treeHtml = '<div id="ticket-list-tree" class="ticket-list">';

    treeHtml += '<div id="ticket-list-tree-inner" class="ticket-add-panel">';
    treeHtml += '<div id="ttv_tn_all" style="padding-left:'+paddings[0]+';"'+getSelClass('ttv_tn_all')+oncev+'><i class="fa fa-caret-down icon-light"></i>'+tid('all_tickets')+' ('+_amounts['ta']+')</div>';
    treeHtml += '<div id="tnFilterStatusActive" style="padding-left:'+paddings[1]+';"'+getSelClass('tnFilterStatusActive')+oncev+'><i class="fa fa-caret-down icon-light"></i><b>'+tid('active')+' ('+cactive+')</b></div>';

    treeHtml += '<div id="tnFilterStatusOpen" style="padding-left:'+paddings[2]+';"'+getSelClass('tnFilterStatusOpen')+oncev+'><i class="fa fa-question-circle" style="color: #5197ff;"></i>'+tid('ticket_status_0')+' ('+_amounts['ttst0']+')</div>';
    treeHtml += getSubStatuses('0','tnFilterStatusOpen');

    treeHtml += '<div id="tnFilterStatusInProgress" style="padding-left:'+paddings[2]+';"'+getSelClass('tnFilterStatusInProgress')+oncev+'><i class="fa fa-gear"></i>'+tid('ticket_status_1')+' ('+_amounts['ttst1']+')</div>';
    treeHtml += getSubStatuses('1','tnFilterStatusInProgress');

    treeHtml += '<div id="tnFilterOverdue" style="padding-left:'+paddings[2]+';"'+getSelClass('tnFilterOverdue')+oncev+'><i class="fa fa-warning icon-red"></i>'+tid('overdue')+' ('+_amounts['ttdue']+')</div>';

    treeHtml += '<div id="tnFilterStatusPending" style="padding-left:'+paddings[1]+';"'+getSelClass('tnFilterStatusPending')+oncev+'><i class="fa fa-hourglass-end icon-purple"></i>'+tid('ticket_status_4')+' ('+_amounts['ttst4']+')</div>';
    treeHtml += getSubStatuses('4','tnFilterStatusPending');

    treeHtml += '<div id="tnFilterStatusClosed" style="padding-left:'+paddings[1]+';"'+getSelClass('tnFilterStatusClosed')+oncev+'><i class="fa fa-check-circle icon-green"></i>'+tid('ticket_status_2')+' ('+_amounts['ttst2']+')</div>';
    treeHtml += getSubStatuses('2','tnFilterStatusClosed');

    treeHtml += '<div id="tnFilterStatusDeleted" style="padding-left:'+paddings[1]+';"'+getSelClass('tnFilterStatusDeleted')+oncev+'><i class="fa fa-remove"></i>'+tid('ticket_status_3')+' ('+_amounts['ttst3']+')</div>';
    treeHtml += getSubStatuses('3','tnFilterStatusDeleted');

    treeHtml += '<div style="padding-left:'+paddings[0]+';cursor:default;"><i class="fa fa-caret-down icon-light"></i>'+tid('my_tickets')+'</div>';
    treeHtml += '<div id="tnFilterMyTickets" style="padding-left:'+paddings[1]+';"'+getSelClass('tnFilterMyTickets')+oncev+'><i class="fa fa-caret-right icon-light"></i>'+tid('my_active_tickets')+' ('+_amounts['ttm']+')</div>';
    treeHtml += '<div id="tnFilterMyGroupsTickets" style="padding-left:'+paddings[1]+';"'+getSelClass('tnFilterMyGroupsTickets')+oncev+'><i class="fa fa-caret-right icon-light"></i>'+lzm_commonTools.SubStr(tid('my_groups_active_tickets'),24,true)+' ('+_amounts['ttmg']+')</div>';
    treeHtml += '<div id="tnFilterWatchList" style="padding-left:'+paddings[1]+';"'+getSelClass('tnFilterWatchList')+oncev+'><i class="fa fa-binoculars"></i>'+tid('watch_list')+' ('+DataEngine.ticketWatchList.length+')</div>';
    treeHtml += '</div>';

    treeHtml += '<div class="ticket-button-panel ticket-add-panel">';

    if(LocalConfiguration.TicketTreeCategory == 'tnFilterStatusActive' && ChatTicketClass.__ProcessNext(true) > 0)
    {
        treeHtml += lzm_inputControls.createButton('process-next-btn', 'add-panel', 'ChatTicketClass.__ProcessNext(false);', tid('next_ticket'), '<i class="fa fa-play-circle"></i>', 'force-text',{},'',30,'d');
        treeHtml += '<br>';
    }

    treeHtml += lzm_inputControls.createButton('ticket-show-emails', 'add-panel-medium', '', t('Emails <!--number_of_emails-->',[['<!--number_of_emails-->', '(' + ChatTicketClass.EmailCount + ')']]), '<i class="fa fa-envelope-o"></i>', 'force-text',{}, '', 30,'d');
    treeHtml += lzm_inputControls.createButton('ticket-reload-emails', 'add-panel-small', '', '&nbsp;', '<i class="fa fa-refresh"></i>', 'force-text',{}, '', 30,'d');
    treeHtml += '<br>';
    treeHtml += lzm_inputControls.createButton('ticket-create-new', 'add-panel', '', tid('create_ticket'), '<i class="fa fa-plus"></i>', 'force-text', {}, '', 30, 'd') + '</span>';

    return treeHtml + '</div></div>';
};

ChatTicketClass.prototype.CreateTicketListLine = function(ticket, lineCounter, inDialog, elementId, fullScreenMode) {
    var that = this, userStyle,i;
    ticket.messages.sort(that.ticketMessageSortfunction);
    userStyle = ' style="cursor: pointer;"';

    var rootMessage = Ticket.GetRootMessage(ticket);

    var ticketDateObject = lzm_chatTimeStamp.getLocalTimeObject(rootMessage.ct * 1000, true);
    var ticketDateHuman = lzm_commonTools.getHumanDate(ticketDateObject, fullScreenMode ? '' : 'mobile', lzm_chatDisplay.userLanguage);
    var ticketLastUpdatedHuman = '-';
    var chatInfo = d(elementId) && elementId.indexOf('e-') === 0;

    if (ticket.u != 0)
    {
        var ticketLastUpdatedObject = lzm_chatTimeStamp.getLocalTimeObject(ticket.u * 1000, true);
        ticketLastUpdatedHuman = lzm_commonTools.getHumanDate(ticketLastUpdatedObject, '', lzm_chatDisplay.userLanguage);
    }
    var waitingTime = lzm_chatTimeStamp.getServerTimeString(null, true) - ticket.w;
    var waitingTimeHuman = '-';

    if (waitingTime < 0)waitingTimeHuman = '-';
    else if (waitingTime > 0 && waitingTime <= 3600)waitingTimeHuman = t('<!--time_amount--> minutes', [['<!--time_amount-->', Math.max(1, Math.floor(waitingTime / 60))]]);
    else if (waitingTime > 3600 && waitingTime <= 86400)waitingTimeHuman = t('<!--time_amount--> hours', [['<!--time_amount-->', Math.floor(waitingTime / 3600)]]);
    else if (waitingTime > 86400)waitingTimeHuman = t('<!--time_amount--> days', [['<!--time_amount-->', Math.floor(waitingTime / 86400)]]);

    var operator = '';
    var groupId = ticket.gr;

    if (d(ticket.editor) && ticket.editor != false)
        operator = (DataEngine.operators.getOperator(ticket.editor.ed) != null) ? DataEngine.operators.getOperator(ticket.editor.ed).name : '';

    var callBack = (rootMessage.cmb == 1) ? t('Yes') : t('No');
    var ticketReadFontWeight = ' font-weight: bold;';
    var ticketReadImage = '<i class="fa fa-envelope"></i>';

    if ((ticket.u <= lzm_chatDisplay.ticketGlobalValues.mr && lzm_commonTools.checkTicketReadStatus(ticket.id, lzm_chatDisplay.ticketUnreadArray) == -1) || lzm_commonTools.checkTicketReadStatus(ticket.id, lzm_chatDisplay.ticketReadArray, lzm_chatDisplay.ticketListTickets) != -1)
    {
        ticketReadImage = '<i class="fa fa-envelope-o"></i>';
        ticketReadFontWeight = '';
    }

    if (ticket.t == 6)
        ticketReadImage = '<i class="fa fa-facebook"></i>';
    else if (ticket.t == 7)
        ticketReadImage = '<i class="fa fa-twitter"></i>';

    var ticketStatusImage = '<i class="fa fa-question-circle" style="color: #5197ff;"></i>';
    var statusText = tid('ticket_status_0'), subStatusText = '';
    if (typeof ticket.editor != 'undefined' && ticket.editor != false) {
        subStatusText = ticket.editor.ss;
        if (ticket.editor.st == 1)
        {
            ticketStatusImage = '<i class="fa fa-gear"></i>';
            statusText = tid('ticket_status_1');
        }
        else if (ticket.editor.st == 2){
            ticketStatusImage = '<i class="fa fa-check-circle icon-green"></i>';
            statusText = tid('ticket_status_2');
        }
        else if (ticket.editor.st == 3){
            ticketStatusImage = '<i class="fa fa-remove icon-red"></i>';
            statusText = tid('ticket_status_3');
        }
        else if (ticket.editor.st == 4){
            ticketStatusImage = '<i class="fa fa-hourglass-end icon-purple"></i>';
            statusText = tid('ticket_status_4');
        }
    }
    var onclickAction = '', ondblclickAction = '', oncontextmenuAction = '';
    if (!fullScreenMode)
        onclickAction = ' onclick="ChatTicketClass.HandleTicketClick(\'' + ticket.id + '\');setTimeout(function(){ChatTicketClass.__ShowTicket(\'' + ticket.id + '\', false, \'\', \'\', \'\', \'' + dialogId + '\');},100);"';
    else
    {
        var dialogId = (!inDialog || !$('#visitor-information').length) ? '' : $('#visitor-information').data('dialog-id');
        if(IFManager.IsMobileOS)
        {
            onclickAction = ' onclick="ChatTicketClass.HandleTicketClick(\'' + ticket.id + '\', false, ' + inDialog + ', \''+elementId+'\',this,event);openTicketContextMenu(event, \'' + ticket.id + '\', ' + inDialog + ', \''+elementId+'\',this);return false;"';
        }
        else
        {
            onclickAction = ' onclick="ChatTicketClass.HandleTicketClick(\'' + ticket.id + '\', false, ' + inDialog + ', \''+elementId+'\',this,event);"';
            oncontextmenuAction = ' oncontextmenu="return openTicketContextMenu(event, \'' + ticket.id + '\', ' + inDialog + ', \''+elementId+'\',this);"';
            ondblclickAction = ' ondblclick="ChatTicketClass.__ShowTicket(\'' + ticket.id + '\', false, \'\', \'\', \'\', \'' + dialogId + '\');"';
        }
    }

    var dueTimeFull = DataEngine.getConfigValue('gl_tidt',false)*3600;
    var dueTimeHalf = DataEngine.getConfigValue('gl_tidt',false)*2700;

    function getPriorityClass(_p){
        return['','','',' bg-orange',' bg-lightred'][_p];
    }
    function getPriorityTextClass(_p){
        return['','','',' text-orange text-bold noibg',' text-red text-bold noibg'][_p];
    }
    function getWaitingTimeClass(_wt) {
        if(_wt > -1 &&_wt > dueTimeFull)
            return ' bg-lightred';
        else if(_wt > -1 &&_wt > dueTimeHalf)
            return ' bg-orange';
        return'';
    }
    function getWaitingTimeTextClass(_wt) {
        if(_wt > -1 &&_wt > dueTimeFull)
            return ' text-red text-bold noibg';
        else if(_wt > -1 &&_wt > dueTimeHalf)
            return ' text-orange text-bold noibg';
        return'';
    }

    var thisTicketSubject = (rootMessage.s.length < 80) ? rootMessage.s : rootMessage.s.substr(0, 77) + '...';
    var columnContents = [{cid: 'last_update', contents: ticketLastUpdatedHuman},
        {cid: 'date', contents: ticketDateHuman},
        {cid: 'waiting_time', class: ' text-center' + getWaitingTimeTextClass(waitingTime), contents: waitingTimeHuman},
        {cid: 'ticket_id', class: ' text-center', contents: ticket.id},
        {cid: 'subject', contents: lzm_commonTools.htmlEntities(thisTicketSubject)},
        {cid: 'operator', contents: operator},
        {cid: 'name', contents: lzm_commonTools.htmlEntities(lzm_commonTools.SubStr(rootMessage.fn,32,true))},
        {cid: 'email', contents: lzm_commonTools.htmlEntities(lzm_commonTools.SubStr(rootMessage.em,32,true))},
        {cid: 'company', contents: lzm_commonTools.htmlEntities(lzm_commonTools.SubStr(rootMessage.co,32,true))},
        {cid: 'group', contents: groupId},
        {cid: 'phone', contents: lzm_commonTools.htmlEntities(lzm_commonTools.SubStr(rootMessage.p,32,true))},
        {cid: 'hash', contents: ticket.h},
        {cid: 'callback', contents: callBack},
        {cid: 'status', contents: statusText},
        {cid: 'sub_status', contents: subStatusText},
        {cid: 'source_type', contents: ChatTicketClass.m_TicketChannels[ticket.t].title},
        {cid: 'sub_source', contents: ticket.s},
        {cid: 'messages', class: ' text-center', contents: ticket.messages.length.toString()},
        {cid: 'ip_address', contents: rootMessage.ip},
        {cid: 'language', contents: lzm_commonTools.GetLanguageName(ticket.l)},
        {cid: 'priority', class: ' text-center' + getPriorityTextClass(ticket.p), contents: tid('priority_' + ticket.p.toString())},
        {cid: 'tags', class: ' tag-field', contents: lzm_commonTools.FormatTableTags(ticket.ta)}
    ];

    LocalConfiguration.AddCustomBlock(columnContents);

    var tblCellStyle = ' style="' + ticketReadFontWeight + '"';
    var ticketLineId = (!inDialog) ? 'ticket-list-row-' + ticket.id : 'matching-ticket-list-'+elementId+'-row-' + ticket.id;
    var addClass = '';
    var lineHtml = '<tr data-line-number="' + lineCounter + '" class="ticket-list-row ticket-list-row-' + lineCounter + ' lzm-unselectable" id="' + ticketLineId + '"' + userStyle + onclickAction + ondblclickAction + oncontextmenuAction + '>';

    if(fullScreenMode)
    {
        lineHtml += '<td class="noibg icon-column">' + ticketStatusImage + '</td>';

        if(!chatInfo)
        {
            lineHtml += '<td class="noibg icon-column">' + ticketReadImage + '</td>';
            lineHtml += '<td class="noibg icon-column">' + this.getDirectionImage(true,ticket.messages[ticket.messages.length-1],'') + '</td>';
        }
    }
    else
    {
        lineHtml += '<td class="icon-column icon-column-mobile">' + ticketStatusImage;
        lineHtml += '<br>' + ticketReadImage;
        lineHtml += '<br>' + this.getDirectionImage(true,ticket.messages[ticket.messages.length-1],'') + '</td>';
    }

    if(fullScreenMode)
    {
        for (i=0; i<LocalConfiguration.TableColumns.ticket.length; i++)
            for (var j=0; j<columnContents.length; j++)
                if(!chatInfo || LocalConfiguration.TableColumns.ticket[i].displayChatInfo == 1)
                    if (LocalConfiguration.TableColumns.ticket[i].cid == columnContents[j].cid && LocalConfiguration.TableColumns.ticket[i].display == 1)
                    {
                        addClass = '';

                        if(d(columnContents[j].class))
                            addClass += columnContents[j].class;

                        addClass += getWaitingTimeClass(waitingTime);
                        addClass += getPriorityClass(ticket.p);

                        columnContents[j].contents = (columnContents[j].contents != '') ? columnContents[j].contents : '-';

                        if(LocalConfiguration.IsCustom(columnContents[j].cid))
                        {
                            var cindex = parseInt(columnContents[j].cid.replace('c',''));
                            var myCustomInput = DataEngine.inputList.getCustomInput(DataEngine.inputList.idList[cindex]);
                            var inputText = '';
                            var customValue = lzm_commonTools.GetElementByProperty(rootMessage.customInput,'id',myCustomInput.name);
                            if(customValue.length)
                            {
                                inputText = DataEngine.inputList.getReadableValue(myCustomInput,customValue[0].text);
                                inputText = (inputText != '') ? inputText : '-';
                                addClass = getWaitingTimeClass(waitingTime);
                                addClass += getPriorityClass(ticket.p);
                            }
                            else
                                inputText = '-';

                            lineHtml += '<td class="' + lz_global_trim(addClass) + '">' + lzm_commonTools.HighlightSearchKey(lzm_commonTools.htmlEntities(inputText),CommonInputControlsClass.SearchBox.GetQuery()) + '</td>';
                        }
                        else
                            lineHtml += '<td' + tblCellStyle + ' class="' + lz_global_trim(addClass) + '">' + lzm_commonTools.HighlightSearchKey(columnContents[j].contents,CommonInputControlsClass.SearchBox.GetQuery()) + '</td>';

                    }

        if(chatInfo)
            lineHtml += '<td style="width:100%"></td>';
    }
    else
    {
        var svContent = '<div><div class="mobile-name-cell">' + lzm_commonTools.htmlEntities(lzm_commonTools.SubStr(rootMessage.fn,16,true)) + '</div>';
        svContent += '<div class="mobile-date-cell">' + ticketDateHuman + '</div></div>';
        svContent += '<div class="mobile-subject-cell">' + lzm_commonTools.htmlEntities(lzm_commonTools.SubStr(rootMessage.s,32,true)) + '</div>';

        svContent += '<div class="mobile-value-cell">' + lzm_commonTools.htmlEntities(lzm_commonTools.SubStr(ticket.messages[ticket.messages.length-1].mt,100,true)) + '</div>';
        svContent = svContent.replace(/\n/g, " ").replace(/\r/g, " ").replace(/<br>/g, " ");
        lineHtml += '<td' + tblCellStyle + ' class="mobile-simple-cell">' + svContent + '</td>';
    }

    return lineHtml + '</tr>';
};

ChatTicketClass.prototype.CreateMatchingTickets = function(_visitor,elementId) {
    elementId = (typeof elementId != 'undefined') ? elementId : '';
    return '<div id="matching-tickets-'+elementId+'-inner"><table id="matching-tickets-'+elementId+'-table" class="visible-list-table alternating-rows-table lzm-unselectable" style="width: 100%;margin-top:1px;">' + this.CreateMatchingTicketsTableContent(_visitor.ArchivedTickets,elementId) + '</table></div>';
};

ChatTicketClass.prototype.GetTableHeader = function(sortDir, elementId, _clickable){
    var i,header = '<thead><tr onclick="removeTicketContextMenu();">';

    if(this.isFullscreenMode())
    {
        header += '<th>&nbsp;</th><th>&nbsp;</th>';
        header += '<th>&nbsp;</th>';
        for (i=0; i<LocalConfiguration.TableColumns.ticket.length; i++)
        {
            var thisTicketColumn = LocalConfiguration.TableColumns.ticket[i];

                if (thisTicketColumn.display == 1)
                {
                    var cellId = (typeof thisTicketColumn.cell_id != 'undefined') ? ' id="' + thisTicketColumn.cell_id + elementId + '"' : '';
                    var cellClass = (d(thisTicketColumn.cell_class)) ? ' ' + thisTicketColumn.cell_class : '';
                    var cellStyle = (typeof thisTicketColumn.cell_style != 'undefined') ? ' style="position: relative; white-space: nowrap; ' + thisTicketColumn.cell_style + '"' : ' style="position: relative; white-space: nowrap;"';
                    var cellOnclick = (typeof thisTicketColumn.cell_onclick != 'undefined') ? ' onclick="' + thisTicketColumn.cell_onclick + '"' : '';
                    var arrowType = (d(thisTicketColumn.sort_invert)) ? ((sortDir!='ASC')?'up':'down') : ((sortDir=='ASC')?'up':'down');
                    var cellIcon = (d(thisTicketColumn.cell_class) && thisTicketColumn.cell_class.indexOf('ticket-list-sort-column')!=-1) ? '<span class="table-sort-icon"><i class="fa fa-caret-'+arrowType+'"></i></span>' : '';

                    if(!_clickable && thisTicketColumn.cid != 'ticket_id')
                    {
                        cellIcon = '';
                    }

                    var cellRightPadding = (typeof thisTicketColumn.cell_class != 'undefined' && thisTicketColumn.cell_class.indexOf('ticket-list-sort-column')!=-1) ? ' style="padding-right: 25px;"' : '';
                    header += '<th' + cellId + cellStyle + cellOnclick + ' class="ticket_col_header'+cellClass+'"><span' + cellRightPadding + '>' + t(thisTicketColumn.title) + '</span>' + cellIcon + '</th>';
                }
        }
    }
    return header + '</tr></thead>';
};

ChatTicketClass.prototype.CreateMatchingTicketsTableContent = function(tickets, elementId) {
    var that = this, lineCounter = 0, i;
    var tableHtml = '';

    var chatInfo = elementId.indexOf('e-') === 0;

    if(!chatInfo)
        tableHtml = this.GetTableHeader('DESC', elementId, false);

    tableHtml += '<tbody>';
    if(d(tickets) && tickets != null)
        for (i=0; i<tickets.length; i++)
            if (tickets[i].del == 0)
            {
                tableHtml += that.CreateTicketListLine(tickets[i], lineCounter, true, elementId,this.isFullscreenMode());
                lineCounter++;
            }

    tableHtml += '</tbody>';
    return tableHtml;
};

ChatTicketClass.prototype.setTicketDetailEvents = function(_showComments,_showMessages,_showLogs){
    $('#ticket-history-show-comments').change(function(){
        if($('#ticket-history-show-comments').prop('checked'))
            $('.message-comment-line').css('display','');
        else
            $('.message-comment-line').css('display','none');
    });
    $('#ticket-history-show-logs').change(function(){
        if($('#ticket-history-show-logs').prop('checked'))
            $('.message-log-line').css('display','');
        else
            $('.message-log-line').css('display','none');
    });
    $('#ticket-history-show-messages').change(function(){
        if($('#ticket-history-show-messages').prop('checked'))
        {
            $('.message-line').css('display','');
            $('#ticket-history-show-comments').parent().removeClass('ui-disabled');
        }
        else
        {
            $('.message-line').css('display','none');
            $('#ticket-history-show-comments').prop('checked',false);
            $('#ticket-history-show-comments').parent().addClass('ui-disabled');
        }
        $('#ticket-history-show-comments').change();
        $('#ticket-history-show-logs').change();
    });

    if(d(_showComments)){
        $('#ticket-history-show-comments').prop('checked',_showComments);
        $('#ticket-history-show-messages').prop('checked',_showMessages);
        $('#ticket-history-show-logs').prop('checked',_showLogs);
    }
    $('#ticket-history-show-comments').change();
    $('#ticket-history-show-logs').change();
    $('#ticket-history-show-messages').change();
};

ChatTicketClass.prototype.updateTicketDetails = function(_selectedTicket) {

    // new
    if(!d(_selectedTicket.messages))
        return;

    var showMessages = $('#ticket-history-show-messages').prop('checked');
    var showLogs = $('#ticket-history-show-logs').prop('checked');
    var showComments = $('#ticket-history-show-comments').prop('checked');

    var that = this;
    var selectedGroup = DataEngine.groups.getGroup($('#ticket-details-group').val());
    var ticketId = _selectedTicket.id + ' [' + _selectedTicket.h + ']';

    var selectedMessage = ChatTicketClass.GetUIProperty('selected-message-no',_selectedTicket.messages.length-1);
    var selectedMessageTab = ChatTicketClass.GetUIProperty('selected-message-tab-no',0);
    var selectedMessageAttachmentNo = ChatTicketClass.GetUIProperty('selected-attachment-no',-1);

    ChatTicketClass.SetUIProperty('selected-message-no',selectedMessage);
    ChatTicketClass.SelectedMessageNo = parseInt(selectedMessage);

    var message = _selectedTicket.messages[selectedMessage];

    if(!d(message))
    {
        if(selectedMessage == 0)
            return;
        else
            message = _selectedTicket.messages[0];
    }

    var ticketDetails = that.CreateTicketDetails(ticketId, _selectedTicket, {id: 0}, {cid: 0}, null, ' class="ui-disabled"', false, selectedGroup);
    var messageListHtml = that.CreateTicketHistoryTable(_selectedTicket, {id: ''}, selectedMessage, false, {cid: ''});

    $('#ticket-message-list').html('' + messageListHtml).trigger('create');
    $('#ticket-ticket-details').html('' + ticketDetails.html).trigger('create');

    $('#message-line-' + _selectedTicket.id + '_' + selectedMessage).addClass('selected-table-line');
    $('.comment-line-' + _selectedTicket.id  + '_' + selectedMessage).addClass('selected-table-line');
    $('.message-line-spacer-' + _selectedTicket.id + '_' + selectedMessage).addClass('selected-table-line');
    $('.message-line-draft-' + _selectedTicket.id  + '_' + selectedMessage).addClass('selected-table-line');

    this.UpdateMessageHeader(_selectedTicket,message);

    $('#message-details-inner').data('message', message);
    $('#message-details-inner').data('email', {id: ''});
    $('#message-details-inner').data('is-new', false);
    $('#message-details-inner').data('chat', {cid: ''});

    that.createTicketDetailsChangeHandler(_selectedTicket);
    that.setTicketDetailEvents(showComments,showMessages,showLogs);

    if(TaskBarManager.GetWindow(_selectedTicket.Id) != null)
        TaskBarManager.GetWindow(_selectedTicket.Id).Tag = lzm_commonTools.clone(_selectedTicket);

    ChatTicketClass.SwitchDisplayType(ChatTicketClass.GetUIProperty('display-type','TEXT'),true);

    if(selectedMessageTab != 0)
        $('#ticket-message-placeholder-tab-' + selectedMessageTab.toString()).click();

    if(selectedMessageAttachmentNo != -1)
        $('#attachment-line-' + selectedMessageAttachmentNo.toString()).click();

    UIRenderer.resizeTicketDetails();
};

ChatTicketClass.prototype.UpdateMessageHeader = function(_ticket,_selectedMessage){
    var detailsHtml = '';

    if(_selectedMessage != null)
    {
        var fullscreenmode = lzm_chatDisplay.ticketDisplay.isFullscreenMode();

        if(fullscreenmode)
            detailsHtml += ChatTicketClass.GetHTMLSwitch(fullscreenmode,_selectedMessage);

        var operator = DataEngine.operators.getOperator(_selectedMessage.sid);
        if (operator != null)
        {
            if(fullscreenmode)
                detailsHtml += '<div><span>' + tidc('name') + '</span><span>' + operator.name + '</span></div>';
            detailsHtml += '<div><span>' + tidc('sent_to') + '</span><span>' + lzm_commonTools.htmlEntities(_selectedMessage.em) + '</span></div>';
        }
        else
        {
            if(fullscreenmode && _selectedMessage.fn != '')
                detailsHtml += '<div><span>' + tidc('name') + '</span><span>' + lzm_commonTools.htmlEntities(_selectedMessage.fn) + '</span></div>';

            if(_selectedMessage.em!='')
            {
                var key = _ticket.t == 6 || _ticket.t == 7 ? 'ID:' : tidc('email');
                detailsHtml += '<div><span>' + key + '</span><span>' + lzm_commonTools.htmlEntities(_selectedMessage.em) + '</span></div>';
            }
        }

        if(fullscreenmode)
            if(_selectedMessage.s.length)
                detailsHtml += '<div><span>' + tidc('subject') + '</span><span>' + lzm_commonTools.htmlEntities(_selectedMessage.s) + '</span></div>';
    }
    $('#ticket-message-details').html(detailsHtml);
};

ChatTicketClass.prototype.GetTicketWindowTitle = function(_isNew,_ticket,_chat,_feedback){
    var title = tid('ticket');
    var rootMessage = Ticket.GetRootMessage(_ticket);
    if (!_isNew && _ticket != null && d(_ticket.messages) && _ticket.messages.length)
    {
        if (rootMessage.fn != '')
            title = lzm_commonTools.htmlEntities(lzm_commonTools.SubStr(rootMessage.fn,30,true));
         else
            title = _ticket.id;
    }
    else
    {
        title = tid('create_ticket');
        if(_chat != null && d(_chat) && d(_chat.en) && _chat.en.length)
            title += ' (' + lzm_commonTools.htmlEntities(lzm_commonTools.SubStr(_chat.en,30,true)) + ')';
        else if(_chat != null && d(_chat.Visitor) && _chat.Visitor != null && DataEngine.inputList.getInputValueFromVisitor(111,_chat.Visitor,30).length)
            title += ' (' + DataEngine.inputList.getInputValueFromVisitor(111,_chat.Visitor,30) + ')';
        else if(_feedback != null && _feedback.UserData != null && d(_feedback.UserData.f111) && _feedback.UserData.f111.length)
            title += ' (' + lzm_commonTools.htmlEntities(_feedback.UserData.f111) + ')';
    }
    return title;
};

ChatTicketClass.prototype.ShowTicket = function(_ticket, isNew, email, _chat, _feedback){

    ChatTicketClass.LastActiveTicket = _ticket;
    ChatTicketClass.LastDraftSave = 0;

    var that = this, saveClicked = false;
    isNew = (typeof isNew != 'undefined') ? isNew : false;

    lzm_chatDisplay.ticket = _ticket;

    if(!isNew)
    {
        ChatTicketClass.OpenTicketView(_ticket);

        if(TaskBarManager.GetWindow(_ticket.id + '_preview') != null)
        {
            TaskBarManager.GetWindow(_ticket.id + '_preview').Maximize();
            return '';
        }
        else if(TaskBarManager.GetWindow(_ticket.id + '_reply') != null)
        {
            TaskBarManager.GetWindow(_ticket.id + '_reply').Maximize();
            return '';
        }
        else if(TaskBarManager.GetWindow(_ticket.id) != null)
        {
            TaskBarManager.GetWindow(_ticket.id).Maximize();
            return '';
        }
    }

    var parentWindow = TaskBarManager.GetActiveWindow();
    var i,disabledString = (isNew && email.id == '' && _chat.cid == '' && _feedback == null) ? '' : ' class="ui-disabled"';
    var bodyString = '',fullScreenMode = this.isFullscreenMode();
    var selectedGroup = DataEngine.groups.getGroupList()[0];
    var headerString = this.GetTicketWindowTitle(isNew,_ticket,_chat,_feedback);
    var disabledButtonClass = (isNew) ? ' ui-disabled' : '';
    var navLine = '<span style="float: left;">';
    var rootMessage = Ticket.GetRootMessage(_ticket);
    var isSocialMedia = _ticket.t == '6' || _ticket.t == '7';

    if(rootMessage != null && !d(rootMessage.cmb))
        rootMessage.cmb = 0;

    if(!isNew && (rootMessage.cmb == '1' || _ticket.type == '2'))
        navLine += lzm_inputControls.createButton('call-ticket-details', 'ticket-buttons' + disabledButtonClass, '', tid('phone_call'), '<i class="fa fa-phone"></i>', 'lr', {'margin-left': '4px'}, '', 20, 'd');

    if(fullScreenMode && !isSocialMedia)
        navLine += lzm_inputControls.createButton('reply-ticket-details', 'ticket-buttons' + disabledButtonClass, '', tid('ticket_reply'), '<i class="fa fa-mail-reply"></i>', 'lr', {'margin-left': '4px'}, '', 20, 'd');

    navLine += lzm_inputControls.createButton('ticket-actions', 'ticket-buttons' + disabledButtonClass, '', tid('actions'), '<i class="fa fa-wrench"></i>', 'lr', {'margin-left': '4px'}, '', 20, 'd');

    if(!isNew && fullScreenMode && rootMessage.ui.length)
        navLine += lzm_inputControls.createButton('visitor-history', 'ticket-buttons' + disabledButtonClass, 'ChatVisitorClass.ShowVisitorInformation(\''+ rootMessage.ui +'\',6,\'\',\''+_ticket.id+'\');', tid('visitor') + ' ' + tid('history'), '<i class="fa fa-history"></i>', 'lr', {'margin-left': '4px'}, '', 20, 'd');

    navLine+= '</span>';

    navLine += lzm_inputControls.createButton('save-ticket-details', 'ticket-buttons','', t('Ok'), '', 'lr',{'margin-left': '4px'}, '', 5, 'd');
    navLine += lzm_inputControls.createButton('cancel-ticket-details', 'ticket-buttons','', t('Cancel'), '', 'lr',{'margin-left': '4px'}, '', 8, 'd');
    navLine += lzm_inputControls.createButton('apply-ticket-details', 'ticket-buttons' + disabledButtonClass,'', t('Apply'), '', 'lr', {'margin-left': '4px'}, '', 8, 'd');

    var lastMessage = (typeof _ticket.messages != 'undefined') ? _ticket.messages.length - 1 : -1;
    var historyTableHtml = '<div id="ticket-message-list">' + that.CreateTicketHistoryTable(_ticket, email, lastMessage, isNew, _chat) + '</div>';
    var ticketDetailsPH = '<div id="ticket-details-div" class="ticket-panel" onclick="removeTicketMessageContextMenu();"><div id="ticket-details-placeholder"></div></div>';
    var ticketHistoryPH = '<div id="ticket-history-div" class="ticket-panel" onclick="removeTicketMessageContextMenu();"><div id="ticket-history-table-placeholder"></div></div>';
    var ticketMessagePH = '<div id="ticket-message-div" onclick="removeTicketMessageContextMenu();"><div id="ticket-message-placeholder"></div>';

    if(!isNew && !fullScreenMode)
    {
        ticketMessagePH += '<div id="ticket-message-footer">';
        if(!isSocialMedia)
            ticketMessagePH += lzm_inputControls.createButton('reply-ticket-details', 'ticket-buttons' + disabledButtonClass, '', tid('ticket_reply'), '<i class="fa fa-mail-reply"></i>', 'force-text', {'margin-left': '4px'}, '', 20, 'e');
        ticketMessagePH += ChatTicketClass.GetHTMLSwitch(fullScreenMode);
        ticketMessagePH += '</div>';
    }

    ticketMessagePH += '</div>';

    bodyString += ticketDetailsPH;

    if(fullScreenMode || !isNew)
        bodyString += ticketMessagePH;

    if(fullScreenMode && !isNew)
        bodyString += ticketHistoryPH;


    var ticketId = (!isNew && typeof _ticket.id != 'undefined') ? _ticket.id + ' [' + _ticket.h + ']' : '';
    var myDetails = that.CreateTicketDetails(ticketId, _ticket, email, _chat, _feedback, disabledString, isNew, selectedGroup);
    var myMessage = (isNew) ? {} : _ticket.messages[lastMessage];
    var messageDetailsHtml = '';
    var ticketDetailsHtml = '<div id="ticket-ticket-details">' + myDetails.html + '</div>';

    selectedGroup = myDetails.group;

    var menuEntry = (!isNew) ? t('Ticket (<!--ticket_id-->, <!--name-->)',[['<!--ticket_id-->', _ticket.id],['<!--name-->', rootMessage.fn]]) : (email.id == '') ? t('New Ticket') : t('New Ticket (<!--name-->)', [['<!--name-->', email.n]]);
    var attachmentsHtml = '<div dd="ff" id="ticket-attachment-list">' + that.createTicketAttachmentTable(_ticket, email, lastMessage, isNew, 'ticket-message-placeholder-tab-1') + '</div>';
    var reminderHtml = this.getReminderHtml(_ticket);

    var messageHtml = (isNew) ? '' : '<div id="ticket-message-details" class="lzm-dialog-headline5"></div>';
    messageHtml += '<div id="ticket-message-text">';

    if (d(_ticket.messages))
        messageHtml += lzm_commonTools.htmlEntities(_ticket.messages[lastMessage].mt).replace(/\n/g, '<br />');

    if (isNew)
    {
        var newTicketText = '';
        if(email.id != '')
            newTicketText = email.text;
        if(_feedback != null)
        {
            newTicketText = FeedbacksViewer.GetTexts(_feedback);
        }
        if(_chat.cid != '')
        {
            var fromArchive = lzm_commonTools.GetElementByProperty(DataEngine.chatArchive.chats,'cid',_chat.cid);
            if(fromArchive.length && d(fromArchive[0].cplain) && fromArchive[0].cplain.length)
                newTicketText = fromArchive[0].cplain;
            else if(d(_chat.Messages) && _chat.Messages.length)
            {
                var message = '';
                for(var key in _chat.Messages)
                {
                    if(!d(_chat.Messages[key].info_header) && _chat.Messages[key].sen != '0000000' && _chat.Messages[key].w != '1')
                    {
                        if(d(_chat.Messages[key].textOriginal))
                            message = lzm_commonTools.StripTags(_chat.Messages[key].textOriginal) + "\r\n";
                        else
                            message = lzm_commonTools.StripTags(_chat.Messages[key].text) + "\r\n";

                        if(d(_chat.Messages[key].sen) && _chat.Messages[key].sen == _chat.SystemId)
                            message = DataEngine.inputList.getInputValueFromVisitor(111,_chat.Visitor,64,true) +': '+ message;
                        else
                        {
                            var op = DataEngine.operators.getOperator(_chat.Messages[key].sen);
                            if(op != null)
                                message = op.name +': '+ message;
                        }
                        message = '| ' + _chat.Messages[key].date_human + ' ' + _chat.Messages[key].time_human + ' | ' + message;
                        newTicketText += message;
                    }
                }
            }
            else if(d(_chat.s))
                newTicketText = _chat.s;
        }

        if(!d(newTicketText))
            newTicketText = '';

        newTicketText = newTicketText.replace(/(\r\n|\r|\n){2,}/g, '$1\n');
        messageHtml += '<textarea id="ticket-new-input" class="ticket-reply-text">' + lzm_commonTools.htmlEntities(newTicketText) + '</textarea>';
    }

    messageHtml += '</div>';

    var dialogData = {'ticket-id': _ticket.id, 'email-id': email.id, menu: menuEntry};
    var dialogId = '';

    if (email.id == '' && _chat.cid == '')
    {
        dialogId = (isNew) ? lzm_commonTools.guid() : _ticket.id;
        dialogId = lzm_commonDialog.CreateDialogWindow(headerString, bodyString, navLine, 'envelope', 'ticket-details', dialogId, 'cancel-ticket-details', true, dialogData);
        $('#ticket-details-body').data('dialog-id', dialogId);
    }
    else if (email.id == '' && _chat.cid != '')
    {
        dialogId = lzm_commonDialog.CreateDialogWindow(headerString, bodyString, navLine, 'envelope', 'ticket-details', md5(_chat.cid), 'cancel-ticket-details', true, dialogData);
        $('#ticket-details-body').data('dialog-id', dialogId);
    }
    else if(TaskBarManager.GetWindow('email-list') != null)
    {
        TaskBarManager.GetWindow('email-list').ShowInTaskBar = false;
        TaskBarManager.GetWindow('email-list').Minimize();
        dialogId = lzm_commonDialog.CreateDialogWindow(headerString, bodyString, navLine, 'envelope', 'ticket-details', md5(email.id), 'cancel-ticket-details', true, dialogData);
    }

    if(TaskBarManager.WindowExists(dialogId))
        TaskBarManager.GetWindow(dialogId).Tag = lzm_commonTools.clone(_ticket);

    var ticketMessageTabArray = [{name: tid('details'), content: messageHtml},{name: tid('attachments'), content: attachmentsHtml},{name: tid('reminder'), content: reminderHtml}];
    var ticketDetailsTabArray,tagEditor;

    window[dialogId+'-tag-editor'] = new CommonInputControlsClass.TagEditor(dialogId+'-tag-editor',null,true,true,false,true);
    window[dialogId+'-tag-editor'].PermissionsToAdd = 'add_tags';
    window[dialogId+'-tag-editor'].AddTags(_ticket.ta, true);
    window[dialogId+'-tag-editor'].AddTags(DataEngine.getConfigValue('gl_tags',false));

    tagEditor = '<div class="hspaced" style="overflow:visible;">' + window[dialogId+'-tag-editor'].GetHTML() + '</div>';

    if(fullScreenMode)
    {
        ticketDetailsTabArray = [
            {name: tid('ticket_details'), content: messageDetailsHtml + ticketDetailsHtml},
            {name: tid('tags'), content: tagEditor}
        ];

        lzm_inputControls.createTabControl('ticket-details-placeholder', ticketDetailsTabArray, 0);
        lzm_inputControls.createTabControl('ticket-message-placeholder', ticketMessageTabArray, 0);

        if (!isNew)
        {
            var ticketHistoryTabArray = [{name: tid('ticket') + ' ' + tid('history'), content: historyTableHtml}];
            lzm_inputControls.createTabControl('ticket-history-table-placeholder', ticketHistoryTabArray, 0);
        }

        $('#ticket-message-div').addClass('ticket-panel');
        $('#ticket-details-div').addClass('ticket-side-panel');
        $('#ticket-history-div').addClass('ticket-side-panel');
    }
    else
    {
        if (!isNew)
        {
            ticketDetailsTabArray = [
                {name: tid('history'), content: historyTableHtml},
                {name: tid('ticket_details'), content: messageDetailsHtml + ticketDetailsHtml}
            ];
            $('#ticket-message-div').css('display','none');
        }
        else
        {
            ticketDetailsTabArray = [
               {name: tid('ticket_details'), content: messageDetailsHtml + ticketDetailsHtml},
               {name: tid('message'), content: ticketMessagePH}
            ];
        }
        lzm_inputControls.createTabControl('ticket-details-placeholder', ticketDetailsTabArray, 0);
        lzm_inputControls.createTabControl('ticket-message-placeholder', ticketMessageTabArray, 0);
    }

    if(!isNew && fullScreenMode)
        $('#message-line-' + _ticket.id + '_' + (lastMessage)).click();

    $('.ui-collapsible-content').css({'overflow-x': 'auto'});
    that.createTicketDetailsChangeHandler(_ticket);

    $('#message-details-inner').data('message', myMessage);
    $('#message-details-inner').data('email', email);
    $('#message-details-inner').data('is-new', isNew);
    $('#message-details-inner').data('chat', _chat);

    $('#rem-active').change(function() {
        if(!$('#rem-active').prop('checked'))
            $('#rem-settings').addClass('ui-disabled');
        else
            $('#rem-settings').removeClass('ui-disabled');
    });
    $('#rem-active').change();

    this.ActivateAttachmentButtons(_ticket, dialogId, menuEntry);

    $('#remove-attachment').click(function() {
        var resources = $('#ticket-message-placeholder-content-1').data('selected-resources');
        resources = (typeof resources != 'undefined') ? resources : [];
        var tmpResources = [];
        for (var i=0; i<resources.length; i++) {
            if (i != $('#attachment-table').data('selected-attachment')) {
                tmpResources.push(resources[i]);
            }
        }
        $('#ticket-message-placeholder-content-1').data('selected-resources', tmpResources);
        that.updateAttachmentList();
        $('#attachment-table').data('selected-attachment', -1);
        $('#remove-attachment').addClass('ui-disabled');
    });
    $('#ticket-actions').click(function(e) {
        e.stopPropagation();
        if (lzm_chatDisplay.showTicketMessageContextMenu)
        {
            removeTicketMessageContextMenu();
        }
        else
        {
            openTicketMessageContextMenu(e, _ticket.id, '', true);
        }
    });
    $('#call-ticket-details').click(function() {
        var openTicket = lzm_commonTools.clone(_ticket);
        showPhoneCallDialog(openTicket.id, '0', 'ticket');
    });
    $('#reply-ticket-details').click(function() {

        try
        {
            var tags = window[_ticket.id + '-tag-editor'].GetListString(true);
            if(DataEngine.getConfigValue('gl_oftt',false) == 1)
            {
                if(!tags.length)
                {
                    ChatTicketClass.SetTags(_ticket,tags,true);
                    return;
                }
                else if(_ticket.ta != tags)
                {
                    $('#apply-ticket-details').click();
                }
            }

            if(!fullScreenMode)
            {
                $('#ticket-message-div').css('display','none');
                $('#'+_ticket.id+'-body').append($('#ticket-message-div'));
            }

            ChatTicketClass.LastDraftSave = 0;
            var opName = t('another operator'), confirmText = '';
            var openTicket = lzm_commonTools.clone(_ticket);

            for (var i=0; i<lzm_chatDisplay.ticketListTickets.length; i++)
                if (lzm_chatDisplay.ticketListTickets[i].id == _ticket.id)
                    openTicket = lzm_commonTools.clone(lzm_chatDisplay.ticketListTickets[i]);

            openTicket.ta = tags;

            var eop = null;
            if (d(openTicket.editor) && openTicket.editor != false)
            {
                eop = DataEngine.operators.getOperator(openTicket.editor.ed);

                if(eop != null)
                {
                    confirmText = tid('ticket_belongs_someone_else', [['<!--op_name-->', '<b>'+opName+'</b>']]);

                    var le;
                    for(var key in _ticket.logs)
                    {
                        le = _ticket.logs[key];
                        if(le.a == 'LastViewTicket')
                        {
                            if(eop != null && le.o == eop.id)
                            {
                                var messageTime = lzm_chatTimeStamp.getLocalTimeObject(le.ti * 1000, true);
                                var timeHuman = lzm_commonTools.getHumanDate(messageTime, 'all', lzm_chatDisplay.userLanguage);
                                confirmText += '<br><br>' + tid('last_ticket_view', [['<!--opname-->', '<b>'+opName+'</b>'],['<!--date-->', '<b>'+timeHuman+'</b>']]);
                            }
                        }
                    }
                }
            }

            if($.inArray(openTicket.gr,DataEngine.operators.getOperator(lzm_chatDisplay.myId).groups)==-1)
            {
                lzm_commonDialog.createAlertDialog(tid('not_member_of').replace('<!--obj-->',openTicket.gr), [{id: 'ok', name: t('Ok')}]);
                $('#alert-btn-ok').click(function() {
                    lzm_commonDialog.removeAlertDialog();
                });
                return;
            }

            var handleTicketTakeOver = function(){
                if (!d(openTicket.editor) || !openTicket.editor || openTicket.editor.ed == '' || openTicket.editor.ed != lzm_chatDisplay.myId || openTicket.editor.st != 1)
                {
                    var myGroup = openTicket.gr;
                    ChatTicketClass.InitUploadTicketDetails(openTicket, openTicket.t, 1, myGroup, lzm_chatDisplay.myId, openTicket.l);
                    ChatTicketClass.UploadTicketDetails();
                    if (!d(openTicket.editor) || openTicket.editor == false)
                    {
                        var now = lzm_chatTimeStamp.getServerTimeString(null, true);
                        openTicket.editor = {id: openTicket.id, u: now, w: now, st: 0, ti: now, g: myGroup};
                    }
                    openTicket.editor.ed = lzm_chatDisplay.myId;

                }

                if(that.updatedTicket != null && that.updatedTicket.id == _ticket.id)
                    openTicket.l = that.updatedTicket.l;

                that.ShowMessageReply(openTicket, ChatTicketClass.GetUIProperty('selected-message-no',0), selectedGroup, menuEntry);

            };
            if (eop == null || !d(openTicket.editor) || !openTicket.editor || openTicket.editor.ed == '' || openTicket.editor.ed == lzm_chatDisplay.myId)
            {
                handleTicketTakeOver();
            }
            else
            {
                lzm_commonDialog.createAlertDialog(confirmText, [{id: 'ok', name: t('Ok')}, {id: 'cancel', name: t('Cancel')}]);
                $('#alert-btn-ok').click(function() {
                    ChatTicketClass.LastTicketTake = lzm_chatTimeStamp.getServerTimeString();
                    if (that.checkTicketTakeOverReply()) {
                        handleTicketTakeOver();
                        lzm_commonDialog.removeAlertDialog();
                    }
                });
                $('#alert-btn-cancel').click(function() {
                    lzm_commonDialog.removeAlertDialog();
                });
            }
        }
        catch(ex)
        {
            deblog(ex);
        }
    });
    $('#apply-ticket-details').click(function() {

        var tags = window[dialogId + '-tag-editor'].GetListString(true);
        that.SaveTicket(_ticket, isNew, email, _chat, null, tags);
    });
    $('#save-ticket-details').click(function() {

        var tags = window[dialogId + '-tag-editor'].GetListString(true);
        saveClicked = true;
        that.SaveTicket(_ticket, isNew, email, _chat, _feedback, tags);
        $('#cancel-ticket-details').click();
    });
    $('#cancel-ticket-details').click(function() {

        if(TaskBarManager.WindowExists(_ticket.id + '_reply',false))
        {
            $('#reply-ticket-details').click();
            return;
        }

        if (email.id != '' && TaskBarManager.GetWindow('email-list') != null)
        {
            TaskBarManager.RemoveWindowByDialogId(md5(email.id));
            TaskBarManager.GetWindow('email-list').ShowInTaskBar = true;
            TaskBarManager.GetWindow('email-list').Maximize();

            if (!saveClicked)
            {
                setTimeout(function() {
                    $('#reset-emails').click();
                }, 50);
            }
            ChatTicketClass.ScrollToEmail(that.selectedEmailNo);
        }
        else if (_chat.cid != '')
        {
            TaskBarManager.RemoveActiveWindow();
            if(parentWindow != null)
                parentWindow.Maximize();
        }
        else
        {
            TaskBarManager.RemoveActiveWindow();
            if(parentWindow != null)
                parentWindow.Maximize();
        }
        lzm_chatDisplay.ticketOpenMessages = [];
        that.updatedTicket = null;

    });
    $('.ticket-message-placeholder-tab').click(function(){
        ChatTicketClass.SetUIProperty('selected-message-tab-no',$(this).data('tab-no'));
        UIRenderer.resizeTicketDetails();
    });

    that.setTicketDetailEvents();
    UIRenderer.resizeTicketDetails();

    if(!fullScreenMode)
    {

    }
    else if(isNew && !IFManager.IsMobileOS)
    {
        $('#ticket-new-input').focus();
    }

    return dialogId;
};

ChatTicketClass.prototype.ActivateAttachmentButtons = function(_ticket, _dialogId, _menuEntry){
    if(IFManager.IsDesktopApp() && d(IFManager.DeviceInterface.hasModule) && IFManager.DeviceInterface.hasModule('lz-screenshot-widget'))
        $('#ticket-reply-add-attachment-context-menu-button').click(function(event){
            var cm = {
                id: 'ticket-reply-add-attachment-context-menu',
                onClickFunction: ticketReplyAddAttachmentContextMenu,
                entries: [
                    {
                        label: tid('file'),
                        value: {myDialogId: _dialogId, ticket:{id:_ticket.id}, menuEntry:_menuEntry}
                    },
                    {
                        label: tid('screenshot'),
                        value: {tab:'ticket-reply', id:{myDialogId: _dialogId, ticket:{id:_ticket.id}, menuEntry:_menuEntry}}
                    }
                ]
            };
            if(ContextMenuClass.BuildMenu(event, cm))
                event.stopPropagation();
        });
    else
        $('#add-attachment').click(function(){
            ticketReplyAddAttachmentContextMenu({myDialogId: _dialogId, ticket:{id:_ticket.id}, menuEntry:_menuEntry});
        });

    $('#add-attachment-from-qrd').click(function() {

        KnowledgebaseUI.InitSelectionMode(TaskBarManager.GetActiveWindow(),'TICKET_ADD_ATTACHMENT');

    });
};

ChatTicketClass.prototype.SaveTicket = function(_ticket, _isNew, _email, _chat, _feedback, _tags){
    var mp,that=this,myCustomInput,
        myStatus = $('#ticket-details-status').val(),
        myOperator = $('#ticket-details-editor').val(),
        myGroup = $('#ticket-details-group').val();

    var ___initSave = function(_mc)
    {
        ChatTicketClass.InitUploadTicketDetails(_ticket,
            $('#ticket-details-channel').val(),
            $('#ticket-details-status').val(),
            $('#ticket-details-group').val(),
            $('#ticket-details-editor').val(),
            $('#ticket-details-language').val(),
            $('#ticket-new-name').val(),
            $('#ticket-new-email').val(),
            $('#ticket-new-company').val(),
            $('#ticket-new-phone').val(),
            $('#ticket-new-input').val(),
            attachments,
            '',
            customFields,
            $('#ticket-details-sub-status').val(),
            $('#ticket-details-sub-channel').val(),
            _chat,
            _mc,
            $('#ticket-new-subject').val(),
            rem_time,
            rem_status,
            $('#ticket-details-priority').val(),
            _feedback,
            _tags,
            $('#ticket-new-autoresponder').prop('checked') ? 1 : 0);
    };

    if ((mp=that.MissingTicketDetailsChangePermission(_ticket, {status: myStatus, editor: myOperator, group: myGroup})) !== false)
    {
        showNoPermissionMessage(mp);
        this.updatedTicket = null;
    }
    else
    {
        for (var i=0; i<DataEngine.tickets.length; i++)
            if (DataEngine.tickets[i].id == _ticket.id)
                if(d(DataEngine.tickets[i].LocalEdited))
                    _ticket = lzm_commonTools.clone(DataEngine.tickets[i]);

        var rootMessage = Ticket.GetRootMessage(_ticket);
        var rem_time = 0, rem_status = 2;

        if($('#rem-active').prop('checked'))
        {
            try
            {
                rem_status = $("#ticket-reminder input[type='radio']:checked").val();
                var remDate = new Date($('#rem-date-year').val(),parseInt($('#rem-date-month').val())-1,$('#rem-date-day').val(),$('#rem-date-hour').val(),$('#rem-date-minute').val(),0,0);
                rem_time = parseInt((remDate.getTime()/1000) + parseInt(lzm_chatTimeStamp.timeDifference));

                if(isNaN(rem_time))
                    rem_time = 0;
            }
            catch(ex) {rem_time = 0;}
        }

        if(d(_ticket.id) && $('#ticket-details-priority').prop('selectedIndex').toString() != _ticket.p)
            setTicketPriority(_ticket.id,$('#ticket-details-priority').prop('selectedIndex').toString());

        var attachments, customFields = {};

        if (_email.id == '' && _chat.cid == '' && _feedback == null)
        {
            // blank ticket or edit ticket
            var mc = '';
            if (d(_ticket.LocalEdited))
            {
                var changedMessage = rootMessage;
                mc = {
                    tid: _ticket.id,
                    mid: _ticket.id,
                    n: changedMessage.fn,
                    e: changedMessage.em.replace(/;/g,','),
                    ecc: changedMessage.ecc.replace(/;/g,','),
                    ebcc: changedMessage.ebcc.replace(/;/g,','),
                    c: changedMessage.co,
                    p: changedMessage.p,
                    s: changedMessage.s,
                    t: changedMessage.mt,
                    custom:[]
                };

                for (i=0; i<DataEngine.inputList.idList.length; i++)
                {
                    myCustomInput = DataEngine.inputList.getCustomInput(DataEngine.inputList.idList[i]);
                    if (myCustomInput.active == 1)
                    {
                        var val = lzm_commonTools.GetElementByProperty(changedMessage.customInput,'id',myCustomInput.name);
                        if(val.length)
                            mc.custom.push({id: DataEngine.inputList.idList[i], value:val[0].text});
                    }
                }
            }
            attachments = $('#ticket-message-placeholder-content-1').data('selected-resources');
            attachments = (typeof attachments != 'undefined') ? attachments : [];
            customFields = that.readCustomFields();

            ___initSave(mc);
            ChatTicketClass.UploadTicketDetails(_isNew ? 'new-ticket' : 'save-details',{cid: ''});
        }
        else if (_chat.cid != '' || _feedback != null)
        {
            // ticket from chat OR feedback
            attachments = $('#ticket-message-placeholder-content-1').data('selected-resources');
            attachments = (typeof attachments != 'undefined') ? attachments : [];
            customFields = that.readCustomFields();

            ___initSave('');
            ChatTicketClass.UploadTicketDetails(_isNew ? 'new-ticket' : 'save-details', _chat, _feedback);
        }
        else
        {
            // ticket from email
            customFields = that.readCustomFields();

            lzm_chatDisplay.ticketsFromEmails.push({'email-id': _email.id, ticket: _ticket,
                channel: $('#ticket-details-channel').val(),
                status: $('#ticket-details-status').val(),
                group: $('#ticket-details-group').val(),
                editor: $('#ticket-details-editor').val(),
                language: $('#ticket-details-language').val(),
                name: $('#ticket-new-name').val(),
                email: $('#ticket-new-email').val(),
                company: $('#ticket-new-company').val(),
                phone: $('#ticket-new-phone').val(),
                message: $('#ticket-new-input').val(),
                subject: $('#ticket-new-subject').val(),
                attachment: _email.attachment,
                comment: '',
                custom: customFields,
                tags: _tags});

            setTimeout(function(){
                var selLine = false;
                $('.email-list-line').each(function(i, obj) {

                    if(selLine==null)
                        return;

                    if($(obj).hasClass('selected-table-line')){
                        selLine = true;
                    }
                    else if(selLine==true)
                    {
                        selLine = null;
                        $(obj).click();
                        return;
                    }
                });
            },200);
        }
    }
};

ChatTicketClass.prototype.readCustomFields = function(){
    var customFields = {},myCustomInput  = null;
    for (var i=0; i<DataEngine.inputList.idList.length; i++) {
        myCustomInput = DataEngine.inputList.getCustomInput(DataEngine.inputList.idList[i]);
        if (myCustomInput.active == 1 && parseInt(myCustomInput.id) < 111)
            customFields[myCustomInput.id] = DataEngine.inputList.getControlValue(myCustomInput,'ticket-new-cf' + myCustomInput.id);
    }
    return customFields;
};

ChatTicketClass.prototype.getReminderHtml = function(ticket){

    var status = '1';
    var span = lzm_commonStorage.loadValue('ticket_reminder_span_' + DataEngine.myId);
    
    if(span == null)
        span = 604800;

    var suggDate = lz_global_timestamp()+span;
    var date = new Date(suggDate*1000);

    if(typeof ticket.AutoStatusUpdateTime != 'undefined' /*&& ticket.AutoStatusUpdateTime > lz_global_timestamp()*/){
        date = new Date(ticket.AutoStatusUpdateTime*1000);
        status = ticket.AutoStatusUpdateStatus;
    }

    return '<div id="ticket-reminder" class="lzm-fieldset">' +
        '<div class="top-space">'+lzm_inputControls.createCheckbox('rem-active',tidc('reminder_active'),typeof ticket.AutoStatusUpdateTime != 'undefined')+'</div>'+
        '<div class="left-space" id="rem-settings">' +
        '<div class="top-space-half">'+lzm_inputControls.createRadio('rem-status_0','','rem-status',tid('ticket_status_0'),status=='0','0')+'</div>'+
        '<div>'+lzm_inputControls.createRadio('rem-status_1','','rem-status',tid('ticket_status_1'),status=='1','1')+'</div>'+
        '<div>'+lzm_inputControls.createRadio('rem-status_2','','rem-status',tid('ticket_status_2'),status=='2','2')+'</div>'+
        '<div>'+lzm_inputControls.createRadio('rem-status_4','','rem-status',tid('ticket_status_4'),status=='4','4')+'</div>'+
        '<div>'+lzm_inputControls.createRadio('rem-status_3','','rem-status',tid('ticket_status_3'),status=='3','3')+'</div>'+
        '<div class="top-space"><span class="left-space">' + lzm_inputControls.createInput('rem-date-day','',date.getDate(),tidc('day'),'','number','')+
        '</span><span class="left-space">' + lzm_inputControls.createInput('rem-date-month','',date.getMonth()+1,tidc('month'),'','number','')+
        '</span><span class="left-space">' + lzm_inputControls.createInput('rem-date-year','',date.getFullYear(),tidc('year'),'','number','')+
        '</span><span class="left-space">' +lzm_inputControls.createInput('rem-date-hour','',date.getHours(),tidc('hour'),'','number','')+
        '</span><span class="left-space">' + lzm_inputControls.createInput('rem-date-minute','',date.getMinutes(),tidc('minute'),'','number','')+
        '</span></div><br>' +
        '</div></div>';
};

ChatTicketClass.prototype.isFullscreenMode = function(){
    return (lzm_chatDisplay.windowHeight > 400 && lzm_chatDisplay.windowWidth > 600);
};

ChatTicketClass.prototype.updateAttachmentList = function() {
    var myDownloadLink,tableString = '';
    var resources1 = $('#reply-placeholder-content-1').data('selected-resources');
    var resources2 = $('#ticket-message-placeholder-content-1').data('selected-resources');
    var resources = (typeof resources1 != 'undefined') ? resources1 : (typeof resources2 != 'undefined') ? resources2 : [];

    for (var i=0; i<resources.length; i++)
    {
        myDownloadLink = getQrdDownloadUrl({rid: resources[i].rid, ti: resources[i].ti});
        var fileTypeIcon = lzm_chatDisplay.resourcesDisplay.getFileTypeIcon(resources[i].ti);
        tableString += '<tr id="attachment-line-' + i + '" class="attachment-line" style="cursor:pointer;" onclick="ChatTicketClass.HandleTicketAttachmentClick(' + i + ');">';
        tableString += '<td class="icon-column">' + fileTypeIcon + '</td><td style="text-decoration: underline; white-space: nowrap; cursor: pointer;">';
        tableString += '<a href="#" class="lz_chat_link_no_icon" onclick="downloadFile(\'' + myDownloadLink + '\')">' + lzm_commonTools.htmlEntities(resources[i].ti) + '</a>';
        tableString += '</td><td></td></tr>';
    }
    $('#attachment-table').children('tbody').html(tableString);
};

ChatTicketClass.prototype.CreateTicketDetails = function(ticketId, ticket, _email, chat, _feedback, disabledString, isNew, selectedGroup) {

    var i,selectedLanguage = '', availableLanguages = [], disabledClass;

    // MESSAGE DETAILS
    chat = (d(chat)) ? chat : {cid: ''};

    var editCustom,myCustomInput,myInputText,myInputField,j;
    var detailsHtml = '<table id="ticket-details-inner" class="visible-list-table alternating-rows-table">';
    if (isNew)
    {
        detailsHtml += '<tr><th>' + tidc('ticket_id') + '</th><td id="ticket-details-id" colspan="4">' + tid('new') + '</td></tr>';
        var newTicketName = '',newTicketEmail = '',newTicketCompany = '',newTicketPhone = '';

        if(_email.id != '')
        {
            newTicketName = _email.n;
            newTicketEmail = _email.e;
            newTicketCompany = '';
            newTicketPhone = '';
        }
        else if(chat.cid != '' && chat.Visitor)
        {
            newTicketName = DataEngine.inputList.getInputValueFromVisitor(111,chat.Visitor,64,true);//VisitorManager.GetVisitorName(chat.Visitor);
            newTicketEmail = DataEngine.inputList.getInputValueFromVisitor(112,chat.Visitor);
            newTicketCompany = DataEngine.inputList.getInputValueFromVisitor(113,chat.Visitor);
            newTicketPhone = DataEngine.inputList.getInputValueFromVisitor(116,chat.Visitor);
        }
        else if(_feedback != null)
        {
            newTicketName = _feedback.UserData.f111;
            newTicketEmail = _feedback.UserData.f112;
            newTicketCompany = _feedback.UserData.f113;
            newTicketPhone = _feedback.UserData.f116;
        }
        else if(d(chat.en))
        {
            newTicketName = chat.en;
            newTicketEmail = chat.em;
            newTicketCompany = chat.co;
            newTicketPhone = chat.cp;
        }

        detailsHtml += '<tr><th>' + tidc('name') + '</th><td class="sub" colspan="4"><input type="text" id="ticket-new-name" value="' + lzm_commonTools.htmlEntities(newTicketName) + '" /></td></tr>';

        // din't escape here but above if needed
        detailsHtml += '<tr><th>' + tidc('email') + '</th><td class="sub" colspan="4"><input type="text" id="ticket-new-email" value="' + newTicketEmail + '" /></td></tr>';

        detailsHtml += '<tr><th>' + tidc('company') + '</th><td class="sub" colspan="4"><input type="text" id="ticket-new-company" value="' + lzm_commonTools.htmlEntities(newTicketCompany) + '" /></td></tr>';
        detailsHtml += '<tr><th>' + tidc('phone') + '</th><td class="sub" colspan="4"><input type="text" id="ticket-new-phone" value="' + lzm_commonTools.htmlEntities(newTicketPhone) + '" /></td></tr>';

        var newTicketSubject = '';

        if(typeof _email != 'undefined' && typeof _email.s != 'undefined' && _email.s != '')
            newTicketSubject = _email.s;

        if(d(chat) && d(chat.s))
        {
            if(chat.s != '')
                newTicketSubject = lzm_commonTools.SubStr(chat.s,32,true);
            else if(d(chat.Messages) && chat.Messages.length > 1)
                newTicketSubject = lzm_commonTools.SubStr(chat.Messages[1].text,32,true);
        }

        newTicketSubject = lzm_commonTools.htmlEntities(newTicketSubject);

        detailsHtml += '<tr><th>' + tidc('subject') + '</th><td class="sub" colspan="4"><input type="text" id="ticket-new-subject" value="' + newTicketSubject + '" /></td></tr>';

        for (i=0; i<DataEngine.inputList.idList.length; i++)
        {
            myCustomInput = DataEngine.inputList.getCustomInput(DataEngine.inputList.idList[i]);
            var selectedValue = '';

            if(_email.id != '')
            {
                selectedValue = '';
            }
            else if(chat.cid != '' && chat.Visitor)
            {
                selectedValue = DataEngine.inputList.getInputValueFromVisitor(DataEngine.inputList.idList[i],chat.Visitor);
            }
            else if(d(chat.cc) && d(chat.cc[i]))
            {
                selectedValue = chat.cc[i].text;
            }

            if (myCustomInput.type == 'ComboBox')
            {
                myInputField = '<select class="lzm-select" id="ticket-new-cf' + myCustomInput.id + '">';
                for (j=0; j<myCustomInput.value.length; j++)
                {
                    var selectedString = (selectedValue == myCustomInput.value[j]) ? ' selected="selected"' : '';
                    myInputField += '<option value="' + j + '"' + selectedString + '>' + myCustomInput.value[j] + '</option>';
                }
                myInputField +='</select>';
            }
            else if (myCustomInput.type == 'CheckBox')
            {
                var checkedString = (selectedValue.toString() == '1' || selectedValue == tid('yes')) ? ' checked="checked"' : '';
                myInputText = myCustomInput.value;
                myInputField = '<input type="checkbox" class="checkbox-custom" id="ticket-new-cf' + myCustomInput.id + '" style="min-width: 0px; width: auto;" value="' + myInputText + '"' + checkedString + ' /><label for="ticket-new-cf' + myCustomInput.id + '" class="checkbox-custom-label"></label>';
            }
            else
            {
                // don't escape here but above
                myInputText = selectedValue;
                myInputField = DataEngine.inputList.getControlHTML(myCustomInput,'ticket-new-cf' + myCustomInput.id,'',myInputText,false);
            }

            if (myCustomInput.active == 1 && parseInt(myCustomInput.id) < 111)
                detailsHtml += '<tr><th>' + myCustomInput.name + ':</th><td class="sub" colspan="4">' + myInputField + '</td></tr>';
        }
    }

    function ___CreateEmailElements(_val){
        var html='',list = _val.replace(/;/g,',').split(',');
        if(list.length)
            for(var key in list)
            {
                if(list[key].length)
                    html+= '<span class="enum-element">' + lzm_commonTools.htmlEntities(list[key]) + '</span>';
            }
        return html;
    }

    if(d(ticket.messages) && ticket.messages.length)
    {
        detailsHtml += '<tr><th>' + tidc('ticket_id') + '</th><td id="ticket-details-id" colspan="4">' + ticketId + '</td></tr>';

        var rootMessage = Ticket.GetRootMessage(ticket);

        detailsHtml += '<tr><th>' + tidc('name') + '</th><td id="saved-message-name" colspan="3">' + lzm_commonTools.htmlEntities(rootMessage.fn) + '</td><td class="edit"><i class="fa icon-blue fa-pencil lzm-clickable2" onclick="ChatTicketClass.EditTicketField(\''+ticket.id+'\',111);"></i></td></tr>';

        var recFieldName = (ticket.t < 6) ? tidc('email') : tidc('ticket_receiver');
        var edEmail = (ticket.t < 6) ? '<i class="fa icon-blue  fa-pencil lzm-clickable2" onclick="ChatTicketClass.EditTicketField(\''+ticket.id+'\',112);"></i>' : '';
        detailsHtml += '<tr><th>' + recFieldName + '</th><td id="saved-message-email" colspan="3">' + ___CreateEmailElements(rootMessage.em) + '</td><td class="edit">' + edEmail + '</td></tr>';

        if(ticket.t < 6)
        {
            detailsHtml += '<tr><th>' + tid('email') + ' CC:</th><td id="saved-message-email-cc" colspan="3">' + ___CreateEmailElements(rootMessage.ecc) + '</td><td class="edit"><i class="fa icon-blue  fa-pencil lzm-clickable2" onclick="ChatTicketClass.EditTicketField(\''+ticket.id+'\',112);"></i></td></tr>';
            detailsHtml += '<tr><th>' + tid('email') + ' BCC:</th><td id="saved-message-email-bcc" colspan="3">' + ___CreateEmailElements(rootMessage.ebcc) + '</td><td class="edit"><i class="fa icon-blue  fa-pencil lzm-clickable2" onclick="ChatTicketClass.EditTicketField(\''+ticket.id+'\',112);"></i></td></tr>';
        }

        detailsHtml += '<tr><th>' + tidc('company') + '</th><td id="saved-message-company" colspan="3">' + lzm_commonTools.MakeLink(rootMessage.co,true) + '</td><td class="edit"><i class="fa icon-blue fa-pencil lzm-clickable2" onclick="ChatTicketClass.EditTicketField(\''+ticket.id+'\',113);"></i></td></tr>';
        detailsHtml += '<tr><th>' + tidc('phone') + '</th><td id="saved-message-phone" colspan="3"><a href="#" onclick="showPhoneCallDialog(\'' + ticket.id + '\', 0, \'ticket\');">' + lzm_commonTools.MakeLink(rootMessage.p,true) + '</a></td><td class="edit"><i class="fa icon-blue fa-pencil lzm-clickable2" onclick="ChatTicketClass.EditTicketField(\''+ticket.id+'\',116);"></i></td></tr>';

        var isUrl = d(rootMessage.s) && rootMessage.s.toLowerCase().startsWith('http');

        var subject = lzm_commonTools.MakeLink(rootMessage.s,true);
        var subjectLabel = (isUrl) ? tidc('url') : tidc('subject');

        detailsHtml += '<tr><td colspan="5" class="vspace"><hr></td></tr>';

        detailsHtml += '<tr><th>' + subjectLabel + '</th><td id="saved-message-subject" colspan="3">' + subject + '</td><td class="edit"><i class="fa icon-blue fa-pencil lzm-clickable2" onclick="ChatTicketClass.EditTicketField(\''+ticket.id+'\',\'subject\');"></i></td></tr>';

        var customhtml = '';
        for (i=0; i<DataEngine.inputList.idList.length; i++)
        {
            myCustomInput = DataEngine.inputList.getCustomInput(DataEngine.inputList.idList[i]);
            myInputText = '';

            if (myCustomInput.active == 1 && rootMessage.customInput.length > 0)
            {
                for (j=0; j<rootMessage.customInput.length; j++)
                {
                    if (rootMessage.customInput[j].id == myCustomInput.name)
                    {
                        myInputText = DataEngine.inputList.getReadableValue(myCustomInput,rootMessage.customInput[j].text,rootMessage.attachment);
                    }
                }
                if (myCustomInput.active == 1 && parseInt(myCustomInput.id) < 111)
                {
                    editCustom = this.createEditButton(ticket, myCustomInput.id);

                    if(myCustomInput.type == 'File')
                        editCustom = '';

                    customhtml += '<tr><th>' + myCustomInput.name + ':</th><td colspan="3">' + lzm_commonTools.MakeLink(myInputText,myCustomInput.type != 'File') + '</td><td class="edit">'+editCustom+'</td></tr>';
                }
            }
            else if (myCustomInput.active == 1 && rootMessage.customInput.length == 0)
            {
                if (myCustomInput.active == 1 && parseInt(myCustomInput.id) < 111)
                {
                    editCustom = this.createEditButton(ticket, myCustomInput.id);
                    if(myCustomInput.type == 'File')
                        editCustom = '';

                    customhtml += '<tr><th>' + myCustomInput.name + ':</th><td colspan="3">-</td><td class="edit">'+editCustom+'</td></tr>';
                }
            }
        }

        if(customhtml.length)
        {
            detailsHtml += '<tr><td colspan="5" class="vspace"><hr></td></tr>';
            detailsHtml += customhtml;
        }

        if(rootMessage.cmb=='1')
            detailsHtml += lzm_inputControls.createInfoField('fa fa-phone icon-large icon-blue',tid('phone_outbound'),'');
    }

    detailsHtml += '<tr><td colspan="5" class="vspace"><hr></td></tr>';

    // CHANNEL
    disabledString = (ticket.t == 6 || ticket.t == 7 || !isNew) ? ' ui-disabled' : '';
    detailsHtml += '<tr><th>' + tidc('source') + '</th><td colspan="4" class="sub"><select id="ticket-details-channel" class="lzm-select' + disabledString + '">';

    for (var aChannel=0; aChannel<ChatTicketClass.m_TicketChannels.length; aChannel++)
    {
        var channel = ChatTicketClass.m_TicketChannels[aChannel];

        selectedString = (channel.index == ticket.t || (_email.id != '' && channel.key == 'email') || (_feedback != null && channel.key == 'feedback')) ? ' selected="selected"' : (chat.cid != '' && channel.index == 4) ? ' selected="selected"' : '';

        if (!isNew || channel.index < 6)
            detailsHtml += '<option' + selectedString + ' value="' + channel.index + '">' + channel.title + '</option>';
    }
    detailsHtml += '</select></td></tr>';

    //SUBCHANNEL
    disabledClass = DataEngine.global_configuration.database['tsd'].length ? '' : ' style="display:none"';
    detailsHtml += '<tr'+disabledClass+'><th>' + tidc('sub_source') + '</th><td colspan="4" class="sub"><select id="ticket-details-sub-channel" class="lzm-select"></select>';

    // STATUS
    detailsHtml += '</td></tr><tr><th>' + tid('ticket_status') + '</th>';

    disabledClass = (PermissionEngine.checkUserPermissions('', 'tickets', 'change_ticket_status', {})) ? '' : ' class="ui-disabled"';
    detailsHtml += '<td colspan="4" class="sub"><select id="ticket-details-status" class="lzm-select"' + disabledClass + '>';

    var states = [
        {state:0,text:tid('ticket_status_0')},
        {state:1,text:tid('ticket_status_1')},
        {state:4,text:tid('ticket_status_4')},
        {state:2,text:tid('ticket_status_2')},
        {state:3,text:tid('ticket_status_3')}
    ];

    for (var key in states)
    {
        var stateObj = states[key];
        selectedString = (typeof ticket.editor != 'undefined' && ticket.editor != false && stateObj.state == ticket.editor.st) ? ' selected="selected"' : '';
        detailsHtml += '<option' + selectedString + ' value="' + stateObj.state + '">' + stateObj.text + '</option>';
    }
    detailsHtml += '</select></td></tr>';

    // SUBSTATUS
    disabledClass = DataEngine.global_configuration.database['tsd'].length ? '' : ' style="display:none"';
    detailsHtml += '<tr'+disabledClass+'><th>' + tidc('sub_status') + '</th><td colspan="4" class="sub"><select id="ticket-details-sub-status" class="lzm-select"' + disabledClass + '>';

    // GROUP
    detailsHtml += '</select></td></tr><tr><th>' + tidc('group') + '</th>';
    disabledClass = (PermissionEngine.checkUserPermissions('', 'tickets', 'assign_groups', {})) ? '' : ' class="ui-disabled"';
    detailsHtml += '<td colspan="4" class="sub"><select id="ticket-details-group" class="lzm-select"' + disabledClass + '>';

    var preSelectedGroup = '';
    if (_email.id != '')
        preSelectedGroup = _email.g;
    else if (chat.cid != '')
        preSelectedGroup = chat.dcg;
    else if (_feedback != null && _feedback.g.length)
        preSelectedGroup = _feedback.g;
    else
        preSelectedGroup = (isNew) ? lzm_chatDisplay.myGroups[0] : '';

    if(d(ticket.id) && this.updatedTicket != null && this.updatedTicket.id == ticket.id)
    {
        ticket.l = this.updatedTicket.l;
        ticket.gr = this.updatedTicket.gr;
    }

    var groups = DataEngine.groups.getGroupList(), langName = '';
    for (i=0; i<groups.length; i++)
    {
        selectedString = '';
        if (typeof ticket.gr != 'undefined' && groups[i].id == ticket.gr)
        {
            selectedString = ' selected="selected"';
            selectedGroup = groups[i];

            if(d(selectedLanguage = groups[i].pm[0]))
                selectedLanguage = groups[i].pm[0].lang;
        }
        else if (groups[i].id == preSelectedGroup)
        {
            selectedString = ' selected="selected"';
            selectedGroup = groups[i];

            if(d(selectedLanguage = groups[i].pm[0]))
                selectedLanguage = groups[i].pm[0].lang;
        }

        detailsHtml += '<option value="' + groups[i].id + '"' + selectedString + '>' + groups[i].id + '</option>';
    }

    // EDITOR
    detailsHtml += '</select></td></tr><tr><th>' + t('Editor:') + '</th>';
    disabledClass = (PermissionEngine.checkUserPermissions('', 'tickets', 'assign_operators', {})) ? '' : ' class="ui-disabled"';
    detailsHtml += '<td colspan="4" class="sub"><select id="ticket-details-editor" class="lzm-select"' + disabledClass + '><option value="-1">' + tid('none') + '</option>';

    if(selectedGroup != null)
    {
        var operators = DataEngine.operators.getOperatorList('name', selectedGroup.id);
        for (i=0; i<operators.length; i++) {
            if (operators[i].isbot != 1)
            {
                selectedString = (typeof ticket.editor != 'undefined' && ticket.editor != false && ticket.editor.ed == operators[i].id) ? ' selected="selected"' : '';
                detailsHtml += '<option' + selectedString + ' value="' + operators[i].id + '">' + operators[i].name + '</option>';
            }
        }
    }

    // LANGUAGE
    detailsHtml += '</select></td></tr><tr><th>' + tidc('language') + '</th><td colspan="4" class="sub"><select id="ticket-details-language" class="lzm-select">';

    for (i=0; i<selectedGroup.pm.length; i++)
    {
        availableLanguages.push(selectedGroup.pm[i].lang);
        selectedString = '';

        if((typeof ticket.l != 'undefined' && selectedGroup.pm[i].lang.toLowerCase() == ticket.l.toLowerCase()) || (_email.id != '' && selectedGroup.pm[i].def == '1') || (!d(ticket.l) && selectedGroup.pm[i].def == '1'))
        {
            selectedString = ' selected="selected"';
            selectedLanguage = selectedGroup.pm[i].lang;
        }

        if(selectedLanguage == '' && selectedGroup.pm[i].lang.toLowerCase() == DataEngine.defaultLanguage.toLowerCase())
        {
            selectedString = ' selected="selected"';
            selectedLanguage = selectedGroup.pm[i].lang;
        }

        langName = lzm_chatDisplay.getLanguageDisplayName(selectedGroup.pm[i].lang);
        detailsHtml += '<option value="' + selectedGroup.pm[i].lang + '"' + selectedString + '>' + langName + '</option>';
    }
    if (typeof ticket.l != 'undefined' && $.inArray(ticket.l, availableLanguages) == -1)
    {
        langName = lzm_commonTools.GetLanguageName(ticket.l);
        detailsHtml += '<option value="' + ticket.l + '" selected="selected">' + langName + '</option>';
        selectedLanguage = ticket.l;
    }
    detailsHtml += '</select></td></tr>';

    //PRIORITY
    detailsHtml += '<tr><th>' + tidc('priority') + '</th><td colspan="4" class="sub"><select id="ticket-details-priority" class="lzm-select">';

    for(i=0;i<5;i++){
        selectedString = (i==ticket.p || (isNew && i==2)) ? ' selected="selected"' : '';
        detailsHtml += '<option value="'+ i.toString()+'"'+selectedString+'>'+tid('priority_'+ i.toString())+'</option>';
    }
    detailsHtml += '</select></td></tr>';

    if(isNew)
    {
        detailsHtml += '<tr><td colspan="5" class="vspace"><hr><br>' + lzm_inputControls.createCheckbox('ticket-new-autoresponder',tid('ticket_auto_email'),false,'') + '</td></tr>';
    }

    detailsHtml += '<tr><th></th><td colspan="4" style="height:auto;background:#fff;"></td></tr></table>';
    return {html: detailsHtml, language: selectedLanguage, group: selectedGroup}
};

ChatTicketClass.prototype.createEditButton = function(ticket, fieldid){
    if(DataEngine.operators.GetFieldMaskLevel(fieldid, 'ticket') > 0)
        return '';
    else
        return '<i class="fa icon-blue fa-pencil lzm-clickable2" onclick="ChatTicketClass.EditTicketField(\''+ticket.id+'\','+fieldid+');"></i>';
};

ChatTicketClass.prototype.createTicketAttachmentTable = function(ticket, email, messageNumber, isNew, tabName) {
    var acount = 0, j, downloadUrl;
    var attachmentsHtml = "", previewHtml = '';

    if(isNew && email.id == '')
    {
        var disabledClass = (ticket.t == 6 || ticket.t == 7) ? 'ui-disabled' : '';
        attachmentsHtml += '<div class="lzm-dialog-headline3"><span style="float:right;">';

        if(IFManager.IsDesktopApp() && d(IFManager.DeviceInterface.hasModule) && IFManager.DeviceInterface.hasModule('lz-screenshot-widget'))
            attachmentsHtml += lzm_inputControls.createButton('ticket-reply-add-attachment-context-menu-button', '', '', t('Add'), '<i class="fa fa-plus"></i>', 'lr',  {'margin-right':'-1px'}, t('Add'), 30, 'e');
        else
            attachmentsHtml += lzm_inputControls.createButton('add-attachment', disabledClass, '', t('Add'), '<i class="fa fa-upload"></i>', 'lr',  {'margin-right':'-1px'}, t('Add Attachment'), -1, 'e');

        attachmentsHtml += lzm_inputControls.createButton('add-attachment-from-qrd', disabledClass, '', t('Add from resource'), '<i class="fa fa-database"></i>', 'lr', {'margin-right':'4px'}, t('Add Attachment from Resource'), 30, 'e');
        attachmentsHtml += lzm_inputControls.createButton('remove-attachment', 'ui-disabled', '', t('Remove'), '<i class="fa fa-remove"></i>', 'lr',  {'margin-right':'4px'}, t('Remove Attachment'), 30, 'e');

        attachmentsHtml += '</span></div>';
    }

    attachmentsHtml += '<table id="attachment-table" class="visible-list-table alternating-rows-table lzm-unselectable"><tbody>';

    if (ticket != null && d(ticket.messages) && typeof ticket.messages[messageNumber] != 'undefined' && typeof ticket.messages[messageNumber].attachment != 'undefined')
    {
        for (j=0; j<ticket.messages[messageNumber].attachment.length; j++)
        {
            acount++;
            downloadUrl = getQrdDownloadUrl({
                ti: lzm_commonTools.htmlEntities(ticket.messages[messageNumber].attachment[j].n),
                rid: ticket.messages[messageNumber].attachment[j].id
            });

            var event = 'ChatTicketClass.HandleTicketAttachmentClick(' + j + ');';
            if(lzm_commonTools.isImageFile(ticket.messages[messageNumber].attachment[j].n))
                event+='ChatTicketClass.PreviewTicketAttachment(\''+downloadUrl+'\');';
            else
                event+='ChatTicketClass.PreviewTicketAttachment(null);';

            attachmentsHtml += '<tr id="attachment-line-' + j + '" class="attachment-line lzm-unselectable" style="cursor:pointer;" onclick="'+event+'">';

            var fileTypeIcon = lzm_chatDisplay.resourcesDisplay.getFileTypeIcon(ticket.messages[messageNumber].attachment[j].n);
            attachmentsHtml += '<td class="icon-column" style="text-align: center;">' + fileTypeIcon + '</td><td';
            attachmentsHtml += ' style="text-decoration: underline; white-space: nowrap; cursor: pointer;" onclick="">';
            attachmentsHtml += lzm_commonTools.htmlEntities(ticket.messages[messageNumber].attachment[j].n);
            attachmentsHtml += '</td><td>';

            if(ticket.messages[messageNumber].attachment[j].n != 'screenshot.lzsc')
                attachmentsHtml += lzm_inputControls.createButton(messageNumber+"-"+j+"dnl",'','downloadFile(\'' + downloadUrl + '\')', '', '<i class="fa fa-cloud-download nic"></i>', 'lr', {float:'right','margin-right':'4px'}, '');
            else
                attachmentsHtml += lzm_inputControls.createButton(messageNumber+"-"+j+"dnl",'','IFManager.IFOpenExternalBrowser(\'' + downloadUrl + '\')', '', '<i class="fa fa-external-link-square nic"></i>', 'lr', {float:'right','margin-right':'4px'}, tid('open'));

            attachmentsHtml += '</td></tr>';
        }

        if(this.isFullscreenMode() && ticket.messages[messageNumber].attachment.length>0)
        {
            previewHtml = '<div class="lzm-dialog-headline5"></div>';
            previewHtml +='<div id="att-img-preview-field"></div>';
        }
    }
    if (email.id != '')
    {
        for (var l=0; l<email.attachment.length; l++)
        {
            downloadUrl = getQrdDownloadUrl({
                ti: lzm_commonTools.htmlEntities(email.attachment[l].n),
                rid: email.attachment[l].id
            });
            attachmentsHtml += '<tr class="lzm-unselectable">' +
                '<td class="icon-column" style="">' + lzm_chatDisplay.resourcesDisplay.getFileTypeIcon(email.attachment[l].n) + '</td><td>' +
                lzm_commonTools.htmlEntities(email.attachment[l].n) +
                '</td><td>' +
                lzm_inputControls.createButton(email.attachment[l].id+"-"+l+"dnl",'','downloadFile(\'' + downloadUrl + '\')', '', '<i class="fa fa-cloud-download nic"></i>', 'lr', {float:'right','margin-right':'4px'}, t('Download')) +
                '</td></tr>';
        }
    }

    attachmentsHtml += '</tbody></table>' + previewHtml;
    if(typeof tabName != 'undefined')
    {
        acount = (acount > 0) ? ' (' + acount + ')' : '';
        $('#'+tabName).html(tid('attachments')+acount);
    }

    return attachmentsHtml;
};

ChatTicketClass.prototype.ShowMessageReply = function(ticket, messageNo, selectedGroup, menuEntry, _preFill) {

    menuEntry = (typeof menuEntry != 'undefined') ? menuEntry : '';
    var that = this;
    var i, j = 0, signatureText = '', answerInline = false, mySig = {};

    messageNo = (messageNo == -1) ? ticket.messages.length -1 : messageNo;
    var messageNoSal = 0;
    var myself = DataEngine.operators.getOperator(lzm_chatDisplay.myId);
    var signatures = [];
    var groups = DataEngine.groups.getGroupList();
    var rDiaId = ticket.id + '_reply';

    if(TaskBarManager.WindowExists(rDiaId,false) && TaskBarManager.GetWindow(ticket.id) != null)
    {
        TaskBarManager.Minimize(ticket.id);
        TaskBarManager.GetWindow(ticket.id).ShowInTaskBar = false;
        TaskBarManager.Maximize(rDiaId);

        if(!IFManager.IsMobileOS)
            ChatTicketClass.TextEditor.focus();
        return;
    }

    for (i=0; i<myself.sig.length; i++)
    {
        mySig = myself.sig[i];
        mySig.priority = 4;
        if (myself.sig[i].d == 1) {
            mySig.priority = 5;
        }
        signatures.push(mySig);
    }

    for (i=0; i<groups.length; i++)
    {
        if ($.inArray(groups[i].id, myself.groups) != -1)
        {
            for (j=0; j<groups[i].sig.length; j++) {
                mySig =  groups[i].sig[j];
                mySig.priority = 0;
                if (groups[i].sig[j].d == 1 && groups[i].sig[j].g != selectedGroup.id) {
                    mySig.priority = 1;
                } else if (groups[i].sig[j].d != 1 && groups[i].sig[j].g == selectedGroup.id) {
                    mySig.priority = 2;
                } else if (groups[i].sig[j].d == 1 && groups[i].sig[j].g == selectedGroup.id) {
                    mySig.priority = 3;
                }
                signatures.push(mySig);
            }
        }
    }
    signatures.sort(function(a, b) {
        return (a.d < b.d);
    });

    var matchingPredefined = null, defaultPredefined = null;

    for (i=0; i<selectedGroup.pm.length; i++)
    {
        if(selectedGroup.pm[i].def == 1)
            defaultPredefined = selectedGroup.pm[i];
        if(selectedGroup.pm[i].lang == ticket.l)
            matchingPredefined = selectedGroup.pm[i];
    }

    var salutationFields = lzm_commonTools.getTicketSalutationFields(ticket, messageNoSal);
    var checkedString = (ticket.t != 6 && ticket.t != 7) ? ' checked="checked"' : '';
    var disabledString2 = (ticket.t == 6 || ticket.t == 7) ? ' ui-disabled' : '';
    var disabledString;

    var salBreaker = ($('#ticket-details-body').width() < 800) ? "" : "";

    var replyString = '<div id="ticket-kb-auto-search"></div>' +
        '<div id="ticket-composer-form" class="lzm-tab-scroll-content"><fieldset class="lzm-fieldset"><legend>' + t('Salutation') + '</legend>' +
        '<div id="tr-enable-salutation-fields" style="padding-bottom: 8px;">' +
        '<input type="checkbox" id="enable-tr-salutation" class="checkbox-custom"' + checkedString + ' />' +
        '<label for="enable-tr-salutation" class="checkbox-custom-label">' + t('Use salutation') + '</label></div>' +
        '<div class="tr-salutation-fields' + disabledString2 + '">';

    checkedString = (salutationFields['salutation'][0]) ? ' checked="checked"' : '';
    disabledString = (salutationFields['salutation'][0]) ? '' : ' class="ui-disabled"';

    replyString += '<span class="ticket-reply-element"><span id="tr-greet-placeholder"' + disabledString + '></span><span class="left-space"><input type="checkbox" id="use-tr-greet" class="checkbox-custom"' + checkedString + ' /><label for="use-tr-greet" class="checkbox-custom-label"></label></span></span>';
    checkedString = (salutationFields['title'][0]) ? ' checked="checked"' : '';
    disabledString = (salutationFields['title'][0]) ? '' : ' class="ui-disabled"';


    replyString += '<span class="ticket-reply-element"><span id="tr-title-placeholder"' + disabledString + '></span><span class="left-space"><input type="checkbox" id="use-tr-title" class="checkbox-custom"' + checkedString + ' /><label for="use-tr-title" class="checkbox-custom-label"></label></span></span>';
    replyString += salBreaker;
    checkedString = (salutationFields['first name'][0]) ? ' checked="checked"' : '';
    disabledString = (salutationFields['first name'][0]) ? '' : ' class="ui-disabled"';

    replyString += '<span class="ticket-reply-element"><span class="lzm-input lzm-input-medium"><input type="text" id="tr-firstname"' + disabledString + ' placeholder="' + t('First Name') + '" value="' + capitalize(salutationFields['first name'][1]) + '" /></span>';
    replyString += '<span class="left-space"><input type="checkbox" id="use-tr-firstname" class="checkbox-custom"' + checkedString + ' /><label for="use-tr-firstname" class="checkbox-custom-label"></label></span></span>';
    replyString += salBreaker;

    if(this.isFullscreenMode())
        replyString += '<span><i style="font-size:20px;vertical-align:middle;padding:0 15px 2px 0;cursor:pointer;" onclick="switchTicketNames();" class="fa fa-arrows-h icon-blue"></i></span>';

    checkedString = (salutationFields['last name'][0]) ? ' checked="checked"' : '';
    disabledString = (salutationFields['last name'][0]) ? '' : ' class="ui-disabled"';
    replyString += '<span class="lzm-input lzm-input-medium ticket-reply-element"><input type="text" id="tr-lastname"' + disabledString + ' placeholder="' + t('Last Name') + '" value="' + capitalize(salutationFields['last name'][1]) + '" /></span>';

    replyString += '<span class="left-space"><input type="checkbox" id="use-tr-lastname" class="checkbox-custom"' + checkedString + ' /><label for="use-tr-lastname" class="checkbox-custom-label"></label></span>';
    replyString += salBreaker;
    replyString += '<input type="text" id="tr-punctuationmark" style="width: 30px; margin: 2px;" value="' + salutationFields['punctuation mark'][1][0][0] + '" />';
    replyString += '</div></fieldset><fieldset class="lzm-fieldset"><legend>' + t('Introduction Phrase') + '</legend><div class="tr-salutation-fields' + disabledString2 + '">';

    checkedString = (salutationFields['introduction phrase'][0]) ? ' checked="checked"' : '';
    disabledString = (salutationFields['introduction phrase'][0]) ? '' : ' ui-disabled"';

    replyString += '<span id="tr-intro-placeholder" class="' + disabledString + '"></span>';
    replyString += '<span class="left-space"><input type="checkbox" id="use-tr-intro" class="checkbox-custom"' + checkedString + ' /><label for="use-tr-intro" class="checkbox-custom-label"></label></span>';
    replyString += '</div></fieldset><fieldset class="lzm-fieldset"><legend>' + t('Mail Text') + '</legend><div id="message-reply-container" style="margin:0;width:100%;">';

    //BUTTONS
    var buttline = lzm_inputControls.createButton('ticket-reply-input-load', '', '', tid('load'), '<i class="fa fa-folder-open-o"></i>', 'lr', {'margin-left': '0px','border-radius':0},'',-1,'e');

    var ifstyle = '';
    if(this.isFullscreenMode())
    {
        ifstyle = 'padding-right:10px !important;';
        buttline += lzm_inputControls.createButton('ticket-reply-input-save', 'ui-disabled', '', tid('save'), '<i class="fa fa-save"></i>', 'lr',  {'margin-left': '-1px','border-radius':0},'',-1,'e');
        buttline += lzm_inputControls.createButton('ticket-reply-input-saveas', '', '', tid('ticket_saveas'), '<i class="fa fa-plus"></i>', 'lr', {'margin-left': '-1px','border-radius':0},'',-1,'e');
    }

    buttline += lzm_inputControls.createButton('ticket-reply-input-clear', '', '', tid('ticket_clear'), '<i class="fa fa-remove"></i>', 'lr',{'margin-left': '-1px','border-radius':0},'',-1,'e');
    buttline += lzm_inputControls.createButton('ticket-reply-reply-inline', '', '', tid('reply_inline'), '<i class="fa fa-terminal"></i>', 'lr',{'margin-left': '-1px','border-radius':0},'',-1,'e');
    buttline += lzm_inputControls.createButton('ticket-reply-show-question', '', '', tid('show_question'), '<i class="fa fa-question"></i>', 'lr',{'margin-left': '-1px','border-radius':0},'',-1,'e');

    replyString += '<div id="ticket-reply-inline-show-div" style="text-align: right; width:100%;"></div><table class="tight"><tr><td style="'+ifstyle+'">';

    replyString +='<div id="ticket-response-inner" class="lzm-text-input-inner">';
    replyString +='<div id="ticket-response-controls">';

    var composeHTML = ChatTicketClass.GetReplyFormat(ticket) == 'HTML';

    replyString +=lzm_inputControls.CreateInputControlPanel(composeHTML ? 'basic' : 'plain','','',false, buttline).replace(/lzm_chatInputEditor/g,'ChatTicketClass.TextEditor');
    replyString +='</div><div id="ticket-response-body" class="lzm-text-input-body"><textarea id="ticket-response"></textarea></div></div>';
    ChatTicketClass.TextEditor = new ChatEditorClass('ticket-response');

    var prefill = '';
    for (var li=0;li<ticket.logs.length;li++)
        if(ticket.logs[li].a == 'SaveDraft' && ticket.logs[li].m == ticket.messages[messageNo].id)
        {
            prefill = ticket.logs[li].vn;
            break;
        }

    if(d(_preFill))
        prefill = _preFill;

    replyString += '<textarea id="ticket-reply-input" class="ticket-reply-text" style="display:none;">'+lz_global_htmlentities(prefill)+'</textarea>';
    replyString += '</td><td><textarea id="ticket-reply-last-question" class="ticket-reply-text" style="display:none;" readonly></textarea></td></tr></table>';
    replyString += '<input type="hidden" id="ticket-reply-input-resource" value="" />';
    replyString += '<div id="ticket-reply-counter" class="text-gray top-space-half"></div><br>';
    replyString += '</fieldset>';

    // CLOSING
    replyString += '<fieldset class="lzm-fieldset"><legend>' + t('Closing Phrase') + '</legend>';
    replyString += '<div class="tr-salutation-fields" class="' + disabledString2 + '">';

    checkedString = (salutationFields['closing phrase'][0]) ? ' checked="checked"' : '';
    disabledString = (salutationFields['closing phrase'][0]) ? '' : ' class="ui-disabled"';
    replyString += '<span id="tr-close-placeholder"' + disabledString + '></span><span class="left-space"><input type="checkbox" id="use-tr-close" class="checkbox-custom"' + checkedString + ' /><label for="use-tr-close" class="checkbox-custom-label"></label></fieldset></span>';
    replyString += '<fieldset class="lzm-fieldset"><legend>' + tid('signature') + '</legend><div id="message-signature-container" class="' + disabledString2 + '">';

    var chosenPriority = -1;

    if(!signatures.length)
    {
        replyString += '<select id="ticket-reply-signature" class="lzm-select ui-disabled">';
        replyString += '<option value="" selected="selected">' + tid('none') + '</option>';
    }
    else
    {
        replyString += '<select id="ticket-reply-signature" class="lzm-select' + disabledString2 + '">';
        for (i=0; i<signatures.length; i++)
        {
            var defaultString = (signatures[i].d == 1) ? t('('+tid('default')+')') : '';
            var nameString = signatures[i].n + ' ' + defaultString;
            var selectedString = '';
            if (signatures[i].priority > chosenPriority)
            {
                selectedString = ' selected="selected"';
                signatureText = signatures[i].text;
                chosenPriority = signatures[i].priority;
            }
            replyString += '<option value="' + lz_global_base64_encode(signatures[i].text) + '"' + selectedString + '>' + nameString + '</option>';
        }
    }

    replyString += '</select><br />';

    disabledString = (PermissionEngine.checkUserPermissions('', 'tickets', 'change_signature', {})) ? '' : ' ui-disabled"';

    // signature editor
    replyString +='<div id="ticket-signature-inner" class="top-space-half lzm-text-input-inner' + disabledString + '">';

    var tss = '';
    if(composeHTML)
    {
        replyString +='<div id="ticket-signature-controls">';
        replyString +=lzm_inputControls.CreateInputControlPanel('basic','','',false,'').replace(/lzm_chatInputEditor/g,'ChatTicketClass.SignatureEditor');
        replyString += '</div>';
    }
    else
        tss = ' style="border-top:0;"';

    replyString +='<div id="ticket-signature-body" class="lzm-text-input-body"'+tss+'><textarea id="ticket-signature"></textarea></div>';

    ChatTicketClass.SignatureEditor = new ChatEditorClass('ticket-signature');

    replyString += '</div><br><br></fieldset></div>';

    var attachmentsHtml = '<div id="message-attachment-list">' + that.createTicketAttachmentTable(ticket, {id: ''}, -1, true) + '</div>';
    var bodyString = '<div id="reply-placeholder"></div>';

    var footerString = '<span style="float:right;">' + lzm_inputControls.createButton('ticket-reply-preview', '', '', tid('preview'), '', 'lr', {'margin-left': '6px', 'margin-top': '-2px'}, '', 20, 'd') + lzm_inputControls.createButton('ticket-reply-cancel', '', 'ChatTicketClass.CancelTicketReply(\'' + ticket.id + '\',\'' + ticket.id + '_reply\');', t('Cancel'), '', 'lr',{'margin-left': '4px', 'margin-top': '-2px'}, '', 20, 'd')+
    '</span><span style="float:left;">' + lzm_inputControls.createButton('ticket-reply-pause', '', 'pauseTicketReply(\'' + ticket.id + '\',\'ticket-details\', \'' + lzm_chatDisplay.ticketDialogId[ticket.id] + '\');', tid('ticket'), '<i class="fa fa-backward"></i>', 'lr',{'margin-left': '4px'}, '', 20, 'd')+'</span>';

    var winObj = TaskBarManager.GetWindow(ticket.id);
    if(winObj != null)
        winObj.ShowInTaskBar = false;
    var myDialogId = lzm_commonDialog.CreateDialogWindow(this.GetTicketWindowTitle(false,ticket), bodyString, footerString, 'pencil', rDiaId, rDiaId, 'ticket-reply-cancel', true, {'ticket-id': ticket.id, menu: menuEntry}, true, winObj.TaskBarIndex);

    TaskBarManager.GetWindow(myDialogId).Tag = lzm_commonTools.clone(ticket);

    lzm_inputControls.createTabControl('reply-placeholder', [{name: t('Composer'), content: replyString},{name: t('Attachments'), content: attachmentsHtml}], 0);

    $('#message-comment-text').css({'min-height': ($('#ticket-details-body').height() - 62) + 'px'});
    $('#message-attachment-list').css({'min-height': ($('#ticket-details-body').height() - 62) + 'px'});

    lzm_inputControls.createInputMenu('tr-greet-placeholder', 'tr-greet', 'lzm-combobox-small', 0, t('Salutation'), salutationFields['salutation'][1][0][0],salutationFields['salutation'][1], 'ticket-composer-form', 0);
    lzm_inputControls.createInputMenu('tr-title-placeholder', 'tr-title', 'lzm-combobox-small', 0, t('Title'), salutationFields['title'][1][0][0],salutationFields['title'][1], 'ticket-composer-form', -2);
    lzm_inputControls.createInputMenu('tr-intro-placeholder', 'tr-intro', '', 0, t('Introduction Phrase'), salutationFields['introduction phrase'][1][0][0], salutationFields['introduction phrase'][1], 'ticket-composer-form', 8);
    lzm_inputControls.createInputMenu('tr-close-placeholder', 'tr-close', '', 0, t('Closing Phrase'), salutationFields['closing phrase'][1][0][0], salutationFields['closing phrase'][1], 'ticket-composer-form', 22);

    var trFields = ['greet', 'title', 'firstname', 'lastname', 'punctuationmark', 'intro', 'close'];

    for (i=0; i<trFields.length; i++)
        $('#use-tr-' + trFields[i]).change(function() {
            var inputId = $(this).attr('id').replace(/use-/,'');
            if ($('#use-' + inputId).attr('checked') == 'checked') {
                $('#' + inputId + '-placeholder').removeClass('ui-disabled');
                $('#' + inputId).removeClass('ui-disabled');
            } else {
                $('#' + inputId + '-placeholder').addClass('ui-disabled');
                $('#' + inputId).addClass('ui-disabled');
            }
        });

    $('#enable-tr-salutation').click(function() {
        if ($('#enable-tr-salutation').prop('checked')) {
            $('.tr-salutation-fields').removeClass('ui-disabled');
        } else {
            $('.tr-salutation-fields').addClass('ui-disabled');
        }
    });
    $('#reply-placeholder-tab-2').click(function() {
        UIRenderer.resizeTicketReply();
    });

    this.ActivateAttachmentButtons(ticket, myDialogId, menuEntry);

    ChatTicketClass.InitResponseEditor(prefill,ticket);

    $('#remove-attachment').click(function() {
        var resources = $('#reply-placeholder-content-1').data('selected-resources');
        resources = (typeof resources != 'undefined') ? resources : [];
        var tmpResources = [];
        for (var i=0; i<resources.length; i++) {
            if (i != $('#attachment-table').data('selected-attachment')) {
                tmpResources.push(resources[i]);
            }
        }
        $('#reply-placeholder-content-1').data('selected-resources', tmpResources);
        that.updateAttachmentList();
        $('#attachment-table').data('selected-attachment', -1);
        $('#remove-attachment').addClass('ui-disabled');
    });
    $('#ticket-reply-input-load').click(function(){

        ChatTicketClass.InsertPlaceholder = '<!--' + md5(Math.random()) + '-->';
        ChatTicketClass.TextEditor.insertHtml(ChatTicketClass.InsertPlaceholder);
        KnowledgebaseUI.InitSelectionMode(TaskBarManager.GetActiveWindow(),'TICKET_LOAD_ELEMENT');

    });
    $('#ticket-reply-input-save').click(function() {
        if ($('#ticket-reply-input-resource').val() != '')
        {
            lzm_commonDialog.removeAlertDialog();
            lzm_commonDialog.createAlertDialog(tid('overwrite'), [{id: 'ok', name: tid('ok')},{id: 'cancel', name: tid('cancel')}]);
            $('#alert-btn-ok').click(function() {

                lzm_commonDialog.removeAlertDialog();

                lzm_chatDisplay.ticketResourceText[ticket.id] = ChatTicketClass.TextEditor.grabHtml();
                KnowledgebaseUI.AddOrEditResourceFromTicket(ticket.id,DataEngine.cannedResources.getResource($('#ticket-reply-input-resource').val()));
            });
            $('#alert-btn-cancel').click(function() {
                lzm_commonDialog.removeAlertDialog();
            });
        }
    });
    $('#ticket-reply-input-saveas').click(function() {

        lzm_chatDisplay.ticketResourceText[ticket.id] = ChatTicketClass.TextEditor.grabHtml();
        KnowledgebaseUI.InitSelectionMode(TaskBarManager.GetActiveWindow(),'TICKET_SAVE_AS');

    });
    $('#ticket-reply-input-clear').click(function() {
        ChatTicketClass.TextEditor.setHtml('');
        $('#ticket-reply-reply-inline').removeClass('ui-disabled');
        answerInline = false;
        ChatTicketClass.SaveDraft(ChatTicketClass.LastActiveTicket,'',ChatTicketClass.LastActiveTicket.messages[ChatTicketClass.GetUIProperty('selected-message-no',ChatTicketClass.SelectedMessageNo)].id);
    });
    $('#ticket-reply-show-question').click(function() {
        var show = $('#ticket-reply-last-question').css('display') == 'none';
        if (show)
        {
            var lastMessageText = (ticket.messages[messageNo].mt);
            $('#ticket-reply-last-question').text(lastMessageText).css({display: 'block'});
            $('#ticket-reply-show-question').html(((lzm_chatDisplay.windowWidth<500) ? '<i class="fa fa-question"></i>': t('Hide Question')));
        }
        else
        {
            //$('#ticket-reply-input').parent().css({display: 'block'});
            $('#ticket-reply-last-question').text('').css({display: 'none'});
            $('#ticket-reply-show-question').html(((lzm_chatDisplay.windowWidth<500) ? '<i class="fa fa-question"></i>': t('Show Question')));
        }
        lzm_commonStorage.saveValue('ticket_reply_show_question_' + DataEngine.myId, (show)?1:0);

        if(!IFManager.IsMobileOS)
            ChatTicketClass.TextEditor.focus();
    });
    $('#ticket-reply-reply-inline').click(function() {
        var lastMessageText = ticket.messages[messageNo].mt.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n +/g,'\n').replace(/\n+/g,'\n');
        lastMessageText = '> ' + lastMessageText.replace(/\n/g, '\n<br>&gt; ').replace(/\n/g, '\r\n');
        $('#ticket-reply-reply-inline').addClass('ui-disabled');

        ChatTicketClass.TextEditor.insertHtml(lastMessageText);
        $(ChatTicketClass.TextEditor.getBody()).change();

        answerInline = true;
    });
    $('#ticket-reply-preview').click(function() {

        var salutationValues = {
            'enable-salutation': $('#enable-tr-salutation').prop('checked'),
            'salutation': [$('#use-tr-greet').attr('checked') == 'checked', $.trim($('#tr-greet').val())],
            'title': [$('#use-tr-title').attr('checked') == 'checked', $.trim($('#tr-title').val())],
            'introduction phrase': [$('#use-tr-intro').attr('checked') == 'checked', $('#tr-intro').val()],
            'closing phrase': [$('#use-tr-close').attr('checked') == 'checked', $('#tr-close').val()],
            'first name': [$('#use-tr-firstname').attr('checked') == 'checked', $.trim($('#tr-firstname').val())],
            'last name': [$('#use-tr-lastname').attr('checked') == 'checked', $.trim($('#tr-lastname').val())],
            'punctuation mark': [true, $('#tr-punctuationmark').val()]
        };


        var replyHTML = ChatTicketClass.TextEditor.grabHtml();
        //replyHTML = lzm_commonTools.NL2BR(replyHTML);

        var replyPlain = ChatTicketClass.TextEditor.grabText(true);
        var commentText = "";

        var signatureHTML = ChatTicketClass.SignatureEditor.grabHtml();
        var signaturePlain = ChatTicketClass.SignatureEditor.grabText(true);

        var thisMessageNo = (!answerInline || true) ? messageNo : -1;
        var resources = $('#reply-placeholder-content-1').data('selected-resources');
        resources = (typeof resources != 'undefined') ? resources : [];
        that.ShowMessageReplyPreview(ticket, thisMessageNo, replyPlain, replyHTML, signaturePlain, signatureHTML, commentText, resources,salutationValues, selectedGroup, menuEntry, answerInline);


    });
    $('#use-tr-intro').change(function() {
        $('#tr-intro-select').css('display','none');
    });
    $('#use-tr-close').change(function() {
        $('#tr-close-select').css('display','none');
    });

    $('#reply-placeholder').on({
        dragstart: function(){
            ChatTicketClass.m_BlockReplyDrop = true;
        },
        dragenter: function() {
            if(!ChatTicketClass.m_BlockReplyDrop)
            {
                $('#reply-placeholder-tab-1').click();
                if(IFManager.IsDesktopApp() && d(IFManager.DeviceInterface.hasModule) && IFManager.DeviceInterface.hasModule('lz-screenshot-widget'))
                    ticketReplyAddAttachmentContextMenu({myDialogId: myDialogId, ticket:{id:ticket.id}, menuEntry:menuEntry});
                else
                    $('#add-attachment').click();

            }
        },
        dragend: function(){
            ChatTicketClass.m_BlockReplyDrop = false;
        }
    });

    if(lzm_commonStorage.loadValue('ticket_reply_show_question_' + DataEngine.myId)==1)
        $('#ticket-reply-show-question').click();

    UIRenderer.resizeTicketReply();
};

ChatTicketClass.prototype.createWatchListTable = function(){
    var wlHtml = '<table id="watch-list-table" class="visible-list-table alternating-rows-table lzm-unselectable"><thead><tr><th>' + tid('operator') + '</th></tr></thead><tbody>';
    var operators = DataEngine.operators.getOperatorList('name', '', true);
    for (i=0; i<operators.length; i++)
        if (operators[i].isbot != 1)
            wlHtml += '<tr><td>' + lzm_inputControls.createCheckbox('wlcb'+operators[i].id,operators[i].name,false,'') + '</td></tr>';
    return wlHtml + '</tbody></table>';
};

ChatTicketClass.prototype.ShowMessageReplyPreview = function(ticket, messageNo, replyPlain, replyHTML, signaturePlain, signatureHTML, comment, attachments, salutation, group, menuEntry) {

    menuEntry = (typeof menuEntry != 'undefined') ? menuEntry : '';

    var replacementArray,messageId = md5(Math.random().toString());
    var email = '', bcc = '', cc='',i, subjObject = {}, defLanguage = 'EN';
    var rootMessage = Ticket.GetRootMessage(ticket);
    var isHTML = ChatTicketClass.GetReplyFormat(ticket) == 'HTML';
    var matchingPredefined = null;

    for (i=0; i<group.pm.length; i++)
    {
        subjObject[group.pm[i].lang] = (group.pm[i].str != '') ? group.pm[i].str : group.pm[i].st;
        if (group.pm[i].def == 1)
            defLanguage = group.pm[i].lang;

        if(group.pm[i].lang == ticket.l)
            matchingPredefined = group.pm[i];
    }

    var previousMessageSubject = '';

    if(d(ticket.messages) && ticket.messages.length && rootMessage != null && rootMessage.s.length)
        previousMessageSubject = rootMessage.s;

    var subject = '';

    if(d(ticket.l) && d(subjObject[ticket.l]))
        subject = subjObject[ticket.l];
    else if(d(subjObject[defLanguage]))
        subject = subjObject[defLanguage];
    else
        subject = previousMessageSubject;

    var subjectHash = '[' + ticket.h + ']';

    if(subject.indexOf('%ticket_hash%') == -1 && subject.indexOf(subjectHash) == -1)
        subject = subjectHash + ' ' + subject;

    replacementArray = [
        {pl: '%external_name%', rep: rootMessage.fn},
        {pl: '%ticket_hash%', rep: subjectHash},
        {pl: '%subject%', rep: previousMessageSubject},
        {pl: '%ticket_id%', rep: ticket.id},
        {pl: '%group_id%', rep: group.id},
        {pl: '%group_title%', rep: GroupManager.GetGroupTitle(group,ticket.l)}
    ];

    subject = lzm_commonTools.replacePlaceholders(subject, replacementArray);
    subject = lzm_commonTools.ReplaceCommonPlaceholders(ticket.id ,subject);

    subject = subject.replace(/[ -]+$/, '');

    if(!subject.toLowerCase().startsWith('Re:'))
        subject = 'Re: ' + subject;

    var previousMessageId = (messageNo >= 0) ? ticket.messages[messageNo].id : rootMessage.id;
    var trFields = ['salutation', 'title', 'first name', 'last name', 'punctuation mark', 'introduction phrase'];

    var replyText = '';
    var LBPH = '4353478623981838';

    if (salutation['enable-salutation'])
    {
        for (i=0; i<trFields.length; i++)
        {
            if(salutation[trFields[i]][0])
            {
                var lineBreak = ' ';
                if ((trFields[i] == 'punctuation mark') ||
                    trFields[i] == 'introduction phrase' ||
                    (trFields[i] == 'last name' && !salutation['punctuation mark'][0]))
                {
                    lineBreak = LBPH;
                }
                else if ((trFields[i] == 'first name' && salutation['first name'][1] == '') ||
                    (trFields[i] == 'first name' && !salutation['last name'][0]) ||
                    (trFields[i] == 'first name' && salutation['last name'][1] == '') ||
                    trFields[i] == 'last name' ||
                    (trFields[i] == 'salutation' && (!salutation['title'][0] || salutation['title'][1] == '') &&
                        (!salutation['first name'][0] || salutation['first name'][1] == '') &&
                        (!salutation['last name'][0] || salutation['last name'][1] == '')))
                {
                    lineBreak = '';
                }
                replyText += salutation[trFields[i]][1] + lineBreak;
            }
        }
    }

    var re = new RegExp(' ,' + LBPH, "g");
    replyText = replyText.replace(re, ','+LBPH);

    var bodyHTML = replyText + replyHTML;
    var bodyPLAIN = replyText + replyPlain;

    if (salutation['enable-salutation'] && salutation['closing phrase'][0])
    {
        bodyHTML += LBPH + salutation['closing phrase'][1];
        bodyPLAIN += LBPH + salutation['closing phrase'][1];
    }

    signaturePlain = lzm_commonTools.replacePlaceholders(signaturePlain, replacementArray);
    signatureHTML = lzm_commonTools.replacePlaceholders(signatureHTML, replacementArray);

    signaturePlain = lzm_commonTools.ReplaceCommonPlaceholders('',signaturePlain);
    signatureHTML = lzm_commonTools.ReplaceCommonPlaceholders('',signatureHTML);

    bodyHTML = lzm_commonTools.ReplaceCommonPlaceholders(ticket.id, bodyHTML);
    bodyPLAIN = lzm_commonTools.ReplaceCommonPlaceholders(ticket.id, bodyPLAIN);

    if (ticket.t != 6 && ticket.t != 7)
    {
        bodyHTML += LBPH + signatureHTML;
        bodyPLAIN += LBPH + signaturePlain;
    }

    bodyHTML = bodyHTML.replace(new RegExp(LBPH,'g'),'<br><br>');
    bodyPLAIN = bodyPLAIN.replace(new RegExp(LBPH,'g'),'\r\n\r\n');

    var rec = $.trim(rootMessage.em);

    if(ticket.t < 6)
        if(ticket.messages[messageNo].em.length && rootMessage.em.toLowerCase().indexOf(ticket.messages[messageNo].em.toLowerCase()) == -1)
        {
            if(rec.length)
                rec += ', ';
            rec += ticket.messages[messageNo].em;
        }

    var disabledClass = (ticket.t == 6 || ticket.t == 7) ? ' class="ui-disabled"' : '';

    var previewHtml = '<div class="lzm-tab-scroll-content"><div id="ticket-reply-cell" class="lzm-fieldset">' +
        '<table class="tight">' +
        '<tr><td><label for="ticket-reply-receiver">' + tidc('ticket_receiver') + '</label></td><td><input type="text" id="ticket-reply-receiver" value="' + rec + '"' + disabledClass + ' /></td></tr>' +
        '<tr><td><label for="ticket-reply-bcc">CC:</label></td><td><input type="text" id="ticket-reply-cc" value="' + rootMessage.ecc + '" /></td></tr>' +
        '<tr><td><label for="ticket-reply-bcc">BCC:</label></td><td><input type="text" id="ticket-reply-bcc" value="' + rootMessage.ebcc + '" /></td></tr>';

    if (ticket.t != 6 && ticket.t != 7)
        previewHtml += '<tr><td><label for="ticket-reply-subject">' + tidc('subject') + '</label></td><td><input type="text" id="ticket-reply-subject" value="' + lzm_commonTools.htmlEntities(subject) + '" /></td></tr>';
    else
        previewHtml += '<tr><td><input type="hidden" id="ticket-reply-subject" value="' + lzm_commonTools.htmlEntities(subject) + '" /></td><td></td></tr>';

    previewHtml += '</table>';



    if(isHTML)
        previewHtml += '<div id="ticket-preview-text" class="input-like">' + bodyHTML + '</div>';
    else
        previewHtml += '<textarea id="ticket-preview-text" readonly>' + bodyPLAIN + '</textarea>';

    previewHtml += '<div class="top-space-half">';

    var stList = [
        {text:tid('ticket_status_0'),value:0},
        {text:tid('ticket_status_1'),value:1},
        {text:tid('ticket_status_4'),value:4},
        {text:tid('ticket_status_2'),value:2},
        {text:tid('ticket_status_3'),value:3}
    ];

    var defPostReplyStatus = DataEngine.getConfigValue('gl_tprs',false);
    if(defPostReplyStatus == null)
        defPostReplyStatus = 4;

    previewHtml += lzm_inputControls.createSelect('ticket-preview-set-status','','',tidc('change_status_to'),'',{},'',stList,defPostReplyStatus,'');
    previewHtml += '</div>';
    previewHtml += '<div class="top-space"><label>'+tidc('comment')+'</label><textarea id="new-message-comment" style="height:100%;width:100%">' + comment + '</textarea></div>';

    if (attachments.length > 0)
    {
        previewHtml += '<label class="top-space" for="ticket-reply-files">' + t('Files:') + '</label><div id="ticket-reply-files" class="ticket-reply-text input-like">';

        for (var m=0; m<attachments.length; m++)
        {
            var downloadUrl = getQrdDownloadUrl(attachments[m]);
            previewHtml += '<span style="margin-right: 10px;">' +
                '<a href="#" onclick="downloadFile(\'' + downloadUrl + '\');" class="lz_chat_file">' + attachments[m].ti + '</a>' +
                '</span>&#8203;'
        }
        previewHtml += '</div>';
    }
    previewHtml += '</div></div>';

    var watchListHtml = this.createWatchListTable();
    var footerString = lzm_inputControls.createButton('ticket-reply-send', '', '', tid('ticket_save_and_send'), '<i class="fa fa-envelope-o"></i>', 'force-text',{'margin': '-5px 4px'},'',30,'d');
    footerString += lzm_inputControls.createButton('ticket-preview-cancel', '', '', tid('cancel'), '', 'lr',{'margin': '0px'},'',30,'d');

    var bodyString = '<div id="preview-placeholder"></div>';
    var winReplyObj = TaskBarManager.GetWindow(ticket.id + '_reply');
    if(winReplyObj != null)
    {
        winReplyObj.Minimize();
        winReplyObj.ShowInTaskBar = false;
    }

    lzm_commonDialog.CreateDialogWindow(this.GetTicketWindowTitle(false,ticket), bodyString, footerString, 'search', ticket.id + '_preview', ticket.id + '_preview', 'ticket-preview-cancel', true, {'ticket-id': ticket.id, menu: menuEntry}, true, winReplyObj.TaskBarIndex);
    lzm_inputControls.createTabControl('preview-placeholder', [{name: t('Preview'), content: previewHtml},{name: tid('watch_list'), content: watchListHtml}], 0);

    $('.preview-placeholder-content').css({height: ($('#' + ticket.id + '_preview-body').height() - 46) + 'px'});
    $('#ticket-preview-cancel').click(function() {
        TaskBarManager.RemoveWindowByDialogId(ticket.id + '_preview');
        TaskBarManager.Maximize(ticket.id + '_reply');
    });
    $('#ticket-reply-send').click(function() {

        if(DataEngine.global_configuration.database['email'].length==0)
        {
            lzm_commonDialog.createAlertDialog(tid('no_mailbox'), [{id: 'ok', name: tid('yes')},{id: 'cancel', name: tid('cancel')}]);
            $('#alert-btn-ok').click(function() {

                lzm_commonDialog.removeAlertDialog();
                initServerConfiguration(null,'email');

            });
            $('#alert-btn-cancel').click(function() {
                lzm_commonDialog.removeAlertDialog();
            });
            return;
        }

        var replyReceiver = $('#ticket-reply-receiver').val();

        try
        {
            var f = lzm_commonTools.GetElementByProperty(group.f,'key','ti_masked');
            var k = lzm_commonTools.GetElementByProperty(f[0].values,'key','112');
            if(k[0].text != '0')
            {
                replyReceiver = "[__[MASKED]__]";
            }
        }
        catch(ex)
        {

        }

        var messageIncludingReceiver = replyReceiver + ' ' + bodyPLAIN;
        var messageLength = messageIncludingReceiver.replace(/\r\n/g, '\n').length, errorMessage = '';

        if (ticket.t != 7 || messageLength < 140)
        {
            if (replyReceiver != '')
            {
                if (salutation['enable-salutation'])
                {
                    delete salutation['enable-salutation'];
                    lzm_commonTools.saveTicketSalutations(salutation, ticket.l.toLowerCase());
                }
                var messageSubject = $('#ticket-reply-subject').val();

                var addToWL = [];
                $('#watch-list-table input').each(function() {
                    if($(this).attr('checked')=='checked')
                        addToWL.push($(this).attr('id').substr(4,$(this).attr('id').length-4));
                });

                if(ChatTicketClass.GetReplyFormat(ticket) == 'TEXT')
                    bodyHTML = '';

                ChatTicketClass.SendTicketMessage(ticket, replyReceiver, $('#ticket-reply-cc').val(), $('#ticket-reply-bcc').val(), messageSubject, bodyPLAIN, bodyHTML, $('#new-message-comment').val(), attachments, messageId, previousMessageId, addToWL, $('#ticket-preview-set-status').val());

                TaskBarManager.RemoveWindowByDialogId(ticket.id);
                TaskBarManager.RemoveWindowByDialogId(ticket.id + '_reply');
                TaskBarManager.RemoveWindowByDialogId(ticket.id + '_preview');

                delete TaskBarManager.WindowsHidden[lzm_chatDisplay.ticketDialogId[ticket.id] + '_reply'];
                delete TaskBarManager.WindowsHidden[lzm_chatDisplay.ticketDialogId[ticket.id]];

                var tmpStoredDialogIds = [];
                for (var j=0; j<lzm_chatDisplay.StoredDialogIds.length; j++)
                {
                    if (lzm_chatDisplay.ticketDialogId[ticket.id] != lzm_chatDisplay.StoredDialogIds[j] &&
                        lzm_chatDisplay.ticketDialogId[ticket.id] + '_reply' != lzm_chatDisplay.StoredDialogIds[j]) {
                        tmpStoredDialogIds.push(lzm_chatDisplay.StoredDialogIds[j])
                    }
                }
                lzm_chatDisplay.StoredDialogIds = tmpStoredDialogIds;
            }
            else
            {
                errorMessage = t('Please enter a valid email address.');
                lzm_commonDialog.createAlertDialog(errorMessage, [{id: 'ok', name: t('Ok')}]);
                $('#alert-btn-ok').click(function() {
                    lzm_commonDialog.removeAlertDialog();
                });
            }
        }
        else
        {
            errorMessage = t('A twitter message may only be 140 characters long. Your message is <!--message_length--> characters long.',[['<!--message_length-->', messageLength]]);
            lzm_commonDialog.createAlertDialog(errorMessage, [{id: 'ok', name: t('Ok')}]);
            $('#alert-btn-ok').click(function() {
                lzm_commonDialog.removeAlertDialog();
                $('#ticket-reply-cancel').click();
            });
        }
    });
    UIRenderer.resizeTicketReply();
};

ChatTicketClass.prototype.showMessageForward = function(message, ticketId, ticketSender, group) {

    var menuEntry = t('Ticket (<!--ticket_id-->, <!--name-->)',[['<!--ticket_id-->', ticketId],['<!--name-->', ticketSender]]);
    var headerString = tid('forward') + ' (' + ticketId + ')';
    var footerString = lzm_inputControls.createButton('send-forward-message', '','', t('Ok'), '', 'lr',{'margin-left': '6px'},'',30,'d') +
        lzm_inputControls.createButton('cancel-forward-message', '','', t('Cancel'), '', 'lr',{'margin-left': '6px'},'',30,'d');
    var bodyString = '<div id="message-forward-placeholder"></div>';
    var messageTime = lzm_chatTimeStamp.getLocalTimeObject(message.ct * 1000, true);
    var timeHuman = lzm_commonTools.getHumanDate(messageTime, 'all', lzm_chatDisplay.userLanguage);
    var myGroup = DataEngine.groups.getGroup(group), sender = '', receiver = '';

    if ($.inArray(parseInt(message.t), [0, 3, 4]) != -1)
    {
        sender = lzm_commonTools.htmlEntities(message.em);
        receiver = (myGroup != null) ? myGroup.email : group;
    }
    else if (message.t == 1)
    {
        sender = (myGroup != null) ? myGroup.email : group;
        receiver = lzm_commonTools.htmlEntities(message.em);
    }

    var emailText = t('-------- Original Message --------') +
        '\n' + t('Subject: <!--subject-->', [['<!--subject-->', lzm_commonTools.htmlEntities(message.s)]]) +
        '\n' + t('Date: <!--date-->', [['<!--date-->', timeHuman]]);

    if ($.inArray(parseInt(message.t), [0, 1, 3, 4]) != -1)
    {
        emailText += '\n' + t('From: <!--sender_email-->', [['<!--sender_email-->', sender]]) +
            '\n' + t('To: <!--receiver-->', [['<!--receiver-->', receiver]]);
    }

    emailText += '\n\n\n' + lzm_commonTools.htmlEntities(message.mt);


    var emailHtml = '<div id="message-forward" class="lzm-fieldset"><div class="top-space"><label for="tr-forward-email-addresses">' + tidc('email_addresses') + '</label><div id="tr-forward-email-addresses"></div>' +
        '<div class="top-space"><label for="forward-subject">' + tidc('subject') + '</label>' +
        '<input type="text" id="forward-subject" value="' + lzm_commonTools.htmlEntities(message.s) + '"/></div>' +
        '<div class="top-space"><label for="forward-text">' + t('Email Body:') + '</label>' +
        '<textarea id="forward-text">' + emailText + '</textarea></div>';

    if (message.attachment.length > 0)
    {
        emailHtml += '<br /><label for="ticket-reply-files">' + t('Files:') + '</label>' +
            '<div id="forward-files" class="ticket-reply-text input-like">';
        for (var m=0; m<message.attachment.length; m++) {
            var attachment = {ti: message.attachment[m].n, rid: message.attachment[m].id};
            var downloadUrl = getQrdDownloadUrl(attachment);
            emailHtml += '<span style="margin-right: 10px;">' +
                '<a href="#" onclick="downloadFile(\'' + downloadUrl + '\');" class="lz_chat_file">' + attachment.ti + '</a>' +
                '</span>&#8203;'
        }
        emailHtml += '</div>';
    }
    emailHtml += '</div>';

    var dialogData = {'ticket-id': ticketId, menu: menuEntry};
    var ticketDialogId = lzm_chatDisplay.ticketDialogId[ticketId];

    var winObj = TaskBarManager.GetWindow(ticketDialogId);

    if(winObj==null)
        return;

    winObj.ShowInTaskBar = false;
    winObj.Minimize();

    lzm_commonDialog.CreateDialogWindow(headerString, bodyString, footerString, 'share', ticketId + '_forward',ticketId + '_forward','cancel-forward-message',true,dialogData,true,winObj.TaskBarIndex);
    lzm_inputControls.createTabControl('message-forward-placeholder', [{name: t('Email'), content: emailHtml}]);
    lzm_inputControls.createInputMenu('tr-forward-email-addresses', 'tr-forward-emails', '', lzm_chatDisplay.FullscreenDialogWindowWidth-100, '', lzm_commonTools.htmlEntities(message.em), LocalConfiguration.EmailList, 'message-forward', 2);

    UIRenderer.resizeMessageForwardDialog();

    $('#cancel-forward-message').click(function() {
        TaskBarManager.RemoveWindowByDialogId(ticketId + '_forward');
        winObj.ShowInTaskBar = true;
        winObj.Maximize();
    });
    $('#send-forward-message').click(function() {
        ChatTicketClass.SendForwardedMessage(message, $('#forward-text').val(), $('#tr-forward-emails').val(), $('#forward-subject').val(), ticketId, group);
        $('#cancel-forward-message').click();
    });
};

ChatTicketClass.prototype.AddMessageComment = function(ticketId, message) {

    var commentControl = '<div style="height:100px;">';
    commentControl += lzm_inputControls.createArea('new-comment-field', '', '', tid('comment') + ':','width:310px;height:70px;');
    commentControl += '</div><div style="display:none;height:100px;">';
    commentControl += lzm_inputControls.createInput('new-comment-file','',tid('file'),tidc('file'),'','file','');

    commentControl += '</div><div class="top-space-double">';
    commentControl += lzm_inputControls.createButton('add-comment-text', 'lzm-button-e-pushed', 'ChatTicketClass.SwitchCommentType(\'TEXT\');', tid('text'), '', '', {'padding':'4px 10px'}, '', 20, 'e');
    commentControl += lzm_inputControls.createButton('add-comment-file', '', 'ChatTicketClass.SwitchCommentType(\'FILE\');', tid('file'), '', '', {'margin': '0 4px 0 -1px', 'padding':'4px 10px'}, '', 20, 'e');
    commentControl += '</div>';

    lzm_commonDialog.createAlertDialog(commentControl, [{id: 'ok', name: tid('ok')},{id: 'cancel', name: tid('cancel')}],false,true,false);
    $('#new-comment-field').select();
    $('#alert-btn-ok').click(function() {

        var commentText = $('#new-comment-field').val();
        $('#alert-btn-ok').addClass('ui-disabled');
        if($('#new-comment-file').val() != '')
        {
            var file = $('#new-comment-file')[0].files[0];
            CommunicationEngine.uploadFile(file, 'user_file', 102, 0, null, null, null, {commentText:commentText,uploadFileId:lzm_commonTools.guid(),uploadFileName:lz_global_base64_encode(file.name)});
        }
        else
        {
            if (typeof ticketId != 'undefined' && typeof message.id != 'undefined')
            {
                UserActions.saveTicketComment(ticketId, message.id, commentText);
            }
            else
            {
                var comments = $('#ticket-message-placeholder-content-2').data('comments');
                comments = (typeof comments != 'undefined') ? comments : [];
                comments.push({text: commentText, timestamp: lzm_chatTimeStamp.getServerTimeString(null, false, 1)});
                $('#ticket-message-placeholder-content-2').data('comments', comments);
            }
            lzm_commonDialog.removeAlertDialog();
        }
    });
    $('#alert-btn-cancel').click(function() {
        lzm_commonDialog.removeAlertDialog();
    });

    ChatTicketClass.SwitchCommentType('TEXT');
};

ChatTicketClass.prototype.CreateTicketHistoryTable = function(ticket, email, messageNumber, isNew, chat) {

    var that = this;
    var messageTableHtml = '<table id="ticket-history-table" class="visible-list-table alternating-rows-table" data-selected-message="' + messageNumber + '">';
    if (!isNew)
        messageTableHtml += that.CreateTicketMessageList(ticket);
    else if (chat.cid != '')
        messageTableHtml += that.CreateTicketMessageList({id: ''});

    messageTableHtml += '</table>';
    return messageTableHtml;
};

ChatTicketClass.prototype.getDirectionImage = function(directionOnly,message,style){
    var directionImage = '';
    if(!directionOnly)
    {
        if (message.t == 1)
            directionImage = '<i '+style+' class="fa fa-arrow-circle-left icon-green"></i>';
        else if (message.t == 2)
            directionImage = '<i '+style+' class="fa fa-arrow-circle-right icon-blue"></i>'; // chat
        else if (message.t == 3)
            directionImage = '<i '+style+' class="fa fa-arrow-circle-right icon-blue"></i>';
        else if (message.t == 4)
            directionImage = '<i '+style+' class="fa fa-arrow-circle-right icon-blue"></i>'; // ? email
        else if (message.t == 5)
            directionImage = '<i '+style+' class="fa fa-star"></i>';
        else
            directionImage = '<i '+style+' class="fa fa-home icon-blue"></i>';
    }
    else
    {
        if (message.t == 1)
            directionImage = '<i '+style+' class="fa fa-arrow-circle-left icon-light"></i>';
        else
            directionImage = '<i '+style+' class="fa fa-arrow-circle-right icon-orange"></i>';
    }

    return directionImage;
};

ChatTicketClass.prototype.CreateTicketMessageList = function(ticket){

    var that = this, operator, key;
    var fullScreenMode = this.isFullscreenMode();
    var messageListHtml = '<thead><tr id="ticket-history-header-line">';

    if(fullScreenMode)
    {
        messageListHtml += '<th colspan="5">'+lzm_inputControls.createCheckbox('ticket-history-show-messages',tid('messages'),true,'','display:inline;');
        messageListHtml += lzm_inputControls.createCheckbox('ticket-history-show-comments',tid('comments'),true,'','display:inline;padding-left:15px;');
        messageListHtml += lzm_inputControls.createCheckbox('ticket-history-show-logs','Logs',false,'','display:inline;padding-left:15px;')+'</th>';
    }
    messageListHtml += '</tr></thead><tbody>';

    if(d(ticket.messages) && ticket.messages.length)
    {
        ticket.messages.sort(that.ticketMessageSortfunction);
        var logsProcessed = ticket.logs.length-1;
        for (var i=ticket.messages.length - 1; i>=0; i--)
        {
            var linecol = (i%2!=0) ? '#fff' : '#f6f6f6';
            operator = DataEngine.operators.getOperator(ticket.messages[i].sid);
            var operatorName = tid('unknown');
            var messageTimeObject = lzm_chatTimeStamp.getLocalTimeObject(ticket.messages[i].ct * 1000, true);
            var messageTimeHuman = lzm_commonTools.getHumanDate(messageTimeObject, '', lzm_chatDisplay.userLanguage);
            var customerName = '';

            if(operator != null)
                operatorName = operator.name;
            else if (ticket.messages[i].fn != '')
                operatorName = lzm_commonTools.htmlEntities(ticket.messages[i].fn);

            if (ticket.messages[i].fn != '')
                customerName += lzm_commonTools.htmlEntities(ticket.messages[i].fn);
            else if (ticket.messages[i].em != '')
                customerName += lzm_commonTools.htmlEntities(ticket.messages[i].em);

            var sender = (ticket.messages[i].t == 1) ? operatorName : customerName;

            sender = lzm_commonTools.SubStr(sender,20,true);

            var messageTypeImage = '<i class="fa fa-envelope"></i>';
            var directionStyle = 'style="margin:0 2px;font-size:16px;"';
            var directionImage = this.getDirectionImage(false,ticket.messages[i],directionStyle);

            if (ticket.messages[i].t == 1)
            {
                if (ticket.t == 6)
                    messageTypeImage = '<i '+directionStyle+' class="fa fa-facebook icon-blue"></i>';
                else if (ticket.t == 7)
                    messageTypeImage = '<i '+directionStyle+' class="fa fa-twitter icon-blue"></i>';
                else
                    messageTypeImage = '<i '+directionStyle+' class="fa fa-envelope"></i>';
            }
            else if (ticket.messages[i].t == 2)
            {
                messageTypeImage = '<i '+directionStyle+' class="fa fa-comment icon-light"></i>';
            }
            else if (ticket.messages[i].t == 3)
            {
                if (ticket.t == 6)
                    messageTypeImage = '<i '+directionStyle+' class="fa fa-facebook icon-blue"></i>';
                else if (ticket.t == 7)
                    messageTypeImage = '<i '+directionStyle+' class="fa fa-twitter icon-blue"></i>';
                else
                    messageTypeImage = '<i '+directionStyle+' class="fa fa-envelope"></i>';
            }
            else if (ticket.messages[i].t == 4)
                messageTypeImage = '<i '+directionStyle+' class="fa fa-envelope"></i>';

            var onclickAction = '', oncontextMenu = '', ondblclickAction = '';

            if((!IFManager.IsAppFrame && !IFManager.IsMobileOS) || IFManager.IsDesktopApp())
            {
                oncontextMenu = ' oncontextmenu="openTicketMessageContextMenu(event, \'' + ticket.id + '\', \'' + i + '\', false);"';
                ondblclickAction = '';
            }

            var attachmentImage = (ticket.messages[i].attachment.length > 0) ? '<i class="fa fa-paperclip"></i>' : '';
            var nextTicket = ((i-1) > 0) ? ticket.messages[i-1] : null;

            if(!fullScreenMode)
            {
                onclickAction = ' onclick="selectTicketMessage(\'' + ticket.id + '\', \'' + i + '\');setTimeout(function(){ChatTicketClass.HandleTicketMessageClick(\'' + ticket.id + '\', \'' + i + '\');},100);"';
                messageListHtml += '<tr class="message-line" id="message-line-' + ticket.id + '_' + i + '" style="cursor: pointer;"' + onclickAction + oncontextMenu + ondblclickAction + '>';
                messageListHtml += '<td class="icon-column-mobile">' + directionImage + '<br>';
                messageListHtml +=  messageTypeImage + '</td>';

                var svContent = '<div><div class="mobile-name-cell">' + lzm_commonTools.htmlEntities(lzm_commonTools.SubStr(sender,16,true)) + '</div>';
                svContent += '<div class="mobile-date-cell">' + messageTimeHuman + '</div></div>';
                svContent += '<div>' + lzm_commonTools.htmlEntities(lzm_commonTools.SubStr(ticket.messages[i].s,46,true)) + '</div>';
                svContent += '<div class="mobile-value-cell">' + lzm_commonTools.htmlEntities(lzm_commonTools.SubStr(ticket.messages[i].mt,200,true)) + '</div>';
                svContent = svContent.replace(/\n/g, " ").replace(/\r/g, " ").replace(/<br>/g, " ");
                messageListHtml += '<td class="mobile-simple-cell">' + svContent + '</td></tr>';
            }
            else
            {
                onclickAction = ' onclick="ChatTicketClass.HandleTicketMessageClick(\'' + ticket.id + '\', \'' + i + '\');"';
                for(key=logsProcessed;key >=0;key--)
                {
                    var log = ticket.logs[key];
                    if(log.ti > ticket.messages[i].ct || nextTicket == null){
                        messageListHtml += this.createTicketMessageAddLine('log',key,i,ticket,log,'#f7faff');
                        logsProcessed = key-1;
                    }
                }

                var avfield = (ticket.messages[i].t != 1 || ticket.messages[i].sid=='') ? lzm_inputControls.createAvatarField('avatar-box-medium',ChatTicketClass.ExtractAvatarName(ticket.messages[i]),'') : lzm_inputControls.createAvatarField('avatar-box-medium','',ticket.messages[i].sid);

                messageListHtml += '<tr class="message-line message-line-fs" id="message-line-' + ticket.id + '_' + i + '"' + onclickAction + oncontextMenu + ondblclickAction + '>';
                messageListHtml += '<td style="background:'+linecol+';">' + avfield;
                messageListHtml += '</td><td colspan="3" style="background:'+linecol+';">';
                messageListHtml += '<div>' + messageTimeHuman + '</div><b>' + sender + '</b>';

                var number = '<div class="message-number">#'+(i+1)+'</div>';

                messageListHtml += '</td><td style="background:'+linecol+';text-align:center;">' + directionImage + messageTypeImage + attachmentImage + number + '</td></tr>';

                if(ticket.messages[i].comment.length>0)
                {
                    for(key in ticket.messages[i].comment)
                        messageListHtml += this.createTicketMessageAddLine('comment',key,i,ticket,ticket.messages[i].comment[key],linecol,onclickAction,oncontextMenu);
                }

                for (var li=0;li<ticket.logs.length;li++)
                    if(ticket.logs[li].a == 'SaveDraft' && ticket.logs[li].m == ticket.messages[i].id)
                    {
                        messageListHtml += this.createTicketMessageAddLine('draft',0,i,ticket,ticket.logs[li],'#ff7800',onclickAction,oncontextMenu);
                        break;
                    }

            }
            messageListHtml += '';
        }
    }
    messageListHtml += '</tbody>';
    return messageListHtml;
};

ChatTicketClass.prototype.createTicketMessageAddLine = function(type,key,mkey,ticket,object,linecol,onclickAction,oncontextAction) {
    var coperator,messageTimeObject,messageTimeHuman,lineHtml = '';
    if(type=="comment")
    {
        lineHtml += '<tr class="message-line message-comment-line comment-line-' + ticket.id + '_' + mkey + '" id="message-line-comment-' + ticket.id + '_' + key + '" '+onclickAction+oncontextAction+'>' +
            '<td style="background:'+linecol+';"></td>' +
            '<td style="background:'+linecol+';" colspan="4">' +

            lzm_chatDisplay.createCommentHtml(ChatTicketClass.GetCommentText(object), object.o, object.t) +

            '</td></tr>';
    }
    else if(type == 'log')
    {
        messageTimeObject = lzm_chatTimeStamp.getLocalTimeObject(object.ti * 1000, true);
        messageTimeHuman = lzm_commonTools.getHumanDate(messageTimeObject, '', lzm_chatDisplay.userLanguage);

        var loperator = DataEngine.operators.getOperator(object.o);
        var oname = (loperator != null) ? loperator.name : object.o.length ? object.o : Ticket.GetRootMessage(ticket).fn;
        var toIcon = (object.v != '' && object.vn != '') ? '&nbsp;&nbsp;<i class="fa fa-caret-right icon-small"></i>&nbsp;&nbsp;': '';
        var valueChange = '';

        if(object.a != 'LastViewTicket')
            valueChange = lzm_commonTools.htmlEntities(object.v) + ''+toIcon+'' +lzm_commonTools.SubStr(lzm_commonTools.StripTags(object.vn),100,true);

        if(valueChange.length)
            valueChange = ' (' + valueChange + ')';

        var action = object.a;
        if(object.a == 'LastViewTicket')
            action = tid('last_ticket_view', [['<!--opname-->', oname],['<!--date-->', messageTimeHuman]]);

        lineHtml += '<tr class="message-line message-log-line lzm-unselectable" id="message-line-log-' + ticket.id + '_' + key + '">';
        lineHtml += '<td style="background:'+linecol+';border-top:1px solid #fff;border-bottom:1px solid #fff;" colspan="5"><div style="padding:5px 10px 10px 10px;">';
        lineHtml += '<span class="text-gray" style="white-space:normal;">' + messageTimeHuman + ' (' + lzm_commonTools.htmlEntities(oname)  + ')<br>' + lzm_commonTools.htmlEntities(action) +  valueChange + '</span>';
        lineHtml += '</div></td></tr>';

    }
    else if(type=="spacer")
        lineHtml += '<tr class="message-line message-line-spacer-' + ticket.id + '_' + mkey + '" '+onclickAction+oncontextAction+'><td colspan="5" style="background:'+linecol+'"></td></tr>';
    else if(type=="draft")
    {
        coperator = DataEngine.operators.getOperator(object.o);
        if(coperator != null)
        {
            lineHtml += '<tr class="message-line message-line-draft message-line-draft-' + ticket.id + '_' + mkey + '" '+onclickAction+oncontextAction+'><td colspan="5" class="nobg" style="background:'+linecol+'"><i class="fa fa-file-text icon-small icon-light"></i>&nbsp;&nbsp;'+tid('draft_from',[['<!--opname-->',lzm_commonTools.SubStr(coperator.name,15,true)]])+'<span class="remove" onclick="ChatTicketClass.RemoveDraft(\''+ticket.id+'\',\''+mkey+'\');"><i class="fa fa-remove icon-small icon-light"></i></span></td></tr>';
        }
    }
    return lineHtml;
};

ChatTicketClass.prototype.showTicketLinker = function(firstObject, secondObject, firstType, secondType, inChatDialog, elementId) {
    var that = this;
    var headerString = t('Link with...');
    var footerString =
        lzm_inputControls.createButton('link-ticket-link', 'ui-disabled', '', t('Link'), '', 'lr',{'margin-left': '6px', 'margin-top': '-4px'},'',30,'d') +
        lzm_inputControls.createButton('link-ticket-cancel', '', '', t('Cancel'), '', 'lr',{'margin-left': '6px', 'margin-top': '-4px'},'',30,'d');

    var linkWithLabel = (secondType == 'ticket') ? tidc('ticket_id') : tidc('chat_id');
    var firstObjectId = (firstType == 'ticket' && firstObject != null) ? firstObject.id : '';
    var secondObjectId = (secondType == 'ticket' && secondObject != null) ? secondObject.id : (secondType == 'chat' && secondObject != null) ? secondObject.cid : '';
    var firstDivVisible = (firstObject != null) ? 'visible' : 'hidden';
    var secondDivVisible = (secondObject != null) ? 'visible' : 'hidden';
    var firstInputDisabled = (firstObject != null) ? ' ui-disabled' : '';
    var secondInputDisabled = (secondObject != null) ? ' ui-disabled' : '';
    var fsSearchData = (firstType == 'ticket' && firstObject != null) ? (secondType == 'ticket') ? ' data-search="second~ticket"' : ' data-search="second~chat"' :' data-search="first~ticket"';
    var inputChangeId = (firstObject == null) ? 'first-link-object-id' : (secondObject == null) ? 'second-link-object-id' : '';
    var bodyString = '<div' + fsSearchData + ' data-input="' + inputChangeId + '" class="lzm-fieldset" id="ticket-linker-first" style="height:auto;">' +
        '<label for="first-link-object-id">' + tidc('ticket_id') + '</label>' +
        '<input type="text" class="lzm-text-input' + firstInputDisabled + '" id="first-link-object-id" value="' + firstObjectId + '" />' +
        '<div id="first-link-div" style="visibility: ' + firstDivVisible + '">';

    if (firstType == 'ticket' && firstObject != null)
        bodyString += that.fillLinkData('first', firstObjectId, true);

    bodyString += '</div></div><div class="lzm-fieldset" id="ticket-linker-second" style="margin-top: 10px;height:auto;">' +
    '<label for="second-link-object-id">' + linkWithLabel + '</label>' +
    '<input type="text" class="lzm-text-input' + secondInputDisabled + '" id="second-link-object-id" value="' + secondObjectId + '" />' +
    '<div id="second-link-div" style="visibility: ' + secondDivVisible + '">';

    if (secondType == 'chat' && secondType != null)
        bodyString += lzm_chatDisplay.archiveDisplay.fillLinkData(secondObjectId, true);

    bodyString += '</div></div>';

    var dialogId, menuEntry, dialogData;
    if (firstType == 'ticket' && firstObject != null)
    {
        var rootMessage = Ticket.GetRootMessage(firstObject);
        dialogId = (typeof lzm_chatDisplay.ticketDialogId[firstObject.id] != 'undefined') ? lzm_chatDisplay.ticketDialogId[firstObject.id] : md5(Math.random().toString());
        var ticketSender = lzm_commonTools.escapeHtml(lzm_commonTools.SubStr(rootMessage.fn, 16,true));
        menuEntry = t('Ticket (<!--ticket_id-->, <!--name-->)',[['<!--ticket_id-->', firstObject.id],['<!--name-->', ticketSender]]);
        dialogData = {'ticket-id': firstObject.id, menu: menuEntry};

        var winObj = TaskBarManager.GetActiveWindow();
        winObj.ShowInTaskBar = false;
        winObj.Minimize();

        lzm_commonDialog.CreateDialogWindow(headerString, bodyString, footerString, 'link', dialogId + '_linker', dialogId + '_linker', 'link-ticket-cancel', true, dialogData, true, winObj.TaskBarIndex);
    }
    else if (secondType == 'chat' && secondObject != null && !inChatDialog)
    {
        // chat with ticket
        lzm_commonDialog.CreateDialogWindow(headerString, bodyString, footerString, 'link', 'link-chat-ticket', 'link-chat-ticket', 'link-ticket-cancel', true, {cid: secondObject.cid, menu: t('Link with Ticket')});
    }
    else if (secondType == 'chat' && secondObject != null)
    {

    }
    UIRenderer.resizeTicketLinker();

    var ticketPollData = null, chatPollData = null, lastTyping = 0, lastSeachId = '', customFilter;
    var handleSearch = function(isSame) {
        if ($('#' + inputChangeId).val() != '' && firstObject == null) {
            if ($('#' + inputChangeId).val().length >= 5 && !isSame) {
                CommunicationEngine.stopPolling();

                customFilter = {};
                customFilter.ticketSort = '';
                customFilter.ticketPage = 1;
                customFilter.ticketQuery = $('#' + inputChangeId).val();
                customFilter.ticketFilterStatus = '0123';
                customFilter.ticketFilterChannel = '01234567';
                customFilter.ticketLimit = 6;
                customFilter.customDemandToken = 'linker';
                CommunicationEngine.customFilters.push(customFilter);
                CommunicationEngine.startPolling();
            }
            $('#link-ticket-link').removeClass('ui-disabled');
            that.fillLinkData('first', $('#' + inputChangeId).val());
        } else if ($('#' + inputChangeId).val() != '') {
            $('#link-ticket-link').removeClass('ui-disabled');
            if (secondType == 'ticket') {
                if ($('#' + inputChangeId).val().length >= 5 && !isSame) {
                    CommunicationEngine.stopPolling();

                    customFilter = {};
                    customFilter.ticketSort = '';
                    customFilter.ticketPage = 1;
                    customFilter.ticketQuery = $('#' + inputChangeId).val();
                    customFilter.ticketFilterStatus = '0123';
                    customFilter.ticketFilterChannel = '01234567';
                    customFilter.ticketLimit = 7;
                    customFilter.customDemandToken = 'linker';
                    CommunicationEngine.customFilters.push(customFilter);
                    CommunicationEngine.startPolling();
                }
                that.fillLinkData('second', $('#' + inputChangeId).val());
            } else {
                if (chatPollData == null) {
                    chatPollData = {p: CommunicationEngine.chatArchivePage, q: CommunicationEngine.chatArchiveQuery, f: CommunicationEngine.chatArchiveFilter,
                        l: CommunicationEngine.chatArchiveLimit, g: CommunicationEngine.chatArchiveFilterGroup, e: CommunicationEngine.chatArchiveFilterExternal,
                        i: CommunicationEngine.chatArchiveFilterInternal};
                    $('#ticket-linker-first').data('chat-poll-data', chatPollData);
                }
                if ($('#' + inputChangeId).val().length >= 5 && !isSame)
                {
                    CommunicationEngine.stopPolling();
                    customFilter = {};
                    customFilter.chatArchivePage = 1;
                    customFilter.chatArchiveQuery = $('#' + inputChangeId).val();
                    customFilter.chatArchiveFilter = '012';
                    customFilter.chatArchiveLimit = 10;
                    customFilter.chatArchiveFilterGroup = '';
                    customFilter.chatArchiveFilterExternal = '';
                    customFilter.chatArchiveFilterInternal = '';
                    customFilter.customDemandToken = 'linker';
                    CommunicationEngine.customFilters.push(customFilter);
                    CommunicationEngine.startPolling();
                }
                lzm_chatDisplay.archiveDisplay.fillLinkData($('#' + inputChangeId).val());
            }
        } else {
            $('#link-ticket-link').addClass('ui-disabled');
            var position = (firstObject == null) ? 'first' : 'second';
            $('#' + position + '-link-div').css({'visibility': 'hidden'});
            ticketPollData = null;
            chatPollData = null;
        }
    };
    if (inputChangeId != '') {
        $('#' + inputChangeId).keyup(function() {
            lastTyping = lzm_chatTimeStamp.getServerTimeString(null, false, 1);
            setTimeout(function() {
                var now = lzm_chatTimeStamp.getServerTimeString(null, false, 1);
                if (lastTyping != 0 && now - lastTyping > 570) {
                    handleSearch(lastSeachId == $('#' + inputChangeId).val());
                    lastSeachId = $('#' + inputChangeId).val();
                }
            }, 600);
        });
    }

    $('#link-ticket-link').click(function(){
        linkTicket(firstType + '~' + secondType, $('#first-link-object-id').val(), $('#second-link-object-id').val());
        $('#link-ticket-cancel').click();
    });
    $('#link-ticket-cancel').click(function(){
        if (firstType == 'ticket' && firstObject != null)
        {
            TaskBarManager.RemoveWindowByDialogId(dialogId + '_linker');
            TaskBarManager.Maximize(dialogId);
        }
        else if (secondType == 'chat' && secondObject != null && inChatDialog)
        {

        }
        else
        {
            TaskBarManager.RemoveWindowByDialogId('link-chat-ticket');
        }
    });
};

ChatTicketClass.prototype.fillLinkData = function(position, ticketId, onlyReturnHtml, doNotClear) {
    onlyReturnHtml = (typeof onlyReturnHtml != 'undefined') ? onlyReturnHtml : false;
    doNotClear = (typeof doNotClear != 'undefined') ? doNotClear : false;
    doNotClear = doNotClear && $('#first-link-div').css('visibility') == 'visible';
    var myTicket = null, tableString = '';
    for (var i=0; i<lzm_chatDisplay.ticketListTickets.length; i++) {
        if (lzm_chatDisplay.ticketListTickets[i].id == ticketId) {
            myTicket = lzm_commonTools.clone(lzm_chatDisplay.ticketListTickets[i]);
        }
    }

    if (myTicket != null)
    {
        var rootMessage = Ticket.GetRootMessage(myTicket);
        var ticketCreationDate = lzm_chatTimeStamp.getLocalTimeObject(rootMessage.ct * 1000, true);
        var ticketCreationDateHuman = lzm_commonTools.getHumanDate(ticketCreationDate, 'full', lzm_chatDisplay.userLanguage);
        tableString = '<table>' +

            '<tr><th rowspan="6"><i class="fa fa-envelope icon-green icon-xl"></i></th><th>' + t('Name:') + '</th><td>' + lzm_commonTools.escapeHtml(rootMessage.fn) + '</td></tr>' +
            '<tr><th>' + t('Email:') + '</th><td>' + lzm_commonTools.escapeHtml(rootMessage.em) + '</td></tr>' +
            '<tr><th>' + t('Company:') + '</th><td>' + lzm_commonTools.escapeHtml(rootMessage.co) + '</td></tr>' +
            '<tr><th>' + t('Phone:') + '</th><td>' + lzm_commonTools.escapeHtml(rootMessage.p) + '</td></tr>' +
            '<tr><th>' + tidc('date') + '</th><td>' + ticketCreationDateHuman + '</td></tr>' +
            '<tr><th>' + tidc('visitor_id') + '</th><td>' + rootMessage.ui + '</td></tr>' +
            '</table>';

        if (!onlyReturnHtml)
            $('#' + position + '-link-div').css({'visibility': 'visible'});
    } else {
        if (!onlyReturnHtml && !doNotClear)
            $('#' + position + '-link-div').css({'visibility': 'hidden'});
    }

    if (!onlyReturnHtml && !(doNotClear && tableString==''))
        $('#' + position + '-link-div').html(tableString);

    return tableString;
};

ChatTicketClass.prototype.ShowEmailLists = function() {

    if(TaskBarManager.WindowExists('email-list') && !TaskBarManager.GetWindow('email-list').ShowInTaskBar)
        return;

    if(TaskBarManager.WindowExists('email-list'))
    {
        TaskBarManager.Maximize('email-list');
        return;
    }

    lzm_chatDisplay.emailDeletedArray = [];
    lzm_chatDisplay.ticketsFromEmails = [];
    lzm_commonTools.clearEmailReadStatusArray();

    var headerString = tid('emails');
    var footerString = lzm_inputControls.createButton('save-email-list', '','', t('Ok'), '', 'lr',    {'margin-left': '6px'}, '' ,30, 'd') +
        lzm_inputControls.createButton('cancel-email-list', '','', t('Cancel'), '', 'lr', {'margin-left': '6px'}, '' ,30, 'd') +
        '<span style="float:left;">' +
        lzm_inputControls.createButton('delete-email', '','', tidc('delete',' (Del)'), '<i class="fa fa-remove"></i>', 'lr', {'margin-left': '6px'} , '' ,30, 'd') +
        lzm_inputControls.createButton('create-ticket-from-email', '','', t('Create Ticket'), '<i class="fa fa-plus"></i>', 'lr', {'margin-left': '6px'}, '' ,30, 'd') +
        lzm_inputControls.createButton('reset-emails', 'ui-disabled','', tid('reset'), '<i class="fa fa-undo"></i>', 'lr', {'margin-left': '6px'}, '' ,30, 'd')+
        '</span>';

    var bodyString = '<div id="open-emails"><div id="email-list-placeholder"></div></div>';
    var emailActiveContent = '<div id="email-list-loading"><div class="lz_anim_loading"></div></div>';
    emailActiveContent += '<div id="incoming-email-list-active"></div><div id="email-details"><div id="email-placeholder" data-selected-email="0"></div></div>';

    var emailDeletedContent = '<div id="incoming-email-list-deleted"></div>';

    var dialogId = lzm_commonDialog.CreateDialogWindow(headerString, bodyString, footerString, 'envelope', 'email-list', 'email-list','cancel-email-list');
    var emailContentHtml = '<div id="email-content"></div>';
    var emailHtmlHtml = '<div id="email-html"></div>';
    var emailAttachmentHtml = '<div id="email-attachment-list"></div>';

    lzm_inputControls.createTabControl('email-list-placeholder', [{name: tid('open'), content: emailActiveContent},{name: tid('ticket_status_3'), content: emailDeletedContent}]);
    lzm_inputControls.createTabControl('email-placeholder', [{name: tid('text'), content: emailContentHtml},{name: 'HTML', content: emailHtmlHtml}, {name: t('Attachments'), content: emailAttachmentHtml}]);

    var myHeight = $('#email-list-body').height() + 10;
    var listHeight = Math.floor(Math.max(myHeight / 2, 175) - 45);
    var contentHeight = (myHeight - listHeight) - 83;

    $('.email-placeholder-content').css({height: contentHeight + 'px'});
    $('#email-list-loading').css({'z-index': 1000000, background: 'var(--main-floor-color)',left:0, right:0, top:0, bottom:'40px', position: 'absolute' });

    $('.email-placeholder-tab').click(function(){
        UIRenderer.resizeEmailDetails();
    });
    $('#cancel-email-list').click(function(){
        lzm_chatDisplay.emailDeletedArray = [];
        lzm_chatDisplay.ticketsFromEmails = [];
        toggleEmailList();
        TaskBarManager.RemoveActiveWindow();
    });
    $('#save-email-list').click(function(){
        saveEmailListChanges('', false);
        $('#cancel-email-list').click();
    });
    $('#delete-email').click(function(){
        ChatTicketClass.DeleteEmail();
    });
    $('#create-ticket-from-email').click(function() {
        if (PermissionEngine.checkUserPermissions('', 'tickets', 'create_tickets', {}))
        {
            var emailId = $('#email-placeholder').data('selected-email-id');
            var emailNo = $('#email-placeholder').data('selected-email');
            $('#reset-emails').removeClass('ui-disabled');
            $('#delete-email').addClass('ui-disabled');
            $('#create-ticket-from-email').addClass('ui-disabled');
            $('#email-list-line-' + emailNo).children('td:first').html('<i class="fa fa-plus" style="color: #00bb00;"></i>');
            saveEmailListChanges(emailId, true);
            ChatTicketClass.__ShowTicket('', false, emailId, '', '', dialogId);
            $('#email-list-body').data('selected-email', emailNo);
            $('#email-list-body').data('selected-email-id', emailId);
        }
        else
            showNoPermissionMessage();
    });
    $('#reset-emails').click(function(){
        $('.selected-table-line').each(function(i, obj) {
            if($(obj).hasClass('email-list-line')){
                var emailId = $(obj).attr('data-id');
                var emailNo = $(obj).attr('data-line-number');
                lzm_commonTools.removeEmailFromDeleted(emailId);
                lzm_commonTools.removeEmailFromTicketCreation(emailId);
                $('#email-list-line-' + emailNo).children('td:first').html('<i class="fa fa-envelope-o"></i>');
                $('#reset-emails').addClass('ui-disabled');
                $('#delete-email').removeClass('ui-disabled');
                $('#create-ticket-from-email').removeClass('ui-disabled');
                if (lzm_commonTools.checkEmailIsLockedBy(emailId, lzm_chatDisplay.myId)) {
                    saveEmailListChanges(emailId, false);
                }
            }
        });
    });
    $('.email-list-placeholder-tab').click(function(){

        var tindex = $(this).data('tab-no');
        $('#email-list-placeholder-tabs-row').data('selected-tab',tindex);
        ChatTicketClass.SetEmailButtonLine();
    });
};

ChatTicketClass.prototype.UpdateEmailLists = function() {

    var emailList,selectedLine,that = this, i;
    var elist = [
        {type:'active',list:DataEngine.emails},
        {type:'deleted',list:DataEngine.EmailsDeleted}
    ];

    ChatTicketClass.EmailListUpdate = false;

    for(var key in elist)
    {
        emailList = elist[key].list;

        if(elist[key].type == 'active')
        {
            selectedLine = $('#email-placeholder').data('selected-email');
            selectedLine = (typeof selectedLine != 'undefined') ? selectedLine : $('#email-list-body').data('selected-email');

            if(emailList.length > selectedLine)
            {
                $('#email-placeholder').data('selected-email-id', emailList[selectedLine].id);
                if (lzm_commonTools.checkEmailReadStatus($('#email-placeholder').data('selected-email-id')) == -1 && lzm_chatTimeStamp.getServerTimeString(null, true) - emailList[selectedLine].c <= 1209600)
                    lzm_chatDisplay.emailReadArray.push({id: emailList[selectedLine].id, c: emailList[selectedLine].c});
            }
            else
            {
                $('#email-placeholder').data('selected-email-id', 0);
            }
        }

        var emailListHtml = '' +
            '<table id="incoming-email-table-'+elist[key].type+'" class="visible-list-table alternating-rows-table lzm-unselectable"><thead><tr>' +
            '<th style="width: 18px !important;"></th>' +
            '<th style="width: 18px !important;"></th>' +
            '<th>' + t('Date') + '</th>' +
            '<th>' + tid('subject') + '</th>' +
            '<th>' + t('Email') + '</th>' +
            '<th>' + t('Name') + '</th>';

        if(elist[key].type == 'active')
        {
            emailListHtml += '<th>' + t('Group') + '</th>';
            emailListHtml += '<th>' + t('Sent to') + '</th>';
        }
        else
            emailListHtml += '<th>' + tid('operator') + '</th>';

        emailListHtml += '</tr></thead><tbody>';

        for (i=0; i<emailList.length; i++)
        {
            var group = DataEngine.groups.getGroup(emailList[i].g);
            emailListHtml += that.CreateEmailListLine(emailList[i], i, group);
        }
        emailListHtml += '</tbody>';

        if (elist[key].type == 'active' && DataEngine.emailCount > CommunicationEngine.emailAmount)
        {
            emailListHtml += '<tfoot><tr><td colspan="8" id="emails-load-more-'+elist[key].type+'"><span>' + tid('load_more_emails') + '</span></td></tr></tfoot>';
        }
        else if (elist[key].type != 'active' && DataEngine.EmailCountDeleted > CommunicationEngine.EmailAmountDeleted)
        {
            emailListHtml += '<tfoot><tr><td colspan="7" id="emails-load-more-'+elist[key].type+'"><span>' + tid('load_more_emails') + '</span></td></tr></tfoot>';
        }
        emailListHtml += '</table>';


        if(elist[key].type == 'active')
        {
            var selMail = emailList.length ? emailList[selectedLine] : {text:'',id:'',n:'',s:''};

            if(d(selMail) && selMail != null)
            {
                var emailText = lzm_commonTools.htmlEntities(selMail.text).replace(/\r\n/g, '<br>').replace(/\r/g, '<br>').replace(/\n/g, '<br>');
                var contentHtml = this.createEmailPreview(emailText,selMail);
                var attachmentHtml = that.createTicketAttachmentTable({}, selMail, -1, false);

                $('#email-content').html(contentHtml);
                $('#email-html').html(ChatTicketClass.GetSecureMailFrame('EMAIL',true,selMail.id));
                $('#email-attachment-list').html(attachmentHtml);
                $('#email-list-loading').remove();
            }
        }

        $('#incoming-email-list-'+elist[key].type).html(emailListHtml);

        if(emailList.length && elist[key].type == 'active')
        {
            if (DataEngine.emails[selectedLine].ei != '' && DataEngine.emails[selectedLine].ei != lzm_chatDisplay.myId)
            {


            }
            else if (DataEngine.emails[selectedLine].ei != '' && DataEngine.emails[selectedLine].ei == lzm_chatDisplay.myId)
            {
                $('#reset-emails').removeClass('ui-disabled');
            }

            $('.email-list-line').click(function(e) {

                var oldSelectedLine = selectedLine,i;
                var newSelectedLine = $(this).data('line-number');
                var isMultiLine = (e.shiftKey || e.ctrlKey);
                var isShiftSelect = (e.shiftKey);
                var emailId = DataEngine.emails[selectedLine].id;

                if(!isMultiLine)
                    $('.email-list-line').removeClass('selected-table-line');

                if (DataEngine.emails[oldSelectedLine].ei != '')
                {
                    if (lzm_commonTools.checkEmailTicketCreation(emailId) == -1 && $.inArray(emailId, lzm_chatDisplay.emailDeletedArray) == -1)
                        $('#email-list-line-' + oldSelectedLine).children('td:first').html('<i class="fa fa-lock icon-orange"></i>');
                    $('#email-list-line-' + oldSelectedLine).addClass('locked-email-line');
                }

                if(isShiftSelect && Math.abs($(this).data('line-number')-oldSelectedLine) > 1)
                {
                    if(newSelectedLine>selectedLine)
                        for(i=selectedLine;i<newSelectedLine;i++)
                            $('#email-list-line-' + i).addClass('selected-table-line');
                    else if(newSelectedLine<selectedLine)
                        for(i=selectedLine;i>newSelectedLine;i--)
                            $('#email-list-line-' + i).addClass('selected-table-line');
                }

                selectedLine = newSelectedLine;
                that.selectedEmailNo = newSelectedLine;
                emailId = DataEngine.emails[selectedLine].id;

                if(newSelectedLine > DataEngine.emails.length -5)
                {
                    $('#emails-load-more-active').click();
                }

                $('#email-list-line-' + selectedLine).removeClass('locked-email-line');
                $('#email-list-line-' + selectedLine).addClass('selected-table-line');
                $('#email-placeholder').data('selected-email', selectedLine);
                $('#email-placeholder').data('selected-email-id', emailId);

                var emailText = lzm_commonTools.htmlEntities(DataEngine.emails[selectedLine].text).replace(/\r\n/g, '<br>').replace(/\r/g, '<br>').replace(/\n/g, '<br>');
                var contentHtml = that.createEmailPreview(emailText,DataEngine.emails[selectedLine]);
                var emailHTML = (DataEngine.emails[selectedLine].ishtml == 1) ? ChatTicketClass.GetSecureMailFrame('EMAIL',true,DataEngine.emails[selectedLine].id) : "";
                var attachmentHtml = that.createTicketAttachmentTable({}, DataEngine.emails[selectedLine], -1, false);


                ChatTicketClass.SetAttachmentTabCount(DataEngine.emails[selectedLine]);

                if(DataEngine.emails[selectedLine].ishtml != 1)
                {
                    $('#email-placeholder-tab-1').addClass('ui-disabled');

                    if($('#email-placeholder-tab-1').hasClass('lzm-tabs-selected'))
                        $('#email-placeholder-tab-0').click();
                }
                else
                    $('#email-placeholder-tab-1').removeClass('ui-disabled');

                $('#email-content').html(contentHtml);
                $('#email-html').html(emailHTML);
                $('#email-attachment-list').html(attachmentHtml);

                if (d(DataEngine[selectedLine]) && lzm_commonTools.checkEmailReadStatus(DataEngine.emails[selectedLine].id) == -1 && lzm_chatTimeStamp.getServerTimeString(null, true) - DataEngine.emails[selectedLine].c <= 1209600)
                {
                    lzm_chatDisplay.emailReadArray.push({id: DataEngine[selectedLine].id, c: DataEngine[selectedLine].c});
                    if (DataEngine[selectedLine].ei != '')
                    {
                        if (lzm_commonTools.checkEmailTicketCreation(emailId) == -1 && $.inArray(emailId, lzm_chatDisplay.emailDeletedArray) == -1) {
                            $('#email-list-line-' + selectedLine).children('td:first').html('<i class="fa fa-lock icon-orange"></i>');
                        }
                    } else {
                        $('#email-list-line-' + selectedLine).children('td:first').html('<i class="fa fa-envelope-o"></i>');
                    }
                    $('#email-list-line-' + selectedLine).children('td').css('font-weight', 'normal');
                }

                if (DataEngine.emails[selectedLine].ei != '' && DataEngine.emails[selectedLine].ei != lzm_chatDisplay.myId)
                {
                    $('#reset-emails').addClass('ui-disabled');
                    $('#delete-email').addClass('ui-disabled');
                    $('#create-ticket-from-email').addClass('ui-disabled');
                }
                else
                {
                    if (lzm_commonTools.checkEmailTicketCreation(emailId) != -1 || $.inArray(emailId, lzm_chatDisplay.emailDeletedArray) != -1)
                    {
                        $('#reset-emails').removeClass('ui-disabled');
                        $('#delete-email').addClass('ui-disabled');
                        $('#create-ticket-from-email').addClass('ui-disabled');
                    }
                    else if (DataEngine.emails[selectedLine].ei != '' && DataEngine.emails[selectedLine].ei == lzm_chatDisplay.myId)
                    {
                        $('#reset-emails').removeClass('ui-disabled');
                        $('#delete-email').removeClass('ui-disabled');
                        $('#create-ticket-from-email').removeClass('ui-disabled');
                    }
                    else
                    {
                        $('#reset-emails').addClass('ui-disabled');
                        $('#delete-email').removeClass('ui-disabled');
                        $('#create-ticket-from-email').removeClass('ui-disabled');
                    }
                }
                UIRenderer.resizeEmailDetails();
            });
        }
        $('#emails-load-more-'+elist[key].type).click(function(){

            CommunicationEngine.emailUpdateTimestamp = 0;
            if($(this).attr('id').endsWith('active'))
            {
                CommunicationEngine.emailAmount += 20;
                CommunicationEngine.removePropertyFromDataObject('p_de_a');
                CommunicationEngine.addPropertyToDataObject('p_de_a', CommunicationEngine.emailAmount);
                $('#incoming-email-table-active').children('tfoot').remove();
            }
            else
            {
                CommunicationEngine.EmailAmountDeleted += 40;
                CommunicationEngine.removePropertyFromDataObject('p_de_ad');
                CommunicationEngine.addPropertyToDataObject('p_de_ad', CommunicationEngine.EmailAmountDeleted);
                $('#incoming-email-table-active-deleted').children('tfoot').remove();
            }

            CommunicationEngine.InstantPoll();
        });
    }

    ChatTicketClass.SetEmailButtonLine();
    ChatTicketClass.SetAttachmentTabCount(selMail);

    UIRenderer.resizeEmailDetails();
};

ChatTicketClass.SetAttachmentTabCount = function(_email){

    var atcount = 0;
    if(_email != null && d(_email.attachment))
        atcount = _email.attachment.length;

    var dataTitle = $('#email-placeholder-tab-2').data('title');
    var title = $('#email-placeholder-tab-2').html();

    if(!d(dataTitle))
        $('#email-placeholder-tab-2').data('title',title);

    dataTitle = $('#email-placeholder-tab-2').data('title');


    if(atcount > 0)
    {
        $('#email-placeholder-tab-2').removeClass('ui-disabled');
        $('#email-placeholder-tab-2').html(dataTitle + ' (' + atcount + ')');
    }
    else
    {
        $('#email-placeholder-tab-2').html(dataTitle);
        $('#email-placeholder-tab-2').addClass('ui-disabled');
    }


};

ChatTicketClass.prototype.createEmailPreview = function(emailText,email) {

    var blockwarning = '';
    if(d(email.ei) && email.ei != '')
    {
        var opname = DataEngine.operators.getOperator(email.ei)!=null ? DataEngine.operators.getOperator(email.ei).name : email.ei;
        blockwarning = '<span class="right-space top-space right-button-list bg-red text-white text-box"><span class="fa fa-lock text-white"></span>&nbsp;&nbsp;'+opname+'</span>';
    }

    var html = '<div class="lzm-dialog-headline3" style="padding:3px;">' +blockwarning+
        '<div id="email-sender-name"><b>' + t("Name") + "</b>: " + lzm_commonTools.htmlEntities(email.n) + '</div>' +
        '<div id="email-subject"><b>' + t("Subject") + "</b>: " + lzm_commonTools.htmlEntities(email.s) + '</div>' +
        '</div>' +
        '<div id="email-text" style="overflow-y:auto;padding:10px;">' + emailText + '</div>';

    return html;
};

ChatTicketClass.prototype.CreateEmailListLine = function(email, lineNumber, group) {

    var deleted = !d(email.rt);
    var selectedClass = (!deleted && lineNumber == $('#email-placeholder').data('selected-email')) ? ' selected-table-line' : '';

    if(!deleted)
        selectedClass = ' email-list-line' + selectedClass;

    var statusIcon = '<i class="fa fa-envelope"></i>';
    var fontWeight = deleted ? 'normal' : 'bold';

    if ($.inArray(email.id, lzm_chatDisplay.emailDeletedArray) != -1)
    {
        statusIcon = '<i class="fa fa-remove icon-red"></i>';
        fontWeight = 'normal';
    }
    else if (lzm_commonTools.checkEmailTicketCreation(email.id) != -1)
    {
        statusIcon = '<i class="fa fa-plus icon-green"></i>';
        fontWeight = 'normal';
    }
    else if (email.ei != '' && !deleted)
    {
        statusIcon = '<i class="fa fa-lock icon-orange"></i>';
        fontWeight = 'normal';
        if (lineNumber != $('#email-placeholder').data('selected-email')) {
            selectedClass += ' locked-email-line';
        }
    }
    else if (lzm_chatTimeStamp.getServerTimeString(null, true) - email.c > 1209600 || lzm_commonTools.checkEmailReadStatus(email.id) != -1)
    {
        statusIcon = '<i class="fa fa-envelope-o"></i>';
        fontWeight = 'normal';
    }

    var secondField = (email.attachment.length > 0) ? '<i class="fa fa-paperclip"></i>' : '';
    if(deleted)
    {
        statusIcon = '<i class="fa fa-trash-o"></i>';
        secondField = lzm_inputControls.createButton('rest-e-' + lzm_commonTools.htmlEntities(email.id), '', 'ChatTicketClass.RestoreEmail(\''+lzm_commonTools.htmlEntities(email.id)+'\');', tid('reset'), '', 'force-text',{margin:'2px 1px',display:'inline-block',width:'90px'}, '', 17, 'd');
    }

    var gid = (group != null) ? group.id : '?';

    var id = 'email-list-line-' + lineNumber;

    if(deleted)
    {
        id = 'deleted-' + id;
    }

    var emailTime = lzm_chatTimeStamp.getLocalTimeObject(email.c * 1000, true);
    var emailHtml = '<tr class="lzm-unselectable' + selectedClass + '" id="' + id + '" data-id="'+email.id+'" data-line-number="' + lineNumber + '">' +
        '<td class="icon-column" style="font-weight: ' + fontWeight + '; text-align:center;padding:0 10px;">' + statusIcon + '</td>' +
        '<td class="icon-column" style="font-weight: ' + fontWeight + '; text-align:center;padding:0 6px;">' + secondField + '</td>' +
        '<td style="font-weight: ' + fontWeight + '; white-space: nowrap;">' + lzm_commonTools.getHumanDate(emailTime, '', lzm_chatDisplay.userLanguage) + '</td>' +
        '<td style="font-weight: ' + fontWeight + '; white-space: nowrap;">' + lzm_commonTools.htmlEntities(lzm_commonTools.SubStr(email.s,30,true)) + '</td>' +
        '<td style="font-weight: ' + fontWeight + '; white-space: nowrap;">' + lzm_commonTools.htmlEntities(lzm_commonTools.SubStr(email.e,40,true)) + '</td>' +
        '<td style="font-weight: ' + fontWeight + '; white-space: nowrap;">' + lzm_commonTools.htmlEntities(lzm_commonTools.SubStr(email.n,30,true)) + '</td>';

    if(!deleted)
    {
        emailHtml += '<td style="font-weight: ' + fontWeight + '; white-space: nowrap;">' + gid + '</td>';
        emailHtml += '<td style="font-weight: ' + fontWeight + '; white-space: nowrap;">' + email.r + '</td>';
    }
    else
    {
        var opname = DataEngine.operators.getOperator(email.ei)!=null ? DataEngine.operators.getOperator(email.ei).name : email.ei;
        emailHtml += '<td style="font-weight: ' + fontWeight + '; white-space: nowrap;">' + lzm_commonTools.htmlEntities(opname) + '</td>';
    }

    emailHtml += '</tr>';
    
    return emailHtml;
};

ChatTicketClass.prototype.checkTicketTakeOverReply = function() {
    var rtValue = PermissionEngine.checkUserPermissions('', 'tickets', 'assign_operators', {});
    if (!rtValue)
    {
        showNoPermissionMessage();
    }
    return rtValue;
};

ChatTicketClass.prototype.ticketMessageSortfunction = function(a,b) {
    var rtValue = (parseInt(a.ct) < parseInt(b.ct)) ? -1 : (parseInt(a.ct) > parseInt(b.ct)) ? 1 : 0;
    return rtValue;
};

ChatTicketClass.prototype.MissingTicketDetailsChangePermission = function (ticket, changedValues) {
    var rtValue = false;
    if (d(ticket.editor) && ticket.editor != false && ticket.editor.st != changedValues.status)
    {
        if (!PermissionEngine.checkUserPermissions('', 'tickets', 'status_open', {}) && changedValues.status == 0)
            rtValue = 'status_open';

        if(!PermissionEngine.checkUserPermissions('', 'tickets', 'status_progress', {}) && changedValues.status == 1)
            rtValue = 'status_progress';

        if(!PermissionEngine.checkUserPermissions('', 'tickets', 'status_closed', {}) && changedValues.status == 2)
            rtValue = 'status_closed';

        if(!PermissionEngine.checkUserPermissions('', 'tickets', 'status_deleted', {}) && changedValues.status == 3)
            rtValue = 'status_deleted';

    }
    else if ((typeof ticket.editor == 'undefined' || ticket.editor == false) && changedValues.status != 0)
    {
        if (!PermissionEngine.checkUserPermissions('', 'tickets', 'status_progress', {}) && changedValues.status == 1)
            rtValue = 'status_progress';

        if (!PermissionEngine.checkUserPermissions('', 'tickets', 'status_closed', {}) && changedValues.status == 2)
            rtValue = 'status_closed';

        if(!PermissionEngine.checkUserPermissions('', 'tickets', 'status_deleted', {}) && changedValues.status == 3)
            rtValue = 'status_deleted';
    }

    if(!(d(ticket.editor) && ticket.editor.ed == changedValues.editor))
        if(!PermissionEngine.checkUserPermissions('', 'tickets', 'assign_operators', {}))
            rtValue = 'assign_operators';

    if(ticket.gr != changedValues.group)
        if(!PermissionEngine.checkUserPermissions('', 'tickets', 'assign_groups', {}))
            rtValue = 'assign_groups';

    return rtValue;
};

ChatTicketClass.prototype.createTicketDetailsChangeHandler = function(selectedTicket) {
    var that = this;
    var selected = '', statusSelect = $('#ticket-details-status'), subStatusSelect = $('#ticket-details-sub-status'),channelSelect = $('#ticket-details-channel'), subChannelSelect = $('#ticket-details-sub-channel');

    statusSelect.change(function() {
        subStatusSelect.find('option').remove();
        subStatusSelect.append('<option value="">-</option>');
        var myStatus = statusSelect.val();
        for(key in DataEngine.global_configuration.database['tsd'])
        {
            var elem = DataEngine.global_configuration.database['tsd'][key];
            if(elem.type == 0 && elem.parent == myStatus){
                selected = (selectedTicket.editor && selectedTicket.editor.ss == elem.name) ? ' selected' : '';
                subStatusSelect.append('<option value="'+elem.name+'"'+selected+'>'+elem.name+'</option>');
            }
        }
        if($('#ticket-details-sub-status option').length==0)
        {
            subStatusSelect.append('<option>-</option>');
            subStatusSelect.addClass('ui-disabled');
        }
        else
            subStatusSelect.removeClass('ui-disabled');
    });
    statusSelect.change();
    channelSelect.change(function() {
        subChannelSelect.find('option').remove();
        subChannelSelect.append('<option value="">-</option>');
        var myChannel = channelSelect.val();
        for(key in DataEngine.global_configuration.database['tsd'])
        {
            var elem = DataEngine.global_configuration.database['tsd'][key];
            if(elem.type == 1 && elem.parent == myChannel){
                selected = (selectedTicket.s == elem.name) ? ' selected' : '';
                subChannelSelect.append('<option value="'+elem.name+'"'+selected+'>'+elem.name+'</option>');
            }
        }
        if($('#ticket-details-sub-channel option').length==0)
        {
            subChannelSelect.append('<option>-</option>');
            subChannelSelect.addClass('ui-disabled');
        }
        else
            subChannelSelect.removeClass('ui-disabled');
    });
    channelSelect.change();

    $('#ticket-details-group').change(function() {


        var i, selectedString;
        var selectedGroupId = $('#ticket-details-group').val();
        var selectedOperator = $('#ticket-details-editor').val();
        var operators = DataEngine.operators.getOperatorList('name');
        var editorSelectString = '<option value="-1">' + tid('none') + '</option>';

        for (i=0; i<operators.length; i++)
        {
            if (operators[i].isbot != 1 && $.inArray(selectedGroupId,operators[i].groups) != -1)
            {
                selectedString = (operators[i].id == selectedOperator) ? ' selected="selected"' : '';
                editorSelectString += '<option value="' + operators[i].id + '"' + selectedString + '>' + operators[i].name + '</option>';
            }
        }
        var selectedLanguage = $('#ticket-details-language').val();
        var availableLanguages = [];
        var group = DataEngine.groups.getGroup(selectedGroupId);
        for (i=0; i<group.pm.length; i++) {
            availableLanguages.push(group.pm[i].lang);
        }
        if ( typeof selectedTicket.l != 'undefined' && $.inArray(selectedTicket.l, availableLanguages) == -1) {
            availableLanguages.push(selectedTicket.l);
        }
        if ($.inArray(selectedLanguage, availableLanguages) == -1) {
            availableLanguages.push(selectedLanguage);
        }
        var langSelectString = '';
        for (i=0; i<availableLanguages.length; i++) {
            selectedString = (availableLanguages[i] == selectedLanguage) ? ' selected="selected"' : '';
            langSelectString += '<option value="' + availableLanguages[i] + '"' + selectedString + '>' + lzm_chatDisplay.getLanguageDisplayName(availableLanguages[i]) + '</option>';
        }
        $('#ticket-details-editor').html(editorSelectString).trigger('create');
        $('#ticket-details-language').html(langSelectString).trigger('create');
        that.saveUpdatedTicket(selectedTicket,null,selectedGroupId);

    });
    $('#ticket-details-language').change(function() {
        that.saveUpdatedTicket(selectedTicket,$('#ticket-details-language').val(),null);
    });

    $('#ticket-details-group').change();
};

ChatTicketClass.prototype.saveUpdatedTicket = function(ticket,lang,group) {
    if(!(this.updatedTicket!=null && this.updatedTicket.id == ticket.id))
        this.updatedTicket = lzm_commonTools.clone(ticket);
    if(lang != null)
        this.updatedTicket.l = lang;
    if(group != null)
        this.updatedTicket.gr = group;
};

ChatTicketClass.prototype.createTicketListContextMenu = function(myObject, place, widthOffset) {
    var contextMenuHtml = '',disabledClass,elem,key;
    var dialogId = (place == 'ticket-list') ? '' : $('#visitor-information').data('dialog-id');
    contextMenuHtml += '<div onclick="ChatTicketClass.__ShowTicket(\'' + myObject.id + '\', true, \'\', \'\', \'\', \'' + dialogId + '\');"><span id="show-ticket-details" class="cm-line cm-click">' + t('Open Ticket') + '</span></div><hr />';

    if($.inArray(myObject.id,DataEngine.ticketWatchList) == -1)
        contextMenuHtml += '<div onclick="addTicketToWatchList(\'' + myObject.id + '\',\'' + DataEngine.myId + '\');"><span id="add-ticket-to-wl" class="cm-line cm-click">' + tid('add_to_watch_list') + '</span></div>';
    else
        contextMenuHtml += '<div onclick="removeTicketFromWatchList(\'' + myObject.id + '\');"><span id="add-ticket-to-wl" class="cm-line cm-click">' + tid('remove_from_watch_list') + '</span></div>';

    contextMenuHtml += '<div onclick="showSubMenu(\'' + place + '\', \'add_to_watch_list\', \'' + myObject.id + '\', %CONTEXTX%, %CONTEXTY%, %MYWIDTH%+'+widthOffset+', %MYHEIGHT%)"><span id="show-group-submenu" class="cm-line cm-click">' + tid('add_to_watch_list_of') + '</span><i class="fa fa-caret-right lzm-ctxt-right-fa"></i></div><hr />';
    contextMenuHtml += '<div onclick="showSubMenu(\'' + place + '\', \'ticket_priority\', \'' + myObject.id + '\', %CONTEXTX%, %CONTEXTY%, %MYWIDTH%+'+widthOffset+', %MYHEIGHT%)"><span id="show-group-submenu" class="cm-line cm-click">' + tid('priority') + '</span><i class="fa fa-caret-right lzm-ctxt-right-fa"></i></div>';
    contextMenuHtml += '<div onclick="showSubMenu(\'' + place + '\', \'ticket_status\', \'' + myObject.id + '\', %CONTEXTX%, %CONTEXTY%, %MYWIDTH%+'+widthOffset+', %MYHEIGHT%)"><span id="show-group-submenu" class="cm-line cm-click">' + tid('status') + '</span><i class="fa fa-caret-right lzm-ctxt-right-fa"></i></div>';

    disabledClass = ' class="ui-disabled"';

    var tstatus = myObject.editor ? myObject.editor.st : 0;

    for(key in DataEngine.global_configuration.database['tsd'])
    {
        elem = DataEngine.global_configuration.database['tsd'][key];
        if(elem.type == 0 && elem.parent == tstatus)
            disabledClass = '';
    }

    contextMenuHtml += '<div onclick="showSubMenu(\'' + place + '\', \'ticket_sub_status\', \'' + myObject.id + '\', %CONTEXTX%, %CONTEXTY%, %MYWIDTH%+'+widthOffset+', %MYHEIGHT%)"'+disabledClass+'><span id="show-group-submenu" class="cm-line cm-click">' + tid('sub_status') + '</span><i class="fa fa-caret-right lzm-ctxt-right-fa"></i></div>';
    //contextMenuHtml += '<div onclick="showSubMenu(\'' + place + '\', \'ticket_channel\', \'' + myObject.id + '\', %CONTEXTX%, %CONTEXTY%, %MYWIDTH%+'+widthOffset+', %MYHEIGHT%)"><span id="show-group-submenu" class="cm-line cm-click">' + tid('source') + '</span><i class="fa fa-caret-right lzm-ctxt-right-fa"></i></div>';

    disabledClass = ' class="ui-disabled"';

    var tchannel = myObject.t;
    for(key in DataEngine.global_configuration.database['tsd'])
    {
        elem = DataEngine.global_configuration.database['tsd'][key];
        if(elem.type == 1 && elem.parent == tchannel)
            disabledClass = '';
    }

    contextMenuHtml += '<div onclick="showSubMenu(\'' + place + '\', \'ticket_sub_source\', \'' + myObject.id + '\', %CONTEXTX%, %CONTEXTY%, %MYWIDTH%+'+widthOffset+', %MYHEIGHT%)"'+disabledClass+'><span id="show-group-submenu" class="cm-line cm-click">' + tid('sub_source') + '</span><i class="fa fa-caret-right lzm-ctxt-right-fa"></i></div>';

    disabledClass = !PermissionEngine.checkUserPermissions('', 'tickets', 'assign_operators', {}) ? ' class="ui-disabled"' : '';
    contextMenuHtml += '<div' + disabledClass + ' onclick="showSubMenu(\'' + place + '\', \'operator\', \'' + myObject.id + '\', %CONTEXTX%, %CONTEXTY%, %MYWIDTH%+'+widthOffset+', %MYHEIGHT%)"><span id="show-operator-submenu" class="cm-line cm-click">' + tid('operator') + '</span><i class="fa fa-caret-right lzm-ctxt-right-fa"></i></div>';

    disabledClass = !PermissionEngine.checkUserPermissions('', 'tickets', 'assign_groups', {}) ? ' class="ui-disabled"' : '';
    contextMenuHtml += '<div' + disabledClass + ' onclick="showSubMenu(\'' + place + '\', \'group\', \'' + myObject.id + '\', %CONTEXTX%, %CONTEXTY%, %MYWIDTH%+'+widthOffset+', %MYHEIGHT%)"><span id="show-group-submenu" class="cm-line cm-click">' + tid('group') + '</span><i class="fa fa-caret-right lzm-ctxt-right-fa"></i></div><hr>';

    disabledClass = ($('tr.ticket-list-row.selected-table-line').length>=2) ? '' : ' class="ui-disabled"';
    contextMenuHtml += '<div onclick="mergeTickets();" ' + disabledClass + '><span class="cm-line cm-click">' + tid('merge') + '</span></div><hr />';

    contextMenuHtml += '<div onclick="showFilterCreation(\'email\',\'\',\'\',\'\',false,\'' + myObject.id + '\');"><span class="cm-line cm-click">' + tid('new_email_filter') + '</span></div>';

    if(d(myObject.uid) && myObject.uid.length)
        contextMenuHtml += '<div onclick="showFilterCreation(\'visitor\', \'' + myObject.uid + '\');"><span class="cm-line cm-click">' + tid('new_visitor_filter') + '</span></div><hr />';

    contextMenuHtml += '<div onclick="changeTicketStatus(5,null,null,null,false);"><span class="cm-line cm-click">' + tid('remove') + '</span></div>';

    contextMenuHtml += '<hr>';

    disabledClass = ((myObject.u <= lzm_chatDisplay.ticketGlobalValues.mr && lzm_commonTools.checkTicketReadStatus(myObject.id, lzm_chatDisplay.ticketUnreadArray) == -1) || (myObject.u > lzm_chatDisplay.ticketGlobalValues.mr && lzm_commonTools.checkTicketReadStatus(myObject.id, lzm_chatDisplay.ticketReadArray, lzm_chatDisplay.ticketListTickets) != -1)) ? ' class="ui-disabled"' : '';
    contextMenuHtml += '<div onclick="changeTicketReadStatus(\'' + myObject.id + '\', \'read\');" ' + disabledClass + '><span id="set-ticket-read" class="cm-line cm-click">' + t('Mark as read') + '</span></div>';

    if (place == 'ticket-list')
        contextMenuHtml += '<div onclick="setAllTicketsRead();"><span id="set-all-tickets-read" class="cm-line cm-click">' + t('Mark all as read') + '</span></div>';

    return contextMenuHtml
};

ChatTicketClass.prototype.createTicketDetailsContextMenu = function(myObject) {


    var contextMenuHtml = '', disabledClass;
    contextMenuHtml += '<div onclick="removeTicketMessageContextMenu(); $(\'#reply-ticket-details\').click();">' +
        '<i class="fa fa-reply"></i>' +
        '<span id="reply-this-message" class="cm-line cm-line-icon-left cm-click">' +
        t('Reply') + '</span></div>';

    contextMenuHtml += '<div onclick="showMessageForward(\'' + myObject.ti.id + '\', \'' + myObject.msg + '\');">' +
        '<i class="fa fa-share"></i>' +
        '<span id="forward-this-message" class="cm-line cm-line-icon-left cm-click">' +
        t('Forward') + '</span></div>';

    disabledClass = (myObject.ti.messages[myObject.msg].t != 1) ? ' class="ui-disabled"' : '';

    contextMenuHtml += '<div' + disabledClass + ' onclick="ChatTicketClass.SendForwardedMessage({id : \'\'}, \'\', \'\', \'\', \'' + myObject.ti.id + '\', \'\', \'' + myObject.msg + '\')">' +
        '<span id="resend-this-message" class="cm-line cm-click">' + t('Resend message') + '</span></div>';

    contextMenuHtml += '<div onclick="ChatTicketClass.PrintTicket(\'' + myObject.ti.id + '\');"><span id="print-ticket" class="cm-line cm-click">' + tid('print') + '</span></div>';
    contextMenuHtml += '<div onclick="showPhoneCallDialog(\'' + myObject.ti.id + '\', \'' + myObject.msg + '\', \'ticket\');"><span id="call-this-message-sender" class="cm-line cm-click">' + t('Phone Call') + '</span></div><hr />';
    contextMenuHtml += '<div onclick="showTicketLinker(\'' + myObject.ti.id + '\', \'\', \'ticket\', \'chat\')">' +
        '<span id="link-ticket-chat" class="cm-line cm-click">' +
        t('Link this Ticket with Chat') + '</span></div>';
    contextMenuHtml += '<div onclick="showTicketLinker(\'' + myObject.ti.id + '\', \'\', \'ticket\', \'ticket\')"><span id="link-ticket-chat" class="cm-line cm-click">' +
        tid('link_ticket_with_ticket') + '</span></div>';

    disabledClass = (myObject.msg == 0) ? ' class="ui-disabled"' : '';
    contextMenuHtml += '<div' + disabledClass + ' onclick="ChatTicketClass.MoveMessageToNewTicket(\'' + myObject.ti.id + '\', \'' + myObject.msg + '\',true)"><span id="copy-msg-to-new" class="cm-line cm-click">' + tid('copy_message') + '</span></div>';

    disabledClass = (myObject.msg == 0) ? ' class="ui-disabled"' : '';
    contextMenuHtml += '<div' + disabledClass + ' onclick="ChatTicketClass.MoveMessageToNewTicket(\'' + myObject.ti.id + '\', \'' + myObject.msg + '\',false)"><span id="move-msg-to-new" class="cm-line cm-click">' + tid('move_message') + '</span></div>';

    disabledClass = (DataEngine.otrs == '' || DataEngine.otrs == null) ? ' class="ui-disabled"' : '';
    contextMenuHtml += '<div' + disabledClass + ' onclick="showTicketMsgTranslator(\'' + myObject.ti.id + '\', \'' + myObject.msg + '\')"><span id="translate-ticket-msg" class="cm-line cm-click">' + tid('translate') + '</span></div><hr />';

    contextMenuHtml += '<div onclick="ChatTicketClass.OpenTicketHistoryLink(\'' + myObject.ti.id + '\');"><span id="copy-msg-to-new" class="cm-line cm-click">' + tid('ticket_history_link') + '</span></div><hr>';
    contextMenuHtml += '<div onclick="ChatTicketClass.AddComment(\'' + myObject.ti.id + '\', \'\')"><span class="cm-line cm-click">' + tid('add_comment') + '</span></div>';

    return contextMenuHtml;
};

ChatTicketClass.prototype.subDefinitionIsValid = function(type,parent,sub) {
    for(var key in DataEngine.global_configuration.database['tsd'])
    {
        var tsd = DataEngine.global_configuration.database['tsd'][key];
        if(tsd.type == type && tsd.parent==parent && tsd.name == sub)
            return true;
    }
    return false;
};

ChatTicketClass.prototype.setTicketFilter = function() {

    var allGroupsChecked = true, noGroupsChecked = true, tsd = null, i, key = '', check = false, checked = false, fgroups = '', fchannels = '', fsubchannels = '', filterHTML = '<div><fieldset class="lzm-fieldset-full"><legend>'+tid('groups')+'</legend>';
    var groups = DataEngine.groups.getGroupList('id',true,false);
    for (i=0; i<groups.length; i++)
    {
        check = (CommunicationEngine.ticketFilterGroups != null) ? CommunicationEngine.ticketFilterGroups.indexOf('\'' + groups[i].id + '\'')!==-1 : true;
        filterHTML += lzm_inputControls.createCheckbox('stf-g-' + md5(groups[i].id), groups[i].id,check);
    }

    filterHTML += '</fieldset><br>';
    filterHTML += '<fieldset class="lzm-fieldset-full" style="min-width:220px;"><legend>'+tid('sources')+'</legend>';

    for (var aChannel=0; aChannel<ChatTicketClass.m_TicketChannels.length; aChannel++)
    {
        var sc = ChatTicketClass.m_TicketChannels[aChannel];
        check = LocalConfiguration.FilterChannel.indexOf(aChannel.toString())!==-1;
        filterHTML += lzm_inputControls.createCheckbox('stf-c-' + aChannel, sc.key,check, false, 'stf-channel');
        for(key in DataEngine.global_configuration.database['tsd'])
        {
            tsd = DataEngine.global_configuration.database['tsd'][key];
            if(tsd.type == 1 && tsd.parent == sc.index){
                check = (CommunicationEngine.ticketFilterSubChannels != null) ? CommunicationEngine.ticketFilterSubChannels.indexOf(lz_global_base64_encode(tsd.parent + tsd.name))!==-1 : true;
                filterHTML += '<div class="left-space-child">' + lzm_inputControls.createCheckbox('stf-sc-' + md5(tsd.sid+tsd.parent+tsd.type.toString()), tsd.name, check,false,'stf-c-' + aChannel)+'</div>';
            }
        }
    }

    filterHTML += '</fieldset></div>';

    var bodyString = filterHTML;

    lzm_commonDialog.createAlertDialog(bodyString, [{id: 'ok', name: tid('ok')}, {id: 'cancel', name: tid('cancel')}], true);

    $('.stf-channel').change(function(){
        if($(this).prop('checked'))
            $('.'+$(this).attr('id')).removeClass('ui-disabled');
        else
            $('.'+$(this).attr('id')).addClass('ui-disabled');
    });
    $('.stf-channel').change();
    $('#alert-btn-cancel').click(function() {
        lzm_commonDialog.removeAlertDialog();
    });
    $('#alert-btn-ok').click(function() {

        for (i=0; i<groups.length; i++)
        {
            checked = $('#' + 'stf-g-' + md5(groups[i].id)).prop('checked');
            if(checked)
            {
                noGroupsChecked = false;
                if (fgroups=='')
                    fgroups = "'" + groups[i].id + "'";
                else
                    fgroups += "," + "'" + groups[i].id + "'";
            }
            else
                allGroupsChecked = false;
        }

        CommunicationEngine.ticketFilterGroups = (allGroupsChecked || noGroupsChecked) ? null : fgroups;

        if(!allGroupsChecked)
            lzm_commonStorage.saveValue('ticket_filter_groups_' + DataEngine.myId,lz_global_base64_encode(fgroups));
        else
            lzm_commonStorage.deleteKeyValuePair('ticket_filter_groups_' + DataEngine.myId);

        var noChannelsChecked = true, noSubChannelsChecked = true;
        var allChannelsChecked = true, allSubChannelsChecked = true;
        for (var aChannel=0; aChannel<ChatTicketClass.m_TicketChannels.length; aChannel++) {
            var sc = ChatTicketClass.m_TicketChannels[aChannel];

            checked = $('#' + 'stf-c-' + aChannel).prop('checked');

            if(!checked)
                allChannelsChecked = false;
            else
                noChannelsChecked = false;

            fchannels += (checked) ? sc.index.toString() : '';

            for(key in DataEngine.global_configuration.database['tsd'])
            {
                tsd = DataEngine.global_configuration.database['tsd'][key];
                if(tsd.type == 1 && tsd.parent == sc.index)
                {
                    checked = $('#' + 'stf-sc-' + md5(tsd.sid+tsd.parent+tsd.type.toString())).prop('checked');
                    if(!checked)
                        allSubChannelsChecked = false;
                    else
                    {
                        noSubChannelsChecked = false;
                        if (fsubchannels=='')
                            fsubchannels = lz_global_base64_encode(tsd.parent + tsd.name);
                        else
                            fsubchannels += "," + lz_global_base64_encode(tsd.parent + tsd.name);
                    }
                }
            }
        }

        LocalConfiguration.FilterChannel = (allChannelsChecked || noChannelsChecked) ? '01234567' : fchannels;
        CommunicationEngine.ticketFilterSubChannels = (allSubChannelsChecked) ? null : fsubchannels;

        if(!allSubChannelsChecked)
            lzm_commonStorage.saveValue('ticket_filter_sub_sources_' + DataEngine.myId,fsubchannels);
        else
            lzm_commonStorage.deleteKeyValuePair('ticket_filter_sub_sources_' + DataEngine.myId);

        toggleTicketFilter();
        //((TaskBarManager.RemoveActiveWindow();
        lzm_commonDialog.removeAlertDialog();
        LocalConfiguration.Save();
    });
};

ChatTicketClass.prototype.IsLatestTicketUnseen = function () {
    return (DataEngine.tickets.length > 0 && DataEngine.TicketLatestReceivedTime > DataEngine.ticketLatestSeenTime);
};

var ticketReplyAddAttachmentContextMenu = function(_data){
    if(_data.tab)
    {
        IFManager.IFScreenCast(_data.tab, _data.id);
    }
    else
    {
        ticketReplyAddAttachmentFile(_data);
    }
};

var ticketReplyAddAttachmentFile = function(_data){

    if ((!IFManager.IsAppFrame && !IFManager.IsMobileOS) || IFManager.IsDesktopApp())
    {
        if(_data.screenshot)
        {
            KnowledgebaseUI.AddToTicket(KnowledgebaseUI.TypeFile,_data.myDialogId);
        }
        else
        {
            var winObj = TaskBarManager.GetActiveWindow();
            winObj.ShowInTaskBar = false;
            winObj.Minimize();

            KnowledgebaseUI.AddToTicket(KnowledgebaseUI.TypeFile,_data.myDialogId);
        }
    }
    else
    {
        showNotMobileMessage();
    }
};

ChatTicketClass.GetReplyFormat = function(_ticket){

    if(DataEngine.getConfigValue('gl_uhic',false) == '0')
        return 'TEXT';

    if(_ticket == null || (IFManager.IsAppFrame || IFManager.IsMobileOS) && !IFManager.IsDesktopApp())
        return 'TEXT';

    if(_ticket.t >= 6)
        return 'TEXT';

    var matchingPredefined=null,defaultPredefined=null,groups = DataEngine.groups.getGroupList();
    for (var i=0; i<groups.length; i++)
    {
        if (groups[i].id == _ticket.gr)
        {
            for (var x=0; x<groups[i].pm.length; x++)
            {
                if(groups[i].pm[x].def == 1)
                    defaultPredefined = groups[i].pm[x];
                if(groups[i].pm[x].lang == _ticket.l)
                    matchingPredefined = groups[i].pm[x];
            }

            if(matchingPredefined == null)
                matchingPredefined = defaultPredefined;

            if(matchingPredefined != null && matchingPredefined.htr.length)
            {
                return 'HTML';
            }
        }
    }
    return 'TEXT';
};

ChatTicketClass.__ProcessNext = function(_getCount) {

    var isEditorId,ticket,key,candidates = [],candidates_final=[],priot=false,tlist = {};
    tlist['cat_prio_my_prio'] = [];
    tlist['cat_prio_open_prio'] = [];
    tlist['cat_prio_my'] = [];
    tlist['cat_prio_open'] = [];
    for(key in lzm_chatDisplay.ticketListTickets)
    {
        ticket = lzm_chatDisplay.ticketListTickets[key];
        isEditorId = ticket.editor && ticket.editor.ed != '';

        // my with prio
        if(ticket.editor && ticket.editor.st < 2 && ticket.editor.ed == DataEngine.myId && ticket.p > 2)
        {
            priot = true;
            tlist['cat_prio_my_prio'].push(ticket);
        }
        // open tickets with prio
        else if(!isEditorId && ticket.p > 2)
        {
            priot = true;
            tlist['cat_prio_open_prio'].push(ticket);
        }
        // my open tickets
        else if(ticket.editor && ticket.editor.st < 2 && ticket.editor.ed == DataEngine.myId)
        {
            tlist['cat_prio_my'].push(ticket);
        }
        // open tickets
        else if(!isEditorId)
        {
            tlist['cat_prio_open'].push(ticket);
        }
    }

    if(tlist['cat_prio_my_prio'].length)
        candidates = tlist['cat_prio_my_prio'];
    else if(tlist['cat_prio_open_prio'].length)
        candidates = tlist['cat_prio_open_prio'];
    else if(tlist['cat_prio_my'].length)
        candidates = tlist['cat_prio_my'];
    else if(tlist['cat_prio_open'].length)
        candidates = tlist['cat_prio_open'];
    else
    {
        return 0;
    }

    if(priot)
    {
        candidates = lzm_commonTools.SortByProperty(candidates,'p',true);
        var hp = -1;
        for(key in candidates)
        {
            if(candidates[key].p > hp)
            {
                candidates_final.push(candidates[key]);
                hp = candidates[key].p;
            }
            else
                break;
        }
    }
    else
        candidates_final = candidates;

    if(_getCount)
        return candidates_final.length;

    candidates_final = lzm_commonTools.SortByProperty(candidates_final,'w',false);
    ChatTicketClass.HandleTicketClick(candidates_final[0].id);
    ChatTicketClass.__ShowTicket();
    return true;
};

ChatTicketClass.__ShowTicket = function(ticketId, fromContext, emailId, chatId, _feedbackId, dialogId) {

    var email = {id: ''}, chat = {cid: ''}, feedback = null, i;

    ticketId = (typeof ticketId != 'undefined') ? ticketId : lzm_chatDisplay.selectedTicketRow;
    fromContext = (typeof fromContext != 'undefined') ? fromContext : false;
    emailId = (typeof emailId != 'undefined') ? emailId : '';
    chatId = (typeof chatId != 'undefined') ? chatId : '';
    _feedbackId = (d(_feedbackId)) ? _feedbackId : '';
    dialogId = (typeof dialogId != 'undefined') ? dialogId : '';

    if (emailId != '')
    {
        for (i=0; i<DataEngine.emails.length; i++)
        {
            if (DataEngine.emails[i].id == emailId)
            {
                email = DataEngine.emails[i];
                email['dialog-id'] = dialogId
            }
        }
    }

    if (chatId != '')
    {
        var chatobj = DataEngine.ChatManager.GetChat(chatId,'i');
        if(chatobj!=null)
        {
            chat = lzm_commonTools.clone(chatobj);
            chat.cid = chatId;
            chat['dialog-id'] = dialogId;
        }
        else
        {
            for (i=0; i<DataEngine.chatArchive.chats.length; i++) {
                if (DataEngine.chatArchive.chats[i].cid == chatId)
                {
                    chat = DataEngine.chatArchive.chats[i];
                    chat['dialog-id'] = dialogId;
                }
            }
        }
    }

    if (_feedbackId != '')
    {
        var fb = lzm_commonTools.GetElementByProperty(DataEngine.feedbacksList,'i',_feedbackId);
        if (fb.length==1)
        {
            feedback = fb[0];
        }
    }

    if (ticketId != '')
    {
        ChatTicketClass.HandleTicketClick(ticketId);
        changeTicketReadStatus(ticketId, 'read', false, true);
    }

    if (!fromContext && lzm_chatDisplay.showTicketContextMenu)
        removeTicketContextMenu();
    else
    {
        removeTicketContextMenu();
        var isNew = (ticketId == '');
        var ticketObj = lzm_chatDisplay.ticketDisplay.GetTicketById(ticketId,true);
        lzm_chatDisplay.ticketDialogId[ticketId] = lzm_chatDisplay.ticketDisplay.ShowTicket(ticketObj, isNew, email, chat, feedback, dialogId);
    }
};

ChatTicketClass.UpdateTicketQuickSearch = function(_instant,_tags){

    _instant = d(_instant) ? _instant : false;
    var word,text = ChatTicketClass.TextEditor.getSelectedText();
    text = lzm_commonTools.StripTags(text);

    if(text == null && !d(_tags))
        return;

    word = lzm_commonTools.GetLastWordAt(text);
    word = word.replace(/&/,'');

    ChatTicketClass.ComposerAutoSearchWord = $.trim(word);
    KnowledgebaseUI.AutoSearchTicket(_instant,_tags);
};

ChatTicketClass.HandleTicketMessageClick = function(ticketId, messageNumber, _keepUI) {

    removeTicketMessageContextMenu();

    var ticket = lzm_chatDisplay.ticketDisplay.GetTicketById(ticketId);
    if(ticket != null)
    {
        var isChange = ChatTicketClass.GetUIProperty('selected-message-no',0) != messageNumber;
        var fullscreenmode = lzm_chatDisplay.ticketDisplay.isFullscreenMode();

        selectTicketMessage(ticketId, messageNumber);

        var attachmentsHtml = lzm_chatDisplay.ticketDisplay.createTicketAttachmentTable(ticket, {id:''}, messageNumber, false,'ticket-message-placeholder-tab-1');
        var messageHtml='',commentsHtml = '';

        if(d(ticket.messages[messageNumber]))
        {
            if(isChange)
            {
                if(fullscreenmode && ticket.messages[messageNumber].ishtml && ChatTicketClass.GetUIProperty('display-type','TEXT') == 'TEXT')
                    ChatTicketClass.SwitchDisplayType('HTML');
                if(ticket.t == 4 || !fullscreenmode || (!ticket.messages[messageNumber].ishtml && ChatTicketClass.GetUIProperty('display-type','TEXT') == 'HTML'))
                    ChatTicketClass.SwitchDisplayType('TEXT');
            }

            var outgoingMessage = ticket.messages[messageNumber].t == 1;
            var ddefault = ticket.messages[messageNumber].ishtml && ticket.t != 4 ? 'HTML' : 'TEXT';

            if(!fullscreenmode || ChatTicketClass.GetUIProperty('display-type',ddefault) == 'TEXT')
                messageHtml = lzm_commonTools.htmlEntities(ticket.messages[messageNumber].mt).replace(/\n/g, '<br />');
            else
            {
                messageHtml += ChatTicketClass.GetSecureMailFrame('MESSAGE',!ChatTicketClass.GetUIProperty('display-secure',false) && !outgoingMessage,ticket.messages[messageNumber].ci);
                ChatTicketClass.SwitchDisplayType('HTML');
            }
        }

        $('#ticket-message-text').html(messageHtml);
        $('#ticket-attachment-list').html(attachmentsHtml);
        $('#ticket-comment-list').html(commentsHtml);

        lzm_chatDisplay.ticketDisplay.UpdateMessageHeader(ticket,ticket.messages[messageNumber]);

        $('#message-details-inner').data('message', ticket.messages[messageNumber]);
        $('#message-details-inner').data('email', {id: ''});
        $('#message-details-inner').data('is-new', false);
        $('#message-details-inner').data('chat', {cid: ''});

        ChatTicketClass.SetUIProperty('selected-message-no',messageNumber);
        ChatTicketClass.SelectedMessageNo = parseInt(messageNumber);

        if(!fullscreenmode && !d(_keepUI))
        {
            $('#'+ticketId+'-body').append($('#ticket-message-div'));
            $('#embedded-message-details').remove();

            var theight = $('.message-line.selected-table-line').height();

            if(isChange || $('#ticket-message-div').css('display')!='block')
            {
                $('<tr id="embedded-message-details"><td colspan="2"></td></tr>').insertAfter('#message-line-'+ticketId+'_'+messageNumber);
                $('#embedded-message-details td').append($('#ticket-message-div'));
                $('#ticket-message-div').css('display','block');
                ChatTicketClass.SwitchDisplayType();
            }
            else
                $('#ticket-message-div').css('display','none');

            var c = $('#ticket-message-list').scrollTop() + theight;
            $('#ticket-message-list').animate({
                scrollTop: ($('#message-line-'+ticketId+'_'+messageNumber).offset().top+c)
            },500);
        }
        else if(fullscreenmode)
        {
            ChatTicketClass.SwitchDisplayType();
            $('#ticket-message-placeholder-tab-0').click();
        }
    }
    UIRenderer.resizeTicketDetails();
};

ChatTicketClass.HandleTicketClick = function(ticketId, noUserInteraction, inDialog, elementId, row, e, rightClick){

    try
    {
        row = (d(row)) ? $(row) : null;
        rightClick = (d(rightClick)) ? rightClick : false;
        e = (d(e)) ? e : null;
        noUserInteraction = (typeof noUserInteraction != 'undefined') ? noUserInteraction : false;
        inDialog = (typeof inDialog != 'undefined') ? inDialog : false;
        elementId = (typeof elementId != 'undefined') ? elementId : '';

        if(rightClick && row != null && row.hasClass('selected-table-line'))
            return;

        var userId = elementId.replace('d-','').replace('e-','');
        var ticket, i;
        if (!inDialog)
        {
            if($.inArray(ticketId, ['next', 'previous']) != -1)
            {
                if (lzm_chatDisplay.selectedTicketRow != '')
                {
                    for (var j=0; j<lzm_chatDisplay.ticketListTickets.length; j++)
                        if (lzm_chatDisplay.ticketListTickets[j].id == lzm_chatDisplay.selectedTicketRow)
                        {
                            try
                            {
                                ticketId = (ticketId == 'next') ?  lzm_chatDisplay.ticketListTickets[j + 1].id : lzm_chatDisplay.ticketListTickets[j - 1].id;
                            }
                            catch(e)
                            {
                                ticketId = lzm_chatDisplay.ticketListTickets[j].id;
                            }
                        }

                }
                else
                {
                    try
                    {
                        ticketId = lzm_chatDisplay.ticketListTickets[0].id
                    }
                    catch(ex)
                    {
                        ticketId = '';
                    }
                }
            }

            if(ticketId == '' && lzm_chatDisplay.ticketListTickets.length > 0)
                ticketId = lzm_chatDisplay.ticketListTickets[0].id;
            else if(elementId == '' && lzm_chatDisplay.ticketListTickets.length == 0)
                ticketId = '';
        }
        else
        {
            if(ticketId == '' && lzm_chatDisplay.ticketControlTickets[userId].length > 0)
                ticketId = lzm_chatDisplay.ticketControlTickets[userId][0].id;
        }

        var isMultiLine = (!inDialog && e!=null) ? (e.shiftKey || e.ctrlKey) : false;
        var isShiftSelect = (!inDialog && e!=null) ? (e.shiftKey) : false;
        var newSelectedLine = (!inDialog && e!=null) ? row.data('line-number') : 0;
        var oldSelectedLine = lzm_chatDisplay.selectedTicketRowNo;
        var selectedLine = oldSelectedLine;

        ChatTicketClass.SelectedTicketId = ticketId;

        removeTicketContextMenu(inDialog);

        if(!isMultiLine)
            $('.ticket-list-row').removeClass('selected-table-line');

        if (ticketId != '' && !noUserInteraction && ((!IFManager.IsAppFrame && !IFManager.IsMobileOS) || IFManager.IsDesktopApp()) &&
            lzm_chatDisplay.selectedTicketRow == ticketId &&
            lzm_commonTools.checkTicketReadStatus(ticketId, lzm_chatDisplay.ticketReadArray) == -1 &&
            lzm_chatTimeStamp.getServerTimeString(null, false, 1) - ticketLineClicked >= 500) {
            changeTicketReadStatus(ticketId, 'read', false, true);

        }

        ticketLineClicked = lzm_chatTimeStamp.getServerTimeString(null, false, 1);
        lzm_chatDisplay.selectedTicketRow = ticketId;

        for (i=0; i<lzm_chatDisplay.ticketListTickets.length; i++)
            if (lzm_chatDisplay.ticketListTickets[i].id == ticketId)
                lzm_chatDisplay.selectedTicketRowNo = i;

        ticket = lzm_chatDisplay.ticketDisplay.GetTicketById(ticketId);
        var previewContainer = null, messageText = '';

        if (!inDialog)
        {
            if(isShiftSelect && Math.abs(row.data('line-number')-oldSelectedLine) > 1)
            {
                if(newSelectedLine>selectedLine)
                    for(i=selectedLine;i<=newSelectedLine;i++)
                        $('.ticket-list-row-' + i).addClass('selected-table-line');
                else if(newSelectedLine<selectedLine)
                    for(i=selectedLine;i>=newSelectedLine;i--)
                        $('.ticket-list-row-' + i).addClass('selected-table-line');
            }
            else
                $('#ticket-list-row-' + ticketId).addClass('selected-table-line');

            if (ticket != null && $(window).width() > ChatTicketClass.PreviewSwitchWidth)
            {
                messageText = ticket.messages[ticket.messages.length - 1].mt;
                previewContainer = $('#ticket-list-right');
                $('.ticket-action').removeClass('ui-disabled');
            }
        }
        else
        {
            $('#matching-ticket-list-'+elementId+'-row-' + ticketId).addClass('selected-table-line');
            messageText = (ticket != null ) ? ticket.messages[ticket.messages.length - 1].mt : '';
            previewContainer = $('#ticket-content-'+elementId+'-inner');
        }

        if(previewContainer != null)
        {
            messageText = lzm_commonTools.htmlEntities(messageText).replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n/g, '<br>');
            messageText = lzm_commonTools.HighlightSearchKey(messageText,CommonInputControlsClass.SearchBox.GetQuery(),false,3000);

            var commhtml = '';

            for(var key in ticket.messages[ticket.messages.length-1].comment)
            {
                var c = ticket.messages[ticket.messages.length-1].comment[key];
                commhtml += lzm_chatDisplay.createCommentHtml(lzm_commonTools.HighlightSearchKey(ChatTicketClass.GetCommentText(c), CommonInputControlsClass.SearchBox.GetQuery()), c.o, c.t);
            }

            if(commhtml != '')
            {
                commhtml = '<div id="ticket-list-comments">'+commhtml+'</div>';
                messageText = commhtml + messageText;
            }

            previewContainer.html(messageText);
        }
    }
    catch(e){deblog(e);}
};

ChatTicketClass.EditTicketField = function(_ticketId, _fieldId) {

    if(PermissionEngine.permissions.tickets_edit_messages==0)
    {
        showNoPermissionMessage();
        return;
    }

    var myCustomInput = null, value = null;
    var ticket = lzm_chatDisplay.ticketDisplay.GetTicketById(_ticketId);
    if(ticket != null)
    {
        var rootMessage = Ticket.GetRootMessage(ticket);
        var editHTML = '';

        if(_fieldId == 'subject')
        {
            editHTML += lzm_inputControls.createInput('edit-ticket-field-data','', lzm_commonTools.htmlEntities(rootMessage.s), tidc('subject'), '', 'text', '');
        }
        else if(_fieldId == '111')
        {
            editHTML += lzm_inputControls.createInput('edit-ticket-field-data','', rootMessage.fn, tidc('name'), '', 'text', '');
        }
        else if(_fieldId == '112')
        {
            editHTML += lzm_inputControls.createArea('edit-ticket-field-data', rootMessage.em, '', tidc('email'));
            editHTML += '<br><br>' + lzm_inputControls.createArea('edit-ticket-field-data-cc', rootMessage.ecc, '', tid('email') + ' CC:');
            editHTML += '<br><br>' + lzm_inputControls.createArea('edit-ticket-field-data-bcc', rootMessage.ebcc, '', tid('email') + ' BCC:');
        }
        else if(_fieldId == '113')
        {
            editHTML += lzm_inputControls.createInput('edit-ticket-field-data','', rootMessage.co, tidc('company'), '', 'text', '');
        }
        else if(_fieldId == '116')
        {
            editHTML += lzm_inputControls.createInput('edit-ticket-field-data','', rootMessage.p, tidc('phone'), '', 'text', '');
        }
        else
        {
            myCustomInput = DataEngine.inputList.getCustomInput(DataEngine.inputList.idList[_fieldId]);

            if(myCustomInput != null)
            {
                value = lzm_commonTools.GetElementByProperty(rootMessage.customInput,'id',myCustomInput.name);

                if(!value.length)
                {
                    value = {id:myCustomInput.name,text:''};
                    rootMessage.customInput.push(value);
                }
                else
                    value = value[0];

                editHTML = DataEngine.inputList.getControlHTML(myCustomInput,'edit-ticket-field-data','',value.text,true);
            }
        }

        lzm_commonDialog.createAlertDialog(editHTML, [{id: 'ok', name: t('Ok')}, {id: 'cancel', name: t('Cancel')}]);

        $('#edit-ticket-field-data').focus();
        $('#edit-ticket-field-data').select();

        $('#alert-btn-ok').click(function() {

            if(_fieldId == 'subject')
                rootMessage.s = $('#edit-ticket-field-data').val();
            else if(parseInt(_fieldId)== 111)
                rootMessage.fn = $('#edit-ticket-field-data').val();
            else if(parseInt(_fieldId)== 112)
            {
                rootMessage.em = $('#edit-ticket-field-data').val();
                rootMessage.ecc = $('#edit-ticket-field-data-cc').val();
                rootMessage.ebcc = $('#edit-ticket-field-data-bcc').val();
            }

            else if(parseInt(_fieldId)== 113)
                rootMessage.co = $('#edit-ticket-field-data').val();
            else if(parseInt(_fieldId)== 116)
                rootMessage.p = $('#edit-ticket-field-data').val();
            else if(myCustomInput != null)
                value.text = DataEngine.inputList.getControlValue(myCustomInput,'edit-ticket-field-data');

            ticket.LocalEdited = true;
            lzm_chatDisplay.ticketDisplay.updateTicketDetails(ticket);

            $('#alert-btn-cancel').click();
        });
        $('#alert-btn-cancel').click(function() {
            lzm_commonDialog.removeAlertDialog();
        });
    }
};

ChatTicketClass.HandleTicketAttachmentClick = function (attachmentNo) {
    $('.attachment-line').removeClass('selected-table-line');
    $('#attachment-line-' + attachmentNo).addClass('selected-table-line');
    $('#attachment-table').data('selected-attachment', attachmentNo);
    $('#message-attachment-table').data('selected-attachment', attachmentNo);
    $('#remove-attachment').removeClass('ui-disabled');
    ChatTicketClass.SetUIProperty('selected-attachment-no',attachmentNo);

};

ChatTicketClass.PreviewTicketAttachment = function(_url) {
    if(!lzm_chatDisplay.ticketDisplay.isFullscreenMode())
        return;

    if(_url!=null)
    {
        if(_url.indexOf('screenshot.lzsc') != -1)
        {
            $('#att-img-preview-field').html('<iframe id="screencapture-iframe" src="'+_url+'" /></iframe>');
            $('#att-img-preview-field').css({'overflow':'hidden',padding:0});
        }
        else
        {
            $('#att-img-preview-field').html('<img id="att-img-preview" data-natural="0" src="'+_url+'" />');
            $('#att-img-preview').load(function(){
                $('#att-img-preview').data('w',$(this).get(0).naturalWidth);
                $('#att-img-preview').data('h',$(this).get(0).naturalHeight);
                $('#att-img-preview').data('scalable',$('#att-img-preview').data('h') > $('#att-img-preview-field').height() || $('#att-img-preview').data('w') > $('#att-img-preview-field').width());
                if($('#att-img-preview').data('scalable'))
                    $('#att-img-preview').click(function(){
                        if($('#att-img-preview').data('natural') == '1')
                            $('#att-img-preview').data('natural','0');
                        else
                            $('#att-img-preview').data('natural','1');
                        UIRenderer.resizeTicketDetails();
                    });
                UIRenderer.resizeTicketDetails();
            });
        }
    }
    else
        $('#att-img-preview-field').html('');
};

ChatTicketClass.SwitchDisplayType = function(_newType,_click){

    if(d(_newType))
        ChatTicketClass.SetUIProperty('display-type',_newType);

    $('#mes-display-html').removeClass('lzm-button-e-pushed');
    $('#mes-display-text').removeClass('lzm-button-e-pushed');
    $('#mes-display-' + ChatTicketClass.GetUIProperty('display-type','TEXT').toLowerCase()).addClass('lzm-button-e-pushed');

    if(d(_newType) && d(_click))
        ChatTicketClass.HandleTicketMessageClick(ChatTicketClass.LastActiveTicket.id,ChatTicketClass.GetUIProperty('selected-message-no',0),true);

    $('#ticket-history-table').data('display-type',_newType);

};

ChatTicketClass.SwitchSecureContent = function(_context,_displayInsecure){
    if(_context == 'MESSAGE')
    {
        ChatTicketClass.SetUIProperty('display-secure',_displayInsecure);
        if(d(_displayInsecure))
            ChatTicketClass.HandleTicketMessageClick(ChatTicketClass.LastActiveTicket.id,ChatTicketClass.GetUIProperty('selected-message-no',0),true);
    }
    else if(_context == 'EMAIL')
    {
        try
        {
            $('#email-html').html(ChatTicketClass.GetSecureMailFrame('EMAIL',false,DataEngine.emails[lzm_chatDisplay.ticketDisplay.selectedEmailNo].id));
            UIRenderer.resizeEmailDetails();
        }
        catch (ex)
        {

        }
    }
};

ChatTicketClass.GetHTMLSwitch = function(_fullscreenmode,_selectedMessage){

    var dis = '',sHtml = '<div style="float:right;margin-top:2px;"><div>';
    if(d(_selectedMessage))
        if(!d(_selectedMessage.ishtml))
            dis = 'ui-disabled';

    if(lzm_chatDisplay.ticketDisplay.isFullscreenMode())
    {
        sHtml += lzm_inputControls.createButton('mes-display-text', 'lzm-button-e-pushed', 'ChatTicketClass.SwitchDisplayType(\'TEXT\',true);', 'Text', '', '', {'margin-left': '4px', 'padding':(!_fullscreenmode) ? '4px 10px' : ''}, '', 20, 'e');
        sHtml += lzm_inputControls.createButton('mes-display-html', dis, 'ChatTicketClass.SwitchDisplayType(\'HTML\',true);', 'HTML', '', '', {'margin': '0 4px 0 -1px', 'padding':(!_fullscreenmode) ? '4px 10px' : ''}, '', 20, 'e');
    }
    sHtml += '</div></div>';
    return sHtml;
};

ChatTicketClass.GetSecureMailFrame = function(_context,_askForSecure,_channelId){
    var framehtml = '';
    if(_askForSecure)
        framehtml = '<div id="ticket-message-insecure" class="lzm-clickable2 lzm-unselectable" onclick="ChatTicketClass.SwitchSecureContent(\''+_context+'\',true);"><i class="fa fa-warning icon-orange"></i>&nbsp;&nbsp;'+tid('show_insecure')+'</div>';
    framehtml += '<iframe id="ticket-message-iframe" class="ticket-message-iframe" onload="ChatTicketClass.ApplyEmailFrameCSS(this.contentWindow.document);" src="'+CommunicationEngine.chosenProfile.server_protocol + CommunicationEngine.chosenProfile.server_url + '/email.php?id='+lz_global_base64_url_encode(_channelId) + ((!_askForSecure) ? '&no_sec=1' : '')+'"></iframe>';
    return framehtml;
};

ChatTicketClass.ApplyEmailFrameCSS = function(_doc){
    _doc.body.style.padding='10px';
    _doc.body.style.overflow='scroll';
    _doc.body.style.overflow='auto';
    _doc.body.style.boxSizing='border-box';
    _doc.body.style.background='#fff';
};

ChatTicketClass.MoveMessageToNewTicket = function(_ticketId, _messageNo, _keepCopy) {
    removeTicketMessageContextMenu();
    var message = {};
    var ticket = lzm_chatDisplay.ticketDisplay.GetTicketById(_ticketId);
    if (ticket != null)
        message = ticket.messages[_messageNo];
    ticket = {mid: message.id, id: _ticketId, copy: _keepCopy};
    CommunicationEngine.pollServerTicket([ticket], [], 'move-message');
};

ChatTicketClass.SendForwardedMessage = function(message, text, emailAddresses, emailSubject, ticketId, group, messageNo) {

    removeTicketMessageContextMenu();
    var ticket,key;
    if(d(emailAddresses) && emailAddresses.length > 1)
    {
        //forward message
        key = 'forward-to';
        var exEmail = lzm_commonTools.GetElementByProperty(LocalConfiguration.EmailList,0,emailAddresses);
        var m = md5(emailAddresses).substr(0,5);
        if(!exEmail.length)
            LocalConfiguration.EmailList.push([emailAddresses,1,'1_'+m]);
        else
        {
            exEmail[0][1]++;
            exEmail[0][2] = exEmail[0][1] + '_' + m;
        }

        LocalConfiguration.EmailList = lzm_commonTools.SortByProperty(LocalConfiguration.EmailList,2,true);
        LocalConfiguration.Save();
    }
    else if (message.id == '')
    {
        // resend message
        key = 'resend';
        ticket = lzm_chatDisplay.ticketDisplay.GetTicketById(ticketId);
        if (ticket != null)
        {
            message = ticket.messages[messageNo];
            text = message.mt;
            emailAddresses = message.em;
            emailSubject = (typeof message.s != 'undefined') ? message.s : '';
            group = ticket.gr;
        }
    }

    ticket = {mid: message.id, gr: group, em: emailAddresses, su: emailSubject, text: text, id: ticketId};
    CommunicationEngine.pollServerTicket([ticket], [], key);
};

ChatTicketClass.PrintTicket = function(ticketId){
    removeTicketMessageContextMenu();
    var myTicket = lzm_chatDisplay.ticketDisplay.GetTicketById(ticketId);
    if (myTicket != null)
    {
        lzm_commonTools.printContent('ticket', {ticket: myTicket});
    }
};

ChatTicketClass.PrintTicketMessage = function(ticketId, msgNo){
    removeTicketMessageContextMenu();
    var myTicket = lzm_chatDisplay.ticketDisplay.GetTicketById(ticketId);
    if (myTicket != null && myTicket.messages.length > msgNo)
    {
        lzm_commonTools.printContent('message', {ticket: myTicket, msgNo: msgNo});
    }
};

ChatTicketClass.CancelTicketReply = function(ticketId){

    var doCancel = function()
    {
        TaskBarManager.RemoveActiveWindow();
        TaskBarManager.Maximize(ticketId);
    };
    var cancel = false;
    if(ChatTicketClass.TextEditor.grabText().length)
    {
        lzm_commonDialog.createAlertDialog(tid('close_confirm'), [{id: 'ok', name: t('Ok')}, {id: 'cancel', name: t('Cancel')}]);
        $('#alert-btn-ok').click(function()
        {
            var text = ChatTicketClass.TextEditor.grabHtml();
            ChatTicketClass.SaveDraft(ChatTicketClass.LastActiveTicket,text,ChatTicketClass.LastActiveTicket.messages[ChatTicketClass.GetUIProperty('selected-message-no',ChatTicketClass.SelectedMessageNo)].id);
            $('#alert-btn-cancel').click();
            doCancel();
        });
        $('#alert-btn-cancel').click(function()
        {
            lzm_commonDialog.removeAlertDialog();
        });
    }
    else
        doCancel();
};

ChatTicketClass.AddComment = function(ticketId, menuEntry) {

    removeTicketMessageContextMenu();
    ticketId = (typeof ticketId != 'undefined') ? ticketId : lzm_chatDisplay.selectedTicketRow;

    var messageNo = ChatTicketClass.GetUIProperty('selected-message-no',-1);
    var ticket = {}, message = {};

    for (var i=0; i<lzm_chatDisplay.ticketListTickets.length; i++)
    {
        if (lzm_chatDisplay.ticketListTickets[i].id == ticketId)
        {
            ticket = lzm_chatDisplay.ticketListTickets[i];

            if(messageNo==-1)
                messageNo = ticket.messages.length-1;

            message = ticket.messages[messageNo];
        }
    }
    lzm_chatDisplay.ticketDisplay.AddMessageComment(ticket.id, message, menuEntry);
};

ChatTicketClass.SwitchCommentType = function(_type){
    if(_type=='FILE')
    {
        $('#add-comment-file').addClass('lzm-button-e-pushed');
        $('#add-comment-text').removeClass('lzm-button-e-pushed');
        $('#new-comment-field').parent().css('display','none');
        $('#new-comment-file').parent().parent().parent().css('display','block');
    }
    else
    {
        $('#add-comment-text').addClass('lzm-button-e-pushed');
        $('#add-comment-file').removeClass('lzm-button-e-pushed');
        $('#new-comment-field').parent().css('display','block');
        $('#new-comment-file').parent().parent().parent().css('display','none');
    }
};

ChatTicketClass.SetFileToComment = function(_file){
    $('#add-comment-file').removeClass('lzm-button-e-pushed');
    $('#new-comment-field').val(_file.commentText + '[__[cfile:'+_file.uploadFileId+','+_file.uploadFileName+']__]');
    $('#alert-btn-ok').removeClass('ui-disabled');
    $('#new-comment-file').val('');
    $('#alert-btn-ok').click();
};

ChatTicketClass.GetCommentText = function(_comment){

    var comtext='',ctext = lzm_commonTools.htmlEntities(_comment.text);
    if(ctext.indexOf('[__[cfile:')!==-1)
    {
        comtext = ctext.split('[__[cfile:')[0];
        ctext = ctext.split('[__[cfile:')[1].split(']__]')[0];
        ctext = ctext.split(',');

        var fid = ctext[0];
        var fname = lz_global_base64_decode(ctext[1]);
        ctext = '<a target="_blank" style=" background:#fff !important;color:#5197ff !important;" href="' + KnowledgebaseUI.GetFileURL({rid:fid,ti:fname}) + '">' + lzm_commonTools.htmlEntities(fname) + '</a>';
    }

    if(comtext.length)
        ctext = comtext + '<br>' + ctext;

    return ctext;
};

ChatTicketClass.HandleTicketTreeClickEvent = function(_id,_parent,_subStatus,_initPoll){

    _initPoll = (d(_initPoll)) ? _initPoll : true;
    _parent = (d(_parent)) ? _parent : null;
    _subStatus = (d(_subStatus)) ? _subStatus : null;

    $('#ticket-list-tree div').removeClass('selected-treeview-div');
    $('#'+_id).addClass('selected-treeview-div');

    LocalConfiguration.TicketTreeCategoryParent = (_parent != null) ? _parent : '';
    LocalConfiguration.TicketTreeCategorySubStatus = (_subStatus != null) ? _subStatus : '';
    LocalConfiguration.TicketTreeCategory = _id;
    LocalConfiguration.Save();

    if(lzm_chatDisplay.ticketDisplay.CategorySelect)
    {
        lzm_chatDisplay.ticketDisplay.CategorySelect = false;
        UIRenderer.resizeTicketList();
    }

    var value = "";
    value += ((_id == "tnFilterStatusActive" || _id == "tnFilterOverdue" || _id == "tnFilterStatusOpen" || LocalConfiguration.TicketTreeCategoryParent == "tnFilterStatusOpen") ? '1' : '0');
    value += ((_id == "tnFilterStatusActive" || _id == "tnFilterOverdue" || _id == "tnFilterStatusInProgress" || LocalConfiguration.TicketTreeCategoryParent == "tnFilterStatusInProgress")? '1' : '0');
    value += ((_id == "tnFilterStatusClosed" || LocalConfiguration.TicketTreeCategoryParent == "tnFilterStatusClosed")? '1' : '0');
    value += ((_id == "tnFilterStatusDeleted" || LocalConfiguration.TicketTreeCategoryParent == "tnFilterStatusDeleted")? '1' : '0');
    value += ((_id == "tnFilterStatusPending" || LocalConfiguration.TicketTreeCategoryParent == "tnFilterStatusPending")? '1' : '0');
    value += ((_id == "tnFilterMyTickets" || LocalConfiguration.TicketTreeCategoryParent == "tnFilterMyTickets")? '1' : '0');
    value += ((_id == "tnFilterMyGroupsTickets" || LocalConfiguration.TicketTreeCategoryParent == "tnFilterMyGroupsTickets")? '1' : '0');

    if(_subStatus != null)
        CommunicationEngine.ticketFilterSubStatus = _subStatus;
    else
        CommunicationEngine.ticketFilterSubStatus = null;

    CommunicationEngine.ticketFilterPersonal = value.substr(5, 1) == "1";
    CommunicationEngine.ticketFilterGroup = value.substr(6, 1) == "1";
    CommunicationEngine.ticketFilterWatchList = (_id == 'tnFilterWatchList');

    var f = "";
    f += value.substr(0, 1) == "1" || CommunicationEngine.ticketFilterPersonal || CommunicationEngine.ticketFilterGroup ? "0" : "";
    f += value.substr(1, 1) == "1" || CommunicationEngine.ticketFilterPersonal || CommunicationEngine.ticketFilterGroup ? "1" : "";
    f += value.substr(2, 1) == "1" ? "2" : "";
    f += value.substr(3, 1) == "1" ? "3" : "";
    f += value.substr(4, 1) == "1" ? "4" : "";

    if(_id == "tnFilterOverdue")
        f += 'od';

    CommunicationEngine.ticketFilterStatus = f;

    if(_initPoll)
        toggleTicketFilter();
};

ChatTicketClass.SendTicketMessage = function(ticket, receiver, cc, bcc, subject, _bodyPlain,_bodyHTML, comment, attachments, messageId, previousMessageId, addToWL, _newStatus) {
    var ticketFetchTime = DataEngine.ticketFetchTime;
    DataEngine.expectTicketChanges = true;
    UserActions.sendTicketReply(ticket, receiver, cc, bcc, subject, _bodyPlain, _bodyHTML, comment, attachments, messageId, previousMessageId, addToWL, _newStatus);
    switchTicketListPresentation(ticketFetchTime, 0, ticket.id);
};

ChatTicketClass.PreviousEmail = function(){
    if($('#email-list-line-' + (lzm_chatDisplay.ticketDisplay.selectedEmailNo-1)).length)
        $('#email-list-line-' + (lzm_chatDisplay.ticketDisplay.selectedEmailNo-1)).click();
};

ChatTicketClass.NextEmail = function(){
    if($('#email-list-line-' + (lzm_chatDisplay.ticketDisplay.selectedEmailNo+1)).length)
        $('#email-list-line-' + (lzm_chatDisplay.ticketDisplay.selectedEmailNo+1)).click();
};

ChatTicketClass.ExtractAvatarName = function(_message){
    if(_message.fn.length)
        return _message.fn;
    else if(_message.em.length)
    {
        var parts = _message.em.split('@');

        return parts[0].replace('.',' ').replace('_',' ').replace('-',' ');

    }
    else if(_message.co.length)
    {
        return _message.co;
    }
    return '';
};

ChatTicketClass.DeleteEmail = function(){

    if (PermissionEngine.checkUserPermissions('', 'tickets', 'delete_emails', {}))
    {
        var emailNo = 0, emailId = '';
        $('.selected-table-line').each(function(i, obj)
        {
            if($(obj).hasClass('email-list-line'))
            {
                emailId = $(obj).attr('data-id');
                emailNo = $(obj).attr('data-line-number');

                if (!(DataEngine.emails[emailNo].ei != '' && DataEngine.emails[emailNo].ei != lzm_chatDisplay.myId))
                {
                    lzm_chatDisplay.emailDeletedArray.push(emailId);
                    $('#email-list-line-' + emailNo).children('td:first').html('<i class="fa fa-remove" style="color: #cc0000;"></i>');
                    $('#reset-emails').removeClass('ui-disabled');
                    $('#delete-email').addClass('ui-disabled');
                    $('#create-ticket-from-email').addClass('ui-disabled');
                    if ($('#email-list-line-' + (parseInt(emailNo) + 1)).length > 0)
                        $('#email-list-line-' + (parseInt(emailNo) + 1)).click();
                }
            }
        });
        ChatTicketClass.ScrollToEmail(emailNo);
    }
    else
        showNoPermissionMessage();
};

ChatTicketClass.ScrollToEmail = function(no){
    if(no > 0)
        $('#incoming-email-list-active').scrollTop(parseInt(no) * 34);
};

ChatTicketClass.RestoreEmail = function(_emailId){

    var emailObj = lzm_commonTools.GetElementByProperty(DataEngine.EmailsDeleted,'id',_emailId);
    if(emailObj.length)
        CommunicationEngine.pollServerTicket([], [[emailObj[0]],[]], 'email-changes');
};

ChatTicketClass.SearchForTicketID = function(_ticketId){
    SelectView('tickets');

    $('.ticket-ss-check').prop('checked',false);
    $('#ticket-ss-tid').prop('checked',true).change();

    CommonInputControlsClass.SearchBox.SetQuery(_ticketId);
    CommonInputControlsClass.SearchBox.Search();
};

ChatTicketClass.OpenTicketHistoryLink = function(_ticketId){
    removeTicketContextMenu();
    removeTicketMessageContextMenu();
    var ticket = lzm_chatDisplay.ticketDisplay.GetTicketById(_ticketId);
    openSystemLink('ticket.php?id=' + _ticketId + '&hash=' + ticket.h + '&salt=' + ticket.sa);
};

ChatTicketClass.OpenSelected = function(){

    ChatTicketClass.__ShowTicket(ChatTicketClass.SelectedTicketId, true, '', '', '', '');
};

ChatTicketClass.ReplySelected = function(){

    ChatTicketClass.OpenSelected();
    $('#reply-ticket-details').click();
};

ChatTicketClass.InitUploadTicketDetails = function(ticket, channel, status, group, editor, language, name, email, company, phone, message, attachments, comments, customFields, subStatus, subChannel, _chat, mc, subject, rem_time, rem_status, priority, feedback, _tags, _autoresponder) {

    lzm_chatDisplay.ticketDisplay.LastActivity = lz_global_timestamp();

    mc = (typeof mc != 'undefined') ? mc : '';
    subject = (typeof subject != 'undefined') ? subject : '';
    status = status.toString();
    subStatus = (typeof subStatus == 'undefined' || subStatus == null) ? '' : subStatus;
    subChannel = (typeof subChannel == 'undefined' || subChannel == null) ? '' : subChannel;
    rem_time = (typeof rem_time == 'undefined' || rem_time == null) ? '0' : rem_time;
    rem_status = (typeof rem_status == 'undefined' || rem_status == null) ? '0' : rem_status;
    priority = (!d(priority)) ? '2' : priority;
    editor = (editor != -1) ? editor : '';

    _autoresponder = d(_autoresponder) ? _autoresponder : 0;

    var id = '', oe = '', os = '', og = '', ol = '', tobject;

    DataEngine.expectTicketChanges = true;

    if (d(ticket.id))
    {
        // existing ticket
        id = ticket.id;
        og = ticket.gr;
        ol = ticket.l;

        if (ticket.editor != false)
        {
            oe = ticket.editor.ed;
            os = ticket.editor.st;
        }

        if(!(ticket.editor != false && ticket.editor.ed != ''))
        {
            if(PermissionEngine.checkUserPermissions('', 'tickets', 'assign_operators', {}))
            {

                //editor = lzm_chatDisplay.myId;
            }
        }

        if(subStatus != '' && !lzm_chatDisplay.ticketDisplay.subDefinitionIsValid(0,status,subStatus))
            subStatus = '';
        if(subChannel != '' && !lzm_chatDisplay.ticketDisplay.subDefinitionIsValid(1,channel,subChannel))
            subChannel = '';

        tobject = {
            id: id,
            ne: editor,
            ns: status,
            ss: subStatus,
            sc: subChannel,
            nch: channel,
            ng: group,
            oe: oe,
            os: os,
            og: og,
            nl: language,
            ol: ol,
            mc: mc,
            vv: rem_time,
            vw: rem_status
        };
    }
    else
    {
        tobject = {nn: name, nem: email, nc: company, np: phone, nm: message, sub: subject, ne: editor, ns: status, ss: subStatus, sc: subChannel, ng: group, nl: language, nch: channel, at: attachments, co: comments, cf: customFields, vv: rem_time, vw: rem_status, vx: priority};

        if(d(_chat.v))
            tobject.vy = _chat.v;

        if(d(_chat.cid) && _chat.cid.length)
        {
            tobject.vyy = _chat.cid;

            // visitor id
            if(d(_chat.eid) && _chat.eid.length)
                tobject.vyz = _chat.eid;
            else if(d(_chat.v) && _chat.v.length)
                tobject.vyz = _chat.v;
        }

        if(d(feedback) && feedback != null)
        {
            tobject.vz = feedback.i;

            // visitor id
            if(d(feedback.u) && feedback.u.length)
                tobject.vyz = feedback.u;
        }
    }

    tobject.vyx = _tags;
    tobject.vzy = _autoresponder;
    
    CommunicationEngine.uploadTickets.push(tobject);
};

ChatTicketClass.UploadTicketDetails = function(_action, _chat, _feedback) {

    if(_feedback != null)
        CommunicationEngine.FeedbacksUpdateTimestamp = '';

    _action = (d(_action)) ? _action : 'save-details';

    CommunicationEngine.pollServerTicket(lzm_commonTools.clone(CommunicationEngine.uploadTickets), [], _action, _chat, _feedback);
    CommunicationEngine.uploadTickets = [];
};

ChatTicketClass.SetEmailButtonLine = function(){

    var sindex = $('#email-list-placeholder-tabs-row').data('selected-tab');
    if(sindex==1 || !DataEngine.emails.length)
        $('#create-ticket-from-email').parent().css({display:'none'});
    else
        $('#create-ticket-from-email').parent().css({display:'inline'});

};

ChatTicketClass.InitResponseEditor = function(_html,_ticket,_delayed){

    $('#ticket-response').css('display','none');

    ChatTicketClass.SignatureEditor.init('',null,'',true,true);
    ChatTicketClass.TextEditor.init(_html,null,'',true);

    var body = $(ChatTicketClass.TextEditor.getBody());

    body.keyup(function(){
        $(ChatTicketClass.TextEditor.getBody()).change();
    });
    body.change(function(){

        lastTypingEvent = lzm_chatTimeStamp.getServerTimeString(null, false, 1);
        var text = ChatTicketClass.TextEditor.grabHtml();
        $('#ticket-reply-counter').html(ChatTicketClass.TextEditor.grabText(true).length);

        if(!ChatTicketClass.InsertPlaceholder.length)
            ChatTicketClass.UpdateTicketQuickSearch();

        if(ChatTicketClass.LastActiveTicket != null && text.length > 60 && ChatTicketClass.LastDraftSave < (lz_global_timestamp()-90))
        {
            ChatTicketClass.LastDraftSave = lz_global_timestamp();
            ChatTicketClass.SaveDraft(ChatTicketClass.LastActiveTicket,text,ChatTicketClass.LastActiveTicket.messages[ChatTicketClass.GetUIProperty('selected-message-no',ChatTicketClass.SelectedMessageNo)].id);
        }

        var body = ChatTicketClass.TextEditor.getBody();
        if(IFManager.IsMobileOS || IFManager.IsTabletOS)
        {
            var div = document.getElementById('ticket-response-body');
            var count = 0;
            while(body.scrollHeight > body.clientHeight)
            {
                if(div.style.height=='')
                    div.style.height = '100px';
                div.style.height = parseInt(div.style.height.replace('px',''))+50+'px';
                if(++count>10)
                    break;
            }
        }

    });

    $(ChatTicketClass.TextEditor.getBody()).change();

    $('#ticket-reply-signature').change(function() {
        var sigValHTML = lz_global_base64_decode($('#ticket-reply-signature').val());

        if(d($('#ticket-reply-signature option:selected').attr('mod')))
            sigValHTML = lz_global_base64_decode($('#ticket-reply-signature option:selected').attr('mod'));

        sigValHTML = lzm_commonTools.NL2BR(sigValHTML);
        ChatTicketClass.SignatureEditor.setHtml(sigValHTML);

        if($('#ticket-signature-inner').hasClass('ui-disabled'))
        {
            if(!IFManager.IsMobileOS)
                ChatTicketClass.TextEditor.focus();
            else

            $(ChatTicketClass.SignatureEditor.getBody()).addClass('ui-disabled');
        }

        var body = ChatTicketClass.SignatureEditor.getBody();
        if(IFManager.IsMobileOS || IFManager.IsTabletOS)
        {
            var div = document.getElementById('ticket-signature-body');
            var count = 0;
            while(body.scrollHeight > body.clientHeight)
            {
                if(div.style.height=='')
                    div.style.height = '100px';
                div.style.height = parseInt(div.style.height.replace('px',''))+50+'px';
                if(++count>10)
                    break;
            }
        }
    });
    $(ChatTicketClass.SignatureEditor.getBody()).keyup(function(){
        var sigValHTML = ChatTicketClass.SignatureEditor.grabHtml();
        $('#ticket-reply-signature option:selected').attr('mod', lz_global_base64_encode(sigValHTML));
    });

    $('#ticket-reply-signature').change();

    var icount = 0;
    if(!IFManager.IsMobileOS)
    {
        var _si = setInterval(function(){

            ChatTicketClass.TextEditor.focus();
            $("#ticket-composer-form").scrollTop(0);

            if(icount++ > 5)
                clearInterval(_si);

        },100);
    }
    else
        $('#enable-tr-salutation').focus();

    if(d(_ticket) && d(_ticket.ta) && _ticket.ta.length)
    {
        ChatTicketClass.UpdateTicketQuickSearch(true,_ticket.ta);
    }

    ChatTicketClass.TextEditor.scrollDown();
};

ChatTicketClass.SaveDraft = function(_ticket,_text,_messageId){
    CommunicationEngine.SaveTicketDraft = {
        MessageId: _messageId,
        TicketId:_ticket.id,
        Text:_text
    };
};

ChatTicketClass.RemoveDraft = function(_ticket,_messageNo){
    CommunicationEngine.SaveTicketDraft = {
        MessageId: lzm_chatDisplay.ticketDisplay.GetTicketById(_ticket).messages[_messageNo],
        TicketId:_ticket,
        Text:''
    };
    $('.message-line-draft-' + _ticket + '_' + _messageNo).remove();

};

ChatTicketClass.OpenTicketView = function(_ticket){
    if(d(_ticket))
        CommunicationEngine.OpenTicketView = _ticket.id;
};

ChatTicketClass.GetUIProperty = function(_key,_default){

    var elem = '';

    if(ChatTicketClass.LastActiveTicket != null)
        elem = '#' + ChatTicketClass.LastActiveTicket.id+'-body';

    if(d($(elem).data(_key)))
        return $(elem).data(_key);
    else
        return _default;
};

ChatTicketClass.SetUIProperty = function(_key,_value){
    var elem = '#' + ChatTicketClass.LastActiveTicket.id+'-body';
    $(elem).data(_key,_value);
};

ChatTicketClass.Search = function(_searchString,_tags){
    var ticketFetchTime = DataEngine.ticketFetchTime;
    DataEngine.expectTicketChanges = true;
    CommunicationEngine.stopPolling();
    CommunicationEngine.ticketQuery = _searchString;
    CommunicationEngine.ticketPage = 1;
    CommunicationEngine.ticketTags = _tags;
    CommunicationEngine.resetTickets = true;
    CommunicationEngine.startPolling();
    switchTicketListPresentation(ticketFetchTime, 0);
};

ChatTicketClass.SetTags = function(_ticket, _tags, _send){

    var teid = _ticket.id+'-set-tag-editor';
    var teidorg = _ticket.id+'-tag-editor';

    window[teid] = new CommonInputControlsClass.TagEditor(teid,DataEngine.getConfigValue('gl_tags',false),true,true,false,true);
    window[teid].PermissionsToAdd = 'add_tags';
    window[teid].AddTags(_tags,true);
    window[teid].ShowDialog();

    $('#alert-btn-ok').click(function() {

        var tags = window[teid].GetListString(true);
        lzm_chatDisplay.ticketDisplay.SaveTicket(_ticket, false, {id:''}, '', null, tags);
        lzm_commonDialog.removeAlertDialog();

        window[teidorg].SelectedList = [];
        window[teidorg].AddTags(tags,true);
        window[teidorg].UpdateHTML();

        if(_send)
            $('#reply-ticket-details').click();
    });

    $('#alert-btn-cancel').click(function() {
        lzm_commonDialog.removeAlertDialog();
    });
};

function changeTicketStatus(myStatus, mySubStatus, myChannel, mySubChannel) {
    removeTicketContextMenu();
    if (lzm_chatDisplay.selectedTicketRow != '')
    {
        if (!PermissionEngine.checkUserPermissions('', 'tickets', 'change_ticket_status', {}) ||
            (!PermissionEngine.checkUserPermissions('', 'tickets', 'status_open', {}) && myStatus == 0) ||
            (!PermissionEngine.checkUserPermissions('', 'tickets', 'status_progress', {}) && myStatus == 1) ||
            (!PermissionEngine.checkUserPermissions('', 'tickets', 'status_closed', {}) && myStatus == 2) ||
            (!PermissionEngine.checkUserPermissions('', 'tickets', 'status_deleted', {}) && myStatus == 3)) {
            showNoPermissionMessage();
        }
        else
        {
            var selTickets = $('tr.ticket-list-row.selected-table-line');
            var ticketId, i = 0, silent = selTickets.length>1;

            selTickets.each(function()
            {
                ticketId = $(this).attr('id').replace('ticket-list-row-','');
                var myTicket = lzm_chatDisplay.ticketDisplay.GetTicketById(ticketId);
                if(myTicket != null)
                {
                    var ticketGroup = myTicket.gr;
                    var ticketEditor = -1;

                    if (typeof myTicket.editor != 'undefined' && myTicket.editor != false)
                    {
                        ticketEditor = myTicket.editor.ed;
                    }

                    var newStatus = (myStatus!=null) ? myStatus : ((myTicket.editor)? myTicket.editor.st:0);
                    var newSubStatus = (mySubStatus!=null) ? mySubStatus : ((myTicket.editor)? myTicket.editor.ss:'');
                    var newSubChannel = (mySubChannel!=null) ? mySubChannel : myTicket.s;
                    var newChannel = (myChannel!=null) ? myChannel : myTicket.t;

                    var deleteTicketMessage1 = t('Do you really want to remove this ticket irrevocably?');
                    var deleteTicketMessage2 = t('You have replied to this request. Do you really want to remove this ticket?');
                    var deleteTicketMessage3 = t('You have replied to this request. Do you really want to remove this ticket irrevocably?');
                    var opHasAnswered = false;

                    if (myTicket != null && d(myTicket.messages))
                        for (i=0; i<myTicket.messages.length; i++)
                            if (myTicket.messages[i].t == 1)
                                opHasAnswered = true;

                    if (myStatus == 5)
                    {
                        var mes = (opHasAnswered) ? deleteTicketMessage3 : deleteTicketMessage1;
                        lzm_commonDialog.createAlertDialog(mes, [{id: 'ok', name: t('Ok')}, {id: 'cancel', name: t('Cancel')}]);
                        $('#alert-btn-ok').click(function() {
                            lzm_commonDialog.removeAlertDialog();
                            UserActions.deleteTicket(ticketId,silent);
                        });
                        $('#alert-btn-cancel').click(function() {
                            lzm_commonDialog.removeAlertDialog();
                        });
                        if(silent)
                            $('#alert-btn-ok').click();
                    }
                    else if (myStatus != 3)
                    {
                        ChatTicketClass.InitUploadTicketDetails(myTicket, newChannel, newStatus, ticketGroup, ticketEditor, myTicket.l, '', '', '', '', '',null,null,null,newSubStatus,newSubChannel);
                    }
                    else if (myStatus == 3 && !opHasAnswered)
                    {
                        ChatTicketClass.InitUploadTicketDetails(myTicket, newChannel, newStatus, ticketGroup, ticketEditor, myTicket.l, '', '', '', '', '',null,null,null,newSubStatus,newSubChannel);
                    }
                    else if (myStatus == 3 && opHasAnswered)
                    {
                        lzm_commonDialog.createAlertDialog(deleteTicketMessage2, [{id: 'ok', name: t('Ok')}, {id: 'cancel', name: t('Cancel')}]);
                        $('#alert-btn-ok').click(function() {
                            ChatTicketClass.InitUploadTicketDetails(myTicket, newChannel, newStatus, ticketGroup, ticketEditor, myTicket.l, '', '', '', '', '',null,null,null,newSubStatus,newSubChannel);
                            ChatTicketClass.UploadTicketDetails();
                            lzm_commonDialog.removeAlertDialog();
                        });
                        $('#alert-btn-cancel').click(function() {
                            lzm_commonDialog.removeAlertDialog();
                        });
                        if(silent)
                            $('#alert-btn-ok').click();
                    }
                }
            });
            ChatTicketClass.UploadTicketDetails();
        }
    }
}

function handleTicketTree(_show){

    if(lzm_chatDisplay.windowWidth > ChatTicketClass.TreeSwitchWidth)
    {
        if(!d(_show))
            _show = !LocalConfiguration.ShowTicketTree;

        LocalConfiguration.ShowTicketTree = _show;
        LocalConfiguration.Save();

        if(_show)
            $('#ticket-tree').addClass('lzm-button-b-pushed');
        else
            $('#ticket-tree').removeClass('lzm-button-b-pushed');
    }
    else
        lzm_chatDisplay.ticketDisplay.CategorySelect = !lzm_chatDisplay.ticketDisplay.CategorySelect;

    UIRenderer.resizeTicketList();
}