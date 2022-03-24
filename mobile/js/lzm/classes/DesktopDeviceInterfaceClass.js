/****************************************************************************************
 * LiveZilla DesktopDeviceInterfaceClass.js
 *
 * Copyright 2013 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/

var INFRAME = (self != top);

function DesktopDeviceInterfaceClass() {

    this.storage = {};
    this.deviceId = '';
    this.getDeviceId();
    this.distributeTranslationData();
    this.sayAutoLogin();
    if (INFRAME) {
        this.getAvailableLanguages();
        window.top.SpellCheck.Initialize();
    }
    this.exitOnLogout = false;
}
var ipcRenderer;
if (!INFRAME) {
    ipcRenderer = require('electron').ipcRenderer; // event emmitter for communication with main electron prozess
    // ipcRenderer.removeAllListeners();
    ipcRenderer.on('IFMessage', function(event, _name, _msgObj) {
        DesktopDeviceInterfaceClass.handleIFMessages(_name, _msgObj);
    });
}

DesktopDeviceInterfaceClass.handleIFMessages = function(_name, _msgObj) {
    if (_msgObj) {
        _msgObj = lz_global_base64_url_decode(_msgObj);
        try {
            _msgObj = JSON.parse(_msgObj);
        } catch (e) {
            jsLog("Error parsing:" + _msgObj.toString());
        }
    }
    switch (_name) {
        case "jsLog":
            console.log('got msg from Main: ' + _msgObj.msg);
            break;
        case "availableLanguages":
            IFManager.IFOnAvailableLanguages(_msgObj.availableLanguages);
            break;
        case "CallbackSpellCheckLanguageWasChanged":
            IFManager.IFOnActiveLanguageChanged(_msgObj.language);
            break;
        case "onDeviceID":
            IFManager.DeviceInterface.deviceId = _msgObj.macaddr;
            break;
        case 'onExit':
            IFManager.IFOnExit();
            break;
        case "onNotificationClicked":
            IFManager.IFOnNotificationClicked(_msgObj.title, _msgObj.bodyText, _msgObj.soundName, _msgObj.sender, _msgObj.receivingChat, _msgObj.type, _msgObj.dontShowThisAgain);
            break;
        case "onSetStatus":
            var status;
            switch (_msgObj.state) {
                case 'online':
                    status = 0;
                    break;
                case 'busy':
                    status = 1;
                    break;
                case 'offline':
                    status = 2;
                    break;
                case 'away':
                    status = 3;
                    break;
                case 'chat':
                    status = 4;
                    break;
                case 'email':
                    status = 5;
                    break;
                default:
            }
            IFManager.IFOnSetStatus(status);
            break;
        case 'onUpdateIsAutoStart':
            IFManager.IFOnUpdateIsAutoStart(_msgObj.active);
            break;
        case 'castError':
            throw new Error(_msgObj.msg);
        default:
            if(typeof(_name) != 'undefined'){
                //throw new Error("Command " + _name + " is not available. Your LiveZilla app does not fully support your LiveZilla server installation.");
            }
    }
};

if (INFRAME) {
    window.addEventListener('message', function(event) {
        var name = event.data[0];
        if(event.data.length > 1){
            var msgObj = event.data[1];
            DesktopDeviceInterfaceClass.handleIFMessages(name, msgObj);
        }else{
            DesktopDeviceInterfaceClass.handleIFMessages(name);
        }
    });
}


DesktopDeviceInterfaceClass.prototype.exitApplication = function() {
    this.sendIFMessage('exitApplication');
};

DesktopDeviceInterfaceClass.prototype.distributeTranslationData = function() {
    if (typeof(detectedLanguage) != 'undefined') {
        var msgObj = {
            'detectedLanguage': detectedLanguage,
            'translationData': translationData
        };
        this.sendIFMessage('translationData', msgObj);
    } else {
        setTimeout(function() {
            if (typeof(detectedLanguage) != 'undefined') {
                var msgObj = {
                    'detectedLanguage': detectedLanguage,
                    'translationData': translationData
                };
                this.sendIFMessage('translationData', msgObj);
            }
        }, 500);
    }
};

DesktopDeviceInterfaceClass.prototype.translationDataFromServer = function(_translationClassInstance) {
    this.sendIFMessage('translationDataFromServer', {'translationClassInstance': _translationClassInstance});
};

DesktopDeviceInterfaceClass.prototype.getAvailableLanguages = function() {
    this.sendIFMessage('getAvailableLanguages');
};

DesktopDeviceInterfaceClass.prototype.getDeviceId = function() {
    this.sendIFMessage('getDeviceId');
};

DesktopDeviceInterfaceClass.prototype.jsLog = function(_logString, _mode) {
    var msgObj = {
        "logString": _logString,
        "mode": _mode
    };
    this.sendIFMessage('jsLog', msgObj);
};

DesktopDeviceInterfaceClass.prototype.setExcludedWords = function() {
    if (typeof(window.top.SpellCheck.ExcludedWords) != 'undefined') {
        LocalConfiguration.ExcludedWords = window.top.SpellCheck.ExcludedWords;
    	LocalConfiguration.SaveValue('usr_excluded_words_', LocalConfiguration.ExcludedWords);
        var msgObj = {
            'excludedWords': window.top.SpellCheck.ExcludedWords,
            'noLongerExcludedWords': window.top.SpellCheck.NoLongerExcludedWords
        };
        this.sendIFMessage('setExcludedWords', msgObj);
    }
};

DesktopDeviceInterfaceClass.prototype.setUserLanguages = function() {
    if (typeof(window.top.SpellCheck.UserLanguages) != 'undefined') {
        LocalConfiguration.UserLanguages = window.top.SpellCheck.UserLanguages;
    	LocalConfiguration.SaveValue('usr_languages_', LocalConfiguration.UserLanguages);
        var msgObj = {
            'userLanguages': window.top.SpellCheck.UserLanguages
        };
        this.sendIFMessage('setUserLanguages', msgObj);
    } else {
        setTimeout(function() {
            if (typeof(window.top.SpellCheck.UserLanguages) != 'undefined' && window.top.SpellCheck.UserLanguages.length > 0) {
                var msgObj = {
                    'userLanguages': window.top.SpellCheck.UserLanguages
                };
                this.sendIFMessage('setUserLanguages', msgObj);
            } else {
                //   throw new Error('failed to setUserLanguages');
            }
        }, 300);
    }
};

DesktopDeviceInterfaceClass.prototype.screenshot = function() {
    this.sendIFMessage('screenshot');
};

DesktopDeviceInterfaceClass.prototype.loadDeviceId = function() {
    return this.deviceId;
};

DesktopDeviceInterfaceClass.prototype.openChatView = function(_url, _serverVersion) {
    // msgObj={'url':_url, 'serverVersion':_serverVersion};
    // this.sendIFMessage('openChatView', msgObj);
};

DesktopDeviceInterfaceClass.prototype.openExternalBrowser = function(_url) {
    var msgObj = {
        'url': _url
    };
    this.sendIFMessage('openExternalBrowser', msgObj);
};

DesktopDeviceInterfaceClass.prototype.openLoginView = function() {
    this.sendIFMessage('openLoginView');
};

DesktopDeviceInterfaceClass.prototype.sayAutoLogin = function() {
    autoLoginEntry = window.localStorage.getItem('auto_login');
    var autoLogin = (autoLoginEntry === null) ? false : (window.localStorage.getItem('auto_login').toString() === '1');
    var msgObj = {
        'autoLogin': autoLogin
    };
    this.sendIFMessage('sayAutoLogin', msgObj);
};

DesktopDeviceInterfaceClass.prototype.sendIFMessage = function(_name, _msgObj) {
    if (_msgObj) {
        _msgObj = JSON.stringify(_msgObj);
        _msgObj = lz_global_base64_url_encode(_msgObj);
        if (INFRAME) {
            window.top.postMessage([_name, _msgObj], '*');
        } else {
            ipcRenderer.send('IFMessage', _name, _msgObj);
        }
    } else {
        if (INFRAME) {
            window.top.postMessage([_name], '*');
        } else {
            ipcRenderer.send('IFMessage', _name);
        }
    }
};

DesktopDeviceInterfaceClass.prototype.setAutoStart = function(_active) {
    var msgObj = {
        'active': _active
    };
    this.sendIFMessage('setAutoStart', msgObj);
};

DesktopDeviceInterfaceClass.prototype.setOperatorStatus = function(_status) {
    var statusString;
    switch (_status) {
        case "0":
            statusString = 'online';
            break;
        case "1":
            statusString = 'busy';
            break;
        case "2":
            statusString = 'offline';
            break;
        case "3":
            statusString = 'away';
            break;
        case "4":
            statusString = 'chat';
            break;
        case "5":
            statusString = 'email';
            break;
        default:
    }
    var msgObj = {
        'state': statusString
    };
    this.sendIFMessage('setOperatorStatus', msgObj);
};

DesktopDeviceInterfaceClass.prototype.setSpellCheck = function(_language) {
    var msgObj = {
        'language': _language
    };
    this.sendIFMessage('setSpellCheck', msgObj);
};

DesktopDeviceInterfaceClass.prototype.showNotification = function(_title, _bodyText, _soundName, _sender, _receivingChat, _type) {
    var msgObj = {
        'notificationTitle': _title,
        'bodyText': _bodyText,
        'soundName': _soundName,
        'sender': _sender,
        'receivingChat': _receivingChat,
        'type': _type
    };
    this.sendIFMessage('showNotification', msgObj);
};

DesktopDeviceInterfaceClass.prototype.toggleDevTools = function() {
    this.sendIFMessage('toggleDevTools');
};
