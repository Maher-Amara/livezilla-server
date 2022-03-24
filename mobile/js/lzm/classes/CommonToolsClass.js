/****************************************************************************************
 * LiveZilla CommonToolsClass.js
 *
 * Copyright 2017 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/

function CommonToolsClass() {
    this.ticketSalutations = {};
    this.permissions = [];
}

RegExp.escape = function(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

CommonToolsClass.prototype.pad = function (number, length, paddingSymbol, paddingSide) {
    if (typeof paddingSymbol == 'undefined' || paddingSymbol == '') {
        paddingSymbol = '0';
    } else if (paddingSymbol == '&nbsp;') {
        paddingSymbol = '°'
    }
    if (typeof paddingSide == 'undefined' || paddingSide == '')
        paddingSide = 'l';
    var str = String(number);
    while (str.length < length) {
        if (paddingSide == 'l')
            str = paddingSymbol + str;
        else
            str = str + paddingSymbol;
    }
    str=str.replace(/°/g,"&nbsp;");
    return str;
};

CommonToolsClass.prototype.clone = function (originalObject) {
    try
    {
        if(!d(originalObject))
            return null;
        var origJsonString = JSON.stringify(originalObject);
        var copyJsonString = origJsonString;
        var copyObject = JSON.parse(copyJsonString);
        return copyObject;
    }
    catch(ex)
    {

    }
    return originalObject;
};

CommonToolsClass.prototype.parseUrl = function (url) {
    var a = document.createElement('a');
    a.href = url;
    return a;
};

CommonToolsClass.prototype.getUrlParts = function (thisUrl, urlOffset) {
    thisUrl = (typeof thisUrl != 'undefined') ? thisUrl : document.URL;
    urlOffset = (typeof urlOffset != 'undefined') ? urlOffset : 'undefined';

    if (thisUrl.indexOf('#') != -1)
    {
        thisUrl = document.URL.split('#')[0];
    }

    var thisUrlParts = thisUrl.split('://');
    var thisProtocol = thisUrlParts[0] + '://';

    thisUrlParts = thisUrlParts[1].split('/');
    var thisUrlRest = '', thisMobileDir = '';
    if (urlOffset == 'undefined') {
        urlOffset = 1;
        if (thisUrlParts[thisUrlParts.length - 1].indexOf('html') != -1 || thisUrlParts[thisUrlParts.length - 1].indexOf('php') != -1 || thisUrlParts[thisUrlParts.length - 1] == '') {
            urlOffset = 2;
        }
    }
    for (var i = 1; i < (thisUrlParts.length - urlOffset); i++) {
        thisUrlRest += '/' + thisUrlParts[i];
    }
    thisMobileDir = thisUrlParts[thisUrlParts.length - urlOffset];

    var thisUrlBase = '';
    var thisPort = '';
    if (thisUrlParts[0].indexOf(':') == -1) {
        thisUrlBase = thisUrlParts[0];
        if (thisProtocol == 'https://') {
            thisPort = '443';
        } else {
            thisPort = '80';
        }
    } else {
        thisUrlParts = thisUrlParts[0].split(':');
        thisUrlBase = thisUrlParts[0];
        thisPort = thisUrlParts[1];
    }
    return {protocol:thisProtocol, urlBase:thisUrlBase, urlRest:thisUrlRest, port:thisPort, mobileDir: thisMobileDir};
};

CommonToolsClass.prototype.createDefaultProfile = function (runningFromApp, chosenProfile) {
    var that = this;
    if (runningFromApp == false && (chosenProfile == -1 || chosenProfile == null)) {
        this.storageData = [];
        var indexes = lzm_commonStorage.loadValue('indexes');
        var indexList = [];
        if (indexes != null && indexes != '') {
            indexList = indexes.split(',');
        }
        if ($.inArray('0', indexList) == -1) {
            var thisUrlParts = that.getUrlParts();
            var dataSet = {};
            dataSet.index = 0;
            dataSet.server_profile = 'Default profile';
            dataSet.server_protocol = thisUrlParts.protocol;
            dataSet.server_url = thisUrlParts.urlBase + thisUrlParts.urlRest;
            dataSet.mobile_dir = thisUrlParts.mobileDir;
            dataSet.server_port = thisUrlParts.port;
            dataSet.login_name = '';
            dataSet.login_passwd = '';
            dataSet.ldap_login = false;
            dataSet.auto_login = 0;
            if (indexes != null && indexes != '') {
                lzm_commonStorage.saveValue('indexes', '0,' + indexes);
            } else {
                lzm_commonStorage.saveValue('indexes', '0');
            }
            lzm_commonStorage.saveProfile(dataSet);
        }
    }
};

CommonToolsClass.prototype.getHumanDate = function(dateObject, returnType) {

    var year = (dateObject instanceof Array) ? dateObject[0] : dateObject.getFullYear();
    var month = (dateObject instanceof Array) ? this.pad(dateObject[1], 2) : this.pad((dateObject.getMonth() + 1), 2);
    var day = (dateObject instanceof Array) ? this.pad(dateObject[2], 2) : this.pad(dateObject.getDate(), 2);
    var hours =  (dateObject instanceof Array) ? this.pad(dateObject[3], 2) : this.pad(dateObject.getHours(), 2);
    var minutes = (dateObject instanceof Array) ? this.pad(dateObject[4], 2) : this.pad(dateObject.getMinutes(), 2);
    var seconds = (dateObject instanceof Array) ? this.pad(dateObject[5], 2) : this.pad(dateObject.getSeconds(), 2);
    var monthNames = [t('January'), t('February'), t('March'), t('April'), t('May'), t('June'), t('July'), t('August'), t('September'), t('October'), t('November'), t('December')];
    var dateYear = monthNames[parseInt(month) - 1] + ' ' + year;
    var date = t('<!--year-->-<!--month-->-<!--day-->',[['<!--year-->', year], ['<!--month-->', month], ['<!--day-->', day]]);
    var longDate = t('<!--month_name--> <!--day-->, <!--year-->',[['<!--month_name-->', monthNames[parseInt(month) -1]], ['<!--day-->', day], ['<!--year-->', year]]);
    var returnValue = '';

    switch (returnType)
    {
        case 'mobile':
            returnValue = date;
            if(year == new Date().getFullYear())
                if(month == new Date().getMonth()+1)
                    if(day == new Date().getDay()+1)
                        returnValue = hours + ':' + minutes;
            break;
        case 'time':
            returnValue = hours + ':' + minutes + ':' + seconds;
            break;
        case 'shorttime':
            returnValue = hours + ':' + minutes;
            break;
        case 'date':
            returnValue = date;
            break;
        case 'longdate':
            returnValue = longDate;
            break;
        case 'dateyear':
            returnValue = dateYear;
            break;
        case 'iso':
            returnValue = year + '-' + month + '-' + day;
            break;
        default:
            returnValue = date + ' ' + hours + ':' + minutes + ':' + seconds;
    }
    return returnValue;
};

CommonToolsClass.prototype.getHumanTimeSpan = function(seconds,_hideHours) {
    var humanTimeSpan = 0;
    if (!isNaN(seconds) && seconds > 0)
    {
        var days = Math.floor(seconds / (3600 * 24));
        var remainingSeconds = seconds % (3600 * 24);

        if(!_hideHours)
        {
            var hours = this.pad(Math.floor(remainingSeconds / 3600), 2, '0', 'l');
            remainingSeconds = remainingSeconds % 3600;
        }

        var minutes = this.pad(Math.floor(remainingSeconds / 60), 2, '0', 'l');
        seconds = this.pad(remainingSeconds % 60, 2, '0', 'l');
        humanTimeSpan = (days > 0) ? days + ' ' : '';

        if(!_hideHours)
            humanTimeSpan += hours + ':' + minutes + ':' + seconds;
        else
            humanTimeSpan += minutes + ':' + seconds;
    }
    return humanTimeSpan;
};

CommonToolsClass.prototype.htmlEntities = function(str) {
    var escapedString = String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    return escapedString;
};

CommonToolsClass.prototype.checkTicketReadStatus = function(ticketId, statusArray, tickets) {
    tickets = (typeof tickets != 'undefined') ? tickets : [];

    var thisTicket = {id: ''};
    var ticketIsInArray = -1;
    for (var i=0; i<tickets.length; i++) {
        if (tickets[i].id == ticketId) {
            thisTicket = tickets[i];
        }
    }
    for (var j=0; j<statusArray.length; j++) {
        if (statusArray[j].id == ticketId) {
            ticketIsInArray = j;
        }
    }
    if (ticketIsInArray != -1 && thisTicket.id != '' && thisTicket.u > statusArray[ticketIsInArray].timestamp) {
        ticketIsInArray = -1
    }

    return ticketIsInArray;
};

CommonToolsClass.prototype.removeTicketFromReadStatusArray = function(ticketId, statusArray, doNotLog) {
    doNotLog = (typeof doNotLog != 'undefined') ? doNotLog : false;
    var tmpArray = [];
    for (var i=0; i<statusArray.length; i++) {
        if (statusArray[i].id != ticketId && statusArray[i].id != '') {
            tmpArray.push(statusArray[i]);
        }
    }
    return tmpArray;
};

CommonToolsClass.prototype.addTicketToReadStatusArray = function (ticket, statusArray, myTickets) {
    var ticketId = (typeof ticket == 'object') ? ticket.id : ticket;
    var ticketU = (typeof ticket == 'object') ? parseInt(ticket.u) : 0;
    var tmpArray = this.clone(statusArray);
    var timestamp = Math.max(lzm_chatTimeStamp.getServerTimeString(null, true), ticketU);
    if (this.checkTicketReadStatus(ticketId, tmpArray, myTickets) == -1 && ticketId != '')
    {
        tmpArray.push({id: ticketId, timestamp: timestamp});
    }
    return tmpArray;
};

CommonToolsClass.prototype.getTicketSalutationFields = function(ticket, messageNo) {
    var initialSalutations = {};
    var savedSalutations = lzm_commonStorage.loadValue('ticket_salutations_' + DataEngine.myId);
    if (savedSalutations == null || savedSalutations == '') {
        initialSalutations[DataEngine.userLanguage] = {
            'first name': [0],
            'last name': [0],
            'salutation': [0, [[t('Hi'), 1]]],
            'title': [-1, []],
            'introduction phrase': [0, [[t('Thanks for getting in touch with us.'), 1]]],
            'closing phrase': [0, [[t('If you have any questions, do not hesitate to contact us.'),1]]],
            'punctuation mark': [0, [[',', 1]]]
        };
    }
    if (savedSalutations == null || savedSalutations == '')
    {
        this.ticketSalutations = this.clone(initialSalutations);
    }
    else
    {
        this.ticketSalutations = JSON.parse(savedSalutations);
    }

    return this.createOrderedSalutationObject(ticket, messageNo);
};

CommonToolsClass.prototype.saveTicketSalutations = function (salutationFields, language) {
    var fieldNames = ['salutation', 'title', 'introduction phrase', 'closing phrase', 'punctuation mark'], i;
    if (typeof this.ticketSalutations[language] != 'undefined') {
        if (salutationFields['first name'][0]) {
            try {
                this.ticketSalutations[language]['first name'][0] += 1;
            } catch(e) {deblog(e);}
        } else {
            try {
                this.ticketSalutations[language]['first name'][0] -= 1;
            } catch(e) {deblog(e);}
        }
        if (salutationFields['last name'][0]) {
            try {
                this.ticketSalutations[language]['last name'][0] += 1;
            } catch(e) {deblog(e);}
        } else {
            try {
                this.ticketSalutations[language]['last name'][0] -= 1;
            } catch(e) {deblog(e);}
        }
        for (i=0; i<fieldNames.length; i++)
        {
            var text =  salutationFields[fieldNames[i]][1].replace(/ *$/, '').replace(/^ */, '');
            if (text != '' || fieldNames[i] == 'punctuation mark') {
                var salutationTextPosition = this.salutationTextExists(fieldNames[i], text, language);
                if (salutationTextPosition == -1) {
                    if (salutationFields[fieldNames[i]][0]) {
                        this.ticketSalutations[language][fieldNames[i]][1].push([text, 1]);
                        try {
                            this.ticketSalutations[language][fieldNames[i]][0] += 1;
                        } catch(e) {}
                    } else {
                        try {
                            this.ticketSalutations[language][fieldNames[i]][0] -= 1;
                        } catch(e) {}
                    }
                } else {
                    if (salutationFields[fieldNames[i]][0]) {
                        try {
                            this.ticketSalutations[language][fieldNames[i]][1][salutationTextPosition][1] += 1;
                        } catch(e) {}
                        try {
                            this.ticketSalutations[language][fieldNames[i]][0] += 1;
                        } catch(e) {}
                    } else {
                        try {
                            this.ticketSalutations[language][fieldNames[i]][0] -= 1;
                        } catch(e) {}
                    }
                }
            } else {
                try {
                    this.ticketSalutations[language][fieldNames[i]][0] -= 1;
                } catch(e) {}
            }
        }
    }
    else
    {
        this.ticketSalutations[language] = {};
        if (salutationFields['first name'][0])
        {
            this.ticketSalutations[language]['first name'] = [0];
        }
        else
        {
            this.ticketSalutations[language]['first name'] = [-1];
        }
        if (salutationFields['last name'][0])
        {
            this.ticketSalutations[language]['last name'] = [0];
        }
        else
        {
            this.ticketSalutations[language]['last name'] = [-1];
        }
        for (i=0; i<fieldNames.length; i++) {
            if (salutationFields[fieldNames[i]][1].replace(/ *$/, '').replace(/^ */, '') != '' || fieldNames[i] == 'punctuation mark') {
                if (salutationFields[fieldNames[i]][0]) {
                    this.ticketSalutations[language][fieldNames[i]] = [0, [[salutationFields[fieldNames[i]][1], 1]]];
                } else {
                    this.ticketSalutations[language][fieldNames[i]] = [-1, []];
                }
            } else {
                this.ticketSalutations[language][fieldNames[i]] = [-1, []];
            }
        }
    }

    for (i=0; i<fieldNames.length; i++)
    {
        try
        {
            this.ticketSalutations[language][fieldNames[i]][1].sort(this.salutationSortFunction);
        }
        catch(e)
        {
            deblog(e);
        }
    }
    lzm_commonStorage.saveValue('ticket_salutations_' + DataEngine.myId, JSON.stringify(this.ticketSalutations));
};

CommonToolsClass.prototype.deleteTicketSalutation = function(salutationField, salutationString) {
    var savedSalutations = lzm_commonStorage.loadValue('ticket_salutations_' + DataEngine.myId);
    if (savedSalutations != null && savedSalutations != '') {
        savedSalutations = JSON.parse(savedSalutations);
        var salutationSelectIds = {
            'tr-greet': 'salutation',
            'tr-title': 'title',
            'tr-intro': 'introduction phrase',
            'tr-close': 'closing phrase'
        };
        if (typeof salutationSelectIds[salutationField] != 'undefined')
        {
            $('.' + salutationField + '-selectoption').each(function() {
                if($(this).html().replace(/<span class="lzm-delete-menu-item".*?span>/, '') == salutationString)
                    $(this).remove();
            });
            for (var language in savedSalutations)
            {
                if (savedSalutations.hasOwnProperty(language))
                {
                    for (var field in savedSalutations[language])
                    {
                        if (savedSalutations[language].hasOwnProperty(field))
                        {
                            if (field == salutationSelectIds[salutationField] && savedSalutations[language][field].length == 2 && savedSalutations[language][field][1].length > 0)
                            {
                                var tmpArray = [];
                                for (var i=0; i<savedSalutations[language][field][1].length; i++)
                                {
                                    if (savedSalutations[language][field][1][i][0] != salutationString)
                                    {
                                        tmpArray.push(savedSalutations[language][field][1][i]);
                                    }
                                }
                                this.ticketSalutations[language][field][1] = tmpArray;
                                savedSalutations[language][field][1] = tmpArray;
                            }
                        }
                    }
                }
            }
            lzm_commonStorage.saveValue('ticket_salutations_' + DataEngine.myId, JSON.stringify(savedSalutations));
        }

        if(salutationField == 'tr-forward-emails')
        {
            $('.' + salutationField + '-selectoption').each(function() {
                if($(this).html().replace(/<span class="lzm-delete-menu-item".*?span>/, '') == salutationString)
                    $(this).remove();
            });
            var newList = [];
            for(var key in LocalConfiguration.EmailList)
            {
                if(LocalConfiguration.EmailList[key][0] != salutationString)
                    newList.push(LocalConfiguration.EmailList[key]);
            }
            LocalConfiguration.EmailList = newList;
            LocalConfiguration.Save();
        }
    }
};

CommonToolsClass.prototype.createOrderedSalutationObject = function(ticket, messageNo) {
    var remainingSalutationFields = {'salutation': [], 'title': [], 'introduction phrase': [], 'closing phrase': [], 'punctuation mark': []};
    var fieldNames = Object.keys(remainingSalutationFields);
    var salutationFields = {}, i, j, savedResult, thisLang, salutationCounter = {};
    messageNo = (typeof messageNo == 'undefined' || isNaN(messageNo) || messageNo < 0) ? 0 : messageNo;
    var nameArray = ticket.messages[messageNo].fn.split(' '), firstName = nameArray[0].replace(/^ +/, '').replace(/ +$/, '');
    nameArray.splice(0,1);
    var lastName = nameArray.join(' ').replace(/^ +/, '').replace(/ +$/, '');
    if (ticket.messages[messageNo].fn.indexOf(',') != -1)
    {
        nameArray = ticket.messages[messageNo].fn.split(',');
        lastName = nameArray[0].replace(/^ +/, '').replace(/ +$/, '');
        nameArray.splice(0,1);
        firstName = nameArray.join(',').replace(/^ +/, '').replace(/ +$/, '');
    }
    var myTicketSalutations = this.clone(this.ticketSalutations);
    salutationFields['punctuation mark'] = [true, [[',',0]]];
    if (typeof myTicketSalutations[ticket.l.toLowerCase()] != 'undefined')
    {
        salutationFields['first name'] = [(myTicketSalutations[ticket.l.toLowerCase()]['first name'][0] >= 0), firstName];
        salutationFields['last name'] = [(myTicketSalutations[ticket.l.toLowerCase()]['last name'][0] >= 0), lastName];
        for (i=0; i<fieldNames.length; i++) {
            savedResult = myTicketSalutations[ticket.l.toLowerCase()][fieldNames[i]];
            try {savedResult[1].sort(this.salutationSortFunction);} catch(e) {}
            salutationFields[fieldNames[i]] = (savedResult[1].length > 0) ? [(savedResult[0] >= 0)] : [false];
            salutationFields[fieldNames[i]][1] = (savedResult[1].length > 0) ? savedResult[1] : [['',0]];
            salutationCounter[fieldNames[i]] = salutationFields[fieldNames[i]][1].length;
        }
    }
    else
    {
        salutationFields['first name'] = [true, firstName];
        salutationFields['last name'] = [true, lastName];
        for (i=0; i<fieldNames.length; i++) {
            salutationFields[fieldNames[i]] = ($.inArray(fieldNames[i], ['salutation', 'introduction phrase', 'closing phrase', 'punctuation mark']) != -1) ? [true] : [false];
            salutationFields[fieldNames[i]][1] = [];
            salutationCounter[fieldNames[i]] = 0;
        }
    }
    for (thisLang in myTicketSalutations) {
        if (myTicketSalutations.hasOwnProperty(thisLang) && thisLang != ticket.l.toLowerCase()) {
            remainingSalutationFields = this.addSalutationValue(thisLang, fieldNames, remainingSalutationFields, salutationFields);
        }
    }
    var newSalutationFields = JSON.parse(JSON.stringify(salutationFields));
    for (i=0; i<fieldNames.length; i++) {
        try{remainingSalutationFields[fieldNames[i]].sort(this.salutationSortFunction);} catch(e) {}
        var maxAdd = Math.min(remainingSalutationFields[fieldNames[i]].length, 15 - salutationCounter[fieldNames[i]]);
        for (j=0; j<maxAdd; j++) {
            newSalutationFields[fieldNames[i]][1].push(remainingSalutationFields[fieldNames[i]][j]);
        }
        if (newSalutationFields[fieldNames[i]][1].length == 0) {
            newSalutationFields[fieldNames[i]][1] = [['', 0]];
        }
    }
    return newSalutationFields;
};

CommonToolsClass.prototype.addSalutationValue = function(language, fieldNames, remainingSalutationFields, existingSalutationFields) {
    for (var i=0; i<fieldNames.length; i++) {
        var savedResult = this.ticketSalutations[language][fieldNames[i]];
        for (var j=0; j<savedResult[1].length; j++) {
            var valueAlreadyPresent = false;
            var k = 0;
            for (k=0; k<existingSalutationFields[fieldNames[i]][1].length; k++) {
                try {
                    if (savedResult[1][j][0] == existingSalutationFields[fieldNames[i]][1][k][0]) {
                        valueAlreadyPresent = true;
                    }
                } catch(e) {}
            }
            if (!valueAlreadyPresent) {
                for (k=0; k<remainingSalutationFields[fieldNames[i]].length; k++) {
                    try {
                        if (savedResult[1][j][0] == remainingSalutationFields[fieldNames[i]][k][0]) {
                            valueAlreadyPresent = true;
                            remainingSalutationFields[fieldNames[i]][k][1] += savedResult[1][j][1];
                        }
                    } catch(e) {}
                }
            }
            if (!valueAlreadyPresent) {
                remainingSalutationFields[fieldNames[i]].push(savedResult[1][j]);
            }
        }
    }
    return remainingSalutationFields;
};

CommonToolsClass.prototype.salutationTextExists = function(fieldName, text, language) {
    var salutationTextPosition = -1;
    for (var i=0; i<this.ticketSalutations[language][fieldName][1].length; i++) {
        if (this.ticketSalutations[language][fieldName][1][i][0] == text) {
            salutationTextPosition = i;
            break;
        }
    }

    return salutationTextPosition;
};

CommonToolsClass.prototype.salutationSortFunction = function(a, b) {
    return (b[1] - a[1]);
};

CommonToolsClass.prototype.checkEmailReadStatus = function(emailId) {
    var emailIsRead = -1;
    for (var i=0; i<lzm_chatDisplay.emailReadArray.length; i++) {
        if (lzm_chatDisplay.emailReadArray[i].id == emailId) {
            emailIsRead = i;
        }
    }
    return emailIsRead;
};

CommonToolsClass.prototype.clearEmailReadStatusArray = function() {
    var tmpArray = [];
    for (var i=0; i<lzm_chatDisplay.emailReadArray.length; i++) {
        if (lzm_chatTimeStamp.getServerTimeString(null, true) - lzm_chatDisplay.emailReadArray[i].c <= 1209600) {
            tmpArray.push(lzm_chatDisplay.emailReadArray[i]);
        }
    }
    lzm_chatDisplay.emailReadArray = tmpArray;
};

CommonToolsClass.prototype.checkEmailTicketCreation = function(emailId) {
    var emailTicketCreated = -1;
    for (var i=0; i<lzm_chatDisplay.ticketsFromEmails.length; i++) {
        if (lzm_chatDisplay.ticketsFromEmails[i]['email-id'] == emailId) {
            emailTicketCreated = i;
        }
    }
    return emailTicketCreated;
};

CommonToolsClass.prototype.removeEmailFromTicketCreation = function(emailId) {
    var tmpArray = [];
    for (var i=0; i<lzm_chatDisplay.ticketsFromEmails.length; i++) {
        if (lzm_chatDisplay.ticketsFromEmails[i]['email-id'] != emailId) {
            tmpArray.push(lzm_chatDisplay.ticketsFromEmails[i]);
        }
    }
    lzm_chatDisplay.ticketsFromEmails = tmpArray;
};

CommonToolsClass.prototype.removeEmailFromDeleted = function(emailId) {
    var tmpArray = [];
    for (var i=0; i<lzm_chatDisplay.emailDeletedArray.length; i++) {
        if (lzm_chatDisplay.emailDeletedArray[i] != emailId) {
            tmpArray.push(lzm_chatDisplay.emailDeletedArray[i]);
        }
    }
    lzm_chatDisplay.emailDeletedArray = tmpArray;
};

CommonToolsClass.prototype.checkEmailIsLockedBy = function(emailId, operatorId) {
    for (var i=0; i<DataEngine.emails.length; i++) {
        if((DataEngine.emails[i].id == emailId || emailId == '') &&
            DataEngine.emails[i].ei == operatorId) {
            return true;
        }
    }
    return false;
};

CommonToolsClass.prototype.sortEmails = function(a, b) {
    if (a.c > b.c)
        return 1;
    else if (a.c < b.c)
        return -1;
    else
        return 0;
};

CommonToolsClass.prototype.phpUnserialize = function(serializedString) {
    var unserializedObject = null;
    if (serializedString == 'a:0:{}')
    {
        unserializedObject = [];
    }
    else
    {
        var tmpArray = serializedString.split(':'), unserializedObject = null, prefixLength = 0;
        if (tmpArray[0] == 'i')
        {
            unserializedObject = parseInt(tmpArray[1]);
        }
        else if (tmpArray[0] == 'b')
        {
            unserializedObject = (tmpArray[1] == 0) ? false : true;
        }
        else if (tmpArray[0] == 's')
        {
            var stringLength = tmpArray[1];
            prefixLength = 4 + stringLength.length;
            unserializedObject = lz_global_base64_url_decode(serializedString.substr(prefixLength, stringLength));
        }
        else if(tmpArray[0] == 'a')
        {
            var arrayLength = tmpArray[1];
            prefixLength = 4 + arrayLength.length;
            var tmpObject = serializedString.substr(prefixLength, serializedString.length - prefixLength - 2).split(';');
            unserializedObject = {};
            var unserializedArray = [], arrayCounter = 0, isArray = true;
            for (var i=0; i<tmpObject.length; i+=2) {
                unserializedObject[this.phpUnserialize(tmpObject[i])] = this.phpUnserialize(tmpObject[i + 1]);
                if (typeof this.phpUnserialize(tmpObject[i]) == 'number' && this.phpUnserialize(tmpObject[i]) == arrayCounter) {
                    unserializedArray.push(this.phpUnserialize(tmpObject[i + 1]));
                    arrayCounter++;
                }
                else
                {
                    isArray = false;
                }
            }
            unserializedObject = (isArray) ? unserializedArray : unserializedObject;
        }
    }
    return unserializedObject;
};

CommonToolsClass.prototype.replacePlaceholders = function(myString, replacements) {
    for (var i=0; i<replacements.length; i++) {
        var regExp = new RegExp(replacements[i].pl, 'g');
        myString = myString.replace(regExp, replacements[i].rep);
    }
    return myString;
};

CommonToolsClass.prototype.replaceLinksInChatView = function(htmlText) {

    var regExpMatch = htmlText.match(/<a.*?href=".*?".*?>.*?<\/a>/gi); // [^#]
    if (regExpMatch != null)
    {
        for (var i=0; i<regExpMatch.length; i++)
        {
            var thisHtml = regExpMatch[i];
            if (thisHtml.match(/lz_chat_file/i) != null)
            {
                thisHtml = thisHtml.replace(/<[a].*?href="(.*?)".*?>(.*?)<\/[a]>/gi, '<a data-role="none" class="lz_chat_file_no_icon" href="#" data-url="$1" onclick="downloadFile(\'$1\');">$2</a>');
            }
            else if (thisHtml.match(/handleUploadRequest/i) != null) {
                // Do not replace this
            }
            else if (thisHtml.match(/<a.*?href=".*?".+?data\-url=".*?".+?>.*?<\/a>/i) != null && thisHtml.match("data\-url") != null)
            {
                thisHtml = thisHtml.replace(/<a(.*?)href="(.*?)".*?data\-url="(.*?)"(.+?)>(.*?)<\/a>/gi, '<a$1href="#" data-url="$3" onclick="openLink(\'$3\', event);"$4>$5</a>');
            }
            else if (thisHtml.match(/<a.*?href=".*?".+?data\-url=".*?">.*?<\/a>/i) != null && thisHtml.match("data\-url") != null) {
                thisHtml = thisHtml.replace(/<a(.*?)href="(.*?)".*?data\-url="(.*?)">(.*?)<\/a>/gi, '<a$1href="#" data-url="$3" onclick="openLink(\'$3\', event);">$4</a>');
            }
            else if (thisHtml.match(/<a.*?href=".*?".+?>.*?<\/a>/i) != null) {
                thisHtml = thisHtml.replace(/<a(.*?)href="(.*?)"(.+?)>(.*?)<\/a>/gi, '<a$1href="#" data-url="$2" onclick="openLink(\'$2\', event);"$3>$4</a>');
            }
            else {
                thisHtml = thisHtml.replace(/<a(.*?)href="(.*?)">(.*?)<\/a>/gi, '<a$1href="#" data-url="$2" onclick="openLink(\'$2\', event);">$3</a>');
            }
            var thisRegExp = new RegExp(RegExp.escape(regExpMatch[i]), 'gi');
            htmlText = htmlText.replace(thisRegExp, thisHtml);
            htmlText = htmlText.replace(/target=".*?"/, '');
        }
    }
    return htmlText;
};

CommonToolsClass.prototype.URLToHTML = function(myText) {

    myText = myText.replace(/&nbsp;/g,' ');
    var i, j, replacement, replaceLink;
    var webSites = myText.match(/(www\.|(http|https):\/\/)[.a-z0-9-]+\.[a-z0-9\/_:@=.+!?,##%&~-]*[^.|'|# |\(|?|,| |>|<|;|\)]/gi);

    var existingLinks = myText.match(/<a.*?href.*?>.*?<\/a>/gi);
    var existingSource = myText.match(/<.*?src.*?>/gi);

    if (typeof webSites != 'undefined' && webSites != null)
    {
        for (i=0; i<webSites.length; i++)
        {
            replaceLink = true;
            if (typeof existingLinks != 'undefined' && existingLinks != null)
            {
                for (j=0;j<existingLinks.length; j++)
                {
                    if (existingLinks[j].indexOf(webSites[i])) {
                        replaceLink = false;
                    }
                }
            }
            if (typeof existingSource != 'undefined' && existingSource != null)
            {
                for (j=0;j<existingSource.length; j++)
                {
                    if (existingSource[j].indexOf(webSites[i])) {
                        replaceLink = false;
                    }
                }
            }

            if (replaceLink)
            {
                if (webSites[i].toLowerCase().indexOf('http') != 0)
                    replacement = '<a target="_blank" class="lz_chat_link" href="http://' + webSites[i] + '" data-url="http://' + webSites[i] + '">' + lzm_commonTools.SubStr(webSites[i],120,true) + '</a>';
                else
                    replacement = '<a target="_blank" class="lz_chat_link" href="' + webSites[i] + '" data-url="' + webSites[i] + '">' + lzm_commonTools.SubStr(webSites[i],120,true) + '</a>';

                myText = myText.replace(webSites[i], replacement);
            }
        }
    }

    var mailAddresses = myText.match(/[\w\.-]{1,}@[\w\.-]{2,}\.\w{2,8}/gi);
    if (typeof mailAddresses != 'undefined' && mailAddresses != null) {
        for (i=0; i<mailAddresses.length; i++) {
            replaceLink = true;
            if (typeof existingLinks != 'undefined' && existingLinks != null)
            {
                for (j=0;j<existingLinks.length; j++) {
                    if (existingLinks[j].indexOf(mailAddresses[i]))
                    {
                        replaceLink = false;
                    }
                }
            }
            if (replaceLink)
            {
                replacement = '<a target="_blank" class="lz_chat_mail" href="mailto:' + mailAddresses[i] + '" data-url="mailto:' + mailAddresses[i] + '">' + mailAddresses[i] + '</a>';
                myText = myText.replace(mailAddresses[i], replacement);
            }
        }
    }
    if (myText.match(/<a.*?href=".*?".+?data\-url=".*?".+?>.*?<\/a>/i) != null)
    {
        myText = myText.replace(/<a(.*?)href="(.*?)".*?data\-url="(.*?)"(.+?)>(.*?)<\/a>/gi, '<a target="_blank"$1href="$3" data-url="$3"$4>$5</a>');
    }
    else if (myText.match(/<a.*?href=".*?".+?data\-url=".*?">.*?<\/a>/i) != null)
    {
        myText = myText.replace(/<a(.*?)href="(.*?)".*?data\-url="(.*?)">(.*?)<\/a>/gi, '<a target="_blank"$1href="$3" data-url="$3">$4</a>');
    }
    myText = myText.replace(/<a(.*?)href="(.*?)">(.*?)<\/a>/gi, '<a target="_blank"$1href="$2">$3</a>');
    myText = myText.replace(/<a(.*?)href="(.*?)"(.+?)>(.*?)<\/a>/gi, '<a target="_blank"$1href="$2"$3>$4</a>');
    myText = myText.replace(/(target="_blank" )+/gi, 'target="_blank" ');

    return myText;
};

CommonToolsClass.prototype.escapeHtml = function(myText, escapeHtmlLineBreaks) {

    if(typeof myText == 'undefined')
        return '';

    escapeHtmlLineBreaks = (typeof escapeHtmlLineBreaks != 'undefined') ? escapeHtmlLineBreaks : false;

    // Replace surrounding font tags as the Windows client sends those
    myText = myText.replace(/^<font.*?>/g,'').replace(/<\/font>$/,'');

    // Replace & by &amp; inside html entities
    myText = myText.replace(/&(([#a-z0-9]*;)+?)/gi, '&amp;$1');

    // replace < and > by their html entities
    myText = myText.replace(/</g,'&lt;').replace(/>/g,'&gt;');

    // replace line endings by their html equivalents
    myText = myText.replace(/\n/g, '').replace(/\r/, '');

    if(!escapeHtmlLineBreaks) {
        myText = myText.replace(/&lt;br \/&gt;/g, '<br />');
        myText = myText.replace(/&lt;br&gt;/g, '<br />');
    }

    myText = myText.replace(/"/g, '&quot;');

    return myText;
};

CommonToolsClass.prototype.ReplaceCommonPlaceholders = function(_objectId, _resourceText) {

    try
    {
        var that = this, i;
        var visitorObj = VisitorManager.GetVisitor(_objectId);
        var ticketObj = lzm_chatDisplay.ticketDisplay.GetTicketById(_objectId);
        var ticketRootObj = Ticket.GetRootMessage(ticketObj);
        var visitorBrowser = VisitorManager.GetLastActiveVisitorBrowser(_objectId);
        var chatObj = DataEngine.ChatManager.GetChat(_objectId,'SystemId');
        var groupId = (chatObj != null && d(chatObj.dcg) && chatObj.dcg != '') ? chatObj.dcg : '';
        var visitorName = (visitorObj != null) ? VisitorManager.GetVisitorName(visitorObj) : '';
        var visitorNameArray = (visitorName.indexOf(',') == -1) ? visitorName.split(' ') : visitorName.split(',');
        var firstNameEntry = visitorNameArray.splice(0,1)[0].replace(/^ +/, '').replace(' +$', '');
        var visitorFirstName = (visitorName.indexOf(',') == -1) ? firstNameEntry : visitorNameArray.join(' ').replace(/^ +/, '').replace(' +$', '');
        var visitorLastName = (visitorName.indexOf(',') != -1) ? firstNameEntry : visitorNameArray.join(' ').replace(/^ +/, '').replace(' +$', '');
        var question = (chatObj != null && d(chatObj.s) && chatObj.s != '') ? chatObj.s : '';
        var visitorIp = (visitorObj != null && d(visitorObj.ip)) ? visitorObj.ip : '';
        var websiteNames = (visitorObj != null) ? VisitorManager.GetWebsiteNames(visitorObj) : '';
        var visitorEmail = DataEngine.inputList.getInputValueFromVisitor(112,visitorObj);
        var visitorPhone = DataEngine.inputList.getInputValueFromVisitor(116,visitorObj);
        var chatId = (chatObj != null && d(chatObj.i)) ? chatObj.i : '';
        var ticketId = (ticketObj != null && d(ticketObj.id)) ? ticketObj.id : '';
        var ticketHash = (ticketObj != null && d(ticketObj.h)) ? ticketObj.h : '';
        var ticketSubject = (ticketRootObj != null && d(ticketRootObj.s)) ? ticketRootObj.s : '';
        var pageTitle = (visitorBrowser != null && d(visitorBrowser.h2) && visitorBrowser.h2.length > 0) ? visitorBrowser.h2[visitorBrowser.h2.length - 1].title : '';
        var url = (visitorBrowser != null && d(visitorBrowser.h2) && visitorBrowser.h2.length > 0) ? visitorBrowser.h2[visitorBrowser.h2.length - 1].url : '';
        var searchString = '';
        var now = lzm_chatTimeStamp.getLocalTimeObject();
        var time = that.getHumanDate(now, 'shorttime', lzm_chatDisplay.userLanguage);
        var date = that.getHumanDate(now, 'date', lzm_chatDisplay.userLanguage);
        var domain = '';

        var myAccount = DataEngine.operators.getOperator(lzm_chatDisplay.myId);

        var replacementArray = [
            {p: '%operator_name%', r: myAccount.name},
            {p: '%name%', r: myAccount.name},
            {p: '%operator_firstname%', r: myAccount.fn},
            {p: '%operator_lastname%', r: myAccount.ln},
            {p: '%id%', r: lzm_chatDisplay.myLoginId},
            {p: '%operator_email%', r: myAccount.email},
            {p: '%group_id%', r: groupId},
            {p: '%external_name%', r: visitorName},
            {p: '%external_firstname%', r: visitorFirstName},
            {p: '%external_lastname%', r: visitorLastName},
            {p: '%question%', r: question},
            {p: '%external_ip%', r: visitorIp},
            {p: '%external_email%', r: visitorEmail},
            {p: '%external_phone%', r: visitorPhone},
            {p: '%chat_id%', r: chatId},
            {p: '%ticket_id%', r: ticketId},
            {p: '%ticket_hash%', r: ticketHash},
            {p: '%subject%', r: ticketSubject},
            {p: '%page_title%', r: pageTitle},
            {p: '%url%', r: url},
            {p: '%domain%', r: domain},
            {p: '%searchstring%', r: searchString},
            {p: '%localtime%', r: time},
            {p: '%website_name%', r: websiteNames},
            {p: '%localdate%', r: date}
        ];


        var selectedValue,customInputs = DataEngine.inputList.getCustomInputList();
        var rootMessage = (ticketObj != null && ticketObj.messages.length) ? ticketObj.messages[0] : null;

        for (i=0; i<customInputs.length; i++)
        {
            var myCustomValue = '',messageCustomValue=null;

            if(rootMessage != null)
            {
                messageCustomValue = lzm_commonTools.GetElementByProperty(rootMessage.customInput,'id',customInputs[i].name);
                if(messageCustomValue.length)
                {
                    messageCustomValue = messageCustomValue[0].text;
                }
            }

            if ((customInputs[i].type == 'Text' || customInputs[i].type == 'TextArea') && customInputs[i].active == 1)
            {
                // visitor
                if (visitorObj != null && d(visitorObj.d['f' + customInputs[i].id]))
                {
                    myCustomValue = visitorObj.d['f' + customInputs[i].id];
                }

                // ticket
                if(rootMessage != null && messageCustomValue != null)
                {
                    myCustomValue = messageCustomValue;
                }

            }
            else if (customInputs[i].type == 'CheckBox' && customInputs[i].active == 1)
            {
                // visitor
                if (visitorObj != null && d(visitorObj.d['f' + customInputs[i].id]))
                {
                    myCustomValue = (visitorObj.d['f' + customInputs[i].id] == 1) ? tid('yes') : tid('no');
                }

                // ticket
                if(rootMessage != null && messageCustomValue != null)
                {
                    myCustomValue = messageCustomValue == 1 ? tid('yes') : tid('no');
                }
            }
            else if (customInputs[i].type == 'ComboBox' && customInputs[i].active == 1)
            {
                // visitor
                if (visitorObj != null && d(visitorObj.d['f' + customInputs[i].id]))
                {
                    selectedValue = parseInt(visitorObj.d['f' + customInputs[i].id]);
                    myCustomValue = (!isNaN(selectedValue)) ? customInputs[i].value[selectedValue] : '';
                }

                // ticket
                if(rootMessage != null && messageCustomValue != null)
                {
                    selectedValue = parseInt(messageCustomValue);
                    myCustomValue = (!isNaN(selectedValue)) ? customInputs[i].value[selectedValue] : '';
                }
            }
            else if (customInputs[i].type == 'File' && customInputs[i].active == 1)
            {
                myCustomValue = '';
            }
            replacementArray.push({p: '%custom' + customInputs[i].id + '%', r: myCustomValue});
        }

        // fill up missing keys
        for(var key in ChatEditorClass.PlaceholdersList)
        {
            if(!lzm_commonTools.GetElementByProperty(replacementArray,'p',ChatEditorClass.PlaceholdersList[key].p).length)
                replacementArray.push({p:ChatEditorClass.PlaceholdersList[key].p,r:''});
        }

        for (i=0; i<replacementArray.length; i++)
        {
            var regExp = new RegExp(replacementArray[i].p, 'g');
            _resourceText = _resourceText.replace(regExp, replacementArray[i].r);
        }
    }
    catch(ex)
    {
        deblog(ex);
    }

    return _resourceText
};

CommonToolsClass.prototype.printContent = function(myType, myObject) {
    var that = this, myContent = '';

    var GetTicketPrintHTML = function(_ticket){
        var message = _ticket.messages[0];
        var msgDate = lzm_chatTimeStamp.getLocalTimeObject(message.ct * 1000, true);
        var msgDateHuman = that.getHumanDate(msgDate, 'full', lzm_chatDisplay.userLanguage);

        var myGroupName = _ticket.gr;
        var myGroup = DataEngine.groups.getGroup(myGroupName);
        myGroupName = (myGroup != null && d(myGroup.name)) ? myGroup.name : myGroupName;

        var tiHTML = '<br />' +
            '<table>' +
            '<tr><th style="text-align: left;min-width:110px;">' + tidc('ticket_id') + '</th><td>' + _ticket.id + '</td></tr>' +
            '<tr><th style="text-align: left;">' + tidc('group') + '</th><td>' + myGroupName + '</td></tr>' +
            '<tr><th style="text-align: left;">' + tidc('date') + '</th><td>' + msgDateHuman + '</td></tr>' +
            '<tr><th style="text-align: left;">' + tidc('subject') + '</th><td>' + that.escapeHtml(message.s) + '</td></tr>' +
            '<tr><th style="text-align: left;">' + tidc('name') + '</th><td>' + that.escapeHtml(message.fn) + '</td></tr>' +
            '<tr><th style="text-align: left;">' + tidc('email') + '</th><td>' + that.escapeHtml(message.em) + '</td></tr>' +
            '<tr><th style="text-align: left;">' + tidc('company') + '</th><td>' + that.escapeHtml(message.co) + '</td></tr>';

        for (var i=0; i<DataEngine.inputList.idList.length; i++)
        {
            var myCustomInput = DataEngine.inputList.getCustomInput(DataEngine.inputList.idList[i]);
            if (myCustomInput.active == 1)
            {
                var val = lzm_commonTools.GetElementByProperty(message.customInput,'id',myCustomInput.name);
                if(val.length)
                    tiHTML += '<tr><th style="text-align: left;">' + myCustomInput.name + ':</th><td>' + val[0].text + '</td></tr>';
            }
        }

        tiHTML += '</table>';
        return tiHTML;

    };
    var GetMessagePrintHTML = function(_ticket,_messageNo){
        var message = _ticket.messages[_messageNo];

        var myOperator = DataEngine.operators.getOperator(message.sid);
        var myOperatorName = (myOperator != null) ? myOperator.name : message.sid;

        var msgDate = lzm_chatTimeStamp.getLocalTimeObject(message.ct * 1000, true);
        var msgDateHuman = that.getHumanDate(msgDate, 'full', lzm_chatDisplay.userLanguage);

        var tmpFrom1 = (message.fn != '') ? that.escapeHtml(message.fn) : '';
        var tmpFrom2 = (message.fn != '' && message.em != '') ? ' &lt;' + that.escapeHtml(message.em) + '&gt;' : (message.fn == '' && message.em != '') ? that.escapeHtml(message.em) : '';
        var msgFrom = (message.t == 4 || message.t == 3) ? tmpFrom1 + tmpFrom2 : (message.t == 1) ? myOperatorName : '';

        var msgText = that.escapeHtml(message.mt.replace(/\r\n/g, '<br />').replace(/\n/g, '<br />').replace(/\r/g, '<br />'));

        var mHTML = '<script type="text/javascript">var printNow = function() {window.print();};</script>';

        mHTML += '<br><br>---------------------------------------- ' + t('Message <!--msg_no-->/<!--total_msgs-->',[['<!--msg_no-->', parseInt(_messageNo) + 1], ['<!--total_msgs-->', _ticket.messages.length]]) + ' ----------------------------------------<br />';
        mHTML += '<table>';

        if (message.t != 2)
        {
            mHTML += '<tr><th style="text-align: left;">' + t('From:') + '</th><td>' + msgFrom + '</td></tr>';
        }
        mHTML += '<tr><th style="text-align: left;min-width:110px;">' + tidc('date') + '</th><td>' + msgDateHuman + '</td></tr>';
        mHTML += '<tr><td colspan="2">&nbsp;</td></tr>' +
            '<tr><td colspan="2">' + msgText + '</td></tr>' +
            '</table><br><br>';
        return mHTML;
    };

    switch(myType)
    {
        case 'ticket':
            myContent = GetTicketPrintHTML(myObject.ticket);
            for(var key in myObject.ticket.messages)
                myContent += GetMessagePrintHTML(myObject.ticket,key);
            break;
        case 'message':
            myContent = GetTicketPrintHTML(myObject.ticket);
            myContent += GetMessagePrintHTML(myObject.ticket,myObject.msgNo);
            break;
        case 'chat':
            var myChat = that.clone(myObject.chat);
            var chatDate = lzm_chatTimeStamp.getLocalTimeObject(myChat.ts * 1000, true);
            var chatDateHuman = that.getHumanDate(chatDate, 'full', lzm_chatDisplay.userLanguage);
            var chatDuration = that.getHumanTimeSpan(parseInt(myChat.te) - parseInt(myChat.ts));
            var waitingTime = (myChat.t == 1) ? that.getHumanTimeSpan(parseInt(myChat.wt)) : '-';
            var language = (myChat.il != '') ? myChat.il : '-';
            var langName = this.GetLanguageName(language);
            var ipAddress = (myChat.ip != '') ? myChat.ip : '-';
            var host = (myChat.ho != '') ? myChat.ho : '-';
            var phone = (myChat.cp != '') ? that.escapeHtml(myChat.cp) : '-';
            var opId, cpId, qId, name, operatorName, groupName;

            if (myChat.t == 0)
            {
                var opList = myChat.iid.split('-');
                var myPosition = $.inArray(lzm_chatDisplay.myId, opList);
                if (myPosition != -1) {
                    opId = opList[myPosition];
                    cpId = opList[1 - myPosition];
                } else {
                    opId = opList[0];
                    cpId = opList[1];
                }
                qId = myChat.iid;
            }
            else
            {
                opId = myChat.iid;
                cpId = (myChat.eid != '') ? myChat.eid : myChat.gid;
                qId = cpId;
            }

            try
            {
                name = (myChat.t == 0) ? DataEngine.operators.getOperator(cpId).name : (myChat.t == 1) ? that.escapeHtml(myChat.en) : (myChat.gid == 'everyoneintern') ? tid('all_operators') : capitalize(myChat.gid);
            }
            catch (e) {name = '';}

            try
            {
                var operator = DataEngine.operators.getOperator(opId);
                operatorName = (operator != null) ? operator.name : '-';
            }
            catch (e)
            {
                operatorName = '';
            }

            try
            {
                groupName = (myChat.gid != '') ? (myChat.gid != 'everyoneintern') ? DataEngine.groups.getGroup(myChat.gid).name : tid('all_operators') : '-';
            }
            catch (e)
            {
                groupName = '';
            }

            var email = (myChat.em != '') ? that.escapeHtml(myChat.em) : '-';
            var company = (myChat.co != '') ? that.escapeHtml(myChat.co) : '-';
            var area = (myChat.ac != '') ? myChat.ac : '-';
            var pageUrl = (typeof myChat.u != 'undefined' && myChat.u != '') ? myChat.u : '-';
            var result = (myChat.t == 1) ? (myChat.sr == 0) ? t('Missed') : (myChat.sr == 1) ? t('Accepted') : t('Declined') : '-';
            var endedBy = (myChat.t == 1) ? (myChat.er == 0) ? t('User') : tid('operator') : '-';
            var question = (typeof myChat.q != 'undefined' && myChat.q != '') ? that.escapeHtml(myChat.q) : '-';
            myContent = '<script type="text/javascript">var printNow = function() {window.print();};</script>' +
                '<table>' +
                '<tr><th style="text-align: left;">' + tidc('date') + '</th><td>' + chatDateHuman + '</td></tr>' +
                '<tr><th style="text-align: left;">' + tidc('chat_id') + '</th><td>' + myChat.cid + '</td></tr>';

            if(myChat.t == 1)
            {
                myContent += '<tr><th style="text-align: left;">' + tidc('name') + '</th><td>' + name + '</td></tr>';
                myContent += '<tr><th style="text-align: left;">' + tidc('operator') + '</th><td>' + operatorName + '</td></tr>';
            }
            else if(myChat.t == 0)
            {
                myContent += '<tr><th style="text-align: left;">' + tidc('operator',' 1:') + '</th><td>' + name + '</td></tr>';
                myContent += '<tr><th style="text-align: left;">' + tidc('operator',' 2:') + '</th><td>' + operatorName + '</td></tr>';
            }

            if(myChat.t != 0)
                myContent += '<tr><th style="text-align: left;">' + t('Group:') + '</th><td>' + groupName + '</td></tr>';

            if(myChat.t == 1)
            {
                myContent += '<tr><th style="text-align: left;">' + tidc('email') + '</th><td>' + email + '</td></tr>' +
                    '<tr><th style="text-align: left;">' + tidc('phone') + '</th><td>' + phone + '</td></tr>' +
                    '<tr><th style="text-align: left;">' + tidc('company') + '</th><td>' + company + '</td></tr>' +
                    '<tr><th style="text-align: left;">' + tidc('language') + '</th><td>' + langName + '</td></tr>' +
                    '<tr><th style="text-align: left;">' + tidc('IP') + '</th><td>' + ipAddress + '</td></tr>' +
                    '<tr><th style="text-align: left;">' + tidc('host') + '</th><td>' + host + '</td></tr>';

                if(myChat.t == 1)
                    myContent += '<tr><th style="text-align: left;">' + tidc('duration') + '</th><td>' + chatDuration + '</td></tr>';

                myContent += '<tr><th style="text-align: left;">' + tidc('website_name') + '</th><td>' + area + '</td></tr>' +
                    '<tr><th style="text-align: left;">' + tidc('waiting_time') + '</th><td>' + waitingTime + '</td></tr>' +
                    '<tr><th style="text-align: left;">' + tidc('result') + '</th><td>' + result + '</td></tr>' +
                    '<tr><th style="text-align: left;">' + tidc('ended_by') + '</th><td>' + endedBy + '</td></tr>';
                myContent += '<tr><th style="text-align: left;">' + tidc('url') + '</th><td>' + pageUrl + '</td></tr>' +
                    '<tr><th style="text-align: left;">' + t('Question:') + '</th><td>' + question + '</td></tr>';

            }

            myContent += '<tr><td colspan="2">&nbsp;</td></tr>' +
                '<tr><td colspan="2">' + that.escapeHtml(myChat.cplain.replace(/\r\n/g, '<br />').replace(/\n/g, '<br />')
                .replace(/\r/g, '<br />')) + '</td></tr></table>';
            break;
    }
    if (myContent != '')
    {
        if(IFManager.IsDesktopApp())
            IFManager.IFPrintContent(myContent);
        else
        {
            printWindow = window.open('', 'print-window');
            printWindow.document.write(myContent);
            printWindow.printNow();
            printWindow.close();
        }
    }
};

CommonToolsClass.prototype.GetLanguageName = function(_iso){
    return (d(lzm_chatDisplay.availableLanguages[_iso.toLowerCase()])) ? lzm_chatDisplay.availableLanguages[_iso.toLowerCase()] : (d(lzm_chatDisplay.availableLanguages[_iso.toLowerCase().split('-')[0]])) ? lzm_chatDisplay.availableLanguages[_iso.toLowerCase().split('-')[0]] : _iso;
};

CommonToolsClass.prototype.phpSerialize = function(myObject, doEncode) {
    var that = this;
    doEncode = (typeof doEncode != 'undefined') ? doEncode : false;
    var counter = 0, myKey, myValue;
    var objectLength = (myObject instanceof Array) ? myObject.length : Object.keys(myObject).length;
    var serialized = '';
    if (typeof myObject == 'object' && myObject instanceof Array)
    {
        serialized += 'a:' + objectLength.toString() + ':{';
        for (var i=0; i<objectLength; i++)
        {
            if (doEncode && (typeof myObject[i] == 'string' || typeof myObject[i] == 'number'))
            {
                myValue = lz_global_base64_encode(myObject[i].toString());//.replace('"', '\\"'));
                serialized += 'i:' + counter + ';s:' + myValue.length + ':"' + myValue + '";';
            }
            else if (typeof myObject[i] == 'string' || typeof myObject[i] == 'number')
            {
                if (isNaN(myObject[i]))
                {
                    myValue = myObject[i];//.replace('"', '\\"');
                    serialized += 'i:' + counter + ';s:' + myValue.length + ':"' + myValue + '";';
                }
                else
                {
                    serialized += 'i:' + counter + ';i:' + myObject[i] + ';';
                }
            }
            else if (typeof myObject[i] == 'boolean')
            {
                myValue = (myObject[i]) ? 1 : 0;
                serialized += 'i:' + counter + ';b:' + myValue + ';';
            }
            else if (myObject[i] == null || typeof myObject[i] == 'undefined')
            {
                serialized += 'i:' + counter + ';N;';
            }
            else
            {
                myValue = that.phpSerialize(myObject[i], doEncode);
                serialized += 'i:' + counter + ';' + myValue;
            }
            counter++;
        }
        serialized += '}';
    }
    else if (typeof myObject == 'object' && myObject != null)
    {
        serialized += 'a:' + objectLength.toString() + ':{';
        for (var key in myObject) {
            if (myObject.hasOwnProperty(key))
            {
                myKey = key.toString();//.replace('"', '\\"');
                if (doEncode && (typeof myObject[key] == 'string' || typeof myObject[key] == 'number')) {
                    myValue = lz_global_base64_encode(myObject[key].toString().replace('"', '\\"'));
                    serialized += 's:' + myKey.length + ':"' + myKey + '";s:' + myValue.length + ':"' + myValue + '";'
                }
                else if (typeof myObject[key] == 'string' || typeof myObject[key] == 'number') {
                    if (isNaN(myObject[key]))
                    {
                        myValue = myObject[key];//.replace('"', '\\"');
                        if (isNaN(key))
                        {
                            serialized += 's:' + myKey.length + ':"' + myKey + '";s:' + myValue.length + ':"' + myValue + '";'
                        }
                        else
                        {
                            serialized += 'i:' + myKey + ';s:' + myValue.length + ':"' + myValue + '";'
                        }
                    }
                    else
                    {
                        if (isNaN(key))
                        {
                            serialized += 's:' + myKey.length + ':"' + myKey + '";i:' + myObject[key] + ';';
                        }
                        else
                        {
                            serialized += 'i:' + myKey + ';i:' + myObject[key] + ';';
                        }
                    }
                }
                else if (typeof myObject[key] == 'boolean')
                {
                    myValue = (myObject[key]) ? 1 : 0;
                    serialized += 's:' + myKey.length + ':"' + myKey + '";b:' + myValue + ';';
                }
                else if (myObject[key] == null || typeof myObject[key] == 'undefined')
                {
                    serialized += 's:' + myKey.length + ':"' + myKey + '";N;';
                }
                else
                {
                    myValue = that.phpSerialize(myObject[key], doEncode);
                    serialized += 's:' + myKey.length + ':"' + myKey + '";' + myValue;
                }
            }
        }
        serialized += '}';
    }
    return serialized;
};

CommonToolsClass.prototype.isHEXColor = function(color){
    return /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(color);
};

CommonToolsClass.prototype.isImageFile = function(filename) {
    var imgFileExts = ['png','jpeg','jpg','bmp','gif','lzsc'];
    var isImg = false;
    for (var i=0;i<imgFileExts.length;i++){
        var key = imgFileExts[i];
        if(filename.toLowerCase().indexOf(key, filename.length - key.length) !== -1)
            isImg=true;
    }
    return isImg;
};

CommonToolsClass.prototype.guid = function(_noNumbers) {

    var guid = CryptoJS.MD5(Math.floor((1 + Math.random()) * 0x10000).toString()).toString();

    if(_noNumbers)
    {
        if(!isNaN(guid.substr(0,1)))
        {
            return this.guid(true);
        }
    }

    return guid;
};

CommonToolsClass.prototype.rand = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

CommonToolsClass.prototype.getTicketSubShortId = function(_id,_parent){
    return md5(_id + "0" + _parent).substring(0, 5);
};

CommonToolsClass.prototype.startsWith = function(string,startswith) {
    return string.substring( 0, startswith.length ) === startswith;
};

CommonToolsClass.prototype.endsWith = function(string,endswith) {
    return string.substring( string.length - endswith.length, string.length ) === endswith;
};

CommonToolsClass.prototype.GetPositionIndex = function(pos){
    pos = pos.replace('left','0');
    pos = pos.replace('center','1');
    pos = pos.replace('right','2');
    pos = pos.replace('top','0');
    pos = pos.replace('middle','1');
    pos = pos.replace('bottom','2');
    return pos.replace(' ','').split("").reverse().join("");
};

CommonToolsClass.prototype.GetIndexPosition = function(pos){
    if(pos=='00')return 'left top';
    if(pos=='01')return 'left middle';
    if(pos=='02')return 'left bottom';
    if(pos=='10')return 'center top';
    if(pos=='11')return 'center middle';
    if(pos=='12')return 'center bottom';
    if(pos=='20')return 'right top';
    if(pos=='21')return 'right middle';
    if(pos=='22')return 'right bottom';
    return 'center middle';
};

CommonToolsClass.prototype.GetElementByProperty = function(ar,prop,value){
    if(!d(ar))
        return [];
    return $.grep(ar, function(item){
        return item[prop] == value;
    });
};

CommonToolsClass.prototype.RemoveElementByProperty = function(ar,prop,value){
    for(var i=ar.length-1; i>=0; i--)
        if(ar[i][prop] === value)ar.splice(i,1);
};

CommonToolsClass.prototype.SortByProperty = function(_ar,_property,_asc){
    var k,sorterList = [],resList=[];
    _asc = (d(_asc)) ? _asc : false;
    for(k in _ar)
        sorterList.push(_ar[k][_property]);
    sorterList.sort();

    if(_asc)
        sorterList.reverse();

    for(k in sorterList)
        resList.push(lzm_commonTools.GetElementByProperty(_ar,_property,sorterList[k])[0]);

    return resList;
};

CommonToolsClass.prototype.ApplyFromXML = function(object,attributes,node){
    for (var attrIndex = 0; attrIndex < attributes.length; attrIndex++)
        object[attributes[attrIndex].name] = lz_global_base64_url_decode(attributes[attrIndex].value);
    if(d(node))
        object.Value = lz_global_base64_url_decode(node.text());
};

CommonToolsClass.prototype.SubStr = function(str,length,dots){
    if(!d(str) || str == null)
        return '';
    if(str.length<length)
        return str;
    else
        return str.toString().substr(0,length) + (dots ? '...':'');
};

CommonToolsClass.prototype.RemoveFromArray = function(ar,value){
    if($.inArray(value,ar) != -1)
        ar.splice($.inArray(value, ar), 1);
};

CommonToolsClass.prototype.IsWildcardMatch = function(_template,_comparer,_useWildcard){

    if(!d(_useWildcard))
        _useWildcard = true;

    var spacer;
    if(_template=="*")
        return true;

    if(_useWildcard)
    {
        spacer = this.guid();
        _template = _template.toLowerCase().replace(/\?/g,spacer);
        _comparer = _comparer.toLowerCase().replace(/\?/g,spacer);
    }
    else
        spacer = "";

    _template = _template.replace(/\*/g,"(.*)");

    var textx = spacer+_comparer+spacer;
    var reg = "("+spacer+_template+spacer+")";
    var thisRegex = new RegExp(reg);
    return thisRegex.test(textx);
};

CommonToolsClass.prototype.RandomInt = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
};

CommonToolsClass.prototype.StripTags = function(_str){
    if(_str)
        return _str.replace(/(<([^>]+)>)/ig,"");
    else
        return '';
};

CommonToolsClass.prototype.NL2BR = function(_str){

    if(_str == null)
        return '';

    return _str.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n/g, '<br>');
};

CommonToolsClass.prototype.BR2NL = function(_str){
    return _str.replace(/<br \/>/g,'<br>').replace(/<br>/g, '\r\n');
};

CommonToolsClass.prototype.RemoveTags = function(_str){
     _str = _str.replace(/<br>/ig, "\r\n");
     _str = _str.replace(/<br \/>/ig, "\r\n");
     return _str.replace(/<([^>]+?)([^>]*?)>(.*?)<\/\1>/ig, "");
};

CommonToolsClass.prototype.FormatTableTags = function(_list){

    var html = '',count=0;
    if(d(_list) && _list.length)
    {
        _list = _list.split(',');
        for(var key in _list)
        {
            count++;

            if(count < 5)
                html += '<span class="tag-available nic lzm-unselectable">' + lzm_commonTools.htmlEntities(_list[key]) + '</span>';
            else
                return html + " ...";
        }
        return html;
    }
    else
        return '';
};

if (!String.prototype.startsWith) {
    String.prototype.startsWith = function(searchString, position){
        position = position || 0;
        return this.substr(position, searchString.length) === searchString;
    };
}

if (!String.prototype.endsWith) {
    String.prototype.endsWith = function(searchString, position) {
        var subjectString = this.toString();
        if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
            position = subjectString.length;
        }
        position -= searchString.length;
        var lastIndex = subjectString.lastIndexOf(searchString, position);
        return lastIndex !== -1 && lastIndex === position;
    };
}

CommonToolsClass.prototype.GetLastWordAt = function(_text,_position) {

    var parts = $.trim(_text.replace(/&nbsp;/g,' ')).split(' ');
    if(parts.length)
        return parts[parts.length-1];

    parts = _text.split('<br>');
    if(parts.length)
        return parts[parts.length-1];

    parts = _text.split('\n');
    if(parts.length)
        return parts[parts.length-1];

};

CommonToolsClass.prototype.HighlightSearchKey = function(_text,_search,_positioning,_maxlength){

    _maxlength = d(_maxlength) ? _maxlength : 300;

    if(_maxlength == -1)
        _maxlength = 10000000;

    try
    {
        if(!d(_search) || _search == '')
            return this.SubStr(_text,_maxlength,true);

        if(!d(_text) || _text == '')
            return '';

        _text = _text.toString();

        if(_positioning)
        {
            var forstocc = _text.toLocaleLowerCase().indexOf(_search.toLocaleLowerCase());
            var dots = _text.length > _maxlength ? '...' : '';
            if(forstocc < _maxlength)
                _text = _text.substr(0,_maxlength) + dots;
            else if(forstocc > _maxlength && forstocc > ((_text.length-_search.length)-20))
                _text = dots + _text.substr(forstocc-(_maxlength/2),_maxlength+(_maxlength/2));
            else if(forstocc > _maxlength)
                _text = dots + _text.substr(forstocc-(_maxlength/2),_maxlength+(_maxlength/2)) + dots;
        }

        var regExp = new RegExp(RegExp.escape(_search), 'ig');
        //_text = _text.replace(regExp, '<span class="search-highlight">' + _search + '</span>');

        _text = _text.replace(regExp, function (match) {
                return '<span class="search-highlight">' + match + '</span>';
            }
        );


        return _text;

    }
    catch(ex)
    {
        console.log(_text);
        console.log(ex);
        return _text;
    }
};

CommonToolsClass.prototype.PadStart = function(_str, _add, _size) {
    var s = _str + '';
    while (s.length < _size) s = _add + s;
    return s;
};

CommonToolsClass.prototype.ArrayUnique = function(_array){
    var a = _array.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i] === a[j])
                a.splice(j--, 1);
        }
    }
    return a;
};

CommonToolsClass.prototype.MakeLink = function(_val,_HTMLEncode){

    if(_HTMLEncode)
        _val = this.htmlEntities(_val);

    if(_val != null && _val != '' && _val.toLowerCase().indexOf('http') == 0)
        _val = '<a href="#" class="lz_chat_link_no_icon" onclick="openLink(\'https://dereferrer.livezilla.info/?turl=' + encodeURIComponent(_val) + '\');">' + _val + '</a>';

    return _val;
};

CommonToolsClass.prototype.MakeIDSafe = function(_val){
    return _val.replace(/[^A-Za-z0-9.@\-\_]/g, "");
};

CommonToolsClass.prototype.IsIDSafe = function(_val){
    return _val === this.MakeIDSafe(_val);
};

CommonToolsClass.prototype.Mask = function(_val){
    var mask = '';
    if(d(_val) && typeof _val == 'string')
        for(var i=0;i<_val.length;i++)
            mask+= '*';
    return mask;
};

CommonToolsClass.GetRelativePositionOf = function(_id){
    try
    {
        var eTop = $('#' + _id).offset().top;
        eTop = (eTop - $(window).scrollTop());
        var eLeft = $('#' + _id).offset().left;
        eLeft = (eLeft - $(window).scrollLeft());
        return [eTop, eLeft];
    }
    catch(ex)
    {
        deblog(_id);
    }
    return [0,0];
};

CommonToolsClass.AnimationPoints = [];

CommonToolsClass.AnimateElement = function(_idToAnimate,_startElementId,_endElementId,_runTime){
    var startPos = (_startElementId != null) ? CommonToolsClass.GetRelativePositionOf(_startElementId) : null;
    var endPos = CommonToolsClass.GetRelativePositionOf(_endElementId);

    if(startPos != null)
        $('.' + _idToAnimate).css({display:'block',top:startPos[0]+20+'px',left:startPos[1]+20+'px'});

    $('.' + _idToAnimate).animate({top:endPos[0]+'px',left:endPos[1]+5+'px'},_runTime);

    CommonToolsClass.AnimationPoints.push(setTimeout(function(){
        $('#' + _endElementId).css({'box-shadow':'inset 0 0 10px var(--red)'});
    },_runTime));
};

CommonToolsClass.AnimationRun = function(_startId,_targets,_onEnd){

    var _mouseId = 'mouse-move';
    var animTime = 1500;
    var waitBeforeClickTime = 1500;

    $('#mouse-protect').css({'display':'block'});
    $('#mouse-stop').css({'display':'block'});

    var totalTime = 1000;
    for(var i=0;i<_targets.length;i++)
    {
        var currentTarget = _targets[i];
        var from = (i == 0) ? _startId : null;

        CommonToolsClass.AnimationPoints.push(setTimeout(function(_param1,_param2)
        {
            if(d(_param2.id))
                CommonToolsClass.AnimateElement(_mouseId,_param1,_param2.id,animTime);

        },totalTime,from,currentTarget));

        totalTime += animTime;
        totalTime += waitBeforeClickTime;

        setTimeout(function(_param1){
            if(d(_param1.id))
                $('#' + _param1.id).css({'box-shadow':'none'});
        },totalTime, currentTarget);

        CommonToolsClass.AnimationPoints.push(setTimeout(function(_param1){
            if(d(_param1.id))
            {
                if(d(_param1.value))
                {
                    $('#' + _param1.id).val(_param1.value);
                    $('#' + _param1.id).change();
                }
                else if(d(_param1.focus))
                {
                    $('#' + _param1.id).focus();
                }
                else if(d(_param1.checked))
                {
                    $('#' + _param1.id).prop('checked',_param1.checked);
                    $('#' + _param1.id).change();
                }
                else
                    $('#' + _param1.id).click();
            }
            else if(d(_param1.url))
            {
                openLink(_param1.url)
            }

        },totalTime, currentTarget));
        totalTime += waitBeforeClickTime;
    }
    CommonToolsClass.AnimationPoints.push(setTimeout(function(){

        CommonToolsClass.AnimationRunStop();

        if(d(_onEnd))
            setTimeout(_onEnd,1);

    },totalTime-waitBeforeClickTime));


};

CommonToolsClass.AnimationRunStop = function(){

    for(var key in CommonToolsClass.AnimationPoints)
    {
        clearTimeout(CommonToolsClass.AnimationPoints[key]);
    }
    CommonToolsClass.AnimationPoints = [];
    $('#mouse-protect').css({'display':'none'});
    $('#mouse-stop').css({'display':'none'});
    $('.mouse-move').css({display:'none'});

};