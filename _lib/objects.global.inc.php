<?php
/****************************************************************************************
* LiveZilla objects.global.inc.php
* 
* Copyright 2018 LiveZilla GmbH
* All rights reserved.
* LiveZilla is a registered trademark.
* 
* Improper changes to this file may cause critical errors.
***************************************************************************************/ 

if(!defined("IN_LIVEZILLA"))
	die();

class IOStruct
{
    static function AppendToFile($_file,$_content)
    {
        if($_file != FILE_GENERAL_LOG && $_file != FILE_ERROR_LOG && $_file != FILE_SQL_ERROR_LOG && $_file != FILE_EMAIL_LOG && $_file != FILE_LDAP_LOG)
            Logging::SecurityLog("IOStruct::AppendToFile",$_file . " (" . $_content. ")","");
        $handle = @fopen($_file,"a+");
        if($handle)
        {
            @fputs($handle,$_content);
            @fclose($handle);
        }
    }

    static function CreateFile($_filename, $_content, $_recreate, $_excludeFromLog = false)
    {
        if(!$_excludeFromLog)
            Logging::SecurityLog("IOStruct::CreateFile",$_filename . " (" . $_content. ")","");
        if(strpos($_filename,"..") === false)
        {
            if(file_exists($_filename))
            {
                if($_recreate)
                {
                   @unlink($_filename);
                }
                else
                    return 0;
            }

            $handle = @fopen($_filename,"w");
            if(strlen($_content)>0)
                @fputs($handle,$_content);
            @fclose($handle);
            return 1;
        }
        return 0;
    }

    static function GetFile($_file,$data="")
    {
        if(@file_exists($_file) && substr_count($_file,"..") <= 1)
        {
            $handle = @fopen($_file,"r");
            if($handle)
            {
                $data = @fread($handle,@filesize($_file));
                @fclose($handle);
            }
            return $data;
        }
    }

    static function ToBase64($_filename)
    {
        if(@filesize($_filename) == 0)
            return "";
        $handle = @fopen($_filename,"rb");
        $content = @fread($handle,@filesize($_filename));
        @fclose($handle);
        return base64_encode($content);
    }

    static function IsWriteable($_dir)
    {
        if(!@is_dir($_dir))
            @mkdir($_dir);

        if(@is_dir($_dir))
        {
            $fileid = md5(uniqid(rand()));
            $handle = @fopen ($_dir . $fileid ,"a");
            @fputs($handle,$fileid."\r\n");
            @fclose($handle);

            if(!file_exists($_dir . $fileid))
                return false;

            @unlink($_dir . $fileid);
            if(file_exists($_dir . $fileid))
                return false;

            return true;
        }
        else
            return false;
    }

    static function HashMD5($_file)
    {
        $md5file = @md5_file($_file);
        if(gettype($md5file) != 'boolean' && $md5file != false)
            return $md5file;
    }

    static function RequireTranslation($_file)
    {
        global $_CONFIG, $LZLANG; // ++
        IOStruct::RequireDynamic($_file,PATH_LOCALIZATION);
        IOStruct::RequireDynamic(str_replace(".php",".my.php",$_file),PATH_LOCALIZATION);
    }

    static function RequireDynamic($_file,$_trustedFolder)
    {
        global $_CONFIG, $LZLANG; // ++
        if(strpos($_file, "..") !== false && strpos(LIVEZILLA_PATH, "..") === false)
            return false;

        if(strpos(realpath($_file),realpath($_trustedFolder)) !== 0)
            return false;

        if(file_exists($_file))
        {
            require($_file);
            return true;
        }
        return false;
    }

    static function IsValidUploadFile($_filename)
    {
        if(Str::EndsWith($_filename,".lzsc"))
            return true;

        if(isset(Server::$Configuration->File["gl_fuwl"]) && !empty(Server::$Configuration->File["gl_fuwl"]))
        {
            $extensions = explode(",",str_replace("*.","",Server::$Configuration->File["gl_fuwl"]));
            foreach($extensions as $ext)
                if(strlen($_filename) > strlen($ext) && substr($_filename,strlen($_filename)-strlen($ext),strlen($ext)) == $ext)
                    return true;
            return false;
        }

        if(isset(Server::$Configuration->File["gl_fubl"]) && !empty(Server::$Configuration->File["gl_fubl"]))
        {
            $extensions = explode(",",str_replace("*.","",Server::$Configuration->File["gl_fubl"]));
            foreach($extensions as $ext)
            {
                if(strlen($_filename) > strlen($ext) && substr($_filename,strlen($_filename)-strlen($ext),strlen($ext)) == $ext)
                {
                    return false;
                }
            }
            return true;
        }

        return true;
    }

    static function FilterParameter($_value,$_default,$_filter,$_filteropt,$_maxlen=0)
    {
        if($_maxlen>0 && strlen($_value)>$_maxlen)
            $_value = substr($_value,0,$_maxlen);
        if($_filter == FILTER_HTML_ENTITIES)
            if($_filter == FILTER_HTML_ENTITIES)
            {
                return htmlentities($_value,ENT_QUOTES,"UTF-8");
            }
        if($_filter == null || !function_exists("filter_var"))
            return $_value;
        else if(!empty($_filter))
        {
            $var = ($_filteropt != null) ? filter_var($_value,$_filter,$_filteropt) : filter_var($_value,$_filter);
            if($var!==false)
                return $var;
        }
        return $_default;
    }

    static function ToBytes($_configValue)
    {
        $_configValue = strtolower(trim($_configValue));
        $last = substr($_configValue,strlen($_configValue)-1,1);
        $int = intval(str_replace(array("g","m","k"),"",$_configValue));
        switch($last)
        {
            case 'g':
                $int *= (1024*1024*1024);
                break;
            case 'm':
                $int *= (1024*1024);
                break;
            case 'k':
                $int *= 1024;
                break;
        }
        return floor($int);
    }

    static function ReadDirectory($_dir,$_oddout)
    {
        $files = array();
        if(!@is_dir($_dir))
            return $files;
        $handle=@opendir($_dir);
        while ($filename = @readdir ($handle))
            if ($filename != "." && $filename != ".." && ($_oddout == false || !stristr($filename,$_oddout)))
                if($_oddout != "." || ($_oddout == "." && @is_dir($_dir . "/" . $filename)))
                    $files[]=$filename;
        @closedir($handle);
        return $files;
    }

    static function GetNamebase($_path)
    {
        $file = basename($_path);
        if(strpos($file,'\\') !== false)
        {
            $tmp = preg_split("[\\\]",$file);
            $file = $tmp[count($tmp) - 1];
            return $file;
        }
        else
            return $file;
    }
}


class Logging
{
    static function SecurityLog($_type,$_value="",$_user="")
    {
        if(DBManager::$Connected && defined("DB_PREFIX"))
        {
            $_type = Str::Cut($_type,32);
            $request = @serialize($_REQUEST);

            if(!DEBUG_MODE)
                $_value = Str::Cut($_value,512);
            else
                $_value = Str::Cut($_value,3000);

            if(!DEBUG_MODE)
                $request = Str::Cut($request,1024);
            else
                $request = Str::Cut($request,3000);

            DBManager::Execute(true, "INSERT INTO `" . DB_PREFIX . DATABASE_ADMINISTRATION_LOG . "` (`id`,`type`,`value`,`trace`,`time`,`user`,`ip`) VALUES ('" . DBManager::RealEscape(getId(32)) . "','" . DBManager::RealEscape($_type) . "','" . DBManager::RealEscape($_value) . "','" . DBManager::RealEscape($request) . "','" . DBManager::RealEscape(time()) . "','" . DBManager::RealEscape($_user) . "','" . DBManager::RealEscape(Communication::GetIP(true)) . "');");
            DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_ADMINISTRATION_LOG . "` WHERE `time`<'" . DBManager::RealEscape(time() - 2592000) . "';");
        }
    }

    static function IsMailFlood()
    {
        $result=DBManager::Execute(true, "SELECT `ip` FROM `" . DB_PREFIX . DATABASE_ADMINISTRATION_LOG . "` WHERE `type`='Communication::SendMail' AND `ip`='" . DBManager::RealEscape(Communication::GetIP(false)) . "' AND `time`>" . intval(time() - 600));
        if(($rc=DBManager::GetRowCount($result)) >= (MAX_MAIL_PER_MINUTE*10))
        {
            if(class_exists('OperatorRequest') && OperatorRequest::IsValidated())
            {
                Logging::EmailLog("Possible spam (".$rc.") over IP: " . Communication::GetIP(true));
                return false;
            }
            else
            {
                Logging::EmailLog("Email blocked, possible spam (".$rc.") over IP: " . Communication::GetIP(true));
                return true;
            }
        }
        return false;
    }

    static function IsFileFlood()
    {
        $result = DBManager::Execute(true, $q = "SELECT `ip` FROM `" . DB_PREFIX . DATABASE_ADMINISTRATION_LOG . "` WHERE (`type` LIKE '%Upload::%' OR `type` LIKE '%::CreateFile%') AND `ip`='" . DBManager::RealEscape(Communication::GetIP(true)) . "' AND `time`>" . intval(time() - 86400));

        $rc = DBManager::GetRowCount($result);

        if($rc >= MAX_FILE_UPLOADS_PER_DAY)
        {
            Logging::GeneralLog("Unusual high amount of file uploads (at least ".$rc." in 24 hours) coming from IP: " . Communication::GetIP(false).". This attempt was blocked.");
            return true;
        }
        return false;
    }

    static function DebugLog($_log)
    {
        if(Is::Defined("DEBUG_MODE"))
            Logging::GeneralLog($_log);
    }

    static function DatabaseLog($_log)
    {
        Logging::GeneralLog(date("d.m.y H:i:s") . " - " . $_log,FILE_SQL_ERROR_LOG);
    }

    static function EmailLog($_log)
    {
        Logging::GeneralLog(date("d.m.y H:i:s") . " - " . $_log,FILE_EMAIL_LOG);
    }

    static function LDAPLog($_log)
    {
        Logging::GeneralLog(date("d.m.y H:i:s") . " - " . $_log,FILE_LDAP_LOG);
    }

    static function GeneralLog($_log,$_file=null)
    {
        if(empty($_file))
            $_file = FILE_GENERAL_LOG;

        if(@file_exists($_file) && @filesize($_file) > 5000000)
            @unlink($_file);

        $_log = Str::Cut($_log,100000,true);

        IOStruct::AppendToFile($_file,$_log."\r\n");
    }

    static function ErrorLog($_message)
    {
        $_message = Str::Cut($_message,100000,true);

        if(defined("FILE_ERROR_LOG"))
        {
            if(@file_exists(FILE_ERROR_LOG) && @filesize(FILE_ERROR_LOG) > 5000000)
                @unlink(FILE_ERROR_LOG);

            IOStruct::AppendToFile(FILE_ERROR_LOG,$_message . "\r");

            if(!empty(Server::$Response))
            {
                if(!isset(Server::$Response->Exceptions))
                    Server::$Response->Exceptions = "";

                Server::$Response->Exceptions .= "<val err=\"".base64_encode(trim($_message))."\" />";
            }
        }
        else
            Server::$Response->Exceptions = "";
    }

    static function BackTrace()
    {
        //Logging::DebugLog(count(debug_backtrace()) . " . " . debug_backtrace()[1]['function'] . " - " . debug_backtrace()[1]['file'] . " - " . debug_backtrace()[1]['line']);
    }
}


class SystemTime
{
    private static $StartTime;

    static function GetMicroTime()
    {
        $time = str_replace(".","",microtime());
        $time = explode(" " , $time);
        return $time;
    }

    static function GetMicroTimeFloat($_microtime)
    {
        list($usec, $sec) = explode(" ", $_microtime);
        return ((float)$usec + (float)$sec);
    }

    static function GetSystemTimezone()
    {
        if(!empty(Server::$Configuration->File["gl_tizo"]))
            return Server::$Configuration->File["gl_tizo"];

        $iTime = time();
        $arr = @localtime($iTime);
        $arr[5] += 1900;
        $arr[4]++;

        if(!empty($arr[8]))
            $arr[2]--;

        $iTztime = @gmmktime($arr[2], $arr[1], $arr[0], $arr[4], $arr[3], $arr[5]);
        $offset = doubleval(($iTztime-$iTime)/(60*60));
        $zonelist =
            array
            (
                'Kwajalein' => -12.00,
                'Pacific/Midway' => -11.00,
                'Pacific/Honolulu' => -10.00,
                'America/Anchorage' => -9.00,
                'America/Los_Angeles' => -8.00,
                'America/Denver' => -7.00,
                'America/Tegucigalpa' => -6.00,
                'America/Chicago' => -6.00,
                'America/New_York' => -5.00,
                'America/Bogota' => -5.00,
                'America/Caracas' => -4.30,
                'America/Halifax' => -4.00,
                'America/St_Johns' => -3.30,
                'America/Argentina/Buenos_Aires' => -3.00,
                'America/Sao_Paulo' => -3.00,
                'Atlantic/South_Georgia' => -2.00,
                'Atlantic/Azores' => -1.00,
                'Europe/Dublin' => 0,
                'Europe/Belgrade' => 1.00,
                'Europe/Helsinki' => 2.00,
                'Africa/Johannesburg' => 2.00,
                'Asia/Kuwait' => 3.00,
                'Asia/Tehran' => 3.30,
                'Asia/Muscat' => 4.00,
                'Asia/Kabul' => 4.30,
                'Asia/Yekaterinburg' => 5.00,
                'Asia/Kolkata' => 5.30,
                'Asia/Katmandu' => 5.45,
                'Asia/Dhaka' => 6.00,
                'Asia/Rangoon' => 6.30,
                'Asia/Krasnoyarsk' => 7.00,
                'Asia/Brunei' => 8.00,
                'Asia/Seoul' => 9.00,
                'Australia/Darwin' => 9.30,
                'Australia/Canberra' => 10.00,
                'Asia/Magadan' => 11.00,
                'Pacific/Fiji' => 12.00,
                'Pacific/Tongatapu' => 13.00
            );
        $index = array_keys($zonelist, $offset);

        if(sizeof($index)!=1)
            return false;

        return $index[0];
    }

    static function SetSystemTimezone()
    {
        if(function_exists("date_default_timezone_set"))
            if(SystemTime::GetSystemTimezone() !== false)
                @date_default_timezone_set(SystemTime::GetSystemTimezone());
    }

    static function GetTimeDifference($_time)
    {
        $_time = (time() - $_time);
        //if(abs($_time) <= 5)
          //  $_time = 0;
        return $_time;
    }

    static function GetLocalTimezone($_timezone,$ltz=0)
    {
        $template = "%s%s%s:%s%s";
        if(isset($_timezone) && !empty($_timezone))
        {
            $ltz = $_timezone;
            if($ltz == ceil($ltz))
            {
                if($ltz >= 0 && $ltz < 10)
                    $ltz = sprintf($template,"+","0",$ltz,"0","0");
                else if($ltz < 0 && $ltz > -10)
                    $ltz = sprintf($template,"-","0",$ltz*-1,"0","0");
                else if($ltz >= 10)
                    $ltz = sprintf($template,"+",$ltz,"","0","0");
                else if($ltz <= -10)
                    $ltz = sprintf($template,"",$ltz,"","0","0");
            }
            else
            {
                $split = explode(".",$ltz);
                $split[1] = (60 * $split[1]) / 100;
                if($ltz >= 0 && $ltz < 10)
                    $ltz = sprintf($template,"+","0",$split[0],$split[1],"0");
                else if($ltz < 0 && $ltz > -10)
                    $ltz = sprintf($template,"","0",$split[0],$split[1],"0");

                else if($ltz >= 10)
                    $ltz = sprintf($template,"+",$split[0],"",$split[1],"0");

                else if($ltz <= -10)
                    $ltz = sprintf($template,"",$split[0],"",$split[1],"0");
            }
        }
        return $ltz;
    }

    static function GetUniqueMessageTime($_database,$_column)
    {
        $time = time();
        while(true)
        {
            $result=DBManager::Execute(true, "SELECT `" . $_column . "` FROM `" . DB_PREFIX . $_database . "` WHERE `" . $_column . "`=" . intval($time) . ";");
            if(DBManager::GetRowCount($result) > 0)
                $time++;
            else
                break;
        }
        return $time;
    }

    static function GetRuntime($_token=null)
    {
        global $RUDB;
        if($_token==null)
        {
            $_token = getId(10);
            $RUDB[$_token] = microtime(true);
            return $_token;
        }
        else
        {
            $time_end = microtime(true);
            return $execution_time = ($time_end - $RUDB[$_token]);
        }
    }

    static function FormatTimeSpan($_seconds,$_negative=false)
    {
        if($_seconds < 0)
        {
            $_negative = true;
            $_seconds *= -1;
        }

        $days = floor($_seconds / 86400);
        $_seconds = $_seconds - ($days * 86400);
        $hours = floor($_seconds / 3600);
        $_seconds = $_seconds - ($hours * 3600);
        $minutes = floor($_seconds / 60);
        $_seconds = $_seconds - ($minutes * 60);

        $string = "";
        if($days > 0)$string .= $days.".";
        if($hours >= 10)$string .= $hours.":";
        else if($hours < 10)$string .= "0".$hours.":";
        if($minutes >= 10)$string .= $minutes.":";
        else if($minutes < 10)$string .= "0".$minutes.":";
        if($_seconds >= 10)$string .= $_seconds;
        else if($_seconds < 10)$string .= "0".$_seconds;

        if($_negative)
            return "-" . $string;
        return $string;
    }

    static function GetExecutionTime($_start=true)
    {
        if($_start)
        {
            SystemTime::$StartTime = microtime(true);
        }
        else
        {
            return microtime(true) - SystemTime::$StartTime;
        }
    }
}

class Encoding
{
    static function Base64UrlDecode($_input)
    {
        return base64_decode(str_replace(array('_','-',','),array('=','+','/'),$_input));
    }

    static function Base64UrlEncode($_input)
    {
        return str_replace(array('=','+','/'),array('_','-',','),base64_encode($_input));
    }

    static function IsBase64Encoded($_data,$_url=false)
    {
        if($_url)
            $_data = str_replace(array('_','-',','),array('=','+','/'),$_data);
        if(preg_match('%^[a-zA-Z0-9/+]*={0,2}$%', $_data))
            return true;
        else
            return false;
    }

    static function ToUTF8($_string,$_autoDetect=true)
    {
        if($_autoDetect && function_exists("mb_detect_encoding"))
        {
            $charset = mb_detect_encoding($_string);

            if(strtoupper($charset) == "UTF-8" && !Encoding::IsUTF8($_string))
            {
                $charset = "";
            }

            if(!empty($charset))
            {
                if(function_exists("mb_convert_encoding"))
                {
                    @ini_set('mbstring.substitute_character', "none");
                    $_string = mb_convert_encoding($_string, "utf-8", strtoupper($charset));
                }
                else
                    $_string = iconv(strtoupper($charset), "utf-8" . '//IGNORE', $_string);

                return $_string;
            }
        }
        return utf8_encode($_string);
    }

    static function IsUTF8($_string)
    {
        if(function_exists("iconv"))
            return @iconv('utf-8', 'utf-8//IGNORE', $_string) == $_string;
        else
            return false;
    }

    static function EncryptFile($_data)
    {
        if(!function_exists("openssl_encrypt") || !function_exists("hash_hmac"))
            return $_data;

        $key = Server::$Configuration->File["gl_lzid"];
        $ivlen = openssl_cipher_iv_length($cipher="AES-128-CBC");
        $iv = openssl_random_pseudo_bytes($ivlen);
        $ciphertext_raw = openssl_encrypt($_data, $cipher, $key, $options=OPENSSL_RAW_DATA, $iv);
        $hmac = hash_hmac('sha256', $ciphertext_raw, $key, $as_binary=true);
        $_data = base64_encode( $iv.$hmac.$ciphertext_raw );
        return "AES-128-CBC_" . $_data;
    }

    static function DecryptFile($_data)
    {
        if(!function_exists("openssl_encrypt") || !function_exists("hash_hmac"))
            return $_data;

        if(strpos($_data,"AES-128-CBC_") !== 0)
            return $_data;

        $key = Server::$Configuration->File["gl_lzid"];
        $_data = str_replace("AES-128-CBC","",$_data);

        $c = base64_decode($_data);
        $ivlen = openssl_cipher_iv_length($cipher="AES-128-CBC");
        $iv = substr($c, 0, $ivlen);
        $hmac = substr($c, $ivlen, $sha2len=32);
        $ciphertext_raw = substr($c, $ivlen+$sha2len);
        $original_plaintext = openssl_decrypt($ciphertext_raw, $cipher, $key, $options=OPENSSL_RAW_DATA, $iv);
        $calcmac = hash_hmac('sha256', $ciphertext_raw, $key, $as_binary=true);

        if(function_exists("hash_equals") && hash_equals($hmac, $calcmac))
            return $original_plaintext;
        else if(!function_exists("hash_equals"))
            return $original_plaintext;
        else
            return null;
    }
}

class Configuration
{
    public $File;
    public $Database;
    public static $Loaded = false;

    function __construct()
    {
        $this->File = array();
        $this->Database = array();
    }

    function LoadFromFile($_default=true)
    {
        global $_CONFIG;
        if($_default)
        {
           if(file_exists(FILE_CONFIG))
               require_once(FILE_CONFIG);
        }

        $isB64 = !isset($_CONFIG["b64"]);
        if(!empty($_CONFIG) && is_array($_CONFIG))
            foreach($_CONFIG as $key => $value)
                if(is_array($value) && is_int($key))
                {
                    foreach($value as $skey => $svalue)
                        if(is_array($svalue))
                            foreach($svalue as $sskey => $ssvalue)
                                $this->File[$skey][$sskey] = ($isB64) ? base64_decode($ssvalue) : $ssvalue;
                        else
                            $this->File[$skey] = ($isB64) ? base64_decode($svalue) : $svalue;
                }
                else if(is_array($value))
                {
                    foreach($value as $skey => $svalue)
                        $this->File[$key][$skey] = ($isB64) ? base64_decode($svalue) : $svalue;
                }
                else
                    $this->File[$key] = ($isB64) ? base64_decode($value) : $value;

        //SystemTime::SetSystemTimezone();
    }

    function LoadFromDatabase($_extended,$_prefix,$_retries=0)
    {
        global $_CONFIG;
        if(!$_extended)
        {
            $serverKeys = array("gl_licl","gl_pr_nbl","gl_pr_ngl","gl_pr_csp","gl_crc3");
            $result = DBManager::Execute(true, "SELECT * FROM `" . $_prefix . DATABASE_CONFIG . "` ORDER BY `key` ASC;");

            while($row = DBManager::FetchArray($result))
            {
                if(strpos($row["key"],"gl_input_list_")===0)
                {
                    $this->File["gl_input_list"][str_replace("gl_input_list_","",$row["key"])] = $row["value"];
                    $_CONFIG[0]["gl_input_list"][str_replace("gl_input_list_","",$row["key"])] = base64_encode($row["value"]);
                }
                else if(strpos($row["key"],"gl_licl_")===0)
                {
                    $_CONFIG["gl_licl"][str_replace("gl_licl_","",$row["key"])] = base64_encode($row["value"]);
                }
                else if(in_array($row["key"],$serverKeys))
                {
                    $this->File[$row["key"]] = $row["value"];
                    $_CONFIG[$row["key"]] = base64_encode($row["value"]);
                }
                else
                {
                    $this->File[$row["key"]] = $row["value"];
                    $_CONFIG[0][$row["key"]] = base64_encode($row["value"]);
                }
            }

            if(count($this->File) < 100)
            {
                if($_retries < 3)
                {
                    sleep(2);
                    $this->LoadFromDatabase($_extended,$_prefix,++$_retries);
                    return;
                }
                //else
                  //  Logging::DebugLog("Config read problem, settings count too low: " . count($this->File));
            }
            else
                self::$Loaded = true;

            if(!defined("STATS_ACTIVE"))
                define("STATS_ACTIVE", !empty($this->File["gl_stat"]));

            if(!isset($this->File["gl_lcut"]))
                $this->File["gl_lcut"] = 0;

            if(!isset($_CONFIG[0]["gl_kbtf"]))
                $_CONFIG[0]["gl_kbtf"] = base64_encode(base64_encode(IOStruct::GetFile(PATH_TEMPLATES . "kb_footer.tpl")));
            if(!isset($this->File["gl_kbtf"]))
                $this->File["gl_kbtf"] = base64_encode(IOStruct::GetFile(PATH_TEMPLATES . "kb_footer.tpl"));

            if(!isset($this->File["gl_kbth"]))
                $_CONFIG[0]["gl_kbth"] = base64_encode(base64_encode(IOStruct::GetFile(PATH_TEMPLATES . "kb_header.tpl")));
            if(!isset($this->File["gl_kbth"]))
                $this->File["gl_kbth"] = base64_encode(IOStruct::GetFile(PATH_TEMPLATES . "kb_header.tpl"));

            SystemTime::SetSystemTimezone();
        }
        else
        {
            if(!empty(CacheManager::$ActiveManager) && CacheManager::$ActiveManager->GetData(116,Server::$Configuration->Database,false))
                return;

            if(!DBManager::$Connected)
                return;

            if(!empty($this->File["gl_ccac"]))
                $this->Database["cct"] = array();

            $this->Database["gl_email"] = array();
            $result = DBManager::Execute(true, "SELECT * FROM `" . $_prefix . DATABASE_MAILBOXES . "`;");
            while($row = @DBManager::FetchArray($result))
                $this->Database["gl_email"][$row["id"]] = new Mailbox($row);

            $this->Database["gl_sm"] = array();
            /*
            $result = DBManager::Execute(false, "SELECT * FROM `" . $_prefix . DATABASE_SOCIAL_MEDIA_CHANNELS . "` ORDER BY `last_connect` ASC;");
            if($result)
                while($row = @DBManager::FetchArray($result))
                {
                    if($row["type"] == "6")
                        $this->Database["gl_sm"][$row["id"]] = new FacebookChannel($row["group_id"]);
                    else if($row["type"] == "7")
                        $this->Database["gl_sm"][$row["id"]] = new TwitterChannel($row["group_id"]);
                    $this->Database["gl_sm"][$row["id"]]->SetValues($row);
                }
            */

            $this->Database["gl_fb"] = array();
            $result = DBManager::Execute(true, "SELECT * FROM `" . $_prefix . DATABASE_FEEDBACK_CRITERIA_CONFIG . "` ORDER BY `type` ASC,`id` ASC;");
            if($result)
                while($row = @DBManager::FetchArray($result))
                    $this->Database["gl_fb"][$row["id"]] = new FeedbackCriteria($row);

            $this->Database["gl_tsd"] = array();
            $result = DBManager::Execute(true, "SELECT * FROM `" . $_prefix . DATABASE_TICKET_SUBS . "` ORDER BY `id` ASC;");
            if($result)
                while($row = @DBManager::FetchArray($result))
                    $this->Database["gl_tsd"][$row["id"].$row["type"].$row["parent_id"]] = new TicketSubDefinition($row);

            if(Is::Defined("STATS_ACTIVE"))
                if($result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_GOALS . "` ORDER BY `ind` ASC"))
                    while($row = DBManager::FetchArray($result))
                        $this->Database["gl_go"][$row["id"]] = new Goal($row);

            if(!empty(CacheManager::$ActiveManager))
                CacheManager::$ActiveManager->SetData(DATA_CACHE_KEY_DBCONFIG,Server::$Configuration->Database);
        }
    }

    static function Replace($_text)
    {
        $_text = str_replace(array("%website_name%","%SERVERNAME%"),Server::$Configuration->File["gl_site_name"],$_text);
        $_text = str_replace("%company_logo_url%",Server::$Configuration->File["gl_cali"],$_text);
        $_text = str_replace("%localdate%",date("Y-m-d"),$_text);
        $_text = str_replace("%localtime%",date("H:i:s"),$_text);
        return Server::Replace($_text,true,false);
    }

    static function GetCodeById($_id)
    {
        if(strlen($_id)==32)
        {
            $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_CODES . "` WHERE `id`='" . DBManager::RealEscape($_id) . "';");
            while($row = @DBManager::FetchArray($result))
                return $row["code"];
        }
        return null;
    }

    static function ApplyTagsToConfig($_tagList)
    {
        if(empty($_tagList))
            return;

        if(!isset(Server::$Configuration->File["gl_tags"]))
            Server::$Configuration->File["gl_tags"] = "";

        $ctList = explode(",",Server::$Configuration->File["gl_tags"]);
        $etlist = explode(",",$_tagList);
        $missing = "";
        foreach($etlist as $tag)
        {
            if(!in_array($tag,$ctList))
            {
                $missing .= "," . $tag;
            }
        }

        if(!empty($missing))
        {
            if(!empty(Server::$Configuration->File["gl_tags"]))
                Server::$Configuration->File["gl_tags"] .= $missing;
            else
                Server::$Configuration->File["gl_tags"] = substr($missing,1,strlen($missing));

            Server::SetConfigValue("gl_tags",Server::$Configuration->File["gl_tags"]);
            Server::SetConfigValue("gl_lcut",time());

            CacheManager::FlushKey(DATA_CACHE_KEY_DBCONFIG);
        }
    }

    static function DoNotTrack()
    {
        if(!Is::Null(Cookie::Get("no_tracking")))
            return true;

        if(isset($_SERVER['HTTP_DNT']) && !empty($_SERVER['HTTP_DNT']) && Server::$Configuration->File["gl_dnt"])
            if($_SERVER['HTTP_DNT'] === "1" || strtolower($_SERVER['HTTP_DNT']) == "on")
                return true;

        return false;
    }
}


class Server
{
    public static $Statistic;
    public static $Configuration;
    public static $Languages;
    public static $Countries;
    public static $CountryAliases;
    public static $Events = null;
    public static $Inputs;
    public static $Operators;
    public static $Groups;
    public static $Visitors;
    public static $Response;
    public static $Filters;
    public static $Chats;
    public static $Roles;

    static function CheckPhpVersion($_ist,$_ond,$_ird)
    {
        $array = explode(".",phpversion());
        if($array[0] > $_ist)
            return true;
        else if($array[0] == $_ist)
        {
            if($array[1] > $_ond || ($array[1] == $_ond && $array[2] >= $_ird))
                return true;
            return false;
        }
        return false;
    }

    static function DefineURL($_file)
    {
        if(defined("LIVEZILLA_URL"))
            return;
            
        $url = "";
        $url_pr = "";
        if(isset(Server::$Configuration->File["gl_url_detect"]) && !Server::$Configuration->File["gl_url_detect"] && isset(Server::$Configuration->File["gl_url"]) && !empty(Server::$Configuration->File["gl_url"]))
        {
            $url = Server::$Configuration->File["gl_url"];
            $url_pr = str_replace(array("http:","https:"),"",strtolower(Server::$Configuration->File["gl_url"]));
        }
        else if(isset($_SERVER["HTTP_HOST"]) && !empty($_SERVER["HTTP_HOST"]))
        {
            $host = $_SERVER["HTTP_HOST"];
            $path = $_SERVER["PHP_SELF"];

            if(!empty($path) && !Str::EndsWith(strtolower($path),strtolower($_file)) && strpos(strtolower($path),strtolower($_file)) !== false)
            {
                if(empty(Server::$Configuration->File["gl_kbmr"]))
                {
                    Logging::DebugLog(serialize($_SERVER));
                    exit("err 888383; can't read \$_SERVER[\"HTTP_HOST\"] and \$_SERVER[\"PHP_SELF\"]");
                }
            }

            define("LIVEZILLA_DOMAIN",Communication::GetScheme() . $host);
            define("LIVEZILLA_DOMAIN_PR","//" . $host);

            $url = LIVEZILLA_DOMAIN . str_replace($_file,"",htmlentities($path,ENT_QUOTES,"UTF-8"));
            $url_pr = LIVEZILLA_DOMAIN_PR . str_replace($_file,"",htmlentities($path,ENT_QUOTES,"UTF-8"));
        }

        if(!Str::EndsWith($url,"/"))
        {
            $url .= "/";
            $url_pr .= "/";
        }

        $url = str_replace("/api/v2","",$url);
        $url_pr = str_replace("/api/v2","",$url_pr);

        define("LIVEZILLA_URL",$url);
        define("LIVEZILLA_URL_PR",$url_pr);
    }

/*     static function DisableMagicQuotes()
    {
        if (function_exists("get_magic_quotes_gpc") && get_magic_quotes_gpc())
        {
            $process = array(&$_GET, &$_POST, &$_COOKIE, &$_REQUEST);
            while (list($key, $val) = each($process)) {
                foreach ($val as $k => $v) {
                    unset($process[$key][$k]);
                    if (is_array($v)) {
                        $process[$key][stripslashes($k)] = $v;
                        $process[] = &$process[$key][stripslashes($k)];
                    } else {
                        $process[$key][stripslashes($k)] = stripslashes($v);
                    }
                }
            }
            unset($process);
        }
    } */

    static function GetIdentification()
    {
        if(isset($_POST[POST_INTERN_AUTHENTICATION_CLIENT_SYSTEM_ID]))
            return Communication::GetParameter(POST_INTERN_AUTHENTICATION_CLIENT_SYSTEM_ID,"",$nu,FILTER_SANITIZE_SPECIAL_CHARS,null,32,false,false);
        else if(isset($_GET[GET_TRACK_BROWSERID]))
            return Communication::GetParameter(GET_TRACK_BROWSERID,"",$nu,FILTER_SANITIZE_SPECIAL_CHARS,null,32);
        else if(isset($_POST[POST_EXTERN_USER_BROWSERID]))
            return Communication::GetParameter(POST_EXTERN_USER_BROWSERID,"",$nu,FILTER_SANITIZE_SPECIAL_CHARS,null,32);
        return "";
    }

    static function RunCronJobs($_fromApi,$_forceMaintain=false,$_forceEmailout=false,$_forceEmailin=false,$_forceSMin=false)
    {

        if(isset($_POST["p_shout"]))
        {
            return true;
        }

        Server::InitDataBlock(array("DBCONFIG"));
        $cj_maintain = (isset(Server::$Configuration->File["gl_cj_maintain"])) ? Server::$Configuration->File["gl_cj_maintain"] : 0;
        $cj_email_out = (isset(Server::$Configuration->File["gl_cj_email_out"])) ? Server::$Configuration->File["gl_cj_email_out"] : 0;
        $cj_email_in = (isset(Server::$Configuration->File["gl_cj_email_in"])) ? Server::$Configuration->File["gl_cj_email_in"] : 0;
        $cj_sm_in = (isset(Server::$Configuration->File["gl_cj_sm_in"])) ? Server::$Configuration->File["gl_cj_sm_in"] : 0;
        $cj_visitors = (isset(Server::$Configuration->File["gl_cj_visitors"])) ? Server::$Configuration->File["gl_cj_visitors"] : 0;
        $cj_rep_re_calc = (isset(Server::$Configuration->File["gl_rep_re_calc"])) ? Server::$Configuration->File["gl_rep_re_calc"] : 0;
        $action = false;

        if($cj_visitors < (time() - 120) || $_forceMaintain)
        {
            $action = true;
            Server::SetCronjobTime("gl_cj_visitors");
            Server::CloseVisitorSessions();
        }
        
        if($cj_maintain < (time() - 45000) || $_forceMaintain)
        {
            $action = true;
            Server::SetCronjobTime("gl_cj_maintain");
            require_once(LIVEZILLA_PATH . "_lib/functions.internal.optimize.inc.php");
            DatabaseMaintenance::Maintain();

            if(!$_fromApi)
                return true;
        }

        // API path violates IO security rule ("..") when loading post template; access permitted
        if($cj_email_out < (time() - 60) && !$_fromApi)
        {
            $action = true;
            Server::SetCronjobTime("gl_cj_email_out");
            if(empty(Server::$Configuration->File["gl_rm_chats"]) || !empty(Server::$Configuration->File["gl_rm_chats_time"]))
            {
                Chat::CloseChats();
                Communication::SendChatTranscripts();
            }
            if(!$_fromApi)
                return true;
        }

        if(count(Server::$Configuration->Database["gl_email"])>0)
            if($cj_email_in < (time() - (120-(count(Server::$Configuration->Database["gl_email"])*20))) || $_forceEmailin)
            {
                $action = true;
                Server::SetCronjobTime("gl_cj_email_in");
                $downloadInitiated = Communication::DownloadEmails($_fromApi);
                if($downloadInitiated && !$_fromApi)
                    return true;
            }

        if(count(Server::$Configuration->Database["gl_sm"])>0)
        {
            $callTime = (120-(count(Server::$Configuration->Database["gl_sm"])*20));
            $callTimeAPI = 60;

            if($cj_sm_in < (time() - $callTime) || ($_forceSMin && $cj_sm_in < (time() - $callTimeAPI)))
            {
                $action = true;
                Server::SetCronjobTime("gl_cj_sm_in");
                $downloadInitiated = Communication::DownloadSocialMedia($_fromApi);
                if($downloadInitiated && !$_fromApi)
                    return true;
            }
        }

        if((STATS_ACTIVE && !$action && $cj_rep_re_calc < (time() - StatisticProvider::$UpdateInterval)))
        {
            Server::SetCronjobTime("gl_rep_re_calc");
            CacheManager::FlushKey(DATA_CACHE_KEY_STATS);
            Server::$Statistic = new StatisticProvider();
            $report = new StatisticYear(date("Y"),0,0,0,0);
            $report->Update();
        }
        return true;
    }

    static function CloseVisitorSessions()
    {
        $resultbr = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_VISITOR_BROWSERS . "` WHERE `closed`=0 AND `last_active` < " . intval(time() - Server::$Configuration->File["timeout_track"]) . ";");
        if($resultbr)
        {
            while($rowbr = DBManager::FetchArray($resultbr))
            {
                DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_VISITOR_BROWSER_URLS . "` SET `closed`=".time()." WHERE `browser_id` = '" . DBManager::RealEscape($rowbr["id"]) . "';");
                DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_VISITOR_BROWSERS . "` SET `closed`=".time()." WHERE `id` = '" . DBManager::RealEscape($rowbr["id"]) . "';");
            }
        }

        $resultv = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_VISITORS . "` WHERE `closed`=0 AND NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_VISITOR_BROWSERS . "` WHERE `visitor_id` = `" . DB_PREFIX . DATABASE_VISITORS . "`.`id` AND `visit_id` = `" . DB_PREFIX . DATABASE_VISITORS . "`.`visit_id` AND `closed`=0);");
        if($resultv)
        {
            while($rowv = DBManager::FetchArray($resultv))
            {
                DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_VISITORS . "` SET `closed`=".time()." WHERE `closed`=0 AND `id` = '" . DBManager::RealEscape($rowv["id"]) . "';");
            }
        }
    }

    static function SetCronjobTime()
    {
        $key = func_get_arg(0);
        $time = func_num_args()>1 ? func_get_arg(1) : time();
        Server::SetConfigValue($key,intval($time));
        CacheManager::FlushKey(DATA_CACHE_KEY_DBCONFIG);
    }

    static function SetConfigValue($_key,$_value)
    {
        DBManager::Execute(true, "REPLACE INTO `" . DB_PREFIX . DATABASE_CONFIG . "` (`key`,`value`) VALUES ('" . DBManager::RealEscape($_key) . "','" . DBManager::RealEscape($_value) . "');");
    }

    static function InitDataProvider($connection=false)
    {
        if(!isset(Server::$Configuration->File["gl_db_prefix"]))
            return false;

        if(!defined("DB_PREFIX"))
            define("DB_PREFIX",Server::$Configuration->File["gl_db_prefix"]);

        DBManager::$Connector = new DBManager(Server::$Configuration->File["gl_db_user"], Server::$Configuration->File["gl_db_pass"], Server::$Configuration->File["gl_db_host"],Server::$Configuration->File["gl_db_name"],Server::$Configuration->File["gl_db_prefix"]);

        if(DBManager::$Connector->InitConnection())
            $connection = true;

        if($connection)
        {
            Server::$Configuration->LoadFromDatabase(false,Server::$Configuration->File["gl_db_prefix"]);

            if(!isset(Server::$Configuration->File["gl_caen"]))
                Server::$Configuration->File["gl_caen"] = 1;

            if(!Server::IsServerSetup() && !Is::Defined("IN_API"))
                Server::InitCacheManager();
        }
        else
            Logging::DatabaseLog("No connection to database");

        return $connection;
    }

    static function InitCacheManager()
    {
        if(CacheManager::CachingAvailable(Server::$Configuration->File["gl_caen"]) !== false)
        {
            $gttl = min(Server::$Configuration->File["poll_frequency_clients"],Server::$Configuration->File["poll_frequency_tracking"])*2;
            $tttl = abs(min(Server::$Configuration->File["timeout_clients"],Server::$Configuration->File["timeout_chats"])-5);
            $sttl = 3600;
            $static_ttl = 3600;
            CacheManager::$ActiveManager = new CacheManager(md5(Server::$Configuration->File["gl_lzid"].Server::$Configuration->File["gl_db_prefix"].Server::$Configuration->File["gl_db_pass"].Server::$Configuration->File["gl_db_user"].Server::$Configuration->File["gl_db_name"]),$gttl,array(DATA_CACHE_KEY_EVENTS=>array("EVENTS",128,$static_ttl),DATA_CACHE_KEY_OPERATORS=>array("INTERNAL",256,$tttl,true),DATA_CACHE_KEY_ROLES=>array("ROLES",128,$tttl,true),DATA_CACHE_KEY_GROUPS=>array("GROUPS",256,$static_ttl,true),DATA_CACHE_KEY_FILTERS=>array("FILTERS",128,$static_ttl,true),DATA_CACHE_KEY_DBCONFIG=>array("DBCNF",128,$static_ttl),DATA_CACHE_KEY_STATS=>array("STATS",1,$sttl,true),DATA_CACHE_KEY_DATA_TIMES=>array("DUT",1,$static_ttl)));
            CacheManager::$ActiveManager->Read();
        }
    }

    static function UnloadDataProvider()
    {
        if(!empty(CacheManager::$ActiveManager) && !Server::IsServerSetup())
            CacheManager::$ActiveManager->Close();
        DBManager::Close();
    }

    static function InitStatisticProvider()
    {
        require_once(LIVEZILLA_PATH . "_lib/objects.stats.inc.php");
        Server::$Statistic = new StatisticProvider();
    }

    static function InitDataBlock($_fields)
    {
        if(!DBManager::$Connected)
            return false;

        if(in_array("DBCONFIG",$_fields) && empty(Server::$Configuration->Database))Server::$Configuration->LoadFromDatabase(true,Server::$Configuration->File["gl_db_prefix"]);
        if((in_array("INTERNAL",$_fields) || in_array("GROUPS",$_fields)) && empty(Server::$Operators))
        {
            Server::LoadInternals();
            if(Is::Defined("IS_FILTERED") && FILTER_ALLOW_TICKETS && !FILTER_ALLOW_CHATS)
                foreach(Server::$Operators as $operator)
                    $operator->LastActive = $operator->Status = USER_STATUS_OFFLINE;
        }
        if(in_array("LANGUAGES",$_fields) && empty(Server::$Languages))Server::LoadLanguages();
        if(in_array("COUNTRIES",$_fields) && empty(Server::$Countries))Server::LoadCountries();
        if(in_array("INPUTS",$_fields) && empty(Server::$Inputs))DataInput::Build();
        if(in_array("FILTERS",$_fields) && empty(Server::$Filters))Server::LoadFilters();

        if(DBManager::$Connected)
        {
            if(in_array("EVENTS",$_fields) && empty(Server::$Events))Server::LoadEvents();
        }
        return true;
    }

    static function ForceUpdate($_fields)
    {
        if(in_array("FILTERS",$_fields))
        {
            CacheManager::FlushKey(DATA_CACHE_KEY_FILTERS);
            Server::$Filters = array();
            Server::InitDataBlock(array("FILTERS"));
        }
        if(in_array("INTERNAL",$_fields) || in_array("GROUPS",$_fields))
        {
            CacheManager::FlushKey(DATA_CACHE_KEY_OPERATORS);
            CacheManager::FlushKey(DATA_CACHE_KEY_ROLES);
            CacheManager::FlushKey(DATA_CACHE_KEY_GROUPS);
            Server::$Groups = array();
            Server::$Operators = array();
            Server::$Roles = array();
            Server::InitDataBlock(array("INTERNAL","GROUPS"));
        }
    }

    static function IsServerSetup()
    {
        return isset($_POST[POST_INTERN_ADMINISTRATE]) || (isset($_POST[POST_INTERN_SERVER_ACTION]) && ($_POST[POST_INTERN_SERVER_ACTION] == INTERN_ACTION_GET_ICON_LIST || $_POST[POST_INTERN_SERVER_ACTION] == INTERN_ACTION_DOWNLOAD_TRANSLATION));
    }

    static function IsAvailable($_serverOnly=false)
    {
        if(!$_serverOnly && !empty(Server::$Configuration->File["gl_deac"]))
            return false;
        return (@file_exists(FILE_SERVER_DISABLED)) ? false : true;
    }

    static function InitConfiguration()
    {
        Server::$Configuration = new Configuration();
        Server::$Configuration->LoadFromFile();
    }

    static function LoadLanguages()
    {
        global $LANGUAGES;
        require_once(LIVEZILLA_PATH . "_lib/objects.languages.inc.php");
        Server::$Languages = $LANGUAGES;
    }

    static function LoadCountries()
    {
        global $COUNTRIES,$COUNTRY_ALIASES;
        require(LIVEZILLA_PATH . "_lib/objects.countries.inc.php");
        Server::$Countries = $COUNTRIES;
        Server::$CountryAliases = $COUNTRY_ALIASES;
    }

    static function LoadInternals()
    {
        if(DBManager::$Connected)
        {
            if(!empty(CacheManager::$ActiveManager) && CacheManager::$ActiveManager->GetData(DATA_CACHE_KEY_OPERATORS,Server::$Operators) && CacheManager::$ActiveManager->GetData(DATA_CACHE_KEY_GROUPS,Server::$Groups) && CacheManager::$ActiveManager->GetData(DATA_CACHE_KEY_ROLES,Server::$Roles))
                if(is_array(Server::$Operators) && is_array(Server::$Groups) && !empty(Server::$Operators) && !empty(Server::$Groups))
                {
                    return;
                }

            $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_OPERATORS . "` ORDER BY `bot` ASC, `firstname` ASC;");

            while($row = @DBManager::FetchArray($result))
            {
                if(!empty($row["system_id"]))
                {
                    Server::$Operators[$row["system_id"]] = new Operator($row["system_id"],$row["id"]);
                    Server::$Operators[$row["system_id"]]->SetValues($row);
                }
            }

            $result = DBManager::Execute(false, "SELECT * FROM `" . DB_PREFIX . DATABASE_GROUPS . "` ORDER BY `position` ASC;");
            if(!$result)
                $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_GROUPS . "`;");
            if($result)
                while($row = DBManager::FetchArray($result))
                    if(empty(Server::$Groups[$row["id"]]))
                        Server::$Groups[$row["id"]] = new UserGroup($row["id"],$row);

            $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_PREDEFINED . "`;");
            if($result)
                while($row = DBManager::FetchArray($result))
                    if(!empty(Server::$Operators[$row["internal_id"]]))
                        Server::$Operators[$row["internal_id"]]->PredefinedMessages[strtolower($row["lang_iso"])] = new PredefinedMessage($row["lang_iso"],$row);
                    else if(!empty(Server::$Groups[$row["group_id"]]))
                        Server::$Groups[$row["group_id"]]->PredefinedMessages[strtolower($row["lang_iso"])] = new PredefinedMessage($row["lang_iso"],$row);

            if(is_array(Server::$Groups))
                foreach(Server::$Groups as $group)
                    $group->SetDefaultPredefinedMessage();

            $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_SIGNATURES . "`;");
            if($result)
                while($row = DBManager::FetchArray($result))
                    if(!empty(Server::$Operators[$row["operator_id"]]))
                        Server::$Operators[$row["operator_id"]]->Signatures[strtolower($row["id"])] = new Signature($row);
                    else if(!empty(Server::$Groups[$row["group_id"]]))
                        Server::$Groups[$row["group_id"]]->Signatures[strtolower($row["id"])] = new Signature($row);

            Server::$Roles = array();
            $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_ROLES . "` ORDER BY `name` ASC;");
            while($row = @DBManager::FetchArray($result))
                Server::$Roles[$row["id"]] = new Role($row);

            if(!Is::Defined("LOGIN") && !empty(CacheManager::$ActiveManager))
            {
                CacheManager::$ActiveManager->SetData(DATA_CACHE_KEY_OPERATORS,Server::$Operators);
                CacheManager::$ActiveManager->SetData(DATA_CACHE_KEY_GROUPS,Server::$Groups);
                CacheManager::$ActiveManager->SetData(DATA_CACHE_KEY_ROLES,Server::$Roles);
            }
        }

        if(!empty($_POST["p_groups_0_id"]) && empty(Server::$Groups) && CALLER_TYPE == CALLER_TYPE_INTERNAL && !empty(Server::$Operators))
            Server::$Groups["DEFAULT"] = new UserGroup("DEFAULT");
    }

    static function LoadEvents()
    {
        if(!empty(CacheManager::$ActiveManager) && CacheManager::$ActiveManager->GetData(112,Server::$Events) && Server::$Events != null)
            return;

        Server::$Events = new EventList();
        $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_EVENTS . "` WHERE `priority`>=0 ORDER BY `priority` DESC;");
        while($row = @DBManager::FetchArray($result))
        {
            $Event = new Event($row);
            $result_urls = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_EVENT_URLS . "` WHERE `eid`='" . DBManager::RealEscape($Event->Id) . "';");
            while($row_url = @DBManager::FetchArray($result_urls))
            {
                $EventURL = new EventURL($row_url);
                $Event->URLs[$EventURL->Id] = $EventURL;
            }

            $result_funnel_urls = DBManager::Execute(true, "SELECT `ind`,`uid` FROM `" . DB_PREFIX . DATABASE_EVENT_FUNNELS . "` WHERE `eid`='" . DBManager::RealEscape($Event->Id) . "';");
            while($funnel_url = @DBManager::FetchArray($result_funnel_urls))
            {
                $Event->FunnelUrls[$funnel_url["ind"]] = $funnel_url["uid"];
            }
            $result_actions = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_EVENT_ACTIONS . "` WHERE `eid`='" . DBManager::RealEscape($Event->Id) . "';");
            while($row_action = @DBManager::FetchArray($result_actions))
            {
                $EventAction = new EventAction($row_action);
                $Event->Actions[$EventAction->Id] = $EventAction;

                if($EventAction->Type == 2 || $EventAction->Type == 22)
                {
                    $EventAction->Invitation = new Invitation();
                    $result_senders = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_EVENT_ACTION_SENDERS . "` WHERE `pid`='" . DBManager::RealEscape($EventAction->Id) . "' ORDER BY `priority` DESC;");
                    while($row_sender = @DBManager::FetchArray($result_senders))
                    {
                        $InvitationSender = new EventActionSender($row_sender);
                        $EventAction->Invitation->Senders[$InvitationSender->Id] = $InvitationSender;
                    }
                }
                else if($EventAction->Type < 2)
                {
                    $result_receivers = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_EVENT_ACTION_RECEIVERS . "` WHERE `action_id`='" . DBManager::RealEscape($EventAction->Id) . "';");
                    while($row_receiver = @DBManager::FetchArray($result_receivers))
                        $EventAction->Receivers[$row_receiver["receiver_id"]] = new EventActionReceiver($row_receiver);
                }
            }
            if(STATS_ACTIVE)
            {
                $result_goals = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_EVENT_GOALS . "` WHERE `event_id`='" . DBManager::RealEscape($Event->Id) . "';");
                while($row_goals = @DBManager::FetchArray($result_goals))
                    $Event->Goals[$row_goals["goal_id"]] = new EventAction($row_goals["goal_id"],9);
            }
            Server::$Events->Events[$Event->Id] = $Event;
        }
        if(!empty(CacheManager::$ActiveManager))
            CacheManager::$ActiveManager->SetData(112,Server::$Events,true);
    }

    static function LoadFilters()
    {
        if(!empty(CacheManager::$ActiveManager) && CacheManager::$ActiveManager->GetData(DATA_CACHE_KEY_FILTERS,Server::$Filters) && Server::$Filters != null)
            return;

        Server::$Filters = new FilterList();
        if(DBManager::$Connected)
            Server::$Filters->Populate();

        if(!empty(CacheManager::$ActiveManager))
            CacheManager::$ActiveManager->SetData(DATA_CACHE_KEY_FILTERS,Server::$Filters,true);
    }

    static function Replace($_toReplace,$_language=true,$_config=true,$_selectLanguage=true,$_stats=false,$_quotes=false)
    {
        if($_selectLanguage)
            LocalizationManager::AutoLoad();
        $to_replace = array();
        if($_language)
            $to_replace["lang"] = LocalizationManager::$TranslationStrings;
        if($_config)
            $to_replace["config"] = Server::$Configuration->File;

        foreach($to_replace as $type => $values)
            if(is_array($values))
                foreach($values as $short => $value)
                    if(!is_array($value))
                    {
                        if($type == "lang" && !$_stats && strpos($short,"stats_")===0)
                            continue;

                        if($_quotes && strpos($_toReplace,"<!--".$type."_".$short."-->")!==false)
                        {
                            $value = str_replace("\\'","'",$value);
                            $value = str_replace("'","\\'",$value);
                        }
                        $_toReplace = str_replace("<!--".$type."_".$short."-->",$value,$_toReplace);
                    }
                    else
                        foreach($value as $subKey => $subValue)
                        {
                            if(!is_array($subValue))
                                $_toReplace = str_replace("<!--".$type."_".$subKey."-->",$subValue,$_toReplace);
                        }

        if($_language)
            for($i=1;$i<=10;$i++)
                $_toReplace = str_replace("<!--lang_client_custom_".str_pad($i, 2, "0", STR_PAD_LEFT)."-->","",$_toReplace);

        $_toReplace = str_replace("<!--website-->","",$_toReplace);
        $_toReplace = str_replace("%domain%",@Server::$Configuration->File["gl_site_name"],$_toReplace);
        if(defined("LIVEZILLA_URL"))
        {
            $_toReplace = str_replace("<!--server-->",LIVEZILLA_URL,$_toReplace);
            $_toReplace = str_replace("<!--server_pr-->",LIVEZILLA_URL_PR,$_toReplace);
        }
        return str_replace("<!--file_chat-->",FILE_CHAT,$_toReplace);
    }

    static function SetTimeLimit($_time)
    {
        @set_time_limit($_time);
        $_time = min(max(@ini_get('max_execution_time'),30),$_time);
        return $_time;
    }

    static function LoadLibrary($_type,$_name)
    {
        if($_type == "ZEND")
        {
            if(!defined("LIB_ZEND_LOADED"))
            {
                define("LIB_ZEND_LOADED",true);
                $includePath = array();

                if(defined("IN_API"))
                    $includePath[] = './../../_lib/trdp/';
                else
                    $includePath[] = './_lib/trdp/';

                $includePath[] = get_include_path();
                $includePath = implode(PATH_SEPARATOR,$includePath);
                set_include_path($includePath);
                require_once 'Zend/Loader.php';
            }
            if(!defined($_name))
            {
                define($_name,true);
                Zend_Loader::loadClass($_name);
            }
        }
    }

    static function SaveDBStats()
    {
        if(false && DBManager::$Connected && !Is::Defined("NO_DB_LOG") && CALLER_TYPE != CALLER_TYPE_INTERNAL)
        {
            $fdb = array();
            $cqcount = DBManager::$QueryCount;

            $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_CONFIG . "` WHERE `key` LIKE 'gl_db_%';");
            while($result && $row = DBManager::FetchArray($result))
                $fdb[$row["key"]] = $row["value"];

            $qmax = (!empty($fdb["gl_db_q_max"])) ? $fdb["gl_db_q_max"] : 0;
            $ccount = (!empty($fdb["gl_db_c_count"]) && $fdb["gl_db_c_count"] < 1000) ? $fdb["gl_db_c_count"] : 0;
            $qcount = (!empty($fdb["gl_db_q_count"]) && $fdb["gl_db_c_count"] < 1000) ? $fdb["gl_db_q_count"] : $cqcount;
            $nqcount = (($ccount*$qcount)+$cqcount)/($ccount+1);
            $ccount++;
            DBManager::Execute(true, "REPLACE INTO `" . DB_PREFIX . DATABASE_CONFIG . "` (`key`, `value`) VALUES ('gl_db_c_count','" . intval($ccount) . "');");
            DBManager::Execute(true, "REPLACE INTO `" . DB_PREFIX . DATABASE_CONFIG . "` (`key`, `value`) VALUES ('gl_db_q_count','" . $nqcount . "');");

            if($cqcount > $qmax)
            {
                Logging::DebugLog($cqcount."---------------");
                Logging::DebugLog(DBManager::$Queries);
                DBManager::Execute(true, "REPLACE INTO `" . DB_PREFIX . DATABASE_CONFIG . "` (`key`, `value`) VALUES ('gl_db_q_max','" . $cqcount . "');");
            }
        }
    }

    static function IsPasswordAPI()
    {
        return function_exists("password_hash") && function_exists("password_verify") && defined("PASSWORD_DEFAULT");
    }

    static function GetVisionData()
    {
        SystemTime::GetExecutionTime();
        $operators = $visitors = $chats = 0;

        $result = DBManager::Execute(true, "SELECT count(*) AS `OPCOUNT` FROM `".DB_PREFIX.DATABASE_OPERATORS."` WHERE `last_active` > " . intval(time()-100) . ";");
        if($row = DBManager::FetchArray($result))
            $operators = $row["OPCOUNT"];

        $result = DBManager::Execute(true, "SELECT count(*) AS `VSCOUNT` FROM `".DB_PREFIX.DATABASE_VISITORS."` WHERE `closed`=0;");
        if($row = DBManager::FetchArray($result))
            $visitors = $row["VSCOUNT"];

        $result = DBManager::Execute(true, "SELECT count(*) AS `CHCOUNT` FROM `".DB_PREFIX.DATABASE_VISITOR_CHATS."` WHERE `chat_id`>0 AND `last_active` > " . intval(time()-100) . ";");
        if($row = DBManager::FetchArray($result))
            $chats = $row["CHCOUNT"];

        return json_encode(array(VERSION,$operators,$visitors,$chats,SystemTime::GetExecutionTime(false)));
    }

    static function CallURL($_url,$_postData=null)
    {
        $ch = curl_init();

        curl_setopt($ch, CURLOPT_URL, $_url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        //curl_setopt($ch, CURLOPT_PROXY, "127.0.0.1:8888");

        if($_postData != null)
        {
            curl_setopt($ch, CURLOPT_POST, 1);
            curl_setopt($ch, CURLOPT_POSTFIELDS,$_postData);
        }

        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

        $output = curl_exec($ch);

        curl_close($ch);

        return $output;
    }
}


class Communication
{
    static function DownloadSocialMedia($_fromAPI=false)
    {
        $downloadInitiated = false;
        if(is_array(Server::$Groups) && !empty(Server::$Configuration->Database["gl_sm"]))
        {
            $temporaryPruning = false;
            foreach(Server::$Groups as $gid => $group)
            {
                foreach(Server::$Configuration->Database["gl_sm"] as $channel)
                    if($channel->GroupId == $gid && $channel->LastConnect < (time()-($channel->ConnectFrequency*60)))
                    {
                        $ac = $channel->SetLastConnect(time());
                        if($ac==0)
                            continue;

                        $downloadInitiated = true;
                        $newTickets = $channel->Download();
                        $maxUpdateTime = array();
                        $dcountm = 0;

                        foreach($newTickets as $hash => $ticket)
                        {
                            if(count($ticket->Messages)==0)
                            {
                                Logging::GeneralLog("Missing Ticket Messages: empty ticket");
                                Logging::GeneralLog(serialize($ticket));
                                continue;
                            }

                            $newMessageInTicket = false;
                            $dcountm += count($ticket->Messages);
                            $id= $groupid= $language="";

                            if($exists = Ticket::Exists($hash,$id,$groupid,$language))
                            {
                                $ticket->Id = $id;
                                $ticket->Group = $groupid;
                                $ticket->Language = strtoupper($language);
                            }
                            else
                            {
                                $ticket->Id = CacheManager::GetObjectId("ticket_id",DATABASE_TICKETS);
                                $ticket->Channel = $channel->Type;
                                $ticket->Language = strtoupper(Server::$Configuration->File["gl_default_language"]);
                            }

                            if(!$exists && isset($ticket->ChannelUniqueId) && !empty($ticket->ChannelUniqueId))
                                $exists = Ticket::UniqueChannelIdExists($ticket->ChannelUniqueId);

                            $ticket->Group = $gid;
                            $tcreated = 0;
                            $time = time();

                            foreach($ticket->Messages as $index => $message)
                            {
                                $message->Hash = $hash;
                                $maxUpdateTime[$message->Id] = $message->Created;
                                $tcreated = ($tcreated>0) ? min($tcreated,$message->Created):$message->Created;
                                $message->ChannelId = $message->Id;
                                $message->Id = (($index==0) && !$exists) ? $ticket->Id : md5($message->Id);
                                $message->Edited = $message->Created;
                                $message->TicketId = $ticket->Id;
                                $message->Subject = $channel->Name;

                                $existMessTicketId = 0;
                                if(!TicketMessage::Exists($message->ChannelId,$existMessTicketId))
                                {
                                    $time = $message->Save($ticket->Id,true,null,$ticket);
                                    $newMessageInTicket = true;
                                }
                                else
                                {
                                    if($existMessTicketId != $message->TicketId)
                                    {
                                        $temporaryPruning = true;
                                    }
                                }

                                if(!TicketMessage::Exists($message->ChannelId))
                                {
                                    Logging::GeneralLog("Missing Ticket Message: " . $message->TicketId . " / " . $message->ChannelId);
                                    Logging::GeneralLog(serialize($message));
                                }
                            }
                            if(!$exists)
                            {
                                $ticket->ChannelId = $channel->Id;
                                $ticket->Save($hash,false);
                                $ticket->Created = $tcreated;
                            }
                            if(!$exists || $newMessageInTicket)
                            {
                                $ticket->Reactivate();
                                $ticket->SetLastUpdate($time);
                            }
                        }

                        arsort($maxUpdateTime);

                        foreach($maxUpdateTime as $uid => $utime)
                        {
                            if($channel->Type == 6)
                                $channel->SetLastUpdate($utime);
                            else if($channel->Type == 7)
                                $channel->SetLastUpdate($uid);
                            break;
                        }

                        CacheManager::FlushKey(DATA_CACHE_KEY_DBCONFIG);

                        if(!$_fromAPI)
                            break 2;
                    }
            }

            if($temporaryPruning)
            {
                DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_TICKETS . "` WHERE NOT EXISTS (SELECT * FROM `" . DB_PREFIX . DATABASE_TICKET_MESSAGES . "` WHERE `ticket_id` = `" . DB_PREFIX . DATABASE_TICKETS . "`.`id`)");
            }
        }



        return $downloadInitiated;
    }

    static function DownloadEmails($_fromAPI=false,$reload=false)
    {
        $downloadInitiated = false;
        if(is_array(Server::$Groups))
            foreach(Server::$Groups as $group)
            {
                $gmbout = Mailbox::GetById($group->TicketEmailOut);
                if(is_array($group->TicketEmailIn))
                    foreach($group->TicketEmailIn as $mid)
                        if(!empty(Server::$Configuration->Database["gl_email"][$mid]) && Server::$Configuration->Database["gl_email"][$mid]->LastConnect < (time()-(Server::$Configuration->Database["gl_email"][$mid]->ConnectFrequency*60)))
                        {
                            $ac = Server::$Configuration->Database["gl_email"][$mid]->SetLastConnect(time());
                            if($ac==0)
                                continue;

                            $downloadInitiated = true;

                            $newmails = Server::$Configuration->Database["gl_email"][$mid]->Download($reload,Server::$Configuration->Database["gl_email"][$mid]->Delete);

                            if(!empty($newmails) && is_array($newmails))
                                foreach($newmails as $temail)
                                {
                                    $temail->Email = (!empty($temail->ReplyTo)) ? $temail->ReplyTo : $temail->Email;

                                    if(TicketEmail::Exists($temail->Id))
                                        continue;

                                    $Ticket = null;
                                    $temail->MailboxId = $mid;
                                    $temail->GroupId = $group->Id;

                                    $exists = false;

                                    if(preg_match_all("/\[[a-zA-Z\d]{12}\]/", $temail->Subject . $temail->Body . $temail->BodyHTML, $matches))
                                    {
                                        if(empty(Server::$Configuration->File["gl_avhe"]))
                                            $temail->BodyHTML = "";

                                        foreach($matches[0] as $match)
                                        {
                                            $id=$groupid=$language="";
                                            if($exists=Ticket::Exists($match,$id,$groupid,$language))
                                            {
                                                $Ticket = new Ticket($id,"");
                                                $Ticket->Load(false,true);
                                                $lastOutgoing = true;

                                                if(count($Ticket->Messages) > 0)
                                                    if($Ticket->Messages[count($Ticket->Messages)-1]->Type != 1)
                                                        $lastOutgoing = false;

                                                $Ticket = new Ticket($id,true);
                                                $Ticket->ChannelId = $mid;
                                                $Ticket->Group = $groupid;
                                                $Ticket->Language = strtoupper($language);
                                                $Ticket->Messages[0]->Type = (($gmbout != null && $temail->Email == $gmbout->Email) || $temail->Email == Server::$Configuration->Database["gl_email"][$mid]->Email) ? 1 : 3;
                                                $Ticket->Messages[0]->Text = $temail->Body;

                                                if(!empty(Server::$Configuration->File["gl_avhe"]))
                                                    $Ticket->Messages[0]->HTML = $temail->BodyHTML;

                                                $Ticket->Messages[0]->Email = (!empty($temail->ReplyTo)) ? $temail->ReplyTo : $temail->Email;
                                                $Ticket->Messages[0]->ChannelId = $temail->Id;
                                                $Ticket->Messages[0]->Fullname = $temail->Name;
                                                $Ticket->Messages[0]->Subject = $temail->Subject;
                                                $Ticket->Messages[0]->Hash = strtoupper(str_replace(array("[","]"),"",$match));
                                                $Ticket->Messages[0]->Created = $temail->Created;
                                                $Ticket->Messages[0]->EmailCC = $temail->CC;
                                                $Ticket->Messages[0]->Save($id,false,null,$Ticket);

                                                $Ticket->LoadStatus();
                                                $Ticket->Reactivate();

                                                $isClosed = $Ticket->Editor != null && $Ticket->Editor->Status == 2;
                                                $isPending = $Ticket->Editor != null && $Ticket->Editor->Status == 4;

                                                $Ticket->SetLastUpdate(time(),$lastOutgoing || $isClosed || $isPending);
                                                break;
                                            }
                                        }
                                    }

                                    if(!$exists)
                                    {
                                        if($group->TicketHandleUnknownEmails == 1)
                                        {
                                            $temail->Save();
                                        }
                                        else if($group->TicketHandleUnknownEmails == 0)
                                        {
                                            $temail->Save();
                                            $temail->Destroy();

                                            $Ticket = new Ticket(CacheManager::GetObjectId("ticket_id",DATABASE_TICKETS),true);
                                            $Ticket->ChannelId = $mid;
                                            $Ticket->Group = $group->Id;
                                            $Ticket->Channel = 1;
                                            $Ticket->Language = strtoupper(Server::$Configuration->File["gl_default_language"]);
                                            $Ticket->Messages[0]->Id = $Ticket->Id;
                                            $Ticket->Messages[0]->Type = 3;
                                            $Ticket->Messages[0]->Text = $temail->Body;

                                            if(!empty(Server::$Configuration->File["gl_avhe"]))
                                                $Ticket->Messages[0]->HTML = $temail->BodyHTML;

                                            $Ticket->Messages[0]->Email = (!empty($temail->ReplyTo)) ? $temail->ReplyTo : $temail->Email;
                                            $Ticket->Messages[0]->ChannelId = $temail->Id;
                                            $Ticket->Messages[0]->Fullname = $temail->Name;
                                            $Ticket->Messages[0]->Created = $temail->Created;
                                            $Ticket->Messages[0]->Subject = $temail->Subject;
                                            $Ticket->Messages[0]->Attachments = $temail->Attachments;
                                            $Ticket->Messages[0]->EmailCC = $temail->CC;

                                            $Ticket->Messages[0]->SaveAttachments();
                                            $Ticket->Save();
                                            $Ticket->AutoAssignEditor();
                                            $Ticket->SetLastUpdate(time());

                                            LocalizationManager::AutoLoad(strtolower(Server::$Configuration->File["gl_default_language"]),true);
                                            $Ticket->SendAutoresponder(new Visitor(""),new VisitorBrowser("",false));
                                            LocalizationManager::AutoLoad("",true);
                                        }
                                    }

                                    foreach($temail->Attachments as $attid => $attdata)
                                    {
                                        if(strpos($attdata[0],".") === false)
                                        {
                                            file_put_contents(PATH_UPLOADS . $attdata[0],$attdata[2]);
                                            $tags = (count($attdata) > 3) ? $attdata[3] : "";
                                            KnowledgeBase::CreateEntry("SYSTEM", $attid, $attdata[0], 3, $attdata[1], 0, 100, 0,$tags);
                                            if(!$exists && $group->TicketHandleUnknownEmails == 1)
                                                $temail->SaveAttachment($attid);
                                            if(!empty($Ticket))
                                                $Ticket->Messages[0]->ApplyAttachment($attid);
                                        }
                                    }
                                }

                            if($reload)
                                Server::$Configuration->Database["gl_email"][$mid]->SetLastConnect(0);

                            if(!$_fromAPI)
                                return $downloadInitiated;
                        }
            }



        return $downloadInitiated;
    }

    static function SendChatTranscripts()
    {
        $result = DBManager::Execute(false, "SELECT * FROM `" . DB_PREFIX . DATABASE_CHAT_ARCHIVE . "` WHERE `chat_type`=1 AND `endtime`>0 AND `closed`>0 AND `transcript_sent`=0 LIMIT 1;");
        if($result)
            while($row = DBManager::FetchArray($result))
            {
                DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_CHAT_ARCHIVE . "` SET `transcript_sent`=1 WHERE `chat_id`='" . DBManager::RealEscape($row["chat_id"]) . "' LIMIT 1;");
                Communication::SendChatTranscript($row);
            }
        if(!empty(Server::$Configuration->File["gl_rm_chats"]) && Server::$Configuration->File["gl_rm_chats_time"] == 0)
            DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_CHAT_ARCHIVE . "` WHERE `transcript_sent` = '1';");
    }

    static function SendChatTranscript($row,$_custom=false,$_customReceivers="")
    {
        if(empty($row["transcript_html"]) && empty($row["transcript_text"]))
            return;

        $receiverList = (!$_custom) ? $row["transcript_receiver"] : $_customReceivers;
        Server::InitDataBlock(array("INTERNAL","INPUTS"));
        $defmailbox = Mailbox::GetDefaultOutgoing();
        $tData = array($row["transcript_text"],$row["transcript_html"]);

        for($i=0;$i<count($tData);$i++)
        {
            if($i == 1 && empty($tData[$i]))
                continue;

            $tData[$i] = str_replace(array("%fullname%","%efullname%"),$row["fullname"],$tData[$i]);
            $tData[$i] = str_replace(array("%email%","%eemail%"),$row["email"],$tData[$i]);
            $tData[$i] = str_replace("%rating%",Feedback::GetRatingAVG($row["chat_id"]),$tData[$i]);
            $subject = $row["subject"];
            $customs = @unserialize($row["customs"]);
            $fakeSender = "";
            foreach(Server::$Inputs as $index => $input)
                if($input->Active && $input->Custom && !isset(Server::$Groups[$row["group_id"]]->TicketInputsHidden[$index]))
                {
                    $cv="";
                    if($input->Type == "CheckBox")
                        $cv = ((!empty($customs[$input->Name])) ? "<!--lang_client_yes-->" : "<!--lang_client_no-->");
                    else if(!empty($customs[$input->Name]) || $input->Type == "ComboBox")
                        $cv = $input->GetClientValue(@$customs[$input->Name]);
                    $tData[$i] = str_replace("%custom".$index."%",$cv,$tData[$i]);
                }
            $tData[$i] = Server::Replace($tData[$i]);
            $tData[$i] = Mailbox::FinalizeDataBlock($tData[$i],$i==1);
        }

        $mailbox=null;
        if(!empty($row["group_id"]) && isset(Server::$Groups[$row["group_id"]]) && !empty(Server::$Groups[$row["group_id"]]->ChatEmailOut))
            $mailbox = Mailbox::GetById(Server::$Groups[$row["group_id"]]->ChatEmailOut);
        $mailbox = (!empty($mailbox)) ? $mailbox : $defmailbox;

        if($mailbox != null && (!empty(Server::$Configuration->File["gl_soct"]) || $_custom) && !empty($receiverList))
            Communication::SendEmail($mailbox, $receiverList, "", "", $mailbox->Email, $tData[0], $tData[1], $subject);

        if(!$_custom)
        {
            if(!empty(Server::$Configuration->File["gl_scto"]))
            {
                Server::InitDataBlock(array("INTERNAL"));
                $receivers = array();
                $resulti = DBManager::Execute(true, "SELECT `user_id` FROM `" . DB_PREFIX . DATABASE_VISITOR_CHAT_OPERATORS . "` WHERE `chat_id`='" . DBManager::RealEscape($row["chat_id"]) . "' AND `ltime`=0;");
                if($resulti)
                    while($rowi = DBManager::FetchArray($resulti))
                    {
                        if(!empty(Server::$Operators[$rowi["user_id"]]) && !in_array($rowi["user_id"],$receivers))
                            $receivers[] = $rowi["user_id"];
                        else
                            continue;
                        Communication::SendEmail($mailbox, Server::$Operators[$receivers[count($receivers) - 1]]->Email, "", "", $mailbox->Email, $tData[0], $tData[1], $subject);
                    }
            }

            if(!empty(Server::$Configuration->File["gl_sctg"]))
            {
                Server::InitDataBlock(array("GROUPS"));
                Communication::SendEmail($mailbox, Server::$Groups[$row["group_id"]]->Email, "", "", $mailbox->Email, $tData[0], $tData[1], $subject);
            }

            if(!empty($mailbox) && !empty(Server::$Configuration->File["gl_scct"]))
            {
                if(!empty(Server::$Configuration->File["gl_uvec"]))
                {
                    if(Mailbox::IsValidEmail($row["transcript_receiver"]))
                        $fakeSender = $row["transcript_receiver"];
                    else if(Mailbox::IsValidEmail($row["email"]))
                        $fakeSender = $row["email"];
                }
                Communication::SendEmail($mailbox, Server::$Configuration->File["gl_scct"], "", "", $mailbox->Email, $tData[0], $tData[1], $subject, false, null, $fakeSender);
            }
        }
    }

    static function SendPushMessages()
    {
        if(!empty(Server::$Configuration->File["gl_mpm"]) && DBManager::$Connected && defined("IS_PUSH_MESSAGE"))
        {
            $count=0;
            $result = DBManager::Execute(false, "SELECT * FROM `" . DB_PREFIX . DATABASE_PUSH_MESSAGES . "` WHERE `sent`=0 ORDER BY `created` ASC LIMIT 10;");
            if($result)
            {
                $data = array();
                while($row = @DBManager::FetchArray($result))
                    $data = array_merge($data,array('p_app_os_' . $count => $row["device_os"], 'p_device_id_' . $count => $row["device_id"], 'p_message_type_' . $count => $row["push_key"], 'p_message_' . $count => Encoding::Base64UrlEncode($row["push_value"]), 'p_chatpartner_id_' . $count => $row["chat_partner_id"], 'p_chat_id_' . $count++ => $row["chat_id"]));

                DBManager::Execute(false, "UPDATE `" . DB_PREFIX . DATABASE_PUSH_MESSAGES . "` SET `sent`=1 ORDER BY `created` ASC LIMIT 10;");
                if(!empty($data))
                {
                    $result = Server::CallURL(CONFIG_LIVEZILLA_PUSH, $data);

                    if($result !== "1")
                        handleError("116", " Push Message Error: " . $result,CONFIG_LIVEZILLA_PUSH,0);
                }
            }
        }
    }

    static function GetParameterAlias($_param)
    {
        if($_param == "rqst")
            return isset($_GET["rqst"]) ? $_GET["rqst"] : (isset($_GET["request"]) ? $_GET["request"] : "");

        return "";
    }

    static function GetSubHostParameter($_allowPost=true)
    {
        $value = "";
        if(isset($_GET["ws"]))
            $value = strtolower(Encoding::Base64UrlDecode($_GET["ws"]));
        else if($_allowPost && isset($_POST["p_host"]))
            $value = strtolower($_POST["p_host"]);
        if(strpos($value,"..")===false)
            return $value;
        return "";
    }

    static function GetScheme()
    {
        if(!empty(Server::$Configuration->File["gl_auhs"]))
            return SCHEME_HTTP_SECURE;

        if(isset(Server::$Configuration->File["gl_rhts"]) && Server::$Configuration->File["gl_rhts"] == "1")
            return SCHEME_HTTP_SECURE;

        $scheme = SCHEME_HTTP;
        if(!empty($_SERVER["HTTPS"]) && $_SERVER["HTTPS"]!="off")
            $scheme = SCHEME_HTTP_SECURE;
        else if(!empty($_SERVER["HTTP_X_HTTPS"]) && (strtolower($_SERVER["HTTP_X_HTTPS"])=="on" || $_SERVER["HTTP_X_HTTPS"]=="1"))
            $scheme = SCHEME_HTTP_SECURE;
        else if(!empty($_SERVER["HTTP_X_FORWARDED_PROTO"]) && strtolower($_SERVER["HTTP_X_FORWARDED_PROTO"]) == "https")
            $scheme = SCHEME_HTTP_SECURE;
        else if(!empty($_SERVER["SERVER_PORT"]) && $_SERVER["SERVER_PORT"] == 443)
            $scheme = SCHEME_HTTP_SECURE;
        else if(!empty($_SERVER["HTTP_SSL"]) && ($_SERVER["HTTP_SSL"] === true || $_SERVER["HTTP_SSL"] == "TRUE"))
            $scheme = SCHEME_HTTP_SECURE;
		else if(!empty($_SERVER["HTTP_CF_VISITOR"]) && strpos(strtolower($_SERVER["HTTP_CF_VISITOR"]),"https") !== false)
            $scheme = SCHEME_HTTP_SECURE;

        return $scheme;
    }

    static function GetIP($_dontmask=false,$_forcemask=false,$_hashed=false,$ip="")
    {
        $params = array(@Server::$Configuration->File["gl_sipp"]);
        foreach($params as $param)
            if(!empty($_SERVER[$param]))
            {
                $ipf = $_SERVER[$param];
                if(strpos($ipf,",") !== false)
                {
                    $parts = explode(",",$ipf);
                    foreach($parts as $part)
                        if(substr_count($part,".") == 3 || substr_count($part,":") >= 3)
                            $ip = trim($part);
                }
                else if(substr_count($ipf,".") == 3 || substr_count($ipf,":") >= 3)
                    $ip = trim($ipf);
            }

        if(empty($ip))
            $ip = $_SERVER["REMOTE_ADDR"];

        if((empty(Server::$Configuration->File["gl_maskip"]) || $_dontmask) && !$_forcemask)
            return $ip;
        else if(substr_count($ip,".")>2 || substr_count($ip,":")>3)
        {
            $hash = false;
            $masktype = !empty(Server::$Configuration->File["gl_miat"]) ? Server::$Configuration->File["gl_miat"] : 0;
            if($masktype==3)
                $hash = $masktype = 1;
            $split = (substr_count($ip,".") > 0) ? "." : ":";
            $parts = explode($split,$ip);
            $val="";
            for($i=0;$i<count($parts)-($masktype+1);$i++)
                $val .= $parts[$i].$split;
            for($i=0;$i<=$masktype;$i++)
                $val .= $split . "xxx";
            $val = str_replace("..",".",$val);
            $val = str_replace("::",":",$val);
            if($hash)
                $val = strtoupper(substr(md5($val),10,10));
            return $val;
        }

        if($_hashed)
            return md5($ip);

        return $ip;
    }

    static function GetHost()
    {
        $ip = Communication::GetIP(true);
        $host = @utf8_encode(@gethostbyaddr($ip));
        if(Server::$Configuration->File["gl_maskip"])
            $host = str_replace($ip,Communication::GetIP(),$host);
        return $host;
    }

    static function ReadParameter($_key, $_fallBack=null,$_b64encoded=true)
    {
        $types["hex"] = array("esc","etc","epc","echc","ovlc","ovlch","ovlct","ovlsc","fbshc","ecsgs","ecsge","ecsc","ecfs","ecfe");
        $types["int"] = array("pc","fbt","ovlts","h","po","cid","tc","echsp","echp","ovlsx","ovlsy","ovlsb","deactr","fbshb","fbshx","fbshy","fbml","fbmt","fbmr","fbmb","fbw","fbh","ovlp","ovlw","ovlh","ovlbr","ovlml","ecw","ech","cid","ecslw","ecmb","ecfo");
        $types["bool"] = array("ovltwo","hcgs","htgs","rgs","dl","ovlif");
        $types["url"] = array("eci","ecio");
        $types["isolang"] = array("ptl");

        if(in_array($_key,$types["hex"]))
        {
            return Communication::GetParameter($_key,$_fallBack,$nu,FILTER_VALIDATE_REGEXP,array("options"=>array("regexp"=>FILTER_VALIDATE_REGEXP_HEXCOLOR)));
        }
        else if(in_array($_key,$types["int"]))
        {
            return Communication::GetParameter($_key,$_fallBack,$nu,FILTER_VALIDATE_INT,null,0,$_b64encoded,$_b64encoded);
        }
        else if(in_array($_key,$types["url"]))
        {
            return Communication::GetParameter($_key,$_fallBack,$nu,FILTER_SANITIZE_URL);
        }
        else if(in_array($_key,$types["bool"]))
        {
            return !empty($_REQUEST[$_key]);
        }
        else if(in_array($_key,$types["isolang"]))
        {
            if(isset($_REQUEST[$_key]) && strlen($_REQUEST[$_key]) <= 5 && strlen($_REQUEST[$_key]) >= 1)
                return $_REQUEST[$_key];
            return $_fallBack;
        }
        else // default san str pass thru
        {
            return Communication::GetParameter($_key,$_fallBack,$nu,FILTER_SANITIZE_SPECIAL_CHARS,null,0,$_b64encoded,$_b64encoded);
        }
    }

    static function GetParameter($_key,$_default,&$_changed=false,$_filter=null,$_filteropt=array(),$_maxlen=0,$_dbase64=true,$_dbase64Url=true,$_ebase64=false,$_ebase64Url=false)
    {
        if(isset($_REQUEST[$_key]))
        {
            if($_dbase64Url)
                $value = Encoding::Base64UrlDecode($_REQUEST[$_key]);
            else if($_dbase64)
                $value = base64_decode($_REQUEST[$_key]);
            else
                $value = $_REQUEST[$_key];
            if($value != $_default)
                $_changed = true;
        }
        else if(isset($_SERVER[$_key]))
        {
            if($_SERVER[$_key] != $_default)
                $_changed = true;
            $value = $_SERVER[$_key];
        }
        else
            return $_default;
        $value = IOStruct::FilterParameter($value,$_default,$_filter,$_filteropt,$_maxlen);
        if($_ebase64Url)
            return Encoding::Base64UrlEncode($value);
        if($_ebase64)
            return base64_encode($value);
        return $value;
    }

    static function SendEmail($_account, $_email, $_emailcc, $_emailbcc, $_replyto, $_bodyText, $_bodyHTML, $_subject = "", $_test = false, $_attachments = null, $_fakeSender = "", $_senderName = "")
    {
        if($_account == null)
            $_account=Mailbox::GetDefaultOutgoing();
        if($_account == null)
            return null;

        $_bodyText = correctLineBreaks($_bodyText);

        require_once(LIVEZILLA_PATH . "_lib/objects.mail.inc.php");

        Logging::SecurityLog("Communication::SendMail",$_subject . " / " . $_bodyText);

        if(Logging::IsMailFlood())
            return null;

        $mailer = new MailSystem($_account, $_email, $_replyto, trim($_bodyText), trim($_bodyHTML), $_subject, $_test, $_attachments);
        $mailer->SenderName = $_senderName;
        $mailer->CC = $_emailcc;
        $mailer->BCC = $_emailbcc;
        $mailer->SendEmail($_fakeSender);
        return $mailer->Result;
    }

    static function GetTargetParameters()
    {
        $parameters = array("exclude"=>null,"include_group"=>null,"include_user"=>null);

        if(isset($_GET[GET_EXTERN_HIDDEN_GROUPS]))
        {
            $groups = Encoding::Base64UrlDecode($_GET[GET_EXTERN_HIDDEN_GROUPS]);
            if(strlen($groups) > 1)
                $parameters["exclude"] = explode("?",$groups);
            if(isset($_GET["group"]))
                $parameters["include_group"] = array(urldecode($_GET["group"]));
            if(isset($_GET["operator"]))
                $parameters["include_user"] = Operator::ReadParams();
            if(strlen($groups) == 1 && is_array(Server::$Groups))
                foreach(Server::$Groups as $gid => $group)
                    if(!@in_array($gid,$parameters["include_group"]))
                        $parameters["exclude"][] = $gid;
        }
        return $parameters;
    }

    static function GetTargetParameterString($_getParams="",$_allowed=null)
    {
        foreach($_GET as $key => $value)
            if($key != "template" && !($_allowed != null && !isset($_allowed[$key])))
            {
                $value = urldecode($value);
                if($value != "")
                    $_getParams.=((strlen($_getParams) == 0) ? $_getParams : "&") . urlencode($key) ."=" . urlencode($value);
            }
        return $_getParams;
    }

    static function GetTargetParameterArray($_allowed=null)
    {
        $list = array();
        foreach($_GET as $key => $value)
            if(!($_allowed != null && !isset($_allowed[$key])))
            {
                if($value != "")
                    $list[$key] = $value;
            }
        return $list;
    }

    static function GetTargetParameterForm($_getParams="",$_allowed)
    {
        foreach($_GET as $key => $value)
            if(isset($_allowed[$key]))
            {
                $value = urlencode($value);
                $_getParams.= "<input type=\"hidden\" name=\"".$key."\" value=\"".$value."\">";
            }
        return $_getParams;
    }

    static function CallUserAPI($_url,$_data)
    {
        $response = Server::CallURL($_url,$_data);

        if(empty($response))
        {
            handleError("128", "Error connecting USER API: " . $_url . " (" . $response . ")","",0);
            return null;
        }
        if(!empty($response) && is_object(json_decode($response)))
            return $response;
        else
            handleError("129", "Error connecting USER API, invalid response: " . $_url . " (" . $response . ")","",0);
        return null;
    }
}

class Colors
{
    static function CorrectHEX($_hex,$_hash=false){
        $_hex = str_replace("#", "", $_hex);
        if(strlen($_hex)>6)
            return '#000000';
        if(strlen($_hex)==3)
            $_hex = $_hex.$_hex;
        if($_hash)
            return "#".$_hex;
        return $_hex;
    }

    static function TransformHEX($_color,$_change=30,$rgb="")
    {
        $_color = Colors::CorrectHEX($_color,false);
        if(strlen($_color) != 6)
            return "#000000";
        for ($x=0;$x<3;$x++)
        {
            $c = hexdec(substr($_color,(2*$x),2)) - $_change;
            $c = ($c < 0) ? 0 : dechex($c);
            $rgb .= (strlen($c) < 2) ? "0".$c : $c;
        }
        return "#".$rgb;
    }

    static function TransformBrightness($_hex, $_perc)
    {
        $hslc = Colors::TransformHexToHSL($_hex);
        $val = ((1-$hslc["L"])*100)*$_perc;
        if($val)
        {
            $hslc['L'] = ($hslc['L'] * 100) + $val;
            $hslc['L'] = ($hslc['L'] > 100) ? 1 : $hslc['L']/100;
        }
        else
            $hslc['L'] += (1-$hslc['L'])/2;
        return Colors::TransformHSLToHex($hslc);
    }

    static function TransformHexToHSL($_col,$h=0)
    {
        $_col = Colors::CorrectHEX($_col,false);
        $R = hexdec($_col[0].$_col[1]);
        $G = hexdec($_col[2].$_col[3]);
        $B = hexdec($_col[4].$_col[5]);
        $hsl_array = array();
        $var_R = ($R/255);
        $var_G = ($G/255);
        $var_B = ($B/255);
        $var_Min = min($var_R, $var_G, $var_B);
        $var_Max = max($var_R, $var_G, $var_B);
        $del_Max = $var_Max - $var_Min;
        $l = ($var_Max + $var_Min)/2;
        if ($del_Max == 0)
        {
            $h = 0;
            $s = 0;
        }
        else
        {
            if($l < 0.5)
                $s = $del_Max /($var_Max + $var_Min);
            else
                $s = $del_Max /(2-$var_Max-$var_Min);

            $del_R = ((($var_Max - $var_R)/6) + ($del_Max/2))/$del_Max;
            $del_G = ((($var_Max - $var_G)/6) + ($del_Max/2))/$del_Max;
            $del_B = ((($var_Max - $var_B)/6) + ($del_Max/2))/$del_Max;

            if($var_R == $var_Max)
                $h = $del_B - $del_G;
            else if($var_G == $var_Max)
                $h = (1/3) + $del_R - $del_B;
            else if($var_B == $var_Max)
                $h = (2/3) + $del_G - $del_R;

            if($h<0)
                $h++;
            if($h>1)
                $h--;
        }
        $hsl_array['H'] = ($h*360);
        $hsl_array['S'] = $s;
        $hsl_array['L'] = $l;
        return $hsl_array;
    }

    static function TransformHSLToHex($_chsl)
    {
        list($H,$S,$L) = array( $_chsl['H']/360,$_chsl['S'],$_chsl['L'] );
        if( $S == 0 )
        {
            $r = $L * 255;
            $g = $L * 255;
            $b = $L * 255;
        }
        else
        {
            if($L<0.5)
                $var_2 = $L*(1+$S);
            else
                $var_2 = ($L+$S) - ($S*$L);
            $var_1 = 2 * $L - $var_2;
            $r = round(255 * Colors::TransformHueToRGB( $var_1, $var_2, $H + (1/3) ));
            $g = round(255 * Colors::TransformHueToRGB( $var_1, $var_2, $H ));
            $b = round(255 * Colors::TransformHueToRGB( $var_1, $var_2, $H - (1/3) ));
        }
        $r = dechex($r);
        $g = dechex($g);
        $b = dechex($b);
        $r = (strlen("".$r)===1) ? "0".$r:$r;
        $g = (strlen("".$g)===1) ? "0".$g:$g;
        $b = (strlen("".$b)===1) ? "0".$b:$b;
        return "#".$r.$g.$b;
    }

    static function TransformHueToRGB($_1,$_2,$_h)
    {
        if($_h<0)
            $_h += 1;
        if($_h > 1)
            $_h -= 1;
        if((6*$_h) < 1)
            return ($_1 + ($_2 - $_1) * 6 * $_h);
        if((2*$_h) < 1)
            return $_2;
        if((3*$_h) < 2)
            return ($_1 + ($_2-$_1) * ((2/3)-$_h) * 6);
        return $_1;
    }

    static function TransformHEXToRGB($_hex)
    {
        $_hex = str_replace("#", "", $_hex);
            if(strlen($_hex) == 3) {
            $r = hexdec(substr($_hex,0,1).substr($_hex,0,1));
            $g = hexdec(substr($_hex,1,1).substr($_hex,1,1));
            $b = hexdec(substr($_hex,2,1).substr($_hex,2,1));
        } else {
            $r = hexdec(substr($_hex,0,2));
            $g = hexdec(substr($_hex,2,2));
            $b = hexdec(substr($_hex,4,2));
        }
        $rgb = array($r, $g, $b);
        return $rgb;
    }
}

class BaseObject
{
	public $Id;
	public $Created;
	public $Edited;
	public $Creator;
	public $Editor;
	public $Status;
    public $Fullname;
    public $Company;
    public $Phone;
    public $Question;
    public $Email;
    public $Customs;
    public $IP;
    public $MaxChats = 9999;
    public $MaxChatAmount = 9999;
    public $MaxChatsStatus = GROUP_STATUS_BUSY;

    function GetInputData($_inputIndex,$_chat=true)
    {
        $data = array(111=>$this->Fullname,112=>$this->Email,113=>$this->Company,114=>$this->Question,116=>$this->Phone);
        if(isset($data[$_inputIndex]))
            $value = $data[$_inputIndex];
        else if(isset($this->Customs[$_inputIndex]))
            $value = $this->Customs[$_inputIndex];
        else
            return "";
        if(isset(Server::$Operators[CALLER_SYSTEM_ID]))
        {
            $lvl = Server::$Operators[CALLER_SYSTEM_ID]->GetInputMaskLevel($_inputIndex,$_chat);
            if($lvl > 0)
                return OperatorRequest::MaskData($value,$lvl);
        }
        return $value;
    }

    function IsMaxChatAmount()
    {
        return ($this->MaxChatAmount < 9999 && $this->MaxChatAmount > -1);
    }
}

class Action extends BaseObject
{
	public $URL = "";
	public $ReceiverUserId;
	public $ReceiverBrowserId;
	public $SenderSystemId;
	public $SenderUserId;
	public $SenderGroupId;
	public $Text;
	public $BrowserId;
	public $Status;
	public $TargetFile;
	public $Extension;
	public $Created;
	public $Displayed;
	public $Accepted;
	public $Declined;
	public $Closed;
	public $Exists;
	public $EventActionId = "";
}

class Post extends BaseObject
{
	public $Receiver;
	public $ReceiverGroup;
	public $ReceiverOriginal;
	public $Sender;
	public $SenderName;
	public $Persistent = false;
	public $Repost = false;
	public $ChatId;
	public $Translation = "";
	public $TranslationISO = "";
	public $HTML;
	public $Received;
	public $BrowserId = "";
    public $Micro = 0;
    public $APIObject = null;
    public $Whisper = false;

	function __construct()
   	{
		if(func_num_args() == 1)
		{
			$row = func_get_arg(0);
			$this->Id = $row["id"];
			$this->Sender = $row["sender"];
			$this->SenderName = $row["sender_name"];
			$this->Receiver = $row["receiver"];
			$this->ReceiverOriginal = $row["receiver_original"];
			$this->ReceiverGroup = $row["receiver_group"];
			$this->Received = !empty($row["received"]);
			$this->Text = $row["text"];
			$this->Created = $row["time"];
			$this->ChatId = $row["chat_id"];
			$this->Repost = !empty($row["repost"]);
			$this->Translation = $row["translation"];
			$this->TranslationISO = $row["translation_iso"];
			$this->BrowserId = $row["browser_id"];
            $this->Micro = $row["micro"];
            $this->Whisper = $row["whisper"]==1;
		}
		else if(func_num_args() >= 4)
		{
			$this->Id = func_get_arg(0);
			$this->Sender = func_get_arg(1);
			$this->Receiver = 
			$this->ReceiverOriginal = func_get_arg(2);
			$this->Text = func_get_arg(3);
			$this->Created = func_get_arg(4);
			$this->ChatId = func_get_arg(5);
			$this->SenderName = func_get_arg(6);
		}
   	}
	
	function GetXml()
	{
		$translation = (!empty($this->Translation)) ? " tr=\"".base64_encode($this->Translation)."\" triso=\"".base64_encode($this->TranslationISO)."\"" : "";
		return "<val id=\"".base64_encode($this->Id)."\" w=\"".base64_encode(($this->Whisper) ? 1 : 0)."\" rp=\"".base64_encode(($this->Repost) ? 1 : 0)."\" sen=\"".base64_encode($this->Sender)."\" m=\"".base64_encode($this->Micro)."\" rec=\"".base64_encode($this->ReceiverGroup)."\" reco=\"".base64_encode($this->ReceiverOriginal)."\" date=\"".base64_encode($this->Created)."\"".$translation.">".base64_encode($this->Text)."</val>\r\n";
	}

    function GetStatusXml($_received, $_noticed)
    {
        return "<su i=\"".base64_encode($this->Id)."\" re=\"".base64_encode($this->ReceiverOriginal)."\" r=\"".base64_encode($_received ? 1 : 0)."\" n=\"".base64_encode($_noticed ? 1 : 0)."\" />";
    }
	
	function GetCommand($_name)
	{
		if($this->Repost && empty($_name))
			$_name = LocalizationManager::$TranslationStrings["client_guest"];
	
		if(!empty($this->Translation))
			return "lz_chat_add_internal_text(\"".base64_encode($this->Translation."<div class=\"lz_message_translation\">".$this->Text."</div>")."\" ,\"".base64_encode($this->Id)."\",\"".base64_encode($_name)."\", ".To::BoolString($this->Repost).");";
		else
			return "lz_chat_add_internal_text(\"".base64_encode($this->Text)."\" ,\"".base64_encode($this->Id)."\",\"".base64_encode($_name)."\", ".To::BoolString($this->Repost).");";
	}
	
	function Save($_mTime=0)
	{
		if($_mTime==0)
		{
			$_mTime = SystemTime::GetMicroTime();
			$this->Created = $_mTime[1];
		}

        if($this->Receiver==$this->ReceiverOriginal && isset(Server::$Operators[$this->Receiver]) && !empty(Server::$Operators[$this->Receiver]->AppDeviceId) && Server::$Operators[$this->Receiver]->AppBackgroundMode)
            Server::$Operators[$this->Receiver]->AddPushMessage("", $this->Sender, $this->SenderName, 1, strip_tags($this->Text));

        DBManager::Execute(true, "INSERT INTO `" . DB_PREFIX . DATABASE_POSTS . "` (`id`,`chat_id`,`time`,`micro`,`sender`,`receiver`,`receiver_group`,`receiver_original`,`text`,`translation`,`translation_iso`,`received`,`persistent`,`repost`,`sender_name`,`browser_id`,`api_obj`,`whisper`) VALUES ('" . DBManager::RealEscape($this->Id) . "','" . DBManager::RealEscape($this->ChatId) . "'," . DBManager::RealEscape($this->Created) . "," . DBManager::RealEscape($_mTime[0]) . ",'" . DBManager::RealEscape($this->Sender) . "','" . DBManager::RealEscape($this->Receiver) . "','" . DBManager::RealEscape($this->ReceiverGroup) . "','" . DBManager::RealEscape($this->ReceiverOriginal) . "','" . DBManager::RealEscape($this->Text) . "','" . DBManager::RealEscape($this->Translation) . "','" . DBManager::RealEscape($this->TranslationISO) . "','" . DBManager::RealEscape($this->Received ? 1 : 0) . "','" . DBManager::RealEscape($this->Persistent ? 1 : 0) . "','" . DBManager::RealEscape($this->Repost ? 1 : 0) . "','" . DBManager::RealEscape($this->SenderName) . "','" . DBManager::RealEscape($this->BrowserId) . "','" . DBManager::RealEscape($this->APIObject != null ? json_encode($this->APIObject) : '') . "','" . DBManager::RealEscape($this->Whisper ? 1 : 0) . "');");
    }

    function SaveHistory($type = 0,$iid="",$gid="")
    {
        if(strpos($this->Text,"[__[invite_info:")!==false)
            return;

        $id = "";
        $baseId = date("Y").date("m").date("d");
        if(isset(Server::$Operators[$this->Sender]) && isset(Server::$Operators[$this->Receiver]))
        {
            $type = 0;
            $id = $baseId.strtoupper(min($this->Sender,$this->Receiver).max($this->Sender,$this->Receiver));
            $iid = min($this->Sender,$this->Receiver)."-".max($this->Sender,$this->Receiver);
        }
        else if(isset(Server::$Groups[$this->Receiver]) || GROUP_EVERYONE_INTERN == $this->Receiver)
        {
            $type = 2;
            $id = $baseId.strtoupper($this->Receiver);
            $gid = $this->Receiver;
        }

        if($type != 1)
        {
            $id = strtoupper(substr(md5($id),0,10));
            $cf = new Chat();
            if(($result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_CHAT_ARCHIVE . "` WHERE `chat_id`='" . DBManager::RealEscape($id) . "';")) && $row = DBManager::FetchArray($result))
                DBManager::Execute(true, "REPLACE INTO `" . DB_PREFIX . DATABASE_CHAT_ARCHIVE . "` (`time`, `endtime`, `closed`, `chat_id`, `external_id`, `fullname`, `internal_id`, `group_id`, `area_code`, `html`, `plaintext`, `transcript_text`, `transcript_html`, `email`, `company`, `phone`, `call_me_back`, `iso_language`, `iso_country`, `host`, `ip`, `gzip`, `transcript_sent`, `transcript_receiver`, `question`, `customs`, `subject`, `ticket_id`, `wait`, `duration`, `accepted`, `ended`, `chat_type`, `ref_url`) VALUES (" . $row["time"] . "," . time() . "," . $row["closed"] . ",'" . DBManager::RealEscape($id) . "','','','" . DBManager::RealEscape($iid) . "','" . DBManager::RealEscape($gid) . "','','" . DBManager::RealEscape($row["html"] . $cf->GetHTMLPost($this->Text, "", time(), $this->SenderName, $this->Sender)) . "','" . DBManager::RealEscape($row["plaintext"] . "\n" . $cf->GetPlainPost($this->Text, "", time(), $this->SenderName)) . "','', '', '', '', '', '0', '', '', '', '', '0', '1', '', '', '', '', '', '0', '0', '0', '0', ".intval($type).", '');");
            else
            {
                $stmt = DBManager::GetStatement("INSERT INTO `" . DB_PREFIX . DATABASE_CHAT_ARCHIVE . "` (`time`, `endtime`, `closed`, `chat_id`, `external_id`, `fullname`, `internal_id`, `group_id`, `area_code`, `html`, `plaintext`, `transcript_text`, `transcript_html`, `email`, `company`, `phone`, `call_me_back`, `iso_language`, `iso_country`, `host`, `ip`, `gzip`, `transcript_sent`, `transcript_receiver`, `question`, `customs`, `subject`, `ticket_id`, `wait`, `duration`, `accepted`, `ended`, `chat_type`, `ref_url`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);");
                $bi = 0;
                $bs = '';
                $one = 1;
                $plain = $cf->GetHTMLPost($this->Text, "", time(), $this->SenderName, $this->Sender);
                $html = $cf->GetPlainPost($this->Text, "", time(), $this->SenderName);
                $ti = time();
                $stmt->bind_param("iiisssssssssssssissssiisssssiiiiis",$ti,$ti,$bi,$id,$bs,$bs,$iid,$gid,$bs,$plain,$html,$bs,$bs,$bs,$bs,$bs,$bi,$bs,$bs,$bs,$bs,$bi,$one,$bs,$bs,$bs,$bs,$bs,$bi,$bi,$bi,$bi,$type,$bs);
                DBManager::ExecutePrepared($stmt);

                if(!empty($stmt->error))
                    Logging::DatabaseLog($stmt->error);

                $stmt->close();
            }
        }
    }
	
	function UpdatePostStatus($_systemId,$_noticed=false)
	{
		DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_POSTS . "` SET `noticed`=".intval($_noticed ? 1 : 0).",`received`='1',`persistent`='0',`updated`=".time()." WHERE `id`='" . DBManager::RealEscape($this->Id) . "' AND `receiver`='" . DBManager::RealEscape($_systemId) . "';");
	}

    function SetAPIObject($_obj)
    {
        DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_POSTS . "` SET `api_obj`='".DBManager::RealEscape(json_encode($_obj))."' WHERE `id`='" . DBManager::RealEscape($this->Id) . "';");
    }

    static function GetLastAPIObject($_chatId,$_type)
    {
        $brwsid = $_type == "request" ? "!=''" : "=''";
        if($result = DBManager::Execute(true, $d="SELECT `api_obj` FROM `" . DB_PREFIX . DATABASE_POSTS . "` WHERE `api_obj`!='' AND `browser_id`".$brwsid." AND `chat_id`='".DBManager::RealEscape($_chatId)."' ORDER BY `time` DESC, `micro` DESC LIMIT 1;"))
            if($row = DBManager::FetchArray($result))
                if(!empty($row["api_obj"]))
                    return json_decode($row["api_obj"]);
        return null;
    }

    static function ProcessPostForExternal($_operator,$_postId,$rec,$recgroup,$post,$time,$_group,$_translation,$_translationISO,$_whisper=false)
    {
        if(STATS_ACTIVE)
            Server::$Statistic->ProcessAction(ST_ACTION_INTERNAL_POST);

        $external = false;

        if(!empty($_operator->ExternalChats[$rec]) && $_group)
        {
            $_operator->ExternalChats[$rec]->Load();
            $_operator->ExternalChats[$rec]->Members[$rec] = true;
            $chatId = $_operator->ExternalChats[$rec]->ChatId;
            $receiverlist = $_operator->ExternalChats[$rec]->Members;

            $external = true;
        }
        else
        {
            $chatId = CacheManager::GetValueBySystemId($rec,"chat_id","");
            $receiverlist = array($rec=>$rec);
        }

        $opname = $_operator->Fullname;
        if(isset(Server::$Configuration->File["gl_sfnc"]) && Server::$Configuration->File["gl_sfnc"] === "0")
            $opname = $_operator->Firstname;

        $npost = new Post($_postId,$_operator->SystemId,"",$post,$time,$chatId,$opname);

        foreach($receiverlist as $systemid => $member)
        {
            if($_whisper && strpos($systemid,"_") !== false)
                continue;

            if($systemid==$_operator->SystemId || !empty($member->Declined))
                continue;

            if(!empty(Server::$Operators[$systemid]) && !empty(Server::$Groups[$recgroup]->Members[$systemid]))
                continue;

            $npost->Receiver = $systemid;
            $npost->Persistent = false;
            $npost->Translation = $_translation;
            $npost->TranslationISO = $_translationISO;
            $npost->ReceiverGroup = $recgroup;
            $npost->ReceiverOriginal = $rec;
            $npost->Whisper = $_whisper;
            $npost->Save();
        }

        if(!$_whisper && $external && !empty($_operator->ExternalChats[$rec]->Subject) && strpos($_operator->ExternalChats[$rec]->VisitId,"A_") === 0)
        {
            Server::CallURL($_operator->ExternalChats[$rec]->Subject,array("p_chat_id"=>$chatId,"p_text"=>$post));
        }
    }
}

class Message
{
    public $ChatId;
    public $Text;

    function __construct()
    {

    }
}

class Chat extends BaseObject
{
    public $Closed = 0;
    public $ChatId;
    public $TimeStart;
    public $TimeEnd;
    public $Language;
    public $OperatorId;
    public $VisitorId;
    public $Group;
    public $PlainText = "";
    public $HTML = "";
    public $Fullname = "";
    public $Email = "";
    public $Company = "";
    public $Phone = "";
    public $IP = "";
    public $Question = "";
    public $FirstPost;
    public $Host;
    public $AreaCode;
    public $Country;
    public $ChatType = 1;
    public $Wait;
    public $Duration;
    public $Accepted;
    public $ElementCount = 0;
    public $TicketId;
    public $Ended;
    public $CallMeBack;
    public $ReferenceURL = "";
    public $Tags = "";
    public $VisitorPosts = 0;
    public $OperatorPosts = 0;

    public $Customs;

    function __construct()
    {
        if(func_num_args() == 1)
            $this->Id = func_get_arg(0);
    }

    function Load()
    {
        $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_CHAT_ARCHIVE . "` WHERE `chat_id`='" . DBManager::RealEscape($this->ChatId) . "' AND `closed`>0 LIMIT 1;");
        if($result && $row = DBManager::FetchArray($result))
            $this->SetValues($row);
    }

    function SetValues($_row,$_api=false)
    {
        $this->ChatId = $_row["chat_id"];
        $this->Tags = $_row["tags"];
        $this->TimeStart = $_row["time"];
        $this->TimeEnd = max($_row["closed"],$_row["endtime"]);
        $this->Closed = $_row["closed"];
        if($_row["chat_type"]==1 && $_api)
            $this->OperatorId = Operator::GetUserId($_row["internal_id"]);
        else
            $this->OperatorId = $_row["internal_id"];
        $this->Language = strtoupper($_row["iso_language"]);
        $this->VisitorId = $_row["external_id"];
        $this->Group = $_row["group_id"];
        $this->HTML = $_row["html"];
        $this->PlainText = $_row["plaintext"];
        $this->IP = $_row["ip"];
        $this->Fullname = $_row["fullname"];
        $this->Question = $_row["question"];
        $this->Email = $_row["email"];
        $this->Company = $_row["company"];
        $this->Phone = $_row["phone"];
        $this->ChatType = $_row["chat_type"];
        $this->Country = $_row["iso_country"];
        $this->Accepted = $_row["accepted"];
        $this->Wait = $_row["wait"];
        $this->Duration = $_row["duration"];
        $this->Ended = $_row["ended"];
        $this->Host = $_row["host"];
        $this->TicketId = $_row["ticket_id"];
        $this->AreaCode = $_row["area_code"];
        $this->CallMeBack = $_row["call_me_back"];
        $this->CallMeBack = $_row["call_me_back"];
        $this->Customs = (!empty($_row["customs"])) ? @unserialize($_row["customs"]) : array();
        $this->ReferenceURL = $_row["ref_url"];
    }

    function GetXML($_permission,$_plain=true,$_showReduced=true,$xml="")
    {
        if($_permission || $_showReduced)
        {
            $xml = "<c full=\"".base64_encode("true")."\" u=\"".base64_encode($this->ReferenceURL)."\" q=\"".base64_encode($this->Question)."\" t=\"".base64_encode($this->ChatType)."\" ta=\"".base64_encode($this->Tags)."\" cid=\"".base64_encode($this->ChatId)."\" tid=\"".base64_encode($this->TicketId)."\" iid=\"".base64_encode($this->OperatorId)."\" gid=\"".base64_encode($this->Group)."\" cmb=\"".base64_encode($this->CallMeBack)."\" eid=\"".base64_encode($this->VisitorId)."\" en=\"".base64_encode($this->Fullname)."\" ts=\"".base64_encode($this->TimeStart)."\" cl=\"".base64_encode($this->Closed)."\" te=\"".base64_encode($this->TimeEnd)."\" em=\"".base64_encode($this->Email)."\" cp=\"".base64_encode($this->Phone)."\" ac=\"".base64_encode($this->AreaCode)."\" co=\"".base64_encode($this->Company)."\" il=\"".base64_encode($this->Language)."\" ic=\"".base64_encode($this->Country)."\" ho=\"".base64_encode($this->Host)."\" ip=\"".base64_encode($this->IP)."\" wt=\"".base64_encode($this->Wait)."\" dt=\"".base64_encode($this->Duration)."\" sr=\"".base64_encode($this->Accepted)."\" er=\"".base64_encode($this->Ended)."\">\r\n";
            if($_permission)
            {
                $html = "<div>" .$this->HTML. "</div>";
                $xml .= "<chtml>".base64_encode($html)."</chtml>\r\n";
                if($_plain)
                    $xml .= "<cplain>".base64_encode($this->PlainText)."</cplain>\r\n";
                if(!empty($this->Customs))
                    foreach($this->Customs as $custname => $value)
                        foreach(Server::$Inputs as $input)
                            if($input->Name == $custname && $input->Active && $input->Custom)
                                $xml .= "<cc cuid=\"".base64_encode($custname)."\">".base64_encode($input->GetClientValue($value))."</cc>\r\n";
            }
            $xml .= "</c>\r\n";
        }
        return $xml;
    }

    function Permission($_operatorId)
    {
        $permission = false;
        if(isset(Server::$Operators[$_operatorId]))
        {
            if($this->ChatType=="1")
                $permission = (Server::$Operators[$_operatorId]->GetPermission(2) == PERMISSION_FULL || (Server::$Operators[$_operatorId]->GetPermission(2) == PERMISSION_NONE && $_operatorId == $this->OperatorId) || (Server::$Operators[$_operatorId]->GetPermission(2) == PERMISSION_RELATED && in_array($this->Group,Server::$Operators[$_operatorId]->GetGroupList(true))));
            else if($this->ChatType=="2")
                $permission = (Server::$Operators[$_operatorId]->GetPermission(36) == PERMISSION_FULL || (in_array($this->Group,Server::$Operators[$_operatorId]->GetGroupList(true)) || GROUP_EVERYONE_INTERN == $this->Group));
            else if($this->ChatType=="0")
                $permission = (Server::$Operators[$_operatorId]->GetPermission(36) == PERMISSION_FULL || (strpos($this->OperatorId,$_operatorId)!==false));
        }
        return $permission;
    }

    function GetPlainPost($_post,$_translation,$_time,$_senderName)
    {
        $post = (empty($_translation)) ? $_post : $_translation." (".$_post.")";
        $post = str_replace("<br>","\r\n",trim($post));
        preg_match_all("/<a.*href=\"([^\"]*)\".*>(.*)<\/a>/iU", $post, $matches);
        $count = 0;
        foreach($matches[0] as $match)
        {
            if(strpos($matches[1][$count],"javascript:")===false)
                $post = str_replace($matches[0][$count],$matches[2][$count] . " (" . $matches[1][$count].") ",$post);
            $count++;
        }
        $post = html_entity_decode(strip_tags($post),ENT_COMPAT,"UTF-8");
        return "| " . date("d.m.Y H:i:s",$_time) . " | " . $_senderName .  ": " . trim($post);
    }

    function GetHTMLPost($_post,$_translation,$_time,$_senderName,$_senderId,$_whisper=false)
    {
        $post = (empty($_translation)) ? (($_whisper ? "(<!--lang_whisper-->) " : "") . $_post) : $_translation."<div class=\"lz_message_translation\">".$_post."</div>";
        $exPost = !isset(Server::$Operators[$_senderId]);
        $file = ($exPost) ? IOStruct::GetFile(LIVEZILLA_PATH . "mobile/templates/messageinternal.tpl") : IOStruct::GetFile(LIVEZILLA_PATH . "mobile/templates/messageexternal.tpl");
        $html = str_replace("<!--dir-->","ltr",$file);
        $html = str_replace("<!--t-->",$_whisper ? " WCMT" : "",$html);
        $html = str_replace("<!--message-->",$post,$html);
        $html = str_replace("<!--color-->","#3091f2",$html);
        $html = str_replace("<!--name-->",htmlentities($_senderName,ENT_QUOTES,'UTF-8'),$html);
        $html = str_replace("<!--time-->","<!--stime_".$_time."-->",$html);
        $avparams = ($exPost) ? "name=" . Encoding::Base64UrlEncode($_senderName) : "operator=".urlencode($_senderId);
        $html = str_replace("<!--avatar-->","<div style=\"background-image: url('" . LIVEZILLA_URL . "picture.php?".$avparams."');\"></div>",$html);
        return $html;
    }

    function GetPlainFile($_permission,$_download,$_externalFullname,$_fileCreated,$_fileName,$_fileId)
    {
        $result = (($_permission==PERMISSION_VOID) ? " (<!--lang_client_rejected-->)" : (($_permission!=PERMISSION_FULL && empty($_download)) ? " (<!--lang_client_rejected-->)":" (" . LIVEZILLA_URL . "getfile.php?id=" . $_fileId . ")"));
        return "| " . date("d.m.Y H:i:s",$_fileCreated) . " | " . $_externalFullname .  ": " . html_entity_decode(strip_tags($_fileName),ENT_COMPAT,"UTF-8") . $result;
    }

    function GetHTMLFile($_permission,$_download,$_externalFullname,$_fileCreated,$_fileName,$_fileId)
    {
        $post = (($_permission==PERMISSION_VOID) ? " (<!--lang_client_rejected-->)" : (($_permission!=PERMISSION_FULL && empty($_download))? $_fileName . " (<!--lang_client_rejected-->)": $this->GetHTMLFileLink($_fileName,$_fileId)));
        $file = IOStruct::GetFile(TEMPLATE_HTML_MESSAGE_INTERN);
        $html = str_replace("<!--dir-->","ltr",$file);
        $html = str_replace("<!--message-->",$post,$html);
        $html = str_replace("<!--color-->","#3091f2",$html);
        $html = str_replace("<!--name-->",$_externalFullname,$html);
        $html = str_replace("<!--time-->",date(DATE_RFC822,$_fileCreated),$html);
        return $html;
    }

    function GetHTMLFileLink($_fileName,$_fileId)
    {
        return "<a class=\"lz_chat_file\" href=\"". LIVEZILLA_URL . "getfile.php?id=" . $_fileId ."\" target=_\"blank\">" . $_fileName. "</a>";
    }

    function GetHTMLScreenshotLink($_fileId)
    {
        return "<a class=\"lz_chat_file\" href=\"". LIVEZILLA_URL . "getfile.php?file=screenshot.lzsc&id=" . $_fileId ."\" target=_\"blank\">screenshot.lzsc</a>";
    }

    function Generate($_chatId,$_externalFullname,$_plain=false,$_html=false,$_question="",$_startTime=0, $firstpost="")
    {
        $this->FirstPost = time();
        $entries_html = array();
        $entries_plain = array();

        $result_posts = DBManager::Execute(true, "SELECT `sender_name`,`text`,`sender`,`time`,`micro`,`translation`,`whisper` FROM `" . DB_PREFIX . DATABASE_POSTS . "` WHERE `repost`=0 AND (`receiver`=`receiver_original` OR `whisper`=1) AND `chat_id` = '" . DBManager::RealEscape($_chatId) . "' GROUP BY `id` ORDER BY `time` ASC, `micro` ASC LIMIT 500;");
        while($row_post = DBManager::FetchArray($result_posts))
        {
            $fileLink = false;

            if(strpos($row_post["text"],"[__[invite_info:")!==false)
                continue;

            $parts = explode("[__[",str_replace("]__]","",$row_post["text"]));
            $row_post["text"] = $parts[0];

            if($_html && isset($parts[1]) && strpos($parts[1],"file:") === 0)
            {
                $fid = str_replace("file:","",$parts[1]);
                $row_post["text"] = $this->GetHTMLFileLink($row_post["text"], $fid);
                $fileLink = true;
            }

            if($_html && isset($parts[1]) && strpos($parts[1],"screenshot:") === 0)
            {
                $fid = str_replace("screenshot:","",$parts[1]);
                $row_post["text"] = $this->GetHTMLScreenshotLink($fid);
                $fileLink = true;
            }

            $this->ElementCount++;
            $this->FirstPost = min($this->FirstPost,$row_post["time"]);
            $sender_name = (empty($row_post["sender_name"])) ? "<!--lang_client_guest-->" : $row_post["sender_name"];
            $vpost = strpos($row_post["sender"], "~") !== false;

            if($vpost)
                $this->VisitorPosts++;
            else
                $this->OperatorPosts++;

            if(!$fileLink && $vpost)
            {
                $row_post["text"] = htmlentities($row_post["text"],ENT_NOQUOTES,"UTF-8");
                $row_post["translation"] = htmlentities($row_post["translation"],ENT_NOQUOTES,"UTF-8");
            }
            $firstpost = (empty($firstpost)) ? $row_post["text"] : $firstpost;

            if($_plain)
            {
                if($row_post["whisper"] != 1)
                    $entries_plain[$row_post["time"]."apost".str_pad($row_post["micro"],10,"0",STR_PAD_LEFT)] = $this->GetPlainPost($row_post["text"],$row_post["translation"],$row_post["time"],$sender_name);
            }

            if($_html)
                $entries_html[$row_post["time"]."apost".str_pad($row_post["micro"],10,"0",STR_PAD_LEFT)] = $this->GetHTMLPost($row_post["text"],$row_post["translation"],$row_post["time"],$sender_name,$row_post["sender"],$row_post["whisper"]==1);
        }

        ksort($entries_plain);
        foreach($entries_plain as $row)
        {
            if(!empty($this->PlainText))
                $this->PlainText .= "\r\n";
            $this->PlainText .= trim($row);
        }

        ksort($entries_html);
        foreach($entries_html as $row)
        {
            if(!empty($this->HTML))
                $this->HTML .= "";
            $this->HTML .= trim($row);
        }
    }

    static function GetLastPost($_chatId,$_internal)
    {
        $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_POSTS . "` WHERE `chat_id`='" . DBManager::RealEscape($_chatId) . "' ORDER BY `time` DESC;");
        while($row = DBManager::FetchArray($result))
        {
            if(($_internal && isset(Server::$Operators[$row["sender"]])) || (!$_internal && !isset(Server::$Operators[$row["sender"]])))
                 return new Post($row);
        }
        return null;
    }

    static function GetLastPosts($_chatId,$_internal,$_max,$laterThan)
    {
        $posts = array();
        $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_POSTS . "` WHERE `chat_id`='" . DBManager::RealEscape($_chatId) . "' AND `time` > " . intval($laterThan) . " ORDER BY `time` DESC;");
        while($row = DBManager::FetchArray($result))
        {
            if(($_internal && isset(Server::$Operators[$row["sender"]])) || (!$_internal && !isset(Server::$Operators[$row["sender"]])))
                $posts[] = $row["text"];

            if(count($posts) >= $_max)
                return $posts;
        }
        return $posts;
    }

    static function GetPermissionSQL($_operatorId)
    {
        if(isset(Server::$Operators[$_operatorId]))
        {
            $excap = Server::$Operators[$_operatorId]->GetPermission(2);
            $incap = Server::$Operators[$_operatorId]->GetPermission(36);

            if($excap == PERMISSION_FULL && $incap == PERMISSION_FULL)
                return "";
            else if($excap == PERMISSION_FULL && $incap == PERMISSION_RELATED)
                return " AND (`chat_type`=1 OR (`chat_type`=2 AND (`group_id` IN ('".implode("','",Server::$Operators[$_operatorId]->Groups)."') OR `group_id`='".GROUP_EVERYONE_INTERN."')) OR (`chat_type`=0 AND `internal_id` LIKE '%".DBManager::RealEscape($_operatorId,true)."%'))";

            else if($excap == PERMISSION_RELATED && $incap == PERMISSION_FULL)
                return " AND (`chat_type`<>1 OR (`group_id` IN ('".implode("','",Server::$Operators[$_operatorId]->Groups)."')))";
            else if($excap == PERMISSION_RELATED && $incap == PERMISSION_RELATED)
                return " AND ((`chat_type`=1 AND `group_id` IN ('".implode("','",Server::$Operators[$_operatorId]->Groups)."')) OR (`chat_type`=2 AND (`group_id` IN ('".implode("','",Server::$Operators[$_operatorId]->Groups)."') OR `group_id`='".GROUP_EVERYONE_INTERN."')) OR (`chat_type`=0 AND `internal_id` LIKE '%".DBManager::RealEscape($_operatorId,true)."%'))";

            else if($excap == PERMISSION_NONE && $incap == PERMISSION_FULL)
                return " AND (`chat_type`<>1 OR (`internal_id`= '".DBManager::RealEscape($_operatorId)."'))";
            else if($excap == PERMISSION_NONE && $incap == PERMISSION_RELATED)
                return " AND ((`chat_type`=1 AND (`internal_id`= '".DBManager::RealEscape($_operatorId)."')) OR (`chat_type`=2 AND (`group_id` IN ('".implode("','",Server::$Operators[$_operatorId]->Groups)."') OR `group_id`='".GROUP_EVERYONE_INTERN."')) OR (`chat_type`=0 AND `internal_id` LIKE '%".DBManager::RealEscape($_operatorId,true)."%'))";
        }
        return "";
    }

    static function Destroy($_chatId)
    {
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_CHAT_ARCHIVE . "` WHERE `chat_id`='" . DBManager::RealEscape($_chatId) . "' LIMIT 1;");
        DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_VISITOR_CHATS . "` SET `archive_created`=2 WHERE `chat_id`='" . DBManager::RealEscape($_chatId) . "' LIMIT 1;");
    }

    static function GetPostsOfChat($_chatId)
    {
        $posts = array();
        if($result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_POSTS . "` WHERE `received`<>-1 AND `chat_id`='".DBManager::RealEscape($_chatId)."' ORDER BY `time` ASC, `micro` ASC;"))
            while($row = DBManager::FetchArray($result))
                $posts[] = new Post($row);
        return $posts;
    }

    static function GetMyPosts($_operatorSystemId,$_onlyNew=true)
    {
        $received = ($_onlyNew) ? "`received`=0 AND " : "";
        $messageFileCount = 0;
        $rows = array();
        if($result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_POSTS . "` WHERE ".$received."`receiver`='".DBManager::RealEscape($_operatorSystemId)."' ORDER BY `time` ASC, `micro` ASC;"))
            while($row = DBManager::FetchArray($result))
                $rows[] = $row;

        $posts = array();
        foreach($rows as $row)
        {
            array_push($posts,new Post($row));
            if(++$messageFileCount >= DATA_ITEM_LOADS && $posts[count($posts)-1]->Receiver == $posts[count($posts)-1]->ReceiverOriginal)
                break;
        }
        return $posts;
    }

    static function SaveToArchive($_chatId,$_userData,$_externalId,$_internalId,$_groupId,$_host,$_ip,$_transcriptSent=false,$_waitingtime,$_duration,$_startResult,$_endResult)
    {
        $udFullname = $_userData->Fullname;
        $udEmail = $_userData->Email;
        $udCompany = $_userData->Company;
        $udPhone = $_userData->Phone;
        $udQuestion = $_userData->Text;

        $result = DBManager::Execute(true, "SELECT `endtime`,`transcript_text`,`transcript_html`,`iso_language`,`time` FROM `" . DB_PREFIX . DATABASE_CHAT_ARCHIVE . "` WHERE `chat_type`=1 AND `chat_id`='" . DBManager::RealEscape($_chatId) . "' LIMIT 1;");
        $row = DBManager::FetchArray($result);
        Server::InitDataBlock(array("INTERNAL","GROUPS"));
        LocalizationManager::AutoLoad($row["iso_language"],true);
        CacheManager::SetDataUpdateTime(DATA_UPDATE_KEY_CHAT_ARCH);

        $udFullname = (empty($udFullname)) ? (LocalizationManager::$TranslationStrings["client_guest"] . " " . Visitor::GetNoName($_externalId.$_ip))  : $udFullname;

        $filter = new Chat();
        $filter->Generate($_chatId,$udFullname,true,true,$udQuestion,$row["time"]);
        $filter->PlainText = Server::Replace($filter->PlainText,true,false,false);
        $filter->HTML = Server::Replace($filter->HTML,true,false,false);

        if(!empty(Server::$Configuration->File["gl_oact"]) && !$filter->OperatorPosts){
            $_transcriptSent = true;
        }

        $tsData = array($row["transcript_text"],$row["transcript_html"]);
        for($i=0;$i<count($tsData);$i++)
        {
            if($i==1 && empty($tsData[$i]))
                continue;

            $tsData[$i] = Server::Replace($tsData[$i],true,false,false);
            if(!empty($filter->PlainText))
            {
                $tText = (($i==0) ? $filter->PlainText : nl2br(htmlentities($filter->PlainText,ENT_QUOTES,"UTF-8")))."<!--lz_ref_link-->";
                $tsData[$i] = str_replace("%localdate%",date("r",$filter->FirstPost),$tsData[$i]);
                if(strpos($tsData[$i],"%transcript%")===false && strpos($tsData[$i],"%mailtext%")===false)
                    $tsData[$i] .= $tText;
                else if(strpos($tsData[$i],"%transcript%")!==false)
                    $tsData[$i] = str_replace("%transcript%",$tText,$tsData[$i]);
                else if(strpos($tsData[$i],"%mailtext%")!==false)
                    $tsData[$i] = str_replace("%mailtext%",$tText,$tsData[$i]);
            }
            else
                $tsData[$i] = "";

            $tsData[$i] = str_replace("%company_logo_url%",Server::$Configuration->File["gl_cali"],$tsData[$i]);
            $tsData[$i] = str_replace(array("%email%","%eemail%"),$udEmail,$tsData[$i]);
            $tsData[$i] = str_replace(array("%fullname%","%efullname%"),$udFullname,$tsData[$i]);
            $tsData[$i] = str_replace("%rating%",Feedback::GetRatingAVG($_chatId),$tsData[$i]);

            if(isset(Server::$Groups[$_groupId]))
                $tsData[$i] = Server::$Groups[$_groupId]->TextReplace($tsData[$i],$row["iso_language"]);

            if(!empty($_internalId) && $_internalId != SYSTEM)
                $tsData[$i] = Server::$Operators[$_internalId]->TextReplace($tsData[$i]);
        }

        $name = (!empty($udFullname)) ? ",`fullname`='".DBManager::RealEscape($udFullname)."'" : "";

        DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_CHAT_ARCHIVE . "` SET `external_id`='" . DBManager::RealEscape($_externalId) . "',`closed`='" . DBManager::RealEscape(time()) . "'" . $name . ",`internal_id`='" . DBManager::RealEscape($_internalId) . "',`group_id`='" . DBManager::RealEscape($_groupId) . "',`html`='" . DBManager::RealEscape($filter->HTML) . "',`plaintext`='" . DBManager::RealEscape($filter->PlainText) . "',`transcript_text`='" . DBManager::RealEscape($tsData[0]) . "',`transcript_html`='" . DBManager::RealEscape($tsData[1]) . "',`fullname`='" . DBManager::RealEscape($udFullname) . "',`email`='" . DBManager::RealEscape($udEmail) . "',`company`='" . DBManager::RealEscape($udCompany) . "',`phone`='" . DBManager::RealEscape($udPhone) . "',`host`='" . DBManager::RealEscape($_host) . "',`ip`='" . DBManager::RealEscape($_ip) . "',`gzip`=0,`wait`='" . DBManager::RealEscape($_waitingtime) . "',`duration`='" . DBManager::RealEscape($_duration) . "',`accepted`='" . DBManager::RealEscape($_startResult) . "',`ended`='" . DBManager::RealEscape($_endResult) . "',`customs`='" . DBManager::RealEscape(serialize($_userData->FormatChatArchiveArray())) . "',`transcript_sent`='" . DBManager::RealEscape(((((empty(Server::$Configuration->File["gl_soct"]) && empty(Server::$Configuration->File["gl_scct"]) && empty(Server::$Configuration->File["gl_scto"]) && empty(Server::$Configuration->File["gl_sctg"])) || empty($tsData) || $filter->ElementCount < 1 || $_transcriptSent)) ? "1" : "0")) . "',`question`='" . DBManager::RealEscape($udQuestion) . "' WHERE `chat_id`='" . DBManager::RealEscape($_chatId) . "' AND `closed`=0 LIMIT 1;");
        $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_TICKET_MESSAGES . "` WHERE `channel_id`='" . DBManager::RealEscape($_chatId) . "';");
        if($result && $rowc = DBManager::FetchArray($result))
        {
            $Ticket = new Ticket($rowc["ticket_id"],true);
            $Ticket->LinkChat($rowc["channel_id"],$rowc["id"]);
        }
    }

    static function CloseChats()
    {
        Server::InitDataBlock(array("EVENTS"));
        $result = DBManager::Execute(false, "SELECT * FROM `" . DB_PREFIX . DATABASE_CHAT_ARCHIVE . "` WHERE `chat_type`=1 AND `closed`=0 AND `transcript_sent`=0;");
        while($row = DBManager::FetchArray($result))
        {
            $results = DBManager::Execute(false, "SELECT * FROM `" . DB_PREFIX . DATABASE_VISITOR_CHATS . "` WHERE `chat_id`='" . DBManager::RealEscape($row["chat_id"]) . "' AND (`exit`>0 OR `last_active`<" . (time() - Server::$Configuration->File["timeout_track"]) . ");");
            if($results && $rows = DBManager::FetchArray($results))
            {
                $botchat = !empty($row["internal_id"]) && Server::$Operators[$row["internal_id"]]->IsBot;
                $chat = new VisitorChat($rows);
                $chat->LoadMembers();
                $startResult = 0;
                $endResult = 0;

                if(empty($rows["exit"]))
                    $chat->CloseChat();

                $lastOp = $chat->GetHostOperator();

                if($botchat)
                {
                    $waitingtime = 1;
                    $startResult = 1;
                }
                else
                {
                    $waitingtime = $chat->GetTotalWaitingTime($startResult,$endResult);
                }

                $duration = $chat->GetTotalDuration();
                $visitor = new Visitor($chat->UserId);
                $visitor->Load();
                $visitor->LoadVisitorData();

                foreach(Server::$Events->Events as $event)
                {
                    if($event->TriggerChatClosed)
                    {
                        foreach($event->Actions as $action)
                        {
                            if($action->Type == 7)
                            {
                                $chatObj = new Chat();
                                $chatObj->ChatId = $row["chat_id"];
                                $chatObj->Load();
                                $action->Execute("closechat",$visitor,$chatObj);
                            }
                        }
                    }
                }

                Chat::SaveToArchive($row["chat_id"],$visitor->VisitorData,$rows["visitor_id"],$lastOp,$rows["request_group"],$visitor->Host,$visitor->IP,(empty(Server::$Configuration->File["gl_sctb"]) && $botchat),$waitingtime,$duration,$startResult,$endResult);

                if(!empty(Server::$Configuration->File["gl_actt"]) && !empty($visitor->VisitorData->Email) && $rows["internal_active"] == 0 && !$botchat)
                {
                    Ticket::CreateFromChatArchive($row["chat_id"]);
                }
            }
        }
    }

    static function SetTicketId($_chatId,$_visitorId,$_ticketId)
    {
        if($_chatId != "")
        {
            DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_CHAT_ARCHIVE . "` SET `ticket_id`='" . intval($_ticketId) . "' WHERE `chat_id`='" . intval($_chatId) . "' LIMIT 1;");
            DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_VISITOR_CHATS . "` SET `chat_ticket_id`='" . intval($_ticketId) . "' WHERE `chat_id`='" . intval($_chatId) . "' LIMIT 1;");
        }
        else if($_visitorId != "")
        {
            DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_CHAT_ARCHIVE . "` SET `ticket_id`='" . intval($_ticketId) . "' WHERE `external_id`='" . DBManager::RealEscape($_visitorId) . "' AND `time` > ".(time()-7200)." AND `ticket_id`='';");
            DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_VISITOR_CHATS . "` SET `chat_ticket_id`='" . intval($_ticketId) . "' WHERE `visitor_id`='" . DBManager::RealEscape($_visitorId) . "' AND `first_active` > ".(time()-7200)." AND `chat_ticket_id`='';");
        }
        CacheManager::SetDataUpdateTime(DATA_UPDATE_KEY_CHAT_ARCH);
    }

    static function KeepAliveAPIChats()
    {
        // check necessity
        $result = DBManager::Execute(false, "SELECT `last_active` FROM `".DB_PREFIX.DATABASE_VISITOR_CHATS."` WHERE `external_close`=0 AND `internal_closed`=0 AND `internal_declined`=0 AND `visit_id` LIKE 'A_%' LIMIT 1;");
        if($row = DBManager::FetchArray($result))
            if(!empty($row["last_active"]))
                if($row["last_active"] == time())
                    return;
        
        // keep alive api chats
        DBManager::Execute(true, "UPDATE `".DB_PREFIX.DATABASE_VISITOR_CHATS."` SET `last_active` = " . intval(time()) . " WHERE `external_close`=0 AND `internal_closed`=0 AND `internal_declined`=0 AND `visit_id` LIKE 'A_%';");
        if(DBManager::GetAffectedRowCount() > 0)
        {
            DBManager::Execute(true, "UPDATE `".DB_PREFIX.DATABASE_VISITOR_BROWSERS."` SET `last_active` = " . intval(time()) . " WHERE `closed`=0 AND `visit_id` LIKE 'A_%';");
        }
    }
}

class Filter extends BaseObject
{
    public $Type = 0;
    public $IP;
    public $Expiredate;
    public $Userid = "";
    public $Reason = "";
    public $Filtername = "";
    public $Activestate;
    public $Exertion;
    public $Languages;
    public $Countries;
    public $AllowChats;
    public $AllowTickets;
    public $AllowTracking;
    public $Subject = "";
    public $Email = "";

    function __construct($_id)
    {
        $this->Id = $_id;
        $this->Edited = time();
    }

    function GetXML()
    {
        return "<val t=\"".base64_encode($this->Type)."\" e=\"".base64_encode($this->Email)."\" s=\"".base64_encode($this->Subject)."\" active=\"".base64_encode($this->Activestate)."\" atr=\"".base64_encode(($this->AllowTracking) ? "1" : "0")."\" at=\"".base64_encode(($this->AllowTickets) ? "1" : "0")."\" ac=\"".base64_encode(($this->AllowChats) ? "1" : "0")."\" edited=\"".base64_encode($this->Edited)."\" editor=\"".base64_encode($this->Editor)."\" c=\"".base64_encode($this->Countries)."\" expires=\"".base64_encode($this->Expiredate)."\" creator=\"".base64_encode($this->Creator)."\" created=\"".base64_encode($this->Created)."\" userid=\"".base64_encode($this->Userid)."\" ip=\"".base64_encode($this->IP)."\" filtername=\"".base64_encode($this->Filtername)."\" filterid=\"".base64_encode($this->Id)."\" reason=\"".base64_encode($this->Reason)."\" exertion=\"".base64_encode($this->Exertion)."\" languages=\"".base64_encode($this->Languages)."\" />\r\n";
    }

    function Load()
    {
        $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_FILTERS . "` WHERE `id`='" . DBManager::RealEscape($this->Id) . "' LIMIT 1;");
        if($result && $row = DBManager::FetchArray($result))
            $this->SetValues($row);
    }

    function SetValues($_row)
    {
        $this->Type = (isset($_row["type"])) ? $_row["type"] : 0;
        $this->Creator = $_row["creator"];
        $this->Created = $_row["created"];
        $this->Editor = $_row["editor"];
        $this->Edited = $_row["edited"];
        $this->IP = $_row["ip"];
        $this->Expiredate = $_row["expiredate"];
        $this->Userid = $_row["visitor_id"];
        $this->Reason = $_row["reason"];
        $this->Filtername = $_row["name"];
        $this->Id = $_row["id"];
        $this->Activestate = $_row["active"];
        $this->Exertion = $_row["exertion"];
        $this->Languages = $_row["languages"];
        $this->Countries = $_row["countries"];
        $this->AllowChats = !empty($_row["allow_chats"]);
        $this->AllowTickets = !empty($_row["allow_tickets"]);
        $this->AllowTracking = !empty($_row["allow_tracking"]);
        $this->Email = (isset($_row["email"])) ? $_row["email"] : "";
        $this->Subject = (isset($_row["subject"])) ? $_row["subject"] : "";
    }

    function Save()
    {
        $this->Destroy();
        DBManager::Execute(true, "INSERT IGNORE INTO `" . DB_PREFIX . DATABASE_FILTERS . "` (`creator`, `created`, `type`, `editor`, `edited`, `ip`, `expiredate`, `visitor_id`, `reason`, `name`, `id`, `active`, `exertion`, `languages`, `countries`, `allow_chats`, `allow_tickets`, `allow_tracking`, `email`, `subject`) VALUES ('" . DBManager::RealEscape($this->Creator) . "', '" . DBManager::RealEscape($this->Created) . "'," . intval($this->Type) . ",'" . DBManager::RealEscape($this->Editor) . "', '" . DBManager::RealEscape($this->Edited) . "','" . DBManager::RealEscape($this->IP) . "', '" . DBManager::RealEscape($this->Expiredate) . "','" . DBManager::RealEscape($this->Userid) . "', '" . DBManager::RealEscape($this->Reason) . "','" . DBManager::RealEscape($this->Filtername) . "', '" . DBManager::RealEscape($this->Id) . "','" . DBManager::RealEscape($this->Activestate) . "', '" . DBManager::RealEscape($this->Exertion) . "','" . DBManager::RealEscape($this->Languages) . "', '" . DBManager::RealEscape($this->Countries) . "', " . intval(($this->AllowChats) ? 1 : 0) . ", " . intval(($this->AllowTickets) ? 1 : 0) . ", " . intval(($this->AllowTracking) ? 1 : 0) . ", '" . DBManager::RealEscape($this->Email) . "','" . DBManager::RealEscape($this->Subject) . "');");
    }

    function Destroy()
    {
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_FILTERS . "` WHERE `id`='" . DBManager::RealEscape($this->Id) . "' LIMIT 1;");
        if(!empty(CacheManager::$ActiveManager))
            CacheManager::$ActiveManager->SetDataUpdateTime(DATA_UPDATE_KEY_FILTERS);
    }

    static function IsFlood($_ip,$_userId)
    {

            return false;

    }

    static function CreateFloodFilter($_ip,$_userId)
    {

    }

    static function Create($_ip,$_userId,$_reason,$_expireDays=2,$_cookie=false,$_chats=false)
    {
        $filter = new Filter(md5(uniqid(rand())));
        $filter->Creator = "SYSTEM";
        $filter->Created = time();
        $filter->Editor = "SYSTEM";
        $filter->Edited = time();
        $filter->IP = $_ip;
        $filter->Expiredate = $_expireDays * 86400;
        $filter->Userid = $_userId;
        $filter->Reason = "";
        $filter->Filtername = $_reason;
        $filter->Activestate = 1;
        $filter->Exertion = 0;
        $filter->Languages = "";
        $filter->Countries = "";
        $filter->AllowChats = $_chats;
        $filter->Save();
        CacheManager::FlushKey(DATA_CACHE_KEY_FILTERS);
        CacheManager::SetDataUpdateTime(DATA_UPDATE_KEY_FILTERS);
    }
}

class FilterList
{
	public $Filters;
	public $Message;
    public $IsUserFilter;
    public $IsEmailFilter;
	
	function __construct()
   	{
		$this->Filters = Array();
   	}
	
	function Populate()
	{
		if($result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_FILTERS . "`;"))
			while($row = DBManager::FetchArray($result))
			{
				$filter = new Filter($row["id"]);
				$filter->SetValues($row);
				$this->Filters[$filter->Id] = $filter;

                if($filter->Type == 0)
                    $this->IsUserFilter = true;
                else
                    $this->IsEmailFilter = true;
			}
	}

    function MatchEmail($_email,$_subject)
    {
        if(!$this->IsEmailFilter)
            return false;

        foreach($this->Filters as $filter)
        {
            if($filter->Type != 1 || $filter->Activestate == FILTER_TYPE_INACTIVE)
                continue;

            $compare["match_email"] = Is::WildcardMatch($filter->Email,$_email);
            $compare["match_subject"] = Is::WildcardMatch($filter->Subject,$_subject);
            $match = false;

            if($compare["match_email"] && $filter->Exertion == FILTER_EXERTION_BLACK && !empty($filter->Email))
                $match = true;
            else if(!$compare["match_email"] && $filter->Exertion == FILTER_EXERTION_WHITE && !empty($filter->Email))
                $match = true;
            else if($compare["match_subject"] && $filter->Exertion == FILTER_EXERTION_BLACK && !empty($filter->Subject))
                $match = true;
            else if(!$compare["match_subject"] && $filter->Exertion == FILTER_EXERTION_WHITE && !empty($filter->Subject))
                $match = true;

            if($match)
                Logging::EmailLog("Blocked Email/Ticket by filter '". $filter->Filtername . "' - " .  (($compare["match_email"]) ? "Email match " : "Subject match ") . $_email . " - " . $_subject);

            if($match)
                return true;
        }
        return false;
    }
	
	function MatchUser($_languages, $_userid, $_country = "")
	{
        if(!$this->IsUserFilter)
            return false;

        foreach($this->Filters as $filter)
        {
            if($filter->Type != 0 || $filter->Activestate == FILTER_TYPE_INACTIVE)
                continue;

            $this->Message = $filter->Reason;

            $compare["match_ip"] = Is::WildcardMatch($filter->IP,Communication::GetIP(true,false)) || Is::WildcardMatch($filter->IP,Communication::GetIP(false,true));

            if(empty(Visitor::$BrowserLanguage))
                $compare["match_lang"] = $this->IsoListCompare($_languages,$filter->Languages);
            else
                $compare["match_lang"] = $this->IsoListCompare(Visitor::$BrowserLanguage,$filter->Languages);

            $compare["match_country"] = $this->IsoListCompare($_country,$filter->Countries);
            $compare["match_id"] = ($filter->Userid == $_userid);

            if($compare["match_ip"] && $filter->Exertion == FILTER_EXERTION_BLACK && !empty($filter->IP))
                define("ACTIVE_FILTER_ID",$filter->Id);
            else if(!$compare["match_ip"] && $filter->Exertion == FILTER_EXERTION_WHITE && !empty($filter->IP))
                define("ACTIVE_FILTER_ID",$filter->Id);
            else if($compare["match_lang"] && $filter->Exertion == FILTER_EXERTION_BLACK && !empty($filter->Languages))
                define("ACTIVE_FILTER_ID",$filter->Id);
            else if(!$compare["match_lang"] && $filter->Exertion == FILTER_EXERTION_WHITE && !empty($filter->Languages))
                define("ACTIVE_FILTER_ID",$filter->Id);
            else if($compare["match_country"] && $filter->Exertion == FILTER_EXERTION_BLACK && !empty($filter->Countries))
                define("ACTIVE_FILTER_ID",$filter->Id);
            else if(!$compare["match_country"] && $filter->Exertion == FILTER_EXERTION_WHITE && !empty($filter->Countries))
                define("ACTIVE_FILTER_ID",$filter->Id);
            else if($compare["match_id"] && $filter->Exertion == FILTER_EXERTION_BLACK && !empty($filter->Userid))
                define("ACTIVE_FILTER_ID",$filter->Id);
            else if(!$compare["match_id"] && $filter->Exertion == FILTER_EXERTION_WHITE && !empty($filter->Userid))
                define("ACTIVE_FILTER_ID",$filter->Id);

            if(defined("ACTIVE_FILTER_ID"))
            {
                define("FILTER_ALLOW_TICKETS",$filter->AllowTickets);
                define("FILTER_ALLOW_TRACKING",$filter->AllowTracking);
                define("FILTER_ALLOW_CHATS",$filter->AllowChats);
                return true;
            }
        }
		return false;
	}
	
	function IpCompare($_ip, $_comparer)
	{
		$array_ip = explode(".",$_ip);
		$array_comparer = explode(".",$_comparer);
		if(count($array_ip) == 4 && count($array_comparer) == 4)
		{
			foreach($array_ip as $key => $octet)
			{
				if($array_ip[$key] != $array_comparer[$key])
				{
					if($array_comparer[$key] == -1)
						return true;
					return false;
				}
			}
			return true;
		}
		else
			return false;
	}
	
	function IsoListCompare($_lang, $_comparer)
	{
		$array_lang = explode(",",$_lang);
		$array_comparer = explode(",",$_comparer);
		foreach($array_lang as $key => $lang)
			foreach($array_comparer as $langc)
				if(strtoupper($array_lang[$key]) == strtoupper($langc))
					return true;
		return false;
	}
}

class EventList
{
	public $Events;
	
	function __construct()
   	{
		$this->Events = array();
   	}
	function GetActionById($_id)
	{
		foreach($this->Events as $event)
		{
			foreach($event->Actions as $action)
				if($action->Id == $_id)
					return $action;
		}
		return null;
	}

    function IsInternalAction()
    {
        foreach($this->Events as $event)
        {
            if($event->IsInternalAction())
                return true;
        }
        return false;
    }
}

class HistoryUrl
{
    public $Url;
    public $Referrer;
    public $Entrance;
    public static $SearchEngines = array("s"=>array("*nigma*"),"blocked"=>array("*doubleclick.net*"),"q"=>array("*search.*","*searchatlas*","*suche.*","*google.*","*bing.*","*ask*","*alltheweb*","*altavista*","*gigablast*"),"p"=>array("*search.yahoo*"),"query"=>array("*hotbot*","*lycos*"),"key"=>array("*looksmart*"),"text"=>array("*yandex*"),"wd"=>array("*baidu.*"),"searchTerm"=>array("*search.*"),"debug"=>array("*127.0.0.1*"));
    public static $SearchEngineEncodings = array("gb2312"=>array("*baidu.*"));
    public static $ExternalCallers = array("*.google.*","*.googleusercontent.*","*.translate.ru*","*.youdao.com*","*.bing.*","*.yahoo.*");

    function __construct()
    {
        if(func_num_args() == 1)
        {
            $_row = func_get_arg(0);
            $this->Url = new BaseURL($_row["url_dom"],$_row["url_path"],"",$_row["url_title"]);
            $this->Url->Params = $_row["params"];
            $this->Url->Untouched = $_row["untouched"];
            $this->Url->MarkInternal();
            $this->Referrer = new BaseURL($_row["ref_dom"],$_row["ref_path"],"",$_row["ref_title"]);
            $this->Referrer->Untouched = $_row["ref_untouched"];
            $this->Entrance = $_row["entrance"];
        }
        else if(func_num_args() == 2)
        {
            $_row = func_get_arg(0);
            $this->Url = new BaseURL();
            $this->Url->AreaCode = $_row["area_code"];
            $this->Url->Params = $_row["params"];
            $this->Url->Untouched = $_row["untouched"];
            $this->Referrer = new BaseURL();
            $this->Referrer->Untouched = $_row["ref_untouched"];
            $this->Entrance = $_row["entrance"];
            $this->Url->PageTitle = $_row["title"];
        }
        else if(func_num_args() == 5)
        {
            $this->Url = new BaseURL(func_get_arg(0));
            $this->Url->AreaCode = func_get_arg(1);
            $this->Url->PageTitle = Str::Cut(func_get_arg(2),255);
            $this->Url->MarkInternal();
            $this->Referrer = new BaseURL(func_get_arg(3));
            $this->Entrance = func_get_arg(4);
        }
    }

    function Destroy($_browserId)
    {
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_VISITOR_BROWSER_URLS . "` WHERE `browser_id`='" . DBManager::RealEscape($_browserId) . "' AND `entrance`='" . DBManager::RealEscape($this->Entrance) . "' LIMIT 1;");
    }

    function Save($_browserId,$_entrance)
    {
        if(strpos($_browserId,'_OVL') !== false)
            return;

        if(empty($this->Url->Untouched))
        {
            return;
        }

        if(!$_entrance)
            DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_VISITOR_BROWSER_URLS . "` SET `is_exit`=0 WHERE `browser_id`='" . DBManager::RealEscape($_browserId) . "';");
        DBManager::Execute(true, $d="INSERT IGNORE INTO `" . DB_PREFIX . DATABASE_VISITOR_BROWSER_URLS . "` (`browser_id`, `entrance`, `referrer`, `url`, `params`, `untouched`, `title`, `ref_untouched`, `is_entrance`, `is_exit`, `area_code`) VALUES ('" . DBManager::RealEscape($_browserId) . "', '" . DBManager::RealEscape($this->Entrance) . "', '" . DBManager::RealEscape($this->Referrer->Save()) . "', '" . DBManager::RealEscape($this->Url->Save()) . "', '" . DBManager::RealEscape($this->Url->Params) . "', '" . DBManager::RealEscape($this->Url->Untouched) . "', '" . DBManager::RealEscape($this->Url->PageTitle) . "', '" . DBManager::RealEscape($this->Referrer->Untouched) . "', " . DBManager::RealEscape($_entrance ? 1 : 0) . ", 1, '" . DBManager::RealEscape($this->Url->AreaCode) . "');");
    }

    function GetXML($_browserId)
    {
        $xml = "<h b=\"".base64_encode($_browserId)."\" e=\"".base64_encode($this->Entrance)."\" url=\"".base64_encode($this->Url->GetAbsoluteUrl())."\" title=\"".base64_encode($this->Url->PageTitle)."\" code=\"".base64_encode($this->Url->AreaCode)."\">";
        if($this->Referrer != null && $this->Referrer->Untouched != "")
            $xml.= "<ref u=\"".base64_encode($this->Referrer->Untouched)."\" />";
        return $xml . "</h>";
    }
}

class BaseURL
{
    public $Path = "";
    public $Params = "";
    public $Domain = "";
    public $AreaCode = "";
    public $PageTitle = "";
    public $IsExternal = true;
    public $IsSearchEngine = false;
    public $Excluded;
    public $Untouched = "";

    function __construct()
    {
        if(func_num_args() == 1)
        {
            if(!Is::Null(func_get_arg(0)))
            {
                $this->Untouched = func_get_arg(0);
                $parts = $this->ParseURL($this->Untouched);
                $this->Domain = $parts[0];
                $this->Path = substr($parts[1],0,255);
                $this->Params = $parts[2];
            }
            else
                $this->MarkInternal();
        }
        else if(func_num_args() == 0)
        {
            return;
        }
        else if(func_num_args() == 4)
        {
            $this->Domain = func_get_arg(0);
            $this->Path = func_get_arg(1);
            $this->AreaCode = func_get_arg(2);
            $this->PageTitle = Str::Cut(func_get_arg(3),255);
        }

        /*
        $domains = explode(",",Server::$Configuration->File["gl_doma"]);
        if(!empty(Server::$Configuration->File["gl_doma"]) && !empty($this->Domain) && is_array($domains))
        {
            foreach($domains as $bldom)
            {
                $match = Is::WildcardMatch($bldom,$this->Domain);
                if((!empty(Server::$Configuration->File["gl_bldo"]) && $match) || (empty(Server::$Configuration->File["gl_bldo"]) && !$match))
                {
                    $this->Excluded = true;
                    break;
                }
            }
        }
        */
    }

    function GetAbsoluteUrl()
    {
        if(!empty($this->Untouched))
            return $this->Untouched;
        else
            return $this->Domain . $this->Path;
    }

    function Save()
    {
        if($this->IsExternal)
            $pid = CacheManager::GetDataTableIdFromValue(DATABASE_VISITOR_DATA_PATHS,"path",$this->Path.$this->Params,false,255);
        else
            $pid = CacheManager::GetDataTableIdFromValue(DATABASE_VISITOR_DATA_PATHS,"path",$this->Path,false,255);

        $did = $this->GetDomainId();
        $tid = $this->GetTitleId($did,$pid,0);

        DBManager::Execute(true, "INSERT IGNORE INTO `" . DB_PREFIX . DATABASE_VISITOR_DATA_PAGES . "` (`id`,`path`,`domain`,`title`) VALUES (NULL, '" . DBManager::RealEscape($pid) . "',  '" . DBManager::RealEscape($did) . "',  '" . DBManager::RealEscape($tid) . "') ON DUPLICATE KEY UPDATE `id`=LAST_INSERT_ID(`id`);");
        return DBManager::GetLastInsertedId();
    }

    function MarkInternal()
    {
        foreach(HistoryUrl::$ExternalCallers as $value)
            if(Is::WildcardMatch($value,$this->Domain))
                return;
        $this->IsExternal = false;
    }

    function MarkSearchEngine()
    {
        $this->IsSearchEngine = true;
        $this->Params =
        $this->Path = "";
    }

    function GetTitleId()
    {
        return CacheManager::GetDataTableIdFromValue(DATABASE_VISITOR_DATA_TITLES,"title",$this->PageTitle);
    }

    function GetDomainId()
    {
        return CacheManager::GetDataTableIdFromValue(DATABASE_VISITOR_DATA_DOMAINS,array("domain", "search", "external"),array($this->Domain, $this->IsSearchEngine?1:0, $this->IsExternal?1:0));
    }

    function IsInternalDomain()
    {
        $row = DBManager::FetchArray($result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_VISITOR_DATA_DOMAINS . "` WHERE `domain`='" . DBManager::RealEscape($this->Domain) . "';"));
        if(DBManager::GetRowCount($result) == 1 && empty($row["external"]))
            return true;
        return false;
    }

    function ParseURL($_url,$allowedParams="",$cutParams="",$domain="",$path="")
    {
        $allowed = (STATS_ACTIVE && class_exists("StatisticProvider")) ? StatisticProvider::$AllowedParameters : array();
        $igfilenames = (STATS_ACTIVE && class_exists("StatisticProvider")) ? StatisticProvider::$HiddenFilenames : array();
        $parts = parse_url(str_replace("///","//",$_url));
        $uparts = explode("?",$_url);
        if(count($allowed)>0 && count($uparts)>1)
        {
            $pparts = explode("&",$uparts[1]);
            foreach($pparts as $part)
            {
                $paramparts = explode("=",$part);
                if(in_array(strtolower($paramparts[0]),$allowed))
                {
                    if(empty($allowedParams))
                        $allowedParams .= "?";
                    else
                        $allowedParams .= "&";

                    $allowedParams .= $paramparts[0];
                    if(count($paramparts)>1)
                        $allowedParams .= "=".$paramparts[1];
                }
                else
                {
                    if(!empty($cutParams))
                        $cutParams .= "&";
                    $cutParams .= $paramparts[0];
                    if(count($paramparts)>1)
                        $cutParams .= "=".$paramparts[1];
                }
            }
        }
        if(!empty($cutParams) && empty($allowedParams))
            $cutParams = "?" . $cutParams;
        else if(!empty($cutParams) && !empty($allowedParams))
            $cutParams = "&" . $cutParams;
        else if(empty($cutParams) && empty($allowedParams) && count($uparts) > 1)
            $cutParams = "?" . $uparts[1];

        $partsb = @explode($parts["host"],$_url);

        if(!isset($parts["host"]))
            $parts["host"] = "localhost";

        $domain = $partsb[0].$parts["host"];
        $path = substr($uparts[0],strlen($domain),strlen($uparts[0])-strlen($domain));
        $path = str_replace($igfilenames,"",$path);
        return array($domain,$path.$allowedParams,$cutParams);
    }

    static function IsInputURL()
    {
        return !empty($_GET[GET_TRACK_URL]) || !empty($_GET["u"]);
    }

    static function GetInputURL()
    {
        if(!empty($_GET[GET_TRACK_URL]))
            return Encoding::Base64UrlDecode(Communication::GetParameter(GET_TRACK_URL,"",$nu,FILTER_SANITIZE_URL,null,2056));
        // comp < 5.3.x
        else if(!empty($_GET["u"]))
            return Communication::GetParameter("u","",$nu,FILTER_SANITIZE_URL,null,2056);

        return "";
    }
}


class TicketEditor extends BaseObject
{
    public $TicketId = "";
    public $SubStatus = "";
    public $Status = 0;

	function __construct()
	{
        if(func_num_args()>0)
        {
            $this->Id = func_get_arg(0);
            if(func_num_args() == 2)
            {
                $row = func_get_arg(1);
                $this->Editor = $row["editor_id"];
                $this->Status = $row["status"];
                $this->SubStatus = $row["sub_status"];
                $this->Edited =  $row["time"];
            }
        }
	}

    function ApplyAttributesFromPost($_index)
    {
       if(isset($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $_index . "_vs"]))
       {
           $this->SubStatus = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $_index . "_vs"];
       }
    }
	
	function GetXML($_waitBegin=0,$_lastUpdate=0)
	{
		return "<cl id=\"".base64_encode($this->Id)."\" w=\"".base64_encode($_waitBegin)."\" u=\"".base64_encode($_lastUpdate)."\" st=\"".base64_encode($this->Status)."\" ss=\"".base64_encode($this->SubStatus)."\" ed=\"".base64_encode($this->Editor)."\" ti=\"".base64_encode($this->Edited)."\"/>\r\n";
	}
	
	function Save()
	{
		DBManager::Execute(false, "UPDATE `" . DB_PREFIX . DATABASE_TICKET_EDITORS . "` SET `editor_id`='" . DBManager::RealEscape($this->Editor) . "',`status`='" . DBManager::RealEscape($this->Status) . "',`sub_status`='" . DBManager::RealEscape($this->SubStatus) . "',`time`='" . DBManager::RealEscape(time()) . "' WHERE `ticket_id`='" . DBManager::RealEscape($this->Id) . "';");
		if(DBManager::GetAffectedRowCount() <= 0)
			DBManager::Execute(false, "INSERT IGNORE INTO `" . DB_PREFIX . DATABASE_TICKET_EDITORS . "` (`ticket_id` ,`editor_id` ,`status`, `sub_status`, `time`) VALUES ('" . DBManager::RealEscape($this->Id) . "', '" . DBManager::RealEscape($this->Editor) . "', '" . DBManager::RealEscape($this->Status) . "','" . DBManager::RealEscape($this->SubStatus) . "','" . DBManager::RealEscape(time()) . "');");
	}

    function Destroy()
    {
        DBManager::Execute(false, "DELETE FROM `" . DB_PREFIX . DATABASE_TICKET_EDITORS . "` WHERE `ticket_id`='" . DBManager::RealEscape($this->Id) . "' LIMIT 1;");
    }

    static function GetTicketCountByEditor($_systemId)
    {
        $result = DBManager::Execute(true, "SELECT COUNT(*) AS `open_tickets` FROM `" . DB_PREFIX . DATABASE_TICKET_EDITORS . "` WHERE `editor_id`='" . DBManager::RealEscape($_systemId) . "' AND `status` < 2;");
        if($result && $row = DBManager::FetchArray($result))
            return $row["open_tickets"];
        return 0;
    }
}

class TicketChat extends TicketMessage
{
    function __construct()
    {
        $this->Id = func_get_arg(1);
        if(func_num_args() == 3)
        {
            $this->ChannelId = func_get_arg(0);
            $this->Type = "2";
        }
        else
        {
            $row = func_get_arg(0);
            $this->Text = str_replace(array("%eemail%","%efullname%"),array($row["email"],$row["fullname"]),$row["plaintext"]);
            $this->Type = "2";
            $this->Fullname = $row["fullname"];
            $this->Email = $row["email"];
            $this->Company = $row["company"];
            $this->ChannelId = $row["chat_id"];
            $this->IP = $row["ip"];
            $this->SenderUserId = $row["external_id"];
            $this->Edited = time();
            $this->Created = $row["time"];
            $this->Country = $row["iso_country"];
            $this->Phone = $row["phone"];
            $this->Subject = $row["question"];
        }
    }
}

class TicketMessage extends Action
{
	public $Type = 0;
	public $Customs = array();
	public $Country = "";
	public $CallMeBack = false;
	public $ChannelId = "";
	public $Attachments = array();
    public $Edited = 0;
    public $Hash = "";
    public $Subject = "";
    public $Comments = array();
    public $TicketId;
    public $HTML = "";
    public $EmailCC = "";
    public $EmailBCC = "";

	function __construct()
	{
		if(func_num_args() == 2)
		{
			$this->Id = func_get_arg(0);
		}
		else if(func_num_args() > 0)
		{
			$row = func_get_arg(0);
            $this->SetValues($row);
		}
	}

    function SetValues($_row)
    {
        if(!isset($_row["id"]))
            Logging::ErrorLog(serialize(debug_backtrace()));

        $this->Id = $_row["id"];
        $this->Text = DBManager::DecodeField($_row["text"]);
        $this->HTML = DBManager::DecodeField($_row["html"]);
        $this->Type = $_row["type"];
        $this->Fullname = DBManager::DecodeField($_row["fullname"]);
        $this->Email = $_row["email"];
        $this->EmailCC = $_row["email_cc"];
        $this->EmailBCC = $_row["email_bcc"];
        $this->Company = DBManager::DecodeField($_row["company"]);
        $this->ChannelId = $_row["channel_id"];
        $this->TicketId = $_row["ticket_id"];
        $this->IP = $_row["ip"];
        $this->Edited = $_row["time"];
        $this->Created = $_row["created"];
        $this->Country = $_row["country"];
        $this->Phone = $_row["phone"];
        $this->Hash = $_row["hash"];
        $this->SenderUserId = $_row["sender_id"];
        $this->CallMeBack = !empty($_row["call_me_back"]);
        $this->Subject = DBManager::DecodeField($_row["subject"]);
    }
	
    function AddComment($_operatorId, $_ticketId, $_text)
    {
        $time=SystemTime::GetUniqueMessageTime(DATABASE_TICKET_COMMENTS,"created");
        DBManager::Execute(true, "INSERT IGNORE INTO `" . DB_PREFIX . DATABASE_TICKET_COMMENTS . "` (`id`, `created`, `time`, `ticket_id`, `message_id`, `operator_id`, `comment`) VALUES ('" . DBManager::RealEscape(getId(32)) . "', '" . DBManager::RealEscape($time) . "','" . DBManager::RealEscape($time) . "', '" . DBManager::RealEscape($_ticketId) . "',  '" . DBManager::RealEscape($this->Id) . "', '" . DBManager::RealEscape($_operatorId) . "', '" . DBManager::RealEscape($_text) . "');");
    }
	
	function Save($_ticketId,$_overwrite=false,$_time=null,$_ticket=null)
	{
        $time=($_time==null)?SystemTime::GetUniqueMessageTime(DATABASE_TICKET_MESSAGES,"time"):$_time;
        if(empty($this->Created))
            $this->Created = $time;

        $do = ($_overwrite) ? "REPLACE" : "INSERT";

        $errorCode = -1;

        $this->Text = Str::Cut($this->Text,MAX_TICKET_MSG_LENGTH,true);

        $result = DBManager::Execute(false, $x = $do . " INTO `" . DB_PREFIX . DATABASE_TICKET_MESSAGES . "` (`id` ,`time` ,`created` ,`ticket_id` ,`text`, `html`,`fullname`,`email`,`email_cc`,`email_bcc`,`company` ,`ip`, `phone` ,`call_me_back`,`country`,`type`,`sender_id`,`channel_id`,`hash`,`subject`) VALUES ('" . DBManager::RealEscape($this->Id) . "', " . DBManager::RealEscape($time) . "," . DBManager::RealEscape($this->Created) . ", '" . DBManager::RealEscape($_ticketId) . "', '" . DBManager::RealEscape($this->Text) . "',  '" . DBManager::RealEscape($this->HTML) . "','" . DBManager::RealEscape($this->Fullname) . "', '" . DBManager::RealEscape($this->Email) . "', '" . DBManager::RealEscape($this->EmailCC) . "', '" . DBManager::RealEscape($this->EmailBCC) . "', '" . DBManager::RealEscape($this->Company) . "', '" . DBManager::RealEscape($this->IP) . "', '" . DBManager::RealEscape($this->Phone) . "', " . (($this->CallMeBack) ? 1 : 0) . ", '" . DBManager::RealEscape($this->Country) . "', '" . DBManager::RealEscape($this->Type) . "', '" . DBManager::RealEscape($this->SenderUserId) . "', '" . DBManager::RealEscape($this->ChannelId) . "', '" . DBManager::RealEscape($this->Hash) . "', '" . DBManager::RealEscape(Str::Cut($this->Subject,506,true)) . "');", $errorCode);

        if(!$result && $errorCode == 1366)
            $result = DBManager::Execute(true, $x = $do . " INTO `" . DB_PREFIX . DATABASE_TICKET_MESSAGES . "` (`id` ,`time` ,`created` ,`ticket_id` ,`text`, `html`,`fullname`,`email`,`email_cc`,`email_bcc`,`company` ,`ip`, `phone` ,`call_me_back`,`country`,`type`,`sender_id`,`channel_id`,`hash`,`subject`) VALUES ('" . DBManager::RealEscape($this->Id) . "', " . DBManager::RealEscape($time) . "," . DBManager::RealEscape($this->Created) . ", '" . DBManager::RealEscape($_ticketId) . "', '" . DBManager::RealEscape(DBManager::EncodeField($this->Text)) . "', '" . DBManager::RealEscape(DBManager::EncodeField($this->HTML)) . "','" . DBManager::RealEscape(DBManager::EncodeField($this->Fullname)) . "', '" . DBManager::RealEscape($this->Email) . "', '" . DBManager::RealEscape($this->EmailCC) . "', '" . DBManager::RealEscape($this->EmailBCC) . "', '" . DBManager::RealEscape(DBManager::EncodeField($this->Company)) . "', '" . DBManager::RealEscape($this->IP) . "', '" . DBManager::RealEscape($this->Phone) . "', " . (($this->CallMeBack) ? 1 : 0) . ", '" . DBManager::RealEscape($this->Country) . "', '" . DBManager::RealEscape($this->Type) . "', '" . DBManager::RealEscape($this->SenderUserId) . "', '" . DBManager::RealEscape($this->ChannelId) . "', '" . DBManager::RealEscape($this->Hash) . "', '" . DBManager::RealEscape(DBManager::EncodeField(Str::Cut($this->Subject,256,true))) . "');", $errorCode);
        else if(!$result && $errorCode == 1062)
        {
            return false;
        }

        if(!$result)
        {
            Logging::DebugLog("Save ticket message: can't save message to ticket " . $_ticketId . " (" . $errorCode . ")");
            return false;
        }

        if($result)
        {
         	if(is_array($this->Customs))
				foreach($this->Customs as $i => $value)
                    if(isset(Server::$Inputs[$i]))
				        DBManager::Execute(true, "REPLACE INTO `" . DB_PREFIX . DATABASE_TICKET_CUSTOMS . "` (`ticket_id` ,`message_id`, `custom_id` ,`value`) VALUES ('" . DBManager::RealEscape($_ticketId) . "','" . DBManager::RealEscape($this->Id) . "', '" . DBManager::RealEscape(Server::$Inputs[$i]->Name) . "', '" . DBManager::RealEscape($value) . "');");

            if($_ticket != null && !empty(Server::$Configuration->File["gl_mpm"]))
                foreach(Server::$Operators as $operator)
                    if($operator->IsInPushMessageState())
                        if($operator->HasAccessToTicket($_ticket))
                            $operator->AddPushMessage($_ticketId, "", (!empty($this->Fullname) ? $this->Fullname : $this->Email), 3, $this->Text);
        }
        else
            Logging::DebugLog("Save ticket message: can't save message to ticket " . $_ticketId . " (" . $errorCode . ")");

        CacheManager::SetDataUpdateTime(DATA_UPDATE_KEY_TICKETS);
        return $time;
    }

    function ApplyCustomFromPost($_count,$_change=false,$_ticket=null,$_operatorId="")
    {
        foreach(Server::$Inputs as $index => $input)
        {
            $cid = 0;
            while($cid < 30)
            {
                if(isset($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $_count . "_vd_" . $cid]))
                {
                    $value = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $_count . "_vd_" . $cid];
                    if(strpos($value,"[cf".$index."]") === 0)
                    {
                        $value = base64_decode(str_replace("[cf".$index."]","",$value));
                        if($input->Custom && $input->Active)
                        {
                            $compare = (isset($this->Customs[$index])) ? $input->GetClientIndex($this->Customs[$index]) : "";
                            if($_change && $compare != $value)
                                $this->ChangeValue($_ticket,$index+16,$_operatorId,$compare,$value);
                            $this->Customs[$index] = $value;
                        }
                    }
                }
                $cid++;
            }
        }
    }
	
	function LoadAttachments()
	{
        $this->Attachments = array();
		$result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_TICKET_ATTACHMENTS . "` INNER JOIN `" . DB_PREFIX . DATABASE_RESOURCES . "` ON `" . DB_PREFIX . DATABASE_RESOURCES . "`.`id`=`" . DB_PREFIX . DATABASE_TICKET_ATTACHMENTS . "`.`res_id` WHERE `" . DB_PREFIX . DATABASE_TICKET_ATTACHMENTS . "`.`parent_id`='" . DBManager::RealEscape($this->Id) . "';");
		if($result)
			while($rowc = DBManager::FetchArray($result))
				$this->Attachments[$rowc["res_id"]] = $rowc["title"];
	}

    function SaveAttachments()
    {
        foreach($this->Attachments as $rid => $title)
            $this->ApplyAttachment($rid);
    }

    function ApplyAttachment($_id)
    {
        DBManager::Execute(true, "REPLACE INTO `" . DB_PREFIX . DATABASE_TICKET_ATTACHMENTS . "` (`parent_id`,`res_id`) VALUES ('" . DBManager::RealEscape($this->Id) . "','" . DBManager::RealEscape($_id) . "');");
    }

    function AttachTemporaryFiles($_visitorId)
    {
        foreach(SERVER::$Inputs as $input)
            if($input->Active && $input->Type == "File")
            {
                $files = KnowledgeBase::GetTemporaryTicketFiles($_visitorId,$input->Index);
                foreach($files as $file)
                {
                    $this->ApplyAttachment($file["id"]);
                    if(!isset($this->Customs[$input->Index]))
                        $this->Customs[$input->Index] = "";
                    $this->Customs[$input->Index] .= "[" . $file["title"] . "]";
                }
            }
    }

    function LoadComments($_parent=null)
    {
        $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_TICKET_COMMENTS . "` WHERE `" . DB_PREFIX . DATABASE_TICKET_COMMENTS . "`.`message_id`='" . DBManager::RealEscape($this->Id) . "' ORDER BY `time` DESC;");
        $row = null;
        if($result)
            while($rowc = DBManager::FetchArray($result))
            {
                $row = $rowc;
                $this->Comments[$rowc["id"]] = array("time"=>$rowc["time"],"operator_id"=>$rowc["operator_id"],"comment"=>$rowc["comment"]);
            }

        if($_parent != null && $row)
        {
            $_parent->LastUpdated = max($_parent->LastUpdated,$row["time"],$row["created"]);
        }
    }

    function SaveComments($_ticketId)
    {
        if(is_array($this->Comments))
            foreach($this->Comments as $com)
                $this->AddComment($com["operator_id"],$_ticketId,$com["comment"]);
    }
	
	function LoadCustoms($_nameBased=false)
	{
        Server::InitDataBlock(array("INPUTS"));
		$result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_TICKET_CUSTOMS . "` WHERE `message_id`='" . DBManager::RealEscape($this->TicketId) . "';");
		if($result)
			while($rowc = DBManager::FetchArray($result))
				foreach(Server::$Inputs as $input)
					if($input->Name == $rowc["custom_id"] && $input->Active)
                    {
                        if($_nameBased)
                            $this->Customs[$input->Name] = $input->GetClientValue($rowc["value"]);
                        else
                            $this->Customs[$input->Index] = ($rowc["value"]);
                    }
	}

    function Load($_indexBased=false)
    {
        $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_TICKET_MESSAGES . "` WHERE `id`='" . DBManager::RealEscape($this->Id) . "';");
        if($result && $row = DBManager::FetchArray($result))
        {
            $this->SetValues($row);
            $this->LoadCustoms($_indexBased);
            $this->LoadAttachments();
            $this->LoadComments();
        }
    }

    function GetQuoteFormat($_html)
    {
        if(empty($this->Text))
            return "";

        $array = preg_split("/\r\n|\n|\r/", $this->Text);
        $qText = "";
        foreach($array as $line)
            if(!empty($line) && strpos(trim($line),">")!==0)
                $qText .= "\r\n> " . trim($line);

        $qText = $_html ? trim($qText) : nl2br(trim($qText));
        return $qText;
    }

    function ChangeValue($_ticket,$_logId,$_operatorId,&$_member,$_newValue)
    {
        if($_member != $_newValue)
            $_ticket->Log($_logId,$_operatorId,$_newValue,$_member,$this->Id);
        $_member = $_newValue;
    }

    function Forward($_groupId,$_toEmail,$_subject="",$_text="")
    {
        $att = array();
        $mailbox = Mailbox::GetById(Server::$Groups[$_groupId]->TicketEmailOut,true);
        foreach($this->Attachments as $resid => $title)
            $att[$resid] = $resid;

        if(empty($_text) && !empty($this->Text))
            $_text = $this->Text;

        if($mailbox != null)
            Communication::SendEmail($mailbox, str_replace(";", ",", $_toEmail), "", "", $mailbox->Email, $_text, "", $_subject, false, $att);
    }
    
    function GetXML($_demand=false)
    {
        $isHTML = strlen($this->HTML) > 0 ? " ishtml=\"MQ_\"" : "";
        $xml = "<m id=\"".base64_encode($this->Id)."\"".$isHTML." s=\"".base64_encode($this->Subject)."\" sid=\"".base64_encode($this->SenderUserId)."\" t=\"".base64_encode($this->Type)."\" c=\"".base64_encode($this->Country)."\" ci=\"".base64_encode($this->ChannelId)."\" ct=\"".base64_encode($this->Created)."\" e=\"".base64_encode($this->Edited)."\" p=\"".base64_encode($this->GetInputData(116,false))."\" cmb=\"".base64_encode(($this->CallMeBack) ? 1 : 0)."\" mt=\"".base64_encode(Str::Cut($this->Text,MAX_TICKET_MSG_LENGTH,true))."\" fn=\"".base64_encode($this->GetInputData(111,false))."\" em=\"".base64_encode($this->GetInputData(112,false))."\" ecc=\"".base64_encode($this->EmailCC)."\" ebcc=\"".base64_encode($this->EmailBCC)."\" co=\"".base64_encode($this->GetInputData(113,false))."\" ui=\"".base64_encode($this->SenderUserId)."\" ip=\"".base64_encode($this->IP)."\">\r\n";
        if(is_array($this->Customs))
            foreach($this->Customs as $i => $value)
                $xml .= "<c id=\"".base64_encode(Server::$Inputs[$i]->Name)."\">".base64_encode($this->GetInputData($i,false))."</c>\r\n";

        if(is_array($this->Attachments))
            foreach($this->Attachments as $i => $value)
                $xml .= "<a id=\"".base64_encode($i)."\">".base64_encode($value)."</a>\r\n";

        if($_demand && is_array($this->Comments))
            foreach($this->Comments as $id => $value)
                $xml .= "<co i=\"".base64_encode($id)."\" t=\"".base64_encode($value["time"])."\" o=\"".base64_encode($value["operator_id"])."\">".base64_encode($value["comment"])."</co>\r\n";
        return $xml . "</m>";
    }

    function TextReplace($_text,$_group)
    {
        $details=$cv="";
        if(Server::$Inputs[111]->Active && !empty($this->Fullname))
            $details .= strip_tags(Server::$Inputs[111]->Caption) ." " . $this->Fullname . "\r\n";
        if(Server::$Inputs[112]->Active && !empty($this->Email))
            $details .= strip_tags(Server::$Inputs[112]->Caption) ." " . $this->Email . "\r\n";
        if(Server::$Inputs[113]->Active && !empty($this->Company))
            $details .= strip_tags(Server::$Inputs[113]->Caption) ." " . $this->Company . "\r\n";
        if((Server::$Inputs[116]->Active || $this->CallMeBack) && !empty($this->Phone))
            $details .= strip_tags(Server::$Inputs[116]->Caption) ." " . $this->Phone . "\r\n";

        $_text = str_replace("%external_phone%",$this->Phone,$_text);
        $_text = str_replace("%external_name%",$this->Fullname,$_text);
        $_text = str_replace("%external_email%",$this->Email,$_text);
        $_text = str_replace("%external_company%",$this->Company,$_text);
        $_text = str_replace("%external_phone%",$this->Phone,$_text);
        $_text = str_replace("%external_ip%",$this->IP,$_text);
        //$_text = str_replace("%ticket_id%",$this->TicketId,$_text);
        $_text = str_replace("%subject%",$this->Subject,$_text);
        $_text = str_replace("%domain%",Server::$Configuration->File["gl_site_name"],$_text);

        foreach(Server::$Inputs as $index => $input)
            if($input->Active && $input->Custom)
            {
                $cv = "";
                if($input->Type == "CheckBox")
                    $details .= strip_tags($input->Caption). " " . ($cv = ((!empty($this->Customs[$index])) ? "<!--lang_client_yes-->" : "<!--lang_client_no-->")) . "\r\n";
                else if(!empty($this->Customs[$index]))
                    $details .= strip_tags($input->Caption). " " . ($cv = $input->GetClientValue($this->Customs[$index])) . "\r\n";

                $_text = str_replace("%custom".$index."%",$cv,$_text);
            }

        $_text = str_replace("%details%",$details,$_text);
        return $_text;
    }

    function SetChannelId($_cId)
    {
        DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_TICKET_MESSAGES . "` SET `channel_id`='" . DBManager::RealEscape($_cId) . "' WHERE `id`='" . DBManager::RealEscape($this->Id) . "' LIMIT 1;");
    }

    function Destroy()
    {
        DBManager::Execute(false, "DELETE FROM `" . DB_PREFIX . DATABASE_TICKET_MESSAGES . "` WHERE `id`='" . DBManager::RealEscape($this->Id) . "' LIMIT 1;");
    }

    static function Exists($_id, &$_ticketId="")
    {
        $result = DBManager::Execute(true, "SELECT `channel_id`,`ticket_id` FROM `" . DB_PREFIX . DATABASE_TICKET_MESSAGES . "` WHERE `channel_id`='" . DBManager::RealEscape($_id) . "';");
        if($result && DBManager::GetRowCount($result) > 0)
        {
            $row = DBManager::FetchArray($result);
            $_ticketId = $row["ticket_id"];
            return true;
        }
        return false;
    }

    static function GetHTML($_id)
    {
        $result = DBManager::Execute(true, "SELECT `html` FROM `" . DB_PREFIX . DATABASE_TICKET_MESSAGES . "` WHERE `channel_id`='" . DBManager::RealEscape($_id) . "' LIMIT 1;");
        if($result)
            if($row = DBManager::FetchArray($result))
                return DBManager::DecodeField($row["html"]);
    }
}

class TicketAttachment
{
    static function ResourceExists($_id)
    {
        $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_TICKET_ATTACHMENTS . "` WHERE `res_id`='" . DBManager::RealEscape($_id) . "' LIMIT 1;");
        if($result && DBManager::GetRowCount($result) > 0)
            return true;
        else
            return false;
    }
}

class TicketEmail
{
    public $Id = "";
    public $Name = "";
    public $Email = "";
    public $Subject = "";
    public $Body = "";
    public $BodyHTML = "";
    public $Created = 0;
    public $Deleted = false;
    public $MailboxId = "";
    public $Edited = "";
    public $GroupId = "";
    public $ReplyTo = "";
    public $ReceiverEmail = "";
    public $Attachments = array();
    public $EditorId = "";
    public $CC = "";

    function __construct()
    {
        if(func_num_args() == 3)
        {
            $this->Id = func_get_arg(0);
            $this->Deleted = func_get_arg(1);
            $this->EditorId = func_get_arg(2);
        }
        else if(func_num_args() == 1)
        {
            $row = func_get_arg(0);
            $this->Id = $row["email_id"];
            $this->Name = DBManager::DecodeField($row["sender_name"]);
            $this->Email = $row["sender_email"];
            $this->Subject = DBManager::DecodeField($row["subject"]);
            $this->Body = DBManager::DecodeField($row["body"]);
            $this->BodyHTML = DBManager::DecodeField($row["body_html"]);
            $this->Created = $row["created"];
            $this->Deleted = !empty($row["deleted"]);
            $this->MailboxId = $row["mailbox_id"];
            $this->Edited = $row["edited"];
            $this->GroupId = $row["group_id"];
            $this->ReplyTo = $row["sender_replyto"];
            $this->CC = $row["sender_cc"];
            $this->ReceiverEmail = $row["receiver_email"];
            $this->EditorId = $row["editor_id"];
        }
    }

    function LoadAttachments()
    {
        $this->Attachments = array();
        $result = DBManager::Execute(true, "SELECT `res_id` FROM `" . DB_PREFIX . DATABASE_TICKET_ATTACHMENTS . "` WHERE `parent_id`='" . DBManager::RealEscape($this->Id) . "';");
        if($result)
            while($row = DBManager::FetchArray($result))
                $this->Attachments[$row["res_id"]] = KnowledgeBaseEntry::GetById($row["res_id"]);
    }

    function SaveAttachment($_id)
    {
        DBManager::Execute(true, "REPLACE INTO `" . DB_PREFIX . DATABASE_TICKET_ATTACHMENTS . "` (`res_id`, `parent_id`) VALUES ('" . DBManager::RealEscape($_id) . "','" . DBManager::RealEscape($this->Id) . "');");
    }

    function SetStatus()
    {
        $ownership = (!empty($this->EditorId)) ? "(editor_id='".DBManager::RealEscape($this->EditorId)."' OR editor_id='') AND " : "";
        if($this->Deleted)
            $this->EditorId = CALLER_SYSTEM_ID;
        $time=SystemTime::GetUniqueMessageTime(DATABASE_TICKET_EMAILS,"edited");
        DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_TICKET_EMAILS . "` SET `deleted`=" . ($this->Deleted ? 1 : 0) . ",`edited`=" . ($time) . ",`editor_id`='" . DBManager::RealEscape($this->EditorId) . "' WHERE " . $ownership . "`email_id`='" . DBManager::RealEscape($this->Id) . "' LIMIT 1;");
    }

    function GetXML($_full=true)
    {
        if($_full)
        {
            $ishtml = !empty($this->BodyHTML) ? 1 : 0;
            $xml = "<e id=\"".base64_encode($this->Id)."\" ishtml=\"".base64_encode($ishtml)."\" ei=\"".base64_encode($this->EditorId)."\" r=\"".base64_encode($this->ReceiverEmail)."\" g=\"".base64_encode($this->GroupId)."\" e=\"".base64_encode($this->Email)."\" rt=\"".base64_encode($this->ReplyTo)."\" ed=\"".base64_encode($this->Edited)."\" s=\"".base64_encode($this->Subject)."\" n=\"".base64_encode($this->Name)."\" c=\"".base64_encode($this->Created)."\" d=\"".base64_encode($this->Deleted)."\" m=\"".base64_encode($this->MailboxId)."\"><c>".base64_encode($this->Body)."</c>";
            foreach($this->Attachments as $res)
                $xml .= "<a n=\"".base64_encode($res["title"])."\">".base64_encode($res["id"])."</a>";
            $xml .= "</e>";
        }
        else
        {
            $xml = "<e id=\"".base64_encode($this->Id)."\" ei=\"".base64_encode($this->EditorId)."\" r=\"".base64_encode($this->ReceiverEmail)."\" g=\"".base64_encode($this->GroupId)."\" e=\"".base64_encode($this->Email)."\" s=\"".base64_encode($this->Subject)."\" n=\"".base64_encode($this->Name)."\" c=\"".base64_encode($this->Created)."\" m=\"".base64_encode($this->MailboxId)."\" />";
        }
        return $xml;
    }

    function Load()
    {
        $result = DBManager::Execute(true, "SELECT `created`,`sender_cc`,`body_html` FROM `" . DB_PREFIX . DATABASE_TICKET_EMAILS . "` WHERE `email_id`='" . DBManager::RealEscape($this->Id) . "';");
        if($result && $row = DBManager::FetchArray($result))
        {
            $this->Created = $row["created"];
            $this->CC = $row["sender_cc"];
            $this->BodyHTML = $row["body_html"];
        }
    }

    function Save()
    {
        if ($this->Deleted)
            $this->Destroy();
        else
        {
            $errorCode = -1;

            $time=SystemTime::GetUniqueMessageTime(DATABASE_TICKET_EMAILS,"edited");

            $result = DBManager::Execute(false, "REPLACE INTO `" . DB_PREFIX . DATABASE_TICKET_EMAILS . "` (`email_id`, `mailbox_id`, `sender_email`, `sender_name`,`sender_replyto`,`sender_cc`,`receiver_email`, `created`, `edited`, `deleted`, `subject`, `body`, `body_html`, `group_id`) VALUES ('" . DBManager::RealEscape($this->Id) . "', '" . DBManager::RealEscape($this->MailboxId) . "', '" . DBManager::RealEscape($this->Email) . "', '" . DBManager::RealEscape(($this->Name)) . "','" . DBManager::RealEscape($this->ReplyTo) . "','" . DBManager::RealEscape(Str::Cut($this->CC,254)) . "','" . DBManager::RealEscape(Str::Cut($this->ReceiverEmail,255)) . "', '" . DBManager::RealEscape($this->Created) . "', '" . DBManager::RealEscape($time) . "', '" . DBManager::RealEscape($this->Deleted ? 1 : 0) . "', '" . DBManager::RealEscape(($this->Subject)) . "', '" . DBManager::RealEscape(($this->Body)) . "','" . DBManager::RealEscape(($this->BodyHTML)) . "', '" . DBManager::RealEscape($this->GroupId) . "');", $errorCode);

            if(!$result && $errorCode == 1366)
                DBManager::Execute(true, "REPLACE INTO `" . DB_PREFIX . DATABASE_TICKET_EMAILS . "` (`email_id`, `mailbox_id`, `sender_email`, `sender_name`,`sender_replyto`,`sender_cc`,`receiver_email`, `created`, `edited`, `deleted`, `subject`, `body`, `body_html`, `group_id`) VALUES ('" . DBManager::RealEscape($this->Id) . "', '" . DBManager::RealEscape($this->MailboxId) . "', '" . DBManager::RealEscape($this->Email) . "', '" . DBManager::RealEscape(DBManager::EncodeField($this->Name)) . "','" . DBManager::RealEscape($this->ReplyTo) . "','" . DBManager::RealEscape(Str::Cut($this->CC,254)) . "','" . DBManager::RealEscape(Str::Cut($this->ReceiverEmail,255)) . "', '" . DBManager::RealEscape($this->Created) . "', '" . DBManager::RealEscape($time) . "', '" . DBManager::RealEscape($this->Deleted ? 1 : 0) . "', '" . DBManager::RealEscape(DBManager::EncodeField($this->Subject)) . "', '" . DBManager::RealEscape(DBManager::EncodeField($this->Body)) . "','" . DBManager::RealEscape(DBManager::EncodeField($this->BodyHTML)) . "', '" . DBManager::RealEscape($this->GroupId) . "');", $errorCode);
        }

        if(DEBUG_MODE && strpos($this->Subject,"LZTMX") === 0)
            Logging::EmailLog($this->Subject);

        CacheManager::SetDataUpdateTime(DATA_UPDATE_KEY_EMAILS);
    }

    function Destroy($_converted=false)
    {
        if(!$_converted)
            DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_TICKET_EMAILS . "` SET `deleted`=1,`edited`='" . time() . "' WHERE `email_id`='" . DBManager::RealEscape($this->Id) . "' LIMIT 1;");
        else
            DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_TICKET_EMAILS . "` SET `deleted`=2,`edited`='" . time() . "' WHERE `email_id`='" . DBManager::RealEscape($this->Id) . "' LIMIT 1;");

        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_TICKET_ATTACHMENTS . "` WHERE `parent_id`='" . DBManager::RealEscape($this->Id) . "';");
    }

    static function Exists($_id,$_inEmails=true,$_inMessages=true)
    {
        if($_inEmails)
        {
            $result = DBManager::Execute(true, "SELECT COUNT(*) AS `ecount` FROM `" . DB_PREFIX . DATABASE_TICKET_EMAILS . "` WHERE `email_id`='" . DBManager::RealEscape($_id) . "';");
            if($result && ($row=DBManager::FetchArray($result)) && $row["ecount"] > 0)
                return true;
        }
        if($_inMessages)
        {
            $result = DBManager::Execute(true, "SELECT COUNT(*) AS `mcount` FROM `" . DB_PREFIX . DATABASE_TICKET_MESSAGES . "` WHERE `channel_id`='" . DBManager::RealEscape($_id) . "';");
            if($result && ($row=DBManager::FetchArray($result)) && $row["mcount"] > 0)
                return true;
        }
        return false;
    }

    static function GetHTML($_id)
    {
        $result = DBManager::Execute(true, "SELECT `body_html` FROM `" . DB_PREFIX . DATABASE_TICKET_EMAILS . "` WHERE `email_id`='" . DBManager::RealEscape($_id) . "' LIMIT 1;");
        if($result)
            if($row = DBManager::FetchArray($result))
                return DBManager::DecodeField($row["body_html"]);
    }
}

class Ticket extends Action
{
	public $Messages = array();
	public $Group = "";
	public $Channel = 0;
    public $SubChannel = "";
    public $Language = "";
    public $Deleted = false;
    public $LastUpdated = 0;
    public $WaitBegin = 0;
    public $Editor = null;
    public $ChannelId = "";
    public $ChannelConversationId = "";
    public $ChannelUniqueId = "";
    public $Logs = array();
    public $AutoStatusUpdateTime;
    public $AutoStatusUpdateStatus;
    public $WatchList = false;
    public $Priority = 2;
    public $Salt = "";
    public $Tags = "";
	public $Hash = "";
    public $PublicLink = "";

	function __construct()
	{
        $this->Salt = getId(32);
        if(func_num_args() == 1)
        {
            $row = func_get_arg(0);
            $this->Id = $row["ticket_id"];
            $this->SetValues($row);
            $this->Messages[0] = new TicketMessage($row);
        }
        else if(func_num_args() == 2)
        {
            $this->Id = func_get_arg(0);
            $this->Messages[0] = new TicketMessage(getId(32),true);
            $this->Language = strtoupper(func_get_arg(1));
        }
        else if(func_num_args() == 3)
        {
            $row = func_get_arg(0);
            if(!empty($row["ticket_id"]))
                $this->Id = $row["ticket_id"];
            else
                $this->Id = $row["id"];
            $this->SetValues($row);
            $this->LoadMessages(func_get_arg(1)!=null);
            $this->LoadStatus(func_get_arg(1)!=null);
        }

        if(!empty($row) && $row["last_update"] == 0 && $row["wait_begin"] == TICKET_NO_WT)
        {
            $uticket = new Ticket($this->Id,true);
            $uticket->LoadMessages();
            $uticket->LoadStatus();
            $uticket->SetLastUpdate();
            $this->LastUpdated = $uticket->LastUpdated;
            $this->WaitBegin = $uticket->WaitBegin;
        }
	}

    function SetValues($_row)
    {
        if(!isset($_row["user_id"]))
            Logging::ErrorLog(serialize(debug_backtrace()));

        $this->SenderUserId = $_row["user_id"];
        $this->Group = $_row["target_group_id"];
        $this->Channel = $_row["channel_type"];
        $this->SubChannel = $_row["sub_channel"];
        $this->LastUpdated = $_row["last_update"];
        $this->Language = $_row["iso_language"];
        $this->Deleted = !empty($_row["deleted"]);
        $this->WaitBegin = $_row["wait_begin"];
        $this->Tags = @$_row["tags"];
        $this->ChannelId = $_row["channel_id"];
        $this->Salt = $_row["salt"];
        $this->ChannelConversationId = $_row["channel_conversation_id"];
        $this->ChannelUniqueId = @$_row["channel_unique_id"];
        $this->AutoStatusUpdateTime = $_row["auto_status_time"];
        $this->AutoStatusUpdateStatus = $_row["auto_status_status"];
        $this->Priority = $_row["priority"];
		$this->Hash = $this->GetHash();

        if(defined("LIVEZILLA_URL"))
            $this->PublicLink = LIVEZILLA_URL . "ticket.php?id=" . $this->Id . "&hash=" . $this->Hash . "&salt=" . $this->Salt;

        if(IS::Defined("CALLER_SYSTEM_ID") && isset($_row["operator_id"]))
            $this->WatchList = $_row["operator_id"] == CALLER_SYSTEM_ID;
    }

    function Load($_loadStatus=true,$_loadMessages=true)
    {
        $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_TICKETS . "` WHERE `id`='" . DBManager::RealEscape($this->Id) . "';");
        if($result && $row = DBManager::FetchArray($result))
        {
            $this->SetValues($row);

            if($_loadStatus)
                $this->LoadStatus();

            if($_loadMessages)
                $this->LoadMessages();

            return true;
        }
        return false;
    }

    function GetMessageIndex($_messageId)
    {
        $index = 1;
        foreach($this->Messages as $message)
        {
            if($message->Id == $_messageId)
                return $index;
            $index++;
        }
        return -1;
    }

    function LoadStatus($_json=false)
    {
        $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_TICKET_EDITORS . "` WHERE `ticket_id`='" . DBManager::RealEscape($this->Id) . "' LIMIT " . DBManager::RealEscape(DATA_ITEM_LOADS) . ";");
        if($result)
            while($row = DBManager::FetchArray($result))
            {
                $this->Editor = new TicketEditor($this->Id,$row);
                $this->LastUpdated = max($this->LastUpdated,$this->Editor->Edited);
            }

        if($_json)
        {
            if($this->Editor!=null)
                $this->Editor->Editor = Operator::GetUserId($this->Editor->Editor);
            $this->Editor = array("TicketEditor"=>$this->Editor);
        }
    }

    function LoadMessages($_json=false)
    {
        $this->Messages = array();
        $result = DBManager::Execute(true,$k="SELECT * FROM `" . DB_PREFIX . DATABASE_TICKET_MESSAGES . "` WHERE `ticket_id`='" . DBManager::RealEscape($this->Id) . "' ORDER BY `time` ASC;");

        if($result)
            while($row = DBManager::FetchArray($result))
            {
                $message = new TicketMessage($row);
                $this->LastUpdated = max($this->LastUpdated,$message->Created,$message->Edited);
                $message->LoadAttachments();
                $message->LoadCustoms($_json);
                $message->LoadComments($this);

                if($_json)
                    $this->Messages[count($this->Messages)] = array("TicketMessage"=>$message);
                else
                    $this->Messages[count($this->Messages)] = $message;
            }
    }

    function LoadLogs()
    {
        $this->Logs = array();
        $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_TICKET_LOGS . "` WHERE `ticket_id`='" . DBManager::RealEscape($this->Id) . "' ORDER BY `created` ASC;");
        if($result)
            while($row = DBManager::FetchArray($result))
                $this->Logs[] = $row;
    }

    function SetLastUpdate($_set=0,$_wt=true)
    {
        if(!empty($_set))
            $this->LastUpdated = $_set;

        if($this->LastUpdated == 0)
            $this->LastUpdated = 1;

        DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_TICKETS . "` SET `last_update`='" . DBManager::RealEscape($this->LastUpdated) . "' WHERE `id`='" . DBManager::RealEscape($this->Id) . "' LIMIT 1;");

        if($_wt)
            $this->SetWaitBegin();
    }

    function SetWaitBegin($lastm = null)
    {
        $this->LoadStatus();

        if($this->Editor != null && $this->Editor->Status > 1)
        {
            $this->WaitBegin = TICKET_NO_WT;
        }
        else
            foreach($this->Messages as $message)
            {
                if($message->Type < 1 || $message->Type > 2)
                    $this->WaitBegin = ($message->Edited > 0 && $message->Created > 0) ? max($this->WaitBegin,min($message->Edited,$message->Created)) : max($this->WaitBegin,$message->Created);
                $lastm = $message;
            }

        if($lastm != null && ($lastm->Type == 1 || $lastm->Type == 2))
        {
            $this->WaitBegin = TICKET_NO_WT;
        }

        if($this->WaitBegin == 0)
            $this->WaitBegin = TICKET_NO_WT;

        DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_TICKETS . "` SET `wait_begin`='" . DBManager::RealEscape($this->WaitBegin) . "' WHERE `id`='" . DBManager::RealEscape($this->Id) . "' LIMIT 1;");
    }

    function SetPriority($_priority)
    {
        DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_TICKETS . "` SET `priority`=" . intval($_priority) . " WHERE `id`='" . DBManager::RealEscape($this->Id) . "' LIMIT 1;");
    }

    function SetTags($_tags)
    {
        Configuration::ApplyTagsToConfig($_tags,1);
        DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_TICKETS . "` SET `tags`='" . DBManager::RealEscape($_tags) . "' WHERE `id`='" . DBManager::RealEscape($this->Id) . "' LIMIT 1;");
    }

    function AddToWatchList($_operatorId)
    {
        DBManager::Execute(true, "INSERT IGNORE INTO `" . DB_PREFIX . DATABASE_TICKET_WATCHER . "` (`ticket_id`,`operator_id`,`created`) VALUES ('" . DBManager::RealEscape($this->Id) . "', '" . DBManager::RealEscape($_operatorId) . "', " . intval(time()) . ");");
    }

    function RemoveFromWatchList($_operatorId)
    {
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_TICKET_WATCHER . "` WHERE `ticket_id`='" . DBManager::RealEscape($this->Id) . "' AND `operator_id`='" . DBManager::RealEscape($_operatorId) . "' LIMIT 1;");
    }

	function GetHash($_brackets=false,$_html=false)
	{
        if(is_numeric($this->Id))
            $hash = substr(strtoupper(md5($this->Id.Server::$Configuration->File["gl_lzid"])),0,12);
        else
            return $this->Id;

        if($_html)
            return "<!--[" . $hash . "]-->";

        return ($_brackets) ? "[" . $hash . "]" : $hash;
	}

    function GetLastOutgoingMessageId()
    {
        $id = "";
        foreach($this->Messages as $message)
           if($message->Type == 1)
               $id = $message->Id;
        return $id;
    }

	function GetXML($_full,$_demand=false)
	{
		if($_full)
		{
            $wb = (!($this->Editor != null && $this->Editor->Status > 1)) ? $this->WaitBegin : TICKET_NO_WT;
			$xml = "<val id=\"".base64_encode($this->Id)."\" u=\"".base64_encode($this->LastUpdated)."\" w=\"".base64_encode($wb)."\" sa=\"".base64_encode($this->Salt)."\" ta=\"".base64_encode($this->Tags)."\" del=\"".base64_encode($this->Deleted ? "1" : "0")."\" wl=\"".base64_encode($this->WatchList ? "1" : "0")."\" gr=\"".base64_encode($this->Group)."\" uid=\"".base64_encode($this->SenderUserId)."\" l=\"".base64_encode($this->Language)."\" h=\"".base64_encode($this->GetHash())."\" p=\"".base64_encode($this->Priority)."\" t=\"".base64_encode($this->Channel)."\" s=\"".base64_encode($this->SubChannel)."\">\r\n";

            if($_demand && $this->Editor != null)
                 $xml .= $this->Editor->GetXml($wb,$this->LastUpdated);

            foreach($this->Messages as $message)
				$xml .= $message->GetXML($_demand);

            if(!empty($this->AutoStatusUpdateTime))
                $xml .= "<au t=\"".base64_encode($this->AutoStatusUpdateTime)."\">".base64_encode($this->AutoStatusUpdateStatus)."</au>\r\n";

            foreach($this->Logs as $row)
                $xml .= "<lo c=\"".base64_encode($row["created"])."\" ti=\"".base64_encode($row["time"])."\" t=\"".base64_encode($row["ticket_id"])."\" a=\"".base64_encode($row["action"])."\" o=\"".base64_encode($row["operator_id"])."\" v=\"".base64_encode($row["value_old"])."\" m=\"".base64_encode($row["message_id"])."\">".base64_encode($row["value_new"])."</lo>\r\n";

			$xml .= "</val>\r\n";
		}
		else
		{
			foreach($this->Messages as $message)
			{
				$xml = "<val id=\"".base64_encode($this->Id)."\" e=\"".base64_encode($message->Edited)."\" />\r\n";
				break;
			}
		}
		return $xml;
	}

    function LinkChat($_chatId, $messageId)
    {
        $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_CHAT_ARCHIVE . "` WHERE `chat_id`='" . DBManager::RealEscape(trim($_chatId)) . "' AND `closed`>0 LIMIT 1;");
        if($row = DBManager::FetchArray($result))
            $chatref = new TicketChat($row, $messageId);
        else
            $chatref = new TicketChat($_chatId, $messageId, true);

        $chatref->Save($this->Id,true);

        if(!empty($row["external_id"]))
        {
            $this->SetVisitor($row["external_id"]);
        }
    }

    function SetVisitor($_visitorId)
    {
        DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_TICKETS . "` SET `user_id`='" . DBManager::RealEscape($_visitorId) . "' WHERE `user_id`='' AND `id`='" . DBManager::RealEscape($this->Id) . "' LIMIT 1;");
        DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_TICKET_MESSAGES . "` SET `sender_id`='" . DBManager::RealEscape($_visitorId) . "' WHERE `sender_id`='' AND `id`='" . DBManager::RealEscape($this->Id) . "' LIMIT 1;");
    }

    function LinkTicket($_subTicketId)
    {
        $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_TICKETS . "` INNER JOIN `" . DB_PREFIX . DATABASE_TICKET_MESSAGES . "` ON `" . DB_PREFIX . DATABASE_TICKETS . "`.`id`=`" . DB_PREFIX . DATABASE_TICKET_MESSAGES . "`.`ticket_id` WHERE `ticket_id` = '" . DBManager::RealEscape($_subTicketId) . "'");
        while($result && $row = DBManager::FetchArray($result))
        {
            $subTicket = new Ticket($row);
            if(!$subTicket->Deleted)
            {
                $tm = $subTicket->Messages[0];
                $nid = getId(32);

                DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_TICKET_CUSTOMS . "` SET `message_id`='" . DBManager::RealEscape($nid) . "' WHERE `message_id` = '" . DBManager::RealEscape($tm->Id) . "';");
                DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_TICKET_ATTACHMENTS . "` SET `parent_id`='" . DBManager::RealEscape($nid) . "' WHERE `parent_id` = '" . DBManager::RealEscape($tm->Id) . "';");
                DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_TICKET_COMMENTS . "` SET `message_id`='" . DBManager::RealEscape($nid) . "' WHERE `message_id` = '" . DBManager::RealEscape($tm->Id) . "';");

                $tm->Id = $nid;
                if($tm->Type == 2)
                    $tm->ChannelId = $tm->ChannelId . "_" . getId(1);
                else
                    $tm->ChannelId = getId(32);

                $tm->Save($this->Id);

                DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_TICKET_LOGS . "` SET `time`='" . DBManager::RealEscape(time()) . "',`ticket_id`='" . DBManager::RealEscape($this->Id) . "' WHERE `ticket_id` = '" . DBManager::RealEscape($_subTicketId) . "';");
                DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_TICKET_CUSTOMS . "` SET `ticket_id`='" . DBManager::RealEscape($this->Id) . "' WHERE `ticket_id` = '" . DBManager::RealEscape($_subTicketId) . "';");
                DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_TICKET_COMMENTS . "` SET `time`='" . DBManager::RealEscape(time()) . "',`ticket_id`='" . DBManager::RealEscape($this->Id) . "' WHERE `ticket_id` = '" . DBManager::RealEscape($_subTicketId) . "';");

                $subTicket->Destroy();
            }
        }
        $this->Log(4,CALLER_SYSTEM_ID,$this->Id,$_subTicketId);
    }

    function LinkFeedback($_linkFeedbackId)
    {
        $mid = getId(32);
        $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_FEEDBACKS . "` WHERE `id`='" . DBManager::RealEscape(trim($_linkFeedbackId)) . "' LIMIT 1;");
        if($row = DBManager::FetchArray($result))
            $feed = new TicketFeedback($row, $mid);
        $feed->Save($this->Id,true);
    }

    function SendOperatorReply($_messageId, $_email, $_qMessageId = "", $_ecc = "", $_ebcc = "")
    {
        $tsData = array("","");
        $reply = new TicketMessage($_messageId,false);
        $reply->Load();

        $pdm = PredefinedMessage::GetByLanguage(Server::$Groups[$this->Group]->PredefinedMessages,$this->Language);

        if($pdm != null && $this->Channel < 6)
        {
            if(!empty($pdm->EmailTicketReplyBodyPlaintext))
                $tsData[0] = $pdm->EmailTicketReplyBodyPlaintext;
            if(!empty($pdm->EmailTicketReplyBodyHTML))
                $tsData[1] = $pdm->EmailTicketReplyBodyHTML;
        }

        // load last message id for quote from API calls where no message is referenced
        if(empty($_qMessageId) && !empty($reply->TicketId))
        {
            $ticket = new Ticket();
            $ticket->Id = $reply->TicketId;
            $ticket->LoadMessages();

            if(count($ticket->Messages) > 1)
                $_qMessageId = $ticket->Messages[count($ticket->Messages)-2]->Id;
        }

        $remoteHashes = "";

        if(!empty($_qMessageId))
        {
            $quote = new TicketMessage($_qMessageId,false);
            $quote->Load();

            $tsData[0] = $quote->TextReplace($tsData[0],$this->Group);
            $tsData[1] = $quote->TextReplace($tsData[1],$this->Group);

            if(preg_match_all("/\[[a-zA-Z\d]{12}\]/", $quote->Text . $quote->HTML, $matches))
            {
                if(count($matches[0]) > 1)
                    $matches[0] = array_unique($matches[0]);
                $remoteHashes = implode(",",$matches[0]);
            }
        }
        else
            $quote = null;

        $isMaskedReceiver = $_email == "[__[MASKED]__]";
        if($isMaskedReceiver)
        {
            $ticket = new Ticket();
            $ticket->Id = $reply->TicketId;
            $ticket->LoadMessages();
            $_email = $ticket->Messages[0]->Email;
        }

        $tsData[0] = Server::$Groups[$this->Group]->TextReplace($tsData[0],$this->Language);
        $tsData[1] = Server::$Groups[$this->Group]->TextReplace($tsData[1],$this->Language);

        $tsData[0] = Server::$Operators[CALLER_SYSTEM_ID]->TextReplace($tsData[0]);
        $tsData[1] = Server::$Operators[CALLER_SYSTEM_ID]->TextReplace($tsData[1]);

        $tsData[0] = $this->TextReplace($tsData[0]);
        $tsData[1] = $this->TextReplace($tsData[1]);

        for($i=0;$i<count($tsData);$i++)
        {
            // 0 = plain
            if($i==1 && empty($tsData[1]))
                continue;

            $lb = ($i==0) ? "\r\n\r\n" : "<br><br>";

            if(empty($tsData[$i]) || strpos($tsData[$i],"%mailtext%")===false)
                $tsData[$i] .= $lb . "%mailtext%";

            if($this->Channel < 6)
            {
                if(empty($tsData[$i]) || strpos($tsData[$i],"%ticket_hash%")===false)
                    $tsData[$i] .= $lb . "%ticket_hash%";
            }

            $qText = (!empty($quote)) ? "\r\n\r\n" . $quote->GetQuoteFormat($i==0) : "";

            $htmlBody = !empty($reply->HTML) ? $reply->HTML : htmlentities($reply->Text,ENT_QUOTES,"UTF-8");

            $tText = (($i==0) ? $reply->Text : $htmlBody);
            $tText = (($i==0) ? $tText : nl2br($tText))."<!--lz_ref_link-->";

            if(isset(Server::$Operators[$reply->SenderUserId]))
                $tsData[$i] = Server::$Operators[$reply->SenderUserId]->TextReplace($tsData[$i]);

            $tsData[$i] = Server::$Groups[$this->Group]->TextReplace($tsData[$i],$this->Language);
            $tsData[$i] = Configuration::Replace($tsData[$i]);

            if(!empty($remoteHashes) && strpos($tsData[$i],"%quote%") === false && strpos($tText,$remoteHashes) === false)
                $tText .= $lb . $remoteHashes;
            else
                $tsData[$i] = str_replace("%quote%",trim($qText),$tsData[$i]);

            $tsData[$i] = str_replace("%mailtext%",$tText,$tsData[$i]);
            $tsData[$i] = str_replace("%ticket_hash%",$this->GetHash(true,$i==1),$tsData[$i]);
            $tsData[$i] = str_replace("%ticket_hash_nb%",$this->GetHash(false),$tsData[$i]);
            $tsData[$i] = str_replace("%domain%",Server::$Configuration->File["gl_site_name"],$tsData[$i]);
            $tsData[$i] = Mailbox::FinalizeDataBlock($tsData[$i],$i==1,$this->Channel >= 6);

            $tsData[$i] = $this->TextReplace($tsData[$i]);
        }

        if(empty($reply->Subject))
        {
            $reply->Subject = ($pdm != null) ? $pdm->SubjectTicketReply : "";
            $reply->Subject = str_replace("%ticket_hash%",$this->GetHash(true),$reply->Subject);
        }

        if($this->Channel >= 6 && !empty($this->ChannelId))
        {
            $channel = SocialMediaChannel::GetChannelById($this->ChannelId);
            if($channel != null)
                $channel->SendReply($this,$reply,str_replace($this->GetHash(true),"",trim($tsData[0])),$quote);
        }

        $mailbox = Mailbox::GetById(Server::$Groups[$this->Group]->TicketEmailOut,true);
        if($mailbox != null)
        {
            if(!empty(Server::$Configuration->File["gl_scoo"]))
            {
                if(!empty($_ebcc))
                    $_ebcc .= "," . trim(Server::$Configuration->File["gl_scoo"]);
                else
                    $_ebcc = trim(Server::$Configuration->File["gl_scoo"]);
            }

            $senderName = Server::$Groups[$this->Group]->GetTicketSenderName($this);
            Communication::SendEmail($mailbox, str_replace(array(",,", ";"), ",", $_email), $_ecc, $_ebcc, $mailbox->Email, $tsData[0], $tsData[1], Mailbox::GetSubject($reply->Subject, $_email, $this->Messages[0]->Fullname, $this->Group, "", $this->Messages[0]->Company, $this->Messages[0]->Phone, $this->Messages[0]->IP, $this->Messages[0]->Text, Server::$Groups[$this->Group]->GetDescription($this->Language), $this->Messages[0]->Customs), false, $reply->Attachments, "", $senderName);
        }
    }

    function SendAutoresponder($_visitor=null, $_browser=null, $_message=null)
    {
        if(empty($_message))
            $_message = $this->Messages[0];

        $tsData = array("","","");

        if(!empty(Server::$Groups[$this->Group]->PredefinedMessages))
        {
            $pdm = PredefinedMessage::GetByLanguage(Server::$Groups[$this->Group]->PredefinedMessages,$this->Language);
            if($pdm != null)
            {
                if(!empty($pdm->EmailTicketResponderBodyPlaintext))
                    $tsData[0] = $pdm->EmailTicketResponderBodyPlaintext;
                if(!empty($pdm->EmailTicketResponderBodyHTML))
                    $tsData[1] = $pdm->EmailTicketResponderBodyHTML;
                $tsData[2] = $pdm->SubjectTicketResponder;
            }
        }

        if(empty($tsData[0]))
        {
            return;
        }

        for($i=0;$i<count($tsData);$i++)
        {
            $lb = ($i==0) ? "\r\n\r\n" : "<br><br>";

            $tText = (($i!=1) ? $_message->Text : nl2br(htmlentities($_message->Text,ENT_QUOTES,"UTF-8")))."<!--lz_ref_link-->";

            $tsData[$i] = str_replace("%mailtext%",$tText,$tsData[$i]);

            $cr = $_message->Created;

            if(empty($cr))
                $cr = time();

            $tsData[$i] = str_replace("%localdate%",date("Y-m-d",$cr),$tsData[$i]);
            $tsData[$i] = $_message->TextReplace($tsData[$i],$this->Group);

            if(strpos($tsData[$i],"%ticket_hash%")===false)
            {
                if(!empty($tsData[$i]) && $i < 2)
                    $tsData[$i] .= $lb . "%ticket_hash%";
            }

            $tsData[$i] = $this->TextReplace($tsData[$i]);
            $tsData[$i] = Server::$Groups[$this->Group]->TextReplace($tsData[$i],$this->Language);

            if(!empty($_visitor))
                $tsData[$i] = $_visitor->TextReplace($tsData[$i]);
            if(!empty($_browser))
                $tsData[$i] = $_browser->TextReplace($tsData[$i]);

            $tsData[$i] = Configuration::Replace($tsData[$i]);
            $tsData[$i] = Mailbox::FinalizeDataBlock($tsData[$i],$i==1);
            $tsData[$i] = Server::Replace($tsData[$i]);
        }

        $mailbox = Mailbox::GetById(Server::$Groups[$this->Group]->TicketEmailOut,true);

        if($mailbox != null)
        {
            $mb = clone $mailbox;
            $replytoint = (Mailbox::IsValidEmail($_message->Email)) ? $_message->Email : $mb->Email;
            $replytoex = $mb->Email;
            $fakeSender = "";
            $senderName = "";

            if(!empty(Server::$Configuration->File["gl_usmasend"]) && Mailbox::IsValidEmail($_message->Email))
                $fakeSender = $_message->Email;
            if(!empty(Server::$Configuration->File["gl_scom"]))
                Communication::SendEmail($mb, Server::$Configuration->File["gl_scom"], "", "", $replytoint, $tsData[0], $tsData[1], $tsData[2], false, null, $fakeSender, $senderName);
            if(!empty(Server::$Configuration->File["gl_sgom"]))
                Communication::SendEmail($mb, Server::$Groups[$this->Group]->Email, "", "", $replytoint, $tsData[0], $tsData[1], $tsData[2], false, null, $fakeSender, $senderName);
            if(!empty(Server::$Configuration->File["gl_ssom"]) && Mailbox::IsValidEmail($_message->Email))
                Communication::SendEmail($mb, str_replace(";", ",", $_message->Email), "", "", $replytoex, $tsData[0], $tsData[1], $tsData[2], false, null, $fakeSender, $senderName);
        }
    }

    function SendNotifier($_oldGroup="",$_newGroup="")
    {
        global $LZLANG;
        if($_oldGroup != $_newGroup)
        {
            $group = Server::$Groups[$_newGroup];
            if($group->SendTicketNotifier)
            {
                $mailbox = null;
                $defmailbox = Mailbox::GetDefaultOutgoing();
                if(!empty($group->ChatEmailOut))
                    $mailbox = Mailbox::GetById($group->ChatEmailOut);
                $mailbox = (!empty($mailbox)) ? $mailbox : $defmailbox;

                if(!empty($mailbox))
                    foreach($group->GetOperators() as $operator)
                    {
                        $bodyHTML = $LZLANG["client_group_new_ticket_notify"];
                        $bodyHTML = str_replace("<!--ticket_id-->",$this->Id,$bodyHTML);
                        $bodyHTML = str_replace("<!--operator_name-->",$operator->Fullname,$bodyHTML);
                        $bodyHTML = str_replace("<!--group_name-->",$group->Id,$bodyHTML);

                        $bodyPlain = str_replace("<br>","\r\n",$bodyHTML);
                        $bodyPlain = str_replace("<!--client_url-->",LIVEZILLA_URL . "mobile/",$bodyPlain);
                        $bodyPlain = str_replace("<!--ticket_url-->",LIVEZILLA_URL . "ticket.php?id=".$this->Id."&hash=".$this->GetHash()."&salt=".$this->Salt,$bodyPlain);

                        $bodyHTML = str_replace("<!--client_url-->","<a href=\"".LIVEZILLA_URL . "mobile/" ."\">" . LIVEZILLA_URL . "mobile/" . "</a>",$bodyHTML);
                        $bodyHTML = str_replace("<!--ticket_url-->","<a href=\"".LIVEZILLA_URL . "ticket.php?id=".$this->Id."&hash=".$this->GetHash()."&salt=".$this->Salt ."\">" . LIVEZILLA_URL . "ticket.php?id=".$this->Id."&hash=".$this->GetHash()."&salt=".$this->Salt . "</a>",$bodyHTML);

                        $subject = $LZLANG["client_group_new_ticket_notify_subject"];
                        $subject = str_replace("<!--ticket_id-->",$this->Id,$subject);
                        $subject = str_replace("<!--group_name-->",$group->Id,$subject);

                        Communication::SendEmail($mailbox, str_replace(array(",,", ";"), ",", $operator->Email), "", "", $mailbox->Email, $bodyPlain, $bodyHTML, $subject, false, null, "", "");
                    }
            }
        }
    }

	function Save($_hash="",$_saveMessages=true)
	{
        if(empty($_hash))
            $_hash = $this->GetHash();

        if(empty($this->Salt))
            $this->Salt = getId(32);


		if(DBManager::Execute(true, "INSERT IGNORE INTO `" . DB_PREFIX . DATABASE_TICKETS . "` (`id`,`user_id`,`target_group_id`,`hash`,`channel_type`,`sub_channel`,`iso_language`,`channel_id`,`channel_conversation_id`,`channel_unique_id`,`priority`,`salt`,`tags`) VALUES ('" . DBManager::RealEscape($this->Id) . "', '" . DBManager::RealEscape($this->SenderUserId) . "', '" . DBManager::RealEscape($this->Group) . "', '" . DBManager::RealEscape($_hash) . "', '" . DBManager::RealEscape($this->Channel) . "', '" . DBManager::RealEscape($this->SubChannel) . "', '" . DBManager::RealEscape($this->Language) . "', '" . DBManager::RealEscape($this->ChannelId) . "', '" . DBManager::RealEscape($this->ChannelConversationId) . "', '" . DBManager::RealEscape($this->ChannelUniqueId) . "', " . intval($this->Priority) . ", '" . DBManager::RealEscape($this->Salt) . "', '" . DBManager::RealEscape($this->Tags) . "');"))
        {
            Configuration::ApplyTagsToConfig($this->Tags,2);
            if($_saveMessages && count($this->Messages) > 0)
            {
                $this->Messages[0]->Hash = $_hash;
                $saved = $this->Messages[0]->Save($this->Id,false,null,$this);

                if($saved === false)
                {
                    //Logging::DebugLog("Save ticket: " . $this->Id . ": Double ticket creating, aborting ...");
                    DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_TICKETS . "` WHERE `id` = '" . DBManager::RealEscape($this->Id) . "' LIMIT 1;");
                }
                else
                    $this->SendNotifier("",$this->Group);
            }
            else
                Logging::DebugLog("Save ticket: ticket created but no message to store");
        }
        else
            Logging::DebugLog("Save ticket: can't save ticket " . $this->Id);

        CacheManager::SetDataUpdateTime(DATA_UPDATE_KEY_TICKETS);
	}

    function AutoAssignEditor($editor="")
    {
        $teditor = new TicketEditor($this->Id);
        $teditor->Editor = "";

        if(isset(Server::$Groups[$this->Group]) && !empty(Server::$Groups[$this->Group]->TicketAssignment))
        {
            $load = array();
            $sumtickets = 0;
            $sumpriorities = 0;
            foreach(Server::$Groups[$this->Group]->TicketAssignment as $sysid => $priority)
            {
                if(isset(Server::$Operators[$sysid]) && !Server::$Operators[$sysid]->IsBot)
                {
                    $load[$sysid] = TicketEditor::GetTicketCountByEditor($sysid);
                    $sumtickets += $load[$sysid];
                    $sumpriorities += ($priority*10);
                }
            }

            foreach(Server::$Groups[$this->Group]->TicketAssignment as $sysid => $priority)
            {
                if(isset(Server::$Operators[$sysid]) && !Server::$Operators[$sysid]->IsBot)
                    $load[$sysid] = $load[$sysid] - ($sumtickets*($priority*10/$sumpriorities));
            }

            if(!empty($load))
            {
                asort($load);
                if(min($load) == max($load))
                    for($i=0;$i<rand(0,(count($load)-1));$i++)
                        next($load);
                $editor = key($load);
            }

            if(!empty($editor))
            {
                $teditor = new TicketEditor($this->Id);
                $teditor->Editor = $editor;
                $teditor->Status = 0;
            }
        }

        $teditor->Save();
    }

    function Reactivate()
    {
        if($this->Editor != null)
            $this->Log(0,"",1,$this->Editor->Status);

        DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_TICKET_EDITORS . "` SET `status`=1,`time`=" . SystemTime::GetUniqueMessageTime(DATABASE_TICKET_EDITORS, "time") . " WHERE `status`>=2 AND `ticket_id`='" . DBManager::RealEscape($this->Id) . "' LIMIT 1;");
        CacheManager::SetDataUpdateTime(DATA_UPDATE_KEY_TICKETS);
    }

    function UpdateMessageTime()
    {
        if($result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_TICKET_MESSAGES . "` WHERE `ticket_id`='" . DBManager::RealEscape($this->Id) . "';"))
            while($row = DBManager::FetchArray($result))
                DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_TICKET_MESSAGES . "` SET `time`=" . SystemTime::GetUniqueMessageTime(DATABASE_TICKET_MESSAGES, "time") . " WHERE `id` = '" . DBManager::RealEscape($row["id"]) . "' LIMIT 1;");
    }

    function SetLanguage($_language)
    {
        DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_TICKETS . "` SET `iso_language` = '" . DBManager::RealEscape($_language) . "' WHERE `id`= '" . DBManager::RealEscape($this->Id) . "';");
        $this->UpdateMessageTime();
    }

    function SetGroup($_group)
    {
        $this->SendNotifier($this->Group,$_group);
        DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_TICKETS . "` SET `target_group_id` = '" . DBManager::RealEscape($_group) . "' WHERE `id`= '" . DBManager::RealEscape($this->Id) . "' LIMIT 1;");
        $this->UpdateMessageTime();
    }

    function SetChannel($_channel)
    {
        DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_TICKETS . "` SET `channel_type` = " . intval($_channel) . " WHERE `id`= '" . DBManager::RealEscape($this->Id) . "' LIMIT 1;");
    }

    function SetSubChannel($_subChannel)
    {
        DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_TICKETS . "` SET `sub_channel` = '" . DBManager::RealEscape($_subChannel) . "' WHERE `id`= '" . DBManager::RealEscape($this->Id) . "' LIMIT 1;");
    }

    function SetAutoStatusUpdate($_time,$_status)
    {
        DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_TICKETS . "` SET `auto_status_time` = " . intval($_time) . ",`auto_status_status` = " . intval($_status) . " WHERE `id`= '" . DBManager::RealEscape($this->Id) . "' LIMIT 1;");
    }

    function Destroy()
    {
        DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_TICKETS . "` SET `deleted`=1 WHERE `id` = '" . DBManager::RealEscape($this->Id) . "' LIMIT 1;");
        $this->UpdateMessageTime();
    }

    function TextReplace($_text)
    {
        if(!empty($this->Messages))
            $_text = $this->Messages[0]->TextReplace($_text,$this->Group);

        $_text = str_replace("%ticket_hash%",$this->GetHash(true),$_text);
        $_text = str_replace("%domain%",Server::$Configuration->File["gl_site_name"],$_text);
        $_text = str_replace("%feedback_link%",Feedback::GetLink("tid=" . Encoding::Base64UrlEncode($this->Id)),$_text);
        $_text = str_replace("%ticket_history_link%",(LIVEZILLA_URL . "ticket.php?id=" . $this->Id . "&hash=".$this->GetHash(false)."&salt=" . $this->Salt),$_text);
        $_text = str_replace("%ticket_hash_nb%",$this->GetHash(false),$_text);
        $_text = str_replace("%ticket_id%",$this->Id,$_text);
        return $_text;
    }

    function Log($_action,$_operatorId,$_newValue,$_oldValue="",$_messageId="")
    {
        // 32 = resend message

        // 31 = last ticket view
        if($_action == 31)
            DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_TICKET_LOGS . "` WHERE `ticket_id`='" . DBManager::RealEscape($this->Id) . "' AND `action` = 31 AND `operator_id`='" . DBManager::RealEscape($_operatorId) . "';");

        // 30 = draft
        if($_action == 30)
            DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_TICKET_LOGS . "` WHERE `ticket_id`='" . DBManager::RealEscape($this->Id) . "' AND `action` = 30;");

        if($_newValue!=$_oldValue)
            DBManager::Execute(true, "INSERT IGNORE INTO `" . DB_PREFIX . DATABASE_TICKET_LOGS . "` (`created`,`time`,`ticket_id`,`operator_id`,`action`,`value_old`,`value_new`,`message_id`) VALUES ('" . DBManager::RealEscape($time = SystemTime::GetUniqueMessageTime(DATABASE_TICKET_LOGS, "time")) . "','" . $time . "','" . DBManager::RealEscape($this->Id) . "', '" . DBManager::RealEscape($_operatorId) . "', '" . DBManager::RealEscape($_action) . "', '" . DBManager::RealEscape($_oldValue) . "', '" . DBManager::RealEscape($_newValue) . "', '" . DBManager::RealEscape($_messageId) . "');");
    }

    function ApplyAttributesFromPost($_index)
    {
        if(isset($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $_index . "_vt"]))
            $this->SetChannel($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $_index . "_vt"]);
        if(isset($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $_index . "_vu"]))
            $this->SetSubChannel($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $_index . "_vu"]);
        else
            $this->SetSubChannel("");

        if(isset($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $_index . "_vyx"]))
            $this->SetTags($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $_index . "_vyx"]);

        if(isset($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $_index . "_vv"]))
            $this->SetAutoStatusUpdate($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $_index . "_vv"],$_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $_index . "_vw"]);
    }

    static function GetMessageCount($_ticketId)
    {
        $result = DBManager::Execute(true, "SELECT COUNT(*) AS `mcount` FROM `" . DB_PREFIX . DATABASE_TICKET_MESSAGES . "` WHERE `ticket_id` = '" . DBManager::RealEscape($_ticketId) . "'");
        while($result && $row = DBManager::FetchArray($result))
            return $row["mcount"];
        return 0;
    }

    static function Exists($_hash, &$id, &$group, &$language)
    {
        $_hash = strtoupper(str_replace(array("[","]"),"",$_hash));
        $result = DBManager::Execute(true, "SELECT `dbt`.`id`,`dbt`.`target_group_id`,`dbt`.`iso_language` FROM `" . DB_PREFIX . DATABASE_TICKETS . "` AS `dbt` WHERE `dbt`.`deleted`=0 AND `dbt`.`hash`='" . DBManager::RealEscape($_hash) . "' LIMIT 1;");
        if($result && $row = DBManager::FetchArray($result))
        {
            $id=$row["id"];
            $group=$row["target_group_id"];
            $language=$row["iso_language"];
        }
        return (DBManager::GetRowCount($result) == 1);
    }

    static function UniqueChannelIdExists($_uniqueId)
    {
        $result = DBManager::Execute(true, "SELECT `channel_unique_id` FROM `" . DB_PREFIX . DATABASE_TICKETS . "` WHERE `channel_unique_id`='" . DBManager::RealEscape($_uniqueId) . "' LIMIT 1;");
        if($result && $row = DBManager::FetchArray($result))
        {

        }
        return (DBManager::GetRowCount($result) == 1);
    }

    static function GetById($_id)
    {
        $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_TICKETS . "` WHERE `id`='" . DBManager::RealEscape($_id) . "';");
        if($result)
            if($row = DBManager::FetchArray($result))
                return new Ticket($row["id"],true);
        return null;
    }

    static function GetOpenByUserId($_id,$_newerThan=0)
    {
        $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_TICKETS . "` WHERE `user_id`='" . DBManager::RealEscape($_id) . "' AND `last_update` > ".intval($_newerThan)." AND `deleted`=0 ORDER BY `last_update` DESC LIMIT 1;");
        if($result)
            if($row = DBManager::FetchArray($result))
            {
                $ticket = new Ticket($row["id"],true);
                $ticket->Load(true,true);
                if(!($ticket->Editor != null && $ticket->Editor->Status >= 2))
                {
                    return $ticket;
                }
            }
        return null;
    }

    static function GetSearchQuery($_sFor,$_tags)
    {
        $query = "";

        if(!empty($_sFor))
        {
            $ss = "11111111111110";
            if(isset($_POST["p_dt_q_ss"]) && is_numeric($_POST["p_dt_q_ss"]))
                $ss = $_POST["p_dt_q_ss"];
            $ss = str_split($ss);

            $query .= "LOWER(`".DB_PREFIX.DATABASE_TICKETS."`.`sub_channel`) LIKE '%".$_sFor."%'";
            $query .= " OR LOWER(`".DB_PREFIX.DATABASE_TICKETS."`.`hash`) LIKE '%".$_sFor."%'";

            if($ss[1]=="1")$query .= " OR LOWER(`te`.`sub_status`) LIKE '%".$_sFor."%'";
            if($ss[12]=="1")$query .= " OR LOWER(`do`.`firstname`) LIKE '%".$_sFor."%'";
            if($ss[12]=="1")$query .= " OR LOWER(`do`.`lastname`) LIKE '%".$_sFor."%'";
            if($ss[4]=="1")$query .= " OR `tm`.`sender_id` LIKE '%".$_sFor."%'";
            if($ss[5]=="1")$query .= " OR `tm`.`ticket_id` LIKE '%".$_sFor."%'";
            if($ss[6]=="1")$query .= " OR LOWER(`tc`.`value`) LIKE '%".$_sFor."%'";
            if($ss[7]=="1")$query .= " OR LOWER(`tm`.`text`) LIKE '%".$_sFor."%'";
            if($ss[3]=="1")$query .= " OR LOWER(`tm`.`fullname`) LIKE '%".$_sFor."%'";
            if($ss[8]=="1")$query .= " OR LOWER(`tm`.`email`) LIKE '%".$_sFor."%'";
            if($ss[9]=="1")$query .= " OR LOWER(`tm`.`company`) LIKE '%".$_sFor."%'";
            if($ss[10]=="1")$query .= " OR LOWER(`tm`.`phone`) LIKE '%".$_sFor."%'";
            if($ss[11]=="1")$query .= " OR LOWER(`tm`.`subject`) LIKE '%".$_sFor."%'";

            if(isset($ss[13]) && $ss[13]=="1")$query .= " OR LOWER(`tcom`.`comment`) LIKE '%".$_sFor."%'";
        }

        if(!empty($_POST["p_dt_q_e"]))
        {
            $q_e = DBManager::RealEscape(strtolower($_POST["p_dt_q_e"]));
            $emails = explode(",",$q_e);
            foreach($emails as $email)
                $query .= " OR LOWER(`tm`.`email`) LIKE '%".DBManager::RealEscape(trim($email),true)."%'";
        }

        if(!empty($query))
            $query = " AND (" . $query . ")";

        if(!empty($_tags))
        {
            $query .= " AND (";
            $count = 0;
            foreach(explode(",",$_tags) as $tag)
            {
                if($count > 0)
                    $query .= " OR ";

                $query .= "FIND_IN_SET('".DBManager::RealEscape($tag)."',tags) > 0";
                $count++;
            }
            $query .= ")";
        }

        return $query;
    }

    static function CreateFromChatArchive($_chatId)
    {
        $achat = new Chat();
        $achat->ChatId = $_chatId;
        $achat->Load();

        $ticket = Ticket::GetOpenByUserId($achat->VisitorId,time()-(86400*3));

        if($ticket != null)
        {
            $message = new TicketMessage();
            $message->Id = getId(32);
            $message->ChannelId = $_chatId;
            $message->Fullname = $achat->Fullname;
            $message->Email = $achat->Email;
            $message->Text = $achat->PlainText;
            $message->HTML = $achat->HTML;

            if(empty($message->Text))
                $message->Text = $achat->Question;

            $message->Company = $achat->Company;
            $message->Phone = $achat->Phone;
            $message->Type = 4;
            $message->Subject = $achat->Question;
            $message->Customs = DataInput::ToIndexBased($achat->Customs);
            $message->Save($ticket->Id);
        }
        else
        {
            $ticket = new Ticket(CacheManager::GetObjectId("ticket_id",DATABASE_TICKETS),"");
            $ticket->SenderUserId = $achat->VisitorId;
            $ticket->Channel = 4;
            $ticket->Group = $achat->Group;
            $ticket->Language = $achat->Language;
            $ticket->Messages[0]->Id = $ticket->Id;
            $ticket->Messages[0]->ChannelId = $_chatId;
            $ticket->Messages[0]->Fullname = $achat->Fullname;
            $ticket->Messages[0]->Email = $achat->Email;
            $ticket->Messages[0]->Text = $achat->PlainText;
            $ticket->Messages[0]->HTML = $achat->HTML;

            if(empty($ticket->Messages[0]->Text))
                $ticket->Messages[0]->Text = $achat->Question;

            $ticket->Messages[0]->Company = $achat->Company;
            $ticket->Messages[0]->Phone = $achat->Phone;
            $ticket->Messages[0]->Type = 4;
            $ticket->Messages[0]->Subject = $achat->Question;
            $ticket->Messages[0]->Customs = DataInput::ToIndexBased($achat->Customs);
            $ticket->Save();
        }

        $ticket->SetLastUpdate(time());
    }
}

class TicketSubDefinition
{
    public $Id;
    public $Type;
    public $ParentId;

    function __construct()
    {
        if(func_num_args() == 1)
        {
            $this->SetDetails(func_get_arg(0));
        }
        else if(func_num_args() == 2)
        {
            $this->Id = $_POST["p_cfg_tsd_i_" . func_get_arg(0)];
            $this->Type = $_POST["p_cfg_tsd_t_" . func_get_arg(0)];
            $this->ParentId = $_POST["p_cfg_tsd_p_" . func_get_arg(0)];
        }
    }

    function SetDetails($_row)
    {
        $this->Id = $_row["id"];
        $this->Type = $_row["type"];
        $this->ParentId = $_row["parent_id"];
    }

    function GetShortId()
    {
        return substr(md5($this->Id.$this->Type.$this->ParentId),0,5);
    }

    function Save()
    {
        DBManager::Execute(true, "INSERT INTO `" . DB_PREFIX . DATABASE_TICKET_SUBS . "` (`id` ,`type` ,`parent_id`) VALUES ('" . DBManager::RealEscape($this->Id) . "'," . intval($this->Type) . ",'" . DBManager::RealEscape($this->ParentId) . "');");
    }

    function GetXML()
    {
        return "<tsd i=\"".base64_encode($this->Id)."\" t=\"".base64_encode($this->Type)."\" p=\"".base64_encode($this->ParentId)."\" />\r\n";
    }
}

class Response
{
	public $XML = "";
	public $Internals="";
	public $Groups="";
	public $InternalProfilePictures="";
	public $InternalWebcamPictures="";
	public $Typing="";
	public $Exceptions="";
	public $Filters="";
	public $Events="";
	public $EventTriggers="";
	public $Authentications="";
	public $Posts="";
	public $Login;
	public $Feedbacks="";
	public $Messages="";
    public $Reports=null;
	public $Archive="";
	public $Resources="";
	public $ChatVouchers="";
	public $GlobalHash;
	public $Actions="";
	public $Goals="";
	public $Forwards="";
    public $Chats;
    public $Visitors="";
    public $VisitorBrowsers="";
    public $VisitorBrowserURLs="";

	function SetStandardResponse($_code,$_sub)
	{
		$this->XML = "<response><value id=\"".base64_encode($_code)."\" />" . $_sub . "</response>";
	}
	
	function SetValidationError($_code,$_addition="")
	{
		if(!empty($_addition))
			$this->XML = "<validation_error value=\"".base64_encode($_code)."\" error=\"".base64_encode($_addition)."\" />";
		else
			$this->XML = "<validation_error value=\"".base64_encode($_code)."\" />";
	}
	
	function GetXML($_operator=false)
	{
        if($_operator)
        {
            $this->GlobalHash = substr(md5($this->XML),0,5);
            if($_POST[POST_INTERN_SERVER_ACTION] != INTERN_ACTION_LISTEN || (isset($_POST[POST_GLOBAL_XMLCLIP_HASH_ALL]) && $_POST[POST_GLOBAL_XMLCLIP_HASH_ALL] != $this->GlobalHash))
            {
                $this->XML = str_replace("<!--gl_all-->",base64_encode(substr(md5($this->XML),0,5)),$this->XML);

                if(isset($_POST["p_clienttime"]))
                {
                    $td = SystemTime::GetTimeDifference($_POST["p_clienttime"]);
                    $this->XML .= "<timesync timediff=\"".base64_encode($td)."\" time=\"".base64_encode(time())."\" />";
                }
            }
            else
            {
                return "";
            }

            return str_replace("<!--execution_time-->",base64_encode(floor(SystemTime::GetRuntime(ACCESSTIME))),$this->GetXML());
        }
		return "<?xml version=\"1.0\" encoding=\"UTF-8\" ?><livezilla_xml><livezilla_version>".base64_encode(VERSION)."</livezilla_version>" . $this->XML . "</livezilla_xml>";
	}
}

class FileEditor
{
	public $Result;
	public $TargetFile;
	
	function __construct($_file)
	{
		$this->TargetFile = $_file;
	}
	
	function Load()
	{
		if(file_exists($this->TargetFile))
		{
			$handle = @fopen ($this->TargetFile, "r");
			while (!@feof($handle))
	   			$this->Result .= @fgets($handle, 4096);
			
			$length = strlen($this->Result);
			$this->Result = @unserialize($this->Result);
			@fclose($handle);
		}
	}

	function Save($_data)
	{
		if(strpos($this->TargetFile,"..") === false)
		{
			$handle = @fopen($this->TargetFile, "w");
			if(!empty($_data))
				@fputs($handle,serialize($_data));
			@fclose($handle);
		}
	}
}

class Forward extends Action
{
	public $InitiatorSystemId;
	public $TargetSessId;
	public $TargetGroupId;
	public $Processed = false;
	public $Invite = false;
	public $ChatId;
    public $Auto;

	function __construct()
	{
		$this->Id = getId(32);
		if(func_num_args() == 2)
		{
			$this->ChatId = func_get_arg(0);
			$this->SenderSystemId = func_get_arg(1);
			$this->Load();
		}
		else if(func_num_args() == 1)
		{
			$this->SetValues(func_get_arg(0));
		}
	} 
	
	function Save($_processed=false,$_received=false)
	{
		if(!$_processed)
			DBManager::Execute(true, "INSERT INTO `" . DB_PREFIX . DATABASE_CHAT_FORWARDS . "` (`id`, `created`, `initiator_operator_id`,`sender_operator_id`, `target_operator_id`, `target_group_id`, `chat_id`,`visitor_id`,`browser_id`, `info_text`, `invite`, `auto`) VALUES ('" . DBManager::RealEscape($this->Id) . "','" . DBManager::RealEscape(time()) . "','" . DBManager::RealEscape($this->InitiatorSystemId) . "','" . DBManager::RealEscape($this->SenderSystemId) . "', '" . DBManager::RealEscape($this->TargetSessId) . "', '" . DBManager::RealEscape($this->TargetGroupId) . "', '" . DBManager::RealEscape($this->ChatId) . "', '" . DBManager::RealEscape($this->ReceiverUserId) . "', '" . DBManager::RealEscape($this->ReceiverBrowserId) . "', '" . DBManager::RealEscape($this->Text) . "', '" . DBManager::RealEscape(($this->Invite) ? "1" : "0") . "', '" . DBManager::RealEscape(($this->Auto) ? "1" : "0") . "');");
        else
            DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_CHAT_FORWARDS . "` SET `processed`='1' WHERE `id`='" . DBManager::RealEscape($this->Id) . "' LIMIT 1; ");
        if($_received)
			DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_CHAT_FORWARDS . "` SET `received`='1' WHERE `id`='" . DBManager::RealEscape($this->Id) . "' LIMIT 1; ");
	}
	
	function Load()
	{
		$result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_CHAT_FORWARDS . "` WHERE `closed`=0 AND `id`='" . DBManager::RealEscape($this->Id) . "' AND `received`=0 LIMIT 1;");
		if($result && $row = DBManager::FetchArray($result))
			$this->SetValues($row);
	}
	
	function SetValues($_row)
	{
		$this->Id = $_row["id"];
		$this->InitiatorSystemId = $_row["initiator_operator_id"];
		$this->SenderSystemId = $_row["sender_operator_id"];
		$this->TargetSessId = $_row["target_operator_id"];
		$this->TargetGroupId = $_row["target_group_id"];
		$this->ReceiverUserId = $_row["visitor_id"];
		$this->ReceiverBrowserId = $_row["browser_id"];
		$this->ChatId = $_row["chat_id"];
		$this->Created = $_row["created"];
		$this->Received = $_row["received"];
		$this->Text = $_row["info_text"];
		$this->Processed = !empty($_row["processed"]);
		$this->Invite = !empty($_row["invite"]);
        $this->Auto = !empty($_row["auto"]);
        $this->Closed = !empty($_row["closed"]);
	}
	
	function GetXml()
	{
		return "<fw id=\"".base64_encode($this->Id)."\" pr=\"".base64_encode(($this->Processed) ? "1" : "0")."\" cr=\"".base64_encode($this->Created)."\" u=\"".base64_encode($this->ReceiverUserId."~".$this->ReceiverBrowserId)."\" c=\"".base64_encode($this->ChatId)."\" i=\"".base64_encode($this->InitiatorSystemId)."\" s=\"".base64_encode($this->SenderSystemId)."\" t=\"".base64_encode($this->Text)."\" r=\"".base64_encode($this->TargetSessId)."\"  g=\"".base64_encode($this->TargetGroupId)."\" inv=\"".base64_encode(($this->Invite) ?  "1" : "0")."\" />\r\n";
	}
	
	function Destroy()
	{
		DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_CHAT_FORWARDS . "` SET `closed`=1 WHERE `id`='" . DBManager::RealEscape($this->Id) . "' LIMIT 1;");
	}
}

class EventActionInternal extends Action
{
	public $TriggerId;

	function __construct()
	{
		if(func_num_args() == 2)
		{
			$this->Id = getId(32);
			$this->ReceiverUserId = func_get_arg(0);
			$this->TriggerId = func_get_arg(1);
		}
		else
		{
			$_row = func_get_arg(0);
			$this->TriggerId = $_row["trigger_id"];
			$this->EventActionId = $_row["action_id"];
		}
	}

	function Save()
	{
		DBManager::Execute(true, "INSERT INTO `" . DB_PREFIX . DATABASE_EVENT_ACTION_INTERNALS . "` (`id`, `created`, `trigger_id`, `receiver_user_id`) VALUES ('" . DBManager::RealEscape($this->Id) . "', '" . DBManager::RealEscape(time()) . "', '" . DBManager::RealEscape($this->TriggerId) . "', '" . DBManager::RealEscape($this->ReceiverUserId) . "');");
	}

	function GetXml($_visitorId="",$_browserId="")
	{
		return "<ia time=\"".base64_encode(time())."\" aid=\"".base64_encode($this->EventActionId)."\" vid=\"".base64_encode($_visitorId)."\" bid=\"".base64_encode($_browserId)."\" />\r\n";
	}
}

class ChatRequest extends Action
{
	public $Invitation;
	public $Canceled;
    public $Type;

	function __construct()
   	{
		if(func_num_args() == 5)
		{
			$this->Id = getId(32);
			$this->SenderSystemId = func_get_arg(0);
			$this->SenderGroupId = func_get_arg(1);
			$this->ReceiverUserId = func_get_arg(2);
			$this->BrowserId = func_get_arg(3);
			$this->Text = func_get_arg(4);
		}
		else if(func_num_args() == 2)
		{
			$this->Id = func_get_arg(0);
			$this->Load();
		}
		else
		{
			$row = func_get_arg(0);
			$this->SetValues($row);
		}

        if(!empty(Server::$Configuration->File["gl_itim"]) && !empty($this->Created) && $this->Created < (time()-Server::$Configuration->File["gl_itim"]))
            if(empty($this->Canceled) && !$this->Closed)
                $this->Cancel("Timeout");
   	}
	
	function SetStatus($_displayed,$_accepted,$_declined,$_closed=false)
	{
		if($_displayed)
			DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_CHAT_REQUESTS . "` SET `displayed`='1',`accepted`='0',`declined`='0' WHERE `id`='" . DBManager::RealEscape($this->Id) . "' LIMIT 1;");
		if($_accepted)
			DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_CHAT_REQUESTS . "` SET `displayed`='1',`accepted`='1' WHERE `declined`=0 AND `id`='" . DBManager::RealEscape($this->Id) . "' LIMIT 1;");
		else if($_declined)
			DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_CHAT_REQUESTS . "` SET `displayed`='1',`declined`='1' WHERE `accepted`=0 AND `id`='" . DBManager::RealEscape($this->Id) . "' LIMIT 1;");
		if($_closed)
			DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_CHAT_REQUESTS . "` SET `closed`='1' WHERE `id`='" . DBManager::RealEscape($this->Id) . "' LIMIT 1;");

        $visitor = new Visitor($this->ReceiverUserId);
        $visitor->ForceUpdate();
    }

    function Cancel($_user)
    {
        if(!$this->Closed && empty($this->Canceled) && !$this->Accepted && !$this->Declined)
        {
            DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_CHAT_REQUESTS . "` SET `closed`=1,`canceled`='" . DBManager::RealEscape($_user) . "' WHERE `canceled`='' AND `closed`=0 AND `accepted`=0 AND `declined`=0 AND `id`='" . DBManager::RealEscape($this->Id) . "';");
            if(DBManager::GetAffectedRowCount() > 0)
            {
                $this->Canceled = $_user;
                $visitor = new Visitor($this->ReceiverUserId);
                $visitor->ForceUpdate();
            }
        }
    }

	function SetValues($_row)
	{
		$this->Id = $_row["id"];
		$this->SenderSystemId = $_row["sender_system_id"];
		$this->SenderUserId = $_row["sender_system_id"];
		$this->SenderGroupId = $_row["sender_group_id"];
		$this->ReceiverUserId = $_row["receiver_user_id"];
		$this->BrowserId = $_row["receiver_browser_id"];
		$this->EventActionId = $_row["event_action_id"];
		$this->Created = $_row["created"];
		$this->Text = $_row["text"];
		$this->Displayed = !empty($_row["displayed"]);
		$this->Accepted = !empty($_row["accepted"]);
		$this->Declined = !empty($_row["declined"]);
		$this->Closed = !empty($_row["closed"]);
		$this->Canceled = $_row["canceled"];
        $this->Type = $_row["type"];
	}
	
	function Load()
	{
		if($result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_CHAT_REQUESTS . "` WHERE `id`='" . DBManager::RealEscape($this->Id) . "';"))
			if($row = DBManager::FetchArray($result))
				$this->SetValues($row);
	}
	
	function Save($_onlineOnly=true)
	{
		if(Server::$Operators[$this->SenderSystemId]->IsExternal(Server::$Groups) || !$_onlineOnly)
			DBManager::Execute(true, "INSERT INTO `" . DB_PREFIX . DATABASE_CHAT_REQUESTS . "` (`id`, `created`, `sender_system_id`, `sender_group_id`,`receiver_user_id`, `receiver_browser_id`,`event_action_id`, `text`, `type`) VALUES ('" . DBManager::RealEscape($this->Id) . "', '" . DBManager::RealEscape(time()) . "','" . DBManager::RealEscape($this->SenderSystemId) . "','" . DBManager::RealEscape($this->SenderGroupId) . "','" . DBManager::RealEscape($this->ReceiverUserId) . "', '" . DBManager::RealEscape($this->BrowserId) . "','" . DBManager::RealEscape($this->EventActionId) . "','" . DBManager::RealEscape($this->Text) . "'," . intval($_onlineOnly ? 2 : 22) . ");");
        $visitor = new Visitor($this->ReceiverUserId);
        $visitor->ForceUpdate();
    }
	
	function Destroy()
	{
		DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_CHAT_REQUESTS . "` WHERE `id`='" . DBManager::RealEscape($this->Id) . "' LIMIT 1;");
	}

    function GetXML()
    {
        return "<r i=\"".base64_encode($this->Id)."\" c=\"".base64_encode($this->Created)."\" ca=\"".base64_encode($this->Canceled)."\" s=\"".base64_encode($this->SenderSystemId)."\" b=\"".base64_encode($this->BrowserId)."\" e=\"".base64_encode($this->EventActionId)."\" d=\"".base64_encode($this->Displayed ? 1 : 0)."\" a=\"".base64_encode($this->Accepted ? 1 : 0)."\" de=\"".base64_encode($this->Declined ? 1 : 0)."\" g=\"".base64_encode($this->SenderGroupId)."\" cl=\"".base64_encode($this->Closed ? 1 : 0)."\">".base64_encode($this->Text)."</r>\r\n";
    }

    function IsAnswered($_ignoreAccepted=false)
    {
        return ($this->Accepted && !$_ignoreAccepted) || $this->Declined || $this->Closed || $this->Canceled;
    }

	function CreateInvitationTemplate($_style,$_siteName,$_cwWidth,$_cwHeight,$_serverURL,$_sender,$_closeOnClick)
	{
		$template = ((!empty(Server::$Configuration->File["gl_caii"])) && @file_exists(TEMPLATE_SCRIPT_INVITATION . $_style . "/invitation_header.tpl")) ? IOStruct::GetFile(TEMPLATE_SCRIPT_INVITATION . $_style . "/invitation_header.tpl") : IOStruct::GetFile(TEMPLATE_SCRIPT_INVITATION . $_style . "/invitation.tpl");
		$template = str_replace("<!--logo-->","<img src=\"". Server::$Configuration->File["gl_caii"]."\" border=\"0\">",$template);
		$template = str_replace("<!--site_name-->",$_siteName,$template);
		$template = str_replace("<!--intern_name-->",$_sender->Fullname,$template);
		$template = str_replace("<!--template-->",$_style,$template);
		$template = str_replace("<!--group_id-->",Encoding::Base64UrlEncode($this->SenderGroupId),$template);
		$template = str_replace("<!--user_id-->",Encoding::Base64UrlEncode($_sender->UserId),$template);
		$template = str_replace("<!--width-->",$_cwWidth,$template);
		$template = str_replace("<!--height-->",$_cwHeight,$template);
		$template = str_replace("<!--server-->",$_serverURL,$template);
		$template = str_replace("<!--intern_image-->",$_sender->GetOperatorPictureFile(),$template);
		$template = str_replace("<!--close_on_click-->",$_closeOnClick,$template);
		return $template;
	}

    public static function AcceptAll($_userId)
    {
        ChatRequest::AnswerAll(true,$_userId);
    }

    public static function DeclineAll($_userId)
    {
        ChatRequest::AnswerAll(false,$_userId);
    }

    public static function AnswerAll($_accept,$_userId)
    {
        if($result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_CHAT_REQUESTS . "` WHERE `receiver_user_id`='" . DBManager::RealEscape($_userId) . "';"))
            while($row = DBManager::FetchArray($result))
            {
                $request = new ChatRequest($row);

                if(!$request->IsAnswered())
                {
                    $request->SetStatus(false,$_accept,!$_accept);
                }
            }
    }
}

class OverlayElement extends BaseObject
{
	public $Position = "11";
	public $Speed = 8;
	public $Effect = 0;
	public $Width = 600;
	public $Height = 550;
	public $Margin = [0,0,0,0];
	public $CloseOnClick;
	public $HTML;
	public $Style = "classic";
	public $Shadow = false;
	public $ShadowPositionX = 5;
	public $ShadowPositionY = 5;
	public $ShadowBlur = 5;
	public $ShadowColor = "000000";
	public $Background = true;
	public $BackgroundColor = "000000";
	public $BackgroundOpacity = 0.5;

	function __construct()
	{
		if(func_num_args() == 1)
		{
			$_row = func_get_arg(0);
			$this->Style = $_row["style"];
			$this->Id = $_row["id"];
			$this->Position = $_row["position"];
			$this->Margin = array($_row["margin_left"],$_row["margin_top"],$_row["margin_right"],$_row["margin_bottom"]);
			$this->Speed = $_row["speed"];
			$this->Effect = $_row["slide"];
			$this->CloseOnClick = $_row["close_on_click"];
			$this->Shadow = !empty($_row["shadow"]);
			$this->ShadowPositionX = $_row["shadow_x"];
			$this->ShadowPositionY = $_row["shadow_x"];
			$this->ShadowBlur = $_row["shadow_blur"];
			$this->ShadowColor = @$_row["shadow_color"];
			$this->Width = $_row["width"];
			$this->Height = $_row["height"];
			$this->Background = !empty($_row["background"]);
			$this->BackgroundColor = $_row["background_color"];
			$this->BackgroundOpacity = $_row["background_opacity"];
		}
		else if(func_num_args() == 20)
		{
			$this->Id = getId(32);
			$this->ActionId = func_get_arg(0);
			$this->Position = func_get_arg(1);
			$this->Margin = array(func_get_arg(2),func_get_arg(3),func_get_arg(4),func_get_arg(5));
			$this->Speed = func_get_arg(6);
			$this->Style = func_get_arg(7);
			$this->Effect = func_get_arg(8);
			$this->CloseOnClick = func_get_arg(9);
			$this->Shadow = func_get_arg(10);
			$this->ShadowPositionX = func_get_arg(11);
			$this->ShadowPositionY = func_get_arg(12);
			$this->ShadowBlur = func_get_arg(13);
			$this->ShadowColor = func_get_arg(14);
			$this->Width = func_get_arg(15);
			$this->Height = func_get_arg(16);
			$this->Background = !Is::Null(func_get_arg(17));
			$this->BackgroundColor = func_get_arg(18);
			$this->BackgroundOpacity = func_get_arg(19);
		}
        else
            $this->Margin = array(0,0,0,0);

 	}
	
	function GetXML()
	{
		return "<evolb id=\"".base64_encode($this->Id)."\" bgo=\"".base64_encode($this->BackgroundOpacity)."\" bgc=\"".base64_encode($this->BackgroundColor)."\" bg=\"".base64_encode($this->Background)."\" h=\"".base64_encode($this->Height)."\" w=\"".base64_encode($this->Width)."\" ml=\"".base64_encode($this->Margin[0])."\" mt=\"".base64_encode($this->Margin[1])."\" mr=\"".base64_encode($this->Margin[2])."\" mb=\"".base64_encode($this->Margin[3])."\" pos=\"".base64_encode($this->Position)."\" speed=\"".base64_encode($this->Speed)."\" eff=\"".base64_encode($this->Effect)."\" style=\"".base64_encode($this->Style)."\" coc=\"".base64_encode($this->CloseOnClick)."\" sh=\"".base64_encode($this->Shadow)."\"  shpx=\"".base64_encode($this->ShadowPositionX)."\"  shpy=\"".base64_encode($this->ShadowPositionY)."\"  shb=\"".base64_encode($this->ShadowBlur)."\"  shc=\"".base64_encode($this->ShadowColor)."\" />\r\n";
	}

	function GetCommand()
	{
		return "lz_tracking_add_overlay_box('".base64_encode($this->Id)."','".base64_encode($this->HTML)."',".$this->Position.",".$this->Speed."," . $this->Effect . ",".To::BoolString($this->Shadow)."," . $this->ShadowBlur . "," . $this->ShadowPositionX . "," . $this->ShadowPositionY . ",'" . $this->ShadowColor . "',".$this->Margin[0].",".$this->Margin[1].",".$this->Margin[2].",".$this->Margin[3].",".$this->Width.",".$this->Height.",".To::BoolString($this->Background).",'".$this->BackgroundColor."',".$this->BackgroundOpacity.",".intval(($this->Style == "rounded")? 5 : 0).");";
	}
}

class Invitation extends OverlayElement
{
	public $ActionId;
	public $Senders;
	public $Text;
	
	function __construct()
	{
		if(func_num_args() == 1)
		{
			$_row = func_get_arg(0);
			$this->Style = $_row["style"];
			$this->Id = $_row["id"];
			$this->Position = $_row["position"];
			$this->Margin = array($_row["margin_left"],$_row["margin_top"],$_row["margin_right"],$_row["margin_bottom"]);
			$this->Speed = $_row["speed"];
			$this->Effect = $_row["slide"];
			$this->CloseOnClick = $_row["close_on_click"];
			$this->Shadow = $_row["shadow"];
			$this->ShadowPositionX = @$_row["shadow_x"];
			$this->ShadowPositionY = @$_row["shadow_x"];
			$this->ShadowBlur = @$_row["shadow_blur"];
			$this->ShadowColor = $_row["shadow_color"];
			$this->Background = !empty($_row["background"]);
			$this->BackgroundColor = @$_row["background_color"];
			$this->BackgroundOpacity = @$_row["background_opacity"];
		}
		else if(func_num_args() == 2)
		{
			$this->Id = getId(32);
			$this->ActionId = func_get_arg(0);
            $values = func_get_arg(1);
            $this->CloseOnClick = $values[0];
            $this->Position = $values[1];
            $this->Margin = array($values[2],$values[3],$values[4],$values[5]);
            $this->Effect = $values[6];
            $this->Shadow = $values[7];
            $this->ShadowBlur = $values[8];
            $this->ShadowColor = $values[9];
            $this->ShadowPositionX = $values[10];
            $this->ShadowPositionY = $values[11];
            $this->Speed = $values[12];
            $this->Style = $values[13];
            $this->Background = $values[14];
            $this->BackgroundColor = $values[15];
            $this->BackgroundOpacity = str_replace(",",".",$values[16]);
		}
		else if(func_num_args() > 2)
		{
			$this->HTML = func_get_arg(0);
			$this->Text = func_get_arg(1);
			$values = func_get_arg(2);
           	$this->CloseOnClick = $values[0];
            $this->Position = $values[1];
            $this->Margin = Array($values[2],$values[3],$values[4],$values[5]);
            $this->Effect = $values[6];
            $this->Shadow = $values[7];
            $this->ShadowBlur = $values[8];
            $this->ShadowColor = $values[9];
            $this->ShadowPositionX = $values[10];
			$this->ShadowPositionY = $values[11];
            $this->Speed = $values[12];
            $this->Style = $values[13];
			$this->Background = $values[14];
			$this->BackgroundColor = $values[15];
			$this->BackgroundOpacity = str_replace(",",".",$values[16]);
 		}

		if(!empty($this->Style))
		{
			$dimensions = (!empty(Server::$Configuration->File["gl_caii"]) && @file_exists(TEMPLATE_SCRIPT_INVITATION . $this->Style . "/dimensions_header.txt")) ? explode(",",IOStruct::GetFile(TEMPLATE_SCRIPT_INVITATION . $this->Style . "/dimensions_header.txt")) : explode(",",IOStruct::GetFile(TEMPLATE_SCRIPT_INVITATION . $this->Style . "/dimensions.txt"));
			$this->Width = @$dimensions[0];
			$this->Height = @$dimensions[1];

			$settings_string = (@file_exists(TEMPLATE_SCRIPT_INVITATION . $this->Style . "/settings.txt")) ? IOStruct::GetFile(TEMPLATE_SCRIPT_INVITATION . $this->Style . "/settings.txt") : "";
			
			if(strpos($settings_string,"noshadow") !== false)
				$this->Shadow = false;
		}
		$this->Senders = array();
	}

    function GetSenders($_onlineOnly=true)
    {
        Server::InitDataBlock(array("INTERNAL","GROUPS"));
        foreach($this->Senders as $sender)
            if(empty($sender->UserSystemId) && !empty($sender->GroupId))
            {
                $senderList = array();
                foreach(Server::$Operators as $sysid => $operator)
                    if($operator->IsInGroup($sender->GroupId) && $operator->IsExternal(Server::$Groups,null,array($sender->GroupId),false,false,!$_onlineOnly))
                        $senderList[$sysid] = new EventActionSender($this->ActionId,$sysid,$sender->GroupId,5);
                return $senderList;
            }
        return $this->Senders;
    }

    function GetGroupSender()
    {
        foreach($this->Senders as $sender)
            if(empty($sender->UserSystemId) && !empty($sender->GroupId))
                return $sender->GroupId;
        return "";
    }

	function GetXML()
	{
		$xml = "<evinv id=\"".base64_encode($this->Id)."\" bgo=\"".base64_encode($this->BackgroundOpacity)."\" bgc=\"".base64_encode($this->BackgroundColor)."\" bg=\"".base64_encode($this->Background)."\" ml=\"".base64_encode($this->Margin[0])."\" mt=\"".base64_encode($this->Margin[1])."\" mr=\"".base64_encode($this->Margin[2])."\" mb=\"".base64_encode($this->Margin[3])."\" pos=\"".base64_encode($this->Position)."\" speed=\"".base64_encode($this->Speed)."\" eff=\"".base64_encode($this->Effect)."\" style=\"".base64_encode($this->Style)."\" coc=\"".base64_encode($this->CloseOnClick)."\" sh=\"".base64_encode($this->Shadow)."\"  shpx=\"".base64_encode($this->ShadowPositionX)."\"  shpy=\"".base64_encode($this->ShadowPositionY)."\"  shb=\"".base64_encode($this->ShadowBlur)."\"  shc=\"".base64_encode($this->ShadowColor)."\">\r\n";

		foreach($this->Senders as $sender)
			$xml .= $sender->GetXML();
			
		return $xml . "</evinv>\r\n";
	}
}

class EventTrigger
{
	public $Id;
	public $ActionId;
    public $EventId = "";
	public $ReceiverUserId;
	public $ReceiverBrowserId;
	public $Triggered;
	public $TriggerTime;
	public $Exists = false;
	
	function __construct()
	{
		if(func_num_args() == 6)
		{
			$this->Id = getId(32);
			$this->ReceiverUserId = func_get_arg(0);
			$this->ReceiverBrowserId = func_get_arg(1);
			$this->ActionId = func_get_arg(2);
			$this->TriggerTime = func_get_arg(3);
			$this->Triggered = func_get_arg(4);
            $this->EventId = func_get_arg(5);
		}
		else
		{
			$_row = func_get_arg(0);
			$this->Id = $_row["id"];
			$this->ReceiverUserId = $_row["receiver_user_id"];
			$this->ReceiverBrowserId = $_row["receiver_browser_id"];
			$this->ActionId = $_row["action_id"];
            $this->EventId = $_row["event_id"];
			$this->Triggered = $_row["triggered"];
			$this->TriggerTime = $_row["time"];
		}
	}
	
	function Load()
	{
		$this->Exists = false;
		if($result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_EVENT_TRIGGERS . "` WHERE `receiver_user_id`='" . DBManager::RealEscape($this->ReceiverUserId) . "' AND `receiver_browser_id`='" . DBManager::RealEscape($this->ReceiverBrowserId) . "' AND `action_id`='" . DBManager::RealEscape($this->ActionId) . "' ORDER BY `time` ASC;"))
			if($row = DBManager::FetchArray($result))
			{
				$this->Id = $row["id"];
				$this->TriggerTime = $row["time"];
				$this->Triggered = $row["triggered"];
				$this->Exists = true;
			}
	}
	
	function Update()
	{
		DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_EVENT_TRIGGERS . "` SET `time`='" . DBManager::RealEscape(time()) . "' WHERE `id`='" . DBManager::RealEscape($this->Id) . "' LIMIT 1;");
	}

	function Save()
	{
		if(!$this->Exists)
			DBManager::Execute(true, "INSERT INTO `" . DB_PREFIX . DATABASE_EVENT_TRIGGERS . "` (`id`, `receiver_user_id`, `receiver_browser_id`, `action_id`, `event_id`, `time`, `triggered`) VALUES ('" . DBManager::RealEscape($this->Id) . "','" . DBManager::RealEscape($this->ReceiverUserId) . "', '" . DBManager::RealEscape($this->ReceiverBrowserId) . "','" . DBManager::RealEscape($this->ActionId) . "', '" . DBManager::RealEscape($this->EventId) . "','" . DBManager::RealEscape($this->TriggerTime) . "','" . DBManager::RealEscape($this->Triggered) . "');");
		else
			DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_EVENT_TRIGGERS . "` SET `triggered`=`triggered`+1, `time`='" . DBManager::RealEscape(time()) . "' WHERE `id`='" . DBManager::RealEscape($this->Id) . "' LIMIT 1;");
	}
}

class EventAction
{
	public $Id = "";
	public $EventId = "";
	public $Type = "";
	public $Value = "";
	public $Invitation;
	public $Receivers;
	
	function __construct()
	{
		if(func_num_args() == 1)
		{
			$_row = func_get_arg(0);
			$this->Id = $_row["id"];
			$this->EventId = $_row["eid"];
			$this->Type = $_row["type"];
			$this->Value = $_row["value"];
		}
		else if(func_num_args() == 2)
		{
			$this->Id = func_get_arg(0);
			$this->Type = func_get_arg(1);
		}
		else
		{
			$this->EventId = func_get_arg(0);
			$this->Id = func_get_arg(1);
			$this->Type = func_get_arg(2);
			$this->Value = func_get_arg(3);
		}
		$this->Receivers = array();
	}
	
	function GetSQL()
	{
		return "INSERT INTO `".DB_PREFIX.DATABASE_EVENT_ACTIONS."` (`id`, `eid`, `type`, `value`) VALUES ('".DBManager::RealEscape($this->Id)."', '".DBManager::RealEscape($this->EventId)."','".DBManager::RealEscape($this->Type)."', '".DBManager::RealEscape($this->Value)."');";
	}

	function GetXML()
	{
		$xml =  "<evac id=\"".base64_encode($this->Id)."\" type=\"".base64_encode($this->Type)."\" val=\"".base64_encode($this->Value)."\">\r\n";
		
		if(!empty($this->Invitation))
			$xml .= $this->Invitation->GetXML();

		foreach($this->Receivers as $receiver)
			$xml .= $receiver->GetXML();
			
		return $xml . "</evac>\r\n";
	}
	
	function Exists($_receiverUserId,$_receiverBrowserId)
	{
		if($this->Type == 2 || $this->Type == 22)
		{
			if($result = DBManager::Execute(true, "SELECT `id` FROM `" . DB_PREFIX . DATABASE_CHAT_REQUESTS . "` WHERE `receiver_user_id`='" . DBManager::RealEscape($_receiverUserId) . "' AND `receiver_browser_id`='" . DBManager::RealEscape($_receiverBrowserId) . "' AND `event_action_id`='" . DBManager::RealEscape($this->Id) . "' AND `accepted`='0' AND `declined`='0' LIMIT 1;"))
				if($row = DBManager::FetchArray($result))
					return true;
		}
		return false;
	}

    function Execute($_param,$_visitor,$_chat=null)
    {
        if($this->Type == 7)
        {
            $object = json_decode($this->Value);
            $postData = array("json_visitor"=>json_encode($_visitor));

            if($_chat != null)
                $postData["json_chat"]=json_encode($_chat);

            $response = Server::CallURL($object->Url,$postData);

            if(!empty($response))
            {
                $_visitor->VisitorData->LoadFromEvent($object->ToField,$response);
                $_visitor->ApplyVisitorData();
            }
        }
    }
	
	function GetInternalReceivers()
	{
		$receivers = array();
		if($result = DBManager::Execute(true, "SELECT `receiver_id` FROM `" . DB_PREFIX . DATABASE_EVENT_ACTION_RECEIVERS . "` WHERE `action_id`='" . DBManager::RealEscape($this->Id) . "';"))
			while($row = DBManager::FetchArray($result))
				$receivers[]=$row["receiver_id"];
		return $receivers;
	}
}

class EventActionSender
{
	public $Id = "";
	public $ParentId = "";
	public $UserSystemId = "";
	public $GroupId = "";
	public $Priority = 1;
	
	function __construct()
	{
		if(func_num_args() == 1)
		{
			$_row = func_get_arg(0);
			$this->Id = $_row["id"];
			$this->ParentId = $_row["pid"];
			$this->UserSystemId = $_row["user_id"];
			$this->GroupId = $_row["group_id"];
			$this->Priority = $_row["priority"];
		}
        else if(func_num_args() == 2)
        {
            $this->Id = getId(32);
            $this->ParentId = func_get_arg(0);
            $this->GroupId = func_get_arg(1);
        }
		else if(func_num_args() == 4)
		{
			$this->Id = getId(32);
			$this->ParentId = func_get_arg(0);
			$this->UserSystemId = func_get_arg(1);
			$this->GroupId = func_get_arg(2);
			$this->Priority = func_get_arg(3);
		}
	}
	
	function SaveSender()
	{
		return DBManager::Execute(true, "INSERT INTO `" . DB_PREFIX . DATABASE_EVENT_ACTION_SENDERS . "` (`id`, `pid`, `user_id`, `group_id`, `priority`) VALUES ('" . DBManager::RealEscape($this->Id) . "', '" . DBManager::RealEscape($this->ParentId) . "','" . DBManager::RealEscape($this->UserSystemId) . "','" . DBManager::RealEscape($this->GroupId) . "', " . intval($this->Priority) . ");");
	}

	function GetXML()
	{
		return "<evinvs id=\"".base64_encode($this->Id)."\" userid=\"".base64_encode($this->UserSystemId)."\" groupid=\"".base64_encode($this->GroupId)."\" priority=\"".base64_encode($this->Priority)."\" />\r\n";
	}
}

class EventActionReceiver
{
	public $Id = "";
	public $ReceiverId = "";
	
	function __construct()
	{
		if(func_num_args() == 1)
		{
			$_row = func_get_arg(0);
			$this->Id = $_row["id"];
			$this->ActionId = $_row["action_id"];
			$this->ReceiverId = $_row["receiver_id"];
		}
		else
		{
			$this->Id = getId(32);
			$this->ActionId = func_get_arg(0);
			$this->ReceiverId = func_get_arg(1);
		}
	}
	
	function GetSQL()
	{
		return "INSERT INTO `".DB_PREFIX.DATABASE_EVENT_ACTION_RECEIVERS."` (`id`, `action_id`, `receiver_id`) VALUES ('".DBManager::RealEscape($this->Id)."', '".DBManager::RealEscape($this->ActionId)."', '".DBManager::RealEscape($this->ReceiverId)."');";
	}

	function GetXML()
	{
		return "<evr id=\"".base64_encode($this->Id)."\" rec=\"".base64_encode($this->ReceiverId)."\" />\r\n";
	}
}

class EventURL
{
	public $Id = "";
	public $EventId = "";
	public $URL = "";
	public $Referrer = "";
	public $TimeOnSite = "";
	public $Blacklist;
	
	function __construct()
	{
		if(func_num_args() == 1)
		{
			$_row = func_get_arg(0);
			$this->Id = $_row["id"];
			$this->URL = $_row["url"];
			$this->Referrer = $_row["referrer"];
			$this->TimeOnSite = $_row["time_on_site"];
			$this->Blacklist = !empty($_row["blacklist"]);
		}
		else
		{
			$this->Id = func_get_arg(0);
			$this->EventId = func_get_arg(1);
			$this->URL = strtolower(func_get_arg(2));
			$this->Referrer = strtolower(func_get_arg(3));
			$this->TimeOnSite = func_get_arg(4);
			$this->Blacklist = func_get_arg(5);
		}
	}
	
	function GetSQL()
	{
		return "INSERT IGNORE INTO `".DB_PREFIX.DATABASE_EVENT_URLS."` (`id`, `eid`, `url`, `referrer`, `time_on_site`, `blacklist`) VALUES ('".DBManager::RealEscape($this->Id)."', '".DBManager::RealEscape($this->EventId)."','".DBManager::RealEscape($this->URL)."', '".DBManager::RealEscape($this->Referrer)."', '".DBManager::RealEscape($this->TimeOnSite)."', '".DBManager::RealEscape($this->Blacklist)."');";
	}

	function GetXML()
	{
		return "<evur id=\"".base64_encode($this->Id)."\" url=\"".base64_encode($this->URL)."\" ref=\"".base64_encode($this->Referrer)."\" tos=\"".base64_encode($this->TimeOnSite)."\" bl=\"".base64_encode($this->Blacklist)."\" />\r\n";
	}
}

class Event extends BaseObject
{
	public $Name = "";
	public $PagesVisited = "";
	public $TimeOnSite = "";
	public $Receivers;
	public $URLs;
	public $Actions;
	public $NotAccepted;
	public $NotDeclined;
	public $TriggerTime;
    public $TriggerPage;
	public $SearchPhrase = "";
	public $TriggerAmount;
	public $NotInChat;

	public $Priority;
	public $IsActive;
	public $SaveInCookie;
	public $Goals;
	public $FunnelUrls;
    public $ExcludeMobile;
    public $ExcludeCountries;
    public $IncludeCountries;
    public $DataConditions;

    public $TriggerChatCreated;
    public $TriggerChatClosed;
    public $TriggerTriggerCreated;

    public static $RetryIn = 0;

	function __construct()
	{
		$this->FunnelUrls = array();
		$this->Goals = array();
		if(func_num_args() == 1)
		{
			$_row = func_get_arg(0);
			$this->Id = $_row["id"];
			$this->Name = $_row["name"];
			$this->Edited = $_row["edited"];
			$this->Editor = $_row["editor"];
			$this->Created = $_row["created"];
			$this->Creator = $_row["creator"];
			$this->TimeOnSite = $_row["time_on_site"];
			$this->PagesVisited = $_row["pages_visited"];
			$this->NotAccepted = $_row["not_accepted"];
			$this->NotDeclined = $_row["not_declined"];
			$this->NotInChat = $_row["not_in_chat"];
            $this->TriggerChatCreated = $_row["is_in_chat"];
			$this->TriggerAmount = $_row["max_trigger_amount"];
			$this->TriggerTime = $_row["trigger_again_after"];
            $this->TriggerPage = !empty($_row["trigger_again_page"]);
			$this->SearchPhrase = $_row["search_phrase"];
			$this->Priority = $_row["priority"];
			$this->IsActive = !empty($_row["is_active"]);
			$this->SaveInCookie = !empty($_row["save_cookie"]);
            $this->ExcludeMobile = !empty($_row["exclude_mobile"]);
            $this->ExcludeCountries = $_row["exclude_countries"];
            $this->IncludeCountries = $_row["include_countries"];
            $this->TriggerChatClosed = $_row["chat_ends"];
  			$this->URLs = array();
			$this->Actions = array();
			$this->Receivers = array();
            $this->DataConditions = (isset($_row["data_conditions"]) && !empty($_row["data_conditions"])) ? @unserialize($_row["data_conditions"]) : array();

            for($i=0;$i<count($this->DataConditions);$i++)
            {
                $arr = $this->DataConditions[$i];
                array_walk($arr,"b64dcode");
                $this->DataConditions[$i] = $arr;
            }
		}
		else
		{
			$this->Id = func_get_arg(0);
			$this->Name = func_get_arg(1);
			$this->Edited = func_get_arg(2);
			$this->Created = func_get_arg(3);

            if($this->Created==0)
                $this->Created = time();

            $this->Edited = time();
			$this->Editor = func_get_arg(4);
			$this->Creator = func_get_arg(5);

            if($this->Creator=='')
                $this->Creator = CALLER_SYSTEM_ID;

			$this->TimeOnSite = func_get_arg(6);
			$this->PagesVisited = func_get_arg(7);
			$this->NotAccepted = func_get_arg(8);
			$this->NotDeclined = func_get_arg(9);
			$this->TriggerTime = func_get_arg(10);
			$this->TriggerAmount = func_get_arg(11);
			$this->NotInChat = func_get_arg(12);
			$this->Priority = func_get_arg(13);
			$this->IsActive = func_get_arg(14);
			$this->SearchPhrase = func_get_arg(15);
			$this->SaveInCookie = func_get_arg(16);
            $this->ExcludeMobile = func_get_arg(17);
            $this->ExcludeCountries = func_get_arg(18);
            $this->TriggerChatCreated = func_get_arg(19);
            $this->TriggerPage = func_get_arg(20);
            $this->IncludeCountries = func_get_arg(21);
            $this->TriggerChatClosed = func_get_arg(22);
		}
	}
	
	function MatchesTriggerCriterias($_trigger,$_initial)
	{
		$match = true;
		if($this->TriggerTime > 0 && $_trigger->TriggerTime >= (time()-$this->TriggerTime))
			$match = false;
		else if($this->TriggerAmount == 0 || ($this->TriggerAmount > 0 && $_trigger->Triggered > $this->TriggerAmount))
			$match = false;
        else if($this->TriggerPage && !$_initial)
            $match = false;
		return $match;
	}

    function MatchDataConditions($_visitor)
    {
        if(empty($this->DataConditions))
            return true;
        foreach($this->DataConditions as $dcarr)
        {
            $inputIndex = $dcarr[0];
            $value = $dcarr[1];

            foreach(Server::$Inputs as $input)
            {
                if($input->Index == $inputIndex)
                {
                    if(Is::WildcardMatch(base64_decode($value),$input->GetValue($_visitor)))
                        return true;
                }
            }
        }
        return false;
    }
	
	function MatchVisitorConditions($_pageCount,$_timeOnSite,$_invAccepted,$_invDeclined,$_wasInChat,$_searchPhrase="",$_isMobile=false,$_country="",$_isInChat=false)
	{
		$match = true;

		if($_timeOnSite < 0)
			$_timeOnSite = 0;

        if(empty(Server::$Configuration->File["gl_vmac"]))
            $_timeOnSite = (Visitor::$PollCount-1) * Server::$Configuration->File["poll_frequency_tracking"];

		if($this->PagesVisited > 0 && $_pageCount < $this->PagesVisited)
			$match = false;
		else if($this->TimeOnSite > 0 && $_timeOnSite < ($this->TimeOnSite-3))
        {
            Event::SetRetryIn($this->TimeOnSite-$_timeOnSite);
			$match = false;
        }
		else if(!empty($this->NotAccepted) && $_invAccepted)
			$match = false;
		else if(!empty($this->NotDeclined) && $_invDeclined)
			$match = false;
		else if(!empty($this->NotInChat) && $_wasInChat)
			$match = false;
        else if(!empty($this->TriggerChatCreated) && !$_wasInChat)
            $match = false;
        else if(!empty($this->TriggerChatClosed) && !($_wasInChat && !$_isInChat))
            $match = false;

        if($_isMobile && $this->ExcludeMobile)
            $match = false;

        if(!empty($this->ExcludeCountries) && !empty($_country))
        {
            $countries = explode(",",strtolower($this->ExcludeCountries));
            if(!empty($countries) && in_array(strtolower($_country),$countries))
                $match = false;
        }

        if(!empty($this->IncludeCountries) && !empty($_country))
        {
            $countries = explode(",",strtolower($this->IncludeCountries));
            if(!empty($countries) && !in_array(strtolower($_country),$countries))
                $match = false;
        }
			
		if(!empty($this->SearchPhrase))
		{
			if(empty($_searchPhrase))
				$match = false;
			else
			{
				$spmatch=false;
				$phrases = explode(",",$this->SearchPhrase);
				foreach($phrases as $phrase)
					if(Is::WildcardMatch($phrase,$_searchPhrase))
					{
						$spmatch = true;
						break;
					}
				if(!$spmatch)
					$match = false;
			}
		}

		return $match;
	}
	
	function MatchesURLFunnelCriterias($_history)
	{
		$startpos = -1;
		$count = 0;
		$pos = 0;
		foreach($_history as $hurl)
		{
			$fuid = $this->FunnelUrls[$count];
			if($this->MatchUrls($this->URLs[$fuid],$hurl->Url->GetAbsoluteUrl(),$hurl->Referrer->GetAbsoluteUrl(),time()-($hurl->Entrance)) === true)
			{
				if($startpos==-1)
					$startpos = $pos;
					
				if($startpos+$count==$pos)
					$count++;
				else
				{
					$count = 0;
					$startpos=-1;
				}
				if($count==count($this->FunnelUrls))
					break;
			}
			else
			{
				$count = 0;
				$startpos=-1;
			}
			$pos++;
		}
		return $count==count($this->FunnelUrls);
	}

	function MatchesURLCriterias($_url,$_referrer,$_previous,$_timeOnUrl)
	{
		if(count($this->URLs) == 0)
			return true;
		$_url = @strtolower($_url);
		$_referrer = @strtolower($_referrer);
		$_previous = @strtolower($_previous);
        $match = false;
    	foreach($this->URLs as $url)
		{
			$umatch = $this->MatchUrls($url,$_url,$_referrer,$_timeOnUrl);
            $rmatch = $this->MatchUrls($url,$_url,$_previous,$_timeOnUrl);
            if($umatch === false || $rmatch === false)
				return false;
			if($umatch === true || $rmatch === true)
				$match = true;
		}
		return $match;
	}
	
	function MatchUrls($_eurl,$_url,$_referrer,$_timeOnUrl)
	{
		$valid = true;
		if(!empty($_eurl->URL))
			$valid = Is::WildcardMatch($_eurl->URL,$_url);
		if((!empty($_eurl->URL) && $valid || empty($_eurl->URL)) && !empty($_eurl->Referrer))
    		$valid = Is::WildcardMatch($_eurl->Referrer,$_referrer);

        if($valid)
        {
            if(!empty(Server::$Configuration->File["gl_vmac"]))
                if($_eurl->TimeOnSite > 0 && $_eurl->TimeOnSite > $_timeOnUrl)
                {
                    Event::SetRetryIn($_eurl->TimeOnSite-$_timeOnUrl);
                    return -1;
                }
			return !$_eurl->Blacklist;
        }
		else
			return -1;
	}

	function GetSQL()
	{
		return "INSERT INTO `".DB_PREFIX.DATABASE_EVENTS."` (`id`, `name`, `created`, `creator`, `edited`, `editor`, `pages_visited`, `time_on_site`, `max_trigger_amount`, `trigger_again_after`, `trigger_again_page`, `not_declined`, `not_accepted`, `not_in_chat`, `is_in_chat`, `chat_ends`, `priority`, `is_active`, `search_phrase`, `save_cookie`, `exclude_mobile`, `exclude_countries`, `include_countries`, `data_conditions`) VALUES ('".DBManager::RealEscape($this->Id)."','".DBManager::RealEscape($this->Name)."','".DBManager::RealEscape($this->Created)."','".DBManager::RealEscape($this->Creator)."','".DBManager::RealEscape($this->Edited)."', '".DBManager::RealEscape($this->Editor)."', '".DBManager::RealEscape($this->PagesVisited)."','".DBManager::RealEscape($this->TimeOnSite)."','".DBManager::RealEscape($this->TriggerAmount)."','".DBManager::RealEscape($this->TriggerTime)."',".intval($this->TriggerPage?1:0).",'".DBManager::RealEscape($this->NotDeclined)."', '".DBManager::RealEscape($this->NotAccepted)."',".intval($this->NotInChat ? 1 : 0).",".intval($this->TriggerChatCreated ? 1 : 0).",".intval($this->TriggerChatClosed ? 1 : 0).",'".DBManager::RealEscape($this->Priority)."', '".DBManager::RealEscape($this->IsActive)."', '".DBManager::RealEscape($this->SearchPhrase)."', '".DBManager::RealEscape(($this->SaveInCookie) ? 1 : 0)."', '".DBManager::RealEscape(($this->ExcludeMobile) ? 1 : 0)."', '".DBManager::RealEscape($this->ExcludeCountries)."', '".DBManager::RealEscape($this->IncludeCountries)."', '".DBManager::RealEscape(serialize($this->DataConditions))."');";
	}

	function GetXML()
	{
		$xml = "<ev id=\"".base64_encode($this->Id)."\" sc=\"".base64_encode($this->SaveInCookie)."\" nacc=\"".base64_encode($this->NotAccepted)."\" ndec=\"".base64_encode($this->NotDeclined)."\" name=\"".base64_encode($this->Name)."\" prio=\"".base64_encode($this->Priority)."\" created=\"".base64_encode($this->Created)."\" nic=\"".base64_encode($this->NotInChat)."\" iic=\"".base64_encode($this->TriggerChatCreated)."\" creator=\"".base64_encode($this->Creator)."\" editor=\"".base64_encode($this->Editor)."\" edited=\"".base64_encode($this->Edited)."\" tos=\"".base64_encode($this->TimeOnSite)."\" ta=\"".base64_encode($this->TriggerAmount)."\" tt=\"".base64_encode($this->TriggerTime)."\" tp=\"".base64_encode($this->TriggerPage?1:0)."\" pv=\"".base64_encode($this->PagesVisited)."\" ia=\"".base64_encode($this->IsActive)."\" sp=\"".base64_encode($this->SearchPhrase)."\" em=\"".base64_encode($this->ExcludeMobile ? 1 : 0)."\" cse=\"".base64_encode($this->TriggerChatClosed ? 1 : 0)."\" ec=\"".base64_encode($this->ExcludeCountries)."\" ic=\"".base64_encode($this->IncludeCountries)."\">\r\n";
		
		foreach($this->Actions as $action)
			$xml .= $action->GetXML();
		
		foreach($this->URLs as $url)
			$xml .= $url->GetXML();
			
		foreach($this->Goals as $act)
			$xml .= "<evg id=\"".base64_encode($act->Id)."\" />";
			
		foreach($this->FunnelUrls as $ind => $uid)
			$xml .= "<efu id=\"".base64_encode($uid)."\">".base64_encode($ind)."</efu>";

        foreach($this->DataConditions as $arr)
            $xml .= "<dc ind=\"".base64_encode($arr[0])."\">".base64_encode($arr[1])."</dc>";

		return $xml . "</ev>\r\n";
	}

    function IsInternalAction()
    {
        foreach($this->Actions as $action)
            if($action->Type == 0 || $action->Type == 1)
                return true;
        return false;
    }

    static function SetRetryIn($_seconds)
    {
        if(is_int($_seconds) && $_seconds > 0)
        {
            Event::$RetryIn = max(Event::$RetryIn,$_seconds+1);
        }
    }
}

class Goal
{
	public $Id;
	public $Title;
	public $Description;
	public $Conversion;
	
	function __construct()
	{
		if(func_num_args() == 1)
		{
			$_row = func_get_arg(0);
			$this->Id = $_row["id"];
			$this->Title = $_row["title"];
			$this->Description = $_row["description"];
			$this->Conversion = !empty($_row["conversion"]);
		}
		else
		{
			$this->Id = func_get_arg(0);
			$this->Title = func_get_arg(1);
			$this->Description = func_get_arg(2);
			$this->Conversion = func_get_arg(3);
		}
	}
	
	function Save()
	{
		return "INSERT INTO `".DB_PREFIX.DATABASE_GOALS."` (`id`, `title`, `description`, `conversion`) VALUES ('".DBManager::RealEscape($this->Id)."', '".DBManager::RealEscape($this->Title)."','".DBManager::RealEscape($this->Description)."', '".DBManager::RealEscape($this->Conversion)."');";
	}

	function GetXML()
	{
		return "<tgt id=\"".base64_encode($this->Id)."\" title=\"".base64_encode($this->Title)."\" desc=\"".base64_encode($this->Description)."\" conv=\"".base64_encode($this->Conversion)."\" />\r\n";
	}
}

class Signature
{
    public $Id;
    public $Name;
    public $Signature;
    public $Default;
    public $Deleted;
    public $OperatorId;
    public $GroupId;

    function __construct()
    {
        if(func_num_args() == 1)
        {
            $_row = func_get_arg(0);
            $this->Id = $_row["id"];
            $this->Name = $_row["name"];
            $this->Signature = $_row["signature"];
            $this->OperatorId = $_row["operator_id"];
            $this->GroupId = $_row["group_id"];
            $this->Default = $_row["default"];
        }
    }

    function Save($_prefix)
    {
        DBManager::Execute(true, "DELETE FROM `" . $_prefix . DATABASE_SIGNATURES . "` WHERE `operator_id`='" . DBManager::RealEscape($this->OperatorId) . "' AND `group_id`='" . DBManager::RealEscape($this->GroupId) . "' AND `id`='" . DBManager::RealEscape($this->Id) . "' LIMIT 1;");
        if(!$this->Deleted)
            DBManager::Execute(true, "INSERT INTO `" . $_prefix . DATABASE_SIGNATURES . "` (`id` ,`name` ,`signature` ,`operator_id`,`group_id`,`default`) VALUES ('" . DBManager::RealEscape($this->Id) . "', '" . DBManager::RealEscape($this->Name) . "','" . DBManager::RealEscape($this->Signature) . "', '" . DBManager::RealEscape($this->OperatorId) . "', '" . DBManager::RealEscape($this->GroupId) . "', '" . DBManager::RealEscape($this->Default) . "');");
    }

    function XMLParamAlloc($_param,$_value)
    {
        if($_param =="a")
            $this->Id = $_value;
        else if($_param =="b")
            $this->Default = $_value;
        else if($_param =="c")
            $this->Deleted = $_value;
        else if($_param =="d")
            $this->Name = $_value;
        else if($_param =="e")
            $this->Signature = $_value;
        else if($_param =="f")
            $this->OperatorId = $_value;
        else if($_param =="g")
            $this->GroupId = $_value;
    }

    function GetXML()
    {
        return "<sig i=\"".base64_encode($this->Id)."\" n=\"".base64_encode($this->Name)."\" o=\"".base64_encode($this->OperatorId)."\" g=\"".base64_encode($this->GroupId)."\" d=\"".base64_encode($this->Default ? 1 : 0)."\">".base64_encode($this->Signature)."</sig>\r\n";
    }

    static function DeleteByGroup($_prefix,$_groupId)
    {
        DBManager::Execute(true, "DELETE FROM `" . $_prefix . DATABASE_SIGNATURES . "` WHERE `group_id`='" . DBManager::RealEscape($_groupId) . "';");
    }
}

class ChatArchive
{
    static function GetSearchQuery($_sFor,$_tags)
    {
        $query = "";

        if(!empty($_sFor))
            $query = "(LOWER(`fullname`) LIKE '%".$_sFor."%' OR LOWER(`area_code`) LIKE '%".$_sFor."%' OR LOWER(`plaintext`) LIKE '%".$_sFor."%' OR LOWER(`email`) LIKE '%".$_sFor."%' OR LOWER(`company`) LIKE '%".$_sFor."%' OR LOWER(`phone`) LIKE '%".$_sFor."%' OR LOWER(`chat_id`) LIKE '%".$_sFor."%' OR LOWER(`external_id`) LIKE '%".$_sFor."%' OR LOWER(`customs`) LIKE '%".$_sFor."%' OR LOWER(`question`) LIKE '%".$_sFor."%')";

        if(!empty($_tags))
        {
            if(!empty($_sFor))
                $query .= " AND (";

            $count = 0;
            foreach(explode(",",$_tags) as $tag)
            {
                if($count > 0)
                    $query .= " OR ";

                $query .= "FIND_IN_SET('".DBManager::RealEscape($tag)."',tags) > 0";
                $count++;
            }
            if(!empty($_sFor))
                $query .= ")";
        }
        return $query;
    }

    static function Remove($_chatId)
    {
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_CHAT_ARCHIVE . "` WHERE `chat_id` = '".DBManager::RealEscape($_chatId)."' LIMIT 1;");
        KnowledgeBaseEntry::RemoveByChatId($_chatId);
    }

    static function SetTags($_chatId,$_tags)
    {
        Configuration::ApplyTagsToConfig($_tags,3);
        DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_CHAT_ARCHIVE . "` SET `tags` = '".DBManager::RealEscape($_tags)."' WHERE `chat_id` = '".DBManager::RealEscape($_chatId)."' LIMIT 1;");
        CacheManager::SetDataUpdateTime(DATA_UPDATE_KEY_CHAT_ARCH);
    }
}

class Mailbox
{
    public $Type = "IMAP";
    public $Id = "";
    public $Username = "";
    public $Password = "";
    public $Port = 110;
    public $Host = "";
    public $ExecOperatorId = "";
    public $Delete = 2;
    public $Email = "";
    public $SSL = false;
    public $Authentication = "";
    public $SenderName = "";
    public $Default = false;
    public $ConnectFrequency = 15;
    public $LastConnect = 0;
    public $Framework = "ZEND";

    function __construct()
    {
        if(func_num_args() == 2)
        {
            $this->Id = $_POST["p_cfg_es_i_" . func_get_arg(0)];
            $this->Email = $_POST["p_cfg_es_e_" . func_get_arg(0)];
            $this->Host = $_POST["p_cfg_es_h_" . func_get_arg(0)];
            $this->Username = $_POST["p_cfg_es_u_" . func_get_arg(0)];
            $this->Password = $_POST["p_cfg_es_p_" . func_get_arg(0)];
            $this->Port = $_POST["p_cfg_es_po_" . func_get_arg(0)];
            $this->SSL = $_POST["p_cfg_es_s_" . func_get_arg(0)];
            $this->Authentication = $_POST["p_cfg_es_a_" . func_get_arg(0)];
            $this->Delete = !empty($_POST["p_cfg_es_d_" . func_get_arg(0)]);
            $this->Type = $_POST["p_cfg_es_t_" . func_get_arg(0)];
            $this->SenderName = $_POST["p_cfg_es_sn_" . func_get_arg(0)];
            $this->Default = !empty($_POST["p_cfg_es_de_" . func_get_arg(0)]);
            $this->ConnectFrequency = $_POST["p_cfg_es_c_" . func_get_arg(0)];
            $this->Framework = $_POST["p_cfg_es_fw_" . func_get_arg(0)];
        }
        else
        {
            $row = func_get_arg(0);
            $this->Id = $row["id"];
            $this->Type = $row["type"];
            $this->Email = $row["email"];
            $this->Username = $row["username"];
            $this->Password = $row["password"];
            $this->Port = $row["port"];
            $this->Host = $row["host"];
            $this->ExecOperatorId = $row["exec_operator_id"];
            $this->Delete = !empty($row["delete"]);
            $this->SenderName = $row["sender_name"];
            $this->Authentication = $row["authentication"];
            $this->SSL = $row["ssl"];
            $this->Default = !empty($row["default"]);
            $this->ConnectFrequency = $row["connect_frequency"];
            $this->LastConnect = $row["last_connect"];

            if(isset($row["framework"]))
                $this->Framework = $row["framework"];
        }
    }

    function GetXML($_groupId="")
    {
        return "<tes g=\"".base64_encode($_groupId)."\" f=\"".base64_encode($this->Framework)."\" e=\"".base64_encode($this->Email)."\" c=\"".base64_encode($this->ConnectFrequency)."\" i=\"".base64_encode($this->Id)."\" a=\"".base64_encode($this->Authentication)."\" s=\"".base64_encode($this->SSL)."\" de=\"".base64_encode($this->Default ? "1" : "0")."\" sn=\"".base64_encode($this->SenderName)."\" t=\"".base64_encode($this->Type)."\" u=\"".base64_encode($this->Username)."\" p=\"".base64_encode($this->Password)."\" po=\"".base64_encode($this->Port)."\" d=\"".base64_encode(1)."\" h=\"".base64_encode($this->Host)."\" />\r\n";
    }

    function Save()
    {
        DBManager::Execute(true, "REPLACE INTO `" . DB_PREFIX . DATABASE_MAILBOXES . "` (`id`,`email`,`exec_operator_id`,`username`,`password`,`type`,`host`,`port`,`delete`,`authentication`,`sender_name`,`ssl`,`default`,`last_connect`,`connect_frequency`,`framework`) VALUES ('" . DBManager::RealEscape($this->Id) . "','" . DBManager::RealEscape($this->Email) . "', '" . DBManager::RealEscape($this->ExecOperatorId) . "', '" . DBManager::RealEscape($this->Username) . "', '" . DBManager::RealEscape($this->Password) . "', '" . DBManager::RealEscape($this->Type) . "', '" . DBManager::RealEscape($this->Host) . "', '" . DBManager::RealEscape($this->Port) . "',1, '" . DBManager::RealEscape($this->Authentication) . "', '" . DBManager::RealEscape($this->SenderName) . "'," . abs(intval($this->SSL)) . "," . intval($this->Default ? 1 : 0) . "," . intval($this->LastConnect) . "," . intval($this->ConnectFrequency) . ",'" . DBManager::RealEscape($this->Framework) . "');");
    }

    function SetLastConnect($_time)
    {
        $min = ($_time>0) ? $_time-10 : time()+1;
        DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_MAILBOXES . "` SET `last_connect`=" . $_time . " WHERE `last_connect` < ". intval(abs($min)) ." AND `id`='" . DBManager::RealEscape($this->Id) . "'");
        return DBManager::GetAffectedRowCount();
    }

    function GetLastConnect()
    {
        $result = DBManager::Execute(true, "SELECT `last_connect` FROM `" . DB_PREFIX . DATABASE_MAILBOXES . "` WHERE `id`='" . DBManager::RealEscape($this->Id) . "'");
        if($result)
            while($row = DBManager::FetchArray($result))
                if($row["last_connect"] > 0)
                    return $row["last_connect"];
        return null;
    }

    function Download(&$_reload, $_delete, $_test=false)
    {
        Server::InitDataBlock(array("DBCONFIG","FILTERS"));
        require_once(LIVEZILLA_PATH . "_lib/objects.mail.inc.php");
        $ms = new MailSystem($this);
        $mails = $list = array();

        try
        {
            $mails = $ms->ReceiveEmails($_reload, $_delete, $_test);
            if($_test)
                return $mails;
        }
        catch (Exception $e)
        {
            if($_test)
                throw $e;
            else
                Logging::EmailLog("Email Error #110: " . $this->Host . " " . $this->Type . " mailbox connection error: " . $e->getMessage());
            return $mails;
        }

        if(is_array($mails))
            foreach($mails as $index => $mail)
            {
                if(!Server::$Filters->MatchEmail($mail->Email,$mail->Subject))
                    $list[$index] = $mail;
            }

        return $list;
    }

    static function ResetDownloadTime(){
        foreach(Server::$Configuration->Database["gl_email"] as $mb)
            if($mb->Type != "SMTP")
                $mb->SetLastConnect(0);
    }

    static function GetDefaultOutgoing()
    {
        Server::InitDataBlock(array("DBCONFIG"));
        if(!empty(Server::$Configuration->Database["gl_email"]))
            foreach(Server::$Configuration->Database["gl_email"] as $box)
                if($box->Default && $box->Type != 'POP' && $box->Type != 'IMAP')
                    return $box;
        return null;
    }

    static function GetById($_id,$_defaultOutgoing=false)
    {
        Server::InitDataBlock(array("DBCONFIG"));
        if(!empty(Server::$Configuration->Database["gl_email"]))
            foreach(Server::$Configuration->Database["gl_email"] as $box)
                if($box->Id == $_id)
                    return $box;
        if($_defaultOutgoing)
            return Mailbox::GetDefaultOutgoing();
        return null;
    }

    static function IsValidEmail($_email)
    {
        return preg_match('/^([*+!.&#$?\'\\%\/0-9a-z^_`{}=?~:-]+)@(([0-9a-z-]+\.)+[0-9a-z]{2,4})$/i', $_email);
    }

    static function FinalizeDataBlock($_text,$_html,$_remove=false)
    {
        if($_remove)
            $_text = str_replace("<!--lz_ref_link-->","",$_text);
        else if($_html)
            $_text = str_replace("<!--lz_ref_link-->","<br><br>".parseURL(@Server::$Configuration->File["gl_cpae"]),$_text);
        else
            $_text = str_replace("<!--lz_ref_link-->","\r\n\r\n".@Server::$Configuration->File["gl_cpae"],$_text);
        return $_text;
    }

    static function GetSubject($_subject,$_email,$_username,$_group,$_chatid,$_company,$_phone,$_ip,$_question,$_language,$_customs=null)
    {
        $_subject = Configuration::Replace($_subject);
        $_subject = str_replace(array("%external_name%","%USERNAME%"),$_username,$_subject);
        $_subject = str_replace(array("%external_email%","%USEREMAIL%"),$_email,$_subject);
        $_subject = str_replace(array("%external_company%","%USERCOMPANY%"),$_company,$_subject);
        $_subject = str_replace("%external_phone%",$_phone,$_subject);
        $_subject = str_replace("%external_ip%",$_ip,$_subject);
        $_subject = str_replace(array("%question%","%USERQUESTION%","%mailtext%"),$_question,$_subject);
        $_subject = str_replace(array("%group_name%","%group_id%","%TARGETGROUP%"),$_group,$_subject);
        $_subject = str_replace("%group_description%",((isset(Server::$Groups[$_group])) ? Server::$Groups[$_group]->GetDescription($_language) : $_group),$_subject);
        $_subject = str_replace(array("%chat_id%","%CHATID%"),$_chatid,$_subject);

        foreach(Server::$Inputs as $index => $input)
            if($input->Active && $input->Custom)
            {
                if($input->Type == "CheckBox")
                    $_subject = str_replace("%custom".($index)."%",((!empty($_customs[$index])) ? LocalizationManager::$TranslationStrings["client_yes"] : LocalizationManager::$TranslationStrings["client_no"]),$_subject);
                else if(!empty($_customs[$index]))
                    $_subject = str_replace("%custom".($index)."%",$input->GetClientValue($_customs[$index]),$_subject);
                else
                    $_subject = str_replace("%custom".($index)."%","",$_subject);
            }
            else
                $_subject = str_replace("%custom".($index)."%","",$_subject);

        return Server::Replace(str_replace("\n","",$_subject),true,false);
    }
}

class PredefinedMessage
{
	public $LangISO = "";
	public $InvitationChatAuto = "";
    public $InvitationTicketAuto = "";
	public $InvitationChatManual = "";
	public $Welcome = "";
	public $IsDefault;
	public $AutoWelcome = true;
	public $GroupId = "";
	public $UserId = "";
	public $Editable = true;
	public $TicketInformation = "";
	public $ChatInformation = "";
	public $CallMeBackInformation = "";
	public $ChatInformationOffline = "";
    public $SubjectChatTranscript = "";
    public $SubjectTicketResponder = "";
    public $SubjectTicketReply = "";
    public $EmailChatTranscriptBodyPlaintext = "";
    public $EmailTicketResponderBodyPlaintext = "";
    public $EmailTicketReplyBodyPlaintext = "";
    public $Id = 0;
    public $EmailChatTranscriptBodyHTML = false;
    public $EmailTicketResponderBodyHTML = false;
    public $EmailTicketReplyBodyHTML = false;
    public $Deleted = false;
    public $TOSChat = "";
    public $TOSTicket = "";
    public $TOSCallback = "";
    public $AutoCloseOperator = "";
    public $AutoCloseCustomer = "";

    function __construct()
	{
        if(func_num_args() == 2)
		{
			$_row = func_get_arg(1);
			$this->LangISO = $_row["lang_iso"];
			$this->InvitationChatAuto = @$_row["invitation_auto"];
			$this->InvitationChatManual = @$_row["invitation_manual"];
			$this->Welcome = $_row["welcome"];
			
			if(!empty($_row["chat_info_offline"]))
				$this->ChatInformationOffline = $_row["chat_info_offline"];
				
			$this->IsDefault = !empty($_row["is_default"]);
			$this->AutoWelcome = !empty($_row["auto_welcome"]);
			$this->Editable = !empty($_row["editable"]);
			$this->TicketInformation = @$_row["ticket_info"];
			$this->ChatInformation = @$_row["chat_info"];
			$this->CallMeBackInformation = @$_row["call_me_back_info"];
			$this->EmailChatTranscriptBodyPlaintext = @$_row["email_chat_transcript"];
			$this->EmailTicketResponderBodyPlaintext = @$_row["email_ticket_responder"];
            $this->EmailTicketReplyBodyPlaintext = @$_row["email_ticket_reply"];
            $this->SubjectChatTranscript = @$_row["subject_chat_transcript"];
            $this->SubjectTicketResponder = @$_row["subject_ticket_responder"];
            $this->SubjectTicketReply = @$_row["subject_ticket_reply"];
            $this->EmailChatTranscriptBodyHTML = @$_row["email_chat_transcript_html"];
            $this->EmailTicketResponderBodyHTML = @$_row["email_ticket_responder_html"];
            $this->EmailTicketReplyBodyHTML = @$_row["email_ticket_reply_html"];
            $this->TOSChat = $_row["tos_chat"];
            $this->TOSTicket = $_row["tos_ticket"];
            $this->TOSCallback = @$_row["tos_callback"];
            $this->AutoCloseCustomer = @$_row["auto_close_customer"];
            $this->AutoCloseOperator = @$_row["auto_close_operator"];
            $this->InvitationTicketAuto = @$_row["ticket_invite_auto"];
		}
	}
	
	function XMLParamAlloc($_param,$_value)
	{
		if($_param =="inva")
			$this->InvitationChatAuto = base64_decode($_value);
		else if($_param =="invm")
			$this->InvitationChatManual = base64_decode($_value);
        else if($_param =="tina")
            $this->InvitationTicketAuto = base64_decode($_value);
		else if($_param =="wel")
			$this->Welcome = base64_decode($_value);
		else if($_param =="cioff")
			$this->ChatInformationOffline = base64_decode($_value);
		else if($_param =="def")
			$this->IsDefault = $_value;
		else if($_param =="aw")
			$this->AutoWelcome = $_value;
		else if($_param =="edit")
			$this->Editable = $_value;
		else if($_param =="ci")
			$this->ChatInformation = base64_decode($_value);
		else if($_param =="ccmbi")
			$this->CallMeBackInformation = base64_decode($_value);
		else if($_param =="ti")
			$this->TicketInformation = base64_decode($_value);
		else if($_param =="del")
			$this->Deleted = !empty($_value);
        else if($_param =="sct")
            $this->SubjectChatTranscript = base64_decode($_value);
        else if($_param =="st")
            $this->SubjectTicketResponder = base64_decode($_value);
        else if($_param =="str")
            $this->SubjectTicketReply = base64_decode($_value);
        else if($_param =="hct")
            $this->EmailChatTranscriptBodyHTML = base64_decode($_value);
        else if($_param =="ht")
            $this->EmailTicketResponderBodyHTML = base64_decode($_value);
        else if($_param =="htr")
            $this->EmailTicketReplyBodyHTML = base64_decode($_value);
        else if($_param =="ect")
            $this->EmailChatTranscriptBodyPlaintext = base64_decode($_value);
        else if($_param =="et")
            $this->EmailTicketResponderBodyPlaintext = base64_decode($_value);
        else if($_param =="etr")
            $this->EmailTicketReplyBodyPlaintext = base64_decode($_value);
        else if($_param =="tosc")
            $this->TOSChat = base64_decode($_value);
        else if($_param =="toscb")
            $this->TOSCallback = base64_decode($_value);
        else if($_param =="tost")
            $this->TOSTicket = base64_decode($_value);
        else if($_param =="aco")
            $this->AutoCloseOperator = base64_decode($_value);
        else if($_param =="acc")
            $this->AutoCloseCustomer = base64_decode($_value);
	}
	
	function Save($_prefix)
	{
        if($this->Deleted)
		    DBManager::Execute(true, "DELETE FROM `" . $_prefix . DATABASE_PREDEFINED . "` WHERE `internal_id`='" . DBManager::RealEscape($this->UserId) . "' AND `group_id`='" . DBManager::RealEscape($this->GroupId) . "' AND `lang_iso`='" . DBManager::RealEscape($this->LangISO) . "' LIMIT 1;");
		else
			DBManager::Execute(true, "REPLACE INTO `" . $_prefix . DATABASE_PREDEFINED . "` (`id` ,`internal_id` ,`group_id` ,`lang_iso` ,`invitation_manual`,`invitation_auto` ,`welcome` ,`chat_info_offline`,`website_push_manual` ,`website_push_auto`,`chat_info`,`call_me_back_info`,`ticket_info` ,`browser_ident` ,`is_default` ,`auto_welcome`,`editable`,`email_chat_transcript`,`email_ticket_responder`,`email_ticket_reply`,`subject_chat_transcript`,`subject_ticket_responder`,`subject_ticket_reply`,`email_chat_transcript_html`,`email_ticket_responder_html`,`email_ticket_reply_html`,`tos_chat`,`tos_ticket`,`tos_callback`,`auto_close_operator`,`auto_close_customer`,`ticket_invite_auto`) VALUES ('" . DBManager::RealEscape($this->Id) . "', '" . DBManager::RealEscape($this->UserId) . "','" . DBManager::RealEscape($this->GroupId) . "', '" . DBManager::RealEscape($this->LangISO) . "', '" . DBManager::RealEscape($this->InvitationChatManual) . "', '" . DBManager::RealEscape($this->InvitationChatAuto) . "','" . DBManager::RealEscape($this->Welcome) . "','" . DBManager::RealEscape($this->ChatInformationOffline) . "', '" . DBManager::RealEscape('') . "', '" . DBManager::RealEscape('') . "',  '" . DBManager::RealEscape($this->ChatInformation) . "',  '" . DBManager::RealEscape($this->CallMeBackInformation) . "', '" . DBManager::RealEscape($this->TicketInformation) . "','" . DBManager::RealEscape('1') . "', '" . DBManager::RealEscape($this->IsDefault ? '1' : '0') . "', '" . DBManager::RealEscape($this->AutoWelcome ? '1' : '0') . "', '" . DBManager::RealEscape($this->Editable ? '1' : '0') . "', '" . DBManager::RealEscape($this->EmailChatTranscriptBodyPlaintext) . "', '" . DBManager::RealEscape($this->EmailTicketResponderBodyPlaintext) . "','" . DBManager::RealEscape($this->EmailTicketReplyBodyPlaintext) . "', '" . DBManager::RealEscape($this->SubjectChatTranscript) . "', '" . DBManager::RealEscape($this->SubjectTicketResponder) . "', '" . DBManager::RealEscape($this->SubjectTicketReply) . "', '" . DBManager::RealEscape($this->EmailChatTranscriptBodyHTML) . "', '" . DBManager::RealEscape($this->EmailTicketResponderBodyHTML) . "', '" . DBManager::RealEscape($this->EmailTicketReplyBodyHTML) . "', '" . DBManager::RealEscape($this->TOSChat) . "',  '" . DBManager::RealEscape($this->TOSTicket) . "','" . DBManager::RealEscape($this->TOSCallback) . "', '" . DBManager::RealEscape($this->AutoCloseOperator) . "', '" . DBManager::RealEscape($this->AutoCloseCustomer) . "', '" . DBManager::RealEscape($this->InvitationTicketAuto) . "');");
    }

	function GetXML($_serversetup=true)
	{
        if($_serversetup)
            return "<pm et=\"".base64_encode($this->EmailTicketResponderBodyPlaintext)."\" etr=\"".base64_encode($this->EmailTicketReplyBodyPlaintext)."\" ect=\"".base64_encode($this->EmailChatTranscriptBodyPlaintext)."\" ti=\"".base64_encode($this->TicketInformation)."\" ci=\"".base64_encode($this->ChatInformation)."\" st=\"".base64_encode($this->SubjectTicketResponder)."\" str=\"".base64_encode($this->SubjectTicketReply)."\" sct=\"".base64_encode($this->SubjectChatTranscript)."\" ccmbi=\"".base64_encode($this->CallMeBackInformation)."\" lang=\"".base64_encode($this->LangISO)."\" invm=\"".base64_encode($this->InvitationChatManual)."\" inva=\"".base64_encode($this->InvitationChatAuto)."\" tina=\"".base64_encode($this->InvitationTicketAuto)."\" wel=\"".base64_encode($this->Welcome)."\" cioff=\"".base64_encode($this->ChatInformationOffline)."\" wpa=\"".base64_encode('')."\" wpm=\"".base64_encode('')."\" bi=\"".base64_encode(1)."\" def=\"".base64_encode($this->IsDefault)."\" aw=\"".base64_encode($this->AutoWelcome)."\" edit=\"".base64_encode($this->Editable)."\" hct=\"".base64_encode($this->EmailChatTranscriptBodyHTML)."\" ht=\"".base64_encode($this->EmailTicketResponderBodyHTML)."\" htr=\"".base64_encode($this->EmailTicketReplyBodyHTML)."\" tosc=\"".base64_encode($this->TOSChat)."\" toscb=\"".base64_encode($this->TOSCallback)."\" tost=\"".base64_encode($this->TOSTicket)."\" aco=\"".base64_encode($this->AutoCloseOperator)."\" acc=\"".base64_encode($this->AutoCloseCustomer)."\" />\r\n";
        else
		    return "<pm lang=\"".base64_encode($this->LangISO)."\" invm=\"".base64_encode($this->InvitationChatManual)."\" wel=\"".base64_encode($this->Welcome)."\" cioff=\"".base64_encode($this->ChatInformationOffline)."\" wpa=\"".base64_encode('')."\" bi=\"".base64_encode(1)."\" def=\"".base64_encode($this->IsDefault)."\" aw=\"".base64_encode($this->AutoWelcome)."\" edit=\"".base64_encode($this->Editable)."\" />\r\n";
	}

    static function GetByLanguage($_list, $_language)
    {
        $sel_message = null;
        foreach($_list as $message)
        {
            if(($message->IsDefault && (empty($_language))) || (!empty($_language) && $_language == $message->LangISO))
            {
                $sel_message = $message;
                break;
            }
            else if($message->IsDefault)
                $sel_message = $message;
        }
        return $sel_message;
    }

    static function DeleteByGroup($_prefix,$_groupId)
    {
        DBManager::Execute(true, "DELETE FROM `" . $_prefix . DATABASE_PREDEFINED . "` WHERE `group_id`='" . DBManager::RealEscape($_groupId) . "';");
    }
}

class ChatAutoReply
{
	public $Id;
	public $ResourceId = "";
	public $Tags = "";
	public $SearchType = 0;
	public $Answer;
	public $Languages = "";
	public $NewWindow = false;
    public $Waiting = false;
    public $Send = true;
    public $SendInactivityTimeInternal = -1;
    public $SendInactivityTimeExternal = -1;
    public $CloseChat = false;
    public $Title = "";
    public $SourceType;
    public $ContentType = "string";

	function __construct()
   	{
		if(func_num_args() == 1)
		{
			$row = func_get_arg(0);
            $this->Id = $row["id"];
            $this->ResourceId = $row["resource_id"];
            $this->Tags = $row["tags"];
			$this->Languages = $row["language"];
			$this->SearchType = $row["search_type"];
			$this->Answer = $row["answer"];
			$this->NewWindow = !empty($row["new_window"]);
            $this->Waiting = !empty($row["waiting"]);
            $this->Send = !empty($row["send"]);
            $this->SendInactivityTimeInternal = $row["inactivity_internal"];
            $this->SendInactivityTimeExternal = $row["inactivity_external"];
            $this->CloseChat = !empty($row["inactivity_close"]);
            $this->Title = $row["title"];
            $this->SourceType = "auto_reply";

		}
        else if(func_num_args() == 2)
        {
            $kbEntry = func_get_arg(1);
            $this->Id = getId(32);
            $this->ResourceId = $kbEntry->Id;
            $this->Tags = $kbEntry->Tags;
            $this->Languages = $kbEntry->Languages;
            $this->SearchType = 1;
            $this->Title = $kbEntry->Title;
            $this->NewWindow = true;
            $this->SourceType = "knowledge_base";
        }
        else if(func_num_args() == 3)
        {
            $this->Id = func_get_arg(0);
            $this->ContentType = func_get_arg(1);
            $this->Answer = func_get_arg(2);
            $this->SourceType = "user_api";
        }
   	}
	
	function GetXML()
	{
		return "<bf i=\"".base64_encode($this->Id)."\" t=\"".base64_encode($this->Title)."\" ti=\"".base64_encode($this->SendInactivityTimeInternal)."\" te=\"".base64_encode($this->SendInactivityTimeExternal)."\" c=\"".base64_encode($this->CloseChat ? 1 : 0)."\" l=\"".base64_encode($this->Languages)."\" n=\"".base64_encode($this->NewWindow ? 1 : 0)."\" ds=\"".base64_encode($this->Send ? 1 : 0)."\" w=\"".base64_encode($this->Waiting ? 1 : 0)."\" r=\"".base64_encode($this->ResourceId)."\" s=\"".base64_encode($this->SearchType)."\" a=\"".base64_encode($this->Answer)."\">".base64_encode($this->Tags)."</bf>\r\n";
	}

	function Save($_botId)
	{
		DBManager::Execute(true, "INSERT INTO `" . DB_PREFIX . DATABASE_AUTO_REPLIES . "` (`id` ,`resource_id` ,`owner_id` ,`tags` ,`search_type`,`answer`,`new_window`,`language`,`send`,`waiting`,`inactivity_internal`,`inactivity_external`,`inactivity_close`,`title`) VALUES ('" . DBManager::RealEscape($this->Id) . "','" . DBManager::RealEscape($this->ResourceId) . "','" . DBManager::RealEscape($_botId) . "','" . DBManager::RealEscape($this->Tags) . "','" . DBManager::RealEscape($this->SearchType) . "','" . DBManager::RealEscape($this->Answer) . "','" . DBManager::RealEscape($this->NewWindow ? 1 : 0) . "','" . DBManager::RealEscape($this->Languages) . "','" . DBManager::RealEscape($this->Send ? 1 : 0) . "','" . DBManager::RealEscape($this->Waiting ? 1 : 0) . "','" . DBManager::RealEscape($this->SendInactivityTimeInternal) . "','" . DBManager::RealEscape($this->SendInactivityTimeExternal) . "','" . DBManager::RealEscape($this->CloseChat ? 1 : 0) . "','" . DBManager::RealEscape($this->Title) . "');");
	}

    function MatchesLanguage($_language)
    {
        if(empty($_language))
            return (empty($this->Languages));
        return !(strpos(strtolower($this->Languages),strtolower($_language))===false && !empty($this->Languages));
    }

    static function GetMatches($_list, $_question, $_language, $_chat, $_internal, $lmsi=false, $lmse=false, $lpi=null, $lpe=null)
    {
        $answers = array();
        foreach($_list as $reply)
        {
            if(!isset($reply->SearchType))
                continue;

            if($_chat != null)
            {
                $reply->Answer = $_chat->TextReplace($reply->Answer);

                //Server::InitDataBlock(array("VISITOR"));
                //if(isset(Server::$Visitors[$_chat->UserId]))
                    //$reply->Answer = Server::$Visitors[$_chat->UserId]->TextReplace($reply->Answer);
            }

            if($_internal != null)
                $reply->Answer = $_internal->TextReplace($reply->Answer);

            if($reply->SearchType != 5)
                $reply->Tags = str_replace(array("!",".","?","=",")","(","-","_",":","#","~","?"),"",strtolower($reply->Tags));
            if(!$reply->MatchesLanguage($_language))
                continue;

            if(empty($_chat->AllocatedTime) && !$reply->Waiting)
            {
                if(!($_internal != null && $_internal->IsBot))
                    continue;
            }
            $answers[] = $reply;

            /*
             $waitsum = 0;
            $usedResIds = array();
            $tags = explode(",", $reply->Tags);
            $count=0;

            if(!$_internal->IsBot)
            {
                if(!empty($_chat))
                {
                    if($lmsi === false && ($reply->SendInactivityTimeInternal > -1 || $reply->SendInactivityTimeExternal > -1))
                    {
                        $lpi = Chat::GetLastPost($_chat->ChatId,true);
                        $lpe = Chat::GetLastPost($_chat->ChatId,false);

                        $lmsi = ($lpi != null) ? $lpi->Created : 0;
                        $lmse = ($lpe != null) ? $lpe->Created : $_chat->AllocatedTime;
                    }

                    $lm = max($lmsi,$lmse);
                    $lastMessageExternal = ($lmse > $lmsi && !empty($lm));
                    $lastMessageInternal = ($lmsi >= $lmse || $lpe == null);

                    if(empty($lm))
                        $lm = $_chat->AllocatedTime;

                    if(!empty($lm))
                    {
                        $wasAutoPost = ChatAutoReply::WasAutoReplyMessage($lpi,$_list);
                        if(!$wasAutoPost)
                        {
                            if($reply->SendInactivityTimeInternal > -1 && $lastMessageExternal && $lmsi > 0)
                                if((time()-$lm) > $reply->SendInactivityTimeInternal)
                                    $answers[$count."-".count($answers)] = $reply;
                            if($reply->SendInactivityTimeExternal > -1 && $lastMessageInternal)
                            {
                                $lipa = Chat::GetLastPosts($_chat->ChatId,true,count($_list),$lmse);
                                if(count($lipa)>1)
                                    $waitsum = (time() - $lm);

                                if((time()-$lm) > ($reply->SendInactivityTimeExternal - $waitsum))
                                    if(!in_array($reply->Answer,$lipa))
                                        $answers[$count."-".count($answers)] = $reply;
                            }
                            if($reply->CloseChat && !empty($_chat) && !empty($_internal))
                                if(count($answers)>0 && isset($answers["0-0"]) && $answers["0-0"] == $reply)
                                    $_chat->InternalClose($_internal->SystemId);
                        }
                    }
                }
            }


            if($reply->SendInactivityTimeInternal == -1 && $reply->SendInactivityTimeExternal == -1)
            {
                foreach($tags as $tag)
                {
                    if($reply->SearchType == 5)
                    {
                        if(@preg_match($reply->Tags, $_question) === 1)
                            $count++;
                    }
                    else if(!empty($tag) && ($reply->SearchType < 4 && strpos($_question,$tag)!==false) || Is::WildcardMatch($tag,$_question))
                        $count++;
                    if(($reply->SearchType==0 && $count==(substr_count($reply->Tags,",")+1)) || ($reply->SearchType>0 && $count >=$reply->SearchType) || ($reply->SearchType>=4 && $count>0))
                    {
                        if(empty($reply->Answer))
                        {
                            if(KnowledgeBaseEntry::GetById($reply->ResourceId) !== null && !isset($usedResIds[$reply->ResourceId]))
                            {
                                $answers[$count."-".count($answers)] = $reply;
                                $usedResIds[$reply->ResourceId] = true;
                            }
                        }
                        else
                        {
                            $answers = array();
                            $answers[$count."-".count($answers)] = $reply;
                            break;
                        }
                    }
                }
            }
            */


        }
        return $answers;
    }

    static function SendAutoReply($_reply,$_user,$_sender)
    {
        $arpost = new Post($id = getId(32),Server::$Operators[$_user->Browsers[0]->OperatorId]->SystemId,$_user->Browsers[0]->SystemId,$_reply,time(),$_user->Browsers[0]->ChatId,Server::$Operators[$_user->Browsers[0]->OperatorId]->Fullname);
        $arpost->ReceiverOriginal = $arpost->ReceiverGroup = $_user->Browsers[0]->SystemId;
        $arpost->Save();
        foreach($_user->Browsers[0]->Members as $opsysid => $member)
        {
            $sname = (!empty($_sender) && isset($_sender->Fullname)) ? $_sender->Fullname : "";
            $rpost = new Post($id,Server::$Operators[$_user->Browsers[0]->OperatorId]->SystemId,$opsysid,$_reply,time(),$_user->Browsers[0]->ChatId,$sname);
            $rpost->ReceiverOriginal = $rpost->ReceiverGroup = $_user->Browsers[0]->SystemId;
            $rpost->Save();
        }
    }

    static function WasAutoReplyMessage($_post,$_list)
    {
        if($_post==null)
            return false;
        foreach($_list as $reply)
        {
            if($reply->Answer==$_post->Text)
                return true;
            else if(empty($reply->Answer))
            {
                $res = KnowledgeBaseEntry::GetById($reply->ResourceId);
                if($res !== null && $_post->Text == $res["value"])
                    return true;
            }
        }
        return false;
    }
}

class DataInput
{
    public $Id = "";
	public $Index;
	public $Caption = "";
    public $InfoText = "";
	public $Type;
	public $Active;
	public $InputValue = "";
	public $Cookie;
	public $Custom;
	public $Name;
	public $Position;
	public $Validate;
	public $ValidationURL;
	public $ValidationTimeout = 15;
	public $ValidationContinueOnTimeout;
    public $AutoCapitalize = false;
    public $ScreenCapture = false;

	function __construct($_values)
	{
        $this->Id = getId(15);
		if($_values != null)
		{
			$_values = @unserialize(base64_decode($_values));
			array_walk($_values,"b64dcode");
			$this->Index = $_values[0];
			$this->Caption = (strpos($_values[1],"<!--lang") !== false) ? Server::Replace($_values[1],true,false) : $_values[1];
			$this->Name = $_values[2];
			$this->Type = $_values[3];
			$this->Active = (empty($_GET["ofc"]) || $this->Index!=116) ? !empty($_values[4]) : true;
			$this->Cookie = !empty($_values[5]);
			$this->Position = $_values[6];
			$this->InputValue = (strpos($_values[7],"<!--lang") !== false) ? Server::Replace($_values[7],true,false) : $_values[7];
			$this->Custom = ($this->Index<100);
			$this->Validate = !empty($_values[8]);
			$this->ValidationURL = $_values[9];
			$this->ValidationTimeout = $_values[10];
			$this->ValidationContinueOnTimeout = !empty($_values[11]);

            if(count($_values) > 12)
                $this->InfoText = $_values[12];

            if(count($_values) > 13)
                $this->ScreenCapture = !empty($_values[13]);
		}
		else
		{
			$this->Index = 115;
			$this->Custom = false;
			$this->Position = 10000;
			$this->Cookie = false;
			$this->Active = true;
			$this->Validate = false;
			$this->Type = "Text";
		}
	}
	
	function GetHTML($_maxlength,$_active,$_overlay=false)
	{
        $cpPlain = strip_tags($this->Caption);
        if(Str::EndsWith($cpPlain,":") && strlen($cpPlain)>1)
            $cpPlain = substr($cpPlain,0,strlen($cpPlain)-1);

        $fileTemplate = (!$_overlay) ? "login_file.tpl" : "login_file_link.tpl";

        if($this->Type == "CheckBox")
            $template = ($_overlay) ? IOStruct::GetFile(TEMPLATE_SCRIPT_OVERLAY_CHAT . "login_check.tpl") : IOStruct::GetFile(PATH_TEMPLATES . "login_check.tpl");
        else
		    $template = (($this->Type == "Text") ? IOStruct::GetFile(PATH_TEMPLATES . "login_input.tpl") : (($this->Type == "TextArea") ? IOStruct::GetFile(PATH_TEMPLATES . "login_area.tpl") : (($this->Type == "ComboBox") ? IOStruct::GetFile(PATH_TEMPLATES . "login_combo.tpl") : IOStruct::GetFile(PATH_TEMPLATES . $fileTemplate))));

        $template = str_replace("<!--maxlength-->",$_maxlength,$template);
		$template = str_replace("<!--caption-->",$this->Caption,$template);
        $template = str_replace("<!--caption_plain-->",$cpPlain,$template);
        $template = str_replace("<!--info_text-->",$this->InfoText,$template);
        $template = str_replace("<!--id-->",$this->Id,$template);
		$template = str_replace("<!--name-->",$this->Index,$template);
		$template = str_replace("<!--active-->",To::BoolString($_active),$template);
        $template = str_replace("<!--kb_match_info-->",($this->Index == 114) ? ($_overlay) ? IOStruct::GetFile(TEMPLATE_SCRIPT_OVERLAY_CHAT . "kb_match_info.tpl") : IOStruct::GetFile(PATH_TEMPLATES . "kb_match_info.tpl") : "",$template);

		if($this->Type == "ComboBox")
		{
			$options = "";
			$parts = explode(";",$this->InputValue);
			foreach($parts as $ind => $part)
				$options .= "<option value=\"".$ind."\">".$part."</option>";
			$template = str_replace("<!--options-->",$options,$template);
		}
		return $template;
	}
	
	function GetValue($_visitor)
	{
		if($this->Custom && !empty($_visitor->VisitorData->Customs[$this->Index]))
			return $_visitor->VisitorData->Customs[$this->Index];
		else if($this->Index == 111)
			return $_visitor->VisitorData->Fullname;
		else if($this->Index == 112)
			return $_visitor->VisitorData->Email;
		else if($this->Index == 113)
			return $_visitor->VisitorData->Company;
		else if($this->Index == 114)
        {
            if(isset($_visitor->Browsers[0]->Subject))
            {
                return $_visitor->Browsers[0]->Subject;
            }

			return $_visitor->VisitorData->Text;
        }
		else if($this->Index == 116)
			return $_visitor->VisitorData->Phone;
		else
			return "";
	}

    function GetServerInput($_default="",&$_changed=false,$_capitalize=false)
    {
        $rValue = "";

        if($this->PostIndexName() != null && isset($_POST[$this->PostIndexName()]) && Encoding::Base64UrlDecode($_POST[$this->PostIndexName()]) != "")
            $rValue = Encoding::Base64UrlDecode($_POST[$this->PostIndexName()]);
        else if($this->GetIndexName() != null && isset($_GET[$this->GetIndexName()]) && ($_GET[$this->GetIndexName()]) != "")
        {
            // deprecated; compatibility
            if($this->GetIndexEncoding($this->GetIndexName())=="b64u")
                $rValue = Encoding::Base64UrlDecode($_GET[$this->GetIndexName()]);
            else
                $rValue = urldecode($_GET[$this->GetIndexName()]);
        }
        else if($this->GetExternalIndexName() != null && isset($_GET[$this->GetExternalIndexName()]) && ($_GET[$this->GetExternalIndexName()]) != "")
            $rValue = urldecode($_GET[$this->GetExternalIndexName()]);
        else if(isset($_GET["f" . $this->Index]) && Encoding::Base64UrlDecode($_GET["f" . $this->Index]) != "")
            $rValue = Encoding::Base64UrlDecode($_GET["f" . $this->Index]);
        else if(isset($_POST["p_cf" . $this->Index]) && Encoding::Base64UrlDecode($_POST["p_cf" .  $this->Index]) != "")
            $rValue = Encoding::Base64UrlDecode($_POST["p_cf" . $this->Index]);
        else if(isset($_POST["p_f" . $this->Index]) && Encoding::Base64UrlDecode($_POST["p_f" .  $this->Index]) != "")
            $rValue = Encoding::Base64UrlDecode($_POST["p_f" . $this->Index]);
        else if(isset($_GET["cf" . $this->Index]) && Encoding::Base64UrlDecode($_GET["cf" . $this->Index]) != "")
            $rValue = Encoding::Base64UrlDecode($_GET["cf" . $this->Index]);
        else if(isset($_GET["ptcf" . $this->Index]) && Encoding::Base64UrlDecode($_GET["ptcf" . $this->Index]) != "")
            $rValue = urldecode($_GET["ptcf" . $this->Index]);

        if($_capitalize)
            $rValue = Str::ToEnglishStyle($rValue);
        if($rValue!=$_default && !empty($rValue))
            $_changed = true;

        return $rValue;
    }

    function GetAPIInput($_apiResponse)
    {
        $value = "";

        // object type
        if(isset($_apiResponse->Data->{$this->Index}) && !empty($_apiResponse->Data->{$this->Index}))
            $value = $_apiResponse->Data->{$this->Index};
        // array type
        else if(is_array($_apiResponse->Data) && isset($_apiResponse->Data[$this->Index]) && !empty($_apiResponse->Data[$this->Index]))
            $value = $_apiResponse->Data[$this->Index];

        if(!empty($value))
        {
            $value = $this->GetClientIndex($value);
            return $value;
        }
        return false;
    }

    function IsServerInput()
    {
        $params = array(isset($_POST[$this->PostIndexName()]),isset($_GET[$this->GetIndexName()]),isset($_GET["f" . $this->Index]),isset($_POST["p_cf" .  $this->Index]),isset($_POST["p_f" .  $this->Index]),isset($_GET["cf" . $this->Index]));
        foreach($params as $param)
            if($param)
                return true;
        return false;
    }

	function GetClientValue($_userInput)
	{
        // index -> value
		if($this->Type == "ComboBox" && !empty($this->InputValue) && is_numeric($_userInput))
		{
			$parts = explode(";",$this->InputValue);
            if(isset($parts[$_userInput]))
			    return $parts[$_userInput];
		}
		return $_userInput;
	}

    function GetClientIndex($_userInput)
    {
        // value -> index
        if($this->Type == "ComboBox" && !empty($this->InputValue) && !is_numeric($_userInput))
        {
            $parts = explode(";",$this->InputValue);
            foreach($parts as $index => $part)
                if($part == $_userInput)
                    return $index;
            return 0;
        }
        return $_userInput;
    }
	
	function GetJavascript($_value)
	{
		return "new lz_chat_input(".$this->Index.",".To::BoolString($this->Active).",'".base64_encode($this->Caption)."','".base64_encode($this->InfoText)."','".base64_encode($this->Name)."','".$this->Type."','".base64_encode($this->GetPreselectionValue($_value))."',".To::BoolString($this->Validate).",'".base64_encode($this->ValidationURL)."',".$this->ValidationTimeout.",".To::BoolString($this->ValidationContinueOnTimeout).",".To::BoolString($this->ScreenCapture).")";
	}
	
	function GetIndexName()
	{
		$getIndex = array(111=>"en",112=>"ee",113=>"ec",114=>"eq",115=>"vc",116=>"ep");
		if(isset($getIndex[$this->Index]))
			return $getIndex[$this->Index];
        return null;
	}

    function GetExternalIndexName()
    {
        $getIndex = array(111=>"ptn",112=>"pte",113=>"ptc",114=>"ptq",116=>"ptp",0=>"ptcf0",1=>"ptcf1",2=>"ptcf2",3=>"ptcf3",4=>"ptcf4",5=>"ptcf5",6=>"ptcf6",7=>"ptcf7",8=>"ptcf8",9=>"ptcf9");
        if(isset($getIndex[$this->Index]))
            return $getIndex[$this->Index];
        return null;
    }

    function GetIndexEncoding($_key)
    {
        $getIndex = array("en","ee","ec","eq","ep","code");
        if(in_array($_key,$getIndex))
            return "b64u";
        return "urle";
    }

    function PostIndexName()
    {
        $postIndex = array(111=>POST_EXTERN_USER_NAME,112=>POST_EXTERN_USER_EMAIL,113=>POST_EXTERN_USER_COMPANY,114=>"p_question",115=>"p_vc",116=>"p_phone");
        if(isset($postIndex[$this->Index]))
            return $postIndex[$this->Index];
        else
            return null;
    }

    function GetHeight()
    {
        return ($this->Type == "TextArea") ? 120 : (($this->Type == "File") ? 70 : 34);
    }
	
	function GetPreselectionValue($_value)
	{
		if($this->Type == "CheckBox" || $this->Type == "ComboBox")
		{
			return (!empty($_value)) ? $_value : "0";
		}
		else
		{
			if(empty($_value) && !empty($this->InputValue))
				return $this->InputValue;
			return $_value;
		}
	}
	
    static function ToIndexBased($_nameBased)
    {
        $indexBased = array();
        foreach(Server::$Inputs as $index => $input)
            if(isset($_nameBased[$input->Name]))
                $indexBased[$index] = $_nameBased[$input->Name];
        return $indexBased;
    }

    static function GetMaxHeight()
    {
        $max = 0;
        foreach(Server::$Inputs as $input)
            if($input->Active)
                $max += $input->GetHeight();
        return $max+400;
    }

    static function Build($count=0)
    {
        if(!empty(Server::$Configuration->File["gl_input_list"]))
        {
            foreach(Server::$Configuration->File["gl_input_list"] as $values)
            {
                $input = new DataInput($values);
                if($input->Index == 111 && true)
                    $input->AutoCapitalize = true;

                $sorter[($input->Position+10)."-".$count++] = $input;
            }
            $sorter[($input->Position+10)."-".$count++] = new DataInput(null); //+ DNC
            ksort($sorter);
            foreach($sorter as $input)
                Server::$Inputs[$input->Index] = $input;
        }
    }

    static function GetChatLoginInputs($_html,$_maxlength,$_overlay=false,$inputshtml="")
    {
        Server::InitDataBlock(array("INPUTS"));
        foreach(Server::$Inputs as $index => $dinput)
        {
            $inputshtml .= $dinput->GetHTML($_maxlength,($index == 115 || ($index == 116 && !empty($_GET["cmb"]))) ? true : $dinput->Active,$_overlay);
        }

        if($_overlay)
        {
            if(!empty($_GET["grot"]))
                $_html = str_replace("<!--chat_login_group_top-->",IOStruct::GetFile(TEMPLATE_SCRIPT_OVERLAY_CHAT . "login_group.tpl"),$_html);
            else
                $_html = str_replace("<!--chat_login_group_bottom-->",IOStruct::GetFile(TEMPLATE_SCRIPT_OVERLAY_CHAT . "login_group.tpl"),$_html);
        }
        else
        {
            if(!empty($_GET["grot"]))
                $inputshtml = IOStruct::GetFile(PATH_TEMPLATES . "login_group.tpl") . $inputshtml;
            else
                $inputshtml = $inputshtml . IOStruct::GetFile(PATH_TEMPLATES . "login_group.tpl");
        }

        return str_replace("<!--chat_login_inputs-->",$inputshtml,$_html);
    }
}

class CacheManager
{
    public $BaseId = null;
    public $BaseMemId = null;
    public $Data = array();
    public $Encryption = false;
    public $Compression = true;
    public $TTL = 4;
    public $PerformWrite = false;
    public $Fields;
    public $Provider;
    public static $Engine;
    public static $DataUpdateTimesMemory;
    public static $DataUpdateTimes;
    public static $ActiveManager;
    public static $DataTableResolved = array();

    function __construct($_baseId,$_TTL,$_fields,$_configEncryption=true)
    {
        $this->Fields = $_fields;
        $this->TTL = $_TTL;
        $this->BaseId = $_baseId;
        $this->BaseMemId = substr(base_convert($_baseId,16,10),0,4);

        //if(function_exists("mcrypt_encrypt") && defined("MCRYPT_RIJNDAEL_256") && defined("MCRYPT_MODE_ECB"))
          //  $this->Encryption = $_configEncryption;

        if(CacheManager::$Engine=="MEMCACHED")
        {
            $this->Provider = new Memcached();
            $this->Provider->addServer('127.0.0.1', 11211);
        }
        else if(CacheManager::$Engine=="MEMCACHE")
        {
            $this->Provider = new Memcache();
            $this->Provider->connect('127.0.0.1', 11211);
        }

        $this->Encryption = false;

    }

    function UnsetData($_key)
    {
        unset($this->Data[$_key]);
        if(CacheManager::$Engine=="PSHM")
        {
            $shmid = @shmop_open($this->BaseMemId . $_key, "w", 0666, 0);
            if($shmid)
            {
                @shmop_delete($shmid);
                @shmop_close($shmid);
            }
        }
        else if(CacheManager::$Engine=="MEMCACHED" || CacheManager::$Engine=="MEMCACHE")
        {
            $this->Provider->flush();
        }
        else if(CacheManager::$Engine=="APC")
        {
            apc_delete($this->BaseMemId . $_key);
        }
        else if(CacheManager::$Engine=="MYSQL")
        {
            DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_DATA_CACHE . "` WHERE `key`='" . DBManager::RealEscape($_key) . "';");
        }
    }

    function SetData($_key,$_value,$_allowEmpty=false)
    {
        if($_value!=null || $_allowEmpty)
        {
            $this->Data[$_key] = array();
            $this->Data[$_key][0] = time();
            $this->Data[$_key][1] = @serialize($_value);
            $this->Data[$_key][2] = true;
            $this->Data[$_key][3] = Server::GetIdentification();
        }
    }

    function GetData($_key,&$_storage,$_mustBeNull=true)
    {
        if((empty($_storage)||!$_mustBeNull) && isset($this->Data[$_key]) && is_array($this->Data[$_key]) && count($this->Data[$_key])==4)
        {
            $_storage = @unserialize($this->Data[$_key][1]);
            return true;
        }
        return false;
    }

    function Close()
    {
        $this->Write();
    }

    function Write()
    {
        if(Is::Defined("IS_FILTERED"))
            return;

        foreach($this->Data as $key => $value)
        {
            if($value[2])
            {
                $data = @serialize($value);

                /*
                if($this->Encryption)
                {
                    $data = mcrypt_encrypt(MCRYPT_RIJNDAEL_256, $this->BaseId, $data, MCRYPT_MODE_ECB, mcrypt_create_iv(mcrypt_get_iv_size(MCRYPT_RIJNDAEL_256, MCRYPT_MODE_ECB), MCRYPT_RAND));
                    $data = base64_encode($data);
                    $data = strlen($data)."_".$data;
                }
                */

                if($this->Compression && function_exists("gzcompress"))
                    $data = base64_encode(gzcompress($data,5));

                if(CacheManager::$Engine=="MEMCACHED" || CacheManager::$Engine=="MEMCACHE")
                {
                    $this->Provider->delete($this->BaseMemId . $key);
                    $this->Provider->set($this->BaseMemId . $key, $data);
                }
                else if(CacheManager::$Engine=="PSHM")
                {
                    if(function_exists("mb_strlen"))
                        $flength = mb_strlen($data, 'UTF-8');
                    else
                        $flength = strlen($data);
                    $shmid = @shmop_open($this->BaseMemId . $key, "w", 0666, 0);
                    if($shmid)
                    {
                        @shmop_delete($shmid);
                        @shmop_close($shmid);
                    }
                    $Shmid = @shmop_open($this->BaseMemId . $key, "c", 0666, $flength);
                    @shmop_write($Shmid, $data, 0);
                    @shmop_close($Shmid);
                }
                else if(CacheManager::$Engine=="APC")
                {
                    apc_delete($this->BaseMemId . $key);
                    apc_store($this->BaseMemId . $key, $data);
                }
                else if(CacheManager::$Engine=="MYSQL")
                {
                    DBManager::Execute(true, "REPLACE INTO `" . DB_PREFIX . DATABASE_DATA_CACHE . "` (`key`, `data`, `time`) VALUES ('" . DBManager::RealEscape($key) . "','" . DBManager::RealEscape($data) . "'," . time() . ");");
                }
            }
        }
    }

    function Read()
    {
        $loadedKeys = array();
        foreach($this->Fields as $key => $name)
        {
            $data="";
            if(CacheManager::$Engine=="PSHM")
            {
                $Shmid = @shmop_open($this->BaseMemId . $key, "a", 0666, 0);
                if($Shmid)
                {
                    $shm_size = @shmop_size($Shmid);
                    $data = @shmop_read($Shmid, 0, $shm_size);
                }
                @shmop_close($Shmid);
            }
            else if(CacheManager::$Engine=="APC")
            {
                $data = apc_fetch($this->BaseMemId . $key);
            }
            else if(CacheManager::$Engine=="MEMCACHED" || CacheManager::$Engine=="MEMCACHE")
            {
                $data = $this->Provider->get($this->BaseMemId . $key);
            }
            else if(CacheManager::$Engine=="MYSQL")
            {
                if(empty($loadedKeys) && $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_DATA_CACHE . "`;"))
                    while($row = DBManager::FetchArray($result))
                        $loadedKeys[$row["key"]] = $row["data"];
                if(isset($loadedKeys[$key]))
                    $data = $loadedKeys[$key];
            }
            if(!empty($data))
            {
                if($this->Compression && function_exists("gzuncompress"))
                    $data = @gzuncompress(base64_decode($data));

                /*
                if($this->Encryption)
                {
                    $upos = strpos($data,"_");
                    if($upos !== false)
                    {
                        $data = base64_decode(substr($data,$upos+1,strlen($data)-($upos+1)));
                        $data = mcrypt_decrypt(MCRYPT_RIJNDAEL_256, $this->BaseId, $data, MCRYPT_MODE_ECB, mcrypt_create_iv(mcrypt_get_iv_size(MCRYPT_RIJNDAEL_256, MCRYPT_MODE_ECB), MCRYPT_RAND));
                    }
                    else
                        continue;
                }
                */

                $arra = @unserialize($data);
                if(!empty($arra) && is_array($arra))
                {
                    if((!isset($this->Fields[$key][2]) && $arra[0] > (time()-$this->TTL)) || (isset($this->Fields[$key][2]) && ($arra[0] > (time()-$this->Fields[$key][2]))))
                    {
                        $this->Data[$key] = $arra;
                        $this->Data[$key][2] = false;
                    }
                }
            }
        }
    }

    static function GetDataTableIdFromValue($_database,$_column_s,$_value_s,$_canBeNumeric=true,$_maxlength=null)
    {
        if(!is_array($_value_s))
        {
            if(!$_canBeNumeric && is_numeric($_value_s))
                return $_value_s;

            if(!is_array($_value_s) && $_maxlength != null && strlen($_value_s) > $_maxlength)
                $_value_s = substr($_value_s,0,$_maxlength);

            $_value_s = array(0=>$_value_s);
        }

        if(!is_array($_column_s))
        {
            $_column_s = array(0=>$_column_s);
        }

        $ckey = "IFV".md5($_database.serialize($_column_s).serialize($_value_s));

        if(isset(CacheManager::$DataTableResolved[$ckey]))
        {
            return CacheManager::$DataTableResolved[$ckey];
        }

        $columns = $values = $onupdatefields = "";
        for($i=0;$i<count($_column_s);$i++)
        {
            $columns .= ",`".$_column_s[$i]."`";
            $values .= ", '".DBManager::RealEscape($_value_s[$i])."'";

            if($i > 0)
                $onupdatefields .= ",`".$_column_s[$i]."`='".DBManager::RealEscape($_value_s[$i])."'";
        }

        DBManager::Execute(true, "INSERT IGNORE INTO `" . DB_PREFIX . $_database . "` (`id`" . $columns . ") VALUES (NULL" . $values . ") ON DUPLICATE KEY UPDATE `id`=LAST_INSERT_ID(`id`)" . $onupdatefields . ";");
        $resid = DBManager::GetLastInsertedId();
        if(is_numeric($resid) || $_value_s == "INVALID_DATA")
        {
            return CacheManager::$DataTableResolved[$ckey] = $resid;
        }
        else
            return CacheManager::GetDataTableIdFromValue($_database,$_column_s,"INVALID_DATA",$_canBeNumeric,$_maxlength);
    }

    static function GetDataTableValueFromId($_database,$_column,$_id,$_unknown=false,$_returnIdOnFailure=false)
    {
        if(isset(CacheManager::$DataTableResolved["VFI".md5($_database.$_column.$_id)]))
            return CacheManager::$DataTableResolved["VFI".md5($_database.$_column.$_id)];

        $row = DBManager::FetchArray(DBManager::Execute(true, "SELECT `" . $_column . "` FROM `" . DB_PREFIX . $_database . "` WHERE `id`='" . DBManager::RealEscape($_id) . "' LIMIT 1;"));
        if($_unknown && empty($row[$_column]))
            $value = "<!--lang_stats_unknown-->";
        else if($_returnIdOnFailure && empty($row[$_column]))
            $value = $_id;
        else
            $value = $row[$_column];

        return CacheManager::$DataTableResolved["VFI".md5($_database.$_column.$_id)] = $value;
    }

    static function GetValueBySystemId($_systemid,$_value,$_default)
    {
        $value = $_default;
        $parts = explode("~",$_systemid);

        $result = DBManager::Execute(true, "SELECT `" . DBManager::RealEscape($_value) . "` FROM `" . DB_PREFIX . DATABASE_VISITOR_CHATS . "` WHERE `visitor_id`='" . DBManager::RealEscape($parts[0]) . "' AND `browser_id`='" . DBManager::RealEscape($parts[1]) . "' ORDER BY `last_active` DESC LIMIT 1;");
        if($result)
        {
            $row = DBManager::FetchArray($result);
            $value = $row[$_value];
        }
        return $value;
    }

    static function GetObjectId($_field,$_database)
    {
        $result = DBManager::Execute(true, "SELECT `" . $_field . "`,(SELECT MAX(`id`) FROM `" . DB_PREFIX . $_database . "`) as `used_" . $_field . "` FROM `" . DB_PREFIX . DATABASE_INFO . "`");
        $row = DBManager::FetchArray($result);
        $max = max($row[$_field],$row["used_" . $_field]);
        $tid = $max+1;
        DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_INFO . "` SET `" . $_field . "`='" . DBManager::RealEscape($tid) . "';");
        return $tid;
    }

    static function FlushKey($_key)
    {
        if(!empty(CacheManager::$ActiveManager))
            CacheManager::$ActiveManager->UnsetData($_key);
    }

    static function CachingAvailable($_config)
    {
        if(!empty($_config))
        {
            $avail = array("APC"=>false,"PSHM"=>false,"MEMCACHED"=>false,"MEMCACHE"=>false);
            if(function_exists("apc_store") && !(Is::Defined("PHP_SAPI") && strpos(strtoupper(PHP_SAPI),"CGI")!==false && strpos(strtoupper(PHP_SAPI),"FAST")===false))
                $avail["APC"]=true;
            if(function_exists("shmop_open") && !(Is::Defined("PHP_OS") && strtoupper(substr(PHP_OS, 0, 3)) === "WIN"))
                $avail["PSHM"]=true;
            if(class_exists("Memcached"))
                $avail["MEMCACHED"]=true;
            if(class_exists("Memcache"))
                $avail["MEMCACHE"]=true;

            if($_config==2 && $avail["PSHM"])
                return CacheManager::$Engine = "PSHM";
            else if($_config==1)
                return CacheManager::$Engine = "MYSQL";
            else if($_config==4 && $avail["MEMCACHED"])
                return CacheManager::$Engine = "MEMCACHED";
            else if($_config==3 && $avail["MEMCACHE"])
                return CacheManager::$Engine = "MEMCACHE";
            else if($_config==5 && $avail["APC"])
                return CacheManager::$Engine = "APC";
        }
        return false;
    }

    static function Flush()
    {
        if(CacheManager::$Engine=="APC" && function_exists("apc_clear_cache"))
        {
            @apc_clear_cache();
            @apc_clear_cache('user');
            @apc_clear_cache('opcode');
        }

        if(DBManager::$Connected)
        {
            DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_DATA_CACHE . "`;");
        }
    }

    static function SetDataUpdateTime($_areaIndex,$_micro=true)
    {
        CacheManager::WriteDataUpdateTime($_areaIndex,false,DBManager::$Connector,DB_PREFIX,($_micro) ? (round(microtime(true) * 100)."0") : time());
    }

    static function WriteDataUpdateTime($_areaIndex,$_reload=false,$_connector=null,$_prefix="",$_mtime=0)
    {
        if(!(isset(CacheManager::$DataUpdateTimesMemory[$_areaIndex]) && CacheManager::$DataUpdateTimesMemory[$_areaIndex]==$_mtime))
        {
            CacheManager::$DataUpdateTimes[$_areaIndex]=
            CacheManager::$DataUpdateTimesMemory[$_areaIndex]=$_mtime;

            $result = $_connector->Query(true,"SELECT * FROM `".$_prefix.DATABASE_DATA_UPDATES."`;");
            if(DBManager::GetRowCount($result) == 0 && !$_reload)
            {
                $_connector->Query(true,"TRUNCATE `".$_prefix.DATABASE_DATA_UPDATES."`;");
                $_connector->Query(true,"INSERT IGNORE INTO `".$_prefix.DATABASE_DATA_UPDATES."` (`update_tickets`, `update_archive`, `update_feedbacks`, `update_emails`, `update_events`, `update_vouchers`, `update_filters`, `update_reports`) VALUES ('0', '0', '0', '0', '0', '0', '0', '0');");
                CacheManager::WriteDataUpdateTime($_areaIndex,true,$_connector,$_prefix,$_mtime);
            }
            else
            {
                $_connector->Query(true,"UPDATE `".$_prefix.DATABASE_DATA_UPDATES."` SET `".DBManager::RealEscape($_areaIndex)."`=".$_mtime.";");
                CacheManager::FlushKey(DATA_CACHE_KEY_DATA_TIMES);
            }
        }
    }

    static function GetDataUpdateTimes()
    {
        if(!empty(CacheManager::$ActiveManager) && CacheManager::$ActiveManager->GetData(DATA_CACHE_KEY_DATA_TIMES,CacheManager::$DataUpdateTimes))
            return;

        CacheManager::$DataUpdateTimes = array(DATA_UPDATE_KEY_TICKETS=>0,DATA_UPDATE_KEY_EMAILS=>0,DATA_UPDATE_KEY_EVENTS=>0,DATA_UPDATE_KEY_CHAT_ARCH=>0,DATA_UPDATE_KEY_REPORTS=>0,DATA_UPDATE_KEY_FEEDBACKS=>0,DATA_UPDATE_KEY_FILTERS=>0);
        if(DBManager::$Connected)
        {
            $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_DATA_UPDATES . "`;");
            if($result && $row = DBManager::FetchArray($result))
                CacheManager::$DataUpdateTimes = array(DATA_UPDATE_KEY_TICKETS=>$row[DATA_UPDATE_KEY_TICKETS],DATA_UPDATE_KEY_EMAILS=>$row[DATA_UPDATE_KEY_EMAILS],DATA_UPDATE_KEY_EVENTS=>$row[DATA_UPDATE_KEY_EVENTS],DATA_UPDATE_KEY_CHAT_ARCH=>$row[DATA_UPDATE_KEY_CHAT_ARCH],DATA_UPDATE_KEY_REPORTS=>$row[DATA_UPDATE_KEY_REPORTS],DATA_UPDATE_KEY_FEEDBACKS=>(isset($row[DATA_UPDATE_KEY_FEEDBACKS])) ? $row[DATA_UPDATE_KEY_FEEDBACKS] : 0,DATA_UPDATE_KEY_FILTERS=>$row[DATA_UPDATE_KEY_FILTERS]);
        }
        if(!empty(CacheManager::$ActiveManager))
            CacheManager::$ActiveManager->SetData(DATA_CACHE_KEY_DATA_TIMES,CacheManager::$DataUpdateTimes);
    }

    static function IsDataUpdate($_postkey,$_dbkey,$_minLast=0)
    {
        if(CacheManager::$DataUpdateTimes[$_dbkey]==0)
            return false;

        if(!empty($_POST[$_postkey]) && !empty($_minLast) && floor($_POST[$_postkey]/1000) > time()-$_minLast)
            return false;

        return !(!empty($_POST[$_postkey]) && $_POST[$_postkey]>=CacheManager::$DataUpdateTimes[$_dbkey]);
    }
}

class DBManager
{
    public static $Extension = "mysqli";
    public static $Connected = false;
    public static $Prefix;
    public static $Provider;
    public static $Connector;
    public static $QueryCount = 0;
    public static $Queries = "";

    public $Username;
    public $Password;
    public $Database;
    public $Host;

    function __construct($_username,$_password,$_host,$_database,$_prefix="")
    {
        $this->Username = $_username;
        $this->Password = $_password;
        $this->Host = $_host;
        $this->Database = $_database;
        DBManager::$Prefix = $_prefix;
    }

    function InitConnection()
    {
        DBManager::$Provider = mysqli_connect($this->Host, $this->Username, $this->Password);

        if(DBManager::$Provider)
        {
            $this->SetEncoding();
            $this->SetMode();

            if(!empty($this->Database))
            {
                if($this->SelectDatabase(DBManager::RealEscape($this->Database)))
                    DBManager::$Connected = true;
            }
        }
        else
            DBManager::LogError("connect");

        return DBManager::$Connected;
    }

    function Query($_log,$_sql,&$_errorCode=-1,$result=null)
    {
        $result = @mysqli_query(DBManager::$Provider , $_sql);

        $ignore = array("1146","1045","2003","1213","");
        $_errorCode = DBManager::GetErrorCode();
        if(!$result && !in_array($_errorCode,$ignore))
        {
            if($_log)
                DBManager::LogError($_sql);
        }
        return $result;
    }

    function SelectDatabase($_dbName)
    {
        return @mysqli_select_db(DBManager::$Provider, $_dbName);
        return null;
    }

    function SetEncoding()
    {
        $this->Query(false, "SET character_set_results = 'utf8mb4', character_set_client = 'utf8mb4', character_set_connection = 'utf8mb4', character_set_database = 'utf8mb4', character_set_server = 'utf8mb4'");
        mysqli_set_charset(DBManager::$Provider,"utf8mb4");
    }

    function SetMode()
    {
        $this->Query(false,"SET SESSION sql_mode = 'TRADITIONAL'");
    }

    static function LogError($_sql)
    {
        Logging::DatabaseLog(DBManager::GetErrorCode() . ": " . DBManager::GetError() . "\r\n\r\nSQL: " . $_sql . "\r\n");
    }

    static function Close()
    {
        if(DEBUG_MODE)
            Server::SaveDBStats();
        @mysqli_close(DBManager::$Provider);
    }

    static function RealEscape($_toEscape,$_filterWildCard=false)
    {
        if($_filterWildCard)
            $_toEscape = str_replace("%","",$_toEscape);

        if(DBManager::$Provider)
            return @mysqli_real_escape_string(DBManager::$Provider,$_toEscape);

        return $_toEscape;
    }

    static function FetchArray($_result,$_type=null)
    {
        if($_type == null)
            $_type = MYSQLI_BOTH;
        else if($_type == "ASSOC")
            $_type = MYSQLI_ASSOC;

        return @mysqli_fetch_array($_result, $_type);
    }

    static function GetRowCount($_result)
    {
        @mysqli_store_result(DBManager::$Provider);
        return @mysqli_num_rows($_result);
    }

    static function GetAffectedRowCount()
    {
        return mysqli_affected_rows(DBManager::$Provider);
    }

    static function GetErrorCode()
    {
        if(DBManager::$Provider)
            return mysqli_errno(DBManager::$Provider);
        else
            return mysqli_connect_errno();
    }

    static function GetError()
    {
        if(DBManager::$Provider)
            return mysqli_error(DBManager::$Provider);
        else
            return mysqli_connect_error();
    }

    static function GetLastInsertedId()
    {
        if(DBManager::$Provider)
        {
            return mysqli_insert_id(DBManager::$Provider);
        }
        return "";
    }

    static function Execute($_log, $_sql, &$_errorCode = -1)
    {
        if(!DBManager::$Connected)
        {
            Logging::DatabaseLog("Query without connection: " . $_sql . " " . serialize(debug_backtrace()));
            return false;
        }

        $result = DBManager::$Connector->Query($_log,$_sql,$_errorCode);
        return $result;
    }

    static function GetStatement($_sql)
    {
        if(!DBManager::$Connected)
        {
            Logging::DatabaseLog("Prepare without connection: " . $_sql . " " . serialize(debug_backtrace()));
            return false;
        }
        $stmt = DBManager::$Provider->prepare($_sql);
        return $stmt;
    }

    static function ExecutePrepared($_stmt)
    {
        $_stmt->execute();
        return $_stmt;
    }

    static function ConditionAdd($_condition,$_toAdd)
    {
        if(empty($_condition))
            $_condition = $_toAdd;
        else
            $_condition = "(" . $_condition . ") AND " . $_toAdd;
        return $_condition;

    }

    static function EncodeField($_data)
    {
        return "BASE64;" . base64_encode($_data);
    }

    static function DecodeField($_data)
    {
        if(strpos($_data,"BASE64;") === 0)
            return base64_decode(str_replace("BASE64;","",$_data));
        return $_data;
    }

}

class SocialMediaChannel
{
    public $GroupId;
    public $Deleted;
    public $LastConnect = 0;
    public $DataSince = "";
    public $ConnectFrequency = 0;
    public $Id;
    public $Type;
    public $PageId;
    public $TokenId;
    public $TokenExpires;
    public $Name;
    public $StreamType;
    public $Track;

    function __construct($_groupId)
    {
        $this->GroupId = $_groupId;
    }

    function SetValues($_row)
    {
        $this->LastConnect = $_row["last_connect"];
        $this->DataSince = $_row["data_since"];
        $this->ConnectFrequency = $_row["connect_frequency"];
        $this->GroupId = $_row["group_id"];
        $this->Id = $_row["id"];
        $this->PageId = $_row["page_id"];
        $this->TokenId = $_row["token"];
        $this->Name = $_row["name"];
        $this->StreamType = $_row["stream_type"];
        $this->Track = $_row["track"];
    }

    function Connect($_data, $_action)
    {
        if(function_exists("gzuncompress"))
            $_data["p_zip"] = "1";

        $_data["p_tz"] = SystemTime::GetSystemTimezone();

        $response = Server::CallURL(CONFIG_LIVEZILLA_SOCIAL . strtolower(SocialMediaChannel::GetChannelTypeName($this->Type)) . "/?a=" . $_action,$_data);

        if(!empty($response))
        {
            if(!empty($_data["p_zip"]))
            {
                $result = @gzuncompress(base64_decode($response));



                if($result === false && !empty($response))
                {
                    handleError("122", "Error connecting social channel: " . $this->Name . " (" . $response . ")","",0);
                    return "";
                }
            }
            else
                $result = $response;
        }
        else
            return "";

        if(!empty($result) && is_string(json_decode($result)) && strpos(json_decode($result),"ERR")===0)
            handleError("123", "Error connecting social channel: " . $this->Name . " (" . json_decode($result) . ")","",0);
        else
            return $result;

        return "";
    }

    function Download($_data=null)
    {
        return $this->Connect($_data,"cd");
    }

    function Reply($_data)
    {
        return $this->Connect($_data,"sr");
    }

    function SetLastConnect($_time)
    {
        /*
        $min = ($_time>0) ? $_time-10 : time()+1;
        DBManager::Execute(true, $g="UPDATE `" . DB_PREFIX . DATABASE_SOCIAL_MEDIA_CHANNELS . "` SET `last_connect`=" . intval($_time) . " WHERE `last_connect` < ". intval(abs($min)) ." AND `id`='" . DBManager::RealEscape($this->Id) . "'");
        return DBManager::GetAffectedRowCount();
        */
    }

    function GetXML()
    {
        return "<value i=\"".base64_encode($this->Id)."\" s=\"".base64_encode($this->StreamType)."\" n=\"".base64_encode($this->Name)."\" tr=\"".base64_encode($this->Track)."\" t=\"".base64_encode($this->Type)."\" d=\"".base64_encode($this->DataSince)."\" c=\"".base64_encode($this->ConnectFrequency)."\" p=\"".base64_encode($this->PageId)."\">".base64_encode($this->TokenId)."</value>\r\n";
    }

    function XMLParamAlloc($_param,$_value)
    {
        if($_param == "a")
            $this->PageId = $_value;
        else if($_param == "b")
            $this->TokenId = $_value;
        else if($_param == "c")
            $this->TokenExpires = $_value;
        else if($_param == "d")
            $this->Name = $_value;
        else if($_param == "e")
            $this->ConnectFrequency = $_value;
        else if($_param == "f")
            $this->DataSince = $_value;
        else if($_param == "g")
            $this->Id = $_value;
        else if($_param == "h")
            $this->StreamType = $_value;
        else if($_param == "i")
            $this->Type = $_value;
        else if($_param == "j")
            $this->Track = base64_decode($_value);
    }

    function Save($_prefix)
    {
        //DBManager::Execute(true, "INSERT INTO `" . $_prefix . DATABASE_SOCIAL_MEDIA_CHANNELS . "` (`id` ,`name`, `page_id`,`group_id` ,`type` ,`stream_type` ,`token`,`token_expire`,`last_connect`,`data_since`,`connect_frequency`,`track`) VALUES ('" . DBManager::RealEscape($this->Id) . "','" . DBManager::RealEscape($this->Name) . "','" . DBManager::RealEscape($this->PageId) . "', '" . DBManager::RealEscape($this->GroupId) . "'," . intval($this->Type) . "," . intval($this->StreamType) . ", '" . DBManager::RealEscape($this->TokenId) . "', '" . DBManager::RealEscape($this->TokenExpires) . "', " . intval($this->LastConnect) . ",'" . DBManager::RealEscape($this->DataSince) . "'," . intval($this->ConnectFrequency) . ",'" . DBManager::RealEscape($this->Track) . "');");
    }

    function IsSince()
    {
        return !($this->Type == 6 && $this->StreamType == 1);
    }

    static function DeleteByGroup($_prefix,$_groupId)
    {
        //DBManager::Execute(true, "DELETE FROM `" . $_prefix . DATABASE_SOCIAL_MEDIA_CHANNELS . "` WHERE `group_id`='" . DBManager::RealEscape($_groupId) . "';");
    }

    static function GetChannelById($_id)
    {
        Server::InitDataBlock(array("DBCONFIG"));
        foreach(Server::$Configuration->Database["gl_sm"] as $channel)
            if($channel->Id == $_id)
                return $channel;
        return null;
    }

    static function GetChannelTypeName($_typeId)
    {
        $types = array("6"=>"Facebook","7"=>"Twitter");
        return $types[$_typeId];
    }

    static function ResetDownloadTime(){
        foreach(Server::$Configuration->Database["gl_sm"] as $sm)
            $sm->SetLastConnect(0);
    }
}

class FacebookChannel extends SocialMediaChannel
{
    function __construct($_groupId)
    {
        $this->Type = 6;
        $this->GroupId = $_groupId;
    }

    function Download($_data=null)
    {
        $data["p_llt"] = $this->TokenId;
        $data["p_pid"] = $this->PageId;
        $data["p_dut"] = $this->DataSince;
        $data["p_st"] = $this->StreamType;
        $result = parent::Download($data);
        $messages = array();
        if(!empty($result) && $result=json_decode($result,true))
        {
            if(is_array($result))
            {
                foreach($result as $hash => $msgdata)
                    $messages[$hash] = @unserialize(base64_decode($msgdata));
            }
        }
        return $messages;
    }

    function SetLastUpdate($_time)
    {
        /*
        if($this->StreamType == 1)
            $_time = max($this->DataSince,(time()-(7*86400)));
        if($_time > $this->DataSince)
            DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_SOCIAL_MEDIA_CHANNELS . "` SET `data_since`='" . DBManager::RealEscape($_time) . "' WHERE `id`='" . DBManager::RealEscape($this->Id) . "' LIMIT 1;");
        */
    }

    function SendReply($_ticket,$_message,$_text,$_quote)
    {
        $data["p_llt"] = $this->TokenId;
        $data["p_pid"] = $this->PageId;
        $data["p_text"] = $_text;
        $data["p_ci"] = $_ticket->ChannelConversationId;
        $data["p_st"] = $this->StreamType;
        $data["p_cci"] = $_quote->ChannelId;
        $channelId = json_decode(parent::Reply($data));
        $_message->SetChannelId($channelId);
    }
}

class TwitterChannel extends SocialMediaChannel
{
    function __construct($_groupId)
    {
        $this->Type = 7;
        $this->GroupId = $_groupId;
    }

    function Download($_data=null)
    {
        $data["p_llt"] = $this->TokenId;
        $data["p_pid"] = $this->PageId;
        $data["p_dut"] = $this->DataSince;
        $data["p_st"] = $this->StreamType;
        $data["p_tr"] = $this->Track;
        $result = parent::Download($data);
        $messages = array();
        if(!empty($result) && $result=json_decode($result,true))
        {
            if(is_array($result))
            {
                foreach($result as $hash => $msgdata)
                    $messages[$hash] = @unserialize(base64_decode($msgdata));
            }
        }
        return $messages;
    }

    function SendReply($_ticket,$_message,$_text,$_quote)
    {
        $data["p_llt"] = $this->TokenId;
        $data["p_pid"] = $this->PageId;
        $data["p_text"] = $_text;
        $data["p_cci"] = $_quote->ChannelId;
        $data["p_st"] = $this->StreamType;
        $data["p_rid"] = $_quote->Email;
        $channelId = json_decode(parent::Reply($data));
        $_message->SetChannelId($channelId);
    }

    function SetLastUpdate($_sinceId)
    {
        //DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_SOCIAL_MEDIA_CHANNELS . "` SET `data_since`='" . DBManager::RealEscape($_sinceId) . "' WHERE `id`='" . DBManager::RealEscape($this->Id) . "' LIMIT 1;");
    }

    function AddScreenName($_text,$_screenName)
    {
        if(strpos(strtolower($_text),strtolower($_screenName . " ")) !== 0)
            return $_screenName . " " . $_text;
        return $_text;
    }
}

class KnowledgeBase
{
    public $Entries;

    function __construct()
    {
        $this->Entries = KnowledgeBase::GetEntries();
    }

    static function ReadTextColor()
    {
        $default = "#2e8ae5";

        if(isset(Server::$Configuration->File["gl_kbdc"]))
            $default = Server::$Configuration->File["gl_kbdc"];

        return Communication::ReadParameter("etc",$default);
    }

    static function GetMatches($root,$_question,$_language="",$_botOnly=false,$_includeFolders=false)
    {
        $dblist = $rlist = $list = array();
        $criteria = (($_botOnly) ? "`kb_bot`=1" : "`kb_public`=1");

        if(!$_includeFolders)
            $criteria = "`type` > 0 AND " . $criteria;

        if($result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_RESOURCES . "` WHERE `discarded`=0 AND " . $criteria . ";"))
        {
            while($row = DBManager::FetchArray($result))
            {
                $entry = new KnowledgeBaseEntry($row);
                if($entry->MatchesLanguage($_language))
                {
                    if($entry->IsChildOf($root))
                        $dblist[] = $entry;
                }
            }
        }

        foreach($dblist as $entry)
        {
            $entry->CalculateMatchrate($_question,$_language);
            if($entry->Matchrate > 0)
                $list[$entry->Id] = $entry;
        }

        if(count($list)>0)
        {
            $sorted = array();
            foreach($list as $id => $entry)
                $sorted[$id] = $entry->Matchrate;
            arsort($sorted);
            foreach($sorted as $id => $matchrate)
                $rlist[] = $list[$id];
        }

        if($_botOnly)
        {
            $caritems = array();
            foreach($rlist as $id => $item)
            {
                $caritems[] = new ChatAutoReply($id,$item);
                $caritems[count($caritems)-1]->Tags .= "," . str_replace(array(" ",";",".","?","!"),",",$item->Title);

                if(Server::$Configuration->File["gl_kbsb"] == 0/* || $this->FulltextSearch*/)
                    $caritems[count($caritems)-1]->Tags .= "," . str_replace(array(" ",";",".","?","!"),",",$item->Value);
            }
            return $caritems;
        }

        return $rlist;
    }

    static function GetEntriesByList($topList,$_language,$_root,$_blacklist=false)
    {
        if($result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_RESOURCES . "` WHERE `kb_public`=1 AND `type`!=0 AND `discarded`=0 ORDER BY `order_key` ASC,`title` ASC"))
        {
            while($row = DBManager::FetchArray($result))
            {
                $entry = new KnowledgeBaseEntry($row);
                if((!$_blacklist && isset($topList[$entry->Id])) || ($_blacklist && !isset($topList[$entry->Id])))
                {
                    if($entry->MatchesLanguage($_language))
                    {
                        //$entry->ValidateParents(1);
                        if($entry->IsChildOf($_root))
                        {
                            $topList[$entry->Id] = $entry;
                        }
                    }
                }
            }
        }
        return $topList;
    }

    static function GetTOPEntries($_root="",$_language="",$_onlyTops=true)
    {
        $topList = array();
        if($_onlyTops)
            if($result = DBManager::Execute(true, "SELECT `res_id`,SUM(`views`) as `count` FROM `" . DB_PREFIX . DATABASE_STATS_AGGS_KNOWLEDGEBASE . "` GROUP BY `res_id` ORDER BY `count` DESC"))
            {
                while($row = DBManager::FetchArray($result))
                {
                    $topList[$row["res_id"]] = 1;
                }
            }

        $rlist = array();
        $topList = KnowledgeBase::GetEntriesByList($topList,$_language,$_root);

        //if(count($topList) < 5)
          //  $topList = KnowledgeBase::GetEntriesByList($topList,$_language,$_root,true);

        $tcount = 0;
        foreach($topList as $rid => $ar)
            if($ar !== 1 && $tcount < 5)
            {
                $rlist[$rid] = $ar;
                $tcount++;
            }

        $tlist = array();
        if(count($rlist)>0)
        {
            $tlist[0] = new KnowledgeBaseEntry();
            $tlist[0]->Id = 1;
            $tlist[0]->ChildNodes = $rlist;
            $tlist[0]->Title = LocalizationManager::$TranslationStrings["client_most_popular"];
        }
        return $tlist;
    }

    static function GetEntries($_root="",$_language="",$_noPublicParent=true)
    {
        $rlist = array();
        if($result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_RESOURCES . "` WHERE `kb_public`=1 AND `type`=0 AND `discarded`=0 ORDER BY `order_key` ASC,`title` ASC"))
        {
            while($row = DBManager::FetchArray($result))
            {
                if($_noPublicParent)
                {
                    $parent = new KnowledgeBaseEntry();
                    $parent->Load($row["parentid"]);

                    if($parent->Type == 0 && $parent->IsPublic)
                        continue;
                }

                $entry = new KnowledgeBaseEntry($row);
                if($entry->MatchesLanguage($_language))
                {
                    if($entry->IsChildOf($_root))
                    {
                        $entry->LoadChildNodes($_root,true,$_language);
                        $rlist[$entry->Id] = $entry;
                    }
                }
            }
        }

        if(empty($_root))
        {
            $rlist[1] = new KnowledgeBaseEntry();
            $rlist[1]->Id = 1;
            $rlist[1]->LoadChildNodes($_root,true,$_language,true);
            $rlist[1]->Title = LocalizationManager::$TranslationStrings["client_tab_knowledgebase"];
        }
        return $rlist;
    }

    static function CreateEntry($_userId, $_resId, $_value, $_type, $_title, $_disc, $_parentId, $_size=0, $_tags = "", $_chatId = 0, $_editor="")
    {
        if($_size == 0)
            $_size = strlen($_title);

        if(empty($_editor))
            $_editor = $_userId;

        $result = DBManager::Execute(true, "SELECT `id`,`value` FROM `" . DB_PREFIX . DATABASE_RESOURCES . "` WHERE `id`='" . DBManager::RealEscape($_resId) . "'");
        if(DBManager::GetRowCount($result) == 0)
        {
            if(!$_disc || $_disc == 2)
            {
                if($_disc == 2)
                    self::RemoveFileUploads();

                DBManager::Execute(true, "INSERT INTO `" . DB_PREFIX . DATABASE_RESOURCES . "` (`id`,`owner`,`editor`,`value`,`edited`,`title`,`created`,`type`,`discarded`,`parentid`,`size`,`tags`,`chat_id`,`related`) VALUES ('" . DBManager::RealEscape($_resId) . "','" . DBManager::RealEscape($_userId) . "','" . DBManager::RealEscape($_editor) . "','" . DBManager::RealEscape($_value) . "','" . DBManager::RealEscape(time()) . "','" . DBManager::RealEscape(Str::Cut($_title,248,false)) . "','" . DBManager::RealEscape(time()) . "','" . DBManager::RealEscape($_type) . "'," . intval($_disc) . ",'" . DBManager::RealEscape($_parentId) . "','" . DBManager::RealEscape($_size) . "','" . DBManager::RealEscape($_tags) . "'," . intval($_chatId) . ",'')");
            }
        }
        else if($_type > 0)
        {
            $row = DBManager::FetchArray($result);
            DBManager::Execute(true, $result = "UPDATE `" . DB_PREFIX . DATABASE_RESOURCES . "` SET `value`='" . DBManager::RealEscape($_value) . "',`editor`='" . DBManager::RealEscape($_userId) . "',`tags`='" . DBManager::RealEscape($_tags) . "',`title`='" . DBManager::RealEscape(Str::Cut($_title,254,false)) . "',`edited`=" . intval(time()) . ",`discarded`='" . DBManager::RealEscape(To::BoolString($_disc, false)) . "',`parentid`='" . DBManager::RealEscape($_parentId) . "',`size`='" . DBManager::RealEscape($_size) . "' WHERE id='" . DBManager::RealEscape($_resId) . "' LIMIT 1");
            if(!empty($_disc) && ($_type == RESOURCE_TYPE_FILE_INTERNAL || $_type == RESOURCE_TYPE_FILE_EXTERNAL) && @file_exists("./uploads/" . $row["value"]) && strpos($row["value"],"..")===false)
                @unlink("./uploads/" . $row["value"]);
        }
    }

    static function RemoveFileUploads($_all=false)
    {
        if($_all)
        {
            // 1 = common deleted files, remove file, keep res entry for sync delay
            if($result = DBManager::Execute(true, "SELECT `value` FROM `" . DB_PREFIX . DATABASE_RESOURCES . "` WHERE `discarded`=1 AND `type`>2 AND `created` < ".(time()-60)))
            {
                while($result && $row = DBManager::FetchArray($result))
                    if(strpos($row["value"],"..") === false)
                    {
                        @unlink(PATH_UPLOADS . $row["value"]);
                    }
            }
        }

        // 2 = screen capture files, remove both instantly
        if($result = DBManager::Execute(true, $q="SELECT `value` FROM `" . DB_PREFIX . DATABASE_RESOURCES . "` WHERE `discarded`=2 AND `type`>2 AND `created` < ".(time()-30)))
        {
            while($result && $row = DBManager::FetchArray($result))
                if(strpos($row["value"],"..") === false)
                {

                    DBManager::Execute(true, $q="DELETE FROM `" . DB_PREFIX . DATABASE_ADMINISTRATION_LOG . "` WHERE `type`='IOStruct::CreateFile' AND `ip`='" . DBManager::RealEscape(Communication::GetIP(true)) . "' AND `time` < ".(time()-40));

                    @unlink(PATH_UPLOADS . $row["value"]);
                }

            DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_RESOURCES . "` WHERE `discarded`=2 AND `type`>2 AND `created` < ".(time()-40));
        }
    }

    static function CreateFolders($_owner,$_internal)
    {
        if($_internal)
        {
            KnowledgeBase::CreateEntry($_owner, 3, "%%_Files_%%", 0, "%%_Files_%%", 0, 1);
            KnowledgeBase::CreateEntry($_owner, 4, "%%_Internal_%%", 0, "%%_Internal_%%", 0, 3);
        }
        else
        {
            KnowledgeBase::CreateEntry($_owner, 3, "%%_Files_%%", 0, "%%_Files_%%", 0, 1);
            KnowledgeBase::CreateEntry($_owner, 5, "%%_External_%%", 0, "%%_External_%%", 0, 3);
        }
    }

    static function ReqisterQuery($_query,$_browser)
    {
	    if(strpos($_query,"tags: ") === 0)
            return false;
			
        $qid = $_browser->GetQueryId($_query,"",255,true);
        if(($result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_KNOWLEDGEBASE_QUERIES . "` WHERE `ip_hash`='" . DBManager::RealEscape(md5(Communication::GetIP())) . "' AND `query`=" . intval($qid) . " AND `time`>" . intval(time() - 3600) . ";")) && $row = DBManager::FetchArray($result))
            return;

        if($result = DBManager::Execute(true, "SELECT `t1`.`id` as `sid`,`t1`.`query` as `qid`,`t2`.`query` AS `qval` FROM `" . DB_PREFIX . DATABASE_KNOWLEDGEBASE_QUERIES . "` AS `t1` INNER JOIN `" . DB_PREFIX . DATABASE_VISITOR_DATA_QUERIES . "` AS `t2` ON `t1`.`query`=`t2`.`id` WHERE `t1`.`time`>" . intval(time() - 3600) . " AND `t1`.`ip_hash`='" . DBManager::RealEscape(md5(Communication::GetIP())) . "' ORDER BY `t1`.`time` DESC"))
            while($row = DBManager::FetchArray($result))
                if(strlen($_query) >= strlen($row["qval"]) && strpos($_query,$row["qval"])!==false)
                    DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_KNOWLEDGEBASE_QUERIES . "` WHERE `id`='" . DBManager::RealEscape($row["sid"]) . "' LIMIT 1");
        DBManager::Execute(true, "INSERT INTO `" . DB_PREFIX . DATABASE_KNOWLEDGEBASE_QUERIES . "` (`id`,`time`,`query`,`ip_hash`) VALUES ('" . DBManager::RealEscape(GetId(32)) . "'," . time() . "," . intval($qid) . ",'" . DBManager::RealEscape(md5(Communication::GetIP())) . "');");
    }

    static function GetURL($_article,$_getParams,$_title,$_exclude=null,$_blank=false,$_absolute=false,$_openExternal=false,$_hash="",$_color=true,$_id="",$_tagSearch=false)
    {
        if($_openExternal)
            $exclude[] = "no-logo";

        $params = KnowledgeBase::GetAllowedParameters("get",$_exclude,true);

        if(empty(Server::$Configuration->File["gl_kbmr"]))
        {
            if($_absolute)
                $url = LIVEZILLA_URL . "knowledgebase.php";
            else
                $url = "knowledgebase.php";

            if(!empty($_getParams))
                $params = array_merge($params,$_getParams);

            if(!empty($_article))
                $params["article"] = $_article;

            if(!empty($params))
            {
                ksort($params);
                $url .= "?" . http_build_query($params);
            }
        }
        else
        {
            $url = LIVEZILLA_URL . "knowledge-base/";

            if(!empty($_getParams))
                $params = array_merge($params,$_getParams);

            if(!empty($_article))
            {
                $entry = new KnowledgeBaseEntry();
                $entry->Load($_article);
                $parents = $entry->GetParents();

                foreach($parents as $id => $parent)
                {
                    $url .= $id . "/";
                }

                $url .= $_article . "/";
            }

            if(!empty($params))
            {
                ksort($params);

                $url .= "?" . http_build_query($params);
            }
        }

        $blank = "";
        if($_blank)
            $blank = " target=\"_blank\"";

        $color = "";
        if($_color)
            $color = " style=\"color:<!--color-->;\"";

        $id = "";
        if($_id)
            $id = " id=\"".$_id."\"";

        $class = "";
        if($_tagSearch)
            $class = " class=\"kb_tag\"";

        $link = "<a" . $id . $blank . $color . $class . " href=\"".$url.$_hash."\">".$_title."</a>";

        return $link;
    }

    static function GetEmbeddedURL()
    {
        $params = VisitorMonitoring::GetAllowedParameters();
        $url = Server::$Configuration->File["gl_kurl"];
        if(!empty($params))
        {
            if(strpos($url,'?')!==false)
                $url .= "&" . $params;
            else
                $url .= "?" . $params;
        }
        return LocalizationManager::Replace($url);
    }

    static function GetAllowedParameters($_type="get",$_exclude=null,$_asArray=false)
    {
        $allowed = array("tops"=>true,"e"=>true,"el"=>true,"epc"=>true,"etc"=>true,"ckf"=>true,"no-logo"=>true,"search-for"=>true,"ptn"=>true,"pte"=>true,"ptc"=>true,"ptq"=>true,"ptp"=>true,"ptl"=>true,"ptcf0"=>true,"ptcf1"=>true,"ptcf2"=>true,"ptcf3"=>true,"ptcf4"=>true,"ptcf5"=>true,"ptcf6"=>true,"ptcf7"=>true,"ptcf8"=>true,"ptcf9"=>true,"pth"=>true,"pto"=>true,"operator"=>true,"group"=>true);

        if($_exclude != null)
            foreach($_exclude as $ep)
                unset($allowed[$ep]);

        if($_type=="get")
        {
            if($_asArray)
                return Communication::GetTargetParameterArray($allowed);
            else
                return Communication::GetTargetParameterString("",$allowed);
        }
        else if($_type=="form")
            return Communication::GetTargetParameterForm("",$allowed);
        return "";
    }

    static function GetTemporaryTicketFiles($_visitorId,$_fIndex)
    {
        $files = array();
        if($result = DBManager::Execute(true, $d = "SELECT * FROM `" . DB_PREFIX . DATABASE_RESOURCES . "` WHERE `created`>(UNIX_TIMESTAMP()-3600) AND `parentid`=100 AND `discarded`=0 AND `type`=3 AND `editor`='". DBManager::RealEscape($_visitorId."_".$_fIndex) . "' LIMIT 10;"))
            while($row = DBManager::FetchArray($result))
                if(!TicketAttachment::ResourceExists($row["id"]))
                    $files[] = $row;

        return $files;
    }

    static function RemoveTicketFile($_id)
    {
        DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_RESOURCES . "` SET `discarded`=1 WHERE `created`>(UNIX_TIMESTAMP()-86400) AND `parentid`=100 AND `type`=3 AND MD5(`id`)='". DBManager::RealEscape($_id) . "' LIMIT 1;");
    }

    static function GetAllPublicLanguages()
    {
        global $LANGUAGES;
        $list = array();
        if($result = DBManager::Execute(true, "SELECT `languages` FROM `" . DB_PREFIX . DATABASE_RESOURCES . "` WHERE `kb_public`=1 GROUP BY `languages`"))
            while($row = DBManager::FetchArray($result))
            {
                $parts = explode(",",$row["languages"]);
                foreach($parts as $iso)
                {
                    $iso = strtoupper($iso);
                    if(!empty($iso) && isset($LANGUAGES[$iso]))
                    {
                        if(!isset($list[$iso]))
                            $list[$iso] = $LANGUAGES[$iso][0];
                    }
                }
            }
        return $list;
    }
}

class KnowledgeBaseEntry
{
    public $Id;
    public $Tags;
    public $Value;
    public $Title;
    public $Matchrate=0;
    public $ParentId;
    public $ChildNodes;
    public $Type=0;
    public $OwnerId;
    public $GroupId = "";
    public $EditorId;
    public $Created;
    public $Edited;
    public $Rank=0;
    public $Size;
    public $Languages;
    public $IsPublic;
    public $FulltextSearch;
    public $ShortcutWord;
    public $IsDiscarded;
    public $AllowBotAccess;
    public $OrderKey = 0;
    public $InWidget = true;
    public $Related = "";

    function __construct()
    {
        if(func_num_args() == 1)
        {
            $this->SetDetails(func_get_arg(0));
        }
    }

    function SetDetails($_row)
    {
        $this->Id = $_row["id"];
        $this->Value = $_row["value"];
        $this->Title = $_row["title"];
        $this->Tags = $_row["tags"];
        $this->ParentId = $_row["parentid"];
        $this->Type = $_row["type"];
        $this->OwnerId = $_row["owner"];
        $this->GroupId = $_row["owner_group"];
        $this->EditorId = $_row["editor"];
        $this->Created = $_row["created"];
        $this->Edited = $_row["edited"];
        $this->Size = $_row["size"];
        $this->Languages = $_row["languages"];
        $this->IsPublic = !empty($_row["kb_public"]);
        $this->FulltextSearch = !empty($_row["kb_ft_search"]);
        $this->ShortcutWord = $_row["shortcut_word"];
        $this->IsDiscarded = !empty($_row["discarded"]);
        $this->AllowBotAccess = !empty($_row["kb_bot"]);
        $this->OrderKey = $_row["order_key"];
        $this->InWidget = !empty($_row["in_widget"]);
        $this->Related = $_row["related"];
    }

    function Load($_id)
    {
        if($result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_RESOURCES . "` WHERE `id` = '" . DBManager::RealEscape($_id) . "'"))
        {
            if($row = DBManager::FetchArray($result))
            {
                $this->SetDetails($row);
                return true;
            }
        }
        return false;
    }

    function IsChildOf($_root="")
    {
        if(empty($_root) || $this->Id == $_root)
            return true;

        $stop = false;
        $pid = $this->ParentId;
        while(!$stop){
            $stop = true;

            if($result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_RESOURCES . "` WHERE `id` = '" . DBManager::RealEscape($pid) . "' AND `discarded`=0")){
                if($row = DBManager::FetchArray($result))
                {
                    if($row["id"] == $_root)
                    {
                        return true;
                    }
                    else
                    {
                        $stop = false;
                        $pid = $row["parentid"];
                    }
                }
            }
        }
        return false;
    }

    function GetParents()
    {
        $currentNode = $this;
        $list = array();
        $counter = 0;
        while($currentNode->ParentId != "" && $currentNode->ParentId != 1)
        {
            $parent = new KnowledgeBaseEntry();
            $parent->Load($currentNode->ParentId);

            if($parent->IsPublic && $parent->Type == 0)
                $list[$parent->Id] = $parent;

            $currentNode = $parent;

            if($counter++ > 10)
                return false;
        }
        return $list;
    }

    function LoadChildNodes($_root="",$_publicOnly=false,$_language="",$noFolders=false)
    {
        if($result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_RESOURCES . "` WHERE `parentid` = '" . DBManager::RealEscape($this->Id) . "' AND `discarded`=0 ORDER BY `order_key` ASC,`title` ASC"))
        {
            while($row = DBManager::FetchArray($result))
            {
                if($noFolders && $row["type"]==0)
                    continue;

                if(!$_publicOnly || !empty($row["kb_public"]))
                {
                    $child = new KnowledgeBaseEntry($row);
                    if($child->MatchesLanguage($_language))
                        $this->ChildNodes[$child->Id] = $child;
                }

            }
        }
    }

    function RemoveSubs()
    {
        $this->LoadChildNodes();
        if(is_array($this->ChildNodes))
            foreach($this->ChildNodes as $node)
            {
                $node->IsDiscarded = true;
                $node->Save();
                $node->RemoveSubs();
            }
    }

    function Save($edited=null,$_mirrorRelated=true)
    {
        if($edited==null)
            $edited = time();

        if(empty($this->Created))
            $this->Created = time();

        if($this->Size == 0)
            $this->Size = strlen($this->Title);

        $result = DBManager::Execute(true, "SELECT `id`,`value` FROM `" . DB_PREFIX . DATABASE_RESOURCES . "` WHERE `id`='" . DBManager::RealEscape($this->Id) . "'");
        if(DBManager::GetRowCount($result) == 0)
        {
            if(!$this->IsDiscarded)
            {
                Configuration::ApplyTagsToConfig($this->Tags,6);
                DBManager::Execute(true, "INSERT INTO `" . DB_PREFIX . DATABASE_RESOURCES . "` (`id`,`owner`,`owner_group`,`editor`,`value`,`edited`,`title`,`created`,`type`,`discarded`,`parentid`,`size`,`tags`,`languages`,`kb_public`,`kb_bot`,`kb_ft_search`,`shortcut_word`,`order_key`,`in_widget`,`related`) VALUES ('" . DBManager::RealEscape(Str::Cut($this->Id,256,false)) . "','" . DBManager::RealEscape($this->OwnerId) . "','" . DBManager::RealEscape($this->GroupId) . "','" . DBManager::RealEscape($this->EditorId) . "','" . DBManager::RealEscape($this->Value) . "'," . intval($edited) . ",'" . DBManager::RealEscape(Str::Cut($this->Title,254,false)) . "'," . intval($this->Created) . "," . intval($this->Type) . "," . intval($this->IsDiscarded ? 1 : 0) . ",'" . DBManager::RealEscape($this->ParentId) . "','" . DBManager::RealEscape($this->Size) . "','" . DBManager::RealEscape($this->Tags) . "','" . DBManager::RealEscape($this->Languages) . "'," . intval($this->IsPublic ? 1 : 0) . "," . intval($this->AllowBotAccess ? 1 : 0) . "," . intval($this->FulltextSearch ? 1 : 0) . ",'" . DBManager::RealEscape($this->ShortcutWord) . "'," . intval($this->OrderKey) . "," . intval($this->InWidget) . ",'" . DBManager::RealEscape($this->Related) . "')");
            }
        }
        else
        {
            $row = DBManager::FetchArray($result);
            Configuration::ApplyTagsToConfig($this->Tags,7);
            DBManager::Execute(true, $result = "UPDATE `" . DB_PREFIX . DATABASE_RESOURCES . "` SET `owner`='" . DBManager::RealEscape($this->OwnerId) . "',`owner_group`='" . DBManager::RealEscape($this->GroupId) . "',`value`='" . DBManager::RealEscape($this->Value) . "',`in_widget`='" . intval($this->InWidget) . "',`related`='" . DBManager::RealEscape($this->Related) . "',`order_key`='" . intval($this->OrderKey) . "',`editor`='" . DBManager::RealEscape($this->EditorId) . "',`tags`='" . DBManager::RealEscape($this->Tags) . "',`title`='" . DBManager::RealEscape(Str::Cut($this->Title,254,false)) . "',`edited`=" . intval($edited) . ",`discarded`='" . intval($this->IsDiscarded ? 1 : 0) . "',`parentid`='" . DBManager::RealEscape($this->ParentId) . "',`size`='" . DBManager::RealEscape($this->Size) . "',`languages`='" . DBManager::RealEscape($this->Languages) . "',`kb_public`=" . intval($this->IsPublic ? 1 : 0) . ",`kb_bot`=" . intval($this->AllowBotAccess ? 1 : 0) . ",`kb_ft_search`=" . intval($this->FulltextSearch ? 1 : 0) . ",`kb_bot`=" . intval($this->AllowBotAccess ? 1 : 0) . ",`shortcut_word`='" . DBManager::RealEscape($this->ShortcutWord) . "' WHERE id='" . DBManager::RealEscape($this->Id) . "' LIMIT 1");
            if(!empty($_disc) && ($this->Type == RESOURCE_TYPE_FILE_INTERNAL || $this->Type == RESOURCE_TYPE_FILE_EXTERNAL) && @file_exists("./uploads/" . $row["value"]) && strpos($row["value"],"..")===false)
                @unlink("./uploads/" . $row["value"]);
        }
        if($_mirrorRelated)
            $this->MirrorRelated();
    }

    function MirrorRelated()
    {
        // add mirrors
        $newrelated = "";
        if(!empty($this->Related))
        {
            $ids = explode(",",$this->Related);
            foreach($ids as $rid)
            {
                $entry = new KnowledgeBaseEntry();
                if($entry->Load($rid) && !$entry->IsDiscarded)
                {
                    $newrelated = Str::Append($newrelated,$rid);

                    if(strpos($entry->Related,$this->Id) === false)
                    {
                        $entry->Related = Str::Append($entry->Related,$this->Id);
                        $entry->Save(time(),false);
                    }
                }
            }

            if($this->Related != trim($newrelated))
            {
                $this->Related = trim($newrelated);
                $this->Save(time(),false);
            }
        }

        // remove outdated mirrors
        $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_RESOURCES . "` WHERE `related` LIKE '%" . DBManager::RealEscape($this->Id) . "%';");
        if($result)
            while($row = DBManager::FetchArray($result))
            {
                if(strpos($this->Related,$row["id"]) === false)
                {
                    $entry = new KnowledgeBaseEntry($row);
                    $entry->RemoveRelated($this->Id);
                    $entry->Save(time(),false);
                }
            }
    }

    function RemoveRelated($_idToRemove)
    {
        $newrelated = "";
        $related = explode(",",$this->Related);
        foreach($related as $id)
            if($id != $_idToRemove)
                $newrelated = Str::Append($newrelated,$id);
        $this->Related = $newrelated;
    }

    function RenameRelated($_id)
    {
        $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_RESOURCES . "` WHERE `related` LIKE '%" . DBManager::RealEscape($this->Id) . "%';");
        if($result)
            while($row = DBManager::FetchArray($result))
            {
                $write = false;
                $ids = explode(",",$row["related"]);
                foreach($ids as $index => $rrid)
                {
                    if($rrid == $this->Id)
                    {
                        $ids[$index] = $_id;
                        $write = true;
                        break;
                    }
                }
                if($write)
                {
                    $ids = implode(",",$ids);
                    DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_RESOURCES . "` SET `edited`=".time().",`related` = '" . DBManager::RealEscape($ids) . "' WHERE `id`='" . DBManager::RealEscape($row["id"]) . "' LIMIT 1;");
                }
            }
    }

    function ChangeId($_id)
    {
        if(!empty($_id) && KnowledgeBaseEntry::GetById($_id) == null && strlen($_id) <= 256)
        {
            $base = new KnowledgeBaseEntry();
            $exists = $base->Load($this->Id);

            DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_STATS_AGGS_KNOWLEDGEBASE . "` SET `res_id`='" . DBManager::RealEscape($_id) . "' WHERE `res_id` = '" . DBManager::RealEscape($this->Id) . "';");
            DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_TICKET_ATTACHMENTS . "` SET `res_id`='" . DBManager::RealEscape($_id) . "' WHERE `res_id` = '" . DBManager::RealEscape($this->Id) . "';");
            DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_KNOWLEDGEBASE_VIEWS . "` SET `res_id`='" . DBManager::RealEscape($_id) . "' WHERE `res_id` = '" . DBManager::RealEscape($this->Id) . "';");
            DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_FEEDBACKS . "` SET `resource_id`='" . DBManager::RealEscape($_id) . "' WHERE `resource_id` = '" . DBManager::RealEscape($this->Id) . "';");
            DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_AUTO_REPLIES . "` SET `resource_id`='" . DBManager::RealEscape($_id) . "' WHERE `resource_id` = '" . DBManager::RealEscape($this->Id) . "';");
            DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_RESOURCES . "` SET `edited`=" . intval(time()) . ",`parentid`='" . DBManager::RealEscape($_id) . "' WHERE `parentid` = '" . DBManager::RealEscape($this->Id) . "';");

            $this->IsDiscarded = true;

            if($exists)
                $this->Value = "";

            $this->Created = $base->Created;
            $this->Edited = time();
            $this->Save();

            $this->IsDiscarded = false;

            if($exists)
                $this->Value = $base->Value;

            $this->RenameRelated($_id);

            $this->Id = $_id;
            return true;
        }
        return false;
    }

    function GetXML()
    {
        $this->CalculateRank();
        return "<r ba=\"".base64_encode($this->AllowBotAccess ? 1 : 0)."\" s=\"".base64_encode($this->ShortcutWord)."\" f=\"".base64_encode($this->FulltextSearch ? 1 : 0)."\" p=\"".base64_encode($this->IsPublic ? 1 : 0)."\" l=\"".base64_encode($this->Languages)."\" g=\"".base64_encode($this->GroupId)."\" ok=\"".base64_encode($this->OrderKey)."\" rlta=\"".base64_encode($this->Related)."\" iw=\"".base64_encode($this->InWidget ? "1" : "0")."\" rid=\"".base64_encode($this->Id)."\" si=\"".base64_encode($this->Size)."\" di=\"".base64_encode($this->IsDiscarded ? 1 : 0)."\" oid=\"".base64_encode($this->OwnerId)."\" eid=\"".base64_encode($this->EditorId)."\" ty=\"".base64_encode($this->Type)."\" ti=\"".base64_encode($this->Title)."\" t=\"".base64_encode($this->Tags)."\" ed=\"".base64_encode($this->Edited)."\" c=\"".base64_encode($this->Created)."\" pid=\"".base64_encode($this->ParentId)."\" ra=\"".base64_encode($this->Rank)."\">".base64_encode($this->Value)."</r>\r\n";
    }

    function GetHTML($_color,$_inChat=true,$_lineBreak=true)
    {
        $openExternal = isset($_GET["no-logo"]) && !$this->InWidget;

        $target = ($openExternal) ? " target=\"_blank\"" : "";

        $html = IOStruct::GetFile(PATH_TEMPLATES . (($this->Type == 2 || $this->Type == 3 || $this->Type == 4) ? "kb_result_link_v2.tpl" : "kb_result_text_v2.tpl"));
        $html = str_replace("<!--classes-->",($this->Type==0) ? " lz_kb_folder" : "",$html);
        $html = str_replace("<!--preview-->",($this->Type==0 && $this->Value==$this->Title) ? "" : Str::Cut(strip_tags($this->Value),100,true),$html);
        $html = str_replace("<!--link-->",KnowledgeBase::GetURL($this->Id,"",$this->Title,array(),$openExternal,true,$openExternal),$html);

        $html = str_replace("<!--target-->",$target,$html);

        if($_color != null)
            $html = str_replace("<!--color-->",$_color,$html);

        $html = str_replace("<!--title-->",htmlentities($this->Title,ENT_QUOTES,"UTF-8"),$html);

        if($this->Type == 2)
            $html = str_replace("<!--link-->",$this->Value,$html);
        else if($this->Type==3 || $this->Type==4)
            $html = str_replace("<!--link-->",LIVEZILLA_URL . "getfile.php?id=" . $this->Id,$html);
        else
            $html = str_replace("<!--id-->",urlencode($this->Id),$html);

        if(!$_lineBreak)
            return $html;
        else
            return $html."<br>";
    }

    function GetFullHTML($_color)
    {
        $html = "<h3>".$this->Title."</h3>";
        foreach($this->ChildNodes as $child)
            $html .= $child->GetHTML($_color,false);
        return $html;
    }

    function MatchesLanguage($_language)
    {
        if(empty($this->Languages))
            return true;
        if(empty($_language))
            return false;
        $ll = array();

        if(strpos($this->Languages,",")===false)
            $ll[] = strtolower($this->Languages);
        else
            $ll = explode(",",strtolower($this->Languages));
        return in_array(strtolower($_language),$ll);
    }

    function CalculateMatchrate($_question,$_language)
    {
        $count = 0;
        $content = "";

        $tagsOnly = strpos($_question, "tags: ") === 0;
        $_question = str_replace("tags: ","",$_question);

        if(Server::$Configuration->File["gl_kbsb"] <= 1)
            $content .= str_repeat(",". $this->Title,3);

        if(Server::$Configuration->File["gl_kbsb"] == 0)
            $content .= "," . $this->Value;

        $carray = explode(",",str_replace(array(" ",";",".","?","!"),",",strtoupper($content)));
        $qarray = explode(",",str_replace(array(" ",";",".","?","!"),",",strtoupper($_question)));
        $tags = explode(",",strtoupper($this->Tags));

        foreach($qarray as $qword)
        {
            if(!$tagsOnly)
                if(strlen($qword) >= Server::$Configuration->File["gl_kbml"])
                    foreach($carray as $cword)
                    {
                        if(strlen($cword) >= Server::$Configuration->File["gl_kbml"])
                        {
                            if($cword===$qword)
                                $count+=2;
                            else if(strpos($cword,$qword) !== false || strpos($qword,$cword) !== false)
                                $count++;
                        }
                    }

            foreach($tags as $tag)
            {
                if(!empty($tag) && !empty($qword))
                {
                    if($tag===$qword)
                        $count+=10;
                    else if(strlen($qword) >= Server::$Configuration->File["gl_kbml"])
                        if(strpos($qword,$tag) !== false || strpos($tag,$qword) !== false)
                            $count++;
                }
            }
        }

        if($count > 0 && !empty($this->Languages) && $this->MatchesLanguage($_language))
            $count+=1;

        $this->Matchrate = $count;
    }

    function CalculateRank()
    {
        if($this->ParentId=="1")
        {
            $this->Rank = 1;
            return;
        }

        $this->Rank = -1;
        $rank = 0;
        $parent = $this->ParentId;
        $count=0;
        while($count<100)
        {
            $perow = KnowledgeBaseEntry::GetById($parent,false);
            if($perow != null)
            {
                $parent = $perow["parentid"];
                $rank++;
            }
            else
                break;
            $count++;
        }

        if($rank > 0)
            $this->Rank = $rank+1;
        else
            $this->Rank = 1;
    }

    function GetRateResult()
    {
        $list = array(0,0);
        $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_FEEDBACKS . "` AS `t1` INNER JOIN `" . DB_PREFIX . DATABASE_FEEDBACK_CRITERIA . "` AS `t2` ON `t1`.`id`=`t2`.`fid` WHERE `t1`.`resource_id`='" . DBManager::RealEscape($this->Id) . "';");
        if($result)
            while($row = DBManager::FetchArray($result))
            {
                $list[1]++;
                if(!empty($row["value"]))
                    $list[0]++;
            }
        return $list;
    }

    function SaveRateResult($_result)
    {
        if(Feedback::IsResourceRating($this->Id))
            return;
        $fb = new Feedback(getId(32));
        $fb->ResourceId = $this->Id;
        $fb->CriteriaList["hf"] = intval($_result);
        $fb->Save();
    }

    function RegisterView()
    {
        DBManager::Execute(true, "INSERT INTO `" . DB_PREFIX . DATABASE_KNOWLEDGEBASE_VIEWS . "` (`id`,`time`,`res_id`) VALUES ('" . DBManager::RealEscape(GetId(32)) . "'," . time() . ",'" . DBManager::RealEscape($this->Id) . "');");
    }

    static function GetById($_id,$_publicOnly=false)
    {
        $_publicOnly = ($_publicOnly) ? " AND (`kb_public`=1 OR `kb_bot`=1)" : "";
        if($result = DBManager::Execute(false, "SELECT * FROM `" . DB_PREFIX . DATABASE_RESOURCES . "` WHERE `discarded`<>1" . $_publicOnly . " AND `id` = '" . DBManager::RealEscape($_id) . "' LIMIT 1;"))
        {
            if($row = DBManager::FetchArray($result))
            {
                if(!empty($_publicOnly))
                    return new KnowledgeBaseEntry($row);
                else
                    return $row;
            }
        }

        return null;
    }

    static function GetIdByUserId($_userId,$_browserId)
    {

        if($result = DBManager::Execute(true, $d="SELECT * FROM `" . DB_PREFIX . DATABASE_RESOURCES . "` WHERE `discarded`=2 AND `parentid` = '" . DBManager::RealEscape($_userId) . "' AND `editor` = '" . DBManager::RealEscape($_browserId) . "' ORDER BY `created` DESC LIMIT 1;"))
            if($row = DBManager::FetchArray($result))
            {
                return $row["id"];
            }

        return null;
    }

    static function RemoveByChatId($_chatId)
    {
        if(empty($_chatId))
            return;

        if($result = DBManager::Execute(true, "SELECT `id` FROM `" . DB_PREFIX . DATABASE_RESOURCES . "` WHERE `chat_id` = '" . DBManager::RealEscape($_chatId) . "';"))
            while($row = DBManager::FetchArray($result))
                KnowledgeBaseEntry::RemoveById($row["id"]);
        return null;
    }

    static function RemoveById($_id)
    {
        $kbe = new KnowledgeBaseEntry();
        $kbe->Load($_id);
        $kbe->IsDiscarded = true;
        $kbe->Save();
        if($kbe->Type > 2)
            if(strpos($kbe->Value,"..") === false)
                @unlink(PATH_UPLOADS . $kbe->Value);
    }
}

class FeedbackCriteria
{
    public $Id;
    public $Type;
    public $Title;
    public $PostKey;
    public $Name;
    public static $MaxCriteriaReports = 9;

    function __construct()
    {
        if(func_num_args() == 1)
        {
            $this->SetDetails(func_get_arg(0));
        }
        else if(func_num_args() == 2)
        {
            $this->Id = $_POST["p_cfg_fc_i_" . func_get_arg(0)];
            $this->Type = $_POST["p_cfg_fc_ty_" . func_get_arg(0)];
            $this->Title = $_POST["p_cfg_fc_t_" . func_get_arg(0)];
            $this->Name = $_POST["p_cfg_fc_n_" . func_get_arg(0)];
        }
    }

    function SetDetails($_row)
    {
        $this->Id = $_row["id"];
        $this->Type = $_row["type"];
        $this->Title = $_row["title"];
        $this->Name = $_row["name"];

    }

    function GetPostKey()
    {
        return "lz_feedback_value_" . $this->Id;
    }

    function GetHeight()
    {
        return ($this->Type == 1) ? 118 : 55;
    }

    function Save()
    {
        DBManager::Execute(true, "INSERT INTO `" . DB_PREFIX . DATABASE_FEEDBACK_CRITERIA_CONFIG . "` (`id` ,`type` ,`name` ,`title`) VALUES ('" . DBManager::RealEscape($this->Id) . "','" . DBManager::RealEscape($this->Type) . "','" . DBManager::RealEscape($this->Name) . "','" . DBManager::RealEscape($this->Title) . "');");
        CacheManager::SetDataUpdateTime(DATA_UPDATE_KEY_FEEDBACKS);
    }

    function GetHTML()
    {
        $html = IOStruct::GetFile(PATH_TEMPLATES . "feedback_type_".$this->Type.".tpl");
        $html = str_replace("<!--cid-->",$this->Id,$html);
        $html = str_replace("<!--title-->",$this->Title,$html);
        return $html;
    }

    function GetXML()
    {
        return "<fbc i=\"".base64_encode($this->Id)."\" t=\"".base64_encode($this->Type)."\" n=\"".base64_encode($this->Name)."\">".base64_encode($this->Title)."</fbc>\r\n";
    }

    static function GetStatArray($_titles=false)
    {
        Server::InitDataBlock(array("DBCONFIG"));
        $a = array();
        if(!empty(Server::$Configuration->Database["gl_fb"]) && is_array(Server::$Configuration->Database["gl_fb"]))
            foreach(Server::$Configuration->Database["gl_fb"] as $id => $criteria)
            {
                if(count($a) < FeedbackCriteria::$MaxCriteriaReports && $criteria->Type == 0)
                {
                    $a[$id] = ($_titles) ? str_replace("-->","",str_replace("<!--lang_","",$criteria->Title)) : 0;
                }
            }
        if(!$_titles)
            while(count($a) < FeedbackCriteria::$MaxCriteriaReports)
                $a[getId(5)] = 0;
        return $a;
    }
}

class Feedback
{
    public $Id;
    public $VisitorData;
    public $ChatId;
    public $TicketId;
    public $ResourceId;
    public $UserId;
    public $GroupId;
    public $OperatorId;
    public $CriteriaList;
    public $Created;

    function __construct()
    {
        $this->CriteriaList = array();
        $this->Id = func_get_arg(0);
        if(func_num_args() == 2)
        {
            $row = func_get_arg(1);
            $this->Id = $row["id"];
            $this->ChatId = $row["chat_id"];
            $this->TicketId = $row["ticket_id"];
            $this->UserId = $row["user_id"];
            $this->OperatorId = $row["operator_id"];
            $this->GroupId = $row["group_id"];
            if(!empty($row["data_id"]))
            {
                $this->VisitorData = new UserData();
                $this->VisitorData->Id = $row["data_id"];
                $this->VisitorData->Load();
            }
            $this->Created = $row["created"];
        }
    }

    function AddCriteriaDataFromServerInput()
    {
        foreach(Server::$Configuration->Database["gl_fb"] as $criteria)
            $this->CriteriaList[$criteria->Id] = Communication::GetParameter($criteria->GetPostKey(),"",$nu,null,null,512,false,false);
    }

    function LoadCriteriaList()
    {
        $this->CriteriaList = array();
        if($result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_FEEDBACK_CRITERIA . "` WHERE `fid`='" . DBManager::RealEscape($this->Id) . "';"))
            while($row = DBManager::FetchArray($result))
                $this->CriteriaList[$row["cid"]] = $row["value"];
    }

    function Save()
    {
        if(!empty($this->CriteriaList))
        {
            foreach($this->CriteriaList as $cid => $value)
                DBManager::Execute(true, "INSERT IGNORE INTO `" . DB_PREFIX . DATABASE_FEEDBACK_CRITERIA . "` (`fid` ,`cid` ,`value`) VALUES ('" . DBManager::RealEscape($this->Id) . "','" . DBManager::RealEscape($cid) . "','" . DBManager::RealEscape($value) . "');");
            $udid = (!empty($this->VisitorData)) ? $this->VisitorData->Id : "";
            DBManager::Execute(true, "INSERT IGNORE INTO `" . DB_PREFIX . DATABASE_FEEDBACKS . "` (`id`,`created`,`chat_id`,`ticket_id`,`resource_id`,`user_id`,`operator_id`,`group_id`,`data_id`,`ip_hash`) VALUES ('" . DBManager::RealEscape($this->Id) . "'," . intval(time()) . ",'" . DBManager::RealEscape($this->ChatId) . "','" . DBManager::RealEscape($this->TicketId) . "','" . DBManager::RealEscape($this->ResourceId) . "','" . DBManager::RealEscape($this->UserId) . "','" . DBManager::RealEscape($this->OperatorId) . "','" . DBManager::RealEscape($this->GroupId) . "','" . DBManager::RealEscape($udid) . "','" . DBManager::RealEscape(md5(Communication::GetIP())) . "');");
            CacheManager::SetDataUpdateTime(DATA_UPDATE_KEY_FEEDBACKS);
        }
    }

    function SetTicketId($_tId)
    {
        DBManager::Execute(true, "UPDATE `" . DB_PREFIX . DATABASE_FEEDBACKS . "` SET `ticket_id`='" . intval($_tId) . "' WHERE `id`='" . DBManager::RealEscape($this->Id) . "' LIMIT 1");
    }

    function GetXML()
    {
        $xml = "<fb i=\"".base64_encode($this->Id)."\" c=\"".base64_encode($this->ChatId)."\" t=\"".base64_encode($this->TicketId)."\" o=\"".base64_encode($this->OperatorId)."\" g=\"".base64_encode($this->GroupId)."\" u=\"".base64_encode($this->UserId)."\" cr=\"".base64_encode($this->Created)."\">\r\n";
        foreach($this->CriteriaList as $cid => $value)
            $xml .= "<v i=\"".base64_encode($cid)."\">".base64_encode($value)."</v>\r\n";

        if(!empty($this->VisitorData))
            $xml .= $this->VisitorData->GetXML();
        return $xml . "</fb>";
    }

    static function IsFlood()
    {
        $result = DBManager::Execute(true, "SELECT COUNT(`id`) AS `fb_count` FROM `" . DB_PREFIX . DATABASE_FEEDBACKS . "` WHERE `resource_id`='' AND `created`>" . DBManager::RealEscape(time() - 86400) . " AND `ip_hash`='" . DBManager::RealEscape(md5(Communication::GetIP())) . "';");
        if($result)
        {
            $row = DBManager::FetchArray($result);
            return ($row["fb_count"] >= MAX_FEEDBACKS_PER_DAY);
        }
        else
            return true;
    }

    static function GetRatingAVG($_chatId,$ratav = "-")
    {
        Server::InitDataBlock(array("DBCONFIG"));
        $fb = Feedback::GetByChatId($_chatId);
        if(!empty($fb))
        {
            $fb->LoadCriteriaList();
            $scount = 0;
            $svalue = 0;
            $scomment = "";
            foreach(Server::$Configuration->Database["gl_fb"] as $criteria)
            {
                if(!isset($fb->CriteriaList[$criteria->Id]))
                    continue;

                if($criteria->Type == 0)
                {
                    $scount++;
                    $svalue += $fb->CriteriaList[$criteria->Id];
                }
                else if($criteria->Type == 1)
                {
                    $scomment .= $fb->CriteriaList[$criteria->Id];

                }
                $ratav = round((($svalue)/$scount),1) . "/5 (" . $scomment . ")";
            }
        }
        return $ratav;
    }

    static function GetByChatId($_chatId)
    {
        $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_FEEDBACKS . "` WHERE `chat_id`='" . DBManager::RealEscape($_chatId) . "' LIMIT 1;");
        if($result)
            if($row = DBManager::FetchArray($result))
                return new Feedback($row["id"],$row);
        return null;
    }

    static function GetByVisitorId($_visitorId)
    {
        $result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_FEEDBACKS . "` WHERE `user_id`='" . DBManager::RealEscape($_visitorId) . "' LIMIT 1;");
        if($result)
            if($row = DBManager::FetchArray($result))
                return new Feedback($row["id"],$row);
        return null;
    }

    static function GetLink($_getParam)
    {
        return LIVEZILLA_URL . "feedback.php?" . $_getParam;
    }

    static function IsResourceRating($_resourceId)
    {
        if($result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_FEEDBACKS . "` WHERE `resource_id`='" . DBManager::RealEscape($_resourceId) . "' AND `ip_hash`='" . DBManager::RealEscape(md5(Communication::GetIP())) . "';"))
            if($row = DBManager::FetchArray($result))
                return true;
        return false;
    }

    static function Remove($_id)
    {
        DBManager::Execute(true, "DELETE FROM `" . DB_PREFIX . DATABASE_FEEDBACKS . "` WHERE `id`='" . DBManager::RealEscape($_id) . "' LIMIT 1;");
    }
}

class UserData extends BaseObject
{
    public $Text;
    public $LoadedId = "";
    public $SavedId = "";

    function __construct($_fullname="",$_email="",$_company="",$_phone="",$_customs=null,$_text="")
    {
        $this->Fullname = $_fullname;
        $this->Email = $_email;
        $this->Company = $_company;
        $this->Phone = $_phone;
        $this->Customs = $_customs;
        $this->Text = $_text;
    }

    function Hash()
    {
        $base = $this->Fullname.$this->Email.$this->Company.$this->Phone.serialize($this->Customs).$this->Text;
        return md5($base);
    }

    function IsEmpty()
    {
        $x = empty($this->Fullname)&&empty($this->Email)&&empty($this->Company)&&empty($this->Phone)&&empty($this->Text);

        if(!$x)
            return false;

        if(is_array(empty($this->Customs)))
            foreach($this->Customs as $c)
                if(!empty($c))
                    return false;

        return true;
    }

    function Save()
    {
        if($this->Hash() != $this->SavedId)
        {
            $this->SavedId = $this->Hash();
            DBManager::Execute(true, "INSERT IGNORE INTO `" . DB_PREFIX . DATABASE_USER_DATA . "` (`id`,`create`,`h_fullname`,`h_email`,`h_company`,`h_phone`,`h_customs`,`h_text`) VALUES ('" . DBManager::RealEscape($this->Hash()) . "'," . intval(time()) . ",'" . DBManager::RealEscape($this->Fullname) . "','" . DBManager::RealEscape($this->Email) . "','" . DBManager::RealEscape($this->Company) . "','" . DBManager::RealEscape($this->Phone) . "','" . DBManager::RealEscape(serialize($this->Customs)) . "','" . DBManager::RealEscape($this->Text) . "');");
        }
        return $this->Hash();
    }

    function SetDetails($row,$_indexField="id")
    {
        $applyCkSettings = defined("CALLER_TYPE") && CALLER_TYPE == CALLER_TYPE_TRACK && VisitorMonitoring::$Visitor->FirstCall;
        Server::InitDataBlock(array("INPUTS"));

        $this->LoadedId = $row[$_indexField];
        $this->Id = $row[$_indexField];

        if(!($applyCkSettings && !Server::$Inputs[111]->Cookie))
            $this->Fullname = $row["h_fullname"];

        if(!($applyCkSettings && !Server::$Inputs[112]->Cookie))
            $this->Email = $row["h_email"];

        if(!($applyCkSettings && !Server::$Inputs[113]->Cookie))
            $this->Company = $row["h_company"];

        if(!($applyCkSettings && !Server::$Inputs[116]->Cookie))
            $this->Phone = $row["h_phone"];

        $this->Customs = @unserialize($row["h_customs"]);
        $this->Text = $row["h_text"];


        if($applyCkSettings)
        {
            if(is_array($this->Customs))
            {
                foreach(Server::$Inputs as $index => $input)
                {
                    if($input->Active && empty($input->Cookie))
                    {
                        if(isset($this->Customs[$index]))
                            unset($this->Customs[$index]);
                    }
                }
            }
        }
    }

    function SaveToCookie()
    {
        if(!$this->IsEmpty() && Cookie::Get("user_did") != ($this->Hash()))
            Cookie::Set("user_did",($this->Hash()));
    }

    function LoadFromCookie()
    {
        if(!Is::Null(Cookie::Get("user_did")))
        {
            $this->Id = IOStruct::FilterParameter(Cookie::Get("user_did"),"",FILTER_SANITIZE_STRING,null,32);
            if(strlen($this->Id)==32)
                $this->Load();
            else
                $this->Id = "";
        }

        /*

        Server::InitDataBlock(array("INPUTS"));
        if(is_array($this->Customs))
        {
            foreach(Server::$Inputs as $index => $input)
            {
                if($input->Active && empty($input->Cookie))
                {
                    $this->Customs[$index] = "0";
                }
            }
        }
        */
    }

    function LoadFromPassThru($_overwriteExisting=false)
    {
        Server::InitDataBlock(array("INPUTS"));
        $wc = false;

        if(!$_overwriteExisting && isset($_GET["pto"]))
            $_overwriteExisting = true;

        $di = Server::$Inputs[111]->GetServerInput();
        if(($_overwriteExisting||empty($this->Fullname)) && !empty($di))
        {
            $this->Fullname = $di;
            $wc = true;
        }

        $di = Server::$Inputs[112]->GetServerInput();
        if(($_overwriteExisting||empty($this->Email)) && !empty($di))
        {
            $this->Email = $di;
            $wc = true;
        }

        $di = Server::$Inputs[113]->GetServerInput();
        if(($_overwriteExisting||empty($this->Company)) && !empty($di))
        {
            $this->Company = $di;
            $wc = true;
        }

        $di = Server::$Inputs[114]->GetServerInput();
        if(($_overwriteExisting||empty($this->Text)) && !empty($di))
        {
            $this->Text = $di;
            $wc = true;
        }

        $di = Server::$Inputs[116]->GetServerInput();
        if(($_overwriteExisting||empty($this->Phone)) && !empty($di))
        {
            $this->Phone = $di;
            $wc = true;
        }

        foreach(Server::$Inputs as $index => $input)
            if($input->Custom && $input->Active)
            {
                $di = $input->GetServerInput();

                if(($_overwriteExisting||empty($this->Customs[$index])) && (!empty($di) || $di === "0"))
                {
                    $this->Customs[$index] = $di;
                    $wc = true;
                }
            }

        return $wc;
    }

    function LoadFromBotAPI($_apiResponse)
    {
        Server::InitDataBlock(array("INPUTS"));
        $wc = false;

        $di = Server::$Inputs[111]->GetAPIInput($_apiResponse);
        if(!empty($di))
        {
            $this->Fullname = $di;
            $wc = true;
        }

        $di = Server::$Inputs[112]->GetAPIInput($_apiResponse);
        if(!empty($di))
        {
            $this->Email = $di;
            $wc = true;
        }

        $di = Server::$Inputs[113]->GetAPIInput($_apiResponse);
        if(!empty($di))
        {
            $this->Company = $di;
            $wc = true;
        }

        $di = Server::$Inputs[114]->GetAPIInput($_apiResponse);
        if(!empty($di))
        {
            $this->Text = $di;
            $wc = true;
        }

        $di = Server::$Inputs[116]->GetAPIInput($_apiResponse);
        if(empty($this->Phone) && !empty($di))
        {
            $this->Phone = $di;
            $wc = true;
        }

        foreach(Server::$Inputs as $index => $input)
            if($input->Custom && $input->Active)
            {
                $di = $input->GetAPIInput($_apiResponse);
                if(empty($this->Customs[$index]) && !empty($di))
                {
                    $this->Customs[$index] = $di;
                    $wc = true;
                }
            }
        return $wc;
    }

    function LoadFromLogin($_group)
    {
        if(Server::$Inputs[111]->IsServerInput())
            $this->Fullname = Str::Cut($_group->GetServerInput(Server::$Inputs[111]),255);

        if(Server::$Inputs[112]->IsServerInput())
            $this->Email = Str::Cut($_group->GetServerInput(Server::$Inputs[112]),255);

        if(Server::$Inputs[113]->IsServerInput())
            $this->Company = Str::Cut($_group->GetServerInput(Server::$Inputs[113]),255);

        if(Server::$Inputs[114]->IsServerInput())
            $this->Text = Str::Cut($_group->GetServerInput(Server::$Inputs[114]),MAX_INPUT_LENGTH);

        if(Server::$Inputs[116]->IsServerInput())
            $this->Phone = Str::Cut($_group->GetServerInput(Server::$Inputs[116]),255);

        foreach(Server::$Inputs as $index => $input)
        {
            if($input->Active && $input->Custom)
            {
                if($input->IsServerInput())
                {
                    $this->Customs[$index] = $_group->GetServerInput($input);
                }
            }
        }
    }

    function LoadFromEvent($_fieldId,$_serverResponse)
    {
        if($_fieldId == 111)
            $this->Fullname = Str::Cut($_serverResponse,255);

        if($_fieldId == 112)
            $this->Email = Str::Cut($_serverResponse,255);

        if($_fieldId == 113)
            $this->Company = Str::Cut($_serverResponse,255);

        if($_fieldId == 114)
            $this->Text = Str::Cut($_serverResponse,MAX_INPUT_LENGTH);

        if($_fieldId == 116)
            $this->Phone = Str::Cut($_serverResponse,255);

        foreach(Server::$Inputs as $index => $input)
            if($input->Active && $input->Custom)
                if($index == $_fieldId)
                    $this->Customs[$index] = $_serverResponse;
    }

    function IsDifference($_comparer,$_comparerCanBeNull=false)
    {
        $refclass = new ReflectionClass($this);
        foreach ($refclass->getProperties() as $property)
        {
            if(($_comparerCanBeNull || !Is::Null($property->getValue($_comparer))) && $property->getValue($this) != $property->getValue($_comparer))
                return true;
        }
        return false;
    }

    function FormatChatArchiveArray()
    {
        $customs = array();
        if(is_array($this->Customs))
            foreach($this->Customs as $cind => $value)
                if(Server::$Inputs[$cind]->Active && Server::$Inputs[$cind]->Custom)
                    $customs[Server::$Inputs[$cind]->Name] = $value;
        return $customs;
    }

    function Load()
    {
        if(!empty($this->Id) && $this->Id == $this->LoadedId)
            return false;

        if($result = DBManager::Execute(true, "SELECT * FROM `" . DB_PREFIX . DATABASE_USER_DATA . "` WHERE `id`='" . DBManager::RealEscape($this->Id) . "';"))
            while($row = DBManager::FetchArray($result))
            {
                $this->SetDetails($row);
                $this->LoadFromPassThru();
                return true;
            }
        return false;
    }

    function GetXML()
    {
        $xml = "<d f111=\"".base64_encode($this->GetInputData(111,true))."\" f112=\"".base64_encode($this->GetInputData(112,true))."\" f113=\"".base64_encode($this->GetInputData(113,true))."\" f116=\"".base64_encode($this->GetInputData(116,true))."\" f114=\"".base64_encode($this->Text)."\"";
        if(is_array($this->Customs))
            foreach($this->Customs as $i => $c)
                $xml .= " f".$i."=\"" . base64_encode($this->GetInputData($i,true)) . "\"";
        return $xml . "></d>";
    }

    static function FromTicketMessage($_ticketMessage)
    {
        $d = new UserData($_ticketMessage->Fullname,$_ticketMessage->Email,$_ticketMessage->Company,$_ticketMessage->Phone,$_ticketMessage->Customs,"");
        $d->Id = $d->Hash();
        return $d;
    }

    static function FromOperatorInput()
    {
        $d = new UserData($_POST['p_vi_111'],$_POST['p_vi_112'],$_POST['p_vi_113'],$_POST['p_vi_116']);
        $d->Id = $d->Hash();
        return $d;
    }

    static function FromSystemId($_systemId)
    {
        $d = new UserData();
        $parts = explode("~",$_systemId);
        $visitorid = $parts[0];
        $result = DBManager::Execute(true, $dx = "SELECT * FROM `" . DB_PREFIX . DATABASE_VISITORS . "` AS `tv` INNER JOIN `" . DB_PREFIX . DATABASE_USER_DATA . "` AS `td` ON `tv`.`data_id`=`td`.`id` WHERE `tv`.`id`='" . DBManager::RealEscape($visitorid) . "' LIMIT 1;");

        if($result)
            if($row = DBManager::FetchArray($result))
                $d->SetDetails($row);
        return $d;
    }
}

class Cookie
{
    static function GetCookiePrefix()
    {
        $prefix = "lz";

        if(isset($_GET["cpr"]) && strlen($_GET["cpr"]) == 5)
            $prefix .= "_" . $_GET["cpr"];

        return $prefix . "_";
    }

    static function Set($_key,$_value,$_onlyWhenEmpty=false)
    {
        $mustSet = ($_key == "no_cookie" || $_key == "no_tracking");

        if(!$mustSet && Configuration::DoNotTrack())
            return;

        if(!$mustSet && !Is::Null(Cookie::Get("no_cookie")) || !Is::Null(Cookie::Get("no_tracking")))
            return;

        if(!$mustSet && !empty(Server::$Configuration->File["gl_cooi"]) && Is::Null(Cookie::Get("userid")) && !isset($_GET["oica"]))
            return;

        if($mustSet || (!empty(Server::$Configuration->File["gl_colt"]) && !empty($_value)))
        {
            $current = Cookie::Get($_key);

            if($_onlyWhenEmpty && $current != null)
                return;
            if($current == $_value)
                return;

            $lifetime = ((empty(Server::$Configuration->File["gl_colt"])) ? 0 : (time()+(Server::$Configuration->File["gl_colt"]*86400)));

            setcookie(self::GetCookiePrefix() . $_key,($_COOKIE[self::GetCookiePrefix() . $_key] = base64_encode($_value)),$lifetime,null,null,null,true);
        }
    }

    static function Get($_key,$_filter=false,$_maxlen=0)
    {
        if(($_key != "no_cookie" && $_key != "no_tracking") && !Is::Null(Cookie::Get("no_cookie")))
            return null;

        if(empty(Server::$Configuration->File["gl_colt"]))
            return null;

        if(empty($_COOKIE[self::GetCookiePrefix() . $_key]))
            return null;

        if($_filter)
            return IOStruct::FilterParameter(base64_decode($_COOKIE[self::GetCookiePrefix() . $_key]),"",FILTER_SANITIZE_STRING,null,$_maxlen);

        $cd = base64_decode($_COOKIE[self::GetCookiePrefix() . $_key]);
        return $cd;
    }

    static function Remove($_key)
    {
        setcookie(self::GetCookiePrefix() . $_key, "", time() - 3600);
    }

    static function RemoveAll()
    {
        $ckeys = array("lz_geo_city","lz_geo_ctryiso","lz_geo_data","lz_geo_isp","lz_geo_lat","lz_geo_long","lz_geo_region","lz_geo_tz","lz_last_visit","lz_userid","lz_visits");
        foreach($ckeys as $key)
            setcookie($key, "", time()-3600);
    }
}

class LocalizationManager
{
    public static $TranslationStrings;
    public static $Direction;

    static function GetLocalizationFileString($_language, $_mobile = false, $_writeModified = false)
    {
        if(strpos($_language,"..") === false && strlen($_language) <= 5)
        {
            $inner = (!$_mobile) ? "server" : "client";
            $file = PATH_LOCALIZATION . strtolower($_language) .".". $inner . ($_writeModified ? ".my" : "") . ".php";
            return $file;
        }
        return "";
    }

    static function Detect()
    {
        if(defined("CALLER_TYPE") && CALLER_TYPE == CALLER_TYPE_INTERNAL && defined("CALLER_SYSTEM_ID"))
        {
            $langs = strtolower(Server::$Operators[CALLER_SYSTEM_ID]->Languages);
            if(strpos($langs,",") !== false)
                $langs = explode(",",$langs)[0];
            return $langs;
        }
        else
        {
            $_isoTwoletterCode = LocalizationManager::GetBrowserLocalization();
            return strtolower($_isoTwoletterCode[0]);
        }
    }

    static function AutoLoad($_isoTwoletterCode="",$_require=false)
    {
        if(DBManager::$Connected)
        {
            Server::InitDataBlock(array("LANGUAGES"));
            if(!$_require && !empty(Visitor::$BrowserLanguage))
                return;

            $isoToRequire = "en";
            if(empty($_isoTwoletterCode))
            {
                $_isoTwoletterCode = LocalizationManager::Detect();
            }

            /*
            if(!empty(Server::$Configuration->File["gl_on_def_lang"]) && file_exists($tfile=LocalizationManager::GetLocalizationFileString(Server::$Configuration->File["gl_default_language"])) && @filesize($tfile)>0)
            {
                Visitor::$BrowserLanguage = Server::$Configuration->File["gl_default_language"];
                $isoToRequire = Server::$Configuration->File["gl_default_language"];
            }
            else*/if(empty($_isoTwoletterCode) || (!empty($_isoTwoletterCode) && strpos($_isoTwoletterCode,"..") === false))
            {
                // det list
                if(!empty($_isoTwoletterCode) && strlen($_isoTwoletterCode) >= 5 && substr($_isoTwoletterCode,2,1) == "-" && file_exists($tfile=LocalizationManager::GetLocalizationFileString(substr($_isoTwoletterCode, 0, 5),false,true)) && @filesize($tfile)>0)
                    $isoToRequire = $s_browser_language = strtolower(substr($_isoTwoletterCode,0,5));
                else if(!empty($_isoTwoletterCode) && strlen($_isoTwoletterCode) >= 5 && substr($_isoTwoletterCode,2,1) == "-" && file_exists($tfile=LocalizationManager::GetLocalizationFileString(substr($_isoTwoletterCode, 0, 5),false,false)) && @filesize($tfile)>0)
                    $isoToRequire = $s_browser_language = strtolower(substr($_isoTwoletterCode,0,5));

                // det single
                else if(!empty($_isoTwoletterCode) && strlen($_isoTwoletterCode) > 1 && file_exists($tfile=LocalizationManager::GetLocalizationFileString(substr($_isoTwoletterCode, 0, 2),false,true)) && @filesize($tfile)>0)
                    $isoToRequire = $s_browser_language = strtolower(substr($_isoTwoletterCode,0,2));
                else if(!empty($_isoTwoletterCode) && strlen($_isoTwoletterCode) > 1 && file_exists($tfile=LocalizationManager::GetLocalizationFileString(substr($_isoTwoletterCode, 0, 2),false,false)) && @filesize($tfile)>0)
                    $isoToRequire = $s_browser_language = strtolower(substr($_isoTwoletterCode,0,2));

                // def
                else if(file_exists($tfile=LocalizationManager::GetLocalizationFileString(Server::$Configuration->File["gl_default_language"],false,true)) && @filesize($tfile)>0)
                    $isoToRequire = $s_browser_language = Server::$Configuration->File["gl_default_language"];
                else if(file_exists($tfile=LocalizationManager::GetLocalizationFileString(Server::$Configuration->File["gl_default_language"],false,false)) && @filesize($tfile)>0)
                    $isoToRequire = $s_browser_language = Server::$Configuration->File["gl_default_language"];

                if(isset($s_browser_language))
                    Visitor::$BrowserLanguage = $s_browser_language;
            }
            else if(file_exists(LocalizationManager::GetLocalizationFileString(Server::$Configuration->File["gl_default_language"])))
                $isoToRequire = Server::$Configuration->File["gl_default_language"];

            if(empty(Visitor::$BrowserLanguage) && file_exists(LocalizationManager::GetLocalizationFileString("en")))
                Visitor::$BrowserLanguage = "en";

            LocalizationManager::$Direction = ((Server::$Languages[strtoupper(Visitor::$BrowserLanguage)][2]) ? "rtl":"ltr");

            if($_require)
                DataInput::Build();
        }
        else
        {
            // installation wizard
            $bl = substr(@$_SERVER['HTTP_ACCEPT_LANGUAGE'], 0, 2);
            if(strtolower($bl)=="de")
                Visitor::$BrowserLanguage = $isoToRequire = "de";
            else
                Visitor::$BrowserLanguage = $isoToRequire = "en";
        }

        if(!empty($isoToRequire))
        {
            if($isoToRequire != "en")
            {
                LocalizationManager::LoadFromFile("en");
            }
            LocalizationManager::LoadFromFile($isoToRequire);
        }
    }

    static function LoadFromFile($_isoTwoletterCode)
    {
        global $LZLANG;
        IOStruct::RequireTranslation(LocalizationManager::GetLocalizationFileString($_isoTwoletterCode));
        LocalizationManager::$TranslationStrings = $LZLANG;
    }

    static function GetBrowserLocalization($country = "",$base="en")
    {
        Server::InitDataBlock(array("LANGUAGES","COUNTRIES"));

        //if(!empty(Server::$Configuration->File["gl_on_def_lang"]))
          //  $base = Server::$Configuration->File["gl_default_language"];
        //else if(isset(Server::$Configuration->File["gl_dsbl"]) && !Server::$Configuration->File["gl_dsbl"])
          //  $base = Server::$Configuration->File["gl_default_language"];
        /*else*/if(!empty($_SERVER["HTTP_ACCEPT_LANGUAGE"]))
            $base = @$_SERVER["HTTP_ACCEPT_LANGUAGE"];

        $ptlang = LocalizationManager::ReadParams();

        $language = str_replace(array(",","_"," ",")","("),array(";","-","","",""),((!empty($ptlang)) ? strtoupper(($ptlang)) : ((!empty($base)) ? strtoupper($base) : "")));

        if(strlen($language) > 5 || strpos($language,";") !== false)
        {
            $parts = explode(";",$language);
            if(count($parts) > 0)
                $language = $parts[0];
            else
                $language = substr($language,0,5);
        }

        if(strlen($language) >= 2)
        {
            $parts = explode("-",$language);
            if(!isset(Server::$Languages[$language]))
            {
                $language = $parts[0];
                if(!isset(Server::$Languages[$language]))
                    $language = "";
            }
            if(count($parts)>1 && isset(Server::$Countries[$parts[1]]))
                $country = $parts[1];
        }
        else if(strlen($language) < 2)
            $language = "";

        return array($language,$country);
    }

    static function ImplodeLanguages($_lang)
    {
        if(strlen($_lang) == 0)
            return "";
        $array_lang = explode(",",$_lang);
        foreach($array_lang as $key => $lang)
            if($key == 0)
            {
                $_lang = strtoupper(substr(trim($lang),0,2));
                break;
            }
        return (strlen($_lang) > 0) ? $_lang : "";
    }

    static function Replace($_html)
    {
        $_html = str_replace("%iso_lang%",LocalizationManager::Detect(),$_html);
        return $_html;
    }

    static function ReadParams()
    {
        if(!empty($_GET["ptl"]))
            return Communication::GetParameter("ptl","",$c,FILTER_SANITIZE_SPECIAL_CHARS,null,5,false,false);

        // deprecated, compatibility
        if(!empty($_GET["el"]))
            return Communication::GetParameter("el","",$c,FILTER_SANITIZE_SPECIAL_CHARS,null,5);

        return "";
    }

    static function ReaderHeaderParam()
    {
        if(!empty($_GET["pth"]))
            return Communication::GetParameter("pth","",$c,FILTER_SANITIZE_URL,null,1024,false,false);

        // deprecated, compatibility
        if(!empty($_GET["eh"]))
            return Communication::GetParameter("eh","",$c,FILTER_SANITIZE_SPECIAL_CHARS);

        // fallback always from config
        return Server::$Configuration->File["gl_cali"];
    }

    static function ReaderAreaCodeParam()
    {
        if(!empty($_GET["ptw"]))
            return Communication::GetParameter("ptw","",$c,null,null,255,false,false);

        // deprecated, compatibility
        if(!empty($_GET["code"]))
            return Communication::GetParameter("code","",$c,FILTER_SANITIZE_SPECIAL_CHARS,null,255);

        return "";
    }

}

class GeoTracking
{
    static function SpanRemove($_all)
    {
        if($_all || (GeoTracking::SpanGet() < time()))
            GeoTracking::SpanSet(0);
    }

    static function SpanExists()
    {
        return !Is::Null(GeoTracking::SpanGet());
    }

    static function SpanGet()
    {
        if(!DBManager::$Connected)
            return time();
        if(isset(Server::$Configuration->File["gl_db_gtspan"]))
            return Server::$Configuration->File["gl_db_gtspan"];
        else
            return 0;
    }

    static function SpanSet($_value)
    {
        if(DBManager::$Connected && @Server::$Configuration->File["gl_db_gtspan"]!=$_value)
            DBManager::Execute(true, "REPLACE INTO `" . DB_PREFIX . DATABASE_CONFIG . "` (`key`, `value`) VALUES ('gl_db_gtspan','" . intval(Server::$Configuration->File["gl_db_gtspan"] = $_value) . "');");
    }

    static function SpanCreate($_sspan)
    {
        if($_sspan <= CONNECTION_ERROR_SPAN)
            GeoTracking::SpanSet((time()+$_sspan));
        else
            GeoTracking::SpanSet((time()+600));
    }

    static function Replace($_toReplace, $jsa = "")
    {
        if(isset(Server::$Configuration->File["gl_use_ngl"]) && !empty(Server::$Configuration->File["gl_use_ngl"]))
        {
            $url = LIVEZILLA_URL . "geo.php";
            $_toReplace = str_replace("<!--geo_url-->",base64_encode($url."?a=1"),$_toReplace);
        }
        else
            $_toReplace = str_replace("<!--geo_url-->","",$_toReplace);

        $_toReplace = str_replace("<!--calcoak-->",$jsa,$_toReplace);
        $_toReplace = str_replace("<!--mip-->",Communication::GetIP(false,true),$_toReplace);
        return $_toReplace;
    }
}

class Is
{
    static function Defined($_definition)
    {
        if(defined($_definition))
            return constant($_definition);
        else
            return false;
    }

    static function Int($_int)
    {
        return (preg_match( '/^\d*$/'  , $_int) == 1);
    }

    static function Null($_var)
    {
        return empty($_var);
    }

    static function WildcardMatch($_template,$_comparer,$_ignoreStartAndEnd=false)
    {
        if($_template=="*")
            return true;

        if(!$_ignoreStartAndEnd)
        {
            $spacer = md5(rand());
            $_template = str_replace("?",$spacer,strtolower($_template));
            $_comparer = str_replace("?",$spacer,strtolower($_comparer));
        }
        else
            $spacer = "";

        $_template = str_replace("*","(.*)",$_template);
        return (preg_match("(".$spacer.$_template.$spacer.")",$spacer.$_comparer.$spacer)>0);
    }

    static function ImageFilename($_filename)
    {
        $_filename = strtolower($_filename);
        return Str::EndsWith($_filename,".gif") || Str::EndsWith($_filename,".jpeg") || Str::EndsWith($_filename,".jpg") || Str::EndsWith($_filename,".bmp") || Str::EndsWith($_filename,".png");
    }
}

class To
{
    static function BoolString($_value,$_toString=true)
    {
        if($_toString)
            return ($_value) ? "true" : "false";
        else
            return ($_value) ? "1" : "0";
    }

    static function XMLTag($_name,$_content,$_attrArray)
    {
        $xml = "<".$_name;
        foreach($_attrArray as $attr => $val)
        {
            $xml .= " " . $attr . "=\"" . base64_encode($val)."\"";
        }
        return $xml . ">" . $_content . "</".$_name.">";

    }

    static function XMLTags($_list)
    {
        $xml ="";
        foreach($_list as $obj)
            $xml .= $obj->GetXML();
        return $xml;
    }

    static function MIMEType($_filename)
    {
        $idx = explode(".", strtolower($_filename));
        $count_explode = count($idx);
        $idx = strtolower($idx[$count_explode-1]);
        $mimet = array(
            'txt' => 'text/plain',
            'htm' => 'text/html',
            'html' => 'text/html',
            'php' => 'text/html',
            'css' => 'text/css',
            'js' => 'application/javascript',
            'json' => 'application/json',
            'xml' => 'application/xml',
            'swf' => 'application/x-shockwave-flash',
            'flv' => 'video/x-flv',
            'png' => 'image/png',
            'jpe' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'jpg' => 'image/jpeg',
            'gif' => 'image/gif',
            'bmp' => 'image/bmp',
            'ico' => 'image/vnd.microsoft.icon',
            'tiff' => 'image/tiff',
            'tif' => 'image/tiff',
            'svg' => 'image/svg+xml',
            'svgz' => 'image/svg+xml',
            'zip' => 'application/zip',
            'rar' => 'application/x-rar-compressed',
            'exe' => 'application/x-msdownload',
            'msi' => 'application/x-msdownload',
            'cab' => 'application/vnd.ms-cab-compressed',
            'mp3' => 'audio/mpeg',
            'qt' => 'video/quicktime',
            'mov' => 'video/quicktime',
            'pdf' => 'application/pdf',
            'psd' => 'image/vnd.adobe.photoshop',
            'ai' => 'application/postscript',
            'eps' => 'application/postscript',
            'ps' => 'application/postscript',
            'doc' => 'application/msword',
            'rtf' => 'application/rtf',
            'xls' => 'application/vnd.ms-excel',
            'ppt' => 'application/vnd.ms-powerpoint',
            'docx' => 'application/msword',
            'xlsx' => 'application/vnd.ms-excel',
            'pptx' => 'application/vnd.ms-powerpoint',
            'odt' => 'application/vnd.oasis.opendocument.text',
            'ods' => 'application/vnd.oasis.opendocument.spreadsheet',
        );

        if(isset($mimet[$idx]))
            return $mimet[$idx];
        else
            return 'application/octet-stream';
    }
}

class Str
{
    static function Cut($_value ,$_maxlength, $_addDots=false)
    {
        if(function_exists("mb_strlen"))
        {
            if(mb_strlen($_value,'utf-8')>$_maxlength)
            {
                if($_addDots)
                    return mb_substr($_value,0,$_maxlength-3,'utf-8')."...";
                else
                    return mb_substr($_value,0,$_maxlength,'utf-8');
            }
        }
        else
        {
            if(strlen($_value)>$_maxlength)
            {
                if($_addDots)
                    return substr($_value,0,$_maxlength-3)."...";
                else
                    return substr($_value,0,$_maxlength);
            }
        }
        return $_value;
    }

    static function EndsWith($haystack, $needle)
    {
        $length = strlen($needle);
        if ($length == 0) {
            return true;
        }
        return (substr($haystack, -$length) === $needle);
    }

    static function ToEnglishStyle($_str,$_encoding="UTF-8")
    {
        if(function_exists("mb_convert_case"))
            return mb_convert_case($_str, MB_CASE_TITLE, $_encoding);
        else
            return utf8_encode(ucwords(strtolower(utf8_decode($_str))));
    }

    static function ToLower($_str,$_encoding="UTF-8")
    {
        if(function_exists("mb_strtolower"))
            return mb_strtolower($_str, $_encoding);
        else
            return utf8_encode(strtolower(utf8_decode($_str)));
    }

    static function EscapePushMessage($_post)
    {
        if(strpos($_post,'[__[') !== false && strpos($_post,']__]') !== false)
        {
            $parts = explode('[__[',str_replace(']__]','',$_post));
            $_post = $parts[0];

            if(strpos($parts[1],'invite_info:')===0)
            {
                return null;
            }
            else if(strpos($parts[1],'auto_forward:')===0)
            {
                return null;
            }
        }
        return $_post;
    }

    static function Append($_string,$_append,$_separator=",")
    {
        if(!empty($_string))
            $_string .= $_separator . $_append;
        else
            $_string = $_append;
        return $_string;
    }

    static function DataURLToBinary($_str)
    {
        $_str = substr($_str,strpos($_str,",")+1);
        $_str = str_replace(' ','+',$_str);
        $_str = base64_decode($_str);
        return $_str;
    }
}

class Num
{
    static function Divide($_numerator,$_denominator,$_round=false,$_floor=false)
    {
        if(empty($_denominator) || $_denominator == 0)
            return 0;
        else if($_round)
            return round($_numerator/$_denominator,$_round);
        else if($_floor)
            return floor($_numerator/$_denominator);
        else
            return $_numerator/$_denominator;
    }
}
?>