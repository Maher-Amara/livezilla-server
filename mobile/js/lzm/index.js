/****************************************************************************************
 * LiveZilla index.js
 *
 * Copyright 2017 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/

var lzm_commonConfig = {};
var lzm_commonTools = {};
var lzm_commonDisplay = {};
var lzm_commonStorage = {};
var lzm_commonTranslation = {};
var lzm_commonDialog = {};
var lzm_displayHelper = {};

var loopCounter = 0;
var defaultProfile = {};
var lz_version = '';
var debuggingMode = 0;
var deviceId = '';
var runningFromApp = false;
var appOs = '';
var newPassword = '';
var localDbPrefix = '';

IFManager.IsAppFrame = false;

/**************************************** Hash functions ****************************************/
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

var windowsCallbackFunction = function (myCallbackString) {
    myCallbackString = myCallbackString.replace(/\n/g, '').replace(/\r/g, '');
    eval(myCallbackString);
};

var logit = function(myObject, myLevel) {
    var myError = (new Error).stack;
    var callerFile = '', callerLine = '';
    try {
        var callerInfo = myError.split('\n')[2].split('(')[1].split(')')[0].split(':');
        callerFile = callerInfo[0] + ':' + callerInfo[1];
        callerLine = callerInfo[2];
    } catch(e) {}
    try {

    } catch(e) {}
};

var setDeviceId = function(id) {
    deviceId = id;
};

var readPageloadParameter = function() {
    var myUrl = document.URL, errorMessage = '', urlParts = [];
    if (runningFromApp) {
        if (myUrl.indexOf('?') != -1) {
            urlParts = myUrl.split('?');
            if (urlParts[1] == 'ERROR') {
                errorMessage = t('An error occured while loading the web application.') + '\n\n' +
                t('Check your server and the connection of your mobile device.');
                lzm_commonDialog.createAlertDialog(errorMessage, [{id: 'ok', name: t('Ok')}]);
                $('#alert-btn-ok').click(function() {
                    lzm_commonDialog.removeAlertDialog();
                });
            } else if (urlParts[1] == 'TIMEOUT') {
                errorMessage = t('Loading the web application timed out.') + '\n\n' +
                    t('Check your server and the connection of your mobile device.');
                lzm_commonDialog.createAlertDialog(errorMessage, [{id: 'ok', name: t('Ok')}]);
                $('#alert-btn-ok').click(function() {
                    lzm_commonDialog.removeAlertDialog();
                });
            }
        }
    } else {
        if (myUrl.indexOf('?') != -1) {
            urlParts = myUrl.split('?');
            if (urlParts[1] == 'DEBUG') {
                debuggingMode = 1;
            }
        }
    }
};

var openBrowser = function(url, serverVersion) {
    try
    {
        lzm_deviceInterface.openChatView(url, serverVersion);
    }
    catch(ex)
    {
        logit('Opening chat view failed');
    }
};

var submitLoginForm = function(loginData, acid) {
    var targetUrl = 'chat.php?acid=' + acid;

    for (var key in loginData) {
        if (loginData.hasOwnProperty(key))
            $('#data-submit-form').append('<input type="hidden" id="' + key + '" name="' + key + '" value="' + loginData[key] + '" />');
    }
    $('#data-submit-form').attr('action', targetUrl);
    $('#data-submit-form').trigger('create');
    $('#data-submit-form').submit();
};

var openLink = function(url) {
    if (runningFromApp) {
        try {
            lzm_deviceInterface.openExternalBrowser(url);
        } catch(ex) {
            logit('Opening device browser failed');
        }
    } else {
        window.open(url, '_blank');
    }
};

var d = function(param){return (typeof(param)!='undefined'&&param!='undefined');};

var t = function(myString, replacementArray) {
    return lzm_commonTranslation.translate(myString, replacementArray);
};

var tid = function(id, placeholderArray){
    return lzm_commonTranslation.getById(id, placeholderArray);
};

function tidc(id, suffix){
    suffix = (typeof suffix != 'undefined') ? suffix : ':';
    var x = lzm_commonTranslation.getById(id);
    if(lzm_commonTools.endsWith(x, suffix))
        return x;
    else
        return x + suffix;
}

var fillStringsFromTranslation = function(selectedIndex, selectedStatus) {
    if (loopCounter > 49 || lzm_commonTranslation.translationArray.length != 0)
    {
        $('#username').attr('placeholder', tid('username'));
        $('#password').attr('placeholder', tid('password'));
        $('#save_login-text').text(t('Save login data'));
        $('#auto_login-text').text(t('Autologin'));
        $('#ldap_login-text').text(t('LDAP'));
        $('#login_btn-text').text(t('Log in'));
        lzm_commonDisplay.fillProfileSelectList(lzm_commonStorage.storageData, runningFromApp, selectedIndex);

        fillUserStatusSelect(selectedStatus);
    } else {
        loopCounter++;
        setTimeout(function () {
            fillStringsFromTranslation(selectedIndex, selectedStatus);
        }, 50);
    }
};

var createLoginForm = function(profileIndex, userStatus) {
    var optList = [];
    for (var i=0; i<lzm_commonConfig.lz_user_states.length; i++) {
        if (lzm_commonConfig.lz_user_states[i].index != 2) {
            optList.push({value: lzm_commonConfig.lz_user_states[i].index, text: t(lzm_commonConfig.lz_user_states[i].text)});
        }
    }
    var loginForm = lzm_inputControls.createInput('username', 'login-input', '', '', '', 'text', '') +
        lzm_inputControls.createInput('password', 'login-input', '', '', '', 'password', '')  +
        lzm_inputControls.createSelect('user_status', '', '', '', '', {height:'36px',padding:'8px 30px 8px 20px'}, '', optList, userStatus,'') +
        lzm_inputControls.createButton('login_btn', '', '', t('Log in'), '', 'r', {}, '',30, 'd') +
        lzm_inputControls.createButton('orientation_btn', '', '', '', '<i class="fa fa-rotate-right"></i>', 'lr', {'padding': '7px 15px'}, '', 'b') +
        '<div id="login-checkbox-div">';

    if (!runningFromApp)
    {
        loginForm += '<div><input type="checkbox" class="checkbox-custom" data-role="none" name="save_login" id="save_login"' +
            ' class="save_login" value="1" style="margin-left: 0px; vertical-align: middle;" />' +
            '<label id="save_login-text" class="checkbox-custom-label" for="save_login" style="padding-left: 1px;">&nbsp;</label>' +
            '<input type="hidden" id="server_profile_selection" value="-1"></div>';
    }

    loginForm += '<div style="margin: 3px 0;"><input type="checkbox" class="checkbox-custom" name="auto_login" id="auto_login" class="auto_login" style="margin-left: 0; vertical-align: middle;" />' +
        '<label id="auto_login-text" for="auto_login" class="checkbox-custom-label" style="padding-left: 1px;">&nbsp;</label></div>';

    loginForm += '<div><input type="checkbox" class="checkbox-custom" name="ldap_login" id="ldap_login" class="ldap_login" style="margin-left: 0; vertical-align: middle;" />' +
        '<label id="ldap_login-text" for="ldap_login" class="checkbox-custom-label" style="padding-left: 1px;">&nbsp;</label></div>';

    loginForm += '</div>';

    $('#login-form').html(loginForm).trigger('create');
    $('#user_status').removeClass('lzm-select');

    var copyrightNotice = t('<!--link_begins-->LiveZilla GmbH<!--link_ends--> <!--copyright--> All Rights Reserved.',
        [['<!--link_begins-->', '<a href="#" onclick="openLink(\'https://www.livezilla.net/\');" class="lz_chat_link_no_icon">'],
        ['<!--link_ends-->', '</a>'], ['<!--copyright-->', '&#169;']]);
    $('#login-copyright-link').html(copyrightNotice);
};

var fillUserStatusSelect = function(selectedStatus) {
    var userStatusHtml = '', optList = [];
    for (var i = 0; i < lzm_commonConfig.lz_user_states.length; i++) {
        var selectOption = '';
        if (typeof selectedStatus != 'undefined' && selectedStatus !== '' && selectedStatus != null &&
            selectedStatus != 'undefined' && selectedStatus != 'null' &&
            String(lzm_commonConfig.lz_user_states[i].index) == String(selectedStatus)) {
            selectOption = ' selected="selected"';
            $('#user_status-inner-text').html(t(lzm_commonConfig.lz_user_states[i].text));
        }
        if (lzm_commonConfig.lz_user_states[i].index != 2) {
            userStatusHtml += '<option value="' + lzm_commonConfig.lz_user_states[i].index + '"' + selectOption + '>' +
                t(lzm_commonConfig.lz_user_states[i].text) + '</option>';
            optList.push({value: lzm_commonConfig.lz_user_states[i].index, text: '', icon: lzm_commonConfig.lz_user_states[i].icon});
        }
    }
    lzm_displayHelper.createSelectChangeHandler('user_status', optList);
    $('#user_status').html(userStatusHtml);
};

var checkServerVersion = function(xmlDoc) {
    var checkResult = true, serverVersion = '';
    $(xmlDoc).find('livezilla_version').each(function() {
        serverVersion = lz_global_base64_url_decode($(this).text());
    });
    var codeVersion = lzm_commonConfig.lz_min_version.split('.');
    var checkVersion = serverVersion.split('.');
    if (serverVersion.match(/[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+/) == null || serverVersion.match(/[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+/) == ['']) {
        checkResult = false;
    }
    if (checkVersion.length != codeVersion.length) {
        checkResult = false;
    }
    for (var i=0; i<checkVersion.length; i++) {
        if (checkVersion[i] > codeVersion[i]) {
            break;
        } else if (checkVersion[i] == codeVersion[i]) {
            // Go to next round...
        } else {
            checkResult = false;
        }
    }
    return [checkResult, serverVersion];
};

var checkServerVersionNewerThan = function(comparedVersion, xmlDoc) {
    var checkResult = true, serverVersion = '';
    $(xmlDoc).find('livezilla_version').each(function() {
        serverVersion = lz_global_base64_url_decode($(this).text());
    });
    var codeVersion = comparedVersion.split('.');
    var checkVersion = serverVersion.split('.');
    if (serverVersion.match(/[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+/) == null || serverVersion.match(/[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+/) == ['']) {
        checkResult = false;
    }
    if (checkVersion.length != codeVersion.length) {
        checkResult = false;
    }
    for (var i=0; i<checkVersion.length; i++) {
        if (checkVersion[i] > codeVersion[i]) {
            break;
        } else if (checkVersion[i] == codeVersion[i]) {
            // Go to next round...
        } else {
            checkResult = false;
        }
    }
    return [checkResult, serverVersion];
};

var checkForValidationErrors = function (xmlDoc) {
    var error_value = -1;
    $(xmlDoc).find('validation_error').each(function ()
    {
        if (error_value == -1) {
            error_value = lz_global_base64_url_decode($(this).attr('value'));
        }
    });
    return error_value;
};


var pollServerlogin = function(serverProtocol, serverUrl, mobileDir, serverPort, loginName, password, status, loginId, isApp, isWeb, b64login,
                         b64password, b64status, b64index, b64profile, b64port, b64protocol, b64url, b64mobileDir, b64loginid,
                         x_b64volume, b64away, b64playNewMessageSound, b64playNewChatSound, b64repeatNewChatSound, b64playNewTicketSound, b64language,
                         b64backgroundMode, localDbPrefix, ignoreSignedOn, isLDAP) {
    ignoreSignedOn = (typeof ignoreSignedOn != 'undefined') ? ignoreSignedOn : false;
    isLDAP = (typeof isLDAP != 'undefined') ? isLDAP : false;
    var errorMessage='',p_acid = lzm_commonTools.pad(Math.floor(Math.random() * 99999).toString(10), 5);
    var acid = lzm_commonTools.pad(Math.floor(Math.random() * 1048575).toString(16), 5);
    var mobile = (runningFromApp) ? 1 : 0;
    var deviceId = (runningFromApp) ? 'LOGIN' : '';
    var loginDataObject = {
        p_user_status: status,
        p_user: loginName,
        p_pass: ((isLDAP) ? lz_global_base64_url_encode(password) : sha256(md5(password))),
        p_acid: p_acid,
        p_request: 'intern',
        p_action: 'login',
        p_version: lz_version,
        p_clienttime: Math.floor($.now()/1000),
        p_app: isApp?1:0,
        p_mobile: mobile,
        p_web: 1,
        p_app_device_id: deviceId,
        p_loginid: loginId
    };

    if(isLDAP)
        loginDataObject.p_ldap = 1;

    if (newPassword != '')
        loginDataObject.p_new_password = md5(newPassword);

    if (runningFromApp) {
        loginDataObject.p_app_os = appOs;
        loginDataObject.p_app_language = lzm_commonTranslation.language;
        loginDataObject.p_app_background = '0';
    }
    if (ignoreSignedOn) {
        loginDataObject.p_iso = 1;
    }
    if (serverUrl.indexOf(':') == -1) {
        var urlParts = serverUrl.split('/');
        serverUrl = serverProtocol + urlParts[0] + ':' + serverPort;
        for (var i = 1; i < urlParts.length; i++) {
            serverUrl += '/' + urlParts[i];
        }
    } else if (serverUrl.indexOf(serverProtocol) == -1) {
        serverUrl = serverProtocol + serverUrl;
    }
    var postUrl = (serverUrl.indexOf('#') != -1) ? serverUrl.split('#')[0] : serverUrl;
    postUrl = postUrl + '/server.php?acid=' + acid;

    $.ajax({
        type: "POST",
        url: postUrl,
        //crossDomain: true,
        data: loginDataObject,
        timeout: lzm_commonConfig.pollTimeout,
        success: function (data) {
            try {
                var xmlDoc = $.parseXML($.trim(data));
                var xmlIsLiveZillaXml = false;
                $(xmlDoc).find('livezilla_xml').each(function() {
                    xmlIsLiveZillaXml = true;
                });
                if (xmlIsLiveZillaXml) {
                    var serverVersionIsSufficient = checkServerVersion(xmlDoc);
                    var serverVersionNewer5100 = checkServerVersionNewerThan('5.1.0.0', xmlDoc);
                    var serverVersionNewer5120 = checkServerVersionNewerThan('5.1.2.0', xmlDoc);
                    var serverVersionNewer6110 = checkServerVersionNewerThan('6.1.1.0', xmlDoc);
                    var error_value = checkForValidationErrors(xmlDoc);
                    var appUrl = (serverUrl.indexOf('#') != -1) ? serverUrl.split('#')[0] : serverUrl;
                    try {
                        waitForValidationErrorUserResponse(appUrl, serverVersionIsSufficient, serverVersionNewer5100, serverVersionNewer5120, serverVersionNewer6110,
                            acid, serverProtocol, serverUrl, mobileDir, serverPort, loginName, password, status, loginId,
                            isApp, isWeb, b64login, b64password, b64status, b64index, b64profile, b64port, b64protocol,
                            b64url, b64mobileDir, b64loginid, x_b64volume, b64away, b64playNewMessageSound, b64playNewChatSound,
                            b64repeatNewChatSound, b64playNewTicketSound, b64language, b64backgroundMode, localDbPrefix,
                            error_value, doLogin, isLDAP);
                    } catch(e) {console.log(e);}
                }
                else
                {
                    $('#login_btn').removeClass('ui-disabled');
                    errorMessage = t('The server response had an invalid structure.') + '\n\n' +
                        t('Either the server URL is wrong (presumably) or the server is not working properly.');
                    lzm_commonDialog.createAlertDialog(errorMessage, [{id: 'show', name: tid('show')},{id: 'ok', name: t('Ok')}]);
                    $('#alert-btn-ok').click(function() {
                        lzm_commonDialog.removeAlertDialog();
                    });
                    $('#alert-btn-show').click(function() {
                        alert(data);
                        lzm_commonDialog.removeAlertDialog();
                    });
                }
            }
            catch(ex)
            {
                $('#login_btn').removeClass('ui-disabled');
                errorMessage = t('The server response had an invalid structure.') + '\n\n' +
                    t('Either the server URL is wrong (presumably) or the server is not working properly.');
                lzm_commonDialog.createAlertDialog(errorMessage, [{id: 'show', name: tid('show')},{id: 'ok', name: t('Ok')}]);
                $('#alert-btn-ok').click(function() {
                    lzm_commonDialog.removeAlertDialog();
                });
                $('#alert-btn-show').click(function() {
                    alert(data);
                    lzm_commonDialog.removeAlertDialog();
                });
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            $('#login_btn').removeClass('ui-disabled');
            if (jqXHR.statusText == 'timeout') {
                errorMessage = t('The server did not respond for more then <!--number_of_seconds--> seconds.',
                    [['<!--number_of_seconds-->',lzm_commonConfig.pollTimeout / 1000]]);
                lzm_commonDialog.createAlertDialog(errorMessage, [{id: 'ok', name: t('Ok')}]);
                $('#alert-btn-ok').click(function() {
                    lzm_commonDialog.removeAlertDialog();
                });
            } else {
                var errorMessage = '';
                if (jqXHR.status == 404 || jqXHR.status == 0) {
                errorMessage += t('Cannot connect to the LiveZilla Server. The target URI seems to be wrong or your network is down.') + '\n\n' +
                    t('Please check / validate the URI (Server Profile)') + '\n\n' +
                    t('Further information') + '\n';
                }
                if (jqXHR.status != 0)
                {
                    errorMessage += t('The remote server has returned an error: (<!--http_error-->) <!--http_error_text-->',
                        [['<!--http_error-->',jqXHR.status],['<!--http_error_text-->',jqXHR.statusText]]);
                }
                else
                {
                    errorMessage += t('You need at least LiveZilla server version <!--config_version--> to run this app.',[['<!--config_version-->',lzm_commonConfig.lz_min_version]]);
                }
                lzm_commonDialog.createAlertDialog(errorMessage, [{id: 'ok', name: t('Ok')}]);
                $('#alert-btn-ok').click(function() {
                    lzm_commonDialog.removeAlertDialog();
                });
            }
        },
        dataType: 'text'
    });
};

var waitForValidationErrorUserResponse = function(appUrl, serverVersionIsSufficient, serverVersionNewer5100, serverVersionNewer5120, serverVersionNewer6110,
    acid, serverProtocol, serverUrl, mobileDir, serverPort, loginName, password, status, loginId, isApp, isWeb, b64login, b64password,
    b64status, b64index, b64profile, b64port, b64protocol, b64url, b64mobileDir, b64loginid, x_b64volume, b64away, b64playNewMessageSound,
    b64playNewChatSound, b64repeatNewChatSound, b64playNewTicketSound, b64language, b64backgroundMode, localDbPrefix, error_value, callBack, isLDAP) {
    isLDAP = (typeof isLDAP != 'undefined') ? isLDAP : false;
    if (serverVersionIsSufficient[0] && (error_value == -1 || error_value == 11)) {
        newPassword = '';
        if (b64login != '' && b64password != '') {
            callBack(appUrl, serverVersionIsSufficient, serverVersionNewer5100, serverVersionNewer5120, serverVersionNewer6110, acid, serverProtocol, serverUrl, mobileDir, serverPort,
                loginName, password, status, loginId, isApp, isWeb, b64login, b64password, b64status, b64index, b64profile,
                b64port, b64protocol, b64url, b64mobileDir, b64loginid, x_b64volume, b64away, b64playNewMessageSound,
                b64playNewChatSound, b64repeatNewChatSound, b64playNewTicketSound, b64language, b64backgroundMode, localDbPrefix, isLDAP);
        } else {
            $('#login_btn').removeClass('ui-disabled');
        }
    }
    if (!serverVersionIsSufficient[0])
    {
        lzm_commonDialog.createAlertDialog(t('You need at least LiveZilla server version <!--config_version--> to run this app.',[['<!--config_version-->',lzm_commonConfig.lz_min_version]]),
            [{id: 'ok', name: t('Ok')}]);
        $('#login_btn').removeClass('ui-disabled');
        $('#alert-btn-ok').click(function() {
            lzm_commonDialog.removeAlertDialog();
        });
    }
    else if (error_value != -1)
    {
        var errorResponse = getValidationErrorResponse(error_value, loginName);
        lzm_commonDialog.createAlertDialog(errorResponse.text, errorResponse.buttons);
        $('#login_btn').removeClass('ui-disabled');
        for (var i=0; i<errorResponse.buttons.length; i++) {
            $('#alert-btn-' + errorResponse.buttons[i].id).click(function() {
                var buttonId = $(this).data('id');
                if(!runningFromApp && error_value == 13)
                {
                    window.location.href="./../index.php";
                }
                else if (error_value == 2 && buttonId == 'poll-again')
                {
                    pollServerlogin(serverProtocol, serverUrl, mobileDir, serverPort, loginName, password, status, loginId, isApp, isWeb, b64login,
                        b64password, b64status, b64index, b64profile, b64port, b64protocol, b64url, b64mobileDir, b64loginid,
                        x_b64volume, b64away, b64playNewMessageSound, b64playNewChatSound, b64repeatNewChatSound, b64playNewTicketSound, b64language, b64backgroundMode,
                        localDbPrefix, true, isLDAP);
                }
                /*
                else if (error_value == 5) {
                    var functionCall = 'pollServerlogin(\'' + serverProtocol + '\', \'' + serverUrl + '\', \'' + mobileDir + '\', \'' + serverPort +
                        '\', \'' + loginName + '\', \'' + password + '\', ' + status + ', \'' + loginId + '\', ' + isApp + ', ' + isWeb +
                        ', \'' + b64login + '\', \'' + b64password + '\', \'' + b64status + '\', \'' + b64index + '\', \'' + b64profile +
                        '\', \'' + b64port + '\', \'' + b64protocol + '\', \'' + b64url + '\', \'' + b64mobileDir + '\', \'' + b64loginid +
                        '\', \'' + x_b64volume + '\', \'' + b64away + '\', \'' + b64playNewMessageSound + '\', \'' + b64playNewChatSound +
                        '\', \'' + b64repeatNewChatSound + '\', \'' + b64playNewTicketSound + '\', \'' + b64language + '\', \'' + b64backgroundMode +
                        '\', \'' + localDbPrefix + '\', false, '+isLDAP+')';
                    //lzm_commonDialog.ChangePassword('index', password, functionCall)
                }*/
                lzm_commonDialog.removeAlertDialog();
            });
        }
    }
};

var getValidationErrorResponse = function(errorValue, loginName) {
    var errorText = '', buttons = [{id: 'ok', name: t('Ok')}];
    switch (String(errorValue)) {
        case "0":
            errorText = t('Wrong username or password.');
            break;
        case "2":
            errorText = t('The operator <!--op_login_name--> is already logged in.',[['<!--op_login_name-->', loginName]]) + '\n' +
                t('Do you want to log off the other instance?');
            buttons = [{id: 'poll-again', name: t('Ok')}, {id: 'cancel', name: t('Cancel')}];
            break;
        case "3":
            errorText = t('You\'ve been logged off by another operator!');
            break;
        case "4":
            errorText = t('Session timed out.');
            break;
        case "5":
            errorText = t('Your password has expired. Please enter a new password.');
            break;
        case "9":
            errorText = t('You are not an administrator.');
            break;
        case "10":
            errorText = tid('server_deactivated') + '<br><br>' +  tid('server_deactivated_undo');
            break;
        case "13":
            errorText = t('There are problems with the database connection.');
            break;
        case "14":
            errorText = t('This server requires secure connection (SSL). Please activate HTTPS in the server profile and try again.');
            break;
        case "15":
            errorText = t('Your account has been deactivated by an administrator.');
            break;
        case "16":
            errorText = 'Your client app is outdated. Please update to the latest app version.';
            break;
        case "19":
            errorText = t('No mobile access permitted.');
            break;
        default:
            errorText = 'Validation Error : ' + errorValue;
            break;
    }
    return {text: errorText, buttons: buttons};
};

var doLogin = function(appUrl, serverVersionIsSufficient, serverVersionNewer5100, serverVersionNewer5120, serverVersionNewer6110, acid, serverProtocol, serverUrl,
    mobileDir, serverPort, loginName, password, status, loginId, isApp, isWeb, b64login, b64password, b64status, b64index,
    b64profile, b64port, b64protocol, b64url, b64mobileDir, b64loginid, x_b64volume, b64away, b64playNewMessageSound,
    b64playNewChatSound, b64repeatNewChatSound, b64playNewTicketSound, b64language, b64backgroundMode, localDbPrefix, isLDAP) {

    isLDAP = (typeof isLDAP != 'undefined') ? isLDAP : false;

    var protocolMode = (serverProtocol == 'https://') ? lz_global_base64_url_encode('1') : lz_global_base64_url_encode('0');

    if (isApp && serverVersionNewer6110[0])
    {
        openBrowser(appUrl + '/' + mobileDir + '/chat.php?lgn=' + b64login + '&psswrd=' + b64password + '&stts=' + b64status +
            '&ndx=' + b64index + '&prfl=' + b64profile + '&prt=' + b64port + '&p=' + protocolMode + '&rl=' + b64url +
            '&mbl_dr=' + b64mobileDir + '&acid=' + acid + '&pp=1' + '&lgnd=' + b64loginid +
            '&w_ftr=' + b64away +
            '&pl_ncmng_mssg_snd=' + b64playNewMessageSound +
            '&pl_ncmng_cht_snd=' + b64playNewChatSound +
            '&rpt_ncmng_cht_snd=' + b64repeatNewChatSound +
            '&pl_ncmng_tckt_snd=' + b64playNewTicketSound +
            '&lngg=' + b64language +
            '&ldap=' + isLDAP ? '1' : '0' +
            '&bckgrnd_md=' + b64backgroundMode +
            '&dbg' + debuggingMode +
            '&lcl_db_prfx=' + localDbPrefix + serverVersionIsSufficient[1]);
    }
    else if (isApp && serverVersionNewer5120[0])
    {
        openBrowser(appUrl + '/' + mobileDir + '/chat.php?lgn=' + b64login + '&psswrd=' + b64password + '&stts=' + b64status +
            '&ndx=' + b64index + '&prfl=' + b64profile + '&prt=' + b64port + '&p=' + protocolMode + '&rl=' + b64url +
            '&mbl_dr=' + b64mobileDir + '&acid=' + acid + '&pp=1' + '&lgnd=' + b64loginid +
            '&w_ftr=' + b64away +
            '&pl_ncmng_mssg_snd=' + b64playNewMessageSound +
            '&pl_ncmng_cht_snd=' + b64playNewChatSound +
            '&rpt_ncmng_cht_snd=' + b64repeatNewChatSound +
            '&pl_ncmng_tckt_snd=' + b64playNewTicketSound +
            '&lngg=' + b64language +
            '&bckgrnd_md=' + b64backgroundMode +
            '&dbg' + debuggingMode +
            '&lcl_db_prfx=' + localDbPrefix +
            '&mlt_srvr_d=' + '', serverVersionIsSufficient[1]);
    } else if (isApp && serverVersionNewer5100[0]) {
        openBrowser(appUrl + '/' + mobileDir + '/chat.php?lgn=' + b64login + '&psswrd=' + b64password + '&stts=' + b64status +
            '&ndx=' + b64index + '&prfl=' + b64profile + '&prt=' + b64port + '&prtcl=' + b64protocol + '&rl=' + b64url +
            '&mbl_dr=' + b64mobileDir + '&acid=' + acid + '&pp=1' + '&lgnd=' + b64loginid +
            '&w_ftr=' + b64away +
            '&pl_ncmng_mssg_snd=' + b64playNewMessageSound +
            '&pl_ncmng_cht_snd=' + b64playNewChatSound +
            '&rpt_ncmng_cht_snd=' + b64repeatNewChatSound +
            '&pl_ncmng_tckt_snd=' + b64playNewTicketSound +
            '&lngg=' + b64language +
            '&bckgrnd_md=' + b64backgroundMode +
            '&dbg' + debuggingMode +
            '&lcl_db_prfx=' + localDbPrefix +
            '&mlt_srvr_d=' + '', serverVersionIsSufficient[1]);
    } else if (isApp && !serverVersionNewer5100[0]) {
        openBrowser(appUrl + '/' + mobileDir + '/chat.php?login=' + b64login + '&password=' + b64password + '&status=' + b64status +
            '&index=' + b64index + '&profile=' + b64profile + '&port=' + b64port + '&protocol=' + b64protocol + '&url=' + b64url +
            '&mobile_dir=' + b64mobileDir + '&acid=' + acid + '&app=1' + '&loginid=' + b64loginid +
            '&away_after=' + b64away +
            '&play_incoming_message_sound=' + b64playNewMessageSound +
            '&play_incoming_chat_snd=' + b64playNewChatSound +
            '&repeat_incoming_chat_sound=' + b64repeatNewChatSound +
            '&play_incoming_ticket_sound=' + b64playNewTicketSound +
            '&language=' + b64language +
            '&background_mode=' + b64backgroundMode +
            '&debug' + debuggingMode +
            '&local_db_prefix=' + localDbPrefix +
            '&multi_server_id=' + '', serverVersionIsSufficient[1]);
    } else if (isWeb) {
        submitLoginForm({
            lgn: b64login,
            psswrd: b64password,
            stts: b64status,
            ndx: b64index,
            prfl: b64profile,
            prt: b64port,
            p: protocolMode,
            rl: b64url,
            mbl_dr: b64mobileDir,
            wb: 1,
            ldap: (isLDAP) ? 1 : 0,
            lgnd: b64loginid,
            w_ftr: b64away,
            pl_ncmng_mssg_snd: b64playNewMessageSound,
            pl_ncmng_cht_snd: b64playNewChatSound,
            rpt_ncmng_cht_snd: b64repeatNewChatSound,
            pl_ncmng_tckt_snd: b64playNewTicketSound,
            lngg: b64language,
            bckgrnd_md: b64backgroundMode,
            dbg: debuggingMode,
            lcl_db_prfx: localDbPrefix,
            mlt_srvr_d: ''
        }, acid);
    }
};

var doAutoLogin = function(count) {
    var myUrl = document.URL, params = [];
    if (myUrl.indexOf('?') != -1) {
        params = myUrl.split('?')[1].split('&');
    }
    count = (typeof count != 'undefined') ? count : 0;
    setTimeout(function() {
        try {
            if ($('#auto_login').prop('checked') &&
                ((runningFromApp && $.inArray('APPSTART', params) != -1) ||
                (runningFromApp && typeof window['appstart'] != 'undefined' && window['appstart']) ||
                (!runningFromApp && $.inArray('LOGOUT', params) == -1))) {
                $('#login_btn').click();
            }
        } catch(e) {
            count++;
            if (count <= 20) {
                doAutoLogin(count);
            }
        }
    }, 50);
};

var openConfiguration = function() {
    window.location.href = 'configure.html';
};

var hasStorage = function() {
    var returnValue = false;
    try {
        localStorage.setItem('test', 'test');
        returnValue = (localStorage.getItem('test') == 'test');
        localStorage.removeItem('test');
    } catch(e) {
        returnValue = false;
    }
    return returnValue;
};

var hasCookies = function () {
    var returnValue = (navigator.cookieEnabled) ? true : false;
    if (typeof navigator.cookieEnabled == "undefined" && !returnValue) {
        document.cookie="testcookie";
        returnValue = (document.cookie.indexOf("testcookie") != -1) ? true : false;
    }
    return returnValue;
};

var finishLoadingWithProfileData = function() {
    var selectedIndex = (typeof lzm_commonStorage.loadValue('last_chosen_profile') != 'undefined' &&
        lzm_commonStorage.loadValue('last_chosen_profile') != 'undefined' &&
        lzm_commonStorage.loadValue('last_chosen_profile') != null &&
        lzm_commonStorage.loadValue('last_chosen_profile') !== '') ?
        lzm_commonStorage.loadValue('last_chosen_profile') : -1;

    var currentprofile = lzm_commonStorage.getProfileByIndex(selectedIndex);
    var selectedStatus = (selectedIndex != -1 && currentprofile != null) ? currentprofile.user_status : 0;

    createLoginForm(selectedIndex, selectedStatus);
    fillStringsFromTranslation(selectedIndex, selectedStatus);
    readPageloadParameter();

    var thisServerProfileSelection = $('#server_profile_selection');
    var thisLoginData = $('.login-data');
    var thisSaveLoginQuestion = $('#save-login-question');
    var thisAutoLoginQuestion = $('#auto_login-question');
    var thisSaveLogin = $('#save_login');
    var thisAutoLogin = $('#auto_login');
    var thisLDAPLogin = $('#ldap_login');

    $('#password').keyup(function(e){
        var keyCode = (typeof e.which != 'undefined') ? e.which : e.keyCode;
        if(keyCode == 13)
            $('#login_btn').click();
    });
    $('#login_btn').click(function () {
        $('#login_btn').addClass('ui-disabled');
        var selectedIndex = (thisServerProfileSelection.val() != -1) ? thisServerProfileSelection.val() : 0;
        var chosenProfile = lzm_commonStorage.getProfileByIndex(selectedIndex);
        lz_version = lzm_commonConfig.lz_version;

        lzm_commonStorage.saveValue('last_chosen_profile', selectedIndex);

        // create a fake ip address...
        var loginId;
        if (typeof chosenProfile.fake_mac_address == 'undefined' || chosenProfile.fake_mac_address == '' ||
            chosenProfile.fake_mac_address == 'undefined' || chosenProfile.fake_mac_address == 'null' || chosenProfile.fake_mac_address == null) {
            var randomHex = String(md5(String(Math.random())));
            loginId = randomHex.toUpperCase().substr(0,2);
            for (var i=1; i<6; i++) {
                loginId += '-' + randomHex.toUpperCase().substr(2*i,2);
            }
            chosenProfile.fake_mac_address = loginId;
        }
        else
        {
            loginId = chosenProfile.fake_mac_address;
        }

        chosenProfile.user_status = $('#user_status').val();
        var login = lz_global_base64_url_encode($('#username').val());
        var password = lz_global_base64_url_encode($('#password').val());
        var userStatus = lz_global_base64_url_encode($('#user_status').val());
        var index = lz_global_base64_url_encode(selectedIndex);
        var profile = lz_global_base64_url_encode(chosenProfile.server_profile);
        var port = lz_global_base64_url_encode(chosenProfile.server_port);
        var protocol = lz_global_base64_url_encode(chosenProfile.server_protocol);
        var url = (chosenProfile.server_url.indexOf('#') != -1) ? chosenProfile.server_url.split('#')[0] : chosenProfile.server_url;
        url = lz_global_base64_url_encode(url);
        var b64mobileDir = lz_global_base64_url_encode(chosenProfile.mobile_dir);

        var awayAfter = lz_global_base64_url_encode(0);
        var b64playNewMessageSound = lz_global_base64_url_encode(1);
        var b64playNewChatSound = lz_global_base64_url_encode(1);
        var b64repeatNewChatSound = lz_global_base64_url_encode(1);
        var b64playNewTicketSound = lz_global_base64_url_encode(1);
        var b64backgroundMode = lz_global_base64_url_encode(1);
        var b64loginId = lz_global_base64_url_encode(loginId);
        var b64language = lz_global_base64_url_encode(lzm_commonTranslation.language);

        if (typeof chosenProfile.user_away_after != 'undefined' && chosenProfile.user_away_after != null &&
            chosenProfile.user_away_after != 'null' && chosenProfile.user_away_after != 'undefined') {
            awayAfter = lz_global_base64_url_encode(chosenProfile.user_away_after);
        }
        if (typeof chosenProfile.play_incoming_message_sound != 'undefined' && chosenProfile.play_incoming_message_sound != null &&
            chosenProfile.play_incoming_message_sound != 'null' && chosenProfile.play_incoming_message_sound != 'undefined') {
            b64playNewMessageSound = lz_global_base64_url_encode(chosenProfile.play_incoming_message_sound);
        }
        if (typeof chosenProfile.play_incoming_chat_sound != 'undefined' && chosenProfile.play_incoming_chat_sound != null &&
            chosenProfile.play_incoming_chat_sound != 'null' && chosenProfile.play_incoming_chat_sound != 'undefined') {
            b64playNewChatSound = lz_global_base64_url_encode(chosenProfile.play_incoming_chat_sound);
        }
        if (typeof chosenProfile.repeat_incoming_chat_sound != 'undefined' && chosenProfile.repeat_incoming_chat_sound != null &&
            chosenProfile.repeat_incoming_chat_sound != 'null' && chosenProfile.repeat_incoming_chat_sound != 'undefined') {
            b64repeatNewChatSound = lz_global_base64_url_encode(chosenProfile.repeat_incoming_chat_sound);
        }
        if (typeof chosenProfile.play_incoming_ticket_sound != 'undefined' && chosenProfile.play_incoming_ticket_sound != null &&
            chosenProfile.play_incoming_ticket_sound != 'null' && chosenProfile.play_incoming_ticket_sound != 'undefined') {
            b64playNewTicketSound = lz_global_base64_url_encode(chosenProfile.play_incoming_ticket_sound);
        }
        if (typeof chosenProfile.background_mode != 'undefined' && chosenProfile.background_mode != null &&
            chosenProfile.background_mode != 'null' && chosenProfile.background_mode != 'undefined') {
            b64backgroundMode = lz_global_base64_url_encode(chosenProfile.background_mode);
        }

        if (selectedIndex == 0)
        {
            if (thisSaveLogin.val() != '-1' && thisSaveLogin.prop('checked') == true) {
                chosenProfile.login_name = $('#username').val();
                chosenProfile.login_passwd = $('#password').val();
            } else {
                chosenProfile.login_name = '';
                chosenProfile.login_passwd = '';
            }
        }
        if (thisAutoLogin.prop('checked') == true) {
            chosenProfile.auto_login = 1;
        } else {
            chosenProfile.auto_login = 0;
        }

        if(!runningFromApp){
            if (thisLDAPLogin.prop('checked') == true) {
                chosenProfile.ldap_login = 1;
            } else {
                chosenProfile.ldap_login = 0;
            }
        }

        chosenProfile.language = lzm_commonTranslation.language;
        chosenProfile.index = selectedIndex;
        lzm_commonStorage.saveProfile(chosenProfile);

        var isApp = (runningFromApp) ? 1 : 0;
        var isWeb = 1 - isApp;
        pollServerlogin(chosenProfile.server_protocol, chosenProfile.server_url, chosenProfile.mobile_dir, chosenProfile.server_port,
            $('#username').val(), $('#password').val(), $('#user_status').val(), loginId, isApp, isWeb, login,
            password, userStatus, index, profile, port, protocol, url, b64mobileDir, b64loginId, 100, awayAfter,
            b64playNewMessageSound, b64playNewChatSound, b64repeatNewChatSound, b64playNewTicketSound, b64language, b64backgroundMode,
            localDbPrefix, false, chosenProfile.ldap_login);
    });
    $('#configure_btn').click(function () {
        lzm_commonStorage.saveValue('last_chosen_profile', thisServerProfileSelection.val());
        openConfiguration();
    });

    lzm_commonTools.createDefaultProfile(runningFromApp, thisServerProfileSelection.val());

    var autoLoginSetting = lzm_commonStorage.loadValue('auto_login');
    var LDAPLoginSetting = lzm_commonStorage.loadValue('ldap_login');

    if (!runningFromApp) {
        thisLoginData.css('display', 'block');

        defaultProfile = lzm_commonStorage.getProfileByIndex(0);
        if (defaultProfile.login_name != '') {
            $('#username').val(defaultProfile.login_name);
            $('#password').val(defaultProfile.login_passwd);
            thisSaveLogin.prop('checked', true);//.checkboxradio("refresh");
            if (autoLoginSetting == 1) {
                thisAutoLogin.prop('checked', true);//.checkboxradio("refresh");
            }
            if (defaultProfile.login_passwd != '')
            {
                $('#login_btn').removeClass('ui-disabled');

            }
        }
    }
    else
    {
        thisLoginData.css('display', 'block');
        if (selectedIndex != -1) {
            dataSet = lzm_commonStorage.getProfileByIndex(selectedIndex);
            if (typeof dataSet != 'undefined' && dataSet != null)
            {
                var dataSet = lzm_commonStorage.getProfileByIndex(selectedIndex);
                if (typeof dataSet.login_name != 'undefined')
                {
                    $('#username').val(dataSet.login_name);
                    $('#password').val(dataSet.login_passwd);
                }
                $('.login-input').removeClass('ui-disabled');
                if (autoLoginSetting == 1)
                {
                    thisAutoLogin.prop('checked', true);
                }
                if (dataSet.login_name != '' && dataSet.login_passwd != '')
                {
                    $('#login_btn').removeClass('ui-disabled');
                }
            }
        }
        defaultProfile = dataSet;
    }

    if (typeof defaultProfile != 'undefined' && typeof defaultProfile.user_status != 'undefined' && defaultProfile.user_status != 'undefined' && defaultProfile.user_status != '')
    {
        fillUserStatusSelect(defaultProfile.user_status);
    }

    if (LDAPLoginSetting == 1)
        thisLDAPLogin.prop('checked', true);

    doAutoLogin();

    lzm_commonDisplay.createLayout();
    UIRenderer.resizeAll('index');
    if (runningFromApp) {
        setTimeout(function() {
            lzm_commonDisplay.createLayout();
            UIRenderer.resizeAll('index');
        }, 200);
        setTimeout(function() {
            lzm_commonDisplay.createLayout();
            UIRenderer.resizeAll('index');
        }, 1000);
        setTimeout(function() {
            lzm_commonDisplay.createLayout();
            UIRenderer.resizeAll('index');
        }, 5000);
    }
    thisAutoLogin.change(function() {
        var autoLoginSetting = thisAutoLogin.prop('checked') ? 1 : 0;
        lzm_commonStorage.saveValue('auto_login', autoLoginSetting);
    });
    thisLDAPLogin.change(function() {
        var LDAPLoginSetting = thisLDAPLogin.prop('checked') ? 1 : 0;
        lzm_commonStorage.saveValue('ldap_login', LDAPLoginSetting);
    });
    thisServerProfileSelection.change(function () {
        var selectedValue;
        if (!runningFromApp) {
            selectedValue = (thisServerProfileSelection.val() != -1) ? thisServerProfileSelection.val() : 0;
        } else {
            selectedValue = thisServerProfileSelection.val();
        }
        if (selectedValue != -1) {
            var dataSet = lzm_commonStorage.getProfileByIndex(selectedValue);

            $('#server_profile_selection-inner-text').html(dataSet.server_profile);
            if (typeof dataSet.login_name != 'undefined') {
                $('#username').val(dataSet.login_name);
                $('#password').val(dataSet.login_passwd);
            }
            fillUserStatusSelect(dataSet.user_status);
            if (thisServerProfileSelection.val() != -1) {
                thisLoginData.css('display', 'block');
                thisSaveLoginQuestion.css('visibility', 'hidden');
                thisAutoLoginQuestion.css('visibility', 'visible');
            } else {
                if (runningFromApp) {
                    thisLoginData.css('display', 'block');
                    thisSaveLoginQuestion.css('visibility', 'hidden');
                    thisAutoLoginQuestion.css('visibility', 'visible');
                } else {
                    thisLoginData.css('display', 'block');
                    thisSaveLoginQuestion.css('visibility', 'visible');
                    thisAutoLoginQuestion.css('visibility', 'visible');
                }
            }
            $('.login-input').removeClass('ui-disabled');
        }
        else
        {
            $('#server_profile_selection-inner-text').html(t('No profile selected'));
            $('.login-input').addClass('ui-disabled');
            //$('#login_btn').addClass('ui-disabled');
            $('#username').val('');
            $('#password').val('');
        }

        if (selectedValue != -1) {
            $('#username').keyup();
        }
    });

    $('#user_status').change(function() {
        var selectedUserStatus = parseInt($('#user_status').val());
        $('#user_status-inner-text').html(t(lzm_commonConfig.lz_user_states[selectedUserStatus].text));
    });
    $('.login-input').keyup(function (e) {
        var keyCode = (typeof e.which != 'undefined') ? e.which : e.keyCode;
        if (keyCode != 13 && $('#username').val() != '' && $('#password').val() != '')
        {
            $('#login_btn').removeClass('ui-disabled');
        }
    });
    $('.login-input').change(function() {
        $('.login-input').keyup();
    });
    $('#orientation_btn').click(function() {
        var oldOrientation = lzm_commonDisplay.orientation;
        var classToAdd = (oldOrientation == 'vertical') ? 'fa-rotate-left' : 'fa-rotate-right';
        var targetOrientation = (lzm_commonDisplay.orientation == 'vertical') ? 'horizontal' : 'vertical';
        lzm_commonDisplay.orientation = targetOrientation;
        $('#orientation_btn').children('i').removeClass('fa-rotate-right').removeClass('fa-rotate-left');
        $('#orientation_btn').children('i').addClass(classToAdd);
        if (typeof lzm_deviceInterface != 'undefined') {
            lzm_deviceInterface.switchOrientation(targetOrientation);
        }
        lzm_commonStorage.saveValue('display_orientation', targetOrientation);
    });

    $(window).resize(function () {
        lzm_commonDisplay.createLayout();
        UIRenderer.resizeAll('index');
        setTimeout(function() {
            lzm_commonDisplay.createLayout();
            UIRenderer.resizeAll('index');
        }, 200);
        setTimeout(function() {
            lzm_commonDisplay.createLayout();
            UIRenderer.resizeAll('index');
        }, 1000);
        setTimeout(function() {
            lzm_commonDisplay.createLayout();
            UIRenderer.resizeAll('index');
        }, 5000);
    });
};

$(document).ready(function () {
    var urlParts;

    // Detect if the local storage is working
    if (!runningFromApp && (!hasStorage() || !hasCookies()))
    {
        lzm_commonTools = new CommonToolsClass();
        urlParts = lzm_commonTools.getUrlParts();
        lzm_commonTranslation = new CommonTranslationClass(urlParts.protocol, urlParts.urlBase + ':' + urlParts.port + urlParts.urlRest, false, detectedLanguage);
        lzm_commonTranslation.setTranslationData(translationData);

        var errorHtml = '<div style="position:absolute;width:400px;height:200px;line-height:22px;top:50%;left:50%;margin: -150px 0 0 -200px; text-align:center; font-size: 1.4em; text-shadow:1px 1px 1px #fff;">' +
            '<i class="fa fa-meh-o" style="font-size:90px; text-shadow:1px 1px 1px #fff;"></i><br><br>' + t('Your browser seems to have its local storage/cookies disabled.') + '<br><br>' +
            t('Since local storage and cookies are needed for this application, you have to enable the local storage/cookies in your browser settings and reload this page.') + '</div>';

        $('#no-storage-warning').html(errorHtml).css({display: 'block'});
        $('#login-container').css({display: 'none'});
        $('body').css({'background-color': '#fff'});
    }
    else
    {
        // initiate the lzm classes needed
        if (runningFromApp && typeof lzm_deviceInterface == 'undefined')
        {
            if (appOs == 'windows')
            {
                lzm_deviceInterface = new CommonWindowsDeviceInterfaceClass();
            }
            else if(appOs != 'test')
            {
                lzm_deviceInterface = new CommonDeviceInterfaceClass();
            }
        }
        lzm_commonConfig = new CommonConfigClass();
        lzm_commonTools = new CommonToolsClass();

        if (!runningFromApp)
            localDbPrefix = md5(lzm_commonTools.getUrlParts()['urlRest']).substr(0,10);

        lzm_commonStorage = new CommonStorageClass(localDbPrefix, runningFromApp);
        lzm_commonDisplay = new CommonDisplayClass();
        lzm_commonDialog = new CommonDialogClass();
        lzm_displayHelper = new CommonDisplayHelperClass(appOs);
        lzm_inputControls = new CommonInputControlsClass();
        UIRenderer = new CommonDisplayLayoutClass();
        var orientation = (lzm_commonStorage.loadValue('display_orientation') != null) ? lzm_commonStorage.loadValue('display_orientation') : 'vertical';
        lzm_commonDisplay.orientation = orientation;
        if (typeof lzm_deviceInterface != 'undefined') {
            lzm_deviceInterface.switchOrientation(orientation);
        }
        if (!runningFromApp)
        {
            urlParts = lzm_commonTools.getUrlParts();
            lzm_commonTranslation = new CommonTranslationClass(urlParts.protocol, urlParts.urlBase + ':' +
                urlParts.port + urlParts.urlRest, urlParts.mobileDir, false, detectedLanguage);
            lzm_commonTranslation.setTranslationData(translationData);
        }
        else
        {
            lzm_commonTranslation = new CommonTranslationClass('', '', '', true, detectedLanguage);
            lzm_commonTranslation.setTranslationData(translationData);
        }

        // load the storage values and fill the profile select list
        lzm_commonStorage.loadProfileData();

        try {
            if (!runningFromApp || lzm_commonStorage.storageData.length > 0 || appOs != 'windows')
            {
                try {
                    finishLoadingWithProfileData();
                } catch(ex) {
                    logit(ex.stack);
                }
            } else {
                var loadDataLoopCounter = 1;
                var loadDataLoopNow = function() {
                    setTimeout(function() {
                        lzm_commonStorage.loadProfileData();
                        if (appOs == 'android' || lzm_commonStorage.storageData.length > 0 || loadDataLoopCounter * 20 > 1000) {
                            try {
                                finishLoadingWithProfileData();
                            } catch(ex) {
                                logit(ex.stack);
                            }
                        } else {
                            loadDataLoopCounter++;
                            loadDataLoopNow();
                        }
                    }, 20);
                };
                loadDataLoopNow();
            }
        } catch(ex) {}
    }
});
