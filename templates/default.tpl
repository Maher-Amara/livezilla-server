<div id="lvztr_<!--scriptid-->" style="display:none;"></div>
<script id="lz_r_scr_<!--scriptid-->" type="text/javascript" defer>
    var lz_code_id = '<!--scriptid-->';
    var script = document.createElement("script");script.async=true;
    script.type="text/javascript";
    var src = '<!--server-->?rqst=track&output=jcrpt&ovlts=MA__&nse='+Math.random();
    src += '<!--params-->';
    src += '&ovlv=djI_';
    src += '&ovlapo=MQ__';
    src += '&ovlc=MQ__';
    //src += '&ovltwo=MQ__';
    src += '&ovlmr=NDA_';
    src += '&ovlbr=Ng__';

    /*var lz_ovlel_text_inline = false;*/

    lz_ovlel_rat = 1.2;
    lz_ovlel = [];
    lz_ovlel.push({type:'wm',icon:'commenting'});
    if(<!--f_chat-->)
        lz_ovlel.push({type:'chat',icon:'comments',counter:true});
    if(<!--f_ticket-->)
        lz_ovlel.push({type:'ticket',icon:'envelope'});
    if(<!--f_kb-->)
        lz_ovlel.push({type:'knowledgebase',icon:'lightbulb-o',counter:true});
    if(<!--f_phone-->)
        lz_ovlel.push({type:'phone',icon:'phone',inbound:false,outbound:true});

    var lz_data = {
        <!--ptdata-->
    };

    if(typeof lz_ovlel_fsm != 'undefined' && lz_ovlel_fsm && !<!--f_kb--> && !<!--f_phone--> && <!--offline_message_mode--> == '1')
    {
        if(window.opener != null && !<!--offline_message_external-->)
        {
            window.opener.location.href = '<!--offline_message_http-->';
            window.close();
        }
        else
            window.location.href = '<!--offline_message_http-->';
    }
    else
    {
        script.src=src;
        document.getElementById('lvztr_<!--scriptid-->').appendChild(script);
    }
</script>