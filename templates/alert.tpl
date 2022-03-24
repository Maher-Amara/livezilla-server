<div id="lz_chat_dialog" style="padding:0 20px;">
    <table style="height:100%;width:100%;">
        <tr>
            <td style="text-align:center;vertical-align: middle;">
                <div id="lz_chat_dialog_box">
                    <div id="lz_chat_dialog_header">&nbsp;<!--title--></div>
                    <div id="lz_chat_dialog_text_frame">
                        <div id="lz_chat_dialog_text"></div>
                    </div>

                    <div id="lz_chat_dialog_resource_frame">
                        <iframe id="lz_chat_dialog_resource" src=""></iframe>
                    </div>

                    <fieldset id="lz_chat_file_frame" style="display:none;margin:20px;">
                        <legend>
                            <label><!--lang_client_send_file-->&nbsp;</label>
                        </legend>
                        <iframe id="lz_chat_file_upload_frame"></iframe>
                    </fieldset>

                    <div id="lz_chat_dialog_footer">
                        <input type="button" class="lz_form_button" id="lz_chat_dialog_print" value="<!--lang_client_print-->" onclick="document.getElementById('lz_chat_dialog_resource').contentWindow.print();">
                        <input type="button" class="lz_form_button" id="lz_chat_dialog_button" value="OK">
                    </div>
                </div>
            </td>
        </tr>
    </table>
</div>
<div id="lz_chat_dialog_bg"></div>
