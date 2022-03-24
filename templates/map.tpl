<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
  <head>
    <title>Livezilla GeoTracking</title>
	<STYLE type="text/css">
	
	*{font-family:verdana,arial;font-size:11px;color:#616161;}
	DIV{font-size:11px;color:#8d8d8d;vertical-align:middle;text-align:center;}
	body{background:#a5bfdd;}
	
	</STYLE>

    <script type="text/javascript">
	var level = 1;
	var maptype = 0;
	var selected = null;
	var visitors = Array();
	var loaded = false;
	var preselect = null;
	var path = "./images/geo/default/";
	var imageShadow = path + "shadow.png";
	var imageVisitor = path + "visitor.png";
	var imageVisitorSelected = path + "visitor_selected.png";
	var imageVisitorChat = path + "visitor_chat.png";
	var imageVisitorSelectedChat = path + "visitor_selected_chat.png";
	var shadow = true;
	var maps = Array();
	var map_scroll = null;
	
	maps[1]={name:"Medium", width:500, height:333, file:"map_2.jpg", xcor: 68, ycor:33}
	maps[2]={name:"Large", width:999, height:666, file:"map_3.jpg", xcor: 81, ycor:65}
	maps[3]={name:"Full", width:1998, height:1332, file:"map_4.jpg", xcor: 114, ycor:128}
	
	function init()
	{
		map_scroll = new ScrollMap();
		DoZoomTo(1,false);
	}				 
					
	function ChangeImageSource(_imageVisitor, _imageVisitorSelected, _imageVisitorChat, _imageVisitorSelectedChat, _shadow)
	{
		imageVisitor = _imageVisitor;
		imageVisitorSelected = _imageVisitorSelected;
		imageVisitorChat = _imageVisitorChat;
		imageVisitorSelectedChat = _imageVisitorSelectedChat;
		shadow = _shadow;
	}
	
	function ResetView(_level)
	{
		DoZoomTo(1,false);
	}
	
	function DoZoomTo(_in)
	{
		if(_in && level < 3)
            level++;
		else if(!_in && level >= 2)
            level--;
		else
			return;

		document.getElementById("map").style.backgroundImage="url('"+path+maps[level].file+"')";
		document.getElementById("map").style.width=maps[level].width;
		document.getElementById("map").style.height=maps[level].height;
		
		maptype = maps[level];
		RePosition();

		if(_in)
			map_scroll.ScrollTo((document.documentElement.offsetWidth/2)-(maptype.width/2),(document.documentElement.offsetHeight/2)-(maptype.height/2));
		else
			map_scroll.ScrollTo(map_scroll.map.style.left.replace("px","")-((maps[level].width-maps[level+1].width)/2),map_scroll.map.style.top.replace("px","")-((maps[level].height-maps[level+1].height)/2));
	}
	
	function SetMapType(_type)
	{
	
	}
	
	function RePosition()
	{
		var visitorsold = Array();
		for(var i = 0;i < visitors.length; i++)
		{
			visitorsold.push(visitors[i]);
		}
		ClearAll();
		for(var i = 0;i < visitorsold.length; i++)
		{
			AddVisitor(visitorsold[i].m_Lat,visitorsold[i].m_Lng,visitorsold[i].m_Id);
			visitors[i].m_Selected = visitorsold[i].m_Selected;
			
			if(visitors[i].m_Selected)
				SetSelection(visitorsold[i].m_Id,true);
		}
	}
	
	function ClearAll()
	{		
		for(var i = 0;i < visitors.length; i++)
		{
			document.getElementById("map").removeChild(visitors[i].m_Marker);
			document.getElementById("map").removeChild(visitors[i].m_MarkerShadow);
		}
		visitors.length = 0;
	}
	
	function SetSelection(_id,_center)
	{
		preselect = _id;
		oldselected = selected;
		for(var i = 0;i < visitors.length; i++)
		{
			if(visitors[i].GetId() == _id)
			{
				selected = visitors[i];
				visitors[i].SetSelection(true);
			}
			else if(visitors[i] == oldselected)
				visitors[i].SetSelection(false);
		}
	}
	
	function GetSelection(_id,_center)
	{
		return selected.GetId();
	}
	
	function SetChat(_id,_chat)
	{
		for(var i = 0;i < visitors.length; i++)
		{
			if(visitors[i].GetId() == _id)
			{
				visitors[i].SetChat(_chat); 
				return;
			}
		}
	}
	
	function RemoveVisitor(_id)
	{						
		var new_visitors = Array();
		for(var i = 0;i < visitors.length; i++)
		{
			if(visitors[i].GetId() == _id)
			{	
				visitors[i].SetSelection(false);
				document.getElementById("map").removeChild(visitors[i].m_Marker);
				document.getElementById("map").removeChild(visitors[i].m_MarkerShadow);
			}
			else
				new_visitors.push(visitors[i]);
		}
		visitors = new_visitors;
	}
	
	function AddVisitor(_lat,_lng,_id)
	{
		var visitor = new Visitor(_id);
		visitor.m_Lat = _lat;
		visitor.m_Lng = _lng;
		visitor.GetHTML(_lat,_lng);
		visitors.push(visitor);
		visitors = visitors.sort(sortVisitors);

		var intz = 31;
		for(var i = 0; i < visitors.length;i++)
		{
			visitors[i].m_ZIndex = 
			visitors[i].m_Marker.style.zIndex = intz++;
		}
	}
	
	
	function sortVisitors(a,b)
	{
		return a.m_YPos - b.m_YPos;
	}

	
	function AvoidReload()
	{
		event.keyCode=70;
	}
	
	function Visitor(_id)
	{
		this.m_Id = _id;
		this.m_Selected = false;
		this.m_Chat = false;
		this.m_Lat;
		this.m_Lng;
		this.m_Marker;
		this.m_MarkerShadow;
		this.m_YPos=0;
		this.m_ZIndex=0;
		this.GetHTML = getHTML;
		this.GetMarker = getMarker;
		this.GetId = getId;
		this.SetSelection = setSelection;
		this.SetChat = setChat;
		this.ShowImage = showImage;
		this.SetImage = setImage;
		
		function getMarker()
		{
			return this.m_Marker;
		}
		
		function getHTML(_lat,_lng)
		{		
			var pos = convert(_lat,_lng);
			this.m_YPos = pos[0];
			this.m_Marker = document.createElement('img');
			this.m_Marker.id = this.m_Id;
			this.m_Marker.src = imageVisitor;
			this.m_Marker.onclick = function(){SetSelection(this.id,false);document.body.fireEvent("ondragover", document.createEventObject());};
			this.m_Marker.style.cssText = "cursor:pointer;width:24px;height:50px;font-size:0px;padding:0px;position:absolute;top:"+pos[0]+"px;left:"+pos[1]+"px;";
			document.getElementById("map").appendChild(this.m_Marker);
			
			this.m_MarkerShadow = document.createElement('img');
			this.m_MarkerShadow.id = this.m_Id+"_shadow";
			this.m_MarkerShadow.src = imageShadow;
			this.m_MarkerShadow.style.cssText = "width:26px;height:50px;font-size:0px;padding:0px;position:absolute;top:"+pos[0]+"px;left:"+(pos[1]+3)+"px;";
			document.getElementById("map").appendChild(this.m_MarkerShadow);
		}
		
		function getId()
		{
			return this.m_Id;
		}
		
		function showImage()
		{
			if(this.m_Selected && this.m_Chat)
				this.SetImage(imageVisitorSelectedChat); 
			else if(this.m_Selected && !this.m_Chat)
				this.SetImage(imageVisitorSelected); 
			else if(this.m_Chat)
				this.SetImage(imageVisitorChat); 
			else
				this.SetImage(imageVisitor);
		}
		
		function setImage(_img)
		{
			document.getElementById(this.m_Id).src = _img;
		}
		
		function setSelection(_selected)
		{
			this.m_Selected = _selected;
			
			if(_selected)
				this.m_Marker.style.zIndex = visitors.length+35;
			else
				this.m_Marker.style.zIndex = this.m_ZIndex;
				
			this.ShowImage();
		}
		
		function setChat(_chat)
		{
			this.m_Chat = _chat;
			this.ShowImage();
		}
		
		function convert(lat, lng)
		{	
			var mapheight = maptype.height;
			var mapwidth = maptype.width;
			var layerheight = 50;
			var layerwidth = 20;
			var longitude_shift = 55;
			var x_pos = maptype.xcor;
			var y_pos = maptype.ycor;
			var layermiddle = Math.floor(layerwidth / 2);
			
	 		x = (mapwidth * (180 + lng) / 360) % mapwidth + longitude_shift;
		    lat = lat * Math.PI / 180;
		    y = Math.log(Math.tan((lat/2) + (Math.PI/4)));
		    y = (mapheight / 2) - (mapwidth * y / (2 * Math.PI)) + y_pos;
		    x -= x_pos;y += y_pos;
		    return new Array(y-layerheight,x-layermiddle);
		}
	}
	
	window.onresize = resizeWindow;
	function resizeWindow()
	{
		var element = document.getElementById("frameb");

		element.style.height = document.documentElement.offsetHeight+"px"; 
		element.style.width = (document.body.clientWidth)+"px";
	}
	

	function ScrollMap() 
	{
	    function AddListener(element, event, f) {if(element.attachEvent) {element["e" + event + f] = f;element[event + f] = function () {element["e" + event + f](window.event)};element.attachEvent("on" + event, element[event + f])} else element.addEventListener(event, f, false)}
	    function Positioning(startX, startY){this.x = startX;this.y = startY;}
	    function ScrollTo(_x, _y){scrollmap.map.style.left = _x + "px";scrollmap.map.style.top = _y + "px";}
		
		this.ScrollTo = ScrollTo;
	    
		var scrollmap = this;
		scrollmap.slideOut = 0;
		scrollmap.map = document.getElementById("map");
	    scrollmap.width = document.body.clientWidth;
	    scrollmap.height = document.documentElement.offsetHeight;
	    scrollmap.scrolling = true;
	    scrollmap.framediv = document.createElement("div");
		scrollmap.framediv.id = "frameb";
	    scrollmap.mousePosition = new Positioning;
	    scrollmap.mouseLocations = [];
	    scrollmap.speed = new Positioning;
	    scrollmap.mouseDown = false;
	    scrollmap.timerId = -1;
	    scrollmap.timerCount = 0;
	    scrollmap.map.parentNode.replaceChild(scrollmap.framediv, scrollmap.map);
	    scrollmap.framediv.appendChild(scrollmap.map);
	    scrollmap.framediv.style.overflow = "hidden";
	    scrollmap.framediv.style.width = scrollmap.width + "px";
	    scrollmap.framediv.style.height = scrollmap.height + "px";
	    scrollmap.framediv.style.position = "relative";
	    scrollmap.map.style.position = "absolute";
	    ScrollTo(-120,-120);
	
	    var MouseMove = function (b) 
		{
	        var e = b.clientX - scrollmap.mousePosition.x + parseInt(scrollmap.map.style.left),d = b.clientY - scrollmap.mousePosition.y + parseInt(scrollmap.map.style.top);
	        ScrollTo(e, d);
	        scrollmap.mousePosition.x = b.clientX;
	        scrollmap.mousePosition.y = b.clientY
	    };
	
	    var OnslideOutr = function () 
		{
	        if(scrollmap.mouseDown) 
			{
	            scrollmap.mouseLocations.unshift(new Positioning(scrollmap.mousePosition.x,scrollmap.mousePosition.y));
	            if(scrollmap.mouseLocations.length > 10)
	                scrollmap.mouseLocations.pop();
	        } 
			else 
			{
	            var milliTotal = scrollmap.slideOut / 20;
	            var spaceUP = (milliTotal - scrollmap.timerCount) / milliTotal;
	            var xspeed = scrollmap.speed.x * spaceUP;
	            var yspeed = scrollmap.speed.y * spaceUP;
	            
	            ScrollTo(-xspeed + parseInt(scrollmap.map.style.left),-yspeed + parseInt(scrollmap.map.style.top));
	
	            if(scrollmap.timerCount == milliTotal) 
				{
	                clearInterval(scrollmap.timerId);
	                scrollmap.timerId = -1
	            }
	            ++scrollmap.timerCount;
	        }
	    };
	
	    AddListener(scrollmap.framediv, "mousedown", function (e) 
		{
			if(scrollmap.mouseDown)
			{
				return false;
			}
	        scrollmap.mousePosition.x = e.clientX;
	        scrollmap.mousePosition.y = e.clientY;
	        AddListener(document, "mousemove", MouseMove);
			
	        scrollmap.mouseDown = true;
	
	        if(scrollmap.scrolling) 
			{
	            scrollmap.timerCount = 0;
	            if(scrollmap.timerId != 0)
	            {
	                clearInterval(scrollmap.timerId);
	                scrollmap.timerId = 0;
	            }
	            scrollmap.timerId = setInterval(OnslideOutr, 20);
	        }
	        e.preventDefault();
	    });
	
	    AddListener(document, "mouseup", function () 
		{
	        if(scrollmap.mouseDown) 
			{
	            var handler = MouseMove;
	            if(document.detachEvent) 
				{
	                document.detachEvent("onmousemove", document["mousemove" + handler]);
	                document["mousemove" + handler] = null;
	            } 
				else 
				{
	                document.removeEventListener("mousemove", handler, false);
	            }
	            
	            scrollmap.mouseDown = false;
	            if(scrollmap.mouseLocations.length > 0) 
				{
	                var clickCount = scrollmap.mouseLocations.length;
	                scrollmap.speed.x = (scrollmap.mouseLocations[clickCount - 1].x - scrollmap.mouseLocations[0].x) / clickCount;
	                scrollmap.speed.y = (scrollmap.mouseLocations[clickCount - 1].y - scrollmap.mouseLocations[0].y) / clickCount;
	                scrollmap.mouseLocations.length = 0;
	            }
	        }
	    });
	};

  </script>
  </head>
  
  <body background="#a5bfdd" oncontextmenu="return false;" topmargin="0" onkeydown="AvoidReload()" leftmargin="0"  onload="init();">
  <!--page_rec_code:998hJ8879Kk-->
<table width="100%" height="100%" cellspacing=0 cellpadding=0>
	<tr>
		<td align="center" valign="top">
			<div id="cc_welcome" style="margin:0px;padding:0px;height:100%;" style="overflow:hidden;">
			<TABLE CELLPADDING=0 CELLSPACING=0 height="100%" width="100%">
				<tr>
					<TD id="frame" valign="middle" style="overflow:hidden;">
						<div id="map" style="position:relative;width:500px;height:333px;vertical-align:middle;text-align:center;background-repeat:no-repeat;background-image:url('./images/geo/default/map_2.jpg');"></div>
					</TD>
				</tr>
			</table>
			</div>
    		<a href="http://www.openstreetmap.org/" target="_blank" style="position:absolute;bottom:10px;left:10px;font-size:10px;color:#4c7bb2;text-decoration:none;">&copy;OpenStreetMap and Contributors, CC BY-SA</a>
  		</td>
	</tr>
</table>
  </body>
</html>
