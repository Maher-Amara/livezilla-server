var lz_install_wizard = null;
var lz_database_manager = null;
var lzm_inputControls = null;
var lzm_commonTools = null;
var lzm_commonDialog = null;

function install_next(){
    lz_install_wizard.Next();
}

function install_previous(){
    lz_install_wizard.Previous();
}

function install_goto(step){
    lz_install_wizard.Goto(step);
}

function dl_cf_file(){
    if(lz_update_mode)
        lz_database_manager.UpdateTables(lz_install_wizard,true);
    else
        lz_database_manager.CreateTables(lz_install_wizard,true);
}

function switchLoading(loading) {

    if(loading)
    {
        $('#index_action_box').addClass('ui-disabled');
        var loadingHtml = '<div id="index-loading"><div class="lz_anim_loading"></div></div>';
        $('#index_action_box').parent().append(loadingHtml).trigger('create');
        $('#index-loading').css({'background-color': '#ffffff', 'background-position': 'center', 'z-index': 1000});
    }
    else
    {
        $('#index_action_box').removeClass('ui-disabled');
        $('#index-loading').remove();
    }

}

function getServerUrl(){
    var path = document.location.href.toLowerCase();
    if(path.indexOf('index.php')!=-1)
        path = path.split('index.php')[0];
    if(path.indexOf('?')!=-1)
        path = path.split('?')[0];
    if(path.indexOf('&')!=-1)
        path = path.split('&')[0];
    if(path.indexOf('#')!=-1)
        path = path.split('#')[0];
    if(lzm_commonTools.endsWith(path,'/'))
        path = path.substr(0,path.length-1);
    return path;
}

$(document).ready(function () {

    lzm_commonTools = new CommonToolsClass();
    lz_install_wizard = new ServerInstallClass();
    lz_database_manager = new DatabaseManagerClass();
    lzm_inputControls = new CommonInputControlsClass();
    lzm_commonDialog = new CommonDialogClass();

    if(lz_update_mode)
    {
        if(parseInt(lz_db_version.replace(/\./g,'')) < 4100)
        {
            lzm_commonDialog.createAlertDialog('Your previous version ('+lz_db_version+') is too old to be updated. You will need to create a new database, please remove the old database and try again.', [{id: 'ok', name: lz_index_language['ok']}]);
            $('#alert-btn-ok').click(function() {
                lzm_commonDialog.removeAlertDialog();
            });
            lz_update_mode = false;
            lz_install_mode = true;
            $('#index_action_box').addClass('ui-disabled');
        }
    }

    if(lz_install_mode)
    {
        lz_install_wizard.UpdateUI();
        if(!lz_install_possible)
            $('#index_action_box').addClass('ui-disabled');
    }
    else
    {
        $('#index_action_box').parent().css('display','none');
        $('#index_install_progress').parent().css('display','none');
        $('#index_components_box').css('display','block');
    }

    if(document.head.innerHTML.toLowerCase().indexOf('cloudflare') != -1)
    {
        document.getElementById('warning-cf').style.display = 'table-row';
    }

    $('#tb-server-url').val(getServerUrl()+'/');
    $('#tb-server-url').click(function(){
        $('#tb-server-url').select();
    });
});

function d(){}

function DatabaseManagerClass() {
    this.m_CreateDatabase = false;
    this.m_ServerId = '';
}

DatabaseManagerClass.prototype.CreateTables = function(_caller,_dl) {
    switchLoading(true);

    var that=this,pd = {};

    if(this.m_CreateDatabase)
        pd['p_db_create'] = '1';

    pd['p_db_no_req'] = '1';
    pd['p_request'] = 'intern';
    pd['p_action'] = 'create_tables';
    pd['p_administrate'] = '1';

    if(this.m_ServerId=='')
        this.m_ServerId = lzm_commonTools.guid().substr(0,10).toLowerCase();

    pd['p_lzid'] = this.m_ServerId;

    pd['p_db_host'] = _caller.m_Data.dbHost;
    pd['p_db_user'] = _caller.m_Data.dbUser;
    pd['p_db_pass'] = _caller.m_Data.dbPassword;
    pd['p_db_prefix'] = _caller.m_Data.dbPrefix;
    pd['p_db_name'] = _caller.m_Data.dbName;
    pd['p_db_ext'] = _caller.m_Data.dbExtension;
    pd['p_db_eng'] = _caller.m_Data.dbEngine;

    if(_dl)
        pd['p_db_cf_dl'] = '1';

    pd['p_gl_colt'] = (_caller.m_Data.setCookies) ? _caller.m_Data.cookieLifetime : '0';
    pd['p_gl_dnt'] = _caller.m_Data.respectDNT ? '1' : '0';
    pd['p_gl_maskip'] = _caller.m_Data.maskIP ? '1' : '0';
    pd['p_gl_use_ngl'] = _caller.m_Data.useNGL ? '1' : '0';
    pd['p_gl_miat'] = _caller.m_Data.maskIPFormat;
    pd['p_lz_path'] = getServerUrl();
    pd['p_lz_host'] = document.location.host;

    var k = initlc(this.m_ServerId,lz_timestamp);
    pd['p_gl_pr_ngl'] = k.nglth;
    pd['p_gl_licl'] = k.oprth;
    pd['p_gl_crc3'] = k.crc3;

    pd['p_operators_0_id'] = _caller.m_Data.username;
    pd['p_operators_0_system_id'] = lzm_commonTools.guid().substr(0,10).toLowerCase();
    pd['p_operators_0_level'] = '1';
    pd['p_operators_0_groups'] = 'YToxOntpOjA7czoxMjoiYzNWd2NHOXlkQT09Ijt9';
    pd['p_operators_0_groups_hidden'] = 'YTowOnt9';
    pd['p_operators_0_websites_config'] = 'YTowOnt9';
    pd['p_operators_0_websites_users'] = 'YTowOnt9';
    pd['p_operators_0_fn'] = _caller.m_Data.firstname;
    pd['p_operators_0_ln'] = _caller.m_Data.lastname;
    pd['p_operators_0_description'] = '';
    pd['p_operators_0_max_chats'] = '-1';
    pd['p_operators_0_ldap'] = '0';
    pd['p_operators_0_color'] = '#0185f1';
    pd['p_operators_0_mobile_ex'] = 'a:0:{}';
    pd['p_operators_0_email'] = _caller.m_Data.email;
    pd['p_operators_0_deac'] = '0';
    pd['p_operators_0_webspace'] = 100;
    pd['p_operators_0_password'] = CryptoJS.SHA256(CryptoJS.MD5(_caller.m_Data.password).toString()).toString();
    pd['p_operators_0_languages'] = 'EN';
    pd['p_operators_0_lipr'] = '';
    pd['p_operators_0_bot'] = '0';
    pd['p_operators_0_wm'] = '0';
    pd['p_operators_0_wmohca'] = '0';
    pd['p_operators_0_pp'] = 'DEFAULT';
    pd['p_operators_0_roles'] = 'admin_permission';

    pd['p_groups_0_id'] = 'support';
    pd['p_groups_0_external'] = '1';
    pd['p_groups_0_internal'] = '1';
    pd['p_groups_0_description'] = 'a:1:{s:2:"EN";s:12:"U3VwcG9ydA==";}';
    pd['p_groups_0_visitor_filters'] = 'a:0:{}';
    pd['p_groups_0_email'] = 'support@mywebsite.domain';
    pd['p_groups_0_standard'] = '1';
    pd['p_groups_0_ps'] = '0';
    pd['p_groups_0_hcgs'] = '0';
    pd['p_groups_0_htgs'] = '0';
    pd['p_groups_0_opening_hours'] = 'a:0:{};';
    pd['p_groups_0_ticket_assign'] = 'a:0:{}';
    pd['p_groups_0_priorities'] = 'a:0:{}';
    pd['p_groups_0_ticket_email_out'] = 'DEFAULT_PHPM';
    pd['p_groups_0_chat_email_out'] = 'DEFAULT_PHPM';
    pd['p_groups_0_ticket_email_in'] = 'a:0:{}';
    pd['p_groups_0_ticket_email_handling'] = '1';
    pd['p_groups_0_functions'] = '1111011';
    pd['p_groups_0_chat_inputs_hidden'] = 'a:0:{}';
    pd['p_groups_0_ticket_inputs_hidden'] = 'a:0:{}';
    pd['p_groups_0_chat_inputs_required'] = 'a:0:{}';
    pd['p_groups_0_ticket_inputs_required'] = 'a:0:{}';
    pd['p_groups_0_chat_inputs_masked'] = 'a:0:{}';
    pd['p_groups_0_ticket_inputs_masked'] = 'a:0:{}';
    pd['p_groups_0_chat_inputs_cap'] = 'a:0:{}';
    pd['p_groups_0_ticket_inputs_cap'] = 'a:0:{}';
    pd['p_groups_0_max_chats'] = '-1';
    pd['p_groups_0_pos'] = '0';
    pd['p_groups_0_ticket_sender_name'] = '0';
    pd['p_db_pm_g_c3VwcG9ydA==_DE_gid'] = 'support';
    pd['p_db_pm_g_c3VwcG9ydA==_DE_invm'] = 'R3V0ZW4gVGFnLCBtZWluIE5hbWUgaXN0ICVvcGVyYXRvcl9uYW1lJS4gQmVuw7Z0aWdlbiBTaWUgSGlsZmU/IEdlcm5lIGJlcmF0ZSBpY2ggU2llIGluIGVpbmVtIExpdmUtQ2hhdC4=';
    pd['p_db_pm_g_c3VwcG9ydA==_DE_inva'] = 'R3V0ZW4gVGFnLCBtZWluIE5hbWUgaXN0ICVvcGVyYXRvcl9uYW1lJS4gQmVuw7Z0aWdlbiBTaWUgSGlsZmU/IEdlcm5lIGJlcmF0ZSBpY2ggU2llIGluIGVpbmVtIExpdmUtQ2hhdC4=';
    pd['p_db_pm_g_c3VwcG9ydA==_DE_wpm'] = 'RWluIEJldHJldWVyIGRpZXNlciBXZWJzZWl0ZSAoJW9wZXJhdG9yX25hbWUlKSBtw7ZjaHRlIFNpZSBhdWYgZWluZW4gYW5kZXJlbiBCZXJlaWNoIHdlaXRlcmxlaXRlbjoNCg0KJXRhcmdldF91cmwl';
    pd['p_db_pm_g_c3VwcG9ydA==_DE_wpa'] = 'RWluIEJldHJldWVyIGRpZXNlciBXZWJzZWl0ZSAoJW9wZXJhdG9yX25hbWUlKSBtw7ZjaHRlIFNpZSBhdWYgZWluZW4gYW5kZXJlbiBCZXJlaWNoIHdlaXRlcmxlaXRlbjoNCg0KJXRhcmdldF91cmwl';
    pd['p_db_pm_g_c3VwcG9ydA==_DE_wel'] = 'R3V0ZW4gVGFnICVleHRlcm5hbF9uYW1lJSwgbWVpbiBOYW1lIGlzdCAlb3BlcmF0b3JfbmFtZSUuIFdpZSBrYW5uIGljaCBJaG5lbiBoZWxmZW4/';
    pd['p_db_pm_g_c3VwcG9ydA==_DE_cioff'] = '';
    pd['p_db_pm_g_c3VwcG9ydA==_DE_ci'] = '';
    pd['p_db_pm_g_c3VwcG9ydA==_DE_ccmbi'] = '';
    pd['p_db_pm_g_c3VwcG9ydA==_DE_ti'] = '';
    pd['p_db_pm_g_c3VwcG9ydA==_DE_ect'] = 'R3V0ZW4gVGFnICVleHRlcm5hbF9uYW1lJSwNCg0KdmllbGVuIERhbmsgZsO8ciB1bnNlciBHZXNwcsOkY2ggcGVyIENoYXQuIEVpbmUgTWl0c2NocmlmdCBlcmhhbHRlbiBTaWUgbWl0IGRpZXNlciBFLU1haWwuDQoNCiV3ZWJzaXRlX25hbWUlIC8gJWdyb3VwX2Rlc2NyaXB0aW9uJQ0KDQpEYXR1bTogJWxvY2FsZGF0ZSUNCi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0NCk5hbWU6ICVleHRlcm5hbF9uYW1lJQ0KRS1NYWlsOiAlZXh0ZXJuYWxfZW1haWwlDQpCZXRyZWZmOiAlcXVlc3Rpb24lDQoNCkNoYXQgUmVmZXJlbnotQ29kZTogJWNoYXRfaWQlDQotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tDQoldHJhbnNjcmlwdCUNCi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0NCg0KU2luZCBTaWUgenVmcmllZGVuPyBCZXdlcnRlbiBTaWUgdW5zOg0KJWZlZWRiYWNrX2xpbmsl';
    pd['p_db_pm_g_c3VwcG9ydA==_DE_et'] = 'R3V0ZW4gVGFnICVleHRlcm5hbF9uYW1lJSwNCg0KdmllbGVuIERhbmsgZsO8ciBJaHJlIEFuZnJhZ2UuIA0KDQpXaXIgaGFiZW4gSWhyZSBOYWNocmljaHQgZXJoYWx0ZW4gdW5kIHdlcmRlbiB1bnMgaW4gS8O8cnplIG1pdCBJaG5lbiBpbiBWZXJiaW5kdW5nIHNldHplbi4NCg0KLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLQ0KRGF0dW06ICVsb2NhbGRhdGUlDQotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tDQpOYW1lOiAlZXh0ZXJuYWxfbmFtZSUNCkUtTWFpbDogJWV4dGVybmFsX2VtYWlsJQ0KR3J1cHBlOiAlZ3JvdXBfZGVzY3JpcHRpb24lDQotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tDQolbWFpbHRleHQlDQoNCiV0aWNrZXRfaGFzaCU=';
    pd['p_db_pm_g_c3VwcG9ydA==_DE_qm'] = '';
    pd['p_db_pm_g_c3VwcG9ydA==_DE_st'] = 'JXRpY2tldF9oYXNoJSAld2Vic2l0ZV9uYW1lJSAtIElocmUgTmFjaHJpY2h0';
    pd['p_db_pm_g_c3VwcG9ydA==_DE_sct'] = 'JXdlYnNpdGVfbmFtZSUgLSBNaXRzY2hyaWZ0IElocmVzIENoYXRz';
    pd['p_db_pm_g_c3VwcG9ydA==_DE_str'] = 'JXRpY2tldF9oYXNoJSAld2Vic2l0ZV9uYW1lJSAtIElocmUgTmFjaHJpY2h0';
    pd['p_db_pm_g_c3VwcG9ydA==_DE_etr'] = 'JW1haWx0ZXh0JQoKLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLQoKU2luZCBTaWUgenVmcmllZGVuPyBCZXdlcnRlbiBTaWUgdW5zOgolZmVlZGJhY2tfbGluayU=';
    pd['p_db_pm_g_c3VwcG9ydA==_DE_hct'] = '';
    pd['p_db_pm_g_c3VwcG9ydA==_DE_ht'] = '';
    pd['p_db_pm_g_c3VwcG9ydA==_DE_htr'] = '';
    pd['p_db_pm_g_c3VwcG9ydA==_DE_qmt'] = '120';
    pd['p_db_pm_g_c3VwcG9ydA==_DE_edit'] = '1';
    pd['p_db_pm_g_c3VwcG9ydA==_DE_bi'] = '1';
    pd['p_db_pm_g_c3VwcG9ydA==_DE_def'] = '0';
    pd['p_db_pm_g_c3VwcG9ydA==_DE_aw'] = '1';
    pd['p_db_pm_g_c3VwcG9ydA==_DE_acc'] = 'TGllYmVyIEt1bmRlLCBkaWVzZXIgQ2hhdCB3dXJkZSBhdWZncnVuZCB2b24gSW5ha3Rpdml0w6R0IGF1dG9tYXRpc2NoIGdlc2NobG9zc2VuLg==';
    pd['p_db_pm_g_c3VwcG9ydA==_DE_aco'] = 'SWNoIGJpbiBsZWlkZXIgbW9tZW50YW4gdmVyaGluZGVydCB1bmQgd2VyZGUgU2llIGluIEvDvHJ6ZSBwZXIgRS1NYWlsIGtvbnRha3RpZXJlbi4gRGllc2VyIENoYXQgd2lyZCBhdXRvbWF0aXNjaCBnZXNjaGxvc3Nlbi4=';

    pd['p_db_pm_g_c3VwcG9ydA==_EN_gid'] = 'support';
    pd['p_db_pm_g_c3VwcG9ydA==_EN_invm'] = 'SGVsbG8sIG15IG5hbWUgaXMgJW9wZXJhdG9yX25hbWUlLjxicj48YnI+RG8geW91IG5lZWQgaGVscD88YnI+PGJyPlN0YXJ0IExpdmUtQ2hhdCBub3cgdG8gZ2V0IGFzc2lzdGFuY2Uu';
    pd['p_db_pm_g_c3VwcG9ydA==_EN_inva'] = 'SGVsbG8sIG15IG5hbWUgaXMgJW9wZXJhdG9yX25hbWUlLjxicj48YnI+RG8geW91IG5lZWQgaGVscD88YnI+PGJyPlN0YXJ0IExpdmUtQ2hhdCBub3cgdG8gZ2V0IGFzc2lzdGFuY2Uu';
    pd['p_db_pm_g_c3VwcG9ydA==_EN_wpm'] = 'V2Vic2l0ZSBPcGVyYXRvciAlb3BlcmF0b3JfbmFtZSUgd291bGQgbGlrZSB0byByZWRpcmVjdCB5b3UgdG8gdGhpcyBVUkw6DQoNCiV0YXJnZXRfdXJsJQ==';
    pd['p_db_pm_g_c3VwcG9ydA==_EN_wpa'] = 'V2Vic2l0ZSBPcGVyYXRvciAlb3BlcmF0b3JfbmFtZSUgd291bGQgbGlrZSB0byByZWRpcmVjdCB5b3UgdG8gdGhpcyBVUkw6DQoNCiV0YXJnZXRfdXJsJQ==';
    pd['p_db_pm_g_c3VwcG9ydA==_EN_wel'] = 'SGVsbG8gJWV4dGVybmFsX25hbWUlLCBteSBuYW1lIGlzICVvcGVyYXRvcl9uYW1lJSwgaG93IG1heSBJIGhlbHAgeW91Pw==';
    pd['p_db_pm_g_c3VwcG9ydA==_EN_cioff'] = '';
    pd['p_db_pm_g_c3VwcG9ydA==_EN_ci'] = '';
    pd['p_db_pm_g_c3VwcG9ydA==_EN_ccmbi'] = '';
    pd['p_db_pm_g_c3VwcG9ydA==_EN_ti'] = '';
    pd['p_db_pm_g_c3VwcG9ydA==_EN_ect'] = 'SGkgJWV4dGVybmFsX25hbWUlLA0KDQpUaGFuayB5b3UgZm9yIGNoYXR0aW5nIHdpdGggdXMuIFBsZWFzZSBmaW5kIHlvdXIgY2hhdCB0cmFuc2NyaXB0IGJlbG93Lg0KDQold2Vic2l0ZV9uYW1lJSAvICVncm91cF9kZXNjcmlwdGlvbiUNCg0KRGF0ZTogJWxvY2FsZGF0ZSUNCi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0NCk5hbWU6ICVleHRlcm5hbF9uYW1lJQ0KRW1haWw6ICVleHRlcm5hbF9lbWFpbCUNClRvcGljOiAlcXVlc3Rpb24lDQoNCkNoYXQgcmVmZXJlbmNlIG51bWJlcjogJWNoYXRfaWQlDQotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tDQoldHJhbnNjcmlwdCUNCi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0NCg0KV291bGQgeW91IGxpa2UgdG8gZ2l2ZSBmZWVkYmFjaz8NCiVmZWVkYmFja19saW5rJQ==';
    pd['p_db_pm_g_c3VwcG9ydA==_EN_et'] = 'SGkgJWV4dGVybmFsX25hbWUlLA0KDQpUaGFuayB5b3UgZm9yIGdldHRpbmcgaW4gdG91Y2ggd2l0aCB1cy4gDQoNCldlIGhhdmUgcmVjZWl2ZWQgeW91ciBtZXNzYWdlIGFuZCB3aWxsIGJlIHJlc3BvbmRpbmcgdG8geW91ciBlbnF1aXJ5IGFzIHNvb24gYXMgcG9zc2libGUuDQoNCi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0NCkRhdGU6ICVsb2NhbGRhdGUlDQotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tDQpOYW1lOiAlZXh0ZXJuYWxfbmFtZSUNCkVtYWlsOiAlZXh0ZXJuYWxfZW1haWwlDQpHcm91cDogJWdyb3VwX2Rlc2NyaXB0aW9uJQ0KLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLQ0KJW1haWx0ZXh0JQ0KDQoldGlja2V0X2hhc2gl';
    pd['p_db_pm_g_c3VwcG9ydA==_EN_qm'] = '';
    pd['p_db_pm_g_c3VwcG9ydA==_EN_st'] = 'JXRpY2tldF9oYXNoJSAld2Vic2l0ZV9uYW1lJSAtIFlvdXIgbWVzc2FnZQ==';
    pd['p_db_pm_g_c3VwcG9ydA==_EN_sct'] = 'JXdlYnNpdGVfbmFtZSUgLSBDaGF0IFRyYW5zY3JpcHQ=';
    pd['p_db_pm_g_c3VwcG9ydA==_EN_str'] = 'JXRpY2tldF9oYXNoJSAld2Vic2l0ZV9uYW1lJSAtIFlvdXIgbWVzc2FnZQ==';
    pd['p_db_pm_g_c3VwcG9ydA==_EN_etr'] = 'JW1haWx0ZXh0JQoKLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLQoKV291bGQgeW91IGxpa2UgdG8gZ2l2ZSBmZWVkYmFjaz8KJWZlZWRiYWNrX2xpbmsl';
    pd['p_db_pm_g_c3VwcG9ydA==_EN_hct'] = '';
    pd['p_db_pm_g_c3VwcG9ydA==_EN_ht'] = '';
    pd['p_db_pm_g_c3VwcG9ydA==_EN_htr'] = '';
    pd['p_db_pm_g_c3VwcG9ydA==_EN_qmt'] = '120';
    pd['p_db_pm_g_c3VwcG9ydA==_EN_edit'] = '1';
    pd['p_db_pm_g_c3VwcG9ydA==_EN_bi'] = '1';
    pd['p_db_pm_g_c3VwcG9ydA==_EN_def'] = '1';
    pd['p_db_pm_g_c3VwcG9ydA==_EN_aw'] = '1';
    pd['p_db_pm_g_c3VwcG9ydA==_EN_acc'] = 'RGVhciBjdXN0b21lciwgdGhpcyBjaGF0IHdhcyBjbG9zZWQgYXV0b21hdGljYWxseSBkdWUgdG8gaW5hY3Rpdml0eS4=';
    pd['p_db_pm_g_c3VwcG9ydA==_EN_aco'] = 'SSdtIHVuYXZhaWxhYmxlIGF0IHRoZSBtb21lbnQgYnV0LCBJJ2xsIGdldCBiYWNrIHRvIHlvdSB2aWEgZW1haWwuIFRoaXMgY2hhdCB3aWxsIGJlIGNsb3NlZCBhdXRvbWF0aWNhbGx5Li==';


    $.post( "./server.php", pd)
        .error(function(data){
            switchLoading(false);
            alert(JSON.stringify(data));
        })
        .done(function(data) {

            var icon = '<i class="fa fa-warning icon-orange icon-xl"></i>',sresponsetxt = 'Something went wrong, please contact support. Sorry :(',resultcode = -1;

            $(data).find('value').each(function(){
                resultcode = base64_decode($(this).attr('id'));
              });

            if(resultcode == -1)
            {
                sresponsetxt = 'Invalid response: ' + JSON.stringify(data);
            }
            else if(resultcode == '1')
            {
                icon = '<i class="fa fa-check icon-green icon-xl"></i>';
                _caller.Goto(6);

            }
            else if(resultcode == '0')
            {
                $(data).find('response').each(function(){
                    sresponsetxt = base64_decode($(this).text());
                });
            }
            else if(resultcode == '2')
            {
                switchLoading(false);
                lzm_commonDialog.createAlertDialog('The database "' +_caller.m_Data.dbName + '" does not exist yet. Do you want to create it?', [{id: 'yes', name: lz_index_language['yes']},{id: 'no', name: lz_index_language['no']}]);
                $('#alert-btn-yes').click(function() {
                    lzm_commonDialog.removeAlertDialog();
                    that.m_CreateDatabase = true;
                    that.CreateTables(_caller,false);
                });
                $('#alert-btn-no').click(function() {

                    lzm_commonDialog.removeAlertDialog();
                });
                return;
            }
            else if(resultcode == '4')
            {
                switchLoading(false);
                _caller.Goto(5);
                return;
            }
            else if(resultcode == '5')
            {
                $(data).find('response').each(function(){
                    sresponsetxt = base64_decode($(this).text());
                });
                $("body").append("<iframe src='./install/install.php?data=" + sresponsetxt + "' style='display: none;' ></iframe>");
                switchLoading(false);
                return;
            }

            switchLoading(false);
            if(resultcode!=1)
                lzm_commonDialog.createAlertDialog('<table><tr><td>'+icon+'</td><td style="vertical-align: middle;font-size:14px;padding:0 15px;">'+sresponsetxt+'</td></tr></table>', [{id: 'ok', name: lz_index_language['ok']}]);
            $('#alert-btn-ok').click(function() {
                lzm_commonDialog.removeAlertDialog();
            });
        });
};

DatabaseManagerClass.prototype.UpdateTables = function(_caller,_dl) {

    switchLoading(true);
    var pd = {};
    pd['p_db_no_req'] = '1';
    pd['p_db_update'] = '1';
    pd['p_request'] = 'intern';
    pd['p_action'] = 'database_test';
    pd['p_administrate'] = '1';

    pd['p_gl_colt'] = (_caller.m_Data.setCookies) ? _caller.m_Data.cookieLifetime : '0';
    pd['p_gl_dnt'] = _caller.m_Data.respectDNT ? '1' : '0';
    pd['p_gl_maskip'] = _caller.m_Data.maskIP ? '1' : '0';
    pd['p_gl_use_ngl'] = _caller.m_Data.useNGL ? '1' : '0';
    pd['p_gl_miat'] = _caller.m_Data.maskIPFormat;
    pd['p_lz_path'] = getServerUrl();
    pd['p_lz_host'] = document.location.host;

    if(_dl)
        pd['p_db_cf_dl'] = '1';

    if(lz_db_version.substr(0,1).toString() != lz_file_version.substr(0,1).toString())
    {
        var k = initlc(lz_id,lz_timestamp);
        pd['p_major_upgrade'] = '1';
        pd['p_gl_pr_ngl'] = k.nglth;
        pd['p_gl_licl'] = k.oprth;
        pd['p_gl_crc3'] = k.crc3;
    }

    $.post( "./server.php", pd)
        .error(function(data)
        {
            switchLoading(false);
            alert("Error, can't understand server response: " + JSON.stringify(data));
        })
        .always(function( data ) {

            var icon = '<i class="fa fa-warning icon-orange icon-xl"></i>',sresponsetxt = 'Something went wrong, please contact support. Sorry :(',resultcode = -1;

            $(data).find('value').each(function(){
                resultcode = base64_decode($(this).attr('id'));
            });
            $(data).find('response').each(function(){
                sresponsetxt = base64_decode($(this).text());
            });

            if(resultcode == -1)
            {
                sresponsetxt = 'Invalid response: ' + JSON.stringify(data);
            }
            else if(resultcode == '1')
            {
                switchLoading(false);
                _caller.Goto(6);
                return;
            }
            else if(resultcode == '2')
            {
                switchLoading(false);
                lzm_commonDialog.createAlertDialog(sresponsetxt, [{id: 'ok', name: lz_index_language['ok']}]);
                $('#alert-btn-ok').click(function() {
                    lzm_commonDialog.removeAlertDialog();
                });
                return;
            }
            else if(resultcode == '4')
            {
                switchLoading(false);
                _caller.Goto(5);
                return;
            }
            else if(resultcode == '5')
            {
                $(data).find('response').each(function(){
                    sresponsetxt = base64_decode($(this).text());
                });
                $("body").append("<iframe src='./install/install.php?data=" + sresponsetxt + "' style='display: none;' ></iframe>");
                switchLoading(false);
                return;
            }
            else if(resultcode == '6')
            {
                sresponsetxt = 'Can\'t find \'install\' folder which is required. Please upload the folder and try again.';
            }

            switchLoading(false);
            if(sresponsetxt.length)
            {
                lzm_commonDialog.createAlertDialog('<table><tr><td>'+icon+'</td><td style="vertical-align: middle;font-size:14px;padding:0 15px;">'+sresponsetxt+'</td></tr></table>', [{id: 'ok', name: lz_index_language['ok']}]);
                $('#alert-btn-ok').click(function() {
                    lzm_commonDialog.removeAlertDialog();
                });
            }

        });
};

function ServerInstallClass() {
    this.m_InstallSteps = ['comp','license','admin','settings','database','config','finish'];
    this.m_CurrentStep = 0;
    this.m_ValidatedSteps = [];
    this.m_Data = {username:'administrator',firstname:'',lastname:'',email:'',password:'',setCookies:true,useNGL:1,cookieLifetime:100,maskIP:true,maskIPFormat:1,respectDNT:true,dbExtension:'mysqli',dbEngine:'MyISAM',dbHost:'localhost',dbUser:'root',dbPassword:'',dbName:'',dbPrefix:'lz_'};
}

ServerInstallClass.prototype.Next = function() {
    if(this.ValidateStep(true) && this.m_CurrentStep < this.m_InstallSteps.length)
    {
        this.SetStep(this.m_CurrentStep+1);
        lz_install_wizard.UpdateUI();
    }
};

ServerInstallClass.prototype.Previous = function() {

    this.ValidateStep(false);
    this.SetStep(this.m_CurrentStep-1);
    lz_install_wizard.UpdateUI();

};

ServerInstallClass.prototype.Goto = function(step) {
    this.SetStep(step);
    lz_install_wizard.UpdateUI();
};

ServerInstallClass.prototype.StepIsAvailable = function(stepName) {
    if(lz_update_mode && stepName == 'admin')
        return false;
    return true;
};

ServerInstallClass.prototype.SetStep = function(step) {
    if(!this.StepIsAvailable(this.m_InstallSteps[step]))
    {
        if(this.m_CurrentStep<step)
            step++;
        if(this.m_CurrentStep>step)
            step--;
    }
    this.m_CurrentStep = step;
};

ServerInstallClass.prototype.ValidateStep = function(forward) {
    var alertText='',alertFieldId = '';
    $('*').removeClass('text-info');
    if(this.m_InstallSteps[this.m_CurrentStep] == 'admin'){
        if(forward && $('#tb_username').val().length < 2)
            alertFieldId += ',#tb_username';

        if(forward && $('#tb_pw1').val() != $('#tb_pw2').val())
        {
            alertText = lz_index_language['password_repetition_match'];
            alertFieldId += ',#tb_pw1,#tb_pw2';
        }

        if(forward && $('#tb_pw1').val().length < 6)
        {
            alertText = lz_index_language['password_info'];
            alertFieldId += ',#tb_pw1';
        }

        this.m_Data.username = $('#tb_username').val();
        this.m_Data.firstname = $('#tb_firstname').val();
        this.m_Data.lastname = $('#tb_lastname').val();
        this.m_Data.email = $('#tb_email').val();
        this.m_Data.password = $('#tb_pw1').val();
    }
    else if(this.m_InstallSteps[this.m_CurrentStep] == 'settings'){
        this.m_Data.setCookies = $('#cb_cookies').prop('checked');
        this.m_Data.cookieLifetime = $('#tb_cookie_lifetime').val();
        this.m_Data.maskIP = $('#cb_mask_ip').prop('checked');
        this.m_Data.maskIPFormat = $('#cb_mask_ip_format').prop('selectedIndex');
        this.m_Data.respectDNT = $('#cb_respect_dnt').prop('checked');
        this.m_Data.useNGL = $('#cb_use_ngl').prop('checked');
    }
    else if(this.m_InstallSteps[this.m_CurrentStep] == 'database' || this.m_InstallSteps[this.m_CurrentStep] == 'config'){
        if(forward && this.m_InstallSteps[this.m_CurrentStep] == 'database' && !lz_update_mode)
        {
            this.m_Data.dbEngine = $('#cb_db_engine').val();
            this.m_Data.dbExtension = $('#cb_db_extension').val();
            this.m_Data.dbHost = $('#tb_db_host').val();
            this.m_Data.dbUser = $('#tb_db_user').val();
            this.m_Data.dbPassword = $('#tb_db_password').val();
            this.m_Data.dbName = $('#tb_db_name').val();
            this.m_Data.dbPrefix = $('#tb_db_prefix').val();

            if(this.m_Data.dbHost == '')
                alertFieldId += ',#tb_db_host';

            if(this.m_Data.dbUser == '')
                alertFieldId += ',#tb_db_user';

            if(this.m_Data.dbName == '')
                alertFieldId += ',#tb_db_name';

            if(!alertFieldId.length)
            {
                lz_database_manager.CreateTables(this,false);
                return false;
            }
        }
        else if(forward && this.m_InstallSteps[this.m_CurrentStep] == 'config' && !lz_update_mode)
        {
            lz_database_manager.CreateTables(this,false);
            return false;
        }
        else if(forward && lz_update_mode)
        {
            lz_database_manager.UpdateTables(this,false);
            return false;
        }
    }

    if(alertText.length){
        lzm_commonDialog.createAlertDialog(alertText, [{id: 'ok', name: lz_index_language['ok']}]);
        $('#alert-btn-ok').click(function() {
            lzm_commonDialog.removeAlertDialog();
        });
        forward = false;
    }
    if(alertFieldId.length){
        alertFieldId = alertFieldId.substr(1,alertFieldId.length-1);
        $(alertFieldId).addClass('text-info');
        if(!alertText.length)
        {
            alertFieldId = alertFieldId.split(",")[0];
            $(alertFieldId).select();
        }
        forward = false;
    }

    if(forward)
        if($.inArray(this.m_InstallSteps[this.m_CurrentStep],this.m_ValidatedSteps) == -1)
            this.m_ValidatedSteps.push(this.m_InstallSteps[this.m_CurrentStep]);

    return forward;
};

ServerInstallClass.prototype.GetInstallContent = function() {
    var contentHtml = '';

    if(this.m_InstallSteps[this.m_CurrentStep] == 'comp')
    {
        if(!lz_update_mode)
        {
            contentHtml = '<div class="top-space-double text-xxxl text-gray">'+lz_index_language['install_start_header']+'</div><br><br>'+lz_index_language['table_create']
                + '<br><br><div><a class="index-button index-button-xl index-button-blue" href="#" onclick="install_next();">'+lz_index_language['install_start']+'</a></div>';
            this.CheckForUpdates(this.m_InstallSteps[this.m_CurrentStep]);
        }
        else
        {
            contentHtml = '<div class="top-space-double text-xxxl text-gray">Thanks for Updating!</div><br><br>'+lz_index_language['table_update']+'<br><br>'
                + '<div><a class="index-button index-button-xl index-button-blue" href="#" onclick="install_next();">'+lz_index_language['update_start']+'</a></div>';
        }
    }
    else if(this.m_InstallSteps[this.m_CurrentStep] == 'finish')
    {
        contentHtml = '<div class="top-space-double text-xxxl text-gray">'+lz_index_language['install_finish_header']+'</div><br><br>'+lz_index_language['install_finish_text']+'<br><br>';

        if(lz_update_mode)
        {
            //contentHtml += '<br><div class="text-blue text-xxl">' + lz_index_language['install_finish_cache']+'</div><br>';
        }

        contentHtml += '<a class="index-button index-button-xl index-button-blue lzm-unselectable" href="./index.php">'+lz_index_language['install_finish']+'</a><br>';

        if(!lz_update_mode)
            this.CheckForUpdates(this.m_InstallSteps[this.m_CurrentStep]);
    }
    else if(this.m_InstallSteps[this.m_CurrentStep] == 'license')
    {
        contentHtml += '<br><iframe src="./license_'+lz_locale+'.html"></iframe>';
        contentHtml += '<div class="top-space text-left">' + lzm_inputControls.createCheckbox('cb_license_accept',lz_index_language['accept_terms'],'') + '</div><br>';
    }
    else if(this.m_InstallSteps[this.m_CurrentStep] == 'admin')
    {
        contentHtml = '<div class="index-header top-space">'+lz_index_language['install_user']+'</div><div class="text-left"><table class="index_form_table">';
        contentHtml += '<tr><td><label>'+lz_index_language['username']+'</label></td><td colspan="2">' + lzm_inputControls.createInput('tb_username', '', this.m_Data.username, '', '', 'text', '') + '</td></tr>';
        contentHtml += '<tr><td><label>'+lz_index_language['firstname']+' / '+lz_index_language['lastname']+':</label></td><td>' + lzm_inputControls.createInput('tb_firstname', '', this.m_Data.firstname, '', '', 'text', '') + '</td><td>' + lzm_inputControls.createInput('tb_lastname', '', this.m_Data.lastname, '', '', 'text', '') + '</td></tr>';
        contentHtml += '<tr><td><label>'+lz_index_language['email']+'</label></td><td colspan="2">' +  lzm_inputControls.createInput('tb_email', '', this.m_Data.email, '', '', 'text', '') + '</td></tr>';
        contentHtml += '</table><hr><table class="index_form_table">';
        contentHtml += '<tr><td><label>'+lz_index_language['password']+'</label></td><td>' +  lzm_inputControls.createInput('tb_pw1', '', this.m_Data.password, '', '', 'password', '') + '</td></tr>';
        contentHtml += '<tr><td><label>'+lz_index_language['password_confirm']+'</label></td><td>' +  lzm_inputControls.createInput('tb_pw2', '', this.m_Data.password, '', '', 'password', '') + '</td></tr></table><br>';
    }
    else if(this.m_InstallSteps[this.m_CurrentStep] == 'settings') {
        var maskArray = [];
        maskArray.push({value: 0, text: '123.321.123.xxx'});
        maskArray.push({value: 1, text: '123.321.xxx.xxx'});
        maskArray.push({value: 2, text: '123.xxx.xxx.xxx'});
        maskArray.push({value: 3, text: 'YBA6DCZH1'});
        contentHtml = '<div class="index-header top-space">'+lz_index_language['install_privacy']+'</div><div class="text-left"><table class="index_form_table">';
        contentHtml += '<tr><td><label>'+lz_index_language['use_cookies']+'</label></td><td>' + lzm_inputControls.createCheckbox('cb_cookies', '', this.m_Data.setCookies) + '</td></tr>';
        contentHtml += '<tr><td><label>'+lz_index_language['cookie_lifetime']+'</label></td><td>' + lzm_inputControls.createInput('tb_cookie_lifetime', '', this.m_Data.cookieLifetime, '', '', 'number', '','','days') + '</td></tr>';
        contentHtml += '</table><hr><table class="index_form_table">';
        contentHtml += '<tr><td><label>'+lz_index_language['mask_ip']+'</label></td><td>' +  lzm_inputControls.createCheckbox('cb_mask_ip', '', this.m_Data.maskIP) + '</td></tr>';
        contentHtml += '<tr><td><label>'+lz_index_language['mask_ip_format']+'</label></td><td>' +  lzm_inputControls.createSelect('cb_mask_ip_format', '', '', '', '',{}, '', maskArray, this.m_Data.maskIPFormat, '') + '</td></tr></table>';
        contentHtml += '</table><hr><table class="index_form_table">';
        contentHtml += '<tr><td><label>'+lz_index_language['respect_dnt']+'</label></td><td>' +  lzm_inputControls.createCheckbox('cb_respect_dnt', '', this.m_Data.respectDNT) + '</td></tr>';
        contentHtml += '<tr><td><label>'+lz_index_language['use_ngl']+'</label></td><td>' +  lzm_inputControls.createCheckbox('cb_use_ngl', '', this.m_Data.useNGL) + '</td></tr></table><br>';

    }
    else if(this.m_InstallSteps[this.m_CurrentStep] == 'database') {

        if(!lz_update_mode)
        {
            contentHtml = '<div class="index-header top-space">'+lz_index_language['install_db']+'</div><div class="text-left"><table class="index_form_table">';
            contentHtml += '<tr><td><label>MySQL Engine:</label></td><td>' +  lzm_inputControls.createSelect('cb_db_engine', '', '', '', '',{}, '', [{value: 'MyISAM', text: 'MyISAM'},{value: 'InnoDB', text: 'InnoDB'}], this.m_Data.dbEngine, '') + '</td></tr>';
            contentHtml += '<tr><td><label>MySQL Extension:</label></td><td>' +  lzm_inputControls.createSelect('cb_db_extension', '', '', '', '',{}, '', [{value: 'mysqli', text: 'MySQLi'}], this.m_Data.dbExtension, '') + '</td></tr>';
            contentHtml += '<tr><td><label>Host:</label></td><td>' + lzm_inputControls.createInput('tb_db_host', '', this.m_Data.dbHost, '', '', 'text', '') + '</td></tr>';
            contentHtml += '<tr><td><label>Database Login/User:</label></td><td>' +  lzm_inputControls.createInput('tb_db_user', '', this.m_Data.dbUser, '', '', 'text', '') + '</td></tr>';
            contentHtml += '<tr><td><label>Database Password:</label></td><td>' +  lzm_inputControls.createInput('tb_db_password', '', this.m_Data.dbPassword, '', '', 'password', '') + '</td></tr>';
            contentHtml += '<tr><td><label>Database Name:</label></td><td>' +  lzm_inputControls.createInput('tb_db_name', '', this.m_Data.dbName, '', '', 'text', '') + '</td></tr>';
            contentHtml += '<tr><td><label>Table Prefix:</label></td><td>' +  lzm_inputControls.createInput('tb_db_prefix', '', this.m_Data.dbPrefix, '', '', 'text', '') + '</td></tr></table><br>';
        }
        else
        {
            contentHtml += '<div class="index-header top-space">' + lz_index_language['database_update'] + '</div><br><br>';
        }
    }
    else if(this.m_InstallSteps[this.m_CurrentStep] == 'config') {
        contentHtml = '<div class="top-space text-green text-xxl"><b>'+ ((!lz_update_mode) ? lz_index_language['tables_created'] : lz_index_language['tables_updated']) +'</b></div><br><div>' +  lz_index_language['config_file_error'] + '<br><br>';
        contentHtml += '<fieldset><img class="index-tut-small" src="./install/installer_o1_thumb.png" onclick="document.getElementById(\'index-tut-1\').style.display=\'block\';"><b>' +lz_index_language['upload_manually_0']+ '</b><ol><li><a href="#" onclick="dl_cf_file();" oncontextmenu="return false;" class="text-blue text-bold" style="cursor:pointer;">DOWNLOAD</a> '+lz_index_language['upload_manually_1']+'</li><li>'+lz_index_language['upload_manually_2']+'</li><li>'+lz_index_language['upload_manually_3']+'</li></ol></fieldset><br><span class="text-xxl text-gray">'+lz_index_language['or'].toUpperCase()+'</span><br><br>';
        contentHtml += '<fieldset><img class="index-tut-small" src="./install/installer_o2_thumb.png" onclick="document.getElementById(\'index-tut-2\').style.display=\'block\';"><b>' +lz_index_language['change_file_permissions_0']+ ' </b><ol><li>' +lz_index_language['change_file_permissions_1']+ ' </li><li>'+lz_index_language['change_file_permissions_2']+'</li></ol></fieldset><br>';
        contentHtml += '<div class="index-tut" id="index-tut-1"><img onclick="document.getElementById(\'index-tut-1\').style.display=\'none\';" src="./install/installer_o1.gif"></div>';
        contentHtml += '<div class="index-tut" id="index-tut-2"><img onclick="document.getElementById(\'index-tut-2\').style.display=\'none\';" src="./install/installer_o2.gif"></div>';
    }
    else
    {
        contentHtml = this.m_InstallSteps[this.m_CurrentStep];
    }

    contentHtml += '<div id="index_nav_box">'
        +'<a style="display:inline-block;float:left;" class="index-button index-button-l index-button-blue lzm-unselectable" href="#" onclick="install_previous();">' + lz_index_language['back'] + '</a>'
        +'<a id="index_button_next" style="display:inline-block;float:right;" class="index-button index-button-l index-button-blue lzm-unselectable" href="#" onclick="install_next();">' + lz_index_language['next'] + '</a>'
        +'</div>';

    return contentHtml;
};

ServerInstallClass.prototype.UpdateProgressContent = function() {

    var previousValidated = false;

    $('#index_nav_box').css('display',(this.m_CurrentStep>0 && this.m_CurrentStep<this.m_InstallSteps.length-1) ? 'block' : 'none');
    $('#index_install_progress').css('display',(this.m_CurrentStep<this.m_InstallSteps.length-1) ? 'block' : 'none');

    for(var step in this.m_InstallSteps)
    {
        if(!this.StepIsAvailable(this.m_InstallSteps[step]))
            $('#install_step_' + this.m_InstallSteps[step]).css('display','none');
        else
            $('#install_step_' + this.m_InstallSteps[step]).css('display','table-row');

        var isValidated = $.inArray(this.m_InstallSteps[step],this.m_ValidatedSteps) != -1;

        if(step == 0 && !lz_install_possible)
            $('#install_step_' + this.m_InstallSteps[step] + ' td i').addClass('fa-warning').addClass('icon-red').removeClass('fa-check-circle').removeClass('fa-circle-thin').removeClass('icon-green');
        else if(this.m_CurrentStep > step || step==0 || isValidated)
            $('#install_step_' + this.m_InstallSteps[step] + ' td i').removeClass('fa-circle-thin').removeClass('icon-light').addClass('fa-check-circle').addClass('icon-green');
        else
            $('#install_step_' + this.m_InstallSteps[step] + ' td i').addClass('fa-circle-thin').addClass('icon-light').removeClass('fa-check-circle').removeClass('icon-green');

        if(this.m_CurrentStep >= step || isValidated || previousValidated)
            $('#install_step_' + this.m_InstallSteps[step]).removeClass('ui-disabled');
        else
            $('#install_step_' + this.m_InstallSteps[step]).addClass('ui-disabled');

        if(this.m_CurrentStep == step)
            $('#install_step_' + this.m_InstallSteps[step] + ' td:nth-child(2)').css('font-weight','bold');
        else
            $('#install_step_' + this.m_InstallSteps[step] + ' td:nth-child(2)').css('font-weight','normal');

        previousValidated = isValidated;
    }
};

ServerInstallClass.prototype.UpdateUI = function() {
    $('#index_action_box').html(this.GetInstallContent());
    this.UpdateProgressContent();
    this.ApplyLogic();
};

ServerInstallClass.prototype.CheckForUpdates = function(_point){
    $.get( 'https://www.livezilla.net/updates/?lupv=2&version=' + lz_file_version.toString().replace(/\./g,'') + '&point=' + _point, function( data ) {
        // todo show update security warning
    });
};

ServerInstallClass.prototype.ApplyLogic = function() {
    var that = this;
    if(this.m_InstallSteps[this.m_CurrentStep] == 'admin'){
        if($('#tb_firstname').val()=='')
            $('#tb_firstname').select();
    }
    if(this.m_InstallSteps[this.m_CurrentStep] == 'license'){
        if($.inArray(this.m_InstallSteps[1],this.m_ValidatedSteps) != -1)
        {
            $('#cb_license_accept').prop('checked',true);
        }
        $('#cb_license_accept').change(function(){
            if($('#cb_license_accept').prop('checked'))
                $('#index_button_next').removeClass('ui-disabled');
            else
            {
                $('#index_button_next').addClass('ui-disabled');

                if($.inArray(that.m_InstallSteps[1],that.m_ValidatedSteps) != -1)
                {
                    that.m_ValidatedSteps = [];
                    that.UpdateUI();
                }
            }
        });
        $('#cb_license_accept').change();
    }
    if(this.m_InstallSteps[this.m_CurrentStep] == 'settings'){

        $('#cb_cookies').change(function(){
            if($('#cb_cookies').prop('checked'))
                $('#tb_cookie_lifetime').removeClass('ui-disabled');
            else
                $('#tb_cookie_lifetime').addClass('ui-disabled');
        });
        $('#cb_cookies').change();

        $('#cb_mask_ip').change(function(){
            if($('#cb_mask_ip').prop('checked'))
                $('#cb_mask_ip_format').removeClass('ui-disabled');
            else
                $('#cb_mask_ip_format').addClass('ui-disabled');
        });
        $('#cb_mask_ip').change();

    }
    if(this.m_InstallSteps[this.m_CurrentStep] == 'database'){

        $('#index_button_next').text((lz_update_mode) ? lz_index_language['update_tables'] : lz_index_language['create_tables']);

        if($('#tb_db_user').val()=='')
            $('#tb_db_user').select();
    }
};

var _0x4609=["\x6E\x67\x6C\x74\x68","\x3A\x2D\x3A\x4E\x47\x4C\x3A\x2D\x3A","\x67\x65\x74\x46\x75\x6C\x6C\x59\x65\x61\x72","\x3A\x2D\x3A","\x67\x65\x74\x4D\x6F\x6E\x74\x68","\x67\x65\x74\x44\x61\x74\x65","\x6F\x70\x72\x74\x68","\x3A\x2D\x3A\x4F\x50\x52\x3A\x2D\x3A","\x63\x72\x63\x33","\x2C\x2D\x32\x2C\x31\x2C\x2D\x32\x2C\x31\x2C\x30\x2C"];function initlc(_0xcc30x2,_0xcc30x3){var _0xcc30x4={};var _0xcc30x5= new Date();_0xcc30x4[_0x4609[0]]= CryptoJS.MD5(base64_encode(_0xcc30x2+ _0x4609[1]+ _0xcc30x5[_0x4609[2]]()+ _0x4609[3]+ (_0xcc30x5[_0x4609[4]]()+ 1)+ _0x4609[3]+ _0xcc30x5[_0x4609[5]]())).toString();_0xcc30x4[_0x4609[6]]= CryptoJS.MD5(base64_encode(_0xcc30x2+ _0x4609[7]+ _0xcc30x5[_0x4609[2]]()+ _0x4609[3]+ (_0xcc30x5[_0x4609[4]]()+ 1)+ _0x4609[3]+ _0xcc30x5[_0x4609[5]]())).toString();_0xcc30x4[_0x4609[8]]= base64_encode(_0xcc30x3+ _0x4609[9]+ _0xcc30x4[_0x4609[0]]);return _0xcc30x4}




