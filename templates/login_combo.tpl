<input type="hidden" id="lz_form_active_<!--name-->" value="<!--active-->">
<table id="lz_form_<!--name-->" class="lz_input">
    <tr>
        <td colspan="2"><strong><!--caption-->:</strong></td>
    </tr>
	<tr>
		<td><select name="form_<!--name-->" class="lz_form_base lz_form_box lz_form_select" onchange="return lz_chat_save_input_value('<!--name-->',this.selectedIndex);"><!--options--></select></td>
        <td class="lz_form_icon">
            <div class="lz_form_info_box" id="lz_form_info_<!--name-->" style="display:none;"><!--info_text--></div>
            <div id="lz_form_mandatory_<!--name-->" style="display:none;"><!--lz_chat_req--></div></td>
	</tr>
</table>