var lz_move_active = false;
var lz_move_x,lz_move_y,lz_move_tx,lz_move_ty;
var lz_move_object;
var lz_move_margins;
var lz_zoom_factor = 1;
var lz_center_timeout = null;

function lz_livebox(_name,_template,_width,_height,_mleft,_mtop,_mright,_mbottom,_position,_speed,_effect){
    this.Version = '1';

    this.lz_livebox_slide_finished = false;
    this.lz_livebox_template = _template;
    this.lz_livebox_name = _name;
    this.lz_livebox_move = lz_livebox_move_box;
    this.lz_livebox_show = lz_livebox_show_box;
    this.lz_livebox_hide = lz_livebox_hide_box;
    this.lz_livebox_create = lz_livebox_create_box;
    this.lz_livebox_unload = lz_livebox_unload_box;
    this.lz_livebox_shadow = lz_livebox_set_shadow;
    this.lz_livebox_background = lz_livebox_set_background;
    this.lz_livebox_close = lz_livebox_close_box;
    this.lz_livebox_chat = lz_livebox_direct_chat;
    this.lz_livebox_get_left = lz_livebox_center_get_left;
    this.lz_livebox_get_right = lz_livebox_center_get_right;
    this.lz_livebox_get_top = lz_livebox_center_get_top;
    this.lz_livebox_get_bottom = lz_livebox_center_get_bottom;
    this.lz_livebox_div = null;
    this.lz_livebox_shadow_class = null;
    this.lz_livebox_background_class = null;
    this.lz_livebox_background_div = null;
    this.lz_livebox_preset_top = null;
    this.lz_livebox_preset_left = null;
    this.lz_livebox_preset_right = null;
    this.lz_livebox_preset_bottom = null;
    this.lz_livebox_shown = false;
    this.lz_livebox_on_move = null;
    this.lz_livebox_fixed_mode = false;
    this.lz_livebox_moveable = true;

    this.lzibst_width = _width;
    this.lzibst_height = _height;
    this.lzibst_margin = lz_move_margins = [_mleft,_mtop,_mright,_mbottom];
    this.lzibst_position = _position.toString();

    if(this.lzibst_position.length==1)
        this.lzibst_position = "0"+this.lzibst_position;

    this.lzibst_hposition = this.lzibst_position.substring(1,2).replace(0,"left").replace(1,"center").replace(2,"right");
    this.lzibst_vposition = this.lzibst_position.substring(0,1).replace(0,"top").replace(1,"center").replace(2,"bottom");
    this.lzibst_slide_speed = 10;
    this.lzibst_effect = _effect;
    this.lzibst_slide_step = Math.max(_speed,2);

    function lz_livebox_direct_chat(_intid,_groupid)
    {
        var fullname="";
        if(document.getElementById('lz_invitation_name') != null && document.getElementById('lz_invitation_name').value.length > 0)
            fullname = document.getElementById('lz_invitation_name').value;
        lz_tracking_init_external_window(fullname,lz_global_base64_url_decode(_intid),lz_global_base64_url_decode(_groupid));
    }

    function lz_livebox_close_box(uid)
    {
        if(this.lz_livebox_background_div != null)
        {
            document.body.removeChild(this.lz_livebox_background_div);
            this.lz_livebox_background_div = null;
        }
        if(!this.lz_livebox_slide_finished)
            return;
        document.body.removeChild(this.lz_livebox_div);
    }

    function lz_livebox_set_shadow(_intense,_x,_y,_color)
    {
        this.lz_livebox_shadow_class = document.createElement('STYLE');
        this.lz_livebox_shadow_class.type = 'text/css';
        var style = document.createTextNode(".livezilla_livebox_shadow_class"+this.lz_livebox_name+"{-moz-box-shadow: "+_x+"px "+_y+"px "+_intense+"px "+_color+";-webkit-box-shadow: "+_x+"px "+_y+"px "+_intense+"px "+_color+";box-shadow: "+_x+"px "+_y+"px "+_intense+"px "+_color+";} ");

        if(this.lz_livebox_shadow_class.styleSheet)
            this.lz_livebox_shadow_class.styleSheet.cssText = style.nodeValue;
        else
            this.lz_livebox_shadow_class.appendChild(style);
        document.getElementsByTagName('head')[0].appendChild(this.lz_livebox_shadow_class);
    }

    function lz_livebox_set_background(_bgcolor,_bgop)
    {
        if(this.lz_livebox_background_class == null)
        {
            this.lz_livebox_background_class = document.createElement('STYLE');
            this.lz_livebox_background_class.type = 'text/css';
            var style = document.createTextNode(".livezilla_livebox_background_class"+this.lz_livebox_name+"{z-index:99990;top:0;left:0;right:0;bottom:0;position:absolute;filter:alpha(opacity="+(_bgop*100)+"); -moz-opacity:"+_bgop+"; -khtml-opacity: "+_bgop+"; opacity:"+_bgop+";background:"+_bgcolor+";} ");

            if(this.lz_livebox_background_class.styleSheet)
                this.lz_livebox_background_class.styleSheet.cssText = style.nodeValue;
            else
                this.lz_livebox_background_class.appendChild(style);
            document.getElementsByTagName('head')[0].appendChild(this.lz_livebox_background_class);

            this.lz_livebox_background_div = document.createElement('DIV');
            this.lz_livebox_background_div.style.position = 'fixed';
            this.lz_livebox_background_div.className = "livezilla_livebox_background_class" + this.lz_livebox_name;
            document.body.appendChild(this.lz_livebox_background_div);
        }
    }

    function lz_livebox_create_box()
    {
        this.lz_livebox_div = document.createElement('DIV');

        if(this.lz_livebox_shadow_class != null)
            this.lz_livebox_div.className = "livezilla_livebox_shadow_class"+this.lz_livebox_name;

        this.lz_livebox_div.id = this.lz_livebox_name;
        this.lz_livebox_div.style.position = 'fixed';

        if(this.lzibst_effect == 6 && !('opacity' in document.body.style))
            this.lzibst_effect = 0;

        if(this.lzibst_effect != 5)
        {
            this.lz_livebox_div.style.height = this.lzibst_height+'px';
            this.lz_livebox_div.style.width = this.lzibst_width+'px';
        }
        else
        {
            this.lz_livebox_div.style.height = '0px';
            this.lz_livebox_div.style.width = '0px';

        }
        this.lz_livebox_div.style.overflow = 'hidden';
        this.lz_livebox_div.style.zIndex = lz_overlay_zindex;
        this.lz_livebox_div.style.margin = "0px";

        if(this.lzibst_effect == 6)
            this.lz_livebox_div.style.opacity = "0.0";

        this.lz_livebox_div.innerHTML = this.lz_livebox_template.replace("<!--username-->",lz_global_base64_url_decode(LiveZillaData.F111));

        if(this.lzibst_effect == 0)
            this.lz_livebox_div.style.display = 'none';
        else if(this.lzibst_effect == 1)
            this.lz_livebox_div.style.top = -(this.lzibst_height+100)+'px';
        else if(this.lzibst_effect == 2)
            this.lz_livebox_div.style.left = lz_global_get_window_width(false)+(this.lzibst_width+100)+'px';
        else if(this.lzibst_effect == 3)
            this.lz_livebox_div.style.top = lz_global_get_window_height()+(this.lzibst_height+100)+'px';
        else if(this.lzibst_effect == 4)
            this.lz_livebox_div.style.left = -(this.lzibst_width+100)+'px';

        if(this.lzibst_effect == 6 && this.lzibst_position == '22')
            this.lz_livebox_div.style.left = -(this.lzibst_width+100)+'px';

        document.body.appendChild(this.lz_livebox_div);
    }

    function lz_livebox_show_box(_zIndex)
    {
        this.lz_livebox_visible = true;
        if(this.lz_livebox_shown)
        {
            this.lz_livebox_div.style.display = '';
            this.lz_livebox_div.style.visibility = 'visible';
            this.lz_livebox_div.style.zIndex = _zIndex;
            return;
        }
        this.lz_livebox_shown = true;

        window.setTimeout("if(window['"+ this.lz_livebox_name +"']!=null)window['"+ this.lz_livebox_name +"'].lz_livebox_move()",1);
        if(!lz_is_mobile && this.lz_livebox_moveable)
        {
            document.onmousedown=lz_livebox_init_move;
            document.onmouseup=new Function("lz_move_active=false;lz_livebox_save_pos();");
        }
    }

    function lz_livebox_hide_box()
    {
        this.lz_livebox_visible = false;
        if(this.lz_livebox_shown)
        {
            this.lz_livebox_div.style.display = 'none';
            this.lz_livebox_div.style.visibility = 'hidden';

        }
    }

    function lz_livebox_unload_box()
    {
        var currentopacity = parseFloat(this.lz_livebox_div.style.opacity);
        currentopacity -= 0.06;
        this.lz_livebox_div.style.opacity = currentopacity;
        if(currentopacity > 0)
            window.setTimeout("window['"+ this.lz_livebox_name +"'].lz_livebox_unload()",2);
    }

    function lz_livebox_init_move(e)
    {
        try
        {
            var fobj = (!lz_is_ie) ? e.target : event.srcElement;
            if(fobj.tagName.toLowerCase() == "input" || fobj.tagName.toLowerCase() == "textarea" || fobj.tagName.toLowerCase() == "iframe" || fobj.tagName.toLowerCase() == "a")
                return;

            var count = 0;
            while (fobj != null && fobj.style.zIndex != 99999 && count++ < 20)
            {
                fobj = (!lz_is_ie) ? fobj.parentNode : fobj.parentElement;
                if(!(fobj != null && fobj.className != "lz_chat_unmovable"))
                    return true;
            }

            if (fobj != null && fobj.tagName != 'undefined' && fobj.style.zIndex == 99999)
            {
                lz_move_active = true;
                lz_move_object = fobj;

                lz_move_tx = parseInt(lz_move_object.style.left+0);
                lz_move_x = !lz_is_ie ? e.clientX : event.clientX;

                if(lz_move_object.style.top != '')
                {
                    lz_move_y = !lz_is_ie ? e.clientY : event.clientY;
                    lz_move_ty = parseInt(lz_move_object.style.top+0);

                }
                else
                {
                    lz_move_y = !lz_is_ie ? e.clientY : event.clientY;
                    lz_move_ty = lz_global_get_window_height() - (parseInt(lz_move_object.style.bottom+0)+parseInt(lz_move_object.style.height));
                }

                if(lz_move_object.style.left != '')
                {
                    lz_move_tx = parseInt(lz_move_object.style.left+0);
                    lz_move_x = !lz_is_ie ? e.clientX : event.clientX;
                }
                else
                {
                    lz_move_x = !lz_is_ie ? e.clientX : event.clientX;
                    lz_move_tx = lz_global_get_window_width(false) - (parseInt(lz_move_object.style.right+0)+parseInt(lz_move_object.style.width));
                }

                document.onmousemove=lz_livebox_process_move;
                return false;
            }
        }
        catch(e)
        {

        }
    }

    function lz_livebox_process_move(e)
    {
        if (lz_move_active)
        {
            var top = ((!lz_is_ie) ? lz_move_ty + e.clientY - lz_move_y : lz_move_ty + event.clientY - lz_move_y);
            lz_move_object.style.bottom = '';
            lz_move_object.style.top = top + 'px';
            var left = ((!lz_is_ie) ? lz_move_tx + e.clientX - lz_move_x : lz_move_tx + event.clientX - lz_move_x);
            lz_move_object.style.right = '';
            lz_move_object.style.left = left + 'px';
            if(window[lz_move_object.id].lz_livebox_on_move != null)
                eval(window[lz_move_object.id].lz_livebox_on_move);
            return false;
        }
    }

    function lz_livebox_extended_pos(_obj,_ext)
    {
        document.getElementById(_obj).style.top = (parseInt(document.getElementById(_obj).style.top.replace("px",""))+_ext) + "px";
    }

    function lz_livebox_move_box()
    {
        try
        {
            this.lz_livebox_div.style.bottom = this.lz_livebox_get_bottom(false);
            this.lz_livebox_div.style.right = this.lz_livebox_get_right(false);
            if(this.lzibst_effect == 0)
            {
                this.lz_livebox_div.style.left = this.lz_livebox_get_left(false);
                this.lz_livebox_div.style.top = this.lz_livebox_get_top(false);
                this.lz_livebox_div.style.right = this.lz_livebox_get_right(false);
                this.lz_livebox_div.style.bottom = this.lz_livebox_get_bottom(false);
                this.lz_livebox_div.style.display = '';
                this.lz_livebox_slide_finished = true;
            }
            else
            {
                if(this.lzibst_effect == 1 || this.lzibst_effect == 3)
                {
                    var current = parseInt(this.lz_livebox_div.style.top.replace("px","").replace("pt",""));

                    if(this.lzibst_effect == 1)
                        current+=this.lzibst_slide_step;
                    else
                        current-=this.lzibst_slide_step;

                    this.lz_livebox_div.style.top = current+'px';
                    this.lz_livebox_div.style.left = this.lz_livebox_get_left(false);

                    var topdist = parseInt(this.lz_livebox_get_top(false).replace("px",""));
                    if((this.lzibst_effect == 1 && current < (topdist-this.lzibst_slide_step)) || (this.lzibst_effect == 3 && current > (topdist-this.lzibst_slide_step)))
                        window.setTimeout("if(window['"+ this.lz_livebox_name +"']!=null)window['"+ this.lz_livebox_name +"'].lz_livebox_move()",this.lzibst_slide_speed);
                    else
                    {
                        this.lz_livebox_div.style.top = topdist+'px';
                        this.lz_livebox_slide_finished = true;
                    }
                }
                else if(this.lzibst_effect == 2 || this.lzibst_effect == 4)
                {
                    var current = parseInt(this.lz_livebox_div.style.left.replace("px","").replace("pt",""));

                    if(this.lzibst_effect == 2)
                        current-=this.lzibst_slide_step;
                    else
                        current+=this.lzibst_slide_step;

                    this.lz_livebox_div.style.left = current+'px';
                    this.lz_livebox_div.style.top = this.lz_livebox_get_top(false);

                    var leftdist = parseInt(this.lz_livebox_get_left(false).replace("px",""));
                    if((this.lzibst_effect == 2 && current > (leftdist-this.lzibst_slide_step)) || (this.lzibst_effect == 4 && current < (leftdist-this.lzibst_slide_step)))
                        window.setTimeout("if(window['"+ this.lz_livebox_name +"']!=null)window['"+ this.lz_livebox_name +"'].lz_livebox_move()",this.lzibst_slide_speed);
                    else
                    {
                        this.lz_livebox_div.style.left = leftdist+'px';
                        this.lz_livebox_slide_finished = true;
                    }
                }
                else if(this.lzibst_effect == 5)
                {
                    var currentheight = parseInt(this.lz_livebox_div.style.height.replace("px","").replace("pt",""));
                    var currentwidth = parseInt(this.lz_livebox_div.style.width.replace("px","").replace("pt",""));

                    var wstep = this.lzibst_slide_step;
                    var hstep = parseInt(this.lzibst_slide_step*(this.lzibst_height/this.lzibst_width));

                    if(currentheight < (this.lzibst_height-hstep))
                        currentheight += hstep;
                    if(currentwidth < (this.lzibst_width-wstep))
                        currentwidth += wstep;

                    this.lz_livebox_div.style.height = currentheight+'px';
                    this.lz_livebox_div.style.width = currentwidth+'px';

                    this.lz_livebox_div.style.left = parseInt(this.lz_livebox_get_left(false).replace("px","").replace("pt",""))+((this.lzibst_width-currentwidth)/2)+"px";
                    this.lz_livebox_div.style.top = parseInt(this.lz_livebox_get_top(false).replace("px","").replace("pt",""))+((this.lzibst_height-currentheight)/2)+"px";

                    if((currentheight < (this.lzibst_height-hstep)) || (currentwidth < (this.lzibst_width-wstep)))
                        window.setTimeout("window['"+ this.lz_livebox_name +"'].lz_livebox_move()",this.lzibst_slide_speed);
                    else
                    {
                        this.lz_livebox_div.style.height = this.lzibst_height+'px';
                        this.lz_livebox_div.style.width = this.lzibst_width+'px';
                        this.lz_livebox_slide_finished = true;
                    }
                }
                else if(this.lzibst_effect == 6)
                {
                    this.lz_livebox_div.style.left = this.lz_livebox_get_left(false);
                    this.lz_livebox_div.style.top = this.lz_livebox_get_top(false);
                    lz_fade_in(this.lz_livebox_div,40);
                    this.lz_livebox_slide_finished = true;
                }
            }

            if(this.lz_livebox_slide_finished && window.onresize == null)
            {
                window.onresize = lz_livebox_init_center_boxes_hide;

                //if(lz_is_tablet)
                //  window.addEventListener('scroll', function(e){lz_livebox_scale_boxes();});

            }
        }
        catch(e)
        {
        }
    }

    function lz_livebox_center_get_left(_abs)
    {
        if(this.lz_livebox_fixed_mode)
            return "0px";
        else if(lz_is_mobile && this.lzibst_hposition == "right")
            return "auto";
        else if(this.lz_livebox_preset_left != null)
            return this.lz_livebox_preset_left;
        else if(this.lz_livebox_preset_right != null)
            return "auto";

        var left = 0;
        if(this.lzibst_hposition == "center")
        {
            left  = parseInt((lz_global_get_window_width(true) * 50 / 100));
            left -= parseInt(this.lzibst_width / 2);
            if(this.lzibst_margin[0] != 0)
                left += this.lzibst_margin[0];
            if(this.lzibst_margin[2] != 0)
                left -= this.lzibst_margin[2];
            if(_abs)
                left+=lz_global_get_page_offset_x();
            return left+'px';
        }
        else if(this.lzibst_hposition == "left")
        {
            if(this.lzibst_margin[0] != 0)
                left += this.lzibst_margin[0];
            if(this.lzibst_margin[2] != 0)
                left -= this.lzibst_margin[2];
            if(_abs)
                left+=lz_global_get_page_offset_x();
            return left+'px';
        }
        else if(this.lzibst_hposition == "right")
        {
            left = lz_global_get_window_width(false);
            left -= parseInt(this.lzibst_width);
            if(this.lzibst_margin[0] != 0)
                left += this.lzibst_margin[0];
            if(this.lzibst_margin[2] != 0)
                left -= this.lzibst_margin[2];
            return left+'px';
        }
    }

    function lz_livebox_center_get_top(_abs)
    {
        if(this.lz_livebox_fixed_mode)
            return "0px";
        else if(lz_is_mobile && this.lzibst_vposition == "bottom")
            return "auto";
        else if(this.lz_livebox_preset_top != null)
            return this.lz_livebox_preset_top;
        else if(this.lz_livebox_preset_bottom != null)
            return "auto";

        var top = 0;
        if(this.lzibst_vposition == 'center')
        {
            top = parseInt((lz_global_get_window_height() * 50 / 100));
            if(_abs)
                top += lz_global_get_page_offset_y();
            top -= parseInt(this.lzibst_height / 2);
            if(this.lzibst_margin[1] != 0)
                top += this.lzibst_margin[1];
            if(this.lzibst_margin[3] != 0)
                top -= this.lzibst_margin[3];
            return parseInt(top)+'px';
        }
        else if(this.lzibst_vposition == 'top')
        {
            if(this.lzibst_margin[1] != 0)
                top += this.lzibst_margin[1];
            if(this.lzibst_margin[3] != 0)
                top -= this.lzibst_margin[3];
            if(_abs)
                top += lz_global_get_page_offset_y();
            return parseInt(top)+'px';
        }
        else if(this.lzibst_vposition == 'bottom')
        {
            top = lz_global_get_window_height();
            top -= parseInt(this.lzibst_height);
            if(this.lzibst_margin[1] != 0)
                top += this.lzibst_margin[1];
            if(this.lzibst_margin[3] != 0)
                top -= this.lzibst_margin[3];
            return parseInt(top)+'px';
        }
    }

    function lz_livebox_center_get_bottom(_abs)
    {
        if(this.lz_livebox_fixed_mode)
            return "0px";
        else if(lz_is_mobile && this.lzibst_vposition == "bottom" && _abs)
            return (Math.floor(lz_zoom_factor*this.lzibst_margin[3])+document.documentElement.clientHeight-(lz_global_get_window_height() + lz_global_get_page_offset_y()))+'px';
        else if(lz_is_mobile && this.lzibst_vposition == "bottom")
            return Math.floor(lz_zoom_factor*this.lzibst_margin[3]) + "px";
        else if(this.lz_livebox_preset_bottom != null)
            return this.lz_livebox_preset_bottom;
        else
            return "auto";
    }

    function lz_livebox_center_get_right(_abs)
    {
        if(this.lz_livebox_fixed_mode)
            return "0px";
        else if(lz_is_mobile && this.lzibst_hposition == "right" && _abs)
            return (Math.floor(lz_zoom_factor*this.lzibst_margin[2])+document.documentElement.clientWidth-(lz_global_get_window_width(true) + lz_global_get_page_offset_x()))+'px';
        else if(lz_is_mobile && this.lzibst_hposition == "right")
            return Math.floor(lz_zoom_factor*this.lzibst_margin[2]) + "px";
        else
            return "auto";
    }

    function lz_livebox_center_set_preset(_preset,_vertical)
    {
        if(_preset == null)
            return;

        var parts = _preset.split(",");
        if(_vertical && parts[0] != null)
        {
            var presett = parseInt(parts[0].replace("px",""));
            if(presett < 0)
                this.lz_livebox_preset_top = 0 + "px";
            else if(presett+this.lzibst_height > lz_global_get_window_height())
                this.lz_livebox_preset_top = (lz_global_get_window_height() - this.lzibst_height) + "px";
            else if(!isNaN(presett))
                this.lz_livebox_preset_top = parts[0];
        }
        else
        {
            this.lz_livebox_preset_bottom = this.lzibst_margin[3]+"px";
        }

        if(parts[1] != null)
        {
            var presetl = parseInt(parts[1].replace("px",""));
            if(presetl < 0)
                this.lz_livebox_preset_left = 0 + "px";
            else if(presetl+this.lzibst_width > lz_global_get_window_width(false))
                this.lz_livebox_preset_left = (lz_global_get_window_width(false) - (this.lzibst_width+15)) + "px";
            else
                this.lz_livebox_preset_left = parts[1];
        }
    }
}

function lz_livebox_scale_boxes(){
    var factor = lz_global_get_window_zoom();
    if(lz_zoom_factor != factor)
    {
        if(factor < 0.9)
            factor += 0.1;
        if(factor > 1.5)
            factor = 1.5;

        lz_livebox_scale_box("lz_overlay_chat",factor);
        lz_livebox_scale_box("lz_eye_catcher",factor);
        lz_livebox_scale_box("lz_floating_button",factor);
        lz_zoom_factor = factor;
    }
}

function lz_livebox_scale_box(_obj,_factor,_required){
    try
    {
        if(document.getElementById(_obj) != null)
        {
            if(_obj == "lz_overlay_chat" || _obj == "lz_eye_catcher")
                if(lz_chat_state_expanded && !_required)
                    return;
            document.getElementById(_obj).style["-webkit-transform"] = "scale("+_factor+","+_factor+")";
            document.getElementById(_obj).style["-webkit-transform-origin"] = window[_obj].lzibst_hposition + " " +  window[_obj].lzibst_vposition;
        }
    }
    catch(ex)
    {

    }
}

function lz_livebox_is_visible(_el){
    try
    {
        var rect = _el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && /*or $(window).height() */
                rect.right <= (window.innerWidth || document.documentElement.clientWidth) /*or $(window).width() */
            );
    }
    catch (ex)
    {return true;}
}

function lz_livebox_init_center_boxes_hide(){
    lz_livebox_init_center_boxes();
}

function lz_livebox_init_center_boxes(){
    if(lz_center_timeout!=null)
        clearTimeout(lz_center_timeout);
    lz_center_timeout = setTimeout("lz_livebox_center_boxes();",100);
}

function lz_livebox_center_boxes(){
    if(lz_is_mobile)
        lz_livebox_scale_boxes();
    else if(document.getElementById("lz_overlay_chat") != null && lz_chat_state_expanded){
        lz_chat_change_state(true,true);
    }

    lz_livebox_center_box("lz_request_window",true);
    lz_livebox_center_box("lz_alert_window",true);
    lz_livebox_center_box("lz_floating_button",true);
    lz_livebox_center_box("lz_overlay_box",true);
    lz_livebox_center_box("lz_floating_button_selector",true);

    if(lz_is_mobile && lz_chat_state_expanded && !lz_chat_fixed_mode)
        return;

    lz_livebox_center_box("lz_overlay_chat",true);
    lz_livebox_center_box("lz_eye_catcher",true);
}

function lz_livebox_center_box(_obj,_vertical){
    if(document.getElementById(_obj) != null && window[_obj].Version=='1')
    {
        var abs = false;
        if(window[_obj].lz_livebox_fixed_mode)
            abs = false;
        else if(!lz_chat_state_expanded)
            abs = false;
        else if(document.getElementById(_obj).style.position == "fixed" && !lz_livebox_is_visible(document.getElementById(_obj)))
            abs = true;
        else if(document.getElementById(_obj).style.position == "absolute")
            abs = true;

        if(_vertical)
        {
            document.getElementById(_obj).style.top = window[_obj].lz_livebox_get_top(abs);
            document.getElementById(_obj).style.bottom = window[_obj].lz_livebox_get_bottom(abs);
        }
        document.getElementById(_obj).style.left = window[_obj].lz_livebox_get_left(abs);
        document.getElementById(_obj).style.right = window[_obj].lz_livebox_get_right(abs);
        document.getElementById(_obj).style.position = (abs) ? 'absolute' : 'fixed';
        if(!lz_chat_state_expanded && _obj == "lz_eye_catcher")
        {
            if(window.innerWidth < (1.4*window[_obj].lzibst_width))
                window[_obj].lz_livebox_hide();
            else
                window[_obj].lz_livebox_show();
        }
    }
}

function lz_livebox_hide_box(_obj){
    if(document.getElementById(_obj) != null)
        window[_obj].lz_livebox_hide();
}

function lz_livebox_show_box(_obj){
    if(document.getElementById(_obj) != null)
        window[_obj].lz_livebox_show();
}

function lz_livebox_save_pos(){
    if(lz_session != null && document.getElementById("lz_overlay_chat") != null)
    {
        if(!lz_is_mobile)
            lz_session.OVLCPos = document.getElementById("lz_overlay_chat").style.top+","+document.getElementById("lz_overlay_chat").style.left;
        lz_session.Save();
    }
}