<?php

/****************************************************************************************
 * LiveZilla objects.ldap.inc.php
 *
 * Copyright 2015 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 * Improper changes to this file may cause critical errors.
 ***************************************************************************************/

if(!defined("IN_LIVEZILLA"))
    die();

class LDAPManager
{
    static function ValidateUser($_uid,$_password)
    {
        $ldap_con = null;
        if(LDAPManager::Bind(Server::$Configuration->File["gl_ldho"],Server::$Configuration->File["gl_ldpo"],Server::$Configuration->File["gl_lddn"],Server::$Configuration->File["gl_ldbp"],$ldap_con))
        {
            $attributes = array("uid","samaccountname");
            if(!($result = ldap_search($ldap_con,Server::$Configuration->File["gl_ldsd"],"(|(uid=".$_uid.")(samaccountname=".$_uid."))",$attributes)))
            {
                Logging::LDAPLog($result = ldap_error($ldap_con));
            }
            else
            {
                $data = ldap_get_entries($ldap_con, $result);
                foreach($data as $user)
                {
                    if((isset($user["uid"]) && isset($user["uid"][0]) && $user["uid"][0] == $_uid) || (isset($user["samaccountname"]) && isset($user["samaccountname"][0]) && $user["samaccountname"][0] == $_uid))
                    {
                        ldap_unbind($ldap_con);
                        $ldap_val_con = null;
                        if(LDAPManager::Bind(Server::$Configuration->File["gl_ldho"],Server::$Configuration->File["gl_ldpo"],$user["dn"],$_password,$ldap_val_con))
                        {
                            ldap_unbind($ldap_val_con);
                            return true;
                        }
                    }
                }
            }
        }
        else
            Logging::LDAPLog($result = ldap_error($ldap_con));
        return false;
    }

    static function Bind($_host,$_port,$_rdn,$_password,&$_connection,$_test=false)
    {
        if($ldapconn = ldap_connect($_host, $_port))
        {
            ldap_set_option($ldapconn, LDAP_OPT_PROTOCOL_VERSION, 3);
            ldap_set_option($ldapconn, LDAP_OPT_REFERRALS, 0);
            if (ldap_bind($ldapconn, $_rdn, $_password) === true)
            {
                $_connection = $ldapconn;
                return true;
            }
            else if($_test)
                return ldap_error($ldapconn);
        }
        else if($_test)
            return ldap_error($ldapconn);

        Logging::LDAPLog(ldap_error($ldapconn));
        return false;
    }

    static function TestBinding()
    {
        if(OperatorRequest::IsValidated() && Server::$Operators[CALLER_SYSTEM_ID]->GetPermission(PERMISSION_SERVER_CONFIGURATION))
        {
            if(!function_exists("ldap_connect"))
                $result = "LiveZilla requires the PHP extension LDAP to authenticate against directories. Please add the LDAP package (extension=php_ldap.dll) to your PHP configuration.";
            else
            {
                try
                {
                    $result = LDAPManager::Bind($_POST["p_ldap_host"],$_POST["p_ldap_port"],$_POST["p_ldap_bidn"],$_POST["p_ldap_bipa"],$_connection,true);
                    ldap_unbind($_connection);
                }
                catch(Exception $e)
                {
                    Logging::LDAPLog(serialize($e));
                    $result = serialize($e);
                }
            }

            if($result === true)
                Server::$Response->SetStandardResponse(1,base64_encode(1));
            else
                Server::$Response->SetStandardResponse(2,base64_encode($result));
        }
    }

    static function Search($xml="",$success=false)
    {
        $ldap_con = null;
        if(LDAPManager::Bind(Server::$Configuration->File["gl_ldho"],Server::$Configuration->File["gl_ldpo"],Server::$Configuration->File["gl_lddn"],Server::$Configuration->File["gl_ldbp"],$ldap_con))
        {
            $attributes = array("samaccountname", "uid", "cn", "sn", "mail", "description");
            $search = $_POST["p_ldap_search"];
            if(!($result = ldap_search($ldap_con,Server::$Configuration->File["gl_ldsd"],"(|(sn=*$search*)(cn=*$search*)(description=*$search*)(mail=*$search*)(uid=*$search*))",$attributes)))
            {
                Logging::LDAPLog($result = ldap_error($ldap_con));
            }
            else
            {
                $data = ldap_get_entries($ldap_con, $result);
                $success = true;
                foreach($data as $user)
                {
                    $xmla = "";
                    if(isset($user["cn"]) && isset($user["cn"][0]))
                        $xmla .= "cn=\"".base64_encode($user["cn"][0])."\" ";
                    if(isset($user["sn"]) && isset($user["sn"][0]))
                        $xmla .= "sn=\"".base64_encode($user["sn"][0])."\" ";
                    if(isset($user["mail"]) && isset($user["mail"][0]))
                        $xmla .= "mail=\"".base64_encode($user["mail"][0])."\" ";

                    if(isset($user["uid"]) && isset($user["uid"][0]))
                        $xmla .= "uid=\"".base64_encode($user["uid"][0])."\" ";
                    else if(isset($user["samaccountname"]) && isset($user["samaccountname"][0]))
                        $xmla .= "uid=\"".base64_encode($user["samaccountname"][0])."\" ";

                    if(isset($user["description"]) && isset($user["description"][0]))
                        $xmla .= "description=\"".base64_encode($user["description"][0])."\" ";
                    if(!empty($xmla))
                        $xml .= "<ldr " . $xmla . "></ldr>";

                    if(DEBUG_MODE)
                        Logging::LDAPLog(serialize($user));
                }
            }
            ldap_unbind($ldap_con);
        }
        else
            Logging::LDAPLog($result = ldap_error($ldap_con));

        if($success && !empty($xml))
            Server::$Response->SetStandardResponse(1,$xml);
        else
            Server::$Response->SetStandardResponse(2,base64_encode($result));
    }
}
?>