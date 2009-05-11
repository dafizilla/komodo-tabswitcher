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

var gTabSwitcher = {
    searchPattern : "",
    prefs : new TabSwitcherPrefs(),

    onShowTabSwitcher : function(event) {
        window.openDialog("chrome://tabswitcher/content/tabSwitcher/tabSwitcher.xul",
                          "_blank",
                          "chrome,modal,resizable=yes,dependent=yes",
                          this);
    },
    
    onLoad : function() {
        var obs = DafizillaCommon.getObserverService();
        obs.addObserver(this, "tabswitcher_pref_changed", false);

        this.addListeners();
    },

    onUnLoad : function() {
        var obs = DafizillaCommon.getObserverService();
        obs.removeObserver(this, "tabswitcher_pref_changed");
        this.removeListeners();
    },

    observe : function(subject, topic, data) {
        try {
        switch (topic) {
            case "tabswitcher_pref_changed":
                this.prefsChanged(subject, data);
                break;
        }
        } catch (err) {
            alert(topic + "--" + data + "\n" + err);
        }
    },

    prefsChanged : function(subject, data) {
        this.prefs = new TabSwitcherPrefs();
        this.sortTabs();
    },
    
    addListeners : function() {
        var self = this;

        this.handle_current_view_opened_setup = function(event) {
            self.onCurrentViewOpened(event);
        };

        window.addEventListener('view_opened',
                                this.handle_current_view_opened_setup, false);
    },

    removeListeners : function() {
        window.removeEventListener('view_opened',
                                this.handle_current_view_opened_setup, false);
    },

    onCurrentViewOpened : function(event) {
        this.sortTabs();
    },

    sortTabs : function() {
        if (this.prefs.orderTabsAuto) {
            switch(this.prefs.orderTabsType) {
                case "n":
                    this.sortTabsByName();
                    break;
                case "e":
                    this.sortTabsByExt();
                    break;
            }
        }
    },

    sortTabsByName : function() {
        DafizillaCommon.sortTabs(ko.views.manager.currentView,
                function(nodeA, nodeB) {
                    var labelA = nodeA.label.toLowerCase();
                    var labelB = nodeB.label.toLowerCase();
                    return labelA == labelB ? 0 : labelA < labelB ? -1 : 1;
                });
        ko.views.manager.currentView.setFocus();
    },
    
    sortTabsByExt : function() {
        DafizillaCommon.sortTabs(ko.views.manager.currentView,
                function(nodeA, nodeB) {
                    var labelA = nodeA.label.toLowerCase();
                    var labelB = nodeB.label.toLowerCase();
                    var extA = labelA.replace(/.*\./, '');
                    var extB = labelB.replace(/.*\./, '');
                    if (extA == extB) {
                        return labelA == labelB ? 0 : labelA < labelB ? -1 : 1;
                    }
                    return extA < extB ? -1 : 1;
                });
        ko.views.manager.currentView.setFocus();
    }
}

window.addEventListener("load", function(event) { gTabSwitcher.onLoad(event); }, false);
window.addEventListener("unload", function(event) { gTabSwitcher.onUnLoad(event); }, false);
