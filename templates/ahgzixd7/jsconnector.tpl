function lz_connector(_url,_post,_timeout)
{
	this.Url = _url;
	this.Post = _post;
	this.Timeout = _timeout;	
	this.DataFormat = false;
	this.ChangeState = lz_connector_change_state;
	this.ConnectAsync = lz_connector_connect_async;
	this.ConnectSync = lz_connector_connect_sync;	
	this.TimeoutConnection = lz_connector_timeout_connection;	

	this.OnEndEvent;
	this.OnErrorEvent;
	this.OnTimeoutEvent;
    this.OnProgressEvent;
    this.OnLoadEvent;

	var OnEnd;
	var OnError;
	var OnTimeout;
    var OnProgress;

	var lz_connector_request;
	var lz_connector_timeout_timer;
	var lz_connector_aborted = false;

	function lz_connector_connect_async()
	{
		OnEnd = this.OnEndEvent;
		OnError = this.OnErrorEvent;
		OnTimeout = this.OnTimeoutEvent;
        OnProgress = this.OnProgressEvent;

        this.DataFormat = (typeof this.Post).toLowerCase() != "string";

		if(this.Timeout > 0)
			lz_connector_timeout_timer = setTimeout(this.TimeoutConnection,this.Timeout);

		lz_connector_request = lz_connector_create_request_object(this.DataFormat);
		lz_connector_request.open('POST', this.Url, true);
		lz_connector_request.onreadystatechange = lz_connector_change_state;

        if(this.OnProgressEvent != null)
            lz_connector_request.upload.addEventListener("progress", this.OnProgressEvent, false);

        if(this.OnLoadEvent != null)
            lz_connector_request.addEventListener("load", this.OnLoadEvent, false);

        if(!this.DataFormat)
        {
		    lz_connector_request.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
            //lz_connector_request.setRequestHeader("Content-length", this.Post.length);
            //lz_connector_request.setRequestHeader('Connection', 'close');
        }
		lz_connector_request.send(this.Post);
	}
	
	function lz_connector_connect_sync()
	{
		lz_connector_request=lz_connector_create_request_object(false);
		lz_connector_request.open('POST', this.Url, true);  
		lz_connector_request.setRequestHeader('Content-Type','application/x-www-form-urlencoded');   
		lz_connector_request.setRequestHeader("Content-length", this.Post.length); 
		lz_connector_request.setRequestHeader('Connection', 'close');     
		lz_connector_request.send(this.Post);
		return lz_connector_request.responseText;                                                          
	}
	
	function lz_connector_change_state() 
	{	
		if (lz_connector_request.readyState == 4)
		{
			if(lz_connector_request.status == 100 || lz_connector_request.status == 200)
				lz_connector_end_connection(lz_connector_request.status,lz_connector_request.responseText);
			else
				lz_connector_error_connection(lz_connector_request.status,lz_connector_request.responseText);
		}
	}
	
	function lz_connector_is_running() 
	{
		return ( lz_connector_request.readyState > 0 &&  lz_connector_request.readyState < 4);
	}
	
	function lz_connector_end_connection(_status, _response)
	{
		clearTimeout(lz_connector_timeout_timer);
		if(!lz_connector_aborted && OnEnd != null)
			OnEnd(_status, _response);
	}
	
	function lz_connector_error_connection(_status, _response)
	{	
		clearTimeout(lz_connector_timeout_timer);
		if(!lz_connector_aborted && OnError != null)
			OnError(_status, _response);
	}
	
	function lz_connector_timeout_connection()
	{
		lz_connector_aborted = true;
		if(lz_connector_is_running())
			lz_connector_request.abort();
		
		if(OnTimeout != null)
			OnTimeout();
	}
	
	function lz_connector_create_request_object(_reqxmlhttp)
	{
		var requestObject = null;

        if(_reqxmlhttp)
            return new XMLHttpRequest;

		try 
		{
			requestObject = new ActiveXObject("MSXML2.XMLHTTP");
		}
		catch (err_MSXML2) 
		{
			try 
			{
				requestObject = new ActiveXObject("Microsoft.XMLHTTP");
			}
			catch (err_Microsoft) 
			{
				if (typeof XMLHttpRequest != "undefined") 
					requestObject = new XMLHttpRequest;
			}
		}
		return requestObject;
	}
}
