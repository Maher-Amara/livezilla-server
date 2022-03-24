function base64_url_encode(_text)
{
	if(_text.length == 0)
		return "";

	_text = base64_encode(_text.toString());
	_text = _text.replace(/=/g, "_");
	_text = _text.replace(/\+/g, "-");
	_text = _text.replace(/\//g, ",");
	return _text;
}

function base64_url_decode(_text)
{
	if(!(_text != null && _text.length > 0))
		return "";
		
	_text = _text.replace(/_/g,"=");
	_text = _text.replace(/-/g,"+");
	_text = _text.replace(/,/g,"/");
	_text = base64_decode(_text);
	return _text;
}
	
function base64_decode(_text)
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
	output = utf8_decode(output);
	return output;
}

function base64_encode(_input) 
{
	var base64_chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
	var output = "";
	var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
	var i = 0;

	_input = utf8_encode(_input);
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