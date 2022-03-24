<div id="lz_chat_overlay_pointer_h" class="lz_chat_overlay_pointer" style="display:none;border-top:12px solid transparent; border-left: 12px solid #eee;border-bottom: 12px solid transparent;">
    <div style="top:-10px;left:-12px;border-top:10px solid transparent; border-left: 10px solid #fff;border-bottom: 10px solid transparent;"></div>
</div>
<div id="lz_chat_overlay_pointer_v" class="lz_chat_overlay_pointer" style="border-left:12px solid transparent; border-top: 12px solid #fff;border-right: 12px solid transparent;">
    <div style="top:-12px;left:-10px;border-left:10px solid transparent; border-top: 10px solid #fff;border-right: 10px solid transparent;"></div>
</div>
<div id="lz_chat_overlay_main" class="lz_chat_base notranslate" style="direction:<!--dir-->;border-radius:<!--brt-->px <!--brt-->px <!--brb-->px <!--brb-->px;background: linear-gradient(180deg, <!--pc--> 50px, #fff 51px, #fff 100%);" onclick="lz_chat_switch_options_table(true,1);">
    <div id="lz_chat_overlay_text" class="lz_chat_unselectable" style="background:<!--pc-->;" onclick="OverlayChatWidgetV2.Maximize();"></div>
    <!--lz_chat_min-->
    <div id="lz_chat_content">
        <div id="lz_overlay_phone_inbound" class="lz_chat_module" style="display:none;">
            <div class="lz_chat_header"><h2><!--lang_client_hotline--></h2></div>
            <a id="lz_chat_data_phone_header_number" style="color:<!--sc-->;"></a>
            <div id="lz_chat_data_phone_header_text"></div>
        </div>
        <div id="lz_chat_data_form" class="lz_chat_module">
            <div id="lz_chat_data_header"class="lz_chat_header"></div>
            <div id="lz_chat_data_form_inputs">
                <div>
                    <div id="lz_chat_data_header_text"><!--ticket_information--></div>

                    <!--chat_login_group_top-->
                    <!--chat_login_inputs-->
                    <!--chat_login_group_bottom-->

                    <table id="lz_form_tos" class="lz_input">
                        <tr>
                            <td>
                                <input id="lz_ccb_tos" class="lz_form_check" type="checkbox" />
                                <label id="lz_chat_tos_text" for="lz_ccb_tos" class="lz_form_check_label"><!--lang_client_tos_accept--></label>
                            </td>
                            <td class="lz_form_icon">
                                <div id="lz_form_mandatory_tos" style="display:none;" class="lz_input_icon lz_required"><!--lz_chat_req--></div>
                            </td>
                        </tr>
                    </table>
                    <br>
                    <div id="lz_chat_overlay_data_form_ok_button" class="lz_overlay_chat_button lz_chat_unselectable lz_overlay_br_five" style="background:<!--pc-->;" onclick="lz_chat_data_form_result();"></div>
                </div>
            </div>
        </div>
        <div id="lz_overlay_module_tos" class="lz_chat_module">
            <div class="lz_chat_header"><h2><!--lang_client_tos--></h2></div>
            <div id="lz_overlay_module_tos_content">
                <div id="lz_chat_tos_text_box"></div>
            </div>
        </div>
        <div id="lz_overlay_module_custom" class="lz_chat_module">
            <div class="lz_chat_header"><h2></h2></div>
            <div id="lz_overlay_module_custom_content">
                <iframe></iframe>
            </div>
        </div>
        <div id="lz_overlay_module_feedback" class="lz_chat_module">
            <div class="lz_chat_header"><h2><!--lang_client_feedback--></h2></div>
            <div id="lz_overlay_module_feedback_content">
                <iframe></iframe>
            </div>
        </div>
        <div id="lz_overlay_module_knowledgebase" class="lz_chat_module">
            <div class="lz_chat_header"><h2><!--lang_client_kb_search--></h2></div>
            <div id="lz_overlay_module_knowledgebase_content">
                <iframe></iframe>
            </div>
        </div>
        <div id="lz_chat_overlay_ticket">
            <div id="lz_chat_ticket_received" class="lz_overlay_chat_ticket_response"><!--lang_client_message_received--></div>
            <div id="lz_chat_ticket_flood" class="lz_overlay_chat_ticket_response"><!--lang_client_message_flood--></div>
            <div class="lz_overlay_chat_button lz_chat_unselectable lz_overlay_br_five" style="background:<!--pc-->;" onclick="lz_chat_data_form_result();"><!--lang_client_back--></div>
        </div>
		<div id="lz_overlay_module_chat" class="lz_chat_module">
            <div class="lz_chat_header"><h2 id="lz_chat_operator_groupname"></h2></div>
            <div id="lz_chat_state_bar" class="lz_chat_header">
               <div id="lz_chat_options_table" class="lz_chat_unselectable" style="display:none;">
                    <div id="lz_cf_tr" onclick="lz_stop_propagation(event);lz_chat_switch_translation();" style="display:<!--tr_vis-->;"><!--lang_client_use_auto_translation_service_short--><!--lz_chat_switch_tr--></div>
                    <div id="lz_cf_so" onclick="lz_stop_propagation(event);lz_chat_switch_sound();"><!--lang_client_switch_sounds--><!--lz_chat_switch_so--></div>
                    <div id="lz_cf_et" onclick="lz_stop_propagation(event);lz_chat_switch_transcript(false);" style="display:<!--et_vis-->;"><!--lang_client_request_chat_transcript_short--><!--lz_chat_switch_et--></div>
                    <div id="lz_cf_ed" style="<!--ocpd-->" onclick="lz_chat_switch_options_table();lz_chat_switch_details(false);"><!--lang_client_change_my_details--></div>
                    <div id="lz_cf_pr" onclick="lz_chat_switch_options_table();lz_chat_print();"><!--lang_client_print--></div>
                    <div id="lz_cf_ec" onclick="lz_chat_switch_options_table();OverlayChatWidgetV2.ExitChat();"><!--lang_client_end_chat--></div>
                </div>
                <!--lz_chat_ob-->
                <!--lz_chat_fb-->
            </div>
            <div id="lz_chat_members_box"></div>
            <div id="lz_chat_content_box" style="display:none;" class="lz_chat_content_box_fh" onScroll="lz_chat_scroll();"><div id="lz_chat_content_inlay"></div></div>
            <div id="lz_chat_overlay_bottom">
                <div id="lz_chat_bot_reply_loading" style="display:none;">
                    <div class="lz_anim_point_load"><span></span><span></span><span></span></div>
                </div>
                <div id="lz_chat_text_frame">
                    <textarea id="lz_chat_text" placeholder="<!--lang_client_type_message-->" onchange="lz_overlay_chat_impose_max_length(this, <!--overlay_input_max_length-->);OverlayChatWidgetV2.UpdateChatInputUI();" onkeydown="lz_overlay_chat_impose_max_length(this, <!--overlay_input_max_length-->);OverlayChatWidgetV2.UpdateChatInputUI();" onclick="if(event.stopPropagation){event.stopPropagation();}event.cancelBubble=true;" onkeyup="lz_overlay_chat_impose_max_length(this, <!--overlay_input_max_length-->);OverlayChatWidgetV2.InputKeyUp(event);"></textarea>
                </div>
                <div id="lz_chat_icon_frame">
                    <!--lz_chat_button_send-->
                    <!--lz_chat_button_file-->
                    <!--lz_chat_button_sc-->
                    <input id="lz_overlay_file_upload" type="file" title="">
                </div>
            </div>
            <div id="lz_chat_overlay_info"></div>
        </div>
        <div id="lz_chat_overlay_options_box_bg" style="display:none;"></div>
        <div id="lz_chat_overlay_options_frame" style="display:none;">
            <div id="lz_chat_overlay_options_box" style="display:none;">
                <div id="lz_chat_overlay_option_function_fu">
                    <iframe id="lz_chat_overlay_file_upload_frame"></iframe>
                </div>
                <!--lz_chat_co-->
            </div>
        </div>
        <div id="lz_chat_overlay_loading" style="display:none;">
            <div class="lz_anim_point_load"><span></span><span></span><span></span></div>
        </div>
	</div>
    <div id="lz_chat_apo" style="<!--apo-->"><!--lz_chat_po--></div>
    <div id="lz_chat_apa" class="lz_overlay_chat_footer lz_chat_unselectable lz_overlay_chat_options_link"><!--param--></div>
</div>
