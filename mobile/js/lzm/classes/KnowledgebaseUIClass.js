/****************************************************************************************
 * LiveZilla KnowledgebaseUI.js
 *
 * Copyright 2018 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/

function KnowledgebaseUI() {
    this.SelectedResourceTab = 0;
    this.openedResourcesFolder = ['1'];
    this.KBSearchCategories = ['ti', 't', 'text'];
    this.qrdChatPartner = '';
    this.qrdSearchResults = [];
    this.CacheResourceList = null;
    this.ShowPreview = true;
}

KnowledgebaseUI.PreviewResourceId = null;
KnowledgebaseUI.CopyResource = null;
KnowledgebaseUI.CutResource = null;
KnowledgebaseUI.FileToUpload = null;
KnowledgebaseUI.TextEditor = null;
KnowledgebaseUI.QuickSearchReady = false;
KnowledgebaseUI.ShortCutResources = [];
KnowledgebaseUI.DraftResources = [];
KnowledgebaseUI.IsSyncing = false;
KnowledgebaseUI.IsLoading = false;
KnowledgebaseUI.CacheValid = false;
KnowledgebaseUI.TypeFolder = 0;
KnowledgebaseUI.TypeText = 1;
KnowledgebaseUI.TypeURL = 2;
KnowledgebaseUI.TypeFile = 3; // 4 also
KnowledgebaseUI.AutoSearchTimer = null;
KnowledgebaseUI.SelectionMode = false;
KnowledgebaseUI.SelectionWindow = null;
KnowledgebaseUI.RelatedEditor = null;
KnowledgebaseUI.Highlighting = false;
KnowledgebaseUI.HighlightTypes = [];
KnowledgebaseUI.SelectionData = null;

var checkEnding = function(fileName, ending) {
    ending = (typeof ending == 'string') ? [ending] : (typeof ending == 'object' && ending instanceof Array) ? ending : [];
    var fnLength = fileName.length, eLength = 0, rt = false;
    for (var i=0; i<ending.length; i++) {
        eLength = ending[i].length;
        rt = rt || (ending[i] != '' && fileName.indexOf('.' + ending[i]) == fnLength - eLength - 1);
    }
    return rt;
};

KnowledgebaseUI.prototype.CreateKBTopNode = function(caller, _context){

    if(!KnowledgebaseUI.CacheValid)
    {
        var i,that = this;
        var chatPartnerName = lzm_displayHelper.getChatPartner(_context)['name'];

        this.CacheResourceList = DataEngine.cannedResources.GetResourceList();

        that.qrdChatPartner = _context;

        var content = that.CreateKBTreeTopLevel(_context, false);
        content += that.CreateKBSearch(_context, false);

        var qrdTreeHtml = '<div id="qrd-tree-body" class="lzm-dialog-body" onclick="removeKBContextMenu();">'+content+'</div>' +
            '<div id="qrd-tree-headline" class="lzm-dialog-headline2">' +
            '<span class="lzm-dialog-hl2-info" id="qrd-info"></span>' + this.CreateButtonLine(caller, _context, chatPartnerName) + '</div>';

        $('#qrd-tree').html(qrdTreeHtml).trigger('create');

        for (i=0; i<this.CacheResourceList.length; i++)
        {
            if ($('#folder-' + this.CacheResourceList[i].rid).html() == "")
            {
                $('#resource-' + this.CacheResourceList[i].rid + '-open-mark').css({background: 'none'})
            }
        }

        this.UpdateKBInfo();
        UIRenderer.resizeResources();

        for (i=0; i<that.openedResourcesFolder.length; i++)
            KnowledgebaseUI.HandleResourceClickEvents(that.openedResourcesFolder[i], true, false, _context);

        $('.qrd-tree-placeholder-tab').click(function() {

            var oldSelectedTabNo = that.SelectedResourceTab;
            that.SelectedResourceTab = parseInt($(this).data('tab-no'));
            $('#kb-button-line').html(that.CreateButtonLine(caller, _context, chatPartnerName));
            if (oldSelectedTabNo != that.SelectedResourceTab) {
                var newSelectedResource = lzm_chatDisplay.tabSelectedResources[that.SelectedResourceTab];
                lzm_chatDisplay.tabSelectedResources[oldSelectedTabNo] = lzm_chatDisplay.selectedResource;
                KnowledgebaseUI.HandleResourceClickEvents(newSelectedResource, true, false, _context);
            }
            if (that.SelectedResourceTab != 0)
                $('#add-qrd').addClass('ui-disabled');


            UIRenderer.resizeResources();
        });

        this.UpdateSelectedNodeUI();

        // recall for UI updates
        if(KnowledgebaseUI.SelectionMode)
            KnowledgebaseUI.InitSelectionMode(KnowledgebaseUI.SelectionWindow,KnowledgebaseUI.SelectionMode);
    }
    KnowledgebaseUI.CacheValid = true;
};

KnowledgebaseUI.prototype.UpdateSelectedNodeUI = function(){
    var res = DataEngine.cannedResources.getResource(lzm_chatDisplay.selectedResource);
    if(res != null)
    {
        if(res.ty != 0)
        {
            KnowledgebaseUI.HandleResourceClickEvents(lzm_chatDisplay.selectedResource,false);
        }
    }
};

KnowledgebaseUI.prototype.CreateButtonLine = function(caller){

    var html = '',sendButton=null;

    html += '<span id="kb-button-search" class="right-button-list">';
    html += lzm_inputControls.createButton('search-kb', '', 'CommonInputControlsClass.SearchBox.ToggleSearchDialog(true);', '', '<i class="fa fa-search"></i>', 'lr', {'margin-right': '4px'},'',-1,'e');
    html += '</span>';

    html += '<span id="kb-button-line" class="right-button-list">';
    if(sendButton!=null)
        html += sendButton;

    html += lzm_inputControls.createButton('add-qrd', 'ui-disabled qrd-change-buttons', 'KnowledgebaseUI.ShowKBAddMenu(event);', tid('add'), '<i class="fa fa-plus"></i>', 'lr', {'margin-right': '4px'},'',-1,'e');
    html += lzm_inputControls.createButton('edit-qrd', 'ui-disabled qrd-change-buttons', 'KnowledgebaseUI.EditEntry();', tid('edit'), '<i class="fa fa-edit"></i>', 'lr', {'margin-left': '0'},'',-1,'e');
    html += lzm_inputControls.createButton('delete-qrd', 'ui-disabled qrd-change-buttons', 'KnowledgebaseUI.Remove();', tid('remove'), '<i class="fa fa-remove"></i>', 'lr', {'margin-left': '-1px','margin-right': '4px'},'',-1,'e');

    if(this.SelectedResourceTab==0)
        html += lzm_inputControls.createButton('sync-kb', '', 'KnowledgebaseUI.Synchronize();', tid('synchronize'), '<i class="fa fa-refresh"></i>', 'lr', {'margin-right': '4px'},'',-1,'e');

    html += '</span>';

    return html;
};

KnowledgebaseUI.prototype.UpdateKBInfo = function(_count){

    if(!d(_count))
        _count = (d(this.CacheResourceList) && this.CacheResourceList != null) ? KnowledgebaseUI.CountVisibleEntries(this.CacheResourceList) : 0;

    if(!KnowledgebaseUI.SelectionMode)
    {
        if(KnowledgebaseUI.IsSyncing)
            $('#qrd-info').html('<b>'+tidc('loading',' ...')+'</b> (' + tid('total_entries',[['<!--total-->',_count]])+')');
        else
            $('#qrd-info').html(tid('total_entries',[['<!--total-->',_count]]));
    }

    if(lzm_chatDisplay.windowWidth < 500)
        $('#qrd-info').css({display:'none'});
};

KnowledgebaseUI.prototype.UpdateResources = function(_newResources) {

    if(lzm_chatDisplay.selected_view == 'qrd')
        this.CacheResourceList = DataEngine.cannedResources.GetResourceList();
    else
        KnowledgebaseUI.CacheValid = false;

    var key,res, parentsToUpdate=[];
    for(key in _newResources)
    {
        res = _newResources[key];
        if(res.di != 0)
        {
            // REMOVE
            if ($('#resource-' + res.rid).length != 0)
                $('#resource-' + res.rid).remove();
        }
        else
        {
            // ADD,UPDATE
            if($.inArray(res.pid,parentsToUpdate)== -1)
                parentsToUpdate.push(res.pid);
        }
    }

    for(key in parentsToUpdate)
    {
        KnowledgebaseUI.PopulateFolder(parentsToUpdate[key],'',true);
    }

    this.UpdateKBInfo();

    if(lzm_chatDisplay.selectedResource != '')
        KnowledgebaseUI.HandleResourceClickEvents(lzm_chatDisplay.selectedResource,true);
};

KnowledgebaseUI.prototype.GetResourceIconHTML = function(resource) {
    var that = this;

    var resourceIcon;
    switch(resource.ty.toString())
    {
        case '0':
            resourceIcon = '<i class="fa fa-folder"></i>';
            break;
        case '1':
            resourceIcon = '<i class="fa fa-file-text icon-gray"></i>';
            break;
        case '2':
            if (typeof resource.text != 'undefined' && resource.text.indexOf('mailto:') == 0)
                resourceIcon = '<i class="fa fa-envelope icon-blue"></i>';
            else
                resourceIcon = '<i class="fa fa-link icon-red"></i>';
            break;
        default:
            resourceIcon = that.getFileTypeIcon(resource.ti);
            break;
    }
    return resourceIcon + this.GetPublicIconHTML(resource);
};

KnowledgebaseUI.prototype.getFileTypeIcon = function(fileName) {

    fileName = (d(fileName)) ? fileName.toLowerCase() : '';

    var fileIcon = '<i class="fa fa-file"></i>';
    if (checkEnding(fileName, ['mp3', 'wav', 'ogg', 'wma']))
        fileIcon = '<i class="fa fa-file-sound-o icon-orange"></i>';
    else if (checkEnding(fileName, ['png', 'gif', 'jpg', 'bmp', 'jpeg']))
        fileIcon = '<i class="fa fa-file-picture-o icon-blue"></i>';
    else if (checkEnding(fileName, ['doc', 'docx', 'odt', 'rtf'])) {
        fileIcon = '<i class="fa fa-file-word-o icon-blue"></i>';
    } else if (checkEnding(fileName, ['xls', 'xlsx', 'ods', 'csv'])) {
        fileIcon = '<i class="fa fa-file-excel-o icon-green"></i>';
    } else if (checkEnding(fileName, ['ppt', 'pptx', 'odp'])) {
        fileIcon = '<i class="fa fa-file-powerpoint-o"></i>';
    } else if (checkEnding(fileName, ['zip', 'rar', 'tar', 'tar.gz', 'tar.bz2', 'tar.xz', 'tgz', '7z'])) {
        fileIcon = '<i class="fa fa-file-archive-o icon-red"></i>';
    } else if (checkEnding(fileName, ['pdf', 'ps'])) {
        fileIcon = '<i class="fa fa-file-pdf-o icon-red"></i>';
    } else if (checkEnding(fileName, ['exe', 'bat'])) {
        fileIcon = '<i class="fa fa-gear icon-red"></i>';
    } else if (checkEnding(fileName, ['mpg', 'mpeg', 'avi', 'mp4', 'webm', 'mov', 'ogm', 'wmf'])) {
        fileIcon = '<i class="fa fa-file-movie-o"></i>';
    } else if (checkEnding(fileName, ['js', 'php', 'html', 'css', 'py', 'sh', 'pl', 'cs', 'java', 'c', '.c++', '.cpp']))
        fileIcon = '<i class="fa fa-file-code-o"></i>';

    return fileIcon;
};

KnowledgebaseUI.prototype.GetPublicIconHTML = function(resource) {
    var html = '';
    if(d(resource.p) && resource.p.toString()=='1')
        html += '<i class="fa fa-life-ring nic icon-blue icon-public"></i>';
    if(d(resource.ba) && resource.ba.toString()=='1')
        html += '<i class="fa fa-microchip nic icon-green icon-public icon-bot"></i>';
    return html;
};

KnowledgebaseUI.prototype.CreateKBTreeTopLevel = function(_context, inDialog) {

    var topLayerResource = DataEngine.cannedResources.getResource('1');
    var onclickAction = ' onclick="KnowledgebaseUI.HandleResourceClickEvents(\'' + topLayerResource.rid + '\',false,false,\'' + _context + '\')"';
    var onContextMenu = ' oncontextmenu="return false;"', that = this;

    if (((!IFManager.IsAppFrame && !IFManager.IsMobileOS) || IFManager.IsDesktopApp()) && !inDialog)
        onContextMenu = ' oncontextmenu="KnowledgebaseUI.OpenKBContextMenu(event, \'' + _context + '\', \'' + topLayerResource.rid + '\');return false;"';

    var id = (inDialog) ? 'all-resources-dialog' : 'all-resources';
    var sid = (inDialog) ? 'd-' : '';
    var plusMinusImage = '';
    var resourceHtml = '<div id="'+id+'" class="lzm-fieldset">' +
        '<div id="'+id+'-inner"><div id="'+sid+'resource-' + topLayerResource.rid + '" class="resource-div lzm-unselectable">' +
        '<span class="resource-open-mark" id="'+sid+'resource-' + topLayerResource.rid + '-open-mark"' +
        onclickAction + onContextMenu + '>' + plusMinusImage + '</span>' +
        '<span class="resource-icon-and-text" id="'+sid+'resource-' + topLayerResource.rid + '-icon-and-text"' +
        onclickAction + onContextMenu + '>' + that.GetResourceIconHTML(topLayerResource) +
        '<span class="qrd-title-span">' + lzm_commonTools.htmlEntities(topLayerResource.ti) + '</span>' +
        '</span></div><div id="'+sid+'folder-' + topLayerResource.rid + '" style="display: none;"></div>' +
        '</div></div>';

    if(!inDialog)
        resourceHtml += '<div id="all-resources-preview" class="kb-preview-box"></div>';
    else
        resourceHtml += '<div id="all-resources-preview-dialog" class="kb-preview-box"></div>';

    return resourceHtml;
};

KnowledgebaseUI.prototype.SetPreview = function(_resource){

    var pd = null;
    if($('#all-resources-preview-dialog').length)
        pd = $('#all-resources-preview-dialog');
    else if($('#all-resources-preview').length)
        pd = $('#all-resources-preview');

    if(pd != null)
    {
        KnowledgebaseUI.PreviewResourceId = null;
        pd.html('');
        if(_resource!=null && _resource.rid.length>1)
        {
            KnowledgebaseUI.PreviewResourceId = _resource.rid;
            if(_resource.ty=='1'||_resource.ty=='0')
                pd.html(_resource.text);
            else if(_resource.ty=='2')
                pd.html('<a target="_blank" href="'+_resource.text+'">' + _resource.ti+'</a>');
            else if(_resource.ty=='3' && checkEnding(_resource.ti, ['png', 'gif', 'jpg', 'bmp', 'jpeg']))
            {
                pd.html('<img src="'+DataEngine.getServerUrl("getfile.php")+"?file=&id="+_resource.rid+'">');
            }
        }
    }
};

KnowledgebaseUI.prototype.CreateKBSearch = function(chatPartner, inDialog) {
    var sid = (inDialog) ? 'd-' : '';
    var attachmentDataString = '';//(chatPartner.indexOf('ATTACHMENT') != -1) ? ' data-attachment="1"' : ' data-attachment="0"';

    var searchHtml = '<div id="'+sid+'search-results" style="display:none;">' +
        '<div id="'+sid+'search-result-frame">' +
        '<table id="'+sid+'search-result-table" class="visible-list-table alternating-rows-table lzm-unselectable" ' + attachmentDataString + '><thead><tr>' +
        '<th></th><th>' + tid('title') + '</th><th>' + tid('tags') + '</th><th>' + tid('content') + '</th></tr></thead><tbody></tbody></table></div></div>';

    return searchHtml;
};

KnowledgebaseUI.prototype.CreateKBSearchResults = function(_query, _tags, _caller, inDialog) {

    var searchHtml = '', that = this;
    var sid = (inDialog) ? 'd-' : '';
    var resources = DataEngine.cannedResources.GetResourceList();
    var searchCategories = that.KBSearchCategories;

    if(_tags.length)
        _tags = _tags.split(',');

    var resultIds = [];

    if (_query != '' || _tags.length)
    {
        for (var i=0; i<resources.length; i++)
        {
            for (var j=0; j<searchCategories.length; j++)
            {
                var contentToSearch = resources[i][searchCategories[j]].toLowerCase();

                if(resources[i].ty < 3)
                    if (resources[i].ty != 0 && contentToSearch.indexOf(_query.toLowerCase()) != -1 && $.inArray(resources[i].rid, resultIds) == -1)
                    {
                        var entryTags = resources[i].t;
                        if(!entryTags.length)
                            entryTags = [];
                        else
                            entryTags = entryTags.split(',');

                        var tagmatch = false;

                        if(_tags.length)
                        {
                            for(var qkey in _tags)
                            {
                                for(var ekey in entryTags)
                                {
                                    if(_tags[qkey] == entryTags[ekey])
                                    {
                                        tagmatch = true;
                                        break;
                                    }
                                }
                            }
                        }
                        else
                            tagmatch = true;

                        if (tagmatch)
                        {
                            searchHtml += that.CreateSearchResultLine(resources[i], _query, _tags, _caller, inDialog);
                            resultIds.push(resources[i].rid);
                        }
                    }
            }
        }
    }

    return searchHtml;
};

KnowledgebaseUI.prototype.CreateSearchResultLine = function(resource, searchString, _tags, _context, inDialog) {

    searchString = (typeof searchString != 'undefined') ? searchString : '';
    _context = (typeof _context != 'undefined') ? _context : '';
    var tags = '',that = this;
    var sid = (inDialog) ? 'd-' : '';
    var onclickAction = ' onclick="KnowledgebaseUI.HandleResourceClickEvents(\'' + resource.rid + '\',false,false, \'' + _context + '\');"';
    var onDblClickAction = '', onContextMenu = ' oncontextmenu="return false;"';

    if (((!IFManager.IsAppFrame && !IFManager.IsMobileOS) || IFManager.IsDesktopApp()) && !inDialog)
        onContextMenu = ' oncontextmenu="KnowledgebaseUI.OpenKBContextMenu(event, \'' + _context + '\', \'' + resource.rid + '\');return false;"';

    if ((!IFManager.IsAppFrame && !IFManager.IsMobileOS) || IFManager.IsDesktopApp())
        onDblClickAction = ' ondblclick="KnowledgebaseUI.EntryDBLClick();"';

    var content = ($.inArray(parseInt(resource.ty), [3,4]) == -1) ? resource.text.replace(/<.*?>/g, ' ') : '';

    content = lzm_commonTools.HighlightSearchKey(content, searchString, true, 500);

    var title = lzm_commonTools.htmlEntities(resource.ti).replace(/<.*?>/g, ' ');
    if(title.length > 200)
        title = title.substring(0,200)+" ...";

    title = lzm_commonTools.HighlightSearchKey(title,searchString);

    if(searchString.length)
        tags = lzm_commonTools.HighlightSearchKey(lzm_commonTools.FormatTableTags(resource.t),searchString);
    else
        tags = lzm_commonTools.HighlightSearchKey(lzm_commonTools.FormatTableTags(resource.t),_tags);

    var searchLineHtml = '<tr style="cursor: pointer;" class="qrd-search-line lzm-unselectable" id="qrd-'+sid+'search-line-' + resource.rid + '"' + onclickAction + onDblClickAction + onContextMenu + '>' +
        '<td class="noibg icon-column resource-icon-and-text">' + that.GetResourceIconHTML(resource,false) + '</td>' +
        '<td>' + title + '</td>' +
        '<td class="tag-field">' + tags + '</td>' +
        '<td>' + content + '</td>' +
        '</tr>';

    return searchLineHtml;
};

KnowledgebaseUI.prototype.GetResourceHTML = function(resource, _context, inDialog) {

    _context = (typeof _context != 'undefined') ? _context : '';
    inDialog = (typeof inDialog != 'undefined') ? inDialog : false;

    var sid = (inDialog) ? 'd-' : '';
    var onclickAction = ' onclick="KnowledgebaseUI.HandleResourceClickEvents(\'' + resource.rid + '\',false,false,\''+_context+'\')"';
    var onDblClickAction = '', that = this;
    var onContextMenu = ' oncontextmenu="return false;"';

    if (((!IFManager.IsAppFrame && !IFManager.IsMobileOS) || IFManager.IsDesktopApp()) && !inDialog)
        onContextMenu = ' oncontextmenu="KnowledgebaseUI.OpenKBContextMenu(event, \'' + _context + '\', \'' + resource.rid + '\');return false;"';

    var resourceHtml = '<div id="'+sid+'resource-' + resource.rid + '" class="resource-div lzm-unselectable ty'+resource.ty+'" style="padding-left: ' + (20 * resource.ra) + 'px;">';
    if (resource.ty == 0)
    {
        var openMarkIcon = (KnowledgebaseUI.GetChildNodes(resource.rid).length > 0) ? '<i class="fa fa-caret-right"></i>' : '';
        resourceHtml += '<span class="resource-open-mark" id="'+sid+'resource-' + resource.rid + '-open-mark"' + onclickAction + onContextMenu + '>' + openMarkIcon + '</span>';
    }
    else
    {
        resourceHtml += '<span class="resource-empty-mark"></span>';
        if (_context.indexOf('TICKET SAVE') == -1)
            if ((!IFManager.IsAppFrame && !IFManager.IsMobileOS) || IFManager.IsDesktopApp())
                onDblClickAction = ' ondblclick="KnowledgebaseUI.EntryDBLClick();"';
    }
    resourceHtml += '<span class="resource-icon-and-text" id="'+sid+'resource-' + resource.rid + '-icon-and-text"' +
        onclickAction + onDblClickAction + onContextMenu + '>' +
        that.GetResourceIconHTML(resource) +
        '<span class="qrd-title-span">' +
        lzm_commonTools.htmlEntities(resource.ti) + '</span>' +
        '</span></div>';

    if (resource.ty == 0)
        resourceHtml += '<div id="'+sid+'folder-' + resource.rid + '" style="display: none;"></div>';

    return resourceHtml;
};

KnowledgebaseUI.prototype.CreateKBTreeContextMenu = function(myObject){
    var contextMenuHtml = '',disabledClass;

    disabledClass = (KnowledgebaseUI.SelectionMode) ? ' class="ui-disabled"' : '';
    contextMenuHtml += '<div' + disabledClass + ' onclick="showSubMenu(\'qrd-tree\', \'kb_add\', \'\', %CONTEXTX%, %CONTEXTY%, %MYWIDTH%, %MYHEIGHT%)"><span class="cm-line cm-click">' + tid('add') + '</span><i class="fa fa-caret-right lzm-ctxt-right-fa"></i></div><hr />';

    disabledClass = (KnowledgebaseUI.SelectionMode || myObject == 'MENU' || myObject.rid == 1 || myObject.ty == 0 || DataEngine.ChatManager.Chats.length==0) ? ' class="ui-disabled"' : '';
    contextMenuHtml += '<div' + disabledClass + ' onclick="showSubMenu(\'qrd-tree\', \'kb_send\', \'\', %CONTEXTX%, %CONTEXTY%, %MYWIDTH%, %MYHEIGHT%)"><span class="cm-line cm-click">' + tid('send_to') + '</span><i class="fa fa-caret-right lzm-ctxt-right-fa"></i></div><hr />';

    disabledClass = (KnowledgebaseUI.SelectionMode || myObject != 'MENU' && myObject.rid == 1) ? ' class="ui-disabled"' : '';
    contextMenuHtml += '<div' + disabledClass + ' onclick="KnowledgebaseUI.__Copy();"><span class="cm-line">' + tid('copy') + '</span></div>';

    disabledClass = (KnowledgebaseUI.SelectionMode || myObject != 'MENU' && myObject.rid == 1) ? ' class="ui-disabled"' : '';
    contextMenuHtml += '<div' + disabledClass + ' onclick="KnowledgebaseUI.__Cut();"><span class="cm-line">' + tid('cut') + '</span></div>';

    disabledClass = (KnowledgebaseUI.SelectionMode || myObject != 'MENU' && (KnowledgebaseUI.CopyResource==null&&KnowledgebaseUI.CutResource==null)) ? ' class="ui-disabled"' : '';
    contextMenuHtml += '<div' + disabledClass + ' onclick="KnowledgebaseUI.__Paste();"><span class="cm-line">' + tid('paste') + '</span></div><hr />';

    disabledClass = (KnowledgebaseUI.SelectionMode || (myObject != 'MENU' && (myObject.rid.length == 1))) ? ' class="ui-disabled"' : '';
    contextMenuHtml += '<div' + disabledClass + ' onclick="KnowledgebaseUI.EditEntry();"><span id="edit-qrd-ctxt" class="cm-line">' + tid('edit') + '</span></div>';

    disabledClass = (myObject != 'MENU' && myObject.rid == 1) ? ' class="ui-disabled"' : '';
    contextMenuHtml += '<div' + disabledClass + ' onclick="KnowledgebaseUI.Remove();"><span id="delete-qrd-ctxt" class="cm-line">' + tid('delete') + '</span></div><hr />';

    // Sorting
    var pstype = KnowledgebaseUI.GetSortingType(myObject.pid);
    var mstype = KnowledgebaseUI.GetSortingType(myObject.rid);

    disabledClass = (myObject != 'MENU' && myObject.rid == 1 || pstype == 'AUTO') ? ' class="ui-disabled"' : '';
    contextMenuHtml += '<div' + disabledClass + ' onclick="KnowledgebaseUI.__MovePosition(\'UP\');"><span class="cm-line">' + tid('up') + '</span></div>';

    disabledClass = (myObject != 'MENU' && myObject.rid == 1 || pstype == 'AUTO') ? ' class="ui-disabled"' : '';
    contextMenuHtml += '<div' + disabledClass + ' onclick="KnowledgebaseUI.__MovePosition(\'DOWN\');"><span class="cm-line">' + tid('down') + '</span></div>';

    disabledClass = (myObject != 'MENU' && myObject.ty != 0) ? ' class="ui-disabled"' : '';
    contextMenuHtml += '<div' + disabledClass + ' onclick="showSubMenu(\'qrd-tree\', \'kb_sortmode\', \''+mstype+'\', %CONTEXTX%, %CONTEXTY%, %MYWIDTH%, %MYHEIGHT%)"><span class="cm-line cm-click">' + tid('sorting') + '</span><i class="fa fa-caret-right lzm-ctxt-right-fa"></i></div><hr />';

    if(myObject.ti == 'screenshot.lzsc')
        contextMenuHtml += '<div onclick="openLink(\''+KnowledgebaseUI.GetFileURL(myObject)+'\');">' + '<span id="show-qrd-download-ctxt" class="cm-line">' + tid('open') + '</span></div>';
    else if (myObject.ty == 2)
        contextMenuHtml += '<div onclick="openLink(\''+myObject.text+'\');">' + '<span id="show-qrd-download-ctxt" class="cm-line">' + tid('open') + '</span></div>';
    else if (myObject.ty == 3 || myObject.ty == 4)
        contextMenuHtml += '<div onclick="KnowledgebaseUI.DownloadFile();">' + '<span id="show-qrd-download-ctxt" class="cm-line">' + tid('save') + '</span></div>';

    contextMenuHtml += '<hr /><div onclick="KnowledgebaseUI.ShowInTreeView();">' + '<span id="show-qrd-download-ctxt" class="cm-line">' + tid('show') + '</span></div>';

    return contextMenuHtml;
};

KnowledgebaseUI.prototype.CalculateRank = function(_resource,_rank){
    _rank = (d(_rank)) ? _rank : 0;
    var p = DataEngine.cannedResources.getResource(_resource.pid);
    if(p==null)
        return _rank;
    else
        return this.CalculateRank(p,_rank+1);
};

KnowledgebaseUI.prototype.IsParentOf = function(_a,_b){

    if(_b.pid == _a.pid)
    {
        return false;
    }

    if(_b.pid == _a.rid)
    {
        return true;
    }

    var parent = DataEngine.cannedResources.getResource(_b.pid);
    if(parent == null)
        return false;
    else if(parent.rid==_a.pid && parent.rid != '1')
    {
        return true;
    }
    else
        return this.IsParentOf(_a,parent);
};

KnowledgebaseUI.__Copy = function(){
    removeKBContextMenu();
    KnowledgebaseUI.CutResource = null;
    KnowledgebaseUI.CopyResource = lzm_chatDisplay.selectedResource;
};

KnowledgebaseUI.__Cut = function(){
    removeKBContextMenu();

    if (!PermissionEngine.checkUserResourceWritePermissions(lzm_chatDisplay.myId, 'edit', DataEngine.cannedResources.getResource(lzm_chatDisplay.selectedResource)))
    {
        showNoPermissionMessage();
        return;
    }

    KnowledgebaseUI.CopyResource = null;
    KnowledgebaseUI.CutResource = lzm_chatDisplay.selectedResource;
};

KnowledgebaseUI.__Paste = function(){
    removeKBContextMenu();
    var actionNode=null,action='';

    if(KnowledgebaseUI.CutResource != null)
    {
        action = 'cut';
        actionNode = DataEngine.cannedResources.getResource(KnowledgebaseUI.CutResource);
        KnowledgebaseUI.CutResource = null;
    }
    else if(KnowledgebaseUI.CopyResource != null)
    {
        action = 'copy';
        actionNode = DataEngine.cannedResources.getResource(KnowledgebaseUI.CopyResource);
    }

    var targetFolder = DataEngine.cannedResources.getResource(lzm_chatDisplay.selectedResource);

    if(targetFolder.ty != '0')
        targetFolder = DataEngine.cannedResources.getResource(targetFolder.pid);

    if (!PermissionEngine.checkUserResourceWritePermissions(lzm_chatDisplay.myId, 'add', targetFolder))
    {
        showNoPermissionMessage();
        return;
    }

    if(actionNode != null && targetFolder != null)
    {
        if(actionNode.rid != targetFolder.rid || action == 'copy')
        {
            if(action == 'cut' && actionNode.ty == '0' && lzm_chatDisplay.resourcesDisplay.IsParentOf(actionNode,targetFolder))
            {
                return;
            }

            if(action == 'cut')
            {
                $('#resource-'+actionNode.rid).remove();
            }
            CommunicationEngine.PollServerResource({First:actionNode,Second:targetFolder},action);
        }
    }
};

KnowledgebaseUI.__MovePosition = function(_type){
    removeKBContextMenu();

    if (!PermissionEngine.checkUserResourceWritePermissions(lzm_chatDisplay.myId, 'edit', DataEngine.cannedResources.getResource(lzm_chatDisplay.selectedResource)))
    {
        showNoPermissionMessage();
        return;
    }

    var selResource = DataEngine.cannedResources.getResource(lzm_chatDisplay.selectedResource);

    if(selResource == null)
        return;

    if(KnowledgebaseUI.GetSortingType(selResource.pid) == 'AUTO')
    {
        // switch to manual sorting
        KnowledgebaseUI.RemoveOrderZeros(selResource.pid);
        return;
    }

    var ___getNext = function(_type,_baseElem){

        var closeElem = _type == 'UP' ? _baseElem.prev() : _baseElem.next();

        if(closeElem == null || !d(closeElem.attr('id')))
            return null;

        if(closeElem.attr('id').indexOf('folder-') === 0)
            return ___getNext(_type,closeElem);

        return closeElem;
    };

    var nextdiv = ___getNext(_type,$('.selected-resource-div'));

    if(nextdiv == null || !d(nextdiv.attr('id')))
    {
        return;
    }

    var nextres = DataEngine.cannedResources.getResource(nextdiv.attr('id').replace('resource-','').replace('folder-',''));
    if(nextres == null)
    {
        return;
    }

    if(!d(nextres.ok))
        nextres.ok = '0';

    var oldval = selResource.ok;

    selResource.ok = nextres.ok;

    nextres.ok = oldval;

    CommunicationEngine.PollServerResource({List:[selResource,nextres]}, "set");
};

KnowledgebaseUI.GetSortingType = function(_folderResourceId){

    var children = 0;

    for (var i=0; i<lzm_chatDisplay.resourcesDisplay.CacheResourceList.length; i++)
    {
        if(lzm_chatDisplay.resourcesDisplay.CacheResourceList[i].di == 1)
            continue;

        if(lzm_chatDisplay.resourcesDisplay.CacheResourceList[i].pid == _folderResourceId)
        {
            children++;
            if(!d(lzm_chatDisplay.resourcesDisplay.CacheResourceList[i].ok) || lzm_chatDisplay.resourcesDisplay.CacheResourceList[i].ok == '0')
            {
                return 'AUTO';
            }
        }
    }
    return children > 0 ? 'MANUAL' : 'AUTO';
};

KnowledgebaseUI.RemoveOrderZeros = function(_folderResourceId){

    removeKBContextMenu();

    if(!d(_folderResourceId))
        _folderResourceId = lzm_chatDisplay.selectedResource;

    if (!PermissionEngine.checkUserResourceWritePermissions(lzm_chatDisplay.myId, 'edit', DataEngine.cannedResources.getResource(lzm_chatDisplay.selectedResource)))
    {
        if(!(_folderResourceId == '1' && PermissionEngine.permissions.resources_write == '3'))
        {
            showNoPermissionMessage();
            return;
        }
    }

    var orderstart = 1;
    var ulist = [];
    var zerosfound = 0;

    var fList = DataEngine.cannedResources.GetResourceList();

    for (var i=0; i<fList.length; i++)
    {
        if(fList[i].pid == _folderResourceId && fList[i].di != 1)
        {
            if(!d(fList[i].ok) || fList[i].ok == '0')
                zerosfound++;

            fList[i].ok = orderstart++;
            ulist.push(fList[i]);
        }

        if(ulist.length > 20)
        {
            // stream pls
            CommunicationEngine.PollServerResource({List:lzm_commonTools.clone(ulist)}, "set");
            ulist = [];
        }
    }

    if(ulist.length)
        CommunicationEngine.PollServerResource({List:lzm_commonTools.clone(ulist)}, "set");
};

KnowledgebaseUI.SetOrderZeros = function(_folderResourceId){

    removeKBContextMenu();

    if(!d(_folderResourceId))
        _folderResourceId = lzm_chatDisplay.selectedResource;

    if (!PermissionEngine.checkUserResourceWritePermissions(lzm_chatDisplay.myId, 'edit', DataEngine.cannedResources.getResource(lzm_chatDisplay.selectedResource)))
    {
        if(!(_folderResourceId == '1' && PermissionEngine.permissions.resources_write == '3'))
        {
            showNoPermissionMessage();
            return;
        }
    }

    var ulist = [];
    for (var i=0; i<lzm_chatDisplay.resourcesDisplay.CacheResourceList.length; i++)
    {
        if(lzm_chatDisplay.resourcesDisplay.CacheResourceList[i].pid == _folderResourceId)
        {
            if(lzm_chatDisplay.resourcesDisplay.CacheResourceList[i].di == 1)
                continue;

            lzm_chatDisplay.resourcesDisplay.CacheResourceList[i].ok = '0';
            ulist.push(lzm_chatDisplay.resourcesDisplay.CacheResourceList[i]);

            if(ulist.length > 20)
            {
                // stream pls
                CommunicationEngine.PollServerResource({List:lzm_commonTools.clone(ulist)}, "set");
                ulist = [];
            }
        }
    }
    if(ulist.length)
        CommunicationEngine.PollServerResource({List:ulist}, "set");
};

KnowledgebaseUI.RunsInDialog = function(){
    return false;
    /*
    var winObj = TaskBarManager.GetActiveWindow();
    return (winObj != null);
    */
};

KnowledgebaseUI.UpdateSelection = function(){


};

KnowledgebaseUI.DownloadFile = function(){
    removeKBContextMenu();
    var resource = DataEngine.cannedResources.getResource(lzm_chatDisplay.selectedResource);
    openLink(KnowledgebaseUI.GetFileURL(resource));
};

KnowledgebaseUI.GetFileURL = function(_resource){
    var baseUrl = Server.GetURL();
    return baseUrl + 'getfile.php?file=' + _resource.ti + '&id=' + _resource.rid;
};

KnowledgebaseUI.ResourceIsFile = function(_resource){
    return $.inArray(_resource.ty, ['3', '4']) != -1
};

KnowledgebaseUI.GetAccessUrl = function(_resource){

    if(!KnowledgebaseUI.ResourceIsFile(_resource))
    {
        var thisServer = Server.GetURL();
        var add = '';
        var modrewrite = DataEngine.getConfigValue('gl_kbmr',false) === '1';

        if(modrewrite)
        {
            thisServer += 'knowledge-base/' + lzm_commonTools.htmlEntities(_resource.rid) + '/';
            add = '?';
        }
        else
        {
            thisServer += 'knowledgebase.php?article=' + lzm_commonTools.htmlEntities(_resource.rid);
            add = '&';
        }

        if(d(_resource.l) && _resource.l.length)
        {
            var iso = _resource.l.split(',')[0];
            thisServer += add + 'ptl=' + iso;
        }

        return thisServer;
    }
    else
        return KnowledgebaseUI.GetFileURL(_resource);
};

KnowledgebaseUI.GetRootUrl = function(){

    var thisServer = Server.GetURL();
    var modrewrite = DataEngine.getConfigValue('gl_kbmr',false) === '1';
    if(modrewrite)
    {
        thisServer += 'knowledge-base/';
    }
    else
    {
        thisServer += 'knowledgebase.php';
    }
    return thisServer;
};

KnowledgebaseUI.GetURL = function(_resource){
    if(KnowledgebaseUI.ResourceIsFile(_resource))
    {
        return KnowledgebaseUI.GetFileURL(_resource);
    }
    else if(_resource.ty>0)
    {
        return KnowledgebaseUI.GetAccessUrl(_resource);
    }
    return '';
};

KnowledgebaseUI.ShowKBAddMenu = function(e){
    KnowledgebaseUI.OpenKBContextMenu(e,'LIST','MENU');
    e.stopPropagation();
};

KnowledgebaseUI.OpenKBContextMenu = function(e, _context, resourceId){

    if(resourceId != 'MENU')
    {
        lzm_chatDisplay.selectedResource = resourceId;
        KnowledgebaseUI.HandleResourceClickEvents(resourceId, true, !IFManager.IsMobileOS, _context);
    }

    var resource = (resourceId != 'MENU') ? DataEngine.cannedResources.getResource(resourceId) : 'MENU';
    var scrolledDownY = (resourceId != 'MENU') ? $('#qrd-tree-body').scrollTop() : 15;
    var scrolledDownX = (resourceId != 'MENU') ? $('#qrd-tree-body').scrollLeft() : -15;
    var parentOffset = $('#qrd-tree-body').offset();
    var yValue = e.pageY - parentOffset.top;
    var xValue = e.pageX - parentOffset.left;

    if (resource != null && resource != 'MENU')
    {
        resource.chatPartner = _context;
        lzm_chatDisplay.showContextMenu('qrd-tree', resource, xValue + scrolledDownX, yValue + scrolledDownY);
        e.preventDefault();
    }
    else
    {
        var cm = {
            id: 'qrd-tree-context',
            entries: [
                {
                    label: tid('text'),
                    onClick: 'KnowledgebaseUI.ShowEntry(null,1);'
                },
                {
                    label: tid('link'),
                    onClick: 'KnowledgebaseUI.ShowEntry(null,2);'
                },
                {
                    label: tid('file'),
                    onClick: 'KnowledgebaseUI.ShowEntry(null,3);'
                },
                {
                    label: tid('resource_folder'),
                    onClick: 'KnowledgebaseUI.ShowEntry(null,0);'
                }
            ]
        };
        if(IFManager.IsDesktopApp() && d(IFManager.DeviceInterface.hasModule) && IFManager.DeviceInterface.hasModule('lz-screenshot-widget'))
        {
            cm.entries[4] = $.extend(true, {}, cm.entries[3]);
            cm.entries[3] = {
                label: tid('screenshot'),
                onClick: "IFManager.IFScreenCast(\'knowledgebase\', \'' + lzm_chatDisplay.selectedResource + '\');lzm_chatDisplay.RemoveAllContextMenus();",
            };
        }

        ContextMenuClass.BuildMenu(e, cm, 'add-qrd');
    }
};

KnowledgebaseUI.HandleResourceClickEvents = function(_resourceId, onlyOpenFolders, _rightClick, _context){

    removeKBContextMenu();

    onlyOpenFolders = (d(onlyOpenFolders)) ? onlyOpenFolders : false;
    _rightClick = d(_rightClick) ? _rightClick : false;

    var sid = (KnowledgebaseUI.RunsInDialog()) ? 'd-' : '';
    var resource = DataEngine.cannedResources.getResource(_resourceId);

    lzm_chatDisplay.resourcesDisplay.SetPreview(resource);
    lzm_chatDisplay.selectedResource = _resourceId;

    if (resource != null)
    {
        var parentFolder = DataEngine.cannedResources.getResource(resource.pid);
        var wasSelected = $('#'+sid+'resource-' + _resourceId).hasClass('selected-resource-div');

        $('.resource-div').removeClass('selected-resource-div');
        $('.qrd-search-line').removeClass('selected-table-line');
        $('.qrd-recently-line').removeClass('selected-table-line');
        $('.resource-open-mark').removeClass('resource-open-mark-selected');
        $('.resource-icon-and-text').removeClass('resource-icon-and-text-selected');

        $('#'+sid+'resource-' + _resourceId).addClass('selected-resource-div');

        $('#qrd-'+sid+'search-line-' + _resourceId).addClass('selected-table-line');
        $('#qrd-'+sid+'recently-line-' + _resourceId).addClass('selected-table-line');
        $('#'+sid+'resource-' + _resourceId + '-open-mark').addClass('resource-open-mark-selected');
        $('#'+sid+'resource-' + _resourceId + '-icon-and-text').addClass('resource-icon-and-text-selected');
        $('.qrd-change-buttons').addClass('ui-disabled');

        switch (parseInt(resource.ty))
        {
            case 0:
                if(!_rightClick)
                    KnowledgebaseUI.OpenOrCloseFolder(_resourceId, onlyOpenFolders, wasSelected, _context);
                if (_resourceId.length > '1' && PermissionEngine.checkUserPermissions('', 'resources', 'edit', resource)) {
                    $('#edit-qrd').removeClass('ui-disabled');
                    $('#show-qrd-settings').removeClass('ui-disabled');
                }

                if (lzm_chatDisplay.resourcesDisplay.SelectedResourceTab == 0 && PermissionEngine.checkUserPermissions('', 'resources', 'add', resource))
                    $('#add-qrd').removeClass('ui-disabled');

                if (_resourceId.length > '1' && PermissionEngine.checkUserPermissions('', 'resources', 'delete', resource)) {
                    $('#delete-qrd').removeClass('ui-disabled');
                }
                if (PermissionEngine.checkUserPermissions('', 'resources', 'add', resource)) {
                    $('#add-or-edit-qrd').removeClass('ui-disabled');
                }
                $('#add-qrd-attachment').addClass('ui-disabled');
                break;
            case 1:
                if (PermissionEngine.checkUserPermissions('', 'resources', 'edit', resource)) {
                    $('#edit-qrd').removeClass('ui-disabled');
                    $('#show-qrd-settings').removeClass('ui-disabled');
                }
                if (PermissionEngine.checkUserPermissions('', 'resources', 'delete', resource)) {
                    $('#delete-qrd').removeClass('ui-disabled');
                }
                $('#view-qrd').removeClass('ui-disabled');

                $('#'+sid+'send-qrd-preview').removeClass('ui-disabled');

                $('#insert-qrd-preview').removeClass('ui-disabled');
                if (PermissionEngine.checkUserPermissions('', 'resources', 'add', resource)) {
                    $('#add-or-edit-qrd').removeClass('ui-disabled');
                }
                if (lzm_chatDisplay.resourcesDisplay.SelectedResourceTab == 0 && parentFolder != null && PermissionEngine.checkUserPermissions('', 'resources', 'add', parentFolder))
                    $('#add-qrd').removeClass('ui-disabled');

                $('#add-qrd-attachment').addClass('ui-disabled');
                break;

            case 2:
                if (PermissionEngine.checkUserPermissions('', 'resources', 'edit', resource)) {
                    $('#edit-qrd').removeClass('ui-disabled');
                    $('#show-qrd-settings').removeClass('ui-disabled');
                }
                if (PermissionEngine.checkUserPermissions('', 'resources', 'delete', resource)) {
                    $('#delete-qrd').removeClass('ui-disabled');
                }
                $('#view-qrd').removeClass('ui-disabled');

                $('#'+sid+'send-qrd-preview').removeClass('ui-disabled');

                $('#insert-qrd-preview').removeClass('ui-disabled');

                if (lzm_chatDisplay.resourcesDisplay.SelectedResourceTab == 0 && parentFolder != null && PermissionEngine.checkUserPermissions('', 'resources', 'add', parentFolder))
                    $('#add-qrd').removeClass('ui-disabled');

                $('#add-qrd-attachment').addClass('ui-disabled');
                break;

            default:
                $('#edit-qrd').removeClass('ui-disabled');
                if (PermissionEngine.checkUserPermissions('', 'resources', 'edit', resource)) {
                    $('#show-qrd-settings').removeClass('ui-disabled');
                }
                if (PermissionEngine.checkUserPermissions('', 'resources', 'delete', resource)) {
                    $('#delete-qrd').removeClass('ui-disabled');
                }

                $('#'+sid+'send-qrd-preview').removeClass('ui-disabled');

                $('#insert-qrd-preview').removeClass('ui-disabled');

                if (lzm_chatDisplay.resourcesDisplay.SelectedResourceTab == 0 && parentFolder != null && PermissionEngine.checkUserPermissions('', 'resources', 'add', parentFolder))
                    $('#add-qrd').removeClass('ui-disabled');

                $('#add-qrd-attachment').removeClass('ui-disabled');
                break;
        }
    }

    if(KnowledgebaseUI.SelectionMode == 'TICKET_SAVE_AS' || KnowledgebaseUI.SelectionMode == 'CHAT_SAVE_AS')
    {
        KnowledgebaseUI.HighlightingTypes = ['0'];
        KnowledgebaseUI.Highlighting = true;
    }
    else if(KnowledgebaseUI.SelectionMode == 'TICKET_ADD_ATTACHMENT')
    {
        KnowledgebaseUI.HighlightingTypes = ['3','4'];
        KnowledgebaseUI.Highlighting = true;
    }
    else if(KnowledgebaseUI.SelectionMode == 'TICKET_LOAD_ELEMENT' || KnowledgebaseUI.SelectionMode == 'CHAT_LOAD_ELEMENT')
    {
        KnowledgebaseUI.HighlightingTypes = ['1','2','3','4'];
        KnowledgebaseUI.Highlighting = true;
    }

    KnowledgebaseUI.HighlightType();
};

KnowledgebaseUI.GetResourceStorageHash = function(_resId){
    return md5(_resId).substr(0,7);
};

KnowledgebaseUI.Synchronize = function(){

    KnowledgebaseUI.HandleResourceClickEvents('1');

    var resourceIdList = lzm_commonStorage.loadValue('kb_list_' + DataEngine.myId,'');
    if(resourceIdList != null)
    {
        try
        {
            resourceIdList = LocalConfiguration.ParseKnowledgeBaseShortList(resourceIdList);
            for(var key in resourceIdList)
            {
                lzm_commonStorage.deleteKeyValuePair('kb_i_' + DataEngine.myId + resourceIdList[key]);
            }
        }
        catch(ex)
        {
            deblog(resourceIdList);
            deblog(ex);
        }
    }

    lzm_commonStorage.deleteKeyValuePair('kb_dut_' + DataEngine.myId);
    lzm_commonStorage.deleteKeyValuePair('kb_list_' + DataEngine.myId);

    KnowledgebaseUI.CacheValid = false;
    KnowledgebaseUI.IsSyncing = true;

    DataEngine.resourceIdList = [];
    lzm_chatDisplay.resourcesDisplay.CacheResourceList = [];

    DataEngine.resourceLastEdited = 0;
    CommunicationEngine.qrdRequestTime = 1;
    DataEngine.cannedResources = new LzmResources();
    KnowledgebaseUI.CreateRootResource();

    lzm_chatDisplay.resourcesDisplay.UpdateKBInfo(0);
};

KnowledgebaseUI.RenderFolderArrow = function(_resourceId,_hasChildren){
    var sid = (KnowledgebaseUI.RunsInDialog()) ? 'd-' : '';
    var markDiv = $('#'+sid+'resource-' + _resourceId + '-open-mark');

    if(!d(_hasChildren))
    {
        var folderDiv = $('#'+sid+'folder-' + _resourceId);
        _hasChildren = (folderDiv.html() != '');
    }

    if(_hasChildren)
    {
        if ($.inArray(_resourceId, lzm_chatDisplay.resourcesDisplay.openedResourcesFolder) == -1)
            markDiv.html('<i class="fa fa-caret-right"></i>');
        else
            markDiv.html('<i class="fa fa-caret-down"></i>');
    }
    else
        markDiv.html('');
};

KnowledgebaseUI.OpenOrCloseFolder = function(resourceId, onlyOpenFolders, wasSelected, _context) {
    var sid = (KnowledgebaseUI.RunsInDialog()) ? 'd-' : '';
    var folderDiv = $('#'+sid+'folder-' + resourceId);

    KnowledgebaseUI.PopulateFolder(resourceId,sid,false,_context);

    if (folderDiv.html() != "")
    {
        var markDiv = $('#'+sid+'resource-' + resourceId + '-open-mark');
        if (folderDiv.css('display') == 'none')
        {
            folderDiv.css('display', 'block');
            markDiv.html('<i class="fa fa-caret-down"></i>');
            if ($.inArray(resourceId, lzm_chatDisplay.resourcesDisplay.openedResourcesFolder) == -1)
            {
                lzm_chatDisplay.resourcesDisplay.openedResourcesFolder.push(resourceId);
            }
        }
        else if (!onlyOpenFolders)
        {
            if(!wasSelected)
                return;

            folderDiv.css('display', 'none');
            markDiv.html('<i class="fa fa-caret-right"></i>');
            var tmpOpenedFolder = [];
            for (var i=0; i<lzm_chatDisplay.resourcesDisplay.openedResourcesFolder.length; i++) {
                if (resourceId != lzm_chatDisplay.resourcesDisplay.openedResourcesFolder[i]) {
                    tmpOpenedFolder.push(lzm_chatDisplay.resourcesDisplay.openedResourcesFolder[i]);
                }
            }
            lzm_chatDisplay.resourcesDisplay.openedResourcesFolder = tmpOpenedFolder;
        }
    }
};

KnowledgebaseUI.PopulateFolder = function(_resourceId,_sid,_onlyExpanded,_context){

    _onlyExpanded = d(_onlyExpanded) ? _onlyExpanded : false;

    if (_onlyExpanded && $.inArray(_resourceId, lzm_chatDisplay.resourcesDisplay.openedResourcesFolder) == -1)
        return;

    if(d(DataEngine.cannedResources.objects[_resourceId]))
    {
        var res,childNodes = KnowledgebaseUI.GetChildNodes(_resourceId);
        if(childNodes.length)
        {
            $('#'+_sid+'folder-' + _resourceId).html('');
            for(var key in childNodes)
            {
                res = childNodes[key];
                res.ra = lzm_chatDisplay.resourcesDisplay.CalculateRank(res,0);
                var resourceHtml = lzm_chatDisplay.resourcesDisplay.GetResourceHTML(res, _context, KnowledgebaseUI.RunsInDialog());
                $('#'+_sid+'folder-' + res.pid).append(resourceHtml);

                if ($.inArray(res.rid, lzm_chatDisplay.resourcesDisplay.openedResourcesFolder) != -1)
                {
                    KnowledgebaseUI.OpenOrCloseFolder(res.rid,true);
                }
            }
        }
    }

    KnowledgebaseUI.HighlightType();
};

KnowledgebaseUI.ReplaceTitle = function(_resource){
    _resource.ti = _resource.ti
        .replace(/%%_Files_%%/, tid('files'))
        .replace(/%%_External_%%/, tid('visitors'))
        .replace(/%%_Internal_%%/, tid('operators'));
    return _resource;
};

KnowledgebaseUI.GetChildNodes = function(_resourceId){

    var list=[],tlist = [];

    if(lzm_chatDisplay.resourcesDisplay.CacheResourceList != null)
        tlist = lzm_commonTools.GetElementByProperty(lzm_chatDisplay.resourcesDisplay.CacheResourceList,'pid',_resourceId);

    var parent = (_resourceId=='1') ? KnowledgebaseUI.GetRootResource() : lzm_commonTools.GetElementByProperty(lzm_chatDisplay.resourcesDisplay.CacheResourceList,'rid',_resourceId)[0];
    for (var i=0; i<tlist.length; i++) {

        var res = tlist[i];
        if (PermissionEngine.checkUserResourceReadPermission(lzm_chatDisplay.myId, res, parent))
            list.push(res);
    }
    return list;
};

KnowledgebaseUI.GetRootResource = function(){
    return {
        di: "0",
        ed: "0",
        eid: "0000000",
        oid: "0000000",
        pid: "0",
        ra: "0",
        rid: "1",
        si: "6",
        t: "",
        text: tid('knowledgebase'),
        ti: tid('knowledgebase'),
        ty: "0"
    };
};

KnowledgebaseUI.CreateRootResource = function(){
    DataEngine.cannedResources.setResource(KnowledgebaseUI.GetRootResource());
};

KnowledgebaseUI.AutoSearchChat = function(_instant){

    var i;

    if(KnowledgebaseUI.AutoSearchTimer != null)
        clearTimeout(KnowledgebaseUI.AutoSearchTimer);

    KnowledgebaseUI.AutoSearchTimer = setTimeout(function()
    {
        $('#chat-qrd-preview').html('');
        $('#chat-qrd-preview').css({display:'none'});

        var editorContents = $.trim(grabEditorContents('plaintext').replace(/<.*?>/g, ''));
        if (editorContents.length > 1 && editorContents.length < 20)
        {
            var matchingEntries = DataEngine.cannedResources.GetResourceList('usage_counter', {ty: '1,2,3,4', t: editorContents, text: editorContents, ti: editorContents, s: editorContents});

            if (matchingEntries.length > 0)
            {
                var listHTML = KnowledgebaseUI.CreateAutoSearchListHTML('chat',editorContents,matchingEntries);

                $('#chat-qrd-preview').html(listHTML);

                $('.auto-search-button').click(function(e){
                    e.stopPropagation();
                    var rid = $(this).data('rid');
                    var link = $(this).data('link');
                    if(!$(this).hasClass('ui-disabled') && d(link))
                        KnowledgebaseUI.UseAutoSearchResult('chat',rid,d(link));
                    else
                        KnowledgebaseUI.ShowEntry(rid);
                });

                if(listHTML.length)
                    $('#chat-qrd-preview').css({display:'block'});

                lzm_chatDisplay.RenderWindowLayout(true);

                setTimeout(function(){
                    chatScrollDown(1);
                },50);

                $('.editor-preview-inner').css({'max-width': ($('#chat-qrd-preview').width() - $('.editor-preview-shortcut').width() - 14)+'px'});

                for (i=0; i<KnowledgebaseUI.ShortCutResources.length; i++)
                {
                    var resource = DataEngine.cannedResources.getResource(KnowledgebaseUI.ShortCutResources[i].id);
                    KnowledgebaseUI.ShortCutResources[i].matchfull = (resource != null && '/' + resource.s == editorContents);

                    if(!KnowledgebaseUI.ShortCutResources[i].matchfull)
                        KnowledgebaseUI.ShortCutResources[i].matchstart = (resource != null && ('/' + resource.s).indexOf(editorContents) === 0);
                }
                KnowledgebaseUI.QuickSearchReady = true;
            }
            else
            {
                KnowledgebaseUI.ShortCutResources = [];
                KnowledgebaseUI.QuickSearchReady = true;
            }
        }
        else
        {
            KnowledgebaseUI.ShortCutResources = [];
            KnowledgebaseUI.QuickSearchReady = true;
        }

        UIRenderer.resizeChatView();

    },_instant ? 0 : 250);
};

KnowledgebaseUI.AutoSearchTicket = function(_instant,_tags){

    _tags = d(_tags) ? _tags : '';

    var key;

    if(KnowledgebaseUI.AutoSearchTimer != null)
        clearTimeout(KnowledgebaseUI.AutoSearchTimer);

    KnowledgebaseUI.AutoSearchTimer = setTimeout(function()
    {
        if (LocalConfiguration.KBAutoSearch && (ChatTicketClass.ComposerAutoSearchWord.length > 1 || _tags.length) && lzm_chatDisplay.windowWidth > 900)
        {
            var frequentlyUsedResources = [],prefLang = '';
            if(ChatTicketClass.LastActiveTicket != null)
                prefLang = ChatTicketClass.LastActiveTicket.l.toLowerCase();

            if(d(_tags) && _tags.length)
            {
                ChatTicketClass.ComposerAutoSearchWord = '';
                var tags = _tags.split(',');
                for(key in tags)
                {
                    frequentlyUsedResources = frequentlyUsedResources.concat(DataEngine.cannedResources.GetResourceList('usage_counter', {ty: '1,2,3,4', t: tags[key]}));
                }
            }
            else
                frequentlyUsedResources = DataEngine.cannedResources.GetResourceList('usage_counter', {ty: '1,2,3,4', t: ChatTicketClass.ComposerAutoSearchWord, text: ChatTicketClass.ComposerAutoSearchWord, ti: ChatTicketClass.ComposerAutoSearchWord, s: ChatTicketClass.ComposerAutoSearchWord});


            var langmatch = [];
            var langfail = [];

            for(key in frequentlyUsedResources)
            {
                if(frequentlyUsedResources[key].l.toLowerCase().indexOf(prefLang) !== -1)
                    langmatch.push(frequentlyUsedResources[key]);
                else
                    langfail.push(frequentlyUsedResources[key]);
            }

            $.merge(langmatch,langfail);

            frequentlyUsedResources = langmatch;

            var listHTML = KnowledgebaseUI.CreateAutoSearchListHTML('ticket',ChatTicketClass.ComposerAutoSearchWord,frequentlyUsedResources);

            if(listHTML.length)
                $('#ticket-kb-auto-search').html(listHTML);

            if(listHTML.length)
                $('#ticket-kb-auto-search').css({display:'block'}).addClass('lzm-tab-scroll-content');

            $('.auto-search-button').click(function(e){

                e.stopPropagation();
                var rid = $(this).data('rid');
                var link = $(this).data('link');
                if(!$(this).hasClass('ui-disabled') && d(link))
                    KnowledgebaseUI.UseAutoSearchResult('ticket',rid,d(link));
                else
                {
                    TaskBarManager.ReturnToActiveWindowOnNextClose();
                    KnowledgebaseUI.ShowEntry(rid);
                }
            });
            $('.editor-preview-inner').css({'max-width': ($('#chat-qrd-preview').width() - $('.editor-preview-shortcut').width() - 14)+'px'});
        }

        UIRenderer.resizeTicketReply();

    },_instant ? 0 : 500);
};

KnowledgebaseUI.CreateAutoSearchListHTML = function(_target,_editorContents,_frequentlyUsedResources){

    var i,row,title,shortcut,maxIterate = Math.min(100, _frequentlyUsedResources.length), resultTableHTML = '',resultRowHTML = '',resultPrioRowHTML = '';

    for (i=0; i<maxIterate; i++)
    {
        var resourceText = /*lzm_commonTools.htmlEntities*/(_frequentlyUsedResources[i].text.replace(/<.*?>/g, ''));

        if(!$.trim(resourceText).length)
            continue;

        if(!PermissionEngine.checkUserResourceReadPermission(lzm_chatDisplay.myId,_frequentlyUsedResources[i],DataEngine.cannedResources.getResource(_frequentlyUsedResources[i].pid)))
            continue;

        if(_editorContents.indexOf('/') === 0 && !(d(_frequentlyUsedResources[i].s) && _frequentlyUsedResources[i].s.length))
            continue;

        if(_frequentlyUsedResources[i].ty >= KnowledgebaseUI.TypeFile)
            resourceText = '<b>' + lzm_commonTools.htmlEntities(_frequentlyUsedResources[i].ti.replace(/<.*?>/g, '')) + '</b>';
        else if(_frequentlyUsedResources[i].ty < KnowledgebaseUI.TypeFile)
        {
            resourceText = '<span>'+lzm_commonTools.HighlightSearchKey(resourceText, _editorContents, true)+'</span>';
            if(_frequentlyUsedResources[i].ti.length)
            {
                title = lzm_commonTools.htmlEntities(lzm_commonTools.SubStr(_frequentlyUsedResources[i].ti,300,true));
                resourceText = '<b>'+lzm_commonTools.HighlightSearchKey(title,_editorContents,true)+'</b><br>' + resourceText;
            }
        }

        var path = KnowledgebaseUI.GetPath(_frequentlyUsedResources[i]);
        if(path.length)
            resourceText += '<br><span class="path">'+path+'</span>';

        if(d(_frequentlyUsedResources[i].s))
        {
            shortcut = (_frequentlyUsedResources[i].s.length) ? '<span class="editor-preview-shortcut" id="editor-preview-shortcut-' + _frequentlyUsedResources[i].rid +'">/' + _frequentlyUsedResources[i].s + '</span>' : '';
            resourceText = '<td class="editor-preview-cell"><div class="editor-preview-inner">' + shortcut + resourceText + '</div></td>';

            if (_editorContents.indexOf('/') == 0 && ('/' + _frequentlyUsedResources[i].s.toLowerCase()).indexOf(_editorContents.toLowerCase()) === 0)
                KnowledgebaseUI.ShortCutResources.push({id: _frequentlyUsedResources[i].rid, matchfull: false, matchstart: false});
        }

        // buttons
        var linkcss = (KnowledgebaseUI.GetAccessUrl(_frequentlyUsedResources[i])=='' || _frequentlyUsedResources[i].p == '0') ? ' ui-disabled' : '';
        var iconcss = (KnowledgebaseUI.GetAccessUrl(_frequentlyUsedResources[i])=='' || _frequentlyUsedResources[i].p == '0') ? ' icon-light' : ' icon-blue lzm-clickable2';

        resourceText += '<td class="auto-search-buttons">';
        resourceText += '<div class="auto-search-button" title="'+tid('edit')+'" data-rid="'+_frequentlyUsedResources[i].rid + '" id="kb-auto-send-text-'+_frequentlyUsedResources[i].rid + '"><i class="fa fa-pencil icon-large icon-blue lzm-clickable2"></i></div>';
        resourceText += '<div class="auto-search-button'+linkcss+'" title="'+tid('link')+'" data-link="true" data-rid="'+_frequentlyUsedResources[i].rid + '" id="kb-auto-send-link-'+_frequentlyUsedResources[i].rid + '"><i class="fa fa-link icon-large'+iconcss+'"></i></div>';
        resourceText += '</td>';

        row = '<tr class="lzm-unselectable" style="cursor: pointer;" onclick="KnowledgebaseUI.UseAutoSearchResult(\''+_target+'\',\'' + _frequentlyUsedResources[i].rid + '\');">' + resourceText + '</tr>';

        if(d(_frequentlyUsedResources[i].s) && _frequentlyUsedResources[i].s.toLowerCase().indexOf(_editorContents.toLowerCase()) != -1)
            resultPrioRowHTML += row;
        else
            resultRowHTML += row;
    }

    if(resultPrioRowHTML.length || resultRowHTML.length)
    {
        resultTableHTML += '<table>';
        resultTableHTML += resultPrioRowHTML;
        resultTableHTML += resultRowHTML;
        resultTableHTML += '</table>';
    }
    return resultTableHTML;
};

KnowledgebaseUI.UseAutoSearchResult = function(_target, _resourceId, _link) {

    _link = (d(_link)) ? _link : false;
    var linkHtml,resource = DataEngine.cannedResources.getResource(_resourceId), resourceHtmlText;
    if (resource != null)
    {
        UserActions.messageFromKnowledgebase = true;

        if(_link)
        {
            if(_target == 'ticket')
            {
                resourceHtmlText = KnowledgebaseUI.PrepareResourceForTicket(resource,true);
            }
            else
                resourceHtmlText = '<a href="' + KnowledgebaseUI.GetURL(resource) + '" class="lz_chat_link" target="_blank">' + resource.ti + '</a>';
        }
        else
            switch (resource.ty)
            {
                case '1':
                    resourceHtmlText = (_target == 'ticket') ? KnowledgebaseUI.PrepareResourceForTicket(resource) : resource.text;
                    break;
                case '2':
                    linkHtml = '<a href="' + resource.text + '" class="lz_chat_link" target="_blank">' + resource.ti + '</a>';
                    resourceHtmlText = (_target == 'ticket') ? KnowledgebaseUI.PrepareResourceForTicket(resource) : linkHtml;
                    break;
                default:
                    resourceHtmlText = KnowledgebaseUI.PrepareResourceForTicket(resource);
                    break;
            }

        if(_target == 'chat')
        {
            setEditorContents(resourceHtmlText);
            setFocusToEditor();
            KnowledgebaseUI.ShortCutResources = [];
            $('#chat-qrd-preview').css({display:'none'});
            chatInputTyping();
        }
        else if(_target == 'ticket')
        {
            ChatTicketClass.TextEditor.replaceSelectedText(ChatTicketClass.ComposerAutoSearchWord,resourceHtmlText);
            ChatTicketClass.ComposerAutoSearchWord = '';
            ChatTicketClass.ComposerLastCursorPosition = 0;
            KnowledgebaseUI.AutoSearchTicket(true);
        }
    }

    UIRenderer.resizeChatView();
};

KnowledgebaseUI.InsertIntoTicket = function(){

    var resource = DataEngine.cannedResources.getResource(lzm_chatDisplay.selectedResource);
    if (resource != null)
    {
        DataEngine.cannedResources.riseUsageCounter(lzm_chatDisplay.selectedResource);

        var replyText = KnowledgebaseUI.PrepareResourceForTicket(resource);

        var html = $('#ticket-reply-input').val();
        html = html.replace(ChatTicketClass.InsertPlaceholder,replyText);

        ChatTicketClass.InsertPlaceholder = '';
        ChatTicketClass.TextEditor.setHtml(html);
        $('#ticket-reply-input').val(html);
        ChatTicketClass.TextEditor.scrollDown();

        $('#ticket-reply-input-resource').val(resource.rid);

        $(ChatTicketClass.TextEditor.getBody()).change();

        if (resource.ty.toString() == '1' && (!resource.p || resource.p=='0'))
            $('#ticket-reply-input-save').removeClass('ui-disabled');
        else
            $('#ticket-reply-input-save').addClass('ui-disabled');
    }
};

KnowledgebaseUI.AddTicketAttachment = function(){

    var resource = DataEngine.cannedResources.getResource(lzm_chatDisplay.selectedResource);
    if (resource != null)
    {
        if(KnowledgebaseUI.ResourceIsFile(resource))
        {
            DataEngine.cannedResources.riseUsageCounter(lzm_chatDisplay.selectedResource);
            var resources1 = $('#reply-placeholder-content-1').data('selected-resources');
            var resources2 = $('#ticket-message-placeholder-content-1').data('selected-resources');
            var resources = (typeof resources1 != 'undefined') ? resources1 : (typeof resources2 != 'undefined') ? resources2 : [];
            resources.push(resource);
            $('#reply-placeholder-content-1').data('selected-resources', resources);
            $('#ticket-message-placeholder-content-1').data('selected-resources', resources);
            lzm_chatDisplay.ticketDisplay.updateAttachmentList();
            return true;
        }
        else
        {
            showMessage("Resource is not a file.");
        }
    }
    return false;
};

KnowledgebaseUI.PrepareResourceForTicket = function(_resource,_linkExternal){

    // _linkExternal = open public text resource on kb page

    var replyText = '';
    var htmlAllowed = ChatTicketClass.GetReplyFormat(ChatTicketClass.LastActiveTicket) == 'HTML';



    if(_linkExternal)
    {
        if(htmlAllowed)
            return '<a href="' + KnowledgebaseUI.GetURL(_resource) + '" class="lz_chat_link" target="_blank">' + _resource.ti + '</a>';
        else
            return _resource.ti + ':<br><br>' + KnowledgebaseUI.GetURL(_resource);
    }

    switch(_resource.ty.toString())
    {
        case '1':
            replyText += _resource.text;
            break;
        case '2':
            replyText += (!htmlAllowed) ? _resource.ti + ':<br><br>' + _resource.text : '<a href="' + _resource.text + '" class="lz_chat_link" target="_blank">' + _resource.ti + '</a>';
            break;
        default:

        var urlFileName = encodeURIComponent(_resource.ti.replace(/ /g, '+').replace(/<.*?>/g, ''));
        var fileId = _resource.text.split('_')[1];
        var thisServer = CommunicationEngine.chosenProfile.server_protocol + CommunicationEngine.chosenProfile.server_url;
        var thisFileUrl = thisServer + '/getfile.php?file=' + urlFileName + '&id=' + fileId;
        var fileHtml = '<a href="' + thisFileUrl + '" class="lz_chat_file" target="_blank">' + _resource.ti.replace(/<.*?>/g, '') + '</a>';

        if(htmlAllowed)
        {
            replyText = fileHtml;
        }
        else
        {
            replyText = thisFileUrl
        }
    }
    return replyText;
};

KnowledgebaseUI.InsertIntoChat = function(){
    if(TaskBarManager.GetActiveWindow() != null)
    {
        //TaskBarManager.GetActiveWindow().Tag;
        //ChatManager.SaveEditorInput();
        //removeEditor();
        KnowledgebaseUI.InitSelectionMode(TaskBarManager.GetActiveWindow(),'CHAT_LOAD_ELEMENT');
    }
};

KnowledgebaseUI.AddToChat = function(kbType) {
    var dialogId = 'add-qrd-to-chat-' + md5(Math.random().toString());
    KnowledgebaseUI.ShowEntry(null, kbType, null, {type: kbType, dialog_id: dialogId, chat_partner: ChatManager.ActiveChat, cp_name: ''});
};

KnowledgebaseUI.AddToTicket = function(_kbType,_dialogId){
    KnowledgebaseUI.ShowEntry(null, _kbType, _dialogId);
};

KnowledgebaseUI.GetPath = function(_entry){

    var __addString = function(parent,path){
        if(d(parent) && parent != null && parent.rid != '1')
            return parent.ti + ' / ' + path;
        else
            return path;
    };
    var path = '';
    if(_entry != null && d(_entry.pid))
    {
        var parent = DataEngine.cannedResources.objects[_entry.pid];
        path = __addString(parent,path);
        while(d(parent) && parent.rid != '1')
        {
            parent = DataEngine.cannedResources.objects[parent.pid];
            path = __addString(parent,path);
        }
    }
    return path;
};

KnowledgebaseUI.GetEmptyEntry = function(_type){
    return {
        ty:_type,//type

        //allowBotAccess:'0',allow bot access depr
        ba:'0',// bot access

        //isPublic:'0',public resource depr
        p:'0',//public resource

        di:'0',
        c:'0',//created
        ed:'0',//edited
        eid:'',//editorid

        //fullTextSearch:'0'//deprecated
        f:'0', // fulltext search

        g :'',
        iw :'1',

        //languages:''//deprecated
        l:'',//languages

        md5:'',//hash!?
        oid:'',//ownerid

        pid:'1',//parentid
        ra:'1',//rank?
        rid:lzm_commonTools.guid(),//id
        rlta:'',

        //shortcutWord:''//deprecated
        s:'',//shortcut text

        si:'22',
        t:'',//tags
        text:'',//value
        ti:''//title
    };
};

KnowledgebaseUI.EditEntry = function(){
    KnowledgebaseUI.ShowEntry(lzm_chatDisplay.selectedResource);
};

KnowledgebaseUI.ShowEntry = function(_entryId, _entryType, _ticketReplyWindowId, _sendToChat, _ticketComposeWindow, _html){

    removeKBContextMenu();

    if(IFManager.IsAppFrame && IFManager.IsMobileOS && _entryType >= KnowledgebaseUI.TypeFile)
    {
        showNotMobileMessage();
        return;
    }

    _entryType = d(_entryType) ? _entryType : KnowledgebaseUI.TypeText;
    _sendToChat = (d(_sendToChat) && _sendToChat) ? _sendToChat : null;
    _ticketReplyWindowId = d(_ticketReplyWindowId) ? _ticketReplyWindowId : null;
    _ticketComposeWindow = d(_ticketComposeWindow) ? _ticketComposeWindow : null;
    _html = d(_html) ? _html : null;

    var isNew = !(d(_entryId) && _entryId != null);
    var kbEntryObject = KnowledgebaseUI.GetEmptyEntry(_entryType);

    if(!isNew && d(DataEngine.cannedResources.objects[_entryId]))
        kbEntryObject = DataEngine.cannedResources.objects[_entryId];
    else if(_sendToChat == null && _ticketComposeWindow == null)
        __SetSelectedParent();
    else if(_sendToChat != null)
        kbEntryObject.pid = '';
    else if(_ticketReplyWindowId != null)
        kbEntryObject.pid = '101';

    _entryId = !isNew ? _entryId : kbEntryObject.rid;

    var headerString,footerString='',bodyString='';

    if (_ticketReplyWindowId != null)
        headerString = tid('add_attachment');
    else if(_sendToChat != null)
        headerString = (_sendToChat.type == 'link') ? tid('send_url') : tid('send_file');
    else if(isNew)
        headerString = (kbEntryObject.ty < KnowledgebaseUI.TypeFile) ? tid('resource_add_new') : tid('new_file_resource');
    else
    {
        headerString = tid('edit');
        if(kbEntryObject.ti.length)
            headerString += ' (' + lzm_commonTools.SubStr(kbEntryObject.ti,10,true)+ ')';
    }

    footerString += lzm_inputControls.createButton('kb-entry-save', '', '', tid('ok'), '', 'lr', {'margin-left': '4px'}, '',30,'d');
    footerString += lzm_inputControls.createButton('kb-entry-cancel', '', '', tid('cancel'), '', 'lr', {'margin-left': '4px'}, '',30,'d');

    bodyString += '<div id="kb-entry-placeholder"></div>';

    var tabArray = [];
    if(kbEntryObject.ty < KnowledgebaseUI.TypeFile)
        tabArray.push({name: tid('entry'), content: '<div class="lzm-tab-scroll-content">' + __GetEntryContent() + '</div>'});
    else if(isNew)
        tabArray.push({name: tid('file'), content: '<div class="lzm-tab-scroll-content">' +__GetEntryContent() + '</div>'});

    if(kbEntryObject.ty < KnowledgebaseUI.TypeFile || !isNew)
    {
        tabArray.push({name: tid('settings'), content: '<div class="lzm-tab-scroll-content">' +__GetSettingsContent() + '</div>'});
        tabArray.push({name: tid('tags'), content: '<div class="lzm-tab-scroll-content">' +__GetTagsContent() + '</div>'});
    }

    if(_sendToChat == null)
    {
        tabArray.push({name: tid('languages'), content: '<div class="lzm-tab-scroll-content">' +__GetLanguageContent() + '</div>'});
        tabArray.push({name: tid('related'), content: '<div class="lzm-tab-scroll-content">' +__GetRelatedContent() + '</div>'});
    }

    var wdId = 'show-kb-entry-'+md5(_entryId);

    if(TaskBarManager.WindowExists(wdId))
    {
        TaskBarManager.Maximize(wdId);
        return;
    }

    if(!__ValidatePermission())
    {
        if(_ticketComposeWindow != null)
            __UpdateTicketComposer(false);
        return;
    }

    // change 7089 paste
    if(_ticketComposeWindow != null)
    {
        if(isNew)
            __SetSelectedParent();
        kbEntryObject.text = _ticketComposeWindow.text;
    }

    if(_html != null)
        kbEntryObject.text = _html;

    lzm_commonDialog.CreateDialogWindow(headerString, bodyString, footerString, 'database', wdId, wdId, 'kb-entry-cancel');
    TaskBarManager.GetWindow(wdId).Tag = lzm_commonTools.clone(kbEntryObject);

    lzm_inputControls.createTabControl('kb-entry-placeholder', tabArray, 0, lzm_chatDisplay.windowWidth);

    if(kbEntryObject.ty < KnowledgebaseUI.TypeFile)
    {
        KnowledgebaseUI.TextEditor = new ChatEditorClass('show-kb-entry-text', '');
        KnowledgebaseUI.TextEditor.init(kbEntryObject.text, 'show-kb-entry','',true);
    }

    $('#qrd-knb-shortcuts-sc').attr('readonly', 'readonly').css({'border-color':'#3399ff',background:'#3399ff',color:'#fff','border-radius': '2px 0 0 2px',height: '40px','margin-right': '-1px'});
    $('#qrd-knb-date-edited-value, #qrd-knb-date-created-value').attr('readonly', 'readonly');

    $('#kb-entry-save').click(function(){

        if(kbEntryObject.ty < KnowledgebaseUI.TypeFile || !isNew)
        {
            var id = $('#qrd-knb-id-text').val();

            var alertMessage = '';
            if(id.length < 9 || id.indexOf(' ') != -1 || !lzm_commonTools.IsIDSafe(id))
                alertMessage = tid('invalid_id');

            if(alertMessage.length > 0)
            {
                lzm_commonDialog.createAlertDialog(alertMessage, [{id: 'ok', name: t('Ok')}]);
                $('#alert-btn-ok').click(function() {
                    lzm_commonDialog.removeAlertDialog();
                });
                return true;
            }
            else
            {
                if(kbEntryObject.ty < KnowledgebaseUI.TypeFile)
                    kbEntryObject.ti = $('#show-kb-entry-title').val();
                if(kbEntryObject.ty == KnowledgebaseUI.TypeText || kbEntryObject.ty == KnowledgebaseUI.TypeFolder)
                    kbEntryObject.text = KnowledgebaseUI.TextEditor.grabHtml();
                else if(kbEntryObject.ty == KnowledgebaseUI.TypeURL)
                    kbEntryObject.text = $('#show-kb-url').val();

                kbEntryObject.t = window[kbEntryObject.rid+'-tag-editor'].GetListString(true);
                kbEntryObject.rlta = window[kbEntryObject.rid+'-related-editor'].GetListString(false);

                kbEntryObject.new_id = id;
                kbEntryObject.p = $('#qrd-knb-pub-entry').prop('checked') ? '1' : '0';
                kbEntryObject.ba = $('#qrd-knb-pub-bot').prop('checked') ? '1' : '0';
                kbEntryObject.f = $('#qrd-knb-search-full').prop('checked') ? '1' : '0';
                kbEntryObject.iw = $('#qrd-knb-inwidget').prop('checked') ? '1' : '0';
                kbEntryObject.s = $('#qrd-knb-shortcuts-text').val();

                kbEntryObject.l = ChatTranslationEditorClass.NameToIso(window[kbEntryObject.rid+'-language-editor'].GetListString(true),true);
                kbEntryObject.oid = $('#qrd-knb-owner-op-id-fs').val();
                kbEntryObject.g = (kbEntryObject.ty == 0) ? $('#qrd-knb-owner-gr-id-fs').val() : '';

                if(isNew)
                {
                    var parentSortType = KnowledgebaseUI.GetSortingType(kbEntryObject.pid);
                    if(parentSortType == 'MANUAL')
                    {
                        kbEntryObject.ok = KnowledgebaseUI.GetChildNodes(kbEntryObject.pid).length+1;
                    }
                }

                CommunicationEngine.PollServerResource({First:kbEntryObject}, "set");

                $('#resource-' + kbEntryObject.rid + '-icon-and-text').html(lzm_chatDisplay.resourcesDisplay.GetResourceIconHTML(kbEntryObject) + '<span class="qrd-title-span">'+lzm_commonTools.htmlEntities(kbEntryObject.ti)+'</span>');
            }


            TaskBarManager.RemoveActiveWindow();

            if(_ticketComposeWindow != null)
                __UpdateTicketComposer(true);

            if(CommonInputControlsClass.SearchBox.IsActiveSearch())
            {
                CommonInputControlsClass.SearchBox.Search();
            }
        }
        else
        {
            if (_sendToChat == null)
            {
                var pid = (_ticketReplyWindowId == null) ? kbEntryObject.pid : 110;
                uploadFile('user_file', pid, null, _ticketReplyWindowId, null);
            }
            else
            {
                uploadFile('user_file', null, null, null, _sendToChat, wdId);
            }
        }

    });
    $('#kb-entry-cancel').click(function(){

        TaskBarManager.RemoveActiveWindow();
        if (_sendToChat != null)
        {
            var winObj = TaskBarManager.GetWindowByTag(_sendToChat.chat_partner);
            if(winObj != null)
                winObj.Maximize();
        }

        if(_ticketComposeWindow != null)
            __UpdateTicketComposer(false);
        else if(_ticketReplyWindowId != null)
            __ContinueTicketReply();
    });
    $('#qrd-knb-id-text').change(function(){
        $('#qrd-knb-id-text').val(lzm_commonTools.SubStr($('#qrd-knb-id-text').val(),256,false));
    });

    function __ValidatePermission(){

        if(_ticketReplyWindowId == null && _ticketReplyWindowId == null)
        {
            var parentFolder = DataEngine.cannedResources.getResource(kbEntryObject.pid);
            if(parentFolder != null)
            {
                if(isNew && !PermissionEngine.checkUserPermissions('', 'resources', 'add', parentFolder))
                {
                    showNoPermissionMessage();
                    return false;
                }

                if(!isNew && !PermissionEngine.checkUserPermissions('', 'resources', 'edit', kbEntryObject))
                {
                    showNoPermissionMessage();
                    return false;
                }
            }
        }
        return true;
    }
    function __GetEntryContent(){

        var html = '<div id="show-kb-entry"';

        if(_sendToChat == null && kbEntryObject.ty != KnowledgebaseUI.TypeFile)
            html += ' class="lzm-fieldset"';

        html += '><div id="show-kb-entry-inner">';

        var isVisible = (kbEntryObject.ty == KnowledgebaseUI.TypeText || kbEntryObject.ty == KnowledgebaseUI.TypeURL || kbEntryObject.ty == KnowledgebaseUI.TypeFolder) ? 'block' : 'none';
        html += '<div style="display:' + isVisible + ';" id="show-kb-entry-title-div" class="top-space-half">' + lzm_inputControls.createInput('show-kb-entry-title', 'resource-input-new', lzm_commonTools.htmlEntities(kbEntryObject.ti), tidc('title'), '', 'text', '') + '</div>';

        isVisible = (kbEntryObject.ty == KnowledgebaseUI.TypeText || kbEntryObject.ty == KnowledgebaseUI.TypeFolder) ? 'block' : 'none';
        html += '<div style="display:' + isVisible + ';" id="show-kb-entry-div" class="show-kb-resource show-kb-html-resource"><div class="top-space"><label for="show-kb-entry-text">' + tidc('text') + '</label></div><div id="show-kb-entry-text-inner">';
        html += '<div style="display:' + isVisible + ';" id="show-kb-entry-controls">' + lzm_inputControls.CreateInputControlPanel('basic','',true).replace(/lzm_chatInputEditor/g,'KnowledgebaseUI.TextEditor') + '</div>';
        html += '<div style="display:' + isVisible + ';" id="show-kb-entry-body"><textarea id="show-kb-entry-text"></textarea></div></div></div>';

        isVisible = (kbEntryObject.ty == KnowledgebaseUI.TypeURL) ? 'block' : 'none';
        html += '<div style="display:' + isVisible + ';" id="show-kb-url-div" class="top-space show-kb-link-resource show-kb-resource">' + lzm_inputControls.createInput('show-kb-url', 'resource-input-url-new', lzm_commonTools.htmlEntities(kbEntryObject.text), tidc('url'), '', 'text', '') + '</div>';

        isVisible = (kbEntryObject.ty >= KnowledgebaseUI.TypeFile) ? 'block' : 'none';
        html += '<div style="display:' + isVisible + ';" id="show-kb-file-div" class="show-kb-file-resource show-kb-resource">';
        html += '<label class="file-upload-label file-drop-zone">';
        html += '<i id="file-upload-icon" class="fa fa-cloud-upload icon-xxxl icon-light lzm-clickable"></i>';
        html += lzm_inputControls.createInput('file-upload-input', 'resource-input-new', '', '', '', 'file', '');
        html += '<span></span>';
        html += '<div id="file-upload-progress" style="display: none;"><span id="file-upload-numeric" class="text-xxl text-green">0%</span></div>';
        html += '<div id="file-upload-name" class="text-bold text-xl"></div>';
        html += '<div id="file-upload-size"></div>';
        html += '<div id="file-upload-type"></div>';
        html += '<div id="file-upload-error" class="text-orange text-bold"></div>';
        html += '<div id="cancel-file-upload-div" style="display:none;"><br><br>';
        html += lzm_inputControls.createButton('cancel-file-upload','', 'cancelFileUpload(event)', tid('cancel'), '', 'lr',{padding:'5px 10px;','display': 'none'},'',30,'d') + '</div>';
        html += '</label>';
        html += '<div id="file-drop-box" class="file-drop-zone"></div></div></div></div>';
        return html;
    }
    function __GetSettingsContent(){

        // owner operator
        var i,ownerOPArray = [], ownerGRArray = [];
        var operators = DataEngine.operators.getOperatorList('name','',true,false);
        var parent = DataEngine.cannedResources.getResource(kbEntryObject.pid);

        for (i=0; i<operators.length; i++)
        {
            ownerOPArray.push({value: operators[i].id, text: operators[i].name});

            if(kbEntryObject.oid == '' && operators[i].id == lzm_chatDisplay.myId)
                kbEntryObject.oid = lzm_chatDisplay.myId;
        }

        ownerGRArray.push({value: '', text: '-'});
        var groups = DataEngine.groups.getGroupList('id',true,false);
        for (i=0; i<groups.length; i++)
            ownerGRArray.push({value: groups[i].id, text: groups[i].id});

        var html = '<fieldset class="lzm-fieldset" id="qrd-knb-id"><legend>' + tid('entry') + '</legend>';


        html += '<table class="tight"><tr><td style="width:90px;">';
        html += lzm_inputControls.createInput('qrd-knb-id-title', 'table-input-key ui-disabled', 'Id:', '', '', 'text', '');
        html += '</td><td>';
        html += lzm_inputControls.createInput('qrd-knb-id-text', 'table-input-value', lzm_commonTools.htmlEntities(kbEntryObject.rid), '', '', 'text', '');
        html += '</td></tr></table>';

        if(d(kbEntryObject.c) && kbEntryObject.c > 0)
        {
            html += '<table class="tight"><tr><td style="width:90px;">';
            html += lzm_inputControls.createInput('qrd-knb-date-created-title', 'table-input-key ui-disabled', tidc('created'), '', '', 'text', '');
            html += '</td><td>';
            html += lzm_inputControls.createInput('qrd-knb-date-created-value', 'table-input-value', lzm_commonTools.getHumanDate(lzm_chatTimeStamp.getLocalTimeObject(parseInt(kbEntryObject.c * 1000), true)), '', '', 'text', '');
            html += '</td></tr></table>';
        }

        if(d(kbEntryObject.ed) && kbEntryObject.ed > 0)
        {
            html += '<table class="tight"><tr><td style="width:90px;">';
            html += lzm_inputControls.createInput('qrd-knb-date-edited-title', 'table-input-key ui-disabled', tidc('edited'), '', '', 'text', '');
            html += '</td><td>';
            html += lzm_inputControls.createInput('qrd-knb-date-edited-value', 'table-input-value', lzm_commonTools.getHumanDate(lzm_chatTimeStamp.getLocalTimeObject(parseInt(kbEntryObject.ed * 1000), true)), '', '', 'text', '');
            html += '</td></tr></table>';
        }

        html += '</fieldset>';
        html += '<fieldset class="lzm-fieldset" id="qrd-knb-owner-fs"><legend>' + tid('owner') + '</legend>';
        html += '<label for="qrd-knb-owner-op-id-fs">' + tidc('operator') + '</label>';
        html+= lzm_inputControls.createSelect("qrd-knb-owner-op-id-fs", 'bottom-space', '', '', {}, {}, tidc('operator'), ownerOPArray, kbEntryObject.oid, '');

        if(kbEntryObject.ty == 0)
        {
            var groupDisabeld = (PermissionEngine.permissions.resources_write < 3) ? 'ui-disabled' : '';
            html += '<label for="qrd-knb-owner-gr-id-fs">' + tidc('group') + '</label>';
            html += lzm_inputControls.createSelect("qrd-knb-owner-gr-id-fs", groupDisabeld, '', '', {}, {}, tid('group2'), ownerGRArray, kbEntryObject.g, '');
        }

        var pnp = (parent != null && parent.p != '1' && parent.rid != '1' && kbEntryObject.ty != 0) ? '&nbsp;&nbsp;<span class="bg-red text-white text-box">' + tid('parent not public') + '</span>' : '';

        html += '</fieldset>';
        html += '<fieldset class="lzm-fieldset" id="qrd-knb-pub-acc-fs"><legend>' + tid('public_access') + '</legend>';

        html += '<div><input type="checkbox" class="checkbox-custom" id="qrd-knb-pub-entry"' + (kbEntryObject.p==1 ? ' checked="checked"' : '');
        html += ' /><label for="qrd-knb-pub-entry" class="checkbox-custom-label">' + tid('public_knb') + pnp + '</label></div>';

        html += '<div class="top-space"><input type="checkbox" class="checkbox-custom" id="qrd-knb-inwidget"' + (kbEntryObject.iw==='0' ? '' : 'checked="checked"');
        html += ' /><label for="qrd-knb-inwidget" class="checkbox-custom-label">' + tid('in_widget') + pnp + '</label></div>';

        var botsDisabled = (kbEntryObject.ty == 0) ? 'ui-disabled ' : '';
        html += '<div class="' + botsDisabled + 'top-space"><input type="checkbox" class="checkbox-custom" id="qrd-knb-pub-bot"' + (kbEntryObject.ba==1 ? ' checked="checked"' : '');
        html += ' /><label for="qrd-knb-pub-bot" class="checkbox-custom-label">' + tid('bots_use_resource');
        html += '</label></div></fieldset>';

        if(KnowledgebaseUI.ResourceIsFile(kbEntryObject))
        {
            html += '<fieldset class="lzm-fieldset" id="qrd-knb-direct-access-fs"><legend>Download</legend>';
            html += '<div>'+lzm_inputControls.createInput('qrd-knb-access-url', '', KnowledgebaseUI.GetFileURL(kbEntryObject), 'Download URL:', '', 'text', '') +'</div>';
            html += '</fieldset>';
        }
        else if(kbEntryObject.ty>0)
        {
            html += '<fieldset class="lzm-fieldset" id="qrd-knb-direct-access-fs"><legend>' + tid('direct_access') + '</legend>';
            html += '<div>'+lzm_inputControls.createInput('qrd-knb-access-url', '', KnowledgebaseUI.GetAccessUrl(kbEntryObject), tid('direct_access')+' URL:', '', 'text', '') +'</div>';
            html += '</fieldset>';
        }

        var fulltextDisabled = (kbEntryObject.ty == 0) ? ' class="ui-disabled"' : '';
        html += '<fieldset class="lzm-fieldset" style="display:none;" id="qrd-knb-search-fs"><legend>' + tid('search') + '</legend><div' + fulltextDisabled + '>';
        html += '<input type="checkbox" class="checkbox-custom" id="qrd-knb-search-full"' + (kbEntryObject.f==1 ? ' checked="checked"' : '');
        html += ' /><label for="qrd-knb-search-full" class="checkbox-custom-label">'
        html += t('Fulltext Search (slower)') + '</label></div></fieldset>';

        var shortcutDisabeld = (kbEntryObject.ty == 0) ? 'ui-disabled' : '';
        html += '<fieldset class="lzm-fieldset" id="qrd-knb-shortcuts-fs"><legend>' + tid('shortcuts') + '</legend>';

        html += '<table class="tight"><tr><td style="width:40px;">';
        html += lzm_inputControls.createInput('qrd-knb-shortcuts-sc', 'text-bold text-center', '/', '', '', 'text', '');
        html += '</td><td>';
        html += lzm_inputControls.createInput('qrd-knb-shortcuts-text', shortcutDisabeld, lzm_commonTools.htmlEntities(kbEntryObject.s), '', '', 'text', '');
        html += '</td></tr></table>';
        html += '<div class="top-space lzm-info-text">' + t('Example: /welcome') + '</div></fieldset>';

        return html;
    }
    function __GetLanguageContent(){

        var html = '<fieldset class="lzm-fieldset" id="qrd-knb-language-fs"><legend>' + tid('languages') + '</legend>';

        window[kbEntryObject.rid+'-language-editor'] = new CommonInputControlsClass.TagEditor(kbEntryObject.rid+'-language-editor',null,false,true,false,true);

        window[kbEntryObject.rid+'-language-editor'].AddTags(ChatTranslationEditorClass.GetLanguageNameList(), false);
        window[kbEntryObject.rid+'-language-editor'].AddTags(ChatTranslationEditorClass.IsoToName(kbEntryObject.l), true);

        html += window[kbEntryObject.rid+'-language-editor'].GetHTML(false);
        html += '</fieldset>';

        return html;
    }
    function __GetTagsContent(){
        var tagsDisabled = (kbEntryObject.ty == 0) ? ' ui-disabled' : '';

        var html = '<fieldset class="lzm-fieldset' + tagsDisabled + '" id="qrd-tags-fs"><legend>' + tid('tags') + '</legend>';

        window[kbEntryObject.rid+'-tag-editor'] = new CommonInputControlsClass.TagEditor(kbEntryObject.rid+'-tag-editor',null,true,true,false,true);
        window[kbEntryObject.rid+'-tag-editor'].PermissionsToAdd = 'add_tags';
        window[kbEntryObject.rid+'-tag-editor'].AddTags(kbEntryObject.t, true);
        window[kbEntryObject.rid+'-tag-editor'].AddTags(DataEngine.getConfigValue('gl_tags',false));

        html += window[kbEntryObject.rid+'-tag-editor'].GetHTML(false);
        html += '</fieldset>';
        return html;
    }
    function __GetRelatedContent(){

        var relatedDisabled = (false) ? ' ui-disabled' : '';
        var html = '<fieldset class="lzm-fieldset' + relatedDisabled + '" id="kb-related-fs"><legend>' + tid('related') + '</legend>';

        window[kbEntryObject.rid+'-related-editor'] = new CommonInputControlsClass.TagEditor(kbEntryObject.rid+'-related-editor',null,false,false,true,true);

        if(d(kbEntryObject.rlta))
            window[kbEntryObject.rid+'-related-editor'].AddTags(kbEntryObject.rlta, false);

        window[kbEntryObject.rid+'-related-editor'].CustomButtons = lzm_inputControls.createButton(kbEntryObject.rid+'-button-add-related', '','KnowledgebaseUI.AddRelated();', tid('add'), '', 'lr',{'margin-left': '4px'},'',30,'d');

        html += window[kbEntryObject.rid+'-related-editor'].GetHTML(false,true);
        html += '</fieldset>';

        return html;

    }
    function __UpdateTicketComposer(_saved){

        var ticketComposer = TaskBarManager.GetWindow(_ticketComposeWindow.composerWindowId);
        if(ticketComposer != null)
        {
            ticketComposer.Maximize();
            if(_saved)
            {
                $('#ticket-reply-input-save').removeClass('ui-disabled');
                $('#ticket-reply-input-resource').val(kbEntryObject.rid);
                ChatTicketClass.TextEditor.setHtml(KnowledgebaseUI.PrepareResourceForTicket(kbEntryObject));
            }
        }
    }
    function __ContinueTicketReply(){

        var folderSelectWindow = TaskBarManager.GetWindow(_ticketReplyWindowId);
        if(folderSelectWindow != null)
        {
            folderSelectWindow.ShowInTaskBar = true;
            folderSelectWindow.Maximize();
        }
    }
    function __SetSelectedParent(){
        var parentResource = DataEngine.cannedResources.getResource(lzm_chatDisplay.selectedResource);
        if(parentResource != null)
        {
            kbEntryObject.pid = lzm_chatDisplay.selectedResource;
            if(parentResource.ty != KnowledgebaseUI.TypeFolder)
                kbEntryObject.pid = parentResource.pid;
        }
    }

    UIRenderer.resizeAddResources();

    if(kbEntryObject.ty >= KnowledgebaseUI.TypeFile)
    {
        var dropContainer = document.getElementById('file-drop-box');
        $('#file-upload-input').change(function(){changeFile();});
        $('.file-drop-zone').on({
            dragstart: function(evt) {
                dropContainer.style.background = '#dbe1e6';
                evt.preventDefault();
            },
            dragover: function(evt) {
                dropContainer.style.background = '#dbe1e6';
                evt.preventDefault();

            },
            dragleave: function(evt) {
                dropContainer.style.background = 'transparent';
                evt.preventDefault();
            },
            dragenter: function(evt) {
                dropContainer.style.background = 'transparent';
                evt.preventDefault();

            },
            dragend: function(evt) {
                dropContainer.style.background = '#fff';
                evt.preventDefault();

            },
            drop: function(evt) {
                evt.preventDefault();
                changeFile(evt.originalEvent.dataTransfer.files[0]);
            }
        });

        document.body.addEventListener('drop', function(e) {
            e.preventDefault();
        }, false);

        $('#add-resource, #qrd-add-body').on({
            dragstart: function(evt) {evt.preventDefault();},
            dragover: function(evt) {evt.preventDefault();},
            dragleave: function(evt) {evt.preventDefault();},
            dragenter: function(evt) {evt.preventDefault();},
            dragend: function(evt) {evt.preventDefault();},
            drop: function(evt) {evt.preventDefault();}
        });
    }

    if(!IFManager.IsMobileOS)
        $('#show-kb-entry-title').focus();
    if(!IFManager.IsMobileOS)
        if(parseInt(kbEntryObject.ty) < KnowledgebaseUI.TypeFile)
            setTimeout(function(){
                $('#show-kb-entry-title').focus();
            },100);
};

KnowledgebaseUI.CountVisibleEntries = function(_list){
    var count = 0;
    try
    {
        for(var key in _list)
        {
            if (PermissionEngine.checkUserResourceReadPermission(lzm_chatDisplay.myId, _list[key], DataEngine.cannedResources.getResource(_list[key].pid)))
            {
                count++;
            }
        }
    }
    catch(ex)
    {
        deblog(ex);
    }
    return count;
};

KnowledgebaseUI.AddOrEditResourceFromTicket = function(_ticketId, _resource) {

    if(_resource == null)
        _resource = DataEngine.cannedResources.getResource(lzm_chatDisplay.selectedResource);

    if (_resource != null)
    {
        var tco = {
            tid: _ticketId,
            text: lzm_chatDisplay.ticketResourceText[_ticketId],
            composerWindowId: _ticketId + '_reply'
        };
        if (_resource.ty == 0)
        {
            KnowledgebaseUI.ShowEntry(null,1,null,false,tco);
        }
        else if (_resource.ty == 1)
        {
            KnowledgebaseUI.ShowEntry(_resource.rid,1,null,false,tco);
        }
    }
};

KnowledgebaseUI.Remove = function() {
    removeKBContextMenu();
    var resource = DataEngine.cannedResources.getResource(lzm_chatDisplay.selectedResource);
    if (resource != null)
    {
        if (!PermissionEngine.checkUserPermissions('', 'resources', 'delete', resource))
        {
            showNoPermissionMessage();
            return;
        }
    }
    lzm_commonDialog.createAlertDialog(tid('resource_really_delete'), [{id: 'ok', name: tid('ok')}, {id: 'cancel', name: tid('cancel')}]);
    $('#alert-btn-ok').click(function() {
        var resource = DataEngine.cannedResources.getResource(lzm_chatDisplay.selectedResource);
        if (resource != null)
        {
            resource.di = 1;
            CommunicationEngine.PollServerResource({First:resource}, "set");
            $('#qrd-search-line-' + resource.rid).remove();
        }
        lzm_commonDialog.removeAlertDialog();
    });
    $('#alert-btn-cancel').click(function() {
        lzm_commonDialog.removeAlertDialog();
    });
};

KnowledgebaseUI.OpenAllParents = function(_entry){
    var list=[],__open = function(parent){
        if(d(parent) && parent != null && parent.rid != '1')
            list.push(parent.rid);
    };
    if(_entry != null && d(_entry.pid))
    {
        var parent = DataEngine.cannedResources.objects[_entry.pid];
        __open(parent);
        while(d(parent) && parent.rid != '1')
        {
            parent = DataEngine.cannedResources.objects[parent.pid];
            __open(parent);
        }
    }
    list.reverse();
    for(var key in list)
        KnowledgebaseUI.HandleResourceClickEvents(list[key],true,false,'');
};

KnowledgebaseUI.ShowInTreeView = function(_toSelect) {

    if(d(_toSelect))
        lzm_chatDisplay.selectedResource = _toSelect;

    removeKBContextMenu();

    var selSearchRes = lzm_chatDisplay.selectedResource;

    if(CommonInputControlsClass.SearchBox.IsActiveSearch)
        CommonInputControlsClass.SearchBox.ToggleSearchDialog(true,true);

    $('#qrd-tree-placeholder-tab-0').click();
    KnowledgebaseUI.OpenAllParents(DataEngine.cannedResources.getResource(selSearchRes));
    KnowledgebaseUI.HandleResourceClickEvents(selSearchRes,false,false,'');
    $('#all-resources').scrollTo('resource-'+selSearchRes);
};

KnowledgebaseUI.Search = function(_query,_tags) {

    var inDialog = false;
    var that = lzm_chatDisplay.resourcesDisplay, searchCategories =  ['ti', 'text', 't'];

    that.KBSearchCategories = [];

    var sid = (inDialog) ? 'd-' : '';

    for (var i=0; i<searchCategories.length; i++)
        if ($('#kb-ss-' + searchCategories[i]).attr('checked') == 'checked')
            that.KBSearchCategories.push(searchCategories[i]);

    $('#'+sid+'search-results').css({display:_query.length || _tags.length ? 'block' : 'none'});
    $('#'+sid+'all-resources').css({display:!_query.length && !_tags.length ? 'block' : 'none'});

    var resultrows = that.CreateKBSearchResults(_query, _tags, lzm_chatDisplay.resourcesDisplay.qrdChatPartner, inDialog);

    $('#'+sid+'search-result-table').children('tbody').html(resultrows);

};

KnowledgebaseUI.EntryDBLClick = function(){
    if (KnowledgebaseUI.SelectionMode)
        KnowledgebaseUI.EndSelectionMode(true);
    else
        KnowledgebaseUI.EditEntry();
};

KnowledgebaseUI.HighlightType = function(){

    if(KnowledgebaseUI.Highlighting)
        $('.resource-div').css('opacity','0.5');
    else
        $('.resource-div').css('opacity','1');

    for(var key in KnowledgebaseUI.HighlightingTypes)
        $('.resource-div.ty'+ KnowledgebaseUI.HighlightingTypes[key]).css('opacity','1');
};

KnowledgebaseUI.InitSelectionMode = function(_winObj, _action, _dataObj){

    KnowledgebaseUI.SelectionWindow = _winObj;
    KnowledgebaseUI.SelectionWindow.Minimize();
    KnowledgebaseUI.SelectionMode = _action;

    if(d(_dataObj))
        KnowledgebaseUI.SelectionData = _dataObj;

    lzm_chatDisplay.RenderTaskBarPanel();

    $('#kb-button-line').addClass('ui-disabled');
    $('#main-menu-panel').addClass('ui-disabled');
    $('#view-select-panel').addClass('ui-disabled');

    CommonInputControlsClass.SearchBox.ShowKB = true;

    SelectView('qrd');

    CommonInputControlsClass.SearchBox.SetQuery('');
    CommonInputControlsClass.SearchBox.Reset(true);

    if(_action == 'TICKET_LOAD_ELEMENT' || _action == 'CHAT_LOAD_ELEMENT')
    {
        $('#qrd-info').html(tid('select'));

        KnowledgebaseUI.HighlightingTypes = ['1','2','3','4'];
        KnowledgebaseUI.Highlighting = true;
    }
    else if(_action == 'TICKET_ADD_ATTACHMENT')
    {
        $('#qrd-info').html(tid('attach'));

        KnowledgebaseUI.HighlightingTypes = ['3','4'];
        KnowledgebaseUI.Highlighting = true;
    }
    else if(_action == 'TICKET_SAVE_AS' || _action == 'CHAT_SAVE_AS')
    {
        $('#qrd-info').html(tid('select_folder'));

        KnowledgebaseUI.HighlightingTypes = ['0'];
        KnowledgebaseUI.Highlighting = true;
    }
    else if(_action == 'KB_ADD_RELATED')
    {
        $('#qrd-info').html(tid('select'));

        KnowledgebaseUI.HighlightingTypes = ['1','2','3','4'];
        KnowledgebaseUI.Highlighting = true;
    }

    KnowledgebaseUI.HighlightType();

    if(!IFManager.IsMobileOS)
    {
        $('#main-search-field').focus();
    }
};

KnowledgebaseUI.EndSelectionMode = function(_result){

    var selectedResource = DataEngine.cannedResources.getResource(lzm_chatDisplay.selectedResource);

    if(selectedResource == null)
    {
        showMessage(tid('no_element'));
        return;
    }

    if(_result)
    {
        if(KnowledgebaseUI.SelectionMode != 'TICKET_SAVE_AS')
            if(KnowledgebaseUI.SelectionMode != 'CHAT_SAVE_AS')
                if(selectedResource.ty == 0)
                {
                    showMessage('You can\'t select a folder.');
                    return;
                }
    }

    if(KnowledgebaseUI.SelectionMode == 'TICKET_LOAD_ELEMENT')
    {
        SelectView('tickets');
        KnowledgebaseUI.SelectionWindow.Maximize();

        if(_result)
        {
            KnowledgebaseUI.InsertIntoTicket();
        }

        if(IFManager.IsMobileOS)
        {
            var fsets = $('#ticket-composer-form fieldset');
            $('#ticket-composer-form').animate({
                scrollTop: $(fsets[0]).height() + $(fsets[1]).height()+75
            },400);
        }
    }
    else if(KnowledgebaseUI.SelectionMode == 'TICKET_ADD_ATTACHMENT')
    {
        SelectView('tickets');

        KnowledgebaseUI.SelectionWindow.Maximize();
        if(_result)
            if(!KnowledgebaseUI.AddTicketAttachment())
            {
                SelectView('qrd');
                KnowledgebaseUI.SelectionWindow.Minimize();
                return;
            }
    }
    else if(KnowledgebaseUI.SelectionMode == 'CHAT_LOAD_ELEMENT')
    {
        SelectView('mychats');
        if(_result)
            sendQrdPreview('',KnowledgebaseUI.SelectionWindow.Tag);

        KnowledgebaseUI.SelectionWindow.Maximize();
    }
    else if(KnowledgebaseUI.SelectionMode == 'TICKET_SAVE_AS')
    {
        KnowledgebaseUI.AddOrEditResourceFromTicket(KnowledgebaseUI.SelectionWindow.Tag.id,null);
    }
    else if(KnowledgebaseUI.SelectionMode == 'CHAT_SAVE_AS')
    {
        KnowledgebaseUI.ShowEntry(null,1,null,false,null,lz_global_base64_decode(KnowledgebaseUI.SelectionData));
    }
    else if(KnowledgebaseUI.SelectionMode == 'KB_ADD_RELATED')
    {
        TaskBarManager.GetWindow('show-kb-entry-' + md5(KnowledgebaseUI.SelectionWindow.Tag.rid)).Maximize();
        if(KnowledgebaseUI.SelectionWindow.Tag.rid != selectedResource.rid)
        {
            window[KnowledgebaseUI.SelectionWindow.Tag.rid+'-related-editor'].AddTags([selectedResource.rid]);
            window[KnowledgebaseUI.SelectionWindow.Tag.rid+'-related-editor'].UpdateHTML();
        }
    }

    KnowledgebaseUI.HighlightingTypes = ['0'];
    KnowledgebaseUI.Highlighting = false;
    KnowledgebaseUI.HighlightType();

    $('#kb-button-line').removeClass('ui-disabled');
    $('#main-menu-panel').removeClass('ui-disabled');
    $('#view-select-panel').removeClass('ui-disabled');

    KnowledgebaseUI.SelectionMode = false;
    lzm_chatDisplay.RenderTaskBarPanel();
};

KnowledgebaseUI.AddRelated = function(){
    KnowledgebaseUI.InitSelectionMode(TaskBarManager.GetActiveWindow(),'KB_ADD_RELATED');
};