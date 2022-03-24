function IFManager() {}

IFManager.OS_IOS = 'ios';
IFManager.OS_ANDROID = 'android';
IFManager.OS_BB = 'blackberry';
IFManager.OS_WINDOWSPHONE = 'windows';
IFManager.OS_MAC = 'desk_mac';
IFManager.OS_WINDOWS = 'desk_win';
IFManager.OS_LINUX = 'desk_linux';

IFManager.IsAppFrame = true;
IFManager.IsMobileOS = false;
IFManager.IsTabletOS = false;
IFManager.ExitApp = false;
IFManager.IsAutoStart = true;

IFManager.AppOS = IFManager.OS_WINDOWS;
IFManager.DeviceInterface = null;
IFManager.SoundPlayers = {};

IFManager.AppInstallPrompt = null;

IFManager.IsDesktopApp = function(_checkVal) {

    if (!d(_checkVal)) {
        _checkVal = IFManager.AppOS;
        if (!IFManager.IsAppFrame) {
            return false;
        }
    }
    return _checkVal == IFManager.OS_MAC || _checkVal == IFManager.OS_WINDOWS || _checkVal == IFManager.OS_LINUX;
};

IFManager.IsPWAStandalone = function() {
    try
    {
        var isInWebAppiOS = (window.navigator.standalone == true);
        var isInWebAppChrome = (window.matchMedia('(display-mode: standalone)').matches);
        return isInWebAppiOS || isInWebAppChrome;
    }
    catch(ex)
    {
        return false;
    }
};

IFManager.IFError = function(_code, _exception) {
    alert(_code + ':' + _exception.message);
};

IFManager.InitDeviceInterface = function(_code, _exception) {
    if (IFManager.IsAppFrame && IFManager.DeviceInterface === null) {
        if (IFManager.AppOS == IFManager.OS_WINDOWSPHONE) {
            IFManager.DeviceInterface = new CommonWindowsDeviceInterfaceClass();
        } else if (IFManager.AppOS.indexOf('desk_') === 0) {
            IFManager.DeviceInterface = new window.top.DesktopDeviceInterfaceClass();
            IFManager.ScreenshotTargetWorkaround();
            IFManager.NotificationFixWorkaround();
        } else if (IFManager.AppOS == IFManager.OS_ANDROID) {
            IFManager.DeviceInterface = lzm_deviceInterface;
        } else if (IFManager.AppOS == IFManager.OS_IOS) {
            IFManager.DeviceInterface = new CommonDeviceInterfaceClass();
        }
    }
};

IFManager.IFLog = function(_str, _type) {
    try {
        if (IFManager.DeviceInterface !== null && d(IFManager.DeviceInterface.jsLog)) {
            IFManager.DeviceInterface.jsLog(_str, _type);
        }
    } catch (ex) {
        IFManager.IFError(10.1, ex);
    }
};

IFManager.IFStartBackgroundTask = function() {
    try {
        if (IFManager.DeviceInterface !== null && d(IFManager.DeviceInterface.startBackgroundTask)) {
            IFManager.DeviceInterface.startBackgroundTask();
        }
    } catch (ex) {
        IFManager.IFError(10.2, ex);
    }
};

IFManager.IFOpenExternalBrowser = function(_url) {
    try {
        if (IFManager.IsAppFrame && IFManager.DeviceInterface !== null && d(IFManager.DeviceInterface.openExternalBrowser)) {
            IFManager.DeviceInterface.openExternalBrowser(_url);
        } else {
            window.open(_url, '_blank');
        }
    } catch (ex) {
        IFManager.IFError(10.3, ex);
    }
};

IFManager.IFDownloadFile = function(_url) {
    try {
        if (IFManager.IsAppFrame && IFManager.DeviceInterface !== null && d(IFManager.DeviceInterface.openFile)) {
            IFManager.DeviceInterface.openFile(_url);
        }
        else
        {
            if(!IFManager.IsAppFrame)
                window.open(_url, '_blank');
            else
            {
                $('<iframe>').attr('src', _url).appendTo('body').load(function() {
                    $(this).remove();
                });
            }
        }
    } catch (ex) {
        IFManager.IFError(10.4, ex);
    }
};

IFManager.IFShowNotification = function(_title, _bodyText, _soundName, _sender, _systemId, _type) {

    try
    {
        if (IFManager.IsAppFrame && IFManager.DeviceInterface !== null && d(IFManager.DeviceInterface.showNotification)) {

            IFManager.DeviceInterface.showNotification(_title, _bodyText, _soundName, _sender, _systemId, _type);
        }
    }
    catch (ex)
    {
        IFManager.IFError(10.5, ex);
    }
};

IFManager.IFSetOperatorStatus = function(_status) {
    try {
        if (IFManager.DeviceInterface !== null && d(IFManager.DeviceInterface.setOperatorStatus)) {
            IFManager.DeviceInterface.setOperatorStatus(_status.toString());
        }
    } catch (ex) {
        IFManager.IFError(10.18, ex);
    }
};

IFManager.IFSetToolTipCounts = function(_tooltipInfo){
    try {
        if (IFManager.DeviceInterface !== null && d(IFManager.DeviceInterface.setTooltipCounts)) {
            IFManager.DeviceInterface.setTooltipCounts(_tooltipInfo);
        }
    } catch (ex) {
        IFManager.IFError(10.18, ex);
    }
};

IFManager.IFInitPhoneCall = function(_protocol, _number) {
    try
    {
        if (IFManager.IsAppFrame && IFManager.DeviceInterface !== null && d(IFManager.DeviceInterface.startPhoneCall))
        {
            IFManager.DeviceInterface.startPhoneCall(_protocol, _number);
        }
        else if (!IFManager.IsAppFrame && !IFManager.IsMobileOS)
        {
            _protocol = (_protocol == 'skype:') ? 'skype:' : 'tel:';
            _number = (_protocol == 'skype:') ? _number + '?call' : _number;
            IFManager.IFOpenExternalBrowser(_protocol + _number);
        }
        else
        {
            var id = lzm_commonTools.guid();
            $("#chat_page").append("<iframe id='" + id + "' style='visibility:hidden;' width='1' height='1' frameborder='0' scrolling='no' marginheight='0' marginwidth='0' src='" + _protocol + _number + "'></iframe>");
            setTimeout('$(\'#' + id + '\').remove()', 60000);
        }
    }
    catch (ex)
    {
        IFManager.IFError(10.7, ex);
    }
};

IFManager.IFLoadDeviceId = function() {
    try {
        if (IFManager.DeviceInterface !== null && d(IFManager.DeviceInterface.loadDeviceId)) {
            return IFManager.DeviceInterface.loadDeviceId();
        }
    } catch (ex) {
        IFManager.IFError(10.8, ex);
    }
    return 0;
};

IFManager.IFKeepActiveInBackgroundMode = function(_keep) {
    try {
        if (IFManager.DeviceInterface !== null && d(IFManager.DeviceInterface.keepActiveInBackgroundMode)) {
            IFManager.DeviceInterface.keepActiveInBackgroundMode(_keep);
        }
    } catch (ex) {
        IFManager.IFError(10.9, ex);
    }
};

IFManager.IFOpenLoginView = function() {
    try {
        if (IFManager.DeviceInterface !== null && d(IFManager.DeviceInterface.openLoginView)) {
            if (d(IFManager.DeviceInterface.exitApplication) && IFManager.ExitApp) {
                IFManager.DeviceInterface.exitApplication();
            } else {
                IFManager.DeviceInterface.openLoginView();
            }
        }
    } catch (ex) {
        IFManager.IFError(10.10, ex);
    }
};

IFManager.IFPlaySound = function(_name, _volume) {

    var surl = '';
    try
    {

        if (!IFManager.IsDesktopApp() && IFManager.DeviceInterface !== null && d(IFManager.DeviceInterface.playSound))
        {
            IFManager.DeviceInterface.playSound(_name, _volume);
        }
        else
        {
            var ___getConfigKey = function(_name){
                if(_name == 'visitor')
                    return 'gl_sovi';
                if(_name == 'ringtone')
                    return 'gl_sori';
                if(_name == 'message')
                    return 'gl_some';
                if(_name == 'queue')
                    return 'gl_soqu';
                if(_name == 'ticket')
                    return 'gl_soti';
                return '';
            };

            surl = DataEngine.getServerUrl('');
            var soundFile = DataEngine.getConfigValue(___getConfigKey(_name),false);
            surl = surl + 'sound/' + soundFile + '.mp3';

            if(soundFile == 'custom')
                surl = DataEngine.getConfigValue(___getConfigKey(_name)+'_url',false);

            if(!d(IFManager.SoundPlayers[surl]))
                IFManager.SoundPlayers[surl] = new Audio(surl);
            else
            {
                //IFManager.SoundPlayers[surl].pause();
                //IFManager.SoundPlayers[surl].currentTime = 0;
            }

            //var ap = new Audio(surl);
            console.log(surl);
            IFManager.SoundPlayers[surl].volume = _volume;
            IFManager.SoundPlayers[surl].play();
        }
    }
    catch (ex)
    {
        console.log(surl);
        IFManager.IFError(10.11, ex);
    }
};

IFManager.IFSetVibrateOnNotifications = function(_vib) {
    try {
        if (IFManager.DeviceInterface !== null && d(IFManager.DeviceInterface.setVibrateOnNotifications)) {
            IFManager.DeviceInterface.setVibrateOnNotifications(_vib);
        }
    } catch (ex) {
        IFManager.IFError(10.12, ex);
    }
};

IFManager.IFLoadStorageItem = function(_key) {
    try {
        if (IFManager.DeviceInterface !== null && d(IFManager.DeviceInterface.loadStorageItem)) {
            return IFManager.DeviceInterface.loadStorageItem(_key);
        } else {
            return window.localStorage.getItem(_key);
        }
    } catch (ex) {
        IFManager.IFError(10.13, ex);
    }
    return null;
};

IFManager.IFSaveStorageItem = function(_key, _value) {
    try {
        if (IFManager.DeviceInterface !== null && d(IFManager.DeviceInterface.saveStorageItem)) {
            IFManager.DeviceInterface.saveStorageItem(_key, _value);
        } else {
            window.localStorage.setItem(_key, _value);
        }
    } catch (ex) {
        IFManager.IFError(10.14, ex);
    }
};

IFManager.IFDeleteStorageItem = function(_key) {
    try {
        if (IFManager.DeviceInterface !== null && d(IFManager.DeviceInterface.deleteStorageItem)) {
            IFManager.DeviceInterface.deleteStorageItem(_key);
        }
        else
        {
            window.localStorage.removeItem(_key);
        }
    } catch (ex) {
        //IFManager.IFError(10.15, ex, ex.message);
    }
};

IFManager.IFClearStorageItem = function() {
    try {
        if (IFManager.DeviceInterface !== null && d(IFManager.DeviceInterface.clearLocalStorage)) {
            IFManager.DeviceInterface.clearLocalStorage();
        } else {
            window.localStorage.clear();
        }
    } catch (ex) {
        IFManager.IFError(10.16, ex, ex.message);
    }
};

IFManager.IFExitApplication = function() {
    try {
        if (IFManager.DeviceInterface !== null && d(IFManager.DeviceInterface.exitApplication)) {
            IFManager.DeviceInterface.exitApplication();
        }
    } catch (ex) {
        IFManager.IFError(10.17, ex);
    }
};

IFManager.IFSetAutoStart = function(_active) {
    try {
        if (IFManager.DeviceInterface !== null && d(IFManager.DeviceInterface.setAutoStart)) {
            IFManager.DeviceInterface.setAutoStart(_active);
        }
    } catch (ex) {
        IFManager.IFError(10.19, ex);
    }
};

IFManager.IFToggleDevTools = function() {
    try {
        if (IFManager.DeviceInterface !== null && d(IFManager.DeviceInterface.toggleDevTools)) {
            IFManager.DeviceInterface.toggleDevTools();
        }
    } catch (ex) {
        IFManager.IFError(10.20, ex);
    }
};

IFManager.IFDoAutoLogin = function() {
    if (typeof(doAutoLogin) != 'undefined') {
        alert('doAutoLogin found');
    }
};

IFManager.IFSetSpellCheck = function(_language) {
    try {
        if (IFManager.DeviceInterface !== null && d(IFManager.DeviceInterface.setSpellCheck)) {
            IFManager.DeviceInterface.setSpellCheck(_language);
        }
    } catch (ex) {
        IFManager.IFError(10.21, ex);
    }
};

IFManager.IFSetUserLanguages = function() {
    try {
        if (IFManager.DeviceInterface !== null && d(IFManager.DeviceInterface.setUserLanguages)) {
            IFManager.DeviceInterface.setUserLanguages();
        }
    } catch (ex) {
        IFManager.IFError(10.22, ex);
    }
};

IFManager.IFSetExcludedWords = function() {
    try {
        if (IFManager.DeviceInterface !== null && d(IFManager.DeviceInterface.setExcludedWords)) {
            IFManager.DeviceInterface.setExcludedWords();
        }
    } catch (ex) {
        IFManager.IFError(10.23, ex);
    }
};

IFManager.IFScreenCast = function(_tab,_id) {
    try {
        if (IFManager.DeviceInterface !== null && d(IFManager.DeviceInterface.screenshot)) {
            IFManager.DeviceInterface.screenshot(_tab,_id);
        }
    } catch (ex) {
        IFManager.IFError(10.24, ex);
    }
};

IFManager.IFTranslationData = function(_translationClassInstance) {
    try {
        if (IFManager.DeviceInterface !== null && d(IFManager.DeviceInterface.translationDataFromServer)) {
            IFManager.DeviceInterface.translationDataFromServer(_translationClassInstance);
        }
    } catch (ex) {
        IFManager.IFError(10.25, ex);
    }
};

IFManager.IFLocalConfigurationUpdated = function(_localConfiguration) {
    try {
        if (IFManager.DeviceInterface !== null && d(IFManager.DeviceInterface.updateLocalConfiguration)) {
            IFManager.DeviceInterface.updateLocalConfiguration(_localConfiguration);
        }
    } catch (ex) {
        IFManager.IFError(10.26, ex);
    }
};

IFManager.IFPrintContent = function(_content) {
    try {
        if (IFManager.DeviceInterface !== null && d(IFManager.DeviceInterface.print)) {
            IFManager.DeviceInterface.print(_content);
        }
    } catch (ex) {
        IFManager.IFError(10.27, ex);
    }
};

IFManager.IFRemoveAllNotifications = function(_type){
    try {
        if (IFManager.DeviceInterface !== null && d(IFManager.DeviceInterface.removeAllNotifications)) {
            IFManager.DeviceInterface.removeAllNotifications(_type);
        }
    } catch (ex) {
        IFManager.IFError(10.28, ex);
    }
};

IFManager.IFGotLoggedOff = function(){
    try {
        if (IFManager.DeviceInterface !== null && d(IFManager.DeviceInterface.gotLoggedOff)) {
            IFManager.DeviceInterface.gotLoggedOff();
        }
    } catch (ex) {
        IFManager.IFError(10.29, ex);
    }
};

// events
IFManager.IFOnFocus = function(){
};

IFManager.IFOnExit = function() {
    if (typeof(logout) != 'undefined' && !IFManager.ExitApp) {
        IFManager.ExitApp = true;
        logout(true, false);
    } else {
        IFManager.IFExitApplication();
    }
};

IFManager.IFOnIdleTime = function(_timeSeconds){
    if(_timeSeconds < LocalConfiguration.IdleTime ){
        IFManager.idling = false;
        if(d(IFManager.BeforeIdleStatus)){
            setUserStatus(parseInt(IFManager.BeforeIdleStatus));
        }
    }else if(!IFManager.idling){
        if(LocalConfiguration.IdleTimeTarget == 2){
            logout(false, false);
        }
        IFManager.BeforeIdleStatus = ChatPollServerClass.__UserStatus;
        IFManager.idling = true;
        setUserStatus(parseInt(LocalConfiguration.IdleTimeTarget));
    }else {
        // display idleTime somewhere;
    }
};

IFManager.IFOnNotificationSettingsClicked = function(){
    LocalConfiguration.__ShowClientSettings(new Event('click'));
    $('#settings-placeholder-tab-1').click();
};

IFManager.IFOnNotificationClicked = function(_title, _bodyText, _soundName, _sender, _receivingChat, _type, _dontShowThisAgain) {
    if (_dontShowThisAgain && typeof(LocalConfiguration != 'undefined')) {
        if (_type == '0' || _type == '1')
            LocalConfiguration.NotificationChats = false;
        else if (_type == '2')
            LocalConfiguration.NotificationTickets = false;
        else if (_type == '3')
            LocalConfiguration.NotificationEmails = false;
        else if (_type == '4')
            LocalConfiguration.NotificationFeedbacks = false;
        else if (_type == '5')
            LocalConfiguration.NotificationOperators = false;
        else if (_type == '6')
            LocalConfiguration.NotificationVisitors = false;
        LocalConfiguration.Save();

    }
    else if (_type == '0' || _type == '1')
    {
        if (typeof(SelectView) != 'undefined' && typeof(OpenChatWindow) != 'undefined')
        {
            var chatToOpen = _sender;
            if(DataEngine.groups.getGroup(_receivingChat) != null || _receivingChat == 'everyoneintern')
                chatToOpen = _receivingChat;
            SelectView('mychats');
            OpenChatWindow(chatToOpen);
            lzm_chatInputEditor.focus();
        }
    }
    else if (_type == '2')
    {
        if (typeof(SelectView) != 'undefined') {
            SelectView('tickets');
        }
    } else if (_type == '3') {
        if (PermissionEngine && PermissionEngine.checkUserPermissions && typeof(toggleEmailList) != 'undefined' && PermissionEngine.checkUserPermissions('', 'tickets', 'review_emails', {})) {
            toggleEmailList();
        } else if (typeof(showNoPermissionMessage) != 'undefined') {
            showNoPermissionMessage();
        }
    } else if (_type == '4') {
        if (typeof(initFeedbacksConfiguration) != 'undefined') {
            initFeedbacksConfiguration();
        }
    } else if (_type == '5') {
        if (typeof(SelectView) != 'undefined') {
            SelectView('internal');
        }
    } else if (_type == '6') {
        if (typeof(SelectView) != 'undefined') {
            SelectView('external');
            selectVisitor(undefined, _sender, true);
        }
    }
};

IFManager.IFOnSetStatus = function(_status){
    if (typeof(setUserStatus) != 'undefined' && typeof(logout) != 'undefined') {
        if (_status == 2) {
            logout(true, false);
        } else {
            setUserStatus(_status);
        }
    } else if (_status != 2) {
        $("#user_status").val(_status);
    }
};

IFManager.IFOnUpdateIsAutoStart = function(_status){
    IFManager.IsAutoStart = _status;
};

IFManager.IFOnActiveLanguageChanged = function(_locale){
    if(typeof(window.top.SpellCheck) != 'undefined'){
        window.top.SpellCheck.OnActiveLanguageChanged(_locale);
        LocalConfiguration.ActiveLanguage = _locale;
        LocalConfiguration.SaveValue('usr_activelanguage_', LocalConfiguration.ActiveLanguage);
    }
};

IFManager.IFOnAvailableLanguages = function(_languages){
    if(typeof(window.top.SpellCheck) != 'undefined'){
        window.top.SpellCheck.AvailableLanguages = _languages;
    }
};

IFManager.IFOnGetConnectionData = function(){
    var serverUrl = CommunicationEngine.chosenProfile.server_protocol + CommunicationEngine.chosenProfile.server_url + '/server.php?acid=' + lzm_commonTools.pad(Math.floor(Math.random() * 1048575).toString(16), 5);
    var postData = CommunicationEngine.fillDataObject();
    postData.p_user_status = 2;
    var msgObj = {
        serverUrl: serverUrl,
        postData: postData
    };
    try {
        if (IFManager.DeviceInterface !== null && d(IFManager.DeviceInterface.connectionData)) {
            IFManager.DeviceInterface.connectionData(msgObj);
        }
    } catch (ex) {
        IFManager.IFError(10.27, ex);
    }
};

IFManager.IFOnTrayAction = function(_status){
    if(_status == 'email'){
        SelectView('tickets');
    }else {
        SelectView('mychats');
    }
};

IFManager.IFOnChangeFile = function(_file){
    changeFile(_file);
    setTimeout(function(){
        var saveNewQrdButton = $("#kb-entry-save");
        saveNewQrdButton.click();
    },100);
}

IFManager.IFOnOpenScreenShotTarget = function(_selectedView, _viewSpecificData){
    try {
        $('.dialog-window-container').click();
    } catch (e){

    }
    switch(_selectedView){
        case 'ticket-reply':
            if(!($('#ticket-details-container').length)){
                SelectView('tickets');
                ChatTicketClass.__ShowTicket(_viewSpecificData.ticket.id, true, '', '', '');
                $(document).find('#reply-ticket-details').click();
                $(document).find('#reply-placeholder-tab-1').click();
                ticketReplyAddAttachmentFile(_viewSpecificData);
            }
            else
            {
                ticketReplyAddAttachmentFile({screenshot:true, data:_viewSpecificData});
            }
            break;
        case 'knowledgebase':
            SelectView('qrd');
            KnowledgebaseUI.HandleResourceClickEvents(_viewSpecificData);
            KnowledgebaseUI.ShowEntry(null, KnowledgebaseUI.TypeFile);
            break;
        case 'chat':
            TaskBarManager.ClickElement(_viewSpecificData);
            KnowledgebaseUI.AddToChat(KnowledgebaseUI.TypeFile);
            break;
    }
};

IFManager.ScreenshotTargetWorkaround = function(){
    setTimeout(function(){
        window.top.AppFrameCommunicator.removeListener('openScreenShotTarget',window.top.AppFrameCommunicator.listeners('openScreenShotTarget')[0]);

        window.top.AppFrameCommunicator.on('openScreenShotTarget', function (event, _msgData){
            IFManager.IFOnOpenScreenShotTarget(_msgData.tab, _msgData.id);
        });
    },2000);
};

/*
* !!! Warning! Message with key 'serverVersion' is bugged and deprecated. Do not use it and do not change this workaround. This workaround lets desktop apps use correct notification module.
 */
IFManager.NotificationFixWorkaround = function() {
    try {
        require('electron').ipcRenderer.send('serverVersion', '7.0.8.0');
    } catch (e) {
        console.log('NotificationFixWorkaround failed.');
        console.log(e);
    }
};

IFManager.PromptAPPInstall = function(){

    if(IFManager.PromptAPPInstall)
    {
        IFManager.AppInstallPrompt.prompt();
        IFManager.AppInstallPrompt.userChoice.then((choiceResult) => {window.AppInstallPrompt = null;});
    }
};
