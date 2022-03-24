function lz_livebox_v2(_id,_html,_width,_height,_mleft,_mtop,_mright,_mbottom,_position,_parent){
    this.Version = '2';

    this.m_Id = _id;
    this.m_HTML = _html;
    this.m_Width = _width;
    this.m_Height = _height;
    this.m_Margins = [_mtop,_mright,_mbottom,_mleft];
    this.m_Unit = 'px';
    this.m_UpdateInterval = null;
    this.m_IsMobile = false;
    this.m_ScaleFactor = null;
    this.m_MaxHeight = 0;
    this.m_Parent = (typeof _parent == 'undefined') ? document.body : _parent;
    this.m_AutoScaleMode = true;
    this.m_Position = _position;
    this.m_FullScreenMode = false; // sep window
    this.m_FixedMode = false; // mobile overlay in fullscreen

    this.m_ScrollHidden = false;
    this.m_FrameElement = document.createElement('DIV');
    this.m_FrameElement.id = this.m_Id;
    this.m_FrameElement.style.display = 'none';
    this.m_FrameElement.innerHTML = this.m_HTML;
    this.m_Parent.appendChild(this.m_FrameElement);

    this.SetFixedMode(false);
    this.UpdateUI();
}

lz_livebox_v2.prototype.UpdateUI = function(_show) {

    if(this.m_IsMobile)
    {
        if(!_show)
            this.InitUpdateInterval();

        if(this.IsVisible() && !_show)
        {
            this.m_ScrollHidden = true;
            this.SetVisible(false);
        }
        else if(!this.IsVisible() && this.m_ScrollHidden && _show)
        {
            this.m_ScrollHidden = false;
            this.SetVisible(true);
        }
    }
    this.ApplyPosition();
    this.ApplyScale();
    this.SetMargin();
};

lz_livebox_v2.prototype.ApplyPosition = function() {

    var x = window.innerWidth-document.documentElement.clientWidth;
    var y = window.innerHeight-document.documentElement.clientHeight;

    if(this.m_FixedMode || this.m_FullScreenMode)
    {
        this.m_FrameElement.style.left = 0;
        this.m_FrameElement.style.top = 0;
        this.m_FrameElement.style.right = 0;
        this.m_FrameElement.style.bottom = 0;

    }
    else if(this.m_Position == '10')
    {
        this.m_FrameElement.style.right = 'auto';
        this.m_FrameElement.style.top = 'auto';

        if(!this.m_IsMobile)
        {
            this.m_FrameElement.style.left = 0;
            this.m_FrameElement.style.bottom = 0;
        }
        else
        {
            this.m_FrameElement.style.right = 'auto';
            this.m_FrameElement.style.top = 'auto';
            this.m_FrameElement.style.left = (((window.pageXOffset*-1))-x) + this.m_Unit;
            this.m_FrameElement.style.bottom = (((window.pageYOffset*-1))-y) + this.m_Unit;
        }
    }
    else if(this.m_Position == '22')
    {
        this.m_FrameElement.style.left = 'auto';
        this.m_FrameElement.style.top = 'auto';

        if(!this.m_IsMobile)
        {
            this.m_FrameElement.style.right = 0;
            this.m_FrameElement.style.bottom = 0;
        }
        else
        {
            this.m_FrameElement.style.left = 'auto';
            this.m_FrameElement.style.top = 'auto';
            this.m_FrameElement.style.right = (((window.pageXOffset*-1))-x) + this.m_Unit;
            this.m_FrameElement.style.bottom = (((window.pageYOffset*-1))-y) + this.m_Unit;
        }
    }
    else if(this.m_Position == '00')
    {
        this.m_FrameElement.style.right = 0;
        this.m_FrameElement.style.left = 0;
        this.m_FrameElement.style.top = 0;
        this.m_FrameElement.style.bottom = 'auto';
        this.m_FrameElement.style.height = this.m_Height + this.m_Unit;
    }
};

lz_livebox_v2.prototype.CalculateScale = function() {

    if(this.m_AutoScaleMode)
    {
        var currentBaseH = Math.max(300,this.m_MaxHeight);
        var currentBaseW = Math.max(300,this.m_MaxHeight);
        currentBaseH += window.innerHeight*0.3;
        currentBaseW += window.innerWidth*0.3;
        var curHRatio = window.innerHeight / currentBaseH;
        var curWRatio = window.innerWidth / currentBaseW;
        var curR = Math.min(curHRatio,curWRatio);
        var targetRatio = this.m_IsMobile ? 1 : -1;
        this.m_ScaleFactor = (this.m_IsMobile) ? curR / targetRatio : null;
    }
    return this.m_ScaleFactor;
};

lz_livebox_v2.prototype.ApplyScale = function() {

    this.CalculateScale();
    if(this.m_ScaleFactor != null)
    {
        this.m_FrameElement.style["transform"] = "scale("+this.m_ScaleFactor+","+this.m_ScaleFactor+")";
        this.m_FrameElement.style["transformOrigin"] = '100% 100%';
        this.m_FrameElement.style["-webkit-transform"] = "scale("+this.m_ScaleFactor+","+this.m_ScaleFactor+")";
        this.m_FrameElement.style["-webkit-transform-origin"] = '100% 100%';
    }
};

lz_livebox_v2.prototype.ApplyScaleTo = function(_val){

    if(this.m_ScaleFactor == null)
        this.CalculateScale();
    if(_val>0 && this.m_ScaleFactor != null)
        return (_val*this.m_ScaleFactor)/_val;
    return _val;
};

lz_livebox_v2.prototype.SetVisible = function(_isVisible) {
    this.m_FrameElement.style.display = (_isVisible) ? 'block' : 'none';
};

lz_livebox_v2.prototype.IsVisible = function() {
    return this.m_FrameElement.style.display == 'block';
};

lz_livebox_v2.prototype.SetMobile = function(_isMobile) {

    /*
    this.m_IsMobile = _isMobile;

    if(_isMobile)
        this.m_FrameElement.style.position = 'absolute';

    if(this.m_UpdateInterval == null)
    {
        var that = this;
        window.addEventListener("resize",function(){that.UpdateUI(false);});
        window.addEventListener("scroll",function(){that.UpdateUI(false);});
        this.InitUpdateInterval();
    }
    */
};

lz_livebox_v2.prototype.InitUpdateInterval = function() {
    var that = this;
    if(this.m_UpdateInterval!=null)
        clearInterval(this.m_UpdateInterval);
    this.m_UpdateInterval = window.setInterval(function(){that.UpdateUI(true);},500);
};

lz_livebox_v2.prototype.SetMargin = function() {
    var scale = (this.m_ScaleFactor != null) ? this.m_ScaleFactor : 1;
    var bottomMargin = (!this.m_FullScreenMode) ? this.m_Margins[2] : 0;
    var topMargin = this.m_Margins[0];
    var rightMargin = (!this.m_FullScreenMode && this.m_Position != '00') ? this.m_Margins[1] : 0;
    this.m_FrameElement.style.margin = (this.m_FixedMode) ? 0 : (topMargin + 'px ' + Math.abs(rightMargin*scale) + 'px ' + Math.abs(bottomMargin*scale) + 'px 0');
};

lz_livebox_v2.prototype.SetFixedMode = function(_isFixed) {
    this.m_FixedMode = _isFixed;
    this.m_FrameElement.style.position = (_isFixed || !this.m_IsMobile) ? 'fixed' : 'absolute';
    this.m_FrameElement.style.width = (_isFixed) ? 'auto' : this.m_Width + this.m_Unit;
    this.m_FrameElement.style.height = (_isFixed) ? 'auto' : this.m_Height + this.m_Unit;
    this.SetMargin();
    this.ApplyPosition();
};

lz_livebox_v2.prototype.SetFullscreenMode = function(_is_Fullscreen) {
    this.m_FullScreenMode = _is_Fullscreen;
    this.m_FrameElement.style.position = 'absolute';
    this.m_FrameElement.style.width = 'auto';
    this.m_FrameElement.style.height = 'auto';
    this.SetMargin();
    this.ApplyPosition();
};
