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

$.lang.register('shufflesystem.open.error.opened', 'A shuffle is currently in progress.');
$.lang.register('shufflesystem.open.usage', 'Usage: !shuffle open [keyword] [close timer minutes]. [keyword] required.');
$.lang.register('shufflesystem.open', 'A shuffle is now opened! Type $1 to enter$2! $3');
$.lang.register('shufflesystem.close.error.closed', 'There is no shuffle in progress.');
$.lang.register('shufflesystem.close.success', 'The shuffle is now closed! No more entries will be counted. Use "!shuffle draw" to pick a winner!');
$.lang.register('shufflesystem.winner', 'The winner of this shuffle is $1!  Your song will be played next!');
$.lang.register('shufflesystem.repick.error', 'There are no more users in the shuffle list.');
$.lang.register('shufflesystem.enter.404', 'You already entered this shuffle.');
$.lang.register('shufflesystem.usage', 'Usage: !shuffle [open / close / draw / results / subscriberbonus/ regularbonus / whisperwinner]');
$.lang.register('shufflesystem.results', 'A shuffle is still open! Keyword: $1 - Total entries: $2');
$.lang.register('shufflesystem.shuffle.repick.toggle1', 'Shuffle winners will no longer be repicked.');
$.lang.register('shufflesystem.shuffle.repick.toggle2', 'Shuffle winners will now be able to get repicked.');
$.lang.register('shufflesystem.message.usage', 'Usage: !shuffle message [message]');
$.lang.register('shufflesystem.message.set', 'Shuffle message has been set to: "$1".');
$.lang.register('shufflesystem.timer.usage', 'Usage: !Shuffle messagetimer [minutes]');
$.lang.register('shufflesystem.timer.set', 'Shuffle message timer has been set to $1 minutes.');
$.lang.register('shufflesystem.common.timer', 'The shuffle will close in $1 minutes.');
$.lang.register('shufflesystem.common.message', 'no longer');
$.lang.register('shufflesystem.open.keyword-exists', 'Keyword cannot be an existing command: $1');
$.lang.register('shufflesystem.winner.404', 'Could not pick a winner. No one entered this shuffle.');
$.lang.register('shufflesystem.reset', 'The shuffle has been reset.');
$.lang.register('shufflesystem.enter.success', 'You have been entered in the shuffle.');