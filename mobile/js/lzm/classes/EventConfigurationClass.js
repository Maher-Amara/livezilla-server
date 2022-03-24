/****************************************************************************************
 * LiveZilla EventConfigurationClass.js
 *
 * Copyright 2017 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/

function EventConfiguration() {
    this.m_SelectedEvent = null;
    this.m_SelectedEventId = '';
    this.m_Definitions = [
        {name:'Conditions',conditions:[
            {name:'PagesVisited', target:'visitor', editable: true, pkey:'vh', xkey:'pv', title:tidc('ev_pages_visited'),titleright:tid('pages'),value:2,type:'int'},
            {name:'TimeOnWebsite',target:'visitor', editable: true, pkey:'vg',xkey:'tos',title:tidc('ev_time_on_site'),titleright:tid('seconds'),value:15,type:'int'},
            {name:'NoTouchDevice',target:'visitor', pkey:'vu',xkey:'em',title:tidc('ev_no_td')},
            {name:'WasNotInChat',target:'visitor', pkey:'vo',xkey:'nic',title:tidc('ev_not_in_chat')},

            {name:'NoInviteDeclined',target:'visitor', pkey:'vl',xkey:'ndec',title:tidc('ev_no_inv_dec')},
            {name:'NoInviteAccepted',target:'visitor', pkey:'vk',xkey:'nacc',title:tidc('ev_no_inv_acc')},
            {name:'SearchPhrase',target:'visitor', editable: true, pkey:'vs',xkey:'sp',title:tidc('ev_search'),value:'',type:'string',titlebottom:tid('wildcard')},
            {name:'CountryBlacklist',target:'visitor', editable: true, pkey:'vv',xkey:'ec',title:tidc('ev_not_from'),value:'',type:'string',titlebottom:tid('iso_twoletter_comma')},
            {name:'CountryWhitelist',target:'visitor', editable: true, pkey:'vz',xkey:'ic',title:tidc('ev_from'),value:'',type:'string',titlebottom:tid('iso_twoletter_comma')},
            {name:'DataCondition',target:'visitor', editable: true, multiple:true, custom:true,title:tidc('ev_data_cond')},
            {name:'URLCondition',target:'visitor', editable: true, multiple:true, custom:true,title:tidc('ev_url_cond')},
            {name:'ChatSessionStarts',target:'visitor', pkey:'vw',xkey:'iic',title:tidc('ev_starts_a_chat')},
            {name:'ChatSessionEnds',target:'visitor', pkey:'vaa',xkey:'cse',title:tidc('ev_chat_ends')}

        ]},
        {name:'Actions',actions:[
            {name:'InternalMessageBox',key:0,target:'operator', editable: true, operatorList:true, title:tidc('ev_action_0'), type:'string', value:''},
            {name:'InternalPlaySound',key:1,target:'operator', editable: true, operatorList:true, title:tidc('ev_action_1'), type:'string', value:'',titlebottom: tidc('example') + ' https://www.mysite.domain/sounds/event.mp3'},
            {name:'ExternalInvitation',key:2,target:'visitor', editable: true, custom:true,title:tidc('ev_action_2')},
            {name:'ExternalTicketInvitation',key:22,target:'visitor', editable: true, custom:true,title:tidc('ev_action_22')},
            {name:'ExternalTag',key:6,target:'visitor', editable: true, title:tidc('ev_action_6'), type:'area', value:''},
            {name:'ExternalCallURL',key:7,target:'visitor', editable: true, custom:true, title:tidc('ev_action_7')}
        ]}
    ];
}

EventConfiguration.prototype.showEventConfiguration = function() {
    var that = this;
    var headerString = tid('events');
    var footerString =
        lzm_inputControls.createButton('ec-add-btn', '', '', tid('add'), '', 'force-text',{'margin-left': '4px'},'',30,'d') +
        lzm_inputControls.createButton('ec-close-btn', '', '', tid('close'), '', 'lr',{'margin-left': '4px'},'',30,'d');

    var bodyString = this.createEventListHtml();
    lzm_commonDialog.CreateDialogWindow(headerString, bodyString, footerString, 'flash', 'event-configuration', 'event-configuration', 'ec-close-btn', true);
    $('#ec-close-btn').click(function() {
        TaskBarManager.RemoveActiveWindow();
    });
    $('#ec-add-btn').click(function() {
        that.showEventCreationForm('add','');
    });
};

EventConfiguration.prototype.updateEventList = function() {
    if ($('#event-configuration-body').length > 0)
        $('#event-configuration-body').html(this.createEventListHtml());
    this.switchLoading(false);
};

EventConfiguration.prototype.loadVisitorConditions = function(ev){

    if(!d(ev.VisitorConditions))
    {
        ev.VisitorConditions = [];
        for (var y in ev)
        {
            var matchelements = lzm_commonTools.GetElementByProperty(this.m_Definitions[0].conditions,'xkey',y);
            if(matchelements.length)
            {
                var def = lzm_commonTools.clone(matchelements[0]);
                def.id=lzm_commonTools.guid();
                def.value = ev[y];
                if(!d(def.type) && def.value=='0')
                    continue;
                if(d(def.type) && def.type == 'int' && def.value=='0')
                    continue;
                if(def.type == 'string' && def.value=='')
                    continue;

                ev.VisitorConditions.push(def);
            }
        }
    }
};

EventConfiguration.prototype.saveEvent = function() {
    this.switchLoading(true);
    CommunicationEngine.pollServerSpecial(this.getPostDataObject(false), 'event');
    this.m_SelectedEvent = null;
};

EventConfiguration.prototype.deleteEvent = function(id) {
    var that = this;
    removeEventsListContextMenu();
    lzm_commonDialog.createAlertDialog(tid('remove_items'), [{id: 'ok', name: t('Ok')}, {id: 'cancel', name: t('Cancel')}]);
    $('#alert-btn-ok').click(function()
    {
        that.switchLoading(true);
        CommunicationEngine.pollServerSpecial(that.getPostDataObject(true), 'event');
        that.m_SelectedEvent = null;
        lzm_commonDialog.removeAlertDialog();
    });
    $('#alert-btn-cancel').click(function() {
        lzm_commonDialog.removeAlertDialog();
    });
};

EventConfiguration.prototype.getPostDataObject = function(remove) {

    var action,p='p_process_events_';
    var pObj = {},key,skey,se,so,counter=0;

    var name = $('#s-event-name').val();
    if(!d(name))
        name = '';

    if(name.length > 32)
        name = lzm_commonTools.SubStr(name,32,false);

    var prio = $('#event-priority').val();
    if(!d(prio))
        prio = 1;

    pObj[p+'va_0'] = this.m_SelectedEvent.id;
    pObj[p+'vb_0'] = name;
    pObj[p+'vc_0'] = this.m_SelectedEvent.created;
    pObj[p+'vd_0'] = this.m_SelectedEvent.edited;
    pObj[p+'ve_0'] = lzm_chatDisplay.myId;
    pObj[p+'vf_0'] = this.m_SelectedEvent.creator;
    pObj[p+'vg_0'] = 0; //VC:tos
    pObj[p+'vh_0'] = 0; //VC:pv
    pObj[p+'vk_0'] = 0; //VC:nacc
    pObj[p+'vl_0'] = 0; //VC:ndec
    pObj[p+'vm_0'] = ($('#cb-event-tr-multi-delay').prop('checked') && $('#r-event-tr-multi').prop('checked')) ? $('#int-event-tr-multi-delay').val() : 0;
    pObj[p+'vn_0'] = $('#r-event-tr-multi').prop('checked') ? $('#int-event-tr-multi').val() : 0;
    pObj[p+'vo_0'] = 0; //VC:nic
    pObj[p+'vp_0'] = prio;
    pObj[p+'vq_0'] = $('#cb-event-active').prop('checked') ? 1 : 0;
    pObj[p+'vr_0'] = 0; //unused;
    pObj[p+'vs_0'] = ''; //VC:search;
    pObj[p+'vt_0'] = $('#r-event-tr-visitor').prop('checked') ? 1 : 0;
    pObj[p+'vu_0'] = 0; //VC:em;
    pObj[p+'vv_0'] = ''; //VC:ec;
    pObj[p+'vw_0'] = 0; //VC:iic;
    pObj[p+'vy_0'] = $('#cb-event-tr-multi-reload').prop('checked') ? 1 : 0;
    pObj[p+'vz_0'] = '';
    pObj[p+'vaa_0'] = 0;

    for(key in this.m_SelectedEvent.VisitorConditions)
    {
        se = this.m_SelectedEvent.VisitorConditions[key];
        if(se.pkey=='vg')
            pObj[p+'vg_0'] = se.value;
        else if(se.pkey=='vs')
            pObj[p+'vs_0'] = se.value;
        else if(se.pkey=='vv')
            pObj[p+'vv_0'] = se.value;
        else if(se.pkey=='vz')
            pObj[p+'vz_0'] = se.value;
        else if(se.pkey=='vh')
            pObj[p+'vh_0'] = se.value;
        else if(se.pkey=='vaa')
            pObj[p+'vaa_0'] = se.value;
        else
            pObj[p+se.pkey+'_0'] = 1;
    }

    if(remove)
        pObj[p+'vx_0'] = 1;
    else
    {
        for(key in this.m_SelectedEvent.URLConditions)
        {
            se = this.m_SelectedEvent.URLConditions[key];
            pObj[p+'vi_0_a_' + counter] = se.url;
            pObj[p+'vi_0_b_' + counter] = se.ref;
            pObj[p+'vi_0_c_' + counter] = se.tos;
            pObj[p+'vi_0_d_' + counter] = se.bl;
            pObj[p+'vi_0_f_' + counter] = se.id;
            counter++;
        }

        counter = 0;
        for(key in DataEngine.global_configuration.database['goals'])
        {
            se = DataEngine.global_configuration.database['goals'][key];
            if($('#cb-event-goal-'+se.id).prop('checked')){
                pObj[p+'vs_0_a_' + counter] = se.id;
                counter++;
            }
        }

        counter = 0;
        for(key in this.m_SelectedEvent.DataConditions)
        {
            se = this.m_SelectedEvent.DataConditions[key];
            pObj[p+'vw_0_a_' + counter] = se.ind;
            pObj[p+'vw_0_b_' + counter] = se.Value;
            counter++;
        }

        counter = 0;
        for(key in this.m_SelectedEvent.Actions)
        {
            se = this.m_SelectedEvent.Actions[key];
            pObj[p+'vj_0_a_' + counter] = se.id;
            pObj[p+'vj_0_b_' + counter] = se.type;
            pObj[p+'vj_0_c_' + counter] = se.val;

            action = lzm_commonTools.GetElementByProperty(this.m_Definitions[1].actions,'key',parseInt(se.type))[0];

            if(action.name == 'ExternalInvitation' || action.name == 'ExternalTicketInvitation')
            {
                pObj[p+'vj_0_inv_a_' + counter] = '0';
                for(skey in se.Invites[0].Senders)
                {
                    so = se.Invites[0].Senders[skey];
                    pObj[p+'vj_0_inv_i_a_' + counter+'_'+skey] = so.userid;
                    pObj[p+'vj_0_inv_i_b_' + counter+'_'+skey] = so.groupid;
                    pObj[p+'vj_0_inv_i_c_' + counter+'_'+skey] = so.priority;
                }
                pObj[p+'vj_0_inv_j_' + counter] = se.Invites[0].sh;
                pObj[p+'vj_0_inv_k_' + counter] = se.Invites[0].shpx;
                pObj[p+'vj_0_inv_l_' + counter] = se.Invites[0].shpy;
                pObj[p+'vj_0_inv_m_' + counter] = se.Invites[0].shb;
                pObj[p+'vj_0_inv_n_' + counter] = se.Invites[0].shc;
                pObj[p+'vj_0_inv_o_' + counter] = se.Invites[0].bg;
                pObj[p+'vj_0_inv_p_' + counter] = se.Invites[0].bgc;
                pObj[p+'vj_0_inv_q_' + counter] = se.Invites[0].bgo;
                pObj[p+'vj_0_inv_r_' + counter] = se.Invites[0].SenderGroupId;
            }
            else if(action.name == 'ExternalOverlayBox')
            {
                pObj[p+'vj_0_ovb_a_' + counter] = '11';
                pObj[p+'vj_0_ovb_b_' + counter] = 0;
                pObj[p+'vj_0_ovb_c_' + counter] = 0;
                pObj[p+'vj_0_ovb_d_' + counter] = 0;
                pObj[p+'vj_0_ovb_e_' + counter] = 0;
                pObj[p+'vj_0_ovb_f_' + counter] = 8;
                pObj[p+'vj_0_ovb_g_' + counter] = se.Overlays[0].style;
                pObj[p+'vj_0_ovb_h_' + counter] = 0;
                pObj[p+'vj_0_ovb_i_' + counter] = 1;
                pObj[p+'vj_0_ovb_j_' + counter] = se.Overlays[0].sh;
                pObj[p+'vj_0_ovb_k_' + counter] = se.Overlays[0].shpx;
                pObj[p+'vj_0_ovb_l_' + counter] = se.Overlays[0].shpy;
                pObj[p+'vj_0_ovb_m_' + counter] = se.Overlays[0].shb;
                pObj[p+'vj_0_ovb_n_' + counter] = se.Overlays[0].shc;
                pObj[p+'vj_0_ovb_o_' + counter] = se.Overlays[0].w;
                pObj[p+'vj_0_ovb_p_' + counter] = se.Overlays[0].h;
                pObj[p+'vj_0_ovb_q_' + counter] = se.Overlays[0].bg;
                pObj[p+'vj_0_ovb_r_' + counter] = se.Overlays[0].bgc;
                pObj[p+'vj_0_ovb_s_' + counter] = se.Overlays[0].bgo;
            }
            else if(action.name == 'InternalPlaySound' || action.name == 'InternalMessageBox')
            {
                for(skey in se.Receivers)
                {
                    so = se.Receivers[skey];
                    pObj[p+'vj_0_d_' + counter+'_'+skey] = so.rec;
                    pObj[p+'vj_0_e_' + counter+'_'+skey] = 0;
                }
            }
            else if(action.name == 'ExternalWebsitePush')
            {
                pObj[p+'vj_0_wp_a_' + counter] = se.Pushs[0].url;
                pObj[p+'vj_0_wp_b_' + counter] = se.Pushs[0].ask;

                for(skey in se.Pushs[0].Senders){
                    so = se.Pushs[0].Senders[skey];
                    pObj[p+'vj_0_wp_c_a_' + counter+'_'+skey] = so.userid;
                    pObj[p+'vj_0_wp_c_b_' + counter+'_'+skey] = so.groupid;
                    pObj[p+'vj_0_wp_c_c_' + counter+'_'+skey] = so.priority;
                }
            }
            counter++;
        }
    }
    return pObj;
};

EventConfiguration.prototype.showEventCreationForm = function(type,id){

    var that = this;

    if(type == 'add')
        this.m_SelectedEvent = {creator:'',created:0,edited:0,id:lzm_commonTools.guid(),URLConditions:[],Actions:[],VisitorConditions:[],DataConditions:[],name:'',ia:'1',prio:'1',ta:'0',tt:'0',sc:'0',tp:'0'};

    var headerString = tid('event');

    if(this.m_SelectedEvent.name != '')
        headerString += ' (' + lzm_commonTools.htmlEntities(this.m_SelectedEvent.name) + ')';

    var bodyString = '<div id="event-placeholder"></div>';
    var footerString = lzm_inputControls.createButton('save-event', '', '', tid('ok'), '', 'lr',{'margin-left': '4px'},'',30,'d') +
                        lzm_inputControls.createButton('cancel-event', '', '', t('Close'), '', 'lr',{'margin-left': '4px'},'',30,'d');

    TaskBarManager.GetWindow('event-configuration').Minimize();
    lzm_commonDialog.CreateDialogWindow(headerString, bodyString, footerString, 'flash', 'edit-event'+id, 'edit-event'+id, 'cancel-event', true);

    var tabArray = [
        {name: tid('event'), content: this.createEventHtml(0)},
        {name: tid('advanced'), content: this.createEventHtml(1)},
        {name: tid('goals'), content: this.createEventHtml(2)}
    ];

    lzm_inputControls.createTabControl('event-placeholder', tabArray);

    this.setAdvancedEvents();

    $('#cancel-event').click(function() {
        TaskBarManager.RemoveActiveWindow();
        TaskBarManager.Maximize('event-configuration');
    });
    $('#save-event').click(function() {

        if(PermissionEngine.permissions.events=='1' && that.m_SelectedEvent.creator != '' && that.m_SelectedEvent.creator != DataEngine.myId)
            showNoPermissionMessage();
        else
            saveEvent('edit',type);

        $('#cancel-event').click();
    });
};

EventConfiguration.prototype.switchLoading = function(show){
    if(show){
    var loadingHtml = '<div id="event-configuration-loading"><div class="lz_anim_loading"></div></div>';
        $('#event-configuration-body').append(loadingHtml).trigger('create');
        $('#event-configuration-loading').css({position: 'absolute', left: 0, top: 0, bottom: 0, right:0,'background-color': '#ffffff', 'z-index': 1000});
    }
    else
        $('#event-configuration-loading').remove();
};

EventConfiguration.prototype.getObjectById = function(id){
    var allObjects = [this.m_SelectedEvent.URLConditions,this.m_SelectedEvent.Actions,this.m_SelectedEvent.VisitorConditions,this.m_SelectedEvent.DataConditions];
    for(var keya in allObjects)
        for(var keyo in allObjects[keya]){
            if(allObjects[keya][keyo].id==id)
                return allObjects[keya][keyo];
        }
    return null;
};

EventConfiguration.prototype.getObjectByType = function(id){
    var allObjects = [this.m_SelectedEvent.URLConditions,this.m_SelectedEvent.Actions,this.m_SelectedEvent.VisitorConditions,this.m_SelectedEvent.DataConditions];
    for(var keya in allObjects)
        for(var keyo in allObjects[keya]){
            if(allObjects[keya][keyo].id==id)
                return allObjects[keya][keyo];
        }
    return null;
};

EventConfiguration.prototype.removeObjectById = function(id){
    var allObjects = [this.m_SelectedEvent.URLConditions,this.m_SelectedEvent.Actions,this.m_SelectedEvent.VisitorConditions,this.m_SelectedEvent.DataConditions];
    for(var keya in allObjects)
        for(var keyo in allObjects[keya])
            if(allObjects[keya][keyo].id==id)
                allObjects[keya].splice( $.inArray(allObjects[keya][keyo], allObjects[keya]), 1);
};

EventConfiguration.prototype.elementTypeExists = function(type,name){
    var action,allObjects = [this.m_SelectedEvent.URLConditions,this.m_SelectedEvent.Actions,this.m_SelectedEvent.VisitorConditions,this.m_SelectedEvent.DataConditions];
    for(var keya in allObjects)
        for(var keyo in allObjects[keya]){
            if(d(allObjects[keya][keyo].name))
            {
                if(allObjects[keya][keyo].name == name)
                    return !d(allObjects[keya][keyo].multiple);
            }
            else
            {

                action = lzm_commonTools.GetElementByProperty(this.m_Definitions[1].actions,'key',parseInt(allObjects[keya][keyo].type))[0];
                if(d(allObjects[keya][keyo].type) && action.name == name)
                    return true;
            }
        }
    return false;
};

EventConfiguration.prototype.getDefinitionByName = function(name){
    for(var key in this.m_Definitions[0].conditions)
        if(this.m_Definitions[0].conditions[key].name==name)
            return lzm_commonTools.clone(this.m_Definitions[0].conditions[key]);
    for(var key in this.m_Definitions[1].actions)
        if(this.m_Definitions[1].actions[key].name==name)
            return lzm_commonTools.clone(this.m_Definitions[1].actions[key]);
    return null;
};

EventConfiguration.prototype.reloadEvent = function(){
    $('#event-placeholder-content-0').html(this.createEventHtml(0));
};

EventConfiguration.prototype.showEventSubElementCreation = function(action,type,id){
    var options = [], that = this, def = null, obj = null, objId = '', elementType = '', toSelect = 'none', selectClass = '';

    options.push({text:tidc('select',' ...'),value:'none'});

    if(action!='add'){
        var parts = id.split('-');
        elementType = parts[0];
        objId = parts[1];
    }
    if(action=='remove'){

        this.removeObjectById(objId);
        this.reloadEvent();
        return;
    }
    if(action=='edit'){

        def = this.getDefinitionByName(elementType);
        obj = JSON.parse(lz_global_base64_decode($('#'+id).data('obj')));
        toSelect = type+'-'+def.name;
        selectClass = 'ui-disabled';
    }
    else
        objId = lzm_commonTools.guid();

    for(var key in this.m_Definitions)
        if(this.m_Definitions[key].name.toLowerCase()==type)
            for(var skey in this.m_Definitions[key][type])
                if(!this.elementTypeExists(type,this.m_Definitions[key][type][skey].name) || action=='edit')
                    options.push({text:'(' + tidc(this.m_Definitions[key][type][skey].target,') ') + this.m_Definitions[key][type][skey].title.replace(':',''),value:type+'-'+this.m_Definitions[key][type][skey].name});

    var dHtml = '<fieldset class="lzm-fieldset-full" style="min-height:50px;"><legend>'+tid('type')+'</legend>'+lzm_inputControls.createSelect('select-element-'+type,selectClass,'','','','','',options,toSelect,'')+'</fieldset>';
    dHtml += '<fieldset id="ev-sub-element-settings" class="lzm-fieldset-full" style="min-height:450px;min-width:450px;"><legend>'+tid('settings')+'</legend><div id="element-configuration"></div></fieldset>';

    lzm_commonDialog.createAlertDialog(dHtml, [{id: 'as-ok', name: tid('ok')}, {id: 'as-cancel', name: tid('cancel')}],true,true,true);
    var elementSelect = $('#select-element-'+type);

    elementSelect.change(function(){
        $('#element-configuration').html('');
        $('#ev-sub-element-settings').css('visibility','hidden');

        if(elementSelect.prop('selectedIndex')==0)
            return;

        var keyparts = elementSelect.val().split('-');
        elementType = keyparts[1];
        def = that.getDefinitionByName(elementType);

        if(d(def.editable))
            $('#ev-sub-element-settings').css('visibility','visible');

        if(def.custom){
            $('#element-configuration').html(that.createSubElementCustomHtml(def,objId));
            that.applySubElementCustomLogic(def,obj,objId);
        }
        else
        {
            if(obj != null)
                def.value = (d(obj.val)) ? obj.val : (d(obj.value)) ? obj.value : obj.Value;
            var html = (d(def.type)) ? UIRenderer.getControlHTML(def) : '';

            if(d(def.operatorList)){

                var recList = (obj != null) ? obj.Receivers : [];
                html += '<label class="top-space-double">'+tidc('operators')+'</label><div class="border-s" style="height:240px;overflow:auto;">' + lzm_inputControls.CreateOperatorList(def.name+'-receivers',false,false,recList,true) + '</div>';
            }
            $('#element-configuration').html(html);
        }


    });
    elementSelect.change();

    $('#alert-btn-as-ok').click(function() {

        if(that.applyRow(action,type,elementType,obj,objId,def))
            lzm_commonDialog.removeAlertDialog();
    });
    $('#alert-btn-as-cancel').click(function() {
        lzm_commonDialog.removeAlertDialog();
    });

};

EventConfiguration.prototype.applyRow = function(action,subType,elementType,obj,objId,def){
    var subElement = null;
    var exists = $('#' + elementType + '-' + objId).length;
    var prefix = objId + '-' + elementType + '-';
    if(exists)
        this.removeObjectById(objId);

    if(subType=='actions')
    {
        function saveSenders(obj,type,showError)
        {
            $('#' + objId + '-' + elementType + '-'+type+'-senders tbody tr').each(function(){
                var op = JSON.parse(lz_global_base64_decode($(this).data('obj')));
                if($('#' + objId + '-' + elementType + '-'+type+'-senders-cb-' + op.id).prop('checked'))
                    obj.Senders.push({Value:'',groupid:$('#' + objId + '-' + elementType + '-'+type+'-senders-groups-' + op.id).val(),id:lzm_commonTools.guid(),priority:$('#' + objId + '-' + elementType + '-'+type+'-senders-priority-' + op.id).val(),userid:op.id});
            });

            if(showError && obj.Senders.length==0)
                alert(tid('select_operator'));

            return obj.Senders.length>0;
        }

        subElement = {Invites:[],Overlays:[],Pushs:[],Receivers:[],Value:'',id:objId,type:'',val:''};

        if(elementType == 'ExternalInvitation' || elementType == 'ExternalTicketInvitation')
        {
            subElement.Invites.push({SenderGroupId:'',Senders:[],Value:'',bg:'1',
                bgc:'008080',bgo:'0.4',coc:'1',eff:'3',id:lzm_commonTools.guid(),
                mb:'0',ml:'0',mr:'0',mt:'0',pos:'12',sh:'1',shb:'4',shc:'FF8000',
                shpx:'1',shpy:'1',speed:'12',style:'classic'});

            if($('#' + objId + '-' + elementType + '-r-ict').prop('checked'))
                subElement.val = $('#' + objId + '-' + elementType + '-a-ict').val();

            if($('#' + objId + '-' + elementType + '-r-ici').prop('checked'))
                subElement.val = 'URL|||' + $('#' + objId + '-' + elementType + '-s-ici').val();

            var selGroup = $('#' + objId + '-' + elementType + '-r-isgr').prop('checked');

            if(selGroup)
                subElement.Invites[0].SenderGroupId = $('#' + objId + '-' + elementType + '-a-isgr').val();

            subElement.type = elementType == 'ExternalInvitation' ? '2' : '22';

            if(!selGroup && !saveSenders(subElement.Invites[0],'inv',!selGroup))
                return false;
        }
        else if(elementType == 'ExternalWebsitePush')
        {
            subElement.Pushs.push({Senders:[],Value:'',id:lzm_commonTools.guid(),ask:0,url:''});
            if($('#' + objId + '-' + elementType + '-r-wpct').prop('checked'))
                subElement.val = $('#' + objId + '-' + elementType + '-a-wpct').val();
            subElement.Pushs[0].ask = $('#' + objId + '-' + elementType + '-cb-ask').prop('checked') ? '1' : '0';
            subElement.Pushs[0].url = $('#' + objId + '-' + elementType + '-s-url').val();
            subElement.type = '4';
            if(!saveSenders(subElement.Pushs[0],'wp',true))
                return false;
        }
        else if(elementType == 'ExternalCallURL')
        {
            subElement.type = '7';

            var jsonb = {};
            jsonb.Url = $('#' + objId + '-' + elementType + '-s-call-url').val();
            jsonb.ToField = null;

            if($('#' + objId + '-' + elementType + '-cb-call-url-save-response').prop('checked'))
            {
                jsonb.ToField = $('#' + objId + '-' + elementType + '-sl-call-url-save-response-field').val();
            }

            subElement.val = JSON.stringify(jsonb);
        }
        else if(elementType == 'ExternalOverlayBox'){

            subElement.Overlays.push({Value:'',id:lzm_commonTools.guid(),coc:'1',eff:'0',mb:'0',ml:'0',mr:'0',mt:'0',pos:'11',speed:'8'});
            subElement.Overlays[0].bg = $('#' + objId + '-' + elementType + '-ob-cb-usebg').prop('checked') ? '1' : '0';
            subElement.Overlays[0].bgc = $('#' + objId + '-' + elementType + '-c-obbgcol').val().replace('#','');
            subElement.Overlays[0].bgo = $('#' + objId + '-' + elementType + '-int-obbgopacity').val();
            subElement.Overlays[0].h = $('#' + objId + '-' + elementType + '-r-obheight').val();
            subElement.Overlays[0].w = $('#' + objId + '-' + elementType + '-r-obwidth').val();
            subElement.Overlays[0].sh = $('#' + objId + '-' + elementType + '-ob-cb-usesh').prop('checked') ? '1' : '0';
            subElement.Overlays[0].shb = $('#' + objId + '-' + elementType + '-int-obshblur').val();
            subElement.Overlays[0].shc = $('#' + objId + '-' + elementType + '-c-obshcol').val().replace('#','');
            subElement.Overlays[0].shpx =
            subElement.Overlays[0].shpy = $('#' + objId + '-' + elementType + '-int-obshpos').val();
            subElement.Overlays[0].style = $('#' + objId + '-' + elementType + '-r-sround').prop('checked') ? 'rounded' : 'angled';

            subElement.val = $('#' + objId + '-' + elementType + '-r-oburl').prop('checked') ? '0;'+lz_global_base64_encode($('#' + objId + '-' + elementType + '-s-oburl').val()) : '1;'+lz_global_base64_encode($('#' + objId + '-' + elementType + '-a-obcc').val());
            subElement.type = '5';
        }
        else if(elementType == 'InternalPlaySound'){
            def.value =
            subElement.val = $('#s-InternalPlaySound').val();
            subElement.type = '1';
        }
        else if(elementType == 'InternalMessageBox'){
            def.value =
            subElement.val = $('#s-InternalMessageBox').val();
            subElement.type = '0';
        }
        else if(elementType == 'ExternalAlert'){
            def.value =
            subElement.val = $('#s-ExternalAlert').val();
            subElement.type = '3';
        }
        else if(elementType == 'ExternalTag'){
            def.value =
            subElement.val = $('#a-ExternalTag').val();
            subElement.type = '6';
        }

        if(d(def.operatorList))
            $('#' + def.name +'-receivers tbody tr').each(function(){
                var op = JSON.parse(lz_global_base64_decode($(this).data('obj')));
                if($('#' + def.name +'-receivers-cb-' + op.id).prop('checked'))
                    subElement.Receivers.push({Value:'',id:lzm_commonTools.guid(),rec:op.id});
            });

        this.m_SelectedEvent.Actions.push(subElement);
    }
    else
    {
        subElement = (exists) ? obj : this.getDefinitionByName(elementType);

        if(elementType == 'DataCondition'){
            subElement = {Value:lz_global_base64_encode($('#' + objId + '-' + elementType + '-s-data').val()),id:lzm_commonTools.guid(),ind:$('#' + objId + '-' + elementType + '-sl-input').val()};
            this.m_SelectedEvent.DataConditions.push(subElement);
        }
        else if(elementType == 'URLCondition'){
            subElement = {Value:'',id:lzm_commonTools.guid(),bl:'',url:'',ref:'',tos:'0'};
            if($('#'+ prefix + 'cb-referrer').prop('checked'))
                subElement.ref=$('#'+ prefix + 's-referrer').val();
            if($('#'+ prefix + 'cb-tos').prop('checked')){
                var val = $('#'+ prefix + 'int-tos').val();
                if(val != '')
                    subElement.tos=Math.abs(val);
            }
            if($('#'+ prefix + 'cb-url').prop('checked'))
                subElement.url=$('#'+ prefix + 's-url').val();
            if($('#'+ prefix + 'cb-bl').prop('checked'))
                subElement.bl='1';
            this.m_SelectedEvent.URLConditions.push(subElement);
        }
        else{
            if(!d(def.type))
                subElement.value = 1;
            else if(def.type == 'string')
                subElement.value = $('#s-' + def.name).val();
            else if(def.type == 'int')
                subElement.value = $('#int-' + def.name).val();
            subElement.id = objId;

            this.m_SelectedEvent.VisitorConditions.push(subElement);
        }

    }
    this.reloadEvent();
    return true;
};

EventConfiguration.prototype.createSubElementCustomHtml = function(definition,objId){
    var key=0,inputs=[],chtml = '';
    var prefix = objId + '-' + definition.name + '-';
    if(definition.name == 'URLCondition')
    {
        chtml += '<div>' + lzm_inputControls.createCheckbox(prefix + 'cb-url',tidc('url'),false,'') + '</div>';
        chtml += '<div class="left-space-child top-space-half">' + lzm_inputControls.createInput(prefix + 's-url', '', '', '', '', 'text', '') + '</div><div class="lzm-info-text text-s left-space-child top-space-half">'+tidc('use_as_wildcard',', ')+tidc('example')+' http*mywebsite*/contact*</div>';
        chtml += '<div class="top-space-double">' + lzm_inputControls.createCheckbox(prefix + 'cb-referrer','Referrer:',false,'') + '</div>';
        chtml += '<div class="left-space-child top-space-half">' + lzm_inputControls.createInput(prefix + 's-referrer', '', '', '', '', 'text', '') + '</div><div class="lzm-info-text text-s left-space-child top-space-half">'+tidc('use_as_wildcard',', ')+tidc('example')+' http*refwebsite*</div>';
        chtml += '<div class="top-space-double">' + lzm_inputControls.createCheckbox(prefix + 'cb-tos',tidc('ev_time_on_site'),false,'') + '</div>';
        chtml += '<div class="left-space-child top-space-half">' + lzm_inputControls.createInput(prefix + 'int-tos', '', 0, '', '', 'number','','',tid('seconds')) + '</div>';
        chtml += '<div class="top-space-double">' + lzm_inputControls.createCheckbox(prefix + 'cb-bl',tid('blacklist'),false,'') + '</div>';
    }
    else if(definition.name == 'DataCondition')
    {
        for (key in DataEngine.inputList.objects)
            if(DataEngine.inputList.objects[key].active==1)
                inputs.push({text:DataEngine.inputList.objects[key].name,value:DataEngine.inputList.objects[key].id});
        chtml += '<table><tr><td style="width:48%;"><label for="'+prefix + 'sl-input">'+tidc('input')+'</label>' + lzm_inputControls.createSelect(prefix + 'sl-input','','','','','','',inputs,'','') + '</td>';
        chtml += '<td><br>&nbsp;=&nbsp;</td>';
        chtml += '<td>' + lzm_inputControls.createInput(prefix + 's-data', '', '', tidc('value'), '', 'text', '') + '</td></tr><tr><td></td><td></td><td><span class="lzm-info-text text-s">'+tid('use_as_wildcard')+'</span></td></tr></table>';
    }
    else if(definition.name == 'ExternalCallURL')
    {
        chtml += '<div class="top-space-half">' + lzm_inputControls.createInput(prefix + 's-call-url','', '', tidc('url'), '', 'text', '') + '</div>';
        chtml += '<div class="top-space lzm-info-text">Depending on context, POST variables <i>json_visitor</i> and <i>json_chat</i>including all relevant details will be passed to the URL.</div>';

        chtml += '<div class="top-space-double">' + lzm_inputControls.createCheckbox(prefix + 'cb-call-url-save-response',tidc('save_server_response_into'),false,'') + '</div>';
        for (key in DataEngine.inputList.objects)
            if(DataEngine.inputList.objects[key].active==1)
                inputs.push({text:DataEngine.inputList.objects[key].name,value:DataEngine.inputList.objects[key].id});
        chtml += '<div class="left-space-child top-space-half">' + lzm_inputControls.createSelect(prefix + 'sl-call-url-save-response-field','','','','','','',inputs,'','') + '</div>';
    }
    else if(definition.name == 'ExternalInvitation')
        return '<div class=""><div id="ExternalInvitation-placeholder"></div></div>';
    else if(definition.name == 'ExternalTicketInvitation')
        return '<div class=""><div id="ExternalTicketInvitation-placeholder"></div></div>';
    else if(definition.name == 'ExternalWebsitePush')
        return '<div class=""><div id="ExternalWebsitePush-placeholder"></div></div>';
    else if(definition.name == 'ExternalOverlayBox')
        return '<div class=""><div id="ExternalOverlayBox-placeholder"></div></div>';
    return chtml;
};

EventConfiguration.prototype.applySubElementCustomLogic = function(definition,obj,objId){
    var prefix = objId + '-' + definition.name + '-';
    var cText = (obj != null && d(obj.val) && obj.val.indexOf('URL|||') !== 0) ? obj.val : '';
    var cImageURL = (obj != null && d(obj.val) && obj.val.indexOf('URL|||') === 0) ? obj.val.replace('URL|||','') : '';

    function loadSenders(obj,type){
        for(var key in obj.Senders){
            $('#' + objId + '-' + definition.name + '-'+type+'-senders-groups-' + obj.Senders[key].userid).val(obj.Senders[key].groupid);
            $('#' + objId + '-' + definition.name + '-'+type+'-senders-priority-' + obj.Senders[key].userid).val(obj.Senders[key].priority);
            $('#' + objId + '-' + definition.name + '-'+type+'-senders-cb-' + obj.Senders[key].userid).prop('checked',true);
        }
    }

    if(definition.name == 'DataCondition' && obj != null){
        $('#'+ prefix + 'sl-input').val(obj.ind);
        $('#'+ prefix + 's-data').val(lz_global_base64_decode(obj.Value));
    }
    else if(definition.name == 'URLCondition'){

        $('#'+ prefix + 'int-tos').attr('min',1);
        if(obj != null){
            $('#'+ prefix + 's-url').val(obj.url);
            if(obj.url!='')
                $('#'+ prefix + 'cb-url').prop('checked',true);
            $('#'+ prefix + 's-referrer').val(obj.ref);
            if(obj.ref!='')
                $('#'+ prefix + 'cb-referrer').prop('checked',true);
            $('#'+ prefix + 'int-tos').val(obj.tos);
            if(obj.tos!='0')
                $('#'+ prefix + 'cb-tos').prop('checked',true);
            if(obj.bl!='')
                $('#'+ prefix + 'cb-bl').prop('checked',true);
        }

        $('#'+ prefix + 'cb-url').change(function(){
            if(!$('#'+ prefix + 'cb-url').prop('checked'))
                $('#'+ prefix + 's-url').addClass('ui-disabled');
            else
                $('#'+ prefix + 's-url').removeClass('ui-disabled');
        });
        $('#'+ prefix + 'cb-referrer').change(function(){
            if(!$('#'+ prefix + 'cb-referrer').prop('checked'))
                $('#'+ prefix + 's-referrer').addClass('ui-disabled');
            else
                $('#'+ prefix + 's-referrer').removeClass('ui-disabled');
        });
        $('#'+ prefix + 'cb-tos').change(function(){
            if(!$('#'+ prefix + 'cb-tos').prop('checked'))
                $('#'+ prefix + 'int-tos').addClass('ui-disabled');
            else
                $('#'+ prefix + 'int-tos').removeClass('ui-disabled');
        });
        $('#'+ prefix + 'cb-url').change();
        $('#'+ prefix + 'cb-referrer').change();
        $('#'+ prefix + 'cb-tos').change();
    }
    else if(definition.name == 'ExternalCallURL')
    {
        if(obj != null)
        {
            if(obj.val.length)
            {
                var jsonobj = JSON.parse(obj.val);
                $('#'+ prefix + 's-call-url').val(jsonobj.Url);
                if(jsonobj.ToField != null)
                {
                    $('#'+ prefix + 'cb-call-url-save-response').prop('checked',true);
                    $('#'+ prefix + 'sl-call-url-save-response-field').val(jsonobj.ToField);
                }
            }
        }
        $('#'+ prefix + 'cb-call-url-save-response').change(function(){
            if(!$(this).prop('checked'))
                $('#'+ prefix + 'sl-call-url-save-response-field').addClass('ui-disabled');
            else
                $('#'+ prefix + 'sl-call-url-save-response-field').removeClass('ui-disabled');
        }).change();
    }
    else if(definition.name == 'ExternalInvitation' || definition.name == 'ExternalTicketInvitation')
    {
        var senderGroupId = (obj != null && obj.Invites.length && obj.Invites[0].SenderGroupId);
        var ithtml = '<div class="top-space">' + lzm_inputControls.createRadio(prefix + 'r-ist','','inv-text',tid('ac_def_text')) + '</div>';

        ithtml += '<div class="top-space">' + lzm_inputControls.createRadio(prefix + 'r-ict','','inv-text',tidc('custom_text')) + '</div>';
        ithtml += '<div class="left-space-child top-space-half">' + lzm_inputControls.createArea(prefix + 'a-ict',cText,'','','height:120px;') + '</div>';

        ithtml += '<div class="top-space">' + lzm_inputControls.createRadio(prefix + 'r-ici','','inv-text',tidc('image')) + '</div>';
        ithtml += '<div class="left-space-child top-space-half">' + lzm_inputControls.createInput(prefix + 's-ici','', cImageURL, '', '', 'text', '') + '</div>';

        var groupList = [], groups = DataEngine.groups.getGroupList('id',true,false);
        for (var i=0; i<groups.length; i++)
            if(groups[i].external == 1)
                groupList.push({value: groups[i].id, text: groups[i].id});

        var ishtml = '<div class="top-space">' + lzm_inputControls.createRadio(prefix + 'r-isgr','','sender-type',tidc('inv_send_group')) + '</div>';
        ishtml += '<div class="top-space-half left-space-child">' + lzm_inputControls.createSelect(prefix + 'a-isgr','','','','','','',groupList,(senderGroupId.length) ? senderGroupId : 0,'') + '</div>';
        ishtml += '<div class="top-space">' + lzm_inputControls.createRadio(prefix + 'r-isopl','','sender-type',tidc('select_operators')) + '</div>';
        ishtml += '<div class="top-space-half left-space-child border-s" style="height:220px;overflow:auto;">' + lzm_inputControls.CreateOperatorList(prefix + 'inv-senders',true,true,null,true) + '</div>';

        tabs = [
            {name: tid('invitation_text'), content: ithtml, hash: 'it'},
            {name: tid('operators'), content: ishtml, hash: 'is'}];

        lzm_inputControls.createTabControl(definition.name + '-placeholder',tabs,0);

        if(obj != null)
            loadSenders(obj.Invites[0],'inv');

        if(cText.length)
            $('#'+ prefix + 'r-ict').prop('checked',true);
        else if(cImageURL.length)
            $('#'+ prefix + 'r-ici').prop('checked',true);
        else
            $('#'+ prefix + 'r-ist').prop('checked',true);

        if(!senderGroupId.length && obj != null)
            $('#'+ prefix + 'r-isopl').prop('checked',true);
        else
            $('#'+ prefix + 'r-isgr').prop('checked',true);

        $('.inv-text').change(function(){
            if($('#'+ prefix + 'r-ist').prop('checked'))
            {
                $('#'+ prefix + 's-ici').addClass('ui-disabled');
                $('#'+ prefix + 'a-ict').addClass('ui-disabled');
            }
            else if($('#'+ prefix + 'r-ict').prop('checked'))
            {
               $('#'+ prefix + 's-ici').addClass('ui-disabled');
               $('#'+ prefix + 'a-ict').removeClass('ui-disabled');
            }
            else
            {
                $('#'+ prefix + 's-ici').removeClass('ui-disabled');
                $('#'+ prefix + 'a-ict').addClass('ui-disabled');
            }
        });
        $('.sender-type').change(function(){
            if($('#'+ prefix + 'r-isgr').prop('checked'))
            {
                $('#'+ prefix + 'inv-senders').addClass('ui-disabled');
                $('#'+ prefix + 'a-isgr').removeClass('ui-disabled');
            }
            else
            {
                $('#'+ prefix + 'a-isgr').addClass('ui-disabled');
                $('#'+ prefix + 'inv-senders').removeClass('ui-disabled');
            }
        });
        $('.sender-type').change();
        $('.inv-text').change();
    }
    else if(definition.name == 'ExternalOverlayBox'){
        var parts = cText.split(';');
        var content = (parts.length>1) ? lz_global_base64_decode(parts[1]) : '';
        var obheight = (obj != null) ? obj.Overlays[0].h : 400;
        var obwidth = (obj != null) ? obj.Overlays[0].w : 400;
        var shc = (obj != null) ? obj.Overlays[0].shc : 696969;
        var bgc = (obj != null) ? obj.Overlays[0].bgc : '000';
        var sxy = (obj != null) ? obj.Overlays[0].shpx : 5;
        var sbl = (obj != null) ? obj.Overlays[0].shb : 5;
        var bgo = (obj != null) ? obj.Overlays[0].bgo : 0.5;

        var cHtml = '<div class="top-space-double">' + lzm_inputControls.createRadio(prefix + 'r-oburl','ob-tg','ob-content',tidc('url')) + '</div>';
        cHtml += '<div class="top-space-half left-space-child">' + lzm_inputControls.createInput(prefix + 's-oburl', '', '', '', '', 'text', '') + '</div>';
        cHtml += '<div class="top-space-double">' + lzm_inputControls.createRadio(prefix + 'r-obcc','ob-tg','ob-content','HTML:') + '</div>';
        cHtml += '<div class="left-space-child">' + lzm_inputControls.createArea(prefix + 'a-obcc','','ob-tg','','height:200px;') + '</div>';

        var sHtml = '<table><tr><td style="vertical-align:top;"><fieldset style="" class="lzm-fieldset-full"><legend>Style</legend><div class="">' + lzm_inputControls.createRadio(prefix + 'r-sround','','ob-style','Rounded') + '</div>';
        sHtml += '<div class="top-space">' + lzm_inputControls.createRadio(prefix + 'r-srec','','ob-style','Rectangle') + '</div></fieldset>';

        sHtml += '<fieldset style="height:195px;padding-top:2px;" class="lzm-fieldset-full"><legend>';
        sHtml += lzm_inputControls.createCheckbox(prefix + 'ob-cb-usesh',tid('shadow'),false,'');

        sHtml += '</legend><div>'+lzm_inputControls.createColor(prefix + 'c-obshcol','ob-sh','#'+shc,tidc('color'),'')+'</div>';
        sHtml += '<div>'+lzm_inputControls.createInput(prefix + 'int-obshpos', 'ob-sh', sxy, tidc('position'), '', 'number', '' ,'' ,'px')+'</div>';
        sHtml += '<div class="top-space">'+lzm_inputControls.createInput(prefix + 'int-obshblur', 'ob-sh', sbl, tidc('blur'), '', 'number', '' ,'' ,'')+'</div>';
        sHtml += '</fieldset></td><td>&nbsp;</td><td>';

        sHtml += '<fieldset style="height:125px;" class="lzm-fieldset-full"><legend>'+tid('dimensions')+'</legend>';
        sHtml += '<div>'+lzm_inputControls.createInput(prefix + 'r-obwidth', '', obwidth, tid('width'), '', 'number', '' ,'' ,'px')+'</div>';
        sHtml += '<div class="top-space">'+lzm_inputControls.createInput(prefix + 'r-obheight', '', obheight, tid('height'), '', 'number', '' ,'' ,'px')+'</div>';
        sHtml += '</fieldset>';

        sHtml += '<fieldset style="height:141px;padding-top:2px;" class="lzm-fieldset-full"><legend>'+ lzm_inputControls.createCheckbox(prefix + 'ob-cb-usebg',tid('background'),false,'') +'</legend>';
        sHtml += '</legend><div>'+lzm_inputControls.createColor(prefix + 'c-obbgcol','ob-bg','#'+bgc,tidc('color'),'')+'</div>';
        sHtml += '<div>'+lzm_inputControls.createInput(prefix + 'int-obbgopacity','ob-bg', bgo, 'Opacity:', '', 'number', '' ,'')+'</div>';
        sHtml += '</fieldset></td></tr></table>';

        var tabs = [
            {name: tid('content'), content: cHtml, hash: 'it'},
            {name: tid('settings'), content: sHtml, hash: 'is'}];

        lzm_inputControls.createTabControl('ExternalOverlayBox-placeholder',tabs,0);

        $('#' + prefix + 'int-obbgopacity').attr('step','0.1');

        if(obj != null && obj.Overlays[0].sh != '')
            $('#'+ prefix + 'ob-cb-usesh').prop('checked',true);

        if(obj != null && obj.Overlays[0].bg != '')
            $('#'+ prefix + 'ob-cb-usebg').prop('checked',true);

        if(obj != null && obj.Overlays[0].style != 'rounded')
            $('#'+ prefix + 'r-srec').prop('checked',true);
        else
            $('#'+ prefix + 'r-sround').prop('checked',true);

        if(obj == null || parts[0]=='0'){
            $('#'+ prefix + 'r-oburl').prop('checked',true);
            $('#'+ prefix + 's-oburl').val(content);
        }
        else{
            $('#'+ prefix + 'r-obcc').prop('checked',true);
            $('#'+ prefix + 'a-obcc').val(content);
        }

        $('#' + prefix + 'c-obshcol').change(function() {
            if(lzm_commonTools.isHEXColor($('#' + prefix + 'c-obshcol').val()))
                $('#' + prefix + 'c-obshcol-icon').css({background:$('#' + prefix + 'c-obshcol').val()});
        });
        $('#' + prefix + 'c-obbgcol').change(function() {
            if(lzm_commonTools.isHEXColor($('#' + prefix + 'c-obbgcol').val()))
                $('#' + prefix + 'c-obbgcol-icon').css({background:$('#' + prefix + 'c-obbgcol').val()});
        });
        $('#'+ prefix + 'ob-cb-usesh').change(function(){
            if($('#'+ prefix + 'ob-cb-usesh').prop('checked'))
                $('.ob-sh').removeClass('ui-disabled');
            else
                $('.ob-sh').addClass('ui-disabled');
        });
        $('#'+ prefix + 'ob-cb-usebg').change(function(){
            if($('#'+ prefix + 'ob-cb-usebg').prop('checked'))
                $('.ob-bg').removeClass('ui-disabled');
            else
                $('.ob-bg').addClass('ui-disabled');
        });
        $('.ob-content').change(function(){
            if($('#'+ prefix + 'r-oburl').prop('checked')){
                $('#'+ prefix + 'a-obcc').addClass('ui-disabled');
                $('#'+ prefix + 's-oburl').removeClass('ui-disabled');
            }
            else{
                $('#'+ prefix + 'a-obcc').removeClass('ui-disabled');
                $('#'+ prefix + 's-oburl').addClass('ui-disabled');
            }
        });

        $('#'+ prefix + 'ob-cb-usesh').change();
        $('#'+ prefix + 'ob-cb-usebg').change();
        $('.ob-content').change();

    }
};

EventConfiguration.prototype.createEventHtml = function(tab){
    var thtml = '', kg= 0,goal=null,kge = 0,checked=false;

    if(tab==0)
    {
        if($('#s-event-name').length)
        {
            this.m_SelectedEvent.name = $('#s-event-name').val();
            this.m_SelectedEvent.ia = $('#cb-event-active').prop('checked') ? '1' : '0';
            this.m_SelectedEvent.prio = $('#event-priority').val();
        }

        thtml += this.CreateConditionsHtml() + this.CreateActionsHtml();

        thtml += '<br><fieldset class="lzm-fieldset-full lzm-fieldset-inline event-list-table"><legend>&nbsp;</legend><div>';
        thtml += lzm_inputControls.createCheckbox('cb-event-active',tid('active'),(this.m_SelectedEvent.ia=='1'),'');
        thtml += '</div><div class="top-space">';
        thtml += lzm_inputControls.createInput('s-event-name', '', this.m_SelectedEvent.name, tidc('name'), '', 'text', '') + '</div>';
        thtml += '<div class="top-space">' + lzm_inputControls.createPriorityList('event-priority','',this.m_SelectedEvent.prio,100,tidc('priority')) +'</div></fieldset>';
        thtml += '';

        thtml += '';
    }
    else if(tab==1)
    {
        thtml = '<fieldset class="lzm-fieldset-full"><legend>'+tid('triggering')+'</legend>';
        thtml += '<div class="">' + lzm_inputControls.createRadio('r-event-tr-visitor','','event-tr',tid('ev_trigger_visitor')) + '</div>';
        thtml += '<div class="top-space">' + lzm_inputControls.createRadio('r-event-tr-browser','','event-tr',tid('ev_trigger_browser')) + '</div>';
        thtml += '<div class="top-space">' + lzm_inputControls.createRadio('r-event-tr-multi','','event-tr',tid('ev_trigger_multiple')) + '</div>';
        thtml += '<div class="top-space-half left-space-child">'+lzm_inputControls.createInput('int-event-tr-multi','event-tr-multi', Math.max(this.m_SelectedEvent.ta,1), '', '', 'number', '' ,'', tid('times'))+'</div>';
        thtml += '<div class="top-space left-space-child">' + lzm_inputControls.createCheckbox('cb-event-tr-multi-delay',tidc('ev_retrigger'),false,'event-tr-multi') + '</div>';
        thtml += '<div class="top-space-half left-space-child"><div class="left-space-child">'+lzm_inputControls.createInput('int-event-tr-multi-delay','event-tr-multi', Math.max(this.m_SelectedEvent.tt,1), '', '', 'number', '' ,'', tid('seconds'))+'</div></div>';
        thtml += '<div class="top-space left-space-child">' + lzm_inputControls.createCheckbox('cb-event-tr-multi-reload',tid('ev_retrigger_reload'),false,'event-tr-multi') + '</div>';
        thtml += '</fieldset>';
        thtml += '<fieldset class="lzm-fieldset-full"><legend>Javascript Command</legend>';
        thtml += lzm_inputControls.createInput('s-event-jscript-command','', 'LiveZilla.ExecuteEvent(\''+this.m_SelectedEvent.id+'\');', tidc('jscript_command'), '', 'text', '');
        thtml += '</fieldset>';
    }
    else if(tab==2)
    {
        thtml += '<div class="lzm-fieldset"><fieldset class="lzm-fieldset-full"><legend>'+tid('goals')+'</legend>';
        thtml += '<table class="visible-list-table alternating-rows-table lzm-unselectable" id="event-goals"><thead></thead><tbody>';

        for(kg in DataEngine.global_configuration.database['goals'])
        {
            goal = DataEngine.global_configuration.database['goals'][kg];
            checked = false;
            for(kge in this.m_SelectedEvent.Goals)
                if(this.m_SelectedEvent.Goals[kge].id == goal.id)
                    checked = true;

            thtml += '<tr><td style="width:25px;">'+lzm_inputControls.createCheckbox('cb-event-goal-' + goal.id,goal.title,checked)+'</td>' +
                '<td style="text-align: right;padding:0;" class="tight">' +
                lzm_inputControls.createButton('ev-goal-'+goal.id+'-edit','','EventConfiguration.__EditGoal(\''+goal.id+'\');', tid('edit'), '<i class="fa fa-cog icon-small"></i>', '', {'margin': '0 6px 0 0'}, '', 30, 'b') +
                lzm_inputControls.createButton('ev-goal-'+goal.id+'-remove','','EventConfiguration.__RemoveGoal(\''+goal.id+'\');', tid('remove'), '<i class="fa fa-trash icon-small"></i>', '', {'margin': '0'}, '', 30, 'b') +
                '</td></tr>';
        }

        thtml += '</tbody></table>';

        if(DataEngine.global_configuration.database['goals'].length)
            thtml += '<hr>';

        thtml += '<div class="top-space" style="text-align:right;padding:8px 0;">';
        thtml += lzm_inputControls.createButton('ev-goal-add','','EventConfiguration.__EditGoal(null);', tid('add'), '', '', {}, '', 30, 'd');
        thtml += '</div></fieldset></div>';
    }
    return '<div class="lzm-tab-scroll-content">' +  thtml + '</div>';
};

EventConfiguration.prototype.setAdvancedEvents = function(){

    if(this.m_SelectedEvent.ta!='0')
        $('#r-event-tr-multi').prop('checked',true);
    else if(this.m_SelectedEvent.sc=='1')
        $('#r-event-tr-visitor').prop('checked',true);
    else
        $('#r-event-tr-browser').prop('checked',true);

    if(this.m_SelectedEvent.tt!='0' && this.m_SelectedEvent.ta!='0')
        $('#cb-event-tr-multi-delay').prop('checked',true);

    if(this.m_SelectedEvent.tp=='1' && this.m_SelectedEvent.ta!='0')
        $('#cb-event-tr-multi-reload').prop('checked',true);

    $('.event-tr').change(function(){
        if(!$('#r-event-tr-multi').prop('checked'))
            $('.event-tr-multi').addClass('ui-disabled');
        else
            $('.event-tr-multi').removeClass('ui-disabled');
    });
    $('#cb-event-tr-multi-delay').change(function(){
        if(!$('#cb-event-tr-multi-delay').prop('checked'))
            $('#int-event-tr-multi-delay').addClass('ui-disabled');
        else
            $('#int-event-tr-multi-delay').removeClass('ui-disabled');
    });
    $('#cb-event-tr-multi-delay').change();
    $('.event-tr').change();

    $('#s-event-jscript-command').css({padding:'10px','text-align':'center','fontFamily':'courier'});
    $('#s-event-jscript-command').attr('spellchecker',false);
    $('#s-event-jscript-command').attr('readonly',true);
};

EventConfiguration.prototype.CreateConditionsHtml = function() {

    var conditionsHtml = '<fieldset class="event-list-table lzm-fieldset-full lzm-fieldset-inline"><legend>&nbsp;</legend>' +
        '<div class="event-header">'+tid('if').toUpperCase()+' ...</div>';
    conditionsHtml+=this.CreateEventSubTableHtml('conditions');
    return conditionsHtml+'</fieldset>';
};

EventConfiguration.prototype.CreateActionsHtml = function() {
    var actionsHtml = '<fieldset class="event-list-table lzm-fieldset-full lzm-fieldset-inline"><legend>&nbsp;</legend>' +
        '<div class="event-header">... '+tid('then').toUpperCase()+'</div>';
    actionsHtml+=this.CreateEventSubTableHtml('actions');
    return actionsHtml+'</fieldset>';
};

EventConfiguration.prototype.CreateEventSubTableHtml = function(type) {

    var tableHtml = '<label class="text-bold text-gray">' + tid(type) + '</label><hr><table class="visible-list-table alternating-rows-table lzm-unselectable" id="events-'+type+'-table"><tbody>';
    var addButtonClass = '';

    if(type=='conditions')
    {
        var ctableHtml = this.createEventSubURLConditions();
        ctableHtml += this.createEventSubDataConditions();
        ctableHtml += this.createEventSubVisitorConditions();
        tableHtml += (ctableHtml.length) ? ctableHtml : '<tr><td colspan="2" class="text-center"><div class="spaced text-bold text-xl">'+tid('none')+'</div><div class="text-gray spaced">('+tid('fire_unc')+')</div></td></tr>';
    }
    else
    {
        var atableHtml = this.createEventSubActions();
        tableHtml += (atableHtml.length) ? atableHtml : '<tr><td colspan="2" class="text-center"><div class="spaced text-bold text-xl">'+tid('none')+'</div><div class="text-gray spaced">('+tid('nothing_happen')+')</div></td></tr>';

        if(this.m_SelectedEvent.Actions.length == this.m_Definitions[1].actions.length)
            addButtonClass = 'ui-disabled';
    }

    tableHtml += '</tbody></table>';
    tableHtml += '<hr><div class="text-right vspaced">'+lzm_inputControls.createButton('add-' + type, addButtonClass, 'showEventSubElementCreation(\'add\',\''+type+'\',\'\',null);', tid('add'), '', 'lr',{'margin-left': '4px'},'',30,'d') + '</div>';

    return tableHtml;
};

EventConfiguration.prototype.createEventSubURLConditions = function() {
    var uchtml ='';
    for(var key in this.m_SelectedEvent.URLConditions)
        uchtml += this.createEventSubRowHtml(this.m_SelectedEvent.URLConditions[key],'URLCondition',tid('ev_url_cond'),'conditions',this.m_SelectedEvent.URLConditions[key].id);
    return uchtml;
};

EventConfiguration.prototype.createEventSubDataConditions = function() {
    var dchtml ='';
    for(var key in this.m_SelectedEvent.DataConditions)
        dchtml += this.createEventSubRowHtml(this.m_SelectedEvent.DataConditions[key],'DataCondition',tid('ev_data_cond'),'conditions',this.m_SelectedEvent.DataConditions[key].id);
    return dchtml;
};

EventConfiguration.prototype.createEventSubVisitorConditions = function() {
    var vchtml ='';
    for(var key in this.m_SelectedEvent.VisitorConditions)
        vchtml += this.createEventSubRowHtml(this.m_SelectedEvent.VisitorConditions[key],this.m_SelectedEvent.VisitorConditions[key].name,this.getDefinitionByName(this.m_SelectedEvent.VisitorConditions[key].name).title.replace(':',''),'conditions',this.m_SelectedEvent.VisitorConditions[key].id,d(this.m_SelectedEvent.VisitorConditions[key].editable));
    return vchtml;
};

EventConfiguration.prototype.createEventSubActions = function() {
    var key,action,ahtml ='';
    for(key in this.m_SelectedEvent.Actions)
    {
        action = lzm_commonTools.GetElementByProperty(this.m_Definitions[1].actions,'key',parseInt(this.m_SelectedEvent.Actions[key].type))[0];
        if(d(action))
            ahtml += this.createEventSubRowHtml(this.m_SelectedEvent.Actions[key],action.name,tid('ev_action_' + this.m_SelectedEvent.Actions[key].type.toString()),'actions',this.m_SelectedEvent.Actions[key].id);
    }
    return ahtml;
};

EventConfiguration.prototype.createEventSubRowHtml = function(obj,name,title,type,id,edit) {
    edit = (!d(edit)) ? true : edit;
    var fid = name + '-' + id;
    var rowHtml = '<tr id="'+ fid + '" data-obj="'+lz_global_base64_encode(JSON.stringify(obj))+'" title="'+title+'"><td>'+lzm_commonTools.SubStr(title,20,true)+'</td>';
    rowHtml += '<td class="tight right">';
    if(edit)
        rowHtml += lzm_inputControls.createButton('edit-' + fid, '', 'showEventSubElementCreation(\'edit\',\''+type+'\',\''+fid+'\');', tid('edit'), '<i class="fa fa-gear icon-small"></i>', 'lr',{'margin-left': '4px'},'',30,'b');
    rowHtml += lzm_inputControls.createButton('remove-' + fid, '', 'showEventSubElementCreation(\'remove\',\''+type+'\',\''+fid+'\');', tid('delete'), '<i class="fa fa-trash icon-small"></i>', 'lr',{'margin-left': '4px','margin-right': '0'},'',30,'b')+'</td></tr>';
    return rowHtml;
};

EventConfiguration.prototype.createEventListHtml = function() {

    var bodyString = '<table class="visible-list-table alternating-rows-table lzm-unselectable" id="events-table"><thead><tr><th></th>' +
        '<th>' + tid('name') + '</th><th class="text-center">' + tid('priority') + '</th><th class="text-center">' + tid('edited') + '</th></tr></thead><tbody>';
    for (var i=0; i<DataEngine.eventList.length; i++)
    {
        var ev = DataEngine.eventList[i];
        this.loadVisitorConditions(ev);

        var edTime = lzm_chatTimeStamp.getLocalTimeObject(parseInt(ev.edited * 1000), true);
        var edString = lzm_commonTools.getHumanDate(edTime, '', lzm_chatDisplay.userLanguage) + ' ';
        var onclickAction = ((!IFManager.IsAppFrame && !IFManager.IsMobileOS) || IFManager.IsDesktopApp()) ? ' onclick="selectEventsLine(event, \'' + ev.id + '\');"' : ' onclick="openEventsListContextMenu(event, \'' + ev.id + '\');"';
        var onconetxtMenuAction = ((!IFManager.IsAppFrame && !IFManager.IsMobileOS) || IFManager.IsDesktopApp()) ? ' oncontextmenu="openEventsListContextMenu(event, \'' + ev.id + '\');"' : '';
        var ondblclickAction =  ((!IFManager.IsAppFrame && !IFManager.IsMobileOS) || IFManager.IsDesktopApp()) ? ' ondblclick="showEventCreation(\'edit\', \'' + ev.id + '\', true);"' : '';
        var selectedLine = (this.m_SelectedEventId==ev.id) ? ' selected-table-line' : '';
        bodyString += '<tr id="events-list-line-'+ev.id+'" '+onclickAction+onconetxtMenuAction+ondblclickAction+' class="events-list-line'+selectedLine+'"><td class="noibg icon-column"><i class="fa fa-'+(ev.ia == '1' ? 'flash icon-orange' : 'ban')+'"></i></td>' +
            '<td>'+ev.name+'</td>' +
            '<td class="text-center">'+ev.prio+'</td>' +
            '<td class="text-center">'+edString+'</td>' +
            '</tr>';
    }
    bodyString += '</tbody></table>';
    return bodyString;
};

EventConfiguration.prototype.openEventsListContextMenu = function(e, eventId) {
    e.preventDefault();
    selectEventsLine(e, eventId);
    var event = lzm_commonTools.GetElementByProperty(DataEngine.eventList,'id',eventId);
    if (event != null) {
        e.stopPropagation();
        var scrolledDownY = $('#event-configuration-body').scrollTop();
        var scrolledDownX = $('#event-configuration-body').scrollLeft();
        var parentOffset = $('#event-configuration-body').offset();
        var yValue = e.pageY - parentOffset.top + scrolledDownY;
        var xValue = e.pageX - parentOffset.left + scrolledDownX;
        lzm_chatDisplay.showContextMenu('events-list', event, xValue, yValue);
    }
};

EventConfiguration.prototype.createEventsListContextMenu = function(myObject) {
    var contextMenuHtml = '';
    contextMenuHtml += '<div onclick="showEventCreation(\'add\',\'\');"><span id="new-event" class="cm-line cm-click">' + tid('add') + '</span></div>';
    contextMenuHtml += '<div onclick="showEventCreation(\'edit\', \'' + myObject.eventid + '\');">' + '<span id="edit-event" class="cm-line cm-click">' + tid('edit') + '</span></div><hr />';
    contextMenuHtml += '<div onclick="deleteEvent(\'' + myObject.eventid + '\');"><span id="remove-event" class="cm-line cm-click">' + tid('remove') + '</span></div>';
    return contextMenuHtml;
};

EventConfiguration.__EditGoal = function(_goalId){

    var goalObj = {id:lzm_commonTools.RandomInt(100000,999999).toString(),conv:'0',title:'',desc:''};
    if(_goalId!=null)
        goalObj = lzm_commonTools.GetElementByProperty(DataEngine.global_configuration.database['goals'],'id',_goalId)[0];

    var dHtml = '<fieldset class="lzm-fieldset-full" style="width:400px;min-height:50px;"><legend>'+tid('goal')+'</legend>';
    dHtml += lzm_inputControls.createInput('goal-title', '', goalObj.title, tidc('title'), '', 'text', '');
    dHtml += '<div class="top-space">' + lzm_inputControls.createArea('goal-description', goalObj.desc, '', tidc('description')) + '</div>';
    dHtml += '<div class="top-space">' + lzm_inputControls.createCheckbox('goal-conversion', tid('conversion_rate'),goalObj.conv=='1') + '</div>';
    lzm_commonDialog.createAlertDialog(dHtml, [{id: 'goal-ok', name: tid('ok')}, {id: 'goal-cancel', name: tid('cancel')}],true,true,true);

    $('#alert-btn-goal-ok').click(function() {

        goalObj.desc = $('#goal-description').val();
        goalObj.title = $('#goal-title').val();
        goalObj.conv = $('#goal-conversion').prop('checked') ? '1' : '0';

        if(_goalId==null)
            DataEngine.global_configuration.database['goals'].push(goalObj);

        $('#event-placeholder-content-2').html(lzm_chatDisplay.EventConfiguration.createEventHtml(2));

        EventConfiguration.__SaveGoals();
        lzm_commonDialog.removeAlertDialog();
    });
    $('#alert-btn-goal-cancel').click(function() {
        lzm_commonDialog.removeAlertDialog();
    });

};

EventConfiguration.__RemoveGoal = function(_goalId){
    lzm_commonTools.RemoveElementByProperty(DataEngine.global_configuration.database['goals'],'id',_goalId);
    $('#event-placeholder-content-2').html(lzm_chatDisplay.EventConfiguration.createEventHtml(2));
    EventConfiguration.__SaveGoals();
};

EventConfiguration.__SaveGoals = function(){
    CommunicationEngine.pollServerSpecial(DataEngine.global_configuration.database['goals'], 'save-goals');
};








