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

var gViewSwitcherBookmarks = {
    onLoad : function() {
        try {
            this.treeView = new BookmarksTreeView(
                    document.getElementById("viewswitcher_bookmarks-tree"));
            var obs = DafizillaCommon.getObserverService();
            obs.addObserver(this, "view_opened", false);
            obs.addObserver(this, "view_closed", false);
        } catch (err) {
            alert("gViewSwitcherBookmarks onLoad " + err);
        }
    },

    onUnLoad : function() {
        var obs = DafizillaCommon.getObserverService();
        obs.addObserver(this, "view_opened", false);
        obs.removeObserver(this, "view_closed");
    },

    observe : function(subject, topic, data) {
        try {
        switch (topic) {
            case "view_opened":
                var status = document.getElementById("viewswitcher-bookmark-status");
                status.setAttribute("value", subject.document)
                break;
            case "view_closed":
                this.onRefresh();
                break;
        }
        } catch (err) {
            alert(topic + "--" + data + "\n" + err);
        }
    },

    onRefresh : function() {
        this.treeView.fillBookmarksArray();
        this.treeView.refresh();
        var status = document.getElementById("viewswitcher-bookmark-status");

        var label = "";
        if (this.treeView.viewWithBookmarkCount) {
            label = status.getAttribute("bookmarklabel")
                            .replace("%1", this.treeView.items.length)
                            .replace("%2", this.treeView.viewWithBookmarkCount)
                            .replace("%3", this.treeView.viewCount);
        }
        status.setAttribute("value", label);
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
    }
}

window.addEventListener("load", function(event) {gViewSwitcherBookmarks.onLoad(event)}, false);
window.addEventListener("unload", function(event) {gViewSwitcherBookmarks.onUnLoad(event)}, false);
