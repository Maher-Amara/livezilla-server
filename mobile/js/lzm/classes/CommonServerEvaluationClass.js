function CommonServerEvaluationClass(userLang, defaultLang) {
    this.userLanguage = (typeof userLang != 'undefined') ? userLang : 'en';
    this.defaultLanguage = (typeof defaultLang != 'undefined') ? defaultLang : 'en';
}

CommonServerEvaluationClass.prototype.setLanguages = function(userLang, defaultLang) {
    this.userLanguage = userLang;
    this.defaultLanguage = defaultLang;
};

CommonServerEvaluationClass.prototype.readGroupData = function(xmlDoc) {
    var that = this;
    lzm_userManagement.groups.clearGroups();
    $(xmlDoc).find('int_d').each(function() {
        $(this).children('v').each(function() {
            var newGroup = that.addDepartment($(this));
            lzm_userManagement.groups.setGroup(newGroup);
        });
    });
};

CommonServerEvaluationClass.prototype.readUserData = function(xmlDoc) {
    var that = this;
    lzm_userManagement.operators.clearOperators();
    $(xmlDoc).find('int_r').each(function() {
        $(this).find('v').each(function() {
            var newOperator = that.addInternalUser($(this));
            lzm_userManagement.operators.setOperator(newOperator);
        });
    });
};

CommonServerEvaluationClass.prototype.addDepartment = function (v) {
    var that = this;
    var new_department = {};
    var myAttributes = v[0].attributes;
    for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++)
        new_department[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value)

    new_department.is_active = true;
    new_department.pm = [];
    new_department.sig = [];
    new_department.tei = [];
    new_department.f = [];
    new_department.ohs = [];
    new_department.filters = [];
    new_department.vouchers = [];

    if (d(new_department.id))
    {
        new_department.humanReadableDescription = that.getHumanReadableDepartmentDescriptions(new_department.desc);
        var userLangName = that.userLanguage, firstDescription = '', shortUserLangName = userLangName.split('-')[0];
        try {
            firstDescription = new_department.humanReadableDescription[Object.keys(new_department.humanReadableDescription)[0]];
        } catch (ex) {}
        new_department.name = (typeof new_department.humanReadableDescription[userLangName] != 'undefined') ?
            new_department.humanReadableDescription[that.userLanguage] :
            (userLangName != shortUserLangName && typeof new_department.humanReadableDescription[shortUserLangName] != 'undefined') ?
                new_department.humanReadableDescription[shortUserLangName] :
                (typeof new_department.humanReadableDescription[that.defaultLanguage] != 'undefined') ?
                    new_department.humanReadableDescription[that.defaultLanguage] : (firstDescription != '') ? firstDescription : new_department.id;
    }
    else
    {
        new_department.humanReadableDescription = {};
        new_department.humanReadableDescription[that.userLanguage] = new_department.n;
        new_department.humanReadableDescription[that.defaultLanguage] = new_department.n;
        new_department.name = new_department.n;
        new_department.id = new_department.i;
        new_department.members = [];
    }

    $(v).find('pm').each(function () {
        var pm = $(this);
        new_department.pm.push(that.addPM(pm));
    });

    $(v).find('tei').each(function () {
        var tei = $(this);
        new_department.tei.push(that.addTei(tei));
    });

    $(v).find('sig').each(function () {
        var sig = $(this);
        new_department.sig.push(that.addSignature(sig));
    });

    $(v).find('crm').each(function() {
        var crm = $(this), newCrm = {};
        var myAttributes = crm[0].attributes;
        for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++) {
            newCrm[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value)
        }
        new_department.members.push(newCrm);
    });

    $(v).find('f').each(function() {
        var f = $(this);
        new_department.f.push(that.addF(f));
    });

    $(v).find('oh').each(function() {
        var oh = $(this);
        new_department.ohs.push(that.addOh(oh));
    });

    $(v).find('vfilt').each(function() {
        var vfilt = $(this);
        new_department.filters.push(that.addVFilt(vfilt));
    });

    $(v).find('ctr').each(function() {
        var ctr = $(this);
        new_department.vouchers.push(that.addVoucher(ctr));
    });

    return new_department;
};

CommonServerEvaluationClass.prototype.getHumanReadableDepartmentDescriptions = function(desc) {
    try
    {
        var tmpArray = desc.split('{')[1].split('}')[0].replace(/;$/, '').split(';');
        var descriptionObject = {};
        for (var i=0; i<(tmpArray.length / 2); i++)
        {
            var descLanguage = tmpArray[2*i].split('"')[1].toLowerCase();
            var description = lz_global_base64_decode(tmpArray[2*i+1].split('"')[1]);
            descriptionObject[descLanguage] = description;
        }
        return descriptionObject;
    }
    catch(ex)
    {
        return '';
    }
};

CommonServerEvaluationClass.prototype.addPM = function (pm) {
    var newPm = {};
    var myAttributes = pm[0].attributes;
    for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++) {
        newPm[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value)
    }
    if (typeof newPm.lang != 'undefined') {
        newPm.shortlang = (newPm.lang.indexOf('-') != -1) ? newPm.lang.split('-')[0] : newPm.lang;
    }
    newPm.aw = (typeof newPm.aw != 'undefined' && newPm.aw != '') ? newPm.aw : '0';
    newPm.edit = (typeof newPm.edit != 'undefined' && newPm.edit != '') ? newPm.edit : '0';

    return newPm;
};

CommonServerEvaluationClass.prototype.addTei = function (tei) {
    var newTei = {};
    var myAttributes = tei[0].attributes;
    for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++) {
        newTei[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value)
    }
    newTei.innerText = lz_global_base64_url_decode($(tei).text());

    return newTei;
};

CommonServerEvaluationClass.prototype.addSignature = function (sig) {
    var newSig = {};
    var myAttributes = sig[0].attributes;
    for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++) {
        newSig[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value)
    }
    newSig.text = lz_global_base64_url_decode($(sig).text());
    return newSig;
};

CommonServerEvaluationClass.prototype.addF = function(f) {
    var newF = {text: lz_global_base64_url_decode(f.text()), values: []};
    var myAttributes = f[0].attributes;
    for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++) {
        newF[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value);
        f.find('value').each(function() {
            var myInnerAttributes = $(this)[0].attributes;
            var newValue = {text: lz_global_base64_url_decode($(this).text())};
            for (var attrIndex = 0; attrIndex < myInnerAttributes.length; attrIndex++) {
                newValue[myInnerAttributes[attrIndex].name] = lz_global_base64_url_decode(myInnerAttributes[attrIndex].value);
            }
            newF.values.push(newValue);
        });
    }
    return newF;
};

CommonServerEvaluationClass.prototype.addOh = function(oh) {
    var newOh = {text: lz_global_base64_url_decode(oh.text())};
    var myAttributes = oh[0].attributes;
    for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++) {
        newOh[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value);
    }
    return newOh;
};

CommonServerEvaluationClass.prototype.addVFilt = function(vfilt) {
    var newVFilt = {text: lz_global_base64_url_decode(vfilt.text())};
    var myAttributes = vfilt[0].attributes;
    for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++) {
        newVFilt[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value);
    }
    return newVFilt;
};

CommonServerEvaluationClass.prototype.addVoucher = function(ctr) {
    var newCtr = {};
    var myAttributes = ctr[0].attributes;
    for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++) {
        newCtr[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value);
    }
    return newCtr;
};

CommonServerEvaluationClass.prototype.addInternalUser = function (v) {
    var that = this;
    var new_user = {};
    var myAttributes = v[0].attributes;
    for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++) {
        new_user[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value);
    }
    var userStatusIndex = 0;
    if (typeof lzm_commonConfig != 'undefined') {
        for (var i=0; i<lzm_commonConfig.lz_user_states.length; i++) {
            if (lzm_commonConfig.lz_user_states[i].index == new_user.status) {
                userStatusIndex = i;
                break;
            }
        }
        new_user.logo = lzm_commonConfig.lz_user_states[userStatusIndex].icon;
    }

    if (typeof new_user.isbot != 'undefined' && new_user.isbot == 1)
        new_user.logo = 'img/643-ic.png';
    else
        new_user.isbot = 0;

    new_user.status_logo = new_user.logo;
    new_user.groups = [];
    new_user.groupsHidden = [];
    new_user.groupsAway = [];
    new_user.is_active = (typeof new_user == 'undefined' || new_user.deac != 1);
    new_user.sig = [];
    new_user.clientWeb = false;
    new_user.clientMobile = false;
    new_user.mobileAccount = false;
    new_user.mobileAlternatives = [];
    new_user.ws_users = (typeof new_user.ws_users != 'undefined') ? lzm_commonTools.phpUnserialize(lz_global_base64_url_decode(new_user.ws_users)) : [];
    new_user.ws_config = (typeof new_user.ws_config != 'undefined') ? lzm_commonTools.phpUnserialize(lz_global_base64_url_decode(new_user.ws_config)) : [];

    $(v).find('gr').each(function () {
        var gr = $(this);
        new_user.groups.push(lz_global_base64_url_decode(gr.text()));
    });
    $(v).find('gh').each(function () {
        var gh = $(this);
        new_user.groupsHidden.push(lz_global_base64_url_decode(gh.text()));
    });
    $(v).find('ga').each(function() {
        var ga = $(this);
        if (lz_global_base64_url_decode(ga.text()) != '')
            new_user.groupsAway.push(lz_global_base64_url_decode(ga.text()));
    });
    $(v).find('pm').each(function () {
        var pm = $(this);
        if (typeof new_user.pm == 'undefined') {
            new_user.pm = [];
        }
        new_user.pm.push(that.addPM(pm));
    });
    $(v).find('pp').each(function () {
        var pp = $(this);
        new_user.pp = pp.text();
    });
    $(v).find('sig').each(function () {
        var sig = $(this);
        new_user.sig.push(that.addSignature(sig));
    });
    $(v).find('cw').each(function () {
        new_user.clientWeb = true;
    });
    $(v).find('cm').each(function () {
        new_user.clientMobile = true;
        new_user.appOS = lz_global_base64_url_decode($(this).text());
    });
    $(v).find('me').each(function() {
        var me = $(this);
        new_user.mobileAlternatives.push(lz_global_base64_url_decode(me.text()));
        new_user.mobileAccount = true;
    });
    if (typeof DataEngine != 'undefined') {
        if (new_user.userid.toLowerCase() == DataEngine.chosen_profile.login_name.toLowerCase())
        {
            DataEngine.myGroup = new_user.groups[0];
            lzm_chatDisplay.myGroups = lzm_commonTools.clone(new_user.groups);
            lzm_chatDisplay.myGroupsAway = lzm_commonTools.clone(new_user.groupsAway);
        }
    }

    return new_user;
};
