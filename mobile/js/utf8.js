function utf8_encode(_string) 
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

function utf8_decode(_string) 
{
    try
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
    catch(ex)
    {

    }
    return "";
}