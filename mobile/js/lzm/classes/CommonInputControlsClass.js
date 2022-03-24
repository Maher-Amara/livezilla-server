function CommonInputControlsClass() {

}

CommonInputControlsClass.prototype.createInputMenu = function(replaceElement, inputId, inputClass, width, placeHolder, value, selectList, scrollParent, selectmenuTopCorrection) {
    scrollParent = (typeof scrollParent != 'undefined') ? scrollParent : 'NOPARENTGIVEN';
    selectmenuTopCorrection = (typeof selectmenuTopCorrection != 'undefined') ? selectmenuTopCorrection : 0;

    var visibleList = [];
    var widthString = (width != 0) ? ' width: ' + width + 'px;' : ' width: 100%';

    if(selectList.length<2)
        $('#' + inputId + '-menu').css('display', 'none');

    var inputMenu = '<span id="' + inputId + '-box" class="lzm-combobox ' + inputClass + '"><input type="text" id="' +  inputId + '" autocomplete="new-password" style="box-shadow:none;padding: 0px; border: 0px;' + widthString + '" placeholder="' + placeHolder + '" value="' + value + '" /><span id="' + inputId + '-menu" style="cursor: pointer;margin-left:5px;"><i class="fa fa-chevron-down icon-blue"></i></span></span>';
    inputMenu += '<ul id="' + inputId + '-select" class="lzm-menu-select" style="display: none;"></ul>';

    function __switchInputList(_show){

        if (!_show)
        {
            $('#' + inputId + '-menu').find('i').removeClass('fa-chevron-up').addClass('fa-chevron-down');
            $('.lzm-menu-select').css('display', 'none');
            $('.lzm-menu-select').data('visible', false);
        }
        else
        {
            $('#' + inputId + '-menu').find('i').removeClass('fa-chevron-down').addClass('fa-chevron-up');
            setTimeout(function() {
                $('.lzm-menu-select').css('display', 'none');
                $('.lzm-menu-select').data('visible', false);
                $('#' + inputId + '-select').css('display', 'block');
                $('#' + inputId + '-select').data('visible', true);
            }, 10);

            var scrollX = ($('#' + scrollParent).length > 0) ? $('#' + scrollParent)[0].scrollLeft : 0;
            //var scrollY = 0;//($('#' + scrollParent).length > 0) ? $('#' + scrollParent)[0].scrollTop : 0;

            var eltPos = $('#' + inputId + '-box').position();
            var eltWidth = $('#' + inputId + '-box').width()+20;

            $('#' + inputId + '-select').css({
                left: Math.floor(eltPos.left - scrollX) + 'px',
                //top: Math.floor(eltPos.top + eltHeight + 12 + selectmenuTopCorrection + scrollY) + 'px'
                width: Math.floor(eltWidth) + 'px'
            });
        }
    }
    function updateInputList(_matchText){
        var i,kIndex = parseInt($('#' + inputId).data('key-index'));
        if(kIndex > visibleList.length-1)
            kIndex = 0;
        if(kIndex < 0)
            kIndex = visibleList.length-1;
        var listElements = '', hlClass;
        var addedCount = 0;
        visibleList = [];
        for (i=0; i<selectList.length; i++)
        {
            hlClass = '';
            var listValue = (selectList[i].constructor == Array) ? selectList[i][0] : selectList[i];

            if(_matchText == null || listValue.toLowerCase().indexOf(_matchText.toLowerCase())==0)
            {
                var usedCount = (selectList[i].constructor == Array) ? selectList[i][1] : 0;
                listElements += '<li id="'+inputId+'-selectoption-'+ addedCount.toString()+'" class="' + inputId + '-selectoption input-select-combo'+hlClass+'" style="cursor: default; position: relative;" title="'+listValue+' ('+usedCount+')">' + listValue + '<span class="lzm-delete-menu-item" onclick="deleteSalutationString(event, \'' + inputId + '\', \'' + listValue + '\');"><i class="fa fa-remove"></i></span></li>';
                addedCount++;
                visibleList.push(selectList[i]);
            }
            if(addedCount==20)
                break;
        }
        $('#' + inputId + '-select').html(listElements);
        $('#tr-intro-selectoption-' + kIndex.toString()).addClass('bg-blue').addClass('text-white');
        $('.' + inputId + '-selectoption').click(function(e) {
            $('#' + inputId).val($(this).html().replace(/<span class="lzm-delete-menu-item".*?span>/, ''));
            //$('#' + inputId + '-select').css('display', 'none');
            __switchInputList(false);
        });
        $('#' + inputId).data('key-index',kIndex);
        return listElements.length > 0;
    }

    $('#' + replaceElement).html(inputMenu).trigger('create');
    updateInputList(null);

    var show;//eltPos = $('#' + inputId + '-box').position();

    //var eltHeight = $('#' + inputId + '-box').height();
    $('#' + inputId + '-select').css({
        /*
        left: Math.floor(eltPos.left + 2) + 'px',
        top: Math.floor(eltPos.top + eltHeight + 8 + selectmenuTopCorrection) + 'px',*/
    });

    $('#' + replaceElement).css({'line-height': 2.5, 'white-space': 'nowrap'});

    $('#' + inputId + '-menu').click(function(e) {
        if(selectList.length>0)
            show = $('#' + inputId + '-select').css('display') != 'block';
        else
            show = false;
        __switchInputList(show);
    });

    if ($('#' + scrollParent).length > 0) {
        $('#' + scrollParent).scroll(function() {
            //$('#' + inputId + '-select').css({display: 'none'});
            __switchInputList(false);
        });
    }

    $('#' + inputId).data('key-index',0);
    $('#' + inputId).keyup(function(e) {
        if(e.keyCode == 40)
            $('#' + inputId).data('key-index',parseInt($('#' + inputId).data('key-index'))+1);
        else if(e.keyCode == 38)
            $('#' + inputId).data('key-index',parseInt($('#' + inputId).data('key-index'))-1);

        else if(e.keyCode == 13)
            $('#' + inputId+'-selectoption-'+ $('#' + inputId).data('key-index')).click();

        if(e.keyCode == 13 || e.keyCode == 9 || e.keyCode == 27)
            $('#' + inputId + '-select').css('display', 'none');
        else
            __switchInputList(updateInputList($('#' + inputId).val()));
    });
    $('#' + inputId).keydown(function(e) {
        if(e.keyCode == 9)
            $('#' + inputId + '-select').css('display', 'none');
    });
    $('body').click(function() {
        if ($('#' + inputId + '-select').css('display') == 'block') {
            $('#' + inputId + '-select').css('display', 'none');
        }
    });
};

CommonInputControlsClass.prototype.createInput = function(myId, myClass, myText, myLabel, myIcon, myType, myLayoutType, myData, myRightText, myLeftText) {
    myLayoutType = (typeof myLayoutType != 'undefined') ? myLayoutType : 'a';
    myType = (typeof myType != 'undefined' && myType != '') ? myType : 'text';
    myData = (typeof myData != 'undefined' && myData != '') ? ' ' + myData : '';
    myRightText = (typeof myRightText != 'undefined' && myRightText != '') ? '&nbsp;<span class="lzm-input-titleright">' + myRightText +'</span>' : '';
    myLeftText = (typeof myLeftText != 'undefined' && myLeftText != '') ? '<span class="lzm-input-titleleft">' + myLeftText +'</span>&nbsp;' : '';
    myClass = (myClass != '') ? myClass + ' lzm-input-container-' + myLayoutType : 'lzm-input-container-' + myLayoutType;
    var iconWidth = (myIcon != '') ? 10 : 0;
    var textLeft = (myLayoutType == 'a') ? ' style="left: ' + (iconWidth + 21) + 'px;right:0px;"' : '';
    var inputMarginTop = (myType == 'file') ? ' style="margin-top: 4px;padding-left:10px;"' : '';
    var redWidth = (myLeftText.length && myType != 'number') ? 'max-width:80%;' : '';
    var inputHtml = '';
    if(myLayoutType == '')
    {
        inputHtml = '<div class="' + myClass + '" id="' + myId + '-container">';
        if(myLabel.length)
            inputHtml += '<label for="' + myId + '" id="' + myId + '-label">' + myLabel + '</label>';
        inputHtml+= '<div class="lzm-input-'+myType+'" id="' + myId + '-text"' + textLeft + ' style="white-space:nowrap;'+redWidth+'">'+myLeftText+'<input type="' + myType + '" autocapitalize="off" autocorrect="off" autocomplete="new-password"'+myData+' id="' + myId + '" value="' + myText + '" ' + inputMarginTop + ' />'+myRightText+'</div></div>';
    }
    else
    {
        inputHtml = '<div class="' + myClass + '" id="' + myId + '-container">';
        if(myLabel.length)
            inputHtml += '<label for="' + myId + '" id="' + myId + '-label" class="lzm-label-' + myLayoutType + '">' + myLabel + '</label>';
        inputHtml += '<div class="lzm-input-icon-' + myLayoutType + '" id="' + myId + '-icon" style="width: ' + iconWidth + 'px;">' + myIcon + '</div>' +
            '<div class="lzm-input-text-' + myLayoutType + '" id="' + myId + '-text"' + textLeft + '>' +
            '<input type="' + myType + '" autocapitalize="off" autocorrect="off" autocomplete="new-password"'+myData+' id="' + myId + '" class="lzm-input-inner-' + myLayoutType + '" value="' + myText + '" "' + inputMarginTop + ' />' +
            '</div>' +
            '</div>';
    }
    return inputHtml
};

CommonInputControlsClass.prototype.createFileSelect = function(myId,myClass,myLabel){
    myClass = (myClass != '') ? ' ' + myClass : '';
    return '<label class="lzm-file-label'+myClass+'"><input id="' + myId + '" type="file" required/><span>' + myLabel + '</span></label>';
};

CommonInputControlsClass.prototype.createColor = function(myId, myClass, myText, myLabel, myIcon) {
    var myLayoutType = 'a';
    myClass = (myClass != '') ? myClass + ' lzm-input-container-a' : 'lzm-input-container-a';
    var iconWidth = 15;
    var textLeft = ' style="left: ' + (iconWidth + 20) + 'px;right:0px;"';
    var color = '';

    if(myText.length > 0 && lzm_commonTools.isHEXColor(myText))
        color = 'background:' + myText+ ';';

    var inputHtml = '<div class="' + myClass + ' lzm-input-color" id="' + myId + '-container">';

    if(myLabel.length)
        inputHtml += '<label for="' + myId + '" id="' + myId + '-label" class="lzm-label-color">' + myLabel + '</label>';

    inputHtml+=
        '<div class="lzm-input-icon-' + myLayoutType + '" id="' + myId + '-icon" style="'+color+'width: ' + iconWidth + 'px;">' + myIcon + '</div>' +
        '<div class="lzm-input-text-' + myLayoutType + '" id="' + myId + '-text"' + textLeft + '>' +
        '<input type="text" onchange="if(this.value.indexOf(\'#\')==-1)this.value=\'#\'+this.value;" autocapitalize="off" autocorrect="off" autocomplete="new-password" id="' + myId + '" class="lzm-input-inner-' + myLayoutType + '" value="' + myText + '" placeholder="' + myLabel + '" />' +
        '</div>' +
        '</div>';

    return inputHtml;
};

CommonInputControlsClass.prototype.createPosition = function(myId, value) {
    var inputHtml = '<table id="'+myId+'" class="lzm-position"><tr>' +
        '<td id="'+myId+'left top" class="'+myId+((value=='left top')? ' lzm-position-selected' : '')+' y0"><i class="fa fa-arrow-left"></i></td>' +
        '<td id="'+myId+'center top" class="'+myId+((value=='center top')? ' lzm-position-selected' : '')+' y0"><i class="fa fa-arrow-up"></i></td>' +
        '<td id="'+myId+'right top" class="'+myId+((value=='right top')? ' lzm-position-selected' : '')+' y0"><i class="fa fa-arrow-right"></i></td></tr><tr>' +
        '<td id="'+myId+'left middle" class="'+myId+((value=='left middle')? ' lzm-position-selected' : '')+' y1"><i class="fa fa-arrow-left"></i></td>' +
        '<td id="'+myId+'center middle" class="'+myId+((value=='center middle')? ' lzm-position-selected' : '')+' y1"><i class="fa fa-arrows"></i></td>' +
        '<td id="'+myId+'right middle" class="'+myId+((value=='right middle')? ' lzm-position-selected' : '')+' y1"><i class="fa fa-arrow-right"></i></td></tr><tr>' +
        '<td id="'+myId+'left bottom"  class="'+myId+((value=='left bottom')? ' lzm-position-selected' : '')+' y2"><i class="fa fa-arrow-left"></i></td>' +
        '<td id="'+myId+'center bottom" class="'+myId+((value=='center bottom')? ' lzm-position-selected' : '')+' y2"><i class="fa fa-arrow-down"></i></td>' +
        '<td id="'+myId+'right bottom" class="'+myId+((value=='right bottom')? ' lzm-position-selected' : '')+' y2"><i class="fa fa-arrow-right"></i></td></tr></table>';
    return inputHtml;
}

CommonInputControlsClass.prototype.createSelect = function(myId, myClass, myAction, myText, myIcon, myCss, myTitle, myOptionList, mySelectedOption, myLayoutType, data, mySize, myLeftText) {
    myLayoutType = (typeof myLayoutType != 'undefined') ? myLayoutType : 'a';
    myId = (typeof myId != 'undefined' && myId != '') ? myId : md5('' + Math.random());

    var mySelectId = (typeof myId != 'undefined' && myId != '') ? ' id="' + myId + '"' : '';
    var myOuterId = (typeof myId != 'undefined' && myId != '') ? ' id="' + myId + '-outer"' : '';

    myClass = (typeof myClass != 'undefined' && myClass != '') ? ' class="lzm-select- '+ myClass + '"' : ' class="lzm-select-' + myLayoutType + '"';
    myCss = (typeof myCss != 'undefined') ? myCss : {};
    myText = (typeof myText != 'undefined') ? myText : true;
    myLeftText = (typeof myLeftText != 'undefined' && myLeftText != '') ? '<span class="lzm-input-titleleft">' + myLeftText +'</span>&nbsp;' : '';

    var sizeAttr = (typeof mySize != 'undefined' && mySize != null) ? ' size="'+mySize+'"' : '';
    var label = (typeof myText != 'undefined' && myText != '') ? '<label for="'+myId+'">'+myText+'</label>' : '';

    myOptionList = (typeof myOptionList != 'undefined') ? myOptionList : [];
    mySelectedOption = (typeof mySelectedOption != 'undefined') ? mySelectedOption : 0;

    var mySelectedOptionIndex, i;

    for (i=0; i<myOptionList.length; i++)
    {
        if ((typeof myOptionList[i].value != 'undefined' && myOptionList[i].value == mySelectedOption) || myOptionList[i].text == mySelectedOption)
        {
            mySelectedOptionIndex = i;
        }
    }

    var selectCss = ' style=\'';
    for (var cssTag in myCss)
    {
        if (myCss.hasOwnProperty(cssTag))
        {
            selectCss += ' ' + cssTag + ': ' + myCss[cssTag] + ';';
        }
    }

    if(d(mySize) && !isNaN(mySize) && mySize > 0)
        selectCss += 'height:' + (19+(mySize*19)) + 'px;';

    selectCss += '\'';

    var selectData = '';
    if (typeof data != 'undefined' && data != null)
        for (var dataTag in data)
            if (data.hasOwnProperty(dataTag))
                selectData += ' data-' + dataTag + '=' + data[dataTag];

    var selectHtml = '<div' + myOuterId + myClass + '>'+label+myLeftText+'<select' + mySelectId + selectData + sizeAttr + selectCss + '>';

    for (i=0; i<myOptionList.length; i++)
    {
        var selectValue = (typeof myOptionList[i].value != 'undefined') ? myOptionList[i].value : myOptionList[i].text;
        var selectedString = (i == mySelectedOptionIndex) ? ' selected="selected"' : '';
        selectHtml += '<option' + selectedString + ' value="' + selectValue + '">' + myOptionList[i].text + '</option>';
    }
    selectHtml += '</select></div>';

    return selectHtml;
};

CommonInputControlsClass.prototype.createSelectChangeHandler = function(myId, myOptions) {
    $('#' + myId).change(function() {
        for (var i=0; i<myOptions.length; i++) {
            if (myOptions[i].value == $('#' + myId).val()) {
                if (typeof myOptions[i].icon != 'undefined') {
                    $('#' + myId + '-inner-icon').css({'background-image': 'url("' + myOptions[i].icon + '")'});
                }
                $('#' + myId + '-inner-text').html(myOptions[i].text);
            }
        }
    });
};

CommonInputControlsClass.prototype.createRadio = function(myId, myClass, myName, myLabel, isChecked, myValue) {
    var check = (isChecked) ? ' checked': '';
    myClass = (typeof myClass != 'undefined') ? ' class="' + myClass + '"' : '';
    myValue = (typeof myValue != 'undefined') ? ' value="' + myValue + '"' : '';
    return '<div'+myClass+'><input type="radio" class="radio-custom '+myName+'" name="'+myName+'" id="'+myId+'" '+check+myValue+'><label class="radio-custom-label '+myName+'" for="'+myId+'">'+myLabel+'</label></div>';
};

CommonInputControlsClass.prototype.createCheckbox = function(myId, myLabel, myValue, myClass, divCss) {
    var check = (myValue) ? ' checked': '';
    slider = (typeof slider != 'undefined') ? slider : false;
    myClass = (typeof myClass != 'undefined') ? myClass : '';
    divCss = (d(divCss) && divCss != '') ? ' style="'+divCss+'"' : '';
    return '<div'+divCss+'><input type="checkbox" class="checkbox-custom '+myClass+'" id="'+myId+'" '+check+'>' +
        '<label class="checkbox-custom-label '+myClass+'" for="'+myId+'">'+myLabel+'</label></div>';
};

CommonInputControlsClass.prototype.createImageBox = function(myId) {
    return '<div class="lzm-image-box"><div id="'+myId+'-img"></div></div>';
};

CommonInputControlsClass.prototype.createButton = function(myId, myClass, myAction, myText, myIcon, myType, myCss, myTitle, myTextLength, myLayoutType, textWidth) {

    var myTextId = (typeof myId != 'undefined' && myId != '') ? myId : '';
    myId = (typeof myId != 'undefined' && myId != '') ? ' id="' + myId + '"' : '';
    myClass = (typeof myClass != 'undefined') ? myClass : '';
    myAction = (typeof myAction != 'undefined' && myAction != '') ? ' onclick="' + myAction + '"' : '';
    myText = (typeof myText != 'undefined') ? myText : '';
    myIcon = (typeof myIcon != 'undefined') ? myIcon : '';
    myType = (typeof myType != 'undefined') ? myType : '';
    myCss = (typeof myCss != 'undefined') ? myCss : {};
    textWidth = (d(textWidth)) ? textWidth : 500;
    myTitle = (typeof myTitle != 'undefined') ? ' title="' + myTitle + '"' : '';
    myTextLength = (typeof myTextLength != 'undefined') ? myTextLength : 30;

    if(typeof IFManager != 'undefined' && (IFManager.IsMobileOS || IFManager.IsTabletOS))
        if (myTextLength > 4)
        {
            myText = (myText.length > myTextLength) ? myText.substr(0, myTextLength - 3) + '...' : myText;
        }

    myLayoutType = (typeof myLayoutType != 'undefined' && myLayoutType != '') ? myLayoutType : 'b';

    var showNoText = ($(window).width() < textWidth && myType != "force-text");
    var buttonCss = ' style="%LEFTPADDING%%RIGHTPADDING%';
    for (var cssTag in myCss) {
        if (myCss.hasOwnProperty(cssTag)) {
            var myCssTag = '';
            if ((cssTag == 'padding-left' || cssTag == 'padding-right' ) && myText != '' && showNoText)
                myCssTag = (parseInt(myCss[cssTag]) + 0)+'px';
            else
                myCssTag = myCss[cssTag];

            buttonCss += ' ' + cssTag + ': ' + myCssTag + ';';
        }
    }
    buttonCss += '"';
    switch (myType)
    {
        case 'l':
            myClass = myClass + ' lzm-button-' + myLayoutType + ' lzm-button-left-' + myLayoutType;
            break;
        case 'r':
            myClass = myClass + ' lzm-button-' + myLayoutType + ' lzm-button-right-' + myLayoutType;
            break;
        case 'm':
            myClass = myClass + ' lzm-button-' + myLayoutType + '';
            break;
        default:
            myClass = myClass + ' lzm-button-' + myLayoutType + ' lzm-button-left-' + myLayoutType + ' lzm-button-right-' + myLayoutType;
            break;
    }
    myClass += ' lzm-unselectable';
    myClass = (myClass.replace(/^ */, '') != '') ? ' class="' + myClass.replace(/^ */, '') + '"' : '';
    var iconPadding = '', buttonTextCss = '';
    if (myIcon != '' && (myText == '' || showNoText)) {
        var padLeft = (typeof myCss['padding-left'] == 'undefined' && typeof myCss['padding'] == 'undefined') ? ' padding-left: 12px;' : '';
        var padRight = (typeof myCss['padding-right'] == 'undefined' && typeof myCss['padding'] == 'undefined') ? ' padding-right: 12px;' : '';
        buttonCss = buttonCss.replace(/%LEFTPADDING%/g,padLeft).replace(/%RIGHTPADDING%/g,padRight);
        buttonTextCss = ' display: none;';
    } else if (myIcon != '' && (myText != '' && !showNoText)) {
        buttonCss = buttonCss.replace(/%LEFTPADDING%/g,'').replace(/%RIGHTPADDING%/g,'');
        buttonTextCss = 'display: inline; padding-left: 5px;';
    } else {
        buttonCss = buttonCss.replace(/%LEFTPADDING%/g,'').replace(/%RIGHTPADDING%/g,'');
        buttonTextCss = 'display: inline;';
    }
    var buttonHtml = '<span' + buttonCss + myId + myClass + myTitle + myAction + '>' + myIcon + '<span id="' + myTextId + '-text" style="' + buttonTextCss + '">' + myText + '</span>' + '</span>';

    return buttonHtml
};

CommonInputControlsClass.prototype.createArea = function(myId, myText, myClass, myLabel, myCSS, myAttributes) {
    var areaHtml = '';
    myCSS = (d(myCSS)) ? myCSS : '';
    myAttributes = (typeof myAttributes != 'undefined') ? myAttributes+' ' : '';

    if(typeof myLabel != 'undefined' && myLabel.length)
        areaHtml += '<label>'+myLabel+'</label>';

    return areaHtml + '<textarea id="'+myId+'" class="'+myClass+'" '+myAttributes+'style="'+myCSS+'">'+myText+'</textarea>';
};

CommonInputControlsClass.prototype.createPriorityList = function(id,cssClass,value,max,label) {
    var priorityList = [], lhtml ='';
    for(var i=1;i<max+1;i++)
        priorityList.push({text:i,value:i});

    if(d(label) && label.length)
        lhtml += '<label for="' + id + '" id="' + id + '-label">' + label + '</label>';

    return lhtml + this.createSelect(id,cssClass,'','','','','',priorityList,value,'');
};

CommonInputControlsClass.prototype.CreateOperatorList = function(tableid,groups,priorities,checkList,_bots) {

    groups = (d(groups)) ? groups : true;
    priorities = (d(priorities)) ? priorities : true;
    checkList = (d(checkList)) ? checkList : null;
    _bots = (d(_bots)) ? _bots : false;

    var olHtml = '<table id="'+tableid+'" class="visible-list-table alternating-rows-table lzm-unselectable"><thead><tr><th style="width:16px;"></th><th>'+tid('operator')+'</th>';

    if(groups)
        olHtml += '<th>'+tid('group')+'</th>';

    if(priorities)
        olHtml += '<th>'+tid('priority')+'</th></tr>';

    olHtml += '</thead><tbody>';

    var operators = DataEngine.operators.getOperatorList('','',true,_bots);

    for(var key in operators)
    {
        var op = operators[key];
        var groupList = [];
        for(var i in op.groups)
        {
            var groupObj = DataEngine.groups.getGroup(op.groups[i]);
            if(groupObj != null && groupObj.external == 1)
                groupList.push({text:op.groups[i],value:op.groups[i]});
        }

        var checkit = false;
        if(checkList != null)
            for(var rkey in checkList)
                if(checkList[rkey].rec == op.id)
                    checkit = true;

        olHtml += '<tr id="'+tableid+'-'+op.id+'" data-obj="'+lz_global_base64_encode(JSON.stringify(op))+'"><td>' + this.createCheckbox(tableid + '-cb-' + op.id,'',checkit,tableid + '-cb' + ((groupList.length || !groups) ? '' : ' ui-disabled'),'') + '</td>';
        olHtml += '<td>' + lzm_commonTools.SubStr(op.userid,20,true) + '</td>';

        if(groups && groupList.length)
            olHtml += '<td>' + this.createSelect(tableid + '-groups-' + op.id,'','','','','','',groupList,0,'') + '</td>';
        else if(groups)
            olHtml+='<td class="text-center"><i>'+tid('none')+'</i></td>';

        if(priorities)
            olHtml += '<td>' + this.createPriorityList(tableid + '-priority-' + op.id,((groupList.length) ? '' : 'ui-disabled'),1,10) + '</td>';

        olHtml += '</tr>';
    }
    return olHtml + '</tbody></table>';
};

CommonInputControlsClass.prototype.createTabControl = function(replaceElement, tabList, selectedTab, placeHolderWidth, layoutType) {
    var displayType = 'inline-block';
    var mySelectedTab = (typeof selectedTab != 'undefined' && selectedTab > -1 && selectedTab < tabList.length) ? Math.max(selectedTab, 0) : 0;

    selectedTab = (typeof selectedTab != 'undefined') ? selectedTab : 0;

    var allTabsWidth = 0, closedTabColor = '#E0E0E0';

    $('body').append('<div id="test-tab-width-container" style="position: absolute; left: -1000px; top: -1000px; width: 800px; height: 100px;"></div>').trigger('create');

    var tabRowHtml = '';
    var tabRowArray = [];
    var contentRowHtml = '';
    var tabsAreTooWide = false, tabsAreStillTooWide = false;
    var thisTabHtml = '', thisTabWidth = [], firstVisibleTab, lastVisibleTab = 0;
    var leftTabHtml = '<span class="lzm-tabs" id="' + replaceElement + '-tab-more-left" draggable="true" style="background-color: ' + closedTabColor + '; display: none; text-shadow: none;"> <i class="fa fa-angle-double-left"></i> </span>';
    var rightTabHtml = '<span class="lzm-tabs" id="' + replaceElement + '-tab-more-right" draggable="true" style="background-color: ' + closedTabColor + '; display: '+displayType+'; text-shadow: none;"> <i class="fa fa-angle-double-right"></i> </span>';

    $('#test-tab-width-container').html(rightTabHtml).trigger('create');
    $('#test-tab-width-container').html(leftTabHtml).trigger('create');

    for (var i=0; i<tabList.length; i++)
    {
        var dataHash = (typeof tabList[i].hash != 'undefined') ? ' data-hash="' + tabList[i].hash + '"' : '';
        var tabName = (tabList[i].name.length <= 40) ? tabList[i].name : tabList[i].name.substr(0, 40) + '...';
        var classSelected = (i == mySelectedTab) ? ' lzm-tabs-selected' : '';
        var subclass = (layoutType == 'sub') ? 'lzm-tabs-sub ' : '';


        thisTabHtml = '<span class="lzm-tabs ' + subclass + replaceElement + '-tab' + classSelected + '" id="' + replaceElement + '-tab-' + i + '" draggable="true" style="display: %DISPLAY%;" data-tab-no="' + i + '"' + dataHash + '>' + tabName + '</span>';
        $('#test-tab-width-container').html(thisTabHtml).trigger('create');
        thisTabWidth[i] = $('#' + replaceElement + '-tab-' + i).width() + 22;

        if (tabsAreTooWide)
        {
            thisTabHtml = thisTabHtml.replace(/%DISPLAY%/, 'none');
            if (tabsAreStillTooWide)
            {
                var lastTabNo = tabRowArray.length -1;
                if(d(tabRowArray[lastTabNo]))
                    tabRowArray[lastTabNo] = tabRowArray[lastTabNo].replace(displayType, 'none');
            }
        }
        else
        {
            thisTabHtml = thisTabHtml.replace(/%DISPLAY%/, displayType);
            allTabsWidth += thisTabWidth[i];
            lastVisibleTab = i;
        }

        tabRowArray.push(thisTabHtml);
        tabRowHtml += thisTabHtml;

        var displayString = (i == mySelectedTab) ? 'block' : 'none';
        contentRowHtml += '<div class="' + replaceElement + '-content" id="' + replaceElement + '-content-' + i + '" style="display: ' + displayString + '; overflow: auto;"' + dataHash + '>' +
            tabList[i].content +
            '</div>';

    }

    tabRowHtml = tabRowArray.join('');
    if(tabsAreTooWide) {
        tabRowHtml = leftTabHtml + tabRowHtml + rightTabHtml;
    }

    if (tabsAreStillTooWide)
        lastVisibleTab -= 1;

    var tabString = '<div id="' + replaceElement + '-tabs-row" data-selected-tab="' + selectedTab + '">' + tabRowHtml + '</div>' + contentRowHtml;

    $('#test-tab-width-container').remove();
    $('#' + replaceElement).html(tabString).trigger('create');

    this.addTabControlEventHandler(replaceElement, tabList);

    var moveRightCounter = Math.max(Math.min(selectedTab - lastVisibleTab, 10), 0);
    for (var j=0; j<moveRightCounter; j++) {
        $('#' + replaceElement + '-tab-more-right').click();
    }
    $('#' + replaceElement + '-tabs-row').attr('class', 'lzm-tabs-row');

    if(layoutType == 'sub')
        $('#' + replaceElement + '-tabs-row').addClass('lzm-tabs-row-sub');
};

CommonInputControlsClass.prototype.updateTabControl = function(replaceElement, oldTabList, layoutType) {
    var displayType = 'inline-block';
    var selectedTab = $('#' + replaceElement + '-tabs-row').data('selected-tab');
    selectedTab = (typeof selectedTab != 'undefined') ? selectedTab : 0;
    layoutType = (typeof layoutType != 'undefined') ? layoutType : 'a';

    console.log(layoutType);

    var i = 0, j = 0, existingTabsArray = [], existingTabsHashArray = [], newTabList = [], lzTabDoesExist = false;
    $('.' + replaceElement + '-tab').each(function() {
        var thisTabHash = $(this).data('hash'), thisTabNo = $(this).data('tab-no'), thisTabHtml = $(this).html();
        existingTabsArray.push({'tab-no': thisTabNo, hash: thisTabHash, html: thisTabHtml});
        existingTabsHashArray.push(thisTabHash);
        if (thisTabHash == 'lz') {
            lzTabDoesExist = true;
        }
    });
    for (i=0; i<oldTabList.length; i++) {
        if (oldTabList[i].action == 1 && oldTabList[i].hash == 'lz' && $.inArray(oldTabList[i].hash, existingTabsHashArray) == -1) {
            newTabList.push({name: oldTabList[i].name, hash: oldTabList[i].hash, content: oldTabList[i].content});
            selectedTab += 1;
        }
    }
    for (i=0; i<existingTabsArray.length; i++) {
        var tabWasRemoved = false;
        for (j=0; j<oldTabList.length; j++) {
            if (existingTabsArray[i].hash == oldTabList[j].hash && oldTabList[j].action == 0) {
                tabWasRemoved = true;
                selectedTab = (selectedTab < i) ? selectedTab : (selectedTab > i) ? selectedTab - 1 : 0;
            }
        }
        if (!tabWasRemoved) {
            newTabList.push({name: existingTabsArray[i].html, hash: existingTabsArray[i].hash, content: null});
        }
    }
    for (i=0; i<oldTabList.length; i++) {
        if (oldTabList[i].action == 1 && oldTabList[i].hash != 'lz' && $.inArray(oldTabList[i].hash, existingTabsHashArray) == -1) {
            newTabList.push({name: oldTabList[i].name, hash: oldTabList[i].hash, content: oldTabList[i].content});
        }
    }

    var mySelectedTab = Math.max(selectedTab, 0);
    $('body').append('<div id="test-tab-width-container" style="position: absolute; left: -2000px; top: -2000px; width: 1800px; height: 100px;"></div>').trigger('create');
    var placeHolderWidth = $('#' + replaceElement).parent().width();
    var thisTabHtml = '', tabsAreTooWide = false, allTabsWidth = 0, lastVisibleTab = 0, tabRowHtml = '', thisTabWidth = [], firstVisibleTab = 0, visibleTabsWidth = 0, closedTabColor = '#E0E0E0';
    var leftTabHtml = '<span class="lzm-tabs" id="' + replaceElement + '-tab-more-left" draggable="true" style="background-color: ' + closedTabColor + '; display: none; text-shadow: none;"> ... </span>';
    var rightTabHtml = '<span class="lzm-tabs" id="' + replaceElement + '-tab-more-right" draggable="true" style="background-color: ' + closedTabColor + '; display: '+displayType+'; text-shadow: none;"> ... </span>';

    $('#test-tab-width-container').html(leftTabHtml.replace(/-tab-more-left/, '-test-tab-more-left')).trigger('create');
    var leftTabWidth = $('#' + replaceElement + '-test-tab-more-left').width() + 22;
    $('#test-tab-width-container').html(rightTabHtml.replace(/-tab-more-left/, '-test-tab-more-left')).trigger('create');
    var rightTabWidth = $('#' + replaceElement + '-test-tab-more-right').width() + 22;
    for (i=0; i<newTabList.length; i++) {
        var tabName = (newTabList[i].name.length <= 40) ? newTabList[i].name : newTabList[i].name.substr(0, 40) + '...';
        var classSelected = (i == mySelectedTab) ? ' lzm-tabs-selected' : '';
        thisTabHtml = '<span class="lzm-tabs ' + replaceElement + '-tab'+classSelected+'" id="' + replaceElement + '-tab-' + i + '" draggable="true" style="display: %DISPLAY%;" data-tab-no="' + i + '" data-hash="' + newTabList[i].hash + '">' + tabName + '</span>';
        $('#test-tab-width-container').html(thisTabHtml).trigger('create');
        thisTabWidth[i] = $('#' + replaceElement + '-tab-' + i).width() + 22;
        if (allTabsWidth + thisTabWidth[i] > placeHolderWidth) {
            tabsAreTooWide = true;
        }
        if (tabsAreTooWide) {
            thisTabHtml = thisTabHtml.replace(/%DISPLAY%/, 'none');
        } else {
            thisTabHtml = thisTabHtml.replace(/%DISPLAY%/, displayType);
            allTabsWidth += thisTabWidth[i];
            lastVisibleTab = i;
        }
        tabRowHtml += thisTabHtml;
    }
    $('#test-tab-width-container').remove();


    if(tabsAreTooWide) {
        tabRowHtml = leftTabHtml + tabRowHtml + rightTabHtml;
    }
    $('#' + replaceElement + '-tabs-row').html(tabRowHtml).trigger('create');
    //$('#' + replaceElement + '-tabs-row').attr('class', 'lzm-tabs-row');
    $('.' + replaceElement + '-content').css('display', 'none');
    for (i=0; i<existingTabsArray.length; i++) {
        $('#' + replaceElement + '-content-' + existingTabsArray[i]['tab-no']).attr('id', replaceElement + '-content-' + existingTabsArray[i].hash);
    }
    var lastVisibleElement = replaceElement + '-tabs-row';
    for (i=0; i<newTabList.length; i++) {
        if (newTabList[i].content == null) {
            $('#' + replaceElement + '-content-' + newTabList[i].hash).attr('id', replaceElement + '-content-' + i);
            lastVisibleElement = replaceElement + '-content-' + i;
        } else {
            $('#' + lastVisibleElement).after('<div class="' + replaceElement + '-content" id="' + replaceElement + '-content-' + i + '" style="border: 1px solid #ccc;' +
                ' border-bottom-left-radius: 4px; border-bottom-right-radius: 4px; border-top-right-radius: 4px;' +
                ' padding: 8px; margin-top: 2px; display: none; overflow: auto;" data-hash="' + newTabList[i].hash + '"></div>');
            lastVisibleElement = replaceElement + '-content-' + i;
            $('#' + lastVisibleElement).html(newTabList[i].content).css('display', 'none');
        }
    }
    $('#' + replaceElement + '-content-' + mySelectedTab).css('display', 'block');
    $('#' + replaceElement + '-tabs-row').data('selected-tab', selectedTab);

    this.addTabControlEventHandler(replaceElement, newTabList, firstVisibleTab, lastVisibleTab, thisTabWidth, leftTabWidth,
        rightTabWidth, visibleTabsWidth, placeHolderWidth, closedTabColor, layoutType);
};

CommonInputControlsClass.prototype.addTabControlEventHandler = function(replaceElement, tabList) {

    var i,displayType = 'inline-block';
    for (i=0; i<tabList.length; i++)
    {
        $('#' + replaceElement + '-tab-' + i).click(function()
        {
            $('.' + replaceElement + '-content').css({display: 'none'});
            $('.' + replaceElement + '-tab').removeClass('lzm-tabs-selected');

            var tabNo = parseInt($(this).data('tab-no'));

            $('#' + replaceElement + '-tabs-row').data('selected-tab', tabNo);
            $('#' + replaceElement + '-content-' + tabNo).css({display: 'block'});
            $('#' + replaceElement + '-tab-' + tabNo).addClass('lzm-tabs-selected');

            if($('#' + replaceElement + '-tab-' + (tabNo+1)).length && $('#' + replaceElement + '-tab-' + (tabNo+1)).css('display')=='none' && $('#' + replaceElement + '-tab-more-right').css('display') == displayType)
                $('#' + replaceElement + '-tab-more-right').click();
            else if($('#' + replaceElement + '-tab-' + (tabNo-1)).length && $('#' + replaceElement + '-tab-' + (tabNo-1)).css('display')=='none' && $('#' + replaceElement + '-tab-more-left').css('display') == displayType)
                $('#' + replaceElement + '-tab-more-left').click();
        });
    }
};

CommonInputControlsClass.prototype.CreateInputControlPanel = function(_mode,_disabledClass,_fontStyles,_placeHolders,_customButtons) {

    _disabledClass = d(_disabledClass) ? _disabledClass : '';
    _fontStyles = d(_fontStyles) ? _fontStyles : false;
    _placeHolders = d(_placeHolders) ? _placeHolders : true;

    var isMobile = (IFManager.IsAppFrame || IFManager.IsMobileOS) && !IFManager.IsDesktopApp();

    var panelHtml = '';
    if (_mode != 'plain')
        if(!isMobile || _fontStyles)
        {
            panelHtml += lzm_inputControls.createButton('editor-bold-btn', _disabledClass, 'lzm_chatInputEditor.bold();', '<span style="font-weight: bold;">B</span>', '', 'lr',{'margin-left': '2px', 'padding-left': '12px', 'padding-right': '12px'}, '', -1,'e') +
                lzm_inputControls.createButton('editor-italic-btn', _disabledClass, 'lzm_chatInputEditor.italic();', '<span style="font-style: italic;">I</span>', '', 'lr', {'margin-left': '-1px', 'padding-left': '12px', 'padding-right': '12px'}, '', -1,'e') +
                lzm_inputControls.createButton('editor-underline-btn', _disabledClass, 'lzm_chatInputEditor.underline();', '<span style="text-decoration: underline;">U</span>', '', 'lr',{'margin-left': '-1px', 'padding-left': '12px', 'padding-right': '12px'}, '', -1,'e');
        }

    if (_mode == 'basic')
    {
        panelHtml += lzm_inputControls.createButton('editor-html-btn', '', 'lzm_chatInputEditor.showHTML();', 'HTML', '', 'lr',{'margin-left': '4px', 'padding-left': '12px', 'padding-right': '12px'}, '', -1,'e');
        panelHtml += lzm_inputControls.createButton('editor-add-image-btn', '', 'lzm_chatInputEditor.addImage();', tid('image'), '<i class="fa fa-image"></i>', 'lr',{'margin-left': '-1px', 'padding-left': '12px', 'padding-right': '12px'}, '', -1,'e');
        panelHtml += lzm_inputControls.createButton('editor-add-link-btn', '', 'lzm_chatInputEditor.addLink();', tid('link'), '<i class="fa fa-link"></i>', 'lr',{'margin-left': '-1px', 'padding-left': '12px', 'padding-right': '12px'}, '', -1,'e');

        if(_placeHolders)
            panelHtml += lzm_inputControls.createButton('editor-add-placeholder-btn', '', 'lzm_chatInputEditor.addPlaceholder();', tid('add_placeholder'), '<i class="fa fa-percent"></i>', 'lr',{'margin-left': '-1px', 'padding-left': '12px', 'padding-right': '12px'}, '', -1,'e');
    }

    if (_mode != 'basic' && _mode != 'plain' && !isMobile)
        panelHtml += lzm_inputControls.createButton('send-qrd', _disabledClass, 'KnowledgebaseUI.InsertIntoChat();', '', '<i class="fa fa-database"></i>', 'lr',{'margin-left': '4px'}, tid('knowledgebase'),-1,'e');

    if(_customButtons)
        panelHtml += _customButtons;

    return panelHtml;
};

CommonInputControlsClass.prototype.createInfoField = function(icon, text, myClass) {
    myClass = (d(myClass)) ? ' ' + myClass : '';
    return '<div class="lzm-info-field'+myClass+'"><div class="lzm-info-field-inner"><i class="'+icon+'"></i></div><div class="lzm-info-field-inner"><span>' + text + '</span></div></div>';


};

CommonInputControlsClass.prototype.createAvatarField = function(myClass, name, intid){
    if(!LocalConfiguration.UIShowAvatars)
        return '';
    var url = getAvatarURL(name, intid);
    myClass = (d(myClass)) ? ' ' + myClass : '';
    return '<div class="avatar-box'+myClass+'" style="background-image: url(\'' + url + '\')"></div>';
};

function getAvatarURL(name, intid){
    var getParam = '?' + ((d(intid) && intid.length > 0) ? 'operator=' + encodeURIComponent(intid) : (d(name) && name.length > 0) ? 'name=' + lz_global_base64_url_encode(name) : '');
    return './../picture.php' + getParam;
}

CommonInputControlsClass.prototype.createSlider = function(_id){

};



CommonInputControlsClass.TagEditor = function(_id,_tagList,_allowAdd,_allowSelect,_allowRemove,_allowSearch, _dialogEditor, _singleSelect){

    _singleSelect = d(_singleSelect) ? _singleSelect : null;

    this.Id = _id;
    this.TagList = [];
    this.SelectedList = [];
    this.NewList = [];
    this.CountList = null;

    this.AddTags(_tagList, false);

    this.AllowAddTags = _allowAdd;
    this.AllowRemoveTags = _allowRemove;
    this.AllowSelectTags = _allowSelect;
    this.AllowSearch = _allowSearch;

    this.DialogEditor = _dialogEditor;
    this.DialogEditorOK = null;
    this.DialogEditorActive = false;
    this.DialogTitle = '';
    this.SingleSelect = _singleSelect;

    this.OnChange = null;

    this.Base = window;
    this.BaseName = 'window';

    this.CustomButtons = '';

    this.PermissionsToAdd = null;
};

CommonInputControlsClass.TagEditor.prototype.AddTags = function(_tagList, _selected, _new){

    var toAdd = [];
    if (Array.isArray(_tagList))
        toAdd = _tagList;
    else if (typeof _tagList === 'string' || _tagList instanceof String)
    {
        if(_tagList.length)
        {
            _tagList = _tagList.replace(/ /g,',');
            _tagList = _tagList.replace(/(?:\r\n|\r|\n)/g, ',');
            _tagList = _tagList.replace(/,,/g,',');
            _tagList = _tagList.replace(/,,/g,',');
        }

        if(_tagList.indexOf(',') != -1)
            toAdd = _tagList.split(',');
        else if(_tagList.length)
            toAdd = [_tagList];
    }

    var toAddClean = [];

    for(var key in toAdd)
    {
        if(toAdd[key].length)
            toAddClean.push(toAdd[key]);
    }

    toAdd = toAddClean;

    this.TagList = this.TagList.concat(toAdd);
    this.TagList = lzm_commonTools.ArrayUnique(this.TagList);
    this.TagList.sort();

    if(_selected)
    {
        this.SelectedList = this.SelectedList.concat(toAdd);
        this.SelectedList = lzm_commonTools.ArrayUnique(this.SelectedList);
        this.SelectedList.sort();
    }

    if(_new)
    {
        this.NewList = this.NewList.concat(toAdd);
        this.NewList = lzm_commonTools.ArrayUnique(this.NewList);
        this.NewList.sort();
    }
};

CommonInputControlsClass.TagEditor.prototype.SetCounts = function(_countList){

    this.CountList = _countList;

};

CommonInputControlsClass.TagEditor.prototype.Clear = function(){
    this.TagList = [];
    this.SelectedList = [];
    this.UpdateHTML();
};

CommonInputControlsClass.TagEditor.prototype.Remove = function(_tagId){

    if(!this.AllowRemoveTags)
        return;

    var tagElem = $('#' + _tagId);

    if(tagElem.hasClass('tag-available'))
    {
        var index = this.TagList.indexOf(lz_global_base64_decode(tagElem.data('value')));

        if (index > -1)
            this.TagList.splice(index, 1);

        this.UpdateHTML();
    }
    else
    {
        tagElem.removeClass('tag-selected');
        tagElem.addClass('tag-available');
    }
};

CommonInputControlsClass.TagEditor.prototype.Select = function(_tagId){

    if(!this.AllowSelectTags)
        return;

    if(this.DialogEditor && !this.DialogEditorActive)
    {
        this.Base.CommonInputControlsClass.TagEditor.ShowDialog(this.Id);
        return;
    }



    var index,tagElem = $('#' + _tagId, this.Base.document);

    if(tagElem.hasClass('tag-available'))
    {
        tagElem.addClass('tag-selected');
        tagElem.removeClass('tag-available');

        index = this.SelectedList.indexOf(lz_global_base64_decode(tagElem.data('value')));

        if(this.NewList.indexOf(lz_global_base64_decode(tagElem.data('value'))) != -1)
            tagElem.addClass('tag-new');

        if (index == -1)
        {
            if(this.SingleSelect != null)
                this.SelectedList = [];

            this.SelectedList.push(lz_global_base64_decode(tagElem.data('value')));
        }
    }
    else
    {
        tagElem.removeClass('tag-new');
        tagElem.removeClass('tag-selected');
        tagElem.addClass('tag-available');

        index = this.SelectedList.indexOf(lz_global_base64_decode(tagElem.data('value')));

        if (index != -1)
            this.SelectedList.splice(index, 1);
    }
    this.SelectedList.sort();
    this.UpdateHTML();

    if(this.OnChange != null)
        this.OnChange();
};

CommonInputControlsClass.TagEditor.prototype.Add = function(){

    if(this.Id != 'gl_tags')
        if(this.PermissionsToAdd != null && this.Base.PermissionEngine.permissions[this.PermissionsToAdd] != 1)
        {
            this.Base.showNoPermissionMessage();
            return;
        }

    var that = this;

    if(this.AllowAddTags)
    {
        this.AddTags($('#'+this.Id+'-search-field', this.Base.document).val(),that.AllowSelectTags,true);
        $('#'+this.Id+'-search-field', this.Base.document).val('');
    }

    this.TagList.sort();
    this.UpdateHTML();


};

CommonInputControlsClass.TagEditor.prototype.GetTagHTML = function(_text, _selected, _new, _count){

    var html,id = md5(this.Id+_text);
    var tclass = (!_selected) ? 'tag-available' : 'tag-selected';

    if(_new && _selected)
        tclass += ' tag-new';

    if(this.AllowRemoveTags)
        tclass += ' tag-removable';

    if(this.AllowSelectTags)
        tclass += ' lzm-clickable2';

    html = '<div class="'+tclass+' lzm-unselectable" data-value="'+lz_global_base64_encode(_text.toString())+'" id="'+id+'" onclick="'+this.BaseName+'[\''+this.Id+'\'].Select(\''+id+'\')">' + lzm_commonTools.htmlEntities(_text);

    if(d(_count) && _count != null)
        html += ' (' + this.GetCount(_text) + ')';

    if(this.AllowRemoveTags)
        html += '<i class="fa fa-remove tag-remove" onclick="window[\''+this.Id+'\'].Remove(\''+id+'\')"></i>';

    html += '</div>';

    return html;
};

CommonInputControlsClass.TagEditor.prototype.GetCount = function(_tagText){

    for(var key in this.CountList)
    {
        if(this.CountList[key][0] == _tagText)
            return this.CountList[key][1];
    }
    return null;
};

CommonInputControlsClass.TagEditor.prototype.GetListString = function(_selected){

    var string = '';
    var list = _selected ? this.SelectedList : this.TagList;

    for(var key in list)
    {
        if(string.length)
            string += ',';

        string += list[key];
    }

    return string;
};

CommonInputControlsClass.TagEditor.prototype.Search = function(){
    $('#'+this.Id+'-search-field', this.Base.document).val($('#'+this.Id+'-search-field', this.Base.document).val().replace(/ /g,''));
    this.UpdateHTML()
};

CommonInputControlsClass.TagEditor.prototype.GetHTML = function(_hspace, _maxRows){

    var html = '<div id="'+this.Id+'">';

    var hspaceClass = (_hspace) ? ' hspaced' : '';

    if(this.AllowSearch || this.DialogEditorActive)
    {
        var title = tid('search');

        if(this.AllowAddTags)
            title += ' / '+tid('add');

        html += '<div id="'+this.Id+'-search" class="tag-editor-search'+hspaceClass+'">';
        html += '<table><tr><td><i class="fa fa-search"></i></td><td><input type="text" class="input-embedded" id="'+this.Id+'-search-field" autocomplete="new-password" onkeyup="window[\''+this.Id+'\'].Search()" placeholder="'+title+'"></td>';
        html += '<td><i id="'+this.Id+'-add" onclick="window[\''+this.Id+'\'].Add()" class="fa fa-plus-circle icon-green icon-xl lzm-clickable2" style="display:none" onclick="window[\''+this.Id+'\'].Search();"></i></td>';
        html += '<td><i class="fa fa-remove lzm-clickable" onclick="document.getElementById(\''+this.Id+'-search-field\').value=\'\';window[\''+this.Id+'\'].Search();"></i></td></tr></table></div>';
    }

    var style = '';
    if(d(_maxRows) && _maxRows != null)
    {
        style = 'overflow:auto;height:' + (_maxRows * 42)+ 'px;';
    }

    if(this.DialogEditor && !this.DialogEditorActive)
    {
        style = 'padding-right: 40px';
        html += '<div class="tag-dialog-editor-button" onclick="'+this.BaseName.toString()+'.CommonInputControlsClass.TagEditor.ShowDialog(\''+this.Id+'\');"><i class="fa fa-pencil icon-large"></i></div>';
    }

    html += '<div id="'+this.Id+'-available" style="'+style+'" class="tag-editor-list'+hspaceClass+'">';
    html += this.GetTagsHTML();

    if(!this.TagList.length)
        html += '<div class="text-light"><i>'+tid('none')+'</i></div>';

    html += '</div>';

    if(!this.DialogEditor)
        if(this.AllowAddTags || this.AllowRemoveTags || this.CustomButtons.length)
        {
            html += '<div id="'+this.Id+'-buttons" class="tag-editor-buttons'+hspaceClass+' top-space">';

            if(this.CustomButtons.length)
                html += this.CustomButtons;

            if(this.AllowRemoveTags)
                html += lzm_inputControls.createButton(this.Id+'-button-clear', '','window[\''+this.Id+'\'].Clear()', tid('reset'), '', 'lr',{'margin-left': '4px'},'',30,'d');

            html += '</div>';
        }

    html += '</div>';

    return html;
};

CommonInputControlsClass.TagEditor.prototype.UpdateHTML = function(_ignoreBase){

    var tagsHTML = this.GetTagsHTML();

    if(!this.TagList.length)
        tagsHTML += '<div class="text-light"><i>'+tid('none')+'</i></div>';

    if(!_ignoreBase)
        $('#'+this.Id+'-available', this.Base.document).html(tagsHTML);
    else
        $('#'+this.Id+'-available').html(tagsHTML);
};

CommonInputControlsClass.TagEditor.prototype.GetTagsHTML = function(){

    var val,key,search='',isSelected,isNew,canAdd=true,tagsHTML = '',seltagsHTML = '',addButtonDisplay='none';

    if(this.AllowSearch || this.DialogEditorActive)
    {
        search = $('#'+this.Id+'-search-field', this.Base.document).val();

        if(!d(search))
            search = '';
    }

    for(key in this.TagList)
    {
        isSelected = this.SelectedList.indexOf(this.TagList[key]) != -1;
        isNew = this.NewList.indexOf(this.TagList[key]) != -1;

        val = this.TagList[key].toString();
        if(search.length)
        {
            if(val.toLowerCase().indexOf(search.toLowerCase()) == -1 && !isSelected)
                continue;

            if(val.toLowerCase() == search.toLowerCase())
                canAdd = false;
        }

        var count = null;
        if(this.CountList != null && d(this.CountList[key]))
            count = this.CountList[key];

        if(isSelected)
            seltagsHTML += this.GetTagHTML(val,true,isNew,count);
        else if(!this.DialogEditor || this.DialogEditorActive)
            tagsHTML += this.GetTagHTML(val,false,isNew,count);
    }

    if(search.length && canAdd && this.AllowAddTags)
        addButtonDisplay = 'inline';

    $('#' + this.Id+'-add', this.Base.document).css('display',addButtonDisplay);

    return seltagsHTML + tagsHTML;
};

CommonInputControlsClass.TagEditor.prototype.ShowDialog = function(){

    var ww = this.Base.lzm_chatDisplay.windowWidth;

    var maxw = Math.min(ww*0.8,100);
    var tagEditorHtml = '<fieldset class="lzm-fieldset" style="min-width:'+maxw+'px;min-height:500px;"><legend>' + this.DialogTitle + '</legend>' + this.GetHTML(false,null) + '</fieldset>';
    this.Base.lzm_commonDialog.createAlertDialog(tagEditorHtml, [{id: 'ok', name: tid('ok')}],true);

    if(!this.Base.IFManager.IsMobileOS)
        $('#'+this.Id+'-search-field', this.Base.document).focus();
};

CommonInputControlsClass.TagEditor.ShowDialog = function(_editorId){

    window[_editorId].DialogEditorActive = true;
    window[_editorId].ShowDialog();

    if(window[_editorId].DialogEditorOK == null)
        window[_editorId].DialogEditorOK = function(){
            window[_editorId].DialogEditorActive = false;
            window[_editorId].Base.lzm_commonDialog.removeAlertDialog();
            window[_editorId].UpdateHTML(true);
        };

    $('#alert-btn-ok').click(window[_editorId].DialogEditorOK);
};

CommonInputControlsClass.SearchBox = function(){
    var header = '<span class="lzm-dialog-hl2-info">'+tid('search')+'</span>';
    header += '<span class="right-button-list">';
    header += lzm_inputControls.createButton('main-search-close', '', 'CommonInputControlsClass.SearchBox.ToggleSearchDialog(true,true);','', '<i class="fa fa-close"></i>', 'lr',{}, '', -1,'e');
    header += '</span>';
    $('#main-search-headline').html(header);
};

CommonInputControlsClass.SearchBox.QueryList = {};
CommonInputControlsClass.SearchBox.LastQueryList = {};
CommonInputControlsClass.SearchBox.CurrentView = '';
CommonInputControlsClass.SearchBox.ShowTicket = false;
CommonInputControlsClass.SearchBox.ShowKB = false;
CommonInputControlsClass.SearchBox.ShowChatArchive = false;
CommonInputControlsClass.SearchBox.ShowInternal = false;
CommonInputControlsClass.SearchBox.SwitchWidth = 800;

CommonInputControlsClass.SearchBox.SetColor = function(){
    $('#main-search-frame').css('background',(CommonInputControlsClass.SearchBox.GetQuery().length) ? '#ffffe1' : '#fff');
};

CommonInputControlsClass.SearchBox.Change = function(_e){

    CommonInputControlsClass.SearchBox.SetColor();

    var keyCode = d(_e) ? ((d(_e.which)) ? _e.which : ((d(_e.keyCode)) ? _e.keyCode : -1)) : -1;

    if(!d(CommonInputControlsClass.SearchBox.QueryList[CommonInputControlsClass.SearchBox.CurrentView]))
        CommonInputControlsClass.SearchBox.QueryList[CommonInputControlsClass.SearchBox.CurrentView] = '';

    var val = $('#main-search-field').val();

    CommonInputControlsClass.SearchBox.QueryList[CommonInputControlsClass.SearchBox.CurrentView] = val;

    if(keyCode == 13)
        CommonInputControlsClass.SearchBox.Search();

};

CommonInputControlsClass.SearchBox.GetQuery = function(_fromUI){

    var view = CommonInputControlsClass.SearchBox.GetAreaIdentifier();

    if(d(CommonInputControlsClass.SearchBox.QueryList[view]))
        return CommonInputControlsClass.SearchBox.QueryList[view];
    else if(_fromUI)
        return $('#main-search-field').val();
    else
        return '';
};

CommonInputControlsClass.SearchBox.GetAreaIdentifier = function(){
    if(KnowledgebaseUI.SelectionMode)
        return 'sm_win_' + lzm_chatDisplay.selected_view;
    else if(TaskBarManager.IsActiveChatWindow())
        return 'win_' + lzm_chatDisplay.selected_view;
    else
        return lzm_chatDisplay.selected_view;
};

CommonInputControlsClass.SearchBox.SetQuery = function(_query){

    $('#main-search-field').val(_query);
    CommonInputControlsClass.SearchBox.SetColor();
};

CommonInputControlsClass.SearchBox.Focused = function(){

    return $('#main-search-field').is(":focus");

};

CommonInputControlsClass.SearchBox.IsActiveSearch = function(){

    var view = CommonInputControlsClass.SearchBox.GetAreaIdentifier();
    if(d(CommonInputControlsClass.SearchBox.LastQueryList[view]))
        if(CommonInputControlsClass.SearchBox.LastQueryList[view].length)
        {
            if(CommonInputControlsClass.SearchBox.LastQueryList[view] == 'tagsearch')
                return true;

            if(d(CommonInputControlsClass.SearchBox.QueryList[view]))
                if(CommonInputControlsClass.SearchBox.QueryList[view].length)
                    return true;
        }

    return false;
};

CommonInputControlsClass.SearchBox.Search = function(){

    var view = CommonInputControlsClass.SearchBox.GetAreaIdentifier();
    var query = CommonInputControlsClass.SearchBox.GetQuery();
    var tags = window['main-search-tags'].GetListString(true);

    if(!query.length && !tags.length)
    {
        CommonInputControlsClass.SearchBox.Reset(true);
        return;
    }

    if(query.length)
        CommonInputControlsClass.SearchBox.LastQueryList[view] = query;
    else
        CommonInputControlsClass.SearchBox.LastQueryList[view] = 'tagsearch';

    if(view == 'tickets')
        ChatTicketClass.Search(query,tags);
    else if(view.endsWith('qrd'))
        KnowledgebaseUI.Search(query,tags);
    else if(view == 'archive')
        ChatArchiveClass.Search(query,tags);
    else if(view == 'internal')
        CommonUIClass.SearchOperators(query);

    if(UIRenderer.windowWidth < CommonInputControlsClass.SearchBox.SwitchWidth)
        CommonInputControlsClass.SearchBox.ToggleSearchDialog(true,true,true);

    UIRenderer.resizeAll();
};

CommonInputControlsClass.SearchBox.Reset = function(_force){

    var view = CommonInputControlsClass.SearchBox.GetAreaIdentifier();

    if(CommonInputControlsClass.SearchBox.GetQuery(true).length || CommonInputControlsClass.SearchBox.LastQueryList[view] == 'tagsearch' || _force)
    {
        if(!_force)
            CommonInputControlsClass.SearchBox.SetQuery('');

        window['main-search-tags'].SelectedList = [];
        window['main-search-tags'].UpdateHTML();

        if(_force || (d(CommonInputControlsClass.SearchBox.LastQueryList[view]) && CommonInputControlsClass.SearchBox.LastQueryList[view].length))
        {
            if(view == 'tickets')
                ChatTicketClass.Search('','');
            else if(view.endsWith('qrd'))
                KnowledgebaseUI.Search('','');
            else if(view == 'archive')
                ChatArchiveClass.Search('','');
            else if(view == 'internal')
                CommonUIClass.SearchOperators('');

            if(IFManager.IsMobileOS && !KnowledgebaseUI.SelectionMode)
                CommonInputControlsClass.SearchBox.ToggleSearchDialog(true,true);
        }

        CommonInputControlsClass.SearchBox.QueryList[view] = '';
        CommonInputControlsClass.SearchBox.LastQueryList[view] = '';
    }

    CommonInputControlsClass.SearchBox.SetColor();

    UIRenderer.resizeAll();
};

CommonInputControlsClass.SearchBox.ToggleSearchDialog = function(_switchArea,_hide,_noReset){

    var showSearchBox = false, fullscreen = true;

    if(UIRenderer.windowWidth < CommonInputControlsClass.SearchBox.SwitchWidth)
    {
        fullscreen = false;
        _noReset = true;
    }

    _hide = (d(_hide)) ? _hide : false;

    if(_hide && !d(_noReset) && CommonInputControlsClass.SearchBox.IsActiveSearch())
        CommonInputControlsClass.SearchBox.Reset();

    var view = CommonInputControlsClass.SearchBox.GetAreaIdentifier();

    if(d(_switchArea))
    {
        if(view == 'tickets')
            CommonInputControlsClass.SearchBox.ShowTicket = _hide ? false : !CommonInputControlsClass.SearchBox.ShowTicket;
        else if(view.endsWith('qrd'))
            CommonInputControlsClass.SearchBox.ShowKB = _hide ? false : !CommonInputControlsClass.SearchBox.ShowKB;
        else if(view == 'archive')
            CommonInputControlsClass.SearchBox.ShowChatArchive = _hide ? false : !CommonInputControlsClass.SearchBox.ShowChatArchive;
        else if(view == 'internal')
            CommonInputControlsClass.SearchBox.ShowInternal = _hide ? false : !CommonInputControlsClass.SearchBox.ShowInternal;
    }

    // tickets
    if(view == 'tickets')
    {
        $('#ticket-list').css('display','block');
        if(CommonInputControlsClass.SearchBox.ShowTicket)
        {
            showSearchBox = true;
            $('#ticket-search').css('display','none');

            if(!fullscreen)
                $('#ticket-list').css('display','none');
        }
        else
        {
            $('#ticket-search').css('display','inline');
        }
    }

    // knowledge base
    if(view.endsWith('qrd'))
    {
        $('#qrd-tree').css('display','block');

        if(CommonInputControlsClass.SearchBox.ShowKB)
        {
            showSearchBox = true;
            $('#search-kb').css('display','none');

            if(!fullscreen)
                $('#qrd-tree').css('display','none');
        }
        else
        {
            $('#search-kb').css('display','inline');
        }
    }

    // chat archive
    if(view == 'archive')
    {
        $('#archive').css('display','block');
        if(CommonInputControlsClass.SearchBox.ShowChatArchive)
        {
            showSearchBox = true;
            $('#archive-search').css('display','none');

            if(!fullscreen)
                $('#archive').css('display','none');
        }
        else
        {
            $('#archive-search').css('display','inline');
        }
    }

    // operators
    if(view == 'internal')
    {
        $('#operator-list').css('display','block');
        if(CommonInputControlsClass.SearchBox.ShowInternal)
        {
            showSearchBox = true;
            $('#operator-search').css('display','none');

            if(!fullscreen)
                $('#operator-list').css('display','none');
        }
        else
        {
            $('#operator-search').css('display','inline');
        }
    }

    var actwin = TaskBarManager.GetActiveWindow();

    if(actwin != null)
    {
        showSearchBox = (actwin.TypeId.indexOf('qrd-') == 0);
    }

    if(!fullscreen)
    {
        $('#main-search-box').css({left:'8px',width:'auto',top:'44px'});
    }

    if(!showSearchBox)
    {
        $('#main-search-box').css('display','none');
        $('#chat').css('right',0);
    }
    else
    {
        $('#main-search-box').css('display','block');
        $('#chat').css('right','270px');
    }

    if(_hide || _switchArea)
        UIRenderer.resizeAll();
};

CommonInputControlsClass.SearchBox.RenderSearchDialog = function(){

    var view = CommonInputControlsClass.SearchBox.GetAreaIdentifier(),sshtml='';
    sshtml += '<legend>'+tid('settings')+'</legend>';
    if(view == 'tickets')
    {
        sshtml += lzm_inputControls.createCheckbox('ticket-ss-hash', tid('hash'),LocalConfiguration.TicketSearchSettings.split('')[2]=='1','ticket-ss-check');
        sshtml += lzm_inputControls.createCheckbox('ticket-ss-name', tid('fullname'),LocalConfiguration.TicketSearchSettings.split('')[3]=='1','ticket-ss-check');
        sshtml += lzm_inputControls.createCheckbox('ticket-ss-sid', tid('visitor_id'),LocalConfiguration.TicketSearchSettings.split('')[4]=='1','ticket-ss-check');
        sshtml += lzm_inputControls.createCheckbox('ticket-ss-tid', tid('ticket_id'),LocalConfiguration.TicketSearchSettings.split('')[5]=='1','ticket-ss-check');
        sshtml += lzm_inputControls.createCheckbox('ticket-ss-cf', tid('custom_field'),LocalConfiguration.TicketSearchSettings.split('')[6]=='1','ticket-ss-check');
        sshtml += lzm_inputControls.createCheckbox('ticket-ss-text', tid('text'),LocalConfiguration.TicketSearchSettings.split('')[7]=='1','ticket-ss-check');
        sshtml += lzm_inputControls.createCheckbox('ticket-ss-email', tid('email'),LocalConfiguration.TicketSearchSettings.split('')[8]=='1','ticket-ss-check');
        sshtml += lzm_inputControls.createCheckbox('ticket-ss-company', tid('company'),LocalConfiguration.TicketSearchSettings.split('')[9]=='1','ticket-ss-check');
        sshtml += lzm_inputControls.createCheckbox('ticket-ss-phone', tid('phone'),LocalConfiguration.TicketSearchSettings.split('')[10]=='1','ticket-ss-check');
        sshtml += lzm_inputControls.createCheckbox('ticket-ss-subject', tid('subject'),LocalConfiguration.TicketSearchSettings.split('')[11]=='1','ticket-ss-check');
        sshtml += lzm_inputControls.createCheckbox('ticket-ss-operator', tid('operator'),LocalConfiguration.TicketSearchSettings.split('')[12]=='1','ticket-ss-check');
        sshtml += lzm_inputControls.createCheckbox('ticket-ss-comment', tid('comment'),LocalConfiguration.TicketSearchSettings.split('')[13]=='1','ticket-ss-check');
        sshtml += '<div class="top-space-double"><a id="ticket-ss-reset" class="text-s lzm-clickable lzm-unselectable">'+tid('reset')+'</a></div>';

        $('#main-search-settings').html(sshtml);

        $('.ticket-ss-check').change(function(){
            LocalConfiguration.TicketSearchSettings = '11';
            LocalConfiguration.TicketSearchSettings += $('#ticket-ss-hash').prop('checked') ? '1' : '0';
            LocalConfiguration.TicketSearchSettings += $('#ticket-ss-name').prop('checked') ? '1' : '0';
            LocalConfiguration.TicketSearchSettings += $('#ticket-ss-sid').prop('checked') ? '1' : '0';
            LocalConfiguration.TicketSearchSettings += $('#ticket-ss-tid').prop('checked') ? '1' : '0';
            LocalConfiguration.TicketSearchSettings += $('#ticket-ss-cf').prop('checked') ? '1' : '0';
            LocalConfiguration.TicketSearchSettings += $('#ticket-ss-text').prop('checked') ? '1' : '0';
            LocalConfiguration.TicketSearchSettings += $('#ticket-ss-email').prop('checked') ? '1' : '0';
            LocalConfiguration.TicketSearchSettings += $('#ticket-ss-company').prop('checked') ? '1' : '0';
            LocalConfiguration.TicketSearchSettings += $('#ticket-ss-phone').prop('checked') ? '1' : '0';
            LocalConfiguration.TicketSearchSettings += $('#ticket-ss-subject').prop('checked') ? '1' : '0';
            LocalConfiguration.TicketSearchSettings += $('#ticket-ss-operator').prop('checked') ? '1' : '0';
            LocalConfiguration.TicketSearchSettings += $('#ticket-ss-comment').prop('checked') ? '1' : '0';
            LocalConfiguration.Save();
        });
        $('#ticket-ss-reset').click(function(){
            $('.ticket-ss-check').prop('checked',true);
            $('.ticket-ss-check').change();
        });
    }
    else if(view.endsWith('qrd'))
    {
        sshtml += lzm_inputControls.createCheckbox('kb-ss-ti', tid('title'),LocalConfiguration.KBSearchSettings.split('')[0]=='1','kb-ss-check');
        sshtml += lzm_inputControls.createCheckbox('kb-ss-text', tid('text'),LocalConfiguration.KBSearchSettings.split('')[1]=='1','kb-ss-check');
        sshtml += lzm_inputControls.createCheckbox('kb-ss-t', tid('tags'),LocalConfiguration.KBSearchSettings.split('')[2]=='1','kb-ss-check');
        sshtml += '<div class="top-space-double"><a id="kb-ss-reset" class="text-s lzm-clickable lzm-unselectable">'+tid('reset')+'</a></div>';

        $('#main-search-settings').html(sshtml);

        $('.kb-ss-check').change(function(){

            LocalConfiguration.KBSearchSettings = '';
            LocalConfiguration.KBSearchSettings += $('#kb-ss-ti').prop('checked') ? '1' : '0';
            LocalConfiguration.KBSearchSettings += $('#kb-ss-text').prop('checked') ? '1' : '0';
            LocalConfiguration.KBSearchSettings += $('#kb-ss-t').prop('checked') ? '1' : '0';
            LocalConfiguration.Save();
        });
        $('#kb-ss-reset').click(function(){
            $('.kb-ss-check').prop('checked',true);
        });
    }
    else
    {
        sshtml += '<div class="text-light"><i>'+tid('none')+'</i></div>';
        $('#main-search-settings').html(sshtml);
    }

    if(view == 'internal')
    {
        $('#main-search-tags').css('display','none');
    }
    else
    {
        $('#main-search-tags').css('display','block');
        CommonInputControlsClass.SearchBox.UpdateTags();
    }

    if(KnowledgebaseUI.SelectionMode)
    {
        $('#main-search-close').css('display','none');
    }
    else
    {
        $('#main-search-close').css('display','inline');
    }

    var updateSearch = false;
    var query,old = $('#main-search-field').val();

    if(view != CommonInputControlsClass.SearchBox.CurrentView)
    {
        if(view.endsWith('qrd'))
            updateSearch = true;

        if(d(CommonInputControlsClass.SearchBox.QueryList[view]))
            CommonInputControlsClass.SearchBox.SetQuery(query = CommonInputControlsClass.SearchBox.QueryList[view]);
        else
            CommonInputControlsClass.SearchBox.SetQuery(query = '');

        if(updateSearch)
        {
            if(old != query)
                CommonInputControlsClass.SearchBox.Search();
            else if(query == '')
                CommonInputControlsClass.SearchBox.Reset(true);
        }
    }

    CommonInputControlsClass.SearchBox.CurrentView = view;
};

CommonInputControlsClass.SearchBox.UpdateTags = function(){
    if(!(d(window['main-search-tags']) && d(window['main-search-tags'].GetListString) && DataEngine.getConfigValue('gl_tags',false) == window['main-search-tags'].GetListString(false)))
    {
        window['main-search-tags'] = new CommonInputControlsClass.TagEditor('main-search-tags',DataEngine.getConfigValue('gl_tags',false),false,true,false,true);
        window['main-search-tags'].PermissionsToAdd = 'add_tags';
        $('#main-search-tags').html('<legend>'+tid('tags')+'</legend>' + window['main-search-tags'].GetHTML(false));
    }
};

CommonInputControlsClass.SearchBox.UpdateLanguages = function(){

    /*
    var alllangs = [];
    if(!(d(window['main-search-languages']) && d(window['main-search-languages'].GetListString)))
    {
        window['main-search-languages'] = new CommonInputControlsClass.TagEditor('main-search-languages',alllangs,false,true,false,false);
        $('#main-search-languages').html('<legend>'+tid('languages')+'</legend>' + window['main-search-languages'].GetHTML(false));
    }
    */

};