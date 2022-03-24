/****************************************************************************************
 * LiveZilla ChatServerEvaluationClass.js
 *
 * Copyright 2017 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/

function ChatServerEvaluationClass(lzm_commonTools, chosenProfile, lzm_chatTimeStamp) {

    this.lzm_commonConfig = new CommonConfigClass();
    this.lzm_commonTools = lzm_commonTools;
    this.lzm_chatTimeStamp = lzm_chatTimeStamp;
    this.commonEvaluation = {};
    this.myName = '';
    this.myId = '';
    this.myUserId = '';
    this.myEmail = '';
    this.chosen_profile = {};
    this.serverUrl = chosenProfile.server_url;
    this.serverProtocol = chosenProfile.server_protocol;
    this.crc3 = null;
    this.oo = null;
    this.global_configuration = {};
    this.translationLanguages = [];
    this.external_forwards = [];
    this.tickets = [];
    this.ticketGlobalValues = {p: 20, q: 0, t: 0, r: 0, e: 0};
    this.ticketFetchTime = 0;
    this.ticketWatchList = [];
    this.ticketLatestSeenTime = 0;
    this.TicketLatestReceivedTime = 0;
    this.expectTicketChanges = false;
    this.login_data = {};
    this.global_typing = [];
    this.global_errors = [];
    this.wps = [];
    this.rec_posts = [];
    this.chatArchive = {chats: [], q: '', p: 20, t: 0};
    this.cannedResources = new LzmResources();
    this.resources = [];
    this.resourceLastEdited = 0;
    this.emails = [];
    this.EmailsDeleted = [];
    this.emailCount = 0;
    this.EmailCountDeleted = 0;
    this.reportFetchTime = 0;
    this.expectReportChanges = false;
    this.otrs = null;
    this.feedbacksTotal = 0;
    this.feedbacksPage = 20;
    this.feedbacksMaxCreated = 0;
    this.translationStrings = {key: '', strings: {}};
    this.pollFrequency = 0;
    this.timeoutClients = 0;
    this.siteName = '';
    this.defaultLanguage = '';
    this.userLanguage = '';
    this.inputList = new LzmCustomInputs();
    this.filters = new LzmFilters();
    this.eventList = [];
    this.feedbacksList = [];
    this.operators = new OperatorManager();
    this.roles = [];
    this.groups = new GroupManager();
    this.oldGroupIdList = [];
    this.reports = new LzmReports();
    this.ChatManager = new ChatManager();

    this.m_BacklinkHTML = '';
    this.m_BacklinkTitle = '';
    this.m_BacklinkUrl = '';
    this.m_BacklinkIndex = 0;
    this.m_ServerConfigBlocked = false;

    this.new_usr_p = false;
    this.new_int_d = false;
    this.new_ev = false;
    this.new_dt = false;
    this.new_de = false;
    this.new_dc = false;
    this.new_dr = false;
    this.new_ext_b = false;
    this.new_trl = false;
    this.new_startpage = {lz: false, ca: [], cr: []};
    this.eventActionShowAlert = false;
    this.LastConfigurationUpdateTime = 0;
}

ChatServerEvaluationClass.TrialExpireCall = false;

ChatServerEvaluationClass.prototype.setUserLanguage = function(userLang) {
    this.userLanguage = userLang;
    this.commonEvaluation = new CommonServerEvaluationClass(userLang);
};

ChatServerEvaluationClass.prototype.resetWebApp = function() {
    this.external_forwards = [];
    //ChatManager.ActiveChat = '';
    this.global_typing = [];
    this.global_errors = [];
    this.wps = [];
    this.rec_posts = [];
    this.chatArchive = {chats: [], q: '', p: 20, t: 0};
    this.groups.clearGroups();
    this.new_usr_p =
    this.new_int_d =
    this.new_ev =
    this.new_dt =
    this.new_de =
    this.new_dc =
    this.new_ext_b = true;
    lzm_chatDisplay.VisitorsUI.ResetVisitorList(true);
};

ChatServerEvaluationClass.prototype.getLogin = function (xmlDoc) {
    var thisClass = this,cp=false;
    $(xmlDoc).find('login').each(function () {
        var login = $(this);
        login.children('login_return').each(function ()
        {
            var myReturn = $(this);
            var myAttributes = myReturn[0].attributes;

            for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++)
            {
                thisClass.login_data[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value);

                if (thisClass.oo == null && myAttributes[attrIndex].name == 'oo')
                    thisClass.oo = lz_global_base64_url_decode(myAttributes[attrIndex].value);

                if (thisClass.token == null && myAttributes[attrIndex].name == 't')
                    thisClass.token = lz_global_base64_url_decode(myAttributes[attrIndex].value);

                if (myAttributes[attrIndex].name == 'cp' && lz_global_base64_url_decode(myAttributes[attrIndex].value)=='1')
                    cp = true;
            }

            Client.LoginTime = Server.TimeAdjusted;
        });

        thisClass.myName = thisClass.login_data.name;
        thisClass.myId = thisClass.login_data.sess;

        if(cp)
        {
            ChangePassword(null,true);
        }
    });
};

ChatServerEvaluationClass.prototype.getValidationError = function (xmlDoc) {
    var error_value = '-1';
    $(xmlDoc).find('validation_error').each(function () {
        if (error_value == -1) {
            error_value = lz_global_base64_url_decode($(this).attr('value'));
        }
    });
    return error_value;
};

ChatServerEvaluationClass.prototype.getServerVersion = function(xmlDoc) {
    var serverVersion = '';
    $(xmlDoc).find('livezilla_version').each(function() {
        serverVersion = lz_global_base64_decode($(this).text());
    });
    return serverVersion;
};

ChatServerEvaluationClass.prototype.SyncTime = function(xmlDoc) {
    var that=this;
    $(xmlDoc).find('timesync').each(function() {

        Server.Time = parseInt(lz_global_base64_decode($(this)[0].attributes['time'].value));
        Server.TimeAdjusted = parseInt(Server.Time) - parseInt(Client.TimeDifference);
        Client.TimeDifference = ___calcAverage(parseInt(lz_global_base64_decode($(this)[0].attributes['timediff'].value)));
        that.lzm_chatTimeStamp.setTimeDifference(Client.TimeDifference);
    });

    function ___calcAverage(_newDiffValue)
    {
        Client.TimeDifferenceArray.push(_newDiffValue);
        var sum=0,avg,newDiffArray=[];
        for(var i in Client.TimeDifferenceArray)
        {
            sum += Client.TimeDifferenceArray[i];
            if(i > Client.TimeDifferenceArray.length-25)
                newDiffArray.push(Client.TimeDifferenceArray[i]);
        }
        avg = parseInt(Math.floor(sum / Client.TimeDifferenceArray.length));
        Client.TimeDifferenceArray = newDiffArray;
        return avg;
    }
};

ChatServerEvaluationClass.prototype.getGlobalConfiguration = function (xmlDoc) {
    var thisClass = this;
    var myHash = '';
    $(xmlDoc).find('gl_c').each(function ()
    {
        DataEngine.m_ServerConfigBlocked = false;
        $('#main-menu-panel-tools-configuration').removeClass('ui-disabled');

        var gl_c = $(this);
        thisClass.global_configuration = {toplevel: [], site: {}, php_cfg_vars: {}, database: {}};
        thisClass.global_configuration.database['tsd'] = [];
        thisClass.global_configuration.database['goals'] = [];
        thisClass.global_configuration.database['fbc'] = [];
        thisClass.global_configuration.database['email'] = [];
        $(gl_c).children('conf').each(function () {
            var conf = $(this);
            var new_conf = {};
            new_conf.key = lz_global_base64_url_decode(conf.attr('key'));
            new_conf.value = lz_global_base64_url_decode(conf.attr('value'));
            new_conf.subkeys = {};
            $(conf).find('sub').each(function () {
                new_conf.subkeys[lz_global_base64_url_decode($(this).attr('key'))] = lz_global_base64_url_decode($(this).text());
            });
            thisClass.global_configuration.toplevel.push(new_conf);
        });
        $(gl_c).children('site').each(function () {
            var site = $(this);
            var index = lz_global_base64_url_decode(site.attr('index'));
            if (typeof thisClass.global_configuration.site[index] == 'undefined') {
                thisClass.global_configuration.site[index] = [];
            }
            $(site).find('conf').each(function () {
                var conf = $(this);
                var new_conf = {};
                new_conf.key = lz_global_base64_url_decode(conf.attr('key'));
                new_conf.value = lz_global_base64_url_decode(conf.attr('value'));
                new_conf.subkeys = {};
                $(conf).find('sub').each(function () {
                    new_conf.subkeys[lz_global_base64_url_decode($(this).attr('key'))] = lz_global_base64_url_decode($(this).text());
                });
                if(new_conf.key == 'gl_cpar'){
                    thisClass.m_BacklinkHTML = new_conf.value;
                    thisClass.m_BacklinkHTML = thisClass.m_BacklinkHTML.replace("<a class=\"lz_chat_main_link\" href=\"", "").replace("</a>", "");
                    var values = thisClass.m_BacklinkHTML.split("\" target=\"_blank\">");
                    if(values.length>=2){
                        thisClass.m_BacklinkTitle = values[1];
                        thisClass.m_BacklinkUrl = values[0];
                    }
                    else
                        thisClass.m_BacklinkTitle = thisClass.m_BacklinkUrl = '';
                }
                thisClass.global_configuration.site[index].push(new_conf);
            });
        });
        $(gl_c).children('php_cfg_vars').each(function () {
            thisClass.global_configuration.php_cfg_vars['post_max_size'] = lz_global_base64_url_decode($(this).attr('post_max_size'));
            thisClass.global_configuration.php_cfg_vars['upload_max_filesize'] = lz_global_base64_url_decode($(this).attr('upload_max_filesize'));
        });
        $(gl_c).children('translations').each(function() {
            var translations = $(this);
            thisClass.getTranslationLanguages(translations);
        });

        myHash = lz_global_base64_url_decode(gl_c.attr('h'));

        try
        {
            for (var i=0; i<thisClass.global_configuration.site[0].length; i++) {
                if (thisClass.global_configuration.site[0][i].key == 'gl_input_list') {
                    for (var key in thisClass.global_configuration.site[0][i].subkeys) {
                        if (thisClass.global_configuration.site[0][i].subkeys.hasOwnProperty(key)) {
                            var customInput = {id: key, value: thisClass.global_configuration.site[0][i].subkeys[key]};
                            thisClass.inputList.setCustomInput(customInput);
                        }
                    }
                }
            }
        }
        catch(e) {}


        thisClass.setConfigValues(thisClass.global_configuration);
        thisClass.setStartPages(thisClass.global_configuration);

        CommonInputControlsClass.SearchBox.UpdateTags();

        $(xmlDoc).find('gl_tsd').each(function () {
            $(this).children('tsd').each(function () {
                var sd = {};
                sd.name = lz_global_base64_url_decode($(this).attr('i'));
                sd.type = lz_global_base64_url_decode($(this).attr('t'));
                sd.parent = lz_global_base64_url_decode($(this).attr('p'));
                sd.sid = lzm_commonTools.getTicketSubShortId(sd.name,sd.parent);
                thisClass.global_configuration.database['tsd'].push(sd);
            });
        });
        $(xmlDoc).find('gl_go').each(function () {
            $(this).children('tgt').each(function () {
                var go = {};
                go.id = lz_global_base64_url_decode($(this).attr('id'));
                go.title = lz_global_base64_url_decode($(this).attr('title'));
                go.desc = lz_global_base64_url_decode($(this).attr('desc'));
                go.conv = lz_global_base64_url_decode($(this).attr('conv'));
                thisClass.global_configuration.database['goals'].push(go);
            });
        });
        $(xmlDoc).find('gl_fbc').each(function () {
            $(this).children().each(function () {
                var sd = {};
                sd.id = lz_global_base64_url_decode($(this).attr('i'));
                sd.type = lz_global_base64_url_decode($(this).attr('t'));
                sd.title = lz_global_base64_url_decode($(this).text());
                sd.name = lz_global_base64_url_decode($(this).attr('n'));
                thisClass.global_configuration.database['fbc'].push(sd);
            });
        });
        $(xmlDoc).find('gl_email').each(function () {
            $(this).children().each(function () {
                var ea = {};
                ea.type = lz_global_base64_url_decode($(this).attr('t'));
                ea.id = lz_global_base64_url_decode($(this).attr('i'));
                ea.email = lz_global_base64_url_decode($(this).attr('e'));

                ea.host = lz_global_base64_url_decode($(this).attr('h'));
                ea.userName = lz_global_base64_url_decode($(this).attr('u'));
                ea.password = lz_global_base64_url_decode($(this).attr('p'));
                ea.port = lz_global_base64_url_decode($(this).attr('po'));
                ea.encrypt = lz_global_base64_url_decode($(this).attr('s'));

                if(ea.type.toLowerCase() == 'pop' || ea.type.toLowerCase() == 'imap')
                {
                    ea.boxtype = 'incoming';
                    ea.frequency = lz_global_base64_url_decode($(this).attr('c'));
                    ea.deleteDays = lz_global_base64_url_decode($(this).attr('d'));
                    ea.framework = ($(this).attr('f').length) ? lz_global_base64_url_decode($(this).attr('f')) : 'ZEND';
                }
                else
                {
                    ea.boxtype = 'outgoing';
                    ea.default = lz_global_base64_url_decode($(this).attr('de'))=='1';
                    ea.auth = lz_global_base64_url_decode($(this).attr('a'));
                    ea.senderName = lz_global_base64_url_decode($(this).attr('sn'));
                }
                thisClass.global_configuration.database['email'].push(ea);
            });
        });

        if(TaskBarManager.WindowExists('server_configuration_dialog',false))
        {
            var editorId = thisClass.getConfigValue('gl_lced');
            if(editorId != null && editorId != lzm_chatDisplay.myId)
            {
                if(thisClass.LastConfigurationUpdateTime != thisClass.getConfigValue('gl_lcut'))
                    TaskBarManager.Close('server_configuration_dialog');
            }
        }

        thisClass.LastConfigurationUpdateTime = thisClass.getConfigValue('gl_lcut');

    });
    return myHash;
};

ChatServerEvaluationClass.prototype.getConfigValue = function(key, toplevel){
    try
    {
        var i;
        toplevel = (d(toplevel)) ? toplevel : false;
        if(toplevel)
            for (i=0; i<this.global_configuration.toplevel.length; i++)
            {
                if (this.global_configuration.toplevel[i].key == key)
                    return this.global_configuration.toplevel[i];
            }
        else if(d(this.global_configuration.site))
            for (i=0; i<this.global_configuration.site[0].length; i++)
                if (this.global_configuration.site[0][i].key == key)
                    return this.global_configuration.site[0][i].value;
    }
    catch(ex){//called too early
    }
    return null;
};

ChatServerEvaluationClass.prototype.setConfigValue = function(key, _value){
    for (var i=0; i<this.global_configuration.site[0].length; i++)
        if (this.global_configuration.site[0][i].key == key)
            this.global_configuration.site[0][i].value = _value;
};

ChatServerEvaluationClass.prototype.getTranslationLanguages = function(translations) {
    var that = this, derivedLanguages = [], origKeys = [];
    that.translationLanguages = [];
    $(translations).children('language').each(function() {
        var language = $(this);
        var langData = {};
        var myAttributes = language[0].attributes;
        for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++) {
            langData[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value);
        }
        langData.blocked = (typeof langData.blocked != 'undefined') ? parseInt(langData.blocked) : 0;
        langData.derived = (typeof langData.derived != 'undefined') ? parseInt(langData.derived) : 0;
        langData.m = parseInt(langData.m);
        if (langData.derived == 1) {
            derivedLanguages.push(langData);
        } else {
            that.translationLanguages.push(langData);
            origKeys.push(langData.key + '~' + langData.m);
        }
    });
    for (var i=0; i<derivedLanguages.length; i++) {
        if($.inArray(derivedLanguages[i].key + '~' + derivedLanguages[i].m, origKeys) == -1) {
            that.translationLanguages.push(derivedLanguages[i]);
        }
    }
};

ChatServerEvaluationClass.prototype.setConfigValues = function() {

    this.pollFrequency = this.getConfigValue('poll_frequency_clients',false);
    this.timeoutClients = this.getConfigValue('timeout_clients',false);
    this.defaultLanguage = this.getConfigValue('gl_default_language',false);
    this.siteName = this.getConfigValue('gl_site_name',false);
    if (!doBlinkTitle) {
        $('title').html(this.siteName);
    }
};

ChatServerEvaluationClass.prototype.setOtrs = function() {
    this.otrs = this.getConfigValue('gl_otrs',false);
    UserActions.getTranslationLanguages();
};

ChatServerEvaluationClass.prototype.setStartPages = function(global_config) {

    var oldStartPages = lzm_commonTools.clone(lzm_chatDisplay.startPages), lzStartPageChange = false, startPages = '';
    if (startPages == '')
    {
        lzm_chatDisplay.startPages.show_lz = '1';
        lzm_chatDisplay.startPages.others = [];
    }
    if (oldStartPages.show_lz != lzm_chatDisplay.startPages.show_lz)
    {
        lzStartPageChange = true;
    }
    var customPagesWereAdded = [];
    var customPagesWereRemoved = [];
    lzStartPageChange = (this.new_startpage.lz) ? this.new_startpage.lz : lzStartPageChange;
    this.new_startpage = {lz: lzStartPageChange, ca: customPagesWereAdded, cr: customPagesWereRemoved};

};

ChatServerEvaluationClass.prototype.getGlobalTyping = function(xmlDoc) {
    var myHash = '';
    $(xmlDoc).find('gl_typ').each(function () {
        var gl_typ = $(this);
        $(gl_typ).find('v').each(function()
        {
            var thisGlTyp = {
                id: lz_global_base64_url_decode($(this).attr('id')),
                tp: (lz_global_base64_url_decode($(this).attr('tp'))=='1')
            };

            var chatObj = DataEngine.ChatManager.GetChat(thisGlTyp.id,'SystemId');
            if(chatObj != null)
            {
                if(thisGlTyp.tp != chatObj.IndicateTyping)
                {
                    chatObj.IndicateTyping = thisGlTyp.tp;
                    lzm_chatDisplay.RenderChatHistory();
                }
            }
        });
        myHash = lz_global_base64_url_decode(gl_typ.attr('h'));
    });
    return myHash;
};

ChatServerEvaluationClass.prototype.getGlobalErrors = function (xmlDoc) {
    var thisClass = this;
    var myHash = '';
    $(xmlDoc).find('gl_e').each(function () {
        thisClass.new_gl_e = true;
        var gl_e = $(this);
        thisClass.global_errors = [];
        $(gl_e).find('val').each(function () {
            var val = $(this);
            thisClass.global_errors.push(lz_global_base64_url_decode(val.attr('err')));
        });

        myHash = lz_global_base64_url_decode(gl_e.attr('h'));
    });
    return myHash;
};

ChatServerEvaluationClass.prototype.getTranslationStrings = function(xmlDoc) {
    var that = this;
    $(xmlDoc).find('response').each(function() {
        var response = $(this);
        response.find('language').each(function() {
            var language = $(this);
            var key = lz_global_base64_url_decode(language.attr('key'));
            that.translationStrings.key = (key != 'orig') ? key : 'en';
            language.children('val').each(function() {
                var val = $(this);
                that.translationStrings.strings[lz_global_base64_url_decode(val.attr('key'))] = lz_global_base64_url_decode(val.text());
                that.new_trl = true;
            });
        });
    });
};

ChatServerEvaluationClass.prototype.getServerUrl = function(_filename,_scheme) {

    _filename = (d(_filename)) ? _filename : '';
    _scheme = (d(_scheme)) ? _scheme : this.serverProtocol;

    var su = this.serverUrl.replace(':80/','/').replace(':443/','/');

    if(su.endsWith(':80'))
        su = su.replace(':80','');
    if(su.endsWith(':443'))
        su = su.replace(':443','');

    su += '/' + _filename;
    su = su.replace('//','/');

    return _scheme + su;
};

ChatServerEvaluationClass.prototype.ProcessVisitors = function (xmlDoc) {

    var updateWindows = false;

    function ___processComment(_visitorObj,_parentNode){
        var comXML = $(_parentNode);
        var comObj = {};
        lzm_commonTools.ApplyFromXML(comObj,comXML[0].attributes);
        comObj.text = lz_global_base64_url_decode(comXML.text());
        VisitorManager.AddComment(_visitorObj,comObj);
    }
    function ___processInvites(_visitorObj,_parentNode){
        var inviteXML = $(_parentNode);
        var invObj = {};
        lzm_commonTools.ApplyFromXML(invObj,inviteXML[0].attributes);
        VisitorManager.AddInvite(_visitorObj,invObj);
    }

    $(xmlDoc).find('v_users').each(function () {

        var visitorList = $(this);
        $(visitorList).find('v').each(function () {

            var visitorXML = $(this);
            var visObj = {};
            lzm_commonTools.ApplyFromXML(visObj,visitorXML[0].attributes);
            visObj.id = visObj.i;

            var dataObj = {};
            $(visitorXML).find('d').each(function () {
                var dataXML = $(this);
                lzm_commonTools.ApplyFromXML(dataObj,dataXML[0].attributes);
                VisitorManager.UpdateVisitorNameInTaskBar(visObj.id,dataObj.f111);
            });

            visObj.d = dataObj;

            $(visitorXML).find('r').each(function () {
                ___processInvites(visObj,this);
            });
            $(visitorXML).find('c').each(function () {
                ___processComment(visObj,this);
            });

            VisitorManager.AddVisitor(visObj);

            updateWindows = true;
        });
        $(visitorList).find('rdl').each(function () {

            var rdlXML = $(this);
            var vid = lz_global_base64_decode(rdlXML.attr('v'));

            // update visitor and offline object with demand data
            var fduobj = lzm_commonTools.GetElementByProperty(VisitorManager.LoadedFullDataUsers,'id',vid);
            var vis = fduobj[0];
            $(rdlXML).find('rv').each(function () {
                var rvXML = $(this);
                var rvObj = {};
                lzm_commonTools.ApplyFromXML(rvObj,rvXML[0].attributes);
                rvObj.v = vid;
                if(vis != null)
                {
                    if(!d(vis.rv))
                        vis.rv = [];
                    vis.rv.push(rvObj);
                }
            });

            $(rdlXML).find('c').each(function () {
                ___processComment(vis,this);
            });
            $(rdlXML).find('r').each(function () {
                ___processInvites(vis,this);
            });

        });
        $(visitorList).find('dut').each(function () {
            var dutXML = $(this);
            var dut = {};
            lzm_commonTools.ApplyFromXML(dut,dutXML[0].attributes);
            VisitorManager.DUTVisitors = Math.max(VisitorManager.DUTVisitors,dut.e);
        });

    });
    $(xmlDoc).find('v_browsers').each(function () {
        VisitorManager.needsUIupdate = true;
        var browserList = $(this);
        $(browserList).find('b').each(function () {
            var browserXML = $(this);
            var brObj = {};
            lzm_commonTools.ApplyFromXML(brObj,browserXML[0].attributes);
            VisitorManager.AddBrowser(brObj);

        });
        $(browserList).find('dut').each(function () {
            var dutXML = $(this);
            var dut = {};
            lzm_commonTools.ApplyFromXML(dut,dutXML[0].attributes);
            VisitorManager.DUTVisitorBrowserEntrance = Math.max(VisitorManager.DUTVisitorBrowserEntrance,dut.e);
        });
        updateWindows = true;
    });
    $(xmlDoc).find('v_urls').each(function () {
        VisitorManager.needsUIupdate = true;
        var urlList = $(this);
        $(urlList).find('h').each(function () {
            var urlXML = $(this);
            var urlObj = {ref:{u:''}};
            lzm_commonTools.ApplyFromXML(urlObj,urlXML[0].attributes);
            $(urlXML).find('ref').each(function () {
                var refXML = $(this);
                urlObj.ref = {};
                lzm_commonTools.ApplyFromXML(urlObj.ref,refXML[0].attributes);
            });
            VisitorManager.AddURL(urlObj);
        });
        updateWindows = true;
    });

    VisitorManager.PruneVisitors();
    if(VisitorFilterManager.CountVisitors())
        VisitorManager.needsUIupdate = true;

    var awin = TaskBarManager.GetActiveWindow();
    if(awin != null && updateWindows)
    {
        if (awin.TypeId == 'chat-window')
            lzm_chatDisplay.VisitorsUI.UpdateVisitorInformation(VisitorManager.GetVisitorPart(awin.Tag));
        else if(awin.DialogId.startsWith('visitor-information-'))
            lzm_chatDisplay.VisitorsUI.UpdateVisitorInformation(awin.Tag);
    }
};

ChatServerEvaluationClass.prototype.getChats = function (xmlDoc, customDemandTocken) {
    var thisClass = this;
    var chatReturn = {dut: ''};

    function ___loadChats(_visitorObj,_node)
    {
        $(_node).children('c').each(function () {
            var c = $(this);
            var acobj = thisClass.addArchivedChat(c);
            var exacc = lzm_commonTools.GetElementByProperty(_visitorObj.ArchivedChats,'cid',acobj.cid);
            if(!exacc.length)
                _visitorObj.ArchivedChats.push(acobj);
        });
    }

    $(xmlDoc).find('ext_c').each(function ()
    {
        var ext_c = $(this);
        $(ext_c).children('dc').each(function () {
            if(!customDemandTocken)
            {
                // regular chat archive view
                thisClass.chatArchive = {chats: [], q: '', p: 20, t: 0};
                var myAttributes = $(this)[0].attributes;
                for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++)
                {
                    if (myAttributes[attrIndex].name == 'dut')
                        chatReturn['dut'] = lz_global_base64_url_decode(myAttributes[attrIndex].value);
                    thisClass.chatArchive[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value);
                }
                $(this).children('c').each(function () {
                    var c = $(this);
                    thisClass.chatArchive.chats.push(thisClass.addArchivedChat(c));
                });
                thisClass.new_dc = true;
            }
        });
        $(ext_c).children('ac').each(function () {

            var ac = $(this);
            var visitorId = lz_global_base64_url_decode(ac.attr('id'));
            /*
            var visitorObj = VisitorManager.GetVisitor(visitorId);

            if(visitorObj != null && visitorObj.is_active)
            {
                // load online data for visitor center
                //if(!d(visitorObj.ArchivedChats))
                  //  visitorObj.ArchivedChats = [];

                ___loadChats(visitorObj,this);
            }
            else
            {*/
                // load offline data for visitor center
                var visitors = lzm_commonTools.GetElementByProperty(VisitorManager.LoadedFullDataUsers,'id',visitorId);

                if(visitors.length)
                {
                     ___loadChats(visitors[0],this);

                    if(ChatVisitorClass.VisitorInformationId == visitorId)
                        lzm_chatDisplay.VisitorsUI.UpdateVisitorInformation(visitorId);
                }
            //}
        });
    });
    return chatReturn;
};

ChatServerEvaluationClass.prototype.addArchivedChat = function(c) {
    var new_c = {cc: []};
    var myAttributes = c[0].attributes;
    for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++)
        new_c[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value);
    c.children('chtml').each(function() {
        new_c.chtml = lz_global_base64_url_decode($(this).text());
    });
    c.children('cplain').each(function() {
        new_c.cplain = lz_global_base64_url_decode($(this).text());
    });
    c.children('cc').each(function() {
        var new_cc = {cuid: lz_global_base64_url_decode($(this).attr('cuid')), text: lz_global_base64_url_decode($(this).text())};
        new_c.cc.push(new_cc);
    });

    return new_c;
};

ChatServerEvaluationClass.prototype.getResources = function (xmlDoc) {
    var thisClass = this,newRes = [];
    KnowledgebaseUI.CreateRootResource();
    $(xmlDoc).find('ext_res').each(function() {
        var ext_res = $(this);
        $(ext_res).find('r').each(function () {
            thisClass.new_qrd = true;

            var new_r = {};
            var myAttributes = $(this)[0].attributes;
            for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++)
            {
                new_r[myAttributes[attrIndex].name] = lz_global_base64_decode(myAttributes[attrIndex].value);
            }
            new_r.text = lz_global_base64_decode($(this).text());
            var serializedXmlString = (new XMLSerializer()).serializeToString(this);
            new_r.md5 = md5(serializedXmlString);

            newRes.push(lzm_commonTools.clone(new_r));
            if (new_r.di == 0)
            {
                thisClass.cannedResources.setResource(new_r);
            }
            if (new_r.di != 0 && new_r.disc != 0)
            {
                thisClass.cannedResources.removeResource(new_r.rid);
            }

            var editedTime = (typeof new_r.ed != 'undefined') ? new_r.ed : 0;
            thisClass.resourceLastEdited = Math.max(thisClass.resourceLastEdited, editedTime);
        });
    });

    KnowledgebaseUI.IsSyncing = newRes.length>5;
    if(newRes.length>0)
    {
        setTimeout(function(){

            var list = LocalConfiguration.CreateKnowledgeBaseShortList();

            lzm_commonStorage.saveValue('kb_list_' + DataEngine.myId, list);

            for(var key in newRes)
                lzm_commonStorage.saveValue('kb_i_' + DataEngine.myId + KnowledgebaseUI.GetResourceStorageHash(newRes[key].rid), JSON.stringify(newRes[key]));

            lzm_commonStorage.saveValue('kb_dut_' + DataEngine.myId, DataEngine.resourceLastEdited);
            lzm_chatDisplay.resourcesDisplay.UpdateResources(newRes);

        },1);
    }
    else
    {
        lzm_chatDisplay.resourcesDisplay.UpdateKBInfo();
    }
    return thisClass.resourceLastEdited;
};

ChatServerEvaluationClass.prototype.getReports = function(xmlDoc) {
    var that = this, myDut = '';
    try {
    $(xmlDoc).find('dr').each(function()
    {
        var dr = $(this);
        that.reports.clearReports();
        $(dr).children('r').each(function() {
            var r = $(this);
            that.reports.setReport(that.addReport(r));
        });
        var reportGlobalValues = {};
        var myAttributes = dr[0].attributes;
        for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++)
        {
            reportGlobalValues[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value);
        }
        that.reports.setTotal(reportGlobalValues.t);
        that.reports.setMatching(reportGlobalValues.q);
        that.reports.setReportsPerPage(reportGlobalValues.p);
        myDut = reportGlobalValues.dut;
        that.new_dr = true;
        that.expectReportChanges = false;
    });
    } catch(ex) {}
    if (that.expectReportChanges) {
        that.expectReportChanges = false;
    } else {
        that.reportFetchTime = lzm_chatTimeStamp.getServerTimeString(null, false, 1);
    }
    return myDut;
};

ChatServerEvaluationClass.prototype.addReport = function(r) {
    var that = this, newReport = {};
    var myAttributes = r[0].attributes;
    for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++) {
        newReport[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value);
    }
    return newReport;
};

ChatServerEvaluationClass.prototype.getFilters = function(xmlDoc) {
    var thisClass = this, myDut = '';
    var filterHash = '';
    $(xmlDoc).find('ext_b').each(function() {
        thisClass.new_ext_b = true;
        var ext_b = $(this);
        filterHash = lz_global_base64_url_decode(ext_b.attr('h'));
        thisClass.filters.clearFilters();
        var filterGlobalValues = {};
        ext_b.find('dfi').each(function() {
            var dfi = $(this);
            var myAttributes = dfi[0].attributes;
            for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++) {
                filterGlobalValues[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value);
            }
            dfi.find('val').each(function() {
                var newFilter = thisClass.addFilter($(this));
                thisClass.filters.setFilter(newFilter);
             });
        });
        myDut = filterGlobalValues.dut;
    });
    return {hash: filterHash, dut: myDut};
};

ChatServerEvaluationClass.prototype.processActions = function(xmlDoc) {
    var that = this,key,akey,ia,ev,ac,aid;
    $(xmlDoc).find('int_ac').each(function() {

        var int_ac = $(this);
        int_ac.find('ia').each(function() {

            ia = $(this);
            aid = lz_global_base64_url_decode(ia.attr('aid'));

            for(key in that.eventList)
            {
                ev = that.eventList[key];
                for(akey in ev.Actions)
                {
                    ac = ev.Actions[akey];
                    if(ac.id == aid)
                    {
                        if(ac.type=='0')
                        {
                            function a()
                            {
                                that.eventActionShowAlert = true;
                                lzm_commonDialog.createAlertDialog('<b>' + ev.name + ':</b><br><br>' + ac.val, [{id: 'ok', name: tid('ok')},{id: 'visitor', name: tid('visitor')}]);
                                $('#alert-btn-ok').click(function() {
                                    that.eventActionShowAlert = false;
                                    lzm_commonDialog.removeAlertDialog();
                                });

                                $('#alert-btn-visitor').click(function() {
                                    that.eventActionShowAlert = false;
                                    lzm_commonDialog.removeAlertDialog();
                                    var vid = lz_global_base64_url_decode(ia.attr('vid'));
                                    ChatVisitorClass.ShowVisitorInformation(vid);
                                });
                            }
                            if(!that.eventActionShowAlert)
                                a();
                        }
                        else if(ac.type=='1'){
                            function b()
                            {
                                $('#event_action_audio').remove();
                                var sound = document.createElement('audio');
                                sound.setAttribute('src',ac.val);
                                sound.id='event_action_audio';
                                sound.setAttribute('autoplay','true');
                                document.body.appendChild(sound);
                            }
                            b();
                        }
                    }
                }
            }
        });
    });
};

ChatServerEvaluationClass.prototype.addFilter = function(val) {
    var newFilter = {};
    var myAttributes = val[0].attributes;
    for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++) {
        newFilter[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value);
    }
    return newFilter;
};

ChatServerEvaluationClass.prototype.getEvents = function(xmlDoc) {
    var thisClass = this;
    var myEventDut = '';
    $(xmlDoc).find('listen').each(function() {
        var listen = $(this);
        var evList = listen.children('ev');
        evList.each(function() {
            var evl = $(this);
            myEventDut = lz_global_base64_url_decode(evl.attr('dut'));
            var doUpdate = !d(evl.attr('nu'));
            var evs = evl.children('ev');
            if(doUpdate){
                thisClass.new_ev = true;
                thisClass.eventList = [];
                evs.each(function() {
                    var ev = $(this);
                    ev = thisClass.addEvent(ev);
                    thisClass.eventList.push(ev);
                });
            }
        });
    });
    return {'event-dut': myEventDut};
};

ChatServerEvaluationClass.prototype.addEvent = function(val) {
    var newEvent = {};
    newEvent.Actions = [];
    newEvent.Goals = [];
    newEvent.DataConditions = [];
    newEvent.URLConditions = [];
    lzm_commonTools.ApplyFromXML(newEvent,val[0].attributes);
    val.children().each(function() {
        var subE = $(this);

        // actions
        if(subE[0].nodeName == 'evac'){
            var evAction = {};
            evAction.Invites = [];
            evAction.Overlays = [];
            evAction.Pushs = [];
            evAction.Receivers = [];
            lzm_commonTools.ApplyFromXML(evAction,subE[0].attributes,subE);
            subE.children().each(function() {
                var subActionE = $(this);
                if(subActionE[0].nodeName == 'evinv'){
                    var evActionInv = {};
                    evActionInv.Senders = [];
                    evActionInv.SenderGroupId = '';
                    lzm_commonTools.ApplyFromXML(evActionInv,subActionE[0].attributes,subActionE);
                    subActionE.children('evinvs').each(function() {
                        var invSenderE = $(this);
                        var invSender = {};
                        lzm_commonTools.ApplyFromXML(invSender,invSenderE[0].attributes,invSenderE);
                        if(!invSender.userid.length)
                            evActionInv.SenderGroupId = invSender.groupid;
                        evActionInv.Senders.push(invSender);
                    });
                    evAction.Invites.push(evActionInv);
                }
                else if(subActionE[0].nodeName == 'evolb'){
                    var evActionOvlb = {};
                    lzm_commonTools.ApplyFromXML(evActionOvlb,subActionE[0].attributes,subActionE);
                    evAction.Overlays.push(evActionOvlb);
                }
                else if(subActionE[0].nodeName == 'evwp'){
                    var evActionWp = {};
                    evActionWp.Senders = [];
                    var subActionP = $(this);
                    lzm_commonTools.ApplyFromXML(evActionWp,subActionE[0].attributes,subActionE);
                    subActionP.children().each(function() {
                        var pushSenderE = $(this);
                        var pushSender = {};
                        lzm_commonTools.ApplyFromXML(pushSender,pushSenderE[0].attributes,pushSenderE);
                        evActionWp.Senders.push(pushSender);
                    });
                    evAction.Pushs.push(evActionWp);
                }
                else if(subActionE[0].nodeName == 'evr'){
                    var evActionRec = {};
                    lzm_commonTools.ApplyFromXML(evActionRec,subActionE[0].attributes,subActionE);
                    evAction.Receivers.push(evActionRec);
                }
            });
            newEvent.Actions.push(evAction);
        }
        // event url
        else if(subE[0].nodeName == 'evur'){
            var evURL = {};
            lzm_commonTools.ApplyFromXML(evURL,subE[0].attributes,subE);
            newEvent.URLConditions.push(evURL);
        }
        // goals
        else if(subE[0].nodeName == 'evg'){
            var goal = {};
            lzm_commonTools.ApplyFromXML(goal,subE[0].attributes,subE);
            newEvent.Goals.push(goal);
        }
        else if(subE[0].nodeName == 'dc'){
            var cond = {};
            lzm_commonTools.ApplyFromXML(cond,subE[0].attributes,subE);
            cond.id=lzm_commonTools.guid();
            newEvent.DataConditions.push(cond);
        }
    });
    return newEvent;
};

ChatServerEvaluationClass.prototype.getFeedbacks = function(xmlDoc) {
    var that = this;
    var visitorObj = null, visitorId = '',myFeedbacksDut = '';

    // load visitor data
    $(xmlDoc).find('af').each(function()
    {
        var reset = false;
        var af = $(this);
        af.find('fb').each(function()
        {
            var fb = $(this);
            visitorId = lz_global_base64_url_decode(fb.attr('u'));

            visitorObj = VisitorManager.GetFullDataVisitor(visitorId);
            if(visitorObj != null)
            {
                if(!reset)
                {
                    visitorObj.ArchivedFeedbacks = [];
                    reset = true;
                }
                var fbo = that.addFeedback(fb);
                visitorObj.ArchivedFeedbacks.push(fbo);
            }
        });

        if(visitorObj != null && ChatVisitorClass.VisitorInformationId == visitorId)
            lzm_chatDisplay.VisitorsUI.UpdateVisitorInformation(visitorId);
    });

    // load feedback view data
    $(xmlDoc).find('ext_fb').each(function()
    {
        var listen = $(this);
        var fbList = listen.children('dfb');
        fbList.each(function() {
            var fbl = $(this);
            myFeedbacksDut = lz_global_base64_url_decode(fbl.attr('dut'));
            that.feedbacksTotal = lz_global_base64_url_decode(fbl.attr('t'));

            var fbs = fbl.children('fb');
            that.new_fb = true;
            that.feedbacksList = [];
            fbs.each(function() {
                var fb = $(this);
                fb = that.addFeedback(fb);
                that.feedbacksList.push(fb);
                that.feedbacksMaxCreated = Math.max(that.feedbacksMaxCreated,fb.cr);
            });

        });
    });
    return {'feedbacks-dut': myFeedbacksDut};
};

ChatServerEvaluationClass.prototype.addFeedback = function(val) {
    var newFeedback = {};
    newFeedback.UserData = {f111:'-',f112:'-',f113:'-',f114:'-',f116:'-'};
    newFeedback.Criteria = [];
    lzm_commonTools.ApplyFromXML(newFeedback,val[0].attributes);
    var sList = val.children();
    sList.each(function() {
        var subN = $(this);
        if(subN[0].nodeName == 'd')
            lzm_commonTools.ApplyFromXML(newFeedback.UserData,subN[0].attributes);
        else if(subN[0].nodeName == 'v'){
            var crit = {};
            lzm_commonTools.ApplyFromXML(crit,subN[0].attributes,subN);
            newFeedback.Criteria.push(crit);
        }
    });
    return newFeedback;
};

ChatServerEvaluationClass.prototype.getUsrP = function (xmlDoc) {
    var thisClass = this, newPosts = false;
    $(xmlDoc).find('usr_p').each(function ()
    {
        thisClass.new_usr_p = true;
        var usr_p = $(this);
        $(usr_p).find('val').each(function ()
        {
            var val = $(this);
            thisClass.addUsrP(val);
            newPosts = true;
        });

        $(usr_p).find('psul').each(function ()
        {
            var psul = $(this);
            ChatManager.LastPostStatusUpdate = lz_global_base64_decode(psul.attr('u'));
            $(usr_p).find('su').each(function ()
            {
                var su = $(this);
                var p = lz_global_base64_decode(su.attr('i'));
                var r = lz_global_base64_decode(su.attr('re'));
                var n = lz_global_base64_decode(su.attr('n'))=='1';
                var co = DataEngine.ChatManager.GetChat(r);
                if(co != null)
                    for(var key in co.Messages)
                    {
                        if(co.Messages[key].id == p)
                        {
                            co.Messages[key].Received = true;
                            co.Messages[key].Noticed = n;
                            if(ChatManager.ActiveChat == co.SystemId)
                                OpenChatWindow(co.SystemId);
                            break;
                        }
                    }
            });
        });
    });

    if(newPosts)
        lzm_chatDisplay.RenderTaskBarPanel();
};

ChatServerEvaluationClass.prototype.addUsrP = function (val) {

    var thisClass = this,new_chat = {},myAttributes = val[0].attributes,chatObj;
    for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++)
        new_chat[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value);

    new_chat = Chat.FormatPost(new_chat);

    if (new_chat.sen.indexOf('~') != -1)
    {
        new_chat.sen_id = new_chat.sen.split('~')[0];
        new_chat.sen_b_id = new_chat.sen.split('~')[1];
    }
    else
    {
        new_chat.sen_id = new_chat.sen;
        new_chat.sen_b_id = '';
    }
    if (new_chat.rec != '' && new_chat.rec != new_chat.sen && new_chat.rec != new_chat.reco)
    {
        new_chat.sen_id = new_chat.rec;
        new_chat.sen_b_id = '';
    }

    new_chat.text = lz_global_htmlentities(lz_global_base64_url_decode(val.text()));
    new_chat.textOriginal = lz_global_base64_url_decode(val.text());

    this.rec_posts.push(new_chat.id);

    new_chat = Chat.ProcessPostCommands(new_chat);

    if(new_chat==null)
        return;

    var playSound = true;
    var chatFrameId = (new_chat.rec.length) ? new_chat.rec : new_chat.reco;

    chatObj = this.ChatManager.GetChat(chatFrameId);

    if(chatObj == null && chatFrameId.indexOf('~') == -1)
    {
        if(chatFrameId == thisClass.myId)
            chatFrameId = new_chat.sen_id;

        var group = thisClass.groups.getGroup(chatFrameId);
        var operator = thisClass.operators.getOperator(chatFrameId);

        if(group != null || chatFrameId == 'everyoneintern')
        {
            this.ChatManager.AddInternalChat(chatFrameId,Chat.ChatGroup);
        }
        else if(operator != null)
        {
            this.ChatManager.AddInternalChat(chatFrameId,Chat.Operator);
        }
        chatObj = this.ChatManager.GetChat(chatFrameId);
        chatObj.OpenChatWindow();
    }

    else if(chatObj == null)
    {
        playSound = false;
    }

    if(chatObj != null)
    {
        chatObj.AddMessage(new_chat,true);

        var winObj = TaskBarManager.GetActiveWindow();
        if(winObj != null && winObj.Tag == chatObj.SystemId)
        {
            OpenChatWindow(chatObj.SystemId);
        }
    }

    if (playSound && new_chat.rp != 1)
    {
        NotificationManager.NotifyChatMessage(chatObj,new_chat);
    }
};

ChatServerEvaluationClass.prototype.GetGroups = function (xmlDoc) {
    var thisClass = this;
    var myHash = '';
    var invalidateHash = false;
    $(xmlDoc).find('int_d').each(function ()
    {
        CommonUIClass.UpdateUserList = true;
        var newGroupIdList = [];
        thisClass.new_int_d = true;
        thisClass.groups.clearGroups();
        var int_d = $(this);
        $(int_d).find('v').each(function () {
            try {
                var v = $(this);
                var newGroup = thisClass.commonEvaluation.addDepartment(v);
                if(!thisClass.groups.setGroup(newGroup))
                {
                    invalidateHash = true;
                }
                newGroupIdList.push(newGroup.id);
            }
            catch(e) {deblog(e);}
        });

        myHash = lz_global_base64_url_decode(int_d.attr('h'));
        if (thisClass.oldGroupIdList.length != 0)
        {
            var removedGroupList = [], addedGroupList = [], i;
            for (i=0; i<thisClass.oldGroupIdList.length; i++)
            {
                if ($.inArray(thisClass.oldGroupIdList[i], newGroupIdList) == -1)
                    removedGroupList.push(thisClass.oldGroupIdList[i]);
            }
            for (i=0; i<newGroupIdList.length; i++) {
                if ($.inArray(newGroupIdList[i], thisClass.oldGroupIdList) == -1)
                    addedGroupList.push(newGroupIdList[i]);
            }
        }
        thisClass.oldGroupIdList = newGroupIdList;
    });

    if(invalidateHash)
        myHash = '';

    return myHash;
};

ChatServerEvaluationClass.prototype.GetOperators = function (xmlDoc) {

    var thisClass = this;
    var updates = false;

    $(xmlDoc).find('int_r').each(function ()
    {
        var int_r = $(this);
        $(int_r).find('v').each(function ()
        {
            CommonUIClass.UpdateUserList = true;
            var v = $(this);
            var newOperator = thisClass.commonEvaluation.addInternalUser(v);

            thisClass.operators.setOperator(newOperator);
            updates = true;
        });

        thisClass.roles = [];
        $(int_r).find('r').each(function ()
        {
            var r = $(this);
            var role = {};
            lzm_commonTools.ApplyFromXML(role,r[0].attributes);
            thisClass.roles.push(role);
        });
    });

    if (thisClass.otrs == null)
        thisClass.setOtrs();



    return updates;
};

ChatServerEvaluationClass.prototype.GetErrors = function (xmlDoc) {

    $(xmlDoc).find('gl_e').each(function ()
    {
        var gl_e = $(this);
        $(gl_e).find('val').each(function ()
        {
            var err = lz_global_base64_decode($(this).attr('err'));
            NotificationManager.NotifyError(err);
        });
    });
};

ChatServerEvaluationClass.prototype.getIntWp = function (xmlDoc) {
    var thisClass = this;
    var myHash = '';
    $(xmlDoc).find('int_wp').each(function () {
        var int_wp = $(this);
        thisClass.wps = [];
        $(int_wp).find('v').each(function () {
            var v = $(this);
            thisClass.wps.push(thisClass.addWP(v));
        });

        myHash = lz_global_base64_url_decode(int_wp.attr('h'));
    });
    return myHash;
};

ChatServerEvaluationClass.prototype.addWP = function (v) {
    var new_wp = {};
    var myAttributes = v[0].attributes;
    for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++) {
        new_wp[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value)
    }
    return new_wp;
};

ChatServerEvaluationClass.prototype.getTickets = function(xmlDoc, maxRead, customDemandTocken) {

    var that = this;
    var firstPoll = typeof this.ticketGlobalValues['updating'] == 'undefined';
    var myHash = '', myTicketDut = '', myEmailDut = '';
    var tlmc = (typeof that.ticketGlobalValues['tlmc'] != 'undefined' && that.ticketGlobalValues['tlmc'] != '') ? that.ticketGlobalValues['tlmc'] : 0;
    var elmc = (typeof that.ticketGlobalValues['elmc'] != 'undefined' && that.ticketGlobalValues['elmc'] != '') ? that.ticketGlobalValues['elmc'] : 0;
    that.ticketGlobalValues['updating'] = false;
    that.ticketGlobalValues['no_update'] = false;
    that.ticketGlobalValues['mr'] = maxRead;

    function ___loadTickets(_visitorObj,_node){
        _visitorObj.ArchivedTickets = [];
        $(_node).find('val').each(function () {
            var val = $(this);
            var thisTicket = that.addTicket(val);
            _visitorObj.ArchivedTickets.push(thisTicket);
        });
    }

    // archived tickets
    $(xmlDoc).find('at').each(function () {
        var at = $(this);
        var visitorId = lz_global_base64_url_decode(at.attr('id'));

        /*
        var visitorObj = VisitorManager.GetVisitor(visitorId);
        if(visitorObj != null)
        {
            // load online data for visitor center
            ___loadTickets(visitorObj,this);
        }
        else
        {*/
            // load offline data for visitor center
            var visitors = lzm_commonTools.GetElementByProperty(VisitorManager.LoadedFullDataUsers,'id',visitorId);
            if(visitors.length)
            {
                ___loadTickets(visitors[0],this);

                if(ChatVisitorClass.VisitorInformationId == visitorId)
                    lzm_chatDisplay.VisitorsUI.UpdateVisitorInformation(visitorId);
            }
        //}
    });
    $(xmlDoc).find('dt').each(function () {
        that.new_dt = true;
        var dt = $(this);
        $(dt).find('no_update').each(function() {
            that.ticketGlobalValues['no_update'] = true;
        });
        var globValues = {
            q: lz_global_base64_url_decode(dt.attr('q')),
            r: lz_global_base64_url_decode(dt.attr('r')),
            t: lz_global_base64_url_decode(dt.attr('t')),
            ta: lz_global_base64_url_decode(dt.attr('ta')),
            p: lz_global_base64_url_decode(dt.attr('p')),
            lmn: lz_global_base64_url_decode(dt.attr('lmn')),
            lmid: lz_global_base64_url_decode(dt.attr('lmi')),
            lmt: lz_global_base64_url_decode(dt.attr('lmt')),
            lmc: lz_global_base64_url_decode(dt.attr('lmc')),
            tm: lz_global_base64_url_decode(dt.attr('tm')),
            tmg: lz_global_base64_url_decode(dt.attr('tmg')),
            tst0: lz_global_base64_url_decode(dt.attr('tst0')),
            tst1: lz_global_base64_url_decode(dt.attr('tst1')),
            tst2: lz_global_base64_url_decode(dt.attr('tst2')),
            tst3: lz_global_base64_url_decode(dt.attr('tst3')),
            tst4: lz_global_base64_url_decode(dt.attr('tst4')),
            tdue: lz_global_base64_url_decode(dt.attr('tdue'))
        };

        tlmc = (parseInt(lz_global_base64_url_decode(dt.attr('lmc'))) > tlmc) ? parseInt(lz_global_base64_url_decode(dt.attr('lmc'))) : tlmc;
        if (!that.ticketGlobalValues['no_update'])
        {
            that.tickets = [];
            $(dt).find('updating').each(function() {
                that.ticketGlobalValues['updating'] = true;
            });
            that.ticketGlobalValues['t'] = (globValues['t'] != '' || typeof that.ticketGlobalValues['t'] == 'undefined') ? globValues['t'] : that.ticketGlobalValues['t'];
            that.ticketGlobalValues['ta'] = (globValues['ta'] != '' || typeof that.ticketGlobalValues['ta'] == 'undefined') ? globValues['ta'] : that.ticketGlobalValues['ta'];
            that.ticketGlobalValues['r'] = (globValues['r'] != '' || typeof that.ticketGlobalValues['r'] == 'undefined') ? globValues['r'] : that.ticketGlobalValues['r'];

            if(!customDemandTocken)
                that.ticketGlobalValues['q'] = (globValues['q'] != '' || typeof that.ticketGlobalValues['q'] == 'undefined') ? globValues['q'] : that.ticketGlobalValues['q'];

            that.ticketGlobalValues['p'] = (globValues['p'] != '' || typeof that.ticketGlobalValues['p'] == 'undefined') ? globValues['p'] : that.ticketGlobalValues['p'];

            that.ticketGlobalValues['tlmn'] = /*(typeof that.ticketGlobalValues['tlmn'] == 'undefined') ? */globValues['lmn'];/* : that.ticketGlobalValues['tlmn'];*/
            that.ticketGlobalValues['tlmid'] = /*((typeof that.ticketGlobalValues['tlmid'] == 'undefined') ? */globValues['lmid'];/*( : that.ticketGlobalValues['tlmid'];*/
            that.ticketGlobalValues['tlmt'] = /*((typeof that.ticketGlobalValues['tlmt'] == 'undefined') ? */globValues['lmt'];/*( : that.ticketGlobalValues['tlmt'];*/
            that.ticketGlobalValues['tlmc'] = /*((typeof that.ticketGlobalValues['tlmt'] == 'undefined') ? */globValues['lmc'];/*( : that.ticketGlobalValues['tlmt'];*/

            that.ticketGlobalValues['ttm'] = (globValues['tm'] != '' || typeof that.ticketGlobalValues['ttm'] == 'undefined') ? globValues['tm'] : that.ticketGlobalValues['ttm'];
            that.ticketGlobalValues['ttmg'] = (globValues['tmg'] != '' || typeof that.ticketGlobalValues['ttmg'] == 'undefined') ? globValues['tmg'] : that.ticketGlobalValues['ttmg'];
            that.ticketGlobalValues['ttst0'] = (globValues['tst0'] != '' || typeof that.ticketGlobalValues['ttst0'] == 'undefined') ? globValues['tst0'] : that.ticketGlobalValues['ttst0'];
            that.ticketGlobalValues['ttst1'] = (globValues['tst1'] != '' || typeof that.ticketGlobalValues['ttst1'] == 'undefined') ? globValues['tst1'] : that.ticketGlobalValues['ttst1'];
            that.ticketGlobalValues['ttst2'] = (globValues['tst2'] != '' || typeof that.ticketGlobalValues['ttst2'] == 'undefined') ? globValues['tst2'] : that.ticketGlobalValues['ttst2'];
            that.ticketGlobalValues['ttst3'] = (globValues['tst3'] != '' || typeof that.ticketGlobalValues['ttst3'] == 'undefined') ? globValues['tst3'] : that.ticketGlobalValues['ttst3'];
            that.ticketGlobalValues['ttst4'] = (globValues['tst4'] != '' || typeof that.ticketGlobalValues['ttst4'] == 'undefined') ? globValues['tst4'] : that.ticketGlobalValues['ttst4'];
            that.ticketGlobalValues['ttdue'] = (globValues['tdue'] != '' || typeof that.ticketGlobalValues['ttdue'] == 'undefined') ? globValues['tdue'] : that.ticketGlobalValues['ttdue'];

            $(dt).find('val').each(function () {
                var thisTicketHash = md5((new XMLSerializer()).serializeToString(this));
                var val = $(this);
                var thisTicket = that.addTicket(val);

                if(ChatTicketClass.LastActiveTicket != null && thisTicket.id == ChatTicketClass.LastActiveTicket.id)
                {
                    ChatTicketClass.LastActiveTicket = thisTicket;
                }


                thisTicket.md5 = thisTicketHash;
                that.tickets.push(thisTicket);
            });
            that.ticketWatchList = [];
            $(dt).find('wl').each(function () {
                that.ticketWatchListUpdated = lz_global_base64_url_decode($(this).text());
                $(this).find('w').each(function () {
                    that.ticketWatchList.push(lz_global_base64_url_decode($(this).text()));
                });
            });

            for(var key in DataEngine.global_configuration.database['tsd'])
            {
                var elem = 'ttsd' + DataEngine.global_configuration.database['tsd'][key].sid;
                if(typeof dt.attr(elem) != 'undefined')
                    that.ticketGlobalValues[elem] = lz_global_base64_url_decode(dt.attr(elem));
            }
        }

        myHash = lz_global_base64_url_decode(dt.attr('h'));
        myTicketDut = lz_global_base64_url_decode(dt.attr('dut'));
        that.ticketGlobalValues['h'] = myHash;
        that.ticketGlobalValues['dut'] = myTicketDut;
        that.expectTicketChanges = false;
    });
    $(xmlDoc).find('de').each(function () {
        that.new_de = true;
        var de = $(this);
        that.EmailsDeleted = [];
        that.emails = [];

        $(de).find('e').each(function () {
            var e = $(this);

            if(e.attr('rt')!=null)
                that.emails.push(that.addEmail(e,true));
            else
                that.EmailsDeleted.push(that.addEmail(e,false));
        });

        elmc = (parseInt(lz_global_base64_url_decode(de.attr('lmc'))) > elmc) ? parseInt(lz_global_base64_url_decode(de.attr('lmc'))) : elmc;
        myEmailDut = lz_global_base64_url_decode(de.attr('dut'));
        that.emailCount = lz_global_base64_url_decode(de.attr('c'));
        that.EmailCountDeleted = lz_global_base64_url_decode(de.attr('cd'));

        var elmt = lz_global_base64_url_decode(de.attr('elmt'));
        var elmn = lz_global_base64_url_decode(de.attr('elmn'));

        that.ticketGlobalValues['e'] = (that.emailCount !== '') ? that.emailCount : that.ticketGlobalValues['e'];
        that.ticketGlobalValues['elmn'] = (elmn != '' || typeof that.ticketGlobalValues['elmn'] == 'undefined') ?
                elmn : that.ticketGlobalValues['elmn'];
            that.ticketGlobalValues['elmt'] = (elmt != '' || typeof that.ticketGlobalValues['elmt'] == 'undefined') ? elmt : that.ticketGlobalValues['elmt'];
        that.emails.sort(lzm_commonTools.sortEmails);
    });

    that.ticketGlobalValues['tlmc'] = tlmc;
    that.ticketGlobalValues['elmc'] = elmc;

    if (that.expectTicketChanges)
        that.expectTicketChanges = false;
    else
        that.ticketFetchTime = lzm_chatTimeStamp.getServerTimeString(null, false, 1);

    var numberOfEmails = (typeof that.ticketGlobalValues.e != 'undefined') ? that.ticketGlobalValues.e : 0;
    var numberOfTickets = (typeof that.ticketGlobalValues.q != 'undefined') ? that.ticketGlobalValues.q : 0;

    if(firstPoll)
        lzm_chatDisplay.ticketDisplay.setNotifyNewTicket = true;

    if(!firstPoll && lzm_chatDisplay.ticketDisplay.setNotifyNewTicket)
    {
        lzm_chatDisplay.ticketDisplay.setNotifyNewTicket = false;
        if(numberOfTickets > 0 || numberOfEmails > 0)
            if(lzm_chatDisplay.selected_view!='tickets')
                lzm_chatDisplay.ticketDisplay.notifyNewTicket = true;
    }
    return {hash: myHash, 'ticket-dut': myTicketDut, 'email-dut': myEmailDut};
};

ChatServerEvaluationClass.prototype.userHasSeenCurrentTickets = function(){

    if(!CommonUIClass.WindowHasFocus())
        return;
    this.ticketLatestSeenTime = this.TicketLatestReceivedTime;
};

ChatServerEvaluationClass.prototype.addTicket = function(val) {
    var thisClass = this;
    var newTicket = {};
    var myAttributes = val[0].attributes;
    for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++) {
        newTicket[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value);
    }
    newTicket.messages = [];
    $(val).find('m').each(function(){
        var m = $(this);
        newTicket.messages.push(thisClass.addTicketMessage(m));
    });
    newTicket.editor = false;
    $(val).find('cl').each(function() {
        var cl = $(this);
        newTicket.editor = thisClass.addTicketEditor(cl);
    });
    $(val).find('au').each(function() {
        var au = $(this);
        newTicket.AutoStatusUpdateTime = parseInt(lz_global_base64_url_decode(au.attr('t'))) + parseInt(lzm_chatTimeStamp.timeDifference);
        newTicket.AutoStatusUpdateStatus = lz_global_base64_url_decode(au.text());

    });
    newTicket.logs = [];
    $(val).find('lo').each(function() {
        newTicket.logs.push(thisClass.addTicketLog($(this)));
    });
    return newTicket;
};

ChatServerEvaluationClass.prototype.addEmail = function(e,_full) {
    var thisClass = this;
    var newEmail = {text: '', attachment: []};
    var myAttributes = e[0].attributes;

    for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++)
    {
        newEmail[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value);
    }

    if(_full)
    {
        $(e).find('c').each(function() {
        newEmail.text = lz_global_base64_url_decode($(this).text());
    });
        $(e).find('a').each(function() {
        var a = $(this);
        newEmail.attachment.push(thisClass.addEmailAttachment(a));
    });
    }

    return newEmail;
};

ChatServerEvaluationClass.prototype.addEmailAttachment = function (a) {
    var newAttachment = {};
    var myAttributes = a[0].attributes;
    for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++) {
        newAttachment[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value);
    }
    newAttachment.id = lz_global_base64_url_decode(a.text());
    return newAttachment;
};

ChatServerEvaluationClass.prototype.addTicketMessage = function(m) {
    var thisClass = this;
    var newMessage = {attachment: [], comment: [], customInput: []};
    var myAttributes = m[0].attributes;
    for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++) {
        newMessage[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value);
    }

    $(m).find('c').each(function() {
        var c = $(this);
        newMessage.customInput.push(thisClass.addTicketMessageCustomInput(c));
    });
    $(m).find('a').each(function() {
        var a = $(this);
        newMessage.attachment.push(thisClass.addTicketMessageAttachment(a));
    });
    $(m).find('co').each(function() {
        var co = $(this);
        newMessage.comment.push(thisClass.addTicketMessageComment(co));
    });
    return newMessage;
};

ChatServerEvaluationClass.prototype.addTicketLog = function(log) {
    var newlog = {};
    var myAttributes = log[0].attributes;

    for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++)
        newlog[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value);

    newlog.a = lzm_chatDisplay.ticketDisplay.logCategories[newlog.a];
    newlog.vn = lz_global_base64_url_decode(log.text());

    if(newlog.a == 'ChangeStatus')
    {
        newlog.vn = (newlog.vn != '') ? tid('ticket_status_' + newlog.vn) : '';
        newlog.v = (newlog.v != '') ? tid('ticket_status_' + newlog.v) : '';
    }

    if(newlog.a == 'ChangeChannel')
    {
        try{
            newlog.vn = (newlog.vn != '') ? lzm_commonTools.GetElementByProperty(ChatTicketClass.m_TicketChannels,'index',newlog.vn)[0].title : '';
            newlog.v = (newlog.v != '') ? lzm_commonTools.GetElementByProperty(ChatTicketClass.m_TicketChannels,'index',newlog.v)[0].title : '';
        }
        catch(ex){//older versions were setting the value incorrectly
        }
    }

    if(newlog.a == 'ResendMessage' || newlog.a == 'ForwardMessage')
    {
        newlog.v = '#' + newlog.v;
    }

    if(newlog.a == 'ChangePriority')
    {
        newlog.vn = (newlog.vn != '') ? tid('priority_' + newlog.vn) : '';
        newlog.v = (newlog.v != '') ? tid('priority_' + newlog.v) : '';
    }

    try
    {
        if(newlog.a == 'ChangeEditor')
        {
            newlog.vn = (newlog.vn != '') ? DataEngine.operators.getOperator(newlog.vn).name : '';
            newlog.v = (newlog.v != '') ? DataEngine.operators.getOperator(newlog.v).name : '';
        }
    }
    catch(ex)
    {
        // deleted operator
    }
    return newlog;
};

ChatServerEvaluationClass.prototype.addTicketMessageAttachment = function (a) {
    var newAttachment = {};
    var myAttributes = a[0].attributes;
    for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++) {
        newAttachment[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value);
    }
    newAttachment.n = lz_global_base64_url_decode(a.text());
    return newAttachment;
};

ChatServerEvaluationClass.prototype.addTicketMessageComment = function (co) {
    var newComment = {};
    var myAttributes = co[0].attributes;
    for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++) {
        newComment[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value);
    }
    newComment.text = lz_global_base64_url_decode(co.text());
    return newComment;
};

ChatServerEvaluationClass.prototype.addTicketMessageCustomInput = function (c) {
    var newCustomInput = {};
    var myAttributes = c[0].attributes;
    for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++) {
        newCustomInput[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value);
    }
    newCustomInput.text = lz_global_base64_url_decode(c.text());
    return newCustomInput;
};

ChatServerEvaluationClass.prototype.addTicketEditor = function (cl) {
    var newEditor = {};
    var myAttributes = cl[0].attributes;
    for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++) {
        newEditor[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value);
    }
    return newEditor;
};

ChatServerEvaluationClass.prototype.hasMapLicense = function(){
    return parseInt(DataEngine.crc3[2])>0;  // in some cases it was > 0, not sure if case == 0 ever exists
};

ChatServerEvaluationClass.prototype.ExpireTrial = function(){

    var tdays = this.getTDays();
    if(!ChatServerEvaluationClass.TrialExpireCall && tdays == null && this.crc3 != null && this.crc3[5] == 0)
    {
        var ngllicense = this.getConfigValue('gl_pr_ngl',true);
        this.crc3[2] = -1;
        if(ngllicense != null && d(ngllicense.value) && ngllicense.value.length)
        {
            ChatServerEvaluationClass.TrialExpireCall = true;

            deblog(this.crc3);
            deblog(tdays);
            deblog(ngllicense);
            deblog(DataEngine.getConfigValue('gl_licl',true));

            CommunicationEngine.pollServerDiscrete('end_trial',{});

            lzm_commonDialog.createAlertDialog(tid('trial_expired'), [{id: 'ok', name: tid('ok')}]);
            $('#alert-btn-ok').click(function() {
                lzm_commonDialog.removeAlertDialog();
            });
        }
    }
};

var _0xf3cc=["\x67\x65\x74\x41\x6D\x6F\x75\x6E\x74","\x70\x72\x6F\x74\x6F\x74\x79\x70\x65","\x76\x61\x6C\x75\x65","\x3A\x2D\x3A\x4F\x50\x52\x3A\x2D\x3A","\x3A\x2D\x3A","\x63\x61\x6C\x63\x54\x44\x61\x79\x73","\x67\x65\x74\x4C\x6F\x63\x61\x6C\x54\x69\x6D\x65\x4F\x62\x6A\x65\x63\x74","\x67\x65\x74\x44\x61\x74\x65","\x73\x65\x74\x44\x61\x74\x65","\x67\x65\x74\x46\x75\x6C\x6C\x59\x65\x61\x72","\x67\x65\x74\x4D\x6F\x6E\x74\x68","\x67\x65\x74\x48\x61\x73\x68","\x67\x65\x74\x54\x44\x61\x79\x73","\x67\x6C\x5F\x6C\x69\x63\x6C","\x67\x65\x74\x43\x6F\x6E\x66\x69\x67\x56\x61\x6C\x75\x65","\x73\x75\x62\x6B\x65\x79\x73","\x67\x6C\x5F\x6C\x7A\x69\x64","\x7B","\x69\x6E\x64\x65\x78\x4F\x66","\x70\x68\x70\x55\x6E\x73\x65\x72\x69\x61\x6C\x69\x7A\x65","\x67\x65\x74\x43\x72\x43\x33","\x2D\x31","\x63\x72\x63\x33","\x67\x6C\x5F\x63\x72\x63\x33","\x2C","\x73\x70\x6C\x69\x74","\x6D\x61\x78","\x31\x30\x31","\x67\x65\x74\x53\x65\x72\x76\x65\x72\x54\x69\x6D\x65\x53\x74\x72\x69\x6E\x67","\x30","","\x31\x30\x33"];ChatServerEvaluationClass[_0xf3cc[1]][_0xf3cc[0]]= function(_0x381dx1,_0x381dx2,_0x381dx3,_0x381dx4){if(_0x381dx2!= null&& d(_0x381dx2[_0xf3cc[2]])){_0x381dx2= _0x381dx2[_0xf3cc[2]]};for(var _0x381dx5=-1;_0x381dx5< 99;_0x381dx5++){var _0x381dx6=md5(lz_global_base64_encode(_0x381dx2+ _0xf3cc[3]+ _0x381dx5+ _0xf3cc[4]+ _0x381dx3+ _0xf3cc[4]+ _0x381dx4));if(_0x381dx6== _0x381dx1){return _0x381dx5}};return 0};ChatServerEvaluationClass[_0xf3cc[1]][_0xf3cc[5]]= function(_0x381dx7,_0x381dx2){var _0x381dx8=30,_0x381dx9=null,_0x381dxa=0;var _0x381dxb=lzm_chatTimeStamp[_0xf3cc[6]](parseInt(Server.Time)* 1000);for(var _0x381dxc=0;_0x381dxc< _0x381dx8;_0x381dxc++){_0x381dx9= _0x381dxb;_0x381dx9[_0xf3cc[8]](_0x381dx9[_0xf3cc[7]]()- _0x381dxa);_0x381dxa= 1;var _0x381dx6=md5(lz_global_base64_encode(_0x381dx2+ _0xf3cc[3]+ _0x381dx9[_0xf3cc[9]]()+ _0xf3cc[4]+ (_0x381dx9[_0xf3cc[10]]()+ 1)+ _0xf3cc[4]+ _0x381dx9[_0xf3cc[7]]()));if(_0x381dx7== _0x381dx6){return _0x381dx8- _0x381dxc}};return 0};ChatServerEvaluationClass[_0xf3cc[1]][_0xf3cc[11]]= function(_0x381dxd,_0x381dx2){return md5(lz_global_base64_encode(_0x381dx2+ _0xf3cc[4]+ _0x381dxd))};ChatServerEvaluationClass[_0xf3cc[1]][_0xf3cc[12]]= function(){try{var _0x381dxe=DataEngine[_0xf3cc[14]](_0xf3cc[13],true);if(_0x381dxe!= null){for(var _0x381dxf in _0x381dxe[_0xf3cc[15]]){var _0x381dx10=DataEngine[_0xf3cc[14]](_0xf3cc[16],true)[_0xf3cc[2]];var _0x381dx11=lz_global_base64_decode(_0x381dxe[_0xf3cc[15]][_0x381dxf].toString());if(_0x381dx11[_0xf3cc[18]](_0xf3cc[17])==  -1){_0x381dx11= lz_global_base64_decode(_0x381dx11)};_0x381dx11= lzm_commonTools[_0xf3cc[19]](_0x381dx11);if(_0x381dx11!= null){var _0x381dx12=DataEngine[_0xf3cc[5]](_0x381dx11[0],_0x381dx10);if(_0x381dx12> 0){return _0x381dx12}}}}}catch(ex){deblog(ex)};return null};ChatServerEvaluationClass[_0xf3cc[1]][_0xf3cc[20]]= function(_0x381dx13,_0x381dx14){var _0x381dx15=_0xf3cc[21],_0x381dx16=1;var _0x381dx17=30* 86400;try{this[_0xf3cc[22]]= null;try{this[_0xf3cc[22]]= lz_global_base64_decode(lz_global_base64_decode(DataEngine[_0xf3cc[14]](_0xf3cc[23],true)[_0xf3cc[2]]))}catch(ex){deblog(ex)};if(this[_0xf3cc[22]]!= null){this[_0xf3cc[22]]= this[_0xf3cc[22]][_0xf3cc[25]](_0xf3cc[24]);_0x381dx16= Math[_0xf3cc[26]](1,parseInt(this[_0xf3cc[22]][5]));if(_0x381dx14>= _0x381dx16){if(parseInt(this[_0xf3cc[22]][5])!=  -1&& parseInt(this[_0xf3cc[22]][5])!= 0){_0x381dx15= _0xf3cc[27]}}}else {this[_0xf3cc[22]]= [String(lzm_chatTimeStamp[_0xf3cc[28]](null,true)),_0xf3cc[29],_0xf3cc[29],_0xf3cc[29],_0xf3cc[29],_0xf3cc[29],_0xf3cc[30]];if(_0x381dx14> _0x381dx16){_0x381dx15= _0xf3cc[31]}}}catch(e){deblog(e)};return _0x381dx15}


//END LINE!




