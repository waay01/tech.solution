'use strict';

const path = require('path');
const { GUI, TABS } = require('./../js/gui');
const i18n = require('./../js/localization');

const solutions = {};

solutions.initialize = function (callback) {
    if (GUI.active_tab !== 'solutions') {
        GUI.active_tab = 'solutions';
    }

    GUI.load(path.join(__dirname, "solutions.html"), function () {
        i18n.localize();

        $('.subtab__header_label').on('click', function () {
            const targetId = $(this).attr('for');

            $('.subtab__header_label').removeClass('subtab__header_label--current');
            $(this).addClass('subtab__header_label--current');

            $('#osd, #sensors').hide(); 
            $('#' + targetId).show();
        });

        $('.subtab__header_label').first().click();

        GUI.content_ready(callback);
    });
};

solutions.cleanup = function (callback) {
    if (callback) callback();
};

TABS.solutions = solutions;