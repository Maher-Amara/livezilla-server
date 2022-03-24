/****************************************************************************************
 * LiveZilla FilterConfigurationClass.js
 *
 * Copyright 2017 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/

function FilterConfiguration() {
    this.showFilterListContextMenu = false;
}

FilterConfiguration.prototype.showFilterCreation = function(type, visitor, filter, ticket) {

    var parentWindow = TaskBarManager.GetActiveWindow();

    var headerString = tid('filter'), that = this;
    var visitorId = (visitor != null) ? visitor.id : '';
    var filterId = (filter != null) ? filter.filterid : '';

    if(type == 'edit')
        type = (filter != null && filter.t=="0") ? 'visitor' : 'email';

    if(filter != null && d(filter.filtername) && filter.filtername != '')
        headerString += ' (' + lzm_commonTools.htmlEntities(filter.filtername) + ')';

    var bodyString = '<div id="visitor-filter-placeholder"></div>';
    var footerString = lzm_inputControls.createButton('save-filter', '', '', t('Ok'), '', 'lr',{'margin-left': '4px'},'',30,'d') + lzm_inputControls.createButton('cancel-filter', '', '', t('Close'), '', 'lr',{'margin-left': '4px'},'',30,'d');
    var dialogData = {'visitor-id': visitorId, 'filter-id': filterId};

    if(TaskBarManager.GetWindow('visitor-filter' + filterId) != null)
    {
        TaskBarManager.GetWindow('visitor-filter' + filterId).Maximize();
        return;
    }

    lzm_commonDialog.CreateDialogWindow(headerString, bodyString, footerString, 'shield', 'visitor-filter', 'visitor-filter' + filterId,'cancel-filter', true, dialogData);

    var filterHtml = that.createVisitorFilterMainHtml(type, visitor, filter, ticket);
    var reasonHtml = that.createVisitorFilterReasonHtml(filter);
    var expirationHtml = that.createVisitorFilterExpirationHtml(filter);
    var tabArray = [{name: headerString, content: filterHtml}, {name: t('Expiration'), content: expirationHtml}];

    if(type=='visitor')
        tabArray.push({name: tid('reason'), content: reasonHtml});

    lzm_inputControls.createTabControl('visitor-filter-placeholder', tabArray);

    if(type=='visitor'){
        $('#filter-ip-check').click(function() {
            if ($('#filter-ip-check').prop('checked')) {
                $('#filter-ip').removeClass('ui-disabled');
            } else {
                $('#filter-ip').addClass('ui-disabled');
            }
        });
        $('#filter-id-check').click(function() {
            if ($('#filter-id-check').prop('checked'))
            {
                $('#filter-id').removeClass('ui-disabled');
            }
            else
            {
                $('#filter-id').addClass('ui-disabled');
            }
        });
        $('#filter-lg-check').click(function() {
            if ($('#filter-lg-check').prop('checked')) {
                $('#filter-lg').removeClass('ui-disabled');
            } else {
                $('#filter-lg').addClass('ui-disabled');
            }
        });
        $('#filter-co-check').click(function() {
            if ($('#filter-co-check').prop('checked')) {
                $('#filter-co').removeClass('ui-disabled');
            } else {
                $('#filter-co').addClass('ui-disabled');
            }
        });
    }

    if(type=='email'){
        $('#filter-email-check').change(function() {
            if ($('#filter-email-check').prop('checked')) {
                $('#filter-email').removeClass('ui-disabled');
            } else {
                $('#filter-email').addClass('ui-disabled');
            }
        });
        $('#filter-email-check').change();
        $('#filter-subject-check').change(function() {
            if ($('#filter-subject-check').prop('checked')) {
                $('#filter-subject').removeClass('ui-disabled');
            } else {
                $('#filter-subject').addClass('ui-disabled');
            }
        });
        $('#filter-subject-check').change();
    }

    $('#filter-exp-check').change(function() {
        if ($('#filter-exp-check').prop('checked')) {
            $('#filter-expire-after').removeClass('ui-disabled');
        } else {
            $('#filter-expire-after').addClass('ui-disabled');
        }
    });
    $('#filter-exp-check').change();


    $('#cancel-filter').click(function() {
        TaskBarManager.RemoveActiveWindow();
        if(parentWindow != null)
            parentWindow.Maximize();
    });
    $('#save-filter').click(function() {
        if (visitor != null || (visitor == null && filter == null))
            FilterConfiguration.SaveFilter('add',type);
        else if (filter != null)
            FilterConfiguration.SaveFilter('edit',type);

        $('#cancel-filter').click();
        var loadingHtml = '<div id="filter-list-loading"><div class="lz_anim_loading"></div></div>';
        $('#filter_list_dialog-body').append(loadingHtml).trigger('create');
        $('#filter-list-loading').css({position: 'absolute', left: '0px', top: '0px', bottom: 0, right:0,'background-color': '#fff', 'z-index': 1000});
    });

    UIRenderer.resizeFilterCreation();
};

FilterConfiguration.prototype.createVisitorFilterMainHtml = function(type, visitor, filter, ticket) {
    var visitorIp = (visitor != null) ? visitor.ip : (filter != null) ? filter.ip : '0.0.0.0';
    var visitorId = (visitor != null) ? visitor.id : (filter != null) ? filter.userid : '';
    var userIdChecked = ((filter != null && filter.userid != '') || (filter == null && visitor != null)) ? ' checked="checked"' : '';
    var userIpChecked = ((visitor != null && visitor.ip != '') || (filter != null && filter.ip != '' && filter.ip != '0.0.0.0') || (visitor == null && filter == null)) ? ' checked="checked"' : '';
    var languagesChecked = (filter != null && filter.languages != '') ? ' checked="checked"' : '';
    var countriesChecked = (filter != null && filter.c != '') ? ' checked="checked"' : '';
    var emailSubject = (filter != null && d(filter.s)) ? filter.s : '';
    var emailEmail = (filter != null && d(filter.e)) ? filter.e : '@';

    if(ticket != null)
        for(var mi in ticket.messages)
            if(ticket.messages[mi].t != 1)
            {
                if(emailSubject == '' && ticket.messages[mi].s != '')
                    emailSubject = ticket.messages[mi].s;
                if(emailEmail == '@' && ticket.messages[mi].em != '')
                    emailEmail = ticket.messages[mi].em;
            }

    var emailChecked = (emailEmail.length > 1) ? ' checked="checked"' : '';
    var emailSubjectChecked = (emailSubject != '' && ticket == null) ? ' checked="checked"' : '';
    var visitorName = VisitorManager.GetVisitorName(visitor);
    var filterName = (filter != null && d(filter.filtername)) ? filter.filtername : (visitorName != '') ? visitorName : '-';
    var filterId = (filter != null) ? filter.filterid : '';
    var filterLanguages = (filter != null && typeof filter.languages != 'undefined') ? filter.languages.toUpperCase() : '';
    var filterCountries = (filter != null && typeof filter.c != 'undefined') ? filter.c.toUpperCase() : '';
    var selectedType = (filter != null && filter.exertion == 1) ? ' selected="selected"' : '';
    var filterActive = ((filter != null && filter.active == 1) || filter == null) ? ' checked="checked"' : '';
    var appliesChatsChecked = (filter == null || filter.ac == 0) ? ' checked="checked"' : '';
    var appliesTicketsChecked = (filter == null || filter.at == 0) ? ' checked="checked"' : '';
    var appliesMonitoringChecked = (filter == null || filter.atr == 0) ? ' checked="checked"' : '';
    var visitorIdDisabled = (userIdChecked.length==0) ? ' ui-disabled' : '';
    var visitorIpDisabled = (filter != null && (filter.ip == '' || filter.ip == '0.0.0.0')) ? ' ui-disabled' : '';
    var languagesDisabled = (filter == null || filter.languages == '') ? ' ui-disabled' : '';
    var countriesDisabled = (filter == null || filter.c == '') ? ' ui-disabled' : '';
    var tliCode = t('Two letter ISO codes');
    var iso639Link = '<a href="#" class="lz_chat_link_no_icon" onclick="openLink(\'http://en.wikipedia.org/wiki/List_of_ISO_639-1_codes\');">' + tliCode + '</a>';
    var iso3166Link = '<a href="#" class="lz_chat_link_no_icon" onclick="openLink(\'http://en.wikipedia.org/wiki/ISO_3166-1_alpha-2#Officially_assigned_code_elements\');">' + tliCode + '</a>';
    var leftColumnWidth = 110;

    var filterHtml = '<div class="lzm-tab-scroll-content">';


    filterHtml += '<fieldset class="lzm-fieldset" id="visitor-filter-main"><legend>'+tid('filter')+'</legend>' +
        '<input type="hidden" value="' + filterId + '" id="filter-filterid" />' +
        '<table id="visitor-filter-main-table">' +
        '<tr><td colspan="2">' +
        '<span><input type="checkbox" class="checkbox-custom" id="filter-active" '+filterActive+' />' +
        '<label for="filter-active" class="checkbox-custom-label">' + t('Filter active') + '</label></span></td></tr><tr class="top-space">' +
        '<td style="width: ' + leftColumnWidth + 'px !important; white-space: nowrap;"><span>' + t('Filter Name:') + '</span></td>' +
        '<td>' +
        '<span><input type="text" id="filter-name" value="' + filterName + '" /></span></td>' +
        '</tr><tr class="top-space-half">' +
        '<td style="white-space: nowrap;"><span>' + t('Filter Type:') + '</span></td>' +
        '<td>' +
        '<span><select id="filter-type">' +
        '<option value="0">' + tid('blacklist') + '</option>' +
        '<option value="1"' + selectedType + '>' + tid('whitelist') + '</option>' +
        '</select></span></td>' +
        '</tr>' +
        '</table></fieldset>';

    if(type =='email')
        filterHtml+= '<fieldset class="lzm-fieldset" id="email-filter-base">' +
            '<legend>' + tid('criteria') + '</legend>' +
            '<table id="email-filter-base-table">' +
            '<tr>' +
            '<td style="width: ' + leftColumnWidth + 'px !important; white-space: nowrap;">' +
            '<span><input type="checkbox" class="checkbox-custom" id="filter-email-check"' + emailChecked + ' />' +
            '<label for="filter-email-check" class="checkbox-custom-label">' + tidc('email') + '</label></span></td>' +
            '<td>' +
            '<input type="text" id="filter-email" value="' + emailEmail + '" /></td>' +
            '<td><div class="lzm-info-text left-space">' + t('Use * as wildcard') + '</div></td>' +
            '</tr><tr class="top-space-half"><td>' +
            '<span><input style="vertical-align: middle;" type="checkbox" class="checkbox-custom" id="filter-subject-check"' + emailSubjectChecked + ' />' +
            '<label for="filter-subject-check" class="checkbox-custom-label"' + '>' + tidc('subject') + '</label></span></td>' +
            '<td><span><input type="text" id="filter-subject" value="' + emailSubject + '" /></span></td>' +
            '<td><div class="lzm-info-text left-space">' + t('Use * as wildcard') + '</div></td>' +
            '</tr></table></fieldset>';


    if(type =='visitor')
        filterHtml+= '<fieldset class="lzm-fieldset" id="visitor-filter-base">' +
            '<legend>' + t('Based On') + '</legend>' +
            '<table id="visitor-filter-base-table">' +
            '<tr>' +
            '<td style="width: ' + leftColumnWidth + 'px !important; white-space: nowrap;">' +
            '<span><input style="vertical-align: middle;" type="checkbox" class="checkbox-custom" id="filter-ip-check"' + userIpChecked + ' />' +
            '<label for="filter-ip-check" class="checkbox-custom-label">' + t('IP Address:') + '</label></span><br /></td>' +
            '<td>' +
            '<input type="text" class="lzm-filter-input-main' + visitorIpDisabled + '" id="filter-ip" value="' + visitorIp + '" /></td>' +
            '<td><div class="lzm-info-text left-space">' + t('Use * as wildcard') + '</div></td>' +
            '</tr><tr class="top-space-half">' +
            '<td>' +
            '<span><input style="vertical-align: middle;" type="checkbox" class="checkbox-custom" id="filter-id-check"' + userIdChecked + ' />' +
            '<label for="filter-id-check" class="checkbox-custom-label"' + '>' + tidc('user_id') + '</label></span></td>' +
            '<td colspan="2">' +
            '<span><input type="text" class="lzm-filter-input-main' + visitorIdDisabled + '" id="filter-id" value="' + visitorId + '" /></span></td>' +
            '</tr><tr class="top-space-half"><td>' +
            '<span><input style="vertical-align: middle;" type="checkbox" class="checkbox-custom" id="filter-lg-check"' + languagesChecked + ' />' +
            '<label for="filter-lg-check" class="checkbox-custom-label">' + tidc('languages') + '</label></span>' +
            '</td><td>' +
            '<span><input type="text" class="lzm-filter-input-main' + languagesDisabled + '" id="filter-lg" value="' + filterLanguages + '" /></span>' +
            '</td><td><div class="lzm-info-text left-space">' + t('comma separated, <!--link-->', [['<!--link-->', iso639Link]]) + '</div></td>' +
            '</tr><tr class="top-space-half"><td>' +
            '<span><input style="vertical-align: middle;" type="checkbox" class="checkbox-custom" id="filter-co-check"' + countriesChecked + ' />' +
            '<label for="filter-co-check" class="checkbox-custom-label">' + t('Countries:') + '</label></span>' +
            '</td><td>' +
            '<span><input type="text" class="lzm-filter-input-main' + countriesDisabled + '" id="filter-co" value="' + filterCountries + '" />' +
            '</span></td><td><div class="lzm-info-text left-space">' + t('comma separated, <!--link-->', [['<!--link-->', iso3166Link]]) + '</div></td>' +
            '</tr></table>' +
            '</fieldset><fieldset class="lzm-fieldset" id="visitor-filter-applies">' +
            '<legend>' + t('Applies to') + '</legend>' +
            '<table id="visitor-filter-applies-table">' +
            '<tr><td><span>' +
            '<input style="vertical-align: middle;" type="checkbox" class="checkbox-custom" id="filter-chat-check"' + appliesChatsChecked + ' />' +
            '<label for="filter-chat-check" class="checkbox-custom-label">' + t('Chats') + '</label>' +
            '</span></td></tr>' +
            '<tr><td><span>' +
            '<input style="vertical-align: middle;" type="checkbox" class="checkbox-custom" id="filter-ticket-check"' + appliesTicketsChecked + ' />' +
            '<label for="filter-ticket-check" class="checkbox-custom-label">' + t('Tickets') + '</label>' +
            '</span></td></tr>' +
            '<tr><td><span>' +
            '<input style="vertical-align: middle;" type="checkbox" class="checkbox-custom" id="filter-monitoring-check"' + appliesMonitoringChecked + ' />' +
            '<label for="filter-monitoring-check" class="checkbox-custom-label">' + tid('monitoring') + '</label>' +
            '</span></td></tr>' +
            '</table></fieldset>';

    filterHtml += '</div>';

    return filterHtml;
};

FilterConfiguration.prototype.createVisitorFilterReasonHtml = function(filter) {
    var reason = (filter != null) ? filter.reason : '';
    var filterHtml = '<div class="lzm-tab-scroll-content"><fieldset class="lzm-fieldset" id="visitor-filter-reason"><legend>'+tid('reason')+'</legend>';
    filterHtml += lzm_inputControls.createArea('filter-reason',reason,'',tid('ban_reason'));
    filterHtml += '</fieldset></div>';
    return filterHtml;
};

FilterConfiguration.prototype.createVisitorFilterExpirationHtml = function(filter) {

    var expirationTime = (filter != null) ? Math.floor(parseInt(filter.expires) / 86400) : 7;

    if(expirationTime == -1)
        expirationTime = 0;

    var filterHtml = '<div class="lzm-tab-scroll-content"><fieldset class="lzm-fieldset" id="visitor-filter-expiration"><legend>'+tid('expiration')+'</legend>' +
        '<div>' +
        '<input type="checkbox" class="checkbox-custom" id="filter-exp-check"'+(expirationTime > 0 ? ' checked="checked"' : '')+' />' +
        '<label for="filter-exp-check" class="checkbox-custom-label">' + t('Expire after') + '</label>' +
        '&nbsp;&nbsp;<input type="text" style="width: 40px;" id="filter-expire-after"' +
        ' value="' + expirationTime + '" />&nbsp;&nbsp;' + t('days') +
        '</div>' +
        '</fieldset></div>';
    return filterHtml;
};

FilterConfiguration.prototype.showFilterList = function() {
    var externalIsDisabled = (lzm_chatDisplay.myGroups.length > 0);
    for (var i=0; i<lzm_chatDisplay.myGroups.length; i++) {
        var myGr = DataEngine.groups.getGroup(lzm_chatDisplay.myGroups[i]);
        if (myGr != null && myGr.external == '1') {
            externalIsDisabled = false;
        }
    }
    var disabledClass = (externalIsDisabled) ? 'ui-disabled' : '';
    var headerString = t('Filters');
    var footerString =
        lzm_inputControls.createButton('add-visitor-filter-btn', disabledClass, '', tid('new_visitor_filter'), '<i class="fa fa-plus"></i>', 'lr',{'margin-left': '4px'},'',30,'d') +
            lzm_inputControls.createButton('add-email-filter-btn', disabledClass, '', tid('new_email_filter'), '<i class="fa fa-plus"></i>', 'lr',{'margin-left': '4px'},'',30,'d') +
            lzm_inputControls.createButton('close-filters', '', '', t('Close'), '', 'lr',{'margin-left': '4px'},'',30,'d');

    var bodyString = this.createFilterListHtml();
    lzm_commonDialog.CreateDialogWindow(headerString, bodyString, footerString, 'shield', 'filter-list', 'filter_list_dialog','close-filters');
    UIRenderer.resizeFilterList();

    $('#add-visitor-filter-btn').click(function() {
        showFilterCreation('visitor','','','', true);
    });
    $('#add-email-filter-btn').click(function() {
        showFilterCreation('email','','','', true);
    });
    $('#close-filters').click(function() {
        TaskBarManager.RemoveActiveWindow();
    });
};

FilterConfiguration.prototype.updateFilterList = function() {
    if ($('#filter_list_dialog-body').length > 0)
        $('#filter_list_dialog-body').html(this.createFilterListHtml());
};

FilterConfiguration.prototype.createFilterListHtml = function() {
    var filterList = DataEngine.filters.getFilterList();
    var bodyString = '<table class="visible-list-table alternating-rows-table lzm-unselectable" id="filters-table"><thead><tr>' +
        '<th></th><th></th><th></th>' +
        '<th>' + t('Filter Name') + '</th><th>' + t('Criteria') + '</th><th>' + tid('operator') + '</th><th class="text-center">' + t('Created') + '</th><th class="text-center">' + t('Expires') + '</th>' +
        '</tr></thead><tbody>';
    for (var i=0; i<filterList.length; i++) {
        var criteria = [];
        if (filterList[i].ip != '' && filterList[i].ip != '0.0.0.0')
            criteria.push(t('IP address'));

        if (filterList[i].userid != '')
            criteria.push(t('User ID'));

        if (filterList[i].languages != '')
            criteria.push(t('Language'));

        if (filterList[i].c != '')
            criteria.push(t('Country'));

        if (filterList[i].s != '')
            criteria.push(tid('subject'));

        if (filterList[i].e != '')
            criteria.push(tid('email'));

        criteria = criteria.join(', ');
        var creator = DataEngine.operators.getOperator(filterList[i].creator);
        var editor = DataEngine.operators.getOperator(filterList[i].editor);
        var opStr = '';
        if (creator != null)
            opStr += creator.name;
        var edTime = lzm_chatTimeStamp.getLocalTimeObject(parseInt(filterList[i].edited * 1000), true);
        var edString = lzm_commonTools.getHumanDate(edTime, 'date', lzm_chatDisplay.userLanguage);

        if (editor != null)
            opStr = editor.name;

        var exTime = lzm_chatTimeStamp.getLocalTimeObject((parseInt(filterList[i].created) + parseInt(filterList[i].expires)) * 1000, true);
        var exString = lzm_commonTools.getHumanDate(exTime, 'date', lzm_chatDisplay.userLanguage);
        var bwIcon = (filterList[i].exertion == 0) ? '<i class="fa fa-sign-in icon-red"></i>' : '<i class="fa fa-sign-out icon-green"></i>';
        var tyIcon = (filterList[i].t==1) ? '<i class="fa fa-envelope"></i>' : '<i class="fa fa-user"></i>';
        var activeIcon = (filterList[i].active == 0) ? '<i class="fa fa-ban"></i>' : '<i class="fa fa-check-circle icon-green"></i>';
        var onclickAction = ((!IFManager.IsAppFrame && !IFManager.IsMobileOS) || IFManager.IsDesktopApp()) ? ' onclick="selectFiltersLine(event, \'' + filterList[i].filterid + '\');"' : ' onclick="openFiltersListContextMenu(event, \'' + filterList[i].filterid + '\');"';
        var onconetxtMenuAction = ((!IFManager.IsAppFrame && !IFManager.IsMobileOS) || IFManager.IsDesktopApp()) ? ' oncontextmenu="openFiltersListContextMenu(event, \'' + filterList[i].filterid + '\');"' : '';
        var ondblclickAction =  ((!IFManager.IsAppFrame && !IFManager.IsMobileOS) || IFManager.IsDesktopApp()) ? ' ondblclick="showFilterCreation(\'edit\',\'\', \'\', \'' + filterList[i].filterid + '\', true);"' : '';
        bodyString += '<tr class="filters-list-line" id="filters-list-line-' + filterList[i].filterid + '" style="cursor: pointer;"' +
            onclickAction + onconetxtMenuAction + ondblclickAction + '>' +
            '<td class="icon-column">'+activeIcon+'</td>' +
            '<td class="icon-column text-center">'+bwIcon+'</td>' +
            '<td class="icon-column text-center">'+tyIcon+'</td>' +
            '<td>' + lzm_commonTools.htmlEntities(filterList[i].filtername) + '</td>' +
            '<td>' + criteria + '</td>' +
            '<td>' + opStr + '</td>' +
            '<td class="text-center">' + edString + '</td>' +
            '<td class="text-center">' + exString + '</td>' +
            '</tr>';
    }
    bodyString += '</tbody></table>';

    return bodyString;
};

FilterConfiguration.prototype.showFilterCreationForm = function(type, visitorId, chatId, filterId, inDialog, ticketId) {
    removeFiltersListContextMenu();
    if (!PermissionEngine.checkUserPermissions(lzm_chatDisplay.myId, 'chats', 'create_filter', {}))
        showNoPermissionMessage();
    else
    {
        var visitor = null, filter = null, ticket=null;
        inDialog = (d(inDialog)) ? inDialog :  false;

        if (d(chatId) && chatId != '')
        {
            var chat = DataEngine.ChatManager.GetChat(chatId);
            visitor  = chat.Visitor;
        }
        else if (d(visitorId) && visitorId != '')
        {
            visitor = VisitorManager.GetVisitor(visitorId, 'id');

            if(visitor == null && type == 'visitor')
                visitor = {id:visitorId,ip:''};
        }

        if (d(filterId) && filterId != '')
            filter = DataEngine.filters.getFilter(filterId);

        if (d(ticketId) && ticketId != '')
            ticket = lzm_chatDisplay.ticketDisplay.GetTicketById(ticketId);

        if (inDialog)
            removeFiltersListContextMenu();

        this.showFilterCreation(type, visitor, filter, ticket, inDialog);
    }
};

FilterConfiguration.prototype.deleteFilter = function(filterId) {
    removeFiltersListContextMenu();
    if (!PermissionEngine.checkUserPermissions(lzm_chatDisplay.myId, 'chats', 'create_filter', {}))
        showNoPermissionMessage();
    else
    {
        lzm_commonDialog.createAlertDialog(tid('remove_items'), [{id: 'ok', name: t('Ok')}, {id: 'cancel', name: t('Cancel')}]);
        $('#alert-btn-ok').click(function()
        {
            var loadingHtml = '<div id="filter-list-loading"><div class="lz_anim_loading"></div></div>';
            $('#filter_list_dialog-body').append(loadingHtml).trigger('create');
            $('#filter-list-loading').css({position: 'absolute',left: 0, top: 0, right:0, bottom:0,'background-color': '#ffffff', 'z-index': 1000});

            var filter = DataEngine.filters.getFilter(filterId);
            if (filter != null) {
                var postDataObject = {creator: filter.creator, editor: filter.editor, vip: filter.ip, vid: filter.userid,
                    expires: filter.expires, fname: filter.filtername, freason: filter.reason, fid: filter.filterid,
                    state: filter.active, type: 2, exertion: filter.exertion, lang: filter.languages, countries: filter.c,
                    allow_chats: filter.ac, allow_tickets: filter.at, allow_monitoring: filter.atr};
                CommunicationEngine.pollServerSpecial(postDataObject, 'visitor-filter');
            }
            lzm_commonDialog.removeAlertDialog();
        });
        $('#alert-btn-cancel').click(function() {
            lzm_commonDialog.removeAlertDialog();
        });
    }
}

FilterConfiguration.prototype.openFiltersListContextMenu = function(e, filterId) {
    e.preventDefault();
    selectFiltersLine(e, filterId);
    if (this.showFilterListContextMenu)
    {
        removeFiltersListContextMenu();
    }
    else
    {
        var filter = DataEngine.filters.getFilter(filterId);
        if (filter != null) {
            e.stopPropagation();
            this.showFilterListContextMenu = true;
            var scrolledDownY = $('#filter_list_dialog-body').scrollTop();
            var scrolledDownX = $('#filter_list_dialog-body').scrollLeft();
            var parentOffset = $('#filter_list_dialog-body').offset();
            var yValue = e.pageY - parentOffset.top + scrolledDownY;
            var xValue = e.pageX - parentOffset.left + scrolledDownX;
            lzm_chatDisplay.showContextMenu('filter_list_dialog', filter, xValue, yValue);
        }
    }
};

FilterConfiguration.prototype.createFilterListContextMenu = function(myObject) {
    var contextMenuHtml = '';
    contextMenuHtml += '<div onclick="showFilterCreation(\'visitor\',\'\', \'\', \'\', true);"><span id="new-visitor-filter" class="cm-line cm-click">' + tid('new_visitor_filter') + '</span></div>';
    contextMenuHtml += '<div onclick="showFilterCreation(\'email\',\'\', \'\', \'\', true);"><span id="new-email-filter" class="cm-line cm-click">' + tid('new_email_filter') + '</span></div>';
    contextMenuHtml += '<div onclick="showFilterCreation(\'edit\',\'\', \'\', \'' + myObject.filterid + '\', true);">' + '<span id="edit-filter" class="cm-line cm-click">' + t('Edit Filter') + '</span></div><hr />';
    contextMenuHtml += '<div onclick="deleteFilter(\'' + myObject.filterid + '\');"><span id="remove-filter" class="cm-line cm-click">' + tid('remove') + '</span></div>';
    return contextMenuHtml;
};

FilterConfiguration.SaveFilter = function(type,filterType) {
    type = (type == 'add') ? 0 : (type == 'edit') ? 1 : 2;
    var filterId = (type == 0) ? md5(Math.random().toString()) : $('#filter-filterid').val();
    var activeCheck = ($('#filter-active').attr('checked') == 'checked') ? 1 : 0;
    var expires = (!isNaN(parseInt($('#filter-expire-after').val()))) ? parseInt($('#filter-expire-after').val()) : 7;
    expires = expires * 24 * 60 * 60;
    expires = ($('#filter-exp-check').attr('checked') == 'checked' && expires > 0) ? expires : -1;

    var userIp = '', filterReason = '', languages = '', countries = '', email = '', subject = '', userId ='';
    var allowChats = 0, allowTickets = 0, allowMonitoring = 0;

    if(filterType=='visitor'){
        var ipCheck = ($('#filter-ip-check').attr('checked') == 'checked') ? 1 : 0;
        var idCheck = ($('#filter-id-check').attr('checked') == 'checked') ? 1 : 0;
        var lgCheck = ($('#filter-lg-check').attr('checked') == 'checked') ? 1 : 0;
        var coCheck = ($('#filter-co-check').attr('checked') == 'checked') ? 1 : 0;
        allowChats = ($('#filter-chat-check').attr('checked') == 'checked') ? 0 : 1;
        allowTickets = ($('#filter-ticket-check').attr('checked') == 'checked') ? 0 : 1;
        allowMonitoring = ($('#filter-monitoring-check').attr('checked') == 'checked') ? 0 : 1;
        languages = (lgCheck == 1) ? $('#filter-lg').val().replace(/ +/g, '').toUpperCase() : '';
        countries = (coCheck == 1) ? $('#filter-co').val().replace(/ +/g, '').toUpperCase() : '';
        userId = (idCheck == 1) ? $('#filter-id').val() : '';
        userIp = (ipCheck == 1) ? $('#filter-ip').val() : '';
        filterReason = $('#filter-reason').val();
    }

    if(filterType=='email'){
        var emailCheck = ($('#filter-email-check').attr('checked') == 'checked') ? 1 : 0;
        var subjectCheck = ($('#filter-subject-check').attr('checked') == 'checked') ? 1 : 0;
        email = (emailCheck == 1 && $('#filter-email').val().length > 1) ? $('#filter-email').val() : '';
        subject = (subjectCheck == 1) ? $('#filter-subject').val() : '';
    }

    var filter = {
        creator: lzm_chatDisplay.myId,
        editor: lzm_chatDisplay.myId,
        vip: userIp,
        vid: userId,
        expires: expires,
        fname: $('#filter-name').val(),
        freason: filterReason, fid: filterId,
        state: activeCheck,
        type: type,
        exertion: $('#filter-type').val(),
        lang: languages,
        countries: countries,
        allow_chats: allowChats,
        allow_tickets: allowTickets,
        allow_monitoring: allowMonitoring,
        subject: subject, email:email,
        filterType:((filterType=='email')?'1':'0')};

    CommunicationEngine.pollServerSpecial(filter, 'visitor-filter');
};




