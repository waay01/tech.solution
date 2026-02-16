'use strict'
const path = require('path');

const { GUI, TABS } = require('../js/gui');
const i18n = require('../js/localization');
const { SITLProcess, SitlSerialPortUtils } = require('../js/customPage');
const Store = require('electron-store');
const store = new Store();

const localhost = "127.0.0.1"


var SITL_LOG = "";

TABS.sitl = {};
TABS.sitl.initialize = (callback) => {
 
    if (GUI.active_tab != 'sitl') {
        GUI.active_tab = 'sitl';
    }

    GUI.load(path.join(__dirname, "sitl.html"), function () {
        i18n.localize();
    
    var currentSim, currentProfile, profiles;
    var mapping = new Array(28).fill(0);
    var serialProtocolls = SitlSerialPortUtils.getProtocolls();
    var sim_e = $('#simulator');
    var enableSim_e = $('#sitlEnableSim');
    var port_e = $('#simPort');
    var simIp_e = $('#simIP');
    var useImu_e = $('#sitlUseImu');
    var profiles_e = $('#sitlProfile');
    var profileSaveBtn_e = $('#sitlProfileSave');
    var profileNewBtn_e = $('#sitlProfileNew');
    var profileDeleteBtn_e = $('#sitlProfileDelete');
    var serialPorts_e = $('#sitlSerialPort');
    var serialReceiverEnable_e = $('#serialReceiverEnable');
    var serialUart_e = $('#sitlSerialUART');
    var protocollPreset_e = $('#serialProtocoll'); 
    var baudRate_e = $('#sitlBaud');
    var stopBits_e = $('#serialStopbits');
    var parity_e = $('#serialParity');
    
    if (SITLProcess.isRunning) {
        $('.sitlStart').addClass('disabled');
        $('.sitlStop').removeClass('disabled');
    } else {
        $('.sitlStop').addClass('disabled');
        $('.sitlStart').removeClass('disabled');
    }

    var $sitlLog = $('#sitlLog');
    $sitlLog.val(SITL_LOG);
    if ($sitlLog && $sitlLog.length == 1) {
        $sitlLog.val(SITL_LOG);
        $sitlLog.animate({scrollTop: $sitlLog[0].scrollHeight -  $sitlLog.height()}, "fast");
    }

    profiles = stdProfiles.slice(0);
    var sitlProfiles = store.get('sitlProfiles', false);
    if (sitlProfiles) {
        profiles.push(...sitlProfiles);
    }
    initElements(true);
    
    
    SitlSerialPortUtils.resetPortsList();
    SitlSerialPortUtils.pollSerialPorts(ports => {
        serialPorts_e.find('*').remove();
        ports.forEach(port => {
            serialPorts_e.append(`<option value="${port}">${port}</option>`)
        });

    });
    
    enableSim_e.on('change', () => {
        currentProfile.simEnabled = enableSim_e.is(':checked');
        updateSim();
    });

    sim_e.on('change', () => {     
        updateSim();
    });
    
    profiles_e.on('change', () => {
        updateCurrentProfile();
    });

    port_e.on('change', () => {
        if (!currentSim.isPortFixed) {
            var port = parseInt(port_e.val());
            if (port != NaN)
                currentProfile.port = parseInt(port_e.val());
        } 
    });

    simIp_e.on('change', () => {
        currentProfile.ip = simIp_e.val();
    });

    useImu_e.on('change', () => {
        currentProfile.useImu = useImu_e.is(':checked');
    });

    $('.sitlStart').on('click', ()=> {
        $('.sitlStart').addClass('disabled');
        $('.sitlStop').removeClass('disabled');

        var sim, simPort, simIp, channelMap = "";

        if (enableSim_e.is(':checked')) {
            switch(currentSim.name) {
                case 'X-Plane':
                    sim = 'xp';
                    break;
                case 'RealFlight':
                    sim = 'rf'
                    break;
            }
        }

        if (port_e.val() !== "") {
            simPort = port_e.val();
        }
        
        if (simIp_e.val() !== "") {
            simIp = simIp_e.val();
        }
        
        const zeroPad = (num, places) => String(num).padStart(places, '0');

        for (let i = 0; i < currentSim.inputChannels; i++) {
            var inavChan = mapping[i];
            if (inavChan == 0) {
                continue;
            } else if (inavChan < 13) {
                channelMap += `M${zeroPad(inavChan, 2)}-${zeroPad(i + 1, 2)},`;
            } else {
                channelMap += `S${zeroPad(inavChan - 12, 2)}-${zeroPad(i + 1, 2)},`;
            }
        }
        channelMap = channelMap.substring(0, channelMap.length - 1);
        
        var serialOptions = null;
        if ( serialReceiverEnable_e.is(':checked') && !!serialPorts_e.val()) {
            var selectedProtocoll = protocollPreset_e.find(':selected').val();
            if (selectedProtocoll == "manual") {
                serialOptions = {
                    protocollName: "manual",
                    baudRate: baudRate_e.val() || currentProfile.baudRate || "115200",
                    stopBits: stopBits_e.val() || currentProfile.stopBits || "One",
                    parity: parity_e.val() || currentProfile.parity || "None",
                    serialPort: serialPorts_e.val() || currentProfile.serialPort || "",
                    serialUart: serialUart_e.val() || currentProfile.serialUart || -1
                }
            } else {;
                serialOptions = {
                    protocollName: selectedProtocoll || "SBus",
                    serialPort: serialPorts_e.val() || currentProfile.serialPort || "" ,
                    serialUart: serialUart_e.val() || currentProfile.serialUart || -1
                }
            }
        }

        appendLog("\n");
        
        SITLProcess.start(currentProfile.eepromFileName, sim, useImu_e.is(':checked'), simIp, simPort, channelMap, serialOptions,result => {
            appendLog(result);
        });
    });

    $('.sitlStop').on('click', ()=> {
        $('.sitlStop').addClass('disabled');
        $('.sitlStart').removeClass('disabled');
        SITLProcess.stop();
        appendLog(i18n.getMessage('sitlStopped'));
    });

    function appendLog(message){
        SITL_LOG += message;
        var $sitlLog = $('#sitlLog');
        if ($sitlLog && $sitlLog.length == 1) {
            $sitlLog.val(SITL_LOG);
            $sitlLog.animate({scrollTop: $sitlLog[0].scrollHeight -  $sitlLog.height()}, "fast");
        }
    }

    GUI.content_ready(callback);
    });
};

TABS.sitl.cleanup = (callback) => {
    SitlSerialPortUtils.stopPollSerialPorts();
    if (callback) 
        callback();
};

// 'use strict';

// import mspHelper from './../js/msp/MSPHelper';
// import MSPCodes from './../js/msp/MSPCodes';
// import MSP from './../js/msp';
// import { GUI, TABS } from './../js/gui';
// import FC from './../js/fc';
// import i18n from './../js/localization';
// import CONFIGURATOR from './../js/data_storage';

// TABS.customPage = {};

// TABS.customPage.initialize = function (callback, scrollPosition) {
//     if (GUI.active_tab != 'customPage') {
//         GUI.active_tab = 'customPage';
//     }

//     var content = $('#content');
//     content.data('empty', !!content.is(':empty'));
//     content.empty();

//     $('#cache .data-customPage').clone().appendTo(content);

//     function content_ready() {
//         GUI.content_ready(callback);
//     }

//     function load_html() {
//         setupVerticalTabs();
        
//         setupEventHandlers();

//         content_ready();
//     }

//     function setupVerticalTabs() {
//         $('a.tab-osd').on('click', function() {
//             $('.tab-content').hide();
//             $('.tab-osd-content').show();
//         });

//         $('a.tab-sensors').on('click', function() {
//             $('.tab-content').hide();
//             $('.tab-sensors-content').show();
//         });

//         $('.tab-osd-content').show();
//     }

//     if (CONFIGURATOR.connectionValid) {
//         mspHelper.loadSensorConfig(load_html);
//     } else {
//         load_html();
//     }
// };

// TABS.customPage.cleanup = function (callback) {
//     if (callback) callback();
// };