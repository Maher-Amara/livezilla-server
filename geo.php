<?php
/****************************************************************************************
 * LiveZilla geo.php
 *
 * Copyright 2018 LiveZilla GmbH
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
require(LIVEZILLA_PATH . "_definitions/definitions.protocol.inc.php");
require(LIVEZILLA_PATH . "_definitions/definitions.dynamic.inc.php");
require(LIVEZILLA_PATH . "_lib/functions.external.inc.php");

require("_lib/trdp/geo/geoip2.phar");

use GeoIp2\Database\Reader;
header('Content-Type: application/javascript;charset=utf-8');

$ip = Communication::GetIP(true,false,false);

$tags = GetFromDatabase($ip);

$success = isset($tags["city"]) && $tags["city"] != "-";

if(!$success)
    exit(GetDefaultByCountry($tags));

exit(GetOutput($tags,$success));

function GetFromDatabase($_ip)
{
    if(isset($_GET["xip"]) && strlen($_GET["xip"]) < 20)
        $_ip = $_GET["xip"];

    $tags = array();
    $reader = new Reader("./_lib/trdp/geo/GeoLite2-City.mmdb");

    try
    {
        $record = $reader->city($_ip);
        if(!empty($record))
        {
            $tags["iso2"] = $record->country->isoCode;
            if(isset($record->city->name) && isset($record->mostSpecificSubdivision->name))
            {
                $tags["region"] = ucwords(strtolower(utf8_decode($record->mostSpecificSubdivision->name)));
                $tags["city"] = ucwords(strtolower(utf8_decode($record->city->name)));
                $tags["latitude"] = $record->location->latitude;
                $tags["longitude"] = $record->location->longitude;
                $tags["timezone"] = GetTimezone($record->country->isoCode,$record->mostSpecificSubdivision->name);

                //$reader_isp = new Reader('./data/GeoIP2-ISP.mmdb');
                //$record = $reader_isp->isp($_ip);
                $tags["isp"] = "";//ucwords(strtolower($record->isp));
            }
        }
    }
    catch(Exception $ex)
    {

    }
    return $tags;
}

function GetTimezone($_iso,$_state)
{
    $geo_timezones = array(
        array('iso' => 'AD','state' => '','gmt' => '1','id' => '1'),
        array('iso' => 'AE','state' => '','gmt' => '4','id' => '2'),
        array('iso' => 'AF','state' => '','gmt' => '5','id' => '3'),
        array('iso' => 'AG','state' => '','gmt' => '-4','id' => '4'),
        array('iso' => 'AI','state' => '','gmt' => '-4','id' => '5'),
        array('iso' => 'AL','state' => '','gmt' => '1','id' => '6'),
        array('iso' => 'AM','state' => '','gmt' => '4','id' => '7'),
        array('iso' => 'AN','state' => '','gmt' => '-4','id' => '8'),
        array('iso' => 'AO','state' => '','gmt' => '1','id' => '9'),
        array('iso' => 'AQ','state' => '','gmt' => '3','id' => '10'),
        array('iso' => 'AR','state' => '','gmt' => '-2','id' => '11'),
        array('iso' => 'AS','state' => '','gmt' => '-11','id' => '12'),
        array('iso' => 'AT','state' => '','gmt' => '1','id' => '13'),
        array('iso' => 'AU','state' => '','gmt' => '10','id' => '14'),
        array('iso' => 'AW','state' => '','gmt' => '-4','id' => '15'),
        array('iso' => 'AX','state' => '','gmt' => '2','id' => '16'),
        array('iso' => 'AZ','state' => '','gmt' => '4','id' => '17'),
        array('iso' => 'BA','state' => '','gmt' => '1','id' => '18'),
        array('iso' => 'BB','state' => '','gmt' => '-4','id' => '19'),
        array('iso' => 'BD','state' => '','gmt' => '6','id' => '20'),
        array('iso' => 'BE','state' => '','gmt' => '1','id' => '21'),
        array('iso' => 'BF','state' => '','gmt' => '0','id' => '22'),
        array('iso' => 'BG','state' => '','gmt' => '2','id' => '23'),
        array('iso' => 'BH','state' => '','gmt' => '3','id' => '24'),
        array('iso' => 'BI','state' => '','gmt' => '2','id' => '25'),
        array('iso' => 'BJ','state' => '','gmt' => '1','id' => '26'),
        array('iso' => 'BM','state' => '','gmt' => '-4','id' => '27'),
        array('iso' => 'BN','state' => '','gmt' => '8','id' => '28'),
        array('iso' => 'BO','state' => '','gmt' => '-4','id' => '29'),
        array('iso' => 'BR','state' => '','gmt' => '-5','id' => '30'),
        array('iso' => 'BS','state' => '','gmt' => '-5','id' => '31'),
        array('iso' => 'BT','state' => '','gmt' => '6','id' => '32'),
        array('iso' => 'BW','state' => '','gmt' => '2','id' => '33'),
        array('iso' => 'BY','state' => '','gmt' => '2','id' => '34'),
        array('iso' => 'BZ','state' => '','gmt' => '-6','id' => '35'),
        array('iso' => 'CA','state' => '','gmt' => '-8','id' => '36'),
        array('iso' => 'CC','state' => '','gmt' => '7','id' => '37'),
        array('iso' => 'CD','state' => '','gmt' => '2','id' => '38'),
        array('iso' => 'CF','state' => '','gmt' => '1','id' => '39'),
        array('iso' => 'CG','state' => '','gmt' => '1','id' => '40'),
        array('iso' => 'CH','state' => '','gmt' => '1','id' => '41'),
        array('iso' => 'CI','state' => '','gmt' => '0','id' => '42'),
        array('iso' => 'CK','state' => '','gmt' => '-10','id' => '43'),
        array('iso' => 'CL','state' => '','gmt' => '-5','id' => '44'),
        array('iso' => 'CM','state' => '','gmt' => '1','id' => '45'),
        array('iso' => 'CN','state' => '','gmt' => '8','id' => '46'),
        array('iso' => 'CO','state' => '','gmt' => '-5','id' => '47'),
        array('iso' => 'CR','state' => '','gmt' => '-6','id' => '48'),
        array('iso' => 'CU','state' => '','gmt' => '-5','id' => '49'),
        array('iso' => 'CV','state' => '','gmt' => '-1','id' => '50'),
        array('iso' => 'CX','state' => '','gmt' => '7','id' => '51'),
        array('iso' => 'CY','state' => '','gmt' => '2','id' => '52'),
        array('iso' => 'CZ','state' => '','gmt' => '1','id' => '53'),
        array('iso' => 'DE','state' => '','gmt' => '1','id' => '54'),
        array('iso' => 'DJ','state' => '','gmt' => '3','id' => '55'),
        array('iso' => 'DK','state' => '','gmt' => '1','id' => '56'),
        array('iso' => 'DM','state' => '','gmt' => '-4','id' => '57'),
        array('iso' => 'DO','state' => '','gmt' => '-4','id' => '58'),
        array('iso' => 'DZ','state' => '','gmt' => '1','id' => '59'),
        array('iso' => 'EC','state' => '','gmt' => '-6','id' => '60'),
        array('iso' => 'EE','state' => '','gmt' => '2','id' => '61'),
        array('iso' => 'EG','state' => '','gmt' => '2','id' => '62'),
        array('iso' => 'EH','state' => '','gmt' => '0','id' => '63'),
        array('iso' => 'ER','state' => '','gmt' => '3','id' => '64'),
        array('iso' => 'ES','state' => '','gmt' => '2','id' => '65'),
        array('iso' => 'ET','state' => '','gmt' => '3','id' => '66'),
        array('iso' => 'FI','state' => '','gmt' => '2','id' => '67'),
        array('iso' => 'FJ','state' => '','gmt' => '12','id' => '68'),
        array('iso' => 'FK','state' => '','gmt' => '-3','id' => '69'),
        array('iso' => 'FM','state' => '','gmt' => '11','id' => '70'),
        array('iso' => 'FO','state' => '','gmt' => '0','id' => '71'),
        array('iso' => 'FR','state' => '','gmt' => '1','id' => '72'),
        array('iso' => 'GA','state' => '','gmt' => '1','id' => '73'),
        array('iso' => 'GB','state' => '','gmt' => '0','id' => '74'),
        array('iso' => 'GD','state' => '','gmt' => '-4','id' => '75'),
        array('iso' => 'GE','state' => '','gmt' => '4','id' => '76'),
        array('iso' => 'GF','state' => '','gmt' => '-3','id' => '77'),
        array('iso' => 'GG','state' => '','gmt' => '0','id' => '78'),
        array('iso' => 'GH','state' => '','gmt' => '0','id' => '79'),
        array('iso' => 'GI','state' => '','gmt' => '1','id' => '80'),
        array('iso' => 'GL','state' => '','gmt' => '-4','id' => '81'),
        array('iso' => 'GM','state' => '','gmt' => '0','id' => '82'),
        array('iso' => 'GN','state' => '','gmt' => '0','id' => '83'),
        array('iso' => 'GP','state' => '','gmt' => '-4','id' => '84'),
        array('iso' => 'GQ','state' => '','gmt' => '1','id' => '85'),
        array('iso' => 'GR','state' => '','gmt' => '2','id' => '86'),
        array('iso' => 'GS','state' => '','gmt' => '-2','id' => '87'),
        array('iso' => 'GT','state' => '','gmt' => '-6','id' => '88'),
        array('iso' => 'GU','state' => '','gmt' => '10','id' => '89'),
        array('iso' => 'GW','state' => '','gmt' => '0','id' => '90'),
        array('iso' => 'GY','state' => '','gmt' => '-4','id' => '91'),
        array('iso' => 'HK','state' => '','gmt' => '8','id' => '92'),
        array('iso' => 'HN','state' => '','gmt' => '-6','id' => '93'),
        array('iso' => 'HR','state' => '','gmt' => '1','id' => '94'),
        array('iso' => 'HT','state' => '','gmt' => '-5','id' => '95'),
        array('iso' => 'HU','state' => '','gmt' => '1','id' => '96'),
        array('iso' => 'ID','state' => '','gmt' => '9','id' => '97'),
        array('iso' => 'IE','state' => '','gmt' => '0','id' => '98'),
        array('iso' => 'IL','state' => '','gmt' => '2','id' => '99'),
        array('iso' => 'IM','state' => '','gmt' => '0','id' => '100'),
        array('iso' => 'IN','state' => '','gmt' => '6','id' => '101'),
        array('iso' => 'IO','state' => '','gmt' => '6','id' => '102'),
        array('iso' => 'IQ','state' => '','gmt' => '3','id' => '103'),
        array('iso' => 'IR','state' => '','gmt' => '4','id' => '104'),
        array('iso' => 'IS','state' => '','gmt' => '0','id' => '105'),
        array('iso' => 'IT','state' => '','gmt' => '1','id' => '106'),
        array('iso' => 'JE','state' => '','gmt' => '0','id' => '107'),
        array('iso' => 'JM','state' => '','gmt' => '-5','id' => '108'),
        array('iso' => 'JO','state' => '','gmt' => '2','id' => '109'),
        array('iso' => 'JP','state' => '','gmt' => '9','id' => '110'),
        array('iso' => 'KE','state' => '','gmt' => '3','id' => '111'),
        array('iso' => 'KG','state' => '','gmt' => '6','id' => '112'),
        array('iso' => 'KH','state' => '','gmt' => '7','id' => '113'),
        array('iso' => 'KI','state' => '','gmt' => '14','id' => '114'),
        array('iso' => 'KM','state' => '','gmt' => '3','id' => '115'),
        array('iso' => 'KN','state' => '','gmt' => '-4','id' => '116'),
        array('iso' => 'KP','state' => '','gmt' => '9','id' => '117'),
        array('iso' => 'KR','state' => '','gmt' => '9','id' => '118'),
        array('iso' => 'KW','state' => '','gmt' => '3','id' => '119'),
        array('iso' => 'KY','state' => '','gmt' => '-5','id' => '120'),
        array('iso' => 'KZ','state' => '','gmt' => '5','id' => '121'),
        array('iso' => 'LA','state' => '','gmt' => '7','id' => '122'),
        array('iso' => 'LB','state' => '','gmt' => '2','id' => '123'),
        array('iso' => 'LC','state' => '','gmt' => '-4','id' => '124'),
        array('iso' => 'LI','state' => '','gmt' => '1','id' => '125'),
        array('iso' => 'LK','state' => '','gmt' => '6','id' => '126'),
        array('iso' => 'LR','state' => '','gmt' => '0','id' => '127'),
        array('iso' => 'LS','state' => '','gmt' => '2','id' => '128'),
        array('iso' => 'LT','state' => '','gmt' => '2','id' => '129'),
        array('iso' => 'LU','state' => '','gmt' => '1','id' => '130'),
        array('iso' => 'LV','state' => '','gmt' => '2','id' => '131'),
        array('iso' => 'LY','state' => '','gmt' => '2','id' => '132'),
        array('iso' => 'MA','state' => '','gmt' => '0','id' => '133'),
        array('iso' => 'MC','state' => '','gmt' => '1','id' => '134'),
        array('iso' => 'MD','state' => '','gmt' => '2','id' => '135'),
        array('iso' => 'ME','state' => '','gmt' => '1','id' => '136'),
        array('iso' => 'MG','state' => '','gmt' => '3','id' => '137'),
        array('iso' => 'MH','state' => '','gmt' => '12','id' => '138'),
        array('iso' => 'MK','state' => '','gmt' => '1','id' => '139'),
        array('iso' => 'ML','state' => '','gmt' => '0','id' => '140'),
        array('iso' => 'MM','state' => '','gmt' => '7','id' => '141'),
        array('iso' => 'MN','state' => '','gmt' => '9','id' => '142'),
        array('iso' => 'MO','state' => '','gmt' => '8','id' => '143'),
        array('iso' => 'MP','state' => '','gmt' => '10','id' => '144'),
        array('iso' => 'MQ','state' => '','gmt' => '-4','id' => '145'),
        array('iso' => 'MR','state' => '','gmt' => '0','id' => '146'),
        array('iso' => 'MS','state' => '','gmt' => '-4','id' => '147'),
        array('iso' => 'MT','state' => '','gmt' => '1','id' => '148'),
        array('iso' => 'MU','state' => '','gmt' => '4','id' => '149'),
        array('iso' => 'MV','state' => '','gmt' => '5','id' => '150'),
        array('iso' => 'MW','state' => '','gmt' => '2','id' => '151'),
        array('iso' => 'MX','state' => '','gmt' => '-8','id' => '152'),
        array('iso' => 'MY','state' => '','gmt' => '8','id' => '153'),
        array('iso' => 'MZ','state' => '','gmt' => '2','id' => '154'),
        array('iso' => 'NA','state' => '','gmt' => '2','id' => '155'),
        array('iso' => 'NC','state' => '','gmt' => '11','id' => '156'),
        array('iso' => 'NE','state' => '','gmt' => '1','id' => '157'),
        array('iso' => 'NF','state' => '','gmt' => '12','id' => '158'),
        array('iso' => 'NG','state' => '','gmt' => '1','id' => '159'),
        array('iso' => 'NI','state' => '','gmt' => '-6','id' => '160'),
        array('iso' => 'NL','state' => '','gmt' => '1','id' => '161'),
        array('iso' => 'NO','state' => '','gmt' => '1','id' => '162'),
        array('iso' => 'NP','state' => '','gmt' => '6','id' => '163'),
        array('iso' => 'NR','state' => '','gmt' => '12','id' => '164'),
        array('iso' => 'NU','state' => '','gmt' => '-11','id' => '165'),
        array('iso' => 'NZ','state' => '','gmt' => '14','id' => '166'),
        array('iso' => 'OM','state' => '','gmt' => '4','id' => '167'),
        array('iso' => 'PA','state' => '','gmt' => '-5','id' => '168'),
        array('iso' => 'PE','state' => '','gmt' => '-5','id' => '169'),
        array('iso' => 'PF','state' => '','gmt' => '-9','id' => '170'),
        array('iso' => 'PG','state' => '','gmt' => '10','id' => '171'),
        array('iso' => 'PH','state' => '','gmt' => '8','id' => '172'),
        array('iso' => 'PK','state' => '','gmt' => '5','id' => '173'),
        array('iso' => 'PL','state' => '','gmt' => '1','id' => '174'),
        array('iso' => 'PM','state' => '','gmt' => '-3','id' => '175'),
        array('iso' => 'PN','state' => '','gmt' => '-8','id' => '176'),
        array('iso' => 'PR','state' => '','gmt' => '-4','id' => '177'),
        array('iso' => 'PS','state' => '','gmt' => '2','id' => '178'),
        array('iso' => 'PT','state' => '','gmt' => '-1','id' => '179'),
        array('iso' => 'PW','state' => '','gmt' => '9','id' => '180'),
        array('iso' => 'PY','state' => '','gmt' => '-3','id' => '181'),
        array('iso' => 'QA','state' => '','gmt' => '3','id' => '182'),
        array('iso' => 'RE','state' => '','gmt' => '4','id' => '183'),
        array('iso' => 'RO','state' => '','gmt' => '2','id' => '184'),
        array('iso' => 'RS','state' => '','gmt' => '1','id' => '185'),
        array('iso' => 'RU','state' => '','gmt' => '12','id' => '186'),
        array('iso' => 'RW','state' => '','gmt' => '2','id' => '187'),
        array('iso' => 'SA','state' => '','gmt' => '3','id' => '188'),
        array('iso' => 'SB','state' => '','gmt' => '11','id' => '189'),
        array('iso' => 'SC','state' => '','gmt' => '4','id' => '190'),
        array('iso' => 'SD','state' => '','gmt' => '3','id' => '191'),
        array('iso' => 'SE','state' => '','gmt' => '1','id' => '192'),
        array('iso' => 'SG','state' => '','gmt' => '8','id' => '193'),
        array('iso' => 'SH','state' => '','gmt' => '0','id' => '194'),
        array('iso' => 'SI','state' => '','gmt' => '1','id' => '195'),
        array('iso' => 'SJ','state' => '','gmt' => '1','id' => '196'),
        array('iso' => 'SK','state' => '','gmt' => '1','id' => '197'),
        array('iso' => 'SL','state' => '','gmt' => '0','id' => '198'),
        array('iso' => 'SM','state' => '','gmt' => '1','id' => '199'),
        array('iso' => 'SN','state' => '','gmt' => '0','id' => '200'),
        array('iso' => 'SO','state' => '','gmt' => '3','id' => '201'),
        array('iso' => 'SR','state' => '','gmt' => '-3','id' => '202'),
        array('iso' => 'ST','state' => '','gmt' => '0','id' => '203'),
        array('iso' => 'SV','state' => '','gmt' => '-6','id' => '204'),
        array('iso' => 'SY','state' => '','gmt' => '2','id' => '205'),
        array('iso' => 'SZ','state' => '','gmt' => '2','id' => '206'),
        array('iso' => 'TC','state' => '','gmt' => '-5','id' => '207'),
        array('iso' => 'TD','state' => '','gmt' => '1','id' => '208'),
        array('iso' => 'TF','state' => '','gmt' => '5','id' => '209'),
        array('iso' => 'TG','state' => '','gmt' => '0','id' => '210'),
        array('iso' => 'TH','state' => '','gmt' => '7','id' => '211'),
        array('iso' => 'TJ','state' => '','gmt' => '5','id' => '212'),
        array('iso' => 'TK','state' => '','gmt' => '-10','id' => '213'),
        array('iso' => 'TL','state' => '','gmt' => '9','id' => '214'),
        array('iso' => 'TM','state' => '','gmt' => '5','id' => '215'),
        array('iso' => 'TN','state' => '','gmt' => '1','id' => '216'),
        array('iso' => 'TO','state' => '','gmt' => '13','id' => '217'),
        array('iso' => 'TR','state' => '','gmt' => '2','id' => '218'),
        array('iso' => 'TT','state' => '','gmt' => '-4','id' => '219'),
        array('iso' => 'TV','state' => '','gmt' => '12','id' => '220'),
        array('iso' => 'TW','state' => '','gmt' => '8','id' => '221'),
        array('iso' => 'TZ','state' => '','gmt' => '3','id' => '222'),
        array('iso' => 'UA','state' => '','gmt' => '2','id' => '223'),
        array('iso' => 'UG','state' => '','gmt' => '3','id' => '224'),
        array('iso' => 'UM','state' => '','gmt' => '12','id' => '225'),
        array('iso' => 'UY','state' => '','gmt' => '-2','id' => '227'),
        array('iso' => 'UZ','state' => '','gmt' => '5','id' => '228'),
        array('iso' => 'VA','state' => '','gmt' => '1','id' => '229'),
        array('iso' => 'VC','state' => '','gmt' => '-4','id' => '230'),
        array('iso' => 'VE','state' => '','gmt' => '-5','id' => '231'),
        array('iso' => 'VG','state' => '','gmt' => '-4','id' => '232'),
        array('iso' => 'VI','state' => '','gmt' => '-4','id' => '233'),
        array('iso' => 'VN','state' => '','gmt' => '7','id' => '234'),
        array('iso' => 'VU','state' => '','gmt' => '11','id' => '235'),
        array('iso' => 'WF','state' => '','gmt' => '12','id' => '236'),
        array('iso' => 'WS','state' => '','gmt' => '-11','id' => '237'),
        array('iso' => 'YE','state' => '','gmt' => '3','id' => '238'),
        array('iso' => 'YT','state' => '','gmt' => '3','id' => '239'),
        array('iso' => 'ZA','state' => '','gmt' => '2','id' => '240'),
        array('iso' => 'ZM','state' => '','gmt' => '2','id' => '241'),
        array('iso' => 'ZW','state' => '','gmt' => '2','id' => '242'),
        array('iso' => 'US','state' => '','gmt' => '-10','id' => '243'),
        array('iso' => 'US','state' => 'AZ','gmt' => '-7','id' => '244'),
        array('iso' => 'US','state' => 'AZ','gmt' => '-7','id' => '245'),
        array('iso' => 'US','state' => 'AR','gmt' => '-6','id' => '246'),
        array('iso' => 'US','state' => 'CA','gmt' => '-8','id' => '247'),
        array('iso' => 'US','state' => 'CO','gmt' => '-7','id' => '248'),
        array('iso' => 'US','state' => 'CT','gmt' => '-5','id' => '249'),
        array('iso' => 'US','state' => 'DE','gmt' => '-5','id' => '250'),
        array('iso' => 'US','state' => 'FL','gmt' => '-5','id' => '251'),
        array('iso' => 'US','state' => 'FL','gmt' => '-6','id' => '252'),
        array('iso' => 'US','state' => 'GA','gmt' => '-5','id' => '253'),
        array('iso' => 'US','state' => 'HI','gmt' => '-10','id' => '254'),
        array('iso' => 'US','state' => 'ID','gmt' => '-8','id' => '255'),
        array('iso' => 'US','state' => 'ID','gmt' => '-7','id' => '256'),
        array('iso' => 'US','state' => 'IL','gmt' => '-6','id' => '257'),
        array('iso' => 'US','state' => 'IN','gmt' => '-5','id' => '258'),
        array('iso' => 'US','state' => 'IN','gmt' => '-6','id' => '259'),
        array('iso' => 'US','state' => 'IA','gmt' => '-6','id' => '260'),
        array('iso' => 'US','state' => 'KS','gmt' => '-6','id' => '261'),
        array('iso' => 'US','state' => 'KS','gmt' => '-7','id' => '262'),
        array('iso' => 'US','state' => 'KY','gmt' => '-5','id' => '263'),
        array('iso' => 'US','state' => 'KY','gmt' => '-6','id' => '264'),
        array('iso' => 'US','state' => 'LA','gmt' => '-6','id' => '265'),
        array('iso' => 'US','state' => 'ME','gmt' => '-5','id' => '266'),
        array('iso' => 'US','state' => 'MD','gmt' => '-5','id' => '267'),
        array('iso' => 'US','state' => 'MA','gmt' => '-5','id' => '268'),
        array('iso' => 'US','state' => 'MI','gmt' => '-5','id' => '269'),
        array('iso' => 'US','state' => 'MI','gmt' => '-6','id' => '270'),
        array('iso' => 'US','state' => 'MN','gmt' => '-6','id' => '271'),
        array('iso' => 'US','state' => 'MS','gmt' => '-6','id' => '272'),
        array('iso' => 'US','state' => 'MO','gmt' => '-6','id' => '273'),
        array('iso' => 'US','state' => 'MT','gmt' => '-7','id' => '274'),
        array('iso' => 'US','state' => 'NE','gmt' => '-6','id' => '275'),
        array('iso' => 'US','state' => 'NE','gmt' => '-7','id' => '276'),
        array('iso' => 'US','state' => 'NV','gmt' => '-8','id' => '277'),
        array('iso' => 'US','state' => 'NH','gmt' => '-5','id' => '278'),
        array('iso' => 'US','state' => 'NJ','gmt' => '-5','id' => '279'),
        array('iso' => 'US','state' => 'NM','gmt' => '-7','id' => '280'),
        array('iso' => 'US','state' => 'NY','gmt' => '-5','id' => '281'),
        array('iso' => 'US','state' => 'NC','gmt' => '-5','id' => '282'),
        array('iso' => 'US','state' => 'ND','gmt' => '-6','id' => '283'),
        array('iso' => 'US','state' => 'ND','gmt' => '-7','id' => '284'),
        array('iso' => 'US','state' => 'OH','gmt' => '-5','id' => '285'),
        array('iso' => 'US','state' => 'OK','gmt' => '-6','id' => '286'),
        array('iso' => 'US','state' => 'OR','gmt' => '-8','id' => '287'),
        array('iso' => 'US','state' => 'OR','gmt' => '-7','id' => '288'),
        array('iso' => 'US','state' => 'PA','gmt' => '-5','id' => '289'),
        array('iso' => 'US','state' => 'RI','gmt' => '-5','id' => '290'),
        array('iso' => 'US','state' => 'SC','gmt' => '-5','id' => '291'),
        array('iso' => 'US','state' => 'SD','gmt' => '-6','id' => '292'),
        array('iso' => 'US','state' => 'SD','gmt' => '-7','id' => '293'),
        array('iso' => 'US','state' => 'TN','gmt' => '-5','id' => '294'),
        array('iso' => 'US','state' => 'TN','gmt' => '-6','id' => '295'),
        array('iso' => 'US','state' => 'TX','gmt' => '-6','id' => '296'),
        array('iso' => 'US','state' => 'TX','gmt' => '-7','id' => '297'),
        array('iso' => 'US','state' => 'UT','gmt' => '-7','id' => '298'),
        array('iso' => 'US','state' => 'VT','gmt' => '-5','id' => '299'),
        array('iso' => 'US','state' => 'VA','gmt' => '-5','id' => '300'),
        array('iso' => 'US','state' => 'WA','gmt' => '-8','id' => '301'),
        array('iso' => 'US','state' => 'WV','gmt' => '-5','id' => '302'),
        array('iso' => 'US','state' => 'WI','gmt' => '-6','id' => '303'),
        array('iso' => 'US','state' => 'WY','gmt' => '-7','id' => '304')
    );

    $gmt = null;

    foreach($geo_timezones as $timezone_array)
    {
        if($_iso == $timezone_array["iso"] && $_state == $timezone_array["state"])
        {
            $gmt = $timezone_array["gmt"];
            break;
        }
        else if($_iso == $timezone_array["iso"])
            $gmt = $timezone_array["gmt"];
    }


    if($gmt !== null)
    {
        if(abs($gmt) < 10)
        {
            if($gmt < 0)
                return "-0".abs($gmt).":00";
            else
                return "+0".abs($gmt).":00";
        }
        else
        {
            if($gmt < 0)
                return "-".abs($gmt).":00";
            else
                return "+".abs($gmt).":00";
        }
    }
    return "+00:00";
}

function GetDefaultByCountry($tags)
{
    $suc=false;
    $countryiso = @$_SERVER['HTTP_ACCEPT_LANGUAGE'];
    if(isset($tags["iso2"]) && $tags["iso2"] != "-")
    {
        $suc = true;
        $countryiso = strtoupper($tags["iso2"]);
    }
    else if((($pos = strpos($countryiso,"-")) !==false) && $pos <= strlen($countryiso)-3)
    {
        $suc = true;
        $countryiso = strtoupper(substr($countryiso,$pos+1,2));
    }
    else if(($hostname = @gethostbyaddr($_SERVER['REMOTE_ADDR'])) != $_SERVER['REMOTE_ADDR'] && ($pos = strrpos($hostname,".")) !== false && $pos == strlen($hostname)-3)
    {
        $suc = true;
        $countryiso = strtoupper(substr($hostname,$pos+1,2));
    }

    if($suc)
    {
        $geo_defaults = array(
            array('id' => '1226','city' => 'Nouméa','country' => 'NC','result' => '(\'LTIyLjI2Njg=\',\'MTY2LjQ1\',\'UjAw\',\'Tm91bcOpYQ==\',\'KzExOjAw\',\'TkM=\');','count' => '2'),
            array('id' => '1225','city' => 'Podgorica','country' => 'ME','result' => '(\'NDIuNDQxMQ==\',\'MTkuMjYzNg==\',\'UjAw\',\'UG9kZ29yaWNh\',\'KzAxOjAw\',\'TUU=\');','count' => '1'),
            array('id' => '1191','city' => 'Tbilisi','country' => 'GE','result' => '(\'NDEuNzI1\',\'NDQuNzkwOA==\',\'RHVzaGV0J2lzIFJhaW9uaQ==\',\'VGJpbGlzaQ==\',\'KzA0OjAw\',\'R0U=\');','count' => '9'),
            array('id' => '24','city' => 'Bucharest','country' => 'RO','result' => '(\'NDQuNDMzMw==\',\'MjYuMQ==\',\'QnVjdXJlc3Rp\',\'QnVjaGFyZXN0\',\'KzAyOjAw\',\'Uk8=\');','count' => '814'),
            array('id' => '25','city' => 'Jakarta','country' => 'ID','result' => '(\'LTYuMTc0NA==\',\'MTA2LjgyOTQ=\',\'SmFrYXJ0YSBSYXlh\',\'SmFrYXJ0YQ==\',\'KzA5OjAw\',\'SUQ=\');','count' => '233'),
            array('id' => '1905','city' => 'Abidjan','country' => 'CI','result' => '(\'NS4zNDEx\',\'LTQuMDI4MQ==\',\'TGFndW5lcw==\',\'QWJpZGphbg==\',\'KzAwOjAw\',\'Q0k=\');','count' => '1'),
            array('id' => '28','city' => 'Oslo','country' => 'NO','result' => '(\'NTkuOTE2Nw==\',\'MTAuNzU=\',\'T3Nsbw==\',\'T3Nsbw==\',\'KzAxOjAw\',\'Tk8=\');','count' => '51'),
            array('id' => '33','city' => 'Amman','country' => 'JO','result' => '(\'MzEuOTU=\',\'MzUuOTMzMw==\',\'QW1tYW4gR292ZXJub3JhdGU=\',\'QW1tYW4=\',\'KzAyOjAw\',\'Sk8=\');','count' => '54'),
            array('id' => '35','city' => 'Bangkok','country' => 'TH','result' => '(\'MTMuNzU=\',\'MTAwLjUxNjc=\',\'S3J1bmcgVGhlcA==\',\'QmFuZ2tvaw==\',\'KzA3OjAw\',\'VEg=\');','count' => '370'),
            array('id' => '41','city' => 'Zürich','country' => 'CH','result' => '(\'NDcuMzY2Nw==\',\'OC41NQ==\',\'WnVyaWNo\',\'WsO8cmljaA==\',\'KzAxOjAw\',\'Q0g=\');','count' => '75'),
            array('id' => '46','city' => 'Dubai','country' => 'AE','result' => '(\'MjUuMjUyMQ==\',\'NTUuMjg=\',\'RHViYWk=\',\'RHViYWk=\',\'KzA0OjAw\',\'QUU=\');','count' => '49'),
            array('id' => '1735','city' => 'Sydney','country' => 'AU','result' => '(\'LTMzLjg4MzM=\',\'MTUxLjIxNjc=\',\'TmV3IFNvdXRoIFdhbGVz\',\'U3lkbmV5\',\'KzEwOjAw\',\'QVU=\');','count' => '8'),
            array('id' => '50','city' => 'Istanbul','country' => 'TR','result' => '(\'NDEuMDE4Ng==\',\'MjguOTY0Nw==\',\'SXN0YW5idWw=\',\'SXN0YW5idWw=\',\'KzAyOjAw\',\'VFI=\');','count' => '650'),
            array('id' => '55','city' => 'Kiev','country' => 'UA','result' => '(\'NTAuNDMzMw==\',\'MzAuNTE2Nw==\',\'S3l5aXZzJ2thIE9ibGFzdCc=\',\'S2lldg==\',\'KzAyOjAw\',\'VUE=\');','count' => '52'),
            array('id' => '61','city' => 'Johannesburg','country' => 'ZA','result' => '(\'LTI2LjI=\',\'MjguMDgzMw==\',\'R2F1dGVuZw==\',\'Sm9oYW5uZXNidXJn\',\'KzAyOjAw\',\'WkE=\');','count' => '132'),
            array('id' => '67','city' => 'Kuala Lumpur','country' => 'MY','result' => '(\'My4xNjY3\',\'MTAxLjc=\',\'S3VhbGEgTHVtcHVy\',\'S3VhbGEgTHVtcHVy\',\'KzA4OjAw\',\'TVk=\');','count' => '110'),
            array('id' => '69','city' => 'Madrid','country' => 'ES','result' => '(\'NDAuNA==\',\'LTMuNjgzMw==\',\'TWFkcmlk\',\'TWFkcmlk\',\'KzAwOjAw\',\'RVM=\');','count' => '154'),
            array('id' => '1214','city' => 'Nairobi','country' => 'KE','result' => '(\'LTEuMjgzMw==\',\'MzYuODE2Nw==\',\'TmFpcm9iaSBBcmVh\',\'TmFpcm9iaQ==\',\'KzAzOjAw\',\'S0U=\');','count' => '4'),
            array('id' => '83','city' => 'Stockholm','country' => 'SE','result' => '(\'NTkuMzMzMw==\',\'MTguMDU=\',\'U3RvY2tob2xtcyBMYW4=\',\'U3RvY2tob2xt\',\'KzAxOjAw\',\'U0U=\');','count' => '32'),
            array('id' => '96','city' => 'Hanoi','country' => 'VN','result' => '(\'MjEuMDMzMw==\',\'MTA1Ljg1\',\'RGFjIExhYw==\',\'SGFub2k=\',\'KzA3OjAw\',\'Vk4=\');','count' => '140'),
            array('id' => '102','city' => 'Riyadh','country' => 'SA','result' => '(\'MjQuNjQwOA==\',\'NDYuNzcyOA==\',\'QXIgUml5YWQ=\',\'Uml5YWRo\',\'KzAzOjAw\',\'U0E=\');','count' => '97'),
            array('id' => '119','city' => 'Beirut','country' => 'LB','result' => '(\'MzMuODcxOQ==\',\'MzUuNTA5Nw==\',\'QmV5cm91dGg=\',\'QmVpcnV0\',\'KzAyOjAw\',\'TEI=\');','count' => '41'),
            array('id' => '869','city' => 'Haifa','country' => 'IL','result' => '(\'MzIuODE1Ng==\',\'MzQuOTg5Mg==\',\'SGVmYQ==\',\'SGFpZmE=\',\'KzAyOjAw\',\'SUw=\');','count' => '10'),
            array('id' => '1176','city' => 'Hebron','country' => 'PS','result' => '(\'MzEuNTMzMw==\',\'MzUuMQ==\',\'UjAw\',\'SGVicm9u\',\'KzAyOjAw\',\'UFM=\');','count' => '1'),
            array('id' => '139','city' => 'Paris','country' => 'FR','result' => '(\'NDguODY2Nw==\',\'Mi4zMzMz\',\'SWxlLWRlLUZyYW5jZQ==\',\'UGFyaXM=\',\'KzAxOjAw\',\'RlI=\');','count' => '115'),
            array('id' => '1206','city' => 'Algiers','country' => 'DZ','result' => '(\'MzYuNzYzMQ==\',\'My4wNTA2\',\'QWxnZXI=\',\'QWxnaWVycw==\',\'KzAxOjAw\',\'RFo=\');','count' => '3'),
            array('id' => '161','city' => 'Brussels','country' => 'BE','result' => '(\'NTAuODMzMw==\',\'NC4zMzMz\',\'QnJ1c3NlbHMgSG9vZmRzdGVkZWxpamsgR2V3ZXN0\',\'QnJ1c3NlbHM=\',\'KzAxOjAw\',\'QkU=\');','count' => '54'),
            array('id' => '169','city' => 'Dublin','country' => 'IE','result' => '(\'NTMuMzMzMQ==\',\'LTYuMjQ4OQ==\',\'RHVibGlu\',\'RHVibGlu\',\'KzAwOjAw\',\'SUU=\');','count' => '30'),
            array('id' => '173','city' => 'Budapest','country' => 'HU','result' => '(\'NDcuNQ==\',\'MTkuMDgzMw==\',\'QnVkYXBlc3Q=\',\'QnVkYXBlc3Q=\',\'KzAxOjAw\',\'SFU=\');','count' => '58'),
            array('id' => '180','city' => 'Singapore','country' => 'SG','result' => '(\'MS4yOTMx\',\'MTAzLjg1NTg=\',\'UjAw\',\'U2luZ2Fwb3Jl\',\'KzA4OjAw\',\'U0c=\');','count' => '115'),
            array('id' => '185','city' => 'Prague','country' => 'CZ','result' => '(\'NTAuMDgzMw==\',\'MTQuNDY2Nw==\',\'SGxhdm5pIE1lc3RvIFByYWhh\',\'UHJhZ3Vl\',\'KzAxOjAw\',\'Q1o=\');','count' => '34'),
            array('id' => '196','city' => 'Zagreb','country' => 'HR','result' => '(\'NDUuOA==\',\'MTY=\',\'R3JhZCBaYWdyZWI=\',\'WmFncmVi\',\'KzAxOjAw\',\'SFI=\');','count' => '32'),
            array('id' => '1195','city' => 'Betzdorf','country' => 'LU','result' => '(\'NDkuNjgzMw==\',\'Ni4zNQ==\',\'R3JldmVubWFjaGVy\',\'QmV0emRvcmY=\',\'KzAxOjAw\',\'TFU=\');','count' => '2'),
            array('id' => '200','city' => 'Ljubljana','country' => 'SI','result' => '(\'NDYuMDU1Mw==\',\'MTQuNTE0NA==\',\'Qm9oaW5q\',\'TGp1YmxqYW5h\',\'KzAxOjAw\',\'U0k=\');','count' => '113'),
            array('id' => '1615','city' => 'Moscow','country' => 'RU','result' => '(\'NTUuNzUyMg==\',\'MzcuNjE1Ng==\',\'TW9zY293IENpdHk=\',\'TW9zY293\',\'KzEyOjAw\',\'UlU=\');','count' => '9'),
            array('id' => '202','city' => 'Islamabad','country' => 'PK','result' => '(\'MzMuNw==\',\'NzMuMTY2Nw==\',\'SXNsYW1hYmFk\',\'SXNsYW1hYmFk\',\'KzA1OjAw\',\'UEs=\');','count' => '26'),
            array('id' => '204','city' => 'Sofia','country' => 'BG','result' => '(\'NDIuNjgzMw==\',\'MjMuMzE2Nw==\',\'R3JhZCBTb2ZpeWE=\',\'U29maWE=\',\'KzAyOjAw\',\'Qkc=\');','count' => '42'),
            array('id' => '209','city' => 'Tehran','country' => 'IR','result' => '(\'MzIuNzAyNg==\',\'NTEuMTUzNw==\',\'RXNmYWhhbg==\',\'VGVocmFu\',\'KzA0OjAw\',\'SVI=\');','count' => '55'),
            array('id' => '210','city' => 'Manama','country' => 'BH','result' => '(\'MjYuMjM2MQ==\',\'NTAuNTgzMQ==\',\'QWwgTWFuYW1haA==\',\'TWFuYW1h\',\'KzAzOjAw\',\'Qkg=\');','count' => '7'),
            array('id' => '1926','city' => 'Honiara','country' => 'SB','result' => '(\'LTkuNDMzMw==\',\'MTU5Ljk1\',\'TWFraXJh\',\'SG9uaWFyYQ==\',\'KzExOjAw\',\'U0I=\');','count' => '1'),
            array('id' => '232','city' => 'Central District','country' => 'HK','result' => '(\'MjIuMjgzMw==\',\'MTE0LjE1\',\'UjAw\',\'Q2VudHJhbCBEaXN0cmljdA==\',\'KzA4OjAw\',\'SEs=\');','count' => '48'),
            array('id' => '233','city' => 'Vilnius','country' => 'LT','result' => '(\'NTQuNjgzMw==\',\'MjUuMzE2Nw==\',\'VmlsbmlhdXMgQXBza3JpdGlz\',\'Vmlsbml1cw==\',\'KzAyOjAw\',\'TFQ=\');','count' => '47'),
            array('id' => '236','city' => 'Taipei','country' => 'TW','result' => '(\'MjUuMDM5Mg==\',\'MTIxLjUyNQ==\',\'VCdhaS1wZWk=\',\'VGFpcGVp\',\'KzA4OjAw\',\'VFc=\');','count' => '38'),
            array('id' => '240','city' => 'Bratislava','country' => 'SK','result' => '(\'NDguMTU=\',\'MTcuMTE2Nw==\',\'QnJhdGlzbGF2YQ==\',\'QnJhdGlzbGF2YQ==\',\'KzAxOjAw\',\'U0s=\');','count' => '26'),
            array('id' => '241','city' => 'Buenos Aires','country' => 'AR','result' => '(\'LTM0LjU4NzU=\',\'LTU4LjY3MjU=\',\'RGlzdHJpdG8gRmVkZXJhbA==\',\'QnVlbm9zIEFpcmVz\',\'LTAyOjAw\',\'QVI=\');','count' => '17'),
            array('id' => '243','city' => 'Colombo','country' => 'LK','result' => '(\'Ni45MzE5\',\'NzkuODQ3OA==\',\'V2VzdGVybg==\',\'Q29sb21ibw==\',\'KzA2OjAw\',\'TEs=\');','count' => '16'),
            array('id' => '246','city' => 'Nicosia','country' => 'CY','result' => '(\'MzUuMTY2Nw==\',\'MzMuMzY2Nw==\',\'Tmljb3NpYQ==\',\'Tmljb3NpYQ==\',\'KzAyOjAw\',\'Q1k=\');','count' => '9'),
            array('id' => '253','city' => 'Skopje','country' => 'MK','result' => '(\'NDI=\',\'MjEuNDMzMw==\',\'S2FycG9z\',\'U2tvcGpl\',\'KzAxOjAw\',\'TUs=\');','count' => '29'),
            array('id' => '255','city' => 'Chisinau','country' => 'MD','result' => '(\'NDcuMDA1Ng==\',\'MjguODU3NQ==\',\'Q2hpc2luYXU=\',\'Q2hpc2luYXU=\',\'KzAyOjAw\',\'TUQ=\');','count' => '23'),
            array('id' => '259','city' => 'Almaty','country' => 'KZ','result' => '(\'NDMuMjU=\',\'NzYuOTU=\',\'QWxtYXR5IENpdHk=\',\'QWxtYXR5\',\'KzA1OjAw\',\'S1o=\');','count' => '11'),
            array('id' => '261','city' => 'Doha','country' => 'QA','result' => '(\'MjUuMjg2Nw==\',\'NTEuNTMzMw==\',\'QWQgRGF3aGFo\',\'RG9oYQ==\',\'KzAzOjAw\',\'UUE=\');','count' => '37'),
            array('id' => '265','city' => 'Belgrade','country' => 'RS','result' => '(\'NDQuODE4Ng==\',\'MjAuNDY4MQ==\',\'U2VyYmlhIHByb3Blcg==\',\'QmVsZ3JhZGU=\',\'KzAxOjAw\',\'UlM=\');','count' => '38'),
            array('id' => '1132','city' => 'Tirana','country' => 'AL','result' => '(\'NDEuMzI3NQ==\',\'MTkuODE4OA==\',\'VGlyYW5l\',\'VGlyYW5h\',\'KzAxOjAw\',\'QUw=\');','count' => '2'),
            array('id' => '311','city' => 'Amsterdam','country' => 'NL','result' => '(\'NTIuMzU=\',\'NC45MTY3\',\'Tm9vcmQtSG9sbGFuZA==\',\'QW1zdGVyZGFt\',\'KzAxOjAw\',\'Tkw=\');','count' => '79'),
            array('id' => '313','city' => 'Tokyo','country' => 'JP','result' => '(\'MzUuNjg1\',\'MTM5Ljc1MTQ=\',\'VG9reW8=\',\'VG9reW8=\',\'KzA5OjAw\',\'SlA=\');','count' => '17'),
            array('id' => '325','city' => 'Riga','country' => 'LV','result' => '(\'NTYuOTU=\',\'MjQuMQ==\',\'UmlnYQ==\',\'UmlnYQ==\',\'KzAyOjAw\',\'TFY=\');','count' => '19'),
            array('id' => '337','city' => 'Milan','country' => 'IT','result' => '(\'NDUuNDY2Nw==\',\'OS4y\',\'TG9tYmFyZGlh\',\'TWlsYW4=\',\'KzAxOjAw\',\'SVQ=\');','count' => '166'),
            array('id' => '343','city' => 'Warsaw','country' => 'PL','result' => '(\'NTIuMjU=\',\'MjE=\',\'V2Fyc3phd2E=\',\'V2Fyc2F3\',\'KzAxOjAw\',\'UEw=\');','count' => '65'),
            array('id' => '1920','city' => 'Baie-mahault','country' => 'GP','result' => '(\'MTYuMjY2Nw==\',\'LTYxLjU4MzM=\',\'UjAw\',\'QmFpZS1tYWhhdWx0\',\'LTA0OjAw\',\'R1A=\');','count' => '1'),
            array('id' => '1921','city' => 'Klaksvík','country' => 'FO','result' => '(\'NjIuMjMzMw==\',\'LTYuNg==\',\'UjAw\',\'S2xha3N2w61r\',\'KzAwOjAw\',\'Rk8=\');','count' => '1'),
            array('id' => '1099','city' => 'Male','country' => 'MV','result' => '(\'NC4xNjY3\',\'NzMuNQ==\',\'TWFsZQ==\',\'TWFsZQ==\',\'KzA1OjAw\',\'TVY=\');','count' => '3'),
            array('id' => '1374','city' => 'La Habana','country' => 'CU','result' => '(\'MjEuMzYxNA==\',\'LTc4LjMzNjE=\',\'Q2FtYWd1ZXk=\',\'TGEgSGFiYW5h\',\'LTA1OjAw\',\'Q1U=\');','count' => '1'),
            array('id' => '373','city' => 'Auckland','country' => 'NZ','result' => '(\'LTM2Ljg2Njc=\',\'MTc0Ljc2Njc=\',\'QXVja2xhbmQ=\',\'QXVja2xhbmQ=\',\'KzE0OjAw\',\'Tlo=\');','count' => '16'),
            array('id' => '412','city' => 'Copenhagen','country' => 'DK','result' => '(\'NTUuNjY2Nw==\',\'MTIuNTgzMw==\',\'U3RhZGVuIEtvYmVuaGF2bg==\',\'Q29wZW5oYWdlbg==\',\'KzAxOjAw\',\'REs=\');','count' => '79'),
            array('id' => '1057','city' => 'Helsinki','country' => 'FI','result' => '(\'NjAuMTc1Ng==\',\'MjQuOTM0Mg==\',\'U291dGhlcm4gRmlubGFuZA==\',\'SGVsc2lua2k=\',\'KzAyOjAw\',\'Rkk=\');','count' => '9'),
            array('id' => '1666','city' => 'São Paulo','country' => 'BR','result' => '(\'LTIzLjUzMzM=\',\'LTQ2LjYxNjc=\',\'U2FvIFBhdWxv\',\'U8OjbyBQYXVsbw==\',\'LTA1OjAw\',\'QlI=\');','count' => '28'),
            array('id' => '1045','city' => 'Mostar','country' => 'BA','result' => '(\'NDMuMzQzMw==\',\'MTcuODA4MQ==\',\'RmVkZXJhdGlvbiBvZiBCb3NuaWEgYW5kIEhlcnplZ292aW5h\',\'TW9zdGFy\',\'KzAxOjAw\',\'QkE=\');','count' => '1'),
            array('id' => '1605','city' => 'Berlin','country' => 'DE','result' => '(\'NTIuNTE2Nw==\',\'MTMuNA==\',\'QmVybGlu\',\'QmVybGlu\',\'KzAxOjAw\',\'REU=\');','count' => '45'),
            array('id' => '483','city' => 'Seoul','country' => 'KR','result' => '(\'MzcuNTY2NA==\',\'MTI2Ljk5OTc=\',\'U2VvdWwtdCd1a3B5b2xzaQ==\',\'U2VvdWw=\',\'KzA5OjAw\',\'S1I=\');','count' => '23'),
            array('id' => '1000','city' => 'Tunis','country' => 'TN','result' => '(\'MzYuODAyOA==\',\'MTAuMTc5Nw==\',\'MjY=\',\'VHVuaXM=\',\'KzAxOjAw\',\'VE4=\');','count' => '6'),
            array('id' => '997','city' => 'Damascus','country' => 'SY','result' => '(\'MzMuNQ==\',\'MzYuMw==\',\'RGltYXNocQ==\',\'RGFtYXNjdXM=\',\'KzAyOjAw\',\'U1k=\');','count' => '4'),
            array('id' => '977','city' => 'Dhaka','country' => 'BD','result' => '(\'MjMuNzIz\',\'OTAuNDA4Ng==\',\'RGhha2E=\',\'RGhha2E=\',\'KzA2OjAw\',\'QkQ=\');','count' => '12'),
            array('id' => '579','city' => 'Montreal','country' => 'CA','result' => '(\'NDUuNQ==\',\'LTczLjU4MzM=\',\'UXVlYmVj\',\'TW9udHJlYWw=\',\'LTA4OjAw\',\'Q0E=\');','count' => '8'),
            array('id' => '968','city' => 'Rabat','country' => 'MA','result' => '(\'MzQuMDI1Mw==\',\'LTYuODM2MQ==\',\'UmFiYXQtU2FsZQ==\',\'UmFiYXQ=\',\'KzAwOjAw\',\'TUE=\');','count' => '7'),
            array('id' => '602','city' => 'Minsk','country' => 'BY','result' => '(\'NTMuOQ==\',\'MjcuNTY2Nw==\',\'TWluc2s=\',\'TWluc2s=\',\'KzAyOjAw\',\'Qlk=\');','count' => '7'),
            array('id' => '946','city' => 'Kingston','country' => 'JM','result' => '(\'MTg=\',\'LTc2Ljg=\',\'U2FpbnQgQW5kcmV3\',\'S2luZ3N0b24=\',\'LTA1OjAw\',\'Sk0=\');','count' => '1'),
            array('id' => '1347','city' => 'Bandar Seri Begawan','country' => 'BN','result' => '(\'NC44ODMz\',\'MTE0LjkzMzM=\',\'UjAw\',\'QmFuZGFyIFNlcmkgQmVnYXdhbg==\',\'KzA4OjAw\',\'Qk4=\');','count' => '1'),
            array('id' => '1834','city' => 'Porto','country' => 'PT','result' => '(\'NDEuMTU=\',\'LTguNjE2Nw==\',\'UG9ydG8=\',\'UG9ydG8=\',\'LTAxOjAw\',\'UFQ=\');','count' => '3'),
            array('id' => '1632','city' => 'Athens','country' => 'GR','result' => '(\'MzcuOTgzMw==\',\'MjMuNzMzMg==\',\'QXR0aWtp\',\'QXRoZW5z\',\'KzAyOjAw\',\'R1I=\');','count' => '22'),
            array('id' => '656','city' => 'Tallinn','country' => 'EE','result' => '(\'NTkuNDMzOQ==\',\'MjQuNzI4MQ==\',\'SGFyanVtYWE=\',\'VGFsbGlubg==\',\'KzAyOjAw\',\'RUU=\');','count' => '13'),
            array('id' => '1409','city' => 'Muscat','country' => 'OM','result' => '(\'MjMuNjEzMw==\',\'NTguNTkzMw==\',\'TWFzcWF0\',\'TXVzY2F0\',\'KzA0OjAw\',\'T00=\');','count' => '4'),
            array('id' => '662','city' => 'Luanda','country' => 'AO','result' => '(\'LTguODM4Mw==\',\'MTMuMjM0NA==\',\'THVhbmRh\',\'THVhbmRh\',\'KzAxOjAw\',\'QU8=\');','count' => '7'),
            array('id' => '666','city' => 'Mexico','country' => 'MX','result' => '(\'MTkuNDM0Mg==\',\'LTk5LjEzODY=\',\'RGlzdHJpdG8gRmVkZXJhbA==\',\'TWV4aWNv\',\'LTA4OjAw\',\'TVg=\');','count' => '5'),
            array('id' => '670','city' => 'Manila','country' => 'PH','result' => '(\'MTQuNjA0Mg==\',\'MTIwLjk4MjI=\',\'TWFuaWxh\',\'TWFuaWxh\',\'KzA4OjAw\',\'UEg=\');','count' => '16'),
            array('id' => '2263','city' => 'New York','country' => 'US','result' => '(\'NDAuNzYxOQ==\',\'LTczLjk3NjM=\',\'TmV3IFlvcms=\',\'TmV3IFlvcms=\',\'LTA1OjAw\',\'VVM=\');','count' => '1000'),
            array('id' => '702','city' => 'Baghdad','country' => 'IQ','result' => '(\'MzMuMzM4Ng==\',\'NDQuMzkzOQ==\',\'QmFnaGRhZA==\',\'QmFnaGRhZA==\',\'KzAzOjAw\',\'SVE=\');','count' => '4'),
            array('id' => '1378','city' => 'Baku','country' => 'AZ','result' => '(\'NDAuMzk1Mw==\',\'NDkuODgyMg==\',\'QmFraQ==\',\'QmFrdQ==\',\'KzA0OjAw\',\'QVo=\');','count' => '1'),
            array('id' => '1656','city' => 'Beijing','country' => 'CN','result' => '(\'MzkuOTI4OQ==\',\'MTE2LjM4ODM=\',\'QmVpamluZw==\',\'QmVpamluZw==\',\'KzA4OjAw\',\'Q04=\');','count' => '25'),
            array('id' => '1651','city' => 'London','country' => 'GB','result' => '(\'NTEuNQ==\',\'LTAuMTE2NzAwMDAwMDAwMDE=\',\'TG9uZG9uLCBDaXR5IG9m\',\'TG9uZG9u\',\'KzAwOjAw\',\'R0I=\');','count' => '26'),
            array('id' => '819','city' => 'Phnum Pénh','country' => 'KH','result' => '(\'MTEuNTU=\',\'MTA0LjkxNjc=\',\'UGhudW0gUGVuaA==\',\'UGhudW0gUMOpbmg=\',\'KzA3OjAw\',\'S0g=\');','count' => '4'),
            array('id' => '1747','city' => 'Madras','country' => 'IN','result' => '(\'MTMuMDgzMw==\',\'ODAuMjgzMw==\',\'VGFtaWwgTmFkdQ==\',\'TWFkcmFz\',\'KzA2OjAw\',\'SU4=\');','count' => '19'),
            array('id' => '1353','city' => 'Huancayo','country' => 'PE','result' => '(\'LTEyLjA2Njc=\',\'LTc1LjIzMzM=\',\'SnVuaW4=\',\'SHVhbmNheW8=\',\'LTA1OjAw\',\'UEU=\');','count' => '2'),
            array('id' => '1237','city' => 'Curepipe','country' => 'MU','result' => '(\'LTIwLjMxNDc=\',\'NTcuNTIwMw==\',\'UGxhaW5lcyBXaWxoZW1z\',\'Q3VyZXBpcGU=\',\'KzA0OjAw\',\'TVU=\');','count' => '2'),
            array('id' => '1246','city' => 'Harare','country' => 'ZW','result' => '(\'LTE3LjgxNzg=\',\'MzEuMDQ0Nw==\',\'TWFzaG9uYWxhbmQgRWFzdA==\',\'SGFyYXJl\',\'KzAyOjAw\',\'Wlc=\');','count' => '1'),
            array('id' => '1924','city' => 'Gaborone','country' => 'BW','result' => '(\'LTI0LjY0NjQ=\',\'MjUuOTExOQ==\',\'U291dGgtRWFzdA==\',\'R2Fib3JvbmU=\',\'KzAyOjAw\',\'Qlc=\');','count' => '1'),
            array('id' => '1925','city' => 'San Juan','country' => 'PR','result' => '(\'MTguNDIwNw==\',\'LTY2LjA2MTY=\',\'UjAw\',\'U2FuIEp1YW4=\',\'LTA0OjAw\',\'UFI=\');','count' => '1'),
            array('id' => '1269','city' => 'Tashkent','country' => 'UZ','result' => '(\'NDEuMzE2Nw==\',\'NjkuMjU=\',\'VG9zaGtlbnQ=\',\'VGFzaGtlbnQ=\',\'KzA1OjAw\',\'VVo=\');','count' => '3'),
            array('id' => '1282','city' => 'Kathmandu','country' => 'NP','result' => '(\'MjcuNzE2Nw==\',\'ODUuMzE2Ng==\',\'UjAw\',\'S2F0aG1hbmR1\',\'KzA2OjAw\',\'TlA=\');','count' => '3'),
            array('id' => '1286','city' => 'Andorra La Vella','country' => 'AD','result' => '(\'NDIuNQ==\',\'MS41MTY3\',\'QW5kb3JyYSBsYSBWZWxsYQ==\',\'QW5kb3JyYSBMYSBWZWxsYQ==\',\'KzAxOjAw\',\'QUQ=\');','count' => '7'),
            array('id' => '1293','city' => 'Tegucigalpa','country' => 'HN','result' => '(\'MTQuMQ==\',\'LTg3LjIxNjc=\',\'RnJhbmNpc2NvIE1vcmF6YW4=\',\'VGVndWNpZ2FscGE=\',\'LTA2OjAw\',\'SE4=\');','count' => '1'),
            array('id' => '1907','city' => 'Gamprin','country' => 'LI','result' => '(\'NDcuMjE2Nw==\',\'OS41\',\'R2FtcHJpbg==\',\'R2FtcHJpbg==\',\'KzAxOjAw\',\'TEk=\');','count' => '1'),
            array('id' => '1302','city' => 'Santiago','country' => 'CL','result' => '(\'LTMzLjQ1\',\'LTcwLjY2Njc=\',\'UmVnaW9uIE1ldHJvcG9saXRhbmE=\',\'U2FudGlhZ28=\',\'LTA1OjAw\',\'Q0w=\');','count' => '5'),
            array('id' => '1321','city' => 'Quito','country' => 'EC','result' => '(\'LTAuMjE2Nw==\',\'LTc4LjU=\',\'UGljaGluY2hh\',\'UXVpdG8=\',\'LTA2OjAw\',\'RUM=\');','count' => '1'),
            array('id' => '1335','city' => 'Sana','country' => 'YE','result' => '(\'MTUuNA==\',\'NDcuNzY2Nw==\',\'SGFkcmFtYXd0\',\'U2FuYQ==\',\'KzAzOjAw\',\'WUU=\');','count' => '3'),
            array('id' => '1913','city' => 'Maputo','country' => 'MZ','result' => '(\'LTI1Ljk2NTQ=\',\'MzIuNTg5Mg==\',\'TWFwdXRv\',\'TWFwdXRv\',\'KzAyOjAw\',\'TVo=\');','count' => '1'),
            array('id' => '1915','city' => 'Guatemala City','country' => 'GT','result' => '(\'MTQuNjIxMQ==\',\'LTkwLjUyNjk=\',\'R3VhdGVtYWxh\',\'R3VhdGVtYWxhIENpdHk=\',\'LTA2OjAw\',\'R1Q=\');','count' => '1'),
            array('id' => '1916','city' => 'Khartoum','country' => 'SD','result' => '(\'MTUuNTg4MQ==\',\'MzIuNTM0Mg==\',\'QWwgS2hhcnR1bQ==\',\'S2hhcnRvdW0=\',\'KzAzOjAw\',\'U0Q=\');','count' => '1'),
            array('id' => '1918','city' => 'Dushanbe','country' => 'TJ','result' => '(\'MzguNTY=\',\'NjguNzczOQ==\',\'S2hhdGxvbg==\',\'RHVzaGFuYmU=\',\'KzA1OjAw\',\'VEo=\');','count' => '1'),
            array('id' => '1385','city' => 'Nassau','country' => 'BS','result' => '(\'MjUuMDgzMw==\',\'LTc3LjM1\',\'TmV3IFByb3ZpZGVuY2U=\',\'TmFzc2F1\',\'LTA1OjAw\',\'QlM=\');','count' => '1'),
            array('id' => '1391','city' => 'Accra','country' => 'GH','result' => '(\'NS41NQ==\',\'LTAuMjE2Nw==\',\'R3JlYXRlciBBY2NyYQ==\',\'QWNjcmE=\',\'KzAwOjAw\',\'R0g=\');','count' => '2'),
            array('id' => '1392','city' => 'Kampala','country' => 'UG','result' => '(\'MC4zMTU1OTk5OTk5OTk5OQ==\',\'MzIuNTY1Ng==\',\'S2FtcGFsYQ==\',\'S2FtcGFsYQ==\',\'KzAzOjAw\',\'VUc=\');','count' => '2'),
            array('id' => '1422','city' => 'Santo Domingo','country' => 'DO','result' => '(\'MTguNDY2Nw==\',\'LTY5Ljk=\',\'RGlzdHJpdG8gTmFjaW9uYWw=\',\'U2FudG8gRG9taW5nbw==\',\'LTA0OjAw\',\'RE8=\');','count' => '1'),
            array('id' => '1430','city' => 'Sanaa','country' => 'YE','result' => '(\'MTUuMzU0Nw==\',\'NDQuMjA2Nw==\',\'U2Fu\',\'U2FuYWE=\',\'KzAzOjAw\',\'WUU=\');','count' => '1'),
            array('id' => '1434','city' => 'Port-of-spain','country' => 'TT','result' => '(\'MTAuNjU=\',\'LTYxLjUxNjc=\',\'UG9ydC1vZi1TcGFpbg==\',\'UG9ydC1vZi1zcGFpbg==\',\'LTA0OjAw\',\'VFQ=\');','count' => '2'),
            array('id' => '1473','city' => 'Reykjavík','country' => 'IS','result' => '(\'NjQuMTU=\',\'LTIxLjk1\',\'R3VsbGJyaW5ndXN5c2xh\',\'UmV5a2phdsOtaw==\',\'KzAwOjAw\',\'SVM=\');','count' => '3'),
            array('id' => '1477','city' => 'Caracas','country' => 'VE','result' => '(\'MTAuNQ==\',\'LTY2LjkxNjc=\',\'RGlzdHJpdG8gRmVkZXJhbA==\',\'Q2FyYWNhcw==\',\'LTA1OjAw\',\'VkU=\');','count' => '3'),
            array('id' => '1930','city' => 'Gibraltar','country' => 'GI','result' => '(\'MzYuMTMzMw==\',\'LTUuMzU=\',\'UjAw\',\'R2licmFsdGFy\',\'KzAxOjAw\',\'R0k=\');','count' => '1'),
            array('id' => '1931','city' => 'Philipsburg','country' => 'AN','result' => '(\'MTguMDE2Nw==\',\'LTYzLjAzMzM=\',\'UjAw\',\'UGhpbGlwc2J1cmc=\',\'LTA0OjAw\',\'QU4=\');','count' => '1'),
            array('id' => '1911','city' => 'Paramaribo','country' => 'SR','result' => '(\'NS44MzMz\',\'LTU1LjE2Njc=\',\'UGFyYW1hcmlibw==\',\'UGFyYW1hcmlibw==\',\'LTAzOjAw\',\'U1I=\');','count' => '1'),
            array('id' => '1487','city' => 'Dakar','country' => 'SN','result' => '(\'MTQuNjcwNw==\',\'LTE3LjQzODE=\',\'RGFrYXI=\',\'RGFrYXI=\',\'KzAwOjAw\',\'U04=\');','count' => '2'),
            array('id' => '1621','city' => 'Vienna','country' => 'AT','result' => '(\'NDguMg==\',\'MTYuMzY2Nw==\',\'V2llbg==\',\'Vmllbm5h\',\'KzAxOjAw\',\'QVQ=\');','count' => '19'),
            array('id' => '1520','city' => 'Kabul','country' => 'AF','result' => '(\'MzQuNTE2Nw==\',\'NjkuMTgzMw==\',\'S2Fib2w=\',\'S2FidWw=\',\'KzA1OjAw\',\'QUY=\');','count' => '1'),
            array('id' => '1807','city' => 'Cairo','country' => 'EG','result' => '(\'MzAuMDU=\',\'MzEuMjU=\',\'QWwgUWFoaXJhaA==\',\'Q2Fpcm8=\',\'KzAyOjAw\',\'RUc=\');','count' => '5'),
            array('id' => '1524','city' => 'Macau','country' => 'MO','result' => '(\'MjIuMg==\',\'MTEzLjU1\',\'SWxoYXM=\',\'TWFjYXU=\',\'KzA4OjAw\',\'TU8=\');','count' => '2'),
            array('id' => '1908','city' => 'Castries','country' => 'LC','result' => '(\'MTQ=\',\'LTYx\',\'Q2FzdHJpZXM=\',\'Q2FzdHJpZXM=\',\'LTA0OjAw\',\'TEM=\');','count' => '1'),
            array('id' => '1906','city' => 'Fontvieille','country' => 'MC','result' => '(\'NDMuNzMzMw==\',\'Ny40MTY3\',\'UjAw\',\'Rm9udHZpZWlsbGU=\',\'KzAxOjAw\',\'TUM=\');','count' => '1'),
            array('id' => '1533','city' => 'Tripoli','country' => 'LY','result' => '(\'MzIuODkyNQ==\',\'MTMuMTg=\',\'VGFyYWJ1bHVz\',\'VHJpcG9saQ==\',\'KzAyOjAw\',\'TFk=\');','count' => '1'),
            array('id' => '1922','city' => 'Port-au-prince','country' => 'HT','result' => '(\'MTguNTM5Mg==\',\'LTcyLjMzNQ==\',\'T3Vlc3Q=\',\'UG9ydC1hdS1wcmluY2U=\',\'LTA1OjAw\',\'SFQ=\');','count' => '1'),
            array('id' => '1919','city' => 'Libreville','country' => 'GA','result' => '(\'MC4zODMyOTk5OTk5OTk5OQ==\',\'OS40NQ==\',\'RXN0dWFpcmU=\',\'TGlicmV2aWxsZQ==\',\'KzAxOjAw\',\'R0E=\');','count' => '1'),
            array('id' => '1541','city' => 'Melita','country' => 'MT','result' => '(\'MzUuODg2OQ==\',\'MTQuNDAyNQ==\',\'UjAw\',\'TWVsaXRh\',\'KzAxOjAw\',\'TVQ=\');','count' => '2'),
            array('id' => '1542','city' => 'Vientiane','country' => 'LA','result' => '(\'MTcuOTY2Nw==\',\'MTAyLjY=\',\'VmllbnRpYW5l\',\'VmllbnRpYW5l\',\'KzA3OjAw\',\'TEE=\');','count' => '1'),
            array('id' => '1545','city' => 'Dar Es Salaam','country' => 'TZ','result' => '(\'LTYuOA==\',\'MzkuMjgzMw==\',\'RGFyIGVzIFNhbGFhbQ==\',\'RGFyIEVzIFNhbGFhbQ==\',\'KzAzOjAw\',\'VFo=\');','count' => '2'),
            array('id' => '1546','city' => 'Thimphu','country' => 'BT','result' => '(\'MjcuNDgzMg==\',\'ODkuNg==\',\'VGhpbXBodQ==\',\'VGhpbXBodQ==\',\'KzA2OjAw\',\'QlQ=\');','count' => '1'),
            array('id' => '1548','city' => 'Hawalli','country' => 'KW','result' => '(\'MjkuMzMyOA==\',\'NDguMDI4Ng==\',\'QWwgS3V3YXl0\',\'SGF3YWxsaQ==\',\'KzAzOjAw\',\'S1c=\');','count' => '2'),
            array('id' => '1551','city' => 'Ikeja','country' => 'NG','result' => '(\'Ni41OTY3\',\'My4zNDMx\',\'TGFnb3M=\',\'SWtlamE=\',\'KzAxOjAw\',\'Tkc=\');','count' => '4'),
            array('id' => '1556','city' => 'Lusaka','country' => 'ZM','result' => '(\'LTE1LjQxNjc=\',\'MjguMjgzMw==\',\'THVzYWth\',\'THVzYWth\',\'KzAyOjAw\',\'Wk0=\');','count' => '2'),
            array('id' => '2077','city' => 'Christiansted','country' => 'VI','result' => '(\'MTcuNzQ1Mg==\',\'LTY0LjcwNzI=\',\'UjAw\',\'Q2hyaXN0aWFuc3RlZA==\',\'LTA0OjAw\',\'Vkk=\');','count' => '1'),
            array('id' => '1560','city' => 'Pueblo Nuevo','country' => 'PA','result' => '(\'OC41NjY3\',\'LTgyLjQxNjg=\',\'Q2hpcmlxdWk=\',\'UHVlYmxvIE51ZXZv\',\'LTA1OjAw\',\'UEE=\');','count' => '2'),
            array('id' => '1563','city' => 'Windhoek','country' => 'NA','result' => '(\'LTIyLjU3\',\'MTcuMDgzNg==\',\'V2luZGhvZWs=\',\'V2luZGhvZWs=\',\'KzAyOjAw\',\'TkE=\');','count' => '4'),
            array('id' => '1564','city' => 'Saint-denis','country' => 'RE','result' => '(\'LTIwLjg2Njc=\',\'NTUuNDY2Nw==\',\'UjAw\',\'U2FpbnQtZGVuaXM=\',\'KzA0OjAw\',\'UkU=\');','count' => '3'),
            array('id' => '1565','city' => 'Santa Cruz','country' => 'BO','result' => '(\'LTEyLjI4MzM=\',\'LTY2LjI1\',\'RWwgQmVuaQ==\',\'U2FudGEgQ3J1eg==\',\'LTA0OjAw\',\'Qk8=\');','count' => '2'),
            array('id' => '1935','city' => 'Mbabane','country' => 'SZ','result' => '(\'LTI2LjMxNjc=\',\'MzEuMTMzMw==\',\'SGhvaGhv\',\'TWJhYmFuZQ==\',\'KzAyOjAw\',\'U1o=\');','count' => '1'),
            array('id' => '1571','city' => 'Bogotá','country' => 'CO','result' => '(\'NC42\',\'LTc0LjA4MzM=\',\'Q3VuZGluYW1hcmNh\',\'Qm9nb3TDoQ==\',\'LTA1OjAw\',\'Q08=\');','count' => '2'),
            array('id' => '1917','city' => 'Nuuk','country' => 'GL','result' => '(\'NjQuMTgzMw==\',\'LTUxLjc1\',\'VmVzdGdyb25sYW5k\',\'TnV1aw==\',\'LTA0OjAw\',\'R0w=\');','count' => '1'),
            array('id' => '1573','city' => 'Antananarivo','country' => 'MG','result' => '(\'LTE4LjkxNjc=\',\'NDcuNTE2Nw==\',\'QW50YW5hbmFyaXZv\',\'QW50YW5hbmFyaXZv\',\'KzAzOjAw\',\'TUc=\');','count' => '1'),
            array('id' => '1574','city' => 'Douala','country' => 'CM','result' => '(\'NC4wNTAz\',\'OS43\',\'TGl0dG9yYWw=\',\'RG91YWxh\',\'KzAxOjAw\',\'Q00=\');','count' => '1'),
            array('id' => '1914','city' => 'Managua','country' => 'NI','result' => '(\'MTIuMTUwOA==\',\'LTg2LjI2ODM=\',\'TWFuYWd1YQ==\',\'TWFuYWd1YQ==\',\'LTA2OjAw\',\'Tkk=\');','count' => '1'),
            array('id' => '1577','city' => 'Yerevan','country' => 'AM','result' => '(\'NDAuMTgxMQ==\',\'NDQuNTEzNg==\',\'WWVyZXZhbg==\',\'WWVyZXZhbg==\',\'KzA0OjAw\',\'QU0=\');','count' => '1'),
            array('id' => '1579','city' => 'Ulaanbaatar','country' => 'MN','result' => '(\'NDcuOTE2Nw==\',\'MTA2LjkxNjc=\',\'VWxhYW5iYWF0YXI=\',\'VWxhYW5iYWF0YXI=\',\'KzA5OjAw\',\'TU4=\');','count' => '3'),
            array('id' => '1584','city' => 'Bridgetown','country' => 'BB','result' => '(\'MTMuMQ==\',\'LTU5LjYxNjc=\',\'U2FpbnQgTWljaGFlbA==\',\'QnJpZGdldG93bg==\',\'LTA0OjAw\',\'QkI=\');','count' => '1'),
            array('id' => '1586','city' => 'Bethlehem','country' => 'PS','result' => '(\'MzEuNzE2Nw==\',\'MzUuMg==\',\'UjAw\',\'QmV0aGxlaGVt\',\'KzAyOjAw\',\'UFM=\');','count' => '2'),
            array('id' => '1588','city' => 'Asunción','country' => 'PY','result' => '(\'LTI1LjI2Njg=\',\'LTU3LjY2Njc=\',\'Q2VudHJhbA==\',\'QXN1bmNpw7Nu\',\'LTAzOjAw\',\'UFk=\');','count' => '1'),
            array('id' => '1589','city' => 'Montevideo','country' => 'UY','result' => '(\'LTM0Ljg1ODE=\',\'LTU2LjE3MDg=\',\'TW9udGV2aWRlbw==\',\'TW9udGV2aWRlbw==\',\'LTAyOjAw\',\'VVk=\');','count' => '1'),
            array('id' => '1590','city' => 'San José','country' => 'CR','result' => '(\'OS45MzMz\',\'LTg0LjA4MzM=\',\'U2FuIEpvc2U=\',\'U2FuIEpvc8Op\',\'LTA2OjAw\',\'Q1I=\');','count' => '1'),
            array('id' => '1591','city' => 'Fernando De La Mora','country' => 'PY','result' => '(\'LTI1LjMxNjc=\',\'LTU3LjY=\',\'Q2VudHJhbA==\',\'RmVybmFuZG8gRGUgTGEgTW9yYQ==\',\'LTAzOjAw\',\'UFk=\');','count' => '1'),
            array('id' => '1594','city' => 'Ouagadougou','country' => 'BF','result' => '(\'MTIuMzcwMg==\',\'LTEuNTI0Nw==\',\'S2FkaW9nbw==\',\'T3VhZ2Fkb3Vnb3U=\',\'KzAwOjAw\',\'QkY=\');','count' => '1'),
            array('id' => '1927','city' => 'Kourou','country' => 'GF','result' => '(\'NS4xNQ==\',\'LTUyLjY1\',\'UjAw\',\'S291cm91\',\'LTAzOjAw\',\'R0Y=\');','count' => '1'),
            array('id' => '1928','city' => 'Maseru','country' => 'LS','result' => '(\'LTI5LjMxNjc=\',\'MjcuNDgzMg==\',\'TWFzZXJ1\',\'TWFzZXJ1\',\'KzAyOjAw\',\'TFM=\');','count' => '1'),
            array('id' => '1929','city' => 'San Salvador','country' => 'SV','result' => '(\'MTMuNzA4Ng==\',\'LTg5LjIwMzI=\',\'U2FuIFNhbHZhZG9y\',\'U2FuIFNhbHZhZG9y\',\'LTA2OjAw\',\'U1Y=\');','count' => '1'),
            array('id' => '1912','city' => 'Le Lamentin','country' => 'MQ','result' => '(\'MTQuNg==\',\'LTYx\',\'UjAw\',\'TGUgTGFtZW50aW4=\',\'LTA0OjAw\',\'TVE=\');','count' => '1'),
            array('id' => '1923','city' => 'Addis Abeba','country' => 'ET','result' => '(\'OS4wMzMz\',\'MzguNw==\',\'QWRkaXMgQWJlYmE=\',\'QWRkaXMgQWJlYmE=\',\'KzAzOjAw\',\'RVQ=\');','count' => '1'),
            array('id' => '1932','city' => 'Bamako','country' => 'ML','result' => '(\'MTIuNjU=\',\'LTg=\',\'QmFtYWtv\',\'QmFtYWtv\',\'KzAwOjAw\',\'TUw=\');','count' => '1'),
            array('id' => '1933','city' => 'Praia','country' => 'CV','result' => '(\'MTQuOTE2Nw==\',\'LTIzLjUxNjg=\',\'U2FvIERvbWluZ29z\',\'UHJhaWE=\',\'LTAxOjAw\',\'Q1Y=\');','count' => '1'),
            array('id' => '1934','city' => 'Ballasalla','country' => 'IM','result' => '(\'NTQuMQ==\',\'LTQuNjMzMw==\',\'UjAw\',\'QmFsbGFzYWxsYQ==\',\'KzAwOjAw\',\'SU0=\');','count' => '1'),
            array('id' => '1909','city' => 'Bishkek','country' => 'KG','result' => '(\'NDIuODczMQ==\',\'NzQuNjAwMw==\',\'QmlzaGtlaw==\',\'QmlzaGtlaw==\',\'KzA2OjAw\',\'S0c=\');','count' => '1'),
            array('id' => '1910','city' => 'Georgetown','country' => 'GY','result' => '(\'Ni44\',\'LTU4LjE2Njc=\',\'RGVtZXJhcmEtTWFoYWljYQ==\',\'R2VvcmdldG93bg==\',\'LTA0OjAw\',\'R1k=\');','count' => '1'),
            array('id' => '1904','city' => 'Blantyre','country' => 'MW','result' => '(\'LTE1Ljc4MzM=\',\'MzU=\',\'QmxhbnR5cmU=\',\'QmxhbnR5cmU=\',\'KzAyOjAw\',\'TVc=\');','count' => '1')
        );

        foreach($geo_defaults as $default_array)
        {
            if($default_array["country"] == $countryiso)
            {
                return "lz_tracking_geo_result" . str_replace(");",",'');",$default_array["result"]);
            }
        }
    }
    return GetOutput(null,false);
}

function GetOutput($tags,$success)
{
    if($success)
        return "lz_tracking_geo_result('".base64_encode($tags["latitude"])."','".base64_encode($tags["longitude"])."','".base64_encode(utf8_encode($tags["region"]))."','".base64_encode(utf8_encode($tags["city"]))."','".base64_encode(utf8_encode($tags["timezone"]))."','".base64_encode(utf8_encode($tags["iso2"]))."','".base64_encode('')."');";
    else
        return "lz_tracking_geo_result('".base64_encode(-522)."','".base64_encode(-522)."','','','','','');";
}