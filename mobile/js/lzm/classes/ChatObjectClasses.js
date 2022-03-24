/****************************************************************************************
 * LiveZilla ChatObjectClasses.js
 *
 * Copyright 2017 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/


function Server(){}
Server.Time = 0;
Server.TimeAdjusted = 0;

Server.GetURL = function(){

    var thisServer = CommunicationEngine.chosenProfile.server_protocol + CommunicationEngine.chosenProfile.server_url;

    if(!thisServer.endsWith('/'))
        thisServer += '/';

    thisServer = thisServer.replace(':80/','/').replace(':443/','/');

    return thisServer;
};

function Client(){}
Client.Logs = [];
Client.TimeDifference = 0;
Client.TimeDifferenceArray = [];
Client.LoginTime = 0;

function ChatTimestampClass(timeDifference) {
    this.timeDifference = timeDifference * 1000;
}

ChatTimestampClass.prototype.setTimeDifference = function(timeDifference) {
    this.timeDifference = timeDifference * 1000;
};

ChatTimestampClass.prototype.getLocalTimeObject = function(timeStamp, doCalcTimeDiff) {
    timeStamp = (typeof timeStamp != 'undefined' && timeStamp != null) ? timeStamp : $.now();
    doCalcTimeDiff = (typeof doCalcTimeDiff != 'undefined') ? doCalcTimeDiff : false;
    var calculatedTimeStamp = (doCalcTimeDiff) ? parseInt(timeStamp) - parseInt(this.timeDifference) : parseInt(timeStamp);
    var tmpDateObject = new Date(calculatedTimeStamp);
    return tmpDateObject;
};

ChatTimestampClass.prototype.getServerTimeString = function(dateObject, doCalcTimeDiff, divideBy) {
    dateObject = (typeof dateObject != 'undefined' && dateObject != null) ? dateObject : new Date();
    doCalcTimeDiff = (typeof doCalcTimeDiff != 'undefined') ? doCalcTimeDiff : false;
    divideBy = (typeof divideBy != 'undefined') ? divideBy : 1000;
    var calculatedTimeString = (doCalcTimeDiff) ? dateObject.getTime() + parseInt(this.timeDifference) : dateObject.getTime();
    return Math.floor(calculatedTimeString / divideBy);
};

function LzmFilters() {
    this.idList = [];
    this.oldFilterIds = [];
    this.objects = {};
    this.initialRun = true;
}

LzmFilters.prototype.setFilter = function(filter) {
    if ($.inArray(filter.filterid, this.idList) == -1) {
        this.idList.push(filter.filterid);
    }
    this.objects[filter.filterid] = filter;

    if (typeof this.objects[filter.filterid] != 'undefined') {
        return this.objects[filter.filterid];
    } else {
        return null;
    }
};

LzmFilters.prototype.getFilter = function(filterId) {
    if ($.inArray(filterId, this.idList) != -1) {
        return lzm_commonTools.clone(this.objects[filterId]);
    } else {
        return null;
    }
};

LzmFilters.prototype.getFilterList = function() {
    var filterList = [];
    for (var i=0; i<this.idList.length; i++) {
        var thisFilter = this.getFilter(this.idList[i]);
        if (thisFilter != null) {
            filterList.push(thisFilter);
        }
    }
    return filterList;
};

LzmFilters.prototype.clearFilters = function() {
    this.idList = [];
    this.objects = {};
};

function LzmCustomInputs() {
    this.idList = [];
    this.objects = {};
    this.nameList = {};
}

LzmCustomInputs.prototype.setCustomInput = function(customInput) {
    var displayVisitor = true, displayTicket = true, displayArchive = true, displayAllChats = true;
    if ($.inArray(customInput.id, this.idList) == -1) {
        this.idList.push(customInput.id);
    }
    else
    {
        displayVisitor = this.objects[customInput.id].display.visitor;
        displayTicket = this.objects[customInput.id].display.ticket;
        displayArchive = this.objects[customInput.id].display.archive;
        displayAllChats = this.objects[customInput.id].display.allchats;
    }

    if (typeof customInput.value == 'string')
        customInput.value = this.parseInputValue(customInput.value);

    customInput.value.display = {visitor: displayVisitor, ticket: displayTicket, archive: displayArchive, allchats: displayAllChats};
    this.objects[customInput.id] = customInput.value;
    if (customInput.value.name != '')
        this.nameList[customInput.value.name] = customInput.id;

    if (typeof this.objects[customInput.id] != 'undefined')
        return this.objects[customInput.id];
    else
        return null;
};

LzmCustomInputs.prototype.copyCustomInput = function(customInput) {
    if ($.inArray(customInput.id, this.idList) == -1) {
        this.idList.push(customInput.id);
        this.objects[customInput.id] = customInput;
        this.nameList[customInput.value.name] = customInput.id;
    }
};

LzmCustomInputs.prototype.getCustomInput = function(id, searchBy, clone) {

    id = id.replace('f','');
    searchBy = (typeof searchBy != 'undefined') ? searchBy : 'id';
    clone = (d(clone)) ? clone : true;
    if (searchBy == 'id' && $.inArray(id, this.idList) != -1)
        return (clone) ? lzm_commonTools.clone(this.objects[id]) : this.objects[id];
    else if (searchBy == 'name' && typeof this.nameList[id] != 'undefined')
        return this.getCustomInput(this.nameList[id]);
    else
        return null;
};

LzmCustomInputs.prototype.IsFieldDataVisibleTo = function(_operatorId,_groupId){






};

LzmCustomInputs.prototype.getInputValueFromVisitor = function (inputId,visitor,maxLength,raw){

    raw = (d(raw)) ? raw : false;
    var obj, pairs = [],returnVal = '';

    if(visitor!=null)
    {
        for(var cid in visitor.d){
            obj ={};
            obj[cid] = visitor.d[cid];
            pairs.push(obj);
        }
    }
    else
        return '';

    for(var key in pairs)
        if(d(pairs[key][inputId.toString()]))
            returnVal = pairs[key][inputId.toString()];
        else if(d(pairs[key]["f"+inputId.toString()]))
            returnVal = pairs[key]["f" + inputId.toString()]

    if(d(maxLength) && maxLength != null && returnVal != null && returnVal.length>maxLength)
        returnVal = returnVal.substring(0, maxLength);

    if(inputId < 100)
    {
        var myCustomInput = DataEngine.inputList.getCustomInput(inputId.toString());
        if (myCustomInput.type == 'ComboBox' && d(myCustomInput.value[returnVal]) && !raw)
            returnVal = myCustomInput.value[returnVal];
        else if (myCustomInput.type == 'CheckBox' && !raw)
            returnVal = (returnVal == 1) ? t('Yes') : t('No');
    }

    if(raw)
        return returnVal;
    else
        return lzm_commonTools.htmlEntities(returnVal);
};

LzmCustomInputs.prototype.getReadableValue = function(myCustomInput, value, attachment){
    if(myCustomInput.type == 'ComboBox')
    {
        return myCustomInput.value[value];
    }
    else if(myCustomInput.type == 'CheckBox')
    {
        return (value.toString() == '1') ? tid('yes') : tid('no');
    }
    else if(myCustomInput.type == 'File' && d(attachment))
    {
        var dll,files,myDownloadLink ='', comma = '';
        if(value.indexOf('[') != -1 && value.indexOf(']') != -1)
            files = value.replace(/]/g,'').split('[');
        else
            files = [value.toString()];
        for(var key in files)
            for (var k=0; k<attachment.length; k++)
            {
                if (attachment[k].n == files[key])
                {
                    dll = getQrdDownloadUrl({rid: attachment[k].id, ti: attachment[k].n});
                    myDownloadLink += comma + '<a href="#" class="lz_chat_file_no_icon" onclick="downloadFile(\'' + dll + '\')">' + files[key] + '</a>';
                    comma = ', ';
                }
            }
        return (myDownloadLink.length) ? myDownloadLink : value;
    }
    return value;
};

LzmCustomInputs.prototype.getControlHTML = function(input,id,className,value,_showHeader){

    _showHeader = d(_showHeader) ? _showHeader : false;

    var header = _showHeader ? input.name+':' : '';

    if(input.type == 'CheckBox')
    {
        header = _showHeader ? input.name : '';
        return lzm_inputControls.createCheckbox(id,header,value.toString()=='1',className,'');
    }
    else if(input.type == 'ComboBox')
    {
        var opts = [];

        for(var key in input.value)
            opts.push({text:input.value[key],value:input.value[key]});

        return lzm_inputControls.createSelect(id,className,'',header,'','',input.name,opts,input.value[value],'');
    }
    else if(input.type == 'TextArea')
    {
        return lzm_inputControls.createArea(id,value,className,header,'height:200px;');
    }
    return lzm_inputControls.createInput(id,className,value,header, '', 'text', '');
};

LzmCustomInputs.prototype.getControlValue = function(input,id){

    var ctrl = $('#'+id);
    if(!ctrl.length)
        return '';
    if(input.type == 'CheckBox')
        return ctrl.prop('checked') ? '1' : '0';
    if(input.type == 'ComboBox')
        return ctrl.prop('selectedIndex').toString();
    else
        return ctrl.val();
};

LzmCustomInputs.prototype.getCustomInputList = function(type, onlyActive) {
    type = (typeof type != 'undefined') ? type : 'custom';
    onlyActive = (typeof onlyActive != 'undefined') ? onlyActive : false;
    var limit = (type == 'full') ? 2000000000 : 111;
    var customInputArray = [];
    for (var i=0; i<this.idList.length; i++) {
        if (parseInt(this.idList[i]) < limit) {
            if (!onlyActive || this.objects[this.idList[i]].active == 1) {
                customInputArray.push(lzm_commonTools.clone(this.objects[this.idList[i]]));
            }
        }
    }
    return customInputArray;
};

LzmCustomInputs.GetLocaleName = function(_input,_colon) {

    var key = _input.name.toLowerCase();
    var ke = lzm_t.KeyExists(key);
    if(ke)
        return (_colon) ? tidc(key) : tid(key);

    if(_colon && !lzm_commonTools.endsWith(key, ':'))
        return _input.name + ':';

    return _input.name;
};

LzmCustomInputs.GetDefaultInputList = function(){
    var defInputList = {};
    defInputList['111'] = {id: '111', title: '<strong><!--lang_client_your_name-->:</strong>', name: 'Name',type: 'Text', active: '1', cookie: '1', position: '1', value: '', info: '', val_a: '0', val_url: '', val_ti: 15, val_poe: '1'};
    defInputList['112'] = {id: '112', title: '<strong><!--lang_client_your_email-->:</strong>', name: 'Email',type: 'Text', active: '1', cookie: '1', position: '2', value: '', info: '', val_a: '0', val_url: '', val_ti: 15, val_poe: '1'};
    defInputList['113'] = {id: '113', title: '<strong><!--lang_client_your_company-->:</strong>', name: 'Company',type: 'Text', active: '0', cookie: '1', position: '3', value: '', info: '', val_a: '0', val_url: '', val_ti: 15, val_poe: '1'};
    defInputList['114'] = {id: '114', title: '<strong><!--lang_client_your_question-->:</strong>', name: 'Question',type: 'TextArea', active: '1', cookie: '0', position: '4', value: '', info: '', val_a: '0', val_url: '', val_ti: 15, val_poe: '1'};
    defInputList['116'] = {id: '116', title: '<strong><!--lang_client_your_phone-->:</strong>', name: 'Phone',type: 'Text', active: '0', cookie: '1', position: '5', value: '', info: '', val_a: '0', val_url: '', val_ti: 15, val_poe: '1'};
    defInputList['0'] = {id: '0', title: '', name: '',type: 'Text', active: '0', cookie: '1', position: '6', value: '', info: '', val_a: '0', val_url: '', val_ti: 15, val_poe: '1'};
    defInputList['1'] = {id: '1', title: '', name: '',type: 'Text', active: '0', cookie: '1', position: '7', value: '', info: '', val_a: '0', val_url: '', val_ti: 15, val_poe: '1'};
    defInputList['2'] = {id: '2', title: '', name: '',type: 'Text', active: '0', cookie: '1', position: '8', value: '', info: '', val_a: '0', val_url: '', val_ti: 15, val_poe: '1'};
    defInputList['3'] = {id: '3', title: '', name: '',type: 'Text', active: '0', cookie: '1', position: '9', value: '', info: '', val_a: '0', val_url: '', val_ti: 15, val_poe: '1'};
    defInputList['4'] = {id: '4', title: '', name: '',type: 'Text', active: '0', cookie: '1', position: '10', value: '', info: '', val_a: '0', val_url: '', val_ti: 15, val_poe: '1'};
    defInputList['5'] = {id: '5', title: '', name: '',type: 'Text', active: '0', cookie: '1', position: '11', value: '', info: '', val_a: '0', val_url: '', val_ti: 15, val_poe: '1'};
    defInputList['6'] = {id: '6', title: '', name: '',type: 'Text', active: '0', cookie: '1', position: '12', value: '', info: '', val_a: '0', val_url: '', val_ti: 15, val_poe: '1'};
    defInputList['7'] = {id: '7', title: '', name: '',type: 'Text', active: '0', cookie: '1', position: '13', value: '', info: '', val_a: '0', val_url: '', val_ti: 15, val_poe: '1'};
    defInputList['8'] = {id: '8', title: '', name: '',type: 'Text', active: '0', cookie: '1', position: '14', value: '', info: '', val_a: '0', val_url: '', val_ti: 15, val_poe: '1'};
    defInputList['9'] = {id: '9', title: '', name: '',type: 'Text', active: '0', cookie: '1', position: '15', value: '', info: '', val_a: '0', val_url: '', val_ti: 15, val_poe: '1'};
    return defInputList;
};

LzmCustomInputs.prototype.parseInputValue = function(value) {

    value = lz_global_base64_url_decode(value);
    value = lzm_commonTools.phpUnserialize(value);

    var customValue = value[7];
    if (value[3] == 'ComboBox')
        customValue = (value[7].indexOf(';') != -1) ? value[7].split(';') : [value[7]];
    var infoText = (value.length > 12) ? value[12] : '';
    var sc = (value.length > 13) ? value[13] : '0';
    var valueObject = {id: value[0], title: value[1], name: value[2],type: value[3], active: value[4], cookie: value[5], position: value[6], value: customValue, info: infoText, val_a: value[8], val_url: value[9], val_ti: value[10], val_poe: value[11],sc: sc};
    return valueObject;
};

LzmCustomInputs.prototype.getInputHtmlRow = function(inp) {
    var typeList = [{value:'Text',text:'Text'},{value:'TextArea',text:'TextArea'},{value:'CheckBox',text:'CheckBox'},{value:'ComboBox',text:'ComboBox'},{value:'File',text:'File'}];
    var posList = [];
    for(var i=1;i<16;i++)
        posList.push({value:i,text:i});
    var value = ($.isArray(inp.value)) ? inp.value.join(';') : inp.value;
    var className = inp.id == 114 ? 'ui-disabled' : '';
    var buttoncss = inp.val_a == '1' ? {background:'var(--red);'} : {};

    return '<tr id="inp_row_'+inp.id+'">' +
        '<td style="text-align:center;">'+inp.id+'</td>' +
        '<td style="text-align:center;">'+lzm_inputControls.createCheckbox('ia_' + inp.id,'',inp.active=='1')+'</td>' +
        '<td style="text-align:center;" class="'+className+'">'+lzm_inputControls.createCheckbox('ic_' + inp.id,'',inp.cookie=='1' && inp.id != 114)+'</td>' +
        '<td'+ ((inp.name == LzmCustomInputs.GetDefaultInputList()[inp.id].name && parseInt(inp.id)>=100) ? ' class="ui-disabled"' : '')+'>'+lzm_inputControls.createInput('in_' + inp.id, '', lzm_commonTools.htmlEntities(inp.name), '', '', 'text', '')+'</td>' +
        '<td'+ ((inp.type == LzmCustomInputs.GetDefaultInputList()[inp.id].type && parseInt(inp.id)>=100) ? ' class="ui-disabled"' : '')+'>'+lzm_inputControls.createSelect('ict_' + inp.id, 'input-type-select', '', '', {}, {}, '', typeList, inp.type, '')+'</td>' +
        '<td'+ ((inp.title == LzmCustomInputs.GetDefaultInputList()[inp.id].title && parseInt(inp.id)>=100) ? ' class="ui-disabled"' : '')+'>'+lzm_inputControls.createInput('icap_' + inp.id, '', lzm_commonTools.htmlEntities(inp.title), '', '', 'text', '')+'</td>' +
        '<td>'+lzm_inputControls.createInput('ii_' + inp.id, '', lzm_commonTools.htmlEntities(inp.info), '', '', 'text', '')+'</td>' +
        '<td>'+lzm_inputControls.createSelect('ip_' + inp.id, '', '', '', {}, {}, '', posList, inp.position, '')+'</td>' +
        '<td>'+lzm_inputControls.createInput('iv_' + inp.id, '', lzm_commonTools.htmlEntities(value), '', '', 'text', '')+lzm_inputControls.createCheckbox('isc_' + inp.id,'Screenshot',inp.sc=='1')+'</td>' +
        '<td id="ivalf_' + inp.id +'" style="text-align:center;">'+lzm_inputControls.createButton('ival_' + inp.id, '','ServerConfiguration.SetValidation(\''+inp.id+'\');', tid('validation'), '', '', buttoncss, '', '','d')+'</td>' +
        '</tr>';
};

LzmCustomInputs.prototype.applyInputHtmlRow = function(inp) {
    inp.active = $('#ia_' + inp.id).prop('checked') ? '1' : '0';
    inp.cookie = $('#ic_' + inp.id).prop('checked') ? '1' : '0';
    inp.name = $('#in_' + inp.id).val();

    if(inp.name.length > 32)
        inp.name = inp.name.substr(0,32);

    inp.type = $('#ict_' + inp.id).val();
    inp.title = $('#icap_' + inp.id).val();
    inp.info = $('#ii_' + inp.id).val();
    inp.sc = $('#isc_' + inp.id).prop('checked') ? '1' : '0';
    inp.position = $('#ip_' + inp.id).val();
    inp.value = $('#iv_' + inp.id).val();
    if(typeof $("#ival_" + inp.id).attr('data-val') != 'undefined')
    {
        var vinput = JSON.parse($("#ival_" + inp.id).attr('data-val'));
        inp.val_a = vinput.val_a;
        inp.val_url = vinput.val_url;
        inp.val_ti = vinput.val_ti;
        inp.val_poe = vinput.val_poe;
    }

};

LzmCustomInputs.prototype.phpSerializeInput = function(input) {
    var values = [];
    values.push(input.id);
    values.push(input.title);
    values.push(input.name);
    values.push(input.type);
    values.push(input.active);
    values.push(input.cookie);
    values.push(input.position);
    values.push(input.value);
    values.push(input.val_a);
    values.push(input.val_url);
    values.push(input.val_ti);
    values.push(input.val_poe);
    values.push(input.info);
    values.push(input.sc);
    return lz_global_base64_encode(lzm_commonTools.phpSerialize(values, true));
};

function OperatorManager() {
    this.idList = [];
    this.objects = {};
    this.uidList = {};
}

OperatorManager.DUTLastUpdate = 0;

OperatorManager.prototype.setOperator = function(operator) {

    if(!d(operator.name))
    {
        operator.name = operator.fn;
        if(operator.ln)
        {
            if(operator.name.length)
                operator.name += ' ';
            operator.name += operator.ln;
        }
    }

    if ($.inArray(operator.id, this.idList) == -1)
    {
        this.idList.push(operator.id);
    }
    else
    {
        if(this.objects[operator.id].status == '2' && operator.status != '2')
            NotificationManager.NotifyOperator(operator);
    }

    this.objects[operator.id] = operator;
    this.uidList[operator.userid] = operator.id;

    OperatorManager.DUTLastUpdate = Math.max(parseInt(operator.u),OperatorManager.DUTLastUpdate);

    if (d(this.objects[operator.id]))
    {
        return this.objects[operator.id];
    }
    else
    {
        return null;
    }
};

OperatorManager.prototype.copyOperator = function(operator) {
    if ($.inArray(operator.id, this.idList) == -1)
    {
        this.idList.push(operator.id);
    }
    try
    {
        this.objects[operator.id] = lzm_commonTools.clone(operator);
        this.uidList[operator.userid] = operator.id;
    }
    catch(ex)
    {
        deblog(ex);
    }
};

OperatorManager.prototype.setOperatorProperty = function(operatorId, myKey, myValue) {
    if (typeof this.objects[operatorId] != 'undefined')
    {
        this.objects[operatorId][myKey] = lzm_commonTools.clone(myValue);
        return lzm_commonTools.clone(this.objects[operatorId]);
    }
    return null;
};

OperatorManager.prototype.getOperator = function(operatorId, searchBy) {
    searchBy = (typeof searchBy != 'undefined') ? searchBy : 'id';
    if (searchBy == 'id' && $.inArray(operatorId, this.idList) != -1) {
        return lzm_commonTools.clone(this.objects[operatorId]);
    } else if (searchBy == 'name') {
        var resultList = [];
        for (var i=0; i<this.idList.length; i++) {
            if (this.getOperator(this.idList[i]).name == operatorId) {
                resultList.push(this.getOperator(this.idList[i]));
            }
        }
        return resultList;
    } else if(searchBy == 'uid' && typeof this.uidList[operatorId] != 'undefined') {
        return this.getOperator(this.uidList[operatorId]);
    } else {
        return null;
    }
};

OperatorManager.prototype.IsVisibleTo = function(_opVisible,_opTo) {

    var inSameGroup = false;
    var allGroupsAreInvisible = true;
    for(var key in _opVisible.groups)
    {
        var group = DataEngine.groups.getGroup(_opVisible.groups[key]);
        if(!(group != null && !d(group.members)))
            continue;
        for(var skey in _opTo.groups)
        {
            if(_opVisible.groups[key]==_opTo.groups[skey])
                inSameGroup = true;
            else
            {
                if($.inArray(_opVisible.groups[key], _opTo.groupsHidden) == -1)
                {
                    allGroupsAreInvisible = false;
                }
            }
        }
    }
    return inSameGroup || !allGroupsAreInvisible;
};

OperatorManager.prototype.removeOperator = function(operatorId) {
    var operator = this.getOperator(operatorId);
    if (operator != null) {
        var tmpArray = [];
        for (var i=0; i<this.idList.length; i++) {
            if (this.idList[i] != operatorId) {
                tmpArray.push(this.idList[i]);
            }
        }
        this.idList = tmpArray;
        var uid = operator.userid;
        delete this.objects[operatorId];
        delete this.uidList[uid];
    }
};

OperatorManager.prototype.clearOperators = function() {
    this.idList = [];
    this.objects = {};
    this.uidList = {};
};

OperatorManager.prototype.getOperatorList = function(sortCriteria, searchBy, showOfflineOperators, includeBots) {
    sortCriteria = (d(sortCriteria) && sortCriteria != '') ? sortCriteria : 'id';
    includeBots = (typeof includeBots != 'undefined') ? includeBots : true;
    var sortedOperatorList = [];

    for (var key in this.objects)
    {
        var o = this.objects[key];
        if(includeBots || typeof o.isbot == 'undefined' || o.isbot != 1)
            sortedOperatorList.push(o);
    }

    if(sortCriteria != '')
        sortedOperatorList.sort(function(a,b){
            if(!d(a.name) || !d(b.name))
                return 0;
            var x = a.name.toLowerCase();
            var y = b.name.toLowerCase();
            return x < y ? -1 : x > y ? 1 : 0;
        });

    return sortedOperatorList;
};

OperatorManager.prototype.setLogo = function(operatorId, logo) {
    this.objects[operatorId].logo = logo;
};

OperatorManager.prototype.getOperatorCount = function() {
    var that = this;
    var myOperators = that.getOperatorList('', '', true);
    return myOperators.length;
};

OperatorManager.prototype.GetActiveOperators = function(_exclude,_countBots,_includeBusy,_includeAway) {

    _countBots = (d(_countBots)) ? _countBots : false;
    _includeBusy = (d(_includeBusy)) ? _includeBusy : true;
    _includeAway = (d(_includeAway)) ? _includeAway : true;

    var list = [];
    for (var key in this.objects)
    {
        var op = this.objects[key];

        // offline mode not counted
        if(op.isbot == 1 && op.wm == 0)
            continue;

        if((op.isbot==0||_countBots) && $.inArray(op.id,_exclude) == -1 && op.status != '2')
            if(!(d(op.deac) && op.deac=='1'))
                if(op.status != '1' || _includeBusy)
                    if(op.status != '3' || _includeAway)
                        list.push(op);
    }
    return list;
};

OperatorManager.prototype.getAvailableOperators = function(_chatSystemId) {
    var that = this, myId = (typeof lzm_chatDisplay != 'undefined') ? lzm_chatDisplay.myId : '';
    var avOps = {'forward': [], fIdList: [], 'invite': [], iIdList: []};
    var operators = that.getOperatorList();
    var chatObj = DataEngine.ChatManager.GetChat(_chatSystemId);
    for (var i=0; i<operators.length; i++)
    {
        if (operators[i].id != myId && $.inArray(parseInt(operators[i].status), [0,1]) != -1 && operators[i].groups.length > operators[i].groupsAway.length)
        {
            avOps['forward'].push(operators[i]);
            avOps['fIdList'].push(operators[i].id);

            if (PermissionEngine.permissions.chats_join == 1 && (PermissionEngine.permissions.chats == 2 || (PermissionEngine.permissions.chats == 1 && chatObj != null && $.inArray(chatObj.dcg, operators[i].groups) != -1)))
            {
                avOps['invite'].push(operators[i]);
                avOps['iIdList'].push(operators[i].id);
            }
        }
    }
    return avOps;
};

OperatorManager.prototype.GetFieldMaskLevel = function(_fieldId, _category){

    _category = d(_category) ? _category : 'chat';

    var categoryKey = _category == 'chat'? 'ci_masked' : 'ti_masked';
    var maskLvl = 0;
    this.getOperator(DataEngine.myId).groups.forEach(function(_groupName){
        DataEngine.groups.getGroup(_groupName).f.forEach(function(_inputField){
            if(_inputField.key === categoryKey){
                for (var k=0; k<_inputField.values.length; k++) {
                    if (_inputField.values[k].key === _fieldId) {
                        maskLvl = Math.max(maskLvl, parseInt(_inputField.values[k].text));
                    }
                }
            }
        });
    });
    return maskLvl;
};

OperatorManager.GetOperatorName = function(_id) {
    var op = DataEngine.operators.getOperator(_id);
    if(op != null)
        return op.name;
    return _id;
};

OperatorManager.GetAllLanguages = function(_iso) {
    var langs,key,lkey,list = [];

    for(key in DataEngine.operators.objects)
    {
        var op = DataEngine.operators.objects[key];
        if(d(op.lang))
        {
            langs = op.lang.toLowerCase().split(',');
            for(lkey in langs)
            {
                var value = langs[lkey];

                if(!_iso)
                    value = ChatTranslationEditorClass.IsoToName(value);

                if(d(value[0]))
                    if($.inArray(value[0],list) == -1)
                        list.push(value[0]);
            }
        }
    }
    return list;
};

OperatorManager.GetAllLocations = function() {
    var locas,key,lkey,list = [];

    for(key in DataEngine.operators.objects)
    {
        var op = DataEngine.operators.objects[key];
        if(d(op.loca))
        {
            locas = op.loca.split(',');
            for(lkey in locas)
            {
                var value = locas[lkey];

                if(value.length)
                    if($.inArray(value,list) == -1)
                        list.push(value);
            }
        }
    }
    return list;
};

OperatorManager.GetAllSkills = function(_getCounts) {
    var skills,key,lkey,list = [];

    for(key in DataEngine.operators.objects)
    {
        var op = DataEngine.operators.objects[key];
        if(d(op.skils))
        {
            skills = op.skils.split(',');
            for(lkey in skills)
            {
                var value = skills[lkey];

                if($.inArray(value,list) == -1)
                    list.push(value);
            }
        }
    }
    return list;
};

function ChatPostController(){
    this.previousMessageSender='';
    this.previousMessageRepost=1;
    this.previousAddMessageStyle=1;
    this.previousMessageTimestamp = 0;
    this.chatObj=null;
    this.postObj = null;
    this.html = '';
}

function GroupManager() {
    this.idList = [];
    this.objects = {};
    this.oldGroupMembers = {};
}

GroupManager.prototype.setGroup = function(group) {
    if ($.inArray(group.id, this.idList) == -1)
    {
        this.idList.push(group.id);
    }
    this.objects[group.id] = group;
    if (typeof group.members != 'undefined' && typeof DataEngine != 'undefined')
    {
        if (typeof this.oldGroupMembers[group.id] == 'undefined')
        {
            this.oldGroupMembers[group.id] = group.members;
        }

        var i, j, oldGroupMemberId, operator, userName;
        var visitorChat = null;
        var groupChat = DataEngine.ChatManager.GetChat(group.id);

        try
        {
            for (i=0; i<group.members.length; i++)
            {
                var memberHasJoined = true;
                userName = "";
                for (j=0; j<this.oldGroupMembers[group.id].length; j++)
                {
                    oldGroupMemberId = this.oldGroupMembers[group.id][j].i;
                    if (oldGroupMemberId == group.members[i].i) {
                        memberHasJoined = false;
                    }
                }
                if (memberHasJoined)
                {
                    operator = DataEngine.operators.getOperator(group.members[i].i);
                    visitorChat = DataEngine.ChatManager.GetChat(group.members[i].i);

                    if(operator == null)
                    {
                        try
                        {
                            userName = visitorChat.GetName();
                        }
                        catch(e)
                        {
                            return false;
                        }
                    }
                    else
                        userName = operator.name;

                    if (groupChat != null)
                    {
                        addJoinedMessageToChat(group.id, userName, group.name);
                    }
                    else if (group.members[i].i == DataEngine.myId)
                    {
                        OpenChatWindow(group.id);
                        addJoinedMessageToChat(group.id, userName, group.name);
                    }
                }
            }
        }
        catch(e)
        {
            deblog(e);
        }

        try
        {
            for (i=0; i<this.oldGroupMembers[group.id].length; i++)
            {
                oldGroupMemberId = this.oldGroupMembers[group.id][i].i;
                var membersHasLeft = true;
                for (j=0; j<group.members.length; j++)
                {
                    if (group.members[j].i == oldGroupMemberId)
                    {
                        membersHasLeft = false;
                    }
                }
                if (membersHasLeft)
                {
                    operator = DataEngine.operators.getOperator(oldGroupMemberId);
                    visitorChat = DataEngine.ChatManager.GetChat(oldGroupMemberId);

                    if(operator == null)
                    {
                        try
                        {
                            userName = visitorChat.GetName();
                        }
                        catch(e)
                        {
                            return false;
                        }
                    }
                    else
                        userName = operator.name;

                    if (groupChat != null)
                    {
                        addLeftMessageToChat(groupChat, userName, group.name);

                        var groupChatObj = DataEngine.ChatManager.GetChat(group.id);

                        if(groupChatObj != null)
                        {
                            if(visitorChat != null && visitorChat.IsMember(DataEngine.myId) && visitorChat.IsHost(DataEngine.myId))
                            {
                                visitorChat.WasInPublicChatGroup = true;
                                groupChatObj.CloseChatWindow();
                                visitorChat.OpenChatWindow();
                            }
                            else if(operator != null && operator.id == lzm_chatDisplay.myId)
                            {
                                groupChatObj.CloseChatWindow();
                                showAllchatsList(true);
                            }
                        }
                    }
                }
            }
        }
        catch(e)
        {
            deblog(e);
        }

        this.oldGroupMembers[group.id] = lzm_commonTools.clone(group.members);
    }
    else
    {
        // standard groups
        if(!d(group.name))
            group.name = '';
    }

    if (typeof this.objects[group.id] != 'undefined')
    {
        return this.objects[group.id];
    }
    else
    {
        return null;
    }

};

GroupManager.prototype.copyGroup = function(group) {

    if ($.inArray(group.id, this.idList) == -1) {
        this.idList.push(group.id);
    }
    this.objects[group.id] = lzm_commonTools.clone(group);
    try {
        this.oldGroupMembers[group.id] = lzm_commonTools.clone(group.members);
    } catch(ex) {
        this.oldGroupMembers[group.id] = [];
    }
};

GroupManager.prototype.getGroup = function(groupId,clone) {
    clone = (d(clone)) ? clone : true;
    if ($.inArray(groupId, this.idList) != -1)
        return (clone) ? lzm_commonTools.clone(this.objects[groupId]) : this.objects[groupId];
    else
        return null;
};

GroupManager.prototype.isChatGroup = function(groupId){
    var group = this.getGroup(groupId);
    return (group != null && typeof group.members != 'undefined');
};

GroupManager.prototype.removeGroup = function(groupId, doErase) {
    doErase = (typeof doErase != 'undefined') ? doErase : false;
    if (!doErase) {
        if (typeof this.objects[groupId] != 'undefined') {
            this.objects[groupId].is_active = false;
        }
    } else {
        var tmpArray = [];
        for (var i=0; i<this.idList.length; i++) {
            if (this.idList[i] != groupId) {
                tmpArray.push(this.idList[i]);
            }
        }
        this.idList = tmpArray;
        delete this.objects[groupId];
        delete this.oldGroupMembers[groupId];
    }
};

GroupManager.prototype.clearGroups = function() {
    var i = 0;
    for (i=0; i<this.idList.length; i++) {
        this.objects[this.idList[i]].is_active = false;
    }
    var tmpArray = [];
    for (i=0; i<this.idList.length; i++) {
        var group = this.getGroup(this.idList[i]);
        if (group != null && typeof group.i != 'undefined') {
            tmpArray.push(this.idList[i]);
        } else {
            delete this.objects[this.idList[i]];
            delete this.oldGroupMembers[this.idList[i]];
        }
    }
    this.idList = tmpArray;
};

GroupManager.prototype.getGroupList = function(sortCriteria, showInactiveGroups, showDynamicGroups, showOfflineGroups) {

    sortCriteria = (d(sortCriteria) && sortCriteria != '') ? sortCriteria : 'id';
    showInactiveGroups = (typeof showInactiveGroups != 'undefined') ? showInactiveGroups : true;
    showDynamicGroups = (typeof showDynamicGroups != 'undefined') ? showDynamicGroups : false;
    showOfflineGroups = (typeof showOfflineGroups != 'undefined') ? showOfflineGroups : true;

    var sortedGroupList = [];

    for (var key in this.objects)
    {
        var g = this.objects[key];
        if ((showInactiveGroups || g.is_active) && (showDynamicGroups || typeof g.members == 'undefined'))
        {
            if(!showOfflineGroups)
            {
                var foundOnlineOp = false;
                for(var okey in DataEngine.operators.objects)
                {
                    var op = DataEngine.operators.objects[okey];
                    if(op.status < 2 && !op.isbot)
                    {
                        if($.inArray(g.id, op.groupsAway) == -1 && $.inArray(g.id, op.groups) != -1)
                        {
                            foundOnlineOp = true;
                            break;
                        }
                    }
                }
                if(!foundOnlineOp)
                    continue;
            }
            sortedGroupList.push(g);
        }
    }

    if(sortCriteria != '')
        sortedGroupList.sort(function(a,b){
            var x = a.name.toLowerCase();
            var y = b.name.toLowerCase();
            return x < y ? -1 : x > y ? 1 : 0;
        });

    return sortedGroupList;
};

GroupManager.prototype.setGroupProperty = function(groupId, property, value) {
    var rt = null;
    try {
    if (typeof this.objects[groupId] != 'undefined') {
        this.objects[groupId][property] = lzm_commonTools.clone(value);
        rt = lzm_commonTools.clone(this.objects[groupId]);
    }
    } catch(ex) {}
    return rt;
};

GroupManager.prototype.getGroupCount = function() {
    var that = this;
    var myGroups = that.getGroupList('', true, false);
    var groupCount = myGroups.length;
    return groupCount;
};

GroupManager.GetGroupTitle = function(_group,_languageISO){

    _languageISO = _languageISO.toString().toLowerCase();

    if(d(_group.humanReadableDescription[_languageISO]))
        return _group.humanReadableDescription[_languageISO];

    if(d(_group.name))
        return _group.name;
    else
        return _group.id;
};

function LzmResources() {
    this.idList = [];
    this.objects = {};
}

LzmResources.prototype.setResource = function(resource) {
    if ($.inArray(resource.rid, this.idList) == -1) {
        this.idList.push(resource.rid);
    }

    resource.usage_counter = 0;
    KnowledgebaseUI.ReplaceTitle(resource);

    this.objects[resource.rid] = resource;
};

LzmResources.prototype.getResource = function(resourceId) {
    if (typeof this.objects[resourceId] != 'undefined')
        return lzm_commonTools.clone(this.objects[resourceId]);
    else
        return null;
};

LzmResources.prototype.GetResourceList = function(sortCriteria, searchBy) {

    searchBy = (d(searchBy)) ? searchBy : null;
    var add,sortedResourceList = [];
    for (var key in this.objects)
    {
        add = false;
        if(searchBy != null)
        {
            if(!d(searchBy.ty) || $.inArray(this.objects[key].ty, searchBy.ty.split(',')) != -1)
            {
                if(d(searchBy.t) && this.objects[key].t.toLowerCase().indexOf(searchBy.t.toLowerCase()) != -1)
                {

                    add = true;
                }
                else if(d(searchBy.ti) && this.objects[key].ti.toLowerCase().indexOf(searchBy.ti.toLowerCase()) != -1)
                {
                    add = true;
                }
                else if(d(searchBy.s) && searchBy.s != '/' && ('/' + this.objects[key].s).toLowerCase().indexOf(searchBy.s.toLowerCase()) != -1)
                {
                    add = true;
                }
                else if (d(searchBy.text) && this.objects[key].ty != 3 && this.objects[key].ty != 4)
                {
                    var qrdText = this.objects[key].text.toLowerCase().replace(/<.*?>/g, '');
                    if (qrdText.indexOf(searchBy.text.toLowerCase()) != -1)
                    {
                        add = true;
                    }
                }
            }
        }
        else
            add = true;

        if(add)
            sortedResourceList.push(this.objects[key]);
    }

    try
    {
        sortedResourceList.sort(function(a,b)
        {
            // sort by title
            var x = a.ti.toLowerCase();
            var y = b.ti.toLowerCase();

            if(!d(a.ok))
                a.ok = '0';
            if(!d(b.ok))
                b.ok = '0';

            if(a.ok != b.ok)
            {
                // sort by order key
                x = parseInt(a.ok);
                y = parseInt(b.ok);
            }

            if(sortCriteria == 'usage_counter')
            {
                x = d(a.usage_counter) ? a.usage_counter : 0;
                y = d(b.usage_counter) ? b.usage_counter : 0;
            }
            return x < y ? -1 : x > y ? 1 : 0;
        });
    }
    catch(ex)
    {
        deblog(ex);
    }

    return sortedResourceList;
};

LzmResources.prototype.removeResource = function(resourceId) {
    if (typeof this.objects[resourceId] != 'undefined') {
        var tmpArray = [];
        for (var i=0; i<this.idList.length; i++) {
            if (this.idList[i] != resourceId) {
                tmpArray.push(this.idList[i]);
            }
        }
        this.idList = tmpArray;
        delete this.objects[resourceId];
    }
};

LzmResources.prototype.riseUsageCounter = function(resourceId) {
    /*
    if (typeof this.objects[resourceId] != 'undefined')
    {
        this.objects[resourceId]['usage_counter']++;
    }
    */
};

function LzmReports() {
    this.idList = [];
    this.objects = {};
    this.totalReports = 0;
    this.matchingReports = 0;
    this.reportsPerPage = 20;
}

LzmReports.prototype.setReport = function(report) {
    try {
        this.idList.push(report.i);
        this.objects[report.i] = report;
    } catch(ex) {}
};

LzmReports.prototype.getReport = function (reportId) {
    if (typeof this.objects[reportId] != 'undefined') {
        return lzm_commonTools.clone(this.objects[reportId]);
    } else {
        return null;
    }
};

LzmReports.prototype.getReportList = function() {
    var reportList = [];
    for (var i=0; i<this.idList.length; i++) {
        reportList.push(lzm_commonTools.clone(this.objects[this.idList[i]]));
    }
    return reportList;
};

LzmReports.prototype.clearReports = function() {
    this.idList = [];
    this.objects = {};
};

LzmReports.prototype.setTotal = function(number) {
    this.totalReports = parseInt(number);
};

LzmReports.prototype.getTotal = function() {
    return this.totalReports;
};

LzmReports.prototype.setMatching = function(number) {
    this.matchingReports = parseInt(number);
};

LzmReports.prototype.getMatching = function() {
    return this.matchingReports;
};

LzmReports.prototype.setReportsPerPage = function(number) {
    this.reportsPerPage = parseInt(number);
};

LzmReports.prototype.getReportsPerPage = function() {
    return this.reportsPerPage;
};

function Ticket(){

}

Ticket.Open = 0;
Ticket.InProgress = 1;
Ticket.Closed = 2;
Ticket.Deleted = 3;
Ticket.Pending = 4;

Ticket.GetRootMessage = function(_ticket){

    if(_ticket ==  null)
        return null;

    var ct = 2147483647;
    var rootselector = 0;

    for(var key in _ticket.messages)
    {
        if(_ticket.messages[key].ct < ct)
        {
            ct = _ticket.messages[key].ct;
            rootselector = key;
        }
    }

    if(d(_ticket.messages))
        return _ticket.messages[rootselector];

    //if(_ticket != null && d(_ticket.messages) && _ticket.messages.length)
      //  return _ticket.messages[0];
    return null;
};

function Chat(_copy){

    this.Logs = [];
    this.Members = [];
    this.PreviousMembers = [];
    this.Browser = null;
    this.Visitor = null;
    this.SystemId = null;
    this.Messages = [];
    this.Type = Chat.Visitor;
    this.IsWindowOpen = false;
    this.IndicateTyping = false;
    this.IsUnread = true;
    this.NotificationsSent = false;
    this.AutoAcceptMessage = null;
    this.AutoForwardCountdown = null;
    this.AutoForwardTarget = null;
    this.AutoForwardTimeLeft = -1;
    this.AcceptInitiated = false;
    this.WasInPublicChatGroup = false;

    if(d(_copy))
        this.CopyFrom(_copy);
}

Chat.Visitor = 0;
Chat.Operator = 1;
Chat.ChatGroup = 2;
Chat.Open = 0;
Chat.Queue = 1;
Chat.Active = 2;
Chat.Closed = 3;
Chat.StatusHost = 0;
Chat.StatusFollower = 1;
Chat.StatusFollowerInvisible = 2;

Chat.prototype.IsActive = function(){
    return (this.ai=='1' && this.ai=='1');
};

Chat.prototype.SetUnread = function(_status){

    if(!CommonUIClass.WindowHasFocus() && !_status)
        return;

    this.IsUnread = _status;
};

Chat.prototype.IsAccepted = function(){
    return this.IsActive();
};

Chat.prototype.GetStatus = function(){
    if(this.c=='1' || this.IsDeclined())
        return Chat.Closed;
    if(this.ai=='1')
        return Chat.Active;
    if(this.w=='1')
        return Chat.Queue;
    else
        return Chat.Open;
};

Chat.prototype.ClosedBy = function(){
    if(this.ce=='1')
        return Chat.Visitor;
    else if(this.ci=='1')
        return Chat.Operator;
    else
        return -1;
};

Chat.prototype.AddMessage = function(_messageObj,_openTab){

    if(!lzm_commonTools.GetElementByProperty(this.Messages,'id',_messageObj.id).length)
    {
        if(!d(_messageObj.Formatted))
            _messageObj = Chat.FormatPost(_messageObj);

        _openTab = d(_openTab) ? _openTab : true;
        this.Messages.push(_messageObj);

        if(_openTab && this.GetStatus() != Chat.Queue)
            this.OpenChatWindow();

        this.SetUnread(true);

        var settingsExist = d(lzm_chatDisplay.chatTranslations[this.GetFullId()]);

        if (d(_messageObj.triso) && _messageObj.triso != '' && _messageObj.sen.indexOf('~') != -1)
        {
            var i,userLang = '', shortUserLang = '';
            for (i=0; i<lzm_chatDisplay.translationLanguages.length; i++)
            {
                if (lzm_chatDisplay.translationLanguages[i].language == DataEngine.userLanguage)
                    userLang = DataEngine.userLanguage;
                if (lzm_chatDisplay.translationLanguages[i].language == DataEngine.userLanguage.split('-')[0])
                    shortUserLang = DataEngine.userLanguage.split('-')[0];
            }
            userLang = (userLang != '') ? userLang : shortUserLang;
            var tmm = {translate: false, sourceLanguage: userLang, targetLanguage: userLang};
            var tvm = {translate: false, sourceLanguage: userLang, targetLanguage: userLang};
            if (!settingsExist)
            {
                lzm_chatDisplay.chatTranslations[this.GetFullId()] = {
                    tmm: tmm,
                    tvm: tvm
                };
            }
            lzm_chatDisplay.chatTranslations[this.GetFullId()].tvm.translate = true;
            lzm_chatDisplay.chatTranslations[this.GetFullId()].tvm.sourceLanguage = _messageObj.triso;
            lzm_chatDisplay.UpdateTranslateButtonUI(this.GetFullId());
        }
        else if(_messageObj.sen.indexOf('~') != -1 && settingsExist && lzm_chatDisplay.chatTranslations[this.GetFullId()].tvm.translate)
        {
            lzm_chatDisplay.chatTranslations[this.GetFullId()].tvm.translate = false;
            lzm_chatDisplay.UpdateTranslateButtonUI(this.GetFullId());
        }
    }
};

Chat.prototype.IsMissed = function(){
    return (this.ai!='1' && this.GetStatus()==Chat.Closed);
};

Chat.prototype.IsMember = function(_userId){
    if(this.IsChatGroup())
    {
        var group = DataEngine.groups.getGroup(this.SystemId);
        return lzm_commonTools.GetElementByProperty(group.members,'i',_userId).length>0;
    }
    else
    {
        for(var key in this.Members)
            if(_userId == this.Members[key].i && this.Members[key].d=='0')
                return true;
    }
    return false;
};

Chat.prototype.IsHiddenMember = function(_operatorId){
    return false;
    /*
    for(var key in this.Members)
        if(_operatorId == this.Members[key].i && this.Members[key].s == Chat.StatusFollowerInvisible)
            return true;
    return false;
    */
};

Chat.prototype.HasDeclined = function(_operatorId){
    for(var key in this.Members)
        if(_operatorId == this.Members[key].i && this.Members[key].d=='1')
            return true;
    return false;
};

Chat.prototype.GetMember = function(_operatorId){
    for(var key in this.Members)
        if(_operatorId == this.Members[key].i)
            return this.Members[key];
    return null;
};

Chat.prototype.GetMemberStatus = function(_operatorId){
    for(var key in this.Members)
        if(_operatorId == this.Members[key].i)
            return this.Members[key].s;
    return -1;
};

Chat.prototype.GetOperatorsLeft = function(){
    var left = [];
    for(var key in this.Members)
        if(this.Members[key].d != '1' && this.Members[key].s != Chat.StatusFollowerInvisible)
            left.push(this.Members[key]);
    return left;
};

Chat.prototype.IsDeclined = function(){
    if(this.di=='1')
        return true;
    for(var key in this.Members)
        if(this.Members[key].d != '1' && this.Members[key].s != Chat.StatusFollowerInvisible)
            return false;
    return (this.Members).length>0;
};

Chat.prototype.IsBotChat = function(){
    for(var key in this.Members)
    {
        var op = DataEngine.operators.getOperator(this.Members[key].i);
        if(op != null && op.isbot=='1')
            return true;
    }
    return false;
};

Chat.prototype.GetChatGroup = function(){
    var groups = DataEngine.groups.getGroupList('name',false,true);
    for(var key in groups)
    {
        var group = groups[key];
        if(d(group.members) && lzm_commonTools.GetElementByProperty(group.members,'i',this.SystemId).length)
        {
            return group;
        }
    }
    return null;
};

Chat.prototype.IsChatGroup = function(){
    var group = DataEngine.groups.getGroup(this.SystemId);
    return (group != null && d(group.members));
};

Chat.prototype.IsHost = function(_operatorId){
    if(this.Members.length>0)
        if(_operatorId == this.Members[0].i && this.Members[0].d=='0' && this.Members[0].s == Chat.StatusHost)
            return true;
    return false;
};

Chat.prototype.GetName = function(_maxlength,_raw){

    var name = '';
    _maxlength = (d(_maxlength)) ? _maxlength : 1024;
    _raw = (d(_raw)) ? _raw : false;

    if(this.Type==Chat.Visitor)
    {
        name = DataEngine.inputList.getInputValueFromVisitor(111,this.Visitor,_maxlength,_raw);
        if(!name.length && this.Visitor)
        {
            name = this.Visitor.unique_name;
        }
    }
    else if(this.Type==Chat.ChatGroup)
    {
        if(this.SystemId=="everyoneintern")
            name = tid('all_operators');
        else
        {
            name = DataEngine.groups.getGroup(this.SystemId).name;

            if(!d(name))
                name = DataEngine.groups.getGroup(this.SystemId).id;

        }
    }
    else if(this.Type==Chat.Operator)
        name = DataEngine.operators.getOperator(this.SystemId).name;

    return name;
};

Chat.prototype.GetFullId = function(){
    return this.v + '~' + this.b + '~' + this.i;
};

Chat.prototype.CopyFrom = function(_copyChat){
    for(var key in _copyChat)
        if(typeof _copyChat[key] !== 'function')
            this[key] = lzm_commonTools.clone(_copyChat[key]);
};

Chat.prototype.UpdateMembers = function(_newMemberList){
    for(var key in this.Members)
        if(!lzm_commonTools.GetElementByProperty(this.PreviousMembers,'i',this.Members[key].i).length && !lzm_commonTools.GetElementByProperty(_newMemberList,'i',this.Members[key].i).length)
            this.PreviousMembers.push(lzm_commonTools.clone(this.Members[key]));
    this.Members = _newMemberList;
};

Chat.prototype.OpenChatWindow = function(_maximize){

    if(!this.IsWindowOpen && this.Type == Chat.Visitor && this.GetMember(DataEngine.myId) == null && !this.IsChatGroup())
        return;
    if(!this.IsWindowOpen && this.Type == Chat.Visitor && this.GetStatus() == Chat.Closed)
        return;

    this.IsWindowOpen = (this.GetChatGroup()==null||this.Type!=Chat.Visitor);

    _maximize = (d(_maximize)) ? _maximize : false;

    var winObj = TaskBarManager.GetWindow(this.GetWindowId());
    if(winObj == null)
        DataEngine.ChatManager.CreateChatWindow(this,!_maximize);
    else if(_maximize)
        winObj.Maximize();
};

Chat.prototype.CloseChatWindow = function(){

};

Chat.prototype.CanPreview = function (_memberId){
    if(this.IsMember(_memberId) || this.GetStatus() == Chat.Queue || this.GetStatus() == Chat.Open || this.IsMissed())
        return true;

    if(!PermissionEngine.checkUserPermissions(_memberId, 'chats', 'join_invisible', {}))
        return false;

    return true;
};

Chat.prototype.GetAvatarObject = function (){
    if(!LocalConfiguration.UIShowAvatars)
        return '';
    if(this.Type != Chat.Visitor)
        return '<div style="background-image: url(\'./../picture.php?operator='+encodeURIComponent(this.SystemId)+'\');"></div>';
    else
        return '<div style="background-image: url(\'./../picture.php?name='+lz_global_base64_url_encode(this.GetName())+'\');"></div>';
};

Chat.prototype.GetWindowId = function (){
    return md5(this.SystemId);
};

Chat.prototype.GetVisibleOperatorCount = function(){

    var count = 0;
    for(var i = 0;i<this.Members.length;i++)
    {
        var membId = (typeof this.Members[i].i != 'undefined') ? this.Members[i].i : this.Members[i].id;
        var hasDeclined = (typeof this.Members[i].d != 'undefined' && this.Members[i].d=='1');
        var isInv = false;//(typeof this.Members[i].s != 'undefined' && this.Members[i].s == '2');
        var isHidden = (isInv && membId != DataEngine.myId);

        if(!isInv && !isHidden && !hasDeclined)
            count++;
    }
    return count;
};

Chat.prototype.GetOperatorNameList = function(){
    var opList = [];
    for (var i=0; i<this.Members.length; i++) {
        var operator = DataEngine.operators.getOperator(this.Members[i].i);
        if (operator != null /*&& this.Members[i].s != 2*/ && this.Members[i].d != 1)
            opList.push(operator.name);
    }
    var dcpName = (DataEngine.operators.getOperator(this.dcp) != null) ? DataEngine.operators.getOperator(this.dcp).name : '';
    return (opList.length > 0) ? opList.join(', ') : (dcpName != '') ? dcpName : '';
};

Chat.prototype.GetWaitingTime = function(){

    var missed = this.IsMissed();
    var closed = this.GetStatus()==Chat.Closed;
    var waitingTime = 0, exitTime = this.e;

    if(this.e == 0 && this.l > 0)
        exitTime = this.l;

    if(missed)
        waitingTime = exitTime - this.f;
    else if(closed || this.IsAccepted())
        waitingTime = this.a - this.f;
    else
        waitingTime = lzm_chatTimeStamp.getServerTimeString(null, true, 1000) - this.f;

    return waitingTime;
};

Chat.FormatPost = function(_post){

    var tmpdate = lzm_chatTimeStamp.getLocalTimeObject(_post.date * 1000, true);
    _post.date_human = lzm_commonTools.getHumanDate(tmpdate, 'date', DataEngine.userLanguage);
    _post.time_human = lzm_commonTools.getHumanDate(tmpdate, 'time', DataEngine.userLanguage);
    _post.dateObject = {
        day: lzm_commonTools.pad(tmpdate.getDate(), 2),
        month: lzm_commonTools.pad((tmpdate.getMonth() + 1), 2),
        year: lzm_commonTools.pad(tmpdate.getFullYear() ,4)
    };

    tmpdate = lzm_chatTimeStamp.getLocalTimeObject();
    var currentDateObject = {
        day:lzm_commonTools.pad(tmpdate.getDate(), 2),
        month:lzm_commonTools.pad((tmpdate.getMonth() + 1), 2),
        year:lzm_commonTools.pad(tmpdate.getFullYear() ,4)
    };
    if(_post.dateObject.year != currentDateObject.year || _post.dateObject.month != currentDateObject.month || _post.dateObject.day != currentDateObject.day)
        _post.time_human = _post.date_human + '&nbsp;' + _post.time_human;

    if(!d(_post.m))
        _post.m = lz_global_microstamp();

    while(_post.m.length < 10)
        _post.m = '0' + _post.m;

    _post.mtime = _post.date + "_" + _post.m;
    _post.Formatted = true;

    return _post;
};

Chat.ProcessPostCommands = function(_post){

    if(_post.text.indexOf('[__[') !== -1 && _post.text.indexOf(']__]') !== -1)
    {
        var url,res,fileId,chatId,chatObj,parts = _post.text.replace(']__]','').split('[__[');

        _post.textOriginal =
        _post.text = parts[0];

        if(parts[1].startsWith('file:'))
        {
            fileId = parts[1].replace('file:','');
            res = {ti:_post.text,rid:fileId};
            url = getQrdDownloadUrl(res);

            _post.textOriginal =
            _post.text = '<a target="_blank" href="'+url+'">' + res.ti + '</a>';
            _post.warn = true;
        }
        else if(parts[1].startsWith('screenshot:'))
        {
            fileId = parts[1].replace('screenshot:','');
            res = {ti:_post.text,rid:fileId};
            url = getQrdDownloadUrl(res);

            _post.textOriginal =
                _post.text = '<a target="_blank" href="'+url+'">' + tid('screenshot') + ' ' + _post.date.substr(_post.date.length-4, 4) + '</a>';
            _post.warn = true;
        }
        else if(parts[1].startsWith('invite_info:'))
        {
            chatId = parts[1].replace('invite_info:','');
            showInvitedMessage(chatId,_post.sen_id,_post.text);
            return null;
        }
        else if(parts[1].startsWith('forward_info:'))
        {
            _post.textOriginal =
            _post.text = '<i>'+_post.text+'</i>';

            chatId = parts[1].replace('forward_info:','');
            _post.warn = true;
            chatObj = DataEngine.ChatManager.GetChat(chatId,'i');
            if(chatObj != null)
            {
                _post.rec = chatObj.SystemId;
                _post.reco = chatObj.SystemId;
            }
        }
        else if(parts[1].startsWith('auto_forward:'))
        {
            chatId = parts[1].replace('auto_forward:','');
            chatObj = DataEngine.ChatManager.GetChat(chatId,'i');
            if(chatObj.AutoForwardCountdown == null)
            {
                chatObj.AutoForwardTimeLeft = 5;
                chatObj.AutoForwardCountdown = setInterval(function(){lzm_chatDisplay.UpdateAutoForwardUI(chatObj,true);},1000);
                chatObj.AutoForwardTarget = _post.text;
            }
            return null;
        }
    }
    return _post;
};

Chat.RemovePostsCommands = function(_container){
    $('#' + _container + ' div').each(function(){
        var post = {text:$(this).html()};
        if(post.text.length<300)
        {
            var mpost = Chat.ProcessPostCommands(lzm_commonTools.clone(post));
            if(mpost != null && post != null && mpost.text != post.text)
                $(this).html(mpost.text);
        }
    });
};

Chat.ParseDates = function(_container){
    $('#' + _container + ' .CMTD').each(function(){
        var c = $(this).html();
        if(c.indexOf('<!--stime_') != -1)
        {
            c = c.replace('<!--notifier-->','');
            c = parseInt(c.replace('<!--stime_','').replace('-->',''));
            $(this).html(lzm_commonTools.getHumanDate(lzm_chatTimeStamp.getLocalTimeObject(parseInt(c) * 1000, true), '', lzm_chatDisplay.userLanguage));
        }
    });
};

Chat.CreateTicket = function(_chatId, _createIfNotFound){

    _createIfNotFound = (d(_createIfNotFound)) ? _createIfNotFound : true;

    var chatObj = null;
    var fromArchive = lzm_commonTools.GetElementByProperty(DataEngine.chatArchive.chats,'cid',_chatId);
    if(fromArchive.length)
        chatObj = fromArchive[0];
    else
        chatObj = DataEngine.ChatManager.GetChat(_chatId,'i');

    if(chatObj != null)
    {
        if(d(chatObj.tid) && chatObj.tid.length)
        {
            lzm_commonDialog.createAlertDialog(tid('related_ticket_exists').replace('<!--tid-->',chatObj.tid), [{id: 'yes', name: tid('yes')}, {id: 'cancel', name: tid('cancel')}, {id: 'ignore', name: tid('ignore')}]);
            $('#alert-btn-yes').click(function() {
                lzm_commonDialog.removeAlertDialog();
                ChatTicketClass.SearchForTicketID(chatObj.tid);
            });
            $('#alert-btn-cancel').click(function() {
                lzm_commonDialog.removeAlertDialog();
            });
            $('#alert-btn-ignore').click(function() {
                lzm_commonDialog.removeAlertDialog();
                ChatTicketClass.__ShowTicket('', false, '', _chatId);
            });
            return true;
        }
        else if(_createIfNotFound)
            ChatTicketClass.__ShowTicket('', false, '', _chatId);
    }
    return false;
};

Chat.ChangePaste = function(){
    LocalConfiguration.PasteHTML = !LocalConfiguration.PasteHTML;
    LocalConfiguration.Save();
    $('#chat-change-paste').html(Chat.GetChangePasteText());
};

Chat.GetChangePasteText = function(){
    return tidc('paste',': ') + ((LocalConfiguration.PasteHTML) ? 'HTML' : 'Text');
};

function ChatManager(){
    this.Chats = [];
    this.DataUpdateTimeActive=null;
    this.DataUpdateTimeClosed=null;
}

ChatManager.ActiveChat = '';
ChatManager.LastActiveChat = '';
ChatManager.Counts={};
ChatManager.DLChatMessagesList=[];
ChatManager.EditorInputs=[];
ChatManager.LastPostStatusUpdate=0;

ChatManager.prototype.OpenChatWindow = function(_id){
    this.GetChat(_id).OpenChatWindow();
};

ChatManager.prototype.CloseChatWindow = function(_id){
    this.GetChat(_id).CloseChatWindow();
};

ChatManager.prototype.CanPreview = function (_chatId,_memberId){
    var chat = this.GetChat(_chatId,'i');
    if(chat != null && chat.CanPreview(_memberId))
        return true;
    return false;
};

ChatManager.prototype.AddInternalChat = function(_systemId,_type) {
    var exChatObject = this.GetChat(_systemId);
    if(exChatObject==null)
    {
        exChatObject = new Chat();
        exChatObject.Type = _type;
        exChatObject.SystemId = _systemId;
        this.Chats.push(exChatObject);
    }
    return exChatObject;
};

ChatManager.prototype.CreateChatWindow = function(_obj,_minimized){
    var icon = (_obj.Type == Chat.Group) ? 'comments' : 'comment';
    var bodyHTML = '';
    lzm_commonDialog.CreateDialogWindow(_obj.GetName(),bodyHTML,null,icon,'chat-window',_obj.GetWindowId(),null,true,null,true,11111,_minimized,_obj.SystemId);
    _obj.WindowCreated = true;

    var winObj = TaskBarManager.GetWindow(_obj.GetWindowId());

    if(!_minimized)
    {
        //winObj.Minimized = true;
        winObj.Minimize(false);
        winObj.Maximize();
    }
};

ChatManager.prototype.AddVisitorChat = function(_obj,_newPosts) {

    var oldCopy=null,isNew=false,exChatObject = this.GetChat(_obj.i,'i');
    var visitor = VisitorManager.GetVisitor(_obj.v);
    var browser = VisitorManager.GetLastActiveVisitorBrowser(_obj.v);
    var status = null;

    if(exChatObject == null)
    {
        if(visitor == null)
        {
            return null;
        }

        if(browser == null)
        {
            if(_obj.GetStatus() != Chat.Closed)
                return null;
        }

        // new
        exChatObject = _obj;

        this.Chats.push(exChatObject);
        isNew = true;
        exChatObject.IsWindowOpen = true;
        if(exChatObject.GetStatus() == Chat.Closed || !exChatObject.IsMember(DataEngine.myId))
        {
            exChatObject.IsWindowOpen = false;
            exChatObject.SetUnread(false);
        }

        status = exChatObject.GetStatus();
    }
    else
    {
        oldCopy = new Chat(exChatObject);
        for(var key in _obj)
            if(key[0].toString() !== key[0].toString().toUpperCase())
            {
                if(exChatObject[key] != _obj[key])
                    exChatObject[key] = _obj[key];
            }


        status = exChatObject.GetStatus();
        exChatObject.UpdateMembers(_obj.Members);

        if(exChatObject.GetChatGroup() != null)
            exChatObject.IsWindowOpen = false;

        if(status == Chat.Queue && status == Chat.Open && exChatObject.IsMember(DataEngine.myId))
            exChatObject.OpenChatWindow();

        if(status == Chat.Active && exChatObject.a == 0)
            exChatObject.a = lz_global_timestamp();
    }

    if(visitor!=null)
    {
        if((!visitor.IsInChat && status != Chat.Closed) || (visitor.IsInChat && status == Chat.Closed))
        {
            if(!d(visitor.HighestChat))
                visitor.HighestChat = 0;
            else if(visitor.HighestChat <= exChatObject.i)
            {
                visitor.IsInChat = status != Chat.Closed;
                visitor.WasInChat = true;
                visitor.is_vl_ui_update = true;
                visitor.HighestChat = Math.max(exChatObject.i,visitor.HighestChat);
                VisitorManager.needsUIupdate = true;
            }
        }
        exChatObject.Visitor = lzm_commonTools.clone(visitor);
    }


    if(browser!=null)
        exChatObject.Browser = lzm_commonTools.clone(browser);

    exChatObject.SystemId = exChatObject.v + '~' + exChatObject.b;

    lzm_chatDisplay.ProcessChatUpdates(oldCopy,exChatObject,_newPosts);

    if(isNew)
    {
        addChatInfoBlock(_obj,exChatObject.IsWindowOpen);
        if(exChatObject.GetStatus() == Chat.Closed)
            exChatObject.SetUnread(false);
    }

    return exChatObject;
};

ChatManager.prototype.GetChat = function(_key,_searchBy,_sort) {

    if(!d(_key) && d(ChatManager.ActiveChat))
        return this.GetChat(ChatManager.ActiveChat);

    _searchBy = d(_searchBy) ? _searchBy : 'SystemId';
    _sort = d(_sort) ? _sort : null;

    var maxChatId,k,list = lzm_commonTools.GetElementByProperty(this.Chats,_searchBy,_key);
    if(list.length)
    {
        if(_searchBy == 'SystemId' && list.length>1)
        {
            maxChatId = 0;
            for(k in list)
                maxChatId = Math.max(maxChatId,parseInt(list[k].i));
            return this.GetChat(maxChatId,'i');
        }

        if(_sort != null)
        {
            return lzm_commonTools.SortByProperty(list[0],_sort);
        }
        else
            return list[0];
    }
    return null;
};

ChatManager.prototype.GetChats = function(_type,_listMulti) {
    _type = (d(_type)) ? _type : null;
    _listMulti = (d(_listMulti)) ? _listMulti : false;
    var chat,list = [];
    for(var key in this.Chats)
        if(this.Chats[key].Type == _type || _type==null)
        {
            chat = this.Chats[key];
            if(this.Chats[key].Type==Chat.Visitor)
            {
                if(!_listMulti && chat.i != this.GetChat(chat.SystemId).i)
                    continue;
            }
            list.push(chat);
        }
    return list;
};

ChatManager.prototype.GetChatsOf = function(_operatorId,_status) {
    _status = (d(_status)) ? _status : ['all'];
    var list = [];
    for(var key in this.Chats)
        if(this.Chats[key].Type == Chat.Visitor && ($.inArray(this.Chats[key].GetStatus(),_status) != -1 || _status[0]=='all')  && this.Chats[key].IsMember(_operatorId))
        {
            list.push(this.Chats[key]);
        }
    return list;
};

ChatManager.prototype.GetMissed = function() {
    var missed = [];
    for(var key in this.Chats)
        if(this.Chats[key].Type == Chat.Visitor && this.Chats[key].IsMissed())
            missed.push(this.Chats[key]);
    return missed;
};

ChatManager.prototype.GetActive = function() {
    var active = [];
    for(var key in this.Chats)
        if(this.Chats[key].Type == Chat.Visitor && this.Chats[key].GetStatus()==Chat.Active)
            active.push(this.Chats[key]);
    return active;
};

ChatManager.prototype.GetQueued = function() {
    var queued = [];
    for(var key in this.Chats)
        if(this.Chats[key].Type == Chat.Visitor && this.Chats[key].GetStatus()==Chat.Queue)
            queued.push(this.Chats[key]);
    return queued;
};

ChatManager.prototype.GetAVGWaitingTime = function() {
    var count = 0;
    var wttotal = 0;
    for(var key in this.Chats)
    {
        wttotal += this.Chats[key].GetWaitingTime();
        count++;
    }
    if(count==0)
        return 0;
    return wttotal / count;
};

ChatManager.prototype.ProcessVisitorChats = function(_xmlDoc) {

    try
    {
        var that = this;
        $(_xmlDoc).find('ext_cl').each(function ()
        {
            var ext_cl = $(this);
            var duta = lz_global_base64_url_decode(ext_cl.attr('duta'));
            var dutc = lz_global_base64_url_decode(ext_cl.attr('dutc'));

            if(duta>=that.DataUpdateTimeActive || dutc > that.DataUpdateTimeClosed)
            {
                that.DataUpdateTimeActive = duta;
                that.DataUpdateTimeClosed = dutc;

                $(ext_cl).find('c').each(function ()
                {
                    var chatXML = $(this);
                    var chatObj = new Chat();

                    // members
                    chatObj.Members = [];
                    $(chatXML).find('m').each(function ()
                    {
                        var memberXML = $(this);
                        var memberObj = {};
                        lzm_commonTools.ApplyFromXML(memberObj,memberXML[0].attributes);
                        chatObj.Members.push(memberObj);
                    });

                    lzm_commonTools.ApplyFromXML(chatObj,chatXML[0].attributes);
                    chatObj = that.AddVisitorChat(chatObj,false);


                });

                $(ext_cl).find('pc').each(function ()
                {
                    var chatXML = $(this);
                    var cid = lz_global_base64_url_decode(chatXML.attr('cid'));
                    var chatObj = that.GetChat(cid,'i');

                    // members
                    $(chatXML).find('val').each(function ()
                    {
                        var prpostXML = $(this);
                        var prpostObj = {};
                        lzm_commonTools.ApplyFromXML(prpostObj,prpostXML[0].attributes);

                        prpostObj.text = lz_global_htmlentities(lz_global_base64_url_decode(prpostXML.text()));
                        prpostObj.textOriginal = lz_global_base64_url_decode(prpostXML.text());
                        prpostObj = Chat.FormatPost(prpostObj);
                        prpostObj = Chat.ProcessPostCommands(prpostObj);

                        if(prpostObj != null)
                            chatObj.AddMessage(prpostObj,false);
                    });

                    // properties
                    lzm_commonTools.ApplyFromXML(chatObj,chatXML[0].attributes);
                    chatObj = that.AddVisitorChat(chatObj,true);

                    var aw = TaskBarManager.GetActiveWindow();
                    if(aw != null && aw.Tag == chatObj.SystemId)
                        lzm_chatDisplay.RenderChatHistory();
                });

            }
        });
        lzm_chatDisplay.ProcessChatIndication();
        this.Prune();
    }
    catch(ex)
    {
        deblog(ex);
    }
};

ChatManager.prototype.SetTyping = function(_systemId,_on) {
    for(var key in this.Chats)
        if(this.Chats[key].SystemId == _systemId || _systemId == 'all')
            this.Chats[key].IndicateTyping = _on;
};

ChatManager.prototype.WasMember = function(_systemId,_operatorId) {

    var chats = lzm_commonTools.GetElementByProperty(this.Chats,'SystemId',_systemId);
    for(var ckey in chats)
    {
        for(var key in chats[ckey].PreviousMembers)
            if(_operatorId == chats[ckey].PreviousMembers[key].i)
                return true;

        if(chats[ckey].IsMember(_operatorId))
            return true;
    }
    return false;
};

ChatManager.prototype.IsUnread = function(_checkPerm) {

    _checkPerm = (d(_checkPerm)) ? _checkPerm : false;
    for(var ckey in this.Chats)
    {
        var vperm = PermissionEngine.checkUserChatPermissions(DataEngine.myId, 'view', this.Chats[ckey]);
        if(vperm || !_checkPerm || this.Chats[ckey].Type != Chat.Visitor)
            if(this.Chats[ckey].IsUnread)
            {
                if(TaskBarManager.GetWindowByTag(this.Chats[ckey].SystemId) != null)
                    return true;
            }
    }
    return false;
};

ChatManager.prototype.MarkClosedRead = function() {

    var wasChange = false;
    for(var ckey in this.Chats)
        if(this.Chats[ckey].IsUnread && this.Chats[ckey].GetStatus() == Chat.Closed)
        {
            this.Chats[ckey].SetUnread(false);
            wasChange = true;
        }
    return wasChange;
};

ChatManager.SaveEditorInput = function(_systemId, _value) {

    _systemId = (d(_systemId)) ? _systemId : ChatManager.ActiveChat;
    if (_systemId == '' && ChatManager.LastActiveChat != '')
        _systemId = ChatManager.LastActiveChat;

    if (_systemId != '')
    {
        var chatInput = '';
        if (d(_value) && _value != '' && _value != null)
        {
            chatInput = _value;
        }
        else if (d(_value) && _value == null)
        {
            chatInput = null;
        }
        else
        {
            var tmpInput = grabEditorContents();
            chatInput = tmpInput.replace(/^ */,'').replace(/ *$/,'');
        }

        if (chatInput == null)
        {
            ChatManager.EditorInputs[_systemId] = '';
        }
        //related change: chat.js:794
        else/* if (chatInput != '')*/
        {
            ChatManager.EditorInputs[_systemId] = chatInput;
        }
    }
};

ChatManager.LoadEditorInput = function(_systemId) {
    _systemId = (d(_systemId)) ? _systemId : ChatManager.ActiveChat;
    if(d(ChatManager.EditorInputs[_systemId]))
        return ChatManager.EditorInputs[_systemId];
    return '';
};

ChatManager.SetActiveChat = function (_id) {

    if(ChatManager.ActiveChat != '')
        ChatManager.LastActiveChat = ChatManager.ActiveChat;
    ChatManager.ActiveChat = _id;
};

ChatManager.SetTags = function(_cid, _selected, _closeWindow){

    var chatObj = d(_cid) ? DataEngine.ChatManager.GetChat(_cid,'i') : DataEngine.ChatManager.GetChat();

    window['chat-set-tags'] = new CommonInputControlsClass.TagEditor('chat-set-tags',DataEngine.getConfigValue('gl_tags',false),true,true,false,true);
    window['chat-set-tags'].PermissionsToAdd = 'add_tags';
    window['chat-set-tags'].DialogTitle = tid('set_tags');

    if(chatObj != null && d(chatObj.Tags))
        window['chat-set-tags'].AddTags(chatObj.Tags,true);

    if(d(_selected) && _selected.length)
        window['chat-set-tags'].AddTags(lz_global_base64_decode(_selected),true);

    if(chatObj != null && ChatManager.ActiveChat != chatObj.SystemId && TaskBarManager.WindowExists(chatObj.SystemId))
        TaskBarManager.GetWindowByTag(chatObj.SystemId).Maximize();

    window['chat-set-tags'].ShowDialog();

    $('#alert-btn-ok').click(function() {

        var tags = window['chat-set-tags'].GetListString(true);

        if(chatObj != null)
        {
            chatObj.Tags = tags;
            _cid = chatObj.i;
        }

        var pollObj = {};

        pollObj.myUserId = DataEngine.myUserId;
        pollObj.myId = DataEngine.myId;
        pollObj.chatId = _cid;
        pollObj.chatTags = tags;

        CommunicationEngine.pollServerSpecial(pollObj, 'chat-set-tags');

        lzm_commonDialog.removeAlertDialog();

        if(d(_closeWindow))
            _closeWindow.Close();
        else
            CommonUIClass.prototype.RenderChatVisitorActivated();
    });
    $('#alert-btn-cancel').click(function() {
        lzm_commonDialog.removeAlertDialog();
    });
};

ChatManager.prototype.Prune = function(){

    var count = this.Chats.length;
    var key,limit = 50;
    var sorterList = [];
    var toDeleteMax = count-limit;
    if(toDeleteMax > 0)
    {
        for(key in this.Chats)
        {
            if(d(this.Chats[key].l))
                if(this.Chats[key].GetStatus() == Chat.Closed)
                    if(TaskBarManager.GetWindowByTag(this.Chats[key].SystemId) == null)
                    {
                        sorterList.push({s:this.Chats[key].SystemId,l:this.Chats[key].l});
                    }
        }
        if(sorterList.length)
        {
            sorterList.sort(function(a, b) {
                var x = a.l;
                var y = b.l;
                return x < y ? -1 : x > y ? 1 : 0;
            });
            for(key in sorterList)
            {
                lzm_commonTools.RemoveElementByProperty(this.Chats,'SystemId',sorterList[key].s);
                toDeleteMax--;
                if(toDeleteMax <= 0)
                    return;
            }
        }
    }
};

function VisitorManager(){}
VisitorManager.Visitors = [];
VisitorManager.DUTVisitors = 0;
VisitorManager.DUTVisitorBrowserEntrance = 0;
VisitorManager.DUTVisitorBrowserURLs = 0;
VisitorManager.LoadFullDataUserId = null;
VisitorManager.LoadedFullDataUsers = [];
VisitorManager.RecentlyActiveVisitors = 0;
VisitorManager.ActiveVisitors = 0;
VisitorManager.RecurringVisitors = 0;
VisitorManager.NewVisitors = 0;
VisitorManager.KnownVisitors = 0;
VisitorManager.Watch_ListVisitors = 0;
VisitorManager.CommentsVisitors = 0;
VisitorManager.needsUIupdate = false;
VisitorManager.QueuedBrowsers = [];
VisitorManager.QueuedURLS = [];
VisitorManager.Filters = {};
VisitorManager.ActiveTimeInSeconds = 120;
VisitorManager.IsTreeviewCreated = false;

VisitorManager.AddVisitor = function(_obj){

    var existing = VisitorManager.GetVisitor(_obj.i);
    if(existing == null)
    {
        VisitorManager.Visitors.splice(0,0,_obj);
        existing = _obj;
        NotificationManager.NotifyVisitor(_obj);
    }
    else
    {
        if(!existing.is_active)
        {
            lzm_commonTools.RemoveElementByProperty(VisitorManager.Visitors,'i',_obj.i);
            VisitorManager.Visitors.splice(0,0,_obj);
        }
        existing.ed =_obj.ed;
        existing.d =_obj.d;
        existing.c =_obj.c;
        existing.r =_obj.r;
        existing.lang =_obj.lang;
        existing.is_vi_ui_update =
        existing.is_vl_ui_update = true;

        //var existing = lzm_commonTools.GetElementByProperty(VisitorManager.LoadedFullDataUsers,'id',_id);
        lzm_commonTools.RemoveElementByProperty(VisitorManager.LoadedFullDataUsers,'i',_obj.i);
    }

    existing.unique_name = t('Visitor <!--visitor_number-->',[['<!--visitor_number-->',VisitorManager.GetUniqueName(existing.id + existing.ip)]]);

    if(!d(existing.IsInChat))
        existing.IsInChat = false;

    if(!d(existing.WasInChat))
        existing.WasInChat = false;

    if(!d(existing.is_drawn))
        existing.is_drawn = false;

    if(!d(existing.IsLoaded))
        existing.IsLoaded = false;

    if(!d(existing.is_vl_ui_update))
        existing.is_vl_ui_update = false;

    if(!d(existing.is_vi_ui_update))
        existing.is_vi_ui_update = false;

    if(!d(existing.FullData))
        existing.FullData = false;

    VisitorFilterManager.SetVisitorHidden(existing);
    VisitorManager.AddBrowsersToVisitorFromQueue(existing);
};

VisitorManager.AddBrowser = function(_obj){

    var visKey, found = false;

    _obj.c = parseInt(_obj.c);

    var lists = [VisitorManager.Visitors,VisitorManager.LoadedFullDataUsers];
    for(var lkey in lists)
        for(var vkey in lists[lkey])
        {
            if(lists[lkey][vkey].id == _obj.v)
            {
                found = true;
                visKey = vkey;
                if(!d(lists[lkey][visKey].b))
                    lists[lkey][visKey].b = [];

                _obj.last_browse = 0;

                var browserKey = null;
                for(var key in lists[lkey][visKey].b)
                {
                    if(lists[lkey][visKey].b[key].id == _obj.id)
                        browserKey = key;
                }

                if(browserKey == null && _obj.c == 0)
                    lists[lkey][visKey].b.push(_obj);
                else if(browserKey != null)
                    lists[lkey][visKey].b[browserKey].c = _obj.c;
                else if(d(lists[lkey][visKey].rv))
                {
                    var rvSession = lzm_commonTools.GetElementByProperty(lists[lkey][visKey].rv,'id',_obj.vi);
                    if(rvSession.length)
                    {
                        if(!d(rvSession[0].b))
                            rvSession[0].b = [];

                        rvSession[0].b.push(_obj);
                    }
                }
                lists[lkey][visKey].is_vi_ui_update =
                    lists[lkey][visKey].is_vl_ui_update = true;
            }
        }

    if(!found && _obj.c == 0)
    {
        VisitorManager.QueuedBrowsers.push(_obj);
    }
    VisitorManager.AddURLSToBrowserFromQueue(_obj);
};

VisitorManager.AddURL = function(_obj){

    var key,rkey,bkey;
    function setData(_visitor,_browser){
        _visitor.is_vi_ui_update =
            _visitor.is_vl_ui_update = true;
        if(!d(_browser.h2))
            _browser.h2 = [];
        _obj.time = parseInt(_obj.e);
        _browser.h2.push(_obj);

        VisitorManager.DUTVisitorBrowserURLs = Math.max(VisitorManager.DUTVisitorBrowserURLs,_obj.e);
        _browser.last_browse = lz_global_timestamp();
        _visitor.IsLoaded = true;
    }

    var lists = [VisitorManager.Visitors,VisitorManager.LoadedFullDataUsers];
    for(var lkey in lists)
        for(key in lists[lkey])
        {
            for(bkey in lists[lkey][key].b)
            {
                if(lists[lkey][key].b[bkey].id == _obj.b)
                {
                    var existingUrl = [];
                    if(d(lists[lkey][key].b[bkey].h2))
                        existingUrl = lzm_commonTools.GetElementByProperty(lists[lkey][key].b[bkey].h2,'e',_obj.e);
                    if(!existingUrl.length)
                        setData(lists[lkey][key],lists[lkey][key].b[bkey]);
                    return;
                }
            }
            for(rkey in lists[lkey][key].rv)
            {
                for(bkey in lists[lkey][key].rv[rkey].b)
                {
                    if(lists[lkey][key].rv[rkey].b[bkey].id == _obj.b)
                    {
                        setData(lists[lkey][key],lists[lkey][key].rv[rkey].b[bkey]);
                        return;
                    }
                }
            }
        }

    if(!lzm_commonTools.GetElementByProperty(VisitorManager.QueuedURLS,'e',_obj.e).length)
    {
        VisitorManager.QueuedURLS.push(_obj);
    }
};

VisitorManager.AddBrowsersToVisitorFromQueue = function(_visitor){
    for(var key in VisitorManager.QueuedBrowsers)
    {
        if(VisitorManager.QueuedBrowsers[key].v == _visitor.id)
        {
            VisitorManager.AddBrowser(VisitorManager.QueuedBrowsers[key]);
            lzm_commonTools.RemoveFromArray(VisitorManager.QueuedBrowsers,VisitorManager.QueuedBrowsers[key]);
        }
    }


};

VisitorManager.AddURLSToBrowserFromQueue = function(_browser){
    for(var key in VisitorManager.QueuedURLS)
    {
        if(VisitorManager.QueuedURLS[key].b == _browser.id)
        {
            VisitorManager.AddURL(VisitorManager.QueuedURLS[key]);

            lzm_commonTools.RemoveFromArray(VisitorManager.QueuedURLS,VisitorManager.QueuedURLS[key]);
            VisitorManager.AddURLSToBrowserFromQueue(_browser);
            return;
        }
    }
};

VisitorManager.SetVisitorActive = function(_visitor){
    var isActive = false;
    if(_visitor != null)
    {
        for(var key in _visitor.b)
        {
            _visitor.b[key].is_active = _visitor.b[key].c==0;
            if(_visitor.b[key].is_active)
                isActive = true;
        }
        _visitor.is_active = isActive;

        if(!_visitor.is_active && parseInt(_visitor.e) > (lz_global_timestamp() + Client.TimeDifference - VisitorManager.ActiveTimeInSeconds) && !d(_visitor.b))
        {
            _visitor.is_active = true;
        }
    }
    return isActive;
};

VisitorManager.CountryFilterFunction = function(_visitor,_filter){
    var ctryEntry = _visitor.ctryi2;
    var name = lzm_chatDisplay.getCountryName(ctryEntry, false);
    if(!d(ctryEntry) || name === null || name === 'null'){
        ctryEntry = 'Unknown';
    }
    return (ctryEntry != _filter.id);
};

VisitorManager.AddComment = function(visitorObj,_comObj){

    if(_comObj.text.indexOf('[__[vf:') !== -1 && _comObj.text.indexOf(']__]') !== -1)
    {
        var oid = _comObj.text.replace(']__]','').replace('[__[vf:','');
        if(oid == lzm_chatDisplay.myId)
        {
            visitorObj.IsOnWatchList = true;
        }
    }
    else if(d(visitorObj))
    {
        if(!d(visitorObj.c))
            visitorObj.c = [];

        var exComment = lzm_commonTools.GetElementByProperty(visitorObj.c,'id',_comObj.id);

        if(!exComment.length)
            visitorObj.c.push(_comObj);
    }
};

VisitorManager.AddInvite = function(visitorObj,_invObj){

    if(visitorObj == null)
        return;

    if(!d(visitorObj.r))
        visitorObj.r = [];

    for(var key in visitorObj.r)
    {
        if(visitorObj.r[key].i == _invObj.i)
        {
            visitorObj.r[key] = _invObj;
            return;
        }
    }
    visitorObj.r.push(_invObj);
};

VisitorManager.GetVisitor = function(_id){
    if(d(_id) && _id != null)
    {
        _id = VisitorManager.GetVisitorPart(_id);

        var existing = lzm_commonTools.GetElementByProperty(VisitorManager.Visitors,'i',_id);
        if(existing.length)
            return existing[0];
    }
    return null;
};

VisitorManager.GetVisitorPart = function(_id){
    if(d(_id) && _id != null)
    {
        if(_id.indexOf('~')!=-1)
            _id = _id.split('~')[0];
    }
    return _id;
};

VisitorManager.GetFullDataVisitor = function(_id){
    if(d(_id) && _id != null)
    {
        if(_id.indexOf('~')!=-1)
            _id = _id.split('~')[0];

        var existing = lzm_commonTools.GetElementByProperty(VisitorManager.LoadedFullDataUsers,'id',_id);
        if(existing.length)
            return existing[0];
    }
    return null;
};

VisitorManager.GetVisitorBrowser = function(_id,_visitorId,_searchRecent){

    var key;
    if(d(_id))
    {
        if(_id.indexOf('~')!=-1)
            _id = _id.split('~')[1];

        for(key in VisitorManager.Visitors)
        {
            if(d(_visitorId) && VisitorManager.Visitors[key].id != _visitorId)
                continue;
            var browsers = lzm_commonTools.GetElementByProperty(VisitorManager.Visitors[key].b,'id',_id);
            if(browsers.length)
                return browsers[0];
        }

        if(_searchRecent)
        {
            for(key in VisitorManager.Visitors)
            {
                if(d(_visitorId) && VisitorManager.Visitors[key].id != _visitorId)
                    continue;

                if(d(VisitorManager.Visitors[key].rv))
                    for(var rvkey in VisitorManager.Visitors[key].rv)
                    {
                        if(d(VisitorManager.Visitors[key].rv[rvkey].b))
                            for(var rvbkey in VisitorManager.Visitors[key].rv[rvkey].b)
                            {
                                if(_id == VisitorManager.Visitors[key].rv[rvkey].b[rvbkey].id)
                                {
                                    return VisitorManager.Visitors[key].rv[rvkey].b[rvbkey];
                                }
                            }
                    }
            }
        }
    }
    return null;
};

VisitorManager.GetLastActiveVisitorBrowser = function(_visitorId){

    if(_visitorId.indexOf('~')!=-1)
        _visitorId = _visitorId.split('~')[0];

    try
    {
        var visitor = lzm_commonTools.GetElementByProperty(VisitorManager.Visitors,'id',_visitorId);
        if(visitor.length && d(visitor[0].b))
        {
            var vlist = visitor[0].b;
            vlist = lzm_commonTools.SortByProperty(vlist,'last_browse',true);
            return vlist[0];
        }
    }
    catch(ex)
    {
        deblog(ex);
    }
    return null;
};

VisitorManager.GetVisitorName = function(_visitor,_maxlength,_raw){
    _raw = (d(_raw)) ? _raw : false;
    _maxlength = (d(_maxlength)) ? _maxlength : 1024;
    if(_visitor==null)
        return '';
    var name = _visitor.unique_name;
    var inputName = DataEngine.inputList.getInputValueFromVisitor(111,_visitor,_maxlength,_raw);
    if(inputName != '' && inputName != '-')
        name = inputName;
    if(!d(name))
        return '';
    return name;
};

VisitorManager.GetUniqueName = function(_idString) {
    var mod = 111;
    var digit;
    for (var i=0; i<_idString.length; i++) {
        digit = 0;
        if (!isNaN(parseInt(_idString.substr(i,1))))
        {
            digit = parseInt(_idString.substr(i,1));
            mod = (mod + (mod* (16+digit)) % 1000);
            if (mod % 10 == 0)
            {
                mod += 1;
            }
        }
    }
    return String(mod).substr(String(mod).length-4,4);
};

VisitorManager.GetLastActiveTime = function(_visitor){

    if(_visitor==null)
        return 0;

    if(!d(_visitor.b))
        return 0;

    var tmpBegin = 0;
    for (var i=0; i<_visitor.b.length; i++)
    {
        if (d(_visitor.b[i].h2) && _visitor.b[i].h2.length > 0)
        {
            var newestH = _visitor.b[i].h2.length - 1;
            tmpBegin = Math.max(_visitor.b[i].h2[newestH].time, tmpBegin);
            _visitor.last_active = tmpBegin;
        }
    }
    return _visitor.last_active;
};

VisitorManager.IsOnDomain = function(_visitorObj,_domainWildcard,_useWildcard){

    if(_visitorObj==null)
        return false;
    if(!d(_visitorObj.b))
        return false;

    for(var bkey in _visitorObj.b)
    {
        for(var ukey in _visitorObj.b[bkey].h2)
        {
            if(_visitorObj.b[bkey].h2[ukey].url != '')
            {
                if(lzm_commonTools.IsWildcardMatch(_domainWildcard,_visitorObj.b[bkey].h2[ukey].url,_useWildcard))
                    return true;
            }
        }
    }
    return false;
};

VisitorManager.GetPageTitle = function(_visitorObj){
    var pageTitle = '';
    try
    {
        var browser = VisitorManager.GetLastActiveVisitorBrowser(_visitorObj.id);
        if(browser != null && d(browser.h2))
            pageTitle = browser.h2[browser.h2.length-1].title;
    }
    catch(ex)
    {
        deblog(ex);
    }
    return lzm_commonTools.escapeHtml(pageTitle);
};

VisitorManager.GetPageCount = function(_visitorObj){

    var pageCount = 0;
    try
    {
        if(d(_visitorObj.b))
            for (var i=0; i<_visitorObj.b.length; i++)
            {
                if(d(_visitorObj.b[i].h2))
                    pageCount += _visitorObj.b[i].h2.length;
            }
    }
    catch(ex)
    {
        deblog(ex);
    }
    return pageCount;
};

VisitorManager.GetReferrer = function(_visitorObj){
    var refUrl = '';
    for(var bkey in _visitorObj.b)
    {
        if(d(_visitorObj.b[bkey].h2))
            if(_visitorObj.b[bkey].h2[0].ref != null && _visitorObj.b[bkey].h2[0].ref.u != '')
            {
                refUrl = _visitorObj.b[bkey].h2[0].ref.u;
                break;
            }
    }
    if(refUrl.indexOf('http') == 0)
        refUrl = '<a href="#" class="lz_chat_link_no_icon" onclick="openLink(\'http://dereferrer.livezilla.info/?url=' + refUrl + '\');">' + refUrl + '</a>';
    return refUrl;
};

VisitorManager.PruneVisitors = function(){

    for(var key in VisitorManager.Visitors)
    {
        var visitor = VisitorManager.Visitors[key];
        VisitorManager.SetVisitorActive(visitor);
        if(!visitor.is_active && d(visitor.b) && visitor.b.length)
        {
            if(visitor.WasInChat || visitor.IsInChat)
                continue;

            if(visitor.is_drawn || visitor.is_mapped)
                continue;

            VisitorManager.Visitors.splice(key,1);
            VisitorManager.PruneVisitors();
            return;
        }
    }
};

VisitorManager.GetLatestInvite = function(_visitorObj){
    var invList = lzm_commonTools.clone(_visitorObj.r);
    invList = lzm_commonTools.SortByProperty(invList,'c',true);
    return invList[0];
};

VisitorManager.GetWebsiteNames = function(_visitorObj){
    var names = '';
    if(_visitorObj != null && d(_visitorObj.b))
        for(var bkey in _visitorObj.b)
        {
            for(var ukey in _visitorObj.b[bkey].h2)
            {
                if(_visitorObj.b[bkey].h2[ukey].code != '')
                {
                    if(names.indexOf(_visitorObj.b[bkey].h2[ukey].code)==-1)
                        names += ((names.length) ? ', ' : '') + _visitorObj.b[bkey].h2[ukey].code;
                }
            }
        }
    return names;
};

VisitorManager.IsInChatWith = function(_visitorObj,_operatorId){

    for(var key in DataEngine.ChatManager.Chats)
    {
        var cc = DataEngine.ChatManager.Chats[key];
        if(cc.GetStatus() != Chat.Closed && cc.IsMember(_operatorId))
        {
            if(cc.Visitor != null && cc.Visitor.id == _visitorObj.id)
                return true;
        }
    }
    return false;
};

VisitorManager.IsInChat = function(_visitorObj){
    if(_visitorObj != null)
        for(var key in DataEngine.ChatManager.Chats)
        {
            var cc = DataEngine.ChatManager.Chats[key];
            if(cc.GetStatus() != Chat.Closed)
            {
                if(cc.Visitor != null && cc.Visitor.id == _visitorObj.id)
                    return true;
            }
        }
    return false;
};

VisitorManager.GetChatOf = function(_visitorObj){
    if(_visitorObj != null)
        for(var key in DataEngine.ChatManager.Chats)
        {
            var cc = DataEngine.ChatManager.Chats[key];
            if(cc.GetStatus() != Chat.Closed)
            {
                if(cc.Visitor != null && cc.Visitor.id == _visitorObj.id)
                    return cc;
            }
        }
    return null;
};

VisitorManager.UpdateVisitorNameInTaskBar = function(_visitorId,_newNameRaw){
    for(var wkey in TaskBarManager.Windows)
        if(typeof TaskBarManager.Windows[wkey].Tag == 'string' && TaskBarManager.Windows[wkey].Tag.indexOf(_visitorId) === 0)
        {
            var newname = lzm_commonTools.htmlEntities(_newNameRaw);
            if(newname.length)
                TaskBarManager.Windows[wkey].Title = newname;
            lzm_chatDisplay.RenderTaskBarPanel();
        }
};

function VisitorFilterManager(){

}

VisitorFilterManager.Filters = [];

VisitorFilterManager.InitFiltersForHeadlineCounting = function() {
    VisitorFilterManager.Filters.push(VisitorFilterManager.CreateSettingsFilter(VisitorFilterManager.IsVisitorMonitoringDisabled));
    VisitorFilterManager.Filters.push(VisitorFilterManager.CreateSettingsFilter(VisitorFilterManager.IsVisitorDisplayPermissionMissing));
    VisitorFilterManager.Filters.push(VisitorFilterManager.CreateSettingsFilter(VisitorFilterManager.IsVisitorFilteredByGlobalHideInactiveSetting));
    VisitorFilterManager.Filters.push(VisitorFilterManager.CreateSettingsFilter(VisitorFilterManager.IsVisitorFilteredByGlobalDomainFilterSetting));
    VisitorFilterManager.Filters.push(VisitorFilterManager.CreateSettingsFilter(VisitorFilterManager.IsVisitorFilteredByGlobalGroupBlacklistWhitelist));
    VisitorFilterManager.Filters.push(VisitorFilterManager.CreateSettingsFilter(VisitorFilterManager.IsVisitorNotLoaded));
    VisitorFilterManager.Filters.push(VisitorFilterManager.CreateSettingsFilter(VisitorFilterManager.IsVisitorGone));
};

VisitorFilterManager.CreateFilters = function (){
    VisitorFilterManager.Filters.push(VisitorFilterManager.CreateStaticTreeviewFilter('all', VisitorFilterManager.IsVisitorNotLoaded, 'fa-caret-down', true));
    VisitorFilterManager.Filters.push(VisitorFilterManager.CreateStaticTreeviewFilter('active', VisitorFilterManager.IsVisitorNotActive, 'fa-spinner'));
    VisitorFilterManager.Filters.push(VisitorFilterManager.CreateStaticTreeviewFilter('known', VisitorFilterManager.IsVistorNotKnown, 'fa-tag'));
    VisitorFilterManager.Filters.push(VisitorFilterManager.CreateStaticTreeviewFilter('recurring', VisitorFilterManager.IsVisitorNotRecurring, 'fa-undo'));
    VisitorFilterManager.Filters.push(VisitorFilterManager.CreateStaticTreeviewFilter('new', VisitorFilterManager.IsVisitorNotNew, 'fa-user-plus'));
    VisitorFilterManager.Filters.push(VisitorFilterManager.CreateStaticTreeviewFilter('watch_list', VisitorFilterManager.IsVisitorNotOnWatchlist, 'fa-binoculars'));
    VisitorFilterManager.Filters.push(VisitorFilterManager.CreateStaticTreeviewFilter('chat', VisitorFilterManager.IsVisitorNotInChat, 'fa-comments'));
    VisitorFilterManager.Filters.push(VisitorFilterManager.CreateStaticTreeviewFilter('comments', VisitorFilterManager.IsVisitorWithoutComments, 'fa-quote-right'));
};

VisitorFilterManager.UpdateFilters = function(){
    var removeArray = [];
    var updateArray = [];
    var createArray = [];
    VisitorFilterManager.Filters.forEach(function(_filter, _index, _array)
        {
            if(_filter.treeview)
            {
                if(d(_filter.country) && parseInt(_filter.newCount) === 0)
                    removeArray.push(_filter);
                else if(_filter.created === false){
                    createArray.push(_filter);
                    _array[_index].created = true;
                    _array[_index].lastCount = parseInt(_array[_index].newCount);
                }else if(parseInt(_filter.lastCount) != parseInt(_filter.newCount)){
                    updateArray.push(_filter);
                    _array[_index].lastCount = parseInt(_array[_index].newCount);
                }
            }

        }
    );
    return{
        create: createArray,
        remove : removeArray,
        update: updateArray
    };
};

VisitorFilterManager.CreateSettingsFilter = function(_filterMatchFunction){
    var filter = {};
    filter.Match = _filterMatchFunction;
    filter.fromSettings = true;
    filter.active = true;
    return filter;
};

VisitorFilterManager.CreateStaticTreeviewFilter = function(_translationId, _filterMatchFunction, _iconId, _active){
    var filter = {};
    filter.Match = _filterMatchFunction;
    filter.treeview = true;
    filter.static = true;
    filter.id = _translationId;
    filter.name = tid(_translationId);
    filter.iconId = _iconId;
    filter.active = _active ? true : false;
    filter.lastCount = 0;
    filter.newCount = 0;

    return filter;
};

VisitorFilterManager.CreateCountryTreeviewFilter = function(_countryCode, _count){
    var filter = {};
    filter.Match = VisitorFilterManager.IsVisitorNotInCountry;
    filter.treeview = true;
    filter.id = _countryCode;
    filter.name = _countryCode != 'unknown' ? VisitorFilterManager.GetCountryNameOrUnknown(_countryCode) : tid('unknown');
    filter.active = false;
    filter.lastCount = 0;
    filter.newCount = parseInt(_count);
    filter.country = true;
    filter.created = false;
    return filter;
};

VisitorFilterManager.SetActiveTreeviewFilter = function(_id){
    for(var key in VisitorFilterManager.Filters) {
        var filter = VisitorFilterManager.Filters[key];

        if(filter.id == _id)
            VisitorFilterManager.Filters[key].active = true;
         else if (filter.active && filter.treeview)
            VisitorFilterManager.Filters[key].active = false;
    }
//    if(VisitorFilterManager.GetFilterSet('active').length == 7)
//        lzm_chatDisplay.VisitorsUI.RemoveCountryFilter(_id);
};

VisitorFilterManager.GetCountryNameOrUnknown = function(_countryCode){
    var countryName = lzm_chatDisplay.getCountryName(_countryCode, false);
    if( countryName == null || countryName == 'null')
        return tid('unknown');
    else
        return countryName
};

VisitorFilterManager.RemoveFilter = function(_id){
    VisitorFilterManager.Filters.forEach(function(_filter, _index, _array){
        if(_filter.id == _id)
            _array.splice(_index, 1);
    });
};

VisitorFilterManager.CountVisitors = function(){
    var countUpdated = false;

    var treeviewFilters = VisitorFilterManager.GetFilterSet('treeview');
    var settingsFilters = VisitorFilterManager.GetFilterSet('fromSettings');

    if(lzm_chatDisplay.selected_view != 'external' )
    {
        var old = VisitorManager.ActiveVisitors;
        var newVisitorActiveCount = 0;
        for(var key in VisitorManager.Visitors)
        {
            if(VisitorFilterManager.IsVisitorPassingFilterSet(VisitorManager.Visitors[key], settingsFilters))
            {
                if(VisitorManager.Visitors[key].IsLoaded)
                {
                    newVisitorActiveCount++;
                }
            }
        }
        VisitorManager.ActiveVisitors = newVisitorActiveCount;
        return old != newVisitorActiveCount;
    }

    var staticTreeviewFilters = VisitorFilterManager.GetFilterSubSet('static', treeviewFilters);
    var countryFilters = VisitorFilterManager.GetFilterSubSet('country', treeviewFilters);
    treeviewFilters.forEach(function(_filter)
    {
        _filter.newCount = 0;
    });

    var countryCount = {};
    countryFilters.forEach(function(_filter)
    {
        countryCount[_filter.id] = 0;
    });
    var visitorstart = Date.now();
    for(var i in VisitorManager.Visitors)
    {
        var visitor = VisitorManager.Visitors[i];

        if(VisitorFilterManager.IsVisitorPassingFilterSet(VisitorManager.Visitors[i], settingsFilters))
        {
            staticTreeviewFilters.forEach(function(_filter)
            {
                _filter.newCount += Number(!_filter.Match(visitor, _filter));
            });

            // count countries
            var ctryEntry = VisitorFilterManager.GetValidCountryFilterId(VisitorManager.Visitors[i].ctryi2);
            if(d(countryCount[ctryEntry]))
                countryCount[ctryEntry]++;
            else
                countryCount[ctryEntry] = 1;
        }

    }
    treeviewFilters.forEach(function(_filter)
    {
        if(_filter.country){
            _filter.newCount = countryCount[_filter.id];
            delete countryCount[_filter.id];
        }

        if(_filter.newCount != _filter.lastCount)
            countUpdated = true;
    });
    for(var newCountry in countryCount)
    {
        if(treeviewFilters.length > 0)
            VisitorFilterManager.Filters.push(VisitorFilterManager.CreateCountryTreeviewFilter(newCountry, countryCount[newCountry]));
    }
    if(countUpdated)
    {
        VisitorManager.ActiveVisitors = staticTreeviewFilters[0].newCount;
        return true;
    }
    else
        return false;
};

VisitorFilterManager.DoFilter = function(){
    for(var key in VisitorManager.Visitors)
    {
        VisitorFilterManager.SetVisitorHidden(VisitorManager.Visitors[key], VisitorFilterManager.GetFilterSet('active'));
    }
};

VisitorFilterManager.SetVisitorHidden = function(_visitor, _activeFilters){
    if(!d(_activeFilters))
        _activeFilters = VisitorFilterManager.GetFilterSet('active');

    _visitor.IsHidden = !VisitorFilterManager.IsVisitorPassingFilterSet(_visitor, _activeFilters);
};

VisitorFilterManager.GetFilterSet = function(_property){
    var filterSet = [];
    for(var key in VisitorFilterManager.Filters)
    {
        if(VisitorFilterManager.Filters[key][_property])
            filterSet.push(VisitorFilterManager.Filters[key]);
    }
    return filterSet
};

VisitorFilterManager.GetFilterSubSet = function(property, _set){
    var filterSet = [];
    for(var key in _set)
    {
        if(_set[key][property])
            filterSet.push(_set[key]);
    }
    return filterSet
};

VisitorFilterManager.IsVisitorMonitoringDisabled = function(){
    return DataEngine.getConfigValue('gl_vmac',false)!='1';
};

VisitorFilterManager.IsVisitorDisplayPermissionMissing = function(_visitor){
    return !PermissionEngine.checkUserMonitoringPermissions('','view',_visitor);
};

VisitorFilterManager.IsVisitorFilteredByGlobalHideInactiveSetting = function(_visitor){
    return DataEngine.getConfigValue('gl_hide_inactive',false)!='0' && !VisitorManager.IsInChat(_visitor) && VisitorManager.GetLastActiveTime(_visitor) < (lz_global_timestamp() + parseInt(Client.TimeDifference) - (parseInt(DataEngine.getConfigValue('gl_inti'))*60));
};

VisitorFilterManager.IsVisitorFilteredByGlobalDomainFilterSetting = function(_visitor){
    if(!(DataEngine.getConfigValue('gl_doma',false)!=''))
        return false;

    var domains = DataEngine.getConfigValue('gl_doma',false).replace(/ /g,'').split(',');
    var blacklist = DataEngine.getConfigValue('gl_bldo',false) == '1';
    var isOnDomain;

    var isFiltered = !blacklist;

    for(var key in domains)
    {
        isOnDomain = VisitorManager.IsOnDomain(_visitor,domains[key],true);
        if(isOnDomain && blacklist)
        {
            isFiltered = true;
            break;
        }
        else if (isOnDomain && !blacklist)
        {
            isFiltered = false;
            break;
        }
    }
    return isFiltered;
};

VisitorFilterManager.IsVisitorFilteredByGlobalGroupBlacklistWhitelist = function(_visitor){
    var isFiltered = false;
    loop_groups:
        for(var key in lzm_chatDisplay.myGroups)
        {
            var group = DataEngine.groups.getGroup(lzm_chatDisplay.myGroups[key]);
            if(d(group) && group !== null && d(group.filters))
            {
                if(group.filters.length)
                {
                    for(var fkey in group.filters)
                    {
                        var isOnDomain = VisitorManager.IsOnDomain(_visitor, group.filters[fkey].text,false);
                        if(group.filters[fkey].ex == "Whitelist")
                        {
                            isFiltered = !isOnDomain;
                            if(!isFiltered)
                                break loop_groups;
                        }
                        else if(group.filters[fkey].ex == "Blacklist")
                        {
                            isFiltered = isOnDomain;
                            if(isFiltered)
                                break loop_groups;
                        }
                    }
                }
                else if(!d(group.members))
                {
                    isFiltered = false;
                    break;
                }
            }
        }
    return isFiltered;
};

VisitorFilterManager.IsVisitorGone = function(_visitor){
    return !_visitor.is_active;
};

VisitorFilterManager.IsVisitorNotLoaded = function(_visitor){
    return !_visitor.IsLoaded;
};

VisitorFilterManager.IsVisitorNotActive = function(_visitor){
    return !(VisitorManager.GetLastActiveTime(_visitor) > (lz_global_timestamp() + parseInt(Client.TimeDifference) - VisitorManager.ActiveTimeInSeconds));
};

VisitorFilterManager.IsVistorNotKnown = function(_visitor){
    return !d(_visitor.d) || !d(_visitor.d.f111) || _visitor.d.f111 == '';
};

VisitorFilterManager.IsVisitorNotRecurring = function(_visitor){
    return _visitor.vts < 2;
};

VisitorFilterManager.IsVisitorNotNew = function(_visitor){
    return _visitor.vts != 1;
};

VisitorFilterManager.IsVisitorNotOnWatchlist = function(_visitor){
    return !_visitor.IsOnWatchList;
};

VisitorFilterManager.IsVisitorNotInChat = function(_visitor){
    return !_visitor.IsInChat;
};

VisitorFilterManager.IsVisitorWithoutComments = function(_visitor){
    return !_visitor.c;
};

VisitorFilterManager.IsVisitorNotInCountry = function(_visitor,_filterId){
    var ctryEntry = VisitorFilterManager.GetValidCountryFilterId(_visitor.ctryi2);
    var isNotInCounty = d(_filterId) && (ctryEntry != _filterId);
    return d(_filterId) && (ctryEntry != _filterId);
};

VisitorFilterManager.IsVisitorPassingFilterSet = function(_visitor, _filterSet){
    for(var i in _filterSet)
    {
        if(_filterSet[i].Match(_visitor, _filterSet[i].id)){
            return false;
        }
    }
    return true;
};

VisitorFilterManager.GetValidCountryFilterId = function(_countryId){
    var ctryEntry = _countryId;
    if(!d(ctryEntry) || !ctryEntry.match(/^[A-Z]{2}/) || VisitorFilterManager.GetCountryNameOrUnknown(_countryId) == tid('unknown'))
        ctryEntry = 'unknown';
    return ctryEntry;
};

function NotificationManager(){

}

NotificationManager.LastSoundVisitor = 0;

NotificationManager.LastNotification = null;

NotificationManager.NotifyVisitor = function (_visitor){

    if(Client.LoginTime > (lz_global_timestamp()-10))
        return;

    if(LocalConfiguration.NotificationVisitors && !IFManager.IsMobileOS && CommunicationEngine.pollCounter > 1)
    {
        var name = VisitorManager.GetVisitorName(_visitor,56,true);

        if(!name.length)
            name = tid('new_visitor');

        var text = '';
        if(_visitor != null && _visitor.ctryi2.length && _visitor.city.length)
        {
            text = lzm_chatDisplay.getCountryName(_visitor.ctryi2,false) + ' / ' + _visitor.city;
        }
        else if(_visitor.ip.length)
            text = _visitor.ip;


        if(IFManager.IsDesktopApp())
        {
            IFManager.IFShowNotification(lzm_commonTools.htmlEntities(name), lzm_commonTools.htmlEntities(text), 'NONE', _visitor.i, _visitor.id, '6');
        }
        else if (lzm_chatDisplay.selected_view != 'external' || $('.dialog-window-container').length > 0)
        {
            NotificationManager.WebNotification({
                title:name,
                body:text,
                action:'SelectView(\'external\');'
            });

            /*
            lzm_displayHelper.showBrowserNotification({
            text: text,
            sender: name,
            action: 'SelectView(\'external\');',
            timeout: 10,
            color: '#74b924',
            icon: 'fa-user'

            });
            */
        }
    }

    if(LocalConfiguration.PlayVisitorSound && !IFManager.IsMobileOS && CommunicationEngine.pollCounter > 1)
    {
        if(NotificationManager.LastSoundVisitor < (lz_global_timestamp()-30))
        {
            NotificationManager.LastSoundVisitor = lz_global_timestamp();
            lzm_chatDisplay.playSound('visitor', _visitor.id, '');
        }
    }
 };

NotificationManager.NotifyChatMessage = function(chat,_new_chat){

    var senderId='';
    var sender = _new_chat.reco;

    if(_new_chat.reco == lzm_chatDisplay.myId)
        sender = _new_chat.sen;


    var receivingChat = _new_chat.rec;
    var text = _new_chat.textOriginal;

    receivingChat = (typeof receivingChat != 'undefined' && receivingChat != '') ? receivingChat : sender;
    text = (typeof text != 'undefined') ? text : '';

    if (LocalConfiguration.PlayChatMessageSound)
        lzm_chatDisplay.playSound('message', sender, text);

    var notificationSound = (!LocalConfiguration.PlayChatMessageSound) ? 'DEFAULT' : 'NONE';

    var senderName = '??', senderNameRaw = '??';
    if (chat.Type == Chat.Visitor && sender == chat.SystemId)
    {
        senderNameRaw = chat.GetName(56,true);
        senderName = chat.GetName(56,false);
    }
    else if(_new_chat.sen.indexOf('~')!=-1)
    {
        chat = DataEngine.ChatManager.GetChat(_new_chat.sen,'SystemId');
        if(chat != null)
        {
            senderNameRaw = chat.GetName(56,true);
            senderName = chat.GetName(56,false);
        }
    }
    else
    {
        senderId = sender;
        var operator = DataEngine.operators.getOperator(senderId);
        senderNameRaw = senderName = (operator != null) ? operator.name : senderName;
    }

    text = text.replace(/<.*?>/g,'').replace(/<\/.*?>/g,'');

    var actWindow = TaskBarManager.GetActiveWindow();
    var isActiveWindow = actWindow != null && actWindow.Tag == chat.SystemId;

    // desktop
    var notificationPush = tid('notification_new_message',[['<!--sender-->',senderName],['<!--text-->',text]]).substr(0, 250);
    if(IFManager.IsDesktopApp() && LocalConfiguration.NotificationChats)
    {
        if(!isActiveWindow || !CommonUIClass.WindowHasFocus())
            IFManager.IFShowNotification(senderName, text, notificationSound, sender, receivingChat, "1");
    }
    // mobile
    else if(!IFManager.IsDesktopApp() && IFManager.IsAppFrame)
    {
        IFManager.IFShowNotification(senderNameRaw, notificationPush, notificationSound, sender, receivingChat, "1");
    }
    // browser
    if(!IFManager.IsAppFrame)
        if(!isActiveWindow || !CommonUIClass.WindowHasFocus())
        {
            if(LocalConfiguration.NotificationChats)
            {
                NotificationManager.WebNotification({
                    title:senderNameRaw,
                    body:text,
                    requireInteraction: !LocalConfiguration.NotificationChatTimeoutEnabled,
                    action:'openChatFromNotification(\'' + receivingChat + '\');'});

                /*
                lzm_displayHelper.showBrowserNotification({
                    text: text,
                    sender: lzm_commonTools.SubStr(senderNameRaw,32,true),
                    subject: t('New Chat Message'),
                    action: 'openChatFromNotification(\'' + receivingChat + '\');',
                    timeout: 10,
                    icon: 'fa-commenting'
                });
                */
            }
        }
};

NotificationManager.NotifyNewChat = function(_chatObj){

    var notificationSound = LocalConfiguration.PlayChatSound ? 'NONE' : 'DEFAULT';
    var systemId = _chatObj.SystemId;
    var senderName = _chatObj.GetName(156,true);
    var notificationPushText = t('<!--sender--> wants to chat with you.', [['<!--sender-->', lzm_commonTools.htmlEntities(senderName)]]);
    var senderQuestion = '';

    if (_chatObj.Visitor != null)
    {
        senderQuestion = DataEngine.inputList.getInputValueFromVisitor(114,_chatObj.Visitor);
        senderQuestion = senderQuestion.length ? senderQuestion : tid('new_chat_request');
    }

    if(senderQuestion.length)
        notificationPushText = senderQuestion;

    // mobile
    if(IFManager.IsAppFrame)
        //always show on mobile
        if(LocalConfiguration.NotificationChats || !IFManager.IsDesktopApp())
            IFManager.IFShowNotification(t('LiveZilla'), notificationPushText, notificationSound, systemId, systemId, '0');

    if(!IFManager.IsAppFrame)
    {
        var actWindow = TaskBarManager.GetActiveWindow();
        if (!(actWindow != null && actWindow.Tag == systemId))
        {

            NotificationManager.WebNotification({
                title:senderName,
                body:senderQuestion,
                requireInteraction: !LocalConfiguration.NotificationChatTimeoutEnabled,
                action:'openChatFromNotification(\'' + systemId + '\');'});

            /*
            if(LocalConfiguration.NotificationChats)
                lzm_displayHelper.showBrowserNotification({
                    text: senderQuestion,
                    sender: senderName,
                    action: 'openChatFromNotification(\'' + systemId + '\');',
                    timeout: 10,
                    icon: 'fa-commenting'
                });
                */
        }
    }
};

NotificationManager.NotifyFeedback = function(_name){

    if(Client.LoginTime > (lz_global_timestamp()-10))
        return;

    if(LocalConfiguration.NotificationFeedbacks)
    {
        if(IFManager.IsDesktopApp())
            IFManager.IFShowNotification(t('LiveZilla'), tid('new_feedback'), 'NONE', _name, '', 4);
        else if(!IFManager.IsAppFrame)
        {
            NotificationManager.WebNotification({
                title:_name,
                body:tid('new_feedback'),
                requireInteraction: !LocalConfiguration.NotificationFeedbackTimeoutEnabled,
                action:'initFeedbacksConfiguration();'
            });

            //lzm_displayHelper.showBrowserNotification({text: tid('new_feedback'), sender: _name, subject: tid('new_feedback'),action: 'initFeedbacksConfiguration();',timeout: 10,icon: 'fa-star-o'});
        }
    }
};

NotificationManager.NotifyEmail = function(_text,_name,_pushText){

    if(Client.LoginTime > (lz_global_timestamp()-10))
        return;

    if (LocalConfiguration.PlayTicketSound)
        lzm_chatDisplay.playSound('ticket', 'tickets');

    if(LocalConfiguration.NotificationEmails)
    {
        if(IFManager.IsDesktopApp())
            IFManager.IFShowNotification('LiveZilla', _pushText, '', '', '', '3');
        else if(!IFManager.IsAppFrame)
            if (true || lzm_chatDisplay.selected_view != 'tickets')
            {
                NotificationManager.WebNotification({
                    title:_name,
                    body:_text,
                    requireInteraction: !LocalConfiguration.NotificationEmailTimeoutEnabled,
                    action:'SelectView(\'tickets\');'
                });

                //lzm_displayHelper.showBrowserNotification({text: _text, sender: _name,subject: tid('new_message'),action: 'SelectView(\'tickets\');',timeout: 10,icon: 'fa-envelope-open-o'});
            }
    }
};

NotificationManager.NotifyTicket = function(_text,_name,_pushText){

    if(Client.LoginTime > (lz_global_timestamp()-10))
        return;

    if (LocalConfiguration.PlayTicketSound)
        lzm_chatDisplay.playSound('ticket', 'tickets');

    if(LocalConfiguration.NotificationTickets)
    {
        var notificationSound = (LocalConfiguration.PlayTicketSound) ? 'NONE' : 'DEFAULT';
        if(IFManager.IsAppFrame)
        {
            if(IFManager.IsDesktopApp())
            {
                IFManager.IFShowNotification(_name, _text, notificationSound, '', '', '2');
            }
            else
                IFManager.IFShowNotification('LiveZilla', _pushText, notificationSound, '', '', '2');
        }
        else
            if (true || lzm_chatDisplay.selected_view != 'tickets')
            {
                NotificationManager.WebNotification({
                    title:_name,
                    body:_text,
                    requireInteraction: !LocalConfiguration.NotificationTicketTimeoutEnabled,
                    action:'SelectView(\'tickets\');'
                });

                //lzm_displayHelper.showBrowserNotification({text: _text, sender: _name, subject: tid('new_message'),action: 'SelectView(\'tickets\');',timeout: 10,icon: 'fa-envelope'});
            }
    }
};

NotificationManager.NotifyOperator = function(_operator){

    if(Client.LoginTime > (lz_global_timestamp()-10))
        return;

    if(LocalConfiguration.NotificationOperators && _operator.id != DataEngine.myId && DataEngine.myId != '')
    {
        var ntext = tid('operator_signed_on',[['<!--op_login_name-->',_operator.name]]);
        if(IFManager.IsDesktopApp())
            IFManager.IFShowNotification(_operator.name, ntext, 'NONE', '', '', '5');
        else if(!IFManager.IsAppFrame)
        {
            NotificationManager.WebNotification({
                title:_operator.name,
                body:ntext,
                requireInteraction: !LocalConfiguration.NotificationOperatorTimeoutEnabled,
                action:'OpenChatWindow(\''+_operator.id+'\');'
            });
            //lzm_displayHelper.showBrowserNotification({text: ntext, sender: _operator.name,subject: _operator.name,action: 'OpenChatWindow(\''+_operator.id+'\');',timeout: 10,icon: 'fa-user'});
        }
    }
};

NotificationManager.NotifyError = function(_errorMessage){

    if(Client.LoginTime > (lz_global_timestamp()-10))
        return;

    if(LocalConfiguration.NotificationErrors)
    {
        NotificationManager.WebNotification({
            title:"System",
            body:"PHP Error: " + _errorMessage,
            action:'showLogs();'
        });

        //lzm_displayHelper.showBrowserNotification({text: "PHP Error: " + _errorMessage, sender: "System", subject: '', action: 'showLogs();',timeout: 10,icon: 'fa-warning'});
    }
};

NotificationManager.WebNotification = function(_settings){

    Notification.requestPermission(function(result)
    {
        if (result === 'granted')
        {
            _settings.icon = 'img/icon512notify.png';
            _settings.tag = Math.random().toString()+'<||>'+_settings.action;

            if(!d(_settings.title))
                _settings.title = 'LiveZilla';

            _settings.body = _settings.body.replace(/(?:\r\n|\r|\n)/g, ' ');
            _settings.body = _settings.body.replace(/  /g, ' ');

            if(NotificationManager.LastNotification)
                if(NotificationManager.LastNotification.body == _settings.body)
                    if(NotificationManager.LastNotification.title == _settings.title)
                        return;

            //console.log(_settings);

            navigator.serviceWorker.ready.then(function(registration) {
                registration.showNotification(_settings.title, _settings);
            });

            NotificationManager.LastNotification = _settings;
        }
    });
};

function TaskBarWindow(){
    this.DialogId = '';
    this.TypeId = '';
    this.Minimized = false;
    this.Fullscreen = false;
    this.CloseButtonId = '';
    this.Title = '';
    this.TitleProgress = '';
    this.Icon = '';
    this.ShowInTaskBar = true;
    this.TaskBarIndex = 11111;
    this.TaskBarSorterIndex = '';
    this.HTMLCreated = false;
    this.Footer = null;
    this.Body = null;
    this.Header = null;
    this.Tag = '';
    this.StaticWindowType = false;
}

TaskBarWindow.prototype.GetTaskBarHTML = function(_minimizedView){

    var title,icon,txtClass='',acClass='task-bar-element lzm-unselectable',oncontext='this.click();return false;';
    var click = 'TaskBarManager.ClickElement(\''+this.DialogId+'\');';
    var av = '';

    title = (this.TitleProgress.length) ? this.TitleProgress : this.Title;

    if(!d(title))
        title = '';

    icon = '<i class="task-bar-icon fa fa-'+this.Icon+'"></i>';

    if(title.indexOf('visitor-info-status-indicator') != -1)
        title = lzm_commonTools.RemoveTags(title);

    if(_minimizedView)
        title = lzm_commonTools.SubStr(this.Title,8,true);

    acClass += (!this.Minimized) ? ' task-bar-element-active' : '';

    if(this.Tag != '')
    {
        var chatObj = DataEngine.ChatManager.GetChat(this.Tag);
        if(chatObj != null)
        {
            if(chatObj.Type == Chat.Visitor)
                if(chatObj.GetChatGroup() != null || (chatObj.WasInPublicChatGroup && chatObj.GetStatus() == Chat.Closed))
                    return '';

            if(chatObj.GetStatus() == Chat.Closed || (chatObj.Type == Chat.Visitor && !chatObj.IsMember(DataEngine.myId)))
                acClass += ' task-bar-element-offline lzm-clickable2';

            if(this.Minimized)
            {
                if(chatObj.Type == Chat.Visitor && !chatObj.IsAccepted() && chatObj.GetStatus() != Chat.Closed)
                    acClass += ' task-bar-element-open';
                else if(chatObj.IsUnread)
                    acClass += ' task-bar-element-unread';
            }

            if(LocalConfiguration.UIShowAvatars && !_minimizedView)
            {
                if(chatObj.Type == Chat.Operator)
                {
                    av = getAvatarURL('',chatObj.SystemId);
                    icon = '<span class="task-bar-avatar" style="background-image: url(\'' + av + '\') !important;"></span>';
                }
                else if(chatObj.Type == Chat.Visitor)
                {
                    av = getAvatarURL(title,'');
                    icon = '<span class="task-bar-avatar" style="background-image: url(\'' + av + '\') !important;"></span>';
                }
            }
            oncontext = (!IFManager.IsMobileOS) ? 'openChatLineContextMenu(\'' + chatObj.i + '\',\'task-bar-panel\', event);' : '';

            if(chatObj.IndicateTyping)
                title += ' ('+tidc('typing','...')+')';
        }
    }
    oncontext = click + oncontext;
    return '<div onclick="'+click+'" class="'+acClass+'" oncontextmenu="'+oncontext+'" style="'+av+'">'+icon+'<span'+txtClass+'>' + title + '</span><i onclick="TaskBarManager.Close(\''+this.DialogId+'\');event.stopPropagation();" class="task-bar-icon-close fa fa-times-circle"></i></div>';
};

TaskBarWindow.prototype.Minimize = function(_updateUI){
    _updateUI = (d(_updateUI)) ? _updateUI : true;
    ChatManager.SetActiveChat('');
    if(!this.Minimized)
    {
        this.Minimized = true;
        lzm_displayHelper.minimizeDialogWindow(this.DialogId, this.TypeId, lzm_chatDisplay.dialogData);

        if(_updateUI)
        {
            lzm_chatDisplay.UpdateViewSelectPanel();
            lzm_chatDisplay.RenderWindowLayout();
            lzm_chatDisplay.RenderTaskBarPanel();
        }
    }
};

TaskBarWindow.prototype.Maximize = function(){
    if(this.Minimized)
    {
        var actWin = TaskBarManager.GetActiveWindow();
        if(actWin != null)
            actWin.Minimize(false);

        this.Minimized = false;
        lzm_displayHelper.maximizeDialogWindow(this.DialogId);
    }
    this.ShowInTaskBar = true;
    lzm_chatDisplay.RenderTaskBarPanel();
    lzm_chatDisplay.RenderWindowLayout(true);
};

TaskBarWindow.prototype.Close = function(){

    var that=this;

    if(this.TypeId == 'chat-window')
    {
        var chat = DataEngine.ChatManager.GetChat(this.Tag);

        if(chat != null && chat.Type == Chat.Visitor)
        {
            if(chat.IsHost(lzm_chatDisplay.myId) && chat.GetStatus() != Chat.Open)
                if(DataEngine.getConfigValue('gl_ofct',false) == 1)
                {
                    if(!(d(chat.Tags) && chat.Tags.length))
                    {
                        ChatManager.SetTags(chat.i, '', that);
                        return;
                    }
                }
        }
    }

    TaskBarManager.ReturnToActiveWindowOnNextClose();
    if(this.Minimized)
    {
        this.Maximize();
    }
    ChatManager.SetActiveChat('');
    if(this.CloseButtonId != null)
        $('#'+ this.CloseButtonId).click();
    else
        TaskBarManager.RemoveActiveWindow();
};

function TaskBarManager(){

}

TaskBarManager.Windows = [];
TaskBarManager.WindowsHidden = [];
TaskBarManager.ToActiveWindowOnNextClose = null;

TaskBarManager.AddWindow = function(_typeId, _dialogId, _fullscreen, _closeButtonId, _title, _icon, _showInTaskBar, _taskBarIndex, _minimized, _tag, _searchBox){

    if(!_minimized)
        TaskBarManager.MinimizeAll();
    _closeButtonId = (d(_closeButtonId)) ? _closeButtonId : null;

    var tbw=null,existing = lzm_commonTools.GetElementByProperty(TaskBarManager.Windows,'DialogId',_dialogId);
    if(!existing.length)
    {
        tbw = new TaskBarWindow();
        tbw.TypeId = _typeId;
        tbw.DialogId = _dialogId;
        tbw.Fullscreen = _fullscreen;
        tbw.CloseButtonId = _closeButtonId;
        tbw.Title = _title;
        tbw.Icon = _icon;
        tbw.ShowInTaskBar = _showInTaskBar;
        tbw.TaskBarIndex = _taskBarIndex;
        tbw.Minimized = _minimized;
        tbw.Tag = _tag;
        tbw.SearchBox = _searchBox;

        TaskBarManager.Windows.push(tbw);
    }
    lzm_chatDisplay.RenderTaskBarPanel();
    lzm_chatDisplay.UpdateViewSelectPanel();
    return tbw;
};

TaskBarManager.GetWindow = function (_dialogId){
    for(var key in TaskBarManager.Windows)
        if(TaskBarManager.Windows[key].DialogId == _dialogId)
        {
            return TaskBarManager.Windows[key];
        }
    return null;
};

TaskBarManager.ReturnToActiveWindowOnNextClose = function(){
    TaskBarManager.ToActiveWindowOnNextClose = TaskBarManager.GetActiveWindow();
};

TaskBarManager.IsActiveChatWindow = function(){
    var acw = TaskBarManager.GetActiveWindow();
    return (acw != null && acw.TypeId == 'chat-window');
};

TaskBarManager.RemoveWindowByDialogId = function(_dialogId){

    var winObj = TaskBarManager.GetWindow(_dialogId);
    if(winObj != null)
    {
        $('#' + winObj.DialogId + '-container').remove();

        for(var key in TaskBarManager.Windows)
            if(TaskBarManager.Windows[key].DialogId == _dialogId)
            {
                TaskBarManager.Windows.splice(key,1);
            }

        lzm_chatDisplay.RenderTaskBarPanel();
        lzm_chatDisplay.RenderWindowLayout(true);
        lzm_chatDisplay.UpdateViewSelectPanel();
    }
};

TaskBarManager.ClickElement = function(_dialogId){

    var winObj = TaskBarManager.GetWindow(_dialogId);

    if(!(winObj != null && winObj.Minimized))
        return;

    if(winObj != null)
        winObj.Maximize();

    lzm_chatDisplay.RemoveAllContextMenus();
};

TaskBarManager.MinimizeAll = function(_except){

    for(var key in TaskBarManager.Windows)
    {
        var winObj = TaskBarManager.Windows[key];

        if(d(_except) && _except == winObj.DialogId)
            continue;

        winObj.Minimize();
    }
    if(lzm_chatDisplay.selected_view == 'tickets')
        DataEngine.userHasSeenCurrentTickets();
};

TaskBarManager.GetActiveWindow = function(){
    for(var key in TaskBarManager.Windows)
    {
        var winObj = TaskBarManager.Windows[key];
        if(!winObj.Minimized)
            return winObj;
    }
    return null;
};

TaskBarManager.Minimize = function(_dialogId){
    for(var key in TaskBarManager.Windows)
        if(TaskBarManager.Windows[key].DialogId == _dialogId)
        {
            var winObj = TaskBarManager.Windows[key];
            winObj.Minimize();
        }
};

TaskBarManager.Maximize = function(_dialogId){
    for(var key in TaskBarManager.Windows)
        if(TaskBarManager.Windows[key].DialogId == _dialogId)
        {
            var winObj = TaskBarManager.Windows[key];
            winObj.Maximize();
        }
};

TaskBarManager.Close = function(_dialogId){

    var winObj = TaskBarManager.GetWindow(_dialogId);
    if(winObj != null)
    {
        winObj.Close();
    }
};

TaskBarManager.RemoveActiveWindow = function(){

    DataEngine.userHasSeenCurrentTickets();
    var winObj = TaskBarManager.GetActiveWindow();
    if(winObj != null)
        TaskBarManager.RemoveWindowByDialogId(winObj.DialogId);

    if(TaskBarManager.ToActiveWindowOnNextClose != null)
    {
        TaskBarManager.ToActiveWindowOnNextClose.Maximize();
    }

    TaskBarManager.ToActiveWindowOnNextClose = null;
};

TaskBarManager.WindowExists = function(_dialogId,_maximize){
    for(var key in TaskBarManager.Windows)
        if(TaskBarManager.Windows[key].DialogId == _dialogId)
        {
            if(_maximize)
            {
                TaskBarManager.ClickElement(_dialogId);
            }
            return true;
        }
    return false;
};

TaskBarManager.GetWindowByTag = function(_tag){
    for(var key in TaskBarManager.Windows)
        if(TaskBarManager.Windows[key].Tag == _tag)
            return TaskBarManager.Windows[key];
    return null;
};

TaskBarManager.CloseOffline = function(){

    var close;
    for(var key in TaskBarManager.Windows)
    {
        close = false;
        var winObj = TaskBarManager.Windows[key];
        if(winObj.TypeId == 'chat-window')
        {
            var chatObj = DataEngine.ChatManager.GetChat(winObj.Tag);
            if(chatObj != null)
            {
                if(chatObj.GetStatus() == Chat.Closed || (chatObj.Type == Chat.Visitor && !chatObj.IsMember(DataEngine.myId)))
                    close = true;
                else if(chatObj.Type == Chat.Operator)
                {
                    var op = DataEngine.operators.getOperator(winObj.Tag);
                    if(op.status.toString() == '2')
                        close = true;
                }
            }

            if(close)
            {
                TaskBarManager.RemoveWindowByDialogId(winObj.DialogId);
                TaskBarManager.CloseOffline();
                return;
            }
        }
    }
    lzm_chatDisplay.RenderTaskBarPanel();
};