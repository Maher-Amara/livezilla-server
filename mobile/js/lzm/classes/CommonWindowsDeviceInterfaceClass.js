/****************************************************************************************
 * LiveZilla CommonWindowsDeviceInterfaceClass.js
 *
 * Copyright 2014 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/

function CommonWindowsDeviceInterfaceClass() {
    this.localStorage = null;
    this.deviceId = 0;
    this.backgroundMode = 'none';
    this.loadAllStorageData();
    this.loadPushDeviceId();
    this.loadBackgroundMode();
}

CommonWindowsDeviceInterfaceClass.prototype.jsLog = function (logString) {
    logString = lz_global_base64_encode(logString);
    //var functionString = JSON.stringify({ function: 'jsLog', params: [logString] });
    //window.external.notify(functionString);
    this.callDeviceFunction('jsLog', [logString]);
};

CommonWindowsDeviceInterfaceClass.prototype.loadAllStorageData = function () {
    this.callDeviceFunction('loadIsolatedStorageData', []);
};

CommonWindowsDeviceInterfaceClass.prototype.loadPushDeviceId = function() {
    this.callDeviceFunction('loadPushDeviceId', []);
};

CommonWindowsDeviceInterfaceClass.prototype.loadBackgroundMode = function() {
    this.callDeviceFunction('loadBackgroundMode', []);
};

CommonWindowsDeviceInterfaceClass.prototype.loadStorageItem = function (key) {
    key = lz_global_base64_encode(key);
    var value = null;
    if (this.localStorage != null && typeof this.localStorage[key] != 'undefined') {
        value = lz_global_base64_decode(this.localStorage[key]);
    }
    return value;
};

CommonWindowsDeviceInterfaceClass.prototype.saveStorageItem = function (key, value) {
    key = lz_global_base64_encode(key);
    value = lz_global_base64_encode(value);
    if (this.localStorage == null) {
        this.localStorage = {};
    }
    this.localStorage[key] = value;
    //var functionString = JSON.stringify({ function: 'saveStorageItem', params: [key, value] });
    //window.external.notify(functionString);
    this.callDeviceFunction('saveStorageItem', [key, value]);
};

CommonWindowsDeviceInterfaceClass.prototype.deleteStorageItem = function (key) {
    key = lz_global_base64_encode(key);
    if (this.localStorage == null) {
    } else if (typeof this.localStorage[key] != 'undefined') {
        delete this.localStorage[key];
        //var functionString = JSON.stringify({ function: 'deleteStorageItem', params: [key] });
        //window.external.notify(functionString);
        this.callDeviceFunction('deleteStorageItem', [key]);
    }
};

CommonWindowsDeviceInterfaceClass.prototype.clearLocalStorage = function () {
    this.localStorage = {};
    var functionString = JSON.stringify({ function: 'clearLocalStorage', params: [] });
    this.callDeviceFunction('clearLocalStorage', []);
};

CommonWindowsDeviceInterfaceClass.prototype.playSound = function(soundName) {
    soundName = lz_global_base64_encode(soundName);
    this.callDeviceFunction('playSound', [soundName]);
};

CommonWindowsDeviceInterfaceClass.prototype.downloadCustomSoundFile = function(url, internalName) {
    url = lz_global_base64_encode(url);
    internalName = lz_global_base64_encode(internalName);
    this.callDeviceFunction('downloadCustomSoundFile', [url, internalName]);
};

CommonWindowsDeviceInterfaceClass.prototype.removeCustomSoundFile = function(internalName) {
    internalName = lz_global_base64_encode(internalName);
    this.callDeviceFunction('removeCustomSoundFile', [internalName]);
};

CommonWindowsDeviceInterfaceClass.prototype.playCustomSoundFile = function(internalName, fallbackSound, volume) {
    internalName = lz_global_base64_encode(internalName);
    fallbackSound = lz_global_base64_encode(fallbackSound);
    volume = lz_global_base64_encode(volume);
    this.callDeviceFunction('playCustomSoundFile', [internalName, fallbackSound, volume]);
};

CommonWindowsDeviceInterfaceClass.prototype.showNotification = function(title, bodyText, soundName, sender, receivingChat, type) {
    title = lz_global_base64_encode(title);
    bodyText = lz_global_base64_encode(bodyText);
    soundName = lz_global_base64_encode('DEFAULT');
    sender = lz_global_base64_encode(sender);
    receivingChat = lz_global_base64_encode(receivingChat);
    type = (typeof type != 'undefined') ? lz_global_base64_encode('' + type) : lz_global_base64_encode('');
    this.callDeviceFunction('showNotification', [title, bodyText, soundName, sender, receivingChat, type]);
};

CommonWindowsDeviceInterfaceClass.prototype.setOperatorStatus = function(status) {
    // Do nothing, only a dummy for Android compatibility
};

CommonWindowsDeviceInterfaceClass.prototype.startBackgroundTask = function() {
    this.callDeviceFunction('startBackgroundTask', []);
};

CommonWindowsDeviceInterfaceClass.prototype.switchOrientation = function(newOrientation) {
    newOrientation = lz_global_base64_encode(newOrientation);
    this.callDeviceFunction('switchOrientation', [newOrientation]);
};

CommonWindowsDeviceInterfaceClass.prototype.openExternalBrowser = function(url) {
    url = lz_global_base64_encode(url);
    this.callDeviceFunction('openExternalBrowser', [url]);
};

CommonWindowsDeviceInterfaceClass.prototype.openFile = function(address) {
    address = lz_global_base64_encode(address);
    this.callDeviceFunction('openFil', [address]);
};

CommonWindowsDeviceInterfaceClass.prototype.vibrateDevice = function() {
    this.callDeviceFunction('vibrateDevice', []);
};

CommonWindowsDeviceInterfaceClass.prototype.openLoginView = function() {
    this.callDeviceFunction('openLoginView', []);
};

CommonWindowsDeviceInterfaceClass.prototype.openChatView = function(url, serverVersion) {
    url = lz_global_base64_encode(url);
    serverVersion = lz_global_base64_encode(serverVersion);
    this.callDeviceFunction('openChatView', [url, serverVersion]);
};

CommonWindowsDeviceInterfaceClass.prototype.loadDeviceId = function() {
    return this.deviceId;
};

CommonWindowsDeviceInterfaceClass.prototype.keepActiveInBackgroundMode = function(keepActive) {
    // Do nothing on iOS, only for Android compatibility
};

CommonWindowsDeviceInterfaceClass.prototype.setVibrateOnNotifications = function(vibrate) {
    vibrate = lz_global_base64_encode('' + vibrate);
    this.callDeviceFunction('setVibrateOnNotifications', [vibrate]);
};

/********************************************************************************
 * Callback functions needed for getting device responses
 ********************************************************************************/
CommonWindowsDeviceInterfaceClass.prototype.error = function (paramsString) {
    var myParam = lz_global_base64_decode(JSON.parse(paramsString)['param']);
    this.jsLog(myParam);
};

CommonWindowsDeviceInterfaceClass.prototype.writeIsolatedStorageData = function (paramsString) {
    var myParam = lz_global_base64_decode(JSON.parse(paramsString)['param']);
    this.localStorage = JSON.parse(myParam);
};

CommonWindowsDeviceInterfaceClass.prototype.writePushDeviceId = function(paramsString) {
    var myParam = lz_global_base64_decode(JSON.parse(paramsString)['param']);
    this.deviceId = myParam;
};

CommonWindowsDeviceInterfaceClass.prototype.writeBackgroundMode = function(paramsString) {
    var myParam = lz_global_base64_decode(JSON.parse(paramsString)['param']);
    this.jsLog(myParam);
    this.backgroundMode = myParam;
    if (this.backgroundMode == 'denied') {
        var alertMessage = t('Your LiveZilla app is not allowed to run, while the app is in the background.');
        alertMessage += t('Please change your device\'s Battery Saver settings.') + ' ';
        alertMessage += t('Otherwise you won\'t receive any chats, while your app is in the background.');
        setTimeout(function() {
            lzm_commonDialog.createAlertDialog(alertMessage, [{id: 'ok', name: t('Ok')}]);
            $('#alert-btn-ok').click(function() {
                lzm_commonDialog.removeAlertDialog();
            });
        }, 2000);
    }
};

CommonWindowsDeviceInterfaceClass.prototype.setAppBackground = function(paramsString) {
    var isInBackground = JSON.parse(paramsString)['param'];
    var isInBackgroundText = (isInBackground) ? 'true' : 'false';
    this.jsLog('Set app to background mode: ' + isInBackgroundText);
    if (isInBackground) {
        CommunicationEngine.stopPolling();
        CommunicationEngine.appBackground = 1;
    } else {
        CommunicationEngine.appBackground = 0;
        CommunicationEngine.startPolling();
    }
};

CommonWindowsDeviceInterfaceClass.prototype.openChatFromNotification = function(paramsString) {
    openChatFromNotification(lz_global_base64_decode(JSON.parse(paramsString)['param']), 'push');
    this.jsLog('App is syncing');
};

CommonWindowsDeviceInterfaceClass.prototype.openTicketFromNotification = function(paramsString) {
    var receiving = lz_global_base64_decode(JSON.parse(paramsString)['param0']);
    var type = lz_global_base64_decode(JSON.parse(paramsString)['param1']);
    if (type == '2' || type == '3') {
        SelectView('tickets');
    }
    showAppIsSyncing();
    this.jsLog('App is syncing');
};

CommonWindowsDeviceInterfaceClass.prototype.setAppVersion = function(paramsString) {
    var appVersion = lz_global_base64_decode(JSON.parse(paramsString)['param']);
    lzm_commonConfig.lz_app_version = appVersion;
    this.jsLog('App version set to: ' + appVersion);
};

/********************************************************************************
 * Create iframe and start loading custom url inside to notify the device interface
 ********************************************************************************/
CommonWindowsDeviceInterfaceClass.prototype.callDeviceFunction = function(functionName, params) {
    var functionString = lz_global_base64_url_encode(JSON.stringify({
        function: functionName,
        params: params
    }));
    var url = 'http://jdip.zz/' + functionString;

    $('body').append('<iframe id="windows-device-interface-iframe" style="display: none;" src="' + url + '"></iframe>');
    $('#windows-device-interface-iframe').remove();
};
