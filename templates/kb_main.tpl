<!DOCTYPE html>
<head>
    <META NAME="robots" CONTENT="index,follow">
    <title><!--config_gl_site_name--></title>
    <link rel="stylesheet" type="text/css" href="<!--path-->templates/style_kb.min.css">
    <link rel="shortcut icon" type="image/x-icon" href="<!--path-->images/favicon.ico">
    <script type="text/javascript" src="<!--path-->templates/ahgzixd7/kb.min.js"></script>
    <script type="text/javascript" src="<!--path-->templates/ahgzixd7/icons.min.js"></script>
    <script type="text/javascript" src="<!--path-->templates/ahgzixd7/jsglobal.min.js"></script>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
</head>

<body onload="init();">
    <div>
        <!--header-->
    </div>
    <div id="lz_kb_h2">
        <div id="lz_kb_search_box">
            <form id="lz_kb_search_form" action="<!--path--><!--searchtarget-->" method="GET">
                <input id="lz_kb_input" name="search-for" type="text" class="lz_form_box" value="<!--query-->" placeholder="<!--lang_client_kb_search_placeholder-->" onkeyup="lz_kb.Update();if(event.keyCode==13){lz_kb.Search();}">
                <div id="lz_kb_clear"></div>
                <input id="lz_kb_search" type="button" value="<!--lang_client_search-->" class="lz_form_button lz_chat_unselectable" onclick="lz_kb.Search();">
                <!--params-->
            </form>
        </div>
    </div>
    <div class="kb_body">
        <div id="lz_kb_results" class="lz_kb_center">
            <!--navigation--><!--results-->
        </div>
    </div>
    <div>
        <!--footer-->
    </div>
</body>
</html>