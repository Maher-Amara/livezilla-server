/****************************************************************************************
 * LiveZilla ChatVisitorClass.js
 *
 * Copyright 2017 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/

function ChatVisitorClass() {
    this.TreeviewWidth = 250;
    this.UIInitialized = false;
    this.lastDrawnId = '';
    this.lastFullscreen = this.isFullScreenMode();
    VisitorFilterManager.InitFiltersForHeadlineCounting();
}

ChatVisitorClass.VisitorInformationId = '';
ChatVisitorClass.SelectedVisitor = '';
ChatVisitorClass.LastListUpdate = 0;
ChatVisitorClass.LastTimestampUpdate = 0;
ChatVisitorClass.VisitorListCreated = false;
ChatVisitorClass.ChatInviteEditor = null;

ChatVisitorClass.prototype.ResetVisitorList = function(_full) {
    if(_full)
    {
        VisitorManager.DUTVisitorBrowserEntrance = 0;
        VisitorManager.DUTVisitorBrowserURLs = 0;
        VisitorManager.DUTVisitors = 0;
        VisitorManager.Visitors = [];
    }
    ChatVisitorClass.LastListUpdate = 0;
    ChatVisitorClass.LastTimestampUpdate = 0;
    VisitorManager.needsUIupdate = true;
    ChatVisitorClass.VisitorListCreated = false;
    for(var key in VisitorManager.Visitors)
        VisitorManager.Visitors[key].is_drawn = false;
    this.UpdateVisitorMonitorUI();
};

ChatVisitorClass.prototype.UpdateVisitorMonitorUI = function(_userInput, _updateTableOnResize) {

    var updatedWithinLast10Seconds = ChatVisitorClass.LastListUpdate > (lz_global_timestamp()-10);
    if(updatedWithinLast10Seconds && !VisitorManager.needsUIupdate && !_userInput)
        return;

    lzm_chatDisplay.UpdateViewSelectPanel();

    if(lzm_chatDisplay.selected_view != 'external' || TaskBarManager.GetActiveWindow() != null)
    {
        ChatVisitorClass.LastListUpdate = lz_global_timestamp();
        return;
    }

    if(_userInput)
        VisitorFilterManager.CountVisitors();

    ChatVisitorClass.LastListUpdate = lz_global_timestamp();
    VisitorFilterManager.DoFilter();

    var visitors = VisitorManager.Visitors;

    if (ChatVisitorClass.VisitorListCreated){
        this.UpdateVisitorMonitoringHeadline();
        this.UpdateVisitors(_userInput,_updateTableOnResize);
        this.UpdateMap();
        this.UpdateTreeview();
        this.UpdateVisitorTimestampCells();
    } else {
        this.CreateVisitorMonitoringHeadline();
        this.CreateVisitors();
        this.CreateMap();
        if(!VisitorManager.IsTreeviewCreated)
            this.CreateTreeview();
    }

    VisitorManager.needsUIupdate = false;

    this.AnimateVisitorChanges();
    $('#visitor-list-table').find('thead').children('tr').first().children().unbind("contextmenu").contextmenu(function(){
        var cm = {id: 'visitors_header_cm',entries: [{label: tid('settings'),onClick : 'LocalConfiguration.__OpenTableSettings(\'visitors\')'}]};
        ContextMenuClass.BuildMenu(event,cm);
        return false;
    });
};

ChatVisitorClass.prototype.CreateTableHeadline = function(){
    var tableHeadlineString = '<thead><tr>';
    tableHeadlineString += '<th class="visitor_col_header">&nbsp;&nbsp;&nbsp;</th>';
    tableHeadlineString += '<th class="visitor_col_header">&nbsp;&nbsp;&nbsp;</th>';
    tableHeadlineString += '<th class="visitor_col_header">&nbsp;&nbsp;&nbsp;</th>';

    for (var i in LocalConfiguration.TableColumns.visitor)
        if (LocalConfiguration.TableColumns.visitor[i].display == 1)
        {
            tableHeadlineString += '<th class="visitor_col_header inactive-sort-column">' + t(LocalConfiguration.TableColumns.visitor[i].title) ;
            if(LocalConfiguration.TableColumns.visitor[i].cid=='online')
                tableHeadlineString += '&nbsp;&nbsp;&nbsp;<span class="table-sort-icon"><i class="fa fa-caret-up"></i></span>';
            tableHeadlineString += '</th>';
        }
    tableHeadlineString += '</tr></thead>';
    return tableHeadlineString;
};

ChatVisitorClass.prototype.CreateVisitors = function (){
    var extUserHtmlString = '<table id="visitor-list-table" class="visible-list-table alternating-rows-table lzm-unselectable">';
    var localFullscreen = this.isFullScreenMode();
    if (localFullscreen)
        extUserHtmlString += this.CreateTableHeadline();
    extUserHtmlString += '<tbody id="visitor-list-body">';
    var visitors = VisitorManager.Visitors;
    for (var j in visitors)
    {
        if(!visitors[j].IsLoaded)
        {
            continue;
        }
        extUserHtmlString += this.CreateVisitor(visitors[j], localFullscreen);
    }

    extUserHtmlString += '</tbody></table>';
    $('#visitor-list-table-div').html(extUserHtmlString);
    ChatVisitorClass.VisitorListCreated = true;
};

ChatVisitorClass.prototype.CreateVisitor = function (_visitor, _fullscreen){
    var visitorString = '';
    if (!_visitor.IsHidden)
    {
        visitorString = this.CreateVisitorListLine(_visitor, false, false, _fullscreen);

        _visitor.is_drawn = true;
        _visitor.is_vl_ui_update = false;

    }
    this.UpdateVisitorOnMap(_visitor);
    return visitorString;
};

ChatVisitorClass.prototype.UpdateVisitors = function (_userInput,_updateTableOnResize){
    var visitors = VisitorManager.Visitors;
    var listTableJqueryObj = $('#visitor-list-table');
    this.lastDrawnId = '';
    var localFullscreen = this.isFullScreenMode();
    if(_updateTableOnResize)
    {
        if(localFullscreen)
        {
            listTableJqueryObj.find('thead').remove();
            listTableJqueryObj.prepend(this.CreateTableHeadline());
        }
        else
            listTableJqueryObj.find('thead').remove();
    }

    for (var i in visitors)
    {
        if(!visitors[i].IsLoaded)
            continue;
        this.UpdateVisitor(visitors[i], listTableJqueryObj, localFullscreen, _updateTableOnResize);
    }

    if(_userInput)
    {
        this.RemoveDOMBodies();
    }
};

ChatVisitorClass.prototype.RemoveDOMBodies = function(){
    $( ".visitor-list-line" ).each(function() {
        var vid = $(this).data('user-id');
        if(!lzm_commonTools.GetElementByProperty(VisitorManager.Visitors,'id',vid).length)
        {
            $(this).remove();
        }
    });
};

ChatVisitorClass.prototype.UpdateVisitor = function (_visitor, _listTableJqueryObj, _fullscreen, _updateTableOnResize){
    if (!_visitor.IsHidden)
    {
        if (_visitor.is_drawn || $('#visitor-list-row-' + _visitor.id).length)
        {
            if (_updateTableOnResize)
            {
                var newLineHTML = this.CreateVisitorListLine(_visitor, false, false, _fullscreen);
                $('#visitor-list-row-' + _visitor.id).replaceWith(newLineHTML);
                _visitor.is_vl_ui_update = false;
            }
            else if (_visitor.is_vl_ui_update)
            {
                var newLineHTML = this.CreateVisitorListLine(_visitor, false, true, _fullscreen);
                $('#visitor-list-row-' + _visitor.id).replaceWith(newLineHTML);
                _visitor.is_vl_ui_update = false;
            }
        }
        else
        {
            if (this.lastDrawnId == '')
            {
                _listTableJqueryObj.prepend(this.CreateVisitorListLine(_visitor, true, false, _fullscreen));
            } else {
                $(this.CreateVisitorListLine(_visitor, true, false, _fullscreen)).insertAfter('#visitor-list-row-' + this.lastDrawnId);
            }

            _visitor.is_drawn = true;
            _visitor.is_vl_ui_update = false;
        }
        this.lastDrawnId = _visitor.id;
    }
    else
    {
        $('#visitor-list-row-' + _visitor.id).addClass('visitor-list-line-removed');
        _visitor.is_drawn = false;
    }

    this.UpdateVisitorOnMap(_visitor);
};

ChatVisitorClass.prototype.CreateVisitorContextMenu = function(event, _visitorId, _isChatting, _wasDeclined, _invitationStatus){
    lzm_chatGeoTrackingMap.selectedVisitor = _visitorId;
    VisitorManager.SelectedVisitor = _visitorId;
    ContextMenuClass.RemoveAll();
    $('.visitor-list-line').removeClass('selected-table-line');
    $('#visitor-list-row-' + _visitorId).addClass('selected-table-line');
    var visitor = VisitorManager.GetVisitor(_visitorId);
    visitor = (visitor !== null) ? visitor : {};

    var externalIsDisabled = (lzm_chatDisplay.myGroups.length > 0),i;
    for (i=0; i<lzm_chatDisplay.myGroups.length; i++)
    {
        var myGr = DataEngine.groups.getGroup(lzm_chatDisplay.myGroups[i]);
        if (myGr !== null && myGr.external == '1')
            externalIsDisabled = false;
    }

    var disabled = (externalIsDisabled);
    var cancelInvites = true;//(_invitationStatus == 'requested');

    var watchlistLabel;
    var watchonclickAction;

    if(d(visitor.IsOnWatchList) && visitor.IsOnWatchList)
    {
        watchonclickAction = 'ChatVisitorClass.RemoveFromWatchList(\'' + visitor.id + '\');';
        watchlistLabel = tid('remove_from_watch_list');
    }
    else
    {
        watchonclickAction = 'ChatVisitorClass.AddToWatchList(\'' + visitor.id + '\', \'' + lzm_chatDisplay.myId + '\');';
        watchlistLabel = tid('add_to_watch_list');
    }

    var bandisabled = !!externalIsDisabled;
    var cm = {
        id: 'visitor_cm',
        entries: [
            {label: tid('details'), onClick : 'ChatVisitorClass.ShowVisitorInformation(\'' + visitor.id + '\');'},
            '',
            {label: tid('invitation'), onClick : 'showVisitorInvitation(\'' + visitor.id + '\');', disabled: disabled},
            {label: tid('invitation_cancel'), onClick : 'cancelInvitation(\'' + visitor.id + '\');', disabled: (disabled || !cancelInvites)},
            '',
            {label: tid('add_comment'), onClick : 'addVisitorComment(\'' + visitor.id + '\');'},
            {label: watchlistLabel, onClick : watchonclickAction},
            {
                label: tid('add_to_watch_list_of'),
                submenu: {
                    isSubmenu: true,
                    entries:[]
                }
            },
            '',
            {label: t('Start Chat'), onClick : 'startVisitorChat(\'' + visitor.id + '\');', disabled: visitor.IsInChat},
            '',
            {label: t('Ban (add filter)'), onClick : 'showFilterCreation(\'visitor\',\'' + visitor.id + '\');', disabled: bandisabled}
        ]
    };
    var operators = DataEngine.operators.getOperatorList('name', '', true);
    if(operators != null && operators.length)
        for(var opIndex in operators){
            if (operators[opIndex].isbot != '1')
            {
                cm.entries[7].submenu.entries.push({
                    label: operators[opIndex].name,
                    onClick : 'ChatVisitorClass.AddToWatchList(\'' + visitor.id + '\', \'' + operators[opIndex].id + '\');'
                });
            }
        }
    ContextMenuClass.BuildMenu(event,cm);
    event.stopPropagation();
    event.preventDefault();
    return false;
};

ChatVisitorClass.prototype.CreateVisitorListLine = function(_visitorObj, newLine, updateLine, _fullscreen){
    var extUserHtmlString = '', i, j = 0, userStyle;
    userStyle = ' style="cursor: pointer;'
    if (IFManager.IsAppFrame)
        userStyle += ' line-height: 22px !important;';
    userStyle += ' "';

    var tableRowTitle = '';
    var visitorName = DataEngine.inputList.getInputValueFromVisitor(111,_visitorObj,32);
    var visitorEmail = DataEngine.inputList.getInputValueFromVisitor(112,_visitorObj,32);
    var visitorCity = lzm_commonTools.SubStr(_visitorObj.city, 32, true);
    var visitorPage = this.createVisitorPageString(_visitorObj,true);
    var visitorRegion = lzm_commonTools.SubStr(_visitorObj.region, 32, true);
    var visitorISP = (typeof _visitorObj.isp != 'undefined' && _visitorObj.isp.length > 32) ? _visitorObj.isp.substring(0, 32) + '...' : _visitorObj.isp;
    var visitorCompany = DataEngine.inputList.getInputValueFromVisitor(113,_visitorObj,32);
    var visitorSystem = (_visitorObj.sys.length > 32) ? _visitorObj.sys.substring(0, 32) + '...' : _visitorObj.sys;
    var visitorBrowser = (_visitorObj.bro.length > 32) ? _visitorObj.bro.substring(0, 32) + '...' : _visitorObj.bro;
    var visitorResolution = (_visitorObj.res.length > 32) ? _visitorObj.res.substring(0, 32) + '...' : _visitorObj.res;
    var visitorHost = (_visitorObj.ho.length > 32) ? _visitorObj.ho.substring(0,32) + '...' : _visitorObj.ho;
    var lastVisitedDate = lzm_chatTimeStamp.getLocalTimeObject(_visitorObj.vl * 1000, true);
    var visitorLastVisited = lzm_commonTools.getHumanDate(lastVisitedDate, 'full', lzm_chatDisplay.userLanguage);
    var visitorSearchStrings = '';
    var visitorOnlineSince = this.calculateTimeDifference(_visitorObj, 'lastOnline', false)[0];
    var visitorLastActivity = this.calculateTimeDifference(_visitorObj, 'lastActive', false)[0];
    var visitorInvitationStatus = '';
    var visitorInvitationFont = '<i class="fa icon-flip-hor fa-commenting"></i>';

    if (d(_visitorObj.r) && _visitorObj.r.length > 0)
    {
        var lInv = VisitorManager.GetLatestInvite(_visitorObj);
        if(lInv != null)
            if (lInv.s != '' && lInv.ca == '' && lInv.a == 0 && lInv.de == 0)
            {
                visitorInvitationStatus = 'requested';
                visitorInvitationFont = '<i class="fa fa-commenting icon-flip-hor icon-blue" title="'+tidc('invitation',' (' + tid('active') + ')')+'"></i>';
            }
            else if(lInv.s != '' && lInv.a == '1')
            {
                visitorInvitationStatus = 'accepted';
                visitorInvitationFont = '<i class="fa fa-commenting icon-flip-hor icon-green" title="'+tidc('invitation',' (' + tid('accepted') + ')')+'"></i>';
            }
            else if(lInv.s != '' && lInv.ca != '')
            {
                visitorInvitationStatus = 'revoked';
                visitorInvitationFont = '<i class="fa fa-commenting icon-flip-hor icon-red" title="'+tidc('invitation',' (' + tid('declined') + ')')+'"></i>';
            }
            else if(lInv.s != '' && lInv.de == '1')
            {
                visitorInvitationStatus = 'declined';
                visitorInvitationFont = '<i class="fa fa-commenting icon-flip-hor icon-red" title="'+tidc('invitation',' (' + tid('declined') + ')')+'"></i>';
            }
    }

    var visitorIsChatting = d(_visitorObj.IsInChat) ? _visitorObj.IsInChat : false;
    var visitorChat = visitorIsChatting ? VisitorManager.GetChatOf(_visitorObj) : null;
    var onclickAction = '', oncontextmenuAction = '', ondblclickAction = '';


    if ((IFManager.IsAppFrame || IFManager.IsMobileOS) && !IFManager.IsDesktopApp())
    {
        onclickAction = ' onclick="lzm_chatDisplay.VisitorsUI.CreateVisitorContextMenu(event, \'' + _visitorObj.id + '\', \'' + visitorIsChatting + '\', false, \'' + visitorInvitationStatus + '\');"';
    }
    else
    {
        onclickAction = ' onclick="selectVisitor(event, \'' + _visitorObj.id + '\');"';
        oncontextmenuAction = 'oncontextmenu="lzm_chatDisplay.VisitorsUI.CreateVisitorContextMenu(event, \'' + _visitorObj.id + '\', \'' + visitorIsChatting + '\', false, \'' + visitorInvitationStatus + '\');"';
        ondblclickAction = ' ondblclick="ChatVisitorClass.ShowVisitorInformation(\'' + _visitorObj.id + '\');"';
    }

    var langName;
    if (typeof lzm_chatDisplay.availableLanguages[_visitorObj.lang.toLowerCase().split('-')[0]] != 'undefined') {
        langName = (typeof lzm_chatDisplay.availableLanguages[_visitorObj.lang.toLowerCase()] != 'undefined') ?
            lzm_chatDisplay.availableLanguages[_visitorObj.lang.toLowerCase()] :
            lzm_chatDisplay.availableLanguages[_visitorObj.lang.toLowerCase().split('-')[0]];
    } else {
        langName = (typeof lzm_chatDisplay.availableLanguages[_visitorObj.lang.toLowerCase()] != 'undefined') ?
            lzm_chatDisplay.availableLanguages[_visitorObj.lang.toLowerCase()] :
            _visitorObj.lang;
    }

    var columnContents = [{cid: 'online', contents: visitorOnlineSince, cell_id: 'visitor-online-' + _visitorObj.id},
        {cid: 'last_active', contents: visitorLastActivity, cell_id: 'visitor-active-' + _visitorObj.id},
        {cid: 'name', contents: visitorName},
        {cid: 'country', contents: lzm_chatDisplay.getCountryName(_visitorObj.ctryi2,false)},
        {cid: 'language', contents: langName},
        {cid: 'region', contents: visitorRegion},
        {cid: 'city', contents: visitorCity},
        {cid: 'page', contents: visitorPage},
        {cid: 'search_string', contents: visitorSearchStrings},
        {cid: 'website_name', contents: VisitorManager.GetWebsiteNames(_visitorObj)},
        {cid: 'host', contents: visitorHost},
        {cid: 'ip', contents: _visitorObj.ip}, {cid: 'email', contents: visitorEmail},
        {cid: 'company', contents: visitorCompany}, {cid: 'browser', contents: visitorBrowser},
        {cid: 'resolution', contents: visitorResolution},
        {cid: 'os', contents: visitorSystem},
        {cid: 'last_visit', contents: visitorLastVisited},
        {cid: 'isp', contents: visitorISP},
        {cid: 'visit_count', contents: _visitorObj.vts},
        {cid: 'page_title', contents: VisitorManager.GetPageTitle(_visitorObj)},
        {cid: 'page_count', contents: VisitorManager.GetPageCount(_visitorObj)},
        {cid: 'referrer', contents: VisitorManager.GetReferrer(_visitorObj)}
    ];

    LocalConfiguration.AddCustomBlock(columnContents);

    var css = 'visitor-list-line lzm-unselectable';

    if (newLine && ChatVisitorClass.VisitorListCreated)
        css += ' visitor-list-line-added';
    else if(ChatVisitorClass.SelectedVisitor==_visitorObj.id)
        css += ' selected-table-line';
    else if(updateLine)
        css += ' visitor-list-line-updated';

    var tableRowUserStyle = ' style="cursor: pointer;'

    if (IFManager.IsAppFrame)
        tableRowUserStyle += ' line-height: 22px !important;';

    if(!this.isFullScreenMode())
        tableRowUserStyle += ' min-width: 250px;';

    tableRowUserStyle += ' "';

    extUserHtmlString += '<tr' + tableRowUserStyle + tableRowTitle + ' id="visitor-list-row-' + _visitorObj.id + '" data-user-id="' + _visitorObj.id + '" class="'+css+'"' + onclickAction + oncontextmenuAction + ondblclickAction +'>';
    extUserHtmlString += '<td class="icon-column nobg noibg"><div style="margin-top:-1px;background-image: url(\'./php/common/flag.php?cc=' + _visitorObj.ctryi2 + '\');" class="visitor-list-flag"></div></td>';

    if (visitorIsChatting)
        extUserHtmlString += '<td class="icon-column nobg noibg"><i class="fa fa-comments icon-blue" title="'+tidc('chatting_with' , ' ' + visitorChat.GetOperatorNameList())+'"></i></td>';
    else
        extUserHtmlString += '<td class="icon-column nobg noibg"><i class="fa fa-comments"></i></td>';

    extUserHtmlString += '<td class="icon-column nobg noibg">'+visitorInvitationFont+'</td>';

    if(_fullscreen)
    {
        for (i=0; i<LocalConfiguration.TableColumns.visitor.length; i++) {
            for (j=0; j<columnContents.length; j++)
            {
                if (LocalConfiguration.TableColumns.visitor[i].cid == columnContents[j].cid && LocalConfiguration.TableColumns.visitor[i].display == 1)
                {
                    if(!LocalConfiguration.IsCustom(columnContents[j].cid))
                    {
                        var cellId = (typeof columnContents[j].cell_id != 'undefined') ? ' id="' + columnContents[j].cell_id + '"' : '';
                        extUserHtmlString += '<td' + cellId + '>' + columnContents[j].contents + '</td>';
                    }
                    else
                    {
                        var cindex = columnContents[j].cid.replace('c','');
                        var customInput = DataEngine.inputList.getCustomInput(DataEngine.inputList.idList[cindex]);
                        if (customInput != null && customInput.active == 1)
                        {
                            extUserHtmlString += '<td>' + this.createCustomInputString(_visitorObj, customInput.id, true) + '</td>';
                        }
                    }
                }
            }
        }
    }
    else
    {
        var mobileVisitorOnlineSince = this.calculateMobileTimeDifference(_visitorObj, 'lastOnline', false)[0];
        extUserHtmlString += '<td' + userStyle + ' class="visitor-online-cell" id="visitor-online-' + _visitorObj.id + '">' + mobileVisitorOnlineSince + '</td>';
        var svContent = '<b>' + visitorName + '</b>';
        svContent += '<div class="lzm-info-text">' + visitorPage + '</div>';
        svContent += '<div class="lzm-info-text">' + VisitorManager.GetPageTitle(_visitorObj) + '</div>';
        svContent = svContent.replace(/\n/g, " ").replace(/\r/g, " ").replace(/<br>/g, " ");
        extUserHtmlString += '<td' + userStyle + ' class="visitor-simple-cell">' + svContent + '</td>';
    }
    extUserHtmlString += '</tr>';

    return extUserHtmlString.replace(/<td><\/td>/g,'<td>-</td>');
};

ChatVisitorClass.prototype.AnimateVisitorChanges = function(){
    var visitorListLineUpdated = $('.visitor-list-line-updated');
    var visitorListLineRemoved = $('.visitor-list-line-removed');
    var visitorListLineAdded = $('.visitor-list-line-added');

    function doChanges(){
        visitorListLineRemoved.remove();
        visitorListLineAdded.removeClass('visitor-list-line-added');
        visitorListLineUpdated.removeClass('visitor-list-line-updated');
    }

    if(VisitorManager.ActiveVisitors > 50)
        doChanges();
    else
    {
        visitorListLineUpdated.animate({opacity:0.5});
        visitorListLineUpdated.animate({opacity:1});
        visitorListLineRemoved.animate({opacity:0},1000);
        visitorListLineAdded.css({opacity:0});
        visitorListLineAdded.animate({opacity:1});
        setTimeout(function(){
            doChanges();
        },1000);
    }
};

ChatVisitorClass.prototype.CreateMap = function(){
    var map = $('#geotracking');
    var mapBody = map.children('#geotracking-body');

    if(DataEngine.getConfigValue('gl_use_ngl',false) == 0)
        $('#visitors-map').addClass('ui-disabled');

    else if (LocalConfiguration.VisitorsMapVisible && $('#geotracking-body').data('src') == '')
        this.LoadMapSource(mapBody);

    if (!lzm_chatGeoTrackingMap.delayAddIsInProgress) // to UIRendererClass
        lzm_chatGeoTrackingMap.addOrQueueVisitor();

    if (lzm_chatGeoTrackingMap.selectedVisitor != null)  // to UIRendererClass
        lzm_chatGeoTrackingMap.setSelection(lzm_chatGeoTrackingMap.selectedVisitor, '');

    this.HideMap();
};

ChatVisitorClass.prototype.UpdateMap = function(){
    var map = $('#geotracking');
    var mapBody = map.children('#geotracking-body');
    if(/*!DataEngine.hasMapLicense() || */DataEngine.getConfigValue('gl_use_ngl',false) == 0)
    {
        this.HideMap();
        $('#visitors-map').addClass('ui-disabled');
    }
    else if (LocalConfiguration.VisitorsMapVisible && mapBody.data('src') == '')
        this.LoadMapSource(mapBody);
    if (!lzm_chatGeoTrackingMap.delayAddIsInProgress) // to UIRendererClass
        lzm_chatGeoTrackingMap.addOrQueueVisitor();

    if (lzm_chatGeoTrackingMap.selectedVisitor != null)  // to UIRendererClass
        lzm_chatGeoTrackingMap.setSelection(lzm_chatGeoTrackingMap.selectedVisitor, '');
};

ChatVisitorClass.prototype.LoadMapSource = function(_mapBody){
    var gtKey = DataEngine.getConfigValue('gl_pr_ngl',true);
    gtKey = (gtKey !== null && d(gtKey.value)) ? lz_global_base64_decode(gtKey.value) : '';  // what is that? geo tracking key?

    var myServerAddress = 'https://ssl.livezilla.net';
    var geoTrackingUrl = 'https://ssl.livezilla.net/geo/map/index.php?web=1&mv=3&pvc=' + lzm_commonConfig.lz_version + '&key=' + gtKey;

    //if(gtKey.length)
    //{
        var mapIframe = _mapBody.children('#geotracking-iframe');
        _mapBody.data('src', geoTrackingUrl);
        mapIframe.attr('src', geoTrackingUrl);
        lzm_chatGeoTrackingMap.setIframe(mapIframe[0]);
        lzm_chatGeoTrackingMap.setReceiver(myServerAddress);
    //}
};

ChatVisitorClass.prototype.CreateTreeview = function(){
    VisitorFilterManager.CreateFilters();

    if(LocalConfiguration.VisitorsTreeviewVisible && !IFManager.IsMobileOS)
        this.ShowTreeview();
    else
        this.HideTreeview();

    this.CreateTreeviewFilters();
};

ChatVisitorClass.prototype.UpdateTreeview = function(){
    var result = VisitorFilterManager.UpdateFilters();
    var countrySortNeeded;
    for(var i in result.remove)
    {
        this.RemoveCountryFilter(result.remove[i].id);
    }

    for(var j in result.update)
    {
        if(result.update[j].country)
            countrySortNeeded = true;
        this.UpdateFilterCount(result.update[j]);
    }

    for(var k in result.create)
    {
        this.AddCountryFilter(result.create[k]);
        countrySortNeeded = true;
    }

    if(countrySortNeeded)
        this.SortCountyFiltersByCount();
};

ChatVisitorClass.prototype.HideMap = function (){
    LocalConfiguration.VisitorsMapVisible = false;
    LocalConfiguration.Save();
    $('#geotracking').css({display: 'none'});
    $('#visitors-map').removeClass('lzm-button-b-pushed');
};

ChatVisitorClass.prototype.ShowMap = function (){

    LocalConfiguration.VisitorsMapVisible = true;
    LocalConfiguration.Save();
    $('#geotracking').css({display: 'block'});
    $('#visitors-map').addClass('lzm-button-b-pushed');
    this.UpdateMap();
};

ChatVisitorClass.prototype.HideTreeview = function (){
    LocalConfiguration.VisitorsTreeviewVisible = false;
    LocalConfiguration.Save();
    $('#visitor-treeview').css({display: 'none'});
    $('#visitor-tree-btn').removeClass('lzm-button-b-pushed');
};

ChatVisitorClass.prototype.ShowTreeview = function (){

    LocalConfiguration.VisitorsTreeviewVisible = true;
    LocalConfiguration.Save();
    $('#visitor-treeview').css({display: 'block'});
    $('#visitor-tree-btn').addClass('lzm-button-b-pushed');
};

ChatVisitorClass.prototype.CreateTreeviewFilters = function(){
    var treeviewFilters = VisitorFilterManager.GetFilterSet('treeview');
    treeviewFilters.forEach(function(_filter)
    {
        if(!_filter.country)
            lzm_chatDisplay.VisitorsUI.AddStaticFilter(_filter);
        else
            lzm_chatDisplay.VisitorsUI.AddCountryFilter(_filter);
    });
    VisitorManager.IsTreeviewCreated = true;
};

ChatVisitorClass.prototype.AddStaticFilter = function (_filter){
    var parentElementSelector;
    if(_filter.id == 'all')
        parentElementSelector = this.HaveCategory('mainhead');
    else
        parentElementSelector = this.HaveCategory('main');
    var filterclass = 'vm-treeview-filter lzm-unselectable' + (_filter.active ? ' selected-treeview-div': '');
    var filterHTML = '';
    var icon = _filter.iconId ? _filter.iconId : '';
    filterHTML += '<div id="' + 'vm-treeview-filter-' + _filter.id + '" class="' + filterclass + '" onClick="lzm_chatDisplay.VisitorsUI.FilterOnClick(\'' + _filter.id + '\')">';
    filterHTML += '<i class="fa ' + icon + '"></i>';
    filterHTML += _filter.name;
    filterHTML += ' (<span class="visitor-filter-count">' + _filter.newCount + '</span>)';
    filterHTML += '</div>';
    $(parentElementSelector).append(filterHTML).trigger('create');
};

ChatVisitorClass.prototype.FilterOnClick = function(_id){
    VisitorFilterManager.SetActiveTreeviewFilter(_id);
    if(!lzm_chatDisplay.VisitorsUI.isFullScreenMode())
        $('#visitor-tree-btn').click();
    this.UpdateFilterActive(_id);
    lzm_chatDisplay.VisitorsUI.UpdateVisitorMonitorUI('now');
};

ChatVisitorClass.prototype.AddCountryFilter = function(_filter) {
    if($('#vm-treeview-filter-' + _filter.id).length)
        return false;

    var parentElementSelector = this.HaveCategory('country');
    var filterclass = 'vm-treeview-filter lzm-unselectable country-filter';
    var filterDisplay = LocalConfiguration.VisitorsCountryFilterVisible ? 'block' : 'none';
    var filterHTML = '';
    filterHTML += '<div id="' + 'vm-treeview-filter-' + _filter.id + '" class="' + filterclass + '" onClick="lzm_chatDisplay.VisitorsUI.FilterOnClick(\'' + _filter.id + '\')" style="display: ' + filterDisplay + ' ;">';
    filterHTML += _filter.name;
    filterHTML += ' (<span class="visitor-filter-count">' + _filter.newCount + '</span>)';
    filterHTML += '</div>';
    $(parentElementSelector).append(filterHTML).trigger('create');
    return true;
};

ChatVisitorClass.prototype.UpdateFilterCount = function(_filter) {
    $('#vm-treeview-filter-' + _filter.id).children('.visitor-filter-count').text(_filter.newCount);
};

ChatVisitorClass.prototype.SortCountyFiltersByCount = function(){
    $('.country-filter').sort(function(a,b){
        return parseInt($(b).find('.visitor-filter-count').text()) - parseInt($(a).find('.visitor-filter-count').text());
    }).appendTo('#visitor-filter-category-country');
};

ChatVisitorClass.prototype.RemoveCountryFilter = function (_id) {
    $('#vm-treeview-filter-' + _id).remove();
    VisitorFilterManager.RemoveFilter(_id);
};

ChatVisitorClass.prototype.UpdateFilterActive = function (_id) {
    $('.selected-treeview-div').removeClass('selected-treeview-div');
    $('#vm-treeview-filter-' + _id).addClass('selected-treeview-div');
};

ChatVisitorClass.prototype.HaveCategory = function (_category) {
    if(_category == '')
        return '#visitor-treeview';
    else
        if($('#visitor-filter-category-' + _category).length)
            return '#visitor-filter-category-' + _category;
        else
        {
            if(_category == 'mainhead')
            {
                this.MakeMainCategory();
                return '#visitor-filter-category-main';
            }
            this.MakeCategory(_category);
            return '#visitor-filter-category-' + _category;
        }
};

ChatVisitorClass.prototype.MakeMainCategory = function () {
    var categoryHTML = '';
    categoryHTML += '<div id="visitor-filter-category-main" class="vm-treeview-main-category"></div>';
    $('#visitor-treeview').append(categoryHTML).trigger('create');
};

ChatVisitorClass.prototype.MakeCategory = function (_category) {
    var categoryHTML = '';
    var categoryIcon = LocalConfiguration.VisitorsCountryFilterVisible ? 'fa-caret-down' : 'fa-caret-right';
    categoryHTML += '<div id="visitor-filter-category-' + _category + '" class="vm-treeview-category">';
    categoryHTML += '<div class="vm-treeview-category-headline lzm-unselectable">';
    categoryHTML += '<i class="fa ' + categoryIcon + '"></i>';
    categoryHTML += (_category == 'country' ? tid(_category) : _category);
    categoryHTML += '</div>';
    categoryHTML += '</div>';
    $('#visitor-treeview').append(categoryHTML).trigger('create');
    $('#visitor-filter-category-' + _category).find('.vm-treeview-category-headline').on('click', function(){
        if(LocalConfiguration.VisitorsCountryFilterVisible)
        {
            $(this).parent().children().hide();
            $(this).parent().children().first().show();
            $(this).find('.fa').removeClass('fa-caret-down').addClass('fa-caret-right');
            LocalConfiguration.VisitorsCountryFilterVisible = false;
            LocalConfiguration.SaveValue('show_countries_', LocalConfiguration.VisitorsCountryFilterVisible ? 1 : 0);
        }else
        {
            $(this).parent().children().show();
            $(this).find('.fa').removeClass('fa-caret-right').addClass('fa-caret-down');
            LocalConfiguration.VisitorsCountryFilterVisible = true;
            LocalConfiguration.SaveValue('show_countries_', LocalConfiguration.VisitorsCountryFilterVisible ? 1 : 0);
        }
    });
};

ChatVisitorClass.prototype.UpdateVisitorOnMap = function (_visitor) {
    if(LocalConfiguration.VisitorsMapVisible)
    {
        if(!d(_visitor.is_mapped))
            _visitor.is_mapped = false;

        if(_visitor.is_mapped && _visitor.IsHidden)
        {
            lzm_chatGeoTrackingMap.removeVisitor(_visitor.id);
            _visitor.is_mapped = false;
        }
        else if(!_visitor.is_mapped && !_visitor.IsHidden)
        {
            lzm_chatGeoTrackingMap.addOrQueueVisitor(_visitor);
            _visitor.is_mapped = true;
        }
    }
};

ChatVisitorClass.prototype.UpdateVisitorTimestampCells = function() {
    var i;
    var visitors = VisitorManager.Visitors;
    for (i=visitors.length-1; i>=0; i--)
    {
        if (!visitors[i].IsHidden && visitors[i].is_drawn)
        {
            if(!this.isFullScreenMode())
            {
                $('#visitor-online-' + visitors[i].id).html(this.calculateMobileTimeDifference(visitors[i], 'lastOnline', false)[0]);
            }
            else
            {
                var timeColumns = this.getVisitorOnlineTimes(visitors[i]);
                $('#visitor-online-' + visitors[i].id).html(timeColumns['online']);
                $('#visitor-active-' + visitors[i].id).html(timeColumns['active']);
            }
        }
    }
};

ChatVisitorClass.prototype.CreateVisitorMonitoringHeadline = function(){
    var gtclass = (/*!DataEngine.hasMapLicense() || */ DataEngine.getConfigValue('gl_use_ngl',false) == 0) ? 'ui-disabled' : '';
    var mapButtonClass = gtclass + (LocalConfiguration.VisitorsMapVisible ? ' lzm-button-b-pushed' : '');
    var treeviewButtonClass = LocalConfiguration.VisitorsTreeviewVisible ? 'lzm-button-b-pushed' : '';
    var headline2String = '<span class="left-button-list">' +
        lzm_inputControls.createButton('visitor-tree-btn', treeviewButtonClass, 'lzm_chatDisplay.VisitorsUI.OnTreeviewButtonClicked();','', '<i class="fa fa-list-ul"></i>', 'lr',{'margin-left': '4px','margin-right': '0px'}, '', 10, 'e') +
        '</span><span id="visitors-info" class="lzm-dialog-hl2-info">' +
        t('Visitors online: <!--visitor_number-->',[['<!--visitor_number-->', VisitorManager.ActiveVisitors]]) +
        '</span><span class="right-button-list">' +
        lzm_inputControls.createButton('visitors-map', mapButtonClass , 'lzm_chatDisplay.VisitorsUI.OnMapButtonClicked();', 'Map', '<i class="fa fa-map-marker"></i>', 'lr', {'margin-right':'4px'}, '', 10, 'e') +
        '</span>';

    $('#visitor-list-headline2').html(headline2String);
};

ChatVisitorClass.prototype.UpdateVisitorMonitoringHeadline = function() {
    if(lzm_chatDisplay.selected_view=='external')
        $('#visitors-info').html(t('Visitors online: <!--visitor_number-->',[['<!--visitor_number-->', VisitorManager.ActiveVisitors]]));
    if(/*!DataEngine.hasMapLicense() || */DataEngine.getConfigValue('gl_use_ngl',false) == 0){
        $('#visitors-map').addClass('ui-disabled');
    }

};

ChatVisitorClass.prototype.getBrowserListHtml = function(_visitor,elementId) {

    var brwsNo = 1, coBrowseSelBrws = '', coBrowseSelectOptions = '', firstActiveBrowser = '', activeBrowserPresent = false;
    if(_visitor != null && d(_visitor.b))
        for (var j=0; j<_visitor.b.length; j++)
        {
            if (_visitor.b[j].is_active && _visitor.b[j].id.indexOf('_OVL')==-1 && d(_visitor.b[j].h2))
            {
                activeBrowserPresent = true;
                firstActiveBrowser = (firstActiveBrowser == '') ? _visitor.id + '~' + _visitor.b[j].id : firstActiveBrowser;
                var lastH = _visitor.b[j].h2[_visitor.b[j].h2.length - 1];
                var lastHTime = lzm_chatTimeStamp.getLocalTimeObject(lastH.time * 1000, true);
                var lastHTimeHuman = lzm_commonTools.getHumanDate(lastHTime, 'shorttime', lzm_chatDisplay.userLanguage);
                var selectedString = '';

                if (_visitor.id + '~' + _visitor.b[j].id == $('#visitor-cobrowse-'+elementId+'-iframe').data('browser'))
                {
                    selectedString = ' selected="selected"';
                    coBrowseSelBrws = _visitor.id + '~' + _visitor.b[j].id;
                }

                coBrowseSelectOptions += '<option value="' + _visitor.id + '~' + _visitor.b[j].id + '"' + selectedString + '>' + t('Browser <!--brws_no-->: <!--brws_url--> (<!--brws_time-->)',[['<!--brws_no-->', brwsNo], ['<!--brws_url-->', lastH.url], ['<!--brws_time-->', lastHTimeHuman]]) + '</option>';
                brwsNo++;
            }
        }

    if(!activeBrowserPresent)
        coBrowseSelectOptions += '<option>' + tid('offline') + '</option>';

    coBrowseSelBrws = (coBrowseSelBrws != '') ? coBrowseSelBrws : firstActiveBrowser;

    return [coBrowseSelectOptions,coBrowseSelBrws,activeBrowserPresent];
};

ChatVisitorClass.prototype.CreateCoBrowsingTab = function(_visitorObj,_elementId){
    var i,coBrowseHtml = '',brwsNo = 1, coBrowseSelBrws = '';
    if (d(_visitorObj.b) && _visitorObj.is_active)
    {
        var myGroup, myself = DataEngine.operators.getOperator(lzm_chatDisplay.myId), firstLanguage = '', firstGroup = '';
        var defaultLanguage = '', defaultGroup = '';
        if (myself != null && typeof myself.pm != 'undefined')
        {
            for (i=0; i<myself.pm.length; i++)
            {
                if (myself.pm[i].def == 1)
                    defaultLanguage = (defaultLanguage == '') ? myself.pm[i].lang : defaultLanguage;
                if (myself.pm[i].lang == _visitorObj.lang)
                    firstLanguage = myself.pm[i].lang;
            }
        }
        for (i=0; i<lzm_chatDisplay.myGroups.length; i++)
        {
            myGroup = DataEngine.groups.getGroup(lzm_chatDisplay.myGroups[i]);
            if (firstLanguage == '' && myGroup != null && typeof myGroup.pm != 'undefined' && myGroup.pm.length > 0) {
                for (var j=0; j<myGroup.pm.length; j++) {
                    if (myGroup.pm[j].def == 1) {
                        defaultLanguage = (defaultLanguage == '') ? myGroup.pm[j].lang : defaultLanguage;
                        defaultGroup = myGroup.id;
                    }
                    if (myGroup.pm[j].lang == _visitorObj.lang) {
                        firstLanguage = myGroup.pm[j].lang;
                        firstGroup = myGroup.id;
                    }
                }
            }
        }
        defaultLanguage = (defaultLanguage != '') ? defaultLanguage : 'en';
        firstLanguage = (firstLanguage != '') ? firstLanguage : defaultLanguage;
        firstGroup = (firstGroup != '') ? firstGroup : defaultGroup;

        var grEncId = (firstGroup != '') ? '~' + lz_global_base64_url_encode(firstGroup) : '';
        coBrowseHtml = '<div><div class="" id="visitor-cobrowse-'+_elementId+'"><div id="visitor-cobrowse-'+_elementId+'-inner">';
        coBrowseHtml += '<div><select id="visitor-cobrowse-'+_elementId+'-browser-select" class="lzm-select">';

        for (i=0; i<_visitorObj.b.length; i++)
        {
            if (_visitorObj.b[i].is_active && _visitorObj.b[i].last_browse > 0)
            {
                var lastH = _visitorObj.b[i].h2[_visitorObj.b[i].h2.length - 1];
                var lastHTime = lzm_chatTimeStamp.getLocalTimeObject(lastH.time * 1000, true);
                var lastHTimeHuman = lzm_commonTools.getHumanDate(lastHTime, 'shorttime', lzm_chatDisplay.userLanguage);
                coBrowseHtml += '<option value="' + _visitorObj.id + '~' + _visitorObj.b[i].id + '">' + t('Browser <!--brws_no-->: <!--brws_url--> (<!--brws_time-->)',[['<!--brws_no-->', brwsNo], ['<!--brws_url-->', lastH.url], ['<!--brws_time-->', lastHTimeHuman]]) + '</option>';

                if(coBrowseSelBrws == '')
                {
                    coBrowseSelBrws = _visitorObj.id + '~' + _visitorObj.b[i].id;

                }

                brwsNo++;
            }
        }

        coBrowseHtml += '</select></div>';
        coBrowseHtml += '<div id="screen-capture-'+_elementId+'-activate" onclick="ChatVisitorClass.ToggleScreenSharing(\''+_elementId+'\');" class="screen-capture-activate bg-blue lzm-unselectable lzm-clickable2"><i class="fa fa-camera text-white"></i>&nbsp;&nbsp;<span>Screen Sharing</span></div>';
        coBrowseHtml += '<div id="screen-capture-'+_elementId+'-external" onclick="ChatVisitorClass.ToggleScreenSharing(\''+_elementId+'\',true);" class="screen-capture-external bg-blue lzm-unselectable lzm-clickable"><i class="fa fa-external-link-square text-white"></i></div>';
        coBrowseHtml += '<div class="top-space">';

        if ((IFManager.IsAppFrame || IFManager.IsMobileOS) && !IFManager.IsDesktopApp())
            coBrowseHtml += '<div id="visitor-cobrowse-'+_elementId+'-iframe-container">';

        coBrowseHtml += '<iframe id="visitor-cobrowse-'+_elementId+'-iframe" class="visitor-cobrowse-iframe" data-browser="' + coBrowseSelBrws + '" data-action="0" data-language="' + firstLanguage + '~group' + grEncId + '"></iframe>';

        if ((IFManager.IsAppFrame || IFManager.IsMobileOS) && !IFManager.IsDesktopApp())
            coBrowseHtml +='</div>';

        coBrowseHtml += '</div></div></div></div>';
    }
    else
        coBrowseHtml = lzm_chatDisplay.VisitorsUI.GetOfflineVisitorField();

    return coBrowseHtml;
};

ChatVisitorClass.prototype.UpdateCoBrowsingTab = function(_visitor, elementId) {

    // turn online
    if($('#visitor-info-'+elementId+'-placeholder-content-1').html() == this.GetOfflineVisitorField())
    {
        $('#visitor-info-'+elementId+'-placeholder-content-1').html(this.CreateCoBrowsingTab(_visitor, elementId));
        ChatVisitorClass.SetCoBrowsingEvent(elementId);
    }
    else if(!_visitor.is_active)
    {
        $('#visitor-info-'+elementId+'-placeholder-content-1').html(this.GetOfflineVisitorField());
        return;
    }

    var externalIsDisabled = (lzm_chatDisplay.myGroups.length > 0);
    for (var i=0; i<lzm_chatDisplay.myGroups.length; i++)
    {
        var myGr = DataEngine.groups.getGroup(lzm_chatDisplay.myGroups[i]);
        if (myGr != null && myGr.external == '1')
            externalIsDisabled = false;
    }

    var coBrowseSelectOptions = this.getBrowserListHtml(_visitor,elementId);

    $('#visitor-cobrowse-'+elementId+'-iframe').data('browser', coBrowseSelectOptions[1]);
    $('#visitor-cobrowse-'+elementId+'-browser-select').html(coBrowseSelectOptions[0]);
    $('#visitor-cobrowse-'+elementId+'-browser-select').removeClass('ui-disabled');

    if ($('#visitor-cobrowse-'+elementId+'-iframe').length && $('#visitor-cobrowse-'+elementId+'-iframe').data('visible') == '1')
    {
        if (_visitor.id == $('#visitor-cobrowse-'+elementId+'-iframe').data('browser').split('~')[0])
        {
            var vb = VisitorManager.GetVisitorBrowser($('#visitor-cobrowse-'+elementId+'-iframe').data('browser'));
            if ($('#visitor-cobrowse-'+elementId+'-iframe').data('browser-url') != vb.h2[vb.h2.length - 1].url)
                ChatVisitorClass.LoadCoBrowsingContent(elementId, vb);
        }
    }

    ChatVisitorClass.UpdateScreenSharingUI(elementId);
};

ChatVisitorClass.prototype.UpdateVisitorInformation = function(_visitorId) {
    try
    {
        var aw = TaskBarManager.GetActiveWindow();
        if(aw == null)
            return;

        if(!aw.DialogId.startsWith('visitor-information-') && aw.TypeId != 'chat-window')
            return;

        if(aw.TypeId == 'chat-window')
        {
            var chatObj = DataEngine.ChatManager.GetChat(aw.Tag);
            if(chatObj != null && chatObj.Type != 0)
                return;
        }

        var updateUI = false,that = this;
        var visitor = VisitorManager.GetVisitor(_visitorId);
        var fdVisitor = VisitorManager.GetFullDataVisitor(_visitorId);

        if(fdVisitor == null)
        {
            ChatVisitorClass.LoadVisitorInformation(_visitorId);
            return;
        }
        else
        {
            if(visitor != null)
            {
                fdVisitor.is_active = visitor.is_active;
                fdVisitor.b = visitor.b;
            }
            else
            {
                fdVisitor.is_active = false;
                visitor = fdVisitor;
            }
        }

        $(['d','e']).each(function()
        {
            var render=true,elemShort = $(this)[0].toString();
            var elementId = elemShort + '-' + _visitorId;

            if(elemShort == 'd' && !aw.DialogId.startsWith('visitor-information-'))
                render = false;
            if(elemShort == 'e' && aw.TypeId != 'chat-window')
                render = false;
            if(elemShort == 'e' && aw.TypeId == 'chat-window' && lzm_chatDisplay.windowWidth < CommonUIClass.MinWidthChatVisitorInfo)
                render = false;

            if(render)
            {
                updateUI = true;
                that.CreateHistoryTabControl(fdVisitor,elementId,$(this)[0].toString()=='d');

                var viTableHTML = that.CreateVisitorInformationTable(visitor,elementId);
                if(viTableHTML != null)
                    $('#visitor-details-'+elementId+'-list').html(viTableHTML);

                var bhTableHTML = that.CreateBrowserHistory(visitor,elementId);

                if(bhTableHTML != null)
                    $('#visitor-history-'+elementId+'-placeholder-content-0').html(bhTableHTML);


                if(visitor.is_active)
                {
                    $('#visitor-info-status-indicator-' + $(this)[0].toString()).addClass('online').html(tid('online'));
                }
                else
                    $('#visitor-info-status-indicator-' + $(this)[0].toString()).removeClass('online').html(tid('offline'));

                if(d(fdVisitor.rv))
                    for (var i=0; i<fdVisitor.rv.length; i++)
                    {
                        var recentHistoryHtml = that.CreateBrowserHistory(fdVisitor, elementId, fdVisitor.rv[i]);
                        $('#recent-history-'+elementId+'-' + fdVisitor.rv[i].id).replaceWith(recentHistoryHtml);
                    }

                $('#visitor-info-'+elementId+'-placeholder-content-3').html('<div id="visitor-comment-'+elementId+'-list">' + that.CreateVisitorCommentTable(visitor, elementId) + '</div>').trigger('create');
                $('#visitor-info-'+elementId+'-placeholder-content-4').html('<div id="visitor-invitation-'+elementId+'-list">' + that.CreateVisitorInvitationTable(visitor, elementId) + '</div>').trigger('create');

                that.UpdateCoBrowsingTab(visitor, elementId);

                var numberOfHistories = 0;

                if(d(fdVisitor.rv))
                    numberOfHistories = fdVisitor.rv.length;

                if(d(visitor.b) && visitor.b.length)
                    numberOfHistories++;

                var numberOfComments = (d(visitor.c)) ? visitor.c.length : 0;
                var numberOfInvites = (d(visitor.r)) ? visitor.r.length : 0;
                var numberOfChats = (d(fdVisitor.ArchivedChats)) ? fdVisitor.ArchivedChats.length : 0;
                var numberOfTickets = (d(fdVisitor.ArchivedTickets)) ? fdVisitor.ArchivedTickets.length : 0;
                var numberOfFeedbacks = (d(fdVisitor.ArchivedFeedbacks)) ? fdVisitor.ArchivedFeedbacks.length : 0;

                $('#visitor-info-'+elementId+'-placeholder-tab-2').html(t('History (<!--number_of_histories-->)', [['<!--number_of_histories-->', numberOfHistories]]));
                $('#visitor-info-'+elementId+'-placeholder-tab-3').html(t('Comments (<!--number_of_comments-->)', [['<!--number_of_comments-->', numberOfComments]]));
                $('#visitor-info-'+elementId+'-placeholder-tab-4').html(t('Chat Invites (<!--number_of_invites-->)', [['<!--number_of_invites-->', numberOfInvites]]));
                $('#visitor-info-'+elementId+'-placeholder-tab-5').html(t('Chats (<!--number_of_chats-->)', [['<!--number_of_chats-->', numberOfChats]]));
                $('#visitor-info-'+elementId+'-placeholder-tab-6').html(t('Tickets (<!--number_of_tickets-->)', [['<!--number_of_tickets-->', numberOfTickets]]));
                $('#visitor-info-'+elementId+'-placeholder-tab-7').html(tid('feedbacks') + ' (' + numberOfFeedbacks + ')');

                $('.visitor-info-'+elementId+'-placeholder-tab').removeClass('ui-disabled');

                if(d(visitor.IsInternal) || !visitor.is_active)
                {
                    if(!$('#visitor-details-'+elementId+'-list').html().length)
                        $('#visitor-info-'+elementId+'-placeholder-tab-0').addClass('ui-disabled');
                    $('#visitor-info-'+elementId+'-placeholder-tab-1').addClass('ui-disabled');
                }

                if(d(visitor.IsInternal) || numberOfHistories==0)
                {
                    $('#visitor-info-'+elementId+'-placeholder-tab-2').addClass('ui-disabled');
                }

                if(numberOfInvites==0)
                {
                    $('#visitor-info-'+elementId+'-placeholder-tab-4').addClass('ui-disabled');
                }

                if(d(visitor.IsInternal))
                {
                    $('#visitor-info-'+elementId+'-placeholder-tab-6').addClass('ui-disabled');
                }

                if(numberOfChats > 0 && $('#matching-chats-'+elementId+'-placeholder-tabs-row >span').length < numberOfChats)
                {
                    $('#visitor-info-'+elementId+'-placeholder-tab-5').removeClass('ui-disabled');

                    var chatsHtml = '<div id="matching-chats-'+elementId+'-placeholder"></div>';
                    var chatTabs = lzm_chatDisplay.archiveDisplay.CreateMatchingChatsTabs(fdVisitor,fdVisitor.ArchivedChats,elementId);

                    $('#visitor-info-'+elementId+'-placeholder-content-5').html('<div>' + chatsHtml + '</div>').trigger('create');

                    lzm_inputControls.createTabControl('matching-chats-'+elementId+'-placeholder',chatTabs,0,0,'sub');

                    if($('#visitor-info-'+elementId+'-placeholder-tab-5').hasClass('lzm-tabs-selected'))
                        $('#visitor-info-'+elementId+'-placeholder-tab-5').click();

                    if(d(fdVisitor.SelectedChatId))
                        $('#dialog-archive-list-'+elementId+'-line-' + fdVisitor.SelectedChatId).click();

                    Chat.ParseDates('matching-chats-'+elementId+'-placeholder');
                }

                if(numberOfTickets > 0  && $('#matching-tickets-'+elementId+'-table >tbody >tr').length < numberOfTickets)
                {
                    $('#visitor-info-'+elementId+'-placeholder-tab-6').removeClass('ui-disabled');
                    var ticketsHtml = lzm_chatDisplay.ticketDisplay.CreateMatchingTickets(fdVisitor,elementId);// + '<div class="lzm-fieldset" style="margin:0;" id="ticket-content-'+elementId+'-inner"></div>';
                    $('#visitor-info-'+elementId+'-placeholder-content-6').html(ticketsHtml).trigger('create');

                    if(lzm_chatDisplay.ticketDisplay.isFullscreenMode() && $('#visitor-info-'+elementId+'-placeholder-tab-6').hasClass('lzm-tabs-selected'))
                    {
                        $('#visitor-info-'+elementId+'-placeholder-tab-6').click();
                        if(d(fdVisitor.SelectedTicketId))
                            $('#matching-ticket-list-'+elementId+'-row-' + fdVisitor.SelectedTicketId).click();
                    }
                }

                if(numberOfFeedbacks > 0 && $('#feedbacks-table-'+elementId+' >tbody >tr').length < numberOfFeedbacks)
                {
                    $('#visitor-info-'+elementId+'-placeholder-tab-7').removeClass('ui-disabled');
                    var feedbacksHtml = lzm_chatDisplay.FeedbacksViewer.CreateMatchingFeedbacks(fdVisitor.ArchivedFeedbacks,elementId) + '<div class="lzm-fieldset" style="margin:0;" id="feedback-content-'+elementId+'-inner"></div>';
                    $('#visitor-info-'+elementId+'-placeholder-content-7').html(feedbacksHtml).trigger('create');
                    $('#feedback-content-'+elementId+'-inner').css({display:'none'});
                }
            }
        });

        if(updateUI)
            UIRenderer.resizeVisitorDetails();
    }
    catch(ex)
    {
        deblog(ex);
    }
};

ChatVisitorClass.prototype.CreateHistoryTabControl = function(_visitorObj, elementId, dialog){

    var sTab = $('#visitor-history-'+elementId + '-placeholder-tabs-row').data('selected-tab');
    var currentHistory = "";//this.CreateBrowserHistory(_visitorObj, elementId);
    var historyTabsArray = [{name: tid('active'), content: currentHistory, hash: md5('Active')}];

    if (d(_visitorObj.rv))
    {
        for (var i=0; i<_visitorObj.rv.length; i++)
        {
            var date = lzm_chatTimeStamp.getLocalTimeObject(_visitorObj.rv[i].e * 1000, true);
            var humanDate = lzm_commonTools.getHumanDate(date, 'all', lzm_chatDisplay.userLanguage);
            var recentHistoryHtml = this.CreateBrowserHistory(_visitorObj, elementId, _visitorObj.rv[i]);
            historyTabsArray.push({name: humanDate, content: recentHistoryHtml, hash: _visitorObj.rv[i].id});
        }
    }
    var tabControlWidth = ((dialog) ? $('#visitor-information').width() : $('#chat-info-body').width()) - 37;
    lzm_inputControls.createTabControl('visitor-history-'+elementId+'-placeholder', historyTabsArray, 0, tabControlWidth,'sub');

    if(d(sTab) && sTab > 0)
    {
        $('#visitor-history-'+elementId + '-placeholder-tab-' + sTab.toString()).click();
    }
};

ChatVisitorClass.prototype.CreateVisitorInformationTable = function(_visitorObj, elementId) {

    var onlineVisitor = VisitorManager.GetVisitor(_visitorObj.id);
    if(onlineVisitor != null)
        _visitorObj = onlineVisitor;
    else
        _visitorObj.is_active = false;

    var visitorInfoHtml = '', visitorInfoArray;
    if (d(_visitorObj.lang))
    {
        var visitorPage = this.createVisitorPageString(_visitorObj,false);
        var visitorSearchString = '';
        var lastVisitedDate = lzm_chatTimeStamp.getLocalTimeObject(_visitorObj.vl * 1000, true);
        var visitorLastVisit = lzm_commonTools.getHumanDate(lastVisitedDate, 'full', lzm_chatDisplay.userLanguage);
        var tmpDate = this.calculateTimeDifference(_visitorObj, 'lastOnline', true);
        var onlineTime = '<span id="visitor-online-since">' + tmpDate[0] + '</span>';
        tmpDate = new Date((tmpDate[1] - Client.TimeDifference) * 1000);
        var humanDate = lzm_commonTools.getHumanDate(tmpDate, 'all', lzm_chatDisplay.userLanguage);
        var visitorAreas = VisitorManager.GetWebsiteNames(_visitorObj);
        var visitorJavascript = (_visitorObj.js == '1') ? t('Yes') : t('No');
        var pagesBrowsed = 0;

        if(d(_visitorObj.b))
            for (var l=0; l<_visitorObj.b.length; l++)
                if(d(_visitorObj.b[l].h2))
                    for (var m=0; m<_visitorObj.b[l].h2.length; m++)
                        pagesBrowsed += 1;

        var langName = (typeof lzm_chatDisplay.availableLanguages[_visitorObj.lang.toLowerCase()] != 'undefined') ?
            _visitorObj.lang + ' - ' + lzm_chatDisplay.availableLanguages[_visitorObj.lang.toLowerCase()] :
            (typeof lzm_chatDisplay.availableLanguages[_visitorObj.lang.toLowerCase().split('-')[0]] != 'undefined') ?
            _visitorObj.lang + ' - ' + lzm_chatDisplay.availableLanguages[_visitorObj.lang.toLowerCase().split('-')[0]] :
            _visitorObj.lang;

        var countryName = lzm_chatDisplay.getCountryName(_visitorObj.ctryi2,true);

        visitorInfoArray = {
            details: {title: tid('visitor'), rows: []},
            location: {title: t('Location'), rows: [
                {title: t('City'), content: _visitorObj.city, editable: false},
                {title: t('Region'), content: _visitorObj.region, editable: false},
                {title: t('Country'), content:countryName, editable: false},
                {title: t('Time Zone'), content: t('GMT <!--tzo-->', [['<!--tzo-->', _visitorObj.tzo]]), editable: false}
            ]},

            device: {title: t('Visitor\'s Computer / Device'), rows: [
                {title: tid('device'), content: _visitorObj.dt == '2' ? 'Mobile' : (_visitorObj.dt == '0' ? 'Desktop' : 'Tablet'), editable: false},
                {title: t('Resolution'), content: _visitorObj.res, editable: false},
                {title: t('Operating system'), content: _visitorObj.sys, editable: false},
                {title: t('Browser'), content: _visitorObj.bro, editable: false},
                {title: t('Javascript'), content: visitorJavascript, editable: false},
                {title: t('IP address'), content: _visitorObj.ip, editable: false},
                {title: t('Host'), content: _visitorObj.ho, editable: false},
                {title: t('ISP'), content: _visitorObj.isp, editable: false},
                {title: t('User ID'), content: _visitorObj.id, editable: false}
            ]},
            misc: {title: t('Misc'), rows: [
                {title: t('Date'), content: humanDate, editable: false},
                {title: t('Online Time'), content: onlineTime, editable: false},
                {title: t('Website Name'), content: visitorAreas, editable: false},
                {title: t('Search string'), content: visitorSearchString, editable: false},
                {title: t('Page'), content: visitorPage, editable: false},
                {title: t('Pages browsed'), content: pagesBrowsed, editable: false},
                {title: t('Visits'), content: _visitorObj.vts, editable: false},
                {title: t('Last Visit'), content: visitorLastVisit, editable: false}
            ]}
        };

        var obj,edkey=false,value = '',standards=[],customs=[];
        for (var key in DataEngine.inputList.objects)
        {
            var input = DataEngine.inputList.getCustomInput(key);
            if(input != null && input.active == '1')
            {
                value = DataEngine.inputList.getInputValueFromVisitor(input.id,_visitorObj);
                if(input.id == 111 && value.length)
                    value = '<span class="text-blue text-xl">' + value + '</span>';

                edkey = input.id;
                obj = {title: LzmCustomInputs.GetLocaleName(input,false), content: value, editable: true, editkey: edkey};

                if(input.id < 100)
                    customs.push(obj);
                else
                    standards.push(obj)
            }
        }

        visitorInfoArray.details.rows = standards.concat(customs);
        visitorInfoArray.details.rows.push({title: tid('language'), content: langName, editable: false});
    }
    else
    {
        visitorInfoArray = null;
    }

    if(visitorInfoArray != null)
    {
        for (var myKey in visitorInfoArray)
        {
            if (visitorInfoArray.hasOwnProperty(myKey))
            {
                if(visitorInfoHtml.length)
                    visitorInfoHtml += '<br>';

                visitorInfoHtml += '<div class="lzm-fieldset" style="padding:15px 10px;"><table id="visitor-info-table" class="visible-list-table alternating-rows-table"><thead></thead><tbody>';
                for (var k=0; k<visitorInfoArray[myKey].rows.length; k++)
                {
                    var inputField = visitorInfoArray[myKey].rows[k];

                    var contentString = (inputField.content != '') ? inputField.content : '-';

                    if(inputField.editkey)
                        contentString = this.createCustomInputString(_visitorObj,inputField.editkey,true);

                    var cssClass = (d(inputField.class)) ? ' ' + inputField.class : '';
                    visitorInfoHtml += '<tr>';

                    if(k==0)
                    {
                        visitorInfoHtml += '<td rowspan="20" class="icon">';

                        if(myKey=='details')
                            visitorInfoHtml += '<i class="fa fa-user-circle icon-xxl' + ((!_visitorObj.is_active) ? '' : ' icon-blue') + '"></i>';

                        if(myKey=='location')
                            visitorInfoHtml += '<div style="background-image: url(\'./php/common/flag.php?cc=' + _visitorObj.ctryi2 + '\');" class="visitor-list-flag visitor-list-flag-xl"></div>';

                        if(myKey=='device')
                        {
                            // os
                            if(_visitorObj.sys.toLowerCase().indexOf('android') != -1)
                                visitorInfoHtml += '<i class="fa fa-android icon-xxl" style="color:#a4c639"></i><br><br>';
                            else if(_visitorObj.sys.toLowerCase().indexOf('mac os') != -1)
                                visitorInfoHtml += '<i class="fa fa-apple icon-xxl" style="color:#979797"></i><br><br>';
                            else if(_visitorObj.sys.toLowerCase().indexOf('ipad') != -1)
                                visitorInfoHtml += '<i class="fa fa-apple icon-xxl" style="color:#979797"></i><br><br>';
                            else if(_visitorObj.sys.toLowerCase().indexOf('iphone') != -1)
                                visitorInfoHtml += '<i class="fa fa-apple icon-xxl" style="color:#979797"></i><br><br>';
                            else if(_visitorObj.sys.toLowerCase().indexOf('linux') != -1)
                                visitorInfoHtml += '<i class="fa fa-linux icon-xxl" style="color:#444"></i><br><br>';
                            else if(_visitorObj.sys.toLowerCase().indexOf('windows') != -1)
                                visitorInfoHtml += '<i class="fa fa-windows icon-xxl" style="color:#00bcf2"></i><br><br>';

                            if(_visitorObj.bro.toLowerCase().indexOf('firefox') != -1)
                                visitorInfoHtml += '<i class="fa fa-firefox icon-xxl" style="color:#e66000"></i><br><br>';
                            else if(_visitorObj.bro.toLowerCase().indexOf('internet explorer') != -1)
                                visitorInfoHtml += '<i class="fa fa-internet-explorer icon-xxl" style="color:#1EBBEE"></i><br><br>';
                            else if(_visitorObj.bro.toLowerCase().indexOf('opera') != -1)
                                visitorInfoHtml += '<i class="fa fa-opera icon-xxl" style="color:#cc0f16"></i><br><br>';
                            else if(_visitorObj.bro.toLowerCase().indexOf('chrome') != -1)
                                visitorInfoHtml += '<i class="fa fa-chrome icon-xxl" style="color:#4587F3"></i><br><br>';
                            else if(_visitorObj.bro.toLowerCase().indexOf('edge') != -1)
                                visitorInfoHtml += '<i class="fa fa-edge icon-xxl" style="color:#1EBBEE"></i><br><br>';
                            else if(_visitorObj.bro.toLowerCase().indexOf('safari') != -1)
                                visitorInfoHtml += '<i class="fa fa-safari icon-xxl" style="color:#448aff"></i><br><br>';
                        }
                        visitorInfoHtml += '</td>';
                    }

                    visitorInfoHtml += '<td class="key'+cssClass+'">' + inputField.title + '</td>';
                    visitorInfoHtml += '<td class="content'+cssClass+'">' + contentString + '</td>';

                    if(inputField.editable && DataEngine.operators.GetFieldMaskLevel(inputField.editkey) === 0)
                        visitorInfoHtml += '<td class="edit'+cssClass+'"><a href="#" onclick="EditVisitorDetails(\''+_visitorObj.id+'\',\''+inputField.editkey+'\',\''+elementId+'\');"><i class="fa fa-pencil icon-blue lzm-clickable2" style="float:right;"></i></a></td></tr>';
                    else
                        visitorInfoHtml +='<td'+cssClass+'></td></tr>';
                }
                visitorInfoHtml += '</tbody></table></div>';
            }
        }
    }
    else
    {
        return "";
    }
    return visitorInfoHtml;
};

ChatVisitorClass.prototype.GetOfflineVisitorField = function(){
    return '';
};

ChatVisitorClass.prototype.CreateBrowserHistory = function (_visitor, elementId, rv) {

    var that = this;
    var containerDivId = d(rv) ? ' id="recent-history-'+elementId+'-' + rv.id + '"' : '';
    var browserHistoryHtml = '<div' + containerDivId + ' class="browser-history-container" style="overflow-y:auto;height:100%;">';
    var lineCounter = 0;
    var browserCounter = 1;

    try
    {
        var browserList = d(rv) ? (rv.b) : (d(_visitor.b) ? (_visitor.b) : null);
        if(browserList != null)
            for (var i = browserList.length-1;i>=0; i--)
            {
                if (d(browserList[i].h2) && browserList[i].h2.length > 0)
                {
                    browserHistoryHtml += '<div class="top-space bottom-space left-space"><b class="text-darkgray">'+tid('browser') + ' ' + (i+1)+'</b></div>';

                    for (var j = browserList[i].h2.length-1;j >= 0; j--)
                    {
                        var browserIcon = 'arrow-circle-up';
                        var browserBackground = 'gray';

                        if(j == 0)
                        {
                            browserIcon = 'arrow-circle-right';
                            browserBackground = 'green';
                        }


                        var beginTime = lzm_chatTimeStamp.getLocalTimeObject(browserList[i].h2[j].time * 1000, true);
                        var beginTimeHuman = lzm_commonTools.getHumanDate(beginTime, 'shorttime', lzm_chatDisplay.userLanguage);
                        var endTime = lzm_chatTimeStamp.getLocalTimeObject();

                        if (browserList[i].h2.length > (j + 1))
                            endTime = lzm_chatTimeStamp.getLocalTimeObject(browserList[i].h2[j + 1].time * 1000, true);

                        var endTimeHuman = lzm_commonTools.getHumanDate(endTime, 'shorttime', lzm_chatDisplay.userLanguage);
                        var timeSpan = that.calculateTimeSpan(beginTime, endTime);
                        var referer = '';

                        if (j == 0)
                        {
                            referer = browserList[i].h2[j].ref.u;
                        }

                        if (j > 0)
                        {
                            try
                            {
                                referer = browserList[i].h2[j - 1].url;
                            }
                            catch(ex)
                            {
                                deblog(ex);
                            }
                        }

                        if (!d(rv) && browserList[i].is_active && j == browserList[i].h2.length - 1)
                        {
                            browserIcon = 'cog';
                            browserBackground = 'purple';
                        }
                        else if (j == browserList[i].h2.length - 1)
                        {
                            browserIcon = 'arrow-circle-left';
                            browserBackground = 'red';
                        }

                        var externalPageUrl = '';
                        try
                        {
                            externalPageUrl = browserList[i].h2[j].url;
                        }
                        catch(ex) {}

                        var refererLink = (referer != '') ? '<a class="lz_chat_link_no_icon" href="#" onclick="openLink(\'' + referer + '\')" title="'+referer+'">' + lzm_commonTools.SubStr(referer,64,true) : '';
                        var chatPageString = '';
                        var lastTimeSpanId = (j == browserList[i].h2.length - 1) ? ' id="visitor-history-'+elementId+'-last-timespan-b' + i + '"' : '';
                        var lastTimeId = (j == browserList[i].h2.length - 1) ? ' id="visitor-history-'+elementId+'-last-time-b' + i + '"' : '';

                        browserHistoryHtml += '<div class="lzm-fieldset" style="border-left:40px solid var(--'+browserBackground+');position:relative;">' +
                            '<div class=""><span class="fa fa-'+browserIcon+' icon-xl text-white" style="position:absolute;top:35%;left:-31px;"></span>' +
                            '<span class="" ' + lastTimeId + '><b class="text-darkgray">'+tidc('time')+'</b>&nbsp;' + beginTimeHuman + ' - ' + endTimeHuman + '</span>&nbsp;&nbsp;&nbsp;' +
                            '<span class=""  ' + lastTimeSpanId + '><b class="text-darkgray">'+tidc('timespan')+'</b>&nbsp;' + timeSpan + '</span>&nbsp;&nbsp;&nbsp;';

                        if((browserList[i].h2[j].code + chatPageString).length)
                            browserHistoryHtml += '<span class=""><b class="text-darkgray">'+tidc('website_name')+'</b>&nbsp;' + browserList[i].h2[j].code + chatPageString + '</span>';

                        browserHistoryHtml += '</div><div class="top-space"><b>'+tidc('title')+'</b>&nbsp;&nbsp;' + lzm_commonTools.escapeHtml(browserList[i].h2[j].title) + '</div>';
                        browserHistoryHtml += '<div class="top-space"><b>URL:</b>&nbsp;&nbsp;<a class="lz_chat_link_no_icon" href="#" onclick="openLink(\'' + externalPageUrl + '\')" title="'+externalPageUrl+'">' + lzm_commonTools.SubStr(externalPageUrl,64,true) + '</a></div>';

                        if(refererLink.length)
                            browserHistoryHtml += '<div class="top-space-half"><b>'+tidc('referer')+'</b>&nbsp;&nbsp;' + refererLink + '</a></div>';
                        browserHistoryHtml += '</div>';

                        if(j > 0)
                            browserHistoryHtml += '<div style="height:10px;border-left:24px solid #dbe1e6;margin-left:8px;"></div>';

                        lineCounter++;
                    }

                    browserHistoryHtml += '</fieldset>';
                    browserCounter++;
                }

            }
    }
    catch(e)
    {
        deblog(e);
    }
    browserHistoryHtml += '</tbody></table></div>';
    return browserHistoryHtml;
};

ChatVisitorClass.prototype.CreateVisitorCommentTable = function(visitor, elementId) {
    var userName = (typeof visitor.name != 'undefined' && visitor.name != '') ? visitor.name : visitor.unique_name;
    var menuEntry = t('Visitor Information: <!--name-->', [['<!--name-->', userName]]);
    var commentTableHtml = '<div class="lzm-dialog-headline3"><span style="float:right;">';
    commentTableHtml += lzm_inputControls.createButton('add-comment', '', 'addVisitorComment(\'' + visitor.id + '\', \'' + menuEntry + '\')', t('Add Comment'), '<i class="fa fa-plus"></i>', 'lr', {'margin-right':'4px'}, t('Add Comment'),'','e');
    commentTableHtml += '</span></div><div id="visitor-comment-'+elementId+'-table">';
    try
    {
        if(visitor.c)
            for (var i=0; i<visitor.c.length; i++)
            {
                var operator = DataEngine.operators.getOperator(visitor.c[i].o);
                var commentText = visitor.c[i].text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n/g, '<br />');
                commentTableHtml += lzm_chatDisplay.createCommentHtml(commentText, operator.id, visitor.c[i].c);
            }
    }
    catch(e)
    {
        deblog(e);
    }
    commentTableHtml += '</div>';
    return commentTableHtml;
};

ChatVisitorClass.prototype.CreateVisitorInvitationTable = function(_visitor, _elementId) {

    var chatInfo = _elementId.indexOf('e-') === 0;
    var invitationTableHtml = '<table class="visible-list-table alternating-rows-table lzm-unselectable" id="visitor-invitation-'+_elementId+'-table">';

    if(!chatInfo)
        invitationTableHtml += '<thead><tr>' +
            '<th style="width: 8px !important; padding-left: 11px; padding-right: 11px;"></th>' +
            '<th>' + tid('date') + '</th>' +
            '<th>' + tid('sender') + '</th>' +
            '<th>' + tid('group') + '</th>' +
            '<th>' + tid('event') + '</th>' +
            '<th>' + tid('shown') + '</th>' +
            '<th>' + tid('accepted') + '</th>' +
            '<th>' + tid('declined') + '</th>' +
            '<th>' + tid('canceled') + '</th>' +
            '</tr></thead>';

    invitationTableHtml += '<tbody>';

    try
    {
        if(d(_visitor.r))
            for (var i=0; i<_visitor.r.length; i++)
            {
                var wordResult = tid('declined');
                var visitorInvitationFont = '<i class="fa icon-flip-hor fa-commenting"></i>';
                if (_visitor.r.length > 0)
                {
                    if (_visitor.r[i].s != '' && _visitor.r[i].ca == '' && _visitor.r[i].a == 0 && _visitor.r[i].de == 0)
                    {
                        wordResult = tid('active');
                        visitorInvitationFont = '<i class="fa fa-commenting icon-flip-hor icon-blue" title="'+tidc('invitation',' (' + tid('active') + ')')+'"></i>';
                    }
                    else if(_visitor.r[i].s != '' && _visitor.r[i].a == '1')
                    {
                        wordResult = tid('accepted');
                        visitorInvitationFont = '<i class="fa fa-commenting icon-flip-hor icon-green" title="'+tidc('invitation',' (' + tid('accepted') + ')')+'"></i>';
                    }
                    else if(_visitor.r[i].s != '' && _visitor.r[i].ca != '')
                        visitorInvitationFont = '<i class="fa fa-commenting icon-flip-hor icon-red" title="'+tidc('invitation',' (' + tid('declined') + ')')+'"></i>';
                    else if(_visitor.r[i].s != '' && _visitor.r[i].de == '1')
                        visitorInvitationFont = '<i class="fa fa-commenting icon-flip-hor icon-red" title="'+tidc('invitation',' (' + tid('declined') + ')')+'"></i>';
                }

                var tmpDate = lzm_chatTimeStamp.getLocalTimeObject(_visitor.r[i].c * 1000, true);
                var timeHuman = lzm_commonTools.getHumanDate(tmpDate, 'all', lzm_chatDisplay.userLanguage);
                var groupName='',operatorName = '',cancelOpName='';

                try
                {
                    operatorName = OperatorManager.GetOperatorName(_visitor.r[i].s);
                    groupName = _visitor.r[i].g;
                }
                catch(e)
                {
                    deblog(e);
                }
                var myEvent = (_visitor.r[i].e != '') ? _visitor.r[i].e : '-';

                if(myEvent != '')
                {
                    for(var key in DataEngine.eventList)
                        for(var akey in DataEngine.eventList[key].Actions)
                            if(DataEngine.eventList[key].Actions[akey].id == _visitor.r[i].e)
                            {
                                myEvent = DataEngine.eventList[key].name;
                            }

                }

                var isShown = (_visitor.r[i].d == "1") ? t('Yes') : t('No');
                var isAccepted = (_visitor.r[i].a == "1" && _visitor.r[i].ca == "") ? t('Yes') : t('No');
                var isDeclined = (_visitor.r[i].de == "1") ? t('Yes') : t('No');
                var isCanceled = (_visitor.r[i].ca != "") ? t('Yes (<!--op_name-->)', [['<!--op_name-->', t('Timeout')]]) : t('No');

                try
                {
                    cancelOpName = OperatorManager.GetOperatorName(_visitor.r[i].ca);
                    isCanceled = (_visitor.r[i].ca != "") ? t('Yes (<!--op_name-->)', [['<!--op_name-->', cancelOpName]]) : t('No');
                }
                catch(e)
                {
                    deblog(e);
                }

                invitationTableHtml += '<tr class="lzm-unselectable"><td class="icon-column">'+visitorInvitationFont+'</td><td style="width:150px;">' + timeHuman + '</td>';

                if(!chatInfo)
                    invitationTableHtml += '<td>' + operatorName + '</td>' +
                        '<td>' + groupName + '</td>' +
                        '<td>' + myEvent + '</td>' +
                        '<td>' + isShown + '</td>' +
                        '<td>' + isAccepted + '</td>' +
                        '<td>' + isDeclined + '</td>' +
                        '<td>' + isCanceled + '</td>';
                else
                {
                    invitationTableHtml += '<td>' + myEvent + '</td>';
                    invitationTableHtml += '<td>' + wordResult + '</td>';
                }

                invitationTableHtml += '</tr>';
            }
    }
    catch(e)
    {
        deblog(e);
    }
    invitationTableHtml += '</tbody></table>';

    return invitationTableHtml;
};

ChatVisitorClass.prototype.addVisitorComment = function(visitorId) {
    var commentControl = '<fieldset class="lzm-fieldset"><legend>'+tid('comment')+'</legend>' + lzm_inputControls.createArea('new-comment-field', '', '', '','min-width:300px;height:90px;') + '</fieldset>';
    lzm_commonDialog.createAlertDialog(commentControl, [{id: 'ok', name: tid('ok')},{id: 'cancel', name: tid('cancel')}],true);
    $('#new-comment-field').select();
    $('#alert-btn-ok').click(function() {
        var commentText = $('#new-comment-field').val();
        UserActions.saveVisitorComment(visitorId, commentText);
        ChatVisitorClass.LoadVisitorInformation(visitorId);
        lzm_commonDialog.removeAlertDialog();
    });
    $('#alert-btn-cancel').click(function() {
        lzm_commonDialog.removeAlertDialog();
    });
};

ChatVisitorClass.prototype.EditVisitorDetails = function(visitorId,field,elementId){
    var visitor = VisitorManager.GetVisitor(visitorId);
    var hidden = [], selectedField, value;
    var inputForm = '', input='',inputss='',inputsc='';
    for (var i=0; i<DataEngine.inputList.idList.length; i++)
    {
        var myCustomInput = DataEngine.inputList.getCustomInput(DataEngine.inputList.idList[i]);
        if (myCustomInput.active == 1 && $.inArray(myCustomInput.id,hidden) == -1)
        {
            value = DataEngine.inputList.getInputValueFromVisitor(myCustomInput.id,visitor,null,true);

            if(myCustomInput.id==field)
                selectedField = myCustomInput.id;

            var masked = DataEngine.operators.GetFieldMaskLevel(myCustomInput.id, 'chat') > 0;
            var classes = (masked ? ' ui-disabled' : '');
            input = '<div class="' + classes + '">' + DataEngine.inputList.getControlHTML(myCustomInput,'evd-'+elementId+'-' + visitorId + myCustomInput.id, 'evd-'+elementId + '-' + visitorId,value,true) + '</div><br>';

            if(myCustomInput.id<111)
                inputsc += input;
            else
                inputss += input;
        }
    }
    inputForm += inputss + inputsc;
    inputForm = '<div class="spaced">'+inputForm+'</div>';

    lzm_commonDialog.createAlertDialog(inputForm, [{id: 'evd-ok', name: t('Ok')}, {id: 'evd-cancel', name: tid('cancel')}]);

    $('#evd-'+elementId+'-' + visitorId + selectedField).select();
    $('#alert-btn-evd-ok').click(function() {
        var newData = {p_vi_id:visitorId};
        for (var i=0; i<DataEngine.inputList.idList.length; i++)
        {
            var myCustomInput = DataEngine.inputList.getCustomInput(DataEngine.inputList.idList[i]);
            if (myCustomInput.active == 1 && $.inArray(myCustomInput.id,hidden) == -1 && DataEngine.operators.GetFieldMaskLevel(myCustomInput.id, 'chat') == 0)
            {
                var id = 'evd-'+elementId+'-' + visitorId + myCustomInput.id;
                newData['p_f' + myCustomInput.id] = lz_global_base64_url_encode(DataEngine.inputList.getControlValue(myCustomInput,id));
                if(myCustomInput.id == 111)
                {
                    var newName = DataEngine.inputList.getControlValue(myCustomInput,id);
                    VisitorManager.UpdateVisitorNameInTaskBar(visitorId,newName);
                }
            }
        }
        CommunicationEngine.pollServerSpecial(newData, 'set_visitor_details');
        lzm_commonDialog.removeAlertDialog();
    });
    $('#alert-btn-evd-cancel').click(function() {
        lzm_commonDialog.removeAlertDialog();
    });
};

ChatVisitorClass.prototype.showVisitorInvitation = function(aVisitor) {
    var that = this;

    if((!IFManager.IsAppFrame && !IFManager.IsMobileOS) || IFManager.IsDesktopApp())
        ChatVisitorClass.ChatInviteEditor = new ChatEditorClass('invitation-text');

    var text = '';
    var footerString =
        lzm_inputControls.createButton('send-invitation', 'ui-disabled', '', t('Ok'), '', 'lr',{'margin-left': '4px'},'',30,'d') +
            lzm_inputControls.createButton('cancel-invitation', '', '', t('Cancel'), '', 'lr',{'margin-left': '4px'},'',30,'d');

    var dialogData = {editors: [{id: 'invitation-text', instanceName: 'invitation-text'}], 'visitor-id': aVisitor.id};

    lzm_commonDialog.CreateDialogWindow(t('Chat Invitation'), that.createVisitorInvitation(aVisitor), footerString, 'commenting-o','chat-invitation','chat-invitation','cancel-invitation', true, dialogData);

    $('#invitation-text-inner').addClass('lzm-text-input-inner');
    $('#invitation-text').css({border:0});

    if((!IFManager.IsAppFrame && !IFManager.IsMobileOS) || IFManager.IsDesktopApp())
        $('#invitation-text-controls').addClass('lzm-text-input-controls');
    else
        $('#invitation-text-controls').addClass('lzm-text-input-controls-mobile');

    if((!IFManager.IsAppFrame && !IFManager.IsMobileOS) || IFManager.IsDesktopApp())
        $('#invitation-text-body').addClass('lzm-text-input-body');

    text = UserActions.getChatPM(null, aVisitor.id, $('#browser-selection').val(), 'invm', $('#language-selection').val().split('---')[0],$('#group-selection').val())['invm'];
    if ((!IFManager.IsMobileOS && !IFManager.IsAppFrame) || IFManager.IsDesktopApp())
        ChatVisitorClass.ChatInviteEditor.init(text, '');
    else
        $('#invitation-text').html(text);


    $('#group-selection').change(function(){
        var selGroup = '';
        if ($('#language-selection').val().split('---')[1] == 'group')
        {
            selGroup = $('#group-selection').val();
        }
        var langHtml = that.CreateVisitorInvitationLanguages(selGroup,aVisitor);
        $('#language-selection').html(langHtml);
        $('#language-selection').change(function() {
            var selLanguage = $('#language-selection').val().split('---')[0];
            var selGroup = '';
            if ($('#language-selection').val().split('---')[1] == 'group')
            {
                selGroup = $('#group-selection').val();
            }
            try
            {

                text = UserActions.getChatPM(null, aVisitor.id, $('#browser-selection').val(), 'invm', selLanguage, selGroup)['invm'];
            }
            catch(e)
            {
                text = '';
            }
            if((!IFManager.IsAppFrame && !IFManager.IsMobileOS) || IFManager.IsDesktopApp())
            {
                ChatVisitorClass.ChatInviteEditor.setHtml(text);
            }
            else
            {
                $('#invitation-text').html(text);
            }
        });
        $('#language-selection').change();
    });
    $('#group-selection').change();

    if ($('#browser-selection').val() != -1)
        $('#send-invitation').removeClass('ui-disabled');
    else
        $('#send-invitation').addClass('ui-disabled');

    $('#browser-selection').change(function() {
        if ($('#browser-selection').val() != -1)
            $('#send-invitation').removeClass('ui-disabled');
        else
            $('#send-invitation').addClass('ui-disabled');

    });
    $('#withdraw-invitation').click(function() {
        if((!IFManager.IsAppFrame && !IFManager.IsMobileOS) || IFManager.IsDesktopApp()) {
            delete ChatVisitorClass.ChatInviteEditor;
        }
        cancelInvitation(aVisitor.id);
        TaskBarManager.RemoveActiveWindow();

    });
    $('#cancel-invitation').click(function() {

        if((!IFManager.IsAppFrame && !IFManager.IsMobileOS) || IFManager.IsDesktopApp()) {
            delete ChatVisitorClass.ChatInviteEditor;
        }
        TaskBarManager.RemoveActiveWindow();
    });
    $('#send-invitation').click(function() {
        var thisGroup = DataEngine.groups.getGroup($('#group-selection').val());
        if (thisGroup == null || thisGroup.oh == '1')
        {
            if ((!IFManager.IsMobileOS && !IFManager.IsAppFrame) || IFManager.IsDesktopApp())
            {
                text = ChatVisitorClass.ChatInviteEditor.grabHtml();
                delete ChatVisitorClass.ChatInviteEditor;
            }
            else
            {
                text = $('#invitation-text').val()
            }

            if(ChatPollServerClass.__UserStatus == 3)
                setUserStatus(0, null);

            inviteExternalUser(aVisitor.id, $('#browser-selection').val(), text, thisGroup.id);
            TaskBarManager.RemoveActiveWindow();
        }
        else
        {
            showOutsideOpeningMessage(thisGroup.name);
        }
    });

    UIRenderer.resizeVisitorInvitation();

    if(!IFManager.IsMobileOS)
        $('#browser-selection').focus();
};

ChatVisitorClass.prototype.CreateVisitorInvitationLanguages = function(_groupId, visitor){

    var languageSelectHtml = '',langName,pmLanguages = UserActions.getPmLanguages(_groupId);
    var issel,i,visitorLangString = visitor.lang.toUpperCase().substr(0,2);
    visitorLangString = ($.inArray(visitorLangString, pmLanguages.group) != -1) ? visitorLangString : pmLanguages['default'][1];
    for (i=0; i<pmLanguages.group.length; i++)
    {
        langName = (typeof lzm_chatDisplay.availableLanguages[pmLanguages.group[i].toLowerCase().split('-')[0]] != 'undefined') ? pmLanguages.group[i] + ' - ' + lzm_chatDisplay.availableLanguages[pmLanguages.group[i].toLowerCase().split('-')[0]] : pmLanguages.group[i];
        issel = (visitorLangString == pmLanguages.group[i]) ? ' selected="selected"' : '';
        languageSelectHtml += '<option '+issel+' value="' + pmLanguages.group[i] + '---group">' + langName + '</option>';
    }
    return languageSelectHtml;
};

ChatVisitorClass.prototype.createVisitorInvitation = function(visitor) {

    var myGroups = lzm_chatDisplay.myGroups, i = 0, browsers = [], labrowser={la:0,bid:''};
    for (i=0; i<visitor.b.length; i++)
    {
        if (visitor.b[i].id.indexOf('_OVL') == -1 && visitor.b[i].is_active)
        {
            var thisBrowser = lzm_commonTools.clone(visitor.b[i]);
            if(thisBrowser != null && d(thisBrowser.h2))
            {
                var historyLastEntry = thisBrowser.h2.length - 1;
                thisBrowser.url = thisBrowser.h2[historyLastEntry].url;

                if(thisBrowser.url.indexOf('chat.php?v=2') !== -1)
                    continue;

                var tmpDate = lzm_chatTimeStamp.getLocalTimeObject(thisBrowser.h2[historyLastEntry].time * 1000, true);
                thisBrowser.time = lzm_commonTools.getHumanDate(tmpDate, 'time', lzm_chatDisplay.userLanguage);
                thisBrowser.lastActivityTimeHuman = lzm_commonTools.getHumanDate(tmpDate, 'shorttime', lzm_chatDisplay.userLanguage);
                browsers.push(thisBrowser);

                if(labrowser.la < thisBrowser.h2[historyLastEntry].time)
                    labrowser = {la:thisBrowser.h2[historyLastEntry].time,bid:visitor.b[i].id};
            }
        }
    }

    // languages
    var languageSelectHtml = '<fieldset class="lzm-fieldset-full"><legend>' + tidc('language') + '</legend><select id="language-selection">';
    languageSelectHtml += this.CreateVisitorInvitationLanguages(DataEngine.groups.getGroup(myGroups[0]).id,visitor);
    languageSelectHtml += '</select></fieldset>';

    // group
    var groupSelectHtml = '<fieldset class="lzm-fieldset-full"><legend>' + tidc('group') + '</legend><select id="group-selection">';
    for (i=0; i<myGroups.length; i++)
    {
        var thisGroup = DataEngine.groups.getGroup(myGroups[i]);
        if (thisGroup != null && typeof thisGroup.oh != 'undefined' && thisGroup.external == 1)
            groupSelectHtml += '<option value="' + myGroups[i] + '">' + DataEngine.groups.getGroup(myGroups[i]).id + '</option>';
    }
    groupSelectHtml += '</select></fieldset>';

    var browserSelectHtml = '<fieldset class="lzm-fieldset-full"><legend>' + tidc('browser') + '</legend><select id="browser-selection" class="lzm-multiselect" size="3" style="height:86px;">';
    if (browsers.length != 0)
        for (i=browsers.length-1; i>=0; i--)
        {


            browserSelectHtml += '<option value="' + browsers[i].id + '"'+(browsers[i].id==labrowser.bid ? ' selected' : '')+'>Browser ' + (i + 1) + ' (' + browsers[i].lastActivityTimeHuman +'): ' + browsers[i].url + '</option>';
        }
    else
    {
        browserSelectHtml += '<option value="-1">' + t('No active browser') + '</option>';
    }

    browserSelectHtml += '</select></fieldset>';
    var textInputHtml = '<fieldset class="lzm-fieldset-full"><legend>' + tidc('invitation_text') + '</legend>' +
        '<div id="invitation-text-inner">' +
        '<div id="invitation-text-controls">' +
        lzm_inputControls.CreateInputControlPanel('basic').replace(/lzm_chatInputEditor/g,'ChatVisitorClass.ChatInviteEditor') +
        '</div><div id="invitation-text-body"><textarea id="invitation-text"></textarea></div></div></fieldset>';

    return '<div id="user-invite-form"><div id="user-invite-form-inner">' + languageSelectHtml + groupSelectHtml +  browserSelectHtml + textInputHtml + '</div></div>';
};

ChatVisitorClass.prototype.showTranslateOptions = function(visitorChat, language) {

    var translateOptions = this.createTranslateOptions(visitorChat, language);
    var bodyString = translateOptions[0] + translateOptions[1];

    lzm_commonDialog.createAlertDialog(bodyString, [{id: 'ok', name: tid('ok')},{id: 'cancel', name: tid('cancel')}],true);

    if (lzm_chatDisplay.translationServiceError != null)
    {
        lzm_commonDialog.createAlertDialog(t('An error occured while fetching the languages from the Google Translate server.'), [{id: 'ok', name: t('Ok')}]);
        $('#alert-btn-ok').click(function() {
            lzm_commonDialog.removeAlertDialog();
            UserActions.getTranslationLanguages();
        });
    }
    $('#tmm-checkbox').change(function() {
        if ($('#tmm-checkbox').prop('checked')) {
            $('#tmm-select-div').removeClass('ui-disabled');
        } else {
            $('#tmm-select-div').addClass('ui-disabled');
        }
    });
    $('#tvm-checkbox').change(function() {
        if ($('#tvm-checkbox').prop('checked')) {
            $('#tvm-select-div').removeClass('ui-disabled');
        } else {
            $('#tvm-select-div').addClass('ui-disabled');
        }
    });

    $('#alert-btn-ok').click(function() {
        var tmm = {translate: $('#tmm-checkbox').prop('checked'), sourceLanguage: $('#tmm-source').val(), targetLanguage: $('#tmm-target').val()};
        var tvm = {translate: $('#tvm-checkbox').prop('checked'), sourceLanguage: 'AUTO', targetLanguage: $('#tvm-target').val()};
        UserActions.saveTranslationSettings(visitorChat, tmm, tvm);

        lzm_commonDialog.removeAlertDialog();

        OpenChatWindow(ChatManager.ActiveChat);
        lzm_chatInputEditor.focus();
    });
    $('#alert-btn-cancel').click(function() {
        lzm_commonDialog.removeAlertDialog();
    });
};

ChatVisitorClass.prototype.createTranslateOptions = function(visitorChat,language) {
    var translateOptions = ['', ''], selectedString = '', i;
    var sourceLanguage = (d(lzm_chatDisplay.chatTranslations[visitorChat]) && lzm_chatDisplay.chatTranslations[visitorChat].tmm != null) ? lzm_chatDisplay.chatTranslations[visitorChat].tmm.sourceLanguage : UserActions.gTranslateLanguage;
    var targetLanguage = (d(lzm_chatDisplay.chatTranslations[visitorChat]) && lzm_chatDisplay.chatTranslations[visitorChat].tmm != null) ? lzm_chatDisplay.chatTranslations[visitorChat].tmm.targetLanguage : language;
    var translate = (d(lzm_chatDisplay.chatTranslations[visitorChat]) && lzm_chatDisplay.chatTranslations[visitorChat].tmm != null) ? lzm_chatDisplay.chatTranslations[visitorChat].tmm.translate : false;
    var checkedString = (translate) ? ' checked="checked"' : '';
    var disabledString = (!translate) ? ' ui-disabled' : '';

    translateOptions[0] = '<fieldset style="width: 500px;" class="lzm-fieldset-full" id="translate-my-messages"><legend>' +
        t('My messages') + '</legend>' +
        '<input' + checkedString + ' type="checkbox" class="checkbox-custom" id="tmm-checkbox" style="vertical-align: middle;" />' +
        '<label for="tmm-checkbox" class="checkbox-custom-label">' + t('Translate my messages') + '</label><div id="tmm-select-div" class="top-space left-space-child' + disabledString + '">';

    translateOptions[0] += '<label style="display:none;" for="tmm-source">' + t('Translate from:') + '</label>' +
        '<select style="display:none;" class="lzm-select translation-language-select" id="tmm-source">';

    for (i=0; i<lzm_chatDisplay.translationLanguages.length; i++)
    {
        selectedString = (lzm_chatDisplay.translationLanguages[i].language.toLowerCase() == sourceLanguage.toLowerCase()) ? ' selected="selected"' : '';
        translateOptions[0] += '<option' + selectedString + ' value="' + lzm_chatDisplay.translationLanguages[i].language + '">' +
            lzm_chatDisplay.translationLanguages[i].name + ' - ' + lzm_chatDisplay.translationLanguages[i].language.toUpperCase() + '</option>';
    }

    translateOptions[0] +='</select>' +
        '<label for="tmm-target">' + t('Translate into:') + '</label>' +
        '<select class="lzm-select translation-language-select" id="tmm-target">';

    for (i=0; i<lzm_chatDisplay.translationLanguages.length; i++)
    {
        selectedString = (lzm_chatDisplay.translationLanguages[i].language.toLowerCase() == targetLanguage.toLowerCase()) ? ' selected="selected"' : '';
        translateOptions[0] += '<option' + selectedString + ' value="' + lzm_chatDisplay.translationLanguages[i].language + '">' +
            ChatTranslationEditorClass.IsoToName(lzm_chatDisplay.translationLanguages[i].language)[0] + ' - ' + lzm_chatDisplay.translationLanguages[i].language.toUpperCase() + '</option>';
    }
    translateOptions[0] +='</select></div></fieldset>';

    targetLanguage = (typeof lzm_chatDisplay.chatTranslations[visitorChat] != 'undefined' && lzm_chatDisplay.chatTranslations[visitorChat].tvm != null) ? lzm_chatDisplay.chatTranslations[visitorChat].tvm.targetLanguage : UserActions.gTranslateLanguage;

    translate = (typeof lzm_chatDisplay.chatTranslations[visitorChat] != 'undefined' && lzm_chatDisplay.chatTranslations[visitorChat].tvm != null) ? lzm_chatDisplay.chatTranslations[visitorChat].tvm.translate : false;
    checkedString = (translate) ? ' checked="checked"' : '';
    disabledString = (!translate) ? ' ui-disabled' : '';
    translateOptions[1] = '<fieldset style="width: 500px;" class="lzm-fieldset-full top-space-double" id="translate-visitor-messages"><legend>' + t('Visitor\'s messages') + '</legend>' +
        '<input' + checkedString + ' type="checkbox" data-role="none" class="checkbox-custom" id="tvm-checkbox" style="vertical-align: middle;" />' +
        '<label for="tvm-checkbox" class="checkbox-custom-label">' + tid('translate_visitor_messages') + '</label>' +
        '<div id="tvm-select-div" class="top-space left-space-child' + disabledString + '">' +
        '<label for="tvm-target">' + t('Translate into:') + '</label>' +
        '<select class="lzm-select translation-language-select" id="tvm-target">';

    if(d(lzm_chatDisplay.translationLanguages))
        for (i=0; i<lzm_chatDisplay.translationLanguages.length; i++)
        {
            selectedString = (lzm_chatDisplay.translationLanguages[i].language.toLowerCase() == targetLanguage.toLowerCase()) ? ' selected="selected"' : '';
            translateOptions[1] += '<option' + selectedString + ' value="' + lzm_chatDisplay.translationLanguages[i].language + '">' +
                ChatTranslationEditorClass.IsoToName(lzm_chatDisplay.translationLanguages[i].language)[0] + ' - ' + lzm_chatDisplay.translationLanguages[i].language.toUpperCase() + '</option>';
        }

    translateOptions[1] +='</select></div></fieldset>';
    return translateOptions;
};

ChatVisitorClass.prototype.createVisitorPageString = function(aUser,_table) {
    var activeBrowserCounter = 0, activeBrowserUrl = '';
    try {
        for (var i=0; i< aUser.b.length; i++) {
            if (aUser.b[i].id.indexOf('OVL') == -1 && aUser.b[i].is_active) {
                activeBrowserCounter++;
                var historyLength = aUser.b[i].h2.length;
                var url = aUser.b[i].h2[historyLength - 1].url;
                var text = lzm_commonTools.SubStr(url,(_table) ? 64 : 512,true);
                if(!this.isFullScreenMode())
                    activeBrowserUrl = text;
                else
                    activeBrowserUrl = '<a href="#" class="lz_chat_link_no_icon" data-role="none" onclick="openLink(\'' + url + '\');">' + text + '</a>';
            }
        }
    } catch(ex) {}
    if (activeBrowserCounter > 1) {
        activeBrowserUrl = t('<!--number_of_browsers--> Browsers', [['<!--number_of_browsers-->', activeBrowserCounter]]);
    }
    return activeBrowserUrl;
};

ChatVisitorClass.prototype.getTimeDifferenceData = function(aUser, type, includeSeconds){
    if(!d(aUser.b))
        return [0,0];

    var tmpBegin, tmpTimeDifference, tmpDiffSeconds, tmpDiffMinutes, tmpDiffHours, tmpDiffDays, tmpRest, returnString = '';
    var i;
    if (type=='lastOnline')
    {
        tmpBegin = lz_global_timestamp() + parseInt(Client.TimeDifference);
        for (i=0; i<aUser.b.length; i++)
        {
            if (d(aUser.b[i].h2) && aUser.b[i].id.indexOf('_OVL')==-1 && aUser.b[i].h2.length > 0)
            {
                tmpBegin = Math.min(aUser.b[i].h2[0].time, tmpBegin);
            }
        }
    }
    else if (type=='lastActive')
    {
        tmpBegin = 0;
        for (i=0; i<aUser.b.length; i++)
        {
            if (d(aUser.b[i].h2) && aUser.b[i].h2.length > 0)
            {
                var newestH = aUser.b[i].h2.length - 1;
                tmpBegin = Math.max(aUser.b[i].h2[newestH].time, tmpBegin);
            }
        }
    }
    if (tmpBegin == 0)
        tmpBegin = lz_global_timestamp() + parseInt(Client.TimeDifference);

    tmpTimeDifference = lz_global_timestamp() + parseInt(Client.TimeDifference) - tmpBegin;
    tmpDiffSeconds = Math.max(0, tmpTimeDifference % 60);
    tmpRest = Math.floor(tmpTimeDifference / 60);
    tmpDiffMinutes = Math.max(0, tmpRest % 60);
    tmpRest = Math.floor(tmpRest / 60);
    tmpDiffHours = Math.max(0, tmpRest % 24);
    tmpDiffDays = Math.max(0, Math.floor(tmpRest / 24));
    return {begin: tmpBegin, total: tmpTimeDifference, seconds: tmpDiffSeconds, minutes: tmpDiffMinutes, hours: tmpDiffHours, days: tmpDiffDays};
};

ChatVisitorClass.prototype.calculateMobileTimeDifference = function(_visitor, _type, _includeSeconds) {
    var returnString = '';
    var time = this.getTimeDifferenceData(_visitor, _type, _includeSeconds);

    if (time.days > 0)
        returnString += time.days + ' d ';
    if (time.hours > 0)
        returnString += time.hours + ' h ';

    if(time.days==0 && time.hours==0 && time.minutes == 0)
        returnString = tid('now');
    else
        returnString += time.minutes + ' min';

    return [returnString, time.begin];
};

ChatVisitorClass.prototype.calculateTimeDifference = function(aUser, type, includeSeconds) {
    var returnString = '';
    var time = this.getTimeDifferenceData(aUser, type, includeSeconds);

    if (time.days > 0)
        returnString += time.days + ' ';

    returnString += '<!-- ' + time.begin + ' -->' + lzm_commonTools.pad(time.hours, 2) + ':' + lzm_commonTools.pad(time.minutes, 2);
    if (typeof includeSeconds != 'undefined' && includeSeconds) {
        returnString += ':' + lzm_commonTools.pad(Math.round(time.seconds), 2);
    }
    return [returnString, time.begin];
};

ChatVisitorClass.prototype.createCustomInputString = function(visitor, inputId, _makeClickable) {
    var val = DataEngine.inputList.getInputValueFromVisitor(inputId,visitor).replace(/-/g,'&#8209;');
    if(_makeClickable)
    {
        if(inputId == 116 && val.length)
            val = '<a href="#" onclick="showPhoneCallDialog(\''+visitor.i+'\', -1, \'chat\');">' + val + '</a>';
        else
            val = lzm_commonTools.MakeLink(val);
    }
    return val;
};

ChatVisitorClass.prototype.getVisitorOnlineTimes = function(visitor) {
    var rtObject = {}, that = this;
    rtObject['online'] = that.calculateTimeDifference(visitor, 'lastOnline', false)[0].replace(/-/g,'&#8209;').replace(/ /g,'&nbsp;');
    rtObject['active'] = that.calculateTimeDifference(visitor, 'lastActive', false)[0].replace(/-/g,'&#8209;').replace(/ /g,'&nbsp;');
    return rtObject;
};

ChatVisitorClass.prototype.calculateTimeSpan = function(beginTime, endTime) {

    var secondsSpent = endTime.getSeconds() - beginTime.getSeconds();
    var minutesSpent = endTime.getMinutes() - beginTime.getMinutes();
    var hoursSpent = endTime.getHours() - beginTime.getHours();
    var daysSpent = endTime.getDate() - beginTime.getDate();
    if (daysSpent < 0) {
        var currentMonth = endTime.getMonth();
        var monthLength = 31;
        if ($.inArray(currentMonth, [3,5,8,10]) != -1) {
            monthLength = 30;
        }
        if (currentMonth == 1) {
            monthLength = 28;
        }
        daysSpent = (monthLength - beginTime.getDate()) + endTime.getDate();
    }
    if (secondsSpent < 0) {
        secondsSpent += 60;
        minutesSpent -= 1;
    }
    if (minutesSpent < 0) {
        minutesSpent += 60;
        hoursSpent -= 1;
    }
    if (hoursSpent < 0) {
        hoursSpent += 24;
        daysSpent -= 1;
    }
    var timeSpan = lzm_commonTools.pad(hoursSpent, 2) + ':' + lzm_commonTools.pad(minutesSpent, 2) + ':' + lzm_commonTools.pad(secondsSpent, 2);
    if (daysSpent > 0) {
        timeSpan = daysSpent + '.' + timeSpan;
    }
    return timeSpan;
};

ChatVisitorClass.prototype.HasWindowWidthForSideBySideView = function(){
    return this.isFullScreenMode();
};

ChatVisitorClass.prototype.OnMapButtonClicked = function () {
    if(LocalConfiguration.VisitorsMapVisible)
        this.HideMap();
    else
        this.ShowMap();

    UIRenderer.ResizeVisitorList();
};

ChatVisitorClass.prototype.OnTreeviewButtonClicked = function () {
    if(LocalConfiguration.VisitorsTreeviewVisible)
        this.HideTreeview();
    else
        this.ShowTreeview();

    UIRenderer.ResizeVisitorList();
};

ChatVisitorClass.prototype.OnResize = function (){

    UIRenderer.ResizeVisitorList();
};

ChatVisitorClass.prototype.isFullScreenMode = function(){
    return (lzm_chatDisplay.windowHeight > 450 && lzm_chatDisplay.windowWidth > 600);
};

ChatVisitorClass.ToggleScreenSharing = function(_elementId,_external){

    var systemId = $('#visitor-cobrowse-'+_elementId+'-browser-select').val();
    var browserId = systemId.split('~')[1];
    var visitorId = systemId.split('~')[0];
    var v = VisitorManager.GetVisitor(visitorId);

    if(!v.sss.length && !v.IsInChat)
    {
        showMessage(tid('not_in_chat'));
        return;
    }

    if(!_external || !v.sss.length)
        v.sss = (browserId == v.sss) ? '' : browserId;

    $('#screen-capture-'+_elementId+'-activate, #screen-capture-'+_elementId+'-external').addClass('ui-disabled');

    CommunicationEngine.pollServerSpecial(v, 'toggle-screen-sharing');

    if(_external)
        openLink(ChatVisitorClass.GetScreenSharingURL(visitorId,browserId));

    ChatVisitorClass.LoadCoBrowsingContent(_elementId);

    ChatVisitorClass.UpdateScreenSharingUI(_elementId,true);
};

ChatVisitorClass.UpdateScreenSharingUI = function(_elementId,_loading){

    var systemId = $('#visitor-cobrowse-'+_elementId+'-browser-select').val();

    if(d(systemId) && systemId.indexOf('~') != -1)
    {
        var visitorId = systemId.split('~')[0];
        var browserId = systemId.split('~')[1];
        var vb = VisitorManager.GetVisitor(visitorId);

        $('#screen-capture-'+_elementId+'-activate, #screen-capture-'+_elementId+'-external').removeClass('ui-disabled');

        if(vb.sss == browserId)
        {
            $('#screen-capture-'+_elementId+'-activate, #screen-capture-'+_elementId+'-external').removeClass('bg-blue').addClass('bg-red');
            $($('#screen-capture-'+_elementId+'-activate i')[0]).removeClass('fa-camera').addClass('fa-times-circle');

            if(_loading)
                $($('#screen-capture-'+_elementId+'-activate span')[0]).text(tid('loading'));
            else
                $($('#screen-capture-'+_elementId+'-activate span')[0]).text(tid('deactivate'));

            $('.visitor-cobrowse-iframe').css({background:'transparent'});
        }
        else
        {
            $('#screen-capture-'+_elementId+'-activate, #screen-capture-'+_elementId+'-external').addClass('bg-blue').removeClass('bg-red');
            $($('#screen-capture-'+_elementId+'-activate i')[0]).addClass('fa-camera').removeClass('fa-times-circle');

            $($('#screen-capture-'+_elementId+'-activate span')[0]).text('Screen Sharing');

            $('.visitor-cobrowse-iframe').css({background:'#fff'});
        }
    }
};

ChatVisitorClass.GetScreenSharingURL = function(_visitorId,_browserId){
    return DataEngine.getServerUrl('getfile.php')+'?userid=' + _visitorId + '&browserid=' + _browserId + '&token=' + sha256(DataEngine.token);
};

ChatVisitorClass.LoadCoBrowsingContent = function (_elementId, _browser) {

    _browser = (d(_browser)) ? _browser : VisitorManager.GetVisitorBrowser($('#visitor-cobrowse-'+_elementId+'-iframe').data('browser'));

    if (_browser != null)
    {
        var browserUrl = _browser.h2[_browser.h2.length - 1].url;
        var urlParts = browserUrl.split('#');
        var paramDivisor = (urlParts[0].indexOf('?') == -1) ? '?' : '&';
        var acid = md5(Math.random().toString()).substr(0, 5);

        urlParts[0] += paramDivisor + 'lzcobrowse=true&lzmobile=true&acid=' + acid;
        var coBrowseUrl = urlParts.join('#');

        if(window.location.href.toLowerCase().indexOf('https://') === 0 && coBrowseUrl.toLowerCase().indexOf('http://') === 0)
            coBrowseUrl = coBrowseUrl.replace(new RegExp('http://', "ig"),'https://');

        var visitor = VisitorManager.GetVisitor(_browser.v);

        if(visitor.sss == _browser.id)
        {
            coBrowseUrl = ChatVisitorClass.GetScreenSharingURL(_browser.v,_browser.id);
        }

        $('#visitor-cobrowse-'+_elementId+'-iframe').data('browser-url', browserUrl);
        var oldIframeDataBrowser = $('#visitor-cobrowse-'+_elementId+'-iframe').data('browser');
        var oldIframeDataBrowserUrl = $('#visitor-cobrowse-'+_elementId+'-iframe').data('browser-url');
        var oldIframeDataLanguage = $('#visitor-cobrowse-'+_elementId+'-iframe').data('language');
        var oldIframeDataAction = $('#visitor-cobrowse-'+_elementId+'-iframe').data('action');
        var oldIframeDataVisible = $('#visitor-cobrowse-'+_elementId+'-iframe').data('visible');
        var newIframeHtml = '<iframe id="visitor-cobrowse-'+_elementId+'-iframe"' +
            ' data-browser="' + oldIframeDataBrowser + '"' +
            ' data-browser-url="' + oldIframeDataBrowserUrl + '"' +
            ' data-action="' + oldIframeDataAction + '"' +
            ' data-language="' + oldIframeDataLanguage + '"' +
            ' data-visible="' + oldIframeDataVisible + '"' +
            ' src="' + coBrowseUrl + '" class="visitor-cobrowse-iframe"></iframe>';
        $('#visitor-cobrowse-'+_elementId+'-iframe').replaceWith(newIframeHtml).trigger('create');
        UIRenderer.resizeVisitorDetails();
        ChatVisitorClass.UpdateScreenSharingUI(_elementId);
    }
};

ChatVisitorClass.AddToWatchList = function(_visitorId, _operatorId){
    var visitorObj = VisitorManager.GetVisitor(_visitorId);
    if(visitorObj!=null){
        visitorObj.IsOnWatchList = true;
    }
    UserActions.saveVisitorComment(_visitorId, '[__[vf:' + _operatorId +']__]');
};

ChatVisitorClass.RemoveFromWatchList = function(_visitorId){
    var visitorObj = VisitorManager.GetVisitor(_visitorId);
    if(visitorObj!=null)
        visitorObj.IsOnWatchList = false;
    UserActions.deleteVisitorComment(_visitorId, '[__[vf:' + lzm_chatDisplay.myId+']__]');
};

ChatVisitorClass.ShowVisitorInformation = function (_visitorId, _activeTab, _selectedChatId, _selectedTicketId, _dialog) {

    _dialog = d(_dialog) ? _dialog : true;
    _activeTab = d(_activeTab) ? _activeTab : 0;
    _selectedChatId = d(_selectedChatId) ? _selectedChatId : '';
    _selectedTicketId = d(_selectedTicketId) ? _selectedTicketId : '';

    var _visitorObj = VisitorManager.GetFullDataVisitor(_visitorId);
    if(_visitorObj == null)
    {
        _visitorObj = VisitorManager.GetVisitor(_visitorId);
        if(_visitorObj == null)
        {
            _visitorObj = {id:_visitorId,unique_name:'',is_active:false,is_vi_ui_update:true};
            if(_visitorId.indexOf('-') != -1)
                _visitorObj.IsInternal = true;
        }
    }

    var winId = 'visitor-information-'+_visitorObj.id;
    if(_dialog && TaskBarManager.WindowExists(winId))
    {
        TaskBarManager.Maximize(winId);
        return;
    }

    if(_selectedChatId.length)
        _visitorObj.SelectedChatId = _selectedChatId;
    if(_selectedTicketId.length)
        _visitorObj.SelectedTicketId = _selectedTicketId;

    var parentWindow = TaskBarManager.GetActiveWindow();
    var i,externalIsDisabled = (lzm_chatDisplay.myGroups.length > 0);
    for (i=0; i<lzm_chatDisplay.myGroups.length; i++)
    {
        var myGr = DataEngine.groups.getGroup(lzm_chatDisplay.myGroups[i]);
        if (myGr != null && myGr.external == '1')
            externalIsDisabled = false;
    }

    ChatVisitorClass.VisitorInformationId = _visitorObj.id;

    var now = lzm_chatTimeStamp.getServerTimeString(null, false, 1000);
    var elementId = ((_dialog) ? 'd-' : 'e-') + _visitorObj.id;

    lzm_chatDisplay.VisitorsUI.LastVisitorTimestampUpdate = now;
    lzm_chatDisplay.ShowVisitorId = _visitorObj.id;

    var visitorName = VisitorManager.GetVisitorName(_visitorObj);
    var headerString = tid('visitor');

    if(visitorName.length)
        headerString += ' (' + lzm_commonTools.htmlEntities(visitorName) + ')';

    var footerString = lzm_inputControls.createButton('cancel-visitorinfo', '', '', tid('close'), '', 'lr',{'margin-left': '4px'},'',30,'d');
    var bodyString = '<div id="visitor-info-'+elementId+'-placeholder" class="dialog-visitor-info" data-visitor-id="'+_visitorObj.id+'"></div>';

    headerString += '<div id="visitor-info-status-indicator-'+((_dialog) ? 'd' : 'e')+'" class="visitor-info-status-indicator">'+tid('offline')+'</div>';

    var dialogData = {'visitor-id': _visitorObj.id, menu: t('Visitor Information: <!--name-->', [['<!--name-->', lzm_commonTools.htmlEntities(visitorName)]]), 'chat-type': '1', 'reload': ['chats', 'tickets'], ratio: lzm_chatDisplay.DialogBorderRatioFull};

    if(_dialog)
    {
        var dialogid = lzm_commonDialog.CreateDialogWindow(headerString, bodyString, footerString, 'user', winId, winId, 'cancel-visitorinfo', true, dialogData, true, null, false,_visitorObj.id);
        $('#visitor-information').data('dialog-id', dialogid);
    }

    var detailsHtml = '<div id="visitor-details-'+elementId+'-list" style="overflow-y: auto;"></div>';
    var historyHtml = '<div id="visitor-history-'+elementId+'-list"><div id="visitor-history-'+elementId+'-placeholder"></div></div>';
    var tabsArray = [{name: t('Details'), content: detailsHtml}];

    tabsArray.push({name: t('CoBrowse'), content: lzm_chatDisplay.VisitorsUI.CreateCoBrowsingTab(_visitorObj,elementId)});
    tabsArray.push({name: t('History (<!--number_of_histories-->)', [['<!--number_of_histories-->', 0]]), content: historyHtml});
    tabsArray.push({name: t('Comments (<!--number_of_comments-->)', [['<!--number_of_comments-->', 0]]), content: ''});
    tabsArray.push({name: t('Chat Invites (<!--number_of_invites-->)', [['<!--number_of_invites-->', 0]]), content: ''});
    tabsArray.push({name: t('Chats (<!--number_of_chats-->)', [['<!--number_of_chats-->', 0]]), content: ''});
    tabsArray.push({name: t('Tickets (<!--number_of_tickets-->)', [['<!--number_of_tickets-->', 0]]), content: ''});
    tabsArray.push({name: tid('feedbacks'), content: ''});

    lzm_inputControls.createTabControl('visitor-info-'+elementId+'-placeholder', tabsArray, _activeTab);

    var matchingChatsInnerDiv = $('#matching-chats-'+elementId+'-inner-div');
    matchingChatsInnerDiv.data('chat-dialog-id', dialogid);
    matchingChatsInnerDiv.data('chat-dialog-window', 'visitor-information');
    matchingChatsInnerDiv.data('chat-dialog-data', dialogData);

    UIRenderer.resizeVisitorDetails();

    $('#visitor-info-'+elementId+'-placeholder-tab-5').addClass('ui-disabled');
    $('#visitor-info-'+elementId+'-placeholder-tab-6').addClass('ui-disabled');
    $('.visitor-info-'+elementId+'-placeholder-tab').click(function() {
        UIRenderer.resizeVisitorDetails();
        $(this).removeClass('lzm-tabs-message');
        var tabNo = $(this).data('tab-no');
        if (tabNo == 1)
        {
            $('#visitor-cobrowse-'+elementId+'-iframe').data('visible', '1');
            ChatVisitorClass.LoadCoBrowsingContent(elementId);
        }
        else if (tabNo == 5)
        {
            if($('.archive-list-'+elementId+'-line').length)
            {
                if(!$('.archive-list-'+elementId+'-line selected-table-line').length)
                {
                    try
                    {
                        $('#matching-chats-'+elementId+'-table tr')[1].click();
                    }
                    catch(ex){}
                }
            }
        }
        else if (tabNo == 6 && lzm_chatDisplay.ticketDisplay.isFullscreenMode())
        {
            if($('.ticket-list-row').length)
            {
                if(!$('.ticket-list-row .selected-table-line').length)
                {
                    try
                    {
                        $('#matching-tickets-'+elementId+'-table tr')[1].click();
                    }
                    catch(ex){}
                }
            }
        }
        else
        {
            $('#visitor-cobrowse-'+elementId+'-iframe').data('visible', '0');
        }
    });

    if (_activeTab == 1)
        $('#visitor-cobrowse-'+elementId+'-iframe').data('visible', '1');
    else
        $('#visitor-cobrowse-'+elementId+'-iframe').data('visible', '0');


    $('#send-chat-transcript-' + elementId).click(function() {
        var chatId = $('#matching-chats-'+elementId+'-table').data('selected-chat-id');
        if(!chatId)
            lzm_commonDialog.createAlertDialog(t('No element selected.'),null);
        else
            sendChatTranscriptTo(chatId, dialogid, 'visitor-information', dialogData);
    });
    $('#link-with-ticket-' + elementId).click(function() {
        var chatId = $('#matching-chats-'+elementId+'-table').data('selected-chat-id');
        if(!chatId)
            lzm_commonDialog.createAlertDialog(t('No element selected.'),null);
        else
            showTicketLinker('', chatId, null, 'chat', true, elementId);
    });

    ChatVisitorClass.SetCoBrowsingEvent(elementId);

    $('#cancel-visitorinfo').click(function() {

        TaskBarManager.RemoveActiveWindow();
        lzm_chatDisplay.ShowVisitorId = '';

        if(parentWindow != null)
            parentWindow.Maximize();
    });
    $('#visitor-details-'+elementId+'-list').data('visitor', _visitorObj);

    lzm_chatDisplay.VisitorsUI.UpdateVisitorInformation(_visitorObj.id);
};

ChatVisitorClass.LoadVisitorInformation = function(_visitorId){

    VisitorManager.LoadFullDataUserId = _visitorId;
    var fduobj = lzm_commonTools.GetElementByProperty(VisitorManager.LoadedFullDataUsers,'id',VisitorManager.LoadFullDataUserId);
    if(!fduobj.length)
    {
        var visFullDataObj = null;
        var visObj = VisitorManager.GetVisitor(_visitorId);
        if(visObj == null)
        {
            visFullDataObj = {id:_visitorId};
        }
        else
            visFullDataObj = lzm_commonTools.clone(visObj);

        ___resetDemandData(visFullDataObj);

        VisitorManager.LoadedFullDataUsers.push(visFullDataObj);
    }
    else
        ___resetDemandData(fduobj[0]);

    CommunicationEngine.InstantPoll(true);

    function ___resetDemandData(_vobj){
        _vobj.ArchivedChats = [];
        _vobj.ArchivedTickets = [];
        _vobj.c = [];
        _vobj.rv = [];
        //_vobj.FullData = false;
    }
};

ChatVisitorClass.SetCoBrowsingEvent = function(elementId) {

    $('#visitor-cobrowse-'+elementId+'-browser-select').unbind( "change" );
    $('#visitor-cobrowse-'+elementId+'-browser-select').change(function() {
        $('#visitor-cobrowse-'+elementId+'-iframe').data('browser', $(this).val());
        ChatVisitorClass.LoadCoBrowsingContent(elementId);
    });
};

ChatVisitorClass.ReloadVisitorInformation = function(_visitorId){
    lzm_commonTools.RemoveElementByProperty(VisitorManager.LoadedFullDataUsers,'id',_visitorId);
    ChatVisitorClass.ReloadVisitorInformation(_visitorId);
};