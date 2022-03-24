<input type="hidden" id="lz_form_active_<!--name-->" value="<!--active-->">
<table id="lz_form_<!--name-->" class="lz_input" style="padding:12px 0;">
    <tr>
        <td id="lz_form_caption_<!--name-->" style="background:transparent;text-align:left;">
            <input id="lz_ccb_<!--name-->" class="lz_form_check" name="form_<!--name-->" type="checkbox" onchange="return lz_chat_save_input_value('<!--name-->',((this.checked) ? '1' : '0'));">
            <label for="lz_ccb_<!--name-->" class="lz_form_check_label"><!--caption--></label>
        </td>
        <td class="lz_form_icon">
            <div id="lz_form_info_<!--name-->" class="lz_form_info_box" style="display:none;"><!--info_text--></div>
            <div id="lz_form_mandatory_<!--name-->" style="display:none;"><!--lz_chat_req--></div>
        </td>
    </tr>
</table>
