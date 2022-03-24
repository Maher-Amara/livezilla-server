/****************************************************************************************
 * LiveZilla UIRendererClass.js
 *
 * Copyright 2018 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/

function UIRendererClass() {
    this.windowWidth = 0;
    this.windowHeight = 0;
    this.maxWindowHeight = 0;
    this.chatPageHeight = 0;
    this.chatPageTop = 0;
    this.mainMenuPosition = {top: 13, left: 15};
    this.mainMenuHeight = 40;
    this.mainMenuWidth = 0;
    this.viewSelectPanelHeight = 31;
    this.viewContainerHeight = 0;
    this.viewContainerWidth = 0;
    this.viewContainerCss = {};
}

UIRendererClass.ResizeTimeout = null;

UIRendererClass.prototype.resizeAll = function() {

    if(UIRendererClass.ResizeTimeout != null)
    {
        clearInterval(UIRendererClass.ResizeTimeout);
        UIRendererClass.ResizeTimeout = null;
    }

    var that = this;

    UIRendererClass.ResizeTimeout = setTimeout(function(){

        lzm_chatDisplay.windowWidth =
        that.windowWidth = $(window).width();

        lzm_chatDisplay.windowHeight =
        that.windowHeight = $(window).height();

        that.mainMenuWidth = that.windowWidth - 32;
        if (that.windowHeight > that.maxWindowHeight)
            that.maxWindowHeight = that.windowHeight;

        that.chatPageHeight = that.windowHeight;
        that.chatPageTop = that.mainMenuPosition.top + that.mainMenuHeight + that.viewSelectPanelHeight + 10;
        if (IFManager.IsAppFrame && that.windowHeight < 390) {
            that.chatPageHeight = Math.min(390, that.maxWindowHeight);
        }
        that.viewContainerHeight = that.chatPageHeight - that.chatPageTop - 27;
        that.viewContainerWidth = that.mainMenuWidth - 10;

        that.viewContainerCss = {position: 'absolute', width: that.viewContainerWidth+'px', height: that.viewContainerHeight+'px',
            padding: '5px', left: '0px', top: '2px', display: 'block', border: '1px solid #ccc', 'border-radius': '4px',
            overflow: 'hidden', background: '#fff'};

        that.resizeStartPage();
        that.resizeMychats();
        that.resizeTicketList();
        that.resizeArchive();
        that.resizeOperatorList();
        that.ResizeVisitorList();
        that.resizeFilter();
        that.resizeAllChats();
        that.resizeReportList();
        that.resizeTicketDetails();
        that.resizeEmailDetails();
        that.resizeOptions();
        that.resizeNavigation();
        that.resizeResources();
        that.resizeAddResources();
        that.resizeEditResources();
        that.resizeResourceSettings();
        that.resizeTicketReply();
        that.resizeVisitorDetails();
        that.resizeVisitorInvitation();
        that.resizeMessageForwardDialog();
        that.resizeArchivedChat();
        that.resizeDynamicGroupDialogs();
        that.resizeTranslateOptions();
        that.resizeChatView();
        that.resizeTranslationEditor();
        that.resizeFilterCreation();
        that.resizeFilterList();
        that.resizeLinkGenerator();
        that.resizeSendTranscriptDialog();
        that.resizeTicketLinker();
        that.resizeUserManagement();
        that.resizeMenuPanels();
        that.resizeSearch();
        that.resizeServerConfiguration();

        lzm_commonDialog.resizeAlertDialog();

        UIRendererClass.ResizeTimeout = null;

    },50);
};

UIRendererClass.prototype.resizeServerConfiguration = function(){
    if($('#sc-settings-placeholder-tabs-row').length)
        $('.lzm-tab-scroll-content').css({top:($('#sc-settings-placeholder-tabs-row').height()+10)+'px'});
};

UIRendererClass.prototype.resizeSearch = function(){

    //var myHeight = $('#main-search-box').height();
    //$('#main-search-body').css({overflow:'auto',height: (myHeight-48) + 'px'});
};

UIRendererClass.prototype.resizeTicketDetails = function(){

    var t,winObj = TaskBarManager.GetActiveWindow();
    var bodyObj = null;

    if(winObj != null && winObj.TypeId == 'ticket-details')
    {
        bodyObj = $('#' + winObj.DialogId + '-body');
        var isNew = !$('#ticket-message-details').length;

        var myHeight = Math.max(bodyObj.height(), (t=$('#email-list-body').height()) ? t : 0);

        myHeight = Math.max(myHeight, (t=$('#visitor-information-body').height()) ? t : 0);

        myHeight-= 8;

        var fullScreenMode = lzm_chatDisplay.ticketDisplay.isFullscreenMode();

        $('#ticket-comment-list-frame').css({height: 'calc(100% - 31px)'});
        $('#ticket-attachment-list').css({'height': 'calc(100% - 3px)'});
        $('#ticket-new-input').css({height: '100%'});
        $('#comment-text').css({'min-height': (myHeight - 22)+'px'});
        $('#change-message-text').css({width: '100%', height: '100%'});


        $('#' + winObj.DialogId + '-tag-editor').css({height: (myHeight-31) + 'px'});

        if(fullScreenMode)
        {
            $('#ticket-details-div').css({right:0});
            $('#ticket-message-div').css({left:(!isNew) ? '341px' : 0,right:'341px'});
            $('#ticket-history-div').css({left:0});
            $('#ticket-details-inner').css({height: (myHeight-31) + 'px'});
            $('#ticket-message-placeholder').css({height:'100%','overflow-y':'auto'});
            $('#ticket-history-placeholder').css({height:'100%','overflow-y':'auto'});
            $('.ticket-history-placeholder-content').css({height: (myHeight-29) + 'px'});
            $('.ticket-message-placeholder-content').css({height: (myHeight-74) + 'px'});
            $('.ticket-details-placeholder-content').css({height: (myHeight-74) + 'px'});
            $('#ticket-message-list').css({'height': (myHeight - 74) + 'px'});
            $('#email-placeholder-content-1').css({'overflow':'hidden'});
            $('.ticket-message-iframe').css({'height': (myHeight - $('#ticket-message-details').outerHeight() - $('#ticket-message-insecure').outerHeight() - 78) + 'px'});

            if($('#att-img-preview').data('scalable'))
            {
                if($('#att-img-preview').data('natural') == '1')
                {
                    var width = $('#att-img-preview-field').width();
                    $('#att-img-preview').css({width:width+'px'});
                }
                else
                    $('#att-img-preview').css({width:'auto'});

                if($('#att-img-preview').data('natural') == '1')
                    $('#att-img-preview').css({cursor:'zoom-in'});
                else if($('#att-img-preview').data('natural') == '0')
                    $('#att-img-preview').css({cursor:'zoom-out'});
            }
            $('#ticket-ticket-details').css({height: (myHeight - 74) + 'px'});
        }
        else
        {
            $('.ticket-message-placeholder-content').css({height: '100%'});
            if(!isNew)
            {
                $('#ticket-message-text').css({'max-height': '240px',width:lzm_chatDisplay.windowWidth-73+'px',overflow:'auto'});
                $('#ticket-message-div').css({width:lzm_chatDisplay.windowWidth-53+'px','box-shadow':'0px 0px 5px #555',background:'var(--main-floor-color)'});
            }
            else
            {
                $('#ticket-message-text').css({'max-height': '240px',width:lzm_chatDisplay.windowWidth-18+'px',overflow:'auto'});
                $('#ticket-message-div').css({width:lzm_chatDisplay.windowWidth-18+'px','box-shadow':'0px 0px 5px #555',background:'var(--main-floor-color)'});
            }

            $('#ticket-message-list').css({'height': (myHeight - 39) + 'px'});
            $('#ticket-message-details').css({width:lzm_chatDisplay.windowWidth-73+'px'});
            $('#ticket-ticket-details').css({width:lzm_chatDisplay.windowWidth-20+'px',height: (myHeight-39) + 'px'});
            $('#ticket-details-placeholder').css({'border':0});
            $('#ticket-history-div, #ticket-details-div').css({right:'10px',left:'10px',width:'auto'});
        }

        var p = (ChatTicketClass.GetUIProperty('display-type', 'TEXT') == 'TEXT') ? '10px' : 0;
        
        if(isNew)
            $('#ticket-message-text').css({overflow:'hidden',padding:'10px','height': (myHeight - 74) + 'px'});
        else
            $('#ticket-message-text').css({ padding: p, 'height': (myHeight - $('#ticket-message-details').height() - 109) + 'px' });
        
        var height = $('#ticket-attachment-list').height()-$('#attachment-table').height()-7;

        height = Math.max(height,400);

        $('#att-img-preview-field').css({'height':height+'px'});
    }
};

UIRendererClass.prototype.resizeTicketReply = function() {

    var winObj = TaskBarManager.GetActiveWindow();
    var bodyObj = null;

    if (winObj != null && winObj.DialogId.endsWith('_reply'))
    {
        bodyObj = $('#' + winObj.DialogId + '-body');
    }
    else if (winObj != null && winObj.DialogId.endsWith('_preview'))
    {
        bodyObj = $('#' + winObj.DialogId + '-body');
    }
    else
        return;

    var displayViews = {'reply': 2, 'preview': 1};
    var tabControlWidth = 0, ticketDetailsBodyHeight = bodyObj.height();

    for (var view in displayViews)
        if (displayViews.hasOwnProperty(view))
            if ($('#' + view + '-placeholder-content-' + displayViews[view]).css('display') == 'block')
                tabControlWidth = $('#' + view + '-placeholder-content-' + displayViews[view]).width();

    $('.reply-placeholder-content').css({height: (ticketDetailsBodyHeight - 46) + 'px'});
    $('#message-attachment-list').css({'min-height': (ticketDetailsBodyHeight - 62) + 'px'});

    if (tabControlWidth != 0)
        $('#preview-comment-text').css({'min-height': (ticketDetailsBodyHeight - 62) + 'px'});

    var base = 510;
    var replyTextHeight = ($('#ticket-reply-files').length) ? bodyObj.height() - $('#ticket-reply-files').height() - (base+55) : bodyObj.height() - base;

    if ($('#ticket-reply-subject').prop('type')=='hidden')
        replyTextHeight += 32;

    replyTextHeight = Math.max(replyTextHeight,180);

    $('#new-message-comment').css({'min-height': '60px'});

    if(!IFManager.IsMobileOS && !IFManager.IsTabletOS)
        $('#ticket-response-body').css({'height': replyTextHeight+'px'});

    $('#ticket-reply-last-question').css({'height': replyTextHeight + 45 + 'px'});
    $('#ticket-preview-text').css({'height': replyTextHeight+'px'});

    var auoSearchWidth = $('#ticket-kb-auto-search').css('display') == 'block' ? 370 : 0;
    if(!IFManager.IsMobileOS)
    $('#ticket-composer-form').css({'right': (auoSearchWidth) +'px'});
};

UIRendererClass.prototype.resizeEmailDetails = function() {
    if ($('#email-list-body').length > 0)
    {
        var myHeight = $('#email-list-body').height() - 7;
        var listHeight = Math.floor(Math.max(myHeight / 2, 175) - 45);
        var contentHeight = (myHeight - listHeight) - 93;

        $('#email-list-frame').css({height: listHeight + 'px'});
        $('.email-placeholder-content').css({height: (contentHeight + 20) + 'px',overflow:'hidden'});
        $('#incoming-email-list-active').css({'height': (listHeight - 27) + 'px',overflow:'auto'});
        $('#incoming-email-list-deleted').css({'height': (myHeight - 84) + 'px',overflow:'auto'});
        $('#incoming-email-table-deleted').css({cursor:'default'});
        $('#email-text').css({'height': ($('.email-placeholder-content').height() - 133) + 'px'});
        $('#email-content').css({height:'calc(100% - 1px)'});
        $('#email-html').css({'height': (contentHeight + 20) + 'px'});
        $('.ticket-message-iframe').css({height: (contentHeight - 20 - $('#ticket-message-insecure').outerHeight()) + 'px'});
        $('#email-attachment-list').css({'height': (contentHeight - 20) + 'px','overflow':'auto'});
    }
};

UIRendererClass.prototype.resizeOptions = function() {

    if ($('#user-settings-dialog-body').length > 0) {
        var tabContentHeight = $('#user-settings-dialog-body').height() - 25;
        $('#view-select-settings').css({'min-height': (tabContentHeight - 48) + 'px'});
        $('#about-settings').css({'min-height': (tabContentHeight - 35) + 'px'});
        $('#tos').css({'min-height': (tabContentHeight-12) + 'px'});
        $('.settings-placeholder-content').css('height',(tabContentHeight-21) + 'px');

        $('#settings-placeholder-content-5').css({'overflow': 'hidden'});

        $('.lzm-tab-scroll-content').css({top:($('#settings-placeholder-tabs-row').height()+10)+'px'});
    }
};

UIRendererClass.prototype.resizeNavigation = function() {


    $('.view-select-button').css({display:'block'});
    $('#main_frame').css({left:'70px'});
    $('#task-bar-panel').css({left:'70px'});
    $('#main-menu-panel').css({left:'0px','z-index':113});

    CommonUIClass.BlockNavigation = true;

    var lastMN = CommonUIClass.MobileNavigation;
    var nextMN = lzm_chatDisplay.windowWidth < 700;

    CommonUIClass.MobileNavigation = nextMN;

    if(CommonUIClass.MobileNavigation)
    {
        $('#main_frame').css({left:'0'});
        $('#view-select-panel').css({right:0,left:'auto',top:'42px','z-index':104});
        $('#task-bar-panel').css({left:'0px'});
        $('#main-menu-panel-tools-menu').css({'display':'inline-block'});
    }
    else
    {
        $('#view-select-panel').css({right:'auto',left:0,top:0,display:'block','z-index':104});
        $('#main-menu-panel-tools-menu').css({'display':'none'});
    }

    if(IFManager.IsMobileOS && KnowledgebaseUI.SelectionMode)
        $('#view-select-panel').css('display','none');

    if(lastMN != nextMN && nextMN)
        $('#view-select-panel').css({display:'none'});
};

UIRendererClass.prototype.resizeResources = function() {
    var bh,bw,resultListHeight;
    var winObj = TaskBarManager.GetActiveWindow();
    var sp = lzm_chatDisplay.resourcesDisplay.ShowPreview && lzm_chatDisplay.windowWidth > 800;

    if (lzm_chatDisplay.selected_view == 'qrd')
    {
        bh = $('#qrd-tree-body').height();
        bw = $('#qrd-tree-body').width();

        if($('#all-resources-inner').outerHeight() > $('#all-resources').outerHeight())
            $('#all-resources-preview').css('box-shadow','none');

        if($('#all-resources').css('display') == 'block')
        {
            // main KB - TREE
            $('#all-resources').css({height: (bh + 35) + 'px', width : (sp) ? (bw - 400) + 'px' : '100%'});
        }
        else
        {
            // main KB - SEARCH
            resultListHeight = $('#qrd-tree-body').height()+62;
            $('#search-results').css({'height': resultListHeight + 'px'});
        }

        if(sp)
            $('#preview-qrd').addClass('lzm-button-b-pushed');
        else
            $('#preview-qrd').removeClass('lzm-button-b-pushed');

        $('.qrd-tree-placeholder-content').css({height:''});
        $('#all-resources-preview').css({display: (sp) ? 'block' : 'none',left:(bw - 400) + 'px',height: (bh + 15) + 'px'});
    }

    if(winObj != null && winObj.TypeId.startsWith('qrd-tree-dialog'))
    {
        // dialog KB - TREE
        /*
        $('.qrd-tree-placeholder-content').css({height: ($('#'+winObj.DialogId+'-body').height() - 40) + 'px'});
        $('.qrd-tree-dialog-placeholder-content').css({height: ($('#'+winObj.DialogId+'-body').height() - 37) + 'px'});

        resultListHeight = $('#'+winObj.DialogId+'-body').height() - $('#search-input').height() - 89;

        $('#search-results').css({'min-height': resultListHeight + 'px'});
        $('#all-resources-dialog').css({overflow:'auto',height: (lzm_chatDisplay.windowHeight-116) + 'px',width : (sp) ? (lzm_chatDisplay.windowWidth - 500) + 'px' : '100%'});

        bh = $('#qrd-tree-dialog-placeholder-content-0').height();
        $('#all-resources-preview-dialog').css({display: (sp) ? 'block' : 'none',left:(lzm_chatDisplay.windowWidth - 500) + 'px',height: (bh+1) + 'px'});
    */}
};

UIRendererClass.prototype.resizeAddResources = function() {

    var winObj = TaskBarManager.GetActiveWindow();
    if (winObj != null && $('#'+winObj.DialogId+'-body').length > 0)
    {
        var myHeight = $('#'+winObj.DialogId+'-body').height();
        var controlsHeight = $('#show-kb-entry-controls').outerHeight();

        var qrdTextHeight = myHeight - 269;

        // new
        $('#show-kb-entry-text-inner').css({height:  (qrdTextHeight + 24)+'px'});
        $('#show-kb-entry-text').css({height: (qrdTextHeight + 25)+'px','box-shadow': 'none', 'border-radius': '0px', padding: '0px', margin: '0px', border: '1px solid #ccc'});
        $('#show-kb-entry-body').css({height: (qrdTextHeight - controlsHeight + 20)+'px','box-shadow': 'none', 'border-radius': '0px', margin: '0px', 'overflow-y': 'hidden', 'border-top': 'var(--main-border)'});
        $('#show-kb-entry-url-icon').css({top: '0px'});
        $('#show-kb-entry-url-text').css({top: '0px'});
        $('#file-drop-box').css({height: (myHeight-110)});
    }
};

UIRendererClass.prototype.resizeEditResources = function() {
    var winObj = TaskBarManager.GetActiveWindow();
    if (winObj != null && $('#edit-resource').length > 0)
    {
        var myHeight = Math.max($('#'+winObj.DialogId+'-body').height(), $('#qrd-tree-dialog-body').height(), $('#ticket-details-body').height());
        var qrdTextHeight = myHeight - 140;
        $('#qrd-edit-text-inner').css({width:'100%', height:  (qrdTextHeight + 24)+'px', border: '1px solid #ccc','background-color': '#f5f5f5'});
        $('#qrd-edit-text').css({height: (qrdTextHeight +25)+'px','box-shadow': 'none', 'border-radius': '0px', padding: '0px', margin: '0px', border: '1px solid #ccc'});
        $('#qrd-edit-text-body').css({height: (qrdTextHeight - 11)+'px','box-shadow': 'none', 'border-radius': '0px', margin: '0px','background-color': '#fff', 'overflow-y': 'hidden', 'border-top': '1px solid #ccc'});
        $('#qrd-edit-url-icon').css({top: '0px'});
        $('#qrd-edit-url-text').css({top: '0px'});
    }
};

UIRendererClass.prototype.resizeResourceSettings = function() {

};

UIRendererClass.prototype.resizeVisitorDetails = function() {

    var visMon = DataEngine.getConfigValue('gl_vmcc',false) != 0;

    $('.dialog-visitor-info, .embedded-visitor-info').each(function()
    {
        var dialog = $(this).attr('class') == 'dialog-visitor-info';
        var elementId = ((!dialog) ? 'e-' : 'd-') + $(this).attr('data-visitor-id');
        var navHeight = $('#visitor-info-'+elementId+'-placeholder-tabs-row').height() + 10;
        var contentHeight = (dialog) ? $('#visitor-info-'+elementId+'-placeholder').parent().height()-navHeight-35 : $('#chat-info-body').height()-navHeight;
        var visBodyWidth = (dialog) ? $('#visitor-info-'+elementId+'-placeholder').parent().width() : $('#chat-info-body').width()-20;
        var showPreview = (lzm_chatDisplay.windowWidth > ChatArchiveClass.PreviewSwitchWidth && !dialog);

        if(showPreview)
        {
            // desktop
            //$('#matching-chats-'+elementId+'-inner-div').css({left:0, position: 'absolute', right: 450 + 'px', height: '100%'});
            //$('#matching-chats-'+elementId+'-inner').css({overflow:'auto', height: '100%'});
            $('#chat-content-'+elementId+'-inner').css({display: 'block', overflow:'auto', position: 'absolute', right: 0, width: 440 + 'px', height: '100%'});
        }
        else
        {
            // mobile or chat info
            //$('#matching-chats-'+elementId+'-inner-div').css({left:0, position: 'absolute', 'border-width': '0px', right: 0, height: contentHeight});
            //$('#matching-chats-'+elementId+'-inner').css({overflow:'auto', width: visBodyWidth + 'px', height: contentHeight});
            $('#chat-content-'+elementId+'-inner').css({display: 'none'});
        }

        $('.visitor-info-'+elementId+'-placeholder-content').each(function(i) {

            var first = $(this).children(":first");
            first.addClass('lzm-tab-scroll-content').css({bottom:'8px','background':'transparent'});

            if(!dialog)
                first.css({top: navHeight + 'px','margin':'0 0 -8px 0'});
            else
                first.css({top: navHeight + 'px'});

            if(i == 1)
                first.css({overflow: 'hidden'});
        });

        $('.visitor-info-'+elementId+'-placeholder-content').css({'border-top':'10px solid var(--main-floor-color)'});
        $('#visitor-cobrowse-'+elementId).css({'box-sizing':'border-box','height': (contentHeight+5) + 'px'});
        $('#visitor-cobrowse-'+elementId+'-browser-select').parent().css({width: (visBodyWidth - 190) +'px'});

        if ((!IFManager.IsAppFrame && !IFManager.IsMobileOS) || IFManager.IsDesktopApp())
            $('#visitor-cobrowse-'+elementId+'-iframe').css({height: (contentHeight - 45)+'px'});
        else
            $('#visitor-cobrowse-'+elementId+'-iframe-container').css({'-webkit-overflow-scrolling':'touch','overflow-y':'scroll',height: (contentHeight - 80)+'px'});

        $('#matching-tickets-'+elementId+'-inner').css({overflow:'auto'});
        $('#ticket-content-'+elementId+'-inner').css({'display':'none'});

        if(!visMon)
        {
            $('#visitor-info-'+elementId+'-placeholder-tab-1').css({display: 'none'});
            $('#visitor-info-'+elementId+'-placeholder-tab-2').css({display: 'none'});
        }
    });
};

UIRendererClass.prototype.resizeVisitorInvitation = function() {
    if ($('#chat-invitation-body').length > 0)
    {
        var invTextHeight = Math.max((lzm_chatDisplay.dialogWindowHeight - 280), 100);
        $('#invitation-text-div').css({height:  invTextHeight+'px'});

        $('#invitation-text-inner').css({height:  (invTextHeight - 42)+'px'});
        $('#invitation-text').css({height: (invTextHeight - 50)+'px'});

        if((!IFManager.IsAppFrame && !IFManager.IsMobileOS) || IFManager.IsDesktopApp())
            $('#invitation-text-body').css({height: (invTextHeight - 96)+'px'});
    }
};

UIRendererClass.prototype.resizeMessageForwardDialog = function() {
    if ($('#message-forward-placeholder').length > 0)
    {
        var winObj = TaskBarManager.GetActiveWindow();
        if(winObj != null)
        {
            var filesHeight = (!isNaN(parseInt($('#forward-files').height()))) ? $('#forward-files').height() + 53 : 0;
            $('#forward-text').css({height: Math.max(100, $('#'+winObj.DialogId+'-body').height() - 350 - filesHeight) + 'px'});
        }
    }
};

UIRendererClass.prototype.resizeArchivedChat = function(elementId) {

    if ($('#matching-chats-body').length > 0) {
        var contentHeight = $('#matching-chats-body').height()-30;
        var upperFieldsetHeight = Math.floor(contentHeight / 3);
        var lowerFieldsetHeight = contentHeight - upperFieldsetHeight - 49;
        $('#matching-chats-'+elementId+'-inner').css({overflow:'auto','height': upperFieldsetHeight + 'px'});
        $('#chat-content-'+elementId+'-inner').css({overflow:'auto',height: (lowerFieldsetHeight+3) + 'px'});
    }
};

UIRendererClass.prototype.resizeFilterCreation = function() {

};

UIRendererClass.prototype.resizeFilterList = function() {
    if ($('#filter-list').length > 0) {
        $('#filter-list-body').css({'overflow-x': 'auto'});
    }
};

UIRendererClass.prototype.resizeLinkGenerator = function() {
    if ($('#link-generator-dialog').length > 0 || $('#link_generator_edit_element-container').length > 0)
    {
        $('#link-generator-dialog-body').css({'overflow-x': 'hidden'});
        var myHeight = $('#link-generator-dialog-body').height()-90;
        $('#elements-list-div, #code-list-div').css({'min-height': myHeight + 'px'});
        $('#inline-preview').css({'height': (myHeight+13) + 'px'});

        $('.lzm-tab-scroll-content').css({top:($('#lg-element-settings-placeholder-tabs-row').height() + 10)+'px'});
    }
};

UIRendererClass.prototype.resizeDynamicGroupDialogs = function() {

};

UIRendererClass.prototype.resizeTranslateOptions = function() {

};

UIRendererClass.prototype.resizeChatView = function() {

    var pheight= 0,activeWindow = TaskBarManager.GetActiveWindow();

    if (!(activeWindow != null && activeWindow.TypeId == 'chat-window'))
    {
        $('#chat-progress').css('display', 'none');
        $('#chat-qrd-preview').css('display', 'none');
        $('#chat-action').css('display', 'none');
        $('#chat-buttons').css('display', 'none');

        if(IFManager.IsMobileOS && !IFManager.IsTabletOS)
        {
            $('#chat').css('top', '36px');
        }
    }
    else
    {
        $('#chat-progress').css('display','block');
        $('#chat-action').css('display', 'block');
        $('#chat-buttons').css('display', 'block');

        if(IFManager.IsMobileOS && !IFManager.IsTabletOS)
        {
            $('#chat').css('top', '27px');
            $('#chat-controls').css('top', '20px');
        }

        if($('#chat-qrd-preview').css('display') != 'none')
            pheight = $('#chat-qrd-preview').height()+28;

        $('#chat-progress').css({'bottom': (136 + pheight + ChatEditorClass.ExpandChatInputOffset) + 'px'});
    }

    //$('#chat-progress').css({'bottom': (136 + ChatEditorClass.ExpandChatInputOffset) + 'px'});


};

UIRendererClass.prototype.resizeMenuPanels = function() {

    var settingsButtonWidth = (this.windowWidth > 500) ? 290 : this.windowWidth-144;
    var rightMargin = $('#main-menu-info-box').css('visibility') != 'hidden' ? $('#main-menu-info-box').outerWidth() : 0;
    $('#main-menu-panel-settings').css({width: (settingsButtonWidth)+'px'});
    $('#main-menu-panel-settings-text').css({width: (settingsButtonWidth - 90)+'px'});
    $('#main-menu-panel-tools-logs').css({'margin-right': (rightMargin)+'px'});
    $('.main-menu-panel-opt-tools').css({float:'right',display: (this.windowWidth>550) ? 'inline-block' : 'none'});

    $('#main-menu-info-box').css('display',(this.windowWidth > 1000) ?  'block' : 'none');
    $('.main-menu-panel-opt-tools').css('display',(this.windowWidth > 1000) ?  'block' : 'none');

    $('.log-list-placeholder-content').css({height: ($('#log-viewer-body').height() - 100) + 'px'});
};

UIRendererClass.prototype.resizeStartPage = function() {
    if (lzm_chatDisplay.selected_view == 'home')
    {
        var startPageIframeCss = {border: '0px', width: '100%', height: '99%','background-color': '#fff'};
        var numberOfStartPages = (lzm_chatDisplay.startPages.show_lz == 1) ? 1 : 0;
        for (var i=0; i<lzm_chatDisplay.startPages.others.length; i++) {
            numberOfStartPages++;
        }
        if (numberOfStartPages == 1)
        {
            this.resizeSingleStartPage();
        }
        else if (numberOfStartPages > 1)
        {
            $('.startpage-iframe').css(startPageIframeCss);
            $('.startpage-placeholder-content').css({'position': 'relative', 'min-height': (this.viewContainerHeight)+'px'})
            $('#startpage-placeholder-tabs-row').css({'margin-top': '4px','border':0})
        }

        if($('#onboarding').html().length && this.windowWidth > 700)
        {
            $('#startpage').css({'right': '300px'});
            $('#onboarding').css({'display': 'block'});
        }
        else
        {
            $('#startpage').css({'right': '0'});
            $('#onboarding').css({'display': 'none'});
        }
    }
};

UIRendererClass.prototype.resizeSingleStartPage = function() {
    if ($('#single-startpage-iframe').length > 0) {
        $('#single-startpage-iframe').css({width: '100%', height: '99%'});
    }
};

UIRendererClass.prototype.resizeMychats = function() {

    CommonUIClass.ChatVisitorInfoWidth = Math.floor(Math.max(150,lzm_chatDisplay.windowWidth/2));

    if(TaskBarManager.IsActiveChatWindow())
    {
        var cib = $('#chat-info-body');

        var mychatsInputControlsCss = {position: 'absolute', width: '0px', height: '0px', border: '0px', left: '0px', top: '0px', display: 'none'};
        var mychatsInputBodyCss = {position: 'absolute', right: 0, bottom:0,border: '0px', 'border-bottom-left-radius': '4px', 'border-bottom-right-radius': '4px', left: '0px', top: '0px','overflow-y': 'hidden'};
        var mychatsInputCss = {position: 'absolute', right:0, bottom:0, border: '0px', 'border-bottom-left-radius': '4px', 'border-bottom-right-radius': '4px', left: '0px', top: '0px','text-align': 'left', 'font-size': '12px', 'overflow': 'hidden'};
        var maxAutoKBHeight = Math.floor(lzm_chatDisplay.windowHeight/3)-25;

        $('#chat-buttons').css({bottom:(ChatEditorClass.ExpandChatInputOffset + 91) + 'px'});
        $('#chat-qrd-preview').css({'max-height':maxAutoKBHeight+'px',bottom:(ChatEditorClass.ExpandChatInputOffset + 148) + 'px'});
        $('#chat-action').css({height:(ChatEditorClass.ExpandChatInputOffset + 94) + 'px'});
        $('#chat-members-minimize').css({bottom:(ChatEditorClass.ExpandChatInputOffset + 100) + 'px'});
        $('#chat-input-controls').css(mychatsInputControlsCss);
        $('#chat-input-body').css(mychatsInputBodyCss);
        $('#chat-input').css(mychatsInputCss);
        $('#chat-title').css({display: 'none'});

        var availableScreenWidth = lzm_chatDisplay.windowWidth - $('#chat-members').width();

        if(cib.data('hidden') == '1' || availableScreenWidth < CommonUIClass.MinWidthChatVisitorInfo)
        {
            cib.css({display:'none'});
            $('#chat-controls').css({right:'10px'});
        }
        else
        {
            cib.css({display:'block'});
            $('#chat-controls').css({right:(CommonUIClass.ChatVisitorInfoWidth-19)+'px'});
            $('#chat-info-body').css({width:(CommonUIClass.ChatVisitorInfoWidth-19)+'px'});
        }
    }
    else
        $('#chat-info-body').css({display:'none'});
};

UIRendererClass.prototype.resizeTicketList = function() {
    if (lzm_chatDisplay.selected_view == 'tickets')
    {
        var showPreview = (lzm_chatDisplay.windowWidth > ChatTicketClass.PreviewSwitchWidth);
        var showTree = (lzm_chatDisplay.windowWidth > ChatTicketClass.TreeSwitchWidth) && lzm_commonStorage.loadValue('show_ticket_tree_' + DataEngine.myId) != 0;
        var previewWidth = Math.floor(lzm_chatDisplay.windowWidth * 0.25);

        if(showPreview)
        {
            $('#ticket-list-actions').css({display: 'block',width: previewWidth+21+'px'});
            $('#ticket-list-right').css({display: 'block',width:previewWidth+'px'});
            $('#ticket-list-left, #ticket-list-footline').css({right: previewWidth+31+'px'});
        }
        else
        {
            $('#ticket-list-actions').css({display: 'none'});
            $('#ticket-list-right').css({display: 'none'});
            $('#ticket-list-left, #ticket-list-footline').css({right: '0'});
        }

        if(showTree || lzm_chatDisplay.ticketDisplay.CategorySelect)
        {
            $('#ticket-list-left, #ticket-list-footline').css({left: '260px'});
            $('#ticket-list-tree').css({display: 'block'});
        }
        else
        {
            $('#ticket-list-left, #ticket-list-footline').css({left: '0'});
            $('#ticket-list-tree').css({display: 'none'});
        }

        if(lzm_chatDisplay.ticketDisplay.CategorySelect)
        {
            $('#ticket-list-tree').css({width: 'auto', right:0, 'border-width' :0});
            $('#ticket-list-left, #ticket-list-footline').css({display: 'none'});
            $('#ticket-list-search-settings').css({width: 'auto', right:0, 'border-right' :0});
            $('#search-ticket').css({width:lzm_chatDisplay.windowWidth-75 + 'px'});
        }
        else if(lzm_chatDisplay.windowWidth > ChatTicketClass.TreeSwitchWidth)
        {
            $('#ticket-list-tree').css({width: '250px', right:'', 'border-width' :'1px'});
            $('#ticket-list-left, #ticket-list-footline').css({display: 'block'});
        }
        else if(!lzm_chatDisplay.ticketDisplay.CategorySelect)
        {
            $('#ticket-list-left, #ticket-list-footline').css({display: 'block'});
        }
    }
};

UIRendererClass.prototype.resizeTicketLinker = function() {
};

UIRendererClass.prototype.resizeArchive = function() {
    if (lzm_chatDisplay.selected_view == 'archive')
    {
        var showPreview = (lzm_chatDisplay.windowWidth > ChatArchiveClass.PreviewSwitchWidth);
        if(showPreview)
        {
            $('#archive-list-right').css({display: 'block'});
            $('#archive-list-left').css({left:0,right: '450px', 'border-width': '1px'});
        }
        else
        {
            $('#archive-list-right').css({display: 'none'});
            $('#archive-list-left').css({left:0,right: '0px', 'border-width': '0px'});
        }
    }
};

UIRendererClass.prototype.resizeOperatorList = function() {
};

UIRendererClass.prototype.ResizeVisitorList = function() {
    if (lzm_chatDisplay.selected_view == 'external')
    {
        $('.visitor-simple-cell div').css({width:lzm_chatDisplay.windowWidth-160+'px'});

        var treeviewWidth = LocalConfiguration.VisitorsTreeviewVisible ? lzm_chatDisplay.VisitorsUI.TreeviewWidth + 10 : 0;
        var bWidth = 0, avWidth = (UIRenderer.windowWidth - ((CommonUIClass.MobileNavigation) ? 0 : 70)) - 18;

        if(LocalConfiguration.VisitorsMapVisible)
        {
            var mapPos =  LocalConfiguration.VisitorsTreeviewVisible ? ((avWidth - lzm_chatDisplay.VisitorsUI.TreeviewWidth) / 2) + lzm_chatDisplay.VisitorsUI.TreeviewWidth : (avWidth / 2)-10;
            if(!lzm_chatDisplay.VisitorsUI.HasWindowWidthForSideBySideView())
                mapPos = LocalConfiguration.VisitorsTreeviewVisible ? lzm_chatDisplay.VisitorsUI.TreeviewWidth : 0;

            $('#geotracking').css({left: mapPos + 'px'});

            bWidth = (LocalConfiguration.VisitorsTreeviewVisible ? ((avWidth - lzm_chatDisplay.VisitorsUI.TreeviewWidth) / 2) : (avWidth / 2)) - 20;
        }
        else
            bWidth = LocalConfiguration.VisitorsTreeviewVisible ? (avWidth - lzm_chatDisplay.VisitorsUI.TreeviewWidth) : avWidth;

        var rightSpace = (LocalConfiguration.VisitorsTreeviewVisible || LocalConfiguration.VisitorsMapVisible) ? 10 : 0;

        $('#visitor-list-table-div').css({left: treeviewWidth + 'px',width: (bWidth - rightSpace) + 'px'});

        if(!lzm_chatDisplay.VisitorsUI.UIInitialized)
        {
            if(LocalConfiguration.VisitorsMapVisible)
                $('#geotracking').css({display:'block'});
            else
                $('#geotracking').css({display:'none'});

            if(LocalConfiguration.VisitorsTreeviewVisible)
                $('#visitor-treeview').css({display:'block'});
            else
                $('#visitor-treeview').css({display:'none'});

            $('#visitor-list-table-div').css({display:'block'});
            lzm_chatDisplay.VisitorsUI.UIInitialized = true;
        }
        var fullscreen = lzm_chatDisplay.VisitorsUI.isFullScreenMode();

        if(fullscreen != lzm_chatDisplay.VisitorsUI.lastFullscreen)
            lzm_chatDisplay.VisitorsUI.UpdateVisitorMonitorUI(true,true);

        lzm_chatDisplay.VisitorsUI.lastFullscreen = fullscreen;
    }
};

UIRendererClass.prototype.resizeFilter = function() {
    if (lzm_chatDisplay.selected_view == 'filter') {
        var filterCss = lzm_commonTools.clone(this.viewContainerCss);
        var headlineCss = this.createHeadlineFromContainer(filterCss);
        var secondHeadlineCss = this.createSecondHeadlineFromContainer(filterCss);
        var bodyCss = this.createBodyFromContainer(filterCss, true, false);
        $('#filter').css(filterCss);
        $('#filter-headline').css(headlineCss);
        $('#filter-headline2').css(secondHeadlineCss);
        $('#filter-body').css(bodyCss);
    }
};

UIRendererClass.prototype.resizeAllChats = function() {
    if (lzm_chatDisplay.selected_view == 'mychats') {
        var allChatsCss = lzm_commonTools.clone(this.viewContainerCss);
        var secondHeadlineCss = this.createSecondHeadlineFromContainer(allChatsCss);
        var bodyCss = this.createBodyFromContainer(allChatsCss, true, false);

        bodyCss.top = '0';
        bodyCss.height = (parseInt(bodyCss.height) - 30)+'px';
        bodyCss.overflow = 'auto';
        secondHeadlineCss.top = (parseInt(bodyCss.height)  + 10)+'px';

        var showTree = (lzm_chatDisplay.windowWidth > 700);
        var showObserver = (lzm_chatDisplay.windowWidth > 1000);

        if(showTree && showObserver && lzm_chatDisplay.ChatsUI.ObserverModePossible)
        {
            $('#all-chats-body').css({display: 'block',left: '260px',right: lzm_chatDisplay.ChatsUI.ObserverMode ? '410px' : '0'});
            $('#all-chats-preview').css({display: lzm_chatDisplay.ChatsUI.ObserverMode ? 'block' : 'none'});
            $('#all-chats-tree').css({display: 'block',width:'250px',right:''});
            $('#allchats-observer-mode').css({display: 'inline'});
            $('#allchats-tree-switch').css({display: 'none'});
        }
        else if(showTree)
        {
            $('#all-chats-body').css({display: 'block',left: '200px',right:'10px'});
            $('#all-chats-preview').css({display: 'none'});
            $('#all-chats-tree').css({display: 'block',width:'189px',right:''});
            $('#allchats-observer-mode').css({display: 'none'});
            $('#allchats-tree-switch').css({display: 'none'});
        }
        else if(lzm_chatDisplay.ChatsUI.CategorySelect)
        {
            $('#all-chats-preview').css({display: 'none'});
            $('#all-chats-tree').css({display: 'block',right:'-1px',width:'auto'});
            $('#all-chats-body').css({display: 'none',left: '200px',right:'0px'});
            $('#allchats-observer-mode').css({display: 'none'});
            $('#allchats-tree-switch').css({display: 'inline'});
        }
        else
        {
            $('#all-chats-preview').css({display: 'none'});
            $('#all-chats-tree').css({display: 'none',right:''});
            $('#all-chats-body').css({display: 'block',left: '0'});
            $('#allchats-observer-mode').css({display: 'none'});
            $('#allchats-tree-switch').css({display: 'inline'});

        }
    }
};

UIRendererClass.prototype.resizeReportList = function() {

    var winobj = TaskBarManager.GetActiveWindow();
    if(winobj != null && winobj.DialogId.startsWith('report_'))
    {
        var myHeight = $('#'+winobj.DialogId+'-body').height();
        $('.report-iframe').css({height: myHeight + 'px'});
        $('#'+winobj.DialogId+'-body').css({overflow: 'hidden'});

    }
    else if (lzm_chatDisplay.selected_view == 'reports')
    {
        if(lzm_chatDisplay.windowWidth < 700)
        {
            $('#report-list-table').css({display: 'none'});
            $('#report-list-footline').css({display: 'none'});
            $('#report-list-headline2').css({display: 'none'});
            $('#report-rtdb-frame').css({display: 'block',width: 'auto'});
        }
        else
        {
            var dbw = 0;
            if(lzm_chatDisplay.windowWidth < 1000)
                dbw = 180;
            else if(lzm_chatDisplay.windowWidth < 1100)
                dbw = 355;
            else if(lzm_chatDisplay.windowWidth < 1300)
                dbw = 525;
            else
                dbw = 695;

            var tbw = Math.min(800,lzm_chatDisplay.windowWidth - dbw - 120);

            $('#report-list-table').css({display: 'block',left:'auto',right:0,width: tbw +'px'});
            $('#report-list-footline').css({display: 'block',left:'auto',right:0,width: tbw +'px'});
            $('#report-list-headline2').css({display: 'block',left:'auto',right:0,width: tbw +'px'});
            $('#report-rtdb-frame').css({display: 'block',width: dbw +'px'});
        }
    }
};

UIRendererClass.prototype.resizeTranslationEditor = function() {
    if ($('#translation_editor').length > 0)
    {
        var pfxArray = ['', 'srv-'];

        for (var i=0; i<pfxArray.length; i++)
        {
            var pfx = pfxArray[i];

            $('#' + pfx + 'translation-languages-top').css({'box-sizing':'border-box',background:'#fff',position: 'absolute', bottom:'126px',top:0,left:0,width:'200px','overflow-y': 'auto',border: 'var(--main-border)'});
            $('#' + pfx + 'translation-languages-bottom').css({position: 'absolute',bottom:'10px',left:0,width:'200px'});

            $('#' + pfx + 'translation-values-bottom').css({position: 'absolute', bottom:'12px', left:'210px',right:0});
            $('#' + pfx + 'translation-values-top').css({position: 'absolute', top: 0, bottom:'63px', left:'210px',right:0,'overflow-y': 'auto', border: 'var(--main-border)'});
            $('#' + pfx + 'translation-search-string').css({width: '100%'});
        }
    }
};

UIRendererClass.prototype.resizeSendTranscriptDialog = function() {
    if ($('#send-transcript-to').length > 0) {
        var bodyHeight = $('#send-transcript-to-body').height();
        $('.send-transcript-placeholder-content').css({height: (bodyHeight - 40)+'px'});
        $('#send-transcript-to-inner').css({'min-height': (bodyHeight - 40 - 22)+'px'});
    }
};

UIRendererClass.prototype.resizeUserManagement = function() {
    if ($('#user-management-dialog').length > 0) {
        var myWidth = $('#user-management-dialog-body').outerWidth();
        var myHeight = $('#user-management-dialog-body').height();
        $('#user-management-iframe').css({width: (myWidth)+'px', height: (myHeight)+'px'});
    }
};

/************************************************** tools **************************************************/

UIRendererClass.prototype.createHeadlineFromContainer = function(containerCss) {
    var headlineCss = {position: 'absolute', top: '0px', left: '0px', width: containerCss.width, height: '22px',
        'border-bottom': '1px solid #cccccc', 'border-radius': '0px', 'background-image': 'none',
        'background-color': '#f5f5f5', color: '#333333', 'text-shadow': 'none', 'font-weight': 'bold', 'font-size': '10px',
        'line-height': '0px', 'text-align': 'left', 'padding-left': '10px'};

    return headlineCss;
};

UIRendererClass.prototype.createSecondHeadlineFromContainer = function(containerCss) {
    var headlineCss = {position: 'absolute', top: '23px', left: '0px', width: (parseInt(containerCss.width) + 10)+'px',
        height: '28px', 'background-color': '#ededed', color: '#333333', 'text-shadow': 'none', margin: '0px'};

    return headlineCss;
};

UIRendererClass.prototype.createBodyFromContainer = function (containerCss, withSecondHeadline, withFootline) {
    var bodyHeight = (withSecondHeadline && withFootline) ? this.viewContainerHeight - 66 :
        (withSecondHeadline) ? this.viewContainerHeight - 48 :
            (withFootline) ? this.viewContainerHeight - 41 : this.viewContainerHeight - 23;
    var bodyTop = (withSecondHeadline) ? 51 : 23;
    var bodyCss = {position: 'absolute', 'text-align': 'left', width: containerCss.width, height: bodyHeight+'px',
        top: bodyTop+'px', left: '0px', overflow: 'hidden', padding: '5px', 'text-overflow': 'ellipsis'};

    return bodyCss;
};

UIRendererClass.prototype.getForm = function(formType,obj,name) {
    var contentHtml = '';
    var that = this;
    var showIconLine = false;
    var lzch = DataEngine.getConfigValue('gl_lzch',false) == 1;

    obj.m_Settings.forEach(function(entry_name) {
        if(entry_name.name==formType){

            var iconcss = (typeof entry_name.iconcss != 'undefined') ? ' style="'+entry_name.iconcss+'";' : '';

            if(showIconLine)
                contentHtml += '<i class="fa fa-'+((typeof entry_name.icon != 'undefined') ? entry_name.icon : 'cogs')+' lzm-tab-scroll-content-icon"'+iconcss+'></i>';

            entry_name.groups.forEach(function(entry_group)
            {
                if(!(lzch && $.inArray('lzch',entry_group.not) !== -1))
                    if($.inArray(obj.m_Type,entry_group.not) === -1 && $.inArray('all',entry_group.not) === -1)
                    {
                        var addClass = (typeof entry_group.class != 'undefined') ? ' '+entry_group.class : '';

                        contentHtml += '<fieldset class="lzm-fieldset-full'+addClass+'" id="'+name+'-configuration-'+entry_group.name+'"><legend>' + entry_group.title + '</legend><form>';

                        if(entry_group.custom === true || entry_group.custom == 'top')
                            contentHtml += obj.GetCustomForm(entry_group.name);

                        entry_group.controls.forEach(function(entry_control)
                        {
                            if(!(lzch && $.inArray('lzch',entry_control.not) !== -1))
                                if($.inArray(obj.m_Type,entry_control.not) === -1 && $.inArray('all',entry_control.not) === -1)
                                    contentHtml += that.getControlHTML(entry_control);

                        });

                        if(entry_group.custom == 'bottom')
                            contentHtml += obj.GetCustomForm(entry_group.name);

                        contentHtml += '</form></fieldset>';
                    }
            });
        }
    });
    contentHtml = '<div class="lzm-tab-scroll-content'+((showIconLine) ? ' lzm-tab-scroll-content-line' : '')+'">'+ contentHtml + '</div>';
    return contentHtml;
};

UIRendererClass.prototype.GetControlValue = function(controlDefinition) {
    try
    {
        if(controlDefinition.type == 'bool' || controlDefinition.type == 'radio')
            return $('#'+UIRenderer.getControlID(controlDefinition)).prop('checked');
        else if(controlDefinition.type == 'hidden' || controlDefinition.type == 'array' || controlDefinition.type == 'password' || controlDefinition.type == 'string' || controlDefinition.type == 'int' || controlDefinition.type == 'color' || controlDefinition.type == 'area')
            return $('#'+UIRenderer.getControlID(controlDefinition)).val();
        else if(controlDefinition.type == 'position')
            return ($(".lzm-position-selected",'#'+UIRenderer.getControlID(controlDefinition)).prop('id').replace(UIRenderer.getControlID(controlDefinition), ''));
        else if(controlDefinition.type == 'tageditor')
            return window[controlDefinition.name].GetListString();


    }
    catch(ex)
    {

    }
    return null;
};

UIRendererClass.prototype.getSettingsProperty = function(settings,propertyName) {
    var prop = null;
    settings.forEach(function(entry_name) {
        entry_name.groups.forEach(function(entry_group) {
            entry_group.controls.forEach(function(entry_control) {
                if(entry_control.name == propertyName)
                    prop = entry_control;
            });
        });
    });
    return prop;
};

UIRendererClass.prototype.getControlID = function(controlDefintion) {
    if(controlDefintion.type == 'bool')
        return 'cb-'+controlDefintion.name;
    else if(controlDefintion.type == 'array')
        return 'sl-'+controlDefintion.name;
    else if(controlDefintion.type == 'color')
        return 'ci-'+controlDefintion.name;
    else if(controlDefintion.type == 'position')
        return 'po-'+controlDefintion.name;
    else if(controlDefintion.type == 'int')
        return 'int-'+controlDefintion.name;
    else if(controlDefintion.type == 'string')
        return 's-'+controlDefintion.name;
    else if(controlDefintion.type == 'radio')
        return 'r-'+controlDefintion.name;
    else if(controlDefintion.type == 'area' || controlDefintion.type == 'tageditor')
        return 'a-'+controlDefintion.name;
    else
        return controlDefintion.name;
};

UIRendererClass.prototype.getControlHTML = function(controlDefinition) {


    var contentHtml = '';
    var addClass = (typeof controlDefinition.class != 'undefined') ? controlDefinition.class : '';
    if(controlDefinition.type == 'bool')
        contentHtml = lzm_inputControls.createCheckbox(this.getControlID(controlDefinition), controlDefinition.title, controlDefinition.value, addClass, '');
    else if(controlDefinition.type == 'array')
        contentHtml = lzm_inputControls.createSelect(this.getControlID(controlDefinition), addClass, '', '', {position: 'right', gap: '0px'}, {}, '', controlDefinition.options, controlDefinition.value, '',null,null, (typeof controlDefinition.titleleft != 'undefined') ? controlDefinition.titleleft : '');
    else if(controlDefinition.type == 'color')
        contentHtml = lzm_inputControls.createColor(this.getControlID(controlDefinition), addClass, controlDefinition.value, controlDefinition.title, '');
    else if(controlDefinition.type == 'position')
        contentHtml += lzm_inputControls.createPosition(this.getControlID(controlDefinition), controlDefinition.value);
    else if(controlDefinition.type == 'int')
        contentHtml = lzm_inputControls.createInput(this.getControlID(controlDefinition), addClass, controlDefinition.value, controlDefinition.title, '', 'number', '', '', (typeof controlDefinition.titleright != 'undefined') ? controlDefinition.titleright : '', (typeof controlDefinition.titleleft != 'undefined') ? controlDefinition.titleleft : '');
    else if(controlDefinition.type == 'string' || controlDefinition.type == 'password')
    {
        var type = (controlDefinition.type == 'password') ? 'password' : 'text';
        var myData = (typeof controlDefinition.dataattr != 'undefined') ? ' data-attr-name="'+controlDefinition.dataattr+'"' : '';
        contentHtml = lzm_inputControls.createInput(this.getControlID(controlDefinition), addClass, controlDefinition.value, controlDefinition.title, '', type, '', myData, '', (typeof controlDefinition.titleleft != 'undefined') ? controlDefinition.titleleft : '');

        if(d(controlDefinition.titlebottom))
            contentHtml += '<div class="top-space-half lzm-info-text text-s">'+controlDefinition.titlebottom+'</div>';
    }
    else if(controlDefinition.type == 'radio')
        contentHtml = lzm_inputControls.createRadio(this.getControlID(controlDefinition), addClass, controlDefinition.group, controlDefinition.title, controlDefinition.value);
    else if(controlDefinition.type == 'div')
        contentHtml = '<div id="'+this.getControlID(controlDefinition)+'"></div>';
    else if(controlDefinition.type == 'label')
        contentHtml = '<label class="'+addClass+'">'+controlDefinition.title+'</label>';
    else if(controlDefinition.type == 'hidden')
        contentHtml = '<input id="'+this.getControlID(controlDefinition)+'" value="'+controlDefinition.value+'" type="hidden" />';
    else if(controlDefinition.type == 'link')
        contentHtml = '<a class="'+addClass+'" style="font-size:12px;" onclick="openLink(\''+controlDefinition.value+'\');" target="_blank">'+controlDefinition.title+'</a>';
    else if(controlDefinition.type == 'area')
        contentHtml = '<div class="top-space"><label>'+controlDefinition.title+'</label></div><div>' + lzm_inputControls.createArea(this.getControlID(controlDefinition), controlDefinition.value, addClass) + "</div>";
    else if(controlDefinition.type == 'tageditor')
    {

        window[controlDefinition.name] = new CommonInputControlsClass.TagEditor(controlDefinition.name,controlDefinition.value,true,false,true,true);
        contentHtml = window[controlDefinition.name].GetHTML();

    }
    var classes = "";
    if(typeof controlDefinition.top != 'undefined' && controlDefinition.top == 'single')
        classes += " top-space";
    if(typeof controlDefinition.top != 'undefined' && controlDefinition.top == 'half')
        classes += " top-space-half";
    if(typeof controlDefinition.top != 'undefined' && controlDefinition.top == 'double')
        classes += " top-space-double";
    if(typeof controlDefinition.bottom != 'undefined' && controlDefinition.bottom == 'single')
        classes += " bottom-space";

    if(typeof controlDefinition.left != 'undefined' && controlDefinition.left == 'single')
        contentHtml = '<div class="left-space-child'+classes+'">' + contentHtml + '</div>';
    else if(typeof controlDefinition.left != 'undefined' && controlDefinition.left == 'double')
        contentHtml = '<div class="left-space-child'+classes+'"><div class="left-space-child">' + contentHtml + '</div></div>';
    else if(typeof controlDefinition.left != 'undefined' && controlDefinition.left == 'triple')
        contentHtml = '<div class="left-space-child'+classes+'"><div class="left-space-child"><div class="left-space-child">' + contentHtml + '</div></div></div>';
    else if(classes.length)
        contentHtml = '<div class="'+ $.trim(classes) + '">' + contentHtml + '</div>';

    return contentHtml;
};
