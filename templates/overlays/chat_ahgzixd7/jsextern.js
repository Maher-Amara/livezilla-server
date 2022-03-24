var lz_chat_full_load = true;
var lz_chat_status_change = true;
var lz_chat_status = -1;
var lz_chat_last_message_received = null;
var lz_chat_last_poster = null;
var lz_sound_player = null;
var lz_ticket = null;
var lz_flood = false;
var lz_timer_typing = null;
var lz_timer_connecting = null;
var lz_header_text = "";
var lz_chat_waiting_posts_timer;
var lz_chat_invite_timer = null;
var lz_chat_scrolled = false;
var lz_leave_chat = false;
var lz_chat_human_available = false;
var lz_chat_declined = false;
var lz_chat_init_feedback = false;
var lz_mode_show_options = false;
var lz_chat_kb_last_search_phrase = "";
var lz_chat_kb_search_phrase = "";
var lz_chat_kb_sound_played = false;
var lz_chat_et_attempt = false;
var lz_default_meta = null;
var lz_default_overflow = '';
var lz_chat_overlay_pointer = null;
var lz_operator_typing = false;
var lz_hide_widget_by_conf = false;
var lz_first_call = true;
var lz_chat_option_function;
var lz_mode_phone_outbound = false;
var lz_mode_phone_inbound = false;
var lz_mode_chat_login = false;

if(typeof OverlayChatWidgetV2 != 'undefined')
{
    var lz_external = new lz_chat_external_user();

    OverlayChatWidgetV2.__Ratio = 1;

    if(typeof lz_ovlel_rat != 'undefined')
        OverlayChatWidgetV2.__Ratio = lz_ovlel_rat;

    OverlayChatWidgetV2.__SizeWidth = Math.floor(48*OverlayChatWidgetV2.__Ratio);
    OverlayChatWidgetV2.__SizeHeight = Math.floor(48*OverlayChatWidgetV2.__Ratio);
    OverlayChatWidgetV2.__Border = 0;
    OverlayChatWidgetV2.__Space = Math.floor(5*OverlayChatWidgetV2.__Ratio);
    OverlayChatWidgetV2.__Scale = '.0' + Math.floor(14*OverlayChatWidgetV2.__Ratio).toString();
    OverlayChatWidgetV2.__ModeCombi = false;
    OverlayChatWidgetV2.__ModeSingle = false;
    OverlayChatWidgetV2.__ModeClassic = false;
    OverlayChatWidgetV2.__ModeAPI = false;
    OverlayChatWidgetV2.__ModeFeedback = false;
    OverlayChatWidgetV2.__ModeTOS = false;
    OverlayChatWidgetV2.__ModeTicketReceived = false;
    OverlayChatWidgetV2.__ModeChangeDetails = false;
    OverlayChatWidgetV2.__ModeBot = false;
    OverlayChatWidgetV2.__ModeTextInline = false;
    OverlayChatWidgetV2.__FormConfirmRequired = false;
    OverlayChatWidgetV2.__FormVisible = false;
    OverlayChatWidgetV2.__TicketRequired = false;
    OverlayChatWidgetV2.__CurrentChatId = 0;
    OverlayChatWidgetV2.__LastChatId = 0;
    OverlayChatWidgetV2.__PostsNoticed = lz_is_mobile;
    OverlayChatWidgetV2.__LastPostReceived = null;
    OverlayChatWidgetV2.__IsPostStatusUpdate = false;
    OverlayChatWidgetV2.__IsWaitingForNotice = false;
    OverlayChatWidgetV2.__NoBotChat = false;
    OverlayChatWidgetV2.__Connecting = false;
    OverlayChatWidgetV2.__CurrentGroup = null;
    OverlayChatWidgetV2.ChatInitiated = false;
    OverlayChatWidgetV2.ChatStarted = false;
    OverlayChatWidgetV2.ChatEnded = false;
    OverlayChatWidgetV2.CurrentOperator = null;
    OverlayChatWidgetV2.TargetGroupId = null;
    OverlayChatWidgetV2.TargetOperatorId = null;
    OverlayChatWidgetV2.AcceptTOS = false;
    OverlayChatWidgetV2.AcceptCR = false;
    OverlayChatWidgetV2.DeclineCR = false;
    OverlayChatWidgetV2.InputBlocked = false;
    OverlayChatWidgetV2.FeedbackOnMouseMove = false;
    OverlayChatWidgetV2.MouseMoveEvent = null;
    OverlayChatWidgetV2.TranslateErrorTimer = null;
    OverlayChatWidgetV2.DoneTranslateCallback = null;
    OverlayChatWidgetV2.ButtonTexts = null;
    OverlayChatWidgetV2.RoomMembers = [];
    OverlayChatWidgetV2.Screenshot = null;
    OverlayChatWidgetV2.ScreenCaptureToStartChat = false;
    OverlayChatWidgetV2.FileUploadToStartChat = false;
    OverlayChatWidgetV2.RemoveAttachmentId = null;
    OverlayChatWidgetV2.PostPreview = null;
    OverlayChatWidgetV2.Margin = [0,0,0,0];
    OverlayChatWidgetV2.PreviewTextControl = false;
    OverlayChatWidgetV2.QueueTime = 0;
    OverlayChatWidgetV2.QueuePosition = 0;
    OverlayChatWidgetV2.ChatLoadingElement = null;

    if(typeof lz_ovlel_text_inline != 'undefined')
    {
        if(lz_global_get_window_width() > 500)
            OverlayChatWidgetV2.__ModeTextInline = !lz_ovlel_fsm;
        else
            lz_border_radius = 6;
    }

    document.addEventListener('mousemove',function(event){
        OverlayChatWidgetV2.MouseMove(event);
    }, false);


    function lz_chat_unset_focus(){
        try
        {
            if(LiveZillaData.InputFieldIndices != null)
            {
                if(document.getElementById("lz_chat_data_form").style.display != 'none')
                {
                    for(var i = 0;i< LiveZillaData.InputFieldIndices.length;i++)
                    {
                        var findex = LiveZillaData.InputFieldIndices[i];
                        if(document.getElementById('lz_form_'+findex) != null && document.getElementById('lz_form_'+findex).style.display != 'none')
                        {
                            document.getElementsByName('form_'+findex)[0].blur();
                        }

                    }
                }
                else
                    document.getElementById('lz_chat_text').blur();
            }
        }
        catch(ex){}
    }

    function lz_chat_set_focus(_call){
        try
        {
            if(lz_mode_show_options || lz_is_mobile)
            {
                return;
            }

            if(lz_chat_is_visible() && LiveZillaData.InputFieldIndices != null)
            {
                var input = null;
                if(document.getElementById("lz_chat_data_form").style.display != 'none')
                {
                    for(var i = 0;i< LiveZillaData.InputFieldIndices.length;i++)
                    {
                        var findex = LiveZillaData.InputFieldIndices[i];
                        if(document.getElementById('lz_form_'+findex) != null && document.getElementById('lz_form_'+findex).style.display != 'none')
                            if(document.getElementsByName('form_'+findex)[0].value == "")
                            {
                                input = document.getElementsByName('form_'+findex)[0];
                                break;
                            }
                    }
                }
                else
                {
                    input = document.getElementById('lz_chat_text');
                }
                if(input != null)
                    lz_chat_set_focus_ctrl(input);
            }
        }
        catch(ex){}
    }

    function lz_chat_set_focus_ctrl(_ctrl){
        try
        {
            _ctrl.focus();
            var val = _ctrl.value;
            _ctrl.value = '';
            _ctrl.value = val;
        }
        catch(ex){}
    }

    function lz_chat_switch_details(_cancel){
        if(!_cancel && OverlayChatWidgetV2.__ModeChangeDetails)
        {
            if(lz_session.OVLWMSElem =="chat")
            {
                LiveZillaData.WriteToServer = true;
                LiveZilla.Engine.Poll(1112);
            }
        }
        OverlayChatWidgetV2.__ModeChangeDetails = !OverlayChatWidgetV2.__ModeChangeDetails;
        OverlayChatWidgetV2.UpdateUI();
        OverlayChatWidgetV2.UpdateButtonUI();
        lz_chat_set_focus(1);
    }

    function lz_chat_update_name(){

        var _name = lz_chat_get_input_value(111);
        if(lz_global_trim(_name) == "")
            _name = lz_guest_name;
        for(var i=0;i<document.getElementById("lz_chat_content_box").getElementsByTagName("DIV").length;i++)
        {
            var dato = document.getElementById("lz_chat_content_box").getElementsByTagName("DIV")[i].getAttribute("data-my");
            if(dato == 1)
            {
                if(document.getElementById("lz_chat_content_box").getElementsByTagName("DIV")[i].className.indexOf("lz_overlay_chat_message_name_external")!=-1)
                {
                    document.getElementById("lz_chat_content_box").getElementsByTagName("DIV")[i].getElementsByTagName("SPAN")[0].innerHTML = lz_global_htmlentities(_name);
                }
                else if(document.getElementById("lz_chat_content_box").getElementsByTagName("DIV")[i].className.indexOf("lz_overlay_chat_message_avatar_external")!=-1)
                    document.getElementById("lz_chat_content_box").getElementsByTagName("DIV")[i].getElementsByTagName("DIV")[0].style.backgroundImage = "url('"+lz_poll_server+"picture.php?name="+lz_global_base64_url_encode(_name)+"&ebg="+lz_global_base64_url_encode(lz_color_primary)+"')";
            }
        }
    }

    function lz_global_get_time(_ts){

        if(!_ts.toString().length || isNaN(_ts))
            return '';
        _ts = parseInt(_ts) - lz_server_time_diff;
        var date = new Date(parseInt(_ts)*1000);
        var timeStr = date.toLocaleTimeString();
        if(timeStr=="Invalid Date")
            return _ts;
        return timeStr;
    }

    function lz_chat_replace_icon(){
        for(var i=0;i<document.getElementById("lz_chat_content_box").getElementsByTagName("span").length;i++)
            if(document.getElementById("lz_chat_content_box").getElementsByTagName("span")[i].className == "lz_overlay_chat_message_change")
                    document.getElementById("lz_chat_content_box").getElementsByTagName("span")[i].innerHTML = lz_get_icon('','pencil','','');
    }

    function lz_chat_switch_options_table(_forceClose){
        lz_chat_switch_icon_toggle('lz_chat_switch_so',lz_session.OVLCSound==1);
        lz_chat_switch_icon_toggle('lz_chat_switch_tr',lz_session.TransFrom!='');
        lz_chat_update_transcript_ui();
        document.getElementById('lz_chat_options_table').style.display = (document.getElementById('lz_chat_options_table').style.display=='none' && !_forceClose) ? '' : 'none';
        document.getElementById("lz_chat_overlay_bottom").style.opacity =
        document.getElementById("lz_chat_content_box").style.opacity = (document.getElementById('lz_chat_options_table').style.display!='none') ? .2 : 1;
        document.getElementById('lz_cf_ec').style.display = (OverlayChatWidgetV2.__CurrentChatId != 0 && (lz_chat_status == 1 || lz_chat_status == 2)) ? 'block' : 'none';
        OverlayChatWidgetV2.UpdateChatFunctions();
    }

    function lz_chat_set_translation(_activeId,_from,_into){
        if(lz_overlay_chat != null)
        {
            if(_into != null)
            {
                _into = lz_global_base64_decode(_into).toLowerCase();
                _into = (_into.length==0) ? null : _into;
            }

            if(_from != null)
            {
                _from = lz_global_base64_decode(_from).toLowerCase();
                _from = (_from.length==0) ? null : 'AUTO';
            }

            if(_activeId != null && lz_session.TransSID != _activeId)
            {
                if(_activeId != null)
                    lz_session.TransSID = _activeId;

                if(_into != null)
                    lz_session.TransInto = _into;

                if(_from != null)
                    lz_session.TransFrom = _from;
                else
                    lz_session.TransFrom = "";

                lz_session.Save();
            }
            lz_chat_update_translation_ui();
        }
    }

    function lz_chat_update_translation_ui(){
        var active = lz_session.TransFrom!='';
        lz_chat_switch_icon_toggle('lz_chat_switch_tr',active);
    }

    function lz_chat_update_transcript_ui(){

        var active = lz_session.Transcript==1 && lz_chat_get_input_value(112) != '';
        lz_chat_switch_icon_toggle('lz_chat_switch_et',active);
    }

    function lz_chat_switch_translation(){
        lz_session.TransFrom = (lz_session.TransFrom=='') ? 'AUTO' : '';
        lz_session.Save();
        lz_chat_update_translation_ui();
    }

    function lz_chat_switch_transcript(_fromForm){

        var isEmail = lz_chat_get_input_value(112) != '';
        if(lz_session.Transcript==1 && !isEmail)
            lz_session.Transcript = 0;

        var old = lz_session.Transcript;

        lz_session.Transcript = (lz_session.Transcript==1 || !isEmail) ? 0 : 1;
        lz_session.Save();
        lz_chat_update_transcript_ui();

        if(old==0 && lz_chat_get_input_value(112) == '' && !_fromForm)
        {
            lz_chat_et_attempt = true;
            lz_chat_switch_options_table(true,2);
            lz_chat_switch_details(false);
            document.getElementsByName('form_112')[0].focus();
        }
        LiveZillaData.WriteToServer = true;
        LiveZilla.Engine.Poll(5532);
    }

    function lz_chat_switch_sound(){
        lz_session.OVLCSound = lz_session.OVLCSound==1 ? 0 : 1;
        lz_session.Save();
        lz_chat_switch_icon_toggle('lz_chat_switch_so',lz_session.OVLCSound==1);
    }

    function lz_chat_switch_icon_toggle(id,on){
        document.getElementById(id).getElementsByTagName('path')[0].setAttribute('d',lz_get_icon_path(on ? 'toggle-on' : 'toggle-off'));
        document.getElementById(id).style.fill = (on) ? lz_color_primary : 'var(--lz-icon-color)';
    }

    function lz_chat_fade_options(_in){
        var top = parseInt((lz_overlay_chat_height - 80) - parseInt(document.getElementById("lz_chat_overlay_options_box").style.height.replace("px","")));
        document.getElementById("lz_chat_overlay_options_box").style.top = (top/2) + "px";
        document.getElementById("lz_chat_overlay_options_frame").style.display =
        document.getElementById("lz_chat_overlay_options_box_bg").style.display =
        document.getElementById("lz_chat_overlay_options_box").style.display = (_in) ? "block" : 'none';
    }

    function lz_chat_print(){
        var pURL = lz_poll_server + "print.php?c=" + lz_global_base64_url_encode(OverlayChatWidgetV2.__LastChatId) + "&b=" + lz_global_base64_url_encode(lz_session.UserId+"_OVL") + "&i=" + lz_global_base64_url_encode(lz_session.UserId) + "&r=" + Math.random().toString();
        OverlayChatWidgetV2.OpenWindow(pURL,false);
    }

    function lz_chat_set_typing(_typingText,_fromTimer){

        if(lz_overlay_chat != null)
        {
            if(OverlayChatWidgetV2.__ModeBot)
                _typingText = null;

            if(OverlayChatWidgetV2.__Connecting)
            {
                if(!_fromTimer && lz_timer_connecting != null)
                    return;

                if(document.getElementById("lz_chat_overlay_info").innerHTML.length == 0)
                {
                    document.getElementById("lz_chat_overlay_info").innerHTML = lz_text_connecting_info;
                }
                else
                {
                    document.getElementById("lz_chat_overlay_info").innerHTML = "";
                }

                lz_timer_connecting = setTimeout(function(){
                    lz_chat_set_typing('',true);
                },700);
            }
            else
            {
                if(lz_timer_connecting != null)
                    clearTimeout(lz_timer_connecting);

                lz_timer_connecting = null;

                if(OverlayChatWidgetV2.CurrentOperator != null && _typingText != null && !lz_operator_typing)
                {
                    var ___createTypingBox = function(_id,_preview){
                        var pdiv = document.createElement('div');
                        pdiv.id = _id;
                        var thtml = ((lz_chat_last_poster != OverlayChatWidgetV2.CurrentOperator.Id) ? lz_global_base64_decode(lz_post_html) : lz_global_base64_decode(lz_add_html));
                        thtml = thtml.replace("<!--message-->",'<div class="lz_anim_point_load" style="padding:5px 0 0 0 !important;"><span></span><span></span><span></span></div>');
                        thtml = thtml.replace("<!--server-->",lz_poll_server);
                        thtml = thtml.replace("name=<!--ename-->&ebg=<!--bgce-->","operator=" + encodeURIComponent(OverlayChatWidgetV2.CurrentOperator.Id));
                        thtml = thtml.replace("<!--time-->","");
                        thtml = thtml.replace("lz_overlay_chat_message_change","");
                        thtml = thtml.replace("<!--name-->",lz_global_htmlentities(OverlayChatWidgetV2.CurrentOperator.Fullname));
                        pdiv.innerHTML = thtml;
                        
                        if(_preview)
                            pdiv.classList.add('lz_preview_message');
 
                        return pdiv;
                    };

                    lz_operator_typing = true;

                    document.getElementById('lz_chat_content_inlay').appendChild(___createTypingBox('lz_chat_overlay_typing_post'));
                    
                    if(OverlayChatWidgetV2.PreviewTextControl)
                        document.getElementById('lz_overlay_preview_messages').appendChild(___createTypingBox('lz_chat_overlay_typing_post_preview',true));

                    OverlayChatWidgetV2.ScrollDown(12834);
                }
                else if(_typingText == null && lz_operator_typing && document.getElementById('lz_chat_overlay_typing_post') != null)
                {
                    lz_operator_typing = false;

                    document.getElementById('lz_chat_content_inlay').removeChild(document.getElementById('lz_chat_overlay_typing_post'));
                    delete document.getElementById('lz_chat_overlay_typing_post');

                    if(document.getElementById('lz_chat_overlay_typing_post_preview') != null)
                    {
                        document.getElementById('lz_overlay_preview_messages').removeChild(document.getElementById('lz_chat_overlay_typing_post_preview'));
                        delete document.getElementById('lz_chat_overlay_typing_post_preview');
                    }
                }
            }
        }
    }

    function lz_chat_switch_extern_typing(_typing){

        if(OverlayChatWidgetV2.__ModeBot)
        {
            _typing = false;
        }

        var announce = (_typing != lz_external.Typing);
        if(_typing)
        {
            OverlayChatWidgetV2.__PostsNoticed = true;

            if(lz_timer_typing != null)
                clearTimeout(lz_timer_typing);

            lz_timer_typing = setTimeout(function(){
                lz_chat_switch_extern_typing(false);
            },5000);
        }
        lz_external.Typing = _typing;
        if(announce && OverlayChatWidgetV2.CurrentOperator != null)
            LiveZilla.Engine.Poll(1115);
    }

    function lz_kb_set_url(_searchFor){

        document.getElementById("lz_overlay_module_knowledgebase").style.display = 'block';
        var url = lz_poll_server + 'knowledgebase.php?no-logo=MQ__&etc=' + lz_global_base64_url_encode(lz_color_secondary) + '&ptl=' + LiveZillaData.Language  + "&ckf=" + lz_kb_root;

        if(!lz_overlay_chat.m_FullScreenMode)
            url += '&tops=MQ__';

        if(_searchFor!='')
            url += '&search-for=' + _searchFor;

        document.getElementById("lz_overlay_module_knowledgebase").getElementsByTagName("iframe")[0].src = url;
    }

    function lz_chat_set_members(_groupId,_show,_list){

        if(_show && lz_global_get_window_width(true) < 600)
            _show = false;

        document.getElementById("lz_chat_members_box").style.display = _show ? 'block' : 'none';
        document.getElementById("lz_chat_content_box").style.left = !_show ? '0' : '201px';

        if(_show)
        {
            if(lz_session.OVLWMState == '1' && !lz_overlay_chat.m_FullScreenMode)
                document.getElementById("lz_overlay_chat").style.width = '600px';

            lz_overlay_chat_width = 600;
        }

        var scroll=false,line,html_v = '',html_o = '';

        for(var k = 0; k < _list.length; k++)
        {
            var name = lz_guest_name;

            if(lz_d(_list[k]) && lz_d(_list[k].name))
            {
                if(_list[k].name.length && lz_global_base64_url_decode(_list[k].name).length)
                    name = lz_global_base64_url_decode(_list[k].name);

                var avbg = (!_list[k].op) ? 'name=' + lz_global_base64_url_encode(name) : 'operator=' + encodeURIComponent(_list[k].id);

                line = '<div><span style="background-image: url(\''+lz_poll_server+'picture.php?'+avbg+'\');"></span>'+lz_substr(name,18,true)+'</div>';

                if(_list[k].op)
                    html_o += line;
                else
                    html_v += line;
            }
        }

        if(lz_chat_status == 2 && _groupId != null)
            OverlayChatWidgetV2.__PublicGroupChat = _groupId;

        var html = (html_o.length) ? html_o+''+html_v : html_v;

        if(document.getElementById("lz_chat_members_box").innerHTML != html)
            document.getElementById("lz_chat_members_box").innerHTML  = html;

        // leave message
        for(i=0; i<OverlayChatWidgetV2.RoomMembers.length; i++)
        {
            found = false;
            for(x=0; x<_list.length; x++)
                if(OverlayChatWidgetV2.RoomMembers[i].id == _list[x].id)
                    found = true;

            if(!found)
            {
                if(lz_external.Id == '' || lz_external.Id == OverlayChatWidgetV2.RoomMembers[i].id)
                {
                    continue;
                }

                scroll = true;
                OverlayChatWidgetV2.AddSystemMessage(lz_text_left.replace('<!--intern_name-->',lz_global_base64_url_decode(OverlayChatWidgetV2.RoomMembers[i].name)));
            }
        }

        //  join mess
        for(var i=0; i<_list.length; i++)
        {
            var found = false;
            for(var x=0; x<OverlayChatWidgetV2.RoomMembers.length; x++)
                if(_list[i].id == OverlayChatWidgetV2.RoomMembers[x].id)
                    found = true;

            if(!found)
            {
                if(lz_external.Id == '' || lz_external.Id == _list[i].id)
                {
                    continue;
                }

                scroll = true;
                if(!OverlayChatWidgetV2.RoomMembers.length)
                    OverlayChatWidgetV2.AddSystemMessage(lz_text_speaking_to.replace('<!--operator_name-->',lz_global_base64_url_decode(_list[i].name)));
                else
                    OverlayChatWidgetV2.AddSystemMessage(lz_text_arrives.replace('<!--intern_name-->',lz_global_base64_url_decode(_list[i].name)));
            }
        }

        OverlayChatWidgetV2.UpdateChatHistoryUI();

        OverlayChatWidgetV2.RoomMembers = _list;

        if(scroll)
            OverlayChatWidgetV2.ScrollDown(24214);
    }

    function lz_chat_data_form_result(){

        if(lz_session.OVLWMSElem == 'chat' && !OverlayChatWidgetV2.IsChatAvailable())
        {
            OverlayChatWidgetV2.SetMode('ticket',false);
            return;
        }

        OverlayChatWidgetV2.__FormConfirmRequired = false;
        if(OverlayChatWidgetV2.__ModeTicketReceived)
        {
            lz_load_inputs = true;
            LiveZilla.Engine.Poll(1027);
            OverlayChatWidgetV2.__ModeTicketReceived = false;
            OverlayChatWidgetV2.UpdateUI();
            lz_chat_set_focus(7);
        }
        else if(OverlayChatWidgetV2.__ModeChangeDetails)
        {
            lz_chat_switch_details(false);
            if(lz_chat_et_attempt)
            {
                lz_chat_et_attempt = false;
                lz_chat_switch_transcript(true);
            }
        }
        else if(lz_session.OVLWMSElem =="chat")
            OverlayChatWidgetV2.StartChat();
        else if(lz_session.OVLWMSElem =="ticket")
            lz_chat_send_ticket();
        else if(lz_session.OVLWMSElem =="phone")
            lz_chat_send_ticket(true);
    }

    function lz_chat_update_kb_counter(_count){
        if(document.getElementById("livezilla_wm_c_knowledgebase")!==null)
        {
            document.getElementById("livezilla_wm_c_knowledgebase").style.display = (_count > 0) ? "table-cell" : 'none';
            document.getElementById("livezilla_wm_c_knowledgebase").innerHTML = _count;
        }
    }

    function lz_chat_init_search_kb(){
        var phrase = lz_chat_get_input_value(114);
        if(lz_session.KBS != 1 || phrase.length < 12)
            return;

        if(phrase != lz_chat_kb_last_search_phrase)
        {
            lz_shared_kb_last_search_time = lz_global_timestamp();
            lz_chat_kb_last_search_phrase =
                lz_chat_kb_search_phrase = phrase;
            LiveZilla.Engine.Poll(1241);
        }
    }

    function lz_chat_search_result(unused,_count){
        lz_chat_kb_search_phrase = "";
        document.getElementById('lz_chat_kb_match_info').style.display = (_count > 0) ? "block" : 'none';
        if(_count>0 && !lz_chat_kb_sound_played)
        {
            OverlayChatWidgetV2.PlaySound(OverlayChatWidgetV2.NotificationSound);
            lz_chat_kb_sound_played = true;

        }
        lz_kb_set_url(document.getElementsByName('form_114')[0].value);
        lz_chat_update_kb_counter(_count);
    }

    function lz_chat_post(){
        this.MessageText = '';
        this.MessageTranslationText = '';
        this.MessageId = '';
        this.Received = false;
    }

    function lz_chat_operator(){
        this.Id = '';
        this.Fullname = '';
        this.Group = '';
        this.Language = "en";
    }

    function lz_chat_external_user(){
        this.Id = '';
        this.Username = '';
        this.Email = '';
        this.Company = '';
        this.Question = '';
        this.Typing = false;
        this.MessagesSent = [];
    }

    function lz_chat_mail_callback(_flood){
        lz_chat_loading(false);
        OverlayChatWidgetV2.__ModeTicketReceived = true;

        document.getElementById('lz_chat_ticket_received').style.display = (_flood) ? '' : 'none';
        document.getElementById('lz_chat_ticket_flood').style.display = (!_flood) ? '' : 'none';

        if(_flood)
        {
            document.getElementsByName('form_114')[0].value = "";
            lz_ticket = null;
        }
        else
            lz_flood = true;

        OverlayChatWidgetV2.UpdateUI();
    }

    function lz_chat_send_ticket(){
        lz_chat_save_input_value(114,document.getElementsByName('form_114')[0].value);
        if(lz_check_missing_inputs(true,'lz_chat_send_ticket'))
        {
            lz_chat_loading(true);
            lz_ticket = lz_global_timestamp();
            LiveZillaData.WriteToServer = true;
            setTimeout(function(){
                OverlayChatWidgetV2.AnswerChatRequest(true,true);
                //LiveZilla.Engine.Poll(1116,true);
            },500);
        }
    }

    function lz_chat_loading(_loading){

        var change = (_loading != (document.getElementById('lz_chat_overlay_loading').style.display=="block"));
        document.getElementById('lz_chat_overlay_loading').style.display = (_loading) ? "block" : 'none';
        if(change)
        {
            if(_loading)
                lz_chat_unset_focus();
            else
                lz_chat_set_focus(43);
        }
    }

    function lz_check_missing_inputs(_display,_contFunc){


        if(LiveZillaData.InputFieldIndices == null)
            return false;

        var isFilled=false,missingInput=false,validationreq = false;
        var irequired = (lz_session.OVLWMSElem == "chat") ? OverlayChatWidgetV2.__CurrentGroup.ChatInputsMandatory : OverlayChatWidgetV2.__CurrentGroup.TicketInputsMandatory;
        var ihidden = (lz_session.OVLWMSElem == "chat") ? OverlayChatWidgetV2.__CurrentGroup.ChatInputsHidden : OverlayChatWidgetV2.__CurrentGroup.TicketInputsHidden;
        var isPlaceholderSupport = lz_is_placeholder_support();

        for(var i = 0;i < LiveZillaData.InputFieldIndices.length;i++)
        {
            var findex = LiveZillaData.InputFieldIndices[i];
            if(findex == 115 || (document.getElementById("files_" + findex)==null && LiveZillaData.InputFieldValues[i].Type == "File"))
                continue;

            if(LiveZillaData.InputFieldValues[i].Active || (findex == 116 && lz_session.OVLWMSElem == "phone"))
            {
                try
                {
                    if(LiveZillaData.InputFieldValues[i].Type == "File")
                        isFilled = document.getElementById("files_" + findex).children.length > 0 || lz_session.OVLWMSElem == "chat";
                    else
                        isFilled = (LiveZillaData.InputFieldValues[i].Type == "CheckBox") ? true /*document.getElementsByName("form_" + findex)[0].checked*/ : lz_chat_get_input_value(findex).length > 0;

                    if(!isPlaceholderSupport && isFilled && LiveZillaData.InputFieldValues[i].Type != "CheckBox" && lz_global_trim(document.getElementsByName("form_" + findex)[0].value) == document.getElementById("lz_form_ph_" + findex).value)
                        isFilled = false;
                }
                catch(ex)
                {

                }

                var vrequired = (lz_array_indexOf(ihidden,findex) == -1 && (lz_array_indexOf(irequired,findex) != -1 || LiveZillaData.InputFieldValues[i].Validation));

                if(findex == 112 && LiveZillaData.InputFieldValues[i].Value.length)
                {
                    if(LiveZillaData.InputFieldValues[i].Value.indexOf('@') == -1 || LiveZillaData.InputFieldValues[i].Value.indexOf('.') == -1 || LiveZillaData.InputFieldValues[i].Value.length < 5)
                    {
                        isFilled = false;
                    }
                }

                if(vrequired && document.getElementById("lz_form_" + findex).style.display == 'none')
                    vrequired = false;

                var vcallback = (findex == 116 && lz_session.OVLWMSElem == "phone");
                var vquestion = false;

                if(LiveZillaData.InputFieldValues[i].Validation && !LiveZillaData.InputFieldValues[i].Validated && lz_array_indexOf(ihidden,LiveZillaData.InputFieldIndices[i]) == -1)
                    validationreq = true;

                if((vrequired || vcallback || vquestion) && (!isFilled))
                {
                    if(_display)
                    {
                        document.getElementById("lz_form_mandatory_" + findex).className = "lz_input_icon lz_required";
                        document.getElementById("lz_form_mandatory_" + findex).style.display = "block";
                    }
                    missingInput = true;
                }
                else if(_display)
                {
                    if(document.getElementById("lz_form_info_" + findex).innerHTML.length > 0)
                    {
                        document.getElementById("lz_form_mandatory_" + findex).className = "lz_input_icon lz_info";
                        document.getElementById("lz_form_mandatory_" + findex).style.display = "block";
                    }
                    else
                        document.getElementById("lz_form_mandatory_" + findex).style.display = 'none';
                }
            }
        }

        if(OverlayChatWidgetV2.AcceptTOS)
        {
            if(_display)
                document.getElementById('lz_form_mandatory_tos').style.display = 'none';

            if(!document.getElementById('lz_ccb_tos').checked)
            {
                if(_display)
                    document.getElementById('lz_form_mandatory_tos').style.display = 'block';
                missingInput = true;
            }
        }

        var group = LiveZillaData.Groups.GetGroupById(document.getElementById('lz_form_groups').value);
        document.getElementById("lz_form_mandatory_group").className = "lz_input_icon lz_required";

        if(_display)
            document.getElementById("lz_form_mandatory_group").style.display = (group == null) ? "block" : 'none';

        if(group == null)
            missingInput = true;

        if(missingInput && !validationreq)
        {
            return false;
        }
        else if(!missingInput && _contFunc != null)
        {
            return lz_validate_inputs(_contFunc, ihidden);
        }
        else
        {
            return !validationreq && !missingInput;
        }
    }

    function lz_validate_inputs(_contFunc,_hidden){

        var i;

        LiveZillaData.ValidationRequired = false;
        for(i = 0;i < LiveZillaData.InputFieldValues.length;i++)
            LiveZillaData.InputFieldValues[i].SetStatus(null,false);
        for(i = 0;i < LiveZillaData.InputFieldValues.length;i++)
        {
            if(LiveZillaData.InputFieldValues[i].Active)
            {
                if(LiveZillaData.InputFieldValues[i].Validation && !LiveZillaData.InputFieldValues[i].Validated && lz_array_indexOf(_hidden,LiveZillaData.InputFieldIndices[i]) == -1)
                {
                    LiveZillaData.ValidationRequired = true;//(LiveZillaData.InputFieldValues[i].Type != "CheckBox");
                    LiveZillaData.InputFieldValues[i].ValidationResult = null;
                    lz_chat_loading(true);
                    if(LiveZillaData.ValidationRequired && LiveZillaData.InputFieldValues[i].ValidationURL.length > 5)
                    {
                        LiveZillaData.InputFieldValues[i].Validate(_contFunc);
                        return false;
                    }
                }
            }
        }
        return true;
    }

    function lz_validate_input_result(_result,_id){

        var failed = false;
        for(var i = 0;i < LiveZillaData.InputFieldValues.length;i++)
        {
            if(LiveZillaData.InputFieldValues[i].Index != _id || LiveZillaData.InputFieldValues[i].Validated)
                continue;
            if(LiveZillaData.InputFieldValues[i].ValidationResult != null)
                continue;

            var cinput = LiveZillaData.InputFieldValues[i];
            cinput.Validated = true;
            cinput.ValidationResult = _result;
            clearTimeout(cinput.ValidationTimeoutObject);

            if(_result === false)
                failed = true;
            else if(_result === -1)
            {
                if(cinput.ValidationContinueOnTimeout)
                {
                    cinput.ValidationResult = true;
                    eval(cinput.ValidationContinueAt);
                    return;
                }
                else
                    failed = true;
            }
            else if(_result === true)
            {
                eval(cinput.ValidationContinueAt);
                return;
            }

            if(failed)
            {
                setTimeout(function(){lz_chat_loading(false);},500);
                setTimeout(function(){document.getElementById('lz_form_mandatory_' + cinput.Index.toString()).style.display = '';},501);
                setTimeout(function(){document.getElementById('lz_form_mandatory_' + cinput.Index.toString()).className = 'lz_input_icon lz_required lz_anim_hs';},700);

                cinput.Validated = false;

                for(var x=0;x< LiveZillaData.InputFieldValues.length;x++)
                    LiveZillaData.InputFieldValues[x].Validated = false;

                return;
            }
        }
    }

    function lz_chat_scroll(){
        if(!lz_chat_scrolled)
        {
            lz_chat_scrolled = true;
            OverlayChatWidgetV2.UpdateChatHistoryUI();
            OverlayChatWidgetV2.ScrollDown(47526);
        }
    }

    function lz_chat_pre_change_group(_box){
        LiveZillaData.ForceSelectInit=true;
    }

    function lz_chat_change_group(_box){

        if(LiveZillaData.ForceGroupSelect && !LiveZillaData.ForceSelectMade && _box.selectedIndex == _box.childNodes.length-1)
            return;

        if(LiveZillaData.ForceGroupSelect && LiveZillaData.ForceSelectInit && !LiveZillaData.ForceSelectMade)
        {
            LiveZillaData.ForceSelectMade = true;
            _box.removeChild(LiveZillaData.Groups.ForceSelectOption);
            OverlayChatWidgetV2.UpdateFormUI();
        }
        var last = (OverlayChatWidgetV2.__CurrentGroup != null) ? OverlayChatWidgetV2.__CurrentGroup.Id+OverlayChatWidgetV2.__CurrentGroup.Amount : "";

        OverlayChatWidgetV2.__CurrentGroup = LiveZillaData.Groups.GetGroupById(_box.value);

        if(OverlayChatWidgetV2.__CurrentGroup == null)
        {
            var position = _box.selectedIndex;
            var reset = false;
            while(OverlayChatWidgetV2.__CurrentGroup == null)
            {
                position++;
                if(position == _box.childNodes.length)
                    if(!reset)
                    {
                        position = 0;
                        reset=true;
                    }
                    else
                        break;
                OverlayChatWidgetV2.__CurrentGroup = LiveZillaData.Groups.GetGroupById(_box.childNodes[position].value);
            }
        }
        var current = (OverlayChatWidgetV2.__CurrentGroup != null) ? OverlayChatWidgetV2.__CurrentGroup.Id+OverlayChatWidgetV2.__CurrentGroup.Amount : "";
        if(OverlayChatWidgetV2.__CurrentGroup != null)
        {
            if(_box.length > position)
                _box.selectedIndex = position;

            if(last != current)
            {
                OverlayChatWidgetV2.UpdateUI();
            }
            _box.style.color = _box.childNodes[_box.selectedIndex].style.color;
            _box.style.background = _box.childNodes[_box.selectedIndex].style.background;
        }

        OverlayChatWidgetV2.ValidateMode();
        OverlayChatWidgetV2.UpdateUI();
        OverlayChatWidgetV2.UpdateButtonUI();
        OverlayChatWidgetV2.UpdateWMUI();
        OverlayChatWidgetV2.SetGroupInfo();
    }

    function lz_chat_show_info_box(_icon,_active){
        var id = _icon.id.replace('lz_form_mandatory_','');
        var box = document.getElementById('lz_form_info_' + id);
        box.style.display = (_active && box.style.display != 'block') ? 'block' : 'none';

        if(lz_overlay_chat.m_FullScreenMode)
            box.style.marginLeft = "34px";
        else
            box.style.right = "30px";
    }

    function lz_chat_switch_options(_function,_cancel,_type,_findex){

        var functions = [];
        if(!_cancel)
        {
            lz_chat_unset_focus();

            var show = document.getElementById("lz_chat_overlay_options_box").style.display == 'none';

            for(var i = 0;i<functions.length;i++)
                document.getElementById('lz_chat_overlay_option_function_' + functions[i]).style.display = (_function == functions[i]) ? "block" : 'none';

            if(show)
            {
                lz_chat_option_function = _function;

                if(_function=="fu")
                {
                    var getp = (_type == 'ticket') ? 'uid=' +lz_global_base64_url_encode(lz_session.UserId)+'&bid=' +lz_global_base64_url_encode(lz_session.BrowserId) : 'cid='+ lz_global_base64_url_encode(OverlayChatWidgetV2.__CurrentChatId) + '&wt=ovlv2';

                    if(typeof _findex != 'undefined')
                        getp += '&find=' + lz_global_base64_url_encode(_findex);

                    if(OverlayChatWidgetV2.__CurrentGroup != null)
                        getp += '&gid=' + lz_global_base64_url_encode(OverlayChatWidgetV2.__CurrentGroup.Id);

                    getp += '&etc=' + lz_global_base64_url_encode(lz_color_primary);

                    var url = lz_poll_server+"upload.php?"+ getp + '&ptl=' + LiveZillaData.Language;

                    if(document.getElementById('lz_chat_overlay_file_upload_frame').src != url)
                        document.getElementById('lz_chat_overlay_file_upload_frame').src = url;
                }
            }
            else
            {
                if(_function=="fu")
                {
                    lz_load_inputs = true;
                    LiveZilla.Engine.Poll(1021);
                }
                lz_session.Save();
            }
            lz_mode_show_options = show;
            lz_chat_fade_options(show);
        }
        else
        {
            lz_chat_fade_options(false);
        }
    }

    function lz_chat_remove_att(_aId){
        OverlayChatWidgetV2.RemoveAttachmentId = _aId;
        LiveZilla.Engine.Poll(1412);
    }

    function lz_chat_load_input_values(_reset){
        for(var i = 0;i< LiveZillaData.InputFieldIndices.length;i++)
        {
            var findex = LiveZillaData.InputFieldIndices[i];
            if(document.getElementById("lz_form_" + findex) != null)
            {
                if(LiveZillaData.InputFieldValues[i].Type == "File")
                    continue;
                if(document.getElementsByName("form_" + findex)[0].tagName.toUpperCase() == "SELECT")
                    document.getElementsByName("form_" + findex)[0].selectedIndex = parseInt(LiveZillaData.InputFieldValues[i].Value);
                else if(document.getElementsByName("form_" + findex)[0].type.toUpperCase() == "CHECKBOX")
                {
                    if(document.getElementsByName("form_" + findex)[0].value=="" || _reset)
                        document.getElementsByName("form_" + findex)[0].value = LiveZillaData.InputFieldValues[i].Value;

                    document.getElementsByName("form_" + findex)[0].checked = (parseInt(LiveZillaData.InputFieldValues[i].Value)==1);
                }
                else
                {
                    if(document.getElementsByName("form_" + findex)[0].value=="" || _reset)
                        document.getElementsByName("form_" + findex)[0].value = lz_global_trim(LiveZillaData.InputFieldValues[i].Value);
                }
            }
        }
    }

    function lz_chat_kb_deactivate(_closeButton,_switchTo){

        lz_chat_search_result(0);
        if(_closeButton)
        {
            lz_session.KBS = 0;
            lz_session.Save();
        }

        if(_switchTo)
        {
            if(lz_chat_get_wm_element('knowledgebase') != null && !lz_kb_external)
                OverlayChatWidgetV2.SetMode('knowledgebase',true);
            else
                OverlayChatWidgetV2.Pop('knowledgebase','&eq='+lz_global_base64_encode(document.getElementsByName('form_114')[0].value));
        }
    }

    function lz_chat_open(_playSound){
        OverlayChatWidgetV2.Open(_playSound);
    }

    function lz_chat_show(_playSound){
        lz_chat_open(_playSound);
    }

    function lz_chat_hide(){
        lz_session.OVLWMState='0';
        OverlayChatWidgetV2.SetMode(OverlayChatWidgetV2.GetAutoMode());

        if(OverlayChatWidgetV2.__ModeClassic)
            lz_overlay_chat.SetVisible(false);
    }

    function lz_chat_overlay_set_mode(_a,_b){
        //comp
        OverlayChatWidgetV2.SetMode(_a,_b);
    }

    function lz_chat_is_visible(){
        return lz_session.OVLWMState=='1' && lz_session.OVLWMSElem != '' && lz_session.OVLWMSElem != 'wm';
    }

    function lz_chat_set_zoom(_click,_show){

        if(!lz_fixed_mode_possible())
            return;

        if(_show)
        {
            lz_chat_restore_meta();
            lz_overlay_chat.SetVisible(false);
            lz_overlay_chat.SetFixedMode(true);
            lz_default_overflow = document.body.style.overflow;
            document.body.style.position = 'fixed';
            document.body.style.overflow = 'hidden';
            document.body.style.right=0;
            document.body.style.left=0;

            lz_chat_set_meta();

            setTimeout(function(){
                lz_chat_set_slide(_click);
                lz_chat_update_css();
                OverlayChatWidgetV2.UpdateChatHistoryUI();
                    OverlayChatWidgetV2.ScrollDown(51194);
                },500
            );
        }
        else
        {
            lz_overlay_chat.SetVisible(false);
            lz_chat_restore_meta();
            document.body.style.position = "";
            document.body.style.overflow = lz_default_overflow;
            lz_overlay_chat.SetFixedMode(false);
            lz_chat_set_slide(false);
        }
    }

    function lz_chat_set_slide(_in){
        if(_in)
        {
            lz_overlay_chat.m_FrameElement.style["transform"] = "translateY(+100%)";
            lz_overlay_chat.m_FrameElement.style["-webkit-transform"] = "translateY(+100%)";
            lz_overlay_chat.SetVisible(true);
            lz_overlay_chat.m_FrameElement.className = 'lz_anim_slide_in';
        }
        else
        {
            lz_overlay_chat.m_FrameElement.style["transform"] = "";
            lz_overlay_chat.m_FrameElement.style["-webkit-transform"] = "";
            lz_overlay_chat.m_FrameElement.className = "";
        }
    }

    function lz_overlay_chat_impose_max_length(_object, _max){
        if(_object.value.length > _max)
            _object.value = _object.value.substring(0,_max);
    }

    function lz_chat_set_meta(){
        var key, etags = document.getElementsByTagName("meta");
        if(etags.length > 0)
            for (key in etags)
                if(etags[key].name == "viewport" && etags[key].id!="lzvpc")
                {
                    if(etags[key].content != null && etags[key].content.toLowerCase().indexOf('width=device-width') != -1)
                        return;

                    lz_default_meta = etags[key];
                    etags[key].parentNode.removeChild(etags[key]);
                }
        var meta = document.createElement('meta');
        meta.name = "viewport";
        meta.id="lzvpc";
        meta.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";
        document.getElementsByTagName('head')[0].appendChild(meta);
    }

    function lz_chat_restore_meta(){
        if(document.getElementById("lzvpc")!=null)
        {
            document.getElementById("lzvpc").setAttribute("content","");
            document.getElementsByTagName('head')[0].removeChild(document.getElementById("lzvpc"));
        }
        if(lz_default_meta != null)
            document.getElementsByTagName('head')[0].appendChild(lz_default_meta);
    }

    function lz_chat_get_wm_element(_type){
        for(var key = 0; key < lz_ovlel.length; key++)
            if(lz_ovlel[key] != null && lz_ovlel[key].type == _type)
                return lz_ovlel[key];
        return null;
    }

    function lz_chat_play_sound(_file){
        // comp 8.x
        OverlayChatWidgetV2.PlaySound(_file);
    }

    OverlayChatWidgetV2.StartChat = function(){

        if(lz_chat_status > 0 || (lz_chat_status == 0 && lz_check_missing_inputs(true,'OverlayChatWidgetV2.StartChat')))
        {
            LiveZillaData.WriteToServer = true;
            lz_chat_loading(false);
            if(lz_chat_status == 0)
            {
                if(document.getElementsByName('form_114')[0].value.length)
                {
                    document.getElementById('lz_chat_text').value = document.getElementsByName('form_114')[0].value;
                    OverlayChatWidgetV2.InputKeyUp({keyCode:13,ctrlKey:false});
                    //OverlayChatWidgetV2.InitChat();
                }
                else if(!OverlayChatWidgetV2.__ModeBot)
                {
                    OverlayChatWidgetV2.InitChat();
                }
            }
            OverlayChatWidgetV2.ChatStarted = true;
            OverlayChatWidgetV2.SetGroupInfo();
            OverlayChatWidgetV2.UpdateUI();
        }
        else
        {
            OverlayChatWidgetV2.UpdateUI();
            lz_chat_set_focus(8);
        }
        LiveZilla.Engine.Poll(1153,true);
    };

    OverlayChatWidgetV2.ReleasePost = function(_id,_time){
        for(var mIndex = 0; mIndex < lz_external.MessagesSent.length; mIndex++)
            if(lz_external.MessagesSent[mIndex].MessageId == _id)
                lz_external.MessagesSent[mIndex].Received=true;
        OverlayChatWidgetV2.UpdateChatHistoryUI(_time);
    };

    OverlayChatWidgetV2.UpdateChatHistoryUI = function(_time, _botButtons){

        var bl,i,y,x,z,parents = ['lz_chat_content_box'];

        if(OverlayChatWidgetV2.PostPreview != null)
            parents.push('lz_overlay_preview');

        for(y=0;y<parents.length;y++)
        {
            // time
            for(i=0;i<document.getElementById(parents[y]).getElementsByTagName("span").length;i++)
            {
                if(document.getElementById(parents[y]).getElementsByTagName("span")[i].className == "lz_overlay_chat_message_time")
                    if(document.getElementById(parents[y]).getElementsByTagName("span")[i].innerHTML.indexOf(":") == -1)
                    {
                        if(!document.getElementById(parents[y]).getElementsByTagName("span")[i].innerHTML.length && lz_d(_time) && _time != null)
                            document.getElementById(parents[y]).getElementsByTagName("span")[i].innerHTML = _time;
                        document.getElementById(parents[y]).getElementsByTagName("span")[i].innerHTML = lz_global_get_time(document.getElementById(parents[y]).getElementsByTagName("span")[i].innerHTML);
                    }

                // bot buttons
                if(_botButtons)
                {
                    var tf = document.getElementById(parents[y]).getElementsByClassName("lz_overlay_chat_message_text");
                    for(z = 0;z<tf.length-1;z++)
                    {
                        bl = tf[z].getElementsByClassName("lz_chat_bot_button");
                        for(x = 0;x<bl.length;x++)
                        {
                            if(bl[x].className.indexOf('keep_alive') == -1)
                                lz_add_class(bl[x],'lz_chat_disabled');
                        }
                    }
                }
            }

            // queue message
            if(document.getElementById(parents[y]).getElementsByClassName('lz_chat_queue_position')[0])
            {
                var cposition = parseInt(document.getElementById(parents[y]).getElementsByClassName('lz_chat_queue_position')[0].innerHTML);
                var cwtime = parseInt(document.getElementById(parents[y]).getElementsByClassName('lz_chat_queue_waiting_time')[0].innerHTML);

                if(cposition == -1 || (OverlayChatWidgetV2.QueuePosition > 0 && OverlayChatWidgetV2.QueuePosition <= cposition))
                    document.getElementById(parents[y]).getElementsByClassName('lz_chat_queue_position')[0].innerHTML = OverlayChatWidgetV2.QueuePosition.toString();

                if(cwtime == -1 || (OverlayChatWidgetV2.QueueTime > 0 && OverlayChatWidgetV2.QueueTime <= cwtime))
                    document.getElementById(parents[y]).getElementsByClassName('lz_chat_queue_waiting_time')[0].innerHTML = OverlayChatWidgetV2.QueueTime.toString();
            }
        }

        var targetWidth = (lz_overlay_chat.m_FixedMode || lz_overlay_chat.m_FullScreenMode) ? lz_global_get_window_width(true) : lz_overlay_chat_width;
        if(document.getElementById("lz_chat_members_box").style.display == 'block')
            targetWidth -= 200;
        for(i = 0;i<document.getElementById("lz_chat_content_box").childNodes.length;i++)
            if(document.getElementById("lz_chat_content_box").childNodes[i].tagName.toLowerCase() == "div")
                document.getElementById("lz_chat_content_box").childNodes[i].style.width = (lz_chat_scrolled || document.getElementById("lz_chat_content_box").scrollHeight > document.getElementById("lz_chat_content_box").clientHeight) ? (targetWidth-16+"px") : (targetWidth-1+"px");
    };

    OverlayChatWidgetV2.UpdateWaitingPosts = function(_postHTML){

        if(lz_overlay_chat.m_FullScreenMode)
        {
            if(!lz_chats_external)
            {
                if(lz_overlay_wm != null && lz_chat_get_wm_element('chat') != null)
                {
                    document.getElementById("livezilla_wm_c_chat").style.display = (lz_session.OVLCWM > 0) ? "table-cell" : 'none';
                    document.getElementById("livezilla_wm_c_chat").innerHTML = lz_session.OVLCWM;
                }
                else if(document.getElementById('livezilla_c_chat') != null)
                {
                    document.getElementById("livezilla_c_chat").style.display = (lz_session.OVLCWM > 0 && lz_session.OVLWMState == '0') ? "table-cell" : 'none';
                    document.getElementById("livezilla_c_chat").innerHTML = lz_session.OVLCWM;
                }
            }
            else
            {
                if(document.getElementById('livezilla_c_chat') != null)
                    document.getElementById("livezilla_c_chat").style.display = 'none';
            }
        }
        else
        {
            if(!lz_chats_external)
            {
                if(OverlayChatWidgetV2.PostPreview == null)
                {
                    var margins = lz_overlay_wm != null ? lz_overlay_wm.m_Margins : lz_overlay_chat.m_Margins;
                    var height = lz_overlay_wm != null ? lz_overlay_wm.m_Height : 45;
                    var width = OverlayChatWidgetV2.__ModeClassic ? 260 : lz_overlay_chat_width *.7;

                    OverlayChatWidgetV2.PostPreview = new lz_livebox_v2('lz_overlay_preview','',width,'auto',0,0,margins[1],margins[2] + height,'22');

                    if(OverlayChatWidgetV2.Screenshot == null)
                        OverlayChatWidgetV2.PostPreview.SetVisible(true);

                    OverlayChatWidgetV2.PostPreview.m_FrameElement.style.zIndex = lz_overlay_zindex;
                    OverlayChatWidgetV2.PostPreview.m_FrameElement.onclick = function(){

                        if(lz_overlay_wm != null)
                            OverlayChatWidgetV2.SetMode('wm',true);
                        if(!OverlayChatWidgetV2.__ModeSingle && OverlayChatWidgetV2.IsChatAvailable())
                            OverlayChatWidgetV2.SetMode('chat',true);
                        if(OverlayChatWidgetV2.__ModeClassic)
                            OverlayChatWidgetV2.Maximize();
                    };
                    OverlayChatWidgetV2.ResetPreviewPosts();
                }

                var showPreview = lz_session.OVLCWM > 0 || !OverlayChatWidgetV2.IsChatAvailable(); //<--debug

                if(lz_session.OVLWMState == '0' && showPreview && _postHTML != null && _postHTML.length)
                {
                    if(OverlayChatWidgetV2.Screenshot == null)
                        OverlayChatWidgetV2.PostPreview.SetVisible(true);

                    var div = document.createElement('div');
                    div.innerHTML = _postHTML;

                    document.getElementById('lz_overlay_preview_messages').appendChild(div);

                    OverlayChatWidgetV2.EmbedTextControl(true);
                }
                else if(lz_session.OVLCWM == 0)
                    OverlayChatWidgetV2.ResetPreviewPosts();
            }
        }
    };

    OverlayChatWidgetV2.EmbedTextControl = function(_preview){

        if(OverlayChatWidgetV2.PreviewTextControl != _preview)
        {
            var tctrl = document.getElementById('lz_chat_overlay_bottom');

            if(_preview)
                document.getElementById('lz_overlay_preview_tctrl').appendChild(tctrl);
            else
                document.getElementById('lz_overlay_module_chat').appendChild(tctrl);

            OverlayChatWidgetV2.PreviewTextControl = _preview;

        }

        if(document.getElementById('lz_overlay_preview_tctrl') != null)
            document.getElementById('lz_overlay_preview_tctrl').style.display = OverlayChatWidgetV2.IsChatAvailable() ? 'block' : 'none';
    };

    OverlayChatWidgetV2.ResetPreviewPosts = function(_unsetWMCount){

        if(_unsetWMCount)
        {
            lz_session.OVLCWM = 0;
            lz_session.Save();
        }

        if(OverlayChatWidgetV2.PostPreview == null)
            return;

        if(!OverlayChatWidgetV2.PostPreview.m_FrameElement.innerHTML.length)
        {
            OverlayChatWidgetV2.PostPreview.m_FrameElement.innerHTML = lz_get_icon('lz_wm_preview_close_icon','times-circle','OverlayChatWidgetV2.ResetPreviewPosts(true);OverlayChatWidgetV2.AnswerChatRequest(false,true);lz_stop_propagation(evt);','');
            OverlayChatWidgetV2.PostPreview.m_FrameElement.innerHTML += '<div id="lz_overlay_preview_messages"></div>';
            OverlayChatWidgetV2.PostPreview.m_FrameElement.innerHTML += '<div id="lz_overlay_preview_tctrl" onclick="if(event.stopPropagation){event.stopPropagation();}event.cancelBubble=true;" class="lz_preview_message"></div>';
        }
        else
            document.getElementById('lz_overlay_preview_messages').innerHTML = '';

        OverlayChatWidgetV2.PostPreview.SetVisible(false);
        OverlayChatWidgetV2.EmbedTextControl(false);
    };

    OverlayChatWidgetV2.ReplaceEmoticons = function(_text){
        if(OverlayChatWidgetV2.__CurrentGroup != null && OverlayChatWidgetV2.__CurrentGroup.ChatFunctions != null && OverlayChatWidgetV2.__CurrentGroup.ChatFunctions[0]=='0')
            return _text;
        var shorts = [/:-\)/g,/::smile/g,/:\)/g,/:-\(/g,/::sad/g,/:\(/g,/:-]/g,/::lol/g,/;-\)/g,/::wink/g,/;\)/g,/:'-\(/g,/::cry/g,/:-O/g,/::shocked/g,/:-\\\\/g,/::sick/g,/:-p/g,/::tongue/g,/:-P/g,/:\?/g,/::question/g,/8-\)/g,/::cool/g,/zzZZ/g,/::sleep/g,/:-\|/g,/::neutral/g];
        var images = ["smile","smile","smile","sad","sad","sad","lol","lol","wink","wink","wink","cry","cry","shocked","shocked","sick","sick","tongue","tongue","tongue","question","question","cool","cool","sleep","sleep","neutral","neutral"];
        for(var i = 0;i<shorts.length;i++)
            _text = _text.replace(shorts[i]," <img border=0 src='"+lz_poll_server+"images/smilies/"+images[i]+".gif'> ");
        return _text;
    };

    OverlayChatWidgetV2.AddMessages = function (_messages, _full, _lpr, _lmr, _lp){

        OverlayChatWidgetV2.__PostsNoticed = lz_is_mobile;

        if(!_messages.length)
            return;

        _messages = JSON.parse(lz_global_base64_decode(_messages));

        var html = '',htmlpreview = '',ignore = ['ONM01'];

        for(var i = 0;i<_messages.length;i++)
        {
            var scaledown = 1;
            var width = lz_global_get_window_width();

            for(var y=0;y<30;y++)
            {
                if(width > 160)
                {
                    scaledown++;
                    width = lz_global_get_window_width() / scaledown;
                }
            }

            var preview = false;
            if(!lz_chat_full_load && lz_session.OVLWMState == '0')
            {
                preview = true;
                lz_session.OVLCWM++;
            }
            else if(lz_chat_full_load && lz_session.OVLWMState == '0' && lz_session.OVLCWM === 0 && _messages.length === 2)
            {
                preview = true;
                lz_session.OVLCWM++;
            }
            else if(!lz_chat_full_load && lz_overlay_chat.m_FullScreenMode && lz_session.OVLWMSElem != 'chat')
            {
                lz_session.OVLCWM++;
            }
            else if(lz_session.OVLCWM > 0 && i >= _messages.length - lz_session.OVLCWM)
            {
                preview = true;
            }
            else if(!OverlayChatWidgetV2.IsChatAvailable())
            {
                preview = true;
                lz_session.OVLCWM++;
            }
            else if(_messages[i][3] == 1 && !OverlayChatWidgetV2.IsChatActive())
            {
                preview = true;
            }

            _messages[i][0] = lz_global_base64_decode(_messages[i][0]);
            _messages[i][0] = _messages[i][0].replace('<!--ifsc-->', 1 / scaledown);
            _messages[i][0] = _messages[i][0].replace('<!--ifw-->', lz_global_get_window_width());
            _messages[i][0] = _messages[i][0].replace('<!--ifh-->', lz_global_get_window_height());
            _messages[i][0] = _messages[i][0].replace(/<!--fw-->/g, parseInt(lz_global_get_window_width() / scaledown));
            _messages[i][0] = _messages[i][0].replace(/<!--fh-->/g, parseInt(lz_global_get_window_height() / scaledown));

            html += _messages[i][0];

            if(_messages[i][0].length && preview && i >= _messages.length - lz_session.OVLCWM)
            {
                if(ignore.indexOf(_messages[i][1]) == -1)
                    if(!(lz_d(_messages[i][2]) && _messages[i][2] == 0))
                    {
                        if(_messages[i][3] == 1)
                        {
                            if(!OverlayChatWidgetV2.IsChatAvailable() && _messages[i][4] == 1)
                                continue;
                            if(OverlayChatWidgetV2.IsChatAvailable() && _messages[i][4] == 0)
                                continue;
                        }

                        if(_messages[i][0].indexOf('<img') !== 0)
                            htmlpreview += '<div class="lz_preview_message">' + OverlayChatWidgetV2.ReplaceEmoticons(_messages[i][0]) + '</div>';
                        else
                            htmlpreview += '<div>' + _messages[i][0] + '</div>';
                    }
            }
        }



        lz_session.Save();

        OverlayChatWidgetV2.UpdateWaitingPosts(htmlpreview);

        if(html != null)
        {
            if(lz_chat_full_load && _full)
                lz_chat_full_load = false;

            if(_lpr != null && OverlayChatWidgetV2.__LastPostReceived != lz_global_base64_decode(_lpr))
            {
                OverlayChatWidgetV2.__LastPostReceived = lz_global_base64_decode(_lpr);
                OverlayChatWidgetV2.__IsPostStatusUpdate = true;
            }

            if(_lmr != null && lz_chat_last_message_received != lz_global_base64_decode(_lmr))
                lz_chat_last_message_received = lz_global_base64_decode(_lmr);

            if(_lp != null && html != null && lz_chat_last_poster != lz_global_base64_decode(_lp))
                lz_chat_last_poster = lz_global_base64_decode(_lp);

            if(lz_chat_last_poster == lz_external.Id && lz_mode_show_options)
                lz_chat_switch_options(lz_chat_option_function,false);

            var dx = document.createElement("div");
            document.getElementById("lz_chat_content_inlay").appendChild(dx);
            dx.innerHTML = OverlayChatWidgetV2.ReplaceEmoticons(html);

            OverlayChatWidgetV2.ScrollDown(37564);
            OverlayChatWidgetV2.UpdateChatHistoryUI();
            lz_chat_replace_icon();

            if(lz_operator_typing)
            {
                document.getElementById('lz_chat_content_inlay').appendChild(document.getElementById("lz_chat_overlay_typing_post"));
            }
        }
        OverlayChatWidgetV2.UpdateChatHistoryUI(null,true);
    };

    OverlayChatWidgetV2.ShowQueueMessage = function(_position,_time,_html){

        OverlayChatWidgetV2.QueueTime = _time;
        OverlayChatWidgetV2.QueuePosition = _position;

        if(!LiveZillaData.QueueMessageAppended)
        {
            var qmessage = lz_global_base64_decode(_html).replace("<!--queue_position-->","<span class='lz_chat_queue_position' style='color:"+lz_color_secondary+"'>-1</span>");
            qmessage = qmessage.replace("<!--queue_waiting_time-->","<span class='lz_chat_queue_waiting_time' style='color:"+lz_color_secondary+"'>-1</span>");
            OverlayChatWidgetV2.AddMessages(lz_global_base64_encode(JSON.stringify([
                [lz_global_base64_encode(qmessage), 'MP', 1]
            ])), false, null, null, null);
            LiveZillaData.QueueMessageAppended = true;
            lz_chat_last_poster = null;
        }

        OverlayChatWidgetV2.UpdateChatHistoryUI();
    };

    OverlayChatWidgetV2.AddWMElements = function(_template,_ml,_mt,_mr,_mb,_chatAvailable){
        if(!OverlayChatWidgetV2.__ModeSingle && !OverlayChatWidgetV2.__ModeClassic && !_chatAvailable)
        {
            for(var x=0;x<lz_ovlel.length;x++)
            {
                if(lz_ovlel[x].type == 'chat' && lz_d(lz_ovlel[x].hcwo))
                {
                    lz_ovlel.splice(x, 1);
                    break;
                }
            }
        }

        if(lz_ovlel.length==1)
            return;

        var iconWidth = OverlayChatWidgetV2.__SizeWidth;
        if(OverlayChatWidgetV2.__ModeTextInline)
        {
            OverlayChatWidgetV2.__SizeWidth = OverlayChatWidgetV2.GetWMWidth();
        }

        if(lz_overlay_wm == null && !OverlayChatWidgetV2.__ModeCombi)
        {
            var cwidth = (lz_ovlel_fsm) ? 'auto' : OverlayChatWidgetV2.__SizeWidth+OverlayChatWidgetV2.__Border;
            var cheight = (lz_ovlel_fsm) ? Math.floor(48*OverlayChatWidgetV2.__Ratio) : (OverlayChatWidgetV2.__SizeHeight+OverlayChatWidgetV2.__Border) + OverlayChatWidgetV2.__Space;
            var cpos = (lz_ovlel_fsm) ? '00' : '22';

            lz_overlay_wm = new lz_livebox_v2("lz_overlay_wm",_template,cwidth,cheight,_ml,0,_mr,_mb,cpos,(lz_ovlel_fsm) ? document.getElementById('lz_chat_fs_body') : document.body);
            lz_overlay_wm.m_MaxHeight = (lz_ovlel_fsm) ? cheight + 'px' : ((OverlayChatWidgetV2.__SizeHeight + OverlayChatWidgetV2.__Border) + OverlayChatWidgetV2.__Space)*lz_ovlel.length;
            lz_overlay_wm.SetMobile(lz_is_mobile);

            lz_chat_overlay_pointer = document.getElementById('lz_chat_overlay_pointer_' + ((OverlayChatWidgetV2.__ModeSingle) ? 'v' : 'h'));

            if(lz_ovlel_fsm)
            {
                lz_overlay_wm.m_FrameElement.style.whiteSpace = 'nowrap';
                lz_overlay_wm.m_FrameElement.style.overflow = 'hidden';
                lz_overlay_wm.m_FrameElement.style.background = '#f7f8f9';
                lz_overlay_wm.m_FrameElement.style.position = 'absolute';
            }

            var i,pt,cln,clnd,clnc,wm = document.getElementById('livezilla_wm'),wmd = document.getElementById('livezilla_wm_d'),wmc = document.getElementById('livezilla_wm_c');

            wm.style.height = OverlayChatWidgetV2.__SizeHeight + 'px';
            wm.style.width = OverlayChatWidgetV2.__SizeWidth + 'px';

            var bzi = lz_overlay_zindex + 100;

            if(lz_is_mobile && !lz_ovlel_fsm)
                bzi-=1000;

            var VARSA = Math.floor(10*OverlayChatWidgetV2.__Ratio);
            for(var y=lz_ovlel.length-1;y>=0;y--)
            {
                i = (lz_ovlel_fsm) ? ((lz_ovlel.length-1) - y) : y;

                if(lz_ovlel[i]==null)
                    continue;

                pt = (((OverlayChatWidgetV2.__SizeHeight + OverlayChatWidgetV2.__Border)*i) + (OverlayChatWidgetV2.__Space*i));

                clnd = null;

                if(lz_ovlel[i].type != 'wm')
                {
                    cln = wm.cloneNode(true);
                    OverlayChatWidgetV2.ApplyIconToElement(cln,lz_ovlel[i].icon);

                    cln.id += "_" + lz_ovlel[i].type;
                    cln.style.zIndex = bzi-i;
                    lz_overlay_wm.m_FrameElement.appendChild(cln);

                    clnd = wmd.cloneNode(true);
                    clnd.id += "_" + lz_ovlel[i].type;

                    if(OverlayChatWidgetV2.__ModeTextInline)
                        clnd.style.boxShadow = 'none';

                    clnd.innerHTML = OverlayChatWidgetV2.GetElementTitle(lz_ovlel[i]);

                    var descHeight = 41;

                    if(OverlayChatWidgetV2.__Ratio == 0.8)
                        descHeight = 38;

                    if(!lz_ovlel_fsm && !OverlayChatWidgetV2.__ModeTextInline)
                    {
                        clnd.style.right = OverlayChatWidgetV2.__SizeWidth + 'px';
                        clnd.style.boxShadow = 'none';
                    }

                    if(OverlayChatWidgetV2.__ModeTextInline)
                    {
                        wmd.style.marginLeft = clnd.style.marginLeft = (OverlayChatWidgetV2.__SizeHeight-(OverlayChatWidgetV2.__Ratio*5)) + 'px';
                        wmd.style.cursor = clnd.style.cursor = 'pointer';
                        wmd.style.display = clnd.style.display = 'block';
                        wmd.style.background = clnd.style.background = 'none';
                        wmd.style.width = clnd.style.width = (OverlayChatWidgetV2.__SizeWidth-(OverlayChatWidgetV2.__Ratio*68))+'px';
                        wmd.style.textOverflow = clnd.style.textOverflow = 'ellipsis';
                        wmd.style.overflow = clnd.style.overflow = 'hidden';
                        wmd.innerHTML = OverlayChatWidgetV2.ButtonTexts[lz_ovlel[i].type];
                        wmd.style.marginTop = clnd.style.marginTop = '-'+OverlayChatWidgetV2.__SizeHeight+'px';
                        wmd.style.fontSize = clnd.style.fontSize = OverlayChatWidgetV2.__Ratio*115+'%';
                        wmd.style.lineHeight = clnd.style.lineHeight = OverlayChatWidgetV2.__SizeHeight+'px';

                        clnd.style.borderRadius = lz_border_radius + 'px';

                        if(typeof lz_ovlel[i].color == 'undefined')
                            cln.style.background = 'linear-gradient(to right, '+lz_color_secondary+' 0%,'+lz_color_secondary+' '+iconWidth+'px,'+lz_color_secondary+' '+iconWidth+'px,'+lz_color_primary+' '+iconWidth+'px,'+lz_color_primary+' 100%)';
                    }
                    else
                    {
                        wmd.style.marginTop = clnd.style.marginTop = '-'+(OverlayChatWidgetV2.__SizeHeight)+'px';
                        wmd.style.fontSize = clnd.style.fontSize = OverlayChatWidgetV2.__Ratio*100+'%';
                        wmd.style.lineHeight = clnd.style.lineHeight = (OverlayChatWidgetV2.__SizeHeight)+'px';
                        wmd.style.width = clnd.style.width = OverlayChatWidgetV2.GetWMWidth(lz_ovlel[i]) + 'px';

                        clnd.style.borderRadius = lz_border_radius + 'px 0 0 ' + lz_border_radius + 'px';
                    }


                    if(lz_is_mobile && !lz_ovlel_fsm)
                        clnd.style.opacity = 0;

                    clnd.style.zIndex = cln.style.zIndex;

                    cln.setAttribute("data-did",clnd.id);
                    cln.setAttribute("data-type",lz_ovlel[i].type);

                    if(!lz_ovlel_fsm)
                        cln.appendChild(clnd);
                    else
                        lz_overlay_wm.m_FrameElement.appendChild(clnd);

                    if(typeof lz_ovlel[i].counter != 'undefined')
                    {
                        clnc = wmc.cloneNode(true);
                        clnc.id += "_" + lz_ovlel[i].type;
                        clnc.style.zIndex = cln.style.zIndex+2;
                        cln.appendChild(clnc);

                        if(lz_ovlel_fsm)
                        {
                            clnc.style.top='-45px';
                            clnc.style.left='55px';
                        }
                    }

                    if(!lz_ovlel_fsm)
                        cln.style.top = (Math.max(46,OverlayChatWidgetV2.__SizeHeight + OverlayChatWidgetV2.__Border) * -1) + 'px';
                    else
                    {
                        cln.style.top = parseInt((cheight - (OverlayChatWidgetV2.__SizeHeight+OverlayChatWidgetV2.__Border)) / 2) + 'px';

                        if(typeof lz_ovlel[i].href == 'undefined')
                            cln.style.left = ((OverlayChatWidgetV2.__SizeWidth+OverlayChatWidgetV2.__Border+VARSA)*(i))-(OverlayChatWidgetV2.__SizeWidth/1.3) + 'px';
                        else
                            cln.style.right = '-1000px';
                    }

                    if(!lz_ovlel_fsm && typeof lz_ovlel[i].margin != 'undefined')
                    {
                        cln.style.marginBottom = lz_ovlel[i].margin[2] + OverlayChatWidgetV2.__Space + 'px';
                        lz_overlay_wm.m_MaxHeight += lz_ovlel[i].margin[2];
                    }
                    else if(!lz_ovlel_fsm)
                        cln.style.marginBottom = OverlayChatWidgetV2.__Space + 'px';

                    if(lz_ovlel[i].type == 'phone')
                    {
                        lz_mode_phone_outbound = lz_ovlel[i].outbound != false;
                        lz_mode_phone_inbound = lz_ovlel[i].inbound != false;

                        if(lz_mode_phone_inbound)
                        {
                            var number = lz_global_base64_url_decode(lz_ovlel[i].inbound.number);
                            document.getElementById('lz_chat_data_phone_header_number').innerHTML = number;
                            document.getElementById('lz_chat_data_phone_header_number').href = 'tel:' + number;
                            document.getElementById('lz_chat_data_phone_header_text').innerHTML = lz_global_base64_url_decode(lz_ovlel[i].inbound.text);
                        }
                    }

                    if(!lz_ovlel_fsm && typeof lz_ovlel[i].color != 'undefined')
                    {
                        cln.style.backgroundColor = lz_ovlel[i].color;

                        if(!OverlayChatWidgetV2.__ModeTextInline)
                            clnd.style.backgroundColor = lz_ovlel[i].color;

                    }
                    else if(!lz_ovlel_fsm)
                        cln.style.borderColor = lz_color_primary_dark;

                }
                else
                {
                    cln = wm;
                    cln.style.zIndex = bzi+100;
                    if(!lz_ovlel_fsm)
                        cln.style.borderColor = lz_color_primary_dark;

                    if(OverlayChatWidgetV2.__ModeTextInline)
                        cln.style.background = 'linear-gradient(to right, '+lz_color_secondary+' 0%,'+lz_color_secondary+' '+iconWidth+'px,'+lz_color_secondary+' '+iconWidth+'px,'+lz_color_primary+' '+iconWidth+'px,'+lz_color_primary+' 100%)';
                }
                cln.setAttribute('data-tid',lz_ovlel[i].type);

                if(!lz_ovlel_fsm)
                {
                    cln.style.transform = 'translateY('+ pt + 'px'+')';
                    cln.style.right = 0;
                }
                else
                {
                    cln.style.boxShadow = 'none';
                    cln.style.width = '100px';
                    cln.style.textAlign = 'center';
                }

                cln.style.borderRadius = OverlayChatWidgetV2.GetWMElementBorderRadius(false);

                cln.style.position = (lz_ovlel_fsm) ? 'static' : 'relative';
                cln.style.display = (lz_ovlel_fsm) ? 'inline-block' : 'block';
            }

            if(OverlayChatWidgetV2.__ModeTextInline)
                wm.appendChild(wmd);

            if(lz_ovlel.length)
                OverlayChatWidgetV2.ApplyIconToElement(wm,lz_ovlel[0].icon);

            if(!lz_ovlel_fsm)
            {
                lz_chat_overlay_pointer.style.right = ((!OverlayChatWidgetV2.__ModeSingle) ? (Math.ceil(lz_overlay_chat.m_FrameElement.style.marginRight.replace('px',''))-12)  : (_mr + (((OverlayChatWidgetV2.__SizeWidth+OverlayChatWidgetV2.__Border)/2)-12))) + 'px';
            }

            lz_chat_overlay_pointer.style.zIndex = bzi+1200;
            lz_overlay_wm.m_FrameElement.style.zIndex = lz_overlay_zindex;
        }
    };

    OverlayChatWidgetV2.GetWMElementBorderRadius = function(_hover){

        var VARSA = Math.floor(10*OverlayChatWidgetV2.__Ratio);
        var br;
        if(!lz_ovlel_fsm)
        {
            var rp = Math.min(50,lz_border_radius*VARSA);
            if(!OverlayChatWidgetV2.__ModeTextInline)
            {
                if(!_hover)
                    br = rp + '%';
                else
                    br = '0 ' + rp + '% ' + rp + '% 0';
            }
            else
               br = lz_border_radius + 'px';
        }
        else
        {
            br = 0;
        }
        return br;
    };

    OverlayChatWidgetV2.GetWMWidth = function(_service){
        var i,t,maxlength=0;

        if(_service)
        {
            maxlength = OverlayChatWidgetV2.GetElementTitle(_service).length;
        }
        else
        {
            for(var y=lz_ovlel.length-1;y>=0;y--)
            {
                i = (lz_ovlel_fsm) ? ((lz_ovlel.length-1) - y) : y;
                t = OverlayChatWidgetV2.GetElementTitle(lz_ovlel[i]);
                maxlength = Math.max(maxlength, t.length);
            }

            if(typeof lz_ovlel_rt_onl != 'undefined')
                maxlength = Math.max(maxlength, lz_ovlel_rt_onl.length);
            if(typeof lz_ovlel_rt_ofl != 'undefined')
                maxlength = Math.max(maxlength, lz_ovlel_rt_ofl.length);
        }

        var maxwidth = (!lz_is_mobile) ? 200 : 150;

        if(!OverlayChatWidgetV2.__ModeTextInline)
            maxwidth = (!lz_is_mobile) ? 300 : 150;

        var base = ((OverlayChatWidgetV2.__ModeTextInline) ? 77 : 1) * OverlayChatWidgetV2.__Ratio;
        var letterwidth = 9*OverlayChatWidgetV2.__Ratio;
        var bl = base + (maxlength*letterwidth);
        return Math.max(Math.min(bl,maxwidth),70);
    };

    OverlayChatWidgetV2.GetElementTitle = function(_elem){

        var title = '';
        if(_elem.type != 'phone')
        {
            if(lz_d(OverlayChatWidgetV2.ButtonTexts[_elem.type]))
                title = OverlayChatWidgetV2.ButtonTexts[_elem.type];
            else if(lz_d(_elem.title))
                title = lz_global_base64_url_decode(_elem.title);
        }
        else
        {
            title = "";

            if(_elem.inbound != false && _elem.outbound != false)
            {
                title = lz_text_phone;
            }
            else
            {
                if(_elem.inbound != false)
                    title += OverlayChatWidgetV2.ButtonTexts['phone_in'];

                if(_elem.outbound != false)
                    title += OverlayChatWidgetV2.ButtonTexts['phone_out'];
            }
        }

        return title;
    };

    OverlayChatWidgetV2.PlaySound = function(_file){
        if(lz_session.OVLCSound==1)
        {
            if(lz_sound_player == null)
            {
                var url = _file.toLowerCase().indexOf('http') === 0 ? _file : lz_poll_server + 'sound/'+_file+'.mp3';
                lz_sound_player = new Audio(url);
            }
            lz_sound_player.play();

            if(OverlayChatWidgetV2.__ModeAPI)
                lz_chat_open();
        }
    };

    OverlayChatWidgetV2.SendMessage = function(_msg,_trans, _dontSend, _dontShow){

        OverlayChatWidgetV2.UpdateChatHistoryUI(null,true);

        if(!LiveZillaData.WriteToServer && lz_chat_status == 0)
            LiveZillaData.WriteToServer = true;

        var msg = (_msg==null) ? lz_global_trim(document.getElementById('lz_chat_text').value) : _msg;

        if(msg.length>0 && OverlayChatWidgetV2.__ModeBot)
            OverlayChatWidgetV2.InputState(true);

        var transInto = (lz_session.TransInto!="" && lz_session.TransInto!=null) ? lz_session.TransInto : "";
        if(lz_tr_api_key != '' && transInto != '' && lz_session.TransFrom!=null && lz_session.TransFrom!="" && lz_session.TransFrom.toUpperCase() != transInto.toUpperCase() && _msg==null)
        {
            var newScript = document.createElement('script');
            newScript.type = 'text/javascript';
            OverlayChatWidgetV2.DoneTranslateCallback = function translateText(response){

                if(OverlayChatWidgetV2.TranslateErrorTimer != null)
                    clearTimeout(OverlayChatWidgetV2.TranslateErrorTimer);

                if(response.data!=null)
                {
                    OverlayChatWidgetV2.SendMessage(msg,response.data.translations[0].translatedText);
                    OverlayChatWidgetV2.DoneTranslateCallback = null;
                }
                else
                {
                    console.log("Sorry, there was an error while trying to translate:\r\n" + JSON.stringify(response));
                    OverlayChatWidgetV2.SendMessage(msg,null);
                }
            };

            var s = (lz_session.TransFrom != 'AUTO') ? '&source='+lz_session.TransFrom : '';
            newScript.src = "https://www.googleapis.com/language/translate/v2?key="+lz_global_base64_decode(lz_tr_api_key)+"&format=html"+s+"&target="+transInto+"&callback=OverlayChatWidgetV2.DoneTranslateCallback&q=" + msg;

            OverlayChatWidgetV2.TranslateErrorTimer = setTimeout(function(){
                OverlayChatWidgetV2.DoneTranslateCallback({date:null});
            },5000);

            document.getElementsByTagName("head")[0].appendChild(newScript);
            document.getElementById('lz_chat_text').value = '';

            return false;
        }

        if(msg.length>0)
        {
            if(document.getElementsByClassName("lz_overlay_chat_message_invite").length && lz_chat_status == 0)
            {
                OverlayChatWidgetV2.AnswerChatRequest(true,true);
                if(msg.length > document.getElementsByName('form_114')[0].value.length)
                {
                    document.getElementsByName('form_114')[0].value = msg;
                }
            }

            var html = "";
            var msgo = new lz_chat_post();

            if(_trans != null)
            {
                msgo.MessageTranslationText =_trans;
                html = lz_global_htmlentities(msgo.MessageTranslationText) + "<div class='lz_overlay_translation'>" + lz_global_htmlentities(msg) + "</div>";
            }
            else if(!_dontSend)
                html = lz_global_htmlentities(msg);
            else
                html = msg;

            msgo.MessageText = msg;
            msgo.MessageId = lz_global_microstamp();
            msgo.MessageTime = lz_global_timestamp();

            if(!_dontSend)
                lz_external.MessagesSent[lz_external.MessagesSent.length] = msgo;

            document.getElementById('lz_chat_text').value = '';

            if(OverlayChatWidgetV2.CurrentOperator == null && !OverlayChatWidgetV2.__PublicGroupChat.length)
                OverlayChatWidgetV2.SetConnectionState(true,null,null);

            var posthtml = (lz_chat_last_poster != lz_external.Id) ? lz_global_base64_decode(lz_post_html) : lz_global_base64_decode(lz_add_html);
            var cname = (lz_chat_get_input_value(111).length == 0) ? lz_guest_name : lz_chat_get_input_value(111);

            posthtml = posthtml.replace("<!--message-->",html);
            posthtml = posthtml.replace("<!--server-->",lz_poll_server);
            posthtml = posthtml.replace("<!--ename-->",lz_global_base64_url_encode(cname));
            posthtml = posthtml.replace("<!--time-->",'');
            posthtml = posthtml.replace("<!--name-->",lz_global_htmlentities(cname));
            posthtml = posthtml.replace(/<!--my-->/g,1);
            posthtml = posthtml.replace("<!--bgce-->",lz_global_base64_url_encode(lz_color_primary));

            lz_chat_switch_extern_typing(false);

            if(!_dontShow)
                OverlayChatWidgetV2.AddMessages(lz_global_base64_encode(JSON.stringify([
                    [lz_global_base64_encode(posthtml), 'MP']
                ])), false, null, null, lz_global_base64_encode(lz_external.Id));

            if(!_dontSend)
            {
                LiveZilla.Engine.Poll(1114,true);
            }

            lz_chat_set_focus(6);
        }
        OverlayChatWidgetV2.InputKeyUp(null);
        return false;
    };

    OverlayChatWidgetV2.SetChat = function(_chatId){


        if(!lz_d(_chatId))
            return;

        OverlayChatWidgetV2.__CurrentChatId = _chatId;

        if(OverlayChatWidgetV2.__CurrentChatId != 0)
            OverlayChatWidgetV2.__LastChatId = OverlayChatWidgetV2.__CurrentChatId;

        if(OverlayChatWidgetV2.ScreenCaptureToStartChat)
        {
            OverlayChatWidgetV2.ScreenCaptureToStartChat = false;
            OverlayChatWidgetV2.CaptureScreen(false,0);
        }
        else if(OverlayChatWidgetV2.FileUploadToStartChat != false)
        {
            OverlayChatWidgetV2.UploadFile(OverlayChatWidgetV2.FileUploadToStartChat);
        }

    };

    OverlayChatWidgetV2.SetHost = function(_systemId,_bot,_groupId,_groupName,_userid,_lang,_image,_fullname){

        if(lz_overlay_chat != null)
        {
            OverlayChatWidgetV2.__ModeBot = _bot;

            if(_lang != null && lz_session.TransInto == "")
            {
                _lang = lz_global_base64_decode(_lang);

                if(_lang.indexOf(',') !== -1)
                    _lang = _lang.split(',')[0];

                lz_session.TransInto = _lang;
                lz_session.Save();
            }
            if(_systemId != null)
            {
                OverlayChatWidgetV2.CurrentOperator = new lz_chat_operator();
                OverlayChatWidgetV2.CurrentOperator.Id = lz_global_base64_decode(_systemId);
                OverlayChatWidgetV2.CurrentOperator.Group = lz_global_base64_decode(_groupId);
                OverlayChatWidgetV2.CurrentOperator.Fullname = lz_global_base64_decode(_fullname);

                document.getElementById('lz_ccb_tos').checked = true;
            }
            else
            {
                OverlayChatWidgetV2.TargetOperatorId = null;
                lz_external.MessagesSent = [];
                OverlayChatWidgetV2.CurrentOperator = null;
            }
            OverlayChatWidgetV2.UpdateChatFunctions();
        }
    };

    OverlayChatWidgetV2.UpdateFormUI = function(){
        try
        {
            if(LiveZillaData.InputFieldIndices != null && OverlayChatWidgetV2.__CurrentGroup != null)
            {
                if(lz_first_call)
                {
                    lz_chat_loading(false);
                    lz_first_call = false;
                }

                var isHidden = false;
                var isChat = (lz_session.OVLWMSElem == "chat");
                var ihidden = (isChat) ? OverlayChatWidgetV2.__CurrentGroup.ChatInputsHidden : OverlayChatWidgetV2.__CurrentGroup.TicketInputsHidden;
                var isRequired = (isChat) ? OverlayChatWidgetV2.__CurrentGroup.ChatInputsMandatory : OverlayChatWidgetV2.__CurrentGroup.TicketInputsMandatory;
                var isPlaceholderSupport = lz_is_placeholder_support();

                for(var i = 0;i < LiveZillaData.InputFieldIndices.length;i++)
                {
                    var findex = LiveZillaData.InputFieldIndices[i];
                    try
                    {
                        if(document.getElementById("lz_form_active_" + findex) == null)
                            continue;

                        if(document.getElementById("lz_form_active_" + findex).value == "true" || (lz_session.OVLWMSElem=="phone" && findex == 116))
                        {
                            isHidden = ((lz_array_indexOf(ihidden,findex) > -1) || (LiveZillaData.ForceGroupSelect && !LiveZillaData.ForceSelectMade && LiveZillaData.InputFieldValues[i].IsHiddenGeneral(LiveZillaData.Groups.Groups,isChat)));
                            if(OverlayChatWidgetV2.__PublicGroupChat.length && findex == 114)
                                isHidden = true;
                            if(isChat && OverlayChatWidgetV2.__ModeChangeDetails && findex == 114)
                                isHidden = true;
                            if(isChat && LiveZillaData.InputFieldValues[i].Type == 'File')
                                isHidden = true;
                            if(lz_session.OVLWMSElem == "phone" && findex == 116)
                                isHidden = false;
                            if(findex == 115)
                                isHidden = true;
                            if(lz_session.OVLWMSElem == 'chat' && !OverlayChatWidgetV2.IsChatAvailable())
                                isHidden = true;

                            document.getElementById("lz_form_" + findex).className = (findex==116 && lz_session.OVLWMSElem=="phone") ? "lz_input lz_input_com" : document.getElementById("lz_form_" + findex).className;
                            document.getElementById("lz_form_" + findex).style.display = (isHidden) ? 'none' : '';
                            document.getElementById("lz_form_" + findex).style.display = (findex==116 && lz_session.OVLWMSElem=="phone") ? "" : document.getElementById("lz_form_" + findex).style.display;

                            if(document.getElementById("lz_form_info_" + findex).innerHTML.length > 0 && !OverlayChatWidgetV2.__ModeChangeDetails)
                            {
                                if(document.getElementById("lz_form_mandatory_" + findex).className.indexOf("lz_required") == -1)
                                    document.getElementById("lz_form_mandatory_" + findex).className = "lz_input_icon lz_info";

                                document.getElementById("lz_form_mandatory_" + findex).style.cursor = "pointer";
                                document.getElementById("lz_form_mandatory_" + findex).style.display = "";
                                document.getElementById("lz_form_mandatory_" + findex).onmouseover = function(){lz_chat_show_info_box(this,true);};
                                document.getElementById("lz_form_mandatory_" + findex).onmouseout = function(){lz_chat_show_info_box(this,false);};
                                document.getElementById("lz_form_mandatory_" + findex).onclick = function(){lz_chat_show_info_box(this,true);};
                                document.getElementById("lz_form_info_" + findex).onclick = function(){lz_chat_show_info_box(this,false);};
                            }
                            else if(OverlayChatWidgetV2.__ModeChangeDetails)
                                document.getElementById("lz_form_mandatory_" + findex).style.display = 'none';

                            if(document.getElementsByName("form_" + findex)[0] != null)
                                document.getElementsByName("form_" + findex)[0].disabled = OverlayChatWidgetV2.__ModeChangeDetails && LiveZillaData.InputFieldValues[i].Validation;
                        }
                        else
                            document.getElementById("lz_form_" + findex).style.display = 'none';

                        if(LiveZillaData.InputFieldValues[i].Active)
                        {
                            if(lz_array_indexOf(isRequired,findex) != -1 || (LiveZillaData.InputFieldValues[i].Validation && lz_array_indexOf(ihidden,findex) == -1))
                            {
                                if(!lz_mode_chat_login)
                                    lz_mode_chat_login = lz_chat_human_available && !OverlayChatWidgetV2.__ModeBot;
                            }

                            if(!isPlaceholderSupport && (LiveZillaData.InputFieldValues[i].Type == "Text" || LiveZillaData.InputFieldValues[i].Type == "TextArea"))
                            {
                                if(document.getElementsByName("form_" + findex)[0].value=='')
                                {
                                    document.getElementsByName("form_" + findex)[0].value = document.getElementById("lz_form_ph_" + findex).value;
                                    document.getElementsByName("form_" + findex)[0].style.color = 'var(--lz-icon-color)';
                                }
                                document.getElementsByName("form_" + findex)[0].onfocus=new Function("if (this.value == '"+document.getElementById("lz_form_ph_" + findex).value+"') {this.value = ''; this.style.color='#333'}");
                                document.getElementsByName("form_" + findex)[0].onblur=new Function("if (this.value == '') {this.value = '"+document.getElementById("lz_form_ph_" + findex).value+"'; this.style.color='var(--lz-icon-color)'}");
                            }

                            if(LiveZillaData.InputFieldValues[i].Type == 'File')
                            {
                                document.getElementById("files_" + findex).style.display = 'none';
                                document.getElementById("files_" + findex).innerHTML = '';
                                document.getElementsByName("form_sc_" + findex)[0].style.display = LiveZillaData.InputFieldValues[i].ScreenCapture && !lz_overlay_chat.m_FullScreenMode ? 'inline' : 'none';

                                if(LiveZillaData.InputFieldFiles[i].length)
                                {
                                    document.getElementById("files_" + findex).style.display = 'block';
                                    for(var key = 0; key < LiveZillaData.InputFieldFiles[i].length; key++)
                                    {
                                        var fn = lz_global_base64_decode(LiveZillaData.InputFieldFiles[i][key][1]);

                                        if(fn == 'screenshot.lzsc')
                                            fn = 'Screenshot';

                                        document.getElementById("files_" + findex).innerHTML += '<div class="lz_form_file_box"><span onclick="if(event.stopPropagation){event.stopPropagation();}event.cancelBubble=true;" class="lz_form_file_item">'+ lz_global_htmlentities(fn.substring(0,30)) + '</span><span onclick="lz_chat_remove_att(\''+LiveZillaData.InputFieldFiles[i][key][0]+'\');if(event.stopPropagation){event.stopPropagation();}event.cancelBubble=true;" class="lz_form_file_item lz_form_file_remove">X</span><div>';
                                    }
                                }
                            }
                        }
                    }
                    catch(ex)
                    {
                        console.log(ex);
                    }
                }

                OverlayChatWidgetV2.AcceptTOS = false;

                if(OverlayChatWidgetV2.__CurrentGroup != null)
                {
                    var tosText = '';
                    if(lz_session.OVLWMSElem == 'ticket' && OverlayChatWidgetV2.__CurrentGroup.TOSTicket.length)
                        tosText = OverlayChatWidgetV2.__CurrentGroup.TOSTicket;
                    if(lz_session.OVLWMSElem == 'chat' && OverlayChatWidgetV2.__CurrentGroup.TOSChat.length)
                        tosText = OverlayChatWidgetV2.__CurrentGroup.TOSChat;
                    if(lz_session.OVLWMSElem == 'phone' && OverlayChatWidgetV2.__CurrentGroup.TOSCallback.length)
                        tosText = OverlayChatWidgetV2.__CurrentGroup.TOSCallback;

                    if(tosText.length)
                    {
                        OverlayChatWidgetV2.AcceptTOS = true;

                        if(tosText.toLowerCase().indexOf('http') === 0)
                        {
                            document.getElementById("lz_chat_tos_text").innerHTML = document.getElementById("lz_chat_tos_text").innerHTML.replace('<a>','<u><a href="'+tosText+'" target="_blank">').replace('</a>','</u></a>');
                        }
                        else
                        {
                            document.getElementById("lz_chat_tos_text_box").innerHTML = tosText;
                            document.getElementById("lz_chat_tos_text").innerHTML = document.getElementById("lz_chat_tos_text").innerHTML.replace('<a>','<u onclick="OverlayChatWidgetV2.ToggleTOS(true);">').replace('</a>','</u>');
                        }
                    }
                }

                document.getElementById("lz_form_tos").style.display = (lz_session.OVLWMSElem != 'chat' || OverlayChatWidgetV2.IsChatAvailable()) && OverlayChatWidgetV2.AcceptTOS && !OverlayChatWidgetV2.__ModeChangeDetails ? 'table' : 'none';

                var hideGroup = !OverlayChatWidgetV2.ForceGroupSelect && ((lz_session.OVLWMSElem =="chat" && (OverlayChatWidgetV2.__ModeChangeDetails || lz_hide_group_chat)) || ((lz_session.OVLWMSElem =="ticket"||lz_session.OVLWMSElem =="phone") && lz_hide_group_ticket));
                if(lz_session.OVLWMSElem == 'chat' && !OverlayChatWidgetV2.IsChatAvailable())
                    hideGroup = true;

                document.getElementById("lz_group_selection_box").style.display = hideGroup ? 'none' : "";
            }
            else if(lz_first_call)
            {
                lz_chat_loading(true);
            }

            if(!lz_mode_chat_login && OverlayChatWidgetV2.ForceGroupSelect)
                lz_mode_chat_login = true;
        }
        catch(ex)
        {
            console.log(ex);
        }
    };

    OverlayChatWidgetV2.InputState = function(_loading,_block){

        if(lz_d(_block))
            OverlayChatWidgetV2.InputBlocked = _block;

        document.getElementById('lz_chat_text').style.display = (OverlayChatWidgetV2.InputBlocked || _loading) ? 'none' : 'block';
        document.getElementById("lz_chat_bot_reply_loading").style.display = (!_loading) ? 'none' : 'block';
        if(OverlayChatWidgetV2.__ModeBot && !OverlayChatWidgetV2.InputBlocked && !_loading)
            setTimeout(function(){lz_chat_set_focus(11);},200);

    };

    OverlayChatWidgetV2.UpdateWMUI = function(){

        if(lz_overlay_wm == null)
            return;

        var did,cln,clnd,wm = document.getElementById('livezilla_wm');

        lz_overlay_wm.m_FrameElement.style.height = ((lz_session.OVLWMState=='0') ? (OverlayChatWidgetV2.__SizeHeight+OverlayChatWidgetV2.__Border) : lz_overlay_wm.m_MaxHeight) + 'px';

        for(var i=lz_ovlel.length-1;i>=0;i--)
        {
            if(lz_ovlel[i] == null)
                continue;

            if(lz_ovlel[i].type != 'wm')
            {
                cln = document.getElementById('livezilla_wm' + "_" + lz_ovlel[i].type);
                cln.style.display = (lz_session.OVLWMState=='0' || OverlayChatWidgetV2.__ModeSingle) ? 'none': (!lz_overlay_chat.m_FullScreenMode) ? 'block' : 'inline-block';
                if(lz_session.OVLWMSElem == lz_ovlel[i].type)
                {
                    if(lz_overlay_chat.m_FullScreenMode)
                    {
                        lz_chat_overlay_pointer.style.left = ((((OverlayChatWidgetV2.__SizeWidth+OverlayChatWidgetV2.__Border)*(i)) + 13) + (i*10)) - (OverlayChatWidgetV2.__SizeWidth/1.3) + 'px';
                        cln.style.background = lz_color_primary;
                        cln.getElementsByTagName('svg')[0].style.fill = '#fff';
                    }
                    else
                    {
                        if(!OverlayChatWidgetV2.__ModeSingle)
                        {
                            var bs = (((OverlayChatWidgetV2.__SizeHeight+OverlayChatWidgetV2.__Border)*i)+(OverlayChatWidgetV2.__Space*i)) + OverlayChatWidgetV2.__Space + (14*OverlayChatWidgetV2.__Ratio);
                            lz_chat_overlay_pointer.style.bottom = bs + lz_overlay_wm.m_Margins[2] + 'px';

                            if(!OverlayChatWidgetV2.__ModeTextInline && lz_ovlel[i].type.indexOf('custom') === -1)
                                cln.style.background = 'var(--sc-color)';
                        }
                    }
                }
                else
                {
                    if(lz_overlay_chat.m_FullScreenMode)
                    {
                        cln.style.background = '#f7f8f9';
                        cln.style.borderRight = '1px solid #ddd';
                        cln.getElementsByTagName('svg')[0].style.fill = '#999';
                    }
                    else
                    {
                        if(!OverlayChatWidgetV2.__ModeTextInline && lz_ovlel[i].type.indexOf('custom') === -1)
                            cln.style.background = 'var(--pc-color)';
                    }
                }

                did = 'livezilla_wm_d_' + lz_ovlel[i].type;
                clnd = document.getElementById(did);

                if(!lz_is_mobile && !lz_overlay_chat.m_FullScreenMode)
                {
                    if(!lz_ie())
                    {
                        cln.onmouseover = function(){
                            if(this.getAttribute('data-tid')==lz_session.OVLWMSElem)
                            {
                                if(!OverlayChatWidgetV2.__ModeTextInline)
                                {
                                    lz_chat_overlay_pointer.style.visibility = 'hidden';
                                }
                            }

                            if(!OverlayChatWidgetV2.__ModeTextInline)
                            {
                                if(this.getAttribute('data-did').indexOf('custom') === -1)
                                {
                                    this.style.background = 'var(--sc-color)';
                                    document.getElementById(this.getAttribute('data-did')).style.background = 'var(--sc-color)';
                                }
                            }

                            document.getElementById(this.getAttribute('data-did')).style.display = 'block';
                            var that = this;

                            this.style.borderRadius = OverlayChatWidgetV2.GetWMElementBorderRadius(true);

                            if(lz_is_mobile)
                                setTimeout(function(){
                                    document.getElementById(that.getAttribute('data-did')).style.display = 'none';
                                },2000);


                        };
                    }
                    cln.onmouseout = function(){
                            lz_chat_overlay_pointer.style.visibility = 'visible';
                            if(!OverlayChatWidgetV2.__ModeTextInline)
                            {
                                document.getElementById(this.getAttribute('data-did')).style.display = 'none';

                                if(this.getAttribute('data-did').indexOf('custom') === -1)
                                    this.style.background = (this.getAttribute('data-tid')==lz_session.OVLWMSElem) ? 'var(--sc-color)' : 'var(--pc-color)';
                            }

                            this.style.borderRadius = OverlayChatWidgetV2.GetWMElementBorderRadius(false);
                        };
                }
                else if(!lz_overlay_chat.m_FullScreenMode)
                {
                    clnd.style.display = (lz_is_mobile && lz_session.OVLWMState=='0') ? 'none': 'block';
                    lz_add_class(clnd,'lz_anim_slide_in');
                }
                lz_add_class(clnd,'lz_overlay_wm_sh_act');
            }
            else
            {
                cln = wm;
                cln.style.top = (lz_session.OVLWMState!='0') ? lz_overlay_wm.m_MaxHeight-((OverlayChatWidgetV2.__SizeHeight+OverlayChatWidgetV2.__Border)+OverlayChatWidgetV2.__Space) + 'px' : 0;
                cln.style.visibility = (!lz_overlay_chat.m_FullScreenMode) ? 'visible' : 'hidden';
                cln.style.display = (!lz_overlay_chat.m_FullScreenMode) ? 'block' : 'none';
                OverlayChatWidgetV2.UpdateWMIcon(cln);
            }

            lz_add_class(cln,'lz_overlay_wm_button');

            if(typeof lz_ovlel[i].href != 'undefined')
            {
                if(typeof lz_ovlel[i].type != 'undefined' && lz_ovlel[i].open == 'internal')
                    cln.onclick = function(){OverlayChatWidgetV2.SetMode(this.getAttribute('data-tid'),true);};
                else
                    cln.onclick = function(arg) {return function() {OverlayChatWidgetV2.OpenWindow(arg,true);}}(lz_global_base64_url_decode(lz_ovlel[i].href));
            }
            else if(lz_ovlel[i].type == 'knowledgebase' && lz_kb_external)
                cln.onclick = function() {OverlayChatWidgetV2.Pop('knowledgebase');};
            else if(lz_ovlel[i].type == 'knowledgebase' && lz_kb_embed)
                cln.onclick = function() {OverlayChatWidgetV2.OpenWindow(lz_kb_embed_url,true);};
            else
            {
                if(lz_ovlel[i].type=='wm' && lz_chats_external)
                    cln.onclick = function(){OverlayChatWidgetV2.Pop('chat');};
                else
                    cln.onclick = function(){OverlayChatWidgetV2.SetMode(this.getAttribute('data-tid'),true);};
            }

            if(lz_ovlel[i].type == 'chat')
            {
                var svg = cln.getElementsByTagName('svg')[0];
                if(!OverlayChatWidgetV2.IsChatAvailable())
                    lz_add_class(svg,'lz_chat_unavailable');
                else
                    lz_remove_class(svg,'lz_chat_unavailable');

                if(OverlayChatWidgetV2.__ModeTextInline)
                {
                    var desctext = cln.getElementsByTagName('div')[0];
                    if(!OverlayChatWidgetV2.IsChatAvailable())
                        lz_add_class(desctext,'lz_chat_unavailable');
                    else
                        lz_remove_class(desctext,'lz_chat_unavailable');
                }
            }

            if(lz_ovlel[i].type == 'ticket')
            {
                if(!lz_ticket_when_online && OverlayChatWidgetV2.IsChatAvailable() && lz_chat_human_available)
                {
                    lz_add_class(cln,'lz_chat_disabled');
                }
                else
                    lz_remove_class(cln,'lz_chat_disabled');
            }
            lz_add_class(cln,'lz_overlay_wm_sh_act');
            lz_add_class(cln,'lz_anim_slide_in');
        }

        if(OverlayChatWidgetV2.__ModeSingle)
            lz_chat_overlay_pointer.style.bottom = (parseInt(lz_overlay_chat.m_FrameElement.style.marginBottom.replace('px',''))-13) + 'px';

        if(lz_chat_get_wm_element('chat') != null)
        {
            if(OverlayChatWidgetV2.__ModeSingle || lz_session.OVLWMState == '0')
                lz_overlay_wm.m_FrameElement.appendChild(document.getElementById('livezilla_wm_c_chat'));
            else
                document.getElementById('livezilla_wm_chat').appendChild(document.getElementById('livezilla_wm_c_chat'));
        }

        lz_chat_overlay_pointer.style.display = OverlayChatWidgetV2.__ModeAPI || lz_session.OVLWMSElem=='' || lz_session.OVLWMState=='0' || lz_is_mobile || lz_overlay_chat.m_FullScreenMode ? 'none': 'block';

        if(OverlayChatWidgetV2.__ModeTextInline)
        {
            var type = lz_session.OVLWMState == '1' && !OverlayChatWidgetV2.__ModeSingle ? '' : (lz_d(OverlayChatWidgetV2.ButtonTexts[lz_session.OVLWMSElem]) ? lz_session.OVLWMSElem : OverlayChatWidgetV2.GetAutoMode()/*lz_ovlel[1].type*/);

            if(type == 'phone')
                type = !lz_ovlel[1].outbound ? 'phone_in' : 'phone_out';

            //[type]
            document.getElementById('livezilla_wm_d').innerHTML = type != '' ? OverlayChatWidgetV2.ButtonTexts[OverlayChatWidgetV2.GetAutoMode()] : '';

            if(type != '' && typeof lz_ovlel_rt_onl != 'undefined')
                document.getElementById('livezilla_wm_d').innerHTML = lz_global_base64_decode(OverlayChatWidgetV2.IsChatAvailable() ? lz_ovlel_rt_onl : lz_ovlel_rt_ofl);
        }

        if(OverlayChatWidgetV2.__Connecting)
        {
            if(OverlayChatWidgetV2.ChatLoadingElement == null)
            {
                OverlayChatWidgetV2.ChatLoadingElement = document.createElement('div');
                OverlayChatWidgetV2.ChatLoadingElement.className = 'lz_chat_loading';
                OverlayChatWidgetV2.ChatLoadingElement.innerHTML = '<div class="lz_chat_loading_inner"></div>';
                OverlayChatWidgetV2.ChatLoadingElement.style.maxWidth = document.getElementsByClassName('lz_overlay_wm_icon')[0].style.width;
                OverlayChatWidgetV2.ChatLoadingElement.style.zIndex = lz_overlay_zindex + 100;

                if(!OverlayChatWidgetV2.__ModeTextInline || lz_overlay_chat.m_FullScreenMode)
                    OverlayChatWidgetV2.ChatLoadingElement.style.margin = '0 auto';
            }
            var button;
            if(lz_session.OVLWMState == '0' || OverlayChatWidgetV2.__ModeSingle)
                button = document.getElementById('livezilla_wm');
            else if(OverlayChatWidgetV2.IsChatAvailable())
                button = document.getElementById('livezilla_wm_chat');

            if(button && OverlayChatWidgetV2.ChatLoadingElement.parentNode != button)
                button.appendChild(OverlayChatWidgetV2.ChatLoadingElement);
        }
        else if(OverlayChatWidgetV2.ChatLoadingElement != null)
        {
            OverlayChatWidgetV2.ChatLoadingElement.parentNode.removeChild(OverlayChatWidgetV2.ChatLoadingElement);
            OverlayChatWidgetV2.ChatLoadingElement = null;
        }
    };

    OverlayChatWidgetV2.SetGroupInfo = function(){
        var chatelem = lz_chat_get_wm_element('chat');
        if(chatelem != null)
            document.getElementById("lz_chat_operator_groupname").innerHTML = OverlayChatWidgetV2.ButtonTexts[chatelem.type];
    };

    OverlayChatWidgetV2.SetUIGroup = function(_groupId,_set){
        if(LiveZillaData.Groups != null)
        {
            if(LiveZillaData.ForceGroupSelect && !LiveZillaData.ForceSelectMade)
                return;

            if(OverlayChatWidgetV2.__CurrentGroup != null && OverlayChatWidgetV2.__FormVisible && !lz_d(_set))
            {
                OverlayChatWidgetV2.SetGroupInfo();
                return;
            }

            // backward comp; don't use encoding any longer
            var setGroup = LiveZillaData.Groups.GetGroupById(lz_global_base64_url_decode(_groupId));

            if(setGroup == null)
                setGroup = LiveZillaData.Groups.GetGroupById(_groupId);

            if(setGroup != null)
            {
                OverlayChatWidgetV2.__CurrentGroup = setGroup;
                LiveZillaData.Groups.SelectGroupById(OverlayChatWidgetV2.__CurrentGroup.Id,document.getElementById("lz_form_groups"));
                OverlayChatWidgetV2.SetGroupInfo();
            }
            OverlayChatWidgetV2.UpdateChatFunctions();
        }
    };

    OverlayChatWidgetV2.UpdateChatFunctions = function(){

        if(OverlayChatWidgetV2.__CurrentGroup == null)
            return;

        var functions = OverlayChatWidgetV2.__CurrentGroup.ChatFunctions;
        if(functions != null)
        {
            var inChat = OverlayChatWidgetV2.__CurrentChatId != 0 && (lz_chat_status == 2 || (lz_chat_status == 1 && OverlayChatWidgetV2.__ModeBot && OverlayChatWidgetV2.BotFeedback)) && !(OverlayChatWidgetV2.__PublicGroupChat != null && OverlayChatWidgetV2.__PublicGroupChat.length);

            document.getElementById("lz_cf_so").style.display = (functions != null && functions[1]=='0') ? 'none' : 'block';
            document.getElementById("lz_cf_pr").style.display = !(functions != null && functions[2]=='0') && inChat ? 'block' : 'none';

            if(document.getElementById("lz_chat_feedback_init").style.display != 'block')
                document.getElementById("lz_chat_feedback_init").style.display = !(functions != null && functions[3]=='0') && inChat ? 'block' : 'none';
        }

        var flist = ['lz_cf_tr','lz_cf_so','lz_cf_et','lz_cf_ed','lz_cf_pr','lz_cf_ec','lz_cf_ss'];
        var isItem = false;
        for(var key = 0; key < flist.length; key++)
            if(document.getElementById(flist[key]) != null && document.getElementById(flist[key]).style.display != 'none')
                isItem = true;
        document.getElementById("lz_chat_options_button").style.display = isItem ? 'block' : 'none';

        OverlayChatWidgetV2.UpdateChatInputUI();
    };

    OverlayChatWidgetV2.IsFunction = function(_key){

        if(OverlayChatWidgetV2.__CurrentGroup == null)
            return false;

        if(_key == 'ss' && lz_overlay_chat.m_FullScreenMode)
            return false;

        var functions = OverlayChatWidgetV2.__CurrentGroup.ChatFunctions;
        if(functions != null)
        {
            var flist = ['sm','so','pr','ra','fv','fu','ss'];
            for(var key = 0; key < flist.length; key++)
            {
                if(flist[key] == _key)
                    return functions[key] == '1';
            }
        }
        return false;
    };

    OverlayChatWidgetV2.InitFileUpload = function(){

        if(lz_session.OVLWMSElem == 'chat' && lz_session.OVLWMState == '0' && !lz_check_missing_inputs(true) && !OverlayChatWidgetV2.IsChatActive())
        {
            OverlayChatWidgetV2.Show(false);
            return;
        }

        document.getElementById('lz_overlay_file_upload').addEventListener('change', OverlayChatWidgetV2.UploadFile, false);

        setTimeout(function(){
            document.getElementById('lz_overlay_file_upload').click();
        },400);
    };

    OverlayChatWidgetV2.UploadFile = function(evt){

        if(lz_session.OVLWMSElem == 'chat' && lz_chat_status == 0)
        {
            OverlayChatWidgetV2.FileUploadToStartChat = evt;
            OverlayChatWidgetV2.StartChat();
            return;
        }
        else
            OverlayChatWidgetV2.FileUploadToStartChat = false;

        var f,ftu,files = evt.target.files;
        for (var i = 0; f = files[i]; i++)
        {
            var reader = new FileReader();
            reader.onload = (function(reader)
            {
                ftu = f;
                return function()
                {
                    var params = 'form_userfile='+lz_global_base64_encode(reader.result);
                    params += '&p_request=extern';
                    params += '&p_action=file_upload';
                    params += '&elem=' + lz_session.OVLWMSElem;
                    params += '&bid=' + lz_global_base64_url_encode(lz_session.BrowserId);
                    params += '&gid=' + lz_global_base64_url_encode(OverlayChatWidgetV2.__CurrentGroup.Id);
                    params += '&uid=' + lz_global_base64_url_encode(lz_session.UserId);
                    params += '&find=MQ__&type=file&fname=' + lz_global_base64_encode(ftu.name);

                    if(lz_session.OVLWMSElem == 'chat')
                    {
                        params += '&cid=' + lz_global_base64_url_encode(OverlayChatWidgetV2.__CurrentChatId);
                    }
                    else
                    {
                        lz_load_inputs = true;
                    }

                    lz_post(lz_poll_server + 'upload.php?f=MQ__&ptl=' + LiveZillaData.Language,params,function(e)
                    {
                        document.getElementById("lz_overlay_file_upload").value = "";
                        LiveZilla.Engine.Poll(1021);
                    });
                }
            })(reader);
            reader.readAsDataURL(f);
        }
    };

    OverlayChatWidgetV2.ForwardTicket = function(_click,_callback){
        function ___applyLanguageCodeToURL(_url){
            if(LiveZillaData.Language.length)
            {
                if(_url.indexOf('?') == -1)
                    _url += '?language=' + LiveZillaData.Language;
                else
                    _url += '&language=' + LiveZillaData.Language;
            }
            return _url;
        }

        var configMode = !_callback ? OverlayChatWidgetV2.OfflineMessageMode : OverlayChatWidgetV2.CallbackMode;
        var configNewWindow = !_callback ? OverlayChatWidgetV2.OfflineMessageNewWindow : OverlayChatWidgetV2.CallbackNewWindow;
        var configURL = !_callback ? OverlayChatWidgetV2.OfflineMessageHTTP : OverlayChatWidgetV2.CallbackHTTP;

        if(configMode == 1)
        {
            if(lz_overlay_chat.m_FullScreenMode || _click)
            {
                if(configNewWindow)
                    window.location.href = ___applyLanguageCodeToURL(configURL);
                else
                    OverlayChatWidgetV2.OpenWindow(___applyLanguageCodeToURL(configURL),true);
            }
            return true;
        }
        return false;
    };

    OverlayChatWidgetV2.GetAutoMode = function(){

        var autoMode = 'NA';
        if(!lz_hide_widget_by_conf)
        {
            if(lz_chat_get_wm_element('custom1') != null && typeof lz_chat_get_wm_element('custom1').open != 'undefined' && lz_chat_get_wm_element('custom1').open == 'internal')
                autoMode = 'custom1';

            if(lz_chat_get_wm_element('custom2') != null && typeof lz_chat_get_wm_element('custom2').open != 'undefined' && lz_chat_get_wm_element('custom2').open == 'internal')
                autoMode = 'custom2';

            if(lz_chat_get_wm_element('custom3') != null && typeof lz_chat_get_wm_element('custom3').open != 'undefined' && lz_chat_get_wm_element('custom3').open == 'internal')
                autoMode = 'custom3';

            if(lz_chat_get_wm_element('phone') != null)
                autoMode = 'phone';

            if(lz_chat_get_wm_element('knowledgebase') != null)
                autoMode = 'knowledgebase';

            if(OverlayChatWidgetV2.OfflineMessageMode != 1 || OverlayChatWidgetV2.__ModeClassic || OverlayChatWidgetV2.__ModeSingle)
                if(lz_chat_get_wm_element('ticket') != null)
                    autoMode = 'ticket';

            if(lz_chat_get_wm_element('chat') != null && (OverlayChatWidgetV2.IsChatAvailable()||OverlayChatWidgetV2.__ModeBot||autoMode == 'NA') && !lz_chat_declined && !OverlayChatWidgetV2.__TicketRequired)
                autoMode = 'chat';
        }
        return autoMode;
    };

    OverlayChatWidgetV2.IsChatAvailable = function(){
        return lz_chat_get_wm_element('chat') != null && ((OverlayChatWidgetV2.__CurrentGroup != null && OverlayChatWidgetV2.__CurrentGroup.Amount > 0) || lz_chat_status > 0) && !lz_chat_declined;
    };

    OverlayChatWidgetV2.ValidateMode = function(){

        if(OverlayChatWidgetV2.Screenshot != null)
            return;

        var autoMode = OverlayChatWidgetV2.GetAutoMode();

        if(lz_overlay_wm != null && !OverlayChatWidgetV2.__ModeAPI)
        {
            var vis = (autoMode != 'NA' || lz_chat_get_wm_element('ticket') != null) && !lz_hide_widget_by_conf && !lz_overlay_chat.m_FixedMode && !(lz_overlay_chat.m_FullScreenMode && OverlayChatWidgetV2.__ModeSingle);

            lz_overlay_wm.SetVisible(vis);
        }

        if(autoMode == 'NA')
        {
            lz_overlay_chat.SetVisible(false);
            if(lz_overlay_chat.m_FullScreenMode)
                OverlayChatWidgetV2.ForwardTicket(true,false);
        }

        if(lz_session.OVLWMSElem == '' || OverlayChatWidgetV2.__ModeSingle || OverlayChatWidgetV2.__ModeClassic || lz_session.OVLWMState == '0')
            if(lz_session.OVLWMSElem != autoMode)
            {
                if(lz_session.OVLWMSElem == 'phone')
                    return;
                if(lz_session.OVLWMSElem == 'knowledgebase')
                    return;
                if(lz_session.OVLWMSElem.indexOf('custom') === 0)
                    return;
                if(lz_session.OVLWMSElem == 'feedback')
                    return;
                if(!lz_is_mobile || lz_overlay_chat.m_FixedMode || lz_overlay_chat.m_FullScreenMode)
                {
                    OverlayChatWidgetV2.SetMode(autoMode,false);
                }
            }
    };

    OverlayChatWidgetV2.SetMode = function(_type,_click,_groupId){

        var showBox;

        _groupId = (lz_d(_groupId)) ? _groupId : null;

        if(_groupId != null)
        {
            OverlayChatWidgetV2.TargetGroupId = _groupId;
        }

        if(_click && _type == 'wm')
        {
            lz_session.OVLWMSElem = OverlayChatWidgetV2.GetAutoMode();
            OverlayChatWidgetV2.FlipWM();
        }

        if(_click && OverlayChatWidgetV2.__ModeTicketReceived)
            lz_chat_data_form_result();

        if(_click && OverlayChatWidgetV2.__ModeTOS)
        {
            OverlayChatWidgetV2.ToggleTOS(false);
            return;
        }

        if(_click && OverlayChatWidgetV2.__ModeFeedback)
        {
            OverlayChatWidgetV2.ToggleFeedback(false,false);
            return;
        }

        if(OverlayChatWidgetV2.__ModeChangeDetails && _click && _type != 'chat')
            OverlayChatWidgetV2.__ModeChangeDetails = false;

        if(_type == 'chat' && OverlayChatWidgetV2.__TicketRequired && _click)
        {
            OverlayChatWidgetV2.__TicketRequired = false;
        }

        if(_type == 'ticket' && OverlayChatWidgetV2.ForwardTicket(_click,false))
        {
            lz_session.OVLWMSElem = OverlayChatWidgetV2.GetAutoMode();
            if(!lz_overlay_chat.m_FullScreenMode)
                lz_session.OVLWMState = '0';
        }
        else if(_type == 'phone' && OverlayChatWidgetV2.ForwardTicket(_click,true))
        {
            lz_session.OVLWMSElem = OverlayChatWidgetV2.GetAutoMode();
            if(!lz_overlay_chat.m_FullScreenMode)
                lz_session.OVLWMState = '0';
        }
        else if(_type == 'wm' && OverlayChatWidgetV2.__ModeSingle && !OverlayChatWidgetV2.IsChatAvailable() && OverlayChatWidgetV2.ForwardTicket(_click,false))
        {
            lz_session.OVLWMSElem = 'ticket';
            if(!lz_overlay_chat.m_FullScreenMode)
                lz_session.OVLWMState = '0';
        }
        else
        {
            lz_chat_switch_options_table(true,3);

            if(OverlayChatWidgetV2.__ModeSingle || OverlayChatWidgetV2.__ModeClassic)
            {
                if(_type!='wm' && _type != '')
                    lz_session.OVLWMSElem = _type;
                else if(_type=='wm' && !OverlayChatWidgetV2.IsChatAvailable() && lz_session.OVLWMSElem == 'NA')
                    OverlayChatWidgetV2.ForwardTicket(_click,false);

                else if(_type=='wm' && OverlayChatWidgetV2.__ModeSingle && lz_session.OVLWMSElem == '')
                    lz_session.OVLWMSElem = (OverlayChatWidgetV2.IsChatAvailable()) ? 'chat' : 'ticket';


                if(_click)
                    lz_session.OVLWMState = (lz_session.OVLWMState=='0') ? '1' : '0';

                showBox = (lz_session.OVLWMState=='1' && lz_session.OVLWMSElem != '' && lz_session.OVLWMSElem != 'NA');
            }
            else
            {
                if(_type == '')
                    lz_session.OVLWMState = '0';
                else if(_type=='wm')
                    lz_session.OVLWMState = (lz_session.OVLWMState=='0') ? '1' : '0';

                if(_type != 'wm')
                    lz_session.OVLWMSElem = _type;

                if(lz_overlay_chat.m_FullScreenMode)
                    lz_session.OVLWMState = '1';

                if(lz_is_mobile)
                    showBox = (lz_session.OVLWMState=='1' && lz_session.OVLWMSElem != '' && lz_session.OVLWMSElem != 'NA' && _type != 'wm');
                else
                    showBox = (lz_session.OVLWMState=='1' && lz_session.OVLWMSElem != '' && lz_session.OVLWMSElem != 'NA');
            }

            if(_click && !OverlayChatWidgetV2.__ModeSingle)
            {
                if(_type == lz_session.OVLWMSElem && !lz_overlay_chat.m_FullScreenMode)
                {
                    if(lz_chat_overlay_pointer != null && lz_session.OVLWMState!='0')
                        if(!OverlayChatWidgetV2.__ModeTextInline)
                            lz_chat_overlay_pointer.style.visibility = 'hidden';
                }
                if(_type == 'knowledgebase' && document.getElementById('lz_chat_kb_match_info').style.display != 'none')
                    lz_chat_kb_deactivate(false,false);
            }
        }

        if(_click && lz_session.OVLWMState == '0')
            OverlayChatWidgetV2.AnswerChatRequest();
        else if(lz_session.OVLWMState == '1')
            OverlayChatWidgetV2.ResetPreviewPosts(true);

        lz_session.Save();

        OverlayChatWidgetV2.UpdateChatUI(showBox);
        OverlayChatWidgetV2.UpdateButtonUI();
        OverlayChatWidgetV2.UpdateWMUI();
        OverlayChatWidgetV2.UpdateUI();

        if(lz_session.OVLWMSElem == 'chat')
        {
            OverlayChatWidgetV2.ScrollDown(63728);
        }
    };

    OverlayChatWidgetV2.APIButtonClick = function(_option){
        document.getElementById('lz_chat_text').value = lz_global_base64_decode(_option);
        OverlayChatWidgetV2.SendMessage(null,null);
    };

    OverlayChatWidgetV2.FlipWM = function(){
        document.getElementById('livezilla_wm').style.transform = 'rotateX(180deg)';
        lz_add_class(document.getElementById('livezilla_wm'),'lz_anim_flip');
        setTimeout(function(){
            document.getElementById('livezilla_wm').style.transform='';
            lz_remove_class(document.getElementById('livezilla_wm'),'lz_anim_flip');
        },500);
    };

    OverlayChatWidgetV2.UpdateChatUI = function(_visible){

        if(lz_overlay_chat.m_FullScreenMode || (_visible && !lz_overlay_chat.IsVisible()))
        {
            if(OverlayChatWidgetV2.__ModeClassic)
                OverlayChatWidgetV2.Maximize();

            lz_overlay_chat.SetVisible(true);

            if(lz_is_mobile && !lz_overlay_chat.m_FullScreenMode)
            {
                lz_chat_set_zoom(true,true);
                OverlayChatWidgetV2.ValidateMode();
                lz_overlay_wm.SetVisible(false);
            }
        }
        if(!lz_overlay_chat.m_FullScreenMode && (!_visible && lz_overlay_chat.IsVisible()))
        {
            if(lz_is_mobile && !lz_overlay_chat.m_FullScreenMode)
            {
                lz_chat_set_zoom(true,false);
                lz_overlay_wm.SetVisible(true);
            }

            if(!lz_is_mobile && OverlayChatWidgetV2.__ModeClassic)
                OverlayChatWidgetV2.Minimize();
            else
                lz_overlay_chat.SetVisible(false);
        }
    };

    OverlayChatWidgetV2.UpdateUI = function(){

        OverlayChatWidgetV2.UpdateFormUI();

        if(OverlayChatWidgetV2.__ModeTicketReceived && OverlayChatWidgetV2.__ModeSingle && OverlayChatWidgetV2.IsChatAvailable())
            OverlayChatWidgetV2.__ModeTicketReceived = false;

        if(OverlayChatWidgetV2.__CurrentGroup == null)
            return;

        if(typeof lz_ovlel_rt_ofl != 'undefined')
            lz_header_off = lz_ovlel_rt_ofl;
        if(typeof lz_ovlel_rt_onl != 'undefined')
            lz_header_on = lz_ovlel_rt_onl;

        document.getElementById('lz_chat_data_header').innerHTML = '<h2>' + ((lz_session.OVLWMSElem == "chat") ? ((!OverlayChatWidgetV2.__ModeChangeDetails) ? lz_text_start_chat  : lz_text_change_details) : (lz_session.OVLWMSElem=="phone") ? lz_req_callback : lz_text_leave_message) + '</h2>';
        document.getElementById('lz_chat_overlay_text').innerHTML = lz_global_base64_decode(lz_header_off);

        if(lz_session.OVLWMSElem =="chat")
        {
            if(OverlayChatWidgetV2.__ModeChangeDetails)
                document.getElementById('lz_chat_data_header_text').innerHTML = '';
            else if(OverlayChatWidgetV2.IsChatAvailable() && OverlayChatWidgetV2.__CurrentGroup.ChatInformation.length)
                document.getElementById('lz_chat_data_header_text').innerHTML = OverlayChatWidgetV2.__CurrentGroup.ChatInformation;
            else if(OverlayChatWidgetV2.IsChatAvailable())
                document.getElementById('lz_chat_data_header_text').innerHTML = lz_text_chat_information;
            else if(OverlayChatWidgetV2.__CurrentGroup.ChatInformationOffline.length)
                document.getElementById('lz_chat_data_header_text').innerHTML = OverlayChatWidgetV2.__CurrentGroup.ChatInformationOffline;
            else
                document.getElementById('lz_chat_data_header_text').innerHTML = lz_text_chat_information_offline;

            document.getElementById('lz_chat_overlay_text').innerHTML = lz_global_base64_decode(lz_header_on);
        }
        else if(lz_session.OVLWMSElem=="phone")
        {
            if(OverlayChatWidgetV2.__CurrentGroup.CallMeBackInformation.length)
                document.getElementById('lz_chat_data_header_text').innerHTML = OverlayChatWidgetV2.__CurrentGroup.CallMeBackInformation;
            else
                document.getElementById('lz_chat_data_header_text').innerHTML = lz_text_callback_information;
        }
        else if(lz_session.OVLWMSElem=="ticket")
        {
            if(OverlayChatWidgetV2.__CurrentGroup.TicketInformation.length)
                document.getElementById('lz_chat_data_header_text').innerHTML = OverlayChatWidgetV2.__CurrentGroup.TicketInformation;
            else
                document.getElementById('lz_chat_data_header_text').innerHTML = lz_text_ticket_information;
        }

        document.getElementById("lz_chat_overlay_ticket").style.display = (OverlayChatWidgetV2.__ModeTicketReceived) ? "block" : 'none';
        document.getElementById("lz_overlay_module_knowledgebase").style.visibility = (lz_session.OVLWMSElem == 'knowledgebase') ? "visible" : "hidden";
        document.getElementById("lz_overlay_module_custom").style.visibility = (lz_session.OVLWMSElem != null && lz_session.OVLWMSElem.indexOf('custom') === 0) ? "visible" : "hidden";
        document.getElementById("lz_overlay_module_feedback").style.visibility = (OverlayChatWidgetV2.__ModeFeedback) ? "visible" : "hidden";
        document.getElementById("lz_overlay_module_feedback").style.display = (OverlayChatWidgetV2.__ModeFeedback) ? "block" : 'none';
        document.getElementById("lz_overlay_module_tos").style.display = (OverlayChatWidgetV2.__ModeTOS) ? "block" : 'none';
        document.getElementById("lz_chat_content_box").style.display = (lz_session.OVLWMSElem == "chat") ? "block" : 'none';
        document.getElementById('lz_overlay_phone_inbound').style.display = (lz_mode_phone_inbound && lz_session.OVLWMSElem == "phone" && !OverlayChatWidgetV2.__ModeTOS && !OverlayChatWidgetV2.__ModeTicketReceived) ? 'block' : 'none';

        if(lz_session.OVLWMSElem == "phone" && lz_mode_phone_inbound)
        {
            document.getElementById('lz_chat_data_form').style.top = '180px';
            lz_add_class(document.getElementById('lz_chat_data_header'),'lz_chat_sub_header');
        }
        else
        {
            document.getElementById('lz_chat_data_form').style.top = '0';
            lz_remove_class(document.getElementById('lz_chat_data_header'),'lz_chat_sub_header');
        }

        if(lz_session.OVLWMSElem == 'knowledgebase')
            if(document.getElementById("lz_overlay_module_knowledgebase").getElementsByTagName("iframe")[0].src == "" )
                lz_kb_set_url('');

        if(lz_session.OVLWMSElem != null && lz_session.OVLWMSElem.indexOf('custom') === 0)
            OverlayChatWidgetV2.SetCustomURL();

        OverlayChatWidgetV2.__FormVisible = true;
        var inChat = OverlayChatWidgetV2.IsChatActive();

        if(inChat)
            OverlayChatWidgetV2.__FormConfirmRequired = false;

        if(!OverlayChatWidgetV2.__ModeChangeDetails)
        {
            /*if(lz_session.OVLWMSElem == "chat" && document.getElementsByClassName("lz_overlay_chat_message_invite").length)
                OverlayChatWidgetV2.__FormVisible = false;
            else*/if(lz_session.OVLWMSElem == "chat" && (OverlayChatWidgetV2.ChatStarted || OverlayChatWidgetV2.ChatEnded ||OverlayChatWidgetV2.ChatInitiated || OverlayChatWidgetV2.__Connecting))
                OverlayChatWidgetV2.__FormVisible = false;
            else if(lz_session.OVLWMSElem == "chat" && OverlayChatWidgetV2.__ModeBot && !OverlayChatWidgetV2.BotForm)
                OverlayChatWidgetV2.__FormVisible = false;
            else if(OverlayChatWidgetV2.__ModeTicketReceived || OverlayChatWidgetV2.__ModeFeedback || OverlayChatWidgetV2.__ModeTOS)
                OverlayChatWidgetV2.__FormVisible = false;
            else if(lz_session.OVLWMSElem == "phone" && !lz_mode_phone_outbound)
                OverlayChatWidgetV2.__FormVisible = false;
            else if(lz_session.OVLWMSElem == 'knowledgebase')
                OverlayChatWidgetV2.__FormVisible = false;
            else if(lz_session.OVLWMSElem.indexOf('custom') === 0)
                OverlayChatWidgetV2.__FormVisible = false;
            else if(lz_session.OVLWMSElem == "chat" && !OverlayChatWidgetV2.__FormConfirmRequired)
            {
                if(lz_chat_status > 0 || inChat)
                    OverlayChatWidgetV2.__FormVisible = false;
                else if(lz_check_missing_inputs(false,null) && !OverlayChatWidgetV2.__PublicGroupChat.length)
                {
                    if(OverlayChatWidgetV2.IsChatAvailable())
                        if(!(LiveZillaData.ForceGroupSelect && !LiveZillaData.ForceSelectMade))
                            OverlayChatWidgetV2.__FormVisible = false;
                }
            }
        }

        document.getElementById("lz_overlay_module_chat").style.display = (!OverlayChatWidgetV2.__FormVisible && lz_session.OVLWMSElem == "chat" && !OverlayChatWidgetV2.__ModeFeedback && !OverlayChatWidgetV2.__ModeTOS && !OverlayChatWidgetV2.__ModeChangeDetails) ? "block" : 'none';

        if(OverlayChatWidgetV2.__FormVisible && !inChat && lz_session.OVLWMSElem == 'chat' && OverlayChatWidgetV2.IsChatAvailable() && LiveZillaData.InputFieldIndices != null && lz_session.OVLWMState=='1')
            OverlayChatWidgetV2.__FormConfirmRequired = true;

        OverlayChatWidgetV2.UpdateMessageInput();

        document.getElementById('lz_chat_data_form').style.display = OverlayChatWidgetV2.__FormVisible ? 'block' : 'none';
        document.getElementById('lz_chat_ticket_received').style.display = (OverlayChatWidgetV2.__ModeTicketReceived && !lz_flood && !(OverlayChatWidgetV2.__ModeSingle && OverlayChatWidgetV2.IsChatAvailable())) ? '' : 'none';
    };

    OverlayChatWidgetV2.UpdateMessageInput = function(){
        try
        {
            if(lz_session.OVLWMState == '1')
            {
                if(OverlayChatWidgetV2.__FormVisible && document.getElementById('lz_chat_text').value.length && !document.getElementsByName('form_114')[0].value.length)
                {
                    document.getElementsByName('form_114')[0].value = document.getElementById('lz_chat_text').value;
                    document.getElementById('lz_chat_text').value = '';
                    lz_chat_save_input_value('114',document.getElementsByName('form_114')[0].value);
                    lz_check_missing_inputs(true);
                }
                else if(lz_chat_status == 0 && !OverlayChatWidgetV2.__Connecting && !OverlayChatWidgetV2.ChatStarted && !OverlayChatWidgetV2.ChatInitiated && !OverlayChatWidgetV2.__FormVisible && !document.getElementById('lz_chat_text').value.length && document.getElementsByName('form_114')[0].value.length)
                {
                    document.getElementById('lz_chat_text').value = document.getElementsByName('form_114')[0].value;
                    document.getElementsByName('form_114')[0].value = '';
                }
            }
        }
        catch(ex)
        {
            console.log(ex);
        }
    };

    OverlayChatWidgetV2.IsChatActive = function(){
            return (OverlayChatWidgetV2.ChatStarted || OverlayChatWidgetV2.ChatInitiated || lz_chat_status > 0);
    };

    OverlayChatWidgetV2.UpdateButtonUI = function(){

        lz_remove_class(document.getElementById('lz_chat_overlay_data_form_ok_button'),'lz_chat_disabled');
        document.getElementById('lz_chat_overlay_data_form_ok_button').innerHTML = (lz_session.OVLWMSElem == "chat") ? ((OverlayChatWidgetV2.__ModeChangeDetails) ? lz_text_save : (!OverlayChatWidgetV2.IsChatAvailable()) ? lz_text_not_available : lz_text_start_chat) : (lz_session.OVLWMSElem=="phone") ? lz_call_me : lz_text_leave_message;
        if(lz_session.OVLWMSElem == 'chat' && !OverlayChatWidgetV2.IsChatAvailable())
        {
            if(lz_chat_get_wm_element('ticket')!=null)
            {
                document.getElementById('lz_chat_overlay_data_form_ok_button').innerHTML = lz_text_leave_message;
            }
            else
            {
                lz_add_class(document.getElementById('lz_chat_overlay_data_form_ok_button'),'lz_chat_disabled');
            }
        }
    };

    OverlayChatWidgetV2.UpdateWMIcon = function(cln){

        if(lz_session.OVLWMState == '1')
            OverlayChatWidgetV2.ApplyIconToElement(cln,'close');
        else if(typeof lz_ovlel_ri != 'undefined')
            OverlayChatWidgetV2.ApplyIconToElement(cln,lz_ovlel_ri);
        else
        {
            OverlayChatWidgetV2.ApplyIconToElement(cln,'comments');
            if(OverlayChatWidgetV2.__ModeSingle)
            {
                if(lz_session.OVLWMSElem=='chat' && lz_chat_get_wm_element('chat') != null)
                {
                    OverlayChatWidgetV2.ApplyIconToElement(cln,lz_chat_get_wm_element('chat').icon);
                }
                else if(lz_session.OVLWMSElem=='ticket' && lz_chat_get_wm_element('ticket') != null)
                {
                    OverlayChatWidgetV2.ApplyIconToElement(cln,lz_chat_get_wm_element('ticket').icon);
                }
                else if(lz_session.OVLWMSElem=='' && !OverlayChatWidgetV2.IsChatAvailable() && lz_chat_get_wm_element('ticket') != null)
                {
                    OverlayChatWidgetV2.ApplyIconToElement(cln,lz_chat_get_wm_element('ticket').icon);
                }
                else if(lz_ovlel.length>1)
                {
                    OverlayChatWidgetV2.ApplyIconToElement(cln,lz_ovlel[1].icon);
                }
                else if(lz_ovlel.length==1)
                {
                    OverlayChatWidgetV2.ApplyIconToElement(cln,lz_ovlel[0].icon);
                }
            }
            else if(lz_chat_get_wm_element('chat') == null || !OverlayChatWidgetV2.IsChatAvailable())
            {
                if(lz_chat_get_wm_element('ticket') != null)
                    OverlayChatWidgetV2.ApplyIconToElement(cln,'envelope');
                else
                    OverlayChatWidgetV2.ApplyIconToElement(cln,'question');
            }
        }
    };

    OverlayChatWidgetV2.ApplyIconToElement = function(_element,_iconName){

        var vbx = -12*OverlayChatWidgetV2.__Ratio;
        var vby = -11*OverlayChatWidgetV2.__Ratio;
        var vw = OverlayChatWidgetV2.__SizeHeight;
        var trdef = 14;
        var data = lz_get_icon_data(_iconName);

        _element.getElementsByTagName('path')[0].setAttribute("d", data.path);

        if(lz_d(data.vx))
            vbx = data.vx*OverlayChatWidgetV2.__Ratio;

        if(lz_d(data.vy))
            vby = data.vy*OverlayChatWidgetV2.__Ratio;

        _element.getElementsByTagName('svg')[0].setAttribute("viewBox", vbx + ' ' + vby + ' ' + vw + ' ' + vw);

        if(lz_d(data.t))
            trdef = data.t;

        var scale = 'scale(.0' + Math.floor(trdef*OverlayChatWidgetV2.__Ratio).toString()+')';
        _element.getElementsByTagName('path')[0].setAttribute("transform", scale);
        _element.getElementsByTagName('path')[0].style.transform = scale;

    };

    OverlayChatWidgetV2.Minimize = function(){
        lz_session.OVLWMState = '0';
        lz_session.Save();
        document.getElementById('lz_chat_content').style.display='none';
        document.getElementById('lz_chat_overlay_text').style.display='block';
        document.getElementById('lz_chat_overlay_main').style.boxShadow = 'none';
        OverlayChatWidgetV2.SetSize(260,40);
    };

    OverlayChatWidgetV2.Maximize = function(){

        if(!lz_chats_external)
        {
            if(OverlayChatWidgetV2.__ModeClassic && !OverlayChatWidgetV2.IsChatAvailable() && OverlayChatWidgetV2.ForwardTicket(true,false))
            {
                OverlayChatWidgetV2.Minimize();
                return;
            }

            lz_session.OVLWMState = '1';
            lz_session.Save();
            document.getElementById('lz_chat_content').style.display='block';
            document.getElementById('lz_chat_overlay_text').style.display='none';
            document.getElementById('lz_chat_overlay_main').style.boxShadow = '0 0 10px #888';
            OverlayChatWidgetV2.SetSize(lz_overlay_chat_width,lz_overlay_chat_height);
            OverlayChatWidgetV2.UpdateUI();
            OverlayChatWidgetV2.UpdateWaitingPosts(0);
            OverlayChatWidgetV2.UpdateChatHistoryUI();
            OverlayChatWidgetV2.ScrollDown(77297);
            OverlayChatWidgetV2.ResetPreviewPosts();

        }
        else
            OverlayChatWidgetV2.Open(false);
    };

    OverlayChatWidgetV2.SetSize = function(_w,_h){

        lz_overlay_chat.m_FrameElement.style.width = _w + 'px';
        lz_overlay_chat.m_FrameElement.style.height = _h + 'px';

        if(OverlayChatWidgetV2.PostPreview != null)
            OverlayChatWidgetV2.PostPreview.m_FrameElement.style.width = (lz_overlay_wm == null ? 260 : (lz_overlay_chat_width *.7)) + 'px';
    };

    OverlayChatWidgetV2.Open = function(_playSound){

        if(lz_chats_external)
            OverlayChatWidgetV2.Pop('chat');
        else if(OverlayChatWidgetV2.__ModeClassic)
        {
            lz_overlay_chat.SetVisible(true);
            OverlayChatWidgetV2.Maximize();
        }
        else if(lz_chat_get_wm_element('chat')!=null)
        {
            lz_session.OVLWMState = '1';
            OverlayChatWidgetV2.SetMode(OverlayChatWidgetV2.GetAutoMode(),false);
        }
        else
            OverlayChatWidgetV2.SetMode(OverlayChatWidgetV2.GetAutoMode(),true);

        if(_playSound)
            OverlayChatWidgetV2.PlaySound(OverlayChatWidgetV2.NotificationSound);
    };

    OverlayChatWidgetV2.ExitBotChat = function(_exit,_poll,_cll,_removeBotWelcome){

        _removeBotWelcome = lz_d(_removeBotWelcome) ? _removeBotWelcome : false;

        if(OverlayChatWidgetV2.__ModeBot)
        {
            OverlayChatWidgetV2.__ModeBot = false;
            OverlayChatWidgetV2.__NoBotChat = _exit;

            if(_poll && _exit)
                OverlayChatWidgetV2.ExitChat();
        }

        if(_removeBotWelcome)
        {
            if(document.getElementById('BotWelcomeMessage') != null)
                document.getElementById('BotWelcomeMessage').parentElement.removeChild(document.getElementById('BotWelcomeMessage'));
        }
    };

    OverlayChatWidgetV2.ExitChat = function(_doExit){

        _doExit = lz_d(_doExit) ? _doExit : true;

        OverlayChatWidgetV2.ChatInitiated = false;
        OverlayChatWidgetV2.ChatStarted = false;

        if(_doExit)
        {
            lz_leave_chat = true;
            LiveZilla.Engine.Poll(1120);
        }
        else
        {
            OverlayChatWidgetV2.ChatEnded = true;
        }
    };

    OverlayChatWidgetV2.InitChat = function(_operatorId,_groupId){

        OverlayChatWidgetV2.ChatInitiated = true;
        OverlayChatWidgetV2.ChatStarted = true;
        OverlayChatWidgetV2.ChatEnded = false;

        if(lz_d(_operatorId) && _operatorId != null)
            OverlayChatWidgetV2.TargetOperatorId = _operatorId;
        else
            OverlayChatWidgetV2.TargetOperatorId = null;

        if(lz_d(_groupId) && _groupId != null)
        {
            OverlayChatWidgetV2.TargetGroupId = _groupId;
            OverlayChatWidgetV2.SetUIGroup(_groupId);
        }
        LiveZilla.Engine.Poll(1311,true);
    };

    OverlayChatWidgetV2.SetGroups = function(_groups,_selected){

        LiveZillaData.ForceGroupSelect = OverlayChatWidgetV2.ForceGroupSelect;

        if(LiveZillaData.Groups == null)
            LiveZillaData.Groups = new lz_group_list(document,document.getElementById('lz_form_groups'));

        LiveZillaData.Groups.StatusIcon = false;
        LiveZillaData.Groups.CreateHeader(lz_text_please_select);
        LiveZillaData.Groups.Update(_groups);

        if(lz_d(_selected) && _selected.length)
        {
            OverlayChatWidgetV2.SetUIGroup(_selected,true);
        }
    };

    OverlayChatWidgetV2.ToggleTOS = function(_visible){

        OverlayChatWidgetV2.__ModeTOS = _visible;
        OverlayChatWidgetV2.UpdateUI();

        if(lz_overlay_chat.m_FixedMode || lz_overlay_chat.m_FullScreenMode)
            document.getElementById('lz_chat_overlay_minimize').style.display = (_visible) ? 'block' : 'none';
    };

    OverlayChatWidgetV2.ToggleFeedback = function(_visible,_delayed){

        _delayed = (lz_d(_delayed)) ? _delayed : false;

        if(_delayed)
        {
            OverlayChatWidgetV2.FeedbackOnMouseMove = true;
        }
        else
        {
            if(lz_chat_status == 1 && !(OverlayChatWidgetV2.BotFeedback && OverlayChatWidgetV2.__ModeBot))
                return;

            if(_visible)
            {
                var getp = 'wt=ovlv2&etc=' + lz_global_base64_url_encode(lz_color_primary) + '&ptl=' + LiveZillaData.Language;

                if(OverlayChatWidgetV2.__CurrentChatId != 0)
                    getp += '&cid='+ lz_global_base64_url_encode(OverlayChatWidgetV2.__CurrentChatId);
                else if(OverlayChatWidgetV2.__LastChatId != 0)
                    getp += '&cid='+ lz_global_base64_url_encode(OverlayChatWidgetV2.__LastChatId);

                var ifr = document.getElementById('lz_overlay_module_feedback_content').getElementsByTagName('iframe')[0];
                if(ifr.src != lz_poll_server+"feedback.php?"+getp)
                {
                    document.getElementById("lz_overlay_module_feedback").style.display = 'block';
                    ifr.src = lz_poll_server+"feedback.php?"+getp;
                }
            }
            OverlayChatWidgetV2.__ModeFeedback = _visible;
            OverlayChatWidgetV2.UpdateUI();

            if(lz_overlay_chat.m_FullScreenMode)
                document.getElementById('lz_chat_overlay_minimize').style.display = (_visible) ? 'block' : 'none';
        }

        if(_delayed && lz_is_mobile)
        {
            OverlayChatWidgetV2.MouseMove(null);
        }

    };

    OverlayChatWidgetV2.MouseMove = function(_evt){

        OverlayChatWidgetV2.__PostsNoticed = true;
        OverlayChatWidgetV2.MouseMoveEvent = _evt;

        if(OverlayChatWidgetV2.FeedbackOnMouseMove)
        {
            OverlayChatWidgetV2.FeedbackOnMouseMove = false;
            setTimeout(function(){
                if(!OverlayChatWidgetV2.__Connecting && lz_chat_status == 0 && !OverlayChatWidgetV2.ChatStarted)
                    OverlayChatWidgetV2.ToggleFeedback(true,false);
            },3000);
        }
    };

    OverlayChatWidgetV2.SetStatus = function(_hideWidget,_chat,_bot,_human,_title,_chatStatus){
        if(lz_overlay_chat != null)
        {
            var isChat = (lz_session.OVLWMSElem == 'chat');
            lz_hide_widget_by_conf = _hideWidget;

            if(_chatStatus == 0 && lz_chat_status != _chatStatus && lz_chat_status != -1)
            {
                OverlayChatWidgetV2.ExitChat(false);
            }

            lz_chat_status = _chatStatus;
            lz_chat_declined = false;
            lz_chat_human_available = _human;

            if(OverlayChatWidgetV2.CurrentOperator != null || OverlayChatWidgetV2.__Connecting)
                _chat = true;

            if(OverlayChatWidgetV2.__ModeChangeDetails && _chat != isChat)
                lz_chat_switch_details(true);

            if(!_chat && document.getElementById('lz_chat_text').value.length > 0 && document.getElementsByName('form_114')[0].value.length == 0)
                document.getElementsByName('form_114')[0].value = document.getElementById('lz_chat_text').value;

            if(!_chat && document.getElementById('lz_chat_queued_posts') != null)
                document.getElementById("lz_chat_content_box").removeChild(document.getElementById('lz_chat_queued_posts'));

            OverlayChatWidgetV2.UpdateChatFunctions();
            OverlayChatWidgetV2.ValidateMode();
            OverlayChatWidgetV2.UpdateUI();
            OverlayChatWidgetV2.UpdateWMUI();
            OverlayChatWidgetV2.UpdateButtonUI();
        }
    };

    OverlayChatWidgetV2.Pop = function(_type,_params){
        _type = (typeof _type != 'undefined') ? _type : lz_session.OVLWMSElem;
        var url = lz_poll_server;
        var fullscreen=false;

        if(_type == 'knowledgebase')
        {
            url += 'knowledgebase.php';
            url += "?etc=" + lz_global_base64_url_encode(lz_color_secondary);
            url += "&linkid=" + lz_global_base64_url_encode(lz_code_id);
            if(LiveZillaData.Language.length)
                url += "&ptl=" + LiveZillaData.Language;
            url += "&ckf=" + lz_kb_root;
            fullscreen = true;
        }
        else
        {
            url += 'chat.php?v=2&linkid=' + lz_global_base64_url_encode(lz_code_id);
            if(typeof OverlayChatWidgetV2 != 'undefined' && OverlayChatWidgetV2.__PublicGroupChat.length)
                url += '&pgc=' + OverlayChatWidgetV2.__PublicGroupChat;
        }

        if(typeof _params != 'undefined')
            url += _params;

        OverlayChatWidgetV2.OpenWindow(url,fullscreen);
    };

    OverlayChatWidgetV2.OpenWindow = function(_url,_fullscreen){
        if(_fullscreen)
            window.open(_url,'LiveZilla');
        else
        {
            var width = (typeof OverlayChatWidgetV2 != 'undefined' && OverlayChatWidgetV2.__PublicGroupChat.length) ? Math.max(lz_window_width,600) : lz_window_width;
            window.open(_url,'LiveZilla','width='+width+',height='+lz_window_height+',left=50,top=50,resizable=yes,menubar=no,location=no,status=yes,slidebars=no');
        }
    };

    OverlayChatWidgetV2.Show = function(_playSound){

        OverlayChatWidgetV2.Open(_playSound);
    };

    OverlayChatWidgetV2.Hide = function(){
        lz_chat_hide();
    };

    OverlayChatWidgetV2.InputKeyUp = function(event){

        if(event != null && event.keyCode == 13)
        {
            if(lz_session.OVLWMState == '0' && !lz_check_missing_inputs(true) && !OverlayChatWidgetV2.IsChatActive())
            {
                OverlayChatWidgetV2.Show(false);
            }
            else if(!event.ctrlKey)
            {
                if(!OverlayChatWidgetV2.IsChatActive())
                {
                    OverlayChatWidgetV2.ChatInitiated = true;
                }

                OverlayChatWidgetV2.SendMessage(null,null);
            }
        }
        else
            lz_chat_switch_extern_typing(true);

        OverlayChatWidgetV2.UpdateChatInputUI();
    };

    OverlayChatWidgetV2.AddSystemMessage = function(_text){

        var div = document.createElement('div');
        var divinner = document.createElement('div');

        divinner.className = 'lz_overlay_chat_status_inner';
        divinner.innerHTML =_text;

        div.appendChild(divinner);

        document.getElementById('lz_chat_content_inlay').appendChild(div);

        lz_chat_last_poster = "SYS";
    };

    OverlayChatWidgetV2.AddParameters = function(){

        var params = "",i;
        if(OverlayChatWidgetV2.CurrentOperator != null)
            params += "&op=" + lz_global_base64_url_encode(OverlayChatWidgetV2.CurrentOperator.Id);

        if(OverlayChatWidgetV2.MessageSneakPeek && document.getElementById('lz_chat_text') != null)
            params += "&typ=" + lz_global_base64_url_encode(lz_global_trim(document.getElementById('lz_chat_text').value));
        else if(lz_external.Typing)
            params += "&typ=MQ__";

        if(lz_chat_full_load && !lz_chat_declined)
            params += "&full=1";

        if(lz_leave_chat)
            params += "&clch=MQ__";

        if(lz_chat_init_feedback)
        {
            lz_chat_init_feedback = false;
            params += "&ovlif=MQ__";
        }

        if(OverlayChatWidgetV2.AcceptCR)
        {
            OverlayChatWidgetV2.AcceptCR = false;
            params += "&accreq=MQ__";
        }
        else if(OverlayChatWidgetV2.DeclineCR)
        {
            OverlayChatWidgetV2.DeclineCR = false;
            params += "&decreq=MQ__";
        }

        if(lz_chat_kb_search_phrase != "")
            params += "&skb=" + lz_global_base64_url_encode(lz_chat_kb_search_phrase);

        if(lz_chat_status_change)
            params += "&sc=1";

        if(!lz_leave_chat)
        {
            if(OverlayChatWidgetV2.__NoBotChat)
                params += "&tth=MQ__";

            if(OverlayChatWidgetV2.ChatInitiated)
                params += "&ic=MQ__";
        }

        if(lz_overlay_chat != null && lz_overlay_chat.m_FullScreenMode)
            params += "&hinv=MQ__";

        if(OverlayChatWidgetV2.TargetOperatorId != null)
        {
            params += "&operator=" + encodeURIComponent(OverlayChatWidgetV2.TargetOperatorId);
        }

        if(OverlayChatWidgetV2.TargetGroupId != null)
        {
            params += "&eg=" + encodeURIComponent(OverlayChatWidgetV2.TargetGroupId);
        }
        else if(OverlayChatWidgetV2.__CurrentGroup != null)
        {
            params += "&eg=" + encodeURIComponent(OverlayChatWidgetV2.__CurrentGroup.Id);
        }

        if(lz_force_monitoring)
            params += "&fm=MQ__";

        if(OverlayChatWidgetV2.ChatStarted && lz_chat_status==0)
            LiveZillaData.WriteToServer = true;

        if(LiveZillaData.WriteToServer && LiveZillaData.InputFieldValues != null)
        {
            for(i=0;i<LiveZillaData.InputFieldValues.length;i++)
                if(LiveZillaData.InputFieldValues[i].Type != "File" && LiveZillaData.InputFieldValues[i].Value != '')
                    params += "&f" + LiveZillaData.InputFieldValues[i].Index +"="+ lz_global_base64_url_encode(LiveZillaData.InputFieldValues[i].Value);

            if(lz_session.OVLWMSElem == 'chat')
                params += "&tc=" + lz_global_base64_url_encode(lz_session.Transcript.toString());

            LiveZillaData.WriteToServer = false;
        }

        if(lz_ticket != null)
        {
            params += "&tid=" + lz_global_base64_url_encode(lz_ticket);
            params += "&cmb=" + lz_global_base64_url_encode(lz_session.OVLWMSElem == "phone" ? '1' : '0');
            lz_ticket = null;
        }

        lz_chat_status_change = false;
        if(OverlayChatWidgetV2.__LastPostReceived != null)
        {
            params += "&lpr=" + lz_global_base64_url_encode(OverlayChatWidgetV2.__LastPostReceived);
            if(OverlayChatWidgetV2.__IsPostStatusUpdate || (OverlayChatWidgetV2.__IsWaitingForNotice && OverlayChatWidgetV2.__PostsNoticed))
            {
                params += "&lps=" + lz_global_base64_url_encode(OverlayChatWidgetV2.__PostsNoticed ? '2' : '1');
                OverlayChatWidgetV2.__IsPostStatusUpdate = false;
                OverlayChatWidgetV2.__IsWaitingForNotice = !OverlayChatWidgetV2.__PostsNoticed;
            }
        }

        if(lz_chat_last_message_received != null)
            params += "&lmr=" + lz_global_base64_url_encode(lz_chat_last_message_received);
        if(lz_chat_last_poster != null)
            params += "&lp=" +lz_global_base64_url_encode(lz_chat_last_poster);

        var count=0;
        for(i=0;i<lz_external.MessagesSent.length;i++)
            if(!lz_external.MessagesSent[i].Received)
                params+="&mi" + count.toString() + "=" + lz_global_base64_url_encode(lz_external.MessagesSent[i].MessageId) + "&mp" + (count).toString() + "=" + lz_global_base64_url_encode(lz_external.MessagesSent[i].MessageText.substr(0,600))+ "&mpt" + (count).toString() + "=" + lz_global_base64_url_encode(lz_external.MessagesSent[i].MessageTranslationText.substr(0,600))+ "&mpti" + (count++).toString() + "=" + lz_global_base64_url_encode((lz_session.TransFrom!=null)?lz_session.TransFrom:"");

        if(OverlayChatWidgetV2.__PublicGroupChat.length)
            params += "&pgc="+OverlayChatWidgetV2.__PublicGroupChat;

        return params;
    };

    OverlayChatWidgetV2.CaptureScreen = function(_delayed, _find, _stream){

        if(lz_session.OVLWMSElem == 'chat' && lz_session.OVLWMState == '0' && !lz_check_missing_inputs(true) && !OverlayChatWidgetV2.IsChatActive())
        {
            OverlayChatWidgetV2.Show(false);
            return;
        }

        if(!_stream && lz_session.OVLWMSElem == 'chat' && lz_chat_status == 0)
        {
            OverlayChatWidgetV2.ScreenCaptureToStartChat = true;
            OverlayChatWidgetV2.StartChat();
            return;
        }

        if(!_delayed)
        {
            setTimeout(function(){
                OverlayChatWidgetV2.CaptureScreen(true, _find, _stream);
            },200);
            return;
        }

        if(!_stream)
        {
            var vis_cw = lz_overlay_chat != null && lz_overlay_chat.IsVisible();
            var vis_pp = OverlayChatWidgetV2.PostPreview != null && OverlayChatWidgetV2.PostPreview.IsVisible();
            var vis_wm = lz_overlay_wm != null && lz_overlay_wm.IsVisible();

            if(vis_cw)
                lz_overlay_chat.SetVisible(false);
            if(vis_pp)
                OverlayChatWidgetV2.PostPreview.SetVisible(false);
            if(vis_wm)
                lz_overlay_wm.SetVisible(false);
        }

        var screenshot = document.body.cloneNode(true);
        var i,y,flist = [];
        var fields = document.querySelectorAll('input, textarea, select');

        for(i=0;i<fields.length;i++)
        {
            if(lz_d(fields[i].value) && fields[i].value.length)
            {
                if(lz_d(fields[i].id) && fields[i].id.toString().length)
                {
                    flist.push({value:fields[i].value});
                    flist[flist.length-1].id=fields[i].id;
                }
                else if(lz_d(fields[i].name) && fields[i].name.toString().length)
                {
                    flist.push({value:fields[i].value});
                    flist[flist.length-1].name=fields[i].name;
                }
            }
        }

        var unwIds = ['lvztr','lz_r_scr','lz_overlay'];
        fields = screenshot.querySelectorAll('div, script');
        for(i=0;i<fields.length;i++)
        {
            for(y=0;y<unwIds.length;y++)
            {
                if(fields[i].id.indexOf(unwIds[y]) === 0)
                    fields[i].parentNode.removeChild(fields[i]);
            }
        }

        var blob = new Blob([screenshot.innerHTML], {
            type: 'text/html'
        });

        var reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = function() {

            OverlayChatWidgetV2.Screenshot = reader.result + '|||' + lz_global_base64_encode(window.location.href) + '|||' + lz_global_base64_encode(JSON.stringify(flist));
            OverlayChatWidgetV2.Screenshot += '|||' + lz_global_get_window_width() + '|||' + lz_global_get_window_height();
            OverlayChatWidgetV2.Screenshot += '|||' + lz_global_get_page_offset_x() + '|||' + lz_global_get_page_offset_y();

            if(OverlayChatWidgetV2.MouseMoveEvent != null && lz_d(OverlayChatWidgetV2.MouseMoveEvent.clientX))
                OverlayChatWidgetV2.Screenshot += '|||' + OverlayChatWidgetV2.MouseMoveEvent.clientX + '|||' + OverlayChatWidgetV2.MouseMoveEvent.clientY;

            var params = 'form_userfile='+lz_global_base64_encode(OverlayChatWidgetV2.Screenshot);
            params += '&p_request=extern';
            params += '&p_action=file_upload';

            if(_stream)
                params += '&elem=chat';
            else
                params += '&elem=' + lz_session.OVLWMSElem;

            params += '&bid=' + lz_global_base64_url_encode(lz_session.BrowserId);
            params += '&gid=' + lz_global_base64_url_encode(OverlayChatWidgetV2.__CurrentGroup.Id);
            params += '&uid=' + lz_global_base64_url_encode(lz_session.UserId);

            if(!lz_d(_find))
                _find = -1;

            if(_stream)
                params += '&p_stream=1';

            params += '&find=' + lz_global_base64_url_encode(_find) + '&type=screenshot&fname=' + lz_global_base64_encode('screenshot.lzsc');

            if(lz_session.OVLWMSElem == 'chat' || _stream)
            {
                params += '&cid=' + lz_global_base64_url_encode(OverlayChatWidgetV2.__CurrentChatId);
            }
            else if(!_stream)
            {
                lz_load_inputs = true;
            }

            lz_post(lz_poll_server + 'upload.php?f=MQ__&ptl=' + LiveZillaData.Language,params,function(e)
            {
                if(!_stream)
                    LiveZilla.Engine.Poll(1021);
            });

            if(!_stream)
            {
                var felem = document.getElementById('lz_chat_flash');
                felem = document.createElement('div');
                felem.id = 'lz_chat_flash';
                document.body.appendChild(felem);

                var opacity = 1;
                var oi = setInterval(function(){
                    opacity -= .025;
                    felem.style.opacity = opacity;

                    if(opacity <= 0)
                    {
                        felem.parentNode.removeChild(felem);
                        clearInterval(oi);

                        if(vis_cw)
                            lz_overlay_chat.SetVisible(true);
                        if(vis_pp)
                            OverlayChatWidgetV2.PostPreview.SetVisible(true);
                        if(vis_wm)
                            lz_overlay_wm.SetVisible(true);

                        OverlayChatWidgetV2.Screenshot = null;
                        OverlayChatWidgetV2.ScrollDown(83754);
                    }
                },30);
            }
        };
    };

    OverlayChatWidgetV2.ShowCustomPage = function(_dtid){
        alert(_dtid);
    };

    OverlayChatWidgetV2.SetCustomURL = function(){
        document.getElementById('lz_overlay_module_custom').style.display='block';
        var url = lz_global_base64_url_decode(lz_chat_get_wm_element(lz_session.OVLWMSElem).href);

        var iframe = document.getElementById("lz_overlay_module_custom").getElementsByTagName("iframe")[0];

        if(!lz_d(iframe.dataset.curl))
            iframe.dataset.curl = '';

        if(iframe.dataset.curl != url)
        {
            iframe.dataset.curl = url;
            iframe.src = url;
        }
        document.getElementById("lz_overlay_module_custom").getElementsByTagName("h2")[0].innerHTML = lz_global_base64_url_decode(lz_chat_get_wm_element(lz_session.OVLWMSElem).title);
    };

    OverlayChatWidgetV2.AnswerChatRequest = function (_result,_poll){

        _result = lz_d(_result) ? _result : false;

        if(_result)
            OverlayChatWidgetV2.AcceptCR = true;
        else
            OverlayChatWidgetV2.DeclineCR = true;

        if(_poll)
        {
            LiveZilla.Engine.Poll(34912);
        }
    };

    OverlayChatWidgetV2.UpdateChatInputUI = function(){

        var height=parseInt(document.getElementById('lz_chat_text').style.height.replace('px','')),elem = document.getElementById('lz_chat_text');
        if(isNaN(height))
            height=50;

        if (elem.clientHeight < elem.scrollHeight)
        {
            height += 22;
            elem.style.height = height + 'px';

        }
        else if(document.getElementById('lz_chat_text').value == '')
        {
            height = 50;
            elem.style.height = height + 'px';
        }

        document.getElementById('lz_chat_text_send').style.display = (document.getElementById('lz_chat_text').value.length > 0) ? 'block' : 'none';
        document.getElementById('lz_chat_text_file').style.right = OverlayChatWidgetV2.IsFunction('ss') ? '40px' : '10px';
        document.getElementById('lz_chat_text_send').style.right = (OverlayChatWidgetV2.IsFunction('ss') && OverlayChatWidgetV2.IsFunction('fu') ? '70px' : (OverlayChatWidgetV2.IsFunction('ss') || OverlayChatWidgetV2.IsFunction('fu') ? '40px' : '10px'));
        document.getElementById('lz_chat_text_file').style.display = OverlayChatWidgetV2.IsFunction('fu') ? "block" : 'none';
        document.getElementById('lz_chat_text_sc').style.display = OverlayChatWidgetV2.IsFunction('ss') ? "block" : 'none';
        document.getElementById('lz_chat_overlay_info').style.bottom = (15+height+'px');
        document.getElementById("lz_chat_members_box").style.bottom =
        document.getElementById("lz_chat_content_box").style.bottom = (OverlayChatWidgetV2.__Connecting) ? (56+height+'px') : (16+height+'px');
        document.getElementById("lz_chat_overlay_info").style.display = (OverlayChatWidgetV2.__Connecting) ? "block" : 'none';

        if(document.getElementById('lz_overlay_preview_tctrl') != null)
            document.getElementById('lz_overlay_preview_tctrl').style.height = 10+height+'px';
        document.getElementById('lz_chat_overlay_bottom').style.height = 10+height+'px';
    };

    OverlayChatWidgetV2.ScrollDown = function(_cll){
        setTimeout(function(){
            if(document.getElementById('lz_chat_content_box')!=null)
                document.getElementById('lz_chat_content_box').scrollTop = document.getElementById('lz_chat_content_box').scrollHeight;
        },100);
    };

    OverlayChatWidgetV2.RemoveInvite = function(_id){
        var mes = document.getElementById(_id);
        if(mes != null)
        {
            if(lz_session.OVLWMState == '0')
                mes.parentNode.parentNode.removeChild(mes.parentNode);
            else
                mes.parentNode.removeChild(mes);
        }
    };

    OverlayChatWidgetV2.ShowWaitingMessage = function(_html){
        if(lz_chat_status < 2)
            OverlayChatWidgetV2.AddMessages(lz_global_base64_encode(JSON.stringify([
                [_html, 'WAIM']
            ])), false, null, null, "sys");
    };

    OverlayChatWidgetV2.SetConnectionState = function(_connecting,_id,_waitingHTML,_waitingDelay){

        if(_id != null)
            lz_external.Id = _id;

        if(_connecting && LiveZillaData.TimerWaiting==null && _waitingHTML != null)
            LiveZillaData.TimerWaiting = setTimeout(function(){
                OverlayChatWidgetV2.ShowWaitingMessage(_waitingHTML);
            },_waitingDelay*1000);
        else if(!_connecting && LiveZillaData.TimerWaiting != null)
        {
            clearTimeout(LiveZillaData.TimerWaiting);
            LiveZillaData.TimerWaiting = null;
        }

        OverlayChatWidgetV2.__Connecting = _connecting;

        if(_connecting)
        {
            lz_chat_set_typing(null,false);
        }

        OverlayChatWidgetV2.UpdateChatInputUI();
    };
}