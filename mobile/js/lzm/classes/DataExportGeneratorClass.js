/****************************************************************************************
 * LiveZilla DataExportGeneratorClass.js
 *
 * Copyright 2018 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/

function DataExportGeneratorClass() {


}
DataExportGeneratorClass.Settings = {};
DataExportGeneratorClass.Formats = ['XML','CSV','JSON'];
DataExportGeneratorClass.Tables = [
    {name:'chat_archive',title:'Chat Archive',fields:[
        {name:'time',type:'int'},
        {name:'chat_id',type:'int'},
        {name:'internal_id',type:'string'},
        {name:'fullname',type:'string'},
        {name:'area_code',type:'string'},
        {name:'html',type:'string'},
        {name:'plaintext',type:'string'},
        {name:'email',type:'string'},
        {name:'company',type:'string'},
        {name:'phone',type:'string'},
        {name:'iso_language',type:'string'},
        {name:'iso_country',type:'string'},
        {name:'subject',type:'string'},
        {name:'customs',type:'php_serialized_array'},
        {name:'ref_url',type:'string'},
        {name:'tags',type:'string'}
    ]},
    {name:'feedbacks',title:'Feedbacks',fields:[
        {name:'id',type:'string'},
        {name:'created',type:'int'},
        {name:'chat_id',type:'string'},
        {name:'ticket_id',type:'string'},
        {name:'resource_id',type:'string'},
        {name:'user_id',type:'string'},
        {name:'operator_id',type:'string'},
        {name:'group_id',type:'string'},
        {name:'data_id',type:'string'},
        {name:'ip_hash',type:'string'}
    ]},
    {name:'feedback_criteria',title:'Feedback Data',fields:[
        {name:'fid',type:'string'},
        {name:'cid',type:'string'},
        {name:'value',type:'string'}
    ]},
    {name:'groups',title:'Groups',fields:[
        {name:'id',type:'string'},
        {name:'owner',type:'string'},
        {name:'dynamic',type:'int'},
        {name:'description',type:'string'},
        {name:'external',type:'int'},
        {name:'internal',type:'int'},
        {name:'created',type:'int'},
        {name:'email',type:'string'},
        {name:'standard',type:'int'},
        {name:'opening_hours',type:'string'},
        {name:'functions',type:'string'},
        {name:'chat_inputs_hidden',type:'string'},
        {name:'ticket_inputs_hidden',type:'string'},
        {name:'chat_inputs_required',type:'string'},
        {name:'ticket_inputs_required',type:'string'},
        {name:'chat_inputs_masked',type:'string'},
        {name:'ticket_inputs_masked',type:'string'},
        {name:'chat_inputs_cap',type:'string'},
        {name:'ticket_inputs_cap',type:'string'},
        {name:'max_chats',type:'int'},
        {name:'visitor_filters',type:'string'},
        {name:'ticket_sender_name',type:'string'},
        {name:'ticket_email_out',type:'string'},
        {name:'ticket_email_in',type:'string'},
        {name:'ticket_handle_unknown',type:'int'},
        {name:'chat_email_out',type:'string'},
        {name:'ticket_assignment',type:'string'},
        {name:'priorities',type:'string'},
        {name:'priority_sleep',type:'int'},
        {name:'position',type:'int'},
        {name:'ticket_notifier',type:'int'}
    ]},
    {name:'operators',title:'Operators',fields:[
        {name:'id',type:'string'},
        {name:'system_id',type:'string'},
        {name:'client_system_id',type:'string'},
        {name:'token',type:'string'},
        {name:'firstname',type:'string'},
        {name:'lastname',type:'string'},
        {name:'email',type:'string'},
        {name:'permissions',type:'string'},
        {name:'webspace',type:'int'},
        {name:'description',type:'string'},
        {name:'first_active',type:'int'},
        {name:'last_active',type:'int'},
        {name:'updated',type:'int'},
        {name:'password',type:'string'},
        {name:'status',type:'int'},
        {name:'level',type:'int'},
        {name:'ip',type:'string'},
        {name:'typing',type:'string'},
        {name:'last_chat_allocation',type:'int'},
        {name:'groups',type:'string'},
        {name:'groups_status',type:'string'},
        {name:'groups_hidden',type:'string'},
        {name:'reposts',type:'string'},
        {name:'languages',type:'string'},
        {name:'auto_accept_chats',type:'int'},
        {name:'login_ip_range',type:'string'},
        {name:'password_change_request',type:'int'},
        {name:'websites_users',type:'string'},
        {name:'websites_config',type:'string'},
        {name:'sign_off',type:'int'},
        {name:'bot',type:'int'},
        {name:'wm',type:'int'},
        {name:'wmohca',type:'int'},
        {name:'lweb',type:'int'},
        {name:'lapp',type:'int'},
        {name:'mobile_os',type:'string'},
        {name:'mobile_device_id',type:'string'},
        {name:'mobile_background',type:'int'},
        {name:'mobile_ex',type:'string'},
        {name:'max_chats',type:'int'},
        {name:'ldap',type:'int'},
        {name:'color',type:'string'},
        {name:'image',type:'string'},
        {name:'api_url',type:'string'},
        {name:'welcome_message',type:'string'}
    ]},
    {name:'resources',title:'Knowledge Base',fields:[
        {name:'id',type:'string'},
        {name:'owner',type:'string'},
        {name:'owner_group',type:'string'},
        {name:'editor',type:'string'},
        {name:'value',type:'string'},
        {name:'edited',type:'int'},
        {name:'title',type:'string'},
        {name:'created',type:'int'},
        {name:'type',type:'int'},
        {name:'discarded',type:'int'},
        {name:'parentid',type:'string'},
        {name:'size',type:'int'},
        {name:'tags',type:'string'},
        {name:'languages',type:'string'},
        {name:'kb_public',type:'int'},
        {name:'kb_bot',type:'int'},
        {name:'kb_ft_search',type:'int'},
        {name:'shortcut_word',type:'string'}
    ]},
    {name:'tickets',title:'Tickets',fields:[
        {name:'id',type:'int'},
        {name:'user_id',type:'string'},
        {name:'target_group_id',type:'string'},
        {name:'hash',type:'string'},
        {name:'channel_type',type:'int'},
        {name:'sub_channel',type:'string'},
        {name:'iso_language',type:'string'},
        {name:'deleted',type:'int'},
        {name:'last_update',type:'int'},
        {name:'wait_begin',type:'int'},
        {name:'channel_id',type:'string'},
        {name:'channel_conversation_id',type:'string'},
        {name:'channel_unique_id',type:'string'},
        {name:'auto_status_time',type:'int'},
        {name:'auto_status_status',type:'int'},
        {name:'priority',type:'int'},
        {name:'salt',type:'string'},
        {name:'tags',type:'string'}
    ]},
    {name:'ticket_attachments',title:'Ticket Attachments',fields:[
        {name:'res_id',type:'string'},
        {name:'parent_id',type:'string'}
        ]},
    {name:'ticket_comments',title:'Ticket Comments',fields:[
        {name:'id',type:'string'},
        {name:'created',type:'int'},
        {name:'time',type:'int'},
        {name:'ticket_id',type:'string'},
        {name:'message_id',type:'string'},
        {name:'operator_id',type:'string'},
        {name:'comment',type:'string'}
    ]},
    {name:'ticket_customs',title:'Ticket Customs',fields:[
        {name:'ticket_id',type:'string'},
        {name:'message_id',type:'string'},
        {name:'custom_id',type:'string'},
        {name:'value',type:'string'}
    ]},
    {name:'ticket_editors',title:'Ticket Editors',fields:[
        {name:'ticket_id',type:'string'},
        {name:'editor_id',type:'string'},
        {name:'status',type:'int'},
        {name:'sub_status',type:'string'},
        {name:'time',type:'int'}
    ]},
    {name:'ticket_messages',title:'Ticket Messages',fields:[
        {name:'id',type:'string'},
        {name:'time',type:'int'},
        {name:'created',type:'int'},
        {name:'ticket_id',type:'string'},
        {name:'text',type:'string'},
        {name:'html',type:'string'},
        {name:'fullname',type:'string'},
        {name:'email',type:'string'},
        {name:'email_cc',type:'string'},
        {name:'email_bcc',type:'string'},
        {name:'company',type:'string'},
        {name:'ip',type:'string'},
        {name:'phone',type:'string'},
        {name:'call_me_back',type:'int'},
        {name:'country',type:'string'},
        {name:'type',type:'int'},
        {name:'sender_id',type:'string'},
        {name:'channel_id',type:'string'},
        {name:'hash',type:'string'},
        {name:'subject',type:'string'}
    ]}
];

DataExportGeneratorClass.prototype.Show = function(){

    if(!d(LocalConfiguration.DataExportSettings))
        LocalConfiguration.DataExportSettings = '';

    if(LocalConfiguration.DataExportSettings != '')
        DataExportGeneratorClass.Settings = JSON.parse(LocalConfiguration.DataExportSettings);

    var body = DataExportGeneratorClass.GetBodyHTML();
    lzm_commonDialog.createAlertDialog(body, [{id: 'save', name: tid('save')},{id: 'cancel', name: tid('close')}],true);

    $('#s-data-export-tables').change(function(){

        var table = $(this).val();
        var fields = '';
        for(var key in DataExportGeneratorClass.Tables)
            if(DataExportGeneratorClass.Tables[key].name == table)
                for(var fkey in DataExportGeneratorClass.Tables[key].fields)
                {
                    var title = DataExportGeneratorClass.Tables[key].fields[fkey].name;
                    var isChecked = true;

                    if(d(DataExportGeneratorClass.Settings))
                        if(d(DataExportGeneratorClass.Settings[table]))
                            if(d(DataExportGeneratorClass.Settings[table][title]))
                                if(DataExportGeneratorClass.Settings[table][title] == false)
                                    isChecked = false;

                    fields += '<div class="left-space">' + lzm_inputControls.createCheckbox('s-field-' + DataExportGeneratorClass.Tables[key].fields[fkey].name,title,isChecked,'') + '</div>';
                }

        $('#s-data-field-list').html(fields);
    });
    $('#s-data-export-tables').change();

    if(d(DataExportGeneratorClass.Settings.SelectedFormat))
        $('#s-data-export-format-'+DataExportGeneratorClass.Settings.SelectedFormat).prop('checked',true);
    else
        $('#s-data-export-format-XML').prop('checked',true);

    $('#alert-btn-cancel').click(function() {
        DataExportGeneratorClass.SaveSettings();
        lzm_commonDialog.removeAlertDialog();
    });
    $('#alert-btn-save').click(function() {
        DataExportGeneratorClass.SaveSettings();
        DataExportGeneratorClass.Export();
    });
};

DataExportGeneratorClass.SaveSettings = function(){

    var currentTable = $('#s-data-export-tables').val();
    if(!d(DataExportGeneratorClass.Settings[currentTable]))
        DataExportGeneratorClass.Settings[currentTable] = {};

    for(var key in DataExportGeneratorClass.Tables)
        if(DataExportGeneratorClass.Tables[key].name == currentTable)
            for(var fkey in DataExportGeneratorClass.Tables[key].fields)
            {
                var title = DataExportGeneratorClass.Tables[key].fields[fkey].name;

                if(d(DataExportGeneratorClass.Settings[currentTable]))
                    DataExportGeneratorClass.Settings[currentTable][title] = $('#s-field-' + title).prop('checked');
            }

    DataExportGeneratorClass.Settings.SelectedTable = currentTable;
    DataExportGeneratorClass.Settings.SelectedFormat = $('input[name=s-data-export-format]:checked').val();
    DataExportGeneratorClass.Settings.RowFrom = $('#s-data-export-row-from').val();
    DataExportGeneratorClass.Settings.RowTo = $('#s-data-export-row-to').val();
    LocalConfiguration.DataExportSettings = JSON.stringify(DataExportGeneratorClass.Settings);
    LocalConfiguration.Save();
};

DataExportGeneratorClass.Export = function(){
    CommunicationEngine.pollServerSpecial(DataExportGeneratorClass.GetExportPOSTData(), 'export-data');
    lzm_commonDialog.removeAlertDialog();
    lzm_commonDialog.createAlertDialog('Your export file is now being created. It will be ready for download from your knowledge base (folder \'data export\') within the next 2 minutes', [{id: 'ok', name: tid('ok')},{id: 'show', name: tid('show')}],false,true,false);
    $('#alert-btn-ok').click(function() {
        lzm_commonDialog.removeAlertDialog();
    });
    $('#alert-btn-show').click(function() {
        SelectView('qrd');
        setTimeout(function(){
            KnowledgebaseUI.ShowInTreeView(lzm_chatDisplay.myId);
        },500);
        lzm_commonDialog.removeAlertDialog();
    });

};

DataExportGeneratorClass.GetExportPOSTData = function(){
    var postData = {};
    postData['p_export_table'] = $('#s-data-export-tables').val();
    postData['p_export_format'] = $('input[name=s-data-export-format]:checked').val();
    postData['p_export_table_row_from'] = $('#s-data-export-row-from').val();
    postData['p_export_table_row_to'] = $('#s-data-export-row-to').val();

    for(var key in DataExportGeneratorClass.Tables)
        if(DataExportGeneratorClass.Tables[key].name == $('#s-data-export-tables').val())
            for(var fkey in DataExportGeneratorClass.Tables[key].fields)
            {
                if($('#s-field-' + DataExportGeneratorClass.Tables[key].fields[fkey].name).prop('checked'))
                    postData['p_export_table_field_' + DataExportGeneratorClass.Tables[key].fields[fkey].name] = 1;
            }

    return postData;
};

DataExportGeneratorClass.GetBodyHTML = function(){

    var html = '<fieldset class="lzm-fieldset-full" style="min-width:300px;"><legend>'+tid('export')+'</legend>';
    var tableArray = [];

    for(var key in DataExportGeneratorClass.Tables)
        tableArray.push({value: DataExportGeneratorClass.Tables[key].name, text: d(DataExportGeneratorClass.Tables[key].title) ? DataExportGeneratorClass.Tables[key].title : DataExportGeneratorClass.Tables[key].name});

    html += lzm_inputControls.createSelect('s-data-export-tables','','','','',{},'Table',tableArray,'','');

    html += '</fieldset><fieldset class="lzm-fieldset-full"><legend>'+tid('fields')+'</legend>';

    html += '<div id="s-data-field-list" style="overflow:auto;height:200px;"></div></fieldset>';

    html += '<fieldset class="lzm-fieldset-full"><legend>'+tid('settings')+'</legend><table class="tight"><tr><td style="vertical-align: top;width:100px;"><label>'+tidc('format')+'</label>';

    for(key in DataExportGeneratorClass.Formats)
        html += lzm_inputControls.createRadio('s-data-export-format-'+DataExportGeneratorClass.Formats[key],'s-data-export-format','s-data-export-format',DataExportGeneratorClass.Formats[key],false,DataExportGeneratorClass.Formats[key]);

    html += '</td><td>';

    var from = (d(DataExportGeneratorClass.Settings.RowFrom) && !isNaN(DataExportGeneratorClass.Settings.RowFrom)) ? DataExportGeneratorClass.Settings.RowFrom : 0;
    html += lzm_inputControls.createInput('s-data-export-row-from','', from, 'From row:', '', 'number', '');

    html += '</td><td>';

    var to = (d(DataExportGeneratorClass.Settings.RowTo) && !isNaN(DataExportGeneratorClass.Settings.RowTo)) ? DataExportGeneratorClass.Settings.RowTo : 1000;
    html += lzm_inputControls.createInput('s-data-export-row-to','', to, 'To row:', '', 'number', '');

    html += '</td></tr></table><br>';


    html += '</fieldset>';

    return html;

};

DataExportGeneratorClass.GetFooterHTML = function(){

    return lzm_inputControls.createButton('dev-generate-btn', '', '', tid('download'), '', 'force-text',{'margin-left': '4px'},'',30,'d') +
    lzm_inputControls.createButton('dev-close-btn', '', '', tid('close'), '', 'lr',{'margin-left': '4px'},'',30,'d');

};