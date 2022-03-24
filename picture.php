<?php
/****************************************************************************************
* LiveZilla picture.php
* 
* Copyright 2017 LiveZilla GmbH
* All rights reserved.
* LiveZilla is a registered trademark.
* 
* Improper changes to this file may cause critical errors.
***************************************************************************************/ 

define("IN_LIVEZILLA",true);

if(!defined("LIVEZILLA_PATH"))
	define("LIVEZILLA_PATH","./");

require(LIVEZILLA_PATH . "_definitions/definitions.inc.php");
require(LIVEZILLA_PATH . "_lib/functions.global.inc.php");
require(LIVEZILLA_PATH . "_definitions/definitions.dynamic.inc.php");
require(LIVEZILLA_PATH . "_definitions/definitions.protocol.inc.php");
header("Content-Type: image/jpg;");
@set_error_handler("handleError");
$operator = null;
if(isset($_GET["operator"]) && Server::InitDataProvider())
{
	Server::InitDataBlock(array("INTERNAL"));
	$id = Operator::GetSystemId(Operator::ReadParams());

	if(isset(Server::$Operators[$id]))
	{
        $operator = Server::$Operators[$id];
		if(!isset($_GET["np"]))
		{
			if(!empty(Server::$Operators[$id]->WebcamPicture))
				exit(base64_decode(Server::$Operators[$id]->WebcamPicture));
			else if(!empty(Server::$Operators[$id]->ProfilePicture))
				exit(base64_decode(Server::$Operators[$id]->ProfilePicture));
		}
	}
}

if(isset($_GET["g"]))
    exit(IOStruct::GetFile("./images/avatar_group.png"));

if(function_exists("imagecreatetruecolor"))
{
	$w=80;$h=60;
    $im = imagecreatetruecolor($w, $h);
    $ca = Colors::TransformHEXToRGB('#839bae');
    $colbg = imagecolorallocate($im,$ca[0],$ca[1],$ca[2]);
    $colfont = imagecolorallocate($im, 255, 255, 255);

    $font_file = __DIR__ . "/fonts/roboto-v18-ml.ttf";
    $font_size = 26;
    $angle = 0;

    $text='??';

    if($operator != null)
    {
        if(!empty($operator->Color))
        {
            $ca = Colors::TransformHEXToRGB($operator->Color);
            $colbg = imagecolorallocate($im,$ca[0],$ca[1],$ca[2]);
        }

        $text = $operator->Fullname;
    }
    else if(isset($_GET["name"]))
        $text = (Communication::ReadParameter("name",""));

    if(isset($_GET["ebg"]))
    {
        $ebg = Colors::TransformHEXToRGB(Colors::CorrectHEX(Communication::ReadParameter("ebg",""),true));
        $colbg = imagecolorallocate($im,$ebg[0],$ebg[1],$ebg[2]);
    }

    //$text = preg_replace('/[^ \w]+/', '', $text);
    $text = mb_strtoupper($text);

    if(str_replace(' ','',$text)=='')
        $text = '??';

    $parts = explode(" ",$text);
    $text = "";
    $text .= mb_substr($parts[0],0,1);

    if(count($parts)>1)
        $text .= mb_substr($parts[count($parts)-1],0,1);
    else if(mb_strlen($parts[0])>1)
        $text .= mb_substr($parts[0],1,1);

    //$text = mb_convert_encoding($text, "HTML-ENTITIES", "UTF-8");
    $text = preg_replace('~^(&([a-zA-Z0-9]);)~',htmlentities('${1}'),$text);

    imagefilledrectangle($im, 0, 0, $w, $h, $colbg);

    $max_width=$w;
    $max_height=$h;
    $line_width = imagettfbbox($font_size, 0, $font_file, $text);

    $x_start = ceil(($max_width - $line_width[2] - $line_width[0]) / 2);
    $y_start = ceil(($max_height /2) - (($line_width[5] - $line_width[0]) / 2))-1;

    imagettftext($im, $font_size, $angle ,$x_start, $y_start, $colfont, $font_file, $text);
    imagepng($im);
    imagedestroy($im);
}

exit(IOStruct::GetFile("./images/avatar.png"));
?>
