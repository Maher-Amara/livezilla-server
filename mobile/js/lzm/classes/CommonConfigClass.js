/****************************************************************************************
 * LiveZilla CommonConfigClass.js
 *
 * Copyright 2016 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/

CommonConfigClass.lz_brand_color = '#74b924';
CommonConfigClass.lz_tab_inactive_bg = '#E0E0E0';
CommonConfigClass.lz_tab_inactive_color = '#666';
CommonConfigClass.lz_tab_active_color = '#fff';
CommonConfigClass.lz_major = 8;

function CommonConfigClass() {
    this.lz_version = '8.0.0.0'; // version of the lz client for compatibility reasons with the server
    this.lz_app_version = '';
    this.lz_min_version = '7.0.1.0'; // min version needed for the app
    this.lz_reload_interval = 5000; // time between polling the server in miliseconds
    this.lz_user_states = [
        {index: 0, text:'Available',icon:'img/lz_online.png',icon14:'img/lz_online_14.png'},
        {index: 1, text:'Busy',icon:'img/lz_busy.png',icon14:'img/lz_busy_14.png'},
        {index: 2, text:'Offline',icon:'img/lz_offline.png',icon14:'img/lz_offline_14.png'},
        {index: 3, text:'Away',icon:'img/lz_away.png',icon14:'img/lz_away_14.png'}
    ];
    this.pollTimeout = 45000;
    this.noAnswerTimeBeforeLogout = 20000;
}
