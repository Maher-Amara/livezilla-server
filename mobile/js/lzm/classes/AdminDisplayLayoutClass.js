function AdminDisplayLayoutClass() {

}

AdminDisplayLayoutClass.prototype.resizeAll = function() {
    this.resizeUserManagement();
    this.resizeEditUserConfiguration();
    this.resizeSignatureInput();
    this.resizeTextEmailsInput();
    this.resizeGroupTitleInput();
    this.resizeSocialMediaInput();
    this.resizeOpeningHoursInput();
};

AdminDisplayLayoutClass.prototype.resizeUserManagement = function() {
    if ($('#umg-content').length > 0 && $('#umg-list-view').css('display') == 'block')
    {
        var myHeight = $('#umg-content').height();
        $('#operator-list-fieldset').css({'min-height': (myHeight - 72)+'px'});
        $('#group-list-fieldset').css({'min-height': (myHeight - 72)+'px'});
    }
};

AdminDisplayLayoutClass.prototype.resizeEditUserConfiguration = function() {
    if ($('#umg-edit-view').length > 0 && $('#umg-edit-view').css('display') == 'block')
    {
        var myHeight = $(window).height();
        $('#umg-edit-view').css({width: '100%', height: (myHeight)+'px'});
        $('.permissions-placeholder-content').css({'min-height': (myHeight - 120)+'px'});
        $('.perm-inner-fs').css({'min-height': (myHeight - 144)+'px'});
        $('#signature-list-div').css({'min-height': '200px'});
        $('#text-emails-list-div').css({height: (myHeight - 380)+'px'});
        $('.gr-input-field-select').css({width: '200px'});
        $('#gr-ticket-in-mb-div').css({overflow: 'auto', 'height': (myHeight - 600)+'px'});
        $('#gr-ticket-social-list-div').css({'min-height': (myHeight - 250)+'px'});
        $('#gr-ticket-assign-list-div').css({'min-height': (myHeight - 250)+'px'});
        $('.gr-ticket-assign-select').css({width: '200px'});
        $('#gr-oh-list-div').css({'min-height': '200px'});
    }
};

AdminDisplayLayoutClass.prototype.resizeSignatureInput = function() {
    if ($('#signature-inner-div').length > 0) {
        var myHeight = $(window).height(), myWidth = $(window).width();
        var textAreaHeight = Math.max(100, myHeight - 350);
        $('#signature-inner-div').css({height: (myHeight)+'px'});
        $('#signature-text').css({height: textAreaHeight+'px'});
    }
};

AdminDisplayLayoutClass.prototype.resizeTextEmailsInput = function() {
    if ($('#text-emails-inner-div').length > 0)
    {
        var myHeight = $(window).height();
        var taaHeight = Math.max(60, Math.floor(myHeight / 2) - 205);
        var tabHeight = Math.max(60, Math.floor(myHeight / 2) - 215);
        var tacHeight = Math.max(60, myHeight - 440);
        var tadHeight = Math.max(60, myHeight - 360);
        var taeHeight = 100;
        $('#text-emails-inner-div').css({height: (myHeight-40)+'px', overflow: 'auto'});
        $('.text-emails-inner-tabs').css({'min-height': (myHeight - 158)+'px'});
        $('.tae-inner-tab-textarea-a').css({height: taaHeight + 'px'});
        $('.tae-inner-tab-textarea-b').css({height: tabHeight + 'px'});
        $('.tae-inner-tab-textarea-c').css({height: tacHeight + 'px', 'margin-bottom': '10px'});
        $('.tae-inner-tab-textarea-d').css({height: tadHeight + 'px'});
        $('.tae-inner-tab-textarea-e').css({height: taeHeight + 'px'});
        $('#tae-inner-tab-text-qmt-container').css({height: '60px'});
        $('.tae-email-textarea').css({height: (myHeight - 490)+'px'});
        $('#tae-inner-tab-text-qmt-label').css({'white-space': 'nowrap'});
        $('.tae-inner-tab-email-cte-tabs-placeholder-content').css({overflow: 'hidden'});
        $('.tae-inner-tab-email-tore-tabs-placeholder-content').css({overflow: 'hidden'});
        $('.tae-inner-tab-email-tae-tabs-placeholder-content').css({overflow: 'hidden'});
        $('.lzm-fieldset .lzm-tabs-row').css({background: '#fff'});
    }
};

AdminDisplayLayoutClass.prototype.resizeGroupTitleInput = function() {
    if ($('#group-title-inner-div').length > 0) {
        var myHeight = $(window).height(), myWidth = $(window).width();
        $('#group-title-inner-fs').css({'min-height': (myHeight - 35)+'px'});
    }
};

AdminDisplayLayoutClass.prototype.resizeSocialMediaInput = function() {
    if ($('#gr-tickets-social-fs').length > 0)
    {
        var myHeight = $(window).height();
        $('#umg-input-view').css({height: (myHeight-40)+'px'});
    }

    var tabHeight = $('#umg-edit-placeholder-tabs-row').height();
    $('.gr-tickets-placeholder-content > .lzm-tab-scroll-content').each(function(){

        var tab = $(this);
        tab.css({top:(60 + tabHeight) + 'px'});

    });
};

AdminDisplayLayoutClass.prototype.resizeOpeningHoursInput = function() {
    if ($('#opening-hours-inner-div').length > 0) {
        var myHeight = $(window).height();
        $('#opening-hours-inner-div').css({height: (myHeight)+'px', 'overflow-y': 'auto'});
        $('#opening-hours-inner-fs').css({'min-height': (myHeight - 35)+'px'});
    }
};
