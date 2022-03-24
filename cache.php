<?php
header("Cache-Control: no-cache, must-revalidate");
exit(md5(uniqid()));
?>