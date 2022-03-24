/****************************************************************************************
 * LiveZilla chat.js
 *
 * Copyright 2017 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/
var lzm_commonConfig = {};
var lzm_chatTimeStamp = {};
var lzm_commonTools = {};
var lzm_chatDisplay = {};
var lzm_displayHelper = {};
var lzm_commonDialog = {};
var lzm_commonStorage = {};
var PermissionEngine = {};
var lzm_t = {};
var DataEngine = {};
var CommunicationEngine = {};
var UserActions = {};
var UIRenderer = {};
var loopCounter = 0;
var lzm_chatInputEditor;
var deviceId = 0;
var ticketLineClicked = 0;
var mobile;
var runningInIframe = false;
var cookieCredentialsAreSet = false;
var doBlinkTitle = true;
var blinkTitleMessage = '';
var printWindow = null;
var lastOpListClick = [null, 0];
var lzmMessageReceiver = null;

IFManager.IsMobileOS = isMobile;
IFManager.IsTabletOS = isTablet;
IFManager.IsAppFrame = (app == 1);
IFManager.AppOS = appOs;

if ('serviceWorker' in navigator)
{
    navigator.serviceWorker.register('./sw.js',{scope: './'}).then(function()
    {
        console.log('Service Worker Registered');
        navigator.serviceWorker.addEventListener('message', function(event) {

            //console.log(event);

            var action = event.data.action.split('<||>')[1];

            //console.log(action);
            eval(action);
        });
    });

    window.addEventListener('beforeinstallprompt', function (e) {
        e.preventDefault();
        IFManager.AppInstallPrompt = e;
    });
}

if(!console) {console={}; console.log = function(){};}

if (IFManager.IsAppFrame && (IFManager.AppOS == IFManager.OS_IOS || IFManager.AppOS == IFManager.OS_WINDOWSPHONE))
{
    console.log = function(myString){
        IFManager.IFLog(myString,'log');
    };
    console.info = function(myString) {
        IFManager.IFLog(myString,'info');
    };
    console.warn = function(myString) {
        IFManager.IFLog(myString,'warn');
    };
    console.error = function(myString) {};
}

console.logit = function(obj){
    var tlog = lzm_commonTools.clone(obj);
    if(tlog != null)
        console.log(tlog);
};

console.stack = function(){
    try{
        var err = new Error();
        console.log(err.stack);
    }catch(e){}
};

if (typeof CryptoJS.SHA256 != 'undefined') {
    var sha256 = function(str) {
        str = (typeof str == 'undefined') ? 'undefined' : (str == null) ? 'null' : str.toString();
        return CryptoJS.SHA256(str).toString();
    };
}

if (typeof CryptoJS.SHA1 != 'undefined') {
    var sha1 = function(str) {
        str = (typeof str == 'undefined') ? 'undefined' : (str == null) ? 'null' : str.toString();
        return CryptoJS.SHA1(str).toString();
    };
}

if (typeof CryptoJS.MD5 != 'undefined') {
    var md5 = function(str) {
        str = (typeof str == 'undefined') ? 'undefined' : (str == null) ? 'null' : str.toString();
        return CryptoJS.MD5(str).toString();
    };
}

function debcount(){
    var dc = '';
    var counts = $.find('div').length+$.find('span').length+$.find('p').length+$.find('table').length+$.find('tr').length+$.find('td').length;
    dc+='\nDIV: ' + $.find('div').length.toString();
    dc+='\nSPAN: ' + $.find('span').length.toString();
    dc+='\nP: ' + $.find('p').length.toString();
    dc+='\nTABLE: ' + $.find('table').length.toString();
    dc+='\nTR: ' + $.find('tr').length.toString();
    dc+='\nTD: ' + $.find('td').length.toString();
    dc+='\nTOTAL: ' + counts.toString();
    alert(dc);
}

function logit(myObject, myLevel) {}

function deblog(data){
    try
    {
        if(d(data.stack))
            console.logit(data.stack);
        if(d(data.message))
        {
            console.logit(data.message);
            handleClientError(data.message,'',data.stack);
        }
        else
            console.log(data);
    }
    catch(e)
    {

    }
}

function handleClientError(errorMessage, errorUrl, errorLine){
    console.trace();
    Client.Logs.push(errorMessage + ' | '  + errorUrl  + ' | ' + errorLine);
    lzm_chatDisplay.RenderMainMenuPanel();
}

function LoadModuleConfiguration(type,call){
    if(lzm_chatDisplay[type] != null && call){
        $.globalEval(call);
        return;
    }
    var file = (type.indexOf('Class')==-1) ? type+'Class' : type;
    $.getScript('js/lzm/classes/'+file+'.js', function( data, textStatus, jqxhr ) {
        $.globalEval('lzm_chatDisplay.'+type+' = new '+type+'();');
        if(call)
            $.globalEval(call);
    });
}

function showAppIsSyncing() {
    lzm_displayHelper.blockUi({message: tid('syncing_data')});
}

function getMatchingShortcutEntries(){
    var useSCResource = '';
    if(d(KnowledgebaseUI.ShortCutResources))
        for (var i=0; i<KnowledgebaseUI.ShortCutResources.length; i++)
            if (KnowledgebaseUI.ShortCutResources[i].matchfull)
            {
                useSCResource = KnowledgebaseUI.ShortCutResources[i].id;
                break;
            }
            else if (KnowledgebaseUI.ShortCutResources[i].matchstart)
            {
                useSCResource = KnowledgebaseUI.ShortCutResources[i].id;
            }
    return useSCResource;
}

function chatInputEnterPressed() {

    var useSCResource = getMatchingShortcutEntries();
    var edContent = grabEditorContents();
    if (useSCResource.length)
    {
        var resource = DataEngine.cannedResources.getResource(useSCResource);
        if (resource != null && $.inArray(resource.ty, ['2', '3', '4']) != -1 && ((IFManager.IsAppFrame || IFManager.IsMobileOS) && !IFManager.IsDesktopApp()) && ChatManager.ActiveChat != '')
        {
            sendQrdPreview(useSCResource, ChatManager.ActiveChat);
        }
        else if (resource != null && $.inArray(resource.ty, ['2', '3', '4']) != -1 && ((IFManager.IsAppFrame || IFManager.IsMobileOS) && !IFManager.IsDesktopApp()) && lzm_chatDisplay.selected_view == 'mychats')
        {

        }
        else
            KnowledgebaseUI.UseAutoSearchResult('chat',useSCResource);
    }
    else if (!KnowledgebaseUI.QuickSearchReady && edContent.indexOf('/') == 0)
    {
        if (LocalConfiguration.KBAutoSearch)
        {
            KnowledgebaseUI.QuickSearchReady = false;
            KnowledgebaseUI.ShortCutResources = [];
            KnowledgebaseUI.AutoSearchChat(true);
        }
    }
    else
    {
        KnowledgebaseUI.QuickSearchReady = false;
        var cpId = $('#chat-input-body').data('cp-id');
        SendTranslatedChat(edContent, cpId);
    }
    chatScrollDown(3);
    KnowledgebaseUI.AutoSearchChat(true);
}



function doNothing() {
    // Dummy function that does nothing!
    // Needed for editor events
}

function chatScrollDown(_call){

    var winObj = TaskBarManager.GetActiveWindow();
    if(winObj != null && winObj.TypeId == 'chat-window')
    {
        if(d(winObj.NoAutoScroll) && winObj.NoAutoScroll > 5)
        {
            //$('#chat-progress').scrollTop(winObj.ScrollPos);
            return;
        }
    }
    $('#chat-progress').scrollTop($('#chat-progress')[0].scrollHeight);
}

function chatInputTyping(e) {

    ChatEditorClass.__UpdateChatInputSize();

    if (typeof e != 'undefined' && (typeof e.which == 'undefined' || (e.which != 13 && e.which != 0)) && (typeof e.keyCode == 'undefined' || (e.keyCode != 13 && e.keyCode != 0)))
    {
        if (LocalConfiguration.KBAutoSearch)
        {
            KnowledgebaseUI.QuickSearchReady = false;
            KnowledgebaseUI.ShortCutResources = [];
            setTimeout(function() {
                KnowledgebaseUI.AutoSearchChat(false);
            }, 250);
        }
        CommunicationEngine.typingPollCounter = 0;
        if(CommunicationEngine.typingChatPartner != ChatManager.ActiveChat)
        {
            CommunicationEngine.typingChatPartner = ChatManager.ActiveChat;

            var chatobj = DataEngine.ChatManager.GetChat();

            if(chatobj != null)
            {
                if(d(chatobj.WhisperMode) && chatobj.WhisperMode)
                {
                    CommunicationEngine.typingChatPartner = '';
                    return;
                }

                if(chatobj.Type == Chat.Operator && DataEngine.operators.getOperator(chatobj.SystemId).status != 2)
                {
                    CommunicationEngine.InstantPoll();
                }
                else if(chatobj.Type == Chat.Visitor)
                {
                    CommunicationEngine.InstantPoll();
                }
                else
                    CommunicationEngine.typingChatPartner = '';
            }
        }
    }
    else if (typeof e != 'undefined' && (typeof e.which == 'undefined' || e.which != 0) && (typeof e.keyCode == 'undefined' || e.keyCode != 0))
    {
        var edc = grabEditorContents();
        if(edc.indexOf('/')==-1)
        {
            $('#chat-qrd-preview').css({display:'none'});
            KnowledgebaseUI.ShortCutResources = [];
            KnowledgebaseUI.QuickSearchReady = true;
        }
    }

}

function setAppBackground(isInBackground) {
    if (isInBackground)
    {
        CommunicationEngine.appBackground = 1;
        CommunicationEngine.startPolling();
    }
    else
    {
        CommunicationEngine.appBackground = 0;
        CommunicationEngine.startPolling();
    }
}

function setAppVersion(versionName) {
    lzm_commonConfig.lz_app_version = versionName;
}

function startBackgroundTask() {
    IFManager.IFStartBackgroundTask();
}

function setLocation(latitude, longitude) {
    CommunicationEngine.location = {latitude: latitude, longitude: longitude};
}

function resetWebApp() {

    showAppIsSyncing();
    DataEngine.resetWebApp();
    UserActions.resetWebApp();
    CommunicationEngine.resetWebApp();
    lzm_chatDisplay.resetWebApp();
    lzm_chatDisplay.UpdateViewSelectPanel();
    CommunicationEngine.lastCorrectServerAnswer = lzm_chatTimeStamp.getServerTimeString(null, false, 1);
}

function logout(askBeforeLogout, logoutFromDeviceKey, e) {

    if(d(e))
        e.stopPropagation();

    logoutFromDeviceKey = (typeof logoutFromDeviceKey != 'undefined') ? logoutFromDeviceKey : false;
    lzm_chatDisplay.showUsersettingsHtml = false;
    $('#usersettings-menu').css({'display': 'none'});
    var doLogoutNow = function()
    {
        lzm_commonStorage.saveValue('ticket_max_read_time_' + DataEngine.myId, JSON.stringify(CommunicationEngine.ticketMaxRead));
        lzm_commonStorage.saveValue('ticket_read_array_' + DataEngine.myId, JSON.stringify(lzm_chatDisplay.ticketReadArray));
        lzm_commonStorage.saveValue('ticket_unread_array_' + DataEngine.myId, JSON.stringify(lzm_chatDisplay.ticketUnreadArray));
        lzm_commonStorage.saveValue('ticket_filter_' + DataEngine.myId, JSON.stringify(CommunicationEngine.ticketFilterStatus));
        lzm_commonStorage.saveValue('email_read_array_' + DataEngine.myId, JSON.stringify(lzm_chatDisplay.emailReadArray));
        lzm_commonStorage.saveValue('accepted_chats_' + DataEngine.myId, UserActions.acceptedChatCounter);
        lzm_commonStorage.saveValue('kb_search_categories_' + DataEngine.myId, JSON.stringify(lzm_chatDisplay.resourcesDisplay.KBSearchCategories));
        lzm_commonStorage.saveValue('archive_filter_' + DataEngine.myId, JSON.stringify(CommunicationEngine.chatArchiveFilter));
        lzm_commonStorage.saveValue('first_visible_view_' + DataEngine.myId, JSON.stringify(lzm_chatDisplay.firstVisibleView));
        lzm_commonStorage.saveValue('ticket_filter_personal_' + DataEngine.myId, JSON.stringify(CommunicationEngine.ticketFilterPersonal));
        lzm_commonStorage.saveValue('ticket_filter_group_' + DataEngine.myId, JSON.stringify(CommunicationEngine.ticketFilterGroup));
        lzm_commonStorage.saveValue('show_offline_operators_' + DataEngine.myId, JSON.stringify(lzm_chatDisplay.showOfflineOperators));
        lzm_commonStorage.saveValue('last_phone_protocol_' + DataEngine.myId, JSON.stringify(lzm_chatDisplay.ticketDisplay.lastPhoneProtocol));
        lzm_chatDisplay.askBeforeUnload = false;
        lzm_displayHelper.blockUi({message: t('Signing off...')});
        CommunicationEngine.logout();
        setTimeout(function()
        {
            if (!CommunicationEngine.serverSentLogoutResponse)
                CommunicationEngine.finishLogout();
        }, 5000);
    };
    var showConfirmDialog = function(confirmText) {
        lzm_commonDialog.createAlertDialog(confirmText, [{id: 'ok', name: t('Ok')}, {id: 'cancel', name: t('Cancel')}]);
        $('#alert-btn-ok').click(function() {
            doLogoutNow();
        });
        $('#alert-btn-cancel').click(function() {
            IFManager.ExitApp = false;
            lzm_commonDialog.removeAlertDialog();
        });
    };
    if (askBeforeLogout)
    {
        if (logoutFromDeviceKey)
        {
            if (DataEngine.ChatManager.GetChatsOf(DataEngine.myId,[Chat.Open,Chat.Active]).length == 0)
                showConfirmDialog(t('Do you really want to log out?'));
            else
                showConfirmDialog(t('There are still open chats, do you want to leave them?'));
        }
        else
        {
            if (DataEngine.ChatManager.GetChatsOf(DataEngine.myId,[Chat.Open,Chat.Active]).length != 0)
                showConfirmDialog(t('There are still open chats, do you want to leave them?'));
            else
                doLogoutNow();
        }
    }
    else
        doLogoutNow();
}

function catchEnterButtonPressedMobile(e) {

    var thisChatInput = $('#chat-input');

    if (e.which == 13 || e.keyCode == 13)
    {
        try
        {
            var useSCResource = getMatchingShortcutEntries();
            if (useSCResource != '')
            {
                var resource = DataEngine.cannedResources.getResource(useSCResource);
                if (resource != null && $.inArray(resource.ty, ['2', '3', '4']) != -1 && ((IFManager.IsAppFrame || IFManager.IsMobileOS) && !IFManager.IsDesktopApp()) && ChatManager.ActiveChat != '')
                    sendQrdPreview(useSCResource, ChatManager.ActiveChat);
                else if (resource != null && $.inArray(resource.ty, ['2', '3', '4']) != -1 && ((IFManager.IsAppFrame || IFManager.IsMobileOS) && !IFManager.IsDesktopApp()))
                {

                }
                else
                    KnowledgebaseUI.UseAutoSearchResult('chat',useSCResource);
            }
            else if (thisChatInput.val().indexOf('/') == 0)
            {

            }
            else
            {
                SendTranslatedChat(grabEditorContents());
            }
        }
        catch(ex) {}
        e.preventDefault();
    }
    if (e.which == 10 || e.keyCode == 10)
    {
        var tmp = thisChatInput.val();
        thisChatInput.val(tmp + '\n');
    }
}

function nf(){

}

function d(param){
    return (typeof(param)!='undefined'&&param!='undefined');
}

function t(translateString, placeholderArray) {
    return lzm_t.translate(translateString, placeholderArray);
}

function tid(id, placeholderArray){
    return lzm_t.getById(id, placeholderArray);
}

function tidc(id, suffix){
    suffix = (typeof suffix != 'undefined') ? suffix : ':';

    var x = lzm_t.getById(id);

    if(lzm_commonTools.endsWith(x, suffix))
        return x;
    else
        return x + suffix;
}

function fillStringsFromTranslation() {
    if (loopCounter > 49 || lzm_t.translationArray.length != 0) {
        for (var i=0; i<lzm_chatDisplay.viewSelectArray.length; i++) {
            if (lzm_chatDisplay.viewSelectArray[i].id == 'mychats')
                lzm_chatDisplay.viewSelectArray[i].name = 'Chats';
            if (lzm_chatDisplay.viewSelectArray[i].id == 'tickets')
                lzm_chatDisplay.viewSelectArray[i].name = 'Tickets';
            if (lzm_chatDisplay.viewSelectArray[i].id == 'external')
                lzm_chatDisplay.viewSelectArray[i].name = 'Visitors';
            if (lzm_chatDisplay.viewSelectArray[i].id == 'archive')
                lzm_chatDisplay.viewSelectArray[i].name = 'Chat Archive';
            if (lzm_chatDisplay.viewSelectArray[i].id == 'internal')
                lzm_chatDisplay.viewSelectArray[i].name = 'Operators';
            if (lzm_chatDisplay.viewSelectArray[i].id == 'qrd')
                lzm_chatDisplay.viewSelectArray[i].name = 'Knowledge Base';
            if (lzm_chatDisplay.viewSelectArray[i].id == 'filter')
                lzm_chatDisplay.viewSelectArray[i].name = 'Filter';
        }
    }
    else {
        loopCounter++;
        setTimeout(function() {fillStringsFromTranslation();}, 50);
    }
}

function openLink(url, e) {

    if (typeof e != 'undefined')
    {
        e.preventDefault();
    }
    IFManager.IFOpenExternalBrowser(url);
}

function openSystemLink(_path, e) {

    var sysurl = CommunicationEngine.chosenProfile.server_protocol + CommunicationEngine.chosenProfile.server_url;

    if(!sysurl.endsWith('/'))
        sysurl += '/';

    sysurl += _path;

    openLink(sysurl,e);
}

function downloadFile(address) {

    IFManager.IFOpenExternalBrowser(address);
}

function tryNewLogin(logoutOtherInstance) {
    CommunicationEngine.stopPolling();
    CommunicationEngine.pollServerlogin(CommunicationEngine.chosenProfile.server_protocol,CommunicationEngine.chosenProfile.server_url, logoutOtherInstance);
}

function blinkPageTitle(message) {
    doBlinkTitle = true;
    blinkTitleMessage = message;
}

function getCredentials() {
    /*var cookieName = 'lzm-credentials';
    var cookieValue = document.cookie;
    var cookieStart = (cookieValue.indexOf(" " + cookieName + "=") != -1) ? cookieValue.indexOf(" " + cookieName + "=") : cookieValue.indexOf(cookieName + "=");
    var cookieEnd = 0;




    if (cookieStart == -1)
    {
        cookieValue = {'login_name': '', 'login_passwd': ''};
    }
    else
    {
        cookieStart = cookieValue.indexOf("=", cookieStart) + 1;
        cookieEnd = (cookieValue.indexOf(";", cookieStart) != -1) ? cookieValue.indexOf(";", cookieStart) : cookieValue.length;
        cookieValue = cookieValue.substring(cookieStart,cookieEnd);
        if (cookieValue.indexOf('%7E') != -1)
        {
            cookieCredentialsAreSet = (lz_global_base64_url_decode(cookieValue.split('%7E')[0]) != '' && cookieValue.split('%7E')[1] != '');
            cookieValue = {
                'login_name': lz_global_base64_url_decode(cookieValue.split('%7E')[0]),
                'login_passwd': cookieValue.split('%7E')[1]
            };
        }
        else
        {*/
            var ln = '', lp = '';
            if (typeof chosenProfile.lzmvcode != 'undefined' && chosenProfile.lzmvcode != '')
            {
                cookieCredentialsAreSet = true;
                ln = lz_global_base64_url_decode(lz_global_base64_url_decode(chosenProfile.lzmvcode).split('~')[0]);
                lp = lz_global_base64_url_decode(chosenProfile.lzmvcode).split('~')[1];
            }
            cookieValue = {'login_name': ln, 'login_passwd': lp};
      //  }
    //}

    chosenProfile.login_name = cookieValue.login_name;
    chosenProfile.login_passwd = cookieValue.login_passwd;

    // Call this twice for some unknown reason...
    //deleteCredentials();
    //deleteCredentials();
}

function handleContextMenuClick(e) {
    e.stopPropagation();
}

function showNotMobileMessage() {
    var alertText =  t('This functionality is not available on mobile devices.');
    lzm_commonDialog.createAlertDialog(alertText, [{id: 'ok', name: t('Ok')}]);

    $('#alert-btn-ok').click(function() {
        lzm_commonDialog.removeAlertDialog();
    });
}

function showNoPermissionMessage(_permissionKey) {

    var alertText = tid('no_permission');

    if(d(_permissionKey))
        alertText += '<br><br>' + _permissionKey;

    showMessage(alertText);
}

function showMessage(_text){
    lzm_commonDialog.removeAlertDialog();
    lzm_commonDialog.createAlertDialog(_text, [{id: 'ok', name: t('Ok')}]);
    $('#alert-btn-ok').click(function() {
        lzm_commonDialog.removeAlertDialog();
    });
}

function showNoAdministratorMessage() {

    showNoPermissionMessage();

}

function showOutsideOpeningMessage(groupName) {
    var alertText = (typeof groupName == 'undefined' || groupName == '') ? t('This action cannot be performed outside of opening hours.') :
        t('<!--group_name--> is outside of opening hours. Please select another group.', [['<!--group_name-->', groupName]]);
    lzm_commonDialog.createAlertDialog(alertText, [{id: 'ok', name: t('Ok')}]);
    $('#alert-btn-ok').click(function() {
        lzm_commonDialog.removeAlertDialog();
    });
}

function capitalize(myString) {
    myString = myString.replace(/^./, function(char) {
        return char.toUpperCase();
    });
    return myString;
}

function addQrd(type) {
    type = (d(type)) ? type : 1;
    var resource = DataEngine.cannedResources.getResource(lzm_chatDisplay.selectedResource);
    if (resource != null)
        if (!PermissionEngine.checkUserResourceWritePermissions(lzm_chatDisplay.myId, 'add', resource))
        {
            showNoPermissionMessage();
            return;
        }

    UserActions.addQrd(type);
    removeKBContextMenu();
}

function editQrd() {
    removeKBContextMenu();
    var resource = DataEngine.cannedResources.getResource(lzm_chatDisplay.selectedResource);
    if (resource != null)
    {
        if (PermissionEngine.checkUserPermissions('', 'resources', 'edit', resource))
        {
            UserActions.editQrd(resource);
        }
        else
            showNoPermissionMessage();
    }
}

function getQrdDownloadUrl(resource) {
    //var downloadUrl = DataEngine.serverProtocol + DataEngine.serverUrl.replace(':80/','/').replace(':443/','/') + '/getfile.php?';

    var downloadUrl = DataEngine.getServerUrl('getfile.php?',DataEngine.serverProtocol);
    downloadUrl += 'a=' + lzm_commonTools.pad(Math.floor(Math.random() * 1048575).toString(16), 5) + '&file=' + encodeURI(resource.ti) + '&id=' + encodeURI(resource.rid);
    return downloadUrl;
}

function cancelQrd(_closeToTicket,_closeToChat) {

    /*
    cancelQrdPreview(0);
    TaskBarManager.RemoveActiveWindow();
    var winObj;
    if (d(_closeToTicket) && _closeToTicket != '')
    {
        var dialogId = _closeToTicket;

        // reply composer
        if(!dialogId.endsWith('_reply'))
            winObj = TaskBarManager.GetWindow(dialogId + '_reply');

        // create new ticket
        if(winObj == null)
            winObj = TaskBarManager.GetWindow(dialogId);

        if(winObj != null)
            winObj.Maximize();
    }
    else if(d(_closeToChat) && _closeToChat != '')
    {
        winObj = TaskBarManager.GetWindowByTag(_closeToChat);
        if(winObj != null)
            winObj.Maximize();
    }

    ChatTicketClass.InsertPlaceholder = '';
    */
}

function cancelQrdPreview() {
    $('#qrd-preview-container').remove();
}

function sendQrdPreview(_resourceId, _chatPartner) {

    lzm_chatDisplay.RemoveAllContextMenus();

    _resourceId = (d(_resourceId) && _resourceId != '') ? _resourceId : lzm_chatDisplay.selectedResource;
    //_chatPartner = (d(_chatPartner) && _chatPartner != '') ? _chatPartner : TaskBarManager.GetActiveWindow().Tag;

    var linkHtml,resourceHtmlText;
    var resource = DataEngine.cannedResources.getResource(_resourceId);
    if (resource != null)
    {
        UserActions.messageFromKnowledgebase = true;
        DataEngine.cannedResources.riseUsageCounter(_resourceId);
        switch (resource.ty)
        {
            case '1':
                resourceHtmlText = resource.text;
                break;
            case '2':
                if (resource.text.indexOf('mailto:') == 0)
                {
                    linkHtml = '<a href="' + resource.text + '" class="lz_chat_mail" target="_blank">' + resource.ti + '</a>';
                }
                else
                {
                    linkHtml = '<a href="' + resource.text + '" class="lz_chat_link" target="_blank">' + resource.ti + '</a>';
                }
                resourceHtmlText = linkHtml;
                break;
            default:
                var urlFileName = encodeURIComponent(resource.ti.replace(/ /g, '+'));
                var acid = lzm_commonTools.pad(Math.floor(Math.random() * 1048575).toString(16), 5);
                var fileId = resource.text.split('_')[1];
                var thisServer = CommunicationEngine.chosenProfile.server_protocol + CommunicationEngine.chosenProfile.server_url;
                var fileHtml = '<a href="' + thisServer + '/getfile.php?';

                fileHtml += 'acid=' + acid +
                    '&file=' + urlFileName +
                    '&id=' + fileId + '" ' +
                    'class="lz_chat_file" target="_blank">' + resource.ti + '</a>';
                resourceHtmlText = fileHtml;
                break;
        }

        var chatText = ChatManager.LoadEditorInput(_chatPartner);

        chatText = (chatText != '') ? '<div>' + chatText + '</div>' : chatText;
        ChatManager.SaveEditorInput(_chatPartner, chatText + resourceHtmlText);

        var winObj = TaskBarManager.GetWindowByTag(_chatPartner);
        if(winObj != null)
        {
            winObj.Maximize();



        }

    }
}

function changeFile(file) {
    var maxFileSize = DataEngine.global_configuration.php_cfg_vars.upload_max_filesize;

    if(!d(file))
        file = $('#file-upload-input')[0].files[0];

    KnowledgebaseUI.FileToUpload = file;

    if(!file)
    {
        $('#file-upload-name').html('');
        $('#file-upload-size').html('');
        $('#file-upload-progress').css({display: 'none'});
        $('#file-upload-numeric').html('');
        $('#file-upload-error').html('');
        $('#cancel-file-upload-div').css({display: 'none'});
        return;
    }

    var thisUnit = (file.size <= 10000) ? 'B' : (file.size <= 1024000) ? 'KB' : 'MB';
    var thisFileSize = (file.size <= 10000) ? file.size : (file.size <= 1024000) ? file.size / 1024 : file.size / 1048576;
    thisFileSize = Math.round(thisFileSize * 10) / 10;

    $('#file-upload-name').html(file.name);
    $('#file-upload-size').html(thisFileSize + ' ' + thisUnit);
    $('#file-upload-progress').css({display: 'none'});
    $('#file-upload-numeric').html('0%');
    $('#file-upload-error').html('');
    $('#cancel-file-upload-div').css({display: 'block'});

    if (file.size > maxFileSize)
    {
        $('#file-upload-input').val('');
        $('#file-upload-error').html(tid('file_too_large'));
        $('#save-new-qrd').addClass('ui-disabled');
    }
    else
        $('#save-new-qrd').removeClass('ui-disabled');
}

function uploadFile(fileType, parentId, rank, _ticketReplyWindowId, sendToChat, _sendToChatWindowId) {

    sendToChat = (typeof sendToChat != 'undefined') ? sendToChat : null;

    $('#file-upload-input').prop('disabled',true);
    var file = KnowledgebaseUI.FileToUpload;
    if (typeof file != 'undefined')
    {
        $('#save-new-qrd').addClass('ui-disabled');
        $('#cancel-new-qrd').addClass('ui-disabled');
        $('#file-upload-progress').css({display: 'block'});
        $('#cancel-file-upload').css({display: 'inline'});

        CommunicationEngine.uploadFile(file, fileType, parentId, rank, _ticketReplyWindowId, sendToChat, null, null, _sendToChatWindowId);
    }
    else
        $('#cancel-new-qrd').click();
}

function cancelFileUpload(e) {

    e.stopPropagation();
    CommunicationEngine.fileUploadClient.abort();
    $('#cancel-file-upload').css({display: 'none'});
    setTimeout(function(){
        $('#file-upload-input').prop('disabled',false);
    },500);
}

function removeKBContextMenu() {
    $('#qrd-tree-context').remove();
}

function addLinkToChat(){
    removeVisitorChatActionContextMenu();
    lzm_chatInputEditor.addLink();
}

function chatInternalWith(id) {

    if(DataEngine.myId == id)
        return;

    var op = DataEngine.operators.getOperator(id);
    if(op!=null && op.isbot)
        return;

    var group = DataEngine.groups.getGroup(id);
    var i = 0, myAction = 'chat', meIsInGroup = false;
    if (group != null && d(group.members))
    {
        for (i=0; i<group.members.length; i++)
            if (group.members[i].i == DataEngine.myId)
                meIsInGroup = true;

        if (meIsInGroup)
            myAction = 'chat';
        else if (PermissionEngine.checkUserPermissions(DataEngine.myId, 'group', '', group))
            myAction = 'join';
        else
            myAction = 'no_perm';
    }
    else if(group != null)
        if($.inArray(group.id, DataEngine.operators.getOperator(DataEngine.myId).groups) == -1)
            myAction = 'no_perm';

    if (myAction == 'no_perm')
        showNoPermissionMessage();
    else
    {
        try
        {
            group = DataEngine.groups.getGroup(id);

            var chatObj = DataEngine.ChatManager.AddInternalChat(id,(group != null || id == 'everyoneintern') ? Chat.ChatGroup : Chat.Operator);

            if(ChatManager.ActiveChat != id)
            {
                ChatManager.SetActiveChat(id);
                var loadedValue = ChatManager.LoadEditorInput();
                initEditor(loadedValue, 'chatInternalWith', id);
                lzm_chatDisplay.RenderChatInternal();
                lzm_chatDisplay.removeSoundPlayed(id);
            }

            chatObj.OpenChatWindow(true);

            TaskBarManager.GetWindowByTag(id).Maximize();

            if (myAction == 'join')
                UserActions.SaveChatGroup('add', group.id, '', DataEngine.myId, {});
        }
        catch(e)
        {
            deblog(e);
        }
    }
}

function selectOperatorForForwarding(_chatObj, forward_id, forward_name, forward_group, forward_text, chat_no) {
    UserActions.selectOperatorForForwarding(_chatObj, forward_id, forward_name, forward_group,forward_text, chat_no);
}

function showTranslateOptions(visitorChat, language){

    if (DataEngine.otrs != '' && DataEngine.otrs != null)
    {
        ChatManager.SaveEditorInput();
        lzm_chatDisplay.VisitorsUI.showTranslateOptions(visitorChat, language);
    }
    else
    {
        var noGTranslateKeyWarning1 = t('LiveZilla can translate your conversations in real time. This is based upon Google Translate.');
        var noGTranslateKeyWarning2 = t('To use this functionality, you have to add a Google API key.');
        var noGTranslateKeyWarning3 = t('For further information, see LiveZilla Server Admin -> LiveZilla Server Configuration.');
        var noGTranslateKeyWarning = t('<!--phrase1--><br /><br /><!--phrase2--><br /><!--phrase3-->',
            [['<!--phrase1-->', noGTranslateKeyWarning1], ['<!--phrase2-->', noGTranslateKeyWarning2], ['<!--phrase3-->', noGTranslateKeyWarning3]]);
        lzm_commonDialog.createAlertDialog(noGTranslateKeyWarning, [{id: 'ok', name: t('Ok')}]);
        $('#alert-btn-ok').click(function() {
            lzm_commonDialog.removeAlertDialog();
        });
    }
}

function SendTranslatedChat(chatMessage, _activeChatId) {

    //ChatEditorClass.ExpandChatInputOffset = 0;

    chatMessage = (typeof chatMessage != 'undefined') ? chatMessage : grabEditorContents();
    _activeChatId = (typeof _activeChatId != 'undefined' && _activeChatId != '') ? _activeChatId : (typeof ChatManager.ActiveChat != 'undefined' && ChatManager.ActiveChat != '') ? ChatManager.ActiveChat : ChatManager.LastActiveChat;

    var chatObj = DataEngine.ChatManager.GetChat(_activeChatId);
    var chatFullId = chatObj.GetFullId();

    if (DataEngine.otrs != '' &&
        DataEngine.otrs != null &&
        d(lzm_chatDisplay.chatTranslations[chatFullId]) &&
        lzm_chatDisplay.chatTranslations[chatFullId].tmm != null &&
        lzm_chatDisplay.chatTranslations[chatFullId].tmm.translate &&
        lzm_chatDisplay.chatTranslations[chatFullId].tmm.sourceLanguage != lzm_chatDisplay.chatTranslations[chatFullId].tmm.targetLanguage) {
        UserActions.TranslateTextAndSend(chatFullId, chatMessage, _activeChatId);
    }
    else
        SendChat(chatMessage, _activeChatId);
}

function SendChat(chatMessage, activeChatId, translatedChatMessage, _keepInputs) {

    translatedChatMessage = (d(translatedChatMessage)) ? translatedChatMessage : '';
    _keepInputs = (d(_keepInputs)) ? _keepInputs : false;

    var chatobj = DataEngine.ChatManager.GetChat(activeChatId);
    if (chatobj != null)
    {
        if(!_keepInputs)
            ChatManager.SaveEditorInput(activeChatId, null);

        chatobj.SetUnread(false);

        chatMessage = (typeof chatMessage != 'undefined' && chatMessage != '') ? chatMessage : grabEditorContents();
        if (chatMessage != '' && chatMessage!='<br>')
        {
            if(chatMessage.indexOf('/')===0 && chatMessage.length > 1)
                return;

            CommunicationEngine.typingChatPartner = '';

            var whisper = d(chatobj.WhisperMode) && chatobj.WhisperMode;

            var new_chat = {};
            new_chat.id = md5(String(Math.random())).substr(0, 32);
            new_chat.rp = '';
            new_chat.sen = DataEngine.myId;
            new_chat.rec = '';
            new_chat.reco = activeChatId;
            new_chat.w = whisper;

            var tmpdate = lzm_chatTimeStamp.getLocalTimeObject();
            new_chat.date = lzm_chatTimeStamp.getServerTimeString(tmpdate, true);
            new_chat.date_human = lzm_commonTools.getHumanDate(tmpdate, 'date', lzm_chatDisplay.userLanguage);
            new_chat.time_human = lzm_commonTools.getHumanDate(tmpdate, 'time', lzm_chatDisplay.userLanguage);
            var chatText = chatMessage.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n/g, "<br />");

            if(!UserActions.messageFromKnowledgebase || chatText.indexOf('<a')==-1)
            {
                chatText = chatText.replace(/<script/g,'&lt;script').replace(/<\/script/g,'&lt;/script');
                chatText = lzm_commonTools.URLToHTML(chatText);
            }

            new_chat.text = lzm_commonTools.ReplaceCommonPlaceholders(activeChatId, chatText);
            if (translatedChatMessage != '')
            {
                var translatedText = translatedChatMessage.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n/g, "<br />");
                translatedText = translatedText.replace(/<script/g,'&lt;script').replace(/<\/script/g,'&lt;/script');
                translatedText = lzm_commonTools.URLToHTML(translatedText);
                new_chat.tr = translatedText;
            }

            if (activeChatId == ChatManager.ActiveChat && !_keepInputs)
                clearEditorContents('', lzm_chatDisplay.browserName, 'send');

            chatobj.AddMessage(new_chat);
            UserActions.sendChatMessage(new_chat, translatedChatMessage, chatobj.GetFullId());

            if (activeChatId == ChatManager.ActiveChat)
            {
                lzm_chatDisplay.RenderChatHistory();
                lzm_chatDisplay.UpdateViewSelectPanel();
                lzm_chatDisplay.RenderWindowLayout(true);
                CommonUIClass.UpdateWhisperModeUI();
            }
        }

    }
}

function showAllchatsList(userAction){

    userAction = (typeof userAction != 'undefined') ? userAction : false;
    if (userAction)
    {
        $('#chat-allchats').css({'display': 'block'});
    }
    else if (lzm_chatDisplay.selected_view == 'mychats')
        $('#chat-allchats').css({'display': 'block'});

    lzm_chatDisplay.ChatsUI.UpdateChatList();
}

function switchObserverMode(){
    lzm_chatDisplay.ChatsUI.ObserverMode = !lzm_chatDisplay.ChatsUI.ObserverMode;
    lzm_commonStorage.saveValue('observer_mode_' + DataEngine.myId,(lzm_chatDisplay.ChatsUI.ObserverMode) ? 1 : 0);

    if(lzm_chatDisplay.ChatsUI.ObserverMode)
        $('#allchats-observer-mode').addClass('lzm-button-b-pushed');
    else
        $('#allchats-observer-mode').removeClass('lzm-button-b-pushed');

    UIRenderer.resizeAllChats();
}

function openChatLineContextMenu(_chatId,_place,e) {

    if('chat-allchats'==_place)
    {
        if($('#all-chats-group-'+_chatId).length)
            ChatUI.__TreeClick('all-chats-group-'+_chatId);
        else
            ChatUI.__RowClick(this,_chatId);
    }

    var scrolledDownY, scrolledDownX, parentOffset;
    scrolledDownY = $('#' + _place).scrollTop();
    scrolledDownX = $('#' + _place).scrollLeft();
    parentOffset = $('#' + _place).offset();

    var xValue = e.pageX - parentOffset.left + scrolledDownX;
    var yValue = e.pageY - parentOffset.top + scrolledDownY;

    _chatId = _chatId.replace('-my','');

    var chat = DataEngine.ChatManager.GetChat(_chatId,'i');

    if(chat==null)
    {
        chat = new Chat();
        chat.SystemId = _chatId;
        chat.Type = Chat.ChatGroup;
    }

    if(lzm_chatDisplay.showContextMenu(_place, chat, xValue, yValue))
    {
        e.stopPropagation();
        e.preventDefault();
        return false;
    }
    return true;
}

function removeChatLineContextMenu() {
    $('#chat-allchats-context').remove();
    $('#task-bar-panel-context').remove();
}

function addJoinedMessageToChat(activeChatId, visitorName, groupName) {

    groupName = (typeof groupName != 'undefined') ? groupName : '';
    var chatText = (groupName != '') ? t('<!--vis_name--> joins <!--group_name-->.',[['<!--vis_name-->', visitorName], ['<!--group_name-->', groupName]]) : t('<!--vis_name--> joins the chat.',[['<!--vis_name-->', visitorName]]);
    var new_chat = {};
    new_chat.id = md5(String(Math.random())).substr(0, 32);
    new_chat.rp = '';
    new_chat.sen = '0000000';
    new_chat.rec = '';
    new_chat.reco = activeChatId;
    var tmpdate = lzm_chatTimeStamp.getLocalTimeObject();
    new_chat.date = lzm_chatTimeStamp.getServerTimeString(tmpdate, true);
    new_chat.date_human = lzm_commonTools.getHumanDate(tmpdate, 'date', lzm_chatDisplay.userLanguage);
    new_chat.time_human = lzm_commonTools.getHumanDate(tmpdate, 'time', lzm_chatDisplay.userLanguage);
    new_chat.text = chatText;
    DataEngine.ChatManager.GetChat(activeChatId).AddMessage(new_chat);
}

function addLeftMessageToChat(_chatObj, visitorName, groupName) {
    groupName = (typeof groupName != 'undefined') ? groupName : '';
    var chatText = (groupName != '') ? t('<!--vis_name--> has left <!--group_name-->.',[['<!--vis_name-->', visitorName], ['<!--group_name-->', groupName]]) : tid('visitor_left',[['<!--vis_name-->', visitorName]]);
    var new_chat = {};
    new_chat.id = md5(String(Math.random())).substr(0, 32);
    new_chat.rp = '';
    new_chat.sen = '0000000';
    new_chat.rec = '';
    new_chat.reco = _chatObj.SystemId;

    var tmpdate = lzm_chatTimeStamp.getLocalTimeObject();
    new_chat.date = lzm_chatTimeStamp.getServerTimeString(tmpdate, true);
    new_chat.date_human = lzm_commonTools.getHumanDate(tmpdate, 'date', lzm_chatDisplay.userLanguage);
    new_chat.time_human = lzm_commonTools.getHumanDate(tmpdate, 'time', lzm_chatDisplay.userLanguage);
    new_chat.text = chatText;

    var openTab = _chatObj.IsMember(lzm_chatDisplay.myId); // 7.0.8.9

    _chatObj.AddMessage(new_chat,openTab);
}

function addOperatorLeftMessageToChat(_chatObj, membersLeft) {
    var i,goneMessages = [];
    for (i=0; i<membersLeft.length; i++)
    {
        if(membersLeft[i] != null)
        {
            //if(membersLeft[i].s == 2)
              //  continue;

            var operator = DataEngine.operators.getOperator(membersLeft[i].i);
            if (operator != null)
            {
                var new_chat = {};
                new_chat.id = md5(String(Math.random())).substr(0, 32);
                new_chat.rp = '';
                new_chat.sen = '0000000';
                new_chat.rec = '';
                new_chat.reco = _chatObj.SystemId;

                var tmpdate = lzm_chatTimeStamp.getLocalTimeObject();
                new_chat.date = lzm_chatTimeStamp.getServerTimeString(tmpdate, true);
                new_chat.date_human = lzm_commonTools.getHumanDate(tmpdate, 'date', lzm_chatDisplay.userLanguage);
                new_chat.time_human = lzm_commonTools.getHumanDate(tmpdate, 'time', lzm_chatDisplay.userLanguage);
                new_chat.text = tid('op_has_left').replace('<!--this_op_name-->', operator.name);
                goneMessages.push(new_chat);
            }
        }
    }

    if(goneMessages.length < 3)
        for (i=0; i<goneMessages.length; i++)
            _chatObj.AddMessage(goneMessages[i],false);
}

function addAcceptedMessageToChat(_chat){

    var tmpdate = lzm_chatTimeStamp.getLocalTimeObject();
    if(_chat != null && _chat.Members.length)
    {
        var host = _chat.Members[0];
        var operator = DataEngine.operators.getOperator(host.i);
        var opName = (operator != null) ? operator.name : t('Another operator');
        var new_chat = {};
        new_chat.id = md5(String(Math.random())).substr(0, 32);
        new_chat.rp = '';
        new_chat.sen = '0000000';
        new_chat.rec = '';
        new_chat.reco = chat;
        new_chat.date = lzm_chatTimeStamp.getServerTimeString(tmpdate, true);
        new_chat.date_human = lzm_commonTools.getHumanDate(tmpdate, 'date', lzm_chatDisplay.userLanguage);
        new_chat.time_human = lzm_commonTools.getHumanDate(tmpdate, 'time', lzm_chatDisplay.userLanguage);
        new_chat.text = t('<!--this_op_name--> has accepted the chat.', [['<!--this_op_name-->',opName]]);

        var closeTab = lzm_chatDisplay.myId != host.i && ChatManager.ActiveChat != _chat.SystemId; // 7.0.8.9

        _chat.AddMessage(new_chat, !closeTab);

        if(closeTab)
        {
            var window = TaskBarManager.GetWindowByTag(_chat.SystemId);
            if(window != null)
                window.Close();
        }
    }
}

function addOperatorJoinedMessageToChat(_chatObj, newMembers) {
    for (var i=0; i<newMembers.length; i++)
    {
        var mem = _chatObj.GetMember(newMembers[i]);

        //if(mem != null /*&& mem.s == 2*/ && newMembers[i] != lzm_chatDisplay.myId)
          //  continue;

        var operator = DataEngine.operators.getOperator(newMembers[i]);
        if (operator != null)
        {
            var new_chat = {};
            new_chat.id = md5(String(Math.random())).substr(0, 32);
            new_chat.rp = '';
            new_chat.sen = '0000000';
            new_chat.rec = '';
            new_chat.reco = _chatObj.SystemId;

            var tmpdate = lzm_chatTimeStamp.getLocalTimeObject();
            new_chat.date = lzm_chatTimeStamp.getServerTimeString(tmpdate, true);
            new_chat.date_human = lzm_commonTools.getHumanDate(tmpdate, 'date', lzm_chatDisplay.userLanguage);
            new_chat.time_human = lzm_commonTools.getHumanDate(tmpdate, 'time', lzm_chatDisplay.userLanguage);
            new_chat.text = tid('op_joined_chat').replace('<!--this_op_name-->',operator.name);
            _chatObj.AddMessage(new_chat);
        }
    }
}

function addChatInfoBlock(_chat,_openTab) {

    if (_chat.Visitor != null)
    {
        var tmpDate = lzm_chatTimeStamp.getLocalTimeObject(_chat.f * 1000, true);
        var tUoperators='',operators = DataEngine.operators.getOperatorList();
        for (var i=0; i<operators.length; i++)
            if (_chat.IsMember(operators[i].id) && !_chat.IsHiddenMember(operators[i].id))
                tUoperators +=  operators[i].name + ', ';

        tUoperators = tUoperators.replace(/, *$/,'');
        var name = DataEngine.inputList.getInputValueFromVisitor(111,_chat.Visitor);
        var chatUrl = '';
        try
        {
            if(_chat.Browser != null)
            {
                var bobj = _chat.Browser;
                if(d(bobj) && d(bobj.h2))
                {

                    chatUrl = (bobj.h2.length > 0 && bobj.h2[bobj.h2.length - 1].url != '') ? bobj.h2[bobj.h2.length - 1].url : '';

                    if (bobj.h2.length == 0)
                    {
                        var lastOpened = 0;
                        for (var k=0; k<_chat.Browser[0].b.length; k++)
                        {
                            if (_chat.Browser[0].b[k].h2.length > 0 && _chat.Browser[0].b[k].h2[_chat.Browser[0].b[k].h2.length - 1].time > lastOpened && _chat.Browser[0].b[k].chat.id == '') {
                                chatUrl = (_chat.Browser[0].b[k].h2[_chat.Browser[0].b[k].h2.length - 1].url != '') ? _chat.Browser[0].b[k].h2[_chat.Browser[0].b[k].h2.length - 1].url : '';
                                lastOpened = _chat.Browser[0].b[k].h2[_chat.Browser[0].b[k].h2.length - 1].time;
                            }
                        }
                    }
                }
            }
        }
        catch (ex)
        {
            deblog(ex);
        }
        var new_chat = {
            date: _chat.f-5,
            m: 0,
            cmc: 0,
            id : md5(String(Math.random())).substr(0, 32),
            rec: _chat.v + '~' + _chat.b,
            reco: DataEngine.myId,
            rp: '0',
            sen: _chat.v + '~' + _chat.b,
            sen_id: _chat.v,
            sen_b_id: _chat.b,
            text: '',
            date_human: lzm_commonTools.getHumanDate(tmpDate, 'date', lzm_chatDisplay.userLanguage),
            time_human: lzm_commonTools.getHumanDate(tmpDate, 'time', lzm_chatDisplay.userLanguage),
            info_header: {
                group: _chat.dcg,
                operators: tUoperators,
                name: name,
                mail: DataEngine.inputList.getInputValueFromVisitor(112,_chat.Visitor),
                company: DataEngine.inputList.getInputValueFromVisitor(113,_chat.Visitor),
                phone: DataEngine.inputList.getInputValueFromVisitor(116,_chat.Visitor),
                question: _chat.s,
                chat_id: _chat.i,
                url: chatUrl
            }
        };

        _chat.AddMessage(new_chat,_openTab);
    }
}

function isAutoAcceptActive () {
    return (PermissionEngine.checkUserPermissions(lzm_chatDisplay.myId, 'chats', 'must_auto_accept', {}) ||
        (PermissionEngine.checkUserPermissions(lzm_chatDisplay.myId, 'chats', 'can_auto_accept', {}) && LocalConfiguration.ChatAutoAccept));
}

function openChatFromNotification(_chatPartner, type) {

    type = (typeof type != 'undefined') ? type : '';
    if (typeof _chatPartner != 'undefined' && _chatPartner != '')
    {
        lzm_chatDisplay.lastChatSendingNotification = _chatPartner;
    }
    if (lzm_chatDisplay.lastChatSendingNotification != '')
    {
        var winObj = TaskBarManager.GetWindowByTag(_chatPartner);
        if(winObj != null)
            winObj.Maximize();
    }
    if (type == 'push')
        showAppIsSyncing();
}

function AcceptChat(_systemId){
    var _chatObj = DataEngine.ChatManager.GetChat(_systemId);
    UserActions.AcceptChat(_chatObj,true);
    OpenChatWindow(_systemId);
}

function declineChat(id, b_id, chat_id){
    UserActions.declineChat(id, b_id, chat_id);
}

function OpenChatWindow(_systemId){

    ChatEditorClass.ExpandChatInputOffset = (!IFManager.IsMobileOS) ? 50 : 0;

    var isOpened = false;
    if(ChatManager.ActiveChat == _systemId)
    {
        isOpened = true;
    }

    var chat = DataEngine.ChatManager.GetChat(_systemId);
    if(chat != null && chat.Type == Chat.Visitor)
    {
        var cg = chat.GetChatGroup();
        if(cg != null)
        {
            OpenChatWindow(cg.id);
            return;
        }
        UserActions.ShowVisitorChat(chat, isOpened);
    }
    else
    {
        var operator = DataEngine.operators.getOperator(_systemId);
        var group = DataEngine.groups.getGroup(_systemId);

        if(operator != null || group != null || 'everyoneintern' == _systemId)
            chatInternalWith(_systemId);
    }
    lzm_chatDisplay.RenderChatHistory();

    CommonUIClass.UpdateWhisperModeUI();

    if(IFManager.IsDesktopApp())
    {
        IFManager.IFRemoveAllNotifications(0);
        IFManager.IFRemoveAllNotifications(1);
    }
}

function leaveChat(_chatId) {

    _chatId = (d(_chatId)) ? _chatId : null;

    var ___confirm = function(_func){

        lzm_commonDialog.createAlertDialog(tid('close_confirm'), [{id: 'ok', name: tid('ok')}, {id: 'cancel', name: tid('cancel')}]);
        $('#alert-btn-ok').click(function()
        {
            _func();
            $('#alert-btn-cancel').click();
        });
        $('#alert-btn-cancel').click(function()
        {
            lzm_commonDialog.removeAlertDialog();
        });
    };

    var activeChatObj = (_chatId!=null) ? DataEngine.ChatManager.GetChat(_chatId,'i') : DataEngine.ChatManager.GetChat();
    if (activeChatObj != null)
    {
        var chatServerAccepted = activeChatObj.IsAccepted();
        var chatLocalAccepted = activeChatObj.IsAccepted();
        var chatDeclined = activeChatObj.IsDeclined();
        var lastOperator = activeChatObj.GetOperatorsLeft().length==1;
        var iHost = activeChatObj.IsHost(DataEngine.myId);
        var chatHasEnded = activeChatObj.GetStatus() != Chat.Closed;
        var closeOrLeave = ((iHost && lastOperator) || chatDeclined) ? 'close' : 'leave';

        if(!chatLocalAccepted && !chatServerAccepted && !chatHasEnded && !chatDeclined)
        {
            ___confirm(function(){UserActions.declineChat(activeChatObj.v, activeChatObj.b, activeChatObj.i);});
        }
        else if (chatDeclined)
        {

        }
        else if (chatHasEnded || !iHost || !lastOperator)
        {
            ___confirm(function(){UserActions.leaveExternalChat(activeChatObj.v, activeChatObj.b, activeChatObj.i, 0, closeOrLeave);});
        }
        else
        {
            ___confirm(function(){UserActions.leaveExternalChat(activeChatObj.v, activeChatObj.b, activeChatObj.i, 0, closeOrLeave);});
        }
    }
}

function closeChat(chatId, visitorId, browserId, avoidReAppearanceOnClose){
    this.CommunicationEngine.stopPolling();
    this.CommunicationEngine.addToOutboundQueue('p_ca_0_va', visitorId, 'nonumber');
    this.CommunicationEngine.addToOutboundQueue('p_ca_0_vb', browserId, 'nonumber');
    this.CommunicationEngine.addToOutboundQueue('p_ca_0_vc', chatId, 'nonumber');
    this.CommunicationEngine.addToOutboundQueue('p_ca_0_vd', 'CloseChat', 'nonumber');
    this.CommunicationEngine.pollServer(this.CommunicationEngine.fillDataObject(), 'shout');
    if(avoidReAppearanceOnClose)
        lzm_chatDisplay.hiddenChats[chatId] = chatId;
}

function takeChat(visitorId, browserId, chatId, groupId, askBeforeTake) {

    askBeforeTake = true;

    var mayTake = PermissionEngine.checkUserPermissions(lzm_chatDisplay.myId, 'chats', 'take_over', null),taken=false;
    askBeforeTake = (typeof askBeforeTake != 'undefined') ? askBeforeTake : false;
    removeChatLineContextMenu();

    var chatObj = DataEngine.ChatManager.GetChat(chatId,'i');
    var isBotChat = chatObj.IsBotChat();
    var member = chatObj.GetMember(DataEngine.myId);
    var hasDeclined = member != null && member.d=='1';

    if (member != null && !hasDeclined)
    {
        OpenChatWindow(chatObj.SystemId);
    }
    else
    {
        var activate = false;
        if (!mayTake)
            showNoPermissionMessage();
        else if (chatObj.GetStatus() != Chat.Active || isBotChat)
        {
            groupId = ($.inArray(groupId, lzm_chatDisplay.myGroups) != -1) ? groupId : lzm_chatDisplay.myGroups[0];

            if (askBeforeTake)
            {
                var errorMessage = t('Do you want to take this chat?');
                lzm_commonDialog.createAlertDialog(errorMessage, [{id: 'ok', name: t('Ok')}, {id: 'cancel', name: t('Cancel')}]);
                $('#alert-btn-ok').click(function() {
                    CommunicationEngine.pollServerSpecial({v: visitorId, b: browserId, c: chatId, g: groupId, o: DataEngine.myId,a:activate}, 'take-chat');
                    lzm_commonDialog.removeAlertDialog();
                    taken = true;
                });
                $('#alert-btn-cancel').click(function() {
                    lzm_commonDialog.removeAlertDialog();
                });
            }
            else
            {
                CommunicationEngine.pollServerSpecial({v: visitorId, b: browserId, c: chatId, g: groupId, o: DataEngine.myId,a:activate}, 'take-chat');
                taken = true;
            }
        }
        else if (chatObj.GetStatus() == Chat.Active)
        {
            if (askBeforeTake)
            {
                var errorMessage = t('Do you want to take this chat?');
                lzm_commonDialog.createAlertDialog(errorMessage, [{id: 'ok', name: t('Ok')}, {id: 'cancel', name: t('Cancel')}]);
                $('#alert-btn-ok').click(function() {
                    CommunicationEngine.pollServerSpecial({v: chatObj.v, b: chatObj.b, c: chatObj.i, g: groupId, o: DataEngine.myId,a:activate}, 'take-chat');
                    lzm_commonDialog.removeAlertDialog();
                    taken = true;
                });
                $('#alert-btn-cancel').click(function() {
                    lzm_commonDialog.removeAlertDialog();
                });
            }
            else
            {
                CommunicationEngine.pollServerSpecial({v: chatObj.v, b: chatObj.b, c: chatObj.i, g: groupId, o: DataEngine.myId,a:activate}, 'take-chat');
                taken = true;
            }
        }
    }

    if(taken)
        DataEngine.ChatManager.OpenChatWindow(visitorId + '~' + browserId);

}

function JoinChat(visitorId, browserId, chatId, joinInvisible, joinAfterInvitation) {

    joinInvisible = (typeof joinInvisible != 'undefined') ? joinInvisible : false;
    joinAfterInvitation = (typeof joinAfterInvitation != 'undefined') ? joinAfterInvitation : false;

    if (!PermissionEngine.checkUserPermissions(lzm_chatDisplay.myId, 'chats', 'join', {}))
        showNoPermissionMessage();
    else
    {
        if (joinInvisible)
        {
            if (!PermissionEngine.checkUserPermissions(lzm_chatDisplay.myId, 'chats', 'join_invisible', {}))
                showNoPermissionMessage();
            else
            {
                CommonUIClass.ToggleWhisperMode(true);
                CommunicationEngine.pollServerSpecial({v: visitorId, b: browserId, c: chatId}, 'join-chat-invisible');
            }
        }
        else if (joinAfterInvitation)
            CommunicationEngine.pollServerSpecial({v: visitorId, b: browserId, c: chatId}, 'join-chat');
        else
        {
            if (PermissionEngine.checkUserPermissions(lzm_chatDisplay.myId, 'chats', 'join_after_invitation', {}))
                showNoPermissionMessage();
            else
                CommunicationEngine.pollServerSpecial({v: visitorId, b: browserId, c: chatId}, 'join-chat');
        }
    }
}

function forwardChat(chatId, type) {
    LoadModuleConfiguration('ChatForwardInvite','lzm_chatDisplay.ChatForwardInvite.ShowForwardInvite(\''+chatId+'\',\''+type+'\');');
}

function showInvitedMessage(_chatId,senderId,_text) {

    var chatObj = DataEngine.ChatManager.GetChat(_chatId,'i');
    var op = DataEngine.operators.getOperator(senderId);
    if (chatObj != null && op != null && !lzm_chatDisplay.showOpInviteDialog)
    {
        lzm_chatDisplay.showOpInviteDialog = true;
        var visName = chatObj.GetName();
        visName = lzm_commonTools.escapeHtml(visName);
        var errorMessage = tid('invite_join',[['<!--op_name-->', op.name], ['<!--visitor_name-->', visName]]);
        errorMessage += tidc('addition_info_given','.') + '<br />';
        errorMessage +='<div id="add-info-box" class="top-space border-s" style="height:50px; overflow-y: auto; padding: 5px; font-style: italic;">' + _text + '</div>';
        lzm_commonDialog.createAlertDialog(errorMessage, [{id: 'join', name: t('Join Chat')}, {id: 'decline', name: t('Decline')}]);

        IFManager.IFPlaySound('message',LocalConfiguration.SoundVolume/100);

        $('#alert-btn-join').click(function() {

            JoinChat(chatObj.v, chatObj.b, chatObj.i, false, true);
            SelectView('mychats');
            OpenChatWindow(chatObj.SystemId);

            lzm_chatDisplay.showOpInviteDialog = false;
            lzm_commonDialog.removeAlertDialog();
        });
        $('#alert-btn-decline').click(function() {
            lzm_chatDisplay.showOpInviteDialog = false;
            lzm_commonDialog.removeAlertDialog();
        });
    }
}

function showVisitorChatActionContextMenu(activeChatId, button, e) {

    e.stopPropagation();
    if (button == 'panel')
    {
        e.preventDefault();
    }
    if (lzm_chatDisplay.showChatActionsMenu)
    {
        removeVisitorChatActionContextMenu();
    }
    else
    {
        lzm_chatDisplay.showChatActionsMenu = true;
        var userChat = DataEngine.ChatManager.GetChat(activeChatId);
        userChat.button = button;
        var parentOffset = $('#chat-controls').offset();
        var xValue, yValue;
        if (button == 'actions')
        {
            var buttonOffset = $('#visitor-chat-actions').offset();
            xValue = buttonOffset.left - parentOffset.left - 1;
            yValue = e.pageY - parentOffset.top;
        }
        else
        {
            xValue = e.pageX - parentOffset.left;
            yValue = e.pageY - parentOffset.top;
        }
        lzm_chatDisplay.showContextMenu('chat-actions', userChat, xValue, yValue, 'chat-actions');
    }
}

function removeVisitorChatActionContextMenu() {
    lzm_chatDisplay.showChatActionsMenu = false;

    $('#chat-actions-context').remove();
}

function handleAllChatsTree(){

    lzm_chatDisplay.ChatsUI.CategorySelect = !lzm_chatDisplay.ChatsUI.CategorySelect;
    UIRenderer.resizeAllChats();
}

function setUserStatus(statusValue, e) {

    if(e!=null)
        e.stopPropagation();
    var previousStatusValue = ChatPollServerClass.__UserStatus;

    lzm_chatDisplay.setUserStatus(statusValue);

    if (statusValue != 2 && previousStatusValue != 2 && statusValue != previousStatusValue)
        CommunicationEngine.InstantPoll();

    IFManager.IFSetOperatorStatus(statusValue);
}

function changeTableRow(e,type,tableId,tableIndex,rowId,direction){
    e.stopPropagation();
    lzm_chatDisplay.settingsDisplay.changeTableRow(type,tableId,tableIndex,rowId,direction);
}

function saveUserSettings(saveTables) {

    var firstVisibleView = null;
    var showViewSelectPanel = {
        'home': $('#show-home').prop('checked') ? 1 : 0,
        'mychats': $('#show-mychats').prop('checked') ? 1 : 0,
        'tickets': $('#show-tickets').prop('checked') ? 1 : 0,
        'external': $('#show-external').prop('checked') ? 1 : 0,
        'internal': $('#show-internal').prop('checked') ? 1 : 0,
        'qrd': $('#show-qrd').prop('checked') ? 1 : 0,
        'archive': $('#show-archive').prop('checked') ? 1 : 0,
        'reports': $('#show-reports').prop('checked') ? 1 : 0
    };
    var viewSelectArray = [], viewSelectObject = {}, i = 0, thisColumn;
    var allViewsArray = Object.keys(lzm_chatDisplay.allViewSelectEntries);
    for (i=0; i<allViewsArray.length; i++)
        viewSelectObject[allViewsArray[i]] = {name: lzm_chatDisplay.allViewSelectEntries[allViewsArray[i]].title, icon: lzm_chatDisplay.allViewSelectEntries[allViewsArray[i]].icon};

    $('.show-view-div').each(function() {
        var viewId = $(this).data('view-id');
        if (firstVisibleView == null && showViewSelectPanel[viewId] != 0) {
            firstVisibleView = viewId;
        }
        viewSelectArray.push({id: viewId, name: viewSelectObject[viewId].name, icon: viewSelectObject[viewId].icon});
    });
    lzm_chatDisplay.viewSelectArray = viewSelectArray;
    var tableColumns = null;
    if(saveTables)
    {
        LocalConfiguration.TableColumns = lzm_commonTools.clone(lzm_chatDisplay.settingsDisplay.mainTableColumns);
        var tableNames = lzm_chatDisplay.settingsDisplay.tableIds;
        tableColumns = {};
        for (var j=0; j<tableNames.length; j++) {
            tableColumns[tableNames[j]] = {general: [], custom: []};
            for (i=0; i<LocalConfiguration.TableColumns[tableNames[j]].length; i++) {
                thisColumn = LocalConfiguration.TableColumns[tableNames[j]][i];
                thisColumn.display = ($('#show-' + tableNames[j] + '-' + thisColumn.cid).prop('checked')) ? 1 : 0;
                tableColumns[tableNames[j]].general.push(thisColumn);
            }
        }
    }

    var settings = {
        awayAfterTime: $('#away-after-time').val(),
		backgroundMode: 0,
        saveConnections: $('#save-connections').prop('checked') ? 1 : 0,
        ticketsRead: $('#tickets-read').prop('checked') ? 1 : 0,
        showViewSelectPanel: showViewSelectPanel,
        viewSelectArray: viewSelectArray,
        tableColumns: tableColumns,
        vibrateNotifications: $('#vibrate-notifications').prop('checked') ? 1 : 0,
        alertNewFilter: $('#alert-new-filter').prop('checked') ? 1 : 0
    };

    LocalConfiguration.NotificationChats = $('#notification-window-chats').prop('checked') ? 1 : 0;
    LocalConfiguration.NotificationTickets = $('#notification-window-tickets').prop('checked') ? 1 : 0;
    LocalConfiguration.NotificationEmails = $('#notification-window-emails').prop('checked') ? 1 : 0;
    LocalConfiguration.NotificationOperators = $('#notification-window-operators').prop('checked') ? 1 : 0;
    LocalConfiguration.NotificationVisitors = $('#notification-window-visitors').prop('checked') ? 1 : 0;
    LocalConfiguration.NotificationErrors = $('#notification-window-errors').prop('checked') ? 1 : 0;

    lzm_commonStorage.saveValue('show_chat_visitor_info_' + DataEngine.myId,$('#show-chat-visitor-info').prop('checked') ? 1 : 0);
    lzm_commonStorage.saveValue('show_missed_chats_' + DataEngine.myId,$('#show-missed-chats').prop('checked') ? 1 : 0);

    LocalConfiguration.SoundVolume = $('#volume-slider').val();
    LocalConfiguration.UIShowAvatars = $('#show-avatars').prop('checked');
    LocalConfiguration.ChatAutoAccept = $('#auto-accept').prop('checked');
    LocalConfiguration.PlayQueueSound = $('#sound-chat-queue').prop('checked');
    LocalConfiguration.RepeatQueueSound = $('#sound-repeat-queue').prop('checked');
    LocalConfiguration.PlayChatSound = $('#sound-new-chat').prop('checked');
    LocalConfiguration.PlayVisitorSound = $('#sound-new-visitor').prop('checked');
    LocalConfiguration.RepeatChatSound = $('#sound-repeat-new-chat').prop('checked');
    LocalConfiguration.CheckUpdates = $('#check-for-updates').prop('checked');
    LocalConfiguration.KBAutoSearch = $('#kb_auto_search').prop('checked');
    LocalConfiguration.PlayChatMessageSound = $('#sound-new-message').prop('checked');
    LocalConfiguration.PlayTicketSound = $('#sound-new-ticket').prop('checked');

    if($('#app-auto-start').length){
        IFManager.IFSetAutoStart($('#app-auto-start').prop('checked'));
    }
        // FIND:20 setting save on button 'ok' @spellcheck
    if($('#spellcheck-settings').length && typeof(window.top.SpellCheck) != 'undefined'){
        window.top.SpellCheck.HandleSpellCheckSettings();
	}

    if($('#idle-time-active').length){
        LocalConfiguration.IdleTimeActive = ($('#idle-time-active').prop('checked'));
    }
    if($('#idle-time-target').length){
        LocalConfiguration.IdleTimeTarget = ($('#idle-time-target').val());
    }
    if($('#idle-time').length){
        LocalConfiguration.IdleTime = ($('#idle-time').val() * 60);
    }
    if($('#notification-timeout').length){
        var timeout = $('#notification-timeout').val();
        LocalConfiguration.NotificationTimeout = (timeout != 0) ? timeout : 1;
    }

    var NotificationTypes = ['chat','ticket', 'email', 'feedback', 'operator', 'visitor'];
    for(var item in NotificationTypes){
        var type = NotificationTypes[item];
        if($('#notification-' + type + '-timeout').length){
            var timeout = $('#notification-' + type + '-timeout').val();
            LocalConfiguration['Notification' + type.substr(0,1).toUpperCase() + type.substr(1) + 'Timeout'] = (timeout != 0) ? timeout : 1;
        }
        if($('#notification-' + type + '-timer').length){
            var timer = $('#notification-' + type + '-timer').prop('checked');
            LocalConfiguration['Notification' + type.substr(0,1).toUpperCase() + type.substr(1) + 'TimeoutEnabled'] = timer;
        }
    }

    LocalConfiguration.NotificationFeedbacks = $('#notification-window-feedbacks').prop('checked') ? 1 : 0;
    LocalConfiguration.Save();

    UserActions.saveUserSettings(settings);
    lzm_chatDisplay.RenderViewSelectPanel();
    lzm_chatDisplay.UpdateViewSelectPanel();
    lzm_chatDisplay.VisitorsUI.ResetVisitorList(false);
    lzm_chatDisplay.ChatsUI.CreateChatList();

    setTimeout(function(){

        if (lzm_chatDisplay.selected_view == 'mychats')
        {
            $('#chat-qrd-preview').html('');
            lzm_chatDisplay.RenderWindowLayout(true);
        }
        else if (lzm_chatDisplay.selected_view == 'tickets')
        {
            SelectView('tickets',true);
        }
        else if (lzm_chatDisplay.selected_view == 'archive')
        {
            SelectView('archive',true);
        }

    },200);
}

function showUserManagement(e) {
    lzm_chatDisplay.RemoveAllContextMenus();
    e.stopPropagation();
    if (PermissionEngine.permissions.user_management == 1)
    {
        lzm_chatDisplay.settingsDisplay.createUserManagement();
    }
    else
        showNoAdministratorMessage();
}

function selectLDAPElement(id){
    $('#user-management-iframe')[0].contentWindow.selectLDAPElement(id);
}

function setUserManagementTitle(newTitle) {

    if (lzm_chatDisplay.settingsDisplay.userManagementAction == 'list')
    {
        $('#save-usermanagement').css({visibility: 'hidden'});
        $('.um-list-button').css({visibility: 'visible'});
        $('#cancel-usermanagement-text').html(t('Close'));
    }
    else
    {
        $('.um-list-button').css({visibility: 'hidden'});
        $('#save-usermanagement').css({visibility: 'visible'});
        $('#cancel-usermanagement-text').html(t('Cancel'));
    }

    $('#user-management-title').html(newTitle);

    var actWin = TaskBarManager.GetWindow('user-management-dialog');
    if(actWin != null)
    {
        actWin.Title = newTitle;
        lzm_chatDisplay.RenderTaskBarPanel();
    }
    return newTitle;
}

function closeOperatorGroupConfiguration() {

    try
    {
        document.getElementById('user-management-iframe').contentWindow.lzm_userManagement.hideEditDialog();
    }
    catch(ex)
    {
        deblog(ex);
    }

    lzm_chatDisplay.settingsDisplay.userManagementAction = 'list';
    setUserManagementTitle(lzm_chatDisplay.settingsDisplay.GetUserManagementTitle());

    setTimeout(function(){

        setUserManagementTitle(lzm_chatDisplay.settingsDisplay.GetUserManagementTitle());

    },2000);
}

function closeOperatorSignatureTextInput() {
    var umg = document.getElementById('user-management-iframe').contentWindow.lzm_userManagement;
    umg.hideInputDialog();
    lzm_chatDisplay.settingsDisplay.userManagementAction = (umg.selectedListTab == 'user') ? 'operator' : 'group';
}

function showTranslationEditor(e) {
    lzm_chatDisplay.RemoveAllContextMenus();
    e.stopPropagation();

    if (PermissionEngine.permissions.translation_editor == 1)
    {
        var teWindow = TaskBarManager.GetWindow('translation-editor');
        if(teWindow != null)
        {
            teWindow.Maximize();
            return;
        }

        lzm_chatDisplay.translationEditor.LoadTranslationLanguages();
        lzm_chatDisplay.translationEditor.showTranslationEditor();

        if (lzm_chatDisplay.translationEditor.serverStrings.length == 0)
        {
            var useEn = false, useDefault = false, useBrowser = false, useShortBrowser = false;
            var trLanguages = lzm_commonTools.clone(DataEngine.translationLanguages);
            var defLang = DataEngine.defaultLanguage;
            var brLang = lzm_t.language;
            var brSLang = lzm_t.language.split('-')[0];
            for (var i=0; i<trLanguages.length; i++)
            {
                useEn = (trLanguages[i].key == 'en' && trLanguages[i].m == 0) ? true : useEn;
                useDefault = (trLanguages[i].key == defLang && trLanguages[i].m == 0) ? true : useDefault;
                useBrowser = (trLanguages[i].key == brLang && trLanguages[i].m == 0) ? true : useBrowser;
                useShortBrowser = (trLanguages[i].key == brSLang && trLanguages[i].m == 0) ? true : useShortBrowser;
            }
            var origStringLanguage = (useEn) ? 'en' : (useDefault) ? defLang : (useBrowser) ? brLang : (useShortBrowser) ? brSLang : (trLanguages.length > 0) ? trLanguages[0].key : '';
            showTranslationStringsLoadingDiv();
            CommunicationEngine.pollServerSpecial({l: origStringLanguage, m: 0, o: 0}, 'load-translation');
        }
    }
    else
        showNoAdministratorMessage();
}

function showTranslationStringsLoadingDiv() {
    var loadingHtml = '<div id="translation-strings-loading"><div class="lz_anim_loading"></div></div>';
    $('#translation_editor-body').append(loadingHtml).trigger('create');
    $('#translation-strings-loading').css({position: 'absolute',left:'220px',top:'40px',bottom:'80px',right:'10px','background-color': 'var(--main-floor-color)', 'z-index': 1000});
}

function removeTranslationStringsLoadingDiv() {
    $('#translation-strings-loading').remove();
}

function selectTranslationLine(myKey) {
    if (typeof $('#translation-string-table').data('selected-line') != 'undefined' && typeof $('#translation-string-input').val() != 'undefined') {
        var languageCode = (lzm_chatDisplay.translationEditor.selectedTranslationTab == 'mobile_client') ?
            lzm_chatDisplay.translationEditor.languageCode : 'srv-' + lzm_chatDisplay.translationEditor.languageCode;
        var languageStrings = lzm_commonTools.clone(lzm_chatDisplay.translationEditor.saveTranslations[languageCode].strings);
        var translation = $('#translation-string-input').val();
        var selectedLine = $('#translation-string-table').data('selected-line');
        for (var i=0; i<languageStrings.length; i++) {
            if (languageStrings[i].key == selectedLine) {
                if (languageStrings[i].editedValue != translation)
                {
                    lzm_chatDisplay.translationEditor.saveTranslations[languageCode].strings[i].editedValue = translation;
                    $('#save-translation-editor').removeClass('ui-disabled');
                    lzm_chatDisplay.translationEditor.saveTranslations[languageCode].edit = 1;
                }
                $('#translation-translated-string-' + selectedLine).html(translation.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
                var translationIcon = (translation != languageStrings[i].editedValue || translation != languageStrings[i].orig || languageCode == 'en' || languageCode == 'srv-en') ? '<i class="fa fa-check-circle" style="color: #73be28;"></i>' : '<i class="fa fa-warning" style="color: #e34e4e;"></i>';
                $('#translation-icon-' + languageStrings[i].key).html(translationIcon).trigger('create');
            }
        }

    }
    $('.translation-line').removeClass('selected-table-line');
    if (myKey != '')
    {
        $('#translation-line-' + myKey).addClass('selected-table-line');
        $('#translation-string-table').data('selected-line', myKey);
    }
}

function addTranslationLanguage(myTab) {
    lzm_chatDisplay.translationEditor.addTranslationLanguage('add', myTab);
}

function ChangePassword(_e,_force) {

    if(_e!=null)
    {
        _e.stopPropagation();
        ChatManager.SaveEditorInput();
    }
    lzm_commonDialog.ChangePassword(_force);
}

function personalChatLink(){

    if(PermissionEngine.permissions.personal_chat_link != 1)
    {
        showNoPermissionMessage();
        return;
    }

    var link = DataEngine.getServerUrl('chat.php?operator=' + encodeURIComponent(DataEngine.myUserId),DataEngine.serverProtocol);

    var linkControl = '<fieldset class="lzm-fieldset"><legend>'+tid('per_c_link')+'</legend>' + lzm_inputControls.createArea('personal_chat_link', '', '', 'URL:','min-width:320px;min-height:80px;') + '</fieldset>';
    lzm_commonDialog.createAlertDialog(linkControl, [{id: 'ok', name: tid('ok')}],true);
    $('#personal_chat_link').val(link);
    $('#personal_chat_link').select();
    $('#alert-btn-ok').click(function() {
        lzm_commonDialog.removeAlertDialog();
    });
}

function savePasswordChange(_newPassword) {
    CommonDialogClass.ChangedPassword = _newPassword;
    CommunicationEngine.pollServerSpecial({i: lzm_chatDisplay.myId, p: _newPassword}, 'change-password');
    //CommunicationEngine.chosenProfile.login_passwd = sha256(md5(_newPassword));
}

function showUserSettingsMenu(e,_main) {
    e.stopPropagation();
    var thisUsersettingsMenu = $('#usersettings-menu');
    if (lzm_chatDisplay.showUsersettingsHtml == false)
    {
        lzm_chatDisplay.showUsersettingsMenu(_main);
        thisUsersettingsMenu.css({'display':'block'});
        lzm_chatDisplay.showUsersettingsHtml = true;
    }
    else
    {
        thisUsersettingsMenu.css({'display':'none'});
        lzm_chatDisplay.showUsersettingsHtml = false;
    }

    UIRenderer.resizeMenuPanels();
}

function showUserStatusMenu(e) {
    e.stopPropagation();
    var thisUserstatusMenu = $('#userstatus-menu');
    if (lzm_chatDisplay.showUserstatusHtml == false)
    {
        lzm_chatDisplay.showUserstatusMenu(ChatPollServerClass.__UserStatus, DataEngine.myName,
            DataEngine.myUserId);
        thisUserstatusMenu.css({'display':'block'});
        lzm_chatDisplay.showUserstatusHtml = true;
    }
    else
    {
        CommonUIClass.CloseUserStatusMenu();
        lzm_chatDisplay.showUserstatusHtml = false;
    }
}

function showVisitorInvitation(id) {
    if (!PermissionEngine.checkUserPermissions('', 'chats', 'send_invites', {}))
        showNoPermissionMessage();
    else if (CommonUIClass.IsOutsideOfOpeningHours)
        showOutsideOpeningMessage();
    else
    {
        var doShowInvitationDialog = function()
        {
            var c = DataEngine.ChatManager.GetChat(id,'v');
            if(c != null && c.GetStatus() != Chat.Closed)
            {
                //return;
            }
            var aVisitor = VisitorManager.GetVisitor(id);
            aVisitor = (aVisitor != null) ? aVisitor : {id: '', b_id: ''};
            lzm_chatDisplay.VisitorsUI.showVisitorInvitation(aVisitor);
        };

        if (visitorHasNotCanceled(id))
        {
            doShowInvitationDialog();
        }
        else
        {
            var confirmText = tid('visitor_declined_invitation') + '<br />' + t('Invite this visitor again?');
            lzm_commonDialog.createAlertDialog(confirmText.replace(/\n/g, '<br />'), [{id: 'ok', name: t('Ok')}, {id: 'cancel', name: t('Cancel')}]);
            $('#alert-btn-ok').click(function() {
                doShowInvitationDialog();
                lzm_commonDialog.removeAlertDialog();
            });
            $('#alert-btn-cancel').click(function() {
                lzm_commonDialog.removeAlertDialog();
            });
        }
    }
}

function startVisitorChat(id) {
    if (!PermissionEngine.checkUserPermissions('', 'chats', 'start_new', {}))
        showNoPermissionMessage();
    else if (CommonUIClass.IsOutsideOfOpeningHours)
        showOutsideOpeningMessage();
    else
        CommunicationEngine.pollServerSpecial({visitorId: id, browserId: id + '_OVL'}, 'start_overlay');
}

function visitorHasNotCanceled(id) {
    var rtValue = true;
    var aVisitor = VisitorManager.GetVisitor(id);
    aVisitor = (aVisitor != null) ? aVisitor : {id: '', b_id: ''};
    if (typeof aVisitor.r != 'undefined' && aVisitor.r.length > 0) {
        for (var i=0; i< aVisitor.r.length; i++) {
            if (aVisitor.r[i].de == 1) {
                rtValue = false;
            }
        }
    }
    return rtValue;
}

function inviteExternalUser(id, b_id, text, _groupId) {
    UserActions.inviteExternalUser(id, b_id, text, _groupId);
}

function cancelInvitation(id) {
    var inviter = '';
    var visitor = VisitorManager.GetVisitor(id);
    try
    {
        inviter = visitor.r[0].s;
    }
    catch(e) {}

    if ((PermissionEngine.checkUserPermissions('', 'chats', 'cancel_invites', {}) && PermissionEngine.checkUserPermissions('', 'chats', 'cancel_invites_others', {})) ||
        (PermissionEngine.checkUserPermissions('', 'chats', 'cancel_invites', {}) && (inviter == lzm_chatDisplay.myId || inviter == ''))) {
        UserActions.cancelInvitation(id);
    }
    else
        showNoPermissionMessage();
}

function selectVisitor(e, _visitorId,_scrollTo) {

    if(LocalConfiguration.VisitorsMapVisible)
    {
        lzm_chatGeoTrackingMap.selectedVisitor = _visitorId;
        lzm_chatGeoTrackingMap.setSelection(_visitorId,true);
    }

    ChatVisitorClass.SelectedVisitor = _visitorId;
    $('.visitor-list-line').removeClass('selected-table-line');
    $('#visitor-list-row-' + _visitorId).addClass('selected-table-line');

    if(d(_scrollTo) && _scrollTo && d(_visitorId) && _visitorId.length && $('#visitor-list-row-'+_visitorId).length)
    {
        var container = $('#visitor-list-table-div');
        var scrollTo = $('#visitor-list-row-'+_visitorId);
        container.animate({
            scrollTop: (scrollTo.offset().top - container.offset().top + container.scrollTop())
        });
    }
}

function addVisitorComment(visitorId) {
    lzm_chatDisplay.VisitorsUI.addVisitorComment(visitorId);
}

function openVisitorListContextMenu(e, visitorId, isChatting, wasDeclined, invitationStatus) {
    e.stopPropagation();
    lzm_chatGeoTrackingMap.selectedVisitor = visitorId;
    VisitorManager.SelectedVisitor = visitorId;
    $('.visitor-list-line').removeClass('selected-table-line');
    $('#visitor-list-row-' + visitorId).addClass('selected-table-line');

    var visitor = VisitorManager.GetVisitor(visitorId);
    visitor = (visitor != null) ? visitor : {};
    var invitationLogo = (invitationStatus == 'requested') ? 'img/632-skills_not.png' : 'img/632-skills.png';
    if (lzm_chatDisplay.VisitorsUI.showVisitorListContextMenu)
    {
        removeVisitorListContextMenu();
    }
    else
    {
        var scrolledDownY = $('#visitor-list-table-div').scrollTop();
        var scrolledDownX = $('#visitor-list-table-div').scrollLeft();
        var parentOffset = $('#visitor-list-table-div').offset();
        var yValue = e.pageY - parentOffset.top + scrolledDownY;
        var xValue = e.pageX - parentOffset.left + scrolledDownX;
        lzm_chatDisplay.VisitorsUI.showVisitorListContextMenu = true;
        lzm_chatDisplay.showContextMenu('visitor-list-table-div', {visitor: visitor, chatting: isChatting, declined: wasDeclined,status: invitationStatus, logo: invitationLogo}, xValue, yValue);
    }
    e.preventDefault();
}

function removeVisitorListContextMenu() {
    lzm_chatDisplay.VisitorsUI.showVisitorListContextMenu = false;
    $('#visitor-list-table-div-context').remove();
}

function showFilterList(e) {
    if(PermissionEngine.permissions.chats_create_filter!='0')
        LoadModuleConfiguration('FilterConfiguration','lzm_chatDisplay.FilterConfiguration.showFilterList();');
    else
        showNoPermissionMessage();
}

function showFilterCreation(type, visitorId, chatId, filterId, inDialog, ticketId) {
    removeTicketContextMenu();
    if(PermissionEngine.permissions.chats_create_filter!='0')
        LoadModuleConfiguration('FilterConfiguration','lzm_chatDisplay.FilterConfiguration.showFilterCreationForm(\''+type+'\', \''+visitorId+'\', \''+chatId+'\', \''+filterId+'\', '+inDialog+', \''+ticketId+'\');');
    else
        showNoPermissionMessage();
}

function deleteFilter(filterId) {
    lzm_chatDisplay.FilterConfiguration.deleteFilter(filterId);
}

function openFiltersListContextMenu(e, filterId) {
    lzm_chatDisplay.FilterConfiguration.openFiltersListContextMenu(e, filterId);
}

function removeFiltersListContextMenu() {
    if(lzm_chatDisplay.FilterConfiguration != null){
        lzm_chatDisplay.FilterConfiguration.showFilterListContextMenu = false;
        $('#filter_list_dialog-context').remove();
    }
}

function selectFiltersLine(e, filterId) {
    var filter = DataEngine.filters.getFilter(filterId);
    if (filter != null) {
        $('#filter-list').data('selected-filter', filterId);
        $('.filters-list-line').removeClass('selected-table-line');
        $('#filters-list-line-' + filterId).addClass('selected-table-line');
    }
}

function EditVisitorDetails(visitorId,field,elementId){
    lzm_chatDisplay.VisitorsUI.EditVisitorDetails(visitorId,field,elementId);
}

function emptyMissedChats(){
    lzm_chatDisplay.ChatsUI.clearMissedChats();
}

function hideMissedChats(){
    lzm_chatDisplay.ChatsUI.hideMissedChats();
}

function initLinkGenerator(e,_show){

    _show = d(_show) ? _show : true;

    lzm_chatDisplay.translationEditor.LoadTranslationLanguages();

    if(PermissionEngine.permissions.link_generator == 1)
    {
        $.getScript('js/lzm/classes/LinkGeneratorClass.js', function( data, textStatus, jqxhr ) {

            if(_show && TaskBarManager.WindowExists('link-generator-dialog'))
            {
                TaskBarManager.Maximize('link-generator-dialog');
                return;
            }
            $.getScript('../templates/ahgzixd7/icons.js',function(){});
            lzm_chatDisplay.LinkGenerator = new LinkGeneratorClass();
            if(_show)
                lzm_chatDisplay.LinkGenerator.ShowLinkGenerator();
            else
                lzm_chatDisplay.LinkGenerator.LoadCodesFromServer();
        });
    }
    else
        showNoAdministratorMessage();
}

function selectLinkGeneratorImage(type){
    $('.image-edit-btns').removeClass('ui-disabled');
    $('.image-sets-list-line').removeClass('selected-table-line');
    $('#'+type).addClass('selected-table-line');
    $('#rm-image-set-btn').removeClass('ui-disabled');
    var buttons = JSON.parse(lz_global_base64_url_decode($('#'+type).attr('data-button')));
    $('#image-online-img').css({'background-size':'contain','background-position':'center center','background-repeat': 'no-repeat','background-image':'url(data:image/'+buttons[0].imagetype+';base64,'+buttons[0].data+')'});
    $('#image-offline-img').css({'background-size':'contain','background-position':'center center','background-repeat': 'no-repeat','background-image':'url(data:image/'+buttons[1].imagetype+';base64,'+buttons[1].data+')'});
    $('#m_SelectedImageSet').val($('#'+type).attr('data-id'));
    $('#m_SelectedImageWidth').val($('#'+type).attr('data-width'));
    $('#m_SelectedImageHeight').val($('#'+type).attr('data-height'));
}

function newLinkGeneratorCode(){
    lzm_chatDisplay.LinkGenerator.CreateNewCode();
}

function showLinkGeneratorCode(){
    lzm_chatDisplay.LinkGenerator.ShowLinkGeneratorCode();
}

function addImageSet(type){
    var addHtml = '',b64onlup='',b64offup='',fexon='',fexoff='';
    var etype = (type.indexOf('overlay') == -1) ? 'inlay' : 'overlay';
    addHtml += lzm_inputControls.createInput('add-img-set-online', '', '', tid('image_online'), '<i class="fa fa-file-image-o"></i>', 'file', 'a');
    addHtml += lzm_inputControls.createInput('add-img-set-offline', '', '', tid('image_offline'), '<i class="fa fa-file-image-o"></i>', 'file', 'a');
    lzm_commonDialog.createAlertDialog(addHtml, [{id: 'ok', name: tid('save')},{id: 'cancel', name: tid('cancel')}]);

    $('#add-img-set-online').change(function(e) {
        var input = e.target;
        var reader = new FileReader();
        reader.onload = function(){b64onlup = (reader.result.indexOf('data') == 0) ? reader.result.split(',')[1] : reader.result;};
        reader.readAsDataURL(input.files[0]);
        fexon = input.files[0].name.split('.').pop().toLowerCase();
    });
    $('#add-img-set-offline').change(function(e) {
        var input = e.target;
        var reader = new FileReader();
        reader.onload = function(){b64offup = (reader.result.indexOf('data') == 0) ? reader.result.split(',')[1] : reader.result;};
        reader.readAsDataURL(input.files[0]);
        fexoff = input.files[0].name.split('.').pop().toLowerCase();
    });
    $('#alert-btn-ok').click(function() {
        var data = {};
        data.p_process_banners_va = b64onlup;
        data.p_process_banners_vb = fexon;
        data.p_process_banners_vc = b64offup;
        data.p_process_banners_vd = fexoff;
        data.p_process_banners_ve = lzm_chatDisplay.LinkGenerator.m_MaxImageSetId+1;
        data.p_process_banners_vf = etype;
        CommunicationEngine.pollServerDiscrete('create_image_set',data).done(function(data) {
            lzm_chatDisplay.LinkGenerator.LoadImageSets(type,lzm_chatDisplay.LinkGenerator.m_MaxImageSetId+1);
        }).fail(function(jqXHR, textStatus, errorThrown){alert("ERR: 1x2d7123 (" + textStatus + ")");});
        lzm_commonDialog.removeAlertDialog();
    });
    $('#alert-btn-cancel').click(function() {
        lzm_commonDialog.removeAlertDialog();
    });
}

function removeImageSet(type){
    $('#rm-image-set-btn').addClass('ui-disabled');
    var etype = (type.indexOf('overlay') == -1) ? 'inlay' : 'overlay';
    var did = $('#image-sets-list-table .selected-table-line').attr('data-id');
    var data = {};
    data.p_process_banners_ve = did;
    data.p_process_banners_vf = etype;
    CommunicationEngine.pollServerDiscrete('delete_image_set',data).done(function(data) {
        lzm_chatDisplay.LinkGenerator.LoadImageSets(type);
    }).fail(function(jqXHR, textStatus, errorThrown){alert("ERR: 0x147153 (" + textStatus + ")");});
}

function initEventConfiguration(e){
    if(PermissionEngine.permissions.events != 0)
          LoadModuleConfiguration('EventConfiguration','lzm_chatDisplay.EventConfiguration.showEventConfiguration();');
    else
        showNoPermissionMessage();
}

function selectEventsLine(e,id){
    removeEventsListContextMenu();
    var event = lzm_commonTools.GetElementByProperty(DataEngine.eventList,'id',id);
    if (event.length==1) {
        $('.events-list-line').removeClass('selected-table-line');
        $('#events-list-line-' + id).addClass('selected-table-line');
        lzm_chatDisplay.EventConfiguration.m_SelectedEvent = lzm_commonTools.clone(event[0]);
        lzm_chatDisplay.EventConfiguration.m_SelectedEventId = lzm_chatDisplay.EventConfiguration.m_SelectedEvent.id;
    }
}

function showEventCreation(type,id){
    removeEventsListContextMenu();
    lzm_chatDisplay.EventConfiguration.showEventCreationForm(type,id);
}

function saveEvent(id,type){
    lzm_chatDisplay.EventConfiguration.saveEvent(id);
}

function deleteEvent(id){
    lzm_chatDisplay.EventConfiguration.deleteEvent(id);
}

function showEventSubElementCreation(action,type,id){
    lzm_chatDisplay.EventConfiguration.showEventSubElementCreation(action,type,id);
}

function openEventsListContextMenu(e, eventId){
    lzm_chatDisplay.EventConfiguration.openEventsListContextMenu(e, eventId);
}

function removeEventsListContextMenu(){
    $('#events-list-context').remove();
}

function initFeedbacksConfiguration(e){
    if(PermissionEngine.permissions.ratings != 0)
        lzm_chatDisplay.FeedbacksViewer.showFeedbacksViewer();
    else
        showNoPermissionMessage();
    $('#main-menu-panel-tools-feedbacks i').removeClass('icon-orange');
}

function initDataExport(e){
    if (PermissionEngine.permissions.data_export == 1)
        LoadModuleConfiguration('DataExportGeneratorClass','lzm_chatDisplay.DataExportGeneratorClass.Show();');
    else
        showNoAdministratorMessage();
}

function initServerConfiguration(_event,_tab){

    _tab = (d(_tab)) ? _tab : '';

    lzm_chatDisplay.ServerConfigurationClass = null;

    if (PermissionEngine.permissions.server_config == 1)
    {
        LoadModuleConfiguration('ServerConfigurationClass','lzm_chatDisplay.ServerConfigurationClass.showServerConfiguration(\''+_tab+'\');');
    }
    else
        showNoAdministratorMessage();
}

function resetInputFields(){
    lzm_chatDisplay.ServerConfigurationClass.resetInputFields();
}

function addLicenseKey(){
    lzm_chatDisplay.ServerConfigurationClass.addLicenseKey();
}

function configureLicense(type){
    lzm_chatDisplay.ServerConfigurationClass.configureLicense(type);
}

function ticketSubAction(action, type, id){
    lzm_chatDisplay.ServerConfigurationClass.ticketSubAction(action, type, id);
}

function feedbackAction(action, id){
    lzm_chatDisplay.ServerConfigurationClass.feedbackAction(action, id);
}

function testLDAP(){
    lzm_chatDisplay.ServerConfigurationClass.testLDAP();
}

function showLogs(){

    if(PermissionEngine.permissions.view_logs != 1)
    {
        showNoPermissionMessage();
        return;
    }

    if(TaskBarManager.WindowExists('log-viewer'))
    {
        TaskBarManager.Maximize('log-viewer');
        return;
    }

    var selectedTab = 0;
    function updateLogTabs(){
        try
        {
            for (var i=0;i<=5;i++)
            {
                if($('#log-list-placeholder-content-'+ i.toString()).html().length)
                    $('#log-list-placeholder-tab-'+ i.toString()).addClass('lzm-tabs-message');
                else
                    $('#log-list-placeholder-tab-'+ i.toString()).removeClass('lzm-tabs-message');
            }
        }
        catch(ex){}
    }

    var key,keys = ['php','sql','email','ldap','debug'];
    var deleteLog='',logHtml = '<div id="log-view"><div id="log-list-placeholder"></div></div>';
    var logPHPHtml = '',logSQLHtml = '',logEMAILHtml = '',logLDAPHtml = '',logDEBUGHtml = '';
    var footerString = '<span style="float:left">';

    footerString += lzm_inputControls.createButton('alert-btn-lvrefresh', '', '', '', '<i class="fa fa-refresh"></i>', 'lr',{'margin-right': '4px', 'margin-left': '4px'},'',30,'d');
    footerString += lzm_inputControls.createButton('alert-btn-lvdelete', '', '', tid('delete'), '<i class="fa fa-trash"></i>', 'lr',{'margin-right': '4px'},'',30,'d');
    footerString += lzm_inputControls.createButton('alert-btn-lvsend', '', '', tid('send'), '', 'lr',{'margin-right': '4px'},'',30,'d');
    footerString += '</span><span style="float:right">' + lzm_inputControls.createButton('alert-btn-lvok', '', '', tid('close'), '', 'lr',{'margin': '0px'},'',30,'d') + '</span>';

    lzm_commonDialog.CreateDialogWindow('Logs',logHtml, footerString, 'bug', 'log-viewer', 'log-viewer', 'alert-btn-lvok');
    lzm_inputControls.createTabControl('log-list-placeholder',[{name: 'PHP', content: logPHPHtml}, {name: 'SQL', content: logSQLHtml}, {name: 'Email', content: logEMAILHtml},  {name: 'LDAP', content: logLDAPHtml},{name: 'Debug', content: logDEBUGHtml},{name: 'Client', content: ''}]);

    $('#alert-btn-lvok').click(function() {
        $('#main-menu-panel-tools-logs i').removeClass('icon-orange');
        TaskBarManager.RemoveActiveWindow();
    });
    $('#alert-btn-lvrefresh').click(function() {

        for(key in keys)
        {
            var del = false;
            if(keys[key]==deleteLog)
            {
                del=true;
                deleteLog = '';
            }

            $.ajax({
                type: "GET",
                url: DataEngine.getServerUrl('log.php?t='+keys[key]+'&v='+sha256(DataEngine.token) + (del ? '&d=1' : '')) + '&acid=' + Math.random(),
                timeout: 15000,
                indexValue: key,
                dataType: 'text'
            }).done(function(data){
                    $('#log-list-placeholder-content-' + this.indexValue).html(lzm_commonTools.htmlEntities(data).replace(/[\r\n]+/g, "<br>"));
                    updateLogTabs();
                }).fail(function(jqXHR, textStatus, errorThrown)
                {


                });
        }
        var logClientHtml = '';
        for(key in Client.Logs)
            logClientHtml += Client.Logs[key].toString() + '\r\n';
        $('#log-list-placeholder-content-5').html(logClientHtml);
        updateLogTabs();
    });
    $('#alert-btn-lvsend').click(function(){
        var data = 'PHP LOG:\r\n' + $('#log-list-placeholder-content-0').html().substr(0,5000);
        data += '\r\nSQL LOG:\r\n' + $('#log-list-placeholder-content-1').html().substr(0,5000);
        data += '\r\nEMAIL LOG:\r\n' + $('#log-list-placeholder-content-2').html().substr(0,5000);
        data += '\r\nDEBUG LOG:\r\n' + $('#log-list-placeholder-content-4').html().substr(0,5000);
        data += '\r\nCLIENT LOG:\r\n' + $('#log-list-placeholder-content-5').html().substr(0,5000);
        sendFeedback(data);
    });
    $('#alert-btn-lvdelete').click(function() {

        if($('#log-list-placeholder-content-0').css('display')!='none')
            deleteLog = keys[0];
        if($('#log-list-placeholder-content-1').css('display')!='none')
            deleteLog = keys[1];
        if($('#log-list-placeholder-content-2').css('display')!='none')
            deleteLog = keys[2];
        if($('#log-list-placeholder-content-3').css('display')!='none')
            deleteLog = keys[3];
        if($('#log-list-placeholder-content-4').css('display')!='none')
            deleteLog = keys[4];
        if($('#log-list-placeholder-content-5').css('display')!='none')
        {
            $("#log-list-placeholder-content-5").html('');
            Client.Logs = [];
        }
        $('#alert-btn-lvrefresh').click();
    });
    $('#alert-btn-lvrefresh').click();

    $('.log-list-placeholder-tab').click(function(){
        selectedTab = $(this).data('tab-no');
        updateLogTabs();
    });
    $('.log-list-placeholder-content').css({padding:'10px'});
    lzm_chatDisplay.RenderMainMenuPanel();
}

function sendFeedback(_text){

    var myDataObject = {};
    myDataObject['exception'] = _text;
    myDataObject['build'] = lzm_commonConfig.lz_version;
    var vers = lzm_commonConfig.lz_version;
    $.ajax({
        type: "POST",
        url: "https://www.livezilla.net/com/errorreport.php?culture=&product_version=" + vers + "&type=automatic",
        data: myDataObject,
        timeout: 15000,
        dataType: 'text'
    }).done(function(data) {
        alert('Thank you for reporting this problem!');
    }).fail(function(jqXHR, textStatus, errorThrown){deblog(jqXHR);});
}

function showSubMenu(place, category, objectId, contextX, contextY, menuWidth, menuHeight) {
    lzm_chatDisplay.showSubMenu(place, category, objectId, contextX, contextY, menuWidth, menuHeight);
}

function showSuperMenu(place, category, objectId, contextX, contextY, menuWidth, menuHeight) {
    lzm_chatDisplay.showSuperMenu(place, category, objectId, contextX, contextY, menuWidth, menuHeight);
}

function SelectView(id) {

    TaskBarManager.MinimizeAll();
    CommonUIClass.ToggleSelectViewMenu();

    lzm_chatDisplay.selected_view = id;

    if (lzm_chatDisplay.selected_view == 'internal')
        lzm_chatDisplay.CreateOperatorList();

    if (lzm_chatDisplay.selected_view == 'tickets')
    {
        DataEngine.userHasSeenCurrentTickets();
        lzm_chatDisplay.ticketDisplay.notifyNewTicket = false;
        lzm_chatDisplay.ticketDisplay.CreateTicketList(lzm_chatDisplay.ticketListTickets, DataEngine.ticketGlobalValues, CommunicationEngine.ticketPage, LocalConfiguration.GetTicketSortField(CommunicationEngine.ticketFilterStatus), LocalConfiguration.GetTicketSortDirection(CommunicationEngine.ticketFilterStatus), CommunicationEngine.ticketQuery, CommunicationEngine.ticketFilterStatus, false, '');

        if(IFManager.IsDesktopApp())
        {
            IFManager.IFRemoveAllNotifications(2);
            IFManager.IFRemoveAllNotifications(3);
        }
    }
    if (lzm_chatDisplay.selected_view == 'external')
    {
        lzm_chatDisplay.VisitorsUI.UpdateVisitorMonitorUI('now');
    }
    if (lzm_chatDisplay.selected_view == 'archive')
    {
        if ($('#chat-archive-table').length == 0)
        {
            lzm_chatDisplay.archiveDisplay.createArchive();
        }
        else
        {
            lzm_chatDisplay.archiveDisplay.UpdateArchive();
        }
    }

    if (lzm_chatDisplay.selected_view == 'reports')
    {
        lzm_chatDisplay.reportsDisplay.createReportList();
        ChatReportsClass.UpdateDashBoard(true);
    }

    DataEngine.settingsDialogue = false;
    lzm_chatDisplay.settingsDialogue = false;
    $('#usersettings-container').css({display: 'none'});

    if (lzm_chatDisplay.selected_view == 'mychats')
    {
        showAllchatsList();
    }

    lzm_chatDisplay.toggleVisibility();

    if (lzm_chatDisplay.selected_view == 'qrd')
    {
        setTimeout('lzm_chatDisplay.resourcesDisplay.CreateKBTopNode(\'view-select-panel\', \''+ChatManager.LastActiveChat+'\')',1);
    }

    if (lzm_chatDisplay.selected_view == 'external')
        selectVisitor(null, VisitorManager.SelectedVisitor);

    CommonInputControlsClass.SearchBox.ToggleSearchDialog();
    CommonInputControlsClass.SearchBox.RenderSearchDialog();

    lzm_chatDisplay.lastChatSendingNotification = '';
    lzm_chatDisplay.UpdateViewSelectPanel();

    UIRenderer.resizeAll();
}

function openTicketContextMenu(e, ticketId, inDialog, elementId, row) {
    inDialog = (typeof inDialog != 'undefined') ? inDialog : false;
    removeTicketFilterMenu();
    ChatTicketClass.HandleTicketClick(ticketId, false, inDialog, elementId, row, e, true);
    var scrolledDownY, scrolledDownX, parentOffset;
    var place = (!inDialog) ? 'ticket-list' : ($('#visitor-information').length) ? 'visitor-information' : 'chat-info';

    scrolledDownY = $('#' + place +'-body').scrollTop();
    scrolledDownX = $('#' + place +'-body').scrollLeft();
    parentOffset = $('#' + place +'-body').offset();
    var xValue = e.pageX - parentOffset.left + scrolledDownX;
    var yValue = e.pageY - parentOffset.top + scrolledDownY;

    var ticket = {};
    for (var i=0; i<lzm_chatDisplay.ticketListTickets.length; i++) {
        if (lzm_chatDisplay.ticketListTickets[i].id == ticketId) {
            ticket = lzm_chatDisplay.ticketListTickets[i];
        }
    }
    lzm_chatDisplay.showTicketContextMenu = true;
    if(lzm_chatDisplay.showContextMenu(place, ticket, xValue, yValue))
    {
        e.stopPropagation();
        e.preventDefault();
        return false;
    }
    else
        return true;

}

function switchTicketNames(){
    var fn = $('#tr-firstname').val();
    var ln = $('#tr-lastname').val();
    $('#tr-firstname').val(ln);
    $('#tr-lastname').val(fn);
}

function setTicketFilter(){
    lzm_chatDisplay.ticketDisplay.setTicketFilter();
}

function removeTicketContextMenu() {
    lzm_chatDisplay.showTicketContextMenu = false;
    $('#ticket-list-context').remove();
    $('#chat-info-context').remove();
    $('#visitor-information-context').remove();
}

function removeTicketFilterMenu() {

}

function openTicketMessageContextMenu(e, ticketId, messageNumber, fromButton) {

    var winObj = TaskBarManager.GetActiveWindow();

    if (messageNumber != '')
        ChatTicketClass.HandleTicketMessageClick(ticketId, messageNumber);
    else
        messageNumber = $('#ticket-history-table').data('selected-message');

    var xValue, yValue;
    var parentOffset = null;
    var buttonPressed = '';

    if(!fromButton)
    {
        parentOffset = $('#ticket-history-table-placeholder-content-0').offset();
        xValue = e.pageX-60;
        yValue = e.pageY - parentOffset.top;
    }
    else
    {
        parentOffset = $('#'+winObj.DialogId+'-footline').offset();
        var eltOffset = $('#ticket-actions').offset();
        xValue = eltOffset.left - parentOffset.left;
        yValue = e.pageY - parentOffset.top;
        buttonPressed = 'ticket-message-actions';
    }

    var ticket = winObj.Tag;

    if(lzm_chatDisplay.ticketDisplay.GetTicketById(ticketId) != null)
        ticket = lzm_chatDisplay.ticketDisplay.GetTicketById(ticketId);

    lzm_chatDisplay.showTicketMessageContextMenu = true;
    if(lzm_chatDisplay.showContextMenu(winObj.DialogId, {ti: ticket, msg: messageNumber}, xValue, yValue, buttonPressed))
        e.preventDefault();
}

function removeTicketMessageContextMenu() {
    var winObj = TaskBarManager.GetActiveWindow();
    lzm_chatDisplay.showTicketMessageContextMenu = false;
    if(winObj != null)
        $('#'+winObj.DialogId+'-context').remove();
}

function pageTicketList(page) {
    $('.ticket-list-page-button').addClass('ui-disabled');
    var ticketFetchTime = DataEngine.ticketFetchTime;
    DataEngine.expectTicketChanges = true;
    CommunicationEngine.stopPolling();
    CommunicationEngine.ticketPage = page;
    CommunicationEngine.resetTickets = true;
    CommunicationEngine.startPolling();
    switchTicketListPresentation(ticketFetchTime, 0);
}

function switchTicketListPresentation(ticketFetchTime, counter, ticketId) {

    var loadingHtml;
    if (counter == 0 && PermissionEngine.permissions.tickets != 0)
    {
        loadingHtml = '<div id="ticket-list-loading"><div class="lz_anim_loading"></div></div>';
        $('#ticket-list-body').append(loadingHtml).trigger('create');

        var left = ($('#ticket-list-tree').css('display')=='none' || lzm_chatDisplay.ticketDisplay.CategorySelect) ? 0 : ($('#ticket-list-tree').width()+10)+'px';
        $('#ticket-list-loading').css({position: 'absolute', left: left, top:'1px',bottom:'0px',right:'1px','background-color': 'var(--main-floor-color)', 'z-index': 1000, opacity: 1});
    }
    if (ticketFetchTime != DataEngine.ticketFetchTime || counter >= 40)
    {
        if (typeof ticketId != 'undefined')
            changeTicketReadStatus(ticketId, 'read', true, true);

        if(lzm_chatDisplay.ticketDisplay.CategorySelect)
            handleTicketTree(false);
        lzm_chatDisplay.ticketDisplay.CreateTicketList(DataEngine.tickets,  DataEngine.ticketGlobalValues, CommunicationEngine.ticketPage, LocalConfiguration.GetTicketSortField(CommunicationEngine.ticketFilterStatus), LocalConfiguration.GetTicketSortDirection(CommunicationEngine.ticketFilterStatus), CommunicationEngine.ticketQuery, CommunicationEngine.ticketFilterStatus,'');
    }
    else
    {
        counter++;
        var delay = (counter <= 5) ? 200 : (counter <= 11) ? 500 : 1000;

        if(ChatTicketClass.LoadingTimer != null)
        {
            clearTimeout(ChatTicketClass.LoadingTimer);
            ChatTicketClass.LoadingTimer = null;
        }
        ChatTicketClass.LoadingTimer = setTimeout(function() {switchTicketListPresentation(ticketFetchTime, counter, ticketId);}, delay);
    }
}

function showMessageForward(ticketId, messageNo) {
    removeTicketMessageContextMenu();
    var message = {}, ticketSender = '', group = '';
    var ticket = lzm_chatDisplay.ticketDisplay.GetTicketById(ticketId);

    if(ticket != null)
    {
        message = ticket.messages[messageNo];
        ticketSender = ticket.messages[0].fn;
        group = ticket.gr;
        lzm_chatDisplay.ticketDisplay.showMessageForward(message, ticketId, ticketSender, group);
    }
}

function showTicketMsgTranslator(ticketId, msgNo) {

    ticketId = (typeof ticketId != 'undefined') ? ticketId : lzm_chatDisplay.selectedTicketRow;
    msgNo = (typeof msgNo != 'undefined') ? msgNo : -1;

    var ticket = lzm_chatDisplay.ticketDisplay.GetTicketById(ticketId);
    if(msgNo==-1)
        if (ticket != null)
            msgNo = ticket.messages.length - 1;

    removeTicketMessageContextMenu();
    showTranslationDialog('ticket',[ticket,msgNo]);
}

function showChatQuestionTranslator(field) {
    showTranslationDialog('chat_question',[field,$(field).data('pn')]);
}

function showTranslationDialog(type,obj){
    if (DataEngine.otrs != '' && DataEngine.otrs != null)
    {
        if(type=='ticket')
        {
            if (obj[0] != null)
                obj[0] = lzm_commonTools.clone(obj[0]);
            if (obj[0] != null && obj[0].messages.length > obj[1])
                lzm_chatDisplay.showObjectTranslator('ticket',obj);
        }
        else
        {
            if (d(obj) && d!= null)
                lzm_chatDisplay.showObjectTranslator(type,obj);
        }
    }
    else
    {
        var noGTranslateKeyWarning1 = t('LiveZilla can translate your conversations in real time. This is based upon Google Translate.');
        var noGTranslateKeyWarning2 = t('To use this functionality, you have to add a Google API key.');
        var noGTranslateKeyWarning3 = t('For further information, see LiveZilla Server Admin -> LiveZilla Server Configuration.');
        var noGTranslateKeyWarning = t('<!--phrase1--><br /><br /><!--phrase2--><br /><!--phrase3-->',
            [['<!--phrase1-->', noGTranslateKeyWarning1], ['<!--phrase2-->', noGTranslateKeyWarning2], ['<!--phrase3-->', noGTranslateKeyWarning3]]);
        lzm_commonDialog.createAlertDialog(noGTranslateKeyWarning, [{id: 'ok', name: tid('ok')}]);
        $('#alert-btn-ok').click(function() {
            lzm_commonDialog.removeAlertDialog();
        });
    }
}

function showTicketLinker(firstId, secondId, firstType, secondType, inChatDialog, elementId) {

    removeTicketMessageContextMenu();
    
    inChatDialog = (typeof inChatDialog != 'undefined') ? inChatDialog : false;
    elementId = (typeof elementId != 'undefined') ? elementId : '';

    var firstObject = null, secondObject = null, i = 0;
    var ticket = lzm_chatDisplay.ticketDisplay.GetTicketById(firstId);

    if (firstId != '' && firstType == 'ticket')
        if (ticket != null)
            firstObject = lzm_commonTools.clone(ticket);

    if (secondId != '' && secondType == 'chat') {
        for (i=0; i<DataEngine.chatArchive.chats.length; i++) {
            if (DataEngine.chatArchive.chats[i].cid == secondId) {
                secondObject = lzm_commonTools.clone(DataEngine.chatArchive.chats[i]);
            }
        }
    }
    else if (secondId != '' && secondType == 'ticket')
    {
        ticket = lzm_chatDisplay.ticketDisplay.GetTicketById(secondId);
        if (ticket != null)
            secondObject = lzm_commonTools.clone(ticket);
    }
    if (firstObject != null || secondObject != null) {
        lzm_chatDisplay.ticketDisplay.showTicketLinker(firstObject, secondObject, firstType, secondType, inChatDialog, elementId);
    }
}

function linkTicket(type, firstId, secondId) {
    CommunicationEngine.pollServerSpecial({fo: type.split('~')[0], so: type.split('~')[1], host_ticket_id: firstId, sub_ticket_id: secondId}, 'link-ticket');
}

function selectTicketMessage(ticketId, messageNumber) {
    $('.message-line').removeClass('selected-table-line');
    $('#ticket-history-table').data('selected-message', messageNumber);
    $('#message-line-' + ticketId + '_' + messageNumber).addClass('selected-table-line');
    $('.comment-line').removeClass('selected-table-line');
    $('.comment-line-' + ticketId + '_' + messageNumber).addClass('selected-table-line');
    $('.message-line-spacer-' + ticketId + '_' + messageNumber).addClass('selected-table-line');
    $('.message-line-draft-' + ticketId + '_' + messageNumber).addClass('selected-table-line');
}

function handleTicketCommentClick(commentNo, commentText) {

}

function saveTicketTranslationText(myTicket, msgNo, text, type) {
    if (typeof type == 'undefined' || type != 'comment')
    {
        if (myTicket != null)
        {
            var ticketGroup = myTicket.gr;
            var ticketStatus = (typeof myTicket.editor != 'undefined' && myTicket.editor != false) ? myTicket.editor.st : 0;
            var ticketOperator = (typeof myTicket.editor != 'undefined' && myTicket.editor != false) ? myTicket.editor.ed : '';
            var mc = {tid: myTicket.id, mid: myTicket.messages[msgNo].id, n: myTicket.messages[msgNo].fn, e: myTicket.messages[msgNo].em,
                c: myTicket.messages[msgNo].co, p: myTicket.messages[msgNo].p, s: myTicket.messages[msgNo].s, t: text,
                custom: []};
            for (var i=0; i<myTicket.messages[msgNo].customInput.length; i++)
                mc.custom.push({id: myTicket.messages[msgNo].customInput[i].id, value: myTicket.messages[msgNo].customInput[i].text});
            ChatTicketClass.InitUploadTicketDetails(myTicket, myTicket.t, ticketStatus, ticketGroup, ticketOperator, myTicket.l, null, null, null, null, null, null, null, null, null, null, null, mc);
            ChatTicketClass.UploadTicketDetails();
        }
    }
    else if (myTicket != null)
        UserActions.saveTicketComment(myTicket.id, myTicket.messages[msgNo].id, text);
}

function setTicketOperator(ticketId, operatorId) {
    removeTicketContextMenu();
    var selTickets = $('tr.ticket-list-row.selected-table-line');
    selTickets.each(function()
    {
        var myTicket = lzm_chatDisplay.ticketDisplay.GetTicketById($(this).attr('id').replace('ticket-list-row-',''));
        if (myTicket != null)
        {
            var ticketGroup = myTicket.gr;
            var ticketStatus = (typeof myTicket.editor != 'undefined' && myTicket.editor != false) ? myTicket.editor.st : 0;
            var ticketSubStatus = (typeof myTicket.editor != 'undefined' && myTicket.editor != false) ? myTicket.editor.ss : '';
            ChatTicketClass.InitUploadTicketDetails(myTicket, myTicket.t, ticketStatus, ticketGroup, operatorId, myTicket.l, '', '', '', '', '', '', '', '', ticketSubStatus, myTicket.s);
        }
    });
    ChatTicketClass.UploadTicketDetails();
}

function setTicketGroup(ticketId, groupId) {
    removeTicketContextMenu();
    var selTickets = $('tr.ticket-list-row.selected-table-line');
    selTickets.each(function()
    {
        var myTicket = lzm_chatDisplay.ticketDisplay.GetTicketById($(this).attr('id').replace('ticket-list-row-',''));
        if (myTicket != null)
        {
            var ticketEditor = (typeof myTicket.editor != 'undefined' && myTicket.editor != false) ? myTicket.editor.ed : '';
            var ticketStatus = (typeof myTicket.editor != 'undefined' && myTicket.editor != false) ? myTicket.editor.st : 0;
            var ticketSubStatus = (typeof myTicket.editor != 'undefined' && myTicket.editor != false) ? myTicket.editor.ss : '';
            ChatTicketClass.InitUploadTicketDetails(myTicket, myTicket.t, ticketStatus, groupId, ticketEditor, myTicket.l, '', '', '', '', '', '', '', '', ticketSubStatus, myTicket.s);
        }
    });
    ChatTicketClass.UploadTicketDetails();
}

function setTicketPriority(_ticketId, _priorityKey) {
    var selTickets = $('tr.ticket-list-row.selected-table-line'),list=[];
    selTickets.each(function()
    {
        list.push({id: $(this).attr('id').replace('ticket-list-row-',''),priority: _priorityKey});
    });
    UserActions.setTicketPriority(list);
}

function setAllTicketsRead() {
    CommunicationEngine.stopPolling();

    var maxTicketUpdated = CommunicationEngine.lastPollTime;

    if (parseInt(maxTicketUpdated) > parseInt(CommunicationEngine.ticketMaxRead))
    {
        CommunicationEngine.ticketMaxRead = maxTicketUpdated;
        lzm_chatDisplay.ticketGlobalValues.mr = maxTicketUpdated;
    }

    CommunicationEngine.resetTickets = true;
    lzm_chatDisplay.ticketReadArray = [];
    lzm_chatDisplay.ticketUnreadArray = [];
    lzm_chatDisplay.ticketDisplay.UpdateTicketList(lzm_chatDisplay.ticketListTickets, lzm_chatDisplay.ticketGlobalValues,CommunicationEngine.ticketPage, LocalConfiguration.GetTicketSortField(CommunicationEngine.ticketFilterStatus),LocalConfiguration.GetTicketSortDirection(CommunicationEngine.ticketFilterStatus),CommunicationEngine.ticketQuery, CommunicationEngine.ticketFilterStatus,true);
    CommunicationEngine.startPolling();
    removeTicketContextMenu();
}

function changeTicketReadStatus(ticketId, status, doNotUpdate, forceRead) {
    removeTicketContextMenu();
    doNotUpdate = (typeof doNotUpdate != 'undefined') ? doNotUpdate : false;
    forceRead = (typeof forceRead != 'undefined') ? forceRead : false;
    DataEngine.expectTicketChanges = true;
    var ticket = {id: '', u: 0}, i;
    for (i=0; i<DataEngine.tickets.length; i++)
        if (DataEngine.tickets[i].id == ticketId)
            ticket = DataEngine.tickets[i];

    if ((ticket.id != '' && status == 'read' && ticket.u > CommunicationEngine.ticketMaxRead) ||
        (ticket.id != '' && status != 'read' && true)) {
        if (ticket.id == '') {
            for (i=0; i<lzm_chatDisplay.ticketListTickets.length; i++) {
                if (lzm_chatDisplay.ticketListTickets[i].id == ticketId) {
                    ticket = lzm_chatDisplay.ticketListTickets[i];
                }
            }
        }
        if (status == 'read') {
            if (forceRead) {
                lzm_chatDisplay.ticketReadArray = lzm_commonTools.removeTicketFromReadStatusArray(ticketId, lzm_chatDisplay.ticketReadArray);
                lzm_chatDisplay.ticketReadArray = lzm_commonTools.addTicketToReadStatusArray(ticket, lzm_chatDisplay.ticketReadArray, lzm_chatDisplay.ticketListTickets);
            } else if (ticket.u > lzm_chatDisplay.ticketGlobalValues.mr && lzm_commonTools.checkTicketReadStatus(ticket.id, lzm_chatDisplay.ticketReadArray) == -1) {
                lzm_chatDisplay.ticketReadArray = lzm_commonTools.addTicketToReadStatusArray(ticket, lzm_chatDisplay.ticketReadArray, lzm_chatDisplay.ticketListTickets);
            } else {
                lzm_chatDisplay.ticketUnreadArray = lzm_commonTools.removeTicketFromReadStatusArray(ticket.id, lzm_chatDisplay.ticketUnreadArray);
            }
        } else
        {
            if (ticket.u <= lzm_chatDisplay.ticketGlobalValues.mr && lzm_commonTools.checkTicketReadStatus(ticket.id, lzm_chatDisplay.ticketUnreadArray) == -1)
                lzm_chatDisplay.ticketUnreadArray.push({id: ticket.id, timestamp: lzm_chatTimeStamp.getServerTimeString(null, true)});

            else
                lzm_chatDisplay.ticketReadArray = lzm_commonTools.removeTicketFromReadStatusArray(ticket.id, lzm_chatDisplay.ticketReadArray);

        }
        if (!doNotUpdate)
            lzm_chatDisplay.ticketDisplay.UpdateTicketList(lzm_chatDisplay.ticketListTickets, lzm_chatDisplay.ticketGlobalValues,CommunicationEngine.ticketPage, LocalConfiguration.GetTicketSortField(CommunicationEngine.ticketFilterStatus), LocalConfiguration.GetTicketSortDirection(CommunicationEngine.ticketFilterStatus), CommunicationEngine.ticketQuery, CommunicationEngine.ticketFilterStatus,true);
    }
}

function sortTicketsBy(_field) {

    var currentSortField = LocalConfiguration.GetTicketSortField(CommunicationEngine.ticketFilterStatus);
    var currentSortDirection = LocalConfiguration.GetTicketSortDirection(CommunicationEngine.ticketFilterStatus);

    if (_field == currentSortField)
        currentSortDirection = (currentSortDirection=='ASC') ? 'DESC' : 'ASC';

    LocalConfiguration.SetTicketSortField(_field);
    LocalConfiguration.SetTicketSortDirection(currentSortDirection);

    $('.ticket-list-page-button').addClass('ui-disabled');
    var ticketFetchTime = DataEngine.ticketFetchTime;
    DataEngine.expectTicketChanges = true;
    CommunicationEngine.stopPolling();
    CommunicationEngine.resetTickets = true;
    CommunicationEngine.startPolling();
    switchTicketListPresentation(ticketFetchTime, 0);
}

function pauseTicketReply(ticketId) {

    var repWin = TaskBarManager.GetWindow(ticketId + '_reply');
    if(repWin != null)
    {
        repWin.Minimize();
        repWin.ShowInTaskBar = false;
    }

    var tWin = TaskBarManager.GetWindow(ticketId);
    if(tWin != null)
        tWin.Maximize();
}

function deleteSalutationString(e, salutationField, salutationString) {
    e.stopPropagation();
    lzm_commonTools.deleteTicketSalutation(salutationField, salutationString);
}

function toggleEmailList() {

    if ($('#email-list-container').length == 0)
    {
        lzm_chatDisplay.ticketDisplay.ShowEmailLists();
        CommunicationEngine.stopPolling();
        CommunicationEngine.emailUpdateTimestamp = 0;
        CommunicationEngine.addPropertyToDataObject('p_de_a', CommunicationEngine.emailAmount);
        CommunicationEngine.addPropertyToDataObject('p_de_ad', CommunicationEngine.EmailAmountDeleted);
        CommunicationEngine.addPropertyToDataObject('p_de_s', 0);
        CommunicationEngine.startPolling();
    }
    else
    {
        CommunicationEngine.stopPolling();
        CommunicationEngine.removePropertyFromDataObject('p_de_a');
        CommunicationEngine.removePropertyFromDataObject('p_de_ad');
        CommunicationEngine.removePropertyFromDataObject('p_de_s');
        CommunicationEngine.emailAmount = 20;
        CommunicationEngine.EmailAmountDeleted = 40;
        CommunicationEngine.startPolling();
    }
}

function saveEmailListChanges(emailId, assign) {
    var i, emailChanges = [], ticketsCreated = [], emailListObject = {};
    if (emailId != '')
    {
        var editorId = (assign) ? lzm_chatDisplay.myId : '';
        if (emailId instanceof Array)
        {
            for (i=0; i<emailId.length; i++) {
                emailChanges.push({id: emailId[i], status: '0', editor: editorId})
            }
        }
        else
        {
            emailChanges = [{
                id: emailId, status: '0', editor: editorId
            }];
        }
    }
    else
    {
        for (i=0; i<DataEngine.emails.length; i++) {
            emailListObject[DataEngine.emails[i].id] = DataEngine.emails[i];
        }

        for (i=0; i<lzm_chatDisplay.emailDeletedArray.length; i++) {
            emailChanges.push({id: lzm_chatDisplay.emailDeletedArray[i], status: '1', editor: ''})
        }

        for (i=0; i<lzm_chatDisplay.ticketsFromEmails.length; i++)
        {
            var thisEmail = emailListObject[lzm_chatDisplay.ticketsFromEmails[i]['email-id']];
            if(d(thisEmail))
            {
                emailChanges.push({id: thisEmail.id, status: '1', editor: ''});
                ticketsCreated.push({
                    name: lzm_chatDisplay.ticketsFromEmails[i].name,//thisEmail.n,
                    email: lzm_chatDisplay.ticketsFromEmails[i].email,//thisEmail.e,
                    subject: lzm_chatDisplay.ticketsFromEmails[i].subject,//thisEmail.s,
                    text: lzm_chatDisplay.ticketsFromEmails[i].message,
                    group: lzm_chatDisplay.ticketsFromEmails[i].group,
                    cid: thisEmail.id,
                    channel: lzm_chatDisplay.ticketsFromEmails[i].channel,
                    company: lzm_chatDisplay.ticketsFromEmails[i].company,
                    phone: lzm_chatDisplay.ticketsFromEmails[i].phone,
                    language: lzm_chatDisplay.ticketsFromEmails[i].language,
                    status: lzm_chatDisplay.ticketsFromEmails[i].status,
                    editor: (lzm_chatDisplay.ticketsFromEmails[i].editor != -1) ? lzm_chatDisplay.ticketsFromEmails[i].editor : '',
                    attachment: thisEmail.attachment,
                    comment: lzm_chatDisplay.ticketsFromEmails[i].comment,
                    custom: lzm_chatDisplay.ticketsFromEmails[i].custom,
                    tags: lzm_chatDisplay.ticketsFromEmails[i].tags
                });
            }
        }
    }
    UserActions.saveEmailChanges(emailChanges, ticketsCreated);
}

function showPhoneCallDialog(objectId, lineNo, caller) {
    removeTicketMessageContextMenu();
    if (caller == 'ticket')
    {
        var ticket = null;
        var messageNo = parseInt(lineNo);
        for (var i=0; i<lzm_chatDisplay.ticketListTickets.length; i++)
            if (lzm_chatDisplay.ticketListTickets[i].id == objectId)
                ticket = lzm_chatDisplay.ticketListTickets[i];

        if (ticket != null && ticket.messages.length > messageNo)
            lzm_chatDisplay.openPhoneCallDialog(ticket, messageNo, caller);
    }
    else if (caller == 'chat')
    {
        lzm_chatDisplay.openPhoneCallDialog(objectId, -1, caller);
    }
}

function startPhoneCall(protocol, phoneNumber) {
    IFManager.IFInitPhoneCall(protocol, phoneNumber);
}

function toggleTicketFilter() {

    var ticketFetchTime = DataEngine.ticketFetchTime;
    DataEngine.expectTicketChanges = true;
    CommunicationEngine.ticketPage = 1;
    CommunicationEngine.resetTickets = true;
    switchTicketListPresentation(ticketFetchTime, 0);
    CommunicationEngine.InstantPoll();
}

function addTicketToWatchList(_ticketId,_operatorId){
    removeTicketContextMenu();
    var selTickets = $('tr.ticket-list-row.selected-table-line'),toAdd=[];
    selTickets.each(function()
    {
        toAdd.push({id: $(this).attr('id').replace('ticket-list-row-',''),operatorId: _operatorId});
    });
    UserActions.addTicketToWatchList(toAdd);
}

function removeTicketFromWatchList(){
    removeTicketContextMenu();
    var selTickets = $('tr.ticket-list-row.selected-table-line'),toRemove=[];
    selTickets.each(function()
    {
        toRemove.push({id: $(this).attr('id').replace('ticket-list-row-','')});
    });
    UserActions.removeTicketFromWatchList(toRemove);
}

function mergeTickets(){
    removeTicketContextMenu();
    var selTickets = $('tr.ticket-list-row.selected-table-line'),toMerge=[],i;
    if(selTickets.length>=2)
    {
        selTickets.each(function()
        {
            toMerge.push($(this).attr('id').replace('ticket-list-row-',''));
        });

        function stid(a, b){
            return ((a < b) ? -1 : ((a > b) ? 1 : 0));
        }

        toMerge.sort(stid);

        for(i=1;i<selTickets.length;i++)
        {
            CommunicationEngine.pollServerSpecial({fo: 'ticket', so: 'ticket', sub_ticket_id: toMerge[i], host_ticket_id: toMerge[0]}, 'link-ticket');
        }
    }
}

function openArchiveFilterMenu(e, filter) {
    filter = (filter != '') ? filter : CommunicationEngine.chatArchiveFilter;
    e.stopPropagation();
    if (lzm_chatDisplay.showArchiveFilterMenu) {
        removeArchiveFilterMenu();
    } else {
        var parentOffset = $('#archive-filter').offset();
        var xValue = parentOffset.left;
        var yValue = parentOffset.top + 25;
        lzm_chatDisplay.showArchiveFilterMenu = true;
        if(lzm_chatDisplay.showContextMenu('archive-filter', {filter: filter}, xValue, yValue))
            e.preventDefault();
    }
}

function removeArchiveFilterMenu() {
    lzm_chatDisplay.showArchiveFilterMenu = false;
    $('#archive-filter-context').remove();
}

function toggleArchiveFilter(filter, e) {

    e.stopPropagation();
    $('.archive-list-page-button').addClass('ui-disabled');
    //CommunicationEngine.stopPolling();
    //var archiveFetchTime = DataEngine.archiveFetchTime;
    DataEngine.expectArchiveChanges = true;
    removeArchiveFilterMenu();

    var filterList = CommunicationEngine.chatArchiveFilter.split('');
    if ($.inArray(filter.toString(), filterList) != -1) {
        var pattern = new RegExp(filter.toString());
        CommunicationEngine.chatArchiveFilter = CommunicationEngine.chatArchiveFilter.replace(pattern, '');
    } else {
        filterList.push(filter);
        filterList.sort();
        CommunicationEngine.chatArchiveFilter = filterList.join('');
    }
    if (CommunicationEngine.chatArchiveFilter == '') {
        CommunicationEngine.chatArchiveFilter = '012';
    }

    ChatArchiveClass.SetLoading(0);
    CommunicationEngine.resetChats = true;
    CommunicationEngine.chatArchivePage = 1;
    CommunicationEngine.pollServer();
}

function sendChatTranscriptTo(chatId, dialogId, windowId, dialogData) {
    lzm_chatDisplay.archiveDisplay.sendChatTranscriptTo(chatId, dialogId, windowId, dialogData);
}

function pageReportList(page) {
    $('#report-list-table').data('selected-report', '');
    $('.report-list-page-button').addClass('ui-disabled');
    $('#report-filter').addClass('ui-disabled');
    var reportFetchTime = DataEngine.reportFetchTime;
    DataEngine.expectReportChanges = true;
    CommunicationEngine.stopPolling();
    CommunicationEngine.reportPage = page;
    CommunicationEngine.resetReports = true;
    CommunicationEngine.startPolling();
    switchReportListPresentation(reportFetchTime, 0);
}

function switchReportListPresentation(reportFetchTime, counter) {

    if (reportFetchTime != DataEngine.reportFetchTime || counter >= 40)
    {
        lzm_chatDisplay.reportsDisplay.createReportList();
    }
    else
    {
        counter++;
        var delay = (counter <= 5) ? 200 : (counter <= 11) ? 500 : (counter <= 21) ? 1000 : 2000;
        setTimeout(function() {switchReportListPresentation(reportFetchTime, counter);}, delay);
    }
}

function openReportContextMenu(e, reportId, canBeReCalculated) {
    e.stopPropagation();
    e.preventDefault();
    removeReportFilterMenu();
    selectReport(reportId);
    if (lzm_chatDisplay.showReportContextMenu) {
        removeReportContextMenu();
    } else {
        var scrolledDownY, scrolledDownX, parentOffset;
        var place = 'report-list';
        scrolledDownY = $('#' + place +'-body').scrollTop();
        scrolledDownX = $('#' + place +'-body').scrollLeft();
        parentOffset = $('#' + place +'-body').offset();
        var xValue = e.pageX - parentOffset.left + scrolledDownX;
        var yValue = e.pageY - parentOffset.top + scrolledDownY;

        var report = DataEngine.reports.getReport(reportId);
        report.canBeReCalculated = canBeReCalculated;
        if (report != null) {
            lzm_chatDisplay.showReportContextMenu = true;
            lzm_chatDisplay.showContextMenu(place, report, xValue, yValue);
        }
    }
}

function openReportFilterMenu(e) {
    var filter = CommunicationEngine.reportFilter;
    e.stopPropagation();
    if (lzm_chatDisplay.showReportFilterMenu) {
        removeReportFilterMenu();
    } else {
        var parentOffset = $('#report-filter').offset();
        var xValue = parentOffset.left + 10;
        var yValue = parentOffset.top + 25;
        lzm_chatDisplay.showReportFilterMenu = true;
        lzm_chatDisplay.showContextMenu('report-filter', {filter: filter}, xValue, yValue);
        e.preventDefault();
    }
}

function removeReportFilterMenu() {
    lzm_chatDisplay.showReportFilterMenu = false;
    $('#report-filter-context').remove();
}

function removeReportContextMenu() {
    lzm_chatDisplay.showReportContextMenu = false;
    $('#report-list-context').remove();
}

function selectReport(reportId) {
    $('#report-list-table').data('selected-report', reportId);
    $('.report-list-line').removeClass('selected-table-line');
    $('#report-list-line-' + reportId).addClass('selected-table-line');
}

function recalculateReport(reportId) {
    removeReportContextMenu();
    if (!PermissionEngine.checkUserPermissions(lzm_chatDisplay.myId, 'reports', 'recalculate', {}))
    {
        showNoPermissionMessage();
    }
    else
    {
        var report = DataEngine.reports.getReport(reportId);
        if (report != null)
        {
            CommunicationEngine.pollServerSpecial({year: report.y, month: report.m, day: report.d, time: report.t, mtime: report.mt}, 'recalculate-report');
        }
    }
}

function createPublicGroup() {
    if (PermissionEngine.checkUserPermissions(lzm_chatDisplay.myId, 'group', '', {o: lzm_chatDisplay.myId}))
        lzm_chatDisplay.createPublicGroup();
    else
        showNoPermissionMessage();
}

function saveNewDynamicGroup() {
    var newGroupName = $('#new-dynamic-group-name').val().replace(/^ */, '').replace(/ *$/, '');
    if (newGroupName != '')
    {
        UserActions.SaveChatGroup('create', '', newGroupName, '');
    }
    else
    {
        $('#operator-list-line-new-' + lzm_chatDisplay.newDynGroupHash).remove();
        lzm_chatDisplay.CreateOperatorList();
    }
}

function deleteChatGroup(id) {
    var group = DataEngine.groups.getGroup(id);
    if (group != null && typeof group.members != 'undefined')
    {
        if (PermissionEngine.checkUserPermissions(lzm_chatDisplay.myId, 'group', '', group))
        {
            lzm_commonDialog.createAlertDialog(tid('remove_items'), [{id: 'ok', name: t('Ok')}, {id: 'cancel', name: t('Cancel')}]);
            $('#alert-btn-ok').click(function()
            {
                lzm_commonDialog.removeAlertDialog();
                UserActions.SaveChatGroup('delete', id, '', '');
                DataEngine.groups.setGroupProperty(id, 'is_active', false);
                if (lzm_chatDisplay.selected_view == 'internal')
                    lzm_chatDisplay.CreateOperatorList();
            });
            $('#alert-btn-cancel').click(function() {
                lzm_commonDialog.removeAlertDialog();
            });
        }
        else
            showNoPermissionMessage();
    }
}

function getDynamicGroupURL(id) {
    var URL = DataEngine.getServerUrl('chat.php') + '?edg=' + lz_global_base64_url_encode(id);
    var urlBox = lzm_inputControls.createArea('dyn-group-url', '', '',tidc('url'),'width:300px;height:80px;');
    lzm_commonDialog.createAlertDialog(urlBox, [{id: 'ok', name: tid('ok')}],null,null,true);
    $('#dyn-group-url').val(URL);
    $('#dyn-group-url').select();
    $('#alert-btn-ok').click(function() {
        lzm_commonDialog.removeAlertDialog();
    });
}

function addToChatGroup(id, browserId, chatId) {
    if (PermissionEngine.checkUserPermissions(lzm_chatDisplay.myId, 'group', '', {o: lzm_chatDisplay.myId}))
    {
        var activeUserChat = DataEngine.ChatManager.GetChat(chatId,'i');
        lzm_chatDisplay.addToChatGroup(id, browserId, chatId);
    }
    else
        showNoPermissionMessage();
    lzm_chatDisplay.RemoveAllContextMenus();
}

function removeFromChatGroup(id, groupId) {

    if (PermissionEngine.checkUserPermissions(lzm_chatDisplay.myId, 'group', '', DataEngine.groups.getGroup(groupId)))
    {
        var browserId = '', isGroupOwner = false;
        if (id.indexOf('~') != -1)
        {
            browserId = id.split('~')[1];
            id = id.split('~')[0];
        }
        var group = DataEngine.groups.getGroup((groupId));
        if (group != null && group.o == id)
            isGroupOwner = true;

        if (!isGroupOwner)
        {
            var visitorchatobj = DataEngine.ChatManager.GetChat(id+'~'+id+'_OVL');
            if(visitorchatobj != null && visitorchatobj.Type == Chat.Visitor && !visitorchatobj.Members.length)
            {
                takeChat(id, id + '_OVL', visitorchatobj.i, visitorchatobj.dcg);
            }
            else
                UserActions.SaveChatGroup('remove', groupId, '', id, {browserId: browserId});

            var chatobj = DataEngine.ChatManager.GetChat(groupId);
            if(chatobj != null)
            {
                addOperatorLeftMessageToChat(chatobj,[{i:id}]);
                chatobj.CloseChatWindow();
                showAllchatsList(true);
            }
        }
        else
        {
            var alertText =  t('The owner of a group must be member of the group.');
            lzm_commonDialog.createAlertDialog(alertText, [{id: 'ok', name: t('Ok')}]);
            $('#alert-btn-ok').click(function() {
                lzm_commonDialog.removeAlertDialog();
            });
        }
    }
    else
        showNoPermissionMessage();

    lzm_chatDisplay.RemoveAllContextMenus();
}

function selectChatGroup(groupId) {
    $('.dynamic-group-line').removeClass('selected-table-line');
    $('#dynamic-group-line-' + groupId).addClass('selected-table-line');
    $('#dynamic-group-table').data('selected-group', groupId);
}

function openOperatorListContextMenu(e, type, id, lineId, groupId, lineCounter) {
    e.stopPropagation();
    var chatPartner = null, browser = {};
    switch (type) {
        case 'group':
            if (id != 'everyoneintern') {
                chatPartner = DataEngine.groups.getGroup(id);
            } else {
                chatPartner = {id: id, name: tid('all_operators')};
            }
            break;
        case 'operator':
            chatPartner = DataEngine.operators.getOperator(id);
            break;
        case 'visitor':
            chatPartner = VisitorManager.GetVisitor(id.split('-')[0]);
            if (typeof chatPartner.b != 'undefined') {
                for (var i=0; i<chatPartner.b.length; i++)
                    if (chatPartner.b[i].id == id.split('~')[1])
                        browser = chatPartner.b[i];
            }
            else
                browser = {id: ''};

            break;
    }
    if (chatPartner != null)
    {
        selectOperatorLine(lineId, lineCounter, e);
        var scrolledDownY = $('#operator-list-body').scrollTop();
        var scrolledDownX = $('#operator-list-body').scrollLeft();
        var parentOffset = $('#operator-list-body').offset();
        var yValue = e.pageY - parentOffset.top + scrolledDownY;
        var xValue = e.pageX - parentOffset.left + scrolledDownX;
        if(lzm_chatDisplay.showContextMenu('operator-list', {type: type, 'chat-partner': chatPartner, groupId: groupId,'browser': browser, 'line-id': lineId}, xValue, yValue))
        {
            e.preventDefault();
            return false;
        }
    }
    return true;

}

function selectOperatorLine(lineId, lineCounter, sysid, userid, name, fromOpList) {

    try
    {
        name = lz_global_base64_url_decode(name);
        var now = lzm_chatTimeStamp.getServerTimeString(null, false, 1);
        var internalChatsAreDisabled = (lzm_chatDisplay.myGroups.length > 0);

        for (var i=0; i<lzm_chatDisplay.myGroups.length; i++)
        {
            var myGr = DataEngine.groups.getGroup(lzm_chatDisplay.myGroups[i]);
            if (myGr != null && (typeof myGr.internal == 'undefined' || myGr.internal == '1'))
                internalChatsAreDisabled = false;
        }

        if (!internalChatsAreDisabled &&((!IFManager.IsAppFrame && !IFManager.IsMobileOS) || IFManager.IsDesktopApp()) && lastOpListClick[0] == lineId && now - lastOpListClick[1] < 500 && d(userid) && d(name) && d(fromOpList))
        {
            OpenChatWindow(sysid);
        }
        else
        {
            lastOpListClick = [lineId, now];
            lzm_chatDisplay.m_OperatorsListSelectedLine = lineCounter;
            setTimeout(function() {
                $('.operator-list-line').removeClass('selected-table-line');
                $('#' + lineId).addClass('selected-table-line');
            }, 1);
        }
    }
    catch(ex)
    {deblog(ex);}
}

function removeOperatorListContextMenu() {
    $('#operator-list-context').remove();

}

function removeChatMembersListContextMenu() {
    $('#chat-members-context').remove();
}

function toggleIndividualGroupStatus(groupId, action) {
    lzm_chatDisplay.newGroupsAway = (lzm_chatDisplay.newGroupsAway != null) ? lzm_commonTools.clone(lzm_chatDisplay.newGroupsAway) : (lzm_chatDisplay.myGroupsAway != null) ? lzm_commonTools.clone(lzm_chatDisplay.myGroupsAway) : [];
    if (action == 'add')
    {
        if ($.inArray(groupId, lzm_chatDisplay.newGroupsAway) == -1)
        {
            lzm_chatDisplay.newGroupsAway.push(groupId);
        }
    }
    else
    {
        var tmpArray = [];
        for (var i=0;i<lzm_chatDisplay.newGroupsAway.length; i++)
        {
            if (lzm_chatDisplay.newGroupsAway[i] != groupId)
            {
                tmpArray.push(lzm_chatDisplay.newGroupsAway[i]);
            }
        }
        lzm_chatDisplay.newGroupsAway = lzm_commonTools.clone(tmpArray);
    }
    DataEngine.operators.setOperatorProperty(lzm_chatDisplay.myId, 'groupsAway', lzm_chatDisplay.newGroupsAway);
    removeOperatorListContextMenu();
    CommunicationEngine.InstantPoll();
}

function signOffOperator(operatorId) {
    if (PermissionEngine.permissions.sign_off_operator == 1)
    {
        var operator = DataEngine.operators.getOperator(operatorId);
        if (operator != null)
            CommunicationEngine.pollServerSpecial({oid: operator.id, ouid: operator.userid}, 'operator-sign-off');
    }
    else
        showNoAdministratorMessage();
}

function initEditor(myText, caller, cpId) {

    cpId = (typeof cpId != 'undefined' && cpId != '') ? cpId : ChatManager.ActiveChat;
    ChatEditorClass.IsActiveEditor = true;
    if ((IFManager.IsAppFrame || IFManager.IsMobileOS) && !IFManager.IsDesktopApp())
    {
        setEditorContents(myText);
    }
    else
    {
        lzm_chatInputEditor.init(myText, 'initEditor_' + caller, cpId);
    }
}

function removeEditor() {
    ChatEditorClass.IsActiveEditor = false;
    if ((IFManager.IsAppFrame || IFManager.IsMobileOS) && !IFManager.IsDesktopApp())
    {
        // do nothing here
    }
    else
    {
        lzm_chatInputEditor.removeEditor();
    }
}

function setFocusToEditor() {
    ((IFManager.IsAppFrame || IFManager.IsMobileOS) && !IFManager.IsDesktopApp())
        $('#chat-input').focus();
}

function grabEditorContents(_type) {
    if ((IFManager.IsAppFrame || IFManager.IsMobileOS) && !IFManager.IsDesktopApp())
    {
        return $('#chat-input').val();
    }
    else
    {
        if(d(_type) && _type == 'plaintext')
            return lzm_chatInputEditor.grabText();
        else
            return lzm_chatInputEditor.grabHtml();
    }
}

function setEditorContents(myText) {
    if((IFManager.IsAppFrame || IFManager.IsMobileOS) && !IFManager.IsDesktopApp())
        $('#chat-input').val(myText);
    else
        lzm_chatInputEditor.setHtml(myText)
}

function clearEditorContents(os, browser, caller) {

    if((IFManager.IsAppFrame || IFManager.IsMobileOS) && !IFManager.IsDesktopApp())
    {
        $('#chat-input').val('');
    }
    else
        lzm_chatInputEditor.clearEditor(os, browser);
}

function SetEditorDisplay(_myDisplay) {

    /*if ((IFManager.IsAppFrame || IFManager.IsMobileOS) && !IFManager.IsDesktopApp())
        $('#chat-input').css({display: _myDisplay});
    else*/
        $('#chat-input-body').css({display: _myDisplay});

    /*
    if(_myDisplay != 'block')
        $('#chat-action').css('display', 'none');
    else
        $('#chat-action').css('display', 'block');
        */
}

function moveCaretToEnd(el) {
    if (typeof el.selectionStart == "number") {
        el.selectionStart = el.selectionEnd = el.value.length;
    } else if (typeof el.createTextRange != "undefined") {
        el.focus();
        var range = el.createTextRange();
        range.collapse(false);
        range.select();
    }
}

function insertAtCursor(myField, myValue) {
    myField = document.getElementById(myField);
    //IE support
    if (document.selection) {
        myField.focus();
        var sel = document.selection.createRange();
        sel.text = myValue;

    }
    //MOZILLA and others
    else if (myField.selectionStart || myField.selectionStart == '0') {
        var startPos = myField.selectionStart;
        var endPos = myField.selectionEnd;
        myField.value = myField.value.substring(0, startPos)
            + myValue
            + myField.value.substring(endPos, myField.value.length);
    } else {
        myField.value += myValue;
    }
}

function setMapType(myType) {
    lzm_chatGeoTrackingMap.setMapType(myType);
    lzm_chatGeoTrackingMap.selectedMapType = myType;
    $('#geotracking-footline').html(lzm_displayHelper.createGeotrackingFootline());
}

function zoomMap(direction) {
    lzm_chatGeoTrackingMap.zoom(direction);
}

$(document).ready(function () {

    runningInIframe = (window.self !== window.top);
    lzm_displayHelper = new ChatDisplayHelperClass();
    lzm_inputControls = new CommonInputControlsClass();
    UIRenderer = new UIRendererClass();

    getCredentials();

    lzm_displayHelper.blockUi({message: null});

    IFManager.InitDeviceInterface();

    if (IFManager.IsAppFrame)
    {
        var tmpDeviceId = IFManager.IFLoadDeviceId();
        if (tmpDeviceId != 0)
        {
            deviceId = tmpDeviceId;
        }
    }
    if ((IFManager.IsAppFrame || IFManager.IsMobileOS) && !IFManager.IsDesktopApp())
    {
        var chatInputTextArea = document.getElementById("chat-input");
        chatInputTextArea.onfocus = function() {
            moveCaretToEnd(chatInputTextArea);
            // Work around Chrome issue
            window.setTimeout(function() {
                moveCaretToEnd(chatInputTextArea);
            }, 1);
        };

        if(IFManager.AppOS == IFManager.OS_IOS)
            $('body *').css('cursor','pointer');
    }
    lzm_commonConfig = new CommonConfigClass();
    lzm_commonTools = new CommonToolsClass();
    PermissionEngine = new CommonPermissionClass();
    lzm_commonStorage = new CommonStorageClass(localDbPrefix);
    lzm_chatTimeStamp = new ChatTimestampClass(0);

    var userConfigData = {
        awayAfter: (typeof chosenProfile.user_away_after != 'undefined') ? chosenProfile.user_away_after : 0,
        language: (typeof chosenProfile.language != 'undefined') ? chosenProfile.language : 'en',
        backgroundMode: (typeof chosenProfile.background_mode != 'undefined') ? chosenProfile.background_mode : 1
    };

    lzm_chatInputEditor = new ChatEditorClass('chat-input');
    lzm_chatDisplay = new CommonUIClass(lzm_chatTimeStamp.getServerTimeString(), lzm_commonConfig, lzm_commonTools, lzm_chatInputEditor, messageTemplates, userConfigData, '');
    lzm_commonDialog = new CommonDialogClass();
    DataEngine = new ChatServerEvaluationClass(lzm_commonTools, chosenProfile, lzm_chatTimeStamp);
    CommunicationEngine = new ChatPollServerClass(lzm_commonConfig, lzm_commonTools, lzm_chatDisplay, lzm_commonStorage, chosenProfile, userStatus);
    lzm_t = new CommonTranslationClass(chosenProfile.server_protocol, chosenProfile.server_url, chosenProfile.mobile_dir, false, chosenProfile.language);
    lzm_t.setTranslationData(translationData);
    UserActions = new ChatUserActionsClass(lzm_commonTools, CommunicationEngine, lzm_chatDisplay, DataEngine, lzm_t, lzm_commonStorage, lzm_chatInputEditor, chosenProfile);
    lzm_chatGeoTrackingMap = new ChatGeotrackingMapClass();

    lzmMessageReceiver = function(_event) {
        if (_event.origin == lzm_chatGeoTrackingMap.receiver)
        {
            switch(_event.data.function)
            {
                case 'get-url':
                    lzm_chatGeoTrackingMap.urlIsSet = true;
                    break;
                case 'get-visitor':
                    lzm_chatGeoTrackingMap.selectedVisitor = _event.data.params;
                    VisitorManager.SelectedVisitor = _event.data.params;
                    selectVisitor(null,_event.data.params,true);
                    $('#geotracking-footline').html(lzm_displayHelper.createGeotrackingFootline());
                    break;
                case 'get-zoomlevel':
                    lzm_chatGeoTrackingMap.zoomLevel = _event.data.params;
                    break;
                default:
                    deblog('Unknown message received: ' + JSON.stringify(_event.data));
                    break;
            }
        }
    };
    if (window.addEventListener)
        window.addEventListener('message', lzmMessageReceiver, false);
    else
        window.attachEvent('onmessage', lzmMessageReceiver);

    DataEngine.setUserLanguage(lzm_t.language);
    lzm_chatDisplay.userLanguage = lzm_t.language;
    UserActions.userLanguage = lzm_t.language;

    if (lzm_chatDisplay.viewSelectArray.length == 0)
    {
        lzm_chatDisplay.viewSelectArray = [];
        var viewSelectIdArray = Object.keys(lzm_chatDisplay.allViewSelectEntries);
        for (var i=0; i<viewSelectIdArray.length; i++)
            lzm_chatDisplay.viewSelectArray.push({id: viewSelectIdArray[i], name: lzm_chatDisplay.allViewSelectEntries[viewSelectIdArray[i]].title, icon: lzm_chatDisplay.allViewSelectEntries[viewSelectIdArray[i]].icon});
    }

    lzm_chatDisplay.RenderMainMenuPanel();
    lzm_chatDisplay.UpdateViewSelectPanel();
    lzm_chatDisplay.RenderWindowLayout(false);

    if (LocalConfiguration.TableColumns.visitor.length == 0) {
        LocalConfiguration.CreateTableArray('visitor', 'general', []);
    }
    if (LocalConfiguration.TableColumns.archive.length == 0) {
        LocalConfiguration.CreateTableArray('archive', 'general', []);
    }
    if (LocalConfiguration.TableColumns.ticket.length == 0) {
        LocalConfiguration.CreateTableArray('ticket', 'general', []);
    }
    if (LocalConfiguration.TableColumns.allchats.length == 0)
    {
        LocalConfiguration.CreateTableArray('allchats', 'general', []);
        lzm_commonTools.RemoveElementByProperty(LocalConfiguration.TableColumns.allchats,'cid','type');
    }

    CommunicationEngine.pollServerlogin(CommunicationEngine.chosenProfile.server_protocol,CommunicationEngine.chosenProfile.server_url);

    fillStringsFromTranslation();

    CommonInputControlsClass.SearchBox();

    LoadModuleConfiguration('FeedbacksViewer','');

    ChatTicketClass.m_TicketChannels = [
        {key:'web',index:0,title:tid('web')},
        {key:'email',index:1,title:tid('email')},
        {key:'phone',index:2,title:tid('phone')},
        {key:'misc',index:3,title:tid('misc')},
        {key:'chat',index:4,title:tid('chat')},
        {key:'feedback',index:5,title:tid('feedback')},
        {key:'facebook',index:6,title:tid('facebook')},
        {key:'twitter',index:7,title:tid('twitter')}
    ];

    ChatTicketClass.m_TicketStatuses = [
        {key:'open',index:0,title:tid('ticket_status_0')},
        {key:'in_progress',index:1,title:tid('ticket_status_1')},
        {key:'pending',index:4,title:tid('ticket_status_4')},
        {key:'closed',index:2,title:tid('ticket_status_2')},
        {key:'deleted',index:3,title:tid('ticket_status_3')}
    ];

    $(window).resize(function ()
    {
        if(CommonUIClass.ResizeUITimer==null)
            CommonUIClass.ResizeUITimer = setTimeout(function()
            {
                lzm_chatDisplay.RenderViewSelectPanel();
                lzm_chatDisplay.UpdateViewSelectPanel();
                lzm_chatDisplay.RenderWindowLayout(true);
                lzm_chatDisplay.RenderWindowLayout(false);
                UIRenderer.resizeAll();
                setTimeout(function(){chatScrollDown(2);},10);
                CommonUIClass.ResizeUITimer = null;
            }, 500);
    });

    $('.logout_btn').click(function () {
        logout(true);
    });
    $('#userstatus-button').click(function (e) {
        showUserStatusMenu(e);
    });
    $('#usersettings-button').click(function (e) {
        showUserSettingsMenu(e);
    });
    $('#wishlist-button').click(function() {
        openLink('http://wishlistmobile.livezilla.net/');
    });
    $('.lzm-button').mouseenter(function() {
        $(this).css('background-image', $(this).css('background-image').replace(/linear-gradient\(.*\)/,'linear-gradient(#f6f6f6,#e0e0e0)'));
    });
    $('.lzm-button').mouseleave(function() {
        $(this).css('background-image', $(this).css('background-image').replace(/linear-gradient\(.*\)/,'linear-gradient(#ffffff,#f1f1f1)'));
    });

    $('body').click(function(e) {
        doBlinkTitle = false;
        $('#usersettings-menu').css({'display':'none'});
        lzm_chatDisplay.showUsersettingsHtml = false;
       lzm_chatDisplay.showUserstatusHtml = false;
        lzm_chatDisplay.RemoveAllContextMenus();
        CommonUIClass.CloseUserStatusMenu();
    });

    if(IFManager.IsAppFrame)
    {
        $(window).keydown(function(e) {
            var keyCode = (typeof e.which != 'undefined') ? e.which : e.keyCode;
            if(keyCode == 123)
                IFManager.IFToggleDevTools();
        });
    }

    $('body').keydown(function(e) {

        var controlPressed = e.ctrlKey || e.metaKey;
        var keyCode = (typeof e.which != 'undefined') ? e.which : e.keyCode;

        // email view
        if ($('#email-list').length > 0)
        {
            if(keyCode == 46)
                ChatTicketClass.DeleteEmail();
            else if(controlPressed && keyCode == 65)
            {
                $('tr.email-list-line').addClass('selected-table-line');
                return false;
            }
            else if(keyCode == 40)
                ChatTicketClass.NextEmail();
            else if(keyCode == 38)
                ChatTicketClass.PreviousEmail();
            else if(keyCode == 13 && !$('#create-ticket-from-email').hasClass('ui-disabled'))
                $('#create-ticket-from-email').click();
        }

        if($('#search-ticket').is(":focus"))
            return;
        if($('#main-search-tags-search-field').is(":focus"))
            return;

        // ticket view
        if ($('#ticket-list-body').length > 0 && lzm_chatDisplay.selected_view == 'tickets' && TaskBarManager.GetActiveWindow()==null && !$('#lzm-alert-dialog-container').length)
        {
            if(!CommonInputControlsClass.SearchBox.Focused())
            {
                if(!controlPressed)
                {
                    switch(keyCode) {

                        case 79:
                            changeTicketStatus(0,null,null,null,true);
                            break;
                        case 80:
                            changeTicketStatus(1,null,null,null,true);
                            break;
                        case 67:
                            changeTicketStatus(2,null,null,null,true);
                            break;
                        case 46:
                        case 68:
                            changeTicketStatus(3,null,null,null,true);
                            break;
                        case 69:
                            changeTicketStatus(4,null,null,null,true);
                            break;
                        case 40:
                            ChatTicketClass.HandleTicketClick('next');
                            break;
                        case 38:
                            ChatTicketClass.HandleTicketClick('previous');
                            break;
                        case 82:
                            setTimeout(function(){ChatTicketClass.ReplySelected();},200);
                            break;
                        case 13:
                            ChatTicketClass.OpenSelected();
                            break;
                    }

                }
                else if(keyCode == 65)
                {
                    $('tr.ticket-list-row').addClass('selected-table-line');
                    return false;
                }
            }
        }
    });

    $('#chat-progress').on({
        dragenter: function() {
            KnowledgebaseUI.AddToChat(KnowledgebaseUI.TypeFile);
        },
        scroll: function() {
            var scrpos = $('#chat-progress').scrollTop();
            if(scrpos > 0)
            {
                var winObj = TaskBarManager.GetActiveWindow();
                if(winObj != null && winObj.TypeId == 'chat-window')
                {
                    if(!d(winObj.ScrollPos))
                        winObj.ScrollPos = scrpos;
                    else
                    {
                        var upscroll = winObj.ScrollPos >= scrpos && scrpos < ($('#chat-progress')[0].scrollHeight-50);

                        if(!d(winObj.NoAutoScroll))
                            winObj.NoAutoScroll = 0;

                        if(upscroll)
                            winObj.NoAutoScroll++;
                        else
                            winObj.NoAutoScroll = 0;

                        winObj.ScrollPos = scrpos;
                    }
                }
            }
        }
    });

    $(window).on('beforeunload', function(){
        if (lzm_chatDisplay.askBeforeUnload)
            return t('Are you sure you want to leave or reload the client? You may lose data because of that.');
    });

    if(!IFManager.IsMobileOS)
        setTimeout('ChatPollServerClass.CheckForUpdates();',15000);

});

$.fn.scrollTo = function(_id, _speed) {
    $(this).animate({
        scrollTop:  $(this).scrollTop() - $(this).offset().top + $('#'+_id).offset().top
    }, !d(_speed) ? 1000 : _speed);
    return this;
};
