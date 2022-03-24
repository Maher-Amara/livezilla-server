/****************************************************************************************
 * LiveZilla ChatGeotrackingMapClass
 *
 * Copyright 2014 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/
function ChatGeotrackingMapClass() {
    this.iframe = null;
    this.receiver = null;
    this.urlIsSet = false;
    this.visitorQueue = [];
    this.delayCounter = 0;
    this.delayAddIsInProgress = false;
    this.selectedVisitor = null;
}

ChatGeotrackingMapClass.prototype.setIframe = function(iframe) {
    this.iframe = iframe;
};

ChatGeotrackingMapClass.prototype.setReceiver = function(receiver) {
    this.receiver = receiver;
};

ChatGeotrackingMapClass.prototype.move = function(_left, _up) {
    this.postMessage({action: 'move', left: _left, up: _up});
};

ChatGeotrackingMapClass.prototype.zoom = function(_in) {
    this.postMessage({action: 'zoom', in: _in});
};

ChatGeotrackingMapClass.prototype.addVisitor = function(_lat, _lon, _id) {
    this.postMessage({action: 'add-visitor', lat: _lat, lon: _lon, id: _id});
};

ChatGeotrackingMapClass.prototype.removeVisitor = function(_id) {
    this.postMessage({action: 'remove-visitor', id: _id});
};

ChatGeotrackingMapClass.prototype.clearAll = function() {
    this.postMessage({action: 'clear'});
    this.visitorQueue = [];
};

ChatGeotrackingMapClass.prototype.doZoomTo = function(_id) {
    this.postMessage({action: 'do-zoom-to', in: _id});
};

ChatGeotrackingMapClass.prototype.getZoomLevel = function() {
    this.postMessage({action: 'get-zoomlevel'});
};

ChatGeotrackingMapClass.prototype.setMapType = function(_type) {
    this.postMessage({action: 'set-map-type', type: _type});
};

ChatGeotrackingMapClass.prototype.setChat = function(_id, _chat) {
    this.postMessage({action: 'set-chat', id: _id, chat: _chat});
};

ChatGeotrackingMapClass.prototype.setSelection = function(_id, _center) {

    this.postMessage({action: 'set-selection', id: _id, center: _center});
};

ChatGeotrackingMapClass.prototype.getSelection = function(_id, _center) {
    this.postMessage({action: 'get-selection', id: _id, center: _center});
};

ChatGeotrackingMapClass.prototype.sendUrl = function() {
    if (!this.urlIsSet && this.iframe != null)
    {
        var myUrl = document.URL.split('://')[0] + '://' + document.URL.split('://')[1].split('/')[0];
        setTimeout(function(){
            lzm_chatGeoTrackingMap.postMessage({action: 'set-origin', origin: myUrl}, false);
        },2000);
    }
};

ChatGeotrackingMapClass.prototype.addOrQueueVisitor = function(_visitor) {

    if (this.urlIsSet)
    {
        if (typeof _visitor != 'undefined')
        {
            this.removeVisitor(String(_visitor.id));
            if(parseFloat(_visitor.lat) != -522)
                this.addVisitor(parseFloat(_visitor.lat), parseFloat(_visitor.long), String(_visitor.id));
        }
        var tmpVisitorArray = lzm_commonTools.clone(this.visitorQueue);
        this.visitorQueue = [];
        for (var i=0; i<tmpVisitorArray.length; i++) {
            if (tmpVisitorArray[i] != null) {
                this.addOrQueueVisitor(tmpVisitorArray[i]);
            }
        }
        if (this.selectedVisitor != null)
        {
            this.setSelection(this.selectedVisitor, '');
        }
    }
    else
    {
        this.move(0, 0);
        this.visitorQueue.push(_visitor);
        if (!this.delayAddIsInProgress)
            this.delayAddVisitor();
    }
};

ChatGeotrackingMapClass.prototype.delayAddVisitor = function() {
    var that = this;
    that.delayAddIsInProgress = true;
    setTimeout(function()
    {
        if (that.delayCounter < 20 && that.urlIsSet)
        {
            that.delayCounter = 0;
            that.delayAddIsInProgress = false;
            that.addOrQueueVisitor();
        }
        else if (that.delayCounter < 20)
        {
            that.delayCounter++;
            that.move(0,0);
            that.delayAddVisitor();
        }
        else
        {
            that.delayCounter = 0;
            that.delayAddIsInProgress = false;
        }
    }, 1500);
};

ChatGeotrackingMapClass.prototype.postMessage = function(_data, _sendUrl) {
    _sendUrl = (typeof _sendUrl != 'undefined') ? _sendUrl : true;
    if ((this.urlIsSet||_data.action == 'set-origin') && this.iframe != null)
    {
        try
        {
            this.iframe.contentWindow.postMessage(_data, this.receiver);
        }
        catch(e)
        {

        }
    }
    if (_sendUrl == true)
        this.sendUrl();
};
