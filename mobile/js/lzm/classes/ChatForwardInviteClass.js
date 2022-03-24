/****************************************************************************************
 * LiveZilla ChatForwardInviteClass.js
 *
 * Copyright 2018 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/

function ChatForwardInvite(){
    this.chatObject = null;
    this.type = '';
    this.groupCount = 0;
    this.selectedGroupId = ''
}

ChatForwardInvite.LastClick = 0;
ChatForwardInvite.SelectedLineId = '';

ChatForwardInvite.prototype.ShowForwardInvite = function(chatId, type) {
    type = (d(type)) ? type : 'forward';

    ChatForwardInvite.SelectedLineId = '';
    var chatObj = DataEngine.ChatManager.GetChat(chatId,'i');
    if (chatObj != null)
    {
        if (PermissionEngine.checkUserPermissions('', 'chats', 'forward', {}))
        {
            this.CreateOperatorForwardInviteHtml(type, chatObj);
        }
        else
            showNoPermissionMessage();
    }
};

ChatForwardInvite.prototype.CreateOperatorForwardInviteHtml = function (type, _chatObj) {

    this.type = type;
    this.chatObject = _chatObj;

    var that = this;

    var headerString = tid('forward_chat');

    if (this.type != 'forward')
        headerString = t('Invite operator to chat');

    if(!(_chatObj != null && d(_chatObj.GetWindowId)))
        return;

    lzm_commonDialog.createAlertDialog(this.GetForwardInviteBodyHTML(headerString),[{id:'ok',name:tid('ok')},{id:'cancel',name:tid('cancel')}],true);

    var groups = DataEngine.groups.getGroupList(),selected,i;

    //var sbByGroup = '<div id="selection-div" class="top-space-double"><select id="forward-group-select" size="3" data-selected-group="">';

    //sbByGroup += '<option value="">' + tid('all') + '</option>';

   // if(this.selectedGroupId == '')
        this.selectedGroupId = this.chatObject.dcg;

    //console.log(this.selectedGroupId);

    this.groupCount = 0;
    var availableGroups = [], opcountGroups = [];
    for (i=0; i<groups.length; i++)
        if (d(groups[i].id))
        {
            var opcount = this.GetMatchingGroupOperators(groups[i].id,this.type).length;
            if(true || opcount>0)
            {
                this.groupCount++;
                selected = (groups[i].id==this.selectedGroupId || !d(this.selectedGroupId)) ? ' selected' : '';
                //sbByGroup += '<option value="' +groups[i].id + '"'+selected+'>' + groups[i].name + ' (' + opcount + ')</option>';
                availableGroups.push(groups[i].id);
                opcountGroups.push([groups[i].id,opcount]);
            }
        }


    var sbGroups = '<div style="height:140px">';
    window['chat-fi-groups'] = new CommonInputControlsClass.TagEditor('chat-fi-groups',availableGroups,false,true,false,true,false,true);
    window['chat-fi-groups'].AddTags(this.selectedGroupId,true);
    window['chat-fi-groups'].SetCounts(opcountGroups);
    window['chat-fi-groups'].OnChange = function(){
        ChatForwardInvite.UpdateOperatorList(false, that);
    };
    sbGroups += window['chat-fi-groups'].GetHTML(false, 2);
    sbGroups += '</div>';


    var sbSkills = '<div style="height:140px">';
    window['chat-fi-skills'] = new CommonInputControlsClass.TagEditor('chat-fi-skills',OperatorManager.GetAllSkills(),false,true,false,true);
    window['chat-fi-skills'].SetCounts(this.GetMatchingSkillOperatorCounts());
    window['chat-fi-skills'].OnChange = function(){
        ChatForwardInvite.UpdateOperatorList(false, that);
    };
    sbSkills += window['chat-fi-skills'].GetHTML(false, 2);
    sbSkills += '</div>';

    var sbLanguage = '<div style="height:140px">';
    window['chat-fi-languages'] = new CommonInputControlsClass.TagEditor('chat-fi-languages',OperatorManager.GetAllLanguages(),false,true,false,true);
    window['chat-fi-languages'].SetCounts(this.GetMatchingLanguageOperatorCounts());
    window['chat-fi-languages'].OnChange = function(){
        ChatForwardInvite.UpdateOperatorList(false, that);
    };
    sbLanguage += window['chat-fi-languages'].GetHTML(false, 2);
    sbLanguage += '</div>';

    var sbLocation = '<div style="height:140px">';
    window['chat-fi-location'] = new CommonInputControlsClass.TagEditor('chat-fi-location',OperatorManager.GetAllLocations(),false,true,false,true);
    window['chat-fi-location'].SetCounts(this.GetMatchingLocationOperatorCounts());
    window['chat-fi-location'].OnChange = function(){
        ChatForwardInvite.UpdateOperatorList(false, that);
    };
    sbLocation += window['chat-fi-location'].GetHTML(false, 2);
    sbLocation += '</div>';

    var tabs = [
        {name: tid('groups'), content: sbGroups},
        {name: tid('skills'), content: sbSkills},
        {name: tid('language'), content: sbLanguage},
        {name: tid('location'), content: sbLocation}
    ];

    lzm_inputControls.createTabControl('selection-base-placeholder',tabs,0);

    $('.selection-base-placeholder-tab').click(function(){
        ChatForwardInvite.UpdateOperatorList(false, that);
    });

    $('#alert-btn-cancel').click(function() {

        lzm_commonDialog.removeAlertDialog();
    });
    $('#alert-btn-ok').click(function() {

        var row = $('#forward-receiver-table tr.selected-table-line')[0];
        var selectedOpUserId = $(row).data('id');
        var selectedGroupId = that.selectedGroupId;

        if(selectedGroupId == '' || !d(that.selectedGroupId))
        {
            selectedGroupId = that.chatObject.dcg;
        }

        if(d(selectedOpUserId) && selectedGroupId != '')
        {
            var selectedOperator = DataEngine.operators.getOperator(selectedOpUserId, 'id');
            selectOperatorForForwarding(that.chatObject, selectedOperator.id, selectedOperator.name, selectedGroupId, $('#forward-text').val(), 0);
            UserActions.forwardData.forward_text = $('#forward-text').val();
            UserActions.forwardChat(that.chatObject, that.type);
            $('#alert-btn-cancel').click();
        }

    });

    this.applyEvents(true);

    ChatForwardInvite.UpdateOperatorList(false, that);
};

ChatForwardInvite.prototype.applyEvents = function (_init){
    $('#fwd-button').removeClass('ui-disabled');
    if(this.groupCount > 0)
    {

    }
    else
    {
        $('#fwd-button').addClass('ui-disabled');
        //$('#forward-group-select').append($('<option>', {value: 1,text: tid('none')}));
        $('#forward-receiver').html('<div class="text-xxxl text-gray" style="margin-top:18%;">'+tid('none')+'</div>');
        $('#forward-receiver, #forward-text').addClass('ui-disabled');
    }
};

ChatForwardInvite.UpdateOperatorList = function(_init,_cfi){

    $('#forward-receiver-table').html('');

    var ol = null;

    if($('#selection-base-placeholder-tab-1').hasClass('lzm-tabs-selected'))
        ol = _cfi.GetMatchingSkillOperators(window['chat-fi-skills'].GetListString(true),_cfi.type);
    else if($('#selection-base-placeholder-tab-2').hasClass('lzm-tabs-selected'))
        ol = _cfi.GetMatchingLanguageOperators(window['chat-fi-languages'].GetListString(true),_cfi.type);
    else if($('#selection-base-placeholder-tab-3').hasClass('lzm-tabs-selected'))
        ol = _cfi.GetMatchingLocationOperators(window['chat-fi-location'].GetListString(true),_cfi.type);
    else
        ol = _cfi.GetMatchingGroupOperators(_cfi.selectedGroupId=window['chat-fi-groups'].GetListString(true),_cfi.type);

    $('#forward-receiver-table').html(lzm_chatDisplay.CreateOperatorsHTML({id:''},ol,false,true,ChatForwardInvite.SelectedLineId,'','forward','ChatForwardInvite.SelectLine','nf','nf'));

    $('#forward-receiver-table tr.operator-forwardlist-line').removeClass('selected-table-line');

    if(_init || ChatForwardInvite.SelectedLineId == '')
        $($('#forward-receiver-table tr.operator-forwardlist-line')[0]).addClass('selected-table-line');
};

ChatForwardInvite.prototype.updateForwardOperators = function(){

    var ft = '';
    if($('#forward-text').length)
        ft = $('#forward-text').val();

    $('#operator-forward-selection-body').html(this.GetForwardInviteBodyHTML());
    this.applyEvents(false);

    $('#forward-text').val(ft);

};

ChatForwardInvite.prototype.GetMatchingGroupOperators = function(_groupId,_type){
    var i,operators = this.GetMatchingOperators(_type),soperators = [];
    for (i=0; i<operators.length; i++)
        if(!_groupId.length || $.inArray(_groupId, operators[i].groups) != -1)
            if($.inArray(_groupId, operators[i].groupsAway) == -1)
                soperators.push(operators[i]);
    return soperators;
};

ChatForwardInvite.prototype.GetMatchingLanguageOperatorCounts = function(){
    var counts = [], languages = OperatorManager.GetAllLanguages();
    for(var key in languages)
    {
        var count = this.GetMatchingLanguageOperators(languages[key],this).length;
        if(languages[key].length)
            counts.push([languages[key],count]);
    }
    return counts;
};

ChatForwardInvite.prototype.GetMatchingLanguageOperators = function(_langs,_type){
    var i,operators = this.GetMatchingOperators(_type),soperators = [];
    var alangs,reqlangs = _langs.split(',');

    for (i=0; i<operators.length; i++)
    {
        alangs = operators[i].lang.split(',');

        var allincluded = true;
        if(_langs.length)
            for(var key in reqlangs)
            {
                var reqlang = ChatTranslationEditorClass.NameToIso(reqlangs[key],true);

                if ($.inArray(reqlang, alangs) == -1)
                    allincluded = false;
            }

        if(allincluded)
            soperators.push(operators[i]);
    }
    return soperators;
};

ChatForwardInvite.prototype.GetMatchingLocationOperatorCounts = function(){
    var counts = [], locations = OperatorManager.GetAllLocations();
    for(var key in locations)
    {
        var count = this.GetMatchingLocationOperators(locations[key],this).length;
        if(locations[key].length)
            counts.push([locations[key],count]);
    }
    return counts;
};

ChatForwardInvite.prototype.GetMatchingLocationOperators = function(_locations,_type){
    var i,operators = this.GetMatchingOperators(_type),soperators = [];
    var alocas,reqlocas = _locations.split(',');

    for (i=0; i<operators.length; i++)
    {
        alocas = operators[i].loca.split(',');

        var allincluded = true;

        if(_locations.length)
            for(var key in reqlocas)
            {
                if(reqlocas[key].length)
                    if ($.inArray(reqlocas[key], alocas) == -1)
                        allincluded = false;
            }

        if(allincluded)
            soperators.push(operators[i]);
    }
    return soperators;
};

ChatForwardInvite.prototype.GetMatchingSkillOperatorCounts = function(){
    var counts = [], skills = OperatorManager.GetAllSkills();
    for(var key in skills)
    {
        var count = this.GetMatchingSkillOperators(skills[key],this).length;
        if(skills[key].length)
            counts.push([skills[key],count]);
    }
    return counts;
};

ChatForwardInvite.prototype.GetMatchingSkillOperators = function(_skills,_type){
    var i,operators = this.GetMatchingOperators(_type),soperators = [];
    var askills,reqskills = _skills.split(',');

    for (i=0; i<operators.length; i++)
    {
        askills = operators[i].skils.split(',');

        var allincluded = true;

        if(_skills.length)
        for(var key in reqskills)
        {
            if ($.inArray(reqskills[key], askills) == -1)
                allincluded = false;
        }

        if(allincluded)
            soperators.push(operators[i]);
    }
    return soperators;
};

ChatForwardInvite.prototype.GetMatchingOperators = function(_type){
    var i;
    var operators = DataEngine.operators.getOperatorList();
    var availableOperators = DataEngine.operators.getAvailableOperators(this.chatObject.SystemId);
    var soperators = [];
    for (i=0; i<operators.length; i++)
    {
        if (operators[i].userid != lzm_chatDisplay.myLoginId &&
            (typeof operators[i].isbot == 'undefined' || operators[i].isbot != 1) &&
            (operators[i].status != 2 && operators[i].status != 3) &&
            !lzm_commonTools.GetElementByProperty(this.chatObject.Members,'i',operators[i].id).length &&
            ((_type == 'forward' && $.inArray(operators[i].id, availableOperators.fIdList) != -1) || (_type != 'forward' && $.inArray(operators[i].id, availableOperators.iIdList) != -1)))
            soperators.push(operators[i]);
    }
    soperators.sort(function(a, b){
        a = DataEngine.ChatManager.GetChatsOf(a.id,[Chat.Active,Chat.Open]).length;
        b = DataEngine.ChatManager.GetChatsOf(b.id,[Chat.Active,Chat.Open]).length;
        return a-b;
    });
    return soperators;
};

ChatForwardInvite.prototype.GetForwardInviteBodyHTML = function (_headerString){

    var bodyString = '<fieldset class="lzm-fieldset-full" style="min-width:400px;height:187px;">';
    bodyString += '<div id="selection-base-placeholder" style="height: 100px;"></div></fieldset>';

    var fwdTextHeight = Math.max((lzm_chatDisplay.windowHeight - 550), 80);
    bodyString += '<fieldset class="lzm-fieldset-full"><legend>'+tidc('operator')+'</legend><div><div id="forward-receiver" class="border-s" style="overflow:auto;height:'+fwdTextHeight+'px;"><table id="forward-receiver-table" class="operator-list-table"></table></div></div></fieldset>';
    bodyString += '<fieldset class="lzm-fieldset-full"><legend>'+tidc('fwd_additional_info')+'</legend><div>' + lzm_inputControls.createInput('forward-text','','','','','text','') + '</div></fieldset>';
    bodyString += '';

    return bodyString;
};

ChatForwardInvite.SelectLine = function(_lineId) {

    var now = lzm_chatTimeStamp.getServerTimeString(null, false, 1);
    var opid = $('#' + _lineId).attr('data-id');

    if(ChatForwardInvite.SelectedLineId == opid && now - ChatForwardInvite.LastClick < 500)
    {
        OpenChatWindow(opid);
        $('#alert-btn-cancel').click();
    }
    else
    {
        if(PermissionEngine.permissions.chats_forward_select_op != 1)
        {
            showNoPermissionMessage();
            return;
        }

        $('#forward-receiver-table tr.selected-table-line').removeClass('selected-table-line');
        $('#' + _lineId).addClass('selected-table-line');
    }

    ChatForwardInvite.SelectedLineId = opid;
    ChatForwardInvite.LastClick = now;
};