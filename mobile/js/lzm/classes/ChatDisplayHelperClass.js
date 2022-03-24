/****************************************************************************************
 * LiveZilla ChatDisplayHelperClass.js
 *
 * Copyright 2017 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/

function ChatDisplayHelperClass() {
    this.browserName = '';
    this.browserVersion = '';
    this.browserMinorVersion = '';
    this.showBrowserNotificationTime = 0;
}

ChatDisplayHelperClass.ActiveInfoType = '';
ChatDisplayHelperClass.NotificationRemovalTimer = null;

ChatDisplayHelperClass.prototype.getMyObjectName = function() {
    for (var name in window) {
        if (window[name] == this)
        {
            return name;
        }
    }
    return '';
};

ChatDisplayHelperClass.prototype.minimizeDialogWindow = function(dialogId, windowId, data) {

    // bugfix for dead window frame 2017-11-10
    $('.dialog-window-container').each(function(){
        if($(this).html()== '')
        {
            console.trace();
            $(this).remove();
        }
    });

    CommonUIClass.ToggleSelectViewMenu(true);

    var img = '', title = '', type = '';
    lzm_chatDisplay.StoredDialogIds.push(dialogId);

    var winObj = TaskBarManager.GetWindow(dialogId);
    if (winObj.TypeId == 'chat-window')
    {
        ChatManager.SaveEditorInput();
        removeEditor();
    }
    else if(winObj.DialogId.startsWith('qrd-edit-') || winObj.DialogId.startsWith('qrd-add-'))
    {
        if(!winObj.DialogId.endsWith('settings'))
            if(KnowledgebaseUI.TextEditor != null)
                ChatManager.SaveEditorInput(dialogId, KnowledgebaseUI.TextEditor.grabHtml());
    }
    else if(winObj.DialogId == 'chat-invitation')
    {
        ChatManager.SaveEditorInput(dialogId, ChatVisitorClass.ChatInviteEditor.grabHtml());
    }
    else if(winObj.DialogId.startsWith('show-kb-entry'))
    {
        var kbEntry = winObj.Tag;
        if(kbEntry.ty < KnowledgebaseUI.TypeURL)
        {
            ChatManager.SaveEditorInput(dialogId, KnowledgebaseUI.TextEditor.grabHtml());
        }
    }
    else if(winObj.TypeId.endsWith('_reply'))
    {
        if(ChatTicketClass.TextEditor != null)
        {
            $('#ticket-reply-input').val(ChatTicketClass.TextEditor.grabHtml());
        }
    }

    var domNode = null;
    if(!winObj.StaticWindowType)
    {
        domNode = $('#' + dialogId + '-container').detach();
    }
    else
        $('#' + dialogId + '-container').css('display','none');

    TaskBarManager.WindowsHidden[dialogId] =
    {
        'dialog-id': dialogId,
        'window-id': dialogId,
        'content': domNode,
        'data': data,
        'type': type, 'title': title, 'img': img,
        'selected-view': lzm_chatDisplay.selected_view,
        'show-stored-icon': true
    };

};

ChatDisplayHelperClass.prototype.maximizeDialogWindow = function(dialogId) {

    CommonUIClass.ToggleSelectViewMenu(true);

    var winObj = TaskBarManager.GetWindow(dialogId);

    if(winObj != null && !winObj.HTMLCreated)
        lzm_commonDialog.CreateDialogWindowHTML(winObj);

    if ($.inArray(dialogId, lzm_chatDisplay.StoredDialogIds) != -1)
    {
        if (lzm_chatDisplay.selected_view != 'qrd')
            cancelQrdPreview();

        //lzm_chatDisplay.toggleVisibility();
        lzm_chatDisplay.UpdateViewSelectPanel();
        lzm_chatDisplay.dialogData = TaskBarManager.WindowsHidden[dialogId].data;

        var dialogWindowId = TaskBarManager.WindowsHidden[dialogId]['window-id'];
        var dialogContainerHtml = '<div id="' + dialogWindowId + '-container" class="dialog-window-container"></div>';
        var dialogContent = TaskBarManager.WindowsHidden[dialogId].content;

        if(dialogContent != null)
        {
            $('#chat_page').append(dialogContainerHtml).trigger('create');
            $('#' + dialogWindowId + '-container').css(lzm_chatDisplay.dialogWindowContainerCss);
            $('#' + dialogWindowId + '-container').replaceWith(dialogContent);
        }
        else
            $('#' + dialogWindowId + '-container').css('display','block');

        if (TaskBarManager.WindowsHidden[dialogId].type == 'visitor-information')
        {
            var selectedVisitor = VisitorManager.GetVisitor(TaskBarManager.WindowsHidden[dialogId].data['visitor-id']);
            if (selectedVisitor != null)
                lzm_chatDisplay.VisitorsUI.UpdateVisitorInformation(selectedVisitor.id);
        }

        delete TaskBarManager.WindowsHidden[dialogId];

        var tmpStoredDialogIds = [];
        for (var j=0; j<lzm_chatDisplay.StoredDialogIds.length; j++)
        {
            if (dialogId != lzm_chatDisplay.StoredDialogIds[j]) {
                tmpStoredDialogIds.push(lzm_chatDisplay.StoredDialogIds[j]);
            }
        }
        lzm_chatDisplay.StoredDialogIds = tmpStoredDialogIds;

        $('#minb-' + dialogId).remove();
        $('#usersettings-menu').css({'display': 'none'});
    }

    if (winObj.TypeId == 'chat-window')
    {
        OpenChatWindow(winObj.Tag);
        ChatManager.SetActiveChat(winObj.Tag);
        //KnowledgebaseUI.AutoSearchChat(false);
        lzm_chatDisplay.VisitorsUI.UpdateVisitorInformation(VisitorManager.GetVisitorPart(winObj.Tag));
    }
    else if(winObj.DialogId.startsWith('qrd-edit-') && !winObj.DialogId.endsWith('settings'))
    {
        KnowledgebaseUI.TextEditor = new ChatEditorClass('qrd-edit-text');
        KnowledgebaseUI.TextEditor.init(ChatManager.LoadEditorInput(winObj.DialogId), 'editQrd', '');
    }
    else if(winObj.DialogId.startsWith('qrd-add-') && !winObj.DialogId.endsWith('settings'))
    {
        KnowledgebaseUI.TextEditor = new ChatEditorClass('qrd-add-text');
        KnowledgebaseUI.TextEditor.init(ChatManager.LoadEditorInput(winObj.DialogId), 'addQrd', '');
    }
    else if(winObj.DialogId.startsWith('show-kb-entry'))
    {
        var kbEntry = winObj.Tag;
        if(kbEntry.ty < KnowledgebaseUI.TypeURL)
        {
            KnowledgebaseUI.TextEditor = new ChatEditorClass('show-kb-entry-text');
            KnowledgebaseUI.TextEditor.init(ChatManager.LoadEditorInput(winObj.DialogId), 'show-kb-entry', '');
        }
    }
    else if(winObj.DialogId == 'chat-invitation')
    {
        KnowledgebaseUI.TextEditor = new ChatEditorClass('invitation-text');
        KnowledgebaseUI.TextEditor.init(ChatManager.LoadEditorInput(winObj.DialogId), '', '');
    }
    else if(winObj.TypeId.endsWith('_reply'))
    {
        ChatTicketClass.LastActiveTicket = lzm_chatDisplay.ticketDisplay.GetTicketById(winObj.TypeId.replace('_reply',''));
        $('#ticket-reply-input').focus();
        if($('#ticket-response-inner').length)
        {
            ChatTicketClass.TextEditor = new ChatEditorClass('ticket-response');
            ChatTicketClass.InitResponseEditor($('#ticket-reply-input').val());
        }
    }
    else if(winObj.TypeId.startsWith('report_'))
    {
       // $('.report-iframe').css({height:'200px'});
    }
    else if(winObj.TypeId == 'ticket-details')
    {
        if(ChatTicketClass.LastActiveTicket != null)
        {
            ChatTicketClass.LastActiveTicket = lzm_chatDisplay.ticketDisplay.GetTicketById(winObj.DialogId);
            lzm_chatDisplay.ticketDisplay.updateTicketDetails(ChatTicketClass.LastActiveTicket);
        }
    }
    else if (winObj.DialogId == 'email-list')
        lzm_chatDisplay.ticketDisplay.UpdateEmailLists();
    else if (winObj.DialogId == 'feedbacks_viewer_dialog')
        lzm_chatDisplay.FeedbacksViewer.UpdateViewer();
    else if (winObj.DialogId.startsWith('visitor-information-'))
        lzm_chatDisplay.VisitorsUI.UpdateVisitorInformation(winObj.Tag);
};

ChatDisplayHelperClass.prototype.createAddToDynamicGroupHtml = function(id, browserId) {
    browserId = (typeof browserId != 'undefined') ? browserId : '';
    var groups = DataEngine.groups.getGroupList('name', false, true);
    var tableLines = '', addToChecked = '', addNewChecked = ' checked="checked"', firstGroupId = '';
    for (var i=0; i<groups.length; i++) {
        if (typeof groups[i].members != 'undefined' && $.inArray(id, groups[i].members) == -1) {
            tableLines += '<tr id="dynamic-group-line-' + groups[i].id + '" class="dynamic-group-line" style="cursor: pointer;" onclick="selectChatGroup(\'' + groups[i].id + '\');"><td>' + groups[i].name + '</td></tr>';
            addToChecked = ' checked="checked"';
            addNewChecked = '';
            firstGroupId = (firstGroupId == '') ? groups[i].id : firstGroupId;
        }
    }

    var disabledClass = (browserId == '') ? ' class="ui-disabled"' : '';
    var dynGroupHtml = '<form><fieldset data-role="none" id="add-to-group-form" class="lzm-fieldset"><legend>' + t('Add to existing group') + '</legend>' +
        '<input type="radio" name="add-group-type" class="radio-custom" id="add-to-existing-group" data-role="none"' + addToChecked + ' />' +
        '<label for="add-to-existing-group" class="radio-custom-label">' + t('Add to existing group') + '</label><br />' +
        '<div id="dynamic-group-table-div" class="left-space-child top-space-half">' +
        '<table id="dynamic-group-table" class="visible-list-table alternating-rows-table lzm-unselectable" data-selected-group="' + firstGroupId + '"><tbody>' + tableLines + '</tbody></table></div></fieldset>' +
        '<fieldset data-role="none" id="add-new-group-form" class="lzm-fieldset top-space"><legend>' + t('Create new group') + '</legend>' +
        '<input type="radio" class="radio-custom" name="add-group-type" id="create-new-group" data-role="none"' + addNewChecked + ' />' +
        '<label for="create-new-group" class="radio-custom-label">' + t('Create new group for this user') + '</label>' +
        '<div class="left-space-child top-space-half">' +
        '<input type="text" id="new-group-name" class="lzm-text-input" data-role="none" /><br />' +
        '</div></fieldset>' +
        '<fieldset data-role="none" id="add-persistent-member-form" class="lzm-fieldset top-space"><legend>' + t('Persistent Member') + '</legend>' +
        '<div' + disabledClass + ' id="persistent-group-div"><input type="checkbox" class="checkbox-custom" id="persistent-group-member" data-role="none" />' +
        '<label class="checkbox-custom-label" for="persistent-group-member">' + t('Persistent Member') + '</label></div>' +
        '</fieldset></form>';
    return dynGroupHtml;
};

ChatDisplayHelperClass.prototype.RenderMainMenuPanel = function() {
    var panelHtml='',statusIcon = lzm_commonConfig.lz_user_states[2].icon;

    for (var i=0; i<lzm_commonConfig.lz_user_states.length; i++)
        if (lzm_commonConfig.lz_user_states[i].index == ChatPollServerClass.__UserStatus)
            statusIcon = lzm_commonConfig.lz_user_states[i].icon;

    panelHtml += '<div id="main-menu-panel-status" class="main-menu-panel-tool lzm-unselectable" onclick="showUserStatusMenu(event); UIRenderer.resizeMenuPanels();" style="background-image: url(\'' + statusIcon + '\');background-color:var(--status-color-' + ChatPollServerClass.__UserStatus + ');">&nbsp;</div>';
    panelHtml += '<div id="main-menu-panel-settings" class="main-menu-panel-tool lzm-unselectable" onclick="showUserSettingsMenu(event); UIRenderer.resizeMenuPanels();"><div id="main-menu-avatar" class="avatar-box"></div><div id="main-menu-panel-settings-text">' + lzm_chatDisplay.myName + '</div></div>';
    //panelHtml += '<span id="main-menu-panel-tools-configuration" onclick="initServerConfiguration(event);" class="main-menu-panel-opt-tools main-menu-panel-tool" title="'+tid('server_conf')+'"><i class="fa fa-cogs fa-lg"></i></span>';
    //panelHtml += '<span id="main-menu-panel-tools-users" onclick="showUserManagement(event);" class="main-menu-panel-opt-tools main-menu-panel-tool" title="'+tid('user_management')+'"><i class="fa fa-user fa-lg"></i></span>';
    //panelHtml += '<span id="main-menu-panel-tools-link-generator" onclick="initLinkGenerator(event);" class="main-menu-panel-opt-tools main-menu-panel-tool" title="Link Generator"><i class="fa fa-link fa-lg"></i></span>';
    //panelHtml += '<span id="main-menu-panel-tools-filter" onclick="showFilterList(event);" class="main-menu-panel-opt-tools main-menu-panel-tool" title="'+tid('filters')+'"><i class="fa fa-shield fa-lg"></i></span>';
    //panelHtml += '<span id="main-menu-panel-tools-localization" onclick="showTranslationEditor(event);" class="main-menu-panel-opt-tools main-menu-panel-tool" title="'+tid('trans_editor')+'"><i class="fa fa-language fa-lg"></i></span>';
    //panelHtml += '<span id="main-menu-panel-tools-events" onclick="initEventConfiguration(event);" class="main-menu-panel-opt-tools main-menu-panel-tool" title="'+tid('events')+'"><i class="fa fa-flash fa-lg"></i></span>';
    //panelHtml += '<span id="main-menu-panel-tools-wish" style="border-right:0;" onclick="openLink(\'http://wishlistmobile.livezilla.net/\');" class="main-menu-panel-opt-tools main-menu-panel-tool" title="'+tid('make_wish')+'"><i class="fa fa-plus fa-lg"></i></span>';
    panelHtml += '<span id="main-menu-panel-tools-logs" onclick="showLogs();" class="main-menu-panel-opt-tools main-menu-panel-tool" title="Logs"><i class="fa fa-exclamation-circle fa-lg '+((Client.Logs.length>0 && PermissionEngine.permissions.view_logs == 1) ? 'icon-orange' : '')+'"></i></span>';
    panelHtml += '<span id="main-menu-panel-tools-feedbacks" onclick="initFeedbacksConfiguration(event);" class="main-menu-panel-opt-tools main-menu-panel-tool" title="'+tid('feedbacks')+'"><i class="fa fa-star fa-lg"></i></span>';
    panelHtml += '<span id="main-menu-panel-tools-menu" onclick="CommonUIClass.ToggleSelectViewMenu();" class="main-menu-panel-tool"><i class="fa fa-navicon fa-lg"></i></span>';

    return panelHtml;
};

ChatDisplayHelperClass.prototype.ShowLicenseInfo = function() {
    var tdays = DataEngine.getTDays();
    if(tdays != null && tdays > 0 && tdays <= 30)
    {
        var lihtml = '<i class="fa fa-exclamation-circle icon-orange"></i>&nbsp;&nbsp;'+tid('trial_info').replace('<!--d-->',tdays)+'';
        ChatDisplayHelperClass.ActiveInfoType = 'trial';
        $('#main-menu-info-box').html(lihtml);
        $('#main-menu-info-box').css('visibility','visible');
        $('#main-menu-info-box').unbind('click');
        $('#main-menu-info-box').click(function(){openLink('https://www.livezilla.net/shop/');});
        return true;
    }
    else if($('#main-menu-info-box').length)
    {
        $('#main-menu-info-box').unbind('click');
        $('#main-menu-info-box').css('visibility','hidden');
        ChatDisplayHelperClass.ActiveInfoType = '';
    }
    return false;
};

ChatDisplayHelperClass.prototype.ShowOpeningHoursInfo = function() {
    if(CommonUIClass.IsOutsideOfOpeningHours)
    {
        var lihtml = '<i class="fa fa-clock-o icon-blue"></i>&nbsp;&nbsp;'+tid('o_o_o_hours');
        ChatDisplayHelperClass.ActiveInfoType = 'opening_hours';
        $('#main-menu-info-box').html(lihtml);
        $('#main-menu-info-box').css('visibility','visible');
        $('#main-menu-info-box').click(function(){});
    }
    else if($('#main-menu-info-box').length)
    {
        $('#main-menu-info-box').css('visibility','hidden');
        ChatDisplayHelperClass.ActiveInfoType = '';
    }
};

ChatDisplayHelperClass.prototype.ShowConnectionInfo = function() {
    if((lzm_chatTimeStamp.getServerTimeString(null, false, 1) - CommunicationEngine.lastCorrectServerAnswer) > 30000)
    {
        var lihtml = '<i class="fa fa-plug icon-red"></i>&nbsp;&nbsp;'+tid('syncing_data');
        ChatDisplayHelperClass.ActiveInfoType = 'connection';
        $('#main-menu-info-box').html(lihtml);
        $('#main-menu-info-box').css('visibility','visible');
        $('#main-menu-info-box').click(function(){});
        return true;
    }
    else if($('#main-menu-info-box').length && ChatDisplayHelperClass.ActiveInfoType == 'connection')
    {
        $('#main-menu-info-box').css('visibility','hidden');
        ChatDisplayHelperClass.ActiveInfoType = '';
    }
    return false;
};

ChatDisplayHelperClass.prototype.getSortableRows = function(_table){
    var list = [];
    for (var i=0; i<LocalConfiguration.TableColumns[_table].length; i++)
        if(d(LocalConfiguration.TableColumns[_table][i].sort_key))
            list.push(LocalConfiguration.TableColumns[_table][i].sort_key);
    return list;
}

ChatDisplayHelperClass.prototype.createGeotrackingFootline = function() {
    var disabledClass = ' ui-disabled', visitorId = '';
    if (lzm_chatGeoTrackingMap.selectedVisitor != null) {
        var visitor = VisitorManager.GetVisitor(lzm_chatGeoTrackingMap.selectedVisitor);
        if (visitor != null) {
            disabledClass = '';
            visitorId = visitor.id;
        }
    }
    var gtFootlineHtml = '<span style="float: left;">' +
        //lzm_inputControls.createButton('smartmap-map', 'map-button map-type-button', 'setMapType(\'SMARTMAP\')', t('Normal'), '', 'lr', {'margin-left': '4px','margin-right': '3px'}, t('Normal map'), 12,'e') +
        //lzm_inputControls.createButton('satellite-map', 'map-button map-type-button', 'setMapType(\'SATELLITE\')', t('Satellite'), '', 'lr', {}, t('Satellite map'), 12,'e')+
        lzm_inputControls.createButton('map-visitor-info', 'map-button' + disabledClass, 'SelectView(\'external\');ChatVisitorClass.ShowVisitorInformation(\'' + visitorId + '\');', '', '<i class="fa fa-info"></i>', 'lr', {'margin-left': '3px','margin-right': '3px'}, t('Show visitor information'),-1,'e') +
        '</span><span style="float: right;">' +
        lzm_inputControls.createButton('map-zoom-in', 'map-button', 'zoomMap(1)', '', '<i class="fa fa-search-plus"></i>', 'lr', {}, t('Zoom in'),-1,'e') +
        lzm_inputControls.createButton('map-zoom-out', 'map-button', 'zoomMap(-1)', '', '<i class="fa fa-search-minus"></i>', 'lr',{'margin-left': '3px','margin-right': '4px'}, t('Zoom out'),-1,'e') +
        '</span>';

    return gtFootlineHtml;
};

ChatDisplayHelperClass.prototype.getChatPartner = function(chatPartner) {
    var chatPartnerName = '', chatPartnerUserId = '', i;
    if (typeof chatPartner != 'undefined' && chatPartner != '') {
        if (chatPartner.indexOf('~') != -1) {
            var visitor = VisitorManager.GetVisitor(chatPartner.split('~')[0]);
            if (visitor != null) {
                for (var j=0; j<visitor.b.length; j++) {
                    if (chatPartner.split('~')[1] == visitor.b[j].id) {
                        chatPartnerName = (visitor.b[j].cname != '') ?
                            visitor.b[j].cname : visitor.unique_name;
                    }
                }
            }
        } else {
            if (chatPartner == 'everyoneintern') {
                chatPartnerName = tid('all_operators');
                chatPartnerUserId = chatPartner;
            } else {
                var operator = DataEngine.operators.getOperator(chatPartner);
                var group = DataEngine.groups.getGroup(chatPartner);
                chatPartnerName = (operator != null) ? operator.name : (group != null) ? group.name : '';
                chatPartnerUserId = (operator != null) ? operator.userid : (group != null) ? group.id : '';
            }
        }
    } else {
        chatPartner = '';
    }
    if (chatPartnerName.length > 13) {
        chatPartnerName = chatPartnerName.substr(0,10) + '...';
    }

    return {name: chatPartnerName, userid: chatPartnerUserId};
};

ChatDisplayHelperClass.prototype.createTabControl = function(replaceElement, tabList, selectedTab, placeHolderWidth) {
    lzm_inputControls.createTabControl(replaceElement, tabList, selectedTab, placeHolderWidth);
};

ChatDisplayHelperClass.prototype.updateTabControl = function(replaceElement, oldTabList) {
    lzm_inputControls.updateTabControl(replaceElement, oldTabList);
};

ChatDisplayHelperClass.prototype.addTabControlEventHandler = function(replaceElement, tabList, firstVisibleTab, lastVisibleTab,
                                                                      thisTabWidth, leftTabWidth, rightTabWidth,
                                                                      visibleTabsWidth, placeHolderWidth, closedTabColor) {
    lzm_inputControls.addTabControlEventHandler(replaceElement, tabList, firstVisibleTab, lastVisibleTab, thisTabWidth, leftTabWidth,
        rightTabWidth, visibleTabsWidth, placeHolderWidth, closedTabColor);
};

ChatDisplayHelperClass.prototype.getScrollBarWidth = function() {
    var htmlString = '<div id="get-scrollbar-width-div" style="position: absolute; left: 0px; top: -9999px;' +
        'width: 100px; height:100px; overflow-y:scroll;"></div>';
    $('body').append(htmlString).trigger('create');
    var getScrollbarWidthDiv = $('#get-scrollbar-width-div');
    var scrollbarWidth = getScrollbarWidthDiv[0].offsetWidth - getScrollbarWidthDiv[0].clientWidth;
    getScrollbarWidthDiv.remove();

    return scrollbarWidth;
};

ChatDisplayHelperClass.prototype.getScrollBarHeight = function() {
    var htmlString = '<div id="get-scrollbar-height-div" style="position: absolute; left: 0px; top: -9999px;' +
        'width: 100px; height:100px; overflow-x:scroll;"></div>';
    $('body').append(htmlString).trigger('create');
    var getScrollbarHeightDiv = $('#get-scrollbar-height-div');
    var scrollbarHeight = getScrollbarHeightDiv[0].offsetHeight - getScrollbarHeightDiv[0].clientHeight;
    getScrollbarHeightDiv.remove();

    return scrollbarHeight;
};

ChatDisplayHelperClass.prototype.checkIfScrollbarVisible = function(id, position) {
    position = (typeof position != 'undefined') ? position : 'vertical';
    var myElement = $('#' + id);
    var padding;
    if (position == 'vertical') {
        padding = parseInt($(myElement).css('padding-top')) + parseInt($(myElement).css('padding-bottom'));
    } else {
        padding = parseInt($(myElement).css('padding-right')) + parseInt($(myElement).css('padding-left'));
    }
    try {
        if (position == 'vertical') {
            return (myElement[0].scrollHeight > (myElement.height() + padding));
        } else {
            return (myElement[0].scrollWidth > (myElement.width() + padding));
        }
    } catch(e) {
        return false;
    }
};

ChatDisplayHelperClass.prototype.replaceSmileys = function(text) {
    var previousSigns = [{pt: ' ', rp: ' '}, {pt: '>', rp: '>'}, {pt: '&nbsp;', rp: '&nbsp;'}, {pt: '^', rp: ''}];
    var shorts = [':-)','::smile',':)',':-(','::sad',':(',':-]','::lol',';-)','::wink',';)',
        ':\'-(','::cry',':-O','::shocked',':-\\\\','::sick',':-p','::tongue',':-P',':?','::question','8-)',
        '::cool','zzZZ','::sleep',':-|','::neutral'];
    var images = ["smile","smile","smile","sad","sad","sad","lol","lol","wink","wink","wink","cry","cry",
        "shocked","shocked","sick","sick","tongue","tongue","tongue","question","question","cool","cool","sleep",
        "sleep","neutral","neutral"];
    for (var i=0; i<previousSigns.length; i++) {
        for (var j=0; j<shorts.length; j++) {
            var myRegExp = new RegExp(previousSigns[i].pt + RegExp.escape(shorts[j]), 'g');
            var rplString = previousSigns[i].rp + '<span style="padding:3px 10px 2px 10px;' +
                ' background: url(\'../images/smilies/' + images[j] + '.gif\'); background-position: center;' +
                ' background-repeat: no-repeat;">&nbsp;</span>';
            text = text.replace(myRegExp, rplString);
        }
    }
    return text;
};

ChatDisplayHelperClass.prototype.matchSearch = function(searchFor,value){
    if(!d(value)||!d(searchFor))
        return false;
    if(typeof value != 'string' || typeof searchFor != 'string')
        return false;
    if(value==''||searchFor=='')
        return false;
    return (value.toLowerCase().indexOf(searchFor.toLowerCase()) !== -1);
};

ChatDisplayHelperClass.prototype.showBrowserNotification = function(params) {
    var thisClass = this;

    params = (typeof  params != 'undefined') ? params : {};

    if(lzm_chatDisplay.windowWidth < 290)
        return;

    $('#browser-notification').remove();

    if(ChatDisplayHelperClass.NotificationRemovalTimer != null)
    {
        clearTimeout(ChatDisplayHelperClass.NotificationRemovalTimer);
        ChatDisplayHelperClass.NotificationRemovalTimer = null;
    }

    var text = (typeof params.text != 'undefined') ? params.text : '';
    text = lzm_commonTools.SubStr(text,60,true);

    var sender = (typeof params.sender != 'undefined') ? params.sender : '';
    sender = lzm_commonTools.SubStr(sender,16,true);

    var onclickAction = (typeof params.action != 'undefined' && params.action != '') ? ' onclick="' + params.action + '; ' + this.getMyObjectName() + '.removeBrowserNotification();"' : '';

    var col = '#8c8c8c';
    if(params.icon == 'fa-commenting')
        col = '#de5858';
    if(params.icon == 'fa-warning')
        col = 'var(--red)';
    if(params.icon == 'fa-envelope' || params.icon == 'fa-envelope-o')
        col = '#5197ff';
    if(params.icon == 'fa-envelope-open-o')
        col = '#b16ae8';
    if(params.icon == 'fa-star-o')
        col = '#ffba00';

    if(d(params.color))
        col = params.color;

    var notificationHtml = '<div id="browser-notification" style="" class="lzm-notification"' + onclickAction + '>';
        notificationHtml += '<div id="browser-notification-body" class="lzm-notification-body">';

    notificationHtml += '<div class="lzm-notification-name">' + lzm_commonTools.htmlEntities(sender) + '</div>';
    notificationHtml += '<div class="lzm-notification-text">' + lzm_commonTools.htmlEntities(text) + '</div></div>' +
    '<i id="edit-notification" onclick="LocalConfiguration.__ShowClientSettings(event,1);' + this.getMyObjectName() + '.removeBrowserNotification(event);" class="lzm-notification-edit fa fa-wrench"></i>' +
    '<i id="close-notification" onclick="' + this.getMyObjectName() + '.removeBrowserNotification(event);" class="lzm-notification-close fa fa-remove"></i>';

    if(typeof params.icon != 'undefined')
        notificationHtml += '<div class="lzm-notification-icon-bg" style="background:'+col+';"><i class="lzm-notification-bg-logo fa '+params.icon+'"></i></div>';

    notificationHtml += '</div>';

    $('body').append(notificationHtml);
    $('#browser-notification').animate({top:'5px'});
    if (typeof params.timeout == 'number' && params.timeout > 0) {
        ChatDisplayHelperClass.NotificationRemovalTimer = setTimeout(function() {thisClass.removeBrowserNotification();}, params.timeout * 1000);
    }
};

ChatDisplayHelperClass.prototype.removeBrowserNotification = function(e) {
    if (typeof e != 'undefined' && e != null) {
        e.stopPropagation();
    }
    $('#browser-notification').animate({right:'-400px'});

    setTimeout(function() {
        $('#browser-notification').remove();
    }, 2000);

};

ChatDisplayHelperClass.prototype.blockUi = function(params) {
    var that = this;
    if ($('#lzm-alert-dialog-container').length == 0)
    {
        this.unblockUi();
        var rd = Math.floor(Math.random() * 9999);
        params.message = (typeof params.message != 'undefined') ? params.message : '';

        var messageWidth = Math.min(500, Math.floor(0.9 * lzm_chatDisplay.windowWidth)) - 80;

        var blockHtml = '<div class="lzm-block" id="lzm-block-' + rd + '">';
        if (params.message != null)
            blockHtml += '<div class="lzm-block-message" id="lzm-block-message-' + rd + '" style="width: ' + messageWidth + 'px;">' + params.message + '</div>';

        blockHtml += '</div>';
        $('body').append(blockHtml);

        if (params.message != null) {
            var messageHeight = $('#lzm-block-message-' + rd).height();
            var messageLeft = Math.max(20, Math.floor((lzm_chatDisplay.windowWidth - messageWidth - 50) / 2));
            var messageTop = Math.max(20, Math.floor((lzm_chatDisplay.windowHeight - messageHeight - 50) / 2));
            $('#lzm-block-message-' + rd).css({left: messageLeft+'px', top: messageTop+'px'});
        }
    } else {
        setTimeout(function() {
            that.blockUi(params);
        }, 500);
    }

};

ChatDisplayHelperClass.prototype.unblockUi = function() {

    $('.lzm-block').remove();
};

ChatDisplayHelperClass.prototype.createInputMenu = function(replaceElement, inputId, inputClass, width, placeHolder, value, selectList, scrollParent, selectmenuTopCorrection) {
    lzm_inputControls.createInputMenu(replaceElement, inputId, inputClass, width, placeHolder, value, selectList, scrollParent, selectmenuTopCorrection);
};

ChatDisplayHelperClass.prototype.createInput = function(myId, myClass, myText, myLabel, myIcon, myType, myLayoutType) {
    return lzm_inputControls.createInput(myId, myClass, myText, myLabel, myIcon, myType, myLayoutType);
};