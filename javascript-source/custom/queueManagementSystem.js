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
 * TODO Song request section needs to be updated to check the bumps to see if user has a pending bump
 * TODO 'Play' section of youtubeSystem needs to check if the request is a bump and update the status if it is
 * TODO May need a new data model to store the bumps in so that objects can be updated in place.  Needs testing
 * TODO Increment totalBumpCount
 */
(function () {
    var userToBump = "",
            requireOverride = false,
            requestToBump,
            bumpPosition,
            bumpsArray = new java.util.ArrayList,
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
            };

    /** END CONSTRUCTOR BumpedUser **/
    function Bump() {
        var status = '',
                method = '';

        this.getStatus = function () {
            return this.status;
        };

        this.setStatus = function (status) {
            this.status = status;
        };

        this.getMethod = function () {
            return this.method;
        };

        this.setMethod = function (method) {
            this.method = method;
        };
        /** End Bump */
    }

    function UserBumpData(user) {
        var bits = 0,
                donation = 0,
                freeBumpUsed = false,
                totalBumps = 0,
                bumps = new java.util.ArrayList;

        this.getUser = function () {
            return user;
        };

        this.getBits = function () {
            return this.bits;
        };

        this.setBits = function (bits) {
            this.bits = bits;
        };

        this.addBits = function (bits) {
            this.bits = this.bits + bits;
        };

        this.getDonation = function () {
            return this.donation;
        };

        this.setDonation = function (donation) {
            this.donation = donation;
        };

        this.addDonation = function (donation) {
            this.donation = this.donation + donation;
        };

        this.getFreeBumpUsed = function () {
            return this.freeBumpUsed;
        };

        this.setFreeBumpUsed = function (freeBumpUsed) {
            this.freeBumpUsed = freeBumpUsed;
        };

        this.getTotalBumps = function () {
            return this.totalBumps;
        };

        this.setTotalBumps = function (totalBumps) {
            this.totalBumps = totalBumps;
        };

        this.incrementBumpCount = function () {
            this.totalBumps++;
        };

        this.getBumps = function () {
            return this.bumps;
        };

        this.addBump = function (bump) {
            this.bumps.add(bump);
        };

        /** End UserBumpData */
    }

    $.bind('ircChannelMessage', function (event) {
        if ($.isModv3(event.getSender()) && requireOverride === true && event.getMessage().equalsIgnoreCase("allow")) {
            performBump();
        }
    });

    // TODO Make this function work with move and bump, use an argument to indicate which messages to load?
    function performBump(bumpData) {
        var existingRequest = $.getUserRequest(userToBump);
        if (existingRequest != null) {
            existingRequest[0].setBumpFlag();
            $.currentPlaylist().addToQueue(existingRequest[0], bumpPosition);
            $.getConnectedPlayerClient().pushSongList();
            $.say($.whisperPrefix(userToBump) + $.lang.get('songqueuemgmt.command.bump.success', bumpPosition + 1));

            var bump = new Bump();
            bump.setStatus(bumpStatusEnum.PENDING);
            bump.setMethod(bumpMethodEnum.CMD);

            $.log.file('queue-management', 'Saving new bump data');
            bumpData.add(bump);
        } else {
            $.say($.whisperPrefix(userToBump) + $.lang.get('songqueuemgmt.command.move.none', userToBump));
        }

        resetBump();
    }

    function resetBump() {
        // Reset the bump variables
        userToBump = "";
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
                return bump;
            }
        }

        if (bump == null) {
            $.log.file('queue-management', 'Didn\'t find bump data for user, creating one');
            return new UserBumpData(user);
        }
    }

    $.bind('command', function (event) {
        var sender = event.getSender(), // Gets the person who used the command
                command = event.getCommand(), // Gets the command being used
                args = event.getArgs(); // Arguments used in the command

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

            if (userToBump.startsWith("@")) {
                userToBump = userToBump.substring(1, userToBump.length());
            }

            if (requestsList.length == 0) {
                $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.queue.empty'));
                return;
            }

            var bumpData = getBumpData(userToBump);
            var userBumpCount = bumpData.getTotalBumps();

            if (userBumpCount >= 2 || bumpData.getFreeBumpUsed()) {
                // Bump limit is reached
                $.say($.whisperPrefix(sender) + $.lang.get('songqueuemgmt.command.bump.limit.reached', userToBump));
                requireOverride = true;

                // Close the bump window after 30 seconds
                setTimeout(function () {
                    resetBump();
                }, (1e4));
            } else {
                bumpData.setFreeBumpUsed(true);
                performBump(bumpData);
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

        // TODO Swap out with new bump objects
        if (command.equalsIgnoreCase('bumpxfer')) {
            if (!(args[0] && args[1])) {
                $.say($.whisperPrefix(sender) + $.lang.get('songqueuemgmt.autobump.xfer.usage'));
                return;
            }

            var bumpObj = JSON.parse($.getIniDbString('bumps', args[0], '{}'));
            var bumpFulfilled;
            if (bumpObj.hasOwnProperty('fulfilled')) {
                bumpFulfilled = (bumpObj.fulfilled == 'true');

                if (bumpFulfilled) {
                    $.say($.whisperPrefix(sender) + $.lang.get('songqueuemgmt.autobump.xfer.used', args[0]));
                    return;
                } else {
                    // Remove the gifter's bump
                    $.inidb.del('bumps', args[0]);
                    var request = $.getUserRequest(args[0]);
                    if (request != null) {
                        request[0].clearBumpFlag();
                        var newPosition = $.getBumpPosition();

                        if (newPosition != 0) {
                            newPosition++;
                        }

                        $.currentPlaylist().addToQueue(request[0], newPosition);
                        $.getConnectedPlayerClient().pushSongList();
                    }

                    // Create new bump for new user
                    autoBump(args[1], 'free', 'gift');

                    $.say($.whisperPrefix(sender) + $.lang.get('songqueuemgmt.autobump.xfer.success', args[0], args[1]));
                }
            } else {
                $.say($.whisperPrefix(sender) + $.lang.get('songqueuemgmt.autobump.remove.404', args[0]));
            }
        }

        // TODO Swap out with new bump objects
        if (command.equalsIgnoreCase('removebump')) {
            if (!args[0]) {
                $.say($.whisperPrefix(sender) + $.lang.get('songqueuemgmt.autobump.remove.usage'));
                return;
            }

            var bumpObj = JSON.parse($.getIniDbString('bumps', args[0], '{}'));
            var bumpFulfilled;
            if (bumpObj.hasOwnProperty('fulfilled')) {
                bumpFulfilled = (bumpObj.fulfilled == 'true');

                if (bumpFulfilled) {
                    $.say($.whisperPrefix(sender) + $.lang.get('songqueuemgmt.autobump.remove.used', args[0]));
                    return;
                } else {
                    $.inidb.del('bumps', args[0]);
                    var request = $.getUserRequest(args[0]);
                    if (request != null) {
                        request[0].clearBumpFlag();
                        var newPosition = $.getBumpPosition();

                        if (newPosition != 0) {
                            newPosition++;
                        }

                        $.currentPlaylist().addToQueue(request[0], newPosition);
                        $.getConnectedPlayerClient().pushSongList();
                    }
                    $.say($.whisperPrefix(sender) + $.lang.get('songqueuemgmt.autobump.remove.success', args[0]));
                }
            } else {
                $.say($.whisperPrefix(sender) + $.lang.get('songqueuemgmt.autobump.remove.404', args[0]));
            }
        }
    });

    function autoBump(user, method) {
        $.log.file('queue-management', '[autoBump] - Bot mode: ' + $.botMode());

        if (!($.botMode().equalsIgnoreCase("music"))) {
            // Not in music mode, exiting
            return;
        }

        $.log.file('queue-management', '[autoBump] - Running auto-bump for user [' + user + '], method [' + method + ']');

        var bumpData = getBumpData(user);
        var userBumpCount = bumpData.getTotalBumps();

        // TODO Needs an addition check to see if user already has a pending bump.  If yes, save as a new pending bump (if they still have one left)
        if (userBumpCount < 2) {
            var bump = new Bump();
            bump.setStatus(bumpStatusEnum.PENDING);
            bump.setMethod(method);

            bumpData.addBump(bump);

            // TODO How to update the object in place.  New list structure?
            bumpsArray.add(bumpData);

            $.log.file('queue-management', '[autoBump] - Bump has not been fulfilled, looking for user in the queue to bump');

            var userRequest = $.getUserRequest(user);

            if (userRequest != null) {
                $.log.file('queue-management', '[autoBump] - Found user request, bumping');

                userRequest[0].setBumpFlag();

                $.currentPlaylist().addToQueue(userRequest[0], $.getBumpPosition());
                $.getConnectedPlayerClient().pushSongList();

                $.say($.whisperPrefix(user) + $.lang.get('songqueuemgmt.command.bump.success', $.getBumpPosition() + 1));
            } else {
                $.log.file('queue-management', '[autoBump] - No request found for user, saving for their next request');
                $.say($.whisperPrefix(user) + $.lang.get('songqueuemgmt.autobump.nextsong'));
            }
        } else {
            $.log.file('queue-management', '[autoBump] - User has already been fulfilled all their allowed bumps');
        }
    }

    function bumpMethod() {
        return bumpMethodEnum;
    }

    function bumpStatus() {
        return bumpStatusEnum;
    }

    $.autoBump = autoBump;
    $.getBumpData = getBumpData;
    $.bumpMethod = bumpMethod;
    $.bumpStatus = bumpStatus;

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
    });
})();