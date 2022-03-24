/****************************************************************************************
 * LiveZilla CommonDialogClass.js
 *
 * Copyright 2013 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/

function CommonDialogClass() {
    this.alertDialogWidth = 0;
    this.alertDialogHeight = 0;
}

CommonDialogClass.ChangedPassword = '';
CommonDialogClass.IsAlert = false;

CommonDialogClass.prototype.createAlertDialog = function(errorMessage, buttons, _htmlBox) {

    if(CommonDialogClass.IsAlert)
        return;

    if(typeof CommonUIClass != 'undefined')
        CommonUIClass.ToggleSelectViewMenu(true);

    var wwidth = 0;
    if(typeof lzm_chatDisplay !== 'undefined')
    {
        lzm_chatDisplay.ChatsUI.BlockEditor();
        wwidth = lzm_chatDisplay.windowWidth;
    }
    else
        wwidth = $(window).width();

    if(wwidth == 0)
        wwidth = 500;

    _htmlBox = (typeof _htmlBox != 'undefined' && _htmlBox);

    var cb_class = (_htmlBox) ? 'lzm-alert-dialog-html' : 'lzm-alert-dialog-message';

    try
    {
        lzm_displayHelper.unblockUi();
    }
    catch (ex) {}

    var addDefaultHandler = false;
    if(buttons==null){
        buttons = [{id: 'ok', name: tid('ok')}];
        addDefaultHandler = true;
    }
    var doInitEditorOnClose = '0';
    var dialogHtml = '<div class="lzm-alert-dialog-container lzm-alert-dialog-container-dim '+cb_class+'" id="lzm-alert-dialog-container">';
    var dialogInnerHtml = '<div class="lzm-alert-dialog" id="lzm-alert-dialog" data-do-init-editor-on-close="' + doInitEditorOnClose + '">' +
        '<div id="lzm-alert-dialog-content">' + errorMessage + '</div>' +
        '<div id="lzm-alert-dialog-buttons">';

    for (var i=0; i<buttons.length; i++)
    {
        dialogInnerHtml += '<span class="alert-button" id="alert-btn-' + buttons[i].id + '" data-id="' + buttons[i].id + '"';

        if(d(buttons[i].style))
            dialogInnerHtml += ' styke="' + buttons[i].style + '"';

        dialogInnerHtml += '>' + buttons[i].name + '</span>';
    }

    dialogInnerHtml += '</div></div>';
    dialogHtml += dialogInnerHtml + '</div>';

    $('body').append('<div id="dialog-test-size-div" style="position: absolute; left: -2000px; top: -2000px; width: 1800px; height: 1800px;"></div>').trigger('create');
    $('#dialog-test-size-div').html(dialogInnerHtml.replace(/id="lzm-alert/g, 'id="test-lzm-alert').replace(/id="alert-btn-/, 'id="test-alert-btn-')).trigger('create');

    $('#test-lzm-alert-dialog-content').css({'position':'static',overflow:'visible'});
    $('#test-lzm-alert-dialog-buttons').css({'position':'static',overflow:'visible'});

    var twWidth = $('#test-lzm-alert-dialog').width();

    if(_htmlBox)
        this.alertDialogWidth = Math.min(Math.round(wwidth * 0.9), twWidth);
    else
        this.alertDialogWidth = Math.min(Math.round(wwidth * 0.9), 360);

    $('#test-lzm-alert-dialog').css({width: this.alertDialogWidth+'px'});

    var twHeight = $('#test-lzm-alert-dialog').height()+44;

    if(!_htmlBox)
        twHeight += 23;

    this.alertDialogHeight = twHeight;

    if(this.alertDialogHeight > $(window).height())
    {
        this.alertDialogHeight = $(window).height()-20;
        this.alertDialogWidth += 16;
    }

    $('#dialog-test-size-div').remove();
    $('body').append(dialogHtml).trigger('create');

    CommonDialogClass.IsAlert = true;

    this.resizeAlertDialog();

    if(addDefaultHandler)
        $('#alert-btn-ok').click(function() {
            lzm_commonDialog.removeAlertDialog();
        });

    $('#lzm-alert-dialog-content').css({overflow:'auto'});
};

CommonDialogClass.prototype.removeAlertDialog = function() {

    CommonDialogClass.IsAlert = false;
    $('#lzm-alert-dialog-container').remove();
    if(typeof lzm_chatDisplay !== 'undefined')
        lzm_chatDisplay.ChatsUI.UnblockEditor();
};

CommonDialogClass.prototype.ChangePassword = function(_force) {
    var that = this;

    _force = (d(_force)) ? _force : false;

    if(typeof lzm_chatDisplay !== 'undefined')
        lzm_chatDisplay.showUsersettingsHtml = false;

    $('#usersettings-menu').css({'display': 'none'});
    var bodyString = this.CreatePasswordChangeHtml(_force);
    var buttons = [{id: 'change-password-ok', name: tid('ok')}];

    if(!_force)
        buttons.push({id: 'change-password-cancel', name: tid('cancel')});

    lzm_commonDialog.createAlertDialog(bodyString, buttons, true);

    $('#new-password').keyup(function() {
        that.checkPasswordStrength($(this).val());
        if ($(this).val().length > 0) {
            $('#change-password-ok').removeClass('ui-disabled');
        } else {
            $('#change-password-ok').addClass('ui-disabled');
        }
    });
    var validatePasswordInput = function(_previous, _new, _newRepeat) {
        if (!_previous.length)
            return 1;
        if (sha256(md5(_previous)) != CommunicationEngine.chosenProfile.login_passwd && _previous != CommonDialogClass.ChangedPassword)
            return 1;
        else if (_new == _previous)
            return 2;
        else if (_new != _newRepeat)
            return 3;
        else
            return 0;
    };
    $('#alert-btn-change-password-ok').click(function() {
        var pwVal = validatePasswordInput($('#previous-password').val(), $('#new-password').val(), $('#confirm-password').val());
        if (pwVal == 0)
        {
            savePasswordChange($('#new-password').val());
            lzm_commonDialog.removeAlertDialog();
        }
        else
        {
            var alertMessage = '';
            if (pwVal == 1)
                alertMessage = t('Old password is not correct.');
            else if (pwVal == 2)
                alertMessage = t('New password must be different from old password.');
            else if (pwVal == 3)
                alertMessage = t('New password does not match with password repetition.');

            $('#password-error').html(alertMessage);
        }
    });
    $('#alert-btn-change-password-cancel').click(function() {

        lzm_commonDialog.removeAlertDialog();
    });

    if(!IFManager.IsMobileOS)
        $('#previous-password').focus();
};

CommonDialogClass.prototype.CreatePasswordChangeHtml = function(_force) {
    var myHtml = '<fieldset class="lzm-fieldset"><legend>'+tid('change_password')+'</legend>';

    if(_force)
        myHtml += tid('force_change_pw') + ' ';

    myHtml +=
        '<div class="top-space-double"><label for="previous-password">' + t('Current password:') + '</label>' +
        '<input type="password" id="previous-password" class="lzm-text-input" /></div>' +
        '<div class="top-space"><label for="new-password">' + tidc('new_password') + '</label>' +
        '<input type="password" id="new-password" class="lzm-text-input" /></div>' +
        '<div class="top-space"><label for="confirm-password">' + tidc('new_password_repetition') + '</label>' +
        '<input type="password" id="confirm-password" class="lzm-text-input" /></div>' +
        '<div><br><table class="top-space-double"><tr>' +
        '<td><div id="password-strength-0" class="password-strength">&nbsp;</div></td>' +
        '<td><div id="password-strength-1" class="password-strength">&nbsp;</div></td>' +
        '<td><div id="password-strength-2" class="password-strength">&nbsp;</div></td>' +
        '<td><div id="password-strength-3" class="password-strength">&nbsp;</div></td>' +
        '</tr></table><br><div id="password-error" class="text-red text-bold"></div></div>' +
        '</fieldset>';

    return myHtml;
};

CommonDialogClass.prototype.checkPasswordStrength = function(password) {
    var cat = [
        password.match(/[a-z]/),
        password.match(/[A-Z]/),
        password.match(/[0-9]/),
        password.match(/[^a-z^A-Z^0-9]/)
    ];
    var noc = 0, pl = password.length;
    for (var i=0; i<cat.length; i++) {
        noc += (cat[i] != null) ? 1 : 0;
    }
    $('.password-strength').css({'background-color': '#f1f1f1'});
    if ((noc == 1 && pl < 10) || (noc != 1 && pl < 6)) {
        $('#password-strength-0').css({'background-color': '#d40000'});
    } else if ((noc == 1 && pl >= 10) || (noc == 2 && pl >= 6 && pl < 10)) {
        $('#password-strength-0').css({'background-color': '#d40000'});
        $('#password-strength-1').css({'background-color': '#d40000'});
    } else if ((noc == 2 && pl >= 10) || (noc >= 3 && pl >= 6 && pl < 10)) {
        $('#password-strength-0').css({'background-color': '#ff7800'});
        $('#password-strength-1').css({'background-color': '#ff7800'});
        $('#password-strength-2').css({'background-color': '#ff7800'});
    } else {
        $('#password-strength-0').css({'background-color': '#74b924'});
        $('#password-strength-1').css({'background-color': '#74b924'});
        $('#password-strength-2').css({'background-color': '#74b924'});
        $('#password-strength-3').css({'background-color': '#74b924'});
    }
};

CommonDialogClass.prototype.resizeAlertDialog = function() {
    if ($('#lzm-alert-dialog-container').length > 0)
    {
        var dialogLeft = Math.round(0.5 * ($(window).width() - this.alertDialogWidth));
        var dialogTop = Math.round(0.5 * ($(window).height() - this.alertDialogHeight));
        var myContainerCss = {width: $(window).width()+'px', height: $(window).height()+'px'};
        var myCss = {left: dialogLeft+'px', top: dialogTop+'px', width: this.alertDialogWidth+'px', height: this.alertDialogHeight+'px'};
        $('#lzm-alert-dialog-container').css(myContainerCss);
        $('#lzm-alert-dialog').css(myCss);
    }
};

CommonDialogClass.prototype.CreateDialogWindow = function(headerString,
                                                          bodyString,
                                                          footerString,
                                                          _icon,
                                                          _typeId,
                                                          _dialogId,
                                                             /*OLD defaultCss,*/
                                                             /*OLD desktopBrowserCss,*/
                                                             /*OLD mobileBrowserCss,*/
                                                             /*OLD appCss,*/
                                                             /*OLD position,*/

                                                             /*NEW*/ _closeButtonId,

                                                          _fullscreen,
                                                          _data,
                                                          _showInTaskBar,
                                                          _taskBarIndex,
                                                          _minimized,
                                                          _tag,

                                                             /*OLD showMinimizeIcon,*/

                                                          _searchBox

                                                          ) {

    _dialogId = (typeof _dialogId != 'undefined') ? _dialogId : '';
    _data = (typeof _data != 'undefined') ? _data : {};
    _fullscreen = (typeof _fullscreen != 'undefined') ? _fullscreen : true;
    _showInTaskBar = (typeof _showInTaskBar != 'undefined') ? _showInTaskBar : true;
    _taskBarIndex = (d(_taskBarIndex) && _taskBarIndex != null) ? _taskBarIndex : 11111;
    _minimized = (d(_minimized)) ? _minimized : false;
    _tag = (d(_tag)) ? _tag : '';
    _searchBox = (d(_searchBox)) ? _searchBox : false;

    CommonUIClass.ToggleSelectViewMenu(true);

    if(TaskBarManager.WindowExists(_dialogId,true))
    {
        return '';
    }

    if(typeof lzm_chatDisplay !== 'undefined')
        lzm_chatDisplay.ChatsUI.BlockEditor();

    try
    {
        lzm_chatDisplay.dialogData = (typeof _data != 'undefined') ? _data : {ratio : this.DialogBorderRatioFull};
    }
    catch(ex)
    {

    }

    TaskBarManager.ReturnToActiveWindowOnNextClose();

    var winObj = TaskBarManager.AddWindow(_typeId, _dialogId, _fullscreen, _closeButtonId, headerString, _icon, _showInTaskBar, _taskBarIndex, _minimized, _tag, _searchBox);
    winObj.Footer = footerString;
    winObj.Header = headerString;
    winObj.Body = bodyString;

    if(!_minimized)
    {
        this.CreateDialogWindowHTML(winObj);
    }

    return _dialogId;
};

CommonDialogClass.prototype.CreateDialogWindowHTML = function (_winObj){

    var _fullscreen = _winObj.Fullscreen;
    var _dialogId = _winObj.DialogId;
    var _closeButtonId = _winObj.CloseButtonId;
    var classnameExtension = (_fullscreen) ? '-fullscreen' : '';
    var showMinimizeIcon = true;
    var position = 'absolute';
    var searchboxClass = (_winObj.SearchBox) ? ' searchbox' : '';

    var htmlContents = '<div id="' + _dialogId + '-container" class="dialog-window-container cm-click'+searchboxClass+'"><div id="' + _dialogId + '" onclick="lzm_chatDisplay.RemoveAllContextMenus();event.stopPropagation();" class="dialog-window' + classnameExtension + '"><div id="' + _dialogId + '-headline" class="dialog-window-headline' + classnameExtension + '">' + _winObj.Header;

    htmlContents += '<span id="minimize-dialog" onclick="TaskBarManager.Minimize(\'' + _dialogId + '\')"><i class="fa fa-minus-square"></i></span>';

    htmlContents += '<span id="close-dialog" onclick="TaskBarManager.Close(\'' + _dialogId + '\')"><i class="fa fa-times-circle"></i></span>';

    htmlContents += '</div><div id="' + _dialogId + '-body" class="dialog-window-body' + classnameExtension + '">' + _winObj.Body + '</div>';

    if(_winObj.Footer != null)
        htmlContents += '<div id="' + _dialogId + '-footline" class="dialog-window-footline' + classnameExtension + '">' + _winObj.Footer + '</div>';

    htmlContents += '</div></div>';

    var chatPage = $('#chat_page');
    if (chatPage.length == 0)
        chatPage = $('#login_page');

    chatPage.append(htmlContents).trigger('create');

    $('#close-dialog').click(function(){
        $('#'+ _closeButtonId).click();
    });

    try
    {
        lzm_chatDisplay.dialogWindowCss.position = position;
        $('#' + _dialogId + '-container').css(lzm_chatDisplay.dialogWindowContainerCss);
        if (_fullscreen)
        {
            $('#' + _dialogId).css(lzm_chatDisplay.FullscreenDialogWindowCss);
            $('#' + _dialogId + '-headline').css(lzm_chatDisplay.FullscreenDialogWindowHeadlineCss);
            $('#' + _dialogId + '-body').css(lzm_chatDisplay.FullscreenDialogWindowBodyCss);
            $('#' + _dialogId + '-footline').css(lzm_chatDisplay.FullscreenDialogWindowFootlineCss);
        }
        else
        {
            $('#' + _dialogId).css(lzm_chatDisplay.dialogWindowCss);
            $('#' + _dialogId + '-headline').css(lzm_chatDisplay.dialogWindowHeadlineCss);
            $('#' + _dialogId + '-body').css(lzm_chatDisplay.dialogWindowBodyCss);
            $('#' + _dialogId + '-footline').css(lzm_chatDisplay.dialogWindowFootlineCss);
        }
    }
    catch (ex)
    {
        lzm_commonDisplay.dialogWindowCss.position = position;
        $('#' + _dialogId + '-container').css(lzm_commonDisplay.dialogWindowContainerCss);
        if (_fullscreen)
        {
            $('#' + _dialogId).css(lzm_commonDisplay.FullscreenDialogWindowCss);
            $('#' + _dialogId + '-headline').css(lzm_commonDisplay.FullscreenDialogWindowHeadlineCss);
            $('#' + _dialogId + '-body').css(lzm_commonDisplay.FullscreenDialogWindowBodyCss);
            $('#' + _dialogId + '-footline').css(lzm_commonDisplay.FullscreenDialogWindowFootlineCss);
        }
        else
        {
            $('#' + _dialogId).css(lzm_commonDisplay.dialogWindowCss);
            $('#' + _dialogId + '-headline').css(lzm_commonDisplay.dialogWindowHeadlineCss);
            $('#' + _dialogId + '-body').css(lzm_commonDisplay.dialogWindowBodyCss);
            $('#' + _dialogId + '-footline').css(lzm_commonDisplay.dialogWindowFootlineCss);
        }
    }

    lzm_chatDisplay.RenderWindowLayout(true, true);

    if(showMinimizeIcon)
        $('#' + _dialogId + '-container').attr('onclick','TaskBarManager.Minimize(\'' + _dialogId + '\')');

    _winObj.HTMLCreated = true;
    _winObj.Footer = null;
    _winObj.Header = null;
    _winObj.Body = null;
};

CommonDialogClass.prototype.getMyObjectName = function() {
    for (var name in window)
    {
        if (window[name] == this)
        {
            return name;
        }
    }
    return '';
};
