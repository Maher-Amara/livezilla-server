<?php
/****************************************************************************************
 * LiveZilla knowledgebase.php
 *
 * Copyright 2018 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 * Improper changes to this file may cause critical errors.
 ***************************************************************************************/

if(!defined("IN_LIVEZILLA"))
    define("IN_LIVEZILLA",true);

header('Content-Type: text/html; charset=utf-8');

if(!defined("LIVEZILLA_PATH"))
    define("LIVEZILLA_PATH","./");

@error_reporting(E_ALL);
@set_error_handler("handleError");

require_once(LIVEZILLA_PATH . "_definitions/definitions.inc.php");
require_once(LIVEZILLA_PATH . "_lib/functions.global.inc.php");
require_once(LIVEZILLA_PATH . "_lib/functions.external.inc.php");
require_once(LIVEZILLA_PATH . "_lib/objects.external.inc.php");
require_once(LIVEZILLA_PATH . "_definitions/definitions.dynamic.inc.php");
require_once(LIVEZILLA_PATH . "_definitions/definitions.protocol.inc.php");

Server::InitDataProvider();
Server::DefineURL("knowledgebase.php");
LocalizationManager::AutoLoad();

$color = KnowledgeBase::ReadTextColor();
$html = IOStruct::GetFile(PATH_TEMPLATES . "kb_main.tpl");

$UILANG = Communication::ReadParameter("ptl",Visitor::$BrowserLanguage);

if(!empty(Server::$Configuration->File["gl_kbmr"]))
{
    if(!isset($_GET["depth"]))
        $_GET["depth"] = -1;

    $path = "./";

    for($i=0;$i<min(25,$_GET["depth"]);$i++)
        $path .= "../";

    $html = str_replace("<!--path-->",$path,$html);
    $html = str_replace("<!--searchtarget-->","knowledge-base/",$html);
}
else
{
    $html = str_replace("<!--path-->","./",$html);
    $html = str_replace("<!--searchtarget-->","knowledgebase.php",$html);
}

if(!isset($_GET["no-logo"]))
{
    $footer = "<!--cpar-->";
    $html = str_replace("<!--header-->",base64_decode(Server::$Configuration->File["gl_kbth"]),$html);
    $html = str_replace("<!--footer-->",base64_decode(Server::$Configuration->File["gl_kbtf"]).$footer,$html);
}
else
{
    $footer = "";
    $html = str_replace("<!--header-->",IOStruct::GetFile(PATH_TEMPLATES . "kb_header.tpl"),$html);
    $html = str_replace("<!--footer-->",IOStruct::GetFile(PATH_TEMPLATES . "kb_footer.tpl").$footer,$html);
}

if(!isset($_GET["search-for"]))
    $_GET["search-for"] = "";

$eq = Communication::ReadParameter("eq","");

if(empty($_GET["search-for"]) && !empty($eq))
    $_GET["search-for"] = $eq;

$html = str_replace("<!--query-->",htmlentities($_GET["search-for"],ENT_QUOTES,"UTF-8"),$html);

if(!isset($_GET["no-logo"]))
    $html = str_replace("<!--logo-->","<img src=\"". Server::$Configuration->File["gl_cali"]."\" border=\"0\">",$html);

if(empty($_GET["article"]))
{
    $html = str_replace("<!--results-->",getSearchContent(),$html);
    $html = str_replace("<!--navigation-->",getNavigation(null),$html);
}
else
{
    $entry = KnowledgeBaseEntry::GetById(Communication::ReadParameter("article",""),true);

    if($entry == null)
        $entry = KnowledgeBaseEntry::GetById($_GET["article"],true);

    $html = str_replace("<!--results-->",getArticleContent($entry),$html);
    $html = str_replace("<!--navigation-->",getNavigation($entry),$html);
}

$html = str_replace("<!--cpar-->",@Server::$Configuration->File["gl_cpar"],$html);
$html = str_replace("<!--color-->",$color,$html);
$html = str_replace("<!--params-->",KnowledgeBase::GetAllowedParameters("form",array(0=>"search-for")),$html);

exit(Server::Replace($html));

function getNavigation($entry){

    global $UILANG;
    $content = "";
    if(isset($_GET["tops"]) && $entry !=null)
    {
        $content = KnowledgeBase::GetURL("",array(),LocalizationManager::$TranslationStrings["client_most_popular"],array(0=>"search-for"));
        $content .= "<span class=\"lz_kb_all\">" . KnowledgeBase::GetURL("",array("s"=>"MQ__"),LocalizationManager::$TranslationStrings["client_kb_browse_all"],array(0=>"no-logo",1=>"tops"),true). "</span>";
    }
    else if(isset($_GET["tops"]))
    {
        $content = "<span class=\"lz_kb_all\">" . KnowledgeBase::GetURL("",array("s"=>"MQ__"),LocalizationManager::$TranslationStrings["client_kb_browse_all"],array(0=>"no-logo",1=>"tops"),true). "</span>";
    }
    else if($entry!=null)
    {
        $navline = "";
        $currentNode = $entry;

        if($entry->IsPublic && $entry->Type == 0)
            $navline .= $entry->Title;


        $parents = $currentNode->GetParents();

        foreach($parents as $parent)
        {
            if($parent->IsPublic && $parent->Type == 0)
                $navline = KnowledgeBase::GetURL($parent->Id,array(),$parent->Title,array(0=>"search-for"),false) . (!empty($navline) ? " / " : "") . $navline;
        }
        $content = KnowledgeBase::GetURL("",array(),"<!--lang_client_tab_knowledgebase-->",array(0=>"search-for")) . ((!empty($navline)) ? " / " . $navline : "");
        $content = "<br>" . $content;
    }
    else if(!(isset(Server::$Configuration->File["gl_kbsl"]) && Server::$Configuration->File["gl_kbsl"] == 0))
    {
        $langs = KnowledgeBase::GetAllPublicLanguages();
        if(count($langs) > 1)
        {
            $list = "";
            foreach($langs as $iso => $name)
            {
                if(!empty($list))
                    $list .= " | ";

                $link = KnowledgeBase::GetURL("",array("ptl"=>$iso),$name,null,false,false,false,"",false);

                if(strtolower($iso) == strtolower($UILANG))
                    $link = "<u>" . $link . "</u>";

                $list .= $link;
            }
            $list = "<span class=\"lz_kb_lang\">".$list."</span>";
            $content .= $list;
        }
    }

    return "<div id=\"lz_kb_navigation\">" . $content . "</div>";
}

function getArticleContent($entry){

    global $LZLANG;
    $html = "";
    if(!empty($entry))
    {
        if($entry->Type != 0)
        {
            $html = IOStruct::GetFile(PATH_TEMPLATES . "kb_entry_v2.tpl");
            $html = str_replace("<!--footer-->",getFooterBox($entry),$html);

            if($entry->Type == 1)
                $html = str_replace("<!--html-->",$entry->Value,$html);
            else if($entry->Type == 2)
                $html = str_replace("<!--html-->","<script>window.location.replace('".$entry->Value."');</script>",$html);
            else if($entry->Type >= 3)
            {
                $url = LIVEZILLA_URL . "getfile.php?id=" . $entry->Id . "&file=" . $entry->Title;
                header("Location: " . $url);
                die();
            }

            $related = array();
            if(!empty($entry->Related))
                $related = explode(",",$entry->Related);

            $related_articles_html = IOStruct::GetFile(PATH_TEMPLATES . "kb_related.tpl");
            $related_articles_html = str_replace("<!--title-->",$LZLANG["related"],$related_articles_html);

            $related_files_html = IOStruct::GetFile(PATH_TEMPLATES . "kb_related.tpl");
            $related_files_html = str_replace("<!--title-->",$LZLANG["files"],$related_files_html);

            $related_tags_html = IOStruct::GetFile(PATH_TEMPLATES . "kb_related.tpl");
            $related_tags_html = str_replace("<!--title-->",$LZLANG["tags"],$related_tags_html);

            $related_links = $related_files = $related_tags = "";

            foreach($related as $rid)
            {
                $re = new KnowledgeBaseEntry();
                if($re->Load($rid) && empty($re->IsDiscarded))
                {
                    if($re->Type <= 2)
                    {
                        if(!empty($related_links))
                            $related_links .= "<hr>";
                        $related_links .= KnowledgeBase::GetURL($re->Id,array(),$re->Title);
                    }
                    else
                    {
                        if(!empty($related_files))
                            $related_files .= "<hr>";

                        $related_files .= KnowledgeBase::GetURL($re->Id,array(),$re->Title);
                    }
                }
            }

            if(!(isset(Server::$Configuration->File["gl_kbst"]) && !Server::$Configuration->File["gl_kbst"]))
            {
                $tags = explode(",",$entry->Tags);
                foreach($tags as $tag)
                {
                    if(!empty($tag))
                        $related_tags .= KnowledgeBase::GetURL("",array("search-for"=>"tags: " . $tag),$tag,array("search-for"),false,false,false,"",false,"",true);
                }
            }

            $related_articles_html = str_replace("<!--entries-->",$related_links,$related_articles_html);
            $related_files_html = str_replace("<!--entries-->",$related_files,$related_files_html);
            $related_tags_html = str_replace("<!--entries-->",$related_tags,$related_tags_html);

            if(empty($related_links))
                $related_articles_html = "";

            if(!empty($related_links) && !empty($related_files))
                $related_files_html = "<br><br>" . $related_files_html;
            else if(empty($related_files))
                $related_files_html = "";

            if((!empty($related_links) || !empty($related_files)) && !empty($related_tags))
                $related_tags_html = "<br><br>" . $related_tags_html;
            else if(empty($related_tags))
                $related_tags_html = "";

            $adds = $related_articles_html . $related_files_html . $related_tags_html;

            if(!empty($adds))
                $html = str_replace("<!--related-->","<div class=\"kb_related_frame\">" . $adds ."</div>",$html);
        }
        else
        {
            $html = getFolderContent($entry->Id,false);
        }
        $html = str_replace(array("<!--title-->","<!--header-->"),$entry->Title,$html);
        $html = str_replace("<!--id-->",$_GET["article"],$html);
    }
    return $html;
}

function getFolderContent($root,$_fullView){

    global $LZLANG,$UILANG;
    $result=$content="";
    $matches=array();

    if($_fullView)
    {
        if(isset($_GET["tops"]))
            $matches = KnowledgeBase::GetTOPEntries($root,$UILANG);

        if(count($matches)==0)
            $matches = KnowledgeBase::GetEntries($root,$UILANG);

        if(count($matches)==0)
            $matches = KnowledgeBase::GetEntries($root);

        if(count($matches)>0)
        {
            foreach($matches as $match)
            {
                $res = IOStruct::GetFile(PATH_TEMPLATES . "kb_result_category_v2.tpl");

                if($match->Id == 1)
                    $title = htmlentities($match->Title,ENT_NOQUOTES,"UTF-8");
                else
                {
                    $title = KnowledgeBase::GetURL($match->Id,array(),htmlentities($match->Title,ENT_NOQUOTES,"UTF-8"),array(0=>"search-for"));
                    $title = str_replace("<!--color-->","",$title);
                }

                $res = str_replace("<!--title-->",$title,$res);
                $res = str_replace("<!--id-->",$match->Id,$res);

                $entries = "";
                $childcount = 0;
                if(!empty($match->ChildNodes))
                {
                    foreach($match->ChildNodes as $child)
                    {
                        $entries .= $child->GetHTML(null,false,true,"v2");
                        $childcount++;
                    }
                }

                $res = str_replace("<!--search-->","false",$res);
                $res = str_replace("<!--entries-->",$entries,$res);

                if(!(isset(Server::$Configuration->File["gl_kbpa"]) && Server::$Configuration->File["gl_kbpa"] == 0))
                {
                    $popular = IOStruct::GetFile(PATH_TEMPLATES . "kb_popular.tpl");
                    $popular = str_replace("<!--title-->",str_replace("<!--category-->",$title,$LZLANG["popular"]),$popular);
                    $pmatches = KnowledgeBase::GetTOPEntries($match->Id,$UILANG);

                    $pop_entry_html = "";

                    if(count($pmatches) > 0)
                    {
                        foreach($pmatches as $pmatch)
                        {
                            $count = 0;
                            foreach($pmatch->ChildNodes as $child)
                            {
                                if(!empty($pop_entry_html))
                                    $pop_entry_html .= "<hr>";

                                $pop_entry_html .= KnowledgeBase::GetURL($child->Id,array(),$child->Title);

                                if($count++ == 4)
                                    break;
                            }
                        }
                        $popular = str_replace("<!--entries-->",$pop_entry_html,$popular);
                        $res = str_replace("<!--popular-->",$popular,$res);
                    }
                }

                if($childcount>0)
                    $result .= $res;
            }
            $main = $result;
        }
    }
    else
    {
        $rootEntry = new KnowledgeBaseEntry();
        $rootEntry->Load($root);
        $rootEntry->LoadChildNodes("",true,$UILANG);

        if(count($rootEntry->ChildNodes)==0)
            $rootEntry->LoadChildNodes("",true);

        $matches = $rootEntry->ChildNodes;

        $main = IOStruct::GetFile(PATH_TEMPLATES . "kb_result_category_v2.tpl");
        $main = str_replace("<!--id-->",$rootEntry->Id,$main);
        $main = str_replace("<!--title-->",htmlentities($rootEntry->Title,ENT_NOQUOTES,"UTF-8"),$main);

        $entries = "";
        if(count($matches)>0)
            foreach($matches as $match)
                $entries .= $match->GetHTML(null,false,true,"v2");

        $main = str_replace("<!--search-->","false",$main);
        $main = str_replace("<!--entries-->",$entries,$main);
    }

    if(!empty($main))
        $content .= Server::Replace($main,true,false,false,false);
    else
        $content .= "<div class=\"lz_kb_result_info\">".LocalizationManager::$TranslationStrings["client_kb_no_entries"]."</div><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br>" . $result;

    return $content;
}

function doOpenExternal()
{
    $kbonly = isset($_REQUEST["p_kbo"]);
    return !empty(Server::$Configuration->File["gl_kbin"]) && !$kbonly;
}

function getSearchContent(){

    global $UILANG;
    $query = !empty($_GET["search-for"]) ? $_GET["search-for"] : '%ALL%';
    $root = Communication::ReadParameter("ckf","");

    $content = "";

    $result = $navcats = "";

    if($query == "%ALL%")
    {
        $content = getFolderContent($root,true);
    }
    else if(strlen($query)>=1)
    {
        $matches = KnowledgeBase::GetMatches($root,$query,$UILANG,false,true);
        KnowledgeBase::ReqisterQuery($query,new VisitorBrowser("",""));

        if(count($matches)>0)
        {
            foreach($matches as $match)
                $result .= $match->GetHTML(null,false,true,"v2");

            $res = IOStruct::GetFile(PATH_TEMPLATES . "kb_result_category_v2.tpl");

            $action = "";
            if(strpos($query,"tags: ") === 0)
            {
                $action = "tags: ";
                $query = substr($query,6,strlen($query)-6);
            }

            $res = str_replace("<!--title-->","" .  $action . "\"" . Str::Cut(htmlentities($query,ENT_NOQUOTES,"UTF-8"),50,true)."\"",$res);
            $res = str_replace("<!--entries-->",$result,$res);
            $res = str_replace("<!--search-->","true",$res);
            $res = str_replace("<!--id-->","sr",$res);
            $content .= "<div class=\"lz_kb_result_info\">".str_replace("<!--count-->",count($matches),LocalizationManager::$TranslationStrings["client_kb_results_found"]) . "</div>" . $res;
        }
        else
            $content .= "<div class=\"lz_kb_result_info\">".LocalizationManager::$TranslationStrings["client_search_no_result"]."</div>";
    }
    else
        $content .= "<div class=\"lz_kb_result_info\">".LocalizationManager::$TranslationStrings["client_search_no_result"]."</div>";

    $content = str_replace("_chat_","_",$content);

    if(true)
    {

    }


    return $content;
}

function getFooterBox($_entry)
{
    global $LZLANG;
    Server::InitDataBlock(array("INTERNAL","GROUPS"));
    $hideusers = false;

    if(($rate=Communication::ReadParameter("h",-1))!= -1)
    {
        $hideusers = true;
        $bhtml = "<div>".$LZLANG["client_feedback_success"]."</div>";
        $_entry->SaveRateResult($rate);
    }
    else
    {
        $bhtml = KnowledgeBase::GetURL($_entry->Id,array("h"=>"MQ__"),"<!--icon_yes-->",null,false,false,false,"#bottom",false,"rate_good") . KnowledgeBase::GetURL($_entry->Id,array("h"=>"MA__"),"<!--icon_no-->",null,false,false,false,"#bottom",false,"rate_bad");
        $_entry->RegisterView();
    }

    $result = $_entry->GetRateResult();
    $html = IOStruct::GetFile(PATH_TEMPLATES . "kb_entry_footer.tpl");

    $opExists = false;
    if(isset(Server::$Operators[$_entry->EditorId]))
    {
        $opExists = true;
        $html = str_replace("<!--name-->",Server::$Operators[$_entry->EditorId]->Fullname,$html);
    }
    else
        $html = str_replace("<!--name-->","<br>",$html);

    $html = str_replace("<!--editor_id-->",urlencode($_entry->EditorId),$html);
    $html = str_replace("<!--date-->",$_entry->Edited,$html);
    $html = str_replace("<!--show_avatar-->",(!$opExists || (isset(Server::$Configuration->File["gl_knsa"]) && empty(Server::$Configuration->File["gl_knsa"]))) ? "hidden" : "visible",$html);

    $fhtml = "";
    if(!$hideusers)
        $fhtml = "<div>" . (($result[0] > 0) ? str_replace("<!--users-->",$result[0],str_replace("<!--total-->",$result[1],$LZLANG["client_found_helpful"])) : $LZLANG["client_was_helpful"]) . "&nbsp;&nbsp;&nbsp;</div>";

    if(Server::$Configuration->File["gl_knbr"])
        $html = str_replace("<!--rate-->","<div class=\"kb_rate\">" . $fhtml . $bhtml ."</div>",$html);

    return $html;
}

?>