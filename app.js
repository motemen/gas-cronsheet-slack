/// <reference path="typings/bundle.d.ts" />
// Configuration
var WEBHOOK_URL = 'SET URL LIKE https://hooks.slack.com/services/****/****/****';
var SLACK_USERNAME = 'cronsheet';
var SLACK_ICON_EMOJI = ':clock3:';
// ... END Configuration
var COLUMN_DATE = 1;
var COLUMN_HOUR = 2;
var COLUMN_START_MESSAGE = 3;
function doPost() {
    var now = new Date();
    var sheet = SpreadsheetApp.getActiveSheet();
    var maxRows = sheet.getMaxRows(), maxCols = sheet.getMaxColumns();
    var headerValues = sheet.getRange(1, 1, 1, maxCols).getValues()[0];
    for (var r = 2; r <= maxRows; r++) {
        var row = sheet.getRange(r, 1, r, maxCols);
        var date = row.getCell(1, COLUMN_DATE).getValue(), hour = row.getCell(1, COLUMN_HOUR).getValue();
        if (date === '' && hour === '')
            break;
        if (!conditionMatches(row.getCell(1, COLUMN_DATE).getValue(), row.getCell(1, COLUMN_HOUR).getValue(), now)) {
            continue;
        }
        var msg = new SlackMessage({
            username: SLACK_USERNAME,
            icon_emoji: SLACK_ICON_EMOJI,
            header: '<' + sheet.getParent().getUrl() + '|' + sheet.getParent().getName() + '> @' + now
        });
        for (var c = COLUMN_START_MESSAGE; c <= row.getLastColumn(); c++) {
            if (headerValues[c - 1].toString() === '')
                break;
            msg.addField(headerValues[c - 1].toString(), '' + row.getCell(1, c).getValue());
        }
        var options = {
            method: 'post',
            payload: JSON.stringify(msg.toPayload())
        };
        var res = UrlFetchApp.fetch(WEBHOOK_URL, options);
        if (res.getResponseCode() != 200) {
            Logger.log(res);
        }
    }
}
var SlackMessage = (function () {
    function SlackMessage(config) {
        this.fields = [];
        this.username = config.username;
        this.icon_emoji = config.icon_emoji;
        this.header = config.header;
    }
    SlackMessage.prototype.addField = function (title, value) {
        this.fields.push({ title: title, value: value });
    };
    SlackMessage.prototype.toPayload = function () {
        var payload = {
            attachments: [
                {
                    fallback: this.fields.map(function (p) { return p.title + '=' + p.value; }).join('; '),
                    pretext: this.header,
                    fields: this.fields
                }
            ],
            username: this.username,
            icon_emoji: this.icon_emoji
        };
        return payload;
    };
    return SlackMessage;
})();
var DOW_NAMES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
function conditionMatches(date, hour, now) {
    if (!dateMatches(date, now))
        return false;
    if (!hourMatches(hour, now))
        return false;
    return true;
}
function dateMatches(date, now) {
    if (!date)
        return false;
    if (date === '*') {
        return true;
    }
    if (date instanceof Date) {
        var d = date;
        return d.getFullYear() === now.getFullYear()
            && d.getMonth() === now.getMonth()
            && d.getDate() === now.getDate();
    }
    if (date.toString().toLowerCase() === 'weekday') {
        date = 'mon,tue,wed,thu,fri';
    }
    var days = date.toString().toLowerCase().split(/[, ]+/);
    var day = DOW_NAMES[now.getDay()];
    if (days.indexOf(day) !== -1) {
        return true;
    }
    return false;
}
function hourMatches(hour, now) {
    if (!hour)
        return false;
    if (hour.toString() === '*') {
        return true;
    }
    return hour.toString().split(/,/).indexOf(now.getHours().toString()) !== -1;
}
