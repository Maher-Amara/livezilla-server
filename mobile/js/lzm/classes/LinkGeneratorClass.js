/****************************************************************************************
 * LiveZilla LinkGeneratorClass.js
 *
 * Copyright 2018 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/

LinkGeneratorClass.DataPassThruPlaceholder = '<!--replace_me_with_';
LinkGeneratorClass.CurrentElements = [];
LinkGeneratorClass.InlinePreviewLoaded = false;
LinkGeneratorClass.DeprecatedElements = ['overlay-button-v2','overlay-widget','overlay-widget-v1'];

function LinkGeneratorClass() {
    this.m_MaxImageSetId = 0;
    this.m_CurrentCodeId = null;
    this.m_CurrentCodeName = null;
    this.m_InlinePreviewTimer = null;
}

LinkGeneratorClass.__LoadCode = function(id){
    lzm_chatDisplay.LinkGenerator.LoadCode(id);
};

LinkGeneratorClass.prototype.ShowLinkGenerator = function() {
    var disabledClass = 'ui-disabled';
    var headerString = t('Link Generator');
    var footerString =
        lzm_inputControls.createButton('preview-btn', disabledClass, 'previewLinkGeneratorCode()', tid('preview'), '<i class="fa fa-rocket"></i>', 'force-text',{'margin-left': '4px'},'',30,'d') +
        lzm_inputControls.createButton('get-code-btn', disabledClass, 'showLinkGeneratorCode()', tid('get_code'), '<i class="fa fa-code"></i>', 'force-text',{'margin-left': '4px'},'',30,'d') +
        lzm_inputControls.createButton('close-link-generator', '', '', t('Close'), '', 'lr',{'margin-left': '4px'},'',30,'d');

    var bodyString = this.CreateLinkGeneratorHtml();

    var winId = 'link-generator-dialog';
    if(TaskBarManager.WindowExists(winId))
    {
        TaskBarManager.Maximize(winId);
        return;
    }

    lzm_commonDialog.CreateDialogWindow(headerString, bodyString, footerString, 'link',winId, winId, 'close-link-generator');
    UIRenderer.resizeLinkGenerator();
    $('#close-link-generator').click(function() {
        TaskBarManager.RemoveActiveWindow();
        TaskBarManager.RemoveWindowByDialogId('link_generator_add_element');
        TaskBarManager.RemoveWindowByDialogId('link_generator_edit_element');
    });

    this.LoadCodesFromServer();
};

LinkGeneratorClass.prototype.CreateNewCode = function() {

    var that=this,nameHtml = lzm_inputControls.createInput('template-name','','',tidc('name'),'','text','');
    lzm_commonDialog.createAlertDialog(nameHtml, [{id: 'ok', name: t('Save')},  {id: 'cancel', name: t('Cancel')}]);
    $('#alert-btn-ok').click(function() {
        that.m_CurrentCodeName = $('#template-name').val();

        if(that.m_CurrentCodeName.length > 32)
            that.m_CurrentCodeName = lzm_commonTools.SubStr(that.m_CurrentCodeName,32,false);

        var cid = lzm_commonTools.guid();
        lzm_commonDialog.removeAlertDialog();
        $('#code-list-table tbody').append(that.GetCodeRow(cid,lz_global_base64_encode(JSON.stringify([lz_global_base64_encode(JSON.stringify([])),cid])),that.m_CurrentCodeName,false));
        that.LoadCode(cid);
        that.SaveCodeToServer(false);

    });
    $('#alert-btn-cancel').click(function() {
        lzm_commonDialog.removeAlertDialog();
    });
    $('#template-name').focus();
};

LinkGeneratorClass.prototype.DeleteCode = function(id){
    var that = this;
    lzm_commonDialog.createAlertDialog(tid('remove_items'), [{id: 'ok', name: t('Ok')}, {id: 'cancel', name: t('Cancel')}]);
    $('#alert-btn-ok').click(function(){
        lzm_commonDialog.removeAlertDialog();
        CommunicationEngine.pollServerDiscrete('delete_code',{p_cc_c: lz_global_base64_encode(id)});
        $('#cl-'+id).remove();
        that.LoadCode(0);
    });
    $('#alert-btn-cancel').click(function(){
        lzm_commonDialog.removeAlertDialog();
    });
};

LinkGeneratorClass.prototype.CreateLinkGeneratorHtml = function() {
    var contentHtml =
        '<div style="display:none;" id="lz_link_generator_load" class="lz_anim_loading"></div>'+
        '<table id="link-generator-table" class="visible-list-table"><tr><td></td><td style="width:20%;min-width:300px;">' +
        '<fieldset class="lzm-fieldset-full" id="code-list-div"><legend>Codes</legend><table class="visible-list-table alternating-rows-table lzm-unselectable" id="code-list-table"></thead><tbody></tbody></table></fieldset>';

    contentHtml += '<div class="top-space-half"><div class="top-space right-space"><span style="float:left;">';
    contentHtml += lzm_inputControls.createButton('new-element-to-server-btn', '', 'newLinkGeneratorCode()', tid('new'), '<i class="fa fa-plus"></i>', 'lr',{'margin-right': '5px', 'padding-left': '12px', 'padding-right': '12px'}, '', 20, 'e');

    contentHtml += '</span><span style="float:left;">';
    contentHtml += lzm_inputControls.createButton('rm-element-frm-server-btn', '', 'LinkGeneratorClass.Delete(event)', tid('remove'), '<i class="fa fa-remove"></i>', 'lr',{'margin-right': '0px', 'padding-left': '12px', 'padding-right': '12px'}, '', 20, 'e');



    contentHtml += '</span></div></div></td>' +
        '<td style="width:20%;min-width:300px;"><fieldset class="lzm-fieldset-full" id="elements-list-div"><legend>'+tid('elements')+'</legend><table class="alternating-rows-table" id="elements-list-table">' +
        '<tbody></tbody></table></fieldset>';

    contentHtml += '<div class="top-space-half"><div class="top-space-half"><div class="top-space"><span style="float:right;">';
    contentHtml += lzm_inputControls.createButton('add-element-btn', '', 'addLinkGeneratorElement()', t('Add'), '<i class="fa fa-plus"></i>','force-text',{'margin-right': '5px', 'padding-left': '12px', 'padding-right': '12px'}, '', 20, 'e');
    contentHtml += lzm_inputControls.createButton('edit-element-btn', 'ui-disabled element-edit-btns', 'editLinkGeneratorElement()', t('Edit'), '<i class="fa fa-gear"></i>', 'lr',{'margin-right': '5px', 'padding-left': '12px', 'padding-right': '12px'}, '', 20, 'e');
    contentHtml += lzm_inputControls.createButton('rm-element-btn', 'ui-disabled element-edit-btns', 'removeLinkGeneratorElement()', t('Remove'), '<i class="fa fa-remove"></i>', 'lr',{'margin-right': '0px', 'padding-left': '12px', 'padding-right': '12px'}, '', 20, 'e');
    contentHtml += '</span></div></div></div></td><td style="width:60%;height:100%;">';
    contentHtml += '<iframe id="inline-preview"></iframe>';
    contentHtml += '<div style="margin-top:7px;"><span style="float:right;">';
    contentHtml += lzm_inputControls.createButton('rm-preview-refresh', '', 'LinkGeneratorClass.__PreviewInline()', '', '<i class="fa fa-refresh"></i>', 'lr',{'margin-right': '0px', 'padding-left': '12px', 'padding-right': '12px'}, '', 20, 'e');
    contentHtml += '</div></td><td></td></tr></table>';

    return contentHtml;
};

LinkGeneratorClass.prototype.ValidateButtons = function(){
    var elementsExisting = $('#elements-list-table tr').length > 0;
    var codesExisting = $('#code-list-table tr').length > 0;

    var selectedElement = this.GetSelectedElement(false);
    if(selectedElement != null){
        $('.element-edit-btns').removeClass('ui-disabled');

        if(selectedElement.m_Type=='monitoring' && lzm_chatDisplay.LinkGenerator.RequiresMonitoring())
            $('#rm-element-btn').addClass('ui-disabled');
    }
    else
        $('.element-edit-btns').addClass('ui-disabled');

    if(!codesExisting)
    {
        $('#delete-element-from-server-btn').addClass('ui-disabled');
        $('#add-element-btn').addClass('ui-disabled');
    }
    else
    {
        $('#delete-element-from-server-btn').removeClass('ui-disabled');
        $('#add-element-btn').removeClass('ui-disabled');
    }

    if(!elementsExisting)
    {
        $('#preview-btn').addClass('ui-disabled');
        $('#get-code-btn').addClass('ui-disabled');

    }
    else
    {
        $('#preview-btn').removeClass('ui-disabled');
        $('#get-code-btn').removeClass('ui-disabled');
    }
};

LinkGeneratorClass.prototype.CreateSelectElementTypeHtml = function() {
    var contentHtml = '<div class="lzm-fieldset" id="lg-elements-configuration">' +
        '<form id="select-element-form">' +
        '<div class="top-space-double left-space-child'+((this.isTypeSelected('overlay-widget-v2')) ? ' ui-disabled' : '')+'"><input id="element-overlay-widget" value="overlay-widget-v2" name="element-type" type="radio" class="radio-custom element-type" /><label for="element-overlay-widget" class="radio-custom-label">' + tid('overlay-widget-v2') + '</label></div>' +
        '<div class="top-space left-space-child'+((this.isTypeSelected('inlay-image')) ? ' ui-disabled' : '')+'"><input id="element-inlay-image" value="inlay-image" name="element-type" type="radio" class="radio-custom element-type" /><label for="element-inlay-image" class="radio-custom-label">' + t('Graphic Button') + '</label></div>' +
        '<div class="top-space left-space-child'+((this.isTypeSelected('inlay-text')) ? ' ui-disabled' : '')+'"><input id="element-inlay-text" value="inlay-text" name="element-type" type="radio" class="radio-custom element-type" /><label for="element-inlay-text" class="radio-custom-label">' + t('Text Link') + '</label></div>' +
        '<div class="top-space left-space-child'+((this.isTypeSelected('overlay-button-v1')) ? ' ui-disabled' : '')+'"><input id="element-overlay-button" value="overlay-button-v1" name="element-type" type="radio" class="radio-custom element-type" /><label for="element-overlay-button" class="radio-custom-label">' + tid('overlay-button') + '</label></div>' +
        '<div class="top-space left-space-child'+((this.isTypeSelected('monitoring')) ? ' ui-disabled' : '')+'"><input id="element-monitoring" value="monitoring" name="element-type" type="radio" class="radio-custom element-type" /><label for="element-monitoring" class="radio-custom-label">' + t('Visitor Monitoring') + '</label></div>';
    contentHtml += '</form></div>';
    return contentHtml;
};

LinkGeneratorClass.prototype.CreateElementConfigurationHtml = function() {
    return '<div id="lg-element-settings-placeholder"></div>';
};

LinkGeneratorClass.prototype.SelectElementType = function(editObj) {

    var that=this;
    editObj = (typeof editObj != 'undefined') ? editObj : null;

    var winId = 'link_generator_add_element';
    if(TaskBarManager.WindowExists(winId))
    {
        TaskBarManager.Maximize(winId);
        return;
    }

    if(editObj != null && TaskBarManager.WindowExists('link_generator_edit_element'))
    {
        TaskBarManager.Maximize('link_generator_edit_element');
        return;
    }

    var headerString = tid('create_new_element');
    var footerString =
        lzm_inputControls.createButton('select-element-type-btn', 'ui-disabled', '', tid('select'), '', 'lr',{'margin-left': '6px'},'',30,'d') +
        lzm_inputControls.createButton('cancel-element-type-btn', '', '', tid('cancel'), '', 'lr', {'margin-left': '6px'},'',30,'d');

    var bodyString = this.CreateSelectElementTypeHtml();
    $('#inline-preview').attr('src','');

    lzm_commonDialog.CreateDialogWindow(headerString, bodyString, footerString, 'link', winId,winId, 'cancel-element-type-btn');

    $('#select-element-type-btn').click(function() {
        var eType = $('input[name=element-type]:checked').val();
        if(eType == 'overlay-button')
            eType = $('input[name=element-overlay-button-type]:checked').val();
        if(eType == 'overlay-widget')
            eType = $('input[name=element-overlay-widget-type]:checked').val();

        that.AddLinkGeneratorElement(eType ,null);
    });
    $('#cancel-element-type-btn').click(function() {
        TaskBarManager.RemoveActiveWindow();
        var lgWin = TaskBarManager.GetWindow('link-generator-dialog');
        if(lgWin != null)
            lgWin.Maximize();
    });
    $('.element-type').change(function() {
        if ($('#element-overlay-button').prop('checked'))
            $('.element-overlay-button-type').removeClass('ui-disabled');
        else
            $('.element-overlay-button-type').addClass('ui-disabled');

        if ($('#element-overlay-widget').prop('checked'))
            $('.element-overlay-widget-type').removeClass('ui-disabled');
        else
            $('.element-overlay-widget-type').addClass('ui-disabled');

        $('#select-element-type-btn').removeClass('ui-disabled');
    });

    if(editObj != null)
        that.AddLinkGeneratorElement(editObj.m_Type,editObj);
};

LinkGeneratorClass.prototype.AddLinkGeneratorElement = function(elementType, editObj) {

    var that = this;
    editObj = (typeof editObj != 'undefined') ? editObj : null;

    var winId = 'link_generator_edit_element';
    if(TaskBarManager.WindowExists(winId))
    {
        TaskBarManager.Maximize(winId);
        return;
    }

    var headerString = tid(elementType);
    var footerString =
        lzm_inputControls.createButton('save-element-btn', '', '', tid('save'), '', 'lr',{'margin-left': '6px'},'',30,'d') +
        lzm_inputControls.createButton('cancel-element-btn', '', '', tid('cancel'), '', 'lr', {'margin-left': '6px'},'',30,'d');

    var bodyString = this.CreateElementConfigurationHtml();

    $('#inline-preview').attr('src','');

    TaskBarManager.RemoveActiveWindow();

    lzm_commonDialog.CreateDialogWindow(headerString, bodyString, footerString,'link', winId, winId, 'cancel-element-btn');

    var element = new LinkGeneratorElement(elementType,editObj);
    if(editObj == null && LinkGeneratorClass.CurrentElements.length>0)
        element.LoadSettings(LinkGeneratorClass.CurrentElements[0].m_Settings,true);

    if(element.m_Type == 'overlay-widget-v1' && parseInt(lzm_commonTools.GetPositionIndex(UIRenderer.getSettingsProperty(element.m_Settings,'m_Position').value)) < 20)
        UIRenderer.getSettingsProperty(element.m_Settings,'m_Position').value = 'right bottom';
    else if(element.m_Type == 'overlay-widget-v2')
    {
        UIRenderer.getSettingsProperty(element.m_Settings,'m_Position').value = 'right bottom';

        if(editObj == null)
        {
            UIRenderer.getSettingsProperty(element.m_Settings,'m_MarginRight').value = 40;
            UIRenderer.getSettingsProperty(element.m_Settings,'m_MarginBottom').value = 30;
            //UIRenderer.getSettingsProperty(element.m_Settings,'m_ECMarginRight').value = 28;
            //UIRenderer.getSettingsProperty(element.m_Settings,'m_ECMarginBottom').value = 78;
        }
    }

    if(element.m_Type == 'inlay-text')
        UIRenderer.getSettingsProperty(element.m_Settings,'m_TextDefault').value = false;

    var tabs = [];
    element.m_Settings.forEach(function(entry_name) {
        if($.inArray(elementType,entry_name.not) === -1 && $.inArray('all',entry_name.not) === -1)
            tabs.push({name: entry_name.title, content: UIRenderer.getForm(entry_name.name, element, 'lg-element'), hash: entry_name.name});
    });

    lzm_inputControls.createTabControl('lg-element-settings-placeholder',tabs,0);

    if(element.m_Type == 'overlay-widget-v1'){
        $('.y0').addClass('ui-disabled');
        $('.y1').addClass('ui-disabled');
    }
    else if(element.m_Type == 'overlay-widget-v2')
    {

    }
    else if(element.m_Type == 'inlay-text'){
        $('.checkbox-custom-label[for="cb-m_TextDefault"]').addClass('ui-disabled');
        $('#cb-m_TextDefault').addClass('ui-disabled');
    }

    element.m_Settings.forEach(function(entry_name) {
        element.ApplyLogicToForm(entry_name.name);
    });

    $('#save-element-btn').click(function() {
        element.GUIToObject();

        TaskBarManager.RemoveActiveWindow();
        var winObj = TaskBarManager.GetWindow('link-generator-dialog');
        if(winObj != null)
            winObj.Maximize();

        $('#'+element.GetLineId()).remove();

        that.AddElementRow(element.GetElementRow());

        if(!that.isTypeSelected('monitoring') && editObj == null)
            $('#elements-list-table > tbody').append(new LinkGeneratorElement('monitoring').GetElementRow());

        that.SettleStaticFields(element,that.GetElementsFromRows(false));
        selectLinkGeneratorElement(element.m_Type);
        that.SaveCodeToServer(false);
    });
    $('#cancel-element-btn').click(function() {
        TaskBarManager.RemoveActiveWindow();
        var winObj = TaskBarManager.GetWindow('link-generator-dialog');
        if(winObj != null)
            winObj.Maximize();
        that.PreviewInline(that.m_CurrentCodeId);
    });

    if(DataEngine.chosen_profile.server_protocol.toLowerCase().startsWith('https') && $('#r-m_ProtocolHTTP').prop('checked'))
    {
        $('#r-m_ProtocolHTTP').parent().addClass('ui-disabled');
        $('#r-m_ProtocolHTTPS').prop('checked',true);
    }
};

LinkGeneratorClass.prototype.EditLinkGeneratorElement = function(){
    var elementToEdit = this.GetSelectedElement(false);
    this.SelectElementType(elementToEdit);
    selectLinkGeneratorElement('');
};

LinkGeneratorClass.prototype.RemoveLinkGeneratorElement = function(){
    this.GetSelectedElement(true).remove();
    $('#elements-list-table > tbody > tr').each(function() {
        selectLinkGeneratorElement(JSON.parse(lz_global_base64_url_decode($(this).attr('data-element'))).m_Type);
        return false;
    });
    this.ValidateButtons();
    this.SaveCodeToServer(false);
};

LinkGeneratorClass.prototype.GetSelectedElement = function(getRow){
    if($('#elements-list-table > tbody > tr').length > 0){
        if(getRow)
            return $(".selected-table-line","#elements-list-table");
        else if($(".selected-table-line","#elements-list-table").length>0)
            return JSON.parse(lz_global_base64_url_decode($(".selected-table-line","#elements-list-table").attr('data-element')));
    }
    return null;
};

LinkGeneratorClass.prototype.GetElement = function(type){
    var elem = null;
    $('#elements-list-table > tbody > tr').each(function() {
        if(type=='first')
            elem = new LinkGeneratorElement($(this).attr('id').replace('element-list-line-',''),JSON.parse(lz_global_base64_url_decode($(this).attr('data-element'))));
        else if($(this).attr('id').match(type+'$'))
            elem = new LinkGeneratorElement(type,JSON.parse(lz_global_base64_url_decode($(this).attr('data-element'))));
    });
    return elem;
};

LinkGeneratorClass.prototype.isTypeSelected = function(type){

    if($.inArray(type,LinkGeneratorClass.DeprecatedElements) != -1)
        return false;

    var res = false;
    $('#elements-list-table > tbody > tr').each(function() {
        if($(this).attr('id').match(type+'$'))
            res = true;
    });
    return res;
};

LinkGeneratorClass.prototype.RequiresMonitoring = function() {
    return this.isTypeSelected('overlay-button-v1')||this.isTypeSelected('overlay-button-v2')||this.isTypeSelected('overlay-widget-v1')||this.isTypeSelected('overlay-widget-v2');
};

LinkGeneratorClass.prototype.GetElementsFromRows = function(encode){
    var objects = [];
    if(encode){
        $('#elements-list-table tr').each(function() {
            objects.push($(this).attr('data-element'));
        });
        return lz_global_base64_encode(JSON.stringify(objects));
    }
    else{
        $('#elements-list-table > tbody > tr').each(function() {
            objects.push(JSON.parse(lz_global_base64_url_decode($(this).attr('data-element'))));
        });
        return objects;
    }
};

LinkGeneratorClass.prototype.Preview = function(){
    this.SaveCodeToServer(true,false,false);
};

LinkGeneratorClass.prototype.PreviewInline = function(_cid){
    var that=this, purl = DataEngine.getServerUrl('preview.php',this.GetSelectedScheme()) + '?inline=1&id=' + _cid + '&t=' + lz_global_timestamp();
    if(this.m_InlinePreviewTimer != null)
        clearInterval(this.m_InlinePreviewTimer);
    this.m_InlinePreviewTimer = setTimeout(function(){
        $('#inline-preview').attr('src',purl);
        that.m_InlinePreviewTimer = null;
    },100);
};

LinkGeneratorClass.prototype.SaveCodeToServer = function(_preview){
    var that = this;
    var data = {};
    data.p_cc_c = lz_global_base64_encode(that.GetCode(_preview,false));
    data.p_cc_e = (_preview) ? '' : that.GetElementsFromRows(true);
    data.p_cc_t = (_preview) ? '0' : '1';

    if(that.m_CurrentCodeId==null)
        that.m_CurrentCodeId = lzm_commonTools.guid();

    if(!_preview)
        data.p_cc_i = that.m_CurrentCodeId;

    if(_preview)
    {
        that.SetLoading(true);
        CommunicationEngine.pollServerDiscrete('create_code',data).done(function(data) {
            that.SetLoading(false);
            var xmlDoc = $.parseXML($.trim(data));
            $(xmlDoc).find('code').each(function(){
                var cid = lz_global_base64_decode($(this).attr('id'));
                var purl = DataEngine.getServerUrl('preview.php',that.GetSelectedScheme()) + '?id=' + cid;
                openLink(purl);
            });
        }).fail(function(jqXHR, textStatus, errorThrown){alert("ERR: 0x637163 (" + textStatus + ")");that.SetLoading(false);});
    }
    else
    {
        data.p_cc_n = that.m_CurrentCodeName;
        that.UploadCodeToServer(data);
    }
};

LinkGeneratorClass.prototype.UploadCodeToServer = function(data){
    var that = this;
    that.SetLoading(true);
    CommunicationEngine.pollServerDiscrete('create_code',data).done(function(data) {
        that.SetLoading(false);
        that.PreviewInline(that.m_CurrentCodeId);
    }).fail(function(jqXHR, textStatus, errorThrown){alert("ERR: 0x337189 (" + textStatus + ")");that.SetLoading(false);});
};

LinkGeneratorClass.prototype.SetLoading = function(loading){
    if(loading){
        $('#lz_link_generator_load').css({display:'block'});
        $('#link-generator-table').css({display:'none'});
    }
    else{
        $('#lz_link_generator_load').css({display:'none'});
        $('#link-generator-table').css({display:'table'});
    }
};

LinkGeneratorClass.prototype.LoadCodesFromServer = function(){
    var that = this;
    that.SetLoading(true);
    CommunicationEngine.pollServerDiscrete('get_code_list',null).done(function(data) {

        var xmlDoc = $.parseXML($.trim(data));
        var count = 0;
        var clhtml = '';

        $(xmlDoc).find('code').each(function(){
            count++;
            var cname = lz_global_base64_decode($(this).attr('n'));
            var cid =  lz_global_base64_decode($(this).attr('i'));
            clhtml += that.GetCodeRow(cid,lz_global_base64_encode(JSON.stringify([$(this).text(),$(this).attr('i')])),cname,false);
        });

        if(count)
            ChatStartpageClass.SetOnboardingDone(1);

        $('#code-list-table tbody').html(clhtml);
        that.SetLoading(false);
        that.LoadCode(0);
        $('#server-codes').prop('selectedIndex',0);

        //if(count == 0)
          //  LinkGeneratorClass.CreateDefaultButton();

    }).fail(function(jqXHR, textStatus, errorThrown){that.SetLoading(false);alert("ERR: 5x237941 (" + textStatus + ")");});
};

LinkGeneratorClass.prototype.GetCodeRow = function(id,objB64,name) {

    var icon = '<i class="fa fa-code icon-large"></i>';
    var nameClass = '';
    try{
        var obj = JSON.parse(lz_global_base64_decode(objB64));
        var valueObj = obj[0];

        var objectList = JSON.parse(lz_global_base64_decode(valueObj));
        for (var item in objectList)
        {
            if($.inArray(JSON.parse(lz_global_base64_decode(objectList[item])).m_Type,LinkGeneratorClass.DeprecatedElements) != -1)
            {
                nameClass = ' class="text-orange text-bold"';
                icon = '<i class="fa fa-warning icon-orange icon-large"></i>';
                break;
            }
        }
    }
    catch(ex)
    {
        deblog(ex);
    }
    var html = '<tr id="cl-'+id+'" class="lg-cl-code" onClick="LinkGeneratorClass.__LoadCode(\''+id+'\');" data-name="'+lz_global_base64_encode(name)+'" data-obj="'+objB64+'"><td style="width:20px;" class="text-center spaced">'+icon+'</td><td'+nameClass+'>'+name+'</td><td style="text-align: right;">';
    //html += lzm_inputControls.createButton('delete-element-from-server-btn-' + id, '', 'LinkGeneratorClass.Delete(event,\''+id+'\')', '', '<i class="fa fa-trash nic"></i>', '',{'margin-right': '0', display:'inline-block'}, '', 20, 'b');
    return html + '</td></tr>';
};

LinkGeneratorClass.prototype.LoadCode = function(id){

    var obj,newRow;
    if(this.m_CurrentCodeId != '' && this.m_CurrentCodeId != id && $('#cl-'+this.m_CurrentCodeId).length)
    {
        var oname =  lz_global_base64_decode($('#cl-'+this.m_CurrentCodeId).data('name'));
        var elements = this.GetElementsFromRows(true);
        var dobj = lz_global_base64_encode(JSON.stringify([elements,this.m_CurrentCodeId]));

        newRow = this.GetCodeRow(this.m_CurrentCodeId,dobj,oname,false);
        $('#cl-'+this.m_CurrentCodeId).replaceWith(newRow);
    }

    if(id==0)
    {
        this.m_CurrentCodeId =
        this.m_CurrentCodeName = '';
        if($('#code-list-table tbody tr').length)
            this.LoadCode($('#code-list-table tbody tr:first').attr('id').replace('cl-',''));
        else
        {
            $('#elements-list-table > tbody').empty();
            this.PreviewInline(0);
        }
    }
    else if(this.m_CurrentCodeId != id)
    {
        $('.lg-cl-code').removeClass('selected-table-line');
        $('#cl-' + id).addClass('selected-table-line');

        this.m_CurrentCodeId = id;
        this.m_CurrentCodeName = lz_global_base64_decode($('#cl-'+id).data('name'));

        $('#elements-list-table > tbody').empty();

        obj = JSON.parse(lz_global_base64_decode($('#cl-'+id).data('obj')));
        var valueObj = obj[0];

        var objectList = JSON.parse(lz_global_base64_decode(valueObj));
        for (var item in objectList){

            obj = JSON.parse(lz_global_base64_decode(objectList[item]));
            obj.m_Type = this.UpgradeTypes(obj.m_Type);

            //var unsetMode = UIRenderer.getSettingsProperty(obj.m_Settings,"m_WidgetModeClassic")==null;
            var element = new LinkGeneratorElement(obj.m_Type,obj);

            /*
            if(unsetMode)
            {
                UIRenderer.getSettingsProperty(element.m_Settings,"m_WidgetModeClassic").value = false;
                UIRenderer.getSettingsProperty(element.m_Settings,"m_WidgetModeFlexiButtons").value = true;
            }
            */

            var unsetMode = UIRenderer.getSettingsProperty(obj.m_Settings,"m_WidgetModeFlexiButtonTextInline")==null;
            if(unsetMode)
            {
                UIRenderer.getSettingsProperty(element.m_Settings,"m_WidgetModeFlexiButtonTextInline").value = false;
                UIRenderer.getSettingsProperty(element.m_Settings,"m_WidgetModeFlexiButtonTextHover").value = true;
            }

            this.AddElementRow(element.GetElementRow());
        }
        this.PreviewInline(id);
    }
    else
        this.PreviewInline(id);

    this.ValidateButtons();
};

LinkGeneratorClass.prototype.UpgradeTypes = function(type){
    if(type == 'overlay-widget')
        type = 'overlay-widget-v1';
    return type;
};

LinkGeneratorClass.prototype.AddElementRow = function(row){
    $('#elements-list-table > tbody').append(row);
    this.SortTable();
};

LinkGeneratorClass.prototype.SortTable = function(){
    var $table=$('#elements-list-table');
    var rows = $table.find('tr').get();
    rows.sort(function(a, b) {
        var keyA = $(a).attr('id');
        var keyB = $(b).attr('id');
        if (keyA > keyB) return 1;
        if (keyA < keyB) return -1;
        return 0;
    });
    $.each(rows, function(index, row) {
        $table.children('tbody').append(row);
    });
};

LinkGeneratorClass.prototype.ShowLinkGeneratorCode = function(){

    var that = this;
    if(this.m_CurrentCodeName==null){
        this.SaveCodeToServer(false,true,true);
        return;
    }
    else
        this.SaveCodeToServer(false,true,false);

    var codeHtml = '<fieldset class="lzm-fieldset-full top-space"><legend>'+tid('get_code')+'</legend> '+tid('code_title') + '<div class="top-space">' + lzm_inputControls.createArea('livezilla-code',this.GetCodeWrapper(),'','','height:120px;width:100%;font-size:11px;font-family:Monospace;','autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"');
    codeHtml += '</div><div class="top-space-double">'+lzm_inputControls.createRadio('code-type-dynamic', 'top-space', 'code-type', '<b>Dynamic Code</b>', true)+'</div>';
    codeHtml += '<div class="left-space-child bottom-space lzm-info-text top-space-half">'+tid('code_dynamic')+'</div>';
    codeHtml += '<div class="top-space-double">'+lzm_inputControls.createRadio('code-type-static', '', 'code-type', '<b>Static Code</b>', false)+'</div>';
    codeHtml += '<div class="left-space-child lzm-info-text top-space-half">'+tid('code_static')+'</div></fieldset>';

    lzm_commonDialog.createAlertDialog(codeHtml, [{id: 'copy', name: tid('copy')}, {id: 'close', name: tid('close')}],true);

    $('#livezilla-code').click(function() {this.select();});
    $('#alert-btn-copy').click(function() {
        if(!IFManager.IsMobileOS)
        {
            var $temp = $("<textarea>");
            $("body").append($temp);
            $temp.val($('#livezilla-code').text()).select();
            document.execCommand("copy");
            $temp.remove();
            lzm_commonDialog.removeAlertDialog();
        }
    });
    $('#alert-btn-close').click(function() {
        lzm_commonDialog.removeAlertDialog();
    });
    $('.code-type').change(function() {

        if(!$('#code-type-static').attr('checked'))
            $('#livezilla-code').text(that.GetCodeWrapper());
        else
            $('#livezilla-code').text(that.GetCode(false,true));
    });

    if(this.isTypeSelected('inlay-text')||this.isTypeSelected('inlay-image')){
        $('#code-type-dynamic').parent().addClass('ui-disabled');
        $('#code-type-static').prop('checked','true');
    }

    $('.code-type').change();
};

LinkGeneratorClass.prototype.SettleStaticFields = function(from,to){
    for(var i=0;i<to.length;i++){
        var exEleme = new LinkGeneratorElement(to[i].m_Type,to[i]);
        exEleme.LoadSettings(from.m_Settings,true);
        $('#'+exEleme.GetLineId()).replaceWith(exEleme.GetElementRow());
    }
};

LinkGeneratorClass.prototype.GetCodeWrapper = function(){

    var html = '';
    //var monelem = this.GetElement('monitoring');

    html += this.GetDataPassThruObject(this.GetElement('monitoring'));

    html += '<!-- livezilla.net PLACE SOMEWHERE IN BODY -->\r\n';
    /*if(monelem != null && monelem.GetProperty('m_DelayScript').value)
    {
        html += '<script>setTimeout(function(){var s = document.createElement(\'script\');s.id=\'' + this.m_CurrentCodeId +'\';s.src=\''+DataEngine.getServerUrl('script.php',this.GetSelectedScheme())+'?id=' + this.m_CurrentCodeId +'\';document.body.appendChild(s);},'+(monelem.GetProperty('m_DelayScriptTime').value*1000)+');</script>';
    }
    else
    {*/
        html += '<script type="text/javascript" id="' + this.m_CurrentCodeId +'" src="'+DataEngine.getServerUrl('script.php',this.GetSelectedScheme())+'?id=' + this.m_CurrentCodeId +'" defer></script>';
    //}

    html += '\r\n<!-- livezilla.net PLACE SOMEWHERE IN BODY -->';
    html = html.replace(/<!--server-->/g,DataEngine.getServerUrl('server.php',this.GetSelectedScheme()));
    return html;
};

LinkGeneratorClass.prototype.GetCode = function(_preview,_setServer){

    var inlineCode='',code = '', code_elem = '';
    var elements = [];

        elements['inlay-image'] = this.GetElement('inlay-image');
        elements['inlay-text'] = this.GetElement('inlay-text');
        elements['monitoring'] = this.GetElement('monitoring');
        elements['overlay-button-v1'] = this.GetElement('overlay-button-v1');
        elements['overlay-button-v2'] = null;
        elements['overlay-widget-v1'] = null;
        elements['overlay-widget-v2'] = this.GetElement('overlay-widget-v2');
        elements['no-tracking'] = this.GetElement('no-tracking');

        var combiMode = false;
        var sid = lzm_commonTools.guid().substr(0,3);

        if(this.isTypeSelected('monitoring'))
        {
            code += this.GetDataPassThruObject(elements['monitoring']);
            var srobcode = (_preview) ? '' : ('_' + this.m_CurrentCodeId);
            code_elem = '<div id="lvztr_'+sid+'" style="display:none"></div><script id="lz_r_scr'+srobcode+'" type="text/javascript" defer><!--wm_object--><!--ec_object-->lz_code_id="'+this.m_CurrentCodeId+'";var script = document.createElement("script");script.async=true;script.type="text/javascript";var src = "<!--server--><!--addition_track-->"+Math.random();script.src=src;document.getElementById(\'lvztr_'+sid+'\').appendChild(script);</script>';//<noscript><img src="<!--server-->&quest;rqst=track&amp;output=nojcrpt" width="0" height="0" style="visibility:hidden;" alt=""></noscript>
            code_elem = code_elem.replace(/<!--addition_track-->/g,'?rqst=track&output=jcrpt' + this.GetCodeParameters('monitoring',elements['monitoring'],'&') + '&nse=');
            code += code_elem;
        }

        if(this.isTypeSelected('inlay-image'))
        {
            inlineCode += '<!-- livezilla.net PLACE WHERE YOU WANT TO SHOW GRAPHIC BUTTON -->\r\n<a href="javascript:void(window.open(\'<!--server_chat--><!--addition-->\',\'\',\'width=<!--width-->,height=<!--height-->,left=0,top=0,resizable=yes,menubar=no,location=no,status=yes,scrollbars=yes\'))" class="<!--class-->"><img src="<!--server_image-->?id=<!--image_set-->&type=inlay<!--addition-->" width="<!--image_set_width-->" height="<!--image_set_height-->" style="border:0;" alt="LiveZilla Live Chat Software"></a>';
            inlineCode = inlineCode.replace(/<!--class-->/g,'lz_cbl');
            inlineCode = inlineCode.replace(/<!--image_set-->/, elements['inlay-image'].GetProperty('m_SelectedImageSet').value);
            inlineCode = inlineCode.replace(/<!--image_set_width-->/, elements['inlay-image'].GetProperty('m_SelectedImageWidth').value);
            inlineCode = inlineCode.replace(/<!--image_set_height-->/, elements['inlay-image'].GetProperty('m_SelectedImageHeight').value);
            inlineCode = inlineCode.replace(/<!--addition-->/g,this.GetCodeParameters('inlay-image',elements['inlay-image'],'?'));
            inlineCode += '\r\n<!-- livezilla.net PLACE WHERE YOU WANT TO SHOW GRAPHIC BUTTON -->\r\n\r\n';
        }

        if(this.isTypeSelected('overlay-button-v1'))
        {
            code += '<!--hide_element_open--><a href="javascript:void(window.open(\'<!--server_chat--><!--addition-->\',\'\',\'width=<!--width-->,height=<!--height-->,left=0,top=0,resizable=yes,menubar=no,location=no,status=yes,scrollbars=yes\'))" class="<!--class-->"><img <!--img_id-->src="<!--server_image-->?id=<!--image_set-->&type=overlay" width="<!--image_set_width-->" height="<!--image_set_height-->" style="border:0px;" alt="LiveZilla Live Chat Software"></a><!--hide_element_close-->';
            code = code.replace(/<!--image_set-->/, elements['overlay-button-v1'].GetProperty('m_SelectedImageSet').value);
            code = code.replace(/<!--image_set_width-->/, elements['overlay-button-v1'].GetProperty('m_SelectedImageWidth').value);
            code = code.replace(/<!--image_set_height-->/, elements['overlay-button-v1'].GetProperty('m_SelectedImageHeight').value);
            code = code.replace(/<!--addition-->/g,this.GetCodeParameters('overlay-button-v1',elements['overlay-button-v1'],'?'));
        }

        if(this.isTypeSelected('overlay-button-v1') || this.isTypeSelected('overlay-button-v2'))
        {
            code = code.replace(/<!--img_id-->/g,'id="chat_button_image" ');
            code = code.replace(/<!--hide_element_open-->/g,'<div style=\"display:none;\">');
            code = code.replace(/<!--hide_element_close-->/g,'</div>');
            code = code.replace(/<!--class-->/g,'lz_fl');
        }

        if(this.isTypeSelected('overlay-widget-v2'))
        {
            code = code.replace(/<!--wm_object-->/g,this.GetWelcomeManagerObject(elements['overlay-widget-v2'],combiMode));
        }

        if(this.isTypeSelected('inlay-text'))
        {
            inlineCode += '<!-- livezilla.net PLACE WHERE YOU WANT TO SHOW TEXT LINK -->\r\n<a class="lz_text_link" href="javascript:void(window.open(\'<!--server_chat--><!--addition-->\',\'\',\'width=<!--width-->,height=<!--height-->,left=0,top=0,resizable=yes,menubar=no,location=no,status=yes,scrollbars=yes\'))" alt="LiveZilla Live Chat Software" data-text-online="' + lz_global_htmlentities(elements['inlay-text'].GetProperty('m_TextOnline').value) + '" data-text-offline="' + lz_global_htmlentities(elements['inlay-text'].GetProperty('m_TextOffline').value) + '" data-css-online="'+lz_global_htmlentities(elements['inlay-text'].GetProperty('m_CSSStyleOnline').value)+'" data-css-offline="'+lz_global_htmlentities(elements['inlay-text'].GetProperty('m_CSSStyleOffline').value)+'" data-online-only="'+ (elements['inlay-text'].GetProperty('m_OnlineOnly').value ? '1' : '0') +'">' + lz_global_htmlentities(elements['inlay-text'].GetProperty('m_TextOnline').value) + '</a>';
            inlineCode = inlineCode.replace(/<!--addition-->/g,this.GetCodeParameters('inlay-text',elements['inlay-text'],'?'));
            inlineCode += '\r\n<!-- livezilla.net PLACE WHERE YOU WANT TO SHOW TEXT LINK -->\r\n\r\n';
        }

        if(this.isTypeSelected('no-tracking')){
            inlineCode += '<a onclick="lz_tracking_deactivate(lz_global_base64_decode(\'<!--confirmation-->\'),<!--days-->)" href="javascript:void(0);"><!--title--></a>';
            inlineCode = inlineCode.replace(/<!--confirmation-->/g,lz_global_base64_encode(elements['no-tracking'].GetProperty('m_OptOutTrackingConfirmation').value));
            inlineCode = inlineCode.replace(/<!--title-->/g,(elements['no-tracking'].GetProperty('m_OptOutTrackingTitle').value));
            inlineCode = inlineCode.replace(/<!--days-->/g,elements['no-tracking'].GetProperty('m_OptOutTrackingTime').value);
        }

        if(code.length)
            code = '<!-- livezilla.net PLACE SOMEWHERE IN BODY -->\r\n' + code + '\r\n<!-- livezilla.net PLACE SOMEWHERE IN BODY -->';

        if(inlineCode.length)
            code = inlineCode + code;

        code = code.replace(/<!--c-->/g,'');
        code = code.replace(/<!--width-->/g,DataEngine.getConfigValue('wcl_window_width'));
        code = code.replace(/<!--height-->/g,DataEngine.getConfigValue('wcl_window_height'));
        code = code.replace(/<!--hide_element_open-->/g,'');
        code = code.replace(/<!--hide_element_close-->/g,'');
        code = code.replace(/<!--img_id-->/g,'');
        code = code.replace(/<!--addition-->/g,'');
        code = code.replace(/<!--wm_object-->/g,'');
        code = code.replace(/<!--ec_object-->/g,'');
        code = code.replace(/<!--server_image-->/g, DataEngine.getServerUrl('image.php',this.GetSelectedScheme()));
        code = code.replace(/<!--server_chat-->/g,DataEngine.getServerUrl('chat.php',this.GetSelectedScheme()));

        if(_setServer)
            code = code.replace(/<!--server-->/g,DataEngine.getServerUrl('server.php',this.GetSelectedScheme()));

    return code;
};

LinkGeneratorClass.prototype.GetWelcomeManagerObject = function(e,_combiMode){

    var object = 'lz_ovlel = ';
    if(!_combiMode)
    {
        object += '[{type:"wm",icon:"commenting"}';

        if(e.GetProperty('m_LiveChats').value)
        {
            object += ',{type:"chat",icon:"comments",counter:true';

            if(e.GetProperty('m_ChatOnlineOnly').value)
                object += ',hcwo:true';

            object += '}';
        }

        if(e.GetProperty('m_CreateTicket').value)
            object += ',{type:"ticket",icon:"envelope"}';

        if(!e.GetProperty('m_WidgetModeClassic').value)
        {
            if(e.GetProperty('m_Knowledgebase').value)
                object += ',{type:"knowledgebase",icon:"lightbulb-o",counter:true}';

            if(e.GetProperty('m_PhoneInbound').value || e.GetProperty('m_PhoneOutbound').value)
            {
                object += ',{type:"phone",icon:"phone",inbound:';

                if(e.GetProperty('m_PhoneInbound').value)
                {
                    object += '{number:"'+lz_global_base64_url_encode(e.GetProperty('m_PhoneInboundNumber').value)+'",text:"'+lz_global_base64_url_encode(e.GetProperty('m_PhoneInboundText').value)+'"}';
                }
                else
                    object += 'false';

                object += ',outbound:';
                if(e.GetProperty('m_PhoneOutbound').value)
                    object += 'true}';
                else
                    object += 'false}';
            }

            if(e.GetProperty('m_SocialMedia').value)
            {
                if(e.GetProperty('m_SocialMediaFacebook').value)
                    object += ',{type:"facebook",icon:"facebook",color:"#3b5998",margin:[0,0,20,0],href:"'+lz_global_base64_url_encode(e.GetProperty('m_SocialMediaFacebookURL').value)+'"}';

                if(e.GetProperty('m_SocialMediaTwitter').value)
                    object += ',{type:"twitter",icon:"twitter",color:"#4099FF",href:"'+lz_global_base64_url_encode(e.GetProperty('m_SocialMediaTwitterURL').value)+'"}';

                if(e.GetProperty('m_SocialMediaGoogle').value)
                    object += ',{type:"google",icon:"google-plus-official",color:"#4285F4",href:"'+lz_global_base64_url_encode(e.GetProperty('m_SocialMediaGoogleURL').value)+'"}';

                if(e.GetProperty('m_SocialMediaYoutube').value)
                    object += ',{type:"youtube",icon:"youtube",color:"#e62117",href:"'+lz_global_base64_url_encode(e.GetProperty('m_SocialMediaYoutubeURL').value)+'"}';

                if(e.GetProperty('m_SocialMediaWhatsapp').value)
                    object += ',{type:"whatsapp",icon:"whatsapp",color:"#25d043",href:"'+lz_global_base64_url_encode(e.GetProperty('m_SocialMediaWhatsappURL').value)+'"}';

                if(e.GetProperty('m_SocialMediaLinkedIn').value)
                    object += ',{type:"linkedin",icon:"linkedin",color:"#0077b5",href:"'+lz_global_base64_url_encode(e.GetProperty('m_SocialMediaLinkedInURL').value)+'"}';

                if(e.GetProperty('m_SocialMediaInstagram').value)
                    object += ',{type:"instagram",icon:"instagram",color:"#d62976",href:"'+lz_global_base64_url_encode(e.GetProperty('m_SocialMediaInstagramURL').value)+'"}';

                if(e.GetProperty('m_SocialMediaTelegram').value)
                    object += ',{type:"telegram",icon:"telegram",color:"#0088cc",href:"'+lz_global_base64_url_encode(e.GetProperty('m_SocialMediaTelegramURL').value)+'"}';

            }

            if(e.GetProperty('m_CustomLinks').value)
            {
                for(var i=1;i<=3;i++)
                    if(e.GetProperty('m_CustomLink'+i).value)
                        object += ',{type:"custom'+i+'",icon:"'+e.GetProperty('m_CustomLinkIcon'+i).value+'",title:"'+lz_global_base64_url_encode(e.GetProperty('m_CustomLinkTitle'+i).value)+'",color:"'+e.GetProperty('m_CustomLinkColor'+i).value+'",margin:[0,0,0,0],href:"'+lz_global_base64_url_encode(e.GetProperty('m_CustomLinkURL'+i).value)+'",open:"'+e.GetProperty('m_CustomLinkType'+i).value+'"}';
            }


        }
        object += '];';
    }
    else
        object += '[];';

    if(e.GetProperty('m_APIMode').value)
    {
        object += 'lz_ovlel_api = true;';
    }

    if(e.GetProperty('m_WidgetModeClassic').value)
    {
        object += 'lz_ovlel_classic = true;';
    }

    if(!e.GetProperty('m_WidgetModeClassic').value && !e.GetProperty('m_WidgetModeFlexiButtonTextHover').value)
    {
        object += 'lz_ovlel_text_inline = true;';
    }

    if(e.GetProperty('m_IconSize').value != 1)
    {
        object += 'lz_ovlel_rat = ' + e.GetProperty('m_IconSize').value + ';';
    }

    if(!e.GetProperty('m_TextDefault').value)
    {
        object += 'lz_ovlel_rt_onl = \'' + lz_global_base64_encode(e.GetProperty('m_TextOnline').value) + '\';';
        object += 'lz_ovlel_rt_ofl = \'' + lz_global_base64_encode(e.GetProperty('m_TextOffline').value) + '\';';
    }

    if(!e.GetProperty('m_WidgetIconDefault').value)
    {
        object += 'lz_ovlel_ri = \'' + e.GetProperty('m_WidgetIcon').value + '\';';
    }

    return object;
};

LinkGeneratorClass.prototype.GetDataPassThruObject = function(element){

    if(!this.isTypeSelected('monitoring'))
        return '';

    var i,fields = '';
    var fieldkeys = [111,112,113,114,116];

    for (i=0; i<10; i++)
        if(element.GetProperty('m_CustomField' + i).value.length > 0)
        {
            if(fields.length)
                fields+= ', ';
            fields += i + ':\'' + ((element.GetProperty('m_CustomField'+i).value.indexOf(LinkGeneratorClass.DataPassThruPlaceholder)!=0) ? (element.GetProperty('m_CustomField' + i).value) : element.GetProperty('m_CustomField' + i).value) + '\'';
        }

    for(var key in fieldkeys)
        if(element.GetProperty('m_Field' + fieldkeys[key]).value.length > 0)
        {
            if(fields.length)
                fields+= ', ';
            fields += fieldkeys[key] + ':\'' + ((element.GetProperty('m_Field'+fieldkeys[key]).value.indexOf(LinkGeneratorClass.DataPassThruPlaceholder)!=0) ? (element.GetProperty('m_Field' + fieldkeys[key]).value) : element.GetProperty('m_Field' + fieldkeys[key]).value) + '\'';
        }

    if(element.GetProperty('m_FieldLogoURL').value.length > 0)
    {
        if(fields.length)
            fields+= ', ';
        fields += 'header:\'' + ((element.GetProperty('m_FieldLogoURL').value.indexOf(LinkGeneratorClass.DataPassThruPlaceholder)!=0) ? (element.GetProperty('m_FieldLogoURL').value) : element.GetProperty('m_FieldLogoURL').value) + '\'';
    }

    if(element.GetProperty('m_LanguageSelect').value)
    {
        if(fields.length)
            fields+= ', ';
        fields += 'language:\'' + (element.GetProperty('m_Language').value) + '\'';
    }

    if(element.GetProperty('m_FieldArea').value)
    {
        if(fields.length)
            fields+= ', ';
        fields += 'website:\'' + ((element.GetProperty('m_FieldArea').value.indexOf(LinkGeneratorClass.DataPassThruPlaceholder)!=0) ? (element.GetProperty('m_FieldArea').value) : element.GetProperty('m_FieldArea').value) + '\'';
    }

    if(this.isTypeSelected('inlay-text'))
    {
        if(fields.length)
            fields+= ', ';
        fields += 'textlink:true';
    }

    if(fields.length)
        return '<!-- PASS THRU DATA OBJECT -->\r<script type="text/javascript">\rvar lz_data = {overwrite:false,' + fields + '};\r</script>\r<!-- PASS THRU DATA OBJECT -->\r\r';

    return '';
};

LinkGeneratorClass.prototype.GetCodeParameters = function(type,element,bind){

    var i,parameters = '';
    var defElem = new LinkGeneratorElement(type);
    var speElem = null;

    bind = (typeof bind == 'undefined') ? '?' : bind;

    if(element.GetProperty('m_TargetOperator').value){
        parameters += bind + "operator=" + encodeURIComponent(element.GetProperty('m_TargetOperatorId').value);
        bind = '&';
    }

    if(element.GetProperty('m_TargetGroup').value){
        parameters += bind + "group=" + encodeURIComponent(element.GetProperty('m_TargetGroupId').value);
        bind = '&';
    }

    if(element.GetProperty('m_HideGroups').value)
    {
        if(element.GetProperty('m_HideAllOtherGroups').value)
        {
            parameters += bind + "hg=" + lz_global_base64_url_encode('?');
            bind = '&';
        }
        else
        {
            var groups = DataEngine.groups.getGroupList('id',true,false);
            var hgroups = '';
            for (i=0; i<groups.length; i++)
                if(element.GetProperty('m_HideGroup' + md5(groups[i].id)).value)
                    hgroups += ('?' + groups[i].id);

            parameters += bind + "hg=" + lz_global_base64_url_encode(hgroups);
            bind = '&';
        }
    }

    if(type == 'inlay-image' || type == 'overlay-button-v1' || type == 'inlay-text')
    {
        if(element.GetProperty('m_FieldArea').value.length > 0){
            parameters += bind + "ptw=" + encodeURIComponent((element.GetProperty('m_FieldArea').value.indexOf(LinkGeneratorClass.DataPassThruPlaceholder)!=0) ? (element.GetProperty('m_FieldArea').value) : element.GetProperty('m_FieldArea').value);
            bind = '&';
        }

        if(element.GetProperty('m_Field111').value.length > 0){
            parameters += bind + "ptn=" + ((element.GetProperty('m_Field111').value.indexOf(LinkGeneratorClass.DataPassThruPlaceholder)!=0) ? encodeURIComponent(element.GetProperty('m_Field111').value) : element.GetProperty('m_Field111').value);
            bind = '&';
        }

        if(element.GetProperty('m_Field112').value.length > 0){
            parameters += bind + "pte=" + ((element.GetProperty('m_Field112').value.indexOf(LinkGeneratorClass.DataPassThruPlaceholder)!=0) ? encodeURIComponent(element.GetProperty('m_Field112').value) : element.GetProperty('m_Field112').value);
            bind = '&';
        }

        if(element.GetProperty('m_Field113').value.length > 0){
            parameters += bind + "ptc=" + ((element.GetProperty('m_Field113').value.indexOf(LinkGeneratorClass.DataPassThruPlaceholder)!=0) ? encodeURIComponent(element.GetProperty('m_Field113').value) : element.GetProperty('m_Field113').value);
            bind = '&';
        }

        if(element.GetProperty('m_LanguageSelect').value){
            parameters += bind + "ptl=" + encodeURIComponent(element.GetProperty('m_Language').value);
            bind = '&';
        }

        if(element.GetProperty('m_Field114').value.length > 0){
            parameters += bind + "ptq=" + ((element.GetProperty('m_Field114').value.indexOf(LinkGeneratorClass.DataPassThruPlaceholder)!=0) ? encodeURIComponent(element.GetProperty('m_Field114').value) : element.GetProperty('m_Field114').value);
            bind = '&';
        }

        if(element.GetProperty('m_Field116').value.length > 0){
            parameters += bind + "ptp=" + ((element.GetProperty('m_Field116').value.indexOf(LinkGeneratorClass.DataPassThruPlaceholder)!=0) ? encodeURIComponent(element.GetProperty('m_Field116').value) : element.GetProperty('m_Field116').value);
            bind = '&';
        }

        if(element.GetProperty('m_FieldLogoURL').value.length > 0){
            parameters += bind + "pth=" + ((element.GetProperty('m_FieldLogoURL').value.indexOf(LinkGeneratorClass.DataPassThruPlaceholder)!=0) ? encodeURIComponent(element.GetProperty('m_FieldLogoURL').value) : element.GetProperty('m_FieldLogoURL').value);
            bind = '&';
        }

        for (i=0; i<10; i++)
            if(element.GetProperty('m_CustomField' + i).value.length > 0){
                parameters += bind + 'ptcf'+i+'=' + ((element.GetProperty('m_CustomField' + i).value.indexOf(LinkGeneratorClass.DataPassThruPlaceholder)!=0) ? encodeURIComponent(element.GetProperty('m_CustomField' + i).value) : element.GetProperty('m_CustomField' + i).value);
                bind = '&';
            }
    }

    if(element.GetProperty('m_HideGroupSelectionChats').value)
    {
        parameters += bind + "hcgs=" + lz_global_base64_url_encode(1);
        bind = '&';
    }

    if(element.GetProperty('m_HideGroupSelectionTickets').value){
        parameters += bind + "htgs=" + lz_global_base64_url_encode(1);
        bind = '&';
    }

    if(element.GetProperty('m_GroupSelectionPosition').value==1){
        parameters += bind + "grot=" + lz_global_base64_url_encode(1);
        bind = '&';
    }

    if(element.GetProperty('m_ForceGroupSelection').value){
        parameters += bind + "rgs=" + lz_global_base64_url_encode(1);
        bind = '&';
    }

    if(!element.GetProperty('m_ScriptCompat').value){
        parameters += bind + "cpr=" + lzm_commonTools.SubStr(this.m_CurrentCodeId,5,false);
        bind = '&';
    }

    if(element.GetProperty('m_NoChatInvites').value){
        parameters += bind + "hinv=" + lz_global_base64_url_encode(1);
        bind = '&';
    }

    if(element.GetProperty('m_PhoneOutbound').value){
        parameters += bind + "ofc=" + lz_global_base64_url_encode(1);
        bind = '&';
    }

    if(!element.GetProperty('m_CreateTicket').value){
        parameters += bind + "nct=" + lz_global_base64_url_encode(1);
        bind = '&';
    }

    if(!element.GetProperty('m_LiveChats').value){
        parameters += bind + "hfc=" + lz_global_base64_url_encode(1);
        bind = '&';
    }

    if(element.GetProperty('m_LiveChatsGroup').value && !this.isTypeSelected('overlay-widget-v1')){
        parameters += bind + "pgc=" + lz_global_base64_url_encode(element.GetProperty('m_LiveChatsGroupId').value);
        bind = '&';
    }

    if(!element.GetProperty('m_Knowledgebase').value){
        parameters += bind + "hfk=" + lz_global_base64_url_encode(1);
        bind = '&';
    }

    if(element.GetProperty('m_Knowledgebase').value && element.GetProperty('m_KnowledgebaseCustomRoot').value && element.GetProperty('m_KnowledgebaseCustomRootFolder').value){
        parameters += bind + "ckf=" + lz_global_base64_url_encode(lz_global_trim(element.GetProperty('m_KnowledgebaseCustomRootFolder').value));
        bind = '&';
    }

    //mt
    if(element.GetProperty('m_LeaveMessageWhenOnline').value)
    {
        parameters += bind + "ovltwo=" + lz_global_base64_url_encode('1');
        bind = '&';
    }

    if(type != 'monitoring' || this.isTypeSelected('overlay-button-v2')){
        speElem = element;
        if(defElem.GetProperty('m_PrimaryColor').value != speElem.GetProperty('m_PrimaryColor').value){
            parameters += bind + "epc=" + lz_global_base64_url_encode(speElem.GetProperty('m_PrimaryColor').value);
            bind = '&';
        }
        if(defElem.GetProperty('m_SecondaryColor').value != speElem.GetProperty('m_SecondaryColor').value){
            parameters += bind + "esc=" + lz_global_base64_url_encode(speElem.GetProperty('m_SecondaryColor').value);
            bind = '&';
        }
    }
    if(type == 'monitoring' && this.isTypeSelected('inlay-image'))
    {
        speElem = this.GetElement('inlay-image');
        if(speElem.GetProperty('m_OnlineOnly').value){
            parameters += bind + "cboo=" + lz_global_base64_url_encode(1);
            bind = '&';
        }
        if(speElem.GetProperty('m_ForceGroupSelection').value){
            parameters += bind + "rgs=" + lz_global_base64_url_encode(1);
            bind = '&';
        }
    }
    if(type == 'monitoring' && (this.isTypeSelected('overlay-button-v1') || this.isTypeSelected('overlay-button-v2')))
    {
        if(this.isTypeSelected('overlay-button-v1'))
            speElem = this.GetElement('overlay-button-v1');
        else
            speElem = this.GetElement('overlay-button-v2');

        parameters += bind + "fbpos=" + (lzm_commonTools.GetPositionIndex(speElem.GetProperty('m_Position').value));
        bind = '&';
        parameters += bind + "fbw=" + (speElem.GetProperty('m_SelectedImageWidth').value);
        parameters += bind + "fbh=" + (speElem.GetProperty('m_SelectedImageHeight').value);

        if(speElem.GetProperty('m_MarginLeft').value>0)parameters += bind + "fbml=" + (speElem.GetProperty('m_MarginLeft').value);
        if(speElem.GetProperty('m_MarginTop').value>0)parameters += bind + "fbmt=" + (speElem.GetProperty('m_MarginTop').value);
        if(speElem.GetProperty('m_MarginRight').value>0)parameters += bind + "fbmr=" + (speElem.GetProperty('m_MarginRight').value);
        if(speElem.GetProperty('m_MarginBottom').value>0)parameters += bind + "fbmb=" + (speElem.GetProperty('m_MarginBottom').value);

        if(speElem.GetProperty('m_UseShadow').value){
            if(speElem.GetProperty('m_PositionX').value>0)parameters += bind + "fbshx=" + lz_global_base64_url_encode(speElem.GetProperty('m_PositionX').value);
            if(speElem.GetProperty('m_PositionY').value>0)parameters += bind + "fbshy=" + lz_global_base64_url_encode(speElem.GetProperty('m_PositionY').value);
            if(speElem.GetProperty('m_ShadowColor').value!='#000000')parameters += bind + "fbshc=" + lz_global_base64_url_encode(speElem.GetProperty('m_ShadowColor').value);
            if(speElem.GetProperty('m_Blur').value>0)parameters += bind + "fbshb=" + lz_global_base64_url_encode(speElem.GetProperty('m_Blur').value);
        }

        if(speElem.GetProperty('m_OnlineOnly').value)parameters += bind + "fboo=" + lz_global_base64_url_encode(1);
    }
    if(type == 'monitoring' && this.isTypeSelected('overlay-widget-v2'))
    {
        /*
        if(this.isTypeSelected('overlay-widget-v1'))
        {
            speElem = this.GetElement('overlay-widget-v1');
            if(!speElem.GetProperty('m_TextDefault').value && speElem.GetProperty('m_TextOnline').value.length > 0)
                parameters += bind + "ovlt=" + lz_global_base64_url_encode(speElem.GetProperty('m_TextOnline').value);
            if(!speElem.GetProperty('m_TextDefault').value && speElem.GetProperty('m_TextOnline').value.length > 0)
                parameters += bind + "ovlto=" + lz_global_base64_url_encode(speElem.GetProperty('m_TextOffline').value);
            if(defElem.GetProperty('m_SecondaryColor').value != speElem.GetProperty('m_SecondaryColor').value)
                parameters += bind + "ovlct=" + lz_global_base64_url_encode(speElem.GetProperty('m_SecondaryColor').value);
        }
        */


        speElem = this.GetElement('overlay-widget-v2');
        parameters += bind + "ovlv=" + lz_global_base64_url_encode('v2');

        if(speElem.GetProperty('m_LeaveMessageWhenOnline').value)
        {
            parameters += bind + "ovltwo=" + lz_global_base64_url_encode('1');
            bind = '&';
        }

        if(speElem.GetProperty('m_LiveChatsGroup').value)
        {
            parameters += bind + "pgc=" + lz_global_base64_url_encode(speElem.GetProperty('m_LiveChatsGroupId').value);
            bind = '&';
        }


        parameters += bind + "ovlc=MQ__";
        bind = '&';

        parameters += bind + "esc=" + lz_global_base64_url_encode(speElem.GetProperty('m_SecondaryColor').value);
        bind = '&';

        parameters += bind + "epc=" + lz_global_base64_url_encode(speElem.GetProperty('m_PrimaryColor').value);
        bind = '&';

        if(!speElem.GetProperty('m_HeaderTextShadow').value)
            parameters += bind + "ovlts=" + lz_global_base64_url_encode('0');

        if(lzm_commonTools.GetPositionIndex(speElem.GetProperty('m_Position').value) != '22')
            parameters += bind + "ovlp=" + lz_global_base64_url_encode(lzm_commonTools.GetPositionIndex(speElem.GetProperty('m_Position').value));

        if(speElem.GetProperty('m_MarginLeft').value>0)parameters += bind + "ovlml=" + lz_global_base64_url_encode(speElem.GetProperty('m_MarginLeft').value);
        if(speElem.GetProperty('m_MarginTop').value>0)parameters += bind + "ovlmt=" + lz_global_base64_url_encode(speElem.GetProperty('m_MarginTop').value);

        if((!this.isTypeSelected('overlay-widget-v2') && speElem.GetProperty('m_MarginRight').value>0) || (this.isTypeSelected('overlay-widget-v2') && speElem.GetProperty('m_MarginRight').value != 40))
            parameters += bind + "ovlmr=" + lz_global_base64_url_encode(speElem.GetProperty('m_MarginRight').value);

        if((!this.isTypeSelected('overlay-widget-v2') && speElem.GetProperty('m_MarginBottom').value>0) || (this.isTypeSelected('overlay-widget-v2') && speElem.GetProperty('m_MarginBottom').value != 30))
            parameters += bind + "ovlmb=" + lz_global_base64_url_encode(speElem.GetProperty('m_MarginBottom').value);

        if(speElem.GetProperty('m_UseShadow').value){
            if(speElem.GetProperty('m_PositionX').value>0)parameters += bind + "ovlsx=" + lz_global_base64_url_encode(speElem.GetProperty('m_PositionX').value);
            if(speElem.GetProperty('m_PositionY').value>0)parameters += bind + "ovlsy=" + lz_global_base64_url_encode(speElem.GetProperty('m_PositionY').value);
            if(speElem.GetProperty('m_ShadowColor').value!='#000000')parameters += bind + "ovlsc=" + lz_global_base64_url_encode(speElem.GetProperty('m_ShadowColor').value);
            if(speElem.GetProperty('m_Blur').value>0)parameters += bind + "ovlsb=" + lz_global_base64_url_encode(speElem.GetProperty('m_Blur').value);
        }

        // 8.0.0.8
        if(!speElem.GetProperty('m_Knowledgebase').value)
        {
            parameters += bind + "hfk=" + lz_global_base64_url_encode(1);
            bind = '&';
        }

        // 8.0.0.8
        if(speElem.GetProperty('m_Knowledgebase').value && speElem.GetProperty('m_KnowledgebaseCustomRoot').value && speElem.GetProperty('m_KnowledgebaseCustomRootFolder').value)
        {
            parameters += bind + "ckf=" + lz_global_base64_url_encode(lz_global_trim(speElem.GetProperty('m_KnowledgebaseCustomRootFolder').value));
            bind = '&';
        }

        if(speElem.GetProperty('m_OnlineOnly').value)
            parameters += bind + "ovloo=" + lz_global_base64_url_encode('1');

        if(speElem.GetProperty('m_ShowOnlyWhenInvited').value)
            parameters += bind + "ovlio=" + lz_global_base64_url_encode('1');

        if(speElem.GetProperty('m_OpenExternalWindow').value)
            parameters += bind + "ovloe=" + lz_global_base64_url_encode('1');

        if(speElem.GetProperty('m_PhoneHide').value)
            parameters += bind + "hots=" + lz_global_base64_url_encode('1');

        if(speElem.GetProperty('m_TabletHide').value)
            parameters += bind + "hott=" + lz_global_base64_url_encode('1');

        if(speElem.GetProperty('m_PhoneExternal').value)
            parameters += bind + "oets=" + lz_global_base64_url_encode('1');

        if(speElem.GetProperty('m_TabletExternal').value)
            parameters += bind + "oett=" + lz_global_base64_url_encode('1');

        if(speElem.GetProperty('m_PopOut').value)
            parameters += bind + "ovlapo=" + lz_global_base64_url_encode('1');

        if(speElem.GetProperty('m_BorderRadius').value != 6)
            parameters += bind + "ovlbr=" + lz_global_base64_url_encode(speElem.GetProperty('m_BorderRadius').value);

        if(!speElem.GetProperty('m_DimensionsAuto').value){
            parameters += bind + "ovlw=" + lz_global_base64_url_encode(speElem.GetProperty('m_DimensionsWidth').value);
            parameters += bind + "ovlh=" + lz_global_base64_url_encode(speElem.GetProperty('m_DimensionsHeight').value);
        }
    }
    return parameters;
};

LinkGeneratorClass.prototype.LoadImageSets = function(type){
    var that = this;
    $('#image-sets-list-table tbody').empty();
    that.m_MaxImageSetId = 0;
    CommunicationEngine.pollServerDiscrete('get_banner_list').done(function(data) {
        var xmlDoc = $.parseXML($.trim(data));
        var offlineButton, onlineButton = null;
        var toSelectIndex = 0, cindex = 0;
        $(xmlDoc).find('button').each(function(){
            var buttonxml = $(this);
            var button = {imagetype: lz_global_base64_decode(buttonxml.attr('t')), type:lz_global_base64_decode(buttonxml.attr('type')),name:lz_global_base64_decode(buttonxml.attr('name')),data:lz_global_base64_decode(buttonxml.attr('data'))};
            if((type.indexOf('inlay') != -1 && button.name.indexOf('inlay') == -1) || (type.indexOf('overlay') != -1 && button.name.indexOf('overlay') == -1))
                return true;
            var dataId = lz_global_base64_decode(buttonxml.attr('id'));
            that.m_MaxImageSetId = Math.max(that.m_MaxImageSetId,dataId);
            if(lz_global_base64_decode(buttonxml.attr('o'))==0){
                offlineButton = button;
                var id = md5(onlineButton.name);
                var buttonName = lz_global_base64_decode(buttonxml.attr('type')) + " " + lz_global_base64_decode(buttonxml.attr('id'));
                $('#image-sets-list-table > tbody').append('<tr id="'+id+'" data-id="'+dataId+'" data-width="0" data-height="0" data-button="'+lz_global_base64_url_encode(JSON.stringify([onlineButton,offlineButton]))+'" onclick="selectLinkGeneratorImage(\'' +id+ '\');" class="image-sets-list-line"><td style="width:20px;" class="text-center spaced"><i class="fa fa-image icon-large"></i></td><td>'+buttonName+'</td></tr>');

                var img = new Image();
                img.onload = function(){
                    $('#' + id).attr('data-width',this.width);
                    $('#' + id).attr('data-height',this.height);
                    $('tr','#image-sets-list-table > tbody').eq(toSelectIndex).click();
                };
                img.src = 'data:image/'+button.imagetype+';base64,' + onlineButton.data;


                if(dataId == $('#m_SelectedImageSet').val())
                    toSelectIndex = cindex;
                cindex++;
            }
            else{
                onlineButton = button;
            }
        });
    }).fail(function(jqXHR, textStatus, errorThrown){alert("ERR: 1x228149 (" + textStatus + ")");});
};

LinkGeneratorClass.prototype.GetSelectedScheme = function(){

    var prot = '//';
    var firstElm = this.GetElement('first');

    if(firstElm != null && firstElm.GetProperty('m_ProtocolHTTP').value)
        prot = 'http://';
    else if(firstElm != null && firstElm.GetProperty('m_ProtocolHTTPS').value)
        prot = 'https://';

    return prot;
};

function LinkGeneratorElement(_type,_cloneObj) {

    var that = this;
    var al = ChatTranslationEditorClass.AvailableLanguages.server;
    var hiddenGroupList = [], routingOpArray = [], routingGrArray = [], dynGroupArray = [], langArray = [];

    for (i=0; i<al.length; i++)
        langArray.push({value: al[i].code, text: al[i].code.toUpperCase() + ' - ' + al[i].name});

    for(var i=0;i<DataEngine.groups.idList.length;i++){
        var groupObj = DataEngine.groups.getGroup(DataEngine.groups.idList[i]);
        if(typeof groupObj.members != 'undefined')
            dynGroupArray.push({value: DataEngine.groups.idList[i], text: groupObj.name});
    }
    if(dynGroupArray.length==0)
        dynGroupArray.push({value: 'no_dyn_group', text: tid('no_dyn_group')});

    var operators = DataEngine.operators.getOperatorList('name','',true,false);
    for (i=0; i<operators.length; i++)
        routingOpArray.push({value: operators[i].userid, text: operators[i].name});

    var groups = DataEngine.groups.getGroupList('id',true,false);

    for (i=0; i<groups.length; i++)
    {
        routingGrArray.push({value: groups[i].id, text: groups[i].id});
        hiddenGroupList.push({name:'m_HideGroup' + md5(groups[i].id), static:true, type:'bool', class:'m_HideGroups m_HideAllOtherGroups', value: false, title: groups[i].id, left:'single'});
    }

    var iconList = [];
    for(var key in lz_icons)
        iconList.push({value: lz_icons[key].name, text: lz_icons[key].name});

    var typeList = [{value: 'external', text: tid('new_window')},{value: 'internal', text: 'IFRAME'}];

    this.m_Icons = [];
    this.m_Icons['inlay-image']={icon:'fa fa-image',iconcss:'font-size:32px;'};
    this.m_Icons['inlay-text']={icon:'fa fa-navicon',iconcss:''};
    this.m_Icons['overlay-button-v1']={icon:'fa fa-arrows-v',iconcss:'margin-left:10px;'};
    this.m_Icons['overlay-button-v2']={icon:'fa fa-arrows-v',iconcss:'margin-left:10px;'};
    this.m_Icons['overlay-widget-v1']={icon:'fa fa-square-o',iconcss:'margin-left:4px;'};
    this.m_Icons['overlay-widget-v2']={icon:'fa fa-square-o',iconcss:'margin-left:4px;'};
    this.m_Icons['monitoring']={icon:'fa fa-search',iconcss:''};
    this.m_Icons['no-tracking']={icon:'fa fa-shield',iconcss:'margin-left:4px;'};

    this.m_Settings = [
        {name:'General', title: t('General'), groups: [
            {name: 'Protocol', title: tid('protocol'), controls: [
                {name:'m_ProtocolHTTP', type:'radio', group: 'prot-select', value: false, title: 'HTTP&nbsp;&nbsp;<span class="bg-red text-white text-box">' + tid('no_mixed_mode') + '</span>'},
                {name:'m_ProtocolHTTPS', type:'radio', group: 'prot-select', value: false, top:'half', title: 'HTTPS'},
                {name:'m_ProtocolAuto', type:'radio', group: 'prot-select', value: true, top:'half', title: tid('auto_detect')}
            ]},
            {name: 'Mode', title: tid('mode'), controls: [
                {name:'m_WidgetModeClassic', type:'radio', group: 'widget-mode', value: false, title: 'Classic', static: true},
                {name:'m_WidgetModeFlexiButtons', type:'radio', group: 'widget-mode', value: true, top:'half', title: 'Flexi Buttons', static: true},
                {name:'m_WidgetModeFlexiButtonTextInline', type:'radio', group: 'widget-flexi-text-mode', value: false, left: 'single', top:'half', title: 'Inline Text', static: true},
                {name:'m_WidgetModeFlexiButtonTextHover', type:'radio', group: 'widget-flexi-text-mode', value: true, left: 'single', top:'half', title: 'Hover Text', static: true}
            ], not: ['monitoring','overlay-widget-v1','inlay-image','inlay-text','overlay-button-v1']},
            {name: 'Icon', title: 'Icon', controls: [
                {name:'m_WidgetIconDefault', type:'bool', value: true, title: tid('use_default')},
                {name:'m_WidgetIcon', class:'m_WidgetIcon',top:'half', left: 'single', type:'array', value: '0', options: iconList, title: '',titleleft:''}
            ], not: ['monitoring','overlay-widget-v1','inlay-image','inlay-text','overlay-button-v1']},
            {name: 'General', title: t('General'), controls: [
                {name:'m_OnlineOnly', type:'bool', value: false, title: tid('online_only')},
                {name:'m_ShowOnlyWhenInvited', type:'bool', value: false, title: t('Invite only (hide unless there is a chat invite)'), not: ['inlay-image','inlay-text','overlay-button-v1','overlay-button-v2']},
                {name:'m_OpenExternalWindow', type:'bool', value: false, title: t('Open external Chat Window'), not: ['inlay-image','inlay-text','overlay-button-v1','overlay-button-v2']},
                {name:'m_PopOut', type:'bool', value: true, title: t('Allow "Popout" (switch from on-site to off-site chat)'), not: ['inlay-image','inlay-text','overlay-button-v1','overlay-button-v2']},
                {name:'m_LeaveMessageWhenOnline', type:'bool', value: false, title: t('Visitors can leave a message when operators are online')}
                //{name:'m_DelayScript', type:'bool', value: false, title: tid('delay_script'), static: true},
                //{name:'m_DelayScriptTime', type:'int', class:'m_DelayScript', value: 5, title: '', left:'single', titleright:tid('seconds'), top: 'half', static: true}
            ], not: ['monitoring']},
            {name: 'GUILanguage', title: t('GUI Language'), controls: [
                {name:'m_LanguageAuto', type:'radio', group: 'language-select', value: true, title: t('Automatic (Browser Language)'), static: true},
                {name:'m_LanguageSelect', type:'radio', group: 'language-select', value: false, title: tidc('language'), static: true},
                {name:'m_Language', type:'array', value: 'auto', options: langArray, left: 'single', top:'half', static: true}
            ]},
            {name: 'TouchDevices', title: t('TouchDevices'), controls: [
                {name:'m_TouchDevicesPhone', type:'label', title: t('Phone')},
                {name:'m_PhoneHide', type:'bool', value:false, title: t('Hide on Smartphones')},
                {name:'m_PhoneExternal', type:'bool', value: false, title: t('Open external Chat Window')},
                {name:'m_TouchDevicesTablet', type:'label', title: t('Tablet'), top:'single'},
                {name:'m_TabletHide', type:'bool', value: false, title: t('Hide on Tablets')},
                {name:'m_TabletExternal', type:'bool', value: false, title: t('Open external Chat Window')}
            ], not: ['inlay-image','inlay-text','overlay-button-v1','overlay-button-v2','monitoring']}
        ], not:['no-tracking']},
        {name:'Colors', title: t('Colors'), groups: [
            {name: 'Colors', title: t('Colors'), controls: [
                {name:'m_PrimaryColor', type:'color', value:'#3091f2', title: tidc('primary_color')},
                {name:'m_SecondaryColor', type:'color', value:'#2e8ae5', top:'single',title: tidc('secondary_color')},
                {name:'m_HeaderTextShadow', type:'bool', value: false, title: tid('header_text_shadow'), not: ['inlay-image' ,'inlay-text' ,'overlay-button-v1' ,'overlay-button-v2','overlay-widget-v2' ,'monitoring' ,'no-tracking']}
            ]}
        ],not:['no-tracking']},
        {name:'Images', title: t('Images'), groups: [
            {name: 'Images', title: t('Images'), controls: [
                {name:'m_SelectedImageSet', type:'hidden', value: 0},
                {name:'m_SelectedImageWidth', type:'hidden', value: 0},
                {name:'m_SelectedImageHeight', type:'hidden', value: 0}
            ], custom: true }
        ], not:['inlay-text', 'overlay-widget-v1','overlay-widget-v2','monitoring' ,'no-tracking']},
        {name:'Services', title: t('Services'), groups: [
            {name: 'Live Chats', title: tid('chats'), controls: [
                {name:'m_LiveChats', type:'bool', value: true, title: tid('chats')},
                {name:'m_LiveChatsPrivate', type:'radio', group: 'live-chat-select', value: true, top:'half', title: tid('private_convo'), left: 'single'},
                {name:'m_LiveChatsGroup', type:'radio', group: 'live-chat-select', value: false,top:'half', title: tidc('public_convo'), left: 'single', not:['overlay-widget-v1']},
                {name:'m_LiveChatsGroupId', type:'array', value:'no_dyn_group', options: dynGroupArray, left: 'double',bottom:'single',top:'half', not:['overlay-widget-v1']},
                {name:'m_ChatOnlineOnly', type:'bool',left: 'single', value: false, title: tid('online_only')}
            ]},
            {name: 'Tickets', title: tid('tickets'), controls: [
                {name:'m_CreateTicket', type:'bool', value: true, title: tid('create_ticket')}
            ]},
            {name: 'Knowledgebase', title: tid('knowledgebase'), controls: [
                {name:'m_Knowledgebase', type:'bool', value: false, title: tid('knowledgebase')},
                {name:'m_KnowledgebaseMainRoot', type:'radio', class:'m_Knowledgebase', group: 'knowledgebase_root', value: true, top:'half', title: tid('knowledgebase_default_root'), left:'single', static:true},
                {name:'m_KnowledgebaseCustomRoot', type:'radio', class:'m_Knowledgebase', group: 'knowledgebase_root', value: false,top:'half', title: tid('knowledgebase_custom_root'), left:'single', static:true},
                {name:'m_KnowledgebaseCustomRootFolder', type:'string', class:'m_Knowledgebase', value: '', title: '', left:'double', top:'half',bottom:'single',static:true}
            ]},
            {name: 'Phone', title: t('Phone'), controls: [
                {name:'m_PhoneOutbound', type:'bool', value: false, title: t('Phone Outbound (Callback Service)')},
                {name:'m_PhoneInbound', type:'bool', value: false, top:'single', title: t('Phone Inbound (Hotline)'), not:['monitoring','overlay-widget-v1','inlay-text', 'inlay-image']},
                {name:'m_PhoneInboundNumber', type:'string', value: '', title: t('Phone:'), left:'single', top:'single', not:['monitoring','overlay-widget-v1','inlay-text', 'inlay-image']},
                {name:'m_PhoneInboundText', type:'string', value: '', title: t('Info Text:'), left:'single', top:'single', bottom:'single', not:['monitoring','overlay-widget-v1','inlay-text', 'inlay-image']}
            ],not:['overlay-widget-v1']},
            {name: 'Custom Links', title: t('Custom Links'), controls: [
                {name:'m_CustomLinks', type:'bool', value: false, title: t('Custom Links')},
                {name:'m_CustomLink1', class:'m_CustomLinks', type:'bool', value: false, title: t('Custom Link')+" 1"},
                {name:'m_CustomLinkType1', class:'m_CustomLink1', type:'array', value: '0', options: typeList, title: '',titleleft:tidc('open')},
                {name:'m_CustomLinkTitle1', class:'m_CustomLink1', type:'string', value: '', title: '',titleleft:tidc('title')},
                {name:'m_CustomLinkURL1', class:'m_CustomLink1', type:'string', value: '', title: '',titleleft:tidc('url')},
                {name:'m_CustomLinkColor1', class:'m_CustomLink1', type:'string', value: '', title: '',titleleft:tidc('color')},
                {name:'m_CustomLinkIcon1', class:'m_CustomLink1', type:'array', value: '0', options: iconList, title: '',titleleft:'Icon:'},
                {name:'m_CustomLink2', class:'m_CustomLinks',type:'bool', value: false, title: t('Custom Link')+" 2"},
                {name:'m_CustomLinkType2', class:'m_CustomLink2', type:'array', value: '0', options: typeList, title: '',titleleft:tidc('open')},
                {name:'m_CustomLinkTitle2',class:'m_CustomLink2', type:'string', value: '', title: '',titleleft:tidc('title')},
                {name:'m_CustomLinkURL2',class:'m_CustomLink2', type:'string', value: '', title: '',titleleft:tidc('url')},
                {name:'m_CustomLinkColor2', class:'m_CustomLink2', type:'string', value: '', title: '',titleleft:tidc('color')},
                {name:'m_CustomLinkIcon2', class:'m_CustomLink2', type:'array', value: '0', options: iconList, title: '',titleleft:'Icon:'},
                {name:'m_CustomLink3', class:'m_CustomLinks', type:'bool', value: false, title: t('Custom Link')+" 3"},
                {name:'m_CustomLinkType3', class:'m_CustomLink3', type:'array', value: '0', options: typeList, title: '',titleleft:tidc('open')},
                {name:'m_CustomLinkTitle3',class:'m_CustomLink3', type:'string', value: '', title: '',titleleft:tidc('title')},
                {name:'m_CustomLinkURL3',class:'m_CustomLink3', type:'string', value: '', title: '',titleleft:tidc('url')},
                {name:'m_CustomLinkColor3', class:'m_CustomLink3', type:'string', value: '', title: '',titleleft:tidc('color')},
                {name:'m_CustomLinkIcon3', class:'m_CustomLink3', type:'array', value: '0', options: iconList, title: '',titleleft:'Icon:'}
            ], not:['overlay-widget-v1' ,'monitoring', 'inlay-image','inlay-text','overlay-button-v1'], custom: true},
            {name: 'SocialMedia', title: t('Social Media'), controls: [
                {name:'m_SocialMedia', type:'bool', value: false, title: t('Social Media')},
                {name:'m_SocialMediaFacebook', class:'m_SocialMedia',type:'bool', value: false, title: t('Facebook')},
                {name:'m_SocialMediaFacebookURL',class:'m_SocialMediaFacebook',  type:'string', value:'', title:'',titleleft:tidc('url')},
                {name:'m_SocialMediaTwitter', class:'m_SocialMedia',type:'bool', value: false, title: t('Twitter')},
                {name:'m_SocialMediaTwitterURL', class:'m_SocialMediaTwitter', type:'string', value:'', title:'',titleleft:tidc('url')},
                {name:'m_SocialMediaGoogle', class:'m_SocialMedia',type:'bool', value: false, title: t('Google')},
                {name:'m_SocialMediaGoogleURL', class:'m_SocialMediaGoogle', type:'string', value:'', title:'',titleleft:tidc('url')},
                {name:'m_SocialMediaYoutube', class:'m_SocialMedia',type:'bool', value: false, title: t('Youtube')},
                {name:'m_SocialMediaYoutubeURL', class:'m_SocialMediaYoutube', type:'string', value:'', title:'',titleleft:tidc('url')},
                {name:'m_SocialMediaWhatsapp', class:'m_SocialMedia',type:'bool', value: false, title: 'Whatsapp'},
                {name:'m_SocialMediaWhatsappURL', class:'m_SocialMediaWhatsapp', type:'string', value:'', title:'',titleleft:tidc('url')},
                {name:'m_SocialMediaLinkedIn', class:'m_SocialMedia',type:'bool', value: false, title: 'LinkedIn'},
                {name:'m_SocialMediaLinkedInURL', class:'m_SocialMediaLinkedIn', type:'string', value:'', title:'',titleleft:tidc('url')},
                {name:'m_SocialMediaInstagram', class:'m_SocialMedia',type:'bool', value: false, title: 'Instagram'},
                {name:'m_SocialMediaInstagramURL', class:'m_SocialMediaInstagram', type:'string', value:'', title:'',titleleft:tidc('url')},
                {name:'m_SocialMediaTelegram', class:'m_SocialMedia',type:'bool', value: false, title: 'Telegram'},
                {name:'m_SocialMediaTelegramURL', class:'m_SocialMediaTelegram', type:'string', value:'', title:'',titleleft:tidc('url')}
            ], not:['overlay-widget-v1' , 'monitoring', 'inlay-image','inlay-text','overlay-button-v1'], custom: true}
        ], not:['monitoring','no-tracking']},
        {name:'Position', title: t('Position'), groups: [
            {name: 'Position', title: t('Position'), controls: [
                {name:'m_Position', type:'position', value:'left middle', title: t('')}
            ]}
        ], not:['inlay-image' ,'inlay-text' ,'monitoring' ,'no-tracking','overlay-widget-v2']},
        {name:'Margin', title: t('Margin'), groups: [
            {name: 'Margin', title: t('Margin'), controls: [
                {name:'m_MarginTop', type:'int', value:0, title: t('Top:'), not:['overlay-widget-v2'],titleright:'px'},
                {name:'m_MarginRight', type:'int', value:40, title: t('Right:'), top: 'single',titleright:'px'},
                {name:'m_MarginBottom', type:'int', value:30, title: t('Bottom:'), top: 'single',titleright:'px'},
                {name:'m_MarginLeft', type:'int', value:0, title: t('Left:'), top: 'single', not:['overlay-widget-v2'],titleright:'px'}
            ]}
        ], not:['inlay-image' ,'inlay-text' ,'monitoring' ,'no-tracking']},
        {name:'Shadow', title: t('Shadow'), groups: [
            {name: 'Shadow', title: t('Shadow'), controls: [
                {name:'m_UseShadow', type:'bool', value: false, title: t('Shadow')},
                {name:'m_ShadowColor', type:'color', class:'m_UseShadow', value:'#696969', title: t('Color:'), left:'single', top: 'single'},
                {name:'m_PositionX', type:'int', class:'m_UseShadow', value: 0, title: t('X-Position'), left:'single'},
                {name:'m_PositionY', type:'int', class:'m_UseShadow', value: 0, title: t('Y-Position:'), left:'single', top: 'single'},
                {name:'m_Blur', type:'int', class:'m_UseShadow', value: 0, title: t('Blur:'), left:'single', top: 'single'}
            ]}
        ], not:['inlay-image' ,'inlay-text' ,'monitoring' ,'no-tracking','overlay-widget-v2']},
        {name:'Texts', title: tid('texts'), groups: [
            {name: 'Texts', title: tid('texts'), controls: [
                {name:'m_TextDefault', type:'bool', value: true, title: t('Use Default')},
                {name:'m_TextOnline', type:'string', value: tid('inlay_text_online'), title: tid('online'), left: 'single', top: 'single'},
                {name:'m_TextOffline', type:'string', value: tid('inlay_text_offline'), title: tid('offline'), top: 'single', bottom: 'single', left: 'single'}
            ]},
            {name: 'Texts', title: tid('css'), controls: [
                {name:'m_CSSStyleOnline', type:'string', value: '', title: tid('css_style_online')},
                {name:'m_CSSStyleOffline', type:'string', value: '', title: tid('css_style_offline'), top: 'single'}
            ], not:['overlay-widget-v1','overlay-widget-v2']}
        ], not:['inlay-image','monitoring','overlay-button-v1','overlay-button-v2','no-tracking']},
        {name:'Script', title: t('Script'), groups: [
            {name: 'Script', title: t('Script'), controls: [
                {name:'m_AdditionalHTML', type:'area', value:'', title: t('Custom HTML:')}
            ]}
        ], not:['overlay-widget-v1','overlay-widget-v2' ,'monitoring', 'inlay-image','inlay-text','overlay-button-v1','no-tracking']},
        {name:'Routing', title: t('Routing'), groups: [
            {name: 'Operator', title: tid('operator'), controls: [
                {name:'m_TargetOperator', type:'bool', value: false, title: tid('target_operator'), static:true},
                {name:'m_TargetOperatorId', type:'array',top:'half', value: '', options: routingOpArray, left:'single', static:true}
            ]},
            {name: 'Group', title: t('Group'), controls: $.merge([
                {name:'m_TargetGroup', type:'bool', value: false, title: t('Target Group:'), static:true},
                {name:'m_TargetGroupId', type:'array',top:'half', value: '', options: routingGrArray, left:'single', static:true},
                {name:'m_HideGroups', type:'bool', value: false, title: t('Hide Groups'), top:'single', static:true},
                {name:'m_HideAllOtherGroups', class:'m_HideGroups', type:'bool', value: false, title: t('Hide all other groups'), top:'half', left:'single', static:true}
            ],hiddenGroupList)}
        ], not:['no-tracking']},
        {name:'Dimensions', title: t('Dimensions'), groups: [
            {name: 'Dimensions', title: t('Dimensions'), controls: [
                {name:'m_DimensionsAuto', type:'bool', value: true, title: tid('automatic')},
                {name:'m_DimensionsWidth', type:'int', value: '280', left:'single', title: t('Width:')+' (px)', top:'single'},
                {name:'m_DimensionsHeight', type:'int', value: '500', left:'single', title: t('Height:')+' (px)', top:'single'}
            ]},
            {name: 'Border Radius', title: tid('border_radius'), controls: [
                {name:'m_BorderRadius', type:'int', value: '6', title:tid('border_radius')+': (px)'}
            ]},
            {name: 'Icon Size', title: 'Icons', controls: [
                {name:'m_IconSize', type:'array', value: '1.2', options: [{value: 0.8, text: tid('very_small')},{value: 1, text: tid("small")},{value: 1.2, text: tid('medium')},{value: 1.4, text: tid('large')}]}
            ],not:['inlay-image' ,'inlay-text' ,'overlay-button-v1' ,'overlay-button-v2' ,'overlay-widget-v1' ,'no-tracking' ,'monitoring']}
        ], not:['inlay-image' ,'inlay-text' ,'overlay-button-v1' ,'overlay-button-v2' ,'no-tracking' ,'monitoring']},
        {name:'OptOutTracking', title: tid('no-tracking'), groups: [
            {name: 'OptOutTracking', title: tid('no-tracking'), controls: [
                {name:'m_OptOutTrackingTitle', type:'string', value: t('I want to deactivate tracking'), title: t('Link Title:')},
                {name:'m_OptOutTrackingConfirmation', type:'area', value:t('Thank you. Tracking has been deactivated.'), title: t('Confirmation Text:')},
                {name:'m_OptOutTrackingTime', type:'int', value: 10, title: t('Exclusion period (days):'), top: 'single'}
            ]}
        ], not:['inlay-image' ,'inlay-text' ,'overlay-button-v1' ,'overlay-button-v2' ,'overlay-widget-v1','overlay-widget-v2' ,'monitoring']},
        {name:'Advanced', title: tid('advanced'), groups: [
            {name: 'Parameters', title: tid('parameters'), controls: [
                {name:'m_ChatStartsInstantly', type:'bool', value: false, title: tid('instant_chat'), not:['all']},
                {name:'m_HideGroupSelectionChats', type:'bool', value: false, title: tid('hide_group_select_chats'), not:['monitoring'], static:true},
                {name:'m_HideGroupSelectionTickets', type:'bool', value: false, title: tid('hide_group_select_tickets'), not:['monitoring'], static:true},
                {name:'m_ForceGroupSelection', type:'bool', value: false, title: tid('require_select_group'), not:['monitoring'], static:true},
                {name:'m_NoChatInvites', type:'bool', value: false, title: tid('no_invite_code'), static: true},
                {name:'m_GroupSelectionPosition', type:'array', value: '0', options: [{value: 0, text: tid('group_below')},{value: 1, text: tid('group_above')}], left:'half', top: 'single', bottom:'single', not:['monitoring'], static:true},
                {name:'m_ScriptCompat', type:'bool', value: true, title: tid('script_compat'), static: true}
            ]}
        ],not:['no-tracking']},
        {name:'APIMode', title: 'API Mode', groups: [
            {name: 'APIModeSettings', title: tid('settings'), controls: [
                {name:'m_APIMode', type:'bool', value: false, title: 'API Mode (widget will be hidden until Show command is called)'},
                {name:'m_APIModeDocs', type:'link', value: 'https://www.livezilla.net/widgetapi/en/', title: tid('further_information'), top:'double', persistent: false}
            ]}
        ],not:['inlay-image' ,'inlay-text' ,'overlay-button-v1' ,'overlay-button-v2' ,'overlay-widget-v1','monitoring','no-tracking'], custom: true},
        {name:'Data', title: tid('data'), groups: [
            {name: 'StandardInputFields', title: tid('standard_input_fields'), controls: [
                {name:'m_UsePassThruStandard', type:'bool', value: false, title: tid('use_pass_thru'), static:true},
                {name:'m_PassThruStandardLink', type:'link', value: 'https://chat.livezilla.net/knowledge-base/advanced-features/en-passthrudata/', title: tid('pass_thru_link'), left:'single', top:'falf', persistent: false},
                {name:'m_Field111', type:'string', class:'m_UsePassThruStandard', dataattr: 'Name', value: '', title: tid('name') + ':', top:'single', static:true},
                {name:'m_Field112', type:'string', class:'m_UsePassThruStandard', dataattr: 'Email', value: '', title: tid('email') + ':', top:'single', static:true},
                {name:'m_Field113', type:'string', class:'m_UsePassThruStandard', dataattr: 'Company', value: '', title: tid('company') + ':', top:'single', static:true},
                {name:'m_Field114', type:'string', class:'m_UsePassThruStandard', dataattr: 'Question', value: '', title: tid('question') + ':', top:'single', static:true},
                {name:'m_Field116', type:'string', class:'m_UsePassThruStandard', dataattr: 'Phone', value: '', title: tid('phone') + ':', top:'single', static:true},
                {name:'m_FieldArea', type:'string', class:'m_UsePassThruStandard', dataattr: 'Area', value: '', title: tid('website_name') + ':', top:'single', static:true},
                {name:'m_FieldLogoURL', type:'string', class:'m_UsePassThruStandard', dataattr: 'Logo', value: '', title: tid('logo_url'), top:'single', bottom:'single', static:true}
            ]},
            {name: 'CustomInputFields', title: tid('custom_input_fields'), controls: [
                {name:'m_UsePassThruCustom', type:'bool', value: false, title: tid('use_pass_thru'), static:true},
                {name:'m_PassThruCustomLink', type:'link', value: 'https://chat.livezilla.net/knowledge-base/advanced-features/en-passthrudata/', title: tid('pass_thru_link'), left:'single', top:'falf', persistent: false},
                {name:'m_CustomField0', class:'m_UsePassThruCustom', type:'string', dataattr: 'CustomField1', value: '', title: tid('custom_field') + ' 1:', top:'single', static:true},
                {name:'m_CustomField1', class:'m_UsePassThruCustom', type:'string', dataattr: 'CustomField2', value: '', title: tid('custom_field') + ' 2:', top:'single', static:true},
                {name:'m_CustomField2', class:'m_UsePassThruCustom', type:'string', dataattr: 'CustomField3', value: '', title: tid('custom_field') + ' 3:', top:'single', static:true},
                {name:'m_CustomField3', class:'m_UsePassThruCustom', type:'string', dataattr: 'CustomField4', value: '', title: tid('custom_field') + ' 4:', top:'single', static:true},
                {name:'m_CustomField4', class:'m_UsePassThruCustom', type:'string', dataattr: 'CustomField5', value: '', title: tid('custom_field') + ' 5:', top:'single', static:true},
                {name:'m_CustomField5', class:'m_UsePassThruCustom', type:'string', dataattr: 'CustomField6', value: '', title: tid('custom_field') + ' 6:', top:'single', static:true},
                {name:'m_CustomField6', class:'m_UsePassThruCustom', type:'string', dataattr: 'CustomField7', value: '', title: tid('custom_field') + ' 7:', top:'single', static:true},
                {name:'m_CustomField7', class:'m_UsePassThruCustom', type:'string', dataattr: 'CustomField8', value: '', title: tid('custom_field') + ' 8:', top:'single', static:true},
                {name:'m_CustomField8', class:'m_UsePassThruCustom', type:'string', dataattr: 'CustomField9', value: '', title: tid('custom_field') + ' 9:', top:'single', static:true},
                {name:'m_CustomField9', class:'m_UsePassThruCustom', type:'string', dataattr: 'CustomField10', value: '', title: tid('custom_field') + ' 10:', top:'single', bottom:'single', static:true}
            ]}
        ],not:['no-tracking']}
    ];

    if(typeof _cloneObj != 'undefined' && _cloneObj != null)
    {
        this.m_Id = _cloneObj.m_Id;
        this.m_Type = _cloneObj.m_Type;
        this.LoadSettings(_cloneObj.m_Settings, false);
    }
    else
    {
        this.m_Id = _type;
        this.m_Type = _type;
    }

    this.m_Settings.forEach(function(entry_name) {
        entry_name.icon = that.m_Icons[_type].icon.replace('fa fa-','');
        entry_name.iconcss = that.m_Icons[_type].iconcss;
    });

    for (i=0; i<10; i++) {

        var name = DataEngine.inputList.objects[i].name;
        if(name.length)
            UIRenderer.getSettingsProperty(this.m_Settings,'m_CustomField' + i).title = name+":";
    }
}

LinkGeneratorElement.prototype.ApplyStaticFields = function(from) {
    var that = this;
    this.m_Settings.forEach(function(entry_name) {
        if($.inArray(that.m_Type,entry_name.not) === -1 && $.inArray('all',entry_name.not) === -1)
            entry_name.groups.forEach(function(entry_group)
            {
                if($.inArray(that.m_Type,entry_group.not) === -1 && $.inArray('all',entry_group.not) === -1){
                    entry_group.controls.forEach(function(entry_control) {
                        if($.inArray(that.m_Type,entry_control.not) === -1 && $.inArray('all',entry_control.not) === -1 && typeof entry_control.static != 'undefined'){
                            entry_control.value = from;
                        }
                    });
                }
            });
    });
};

LinkGeneratorElement.prototype.LoadSettings = function(settings, staticOnly) {
    for(var entry_name in settings){
        for(var s_entry_name in this.m_Settings){
            if(settings[entry_name].name == this.m_Settings[s_entry_name].name) {
                for(var entry_group in settings[entry_name].groups){
                    for(var s_entry_group in this.m_Settings[s_entry_name].groups){
                        if(settings[entry_name].groups[entry_group].name == this.m_Settings[s_entry_name].groups[s_entry_group].name) {
                            for(var entry_control in settings[entry_name].groups[entry_group].controls){
                                for(var s_entry_control in this.m_Settings[s_entry_name].groups[s_entry_group].controls){
                                    if(settings[entry_name].groups[entry_group].controls[entry_control].name == this.m_Settings[s_entry_name].groups[s_entry_group].controls[s_entry_control].name) {
                                        if(typeof this.m_Settings[s_entry_name].groups[s_entry_group].controls[s_entry_control].persistent == 'undefined')
                                            if(!staticOnly || typeof this.m_Settings[s_entry_name].groups[s_entry_group].controls[s_entry_control].static != 'undefined')
                                                this.m_Settings[s_entry_name].groups[s_entry_group].controls[s_entry_control].value = settings[entry_name].groups[entry_group].controls[entry_control].value;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};

LinkGeneratorElement.prototype.SetEyeCatcherDefaultMargins = function(){

    return;
    /*
    if(!$('#r-m_WidgetModeFlexiButtons').prop('checked'))
    {
        $('#int-m_MarginRight').val(40);
        $('#int-m_MarginBottom').val(0);
        $('#int-m_ECMarginBottom').val(40);
        $('#int-m_ECMarginRight').val(40);
    }
    else
    {
        $('#int-m_MarginRight').val(40);
        $('#int-m_MarginBottom').val(30);

        if($('#sl-m_IconSize').val() == 0.8)
        {
            $('#int-m_ECMarginBottom').val(74);
            $('#int-m_ECMarginRight').val(24);
        }
        else if($('#sl-m_IconSize').val() == 1)
        {
            $('#int-m_ECMarginBottom').val(78);
            $('#int-m_ECMarginRight').val(28);
        }
        else if($('#sl-m_IconSize').val() == 1.2)
        {
            $('#int-m_ECMarginBottom').val(84);
            $('#int-m_ECMarginRight').val(32);
        }
        else
        {
            $('#int-m_ECMarginBottom').val(94);
            $('#int-m_ECMarginRight').val(36);
        }
    }
    */
};

LinkGeneratorElement.prototype.ApplyLogicToForm = function(formType) {
    var that = this;
    if(formType == "General")
    {
        if ($('#r-m_LanguageAuto').prop('checked'))
            $('#sl-m_Language').addClass('ui-disabled');

        $('.language-select').change(function() {
            if ($('#r-m_LanguageSelect').prop('checked'))
                $('#sl-m_Language').removeClass('ui-disabled');
            else
                $('#sl-m_Language').addClass('ui-disabled');
        });

        if(this.m_Type == 'overlay-widget-v2')
        {
            var adjustWidgetMode = function(){
                if(!$('#r-m_WidgetModeFlexiButtons').prop('checked'))
                {
                    $('#lg-element-configuration-Knowledgebase').addClass('ui-disabled');
                    $('#lg-element-configuration-Phone').addClass('ui-disabled');
                    $('#lg-element-configuration-SocialMedia').addClass('ui-disabled');
                    $('.widget-flexi-text-mode').addClass('ui-disabled');
                }
                else
                {
                    $('#lg-element-configuration-Knowledgebase').removeClass('ui-disabled');
                    $('#lg-element-configuration-Phone').removeClass('ui-disabled');
                    $('#lg-element-configuration-SocialMedia').removeClass('ui-disabled');
                    $('.widget-flexi-text-mode').removeClass('ui-disabled');
                }
                $('#cb-m_LiveChats').change();
                $('.widget-flexi-text-mode').change();
            };

            adjustWidgetMode();
            $('.widget-mode').change(function(){
                adjustWidgetMode();
                that.SetEyeCatcherDefaultMargins();
            });
        }

        $('#cb-m_WidgetIconDefault').change(function() {
            if (!$('#cb-m_WidgetIconDefault').prop('checked'))
                $('.m_WidgetIcon').removeClass('ui-disabled');
            else
                $('.m_WidgetIcon').addClass('ui-disabled');
        });
        $('#cb-m_WidgetIconDefault').change();


        $('#cb-m_DelayScript').change(function() {
            if ($('#cb-m_DelayScript').prop('checked'))
                $('.m_DelayScript').removeClass('ui-disabled');
            else
                $('.m_DelayScript').addClass('ui-disabled');
        });
        $('#cb-m_DelayScript').change();
    }
    else if(formType == "Colors")
    {
        $('#ci-m_PrimaryColor').change(function() {
            if(lzm_commonTools.isHEXColor($('#ci-m_PrimaryColor').val()))
                $('#ci-m_PrimaryColor-icon').css({background:$('#ci-m_PrimaryColor').val()});
        });
        $('#ci-m_SecondaryColor').change(function() {
            if(lzm_commonTools.isHEXColor($('#ci-m_SecondaryColor').val()))
                $('#ci-m_SecondaryColor-icon').css({background:$('#ci-m_SecondaryColor').val()});
        });
    }
    else if(formType == "Images")
    {
        lzm_chatDisplay.LinkGenerator.LoadImageSets(that.m_Type);
    }
    else if(formType == "Services")
    {
        $('#cb-m_PhoneInbound').change(function() {
            if ($('#cb-m_PhoneInbound').prop('checked')) {
                $('#s-m_PhoneInboundNumber').removeClass('ui-disabled');
                $('#s-m_PhoneInboundText').removeClass('ui-disabled');
            } else {
                $('#s-m_PhoneInboundNumber').addClass('ui-disabled');
                $('#s-m_PhoneInboundText').addClass('ui-disabled');
            }
        });
        if(this.m_Type == 'overlay-widget-v2')
            $('#cb-m_LiveChats').change(function(){
                if ($('#cb-m_LiveChats').prop('checked') && $('#sl-m_LiveChatsGroupId').children('option')[0].value != 'no_dyn_group')
                    $('.live-chat-select').removeClass('ui-disabled');
                else
                    $('.live-chat-select').addClass('ui-disabled');

                if ($('#cb-m_LiveChats').prop('checked') && $('#r-m_WidgetModeFlexiButtons').prop('checked'))
                    $('#cb-m_ChatOnlineOnly').parent().removeClass('ui-disabled');
                else
                {
                    $('#cb-m_ChatOnlineOnly').parent().addClass('ui-disabled');
                    $('#cb-m_ChatOnlineOnly').prop('checked',false);
                }
            });

        $('.live-chat-select').change(function() {
            if ($('#r-m_LiveChatsGroup').prop('checked')) {
                $('#sl-m_LiveChatsGroupId').removeClass('ui-disabled');
            } else {
                $('#sl-m_LiveChatsGroupId').addClass('ui-disabled');
            }
        });
        $('#cb-m_CustomLinks').change(function(){
            if ($('#cb-m_CustomLinks').prop('checked'))
                $('.m_CustomLinks').removeClass('ui-disabled');
            else
                $('.m_CustomLinks').addClass('ui-disabled');

            $('#cb-m_CustomLink1').change();
            $('#cb-m_CustomLink2').change();
            $('#cb-m_CustomLink3').change();
        });
        $('#cb-m_CustomLink1').change(function(){
            if ($('#cb-m_CustomLink1').prop('checked') && $('#cb-m_CustomLinks').prop('checked'))
                $('.m_CustomLink1').removeClass('ui-disabled');
            else
                $('.m_CustomLink1').addClass('ui-disabled');
        });
        $('#cb-m_CustomLink2').change(function(){
            if ($('#cb-m_CustomLink2').prop('checked') && $('#cb-m_CustomLinks').prop('checked'))
                $('.m_CustomLink2').removeClass('ui-disabled');
            else
                $('.m_CustomLink2').addClass('ui-disabled');
        });
        $('#cb-m_CustomLink3').change(function(){
            if ($('#cb-m_CustomLink3').prop('checked') && $('#cb-m_CustomLinks').prop('checked'))
                $('.m_CustomLink3').removeClass('ui-disabled');
            else
                $('.m_CustomLink3').addClass('ui-disabled');
        });
        $('#cb-m_SocialMedia').change(function(){
            if ($('#cb-m_SocialMedia').prop('checked'))
                $('.m_SocialMedia').removeClass('ui-disabled');
            else
                $('.m_SocialMedia').addClass('ui-disabled');
        });
        $('#cb-m_SocialMediaFacebook').change(function(){
            if ($('#cb-m_SocialMediaFacebook').prop('checked'))
                $('.m_SocialMediaFacebook').removeClass('ui-disabled');
            else
                $('.m_SocialMediaFacebook').addClass('ui-disabled');
        });
        $('#cb-m_SocialMediaTwitter').change(function(){
            if ($('#cb-m_SocialMediaTwitter').prop('checked'))
                $('.m_SocialMediaTwitter').removeClass('ui-disabled');
            else
                $('.m_SocialMediaTwitter').addClass('ui-disabled');
        });
        $('#cb-m_SocialMediaGoogle').change(function(){
            if ($('#cb-m_SocialMediaGoogle').prop('checked'))
                $('.m_SocialMediaGoogle').removeClass('ui-disabled');
            else
                $('.m_SocialMediaGoogle').addClass('ui-disabled');
        });
        $('#cb-m_SocialMediaYoutube').change(function(){
            if ($('#cb-m_SocialMediaYoutube').prop('checked'))
                $('.m_SocialMediaYoutube').removeClass('ui-disabled');
            else
                $('.m_SocialMediaYoutube').addClass('ui-disabled');
        });
        $('#cb-m_SocialMediaWhatsapp').change(function(){
            if ($('#cb-m_SocialMediaWhatsapp').prop('checked'))
                $('.m_SocialMediaWhatsapp').removeClass('ui-disabled');
            else
                $('.m_SocialMediaWhatsapp').addClass('ui-disabled');
        });
        $('#cb-m_SocialMediaLinkedIn').change(function(){
            if ($('#cb-m_SocialMediaLinkedIn').prop('checked'))
                $('.m_SocialMediaLinkedIn').removeClass('ui-disabled');
            else
                $('.m_SocialMediaLinkedIn').addClass('ui-disabled');
        });
        $('#cb-m_SocialMediaInstagram').change(function(){
            if ($('#cb-m_SocialMediaInstagram').prop('checked'))
                $('.m_SocialMediaInstagram').removeClass('ui-disabled');
            else
                $('.m_SocialMediaInstagram').addClass('ui-disabled');
        });
        $('#cb-m_SocialMediaTelegram').change(function(){
            if ($('#cb-m_SocialMediaTelegram').prop('checked'))
                $('.m_SocialMediaTelegram').removeClass('ui-disabled');
            else
                $('.m_SocialMediaTelegram').addClass('ui-disabled');
        });

        var fields = $('td', '#tbl-custom-links');
        var fieldcounter = 0;
        for(var i = 0;i<6;i++)
        {
            var num = 1;
            if(i > 1)
                num = 2;
            if(i > 3)
                num = 3;

            if(i % 2 == 0)
            {
                $('#cb-m_CustomLink'+(num)).parent().appendTo(fields.eq(fieldcounter++));
            }
            else
            {
                fields.eq(fieldcounter).css({'min-width':'200px','padding-left':'10px'});
                $('#sl-m_CustomLinkType'+(num)).parent().appendTo(fields.eq(fieldcounter++));
                $('#s-m_CustomLinkTitle'+(num)).parent().parent().appendTo(fields.eq(fieldcounter++));
                $('#s-m_CustomLinkURL'+(num)).parent().parent().appendTo(fields.eq(fieldcounter++));
                $('#s-m_CustomLinkColor'+(num)).parent().parent().appendTo(fields.eq(fieldcounter++));
                $('#sl-m_CustomLinkIcon'+(num)).parent().appendTo(fields.eq(fieldcounter++));
            }
        }
        fields = $('td', '#tbl-social-media');

        $('#cb-m_SocialMediaFacebook').parent().appendTo(fields.eq(0));
        $('#s-m_SocialMediaFacebookURL').parent().parent().appendTo(fields.eq(1));
        $('#cb-m_SocialMediaTwitter').parent().appendTo(fields.eq(2));
        $('#s-m_SocialMediaTwitterURL').parent().parent().appendTo(fields.eq(3));
        $('#cb-m_SocialMediaGoogle').parent().appendTo(fields.eq(4));
        $('#s-m_SocialMediaGoogleURL').parent().parent().appendTo(fields.eq(5));
        $('#cb-m_SocialMediaYoutube').parent().appendTo(fields.eq(6));
        $('#s-m_SocialMediaYoutubeURL').parent().parent().appendTo(fields.eq(7));
        $('#cb-m_SocialMediaWhatsapp').parent().appendTo(fields.eq(8));
        $('#s-m_SocialMediaWhatsappURL').parent().parent().appendTo(fields.eq(9));
        $('#cb-m_SocialMediaLinkedIn').parent().appendTo(fields.eq(10));
        $('#s-m_SocialMediaLinkedInURL').parent().parent().appendTo(fields.eq(11));
        $('#cb-m_SocialMediaInstagram').parent().appendTo(fields.eq(12));
        $('#s-m_SocialMediaInstagramURL').parent().parent().appendTo(fields.eq(13));
        $('#cb-m_SocialMediaTelegram').parent().appendTo(fields.eq(14));
        $('#s-m_SocialMediaTelegramURL').parent().parent().appendTo(fields.eq(15));

        $('#cb-m_SocialMedia').parent().insertBefore( $('#tbl-social-media') );
        $('#cb-m_CustomLinks').parent().insertBefore( $('#tbl-custom-links') );

        $('#cb-m_Knowledgebase').change(function(){
            if ($('#cb-m_Knowledgebase').prop('checked')){
                $('.m_Knowledgebase').removeClass('ui-disabled');}
            else
                $('.m_Knowledgebase').addClass('ui-disabled');
        });
        $('.knowledgebase_root').change(function(){
            if ($('#r-m_KnowledgebaseCustomRoot').prop('checked')){
                $('#s-m_KnowledgebaseCustomRootFolder').removeClass('ui-disabled');}
            else{
                $('#s-m_KnowledgebaseCustomRootFolder').addClass('ui-disabled');}
        });
        $('#r-m_KnowledgebaseCustomRoot').change();
        $('#cb-m_Knowledgebase').change();
        $('#cb-m_PhoneInbound').change();
        $('#cb-m_LiveChats').change();
        $('.live-chat-select').change();
        $('#cb-m_CustomLinks').change();
        $('#cb-m_CustomLink1').change();
        $('#cb-m_CustomLink2').change();
        $('#cb-m_CustomLink3').change();
        $('#cb-m_SocialMedia').change();
        $('#cb-m_SocialMediaFacebook').change();
        $('#cb-m_SocialMediaTwitter').change();
        $('#cb-m_SocialMediaGoogle').change();
        $('#cb-m_SocialMediaYoutube').change();
        $('#cb-m_SocialMediaWhatsapp').change();
        $('#cb-m_SocialMediaLinkedIn').change();
        $('#cb-m_SocialMediaInstagram').change();
        $('#cb-m_SocialMediaTelegram').change();
    }
    else if(formType == "Shadow"){
        $('#cb-m_UseShadow').change(function() {
            if ($('#cb-m_UseShadow').prop('checked')) {
                $('.m_UseShadow').removeClass('ui-disabled');
            } else {
                $('.m_UseShadow').addClass('ui-disabled');
            }
        });
        $('#ci-m_ShadowColor').change(function() {
            if(lzm_commonTools.isHEXColor($('#ci-m_ShadowColor').val()))
                $('#ci-m_ShadowColor-icon').css({background:$('#ci-m_ShadowColor').val()});
        });
        $('#ci-m_ShadowColor').change();
        $('#cb-m_UseShadow').change();
    }
    else if(formType == "Position"){
        $('.po-m_Position').click(function() {
            $('.po-m_Position').removeClass('lzm-position-selected');
            $(this).addClass('lzm-position-selected');
        });
    }
    else if(formType == "Routing"){

        var ___setHGAvail = function(){

            var cb,isgroupunch = false;

            $('.m_HideAllOtherGroups').each(function(){
                cb = $(this);
                if(cb.prop("tagName")=="INPUT" && !cb.prop("checked"))
                    isgroupunch = true;
            });

            if(!isgroupunch)
            {
                $('.m_HideAllOtherGroups').each(function(){
                    cb = $(this);
                    if(cb.prop("tagName")=="INPUT")
                        $('#'+cb.prop("id")).prop("checked",false);
                });
            }

            if ($('#cb-m_HideGroups').prop('checked') && $('#cb-m_TargetGroup').prop('checked'))
                $('#cb-m_HideAllOtherGroups').parent().removeClass('ui-disabled');
            else
                $('#cb-m_HideAllOtherGroups').parent().addClass('ui-disabled');

            if ($('#cb-m_HideGroups').prop('checked') && !$('#cb-m_HideAllOtherGroups').prop('checked'))
                $('.m_HideAllOtherGroups').removeClass('ui-disabled');
            else
            {
                $('.m_HideAllOtherGroups').addClass('ui-disabled');
                $('.m_HideAllOtherGroups').prop('checked',false);
            }

            if ($('#cb-m_TargetGroup').prop('checked'))
                $('#sl-m_TargetGroupId').removeClass('ui-disabled');
            else
                $('#sl-m_TargetGroupId').addClass('ui-disabled');
        };

        $('#cb-m_TargetOperator').change(function() {
            if ($('#cb-m_TargetOperator').prop('checked')) {
                $('#sl-m_TargetOperatorId').removeClass('ui-disabled');
            } else {
                $('#sl-m_TargetOperatorId').addClass('ui-disabled');
            }
        });

        $('#cb-m_TargetGroup').change(function() {
            ___setHGAvail();
        });
        $('.m_HideAllOtherGroups').change(function(){
            ___setHGAvail();
        });
        $('#cb-m_HideGroups').change(function() {
            ___setHGAvail();
        });
        $('#cb-m_HideAllOtherGroups').change(function() {
            ___setHGAvail();
        });
        $('#cb-m_TargetOperator').change();
        $('#cb-m_TargetGroup').change();
        $('#cb-m_HideGroups').change();
    }
    /*
    else if(formType == "Eye Catcher"){
        $('#sl-m_ECTypeOptions').change(function() {
            if ($('#sl-m_ECTypeOptions').prop('selectedIndex')==0)
            {
                $('.m_ECTypeOptionsBubble').css({display:'block'});
                $('.m_ECTypeOptionsImage').css({display:'none'});
            }
            else
            {
                $('.m_ECTypeOptionsBubble').css({display:'none'});
                $('.m_ECTypeOptionsImage').css({display:'block'});
            }
        });
        $('#cb-m_ECUse').change(function() {
            if ($('#cb-m_ECUse').prop('checked'))
            {
                $('.m_ECUse').removeClass('ui-disabled');
            }
            else
            {
                $('.m_ECUse').addClass('ui-disabled');
            }
            $('#sl-m_ECTypeOptions').change();
        });
        $('#cb-m_ECBubbleShadowUse').change(function() {
            if ($('#cb-m_ECBubbleShadowUse').prop('checked'))
                $('.m_ECBubbleShadowUse').removeClass('ui-disabled');
            else
                $('.m_ECBubbleShadowUse').addClass('ui-disabled');
        });
        $('#cb-m_ECBubblePersonalize').change(function() {
            if ($('#cb-m_ECBubblePersonalize').prop('checked'))
                $('.m_ECBubblePersonalize').removeClass('ui-disabled');
            else
                $('.m_ECBubblePersonalize').addClass('ui-disabled');
        });
        $('#cb-m_ECBubbleTitleDefault').change(function() {
            if (!$('#cb-m_ECBubbleTitleDefault').prop('checked'))
                $('.m_ECBubbleTitleDefault').removeClass('ui-disabled');
            else
                $('.m_ECBubbleTitleDefault').addClass('ui-disabled');
        });
        $('#cb-m_ECBubbleSubDefault').change(function() {
            if (!$('#cb-m_ECBubbleSubDefault').prop('checked'))
                $('.m_ECBubbleSubDefault').removeClass('ui-disabled');
            else
                $('.m_ECBubbleSubDefault').addClass('ui-disabled');
        });

        $('#ci-m_ECBubbleColorBGStart').change(function() {
            if(lzm_commonTools.isHEXColor($('#ci-m_ECBubbleColorBGStart').val()))
                $('#ci-m_ECBubbleColorBGStart-icon').css({background:$('#ci-m_ECBubbleColorBGStart').val()});
        });
        $('#ci-m_ECBubbleColorBGEnd').change(function() {
            if(lzm_commonTools.isHEXColor($('#ci-m_ECBubbleColorBGEnd').val()))
                $('#ci-m_ECBubbleColorBGEnd-icon').css({background:$('#ci-m_ECBubbleColorBGEnd').val()});
        });
        $('#ci-m_ECBubbleTextColor').change(function() {
            if(lzm_commonTools.isHEXColor($('#ci-m_ECBubbleTextColor').val()))
                $('#ci-m_ECBubbleTextColor-icon').css({background:$('#ci-m_ECBubbleTextColor').val()});
        });
        $('#ci-m_ECBubbleBorderColorStart').change(function() {
            if(lzm_commonTools.isHEXColor($('#ci-m_ECBubbleBorderColorStart').val()))
                $('#ci-m_ECBubbleBorderColorStart-icon').css({background:$('#ci-m_ECBubbleBorderColorStart').val()});
        });
        $('#ci-m_ECBubbleBorderColorEnd').change(function() {
            if(lzm_commonTools.isHEXColor($('#ci-m_ECBubbleBorderColorEnd').val()))
                $('#ci-m_ECBubbleBorderColorEnd-icon').css({background:$('#ci-m_ECBubbleBorderColorEnd').val()});
        });
        $('#ci-m_ECBubbleShadowColor').change(function() {
            if(lzm_commonTools.isHEXColor($('#ci-m_ECBubbleShadowColor').val()))
                $('#ci-m_ECBubbleShadowColor-icon').css({background:$('#ci-m_ECBubbleShadowColor').val()});
        });
        $('#ci-m_ECBubbleAvatarBorderColor').change(function() {
            if(lzm_commonTools.isHEXColor($('#ci-m_ECBubbleAvatarBorderColor').val()))
                $('#ci-m_ECBubbleAvatarBorderColor-icon').css({background:$('#ci-m_ECBubbleAvatarBorderColor').val()});
        });
        $('#ci-m_ECBubbleAvatarBGColor').change(function() {
            if(lzm_commonTools.isHEXColor($('#ci-m_ECBubbleAvatarBGColor').val()))
                $('#ci-m_ECBubbleAvatarBGColor-icon').css({background:$('#ci-m_ECBubbleAvatarBGColor').val()});
        });
        $('#ci-m_ECBubbleTitleTextColor').change(function() {
            if(lzm_commonTools.isHEXColor($('#ci-m_ECBubbleTitleTextColor').val()))
                $('#ci-m_ECBubbleTitleTextColor-icon').css({background:$('#ci-m_ECBubbleTitleTextColor').val()});
        });
        $('#ci-m_ECBubbleSubTextColor').change(function() {
            if(lzm_commonTools.isHEXColor($('#ci-m_ECBubbleSubTextColor').val()))
                $('#ci-m_ECBubbleSubTextColor-icon').css({background:$('#ci-m_ECBubbleSubTextColor').val()});
        });

        $('#cb-m_ECBubbleShadowUse').change();
        $('#cb-m_ECBubblePersonalize').change();
        $('#cb-m_ECBubbleTitleDefault').change();
        $('#cb-m_ECBubbleSubDefault').change();

        //$('#cb-m_ECFadeIn').change();
        //$('#cb-m_ECFadeOut').change();

        $('#sl-m_ECTypeOptions').change();
        $('#cb-m_ECUse').change();

        if(this.m_Type == 'overlay-widget-v2')
        {
            $('#cb-m_ECHideOnPhone').prop('checked',true);
            $('#cb-m_ECHideOnPhone').parent().addClass('ui-disabled');
        }
    }
    */
    else if(formType == "Texts"){
        $('#cb-m_TextDefault').change(function() {
            if (!$('#cb-m_TextDefault').prop('checked')){
                $('#s-m_TextOnline').removeClass('ui-disabled');
                $('#s-m_TextOffline').removeClass('ui-disabled');
            }
            else{
                $('#s-m_TextOnline').addClass('ui-disabled');
                $('#s-m_TextOffline').addClass('ui-disabled');
            }
        });
        $('#cb-m_TextDefault').change();
    }
    else if(formType == "Dimensions"){

        $('#sl-m_IconSize').change(function(){
            that.SetEyeCatcherDefaultMargins();
        });

        $('#cb-m_DimensionsAuto').change(function() {
            if (!$('#cb-m_DimensionsAuto').prop('checked')){
                $('#int-m_DimensionsWidth').removeClass('ui-disabled');
                $('#int-m_DimensionsHeight').removeClass('ui-disabled');
            }
            else{
                $('#int-m_DimensionsWidth').addClass('ui-disabled');
                $('#int-m_DimensionsHeight').addClass('ui-disabled');
            }
        });
        $('#cb-m_DimensionsAuto').change();
    }
    else if(formType == "Advanced"){
        $('#cb-m_HideGroupSelectionChats').change(function() {
            $('#cb-m_ForceGroupSelection').prop('checked',false);
        });
        $('#cb-m_HideGroupSelectionTickets').change(function() {
            $('#cb-m_ForceGroupSelection').prop('checked',false);
        });
        $('#cb-m_ForceGroupSelection').change(function() {
            $('#cb-m_HideGroupSelectionChats').prop('checked',false);
            $('#cb-m_HideGroupSelectionTickets').prop('checked',false);
        });
    }
    else if(formType == "Data"){
        $('#cb-m_UsePassThruStandard').change(function() {
            var active = $('#cb-m_UsePassThruStandard').prop('checked');
            $('.m_UsePassThruStandard input').each(function(){
                var ph = LinkGeneratorClass.DataPassThruPlaceholder;

                ph += $(this).attr('data-attr-name')+'-->';

                if ($(this).val().indexOf(LinkGeneratorClass.DataPassThruPlaceholder)==0 && !active)
                    $(this).val('');
                else if($(this).val()== '' && active)
                    $(this).val(ph);
            });
        });
        $('#cb-m_UsePassThruCustom').change(function() {
            var active = $('#cb-m_UsePassThruCustom').prop('checked');
            $('.m_UsePassThruCustom input').each(function(){
                var ph = LinkGeneratorClass.DataPassThruPlaceholder+$(this).attr('data-attr-name')+'-->';
                if ($(this).val()==ph && !active)
                    $(this).val('');
                else if($(this).val()== '' && active)
                    $(this).val(ph);
            });
        });
    }
};

LinkGeneratorElement.prototype.GetLineId = function() {
    return 'element-list-line-'+this.m_Id;
};

LinkGeneratorElement.prototype.GUIToObject = function() {
    var that = this;
    this.m_Settings.forEach(function(entry_name) {
        if($.inArray(that.m_Type,entry_name.not) === -1 && $.inArray('all',entry_name.not) === -1)
            entry_name.groups.forEach(function(entry_group)
            {
                if($.inArray(that.m_Type,entry_group.not) === -1 && $.inArray('all',entry_group.not) === -1){
                    entry_group.controls.forEach(function(entry_control) {
                        if($.inArray(that.m_Type,entry_control.not) === -1 && $.inArray('all',entry_control.not) === -1){
                            var val = UIRenderer.GetControlValue(entry_control);
                            if(val != null)
                                entry_control.value = val;
                        }
                    });
                }
            });
    });
};

LinkGeneratorElement.prototype.RequiresMonitoring = function() {
    return this.m_Type=='overlay-button'||this.m_Type=='overlay-widget-v1'||this.m_Type=='overlay-widget-v2';
};

LinkGeneratorElement.prototype.GetCustomForm = function(formType) {
    var contentHtml = '';
    if(formType == "Images")
    {
        contentHtml = '<table><tr>' +
            '<td style="width:100px;vertical-align:top;">'+lzm_inputControls.createImageBox('image-online')+'</td>' +
            '<td rowspan="2" style="vertical-align:top;"><div id="image-sets-list-div" class="alternating-rows-table lzm-list-div"><table class="alternating-rows-table" id="image-sets-list-table"><tbody></tbody></table></div>' +
            '<div style="margin-top: 15px; text-align: right;">';
        contentHtml += lzm_inputControls.createButton('add-image-set-btn', '', 'addImageSet(\''+this.m_Type+'\')', t('Add'), '', 'lr',{'margin-right': '5px', 'padding-left': '12px', 'padding-right': '12px'}, tid('create_new_element'), 20, 'b');
        contentHtml += lzm_inputControls.createButton('rm-image-set-btn', 'ui-disabled element-edit-btns', 'removeImageSet(\''+this.m_Type+'\')', t('Remove'), '', 'lr',{'margin-right': '0px', 'padding-left': '12px', 'padding-right': '12px'}, t('Remove selected Element'), 20, 'b');
        contentHtml += '</div>'+
            '</td></tr><tr>'+
            '<td class="top-space" style="vertical-align:top;">'+lzm_inputControls.createImageBox('image-offline')+'</td>' +
            '</tr></table>';
    }
    else if(formType == "Custom Links")
    {
        contentHtml = '<table id="tbl-custom-links" class="link-generator-table link-generator-custom-table">';
        contentHtml += '<tr><td colspan="5"></td></tr>';
        contentHtml += '<tr><td></td><td></td><td></td><td></td><td></td></tr>';
        contentHtml += '<tr><td colspan="5"></td></tr>';
        contentHtml += '<tr><td></td><td></td><td></td><td></td><td></td></tr>';
        contentHtml += '<tr><td colspan="5"></td></tr>';
        contentHtml += '<tr><td></td><td></td><td></td><td></td><td></td></tr>';
        contentHtml += '</table>';
    }
    else if(formType == "SocialMedia")
        contentHtml = '<table id="tbl-social-media" class="link-generator-table"><tr><td></td><td></td></tr><tr><td></td><td></td></tr><tr><td></td><td></td></tr><tr><td></td><td></td></tr><tr><td></td><td></td></tr><tr><td></td><td></td></tr><tr><td></td><td></td></tr><tr><td></td><td></td></tr></table>';
    return contentHtml;
};

LinkGeneratorElement.prototype.GetElementRow = function() {

    var icon='',name = tid(this.m_Type);

    if($.inArray(this.m_Type,LinkGeneratorClass.DeprecatedElements) != -1)
    {
        name = '<strike><i class="text-gray">' + name + '</i></strike>';
        icon = '<i class="fa fa-warning icon-orange icon-large"></i>';
    }
    else
        icon = '<i class="'+this.m_Icons[this.m_Type].icon+' icon-large"></i>';

    return '<tr id="'+this.GetLineId()+'" ondblclick="editLinkGeneratorElement();" onclick="selectLinkGeneratorElement(\'' + this.m_Id + '\');" class="element-list-line lzm-unselectable" data-element="'+lz_global_base64_encode(JSON.stringify(this))+'"><td style="width:20px;" class="text-center spaced">'+icon+'</td><td>'+name+'</td></tr>';
};

LinkGeneratorElement.prototype.GetProperty = function(elem){
    return UIRenderer.getSettingsProperty(this.m_Settings,elem);
};

function previewLinkGeneratorCode(){
    lzm_chatDisplay.LinkGenerator.Preview();
}

function editLinkGeneratorElement(){
    lzm_chatDisplay.LinkGenerator.EditLinkGeneratorElement();
}

function selectLinkGeneratorElement(type){
    $('.element-list-line').removeClass('selected-table-line');
    $('#element-list-line-' + type).addClass('selected-table-line');
    lzm_chatDisplay.LinkGenerator.ValidateButtons();
}

function addLinkGeneratorElement(){
    LinkGeneratorClass.CurrentElements = lzm_chatDisplay.LinkGenerator.GetElementsFromRows(false);
    lzm_chatDisplay.LinkGenerator.SelectElementType();
}

function removeLinkGeneratorElement(){
    lzm_chatDisplay.LinkGenerator.RemoveLinkGeneratorElement();
}

LinkGeneratorClass.__PreviewInline = function(){
    lzm_chatDisplay.LinkGenerator.PreviewInline(lzm_chatDisplay.LinkGenerator.m_CurrentCodeId);
};

LinkGeneratorClass.Delete = function(event){
    event.stopPropagation();
    lzm_chatDisplay.LinkGenerator.DeleteCode(lzm_chatDisplay.LinkGenerator.m_CurrentCodeId);
};

LinkGeneratorClass.CreateDefaultButton = function(){
    lzm_commonDialog.createAlertDialog(tid('create_default_button'), [{id: 'yes', name: tid('yes')},{id: 'no', name: tid('no')}],false);
    $('#alert-btn-yes').click(function() {
        lzm_commonDialog.removeAlertDialog();
        newLinkGeneratorCode();
        $('#template-name').val('My Chat Button');
        $('#alert-btn-ok').click();
        addLinkGeneratorElement();
        $('#element-overlay-widget').attr('checked',true);
        $('#select-element-type-btn').click();
        $('#r-m_WidgetModeFlexiButtonTextInline').attr('checked',true);
        $('#r-m_WidgetModeFlexiButtonTextHover').attr('checked',true);
        $('#cb-m_CreateTicket').attr('checked',true);
        $('#cb-m_Knowledgebase').attr('checked',false);
        $('#sl-m_IconSize').val(1.2);
        $('#cb-m_LeaveMessageWhenOnline').attr('checked',false);
        $('#save-element-btn').click();
    });
    $('#alert-btn-no').click(function() {
        lzm_commonDialog.removeAlertDialog();
    });
};
