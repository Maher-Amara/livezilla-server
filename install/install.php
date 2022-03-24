<?php
/****************************************************************************************
* LiveZilla install.php
* 
* Copyright 2018 LiveZilla GmbH
* All rights reserved.
* LiveZilla is a registered trademark.
* 
* Improper changes to this file may cause critical errors.
***************************************************************************************/

if(isset($_GET["data"]))
{
    define("IN_LIVEZILLA",true);
    define("LIVEZILLA_PATH","../");
    require_once(LIVEZILLA_PATH . "_definitions/definitions.inc.php");
    require_once(LIVEZILLA_PATH . "_definitions/definitions.protocol.inc.php");
    require_once(LIVEZILLA_PATH . "_lib/functions.global.inc.php");
    require_once(LIVEZILLA_PATH . "_definitions/definitions.dynamic.inc.php");
    require_once(LIVEZILLA_PATH . "_lib/functions.internal.man.inc.php");
    header('Content-Description: File Transfer');
    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename=config.php');
    exit(Encoding::Base64UrlDecode($_GET["data"]));
}
else if(!defined("LIVEZILLA_PATH"))
{
    header('Location: ../index.php');
    exit();
}
else
{
    require_once(LIVEZILLA_PATH . "_definitions/definitions.inc.php");
    require_once(LIVEZILLA_PATH . "_definitions/definitions.protocol.inc.php");
    require_once(LIVEZILLA_PATH . "_lib/functions.global.inc.php");
    require_once(LIVEZILLA_PATH . "_definitions/definitions.dynamic.inc.php");
    require_once(LIVEZILLA_PATH . "_lib/functions.internal.man.inc.php");
}

class Installer
{
    static function UpdateDatabase()
    {
        $updReq = false;
        $__u__dbv=null;
        $res = ServerManager::ValidateDatabase(true,$updReq,$__u__dbv);
        if(empty($res))
        {
            $dl = isset($_POST["p_db_cf_dl"]);
            $writeConfig = false;
            $vals = Installer::ImportConfigFile($writeConfig);

            $_POST[POST_INTERN_DATABASE_HOST] = $vals[0];
            $_POST[POST_INTERN_DATABASE_USER] = $vals[1];
            $_POST[POST_INTERN_DATABASE_PASS] = $vals[2];
            $_POST[POST_INTERN_DATABASE_NAME] = $vals[3];
            $_POST[POST_INTERN_DATABASE_PREFIX] = $vals[4];
            $_POST["p_db_ext"] = $vals[5];
            $_POST["p_db_eng"] = $vals[6];
            $_POST["p_lzid"] = $vals[7];

            if($writeConfig)
                Installer::CreateConfigFile($dl);

            if(file_exists(FILE_CONFIG))
            {
                require(FILE_CONFIG);
            }

            if($dl)
                return;

            if(file_exists(FILE_CONFIG) && isset($_CONFIG["b64"]) && !$_CONFIG["b64"])
            {
                Server::$Response->SetStandardResponse(1,base64_encode(""));
                CacheManager::Flush();
            }
            else
                Server::$Response->SetStandardResponse(4,base64_encode(""));

        }
        else
            Server::$Response->SetStandardResponse(2,base64_encode($res));
    }

    static function InitUpdateDatabase($_version,$_connection,$_prefix,$engine)
    {
        require_once("./_lib/functions.data.db.update.inc.php");

        $settings = array("p_gl_use_ngl","p_gl_miat","p_gl_maskip","p_gl_dnt","p_gl_dnt","p_gl_colt");
        foreach($settings as $setting)
        {
            if(isset($_POST[$setting]))
                Server::SetConfigValue(substr($setting,2,strlen($setting)-2),$_POST[$setting]);
        }


        $upres = updateDatabase($_version,$_connection,$_prefix,$engine);
        return $upres;
    }

    static function ImportConfigFile(&$_rewriteRequired=true)
    {
        $_host=$_user=$_pass=$_dbname=$_prefix=$_extension=$_engine=$_lzid="";
        $_rewriteRequired = true;

        // < 6.2.x
        if(file_exists(FILE_INSTALLER) && !file_exists(FILE_CONFIG) && file_exists(FILE_CONFIG_OLD))
        {
            global $_CONFIG,$CONFIG;
            require(FILE_CONFIG_OLD);
            if(isset($_CONFIG[0]["gl_db_host"]))
            {
                // 4.x,5.x
                $_host = base64_decode($_CONFIG[0]["gl_db_host"]);
                $_user = base64_decode($_CONFIG[0]["gl_db_user"]);
                $_pass = base64_decode($_CONFIG[0]["gl_db_pass"]);
                $_dbname = base64_decode($_CONFIG[0]["gl_db_name"]);
                $_prefix = base64_decode($_CONFIG[0]["gl_db_prefix"]);
                $_extension = "mysqli";
                $_engine = isset($_CONFIG[0]["gl_db_eng"]) ? base64_decode($_CONFIG[0]["gl_db_eng"]) : "MyISAM";
                $_lzid = base64_decode($_CONFIG["gl_lzid"]);
            }
            else if(isset($CONFIG["gl_db_host"]))
            {
                // 3.x
                $_host = base64_decode($CONFIG["gl_db_host"]);
                $_user = base64_decode($CONFIG["gl_db_user"]);
                $_pass = base64_decode($CONFIG["gl_db_pass"]);
                $_dbname = base64_decode($CONFIG["gl_db_name"]);
                $_prefix = base64_decode($CONFIG["gl_db_prefix"]);
                $_extension = "mysqli";
                $_engine = "MyISAM";
                $_lzid = base64_decode($CONFIG["gl_lzid"]);
            }
        }
        // == 6.2.x
        if(file_exists(FILE_INSTALLER) && file_exists(FILE_CONFIG) && !isset($_CONFIG["b64"]))
        {
            global $_CONFIG;
            require(FILE_CONFIG);
            $_host = base64_decode($_CONFIG[0]["gl_db_host"]);
            $_user = base64_decode($_CONFIG[0]["gl_db_user"]);
            $_pass = base64_decode($_CONFIG[0]["gl_db_pass"]);
            $_dbname = base64_decode($_CONFIG[0]["gl_db_name"]);
            $_prefix = base64_decode($_CONFIG[0]["gl_db_prefix"]);
            $_extension = "mysqli";
            $_engine = isset($_CONFIG[0]["gl_db_eng"]) ? base64_decode($_CONFIG[0]["gl_db_eng"]) : "MyISAM";
            $_lzid = base64_decode($_CONFIG["gl_lzid"]);

        }
        // >= 7.x
        if(file_exists(FILE_INSTALLER) && file_exists(FILE_CONFIG) && isset($_CONFIG["b64"]) && !$_CONFIG["b64"])
        {
            global $_CONFIG;
            require(FILE_CONFIG);
            $_host = $_CONFIG[0]["gl_db_host"];
            $_user = $_CONFIG[0]["gl_db_user"];
            $_pass = $_CONFIG[0]["gl_db_pass"];
            $_dbname = $_CONFIG[0]["gl_db_name"];
            $_prefix = $_CONFIG[0]["gl_db_prefix"];
            $_extension = "mysqli";
            $_engine = isset($_CONFIG[0]["gl_db_eng"]) ? $_CONFIG[0]["gl_db_eng"] : "MyISAM";
            $_lzid = $_CONFIG["gl_lzid"];
            $_rewriteRequired = false;
        }
        return array($_host,$_user,$_pass,$_dbname,$_prefix,$_extension,$_engine,$_lzid);
    }

    static function CreateConfigFile($_download)
    {
        if(file_exists(FILE_INSTALLER))
        {
            $phpc = IOStruct::GetFile(TEMPLATE_PHP_CONFIG);
            $phpc = str_replace("<!--db_host-->",($_POST[POST_INTERN_DATABASE_HOST]),$phpc);
            $phpc = str_replace("<!--db_user-->",($_POST[POST_INTERN_DATABASE_USER]),$phpc);
            $phpc = str_replace("<!--db_pass-->",($_POST[POST_INTERN_DATABASE_PASS]),$phpc);
            $phpc = str_replace("<!--db_name-->",($_POST[POST_INTERN_DATABASE_NAME]),$phpc);
            $phpc = str_replace("<!--db_prefix-->",($_POST[POST_INTERN_DATABASE_PREFIX]),$phpc);
            $phpc = str_replace("<!--db_ext-->",($_POST["p_db_ext"]),$phpc);
            $phpc = str_replace("<!--db_eng-->",($_POST["p_db_eng"]),$phpc);
            $phpc = str_replace("<!--pr_cr-->",(time()),$phpc);
            $phpc = str_replace("<!--lzid-->",($_POST["p_lzid"]),$phpc);

            if($_download)
            {
                Server::$Response->SetStandardResponse(5,base64_encode(Encoding::Base64UrlEncode($phpc)));
                return false;
            }
            else
            {
                if(!file_exists(LIVEZILLA_PATH . "_config/"))
                    @mkdir(LIVEZILLA_PATH . "_config/");

                if(!empty($_POST[POST_INTERN_DATABASE_HOST]))
                    IOStruct::CreateFile(FILE_CONFIG, $phpc, true);

                if(!file_exists(FILE_CONFIG))
                    Server::$Response->SetStandardResponse(4,base64_encode("Can't create config file (" . FILE_CONFIG . "), please check file permissions."));
                else
                {
                    Server::$Response->SetStandardResponse(1,base64_encode(""));
                    return true;
                }
            }
        }
        return false;
    }

    static function CreateDatabaseTables($id=0)
    {
        if(!file_exists(FILE_CONFIG) && file_exists(FILE_INSTALLER) && !DBManager::$Connected)
        {
            $connection = new DBManager($_POST[POST_INTERN_DATABASE_USER], $_POST[POST_INTERN_DATABASE_PASS], $_POST[POST_INTERN_DATABASE_HOST], "", $_POST[POST_INTERN_DATABASE_PREFIX]);
            $engine = (!empty($_POST["p_db_eng"]) && $_POST["p_db_eng"] == "InnoDB") ? "InnoDB" : "MyISAM";

            if(!function_exists("mysqli_connect"))
            {
                Server::$Response->SetStandardResponse($id,base64_encode("PHP MySQLi extension is missing (php_mysqli.dll)"));
                return false;
            }

            $connection->InitConnection();

            if(!DBManager::$Provider)
            {
                $error = DBManager::GetError();
                Server::$Response->SetStandardResponse($id,base64_encode("Can't connect to database. Invalid host or login! (" . DBManager::GetErrorCode() . ((!empty($error)) ? ": " . $error : "") . ")"));
                return false;
            }
            else
            {
                $connection->Query(false,"SET character_set_results = 'utf8mb4', character_set_client = 'utf8mb4', character_set_connection = 'utf8mb4', character_set_database = 'utf8mb4', character_set_server = 'utf8mb4'");
                $db_selected = $connection->SelectDatabase(DBManager::RealEscape($_POST[POST_INTERN_DATABASE_NAME]));
                if(!$db_selected)
                {
                    if(!empty($_POST[POST_INTERN_DATABASE_CREATE]))
                    {
                        $resultcr = $connection->Query(false,"CREATE DATABASE `".DBManager::RealEscape($_POST[POST_INTERN_DATABASE_NAME])."` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
                        if(!$resultcr)
                        {
                            Server::$Response->SetStandardResponse($id,base64_encode(DBManager::GetErrorCode() . ": " . DBManager::GetError()));
                            return false;
                        }
                        else
                        {
                            unset($_POST[POST_INTERN_DATABASE_CREATE]);
                            return Installer::CreateDatabaseTables();
                        }
                    }
                    else
                    {
                        Server::$Response->SetStandardResponse(2,base64_encode(DBManager::GetErrorCode() . ": " . DBManager::GetError()));
                        return false;
                    }
                }
                else
                {
                    $resultvc = $connection->Query(false,"SELECT `version`,`chat_id`,`ticket_id` FROM `".DBManager::RealEscape($_POST[POST_INTERN_DATABASE_PREFIX]).DATABASE_INFO."` ORDER BY `version` DESC LIMIT 1");
                    if($rowvc = @DBManager::FetchArray($resultvc))
                    {
                        if(VERSION != $rowvc["version"] && !empty($rowvc["version"]))
                        {
                            $upres = Installer::InitUpdateDatabase($rowvc["version"],$connection,$_POST[POST_INTERN_DATABASE_PREFIX],$engine);
                            if($upres === true)
                            {
                                Server::$Response->SetStandardResponse(1,base64_encode(""));
                                return true;
                            }
                        }
                    }

                    $dump = IOStruct::GetFile(LIVEZILLA_PATH . "_definitions/dump.lsql");
                    $dump .= IOStruct::GetFile(LIVEZILLA_PATH . "_definitions/config.lsql");
                    $dump = str_replace("<!--engine-->",DBManager::RealEscape($engine),$dump);
                    $dump = str_replace("<!--version-->",DBManager::RealEscape(VERSION),$dump);
                    $dump = str_replace("<!--prefix-->",DBManager::RealEscape($_POST[POST_INTERN_DATABASE_PREFIX]),$dump);
                    $dump = str_replace("<!--lz_path-->",DBManager::RealEscape($_POST["p_lz_path"]),$dump);
                    $dump = str_replace("<!--lz_host-->",DBManager::RealEscape($_POST["p_lz_host"]),$dump);
                    $dump = str_replace("<!--lz_lzid-->",DBManager::RealEscape($_POST["p_lzid"]),$dump);
                    $dump = str_replace("<!--gl_colt-->",DBManager::RealEscape($_POST["p_gl_colt"]),$dump);
                    $dump = str_replace("<!--gl_dnt-->",DBManager::RealEscape($_POST["p_gl_dnt"]),$dump);
                    $dump = str_replace("<!--gl_use_ngl-->",DBManager::RealEscape($_POST["p_gl_use_ngl"]),$dump);
                    $dump = str_replace("<!--gl_maskip-->",DBManager::RealEscape($_POST["p_gl_maskip"]),$dump);
                    $dump = str_replace("<!--gl_miat-->",DBManager::RealEscape($_POST["p_gl_miat"]),$dump);
                    $dump = str_replace("<!--gl_licl_0-->",DBManager::RealEscape(base64_encode(serialize(array(base64_encode($_POST["p_gl_licl"]),base64_encode("TRIAL"))))),$dump);
                    $dump = str_replace("<!--gl_pr_ngl-->",DBManager::RealEscape($_POST["p_gl_pr_ngl"]),$dump);
                    $dump = str_replace("<!--gl_crc3-->",DBManager::RealEscape($_POST["p_gl_crc3"]),$dump);
                    $commands = explode("###",$dump);

                    foreach($commands as $sql)
                    {
                        if(empty($sql))
                            continue;

                        $result = $connection->Query(false,trim($sql));
                        if(!$result && DBManager::GetErrorCode() != 1050 && DBManager::GetErrorCode() != 1005 && DBManager::GetErrorCode() != 1062)
                        {
                            Server::$Response->SetStandardResponse($id,base64_encode(DBManager::GetErrorCode() . ": " . DBManager::GetError() . "\r\n\r\nSQL: " . $sql));
                            return false;
                        }
                    }

                    DBManager::$Connector = $connection;
                    DBManager::$Connected = true;

                    if(!defined("DB_PREFIX"))
                        define("DB_PREFIX",$_POST[POST_INTERN_DATABASE_PREFIX]);

                    if(!defined("CALLER_SYSTEM_ID"))
                        define("CALLER_SYSTEM_ID",$_POST["p_operators_0_system_id"]);

                    ServerManager::ImportButtons(PATH_IMAGES . "buttons/",$_POST[POST_INTERN_DATABASE_PREFIX],$connection);

                    Server::$Response->SetStandardResponse(1,base64_encode(""));
                    return true;
                }
            }
        }
        else if(!file_exists(FILE_INSTALLER) && !file_exists(FILE_CONFIG))
        {
            Server::$Response->SetStandardResponse($id,base64_encode("Can't read/find ".FILE_INSTALLER." file. (trace:5216)"));
            return false;
        }
        else if(file_exists(FILE_INSTALLER) && file_exists(FILE_CONFIG))
        {
            Server::$Response->SetStandardResponse(1,base64_encode(""));
            return true;
        }
        else if(!file_exists(FILE_INSTALLER) && file_exists(FILE_CONFIG))
        {
            Server::$Response->SetStandardResponse($id,base64_encode("Can't read/find ".FILE_INSTALLER." file. (trace:5217)."));
            return false;
        }

        Server::$Response->SetStandardResponse($id,base64_encode("Unknown error (trace:5218)."));
        return false;
    }

    static function CreateDatabase()
    {
        if(Installer::CreateDatabaseTables())
        {
            define("VALIDATED",true);
            define("VALIDATED_FULL_LOGIN",true);
            if(ServerManager::UpdateUserManagement($_POST[POST_INTERN_DATABASE_PREFIX]))
                Installer::CreateConfigFile(isset($_POST["p_db_cf_dl"]));
        }
    }
}
?>