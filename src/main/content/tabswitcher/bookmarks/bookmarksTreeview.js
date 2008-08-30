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

function BookmarksTreeView(treeElement) {
    this.treeElement = treeElement;
    this.items = [];
    this.viewWithBookmarkCount = 0;
    this.viewCount = 0;

    this.treebox = null;

    this.treeElement.view = this;
}

BookmarksTreeView.prototype = {
    fillBookmarksArray : function() {
        var views = ko.views.manager.topView.getDocumentViews(true);
        var marker_mask = 1 << ko.markers.MARKNUM_BOOKMARK;

        var newItems = [];
        this.viewWithBookmarkCount = 0;

        for (var i = 0; i < views.length; i++) {
            var view = views[i];

            if (view.getAttribute("type") != "editor") {
                continue;
            }
            var line = 0;
            var foundBookmarks = false;
            do {
                line = view.scintilla.scimoz.markerNext(line, marker_mask);
                if (line >= 0) {
                    foundBookmarks = true;
                    newItems.push({ view : view, line: line});
                    ++line;
                }
            } while (line >= 0);
            
            if (foundBookmarks) {
                ++this.viewWithBookmarkCount;
            }
        }
        this.viewCount = views.length;
        this.treebox.rowCountChanged(0, newItems.length - this.items.length);
        this.items = newItems;
    },

    removeSelectedBookmarks : function(index) {
        var selArr = this.selectedIndexes;
        
        for (var i = 0; i < selArr.length; i++) {
            var bookmark = this.items[selArr[i]];
            var scimoz = bookmark.view.scintilla.scimoz;

            scimoz.markerDelete(bookmark.line, ko.markers.MARKNUM_BOOKMARK);
        }
        this.fillBookmarksArray();
    },

    removeAllBookmarks : function(index) {
        for (var i = 0; i < this.items.length; i++) {
            var scimoz = this.items[i].view.scintilla.scimoz;
    
            scimoz.markerDeleteAll(ko.markers.MARKNUM_BOOKMARK);
        }
        this.fillBookmarksArray();
    },

    get selectedItems() {
        var ar = [];
        var selIndexes = this.selectedIndexes;

        for (var i = 0; i < selIndexes.length; i++) {
            ar.push(this.items[selIndexes[i]]);
        }

        return ar;
    },

    get selectedIndexes() {
        var selection = this.selection;
        var items = [];

        for (var i = 0; i < selection.getRangeCount(); i++) {
            var minIdx = {};
            var maxIdx = {};
            selection.getRangeAt(i, minIdx, maxIdx);
            for (var selIdx = minIdx.value; selIdx <= maxIdx.value; selIdx++) {
                items.push(selIdx);
            }
        }

        return items;
    },

    deleteItems : function(items) {
        if (items && items.length > 0) {
            for (var i = items.length - 1; i >= 0; i--) {
                this.items.splice(items[i], 1);
            }
            this.treebox.rowCountChanged(items[0], -items.length);
        }
    },

    deleteSelectedItem : function() {
        try {
            var selIdx = this.selection.currentIndex;

            if (selIdx < 0) {
                return;
            }
            var newItems = new Array();

            for (var i = 0; i < this.items.length; i++) {
                if (i != selIdx) {
                    newItems.push(this.items[i]);
                }
            }

            this.items = newItems;
            // -1 means remove (< 0)
            this.treebox.rowCountChanged(selIdx, -1);

            if (newItems.length > 0) {
                this.selection.select(this.rowCount == selIdx ? selIdx - 1 : selIdx);
            }
        } catch (err) {
            alert(err);
        }
    },

    invalidate : function() {
        this.treebox.invalidate();
    },

    get currentSelectedItem() {
        if (this.selection.currentIndex < 0) {
            return null;
        }
        return this.items[this.selection.currentIndex];
    },
    
    refresh : function() {
        this.selection.clearSelection();
        this.treebox.invalidate();
    },

    moveToSelectedBookmark : function() {
        var view = this.currentSelectedItem.view;
        var scimoz = view.scintilla.scimoz;

        scimoz.gotoLine(this.currentSelectedItem.line);
        view.makeCurrent();
    },

    selectAndEnsureVisible : function(index) {
        this.selection.select(index);
        this.treebox.ensureRowIsVisible(index);
    },

    getCellText : function(row, column) {
        switch (column.id || column) {
            case "viewswitcher_bookmarks-filename":
                if (ko.views.manager.currentView.document.file) {
                    return this.items[row].view.document.file.path;
                } else {
                    return this.items[row].view.document.displayPath;
                }
            case "viewswitcher_bookmarks-linenum":
                return this.items[row].line + 1;
            case "viewswitcher_bookmarks-content":
                var scimoz = this.items[row].view.scintilla.scimoz;
                var lineStart = scimoz.positionFromLine(this.items[row].line);
                var lineEnd = scimoz.getLineEndPosition(this.items[row].line);
                return scimoz.getTextRange(lineStart, lineEnd);
        }

        return "";
    },

    get rowCount() {
        return this.items.length;
    },

    cycleCell: function(row, column) {},

    getImageSrc: function (row, column) {
        return null;
    },

    setTree: function(treebox) {
        this.treebox = treebox;
    },

    getCellProperties: function(row, column, props) {},
    cycleHeader: function(col, elem) {},
    isContainer: function(row){ return false; },
    isSeparator: function(row){ return false; },
    isSorted: function(row){ return false; },
    getLevel: function(row){ return 0; },
    getRowProperties: function(row,props){},
    getColumnProperties: function(colid,col,props){}
};
