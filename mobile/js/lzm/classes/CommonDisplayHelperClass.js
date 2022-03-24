/****************************************************************************************
 * LiveZilla CommonDisplayHelperClass.js
 *
 * Copyright 2014 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/

function CommonDisplayHelperClass(appOs) {
    this.appOs = appOs;
}

CommonDisplayHelperClass.prototype.createSelect = function(myId, myClass, myAction, myText, myIcon, myCss, myTitle, myOptionList, mySelectedOption, myLayoutType) {
    return lzm_inputControls.createSelect(myId, myClass, myAction, myText, myIcon, myCss, myTitle, myOptionList, mySelectedOption, myLayoutType);
};

CommonDisplayHelperClass.prototype.createSelectChangeHandler = function(myId, myOptions) {
    lzm_inputControls.createSelectChangeHandler(myId, myOptions);
};

CommonDisplayHelperClass.prototype.addBrowserSpecificGradient = function(imageString, color) {
    var a, b;
    switch (color) {
        case 'darkorange':
            a = '#FDB867';
            b = '#EDA148';
            break;
        case 'orange':
            a = '#FFCC73';
            b = '#FDB867';
            break;
        case 'darkgray':
            a = '#F6F6F6';
            b = '#E0E0E0';
            break;
        case 'blue':
            a = '#5197ff';
            b = '#6facd5';
            break;
        case 'background':
            a = '#e9e9e9';
            b = '#dddddd';
            break;
        case 'darkViewSelect':
            a = '#999999';
            b = '#797979';
            break;
        case 'selectedViewSelect':
            a = '#6facd5';
            b = '#5197ff';
            break;
        case 'tabs':
            a = '#d9d9d9';
            b = '#898989';
            break;
        default:
            a = '#FFFFFF';
            b = '#F1F1F1';
            break;
    }
    var gradientString = imageString;
    var cssTag = '';
    switch (this.appOs) {
        case 'windows':
            cssTag = '-ms-linear-gradient';
            break;
        case 'ios':
            cssTag = '-webkit-linear-gradient';
            break;
        case 'android':
        case 'blackberry':
            cssTag = '-webkit-linear-gradient';
            break;
        default:
            cssTag = 'linear-gradient';
            break;
    }
    switch (imageString) {
        case '':
            gradientString = cssTag + '(' + a + ',' + b + ')';
            break;
        case 'text':
            gradientString = 'background-image: ' + cssTag + '(' + a + ',' + b + ')';
            break;
        default:
            gradientString += ', ' + cssTag + '(' + a + ',' + b + ')';
            break;
    }
    return gradientString
};