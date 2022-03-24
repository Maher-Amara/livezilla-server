function ContextMenuClass() {}

ContextMenuClass.CurrentMenu = [];
ContextMenuClass.SubmenuIndent = 0;
ContextMenuClass.MinWidth = 170;
ContextMenuClass.SampleMenu = {
    id: 'sample_menu',
    onClickFunction: console.log, // Value of the entry will be function parameter
    entries: [
        {
            label: 'first entry',
            checked: true,
            value: 'first_entry'
        },
        '',
        {
            label: 'Second Entry',
            checked: false,
            onClick: 'console.log("hello")'
        },
        {
            label: 'Submenu Entry',
            checked: true, // this won't apply because it is a submenu
            onClick: "console.log('test')", // this won't apply because expand submenu function will overwrite this
            submenu: {
                isSubmenu: true, // important for the context menu to build as submenu
                onClickFunction: ContextMenuClass.SampleFunction, // function to be called by all entries
                entries: [
                    {
                        label: 'Another Submenu with a very long name',
                        submenu: {
                        isSubmenu: true,
                        onClickFunction: ContextMenuClass.SampleFunction,
                        entries: [{
                            label: 'Eintrag 1'
                        }, {
                            label: 'Eintrag 2'
                        }, {
                            label: '4th level of submenues',
                            submenu: {
                                onClickFunction: ContextMenuClass.SampleFunction,
                                isSubmenu: true,
                                entries: [
                                    {
                                        label: 'checkbox1',
                                        checked: true
                                    },
                                    '',
                                    {
                                        label: 'checkbox2',
                                        checked: false
                                    }
                                ]
                            }
                        } ]
                    }
                    },
                    {
                        label: 'entry1'
                    },
                    {
                        label: 'entry2'
                    }
                ]
            }
        }
    ]
};

ContextMenuClass.SampleFunction = function(_input) {
    console.log('Sample function was triggered with input: ' + _input);
};

ContextMenuClass.ToggleMenu = function(event, menu) {
    if ($('#' + menu.id).length) {
        ContextMenuClass.RemoveAll();
    } else {
        ContextMenuClass.BuildMenu(event, menu);
    }
};

ContextMenuClass.BuildMenu = function( event, menu, _objectId) {

    if(CommonUIClass.ContextMenus)
    {
        if (menu === null)
            return;

        if (typeof(menu) === 'undefined')
            menu = $.extend(true,{},ContextMenuClass.SampleMenu);

        if ($('#' + menu.id).length) {
            ContextMenuClass.Pop();
        }
        menu.position = ContextMenuClass.CalculateMenuPosition(event, false, _objectId);
        ContextMenuClass.Push(menu);
        ContextMenuClass.DrawMenu(event,_objectId);

        return true;
    }

    return false;
};

ContextMenuClass.OpenSubMenu = function (event, menu) {
    var parentMenu = ContextMenuClass.Last();
    menu.id = 'sub-' + parentMenu.id;
    var parentElem = $('#' + parentMenu.id);
    parentMenu.position = parentElem.position();
    menu.position = ContextMenuClass.CalculateMenuPosition(event, true);
    ContextMenuClass.Push(menu);
    parentElem.remove();
    ContextMenuClass.DrawMenu(event);
};

ContextMenuClass.CloseSubMenu = function(event) {
    ContextMenuClass.Pop();
    ContextMenuClass.DrawMenu(event);
};

ContextMenuClass.DrawMenu = function(event){
    var wrapperDiv = ContextMenuClass.DrawContainer(event);
    ContextMenuClass.DrawEntries(wrapperDiv);
    ContextMenuClass.RecalcMenuHeight();
    ContextMenuClass.RecalcPosition();
};

ContextMenuClass.DrawContainer = function(event){
    var menu = ContextMenuClass.Last();
    var baseZIndex = 4000000;
    var winHeight = typeof lzm_chatDisplay != 'undefined' ? lzm_chatDisplay.windowHeight : $(window).height();
    var position = menu.position? menu.position : ContextMenuClass.CalculateMenuPosition(event, menu.isSubmenu);
    menu.position = position;
    // add menu to body
    var wrapperDiv = $('<div></div>', {
        id: menu.id,
        class: 'cm lzm-unselectable',
        style: 'z-index:'+baseZIndex.toString()+';top:' + position.top + 'px;left: ' + position.left + 'px; min-width:160px; max-height: ' + Math.floor(winHeight * 0.6) + 'px; overflow:auto'
    });
    if (menu.isSubmenu) {
        var parentMenuId = ContextMenuClass.Parent().id;
        var parentElem = $('#' + parentMenuId);
        var parentWidth = parentElem.outerWidth();
        parentElem.remove();
        var targetEntryId = event.target.id || event.target.parentNode.id;
        $(wrapperDiv).attr('class', 'cm lzm-unselectable contextmenuclass-submenu').css({
            'min-width': parentWidth + 'px'
        }).appendTo($('body'));
        $('#' + targetEntryId).attr('onClick', 'ContextMenuClass.ReBuildSubMenu(event,null);event.stopPropagation()');
    } else {
        $(wrapperDiv).appendTo($('body'));
    }
    return wrapperDiv;
};

ContextMenuClass.DrawEntries = function(wrapperDiv){
    var menu = ContextMenuClass.Last();
    if(menu.isSubmenu)
    {
        var backLinkOuter = $('<div></div>', {
            id: menu.id + '-entry-back'
        }).appendTo($(wrapperDiv));
        $('<i></i>', {
            class: 'fa fa-caret-left contextmenuclass-submenu-backlink-icon'
        }).appendTo($(backLinkOuter));
        $('<span></span>', {class: 'cm-line cm-click cm-backlink'}).text(tid('back')).appendTo($(backLinkOuter));
        $(backLinkOuter.attr('onClick', 'ContextMenuClass.CloseSubMenu(event);event.stopPropagation();'));
        $('<hr>').appendTo($(wrapperDiv));
    }
    for (var i = 0; i < menu.entries.length; i++) {
        // check ruler
        if (menu.entries[i] === '') {
            $('<hr>').appendTo($(wrapperDiv));
        } else {
            // add click event
            var entryID = menu.id + '-entry' + i;
            var disabled = menu.entries[i].disabled ? 'ui-disabled' : '';
            var outer = $('<div></div>', {
                id: entryID,
                class: disabled
            }).appendTo($(wrapperDiv));
            var onClick;
            if (menu.entries[i].submenu) {
                // MAKE snd click should close the submenu
                onClick = 'ContextMenuClass.OpenSubMenu(event,ContextMenuClass.Last().entries[' + i + '].submenu);event.stopPropagation()';
            } else if (menu.entries[i].onClick) {
                onClick = menu.entries[i].onClick + ';ContextMenuClass.RemoveAll();event.stopPropagation()';
            } else {
                onClick = 'ContextMenuClass.OnClickEntry(\'' + menu.entries[i].label + '\');';
                //var value = menu.entries[i].value || menu.entries[i].label;
                //onClick = menu.onClickName + '("' + value + '");ContextMenuClass.RemoveAll();event.stopPropagation()';
            }
            $(outer.attr('onClick', onClick));
            // add checkbox
            if (typeof(menu.entries[i].checked) === 'boolean' && typeof(menu.entries[i].submenu) === 'undefined') {
                $(outer.attr('class', 'contextmenuclass-entry-checkbox'));
                var isChecked = menu.entries[i].checked;
                $('<input>', {
                    type: 'checkbox',
                    class: 'checkbox-custom contextmenuclass-checkbox',
                    id: menu.id + '-checkbox' + i,
                    checked: (isChecked ? 'checked' : false)
                }).appendTo($(outer));
                // add label
                $('<label>', {
                    class: 'contextmenuclass-label checkbox-custom-label',
                    for: menu.id + '-checkbox'
                    //onClick: 'event.stopPropagation()'
                }).text(menu.entries[i].label).appendTo($(outer));
            } else if (menu.entries[i].submenu) {
                // MAKE add icon to submenuentries @context
                $('<span></span>', {class: 'cm-line cm-click'}).text(menu.entries[i].label).appendTo($(outer));
                $('<i></i>', {
                    class: 'fa fa-caret-down contextmenuclass-submenu-icon'
                }).appendTo($(outer));
            } else {
                $('<span></span>', {class: 'cm-line cm-click'}).text(menu.entries[i].label).appendTo($(outer));
            }

        }
    }
};

ContextMenuClass.RecalcMenuHeight = function(){
    var baseZIndex = 4000000;
    var menu = ContextMenuClass.Last();
    var menuElem = $('#' + menu.id);
    var scrollHeight = menuElem[0].scrollHeight;
    var newHeight = scrollHeight + 'px';
    menuElem.css({
        'height': newHeight,
        'z-index': baseZIndex + ContextMenuClass.CurrentMenu.length
    });
};

ContextMenuClass.RecalcPosition = function(){
    var menu = ContextMenuClass.Last();
    if(menu.isSubmenu){
        var subMenuElem = $('#' + menu.id);
        var subMenuPos = subMenuElem.position();
        var bodyElem = $('body');
        if ((bodyElem.height() - subMenuPos.top) < subMenuElem.outerHeight()) {
            // MAKE move all parent menus, too @context
            subMenuElem.animate({
                'top': (bodyElem.height() - subMenuElem.outerHeight() - 5)
            }, {
                duration: 'fast',
                queue: false
            });
        }
        if ((bodyElem.width() - subMenuPos.left) < subMenuElem.outerWidth()) {
            // MAKE move all parent menus, too @context
            subMenuElem.animate({
                'left': ($('body').width() - subMenuElem.outerWidth() - 25)
            }, {
                duration: 'fast',
                queue: false
            });
        }
    }else{
        var mainMenu = ContextMenuClass.CurrentMenu[0];
        var mainMenuElem = $('#' + mainMenu.id);
        var mainMenuPos = mainMenuElem.position();
        if (($('body').height() - mainMenuPos.top) < mainMenuElem.outerHeight()) {
            // MAKE move all parent menus, too @context
            mainMenuElem.animate({
                'top': ($('body').height() - mainMenuElem.outerHeight() - 5)
            }, {
                duration: 'fast',
                queue: false
            });
        }
        if (($('body').width() - mainMenuPos.left) < mainMenuElem.outerWidth()) {
            // MAKE move all parent menus, too @context
            mainMenuElem.animate({
                'left': ($('body').width() - mainMenuElem.outerWidth() - 5)
            }, {
                duration: 'fast',
                queue: false
            });
        }
    }
};

ContextMenuClass.ReBuildSubMenu = function(event) {
    var targetEntryId = event.target.id || event.target.parentNode.id;
    var subMenu = ContextMenuClass.GetSubMenuByEntryId(ContextMenuClass.Parent(), targetEntryId);
    if (subMenu) {
        ContextMenuClass.BuildMenu(event, subMenu);
    }
};

ContextMenuClass.GetSubMenuByEntryId = function(_menu, _entryId) {
    var menu = $.extend(true,{},_menu);
    var childCount = _entryId.substr(-1);
    // var entryArray = menu.entries.filter(function(elem) {
    //     return elem !== '';
    // });
    return menu.entries[childCount].submenu;
    // for(var i = 0; i < menu.entries.length -1; i++){
    //     if(menu.entries[i].submenu){
    //
    //     }
    // }
};

ContextMenuClass.GetMenuById = function(_id) {
    for (var i = 0; i < ContextMenuClass.CurrentMenu.length; i++) {
        if (ContextMenuClass.CurrentMenu[i].id === _id) {
            return ContextMenuClass.CurrentMenu[i];
        }
    }
};

ContextMenuClass.AddContextMenuListenerToElement = function(_element, _menuObjectBuilderName, _eventName) {
    _element.addEventListener(_eventName || 'contextmenu', function(event) {
        ContextMenuClass.BuildMenu(event, _menuObjectBuilderName(event));
    });
};

ContextMenuClass.Push = function(_menu) {
    ContextMenuClass.CurrentMenu.push($.extend(true,{},_menu));
};

ContextMenuClass.Pop = function() {
    var menuToBeRemoved = ContextMenuClass.CurrentMenu.pop();
    if(menuToBeRemoved != null)
        $('#' + menuToBeRemoved.id).remove();
};

ContextMenuClass.OnClickEntry = function(_entryLabel){
    var currentMenu = ContextMenuClass.Last();
    var entry = ContextMenuClass.GetEntryByLabel(currentMenu,_entryLabel);
    currentMenu.onClickFunction(entry.value);
};

ContextMenuClass.GetEntryByLabel = function(_menu, _entryLabel){
    var menu = $.extend(true,{},_menu);
    for(var i = 0; i < menu.entries.length; i++ ){
        if(menu.entries[i].label == _entryLabel){
            return menu.entries[i];
        }
    }
};

ContextMenuClass.RemoveAll = function(event) {
    while (ContextMenuClass.CurrentMenu.length > 0) {
        ContextMenuClass.Pop();
    }
};

ContextMenuClass.CalculateMenuPosition = function(event, _isSubmenu, _objectId) {
    var pos,menu = ContextMenuClass.Last();
    var top = 0;
    var left = 0;

    if (_isSubmenu)
    {
        var id = ((event.target.id === '') ? event.target.parentNode.id : event.target.id);
        pos = $('#' + id).position();
        var posParent = $('#' + id).parent().position();
        top = pos.top + posParent.top;
        left = pos.left + ContextMenuClass.SubmenuIndent + posParent.left;
    }
    else
    {
        if(d(_objectId))
        {
            pos = CommonToolsClass.GetRelativePositionOf(_objectId);
            top = pos[0];
            left = pos[1];
        }
        else
        {
            top = event.clientY;
            left = event.clientX;
        }
    }

    var win = event.target.ownerDocument.defaultView;
    var frame = win.frameElement;
    if (frame && frame.id !== 'appFrame')
    {
        var parent = frame.parentNode;
        var offset = $(parent).offset();
        top = top + offset.top;
        left = left + offset.left;
    }
    return{
        top: top,
        left: left
    };
};

ContextMenuClass.CalculateMenuId = function() {
    var lastMenuIndex = ContextMenuClass.Depth();
    var lastItem = ContextMenuClass.CurrentMenu[lastMenuIndex];
    return 'sub-' + lastItem.id;
};

ContextMenuClass.Depth = function() {
    return ContextMenuClass.CurrentMenu.length - 1;
};

ContextMenuClass.Last = function() {
    return ContextMenuClass.CurrentMenu[ContextMenuClass.Depth()];
};

ContextMenuClass.First = function() {
    return ContextMenuClass.CurrentMenu[0];
};

ContextMenuClass.Parent = function() {
    return ContextMenuClass.CurrentMenu[ContextMenuClass.CurrentMenu.length - 2];
};

ContextMenuClass.AddMouseOut = function(_id) {
    $('#' + _id).mouseout(function(event) {
        var toElem = $(event.toElement);
        var toElemId = toElem.attr('id');
        var lastMenuIndex = ContextMenuClass.Depth();
        for (var i = lastMenuIndex; i > 0; i--) {
            var itemID = ContextMenuClass.CurrentMenu[i].id;
            var isChild = (toElem.closest('#' + itemID).length > 0);
            if (isChild) {
                break;
            } else {
                ContextMenuClass.Pop();
            }
        }
    });
    $('#' + _id).parent().off('mouseout');
};