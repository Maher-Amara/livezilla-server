<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <title><!--config_gl_site_name--></title>
    <meta name="description" content="LiveZilla Live Chat - Print">
    <link rel="shortcut icon" type="image/x-icon" href="./images/favicon.ico">
    <link rel="stylesheet" type="text/css" href="./templates/style_chat.min.css">
</head>
<body style="padding:20px;" onload="window.print();">
<h2>Chat <!--chat_id--></h2>
<h3><!--config_gl_site_name--></h3>
<h4><script>document.write(new Date().toLocaleString());</script></h4>
<!--transcript-->
<br>
<!--lz_ref_link-->
<br><br><br>
<input type="button" value="<!--lang_client_print-->" onclick="this.parentNode.removeChild(this);window.print();">
</body>
</html>