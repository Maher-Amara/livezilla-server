/****************************************************************************************
 * LiveZilla ChatTranslationEditorClass.js
 *
 * Copyright 2018 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/
function ChatTranslationEditorClass() {

    this.languageCode = '';
    this.languageName = '';
    this.languageStrings = '';

    this.saveTranslations = {};
    this.selectedTranslationTab = '';

    this.defaultLanguages = ['en', 'de'];
    this.newTranslationLanguages = [];
    this.removedTranslationLanguages = [];
    this.serverStrings = [];
    this.serverStringsLoaded = false;
    this.origStringLanguage = '';
    this.selectedLanguages = {mobile: '', server: ''};
    this.lastSearchCharacterTyped = 0;
}

ChatTranslationEditorClass.FirstAvailableLanguageClient = '';
ChatTranslationEditorClass.FirstAvailableLanguageServer = '';
ChatTranslationEditorClass.UploadDefaults = false;
ChatTranslationEditorClass.AvailableLanguages = [];

ChatTranslationEditorClass.prototype.showTranslationEditor = function() {
    var that = this;
    lzm_chatDisplay.showUsersettingsHtml = false;

    $('#usersettings-menu').css({'display': 'none'});

    var headerString = t('Translation Editor');
    var footerString = lzm_inputControls.createButton('save-translation-editor', 'ui-disabled', '', t('Save'), '', 'lr',{'margin-left': '6px'},'',30,'d');
        footerString += lzm_inputControls.createButton('cancel-translation-editor', '', '', tid('cancel'), '', 'lr',{'margin-left': '6px'},'',30,'d');
        footerString += lzm_inputControls.createButton('apply-translation-editor', '', '', tid('apply'), '', 'lr',{'margin-left': '6px'},'',30,'d');

    var bodyString = '<div id="translation-editor-placeholder"></div>';

    lzm_commonDialog.CreateDialogWindow(headerString, bodyString, footerString, 'language', 'translation-editor', 'translation_editor', 'cancel-translation-editor');
    var tabsArray = [
        {name: tid('client') + ' ('+tid('operators')+')', content: '<div class="lzm-tab-content">' + that.createTranslationEditorHtml('mobile_client') + '</div>'},
        {name: tid('server') + ' ('+tid('visitors')+')', content: '<div class="lzm-tab-content">' + that.createTranslationEditorHtml('server') + '</div>'}
    ];

    lzm_inputControls.createTabControl('translation-editor-placeholder', tabsArray, 0);
    UIRenderer.resizeTranslationEditor();

    $('.translation-editor-placeholder-tab').click(function() {

        selectTranslationLine('');
        that.languageCode = '';
        that.languageName = '';
        that.languageStrings = [];
        $('#translation-search-string').val('');
        $('#translation-search-string').addClass('ui-disabled');
        $('#srv-translation-search-string').val('');
        $('#srv-translation-search-string').addClass('ui-disabled');
        var langCode, langName, langEdit, changed, translationTab, i;
        if ($(this).data('tab-no') == 0 && that.selectedLanguages.mobile == '')
        {
            selectTranslationLanguage(ChatTranslationEditorClass.FirstAvailableLanguageClient, '', false, false, 'mobile_client', false);
        }
        else if ($(this).data('tab-no') == 1 && that.selectedLanguages.server == '')
        {
            selectTranslationLanguage(ChatTranslationEditorClass.FirstAvailableLanguageServer, '', false, false, 'server', false);
        }
        else if ($(this).data('tab-no') == 0 && that.selectedLanguages.mobile != '')
        {
            translationTab = 'mobile_client';
            for (i=0; i<ChatTranslationEditorClass.AvailableLanguages.mobile.length; i++) {
                if (ChatTranslationEditorClass.AvailableLanguages.mobile[i].code == that.selectedLanguages.mobile) {
                    langCode = ChatTranslationEditorClass.AvailableLanguages.mobile[i].code;
                    langName = ChatTranslationEditorClass.AvailableLanguages.mobile[i].name;
                    langEdit = ChatTranslationEditorClass.AvailableLanguages.mobile[i].edit;
                }
            }
            if (typeof that.saveTranslations[langCode] != 'undefined')
            {
                changed = that.saveTranslations[langCode].edit;
                selectTranslationLanguage(langCode, langName, langEdit, changed, translationTab, false);
            } else
                selectTranslationLanguage('');

        }
        else if ($(this).data('tab-no') == 1 && that.selectedLanguages.server != '')
        {
            translationTab = 'server';
            for (i=0; i<ChatTranslationEditorClass.AvailableLanguages.server.length; i++) {
                if (ChatTranslationEditorClass.AvailableLanguages.server[i].code == that.selectedLanguages.server) {
                    langCode = ChatTranslationEditorClass.AvailableLanguages.server[i].code;
                    langName = ChatTranslationEditorClass.AvailableLanguages.server[i].name;
                    langEdit = ChatTranslationEditorClass.AvailableLanguages.server[i].edit;
                }
            }
            if (typeof that.saveTranslations['srv-' + langCode] != 'undefined') {
                changed = that.saveTranslations['srv-' + langCode].edit;
                selectTranslationLanguage(langCode, langName, langEdit, changed, translationTab, false);
            } else {
                selectTranslationLanguage('');
            }
        }
        UIRenderer.resizeTranslationEditor();
    });
    $('#save-translation-editor').click(function() {
        saveTranslations();
        $('#cancel-translation-editor').click();
    });
    $('#apply-translation-editor').click(function() {
        saveTranslations();
    });
    $('#cancel-translation-editor').click(function() {
        that.languageCode = '';
        that.languageName = '';
        that.languageStrings = [];
        ChatTranslationEditorClass.AvailableLanguages = [];
        that.saveTranslations = {};
        that.newTranslationLanguages = [];
        that.removedTranslationLanguages = [];
        that.selectedLanguages = {mobile: '', server: ''};
        TaskBarManager.RemoveActiveWindow();
    });

    setTimeout(function()
    {
        if(ChatTranslationEditorClass.FirstAvailableLanguageClient.length)
            selectTranslationLanguage(ChatTranslationEditorClass.FirstAvailableLanguageClient, '', '1', 0, 'mobile_client');
    },1);
};

ChatTranslationEditorClass.prototype.showTranslationStrings = function(searchString) {
    if(this.languageCode != '') {
        searchString = (typeof searchString != 'undefined') ? searchString : '';
        if (this.selectedTranslationTab != 'server') {
            $('#translation-search-string').val(searchString);
            $('#translation-search-string').removeClass('ui-disabled');
        } else {
            $('#srv-translation-search-string').val(searchString);
            $('#srv-translation-search-string').removeClass('ui-disabled');
        }
    }
    if (typeof searchString != 'undefined') {
        searchString = searchString.replace(/^ +/g, '').replace(/ +$/g, '');
    }
    var idPrefix = (this.selectedTranslationTab == 'server') ? 'srv-' : '';
    $('#' + idPrefix + 'translation-values-top').html(this.createTranslationStringsHtml(this.selectedTranslationTab, searchString)).trigger('create');
    UIRenderer.resizeTranslationEditor();
};

ChatTranslationEditorClass.prototype.addTranslationLanguage = function(type, myTab) {

    var that = this, languages = lzm_commonTools.clone(ChatTranslationEditorClass.AvailableLanguages);
    that.selectedTranslationTab = myTab;

    var bodyString = this.createTranslationLanguageEditorHtml();

    lzm_commonDialog.createAlertDialog(bodyString, [{id: 'ok', name: tid('ok')},{id: 'cancel', name: tid('cancel')}],true);

    $('#alert-btn-ok').click(function() {

        var newLangCode = ChatTranslationEditorClass.NameToIso(window['add-language'].GetListString(true),true);
        var newLangName = ChatTranslationEditorClass.IsoToName(newLangCode);

        that.newTranslationLanguages.push({code: newLangCode, type: (myTab == 'server') ? 'server' : 'mobile'});
        var langCodePrefix = (myTab == 'server') ? 'srv-' : '', i = 0;

        lzm_commonDialog.removeAlertDialog();

        if (!d(that.saveTranslations[langCodePrefix + newLangCode]))
        {
            that.saveTranslations[langCodePrefix + newLangCode] = {strings: []};
        }

        that.saveTranslations[langCodePrefix + newLangCode].code = newLangCode;
        that.saveTranslations[langCodePrefix + newLangCode].name = newLangName;
        that.saveTranslations[langCodePrefix + newLangCode].edit = 1;
        that.saveTranslations[langCodePrefix + newLangCode].delete = 0;

        if (myTab == 'server')
        {
            ChatTranslationEditorClass.AvailableLanguages.server.push({code: newLangCode, edit: 1, name: newLangName});
            for (i=0; i<that.serverStrings.length; i++)
            {
                that.saveTranslations[langCodePrefix + newLangCode].strings.push({
                    key: that.serverStrings[i].key, orig: that.serverStrings[i].orig,
                    editedValue: that.serverStrings[i].orig, savedValue: that.serverStrings[i].orig
                });
            }
        }
        else
        {
            ChatTranslationEditorClass.AvailableLanguages.mobile.push({code: newLangCode, edit: 1, name: newLangName});
            for (i=0; i<translationData.length; i++)
            {
                that.saveTranslations[langCodePrefix + newLangCode].strings.push({
                    key: translationData[i].key, orig: translationData[i].orig,
                    editedValue: translationData[i].orig, savedValue: translationData[i].orig
                });
            }
        }
        $('#save-translation-editor').removeClass('ui-disabled');
        $('#apply-translation-editor').removeClass('ui-disabled');
        that.updateTranslationLanguages();
        newLangName = (newLangName != '') ? newLangName : newLangCode;
        selectTranslationLanguage(newLangCode, newLangName, 1, 1, myTab, true);
        //lzm_chatDisplay.RenderWindowLayout(true);
    });
    $('#alert-btn-cancel').click(function() {

        lzm_commonDialog.removeAlertDialog();
        //TaskBarManager.RemoveActiveWindow();
        //TaskBarManager.Maximize('translation_editor');
    });
};

ChatTranslationEditorClass.prototype.deleteTranslationLanguage = function(myTab) {

    var that = this;
    that.removedTranslationLanguages.push({code: that.languageCode, type: (myTab == 'server') ? 'server' : 'mobile'});
    var langCodePrefix = (myTab == 'server') ? 'srv-' : '';

    that.saveTranslations[langCodePrefix + that.languageCode] = {
        code: that.languageCode,
        name: that.languageName,
        strings: [],
        edit: 1,
        delete: 1
    };

    that.languageCode = '';
    that.languageName = '';
    that.languageStrings = [];

    that.updateTranslationLanguages();

    $('#save-translation-editor').removeClass('ui-disabled');
    $('#apply-translation-editor').removeClass('ui-disabled');
};

ChatTranslationEditorClass.prototype.updateTranslationLanguages = function() {

    $('#translation-editor-placeholder-content-0').html('<div class="lzm-tab-content">' + this.createTranslationEditorHtml('mobile_client') + '</div>');
    $('#translation-editor-placeholder-content-1').html('<div class="lzm-tab-content">' + this.createTranslationEditorHtml('server') + '</div>');

    /*
    setTimeout(function() {
        UIRenderer.resizeTranslationEditor();
        setTimeout(function() {
            UIRenderer.resizeTranslationEditor();
            setTimeout(function() {
                UIRenderer.resizeTranslationEditor();
            }, 50);
        }, 20);
    }, 10);
    */

    UIRenderer.resizeTranslationEditor();
};

ChatTranslationEditorClass.prototype.createTranslationEditorHtml = function(myTab) {
    var idPrefix = (myTab == 'server') ? 'srv-' : '';

    var languages = (myTab == 'server') ? lzm_commonTools.clone(ChatTranslationEditorClass.AvailableLanguages.server) : lzm_commonTools.clone(ChatTranslationEditorClass.AvailableLanguages.mobile);
    var langSort = function(a, b) {
        return (a.code > b.code);
    };

    languages.sort(langSort);
    var langSelHtml = '' +
        '<div id="' + idPrefix + 'translation-languages-top">' +
        '<table class="visible-list-table alternating-rows-table lzm-unselectable" id="' + idPrefix + 'translation-language-table">' +
        '<thead><tr><th>' + t('Language') + '</th></tr></thead>' +
        '<tbody>';

    for (var i=0; i<languages.length; i++)
    {
        if (typeof this.saveTranslations[idPrefix + languages[i].code] == 'undefined' || typeof this.saveTranslations[idPrefix + languages[i].code].delete == 'undefined' || this.saveTranslations[idPrefix + languages[i].code].delete != 1 || languages[i].edit == 0)
        {
            var selectedLine = (languages[i].code == this.languageCode) ? ' selected-table-line' : '';
            var langName = (languages[i].name != '') ? languages[i].name : languages[i].code;
            var langDisplayName = (languages[i].name != '') ? languages[i].code.toUpperCase() + ' - ' + languages[i].name : languages[i].code.toUpperCase();
            languages[i].name = langName;
            langSelHtml += '<tr id="' + idPrefix + 'translation-language-line-' + languages[i].code + '" class="translation-language-line' + selectedLine + '"' +
                ' onclick="selectTranslationLanguage(\'' + languages[i].code + '\', \'' + langName + '\', \'' + languages[i].edit + '\', 0, \'' + myTab + '\');" style="cursor: pointer;">' +
                '<td style="text-overflow: ellipsis;">' + langDisplayName + '</td>' +
                '</tr>';

            if(!ChatTranslationEditorClass.FirstAvailableLanguageClient.length && myTab == 'mobile_client')
            {
                ChatTranslationEditorClass.FirstAvailableLanguageClient = languages[i].code;
            }
            else if(!ChatTranslationEditorClass.FirstAvailableLanguageServer.length && myTab == 'server')
            {
                ChatTranslationEditorClass.FirstAvailableLanguageServer = languages[i].code;
            }
        }
    }
    langSelHtml += '</tbody></table></div>';
    langSelHtml += '<div id="' + idPrefix + 'translation-languages-bottom">';
    langSelHtml += '' + lzm_inputControls.createButton(idPrefix + 'translation-language-new', 'translation-lang-btn', 'addTranslationLanguage(\'' + myTab + '\')', t('Add'), '', 'lr', {width:'156px'}, t('Add Language'),30,'d');
    langSelHtml += '' + lzm_inputControls.createButton(idPrefix + 'translation-language-delete', 'translation-lang-btn ui-disabled', 'deleteTranslationLanguage(\'' + myTab + '\')', '', '<i class="fa fa-trash"></i>', 'lr', {width:'40px',float:'right',height:'32px'}, tid('delete_language'),30,'d');
    langSelHtml += '' + lzm_inputControls.createButton(idPrefix + 'translation-language-suggest', 'translation-lang-btn', 'suggestTranslationLanguage(\'' + myTab + '\')', t('Suggest as default'), '', 'lr', {}, t('Suggest translation as default'),30,'d');
    langSelHtml += '' + lzm_inputControls.createButton(idPrefix + 'translation-language-download', 'translation-lang-btn', 'downloadTranslationLanguage(\'' + myTab + '\')', t('Download default'), '', 'lr', {}, t('Download default translation'),30,'d');
    langSelHtml += '</div>';

    var translationHtml = '';
        translationHtml += '<div id="' + idPrefix + 'translation-values-top">' + this.createTranslationStringsHtml(myTab) + '</div>';
        translationHtml += '<div id="' + idPrefix + 'translation-values-bottom"><input type="text" class="lzm-text-input ui-disabled" placeholder="'+t('Search')+'" id="' + idPrefix + 'translation-search-string" onkeyup="translationSearchFieldKeyUp(\'' + myTab + '\');" /></div>';
        translationHtml += '';

    return '' + langSelHtml + '' + translationHtml + '';
};

ChatTranslationEditorClass.prototype.createTranslationStringsHtml = function(myTab, searchString) {
    var that = this, idPrefix = (myTab == 'server') ? 'srv-' : '';
    var translationStringHtml = '<table id="translation-string-table" class="visible-list-table alternating-rows-table lzm-unselectable" style="width: 100%;">' +
        '<thead><tr><th id="translation-status-column" style="width: 20px !important;"><span style="padding: 0px 10px;"></span></th>' +
        '<th id="' + idPrefix + 'translation-orig-column" style="width: 35%;">' + t('Original string') + '</th>' +
        '<th id="' + idPrefix + 'translation-translated-column" style="width: 35%;">' + t('Translated string') + '</th>' +
        '<th id="' + idPrefix + 'translation-key-column">' + t('Key') + '</th></tr></thead><tbody>';
    var languageCode = (this.selectedTranslationTab == 'mobile_client') ? this.languageCode : 'srv-' + this.languageCode;
    if (this.languageCode != '' && d(this.saveTranslations[languageCode]) && typeof this.saveTranslations[languageCode].strings != 'undefined') {
        var languageStrings = this.saveTranslations[languageCode].strings;
        var translationSort = function(a,b) {
            var aOrig = a.orig.replace(/^ */, ''),
                bOrig = b.orig.replace(/^ */, ''),
                rt = 0;

            if(a.key.indexOf("client_custom_") != -1 && b.key.indexOf("client_custom_") == -1)
            {
                rt = 1;
            }
            else if(a.key.indexOf("client_custom_") == -1 && b.key.indexOf("client_custom_") != -1)
            {
                rt = -1;
            }
            else if (a.key > b.key)
            {
                rt = 1;
            }
            else if (a.key < b.key)
            {
                rt = -1;
            }

            return rt;
        };

        languageStrings.sort(translationSort);
        var errorArray = [];

        for (var i=0; i<languageStrings.length; i++)
        {
            try
            {



                var origString = (that.origStringLanguage == 'en' || myTab != 'server') ? languageStrings[i].orig.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
                var translatedString = languageStrings[i].editedValue.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                var translationStatusIcon = (languageCode == 'en' || languageCode == 'srv-en' ||
                    languageStrings[i].orig != languageStrings[i].editedValue) ?
                    '<i class="fa fa-check-circle" style="color: #73be28;"></i>' : '<i class="fa fa-warning" style="color: #e34e4e;"></i>';
                if (!d(searchString) || searchString == '' || origString.toLowerCase().indexOf(searchString.toLowerCase()) != -1 ||
                    languageStrings[i].key.toLowerCase().indexOf(searchString.toLowerCase()) != -1 ||
                    translatedString.toLowerCase().indexOf(searchString.toLowerCase()) != -1)
                {

                    var dblclick = ' ondblclick="ChatTranslationEditorClass.EditString(\'' + languageStrings[i].key + '\', event)"';
                    translationStringHtml += '<tr class="translation-line" '+dblclick+' id="translation-line-' + languageStrings[i].key + '"' +
                        ' onclick="selectTranslationLine(\'' + languageStrings[i].key + '\');" style="cursor: pointer;">' +
                        '<td id="translation-icon-' + languageStrings[i].key + '" class="icon-column">' + translationStatusIcon + '</td>' +
                        '<td style="white-space: normal;">' + origString + '</td>' +
                        '<td style="white-space: normal;" id="translation-translated-string-' + languageStrings[i].key + '">' + translatedString + '</td>' +
                        '<td>' + languageStrings[i].key + '</td>' +
                        '</tr>';
                }
            } catch(ex) {
                errorArray.push(languageStrings[i]);
            }
        }
    }
    translationStringHtml += '</tbody></table>';

    return translationStringHtml;
};

ChatTranslationEditorClass.prototype.createTranslationLanguageEditorHtml = function() {

    var myHtml = '<fieldset class="lzm-fieldset"><legend>'+tid('add_language')+'</legend><div id="translation-string-add-language">';
    var availLangCodes = Object.keys(lzm_chatDisplay.availableLanguages);
    availLangCodes.sort();
    var existingLangCodes = [], langArrayName = (this.selectedTranslationTab == 'mobile_client') ? 'mobile' : 'server', i;
    var langArray = [];

    for (i=0; i<ChatTranslationEditorClass.AvailableLanguages[langArrayName].length; i++)
        existingLangCodes.push(ChatTranslationEditorClass.AvailableLanguages[langArrayName][i].code);

    for (i=0; i<availLangCodes.length; i++)
        if ($.inArray(availLangCodes[i], existingLangCodes) == -1)
            langArray.push(availLangCodes[i]);

    window['add-language'] = new CommonInputControlsClass.TagEditor('add-language',null,false,true,false,true,false,true);
    window['add-language'].DialogTitle = tid('languages');
    window['add-language'].AddTags(parent.ChatTranslationEditorClass.IsoToName(availLangCodes), false);

    myHtml += window['add-language'].GetHTML(false);

    return myHtml + "</div></fieldset>";
};

ChatTranslationEditorClass.prototype.loadTranslationStrings = function(langCode, langName, langChanged) {
    var that = this;

    if (that.serverStringsLoaded)
    {
        langName = (typeof langName != 'undefined') ? langName :
            (typeof lzm_chatDisplay.availableLanguages[langCode] != 'undefined') ? lzm_chatDisplay.availableLanguages[langCode] : langCode;
        langChanged = (typeof langChanged != 'undefined') ? langChanged : 0;
        var translationStrings = [], i = 0, trlStringObject = {};

        if (that.selectedTranslationTab == 'mobile_client')
        {
            var editdelete = (typeof that.saveTranslations[langCode] != 'undefined' && that.saveTranslations[langCode].edit == 1 && that.saveTranslations[langCode].delete == 1);
            that.saveTranslations[langCode] = {code: langCode, name: langName, edit: langChanged, delete: 0, strings: []};
            if (editdelete) {
                that.saveTranslations[langCode].edit = 1;
                that.saveTranslations[langCode].delete = 1;
            }

            for (i=0; i<translationData.length; i++)
            {
                trlStringObject = {key: translationData[i].key, orig: translationData[i].orig};
                if (typeof DataEngine.translationStrings.strings[translationData[i].key] != 'undefined' &&
                    DataEngine.translationStrings.strings[translationData[i].key] != '') {
                    trlStringObject[langCode] = DataEngine.translationStrings.strings[translationData[i].key];
                } else {
                    trlStringObject[langCode] = translationData[i].orig
                }
                translationStrings.push(trlStringObject);
                that.saveTranslations[langCode].strings.push({
                    key: trlStringObject.key,
                    orig: trlStringObject.orig,
                    editedValue: trlStringObject[langCode],
                    savedValue: trlStringObject[langCode]
                });
            }
        } else {
            that.saveTranslations['srv-' + langCode] = {code: langCode, name: langName, edit: langChanged, delete: 0, strings: []};
            for (i=0; i<that.serverStrings.length; i++) {
                trlStringObject = {key: that.serverStrings[i].key, orig: that.serverStrings[i].orig};
                if (typeof DataEngine.translationStrings.strings[that.serverStrings[i].key] != 'undefined' &&
                    DataEngine.translationStrings.strings[that.serverStrings[i].key] != '') {
                    trlStringObject[langCode] = DataEngine.translationStrings.strings[that.serverStrings[i].key];
                } else {
                    trlStringObject[langCode] = that.serverStrings[i].orig
                }
                translationStrings.push(trlStringObject);
                that.saveTranslations['srv-' + langCode].strings.push({
                    key: trlStringObject.key,
                    orig: trlStringObject.orig,
                    editedValue: trlStringObject[langCode],
                    savedValue: trlStringObject[langCode]
                });
            }
        }

        that.languageStrings = lzm_commonTools.clone(translationStrings);
        DataEngine.translationStrings = {key: '', strings: {}};

        removeTranslationStringsLoadingDiv();
        that.showTranslationStrings();
    }
    else
    {
        that.origStringLanguage = DataEngine.translationStrings.key;
        langName = (typeof lzm_chatDisplay.availableLanguages[that.origStringLanguage] != 'undefined') ?
            lzm_chatDisplay.availableLanguages[that.origStringLanguage] : that.origStringLanguage;
        that.saveTranslations['srv-' + that.origStringLanguage] = {code: that.origStringLanguage, edit: 0, delete: 0, name: langName, strings: []};
        for (var translationKey in DataEngine.translationStrings.strings) {
            if (DataEngine.translationStrings.strings.hasOwnProperty(translationKey)) {
                var myString = DataEngine.translationStrings.strings[translationKey];
                that.serverStrings.push({key: translationKey, orig: myString});
                that.saveTranslations['srv-' + that.origStringLanguage].strings.push({orig: myString, key: translationKey, editedValue: myString, savedValue: myString});
            }
        }
        that.serverStringsLoaded = true;
        DataEngine.translationStrings = {key: '', strings: {}};
        removeTranslationStringsLoadingDiv();
    }
};

ChatTranslationEditorClass.prototype.LoadTranslationLanguages = function() {
    ChatTranslationEditorClass.AvailableLanguages = {mobile: [], server: []};
    var showEnglish = true, showGerman = true;
    for (var i=0; i<DataEngine.translationLanguages.length; i++) {
        if (DataEngine.translationLanguages[i].m == 0 && DataEngine.translationLanguages[i].blocked == 0) {
            ChatTranslationEditorClass.AvailableLanguages.server.push({
                code: DataEngine.translationLanguages[i].key,
                edit: 1,
                name: lzm_chatDisplay.availableLanguages[DataEngine.translationLanguages[i].key]
            });
        } else if (DataEngine.translationLanguages[i].m == 1 && DataEngine.translationLanguages[i].blocked == 0) {
            ChatTranslationEditorClass.AvailableLanguages.mobile.push({
                code: DataEngine.translationLanguages[i].key,
                edit: 1,
                name: lzm_chatDisplay.availableLanguages[DataEngine.translationLanguages[i].key]
            });
        }
        if (DataEngine.translationLanguages[i].m == 1 && DataEngine.translationLanguages[i].key == 'en') {
            showEnglish = false;
        } else if (DataEngine.translationLanguages[i].m == 1 && DataEngine.translationLanguages[i].key == 'de') {
            showGerman = false;
        }
    }
    if (showEnglish) {
        ChatTranslationEditorClass.AvailableLanguages.mobile.push({
            code: 'en',
            edit: 0,
            name: lzm_chatDisplay.availableLanguages['en']
        });
    }
    if (showGerman) {
        ChatTranslationEditorClass.AvailableLanguages.mobile.push({
            code: 'de',
            edit: 0,
            name: lzm_chatDisplay.availableLanguages['de']
        });
    }
};

ChatTranslationEditorClass.prototype.saveTranslationFiles = function() {
    var that = this, langKey, translatedString, i = 0, j = 0;
    var saveTranslations = lzm_commonTools.clone(that.saveTranslations);
    var myDataObject = {};

    for (langKey in saveTranslations)
    {
        if (saveTranslations.hasOwnProperty(langKey))
        {
            if (saveTranslations[langKey].edit == 1)
            {
                var contentString = '', langFileString = '';

                /*
                for (i=0; i<saveTranslations[langKey].strings.length; i++)
                {
                    translatedString = saveTranslations[langKey].strings[i].editedValue.replace(/\\/g, '\\\\').replace(/'/g, '\\\'').replace(/\n/g, '\\n').replace(/\r/g, '\\r');
                    contentString += '$LZLANG["' + saveTranslations[langKey].strings[i].key + '"] = \'' + translatedString + '\';\r\n';
                }
                */

                if (saveTranslations[langKey].delete != 1)
                {

                }
                else
                {
                    langFileString = '';
                }

                //var parts = langFileString.match(/(.|[\r\n]){1,4000}/g);
                var parts = JSON.stringify(saveTranslations[langKey].strings).match(/(.|[\r\n]){1,4000}/g);

                myDataObject[langKey] = {
                    i: saveTranslations[langKey].code.toLowerCase(),
                    c: parts,
                    m: (langKey.indexOf('srv-') == -1) ? 1 : 0,
                    d: saveTranslations[langKey].delete
                };
                if ($.inArray(langKey, that.defaultLanguages) != -1)
                {
                    that.newTranslationLanguages.push({code: langKey, type: 'mobile'});
                }
            }
        }
    }
    for (i=0; i<that.newTranslationLanguages.length; i++)
    {
        var addThisLanguage = true;
        for (j=0; j<DataEngine.translationLanguages.length; j++)
        {
            if (DataEngine.translationLanguages[j].key == that.newTranslationLanguages[i].code &&
                ((DataEngine.translationLanguages[j].m == 1 && that.newTranslationLanguages[i].type == 'mobile') ||
                    DataEngine.translationLanguages[j].m == 0 && that.newTranslationLanguages[i].type == 'server'))
            {
                addThisLanguage = false;
            }
        }
        if (addThisLanguage) {
            var thisLanguage = {blocked: 0, key: that.newTranslationLanguages[i].code, m: (that.newTranslationLanguages[i].type == 'mobile') ? 1 : 0, derived: 0};
            DataEngine.translationLanguages.push(thisLanguage);
        }
    }
    var tmpTranslationLanguages = [];
    for (i=0; i<DataEngine.translationLanguages.length; i++) {
        var deleteThisLanguage = false;
        for (j=0; j<that.removedTranslationLanguages.length; j++) {
            if (DataEngine.translationLanguages[i].key == that.removedTranslationLanguages[j].code &&
                ((DataEngine.translationLanguages[i].m == 1 && that.removedTranslationLanguages[j].type == 'mobile') ||
                    DataEngine.translationLanguages[i].m == 0 && that.removedTranslationLanguages[j].type == 'server')) {
                deleteThisLanguage = true;
            }
        }
        if (!deleteThisLanguage) {
            tmpTranslationLanguages.push(DataEngine.translationLanguages[i]);
        }
    }
    DataEngine.translationLanguages = tmpTranslationLanguages;
    CommunicationEngine.pollServerSpecial(myDataObject, 'save-translation');
};

ChatTranslationEditorClass.prototype.contactLzTranslationServer = function(myTab, action, postParams) {
    var that = this;
    var translationServerUrl = 'https://translate.livezilla.info/com/translation.php?' +
        'product_version=' + lzm_commonConfig.lz_version;
    if (action == 'download')
        showTranslationStringsLoadingDiv();
    $.ajax({
        type: "POST",
        url: translationServerUrl,
        data: postParams,
        timeout: lzm_commonConfig.pollTimeout,
        dataType: 'text'
    }).done(function(data) {
        if (action == 'download') {
            if (data != '') {
                try {
                    var xmlDoc = $.parseXML($.trim(data));
                    $(xmlDoc).find('values').each(function() {
                        var translationValues = {};
                        var values = $(this);
                        values.children('value').each(function() {
                            var myKey = $(this).attr('key');
                            var myValue = lz_global_base64_url_decode($(this).text());
                            translationValues[myKey] = myValue;
                        });
                        var idPrefix = (myTab == 'server') ? 'srv-' : '', langKey = postParams.iso.toLowerCase(), savedKey = '', savedValue = '', i = 0;
                        var doFillLanguageStrings = (that.languageStrings.length == 0);
                        for (i=0; i<that.saveTranslations[idPrefix + langKey].strings.length; i++)
                        {
                            savedKey = that.saveTranslations[idPrefix + langKey].strings[i].key;
                            savedValue = (typeof translationValues[savedKey] != 'undefined') ? translationValues[savedKey] :
                                that.saveTranslations[idPrefix + langKey].strings[i].editedValue;
                            that.saveTranslations[idPrefix + langKey].strings[i].editedValue = savedValue;
                            that.saveTranslations[idPrefix + langKey].strings[i].savedValue = savedValue;
                            if (doFillLanguageStrings)
                            {
                                var langStringObj = {key: savedKey, orig: that.saveTranslations[idPrefix + langKey].strings[i].orig};
                                langStringObj[langKey] = translationValues[savedKey];
                                that.languageStrings.push(langStringObj);
                            }
                        }
                        that.saveTranslations[idPrefix + langKey].edit = 1;
                        that.saveTranslations[idPrefix + langKey].delete = 0;
                        for (i=0; i<that.languageStrings.length; i++) {
                            savedKey = that.languageStrings[i].key;
                            savedValue = (typeof translationValues[savedKey] != 'undefined') ? translationValues[savedKey] :
                                that.saveTranslations[idPrefix + langKey].strings[i].editedValue;
                            that.languageStrings[i][langKey] = savedValue;
                        }
                        that.showTranslationStrings();
                    });
                } catch(ex) {
                    deblog(ex.stack);
                }
            }
            else
            {
                that.showTranslationStrings();
            }
            removeTranslationStringsLoadingDiv();
            $('#save-translation-editor').removeClass('ui-disabled');
            $('#apply-translation-editor').removeClass('ui-disabled');
        }
    }).fail(function(jqXHR, textStatus, errorThrown) {

        var errorText = 'An error occured';
        lzm_commonDialog.createAlertDialog(errorText, [{id: 'ok', name: t('Ok')}]);
        $('#alert-btn-ok').click(function() {
            if(action == 'download')
                that.showTranslationStrings();
            lzm_commonDialog.removeAlertDialog();
            removeTranslationStringsLoadingDiv();
            $('#save-translation-editor').removeClass('ui-disabled');
            $('#apply-translation-editor').removeClass('ui-disabled');
        });
        deblog(jqXHR);
        deblog(textStatus);
        deblog(errorThrown);
    });
};


function selectTranslationLanguage(language, langName, langEdit, changed, translationTab, isNew) {

    isNew = (typeof isNew != 'undefined') ? isNew : false;
    var idPrefix = (translationTab == 'server') ? 'srv-' : '';

    if (translationTab == 'server')
    {
        lzm_chatDisplay.translationEditor.selectedLanguages.server = language;
    }
    else if (translationTab == 'mobile_client')
    {
        lzm_chatDisplay.translationEditor.selectedLanguages.mobile = language;
    }

    if (language != '')
    {
        try
        {
            selectTranslationLine('');
        }
        catch(ex)
        {}

        if ($.inArray(language, lzm_chatDisplay.translationEditor.defaultLanguages) != -1)
        {
            $('#' + idPrefix + 'translation-language-delete').addClass('ui-disabled');
        }
        else
        {
            $('#' + idPrefix + 'translation-language-delete').removeClass('ui-disabled');
        }

        $('#' + idPrefix + 'translation-language-edit').removeClass('ui-disabled');
        lzm_chatDisplay.translationEditor.languageCode = language;
        lzm_chatDisplay.translationEditor.languageName = langName;
        $('.translation-language-line').removeClass('selected-table-line');
        $('#' + idPrefix + 'translation-language-line-' + language).addClass('selected-table-line');
        lzm_chatDisplay.translationEditor.selectedTranslationTab = translationTab;

        var myPollDataObject = {l: (language != 'en' || langEdit == 1) ? language : 'orig', m: (translationTab == 'server') ? 0 : 1, o: 1 - langEdit};
        var saveTranslations = lzm_commonTools.clone(lzm_chatDisplay.translationEditor.saveTranslations);

        if (typeof saveTranslations[idPrefix + language] == 'undefined' ||
            typeof saveTranslations[idPrefix + language].strings == 'undefined' ||
            saveTranslations[idPrefix + language].strings.length == 0) {
            showTranslationStringsLoadingDiv();
            CommunicationEngine.pollServerSpecial(myPollDataObject, 'load-translation');
        }
        else
        {
            if (!isNew)
                lzm_chatDisplay.translationEditor.showTranslationStrings();
            else
                downloadTranslationLanguage(translationTab);
        }
    }
    else
    {
        $('.translation-language-line').removeClass('selected-table-line');
        lzm_chatDisplay.translationEditor.showTranslationStrings();
    }
}

function suggestTranslationLanguage(myTab) {
    var lng = lzm_chatDisplay.translationEditor.languageCode, idPrefix = (myTab == 'server') ? 'srv-' : '';
    var postParams = {iso: lng.toUpperCase(), sid: CommunicationEngine.loginId,
        version: lzm_commonConfig.lz_version};

    if(!ChatTranslationEditorClass.UploadDefaults)
        if(lng.toUpperCase()=='EN'||lng.toUpperCase()=='DE')
            return;

    if (myTab == 'server')
        postParams.upload = 1;
    else
        postParams.mobile_upload = 1;

    if(d(lzm_chatDisplay.translationEditor.saveTranslations[idPrefix + lng]))
        var translationStrings = lzm_commonTools.clone(lzm_chatDisplay.translationEditor.saveTranslations[idPrefix + lng].strings);
        for (var i=0; i<translationStrings.length; i++)
        {
            if (translationStrings[i].key.indexOf('client_custom_') == -1
                && translationStrings[i].editedValue.replace(/^ +/, '') != ''
                && (translationStrings[i].editedValue != translationStrings[i].orig || lng.toUpperCase()=='EN')
                )
            {
                postParams['tk_' + translationStrings[i].key] = translationStrings[i].editedValue;
            }
        }

    lzm_chatDisplay.translationEditor.contactLzTranslationServer(myTab, 'upload', postParams);
}

function downloadTranslationLanguage(myTab) {
    var idPrefix = (myTab == 'server') ? 'srv-' : '';
    $('#translation-string-table').remove();
    var lng = lzm_chatDisplay.translationEditor.languageCode;
    var postParams = {iso: lng.toUpperCase(), sid: CommunicationEngine.loginId};
    if (myTab == 'server')
    {
        postParams.download = 1;
    }
    else
    {
        postParams.mobile_download = 1;
    }
    lzm_chatDisplay.translationEditor.contactLzTranslationServer(myTab, 'download', postParams);
}

function translationSearchFieldKeyUp(myTab) {
    var idPrefix = (myTab == 'server') ? 'srv-' : '';
    var searchString = $('#' + idPrefix + 'translation-search-string').val();
    lzm_chatDisplay.translationEditor.lastSearchCharacterTyped = lzm_chatTimeStamp.getServerTimeString(null, true, 1);
    setTimeout(function() {
        var now = lzm_chatTimeStamp.getServerTimeString(null, true, 1);
        if (now - lzm_chatDisplay.translationEditor.lastSearchCharacterTyped > 500) {
            if (lzm_chatDisplay.translationEditor.languageCode != '' && lzm_chatDisplay.translationEditor.selectedTranslationTab == myTab) {
                lzm_chatDisplay.translationEditor.showTranslationStrings(searchString);
            }
        }
    }, 505);
}

function deleteTranslationLanguage(myTab) {
    lzm_chatDisplay.translationEditor.deleteTranslationLanguage(myTab);
}

function saveTranslations() {
    selectTranslationLine('');
    lzm_chatDisplay.translationEditor.saveTranslationFiles();
}

function editTranslationLanguage(myTab) {
    lzm_chatDisplay.translationEditor.addTranslationLanguage('edit', myTab);
}


ChatTranslationEditorClass.GetLanguageNameList = function(){

    var list = [];
    for(var key in lzm_chatDisplay.availableLanguages)
        list.push(lzm_chatDisplay.availableLanguages[key]);

    return list;
};

ChatTranslationEditorClass.IsoToName = function(_obj){

    var list = [];
    if(typeof _obj == 'string')
    {
        _obj = _obj.split(',');
    }

    if(Array.isArray(_obj))
    {
        for(var a in _obj)
            for(var b in lzm_chatDisplay.availableLanguages)
                if(_obj[a] == b)
                    list.push(lzm_chatDisplay.availableLanguages[b]);

    }
    return list;
};

ChatTranslationEditorClass.NameToIso = function(_obj, _outputString){

    var list = [];
    if(typeof _obj == 'string')
    {
        _obj = _obj.split(',');
    }

    if(Array.isArray(_obj))
    {
        for(var a in _obj)
            for(var b in lzm_chatDisplay.availableLanguages)
            {
                if($.trim(_obj[a]) == lzm_chatDisplay.availableLanguages[b])
                    list.push(b);
            }
    }

    if(_outputString)
    {
        return list.join(',');
    }
    return list;
};

ChatTranslationEditorClass.EditString = function(myKey, e) {
    e.stopPropagation();
    selectTranslationLine(myKey);

    var languageCode = (lzm_chatDisplay.translationEditor.selectedTranslationTab == 'mobile_client') ?
        lzm_chatDisplay.translationEditor.languageCode : 'srv-' + lzm_chatDisplay.translationEditor.languageCode;

    var languageStrings = lzm_commonTools.clone(lzm_chatDisplay.translationEditor.saveTranslations[languageCode].strings);
    for (var i=0; i<languageStrings.length; i++) {
        if (languageStrings[i].key == myKey) {
            var existingTranslation = languageStrings[i].editedValue;
            var inputFieldHtml = '<textarea id="translation-string-input" onclick="ChatTranslationEditorClass.DoNotSelectTranslationLine(event);" onkeyup="ChatTranslationEditorClass.TranslationEditorEnterPressed(event);"' + ' class="lzm-text-input nic"></textarea>';

            $('#translation-translated-string-' + myKey).html(inputFieldHtml).trigger('create');
            $('#translation-string-input').val(existingTranslation);

            var ___resize = function() {

                var scroll_height = $('#translation-string-input').get(0).scrollHeight;
                var currHeight = parseInt($('#translation-string-input').css('height').replace('px',''));

                $('#translation-string-input').css('height', Math.max(currHeight,scroll_height) + 'px');
            };

            $('#translation-string-input').on('input', ___resize);

            ___resize();
        }
    }
};

ChatTranslationEditorClass.TranslationEditorEnterPressed = function(e) {

    var keyCode = (typeof e.which != 'undefined') ? e.which : e.keyCode;
    if (keyCode == 13 && !e.shiftKey && !e.ctrlKey)
        selectTranslationLine('');
};

ChatTranslationEditorClass.DoNotSelectTranslationLine = function(e) {
    e.stopPropagation();
};

ChatTranslationEditorClass.GetFirst = function(_isoList){

    if(d(_isoList) && _isoList.length)
    {
        _isoList = _isoList.toString().toLowerCase();
        if(_isoList.indexOf(',') !== -1)
            return $.trim(_isoList.split(',')[0]);
    }
    return '';
};

