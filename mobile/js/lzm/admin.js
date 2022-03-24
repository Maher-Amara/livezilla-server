var lzm_inputControls = {};
var lzm_translations = {};
var lzm_layout = {};
var lzm_userManagement = {};
var lzm_pollServer = {};
var lzm_commonTools = {};
var lzm_commonPermissions = {};
var lzm_serverEvaluation = {};
var lzm_commonDialog = {};
var userLanguage = 'en';

console.stack = function(){
    try{
        var err = new Error();
        console.log(err.stack);
    }catch(e){}
}

console.logit = function(obj){
    console.log(lzm_commonTools.clone(obj));
};

function deblog(data){
    console.log(data);
    console.stack();
}

var sha256 = function(str) {
    str = (typeof str == 'undefined') ? 'undefined' : (str == null) ? 'null' : str.toString();
    return CryptoJS.SHA256(str).toString();
};

var sha1 = function(str) {
    str = (typeof str == 'undefined') ? 'undefined' : (str == null) ? 'null' : str.toString();
    return CryptoJS.SHA1(str).toString();
};

var md5 = function(str) {
    str = (typeof str == 'undefined') ? 'undefined' : (str == null) ? 'null' : str.toString();
    return CryptoJS.MD5(str).toString();
};

var d = function(param){
    return (typeof(param)!='undefined'&&param!='undefined');
};

var t = function(translatableString, replacementArray) {
    return lzm_translations.translate(translatableString, replacementArray);
};

var tid = function(id, placeholderArray){
    return lzm_translations.getById(id, placeholderArray);
};

var tidc = function(id, suffix, placeholderArray) {
    suffix = (typeof suffix != 'undefined') ? suffix : ':';
    var x = lzm_translations.getById(id, placeholderArray);
    if(lzm_commonTools.endsWith(x, suffix))
        return x;
    else
        return x + suffix;
};

var loadUserManagement = function() {
    lzm_inputControls = new CommonInputControlsClass();
    lzm_translations = new CommonTranslationClass('', '', '', false, language);
    lzm_translations.setTranslationData(translationData);
    lzm_layout = new AdminDisplayLayoutClass();
    lzm_userManagement = new AdminUserManagementClass();
    lzm_pollServer = new AdminPollServerClass();
    lzm_commonTools = new CommonToolsClass();
    lzm_commonPermissions = new CommonPermissionClass();
    lzm_commonDialog = new CommonDialogClass();
    lzm_serverEvaluation = new CommonServerEvaluationClass();

    setUserManagementData();

    lzm_userManagement.CreateListView('', '', 'user');

    $('body').click(function() {
        removeUmgContextMenu();
        window.parent.ContextMenuClass.RemoveAll();
        removeSignaturePlaceholderMenu();
        removeTextEmailsPlaceholderMenu();
    });

    $(window).resize(function() {
        lzm_layout.resizeAll();
    });
};

var setUserManagementData = function() {

    var operators = window.parent.DataEngine.operators.getOperatorList('', '', true);
    var groups = window.parent.DataEngine.groups.getGroupList('', true, false);
    lzm_userManagement.roles = lzm_commonTools.clone(window.parent.DataEngine.roles);
    var inputs = window.parent.DataEngine.inputList.getCustomInputList('full');
    var i;

    for (i=0; i<operators.length; i++)
        lzm_userManagement.operators.copyOperator(operators[i]);

    for (i=0; i<groups.length; i++)
        lzm_userManagement.groups.copyGroup(groups[i]);

    for (i=0; i<inputs.length; i++)
        lzm_userManagement.inputList.copyCustomInput(inputs[i]);

    lzm_pollServer.loginData = {
        login: window.parent.CommunicationEngine.chosenProfile.login_name,
        passwd: window.parent.CommunicationEngine.chosenProfile.login_passwd,
        id: window.parent.CommunicationEngine.chosenProfile.login_id,
        version: window.parent.lzm_commonConfig.lz_version,
        ldap: window.parent.CommunicationEngine.chosenProfile.ldap
    };

    lzm_pollServer.serverUrl = window.parent.CommunicationEngine.chosenProfile.server_protocol +
        window.parent.CommunicationEngine.chosenProfile.server_url;
    lzm_userManagement.defaultLanguage = window.parent.DataEngine.defaultLanguage;
    lzm_serverEvaluation.setLanguages(window.parent.DataEngine.userLanguage, window.parent.DataEngine.defaultLanguage);
    lzm_userManagement.availableLanguages = lzm_commonTools.clone(window.parent.lzm_chatDisplay.availableLanguages);

    lzm_pollServer.pollServerAdminLogin();
};

var editListObject = function (myId, e) {

    removeUmgContextMenu();

    myId = (myId == null) ? ((lzm_userManagement.selectedListTab == 'user') ? lzm_userManagement.selectedUser : ((lzm_userManagement.selectedListTab == 'group') ? lzm_userManagement.selectedGroup : lzm_userManagement.selectedRole)) : myId;

    selectTableLine('main',myId);

    if (lzm_userManagement.selectedListTab == 'user')
    {
        var operator = lzm_userManagement.operators.getOperator(myId);
        if (operator != null && operator.isbot == 1)
        {
            lzm_userManagement.createBotConfiguration(operator);
        }
        else if (operator != null)
        {
            lzm_userManagement.createOperatorConfiguration(operator);
        }
        else
        {
            parent.lzm_commonDialog.createAlertDialog(tid('no_element'), [{id: 'ok', name: t('Ok')}]);
            $('#alert-btn-ok',parent.document).click(function(){
                parent.lzm_commonDialog.removeAlertDialog();
            });
        }
    }
    else if(lzm_userManagement.selectedListTab == 'group')
    {
        var group = lzm_userManagement.groups.getGroup(myId);
        if (group != null)
        {
            lzm_userManagement.createGroupConfiguration(group);
        }
        else
        {
            parent.lzm_commonDialog.createAlertDialog(tid('no_element'), [{id: 'ok', name: t('Ok')}]);
            $('#alert-btn-ok',parent.document).click(function(){
                parent.lzm_commonDialog.removeAlertDialog();
            });
        }
    }
    else if(lzm_userManagement.selectedListTab == 'role')
    {
        var role = lzm_commonTools.GetElementByProperty(lzm_userManagement.roles,'i',myId);

        role = role.length ? role[0] : null;

        if (role != null)
        {
            lzm_userManagement.createRoleConfiguration(role);
        }
        else
        {
            parent.lzm_commonDialog.createAlertDialog(tid('no_element'), [{id: 'ok', name: tid('ok')}]);
            $('#alert-btn-ok',parent.document).click(function(){
                parent.lzm_commonDialog.removeAlertDialog();
            });
        }
    }
};

var copyOperator = function(myId) {
    removeUmgContextMenu();
    selectTableLine('main','');
    var operator = lzm_userManagement.operators.getOperator(myId);
    if (operator != null)
    {
        operator.is_active = true;
        operator.is_copy = true;

        operator.id = '';
        operator.userid = '';
        operator.name = '';
        operator.ldap=0;
        //operator.email = '';
        //operator.desc = '';

        operator.pass = '';

        //operator.groups = [];
        //operator.groupsHidden = [];

        if (operator.isbot == '1')
        {
            //operator.pp = lzm_userManagement.newBotPic;
            lzm_userManagement.createBotConfiguration(operator);
        }
        else
        {
            //operator.pp = '';
            lzm_userManagement.createOperatorConfiguration(operator);
        }
    }
};

var copyOpPermsFrom = function(myId, opId, e) {
    removeUmgContextMenu();
    selectTableLine('main',myId);
    var myOperator = lzm_userManagement.operators.getOperator(myId);
    var otherOperator = lzm_userManagement.operators.getOperator(opId);
    if (myOperator != null && otherOperator != null) {
        myOperator.perms = lzm_commonTools.clone(otherOperator.perms);
        lzm_userManagement.createOperatorConfiguration(myOperator);
    }
};

var showUmgContextMenu = function(myId, e) {

    e.preventDefault();

    selectTableLine('main',myId);

    window.parent.ContextMenuClass.RemoveAll();

    if (!lzm_userManagement.contextMenuIsVisible)
    {
        var myObject = null;
        if (lzm_userManagement.selectedListTab == 'user')
            myObject = lzm_userManagement.operators.getOperator(myId);
        else if (lzm_userManagement.selectedListTab == 'group')
            myObject = lzm_userManagement.groups.getGroup(myId);
        else if (lzm_userManagement.selectedListTab == 'role')
        {
            var role = lzm_commonTools.GetElementByProperty(lzm_userManagement.roles,'i',myId);
            myObject = role.length ? role[0] : null;
        }

        if (myObject != null)
        {
            var scrolledDownY = $('#umg-content').scrollTop();
            var scrolledDownX = $('#umg-content').scrollLeft();
            var parentOffset = $('#umg-content').offset();
            var yValue = e.pageY - parentOffset.top + scrolledDownY + 36;
            var xValue = e.pageX - parentOffset.left + scrolledDownX;
            lzm_userManagement.showContextMenu(lzm_userManagement.selectedListTab, myObject, xValue, yValue, '');
            lzm_userManagement.contextMenuIsVisible = true;
        }
    }
    else
        removeUmgContextMenu();
};

var showSubMenu = function(place, objectId, contextX, contextY, menuWidth, menuHeight) {
    lzm_userManagement.showSubMenu(place, objectId, contextX, contextY, menuWidth, menuHeight);
};

var showSuperMenu = function(place, contextX, contextY, menuWidth, menuHeight) {
    lzm_userManagement.showSuperMenu(place, contextX, contextY, menuWidth, menuHeight);
};

var removeUmgContextMenu = function() {
    $('#user-context').remove();
    $('#group-context').remove();
    $('#role-context').remove();
    lzm_userManagement.contextMenuIsVisible = false;
};

var removeListObject = function(_myId, e) {

    _myId = (_myId == null) ? ((lzm_userManagement.selectedListTab == 'user') ? lzm_userManagement.selectedUser : ((lzm_userManagement.selectedListTab == 'group') ? lzm_userManagement.selectedGroup : lzm_userManagement.selectedRole)) : _myId;

    removeUmgContextMenu();

    if (lzm_userManagement.selectedListTab == 'user')
    {
        var lzch = parent.DataEngine.getConfigValue('gl_lzch',false) == 1;
        var operator = lzm_userManagement.operators.getOperator(_myId);
        if (operator == null)
        {
            parent.lzm_commonDialog.createAlertDialog(tid('no_element'), [{id: 'ok', name: tid('ok')}]);
            $('#alert-btn-ok',parent.document).click(function(){
                parent.lzm_commonDialog.removeAlertDialog();
            });
            return;
        }
        else if(lzch && operator.userid == 'administrator')
        {
            parent.lzm_commonDialog.createAlertDialog(tid('element_protected'), [{id: 'ok', name: tid('ok')}]);
            $('#alert-btn-ok',parent.document).click(function(){
                parent.lzm_commonDialog.removeAlertDialog();
            });
            return;
        }
    }
    else if (lzm_userManagement.selectedListTab == 'group')
    {
        var group = lzm_userManagement.groups.getGroup(_myId);
        if (group == null)
        {
            parent.lzm_commonDialog.createAlertDialog(tid('no_element'), [{id: 'ok', name: tid('ok')}]);
            $('#alert-btn-ok',parent.document).click(function(){
                parent.lzm_commonDialog.removeAlertDialog();
            });
            return;
        }
    }
    else if (lzm_userManagement.selectedListTab == 'role')
    {
        var role = lzm_commonTools.GetElementByProperty(lzm_userManagement.roles,'i',_myId);
        role = role.length ? role[0] : null;

        if (role == null)
        {
            parent.lzm_commonDialog.createAlertDialog(tid('no_element'), [{id: 'ok', name: tid('ok')}]);
            $('#alert-btn-ok',parent.document).click(function(){
                parent.lzm_commonDialog.removeAlertDialog();
            });
            return;
        }
    }

    lzm_userManagement.removeObject(_myId);
};

var createListObject = function(type,ldap) {

    window.parent.ContextMenuClass.RemoveAll();
    removeUmgContextMenu();

    ldap = (d(ldap)) ? ldap : false;
    type = (type == null) ? lzm_userManagement.selectedListTab : type;

    if (type == 'user')
    {
        $('#umg-list-placeholder-tab-0').click();
        lzm_userManagement.newUser = lzm_userManagement.createEmptyUser('operator');
        lzm_userManagement.selectedUser = '';

        if(ldap)
            lzm_userManagement.LDAPSearch(type);
        else
            lzm_userManagement.createOperatorConfiguration(null);
    }
    else if(type == 'bot')
    {
        $('#umg-list-placeholder-tab-0').click();
        lzm_userManagement.newUser = lzm_userManagement.createEmptyUser('bot');
        lzm_userManagement.selectedUser = '';
        lzm_userManagement.createBotConfiguration(null);
    }
    else if(type == 'group')
    {
        $('#umg-list-placeholder-tab-1').click();
        lzm_userManagement.newGroup = lzm_userManagement.createEmptyGroup();
        lzm_userManagement.selectedGroup = '';
        lzm_userManagement.createGroupConfiguration(null);
    }
    else if(type == 'role')
    {
        $('#umg-list-placeholder-tab-2').click();
        lzm_userManagement.newRole = lzm_userManagement.createEmptyRole();
        lzm_userManagement.selectedRole = '';
        lzm_userManagement.createRoleConfiguration(null);
    }
};

var showCreateButtonMenu = function(event) {

    event.stopPropagation();
    if (!lzm_userManagement.createButtonMenuIsVisible)
    {
        var disabled = (parent.DataEngine.getConfigValue('gl_ldap',false)!='1') ? ' class="ui-disabled"' : '';
        var cm = {
            id: 'vuser_management_cm',
            entries: [
                {label: tid('operator'), onClick : 'document.getElementById(\'user-management-iframe\').contentWindow.createListObject(\'user\');'},
                {label: tid('operator') + ' (LDAP)', onClick : 'document.getElementById(\'user-management-iframe\').contentWindow.createListObject(\'user\',true);', disabled: disabled},
                {label: tid('bot'), onClick : 'document.getElementById(\'user-management-iframe\').contentWindow.createListObject(\'bot\');'},
                '',
                {label: tid('role'), onClick : 'document.getElementById(\'user-management-iframe\').contentWindow.createListObject(\'role\');'},
                '',
                {label: tid('group'), onClick : 'document.getElementById(\'user-management-iframe\').contentWindow.createListObject(\'group\');'}
            ]
        };
        window.parent.ContextMenuClass.BuildMenu(event,cm);
    }
    else
    {
        window.parent.ContextMenuClass.RemoveAll();
    }
};

var createSignature = function() {
    selectSignature(-1);
    lzm_userManagement.createSignatureInput(null);
};

var editSignature = function(signatureNo) {
    if (typeof signatureNo != 'undefined') {
        selectSignature(signatureNo);
    }
    var signature = {};
    if (lzm_userManagement.selectedListTab == 'user')
    {
        var operator = lzm_commonTools.clone(lzm_userManagement.loadedUser);
        operator = (operator != null) ? operator : lzm_userManagement.newUser;
        signature = lzm_commonTools.clone(operator.sig[lzm_userManagement.selectedSignatureNo]);
        lzm_userManagement.createSignatureInput(signature);
    }
    else
    {
        var group = lzm_commonTools.clone(lzm_userManagement.loadedGroup);
        group = (group != null) ? group : lzm_userManagement.newGroup;
        signature = lzm_commonTools.clone(group.sig[lzm_userManagement.selectedSignatureNo]);
        lzm_userManagement.createSignatureInput(signature);
    }
};

var removeSignature = function() {
    var operator = null, group = null, signatureList = [];
    if (lzm_userManagement.selectedListTab == 'user')
    {
        operator = lzm_commonTools.clone(lzm_userManagement.loadedUser);
        operator = (operator != null) ? operator : lzm_userManagement.newUser;
        signatureList = (operator != null && typeof operator.sig != 'undefined') ? operator.sig : [];
    }
    else
    {
        group = lzm_commonTools.clone(lzm_userManagement.loadedGroup);
        group = (group != null) ? group : lzm_userManagement.newGroup;
        signatureList = (group != null && typeof group.sig != 'undefined') ? group.sig : [];
    }
    var tmpArray = [];
    for (var i=0; i<signatureList.length; i++) {
        if (i != lzm_userManagement.selectedSignatureNo) {
            tmpArray.push(signatureList[i]);
        } else {
            var deletedSignature = lzm_commonTools.clone(signatureList[i]);
            deletedSignature.deleted = true;
            tmpArray.push(deletedSignature);
        }
    }
    if (lzm_userManagement.selectedListTab == 'user') {
        if (lzm_userManagement.selectedUser != '') {
            lzm_userManagement.loadedUser.sig = lzm_commonTools.clone(tmpArray);
            operator = lzm_commonTools.clone(lzm_userManagement.loadedUser);
        } else {
            lzm_userManagement.newUser.sig = tmpArray;
            operator = lzm_commonTools.clone(lzm_userManagement.newUser);
        }
        $('.umg-edit-placeholder-content').each(function() {
            if ($(this).data('hash') == 'signatures') {
                $(this).html(lzm_userManagement.createSignatureConfiguration(operator));
            }
        });
    } else {
        if (lzm_userManagement.selectedGroup != '') {
            lzm_userManagement.loadedGroup.sig = lzm_commonTools.clone(tmpArray);
            group = lzm_commonTools.clone(lzm_userManagement.loadedGroup);
        } else {
            lzm_userManagement.newGroup.sig = tmpArray;
            group = lzm_commonTools.clone(lzm_userManagement.newGroup);
        }
        $('.umg-edit-placeholder-content').each(function() {
            if ($(this).data('hash') == 'signatures') {
                $(this).html(lzm_userManagement.createSignatureConfiguration(group));
            }
        });
    }
    lzm_layout.resizeAll();
};

var setSignatureAsDefault = function() {
    var signatureList = [], operator = null, group = null;
    if (lzm_userManagement.selectedListTab == 'user') {
        operator = lzm_commonTools.clone(lzm_userManagement.loadedUser);
        operator = (operator != null) ? operator : lzm_commonTools.clone(lzm_userManagement.newUser);
        signatureList = (operator != null && typeof operator.sig != 'undefined') ? operator.sig : [];
    } else {
        group = lzm_commonTools.clone(lzm_userManagement.loadedGroup);
        group = (group != null) ? group : lzm_commonTools.clone(lzm_userManagement.newGroup);
        signatureList = (group != null && typeof group.sig != 'undefined') ? group.sig : [];
    }
    for (var i=0; i<signatureList.length; i++) {
        if (i == lzm_userManagement.selectedSignatureNo) {
            signatureList[i].d = '1';
        } else {
            signatureList[i].d = '0';
        }
    }
    lzm_userManagement.selectedSignatureNo = -1;
    if (lzm_userManagement.selectedListTab == 'user') {
        if (lzm_userManagement.selectedUser != '') {
            lzm_userManagement.loadedUser.sig = lzm_commonTools.clone(signatureList);
            operator = lzm_commonTools.clone(lzm_userManagement.loadedUser);
        } else {
            lzm_userManagement.newUser.sig = signatureList;
            operator = lzm_commonTools.clone(lzm_userManagement.newUser);
        }
        $('.umg-edit-placeholder-content').each(function() {
            if ($(this).data('hash') == 'signatures') {
                $(this).html(lzm_userManagement.createSignatureConfiguration(operator));
            }
        });
    } else {
        if (lzm_userManagement.selectedGroup != '') {
            lzm_userManagement.loadedGroup.sig = lzm_commonTools.clone(signatureList);
            group = lzm_commonTools.clone(lzm_userManagement.loadedGroup);
        } else {
            lzm_userManagement.newGroup.sig = signatureList;
            group = lzm_commonTools.clone(lzm_userManagement.newGroup);
        }
        $('.umg-edit-placeholder-content').each(function() {
            if ($(this).data('hash') == 'signatures') {
                $(this).html(lzm_userManagement.createSignatureConfiguration(group));
            }
        });
    }
    lzm_layout.resizeAll();
};

var selectSignature = function(signatureNo) {
    lzm_userManagement.selectedSignatureNo = signatureNo;
    $('.sig-edit-btns').removeClass('ui-disabled');
    $('.signature-list-line').removeClass('selected-table-line');
    $('#signature-list-line-' + signatureNo).addClass('selected-table-line');
};

var showSignaturePlaceholderMenu = function(e) {
    e.stopPropagation();
    e.preventDefault();
    var scrolledDownY = $('#signature-inner-div').scrollTop();
    var scrolledDownX = $('#signature-inner-div').scrollLeft();
    var parentOffset = $('#signature-inner-div').offset();
    var xValue = e.pageX - parentOffset.left + scrolledDownX;
    var yValue = e.pageY - parentOffset.top + scrolledDownY;
    lzm_userManagement.showContextMenu('signature-inner-div', {}, xValue, yValue);
};

var removeSignaturePlaceholderMenu = function() {
    $('#signature-inner-div-context').remove();
};

var createTextEmails = function() {
    selectTextEmails(-1);
    var aw = ($('#tae-auto-send-wel').prop('checked')) ? 1 : 0;
    var edit = ($('#tae-wel-edit').prop('checked')) ? 1 : 0;
    lzm_userManagement.createTextEmailsInput(null, aw, edit);
};

var resetTextEmails = function() {

    var group = lzm_commonTools.clone(lzm_userManagement.loadedGroup);
    group = (group != null) ? group : lzm_commonTools.clone(lzm_userManagement.newGroup);
    var myPm = lzm_userManagement.newPm;
    if (lzm_userManagement.selectedGroup != '')
    {
        lzm_userManagement.loadedGroup['pm'] = lzm_commonTools.clone(myPm);
        group = lzm_commonTools.clone(lzm_userManagement.loadedGroup);
    }
    else
    {
        lzm_userManagement.newGroup.pm = lzm_commonTools.clone(myPm);
        group = lzm_commonTools.clone(lzm_userManagement.newGroup);
    }
    $('.umg-edit-placeholder-content').each(function()
    {
        if ($(this).data('hash') == 'text-and-emails')
        {
            $(this).html(lzm_userManagement.createTextAndEmailsConfiguration(group));
        }
    });
    lzm_layout.resizeEditUserConfiguration();
};

var editTextEmails = function(textEmailsNo) {
    if (typeof textEmailsNo != 'undefined')
    {
        selectTextEmails(textEmailsNo);
    }
    else
    {
        textEmailsNo = lzm_userManagement.selectedTextEmailsNo;
    }
    var textEmails;
    if (lzm_userManagement.selectedListTab == 'user')
    {
        /*
        var operator = lzm_commonTools.clone(lzm_userManagement.loadedUser);
        operator = (operator != null) ? operator : lzm_commonTools.clone(lzm_userManagement.newUser);
        if (operator != null && typeof operator.pm != 'undefined' && operator.pm.length > textEmailsNo)
        {
            textEmails = operator.pm[textEmailsNo];
        }*/
    }
    else
    {
        var group = lzm_commonTools.clone(lzm_userManagement.loadedGroup);
        group = (group != null) ? group : lzm_commonTools.clone(lzm_userManagement.newGroup);
        if (group != null && typeof group.pm != 'undefined' && group.pm.length > textEmailsNo) {
            textEmails = group.pm[textEmailsNo];
        }
    }
    if (textEmails != null)
    {
        var aw = textEmails.aw;
        var edit = textEmails.edit;
        lzm_userManagement.createTextEmailsInput(textEmails, aw, edit);
    }
};

var removeTextEmails = function() {
    var myPm = [],textEmailsNo = lzm_userManagement.selectedTextEmailsNo;

    var group = lzm_commonTools.clone(lzm_userManagement.loadedGroup);
    group = (group != null) ? group : lzm_commonTools.clone(lzm_userManagement.newGroup);
    if (group != null && typeof group.pm != 'undefined' && group.pm.length > textEmailsNo) {
        myPm = lzm_commonTools.clone(group.pm);
    }

    myPm[textEmailsNo].deleted = true;

    if (lzm_userManagement.selectedGroup != '')
    {
        lzm_userManagement.loadedGroup['pm'] = lzm_commonTools.clone(myPm);
        group = lzm_commonTools.clone(lzm_userManagement.loadedGroup);
    }
    else
    {
        lzm_userManagement.newGroup.pm = lzm_commonTools.clone(myPm);
        group = lzm_commonTools.clone(lzm_userManagement.newGroup);
    }
    $('.umg-edit-placeholder-content').each(function()
    {
        if ($(this).data('hash') == 'text-and-emails')
        {
            $(this).html(lzm_userManagement.createTextAndEmailsConfiguration(group));
        }
    });
    lzm_layout.resizeEditUserConfiguration();
};

var setTextEmailsAsDefault = function() {
    var textEmailsNo = lzm_userManagement.selectedTextEmailsNo;
    var textEmails = null, myPm = [], tmpPm = [];
    if (lzm_userManagement.selectedListTab == 'user') {
        var operator = lzm_commonTools.clone(lzm_userManagement.loadedUser);
        operator = (operator != null) ? operator : lzm_commonTools.clone(lzm_userManagement.newUser);
        if (operator != null && typeof operator.pm != 'undefined' && operator.pm.length > textEmailsNo) {
            myPm = lzm_commonTools.clone(operator.pm);
        }
    } else {
        var group = lzm_commonTools.clone(lzm_userManagement.loadedGroup);
        group = (group != null) ? group : lzm_commonTools.clone(lzm_userManagement.newGroup);
        if (group != null && typeof group.pm != 'undefined' && group.pm.length > textEmailsNo) {
            myPm = lzm_commonTools.clone(group.pm);
        }
    }
    for (var i=0; i<myPm.length; i++) {
        if (i == textEmailsNo) {
            myPm[i].def = '1';
        } else {
            myPm[i].def = '';
        }
    }

    if (lzm_userManagement.selectedListTab == 'user') {
        if (lzm_userManagement.selectedUser != '') {
            lzm_userManagement.loadedUser.pm = lzm_commonTools.clone(myPm);
            operator = lzm_commonTools.clone(lzm_userManagement.loadedUser);
        } else {
            lzm_userManagement.newUser.pm = lzm_commonTools.clone(myPm);
            operator = lzm_commonTools.clone(lzm_userManagement.newUser);
        }
        $('.umg-edit-placeholder-content').each(function() {
            if ($(this).data('hash') == 'text-and-emails') {
                $(this).html(lzm_userManagement.createTextAndEmailsConfiguration(operator));
            }
        });
    } else {
        if (lzm_userManagement.selectedGroup != '') {
            lzm_userManagement.loadedGroup.pm = lzm_commonTools.clone(myPm);
            group = lzm_commonTools.clone(lzm_userManagement.loadedGroup);
        } else {
            lzm_userManagement.newGroup.pm = lzm_commonTools.clone(myPm);
            group = lzm_commonTools.clone(lzm_userManagement.newGroup);
        }
        $('.umg-edit-placeholder-content').each(function() {
            if ($(this).data('hash') == 'text-and-emails') {
                $(this).html(lzm_userManagement.createTextAndEmailsConfiguration(group));
            }
        });
    }
    lzm_layout.resizeEditUserConfiguration();
};

var selectTextEmails = function(textEmailsNo) {

    lzm_userManagement.selectedTextEmailsNo = textEmailsNo;
    $('.text-emails-edit-btns').removeClass('ui-disabled');
    $('.text-emails-list-line').removeClass('selected-table-line');
    $('#text-emails-list-line-' + textEmailsNo).addClass('selected-table-line');
};

var showTextEmailsPlaceholderMenu = function(e, taIdPrefix, taId) {
    e.stopPropagation();
    e.preventDefault();
    var scrolledDownY = $('#text-emails-inner-div').scrollTop();
    var scrolledDownX = $('#text-emails-inner-div').scrollLeft();
    var parentOffset = $('#text-emails-inner-div').offset();
    var xValue = e.pageX - parentOffset.left + scrolledDownX;
    var yValue = e.pageY - parentOffset.top + scrolledDownY;
    lzm_userManagement.showContextMenu('text-emails-inner-div', {taIdPrefix: taIdPrefix, taId: taId}, xValue, yValue);
};

var removeTextEmailsPlaceholderMenu = function() {
    $('#text-emails-inner-div-context').remove();
};

var addPlaceholder = function(target, placeholder) {
    var cursorPos, v;
    if (target == 'signature') {
        cursorPos = $('#signature-text').prop('selectionStart');
        v = $('#signature-text').val();
    } else {
        cursorPos = $('#' + target).prop('selectionStart');
        v = $('#' + target).val();
    }
    var textBefore = v.substring(0,  cursorPos );
    var textAfter  = v.substring( cursorPos, v.length );
    if (target == 'signature') {
        $('#signature-text').val(textBefore + placeholder + textAfter);
        removeSignaturePlaceholderMenu();
    } else {
        $('#' + target).val(textBefore + placeholder + textAfter);
        removeTextEmailsPlaceholderMenu();
    }
};

var selectGroupTitle = function(titleLang) {
    lzm_userManagement.selectedGroupTitleLang = titleLang;
    if (titleLang != '') {
        $('.title-edit-btns').removeClass('ui-disabled');
    } else {
        $('.title-edit-btns').addClass('ui-disabled');
    }
    $('.group-title-line').removeClass('selected-table-line');
    $('#group-title-line-' + titleLang).addClass('selected-table-line');
};

var selectTableLine = function(type,key) {
    if(type == 'main')
    {
        if (lzm_userManagement.selectedListTab == 'user')
        {
            lzm_userManagement.selectedUser = key;
            $('.operator-list-line').removeClass('selected-table-line');
            $("[id='operator-list-line-" + key + "']").addClass('selected-table-line');
        }
        else if(lzm_userManagement.selectedListTab == 'group')
        {
            lzm_userManagement.selectedGroup = key;
            $('.group-list-line').removeClass('selected-table-line');
            $("[id='group-list-line-" + key + "']").addClass('selected-table-line');
        }
        else if(lzm_userManagement.selectedListTab == 'role')
        {
            lzm_userManagement.selectedRole = key;
            $('.role-list-line').removeClass('selected-table-line');
            $("[id='role-list-line-" + key + "']").addClass('selected-table-line');
        }
    }
    else
    {
        if(type == 'title')
            lzm_userManagement.selectedGroupTitleLang = key;
        if (key != '')
            $('.'+type+'-edit-btns').removeClass('ui-disabled');
        else
            $('.'+type+'-edit-btns').addClass('ui-disabled');

        $('.group-'+type+'-line').removeClass('selected-table-line');
        $('#group-'+type+'-line-' + key).addClass('selected-table-line');
    }
};

var createGroupFilter = function() {
    selectTableLine('filter','');
    lzm_userManagement.createGroupFilter();
};

var editGroupFilter = function() {
    lzm_userManagement.createGroupFilter(JSON.parse(lz_global_base64_decode($('.group-filter-line.selected-table-line').data('filter'))));
};

var removeGroupFilter = function() {
    lzm_userManagement.saveGroupFilter(JSON.parse(lz_global_base64_decode($('.group-filter-line.selected-table-line').data('filter'))),true);
};

var createGroupTitle = function() {
    selectGroupTitle('');
    var group = lzm_commonTools.clone(lzm_userManagement.loadedGroup), titles = {};
    if (group != null) {
        titles = lzm_commonTools.clone(group.humanReadableDescription);
    } else {
        titles = lzm_commonTools.clone(lzm_userManagement.newGroup.humanReadableDescription);
    }
    lzm_userManagement.createGroupTitleInput(titles, '');
};

var editGroupTitle = function(titleLang) {
    if (typeof titleLang != 'undefined') {
        selectGroupTitle(titleLang);
    } else  {
        titleLang = lzm_userManagement.selectedGroupTitleLang;
    }
    var group = lzm_commonTools.clone(lzm_userManagement.loadedGroup);
    group = (group != null) ? group : lzm_commonTools.clone(lzm_userManagement.newGroup);
    lzm_userManagement.createGroupTitleInput(lzm_commonTools.clone(group.humanReadableDescription), titleLang);
};

var removeGroupTitle = function() {
    var group = lzm_commonTools.clone(lzm_userManagement.loadedGroup), titleList = {};
    if (group != null) {
        titleList = lzm_commonTools.clone(group.humanReadableDescription);
        delete titleList[lzm_userManagement.selectedGroupTitleLang];
        lzm_userManagement.loadedGroup.humanReadableDescription = lzm_commonTools.clone(titleList);
        $('#group-title-table').html(lzm_userManagement.createGroupTitleList(titleList));
    } else {
        titleList = lzm_commonTools.clone(lzm_userManagement.newGroup.humanReadableDescription);
        delete titleList[lzm_userManagement.selectedGroupTitleLang];
        lzm_userManagement.newGroup.humanReadableDescription = lzm_commonTools.clone(titleList);
        $('#group-title-table').html(lzm_userManagement.createGroupTitleList(titleList));
    }
};

var selectSocialMedia = function(mediaNo) {
    $('.social-media-list-line').removeClass('selected-table-line');
    if(mediaNo > -1)
    {
        lzm_userManagement.selectedSocialMediaNo = mediaNo;
        $('#social-media-list-line-'+mediaNo).addClass('selected-table-line');
        $('#edit-social-media-btn').removeClass('ui-disabled');
        $('#rm-social-media-btn').removeClass('ui-disabled');
    }
    else
    {
        lzm_userManagement.selectedSocialMediaNo = 0;
        $('#edit-social-media-btn').addClass('ui-disabled');
        $('#rm-social-media-btn').addClass('ui-disabled');
    }
};

var createSocialMediaToken = function(){
    parent.lzm_commonDialog.createAlertDialog(tid('dpr_feature'), [{id: 'ok', name: tid('dpr_signed')},{id: 'cancel', name: tid('cancel')}]);
    $('#alert-btn-ok',parent.document).click(function(){
        parent.lzm_commonDialog.removeAlertDialog();
        var smtype  = $('#smc-type').val().toLowerCase();
        var smacc  = $('#smc-account-id').val();
        var url = "https://ssl.livezilla.info/social/"+smtype+"/token.php?a=init_auth&sr=1&p=" + smacc;
        window.parent.openLink(url);
    });

    $('#alert-btn-cancel',parent.document).click(function(){
        parent.lzm_commonDialog.removeAlertDialog();
    });
};

var createSocialMedia = function() {
    selectSocialMedia(-1);
    lzm_userManagement.createSocialMediaChannel(null);
};

var editSocialMedia = function(mediaNo) {
    mediaNo = (d(mediaNo)) ? mediaNo : lzm_userManagement.selectedSocialMediaNo;
    selectSocialMedia(mediaNo);
    var smc = null;
    var group = lzm_commonTools.clone(lzm_userManagement.loadedGroup);

    group = (group != null) ? group : lzm_commonTools.clone(lzm_userManagement.newGroup);
    for (var i=0; i<group.f.length; i++)
        if (group.f[i].key == 'c_smc')
            smc = lzm_commonTools.clone(group.f[i].values[mediaNo]);
    if (smc != null)
        lzm_userManagement.createSocialMediaChannel(smc);
};

var removeSocialMedia = function() {
    var mediaNo = lzm_userManagement.selectedSocialMediaNo;
    selectSocialMedia(-1);
    var group = lzm_commonTools.clone(lzm_userManagement.loadedGroup);
    var myF = (group != null) ? lzm_commonTools.clone(group.f) : lzm_commonTools.clone(lzm_userManagement.newGroup.f);
    for (var i=0; i<myF.length; i++) {
        if (myF[i].key == 'c_smc') {
            var newF = lzm_commonTools.clone(myF[i].values);
            newF.splice(mediaNo, 1);
            myF[i].values = newF;
        }
    }
    if (group != null) {
        lzm_userManagement.loadedGroup.f = lzm_commonTools.clone(myF);
        group = lzm_commonTools.clone(lzm_userManagement.loadedGroup);
    } else {
        lzm_userManagement.newGroup.f = lzm_commonTools.clone(myF);
        group = lzm_commonTools.clone(lzm_userManagement.newGroup);
    }
    var socialMediaList = [];
    for (i=0; i<group.f.length; i++) {
        if (group.f[i].key == 'c_smc') {
            socialMediaList = lzm_commonTools.clone(group.f[i].values);
        }
    }
    $('#gr-tickets-placeholder-content-1').html(lzm_userManagement.createGroupTicketsSocialMediaTab(socialMediaList));
    lzm_layout.resizeEditUserConfiguration();
};

var selectOpeningHour = function(ohNo) {
    lzm_userManagement.selectedOpeningHoursNo = ohNo;
    if (ohNo != -1) {
        $('.oh-edit-btns').removeClass('ui-disabled');
    } else {
        $('.oh-edit-btns').addClass('ui-disabled');
    }
    $('.gr-oh-list-line').removeClass('selected-table-line');
    $('#gr-oh-list-line-' + ohNo).addClass('selected-table-line');
};

var createOpeningHour = function() {
    selectOpeningHour(-1);
    try {
    lzm_userManagement.createOpeningHours(null);
    } catch(e) {logit(e.stack);}
};

var clearOpeningHours = function() {
    selectOpeningHour(-1);
    var group = lzm_commonTools.clone(lzm_userManagement.loadedGroup);
    if (group != null) {
        lzm_userManagement.loadedGroup.ohs = [];
        group = lzm_commonTools.clone(lzm_userManagement.loadedGroup);
    } else {
        lzm_userManagement.newGroup.ohs = [];
        group = lzm_commonTools.clone(lzm_userManagement.newGroup);
    }
    $('.umg-edit-placeholder-content').each(function() {
        if ($(this).data('hash') == 'opening-hours') {
            $(this).html(lzm_userManagement.createGroupHoursConfiguration(group));
        }
    });
    lzm_layout.resizeEditUserConfiguration();
};

var removeOpeningHour = function() {
    var group = lzm_commonTools.clone(lzm_userManagement.loadedGroup), ohs = [];
    if (group != null) {
        ohs = lzm_commonTools.clone(group.ohs);
        ohs.splice(lzm_userManagement.selectedOpeningHoursNo, 1);
        ohs.sort(lzm_userManagement.sortOhs);
        lzm_userManagement.loadedGroup.ohs = lzm_commonTools.clone(ohs);
        group = lzm_commonTools.clone(lzm_userManagement.loadedGroup);
    } else {
        ohs = lzm_commonTools.clone(lzm_userManagement.newGroup.ohs);
        ohs.splice(lzm_userManagement.selectedOpeningHoursNo, 1);
        ohs.sort(lzm_userManagement.sortOhs);
        lzm_userManagement.newGroup.ohs = lzm_commonTools.clone(ohs);
        group = lzm_commonTools.clone(lzm_userManagement.newGroup);
    }
    selectOpeningHour(-1);
    $('.umg-edit-placeholder-content').each(function() {
        if ($(this).data('hash') == 'opening-hours') {
            $(this).html(lzm_userManagement.createGroupHoursConfiguration(group));
        }
    });
    lzm_layout.resizeEditUserConfiguration();
};

var handleContextMenuClick = function(e) {
    e.stopPropagation();
};

var selectLDAPElement = function(id){

    var uid = $('#' + id + ' td:nth-child(1)',parent.document).text();
    var cn = $('#' + id + ' td:nth-child(2)',parent.document).text();
    var sn = $('#' + id + ' td:nth-child(3)',parent.document).text();
    var em = $('#' + id + ' td:nth-child(4)',parent.document).text();
    var desc = $('#' + id + ' td:nth-child(5)',parent.document).text();

    parent.lzm_commonDialog.removeAlertDialog();
    lzm_userManagement.createOperatorConfiguration(null);

    $('#operator-uid').val(uid);
    if(uid.length)
        $('#operator-uid').addClass('ui-disabled');
    $('#operator-fn').val(cn);
    $('#operator-ln').val(sn);
    $('#operator-em').val(em);
    $('#operator-desc').val(desc);
    $('#operator-auth').prop('selectedIndex',1);
    $('#operator-auth').addClass('ui-disabled');
    $('#operator-auth').change();
};

var removeAvatar = function(opID){
    $('#operator-pic-b64').val('DEFAULT');
    $('#operator-pic-img').attr('src', './../picture.php?np=1&operator='+encodeURIComponent(opID)+'&acid='+lzm_commonTools.guid());
    $('#operator-color').change();
};

var changeGroupTitle = function(_i){

    var text = $('#text-emails-list-line-title-'+_i).html();
    var content =  lzm_inputControls.createInput('text-emails-list-line-title-input-' + _i,'',text,tidc('title'),'','text','');
    parent.lzm_commonDialog.createAlertDialog(content, [{id: 'ok', name: t('Ok')}]);

    $('#text-emails-list-line-title-input-' + _i,parent.document).focus();
    $('#text-emails-list-line-title-input-' + _i,parent.document).select();

    $('#alert-btn-ok',parent.document).click(function() {
        var val = $('#text-emails-list-line-title-input-' + _i,parent.document).val();
        $('#text-emails-list-line-title-' + _i).html(val);
        parent.lzm_commonDialog.removeAlertDialog();
    });
};