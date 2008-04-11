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

var selectedItemAtom = Components.classes["@mozilla.org/atom-service;1"]
            .getService(Components.interfaces.nsIAtomService)
            .getAtom("selectedItem");

function TabTreeView(treeElement, items) {
    this.treeElement = treeElement;
    this.items = items.slice(0, items.length);
    this.allItems = this.items;

    this.treebox = null;
    function sortByTitle(a, b) {
        return a.title.localeCompare(b.title);
    }

    this.items.sort(sortByTitle);
    this.treeElement.view = this;
}

TabTreeView.prototype = {

    invalidate : function() {
        this.treebox.invalidate();
    },

    swap : function(idx1, idx2) {
        if ((idx1 == idx2) || (idx1 < 0) || (idx2 < 0)) {
            return;
        }
        var temp = this.items[idx1];

        this.items[idx1] = this.items[idx2];
        this.items[idx2] = temp;
    },

    get currentSelectedItem() {
        if (this.selection.currentIndex < 0) {
            return null;
        }
        return this.items[this.selection.currentIndex];
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

    moveSelectedItem : function(moveUp) {
        var view = this.treebox.view;
        var fromIdx = view.selection.currentIndex;
        var offset;

        if (moveUp) {
            if (fromIdx <= 0) {
                return;
            }
            offset = -1;
        } else {
            if (fromIdx >= view.rowCount - 1) {
                return;
            }
            offset = +1;
        }

        var toIdx = fromIdx + offset;

        // swap function must be defined if view
        this.swap(fromIdx, toIdx);
        this.invalidate();
        view.selection.select(toIdx);
        this.treebox.ensureRowIsVisible(toIdx);
        this.treebox.focused = true;
    },

    removeAllItems : function() {
        this.selection.clearSelection();
    },

    refresh : function() {
        this.selection.clearSelection();
        this.treebox.invalidate();
    },

    selectText : function(str) {
        var selectedItems = [];
        // If str contains at least one uppercase character uses case sensitive search
        var isCaseInsensitiveSearch = /[A-Z]+/.test(str);

        var re = new PatternMatcher.strategies.globCaseContains(str, isCaseInsensitiveSearch);
        for (var i = 0; i < this.allItems.length; i++) {
            var title = this.allItems[i].title;
            
            if (re.matches(title)) {
                selectedItems.push(this.allItems[i]);
            }
        }
        this.items = selectedItems;
    },

    moveSelection : function(moveUp) {
        var currentIndex = this.selection.currentIndex;
        if (moveUp) {
            if (this.selection.currentIndex > 0) {
                this.selectAndEnsureVisible(--currentIndex);
            }
        } else {
            if (this.selection.currentIndex < (this.items.length - 1)) {
                this.selectAndEnsureVisible(++currentIndex);
            }
        }
        return currentIndex;
    },
    
    selectAndEnsureVisible : function(index) {
        this.selection.select(index);
        this.treebox.ensureRowIsVisible(index);
    },

    getCellText : function(row, column){
        switch (column.id || column) {
            case "view-treecol":
                return this.items[row].title;
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

    setTree: function(treebox){
        this.treebox = treebox;
    },

    getCellProperties: function(row, column, props) {
        if (this.items[row].isCurrent) {
            props.AppendElement(selectedItemAtom);
        }
    },

    cycleHeader: function(col, elem) {},
    isContainer: function(row){ return false; },
    isSeparator: function(row){ return false; },
    isSorted: function(row){ return false; },
    getLevel: function(row){ return 0; },
    getRowProperties: function(row,props){},
    getColumnProperties: function(colid,col,props){}
};
