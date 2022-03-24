<input type="hidden" id="lz_form_active_<!--name-->" value="<!--active-->">
<table id="lz_form_<!--name-->" class="lz_input">
	<tr>
        <td id="lz_form_caption_<!--name-->" style="width:16px;background:transparent;text-align:left;">
            <input class="lz_form_check" name="form_<!--name-->" type="checkbox" onchange="return lz_chat_save_input_value('<!--name-->',((this.checked) ? '1' : '0'));">
        </td>
        <td style="vertical-align: middle;">
            <!--caption-->
            </td>
        <td class="lz_form_icon">
            <div class="lz_form_info_box" id="lz_form_info_<!--name-->"><!--info_text--></div>
            <div id="lz_form_mandatory_<!--name-->" style="display:none;"><!--lz_chat_req--></div>
        </td>
	</tr>
</table>
