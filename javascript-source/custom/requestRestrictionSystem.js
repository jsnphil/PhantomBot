/*
 * Copyright (C) 2016-2018 phantombot.tv
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * requestChannelRestrictionSystem.js
 *
 * General bot maintenance and control
 */
(function () {

    var channelRestrictionModeEnabled = false;

    function isRequestRestrictionEnabled() {
        return channelRestrictionModeEnabled;
    }

    $.bind('command', function (event) {
        var sender = event.getSender(), // Gets the person who used the command
                command = event.getCommand(), // Gets the command being used
                args = event.getArgs(), // Arguments used in the command
                action = args[0];

        if (command.equalsIgnoreCase("restrictedChannels")) {
            if (action == null) {
                $.say(sender, $.lang.get("channel.restiction.usage"));
            }

            if (action.equalsIgnoreCase("enable")) {
                channelRestrictionModeEnabled = true;
                $.say($.lang.get("channel.restiction.enabled"));
            }

            if (action.equalsIgnoreCase("disable")) {
                channelRestrictionModeEnabled = false;
                $.say($.lang.get("channel.restiction.disabled"));
            }
            /*
             if (action.equalsIgnoreCase("add")) {
             if (args[1] == null) {
             $.say($.lang.get("channel.restiction.edit.usage"));
             } else {
             // TODO Add channel to database
             $.say($.lang.get("channel.restiction.add.success", args[1]));
             }
             }

             if (action.equalsIgnoreCase("remove")) {
             if (args[1] == null) {
             $.say($.lang.get("channel.restiction.edit.usage"));
             } else {
             // TODO Remove channel from database
             $.say($.lang.get("channel.restiction.edit.usage"));
             $.say($.lang.get("channel.restiction.remove.success", args[1]));
             }
             }*/

            if (action.equalsIgnoreCase('add')) {
                actionArgs = args.splice(2);

                if (!args[1]) {
                    $.say($.whisperPrefix(sender) + $.lang.get("channel.restiction.edit.usage"));
                    return;
                }

                $.inidb.set('ytpAllowedChannels', actionArgs.join(' ').trim().toLowerCase(), 'true');
                $.say($.whisperPrefix(sender) + $.lang.get('channel.restiction.add.success', actionArgs.join(' ').trim()));
                return;
            }

//                if (action.equalsIgnoreCase('remove')) {
//                    actionArgs = args.splice(2);
//                    if (!args[1]) {
//                        $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.blacklist.remove.usage.song'));
//                        return;
//                    }
//
//                    $.inidb.del('ytpAllowedChannels', actionArgs.join(' ').trim().toLowerCase());
//                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.blacklist.remove.success.song', actionArgs.join(' ').trim()));
//                    return;
//                }

        }
    });

    $.isRequestRestrictionEnabled = isRequestRestrictionEnabled;

    /**
     * @event initReady
     */
    $.bind('initReady', function () {
        // `script` is the script location.
        // `command` is the command name without the `!` prefix.
        // `permission` is the group number. 0, 1, 2, 3, 4, 5, 6 and 7.
        // These are also used for the permcom command.
        // $.registerChatCommand('script', 'command', 'permission');

        $.registerChatCommand('./custom/requestRestrictionSystem.js', 'restrictedChannels', 2);
    });
})();