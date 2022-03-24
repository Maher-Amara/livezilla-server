LiveZilla = function(){};

LiveZilla.OptInCookie = false;
LiveZilla.OptOutCookie = false;
LiveZilla.OptOutTrack = false;
LiveZilla.CaptureStreamCurrentURL = null;
LiveZilla.CaptureStreamCurrentBL = 0;

LiveZilla.OptInCookies = function(){
    LiveZilla.OptInCookie = true;
    LiveZilla.Engine.Poll(5371);
};

LiveZilla.OptOutCookies = function(){
    LiveZilla.OptOutCookie = true;
    LiveZilla.Engine.Poll(5372);
};

LiveZilla.OptOutTracking = function(){
    LiveZilla.OptOutTrack = true;
    LiveZilla.Engine.Poll(5373);
};

LiveZilla.ExecuteEvent = function(_id){
    lz_event_fire(_id);
};

LiveZilla.SetData = function(_object){
    lz_data = _object;
    LiveZilla.Engine.Poll(5374);
};

LiveZilla.Engine = function(){};

LiveZilla.Engine.UpdateTextLinks = function(_online){
    var links = document.getElementsByTagName("a");
    for(var i=0;i<links.length;i++)
    {
        if(links[i].className=="lz_text_link")
        {
            links[i].innerHTML = _online ? links[i].getAttribute('data-text-online') : links[i].getAttribute('data-text-offline');
            links[i].style.cssText = _online ? links[i].getAttribute('data-css-online') : links[i].getAttribute('data-css-offline');
            links[i].style.display = _online || links[i].getAttribute('data-online-only')=='0' ? 'inline' : 'none';
        }
    }
};

LiveZilla.Engine.UpdateButtons = function(){
    var links = document.getElementsByTagName("a");
    var lcount = 0;
    for(var i=0;i<links.length;i++)
    {
        if(links[i].className=="lz_cbl" || links[i].className=="lz_fl")
        {
            if(lz_cb_url.length<=lcount)
                lz_cb_url[lcount] = links[i].childNodes[0].src;
            links[i].childNodes[0].src = lz_cb_url[lcount] + "&cb=" + new Date().getTime();
            lcount++;
        }
    }
};

LiveZilla.Engine.AddPassThruParameters = function(_getValues){

    var val,standardKeys = [111,112,113,114,116];

    for(var key in standardKeys)
        _getValues += LiveZilla.Engine.AddPassThruParameter(_getValues,standardKeys[key]);

    for(var i=0;i<10;i++)
        _getValues += LiveZilla.Engine.AddPassThruParameter(_getValues,i);

    var isOverwrite = lz_d(lz_data['overwrite']) && lz_data['overwrite'];

    if(isOverwrite)
    {
        val = '&pto=true';
        if(_getValues.indexOf(val) == -1)
            _getValues += val;
    }

    if(lz_d(lz_data['header']))
    {
        val = '&pth=' + encodeURIComponent(lz_data['header']);
        if(_getValues.indexOf(val) == -1)
            _getValues += val;
    }

    if(LiveZillaData.Language.length>0)
        _getValues += "&ptl="+LiveZillaData.Language;
    else if(lz_d(lz_data['language']))
    {
        val = '&ptl=' + encodeURIComponent(lz_data['language']);
        if(_getValues.indexOf(val) == -1)
            _getValues += val;
    }

    if(LiveZillaData.AreaCode.length>0)
        _getValues += "&ptw="+encodeURIComponent(lz_global_base64_decode(LiveZillaData.AreaCode));
    else if(lz_d(lz_data['website']))
    {
        val = '&ptw=' + encodeURIComponent(lz_data['website']);
        if(_getValues.indexOf(val) == -1)
            _getValues += val;
    }

    if(lz_d(lz_data['textlink']))
        _getValues += "&ctl=1";

    if(lz_d(lz_data['group']))
    {
        val = '&group=' + encodeURIComponent(lz_data['group']);
        if(_getValues.indexOf(val) == -1)
            _getValues += val;
    }

    return _getValues;
};

LiveZilla.Engine.AddPassThruParameter = function(_paramList,_key){

    var val = '',found=false;
    var isOverwrite = lz_d(lz_data['overwrite']) && lz_data['overwrite'];

    if(lz_d(LiveZillaData['F' + _key]) && LiveZillaData['F' + _key] != "")
    {
        val = LiveZillaData['F' + _key];
        found = true;
    }

    if(lz_d(lz_data[_key]) && (!found || (lz_d(lz_data['overwrite']) && lz_data['overwrite'])))
    {
        val = lz_global_base64_url_encode(lz_data[_key]);
    }

    if((lz_chat_get_input_value(_key) == "" || isOverwrite) && val != "")
    {
        var addKey = "&f" + _key + "=" + encodeURIComponent(val);
        if(_paramList.indexOf(addKey) == -1)
            return addKey;
    }
    return "";
};

LiveZilla.Engine.Callback = function(_freq){

    if(lz_poll_frequency != _freq)
    {
        lz_poll_frequency = _freq;
        clearTimeout(lz_timer);
        lz_timer = setTimeout(function(){LiveZilla.Engine.Poll(8846);},(lz_poll_frequency*1000));
    }

    if(lz_timer_connection_error != null)
        clearTimeout(lz_timer_connection_error);

    if(!lz_stopped)
        lz_timer_connection_error = setTimeout(function(){LiveZilla.Engine.Callback(_freq);},30 * 1000);

    lz_tracking_remove_script("livezilla_pollscript");

    if(lz_poll_required)
    {
        lz_tracking_server_request(lz_poll_required,"livezilla_pollscript");
        lz_poll_required = false;
        //LiveZilla.Engine.Poll(1123);
    }

    LiveZilla.Engine.UpdateButtons();
};

LiveZilla.Engine.ApplyScreenCapture = function(_body, _fields, _sx, _sy, _mx, _my, _url, _stream){

    if(LiveZilla.CaptureStreamCurrentURL == null)
        LiveZilla.CaptureStreamCurrentURL = _url;
    else if(LiveZilla.CaptureStreamCurrentURL != _url)
    {
        window.location.href = _url;
        return;
    }

    function __dataURLToBlob(dataURL)
    {
        var BASE64_MARKER = ";base64,";
        var parts = dataURL.split(BASE64_MARKER);
        var contentType = parts[0].split(":")[1];
        var raw = window.atob(parts[1]);
        var rawLength = raw.length;
        var uInt8Array = new Uint8Array(rawLength);
        for (var i = 0; i < rawLength; ++i)
            uInt8Array[i] = raw.charCodeAt(i);
        return new Blob([uInt8Array], {type: contentType});
    }

    var reader = new FileReader();
    reader.onloadend = function() {

        var div = null;
        if(document.getElementById('capscpnt') == null)
        {
            div = document.createElement('div');
            div.id='capscpnt';
            div.style.background = 'red';
            div.style.width = '30px';
            div.style.height = '30px';
            div.style.position = 'absolute';
            div.style.borderRadius = '50%';
            div.style.opacity = '.9';
            div.style.transition = 'all 2s ease 0s';
            div.style.zIndex = 2147483647;
        }
        else
            div = document.getElementById('capscpnt');

        if(LiveZilla.CaptureStreamCurrentBL != reader.result.length)
            document.body.innerHTML = reader.result;

        LiveZilla.CaptureStreamCurrentBL = reader.result.length;

        var i,blockelemx = document.body.querySelectorAll('*');
        for(i=0;i<blockelemx.length;i++)
        {
            var blockelem = blockelemx[i];
            blockelem.style.pointerEvents = 'none';
            blockelem.style.webkitUserSelect = 'none';
            blockelem.style.mozUserSelect = 'none';
            blockelem.style.msUserSelect = 'none';
            blockelem.style.oUserSelect = 'none';
            blockelem.style.userSelect = 'none';
        }

        var elems = document.querySelectorAll('input, textarea, select');
        var fields = JSON.parse(lz_global_base64_decode(_fields));

        for(i=0;i<elems.length;i++)
        {
            for(var y=0;y<fields.length;y++)
            {
                if(lz_d(fields[y].id) && elems[i].id == fields[y].id)
                    elems[i].value = fields[y].value;
                else if(lz_d(fields[y].name) && elems[i].name == fields[y].name)
                    elems[i].value = fields[y].value;
            }
        }

        if(_mx > -1)
        {
            if(_stream)
            {
                document.body.appendChild(div);

                setTimeout(function(){
                    div.style.top = (parseInt(_my)+parseInt(_sy)) + 'px';
                    div.style.left = (parseInt(_mx)+parseInt(_sx)) + 'px';
                },50);

                window.scroll({
                    top: _sy,
                    left: _sx,
                    behavior: 'smooth'
                });
            }
            else
                window.scrollTo(_sx,_sy);
        }
    };
    reader.readAsText(__dataURLToBlob(_body));
};

LiveZilla.Engine.Stop = function(_code){
    lz_stopped = true;
    lz_tracking_remove_overlay_chat();
    lz_tracking_remove_script("livezilla_pollscript");
    if(_code==1242)
    {
        window.name = '';
        location.reload();
    }
};

LiveZilla.Engine.SetID = function(_userId, _browId, _datId){
    lz_session.UserId = lz_global_base64_decode(_userId);
    lz_session.BrowserId = lz_global_base64_decode(_browId);
    lz_session.Save();
    lz_data_id = lz_global_base64_decode(_datId);
};

LiveZilla.Engine.AddChatWidget = function(_template,_text,_width,_height,_ml,_mt,_mr,_mb,_position,_br){

    if(typeof lz_ovlel_classic != 'undefined')
    {
        OverlayChatWidgetV2.__ModeClassic = !lz_ovlel_fsm && !lz_is_mobile;

        if(!OverlayChatWidgetV2.__ModeClassic)
            _mb = 30;
    }

    if(typeof lz_ovlel_api != 'undefined')
        OverlayChatWidgetV2.__ModeAPI = true;

    if(lz_ovlel.length==1 && !OverlayChatWidgetV2.__ModeAPI)
        return;

    lz_header_text = lz_global_base64_decode(_text);
    if(lz_overlay_chat == null && lz_overlays_possible)
    {
        if(lz_chat_get_wm_element('phone') != null)
            if(lz_chat_get_wm_element('phone').inbound != false && lz_chat_get_wm_element('phone').outbound != false)
                if(_height < 720)
                    _height = 720;

        var heightDistance = 20;

        OverlayChatWidgetV2.ButtonTexts = lz_text_wm_s;

        OverlayChatWidgetV2.__ModeSingle =
            OverlayChatWidgetV2.__ModeClassic ||
                (lz_ovlel.length==2) ||
                (lz_ovlel.length==3 && lz_chat_get_wm_element('chat') != null && lz_chat_get_wm_element('ticket') != null && !lz_ticket_when_online);

        if(OverlayChatWidgetV2.__ModeSingle)
            heightDistance = 80;

        if(lz_global_get_window_width()>0)
        {
            _height = Math.min(_height,lz_global_get_window_height()-(_mb+heightDistance));
            _width = Math.min(_width,lz_global_get_window_width());
        }

        lz_overlay_chat_height = _height;
        lz_overlay_chat_width =_width;

        _template = (lz_global_base64_decode(_template)).replace("<!--text-->",lz_header_text);
        _template = _template.replace("<!--lz_chat_switch_so-->",lz_get_icon('lz_chat_switch_so','toggle-off','',' lz_chat_overlay_toggle_icon'));
        _template = _template.replace("<!--lz_chat_switch_tr-->",lz_get_icon('lz_chat_switch_tr','toggle-off','',' lz_chat_overlay_toggle_icon'));
        _template = _template.replace("<!--lz_chat_switch_et-->",lz_get_icon('lz_chat_switch_et','toggle-off','',' lz_chat_overlay_toggle_icon'));
        _template = _template.replace("<!--lz_chat_fb-->",lz_get_icon('lz_chat_feedback_init','thumbs-o-up','OverlayChatWidgetV2.ToggleFeedback(true);',''));
        _template = _template.replace("<!--lz_chat_ob-->",lz_get_icon('lz_chat_options_button','ellipsis-h','lz_chat_switch_options_table();lz_stop_propagation(evt);',''));
        _template = _template.replace("<!--lz_chat_min-->",lz_get_icon('lz_chat_overlay_minimize','times-circle','OverlayChatWidgetV2.SetMode(\'\',true);',''));
        _template = _template.replace("<!--lz_kb_mi-->",lz_get_icon('lz_chat_kb_match_close','times-circle','lz_chat_kb_deactivate(true,false);',''));
        _template = _template.replace("<!--lz_chat_co-->",lz_get_icon('lz_chat_overlay_options_close','times-circle','lz_chat_switch_options(lz_chat_option_function,false);',''));
        _template = _template.replace(/<!--lz_chat_req-->/g,lz_get_icon('','info-circle','',''));
        _template = _template.replace(/<!--lz_chat_fp-->/g,lz_get_icon('','plus-square','',' lz_chat_fill'));
        _template = _template.replace(/<!--lz_chat_sc-->/g,lz_get_icon('','camera','',' lz_chat_fill'));
        _template = _template.replace("<!--lz_chat_po-->",lz_get_icon('lz_chat_apo_icon','expand','OverlayChatWidgetV2.Pop();',''));
        _template = _template.replace(/<!--brt-->/g,_br);
        _template = _template.replace(/<!--brb-->/g,(OverlayChatWidgetV2.__ModeClassic && _mb==0) ? 0 : _br);
        _template = _template.replace("<!--lz_chat_button_send-->",lz_get_icon('lz_chat_text_send','send','OverlayChatWidgetV2.InputKeyUp({keyCode:13,ctrlKey:false});lz_chat_set_focus();lz_stop_propagation(evt);',''));
        _template = _template.replace("<!--lz_chat_button_file-->",lz_get_icon('lz_chat_text_file','clip','OverlayChatWidgetV2.InitFileUpload();',''));
        _template = _template.replace("<!--lz_chat_button_sc-->",lz_get_icon('lz_chat_text_sc','camera','OverlayChatWidgetV2.CaptureScreen();lz_stop_propagation(evt);',''));

        OverlayChatWidgetV2.Margin[1] = (_mr + 2);
        OverlayChatWidgetV2.Margin[2] =(_mb + 6);

        if(OverlayChatWidgetV2.__ModeClassic)
        {
            OverlayChatWidgetV2.Margin[1] = _mr;
            OverlayChatWidgetV2.Margin[2] = _mb;
        }
        else if(OverlayChatWidgetV2.__ModeAPI)
            OverlayChatWidgetV2.Margin[1] += 0;
        else if(OverlayChatWidgetV2.__ModeTextInline && !OverlayChatWidgetV2.__ModeSingle)
            OverlayChatWidgetV2.Margin[1] += OverlayChatWidgetV2.GetWMWidth() + 15;
        else if(!OverlayChatWidgetV2.__ModeSingle)
            OverlayChatWidgetV2.Margin[1] += OverlayChatWidgetV2.__SizeWidth + 15;
        else
            OverlayChatWidgetV2.Margin[2] += OverlayChatWidgetV2.__SizeHeight + Math.floor(17*OverlayChatWidgetV2.__Ratio);

        var tm = (lz_ovlel_fsm) ? ((OverlayChatWidgetV2.__ModeSingle) ? 0 : Math.floor(48*OverlayChatWidgetV2.__Ratio)) : 0;

        lz_overlay_chat = new lz_livebox_v2("lz_overlay_chat",_template,lz_overlay_chat_width,_height,_ml,tm,OverlayChatWidgetV2.Margin[1],OverlayChatWidgetV2.Margin[2],_position,(lz_ovlel_fsm) ? document.getElementById('lz_chat_fs_body') : document.body);
        lz_overlay_chat.m_AutoScaleMode = false;

        if(lz_ovlel_fsm)
        {
            document.getElementById('lz_chat_apo').style.display='none';
            document.getElementById('lz_chat_overlay_main').style.border=0;
            document.getElementById('lz_chat_overlay_main').style.boxShadow='none';
            document.getElementById('lz_chat_feedback_init').style.right='10px';
            document.getElementById('lz_chat_feedback_init').style.left='auto';

            if(lz_d(lz_data) && lz_d(lz_data.header))
                document.getElementById('lz_chat_fs_logo_left').firstChild.src=lz_data.header;
            else
                document.getElementById('lz_chat_fs_logo_left').firstChild.src=lz_comp_logo;

            lz_overlay_chat.SetFullscreenMode(true);
            lz_session.OVLWMState ='1';
        }
        else if(lz_is_mobile)
        {
            lz_session.OVLWMState='0';
            lz_session.OVLWMSElem = '';
        }
        else if(OverlayChatWidgetV2.__ModeClassic)
        {
            var ccntr = document.createElement('div');
            ccntr.id='livezilla_c_chat';
            ccntr.className = 'lz_overlay_c';
            ccntr.style.display = 'none';
            document.getElementById("lz_chat_overlay_main").appendChild(ccntr);
        }

        if(!lz_is_mobile || lz_overlay_chat.m_FullScreenMode)
        {
            if(lz_overlay_chat.m_FullScreenMode || (lz_session.OVLWMState=='1' && lz_session.OVLWMSElem != 'wm' && lz_session.OVLWMSElem.length))
                lz_overlay_chat.SetVisible(true);
            else if(OverlayChatWidgetV2.__ModeClassic && !OverlayChatWidgetV2.__ModeAPI)
            {
                lz_overlay_chat.SetVisible(true);
                OverlayChatWidgetV2.Minimize();
            }
        }

        lz_overlay_chat.m_FrameElement.style.zIndex = (OverlayChatWidgetV2.__ModeSingle) ?  lz_overlay_zindex+1 : lz_overlay_zindex;
        document.getElementById('lz_chat_data_form').style.zIndex = '+1000';
        document.getElementById('lz_chat_overlay_options_box_bg').style.zIndex = '+2000';
        document.getElementById('lz_chat_options_table').style.zIndex = '+3000';
        document.getElementById('lz_chat_overlay_options_frame').style.zIndex = '+4000';
        document.getElementById('lz_chat_overlay_options_close').getElementsByTagName('path')[0].setAttribute('d',lz_get_icon_path('times-circle'));
        document.getElementById('lz_chat_overlay_minimize').getElementsByTagName('path')[0].setAttribute('d',lz_get_icon_path('times-circle'));
        lz_overlay_chat.m_FrameElement.style.overflow = "visible";
    }
};

LiveZilla.Engine.Poll = function(_cll,_fullDataRequired){

    try
    {
        var getValues = "&tv=2.3.1.3&b="+lz_global_base64_url_encode(lz_session.BrowserId)+"&pc="+lz_global_base64_url_encode(++lz_poll_id);

        getValues += (lz_session.UserId != null) ? "&i="+ lz_global_base64_url_encode(lz_session.UserId) : "";

        if(lz_referrer.length>0)
            getValues += "&rf="+lz_global_base64_url_encode(lz_referrer);

        getValues = LiveZilla.Engine.AddPassThruParameters(getValues);

        //getValues += "&cll=" + _cll;

        if(lz_data_id != null)
            getValues += "&di=" + lz_data_id;

        if(lz_poll_id<=3 || _fullDataRequired)
        {
            getValues += "&cd="+lz_global_base64_url_encode(window.screen.colorDepth)+"&rh="+lz_global_base64_url_encode(screen.height)+"&rw="+lz_global_base64_url_encode(screen.width)+"&tzo="+lz_global_base64_url_encode(lz_timezone_offset);
            if(lz_geo_resolution_needed && lz_session.GeoResolved.length == 7)
                getValues += "&geo_lat=" + lz_session.GeoResolved[0] + "&geo_long=" + lz_session.GeoResolved[1] + "&geo_region=" + lz_session.GeoResolved[2] + "&geo_city=" + lz_session.GeoResolved[3] + "&geo_tz=" + lz_session.GeoResolved[4] + "&geo_ctryiso=" + lz_session.GeoResolved[5] + "&geo_isp=" + lz_session.GeoResolved[6];
            if(lz_geo_resolution != null && lz_geo_resolution.Span > 0)getValues += "&geo_ss=" + lz_geo_resolution.Span;
        }

        var title = document.title;
        if(title.length > 60)
            title = title.substring(0,60)+"...";

        getValues += "&dc="+lz_global_base64_url_encode(title);
        getValues += "&ue="+lz_global_base64_url_encode(lz_global_base64_url_encode(window.location.href));

        if(LiveZilla.OptInCookie)
            getValues += "&oica=1";

        if(LiveZilla.OptOutCookie)
            getValues += "&ooca=1";

        if(LiveZilla.OptOutTrack)
            getValues += "&ntca=1";

        if(LiveZillaData.PassThruParameters.length > 0)
            getValues += "&" + lz_global_base64_decode(LiveZillaData.PassThruParameters);

        if(typeof OverlayChatWidgetV2 != 'undefined' && lz_overlay_chat_available)
        {
            getValues += OverlayChatWidgetV2.AddParameters();
        }

        if(lz_deactivate != null)getValues += "&deactr=" + lz_global_base64_url_encode(lz_deactivate);
        if(lz_init_floating_selector != null)
        {
            lz_stopped = false;
            getValues += "&ifs=1";
            if(lz_init_floating_selector[0]) getValues += "&ifs_oc=MQ_";
            if(lz_init_floating_selector[1]) getValues += "&ifs_opi=MQ_";
            if(lz_init_floating_selector[1]) getValues += "&ifs_pin=" + lz_init_floating_selector[2];
            if(lz_init_floating_selector[1]) getValues += "&ifs_pii=" + lz_init_floating_selector[3];
            if(lz_init_floating_selector[4]) getValues += "&ifs_opo=MQ_";
            if(lz_init_floating_selector[5]) getValues += "&ifs_ot=MQ_";
            if(lz_init_floating_selector[6]) getValues += "&ifs_okb=MQ_";
            getValues += "&ifs_osf=" + lz_init_floating_selector[7];
            getValues += "&ifs_ost=" + lz_init_floating_selector[8];
            getValues += "&ifs_osg=" + lz_init_floating_selector[9];
            if(lz_init_floating_selector[10]) getValues += "&ifs_cl1=" + lz_init_floating_selector[10];
            if(lz_init_floating_selector[11]) getValues += "&ifs_cl2=" + lz_init_floating_selector[11];
            if(lz_init_floating_selector[12]) getValues += "&ifs_cl3=" + lz_init_floating_selector[12];
            getValues += "&ifs_cht=" + lz_init_floating_selector[13];
            getValues += "&ifs_add=" + lz_global_base64_url_encode(lz_init_floating_selector[14]);
        }

        if(lz_event_fire_id != null)
        {
            getValues += "&fe=" + lz_global_base64_url_encode(lz_event_fire_id);
            lz_event_fire_id = null;
            lz_stopped = false;
        }

        if(typeof OverlayChatWidgetV2 != 'undefined' && OverlayChatWidgetV2.RemoveAttachmentId != null)
        {
            getValues += "&tra=" + OverlayChatWidgetV2.RemoveAttachmentId;
            OverlayChatWidgetV2.RemoveAttachmentId = null;
            lz_load_inputs = true;
        }

        if(lz_load_inputs != null)
        {
            getValues += "&ri=MQ_";
            lz_load_inputs = null;
        }
    }
    catch(ex)
    {
        console.log(ex);
        //getValues += "&exception=" + lz_global_base64_url_encode(ex.message);
    }

    if(!lz_stopped)
    {
        lz_tracking_server_request(getValues,"livezilla_pollscript");
        clearTimeout(lz_timer);
        lz_timer = setTimeout(function(){LiveZilla.Engine.Poll(42274);},(lz_poll_frequency*1000));
    }
};

LiveZilla.Engine.Init = function(){

    if(typeof LiveZillaData == 'undefined' || !lz_resources[0] || !lz_resources[1] || !lz_resources[2] || (lz_overlay_chat_available && (!lz_resources[4])))
    {
        setTimeout(function(){LiveZilla.Engine.Init()}, 100);
        return;
    }

    if(location.hash.indexOf('#lzscrcap_') != -1)
    {
        var id = location.hash.split('#lzscrcap_')[1];
        var scr = document.createElement('script');
        scr.src = lz_poll_server + 'getfile.php?file=screenshot.lzsc&id='+id+'&lzscrcap=1';
        document.body.appendChild(scr);
        return;
    }
    else if(location.hash.indexOf('#lzscrcapstr_') != -1)
    {
        var captureStream = function(){
            if(document.getElementById('strupsc') != null)
                document.body.removeChild(document.getElementById('strupsc'));

            var dparts = location.hash.split('#lzscrcapstr_')[1];
            dparts = dparts.split('_');

            var scr = document.createElement('script');
            scr.id = 'strupsc';
            scr.src = lz_poll_server + 'getfile.php?userid='+dparts[0]+'&lzscrcapstr=1&browserid='+dparts[1]+'&token='+dparts[2];
            document.body.appendChild(scr);
        };
        captureStream();
        setInterval(captureStream, 4000);
        return;
    }

    if(typeof lz_data['language'] != 'undefined')
        LiveZillaData.Language = encodeURIComponent(lz_data['language']);

    lz_server_time_diff = (parseInt(lz_server_time)-parseInt(lz_global_timestamp()));
    lz_geo_resolution = new lz_geo_resolver();
    lz_session = new lz_jssess();

    lz_session.CookiePrefix = LiveZillaData.CookiePrefix;
    lz_session.Load();

    if(location.search.indexOf("lzcobrowse") != -1)
    {
        lz_session.Save();
        LiveZilla.Engine.Poll(3251);
        return;
    }

    try
    {
        if(window.opener != null && typeof(window.opener.lz_get_session) != 'undefined')
        {
            lz_session.UserId = window.opener.lz_get_session().UserId;
            lz_session.GeoResolved = window.opener.lz_get_session().GeoResolved;
        }
    }
    catch(ex)
    {
        // ACCESS DENIED
    }

    lz_session.Save();

    if(!lz_tracking_geo_resolute())
        LiveZilla.Engine.Poll(11121);

    if(lz_is_mobile && !lz_ovlel_fsm)
    {
        window.addEventListener("resize",lz_livebox_init_center_boxes_hide);
        window.addEventListener("scroll",lz_livebox_init_center_boxes_hide);
        window.setInterval("lz_livebox_init_center_boxes(false)",1000);
    }
};

if(typeof lz_referrer == 'undefined'){
    var lz_referrer = document.referrer;
    var lz_stopped = false;
    var lz_request_window = null;
    var lz_alert_window = null;
    var lz_overlay_box = null;
    var lz_overlay_chat = null;
    var lz_overlay_chat_height = 0;
    var lz_overlay_chat_width = 0;
    var lz_overlay_wm = null;
    var lz_floating_button = null;
    var lz_floating_button_selector = null;
    var lz_overlay_active = null;
    var lz_overlay_last = null;
    var lz_alert_active = null;
    var lz_chat_state_expanded = false;
    var lz_event_fire_id = null;
    var lz_session;
    var lz_poll_id = 0;
    var lz_timer = null;
    var lz_timezone_offset = (new Date().getTimezoneOffset() / 60) * -1;
    var lz_chat_windows = [];
    var lz_cb_url = [];
    var lz_document_head = document.getElementsByTagName("head")[0];
    var lz_poll_required = false;
    var lz_timer_connection_error = null;
    var lz_deactivate = null;
    var lz_force_monitoring = false;
    var lz_init_floating_selector = null;
    var lz_chat_fixed_mode = false;
    var lz_data_id = null;
    var lz_overlay_zindex = 20000000;
    var lz_load_inputs = true;
    var lz_server_time_diff = 0;

    if(typeof lz_ovlel_fsm == 'undefined')
        var lz_ovlel_fsm = false;

    if(typeof lz_ovlec == 'undefined')
        var lz_ovlec = null;

    if(typeof lz_ovlel_tm == 'undefined')
        var lz_ovlel_tm = 0;

    if(typeof lz_code_id == 'undefined')
        var lz_code_id = '';

    if(typeof lz_data == 'undefined')
        var lz_data = {};

    LiveZilla.Engine.Init();
}

function lz_is_geo_resolution_needed(){
	return (lz_geo_resolution_needed && lz_session.GeoResolved.length != 7 && lz_session.GeoResolutions < 3 && lz_geo_url.length);//5
}

function lz_get_session(){
	return lz_session;
}

function lz_tracking_server_request(_get,_scriptId){

	if(lz_stopped)
		return;

	var lastScript = document.getElementById(_scriptId);
	if(lastScript == null)
	{
		for(var index in lz_chat_windows)
			if(!lz_chat_windows[index].Deleted && lz_chat_windows[index].Closed)
			{
				lz_chat_windows[index].Deleted = true;
				_get += "&clch=" + lz_global_base64_encode(lz_chat_windows[index].BrowserId);
			}

		_get = "?rqst=track" + _get;
		var newScript = document.createElement("script");
		newScript.id = _scriptId;
		newScript.src = lz_poll_url + _get;
		newScript.async = true;
		lz_document_head.appendChild(newScript);
	}
	else
    {
		lz_poll_required = _get;
    }
}

function lz_tracking_remove_script(_id){

    var lastScript = document.getElementById(_id);
    if(lastScript != null)
        lz_document_head.removeChild(lastScript);
}

function lz_tracking_geo_result(_lat,_long,_region,_city,_tz,_ctryi2,_isp){
	lz_session.GeoResolved = [_lat,_long,_region,_city,_tz,_ctryi2,_isp];
	lz_session.Save();
	LiveZilla.Engine.Poll(1001);
}

function lz_tracking_set_geo_span(_timespan){
	lz_geo_resolution.SetSpan(_timespan);
}

function lz_tracking_geo_resolute(){

	if(lz_is_geo_resolution_needed())
	{
		lz_session.GeoResolutions++;
		lz_session.Save();
		lz_geo_resolution.SetStatus(1);
		if(lz_session.GeoResolutions < 2)
		{
			lz_geo_resolution.OnEndEvent = "lz_tracking_geo_result";
			lz_geo_resolution.OnSpanEvent = "lz_tracking_set_geo_span";
			lz_geo_resolution.OnTimeoutEvent = lz_tracking_geo_resolute;
			lz_geo_resolution.ResolveAsync();
		}
		else
			lz_tracking_geo_failure();
		return true;
	}
	else
	{
		lz_geo_resolution.SetStatus(7);
		return false;
	}
}

function lz_tracking_add_floating_button(_pos,_sh,_shblur,_shx,_shy,_shcolor,_ml,_mt,_mr,_mb,_width,_height){
	if (lz_floating_button!=null || lz_ovlel_fsm)
		return;
	var fbdiv = document.getElementById("chat_button_image");
	lz_floating_button = new lz_livebox("lz_floating_button",fbdiv.parentNode.parentNode.innerHTML,_width,_height,_ml,_mt,_mr,_mb,_pos,0,6);
	if(_sh)
		lz_floating_button.lz_livebox_shadow(_shblur,_shx,_shy,_shcolor);
    lz_floating_button.lz_livebox_create();
	lz_floating_button.lz_livebox_show(lz_overlay_zindex+1);
}

function lz_tracking_remove_floating_button(){
    if (lz_floating_button==null)
        return;
    document.getElementById('lz_floating_button').parentNode.removeChild(document.getElementById('lz_floating_button'));
    lz_floating_button = null;
}

function lz_tracking_init_floating_button_selector(_params){
    if(lz_floating_button_selector == null && _params != null)
    {
        lz_floating_button.lz_livebox_div.className = (lz_floating_button.lz_livebox_div.className+' cwait').replace(/ cdef/g,'');
        lz_init_floating_selector = _params;
        LiveZilla.Engine.Poll(1129);
    }
    else
    {
        lz_floating_button_selector.lz_livebox_close("lz_floating_button_selector");
        lz_init_floating_selector = lz_floating_button_selector = null;
    }
}

function lz_tracking_add_overlay_box(_olId,_html,_pos,_speed,_slide,_sh,_shblur,_shx,_shy,_shcolor,_ml,_mt,_mr,_mb,_width,_height,_bg,_bgcolor,_bgop,_br){
	if(!lz_ovlel_fsm && lz_request_window == null && lz_overlay_box == null && lz_overlays_possible && lz_overlay_last != _olId)
	{
        lz_overlay_last =
		lz_overlay_active = _olId;
		lz_overlay_box = new lz_livebox("lz_overlay_box",lz_global_base64_decode(_html),_width,_height,_ml,_mt,_mr+20,_mb,_pos,_speed,_slide);
        if(_sh)
			lz_overlay_box.lz_livebox_shadow(_shblur,_shx,_shy,'#'+_shcolor);
		if(_bg)
			lz_overlay_box.lz_livebox_background('#'+_bgcolor,_bgop);

        lz_overlay_box.lz_livebox_create();
		lz_overlay_box.lz_livebox_show(lz_overlay_zindex+3);
        lz_overlay_box.lz_livebox_div.style.borderRadius = _br + "px";

        if(_sh)
            lz_overlay_box.lz_livebox_div.style.background = "#FFFFFF";

        if(lz_fixed_mode_possible() && (_width> lz_global_get_window_width(true) || _height>lz_global_get_window_height() || lz_chat_fixed_mode))
        {
            lz_overlay_box.lz_livebox_fixed_mode = true;
            lz_overlay_box.lz_livebox_div.style.height = "auto";
            lz_overlay_box.lz_livebox_div.style.width= "auto";
            lz_overlay_box.lz_livebox_div.style.borderRadius = "0";
            lz_overlay_box.lz_livebox_div.style.position = "fixed";
            lz_overlay_box.lz_livebox_div.getElementsByTagName("div")[0].style.borderRadius="0";
            lz_overlay_box.lz_livebox_div.getElementsByTagName("div")[0].style.height="100%";
            lz_overlay_box.lz_livebox_div.getElementsByTagName("div")[0].style.width="100%";
            lz_overlay_box.lz_livebox_div.getElementsByTagName("div")[0].style.overflow="scroll";
        }
		window.focus();
	}
}

function lz_tracking_send_alert(_alertId,_text){
	if(lz_alert_active == null && lz_overlays_possible)
	{
        alert(lz_global_base64_decode(_text));
        lz_alert_active=null;
		window.focus();
	}
}

function lz_tracking_remove_buttons(){
    for (var i = 0;i<document.getElementsByTagName("a").length;i++)
        if(document.getElementsByTagName("a")[i].className=="lz_cbl")
            document.getElementsByTagName("a")[i].parentNode.removeChild(document.getElementsByTagName("a")[i]);
}

function lz_tracking_add_welcome_manager(_template,_ml,_mt,_mr,_mb,_chatAvailable){

    if(OverlayChatWidgetV2.__ModeClassic)
        return;

    if(typeof lz_ovlel_classic != 'undefined')
    {
        if(!OverlayChatWidgetV2.__ModeClassic)
            _mb = 30;
    }

    if(lz_is_mobile)
    {
        _mb = _mb * 0.7;
        _mr = _mr * 0.7;
    }

    _template = lz_global_base64_decode(_template);
    _template = _template.replace(/<!--scale-->/g,OverlayChatWidgetV2.__Scale);
    _template = _template.replace("<!--border-->",OverlayChatWidgetV2.__BorderWidth);
    _template = _template.replace(/<!--size-->/g,OverlayChatWidgetV2.__SizeHeight);
    _template = _template.replace("<!--posx-->",-12*OverlayChatWidgetV2.__Ratio);
    _template = _template.replace("<!--posy-->",-11*OverlayChatWidgetV2.__Ratio);

    OverlayChatWidgetV2.AddWMElements(_template,_ml,_mt,_mr,_mb,_chatAvailable);

    if(lz_overlay_wm != null)
    {
        OverlayChatWidgetV2.UpdateWMUI();
        lz_overlay_wm.UpdateUI();
        lz_chat_update_css();
    }
    if(OverlayChatWidgetV2.__ModeAPI)
        lz_overlay_wm.SetVisible(false);
}

function lz_tracking_cbubble(_ctx, _av){
    try
    {
        var _x = 1,
            _y = 5,
            _shx = lz_d(lz_ovlec.ec_shx) ? lz_ovlec.ec_shx : 0,
            _w = (lz_ovlec.ec_w - _shx - 3),
            _h = lz_ovlec.ec_h - 25,
            _r = lz_ovlec.ec_br,
            _shb = lz_d(lz_ovlec.ec_shb) ? lz_ovlec.ec_shb : 0,
            _shy = lz_d(lz_ovlec.ec_shy) ? lz_ovlec.ec_shy : 0,
            _shc = lz_d(lz_ovlec.ec_shc) ? lz_ovlec.ec_shc : '#000',
            _sgs= lz_d(lz_ovlec.ec_bcs) ? lz_ovlec.ec_bcs : 0,
            _sge = lz_d(lz_ovlec.ec_bce) ? lz_ovlec.ec_bce : 0,
            _sglw= lz_d(lz_ovlec.ec_bw) ? lz_ovlec.ec_bw : 0,
            _fgs = lz_d(lz_ovlec.ec_bgcs) ? lz_ovlec.ec_bgcs : 0,
            _fge = lz_d(lz_ovlec.ec_bgce) ? lz_ovlec.ec_bgce : 0,
            _avbgc = lz_d(lz_ovlec.ec_a_bgc) ? lz_ovlec.ec_a_bgc : 0;

        function createFullPath(){
            _ctx.beginPath();
            _ctx.moveTo(_x + _r, _y);
            _ctx.lineTo(_x + _w - _r, _y);
            _ctx.quadraticCurveTo(_x + _w, _y, _x + _w, _y + _r);
            _ctx.lineTo(_x + _w, _y + _h - _r);
            _ctx.quadraticCurveTo(_x + _w, _y + _h, _x + _w - _r, _y + _h);
            _ctx.lineTo(m+_x+60 + 10, _y + _h);
            _ctx.lineTo(m+_x+45 + 10, _y + _h+10);
            _ctx.lineTo(m+_x+30 + 10, _y + _h);
            _ctx.lineTo(_x + _r, _y + _h);
            _ctx.quadraticCurveTo(_x, _y + _h, _x, _y + _h - _r);
            _ctx.lineTo(_x, _y + _r);
            _ctx.quadraticCurveTo(_x, _y, _x + _r, _y);
            _ctx.closePath();
            _ctx.save();
        }

        function createAvatarPath(){
            var avbgw = _av;
            var avh = _h;
            var avx = _x;
            var avy = _y;
            var avr = _r-1;
            _ctx.beginPath();
            _ctx.moveTo(avx + avr, avy);
            _ctx.lineTo(avx + avbgw, avy);
            _ctx.lineTo(avx + avbgw, avy + avh);
            _ctx.lineTo(avx + avr, avy + avh);
            _ctx.quadraticCurveTo(avx, avy + avh, avx, avy + avh - avr);
            _ctx.lineTo(avx, avy + avr);
            _ctx.quadraticCurveTo(avx, avy, avx + avr, avy);
            _ctx.closePath();
            _ctx.save();
        }

        _x+=_sglw;
        _w-=_sglw;

        var m = _w-90;

        createFullPath();

        var grdfill=_ctx.createLinearGradient(_x,_y,0,_h);
        grdfill.addColorStop(0,_fgs);
        grdfill.addColorStop(1,_fge);

        _ctx.fillStyle = grdfill;

        if(_shc != '')
        {
            _ctx.shadowColor = _shc;
            _ctx.shadowBlur = _shb;
            _ctx.shadowOffsetX = _shx;
            _ctx.shadowOffsetY = _shy;
        }

        _ctx.fill();
        _ctx.shadowBlur = 0;
        _ctx.shadowOffsetX = 0;
        _ctx.shadowOffsetY = 0;

        if(_av > 0)
        {
            createAvatarPath();
            _ctx.fillStyle = _avbgc;
            _ctx.fill();
        }

        if(_sglw>0)
        {
            createFullPath();
            var grdstroke=_ctx.createLinearGradient(_x,_y,0,_h);
            grdstroke.addColorStop(0,_sgs);
            grdstroke.addColorStop(1,_sge);
            _ctx.strokeStyle = grdstroke;
            _ctx.lineWidth = _sglw;
            _ctx.stroke();
        }
    }
    catch(ex)
    {
        console.log(ex);
    }
}

function lz_tracking_remove_overlay_chat(){

	if(lz_overlay_chat != null)
	{
		clearTimeout(lz_chat_invite_timer);
		clearTimeout(lz_chat_waiting_posts_timer);
		lz_overlay_chat = null;
        var rmblobj = ['lz_overlay_wm','livezilla_wm','lz_overlay_chat','lz_chat_fs_header','lz_chat_fs_body'];
        for(var k in rmblobj)
            if(document.getElementById(rmblobj[k]) != null)
                document.getElementById(rmblobj[k]).remove();
	}
}

function lz_tracking_geo_failure(){
	lz_tracking_set_geo_span(lz_geo_error_span);
	lz_geo_resolution.SetStatus(4);
	lz_session.GeoResolved = ['LTUyMg==','LTUyMg==','','','','',''];
	lz_session.Save();
	LiveZilla.Engine.Poll(1002);
}

function lz_tracking_init_external_window(_name,_intid,_groupid){

    var _parameters = '';

    if(_parameters.indexOf('&ptn=') == -1 && _name != '')
        _parameters += "&ptn=" + encodeURIComponent(_name);

    if(_parameters.indexOf('&operator=') == -1 && _intid != '')
        _parameters += '&operator='+ encodeURIComponent(_intid);

    if(_parameters.indexOf('&group=') == -1 && _groupid != '')
        _parameters += '&hg=Pw__&group=' + encodeURIComponent(_groupid);

    _parameters += '&nct=MQ__&hfk=MQ__';
    _parameters = LiveZilla.Engine.AddPassThruParameters(_parameters);

    void(window.open(lz_poll_server + lz_poll_file_chat + '?a=MQ__' + _parameters.replace('&&','&'),'LiveZilla','width='+lz_window_width+',height='+lz_window_height+',left=50,top=50,resizable=yes,menubar=no,location=no,status=yes,slidebars=no'));
}

function lz_tracking_deactivate(_confirm,_days){
    lz_deactivate = _days;
    LiveZilla.Engine.Poll(1214);
    alert(_confirm);
}

function lz_tracking_set_widget_visibility(_visible){
    if(lz_session.OVLCState != '0' && !_visible)
        return;

    if(lz_overlay_chat != null)
    {
        if(_visible && !lz_overlay_chat.lz_livebox_shown)
        {
            lz_overlay_chat.lz_livebox_show(lz_overlay_zindex);

            if(lz_session.OVLCState == "1")
                lz_chat_change_state(false,true);
            lz_chat_set_init();
            lz_chat_update_css();
        }
        document.getElementById('lz_overlay_chat').style.display = (_visible) ? '' : 'none';
    }
}

function lz_tracking_add_tag(_html){
    var container = document.createElement("div");
    container.innerHTML = lz_global_base64_decode(_html);
    document.body.appendChild(container);
    var arr = container.getElementsByTagName('script');
    for (var n = 0; n < arr.length; n++)
    {
        if(arr[n].innerHTML!="")
            eval(arr[n].innerHTML);
        if(arr[n].src!=null)
        {
            var newScript = document.createElement("script");
            newScript.src = arr[n].src;
            newScript.async = true;
            lz_document_head.appendChild(newScript);
        }
    }
}

function lz_event_fire(_id){
    lz_event_fire_id = _id;
    LiveZilla.Engine.Poll(1006);
}

function lz_fixed_mode_possible(){
    return (lz_is_mobile || lz_ovlel_fsm) && !lz_is_ie;
}