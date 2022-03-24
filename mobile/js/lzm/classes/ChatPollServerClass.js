/****************************************************************************************
 * LiveZilla ChatPollServerClass.js
 *
 * Copyright 2018 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/

function ChatPollServerClass(lzm_commonConfig, lzm_commonTools, lzm_chatDisplay, lzm_commonStorage, chosenProfile, userStatus) {

    this.lzm_commonConfig = lzm_commonConfig;
    this.lzm_commonTools = lzm_commonTools;
    this.lzm_chatDisplay = lzm_chatDisplay;
    this.lzm_commonStorage = lzm_commonStorage;
    this.chosenProfile = chosenProfile;

    ChatPollServerClass.__UserStatus =
    this.UserStatus = userStatus;
    this.appBackground = 0;
    this.slowDownPolling = false;
    this.errorCount = 0;
    this.lastCorrectServerAnswer = lzm_chatTimeStamp.getServerTimeString(null, false, 1);
    this.maxTimeSinceLastCorrectAnswer = 100000;
    this.serverSentLogoutResponse = false;
    this.validationErrorReceived = false;
    this.location = {latitude: null, longitude: null};
    this.qrdRequestTime = 0;
    this.ticketPage = 1;
    this.ticketTags = '';
    this.ticketQuery = '';
    this.ticketQueryUser = false;
    this.ticketMaxRead = 0;
    this.ticketReadArrayLoaded = false;
    this.ticketFilterStatus = '01';
    this.ticketFilterSubChannels = null;
    this.ticketFilterPersonal = false;
    this.ticketFilterGroup = false;
    this.ticketFilterSubStatus = null;
    this.ticketFilterGroups = null;
    this.ticketLimit = 20;
    this.ticketUpdateTimestamp = 0;
    this.resetTickets = false;
    this.emailAmount = 20;
    this.EmailAmountDeleted = 40;
    this.emailUpdateTimestamp = 0;
    this.resetEmails = false;
    this.chatUpdateTimestamp = 0;
    this.chatArchivePage = 1;
    this.chatArchiveTags = '';
    this.chatArchiveQuery = '';
    this.chatArchiveFilter = '012';
    this.chatArchiveLimit = 20;
    this.chatArchiveFilterGroup = '';
    this.chatArchiveFilterInternal = '';
    this.chatArchiveFilterExternal = '';
    this.resetChats = false;
    this.eventUpdateTimestamp = 0;
    this.resetEvents = false;
    this.resetReports = false;
    this.reportPage = 1;
    this.reportFilter = 'day';
    this.reportUpdateTimestamp = 0;
    this.filterUpdateTimeStamp = 0;
    this.lastPollTime = 0;
    this.didSaveServerVersion = false;
    this.fileUploadClient = null;
    this.customFilters = [];
    this.uploadTickets = [];
    this.SaveTicketDraft = null;
    this.OpenTicketView = null;

    if (typeof chosenProfile.login_id == 'undefined' || chosenProfile.login_id == '')
    {
        var randomHex = String(md5(String(Math.random())));
        this.loginId = randomHex.toUpperCase().substr(0,2);
        for (var i=1; i<6; i++) {
            this.loginId += '-' + randomHex.toUpperCase().substr(2*i,2);
        }
        chosenProfile.login_id = this.loginId;
    }
    else
        this.loginId = chosenProfile.login_id;

    window.name = this.loginId;

    this.poll_regularly = 0;
    this.pollCounter = 0;
    this.dataObject = {};
    this.thisUser = { id: '', b_id: '', b_chat: { id: '' } };
    this.number_of_poll = 0;
    this.pollIsActive = false;
    this.lastUserAction = lzm_chatTimeStamp.getServerTimeString(null, false, 1);
    this.userDefinedStatus = userStatus;
    this.autoSleep = false;
    this.outboundDelayedQueue = [];
    this.outboundQueue = {};
    this.sendQueue = {};
    this.typingPollCounter = 0;
    this.typingChatPartner = '';
}

ChatPollServerClass.__UserStatus = 0;
ChatPollServerClass.__UserStatusInfoText = null;

ChatPollServerClass.SetUserStatusInfoText = false;
ChatPollServerClass.ResetGeneralHash = false;
ChatPollServerClass.PollRetryTimer = null;

ChatPollServerClass.prototype.resetWebApp = function() {
    this.ticketUpdateTimestamp = 0;
    this.emailUpdateTimestamp = 0;
    this.chatUpdateTimestamp = 0;
    this.addPropertyToDataObject('p_gl_a', 'N');
    this.addPropertyToDataObject('p_gl_c', 'N');
    this.addPropertyToDataObject('p_int_d', 'N');
    this.addPropertyToDataObject('p_gl_t', 'N');
    this.addPropertyToDataObject('p_ext_f', 'N');
    this.addPropertyToDataObject('p_gl_e', 'N');
    this.addPropertyToDataObject('p_int_wp', 'N');
};

ChatPollServerClass.prototype.addToOutboundQueue = function(myKey, myValue, type, _self) {

    var that = this;
    var doPoll = false;
    _self = (d(_self)) ? _self : false;

    if(this.pollIsActive)
    {
        // queue data
        if(myKey != null)
            this.outboundDelayedQueue.push([myKey, myValue, type]);

        // retry
        if(ChatPollServerClass.PollRetryTimer == null && this.outboundDelayedQueue.length)
            ChatPollServerClass.PollRetryTimer = setTimeout(function(){
                ChatPollServerClass.PollRetryTimer = null;
                that.addToOutboundQueue(null, null, null, false);
            },500);
        return false;
    }
    else if(!_self)
    {
        // load queue data
        while(this.outboundDelayedQueue.length)
        {
            var arr = this.outboundDelayedQueue[0];
            this.addToOutboundQueue(arr[0], arr[1], arr[2], true);
            this.outboundDelayedQueue.shift();
            doPoll = true;
        }
    }

    if(myKey != null)
    {
        if (type != 'nonumber')
        {
            if (typeof this.outboundQueue[myKey] == 'undefined')
                this.outboundQueue[myKey] = [];
            this.outboundQueue[myKey].push(myValue);
        }
        else
            this.outboundQueue[myKey] = myValue;
    }

    if(doPoll)
    {
        this.InstantPoll();
        return false;
    }

    return true;
};

ChatPollServerClass.prototype.createDataFromOutboundQueue = function(dataObject) {
    var newDataObject = this.lzm_commonTools.clone(dataObject);
    this.sendQueue = lzm_commonTools.clone(this.outboundQueue);
    for (var myKey in this.sendQueue)
    {
        if (this.sendQueue.hasOwnProperty(myKey)) {
            if (typeof this.sendQueue[myKey] == 'object' && this.sendQueue[myKey] instanceof Array)
            {
                for (var i = 0; i < this.sendQueue[myKey].length; i++)
                {
                    if (typeof this.sendQueue[myKey][i] == 'string')
                    {
                        newDataObject[myKey + i] = this.sendQueue[myKey][i];
                    }
                    else if (typeof this.sendQueue[myKey][i] == 'object')
                    {
                        for (var objKey in this.sendQueue[myKey][i])
                        {
                            if(this.sendQueue[myKey][i].hasOwnProperty(objKey))
                                newDataObject[myKey + objKey + i] = this.sendQueue[myKey][i][objKey];
                        }
                    }
                }
            }
            else if (typeof this.sendQueue != 'undefined')
            {
                newDataObject[myKey] = this.sendQueue[myKey];
            }
        }
    }
    return newDataObject;
};

ChatPollServerClass.prototype.cleanOutboundQueue = function(type) {
    if (typeof type != 'undefined' && (type == 'shout' || type == 'shout2'))
    {
        var myKey, i;
        for (myKey in this.sendQueue)
        {
            if (this.sendQueue.hasOwnProperty(myKey)) {
                if (typeof this.sendQueue[myKey] != 'string')
                {
                    if (typeof this.sendQueue[myKey] != 'undefined' && this.sendQueue[myKey].length > 0)
                    {
                        for (i = 0; i < this.sendQueue[myKey].length; i++)
                        {
                            if (typeof this.sendQueue[myKey][i] == 'string')
                            {
                                this.removePropertyFromDataObject(myKey + i);
                            }
                            else if (typeof this.sendQueue[myKey][i] == 'object')
                            {
                                for (var objKey in this.sendQueue[myKey][i]) {
                                    this.removePropertyFromDataObject(myKey + objKey + i);
                                }
                            }
                        }
                    }
                }
                else
                {
                    this.removePropertyFromDataObject(myKey);
                }
            }
        }

        var tmpOutboundQueue = {};
        var outboundObjectOld = true;
        for (myKey in this.outboundQueue)
        {
            if (this.outboundQueue.hasOwnProperty(myKey))
            {
                tmpOutboundQueue[myKey] = (typeof this.outboundQueue[myKey] == 'string') ? '' : [];
                if (typeof this.outboundQueue[myKey] != 'string') {
                    if (typeof this.outboundQueue[myKey] != 'undefined' && this.outboundQueue[myKey].length > 0)
                    {
                        for (i = 0; i < this.outboundQueue[myKey].length; i++)
                        {
                            if (typeof this.sendQueue[myKey] != 'undefined')
                            {
                                if (typeof this.outboundQueue[myKey][i] == 'object')
                                {
                                    outboundObjectOld = true;
                                    for (objKey in this.outboundQueue[myKey][i])
                                    {
                                        if (this.outboundQueue[myKey][i].hasOwnProperty(objKey)) {
                                            if (typeof this.sendQueue[myKey][i] == 'undefined' || this.outboundQueue[myKey][i][objKey] != this.sendQueue[myKey][i][objKey])
                                            {
                                                outboundObjectOld = false;
                                            }
                                        }
                                    }
                                    if (!outboundObjectOld)
                                    {
                                        tmpOutboundQueue[myKey].push(this.outboundQueue[myKey][i]);
                                    }
                                }
                                else
                                {
                                    if ($.inArray(this.outboundQueue[myKey][i], this.sendQueue[myKey]) == -1)
                                    {
                                        tmpOutboundQueue[myKey].push(this.outboundQueue[myKey][i])
                                    }
                                }
                            }
                        }
                    }
                }
                else
                {
                    if (typeof this.sendQueue[myKey] != 'undefined' && this.outboundQueue[myKey] != this.sendQueue[myKey])
                    {
                        tmpOutboundQueue[myKey] = this.outboundQueue[myKey];
                    }
                }
            }
        }

        if (typeof tmpOutboundQueue != 'string')
        {
            for (myKey in tmpOutboundQueue)
            {
                if (tmpOutboundQueue.hasOwnProperty(myKey))
                {
                    if ((typeof tmpOutboundQueue[myKey] == 'string' && tmpOutboundQueue[myKey] == '') ||
                        (typeof tmpOutboundQueue[myKey] == 'object' && tmpOutboundQueue[myKey] instanceof Array && tmpOutboundQueue[myKey].length == 0)) {
                        delete tmpOutboundQueue[myKey];
                    }
                }
            }
        }

        this.outboundQueue = this.lzm_commonTools.clone(tmpOutboundQueue);
        this.sendQueue = {};
        this.pollIsActive = false;
        this.startPolling(true);
    }
    else
    {
        this.pollIsActive = false;
    }
};

ChatPollServerClass.prototype.startPolling = function(noFirstPoll,_type) {

    noFirstPoll = (typeof noFirstPoll != 'undefined') ? noFirstPoll : false;
    _type = (d(_type)) ? _type : 'regularly';

    var thisClass = this;
    var pollIntervall = (DataEngine.pollFrequency != 0) ?  (DataEngine.pollFrequency * 1000) : thisClass.lzm_commonConfig.lz_reload_interval;

    lzm_displayHelper.ShowConnectionInfo();

    if (lzm_chatTimeStamp.getServerTimeString(null, false, 1) - thisClass.lastCorrectServerAnswer > 180000)
        resetWebApp();

    if (!noFirstPoll)
        thisClass.pollServer(thisClass.fillDataObject(_type), _type);

    if (thisClass.poll_regularly)
        thisClass.stopPolling();

    if ((thisClass.appBackground == 1 || thisClass.slowDownPolling) && lzm_chatDisplay.saveConnections == 1)
        pollIntervall = 30000;

    thisClass.poll_regularly = setInterval(function () {
        thisClass.pollServer(thisClass.fillDataObject(_type), _type) }, pollIntervall);
};

ChatPollServerClass.prototype.stopPolling = function() {
    clearInterval(this.poll_regularly);
    this.poll_regularly = false;
};

ChatPollServerClass.prototype.InstantPoll = function (_resetHash) {

    _resetHash = (d(_resetHash)) ? _resetHash : false;

    if(_resetHash)
        ChatPollServerClass.ResetGeneralHash = true;

    if(!this.pollIsActive)
    {
        this.stopPolling();
        this.startPolling(false,'shout');
    }
    else
    {
        var that = this;
        setTimeout(function(){that.InstantPoll();},500);
    }
};

ChatPollServerClass.prototype.logout = function() {
    this.stopPolling();
    this.UserStatus =
    ChatPollServerClass.__UserStatus = 2;
    this.addToOutboundQueue('p_user_status', '2', 'nonumber');
    this.pollServer(this.fillDataObject(), 'logout');
};

ChatPollServerClass.prototype.PollServerResource = function(_objects, _action) {

    var thisClass = this;

    if (!thisClass.pollIsActive)
    {
        thisClass.pollIsActive = true;
        var acid = lzm_commonTools.pad(Math.floor(Math.random() * 1048575).toString(16), 5);
        var dataObject = {
            p_acid: lzm_commonTools.pad(Math.floor(Math.random() * 99999).toString(10), 5),
            p_user: CommunicationEngine.chosenProfile.login_name,
            p_request: 'intern',
            p_action: 'kb_action',
            p_loginid: CommunicationEngine.chosenProfile.login_id
        };

        if (DataEngine.token != null)
            dataObject.p_token = sha256(DataEngine.token);
        else
            dataObject.p_pass = this.chosenProfile.login_passwd;

        if(thisClass.chosenProfile.ldap == 1)
            dataObject.p_ldap = 1;

        if(_action=='set')
        {
            var list = (d(_objects.First)) ? [_objects.First] : _objects.List;
            for (var i=0; i<list.length; i++)
            {
                var resource = list[i];
                
                dataObject['p_process_resources_va_' + i] = resource.rid;
                dataObject['p_process_resources_vb_' + i] = lz_global_base64_encode(resource.text);
                dataObject['p_process_resources_vc_' + i] = resource.ty;
                dataObject['p_process_resources_vd_' + i] = lz_global_base64_encode(resource.ti);
                dataObject['p_process_resources_ve_' + i] = resource.di;
                dataObject['p_process_resources_vf_' + i] = resource.pid;
                dataObject['p_process_resources_vg_' + i] = resource.ra;
                dataObject['p_process_resources_vh_' + i] = resource.si;
                dataObject['p_process_resources_vi_' + i] = resource.t;
    
                if(d(resource.languages))
                {
                    // OLD DEPRECATED
                    dataObject['p_process_resources_vj_' + i] = resource.languages;
                    dataObject['p_process_resources_vk_' + i] = resource.isPublic;
                    dataObject['p_process_resources_vl_' + i] = resource.fullTextSearch;
                    dataObject['p_process_resources_vm_' + i] = resource.shortcutWord;
                    dataObject['p_process_resources_vn_' + i] = resource.allowBotAccess;
                }
                else
                {
                    // NEW
                    dataObject['p_process_resources_vj_' + i] = resource.l;
                    dataObject['p_process_resources_vk_' + i] = resource.p;
                    dataObject['p_process_resources_vl_' + i] = resource.f;
                    dataObject['p_process_resources_vm_' + i] = resource.s;
                    dataObject['p_process_resources_vn_' + i] = resource.ba;


                }
    
                dataObject['p_process_resources_vp_' + i] = resource.g;
                dataObject['p_process_resources_vq_' + i] = (d(resource.oid)) ? resource.oid : '';
                dataObject['p_process_resources_vs_' + i] = resource.iw;

                if(typeof resource.new_id != 'undefined' && resource.new_id.length > 5 && resource.new_id != resource.rid)
                    dataObject['p_process_resources_vo_' + i] = resource.new_id;
    
                dataObject['p_process_resources_vr_' + i] = d(resource.ok) ? resource.ok : '0';
                dataObject['p_process_resources_vt_' + i] = resource.rlta;
            }
        }
        else if(_action=='copy')
        {
            dataObject['p_process_resources_ca_0'] = _objects.First.rid;
            dataObject['p_process_resources_cb_0'] = _objects.Second.rid;
        }
        else if(_action=='cut')
        {
            dataObject['p_process_resources_xa_0'] = _objects.First.rid;
            dataObject['p_process_resources_xb_0'] = _objects.Second.rid;
        }

        var postUrl = CommunicationEngine.chosenProfile.server_protocol + CommunicationEngine.chosenProfile.server_url + '/server.php?acid=' + acid;

        $.ajax({
            type: "POST",
            url: postUrl,
            data: dataObject,
            timeout: thisClass.lzm_commonConfig.pollTimeout,
            dataType: 'text'
        }).done(function(data) {
            thisClass.evaluateServerResponse(data, null, dataObject);
            thisClass.startPolling(false);
        }).fail(function(jqXHR, textStatus, errorThrown) {

            setTimeout(function() {
                thisClass.pollIsActive = false;
                thisClass.PollServerResource(_objects, _action);
            }, 500);
        });
    }
    else
    {
        setTimeout(function() {
            thisClass.PollServerResource(_objects, _action);
        }, 500);
    }
};

ChatPollServerClass.prototype.pollServerTicket = function(tickets, emails, type, _chat, _feedback) {
    var thisClass = this, i = 0, message = '', vdCount = 0, key = 0, k = 0;
    thisClass.resetDutTickets(true);

    _chat = (d(_chat)) ? _chat : {cid: ''};

    if (!thisClass.pollIsActive)
    {
        thisClass.stopPolling();
        thisClass.pollIsActive = true;
        var acid = lzm_commonTools.pad(Math.floor(Math.random() * 1048575).toString(16), 5);
        var ticketDataObject = lzm_commonTools.clone(thisClass.fillDataObject());
        ticketDataObject['p_dut_t'] = 0;
        var count=0;

        for (key in tickets)
        {
            var ticket = tickets[key];
            if (type == 'save-details')
            {
                ticketDataObject['p_ta_' + count + '_vc'] = 'SetTicketStatus';
                ticketDataObject['p_ta_' + count + '_va'] = ticket.id;
                ticketDataObject['p_ta_' + count + '_vb'] = ticket.ne;
                ticketDataObject['p_ta_' + count + '_vd_0'] = ticket.ns;
                ticketDataObject['p_ta_' + count + '_vd_1'] = ticket.ng;
                ticketDataObject['p_ta_' + count + '_vd_2'] = ticket.os;
                ticketDataObject['p_ta_' + count + '_vd_3'] = ticket.oe;
                ticketDataObject['p_ta_' + count + '_vd_4'] = ticket.og;
                ticketDataObject['p_ta_' + count + '_vt'] = ticket.nch;
                ticketDataObject['p_ta_' + count + '_vs'] = ticket.ss;
                ticketDataObject['p_ta_' + count + '_vu'] = ticket.sc;
                ticketDataObject['p_ta_' + count + '_vv'] = ticket.vv;
                ticketDataObject['p_ta_' + count + '_vw'] = ticket.vw;
                ticketDataObject['p_ta_' + count + '_vyx'] = ticket.vyx;

                ticketDataObject['p_ta_' + (count+1) + '_vc'] = 'SetTicketLanguage';
                ticketDataObject['p_ta_' + (count+1) + '_vd_0'] = ticket.id;
                ticketDataObject['p_ta_' + (count+1) + '_vd_1'] = ticket.nl;
                ticketDataObject['p_ta_' + (count+1) + '_vd_2'] = ticket.ol;

                if (ticket.mc != '')
                {
                    ticketDataObject['p_ta_' + (count+2) + '_vc'] = 'EditMessage';
                    ticketDataObject['p_ta_' + (count+2) + '_vd_0'] = ticket.mc.mid;
                    ticketDataObject['p_ta_' + (count+2) + '_vd_1'] = ticket.mc.tid;
                    ticketDataObject['p_ta_' + (count+2) + '_vd_2'] = ticket.mc.n;
                    ticketDataObject['p_ta_' + (count+2) + '_vd_3'] = ticket.mc.e;
                    ticketDataObject['p_ta_' + (count+2) + '_vd_ecc'] = ticket.mc.ecc;
                    ticketDataObject['p_ta_' + (count+2) + '_vd_ebcc'] = ticket.mc.ebcc;
                    ticketDataObject['p_ta_' + (count+2) + '_vd_4'] = ticket.mc.c;
                    ticketDataObject['p_ta_' + (count+2) + '_vd_5'] = ticket.mc.p;
                    ticketDataObject['p_ta_' + (count+2) + '_vd_6'] = ticket.mc.s;

                    if(d(ticket.mc.t) && ticket.mc.t.length)
                        ticketDataObject['p_ta_' + (count+2) + '_vd_7'] = ticket.mc.t;

                    for (i=0; i<10; i++)
                        ticketDataObject['p_ta_' + (count+2) + '_vd_' + (8 + i)] = '';
                    for (i=0; i<ticket.mc.custom.length; i++)
                        ticketDataObject['p_ta_' + (count+2) + '_vd_' + (8 + i)] = '[cf' + ticket.mc.custom[i].id + ']' + lz_global_base64_encode(ticket.mc.custom[i].value.toString());
                }
            }
            else if (type == 'send-message')
            {
                ticketDataObject['p_ta_' + count + '_va'] = ticket.id;
                ticketDataObject['p_ta_' + count + '_vb'] = ticket.ed;
                ticketDataObject['p_ta_' + count + '_vc'] = 'AddTicketEditorReply';
                ticketDataObject['p_ta_' + count + '_vd_0'] = ticket.me;
                ticketDataObject['p_ta_' + count + '_vd_1'] = ticket.mehtml;
                ticketDataObject['p_ta_' + count + '_vd_2'] = ticket.rec;
                ticketDataObject['p_ta_' + count + '_vd_3'] = ticket.lg;
                ticketDataObject['p_ta_' + count + '_vd_4'] = ticket.gr;
                ticketDataObject['p_ta_' + count + '_vd_5'] = ticket.su;
                ticketDataObject['p_ta_' + count + '_vd_6'] = ticket.pmid;
                ticketDataObject['p_ta_' + count + '_vd_7'] = ticket.mid;
                ticketDataObject['p_ta_' + count + '_vd_ecc'] = ticket.cc;
                ticketDataObject['p_ta_' + count + '_vd_ebcc'] = ticket.bcc;
                ticketDataObject['p_ta_' + count + '_newst'] = ticket.newstatus;

                if (ticket.attachments.length > 0)
                {
                    for (i=0; i<ticket.attachments.length; i++)
                    {
                        ticketDataObject['p_ta_' + count + '_vd_' + (8 + i)] = ticket.attachments[i].rid;
                    }
                }

                if (ticket.comment != '')
                {
                    count++;
                    ticketDataObject['p_ta_' + count + '_vc'] = 'AddComment';
                    ticketDataObject['p_ta_' + count + '_vd_0'] = ticket.id;
                    ticketDataObject['p_ta_' + count + '_vd_1'] = ticket.mid;
                    ticketDataObject['p_ta_' + count + '_vd_2'] = ticket.comment;
                }
            }
            else if (type == 'new-ticket')
            {
                var tempId = md5(Math.random().toString());
                message = ticket.nm.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n/g, '\r\n');
                ticketDataObject['p_ta_' + count + '_vc'] = 'CreateTicket';
                ticketDataObject['p_ta_' + count + '_vd_0'] = ticket.nn;
                ticketDataObject['p_ta_' + count + '_vd_1'] = ticket.nem;
                ticketDataObject['p_ta_' + count + '_vd_2'] = lz_global_base64_encode(message);
                ticketDataObject['p_ta_' + count + '_vd_3'] = ticket.nch;
                ticketDataObject['p_ta_' + count + '_vd_4'] = md5(Math.random().toString());
                ticketDataObject['p_ta_' + count + '_vd_5'] = md5(Math.random().toString());
                ticketDataObject['p_ta_' + count + '_vd_6'] = ticket.ng;
                ticketDataObject['p_ta_' + count + '_vd_7'] = ticket.nc;
                ticketDataObject['p_ta_' + count + '_vd_8'] = ticket.np;

                if (_feedback != null)
                    ticketDataObject['p_ta_' + count + '_vd_9'] = 5;
                else
                    ticketDataObject['p_ta_' + count + '_vd_9'] = 4;

                ticketDataObject['p_ta_' + count + '_vd_10'] = ticket.nl;
                ticketDataObject['p_ta_' + count + '_vd_11'] = tempId;
                ticketDataObject['p_ta_' + count + '_vd_12'] = ticket.ns;
                ticketDataObject['p_ta_' + count + '_vd_13'] = ticket.ne;
                ticketDataObject['p_ta_' + count + '_vd_14'] = ticket.ng;
                ticketDataObject['p_ta_' + count + '_vd_15'] = ticket.sub;
                ticketDataObject['p_ta_' + count + '_vd_16'] = '';
                ticketDataObject['p_ta_' + count + '_vd_17'] = '';
                ticketDataObject['p_ta_' + count + '_vd_18'] = '';
                ticketDataObject['p_ta_' + count + '_vd_19'] = '';
                ticketDataObject['p_ta_' + count + '_vd_20'] = '';
                ticketDataObject['p_ta_' + count + '_vd_21'] = '';
                ticketDataObject['p_ta_' + count + '_vd_22'] = '';
                ticketDataObject['p_ta_' + count + '_vd_23'] = '';
                ticketDataObject['p_ta_' + count + '_vd_24'] = '';
                ticketDataObject['p_ta_' + count + '_vd_25'] = '';
                ticketDataObject['p_ta_' + count + '_vt'] = ticket.nch;
                ticketDataObject['p_ta_' + count + '_vs'] = ticket.ss;
                ticketDataObject['p_ta_' + count + '_vu'] = ticket.sc;
                ticketDataObject['p_ta_' + count + '_vv'] = ticket.vv;
                ticketDataObject['p_ta_' + count + '_vw'] = ticket.vw;
                ticketDataObject['p_ta_' + count + '_vx'] = ticket.vx;

                if(d(ticket.vy))
                    ticketDataObject['p_ta_' + count + '_vy'] = ticket.vy;

                if(d(ticket.vyx))
                    ticketDataObject['p_ta_' + count + '_vyx'] = ticket.vyx;

                if(d(ticket.vyy))
                    ticketDataObject['p_ta_' + count + '_vyy'] = ticket.vyy;

                if(d(ticket.vyz))
                    ticketDataObject['p_ta_' + count + '_vyz'] = ticket.vyz;

                if(d(ticket.vz))
                    ticketDataObject['p_ta_' + count + '_vz'] = ticket.vz;

                if(d(ticket.vzy))
                    ticketDataObject['p_ta_' + count + '_vzy'] = ticket.vzy;

                vdCount = 26;

                if (typeof ticket.at != 'undefined')
                {
                    for (i=0; i<ticket.at.length; i++)
                    {
                        ticketDataObject['p_ta_' + count + '_vd_' + vdCount] = '[att]' + lz_global_base64_encode(ticket.at[i].rid);
                        vdCount++;
                    }
                }
                if (d(ticket.co))
                    for (i=0; i<ticket.co.length; i++)
                    {
                        ticketDataObject['p_ta_' + count + '_vd_' + vdCount] = '[com]' + lz_global_base64_encode(ticket.co[i].text);
                        vdCount++;
                    }

                if (typeof ticket.cf != 'undefined')
                    for (key in ticket.cf)
                        if (ticket.cf.hasOwnProperty(key) && parseInt(key) < 111)
                            ticketDataObject['p_ta_' + count + '_vd_' + (16 + parseInt(key))] = '[cf' + key + ']' + lz_global_base64_encode(ticket.cf[key]);
            }
            else if (type == 'add-comment')
            {
                var comment = ticket.text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n/g, '\r\n');
                ticketDataObject['p_ta_' + count + '_vc'] = 'AddComment';
                ticketDataObject['p_ta_' + count + '_vd_0'] = ticket.id;
                ticketDataObject['p_ta_' + count + '_vd_1'] = ticket.mid;
                ticketDataObject['p_ta_' + count + '_vd_2'] = comment;
            }
            else if (type == 'forward-to')
            {
                message = ticket.text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n/g, '\r\n');
                ticketDataObject['p_ta_' + count + '_vc'] = 'ForwardMessage';
                ticketDataObject['p_ta_' + count + '_vd_0'] = ticket.mid;
                ticketDataObject['p_ta_' + count + '_vd_1'] = ticket.gr;
                ticketDataObject['p_ta_' + count + '_vd_2'] = ticket.em.replace(/, +/g, ',');
                ticketDataObject['p_ta_' + count + '_vd_3'] = ticket.su;
                ticketDataObject['p_ta_' + count + '_vd_4'] = message;
                ticketDataObject['p_ta_' + count + '_vd_5'] = ticket.id;
            }
            else if (type == 'resend')
            {
                message = ticket.text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n/g, '\r\n');
                ticketDataObject['p_ta_' + count + '_vc'] = 'ResendMessage';
                ticketDataObject['p_ta_' + count + '_vd_0'] = ticket.mid;
                ticketDataObject['p_ta_' + count + '_vd_1'] = ticket.gr;
                ticketDataObject['p_ta_' + count + '_vd_2'] = ticket.em.replace(/, +/g, ',');
                ticketDataObject['p_ta_' + count + '_vd_3'] = ticket.su;
                ticketDataObject['p_ta_' + count + '_vd_4'] = message;
                ticketDataObject['p_ta_' + count + '_vd_5'] = ticket.id;
            }
            else if (type == 'move-message')
            {
                ticketDataObject['p_ta_' + count + '_vc'] = 'MoveMessageIntoTicket';
                ticketDataObject['p_ta_' + count + '_vd_0'] = ticket.id;
                ticketDataObject['p_ta_' + count + '_vd_1'] = ticket.mid;
                ticketDataObject['p_ta_' + count + '_vd_2'] = '';
                ticketDataObject['p_ta_' + count + '_vd_3'] = ticket.copy ? 1 : 0;
            }
            else if (type == 'delete-ticket')
            {
                ticketDataObject['p_ta_' + count + '_vc'] = 'DeleteTicketFromServer';
                ticketDataObject['p_ta_' + count + '_vd_0'] = ticket.id;
            }
            else if (type == 'add-to-watch-list')
            {
                ticketDataObject['p_ta_' + count + '_vc'] = 'AddToWatchList';
                ticketDataObject['p_ta_' + count + '_vd_0'] = ticket.id;
                ticketDataObject['p_ta_' + count + '_vd_1'] = ticket.operatorId;
            }
            else if (type == 'remove-from-watch-list')
            {
                ticketDataObject['p_ta_' + count + '_vc'] = 'RemoveFromWatchList';
                ticketDataObject['p_ta_' + count + '_vd_0'] = ticket.id;
            }
            else if (type == 'set-priority')
            {
                ticketDataObject['p_ta_' + count + '_vc'] = 'SetPriority';
                ticketDataObject['p_ta_' + count + '_vd_0'] = ticket.id;
                ticketDataObject['p_ta_' + count + '_vd_1'] = ticket.priority;

            }
            count++;
        }
        if (emails.length > 0)
        {
            for (i=0; i<emails[0].length; i++)
            {
                ticketDataObject['p_ta_' + count + '_vc'] = 'SetEmailStatus';
                ticketDataObject['p_ta_' + count + '_vd_0'] = emails[0][i].id;
                ticketDataObject['p_ta_' + count + '_vd_1'] = d(emails[0][i].status) ? emails[0][i].status : '';
                ticketDataObject['p_ta_' + count + '_vd_2'] = d(emails[0][i].editor) ? emails[0][i].editor : '';
                count++;
            }
            var ticketsHaveChanged = false;

            for (var j=0; j<emails[1].length; j++)
            {
                message = emails[1][j].text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n/g, '\r\n');
                ticketDataObject['p_ta_' + count + '_vc'] = 'CreateTicket';
                ticketDataObject['p_ta_' + count + '_vd_0'] = emails[1][j].name;
                ticketDataObject['p_ta_' + count + '_vd_1'] = emails[1][j].email;
                ticketDataObject['p_ta_' + count + '_vd_2'] = lz_global_base64_encode(message);
                ticketDataObject['p_ta_' + count + '_vd_3'] = emails[1][j].channel;
                ticketDataObject['p_ta_' + count + '_vd_4'] = emails[1][j].cid;
                ticketDataObject['p_ta_' + count + '_vd_5'] = md5(Math.random().toString());
                ticketDataObject['p_ta_' + count + '_vd_6'] = emails[1][j].group;
                ticketDataObject['p_ta_' + count + '_vd_7'] = emails[1][j].company;
                ticketDataObject['p_ta_' + count + '_vd_8'] = emails[1][j].phone;
                ticketDataObject['p_ta_' + count + '_vd_9'] = 3;
                ticketDataObject['p_ta_' + count + '_vd_10'] = emails[1][j].language;
                ticketDataObject['p_ta_' + count + '_vd_11'] = md5(Math.random().toString());
                ticketDataObject['p_ta_' + count + '_vd_12'] = emails[1][j].status;
                ticketDataObject['p_ta_' + count + '_vd_13'] = emails[1][j].editor;
                ticketDataObject['p_ta_' + count + '_vd_14'] = emails[1][j].group;
                ticketDataObject['p_ta_' + count + '_vd_15'] = emails[1][j].subject;
                ticketDataObject['p_ta_' + count + '_vd_16'] = '';
                ticketDataObject['p_ta_' + count + '_vd_17'] = '';
                ticketDataObject['p_ta_' + count + '_vd_18'] = '';
                ticketDataObject['p_ta_' + count + '_vd_19'] = '';
                ticketDataObject['p_ta_' + count + '_vd_20'] = '';
                ticketDataObject['p_ta_' + count + '_vd_21'] = '';
                ticketDataObject['p_ta_' + count + '_vd_22'] = '';
                ticketDataObject['p_ta_' + count + '_vd_23'] = '';
                ticketDataObject['p_ta_' + count + '_vd_24'] = '';
                ticketDataObject['p_ta_' + count + '_vd_25'] = '';
                ticketDataObject['p_ta_' + count + '_vyx'] = emails[1][j].tags;

                vdCount = 26;

                for (k=0; k<emails[1][j].attachment.length; k++) {
                    ticketDataObject['p_ta_' + count + '_vd_' + vdCount] = '[att]' +
                        lz_global_base64_encode(emails[1][j].attachment[k].id);
                    vdCount++;
                }
                for (key in emails[1][j].custom) {
                    if (emails[1][j].custom.hasOwnProperty(key) && parseInt(key) < 111) {
                        ticketDataObject['p_ta_' + count + '_vd_' + (16 + parseInt(key))] = '[cf' + key + ']' + lz_global_base64_encode(emails[1][j].custom[key]);
                    }
                }

                count++;
                ticketsHaveChanged = true;
            }
            thisClass.resetEmails = true;
        }

        var postUrl = thisClass.chosenProfile.server_protocol + thisClass.chosenProfile.server_url + '/server.php?acid=' + acid;

        try
        {
            $.ajax({
                type: "POST",
                url: postUrl,
                data: ticketDataObject,
                timeout: thisClass.lzm_commonConfig.pollTimeout,
                success: function (data) {
                    //thisClass.pollIsActive = false;
                    thisClass.evaluateServerResponse(data, null, ticketDataObject);
                    thisClass.startPolling(true);
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    setTimeout(function() {
                        thisClass.pollIsActive = false;
                        thisClass.pollServerTicket(tickets, emails, type);
                    }, 500);
                },
                dataType: 'text'
            });
        }
        catch(ex)
        {
            deblog(ex);
            deblog(ticketDataObject);
            deblog(postUrl);
        }

    }
    else
        setTimeout(function() {thisClass.pollServerTicket(tickets, emails, type, _chat);}, 500);
};

ChatPollServerClass.prototype.resetDutTickets = function(now) {
    if(now)
        lzm_chatDisplay.ticketGlobalValues['dut']=0;
    else
        this.resetTickets = true;
};

ChatPollServerClass.prototype.pollServerSpecial = function(myObject, type) {
    var key,langKey,thisClass = this;

    function __fillDataObjectSpecial(_params,_pass){

        if(thisClass.chosenProfile.ldap==1)
            _params.p_ldap = 1;

        _params.p_loginid = CommunicationEngine.chosenProfile.login_id;
        _params.p_user = CommunicationEngine.chosenProfile.login_name;
        _params.p_request = 'intern';

        if(_pass)
            _params.p_pass = CommunicationEngine.chosenProfile.login_passwd;
        else if (DataEngine.token != null)
            _params.p_token = sha256(DataEngine.token);

        return _params;
    }

    if (!thisClass.pollIsActive)
    {
        thisClass.pollIsActive = true;
        var acid = lzm_commonTools.pad(Math.floor(Math.random() * 1048575).toString(16), 5);
        var myDataObject = lzm_commonTools.clone(thisClass.fillDataObject());
        var count=0;

        switch (type)
        {
            case 'export-data':
                myDataObject = __fillDataObjectSpecial(myObject,true);
                myDataObject.p_action = 'export_data';
                break;
            case 'recalculate-report':
                myDataObject = {
                    p_upd_rep_va_0: myObject.year + '_' + myObject.month + '_' + myObject.day,
                    p_upd_rep_vb_0: 0,
                    p_upd_rep_type: 0,
                    p_st_r: myObject.time + '_' + myObject.mtime,
                    p_action: 'reports'
                };
                myDataObject = __fillDataObjectSpecial(myDataObject,false);
                break;
            case 'load-translation':
                myDataObject = {
                    p_action: 'download_translation',
                    p_int_trans_m: myObject.m,
                    p_int_trans_mo: myObject.o,
                    p_int_trans_iso: myObject.l
                };
                myDataObject = __fillDataObjectSpecial(myDataObject,true);
                break;
            case 'save-translation':
                myDataObject = {
                    p_action: 'upload_translation'
                };
                myDataObject = __fillDataObjectSpecial(myDataObject,true);
                for (langKey in myObject)
                {
                    if (myObject.hasOwnProperty(langKey))
                    {
                        myDataObject['p_trl_' + count + '_0'] = myObject[langKey].i;
                        myDataObject['p_trl_' + count + '_2'] = myObject[langKey].m;
                        myDataObject['p_trl_' + count + '_3'] = myObject[langKey].d;
                        for(key in myObject[langKey].c)
                        {
                            myDataObject['p_trl_' + count + '_d_' + key.toString()] = lz_global_base64_url_encode(myObject[langKey].c[key]);
                        }
                        count++
                    }
                }
                break;
            case 'visitor-comment':
                myDataObject['p_ca_' + count + '_va'] = 1;
                myDataObject['p_ca_' + count + '_vb'] = 1;
                myDataObject['p_ca_' + count + '_vc'] = 1;
                myDataObject['p_ca_' + count + '_vd'] = 'AddVisitorComment';
                myDataObject['p_ca_' + count + '_ve_0'] = myObject.id;
                myDataObject['p_ca_' + count + '_ve_1'] = myObject.t;
                break;
            case 'visitor-comment-remove':
                myDataObject['p_ca_' + count + '_va'] = 1;
                myDataObject['p_ca_' + count + '_vb'] = 1;
                myDataObject['p_ca_' + count + '_vc'] = 1;
                myDataObject['p_ca_' + count + '_vd'] = 'RemoveVisitorComment';
                myDataObject['p_ca_' + count + '_ve_0'] = myObject.id;
                myDataObject['p_ca_' + count + '_ve_1'] = myObject.t;
                break;
            case 'toggle-screen-sharing':
                myDataObject['p_ca_' + count + '_va'] = myObject.id;
                myDataObject['p_ca_' + count + '_vb'] = myObject.sss;
                myDataObject['p_ca_' + count + '_vd'] = 'ToggleScreenSharing';
                break;
            case 'set_visitor_details':
                myDataObject['p_ca_' + count + '_va'] = 1;
                myDataObject['p_ca_' + count + '_vd'] = 'SetVisitorDetails';
                for(key in myObject)
                    myDataObject[key] = myObject[key];
                break;
            case 'reload_emails':
                myDataObject['p_ca_' + count + '_va'] = 1;
                myDataObject['p_ca_' + count + '_vd'] = 'ReloadEmails';
                break;
            case 'visitor-filter':
                myDataObject['p_filters_va'] = myObject.creator;
                myDataObject['p_filters_vb'] = lzm_chatTimeStamp.getServerTimeString(null, true);
                myDataObject['p_filters_vc'] = myObject.editor;
                myDataObject['p_filters_vd'] = myObject.vip;
                myDataObject['p_filters_ve'] = myObject.expires;
                myDataObject['p_filters_vf'] = myObject.vid;
                myDataObject['p_filters_vg'] = myObject.fname;
                myDataObject['p_filters_vh'] = myObject.freason;
                myDataObject['p_filters_vi'] = myObject.fid;
                myDataObject['p_filters_vj'] = myObject.state;
                myDataObject['p_filters_vk'] = myObject.type;
                myDataObject['p_filters_vl'] = myObject.exertion;
                myDataObject['p_filters_vm'] = myObject.lang;
                myDataObject['p_filters_vp'] = myObject.countries;
                myDataObject['p_filters_vq'] = myObject.allow_chats;
                myDataObject['p_filters_vr'] = myObject.allow_tickets;
                myDataObject['p_filters_vs'] = myObject.allow_monitoring;
                myDataObject['p_filters_vt'] = myObject.filterType;
                myDataObject['p_filters_vu'] = myObject.email;
                myDataObject['p_filters_vv'] = myObject.subject;
                break;
            case 'dynamic-group-create':
                myDataObject['p_ca_' + count + '_va'] = myObject.myUserId;
                myDataObject['p_ca_' + count + '_vb'] = '';
                myDataObject['p_ca_' + count + '_vc'] = '';
                myDataObject['p_ca_' + count + '_vd'] = 'CreatePublicGroup';
                myDataObject['p_ca_' + count + '_ve_0'] = myObject.groupId;
                myDataObject['p_ca_' + count + '_ve_1'] = myObject.groupName;
                myDataObject['p_ca_' + count + '_ve_2'] = myObject.myId;
                break;
            case 'dynamic-group-create-add':
                myDataObject['p_ca_' + count + '_va'] = myObject.myUserId;
                myDataObject['p_ca_' + count + '_vb'] = '';
                myDataObject['p_ca_' + count + '_vc'] = '';
                myDataObject['p_ca_' + count + '_vd'] = 'CreatePublicGroup';
                myDataObject['p_ca_' + count + '_ve_0'] = myObject.groupId;
                myDataObject['p_ca_' + count + '_ve_1'] = myObject.groupName;
                myDataObject['p_ca_' + count + '_ve_2'] = myObject.myId;
                count++;
                myDataObject['p_ca_' + count + '_va'] = myObject.operatorUserId;
                myDataObject['p_ca_' + count + '_vb'] = myObject.browserId;
                myDataObject['p_ca_' + count + '_vc'] = myObject.chatId;
                myDataObject['p_ca_' + count + '_vd'] = 'JoinPublicGroup';
                myDataObject['p_ca_' + count + '_ve_0'] = myObject.groupId;
                myDataObject['p_ca_' + count + '_ve_1'] = '';
                myDataObject['p_ca_' + count + '_ve_2'] = myObject.operatorId;
                myDataObject['p_ca_' + count + '_ve_3'] = myObject.isPersistent;
                break;
            case 'remove-from-chat-archive':
                myDataObject['p_ca_' + count + '_va'] = '';
                myDataObject['p_ca_' + count + '_vb'] = '';
                myDataObject['p_ca_' + count + '_vc'] = '';
                myDataObject['p_ca_' + count + '_vd'] = 'RemoveFromChatArchive';
                myDataObject['p_ca_' + count + '_ve_0'] = myObject;
                break;
            case 'dynamic-group-delete':
                myDataObject['p_ca_' + count + '_va'] = myObject.myUserId;
                myDataObject['p_ca_' + count + '_vb'] = '';
                myDataObject['p_ca_' + count + '_vc'] = '';
                myDataObject['p_ca_' + count + '_vd'] = 'DeletePublicGroup';
                myDataObject['p_ca_' + count + '_ve_0'] = myObject.groupId;
                myDataObject['p_ca_' + count + '_ve_1'] = myObject.myId;
                break;
            case 'dynamic-group-add':
                myDataObject['p_ca_' + count + '_va'] = myObject.operatorUserId;
                myDataObject['p_ca_' + count + '_vb'] = myObject.browserId;
                myDataObject['p_ca_' + count + '_vc'] = myObject.chatId;
                myDataObject['p_ca_' + count + '_vd'] = 'JoinPublicGroup';
                myDataObject['p_ca_' + count + '_ve_0'] = myObject.groupId;
                myDataObject['p_ca_' + count + '_ve_1'] = '';
                myDataObject['p_ca_' + count + '_ve_2'] = myObject.operatorId;
                myDataObject['p_ca_' + count + '_ve_3'] = myObject.isPersistent;
                break;
            case 'dynamic-group-remove':
                myDataObject['p_ca_' + count + '_va'] = myObject.operatorUserId;
                myDataObject['p_ca_' + count + '_vb'] = '';
                myDataObject['p_ca_' + count + '_vc'] = '';
                myDataObject['p_ca_' + count + '_vd'] = 'QuitPublicGroup';
                myDataObject['p_ca_' + count + '_ve_0'] = myObject.groupId;
                myDataObject['p_ca_' + count + '_ve_1'] = myObject.operatorId;
                break;
            case 'start_overlay':
                myDataObject['p_ca_' + count + '_va'] = myObject.visitorId;
                myDataObject['p_ca_' + count + '_vb'] = myObject.browserId;
                myDataObject['p_ca_' + count + '_vc'] = '';
                myDataObject['p_ca_' + count + '_vd'] = 'StartOverlayChat';
                break;
            case 'remove_feedback':
                myDataObject['p_ca_' + count + '_va'] = myObject;
                myDataObject['p_ca_' + count + '_vd'] = 'RemoveFeedback';
                break;
            case 'set-translation':
                myDataObject['p_ca_' + count + '_va'] = myObject.visitorId;
                myDataObject['p_ca_' + count + '_vb'] = myObject.browserId;
                myDataObject['p_ca_' + count + '_vc'] = myObject.chatId;
                myDataObject['p_ca_' + count + '_vd'] = 'SetTranslation';
                myDataObject['p_ca_' + count + '_ve_0'] = myObject.chatId;
                myDataObject['p_ca_' + count + '_ve_1'] = lzm_commonTools.pad(Math.floor(Math.random()*999), 3, '0', 'l') + ',' + myObject.sourceLanguage.toUpperCase() + ',' + myObject.targetLanguage.toUpperCase();
                break;
            case 'save-goals':
                for (langKey in myObject)
                {
                    myDataObject['p_goals_va_' + count] = 1;
                    myDataObject['p_goals_vb_' + count] = myObject[langKey].id;
                    myDataObject['p_goals_vc_' + count] = myObject[langKey].desc;
                    myDataObject['p_goals_vd_' + count] = myObject[langKey].title;
                    myDataObject['p_goals_ve_' + count] = (myObject[langKey].conv) == '1' ? '1' : '0';
                    count++
                }
                if(!myObject.length)
                    myDataObject['p_goals_va_' + count] = 1;
                break;
            case 'change-password':
                myDataObject['p_pass'] = this.chosenProfile.login_passwd;
                delete myDataObject['p_token'];
                myDataObject['p_authentications_va'] = myObject.i;
                myDataObject['p_authentications_vb'] = sha256(md5(myObject.p));
                break;
            case 'take-chat':
                myDataObject['p_ca_' + count + '_va'] = myObject.v;
                myDataObject['p_ca_' + count + '_vb'] = myObject.b;
                myDataObject['p_ca_' + count + '_vc'] = myObject.c;
                myDataObject['p_ca_' + count + '_vd'] = 'TakeChat';
                myDataObject['p_ca_' + count + '_ve_0'] = d(myObject.g) ? myObject.g : '';
                myDataObject['p_ca_' + count + '_ve_1'] = myObject.o;
                myDataObject['p_ca_' + count + '_ve_2'] = myObject.a;
                break;
            case 'join-chat':
                myDataObject['p_ca_' + count + '_va'] = myObject.v;
                myDataObject['p_ca_' + count + '_vb'] = myObject.b;
                myDataObject['p_ca_' + count + '_vc'] = myObject.c;
                myDataObject['p_ca_' + count + '_vd'] = 'JoinChat';
                myDataObject['p_ca_' + count + '_ve_0'] = 1;
                break;
            case 'chat-set-tags':
                myDataObject['p_ca_' + count + '_va'] = 1;
                myDataObject['p_ca_' + count + '_vb'] = 1;
                myDataObject['p_ca_' + count + '_vc'] = 1;
                myDataObject['p_ca_' + count + '_vd'] = 'ChatSetTags';
                myDataObject['p_ca_' + count + '_ve_0'] = 1;
                myDataObject['p_ca_' + count + '_ve_1'] = myObject.chatId;
                myDataObject['p_ca_' + count + '_ve_2'] = myObject.chatTags;
                break;
            case 'join-chat-invisible':
                myDataObject['p_ca_' + count + '_va'] = myObject.v;
                myDataObject['p_ca_' + count + '_vb'] = myObject.b;
                myDataObject['p_ca_' + count + '_vc'] = myObject.c;
                myDataObject['p_ca_' + count + '_vd'] = 'JoinChatInvisible';
                myDataObject['p_ca_' + count + '_ve_0'] = 1;
                break;
            case 'leave-chat':
                myDataObject['p_ca_' + count + '_va'] = myObject.v;
                myDataObject['p_ca_' + count + '_vb'] = myObject.b;
                myDataObject['p_ca_' + count + '_vc'] = myObject.c;
                myDataObject['p_ca_' + count + '_vd'] = 'LeaveChat';
                break;
            case 'accept-chat':
                myDataObject['p_ca_' + count + '_va'] = myObject.v;
                myDataObject['p_ca_' + count + '_vb'] = myObject.b;
                myDataObject['p_ca_' + count + '_vc'] = myObject.i;
                myDataObject['p_ca_' + count + '_vd'] = 'AcceptChat';
                break;
            case 'set-priority':
                myDataObject['p_ca_' + count + '_va'] = myObject.v;
                myDataObject['p_ca_' + count + '_vb'] = myObject.b;
                myDataObject['p_ca_' + count + '_vc'] = myObject.i;
                myDataObject['p_ca_' + count + '_vd'] = 'SetPriority';
                myDataObject['p_ca_' + count + '_ve_0'] = myObject.p;
                break;
            case 'send-chat-transcript':
                myDataObject['p_ca_' + count + '_va'] = 1;
                myDataObject['p_ca_' + count + '_vb'] = 1;
                myDataObject['p_ca_' + count + '_vc'] = 1;
                myDataObject['p_ca_' + count + '_vd'] = 'SendChatTranscriptTo';
                myDataObject['p_ca_' + count + '_ve_0'] = myObject.em.replace(/, +/g, ',');
                myDataObject['p_ca_' + count + '_ve_1'] = myObject.cid;
                break;
            case 'website-push':
                myDataObject['p_guides_va'] = myObject.vid;
                myDataObject['p_guides_vb'] = myObject.ask;
                myDataObject['p_guides_vc'] = myObject.url;
                myDataObject['p_guides_vd'] = myObject.bid;
                myDataObject['p_guides_ve'] = myObject.text;
                myDataObject['p_guides_vf'] = myObject.gr;
                break;
            case 'link-ticket':
                myDataObject['p_ta_0_vc'] = (myObject.fo == 'ticket' && myObject.so == 'ticket') ? 'LinkTicket' : 'LinkChat';
                myDataObject['p_ta_0_vd_0'] = myObject.host_ticket_id;
                myDataObject['p_ta_0_vd_1'] = myObject.sub_ticket_id;
                break;
            case 'operator-sign-off':
                myDataObject['p_ca_' + count + '_va'] = myObject.ouid;
                myDataObject['p_ca_' + count + '_vb'] = '';
                myDataObject['p_ca_' + count + '_vc'] = '';
                myDataObject['p_ca_' + count + '_vd'] = 'OperatorSignOff';
                myDataObject['p_ca_' + count + '_ve_0'] = myObject.oid;
                break;
            case 'event':
                myDataObject = $.extend(myObject,myDataObject);
                break;
        }

        var postUrl = thisClass.chosenProfile.server_protocol + thisClass.chosenProfile.server_url + '/server.php?acid=' + acid;

        $.ajax({
            type: "POST",
            url: postUrl,
            data: myDataObject,
            timeout: thisClass.lzm_commonConfig.pollTimeout,
            dataType: 'text'
        }).done(function(data) {
            thisClass.evaluateServerResponse(data, null, myDataObject);
            thisClass.startPolling(true);
        }).fail(function(jqXHR, textStatus, errorThrown) {
            setTimeout(function() {
                thisClass.pollIsActive = false;
                thisClass.pollServerSpecial(myObject, type);
            }, 500);
        });
    }
    else
    {
        setTimeout(function() {thisClass.pollServerSpecial(myObject, type);}, 400);
    }
};

ChatPollServerClass.prototype.pollServerDiscrete = function(type,data,administrate) {
    var thisClass = this;
    var acid = lzm_commonTools.pad(Math.floor(Math.random() * 1048575).toString(16), 5);
    var myDataObject = lzm_commonTools.clone(thisClass.fillDataObject());

    if(typeof data != 'undefined' && data != null)
        myDataObject = $.extend(myDataObject,data);

    myDataObject['p_action'] = type;
    myDataObject['p_loginid'] = CommunicationEngine.chosenProfile.login_id;
    myDataObject['p_request'] = 'intern';
    myDataObject['p_user'] = CommunicationEngine.chosenProfile.login_name;
    myDataObject['p_token'] = sha256(DataEngine.token);
    myDataObject['p_acid'] = lzm_commonTools.pad(Math.floor(Math.random() * 99999).toString(10), 5);

    if(this.chosenProfile.ldap == 1)
        myDataObject['p_ldap'] = 1;

    if(typeof administrate != 'undefined' && administrate)
    {
        myDataObject['p_user'] = CommunicationEngine.chosenProfile.login_name;
        myDataObject['p_pass'] = this.chosenProfile.login_passwd;
        myDataObject['p_administrate'] = '1';
    }

    var postUrl = thisClass.chosenProfile.server_protocol + thisClass.chosenProfile.server_url + '/server.php?acid=' + acid;
    return $.ajax({
        type: "POST",
        url: postUrl,
        data: myDataObject,
        timeout: thisClass.lzm_commonConfig.pollTimeout,
        dataType: 'text'
    });
};

ChatPollServerClass.prototype.uploadFile = function(file, fileType, parentId, rank, _ticketReplyWindowId, sendToChat, _toKb, _toTicketComment, _sendToChatWindowId) {
    var thisClass = this;

    sendToChat = (typeof sendToChat != 'undefined') ? sendToChat : null;
    _ticketReplyWindowId = (typeof _ticketReplyWindowId != 'undefined') ? _ticketReplyWindowId : null;
    _toKb = (d(_toKb)) ? _toKb : null;
    _toTicketComment = (d(_toTicketComment)) ? _toTicketComment : null;
    _sendToChatWindowId = d(_sendToChatWindowId) ? _sendToChatWindowId : null;

    if (true || !thisClass.pollIsActive)
    {
        try
        {
            var postUrl = thisClass.chosenProfile.server_protocol + thisClass.chosenProfile.server_url + '/server.php';
            var formData = new FormData();
            this.fileUploadClient = new XMLHttpRequest();

            var prog = $('#file-upload-progress');
            prog.val(0);
            prog.attr('max', 100);

            formData.append("file", file);
            formData.append("p_user", thisClass.chosenProfile.login_name);
            formData.append("p_token", sha256(DataEngine.token));
            formData.append("p_filetype", fileType);
            formData.append("p_request", 'intern');
            formData.append("p_action", 'send_file');
            formData.append("p_loginid", thisClass.loginId);

            if(thisClass.chosenProfile.ldap == 1)
                formData.append("p_ldap", '1');

            if (parentId != null)
                formData.append("p_kb_parent_id", parentId);

            if (_toKb != null)
                formData.append("p_kb_fid", _toKb.uploadImageId);

            if (_toTicketComment != null)
                formData.append("p_kb_fid", _toTicketComment.uploadFileId);

            if(sendToChat != null)
            {
                var chatObj = DataEngine.ChatManager.GetChat(sendToChat.chat_partner);
                if(d(chatObj) && chatObj != null && d(chatObj.i))
                    formData.append("p_chat_id", chatObj.i);
            }

            this.fileUploadClient.onerror = function(e) {
                thisClass.pollIsActive = false;
                $('#cancel-new-qrd').removeClass('ui-disabled');
                $('#save-new-qrd').removeClass('ui-disabled');
                var errorMessage = t('An error occured while uploading the file.');
                $('#file-upload-error').html(errorMessage);
            };
            this.fileUploadClient.onload = function(e) {
                try
                {
                    thisClass.pollIsActive = false;
                    $('#file-upload-numeric').html('100%');
                    prog.val(prog.attr('max'));

                    try
                    {
                        var response = $.parseXML($.trim(thisClass.fileUploadClient.responseText));
                    }
                    catch(ex)
                    {
                        deblog(ex);
                    }
                    var resource = {ti: file.name};
                    $(response).find('response').each(function()
                    {
                        resource['rid'] = lz_global_base64_decode($(this).text());
                        $(this).children('value').each(function() {
                            resource['id'] = lz_global_base64_decode($(this).attr('id'));
                        });
                    });

                    if(!d(resource.rid))
                    {
                        deblog(thisClass.fileUploadClient.responseText);
                        $('#cancel-new-qrd').removeClass('ui-disabled');
                        return;
                    }

                    if (_ticketReplyWindowId)
                    {
                        TaskBarManager.RemoveActiveWindow();
                        TaskBarManager.Maximize(_ticketReplyWindowId);

                        var resources1 = $('#reply-placeholder-content-1').data('selected-resources');
                        var resources2 = $('#ticket-message-placeholder-content-1').data('selected-resources');
                        var resources = (typeof resources1 != 'undefined') ? resources1 : (typeof resources2 != 'undefined') ? resources2: [];
                        resources.push(resource);

                        $('#reply-placeholder-content-1').data('selected-resources', resources);
                        $('#ticket-message-placeholder-content-1').data('selected-resources', resources);

                        thisClass.lzm_chatDisplay.ticketDisplay.updateAttachmentList();
                    }
                    else if(sendToChat != null)
                    {
                        var chatObj = DataEngine.ChatManager.GetChat(sendToChat.chat_partner);
                        if (chatObj != null)
                        {
                            try
                            {
                                var downloadUrl = getQrdDownloadUrl(resource);
                                var chatMessage = '<a class="lz_chat_file" href="' + downloadUrl + '" target=_blank>';

                                if(lzm_commonTools.isImageFile(file.name))
                                    chatMessage += '<div style="width:100px;height:100px;background: url(\'' + downloadUrl + '\');background-repeat:no-repeat;background-size:contain;" ></div>';
                                else
                                    chatMessage += resource.ti;

                                chatMessage += '</a>&nbsp;';
                                SendChat(chatMessage, sendToChat.chat_partner, '', true);
                            }
                            catch(ex)
                            {
                                deblog(ex);
                            }
                        }

                        if(TaskBarManager.GetActiveWindow() != null && TaskBarManager.GetActiveWindow().DialogId == _sendToChatWindowId)
                        {
                            var cWin = TaskBarManager.GetWindowByTag(sendToChat.chat_partner);
                            if(cWin != null)
                                cWin.Maximize();
                        }

                        TaskBarManager.RemoveWindowByDialogId(_sendToChatWindowId);
                    }
                    else if(_toKb)
                        _toKb.placeImage();
                    else if(_toTicketComment)
                        ChatTicketClass.SetFileToComment(_toTicketComment);
                    else
                    {
                        TaskBarManager.RemoveActiveWindow();
                    }
                }
                catch(ex)
                {
                    deblog(ex);
                }
            };
            this.fileUploadClient.upload.onprogress = function(e) {
                var p = Math.round(100 / e.total * e.loaded);
                $('#file-upload-progress').val(p);
                $('#file-upload-numeric').html(p + '%');

                var uwindow = TaskBarManager.GetWindow(_sendToChatWindowId);
                if(uwindow != null)
                {
                    uwindow.TitleProgress = uwindow.Title + ' (' + p + '%)';
                    lzm_chatDisplay.RenderTaskBarPanel();
                }
            };
            this.fileUploadClient.onabort = function(e) {
                thisClass.pollIsActive = false;
                var abortMessage = t('Uploading the file has been canceled.');
                $('#cancel-new-qrd').removeClass('ui-disabled');
                $('#save-new-qrd').removeClass('ui-disabled');
                $('#file-upload-error').html(abortMessage);
            };
            this.fileUploadClient.open("POST", postUrl);
            this.fileUploadClient.send(formData);
        }
        catch(e)
        {
            $('#cancel-new-qrd').removeClass('ui-disabled');
            console.log(e);
        }
    }
};

ChatPollServerClass.prototype.pollServerlogin = function (serverProtocol, serverUrl, logoutOtherInstance) {
    var thisClass = this;

    logoutOtherInstance = (typeof logoutOtherInstance != 'undefined') ? logoutOtherInstance : false;
    thisClass.pollIsActive = true;
    var p_acid = this.lzm_commonTools.pad(Math.floor(Math.random() * 99999).toString(10), 5);
    var acid = this.lzm_commonTools.pad(Math.floor(Math.random() * 1048575).toString(16), 5);
    var mobile = (IFManager.IsMobileOS) ? 1 : 0;

    var loginDataObject = {
        p_user_status: thisClass.UserStatus,
        p_user: thisClass.chosenProfile.login_name,
        p_pass: thisClass.chosenProfile.login_passwd,
        p_acid: p_acid,
        p_request: 'intern',
        p_action: 'login',
        p_version: thisClass.lzm_commonConfig.lz_version,
        p_clienttime: lzm_chatTimeStamp.getServerTimeString(),
        p_web: 1,
        p_mobile: mobile,
        p_app: IFManager.IsAppFrame?1:0,
        p_app_device_id: '',
        p_loginid: thisClass.loginId
    };

    if(thisClass.chosenProfile.ldap == 1)
        loginDataObject.p_ldap = 1;

    if (IFManager.IsAppFrame)
    {
        loginDataObject.p_app_os = IFManager.AppOS;
        loginDataObject.p_app_device_id = 'LOGIN';
        loginDataObject.p_app_language = lzm_t.language;
        loginDataObject.p_app_background = 0;
    }

    if (logoutOtherInstance)
        loginDataObject.p_iso = 1;

    var postUrl = serverProtocol + serverUrl + '/server.php?acid=' + acid;

    IFManager.IFSetOperatorStatus(this.UserStatus);

    if (cookieCredentialsAreSet)
    {
        $.ajax({
            type: "POST",
            url: postUrl,
            //crossDomain: true,
            data: loginDataObject,
            timeout: thisClass.lzm_commonConfig.pollTimeout,
            success: function (data) {
                DataEngine.chosen_profile = thisClass.chosenProfile;
                DataEngine.myUserId = thisClass.chosenProfile.login_name;
                ChatPollServerClass.__UserStatus = thisClass.UserStatus;
                thisClass.lzm_chatDisplay.myLoginId = thisClass.chosenProfile.login_name;
                thisClass.lzm_chatDisplay.lzm_chatTimeStamp = DataEngine.lzm_chatTimeStamp;
                thisClass.evaluateServerResponse(data, 'login', loginDataObject);
                var waitForFirstListenPoll = 0;
                setTimeout(function() {thisClass.startPolling()}, waitForFirstListenPoll);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                if (jqXHR.statusText == 'timeout') {
                    thisClass.pollServerlogin(serverProtocol, serverUrl)
                } else {
                    try
                    {
                        deblog(postUrl);
                        deblog(loginDataObject);
                        deblog(jqXHR);
                    }
                    catch(e) {}
                    thisClass.finishLogout('error', jqXHR);
                }
            },
            dataType: 'text'
        });
    }
    else
    {
        // secure cookies or cookies deactivated
        alert("ERROR: Your login data could not be stored correctly in the cookie. Please allow cookies in your browser and disable secure/http-only cookies on your webserver.");
    }
};

ChatPollServerClass.prototype.pollServer = function (dataObject, type) {

    var thisClass = this;

    if(!d(type))
        type = 'shout';

    //type = 'regularly';

    if(!d(dataObject))
        dataObject = this.fillDataObject(type);

    var thisTimeout = (typeof DataEngine.timeoutClients != 'undefined' && DataEngine.timeoutClients != 0) ?
        DataEngine.timeoutClients * 1000 : thisClass.lzm_commonConfig.noAnswerTimeBeforeLogout;

    if (!thisClass.pollIsActive)
    {
        thisClass.pollIsActive = true;
        thisClass.pollCounter++;
        thisClass.doPoll(dataObject, type, thisTimeout);
    }
    else if (type == 'shout' || type == 'logout')
    {
        setTimeout(function () {
            thisClass.pollServer(dataObject, type)
        }, 1000);
    }
    lzm_commonStorage.autoBackup(DataEngine.myId);
};

ChatPollServerClass.prototype.doPoll = function(dataObject, type, serverTimeout) {
    var thisClass = this;

    this.maxTimeSinceLastCorrectAnswer = (typeof serverTimeout != 'undefined' && serverTimeout != 0) ? serverTimeout  : 600000;

    if (type == 'shout' || type == 'logout')
    {
        dataObject = thisClass.createDataFromOutboundQueue(dataObject);
    }

    var intervall = thisClass.lzm_chatDisplay.awayAfterTime * 60 * 1000;
    if (thisClass.lzm_chatDisplay.awayAfterTime != 0 && lzm_chatTimeStamp.getServerTimeString(null, false, 1) - this.lastUserAction >= intervall && !thisClass.autoSleep) {
        thisClass.autoSleep = true;
        thisClass.userDefinedStatus = this.UserStatus;
        thisClass.UserStatus =
        ChatPollServerClass.__UserStatus = 3;
    }

    var postUrl = thisClass.chosenProfile.server_protocol + thisClass.chosenProfile.server_url + '/server.php?acid=' +
        this.lzm_commonTools.pad(Math.floor(Math.random() * 1048575).toString(16), 5);

    if (ChatPollServerClass.ResetGeneralHash || thisClass.resetTickets || thisClass.resetEmails || thisClass.resetChats || thisClass.resetEvents || thisClass.resetReports)
    {
        dataObject.p_gl_a = 'N';
        ChatPollServerClass.ResetGeneralHash = false;
    }

    if (thisClass.resetTickets)
    {
        thisClass.resetTickets = false;
        dataObject.p_dut_t = 0;
    }

    if (thisClass.resetEmails)
    {
        thisClass.resetEmails = false;
        dataObject.p_dut_e = 0;
    }

    if (thisClass.resetChats)
    {
        thisClass.resetChats = false;
        dataObject.p_dut_c = 0;
    }

    if (thisClass.resetEvents) {
        thisClass.resetEvents = false;
        dataObject.p_dut_ev = 0;
    }

    if (thisClass.resetReports)
    {
        thisClass.resetReports = false;
        dataObject.p_dut_r = 0;
    }

    if (thisClass.SaveTicketDraft != null)
    {
        dataObject.p_std_ti = thisClass.SaveTicketDraft.TicketId;
        dataObject.p_std_tt = thisClass.SaveTicketDraft.Text;
        dataObject.p_std_tmi = thisClass.SaveTicketDraft.MessageId;
        thisClass.SaveTicketDraft = null;
    }
    else
        delete dataObject.p_std_ti;

    if (thisClass.OpenTicketView != null)
    {
        dataObject.p_rot_ti = thisClass.OpenTicketView;
        thisClass.OpenTicketView = null;
    }
    else
        delete dataObject.p_rot_ti;

    if (!this.validationErrorReceived)
    {
        $.ajax({
            type: "POST",
            url: postUrl,
            data: dataObject,
            timeout: lzm_commonConfig.pollTimeout,
            success: function (data) {
                if (type == 'logout' || type == 'logout2')
                {
                    thisClass.serverSentLogoutResponse = true;
                    thisClass.errorCount = 0;
                    thisClass.lastCorrectServerAnswer = lzm_chatTimeStamp.getServerTimeString(null, false, 1);
                    thisClass.finishLogout();
                }
                else
                {
                    thisClass.evaluateServerResponse(data, type, dataObject);
                    thisClass.number_of_poll++;
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {

                var errorType = jqXHR.statusText == 'timeout' ? 'server timeout' : 'error';

                //if(true /*jqXHR.statusText == 'timeout'*/)
                //{
                    if (type == 'logout' && lzm_chatTimeStamp.getServerTimeString(null, false, 1) - thisClass.lastCorrectServerAnswer >= thisClass.maxTimeSinceLastCorrectAnswer)
                    {
                        thisClass.finishLogout(errorType, jqXHR, postUrl);
                    }
                    else
                    {
                        if (type == 'shout' || type == 'logout')
                        {
                            setTimeout(function () {
                                thisClass.doPoll(dataObject, type, serverTimeout);
                            }, 500);
                        }
                        else
                        {
                            thisClass.stopPolling();
                            thisClass.pollIsActive = false;
                            setTimeout(function () {
                                thisClass.startPolling(true);
                            }, 5000);
                        }
                    }
            },
            dataType: 'text'
        });
    }
};

ChatPollServerClass.prototype.wakeupFromAutoSleep = function() {
    this.lastUserAction = lzm_chatTimeStamp.getServerTimeString(null, false, 1);
    if (this.autoSleep)
    {
        this.autoSleep = false;
        this.UserStatus = this.userDefinedStatus;
        ChatPollServerClass.__UserStatus = this.userDefinedStatus;
    }
};

ChatPollServerClass.prototype.fillDataObject = function (_type) {

    var i = 0;
    if (IFManager.IsAppFrame && deviceId == 0)
        deviceId = IFManager.IFLoadDeviceId();

    if (this.typingPollCounter >= 2)
    {
        this.typingChatPartner = '';
    }
    else
    {
        this.typingPollCounter++;
    }

    if (ChatPollServerClass.__UserStatus != this.UserStatus)
    {
        this.UserStatus = ChatPollServerClass.__UserStatus;
        this.userDefinedStatus = ChatPollServerClass.__UserStatus;
    }

    if (ChatPollServerClass.__UserStatusInfoText != null && ChatPollServerClass.SetUserStatusInfoText)
    {
        this.dataObject.p_user_status_text = ChatPollServerClass.__UserStatusInfoText;
        ChatPollServerClass.SetUserStatusInfoText = false;
    }
    else
        delete this.dataObject.p_user_status_text;

    var mobile = (IFManager.IsMobileOS) ? 1 : 0;

    this.dataObject.p_user_status = this.UserStatus;

    delete this.dataObject['p_groups_status'];

    while (typeof this.dataObject['p_groups_status_' + i] != 'undefined')
    {
        delete this.dataObject['p_groups_status_' + i];
        i++;
    }

    if (lzm_chatDisplay.newGroupsAway != null)
    {
        this.dataObject.p_groups_status = '1';
        for (i=0; i<lzm_chatDisplay.newGroupsAway.length; i++)
            this.dataObject['p_groups_status_' + i] = lzm_chatDisplay.newGroupsAway[i];
        lzm_chatDisplay.newGroupsAway = null;
    }

    this.dataObject.p_user = this.chosenProfile.login_name;

    if (DataEngine.token != null)
        this.dataObject.p_token = sha256(DataEngine.token);
    else
        this.dataObject.p_pass = this.chosenProfile.login_passwd;

    if(this.chosenProfile.ldap == 1)
        this.dataObject.p_ldap = 1;

    this.dataObject.p_acid = this.lzm_commonTools.pad(Math.floor(Math.random() * 99999).toString(10), 5);
    this.dataObject.p_request = 'intern';
    this.dataObject.p_action = 'listen';
    this.dataObject.p_version = this.lzm_commonConfig.lz_version;
    this.dataObject.p_clienttime = lzm_chatTimeStamp.getServerTimeString();
    this.dataObject.p_web = 1;
    this.dataObject.p_mobile = mobile;
    this.dataObject.p_app = IFManager.IsAppFrame ? 1 : 0;

    if (IFManager.IsAppFrame)
    {
        this.dataObject.p_app_os = IFManager.AppOS;
        this.dataObject.p_app_language = lzm_t.language;
        if (deviceId != 0)
        {
            this.dataObject.p_app_device_id = deviceId;
        }
        else
        {
            this.dataObject.p_app_device_id = '';
        }
        if (IFManager.AppOS == 'windows' && deviceId == "NONE")
        {
            this.dataObject.p_app_device_id = '';
        }
        this.dataObject.p_app_background = this.appBackground;
    }

    var filterParams = {};
    if(this.customFilters.length > 0){
        filterParams = this.customFilters[0];
        this.customFilters = [];
    }
    else
    {
        filterParams.chatArchivePage = this.chatArchivePage;
        filterParams.chatArchiveTags = this.chatArchiveTags;
        filterParams.chatArchiveLimit = this.chatArchiveLimit;
        filterParams.chatArchiveQuery = this.chatArchiveQuery;
        filterParams.chatArchiveFilter = this.chatArchiveFilter;
        filterParams.chatArchiveFilterExternal = '';
        filterParams.chatArchiveFilterInternal = '';
        filterParams.chatArchiveFilterGroup = '';
        filterParams.ticketPage = this.ticketPage;
        filterParams.ticketTags = this.ticketTags;
        filterParams.ticketLimit = this.ticketLimit;
        filterParams.ticketQuery = this.ticketQuery;
        filterParams.ticketQueryUser = false;
        filterParams.ticketFilterStatus = this.ticketFilterStatus;
        filterParams.ticketFilterSubStatus = this.ticketFilterSubStatus;
        filterParams.ticketFilterChannel = LocalConfiguration.FilterChannel;
        filterParams.ticketFilterSubChannels = this.ticketFilterSubChannels;
        filterParams.ticketFilterGroups = this.ticketFilterGroups;
        filterParams.ticketSort = LocalConfiguration.GetTicketSortField(this.ticketFilterSubStatus);
        filterParams.ticketSortDir = LocalConfiguration.GetTicketSortDirection(this.ticketFilterSubStatus);
        filterParams.customDemandToken = 0;
    }

    this.dataObject.p_lpsu = ChatManager.LastPostStatusUpdate;

    this.dataObject.p_ext_cl_pci = "";
    if(lzm_chatDisplay.ChatsUI.PreviewChatObj != null)
        if(DataEngine.ChatManager.CanPreview(lzm_chatDisplay.ChatsUI.PreviewChatObj.i,DataEngine.myId))
            ChatManager.DLChatMessagesList.push(lzm_chatDisplay.ChatsUI.PreviewChatObj.i);

    for(var key in ChatManager.DLChatMessagesList)
    {
        if(d(this.dataObject.p_ext_cl_pci) && this.dataObject.p_ext_cl_pci.length)
            this.dataObject.p_ext_cl_pci+=',';
        else
            this.dataObject.p_ext_cl_pci='';

        if(this.dataObject.p_ext_cl_pci.indexOf(ChatManager.DLChatMessagesList[key])==-1)
            this.dataObject.p_ext_cl_pci+= ChatManager.DLChatMessagesList[key];
    }

    if(!this.dataObject.p_ext_cl_pci.length)
        this.removePropertyFromDataObject('p_ext_cl_pci');

    ChatManager.DLChatMessagesList = [];

    this.dataObject.p_ext_rse = this.qrdRequestTime;

    if(DataEngine.ChatManager.DataUpdateTimeActive!=null)
        this.dataObject.p_ext_cla = DataEngine.ChatManager.DataUpdateTimeActive;
    if(DataEngine.ChatManager.DataUpdateTimeClosed!=null)
        this.dataObject.p_ext_clc = DataEngine.ChatManager.DataUpdateTimeClosed;

    this.dataObject.p_dt_s = filterParams.ticketSort;
    this.dataObject.p_dt_s_d = filterParams.ticketSortDir;
    this.dataObject.p_dt_p = filterParams.ticketPage;
    this.dataObject.p_dt_q = filterParams.ticketQuery;
    this.dataObject.p_dt_t = filterParams.ticketTags;

    if(filterParams.ticketQueryUser)
        this.dataObject.p_dt_q_u = 1;
    else
        this.removePropertyFromDataObject('p_dt_q_u');

    if(d(_type) && _type == 'shout')
        this.dataObject.p_shout = 1;
    else
        this.removePropertyFromDataObject('p_shout');

    if(filterParams.ticketQuery != '')
        this.dataObject.p_dt_q_ss = LocalConfiguration.TicketSearchSettings;
    else
        this.removePropertyFromDataObject('p_dt_q_ss');

    this.dataObject.p_dt_mr = this.ticketMaxRead;
    this.dataObject.p_dt_f = filterParams.ticketFilterStatus;
    this.dataObject.p_dt_fc = filterParams.ticketFilterChannel;
    this.dataObject.p_cdt = filterParams.customDemandToken;

    if (this.ticketFilterPersonal)
        this.dataObject.p_dt_fp = 1;
    else
        this.removePropertyFromDataObject('p_dt_fp');

    if (this.ticketFilterGroup)
        this.dataObject.p_dt_fg = 1;
    else
        this.removePropertyFromDataObject('p_dt_fg');

    if (this.ticketFilterWatchList)
        this.dataObject.p_dt_fwl = 1;
    else
        this.removePropertyFromDataObject('p_dt_fwl');

    if (filterParams.ticketFilterSubStatus != null)
        this.dataObject.p_dt_fss = filterParams.ticketFilterSubStatus;
    else
        this.removePropertyFromDataObject('p_dt_fss');

    if (filterParams.ticketFilterSubChannels != null)
        this.dataObject.p_dt_fsc = filterParams.ticketFilterSubChannels;
    else
        this.removePropertyFromDataObject('p_dt_fsc');

    if (filterParams.ticketFilterGroups != null)
        this.dataObject.p_dt_fgl = filterParams.ticketFilterGroups;
    else
        this.removePropertyFromDataObject('p_dt_fgl');

    this.dataObject.p_dt_l = filterParams.ticketLimit;

    this.dataObject.p_dc_p = filterParams.chatArchivePage;
    this.dataObject.p_dc_q = filterParams.chatArchiveQuery;
    this.dataObject.p_dc_f = filterParams.chatArchiveFilter;
    this.dataObject.p_dc_l = filterParams.chatArchiveLimit;
    this.dataObject.p_dc_t = filterParams.chatArchiveTags;
    this.dataObject.p_dc_fg = filterParams.chatArchiveFilterGroup;
    this.dataObject.p_dc_fe = filterParams.chatArchiveFilterExternal;
    this.dataObject.p_dc_fi = filterParams.chatArchiveFilterInternal;
    this.dataObject.p_dr_p = this.reportPage;
    this.dataObject.p_dr_t = this.reportFilter;
    this.dataObject.p_dut_ev = this.eventUpdateTimestamp;
    this.dataObject.p_dut_v = VisitorManager.DUTVisitors;
    this.dataObject.p_dut_vb_e = VisitorManager.DUTVisitorBrowserEntrance;
    this.dataObject.p_dut_vbu = VisitorManager.DUTVisitorBrowserURLs;

    if(this.pollCounter > 3)
        this.dataObject.p_dut_olu = OperatorManager.DUTLastUpdate;

    if(VisitorManager.LoadFullDataUserId != null)
    {
        this.dataObject.p_v_fd = VisitorManager.LoadFullDataUserId;
        VisitorManager.LoadFullDataUserId = null;
    }
    else
    {
        this.removePropertyFromDataObject('p_v_fd');
        this.removePropertyFromDataObject('p_v_fd_co');
    }

    this.dataObject.p_dut_t = this.ticketUpdateTimestamp;
    this.dataObject.p_dut_e = this.emailUpdateTimestamp;
    this.dataObject.p_dut_c = this.chatUpdateTimestamp;
    this.dataObject.p_dut_r = this.reportUpdateTimestamp;
    this.dataObject.p_dut_fi = this.filterUpdateTimeStamp;
    this.dataObject.p_dut_f = this.FeedbacksUpdateTimestamp;
    this.dataObject.p_loginid = this.loginId;
    this.dataObject.p_typing = this.typingChatPartner;

    this.dataObject.p_fb_l = DataEngine.feedbacksPage;
    if(lzm_chatDisplay.FeedbacksViewer != null)
        this.dataObject.p_fb_p = FeedbacksViewer.Page;

    if (DataEngine.rec_posts.length > 0)
    {
        this.dataObject.p_rec_posts = DataEngine.rec_posts.join('><');
        DataEngine.rec_posts = [];
    }
    else
    {
        delete this.dataObject.p_rec_posts;
    }

    if (this.location.latitude != null && this.location.longitude != null)
    {
        this.dataObject.p_op_lat = this.location.latitude;
        this.dataObject.p_op_lon = this.location.longitude;
    }
    return this.dataObject;
};

ChatPollServerClass.prototype.evaluateServerResponse = function (xmlString, type, pollObject) {

    this.lastPollTime = lzm_chatTimeStamp.getServerTimeString(null, true, 1000);
    startBackgroundTask();
    var i = 0, j = 0;

    var thisClass = this;

    try
    {
        if (xmlString != '')
        {
            xmlString = xmlString.replace(/\r/g, '').replace(/\n/g, '');
            var xmlDoc = $.parseXML($.trim(xmlString));
            var xmlIsLiveZillaXml = false;
            $(xmlDoc).find('livezilla_xml').each(function() {
                xmlIsLiveZillaXml = true;
            });

            if (xmlIsLiveZillaXml)
            {
                var customDemandToken = (pollObject != null && pollObject.p_cdt != 0) ? pollObject.p_cdt : false;
                thisClass.errorCount = 0;
                thisClass.lastCorrectServerAnswer = lzm_chatTimeStamp.getServerTimeString(null, false, 1);
                var disabled;
                $(xmlDoc).find('listen').each(function () {
                    var listen = $(this);
                    thisClass.dataObject.p_gl_a = lz_global_base64_url_decode(listen.attr('h'));
                    disabled = lz_global_base64_url_decode(listen.attr('disabled'));
                });

                lzm_chatDisplay.serverIsDisabled = (disabled == 1);

                var validationError = DataEngine.getValidationError(xmlDoc);
                if ($.inArray(validationError, ['-1', '1', '11', '13']) == -1)
                {
                    thisClass.validationErrorReceived = true;
                    thisClass.stopPolling();
                    thisClass.lzm_chatDisplay.logoutOnValidationError(validationError);
                }

                DataEngine.SyncTime(xmlDoc);
                DataEngine.getLogin(xmlDoc);

                if (lzm_chatDisplay.myId == '')
                    lzm_chatDisplay.myId = DataEngine.myId;

                if (lzm_chatDisplay.myName == '')
                {
                    lzm_chatDisplay.myName = DataEngine.myName;

                    $('#main-menu-avatar').css('background-image','url(\'./../picture.php?operator='+(window.CommunicationEngine.chosenProfile.login_name)+'\')');
                    $('#main-menu-panel-settings-text').html(lzm_chatDisplay.myName);
                }
                if (lzm_chatDisplay.myEmail == '')
                    lzm_chatDisplay.myEmail = DataEngine.myEmail;

                // config
                var p_gl_c = DataEngine.getGlobalConfiguration(xmlDoc);
                if (p_gl_c != '')
                    thisClass.addPropertyToDataObject('p_gl_c', p_gl_c);

                // server version
                var serverVersion = DataEngine.getServerVersion(xmlDoc);
                if (serverVersion != '' && !thisClass.didSaveServerVersion)
                {
                    thisClass.didSaveServerVersion = true;
                    lzm_commonConfig.lz_version = serverVersion;
                }

                // groups
                var p_int_d = DataEngine.GetGroups(xmlDoc);
                if (p_int_d != '')
                    thisClass.addPropertyToDataObject('p_int_d', p_int_d);

                // operators
                if(DataEngine.GetOperators(xmlDoc))
                {
                    lzm_chatDisplay.RenderChatMembers();
                }

                // errors
                DataEngine.GetErrors(xmlDoc);

                PermissionEngine.CalculatePermissions(lzm_chatDisplay.myId);

                // lcheck
                var opsOnline = DataEngine.operators.GetActiveOperators([lzm_chatDisplay.myId],false);

                validationError = DataEngine.getCrC3(DataEngine.global_configuration,opsOnline.length);

                if (validationError != -1)
                {
                    if (!CommonUIClass.LicenseMissing && !CommonUIClass.LicenseCheckPassed)
                    {
                        if(!CommonDialogClass.IsAlert)
                            setTimeout(function(){
                                if(!CommonDialogClass.IsAlert)
                                {
                                    var nameList = '<br><br><b>' + tidc('online') + '</b><br>';
                                    for(var key in opsOnline)
                                    {
                                        nameList += (key>0) ? ', ' : '';
                                        nameList += opsOnline[key].name;
                                    }

                                    var alertString1 = tid(lz_global_base64_decode('b3BlcmF0b3JfbGltaXQx'));
                                    var alertString2 = tid(lz_global_base64_decode('b3BlcmF0b3JfbGltaXQy'));
                                    var alertString3 = tid(lz_global_base64_decode('b3BlcmF0b3JfbGltaXQz'));
                                    var alertString4 = tid(lz_global_base64_decode('b3BlcmF0b3JfbGltaXQ0'));
                                    var alertString = t('<!--limit1--> <!--limit2--> <!--limit3--> <!--limit4-->',[['<!--limit1-->', alertString1], ['<!--limit2-->', alertString2], ['<!--limit3-->', alertString3], ['<!--limit4-->', alertString4]]);

                                    lzm_commonDialog.createAlertDialog(alertString + nameList, [{id: 'ok', name: tid('logout')},{id: 'ignore', name: tid('add_license')},{id: 'bx', name: tid('upgrade')}]);

                                    $('#alert-btn-ok').click(function() {
                                        lzm_chatDisplay.askBeforeUnload = false;
                                        logout(false, false);
                                        lzm_chatDisplay.validationErrorCount++;
                                        lzm_chatDisplay.alertDialogIsVisible = false;
                                    });
                                    $('#alert-btn-bx').click(function() {
                                        openLink('https://www.livezilla.net/shop/en/?action=login');
                                    });
                                    $('#alert-btn-ignore').click(function() {
                                        CommonUIClass.LicenseMissing = true;
                                        $('#chat').addClass('ui-disabled');
                                        $('#chat').css('filter','blur(8px)');
                                        lzm_commonDialog.removeAlertDialog();
                                        lzm_chatDisplay.RenderTaskBarPanel();
                                        lzm_chatDisplay.RenderViewSelectPanel();
                                        initServerConfiguration(null,'licensing');
                                    });

                                    deblog(DataEngine.crc3);
                                    deblog(validationError);
                                }
                            },1000);
                    }
                }
                else
                    CommonUIClass.LicenseCheckPassed = true;

                DataEngine.getTranslationStrings(xmlDoc);

                var p_gl_t = DataEngine.getGlobalTyping(xmlDoc);

                if (p_gl_t != '')
                    thisClass.addPropertyToDataObject('p_gl_t', p_gl_t);

                var isTypingNow = [];
                for (var glTypInd=0; glTypInd<DataEngine.global_typing.length; glTypInd++)
                    if (DataEngine.global_typing[glTypInd].tp == 1)
                        isTypingNow.push(DataEngine.global_typing[glTypInd].id);

                var ticketReturn = DataEngine.getTickets(xmlDoc, this.ticketMaxRead, customDemandToken);
                var chatArchiveReturn = DataEngine.getChats(xmlDoc, customDemandToken);

                DataEngine.ProcessVisitors(xmlDoc);
                DataEngine.ChatManager.ProcessVisitorChats(xmlDoc);

                var p_gl_e = DataEngine.getGlobalErrors(xmlDoc);
                if (p_gl_e != '')
                    thisClass.addPropertyToDataObject('p_gl_e', p_gl_e);

                var p_int_wp = DataEngine.getIntWp(xmlDoc);
                if (p_int_wp != '')
                    thisClass.addPropertyToDataObject('p_int_wp', p_int_wp);

                var eventReturn = DataEngine.getEvents(xmlDoc);
                if (eventReturn['event-dut'] != '')
                    thisClass.eventUpdateTimestamp = eventReturn['event-dut'];

                var feedbacksReturn = DataEngine.getFeedbacks(xmlDoc);
                if (feedbacksReturn['feedbacks-dut'] != '')
                {
                    thisClass.FeedbacksUpdateTimestamp = feedbacksReturn['feedbacks-dut'];

                    if(TaskBarManager.WindowExists('feedbacks_viewer_dialog') && !TaskBarManager.GetWindow('feedbacks_viewer_dialog').Minimized)
                        lzm_chatDisplay.FeedbacksViewer.UpdateViewer();
                    else if(DataEngine.feedbacksList.length)
                    {
                        if(LocalConfiguration.LastFeedback < DataEngine.feedbacksMaxCreated)
                        {
                            $('#main-menu-panel-tools-feedbacks i').addClass('icon-orange');

                            LocalConfiguration.LastFeedback = DataEngine.feedbacksMaxCreated;
                            LocalConfiguration.Save();

                            var text='',fb = DataEngine.feedbacksList[0];
                            for(key in fb.Criteria)
                                if(fb.Criteria[key].Value.length>1)
                                    text = fb.Criteria[key].Value;

                            NotificationManager.NotifyFeedback(fb.UserData.f111,text);
                        }
                    }
                }

                var filterReturn = DataEngine.getFilters(xmlDoc);

                if(DataEngine.eventList.length)
                    DataEngine.processActions(xmlDoc);

                var p_dt_h = ticketReturn['hash'];
                var p_dut_t = ticketReturn['ticket-dut'];
                var p_dut_e = ticketReturn['email-dut'];
                var p_dut_r = DataEngine.getReports(xmlDoc);
                var p_dut_fi = filterReturn.dut;

                if (p_dt_h != '')
                    thisClass.addPropertyToDataObject('p_dt_h', p_dt_h);
                if (p_dut_t != '')
                    thisClass.ticketUpdateTimestamp = p_dut_t;
                if (p_dut_e != '')
                    thisClass.emailUpdateTimestamp = p_dut_e;
                if (p_dut_r != '')
                    thisClass.reportUpdateTimestamp = p_dut_r;
                if (p_dut_fi != '')
                    thisClass.filterUpdateTimeStamp = p_dut_fi;

                DataEngine.getUsrP(xmlDoc);

                if (typeof chatArchiveReturn['dut'] != 'undefined' && chatArchiveReturn['dut'] != '')
                    thisClass.chatUpdateTimestamp = chatArchiveReturn['dut'];

                if (DataEngine.myId != '')
                {
                    // NOT HERE
                    if (thisClass.qrdRequestTime == 0)
                    {
                        thisClass.qrdRequestTime = 1;

                        LocalConfiguration.LoadKnowledgeBase();

                        var saveConnections = lzm_commonStorage.loadValue('save_connections_' + DataEngine.myId);
                        thisClass.lzm_chatDisplay.saveConnections = (saveConnections != null && saveConnections != '') ?
                            JSON.parse(saveConnections) : thisClass.lzm_chatDisplay.saveConnections;

                        var vibrateNotifications = lzm_commonStorage.loadValue('vibrate_notifications_' + DataEngine.myId);
                        thisClass.lzm_chatDisplay.vibrateNotifications = (vibrateNotifications != null && vibrateNotifications != '') ?
                            JSON.parse(vibrateNotifications) : thisClass.lzm_chatDisplay.vibrateNotifications;

                        var alertNewFilter = lzm_commonStorage.loadValue('alert_new_filter_' + DataEngine.myId);
                        lzm_chatDisplay.alertNewFilter = (alertNewFilter != null && alertNewFilter != '') ?
                            JSON.parse(alertNewFilter) : lzm_chatDisplay.alertNewFilter;
                        var ticketsRead = lzm_commonStorage.loadValue('tickets_read_' + DataEngine.myId);
                        lzm_chatDisplay.ticketReadStatusChecked = (ticketsRead != null && ticketsRead != '') ?
                            JSON.parse(ticketsRead) : lzm_chatDisplay.ticketReadStatusChecked;
                        var showOfflineOps = lzm_commonStorage.loadValue('show_offline_operators_' + DataEngine.myId);
                        lzm_chatDisplay.showOfflineOperators = (showOfflineOps != null && showOfflineOps != '') ?
                            JSON.parse(showOfflineOps) : lzm_chatDisplay.showOfflineOperators;
                        var lastPhoneProtocol = lzm_commonStorage.loadValue('last_phone_protocol_' + DataEngine.myId);
                        lzm_chatDisplay.ticketDisplay.lastPhoneProtocol = (lastPhoneProtocol != null && lastPhoneProtocol != '') ?
                            JSON.parse(lastPhoneProtocol) : lzm_chatDisplay.ticketDisplay.lastPhoneProtocol;

                        IFManager.IFSetVibrateOnNotifications(lzm_chatDisplay.vibrateNotifications);
                        LocalConfiguration.Key = DataEngine.myId;
                        LocalConfiguration.Load();

                        if (LocalConfiguration.ViewSelectArray != null && LocalConfiguration.ViewSelectArray != '' && LocalConfiguration.ShowViewSelectPanel != null && LocalConfiguration.ShowViewSelectPanel != '')
                        {
                            try
                            {

                                var keys = Object.keys(lzm_chatDisplay.allViewSelectEntries);
                                for (j=keys.length - 1; j>=0; j--)
                                {
                                    var viewSelectEntryDoesExist = false;
                                    for (i=0; i<LocalConfiguration.ViewSelectArray.length; i++)
                                    {
                                        if (typeof LocalConfiguration.ViewSelectArray[i].icon == 'undefined')
                                        {
                                            LocalConfiguration.ViewSelectArray[i].icon = '';
                                        }
                                        viewSelectEntryDoesExist = (LocalConfiguration.ViewSelectArray[i].id == keys[j]) ? true : viewSelectEntryDoesExist;
                                    }

                                    var newViewSelectEntry = {id: keys[j], name: t(lzm_chatDisplay.allViewSelectEntries[keys[j]].title),
                                        icon: lzm_chatDisplay.allViewSelectEntries[keys[j]].icon};
                                    if (!viewSelectEntryDoesExist && lzm_chatDisplay.allViewSelectEntries[keys[j]].pos == 0)
                                        LocalConfiguration.ViewSelectArray.unshift(newViewSelectEntry);
                                    else if (!viewSelectEntryDoesExist && lzm_chatDisplay.allViewSelectEntries[keys[j]].pos == 1)
                                        LocalConfiguration.ViewSelectArray.push(newViewSelectEntry);

                                    if (typeof LocalConfiguration.ShowViewSelectPanel[keys[j]] == 'undefined')
                                        LocalConfiguration.ShowViewSelectPanel[keys[j]] = 1;

                                }

                                for (j=0; j<LocalConfiguration.ViewSelectArray.length; j++)
                                {
                                    switch(LocalConfiguration.ViewSelectArray[j].id) {
                                        case 'home':
                                            LocalConfiguration.ViewSelectArray[j].name = t('Startpage');
                                            break;
                                        case 'mychats':
                                            LocalConfiguration.ViewSelectArray[j].name = t('Chats');
                                            break;
                                        case 'tickets':
                                            LocalConfiguration.ViewSelectArray[j].name = t('Tickets');
                                            break;
                                        case 'external':
                                            LocalConfiguration.ViewSelectArray[j].name = t('Visitors');
                                            break;
                                        case 'archive':
                                            LocalConfiguration.ViewSelectArray[j].name = t('Chat Archive');
                                            break;
                                        case 'internal':
                                            LocalConfiguration.ViewSelectArray[j].name = t('Operators');
                                            break;
                                        case 'qrd':
                                            LocalConfiguration.ViewSelectArray[j].name = tid('knowledgebase');
                                            break;
                                        case 'reports':
                                            LocalConfiguration.ViewSelectArray[j].name = t('Reports');
                                            break;
                                    }
                                }

                                thisClass.lzm_chatDisplay.viewSelectArray = LocalConfiguration.ViewSelectArray;
                                thisClass.lzm_chatDisplay.showViewSelectPanel = LocalConfiguration.ShowViewSelectPanel;
                            }
                            catch(e)
                            {
                                deblog(e);
                            }
                        }

                        lzm_chatDisplay.selected_view = thisClass.lzm_chatDisplay.firstVisibleView;

                        for(var key in lzm_chatDisplay.settingsDisplay.tableIds)
                        {
                            var tableId = lzm_chatDisplay.settingsDisplay.tableIds[key];

                            var columnTable = lzm_commonStorage.loadValue(tableId + '_column_tbl_' + DataEngine.myId);

                            if (columnTable != null && columnTable != '')
                                LocalConfiguration.CreateTableArray(tableId, 'general', JSON.parse(columnTable));

                            LocalConfiguration.ConfigureCustomFields(columnTable != null);
                        }

                        for (i=0; i<DataEngine.resources.length; i++)
                            DataEngine.cannedResources.setResource(DataEngine.resources[i]);

                        lzm_chatDisplay.toggleVisibility();
                    }

                    var thisQrdRequestTime = DataEngine.getResources(xmlDoc);
                    thisClass.qrdRequestTime = Math.max(thisClass.qrdRequestTime, thisQrdRequestTime);

                    if (thisClass.ticketMaxRead == 0)
                    {
                        var ticketMaxRead = thisClass.lzm_commonStorage.loadValue('ticket_max_read_time_' + DataEngine.myId);
                        ticketMaxRead = (ticketMaxRead != null && ticketMaxRead != '') ? JSON.parse(ticketMaxRead) : thisClass.ticketMaxRead;
                        thisClass.ticketMaxRead = Math.max(lzm_chatTimeStamp.getServerTimeString(null, true) - 1209600, ticketMaxRead);
                    }
                }

                if ((DataEngine.new_dt || DataEngine.new_de || customDemandToken) && !DataEngine.ticketGlobalValues['no_update'])
                    thisClass.lzm_chatDisplay.ticketDisplay.UpdateTicketList(DataEngine.tickets,DataEngine.ticketGlobalValues,thisClass.ticketPage, LocalConfiguration.GetTicketSortField(thisClass.ticketFilterStatus), LocalConfiguration.GetTicketSortDirection(thisClass.ticketFilterStatus), thisClass.ticketQuery, thisClass.ticketFilterStatus, false, pollObject);

                if (DataEngine.new_de && $('#email-list-container').length > 0)
                    thisClass.lzm_chatDisplay.ticketDisplay.UpdateEmailLists();
                else if(TaskBarManager.GetWindow('email-list') != null)
                    ChatTicketClass.EmailListUpdate = true;

                if (DataEngine.new_dr)
                    lzm_chatDisplay.reportsDisplay.createReportList();

                if (!this.ticketReadArrayLoaded)
                {
                    if(LocalConfiguration.TicketTreeCategory != 'tnFilterStatusActive')
                        ChatTicketClass.HandleTicketTreeClickEvent(LocalConfiguration.TicketTreeCategory,LocalConfiguration.TicketTreeCategoryParent,LocalConfiguration.TicketTreeCategorySubStatus,false);

                    // !! NOT HERE, integrate into LocalConfiguration !!

                    var readArray =  thisClass.lzm_commonStorage.loadValue('ticket_read_array_' + DataEngine.myId);
                    var unReadArray =  thisClass.lzm_commonStorage.loadValue('ticket_unread_array_' + DataEngine.myId);

                    var filterGroups = thisClass.lzm_commonStorage.loadValue('ticket_filter_groups_' + DataEngine.myId);
                    var filterSubChannels = thisClass.lzm_commonStorage.loadValue('ticket_filter_sub_sources_' + DataEngine.myId);
                    var emailReadArray = thisClass.lzm_commonStorage.loadValue('email_read_array_' + DataEngine.myId);
                    var acceptedChats = thisClass.lzm_commonStorage.loadValue('accepted_chats_' + DataEngine.myId);
                    var ticketFilterPersonal = thisClass.lzm_commonStorage.loadValue('ticket_filter_personal_' + DataEngine.myId);
                    var ticketFilterGroup = thisClass.lzm_commonStorage.loadValue('ticket_filter_group_' + DataEngine.myId);

                    var archiveFilter = lzm_commonStorage.loadValue('archive_filter_' + DataEngine.myId);
                    thisClass.ticketFilterPersonal = (ticketFilterPersonal != null && ticketFilterPersonal != '') ? JSON.parse(ticketFilterPersonal) : false;
                    thisClass.ticketFilterGroup = (ticketFilterGroup != null && ticketFilterGroup != '') ? JSON.parse(ticketFilterGroup) : false;
                    thisClass.lzm_chatDisplay.ticketReadArray = (readArray != null && readArray != '') ? JSON.parse(readArray) : [];
                    thisClass.lzm_chatDisplay.ticketUnreadArray = (unReadArray != null && unReadArray != '') ? JSON.parse(unReadArray) : [];
                    thisClass.lzm_chatDisplay.emailReadArray = (emailReadArray != null && emailReadArray != '') ? JSON.parse(emailReadArray) : [];
                    thisClass.ticketFilterSubChannels = filterSubChannels;

                    if(filterGroups != null)
                        thisClass.ticketFilterGroups = lz_global_base64_decode(filterGroups);

                    UserActions.acceptedChatCounter = (acceptedChats != null && acceptedChats != '') ? acceptedChats : 0;
                    thisClass.chatArchiveFilter = (archiveFilter != null && archiveFilter != '' && JSON.parse(archiveFilter) != '') ? JSON.parse(archiveFilter) : '012';
                    this.ticketReadArrayLoaded = true;
                }


                var aw = TaskBarManager.GetActiveWindow();
                if (DataEngine.new_usr_p || CommonUIClass.UpdateUserList || DataEngine.new_int_d)
                {
                    if (lzm_chatDisplay.selected_view == 'internal' && aw==null)
                        lzm_chatDisplay.CreateOperatorList();
                    else if(aw != null && aw.TypeId == 'operator-forward-selection')
                        lzm_chatDisplay.ChatForwardInvite.updateForwardOperators();
                }

                if (DataEngine.new_ext_b && lzm_chatDisplay.FilterConfiguration != null)
                    lzm_chatDisplay.FilterConfiguration.updateFilterList();

                if (DataEngine.new_ev && lzm_chatDisplay.EventConfiguration != null)
                    lzm_chatDisplay.EventConfiguration.updateEventList();

                if (DataEngine.new_dc || customDemandToken) {
                    if ($('#chat-archive-table').length == 0)
                        lzm_chatDisplay.archiveDisplay.createArchive();
                    else
                        lzm_chatDisplay.archiveDisplay.UpdateArchive(pollObject);
                }
                if (DataEngine.new_startpage.lz || DataEngine.new_startpage.ca.length > 0 ||
                    DataEngine.new_startpage.cr.length > 0)
                {
                    var spCounter = 0;
                    var createStartPage = function() {
                        if (lzm_chatDisplay.windowWidth != 0 || spCounter >= 100)
                        {
                            lzm_chatDisplay.startpageDisplay.createStartPage(DataEngine.new_startpage.lz,
                                DataEngine.new_startpage.ca, DataEngine.new_startpage.cr);
                            lzm_chatDisplay.startPageExists = true;
                            DataEngine.new_startpage = {lz: false, ca: [], cr: []};
                            spCounter = 100;
                        }
                        else
                        {
                            spCounter ++;
                            setTimeout(function() {
                                createStartPage();
                            }, 10);
                        }
                    };
                    createStartPage();
                }

                lzm_chatDisplay.createGeoTracking();
                if (DataEngine.new_trl)
                    lzm_chatDisplay.translationEditor.loadTranslationStrings(DataEngine.translationStrings.key);

                if(thisClass.pollCounter == 0)
                {
                    lzm_chatDisplay.RenderViewSelectPanel();
                    lzm_chatDisplay.UpdateViewSelectPanel();
                }

                if(thisClass.pollCounter < 3)
                {
                    lzm_chatDisplay.RenderWindowLayout(false, false);
                }

                DataEngine.new_ext_u = false;
                DataEngine.new_usr_p = false;
                DataEngine.new_ext_f = false;
                DataEngine.new_int_d = false;
                DataEngine.new_glt = false;
                DataEngine.new_ev = false;
                DataEngine.new_dt = false;
                DataEngine.new_de = false;
                DataEngine.new_dc = false;
                DataEngine.new_dr = false;
                DataEngine.new_qrd = false;
                DataEngine.new_gl_e = false;
                DataEngine.new_ext_b = false;
                DataEngine.new_trl = false;

                CommonUIClass.IsExternalAvailable = false;

                var isGroupWithOpeningHours = false;
                for (i=0; i<lzm_chatDisplay.myGroups.length; i++)
                {
                    var thisGroup = DataEngine.groups.getGroup(lzm_chatDisplay.myGroups[i]);
                    if (thisGroup != null && d(thisGroup.oh) && thisGroup.oh == '1' && d(thisGroup.external) && thisGroup.external=='1')
                        CommonUIClass.IsExternalAvailable = true;

                    if (thisGroup != null && d(thisGroup.ohs) && thisGroup.ohs.length)
                        isGroupWithOpeningHours = true;
                }

                CommonUIClass.IsOutsideOfOpeningHours = isGroupWithOpeningHours && !CommonUIClass.IsExternalAvailable;

                try
                {
                    var isTrial = lzm_displayHelper.ShowLicenseInfo();
                    if(!isTrial)
                        lzm_displayHelper.ShowOpeningHoursInfo();
                    UIRenderer.resizeMenuPanels();
                }
                catch(e)
                {
                    deblog(e);
                }

                DataEngine.ExpireTrial();

            }
            else
            {
                if (lzm_chatTimeStamp.getServerTimeString(null, false, 1) - thisClass.lastCorrectServerAnswer >= thisClass.maxTimeSinceLastCorrectAnswer)
                {
                    thisClass.stopPolling();
                    thisClass.finishLogout('parseError');
                }
                else
                    thisClass.errorCount++;
            }

            if (thisClass.ticketLimit != DataEngine.ticketGlobalValues.p)
            {
                thisClass.resetTickets = true;
            }
            if (thisClass.chatArchiveLimit != DataEngine.chatArchive.p)
            {
                thisClass.resetChats = true;
            }
        }
        else
        {
            thisClass.lastCorrectServerAnswer = lzm_chatTimeStamp.getServerTimeString(null, false, 1);
        }

        thisClass.cleanOutboundQueue(type);

        lzm_chatDisplay.showDisabledWarning();

        lzm_chatDisplay.ChatsUI.UpdateChatList();

        lzm_chatDisplay.VisitorsUI.UpdateVisitorMonitorUI();

        lzm_chatDisplay.RenderTaskBarPanel();

        //if(lzm_chatDisplay.selected_view == 'reports')
            ChatReportsClass.UpdateDashBoard();
    }
    catch(ex)
    {
        deblog(ex);
        thisClass.stopPolling();
        if (lzm_chatTimeStamp.getServerTimeString(null, false, 1) - thisClass.lastCorrectServerAnswer >= thisClass.maxTimeSinceLastCorrectAnswer)
        {
            thisClass.stopPolling();
            thisClass.finishLogout('parseError');
        }
        else
        {
            thisClass.errorCount++;
            thisClass.pollIsActive = false;
            setTimeout(function() {
                thisClass.startPolling(true);
            }, 4000);
        }
    }

    try
    {
        lzm_displayHelper.unblockUi();
    }
    catch(e)
    {
        deblog(ex);
    }
};

ChatPollServerClass.prototype.addPropertyToDataObject = function (propertyName, propertyValue) {
    this.dataObject[propertyName] = propertyValue;
};

ChatPollServerClass.prototype.removePropertyFromDataObject = function (propertyName) {
    delete this.dataObject[propertyName];
};

ChatPollServerClass.prototype.finishLogout = function(cause, jqXHR, postUrl) {
    var thisClass = this;
    this.lzm_chatDisplay.askBeforeUnload = false;
    var errorMessage = '';

    if(d(cause))
    {
        if (cause == 'server timeout')
        {
            errorMessage = t('Cannot connect to the LiveZilla Server.') +
                '\n\n' + t('You are signed off.') +
                '\n\n' + t('Further information:') +
                '\n' + t('Server timeout');
        }
        else if (cause == 'error')
        {
            if (jqXHR.status == 0)
            {
                errorMessage = t('Cannot connect to the LiveZilla Server.') +
                    '\n\n' + t('You are signed off.') +
                    '\n\n' + t('Further information:') +
                    '\n' + t('Your network is down.');
            }
            else
            {
                errorMessage = t('Cannot connect to the LiveZilla Server.') +
                    '\n\n' + t('You are signed off.') +
                    '\n\n' + t('Further information:');
                var errorDetailsMessage = (thisClass.chosenProfile.server_url != ':') ?
                    '\n' + t('The remote server has returned an error: (<!--http_error-->) <!--http_error_text-->',
                    [['<!--http_error-->',jqXHR.status],['<!--http_error_text-->',jqXHR.statusText]]) :
                    '\n' + t('An error within the application has occured.');
                errorMessage += errorDetailsMessage;
            }
        }
        else if (cause == 'parseError')
        {
            errorMessage = t('Cannot connect to the LiveZilla Server.') +
                '\n\n' + t('You are signed off.') +
                '\n\n' + t('Further information:') +
                '\n' + t('The server response had an invalid structure.') +
                '\n' + t('Either the server URL is wrong (presumably) or the server is not working properly.');
        }
    }

    var doLogout = function() {
        lzm_displayHelper.blockUi({message: null});
        if (IFManager.IsAppFrame)
        {
            if(IFManager.ExitApp)
                IFManager.IFExitApplication();
            else
                IFManager.IFOpenLoginView();
        }
        else
        {
            window.location.href = 'index.php?LOGOUT';
        }
    };

    if (errorMessage != '')
    {
        lzm_displayHelper.unblockUi();
        lzm_commonDialog.createAlertDialog(errorMessage.replace(/\n/g, '<br />'), [{id: 'ok', name: t('Ok')}]);
        $('#alert-btn-ok').click(function() {
            doLogout();
        });
    }
    else
    {
        doLogout();
    }
};

ChatPollServerClass.CheckForUpdates = function(){
    try
    {
        if(PermissionEngine.permissions.server_config != 1)
        {
            return;
        }

        if(LocalConfiguration.CheckUpdates)
        {
            var versint,lvers = lzm_commonConfig.lz_version.replace(/\./g,'');
            var uurl = 'https://www.livezilla.net/updates/?lupv=2&version=' + lvers;

            $.ajax({
                type: "GET",
                url: uurl,
                timeout: 15000,
                dataType: 'text'
            }).done(function(data)
                {
                    var xmlDoc = $.parseXML($.trim(data));
                    var notes = '',noteslist={},shown = false;

                    $(xmlDoc).find('product').each(function()
                    {
                        versint = $(this).attr('version');
                        noteslist[versint.toString()] = lz_global_base64_decode($(this).attr('notes'));
                    });

                    $(xmlDoc).find('product').each(function()
                    {
                        versint = $(this).attr('version').replace(/\./g,'');

                        if(!shown && versint > lvers && versint > LocalConfiguration.IgnoreUpdate)
                        {
                            shown = true;

                            for(var key in noteslist)
                            {
                                if(noteslist[key].length)
                                {
                                    var entries = noteslist[key].split('* ');
                                    for (var ekey in entries)
                                    {
                                        if($.trim(entries[ekey]).length)
                                            notes += '[' + key + '] ' + $.trim(entries[ekey])+'\r\n';
                                    }
                                }
                            }

                            var security = $(this).attr('critical')=='1' ? '<span class="text-xl text-red">' + tid('yes') + '</span>' : '';
                            var updateHTML = '<div style="width:650px;" class="lzm-fieldset"><div class="text-xxl bottom-space">'+tid('update_avail')+'</div><hr>';
                            updateHTML += '<div class="top-space bottom-space">' + '<span>Version:</span>&nbsp;<span class="text-xl text-blue">' + $(this).attr('version') + '</span>&nbsp;&nbsp;';

                            if(security.length)
                                updateHTML += '&nbsp;&nbsp;' + '<span>'+tidc('security')+'</span>&nbsp;'+security;

                            updateHTML += '</div>';
                            updateHTML += lzm_inputControls.createArea('up-notes',notes,'','','white-space:nowrap;height:300px');
                            updateHTML += '<br><br><br>';
                            updateHTML += lzm_inputControls.createButton('up-dl','','window.open(\'https://www.livezilla.net/downloads/en/\');lzm_commonDialog.removeAlertDialog();', 'Download', '', '', {'padding': '6px 15px', 'margin-right':'6px'}, '', 30, 'd');
                            updateHTML += lzm_inputControls.createButton('up-ignore','','ChatSettingsClass.__IgnoreUpdate(\''+versint+'\');', tid('ignore'), '', '', {'padding': '6px 15px', 'margin-right':'6px'}, '', 30, 'd');
                            updateHTML += '</div>';

                            lzm_commonDialog.createAlertDialog(updateHTML, [{id: 'close', name: tid('close')}],true,true,false);

                            $('#alert-btn-close').click(function() {
                                lzm_commonDialog.removeAlertDialog();
                            });
                        }
                    });
                }).fail(function(jqXHR, textStatus, errorThrown){});
        }
    }
    catch(ex)
    {
    }
};