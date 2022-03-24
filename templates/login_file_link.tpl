<input type="hidden" id="lz_form_active_<!--name-->" value="<!--active-->">
<table id="lz_form_<!--name-->" class="lz_input">
	<tr>
		<td>
            <div class="lz_form_base lz_form_box" onclick="OverlayChatWidgetV2.InitFileUpload();" style="text-align: right;cursor:pointer;">
                <span id="lz_form_caption_<!--name-->" class="lz_form_file_caption"><!--caption_plain--></span>
                <span>
                    <span name="form_sc_<!--name-->" onclick="event.stopPropagation();OverlayChatWidgetV2.CaptureScreen(false,<!--name-->);" class="lz_form_file_add"><!--lz_chat_sc--></span>
                    <span id="<!--id-->" name="form_<!--name-->" class="lz_form_file_add"><!--lz_chat_fp--></span>
                </span>
                <div id="files_<!--name-->" class="lz_form_file_container"></div>
            </div>
        </td>
        <td class="lz_form_icon">
            <div id="lz_form_info_<!--name-->" class="lz_form_info_box" style="display:none;"><!--info_text--></div>
            <div id="lz_form_mandatory_<!--name-->" style="display:none;"><!--lz_chat_req--></div>
        </td>
	</tr>
</table>