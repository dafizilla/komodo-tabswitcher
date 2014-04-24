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

var gViewSwitcherBookmarksLOG = ko.logging.getLogger("ko.extensions.tabswitcher")

var gViewSwitcherBookmarks = {
    onLoad : function() {
        try {
            var scin = document.getElementById('runoutput-scintilla');
            if (scin) {
                // KO6
                var cdoc = document;
            } else {
                // KO7
                // push ourselves into the ko-pane
                var widget = document.getElementById("viewswitcher_bookmarks_tab");
                if (widget) {
                    widget.contentWindow.gViewSwitcherBookmarks = this;
                }

                var cdoc = widget.contentDocument;
            }
            this.treeView = new BookmarksTreeView(
                    cdoc.getElementById("viewswitcher_bookmarks-tree"));
            this.status = cdoc.getElementById("viewswitcher-bookmark-status");

            var obs = DafizillaCommon.getObserverService();
            obs.addObserver(this, "view_opened", false);
            obs.addObserver(this, "view_closed", false);

            this.addListeners();
        } catch (err) {
            gViewSwitcherBookmarksLOG.exception(err);
        }
    },

    onUnLoad : function() {
        var obs = DafizillaCommon.getObserverService();
        obs.addObserver(this, "view_opened", false);
        obs.removeObserver(this, "view_closed");
        this.removeListeners();
    },

    observe : function(subject, topic, data) {
        try {
        switch (topic) {
            case "view_opened":
                this.onRefresh();
                break;
            case "view_closed":
                this.onRefresh();
                break;
        }
        } catch (err) {
            gViewSwitcherBookmarksLOG.exception(err);
        }
    },

    onRefresh : function() {
        this.treeView.fillBookmarksArray();
        this.treeView.refresh();

        var label = "";
        if (this.treeView.viewWithBookmarkCount) {
            label = this.status.getAttribute("bookmarklabel")
                               .replace("%1", this.treeView.items.length)
                               .replace("%2", this.treeView.viewWithBookmarkCount)
                               .replace("%3", this.treeView.viewCount);
        }
        this.status.setAttribute("value", label);
    },

    onRemoveSelected : function() {
        this.treeView.removeSelectedBookmarks();
        this.onRefresh();
    },

    onRemoveAll : function() {
        this.treeView.removeAllBookmarks();
        this.onRefresh();
    },

    onDblClick : function() {
        this.treeView.moveToSelectedBookmark();
    },

    addListeners : function() {
        var self = this;

        this.handle_view_opened_setup = function(event) {
            self.onViewOpened(event);
        };

        this.handle_view_closed_setup = function(event) {
            self.onViewClosed(event);
        };

        window.addEventListener('view_opened',
                                this.handle_view_opened_setup, false);
        window.addEventListener('view_closed',
                                this.handle_view_closed_setup, false);
    },

    removeListeners : function() {
        window.removeEventListener('view_opened',
                                this.handle_view_opened_setup, false);
        window.removeEventListener('view_closed',
                                this.handle_view_closed_setup, false);
    },

    onViewOpened : function(event) {
        this.onRefresh();
    },

    onViewClosed : function(event) {
        this.onRefresh();
    }
}

window.addEventListener("load",
    function(event){setTimeout("gViewSwitcherBookmarks.onLoad()", 3000);},
    false);

//window.addEventListener("load", function(event) {gViewSwitcherBookmarks.onLoad(event)}, false);
window.addEventListener("unload", function(event) {gViewSwitcherBookmarks.onUnLoad(event)}, false);
