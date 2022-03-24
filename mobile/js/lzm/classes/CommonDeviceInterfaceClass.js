/****************************************************************************************
 * LiveZilla CommonDeviceInterfaceClass.js
 *
 * Copyright 2013 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/

function CommonDeviceInterfaceClass() {
    this.functionIndexes = {};
    this.storage = {};
    this.deviceId = '';
    this.loadAllPrefs();
    this.getDeviceIdFromNativeStorage();
}

CommonDeviceInterfaceClass.prototype.debugging = function(someString) {
    someString = lz_global_base64_url_encode(someString);
    this.callDeviceFunction(
        'debugging',
        [someString]
    );
};

CommonDeviceInterfaceClass.prototype.loadAllPrefs = function() {
    var thisClass = this;
    this.callDeviceFunction(
        'loadAllPrefs',
        [],
        function(ret) {
            var foo = ret['result'];
            for (var key in foo) {
                if (foo.hasOwnProperty(key)) {
                    var myKey = key.replace(/^dom_storage_/, '');
                    thisClass.storage[myKey] = foo[key];
                }
            }
            thisClass.jsLog('All prefs loaded');
        }
    );
};

CommonDeviceInterfaceClass.prototype.getDeviceIdFromNativeStorage = function() {
    var thisClass = this;
    this.callDeviceFunction(
        'loadDeviceId',
        [],
        function(ret) {
            var foo = ret['result'];
            thisClass.deviceId = foo;
        }
    )
};

CommonDeviceInterfaceClass.prototype.loadStorageItem = function(key) {
    key = lz_global_base64_url_encode(key);
    var value = this.storage[key];
    value = lz_global_base64_url_decode(value);
    return value;
};

CommonDeviceInterfaceClass.prototype.saveStorageItem = function(key, value) {
    key = lz_global_base64_url_encode(key);
    value = lz_global_base64_url_encode(value);
    this.storage[key] = value;
    this.callDeviceFunction(
        'saveStorageItem',
        [key, value]
    );
};

CommonDeviceInterfaceClass.prototype.deleteStorageItem = function(key) {
    lz_global_base64_url_encode(key);
    delete this.storage[key];
    this.callDeviceFunction(
        'deleteStorageItem',
        [key]
    );
};

CommonDeviceInterfaceClass.prototype.clearLocalStorage = function() {
    var thisClass = this;
    for (var key in this.storage) {
        if (this.storage.hasOwnProperty(key)) {
            delete this.storage[key];
            thisClass.deleteStorageItem(key)
        }
    }
};

CommonDeviceInterfaceClass.prototype.playSound = function(soundName) {
    //this.jsLog(soundName);
    soundName = lz_global_base64_url_encode(soundName);
    this.callDeviceFunction(
        'playSound',
        [soundName]
    );
};

CommonDeviceInterfaceClass.prototype.downloadCustomSoundFile = function(url, internalName) {
    url = lz_global_base64_url_encode(url);
    internalName = lz_global_base64_url_encode(internalName);
    this.callDeviceFunction(
        'downloadCustomSoundFile',
        [url, internalName]
    );
};

CommonDeviceInterfaceClass.prototype.removeCustomSoundFile = function(internalName) {
    internalName = lz_global_base64_url_encode(internalName);
    this.callDeviceFunction(
        'removeCustomSoundFile',
        [internalName]
    );
};

CommonDeviceInterfaceClass.prototype.playCustomSoundFile = function(internalName, fallbackSound, volume) {
    internalName = lz_global_base64_url_encode(internalName);
    fallbackSound = lz_global_base64_url_encode(fallbackSound);
    volume = lz_global_base64_url_encode(volume);
    this.callDeviceFunction(
        'playCustomSoundFile',
        [internalName, fallbackSound, volume]
    );
};

CommonDeviceInterfaceClass.prototype.showNotification = function(title, bodyText, soundName, sender, receivingChat, type) {

    title = lz_global_base64_url_encode(title);
    bodyText = lz_global_base64_url_encode(bodyText);
    soundName = lz_global_base64_url_encode('DEFAULT');
    sender = lz_global_base64_url_encode(sender);
    receivingChat = lz_global_base64_url_encode(receivingChat);
    type = (typeof type != 'undefined') ? lz_global_base64_url_encode('' + type) : lz_global_base64_url_encode('');
    this.callDeviceFunction(
        'showNotification',
        [title, bodyText, soundName, sender, receivingChat, type]
    );
    this.callDeviceFunction(
        'showNotification',
        [title, bodyText, soundName, sender, receivingChat]
    );
};

CommonDeviceInterfaceClass.prototype.setOperatorStatus = function(status) {
    // Do nothing, only a dummy for Android compatibility
};

CommonDeviceInterfaceClass.prototype.startBackgroundTask = function() {
    this.callDeviceFunction(
        'startBackgroundTask',
        [],
        function(ret) {
            try {
                setLocation(ret['result']['latitude'], ret['result']['longitude']);
            } catch(ex) {}
        }
    );
};

CommonDeviceInterfaceClass.prototype.switchOrientation = function(newOrientation) {
    newOrientation = lz_global_base64_url_encode(newOrientation);
    this.callDeviceFunction(
        'switchOrientation',
        [newOrientation]
    );
};

CommonDeviceInterfaceClass.prototype.openExternalBrowser = function(url) {
    url = lz_global_base64_url_encode(url);
    this.callDeviceFunction(
        'openExternalBrowser',
        [url]
    );
};

CommonDeviceInterfaceClass.prototype.openFile = function(address) {
    address = lz_global_base64_url_encode(address);
    this.callDeviceFunction(
        'openFile',
        [address]
    );
};

CommonDeviceInterfaceClass.prototype.vibrateDevice = function() {
    this.callDeviceFunction(
        'vibrateDevice'
    );
};

CommonDeviceInterfaceClass.prototype.openLoginView = function() {
    this.callDeviceFunction(
        'openLoginView'
    );
};

CommonDeviceInterfaceClass.prototype.openChatView = function(url, serverVersion) {
    url = lz_global_base64_url_encode(url);
    serverVersion = lz_global_base64_url_encode(serverVersion);
    this.callDeviceFunction(
        'openChatView',
        [url, serverVersion]
    );
};

CommonDeviceInterfaceClass.prototype.loadDeviceId = function() {
    return this.deviceId;
};

CommonDeviceInterfaceClass.prototype.keepActiveInBackgroundMode = function(keepActive) {
    // Do nothing on iOS, only for Android compatibility
};

CommonDeviceInterfaceClass.prototype.setVibrateOnNotifications = function(vibrate) {
    vibrate = lz_global_base64_url_encode(vibrate);
    this.callDeviceFunction(
        'setVibrateOnNotifications',
        [vibrate]
    );
};

CommonDeviceInterfaceClass.prototype.jsLog = function(logString, mode) {
    logString = (typeof logString != 'undefined') ? logString : '';
    mode = (typeof mode != 'undefined') ? mode : 'log';
    logString = lz_global_base64_url_encode(logString);
    mode = lz_global_base64_url_encode(mode);
    this.callDeviceFunction(
        'jsLog',
        [logString, mode]
    );
};


/********************************************** Functions needed internally *******************************************/
CommonDeviceInterfaceClass.prototype.callDeviceFunction = function(thisFunction, thisArguments, onSuccess, onError) {
    var url = "jdip://";

    var functionObject = {};
    functionObject.thisFunction = thisFunction;

    if (onSuccess) {
        if (typeof onSuccess == 'function')
        {
            functionObject.onSuccess = this.createCallbackFunction(thisFunction + "OnSuccess", onSuccess);
        }
        else
        {
            functionObject.onSuccess = onSuccess;
        }
    }

    if (onError)
    {
        if (typeof onError == 'function')
        {
            functionObject.onError = this.createCallbackFunction(thisFunction + "OnError", onError);
        }
        else
            functionObject.onError = onError;
    }

    if (thisArguments) {
        functionObject.arguments = thisArguments;
    }

    url += JSON.stringify(functionObject);

    var thisIframe = this.createIframe(url);

    try
    {
        thisIframe.parentNode.removeChild(thisIframe);
    }
    catch(ex)
    {
        // Do nothing...
    }
};

CommonDeviceInterfaceClass.prototype.createCallbackFunction = function(thisFunction, thisCallback) {
    if (thisCallback && thisCallback.name != null && thisCallback.name.length > 0)
    {
        return thisCallback.name;
    }
    else if (typeof window[thisFunction+0] != 'function') {
        window[thisFunction+0] = thisCallback;
        this.functionIndexes[thisFunction] = 0;
        return thisFunction+0

    } else {
        var thisMaxIndex = this.functionIndexes[thisFunction];
        for (var i=0; i<=thisMaxIndex; i++) {
            var tmpName = thisFunction + i;
            if (window[tmpName].toString() == thisCallback.toString()) {
                return tmpName;
            }
        }

        this.functionIndexes[thisFunction]++;
        var newIndex = this.functionIndexes[thisFunction];
        window[thisFunction+newIndex] = thisCallback;
        return thisFunction+newIndex;
    }
};

CommonDeviceInterfaceClass.prototype.createIframe = function(url) {
    var deviceBridgeIframe = document.createElement('IFRAME');
    deviceBridgeIframe.setAttribute('src', url);
    document.documentElement.appendChild(deviceBridgeIframe);
    return deviceBridgeIframe;
};
