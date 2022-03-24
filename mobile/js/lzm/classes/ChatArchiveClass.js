/****************************************************************************************
 * LiveZilla ChatArchiveClass.js
 *
 * Copyright 2017 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/
function ChatArchiveClass() {

}

ChatArchiveClass.SelectedChatId = '';
ChatArchiveClass.PreviewSwitchWidth = 800;

ChatArchiveClass.prototype.createArchive = function() {
    var that = this;
    var chatArchive = DataEngine.chatArchive;
    $('#archive-headline').html('<h3>' + t('Chat Archive') + '</h3>');
    $('#archive-headline2').html(that.CreateArchiveHeaderControls(CommunicationEngine.chatArchivePage, chatArchive.q, chatArchive.p, chatArchive.t,CommunicationEngine.chatArchiveFilter, CommunicationEngine.chatArchiveQuery)).trigger('create');
    $('#archive-body').html(that.CreateArchiveHtml(chatArchive.chats));
    $('#archive-footline').html(that.createArchivePagingHtml(CommunicationEngine.chatArchivePage, chatArchive.q, chatArchive.p));

    if (CommunicationEngine.chatArchiveQuery != '')
        that.styleArchiveClearBtn();

    if (CommunicationEngine.chatArchiveQuery != '')
        $('#archive-filter').addClass('ui-disabled');
    else
        $('#archive-filter').removeClass('ui-disabled');

    this.AddArchiveHeaderLogic();

    UIRenderer.resizeArchive();
};

ChatArchiveClass.prototype.AddArchiveHeaderLogic = function(){
    $('.archive_col_header').unbind("contextmenu");
    $('.archive_col_header').contextmenu(function(){
        var cm = {id: 'archive_header_cm',entries: [{label: tid('settings'),onClick : 'LocalConfiguration.__OpenTableSettings(\'archive\')'}]};
        ContextMenuClass.BuildMenu(event,cm);
        return false;
    });

    if(CommonInputControlsClass.SearchBox.ShowChatArchive)
        $('#archive-search').css('display','none');
};

ChatArchiveClass.prototype.UpdateArchive = function(pollObject) {

    $('#archive-headline2').html(this.CreateArchiveHeaderControls(CommunicationEngine.chatArchivePage, DataEngine.chatArchive.q, DataEngine.chatArchive.p, DataEngine.chatArchive.t,CommunicationEngine.chatArchiveFilter, CommunicationEngine.chatArchiveQuery)).trigger('create');
    this.AddArchiveHeaderLogic();

    pollObject = (typeof pollObject != 'undefined') ? pollObject : null;
    var customDemandToken = (pollObject != null && pollObject.p_cdt != 0) ? pollObject.p_cdt : false;
    var chatArchive = DataEngine.chatArchive.chats, that = this, selectedChatId = '';

    if(customDemandToken)
        chatArchive = lzm_chatDisplay.archiveControlChats[customDemandToken];

    if(!d(chatArchive))
        chatArchive = [];

    if (customDemandToken && $('#matching-chats-d-'+customDemandToken+'-inner').length)
    {
        /*
        selectedChatId = $('#matching-chats-d-'+customDemandToken+'-table').data('selected-chat-id');
        selectedChatId = (selectedChatId != '') ? selectedChatId : (chatArchive.length > 0) ? chatArchive[0].cid : '';
        //$('#matching-chats-d-'+customDemandToken+'-inner').html(that.CreateArchiveHtml(chatArchive, selectedChatId, true, 'd-'+customDemandToken));
        ChatArchiveClass.SelectChat(selectedChatId, true, 'd-'+customDemandToken);
        */
    }
    else if (customDemandToken && $('#matching-chats-e-'+customDemandToken+'-inner').length)
    {
        /*
        selectedChatId = $('#matching-chats-e-'+customDemandToken+'-table').data('selected-chat-id');
        selectedChatId = (selectedChatId != '') ? selectedChatId : (d(chatArchive) && chatArchive.length > 0) ? chatArchive[0].cid : '';
        //$('#matching-chats-e-'+customDemandToken+'-inner').html(that.CreateArchiveHtml(chatArchive, selectedChatId, true, 'e-'+customDemandToken));
        ChatArchiveClass.SelectChat(selectedChatId, true, 'e-'+customDemandToken);
        */
    }
    else
    {

        selectedChatId = $('#chat-archive-table').data('selected-chat-id');
        $('#archive-body').html(that.CreateArchiveHtml(chatArchive));
        $('#archive-footline').html(that.createArchivePagingHtml(CommunicationEngine.chatArchivePage, DataEngine.chatArchive.q, DataEngine.chatArchive.p));
        UIRenderer.resizeArchive();
        ChatArchiveClass.SelectChat(selectedChatId);

    }

    var numberOfChats = chatArchive.length;
    if (customDemandToken && $('#visitor-info-d-'+customDemandToken+'-placeholder').length > 0) {
        $('#visitor-info-d-'+customDemandToken+'-placeholder-tab-5').html(t('Chats (<!--number_of_chats-->)', [['<!--number_of_chats-->', numberOfChats]]));
        if(numberOfChats>0){
            $('#visitor-info-d-'+customDemandToken+'-placeholder-tab-5').removeClass('ui-disabled');
            $('#visitor-info-d-'+customDemandToken+'-placeholder-tab-5').addClass('lzm-tabs-message');
        }
    }
    if (customDemandToken && $('#visitor-info-e-'+customDemandToken+'-placeholder').length > 0) {
        $('#visitor-info-e-'+customDemandToken+'-placeholder-tab-5').html(t('Chats (<!--number_of_chats-->)', [['<!--number_of_chats-->', numberOfChats]]));
        if(numberOfChats>0){
            $('#visitor-info-e-'+customDemandToken+'-placeholder-tab-5').removeClass('ui-disabled');
            $('#visitor-info-e-'+customDemandToken+'-placeholder-tab-5').addClass('lzm-tabs-message');
        }
    }

    if ($('#ticket-linker-first').length > 0) {
        var position = $('#ticket-linker-first').data('search').split('~')[0];
        var linkerType = $('#ticket-linker-first').data('search').split('~')[1];
        var inputChangeId = $('#ticket-linker-first').data('input');
        if (linkerType == 'chat')
            that.fillLinkData(position, $('#' + inputChangeId).val(), false);
    }

    $('.archive_col_header').unbind("contextmenu");
    $('.archive_col_header').contextmenu(function(){
        var cm = {id: 'archive_header_cm',entries: [{label: tid('settings'),onClick : 'LocalConfiguration.__OpenTableSettings(\'archive\')'}]};
        ContextMenuClass.BuildMenu(event,cm);
        return false;
    });
};

ChatArchiveClass.prototype.styleArchiveClearBtn = function() {
    var ctsBtnWidth = $('#clear-archive-search').width(), that = this;
    var ctsBtnHeight =  $('#clear-archive-search').height();
    var ctsBtnPadding = Math.floor((18-ctsBtnHeight)/2)+'px ' +  Math.floor((18-ctsBtnWidth)/2)+'px ' + Math.ceil((18-ctsBtnHeight)/2)+'px ' +  Math.ceil((18-ctsBtnWidth)/2)+'px';
    $('#clear-archive-search').css({padding: ctsBtnPadding});
};

ChatArchiveClass.prototype.CreateArchiveHtml = function(chatArchive, chatId) {
    chatArchive = (d(chatArchive)) ? chatArchive : [];
    chatId = (typeof chatId != 'undefined' && chatId != '') ? chatId : (chatArchive.length > 0) ? chatArchive[0].cid : '';

    var i, that = this, archiveHtml = '';
    var tableId = 'chat-archive-table';
    var style = '';


    archiveHtml += '<div id="archive-list-left">';
    archiveHtml += '<table id="' + tableId + '" class="visible-list-table alternating-rows-table lzm-unselectable"' + ' data-selected-chat-id="' + chatId + '"'+style+'><thead><tr><th></th>';

    var fullScreen = lzm_chatDisplay.IsFullscreenMode();
    for (i=0; i<LocalConfiguration.TableColumns.archive.length; i++)
    {
        if (LocalConfiguration.TableColumns.archive[i].displayMobile == '1' || fullScreen)
            if (LocalConfiguration.TableColumns.archive[i].display == 1)
            {
                archiveHtml += '<th class="archive_col_header inactive-sort-column" style="white-space: nowrap;">' + t(LocalConfiguration.TableColumns.archive[i].title);
                if(LocalConfiguration.TableColumns.archive[i].cid=='date')
                    archiveHtml += '&nbsp;&nbsp;&nbsp;<span class="table-sort-icon"><i class="fa fa-caret-down"></i></span>';
                archiveHtml += '</th>';

            }
    }

    archiveHtml += '</tr></thead>';
    archiveHtml += '<tbody>';

    for (i=0; i<chatArchive.length; i++)
        archiveHtml += that.CreateArchiveListLine(chatArchive[i], chatId);

    archiveHtml += '</tbody></table>';
    archiveHtml += '</div><div id="archive-list-right" class="archive-list" style="display: block;"></div>';

    return archiveHtml;
};

ChatArchiveClass.prototype.CreateArchiveListLine = function(aChat, selectedChatId) {

    var name = '', operatorName = '-', groupName = '-', fieldClass;
    var date = lzm_commonTools.getHumanDate(lzm_chatTimeStamp.getLocalTimeObject(aChat.ts * 1000, true), '', lzm_chatDisplay.userLanguage);
    var opName = '',opId, cpId, qId;
    if (aChat.t == 0)
    {
        var opList = aChat.iid.split('-');
        var myPosition = $.inArray(lzm_chatDisplay.myId, opList);
        if (myPosition != -1)
        {
            opId = opList[myPosition];
            cpId = opList[1 - myPosition];
        }
        else
        {
            opId = opList[0];
            cpId = opList[1];
        }
        qId = aChat.iid;
    }
    else
    {
        opId = aChat.iid;
        cpId = (aChat.eid != '') ? aChat.eid : aChat.gid;
        qId = cpId;
    }
    try
    {
        if(DataEngine.operators.getOperator(cpId) != null)
            opName = DataEngine.operators.getOperator(cpId).name;
        else
            opName = cpId;


        name = (aChat.t == 0) ? opName : (aChat.t == 1) ? lzm_commonTools.htmlEntities(aChat.en) : (aChat.gid == 'everyoneintern') ? tid('all_operators') : capitalize(aChat.gid);
    }
    catch (e)
    {
        deblog(e);
    }
    try
    {
        var operator = DataEngine.operators.getOperator(opId);
        operatorName = (operator != null) ? operator.name : '-';
    }
    catch (e)
    {
        deblog(e);
    }
    try
    {
        groupName = (aChat.gid != '') ? (aChat.gid != 'everyoneintern') ? DataEngine.groups.getGroup(aChat.gid).name : tid('all_operators') : '-';
    }
    catch (e) {groupName = aChat.gid;}

    var area = (aChat.ac != '') ? aChat.ac : '-';
    var waitingTime = (aChat.t == 1) ? lzm_commonTools.getHumanTimeSpan(parseInt(aChat.wt)) : '-';
	var duration = (aChat.t == 1) ? lzm_commonTools.getHumanTimeSpan(parseInt(aChat.dt)) : '-';

    if(aChat.wt==0 && aChat.dt != 0)
        waitingTime = duration;

    var result = (aChat.t == 1) ? (aChat.sr == 0) ? tid('missed') : (aChat.sr == 1) ? tid('accepted') : tid('declined') : '-';
    var endedBy = (aChat.t == 1) ? (aChat.er == 0) ? tid('visitor') : tid('operator') : '-';

    if(aChat.t == 1 && aChat.sr == 2 && aChat.wt==0)
        endedBy = tid('system');

    var callBack = (aChat.t == 1) ? (aChat.cmb != 0) ? t('Yes') : t('No') : '-';
    var email = (aChat.em != '') ? lzm_commonTools.htmlEntities(aChat.em) : '-';
    var language = (aChat.il != '') ? aChat.il : '-';
    var langName = (typeof lzm_chatDisplay.availableLanguages[language.toLowerCase()] != 'undefined') ? lzm_chatDisplay.availableLanguages[language.toLowerCase()] : (typeof lzm_chatDisplay.availableLanguages[language.toLowerCase().split('-')[0]] != 'undefined') ?lzm_chatDisplay.availableLanguages[language.toLowerCase().split('-')[0]] :language;
    var country = (aChat.ic != '') ? lzm_chatDisplay.getCountryName(aChat.ic,false) : '-';
    var host = (aChat.ho != '') ? aChat.ho : '-';
    var phone = __fallback(aChat.cp);
    var question = (aChat.q != '') ? lzm_commonTools.htmlEntities(aChat.q) : '-';

    function __fallback(_val){
        return (d(_val) && _val != '') ? lzm_commonTools.htmlEntities(_val) : '-';
    }

    var onclickAction = ((!IFManager.IsAppFrame && !IFManager.IsMobileOS) || IFManager.IsDesktopApp()) ? ' onclick="ChatArchiveClass.SelectChat(\'' + aChat.cid + '\', false);"' : ' onclick="ChatArchiveClass.ShowContextMenu(event, \'' + aChat.cid + '\');"';
    var ondblclickAction = ((!IFManager.IsAppFrame && !IFManager.IsMobileOS) || IFManager.IsDesktopApp()) ? ' ondblclick="showArchivedChat(\'' + qId + '\',\'' + aChat.cid + '\');"' : '';
    var action = onclickAction + ondblclickAction;


    action += ((!IFManager.IsAppFrame && !IFManager.IsMobileOS) || IFManager.IsDesktopApp()) ? ' oncontextmenu="ChatArchiveClass.ShowContextMenu(event, \'' + aChat.cid + '\');"' : '';

    var pageUrl = (typeof aChat.u != 'undefined' && aChat.u != '') ? aChat.u : '-';
    var columnContents = [{cid: 'date', contents: date},
        {cid: 'chat_id', contents: aChat.cid},
        {cid: 'name', contents: name},
        {cid: 'operator', contents: operatorName},
        {cid: 'group', contents: groupName},
        {cid: 'email', contents: __fallback(aChat.em)},
        {cid: 'company', contents: __fallback(aChat.co)},
        {cid: 'language', contents: langName},
        {cid: 'country', contents: country},
        {cid: 'ip', contents: __fallback(aChat.ip)},
        {cid: 'host', contents: __fallback(aChat.ho)},
        {cid: 'duration', contents: duration},
        {cid: 'website_name', contents: area},
        {cid: 'page_url', contents: pageUrl},
        {cid: 'waiting_time', contents: waitingTime},
        {cid: 'result', contents: result}, {cid: 'ended_by', contents: endedBy},
        {cid: 'callback', contents: callBack},
        {cid: 'phone', contents: __fallback(aChat.cp)},
        {cid: 'question', contents: __fallback(aChat.q)},
        {cid: 'ticketid', contents: __fallback(aChat.tid)},
        {cid: 'tags', class: 'tag-field', contents: lzm_commonTools.FormatTableTags(aChat.ta)}
    ];

    LocalConfiguration.AddCustomBlock(columnContents);

    var icon,selectedClass = (aChat.cid == selectedChatId) ? ' selected-table-line' : '';
    var lineAttributes = ' id="archive-list-line-' + aChat.cid + '" class="archive-list-line' + selectedClass + '"';

    var archiveLineHtml;

    var i,j;
    archiveLineHtml = '<tr' + action + lineAttributes + '>';

    if(aChat.t == '1')
        icon = 'user-circle icon-blue';
    else if(aChat.t == '2')
        icon = 'group';
    else if(aChat.t == '0')
        icon = 'user icon-green';

    archiveLineHtml += '<td class="icon-column"><i class="fa fa-'+icon+'"></i></td>';

    var fullScreen = lzm_chatDisplay.IsFullscreenMode();
    for (i=0; i<LocalConfiguration.TableColumns.archive.length; i++)
    {
        for (j=0; j<columnContents.length; j++)
        {
            if (LocalConfiguration.TableColumns.archive[i].displayMobile == '1' || fullScreen)
                if (LocalConfiguration.TableColumns.archive[i].cid == columnContents[j].cid && LocalConfiguration.TableColumns.archive[i].display == 1)
                {
                    fieldClass = '';
                    if(d(columnContents[j].class))
                        fieldClass = ' class="'+columnContents[j].class+'"';

                    if(!LocalConfiguration.IsCustom(columnContents[j].cid))
                    {
                        archiveLineHtml += '<td'+fieldClass+'>' + lzm_commonTools.HighlightSearchKey(columnContents[j].contents,CommonInputControlsClass.SearchBox.GetQuery()) + '</td>';
                    }
                    else
                    {
                        var cindex = columnContents[j].cid.replace('c','');
                        var myCustomInput = DataEngine.inputList.getCustomInput(DataEngine.inputList.idList[cindex]);
                        if (myCustomInput.active == 1)
                        {
                            var inputText = '';
                            for (var x=0; x<aChat.cc.length; x++)
                            {
                                if (aChat.cc[x].cuid == myCustomInput.name)
                                    inputText = (myCustomInput.type != 'CheckBox') ? lzm_commonTools.htmlEntities(aChat.cc[x].text) : (aChat.cc[x].text == 1) ? t('Yes') : t('No');
                            }
                            inputText = (inputText != '') ? inputText : '-';
                            archiveLineHtml += '<td'+fieldClass+'>' + lzm_commonTools.HighlightSearchKey(inputText,CommonInputControlsClass.SearchBox.GetQuery()) + '</td>';
                        }
                    }
                }

        }
    }
    archiveLineHtml += '</tr>';

    return archiveLineHtml;
};

ChatArchiveClass.prototype.createArchivePagingHtml = function(page, amount, amountPerPage) {
    var numberOfPages = Math.max(1, Math.ceil(amount / amountPerPage));
    var pagingHtml = '<span id="archive-paging">';
    var leftDisabled = (page == 1) ? ' ui-disabled' : '';
    var rightDisabled = (page == numberOfPages) ? ' ui-disabled' : '';
    if (!isNaN(numberOfPages)) {
        pagingHtml += lzm_inputControls.createButton('archive-page-all-backward', 'archive-list-page-button' + leftDisabled, 'ChatArchiveClass.Page(1);', '', '<i class="fa fa-fast-backward"></i>', 'l',{},'',-1,'e') +
            lzm_inputControls.createButton('archive-page-one-backward', 'archive-list-page-button' + leftDisabled, 'ChatArchiveClass.Page(' + (page - 1) + ');', '', '<i class="fa fa-backward"></i>', 'r',{},'',-1,'e') +
            '<span style="padding: 0 15px;">' + t('Page <!--this_page--> of <!--total_pages-->',[['<!--this_page-->', page], ['<!--total_pages-->', numberOfPages]]) + '</span>' +
            lzm_inputControls.createButton('archive-page-one-forward', 'archive-list-page-button' + rightDisabled, 'ChatArchiveClass.Page(' + (page + 1) + ');', '', '<i class="fa fa-forward"></i>', 'l',{},'',-1,'e') +
            lzm_inputControls.createButton('archive-page-all-forward', 'archive-list-page-button' + rightDisabled, 'ChatArchiveClass.Page(' + numberOfPages + ');', '', '<i class="fa fa-fast-forward"></i>', 'r',{},'',-1,'e');
    }
    pagingHtml += '</span>';
    return pagingHtml;
};

ChatArchiveClass.prototype.CreateArchiveHeaderControls = function(page, amount, amountPerPage, totalAmount, filter, query) {
    var controlHtml = '';
    if (lzm_chatDisplay.windowWidth > 500)
    {
        controlHtml += '<span class="lzm-dialog-hl2-info">';
        if (query != '' || filter != '012')
            controlHtml += t('<!--total_amount--> total entries, <!--amount--> matching filter', [['<!--total_amount-->', totalAmount], ['<!--amount-->', amount]]);
        else
            controlHtml += t('<!--total_amount--> total entries, no filter selected', [['<!--total_amount-->', totalAmount]]);
        controlHtml += '</span>';
    }

    controlHtml += '<span class="right-button-list">' +
        lzm_inputControls.createButton('archive-filter', '', 'openArchiveFilterMenu(event, \'' + filter + '\')', t('Filter'), '<i class="fa fa-filter"></i>', 'lr', {'margin-right': '4px'}, '', 10, 'e') +
        lzm_inputControls.createButton('archive-search', '', 'CommonInputControlsClass.SearchBox.ToggleSearchDialog(true);','', '<i class="fa fa-search"></i>', 'lr',{'margin-right': '4px'}, '', -1,'e') + '</span>';

    return controlHtml;
};

ChatArchiveClass.prototype.CreateMatchingChatsTabs = function(_visitorId, _listOfChats) {

    if(!d(_listOfChats) || _listOfChats == null)
        _listOfChats = [];

    var chattabs = [];

    for (var i=0; i<_listOfChats.length; i++)
    {
        var content = '<div class="lzm-tab-scroll-content lzm-tab-scroll-content-sub">'+ChatArchiveClass.PrepareChatContent(_listOfChats[i].chtml)+'</div>';
        chattabs.push({name: _listOfChats[i].cid, content: content, hash: _listOfChats[i].cid});
    }

    return chattabs;
};

ChatArchiveClass.prototype.sendChatTranscriptTo = function(chatId) {
    
    var receiverList = lzm_inputControls.createInput('send-transcript-to-email','', '', t('Email addresses: (separate by comma)'), '', 'text','');
    lzm_commonDialog.createAlertDialog(receiverList, [{id: 'ok', name: tid('ok')},{id: 'cancel', name: tid('cancel')}],false,true,false);

    var chats = lzm_commonTools.GetElementByProperty(DataEngine.chatArchive.chats,'cid',chatId);
    if(chats.length)
        $('#send-transcript-to-email').val(chats[0].em);

    $('#send-transcript-to-email').focus();
    $('#alert-btn-ok').click(function() {
        CommunicationEngine.pollServerSpecial({em: $('#send-transcript-to-email').val(), cid: chatId}, 'send-chat-transcript');
        $('#alert-btn-cancel').click();
    });
    $('#alert-btn-cancel').click(function() {
        lzm_commonDialog.removeAlertDialog();
    });
};

ChatArchiveClass.prototype.fillLinkData = function(chatId, onlyReturnHtml) {
    onlyReturnHtml = (typeof onlyReturnHtml != 'undefined') ? onlyReturnHtml : false;
    var myChat = null, tableString = '';
    for (i=0; i<DataEngine.chatArchive.chats.length; i++) {
        if (DataEngine.chatArchive.chats[i].cid == chatId) {
            myChat = lzm_commonTools.clone(DataEngine.chatArchive.chats[i]);
        }
    }
    if (myChat != null) {
        var chatDate = lzm_chatTimeStamp.getLocalTimeObject(myChat.ts * 1000, true);
        var chatDateHuman = lzm_commonTools.getHumanDate(chatDate, 'full', lzm_chatDisplay.userLanguage);
        var op = (myChat.iid.indexOf('-') != -1) ? DataEngine.operators.getOperator(myChat.iid.split('-')[1]) : null;
        var gr = DataEngine.groups.getGroup(myChat.gid);
        var cpName = (myChat.eid != '') ? lzm_commonTools.escapeHtml(myChat.en) : (op != null) ? op.name : (gr != null) ? gr.name :
            (myChat.gid == 'everyoneintern') ? tid('all_operators') : '';
        tableString = '<table>' +
            '<tr><th rowspan="6"><i class="fa fa-comments icon-blue icon-xl"></i></th><th>' + t('Name:') + '</th><td>' + cpName + '</td></tr>' +
            '<tr><th>' + t('Email:') + '</th><td>' + lzm_commonTools.escapeHtml(myChat.em) + '</td></tr>' +
            '<tr><th>' + t('Company:') + '</th><td>' + lzm_commonTools.escapeHtml(myChat.co) + '</td></tr>' +
            '<tr><th>' + t('Phone:') + '</th><td>' + lzm_commonTools.escapeHtml(myChat.cp) + '</td></tr>' +
            '<tr><th>' + tidc('date') + '</th><td>' + chatDateHuman + '</td></tr>' +
            '<tr><th>' + tidc('visitor_id') + '</th><td>' + myChat.eid + '</td></tr>' +
            '</table>';
        if (!onlyReturnHtml)
            $('#second-link-div').css({'visibility': 'visible'});
    } else {
        if (!onlyReturnHtml)
            $('#second-link-div').css({'visibility': 'hidden'});
    }
    if (!onlyReturnHtml)
        $('#second-link-div').html(tableString);
    return tableString;
};

ChatArchiveClass.prototype.createArchiveFilterMenu = function(myObject) {
    var filterList = [], contextMenuHtml = '';
    filterList = myObject.filter.split('');
    for (var i=0; i<4; i++) {
        if ($.inArray(i.toString(), filterList) != -1) {
            lzm_chatDisplay.archiveFilterChecked[i] = 'visible';
        } else {
            lzm_chatDisplay.archiveFilterChecked[i] = 'hidden';
        }
    }
    contextMenuHtml += '<div onclick="toggleArchiveFilter(0, event)"><span id="toggle-archive-open" class="cm-line cm-click" style="padding-left: 0px;">' +t('<!--checked--> Operators', [['<!--checked-->', '<span style="visibility: ' + lzm_chatDisplay.archiveFilterChecked[0] + ';">&#10003;</span>']]) + '</span></div>';
    contextMenuHtml += '<div onclick="toggleArchiveFilter(1, event)"><span id="toggle-archive-progress" class="cm-line cm-click" style="padding-left: 0px;">' +t('<!--checked--> Visitors', [['<!--checked-->', '<span style="visibility: ' + lzm_chatDisplay.archiveFilterChecked[1] + ';">&#10003;</span>']]) + '</span></div>';
    contextMenuHtml += '<div onclick="toggleArchiveFilter(2, event)"><span id="toggle-archive-closed" class="cm-line cm-click" style="padding-left: 0px;">' +t('<!--checked--> Groups', [['<!--checked-->', '<span style="visibility: ' + lzm_chatDisplay.archiveFilterChecked[2] + ';">&#10003;</span>']]) + '</span></div>';
    return contextMenuHtml;
};

ChatArchiveClass.SelectChat = function(_chatId) {

    _chatId = (!d(_chatId)) ? '' : _chatId;
    ChatArchiveClass.SelectedChatId = _chatId;

    var thisChat = {}, chatHtml='', i = 0;

    for (i=0; i<DataEngine.chatArchive.chats.length; i++)
    {
        if(_chatId=='')
            _chatId = DataEngine.chatArchive.chats[i].cid;
        if (DataEngine.chatArchive.chats[i].cid == _chatId)
            thisChat = DataEngine.chatArchive.chats[i];
    }

    $('.archive-list-line').removeClass('selected-table-line');
    $('#archive-list-line-' + _chatId).addClass('selected-table-line');
    $('#chat-archive-table').data('selected-chat-id', _chatId);

    if(d(thisChat.chtml))
        chatHtml = thisChat.chtml;

    chatHtml = ChatArchiveClass.PrepareChatContent(chatHtml);

    $('#archive-list-right').html(chatHtml);
    Chat.RemovePostsCommands('archive-list-right');
    Chat.ParseDates('archive-list-right');
};

ChatArchiveClass.PrepareChatContent = function(_html){

    var html = '<div style="padding-bottom:5px;background:#fff;">' + _html.replace(/\.\/images\//g, 'img/') + '</div>';
    html = html.replace(/<!--lang_whisper-->/g, tid('whisper'));
    html = lzm_commonTools.replaceLinksInChatView(html);
    html = lzm_commonTools.HighlightSearchKey(html,CommonInputControlsClass.SearchBox.GetQuery(),false,-1);

    return html;
};

ChatArchiveClass.SetLoading = function(counter){

    var loadingHtml;
    if (counter == 0)
    {
        $('#chat-archive-table tbody').empty();
        loadingHtml = '<div id="archive-loading"><div class="lz_anim_loading"></div></div>';
        $('#archive-body').append(loadingHtml).trigger('create');

        var right = (lzm_chatDisplay.windowWidth > ChatArchiveClass.PreviewSwitchWidth) ? '450px' : 0;
        $('#archive-loading').css({position: 'absolute',left:0,top:'1px',bottom:0,right:right,'background-color': 'var(--main-floor-color)','z-index': 1000});
    }
};

ChatArchiveClass.Remove = function(_cid){
    if(PermissionEngine.permissions.chat_archive_remove != 1)
    {
        showNoPermissionMessage('chat_archive_remove');
        return;
    }
    lzm_commonDialog.createAlertDialog(tid('resource_really_delete'), [{id: 'ok', name: tid('ok')}, {id: 'cancel', name: tid('cancel')}]);
    $('#alert-btn-ok').click(function() {
        CommunicationEngine.pollServerSpecial(_cid, 'remove-from-chat-archive');
        $('#archive-list-line-' + _cid).remove();
        lzm_commonDialog.removeAlertDialog();
    });
    $('#alert-btn-cancel').click(function() {
        lzm_commonDialog.removeAlertDialog();
    });
};

ChatArchiveClass.ShowContextMenu = function(e, chatId) {

    var i;
    ContextMenuClass.RemoveAll();
    e.preventDefault();
    ChatArchiveClass.SelectChat(chatId);

    var archivedChat = null;

        for (i=0; i<DataEngine.chatArchive.chats.length; i++)
        {
            if (DataEngine.chatArchive.chats[i].cid == chatId)
            {
                archivedChat = lzm_commonTools.clone(DataEngine.chatArchive.chats[i]);
            }
        }


    if (archivedChat != null)
    {
        e.stopPropagation();

        var cpId = '', qId = '';

        if (archivedChat.t == 0)
        {
            qId = archivedChat.iid;
        }
        else
        {
            cpId = (archivedChat.eid != '') ? archivedChat.eid : archivedChat.gid;
            qId = cpId;
        }

        var cm = {id: 'chat_archive_cm',entries: []};


            cm.entries.push({label: t('All Chats of this User'), onClick : 'showArchivedChat(\'' + qId + '\',\'' + archivedChat.cid + '\');'});

        if(archivedChat.t != 0 && archivedChat.t != 2)
            cm.entries.push({label: t('Send transcript to...'), onClick : 'sendChatTranscriptTo(\'' + archivedChat.cid + '\');'});

        cm.entries.push({label: t('Link with Ticket'), onClick : 'showTicketLinker(\'\', \'' + archivedChat.cid + '\', \'ticket\', \'chat\');'});

        cm.entries.push({label: tid('tags'), onClick : 'ChatManager.SetTags(\'' + archivedChat.cid + '\',\'' + lz_global_base64_encode(archivedChat.ta) + '\');'});

        if(archivedChat.t != 0 && archivedChat.t != 2)
            cm.entries.push({label: t('Create Ticket'), onClick : 'Chat.CreateTicket(\'' + archivedChat.cid + '\');'});

        cm.entries.push({label: t('Print Chat'), onClick : 'printArchivedChat(\'' + archivedChat.cid + '\');'});

        cm.entries.push({label: tid('remove'), onClick : 'ChatArchiveClass.Remove(\'' + archivedChat.cid + '\');'});

        ContextMenuClass.BuildMenu(e,cm);
        return false;
    }
};

ChatArchiveClass.Search = function (_query,_tags) {
    $('.archive-list-page-button').addClass('ui-disabled');
    CommunicationEngine.chatArchiveQuery = _query.replace(/^ +/, '').replace(/ +$/, '').toLowerCase();
    CommunicationEngine.chatArchivePage = 1;
    CommunicationEngine.chatArchiveTags = _tags;
    CommunicationEngine.chatArchiveFilter = '012';
    CommunicationEngine.resetChats = true;
    CommunicationEngine.pollServer();
    ChatArchiveClass.SetLoading(0);
};

ChatArchiveClass.Page = function(_page) {
    ChatArchiveClass.SelectedChatId = '';
    $('#chat-archive-table').data('selected-chat-id','');
    $('.archive-list-page-button').addClass('ui-disabled');
    CommunicationEngine.stopPolling();
    DataEngine.expectArchiveChanges = true;
    CommunicationEngine.chatArchivePage = _page;
    CommunicationEngine.resetChats = true;
    CommunicationEngine.startPolling();
    ChatArchiveClass.SetLoading(0);
};

function printArchivedChat(chatId) {

    var myChat = null;

    for (var i=0; i<DataEngine.chatArchive.chats.length; i++)
        if (DataEngine.chatArchive.chats[i].cid == chatId)
            myChat = DataEngine.chatArchive.chats[i];


    if (myChat != null)
        lzm_commonTools.printContent('chat', {chat: myChat});
}

function showArchivedChat(_visitorId,_chatId) {
    ChatPollServerClass.ResetGeneralHash = true;

    ChatVisitorClass.ShowVisitorInformation(_visitorId, 5, _chatId);
}