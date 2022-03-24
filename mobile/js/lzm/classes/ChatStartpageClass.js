/****************************************************************************************
 * LiveZilla ChatStartpageClass.js
 *
 * Copyright 2014 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/
function ChatStartpageClass() {
}

ChatStartpageClass.OnboardingElements = [];
ChatStartpageClass.OnboardingComplete = '111111';

ChatStartpageClass.prototype.createStartPage = function(lz, ca, cr) {
    var singleStartpageIframe;
    var numberOfStartPages = (lzm_chatDisplay.startPages.show_lz == '1') ? 1 : 0;
    numberOfStartPages += lzm_chatDisplay.startPages.others.length;
    if (!lzm_chatDisplay.startPageTabControlDoesExist) {
        if (numberOfStartPages == 1) {
            singleStartpageIframe = this.createSingleStartPage(lz, ca, cr);
            if (singleStartpageIframe != '')
                $('#startpage-body').html(singleStartpageIframe);
            lzm_chatDisplay.startPageTabControlDoesExist = false;
        } else
        {
            $('#startpage-body').html('<div id="startpage-placeholder"></div>');

            lzm_inputControls.createTabControl('startpage-placeholder', this.createStartPagesArray(lz, ca, cr), -1, lzm_chatDisplay.windowWidth - 22);
            lzm_chatDisplay.startPageTabControlDoesExist = true;
        }
    } else {
        if (numberOfStartPages == 1) {
            singleStartpageIframe = this.createSingleStartPage(lz, ca, cr);
            if (singleStartpageIframe != '')
                $('#startpage-body').html(singleStartpageIframe);
            lzm_chatDisplay.startPageTabControlDoesExist = false;
        } else {
            lzm_displayHelper.updateTabControl('startpage-placeholder', this.createStartPagesArray(lz, ca, cr));
            lzm_chatDisplay.startPageTabControlDoesExist = true;
        }
    }

    ChatStartpageClass.ShowOnboarding();

    UIRenderer.resizeStartPage();
    $('#startpage-placeholder-tab').click(function() {
        UIRenderer.resizeStartPage();
    });
};

ChatStartpageClass.prototype.createSingleStartPage = function(lz, ca, cr) {
    var startPageHtml = '';
    if (lz || ca.length > 0 || cr.length)
    {
        if (lzm_chatDisplay.startPages.show_lz == '1')
        {
            var pcx0 = 0, pcx1 = -1;
            if (DataEngine.crc3 != null) 
			{
                try
                {
                    pcx0 = DataEngine.getTDays();

                    if(pcx0==null)
                        pcx0 = 0;

                    pcx1 = DataEngine.crc3[5];
                }
                catch(e)
                {}
            }

            var pcx = pcx0 + '_' + pcx1;

            if(DataEngine.getConfigValue('gl_lzch',false) == 1)
                pcx += '&lzch=1';

            var startPageUrl = 'https://start.livezilla.net/startpage/en/?&product_version=' + lzm_commonConfig.lz_version + '&web=1&app=' + (IFManager.IsAppFrame?'1':'0') + '&mobile=' + (IFManager.IsMobileOS?'1':'0') + '&pcx=' + pcx;
            startPageHtml = '<div id="single-startpage-outer-div"><iframe id="single-startpage-iframe" src="' + startPageUrl + '" style="border:0px;"></iframe>';
        }
        else
        {
            var customPageUrl = lzm_chatDisplay.startPages.others[0].url;
            if (lzm_chatDisplay.startPages.others[0].get_param != 0)
            {
                customPageUrl += (customPageUrl.indexOf('?') != -1) ? '&' : '?';
                customPageUrl += 'operator=' + DataEngine.myUserId;
            }
            startPageHtml = '<div id="single-startpage-outer-div"><iframe id="single-startpage-iframe" src="' + customPageUrl + '" style="border:0px;"></iframe></div>';
        }
    }
    return startPageHtml
};

ChatStartpageClass.prototype.createStartPagesArray = function(lz, ca, cr) {
    var startPagesArray = [], i = 0, customPageUrl;
    var pcx0 = 14, pcx1 = -1;
    if (DataEngine.crc3 != null) {
        try {
            pcx0 = Math.max(0, 5184000 - Math.ceil(lzm_chatTimeStamp.getServerTimeString(null, true) - parseInt(DataEngine.crc3[0])));
            pcx1 = DataEngine.crc3[5];
        } catch(e) {}
    }
    var pcx = pcx0 + '_' + pcx1;
    var startPageUrl = 'http://192.168.10.10/livezilla/analytics.php';
    if (!lzm_chatDisplay.startPageTabControlDoesExist) {
        if (lzm_chatDisplay.startPages.show_lz == 1) {
            startPagesArray.push({name: t('Startpage'), content: '<div id="startpage-lz-outer-div" class="startpage-iframe-outer-div">' +
                '<iframe id="startpage-lz" class="startpage-iframe"' +
                ' src="' + startPageUrl + '"></iframe></div>', hash: 'lz'});
        }
        for (i=0; i<lzm_chatDisplay.startPages.others.length; i++) {
            customPageUrl = lzm_chatDisplay.startPages.others[i].url;
            if (lzm_chatDisplay.startPages.others[i].get_param != 0) {
                customPageUrl += (customPageUrl.indexOf('?') != -1) ? '&' : '?';
                customPageUrl += 'operator=' + DataEngine.myUserId;
            }
            startPagesArray.push({name: lzm_chatDisplay.startPages.others[i].title, content: '<div id="startpage-' +
                lzm_chatDisplay.startPages.others[i].hash +'-outer-div" class="startpage-iframe-outer-div">' +
                '<iframe id="startpage-' + lzm_chatDisplay.startPages.others[i].hash + '" class="startpage-iframe"' +
                ' src="' + customPageUrl + '"></iframe></div>',
                hash: lzm_chatDisplay.startPages.others[i].hash});
        }
    } else {
        if (lz && lzm_chatDisplay.startPages.show_lz == 1) {
            startPagesArray.push({name: t('Startpage'), content: '<div id="startpage-lz-outer-div" class="startpage-iframe-outer-div">' +
                '<iframe id="startpage-lz" class="startpage-iframe" src="' + startPageUrl + '"></iframe></div>', hash: 'lz', action: lzm_chatDisplay.startPages.show_lz});
        }
        for (i=0; i<ca.length; i++) {
            customPageUrl = ca[i].url;
            if (ca[i].get_param != 0) {
                customPageUrl += (customPageUrl.indexOf('?') != -1) ? '&' : '?';
                customPageUrl += 'operator=' + DataEngine.myUserId;
            }
            startPagesArray.push({name: ca[i].title, content: '<div id="startpage-' + ca[i].hash +'-outer-div" class="startpage-iframe-outer-div">' +
                '<iframe id="startpage-' + ca[i].hash +'" class="startpage-iframe" src="' + customPageUrl + '"></iframe></div>', hash: ca[i].hash, action: 1});
        }
        for (i=0; i<cr.length; i++) {
            startPagesArray.push({name: cr[i].title, content: '', hash: cr[i].hash, action: 0});
        }
    }
    return startPagesArray;
};

ChatStartpageClass.CreateOnboardingHTML = function(){

    if(!ChatStartpageClass.OnboardingElements.length)
    {
        ChatStartpageClass.OnboardingElements.push({
            id:'onboarding-operators',
            title: tid('create_accounts'),
            actiontitle: tid('guide_me'),
            link: 'https://chat.livezilla.net/knowledge-base/configuration/livezilla-add-users-groups/',
            apoints: [
                {id:'view-select-main-button'},
                {id:'usersettings-user-man'}
            ]
        });

        ChatStartpageClass.OnboardingElements.push({
            id:'onboarding-chat-button',
            title: tid('create_chat_button'),
            actiontitle: tid('create'),
            link: 'https://www.livezilla.net/installation-integrate-live-chat-with-website/en/',
            apoints: [
                {id:'view-select-main-button'},
                {id:'usersettings-link-generator'},
                {id:'new-element-to-server-btn'},
                {id:'template-name',value:'My Chat Button'},
                {id:'alert-btn-ok'},
                {id:'add-element-btn'},
                {id:'element-overlay-widget',checked:true},
                {id:'select-element-type-btn'},
                {id:'save-element-btn'},
                {id:'get-code-btn'}
            ]
        });

        ChatStartpageClass.OnboardingElements.push({
            id:'onboarding-chat-invites',
            title: tid('create_chat_invite'),
            actiontitle: tid('create'),
            link: 'https://chat.livezilla.net/knowledge-base/configuration/livezilla-chat-invite-events/',
            apoints: [
                {id:'view-select-main-button'},
                {id:'usersettings-events'},
                {id:'ec-add-btn'},
                {id:'s-event-name',value:'Chat Invite'},
                {id:'add-actions'},
                {id:'select-element-actions',value:'actions-ExternalInvitation'},
                {id:'alert-btn-as-ok'},
                {id:'save-event'},
                {id:'ec-close-btn'},
                {id:'main-menu-panel-status'},
                {id:'user-status-menu-0'},
                {url: Server.GetURL() + 'index.php'}
            ]
        });

        ChatStartpageClass.OnboardingElements.push({
            id:'onboarding-email',
            title: tid('configure_emails'),
            actiontitle: tid('guide_me'),
            link: 'https://chat.livezilla.net/knowledge-base/livezilla-general/en-livezilla-ticket-system/',
            apoints: [
                {id:'view-select-main-button'},
                {id:'usersettings-server-conf'},
                {id:'sc-settings-placeholder-tab-6'},
                {id:'email-acc-outgoing-add'},
                {id:'ea_conf_email',focus:true}
            ]
        });

        ChatStartpageClass.OnboardingElements.push({
            id:'onboarding-kb',
            title: tid('fill_kb'),
            actiontitle: tid('guide_me'),
            link: 'https://chat.livezilla.net/knowledge-base/configuration/en-livezilla-knowledgebase/',
            apoints: [
                {id:'view-select-qrd'},
                {id:'add-qrd'},
                {id:'qrd-tree-context-entry0'},
                {id:'show-kb-entry-title',value:'1st Knowledge Base entry title'},
                {id:'wysiwygshow-kb-entry-text'},
                {id:'kb-entry-placeholder-tab-1'},
                {id:'qrd-knb-pub-entry',checked:true},
                {id:'kb-entry-save'},
                {url: KnowledgebaseUI.GetRootUrl()}
            ]
        });

        ChatStartpageClass.OnboardingElements.push({
            id:'onboarding-language',
            title: tid('add_language_packs'),
            actiontitle: tid('guide_me'),
            link: 'https://chat.livezilla.net/knowledge-base/configuration/en-localization/',
            apoints: [
                {id:'view-select-main-button'},
                {id:'usersettings-trans-editor'},
                {id:'translation-editor-placeholder-tab-1'},
                {id:'srv-translation-language-new'}
            ]
        });
    }

    var html = '';

    html += '<h2 class="text-gray">Welcome to LiveZilla 8.x</h2>'+tidc('next_steps')+'<br>';

    for(var key in ChatStartpageClass.OnboardingElements)
    {
        html += '<div id="onboarding-'+key.toString()+'"><i id="onboarding-icon-'+key.toString()+'" class="fa fa-circle-o icon-gray icon-xxl"></i>';
        html += '<span>'+ChatStartpageClass.OnboardingElements[key].title+'</span>';
        html += '<div class="lzm-clickable lzm-unselectable" onclick="ChatStartpageClass.SetOnboardingDone('+key.toString()+',true);">'+tid('ignore')+'</div>';
        html += '<div class="lzm-clickable2 lzm-unselectable" id="'+ChatStartpageClass.OnboardingElements[key].id+'-btn" onclick="CommonToolsClass.AnimationRun(\''+ChatStartpageClass.OnboardingElements[key].id+'-btn\',ChatStartpageClass.OnboardingElements['+key.toString()+'].apoints,function(){ChatStartpageClass.SetOnboardingDone('+key.toString()+');});">'+ChatStartpageClass.OnboardingElements[key].actiontitle+'</div>';
        html += '<div class="lzm-clickable2 lzm-unselectable" onclick="openLink(\''+ChatStartpageClass.OnboardingElements[key].link+'\')">'+tid('how_to')+'</div>';
        html += '</div>';
    }

    html += '<span class="lzm-clickable text-gray lzm-unselectable" onclick="LocalConfiguration.OnboardingDone=ChatStartpageClass.OnboardingComplete;LocalConfiguration.Save();ChatStartpageClass.ShowOnboarding();">'+tid('dont_show_again')+'</span>';

    return html;

};

ChatStartpageClass.ShowOnboarding = function(){

    if(PermissionEngine.permissions.server_config != 1)
        return;

    var lzdm = DataEngine.getConfigValue('gl_lzdm',false) == 1;
    if(lzdm)
        return;

    if((!IFManager.IsAppFrame && !IFManager.IsMobileOS) || IFManager.IsDesktopApp())
    {
        if(LocalConfiguration.OnboardingDone.indexOf('0') !== -1 || !LocalConfiguration.OnboardingDone.length)
            $('#onboarding').html(ChatStartpageClass.CreateOnboardingHTML());
        else
            $('#onboarding').html('');

        ChatStartpageClass.UpdateOnboardingDone();
        UIRenderer.resizeStartPage();
    }
};

ChatStartpageClass.SetOnboardingDone = function(_index,_ignore){

    var value = _ignore ? 2 : 1;
    LocalConfiguration.OnboardingDone = LocalConfiguration.OnboardingDone.substr(0, _index) + value + LocalConfiguration.OnboardingDone.substr(_index + 1);
    LocalConfiguration.Save();
    ChatStartpageClass.ShowOnboarding();
};

ChatStartpageClass.UpdateOnboardingDone = function(){

    if(!LocalConfiguration.OnboardingDone.length)
    {
        initLinkGenerator(null,false);
        for(var key in ChatStartpageClass.OnboardingElements)
        {
            var elem = ChatStartpageClass.OnboardingElements[key];
            var toAdd = '0';
            if(elem.id == 'onboarding-operators')
            {
                if(DataEngine.operators.idList.length > 1 || DataEngine.groups.idList.length > 1)
                    toAdd = '1';
            }
            if(elem.id == 'onboarding-chat-invites')
            {
                if(DataEngine.eventList.length)
                    toAdd = '1';
            }
            if(elem.id == 'onboarding-email')
            {
                if(DataEngine.global_configuration.database['email'].length)
                    toAdd = '1';
            }
            if(elem.id == 'onboarding-kb')
            {
                if(DataEngine.cannedResources.idList.length > 1)
                    toAdd = '1';
            }
            if(elem.id == 'onboarding-language')
            {
                if(ChatTranslationEditorClass.AvailableLanguages.server.length != 2 || ChatTranslationEditorClass.AvailableLanguages.mobile.length != 2)
                    toAdd = '1';
            }

            LocalConfiguration.OnboardingDone += toAdd;
        }
        LocalConfiguration.Save();
    }

    var dones = LocalConfiguration.OnboardingDone.split('');
    for(var key in dones)
    {
        var icon = $('#onboarding-icon-'+key.toString());

        if(dones[key] == '1')
        {
            icon.addClass('fa-check-circle');
            icon.removeClass('fa-circle-o');
            icon.addClass('icon-green');
            icon.removeClass('icon-gray');
        }
        else if(dones[key] == '2')
        {
            icon.addClass('fa-check-circle');
            icon.removeClass('fa-circle-o');
            icon.addClass('icon-green');
            icon.removeClass('icon-gray');
            $('#onboarding-'+key.toString()).css({display:'none'});
        }
        else
        {
            icon.removeClass('fa-check-circle');
            icon.addClass('fa-circle-o');
            icon.removeClass('icon-green');
            icon.addClass('icon-gray');
        }
    }
};
