<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <title>LiveZilla</title>
    <meta name="description" content="LiveZilla Ticket">
    <link rel="stylesheet" type="text/css" href="./templates/style_ticket.min.css">
    <link rel="shortcut icon" type="image/x-icon" href="./images/favicon.ico">
    <script type="text/javascript" src="./mobile/js/jquery-3.4.1.min.js"></script>
    <script type="text/javascript" src="./mobile/js/jquery-migrate-1.2.1.min.js"></script>
    <script type="text/javascript" src="./mobile/js/jquery-migrate-3.1.0.min.js"></script>
    <meta name="viewport" content="width=device-width, maximum-scale=1.0, user-scalable=no">
</head>
<body onload="FormatDates();">

<div>
    <!--logo-->
    <div>
        <h2><!--subject--></h2>
        <div class="attributes">
            <div><b><!--lang_ticket-->:</b> <!--id--></div>
            <div><b><!--lang_ticket_status-->:</b> <!--lang_ticket_status_<!--status-->--></div>
            <div><div id="lz_ticket_feedback_button" class="form_button" style="<!--close_button_style-->" onclick="document.location.href='./feedback.php?tid=<!--tid-->&close=1&salt=<!--salt-->';"><!--lang_client_close--></div></div>
        </div>
    </div>
    <div>
        <!--tickets-->
    </div>
</div>
<div style="text-align: center;">
    <!--lang_index_ticket_reply-->
    <br><br><br><br><b><!--src--></b>
</div>
<br><br>
<script language="JavaScript">
var FormatDates = function(){
    $('.text_date').each(function(){
        $(this).html(GetLocalDate($(this).html()));
    });
};
var GetLocalDate = function(_ts){
    if(!_ts.toString().length || isNaN(_ts))
        return '';
    _ts = parseInt(_ts) - 0;
    var date = new Date(parseInt(_ts)*1000);
    var timeStr = date.toLocaleTimeString();
    var dateStr = date.toLocaleDateString();
    if(timeStr=="Invalid Date")
        return _ts;
    return dateStr + " " + timeStr;
};
</script>
</body>
</html>