function AdminPollServerClass() {
    this.serverUrl = '';
    this.globalConfig = {};
    this.loginData = {};
}

AdminPollServerClass.prototype.pollServerAdminLogin = function() {

    var that = this;
    var acid = md5(Math.random().toString()).substr(0,5);
    var pacid = md5(Math.random().toString()).substr(0,5);
    var postUrl = that.serverUrl + '/server.php?acid=' + acid;
    var loginDataObject = {
        p_ext_b: '',
        p_int_t: '',
        p_int_d: '',
        p_int_v: '',
        p_int_wp: '',
        p_gl_t: '',
        p_gl_c: '',
        p_gl_e: '',
        p_gl_a: '',
        p_acid: pacid,
        p_user: that.loginData.login,
        p_pass: that.loginData.passwd,
        p_request:'intern',
        p_action:'login',
        p_administrate: '1',
        p_loginid: that.loginData.id,
        p_version: that.loginData.version,
        p_clienttime: Math.round($.now() / 1000)
    };

    if(that.loginData.ldap == 1)
        loginDataObject.p_ldap = 1;

    $.ajax({
        type: "POST",
        url: postUrl,
        data: loginDataObject,
        dataType: 'text'
    }).done(function(data) {
        that.evaluateServerResponse(data);
    }).fail(function() {
            deblog('Failed polling admin data.')
    });
};

AdminPollServerClass.prototype.checkXmlIsValid = function(xmlString) {
    try {
        xmlString = xmlString.replace(/\r/g, '').replace(/\n/g, '');
        var xmlDoc = $.parseXML($.trim(xmlString));
        var xmlIsLiveZillaXml = false, rtValue = null;
        $(xmlDoc).find('livezilla_xml').each(function() {
            xmlIsLiveZillaXml = true;
        });
        if (xmlIsLiveZillaXml) {
            rtValue = xmlDoc;
        } else {
            rtValue = {error: 'NO_LZ_XML'}
        }
    } catch(ex) {
        rtValue = {error: '', stack: ex.stack}
    }
    return rtValue;
};

AdminPollServerClass.prototype.evaluateServerResponse = function(xmlString) {
    var that = this;
    var xmlDoc = that.checkXmlIsValid(xmlString);
    if (typeof xmlDoc.error == 'undefined')
    {
        that.readGlobalConfiguration(xmlDoc);
        lzm_serverEvaluation.readGroupData(xmlDoc);
        lzm_serverEvaluation.readUserData(xmlDoc);
        lzm_userManagement.UpdateViews(true);
    }
    else
    {
        switch (xmlDoc.error) {
            case 'NO_LZ_XML':
                deblog('No LiveZilla XML');
                break;
            case 'PARSE_ERROR':
                deblog(xmlDoc.stack);
                break;
        }
    }
};

AdminPollServerClass.prototype.readGlobalConfiguration = function(xmlDoc) {
    var that = this, globalConfig = {site: {}};
    try {
        $(xmlDoc).find('gl_c').each(function() {
            var glC = $(this);
            glC.children('conf').each(function() {
                var confObj = {value: lz_global_base64_url_decode($(this).attr('value')), sub: []};
                var confKey = lz_global_base64_url_decode($(this).attr('key'));
                var conf = $(this);
                conf.children('sub').each(function() {
                    var subObj = {};
                    var subKey = lz_global_base64_url_decode($(this).attr('key'));
                    subObj[subKey] = lz_global_base64_url_decode($(this).text());
                    confObj.sub.push(subObj);
                });
                globalConfig[confKey] = confObj;
            });
            glC.children('site').each(function() {
                var siteObj = {dbconf: {}};
                var siteIndex = lz_global_base64_url_decode($(this).attr('index'));
                var site = $(this);
                site.children('conf').each(function() {
                    var confObj = {value: lz_global_base64_url_decode($(this).attr('value')), sub: []};
                    var confKey = lz_global_base64_url_decode($(this).attr('key'));
                    var conf = $(this);
                    conf.children('sub').each(function() {
                        var subObj = {};
                        var subKey = lz_global_base64_url_decode($(this).attr('key'));
                        subObj[subKey] = lz_global_base64_url_decode($(this).text());
                        confObj.sub.push(subObj);
                    });
                    siteObj[confKey] = confObj;
                });
                site.children('db_conf').each(function() {
                    var dbconfObj = {glEmail: {}};
                    var dbconf = $(this);
                    dbconf.children('gl_email').each(function() {
                        var emObj = {};
                        var em = $(this);
                        em.children('tes').each(function() {
                            var tesObj = {};
                            var myAttributes = $(this)[0].attributes;
                            for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++) {
                                tesObj[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value);
                            }
                            emObj[tesObj.i] = tesObj;
                        });
                        dbconfObj.glEmail = emObj;
                    });
                    siteObj.dbconf = dbconfObj;
                });
                globalConfig.site[siteIndex] = siteObj;
            });
        });
        that.globalConfig = globalConfig;
    } catch(ex) {
        deblog(ex.stack);
    }
};

AdminPollServerClass.prototype.pollSave = function(myType, myObject) {
    var that = this;
    var doPoll = function() {
        var acid = md5(Math.random().toString()).substr(0,5);
        var postUrl = that.serverUrl + '/server.php?acid=' + acid;
        var dataObject = that.createSaveDataObject(myType, myObject);
        $.ajax({
            type: "POST",
            url: postUrl,
            data: dataObject,
            dataType: 'text'
        }).done(function(data) {
            if (checkServerResponse(data, 'data')) {
                //setIdle(0);
            }
        }).fail(function() {
                deblog('Failed saving admin data.');
        });
    };
    var checkServerResponse = function(xmlString, type) {
        var xmlIsValid = that.checkXmlIsValid(xmlString), rt = false;
        if (typeof xmlIsValid.error == 'undefined') {
            if (type == 'data') {
                $(xmlIsValid).find('livezilla_xml').each(function() {
                    $(this).find('value').each(function() {
                        if (lz_global_base64_decode($(this).attr('id')) == 1) {
                            rt = true;
                        }
                    });
                });
            } else if (type == 'idle') {
                $(xmlIsValid).find('livezilla_xml').each(function() {
                    rt = true;
                });
            }
            if (!rt) {
                deblog(xmlIsValid);
            }
        } else {
            deblog(xmlIsValid.error);
        }

        return rt;
    };

    doPoll();
};

AdminPollServerClass.prototype.createSaveDataObject = function(myType, myObject) {
    var that = this, i = 0, j = 0, myKey = '', myValue = '', myMode = 'save';
    var deleteSignature = '0';

    if (myType.indexOf('~') != -1) {
        myMode = myType.split('~')[1];
        myType = myType.split('~')[0];
    }

    var pacid = md5(Math.random().toString()).substr(0,5);
    var myDataObject = {
        p_acid: pacid,
        p_user: that.loginData.login,
        p_pass: that.loginData.passwd,
        p_request: 'intern',
        p_action: 'update_management',
        p_administrate: '1',
        p_loginid: that.loginData.id,
        p_upload_value: ''
    };

    if(that.loginData.ldap == 1)
        myDataObject.p_ldap = 1;

    switch (myType)
    {
        case 'role':
            myDataObject.p_roles_0_id = myObject.i;
            myDataObject.p_roles_0_name = myObject.n;
            myDataObject.p_roles_0_desc = myObject.d;
            myDataObject.p_roles_0_perm = myObject.p;

            if (myMode == 'remove')
                myDataObject.p_roles_0_delete = '1';

            break;
        case 'group':
            var group = lzm_commonTools.clone(myObject);
            var desc = {}, encGId = lz_global_base64_encode(group.id);
            for (myKey in myObject.humanReadableDescription)
                if (myObject.humanReadableDescription.hasOwnProperty(myKey))
                    desc[myKey.toUpperCase()] = myObject.humanReadableDescription[myKey];

            var ohs = [];
            for (i=0; i<myObject.ohs.length; i++)
                ohs.push([myObject.ohs[i].text, myObject.ohs[i].open, myObject.ohs[i].close]);

            var tiAssign = {}, ciHidden = [], tiHidden = [], ciRequired = [], tiRequired = [], ciMasked = {}, tiMasked = {};
            var cPriorities = {}, ciCap = {}, tiCap = {}, cSmc = [], cfunctions = '';
            for (i=0; i<group.f.length; i++) {
                switch (group.f[i].key) {
                    case 'ti_assign':
                        for (j=0; j<group.f[i].values.length; j++) {
                            tiAssign[group.f[i].values[j].key] = group.f[i].values[j].text;
                        }
                        break;
                    case 'c_prio':
                        for (j=0; j<group.f[i].values.length; j++) {
                            cPriorities[group.f[i].values[j].key] = group.f[i].values[j].text;
                        }
                        break;
                    case 'ci_hidden':
                        for (j=0; j<group.f[i].values.length; j++) {
                            ciHidden.push(group.f[i].values[j].text);
                        }
                        break;
                    case 'ti_hidden':
                        for (j=0; j<group.f[i].values.length; j++) {
                            tiHidden.push(group.f[i].values[j].text);
                        }
                        break;
                    case 'ci_mandatory':
                        for (j=0; j<group.f[i].values.length; j++) {
                            ciRequired.push(group.f[i].values[j].text);
                        }
                        break;
                    case 'ti_mandatory':
                        for (j=0; j<group.f[i].values.length; j++) {
                            tiRequired.push(group.f[i].values[j].text);
                        }
                        break;
                    case 'ci_masked':
                        for (j=0; j<group.f[i].values.length; j++) {
                            ciMasked[group.f[i].values[j].key] = group.f[i].values[j].text;
                        }
                        break;
                    case 'ti_masked':
                        for (j=0; j<group.f[i].values.length; j++) {
                            tiMasked[group.f[i].values[j].key] = group.f[i].values[j].text;
                        }
                        break;
                    case 'ci_cap':
                        for (j=0; j<group.f[i].values.length; j++) {
                            ciCap[group.f[i].values[j].key] = group.f[i].values[j].text;
                        }
                        break;
                    case 'ti_cap':
                        for (j=0; j<group.f[i].values.length; j++) {
                            tiCap[group.f[i].values[j].key] = group.f[i].values[j].text;
                        }
                        break;
                    case 'c_smc':
                        cSmc = lzm_commonTools.clone(group.f[i].values);
                        break;
                    case 'gr_ex_sm':
                    case 'gr_ex_so':
                    case 'gr_ex_pr':
                    case 'gr_ex_ra':
                    case 'gr_ex_fu':
                    case 'gr_ex_fv':
                    case 'gr_ex_ss':
                        cfunctions+=group.f[i].text;
                        break;
                }
            }

            var emIn = [];
            for (i=0; i<group.tei.length; i++)
                emIn.push(group.tei[i].id);

            var pmGeneral = '', filters = {};
            if (d(myObject.filters)) {
                for (i=0; i<myObject.filters.length; i++)
                    filters[lz_global_base64_encode(myObject.filters[i].text)] = myObject.filters[i].ex
            }
            var vouchers = [];
            if (d(group.vouchers))
                for (i=0; i<group.vouchers.length; i++)
                    vouchers.push(group.vouchers[i].id);

            myDataObject.p_groups_0_id = myObject.id;
            myDataObject.p_groups_0_external = myObject.external;
            myDataObject.p_groups_0_internal = myObject.internal;
            myDataObject.p_groups_0_description = lzm_commonTools.phpSerialize(desc, true);
            myDataObject.p_groups_0_visitor_filters = lzm_commonTools.phpSerialize(filters, false);
            myDataObject.p_groups_0_email = myObject.email;
            myDataObject.p_groups_0_standard = myObject.standard;
            myDataObject.p_groups_0_ps = myObject.ps;
            myDataObject.p_groups_0_opening_hours = lzm_commonTools.phpSerialize(ohs, false);
            myDataObject.p_groups_0_ticket_assign = lzm_commonTools.phpSerialize(tiAssign, false);
            myDataObject.p_groups_0_priorities = lzm_commonTools.phpSerialize(cPriorities, false);
            myDataObject.p_groups_0_ticket_email_out = myObject.teo;
            myDataObject.p_groups_0_functions = cfunctions;
            myDataObject.p_groups_0_chat_email_out = myObject.ceo;
            myDataObject.p_groups_0_ticket_email_in = lzm_commonTools.phpSerialize(emIn, false);
            myDataObject.p_groups_0_ticket_email_handling = group.thue;
            myDataObject.p_groups_0_chat_inputs_hidden = lzm_commonTools.phpSerialize(ciHidden, false);
            myDataObject.p_groups_0_ticket_inputs_hidden = lzm_commonTools.phpSerialize(tiHidden, false);
            myDataObject.p_groups_0_chat_inputs_required = lzm_commonTools.phpSerialize(ciRequired, false);
            myDataObject.p_groups_0_ticket_inputs_required = lzm_commonTools.phpSerialize(tiRequired, false);
            myDataObject.p_groups_0_chat_inputs_masked = lzm_commonTools.phpSerialize(ciMasked, false);
            myDataObject.p_groups_0_ticket_inputs_masked = lzm_commonTools.phpSerialize(tiMasked, false);
            myDataObject.p_groups_0_chat_inputs_cap = lzm_commonTools.phpSerialize(ciCap, false);
            myDataObject.p_groups_0_ticket_inputs_cap = lzm_commonTools.phpSerialize(tiCap, false);
            myDataObject.p_groups_0_max_chats = group.mc;
            myDataObject.p_groups_0_ticket_sender_name = myObject.tesn;
            myDataObject.p_groups_0_tino = myObject.tino;

            if (myMode == 'remove')
                myDataObject.p_groups_0_delete = '1';

            if (myMode != 'remove')
                if (typeof group.sig != 'undefined')
                {
                    for (i=0; i<group.sig.length; i++)
                    {
                        deleteSignature = (typeof group.sig[i].deleted == 'undefined' || !group.sig[i].deleted) ? '0' : '1';
                        myDataObject['p_db_sig_g_' + encGId + '_' + i + '_a'] = group.sig[i].i;
                        myDataObject['p_db_sig_g_' + encGId + '_' + i + '_b'] = group.sig[i].d;
                        myDataObject['p_db_sig_g_' + encGId + '_' + i + '_c'] = deleteSignature;
                        myDataObject['p_db_sig_g_' + encGId + '_' + i + '_d'] = group.sig[i].n;
                        myDataObject['p_db_sig_g_' + encGId + '_' + i + '_e'] = group.sig[i].text;
                    }
                }

            if (myMode != 'remove')
                for (i=0; i<cSmc.length; i++)
                {
                    myDataObject['p_db_smc_g_' + encGId + '_' + i + '_sm_a'] = cSmc[i].p;
                    myDataObject['p_db_smc_g_' + encGId + '_' + i + '_sm_b'] = cSmc[i].text;
                    myDataObject['p_db_smc_g_' + encGId + '_' + i + '_sm_e'] = cSmc[i].c;
                    myDataObject['p_db_smc_g_' + encGId + '_' + i + '_sm_d'] = cSmc[i].n;
                    myDataObject['p_db_smc_g_' + encGId + '_' + i + '_sm_c'] = '0';
                    myDataObject['p_db_smc_g_' + encGId + '_' + i + '_sm_f'] = cSmc[i].d;
                    myDataObject['p_db_smc_g_' + encGId + '_' + i + '_sm_g'] = cSmc[i].i;
                    myDataObject['p_db_smc_g_' + encGId + '_' + i + '_sm_h'] = cSmc[i].s;
                    myDataObject['p_db_smc_g_' + encGId + '_' + i + '_sm_i'] = cSmc[i].t;
                    myDataObject['p_db_smc_g_' + encGId + '_' + i + '_sm_j'] = lz_global_base64_encode(cSmc[i].tr);
                }

            if (myMode != 'remove')
                if (typeof group.pm != 'undefined')
                {
                    for (i=0; i<group.pm.length; i++)
                    {
                        if (typeof group.pm[i].deleted == 'undefined' || !group.pm[i].deleted)
                        {
                            pmGeneral += (pmGeneral != '') ? ',1' : '1';
                            if (typeof group.pm[i].lang != 'undefined' && group.pm[i].lang != '')
                            {
                                group.pm[i].lang = group.pm[i].lang.toUpperCase();
                                if (typeof group.autoSendChatWelcome != 'undefined')
                                    group.pm[i].aw = group.autoSendChatWelcome;
                                if (typeof group.chatWelcomeIsEditable != 'undefined')
                                    group.pm[i].edit = group.chatWelcomeIsEditable;
                                for (myKey in group.pm[i]) {
                                    if (group.pm[i].hasOwnProperty(myKey)) {
                                        if ($.inArray(myKey, ['gid', 'invm', 'inva', 'tina', 'wpm', 'wpa', 'wel', 'cioff', 'ci', 'ccmbi',
                                            'ti', 'ect', 'et', 'st', 'sct', 'str', 'etr', 'hct', 'ht', 'htr', 'edit',
                                            'bi', 'def', 'aw', 'tosc', 'tost', 'toscb','aco', 'acc']) != -1) {
                                            myValue = (typeof group.pm[i][myKey] != 'undefined') ? group.pm[i][myKey] : '';
                                            myValue = ($.inArray(myKey, ['gid', 'edit', 'bi', 'def', 'aw']) == -1) ? lz_global_base64_encode(myValue) : myValue;
                                            myDataObject['p_db_pm_g_' + encGId + '_' + group.pm[i].lang + '_' + myKey] = myValue;
                                        }
                                    }
                                }
                                lzm_userManagement.groups.setGroupProperty(group.id, 'pm', group.pm);
                                lzm_userManagement.groups.getGroup(group.id);
                            }
                        } else {
                            myDataObject['p_db_pm_g_' + encGId + '_' + group.pm[i].lang + '_gid'] = group.pm[i]['gid'];
                            myDataObject['p_db_pm_g_' + encGId + '_' + group.pm[i].lang + '_del'] = 1;
                        }
                    }
                }
            myDataObject.p_db_pm = pmGeneral;
            break;
        case 'user':
        case 'bot':
            var operator = lzm_commonTools.clone(myObject);
            var encUid = lz_global_base64_encode(operator.id);
            var isBot = (typeof operator.isbot != 'undefined') ? operator.isbot.toString() : (lzm_userManagement.editType == 'bot') ? '1' : '0';
            var opPasswd = (isBot == '1') ? sha256(md5(Math.random().toString())) : (operator.passwd != operator.pass && operator.passwd != '') ? sha256(md5(operator.passwd)) : '';

            myDataObject['p_operators_0_id'] = operator.userid;
            myDataObject['p_operators_0_system_id'] = operator.id;
            myDataObject['p_operators_0_fcpw'] = operator.cponl ? '1' : '0';

            /*
            if (d(operator.level))
                //myDataObject['p_operators_0_level'] = operator.level;
            else
                //myDataObject['p_operators_0_level'] = '0';
                */

            myDataObject['p_operators_0_groups'] = lz_global_base64_encode(lzm_commonTools.phpSerialize(operator.groups, true));
            myDataObject['p_operators_0_groups_hidden'] = lz_global_base64_encode(lzm_commonTools.phpSerialize(operator.groupsHidden, true));

            myDataObject['p_operators_0_websites_config'] = lz_global_base64_encode('');
            myDataObject['p_operators_0_websites_users'] = lz_global_base64_encode('');
            myDataObject['p_operators_0_fn'] = operator.fn;
            myDataObject['p_operators_0_ln'] = operator.ln;
            myDataObject['p_operators_0_description'] = operator.desc;
            myDataObject['p_operators_0_color'] = operator.c;
            myDataObject['p_operators_0_ldap'] = operator.ldap;

            if (typeof operator.mc != 'undefined')
                myDataObject['p_operators_0_max_chats'] = operator.mc;

            var mobileEx = (typeof operator.mobileAlternatives != 'undefined') ? operator.mobileAlternatives : [];

            myDataObject['p_operators_0_mobile_ex'] = lzm_commonTools.phpSerialize(mobileEx);
            myDataObject['p_operators_0_email'] = operator.email;
            myDataObject['p_operators_0_deac'] = (operator.is_active) ? '0' : '1';

            if (typeof operator.websp != 'undefined')
                myDataObject['p_operators_0_webspace'] = operator.websp;
            else
                myDataObject['p_operators_0_webspace'] = '0';

            if (myMode != 'remove')
                myDataObject['p_operators_0_password'] = opPasswd;

            myDataObject['p_operators_0_permissions'] = operator.perms;

            myDataObject['p_operators_0_languages'] = operator.lang;

            myDataObject['p_operators_0_skills'] = operator.skils;
            myDataObject['p_operators_0_location'] = operator.loca;
            myDataObject['p_operators_0_roles'] = operator.rols;

            if (typeof operator.lipr != 'undefined')
                myDataObject['p_operators_0_lipr'] = operator.lipr;
            else
                myDataObject['p_operators_0_lipr'] = '';

            myDataObject['p_operators_0_bot'] = isBot;
            myDataObject['p_operators_0_wm'] = (d(operator.wm)) ? operator.wm : '0';
            myDataObject['p_operators_0_wmohca'] = (d(operator.wmohca)) ? operator.wmohca : '0';
            myDataObject['p_operators_0_a'] = (d(operator.a)) ? operator.a : '';
            myDataObject['p_operators_0_wmes'] = (d(operator.wmes)) ? operator.wmes : '';

            if (myMode == 'remove')
                myDataObject['p_operators_0_delete'] = '1';

            var pp = (d(operator.pp)) ? operator.pp : '';
            pp = (pp.indexOf('data') == 0) ? pp.split(',')[1] : pp;
            myDataObject['p_operators_0_pp'] = pp;

            if (typeof operator.sig != 'undefined')
            {
                for (i=0; i<operator.sig.length; i++) {
                    deleteSignature = (typeof operator.sig[i].deleted == 'undefined' || !operator.sig[i].deleted) ? '0' : '1';
                    myDataObject['p_db_sig_u_' + encUid + '_' + i + '_a'] = operator.sig[i].i;
                    myDataObject['p_db_sig_u_' + encUid + '_' + i + '_b'] = operator.sig[i].d;
                    myDataObject['p_db_sig_u_' + encUid + '_' + i + '_c'] = deleteSignature;
                    myDataObject['p_db_sig_u_' + encUid + '_' + i + '_d'] = operator.sig[i].n;
                    myDataObject['p_db_sig_u_' + encUid + '_' + i + '_e'] = operator.sig[i].text;
                }
            }
            break;
    }

    return myDataObject;
};
