/****************************************************************************************
 * LiveZilla FeedbacksViewerClass.js
 *
 * Copyright 2017 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/

function FeedbacksViewer() {
    this.m_SelectedFeedbackId = '';
}

FeedbacksViewer.Page = 1;
FeedbacksViewer.PagesTotal = 1;

FeedbacksViewer.prototype.showFeedbacksViewer = function() {

    this.CalculatePaging();

    var headerString = tid('feedbacks');
    var footLineHtml = this.CreateFooterLine(false);
    var bodyString = this.CreateFeedbacksHtml();

    lzm_commonDialog.CreateDialogWindow(headerString, bodyString, footLineHtml, 'star', 'feedbacks-viewer', 'feedbacks_viewer_dialog', 'fv-close-btn');

    $('#feedbacks-viewer-body').css({'overflow': 'auto'});

    this.CreateFooterLine(true);
};

FeedbacksViewer.prototype.CalculatePaging = function(){

    FeedbacksViewer.PagesTotal = DataEngine.feedbacksTotal / DataEngine.feedbacksPage;

    if(FeedbacksViewer.PagesTotal%1!=0 || FeedbacksViewer.PagesTotal<1)
        FeedbacksViewer.PagesTotal++;

    FeedbacksViewer.PagesTotal = Math.floor(FeedbacksViewer.PagesTotal);
};

FeedbacksViewer.prototype.CreateFooterLine = function(logic){

    this.CalculatePaging();
    if(!logic)
    {
        var footLineHtml = '<span>';
        var leftDisabled = (FeedbacksViewer.Page == 1) ? ' ui-disabled' : '', rightDisabled = (FeedbacksViewer.Page == FeedbacksViewer.PagesTotal) ? ' ui-disabled' : '';
        footLineHtml += lzm_inputControls.createButton('feedbacks-page-all-backward', 'feedbacks-list-page-button' + leftDisabled, 'FeedbacksViewer.GotoPage(1);', '','<i class="fa fa-fast-backward"></i>', 'l', {'border-right-width': '1px'},'',-1,'e') +
            lzm_inputControls.createButton('feedbacks-page-one-backward', 'feedbacks-list-page-button' + leftDisabled, 'FeedbacksViewer.GotoPage(' + (FeedbacksViewer.Page - 1) + ');', '', '<i class="fa fa-backward"></i>', 'r',{'border-left-width': '1px'},'',-1,'e') +
            '<span style="padding: 0 15px;">' + tid('page_of_total',[['<!--this_page-->', FeedbacksViewer.Page], ['<!--total_pages-->', FeedbacksViewer.PagesTotal]]) + '</span>' +
            lzm_inputControls.createButton('feedbacks-page-one-forward', 'feedbacks-list-page-button' + rightDisabled, 'FeedbacksViewer.GotoPage(' + (FeedbacksViewer.Page + 1) + ');', '', '<i class="fa fa-forward"></i>', 'l',{'border-right-width': '1px'},'',-1,'e') +
            lzm_inputControls.createButton('feedbacks-page-all-forward', 'feedbacks-list-page-button' + rightDisabled, 'FeedbacksViewer.GotoPage(' + FeedbacksViewer.PagesTotal + ');', '', '<i class="fa fa-fast-forward"></i>', 'r',{'border-left-width': '1px'},'',-1,'e');

        footLineHtml += '</span><span style="float:right;">';
        footLineHtml += lzm_inputControls.createButton('fv-close-btn', '', '', tid('close'), '', 'lr',{'margin-left': '4px'},'',30,'d');
        footLineHtml += '</span>';
        return footLineHtml;
    }
    else
    {
        $('#fv-close-btn').click(function(){
            FeedbacksViewer.GotoPage(1);
            TaskBarManager.RemoveActiveWindow();
        });
    }
    return '';
};

FeedbacksViewer.prototype.InitUpdateViewer = function(_page){
    try
    {
        this.SwitchLoading(true);
        FeedbacksViewer.Page = _page;
        CommunicationEngine.FeedbacksUpdateTimestamp='';
        this.CreateFooterLine(true);
        CommunicationEngine.stopPolling();
        CommunicationEngine.startPolling();
    }
    catch(ex)
    {
        deblog(ex);
    }
};

FeedbacksViewer.prototype.UpdateViewer = function(){

    this.CalculatePaging();
    $('#feedbacks_viewer_dialog-footline').html(this.CreateFooterLine(false));
    $('#feedbacks-table').replaceWith(this.CreateFeedbacksHtml());
    this.SwitchLoading(false);
    this.CreateFooterLine(true);
};

FeedbacksViewer.prototype.CreateFeedbacksHtml = function(_list,_elementId){

    _elementId = d(_elementId) ? _elementId : '';

    var chatInfo = _elementId.indexOf('-e-') === 0;

    var bodyString = '<table class="visible-list-table alternating-rows-table lzm-unselectable" id="feedbacks-table'+_elementId+'">';

    if(!chatInfo)
    {
        bodyString += '<thead><tr><th></th>'+
            '<th>' + tid('date') + '</th><th>' + tid('operator') + '</th><th>' + tid('group') + '</th>' +
            '<th>' + tid('name') + '</th><th>' + tid('email') + '</th><th>' + tid('company') + '</th>' +
            '<th>' + tid('phone') + '</th><th>' + tid('ticket') + '</th><th>' + tid('chat') + '</th>';

        var thtext='',thicon='';
        for(var key in DataEngine.global_configuration.database['fbc'])
            if(DataEngine.global_configuration.database['fbc'][key].type == '0')
                thicon += '<th class="text-center">'+DataEngine.global_configuration.database['fbc'][key].name+'</th>';
            else
                thtext += '<th style="min-width:200px;">'+DataEngine.global_configuration.database['fbc'][key].name+'</th>';

        bodyString += thtext + thicon;
        bodyString += '</tr></thead>';
    }
    bodyString += '<tbody>' + this.GetFeedbackLines(_list,_elementId) + '</tbody></table>';

    return bodyString;
};

FeedbacksViewer.prototype.GetFeedbackLines = function(_list,_elementId){

    if(!d(_list))
        _elementId = '-f-';

    _list = d(_list) ? _list : DataEngine.feedbacksList;

    var linesHtml = '',maxCreated=LocalConfiguration.LastFeedback;

    if(maxCreated==null)
        maxCreated = 0;

    for (var i=0; i<_list.length; i++)
    {
        linesHtml += this.GetFeedbackLine(_list[i],_elementId);
        maxCreated = Math.max(_list[i].cr,maxCreated);
    }

    return linesHtml;
};

FeedbacksViewer.prototype.GetFeedbackLine = function(fb,_elementId){

    var key,crit,edTime = lzm_chatTimeStamp.getLocalTimeObject(parseInt(fb.cr * 1000), true);
    var edString = lzm_commonTools.getHumanDate(edTime, '', lzm_chatDisplay.userLanguage) + ' ';
    var onclickAction = ((!IFManager.IsAppFrame && !IFManager.IsMobileOS) || IFManager.IsDesktopApp()) ? ' onclick="FeedbacksViewer.Select(event, \'' + fb.i + _elementId + '\');"' : ' onclick="FeedbacksViewer.Select(event, \'' + fb.i + _elementId + '\');FeedbacksViewer.ShowContextMenu(event);"';
    var onconetxtMenuAction = ((!IFManager.IsAppFrame && !IFManager.IsMobileOS) || IFManager.IsDesktopApp()) ? ' oncontextmenu="FeedbacksViewer.Select(event, \'' + fb.i + _elementId + '\');FeedbacksViewer.ShowContextMenu(event);"' : '';
    var ondblclickAction = (fb.u.length && ((!IFManager.IsAppFrame && !IFManager.IsMobileOS) || IFManager.IsDesktopApp())) ? ' ondblclick="ChatVisitorClass.ShowVisitorInformation(\'' + fb.u + '\', 7);"' : '';
    var chatInfo = _elementId.indexOf('-e-') === 0;

    if(this.m_SelectedFeedbackId=='')
        this.m_SelectedFeedbackId = fb.i;

    var opname = OperatorManager.GetOperatorName(fb.o),grname = '-';
    var group = DataEngine.groups.getGroup(fb.g);
    if(group != null)
        grname = group.id;

    var selectedLine = (this.m_SelectedFeedbackId==fb.i) ? ' selected-table-line' : '';
    var fbhtml = '<tr id="feedbacks-list-line-'+fb.i+_elementId+'" '+onclickAction+onconetxtMenuAction+ondblclickAction+' class="feedbacks-list-line'+selectedLine+'">' +
        '<td class="icon-column noibg"><i class="fa fa-star icon-'+FeedbacksViewer.GetRatingAVGColor(fb)+'"></i></td>' +
        '<td style="width:200px;">&nbsp;'+edString+'&nbsp;</td>';

    if(!chatInfo)
        fbhtml += '<td>'+opname+'</td><td>'+grname+'</td>';

    if(!chatInfo)
    {
        if(DataEngine.getConfigValue('gl_anra',false) == 1)
        {
            fbhtml += '<td>'+lzm_commonTools.htmlEntities(lzm_commonTools.Mask(fb.UserData.f111))+'</td>';
            fbhtml += '<td>'+lzm_commonTools.htmlEntities(lzm_commonTools.Mask(fb.UserData.f112))+'</td>';
            fbhtml += '<td>'+lzm_commonTools.htmlEntities(lzm_commonTools.Mask(fb.UserData.f113))+'</td>';
            fbhtml += '<td>'+lzm_commonTools.htmlEntities(lzm_commonTools.Mask(fb.UserData.f116))+'</td>';
            fbhtml +=  '<td>'+lzm_commonTools.htmlEntities('-')+'</td>';
            fbhtml +=  '<td>'+lzm_commonTools.htmlEntities('-')+'</td>';
        }
        else
        {
            fbhtml += '<td>'+lzm_commonTools.htmlEntities(fb.UserData.f111)+'</td>';
            fbhtml += '<td>'+lzm_commonTools.htmlEntities(fb.UserData.f112)+'</td>';
            fbhtml += '<td>'+lzm_commonTools.htmlEntities(fb.UserData.f113)+'</td>';
            fbhtml += '<td>'+lzm_commonTools.htmlEntities(fb.UserData.f116)+'</td>';
            fbhtml +=  '<td>'+lzm_commonTools.htmlEntities(fb.t)+'</td>';
            fbhtml +=  '<td>'+lzm_commonTools.htmlEntities(fb.c)+'</td>';
        }
    }

    for(key in DataEngine.global_configuration.database['fbc'])
    {
        crit = DataEngine.global_configuration.database['fbc'][key];
        if(crit.type=='1')
            fbhtml += this.getCriteriaField(crit,fb);
    }

    if(!chatInfo)
    {
        for(key in DataEngine.global_configuration.database['fbc'])
        {
            crit = DataEngine.global_configuration.database['fbc'][key];
            if(crit.type=='0')
                fbhtml += this.getCriteriaField(crit,fb);
        }
    }

    return fbhtml + '</tr>';
};

FeedbacksViewer.prototype.getCriteriaField = function(crit,fb){
    var chtml = '',data = lzm_commonTools.GetElementByProperty(fb.Criteria,'i',crit.id);
    if(data == null || !data.length)
        return '<td></td>';
    else
        data = data[0];

    if(crit.type == '0')
    {
        var rate = parseInt(data.Value);
        var col = (rate >= 4) ? 'green' : ((rate > 2) ? 'orange' : 'red');
        for(var i=0;i<5;i++)
            chtml += '<i style="margin-right:2px;" class="fa icon-small fa-circle '+((i<rate) ? 'icon-'+col : 'icon-light' )+' nobg"></i>';
        return '<td class="text-center noibg">' + chtml + '</td>';
    }
    else
        return '<td style="word-wrap:normal;word-break:break-word;white-space:normal;">'+lzm_commonTools.htmlEntities(data.Value)+'</td>';
};

FeedbacksViewer.prototype.SwitchLoading = function(show){
    if(show)
    {
        $('#feedbacks-table').css('display','none');
        var loadingHtml = '<div id="feedbacks-viewer-loading"><div class="lz_anim_loading"></div></div>';
        $('#feedbacks_viewer_dialog-body').append(loadingHtml).trigger('create');
        $('#feedbacks-viewer-loading').css({position: 'absolute', left: 0, top: 0, bottom: '2px', right:0,'background-color': '#fff', 'z-index': 1000});
    }
    else
    {
        $('#feedbacks-viewer-loading').remove();
        $('#feedbacks-table').css('display','table');
    }
};

FeedbacksViewer.prototype.CreateMatchingFeedbacks = function(_list,_elementId){
    var table = this.CreateFeedbacksHtml(_list,'-'+_elementId);
    return '<div id="matching-feedbacks-'+_elementId+'-inner" style="margin-top:1px;">' + table + '</div>';
};

FeedbacksViewer.GotoPage = function(page){
    if(lzm_chatDisplay.FeedbacksViewer != null)
        lzm_chatDisplay.FeedbacksViewer.InitUpdateViewer(page);
};

FeedbacksViewer.ShowContextMenu = function(event){
    ContextMenuClass.RemoveAll();
    var fb = lzm_commonTools.GetElementByProperty(DataEngine.feedbacksList,'i',lzm_chatDisplay.FeedbacksViewer.m_SelectedFeedbackId);
    if (fb.length==1)
    {
        var cm = {
            id: 'feedbacks_cm',
            entries: []
        };

        if(DataEngine.getConfigValue('gl_anra',false) != 1)
        {
            if(fb[0].u.length)
                cm.entries.push({label: tid('visitor') + ' ' + tid('history'), onClick : 'ChatVisitorClass.ShowVisitorInformation(\'' + fb[0].u + '\', 7);'});
            cm.entries.push({label: tid('create_ticket'), onClick : 'FeedbacksViewer.CreateTicket();'});
        }
        cm.entries.push({label: tid('remove'), onClick : 'FeedbacksViewer.RemoveFeedback();'});
        ContextMenuClass.BuildMenu(event,cm);
    }
    event.stopPropagation();
    event.preventDefault();
    return false;
};

FeedbacksViewer.RemoveFeedback = function(){
    if(PermissionEngine.permissions.delete_feedbacks != 1)
    {
        showNoPermissionMessage();
        return;
    }
    CommunicationEngine.FeedbacksUpdateTimestamp = '';
    CommunicationEngine.pollServerSpecial(lzm_chatDisplay.FeedbacksViewer.m_SelectedFeedbackId, 'remove_feedback');
};

FeedbacksViewer.GetTexts = function(_feedbackObj){
    var title,crit,text = '';
    for(var key in DataEngine.global_configuration.database['fbc'])
    {
        crit = DataEngine.global_configuration.database['fbc'][key];
        var data = lzm_commonTools.GetElementByProperty(_feedbackObj.Criteria,'i',crit.id);
        title = crit.name;
        if(crit.type=='1')
        {
            if(data != null && data.length)
            {
                data = data[0];
                text += title +': ' + lzm_commonTools.htmlEntities(data.Value)+'\r\n';
            }
        }
        else
        {
            if(data != null && data.length)
            {
                text += title +': ' + data[0].Value + '/5\r\n';
            }
        }
    }
    return text;
};

FeedbacksViewer.Select = function(e,id){
    var fid = id;
    if(fid.indexOf('-') != -1)
        fid = fid.split('-')[0];
    ContextMenuClass.RemoveAll();
    var fb = lzm_commonTools.GetElementByProperty(DataEngine.feedbacksList,'i',fid);
    if (fb.length==1)
    {
        $('.feedbacks-list-line').removeClass('selected-table-line');
        $('#feedbacks-list-line-' + id).addClass('selected-table-line');
        lzm_chatDisplay.FeedbacksViewer.m_SelectedFeedbackId = fid;
    }
};

FeedbacksViewer.CreateTicket = function(){

    var fb = lzm_commonTools.GetElementByProperty(DataEngine.feedbacksList,'i',lzm_chatDisplay.FeedbacksViewer.m_SelectedFeedbackId);
    if (fb.length==1)
    {
        if(fb[0].c.length)
        {
            if(Chat.CreateTicket(fb[0].c, false))
                return;
        }
        if(fb[0].t.length)
        {
            lzm_commonDialog.createAlertDialog(tid('related_ticket_exists').replace('<!--tid-->',fb[0].t), [{id: 'yes', name: tid('yes')}, {id: 'ignore', name: tid('ignore')}, {id: 'cancel', name: tid('cancel')}]);
            $('#alert-btn-yes').click(function() {
                lzm_commonDialog.removeAlertDialog();
                ChatTicketClass.SearchForTicketID(fb[0].t);
            });
            $('#alert-btn-ignore').click(function() {
                lzm_commonDialog.removeAlertDialog();
                ChatTicketClass.__ShowTicket('', false, '','', lzm_chatDisplay.FeedbacksViewer.m_SelectedFeedbackId);
            });
            $('#alert-btn-cancel').click(function() {
                lzm_commonDialog.removeAlertDialog();
            });
        }
        else
            ChatTicketClass.__ShowTicket('', false, '','', lzm_chatDisplay.FeedbacksViewer.m_SelectedFeedbackId);
    }
};

FeedbacksViewer.GetRatingAVG = function(_fb){
    var count = 0,total = 0;
    for(var key in DataEngine.global_configuration.database['fbc'])
    {
        var crit = DataEngine.global_configuration.database['fbc'][key];
        if(crit.type=='0')
        {
            var data = lzm_commonTools.GetElementByProperty(_fb.Criteria,'i',crit.id);
            if(data.length)
            {
                data = data[0];
                count++;
                total+=parseInt(data.Value);
            }
        }
    }
    if(count>0)
    {
        return total/count;
    }
    return 5;
};

FeedbacksViewer.GetRatingAVGColor = function(_fb){
    var avg = FeedbacksViewer.GetRatingAVG(_fb);
    if(avg>=4)
        return 'green';
    else if(avg>2)
        return 'orange';
    else if(avg>0)
        return 'red';
    else
        return 'default';
};




