/****************************************************************************************
 * LiveZilla CommonStorageClass.js
 *
 * Copyright 2018 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/

function CommonStorageClass(localDbPrefix) {

    this.storageData = [];

    this.BackupId = -1;
    this.BackupTime = -1;
    this.BackupDone = false;

    if (typeof localDbPrefix != 'undefined' && localDbPrefix != '')
        this.localDbPrefix = localDbPrefix + '_';
    else
        this.localDbPrefix = '';
}

CommonStorageClass.prototype.autoBackup = function(myId){

    var that = this;

    if(that.BackupDone)
        return;

    if(that.BackupId==-1)
    {
        that.BackupId = this.loadValue('bu_id_' + myId);
        that.BackupTime = this.loadValue('bu_time_' + myId);
    }

    if(that.BackupId == null || that.BackupTime == null || (that.BackupTime != null && (that.BackupTime < (lz_global_timestamp()-86400))))
    {
        that.BackupDone = true;
        this.updateBackupToServer(myId);
    }
};

CommonStorageClass.prototype.updateBackupToServer = function(myId){

    var that = this;
    var data = {};

    data.p_backup_id = (that.BackupId==null) ? -1 : that.BackupId;
    data.p_backup_data_ts = this.getBackupData('ticket_salutations_' + myId);

    CommunicationEngine.pollServerDiscrete('backup',data).done(function(data)
    {
        var xmlDoc = $.parseXML($.trim(data));
        $(xmlDoc).find('bu').each(function()
        {
            that.BackupId = lz_global_base64_decode($(this).attr('i'));
            that.BackupTime = lz_global_timestamp();

            that.saveValue('bu_id_' + myId,that.BackupId);
            that.saveValue('bu_time_' + myId,that.BackupTime);

            $(xmlDoc).find('bu_set').each(function()
            {
                var did = lz_global_base64_decode($(this).attr('i'));

                deblog("Restore Local Data From Server");

                if(did == 'ts')
                    that.saveValue('ticket_salutations_' + myId,lz_global_base64_decode($(this).text()))
            });
        });
    }).fail(function(jqXHR, textStatus, errorThrown){deblog("ERR: 0x113191 (" + textStatus + ")");});
};

CommonStorageClass.prototype.getBackupData = function(dId){
    var data = this.loadValue(dId);
    if(data == null)
        data = '';
    else
        data = lz_global_base64_encode(data);
    return data;
};

CommonStorageClass.prototype.loadProfileData = function() {
    this.storageData = [];

    var indexes = this.loadValue('indexes');
    if (indexes != null && indexes != '') {
        var indexList = indexes.split(',');
        for (var i = 0; i < indexList.length; i++) {
            var thisMobileDir = this.loadValue('mobile_dir_' + String(indexList[i]));
            var thisAutoLogin = this.loadValue('auto_login_' + String(indexList[i]));
            var dataSet = {};
            dataSet.index = indexList[i];
            dataSet.server_profile = this.loadValue('server_profile_' + String(indexList[i]));
            dataSet.server_protocol = this.loadValue('server_protocol_' + String(indexList[i]));
            dataSet.server_url = this.loadValue('server_url_' + String(indexList[i]));
            dataSet.mobile_dir = (thisMobileDir != null && typeof thisMobileDir != 'undefined' && thisMobileDir != 'null' && thisMobileDir != 'undefined' && thisMobileDir != '') ? thisMobileDir : 'mobile';
            dataSet.server_port = this.loadValue('server_port_' + String(indexList[i]));
            dataSet.login_name = this.loadValue('login_name_' + String(indexList[i]));
            dataSet.login_passwd = this.loadValue('login_passwd_' + String(indexList[i]));
            dataSet.user_away_after = this.loadValue('user_away_after_' + String(indexList[i]));
            dataSet.fake_mac_address = this.loadValue('fake_mac_address_' + String(indexList[i]));
            dataSet.user_status = this.loadValue('user_status_' + String(indexList[i]));
            dataSet.repeat_incoming_chat_sound = this.loadValue('repeat_incoming_chat_sound_' + String(indexList[i]));
            dataSet.language = this.loadValue('language_' + String(indexList[i]));
            dataSet.ldap_login = this.loadValue('ldap_' + String(indexList[i]))==1;
            dataSet.lz_version = this.loadValue('lz_version_' + String(indexList[i]));
            dataSet.background_mode = 0; // deprecated
            dataSet.auto_login = (thisAutoLogin != null && typeof thisAutoLogin != 'undefined' && thisAutoLogin != 'null' &&
            thisAutoLogin != 'undefined' && thisAutoLogin != '') ? thisAutoLogin : 0;
            this.storageData.push(dataSet);
        }
    }
};

/**
 * Get the data set for the given index
 * @param myIndex
 * @return {*}
 */
CommonStorageClass.prototype.getProfileByIndex = function(myIndex) {
    for (var i = 0; i < this.storageData.length; i++) {
        if (this.storageData[i].index == myIndex) {
            return this.storageData[i];
        }
    }
    return null;
};

/**
 * Save a data set to the local storage. This will create new data in the storage if the index of the data set
 * equals -1 or update existing data else.
 * @param dataSet
 */
CommonStorageClass.prototype.saveProfile = function(dataSet) {
    var newIndex = -1;
    var indexes = this.loadValue('indexes');
    var indexList = [];
    if (indexes != null && indexes !== '') {
        indexList = indexes.split(',');
    } else {
        indexList = [];
    }
    if (dataSet.index == -1) {
        if (indexList.length != 0) {
            newIndex = parseInt(indexList[indexList.length - 1]) + 1;
        } else {
            newIndex = 1;
        }
        indexList.push(String(newIndex));
        this.saveValue('indexes',indexList.join(','));
    } else {
        newIndex = dataSet.index;
    }
    this.saveValue('server_profile_' + String(newIndex),dataSet.server_profile);
    this.saveValue('server_protocol_' + String(newIndex), dataSet.server_protocol);
    this.saveValue('server_url_' + String(newIndex),dataSet.server_url);
    this.saveValue('mobile_dir_' + String(newIndex),dataSet.mobile_dir);
    this.saveValue('server_port_' + String(newIndex),dataSet.server_port);
    this.saveValue('login_name_' + String(newIndex),dataSet.login_name);

    if (typeof dataSet.keepPassword == 'undefined' || dataSet.keepPassword == false) {
        this.saveValue('login_passwd_' + String(newIndex),dataSet.login_passwd);
    }

    this.saveValue('user_away_after_' + String(newIndex), dataSet.user_away_after);
    this.saveValue('fake_mac_address_' + String(newIndex), dataSet.fake_mac_address);
    this.saveValue('user_status_' + String(newIndex), dataSet.user_status);
    this.saveValue('language_' + String(newIndex), dataSet.language);
    this.saveValue('lz_version_' + String(newIndex), dataSet.lz_version);
    this.saveValue('background_mode_' + String(newIndex), 0); // deprecated
    this.saveValue('auto_login_' + String(newIndex), dataSet.auto_login);
    this.saveValue('ldap_' + String(newIndex), dataSet.ldap_login ? 1 : 0);
    this.loadProfileData();
    return newIndex;
};

/**
 * Delete the data set for the given index from the storage
 * @param myIndex
 */
CommonStorageClass.prototype.deleteProfile = function(myIndex) {
    var indexes = this.loadValue('indexes');
    if (indexes != null) {
        var indexList = indexes.split(',');
    }
    var newIndexList = [];
    for (var i=0; i<indexList.length; i++) {
        if (parseInt(indexList[i]) != parseInt(myIndex)) {
            newIndexList.push(indexList[i]);
        }
    }
    this.saveValue('indexes',newIndexList.join(','));
    this.deleteKeyValuePair('server_profile_' + String(myIndex));
    this.deleteKeyValuePair('server_url_' + String(myIndex));
    this.deleteKeyValuePair('server_port_' + String(myIndex));
    this.deleteKeyValuePair('login_name_' + String(myIndex));
    this.deleteKeyValuePair('login_passwd_' + String(myIndex));

    this.loadProfileData();
};

/**
 * get the value to a given key
 * @param myKey         // the key for which the array shall be retrieved
 * @return {*}          // the value of the given key
 */
CommonStorageClass.prototype.loadValue = function(myKey,fallBackValue) {

    var loadedValue = IFManager.IFLoadStorageItem(this.localDbPrefix + myKey);

    if(typeof fallBackValue != 'undefined' && (loadedValue == null || typeof loadedValue == 'undefined'))
        return fallBackValue;

    // no empty string return for ints (IOS)
    if(typeof fallBackValue != 'undefined' && loadedValue == '' && !isNaN(fallBackValue))
        return fallBackValue;

    return loadedValue;
};

/**
 * Save a key value pair to the local storage, this will create a new pair if thze key doesn't exist
 * or overwrite the value if the key does already exist
 * @param myKey
 * @param myValue
 */
CommonStorageClass.prototype.saveValue = function(myKey, myValue) {
    myValue = (myValue == null || typeof myValue == 'undefined') ? '' : '' + myValue;
    IFManager.IFSaveStorageItem(this.localDbPrefix + myKey,myValue);
};

/**
 * Delete the key value pair for the given key from the storage
 *
 * @param myKey         // key for which the key value pair shall be deleted
 */
CommonStorageClass.prototype.deleteKeyValuePair = function(myKey) {
    IFManager.IFDeleteStorageItem(this.localDbPrefix + myKey);
};

/**
 * Clear all data from the local storage
 */
CommonStorageClass.prototype.clearLocalStorage = function() {
    window.localStorage.clear();
};