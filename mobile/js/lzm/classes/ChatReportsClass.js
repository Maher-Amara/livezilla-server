/****************************************************************************************
 * LiveZilla ChatReportsClass.js
 *
 * Copyright 2014 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/
function ChatReportsClass() {

}

ChatReportsClass.prototype.createReportList = function() {

    var numberOfPages = Math.max(1, Math.ceil(DataEngine.reports.getMatching() / DataEngine.reports.getReportsPerPage()));
    var page = CommunicationEngine.reportPage;
    var headLine2Html = '<span  class="lzm-dialog-hl2-info">' +
        t('<!--total_reports--> total entries, <!--filtered_reports--> matching filter',
            [['<!--total_reports-->', DataEngine.reports.getTotal()], ['<!--filtered_reports-->', DataEngine.reports.getMatching()]]) +
        '</span><span class="lzm-button-box-right">' +
        lzm_inputControls.createButton('report-filter', '', 'openReportFilterMenu(event)', t('Filter'), '<i class="fa fa-filter"></i>', 'lr',{'margin-right': '4px'}, '', -1,'e') + '</span>';

    var footLineHtml = '<span id="report-paging">';
    var leftDisabled = (page == 1) ? ' ui-disabled' : '', rightDisabled = (page == numberOfPages) ? ' ui-disabled' : '';
    if (!isNaN(numberOfPages)) {
        footLineHtml += lzm_inputControls.createButton('report-page-all-backward', 'report-list-page-button' + leftDisabled, 'pageReportList(1);', '','<i class="fa fa-fast-backward"></i>', 'l',{},'',-1,'e') +
            lzm_inputControls.createButton('report-page-one-backward', 'report-list-page-button' + leftDisabled, 'pageReportList(' + (page - 1) + ');', '', '<i class="fa fa-backward"></i>', 'r',{},'',-1,'e') +
            '<span style="padding: 0px 15px;">' + t('Page <!--this_page--> of <!--total_pages-->',[['<!--this_page-->', page], ['<!--total_pages-->', numberOfPages]]) + '</span>' +
            lzm_inputControls.createButton('report-page-one-forward', 'report-list-page-button' + rightDisabled, 'pageReportList(' + (page + 1) + ');', '', '<i class="fa fa-forward"></i>', 'l',{},'',-1,'e') +
            lzm_inputControls.createButton('report-page-all-forward', 'report-list-page-button' + rightDisabled, 'pageReportList(' + numberOfPages + ');', '', '<i class="fa fa-fast-forward"></i>', 'r', {},'',-1,'e');
    }
    footLineHtml += '</span>';

    $('#report-list-headline2').html(headLine2Html);
    $('#report-list-body').html(this.CreateReportListHtml());
    $('#report-list-footline').html(footLineHtml);

    if(!$('#report-rtdb-frame').html().length)
    {
        $('#report-rtdb-frame').html(this.CreateRTDBHtml());
    }

    UIRenderer.resizeReportList();
    ChatReportsClass.UpdateDashBoard();
};

ChatReportsClass.prototype.CreateRTDBHtml = function(){

    var __getRTDBBox = function(_id,_title){
        return '<fieldset id="'+_id+'" class="lzm-fieldset lzm-fieldset-inline"><legend>'+_title+'</legend><div>0</div><div></div><div><svg viewBox="0 0 160 20" class="chart">' +
            '<polyline fill="" stroke="" points="" />' +
            '<polyline fill="none" stroke="" stroke-width="1" points="" />' +
            '</svg></div></fieldset>';
    };

    var bodyHtml = '';

    bodyHtml += '<div class="spaced text-xl text-bold text-blue">'+tid('chats')+'</div>';
    bodyHtml += __getRTDBBox('report-rtdb-chats-active',tid('active'));
    bodyHtml += __getRTDBBox('report-rtdb-chats-queue',tid('queue'));
    bodyHtml += __getRTDBBox('report-rtdb-chats-wt','&#216; ' + tid('waiting_time'));
    bodyHtml += __getRTDBBox('report-rtdb-chats-missed',tid('missed'));

    bodyHtml += '<div class="spaced text-xl text-bold text-blue">'+tid('tickets')+'</div>';
    bodyHtml += __getRTDBBox('report-rtdb-tickets-open',tid('ticket_status_0'));
    bodyHtml += __getRTDBBox('report-rtdb-tickets-progress',tid('ticket_status_1'));
    bodyHtml += __getRTDBBox('report-rtdb-tickets-overdue',tid('overdue'));

    bodyHtml += '<div class="spaced text-xl text-bold text-blue">'+tid('operators')+' / '+tid('groups')+'</div>';
    bodyHtml += __getRTDBBox('report-rtdb-operators',tid('operators'));
    bodyHtml += __getRTDBBox('report-rtdb-groups',tid('groups'));

    bodyHtml += '<div class="spaced text-xl text-bold text-blue">'+tid('visitors')+'</div>';
    bodyHtml += __getRTDBBox('report-rtdb-visitors',tid('visitors'));

    return bodyHtml;

};

ChatReportsClass.prototype.CreateReportListHtml = function() {
    var reports = DataEngine.reports.getReportList();
    var selectedReport = (typeof $('#report-list-table').data('selected-report') != 'undefined') ? $('#report-list-table').data('selected-report') : '';
    var bodyHtml = '';

    bodyHtml += '<table id="report-list-table" class="visible-list-table alternating-rows-table lzm-unselectable"' +
        ' data-selected-report="' + selectedReport + '"><thead>' +
        '<tr><th style="width: 20px !important;"></th><th class="inactive-sort-column" style="width: 150px !important;">' + tid('period') + '&nbsp;&nbsp;&nbsp;<span class="table-sort-icon"><i class="fa fa-caret-down"></i></span></th>' +
        '<th style="width: 150px !important;">' + t('Visitors') + '</th><th style="width: 150px !important;">' + tid('chats') + '</th><th style="width: 150px !important;">' + tid('tickets') + '</th><th>' + t('Conversion Rate') + '</th></tr>' +
        '</thead><tbody>';
    for (var i=0; i<reports.length; i++)
    {
        bodyHtml += this.createReportListLine(reports[i]);
    }
    bodyHtml += '</tbody></table>';

    return bodyHtml;
};

ChatReportsClass.prototype.createReportListLine = function(report) {
    var canBeReCalculated,reportImage = (report.r == 'day') ? '<i class="fa fa-pie-chart"></i>' : (report.r == 'month') ? '<i class="fa fa-pie-chart"></i>' : '<i class="fa fa-pie-chart"></i>';

    if(report.ti == '')
        report.ti = 0;

    if (report.a == 0)
    {
        canBeReCalculated = true;
    }
    var periodHumanDate = (report.r == 'day') ?
        lzm_commonTools.getHumanDate([report.y, report.m, report.d, 0, 0, 0], 'longdate', lzm_chatDisplay.userLanguage) : (report.r == 'month') ? lzm_commonTools.getHumanDate([report.y, report.m, report.d, 0, 0, 0], 'dateyear', lzm_chatDisplay.userLanguage) : report.y;

    var oncontextmenuAction = ((!IFManager.IsAppFrame && !IFManager.IsMobileOS) || IFManager.IsDesktopApp()) ? ' oncontextmenu="openReportContextMenu(event, \'' + report.i + '\', ' + canBeReCalculated + ');"' : '';
    var onclickAction = ((!IFManager.IsAppFrame && !IFManager.IsMobileOS) || IFManager.IsDesktopApp()) ? ' onclick="selectReport(\'' + report.i + '\');"' : ' onclick="openReportContextMenu(event, \'' + report.i + '\', ' + canBeReCalculated + ');"';
    var ondblclickAction = ((!IFManager.IsAppFrame && !IFManager.IsMobileOS) || IFManager.IsDesktopApp()) ? ' ondblclick="'+ChatReportsClass.GetAnalyticsFunctionCall(report)+'"' : '';

    var lineClasses = ($('#report-list-table').data('selected-report') == report.i) ? ' class="report-list-line selected-table-line"' : ' class="report-list-line"';
    var reportListLine = '<tr id="report-list-line-' + report.i + '" style="cursor: pointer;"' + oncontextmenuAction +
        onclickAction + ondblclickAction + lineClasses + '>' +
        '<td style="text-align: center;">' + reportImage + '</td>' +
        '<td>' + periodHumanDate + '</td>' +
        '<td>' + report.s + '</td>' +
        '<td>' + report.ch + '</td>' +
        '<td>' + report.ti + '</td>' +
        '<td>' + report.c + '%</td>' +
        '</tr>';
    return reportListLine;
};

ChatReportsClass.GetAnalyticsFunctionCall = function(_report){

    var from = new Date(_report.y,parseInt(_report.m) - 1,_report.d,0,0,0,0);
    var to = from;
    if (_report.r === 'month')
    {
        from = new Date(_report.y, parseInt(_report.m) - 1, 1,0,0,0,0);
        to = new Date(_report.y, parseInt(_report.m), 0,0,0,0,0);
    }
    else if(_report.r === 'year')
    {
        from = new Date(_report.y, 0, 1,0,0,0,0);
        to = new Date(parseInt(_report.y) +1, 0, 0,0,0,0,0);
    }

    var urlParts = lzm_commonTools.getUrlParts();
    return 'ChatReportsClass.ShowReport(\''+from.toLocaleDateString()+'\',\''+to.toLocaleDateString()+'\',\'' + urlParts.protocol + urlParts.urlBase + ':' + urlParts.port + urlParts.urlRest + '/analytics.php?from=' + Math.round(from.getTime() /1000) + '&to=' + Math.round(to.getTime() / 1000) + '&token=' + DataEngine.token + '\');';
};

ChatReportsClass.prototype.createReportListContextMenu = function(myObject) {
    var disabledClass, onclickAction, contextMenuHtml = '';
    disabledClass = '';


    onclickAction = ChatReportsClass.GetAnalyticsFunctionCall(myObject);
    contextMenuHtml += '<div onclick="' + onclickAction + 'removeReportContextMenu();"><span id="load-this-new-report" class="cm-line cm-click">Analytics</span></div><hr />';

    onclickAction = 'loadReport(\'' + myObject.i + '\', \'report\');';
    contextMenuHtml += '<div' + disabledClass + ' onclick="' + onclickAction + 'removeReportContextMenu();"><span id="load-this-report" class="cm-line cm-click">Classic ' + tid('report') + '</span></div>';

    disabledClass = (myObject.r != 'day') ? ' class="ui-disabled"' : '';
    onclickAction = 'loadReport(\'' + myObject.i + '\', \'visitors\');';
    contextMenuHtml += '<div' + disabledClass + ' onclick="' + onclickAction + 'removeReportContextMenu();"><span id="load-this-visitors" class="cm-line cm-click">' + tid('visitors') + '</span></div>';


    //
    //onclickAction = 'IFManager.IFOpenExternalBrowser(\'' + urlParts.protocol + urlParts.urlBase + ':' + urlParts.port + urlParts.urlRest + '/analytics.php?from=' + Math.round(from.getTime() /1000) + '&to=' + Math.round(to.getTime() / 1000) + '&token=' + DataEngine.token + '\');';


    disabledClass = (!myObject.canBeReCalculated) ? ' class="ui-disabled"' : '';
    onclickAction = 'recalculateReport(\'' + myObject.i + '\');';
    contextMenuHtml += '<div' + disabledClass + ' onclick="' + onclickAction + 'removeReportContextMenu();"><i class="fa fa-refresh"></i><span id="recalculate-this-report" class="cm-line cm-line-icon-left cm-click">' + tid('recalculate') + '</span></div>';

    return contextMenuHtml;
};

ChatReportsClass.prototype.createReportFilterMenu = function(myObject) {
    var myVisibility = (CommunicationEngine.reportFilter == 'day') ? 'visible' : 'hidden', contextMenuHtml = '';
    contextMenuHtml += '<div onclick="toggleReportFilter(\'day\', event)">' +
        '<span id="toggle-filter-day" class="cm-line cm-line-icon-left cm-click">' +
        t('<!--checked--> Day', [['<!--checked-->', '<span style="visibility: ' + myVisibility + ';">&#10003;</span>']]) + '</span></div>';
    myVisibility = (CommunicationEngine.reportFilter == 'month') ? 'visible' : 'hidden';
    contextMenuHtml += '<div onclick="toggleReportFilter(\'month\', event)">' +
        '<span id="toggle-filter-month" class="cm-line cm-line-icon-left cm-click">' +
        t('<!--checked--> Month', [['<!--checked-->', '<span style="visibility: ' + myVisibility + ';">&#10003;</span>']]) + '</span></div>';
    myVisibility = (CommunicationEngine.reportFilter == 'year') ? 'visible' : 'hidden';
    contextMenuHtml += '<div onclick="toggleReportFilter(\'year\', event)">' +
        '<span id="toggle-filter-year" class="cm-line cm-line-icon-left cm-click">' +
        t('<!--checked--> Year', [['<!--checked-->', '<span style="visibility: ' + myVisibility + ';">&#10003;</span>']]) + '</span></div>';
    return contextMenuHtml;
};

ChatReportsClass.ShowReport = function(_from,_to,_url){

    var id = md5(Math.random());
    var headerString = tid('report') + ' (' + _from + ')';

    var footerString = lzm_inputControls.createButton('rp-close-btn-'+id, '', '', tid('cancel'), '', 'lr',{'margin-left': '4px'},'',30,'d');
    var bodyString = '<iframe class="report-iframe" src="'+_url+'"></iframe>';

    lzm_commonDialog.CreateDialogWindow(headerString, bodyString, footerString, 'bar-chart', 'report_' + id, 'report_' + id,'rp-close-btn-'+id);
    TaskBarManager.GetActiveWindow().StaticWindowType = true;
    $('#rp-close-btn-'+id).click(function() {
        TaskBarManager.RemoveActiveWindow();

    });
    $('#report_'+id+'-body').css('overflow-y','hidden');

};

ChatReportsClass.ToAdd = 20;

ChatReportsClass.RTDBPointWidth = 1;
ChatReportsClass.RTDBChartWidth = 160;
ChatReportsClass.RTDBChartHeight = 20;
ChatReportsClass.RTDBUpdateInterval = 15;

ChatReportsClass.UpdateDashBoard = function(_forceUpdate){

    var forceUpdate = _forceUpdate;

    var ___getHistoryValueBox = function(_id){

        return $('#' + _id + ' div')[0];
    };
    var ___getHistoryChartsBox = function(_id){

        return $('#' + _id + ' div')[2];
    };
    var ___addHistoryPoint = function(_id,_values,_max,_color){

        var x=ChatReportsClass.RTDBPointWidth*-1, y, pString='', hcb = ___getHistoryChartsBox(_id);

        var polyStroke = $($(hcb).find('polyline')[1]);
        var polyFill = $($(hcb).find('polyline')[0]);

        for(var i=1;i<_values.length;i++)
        {
            if(_max > 0)
            {
                y = parseInt((ChatReportsClass.RTDBChartHeight * _values[i]) / _max);
                y = Math.min(y,ChatReportsClass.RTDBChartHeight);
                y = ChatReportsClass.RTDBChartHeight - y;
            }
            else
                y = ChatReportsClass.RTDBChartHeight;

            x += ChatReportsClass.RTDBPointWidth;

            if(pString.length)
                pString += ' ';

            pString += x + ',' + y;

            //pathString += ' M ' + x + ' ' + y;
        }

        polyStroke.attr('points', pString);
        //pathStroke.attr('d', pathString);

        if(!d(_color))
            _color = 'gray';

        polyStroke.css({'stroke':'var(--' + _color + ')'});
        polyFill.css({'fill':'var(--' + _color + ')',opacity:.2});

        pString += ' ' + ((_values.length-2)*ChatReportsClass.RTDBPointWidth) + ',' + ChatReportsClass.RTDBChartHeight;
        pString = '0,'+ ChatReportsClass.RTDBChartHeight + ' ' + pString;
        polyFill.attr('points', pString);
    };
    var ___setValue = function(_id,_value,_color,_displayString,_noChart){

        if(isNaN(_value))
            return;

        if(parseInt(_value) < 0)
            return;

        _noChart = d(_noChart) ? _noChart : false;
        var maxValue = 0,maxPoints = (ChatReportsClass.RTDBChartWidth / ChatReportsClass.RTDBPointWidth) + 1,values = [];
        var hvb = $(___getHistoryValueBox(_id));

        if(d(_displayString))
            hvb.html(_displayString);
        else
            hvb.html(_value);

        if(d(_color))
            hvb.css({'color':'var(--' + _color + ')'});

        if(_noChart)
            return;

        if(d(hvb.data('values')))
            values = hvb.data('values').split(',');

        var last = 0;
        if(values.length)
            last = values[values.length-1];

        var lastUpdate = 0;
        if(d(hvb.data('lu')) && !forceUpdate)
            lastUpdate = parseInt(hvb.data('lu'));

        if(lastUpdate < (lz_global_timestamp()-ChatReportsClass.RTDBUpdateInterval))
        {
            if(d(hvb.data('max')))
                maxValue = hvb.data('max');

            if(values.length > maxPoints)
                values = values.slice(1, maxPoints+1);

            values.push(_value);

            if(_value > maxValue)
                maxValue = _value;

            hvb.data('values',values.join(','));
            hvb.data('last',_value);
            hvb.data('max',maxValue);

            if(values.length > 3)
                hvb.data('lu',lz_global_timestamp());

            if(lzm_chatDisplay.selected_view == 'reports' || lastUpdate == 0)
            {
                ___addHistoryPoint(_id,values,maxValue,_color);
            }
        }
    };

    var color;

    // chats active
    var achats = DataEngine.ChatManager.GetActive().length;
    color = 'gray';
    if(achats > 0)
        color = 'green';
    ___setValue('report-rtdb-chats-active',achats,color);

    // chats queue
    var qchats = DataEngine.ChatManager.GetQueued().length;
    color = 'gray';
    if(qchats > 0)
        color = 'red';
    ___setValue('report-rtdb-chats-queue',qchats,color);

    // chats queue
    var wtchats = DataEngine.ChatManager.GetAVGWaitingTime();
    wtchats = Math.floor(wtchats);
    color = 'gray';
    if(wtchats > 20)
        color = 'red';
    if(wtchats > 40)
        color = 'red';
    ___setValue('report-rtdb-chats-wt',wtchats,color,lzm_commonTools.getHumanTimeSpan(wtchats,true));

    // chats missed
    var mchats = DataEngine.ChatManager.GetMissed().length;
    color = 'gray';
    if(mchats > 0)
        color = 'red';
    ___setValue('report-rtdb-chats-missed',mchats,color);

    // tickets open
    var topen = lzm_chatDisplay.ticketGlobalValues.ttst0;
    color = 'gray';
    if(topen > 0)
        color = 'blue';
    ___setValue('report-rtdb-tickets-open',topen,color);

    // tickets progress
    var tprogress = lzm_chatDisplay.ticketGlobalValues.ttst1;
    ___setValue('report-rtdb-tickets-progress',tprogress);

    // tickets due
    var tdue = lzm_chatDisplay.ticketGlobalValues.ttdue;
    color = 'gray';
    if(tdue > 0)
        color = 'red';
    ___setValue('report-rtdb-tickets-overdue',tdue,color);

    // operators
    var oc = DataEngine.operators.GetActiveOperators([],false,true,false).length;
    var ot = DataEngine.operators.getOperatorList('id',null,true,false).length;
    color = 'green';
    if(oc == 0)
        color = 'red';
    ___setValue('report-rtdb-operators',oc,color,oc + '<span> / '+ot+'</span>');

    // groups
    var gc = DataEngine.groups.getGroupList('id',true,false,false).length;
    var gt = DataEngine.groups.getGroupList('id',true,false,true).length;
    color = 'green';
    if(gc == 0)
        color = 'red';
    ___setValue('report-rtdb-groups',oc,color,gc + '<span> / '+gt+'</span>');

    // visitors
    var vc = VisitorManager.ActiveVisitors;
    ___setValue('report-rtdb-visitors',vc);
};

function loadReport(reportId, type) {
    var report = DataEngine.reports.getReport(reportId);
    if (report != null)
    {
        var reportUrl = '';

        if (type == 'report')
            reportUrl += 'report.php?h=' + report.i + '&y=' + report.y + '&m=' + report.m + '&d=' + report.d;
        else if (type == 'visitors')
            reportUrl += 'report.php?h=' + report.i + '&y=' + report.y + '&m=' + report.m + '&d=' + report.d + '&u=1';

        openSystemLink(reportUrl);
    }
}

function toggleReportFilter(filter, e) {
    e.stopPropagation();
    $('.report-list-page-button').addClass('ui-disabled');
    $('#report-filter').addClass('ui-disabled');
    CommunicationEngine.stopPolling();
    var reportFetchTime = DataEngine.reportFetchTime;
    DataEngine.expectReportChanges = true;
    removeReportFilterMenu();
    CommunicationEngine.reportFilter = filter;
    CommunicationEngine.reportPage = 1;
    CommunicationEngine.resetReports = true;
    CommunicationEngine.InstantPoll();
    switchReportListPresentation(reportFetchTime, 0);
}
