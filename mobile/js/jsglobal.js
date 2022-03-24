if(typeof(encodeURIComponent) == 'undefined')
{
	encodeURIComponent = function(uri)
	{
		return (escape(uri));
	}
}

function lz_array_indexOf(_hsa,_needle)
{
    for(var i=0; i<_hsa.length; i++)
        if(_hsa[i]==_needle)
            return i;
    return -1;
}

function lz_format_time_span(_seconds)
{
	var negative = false;
	
	if(_seconds < 0)
	{
		negative = true;
		_seconds *= -1;
	}
	
	var days = Math.floor(_seconds / 86400);
	_seconds = _seconds - (days * 86400);
	var hours = Math.floor(_seconds / 3600);
	_seconds = _seconds - (hours * 3600);
	var minutes = Math.floor(_seconds / 60);
	_seconds = _seconds - (minutes * 60);
	
	var string = "";
	if(days > 0)string += days+".";
	if(hours >= 10)string += hours+":";
	else if(hours < 10)string += "0"+hours+":";
	if(minutes >= 10)string += minutes+":";
	else if(minutes < 10)string += "0"+minutes+":";
	if(_seconds >= 10)string += _seconds.toString();
	else if(_seconds < 10)string += "0"+_seconds.toString();
	
	if(negative)
		return "-" + string;
	return string;
}

function lz_jssess()
{	
	this.Save = lz_jssess_save;
	this.Load = lz_jssess_load;
	
	this.DelimiterStart = "LZSDS";
	this.DelimiterEnd = "LZSDE";

	this.GeoResolutions = 0;
	this.GeoResolved = Array();
	this.UserId = lz_user_id;
	this.BrowserId = lz_browser_id;
	this.ServerId = lz_server_id;
	this.OVLCPos = "";
	this.OVLCState = "0";
	this.OVLCSound = 1;
	this.OVLCWM = 0;
	
	function lz_jssess_save()
	{
		var data = this.DelimiterStart + lz_global_base64_url_encode(this.BrowserId + ";" + this.UserId + ";" + this.GeoResolved  + ";" + this.GeoResolutions+ ";" + this.ServerId + ";"+ this.OVLCPos + ";"+ this.OVLCState + ";" + this.OVLCSound + ";" + this.OVLCWM + ";") + this.DelimiterEnd;
		if(window.name == null || window.name == "undefinded" || window.name  == "" || (window.name == null && window.name.indexOf(this.DelimiterStart) == -1))
		{
			if(window.name == null || window.name == "undefinded" || window.name  == "")
				window.name = data;
			else
				window.name += data;
		}
		else
		{
			var regex = new RegExp(/\LZSDS.*?LZSDE/g);
			window.name = window.name.replace(regex,"");
			window.name += data;
		}
	}
	
	function lz_jssess_load()
	{
		var data = window.name;
		if(data.indexOf(this.DelimiterStart) != -1)
		{
			data = lz_global_base64_url_decode(data.split(this.DelimiterStart)[1].split(this.DelimiterEnd)[0]).split(";");
			if(this.ServerId == data[4])
			{
				this.BrowserId = data[0];
				this.UserId = data[1];
				this.GeoResolved = data[2].split(",");
				this.GeoResolutions = data[3];
				this.OVLCPos = data[5];
				this.OVLCState = data[6];
				this.OVLCSound = data[7];
				this.OVLCWM = parseInt(data[8]);
			}
		}
	}
}

function lz_chat_window()
{
	this.BrowserId = "";
	this.LastActive = 0;
	this.Closed = false;
	this.Deleted = false;
}

function lz_geo_resolver()
{
	this.ResolveAsync = lz_resolver_connect_async;
	this.TimeoutConnection = lz_resolver_timeout_connection;
	this.SetStatus = lz_resolver_set_status;
	this.SetSpan = lz_resolver_set_span;
	this.Status = 0;
	this.Span = 0;
	
	this.OnEndEvent;
	this.OnTimeoutEvent;	
	this.OnSpanEvent;	
	
	var OnEnd;
	var OnTimeout;
	var OnSpan;

	var lz_resolver_request;
	var lz_resolver_timeout_timer;
	
	function lz_resolver_connect_async()
	{
		OnEnd = this.OnEndEvent;
		OnTimeout = this.OnTimeoutEvent;
		OnSpan = this.OnSpanEvent;

		lz_resolver_timeout_timer = setTimeout(this.TimeoutConnection,15000);
		lz_resolver_request = document.createElement("script");
		lz_resolver_request.id = "livezilla_geoscript";

		lz_resolver_request.async = true;
		lz_resolver_request.src = lz_geo_url + "&gv=1021&method=" + OnEnd + "&spanm=" + OnSpan + "&oak=" + lz_oak + "&ip=" + lz_mip;
		lz_document_head.appendChild(lz_resolver_request);
	}

	function lz_resolver_timeout_connection()
	{
		if(OnTimeout != null)
			OnTimeout();
	}
	
	function lz_resolver_set_status(_status)
	{
		this.Status = _status;
	}
	
	function lz_resolver_set_span(_span)
	{
		this.Span = _span;
	}
}

function lz_global_get_window_height()
{
	return (lz_is_ie) ? document.documentElement.offsetHeight : window.innerHeight;
}

function lz_global_get_window_width()
{
	return (lz_is_ie) ? document.documentElement.offsetWidth : window.innerWidth;
}

function lz_global_replace_breaks(_text)
{
	_text = _text.replace(/[\r\n]+/g, "<br>");
	return _text.replace(/[\t]+/g, "&nbsp;&nbsp;&nbsp;");
}

function lz_global_base64_url_encode(_text)
{
    if(typeof _text == 'undefined')
        return "";
    if(_text == null)
        return "";
	if(_text.length == 0)
		return "";

	_text = lz_global_base64_encode(_text.toString());
	_text = _text.replace(/=/g, "_");
	_text = _text.replace(/\+/g, "-");
	_text = _text.replace(/\//g, ",");
	return _text;
}

function lz_global_base64_url_decode(_text)
{
	if(!(_text != null && _text.length > 0))
		return "";
		
	_text = _text.replace(/_/g,"=");
	_text = _text.replace(/-/g,"+");
	_text = _text.replace(/,/g,"/");
	_text = lz_global_base64_decode(_text);
	return _text;
}
	
function lz_global_base64_decode(_text)
{
	var base64_chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
	var output = "";
	var chr1, chr2, chr3;
	var enc1, enc2, enc3, enc4;
	var i = 0;
	_text = _text.replace(/[^A-Za-z0-9\+\/\=]/g, "");
	while (i < _text.length) 
	{
		enc1 = base64_chars.indexOf(_text.charAt(i++));
		enc2 = base64_chars.indexOf(_text.charAt(i++));
		enc3 = base64_chars.indexOf(_text.charAt(i++));
		enc4 = base64_chars.indexOf(_text.charAt(i++));
		chr1 = (enc1 << 2) | (enc2 >> 4);
		chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
		chr3 = ((enc3 & 3) << 6) | enc4;
		output = output + String.fromCharCode(chr1);
		if (enc3 != 64) 
		{
			output = output + String.fromCharCode(chr2);
		}
		if (enc4 != 64) 
		{
			output = output + String.fromCharCode(chr3);
		}
	}
	output = lz_global_utf8_decode(output);
	return output;
}

function lz_global_base64_encode(_input) 
{
	var base64_chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
	var output = "";
	var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
	var i = 0;

	_input = lz_global_utf8_encode(_input);
	while (i < _input.length) 
	{
		chr1 = _input.charCodeAt(i++);
		chr2 = _input.charCodeAt(i++);
		chr3 = _input.charCodeAt(i++);
		enc1 = chr1 >> 2;
		enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
		enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
		enc4 = chr3 & 63;
		if(isNaN(chr2)) 
		{
			enc3 = enc4 = 64;
		} 
		else if(isNaN(chr3)) 
		{
			enc4 = 64;
		}
		output = output + base64_chars.charAt(enc1) + base64_chars.charAt(enc2) +	base64_chars.charAt(enc3) + base64_chars.charAt(enc4);
	}
	return output;
}

function lz_global_utf8_encode(_string) 
{
	_string = _string.replace(/\r\n/g,"\n");
	var enc = "";
	for (var n = 0; n < _string.length; n++) 
	{
		var c = _string.charCodeAt(n);
		if (c < 128) 
		{
			enc += String.fromCharCode(c);
		}
		else if((c > 127) && (c < 2048))
		{
			enc += String.fromCharCode((c >> 6) | 192);
			enc += String.fromCharCode((c & 63) | 128);
		}
		else 
		{
			enc += String.fromCharCode((c >> 12) | 224);
			enc += String.fromCharCode(((c >> 6) & 63) | 128);
			enc += String.fromCharCode((c & 63) | 128);
		}
	}
	return enc;
}

function lz_global_utf8_decode(_string) 
{
	var dec = "";
	var i = 0;
	var c = c1 = c2 = 0;
	while (i < _string.length) 
	{
		c = _string.charCodeAt(i);
		if (c < 128) 
		{
			dec += String.fromCharCode(c);
			i++;
		}
		else if((c > 191) && (c < 224))
		{
			c2 = _string.charCodeAt(i+1);
			dec += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
			i += 2;
		}
		else 
		{
			c2 = _string.charCodeAt(i+1);
			c3 = _string.charCodeAt(i+2);
			dec += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
			i += 3;
		}
	}
	return dec;
}

function lz_set_title_mode()
{
    window.title = document.title = lz_title_modes[lz_title_step++ % 2];
}

function lz_switch_title_mode(_active)
{
	if(_active)
	{
		if(lz_title_timer == null)
		{
			lz_title_timer = setInterval("lz_set_title_mode()",1000);
		}
	}
	else
	{
		clearInterval(lz_title_timer);
		lz_title_timer = null;
   		document.title = lz_title_modes[0];
		lz_title_step = 0;
	}
}

function lz_global_timestamp()
{
	var now = new Date();
	var ts = Math.round((now.getTime()/1000));
	return (ts);
}

function lz_global_microstamp()
{
	var now = new Date();
	var ts = now.getTime();
	return (ts);
}

function lz_global_get_long_poll_runtime()
{
	if(LiveZillaData.LastConnectionFailed)
		return 20;
	var value = LiveZillaData.PollTimeout - LiveZillaData.ChatFrequency - 25;
	if(value >= 60)
		value = 65;
	return value;
}

function lz_chat_get_locale_time()
{
	var time = new Date().toLocaleTimeString();
	time = time.split(" (");
	return time[0];
}

function lz_chat_get_locale_date()
{
	var date = new Date().toLocaleString();
	date = date.split(" (");
	return date[0];
}

function lz_global_handle_exception(exception,file,line)
{
	//alert(exception+file+line);
	return true;
}

function lz_global_trim(_str) 
{
	return _str.replace(/^\s+|\s+$/g,"");
}

function lz_global_htmlentities(_value) 
{
	_value = _value.replace(/\</g,"&lt;");
	_value = _value.replace(/\>/g,"&gt;");
	return _value;
}

function lz_global_get_page_offset_y()
{
	if(window.pageYOffset != null)
		return window.pageYOffset;
	else
		return Math.max(document.documentElement.scrollTop, document.body.scrollTop);
}

function lz_global_get_page_offset_x()
{
	return 0;
}

function lz_global_get_doctype()
{
	var dc = "";
	if(typeof document.namespaces != "undefined")
		dc = document.all[0].nodeType==8 ? document.all[0].nodeValue.toLowerCase() : "";
	else
		dc = document.doctype != null ? document.doctype.publicId.toLowerCase() : "";
		
	if(dc == "doctype html" || dc == "")
		return "HTML_5";
		
	return (dc.indexOf("xhtml") != -1) ? "XHTML" : (dc.indexOf("loose")!=-1) ? "HTML_4_TRANSITIONAL" : (dc.indexOf("html")!=-1) ? "HTML_4" : "";
}

function lz_set_cookie(_name,_value)
{
	var exdate=new Date();
	exdate.setDate(exdate.getDate() + 1);
	var c_value=escape(_value) + "; expires="+exdate.toUTCString();
	document.cookie = _name + "=" + c_value;
}

function lz_get_cookie(_name)
{
	var i,x,y,ARRcookies=document.cookie.split(";");
	for (i=0;i<ARRcookies.length;i++)
	{
		x=ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
	  	y=ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
	  	x=x.replace(/^\s+|\s+$/g,"");
	  	if (x==_name)
	    {
	    	return unescape(y);
	    }
	}
	return null;
}