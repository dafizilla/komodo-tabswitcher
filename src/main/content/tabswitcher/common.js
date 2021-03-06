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
# Portions created by the Initial Developer are Copyright (C) 2007
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

function DafizillaCommon() {
}

DafizillaCommon.getObserverService = function () {
    const CONTRACTID_OBSERVER = "@mozilla.org/observer-service;1";
    const nsObserverService = Components.interfaces.nsIObserverService;

    return Components.classes[CONTRACTID_OBSERVER].getService(nsObserverService);
}

DafizillaCommon.log = function(msg) {
    ko.logging.getLogger("extensions.tabswitcher").warn(msg);
}

DafizillaCommon.exception = function(error) {
    ko.logging.getLogger("extensions.tabswitcher").exception(error);
}

DafizillaCommon.removeMenuItems = function(menu) {
    var children = menu.childNodes;

    for (var i = children.length - 1; i >= 0; i--) {
        menu.removeChild(children[i]);
    }
}

DafizillaCommon.sortTabs = function(view, sorter) {
    if (typeof(view) == "undefined" || view == null) {
        return;
    }
    var tabbox = view.parentNode;

    while (tabbox && tabbox.nodeName != "tabbox" && tabbox.nodeName != "xul:tabbox") {
        tabbox = tabbox.parentNode;
    }
    var childNodes = tabbox._tabs.childNodes;

    for (var i = 0; i < childNodes.length; i++) {
        for (var j = childNodes.length - 1; j > i; j--) {
            if (sorter(childNodes[j], childNodes[j - 1]) < 0) {
                tabbox._tabs.insertBefore(childNodes[j], childNodes[j - 1])
            }
        }
    }
}