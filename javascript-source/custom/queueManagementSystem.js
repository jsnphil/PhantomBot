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

(function () {
    var userToBump = '',
            requireOverride = false,
            requestToBump,
            bumpPosition,
            bumpStatusEnum = {
                PENDING: 0,
                FULFILLED: 1
            },
            bumpMethodEnum = {
                CMD: 0,
                BITS: 1,
                DONATION: 2,
                SUB: 3,
                GIFTSUB: 4,
                RAID: 5
            },
            autoBumpEnabled = true,
            channelPointsRemaining = 0,
            beanBumpsRemaining = 0;

    $.bind('ircChannelMessage', function (event) {
        if ($.isModv3(event.getSender()) && requireOverride === true && event.getMessage().equalsIgnoreCase("allow")) {
            performBump();
        }
    });

    // TODO Make this function work with move and bump, use an argument to indicate which messages to load?
    function performBump() {
        var existingRequest = $.getUserRequest(userToBump);
        if (existingRequest != null) {

            if (existingRequest[0].isBump()) {
                $.say($.whisperPrefix(userToBump) + $.lang.get('songqueuemgmt.command.bump.pending'));
                resetBump();
                return;
            }

            var position = $.getBumpPosition();
            existingRequest[0].setBumpFlag();
            $.currentPlaylist().addToQueue(existingRequest[0], position);
            $.getConnectedPlayerClient().pushSongList();
            $.say($.whisperPrefix(userToBump) + $.lang.get('songqueuemgmt.command.bump.success', position + 1));

            incrementBumpCount(userToBump);
        } else {
            $.say($.whisperPrefix(userToBump) + $.lang.get('songqueuemgmt.command.move.none', userToBump));
        }

        resetBump();
    }

    function resetBump() {
        // Reset the bump variables
        userToBump = '';
        requireOverride = false;
        requestToBump = null;
        bumpPosition = 0;
    }

    function getBumpData(user) {
        $.log.file('queue-management', 'Looking for bump data for user [' + user + ']');

        var bump;
        for (var i = 0; i < bumpsArray.length; i++) {
            bump = bumpData[i];
            if (bump != null && bump.getUser().equalsIgnoreCase(user.toLowerCase())) {
                $.log.file('queue-management', 'Found bump data for [' + user + ']');

                return bump;
            }
        }

        if (bump == null) {
            $.log.file('queue-management', 'Didn\'t find bump data for user, creating one');
            return new UserBumpData(user);
        }
    }

    /** Channel Points Bumps **/
    function getChannelPointsBumpCount() {
        return channelPointsRemaining;
    }

    function decrementChannelPointsBump() {
        if (channelPointsRemaining != 0) {
            channelPointsRemaining--;
        }
    }

    function incrementChannelPointsBump() {
        channelPointsRemaining++;
    }

    function resetChannelPointsBumps() {
        channelPointsRemaining = 3;
    }

    /** Bean Bumps **/
    function getBeanBumpCount() {
        return beanBumpsRemaining;
    }

    function decrementBeanBump() {
        if (beanBumpsRemaining != 0) {
            beanBumpsRemaining--;
        }
    }

    function incrementBeanBump() {
        beanBumpsRemaining++;
    }

    function resetBeanBumps() {
        beanBumpsRemaining = 3;
    }

    /**/

    function getBumpCount(user) {
        $.log.file('queue-management', 'Looking up bump count for user [' + user + ']');
        return $.getSetIniDbNumber('bumpSystem_bumpCounts', user.toLowerCase(), 0);
    }

    function getFreeBumpUsed(user) {
        $.log.file('queue-management', 'Looking up free bump for user [' + user + ']');
        return $.getSetIniDbBoolean('bumpSystem_freeBumps', user.toLowerCase(), false);
    }

    function markFreeBumpUsed(user) {
        $.log.file('queue-management', 'Marking free bump as used for user [' + user + ']');
        $.setIniDbBoolean('bumpSystem_freeBumps', user.toLowerCase(), true);
    }

    function incrementBumpCount(user) {
        $.log.file('queue-management', 'Incrementing bump count for user [' + user + ']');
        $.inidb.incr('bumpSystem_bumpCounts', user.toLowerCase(), 1);
    }

    function addPendingBump(user, status) {
        $.log.file('queue-management', 'Adding pending bump for user [' + user + ']');
        $.setIniDbString('bumpSystem_pendingBumps', user.toLowerCase(), status);
    }

    function getPendingBump(user) {
        $.log.file('queue-management', 'Getting pending bump for user [' + user + ']');
        return $.inidb.get('bumpSystem_pendingBumps', user.toLowerCase());
    }

    function removePendingBump(user) {
        $.log.file('queue-management', 'Removing pending bump for user [' + user + ']');
        $.inidb.del('bumpSystem_pendingBumps', user.toLowerCase());
    }

    function resetBumps() {
        $.log.file('queue-management', 'Resetting bump data');

        $.log.file('queue-management', 'Clearing bump counts');
        $.inidb.RemoveFile('bumpSystem_bumpCounts');
        $.inidb.AddFile("bumpSystem_bumpCounts");


        $.log.file('queue-management', 'Clearing used free bumps');
        $.inidb.RemoveFile('bumpSystem_freeBumps');
        $.inidb.AddFile("bumpSystem_freeBumps");


        $.log.file('queue-management', 'Clearing pending bumps');
        $.inidb.RemoveFile('bumpSystem_pendingBumps');
        $.inidb.AddFile("bumpSystem_pendingBumps");


        $.log.file('queue-management', 'Clearing bits counts');
        $.inidb.RemoveFile('bumpSystem_bitsCounts');
        $.inidb.AddFile("bumpSystem_bitsCounts");
        
        clearExpiredBumpCooldowns();
    }
    
    function clearExpiredBumpCooldowns() {
        $.log.file('queue-management', 'Clearing expired bump cooldowns');
        
        var users = $.inidb.GetKeyList('bumpSystem_beanbumpUserCooldowns', '');
        
        for (var i = 0; i < users.length; i++) {
            $.consoleDebug("Checking cooldown timestamp for " + users[i]);
            var userCooldownTime = $.getSetIniDbNumber('bumpSystem_beanbumpUserCooldowns', $.user.sanitize(users[i]), 0);
            
            if ($.systemTime() > userCooldownTime) {
                $.consoleDebug("Cooldown for " + users[i] + " has expired, deleting");
                $.inidb.del('bumpSystem_beanbumpUserCooldowns', $.user.sanitize(users[i]));
            }
        }
    }

    $.bind('command', function (event) {
        var sender = event.getSender(), // Gets the person who used the command
                command = event.getCommand(), // Gets the command being used
                args = event.getArgs(); // Arguments used in the command

        if (!($.botMode().equalsIgnoreCase("music"))) {
            $.say($.whisperPrefix(sender) + $.lang.get('songqueuemgmt.bump.disabled'));
            return;
        }

        if (command.equalsIgnoreCase('bump')) {
            if (!args[0]) {
                $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.bump.usage'));
                return;
            }

            if (!args[1]) {
                bumpPosition = $.getBumpPosition();
            } else {
                if (isNaN(parseInt(args[1]))) {
                    bumpPosition = $.getBumpPosition();
                } else {
                    bumpPosition = args[1] - 1;
                }
            }

            if (bumpPosition > $.currentPlaylist().getRequestsCount()) {
                $.say($.whisperPrefix(sender) + $.lang.get('songqueuemgmt.command.move.error.length', $.currentPlaylist.getRequestsCount()));
                return;
            }

            userToBump = args[0];

            var requestsList = $.currentPlaylist().getRequestList();

            
            userToBump = $.user.sanitize(userToBump);
            
            $.log.file('queue-management', '[bumpCmd] - Requesting bumping user ' + userToBump + ' to position ' + bumpPosition);

            if (requestsList.length == 0) {
                $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.queue.empty'));
                return;
            }

            var userBumpCount = getBumpCount(userToBump);
            var freeBumpUsed = getFreeBumpUsed(userToBump);

            $.log.file('queue-management', '[bumpCmd] - Bump count: ' + userBumpCount + ', Free bump used: ' + freeBumpUsed);


            if (userBumpCount >= 2 || freeBumpUsed) {
                // Bump limit is reached
                $.say($.whisperPrefix(sender) + $.lang.get('songqueuemgmt.command.bump.limit.reached', userToBump));
                requireOverride = true;

                // Close the bump window after 30 seconds
                setTimeout(function () {
                    resetBump();
                }, (1e4));
            } else {
                markFreeBumpUsed(userToBump);
                performBump(userToBump);
            }
        }

        if (command.equalsIgnoreCase('move')) {
            if (!args[1]) {
                $.say($.whisperPrefix(sender) + $.lang.get('songqueuemgmt.command.move.usage'));
                return;
            }

            var requester = args[0];
            var newPosition = args[1];

            if (requester.startsWith("@")) {
                requester = requester.substring(1, requester.length);
            }

            if (newPosition > $.currentPlaylist().getRequestsCount()) {
                $.say($.whisperPrefix(sender) + $.lang.get('songqueuemgmt.command.move.error.length', $.currentPlaylist.getRequestsCount()));
                return;
            }

            var newQueuePosition = newPosition - 1;

            var requestsList = $.currentPlaylist().getRequestList();

            if (requestsList.length == 0) {
                $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.queue.empty'));
                return;
            }

            var i, requestFound = false;
            var existingRequest;
            for (i = 0; i < requestsList.length; i++) {
                existingRequest = requestsList[i];

                if (existingRequest.getOwner().equalsIgnoreCase(requester)) {
                    requestFound = true;
                    break;
                }
            }

            if (requestFound) {
                $.currentPlaylist().addToQueue(existingRequest, newQueuePosition);
                $.getConnectedPlayerClient().pushSongList();

                $.say($.whisperPrefix(sender) + $.lang.get('songqueuemgmt.command.move.success', requester, newPosition));
            } else {
                $.say($.whisperPrefix(sender) + $.lang.get('songqueuemgmt.command.move.none', requester));
                return;
            }
        }

        if (command.equalsIgnoreCase('bumpcount')) {
            var count = $.getBumpPosition();

            if (count == 1) {
                $.say($.lang.get('songqueuemgmt.command.bump.count', 'is 1'));
            } else {
                $.say($.lang.get('songqueuemgmt.command.bump.count', 'are ' + count));
            }

            return;
        }

        if (command.equalsIgnoreCase('raidtest')) {
            saveRaidFromUsername("username", 50);
        }

        if (command.equalsIgnoreCase('position')) {
            var request = $.getUserRequest(sender);
            if (request == null) {
                $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.position.none'));
            } else {
                var i = request[1];
                if (i == 0) {
                    playTime = "It's up next!";
                } else {
                    playTime = "There is " + $.secondsToTimestamp(request[2]) + " worth of music before your song";
                }

                if ($.isQueueShuffleEnabled() && !request[0].isBump()) {
                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.position.shuffle'));
                    return;
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.position.success', (i + 1), playTime));
                }
            }

            return;
        }

        if (command.equalsIgnoreCase('bumpxfer')) {
            if (!(args[0] && args[1])) {
                $.say($.whisperPrefix(sender) + $.lang.get('songqueuemgmt.autobump.xfer.usage'));
                return;
            }

            var bumpRecipientRequest = $.getUserRequest(args[1]);

            if (bumpRecipientRequest == null) {
                $.say($.whisperPrefix(sender) + $.lang.get('songqueuemgmt.command.move.none', args[0]));
                return;
            }

            var bumpGifterRequest = $.getUserRequest(args[0]);
            if (bumpGifterRequest != null && bumpGifterRequest[0].isBump()) {
                bumpGifterRequest[0].clearBumpFlag();
                var newPosition = $.getBumpPosition();

                if (newPosition != 0) {
                    newPosition++;
                }

                $.currentPlaylist().addToQueue(bumpGifterRequest[0], newPosition);

                bumpRecipientRequest[0].setBumpFlag();
                $.currentPlaylist().addToQueue(bumpGifterRequest[0], $.getBumpPosition());

                $.getConnectedPlayerClient().pushSongList();

                autoBump(args[1], 'gift');
            } else {
                var pendingBump = getPendingBump(args[0]);
                if (pendingBump != null) {
                    removePendingBump(args[0]);

                    $.currentPlaylist().addToQueue(bumpRecipientRequest[0], $.getBumpPosition());
                    bumpRecipientRequest[0].setBumpFlag();

                    $.getConnectedPlayerClient().pushSongList();

                    $.say($.whisperPrefix(sender) + $.lang.get('songqueuemgmt.autobump.xfer.success', args[0], args[1]));

                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('songqueuemgmt.autobump.xfer.404', args[0]));
                }
            }
        }

        if (command.equalsIgnoreCase('removebump')) {
            if (!args[0]) {
                $.say($.whisperPrefix(sender) + $.lang.get('songqueuemgmt.autobump.remove.usage'));
                return;
            }

            var request = $.getUserRequest(args[0]);
            if (request != null) {
                request[0].clearBumpFlag();
                var newPosition = $.getBumpPosition();

                if (newPosition != 0) {
                    newPosition++;
                }

                $.currentPlaylist().addToQueue(request[0], newPosition);
                $.getConnectedPlayerClient().pushSongList();
                $.say($.whisperPrefix(sender) + $.lang.get('songqueuemgmt.autobump.remove.success', args[0]));
            } else {
                $.say($.whisperPrefix(sender) + $.lang.get('songqueuemgmt.command.move.404', args[0]));
            }
        }

        if (command.equalsIgnoreCase('autobump')) {
            if (!(args[0])) {
                $.say($.whisperPrefix(sender) + $.lang.get('songqueuemgmt.autobump.control.usage'));
                return;
            }

            if ("enable".equalsIgnoreCase(args[0])) {
                autoBumpEnabled = true;
                $.say($.lang.get('songqueuemgmt.autobump.enabled'));
            }

            if ("disable".equalsIgnoreCase(args[0])) {
                autoBumpEnabled = false;
                $.say($.lang.get('songqueuemgmt.autobump.disabled'));
            }
        }

        if (command.equalsIgnoreCase('resetbumps')) {
            resetBumps();
        }

        if (command.equalsIgnoreCase('beanbump')) {
            if (args[0] && args[0].equalsIgnoreCase("cooldown")) {
                if (isNaN(parseInt(args[1]))) {
                    $.say($.whisperPrefix(sender) + $.lang.get('songqueuemgmt.beanbumps.cooldown.usage'));
                } else {
                    $.inidb.set("bumpSystem_beanbumpConfig", "cooldown", args[1]);
                    $.say($.whisperPrefix(sender) + $.lang.get('songqueuemgmt.beanbumps.cooldown.set', args[1]));
                }
                return;
            }
            
            if (!($.botMode().equalsIgnoreCase("music")) || !autoBumpEnabled) {
                // Not in music mode, exiting
                return;
            }
            
            if (beanBumpsRemaining === 0) {
                $.say($.whisperPrefix(sender) + $.lang.get('songqueuemgmt.beanbumps.soldout'));
                
                // Phantombot already took the points to run the command, so refund them
                $.inidb.incr('points', $.user.sanitize(sender), 300);
                return;
            }
            
              if (getFreeBumpUsed($.user.sanitize(sender))) {
                $.say($.whisperPrefix(sender) + $.lang.get('songqueuemgmt.beanbumps.free.bump.used'));
                
                 // Phantombot already took the points to run the command, so refund them
                $.inidb.incr('points', $.user.sanitize(sender), 300);
                return;
            }
            
            // Check cooldown value for user
            var userCooldownTime = $.getSetIniDbNumber('bumpSystem_beanbumpUserCooldowns', $.user.sanitize(sender), 0);

            if ($.systemTime() < userCooldownTime) {
                var cooldownExpiration = new Date(userCooldownTime);
                var cooldownDate = cooldownExpiration.getMonth() + 1 + "/" + cooldownExpiration.getDate() + "/" + cooldownExpiration.getFullYear();
                $.say($.whisperPrefix(sender) + $.lang.get('songqueuemgmt.beanbumps.cooldown.user.set', cooldownDate));
                
                // Phantombot already took the points to run the command, so refund them
                $.inidb.incr('points', $.user.sanitize(sender), 300);
                return;
            }

            var request = $.getUserRequest($.user.sanitize(sender));
            if (request != null) {
                var bumpPosition = $.getBumpPosition();
                request[0].setBumpFlag();
                $.currentPlaylist().addToQueue(request[0], bumpPosition);
                $.getConnectedPlayerClient().pushSongList();
                $.say($.whisperPrefix(sender) + $.lang.get('songqueuemgmt.command.bump.success', bumpPosition + 1));

                markFreeBumpUsed($.user.sanitize(sender));
                decrementBeanBump();
                
                $.getConnectedPlayerClient().pushQueueInformation();
                
                // TODO Store cooldown info for user
                var cooldownLength = $.inidb.get("bumpSystem_beanbumpConfig", "cooldown");
                $.consoleDebug("Cooldown length" + cooldownLength);
                
                var userCooldown = (cooldownLength * 1000) + $.systemTime();
                $.consoleDebug("Setting user cooldown for " + $.user.sanitize(sender) + " to " + userCooldown);

                $.inidb.set("bumpSystem_beanbumpUserCooldowns", $.user.sanitize(sender), userCooldown);
            } else {
                $.say($.whisperPrefix(sender) + $.lang.get('songqueuemgmt.beanbumps.song.404'));
                // Phantombot already took the points to run the command, so refund them
                $.inidb.incr('points', $.user.sanitize(sender), 300);
            }
        }
    });

    function autoBump(user, method) {
        $.log.file('queue-management', '[autoBump] - Bot mode: ' + $.botMode());

        if (!($.botMode().equalsIgnoreCase("music")) || !autoBumpEnabled) {
            // Not in music mode, exiting
            return;
        }

        $.log.file('queue-management', '[autoBump] - Running auto-bump for user [' + user + '], method [' + method + ']');

        var userBumpCount = getBumpCount(user);
        $.log.file('queue-management', '[autoBump] - Auto bump triggered for user  [' + user + '] for ' + method);

        // TODO Needs an addition check to see if user already has a pending bump.  If yes, save as a new pending bump (if they still have one left)
        if (userBumpCount < 2) {
            $.log.file('queue-management', '[autoBump] - Bump count [' + userBumpCount + '], processing auto-bump');
            var userRequest = $.getUserRequest(user);

            if (userRequest != null) {
                if (userRequest[0].isBump()) {
                    $.log.file('queue-management', '[autoBump] - User already has a bumped song in the queue');
                    return;
                }

                var bumpPosition = $.getBumpPosition();
                $.log.file('queue-management', '[autoBump] - Found user request, bumping to position [' + bumpPosition + ']');

                userRequest[0].setBumpFlag();

                $.currentPlaylist().addToQueue(userRequest[0], bumpPosition);
                $.getConnectedPlayerClient().pushSongList();

                $.say($.whisperPrefix(user) + $.lang.get('songqueuemgmt.command.bump.success', bumpPosition + 1));
            } else {
                $.log.file('queue-management', '[autoBump] - No request found for user, saving for their next request');
                addPendingBump(user, method);

                $.say($.whisperPrefix(user) + $.lang.get('songqueuemgmt.autobump.nextsong'));
            }

            incrementBumpCount(user);
        } else {
            $.log.file('queue-management', '[autoBump] - User has already fulfilled all their allowed bumps');
        }
    }

    function bumpMethod() {
        return bumpMethodEnum;
    }

    function bumpStatus() {
        return bumpStatusEnum;
    }

    function enableAutobumps() {
        autoBumpEnabled = true;
    }

    function loadSotnWinner() {
        var winners = $.inidb.GetKeyList('sotn_winners', '');
        $.log.file('queue-management', '[loadSotnWinner] - Winners: ' + winners.join());

        if (winners == null || winners.length == 0) {
            $.log.file('queue-management', '[loadSotnWinner] - No winner to load, skipping');
            return;
        }

        var latestWinner = winners[winners.length - 1];

        var winner = $.inidb.GetString('sotn_winners', '', latestWinner);
        $.log.file('queue-management', '[loadSotnWinner] - Winner: ' + latestWinner + ' ' + winner);

        var winnerJson = JSON.parse(winner);

        addPendingBump(winnerJson.username, 'sotn');
    }

    $.autoBump = autoBump;
    $.getBumpData = getBumpData;
    $.bumpMethod = bumpMethod;
    $.bumpStatus = bumpStatus;
    $.incrementBumpCount = incrementBumpCount;
    $.removePendingBump = removePendingBump;
    $.getPendingBump = getPendingBump;
    $.resetBumps = resetBumps;
    $.enableAutobumps = enableAutobumps;
    $.addPendingBump = addPendingBump;

    $.getChannelPointsBumpCount = getChannelPointsBumpCount;
    $.decrementChannelPointsBump = decrementChannelPointsBump;
    $.incrementChannelPointsBump = incrementChannelPointsBump;
    $.resetChannelPointsBumps = resetChannelPointsBumps;

    $.getBeanBumpCount = getBeanBumpCount;
    $.decrementBeanBump = decrementBeanBump;
    $.incrementBeanBump = incrementBeanBump;
    $.resetBeanBumps = resetBeanBumps;

    $.loadSotnWinner = loadSotnWinner;

    /**
     * @event initReady
     */
    $.bind('initReady', function () {
        // `script` is the script location.
        // `command` is the command name without the `!` prefix.
        // `permission` is the group number. 0, 1, 2, 3, 4, 5, 6 and 7.
        // These are also used for the permcom command.
        // $.registerChatCommand('script', 'command', 'permission');

        $.registerChatCommand('./custom/queueManagementSystem.js', 'bump', 2);
        $.registerChatCommand('./custom/queueManagementSystem.js', 'move', 2);
        $.registerChatCommand('./custom/queueManagementSystem.js', 'bumplimit', 2);
        $.registerChatCommand('./custom/queueManagementSystem.js', 'bumpcount', 2);
        $.registerChatCommand('./custom/queueManagementSystem.js', "position");

        $.registerChatCommand('./custom/queueManagementSystem.js', "bumpxfer", 2);
        $.registerChatCommand('./custom/queueManagementSystem.js', "removebump", 2);

        $.registerChatCommand('./custom/queueManagementSystem.js', "readd", 2);

        $.registerChatCommand('./custom/queueManagementSystem.js', "raidtest");

        $.registerChatCommand('./custom/queueManagementSystem.js', 'autobump', 2);

        $.registerChatCommand('./custom/queueManagementSystem.js', 'resetbumps', 2);


        $.registerChatCommand('./custom/queueManagementSystem.js', 'beanbump', 7);
        $.registerChatSubcommand('beanbump', 'cooldown', 2);
    });
})();