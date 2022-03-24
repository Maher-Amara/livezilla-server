/****************************************************************************************
 * LiveZilla CommonDisplayClass.js
 *
 * Copyright 2018 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/

function CommonDisplayClass() {
    this.orientation = 'vertical';
    this.dialogWindowWidth = 0;
    this.dialogWindowHeight = 0;
    this.FullscreenDialogWindowWidth = 0;
    this.FullscreenDialogWindowHeight = 0;
    this.dialogWindowLeft = 0;
    this.dialogWindowTop = 0;
    this.FullscreenDialogWindowTop = 0;
    this.dialogWindowContainerCss = {};
    this.dialogWindowCss = {};
    this.dialogWindowHeadlineCss = {};
    this.dialogWindowBodyCss = {};
    this.dialogWindowFootlineCss = {};
    this.FullscreenDialogWindowCss = {};
    this.FullscreenDialogWindowHeadlineCss = {};
    this.FullscreenDialogWindowBodyCss = {};
    this.FullscreenDialogWindowFootlineCss = {};
}

CommonDisplayClass.prototype.createLayout = function () {

    var windowWidth = $(window).width();
    var windowHeight = $(window).height();

    this.FullscreenDialogWindowWidth = (windowWidth <= 600 || windowHeight <= 500) ? windowWidth : Math.floor(0.95 * windowWidth) - 40;
    this.FullscreenDialogWindowHeight = (windowWidth <= 600 || windowHeight <= 500) ? windowHeight : Math.floor(0.95 * windowHeight) - 40;
    if (this.FullscreenDialogWindowWidth <= 600 || this.FullscreenDialogWindowHeight <= 500) {
        this.dialogWindowWidth = this.FullscreenDialogWindowWidth;
        this.dialogWindowHeight = this.FullscreenDialogWindowHeight;
    } else {
        this.dialogWindowWidth = 600;
        this.dialogWindowHeight = 500;
    }
    this.dialogWindowLeft = (this.dialogWindowWidth < windowWidth) ? Math.floor((windowWidth - this.dialogWindowWidth) / 2) : 0;
    this.dialogWindowTop = (this.dialogWindowHeight < windowHeight) ? Math.floor((windowHeight - this.dialogWindowHeight) / 2) : 0;
    this.FullscreenDialogWindowTop = (this.FullscreenDialogWindowHeight < windowHeight) ? Math.floor((windowHeight - this.FullscreenDialogWindowHeight) / 2) : 0;

    var dialogWindowBorder = (this.dialogWindowWidth < windowWidth && this.dialogWindowHeight < windowHeight) ? '2px solid #666' : '0px';
    var dialogWindowBorderRadius = (this.dialogWindowWidth < windowWidth && this.dialogWindowHeight < windowHeight) ? '6px' : '0px';
    var dialWinIntBorderRadius = (this.dialogWindowWidth < windowWidth && this.dialogWindowHeight < windowHeight) ? '4px' : '0px';
    this.dialogWindowContainerCss = {
        position: 'absolute', left: '0px', bottom: '0px', width: windowWidth+'px', height: windowHeight+'px',
        'background-color': 'rgba(0,0,0,0.75)', 'z-index': '1001', overflow: 'hidden'
    };

    this.dialogWindowCss = {
        position: 'absolute', left: this.dialogWindowLeft+'px', bottom: this.dialogWindowTop+'px',
        width: this.dialogWindowWidth+'px', height: this.dialogWindowHeight+'px',
        border: dialogWindowBorder, 'border-radius': dialogWindowBorderRadius, 'z-index': '1002'
    };
    this.dialogWindowHeadlineCss = {
        position: 'absolute', left: '0px', top: '0px', 'border-bottom': '1px solid #ccc',
        width: (this.dialogWindowWidth - 5)+'px', height: '20px',
        'border-top-left-radius': dialWinIntBorderRadius, 'border-top-right-radius': dialWinIntBorderRadius,
        padding: '6px 0px 0px 5px', 'font-weight': 'bold', 'text-shadow': 'none',
        'background-color': '#8c8c8c', color: '#ffffff'
    };
    this.dialogWindowBodyCss = {
        position: 'absolute', left: '0px', top: '27px',
        width: (this.dialogWindowWidth - 10)+'px', height: (this.dialogWindowHeight - 73)+'px',
        padding: '4px 5px 4px 5px', 'text-shadow': 'none',
        'background-color': '#FFFFFF', 'overflow-y': 'auto', 'overflow-x': 'hidden'
    };
    this.dialogWindowFootlineCss = {
        position: 'absolute', left: '0px', top: (this.dialogWindowHeight - 38)+'px', 'border-top': '1px solid #ccc',
        width: (this.dialogWindowWidth - 6)+'px', height: '27px', 'text-align': 'right',
        padding: '10px 6px 0px 0px',
        'border-bottom-left-radius': dialWinIntBorderRadius, 'border-bottom-right-radius': dialWinIntBorderRadius,
        'background-color': '#f5f5f5'
    };

    $('.dialog-window-container').css(this.dialogWindowContainerCss);
    $('.dialog-window').css(this.dialogWindowCss);
    $('.dialog-window-headline').css(this.dialogWindowHeadlineCss);
    $('.dialog-window-body').css(this.dialogWindowBodyCss);
    $('.dialog-window-footline').css(this.dialogWindowFootlineCss);
    $('.dialog-window-fullscreen').css(this.FullscreenDialogWindowCss);
    $('.dialog-window-headline-fullscreen').css(this.FullscreenDialogWindowHeadlineCss);
    $('.dialog-window-body-fullscreen').css(this.FullscreenDialogWindowBodyCss);
    $('.dialog-window-footline-fullscreen').css(this.FullscreenDialogWindowFootlineCss);

    lzm_commonDialog.resizeAlertDialog();
};

CommonDisplayClass.prototype.fillProfileSelectList = function(storageData, runningFromApp, selectedIndex) {
    selectedIndex = (typeof selectedIndex != 'undefined') ? selectedIndex : -1;
    var htmlString = '<option data-placeholder="true" value="-1" id="no-profile">' + t('No profile selected') + '</option>';
    storageData.sort(this.sortProfiles);
    var selectedString = '';
    for (var i=0; i<storageData.length; i++) {
        selectedString = '';
        if (storageData[i].index == selectedIndex) {
            selectedString = ' selected="selected"';
            $('#server_profile_selection-inner-text').html(storageData[i].server_profile);
        }
        if (storageData[i].index != 0) {
            htmlString += '<option value="' + storageData[i].index + '"' + selectedString + '>' + storageData[i].server_profile + '</option>';
        }
    }
    var thisServerProfileSelection = $('#server_profile_selection');
    thisServerProfileSelection.html(htmlString);
};

CommonDisplayClass.prototype.sortProfiles = function(a,b) {
    return (a['server_profile'].toLowerCase() > b['server_profile'].toLowerCase());
};
