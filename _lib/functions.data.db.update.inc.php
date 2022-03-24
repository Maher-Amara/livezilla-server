<?php
/****************************************************************************************
* LiveZilla functions.data.db.update.inc.php
* 
* Copyright 2018 LiveZilla GmbH
* All rights reserved.
* LiveZilla is a registered trademark.
* 
* Improper changes to this file may cause critical errors.
***************************************************************************************/ 

function updateDatabase($_version,$_dbManager,$_prefix,$_engine)
{
	$versions = array("3.1.8.1","3.1.8.2","3.1.8.3","3.1.8.4","3.1.8.5","3.1.8.6","3.2.0.0","3.2.0.1","3.2.0.2","3.2.0.3","3.3.0.0","3.3.1.0","3.3.1.1","3.3.1.2","3.3.1.3","3.3.2.0","3.3.2.1","3.3.2.2","3.4.0.0","4.0.0.0","4.0.1.0","4.0.1.1","4.0.1.2","4.1.0.0","4.1.0.1","4.1.0.2","4.1.0.3","4.1.0.4","4.2.0.0","4.2.0.1","4.2.0.2","4.2.0.3","4.2.0.4","4.2.0.5","5.0.0.0","5.0.1.0","5.0.1.1","5.0.1.2","5.0.1.3","5.0.1.4","5.1.0.0","5.1.1.0","5.1.2.0","5.1.2.1","5.1.2.2","5.1.2.3","5.2.0.0","5.2.0.1","5.2.5.0","5.2.5.1","5.2.5.2","5.3.0.0","5.3.0.1","5.3.0.2","5.3.0.3","5.3.0.4","5.3.0.5","5.3.0.6","5.3.0.7","5.3.0.8","5.4.0.0","5.4.0.1","5.4.0.2","6.0.0.0","6.0.0.1","6.0.0.2","6.0.0.3","6.0.0.4","6.0.0.5","6.1.0.0","6.1.0.1","6.1.0.2","6.1.0.3","6.1.1.0","6.1.1.1","6.1.1.2","6.2.0.0","7.0.0.0","7.0.0.1","7.0.0.2","7.0.1.0","7.0.2.0","7.0.2.1","7.0.2.2","7.0.2.3","7.0.2.4","7.0.2.5","7.0.2.6","7.0.2.7","7.0.2.8","7.0.2.9","7.0.3.0","7.0.3.1","7.0.3.2","7.0.4.0","7.0.4.1","7.0.5.0","7.0.5.1","7.0.5.2","7.0.5.3","7.0.6.0","7.0.7.0","7.0.7.1","7.0.7.2","7.0.8.0","7.0.8.1","7.0.8.2","7.0.8.3","7.0.8.4","7.0.8.5","7.0.8.6","7.0.8.7","7.0.8.8","7.0.8.9","7.0.9.0","7.0.9.1","7.0.9.2","7.0.9.3","7.0.9.4","7.0.9.5","7.0.9.6","7.1.0.0","7.1.0.1","7.1.0.2","7.1.0.3","7.1.0.4","7.1.0.5","7.1.0.6","7.1.0.7","7.1.0.8","7.1.0.9","8.0.0.0","8.0.0.1","8.0.0.2","8.0.0.3","8.0.0.4","8.0.0.5","8.0.0.6","8.0.0.7","8.0.0.8","8.0.0.9","8.0.1.0","8.0.1.1","8.0.1.2", "8.0.1.3", "8.0.1.4", "8.0.1.5", "8.0.1.6", "8.0.1.7", "8.0.1.8");
    if($_version == "3.3.2.3")
        $_version = "3.3.2.2";

    if(!in_array($_version,$versions))
		return "Invalid version! (".$_version.")";

    if(in_array(VERSION,$versions))
        while($_version != VERSION)
        {
            if($_version == $versions[3])$_version = $versions[4];
            if($_version == $versions[4])$_version = $versions[5];
            if($_version == $versions[5])
            {
                $result = up_3186_3200($_prefix,$_dbManager);
                if($result === TRUE)
                    $_version = $versions[6];
                else
                    return $result;
            }
            if($_version == $versions[6])
            {
                $result = up_3200_3201($_prefix,$_dbManager);
                if($result === TRUE)
                    $_version = $versions[7];
                else
                    return $result;
            }
            if($_version == $versions[7])$_version = $versions[9];
            if($_version == $versions[8])$_version = $versions[9];
            if($_version == $versions[9])
            {
                $result = up_3203_3300($_prefix,$_dbManager);
                if($result === TRUE)
                    $_version = $versions[10];
                else
                    return $result;
            }
            if($_version == $versions[10])
            {
                $result = up_3300_3310($_prefix,$_dbManager);
                if($result === TRUE)
                    $_version = $versions[11];
                else
                    return $result;
            }
            if($_version == $versions[11])
            {
                $result = up_3310_3311($_prefix,$_dbManager);
                if($result === TRUE)
                    $_version = $versions[12];
                else
                    return $result;
            }
            if($_version == $versions[12])
            {
                $result = up_3311_3312($_prefix,$_dbManager);
                if($result === TRUE)
                    $_version = $versions[13];
                else
                    return $result;
            }
            if($_version == $versions[13])$_version = $versions[14];
            if($_version == $versions[14])
            {
                $result = up_3313_3320($_prefix,$_dbManager);
                if($result === TRUE)
                    $_version = $versions[15];
                else
                    return $result;
            }
            if($_version == $versions[15])$_version = $versions[16];
            if($_version == $versions[16])$_version = $versions[17];
            if($_version == $versions[17])
            {
                $result = up_3322_3400($_prefix,$_dbManager);
                if($result === TRUE)
                    $_version = $versions[18];
                else
                    return $result;
            }
            if($_version == $versions[18])
            {
                $result = up_3400_4000($_prefix,$_dbManager);
                if($result === TRUE)
                    $_version = $versions[19];
                else
                    return $result;
            }
            if($_version == $versions[19])
            {
                $result = up_4000_4010($_prefix,$_dbManager);
                if($result === TRUE)
                    $_version = $versions[20];
                else
                    return $result;
            }
            if($_version == $versions[20])$_version = $versions[21];
            if($_version == $versions[21])$_version = $versions[22];
            if($_version == $versions[22])
            {
                $result = up_4012_4100($_prefix,$_dbManager);
                if($result === TRUE)
                    $_version = $versions[23];
                else
                    return $result;
            }
            if($_version == $versions[23])$_version = $versions[24];
            if($_version == $versions[24])
            {
                $result = up_4101_4102($_prefix,$_dbManager);
                if($result === TRUE)
                    $_version = $versions[25];
                else
                    return $result;
            }
            if($_version == $versions[25])
            {
                $result = up_4102_4103($_prefix,$_dbManager);
                if($result === TRUE)
                    $_version = $versions[26];
                else
                    return $result;
            }
            if($_version == $versions[26])$_version = $versions[27];
            if($_version == $versions[27])
            {
                $result = up_4104_4200($_prefix,$_dbManager);
                if($result === TRUE)
                    $_version = $versions[28];
                else
                    return $result;
            }
            if($_version == $versions[28])
            {
                $result = up_4200_4201($_prefix,$_dbManager);
                if($result === TRUE)
                    $_version = $versions[29];
                else
                    return $result;
            }
            if($_version == $versions[29])
            {
                $result = up_4201_4202($_prefix,$_dbManager);
                if($result === TRUE)
                    $_version = $versions[30];
                else
                    return $result;
            }
            if($_version == $versions[30])$_version = $versions[31];
            if($_version == $versions[31])$_version = $versions[32];
            if($_version == $versions[32])$_version = $versions[33];
            if($_version == $versions[33])
            {
                $result = up_4205_5000($_prefix,$_dbManager);
                if($result === TRUE)
                    $_version = $versions[34];
                else
                    return $result;
            }
            if($_version == $versions[34])$_version = $versions[35];
            if($_version == $versions[35])$_version = $versions[36];
            if($_version == $versions[36])$_version = $versions[37];
            if($_version == $versions[37])$_version = $versions[38];
            if($_version == $versions[38])$_version = $versions[39];
            if($_version == $versions[39])
            {
                $result = up_5014_5100($_prefix,$_dbManager);
                if($result === TRUE)
                    $_version = $versions[40];
                else
                    return $result;
            }
            if($_version == $versions[40])
            {
                $result = up_5100_5110($_prefix,$_dbManager);
                if($result === TRUE)
                    $_version = $versions[41];
                else
                    return $result;
            }
            if($_version == $versions[41])$_version = $versions[42];
            if($_version == $versions[42])$_version = $versions[43];
            if($_version == $versions[43])$_version = $versions[44];
            if($_version == $versions[44])
            {
                $result = up_5122_5123($_prefix,$_dbManager);
                if($result === TRUE)
                    $_version = $versions[45];
                else
                    return $result;
            }
            if($_version == $versions[45])
            {
                $result = up_5123_5200($_prefix,$_dbManager);
                if($result === TRUE)
                    $_version = $versions[46];
                else
                    return $result;
            }
            if($_version == $versions[46])$_version = $versions[47];
            if($_version == $versions[47])
            {
                $result = up_5201_5250($_prefix,$_dbManager);
                if($result === TRUE)
                    $_version = $versions[48];
                else
                    return $result;
            }
            if($_version == $versions[48])$_version = $versions[49];
            if($_version == $versions[49])$_version = $versions[50];
            if($_version == $versions[50])
            {
                $result = up_5252_5300($_prefix,$_dbManager);
                if($result === TRUE)
                    $_version = $versions[51];
                else
                    return $result;
            }
            if($_version == $versions[51])
            {
                $result = up_5300_5301($_prefix,$_dbManager);
                if($result === TRUE)
                    $_version = $versions[52];
                else
                    return $result;
            }
            if($_version == $versions[52])$_version = $versions[53];
            if($_version == $versions[53])$_version = $versions[54];
            if($_version == $versions[54])$_version = $versions[55];
            if($_version == $versions[55])$_version = $versions[56];
            if($_version == $versions[56])$_version = $versions[57];
            if($_version == $versions[57])$_version = $versions[58];
            if($_version == $versions[58])$_version = $versions[59];
            if($_version == $versions[59])
            {
                $result = up_5305_5400($_prefix,$_dbManager,$_engine);
                if($result === TRUE)
                    $_version = $versions[60];
                else
                    return $result;
            }
            if($_version == $versions[60])$_version = $versions[61];
            if($_version == $versions[61])
            {
                $result = up_5401_5402($_prefix,$_dbManager,$_engine);
                if($result === TRUE)
                    $_version = $versions[62];
                else
                    return $result;
            }
            if($_version == $versions[62])
            {
                $result = up_5402_6000($_prefix,$_dbManager,$_engine);
                if($result === TRUE)
                    $_version = $versions[63];
                else
                    return $result;
            }
            if($_version == $versions[63])$_version = $versions[64];
            if($_version == $versions[64])$_version = $versions[65];
            if($_version == $versions[65])$_version = $versions[66];
            if($_version == $versions[66])$_version = $versions[67];
            if($_version == $versions[67])$_version = $versions[68];
            if($_version == $versions[68])
            {
                $result = up_6005_6100($_prefix,$_dbManager,$_engine);
                if($result === TRUE)
                    $_version = $versions[69];
                else
                    return $result;
            }
            if($_version == $versions[69])
            {
                $result = up_6100_6101($_prefix,$_dbManager,$_engine);
                if($result === TRUE)
                    $_version = $versions[70];
                else
                    return $result;
            }
            if($_version == $versions[70])
            {
                $result = up_6101_6102($_prefix,$_dbManager,$_engine);
                if($result === TRUE)
                    $_version = $versions[71];
                else
                    return $result;
            }
            if($_version == $versions[71])$_version = $versions[72];
            if($_version == $versions[72])
            {
                $result = up_6103_6110($_prefix,$_dbManager,$_engine);
                if($result === TRUE)
                    $_version = $versions[73];
                else
                    return $result;
            }
            if($_version == $versions[73])
            {
                $result = up_6110_6111($_prefix,$_dbManager,$_engine);
                if($result === TRUE)
                    $_version = $versions[74];
                else
                    return $result;
            }
            if($_version == $versions[74])$_version = $versions[75];
            if($_version == $versions[75])
            {
                $result = up_6112_6200($_prefix,$_dbManager,$_engine);
                if($result === TRUE)
                    $_version = $versions[76];
                else
                    return $result;
            }
            if($_version == $versions[76])
            {
                $result = up_6200_7000($_prefix,$_dbManager,$_engine);
                if($result === TRUE)
                    $_version = $versions[77];
                else
                    return $result;
            }
            if($_version == $versions[77])$_version = $versions[78];
            if($_version == $versions[78])$_version = $versions[79];
            if($_version == $versions[79])
            {
                $result = up_7002_7010($_prefix,$_dbManager,$_engine);
                if($result === TRUE)
                    $_version = $versions[80];
                else
                    return $result;
            }
            if($_version == $versions[80])$_version = $versions[81];
            if($_version == $versions[81])$_version = $versions[82];
            if($_version == $versions[82])$_version = $versions[83];
            if($_version == $versions[83])$_version = $versions[84];
            if($_version == $versions[84])$_version = $versions[85];
            if($_version == $versions[85])$_version = $versions[86];
            if($_version == $versions[86])$_version = $versions[87];
            if($_version == $versions[87])$_version = $versions[88];
            if($_version == $versions[88])$_version = $versions[89];
            if($_version == $versions[89])$_version = $versions[90];
            if($_version == $versions[90])
            {
                $result = up_7029_7030($_prefix,$_dbManager,$_engine);
                if($result === TRUE)
                    $_version = $versions[91];
                else
                    return $result;
            }
            if($_version == $versions[91])$_version = $versions[92];
            if($_version == $versions[92])$_version = $versions[93];
            if($_version == $versions[93])
            {
                $result = up_7031_7040($_prefix,$_dbManager,$_engine);
                if($result === TRUE)
                    $_version = $versions[94];
                else
                    return $result;
            }
            if($_version == $versions[94])$_version = $versions[95];
            if($_version == $versions[95])
            {
                $result = up_7041_7050($_prefix,$_dbManager,$_engine);
                if($result === TRUE)
                    $_version = $versions[96];
                else
                    return $result;
            }
            if($_version == $versions[96])$_version = $versions[97];
            if($_version == $versions[97])$_version = $versions[98];
            if($_version == $versions[98])$_version = $versions[99];
            if($_version == $versions[99])
            {
                $result = up_7053_7060($_prefix,$_dbManager,$_engine);
                if($result === TRUE)
                    $_version = $versions[100];
                else
                    return $result;
            }
            if($_version == $versions[100])
            {
                $result = up_7060_7070($_prefix,$_dbManager,$_engine);
                if($result === TRUE)
                    $_version = $versions[101];
                else
                    return $result;
            }
            if($_version == $versions[101])$_version = $versions[102];
            if($_version == $versions[102])$_version = $versions[103];
            if($_version == $versions[103])$_version = $versions[104];
            if($_version == $versions[104])
            {
                $result = up_7080_7081($_prefix,$_dbManager,$_engine);
                if($result === TRUE)
                    $_version = $versions[105];
                else
                    return $result;
            }
            if($_version == $versions[105])
            {
                $result = up_7081_7082($_prefix,$_dbManager,$_engine);
                if($result === TRUE)
                    $_version = $versions[106];
                else
                    return $result;
            }
            if($_version == $versions[106])$_version = $versions[107];
            if($_version == $versions[107])$_version = $versions[108];
            if($_version == $versions[108])$_version = $versions[109];
            if($_version == $versions[109])$_version = $versions[110];
            if($_version == $versions[110])$_version = $versions[111];
            if($_version == $versions[111])$_version = $versions[112];
            if($_version == $versions[112])$_version = $versions[113];
            if($_version == $versions[113])
            {
                $result = up_7089_7090($_prefix,$_dbManager,$_engine);
                if($result === TRUE)
                    $_version = $versions[114];
                else
                    return $result;
            }
            if($_version == $versions[114])
            {
                $result = up_7090_7091($_prefix,$_dbManager,$_engine);
                if($result === TRUE)
                    $_version = $versions[115];
                else
                    return $result;
            }
            if($_version == $versions[115])
            {
                $result = up_7091_7092($_prefix,$_dbManager,$_engine);
                if($result === TRUE)
                    $_version = $versions[116];
                else
                    return $result;
            }
            if($_version == $versions[116])
            {
                $result = up_7092_7093($_prefix,$_dbManager,$_engine);
                if($result === TRUE)
                    $_version = $versions[117];
                else
                    return $result;
            }
            if($_version == $versions[117])$_version = $versions[118];
            if($_version == $versions[118])$_version = $versions[119];
            if($_version == $versions[119])
            {
                $result = up_7095_7096($_prefix,$_dbManager,$_engine);
                if($result === TRUE)
                    $_version = $versions[120];
                else
                    return $result;
            }
            if($_version == $versions[120])
            {
                $result = up_7096_7100($_prefix,$_dbManager,$_engine);
                if($result === TRUE)
                    $_version = $versions[121];
                else
                    return $result;
            }
            if($_version == $versions[121])
            {
                $result = up_7100_7101($_prefix,$_dbManager,$_engine);
                if($result === TRUE)
                    $_version = $versions[122];
                else
                    return $result;
            }
            if($_version == $versions[122])
            {
                $result = up_7101_7102($_prefix,$_dbManager,$_engine);
                if($result === TRUE)
                    $_version = $versions[123];
                else
                    return $result;
            }
            if($_version == $versions[123])
            {
                $result = up_7102_7103($_prefix,$_dbManager,$_engine);
                if($result === TRUE)
                    $_version = $versions[124];
                else
                    return $result;
            }
            if($_version == $versions[124])
            {
                $result = up_7103_7104($_prefix,$_dbManager,$_engine);
                if($result === TRUE)
                    $_version = $versions[125];
                else
                    return $result;
            }
            if($_version == $versions[125])
            {
                $result = up_7104_7105($_prefix,$_dbManager,$_engine);
                if($result === TRUE)
                    $_version = $versions[126];
                else
                    return $result;
            }
            if($_version == $versions[126])$_version = $versions[127];
            if($_version == $versions[127])$_version = $versions[128];
            if($_version == $versions[128])$_version = $versions[129];
            if($_version == $versions[129])$_version = $versions[130];
            if($_version == $versions[130])
            {
                $result = up_7105_8000($_prefix,$_dbManager,$_engine);
                if($result === TRUE)
                    $_version = $versions[131];
                else
                    return $result;
            }
            if($_version == $versions[131])$_version = $versions[132];
            if($_version == $versions[132])$_version = $versions[133];
            if($_version == $versions[133])$_version = $versions[134];
            if($_version == $versions[134])$_version = $versions[135];
            if($_version == $versions[135])
            {
                $result = up_8004_8005($_prefix,$_dbManager,$_engine);
                if($result === TRUE)
                    $_version = $versions[136];
                else
                    return $result;
            }
            if($_version == $versions[136])$_version = $versions[137];
            if($_version == $versions[137])
            {
                $result = up_8006_8007($_prefix,$_dbManager,$_engine);
                if($result === TRUE)
                    $_version = $versions[138];
                else
                    return $result;
            }
            if($_version == $versions[138])$_version = $versions[139];
            if($_version == $versions[139])
            {
                $result = up_8008_8009($_prefix,$_dbManager,$_engine);
                if($result === TRUE)
                    $_version = $versions[140];
                else
                    return $result;
            }
            if($_version == $versions[140])$_version = $versions[141];
            if($_version == $versions[141])$_version = $versions[142];
            if($_version == $versions[142])$_version = $versions[143];
            if($_version == $versions[143])$_version = $versions[144];
            if($_version == $versions[144])$_version = $versions[145];
            if($_version == $versions[145])$_version = $versions[146];
            if($_version == $versions[146])$_version = $versions[147];
            if($_version == $versions[147])$_version = $versions[148];
            if($_version == $versions[148])$_version = $versions[149];
        }

    $_dbManager->Query(false,"UPDATE `".DBManager::RealEscape($_prefix)."info` SET `version`='" . VERSION . "'");

    $dump = IOStruct::GetFile(LIVEZILLA_PATH . "_definitions/config.lsql");
    $dump = str_replace("<!--prefix-->",DBManager::RealEscape($_prefix),$dump);
    $dump = str_replace("<!--lz_path-->",DBManager::RealEscape($_POST["p_lz_path"]),$dump);
    $dump = str_replace("<!--lz_host-->",DBManager::RealEscape($_POST["p_lz_host"]),$dump);
    $dump = str_replace("<!--gl_colt-->",DBManager::RealEscape($_POST["p_gl_colt"]),$dump);
    $dump = str_replace("<!--gl_dnt-->",DBManager::RealEscape($_POST["p_gl_dnt"]),$dump);
    $dump = str_replace("<!--gl_maskip-->",DBManager::RealEscape($_POST["p_gl_maskip"]),$dump);
    $dump = str_replace("<!--gl_miat-->",DBManager::RealEscape($_POST["p_gl_miat"]),$dump);
    $dump = str_replace("<!--gl_use_ngl-->",DBManager::RealEscape(@$_POST["p_gl_use_ngl"]),$dump);
    $dump = str_replace("<!--gl_licl_0-->","",$dump);
    $dump = str_replace("<!--gl_pr_ngl-->","",$dump);
    $dump = str_replace("<!--gl_crc3-->","",$dump);
    $commands = explode("###",$dump);

    foreach($commands as $sql)
        $_dbManager->Query(false,$sql);

	return true;
}

function processCommandList($_commands,$_dbManager)
{
	foreach($_commands as $parts)
	{
		$result = $_dbManager->Query(false,$parts[1]);
		if(!$result && DBManager::GetErrorCode() != $parts[0] && $parts[0] != 0 && count($parts) == 2)
			return DBManager::GetErrorCode() . ": " . DBManager::GetError() . "\r\n\r\nMySQL Query: " . $parts[1];
	}
	return true;
}

function up_8008_8009($_prefix,$_link,$_engine)
{
    $commands[] = array(0,"ALTER TABLE `".DBManager::RealEscape($_prefix)."knowledgebase_views` CHANGE `res_id` `res_id` VARCHAR(255) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");

    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs_feedbacks` ADD `ce` double unsigned NOT NULL DEFAULT '0';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs_feedbacks` ADD `cf` double unsigned NOT NULL DEFAULT '0';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs_feedbacks` ADD `cg` double unsigned NOT NULL DEFAULT '0';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs_feedbacks` ADD `ch` double unsigned NOT NULL DEFAULT '0';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs_feedbacks` ADD `ci` double unsigned NOT NULL DEFAULT '0';");

    $res = processCommandList($commands,$_link);
    return $res;
}

function up_8006_8007($_prefix,$_link,$_engine)
{
    $commands[] = array(0,"DELETE FROM `".DBManager::RealEscape($_prefix)."social_media_channels`;");
    $res = processCommandList($commands,$_link);
    return $res;
}

function up_8004_8005($_prefix,$_link,$_engine)
{
    $commands[] = array(0,"ALTER TABLE `".DBManager::RealEscape($_prefix)."resources` CHANGE `id` `id` VARCHAR(256) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."resources` CHANGE `title` `title` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '';");
    $res = processCommandList($commands,$_link);
    return $res;
}

function up_7105_8000($_prefix,$_link,$_engine)
{
    $commands[] = array(0,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operators` ADD `status_info` VARCHAR( 256 ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '';");
    $commands[] = array(0,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operators` ADD `skills` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;");
    $commands[] = array(0,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operators` ADD `location` VARCHAR( 256 ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '';");
    $commands[] = array(0,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operators` ADD `roles` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;");
    $commands[] = array(1054,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_chats` CHANGE `typing` `typing` VARCHAR(255) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
    $commands[] = array(1091,"ALTER TABLE `".DBManager::RealEscape($_prefix)."predefined` DROP `queue_message`;");
    $commands[] = array(1091,"ALTER TABLE `".DBManager::RealEscape($_prefix)."predefined` DROP `queue_message_time`;");
    $commands[] = array(1091,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_chats` DROP `queue_message_shown`;");
    $commands[] = array(1091,"ALTER TABLE `".DBManager::RealEscape($_prefix)."groups` DROP `post_chat_js`;");
    $commands[] = array(1091,"ALTER TABLE `".DBManager::RealEscape($_prefix)."groups` DROP `pre_chat_js`;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitors` ADD `ss_stream` VARCHAR(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
    $commands[] = array(1060,"UPDATE `".DBManager::RealEscape($_prefix)."groups` SET `functions`=CONCAT(`functions`,'1');");
    $commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."roles` (`id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',`description` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,`permissions` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '',PRIMARY KEY (`id`))ENGINE=".$_engine." DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."predefined` ADD `ticket_invite_auto` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_requests` ADD `type` TINYINT(1) UNSIGNED NOT NULL DEFAULT '2';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_posts` CHANGE `text` `text` MEDIUMTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_posts` CHANGE `translation` `translation` MEDIUMTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."ticket_emails` CHANGE `body` `body` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."ticket_emails` CHANGE `body_html` `body_html` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."ticket_emails` CHANGE `subject` `subject` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."ticket_emails` CHANGE `sender_name` `sender_name` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."ticket_messages` CHANGE `text` `text` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."ticket_messages` CHANGE `html` `html` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."ticket_messages` CHANGE `fullname` `fullname` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."ticket_messages` CHANGE `company` `company` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."ticket_messages` CHANGE `subject` `subject` VARCHAR(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '';");
    $commands[] = array(1051,"DELETE FROM `".DBManager::RealEscape($_prefix)."social_media_channels` WHERE `type`='6' AND `stream_type`=1;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."predefined` ADD `tos_callback` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL AFTER `tos_ticket`;");
    $commands[] = array(1050,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_posts` CHANGE `receiver_group` `receiver_group` VARCHAR( 65 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");

    $tia_de = "<b>Haben Sie Fragen?</b><br><br>Wir helfen Ihnen gerne. Bitte hinterlassen Sie eine Nachricht und wir melden uns umgehend.";
    $tia_en = "<b>Having questions?</b><br><br>We would be glad to help. Please leave a message and we will get back to you shortly.";

    $commands[] = array(0,"UPDATE `".DBManager::RealEscape($_prefix)."predefined` SET `ticket_invite_auto`='".DBManager::RealEscape($tia_en)."';");
    $commands[] = array(0,"UPDATE `".DBManager::RealEscape($_prefix)."predefined` SET `ticket_invite_auto`='".DBManager::RealEscape($tia_de)."' WHERE `lang_iso`='DE';");

    $res = processCommandList($commands,$_link);

    if($res === true)
    {
        $commands = array();

        // REMOVE
        // $commands[] = array(0,"TRUNCATE TABLE `".DBManager::RealEscape($_prefix)."roles`;");
        // REMOVE

        if($result = $_link->Query(true,"SELECT * FROM `".DBManager::RealEscape($_prefix)."operators` WHERE `bot` != 1;"))
        {
            $permlistName = array();
            $permlistIds = array();
            $oproles = array();

            while($row = DBManager::FetchArray($result))
            {
                // correct missinglength
                while(strlen($row["permissions"]) < 54)
                    $row["permissions"] .= "0";

                // add new permissions
                $row["permissions"] .= (!empty($row["level"])) ? "1111111" : "0000001";
                $admintitle = (!empty($row["level"])) ? "Admin Role" : "Operator Role";

                if(strlen($row["permissions"]) != 61)
                    return "Invalid permission length: " . $row["id"] . " " . strlen($row["permissions"]);

                if(!isset($permlistName[$row["permissions"]]))
                    $permlistName[$row["permissions"]] = $admintitle . " " . (count($permlistName)+1);

                $oproles[$row["id"]] = $row["permissions"];
            }

            foreach($permlistName as $permissions => $name)
            {
                $commands[] = array(1062,"INSERT INTO `".DBManager::RealEscape($_prefix)."roles` (`id`, `name`, `description`, `permissions`) VALUES ('".($rid=getId(32))."', '".DBManager::RealEscape($name)."', '', '".DBManager::RealEscape($permissions)."');");
                $permlistIds[$permissions] = $rid;
            }

            foreach($oproles as $id => $permissions)
                $commands[] = array(1060,"UPDATE `".DBManager::RealEscape($_prefix)."operators` SET `roles`='".DBManager::RealEscape($permlistIds[$permissions])."' WHERE `id`='".DBManager::RealEscape($id)."';");
        }
        else
            return "Can't apply roles";

        $res = processCommandList($commands,$_link);
    }

    return $res;
}

function up_7104_7105($_prefix,$_link,$_engine)
{
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs_goals` DROP PRIMARY KEY,ADD PRIMARY KEY ( `year` , `month` , `day` , `hour`, `goal` );");
    $res = processCommandList($commands,$_link);
    return $res;
}

function up_7103_7104($_prefix,$_link,$_engine)
{
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs_visitors` ADD `conversions` INT(10) UNSIGNED NOT NULL DEFAULT '0' AFTER `bounces`;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs_goals` ADD `hour` TINYINT(2) UNSIGNED NOT NULL DEFAULT '0' AFTER `day`;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs_goals` DROP PRIMARY KEY,ADD PRIMARY KEY ( `year` , `month` , `day` , `hour`, `goal` );");
    $commands[] = array(1091,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs_tickets` DROP `pending`;");
    $commands[] = array(1091,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs_tickets` DROP `in_progress`;");
    $res = processCommandList($commands,$_link);
    return $res;
}

function up_7102_7103($_prefix,$_link,$_engine)
{
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."resources` ADD `chat_id` INT UNSIGNED NOT NULL DEFAULT '0';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."resources` ADD `related` TEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs_tickets` ADD `email_in` INT UNSIGNED NOT NULL DEFAULT '0';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs_tickets` ADD `email_converted` INT UNSIGNED NOT NULL DEFAULT '0';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs_tickets` ADD `email_out` INT UNSIGNED NOT NULL DEFAULT '0';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs_tickets` ADD `facebook_in` INT UNSIGNED NOT NULL DEFAULT '0';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs_tickets` ADD `facebook_out` INT UNSIGNED NOT NULL DEFAULT '0';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs_tickets` ADD `twitter_in` INT UNSIGNED NOT NULL DEFAULT '0';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs_tickets` ADD `twitter_out` INT UNSIGNED NOT NULL DEFAULT '0';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs_tickets` ADD `source_email` INT UNSIGNED NOT NULL DEFAULT '0';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs_tickets` ADD `source_phone` INT UNSIGNED NOT NULL DEFAULT '0';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs_tickets` ADD `source_misc` INT UNSIGNED NOT NULL DEFAULT '0';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs_tickets` ADD `source_chat` INT UNSIGNED NOT NULL DEFAULT '0';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs_tickets` ADD `source_feedback` INT UNSIGNED NOT NULL DEFAULT '0';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs_tickets` ADD `source_facebook` INT UNSIGNED NOT NULL DEFAULT '0';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs_tickets` ADD `source_twitter` INT UNSIGNED NOT NULL DEFAULT '0';");
    $res = processCommandList($commands,$_link);
    return $res;
}

function up_7101_7102($_prefix,$_link,$_engine)
{
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitors` ADD `device` TINYINT(1) UNSIGNED NOT NULL DEFAULT '0';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs_visitors` ADD `device_tablet` INT UNSIGNED NOT NULL DEFAULT '0';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs_visitors` ADD `device_mobile` INT UNSIGNED NOT NULL DEFAULT '0';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs_chats` ADD `device_tablet` INT UNSIGNED NOT NULL DEFAULT '0';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs_chats` ADD `device_mobile` INT UNSIGNED NOT NULL DEFAULT '0';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs_tickets` ADD `device_tablet` INT UNSIGNED NOT NULL DEFAULT '0';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs_tickets` ADD `device_mobile` INT UNSIGNED NOT NULL DEFAULT '0';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."resources` ADD `in_widget` TINYINT(1) UNSIGNED NOT NULL DEFAULT '1';");
    $res = processCommandList($commands,$_link);
    return $res;
}

function up_7100_7101($_prefix,$_link,$_engine)
{
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs_tickets` ADD `overdue` int(10) unsigned NOT NULL DEFAULT '0' AFTER `closed`;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs_tickets` ADD `avg_close_time` double unsigned NOT NULL DEFAULT '0' AFTER `closed`;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs_tickets` ADD `pending` int(10) unsigned NOT NULL DEFAULT '0' AFTER `in_progress`;");
    $res = processCommandList($commands,$_link);
    return $res;
}

function up_7096_7100($_prefix,$_link,$_engine)
{
    if($result = $_link->Query(true,"SELECT * FROM `".DBManager::RealEscape($_prefix)."resources` WHERE `type` != 3 AND `tags` != '';"))
    {
        $list = array();
        while($row = DBManager::FetchArray($result))
        {
            $row["tags"] = str_replace(array("\r","\n"," "), ",", $row["tags"]);
            $elist = explode(",",$row["tags"]);
            foreach($elist as $etag)
            {
                $etag = trim($etag);
                if(!empty($etag) && !isset($list[$etag]))
                    $list[$etag] = $etag;
            }
        }
        $list = implode(",",$list);
        if(!empty($list))
            $commands[] = array(1062,"REPLACE INTO `".DBManager::RealEscape($_prefix)."config` (`key`, `value`) VALUES ('gl_tags', '".DBManager::RealEscape($list)."');");
    }

    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_archive` ADD `tags` VARCHAR( 255 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '' AFTER `ref_url`;");
    $commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_archive` ADD INDEX `tags` ( `tags` );");
    $commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."stats_aggs_tags` (`year` smallint(5) unsigned NOT NULL DEFAULT '0',`month` tinyint(3) unsigned NOT NULL DEFAULT '0',`day` tinyint(3) unsigned NOT NULL DEFAULT '0',`tag` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '',`amount` int(10) unsigned NOT NULL DEFAULT '0',`type` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0',PRIMARY KEY (`year`,`month`,`day`,`tag`,`type`)) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
    $res = processCommandList($commands,$_link);
    return $res;
}

function up_7095_7096($_prefix,$_link,$_engine)
{
    CacheManager::Flush();
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."tickets` ADD `tags` VARCHAR( 255 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '' AFTER `salt`;");
    $commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."tickets` ADD INDEX `tags` ( `tags` );");
    $res = processCommandList($commands,$_link);
    return $res;
}

function up_7092_7093($_prefix,$_link,$_engine)
{
    CacheManager::Flush();
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_posts` ADD `whisper` TINYINT(1) UNSIGNED NOT NULL DEFAULT '0';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."resources` ADD `order_key` INT(11) NOT NULL DEFAULT '0';");
    $commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."resources` ADD INDEX `order_key` ( `order_key` );");
    $res = processCommandList($commands,$_link);
    return $res;
}

function up_7091_7092($_prefix,$_link,$_engine)
{
    $commands[] = array(0,"ALTER TABLE `".DBManager::RealEscape($_prefix)."data_updates` ADD PRIMARY KEY(`update_tickets`)");
    $commands[] = array(1051,"DROP TABLE IF EXISTS `".DBManager::RealEscape($_prefix)."visitor_chat_logs`;");
    $res = processCommandList($commands,$_link);
    return $res;
}

function up_7090_7091($_prefix,$_link,$_engine)
{
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."groups` ADD `ticket_notifier` TINYINT(1) UNSIGNED NOT NULL DEFAULT '0';");
    $res = processCommandList($commands,$_link);
    return $res;
}

function up_7089_7090($_prefix,$_link,$_engine)
{
    $commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."stats_aggs_events` (`year` smallint(5) unsigned NOT NULL DEFAULT '0',`month` tinyint(3) unsigned NOT NULL DEFAULT '0',`day` tinyint(3) unsigned NOT NULL DEFAULT '0',`hour` tinyint(3) unsigned NOT NULL DEFAULT '0',`event_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`amount` int(10) unsigned NOT NULL DEFAULT '0',PRIMARY KEY (`year`,`month`,`day`,`hour`,`event_id`),KEY `target` (`event_id`))ENGINE=".$_engine." DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");

    $commands[] = array(0,"ALTER TABLE `".DBManager::RealEscape($_prefix)."event_triggers` ADD `event_id` VARCHAR( 32 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '' AFTER `action_id`;");
    $commands[] = array(0,"ALTER TABLE `".DBManager::RealEscape($_prefix)."events` ADD `chat_ends` INT(10) UNSIGNED NOT NULL DEFAULT '0' AFTER `is_in_chat`;");
    $commands[] = array(1062,"INSERT INTO `".DBManager::RealEscape($_prefix)."config` (`key`, `value`) VALUES ('gl_actt', '1');");

    $commands[] = array(1062,"INSERT INTO `".DBManager::RealEscape($_prefix)."config` (`key`, `value`) VALUES ('gl_seme', 'message');");
    $commands[] = array(1062,"INSERT INTO `".DBManager::RealEscape($_prefix)."config` (`key`, `value`) VALUES ('gl_seno', 'wind');");
    $commands[] = array(1062,"INSERT INTO `".DBManager::RealEscape($_prefix)."config` (`key`, `value`) VALUES ('gl_some', 'message');");
    $commands[] = array(1062,"INSERT INTO `".DBManager::RealEscape($_prefix)."config` (`key`, `value`) VALUES ('gl_sovi', 'visitor');");
    $commands[] = array(1062,"INSERT INTO `".DBManager::RealEscape($_prefix)."config` (`key`, `value`) VALUES ('gl_sori', 'ringtone');");
    $commands[] = array(1062,"INSERT INTO `".DBManager::RealEscape($_prefix)."config` (`key`, `value`) VALUES ('gl_soti', 'wind');");
    $commands[] = array(1062,"INSERT INTO `".DBManager::RealEscape($_prefix)."config` (`key`, `value`) VALUES ('gl_soqu', 'queue');");

    $commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."ticket_editors` ADD INDEX `status` ( `status` );");
    $commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."ticket_editors` ADD INDEX `editor_id` ( `editor_id` );");
    $commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."ticket_editors` ADD INDEX `sub_status` ( `sub_status` );");
    $commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."tickets` ADD INDEX `target_group_id` ( `target_group_id` );");
    $commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."ticket_messages` ADD INDEX `type` ( `type` );");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."predefined` ADD `auto_close_operator` TEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."predefined` ADD `auto_close_customer` TEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL;");

    $acc_de = "Lieber Kunde, dieser Chat wurde aufgrund von Inaktivit�t automatisch geschlossen.";
    $acc_en = "Dear customer, this chat was closed automatically due to inactivity.";
    $aco_de = "Ich bin leider momentan verhindert und werde Sie in K�rze per E-Mail kontaktieren. Dieser Chat wird automatisch geschlossen.";
    $aco_en = "I'm unavailable at the moment but, I'll get back to you via email. This chat will be closed automatically.";

    $commands[] = array(0,"UPDATE `".DBManager::RealEscape($_prefix)."predefined` SET `auto_close_operator`='".DBManager::RealEscape($aco_en)."',`auto_close_customer`='".DBManager::RealEscape($acc_en)."';");
    $commands[] = array(0,"UPDATE `".DBManager::RealEscape($_prefix)."predefined` SET `auto_close_operator`='".DBManager::RealEscape($aco_de)."',`auto_close_customer`='".DBManager::RealEscape($acc_de)."' WHERE `lang_iso`='DE';");

    $res = processCommandList($commands,$_link);
    return $res;
}

function up_7081_7082($_prefix,$_link,$_engine)
{
    $commands[] = array(0,"ALTER TABLE `".DBManager::RealEscape($_prefix)."tickets` ADD `channel_unique_id` VARCHAR( 32 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '' AFTER `channel_conversation_id`;");
    $res = processCommandList($commands,$_link);
    return $res;
}

function up_7080_7081($_prefix,$_link,$_engine)
{
    $commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_archive` ADD INDEX `duration` ( `duration` );");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_archive` CHANGE `host` `host` VARCHAR( 256 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."tickets` ADD `channel_unique_id` VARCHAR( 32 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '' AFTER `channel_conversation_id`;");
    $res = processCommandList($commands,$_link);
    return $res;
}

function up_7060_7070($_prefix,$_link,$_engine)
{
    $commands = array();
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."tickets` ADD `salt` VARCHAR( 32 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
    $commands[] = array(0,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operators` ADD `firstname` VARCHAR( 64 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '' AFTER `fullname`;");
    $commands[] = array(0,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operators` ADD `lastname` VARCHAR( 64 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '' AFTER `firstname`;");

    if($result = $_link->Query(true,"SELECT * FROM `".DBManager::RealEscape($_prefix)."operators`;"))
    {
        while($row = DBManager::FetchArray($result))
        {
            if(isset($row["fullname"]) && !empty($row["fullname"]))
            {
                $nameparts = explode(" ",$row["fullname"]);
                $firstname = $lastname = "";
                if(count($nameparts)<=1)
                    $firstname = $row["fullname"];
                else if(count($nameparts)==2)
                {
                    $firstname = $nameparts[0];
                    $lastname = $nameparts[1];
                }
                else if(count($nameparts)>2)
                {
                    $firstname = $nameparts[0];
                    $nameparts[0] = "";
                    $lastname = implode(" ",$nameparts);
                }
                $commands[] = array(1060,"UPDATE `".DBManager::RealEscape($_prefix)."operators` SET `firstname`='".DBManager::RealEscape(trim($firstname))."' WHERE `system_id`='".DBManager::RealEscape($row["system_id"])."';");
                $commands[] = array(1060,"UPDATE `".DBManager::RealEscape($_prefix)."operators` SET `lastname`='".DBManager::RealEscape(trim($lastname))."' WHERE `system_id`='".DBManager::RealEscape($row["system_id"])."';");
            }
        }
    }

    $commands[] = array(1091,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operators` DROP `fullname`;");
    $commands[] = array(1054,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operators` CHANGE `welcome_message` `welcome_message` VARCHAR( 1024 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."ticket_messages` ADD `email_cc` VARCHAR( 255 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '' AFTER `email`;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."ticket_messages` ADD `email_bcc` VARCHAR( 255 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '' AFTER `email_cc`;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."ticket_emails` ADD `sender_cc` VARCHAR( 255 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '' AFTER `sender_replyto`;");

    $res = processCommandList($commands,$_link);
    return $res;
}

function up_7053_7060($_prefix,$_link,$_engine)
{
    $commands[] = array(1091,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_chats` DROP `qpenalty`;");
    $commands[] = array(1054,"ALTER TABLE `".DBManager::RealEscape($_prefix)."predefined` CHANGE `welcome_call_me_back` `chat_info_offline` MEDIUMTEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL;");
    $commands[] = array(1060,"UPDATE `".DBManager::RealEscape($_prefix)."predefined` SET `chat_info_offline`=`chat_info`;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operators` CHANGE `password` `password` VARCHAR( 255 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
    $commands[] = array(1054,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_archive` CHANGE `voucher_id` `ticket_id` VARCHAR( 32 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
    $commands[] = array(1060,"UPDATE `".DBManager::RealEscape($_prefix)."chat_archive` SET `ticket_id`='';");
    $commands[] = array(1054,"UPDATE `".DBManager::RealEscape($_prefix)."groups` SET `chat_vouchers_required`='';");
    $commands[] = array(1054,"ALTER TABLE `".DBManager::RealEscape($_prefix)."groups` CHANGE `chat_vouchers_required` `ticket_sender_name` VARCHAR( 255 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
    $commands[] = array(1060,"UPDATE `".DBManager::RealEscape($_prefix)."groups` SET `ticket_sender_name`='0';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."predefined` ADD `tos_chat` TEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."predefined` ADD `tos_ticket` TEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL;");
    $commands[] = array(1091,"ALTER TABLE `".DBManager::RealEscape($_prefix)."ticket_editors` DROP `group_id`;");
    $commands[] = array(1051,"DELETE FROM `".DBManager::RealEscape($_prefix)."filters` WHERE `name`='OOTF';");
    $res = processCommandList($commands,$_link);
    return $res;
}

function up_7041_7050($_prefix,$_link,$_engine)
{
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operators` ADD `welcome_message` VARCHAR( 192 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
    $commands[] = array(1054,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_archive` CHANGE `transcript_text` `transcript_text` LONGTEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL;");
    $commands[] = array(1054,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_archive` CHANGE `transcript_html` `transcript_html` LONGTEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL;");
    $res = processCommandList($commands,$_link);
    return $res;
}

function up_7031_7040($_prefix,$_link,$_engine)
{
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_posts` ADD `updated` INT(10) UNSIGNED NOT NULL DEFAULT '0' AFTER `micro`;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_posts` ADD `noticed` TINYINT(1) UNSIGNED NOT NULL DEFAULT '0' AFTER `received`;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_posts` ADD `api_obj` TEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."ticket_messages` ADD `html` LONGTEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL AFTER `text`;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operators` ADD `updated` INT(10) UNSIGNED NOT NULL DEFAULT '0' AFTER `last_active`;");
    $commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_posts` ADD INDEX `updated` ( `updated` );");
    $commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_posts` ADD INDEX `noticed` ( `noticed` );");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operators` ADD `api_url` VARCHAR( 128 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
    $commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operators` ADD INDEX `updated` ( `updated` );");
    $commands[] = array(1060,"UPDATE `".DBManager::RealEscape($_prefix)."social_media_channels` SET `connect_frequency`=60;");
    $commands[] = array(1060,"UPDATE `".DBManager::RealEscape($_prefix)."config` SET `value`=0 WHERE `key`='gl_kbsb' LIMIT 1;");
    $commands[] = array(1060,"UPDATE `".DBManager::RealEscape($_prefix)."mailboxes` SET `framework`='ZEND' WHERE `framework`='PHP';");
    $res = processCommandList($commands,$_link);
    return $res;
}

function up_7029_7030($_prefix,$_link,$_engine)
{
    $commands[] = array(1060,"UPDATE `".DBManager::RealEscape($_prefix)."operators` SET `color`='#bebebe' WHERE `color`='' AND `image`='';");
    $res = processCommandList($commands,$_link);
    return $res;
}

function up_7002_7010($_prefix,$_link,$_engine)
{
    $fkeys = array(1=>array("group_members","overlay_boxes","visitor_browsers","event_action_receivers","website_pushs","event_actions","event_urls","visitor_chats","ticket_editors","visitor_browser_urls","event_action_overlays","event_action_website_pushs","chat_forwards","event_triggers","visitor_chat_operators","event_funnels","stats_aggs_goals","ticket_customs","visitor_goals","chat_files","ticket_messages","event_goals","stats_aggs_pages","chat_requests"),2=>array("event_funnels","event_goals","event_triggers"));
    foreach($fkeys as $count => $keys)
        foreach($keys as $key)
            $commands[] = array(0,"ALTER TABLE `".DBManager::RealEscape($_prefix).$key."` DROP FOREIGN KEY `".DBManager::RealEscape($_prefix).$key."_ibfk_".$count."`;");

    if(isset(Server::$Configuration->File["timeout_track"]))
        $tit = Server::$Configuration->File["timeout_track"];
    else
        $tit = 90;

    $commands[] = array(1146,"TRUNCATE TABLE `".DBManager::RealEscape($_prefix)."visitors`;");
    $commands[] = array(1146,"TRUNCATE TABLE `".DBManager::RealEscape($_prefix)."visitor_browsers`;");
    $commands[] = array(1146,"TRUNCATE TABLE `".DBManager::RealEscape($_prefix)."visitor_browser_urls`;");
    $commands[] = array(1054,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitors` CHANGE `last_active` `closed` INT(10) UNSIGNED NOT NULL DEFAULT '0';");
    $commands[] = array(1060,"UPDATE `".DBManager::RealEscape($_prefix)."visitors` SET `closed`=0 WHERE `closed`<".(time()-$tit) .";");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitors` ADD `edited` INT(10) UNSIGNED NOT NULL DEFAULT '0' AFTER `closed`;");
    $commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitors` ADD INDEX `edited` ( `edited` )");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_browsers` ADD `closed` INT(10) UNSIGNED NOT NULL DEFAULT '0' AFTER `last_active`;");
    $commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_browsers` ADD INDEX `closed` ( `closed` )");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_browser_urls` ADD `closed` INT(10) UNSIGNED NOT NULL DEFAULT '0' AFTER `entrance`;");
    $commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_browser_urls` ADD INDEX `closed` ( `closed` )");
    $commands[] = array(1091,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operators` DROP `visitor_file_sizes`;");
    $commands[] = array(1091,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_browsers` DROP `last_update`;");
    $commands[] = array(1091,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_chats` DROP `area_code`;");
    $commands[] = array(1051,"DROP TABLE `".DBManager::RealEscape($_prefix)."profiles`;");
    $commands[] = array(1051,"DROP TABLE `".DBManager::RealEscape($_prefix)."overlay_boxes`;");
    $commands[] = array(1051,"DROP TABLE `".DBManager::RealEscape($_prefix)."event_action_overlays`;");
    $commands[] = array(1051,"DROP TABLE `".DBManager::RealEscape($_prefix)."event_action_website_pushs`;");
    $commands[] = array(1051,"DROP TABLE `".DBManager::RealEscape($_prefix)."alerts`;");
    $commands[] = array(1051,"DROP TABLE `".DBManager::RealEscape($_prefix)."website_pushs`;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operators` ADD `image` MEDIUMTEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL;");
    $commands[] = array(1051,"DELETE FROM `".DBManager::RealEscape($_prefix)."event_actions` WHERE `type`=5 OR `type`=4 OR `type`=3;");
    $commands[] = array(1060,"UPDATE `".DBManager::RealEscape($_prefix)."events` SET `is_active`=0;");

    if($result = $_link->Query(true,"SELECT * FROM `".DBManager::RealEscape($_prefix)."profile_pictures`;"))
    {
        while($row = DBManager::FetchArray($result))
        {
            $commands[] = array(1060,"UPDATE `".DBManager::RealEscape($_prefix)."operators` SET `image`='".DBManager::RealEscape($row["data"])."' WHERE `system_id`='".DBManager::RealEscape($row["internal_id"])."';");
        }
    }
    $commands[] = array(1051,"DROP TABLE `".DBManager::RealEscape($_prefix)."profile_pictures`;");

    CacheManager::Flush();
    $res = processCommandList($commands,$_link);
    return $res;
}

function up_6200_7000($_prefix,$_link,$_engine)
{
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."resources` CHANGE `owner` `owner` VARCHAR( 32 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."resources` CHANGE `editor` `editor` VARCHAR( 32 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operators` ADD `color` VARCHAR( 7 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '#bebebe';");
    $commands[] = array(1060,"UPDATE `".DBManager::RealEscape($_prefix)."resources` SET `value`='' WHERE `type`=0;");
    $commands[] = array(1060,"UPDATE `".DBManager::RealEscape($_prefix)."groups` SET `ticket_email_out`='' WHERE `ticket_email_out`='CLIENT';");
    $commands[] = array(1051,"DROP TABLE `".DBManager::RealEscape($_prefix)."chat_files`;");

    $cols = array('ec407a','78909c','0288d1','33691e','0098a6','bf360c','00887a','8c6e63','aa47bc');
    $pos = 0;
    if($result = $_link->Query(true,"SELECT * FROM `".DBManager::RealEscape($_prefix)."operators`;"))
    {
        while($row = DBManager::FetchArray($result))
        {
            $col = $cols[$pos];

            if($pos == (count($cols)-1))
                $pos = 0;
            else
                $pos++;

            $commands[] = array(1060,"UPDATE `".DBManager::RealEscape($_prefix)."operators` SET `color`='#".DBManager::RealEscape($col)."' WHERE `system_id`='".DBManager::RealEscape($row["system_id"])."';");
        }
    }

    $res = processCommandList($commands,$_link);
    return $res;
}

function up_6112_6200($_prefix,$_link,$_engine)
{
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitors` ADD `data_id` VARCHAR( 32 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
    $commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitors` ADD INDEX `data_id` ( `data_id` );");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."events` ADD `include_countries` VARCHAR( 128 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '' AFTER `exclude_countries`;");
    $commands[] = array(1091,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_browsers` DROP `data_id`;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_chats` ADD `subject` TEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."administration_log` ADD `ip` VARCHAR( 64 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
    $commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."administration_log` ADD INDEX `ip` ( `ip` );");
    $res = processCommandList($commands,$_link);
    return $res;
}

function up_6110_6111($_prefix,$_link,$_engine)
{
    $commands[] = array(1146,"TRUNCATE TABLE `".DBManager::RealEscape($_prefix)."codes`;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."codes` ADD `element` LONGTEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."ticket_emails` CHANGE `subject` `subject` TEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL;");
    $res = processCommandList($commands,$_link);
    return $res;
}

function up_6103_6110($_prefix,$_link,$_engine)
{
    $commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."codes` (`id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`created` int(10) unsigned NOT NULL DEFAULT '0',`name` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`operator_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`type` tinyint(1) unsigned NOT NULL DEFAULT '0',`code` longtext COLLATE utf8_bin NOT NULL, PRIMARY KEY (`id`)) ENGINE=".$_engine." DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_chats` ADD `history` VARCHAR( 32 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_chats` ADD `dgc` VARCHAR( 32 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."resources` ADD `owner_group` VARCHAR( 32 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '' AFTER `owner`;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operators` CHANGE `permissions` `permissions` VARCHAR( 64 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
    $commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."operator_backups` (`backup_id` int(10) unsigned NOT NULL DEFAULT '0',`operator_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`data_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`time` int(10) unsigned NOT NULL DEFAULT '0',`data` longtext COLLATE utf8_bin NOT NULL,PRIMARY KEY (`operator_id`,`data_id`)) ENGINE=".$_engine." DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_archive` CHANGE `question` `question` TEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL;");
    $res = processCommandList($commands,$_link);
    return $res;
}

function up_6101_6102($_prefix,$_link,$_engine)
{
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."events` ADD `is_in_chat` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0' AFTER `not_in_chat`;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."events` ADD `trigger_again_page` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0' AFTER `trigger_again_after`;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs_queries` DROP PRIMARY KEY,ADD PRIMARY KEY (`year`,`month`,`day`,`query`,`type`);");
    $res = processCommandList($commands,$_link);
    return $res;
}

function up_6100_6101($_prefix,$_link,$_engine)
{
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operators` ADD `ldap` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0';");
    $res = processCommandList($commands,$_link);
    return $res;
}

function up_6005_6100($_prefix,$_link,$_engine)
{
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."filters` ADD `type` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0' AFTER `created`;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."filters` ADD `email` VARCHAR( 128 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."filters` ADD `subject` VARCHAR( 128 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs_queries` ADD `type` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs_tickets` ADD `group_id` VARCHAR( 128 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '' AFTER `user_id`;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs_tickets` DROP PRIMARY KEY,ADD PRIMARY KEY ( `year` , `month` , `day` , `user_id` , `hour` , `group_id` );");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."groups` ADD `position` SMALLINT( 5 ) UNSIGNED NOT NULL DEFAULT '0';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."tickets` CHANGE `creation_type` `channel_type` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."tickets` ADD `sub_channel` VARCHAR( 32 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '' AFTER `channel_type`;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."ticket_editors` ADD `sub_status` VARCHAR( 32 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '' AFTER `status`;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."tickets` ADD `auto_status_time` INT( 11 ) UNSIGNED NOT NULL DEFAULT '0';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."tickets` ADD `auto_status_status` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0';");
    $commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."knowledgebase_views` (`id` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '',`time` int(10) unsigned NOT NULL DEFAULT '0',`res_id` VARCHAR( 32 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '',PRIMARY KEY (`id`)) ENGINE=".$_engine." DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
    $commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."knowledgebase_queries` (`id` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '',`time` int(10) unsigned NOT NULL DEFAULT '0',`query` int(10) unsigned NOT NULL DEFAULT '0',`ip_hash` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',PRIMARY KEY (`id`)) ENGINE=".$_engine." DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
    $commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."stats_aggs_knowledgebase` (`year` smallint(5) unsigned NOT NULL DEFAULT '0',`month` tinyint(3) unsigned NOT NULL DEFAULT '0',`day` tinyint(3) unsigned NOT NULL DEFAULT '0',`res_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`views` int(10) unsigned NOT NULL DEFAULT '0',`rate_amount` int(10) unsigned NOT NULL DEFAULT '0',`rate_positive` int(10) unsigned NOT NULL DEFAULT '0', PRIMARY KEY (`year`,`month`,`day`,`res_id`)) ENGINE=".$_engine." DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
    $commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."ticket_subs` (`id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`type` tinyint(1) unsigned NOT NULL DEFAULT '0',`parent_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',PRIMARY KEY (`id`,`type`,`parent_id`)) ENGINE=".$_engine." DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
    $commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."ticket_watcher` (`ticket_id` int(10) unsigned NOT NULL,`operator_id` varchar(32) COLLATE utf8_bin NOT NULL,`created` int(10) unsigned NOT NULL,PRIMARY KEY (`ticket_id`,`operator_id`)) ENGINE=".$_engine." DEFAULT CHARSET=utf8 CHECKSUM=0 COLLATE=utf8_bin;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_archive` ADD `duration` INT( 11 ) UNSIGNED NOT NULL DEFAULT '0' AFTER `wait`;");
    $commands[] = array(1060,"UPDATE `".DBManager::RealEscape($_prefix)."chat_archive` SET `duration`=(`closed`-`time`) WHERE `closed`>0 AND `time`>0 AND `closed`>`time`;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."tickets` ADD `priority` TINYINT( 1 ) NOT NULL DEFAULT '2';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."events` ADD `data_conditions` TEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL");
    $res = processCommandList($commands,$_link);
    return $res;
}

function up_5402_6000($_prefix,$_link,$_engine)
{
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."resources` ADD `languages` VARCHAR( 32 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '',ADD `kb_public` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0',ADD `kb_bot` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0',ADD `kb_ft_search` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0',ADD INDEX ( `languages` , `kb_public` ) ");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."resources` ADD `shortcut_word` VARCHAR( 32 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_browsers` ADD `data_id` VARCHAR( 32 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '' AFTER `visit_id`;");
    $commands[] = array(1054,"ALTER TABLE `".DBManager::RealEscape($_prefix)."data_updates` CHANGE `update_ratings` `update_feedbacks` BIGINT( 20 ) UNSIGNED NOT NULL DEFAULT '0';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."administration_log` ADD `trace` TEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL AFTER `value`;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."events` ADD `exclude_mobile` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."events` ADD `exclude_countries` VARCHAR( 128 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");

    $commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."user_data` (`id` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '',`create` int(10) unsigned NOT NULL DEFAULT '0',`h_fullname` varchar(254) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '',`h_email` varchar(254) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '',`h_company` varchar(254) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '',`h_phone` varchar(254) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '',`h_customs` text CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,`h_text` text CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,PRIMARY KEY (`id`)) ENGINE=".$_engine." DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
    $commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."feedbacks` (`id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`created` int(10) unsigned NOT NULL DEFAULT '0',`chat_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`ticket_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`resource_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`user_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`operator_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`group_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`data_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`ip_hash` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',PRIMARY KEY (`id`)) ENGINE=".$_engine." DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
    $commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."feedback_criteria` (`fid` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`cid` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`value` varchar(512) COLLATE utf8_bin NOT NULL DEFAULT '',PRIMARY KEY (`fid`,`cid`)) ENGINE=".$_engine." DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
    $commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."feedback_criteria_config` (`id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`type` tinyint(1) unsigned NOT NULL DEFAULT '0',`name` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`title` varchar(128) COLLATE utf8_bin NOT NULL DEFAULT '',PRIMARY KEY (`id`)) ENGINE=".$_engine." DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
    $commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."stats_aggs_feedbacks` (`year` smallint(5) unsigned NOT NULL DEFAULT '0',`month` tinyint(3) unsigned NOT NULL DEFAULT '0',`day` tinyint(3) unsigned NOT NULL DEFAULT '0',`operator_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`group_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`amount` int(10) unsigned NOT NULL DEFAULT '0',`ca` double unsigned NOT NULL DEFAULT '0',`cb` double unsigned NOT NULL DEFAULT '0',`cc` double unsigned NOT NULL DEFAULT '0',`cd` double unsigned NOT NULL DEFAULT '0',PRIMARY KEY (`year`,`month`,`day`,`operator_id`,`group_id`)) ENGINE=".$_engine." DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");

    $commands[] = array(1091,"ALTER TABLE `".DBManager::RealEscape($_prefix)."resources` DROP `rank`;");
    $commands[] = array(1091,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_chats` DROP `fullname`;");
    $commands[] = array(1091,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_chats` DROP `email`;");
    $commands[] = array(1091,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_chats` DROP `company`;");
    $commands[] = array(1091,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_chats` DROP `phone`;");
    $commands[] = array(1091,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_chats` DROP `customs`;");
    $commands[] = array(1091,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_chats` DROP `question`;");

    $commands[] = array(1091,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_browsers` DROP `fullname`;");
    $commands[] = array(1091,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_browsers` DROP `email`;");
    $commands[] = array(1091,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_browsers` DROP `company`;");
    $commands[] = array(1091,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_browsers` DROP `phone`;");
    $commands[] = array(1091,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_browsers` DROP `customs`;");

    $res = processCommandList($commands,$_link);

    // import ratings
    $_link->Query(true,"INSERT INTO `".DBManager::RealEscape($_prefix)."feedback_criteria_config` (`id`, `type`, `name`, `title`) VALUES ('d0', 0, 'Knowledge', '<!--lang_client_feedback_knowledge-->'),('d1', 0, 'Friendliness', '<!--lang_client_feedback_friendliness-->'),('d2', 0, 'Responsiveness', '<!--lang_client_feedback_responsiveness-->'),('d3', 0, 'Overall', '<!--lang_client_feedback_overall-->'),('d4', 1, 'Comment', '<!--lang_client_feedback_comment-->');");
    $sttime = time();
    $max_fb_time = null;
    if($result = $_link->Query(true,"SELECT * FROM `".DBManager::RealEscape($_prefix)."ratings` ORDER BY `time` DESC;"))
    {
        while($sttime > (time()-15) && $row = DBManager::FetchArray($result))
        {
            $userData = new UserData($row["fullname"],$row["email"],$row["company"],"");
            $hash = $userData->Hash();

            $_link->Query(true,"INSERT IGNORE INTO `".DBManager::RealEscape($_prefix)."user_data` (`id`,`create`,`h_fullname`,`h_email`,`h_company`,`h_customs`) VALUES ('".DBManager::RealEscape($hash)."',".intval(time()).",'".DBManager::RealEscape($row["fullname"])."','".DBManager::RealEscape($row["email"])."','".DBManager::RealEscape($row["company"])."','');");
            $_link->Query(true,"INSERT INTO `".DBManager::RealEscape($_prefix)."feedbacks` (`id`, `created`, `chat_id`, `user_id`, `operator_id`, `data_id`, `ip_hash`) VALUES ('".DBManager::RealEscape($id=getId(32))."', ".intval($row["time"]).", '".DBManager::RealEscape($row["chat_id"])."', '".DBManager::RealEscape($row["user_id"])."', '".DBManager::RealEscape($row["internal_id"])."','".DBManager::RealEscape($hash)."','".DBManager::RealEscape(md5($row["ip"]))."');");
            $_link->Query(true,"INSERT INTO `".DBManager::RealEscape($_prefix)."feedback_criteria` (`fid`, `cid`, `value`) VALUES ('".DBManager::RealEscape($id)."', 'd0', '".DBManager::RealEscape($row["qualification"])."');");
            $_link->Query(true,"INSERT INTO `".DBManager::RealEscape($_prefix)."feedback_criteria` (`fid`, `cid`, `value`) VALUES ('".DBManager::RealEscape($id)."', 'd1', '".DBManager::RealEscape($row["politeness"])."');");

            if($max_fb_time==null)
                $max_fb_time = $row["time"];
        }
    }
    if($max_fb_time==null)
        $max_fb_time = time();

    CacheManager::WriteDataUpdateTime(DATA_UPDATE_KEY_FEEDBACKS,false,$_link,$_prefix,intval($max_fb_time)*1000);
    CacheManager::WriteDataUpdateTime(DATA_UPDATE_KEY_FILTERS,false,$_link,$_prefix,intval(time())*1000);
    return $res;
}

function up_5401_5402($_prefix,$_link,$_engine)
{
    $commands[] = array(1054,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitors` CHANGE `browser` `browser` INT( 11 ) UNSIGNED NOT NULL DEFAULT '0';");
    $commands[] = array(1054,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitors` CHANGE `system` `system` INT( 11 ) UNSIGNED NOT NULL DEFAULT '0';");
    $commands[] = array(1054,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitors` CHANGE `visits` `visits` INT( 11 ) UNSIGNED NOT NULL DEFAULT '0';");
    $commands[] = array(1054,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitors` CHANGE `resolution` `resolution` INT( 11 ) UNSIGNED NOT NULL DEFAULT '0';");
    $res = processCommandList($commands,$_link);
    return $res;
}

function up_5305_5400($_prefix,$_link,$_engine)
{
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs_chats` ADD `group_id` VARCHAR( 32 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '' AFTER `user_id`;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs_chats` DROP PRIMARY KEY,ADD PRIMARY KEY ( `year` , `month` , `day` , `user_id` , `hour` , `group_id` );");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs_availabilities` ADD `group_id` VARCHAR( 32 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '' AFTER `user_id`;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs_availabilities` DROP PRIMARY KEY ,ADD PRIMARY KEY ( `year` , `month` , `day` , `user_id` , `hour` , `status` , `group_id` );");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs_chats` ADD `invites` INT NOT NULL DEFAULT '0';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs_chats` ADD `invites_auto` INT NOT NULL DEFAULT '0';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs_chats` ADD `invites_accepted` INT NOT NULL DEFAULT '0';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs_chats` ADD `invites_declined` INT NOT NULL DEFAULT '0';");
    $commands[] = array(1054,"ALTER TABLE `".DBManager::RealEscape($_prefix)."groups` CHANGE `pre_chat_html` `pre_chat_js` TEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL;");
    $commands[] = array(1054,"ALTER TABLE `".DBManager::RealEscape($_prefix)."groups` CHANGE `post_chat_html` `post_chat_js` TEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL;");
    $commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."stats_aggs_tickets` (`year` smallint(5) unsigned NOT NULL DEFAULT '0',  `month` tinyint(3) unsigned NOT NULL DEFAULT '0',  `day` tinyint(3) unsigned NOT NULL DEFAULT '0',  `hour` tinyint(2) unsigned NOT NULL DEFAULT '0',  `user_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',  `amount` int(10) unsigned NOT NULL DEFAULT '0',  `open` int(10) unsigned NOT NULL DEFAULT '0',  `in_progress` int(10) unsigned NOT NULL DEFAULT '0',  `closed` int(10) unsigned NOT NULL DEFAULT '0',  `deleted` int(10) unsigned NOT NULL DEFAULT '0',  `messages` int(10) unsigned NOT NULL DEFAULT '0',  `responses` int(10) unsigned NOT NULL DEFAULT '0',  `avg_response_time` double unsigned NOT NULL DEFAULT '0',  `resolves` int(10) unsigned NOT NULL DEFAULT '0',  `avg_resolve_time` double unsigned NOT NULL DEFAULT '0',  PRIMARY KEY (`year`,`month`,`day`,`user_id`,`hour`)) ENGINE=".$_engine." DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
    $commands[] = array(1054,"ALTER TABLE `".DBManager::RealEscape($_prefix)."predefined` CHANGE `email_ticket` `email_ticket_responder` MEDIUMTEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."predefined` ADD `email_ticket_reply` MEDIUMTEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL AFTER `email_ticket_responder`;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."predefined` CHANGE `subject_ticket` `subject_ticket_responder` VARCHAR( 255 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."predefined` ADD `subject_ticket_reply` VARCHAR( 255 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."predefined` ADD `email_chat_transcript_html` TEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."predefined` ADD `email_ticket_responder_html` TEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."predefined` ADD `email_ticket_reply_html` TEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_archive` ADD `transcript_html` TEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL AFTER `transcript_text`;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."groups` ADD `priority_sleep` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."data_updates` ADD `update_reports` BIGINT( 20 ) UNSIGNED NOT NULL DEFAULT '0';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."tickets` ADD `channel_id` VARCHAR( 32 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."tickets` ADD `channel_conversation_id` VARCHAR( 128 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
    $commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."social_media_channels` (`id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`name` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`group_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`page_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`type` varchar(16) COLLATE utf8_bin NOT NULL DEFAULT '',`stream_type` int(10) unsigned NOT NULL DEFAULT '0',`token` text COLLATE utf8_bin NOT NULL,`token_expire` int(10) unsigned NOT NULL DEFAULT '0',`last_connect` int(10) unsigned NOT NULL DEFAULT '0',`data_since` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`connect_frequency` int(10) unsigned NOT NULL DEFAULT '0',`track` text COLLATE utf8_bin NOT NULL,PRIMARY KEY (`id`)) ENGINE=".$_engine." DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_archive` ADD `ref_url` VARCHAR( 2048 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."filters` ADD `allow_tickets` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."filters` ADD `allow_tracking` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0';");
    $commands[] = array(1054,"ALTER TABLE `".DBManager::RealEscape($_prefix)."filters` CHANGE `activelanguage` `countries` TEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL;");
    $commands[] = array(1050,"UPDATE `".DBManager::RealEscape($_prefix)."filters` SET `countries`='';");
    $commands[] = array(1091,"ALTER TABLE `".DBManager::RealEscape($_prefix)."filters` DROP `activeipaddress`;");
    $commands[] = array(1091,"ALTER TABLE `".DBManager::RealEscape($_prefix)."filters` DROP `activevisitorid`;");
    $commands[] = array(1054,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operators` CHANGE `login_id` `client_system_id` VARCHAR( 32 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operators` ADD `token` VARCHAR( 32 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '' AFTER `client_system_id`;");
    $commands[] = array(1091,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operators` DROP `password_change`;");
    $commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_archive` ADD INDEX `internal_id` ( `internal_id` )");
    $res = processCommandList($commands,$_link);
    return $res;
}

function up_5300_5301($_prefix,$_link)
{
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operators` ADD `max_chats` INT NOT NULL DEFAULT '0';");
    $res = processCommandList($commands,$_link);
    return $res;
}

function up_5252_5300($_prefix,$_link)
{
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."auto_replies` ADD `inactivity_internal` INT NOT NULL DEFAULT '-1';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."auto_replies` ADD `inactivity_external` INT NOT NULL DEFAULT '-1';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."auto_replies` ADD `inactivity_close` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."auto_replies` ADD `title` VARCHAR( 255 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_browser_urls` ADD `area_code` VARCHAR( 255 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
    $commands[] = array(1091,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_data_pages` DROP `area_code`;");
    $commands[] = array(1051,"DROP TABLE `".DBManager::RealEscape($_prefix)."visitor_data_area_codes`;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."ticket_emails` ADD `body_html` LONGTEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_data_pages` CHANGE `id` `id` BIGINT( 10 ) UNSIGNED NOT NULL AUTO_INCREMENT;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_data_domains` CHANGE `id` `id` BIGINT( 10 ) UNSIGNED NOT NULL AUTO_INCREMENT;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."groups` ADD `chat_inputs_cap` TEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL AFTER `ticket_inputs_masked`;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."groups` ADD `ticket_inputs_cap` TEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL AFTER `chat_inputs_cap`;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."groups` ADD `priorities` TEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL;");
    $res = processCommandList($commands,$_link);
    return $res;
}

function up_5201_5250($_prefix,$_link)
{
    $commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."data_cache` (`key` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`data` longtext COLLATE utf8_bin NOT NULL,`time` int(11) NOT NULL DEFAULT '0', PRIMARY KEY (`key`)) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_forwards` ADD `auto` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_forwards` ADD `closed` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."groups` ADD `ticket_assignment` TEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."group_members` ADD `persistent` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0';");
    $res = processCommandList($commands,$_link);
    return $res;
}

function up_5123_5200($_prefix,$_link)
{
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."tickets` ADD `last_update` INT( 10 ) UNSIGNED NOT NULL DEFAULT '0';");
    $commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."tickets` ADD INDEX `last_update` ( `last_update` );");
    $commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."tickets` ADD INDEX `deleted` ( `deleted` );");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."tickets` ADD `wait_begin` INT( 10 ) NOT NULL DEFAULT '2000000000';");
    $commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."tickets` ADD INDEX `wait_begin` ( `wait_begin` );");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_chats` ADD `translation` varchar( 16 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operators` ADD `mobile_ex` TEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL;");
    $commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."data_updates` (`update_tickets` bigint(20) unsigned NOT NULL DEFAULT '0',`update_archive` bigint(20) unsigned NOT NULL DEFAULT '0',`update_ratings` bigint(20) unsigned NOT NULL DEFAULT '0',`update_emails` bigint(20) unsigned NOT NULL DEFAULT '0',`update_events` bigint(20) unsigned NOT NULL DEFAULT '0',`update_vouchers` bigint(20) unsigned NOT NULL DEFAULT '0',`update_filters` bigint(20) unsigned NOT NULL DEFAULT '0') ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
    $commands[] = array(0,"UPDATE `".DBManager::RealEscape($_prefix)."data_updates` SET `update_tickets`=UNIX_TIMESTAMP(),`update_archive`=UNIX_TIMESTAMP(),`update_ratings`=UNIX_TIMESTAMP(),`update_emails`=UNIX_TIMESTAMP(),`update_events`=UNIX_TIMESTAMP(),`update_vouchers`=UNIX_TIMESTAMP(),`update_filters`=UNIX_TIMESTAMP();");
    $commands[] = array(1050,"ALTER TABLE `".DBManager::RealEscape($_prefix)."ticket_attachments` CHANGE `parent_id` `parent_id` VARCHAR( 255 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
    $commands[] = array(1091,"ALTER TABLE `".DBManager::RealEscape($_prefix)."ticket_attachments` DROP INDEX `parent_id`;");
    $commands[] = array(1091,"ALTER TABLE `".DBManager::RealEscape($_prefix)."ticket_attachments` DROP PRIMARY KEY ,ADD PRIMARY KEY ( `res_id` , `parent_id` );");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."ticket_logs` ADD `message_id` varchar( 32 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
    $commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."visitor_comments` (`id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`visitor_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`created` int(10) unsigned NOT NULL DEFAULT '0',`operator_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`comment` text COLLATE utf8_bin NOT NULL,PRIMARY KEY (`id`),KEY `visitor_id` (`visitor_id`),KEY `created` (`created`)) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
    $commands[] = array(1050,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_requests` CHANGE `canceled` `canceled` VARCHAR( 32 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
    $commands[] = array(0,"UPDATE `".DBManager::RealEscape($_prefix)."chat_requests` SET `canceled`='';");
    $commands[] = array(1091,"ALTER TABLE `".DBManager::RealEscape($_prefix)."groups` DROP `hide_chat_group_selection` ,DROP `hide_ticket_group_selection` ;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."groups` ADD `chat_inputs_masked` TEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL AFTER `ticket_inputs_required`");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."groups` ADD `ticket_inputs_masked` TEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL AFTER `chat_inputs_masked`");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."groups` ADD `chat_email_out` varchar( 32 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."mailboxes` ADD `framework` varchar( 16 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT 'ZEND';");
    $commands[] = array(0,"UPDATE `".DBManager::RealEscape($_prefix)."mailboxes` SET `authentication`='Yes' WHERE `authentication`='' OR `type`='SMTP';");
    $commands[] = array(1050,"ALTER TABLE `".DBManager::RealEscape($_prefix)."ticket_messages` CHANGE `subject` `subject` VARCHAR( 512 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
    $commands[] = array(1091,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operator_logins` DROP PRIMARY KEY;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operator_logins` ADD PRIMARY KEY (`user_id`,`password`);");
    $commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."config` (`key` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`value` text COLLATE utf8_bin NOT NULL,PRIMARY KEY (`key`)) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");

    $fkeys = array(1=>array("com_chat_vouchers","group_members","com_chat_localizations","overlay_boxes","visitor_browsers","event_action_receivers","website_pushs","event_actions","event_urls","alerts","visitor_chats","ticket_editors","visitor_browser_urls","event_action_overlays","event_action_website_pushs","chat_forwards","event_triggers","visitor_chat_operators","event_funnels","stats_aggs_goals","ticket_customs","visitor_goals","chat_files","ticket_messages","event_goals","stats_aggs_pages","chat_requests"),2=>array("event_funnels","event_goals"));
    foreach($fkeys as $count => $keys)
        foreach($keys as $key)
            $commands[] = array(0,"ALTER TABLE `".DBManager::RealEscape($_prefix).$key."` DROP FOREIGN KEY `".DBManager::RealEscape($_prefix).$key."_ibfk_".$count."`;");

    $res = processCommandList($commands,$_link);
    return $res;
}

function up_5122_5123($_prefix,$_link)
{
    $commands[] = array(0,"ALTER IGNORE TABLE `".DBManager::RealEscape($_prefix)."chat_archive` ADD PRIMARY KEY `chat_id` (`chat_id`)");
    $res = processCommandList($commands,$_link);
    return $res;
}

function up_5100_5110($_prefix,$_link)
{
    $commands[] = array(1050,"ALTER TABLE `".DBManager::RealEscape($_prefix)."resources` CHANGE `owner` `owner` VARCHAR( 32 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL;");
    $commands[] = array(1050,"ALTER TABLE `".DBManager::RealEscape($_prefix)."resources` CHANGE `editor` `editor` VARCHAR( 32 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL;");
    $commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."push_messages` (`id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`created` int(10) unsigned NOT NULL DEFAULT '0',`device_id` varchar(4096) COLLATE utf8_bin NOT NULL DEFAULT '',`device_hash` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`device_os` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`chat_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`chat_partner_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`push_key` tinyint(3) unsigned NOT NULL DEFAULT '0',`push_value` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '', `IP` varchar(64) COLLATE utf8_bin NOT NULL DEFAULT '', `sent` tinyint(1) unsigned NOT NULL DEFAULT '0', PRIMARY KEY (`id`), UNIQUE KEY `IP` (`IP`,`device_hash`), UNIQUE KEY `chat_id` (`chat_id`,`device_hash`)) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operators` ADD `mobile_os` varchar( 32 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operators` ADD `mobile_device_id` varchar( 4096 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operators` ADD `mobile_background` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0';");
    $res = processCommandList($commands,$_link);
    return $res;
}

function up_5014_5100($_prefix,$_link)
{
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_archive` ADD `chat_type` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '1';");
    $commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_archive` ADD INDEX `chat_type` ( `chat_type` );");
    $commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."ticket_logs` (`created` int(10) unsigned NOT NULL DEFAULT '0',`time` int(10) unsigned NOT NULL DEFAULT '0',`ticket_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`operator_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '', `action` smallint(5) unsigned NOT NULL DEFAULT '0', `value_old` text COLLATE utf8_bin NOT NULL, `value_new` text COLLATE utf8_bin NOT NULL, PRIMARY KEY (`created`), KEY `time` (`time`), KEY `ticket_id` (`ticket_id`)) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
    $commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."ticket_comments` (`id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '', `created` int(10) unsigned NOT NULL DEFAULT '0',`time` int(10) unsigned NOT NULL DEFAULT '0', `ticket_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '', `message_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '', `operator_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '', `comment` text COLLATE utf8_bin NOT NULL, PRIMARY KEY (`id`), KEY `ticket_id` (`ticket_id`), KEY `created` (`created`), KEY `time` (`time`)) ENGINE=MyISAM DEFAULT CHARSET=utf8 CHECKSUM=0 COLLATE=utf8_bin;");
    $commands[] = array(1050,"RENAME TABLE `".DBManager::RealEscape($_prefix)."bot_feeds` TO `".DBManager::RealEscape($_prefix)."auto_replies`;");
    $commands[] = array(1054,"ALTER TABLE `".DBManager::RealEscape($_prefix)."auto_replies` CHANGE `bot_id` `owner_id` VARCHAR( 32 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
    $commands[] = array(1091,"ALTER TABLE `".DBManager::RealEscape($_prefix)."auto_replies` DROP INDEX `bot_id`");
    $commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."auto_replies` ADD INDEX `owner_id` ( `owner_id` );");
    $commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."auto_replies` ADD INDEX `search_type` ( `search_type` );");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."auto_replies` ADD `send` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '1';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."auto_replies` ADD `waiting` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."ticket_messages` ADD `subject` varchar( 255 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
    $commands[] = array(0,"ALTER TABLE `".DBManager::RealEscape($_prefix)."profile_pictures` ADD INDEX `time` ( `time` );");
    $commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_forwards` ADD INDEX `received` ( `received` );");
    $commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_forwards` ADD INDEX `created` ( `created` );");
    $commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."signatures` ADD INDEX `operator_id` ( `operator_id` );");
    $commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."resources` ADD INDEX `parentid` ( `parentid` );");
    $commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_archive` ADD INDEX `endtime` ( `endtime` );");
    $commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_archive` ADD INDEX `transcript_sent` ( `transcript_sent` );");
    $res = processCommandList($commands,$_link);
    return $res;
}

function up_4205_5000($_prefix,$_link)
{
	$commands[] = array(1050,"ALTER TABLE `".DBManager::RealEscape($_prefix)."ticket_messages` CHANGE `id` `id` VARCHAR( 32 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
	$commands[] = array(1054,"ALTER TABLE `".DBManager::RealEscape($_prefix)."ticket_editors` CHANGE `internal_fullname` `editor_id` VARCHAR( 32 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."ticket_messages` ADD `type` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0';");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."ticket_messages` ADD `sender_id` VARCHAR( 32 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."ticket_messages` ADD `channel_id` VARCHAR( 255 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
	$commands[] = array(0,"UPDATE `".DBManager::RealEscape($_prefix)."ticket_messages` SET `channel_id`=`id`;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."ticket_messages` ADD `created` INT UNSIGNED NOT NULL DEFAULT '0' AFTER `time`;");
    $commands[] = array(0,"UPDATE `".DBManager::RealEscape($_prefix)."ticket_messages` SET `created`=`time`;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."ticket_customs` ADD `message_id` VARCHAR( 32 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '' AFTER `ticket_id`;");
    $commands[] = array(0,"UPDATE `".DBManager::RealEscape($_prefix)."ticket_customs` SET `message_id`=`ticket_id`;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."ticket_customs` DROP PRIMARY KEY ,ADD PRIMARY KEY ( `ticket_id` , `custom_id` , `message_id` );");
    $commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."ticket_messages` ADD UNIQUE `channel_id` (`channel_id`);");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."tickets` ADD `hash` VARCHAR( 32 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."tickets` ADD `creation_type` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."tickets` ADD `iso_language` VARCHAR( 5 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."tickets` ADD `deleted` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0';");
    $commands[] = array(0,"UPDATE `".DBManager::RealEscape($_prefix)."tickets` SET `iso_language`='en' WHERE `iso_language`='';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."groups` ADD `ticket_email_out` VARCHAR( 32 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."groups` ADD `ticket_email_in` TEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."groups` ADD `ticket_handle_unknown` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."resources` ADD `tags` VARCHAR( 255 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."signatures` (`id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '', `name` varchar(256) COLLATE utf8_bin NOT NULL DEFAULT '', `signature` text COLLATE utf8_bin NOT NULL, `operator_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '', `group_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '', `default` tinyint(1) unsigned NOT NULL DEFAULT '0', PRIMARY KEY (`id`)) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."ticket_emails` (`email_id` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '', `mailbox_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`sender_email` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '',`sender_name` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '',`sender_replyto` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '',`receiver_email` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '',`created` int(10) unsigned NOT NULL DEFAULT '0',`edited` int(10) unsigned NOT NULL DEFAULT '0',`deleted` tinyint(1) unsigned NOT NULL DEFAULT '0',`subject` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '',`body` text COLLATE utf8_bin NOT NULL, `group_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`editor_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '', PRIMARY KEY (`email_id`,`group_id`), KEY `mailbox_id` (`mailbox_id`), KEY `edited` (`edited`)) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."ticket_attachments` (`res_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '', `parent_id` varchar(128) COLLATE utf8_bin NOT NULL DEFAULT '', PRIMARY KEY (`res_id`), KEY `parent_id` (`parent_id`)) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
    $commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."mailboxes` (`id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '', `email` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '', `exec_operator_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '', `username` varchar(128) COLLATE utf8_bin NOT NULL DEFAULT '', `password` varchar(128) COLLATE utf8_bin NOT NULL DEFAULT '', `type` varchar(16) COLLATE utf8_bin NOT NULL DEFAULT '', `host` varchar(128) COLLATE utf8_bin NOT NULL DEFAULT '', `port` mediumint(8) unsigned NOT NULL DEFAULT '0', `delete` smallint(5) NOT NULL DEFAULT '-1', `authentication` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '', `sender_name` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '', `ssl` tinyint(1) unsigned NOT NULL DEFAULT '0', `default` tinyint(1) unsigned NOT NULL DEFAULT '0',`last_connect` int(10) unsigned NOT NULL DEFAULT '0',`connect_frequency` int(10) unsigned NOT NULL DEFAULT '0', PRIMARY KEY (`id`)) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
    $commands[] = array(1050,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs` CHANGE `aggregated` `aggregated` INT( 10 ) UNSIGNED NOT NULL DEFAULT '0';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."predefined` ADD `subject_chat_transcript` VARCHAR( 255 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."predefined` ADD `subject_ticket` VARCHAR( 255 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT 'Your Message';");
    $commands[] = array(1054,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_archive` CHANGE `plain` `transcript_text` LONGTEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_archive` ADD `plaintext` LONGTEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL AFTER `html`;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_archive` ADD `wait` INT( 10 ) UNSIGNED NOT NULL DEFAULT '0';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_archive` ADD `accepted` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '3';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_archive` ADD `ended` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '2';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."ticket_editors` ADD `group_id` VARCHAR( 32 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
    $commands[] = array(1050,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operators` CHANGE `permissions` `permissions` VARCHAR( 48 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operators` ADD `lweb` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operators` ADD `lapp` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0';");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."ratings` ADD `chat_id` VARCHAR( 64 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
    $commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."ratings` ADD INDEX `chat_id` ( `chat_id` );");
    $commands[] = array(0,"ALTER TABLE `".DBManager::RealEscape($_prefix)."ticket_messages` DROP FOREIGN KEY `".DBManager::RealEscape($_prefix)."ticket_messages_ibfk_1`;");
    $commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."ticket_messages` ADD `hash` VARCHAR( 32 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
    $commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."ticket_messages` ADD INDEX `hash` ( `hash` );");
    $res = processCommandList($commands,$_link);
	return $res;
}

function up_4201_4202($_prefix,$_link)
{
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operators` ADD `wm` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0';");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operators` ADD `wmohca` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0';");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_posts` ADD `browser_id` varchar(16) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs_chats` ADD `multi` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0';");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_chat_operators` ADD `alloc` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '1';");
	$res = processCommandList($commands,$_link);
	return $res;
}

function up_4200_4201($_prefix,$_link)
{
	$commands[] = array(1091,"ALTER TABLE `".DBManager::RealEscape($_prefix)."bot_feeds` DROP INDEX `resource_id`");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."bot_feeds` ADD `language` varchar(7) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
	$res = processCommandList($commands,$_link);
	return $res;
}

function up_4104_4200($_prefix,$_link)
{
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_chats` ADD `chat_ticket_id` VARCHAR( 32 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."predefined` ADD UNIQUE `group_id_2` ( `group_id` ,`lang_iso` ,`internal_id`);");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."groups` ADD `chat_vouchers_required` TEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_browsers` ADD `phone` VARCHAR( 255 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_browsers` ADD `overlay` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0';");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_browsers` ADD `overlay_container` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0';");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_chats` ADD `phone` VARCHAR( 255 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '' AFTER `company`;");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_chats` ADD `call_me_back` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0' AFTER `phone`;");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_archive` ADD `phone` VARCHAR( 255 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '' AFTER `company`;");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_archive` ADD `call_me_back` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0' AFTER `phone`;");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."predefined` ADD `welcome_call_me_back` MEDIUMTEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL AFTER `welcome`;");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."predefined` ADD `call_me_back_info` MEDIUMTEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL AFTER `chat_info`;");
	$commands[] = array(1050,"ALTER TABLE `".DBManager::RealEscape($_prefix)."predefined` CHANGE `id` `id` VARCHAR( 32 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_archive` ADD `voucher_id` VARCHAR( 32 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_chats` ADD `response_time` INT( 11 ) NOT NULL DEFAULT '0';");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs_chats` ADD `avg_response_time` INT( 11 ) NOT NULL DEFAULT '0';");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_chat_operators` ADD `jtime` INT( 11 ) NOT NULL DEFAULT '0' AFTER `ltime`;");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_chats` ADD `chat_posts` INT( 11 ) NOT NULL DEFAULT '0';");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_chats` ADD `queue_posts` TEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL;");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_chats` ADD `init_chat_with` VARCHAR( 32 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."groups` ADD `pre_chat_html` TEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL;");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."groups` ADD `post_chat_html` TEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL;");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs_chats` ADD `chat_posts` INT( 11 ) NOT NULL DEFAULT '0';");
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_browsers` ADD INDEX `overlay` ( `overlay` );");
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_browsers` ADD INDEX `overlay_container` ( `overlay_container` );");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operators` ADD `bot` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0';");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."administration_log` (`id` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '', `type` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '',  `value` text CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,  `time` int(10) unsigned NOT NULL DEFAULT '0',  `user` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '',  PRIMARY KEY (`id`),  KEY `time` (`time`)) ENGINE=MyISAM DEFAULT CHARSET=utf8;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."bot_feeds` (`id` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '',`resource_id` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '',`bot_id` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '',`tags` varchar(255) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '',`search_type` tinyint(1) unsigned NOT NULL DEFAULT '0',`answer` text CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,`new_window` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0', PRIMARY KEY (`id`), UNIQUE KEY `resource_id` (`resource_id`,`bot_id`),  KEY `tags` (`tags`),  KEY `bot_id` (`bot_id`)) ENGINE=MyISAM DEFAULT CHARSET=utf8;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."com_chat_localizations` ( `id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '', `tid` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '', `language` varchar(5) COLLATE utf8_bin NOT NULL DEFAULT '',  `title` text COLLATE utf8_bin NOT NULL,  `description` text COLLATE utf8_bin NOT NULL,  `terms` longtext COLLATE utf8_bin NOT NULL,`email_voucher_created` text COLLATE utf8_bin NOT NULL,`email_voucher_paid` text COLLATE utf8_bin NOT NULL,`email_voucher_update` text COLLATE utf8_bin NOT NULL,`extension_request` text COLLATE utf8_bin NOT NULL,PRIMARY KEY (`id`),KEY `tid` (`tid`)) ENGINE=MyISAM DEFAULT CHARSET=utf8 CHECKSUM=0 COLLATE=utf8_bin;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."com_chat_providers` (`id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`name` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`account` varchar(128) COLLATE utf8_bin NOT NULL DEFAULT '',`URL` varchar(256) COLLATE utf8_bin NOT NULL DEFAULT '',`logo` varchar(256) COLLATE utf8_bin NOT NULL DEFAULT '',PRIMARY KEY (`id`)) ENGINE=MyISAM DEFAULT CHARSET=utf8 CHECKSUM=0 COLLATE=utf8_bin;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."com_chat_vouchers` (`id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`extends` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`tid` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`email` varchar(128) COLLATE utf8_bin NOT NULL DEFAULT '',`info` text COLLATE utf8_bin NOT NULL,`voided` tinyint(1) unsigned NOT NULL DEFAULT '0',`paid` tinyint(1) unsigned NOT NULL DEFAULT '0',`created` int(10) unsigned NOT NULL DEFAULT '0',`first_used` int(10) unsigned NOT NULL DEFAULT '0',`last_used` int(10) unsigned NOT NULL DEFAULT '0',`expires` int(10) unsigned NOT NULL DEFAULT '0',`edited` int(10) unsigned NOT NULL DEFAULT '0',`chat_time` int(10) unsigned NOT NULL DEFAULT '0',`chat_time_max` int(10) unsigned NOT NULL DEFAULT '0',`chat_sessions` int(10) unsigned NOT NULL DEFAULT '0',`chat_sessions_max` int(10) unsigned NOT NULL DEFAULT '0',`chat_list` text COLLATE utf8_bin NOT NULL,`visitor_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`business_type` tinyint(1) unsigned NOT NULL DEFAULT '0',`company` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '',`tax_id` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '',`firstname` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '',`lastname` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '',`address_1` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '',`address_2` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '',`city` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '',`state` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '',`zip` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '',`country` varchar(5) COLLATE utf8_bin NOT NULL DEFAULT '',`phone` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '',`tn_id` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '',`price` double unsigned NOT NULL DEFAULT '0',`currency` varchar(5) COLLATE utf8_bin NOT NULL DEFAULT '',`vat` double unsigned NOT NULL DEFAULT '0',`payer_id` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '',`payment_details` text COLLATE utf8_bin NOT NULL,`language` varchar(5) COLLATE utf8_bin NOT NULL DEFAULT '',PRIMARY KEY (`id`),KEY `tid` (`tid`),KEY `created` (`created`),KEY `edited` (`edited`)) ENGINE=MyISAM DEFAULT CHARSET=utf8 CHECKSUM=0 COLLATE=utf8_bin;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."com_chat_types` (`id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`number_of_chats` int(10) unsigned NOT NULL DEFAULT '0',`number_of_chats_void` tinyint(1) unsigned NOT NULL DEFAULT '0',`total_length` int(10) unsigned NOT NULL DEFAULT '0',`total_length_void` tinyint(1) unsigned NOT NULL DEFAULT '0',`auto_expire` int(10) unsigned NOT NULL DEFAULT '0',`auto_expire_void` tinyint(1) unsigned NOT NULL DEFAULT '0',`delete` tinyint(1) unsigned NOT NULL DEFAULT '0',`price` double unsigned NOT NULL DEFAULT '0',`currency` varchar(5) COLLATE utf8_bin NOT NULL DEFAULT '',PRIMARY KEY (`id`)) ENGINE=MyISAM DEFAULT CHARSET=utf8 CHECKSUM=0 COLLATE=utf8_bin;");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."ticket_messages` ADD `phone` VARCHAR( 255 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '' AFTER `ip`;");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."ticket_messages` ADD `call_me_back` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0' AFTER `phone`;");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."ticket_messages` ADD `country` VARCHAR( 5 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL;");
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."profile_pictures` ADD INDEX `internal_id` ( `internal_id` );");
	$res = processCommandList($commands,$_link);
	return $res;
}

function up_4102_4103($_prefix,$_link)
{
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."filters` ADD `allow_chats` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0';");
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs_cities` ADD INDEX `city` ( `city` );");
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs_isps` ADD INDEX `isp` ( `isp` );");
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs_referrers` ADD INDEX `referrer` ( `referrer` );");
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs_queries` ADD INDEX `query` ( `query` );");
	$res = processCommandList($commands,$_link);
	return $res;
}

function up_4101_4102($_prefix,$_link)
{
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitors` ADD INDEX `browser` ( `browser` );");
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitors` ADD INDEX `resolution` ( `resolution` );");
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitors` ADD INDEX `language` ( `language` );");
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitors` ADD INDEX `country` ( `country` );");
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitors` ADD INDEX `timezone` ( `timezone` );");
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitors` ADD INDEX `ip` ( `ip` );");
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitors` ADD INDEX `visit_latest` ( `visit_latest` );");
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_browsers` ADD INDEX `created` ( `created` );");
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_browsers` ADD INDEX `last_active` ( `last_active` );");
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_browsers` ADD INDEX `last_update` ( `last_update` );");
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_browsers` ADD INDEX `is_chat` ( `is_chat` );");
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_data_pages` ADD INDEX `path` ( `path` );");
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_data_pages` ADD INDEX `title` ( `title` );");
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_data_pages` ADD INDEX `area_code` ( `area_code` );");
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_data_pages` ADD INDEX `domain` ( `domain` );");
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_data_domains` ADD INDEX `search` ( `search` );");
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_data_domains` ADD INDEX `external` ( `external` );");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_browser_urls` ADD `is_entrance` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0' AFTER `ref_untouched`;");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_browser_urls` ADD `is_exit` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0' AFTER `is_entrance`;");
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_browser_urls` ADD INDEX `is_exit` ( `is_exit` );");
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_browser_urls` ADD INDEX `is_entrance` ( `is_entrance` );");
	$res = processCommandList($commands,$_link);
	return $res;
}

function up_4012_4100($_prefix,$_link)
{
	//$commands[] = array(1146,"TRUNCATE TABLE `".DBManager::RealEscape($_prefix)."operators`;");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operators` ADD `groups` TEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL AFTER `last_chat_allocation`;");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operators` ADD `groups_hidden` TEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL AFTER `groups_status`;");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operators` ADD `fullname` VARCHAR( 255 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '' AFTER `login_id`;");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operators` ADD `description` VARCHAR( 255 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '' AFTER `fullname`;");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operators` ADD `email` VARCHAR( 255 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '' AFTER `fullname`;");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operators` ADD `permissions` VARCHAR( 32 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '' AFTER `email`;");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operators` ADD `webspace` INT( 11 ) UNSIGNED NOT NULL DEFAULT '0' AFTER `permissions`;");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operators` ADD `languages` VARCHAR( 255 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operators` ADD `auto_accept_chats` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0';");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operators` ADD `login_ip_range` VARCHAR( 255 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operators` ADD `password_change` VARCHAR( 32 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '' AFTER `password`;");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operators` ADD `password_change_request` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0';");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operators` ADD `system_id` VARCHAR( 32 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '' AFTER `id`;");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operators` ADD `websites_users` TEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL;");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operators` ADD `websites_config` TEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL;");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operators` ADD `sign_off` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0';");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_goals` ADD `query` INT( 11 ) unsigned NOT NULL DEFAULT '0';");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."groups` ADD `dynamic` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '1';");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."groups` ADD `description` TEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL;");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."groups` ADD `external` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0';");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."groups` ADD `internal` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0';");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."groups` ADD `created` INT( 11 ) UNSIGNED NOT NULL DEFAULT '0';");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."groups` ADD `email` VARCHAR( 255 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."groups` ADD `standard` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0';");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."groups` ADD `opening_hours` TEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL;");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."groups` ADD `functions` VARCHAR( 32 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."groups` ADD `chat_inputs_hidden` TEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL;");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."groups` ADD `ticket_inputs_hidden` TEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL;");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."groups` ADD `chat_inputs_required` TEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL;");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."groups` ADD `ticket_inputs_required` TEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL;");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."groups` ADD `max_chats` INT( 11 ) NOT NULL DEFAULT '0';");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."groups` ADD `hide_chat_group_selection` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0';");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."groups` ADD `hide_ticket_group_selection` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0';");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."groups` ADD `visitor_filters` TEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."images` (`id` INT UNSIGNED NOT NULL DEFAULT '0',`online` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0',`button_type` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`image_type` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`data` LONGTEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL, PRIMARY KEY (`id`,`button_type`,`image_type`,`online`)) ENGINE = MYISAM CHARACTER SET utf8 COLLATE utf8_bin;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."stats_aggs_goals_queries` (`year` smallint(5) unsigned NOT NULL DEFAULT '0',`month` tinyint(3) unsigned NOT NULL DEFAULT '0',`day` tinyint(3) unsigned NOT NULL DEFAULT '0',`goal` int(10) unsigned NOT NULL DEFAULT '0',`query` int(10) unsigned NOT NULL DEFAULT '0',`amount` int(10) unsigned NOT NULL DEFAULT '0',PRIMARY KEY (`year`,`month`,`day`,`goal`,`query`),KEY `target` (`goal`),KEY `query` (`query`)) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_browsers` ADD `pre_message` MEDIUMTEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL;");
	$res = processCommandList($commands,$_link);
	
	// import buttons
	ServerManager::ImportButtons(LIVEZILLA_PATH . "banner/",$_prefix,$_link);
	
	return $res;
}

function up_4000_4010($_prefix,$_link)
{
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_posts` ADD `sender_name` VARCHAR( 255 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '' AFTER `repost`;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."groups` (`id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`name` varchar(64) COLLATE utf8_bin NOT NULL DEFAULT '',`owner` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',PRIMARY KEY (`id`)) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."group_members` (`user_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`group_id` varchar(32) COLLATE utf8_bin NOT NULL,PRIMARY KEY (`user_id`,`group_id`),KEY `group_id` (`group_id`)) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
	//$commands[] = array(1005,"ALTER TABLE `".DBManager::RealEscape($_prefix)."group_members` ADD CONSTRAINT `".DBManager::RealEscape($_prefix)."group_members_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `".DBManager::RealEscape($_prefix)."groups` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."predefined` ADD `queue_message` MEDIUMTEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL AFTER `email_ticket`;");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."predefined` ADD `queue_message_time` INT( 11 ) UNSIGNED NOT NULL DEFAULT '0' AFTER `queue_message`;");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_chats` ADD `queue_message_shown` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0' AFTER `exit`;");
	$commands[] = array(1050,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_archive` CHANGE `fullname` `fullname` VARCHAR( 255 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
	$commands[] = array(1050,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_archive` CHANGE `area_code` `area_code` VARCHAR( 255 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
	$commands[] = array(1050,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_archive` CHANGE `email` `email` VARCHAR( 255 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
	$commands[] = array(1050,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_archive` CHANGE `company` `company` VARCHAR( 255 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
	return processCommandList($commands,$_link);
}

function up_3400_4000($_prefix,$_link)
{
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."predefined` ADD `email_chat_transcript` MEDIUMTEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL AFTER `editable`;");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."predefined` ADD `email_ticket` MEDIUMTEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL AFTER `email_chat_transcript`;");
	$commands[] = array(0,"UPDATE `".DBManager::RealEscape($_prefix)."predefined` SET `email_chat_transcript`='".DBManager::RealEscape("Chat Transcript\r\n%website_name% / %group_description%\r\n\r\nDate: %localdate%\r\n-------------------------------------------------------------\r\n%details%\r\nChat reference number: %chat_id%\r\n-------------------------------------------------------------\r\n%mailtext%")."' WHERE `internal_id`='';");
	$commands[] = array(0,"UPDATE `".DBManager::RealEscape($_prefix)."predefined` SET `email_chat_transcript`='".DBManager::RealEscape("Mitschrift Ihres Chats\r\n%website_name% / %group_description%\r\n\r\nDatum: %localdate%\r\n-------------------------------------------------------------\r\n%details%\r\nChat Referenz-Nummer: %chat_id%\r\n-------------------------------------------------------------\r\n%mailtext%")."' WHERE `internal_id`='' AND `lang_iso`='DE';");
	$commands[] = array(0,"UPDATE `".DBManager::RealEscape($_prefix)."predefined` SET `email_ticket`='".DBManager::RealEscape("Thank you, we have received your message!\r\nWe will get in touch with you as soon as possible.\r\n-------------------------------------------------------------\r\nDate: %localdate%\r\n-------------------------------------------------------------\r\n%details%\r\nGroup: %group_description%\r\n-------------------------------------------------------------\r\n%mailtext%")."' WHERE `internal_id`='';");
	$commands[] = array(0,"UPDATE `".DBManager::RealEscape($_prefix)."predefined` SET `email_ticket`='".DBManager::RealEscape("Vielen Dank, wir haben Ihre Nachricht erhalten und werden uns umgehend mit Ihnen in Verbindung setzen.\r\n-------------------------------------------------------------\r\nDatum: %localdate%\r\n-------------------------------------------------------------\r\n%details%\r\nAbteilung: %group_description%\r\n-------------------------------------------------------------\r\n%mailtext%")."' WHERE `internal_id`='' AND `lang_iso`='DE';");
	$commands[] = array(1050,"ALTER TABLE `".DBManager::RealEscape($_prefix)."event_action_overlays` CHANGE `background_opacity` `background_opacity` DOUBLE UNSIGNED NOT NULL DEFAULT '0';");
	$commands[] = array(1050,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_chats` CHANGE `question` `question` TEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL;");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_chats` ADD `archive_created` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0' AFTER `allocated`;");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_posts` DROP PRIMARY KEY ,ADD PRIMARY KEY ( `id` , `receiver`, `micro` );");
	$commands[] = array(0,"UPDATE `".DBManager::RealEscape($_prefix)."chat_archive` SET `endtime`=`closed` WHERE `endtime`=0;");
	$commands[] = array(1050,"ALTER TABLE `".DBManager::RealEscape($_prefix)."ticket_messages` CHANGE `fullname` `fullname` VARCHAR( 255 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
	$commands[] = array(1050,"ALTER TABLE `".DBManager::RealEscape($_prefix)."ticket_messages` CHANGE `email` `email` VARCHAR( 255 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
	$commands[] = array(1050,"ALTER TABLE `".DBManager::RealEscape($_prefix)."ticket_messages` CHANGE `company` `company` VARCHAR( 255 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
	$commands[] = array(1050,"ALTER TABLE `".DBManager::RealEscape($_prefix)."ticket_messages` CHANGE `ip` `ip` VARCHAR( 64 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
	$commands[] = array(1050,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitors` CHANGE `ip` `ip` VARCHAR( 64 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
	$commands[] = array(1050,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_archive` CHANGE `ip` `ip` VARCHAR( 64 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
	$commands[] = array(1050,"ALTER TABLE `".DBManager::RealEscape($_prefix)."filters` CHANGE `ip` `ip` VARCHAR( 64 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
	$commands[] = array(1050,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operators` CHANGE `ip` `ip` VARCHAR( 64 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
	$commands[] = array(1050,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operators` CHANGE `typing` `typing` VARCHAR( 32 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
	$commands[] = array(1050,"ALTER TABLE `".DBManager::RealEscape($_prefix)."ratings` CHANGE `ip` `ip` VARCHAR( 64 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
	$commands[] = array(1050,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operator_logins` CHANGE `ip` `ip` VARCHAR( 64 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
	return processCommandList($commands,$_link);
}

function up_3322_3400($_prefix,$_link)
{
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."event_action_overlays` ADD `shadow` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0',ADD `shadow_x` TINYINT NOT NULL DEFAULT '0',ADD `shadow_y` TINYINT NOT NULL DEFAULT '0',ADD `shadow_blur` TINYINT UNSIGNED NOT NULL DEFAULT '0',ADD `shadow_color` VARCHAR( 6 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '',ADD `width` INT UNSIGNED NOT NULL DEFAULT '0',ADD `height` INT UNSIGNED NOT NULL DEFAULT '0',ADD `background` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0',ADD `background_opacity` DECIMAL UNSIGNED NOT NULL DEFAULT '0',ADD `background_color` VARCHAR( 6 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."overlay_boxes` (`id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '', `created` int(10) unsigned NOT NULL DEFAULT '0', `receiver_user_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',  `receiver_browser_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '', `event_action_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '', `url` text COLLATE utf8_bin NOT NULL, `content` text COLLATE utf8_bin NOT NULL, `displayed` tinyint(1) unsigned NOT NULL DEFAULT '0', `closed` tinyint(1) unsigned NOT NULL DEFAULT '0', PRIMARY KEY (`id`)) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."overlay_boxes` ADD INDEX `receiver_browser_id` ( `receiver_browser_id` );");
	//$commands[] = array(1005,"ALTER TABLE `".DBManager::RealEscape($_prefix)."overlay_boxes` ADD CONSTRAINT `".DBManager::RealEscape($_prefix)."overlay_boxes_ibfk_1` FOREIGN KEY (`receiver_browser_id`) REFERENCES `".DBManager::RealEscape($_prefix)."visitor_browsers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_archive` ADD `subject` TEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL;");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."events` ADD `save_cookie` TINYINT UNSIGNED NOT NULL DEFAULT '0';");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operators` ADD `groups_status` TEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL;");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operators` ADD `reposts` TEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL;");
	$commands[] = array(1050,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitors` CHANGE `city` `city` INT UNSIGNED NOT NULL DEFAULT '0';");
	$commands[] = array(1050,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitors` CHANGE `region` `region` INT UNSIGNED NOT NULL DEFAULT '0';");
	$commands[] = array(1050,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitors` CHANGE `isp` `isp` INT UNSIGNED NOT NULL DEFAULT '0';");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_browser_urls` ADD `title` TEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL;");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_chat_operators` ADD `status` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0';");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_chat_operators` ADD `ltime` INT( 11 ) UNSIGNED NOT NULL DEFAULT '0' AFTER `dtime`;");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_browser_urls` ADD `ref_untouched` text COLLATE utf8_bin NOT NULL;");
	$commands[] = array(1091,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_forwards` DROP `conversation`;");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_forwards` ADD `initiator_operator_id` VARCHAR( 32 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '' AFTER `created`;");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_posts` ADD `receiver_original` VARCHAR( 32 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '' AFTER `receiver_group`;");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_forwards` ADD `invite` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0';");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_chats` ADD `priority` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '2' AFTER `chat_id`;");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_posts` DROP PRIMARY KEY ,ADD PRIMARY KEY ( `id` , `receiver` );");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_posts` ADD `repost` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0';");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_requests` ADD `canceled` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0';");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."predefined` ADD `chat_info` MEDIUMTEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL AFTER `website_push_auto`;");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."predefined` ADD `ticket_info` MEDIUMTEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL AFTER `chat_info`;");
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."event_action_internals` ADD INDEX `created`( `created` );",true);
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."event_action_internals` ADD INDEX `receiver_user_id`( `receiver_user_id` );",true);
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitors` ADD INDEX `id` ( `id` );",true);
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitors` ADD INDEX `signature`( `signature` );",true);
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitors` ADD INDEX `city` ( `city` );",true);
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitors` ADD INDEX `region` ( `region` );",true);
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitors` ADD INDEX `isp` ( `isp` );",true);
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitors` ADD INDEX `system` ( `system` );",true);
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitors` ADD INDEX `resolution` ( `resolution` );",true);
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitors` ADD INDEX `entrance` ( `entrance` );",true);
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitors` ADD INDEX `last_active` ( `last_active` );",true);
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_browsers` ADD INDEX `visitor_id` ( `visitor_id` );",true);
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_browsers` ADD INDEX `query` ( `query` );",true);
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_browser_urls` ADD INDEX `url` ( `url` );",true);
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_browser_urls` ADD INDEX `entrance` ( `entrance` );",true);
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_browser_urls` ADD INDEX `referrer` ( `referrer` );",true);
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_chats` ADD INDEX `exit` ( `exit` );",true);
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_chat_operators` ADD INDEX `user_id` ( `user_id` );",true);
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_data_titles` ADD INDEX `confirmed` ( `confirmed` );",true);
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."resources` ADD INDEX `edited`  ( `edited` );",true);
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs` ADD INDEX `aggregated`  ( `aggregated` );",true);
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs` ADD INDEX `time`  ( `time` );",true);
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs` ADD INDEX `mtime`  ( `mtime` );",true);
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs_pages_exit` ADD INDEX `url`  ( `url` );",true);
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs_pages_entrance` ADD INDEX `url` ( `url` );",true);
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operator_status` ADD INDEX `time` ( `time` );",true);
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operator_status` ADD INDEX `internal_id` ( `internal_id` );",true);
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_archive` ADD INDEX `closed` ( `closed` );",true);
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."ticket_messages` ADD INDEX `time` ( `time` );",true);
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."ticket_editors` ADD INDEX `time` ( `time` );",true);
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."ratings` ADD INDEX `time` ( `time` );",true);
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."goals` ADD INDEX `ind` ( `ind` );",true);
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_files` ADD INDEX `operator_id` ( `operator_id` );",true);
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."predefined` ADD INDEX `internal_id` ( `internal_id` );",true);
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."predefined` ADD INDEX `group_id` ( `group_id` );",true);
	return processCommandList($commands,$_link);
}

function up_3313_3320($_prefix,$_link)
{
	$commands[] = array(1050,"RENAME TABLE `".DBManager::RealEscape($_prefix)."event_action_invitations` TO `".DBManager::RealEscape($_prefix)."event_action_overlays`;");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."events` ADD `search_phrase` VARCHAR( 255 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
	return processCommandList($commands,$_link);
}

function up_3311_3312($_prefix,$_link)
{
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_posts` ADD `translation_iso` VARCHAR( 10 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '' AFTER `translation`;");
	$commands[] = array(1050,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_archive` CHANGE `endtime` `endtime` INT( 11 ) UNSIGNED NOT NULL DEFAULT '0';");
	$commands[] = array(1050,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_archive` CHANGE `closed` `closed` INT( 11 ) UNSIGNED NOT NULL DEFAULT '0';");
	return processCommandList($commands,$_link);
}

function up_3310_3311($_prefix,$_link)
{
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_browser_urls` ADD `untouched` text COLLATE utf8_bin NOT NULL;");
	return processCommandList($commands,$_link);
}

function up_3300_3310($_prefix,$_link)
{
	$commands[] = array(1050,"ALTER TABLE `".DBManager::RealEscape($_prefix)."stats_aggs_visitors` CHANGE `js` `js` INT UNSIGNED NOT NULL DEFAULT '0';");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_chat_operators` ADD `dtime` INT UNSIGNED NOT NULL DEFAULT '0';");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_archive` ADD `iso_country` VARCHAR( 5 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '' AFTER `iso_language`;");
	$commands[] = array(0,"ALTER TABLE `".DBManager::RealEscape($_prefix)."visitor_goals` DROP FOREIGN KEY `".DBManager::RealEscape($_prefix)."visitor_goals_ibfk_2`;");
	return processCommandList($commands,$_link);
}

function up_3203_3300($_prefix,$_link)
{
	$commands[] = array(1051,"DROP TABLE `".DBManager::RealEscape($_prefix)."chat_rooms`;");
	$commands[] = array(1051,"DROP TABLE `".DBManager::RealEscape($_prefix)."data`;");
	$commands[] = array(1050,"RENAME TABLE `".DBManager::RealEscape($_prefix)."chats` TO `".DBManager::RealEscape($_prefix)."chat_archive`;");
	$commands[] = array(1050,"RENAME TABLE `".DBManager::RealEscape($_prefix)."internal` TO `".DBManager::RealEscape($_prefix)."operator_status`;");
	$commands[] = array(1050,"RENAME TABLE `".DBManager::RealEscape($_prefix)."logins` TO `".DBManager::RealEscape($_prefix)."operator_logins`;");
	$commands[] = array(1146,"TRUNCATE TABLE `".DBManager::RealEscape($_prefix)."alerts`;");
	$commands[] = array(1146,"TRUNCATE TABLE `".DBManager::RealEscape($_prefix)."chat_requests`;");
	$commands[] = array(1146,"TRUNCATE TABLE `".DBManager::RealEscape($_prefix)."chat_posts`;");
	$commands[] = array(1146,"TRUNCATE TABLE `".DBManager::RealEscape($_prefix)."events`;");
	$commands[] = array(1146,"TRUNCATE TABLE `".DBManager::RealEscape($_prefix)."event_actions`;");
	$commands[] = array(1146,"TRUNCATE TABLE `".DBManager::RealEscape($_prefix)."event_urls`;");
	$commands[] = array(1146,"TRUNCATE TABLE `".DBManager::RealEscape($_prefix)."event_action_invitations`;");
	$commands[] = array(1146,"TRUNCATE TABLE `".DBManager::RealEscape($_prefix)."event_action_receivers`;");
	$commands[] = array(1146,"TRUNCATE TABLE `".DBManager::RealEscape($_prefix)."event_action_senders`;");
	$commands[] = array(1146,"TRUNCATE TABLE `".DBManager::RealEscape($_prefix)."event_action_website_pushs`;");
	$commands[] = array(1146,"TRUNCATE TABLE `".DBManager::RealEscape($_prefix)."event_triggers`;");
	$commands[] = array(1146,"TRUNCATE TABLE `".DBManager::RealEscape($_prefix)."operator_status`;");
	$commands[] = array(1146,"TRUNCATE TABLE `".DBManager::RealEscape($_prefix)."ticket_editors`;");
	$commands[] = array(1146,"TRUNCATE TABLE `".DBManager::RealEscape($_prefix)."ticket_messages`;");
	$commands[] = array(1146,"TRUNCATE TABLE `".DBManager::RealEscape($_prefix)."tickets`;");
	$commands[] = array(1146,"TRUNCATE TABLE `".DBManager::RealEscape($_prefix)."chat_requests`;");
	$commands[] = array(1146,"TRUNCATE TABLE `".DBManager::RealEscape($_prefix)."website_pushs`;");
	$commands[] = array(1091,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operator_status` DROP `id`;");
	$commands[] = array(1091,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_archive` DROP `id`;");
	$commands[] = array(1050,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_posts` CHANGE `sender` `sender` VARCHAR( 65 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
	$commands[] = array(1050,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_posts` CHANGE `receiver` `receiver` VARCHAR( 65 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';");
	$commands[] = array(1050,"ALTER TABLE `".DBManager::RealEscape($_prefix)."predefined` CHANGE `lang_iso` `lang_iso` VARCHAR( 5 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL;");
	$commands[] = array(1050,"ALTER TABLE `".DBManager::RealEscape($_prefix)."profiles` CHANGE `languages` `languages` VARCHAR( 1024 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL;");
	$commands[] = array(1050,"ALTER TABLE `".DBManager::RealEscape($_prefix)."ticket_editors` CHANGE `ticket_id` `ticket_id` VARCHAR( 32 ) NOT NULL DEFAULT '';");
	$commands[] = array(0,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operator_status` ADD `time_confirmed` INT( 11 ) UNSIGNED NOT NULL;");
	$commands[] = array(0,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operator_status` CHANGE `time_confirmed` `confirmed` INT( 11 ) UNSIGNED NOT NULL;");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_posts` ADD `translation` MEDIUMTEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL AFTER `text`;");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_requests` ADD `closed` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0' AFTER `declined`;");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_archive` ADD `transcript_receiver` VARCHAR( 255 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '' AFTER `transcript_sent`;");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_archive` ADD `customs` TEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL;");
	$commands[] = array(1060,"ALTER TABLE `".DBManager::RealEscape($_prefix)."info` ADD `gtspan` INT UNSIGNED NOT NULL DEFAULT '0';");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."event_funnels` (`eid` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '', `uid` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '', `ind` smallint(5) unsigned NOT NULL DEFAULT '0', PRIMARY KEY (`eid`,`uid`),  KEY `uid` (`uid`)) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."event_goals` (`event_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '', `goal_id` int(10) unsigned NOT NULL DEFAULT '0', UNIQUE KEY `prim` (`event_id`,`goal_id`), KEY `target_id` (`goal_id`),  KEY `event_id` (`event_id`)) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."goals` ( `id` int(10) unsigned NOT NULL AUTO_INCREMENT, `title` varchar(255) COLLATE utf8_bin NOT NULL, `description` text COLLATE utf8_bin NOT NULL, `conversion` tinyint(1) unsigned NOT NULL DEFAULT '0', `ind` int(10) unsigned NOT NULL DEFAULT '0', PRIMARY KEY (`id`), UNIQUE KEY `title` (`title`)) ENGINE=MyISAM  DEFAULT CHARSET=utf8 COLLATE=utf8_bin AUTO_INCREMENT=1;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."stats_aggs` ( `year` smallint(4) unsigned NOT NULL DEFAULT '0',  `month` tinyint(3) unsigned NOT NULL DEFAULT '0',  `day` tinyint(3) unsigned NOT NULL DEFAULT '0',  `time` int(10) unsigned NOT NULL DEFAULT '0',  `mtime` int(10) unsigned NOT NULL DEFAULT '0',`sessions` int(10) unsigned NOT NULL DEFAULT '0',`visitors_unique` int(10) unsigned NOT NULL DEFAULT '0', `conversions` int(10) unsigned NOT NULL DEFAULT '0',  `aggregated` tinyint(1) unsigned NOT NULL DEFAULT '0',  `chats_forwards` int(10) unsigned NOT NULL DEFAULT '0',  `chats_posts_internal` int(10) unsigned NOT NULL DEFAULT '0',  `chats_posts_external` int(10) unsigned NOT NULL DEFAULT '0',  `avg_time_site` double unsigned NOT NULL DEFAULT '0',  PRIMARY KEY (`year`,`month`,`day`)) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."stats_aggs_availabilities` ( `year` smallint(5) unsigned NOT NULL DEFAULT '0',  `month` tinyint(3) unsigned NOT NULL DEFAULT '0',  `day` tinyint(3) unsigned NOT NULL DEFAULT '0',  `hour` tinyint(2) unsigned NOT NULL DEFAULT '0',  `user_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '', `status` tinyint(1) unsigned NOT NULL DEFAULT '0',  `seconds` int(4) unsigned NOT NULL DEFAULT '0',  PRIMARY KEY (`year`,`month`,`day`,`user_id`,`hour`,`status`)) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."stats_aggs_browsers` (`year` smallint(5) unsigned NOT NULL DEFAULT '0',`month` tinyint(3) unsigned NOT NULL DEFAULT '0',`day` tinyint(3) unsigned NOT NULL DEFAULT '0',`browser` int(10) unsigned NOT NULL DEFAULT '0',`amount` int(10) unsigned NOT NULL DEFAULT '0',PRIMARY KEY (`year`,`month`,`day`,`browser`)) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."stats_aggs_chats` (`year` smallint(5) unsigned NOT NULL DEFAULT '0',`month` tinyint(3) unsigned NOT NULL DEFAULT '0',`day` tinyint(3) unsigned NOT NULL DEFAULT '0',`hour` tinyint(2) unsigned NOT NULL DEFAULT '0',`user_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`amount` int(10) unsigned NOT NULL DEFAULT '0',`accepted` int(10) unsigned NOT NULL DEFAULT '0',`declined` int(10) unsigned NOT NULL DEFAULT '0',`avg_duration` double unsigned NOT NULL DEFAULT '0',`avg_waiting_time` double unsigned NOT NULL DEFAULT '0',PRIMARY KEY (`year`,`month`,`day`,`user_id`,`hour`)) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."stats_aggs_cities` (`year` smallint(5) unsigned NOT NULL DEFAULT '0',`month` tinyint(3) unsigned NOT NULL DEFAULT '0',`day` tinyint(3) unsigned NOT NULL DEFAULT '0',`city` int(10) unsigned NOT NULL DEFAULT '0',`amount` int(10) unsigned NOT NULL DEFAULT '0',PRIMARY KEY (`year`,`month`,`day`,`city`)) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."stats_aggs_countries` (`year` smallint(5) unsigned NOT NULL DEFAULT '0',`month` tinyint(3) unsigned NOT NULL DEFAULT '0',`day` tinyint(3) unsigned NOT NULL DEFAULT '0',`country` varchar(2) COLLATE utf8_bin NOT NULL DEFAULT '',`amount` int(10) unsigned NOT NULL DEFAULT '0',PRIMARY KEY (`year`,`month`,`day`,`country`)) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."stats_aggs_crawlers` (`year` smallint(5) unsigned NOT NULL DEFAULT '0',`month` tinyint(3) unsigned NOT NULL DEFAULT '0',`day` tinyint(3) unsigned NOT NULL DEFAULT '0',`crawler` int(10) unsigned NOT NULL DEFAULT '0',`amount` int(10) unsigned NOT NULL DEFAULT '0',PRIMARY KEY (`year`,`month`,`day`,`crawler`)) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."stats_aggs_domains` (`year` smallint(5) unsigned NOT NULL DEFAULT '0',`month` tinyint(3) unsigned NOT NULL DEFAULT '0',`day` tinyint(3) unsigned NOT NULL DEFAULT '0',`domain` int(10) unsigned NOT NULL DEFAULT '0',`amount` int(10) unsigned NOT NULL DEFAULT '0',PRIMARY KEY (`year`,`month`,`day`,`domain`)) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."stats_aggs_durations` (`year` smallint(5) unsigned NOT NULL DEFAULT '0',`month` tinyint(3) unsigned NOT NULL DEFAULT '0',`day` tinyint(3) unsigned NOT NULL DEFAULT '0',`duration` int(10) unsigned NOT NULL DEFAULT '0',`amount` int(10) unsigned NOT NULL DEFAULT '0',PRIMARY KEY (`year`,`month`,`day`,`duration`)) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."stats_aggs_goals` (`year` smallint(5) unsigned NOT NULL DEFAULT '0',`month` tinyint(3) unsigned NOT NULL DEFAULT '0',`day` tinyint(3) unsigned NOT NULL DEFAULT '0',`goal` int(10) unsigned NOT NULL DEFAULT '0',`amount` int(10) unsigned NOT NULL DEFAULT '0',PRIMARY KEY (`year`,`month`,`day`,`goal`),KEY `target` (`goal`)) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."stats_aggs_isps` (`year` smallint(5) unsigned NOT NULL DEFAULT '0',`month` tinyint(3) unsigned NOT NULL DEFAULT '0',`day` tinyint(3) unsigned NOT NULL DEFAULT '0',`isp` int(10) unsigned NOT NULL DEFAULT '0',`amount` int(10) unsigned NOT NULL DEFAULT '0',PRIMARY KEY (`year`,`month`,`day`,`isp`)) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."stats_aggs_languages` (`year` smallint(5) unsigned NOT NULL DEFAULT '0',`month` tinyint(3) unsigned NOT NULL DEFAULT '0',`day` tinyint(3) unsigned NOT NULL DEFAULT '0',`language` varchar(5) COLLATE utf8_bin NOT NULL,`amount` int(10) unsigned NOT NULL DEFAULT '0',PRIMARY KEY (`year`,`month`,`day`,`language`)) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."stats_aggs_pages` (`year` smallint(5) unsigned NOT NULL DEFAULT '0',`month` tinyint(3) unsigned NOT NULL DEFAULT '0',`day` tinyint(3) unsigned NOT NULL DEFAULT '0',`url` int(10) unsigned NOT NULL DEFAULT '0',`amount` int(10) unsigned NOT NULL DEFAULT '0',PRIMARY KEY (`year`,`month`,`day`,`url`),KEY `url_id` (`url`)) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."stats_aggs_pages_entrance` (`year` smallint(5) unsigned NOT NULL DEFAULT '0',`month` tinyint(3) unsigned NOT NULL DEFAULT '0',`day` tinyint(3) unsigned NOT NULL DEFAULT '0',`url` int(10) unsigned NOT NULL DEFAULT '0',`amount` int(10) unsigned NOT NULL DEFAULT '0',PRIMARY KEY (`year`,`month`,`day`,`url`)) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."stats_aggs_pages_exit` (`year` smallint(5) unsigned NOT NULL DEFAULT '0',`month` tinyint(3) unsigned NOT NULL DEFAULT '0',`day` tinyint(3) unsigned NOT NULL DEFAULT '0',`url` int(10) unsigned NOT NULL DEFAULT '0',`amount` int(10) unsigned NOT NULL DEFAULT '0',PRIMARY KEY (`year`,`month`,`day`,`url`)) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."stats_aggs_queries` (`year` smallint(5) unsigned NOT NULL DEFAULT '0',`month` tinyint(3) unsigned NOT NULL DEFAULT '0',`day` tinyint(3) unsigned NOT NULL DEFAULT '0',`query` int(10) unsigned NOT NULL DEFAULT '0',`amount` int(10) unsigned NOT NULL DEFAULT '0',PRIMARY KEY (`year`,`month`,`day`,`query`)) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."stats_aggs_referrers` (`year` smallint(5) unsigned NOT NULL DEFAULT '0',`month` tinyint(3) unsigned NOT NULL DEFAULT '0',`day` tinyint(3) unsigned NOT NULL DEFAULT '0',`referrer` int(10) unsigned NOT NULL DEFAULT '0',`amount` int(10) unsigned NOT NULL DEFAULT '0',PRIMARY KEY (`year`,`month`,`day`,`referrer`)) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."stats_aggs_regions` (`year` smallint(5) unsigned NOT NULL DEFAULT '0',`month` tinyint(3) unsigned NOT NULL DEFAULT '0',`day` tinyint(3) unsigned NOT NULL DEFAULT '0',`region` int(10) unsigned NOT NULL DEFAULT '0',`amount` int(10) unsigned NOT NULL DEFAULT '0',PRIMARY KEY (`year`,`month`,`day`,`region`)) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."stats_aggs_resolutions` (`year` smallint(5) unsigned NOT NULL DEFAULT '0',`month` tinyint(3) unsigned NOT NULL DEFAULT '0',`day` tinyint(3) unsigned NOT NULL DEFAULT '0',`resolution` int(10) unsigned NOT NULL DEFAULT '0',`amount` int(10) unsigned NOT NULL DEFAULT '0',PRIMARY KEY (`year`,`month`,`day`,`resolution`)) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."stats_aggs_search_engines` (`year` smallint(5) unsigned NOT NULL DEFAULT '0',`month` tinyint(3) unsigned NOT NULL DEFAULT '0',`day` tinyint(3) unsigned NOT NULL DEFAULT '0',`domain` int(10) unsigned NOT NULL DEFAULT '0',`amount` int(10) unsigned NOT NULL DEFAULT '0',PRIMARY KEY (`year`,`month`,`day`,`domain`)) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."stats_aggs_systems` (`year` smallint(5) unsigned NOT NULL DEFAULT '0',`month` tinyint(3) unsigned NOT NULL DEFAULT '0',`day` tinyint(3) unsigned NOT NULL DEFAULT '0',`system` int(10) unsigned NOT NULL DEFAULT '0',`amount` int(10) unsigned NOT NULL DEFAULT '0',PRIMARY KEY (`year`,`month`,`day`,`system`)) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."stats_aggs_visitors` (`year` smallint(5) unsigned NOT NULL DEFAULT '0',`month` tinyint(3) unsigned NOT NULL DEFAULT '0',`day` tinyint(3) unsigned NOT NULL DEFAULT '0',`hour` tinyint(3) unsigned NOT NULL DEFAULT '0',`visitors_unique` int(10) unsigned NOT NULL DEFAULT '0',`page_impressions` int(10) unsigned NOT NULL DEFAULT '0',`visitors_recurring` int(10) unsigned NOT NULL DEFAULT '0',`bounces` int(10) unsigned NOT NULL DEFAULT '0',`search_engine` int(10) unsigned NOT NULL DEFAULT '0',`from_referrer` int(10) unsigned NOT NULL DEFAULT '0',`browser_instances` int(10) unsigned NOT NULL DEFAULT '0',`js` int(10) unsigned NOT NULL DEFAULT '0',`on_chat_page` int(10) unsigned NOT NULL DEFAULT '0',PRIMARY KEY (`year`,`month`,`day`,`hour`)) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."stats_aggs_visits` (`year` smallint(5) unsigned NOT NULL DEFAULT '0',`month` tinyint(3) unsigned NOT NULL DEFAULT '0',`day` tinyint(3) unsigned NOT NULL DEFAULT '0',`visits` int(10) unsigned NOT NULL DEFAULT '0',`amount` int(10) unsigned NOT NULL DEFAULT '0',PRIMARY KEY (`year`,`month`,`day`,`visits`)) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."visitors` (`id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`entrance` int(10) unsigned NOT NULL DEFAULT '0',`last_active` int(10) unsigned NOT NULL DEFAULT '0',`host` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '',`ip` varchar(15) COLLATE utf8_bin NOT NULL DEFAULT '',`system` smallint(5) unsigned NOT NULL DEFAULT '0',`browser` smallint(5) unsigned NOT NULL DEFAULT '0',`visits` smallint(5) unsigned NOT NULL DEFAULT '0',`visit_id` varchar(7) COLLATE utf8_bin NOT NULL DEFAULT '',`visit_latest` tinyint(1) unsigned NOT NULL DEFAULT '1',`visit_last` int(10) unsigned NOT NULL DEFAULT '0',`resolution` smallint(5) unsigned NOT NULL DEFAULT '0',`language` varchar(5) COLLATE utf8_bin NOT NULL,`country` varchar(2) COLLATE utf8_bin NOT NULL DEFAULT '',`city` smallint(5) unsigned NOT NULL DEFAULT '0',`region` smallint(5) unsigned NOT NULL DEFAULT '0',`isp` smallint(5) unsigned NOT NULL DEFAULT '0',`timezone` varchar(24) COLLATE utf8_bin NOT NULL DEFAULT '',`latitude` double NOT NULL DEFAULT '0',`longitude` double NOT NULL DEFAULT '0',`geo_result` int(10) unsigned NOT NULL DEFAULT '0',`js` tinyint(1) unsigned NOT NULL DEFAULT '0',`signature` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',PRIMARY KEY (`id`,`entrance`),UNIQUE KEY `visit_id` (`visit_id`)) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."visitor_browsers` (`id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`visitor_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`visit_id` varchar(7) COLLATE utf8_bin NOT NULL DEFAULT '',`created` int(10) unsigned NOT NULL DEFAULT '0',`last_active` int(10) unsigned NOT NULL DEFAULT '0',`last_update` varchar(2) COLLATE utf8_bin NOT NULL DEFAULT '',`is_chat` tinyint(1) unsigned NOT NULL DEFAULT '0',`query` int(10) unsigned NOT NULL DEFAULT '0',`fullname` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '',`email` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '',`company` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '',`customs` TEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,`url_entrance` int(10) unsigned NOT NULL DEFAULT '0',`url_exit` int(10) unsigned NOT NULL DEFAULT '0',PRIMARY KEY (`id`),KEY `visit_id` (`visit_id`)) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."visitor_browser_urls` (`browser_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`entrance` int(10) unsigned NOT NULL DEFAULT '0',`referrer` int(10) unsigned NOT NULL DEFAULT '0',`url` int(10) unsigned NOT NULL DEFAULT '0',`params` text COLLATE utf8_bin NOT NULL,PRIMARY KEY (`entrance`,`browser_id`),KEY `browser_id` (`browser_id`)) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."visitor_data_area_codes` (`id` int(10) unsigned NOT NULL AUTO_INCREMENT,`area_code` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '',PRIMARY KEY (`id`),UNIQUE KEY `area_code` (`area_code`)) ENGINE=MyISAM  DEFAULT CHARSET=utf8 COLLATE=utf8_bin AUTO_INCREMENT=1;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."visitor_data_browsers` (`id` int(11) unsigned NOT NULL AUTO_INCREMENT,`browser` varchar(255) COLLATE utf8_bin NOT NULL,`type` tinyint(1) unsigned NOT NULL DEFAULT '0',PRIMARY KEY (`id`),UNIQUE KEY `browser` (`browser`)) ENGINE=MyISAM  DEFAULT CHARSET=utf8 COLLATE=utf8_bin AUTO_INCREMENT=1;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."visitor_data_cities` (`id` int(11) NOT NULL AUTO_INCREMENT,`city` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '',PRIMARY KEY (`id`),UNIQUE KEY `city` (`city`)) ENGINE=MyISAM  DEFAULT CHARSET=utf8 COLLATE=utf8_bin AUTO_INCREMENT=1;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."visitor_data_crawlers` (`id` int(10) unsigned NOT NULL AUTO_INCREMENT,`crawler` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '',PRIMARY KEY (`id`),UNIQUE KEY `crawler` (`crawler`),UNIQUE KEY `crawler_2` (`crawler`)) ENGINE=MyISAM  DEFAULT CHARSET=utf8 COLLATE=utf8_bin AUTO_INCREMENT=1;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."visitor_data_domains` (`id` int(10) unsigned NOT NULL AUTO_INCREMENT,`domain` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '',`external` tinyint(1) unsigned NOT NULL DEFAULT '1',`search` tinyint(1) unsigned NOT NULL DEFAULT '0',PRIMARY KEY (`id`),UNIQUE KEY `domain` (`domain`)) ENGINE=MyISAM  DEFAULT CHARSET=utf8 COLLATE=utf8_bin AUTO_INCREMENT=1;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."visitor_data_isps` (`id` int(11) NOT NULL AUTO_INCREMENT,`isp` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '',PRIMARY KEY (`id`),UNIQUE KEY `isp` (`isp`)) ENGINE=MyISAM  DEFAULT CHARSET=utf8 COLLATE=utf8_bin AUTO_INCREMENT=1;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."visitor_data_pages` (`id` int(10) unsigned NOT NULL AUTO_INCREMENT,`domain` int(10) unsigned NOT NULL DEFAULT '0',`path` int(10) unsigned NOT NULL DEFAULT '0',`title` int(10) unsigned NOT NULL DEFAULT '0',`area_code` int(10) unsigned NOT NULL DEFAULT '0',PRIMARY KEY (`id`),UNIQUE KEY `UNIQ` (`domain`,`path`)) ENGINE=MyISAM  DEFAULT CHARSET=utf8 COLLATE=utf8_bin AUTO_INCREMENT=1;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."visitor_data_paths` (`id` int(10) unsigned NOT NULL AUTO_INCREMENT,`path` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '',PRIMARY KEY (`id`),UNIQUE KEY `path` (`path`)) ENGINE=MyISAM  DEFAULT CHARSET=utf8 COLLATE=utf8_bin AUTO_INCREMENT=1;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."visitor_data_queries` (`id` int(10) unsigned NOT NULL AUTO_INCREMENT,`query` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '',PRIMARY KEY (`id`),UNIQUE KEY `query` (`query`)) ENGINE=MyISAM  DEFAULT CHARSET=utf8 COLLATE=utf8_bin AUTO_INCREMENT=1;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."visitor_data_regions` (`id` int(11) NOT NULL AUTO_INCREMENT,`region` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '',PRIMARY KEY (`id`),UNIQUE KEY `region` (`region`)) ENGINE=MyISAM  DEFAULT CHARSET=utf8 COLLATE=utf8_bin AUTO_INCREMENT=1;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."visitor_data_resolutions` (`id` int(11) NOT NULL AUTO_INCREMENT,`resolution` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',PRIMARY KEY (`id`),UNIQUE KEY `resolution` (`resolution`)) ENGINE=MyISAM  DEFAULT CHARSET=utf8 COLLATE=utf8_bin AUTO_INCREMENT=1;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."visitor_data_systems` (`id` int(10) unsigned NOT NULL AUTO_INCREMENT,`system` varchar(255) COLLATE utf8_bin NOT NULL,PRIMARY KEY (`id`),UNIQUE KEY `os` (`system`)) ENGINE=MyISAM  DEFAULT CHARSET=utf8 COLLATE=utf8_bin AUTO_INCREMENT=1;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."visitor_data_titles` (`id` int(10) unsigned NOT NULL AUTO_INCREMENT,`title` varchar(255) COLLATE utf8_bin NOT NULL,`confirmed` int(10) unsigned NOT NULL DEFAULT '0',PRIMARY KEY (`id`),UNIQUE KEY `title` (`title`)) ENGINE=MyISAM  DEFAULT CHARSET=utf8 COLLATE=utf8_bin AUTO_INCREMENT=1;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."visitor_goals` (`visitor_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',`goal_id` int(10) unsigned NOT NULL DEFAULT '0',`time` int(10) unsigned NOT NULL DEFAULT '0',`first_visit` tinyint(1) unsigned NOT NULL DEFAULT '0',PRIMARY KEY (`visitor_id`,`goal_id`),KEY `visitor_id` (`visitor_id`),KEY `target_id` (`goal_id`)) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."ticket_customs` (`ticket_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '', `custom_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '', `value` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '', PRIMARY KEY (`ticket_id`,`custom_id`)) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."visitor_chats` (`visitor_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '', `browser_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '', `visit_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '', `chat_id` int(11) unsigned NOT NULL DEFAULT '0', `fullname` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '', `email` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '', `company` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '', `status` tinyint(1) unsigned NOT NULL DEFAULT '0', `typing` tinyint(1) unsigned NOT NULL DEFAULT '0', `waiting` tinyint(1) unsigned NOT NULL DEFAULT '0', `area_code` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '', `first_active` int(10) unsigned NOT NULL DEFAULT '0', `last_active` int(10) unsigned NOT NULL DEFAULT '0',`qpenalty` int(10) unsigned NOT NULL DEFAULT '0',`request_operator` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '', `request_group` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '', `question` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '',`customs` TEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,`allocated` int(11) unsigned NOT NULL DEFAULT '0', `internal_active` tinyint(1) unsigned NOT NULL DEFAULT '0', `internal_closed` tinyint(1) unsigned NOT NULL DEFAULT '0', `internal_declined` tinyint(1) unsigned NOT NULL DEFAULT '0', `external_active` tinyint(1) unsigned NOT NULL DEFAULT '0', `external_close` tinyint(1) unsigned NOT NULL DEFAULT '0', `exit` int(11) unsigned NOT NULL DEFAULT '0',  PRIMARY KEY (`visitor_id`,`browser_id`,`visit_id`,`chat_id`),  KEY `chat_id` (`chat_id`)) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."visitor_chat_operators` (`chat_id` int(10) unsigned NOT NULL DEFAULT '0', `user_id` varchar(32) COLLATE utf8_bin NOT NULL,`declined` tinyint(1) unsigned NOT NULL DEFAULT '0', PRIMARY KEY (`user_id`,`chat_id`), KEY `chat_id` (`chat_id`)) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."chat_files` ( `id` varchar(64) COLLATE utf8_bin NOT NULL, `created` int(10) unsigned NOT NULL DEFAULT '0',`file_name` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '', `file_mask` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '', `file_id` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '',`chat_id` int(10) unsigned NOT NULL DEFAULT '0', `visitor_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '', `browser_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '', `operator_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '', `error` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '', `permission` tinyint(1) NOT NULL DEFAULT '-1', `download` tinyint(1) unsigned NOT NULL DEFAULT '0',`closed` tinyint(1) unsigned NOT NULL DEFAULT '0', PRIMARY KEY (`id`,`created`), KEY `visitor_id` (`visitor_id`)) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."chat_forwards` ( `id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',  `created` int(10) unsigned NOT NULL DEFAULT '0', `sender_operator_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',  `target_operator_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',  `target_group_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',  `visitor_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',  `browser_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',  `chat_id` int(11) unsigned NOT NULL DEFAULT '0',  `conversation` mediumtext COLLATE utf8_bin NOT NULL,  `info_text` mediumtext COLLATE utf8_bin NOT NULL,  `processed` tinyint(1) unsigned NOT NULL DEFAULT '0',`received` tinyint(1) unsigned NOT NULL DEFAULT '0',  PRIMARY KEY (`id`),  KEY `chat_id` (`chat_id`)) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."operators` (`id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '', `login_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '', `first_active` int(10) unsigned NOT NULL DEFAULT '0', `last_active` int(10) unsigned NOT NULL DEFAULT '0', `password` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '', `status` tinyint(1) unsigned NOT NULL DEFAULT '0', `level` tinyint(1) unsigned NOT NULL DEFAULT '0', `ip` varchar(15) COLLATE utf8_bin NOT NULL DEFAULT '', `typing` tinyint(1) unsigned NOT NULL DEFAULT '0', `visitor_file_sizes` mediumtext COLLATE utf8_bin NOT NULL, `last_chat_allocation` int(10) unsigned NOT NULL DEFAULT '0', PRIMARY KEY (`id`)) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
	$commands[] = array(1050,"CREATE TABLE IF NOT EXISTS `".DBManager::RealEscape($_prefix)."filters` ( `creator` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '', `created` int(10) unsigned NOT NULL DEFAULT '0', `editor` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '', `edited` int(10) unsigned NOT NULL DEFAULT '0', `ip` varchar(15) COLLATE utf8_bin NOT NULL DEFAULT '', `expiredate` int(10) NOT NULL DEFAULT '0', `visitor_id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '', `reason` text COLLATE utf8_bin NOT NULL, `name` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '', `id` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '', `active` tinyint(1) unsigned NOT NULL DEFAULT '0', `exertion` tinyint(1) unsigned NOT NULL DEFAULT '0', `languages` text COLLATE utf8_bin NOT NULL, `activeipaddress` tinyint(3) unsigned NOT NULL DEFAULT '0', `activevisitorid` tinyint(3) unsigned NOT NULL DEFAULT '0', `activelanguage` tinyint(3) unsigned NOT NULL DEFAULT '0', PRIMARY KEY (`id`)) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."alerts` ADD INDEX `receiver_user_id` ( `receiver_user_id` );");
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."event_actions` ADD INDEX `event_id` ( `eid` );");
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."event_action_invitations` ADD INDEX `action_id` ( `action_id` );");
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."event_action_receivers` ADD INDEX `action_id` ( `action_id` );");
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."event_action_website_pushs` ADD INDEX `action_id` ( `action_id` );");
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."event_triggers` ADD INDEX `receiver_user_id` ( `receiver_user_id` );");
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."ticket_editors` ADD INDEX `ticket_id` ( `ticket_id` );");
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."ticket_messages` ADD INDEX `ticket_id` ( `ticket_id` );");
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_archive` ADD INDEX `chat_id` ( `chat_id` );");
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_requests` ADD INDEX `receiver_browser_id` ( `receiver_browser_id` );");
	$commands[] = array(1061,"ALTER TABLE `".DBManager::RealEscape($_prefix)."website_pushs` ADD INDEX `receiver_browser_id` ( `receiver_browser_id` );");
	$commands[] = array(1068,"ALTER TABLE `".DBManager::RealEscape($_prefix)."operator_status` ADD PRIMARY KEY ( `time` , `internal_id` , `status` );");
	return processCommandList($commands,$_link);
}

function up_3200_3201($_prefix,$_link)
{
	$commands = Array();
	$commands[] = "ALTER TABLE `".DBManager::RealEscape($_prefix)."chats` ADD `question` VARCHAR( 255 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '';";
	$allowedecs = Array(1060);
	foreach($commands as $key => $command)
	{
		$result = $_link->Query(false,$command);
		if(!$result && DBManager::GetErrorCode() != $allowedecs[$key])
			return DBManager::GetErrorCode() . ": " . DBManager::GetError() . "\r\n\r\nMySQL Query: " . $commands[$key];
	}
	return true;
}

function up_3186_3200($_prefix,$_link)
{
	$commands = Array();
	$commands[] = "CREATE TABLE `".DBManager::RealEscape($_prefix)."alerts` (`id` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '', `created` int(10) unsigned NOT NULL DEFAULT '0', `receiver_user_id` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '', `receiver_browser_id` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '', `event_action_id` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '', `text` mediumtext CHARACTER SET utf8 COLLATE utf8_bin NOT NULL, `displayed` tinyint(1) unsigned NOT NULL DEFAULT '0', `accepted` tinyint(1) unsigned NOT NULL DEFAULT '0', PRIMARY KEY (`id`)) ENGINE=MyISAM CHARACTER SET utf8 COLLATE utf8_bin;";
 	$commands[] = "ALTER TABLE `".DBManager::RealEscape($_prefix)."predefined` ADD `invitation_auto` MEDIUMTEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL AFTER `invitation`";
 	$commands[] = "ALTER TABLE `".DBManager::RealEscape($_prefix)."predefined` CHANGE `invitation` `invitation_manual` MEDIUMTEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL";
	$commands[] = "ALTER TABLE `".DBManager::RealEscape($_prefix)."predefined` CHANGE `website_push` `website_push_manual` MEDIUMTEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL";
	$commands[] = "ALTER TABLE `".DBManager::RealEscape($_prefix)."predefined` ADD `website_push_auto` MEDIUMTEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL AFTER `website_push_manual`";
	$commands[] = "UPDATE `".DBManager::RealEscape($_prefix)."predefined` SET `invitation_auto`=`invitation_manual`";
	$commands[] = "UPDATE `".DBManager::RealEscape($_prefix)."predefined` SET `website_push_auto`=`website_push_manual`";
 	$commands[] = "RENAME TABLE `".DBManager::RealEscape($_prefix)."rooms` TO `".DBManager::RealEscape($_prefix)."chat_rooms`;";
 	$commands[] = "ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_rooms` ADD `creator` varchar(32 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT ''";
 	$commands[] = "RENAME TABLE `".DBManager::RealEscape($_prefix)."posts`  TO `".DBManager::RealEscape($_prefix)."chat_posts`;";
 	$commands[] = "ALTER TABLE `".DBManager::RealEscape($_prefix)."chat_posts` ADD `chat_id` varchar(32 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '' AFTER `id` ";
	$commands[] = "RENAME TABLE `".DBManager::RealEscape($_prefix)."res`  TO `".DBManager::RealEscape($_prefix)."resources`;";
	$commands[] = "ALTER TABLE `".DBManager::RealEscape($_prefix)."chats` ADD `group_id` varchar(32 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '' AFTER `internal_id`";
	$commands[] = "CREATE TABLE `".DBManager::RealEscape($_prefix)."logins` (`id` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '',`user_id` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '',`ip` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '',`time` int(11) unsigned NOT NULL DEFAULT '0', `password` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '', PRIMARY KEY (`id`)) ENGINE=MyISAM CHARACTER SET utf8 COLLATE utf8_bin;";
	$commands[] = "CREATE TABLE `".DBManager::RealEscape($_prefix)."chat_requests` ( `id` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '', `created` int(10) unsigned NOT NULL DEFAULT '0', `sender_system_id` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '', `sender_group_id` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '', `receiver_user_id` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '', `receiver_browser_id` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '', `event_action_id` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '', `text` mediumtext CHARACTER SET utf8 COLLATE utf8_bin NOT NULL, `displayed` tinyint(1) unsigned NOT NULL DEFAULT '0', `accepted` tinyint(1) unsigned NOT NULL DEFAULT '0', `declined` tinyint(1) unsigned NOT NULL DEFAULT '0', PRIMARY KEY (`id`)) ENGINE=MyISAM CHARACTER SET utf8 COLLATE utf8_bin;";
	$commands[] = "CREATE TABLE `".DBManager::RealEscape($_prefix)."events` (`id` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '',`name` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '',`created` int(10) unsigned NOT NULL DEFAULT '0', `creator` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '', `edited` int(10) unsigned NOT NULL DEFAULT '0', `editor` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '', `pages_visited` int(10) unsigned NOT NULL DEFAULT '0', `time_on_site` int(10) unsigned NOT NULL DEFAULT '0', `max_trigger_amount` int(10) unsigned NOT NULL DEFAULT '0', `trigger_again_after` int(10) unsigned NOT NULL DEFAULT '0', `not_declined` tinyint(1) unsigned NOT NULL DEFAULT '0', `not_accepted` tinyint(1) unsigned NOT NULL DEFAULT '0', `not_in_chat` tinyint(1) unsigned NOT NULL DEFAULT '0', `priority` int(10) unsigned NOT NULL DEFAULT '0', `is_active` tinyint(1) unsigned NOT NULL DEFAULT '1', PRIMARY KEY (`id`)) ENGINE=MyISAM CHARACTER SET utf8 COLLATE utf8_bin;";
	$commands[] = "CREATE TABLE `".DBManager::RealEscape($_prefix)."event_actions` (`id` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '', `eid` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '', `type` tinyint(2) unsigned NOT NULL DEFAULT '0', `value` MEDIUMTEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL, PRIMARY KEY (`id`)) ENGINE=MyISAM CHARACTER SET utf8 COLLATE utf8_bin;";
	$commands[] = "CREATE TABLE `".DBManager::RealEscape($_prefix)."event_action_internals` (`id` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '',`created` int(10) unsigned NOT NULL DEFAULT '0',`trigger_id` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '',`receiver_user_id` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '', PRIMARY KEY (`id`)) ENGINE=MyISAM CHARACTER SET utf8 COLLATE utf8_bin;";
	$commands[] = "CREATE TABLE `".DBManager::RealEscape($_prefix)."event_action_invitations` ( `id` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '', `action_id` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '', `position` varchar(2) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '', `speed` tinyint(1) NOT NULL DEFAULT '1', `slide` tinyint(1) NOT NULL DEFAULT '1', `margin_left` int(11) NOT NULL DEFAULT '0', `margin_top` int(11) NOT NULL DEFAULT '0', `margin_right` int(11) NOT NULL DEFAULT '0', `margin_bottom` int(11) NOT NULL DEFAULT '0', `style` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '', `close_on_click` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '1', PRIMARY KEY (`id`)) ENGINE=MyISAM CHARACTER SET utf8 COLLATE utf8_bin;";
	$commands[] = "CREATE TABLE `".DBManager::RealEscape($_prefix)."event_action_receivers` (`id` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '', `action_id` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '', `receiver_id` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '', PRIMARY KEY (`id`)) ENGINE=MyISAM CHARACTER SET utf8 COLLATE utf8_bin;";
	$commands[] = "CREATE TABLE `".DBManager::RealEscape($_prefix)."event_action_senders` ( `id` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '', `pid` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '', `user_id` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '', `group_id` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '', `priority` tinyint(2) unsigned NOT NULL DEFAULT '1', PRIMARY KEY (`id`)) ENGINE=MyISAM CHARACTER SET utf8 COLLATE utf8_bin;";
	$commands[] = "CREATE TABLE `".DBManager::RealEscape($_prefix)."event_action_website_pushs` ( `id` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '', `action_id` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '', `target_url` MEDIUMTEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL, `ask` tinyint(1) NOT NULL DEFAULT '1', PRIMARY KEY (`id`)) ENGINE=MyISAM CHARACTER SET utf8 COLLATE utf8_bin;";
	$commands[] = "CREATE TABLE `".DBManager::RealEscape($_prefix)."event_triggers` (`id` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '', `receiver_user_id` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '', `receiver_browser_id` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '', `action_id` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '', `time` int(10) unsigned NOT NULL DEFAULT '0', `triggered` int(10) unsigned NOT NULL DEFAULT '0', PRIMARY KEY (`id`)) ENGINE=MyISAM CHARACTER SET utf8 COLLATE utf8_bin;";
	$commands[] = "CREATE TABLE `".DBManager::RealEscape($_prefix)."event_urls` (`id` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '', `eid` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '', `url` MEDIUMTEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL, `referrer` MEDIUMTEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL, `time_on_site` int(10) unsigned NOT NULL DEFAULT '0', `blacklist` tinyint(1) unsigned NOT NULL DEFAULT '0', PRIMARY KEY (`id`)) ENGINE=MyISAM CHARACTER SET utf8 COLLATE utf8_bin;";
	$commands[] = "CREATE TABLE `".DBManager::RealEscape($_prefix)."website_pushs` (`id` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '', `created` int(10) unsigned NOT NULL DEFAULT '0', `sender_system_id` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '', `receiver_user_id` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '', `receiver_browser_id` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '', `text` mediumtext CHARACTER SET utf8 COLLATE utf8_bin NOT NULL, `ask` tinyint(1) unsigned NOT NULL DEFAULT '0', `target_url` MEDIUMTEXT CHARACTER SET utf8 COLLATE utf8_bin NOT NULL, `displayed` tinyint(1) unsigned NOT NULL DEFAULT '0', `accepted` tinyint(1) unsigned NOT NULL DEFAULT '0', `declined` tinyint(1) unsigned NOT NULL DEFAULT '0', PRIMARY KEY (`id`)) ENGINE=MyISAM CHARACTER SET utf8 COLLATE utf8_bin;";
	$commands[] = "ALTER TABLE `".DBManager::RealEscape($_prefix)."predefined` ADD `editable` TINYINT( 1 ) UNSIGNED NOT NULL DEFAULT '0';";
	$commands[] = "ALTER TABLE `".DBManager::RealEscape($_prefix)."chats` ADD `area_code` varchar(100) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '' AFTER `group_id`;";
	$commands[] = "CREATE TABLE `".DBManager::RealEscape($_prefix)."profiles` (`id` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '', `edited` int(11) NOT NULL DEFAULT '0', `first_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '', `last_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '', `email` varchar(255) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '', `company` varchar(255) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '', `phone` varchar(255) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '', `fax` varchar(255) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '', `street` varchar(255) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '', `zip` varchar(255) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '', `department` varchar(255) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '', `city` varchar(255) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '', `country` varchar(255) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL, `gender` tinyint(1) NOT NULL DEFAULT '0', `languages` varchar(255) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '', `comments` longtext CHARACTER SET utf8 COLLATE utf8_bin NOT NULL, `public` tinyint(1) NOT NULL DEFAULT '0', PRIMARY KEY (`id`)) ENGINE=MyISAM CHARACTER SET utf8 COLLATE utf8_bin;";
	$commands[] = "CREATE TABLE `".DBManager::RealEscape($_prefix)."profile_pictures` (`id` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT '', `internal_id` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL, `time` int(11) NOT NULL DEFAULT '0', `webcam` tinyint(1) NOT NULL DEFAULT '0', `data` mediumtext CHARACTER SET utf8 COLLATE utf8_bin NOT NULL, PRIMARY KEY (`id`)) ENGINE=MyISAM CHARACTER SET utf8 COLLATE utf8_bin;";
	$allowedecs = Array(1050,1054,1054,1054,1060,1060,1060,1050,1060,1050,1060,1050,1060,1050,1050,1050,1050,1050,1050,1050,1050,1050,1050,1050,1050,1060,1060,1050,1050);
	foreach($commands as $key => $command)
	{
		$result = $_link->Query(false,$command);
		if(!$result && DBManager::GetErrorCode() != $allowedecs[$key])
			return DBManager::GetErrorCode() . ": " . DBManager::GetError() . "\r\n\r\nMySQL Query: " . $commands[$key];
	}
	return true;
}


?>