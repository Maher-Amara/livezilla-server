/****************************************************************************************
 * LiveZilla CommonTranslationClass.js
 *
 * Copyright 2013 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/

/**
 *
 * @constructor
 */
function CommonTranslationClass(protocol, url, mobileDir, runningFromApp, language) {
    this.translationArray = [];
    this.protocol = protocol;
    this.url = url;
    this.mobileDir = mobileDir;
    this.availableLanguages = [];
    this.language = 'en';
    if (typeof language != 'undefined' && language != 'undefined' && language != '')
    {
        this.language = language
    }
    else if (typeof navigator.language != 'undefined') {
        this.language = navigator.language;
    }
    else if (typeof navigator.userLanguage != 'undefined') {
        this.language = navigator.userLanguage;
    }
    if (this.language.indexOf('-') != -1)
    {
        this.language = this.language.split('-')[0] + '-' + this.language.split('-')[1].toLowerCase();
    }
    else if (this.language.indexOf('_') != -1)
    {
        this.language = this.language.split('_')[0] + '-' + this.language.split('_')[1].toLowerCase();
    }
}

CommonTranslationClass.prototype.translate = function(translateString, placeholderArray) {
    var translatedString = translateString;
    var notInArray = true;
    for (var stringIndex=0; stringIndex<this.translationArray.length; stringIndex++) {
        if (this.translationArray[stringIndex]['orig'] == translateString) {
            if (this.translationArray[stringIndex][this.language] != null)
                translatedString =  this.translationArray[stringIndex][this.language];
            notInArray = false;
            break;
        }
    }
    if (typeof placeholderArray != 'undefined') {
        for (var i=0; i<placeholderArray.length; i++) {
            translatedString = this.stringReplace(translatedString, placeholderArray[i][0], placeholderArray[i][1]);
        }
    }
    return translatedString;
};

CommonTranslationClass.prototype.getById = function(id, placeholderArray) {
    var translatedString = 'Missing string: id';
    var notInArray = true;

    for (var stringIndex=0; stringIndex<this.translationArray.length; stringIndex++) {
        if (this.translationArray[stringIndex]['key'] == 'mobile_'+id)
        {
            if (this.translationArray[stringIndex][this.language] != null)
                translatedString =  this.translationArray[stringIndex][this.language];
            notInArray = false;
            break;
        }
    }
    if (typeof placeholderArray != 'undefined') {
        for (var i=0; i<placeholderArray.length; i++) {
            translatedString = this.stringReplace(translatedString, placeholderArray[i][0], placeholderArray[i][1]);
        }
    }
    return translatedString;
};

CommonTranslationClass.prototype.KeyExists = function(id) {
    for (var stringIndex=0; stringIndex<this.translationArray.length; stringIndex++) {
        if (this.translationArray[stringIndex]['key'] == 'mobile_'+id)
            return true;
    }
    return false;
};

CommonTranslationClass.prototype.stringReplace = function(myString, placeholder, replacement) {
    return myString.replace(placeholder, replacement);
};

CommonTranslationClass.prototype.setTranslationData = function(translationData) {
    var that = this;
    that.translationArray = translationData;

    if (typeof translationData[0][that.language] == 'undefined' && that.language.indexOf('-') != -1)
    {
        that.language = that.language.split('-')[0];
    }
    setTimeout(function(){
        if(typeof IFManager != 'undefined' && IFManager.IsDesktopApp() && typeof(IFManager.DeviceInterface.hasModule) != 'undefined' && IFManager.DeviceInterface.hasModule('lz-localization')){
            IFManager.IFTranslationData(that);
        }
    },10000)


};
