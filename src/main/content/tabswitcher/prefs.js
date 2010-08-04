/*
# ***** BEGIN LICENSE BLOCK *****
# Version: MPL 1.1/GPL 2.0/LGPL 2.1
#
# The contents of this file are subject to the Mozilla Public License Version
# 1.1 (the "License"); you may not use this file except in compliance with
# the License. You may obtain a copy of the License at
# http://www.mozilla.org/MPL/
#
# Software distributed under the License is distributed on an "AS IS" basis,
# WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
# for the specific language governing rights and limitations under the
# License.
#
# The Initial Developer of the Original Code is
# Davide Ficano.
# Portions created by the Initial Developer are Copyright (C) 2008
# the Initial Developer. All Rights Reserved.
#
# Contributor(s):
#   Davide Ficano <davide.ficano@gmail.com>
#
# Alternatively, the contents of this file may be used under the terms of
# either the GNU General Public License Version 2 or later (the "GPL"), or
# the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
# in which case the provisions of the GPL or the LGPL are applicable instead
# of those above. If you wish to allow use of your version of this file only
# under the terms of either the GPL or the LGPL, and not to allow others to
# use your version of this file under the terms of the MPL, indicate your
# decision by deleting the provisions above and replace them with the notice
# and other provisions required by the GPL or the LGPL. If you do not delete
# the provisions above, a recipient may use your version of this file under
# the terms of any one of the MPL, the GPL or the LGPL.
#
# ***** END LICENSE BLOCK *****
*/
const TAB_SWITCHER_DEFAULT_MAX_SIZE_STACK = 50;
const TAB_SWITCHER_DEFAULT_MAX_VISIBILE_ITEMS = 5;
const TAB_SWITCHER_DEFAULT_CASE_TYPE = "ic";
const TAB_SWITCHER_DEFAULT_SHOW_LAST_USED_PATTERN = true;

const TAB_SWITCHER_DEFAULT_EDIT_TYPE = "1";

function TabSwitcherPrefs() {
    DafizillaPrefs.call(this, "extensions.tabswitcher.");
}

TabSwitcherPrefs.prototype = new DafizillaPrefs();

TabSwitcherPrefs.prototype.__defineGetter__("maxSizeEditPositionStack",
function() {
    return this.getString("maxSizeEditPositionStack", TAB_SWITCHER_DEFAULT_MAX_SIZE_STACK);
});

TabSwitcherPrefs.prototype.__defineSetter__("maxSizeEditPositionStack",
function(value) {
    this.setSafeInt("maxSizeEditPositionStack", value, TAB_SWITCHER_DEFAULT_MAX_SIZE_STACK);
});

TabSwitcherPrefs.prototype.__defineGetter__("maxVisibleMenuItems",
function() {
    return this.getString("maxVisibleMenuItems", TAB_SWITCHER_DEFAULT_MAX_VISIBILE_ITEMS);
});

TabSwitcherPrefs.prototype.__defineSetter__("maxVisibleMenuItems",
function(value) {
    this.setSafeInt("maxVisibleMenuItems", value, TAB_SWITCHER_DEFAULT_MAX_VISIBILE_ITEMS);
});

TabSwitcherPrefs.prototype.__defineGetter__("editGranularity",
function() {
    return this.getString("caseType", TAB_SWITCHER_DEFAULT_EDIT_TYPE);
});

TabSwitcherPrefs.prototype.__defineSetter__("editGranularity",
function(value) {
    this.setString("caseType", value);
});

TabSwitcherPrefs.prototype.__defineGetter__("editClearNextStack",
function() {
    return this.getBool("editClearNextStack", false);
});

TabSwitcherPrefs.prototype.__defineSetter__("editClearNextStack",
function(value) {
    this.setBool("editClearNextStack", value);
});

TabSwitcherPrefs.prototype.__defineGetter__("editRememberCurrentPos",
function() {
    return this.getBool("editRememberCurrentPos", false);
});

TabSwitcherPrefs.prototype.__defineSetter__("editRememberCurrentPos",
function(value) {
    this.setBool("editRememberCurrentPos", value);
});


TabSwitcherPrefs.prototype.__defineGetter__("caseType",
function() {
    return this.getString("caseType", TAB_SWITCHER_DEFAULT_CASE_TYPE);
});

TabSwitcherPrefs.prototype.__defineSetter__("caseType",
function(value) {
    this.setString("caseType", value);
});

TabSwitcherPrefs.prototype.__defineGetter__("showLastUsedPattern",
function() {
    return this.getBool("showLastUsedPattern", TAB_SWITCHER_DEFAULT_SHOW_LAST_USED_PATTERN);
});

TabSwitcherPrefs.prototype.__defineSetter__("showLastUsedPattern",
function(value) {
    this.setBool("showLastUsedPattern", value);
});

TabSwitcherPrefs.prototype.__defineGetter__("orderTabsAuto",
function() {
    return this.getBool("orderTabsAuto", false);
});

TabSwitcherPrefs.prototype.__defineSetter__("orderTabsAuto",
function(value) {
    this.setBool("orderTabsAuto", value);
});


TabSwitcherPrefs.prototype.__defineGetter__("orderTabsType",
function() {
    return this.getString("orderTabsType", "n");
});

TabSwitcherPrefs.prototype.__defineSetter__("orderTabsType",
function(value) {
    this.setString("orderTabsType", value);
});

TabSwitcherPrefs.prototype.setSafeInt = function(prefName, prefValue, defPrefValue) {
    var v = DafizillaPrefs.safeInt(prefValue, defPrefValue,
                                   function(value) {
                return DafizillaPrefs.checkers.checkGreaterOrEqualThan(
                        value, defPrefValue);
                });

    this.setString(prefName, v);
}
