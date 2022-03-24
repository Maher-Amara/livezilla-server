/****************************************************************************************
 * LiveZilla ChatSettingsClass.js
 *
 * Copyright 2018 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/
function ChatSettingsClass() {
    this.userManagementDialogTitle = '';
    this.userManagementAction = 'list';
    this.tableSettingsLoaded = false;
    this.tableSelectedRow = {visitor:0, archive:0, ticket:0, allchats:0};
    this.tableIds = ['visitor', 'archive', 'ticket', 'allchats'];
    this.tableIndexCounter=0;
    this.mainTableColumns = null;
}

ChatSettingsClass.prototype.ShowClientSettings = function(){

    this.tableSettingsLoaded = false;
    this.loadData();
    this.CreateClientSettings();
    var viewId = '', viewArray = [], that = this;
    $('.show-view-div').each(function() {
        viewArray.push($(this).data('view-id'));
    });
    viewId = $('.show-view-div:first').data('view-id');
    $('.show-view-div').click(function() {
        $('.show-view-div').removeClass('selected-panel-settings-line');
        $(this).addClass('selected-panel-settings-line');
        viewId = $(this).data('view-id');
        that.togglePositionChangeButtons(viewId, 'show-view');
    });
    $('.settings-placeholder-tab').click(function() {
        UIRenderer.resizeOptions();
    });
    $('.position-change-buttons-up.position-show-view').click(function() {
        var myIndex = $.inArray(viewId, viewArray);
        if (myIndex != 0) {
            var replaceId = viewArray[myIndex - 1];
            for (var i=0; i<viewArray.length; i++)
                viewArray[i] = (i == myIndex) ? replaceId : (i == myIndex - 1) ? viewId : viewArray[i];
            that.orderViewPanel(viewArray, viewId);
        }
    });
    $('.position-change-buttons-down.position-show-view').click(function() {
        var myIndex = $.inArray(viewId, viewArray);
        if (myIndex != viewArray.length - 1) {
            var replaceId = viewArray[myIndex + 1];
            for (var i=0; i<viewArray.length; i++) {
                viewArray[i] = (i == myIndex) ? replaceId : (i == myIndex + 1) ? viewId : viewArray[i];
            }
            that.orderViewPanel(viewArray, viewId);
        }
    });
};

ChatSettingsClass.prototype.loadData = function(){
    this.mainTableColumns = lzm_commonTools.clone(LocalConfiguration.TableColumns);
};

ChatSettingsClass.prototype.changeTableRow = function(tableId,tableIndex,rowId,type){
    var i= 0, that = this;
    that.updateCustomTableSettings(tableId);
    if(type=='visible')
    {
        for (i=0; i<this.mainTableColumns[tableId].length; i++)
            if(this.mainTableColumns[tableId][i].cid==rowId)
                this.mainTableColumns[tableId][i].display=$('#show-'+tableId+'-'+rowId).prop('checked') ? 1 : 0;
    }
    else
    {
        function getArrayPos(rowId){
            for (i=0; i<that.mainTableColumns[tableId].length; i++)
                if(that.mainTableColumns[tableId][i].cid==rowId)
                    return i;
        }
        function arrayMove(fromIndex, toIndex) {
            var element = that.mainTableColumns[tableId][fromIndex];
            that.mainTableColumns[tableId].splice(fromIndex, 1);
            that.mainTableColumns[tableId].splice(toIndex, 0, element);
        }

        if(rowId.indexOf('custom')===0)
        {

        }
        else
            for (i=0; i<this.mainTableColumns[tableId].length; i++) {
                if(this.mainTableColumns[tableId][i].cid==rowId)
                {
                    var newIndex = getArrayPos(rowId);
                    var oldIndex = newIndex;
                    if(type=='first')
                        newIndex=0;
                    else if(type=='last')
                        newIndex=this.mainTableColumns[tableId].length-1;
                    else if(type=='up' && newIndex>0)
                        newIndex--;
                    else if(type=='down' && newIndex<(this.mainTableColumns[tableId].length-1))
                        newIndex++;
                    arrayMove(oldIndex,newIndex);
                    this.tableSelectedRow[tableId]=newIndex;
                    break;
                }
            }

        var div = $('#table-settings-placeholder-content-' + tableIndex.toString());

        div.html(this.createTableSettings(tableId));

        div = $('#settings-placeholder-content-3');
        if(type=='last')
            div.scrollTop(div.prop("scrollHeight"));
        else if(type=='first')
            div.scrollTop(0);
        this.applyTableEvents();
    }
};

ChatSettingsClass.prototype.applyTableEvents = function(){
    var that = this;
    $('.table-div').click(function() {
        if($(this).hasClass('selected-panel-settings-line'))
            return;
        var viewtable = $(this).data('view-id').split('-')[0];
        that.tableSelectedRow[viewtable] = $(this).data('row-index');
        that.updateCustomTableSettings(viewtable);
        for(var key in that.tableIds)
            $('#table-settings-placeholder-content-'+ key.toString()).html(that.createTableSettings(that.tableIds[key]));
        that.applyTableEvents();
    });
};

ChatSettingsClass.prototype.updateCustomTableSettings = function(tableId){

};

ChatSettingsClass.prototype.CreateClientSettings = function(){

    var that = this;

    lzm_chatDisplay.showUsersettingsHtml = false;
    lzm_chatDisplay.showMinifiedDialogsHtml = false;
    $('#usersettings-menu').css({'display': 'none'});
    $('#minified-dialogs-menu').css('display', 'none');

    var headerString = tid('client_configuration');
    var bodyString = '<div id="settings-container"><div id="settings-placeholder"></div></div>';
    var settingsTabList = this.createSettingsHtml();
    var footerString = lzm_inputControls.createButton('save-usersettings', '', '', t('Ok'), '', 'lr',{'margin-left': '4px'},'',30,'d')  +
        lzm_inputControls.createButton('cancel-usersettings', '', '', t('Cancel'), '', 'lr',{'margin-left': '6px'},'',30,'d');

    var dialogData = {};
    if (lzm_chatDisplay.selected_view == 'mychats' && ChatManager.ActiveChat != '') {
        var thisChatPartner = lzm_displayHelper.getChatPartner(ChatManager.ActiveChat);
        dialogData = {'chat-partner': ChatManager.ActiveChat, 'chat-partner-name': thisChatPartner['name'],'chat-partner-userid': thisChatPartner['userid']};
    }
    dialogData['no-selected-view'] = true;

    lzm_commonDialog.CreateDialogWindow(headerString, bodyString, footerString, 'cogs', 'user-settings-dialog', 'user-settings-dialog', 'cancel-usersettings', true, dialogData);
    lzm_inputControls.createTabControl('settings-placeholder', settingsTabList);

    UIRenderer.resizeOptions();

    $('#background-mode').change(function() {
        if ($('#background-mode').attr('checked') == 'checked') {
            $('#save-connections-div').removeClass('ui-disabled');
        } else {
            $('#save-connections-div').addClass('ui-disabled');
            if ($('#save-connections').attr('checked') == 'checked') {
                $('#save-connections').click();
            }
        }
    });
    $('#save-usersettings').click(function () {

        if(!d($('#show-avatars').prop('checked')))
        {
            deblog("CAN'T READ CONFIG");
            return;
        }
        saveUserSettings(that.tableSettingsLoaded);
        $('#cancel-usersettings').click();
    });
    $('#cancel-usersettings').click(function() {
        TaskBarManager.RemoveWindowByDialogId('user-settings-dialog');
    });
    $('.settings-placeholder-tab').click(function(){
        if($(this).attr('id')=='settings-placeholder-tab-3' && !that.tableSettingsLoaded)
        {
            lzm_inputControls.createTabControl('table-settings-placeholder', that.createTableSettings(),0,0,'sub');
            that.applyTableEvents();
            that.tableSettingsLoaded = true;
        }
    });

    $('#idle-time-active').change(function() {
        if ($('#idle-time-active').prop('checked'))
            $('.idle-time-conf').removeClass('ui-disabled');
        else
            $('.idle-time-conf').addClass('ui-disabled');
    });
    $('#idle-time-active').change();

    var types = ['chat','ticket', 'email', 'feedback', 'operator', 'visitor'];
    for(var item in types){
        var jqObjTimer =$('#notification-' + types[item] + '-timer');
        jqObjTimer.change(function(event) {
            var type = event.target.id.split('-')[1];
            if ($( this ).prop('checked')){
                $('#notification-' + type + '-timeout-container').removeClass('ui-disabled');
            }else{
                $('#notification-' + type + '-timeout-container').addClass('ui-disabled');
            }
        });

        var jqObjType =$('#notification-window-' + types[item] + 's');
        jqObjType.change(function(event) {
            var type = event.target.id.split('-')[2].slice(0,-1);
            if ($( this ).prop('checked')){
                $('#notification-' + type + '-timeout-container').removeClass('ui-disabled');
                $('#notification-' + type + '-timer').parent().removeClass('ui-disabled');
            }else{
                $('#notification-' + type + '-timeout-container').addClass('ui-disabled');
                $('#notification-' + type + '-timer').parent().addClass('ui-disabled');
            }
        });
        jqObjType.change();
        if(jqObjType.prop('checked')){
            jqObjTimer.change();
        }
    }

};

ChatSettingsClass.prototype.createSettingsHtml = function(){
    var i;
    var backgroundModeChecked = (lzm_chatDisplay.backgroundModeChecked != 0) ? ' checked="checked"' : '';
    var ticketReadStatusChecked = (lzm_chatDisplay.ticketReadStatusChecked != 0);
    var saveConnectionsChecked = (lzm_chatDisplay.saveConnections != 0 && lzm_chatDisplay.backgroundModeChecked != 0) ? ' checked="checked"' : '';
    var saveConnectionsDisabled = (lzm_chatDisplay.backgroundModeChecked != 1) ? ' class="ui-disabled"' : '';
    var vibrateNotificationsChecked = (lzm_chatDisplay.vibrateNotifications == 1) ? ' checked="checked"' : '';
    var showChatVisitorInfoChecked = lzm_commonStorage.loadValue('show_chat_visitor_info_' + DataEngine.myId,1)==1;
    var showMissedChatsChecked = lzm_commonStorage.loadValue('show_missed_chats_' + DataEngine.myId,1)!=0;
    var autoAcceptDisabledClass = (PermissionEngine.checkUserPermissions(lzm_chatDisplay.myId, 'chats', 'can_auto_accept', {}) && !PermissionEngine.checkUserPermissions(lzm_chatDisplay.myId, 'chats', 'must_auto_accept', {})) ? '' : ' ui-disabled';
    var autoAcceptChat = ((PermissionEngine.checkUserPermissions(lzm_chatDisplay.myId, 'chats', 'can_auto_accept', {}) && LocalConfiguration.ChatAutoAccept) || PermissionEngine.checkUserPermissions(lzm_chatDisplay.myId, 'chats', 'must_auto_accept', {}));

    var notificationSettings = '<fieldset id="notification-settings" class="lzm-fieldset" data-role="none"><legend>' + t('Sounds') + '</legend>';
    if (!IFManager.IsAppFrame || (IFManager.AppOS != IFManager.OS_IOS && IFManager.AppOS != IFManager.OS_WINDOWSPHONE)) {
        notificationSettings += '<label for="volume-slider">' + tidc('volume') + '</label>' + '<select id="volume-slider" name="volume-slider" class="lzm-select" data-role="none">';
        var volumeStep = 10;
        for (i=0; i<=100; i +=volumeStep)
        {
            var selectedString = (i <= LocalConfiguration.SoundVolume && i + volumeStep > LocalConfiguration.SoundVolume) ? ' selected="selected"' : '';
            notificationSettings += '<option value="' + i + '"' + selectedString + '>' + i + ' %</option>';
        }
        notificationSettings += '</select>';
    }

    notificationSettings +=
        '<div class="top-space-double">' + lzm_inputControls.createCheckbox('sound-new-message',t('New Message'),LocalConfiguration.PlayChatMessageSound,'') + '</div>' +
        '<div class="top-space-half">' + lzm_inputControls.createCheckbox('sound-new-chat',t('New external Chat'),LocalConfiguration.PlayChatSound,'') + '</div>' +
        '<div class="top-space-half left-space-child">' + lzm_inputControls.createCheckbox('sound-repeat-new-chat',tid('repeat_new_chat'),LocalConfiguration.RepeatChatSound,'') + '</div>' +
        '<div class="top-space-half">' + lzm_inputControls.createCheckbox('sound-chat-queue',tid('queued_chats'),LocalConfiguration.PlayQueueSound,'') + '</div>' +
        '<div class="top-space-half left-space-child">' + lzm_inputControls.createCheckbox('sound-repeat-queue',tid('repeat_new_chat'),LocalConfiguration.RepeatQueueSound,'') + '</div>' +
        '<div class="top-space-half">' + lzm_inputControls.createCheckbox('sound-new-ticket',tid('new_ticket'),LocalConfiguration.PlayTicketSound,'') + '</div>' +
        '<div class="top-space-half">' + lzm_inputControls.createCheckbox('sound-new-visitor',tid('new_visitor'),LocalConfiguration.PlayVisitorSound,'') + '</div>';

    if (IFManager.IsAppFrame && (IFManager.AppOS != IFManager.OS_IOS) && !IFManager.IsDesktopApp())
    {
        notificationSettings += '<div style="padding: 5px 0;">' +
            '<input class="checkbox-custom" type="checkbox" value="1" data-role="none" id="vibrate-notifications"' + vibrateNotificationsChecked + ' />' +
            '<label class="checkbox-custom-label" for="vibrate-notifications">' + t('Vibrate on Notifications') + '</label></div>';
    }
    notificationSettings += '</fieldset><input type="hidden" value="0" id="away-after-time" />';

    if(!IFManager.IsMobileOS)
    {
        notificationSettings += '<fieldset id="message-center-settings" class="lzm-fieldset" data-role="none"><legend>' + tid('notification_window') + '</legend>';

        if(true || IFManager.IsDesktopApp() && d(IFManager.DeviceInterface.hasMinVersion) && IFManager.DeviceInterface.hasMinVersion('1.2.0'))
        {
            notificationSettings += '<table id="notification-settings-table" class="hspaced" style="width:auto">';
            notificationSettings += '<tr>';
            notificationSettings += '<td><div class="top-space-half">' + lzm_inputControls.createCheckbox('notification-window-chats',tid('chats'),LocalConfiguration.NotificationChats,'') + '</div></td>';
            notificationSettings += '<td><div class="top-space-half">' + lzm_inputControls.createCheckbox('notification-chat-timer',tid('hide_after')+":",LocalConfiguration.NotificationChatTimeoutEnabled,'') + '</div></td>';
            notificationSettings += '<td><div class="top-space-half">' + lzm_inputControls.createInput('notification-chat-timeout','', LocalConfiguration.NotificationChatTimeout, '', '', 'number', '', 'min="1" max="1000" style="width:70px"') + '</div></td>';
            notificationSettings += '<td style="font-size: 12px;padding-top: 7px;">' + tid('seconds')+ '</td>';
            notificationSettings += '</tr>';
            notificationSettings += '<tr>';
            notificationSettings += '<td><div class="top-space-half">' + lzm_inputControls.createCheckbox('notification-window-tickets',tid('tickets'),LocalConfiguration.NotificationTickets,'') + '</div></td>';
            notificationSettings += '<td><div class="top-space-half">' + lzm_inputControls.createCheckbox('notification-ticket-timer',tid('hide_after')+":",LocalConfiguration.NotificationTicketTimeoutEnabled,'') + '</div></td>';
            notificationSettings += '<td><div class="top-space-half">' + lzm_inputControls.createInput('notification-ticket-timeout','', LocalConfiguration.NotificationTicketTimeout, '', '', 'number', '', 'min="1" max="1000" style="width:70px"') + '</div></td>';
            notificationSettings += '<td style="font-size: 12px;padding-top: 7px;">' + tid('seconds')+ '</td>';
            notificationSettings += '</tr>';
            notificationSettings += '<tr>';
            notificationSettings += '<td><div class="top-space-half">' + lzm_inputControls.createCheckbox('notification-window-emails',tid('emails'),LocalConfiguration.NotificationEmails,'') + '</div></td>';
            notificationSettings += '<td><div class="top-space-half">' + lzm_inputControls.createCheckbox('notification-email-timer',tid('hide_after')+":",LocalConfiguration.NotificationEmailTimeoutEnabled,'') + '</div></td>';
            notificationSettings += '<td><div class="top-space-half">' + lzm_inputControls.createInput('notification-email-timeout','', LocalConfiguration.NotificationEmailTimeout, '', '', 'number', '', 'min="1" max="1000" style="width:70px"') + '</div></td>';
            notificationSettings += '<td style="font-size: 12px;padding-top: 7px;">' + tid('seconds')+ '</td>';
            notificationSettings += '</tr>';
            notificationSettings += '<tr>';
            notificationSettings += '<td><div class="top-space-half">' + lzm_inputControls.createCheckbox('notification-window-feedbacks',tid('feedbacks'),LocalConfiguration.NotificationFeedbacks,'') + '</div></td>';
            notificationSettings += '<td><div class="top-space-half">' + lzm_inputControls.createCheckbox('notification-feedback-timer',tid('hide_after')+":",LocalConfiguration.NotificationFeedbackTimeoutEnabled,'') + '</div></td>';
            notificationSettings += '<td><div class="top-space-half">' + lzm_inputControls.createInput('notification-feedback-timeout','', LocalConfiguration.NotificationFeedbackTimeout, '', '', 'number', '', 'min="1" max="1000" style="width:70px"') + '</div></td>';
            notificationSettings += '<td style="font-size: 12px;padding-top: 7px;">' + tid('seconds')+ '</td>';
            notificationSettings += '</tr>';
            notificationSettings += '<tr>';
            notificationSettings += '<td><div class="top-space-half">' + lzm_inputControls.createCheckbox('notification-window-visitors',tid('visitors'),LocalConfiguration.NotificationVisitors,'') + '</div></td>';
            notificationSettings += '<td><div class="top-space-half">' + lzm_inputControls.createCheckbox('notification-visitor-timer',tid('hide_after')+":",LocalConfiguration.NotificationVisitorTimeoutEnabled,'') + '</div></td>';
            notificationSettings += '<td><div class="top-space-half">' + lzm_inputControls.createInput('notification-visitor-timeout','', LocalConfiguration.NotificationVisitorTimeout, '', '', 'number', '', 'min="1" max="1000" style="width:70px"') + '</div></td>';
            notificationSettings += '<td style="font-size: 12px;padding-top: 7px;">' + tid('seconds')+ '</td>';
            notificationSettings += '</tr>';
            notificationSettings += '<tr>';
            notificationSettings += '<td><div class="top-space-half">' + lzm_inputControls.createCheckbox('notification-window-operators',tid('operators'),LocalConfiguration.NotificationOperators,'') + '</div></td>';
            notificationSettings += '<td><div class="top-space-half">' + lzm_inputControls.createCheckbox('notification-operator-timer',tid('hide_after')+":",LocalConfiguration.NotificationOperatorTimeoutEnabled,'') + '</div></td>';
            notificationSettings += '<td><div class="top-space-half">' + lzm_inputControls.createInput('notification-operator-timeout','', LocalConfiguration.NotificationOperatorTimeout, '', '', 'number', '', 'min="1" max="1000" style="width:70px"') + '</div></td>';
            notificationSettings += '<td style="font-size: 12px;padding-top: 7px;">' + tid('seconds')+ '</td>';
            notificationSettings += '</tr>';
            notificationSettings += '<tr>';
            notificationSettings += '<td><div class="top-space-half">' + lzm_inputControls.createCheckbox('notification-window-errors',tid('errors'),LocalConfiguration.NotificationOperators,'') + '</div></td>';
            notificationSettings += '<td></td>';
            notificationSettings += '<td></td>';
            notificationSettings += '<td></td>';
            notificationSettings += '</tr>';
            notificationSettings += '</table>';
        }
        else
        {
            notificationSettings += '<div>' + lzm_inputControls.createCheckbox('notification-window-chats',tid('chats'),LocalConfiguration.NotificationChats,'') + '</div>';
            notificationSettings += '<div class="top-space-half">' + lzm_inputControls.createCheckbox('notification-window-tickets',tid('tickets'),LocalConfiguration.NotificationTickets,'') + '</div>';
            notificationSettings += '<div class="top-space-half">' + lzm_inputControls.createCheckbox('notification-window-emails',tid('emails'),LocalConfiguration.NotificationEmails,'') + '</div>';
            notificationSettings += '<div class="top-space-half">' + lzm_inputControls.createCheckbox('notification-window-operators',tid('operators'),LocalConfiguration.NotificationOperators,'') + '</div>';
            notificationSettings += '<div class="top-space-half">' + lzm_inputControls.createCheckbox('notification-window-feedbacks',tid('feedbacks'),LocalConfiguration.NotificationFeedbacks,'') + '</div>';
            notificationSettings += '<div class="top-space-half">' + lzm_inputControls.createCheckbox('notification-window-visitors',tid('visitors'),LocalConfiguration.NotificationVisitors,'') + '</div>';
            notificationSettings += '<div class="top-space-half">' + lzm_inputControls.createCheckbox('notification-window-errors',tid('errors'),LocalConfiguration.NotificationErrors,'') + '</div>';

            if(IFManager.IsDesktopApp() && d(IFManager.DeviceInterface.hasMinVersion) && IFManager.DeviceInterface.hasMinVersion('1.0.2'))
                notificationSettings += '<div class="top-space-half">' + lzm_inputControls.createInput('notification-timeout','', LocalConfiguration.NotificationTimeout, '', '', 'number', '', 'min="1" max="1000" style="width:70px"' ,tid('seconds') ,  tid('show')+":") + '</div>';
        }
        notificationSettings += '</fieldset>';
    }

    var generalSettings = '<fieldset id="chat-settings"  class="lzm-fieldset" data-role="none"><legend>' + tid('general') + '</legend>';
    generalSettings += '<div class="top-space-half">' + lzm_inputControls.createCheckbox('check-for-updates',tid('check_updates'),LocalConfiguration.CheckUpdates,'') + '</div>';
    generalSettings += '</fieldset>';
    generalSettings += '<fieldset id="chat-settings"  class="lzm-fieldset" data-role="none"><legend>' + tid('chats') + '</legend>';
    generalSettings += '<div class="top-space-half' + autoAcceptDisabledClass + '">' + lzm_inputControls.createCheckbox('auto-accept',t('Automatically accept chats'),autoAcceptChat,'') + '</div>';

    generalSettings += '<div class="top-space-half">' + lzm_inputControls.createCheckbox('kb_auto_search',tid('setting_kb_auto_search'),LocalConfiguration.KBAutoSearch,'') + '</div>';
    generalSettings += '<div class="top-space-half">' + lzm_inputControls.createCheckbox('show-avatars',tid('show_avatars'),LocalConfiguration.UIShowAvatars,'') + '</div>';
    generalSettings += '<div class="top-space-half">' + lzm_inputControls.createCheckbox('show-chat-visitor-info',tid('show_chat_visitor_info'),showChatVisitorInfoChecked,'') + '</div>';
    generalSettings += '<div class="top-space-half">' + lzm_inputControls.createCheckbox('show-missed-chats',tid('missed_chats'),showMissedChatsChecked,'') + '</div>';
    generalSettings += '</fieldset>';
    generalSettings += '<fieldset id="ticket-settings" class="lzm-fieldset top-space" data-role="none"><legend>' + tid('tickets') + '</legend>';
    generalSettings += '<div class="top-space-half">' + lzm_inputControls.createCheckbox('tickets-read',t('Other operator\'s tickets won\'t switch to unread'),ticketReadStatusChecked,'') + '</div>';
    generalSettings += '</fieldset>';

    if(IFManager.IsDesktopApp() && d(IFManager.DeviceInterface.hasModule) && IFManager.DeviceInterface.hasModule('lz-idle-time'))
    {
        generalSettings += '<fieldset id="notification-settings" class="lzm-fieldset"><legend>' + tid('idletime') + '</legend>';
        generalSettings += '<table style="width:auto;"><tr><td>';
        generalSettings += '<div>' + lzm_inputControls.createCheckbox('idle-time-active',tid('idletime_settings_first'),LocalConfiguration.IdleTimeActive,'') + '</div>';
        generalSettings += '</td><td style="padding:0 8px">';
        generalSettings += lzm_inputControls.createSelect('idle-time-target', 'idle-time-conf', '', '', '', {}, '', [{text:tid('away'),value:3},{text:tid('busy'),value:1},{text:tid('logout'),value:2}], LocalConfiguration.IdleTimeTarget, '', '', '')
        generalSettings += '</td><td>';
        generalSettings += '<label style="padding-top:9px;" for="idle-time">' + tid('idletime_settings_middle') + '</label>';
        generalSettings += '</td><td style="padding:0 8px">';
        generalSettings += '<input id="idle-time" type="number" name="idle-time" class="idle-time-conf" value="' + LocalConfiguration.IdleTime / 60 + '" min="1" max="1000">';
        generalSettings += '</td><td>';
        generalSettings += '<label style="padding-top:9px;">' + tid('idletime_settings_end') + '</label>';
        generalSettings += '</td></tr></table>';
        generalSettings += '</fieldset>';
    }

    generalSettings += '<fieldset id="background-settings" class="lzm-fieldset" style="margin-top: 5px;"><legend>App</legend>';

    if (IFManager.AppOS == IFManager.OS_ANDROID)
    {
        generalSettings += '<div><input class="checkbox-custom" type="checkbox" value="1" id="background-mode"' + backgroundModeChecked + ' /><label class="checkbox-custom-label" for="background-mode">' + t('Keep active in background mode') + '</label></div>';
        generalSettings += '<div id="save-connections-div"' + saveConnectionsDisabled + '><input class="checkbox-custom" type="checkbox" value="1" data-role="none" id="save-connections"' + saveConnectionsChecked + ' /><label class="checkbox-custom-label" for="save-connections">' + t('Save connections / battery') + '</label></div><br>';
    }

    //LATER:0 add linux and mac support @autostart
    if (IFManager.AppOS == IFManager.OS_WINDOWS)
        generalSettings += '<div>' + lzm_inputControls.createCheckbox('app-auto-start',tid('app_auto_start'),IFManager.IsAutoStart,'') + '</div><br>';

    var dis = (IFManager.IsDesktopApp() && IFManager.DeviceInterface.hasModule && IFManager.DeviceInterface.hasModule('dev-tools',1)) ? '' : 'ui-disabled';

    generalSettings += '<div class="top-space-double">' + lzm_inputControls.createButton('app-console',dis,'IFManager.IFToggleDevTools()','Developer Tools','<i class="fa fa-code"></i>','force-text',{padding:'6px 10px'},'',30,'d');
    generalSettings += lzm_inputControls.createButton('clear-storage','','LocalConfiguration.Reset()','Clear Local Data','<i class="fa fa-trash"></i>','force-text',{padding:'6px 10px','margin-left':'6px'},'',30,'d');
    generalSettings += '</div></fieldset>';

    var viewSelectSettings = '<fieldset id="view-select-settings" class="lzm-fieldset" data-role="none">' + this.createViewSelectSettings(lzm_chatDisplay.viewSelectArray, lzm_chatDisplay.showViewSelectPanel) + '</fieldset>';
    var tableSettings = '<div id="table-settings-placeholder"></div>';

    var aboutSettings = '<fieldset id="about-settings" class="lzm-fieldset" data-role="none">' +
        '<legend>' + t('About LiveZilla') + '</legend>' +
        '<div style="padding: 5px 0;">' + t('LiveZilla Server Version: <!--lz_server_version-->',
        [['<!--lz_server_version-->', lzm_commonConfig.lz_version]]) + '</div>';

    if (lzm_commonConfig.lz_app_version != '')
        aboutSettings += '<div style="padding: 5px 0;">' + t('LiveZilla App Version: <!--lz_app_version-->',[['<!--lz_app_version-->', lzm_commonConfig.lz_app_version]]) + '</div>';

    if(IFManager.IsDesktopApp() && typeof(window.top.AppFrame) != 'undefined'){
        aboutSettings += '<div style="padding: 5px 0;">' + t('LiveZilla App Version: <!--lz_app_version-->',[['<!--lz_app_version-->', window.top.AppFrame.AppVersion]]) + '</div>';
    }

    var liveZillaWebsite = t('LiveZilla Website'), kolobokWebsite = t('Kolobok Emoticons');
    aboutSettings += '<div style="padding: 15px 0 5px 0;">' + t('Copyright <!--copyright--> LiveZilla GmbH, 2017. All Rights reserved.',
        [['<!--copyright-->', '&#169;']]) + '<br />' +
        '<div style="padding: 5px 0;">' + t('Homepage / Updates: <!--link-->', [['<!--link-->', '<a href="#" onclick="openLink(\'https://www.livezilla.net/\');">' + liveZillaWebsite + '</a>']]) + '</div>' +
        '<div style="padding: 5px 0;">' + t('This product or document is protected by copyright and distributed under licenses restricting its use, copying, distribution and decompilation.') + '</div>' +
        '<div style="padding: 5px 0;">' + t('No part of this product may be reproduced in any form by any means without prior written authorization of LiveZilla and its licensors, if any.') + '</div>' +
        '<div style="padding: 5px 0;">' + t('LiveZilla uses <!--kolobok_link--> - Copyright <!--copyright--> Aiwan.',
            [['<!--kolobok_link-->', '<a href="#" onclick="openLink(\'http://www.en.kolobok.us/\');">' + kolobokWebsite + '</a>'], ['<!--copyright-->', '&#169;']]) + '</div>' +
        '</div>';
    aboutSettings += '</fieldset>';

    var tos = '<iframe id="tos" src="./../license_' + (DataEngine.userLanguage.toLowerCase().indexOf('de')===0?'de':'en') + '.html"></iframe>';

    var settingsTabList = [{name: t('General'), content: '<div class="lzm-tab-scroll-content">' + generalSettings + '</div>'},
        {name: tid('notifications'), content: '<div class="lzm-tab-scroll-content">' +notificationSettings + '</div>'},
        {name: tid('panel'), content: '<div class="lzm-tab-scroll-content">' +viewSelectSettings + '</div>'},
        {name: tid('tables'), content: '<div class="lzm-tab-scroll-content">' +tableSettings + '</div>'},
        {name: t('About LiveZilla'), content: '<div class="lzm-tab-scroll-content">' +aboutSettings + '</div>'},
        {name: tid('tos'), content: '<div class="lzm-tab-scroll-content">' + tos + '</div>'}
    ];

    return settingsTabList;
};

ChatSettingsClass.prototype.createTableSettings = function(rtableId){
    var tabList = [];
    var columnIsChecked, cssClasses='';

    for(var key in this.tableIds)
    {
        this.tableIndexCounter = 0;
        var tableId = this.tableIds[key];
        var tableSettingsHtml = '<div style="margin-top: 5px;" class="lzm-fieldset" id="'+tableId+'-table-columns">';

        for (var i=0; i<this.mainTableColumns[tableId].length; i++) {
            columnIsChecked = (this.mainTableColumns[tableId][i].display == 1) ? ' checked="checked"' : '';
            cssClasses = tableId+'-table-div table-div';
            if (this.tableIndexCounter == this.tableSelectedRow[tableId])
                cssClasses += ' selected-panel-settings-line';

            if(LocalConfiguration.IsCustom(this.mainTableColumns[tableId][i].cid))
            {
                var customInput = DataEngine.inputList.getCustomInput(DataEngine.inputList.idList[this.mainTableColumns[tableId][i].cid.replace('c','')]);
                if(customInput != null && customInput.active == '0')
                    cssClasses += ' ui-disabled';
            }
            tableSettingsHtml += this.getPositionChangeButtonLine(this.tableIndexCounter,'table-cell',tableId,this.mainTableColumns[tableId][i].cid,t(this.mainTableColumns[tableId][i].title),cssClasses,'',columnIsChecked,(this.tableIndexCounter == this.tableSelectedRow[tableId]) ? 'block' : 'none','changeTableRow(event,\''+tableId+'\','+key+',\''+this.mainTableColumns[tableId][i].cid+'\',\'<!--command-->\')');
            this.tableIndexCounter++;
        }

        tableSettingsHtml += '</div>';

        if(d(rtableId) && tableId ==rtableId)
            return tableSettingsHtml;

        tabList.push({name: tid(tableId+'_table'), content: '<div class="lzm-tab-scroll-content-sub">' +  tableSettingsHtml + '</div>'});

    }
    return tabList;
};

ChatSettingsClass.prototype.createViewSelectSettings = function(viewSelectArray, showViewSelectPanel){
    var viewSelectSettings = '<legend>' + t('Panel') + '</legend>';
    for (var i=0; i<viewSelectArray.length; i++) {
        var thisViewId = viewSelectArray[i].id;
        var thisViewName = t(viewSelectArray[i].name);
        var showThisViewChecked = (showViewSelectPanel[thisViewId] != 0) ? ' checked="checked"' : '';
        var cssClasses = 'show-view-div';
        var disabledClass = '';
        if (i == 1)
            cssClasses += ' selected-panel-settings-line';
        if (true /*DataEngine.crc3 != null && DataEngine.crc3[1] == '-2'*/ && thisViewId == 'home')
        {
            cssClasses += ' ui-disabled';
            showThisViewChecked = ' checked="checked"';
        }
        viewSelectSettings += this.getPositionChangeButtonLine(i, 'show-view', '', thisViewId, thisViewName, cssClasses, disabledClass, showThisViewChecked, (i == 0) ? 'block' : 'none','');
    }
    return viewSelectSettings;
};

ChatSettingsClass.prototype.getPositionChangeButtonLine = function(rowIndex, type, tableName, viewId, viewName, classes, disabledClass, isChecked, displayMode, event){
    var dviewId = (tableName != '') ? tableName+'-'+viewId : viewId;
    var html = '<div style="padding: 8px 0 10px 5px;" data-row-index="' + rowIndex.toString() + '" data-view-id="' + dviewId + '" class="' + classes + '" id="show-view-div-' + viewId + '">' +
        '<span class="view-select-settings-checkbox"><input type="checkbox" value="1" onchange="'+event.replace('<!--command-->','visible')+'" class="checkbox-custom' + disabledClass + '" id="show-' + dviewId + '"' + isChecked + ' />' +
        '<label class="checkbox-custom-label" for="show-' + dviewId + '"></label></span>' +
        '<span>' + viewName + '</span>' +
        '<span class="position-change-buttons '+type+'" id="position-change-buttons-' + dviewId + '" style="float:right;margin:4px;display: ' + displayMode + '">';

    html+= lzm_inputControls.createButton(tableName+viewId+'-'+type+'-up', 'position-change-buttons-up position-'+type, event.replace('<!--command-->','up'), '', '<i class="fa fa-chevron-up"></i>', 'lr', {'margin-left': '0'},'',-1,'a')
    + lzm_inputControls.createButton(tableName+viewId+'-'+type+'-down', 'position-change-buttons-down position-'+type, event.replace('<!--command-->','down'), '', '<i class="fa fa-chevron-down"></i>', 'lr', {'margin-left': '4px'},'',-1,'a');

    return html + '</span></div>';
};

ChatSettingsClass.prototype.orderViewPanel = function(viewArray, selectedViewId){
    var that = this, viewSelectArray = [], viewSelectObject = {}, i = 0;
    var showViewSelectPanel = {};
    for (i=0; i<lzm_chatDisplay.viewSelectArray.length; i++) {
        viewSelectObject[lzm_chatDisplay.viewSelectArray[i].id] = lzm_chatDisplay.viewSelectArray[i].name;
        showViewSelectPanel[lzm_chatDisplay.viewSelectArray[i].id] =
            ($('#show-' + lzm_chatDisplay.viewSelectArray[i].id).prop('checked')) ? 1 : 0;
    }
    for (i=0; i<viewArray.length; i++)
        viewSelectArray.push({id: viewArray[i], name : viewSelectObject[viewArray[i]]});

    var settingsHtml = that.createViewSelectSettings(viewSelectArray, showViewSelectPanel);
    $('#view-select-settings').html(settingsHtml).trigger('create');

    var viewId = '';
    $('.show-view-div').click(function() {
        $('.show-view-div').removeClass('selected-panel-settings-line');
        $(this).addClass('selected-panel-settings-line');
        viewId = $(this).data('view-id');
        that.togglePositionChangeButtons(viewId, 'show-view');
    });
    $('.position-change-buttons-up.position-show-view').click(function() {
        var myIndex = $.inArray(viewId, viewArray);
        if (myIndex != 0) {
            var replaceId = viewArray[myIndex - 1];
            for (var i=0; i<viewArray.length; i++)
                viewArray[i] = (i == myIndex) ? replaceId : (i == myIndex - 1) ? viewId : viewArray[i];
            that.orderViewPanel(viewArray, viewId);
        }
    });
    $('.position-change-buttons-down.position-show-view').click(function() {
        var myIndex = $.inArray(viewId, viewArray);
        if (myIndex != viewArray.length - 1) {
            var replaceId = viewArray[myIndex + 1];
            for (var i=0; i<viewArray.length; i++) {
                viewArray[i] = (i == myIndex) ? replaceId : (i == myIndex + 1) ? viewId : viewArray[i];
            }
            that.orderViewPanel(viewArray, viewId);
        }
    });
    $('#show-view-div-' + selectedViewId).click();
};

ChatSettingsClass.prototype.togglePositionChangeButtons = function(viewId, type, tableId){
    tableId = (d(tableId) ?  '-'+tableId : '');
    $('.position-change-buttons'+tableId+'.'+type).css({'display': 'none'});
    $('#position-change-buttons-' + viewId).css({'display': 'block'});
};

ChatSettingsClass.prototype.GetUserManagementTitle = function(){
    var s = '<span id="user-management-title">' + t('User Management (<!--user_count--> Users / <!--group_count--> Groups)',[['<!--user_count-->', DataEngine.operators.getOperatorCount()], ['<!--group_count-->', DataEngine.groups.getGroupCount()]]) + '</span>';
    return s;
};

ChatSettingsClass.prototype.createUserManagement = function(){

    var umWindow = TaskBarManager.GetWindow('user-management-dialog');
    if(umWindow != null)
    {
        umWindow.Maximize();
        return;
    }

    var that = this;
    lzm_chatDisplay.showUsersettingsHtml = false;
    lzm_chatDisplay.showMinifiedDialogsHtml = false;

    $('#usersettings-menu').css({'display': 'none'});
    $('#minified-dialogs-menu').css('display', 'none');

    var headerString = this.GetUserManagementTitle();
    var footerString = '<span id="umg-footer" class="lzm-unselectable"></span><span style="float:right;">';

    footerString += lzm_inputControls.createButton('save-usermanagement', '', '', tid('save'), '', 'lr', {'margin-left': '4px', visibility: 'hidden'},'',30,'d');
    footerString += lzm_inputControls.createButton('cancel-usermanagement', '', '', tid('close'), '', 'lr', {'margin-left': '6px'},'',30,'d');

    footerString += '</span>';

    var acid = md5(Math.random().toString()).substr(0, 5);

    var bodyString = '<iframe id="user-management-iframe" onload="ChatSettingsClass.__UserManagementLoaded();" src="um.php?acid=' + acid + '&type=user_management&lang=' + lz_global_base64_url_encode(lzm_t.language) + '"></iframe>';

    bodyString += '<div id="usermanagement-loading"><div class="lz_anim_loading"></div></div>';
    $('#usermanagement-loading').css({position:'absolute',left:0,top:0,bottom:0,right:0,'background-color':'#fff','background-position': 'center', 'z-index': 1000});

    var dialogData = {ratio : this.DialogBorderRatioFull};
    if (lzm_chatDisplay.selected_view == 'mychats' && ChatManager.ActiveChat != '')
    {
        var thisChatPartner = lzm_displayHelper.getChatPartner(ChatManager.ActiveChat);
        dialogData = {ratio : this.DialogBorderRatioFull, 'chat-partner': ChatManager.ActiveChat, 'chat-partner-name': thisChatPartner['name'],'chat-partner-userid': thisChatPartner['userid']};
    }
    dialogData['no-selected-view'] = true;

    lzm_commonDialog.CreateDialogWindow(headerString, bodyString, footerString, 'user', 'user-management-dialog','user-management-dialog','cancel-usermanagement',true,dialogData);

    TaskBarManager.GetActiveWindow().StaticWindowType = true;

    UIRenderer.resizeUserManagement();

    $('#cancel-usermanagement').click(function(){
        if (that.userManagementAction == 'list')
        {
            TaskBarManager.RemoveActiveWindow();
        }
        else if ($.inArray(that.userManagementAction,['signature','text','title','smc','oh']) != -1)
        {
            document.getElementById('user-management-iframe').contentWindow.removeTextEmailsPlaceholderMenu();
            document.getElementById('user-management-iframe').contentWindow.removeSignaturePlaceholderMenu();
            closeOperatorSignatureTextInput();
        }
        else
        {
            closeOperatorGroupConfiguration();
        }
    });
    $('#save-usermanagement').click(function(){
        if(document.getElementById('user-management-iframe') != null)
        {
            var handleUserOrGroupSave = false;
            if (that.userManagementAction == 'signature')
            {
                document.getElementById('user-management-iframe').contentWindow.lzm_userManagement.saveSignature();
            }
            else if (that.userManagementAction == 'text')
            {
                document.getElementById('user-management-iframe').contentWindow.lzm_userManagement.saveText();
            }
            else if (that.userManagementAction == 'smc')
            {
                document.getElementById('user-management-iframe').contentWindow.lzm_userManagement.saveSocialMediaChannel();
            }
            else
            {
                handleUserOrGroupSave = true;
                document.getElementById('user-management-iframe').contentWindow.lzm_userManagement.saveUserOrGroup();
            }
            if (!handleUserOrGroupSave) {
                $('#cancel-usermanagement').click();
            }
        }
    });
};

ChatSettingsClass.__UserManagementClassGoToPage = function(_type,_page){
    if(_type == 'user')
        document.getElementById('user-management-iframe').contentWindow.AdminUserManagementClass.PageUser = _page;
    else
        document.getElementById('user-management-iframe').contentWindow.AdminUserManagementClass.PageGroup = _page;
    document.getElementById('user-management-iframe').contentWindow.lzm_userManagement.UpdateViews(true);
};

ChatSettingsClass.__UserManagementLoaded = function(){
    $('#usermanagement-loading').remove();
};

ChatSettingsClass.__IgnoreUpdate = function(_version){
    LocalConfiguration.IgnoreUpdate = _version;
    LocalConfiguration.Save();
    lzm_commonDialog.removeAlertDialog();
};

function LocalConfiguration() {}

LocalConfiguration.Key = '';
LocalConfiguration.UIShowAvatars = true;
LocalConfiguration.ChatAutoAccept = false;
LocalConfiguration.LastFeedback = '';
LocalConfiguration.NotificationFeedbacks = true;
LocalConfiguration.NotificationTickets = true;
LocalConfiguration.NotificationChats = true;
LocalConfiguration.NotificationOperators = true;
LocalConfiguration.NotificationEmails = true;
LocalConfiguration.NotificationVisitors = false;
LocalConfiguration.NotificationErrors = true;
LocalConfiguration.NotificationTimeout = 6;
LocalConfiguration.ShowViewSelectPanel = [];
LocalConfiguration.ViewSelectArray = [];
LocalConfiguration.PlayChatSound = true;
LocalConfiguration.PlayVisitorSound = false;
LocalConfiguration.PlayTicketSound = false;
LocalConfiguration.PlayChatMessageSound = true;
LocalConfiguration.RingRequired = false;
LocalConfiguration.RepeatChatSound = true;
LocalConfiguration.PlayQueueSound = true;
LocalConfiguration.RepeatQueueSound = true;
LocalConfiguration.TableColumns = {visitor: [], visitor_custom: [], ticket: [], ticket_custom: [], archive: [], archive_custom: [], allchats: [], allchats_custom: []};
LocalConfiguration.VisitorFilterCountry = 0;
LocalConfiguration.VisitorsMapVisible = true;
LocalConfiguration.VisitorsTreeviewVisible = true;
LocalConfiguration.VisitorsCountryFilterVisible = false;
LocalConfiguration.TicketSearchSettings = '11111110111010';
LocalConfiguration.KBSearchSettings = '11';
LocalConfiguration.TicketTreeCategory = 'tnFilterStatusActive';
LocalConfiguration.TicketTreeCategoryParent = '';
LocalConfiguration.TicketTreeCategorySubStatus = '';
LocalConfiguration.UserLanguages = ['en_US','de_DE'];
LocalConfiguration.ActiveLanguage = 'en_US';
LocalConfiguration.ExcludedWords = [];
LocalConfiguration.CheckUpdates = true;
LocalConfiguration.IgnoreUpdate = 6200;
LocalConfiguration.IdleTimeTarget = 3;
LocalConfiguration.IdleTimeActive = false;
LocalConfiguration.IdleTime = 300;
LocalConfiguration.CollapsedGroups = [];
LocalConfiguration.EmailList = [];
LocalConfiguration.SoundVolume = 100;
LocalConfiguration.FilterChannel = '01234567';
LocalConfiguration.PasteHTML = false;
LocalConfiguration.KBAutoSearch = true;
LocalConfiguration.DataExportSettings = '';
LocalConfiguration.TicketSortCategories = {};
LocalConfiguration.ShowTicketTree = true;
LocalConfiguration.OnboardingDone = '';

LocalConfiguration.SetTicketSortField = function(_field){

    var area = LocalConfiguration.GetTicketAreaKey();
    if(!d(LocalConfiguration.TicketSortCategories[area]))
        LocalConfiguration.TicketSortCategories[area] = {field:_field};
    else
        LocalConfiguration.TicketSortCategories[area].field = _field;
};

LocalConfiguration.SetTicketSortDirection = function(_order){
    var area = LocalConfiguration.GetTicketAreaKey();
    if(!d(LocalConfiguration.TicketSortCategories[area]))
        LocalConfiguration.TicketSortCategories[area] = {order:_order};
    else
        LocalConfiguration.TicketSortCategories[area].order = _order;
};

LocalConfiguration.GetTicketSortField = function(_area){
    var area = LocalConfiguration.GetTicketAreaKey();
    if(d(LocalConfiguration.TicketSortCategories[area]))
        return LocalConfiguration.TicketSortCategories[area].field;
    else
        return 'update';
};

LocalConfiguration.GetTicketSortDirection = function(_area){
    var area = LocalConfiguration.GetTicketAreaKey();
    if(d(LocalConfiguration.TicketSortCategories[area]))
        return LocalConfiguration.TicketSortCategories[area].order;
    else
        return 'DESC';
};

LocalConfiguration.GetTicketAreaKey = function(){

    var area = CommonInputControlsClass.SearchBox.IsActiveSearch() ? 'search' : CommunicationEngine.ticketFilterStatus+CommunicationEngine.ticketFilterPersonal+CommunicationEngine.ticketFilterGroup+CommunicationEngine.ticketFilterWatchList+CommunicationEngine.ticketFilterSubChannels+CommunicationEngine.ticketFilterSubStatus;
    if(!area.length)
        area = 'all';
    return md5(area).substr(0,5);
};

LocalConfiguration.Load = function() {

    LocalConfiguration.UIShowAvatars = LocalConfiguration.LoadValue('show_avatars_',1)!=0;
    LocalConfiguration.ChatAutoAccept = LocalConfiguration.LoadValue('auto_accept_chat_',0)!=0;
    LocalConfiguration.LastFeedback = LocalConfiguration.LoadValue('last_fb_','');
    LocalConfiguration.TicketSearchSettings = LocalConfiguration.LoadValue('ticket_ss','1111111011101');
    LocalConfiguration.OnboardingDone = LocalConfiguration.LoadValue('onboard_done','');
    LocalConfiguration.KBSearchSettings = LocalConfiguration.LoadValue('kb_ss','11');
    LocalConfiguration.DataExportSettings = LocalConfiguration.LoadValue('datex_settings','');
    LocalConfiguration.ShowViewSelectPanel = LocalConfiguration.LoadValue('main_panel_',[]);
    LocalConfiguration.ViewSelectArray = LocalConfiguration.LoadValue('main_panel_array_',[]);
    LocalConfiguration.PlayChatSound = LocalConfiguration.LoadValue('play_chat_sound_',1)!=0;
    LocalConfiguration.PlayVisitorSound = LocalConfiguration.LoadValue('play_vis_sound_',0)!=0;
    LocalConfiguration.PlayTicketSound = LocalConfiguration.LoadValue('play_ticket_sound_',0)!=0;
    LocalConfiguration.PlayChatMessageSound = LocalConfiguration.LoadValue('play_msg_sound_',1)!=0;
    LocalConfiguration.RepeatChatSound = LocalConfiguration.LoadValue('repeat_chat_sound_',1)!=0;
    LocalConfiguration.PlayQueueSound = LocalConfiguration.LoadValue('play_queue_sound_',1)!=0;
    LocalConfiguration.RepeatQueueSound = LocalConfiguration.LoadValue('repeat_queue_sound_',1)!=0;
    LocalConfiguration.NotificationFeedbacks = LocalConfiguration.LoadValue('nf_feedbacks_',1)!=0;
    LocalConfiguration.NotificationTickets = LocalConfiguration.LoadValue('nf_tickets_',1)!=0;
    LocalConfiguration.NotificationChats = LocalConfiguration.LoadValue('nf_chats_',1)!=0;
    LocalConfiguration.NotificationOperators = LocalConfiguration.LoadValue('nf_operators_',1)!=0;
    LocalConfiguration.NotificationEmails = LocalConfiguration.LoadValue('nf_emails_',1)!=0;
    LocalConfiguration.NotificationVisitors = LocalConfiguration.LoadValue('nf_visitors_',0)!=0;
    LocalConfiguration.NotificationErrors = LocalConfiguration.LoadValue('nf_err_',1)!=0;
    LocalConfiguration.NotificationFeedbackTimeoutEnabled = LocalConfiguration.LoadValue('nf_feedback_timeout_enabled_',1)!=0;
    LocalConfiguration.NotificationTicketTimeoutEnabled = LocalConfiguration.LoadValue('nf_ticket_timeout_enabled_',1)!=0;
    LocalConfiguration.NotificationChatTimeoutEnabled = LocalConfiguration.LoadValue('nf_chat_timeout_enabled_',1)!=0;
    LocalConfiguration.NotificationOperatorTimeoutEnabled = LocalConfiguration.LoadValue('nf_operator_timeout_enabled_',1)!=0;
    LocalConfiguration.NotificationEmailTimeoutEnabled = LocalConfiguration.LoadValue('nf_email_timeout_enabled_',1)!=0;
    LocalConfiguration.NotificationVisitorTimeoutEnabled = LocalConfiguration.LoadValue('nf_visitor_timeout_enabled_',1)!=0;
    LocalConfiguration.NotificationFeedbackTimeout = LocalConfiguration.LoadValue('nf_feedback_timeout_',6);
    LocalConfiguration.NotificationTicketTimeout = LocalConfiguration.LoadValue('nf_ticket_timeout_',6);
    LocalConfiguration.NotificationChatTimeout = LocalConfiguration.LoadValue('nf_chat_timeout_',6);
    LocalConfiguration.NotificationOperatorTimeout = LocalConfiguration.LoadValue('nf_operator_timeout_',6);
    LocalConfiguration.NotificationEmailTimeout = LocalConfiguration.LoadValue('nf_email_timeout_',6);
    LocalConfiguration.NotificationVisitorTimeout = LocalConfiguration.LoadValue('nf_visitor_timeout_',6);
    LocalConfiguration.VisitorFilterCountry = LocalConfiguration.LoadValue('vf_ctr_','');
    LocalConfiguration.VisitorsMapVisible = LocalConfiguration.LoadValue('show_map_',1)!=0;
    LocalConfiguration.VisitorsTreeviewVisible = LocalConfiguration.LoadValue('show_treeview_',1)!=0;
    LocalConfiguration.VisitorsCountryFilterVisible = LocalConfiguration.LoadValue('show_countries_',0)!=0;
	LocalConfiguration.UserLanguages = LocalConfiguration.LoadValue('usr_languages_','').split(',')[0] == '' ? [] : LocalConfiguration.LoadValue('usr_languages_','').split(',');
    LocalConfiguration.ActiveLanguage = LocalConfiguration.LoadValue('usr_activelanguage_','');
    LocalConfiguration.ExcludedWords = LocalConfiguration.LoadValue('usr_excluded_words_','').split(',')[0] == '' ? [] : LocalConfiguration.LoadValue('usr_excluded_words_','').split(',');
    LocalConfiguration.CollapsedGroups = LocalConfiguration.LoadValue('gr_collapsed_','').split(',')[0] == '' ? [] : LocalConfiguration.LoadValue('gr_collapsed_','').split(',');
    LocalConfiguration.CheckUpdates = LocalConfiguration.LoadValue('chk_upd_',1)!=0;
    LocalConfiguration.IgnoreUpdate = LocalConfiguration.LoadValue('ign_upd_',6200);
    LocalConfiguration.IdleTime = LocalConfiguration.LoadValue('idle_time_', 300);
    LocalConfiguration.IdleTimeTarget = LocalConfiguration.LoadValue('idle_time_target_', 3);
    LocalConfiguration.IdleTimeActive = LocalConfiguration.LoadValue('idle_time_active_', 0)!=0;
    LocalConfiguration.EmailList = LocalConfiguration.LoadValue('eml_list_', '');
    LocalConfiguration.SoundVolume = LocalConfiguration.LoadValue('svol_', 100);
    LocalConfiguration.TicketTreeCategory = LocalConfiguration.LoadValue('stc_', 'tnFilterStatusActive');
    LocalConfiguration.TicketTreeCategoryParent = LocalConfiguration.LoadValue('stcp_', '');
    LocalConfiguration.TicketTreeCategorySubStatus = LocalConfiguration.LoadValue('stcss_', '');
    LocalConfiguration.FilterChannel = LocalConfiguration.LoadValue('ftchannel_', '01234567');
    LocalConfiguration.PasteHTML = LocalConfiguration.LoadValue('paste_html_',0)!=0;
    LocalConfiguration.KBAutoSearch = LocalConfiguration.LoadValue('kb_auto_search_',1)!=0;
    LocalConfiguration.TicketSortCategories = LocalConfiguration.LoadValue('ticket_sort_cats', '');
    LocalConfiguration.ShowTicketTree = LocalConfiguration.LoadValue('show_ticket_tree_',1) != 0;
    LocalConfiguration.ParseObjects();

    IFManager.IFLocalConfigurationUpdated(LocalConfiguration);
};

LocalConfiguration.Save = function() {

    LocalConfiguration.SaveValue('show_avatars_',LocalConfiguration.UIShowAvatars ? 1 : 0);
    LocalConfiguration.SaveValue('auto_accept_chat_', LocalConfiguration.ChatAutoAccept ? 1 : 0);
    LocalConfiguration.SaveValue('play_chat_sound_', LocalConfiguration.PlayChatSound ? 1 : 0);
    LocalConfiguration.SaveValue('play_vis_sound_', LocalConfiguration.PlayVisitorSound ? 1 : 0);
    LocalConfiguration.SaveValue('play_ticket_sound_', LocalConfiguration.PlayTicketSound ? 1 : 0);
    LocalConfiguration.SaveValue('play_msg_sound_', LocalConfiguration.PlayChatMessageSound ? 1 : 0);
    LocalConfiguration.SaveValue('repeat_chat_sound_', LocalConfiguration.RepeatChatSound ? 1 : 0);
    LocalConfiguration.SaveValue('play_queue_sound_', LocalConfiguration.PlayQueueSound ? 1 : 0);
    LocalConfiguration.SaveValue('repeat_queue_sound_', LocalConfiguration.RepeatQueueSound ? 1 : 0);
    LocalConfiguration.SaveValue('last_fb_', LocalConfiguration.LastFeedback);
    LocalConfiguration.SaveValue('ticket_ss', LocalConfiguration.TicketSearchSettings);
    LocalConfiguration.SaveValue('onboard_done', LocalConfiguration.OnboardingDone);
    LocalConfiguration.SaveValue('kb_ss', LocalConfiguration.KBSearchSettings);
    LocalConfiguration.SaveValue('datex_settings', LocalConfiguration.DataExportSettings);
    LocalConfiguration.SaveValue('main_panel_', JSON.stringify(LocalConfiguration.ShowViewSelectPanel));
    LocalConfiguration.SaveValue('main_panel_array_', JSON.stringify(LocalConfiguration.ViewSelectArray));
    LocalConfiguration.SaveValue('nf_feedbacks_', LocalConfiguration.NotificationFeedbacks ? 1 : 0);
    LocalConfiguration.SaveValue('nf_tickets_', LocalConfiguration.NotificationTickets ? 1 : 0);
    LocalConfiguration.SaveValue('nf_chats_', LocalConfiguration.NotificationChats ? 1 : 0);
    LocalConfiguration.SaveValue('nf_operators_', LocalConfiguration.NotificationOperators ? 1 : 0);
    LocalConfiguration.SaveValue('nf_emails_', LocalConfiguration.NotificationEmails ? 1 : 0);
    LocalConfiguration.SaveValue('nf_visitors_', LocalConfiguration.NotificationVisitors ? 1 : 0);
    LocalConfiguration.SaveValue('nf_err_', LocalConfiguration.NotificationErrors ? 1 : 0);
    LocalConfiguration.SaveValue('nf_feedback_timeout_enabled_', LocalConfiguration.NotificationFeedbackTimeoutEnabled ? 1 : 0);
    LocalConfiguration.SaveValue('nf_ticket_timeout_enabled_', LocalConfiguration.NotificationTicketTimeoutEnabled ? 1 : 0);
    LocalConfiguration.SaveValue('nf_chat_timeout_enabled_', LocalConfiguration.NotificationChatTimeoutEnabled ? 1 : 0);
    LocalConfiguration.SaveValue('nf_operator_timeout_enabled_', LocalConfiguration.NotificationOperatorTimeoutEnabled ? 1 : 0);
    LocalConfiguration.SaveValue('nf_email_timeout_enabled_', LocalConfiguration.NotificationEmailTimeoutEnabled ? 1 : 0);
    LocalConfiguration.SaveValue('nf_visitor_timeout_enabled_', LocalConfiguration.NotificationVisitorTimeoutEnabled ? 1 : 0);
    LocalConfiguration.SaveValue('nf_feedback_timeout_', LocalConfiguration.NotificationFeedbackTimeout);
    LocalConfiguration.SaveValue('nf_ticket_timeout_', LocalConfiguration.NotificationTicketTimeout);
    LocalConfiguration.SaveValue('nf_chat_timeout_', LocalConfiguration.NotificationChatTimeout);
    LocalConfiguration.SaveValue('nf_operator_timeout_', LocalConfiguration.NotificationOperatorTimeout);
    LocalConfiguration.SaveValue('nf_email_timeout_', LocalConfiguration.NotificationEmailTimeout);
    LocalConfiguration.SaveValue('nf_visitor_timeout_', LocalConfiguration.NotificationVisitorTimeout);
    LocalConfiguration.SaveValue('vf_ctr_', LocalConfiguration.VisitorFilterCountry);
    LocalConfiguration.SaveValue('show_map_', LocalConfiguration.VisitorsMapVisible ? 1 : 0);
    LocalConfiguration.SaveValue('show_treeview_', LocalConfiguration.VisitorsTreeviewVisible ? 1 : 0);
    LocalConfiguration.SaveValue('show_countries_', LocalConfiguration.VisitorsCountryFilterVisible ? 1 : 0);
    LocalConfiguration.SaveValue('usr_languages_', LocalConfiguration.UserLanguages);
    LocalConfiguration.SaveValue('usr_activelanguage_', LocalConfiguration.ActiveLanguage);
    LocalConfiguration.SaveValue('usr_excluded_words_', LocalConfiguration.ExcludedWords);
    LocalConfiguration.SaveValue('gr_collapsed_', LocalConfiguration.CollapsedGroups);
    LocalConfiguration.SaveValue('chk_upd_', LocalConfiguration.CheckUpdates ? 1 : 0);
    LocalConfiguration.SaveValue('show_ticket_tree_', LocalConfiguration.ShowTicketTree ? 1 : 0);
    LocalConfiguration.SaveValue('ign_upd_', LocalConfiguration.IgnoreUpdate);
    LocalConfiguration.SaveValue('idle_time_', LocalConfiguration.IdleTime);
    LocalConfiguration.SaveValue('idle_time_target_', LocalConfiguration.IdleTimeTarget);
    LocalConfiguration.SaveValue('idle_time_active_', LocalConfiguration.IdleTimeActive ? 1 : 0);
    LocalConfiguration.SaveValue('eml_list_', JSON.stringify(LocalConfiguration.EmailList));
    LocalConfiguration.SaveValue('svol_', LocalConfiguration.SoundVolume);
    LocalConfiguration.SaveValue('stc_', LocalConfiguration.TicketTreeCategory);
    LocalConfiguration.SaveValue('stcp_', LocalConfiguration.TicketTreeCategoryParent);
    LocalConfiguration.SaveValue('stcss_', LocalConfiguration.TicketTreeCategorySubStatus);
    LocalConfiguration.SaveValue('paste_html_', LocalConfiguration.PasteHTML ? 1 : 0);
    LocalConfiguration.SaveValue('kb_auto_search_', LocalConfiguration.KBAutoSearch ? 1 : 0);
    LocalConfiguration.SaveValue('ticket_sort_cats', JSON.stringify(LocalConfiguration.TicketSortCategories));

    IFManager.IFLocalConfigurationUpdated(LocalConfiguration);

    LocalConfiguration.SaveValue('ftchannel_', LocalConfiguration.FilterChannel);
};

LocalConfiguration.ParseObjects = function() {

    try
    {
        if(typeof LocalConfiguration.ViewSelectArray == 'string')
            LocalConfiguration.ViewSelectArray = JSON.parse(LocalConfiguration.ViewSelectArray);
    }
    catch(ex)
    {
        LocalConfiguration.ViewSelectArray = [];
    }
    try
    {
        if(typeof LocalConfiguration.ShowViewSelectPanel == 'string')
            LocalConfiguration.ShowViewSelectPanel = JSON.parse(LocalConfiguration.ShowViewSelectPanel);
    }
    catch(ex)
    {
        LocalConfiguration.ShowViewSelectPanel = [];
    }
    try
    {
        if(typeof LocalConfiguration.EmailList == 'string' && LocalConfiguration.EmailList.length)
            LocalConfiguration.EmailList = JSON.parse(LocalConfiguration.EmailList);
        else
            LocalConfiguration.EmailList = [];
    }
    catch(ex)
    {
        LocalConfiguration.EmailList = [];
    }
    try
    {
        if(typeof LocalConfiguration.TicketSortCategories == 'string' && LocalConfiguration.TicketSortCategories.length)
            LocalConfiguration.TicketSortCategories = JSON.parse(LocalConfiguration.TicketSortCategories);
        else
            LocalConfiguration.TicketSortCategories = {};
    }
    catch(ex)
    {
        LocalConfiguration.TicketSortCategories = {};
    }
};

LocalConfiguration.SaveValue = function(_key,_value) {
    lzm_commonStorage.saveValue(_key + LocalConfiguration.Key,_value);
};

LocalConfiguration.LoadValue = function(_key,_fallBack) {
    return lzm_commonStorage.loadValue(_key + LocalConfiguration.Key,_fallBack);
};

LocalConfiguration.IsCustom = function(_cid) {
    return _cid.length==2 && _cid.indexOf('c')==0;
};

LocalConfiguration.AddCustomBlock = function(_array) {
    _array.push({cid: 'c0', title: 'Custom 1', display: 0});
    _array.push({cid: 'c1', title: 'Custom 2', display: 0});
    _array.push({cid: 'c2', title: 'Custom 3', display: 0});
    _array.push({cid: 'c3', title: 'Custom 4', display: 0});
    _array.push({cid: 'c4', title: 'Custom 5', display: 0});
    _array.push({cid: 'c5', title: 'Custom 6', display: 0});
    _array.push({cid: 'c6', title: 'Custom 7', display: 0});
    _array.push({cid: 'c7', title: 'Custom 8', display: 0});
    _array.push({cid: 'c8', title: 'Custom 9', display: 0});
    _array.push({cid: 'c9', title: 'Custom 10', display: 0});
};

LocalConfiguration.CreateTableArray = function(table, type, columnArray) {
    var key,i = 0, newColumnArray = [];
    columnArray = (typeof columnArray != 'undefined') ? columnArray : [];
    if (type == 'general')
    {
        if (table == 'ticket' && columnArray instanceof Array) {
            if (columnArray instanceof Array && columnArray.length == 0)
            {
                newColumnArray = [
                    {cid: 'last_update', title: 'Last Update', display: 1, displayChatInfo: 0, sort_key:'update', cell_id: 'ticket-sort-update', cell_class: 'ticket-list-sort-column', cell_style: 'cursor: pointer;', cell_onclick: 'sortTicketsBy(\'update\');'},
                    {cid: 'date', title: 'Date', display: 1, displayChatInfo: 1, cell_id: 'ticket-sort-date', sort_key:'date', cell_class: 'ticket-list-sort-column', cell_style: 'cursor: pointer;', cell_onclick: 'sortTicketsBy(\'date\');'},
                    {cid: 'waiting_time', title: 'Waiting Time', display: 1, displayChatInfo: 0, sort_invert:true, sort_key:'wait', cell_id: 'ticket-sort-wait', cell_class: 'ticket-list-sort-column', cell_style: 'cursor: pointer;', cell_onclick: 'sortTicketsBy(\'wait\');'},
                    {cid: 'ticket_id', title: 'Ticket ID', display: 1, displayChatInfo: 1, sort_key:'id', cell_id: 'ticket-sort-id', cell_class: 'ticket-list-sort-column', cell_style: 'cursor: pointer;', cell_onclick: 'sortTicketsBy(\'id\');'},
                    {cid: 'name', title: 'Name', display: 1, displayChatInfo: 0},
                    {cid: 'group', title: 'Group', display: 1, displayChatInfo: 0},
                    {cid: 'operator', title: 'Operator', display: 1, displayChatInfo: 0},
                    {cid: 'status', title: 'Status', display: 1, displayChatInfo: 0, sort_key:'status', cell_id: 'ticket-sort-status', cell_class: 'ticket-list-sort-column', cell_style: 'cursor: pointer;', cell_onclick: 'sortTicketsBy(\'status\');'},
                    {cid: 'sub_status', title: 'Sub Status', display: 0, displayChatInfo: 0, sort_key:'sub_status', cell_id: 'ticket-sort-sub-status', cell_class: 'ticket-list-sort-column', cell_style: 'cursor: pointer;', cell_onclick: 'sortTicketsBy(\'sub_status\');'},
                    {cid: 'source_type', title: 'Source', display: 1, displayChatInfo: 0, sort_key:'source_type',cell_id: 'ticket-sort-source-type', cell_class: 'ticket-list-sort-column', cell_style: 'cursor: pointer;', cell_onclick: 'sortTicketsBy(\'source_type\');'},
                    {cid: 'sub_source', title: 'Sub-Source', display: 0, displayChatInfo: 0, sort_key:'sub_source', cell_id: 'ticket-sort-sub-source', cell_class: 'ticket-list-sort-column', cell_style: 'cursor: pointer;', cell_onclick: 'sortTicketsBy(\'sub_source\');'},
                    {cid: 'priority', title: 'Priority', display: 1, displayChatInfo: 0, sort_key:'priority', cell_id: 'ticket-sort-priority', cell_class: 'ticket-list-sort-column', cell_style: 'cursor: pointer;', cell_onclick: 'sortTicketsBy(\'priority\');'},
                    {cid: 'subject', title: 'Subject', display: 1, displayChatInfo: 1},
                    {cid: 'messages', title: 'Messages', display: 1, displayChatInfo: 0},
                    {cid: 'email', title: 'Email', display: 0, displayChatInfo: 0},
                    {cid: 'company', title: 'Company', display: 0, displayChatInfo: 0},
                    {cid: 'phone', title: 'Phone', display: 0, displayChatInfo: 0},
                    {cid: 'hash', title: 'Hash', display: 1, displayChatInfo: 0},
                    {cid: 'callback', title: 'Callback', display: 0, displayChatInfo: 0},
                    {cid: 'ip_address', title: 'IP address', display: 0, displayChatInfo: 0},
                    {cid: 'language', title: 'Language', display: 1, displayChatInfo: 0},
                    {cid: 'tags', title: 'Tags', display: 1, displayChatInfo: 0}
                ];
                LocalConfiguration.AddCustomBlock(newColumnArray);
            }
        }
        else if (table == 'visitor' && columnArray instanceof Array)
        {
            if (columnArray instanceof Array && columnArray.length == 0)
            {
                newColumnArray = [
                    {cid: 'online', title: 'Online', display: 1},
                    {cid: 'last_active', title: 'Last Activity', display: 1},
                    {cid: 'name', title: 'Name', display: 1},
                    {cid: 'country', title: 'Country', display: 1},
                    {cid: 'language', title: 'Language', display: 1},
                    {cid: 'region', title: 'Region', display: 1},
                    {cid: 'city', title: 'City', display: 1},
                    {cid: 'website_name', title: 'Website Name', display: 1},
                    {cid: 'page', title: 'Page', display: 1},
                    {cid: 'page_title', title: 'Page Title', display: 1},
                    {cid: 'page_count', title: 'Page Count', display: 1},
                    {cid: 'search_string', title: 'Search string', display: 0},
                    {cid: 'referrer', title: 'Referrer', display: 1},
                    {cid: 'host', title: 'Host', display: 1},
                    {cid: 'ip', title: 'IP address', display: 1},
                    {cid: 'email', title: 'Email', display: 1},
                    {cid: 'company', title: 'Company', display: 1},
                    {cid: 'browser', title: 'Browser', display: 1},
                    {cid: 'resolution', title: 'Resolution', display: 1},
                    {cid: 'os', title: 'Operating system', display: 1},
                    {cid: 'last_visit', title: 'Last Visit', display: 1},
                    {cid: 'visit_count', title: 'Visits', display: 1},
                    {cid: 'isp', title: 'ISP', display: 1}];
                LocalConfiguration.AddCustomBlock(newColumnArray);
            }
        }
        else if (table == 'archive' && columnArray instanceof Array)
        {
            if (columnArray instanceof Array && columnArray.length == 0)
            {
                newColumnArray = [
                    {index: 0, cid: 'date', title: 'Date', display: 1, displayMobile: 1},
                    {index: 1, cid: 'chat_id', title: 'Chat ID', display: 1, displayMobile: 1},
                    {index: 2, cid: 'name', title: 'Name', display: 1, displayMobile: 0},
                    {index: 3, cid: 'operator', title: 'Operator', display: 1, displayMobile: 0},
                    {index: 4, cid: 'group', title: 'Group', display: 1, displayMobile: 0},
                    {index: 5, cid: 'email', title: 'Email', display: 1, displayMobile: 0},
                    {index: 6, cid: 'company', title: 'Company', display: 1, displayMobile: 0},
                    {index: 7, cid: 'question', title: 'Question', display: 1, displayMobile: 0},
                    {index: 8, cid: 'language', title: 'Language', display: 1, displayMobile: 0},
                    {index: 9, cid: 'country', title: 'Country', display: 1, displayMobile: 0},
                    {index: 10, cid: 'ip', title: 'IP', display: 1, displayDialog: 0, displayMobile: 0},
                    {index: 11, cid: 'host', title: 'Host', display: 1, displayMobile: 0},
                    {index: 12, cid: 'duration', title: 'Duration', display: 1, displayMobile: 0},
                    {index: 13, cid: 'website_name', title: 'Website Name', display: 1, displayMobile: 0},
                    {index: 14, cid: 'page_url', title: 'Url', display: 1, displayInfo: 0},
                    {index: 15, cid: 'waiting_time', title: 'Waiting Time', display: 1, displayMobile: 0},
                    {index: 16, cid: 'result', title: 'Result', display: 1, displayMobile: 0},
                    {index: 17, cid: 'ended_by', title: 'Ended By', display: 1, displayMobile: 0},
                    {index: 18, cid: 'callback', title: 'Callback', display: 1, displayMobile: 0},
                    {index: 19, cid: 'phone', title: 'Phone', display: 1, displayMobile: 0},
                    {index: 20, cid: 'ticketid', title: 'Ticket ID', display: 1, displayMobile: 0},
                    {index: 21, cid: 'tags', title: 'Tags', display: 1, displayMobile: 0}
                ];
                LocalConfiguration.AddCustomBlock(newColumnArray);
            }
        }
        else if (table == 'allchats' && columnArray instanceof Array)
        {
            if (columnArray instanceof Array && columnArray.length == 0) {
                newColumnArray = [
                    {cid: 'waiting_time', title: 'Waiting Time', display: 1},
                    {cid: 'status', title: 'Status', display: 1},
                    {cid: 'chat_id', title: 'Chat ID', display: 1, sort: 1, cell_style:'width:75px;padding-right:20px;'},
                    {cid: 'start_time', title: 'Start Time', display: 1, cell_style:'width:75px;'},
                    {cid: 'duration', title: 'Duration', display: 1, cell_style:'width:75px;'},
                    {cid: 'question', title: 'Question', display: 1, cell_style:'min-width:300px;white-space:normal;word-wrap:normal;', contenttitle: true},
                    {cid: 'operators', title: 'Operator', display: 1},
                    {cid: 'ip', title: 'IP', display: 1},
                    {cid: 'group', title: 'Group', display: 1},
                    {cid: 'name', title: 'Name', display: 1},
                    {cid: 'email', title: 'Email', display: 1},
                    {cid: 'company', title: 'Company', display: 1},
                    {cid: 'website_name', title: 'Website Name', display: 1},
                    {cid: 'priority', title: 'Priority', display: 1}

                    ];
                LocalConfiguration.AddCustomBlock(newColumnArray);
            }
        }
        else
        {
            newColumnArray = (type == 'general') ? LocalConfiguration.TableColumns[table] : LocalConfiguration.TableColumns[table + '_custom'];
            var configColumnArray = [];
            if(Object.keys(columnArray).length == newColumnArray.length)
            {
                for (key in columnArray)
                    for (i=0; i<newColumnArray.length; i++)
                        if(key == newColumnArray[i].cid)
                        {
                            newColumnArray[i].display = columnArray[key];
                            configColumnArray.push(newColumnArray[i]);
                        }

                newColumnArray = configColumnArray;
            }

        }
        LocalConfiguration.TableColumns[table] = newColumnArray;
    }
    else
    {
        if (!(columnArray instanceof Array)) {
            for (key in columnArray) {
                if (columnArray.hasOwnProperty(key)) {
                    newColumnArray.push({cid: key, display: columnArray[key]});
                }
            }
        }
    }
};

LocalConfiguration.ConfigureCustomFields = function(_isLocalConfiguration) {
    for (var tableid in LocalConfiguration.TableColumns)
    {
        for (var key in LocalConfiguration.TableColumns[tableid])
        {
            var cid = LocalConfiguration.TableColumns[tableid][key].cid;
            if(LocalConfiguration.IsCustom(cid))
            {
                var obj = DataEngine.inputList.objects[cid.replace('c','')];
                if(obj.active=='0')
                    LocalConfiguration.TableColumns[tableid][key].display = 0;
                else if(!_isLocalConfiguration && LocalConfiguration.TableColumns[tableid][key].display == 0)
                    LocalConfiguration.TableColumns[tableid][key].display = 1;

                if(obj.name != '')
                    LocalConfiguration.TableColumns[tableid][key].title = obj.name;
                else
                    LocalConfiguration.TableColumns[tableid][key].title = tid('custom_field') + ' ' + cid.replace('c','');
            }
        }
    }
};

LocalConfiguration.LoadKnowledgeBase = function(){

    var old = lzm_commonStorage.loadValue('qrd_' + DataEngine.myId,null);
    if(old != null && old.length)
    {
        deblog("OLD KB DATA FOUND; remove and sync ...");
        lzm_commonStorage.saveValue('qrd_' + DataEngine.myId,'');
        lzm_commonStorage.deleteKeyValuePair('qrd_' + DataEngine.myId);
        lzm_commonStorage.deleteKeyValuePair('qrd_request_time_' + DataEngine.myId);
        lzm_commonStorage.deleteKeyValuePair('qrd_search_categories_' + DataEngine.myId);
        lzm_commonStorage.deleteKeyValuePair('qrd_id_list_' + DataEngine.myId);
        KnowledgebaseUI.Synchronize();
    }
    else
    {
        var requestTime = lzm_commonStorage.loadValue('kb_dut_' + DataEngine.myId,0);

        if(!d(requestTime))
            requestTime = 0;

        DataEngine.qrdRequestTime = requestTime;
        DataEngine.resourceLastEdited = DataEngine.qrdRequestTime;

        var resourceIdList = lzm_commonStorage.loadValue('kb_list_' + DataEngine.myId,'');
        if(resourceIdList != null)
        {
            resourceIdList = LocalConfiguration.ParseKnowledgeBaseShortList(resourceIdList);
            for(var key in resourceIdList)
            {
                try
                {
                    var e = lzm_commonStorage.loadValue('kb_i_' + DataEngine.myId + resourceIdList[key]);
                    if(e != null)
                        DataEngine.resources.push(JSON.parse(e));
                }
                catch(ex)
                {
                    deblog(ex);
                }
            }
        }
    }
};

LocalConfiguration.CreateKnowledgeBaseShortList = function(){

    var sl = [];
    for(var key in DataEngine.cannedResources.idList)
        sl.push(KnowledgebaseUI.GetResourceStorageHash(DataEngine.cannedResources.idList[key]));
    return JSON.stringify(sl);


    /*
    var sl = '';
    for(var key in DataEngine.cannedResources.idList)
        sl += (sl.length ? '_' : '') + KnowledgebaseUI.GetResourceStorageHash(DataEngine.cannedResources.idList[key]);
    return sl;
    */
};

LocalConfiguration.ParseKnowledgeBaseShortList = function(_string){

    if(d(_string) && _string.length)
        return JSON.parse(_string);
    return [];

    /*
    var sl;
    if(d(_string) && _string.length)
    {
        sl = _string.split('_');
    }
    return sl;
    */
};

LocalConfiguration.Reset = function(){
    $('#clear-storage').addClass('ui-disabled');
    lzm_commonStorage.clearLocalStorage();
    KnowledgebaseUI.Synchronize();
};

LocalConfiguration.__OpenTableSettings = function(_tableName){
    LocalConfiguration.__ShowClientSettings(event);
    $('#settings-placeholder-tab-3').click();
    if(_tableName=='tickets')
        $('#table-settings-placeholder-tab-2').click();
    else if(_tableName=='archive')
        $('#table-settings-placeholder-tab-1').click();
    else if(_tableName=='chats')
        $('#table-settings-placeholder-tab-3').click();
};

LocalConfiguration.__ShowClientSettings = function(e,_tab) {
    e.stopPropagation();
    lzm_chatDisplay.settingsDisplay.ShowClientSettings();

    if(d(_tab))
        $('#settings-placeholder-tab-' + _tab).click();
};