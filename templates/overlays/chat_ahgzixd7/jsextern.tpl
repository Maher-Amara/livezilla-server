var lz_hide_group_chat = <!--hide_group_select_chat-->;
var lz_hide_group_ticket = <!--hide_group_select_ticket-->;
var lz_color_primary = '<!--pc-->';
var lz_color_primary_dark = '<!--pcd-->';
var lz_color_secondary = '<!--sc-->';
var lz_border_radius = <!--border_radius-->;
var lz_tickets_external = <!--tickets_external-->;
var lz_chats_external = <!--chats_external-->;
var lz_kb_external = <!--kb_external-->;
var lz_kb_embed = <!--kb_embed-->;
var lz_kb_embed_url = '<!--kb_embed_url-->';
var lz_kb_root = '<!--kb_root-->';
var lz_post_html = '<!--post_html-->';
var lz_add_html = '<!--add_html-->';
var lz_tr_api_key = '<!--gtv2_api_key-->';
var lz_trans_into = '<!--def_trans_into-->';
var lz_ticket_when_online = <!--ticket_when_online-->;
var lz_shared_kb_auto_search = <!--kb_suggest-->;
var lz_shared_kb_last_search_time = 0;
var lz_monitoring_active = <!--monitoring_active-->;
var lz_ec_image = '<!--ec_image-->';
var lz_ec_o_image = '<!--ec_o_image-->';
var lz_comp_logo = '<!--comp_logo-->';

function OverlayChatWidgetV2()
{
}

OverlayChatWidgetV2.__PublicGroupChat = '<!--pgc-->';

OverlayChatWidgetV2.OfflineMessageMode = '<!--offline_message_mode-->';
OverlayChatWidgetV2.OfflineMessageHTTP = '<!--offline_message_http-->';
OverlayChatWidgetV2.OfflineMessageNewWindow = <!--offline_message_new_window-->;

OverlayChatWidgetV2.CallbackMode = '<!--cb_mode-->';
OverlayChatWidgetV2.CallbackHTTP = '<!--cb_http-->';
OverlayChatWidgetV2.CallbackNewWindow = <!--cb_new_window-->;
OverlayChatWidgetV2.MessageSneakPeek = <!--cmsp-->;
OverlayChatWidgetV2.BotFeedback = <!--fbob-->;
OverlayChatWidgetV2.BotForm = <!--bolf-->;
OverlayChatWidgetV2.ForceGroupSelect = <!--require_group_selection-->;
OverlayChatWidgetV2.NotificationSound = '<!--notification_sound-->';
OverlayChatWidgetV2.MessageSound = '<!--message_sound-->';

try
{
    var style = document.createElement('style');
    style.type = 'text/css';

    style.innerHTML += ':root{--sc-color: <!--sc-->;--pc-color: <!--pc-->;--lz-border-color: <!--borc-->;--lz-icon-color: <!--icoc-->;--lz-text-color: <!--texc-->;--lz-light-color: <!--lc-->;--lz-input-border-color: <!--iboc-->;--lz-input-bg-color: <!--ibgc-->;}';
    style.innerHTML += '#lz_overlay_chat .lz_form_check:checked + .lz_form_check_label:before {content: "";background: radial-gradient(<!--pc--> 35%, #f1f1f1 45%, #fafafa 100%);}';
    document.getElementsByTagName('head')[0].appendChild(style);
}
catch(ex)
{

}

function lz_chat_get_parameters(_ws)
{
    return lz_getp_track;
}

function lz_chat_open()
{

}

function lz_chat_update_css(){
    document.getElementById('lz_chat_overlay_minimize').style.display = (lz_overlay_chat.m_FullScreenMode) ? 'none' : '';
    document.getElementById("lz_chat_overlay_main").className = (lz_overlay_chat.m_FixedMode) ? "lz_chat_base notranslate lz_chat_mdc" : "lz_chat_base notranslate";
    document.getElementById('lz_chat_overlay_options_box').style.height = (Math.min(lz_overlay_chat_height-200,300)) + "px";
    document.getElementById('lz_chat_overlay_main').style.borderRadius = (lz_overlay_chat.m_FixedMode || lz_overlay_chat.m_FullScreenMode) ? 0 : lz_border_radius + 'px';
    if(<!--shadow-->)
        lz_overlay_chat.m_FrameElement.style.boxShadow = "<!--shadowx-->px <!--shadowy-->px <!--shadowb-->px <!--shadowc-->";
}