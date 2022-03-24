/****************************************************************************************
 * LiveZilla ServerConfigurationClass.js
 *
 * Copyright 2018 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/

ServerConfigurationClass.m_Backlinks = ["Powered by LiveZilla", "LiveZilla"];

function ServerConfigurationClass() {
    this.m_Config = new ServerConfiguration(null);
}

ServerConfigurationClass.prototype.showServerConfiguration = function(_tab) {

    if(TaskBarManager.WindowExists('server_configuration_dialog',true))
        return;

    var headerString = tid('server_conf');
    var that = this;
    var footerString =
            lzm_inputControls.createButton('sc-ok-btn', '', '', tid('ok'), '', 'force-text',{'margin-left': '4px'},'',30,'d') +
            lzm_inputControls.createButton('sc-close-btn', '', '', tid('cancel'), '', 'lr',{'margin-left': '4px'},'',30,'d') +
            lzm_inputControls.createButton('sc-apply-btn', '', '', tid('apply'), '', 'lr',{'margin-left': '4px'},'',30,'d');

    var bodyString = '<div id="sc-settings-placeholder"></div>';
    lzm_commonDialog.CreateDialogWindow(headerString, bodyString, footerString, 'wrench', 'server-configuration', 'server_configuration_dialog','sc-close-btn');
    $('#sc-close-btn').click(function() {
        TaskBarManager.RemoveActiveWindow();

    });
    $('#sc-apply-btn').click(function() {
        if(!DataEngine.m_ServerConfigBlocked)
            that.uploadToServer();
    });
    $('#sc-ok-btn').click(function() {
        that.uploadToServer();
        TaskBarManager.RemoveActiveWindow();
    });
    
    var tabs = [];
    this.m_Config.m_Settings.forEach(function(entry_name)
    {
        tabs.push({name: entry_name.title, content: UIRenderer.getForm(entry_name.name, that.m_Config, 'sc'), hash: entry_name.name});
    });
    lzm_inputControls.createTabControl('sc-settings-placeholder',tabs,0);

    this.m_Config.ApplyLogicToForm();

    if(d(_tab))
    {
        if(_tab == 'email')
        {
            $('#sc-settings-placeholder-tab-6').click();
            $('#email-acc-outgoing-add').click();
        }
        else if(_tab == 'tags')
        {
            $('#sc-settings-placeholder-tab-10').click();
            $('#gl_tags-button-add').click();
        }
        else if(_tab == 'licensing')
        {
            $('#sc-settings-placeholder-tab-9').click();
            $('#sc-add-license-key-text').click();
        }
    }

    UIRenderer.resizeServerConfiguration();
};

ServerConfigurationClass.prototype.resetInputFields = function() {

    DataEngine.inputList.objects = LzmCustomInputs.GetDefaultInputList();
    $('#sc-inputs-list').parent().html(this.m_Config.GetCustomForm('Inputs'));
    ServerConfiguration.ApplyLogicToInputsForm();
};

ServerConfigurationClass.prototype.uploadToServer = function(_serverTestId) {
    var that = this;
    var data = that.getPostData();
    DataEngine.m_ServerConfigBlocked = true;
    $('#main-menu-panel-tools-configuration').addClass('ui-disabled');
    CommunicationEngine.pollServerDiscrete('set_config',data,true).done(function(data) {
        //var xmlDoc = $.parseXML($.trim(data));
        if(typeof _serverTestId != 'undefined')
            that.RunEmailTest(_serverTestId);
    }).fail(function(jqXHR, textStatus, errorThrown){deblog(textStatus);});
};

ServerConfigurationClass.prototype.licenseExists = function(searchFor,searchBy) {
    var result = false;
    $("#sc-license-list tr").each(function() {
        if(searchBy == 'serial' && $(this).attr("data-serial")==searchFor.toUpperCase())
            result = true;
        else if(searchBy == 'type' && $(this).attr("data-type-key")==searchFor.toUpperCase())
            result = true;
    });
    return result;
};

ServerConfigurationClass.prototype.getPostData = function() {
    var key,data = {};
    var count = 0;
    var lzch = DataEngine.getConfigValue('gl_lzch',false) == 1;
    var pfech = parseInt($('#int-poll_frequency_clients').val());
    pfech = Math.min(30,pfech);
    $('#int-poll_frequency_clients').val(pfech);

    data['p_administrate'] = '1';

    // inputs
    for (key in DataEngine.inputList.objects)
    {
        if(key.length)
        {
            var obj = DataEngine.inputList.objects[key];
            DataEngine.inputList.applyInputHtmlRow(obj);
            data['p_cfg_g_gl_input_list_' + key] = lz_global_base64_encode(DataEngine.inputList.phpSerializeInput(obj));
        }
    }

    // licenses
    $("#sc-license-list tr").each(function() {
        if($(this).attr("data-serial")){
            var lico = [lz_global_base64_encode($(this).attr("data-hash")),lz_global_base64_encode($(this).attr("data-serial"))];
            lico = lz_global_base64_encode(lz_global_base64_encode(lzm_commonTools.phpSerialize(lico)));
            if($(this).attr("data-type-key")=='OPR')
                data['p_cfg_g_gl_licl_' + (count++)] = lico;
            else
            {
                data['p_cfg_g_gl_pr_' + $(this).attr("data-type-key").toLowerCase()] = lz_global_base64_encode($(this).attr("data-hash"));
            }
        }
    });
    data['p_cfg_g_gl_crc3'] = lz_global_base64_encode(lz_global_base64_encode(this.m_Config.m_crc3));

    // licenses backlink
    data['p_cfg_g_gl_cpar'] = lz_global_base64_encode(this.createBackLink('Standard'));
    data['p_cfg_g_gl_cpas'] = lz_global_base64_encode(this.createBackLink('Short'));
    data['p_cfg_g_gl_cpae'] = lz_global_base64_encode(this.createBackLink('Email'));
    data['p_cfg_g_gl_cpab'] = lz_global_base64_encode(this.createBackLink('Brand'));

    // mailboxes
    count=0;

    // make default if no other default exists
    var makeFirstDefault=false,isOtherDefault = false;
    $("#email-acc-outgoing tbody tr").each(function() {
        var eae = JSON.parse(lz_global_base64_decode($(this).attr("data-obj")));
        if(eae.default)
            isOtherDefault = true;
    });
    if(!isOtherDefault)
        makeFirstDefault = true;

    $("#email-acc-outgoing tbody tr").each(function() {
        if($(this).attr("data-obj")){
            var ea = JSON.parse(lz_global_base64_decode($(this).attr("data-obj")));
            data['p_cfg_es_i_' + count] = ea.id;
            data['p_cfg_es_e_' + count] = ea.email;
            data['p_cfg_es_h_' + count] = ea.host;
            data['p_cfg_es_u_' + count] = ea.userName;
            data['p_cfg_es_p_' + count] = ea.password;
            data['p_cfg_es_po_' + count] = ea.port;
            data['p_cfg_es_s_' + count] = ea.encrypt;
            data['p_cfg_es_a_' + count] = ea.auth && ea.auth!='No' ? 'Yes' : 'No';
            data['p_cfg_es_d_' + count] = '-1';
            data['p_cfg_es_t_' + count] = ea.type;
            data['p_cfg_es_sn_' + count] = ea.senderName;
            data['p_cfg_es_de_' + count] = ea.default ? '1' : '0';
            if(makeFirstDefault)
            {
                makeFirstDefault = false;
                data['p_cfg_es_de_' + count] = '1';
                ea.default = true;
                $(this).attr("data-obj",lz_global_base64_encode(JSON.stringify(ea)));
            }
            data['p_cfg_es_c_' + count] = '0';
            data['p_cfg_es_fw_' + count] = 'ZEND';//(ea.framework == 'PHP') ? 'PHP' : 'ZEND';
            count++;
        }
    });
    $("#email-acc-incoming tbody tr").each(function() {
        if($(this).attr("data-obj")){
            var ea = JSON.parse(lz_global_base64_decode($(this).attr("data-obj")));
            data['p_cfg_es_i_' + count] = ea.id;
            data['p_cfg_es_e_' + count] = ea.email;
            data['p_cfg_es_h_' + count] = ea.host;
            data['p_cfg_es_u_' + count] = ea.userName;
            data['p_cfg_es_p_' + count] = ea.password;
            data['p_cfg_es_po_' + count] = ea.port;
            data['p_cfg_es_s_' + count] = ea.encrypt;
            data['p_cfg_es_a_' + count] = 'Auto';
            data['p_cfg_es_d_' + count] = '1';
            data['p_cfg_es_t_' + count] = ea.type;
            data['p_cfg_es_sn_' + count] = '';
            data['p_cfg_es_de_' + count] = ea.default ? '1' : '0';
            data['p_cfg_es_c_' + count] = ea.frequency;
            data['p_cfg_es_fw_' + count] = 'ZEND';//(ea.framework == 'PHP') ? 'PHP' : 'ZEND';
            count++;
        }
    });

    // standard vals
    this.m_Config.m_Settings.forEach(function(entry_name) {
        entry_name.groups.forEach(function(entry_group) {
            entry_group.controls.forEach(function(entry_control)
            {
                if(!(lzch && $.inArray('lzch',entry_control.not) !== -1))
                    if(typeof entry_control.standard != 'undefined')
                    {
                        var value = UIRenderer.GetControlValue(entry_control);

                        if(entry_control.type=='bool')
                            value = (value===true) ? '1' : '0';

                        if(typeof entry_control.multi != 'undefined')
                            value = parseInt(value) * entry_control.multi;

                        try
                        {
                            data['p_cfg_g_' + entry_control.name] = lz_global_base64_encode(value.toString());
                        }
                        catch(ex)
                        {
                            deblog('error key:' + entry_control.name);
                        }
                    }
            });
        });
    });

    // ldap
    data['p_cfg_g_gl_ldap'] = lz_global_base64_encode($('#r-gl_ldap_1').prop('checked') ? '1' : '0');

    // chats
    data['p_cfg_g_gl_wmes'] = lz_global_base64_encode($('#cb-gl_wmes_c').prop('checked') ? $('#int-gl_wmes').val() : '-1');
    data['p_cfg_g_gl_mcwf'] = lz_global_base64_encode($('#r-gl_mcwf_1').prop('checked') ? '1' : '0');
    data['p_cfg_g_gl_keywords'] = lz_global_base64_encode('LiveZilla, Live, Support, Customer Support, Live Chat, Live Help, LiveZilla Helpdesk');
    data['p_cfg_g_gl_desc'] = lz_global_base64_encode('LiveZilla - Live Support Software [livezilla.net]');
    data['p_cfg_g_gl_alloc_mode'] = lz_global_base64_encode($('#r-gl_alloc_mode_1').prop('checked') ? '1' : '0');

    // tickets
    data['p_cfg_g_gl_om_mode'] = lz_global_base64_encode(($('#r-gl_om_mode_HTTP').prop('checked')) ? '1' : '0');

    count = 0;
    $("#ticket-sub-statuses tbody tr").each(function() {
        if(typeof $(this).attr("data-obj") != 'undefined' && typeof $(this).attr("data-sub") != 'undefined'){
            var ts = JSON.parse(lz_global_base64_decode($(this).attr("data-obj")));
            data['p_cfg_tsd_i_' + count] = ts.name;
            data['p_cfg_tsd_t_' + count] = '0';
            data['p_cfg_tsd_p_' + count] = ts.parent;
            count++;
        }
    });
    $("#ticket-sub-sources tbody tr").each(function() {
        if(typeof $(this).attr("data-obj") != 'undefined' && typeof $(this).attr("data-sub") != 'undefined'){
            var ts = JSON.parse(lz_global_base64_decode($(this).attr("data-obj")));
            data['p_cfg_tsd_i_' + count] = ts.name;
            data['p_cfg_tsd_t_' + count] = '1';
            data['p_cfg_tsd_p_' + count] = ts.parent;
            count++;
        }
    });

    // database
    data['p_cfg_g_gl_adct'] = lz_global_base64_encode('0');

    // feedbacks
    count = 0;
    $("#feedback-criteria tbody tr").each(function() {

        if($(this).attr("data-obj")){
            var fbc = JSON.parse(lz_global_base64_decode($(this).attr("data-obj")));
            data['p_cfg_fc_i_' + count] = fbc.id;
            data['p_cfg_fc_t_' + count] = fbc.title;
            data['p_cfg_fc_n_' + count] = fbc.name;
            data['p_cfg_fc_ty_' + count] = fbc.type;
            count++;
        }
    });

    // server
    function CalculateTimeout(_pFrequency, _tracking, _chats){
        var timeout = (_tracking) ? 100 : (_chats) ? 100 : 600;
        if(!_chats)
            timeout = timeout + (_pFrequency);
        return timeout;
    }

    var opTimeout = CalculateTimeout(pfech, false, false);

    data["p_cfg_g_timeout_clients"] = lz_global_base64_encode(opTimeout.toString());

    var pfetr = parseInt($('#int-poll_frequency_tracking').val());

    data["p_cfg_g_timeout_track"] = lz_global_base64_encode(CalculateTimeout(pfetr, true, false).toString());
    data["p_cfg_g_timeout_chats"] = lz_global_base64_encode(CalculateTimeout(pfech, false, true).toString());
    data['p_cfg_g_gl_rhts'] = lz_global_base64_encode(($('#r-gl_rhts_1').prop('checked')) ? '1' : '0');

    // chat invites
    data['p_cfg_g_gl_itim'] = lz_global_base64_encode($('#cb-gl_itim_c').prop('checked') ? $('#int-gl_itim').val() : '0');
    data['p_cfg_g_gl_imda'] = lz_global_base64_encode($('#r-gl_imda_1').prop('checked') ? '1' : '0');
    data['p_cfg_g_gl_iada'] = lz_global_base64_encode($('#r-gl_iada_1').prop('checked') ? '1' : '0');

    // data privacy
    data['p_cfg_g_gl_colt'] = lz_global_base64_encode($('#cb-gl_colt_c').prop('checked') ? $('#int-gl_colt').val() : '0');

    // knowledge base
    data['p_cfg_g_gl_kbin'] = lz_global_base64_encode($('#r-gl_kbin_1').prop('checked') ? '1' : ($('#r-gl_kbin_2').prop('checked') ? '2' : '0'));
    data['p_cfg_g_gl_kbsb'] = lz_global_base64_encode($('#r-gl_kbsb_1').prop('checked') ? '1' : ($('#r-gl_kbsb_2').prop('checked') ? '2' : '0'));

    // visitors
    data['p_cfg_g_gl_bldo'] = lz_global_base64_encode($('#r-gl_bldo_1').prop('checked') ? '1' : '0');

    // images
    data['p_cfg_g_gl_cali'] = lz_global_base64_encode($('#gl_cali').val().replace(/ /g,''));
    data['p_cfg_g_gl_cahi'] = lz_global_base64_encode($('#gl_cahi').val().replace(/ /g,''));

    // sounds
    data['p_cfg_g_gl_seme'] = lz_global_base64_encode($('#sl-gl_seme').val());
    data['p_cfg_g_gl_seno'] = lz_global_base64_encode($('#sl-gl_seno').val());
    data['p_cfg_g_gl_some'] = lz_global_base64_encode($('#sl-gl_some').val());
    data['p_cfg_g_gl_sovi'] = lz_global_base64_encode($('#sl-gl_sovi').val());
    data['p_cfg_g_gl_sori'] = lz_global_base64_encode($('#sl-gl_sori').val());
    data['p_cfg_g_gl_soti'] = lz_global_base64_encode($('#sl-gl_soti').val());
    data['p_cfg_g_gl_soqu'] = lz_global_base64_encode($('#sl-gl_soqu').val());

    data['p_cfg_g_gl_seme_url'] = lz_global_base64_encode($('#s-gl_seme-custom').val());
    data['p_cfg_g_gl_seno_url'] = lz_global_base64_encode($('#s-gl_seno-custom').val());
    data['p_cfg_g_gl_some_url'] = lz_global_base64_encode($('#s-gl_some-custom').val());
    data['p_cfg_g_gl_sovi_url'] = lz_global_base64_encode($('#s-gl_sovi-custom').val());
    data['p_cfg_g_gl_sori_url'] = lz_global_base64_encode($('#s-gl_sori-custom').val());
    data['p_cfg_g_gl_soti_url'] = lz_global_base64_encode($('#s-gl_soti-custom').val());
    data['p_cfg_g_gl_soqu_url'] = lz_global_base64_encode($('#s-gl_soqu-custom').val());

     // pass thru
    var ptallow = ['gl_kbtf','gl_kbth','gl_usrsp','gl_st_agdo','gl_st_atrc','gl_st_darp','gl_st_davl','gl_st_dbhc','gl_st_dbhv','gl_st_dboa','gl_st_dboc','gl_st_dbof','gl_st_dboi','gl_st_dbot','gl_st_derd','gl_st_dere','gl_st_ders','gl_st_drch','gl_st_dtdo','gl_st_dtee','gl_st_dtis','gl_st_dtkb','gl_st_dtor','gl_st_dtpa','gl_st_dtre','gl_st_dtse','gl_st_dtsy','gl_st_dtvi','gl_st_getp','gl_st_hifi','gl_st_marp','gl_st_mbdc','gl_st_mbdv','gl_st_mbhc','gl_st_mbhv','gl_st_mboa','gl_st_mboc','gl_st_mbof','gl_st_mboi','gl_st_mbot','gl_st_mtdo','gl_st_mtee','gl_st_mtis','gl_st_mtkb','gl_st_mtor','gl_st_mtpa','gl_st_mtre','gl_st_mtse','gl_st_mtsy','gl_st_mtvi','gl_st_muvl','gl_st_ropr','gl_st_toam','gl_st_upinh','gl_st_yarp','gl_st_ybhc','gl_st_ybhv','gl_st_ybmc','gl_st_ybmv','gl_st_yboa','gl_st_yboc','gl_st_ybof','gl_st_yboi','gl_st_ybot','gl_st_ytdo','gl_st_ytee','gl_st_ytis','gl_st_ytkb','gl_st_ytor','gl_st_ytpa','gl_st_ytre','gl_st_ytse','gl_st_ytsy','gl_st_ytvi','gl_sctl','gl_lcut','gl_gtl','gl_gt_us','gl_gt_v','gl_gt_vc','gl_gt_vs','gl_gt_vsc','gl_gtdb','gl_ftpf','gl_ccac','gl_ccsv','gl_ccva'];

    for (var i=0; i<DataEngine.global_configuration.site[0].length; i++)
    {
        if (typeof DataEngine.global_configuration.site[0][i].subkeys != 'undefined')
        {
            key = DataEngine.global_configuration.site[0][i].key;
            if(typeof data['p_cfg_g_' + key] == 'undefined' && $.inArray(key,ptallow)!=-1){
                data['p_cfg_g_' + key] = lz_global_base64_encode(DataEngine.global_configuration.site[0][i].value);
            }
        }
    }
    return data;
};

ServerConfigurationClass.prototype.createBackLink = function(type){
    var bl = "";

    DataEngine.m_BacklinkIndex = (this.licenseExists('NBL','type')) ? 2 : 0;
    if (type == 'Email')
    {
        if (DataEngine.m_BacklinkIndex != 2)
            bl = "Powered by LiveZilla Help Desk Software [https://www.livezilla.net]";
        else if (DataEngine.m_BacklinkTitle.length > 0)
            bl += DataEngine.m_BacklinkTitle + " [" + DataEngine.m_BacklinkUrl + "]";
        else
            return '';
    }
    else if (type == 'Short')
    {
        bl = "<a id=\"lz_chat_cl\" class=\"lz_overlay_chat_options_link\" href=\"";
        if (DataEngine.m_BacklinkIndex == 2)
        {
            if (DataEngine.m_BacklinkTitle.length > 0 && DataEngine.m_BacklinkTitle.length <= 75)
                bl += DataEngine.m_BacklinkUrl + "\" target=\"_blank\">" + DataEngine.m_BacklinkTitle.replace("Powered by ", "").replace(" Software", "");
            else if (DataEngine.m_BacklinkTitle.length > 0)
                bl += DataEngine.m_BacklinkUrl + "\" target=\"_blank\">" + "LiveZilla";
            else
                return '';
        }
        else
        {
            bl += "https://www.livezilla.net/\" title=\"Powered by LiveZilla\" target=\"_blank\">";
            bl += ServerConfigurationClass.m_Backlinks[1];
            bl += this.getBackLinkTitle(type);
        }
        bl += "</a>";
    }
    else if (type == 'Standard')
    {
        bl = "<a class=\"lz_chat_main_link\" href=\"";
        if (DataEngine.m_BacklinkIndex == 2)
        {
            if (DataEngine.m_BacklinkTitle.length > 0)
                bl += DataEngine.m_BacklinkUrl + "\" target=\"_blank\">" + DataEngine.m_BacklinkTitle;
            else
                return '';
        }
        else
        {
            bl += "https://www.livezilla.net/\" target=\"_blank\">";
            bl += ServerConfigurationClass.m_Backlinks[DataEngine.m_BacklinkIndex];
            bl += this.getBackLinkTitle(type);
        }
        bl += "</a>";
    }
    else if (type == 'Brand' && DataEngine.m_BacklinkIndex == 0)
    {
        bl = "<a class=\"<!--class-->\" href=\"";
        bl += "https://www.livezilla.net/\" target=\"_blank\">";
        bl += ServerConfigurationClass.m_Backlinks[1];
        bl += this.getBackLinkTitle(type);
        bl += "</a>";
    }
    return bl;
};

ServerConfigurationClass.prototype.getBackLinkTitle = function(type){
    var titles;
    if (type == 'Short')
        titles = [" Live Chat", " Live Help", " Live Help", " Helpdesk", " Customer Support"];
    else if (type == 'Brand')
        titles = [""];
    else
        titles = [" Live Chat", " Live Help", " Live Help", " Live Help Software", " Live Chat Software", " Live Chat Software", " Live Support Software", " Live Chat Software", " Customer Support Software", " Website Chat Software", " Helpdesk", " Helpdesk", " Helpdesk"];
    return titles[lzm_commonTools.rand(0, titles.length-1)];
};

ServerConfigurationClass.prototype.getEmailAccountForm = function(accountObj){
    var typeSelectList, contentHtml = '<fieldset class="lzm-fieldset-full" style="min-width:300px;"><legend>'+tid('account')+'</legend>';

    contentHtml += '<div>'+lzm_inputControls.createInput('ea_conf_email', '', accountObj.email, tidc('email'), '', 'text', '')+'</div>';

    var vauth = (accountObj.auth == 'Yes' || (d(accountObj.auth) && accountObj.auth.toString() == 'true'));
    var vdefault = (accountObj.default == '1');

    if(accountObj.boxtype == 'outgoing')
    {
        contentHtml += '<div class="top-space">'+lzm_inputControls.createInput('ea_conf_senderName', '', accountObj.senderName, tidc('name'), '', 'text', '')+'</div>';
        contentHtml += '<div class="top-space">'+lzm_inputControls.createCheckbox('ea_conf_default', tid('default'), vdefault, '')+'</div>';

        typeSelectList = [{value:'SMTP',text:'SMTP'}];

        if(accountObj.type == 'PHPMail')
            typeSelectList = [{value:'PHPMail',text:'PHPMail'},{value:'SMTP',text:'SMTP'}];

        contentHtml += '<div class="top-space-double"><label for="ea_conf_type">' + tidc('type') + '</label></div>';
        contentHtml += '<div>'+lzm_inputControls.createSelect('ea_conf_type', '', '', '', '', {},  '', typeSelectList,accountObj.type , '')+'</div>';
    }
    else
    {
        typeSelectList = [{value:'POP',text:'POP'},{value:'IMAP',text:'IMAP'}];
        contentHtml += '<div class="top-space"><label for="ea_conf_type">' + tidc('type') + '</label></div>';
        contentHtml += '<div>'+lzm_inputControls.createSelect('ea_conf_type', '', '', '', '', {},  '', typeSelectList,accountObj.type , '')+'</div>';

        var fwSelectList = [{value:'ZEND',text:'Zend Framework'}/*,{value:'PHP',text:'PHP IMAP Extension'}*/];
        contentHtml += '<div class="top-space" style="display: none;"><label for="ea_conf_framework">Framework:</label></div>';
        contentHtml += '<div class="top-space" style="display: none;">'+lzm_inputControls.createSelect('ea_conf_framework', '', '', '', '', {},  '', fwSelectList,accountObj.framework , '')+'</div>';
    }

    contentHtml += '<div class="top-space ea_conf_acc_settings">';
    contentHtml += '<div class="top-space">'+lzm_inputControls.createInput('ea_conf_host', 'ea_conf_acc_settings', accountObj.host, tidc('host'), '', 'text', '')+'</div>';
    contentHtml += '<div class="top-space">'+lzm_inputControls.createInput('ea_conf_port', 'ea_conf_acc_settings', accountObj.port, tidc('port'), '', 'number', '')+'</div>';
    contentHtml += '<div class="top-space">'+lzm_inputControls.createInput('ea_conf_userName', 'ea_conf_acc_settings', accountObj.userName, tidc('username'), '', 'text', '')+'</div>';
    contentHtml += '<div class="top-space">'+lzm_inputControls.createInput('ea_conf_password', 'ea_conf_acc_settings', accountObj.password, tidc('password'), '', 'password', '')+'</div>';

    var encSelectList = [{value:'0',text:tid('none')},{value:'1',text:'SSL'},{value:'2',text:'TLS'}];
    contentHtml += '<div class="top-space ea_conf_acc_settings"><label for="ea_conf_encrypt">' + tidc('encryption') + '</label></div>';
    contentHtml += '<div>'+lzm_inputControls.createSelect('ea_conf_encrypt', 'ea_conf_acc_settings', '', '', '', {}, '', encSelectList, accountObj.encrypt, '')+'</div>';


    if(accountObj.boxtype == 'outgoing')
    {
        contentHtml += '<div class="top-space ea_conf_acc_settings">'+lzm_inputControls.createCheckbox('ea_conf_auth', tid('email_auth'), vauth, '')+'</div>';
    }
    else
    {
        contentHtml += '<div class="top-space">'+lzm_inputControls.createInput('ea_conf_frequency', '', accountObj.frequency, tid('email_frequency'), '', 'number', '' ,'' ,tid('minutes'))+'</div>';
        contentHtml += '<div class="top-space text-info" style="width:400px">' + tid('email_delete_text')+'</div>';
    }

    contentHtml += '</div>';
    return contentHtml + '</fieldset>';
};

ServerConfigurationClass.prototype.getCriteriaForm = function(criteriaObj){
    var contentHtml = '<fieldset class="lzm-fieldset-full" style="min-width:300px;"><legend>'+tid('criteria')+'</legend>';
    contentHtml += '<div>' + lzm_inputControls.createInput('fb-crit-name','',criteriaObj.name,tidc('name'),'','','text') + '</div>';
    contentHtml += '<input id="fb-crit-id" type="hidden" value="'+criteriaObj.id+'">';
    contentHtml += '<div class="top-space">' + lzm_inputControls.createInput('fb-crit-title','',criteriaObj.title,tidc('title'),'','','text') + '</div>';
    contentHtml += '<div class="top-space-double">' + lzm_inputControls.createRadio('fb-crit-type-0','','fb-crit-type',tid('feedback'),(criteriaObj.type==0)) + '</div>';
    contentHtml += '<div class="top-space-half">' + lzm_inputControls.createRadio('fb-crit-type-1','','fb-crit-type',tid('comment'),(criteriaObj.type==1)) + '</div>';
    return contentHtml + '</fieldset>';
};

ServerConfigurationClass.prototype.configureLicense = function(type){
    var confHtml = '';
    if(type=='NBL')
    {
        confHtml += '<div style="width:350px;" class="top-space">' + lzm_inputControls.createCheckbox('sc-cfl-nbl-link-visible',tid('link_visible'),DataEngine.m_BacklinkTitle.length>0,'') + '</div>';
        confHtml += '<div class="top-space left-space-child">' + lzm_inputControls.createInput('sc-cfl-nbl-link-title','sc-cfl-nbl-link',DataEngine.m_BacklinkTitle,tidc('link_title'),'','text','') + '</div>';
        confHtml += '<div class="top-space left-space-child">' + lzm_inputControls.createInput('sc-cfl-nbl-link-url','sc-cfl-nbl-link',DataEngine.m_BacklinkUrl,tidc('url'),'','text','') + '</div>';

        lzm_commonDialog.createAlertDialog(confHtml, [{id: 'clok', name: tid('ok')}, {id: 'clclose', name: tid('cancel')}],true,true,false);

        $('#sc-cfl-nbl-link-visible').change(function(){
           if(!$('#sc-cfl-nbl-link-visible').prop('checked'))
               $('.sc-cfl-nbl-link').addClass('ui-disabled');
           else
               $('.sc-cfl-nbl-link').removeClass('ui-disabled');
        });
        $('#sc-cfl-nbl-link-title').attr("maxlength",56);
        $('#sc-cfl-nbl-link-title').val(DataEngine.m_BacklinkTitle);
        $('#sc-cfl-nbl-link-visible').change();
        $('#alert-btn-clok').click(function() {
            if($('#sc-cfl-nbl-link-visible').prop('checked'))
            {
                DataEngine.m_BacklinkUrl = $('#sc-cfl-nbl-link-url').val();
                DataEngine.m_BacklinkTitle = $('#sc-cfl-nbl-link-title').val();
            }
            else
            {
                DataEngine.m_BacklinkUrl =
                DataEngine.m_BacklinkTitle = '';
            }
            lzm_commonDialog.removeAlertDialog();
        });
        $('#alert-btn-clclose').click(function() {

            lzm_commonDialog.removeAlertDialog();
        });
    }
}

ServerConfigurationClass.prototype.addLicenseKey = function(){
    var that = this;
    var licenseHtml = '<fieldset class="lzm-fieldset-full"><legend>'+tid('activate_license')+'</legend>' +
        '<table id="sc-act-lc-table"><tr><td>'+tid('serial')+':&nbsp;</td>' +
        '<td>'+lzm_inputControls.createInput('sc-acl-oc1', 'sc-acl-oc sc-acl-oc-nl', '', '', '', 'text', '')+'</td><td>-</td>' +
        '<td>'+lzm_inputControls.createInput('sc-acl-oc2', 'sc-acl-oc sc-acl-oc-nl', '', '', '', 'text', '')+'</td><td>-</td>' +
        '<td>'+lzm_inputControls.createInput('sc-acl-oc3', 'sc-acl-oc sc-acl-oc-nl', '', '', '', 'text', '')+'</td><td>-</td>' +
        '<td>'+lzm_inputControls.createInput('sc-acl-oc4', 'sc-acl-oc', '', '', '', 'text', '')+'</td>' +
        '</tr></table>';
    licenseHtml += '</fieldset>';
    lzm_commonDialog.createAlertDialog(licenseHtml, [{id: 'ok', name: tid('ok')}, {id: 'close', name: tid('cancel')}, {id: 'buy', name: tid('buy')}, {id: 'help', name: tid('help')}],true,true,false);
    $("#sc-acl-oc1").keydown(function(){$("#sc-acl-oc1").change();});
    $("#sc-acl-oc1").keyup(function(){$("#sc-acl-oc1").change();});
    $("#sc-acl-oc1").change(function(){
       var key = $("#sc-acl-oc1").val().trim();
       if(key.length == 23 && (key.match(/-/g) || []).length == 3){
           var ocl = key.split('-');
           if(ocl.length == 4){
               $("#sc-acl-oc1").val(ocl[0]);
               $("#sc-acl-oc2").val(ocl[1]);
               $("#sc-acl-oc3").val(ocl[2]);
               $("#sc-acl-oc4").val(ocl[3]);
           }


       }
    });
    $(".sc-acl-oc-nl input").keyup(function(){
        if(this.value.length == 5)
            $("#sc-acl-oc"+(parseInt(this.id.substr(this.id.length-1,this.id.length))+1)).focus();
    });
    $('#alert-btn-ok').click(function() {

        var lk = ($("#sc-acl-oc1").val().trim() + '-' + $("#sc-acl-oc2").val().trim() + '-' + $("#sc-acl-oc3").val().trim() + '-' + $("#sc-acl-oc4").val().trim()).toUpperCase();
        if(lk.length == 23){

            if(that.licenseExists(lk,'serial'))
            {
                lzm_commonDialog.removeAlertDialog();
                return;
            }

            var myDataObject = {};
            myDataObject['p_server'] = DataEngine.getConfigValue('gl_lzid',true).value;
            myDataObject['p_host'] = CommunicationEngine.chosenProfile.server_protocol + CommunicationEngine.chosenProfile.server_url;
            myDataObject['p_major'] = lzm_commonConfig.lz_version.split('.')[0];
            myDataObject['p_oak'] = '';
            myDataObject['p_activate'] = 'true';
            myDataObject['p_serial'] = lk;

            lzm_commonDialog.removeAlertDialog();

            $.ajax({
                type: "POST",
                url: "https://www.livezilla.net/shop/client/",
                data: myDataObject,
                timeout: 15000,
                dataType: 'text'
            }).done(function(data) {

                    var xmlDoc = $.parseXML($.trim(data));
                    $(xmlDoc).find('pob').each(function(){

                        var lmajreq = ($(this).attr('rm')) ? lz_global_base64_decode($(this).attr('rm')) : -1;
                        var lmajavl = ($(this).attr('am')) ? lz_global_base64_decode($(this).attr('am')) : -1;
                        var ltypek = lz_global_base64_decode($(this).attr('type'));

                        if(ltypek == 'STR' || ltypek == 'CSP' || ltypek == 'NGL')
                        {
                            lzm_commonDialog.removeAlertDialog();
                            that.showLicenseError(false,null,null);
                        }
                        else if (lmajreq > -1 && lmajavl > -1 && lmajreq > lmajavl)
                        {
                            lzm_commonDialog.removeAlertDialog();
                            that.showLicenseError(true,lmajreq,lmajavl);
                        }
                        else if(lz_global_base64_decode($(this).attr('activated'))=='true')
                        {
                            var lamount = lz_global_base64_decode($(this).attr('amount'));

                            if(ltypek == 'CSP')
                            {
                                lzm_commonDialog.removeAlertDialog();
                                that.showLicenseError(false);
                                return;
                            }

                            var lserial = lz_global_base64_decode($(this).attr('serial'));
                            var lhash = lz_global_base64_decode($(this).text());
                            var ltypen = (ltypek=='OPR') ? 'LiveZilla PRO' : (ltypek=='CSP') ? 'Startpage' : 'Backlink Removal';
                            var lconf = (ltypek=='NBL');

                            var rowHtml = that.m_Config.GetLicenseRow('<b class="text-orange">'+tid('new')+'</b>',((lamount.toString()==='-1') ? 'Unlimited' : lamount),ltypen,ltypek,lserial,lhash,lconf,true);
                            $('#sc-license-list tbody tr:first').before(rowHtml);

                            if(ltypek == 'OPR' && that.licenseExists('NGL','type'))
                            {
                                $('tr[data-type-key="NGL"]').remove();
                            }

                            if(ltypek == 'OPR' && !that.licenseExists('NGL','type'))
                            {
                                //rowHtml = that.m_Config.GetLicenseRow('<b class="text-orange">'+tid('new')+'</b>',1,'Geo Tracking','NGL','-',DataEngine.getHash('NGL',DataEngine.getConfigValue('gl_lzid',true).value), false, false);
                                //$('#sc-license-list tbody tr:first').before(rowHtml);
                            }

                            if(ltypek == 'OPR' && that.licenseExists('TRIAL','serial'))
                            {
                                $('tr[data-serial="TRIAL"]').remove();
                                $('#main-menu-info-box').css('visibility','hidden');
                            }

                            $('#sc-none').css('display','none');

                            that.m_Config.UpdateLicenseInfo();
                            that.uploadToServer();

                            lzm_commonDialog.removeAlertDialog();
                        }
                        else
                        {
                            lzm_commonDialog.removeAlertDialog();
                            that.showLicenseError(false);
                        }
                    });
                }).fail(function(jqXHR, textStatus, errorThrown)
            {
                lzm_commonDialog.createAlertDialog(tid('activ_error'), [{id: 'ok', name: tid('ok')}]);
                $('#alert-btn-ok').click(function() {
                    lzm_commonDialog.removeAlertDialog();
                });

            });
        }
        else
        {
            lzm_commonDialog.removeAlertDialog();
            that.showLicenseError(false);
        }
    });
    $('#alert-btn-help').click(function() {
        window.open('https://chat.livezilla.net/knowledge-base/licensing/en-activate-license/');
    });
    $('#alert-btn-buy').click(function() {
        window.open('https://www.livezilla.net/shop/en/?action=preview');
    });
    $('#alert-btn-close').click(function() {
        lzm_commonDialog.removeAlertDialog();
    });
    $('#ival_active').change(function() {
        if(!$('#ival_active').attr('checked'))
            $('#ival_advanced').addClass('ui-disabled');
        else
            $('#ival_advanced').removeClass('ui-disabled');
    });
    $('#ival_active').change();
    $("#sc-acl-oc1").focus();
};

ServerConfigurationClass.prototype.showLicenseError = function(major,lmajreq,lmajavl){
    if(major)
    {
        var text = tid('ac_fail_maj').replace('<!--rm-->',lmajreq).replace('<!--am-->',lmajavl);
        lzm_commonDialog.createAlertDialog(text, [{id: 'dok', name: tid('ok')}, {id: 'dcancel', name: tid('cancel')}]);
        $('#alert-btn-dok').click(function() {
            window.open('https://www.livezilla.net/shop/en/?action=login');
            lzm_commonDialog.removeAlertDialog();
        });
        $('#alert-btn-dcancel').click(function() {

            lzm_commonDialog.removeAlertDialog();
        });
    }
    else
    {
        var text = tid('ac_fail');
        lzm_commonDialog.createAlertDialog(text, [{id: 'dok', name: tid('ok')}]);
        $('#alert-btn-dok').click(function() {
            lzm_commonDialog.removeAlertDialog();
        });
    }
};

ServerConfigurationClass.prototype.emailAction = function(action, type, id){
    if(action == 'remove')
        $('#'+id).remove();
    else if(action == 'add' || action == 'edit')
    {
        if(action == 'add')
            id = lzm_commonTools.guid();

        var eae,ea = {id:id,senderName:'',email:'',default:false,boxtype:type,host:'',userName:'',type:'SMTP',password:'',encrypt:'',port:25, auth:true,framework:'ZEND',frequency:10};

        if(type == 'incoming')
            ea.port = 110;

        if(action == 'edit')
            ea = JSON.parse(lz_global_base64_decode($('#'+id).attr("data-obj")));

        if(ea.frequency < 2)
            ea.frequency = 2;

        lzm_commonDialog.createAlertDialog(lzm_chatDisplay.ServerConfigurationClass.getEmailAccountForm(ea), [{id: 'eaok', name: tid('ok')}, {id: 'eacancel', name: tid('cancel')},{id: 'eatest', name: tid('test')}],true);

        $('#alert-btn-eaok').click(function() {

            for(var key in ea)
                if($('#ea_conf_'+key).length)
                {
                    if(key == 'default' || key == 'auth')
                        ea[key] = $('#ea_conf_'+key).prop('checked');
                    else
                        ea[key] = $('#ea_conf_'+key).val();
                }

            var newrow = lzm_chatDisplay.ServerConfigurationClass.m_Config.GetEmailAccountRow(ea);
            if(action == 'edit')
                $('#'+id).replaceWith(newrow);
            else
                $('#email-acc-'+type+' tbody').append(newrow);

            // unset other defaults
            if(ea.default)
            {
                $('#email-acc-'+type+' tbody tr').each(function() {
                    eae = JSON.parse(lz_global_base64_decode($(this).attr("data-obj")));
                    if(eae.id != ea.id)
                    {
                        eae.default = false;
                        $(this).attr("data-obj",lz_global_base64_encode(JSON.stringify(eae)));
                    }
                });
            }

            lzm_commonDialog.removeAlertDialog();
        });
        $('#alert-btn-eacancel').click(function() {

            lzm_commonDialog.removeAlertDialog();
        });
        $('#alert-btn-eatest').click(function() {
            $('#alert-btn-eaok').click();
            $('#email-acc-'+id+'-test').click();
        });
        $('#ea_conf_type').change(function() {

            if($('#ea_conf_type').val() == 'PHPMail')
                $('.ea_conf_acc_settings').addClass('ui-disabled');
            else
                $('.ea_conf_acc_settings').removeClass('ui-disabled');

            suggestPort();
        });

        if(action != 'edit' || $('#ea_conf_type').val() == 'PHPMail')
            $('#ea_conf_type').change();

        $('#ea_conf_encrypt').change(function() {
            suggestPort();
        });

        function suggestPort(){

            var port = 0;
            if(type == 'incoming')
            {
                port = 110;
                if($('#ea_conf_encrypt').prop('selectedIndex') > 0 && $('#ea_conf_type').val() == 'IMAP')
                    port = 993;
                else if($('#ea_conf_encrypt').prop('selectedIndex') == 0 && $('#ea_conf_type').val() == 'IMAP')
                    port = 143;
                else if($('#ea_conf_encrypt').prop('selectedIndex') > 0)
                    port = 995;
            }
            else
            {
                port = 25;
                if($('#ea_conf_encrypt').prop('selectedIndex') == 1)
                    port = 465;
                else if($('#ea_conf_encrypt').prop('selectedIndex') == 2)
                    port = 587;
            }

            $('#ea_conf_port').val(port);
        }
    }
    else if(action == 'test')
    {
        this.setEmailButtons(id,true);
        this.uploadToServer(id);
    }
};

ServerConfigurationClass.prototype.setEmailButtons = function(id,testRunning){
    if(!testRunning)
        $('#email-acc-'+id+'-test-text').text(tid('test'));
    else
        $('#email-acc-'+id+'-test-text').text(tid('testing'));

    if(testRunning)
        $('.email_dialog_button').addClass('ui-disabled');
    else
        $('.email_dialog_button').removeClass('ui-disabled');
};

ServerConfigurationClass.prototype.ticketSubAction = function(action, type, id){
    var that = this;
    if(action == 'remove')
    {
        $('#' + id).remove();
    }
    else if(action == 'add')
    {
        lzm_commonDialog.createAlertDialog(lzm_inputControls.createInput('sc-tsd-new-name','','',tidc('name'),'','','text'), [{id: 'tsdok', name: tid('ok')}, {id: 'tsdcancel', name: tid('cancel')}],true,true,true);
        $('#sc-tsd-new-name').focus();
        $('#alert-btn-tsdok').click(function() {

            $('#sc-tsd-new-name').val(lzm_commonTools.MakeIDSafe($('#sc-tsd-new-name').val()));

            if($('#sc-tsd-new-name').val().length==0)
                return;

            if($('.' + type + '-' + id + $('#sc-tsd-new-name').val()).length)
                return;

            var rowHtml = that.m_Config.GetTicketSubRow({name:$('#sc-tsd-new-name').val(),parent:id,sid:lzm_commonTools.guid(),type:1},type,'sub');
            $('#' + type + '-' + id).after(rowHtml);
            lzm_commonDialog.removeAlertDialog();
        });
        $('#alert-btn-tsdcancel').click(function() {
            lzm_commonDialog.removeAlertDialog();
        });
    }
};

ServerConfigurationClass.prototype.feedbackAction = function(action, id){
    var that = this;
    if(action == 'remove'){
        $('#fb-crit-'+id).remove();
    }
    else if(action == 'add' || action == 'edit'){

        if(action == 'add')
            id = lzm_commonTools.guid(true);

        var crit = {id:id,name:'',title:'',type:0};
        if(action == 'edit')
            crit = JSON.parse(lz_global_base64_decode($('#fb-crit-'+id).attr("data-obj")));

        lzm_commonDialog.createAlertDialog(this.getCriteriaForm(crit), [{id: 'fbcok', name: tid('ok')}, {id: 'fbccancel', name: tid('cancel')}],true,true,true);

        $('#alert-btn-fbcok').click(function() {
            var rowHtml = that.m_Config.GetCriteriaRow({id:$('#fb-crit-id').val(),name:$('#fb-crit-name').val(),title:$('#fb-crit-title').val(),type:($('#fb-crit-type-1').prop('checked')?1:0)});
            if(action == 'edit')
                $('#fb-crit-'+id).replaceWith(rowHtml);
            else
                $('#feedback-criteria tbody').append(rowHtml);
            lzm_commonDialog.removeAlertDialog();
        });
        $('#alert-btn-fbccancel').click(function() {
            lzm_commonDialog.removeAlertDialog();
        });
    }
    else if(action == 'reset'){
        $('#feedback-criteria tbody').empty();
        $('#feedback-criteria tbody').append(that.m_Config.GetCriteriaRow({id:'d0',name:'Knowledge',title:'<!--lang_client_feedback_knowledge-->',type:0}));
        $('#feedback-criteria tbody').append(that.m_Config.GetCriteriaRow({id:'d1',name:'Friendliness',title:'<!--lang_client_feedback_friendliness-->',type:0}));
        $('#feedback-criteria tbody').append(that.m_Config.GetCriteriaRow({id:'d2',name:'Responsiveness',title:'<!--lang_client_feedback_responsiveness-->',type:0}));
        $('#feedback-criteria tbody').append(that.m_Config.GetCriteriaRow({id:'d3',name:'Overall',title:'<!--lang_client_feedback_overall-->',type:0}));
        $('#feedback-criteria tbody').append(that.m_Config.GetCriteriaRow({id:'d4',name:'Comment',title:'<!--lang_client_feedback_comment-->',type:1}));
    }
};

ServerConfigurationClass.prototype.testLDAP = function(){

    $('#ldap_test-text').text(tid('testing'));
    var pdata={"p_ldap_host": $('#s-gl_ldho').val(),
    "p_ldap_bidn": $('#s-gl_lddn').val(),
    "p_ldap_bipa": $('#gl_ldbp').val(),
    "p_ldap_brsd": $('#s-gl_ldsd').val(),
    "p_ldap_port": $('#int-gl_ldpo').val()};

    function showLDAPResult(message){
        $('#ldap_test-text').text(tid('test'));
        lzm_commonDialog.createAlertDialog(message, [{id: 'ok', name: t('Ok')}]);
        $('#alert-btn-ok').click(function() {
            lzm_commonDialog.removeAlertDialog();
        });
    }

    CommunicationEngine.pollServerDiscrete('ldap_test',pdata).done(function(data) {
        try{

            if(data.length==0)
                throw Error("no response");

            var xmlDoc = $.parseXML($.trim(data));
            $(xmlDoc).find('response').each(function(){
                var resultCode = lz_global_base64_decode($(xmlDoc).find('value').attr('id'));
                if(resultCode==1)
                    message = tid('test_LDAP_success');
                else{
                    var response = '<b>' + lz_global_base64_decode($(this).text()) + '</b>';
                    message = tid('test_LDAP_fail').replace('<!--e-->',response);
                }
                showLDAPResult(message);
            });
        }
        catch(ex) {
            if(data.length)
                message = tid('test_LDAP_fail').replace('<!--e-->',data);
            else
                message = tid('test_LDAP_fail').replace('<!--e-->','Timeout exeeded. (Invalid Port?)');
            showLDAPResult(message);
        }

    }).fail(function(jqXHR, textStatus, errorThrown){showLDAPResult(data);});
};

ServerConfigurationClass.prototype.RunEmailTest = function(id) {
    function showEmailResult(message){
        lzm_commonDialog.createAlertDialog(message, [{id: 'ok', name: t('Ok')}]);
        $('#alert-btn-ok').click(function() {
            lzm_commonDialog.removeAlertDialog();
        });
    }
    var that = this;
    var ea = JSON.parse(lz_global_base64_decode($('#'+id).attr("data-obj")));
    var message = "";
    CommunicationEngine.pollServerDiscrete('send_test_mail',{'p_mailbox':id}).done(function(data) {

        that.setEmailButtons(id,false);
        var xmlDoc = $.parseXML($.trim(data));
        $(xmlDoc).find('response').each(function(){

            var resultCode = lz_global_base64_decode($(xmlDoc).find('value').attr('id'));
            var response = '<b>' + lz_global_base64_decode($(this).text()) + '</b>';
            if(resultCode==1)
            {
                if(ea.boxtype=='outgoing')
                    message = tid('out_email_success').replace('<!--s-->',ea.email);
                else
                    message = tid('in_email_success').replace('<!--a-->',response);
            }
            else
            {
                message = tid('email_failed').replace('<!--e-->',response);
            }
            showEmailResult(message);
        });

    }).fail(function(jqXHR, textStatus, errorThrown){deblog(errorThrown);deblog(textStatus);deblog(jqXHR);that.setEmailButtons(id,false);showEmailResult(tid('email_failed').replace('<!--e-->',textStatus+'<br><br>(Invalid Port or Firewall problems?)'));});
};

ServerConfigurationClass.prototype.RemoveLicenseKey = function (hash) {
    var sc = this;
    $("#sc-license-list tr").each(function() {
        if($(this).attr("data-hash")==hash)
        {
            var that = $(this);
            var myDataObject = {};
            myDataObject['p_server'] = DataEngine.getConfigValue('gl_lzid',true).value;
            myDataObject['p_host'] = CommunicationEngine.chosenProfile.server_protocol + CommunicationEngine.chosenProfile.server_url;
            myDataObject['p_major'] = lzm_commonConfig.lz_version.split('.')[0];
            myDataObject['p_oak'] = hash;
            myDataObject['p_deactivate'] = 'true';
            myDataObject['p_serial'] = '';

            $.ajax({
                type: "POST",
                url: "https://www.livezilla.net/shop/client/",
                data: myDataObject,
                timeout: 15000,
                dataType: 'text'
            }).done(function(data) {

                    that.remove();

                    if(sc.licenseExists('NGL','type') && !sc.licenseExists('OPR','type'))
                        $('tr[data-type-key="NGL"]').remove();

                    if($("#sc-license-list tr").length==4)
                        $('#sc-none').css('display','');

                    sc.m_Config.UpdateLicenseInfo();
                    sc.uploadToServer();

                }).fail(function(jqXHR, textStatus, errorThrown){deblog(textStatus);});
        }
    });
};

ServerConfigurationClass.__RemoveLicenseKey = function(hash) {
    lzm_chatDisplay.ServerConfigurationClass.RemoveLicenseKey(hash);
};

function ServerConfiguration(_cloneObj) {
    this.m_crc3 = '';

    var i,al = lzm_commonTools.clone(lzm_chatDisplay.availableLanguages);
    var ticketStatusArray = [], maskArray = [], shmArray = [], tzArray = [], langArray = [], langCodeArray = Object.keys(al);

    for (i=0; i<langCodeArray.length; i++)
        langArray.push({value: langCodeArray[i], text: langCodeArray[i].toUpperCase() + ' - ' + al[langCodeArray[i]]});

    var defLang = DataEngine.getConfigValue('gl_default_language',false);
    if(defLang == null)
        defLang = 'en';

    tzArray.push({value: '', text: tid('default_timezone')});
    var tzs = this.getTimezones();
    for (i=0; i<tzs.length; i++)
        tzArray.push({value: tzs[i].title, text: tzs[i].title + ' (' + tzs[i].diff+')'});

    var defTizo = DataEngine.getConfigValue('gl_tizo',false);
    if(defTizo == null)
        defTizo = '';

    var defshm = DataEngine.getConfigValue('gl_caen',false);
    shmArray.push({value: '0', text: tid('none')});
    shmArray.push({value: '1', text: 'Shared Memory, MYSQL Engine (recommended)'});
    shmArray.push({value: '2', text: 'Shared Memory, SHMOP Engine'});
    shmArray.push({value: '3', text: 'Shared Memory, MEMCACHE Engine'});
    shmArray.push({value: '4', text: 'Shared Memory, MEMCACHED Engine'});
    shmArray.push({value: '5', text: 'Shared Memory, APC Engine'});

    var defMask = DataEngine.getConfigValue('gl_miat',false);
    maskArray.push({value: '0', text: '123.321.123.xxx'});
    maskArray.push({value: '1', text: '123.321.xxx.xxx'});
    maskArray.push({value: '2', text: '123.xxx.xxx.xxx'});
    maskArray.push({value: '3', text: 'YBA6DCZH1'});

    var defPostReplyStatus = DataEngine.getConfigValue('gl_tprs',false);
    if(defPostReplyStatus == null)
        defPostReplyStatus = 4;

    ticketStatusArray.push({value: '0', text: tid('ticket_status_0')});
    ticketStatusArray.push({value: '1', text: tid('ticket_status_1')});
    ticketStatusArray.push({value: '4', text: tid('ticket_status_4')});
    ticketStatusArray.push({value: '2', text: tid('ticket_status_2')});
    ticketStatusArray.push({value: '3', text: tid('ticket_status_3')});

    this.m_Settings = [
        {name:'Chats', title: tid('chats'), icon:'comments', groups: [
            {name: 'General', title: tid('general'), controls: [
                {name:'gl_ogcm', standard:true, type:'bool', value: false, top:'half', title: tid('offline_group_messages')},
                {name:'gl_ocpd', standard:true, type:'bool', value: true, top:'half',title: tid('change_data')},
                {name:'gl_bolf', standard:true, type:'bool', value: false, top:'half',title: tid('show_bot_form')},
                {name:'gl_actt', standard:true, type:'bool', value: false, top:'half',title: tid('auto_chat_to_ticket')},
                {name:'gl_cmsp', standard:true, type:'bool', value: false, top:'half',title: tid('sneak_peek_message')}
            ]},
            {name: 'CallDistribution', title: tid('call_distribution'), controls: [
                {name:'gl_alloc_mode_label', type:'label', title: tid('offer_chats_to'), top:'half'},
                {name:'gl_alloc_mode_0', type:'radio', group: 'chat-dist-select', title: tid('one_operator'),  value: true},
                {name:'gl_alloc_mode_1', type:'radio', group: 'chat-dist-select', title: tid('all_operators'), top:'half',value: false},
                {name:'gl_save_op', standard:true, type:'bool', value: false, title: tid('recurring_chats'), top:'single', bottom:'single'}
            ]},
            {name: 'WaitingTime', title: tid('waiting_time'), controls: [
                {name:'gl_mqwt_c', type:'bool', value: 0, title: tid('max_time_in_queue')},
                {name:'gl_mqwt', standard:true, type:'int', value: 5, title: '', class:'gl_mqwt_c', titleright: tid('minutes'), left:'single', top:'half'},
                {name:'gl_mcwt_c', type:'bool', value: 0, title: tid('max_time_accept'), top:'double'},
                {name:'gl_mcwt', standard:true, type:'int', value: 30, title: '', class:'gl_mcwt_c', titleright: tid('seconds'),  left:'single', top:'half'},
                {name:'gl_mcwf_1', type:'radio', group: 'gl_mcwf-select', class:'gl_mcwt_c', title: tid('then_to_next'), value: true, left:'single', top:'single'},
                {name:'gl_mcfc_c', type:'bool', value: 0, title: tid('max_cycles'), class:'gl_mcwf_1', top:'single', left:'double'},
                {name:'gl_mcfc', standard:true, type:'int', value: 30, title: '', left:'triple', class:'gl_mcfc_c gl_mcwf_1', top:'half'},
                {name:'gl_mcwf_0', type:'radio', group: 'gl_mcwf-select', class:'gl_mcwt_c', title: tid('then_leave_message'), value: false, left:'single', top:'double'},
                {name:'gl_wmes_c', type:'bool', value: 0, title: tid('waiting_message'), top:'double'},
                {name:'gl_wmes', standard:true, type:'int', value: 0, title: '', class:'',  left:'single', titleright: tid('seconds'), bottom:'single', top:'half'},
                {name:'gl_acco', standard:true, type:'bool', value: 0, title: tidc('chat_auto_close_operator'), top:'double'},
                {name:'gl_ccoa', standard:true, type:'int', value: 180, title: '', class:'',  left:'single', titleright: tid('seconds'), titleleft: tidc('after'), bottom:'single', top:'half'},
                {name:'gl_accc', standard:true, type:'bool', value: 0, title: tidc('chat_auto_close_customer'), top:'double'},
                {name:'gl_ccca', standard:true, type:'int', value: 180, title: '', class:'',  left:'single', titleright: tid('seconds'), titleleft: tidc('after'), bottom:'single', top:'half'}
            ]},
            {name: 'Queue', title: tid('queue'), controls: [
                {name:'gl_sho_qu_inf', standard:true, type:'bool', value: 0, title: tid('show_queue_inf')},
                {name:'gl_sim_ch_l', type:'label', title: tid('handle_chats'), class:'gl_sho_qu_inf',  left:'single', top:'single'},
                {name:'gl_sim_ch', standard:true, type:'int', value: 0, title: '', class:'gl_sho_qu_inf',  left:'single', bottom:'single'}
            ]},
            {name: 'ExternalChatWindow', title: tid('external_chat_window'), controls: [
                {name:'wcl_window_width', standard:true, type:'int', value: 0, title: tid('width'), titleright:'px'},
                {name:'wcl_window_height', standard:true, type:'int', value: 0, title: tid('height'), titleright:'px', top:'single'}
            ]}
        ]},
        {name:'ChatInvites', title: tid('chat_invites'), icon:'comment', groups: [
            {name: 'General', title: tid('general'), controls: [
                {name:'gl_itim_c', type:'bool', value: 0, title: tid('cancel_invite')},
                {name:'gl_itim', type:'int', value: 60, title: '', top:'half', titleright: tid('seconds'), left:'single'},
                {name:'gl_imda_label', type:'label', title: tidc('target_man_invite'), top:'double'},
                {name:'gl_imda_0', type:'radio', group: 'gl_imda', title: tid('target_sender'), value: true},
                {name:'gl_imda_1', type:'radio', group: 'gl_imda', title: tid('target_all'), top:'half', bottom:'single', value: false},
                {name:'gl_iada_label', type:'label', title: tidc('target_auto_invite'), top:'double'},
                {name:'gl_iada_0', type:'radio', group: 'gl_iada', title: tid('target_sender'), value: true},
                {name:'gl_iada_1', type:'radio', group: 'gl_iada', title: tid('target_all'), top:'half', bottom:'single', value: false},
                {name:'gl_cips', standard:true, type:'bool', value: false, top:'double', title: tid('play_sound')}
            ]}
        ]},
        {name:'Tickets', title: tid('tickets'), icon:'envelope',groups: [
            {name: 'General', title: tid('general'), controls: [
                {name:'gl_om_mode_Internal', type:'radio', group: 'gl_om_mode', title: tid('ticket_system_use')},
                {name:'gl_om_mode_HTTP', type:'radio', group: 'gl_om_mode', title: tid('ticket_system_redir'), top:'single'},
                {name:'gl_om_http', standard:true, class:'gl_om_mode_HTTP', type:'string', value: 0, top:'half',title: '', left:'single'},
                {name:'gl_om_pop_up', standard:true, class:'gl_om_mode_HTTP', type:'bool', value: 0, top:'half',title: tid('open_in_chat'), left:'single'},
                {name:'gl_dtfbc', standard:true, type:'bool', value: 0, top:'double',title: tid('no_ticket_bot')},
				{name:'gl_mmvt', standard:true, type:'bool', value: 1, top:'single',title: tid('merge_messages')},
                {name:'gl_tprs_label', type:'label', title: tidc('ticket_after_reply_status'), top:'double'},
                {name:'gl_tprs', standard: true, type:'array', options: ticketStatusArray, title: '', value: defPostReplyStatus},
                {name:'gl_cpta', standard:true, type:'int', value: 14, top:'double', title: tidc('close_ticket_after'), titleright: tid('days')},
                {name:'gl_tidt', standard:true, type:'int', value: 0, title: tid('ticket_due_time'), titleright: tid('hours'), top:'double',bottom:'single'}
            ]},
            {name: 'Composer', title: tid('composer'), controls: [
                {name:'gl_uhic', type:'bool', value: 1, standard: true, title: tid('composer_use_html'), top:'half'}
            ]},
            {name: 'Callback', title: tid('callback'), controls: [
                {name:'gl_cb_mode', type:'bool', value: 0,standard:true, title: tid('ticket_system_redir'), top:'half'},
                {name:'gl_cb_http', standard:true, class:'gl_cb_mode', type:'string', value: '', top:'half',title: '', left:'single'},
                {name:'gl_cb_pop_up', standard:true, class:'gl_cb_mode', type:'bool', value: 0, top:'half',title: tid('open_in_chat'), left:'single'}
            ]},
            {name: 'TicketSubs', title: tid('statuses')+' / '+tid('sources'), controls: [], custom: true }
        ]},
        {name:'VisitorMonitoring', title: tid('monitoring'), icon:'search',groups: [
            {name: 'Monitoring', title: tid('monitoring'), controls: [
                {name:'gl_vmac', standard: true, type:'bool', value: true, title: tid('monitoring_active')},
                {name:'gl_vmcc', standard: true, type:'bool', value: true, top:'half', title: tid('monitoring_active') + ' (' + tid('chats') + ')'},
                {name:'gl_hide_inactive',standard: true, type:'bool', value: true, top:'half', title: tidc('hide_inactive')},
                {name:'gl_inti', standard: true, type:'int', value: 300, title: '',titleright:tid('minutes'), left:'single', top:'half'},
                {name:'gl_hvjd', standard: true, type:'bool', value: true, top:'single', title: tid('hide_js')},
                {name:'gl_dvhd', standard: true, type:'int', value: 300, title: tidc('delete_history'),titleright:tid('days'), top:'double', not:['lzch']}
            ]},
            {name: 'GeoTracking', title: 'Geo Tracking', controls: [
                {name:'gl_use_ngl', standard: true, type:'bool', value: true, title: 'Geo Tracking ' + tid('active')}
            ]},
            {name: 'Domains', title: 'Domains', controls: [
                {name:'gl_doma', standard: true, type:'string', value: '', title: tidc('filter_domains')},
                {name:'gl_bldo_label', class:'text-gray text-regular', type:'label', title: tidc('wildcard',', ') + tidc('example')+' http*domain1.*, http*domain2.*', top:'half'},
                {name:'gl_bldo_0', type:'radio', group: 'gl_bldo', title: tid('whitelist'), top:'single', value: true},
                {name:'gl_bldo_1', type:'radio', group: 'gl_bldo', title: tid('blacklist'), top:'half', value: false}
            ]}
        ]},
        {name:'KnowledgeBase', title: tid('knowledgebase'),icon:'life-ring', groups: [
            {name: 'General', title: tid('general'), controls: [
                {name:'gl_kbsp', standard: true, type:'bool', value: false, title: tid('kb_startpage')},
                {name:'gl_knbr', standard: true, type:'bool', value: true, title: tid('kb_rate'), top:'half'},
                {name:'gl_kbpa', standard: true, type:'bool', value: true, title: tid('popular_articles'), top:'half'},
                {name:'gl_knsa', standard: true, type:'bool', value: true, title: tid('show_avatars'), top:'half'},
                {name:'gl_kbst', standard: true, type:'bool', value: true, title: tid('show_tags'), top:'half'},
                {name:'gl_kbsl', standard: true, type:'bool', value: true, title: tid('language_selection'), top:'half'},
                {name:'gl_kbmr', standard: true, type:'bool', value: false, title: 'SEO friendly URLs (mod_rewrite, rename _htaccess_mod_rewrite to .htaccess)', top:'half'}
            ]},
            {name: 'KBTemplate', title: 'Template', controls: [
                {name:'gl_kbdc', standard: true, type:'color', value: '#2e8ae5', title: tidc('primary_color'), top:'double'}
            ], custom:true},
            {name: 'Integration', title: tid('integration'), controls: [
                {name:'gl_kbin_0', type:'radio', group: 'gl_kbin', title: tid('kb_in_internal'), value: true},
                {name:'gl_kbin_1', type:'radio', group: 'gl_kbin', title: tid('kb_in_external'), top:'half', value: false},
                {name:'gl_kbin_2', type:'radio', group: 'gl_kbin', title: tid('kb_in_embedded'), top:'half', value: false},
                {name:'gl_kurl', standard: true, type:'string', value: '', left:'single', top: 'single', title:'', titleleft: tidc('url')}
            ]},
            {name: 'Search', title: tid('search'), controls: [
                {name:'gl_knbs', standard: true, type:'bool', top:'half', value: true, title: tid('kb_auto_search')},
                {name:'gl_knbq', standard: true, type:'bool', top:'half', value: true, title: tid('kb_queue_search')},
                {name:'gl_kbml', standard: true, type:'int', value: 4, title: tidc('kb_search_length'), top:'double'},
                {name:'gl_kbsb_label', class:'', type:'label', title: tidc('kb_search_base'), top:'double'},
                {name:'gl_kbsb_0', type:'radio', group: 'gl_kbsb', title: tid('kb_tags_title_content'), value: true},
                {name:'gl_kbsb_1', type:'radio', group: 'gl_kbsb', title: tid('kb_tags_title'), top:'half', value: false},
                {name:'gl_kbsb_2', type:'radio', group: 'gl_kbsb', title: tid('tags'), top:'half', value: false}
            ]}
        ]},
        {name:'Feedbacks', title: tid('feedbacks'), icon:'thumbs-up', groups: [
            {name: 'General', title: tid('general'), controls: [
                {name:'gl_fboe', standard: true, type:'bool', value: 0, title: tid('fb_exit')},
                {name:'gl_fbob', standard: true, type:'bool', value: 0, title: tid('bot_chat_feedback'), top:'half'}
            ]},
            {name: 'FeedbackCriteria', title: tid('criteria'), controls: [], custom:true}
        ]},
        {name:'Emails', title: tid('emails'), icon:'envelope', groups: [
            {name: 'EmailGeneral', title: tid('general'), controls: [
                {name:'gl_avhe', standard:true, type:'bool', value: false, title: tid('store_html_emails')}
            ]},
            {name: 'EmailAccounts', title: tid('accounts'), controls: [], custom: true },
            {name: 'EmailChatTranscripts', title: tid('chat_transcripts'), controls: [
                {name:'gl_soct', standard:true, type:'bool', config: '', value: false, title: tid('ct_to_customer')},
                {name:'gl_scto', standard:true, type:'bool', config: '', value: false, top:'half', title: tid('ct_to_op')},
                {name:'gl_sctb', standard:true, type:'bool', config: '', value: false, top:'half', title: tid('ct_bots')},
                {name:'gl_sctg', standard:true, type:'bool', config: '', value: false, top:'half', title: tid('ct_to_group')},
                {name:'gl_scct', standard:true, type:'string', config: '', value: '', top: 'double', title: tid('ct_to_custom')},
                {name:'gl_uvec', standard:true, type:'bool', config: '', value: '', top: 'double', title: tid('ct_fake_sender')},
                { name: 'gl_retr', standard: true, type: 'bool', config: '', value: '', top: 'half', title: tid('ct_change') },
                { name: 'gl_oact', standard: true, type: 'bool', config: '', value: false, top: 'half', title: tid('send_empty_transcripts') }
            ], custom: true },
            {name: 'EmailTickets', title: tid('tickets'), controls: [
                {name:'gl_ssom', standard:true, type:'bool', config: '', value: false, title: tid('tar_to_customer')},
                {name:'gl_sgom', standard:true, type:'bool', config: '', value: false, top:'half', title: tid('tar_to_group')},
                {name:'gl_scom', standard:true, type:'string', config: '', value: '', top: 'double', title: tid('tar_to_custom')},
                {name:'gl_scoo', standard:true, type:'string', config: '', value: '', top: 'single', title: tid('tor_to_custom')},
                {name:'gl_usmasend', standard:true, type:'bool', config: '', value: false, top: 'double', title: tid('tar_fake_sender')}
            ], custom: true },
            {name: 'EmailReports', title: tid('reports'), controls: [
                {name:'gl_sred', standard:true, type:'string', config: '', value: '', title: tid('emr_daily')},
                {name:'gl_srem', standard:true, type:'string', config: '', value: '', top: 'single', title: tid('emr_monthly')},
                {name:'gl_srey', standard:true, type:'string', config: '', value: '', top: 'single', bottom: 'single', title: tid('emr_yearly')}
            ], custom: true }
        ]},
        {name:'Images', title: tid('images'), icon:'file-image-o',iconcss:'margin-left:4px;',groups: [
            {name: 'HeaderImage', title: tid('header_image'), controls: [], custom: true },
            {name: 'BackgroundImage', title: tid('background_image'), controls: [], custom: true }
        ]},
        {name:'Sounds', title: tid('sounds'), icon:'file-image-o',iconcss:'margin-left:4px;',groups: [
            {name: 'SoundsVisitor', title: tid('visitor'), controls: [], custom: true},
            {name: 'SoundsOperator', title: tid('operator'), controls: [], custom: true}
        ]},
        {name:'Licensing', title: tid('licensing'), icon:'key', groups: [
            {name: 'Licensing', title: tid('licensing'), controls: [], custom: true }
        ]},
        {name:'Tags', title: tid('tags'), icon:'key', groups: [
            {name: 'TagSettings', title: tid('general'), controls: [
                {name:'gl_ofct', type:'bool', standard: true, title: tid('force_chat_tags'), value: ''},
                {name:'gl_oftt', type:'bool', standard: true, top:'half', title: tid('force_ticket_tags'), value: ''}
            ]},
            {name: 'Tags', title: tid('tags'), controls: [
                {name:'gl_tags', type:'tageditor', standard: true, title: tidc('tags'), value: ''}
            ]}
        ]},
        {name:'Server', title: tid('server'), icon:'server', groups: [
            {name: 'Misc', title: tid('general'), controls: [
                {name:'gl_site_name', standard:true, type:'string', config: '', value: '', title: tidc('website_name')},
                {name:'gl_url', standard:true, type:'string', title: tidc('server_url') + ' <span class="text-gray">('+tidc('example',': ') + DataEngine.getServerUrl('') + ')</span>', top:'double', value: '', not:['lzch']},
                {name:'gl_url_detect', standard:true, type:'bool', title: tid('detect_url'), top:'half', value: true, not:['lzch']},
                {name:'gl_lzid', standard:true, type:'string', value: '', top: 'double', title: tidc('server_id'), not:['lzch']},
                {name:'gl_sipp', standard:true, type:'string', value: '', top: 'single', title: 'PHP IP Server Param:', not:['lzch']},
                {name:'gl_tizo_label', type:'label', title: tidc('timezone'), top:'single'},
                {name:'gl_tizo', standard: true, type:'array', options: tzArray, title: '', value: defTizo},
                {name:'gl_deac', standard:true, type:'bool', value: false, title: tid('deac_server'), top:'single', bottom:'single'}
            ]},
            {name: 'Performance', title: tid('performance'), controls: [
                {name:'poll_frequency_clients', standard:true, type:'int', value: 0, title: tidc('poll_frequency_clients'), titleright:tid('seconds'), top:'single', not:['lzch']},
                {name:'poll_frequency_tracking', standard:true, type:'int', value: 0, title: tidc('poll_frequency_tracking'), titleright:tid('seconds'), top:'single', not:['lzch']},
                {name:'m_PerformanceInfo', type:'link', value: 'https://chat.livezilla.net/knowledge-base/configuration/en-livezilla-performance/', title: tid('further_information'), top:'single'}
            ], not:['lzch']},
            {name: 'Caching', title: tid('caching'), controls: [
                {name:'gl_caen', standard: true, type:'array', options: shmArray, title: '', value:defshm, not:['lzch']}
            ], not:['lzch']},
            {name: 'Authentication', title: tid('auth') + ' (LDAP)', controls: [
                {name:'gl_ldap_0', type:'radio', group: 'auth-select', title: tid('auth_standard'), top:'half', value: true},
                {name:'gl_ldap_1', type:'radio', group: 'auth-select', title: tid('auth_LDAP'), top:'single', value: false},
                {name:'gl_ldho', standard:true, class: 'gl_ldap', type:'string', value: '', top: 'single', left:'single', title: 'LDAP Host:'},
                {name:'gl_ldpo', standard:true, class: 'gl_ldap', type:'int', value: 0, title: 'LDAP Port:', left:'single',bottom:'single', top:'single'},
                {name:'gl_ldprot', class: 'ui-disabled', type:'string', value: 'Version 3', title: 'LDAP Protocol:', left:'single',bottom:'single', top:'single'},
                {name:'gl_lddn', standard:true, class: 'gl_ldap', type:'string', value: 'Version 3', title: 'LDAP Bind DN:', left:'single',bottom:'single', top:'single'},
                {name:'gl_ldbp', standard:true, class: 'gl_ldap', type:'password', value: '', title: 'LDAP Bind Password:', left:'single',bottom:'single', top:'single'},
                {name:'gl_ldsd', standard:true, class: 'gl_ldap', type:'string', value: '', title: 'LDAP Search DN:', left:'single',bottom:'single', top:'single'}
            ], custom:'bottom'},
            {name: 'Filter', title: tid('filter'), controls: [
                {name:'gl_sfa', standard:true, type:'bool', value: false, title: tid('spam_filter')},
                {name:'gl_sfv', class:'gl_sfa',standard:true, type:'string', value: '', top: 'half', title: tid('create_spam_filter'), left:'single'},
                {name:'gl_sfv_label', class:'gl_sfa text-gray', type:'label', title: tid('wildcard'), left:'single', top:'half'},
                {name:'gl_sfa_label', class:'gl_sfa', type:'label', title: tidc('applies_to'), top:'single', left:'single'},
                {name:'gl_sfc', standard:true, class:'gl_sfa', type:'bool', value: false, title: tid('chats'), left:'single'},
                {name:'gl_sft', standard:true, class:'gl_sfa', type:'bool', value: false, top:'half', title: tid('tickets'), left:'single'}
            ]},
            {name: 'Encryption', title: tid('encryption'), controls: [
                {name:'gl_auhs', standard:true, type:'bool', value: false, title: tid('require_https')},
                {name:'gl_rhts_label', type:'label', title: tidc('use_https'), top:'double'},
                {name:'gl_rhts_0', type:'radio', group: 'gl_rhts', title: tid('https_auto'), value: true},
                {name:'gl_rhts_1', type:'radio', group: 'gl_rhts', title: tid('https_always'), top:'half', bottom:'single', value: false}
            ]},
            {name: 'FileUploads', title: tid('file_uploads'), controls: [
                {name:'gl_fubl', standard:true, type:'string', value: '', title: tidc('blacklist')},
                {name:'ggl_fubl_ex', class:'text-gray', type:'label', title: tidc('wildcard','. ')+tidc('example')+' *.exe,*.php,*.doc', top:'half'},
                {name:'gl_fuwl', standard:true, type:'string', value: '', top: 'single', title: tidc('whitelist')},
                {name:'ggl_fuwl_ex', class:'text-gray', type:'label', title: tidc('wildcard','. ')+tidc('example')+' *.exe,*.php,*.doc', top:'half'}
            ]}
        ]},
        {name:'Database', title: tid('database'), icon:'database', groups: [
            {name: 'Pruning', title: tid('pruning'), controls: [
                {name:'gl_rm_chats', standard:true, type:'bool', value: 0, title: tid('pr_chats')},
                {name:'gl_rm_chats_time', standard:true, multi:86400, type:'int', value: 0, title: '', titleright: tid('days'), left:'single',bottom:'single'},
                {name:'gl_rm_bc', standard:true, type:'bool', value: 0, title: tid('pr_bot_chats')},
                {name:'gl_rm_bc_time', standard:true, multi:86400, type:'int', value: 0, title: '', titleright: tid('days'), left:'single',bottom:'single'},
                {name:'gl_rm_oc', standard:true, type:'bool', value: 0, title: tid('pr_op_chats')},
                {name:'gl_rm_oc_time', standard:true, multi:86400, type:'int', value: 0, title: '', titleright: tid('days'), left:'single',bottom:'single'},
                {name:'gl_rm_gc', standard:true, type:'bool', value: 0, title: tid('pr_gr_chats')},
                {name:'gl_rm_gc_time', standard:true, multi:86400, type:'int', value: 0, title: '', titleright: tid('days'), left:'single',bottom:'single'},
                {name:'gl_rm_rt', standard:true, type:'bool', value: 0, title: tid('pr_feedback')},
                {name:'gl_rm_rt_time', standard:true, multi:86400, type:'int', value: 0, title: '', titleright: tid('days'), left:'single',bottom:'single'},
                {name:'gl_rm_om', standard:true, type:'bool', value: 0, title: tid('pr_tickets')},
                {name:'gl_rm_om_time', standard:true, multi:86400, type:'int', value: 0, title: '', titleright: tid('days'), left:'single',bottom:'single'},
                {name:'gl_rm_tid', standard:true, type:'bool', value: 0, title: tid('pr_del_tickets')},
                {name:'gl_rm_tid_time', standard:true, multi:86400, type:'int', value: 0, title: '', titleright: tid('days'), left:'single',bottom:'single'},
                {name:'gl_rm_tf', standard:true, type:'bool', value: 0, title: tid('pr_at_tickets')},
                {name:'gl_rm_tf_time', standard:true, multi:86400, type:'int', value: 0, title: '', titleright: tid('days'), left:'single',bottom:'single'},
                {name:'gl_rm_cf', standard:true, type:'bool', value: 0, title: tid('pr_at_chats')},
                {name:'gl_rm_cf_time', standard:true, multi:86400, type:'int', value: 0, title: '', titleright: tid('days'), left:'single',bottom:'single'}
            ]},
            {name: 'Database', title: tid('database'), controls: [
                {name:'m_DatabaseChange', type:'link', value: 'https://chat.livezilla.net/knowledge-base/troubleshooting/en-mysql-login-changed/', title: tid('change_mysql'), top:'single', persistent: false}
            ], custom:true}
        ]},
        {name:'DataPrivacy', title: tid('data_privacy'), icon:'shield', iconcss:'font-size:46px', groups: [
            {name: 'General', title: tid('data_privacy'), controls: [
                {name:'gl_maskip', standard: true, type:'bool', value: true, title: tidc('mask_ip')},
                {name:'gl_miat', standard: true, type:'array', options: maskArray, title: '', top:'half', value: defMask, left:'single'},
                {name:'gl_dnt', standard: true, type:'bool',top:'single', value: true, title: tid('respect_dnt')},
                {name:'gl_anra', standard: true, type:'bool',top:'half', value: true, title: tid('anon_feedback')},
                {name:'gl_sfnc', standard: true, type:'bool',top:'half', value: true, title: tid('full_chat_op_name')}
            ]},
            {name: 'Cookies', title: 'Cookies', controls: [
                {name:'gl_colt_c', type:'bool', value: false, title: tid('use_cookies')},
                {name:'gl_colt', type:'int', value: 75, title: tidc('cookie_lifetime'), left:'single', titleright: tid('days'), bottom:'single', top:'half'},
                {name:'gl_cooi', type:'bool', value: false, standard:true, top:'double', title: tid('opt_in_cookies')},
                //{name:'gl_cooi_call', type:'string', standard:false, value: lzm_commonTools.escapeHtml('<a href="javascript:LiveZilla.OptInCookies();">Allow Cookies</a>'), left:'single', title: tidc('opt_in_cookies_call')},
                //{name:'gl_cooo_call', type:'string', top:'double', standard:false, value: lzm_commonTools.escapeHtml('<a href="javascript:LiveZilla.OptOutCookies();">Disable and remove cookies</a>'), title: tidc('opt_out_cookies_call')},
                //{name:'gl_ntca_call', type:'string', top:'half', standard:false, value: lzm_commonTools.escapeHtml('<a href="javascript:LiveZilla.OptOutTracking();">Disable tracking</a>'), title: tidc('disable_tracking_call')}
                {name:'gl_co_link', type:'link', value: 'https://www.livezilla.net/widgetapi/en/', title: tid('further_information'), top:'double', persistent: false}
            ]}
        ]},
        {name:'Translation', title: tid('translation'), icon:'language', groups: [
            {name: 'General', title: tid('general'), controls: [
                {name:'gl_def_lang_label', type:'label', title: tidc('default_language')},
                {name:'gl_default_language', standard: true, type:'array', options: langArray, title: '', value: defLang}
            ]},
            {name: 'AutoTranslation', title: tid('auto_translation')+' (powered by Google Translate)', controls: [
                {name:'gl_otrs', class:'', standard:true, type:'string', value: '', top: 'half', title: 'Google Translate API Key:'},
                {name:'gl_otrs_link', type:'link', value: 'https://chat.livezilla.net/knowledge-base/configuration/en-realtime-translation-chats/', title: tid('further_information'), top:'single', persistent: false}
            ]}
        ]},
        {name:'Inputs', title: tid('input_fields'), icon:'keyboard-o', groups: [
            {name: 'Inputs', title: tid('input_fields'), controls: [], custom: true }
        ]},
        {name:'Statistics', title: tid('statistics'), icon:'bar-chart', iconcss:'font-size:32px',groups: [
            {name: 'Statistics', title: tid('statistics'), controls: [
                {name:'gl_stat', standard:true, type:'bool', value: false, title: tid('create_reports')},
                {name:'gl_st_upinh', standard:true, type:'int', value: 6, top:'double', bottom:'double', titleright: tid('hours'), title: tidc('updt_reports')},
                {name:'gl_st_muvl', standard:true, type:'int', value: 500, top:'double', bottom:'double', titleright: tid('visitors'), title: tidc('max_users_list')}
            ]}
        ]},
        {name:'Mobile', title: tid('mobile'),icon:'mobile-phone', iconcss:'margin-left:5px;margin-top:-5px;font-size:60px',groups: [
            {name: 'MobileApp', title: 'LiveZilla APPs', controls: [
                {name:'gl_mpm', standard:true, type:'bool', value: false, title: tid('mobile_push')},
                {name:'gl_apvm', standard:true, type:'bool', value: false, top:'half', title: tid('monitoring')}
            ]}
        ]}
    ];
    this.ApplyConfig();
}

ServerConfiguration.prototype.ApplyConfig = function() {

    var i,prop;
    for (i=0; i<DataEngine.global_configuration.site[0].length; i++)
    {
        prop = UIRenderer.getSettingsProperty(this.m_Settings,DataEngine.global_configuration.site[0][i].key);
        if(prop)
        {
            if(prop.type == 'bool')
                prop.value = (DataEngine.global_configuration.site[0][i].value==1);
            else if(prop.type == 'password' || prop.type == 'string' || prop.type == 'int' || prop.type == 'tageditor' || prop.type == 'color')
            {
                if(!(d(prop.standard) && !prop.standard))
                    prop.value = DataEngine.global_configuration.site[0][i].value.trim();
            }
        }
    }

    for (i=0; i<DataEngine.global_configuration.toplevel.length; i++)
    {
        prop = UIRenderer.getSettingsProperty(this.m_Settings,DataEngine.global_configuration.toplevel[i].key);
        if(prop){
            if(prop.type == 'bool')
                prop.value = (DataEngine.global_configuration.toplevel[i].value==1);
            else if(prop.type == 'string' || prop.type == 'int' || prop.type == 'tageditor' || prop.type == 'color')
            {
                if(!(d(prop.standard) && !prop.standard))
                    prop.value = DataEngine.global_configuration.toplevel[i].value.trim();
            }
        }
    }
};

ServerConfiguration.prototype.UpdateLicenseInfo = function() {

    var tda = 0,licenseCountNumber = 0,html = '',breakIt = false;
    var sid = DataEngine.getConfigValue('gl_lzid',true).value;
    var created = DataEngine.getConfigValue('gl_pr_cr',true).value;
    var isCSP = false, isNBL = false, isNGL = false, nglHash='',tdays,amount;
    this.m_crc3 = created+',';
    $("#sc-license-list tbody tr").each(function() {
        if(!breakIt && $(this).attr("data-type-key")=='OPR')
        {
            var hash = $(this).attr("data-hash");
            var serial = $(this).attr("data-serial");
            amount = DataEngine.getAmount(hash,sid,serial,CommonConfigClass.lz_major);
            tdays = DataEngine.calcTDays(hash,sid);

            if(tdays > 0)
                tda = tdays;

            if(amount===-1 || tdays > 0)
            {
                licenseCountNumber = -1;
                breakIt = true;
            }
            else
                licenseCountNumber += amount;
        }
        else if($(this).attr("data-type-key")=='CSP')
            isCSP = true;
        else if($(this).attr("data-type-key")=='NBL')
            isNBL = true;
        else if($(this).attr("data-type-key")=='NGL')
        {
            isNGL = true;
            nglHash = $(this).attr("data-hash");
        }
    });

    this.m_crc3 += ((isCSP) ? '1' : '-2') +',';
    this.m_crc3 += ((isNGL) ? '1' : '-2') +',';
    this.m_crc3 += ((isNBL) ? '1' : '-2') +',';
    this.m_crc3 += '1,';
    this.m_crc3 += ((tda > 0) ? '0' : ((licenseCountNumber != 0) ? licenseCountNumber : '-2')) +',';

    if(isNGL)
        this.m_crc3 += nglHash;

    if(tda > 0)
        html = '<span class="text-orange text-xl">'+tid('trial_info').replace('<!--d-->',tda)+'</span>';
    else if(licenseCountNumber != 0)
        html = '<span class="text-orange text-xl">'+tid('pro_info').replace('<!--o-->',(licenseCountNumber != -1) ? licenseCountNumber : 'Unlimited')+'</span>';
    else
        html= '<span class="text-green text-xl">LiveZilla ONE</span>';


    $('#sc-l-info').html('&nbsp;&nbsp;<span class="text-gray text-xl">' + tid('license') + ':</span>&nbsp;&nbsp;&nbsp;' + html);
};

ServerConfiguration.prototype.GetCustomForm = function(formType, obj) {
    var contentHtml = '',buttonline;
    var lzch = DataEngine.getConfigValue('gl_lzch',false) == 1;

    if(formType == 'EmailAccounts'){

        buttonline = '<br><div style="text-align:right;padding:8px 0;">' + lzm_inputControls.createButton('email-acc-<!--type-->-add','email_dialog_button','ServerConfiguration.__EmailAccountAction(\'add\', \'<!--type-->\');', tid('add'), '', '', {}, '', 30, 'd') + '</div>';
        var ea_out='', ea_in='';

        for(key in DataEngine.global_configuration.database['email'])
        {
            var ea = DataEngine.global_configuration.database['email'][key];
            var ea_row = this.GetEmailAccountRow(ea);
            if(ea.boxtype=='incoming')
                ea_in += ea_row;
            else
                ea_out += ea_row;
        }

        contentHtml = '<div class="top-space">';
        contentHtml += '<table id="email-acc-outgoing" class="visible-list-table lzm-unselectable alternating-rows-table">';
        contentHtml += '<thead><th colspan="2">'+tid('outgoing')+'</th></thead>';
        contentHtml += '<tbody>' + ea_out.replace(/<!--type-->/g,'outgoing') + '</tbody></table>' + buttonline.replace(/<!--type-->/g,'outgoing');
        contentHtml += '</div><br><br><div class="top-space">';
        contentHtml += '<table id="email-acc-incoming" class="visible-list-table lzm-unselectable alternating-rows-table">';
        contentHtml += '<thead><th colspan="2">'+tid('incoming')+'</th></thead>';
        contentHtml += '<tbody>' + ea_in.replace(/<!--type-->/g,'incoming') + '</tbody></table>' + buttonline.replace(/<!--type-->/g,'incoming');
        contentHtml += '</div>';
    }
    else if(formType == 'KBTemplate')
    {
        contentHtml += '<div class="top-space bottom-space">' + lzm_inputControls.createButton('edit-kb-template-header','','ServerConfiguration.__EditKnowledgeBaseTemplate(\'HEADER\');', 'Header', '', '', {}, '', 30, 'd');
        contentHtml += lzm_inputControls.createButton('edit-kb-template-footer','','ServerConfiguration.__EditKnowledgeBaseTemplate(\'FOOTER\');', 'Footer', '', '', {'margin-left':'6px'}, '', 30, 'd') + '<br><br></div>';
    }
    else if(formType == 'TicketSubs'){

        var sc_html='', ss_html='', tsd = null;

        for (var aChannel=0; aChannel<ChatTicketClass.m_TicketChannels.length; aChannel++) {
            var sc = ChatTicketClass.m_TicketChannels[aChannel];
            var sc_row = this.GetTicketSubRow(sc,'source','source');
            sc_html += sc_row;
            for(key in DataEngine.global_configuration.database['tsd'])
            {
                tsd = DataEngine.global_configuration.database['tsd'][key];
                if(tsd.type == 1 && tsd.parent == sc.index)
                {
                    sc_row = this.GetTicketSubRow(tsd,'source','sub');
                    sc_html += sc_row;
                }
            }
        }

        for (var aStatus=0; aStatus<ChatTicketClass.m_TicketStatuses.length; aStatus++) {
            var ss = ChatTicketClass.m_TicketStatuses[aStatus];
            var ss_row = this.GetTicketSubRow(ss,'status','status');
            ss_html += ss_row;
            for(key in DataEngine.global_configuration.database['tsd'])
            {
                tsd = DataEngine.global_configuration.database['tsd'][key];
                if(tsd.type == 0 && tsd.parent == ss.index)
                {
                    ss_row = this.GetTicketSubRow(tsd,'status','sub');
                    ss_html += ss_row;
                }
            }
        }

        contentHtml = '<table><tr><td style="width:310px;vertical-align:top;"><fieldset class="lzm-fieldset-full" style="max-width:300px;"><legend>'+tid('statuses')+'</legend>';
        contentHtml += '<table id="ticket-sub-statuses" class="visible-list-table lzm-unselectable alternating-rows-table"><tbody>' + ss_html.replace(/<!--type-->/g,'sources');
        contentHtml += '</tbody></table>';
        contentHtml += '</fieldset></td><td style="width:10px;"></td><td style="width:310px;vertical-align:top;"><fieldset class="lzm-fieldset-full" style="max-width:300px;"><legend>'+tid('sources')+'</legend>';
        contentHtml += '<table id="ticket-sub-sources" class="visible-list-table lzm-unselectable alternating-rows-table"><tbody>' + sc_html.replace(/<!--type-->/g,'statuses');
        contentHtml += '</tbody></table>';
        contentHtml += '</fieldset></td><td></td></tr></table>';
    }
    else if(formType == "Licensing"){
        contentHtml = '<table id="sc-license-list" class="visible-list-table lzm-unselectable alternating-rows-table"><thead><tr>' +
            '<th style="text-align:center;width:50px;">#</th>' +
            '<th style="text-align:center;width:80px;">'+tid('amount')+'</th>' +
            '<th style="text-align:center;width:130px;">'+tid('type')+'</th>' +
            '<th style="text-align:center;width:210px;">'+tid('serial')+'</th>' +
            '<th></th></tr></thead><tbody>';

        var isOPR = false;
        var licNumb = 1;
        var licenseframe = DataEngine.getConfigValue('gl_licl',true);

        try
        {
            if(licenseframe != null)
                for (var subkey in licenseframe.subkeys)
                {
                    var sid = DataEngine.getConfigValue('gl_lzid',true).value;
                    var lobj = lzm_commonTools.phpUnserialize(lz_global_base64_decode(lz_global_base64_decode(licenseframe.subkeys[subkey].toString())));
                    if(lobj != null)
                    {
                        var amount = DataEngine.getAmount(lobj[0],sid,lobj[1],CommonConfigClass.lz_major);
                        var tdays = DataEngine.calcTDays(lobj[0],sid);

                        if(amount===-1 || tdays > 0)
                            amount = "Unlimited";

                        if(tdays==0 && lobj[1] == 'TRIAL' && amount == 0)
                        {
                            // ex trial
                        }
                        else
                        {
                            contentHtml += this.GetLicenseRow(licNumb.toString(),amount,'LiveZilla PRO','OPR',lobj[1],lobj[0], false, tdays==0);
                            licNumb++;
                            isOPR = true;
                        }
                    }
                }
        }
        catch(ex)
        {
            deblog(ex);
        }

        var nbllicense = DataEngine.getConfigValue('gl_pr_nbl',true);
        var csplicense = DataEngine.getConfigValue('gl_pr_csp',true);
        var ngllicense = DataEngine.getConfigValue('gl_pr_ngl',true);

        if(nbllicense != null)
        {
            contentHtml += this.GetLicenseRow(licNumb++,1,'Backlink Removal','NBL','-',lz_global_base64_decode(nbllicense.value), true, true);
        }

        if(ngllicense != null && isOPR)
        {
            //contentHtml += this.GetLicenseRow(licNumb++,1,'Geo Tracking','NGL','-',lz_global_base64_decode(ngllicense.value), false, true);
        }

        if(csplicense != null)
        {
            contentHtml += this.GetLicenseRow(licNumb++,1,'Startpage','CSP','-',lz_global_base64_decode(csplicense.value), false, true);
        }

        contentHtml += '<tr style="display:'+((licNumb>1)?'none':'')+';" id="sc-none"><td colspan="5" style="text-align: center;background: #fff;font-style: italic;">'+tid('none')+'</td></tr>';
        contentHtml += '<tr><td colspan="11" style="background:#fff;"></td></tr>';
        contentHtml += '<tr><td id="sc-l-info" colspan="4" style="background:#fff;"></td><td style="background:#fff;text-align:right;">';

        if(!lzch)
        {
            contentHtml += lzm_inputControls.createButton('sc-buy-key','','window.open(\'https://www.livezilla.net/shop/en/?action=preview\');', tid('buy'), '', '', {'padding': '10px 15px', 'margin-right':'6px'}, '', 30, 'd');
            contentHtml += lzm_inputControls.createButton('sc-add-license-key','','addLicenseKey();', tid('add_license'), '', '', {'padding': '10px 35px'}, '', 30, 'd');
        }

        contentHtml += '</td></tr></tbody></table>';
        setTimeout('lzm_chatDisplay.ServerConfigurationClass.m_Config.UpdateLicenseInfo();',200);
        return contentHtml;
    }
    else if(formType == "Inputs"){
        var inpc= '<tr><td colspan="3" style="text-align:center;"><b>'+tid('custom')+'</b></td><td colspan="7"><hr></td></tr>', inps='<tr><td style="text-align:center;" colspan="3"><b>'+tid('standard')+'</b></td><td colspan="7"><hr></td></tr>';
        contentHtml = '<table id="sc-inputs-list" class="visible-list-table lzm-unselectable"><thead><tr>' +
            '<th style="text-align:center;width:70px;">ID</th>' +
            '<th style="text-align:center;">'+tid('active')+'</th>' +
            '<th style="text-align:center;">'+tid('cookie')+'</th>' +
            '<th>'+tid('name')+'</th>' +
            '<th>'+tid('input_type')+'</th>' +
            '<th>'+tid('caption')+'</th>' +
            '<th>'+tid('info_box')+'</th>' +
            '<th>'+tid('position')+'</th>' +
            '<th>'+tid('value')+'</th>' +
            '<th style="text-align:center;width:100px;">'+tid('validation')+'</th></tr>';

        var inpList = (typeof obj != 'undefined') ? obj : DataEngine.inputList.objects;
        for (var key in inpList)
        {
            var obj = inpList[key];
            var rowHtml = DataEngine.inputList.getInputHtmlRow(obj);
            if(parseInt(key)>=100)
                inps += rowHtml;
            else
                inpc += rowHtml;
        }
        contentHtml += '</thead><tbody>';
        contentHtml += inps+inpc;
        contentHtml += '<tr><td colspan="11"><hr></td></tr></tbody></table><br><div class="bottom-space" style="text-align:right;">';

        contentHtml += lzm_inputControls.createButton('ihelpbutton','','window.open(\'https://chat.livezilla.net/knowledge-base/configuration/en-custom-chat-input-fields/\');', tid('help'), '', '', {'margin-right':'6px'}, '', 30, 'd');
        contentHtml += lzm_inputControls.createButton('irestodef','','resetInputFields();', tid('reset_default'), '', '', {}, '', '','d') + '</div>';
    }
    else if(formType == "Database"){
        contentHtml = '';
        contentHtml += '<table style="width:500px;" class="visible-list-table lzm-unselectable alternating-rows-table"><tbody>';
        contentHtml += '<tr><td>MySQL Engine</td><td>'+DataEngine.getConfigValue('gl_db_eng',false)+'</td></tr>';
        contentHtml += '<tr><td>MySQL Extension</td><td>'+DataEngine.getConfigValue('gl_db_ext',false)+'</td></tr>';
        contentHtml += '<tr><td>MySQL Host</td><td>'+DataEngine.getConfigValue('gl_db_host',false)+'</td></tr>';
        contentHtml += '<tr><td>MySQL User</td><td>*********</td></tr>';
        contentHtml += '<tr><td>MySQL Password</td><td>*********</td></tr>';
        contentHtml += '<tr><td>MySQL Database</td><td>'+DataEngine.getConfigValue('gl_db_name',false)+'</td></tr>';
        contentHtml += '<tr><td>MySQL Prefix</td><td>'+DataEngine.getConfigValue('gl_db_prefix',false)+'</td></tr>';
        contentHtml += '</tbody></table>';
    }
    else if(formType == "FeedbackCriteria"){
        buttonline = '<div class="top-space-double" style="text-align:right;padding:8px 0;">' +
            lzm_inputControls.createButton('feedback-criteria-add','','feedbackAction(\'add\',\'\');', tid('add'), '', '', {}, '', 30, 'd') +
            lzm_inputControls.createButton('feedback-criteria-reset','','feedbackAction(\'reset\',\'\');', tid('reset_default'), '', '', {'margin-left':'6px'}, '', 30, 'd') + '</div>';
        contentHtml += '<table id="feedback-criteria" class="visible-list-table lzm-unselectable alternating-rows-table htight"><tbody>';

        for(key in DataEngine.global_configuration.database['fbc'])
            contentHtml += this.GetCriteriaRow(DataEngine.global_configuration.database['fbc'][key]);
        contentHtml += '</tbody></table>' + buttonline;
    }
    else if(formType == "Authentication"){
        contentHtml = '<div class="gl_ldap top-space-double bottom-space left-space-child">' +
        lzm_inputControls.createButton('ldap_test','','testLDAP();', tid('test'),'<i class="fa fa-bolt"></i>', '', {}, '', 30, 'd') +
        lzm_inputControls.createButton('ldap_info','','window.open(\'https://chat.livezilla.net/knowledge-base/configuration/en-livezilla-ldap-authenticate/\',\'_blank\');', tid('further_information'), '', '', {'margin-left':'4px'}, '', 30, 'd') + '</div>';
    }
    else if(formType == 'HeaderImage'){
        contentHtml = '<div id="sc-header-image" class="bottom-space"></div>';
        contentHtml += '<table><tr><td>';
        contentHtml += lzm_inputControls.createInput('gl_cali','',DataEngine.getConfigValue('gl_cali',false),'','','text','','','',tidc('url',': '));
        contentHtml += '</td><td style="text-align:right">';
        contentHtml += lzm_inputControls.createButton('sc-header-image-preview','','', tid('preview'), '', '', {'margin-right':'6px'}, '', 30, 'd');
        contentHtml += lzm_inputControls.createButton('sc-header-image-default','','', tid('default'), '', '', {'margin-right':'6px'}, '', 30, 'd');
        contentHtml += lzm_inputControls.createButton('sc-header-image-none','','', tid('none'), '', '', {'margin-top':'4px'}, '', 30, 'd');
        contentHtml += '</td></tr></table>';
    }
    else if(formType == 'BackgroundImage'){
        contentHtml = '<div id="sc-background-image" class="bottom-space"></div>';
        contentHtml += '<table><tr><td>';
        contentHtml += lzm_inputControls.createInput('gl_cahi','',DataEngine.getConfigValue('gl_cahi',false),'','','text','','','',tidc('url',': '));
        contentHtml += '</td><td style="text-align:right">';
        contentHtml += lzm_inputControls.createButton('sc-background-image-preview','','', tid('preview'), '', '', {'margin-right':'6px'}, '', 30, 'd');
        contentHtml += lzm_inputControls.createButton('sc-background-image-default','','', tid('default'), '', '', {'margin-right':'6px'}, '', 30, 'd');
        contentHtml += lzm_inputControls.createButton('sc-background-image-none','','', tid('none'), '', '', {'margin-top':'4px'}, '', 30, 'd');
        contentHtml += '</td></tr></table>';
    }
    else if(formType == 'SoundsVisitor' || formType == 'SoundsOperator'){

        var soundList = [
            {value: 's1_has', text: 'hide-and-seek'}
            ,{value: 's2_cc', text: 'communication-channel'}
            ,{value: 's3_sb', text: 'soft-bells'}
            ,{value: 's4_fyi', text: 'filling-your-inbox'}
            ,{value: 's5_c', text: 'confident'}
            ,{value: 's6_a', text: 'appointed'}
            ,{value: 's7_p', text: 'plucky'}
            ,{value: 's8_yhnm', text: 'you-have-new-message'}
            ,{value: 's9_a', text: 'arpeggio'}
            ,{value: 's10_ed', text: 'echoed-ding'}
            ,{value: 's11_lcs', text: 'long-chime-sound'}
            ,{value: 's12_02', text: 'office-2'}
            ,{value: 'message', text: 'classic-message'}
            ,{value: 'visitor', text: 'classic-visitor'}
            ,{value: 'wind', text: 'classic-wind'}
            ,{value: 'queue', text: 'classic-queue'}
            ,{value: 'visitor', text: 'classic-visitor'}
            ,{value: 'ringtone', text: 'classic-ringtone'}
            ,{value: 'custom', text: tid('custom')}
        ];

        contentHtml = '<table class="vtight">';

        var soundSets = (formType == 'SoundsVisitor') ? [
                {key:'seme',title_key:'message'},
                {key:'seno',title_key:'notifications'}
            ]
            :
            [
                {key:'some',title_key:'message'},
                {key:'sovi',title_key:'visitor'},
                {key:'sori',title_key:'new_chat'},
                {key:'soti',title_key:'ticket'},
                {key:'soqu',title_key:'queue'}
        ];

        for(var sset in soundSets)
        {
            var curl = DataEngine.getConfigValue('gl_' + soundSets[sset].key+ '_url',false);
            if(curl == null)
                curl = '';

            contentHtml += '<tr><td colspan="2"><label>'+tidc(soundSets[sset].title_key)+'</label></td></tr>';
            contentHtml += '<tr><td>' + lzm_inputControls.createSelect('sl-gl_' + soundSets[sset].key,'sound-selector','','','',{},'',soundList,DataEngine.getConfigValue('gl_' + soundSets[sset].key,false),'') + '</td><td style="width:40px;vertical-align: middle;">' + lzm_inputControls.createButton('snd-demo-' + soundSets[sset].key, '', 'ServerConfiguration.__PlayDemoSound(\''+soundSets[sset].key+'\')', '', '<i class="fa fa-play"></i>', 'lr',{'margin-right': '4px', 'margin-left': '4px'},'',30,'d') + '</td></tr>';
            contentHtml += '<tr id="s-gl_' + soundSets[sset].key+'-row"><td>' + lzm_inputControls.createInput('s-gl_' + soundSets[sset].key+'-custom', 'left-space-child', curl, tidc('url'), '', 'text', '') + '<div class="text-gray text-s left-space-child top-space-half">WAV/MP3, 1-3 '+tid('seconds')+'</div></td><td></td></tr>';
            contentHtml += '<tr><td colspan="2"><br></td></tr>';
        }
        contentHtml += '</table>';

    }
    return contentHtml;
};

ServerConfiguration.prototype.GetLicenseRow = function(number, amount, typeName, typeKey, serial, hash, conf, deac) {

    var lzch = DataEngine.getConfigValue('gl_lzch',false) == 1;

    if(amount == 0)
    {
        serial = '<i><strike>'+ serial +'</strike></i>';
        typeName = '<i><strike>'+typeName +'</strike></i>';
        amount = '<i class="fa fa-warning icon-orange"></i>';
    }

    var contentHtml = '<tr data-serial="'+serial.toUpperCase()+'" data-hash="'+hash+'" data-type-key="'+typeKey+'"><td style="text-align:center;">'+number+'</td>' +
        '<td style="text-align:center;">'+amount+'</td>' +
        '<td style="text-align:center;">'+typeName+'</td>'+
        '<td style="text-align:center;">'+serial+'</td><td style="text-align:right;">';

    if(conf)
        contentHtml += lzm_inputControls.createButton('sc-deac-lic-'+hash,'','configureLicense(\''+typeKey+'\');', '', '<i style="font-size:12px;" class="fa fa-cog"></i>', '', {}, '', '');

    if(deac && !lzch)
        return contentHtml + '&nbsp;' + lzm_inputControls.createButton('sc-deac-lic-'+hash,'','ServerConfigurationClass.__RemoveLicenseKey(\''+hash+'\');', tid('deactivate'), '', '', {}, '', '')+'</td></tr>';
    else
        return contentHtml + '</td></tr>';

};

ServerConfiguration.prototype.GetEmailAccountRow = function(accountObj) {

    var buttonrow =
        lzm_inputControls.createButton('email-acc-'+accountObj.id+'-edit','email_dialog_button','ServerConfiguration.__EmailAccountAction(\'edit\',\''+accountObj.boxtype+'\',\''+accountObj.id+'\');', tid('edit'), '<i class="fa fa-cog icon-small"></i>', '', {'margin': '0 6px 0 0'}, '', 30, 'e') +
        lzm_inputControls.createButton('email-acc-'+accountObj.id+'-remove','email_dialog_button','ServerConfiguration.__EmailAccountAction(\'remove\',\''+accountObj.boxtype+'\',\''+accountObj.id+'\');', tid('remove'), '<i class="fa fa-trash icon-small"></i>', '', {'margin': '0 6px 0 0'}, '', 30, 'e') +
        lzm_inputControls.createButton('email-acc-'+accountObj.id+'-test','email_dialog_button','ServerConfiguration.__EmailAccountAction(\'test\',\''+accountObj.boxtype+'\',\''+accountObj.id+'\');', tid('test'), '<i class="fa fa-bolt icon-small"></i>', '', {'margin': '0'}, '', 30, 'e');
    return '<tr id="'+accountObj.id+'" data-obj="'+lz_global_base64_encode(JSON.stringify(accountObj))+'"><td style="font-weight:bold;">'+accountObj.email+'</td><td style="text-align:right;">'+buttonrow+'</td></tr>';
};

ServerConfiguration.prototype.GetCriteriaRow = function(criteriaObj) {
    var buttonrow =
        lzm_inputControls.createButton('fb-crit-'+criteriaObj.name+'-edit','','feedbackAction(\'edit\',\''+criteriaObj.id+'\');', tid('edit'), '<i class="fa fa-cog icon-small"></i>', '', {'margin': '0 6px 0 0'}, '', 30, 'b') +
        lzm_inputControls.createButton('fb-crit-'+criteriaObj.name+'-remove','','feedbackAction(\'remove\',\''+criteriaObj.id+'\');', tid('remove'), '<i class="fa fa-trash icon-small"></i>', '', {'margin': '0'}, '', 30, 'b');
    return '<tr id="fb-crit-'+criteriaObj.id+'" data-obj="'+lz_global_base64_encode(JSON.stringify(criteriaObj))+'"><td style="font-weight:bold;">'+criteriaObj.name+'</td><td style="text-align:right;">'+buttonrow+'</td></tr>';
};

ServerConfiguration.prototype.GetTicketSubRow = function(defObj,type,rowType) {

    var buttonrow = '';
    if(rowType=='source'){
        buttonrow = lzm_inputControls.createButton('ticket-sub-'+type+'-'+defObj.key+'-add','','ticketSubAction(\'add\',\'source\',\''+defObj.index+'\');', tid('add_sub_source'), '', '', {'margin': '0 2px 0 0'}, '', 30, 'b');
        return '<tr id="source-'+defObj.index+'" data-obj="'+lz_global_base64_encode(JSON.stringify(defObj))+'"><td style="font-weight:bold;"><i class="fa fa-caret-right icon-small"></i>&nbsp;&nbsp;'+defObj.title+'</td><td style="text-align:right;">'+buttonrow+'</td></tr>';
    }
    else if(rowType=='status'){
        buttonrow = lzm_inputControls.createButton('ticket-sub-'+type+'-'+defObj.key+'-add','','ticketSubAction(\'add\',\'status\',\''+defObj.index+'\');', tid('add_sub_status'), '', '', {'margin': '0 2px 0 0'}, '', 30, 'b');
        return '<tr id="status-'+defObj.index+'" data-obj="'+lz_global_base64_encode(JSON.stringify(defObj))+'"><td style="font-weight:bold;"><i class="fa fa-caret-right icon-small"></i>&nbsp;&nbsp;'+defObj.title+'</td><td style="text-align:right;">'+buttonrow+'</td></tr>';
    }
    else if(rowType=='sub'){
        buttonrow = lzm_inputControls.createButton('ticket-sub-'+type+'-'+defObj.sid+defObj.parent+defObj.type.toString()+'-remove','','ticketSubAction(\'remove\',\''+defObj.type+'\',\''+defObj.sid+defObj.parent+defObj.type.toString()+'\');', tid('remove'), '', '', {'margin': '0 2px 0 0'}, '', 30, 'b');
        return '<tr id="'+defObj.sid+defObj.parent+defObj.type.toString()+'" class="' + type + '-' + defObj.parent + defObj.name +'" data-sub="1" data-obj="'+lz_global_base64_encode(JSON.stringify(defObj))+'"><td style="">'+defObj.name+'</td><td style="text-align:right;">'+buttonrow+'</td></tr>';
    }
    return '';
};

ServerConfiguration.ApplyLogicToInputsForm = function() {

    $('.input-type-select').change(function(){
        var id = $(this).prop('id').toString().split('_')[1];
        id = id.replace('-outer','');
        var sI = $('#ict_' + id).prop('selectedIndex');
        $('#iv_' + id).css({display:(sI==2||sI==4?'none':'inline')});
        $('#isc_' + id).parent().css({display:(sI!=4?'none':'inline')});
    });
    $('.input-type-select').change();
};

ServerConfiguration.prototype.ApplyLogicToForm = function() {

    // inputs
    ServerConfiguration.ApplyLogicToInputsForm();

    // chats
    if($('#int-gl_mqwt').val() > 0)
        $('#cb-gl_mqwt_c').prop('checked',true);
    if($('#int-gl_mcwt').val() > 0)
        $('#cb-gl_mcwt_c').prop('checked',true);
    if($('#int-gl_mcfc').val() > 0){
        $('#cb-gl_mcfc_c').prop('checked',true);
        $('#r-gl_mcwf_1').prop('checked',true);
        $('#cb-gl_mcwt_c').prop('checked',true);
    }

    $('#ci-gl_kbdc').change(function() {
        if(lzm_commonTools.isHEXColor($('#ci-gl_kbdc').val()))
            $('#ci-gl_kbdc-icon').css({background:$('#ci-gl_kbdc').val()});
    });

    if(DataEngine.getConfigValue('gl_alloc_mode',false) == '1')
        $('#r-gl_alloc_mode_1').prop('checked',true);

    if(DataEngine.getConfigValue('gl_mcwf',false) != null)
        $('#r-gl_mcwf_'+DataEngine.getConfigValue('gl_mcwf',false).toString()).prop('checked',true);

    $('#s-gl_host').change(function(){
        if($('#s-gl_host').val().toLowerCase().indexOf('https://')!=-1)
            $('#s-gl_host').val($('#s-gl_host').val().toLowerCase().replace('https://',''));
        if($('#s-gl_host').val().toLowerCase().indexOf('http://')!=-1)
            $('#s-gl_host').val($('#s-gl_host').val().toLowerCase().replace('http://',''));
    });
    $('#cb-gl_mqwt_c').change(function(){
        applyWaitingTimeLogic();
    });
    $('#cb-gl_mcwt_c').change(function(){
        applyWaitingTimeLogic();
    });
    $('#cb-gl_mcfc_c').change(function(){
        applyWaitingTimeLogic();
    });
    $('.gl_mcwf-select').change(function(){
        applyWaitingTimeLogic();
    });


    function applyWaitingTimeLogic(_initial){

        if($('#cb-gl_mqwt_c').prop('checked'))
            $('.gl_mqwt_c').removeClass('ui-disabled');
        else
        {
            $('.gl_mqwt_c').addClass('ui-disabled');
            $('#int-gl_mqwt').val(0);
        }

        if($('#cb-gl_mcwt_c').prop('checked'))
        {
            $('.gl_mcwt_c, .gl_mcwf-select').removeClass('ui-disabled');
        }
        else
        {
            $('.gl_mcwt_c, .gl_mcwf-select').addClass('ui-disabled');
            $('#int-gl_mcwt').val(0);
        }

        if($('#r-gl_mcwf_1').prop('checked') && $('#cb-gl_mcwt_c').prop('checked'))
            $('.gl_mcwf_1').removeClass('ui-disabled');
        else
        {
            $('.gl_mcwf_1').addClass('ui-disabled');
        }

        if($('#cb-gl_mcfc_c').prop('checked') && $('#r-gl_mcwf_1').prop('checked') && $('#cb-gl_mcwt_c').prop('checked'))
        {
            $('.gl_mcfc_c').removeClass('ui-disabled');
        }
        else
        {
            $('.gl_mcfc_c').addClass('ui-disabled');
            $('#int-gl_mcfc').val(0);
        }

        if($('#r-gl_mcwf_0').prop('checked') && $('#cb-gl_mcfc_c').prop('checked'))
            $('#cb-gl_mcfc_c').prop('checked',false);


        if($('#r-gl_alloc_mode_1').prop('checked'))
            $('#r-gl_mcwf_1').parent().addClass('ui-disabled');

        if(_initial)
            $('.chat-dist-select').change();

    }
    setTimeout(function(){applyWaitingTimeLogic(true);},500);

    $('#cb-gl_sho_qu_inf').change(function(){
        if($('#cb-gl_sho_qu_inf').prop('checked'))
            $('.gl_sho_qu_inf').removeClass('ui-disabled');
        else
            $('.gl_sho_qu_inf').addClass('ui-disabled');
    });
    $('#cb-gl_sho_qu_inf').change();

    $('#cb-gl_url_detect').change(function(){
        if(!$('#cb-gl_url_detect').prop('checked'))
            $('#s-gl_url').removeClass('ui-disabled');
        else
            $('#s-gl_url').addClass('ui-disabled');
    });
    $('#cb-gl_url_detect').change();

    $('#cb-gl_wmes_c').change(function(){
        if($('#cb-gl_wmes_c').prop('checked'))
            $('#int-gl_wmes').removeClass('ui-disabled');
        else
            $('#int-gl_wmes').addClass('ui-disabled');
    });
    if($('#int-gl_wmes').val() == -1)
        $('#int-gl_wmes').val(60);
    else
        $('#cb-gl_wmes_c').prop('checked',true);
    $('#cb-gl_wmes_c').change();

    $('#cb-gl_acco').change(function(){
        if($('#cb-gl_acco').prop('checked'))
            $('#int-gl_ccoa').removeClass('ui-disabled');
        else
            $('#int-gl_ccoa').addClass('ui-disabled');
    });
    $('#cb-gl_acco').change();

    $('#cb-gl_accc').change(function(){
        if($('#cb-gl_accc').prop('checked'))
            $('#int-gl_ccca').removeClass('ui-disabled');
        else
            $('#int-gl_ccca').addClass('ui-disabled');
    });
    $('#cb-gl_accc').change();

    if(DataEngine.getConfigValue('gl_om_mode',false) == '1')
        $('#r-gl_om_mode_HTTP').prop('checked',true);
    else
        $('#r-gl_om_mode_Internal').prop('checked',true);

    $('.gl_om_mode').change(function(){
        if($('#r-gl_om_mode_HTTP').prop('checked'))
            $('.gl_om_mode_HTTP').removeClass('ui-disabled');
        else
            $('.gl_om_mode_HTTP').addClass('ui-disabled');

    });
    $('.gl_om_mode').change();


    // callbacks
    $('#cb-gl_cb_mode').change(function(){
        if($('#cb-gl_cb_mode').prop('checked'))
            $('.gl_cb_mode').removeClass('ui-disabled');
        else
            $('.gl_cb_mode').addClass('ui-disabled');

    });
    $('#cb-gl_cb_mode').change();

    // pruning
    this.m_Settings.forEach(function(entry_name){
        if(entry_name.name == 'Database')
            entry_name.groups.forEach(function(entry_group){
                if(entry_group.name == 'Pruning')
                    entry_group.controls.forEach(function(entry_control) {
                        if(entry_control.type=='bool')
                        {
                            $('#int-' + entry_control.name+ '_time').val($('#int-' + entry_control.name+ '_time').val()/86400);
                            $('#cb-' + entry_control.name).change(function(){
                                if($('#cb-' + entry_control.name).prop('checked'))
                                    $('#int-' + entry_control.name+ '_time').removeClass('ui-disabled');
                                else
                                    $('#int-' + entry_control.name+ '_time').addClass('ui-disabled');
                            });
                            $('#cb-' + entry_control.name).change();
                        }
                    });
            });
    });

    // ldap
    $('.auth-select').change(function(){
        if($('#r-gl_ldap_1').prop('checked'))
            $('.gl_ldap').removeClass('ui-disabled');
        else
            $('.gl_ldap').addClass('ui-disabled');

    });
    if(DataEngine.getConfigValue('gl_ldap',false) != null)
        $('#r-gl_ldap_'+DataEngine.getConfigValue('gl_ldap',false).toString()).prop('checked',true);
    $('.auth-select').change();

    $('#cb-gl_sfa').change(function(){
        if($('#cb-gl_sfa').prop('checked'))
            $('.gl_sfa').removeClass('ui-disabled');
        else
            $('.gl_sfa').addClass('ui-disabled');
    });
    $('#cb-gl_sfa').change();

    // https
    if(DataEngine.getConfigValue('gl_rhts',false) == '1')
        $('#r-gl_rhts_1').prop('checked',true);
    else
        $('#r-gl_rhts_0').prop('checked',true);

    // translation
    $('#s-gl_otrs').change(function(){
        $('#s-gl_otrs').val($('#s-gl_otrs').val().replace(/ /g,''));
    });

    // chat invites
    $('#cb-gl_itim_c').change(function(){
        if($('#cb-gl_itim_c').prop('checked'))
            $('#int-gl_itim').removeClass('ui-disabled');
        else
            $('#int-gl_itim').addClass('ui-disabled');
    });
    if($('#int-gl_itim').val() <= 0)
        $('#int-gl_itim').val(60);
    else
        $('#cb-gl_itim_c').prop('checked',true);
    $('#cb-gl_itim_c').change();


    if(DataEngine.getConfigValue('gl_imda',false) == '1')
        $('#r-gl_imda_1').prop('checked',true);
    else
        $('#r-gl_imda_0').prop('checked',true);

    if(DataEngine.getConfigValue('gl_iada',false) == '1')
        $('#r-gl_iada_1').prop('checked',true);
    else
        $('#r-gl_iada_0').prop('checked',true);


    $("#excinv_bgopacity").attr('step','0.1');
    $('#excinv_sactive').change(function(){
        if($('#excinv_sactive').prop('checked'))
            $('.excinv_sactive').removeClass('ui-disabled');
        else
            $('.excinv_sactive').addClass('ui-disabled');
    });
    $('#excinv_bgactive').change(function(){
        if($('#excinv_bgactive').prop('checked'))
            $('.excinv_bgactive').removeClass('ui-disabled');
        else
            $('.excinv_bgactive').addClass('ui-disabled');
    });
    $('#excinv_sactive').change();
    $('#excinv_bgactive').change();
    $('.excinv_position').click(function() {
        $('.excinv_position').removeClass('lzm-position-selected');
        $(this).addClass('lzm-position-selected');
    });

    $('#excinv_bgcolor').change(function() {
        if(lzm_commonTools.isHEXColor($('#excinv_bgcolor').val()))
            $('#excinv_bgcolor-icon').css({background:$('#excinv_bgcolor').val()});
    });
    $('#excinv_scolor').change(function() {
        if(lzm_commonTools.isHEXColor($('#excinv_scolor').val()))
            $('#excinv_scolor-icon').css({background:$('#excinv_scolor').val()});
    });

    //sounds
    var ___playSoundOnChange = false;
    $('.sound-selector').change(function() {

        var field = $(this).attr('id').toString().replace(/sl-gl_/g,'').replace('-outer','');

        if(___playSoundOnChange)
            ServerConfiguration.__PlayDemoSound(field);

        var isCust = $(this).find(':selected').index() == $(this).find('option').length-1;
        $('#s-gl_' + field + '-row').css({display:(isCust ? 'table-row' : 'none')})
    });
    $('.sound-selector').change();

    ___playSoundOnChange = true;

    // data privcy
    $('#cb-gl_maskip').change(function(){
        if($('#cb-gl_maskip').prop('checked'))
            $('#sl-gl_miat').removeClass('ui-disabled');
        else
            $('#sl-gl_miat').addClass('ui-disabled');
    });
    $('#cb-gl_maskip').change();

    $('#cb-gl_colt_c').change(function(){
        if($('#cb-gl_colt_c').prop('checked'))
            $('#int-gl_colt').removeClass('ui-disabled');
        else
            $('#int-gl_colt').addClass('ui-disabled');
    });
    if($('#int-gl_colt').val() <= 0)
        $('#int-gl_colt').val(75);
    else
        $('#cb-gl_colt_c').prop('checked',true);
    $('#cb-gl_colt_c').change();


    $('#cb-gl_cooi').change(function(){
        if($('#cb-gl_cooi').prop('checked'))
            $('#s-gl_cooi_call').removeClass('ui-disabled');
        else
            $('#s-gl_cooi_call').addClass('ui-disabled');
    });
    $('#cb-gl_cooi').change();

    if(DataEngine.getConfigValue('gl_kbin',false) == '1')
        $('#r-gl_kbin_1').prop('checked',true);
    else if(DataEngine.getConfigValue('gl_kbin',false) == '2')
        $('#r-gl_kbin_2').prop('checked',true);
    else
        $('#r-gl_kbin_0').prop('checked',true);

    $('.gl_kbin').change(function(){
        if($('#r-gl_kbin_2').prop('checked'))
            $('#s-gl_kurl').removeClass('ui-disabled');
        else
            $('#s-gl_kurl').addClass('ui-disabled');
    });
    $('.gl_kbin').change();

    if(DataEngine.getConfigValue('gl_kbsb',false) == '1')
        $('#r-gl_kbsb_1').prop('checked',true);
    else if(DataEngine.getConfigValue('gl_kbsb',false) == '2')
        $('#r-gl_kbsb_2').prop('checked',true);
    else
        $('#r-gl_kbsb_0').prop('checked',true);

    if(DataEngine.getConfigValue('gl_bldo',false) == '1')
        $('#r-gl_bldo_1').prop('checked',true);

    // monitoring
    $('#cb-gl_hide_inactive').change(function(){
        if($('#cb-gl_hide_inactive').prop('checked'))
            $('#int-gl_inti').removeClass('ui-disabled');
        else
            $('#int-gl_inti').addClass('ui-disabled');
    });
    $('#cb-gl_hide_inactive').change();

    //images
    $('#sc-header-image-preview').click(function(){
        var url = $('#gl_cali').val();
        if(url.length){
            try{
                $('#sc-header-image').css({'background-image':"url('" + url + "')"});
            }catch(ex){deblog(ex);}
        }
        else
            $('#sc-header-image').css({'background-image':'none'});
    });
    $('#sc-header-image-none').click(function(){
        $('#gl_cali').val('');
        $('#sc-header-image-preview').click();
    });

    $('#sc-header-image-default').click(function(){
        $('#gl_cali').val(DataEngine.getServerUrl('') + 'images/carrier_logo.png');
        $('#sc-header-image-preview').click();
    });
    $('#sc-header-image-preview').click();

    $('#sc-background-image-preview').click(function(){
        var url = $('#gl_cahi').val();
        if(url.length){
            try{
                $('#sc-background-image').css({'background-image':"url('" + url + "')"});
            }catch(ex){deblog(ex);}
        }
        else
            $('#sc-background-image').css({'background-image':'none'});
    });
    $('#sc-background-image-none').click(function(){
        $('#gl_cahi').val('');
        $('#sc-background-image-preview').click();
    });
    $('#sc-background-image-default').click(function(){
        $('#gl_cahi').val(DataEngine.getServerUrl('') + 'images/carrier_header.gif');
        $('#sc-background-image-preview').click();
    });
    $('#sc-background-image-preview').click();

    $('.chat-dist-select').change(function(){
        if($('#r-gl_alloc_mode_1').prop('checked'))
        {
            $('#r-gl_mcwf_1').prop('checked',false);
            $('#r-gl_mcwf_0').prop('checked',true);



        }
        else
        {






        }

        applyWaitingTimeLogic();
    });

    /*
    $('#cb-gl_mpm').change(function(){
        if($('#cb-gl_mpm').prop('checked'))
        {

            lzm_commonDialog.createAlertDialog(tid('dpr_feature'), [{id: 'ok', name: tid('dpr_signed')},{id: 'cancel', name: tid('cancel')}]);
            $('#alert-btn-ok').click(function(){
                lzm_commonDialog.removeAlertDialog();
            });


            $('#alert-btn-cancel').click(function(){
                lzm_commonDialog.removeAlertDialog();
                $('#cb-gl_mpm').prop('checked',false);
            });
        }
    });
    */

    $('#cb-gl_cmsp').change(function(){
        if($('#cb-gl_cmsp').prop('checked'))
        {
            lzm_commonDialog.createAlertDialog(tid('sneak_peek_warning'), [{id: 'ok', name: tid('ok')},{id: 'cancel', name: tid('cancel')}]);
            $('#alert-btn-ok').click(function(){
                lzm_commonDialog.removeAlertDialog();
            });

            $('#alert-btn-cancel').click(function(){
                lzm_commonDialog.removeAlertDialog();
                $('#cb-gl_cmsp').prop('checked',false);
            });
        }
    });
};

ServerConfiguration.prototype.getTimezones = function() {
    return [
        {title:'Kwajalein',diff:'-12.00'},
        {title:'Pacific/Midway',diff:'-11.00'},
        {title:'Pacific/Honolulu',diff:'-10.00'},
        {title:'America/Anchorage',diff:'-9.00'},
        {title:'America/Los_Angeles',diff:'-8.00'},
        {title:'America/Denver',diff:'-7.00'},
        {title:'America/Tegucigalpa',diff:'-6.00'},
        {title:'America/Chicago',diff:'-6.00'},
        {title:'America/New_York',diff:'-5.00'},
        {title:'America/Bogota',diff:'-5.00'},
        {title:'America/Caracas',diff:'-4.30'},
        {title:'America/Halifax',diff:'-4.00'},
        {title:'America/St_Johns',diff:'-3.30'},
        {title:'America/Argentina/Buenos_Aires',diff:'-3.00'},
        {title:'America/Sao_Paulo',diff:'-3.00'},
        {title:'Atlantic/South_Georgia',diff:'-2.00'},
        {title:'Atlantic/Azores',diff:'-1.00'},
        {title:'Europe/Dublin',diff:'0'},
        {title:'Europe/Belgrade',diff:'1.00'},
        {title:'Europe/Helsinki',diff:'2.00'},
        {title:'Africa/Johannesburg',diff:'2.00'},
        {title:'Asia/Kuwait',diff:'3.00'},
        {title:'Asia/Tehran',diff:'3.30'},
        {title:'Asia/Muscat',diff:'4.00'},
        {title:'Asia/Kabul',diff:'4.30'},
        {title:'Asia/Yekaterinburg',diff:'5.00'},
        {title:'Asia/Kolkata',diff:'5.30'},
        {title:'Asia/Katmandu',diff:'5.45'},
        {title:'Asia/Dhaka',diff:'6.00'},
        {title:'Asia/Rangoon',diff:'6.30'},
        {title:'Asia/Krasnoyarsk',diff:'7.00'},
        {title:'Asia/Brunei',diff:'8.00'},
        {title:'Asia/Seoul',diff:'9.00'},
        {title:'Australia/Darwin',diff:'9.30'},
        {title:'Australia/Canberra',diff:'10.00'},
        {title:'Asia/Magadan',diff:'11.00'},
        {title:'Pacific/Fiji',diff:'12.00'},
        {title:'Pacific/Tongatapu',diff:'13.00'}
    ];
};

ServerConfiguration.__EmailAccountAction = function(action, type, id) {
    lzm_chatDisplay.ServerConfigurationClass.emailAction(action, type, id);
};

ServerConfiguration.__PlayDemoSound = function(_sset){

    var sfile = $('#sl-gl_' + _sset).val();
    var isCust = $('#sl-gl_' + _sset).find(':selected').index() == $('#sl-gl_' + _sset).find('option').length-1;

    if(isCust)
        sfile = $('#s-gl_' + _sset + '-custom').val();
    else
        sfile = DataEngine.getServerUrl('') + 'sound/' + sfile + '.mp3';

    var ap = new Audio(sfile);
    ap.play();
};

ServerConfiguration.__EditKnowledgeBaseTemplate = function(_type){

    var templateHTML = lz_global_base64_decode(DataEngine.getConfigValue(_type == 'HEADER' ? 'gl_kbth' : 'gl_kbtf',false));



    var footerString = '<span style="float: left;">';
    footerString += lzm_inputControls.createButton('kb-tpl-btn-reset', '', '', tid('reset'), '', 'lr',{'margin-left': '6px'},'',30,'d');
    footerString += '</span>';
    footerString += lzm_inputControls.createButton('kb-tpl-btn-ok', '', '', tid('ok'), '', 'lr',{'margin-left': '4px'},'',30,'d');
    footerString += lzm_inputControls.createButton('kb-tpl-btn-cancel', '', '', tid('cancel'), '', 'lr',{'margin-left': '4px'},'',30,'d');


    var bodyString = '<div class="lzm-fieldset">';
    bodyString += lzm_inputControls.createArea('kb-page-template', templateHTML, 'code-box-large', 'HTML:', '');
    bodyString += '</div>';

    lzm_commonDialog.CreateDialogWindow('HTML (' + _type + ')', bodyString, footerString, 'code', 'edit-kb-tpl-html', 'edit-kb-tpl-html', 'kb-tpl-btn-cancel');

    $('#kb-page-template').css('height',parseInt($('#edit-kb-tpl-html-body').css('height').replace('px','')-56)+'px');

    $('#kb-tpl-btn-ok').click(function() {
        DataEngine.setConfigValue(_type == 'HEADER' ? 'gl_kbth' : 'gl_kbtf',lz_global_base64_encode($('#kb-page-template').val()));
        $('#kb-tpl-btn-cancel').click();
    });
    $('#kb-tpl-btn-cancel').click(function() {
        TaskBarManager.RemoveActiveWindow();
    });
    $('#kb-tpl-btn-reset').click(function() {
        $.get( '../templates/kb_'+_type.toLowerCase()+'.tpl', function(data) {
            $('#kb-page-template').val(data);
        });
    });
};

ServerConfiguration.SetValidation = function(id) {

    var input = DataEngine.inputList.getCustomInput(id,'id');
    if(typeof $("#ival_" + input.id).attr('data-val') != 'undefined')
        input = JSON.parse($("#ival_" + input.id).attr('data-val'));

    var validationHtml = '<fieldset class="lzm-fieldset-full"><legend>' + lzm_inputControls.createCheckbox('ival_active',tid('use_validation'),input.val_a=='1','') + '</legend>';

    validationHtml += lzm_inputControls.createSelect('ival_type','ival_settings','','','','','',[{value:'basic',text:tid('data')},{value:'advanced',text:tid('advanced')}]);

    validationHtml += '<div id="ival_basic" class="ival_settings top-space-double">';
    validationHtml += lzm_inputControls.createInput('basic-validation-data', '', '', tidc('input_must_be'), '', 'text', '') + '<div class="lzm-info-text text-s top-space-half">'+tid('use_as_wildcard')+', Checkbox = 1 / 0, ComboBox = 0,1,2,3 ...</div>';
    validationHtml += '</div>';

    validationHtml += '<div id="ival_advanced" class="ival_settings top-space-double">';
    validationHtml += lzm_inputControls.createInput('ival_url', '', '', tid('validation_url'), '', 'text', '');
    validationHtml += '<div class="lzm-info-text top-space-half" style="white-space: nowrap; font-size:11px !important;"><b>'+tid('example')+':</b> http://site.com/validate?inputid=&lt;!--input_id--&gt;&value=&lt;!--value--&gt;</div>';
    validationHtml += '<div class="top-space-double">'+lzm_inputControls.createInput('ival_success', '', 'lz_validate_input_result(true,<!--input_id-->);', tid('validation_success'), '', 'text', '')+'</div>';
    validationHtml += '<div class="top-space">'+lzm_inputControls.createInput('ival_fail', '', 'lz_validate_input_result(false,<!--input_id-->);', tid('validation_fail'), '', 'text', '')+'</div>';
    validationHtml += '<div class="top-space-double">'+lzm_inputControls.createInput('ival_timeout', '', input.val_ti, tid('timeout')+' ('+tid('seconds')+'):', '', 'number', '')+'</div>';
    validationHtml += '<div class="top-space">'+lzm_inputControls.createCheckbox('ival_proceed', tid('validation_proceed'), input.val_poe, '')+'</div></div>';

    validationHtml += '</fieldset>';
    lzm_commonDialog.createAlertDialog(validationHtml.replace(/<!--input_id-->/g,input.id), [{id: 'ok', name: tid('ok')}, {id: 'close', name: tid('close')}, {id: 'help', name: tid('help')}],true,true,false);

    if(input.val_url.length && input.val_url.indexOf(DataEngine.getServerUrl('validate.php')+'?vtype=basic') === 0)
    {
        $("#ival_type").val('basic');

        var parts = input.val_url.split('&data=');
        $('#basic-validation-data').val(lz_global_base64_url_decode(parts[1]));
    }
    else if(input.val_url.length)
    {
        $("#ival_type").val('advanced');
        $('#ival_url').val(input.val_url);
    }


    $("#ival_success").attr('readonly',true);
    $("#ival_fail").attr('readonly',true);
    $('#alert-btn-ok').click(function() {

        input.val_a = $("#ival_active").attr('checked') ? 1 : 0;

        if($('#ival_type').prop('selectedIndex').toString()=='0')
        {
            if($('#basic-validation-data').val().toString().length)
            {
                input.val_url = DataEngine.getServerUrl('validate.php')+'?vtype=basic&itype='+input.type.toLowerCase()+'&inputid=<!--input_id-->&value=<!--value-->&data=' + lz_global_base64_url_encode($('#basic-validation-data').val());
                input.val_ti = $("#ival_timeout").val();
                input.val_poe = 0;
            }
            else
                input.val_a = 0;
        }
        else
        {
            input.val_url = $("#ival_url").val();
            input.val_ti = $("#ival_timeout").val();
            input.val_poe = $("#ival_proceed").attr('checked') ? 1 : 0;
        }

        if(input.val_a)
            $("#ivali_" + input.id).addClass('icon-orange');
        else
            $("#ivali_" + input.id).removeClass('icon-orange');

        $("#ival_" + input.id).attr('data-val',JSON.stringify(input));

        lzm_commonDialog.removeAlertDialog();

    });
    $('#alert-btn-help').click(function() {
        window.open('https://chat.livezilla.net/knowledge-base/advanced-features/en-input-validation/');

    });
    $('#alert-btn-close').click(function() {
        lzm_commonDialog.removeAlertDialog();
    });
    $('#ival_active').change(function() {
        if(!$('#ival_active').attr('checked'))
            $('.ival_settings').addClass('ui-disabled');
        else
            $('.ival_settings').removeClass('ui-disabled');
    });
    $('#ival_active').change();

    $('#ival_type').change(function() {
        if($('#ival_type').prop('selectedIndex').toString()=='0')
        {
            $('#ival_basic').css('display','block');
            $('#ival_advanced').css('display','none');
        }
        else
        {
            $('#ival_basic').css('display','none');
            $('#ival_advanced').css('display','block');
        }
    });
    $('#ival_type').change();
};