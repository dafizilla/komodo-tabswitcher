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

var gEditPosition = {
    lastEditStack : new FixedSizeStack(10),
    nextEditStack : new FixedSizeStack(10),

    onLoad : function() {
        try {
            var obs = DafizillaCommon.getObserverService();
            obs.addObserver(this, "current_view_check_status", false);
            obs.addObserver(this, "view_closed", false);
            obs.addObserver(this, "tabswitcher_pref_changed", false);
            
            this.prefs = new TabSwitcherPrefs();
            this.init();
            this.addListeners();
        } catch (err) {
            alert("gEditPosition onLoad " + err);
        }
    },

    init : function() {
        this.prefs.load();
        this.lastEditStack.resize(this.prefs.maxSizeEditPositionStack);
        this.nextEditStack.resize(this.prefs.maxSizeEditPositionStack);
    },

    onUnLoad : function() {
        var obs = DafizillaCommon.getObserverService();
        obs.removeObserver(this, "current_view_check_status");
        obs.removeObserver(this, "view_closed");
        obs.removeObserver(this, "tabswitcher_pref_changed");
        this.removeListeners();
    },

    observe : function(subject, topic, data) {
        try {
        switch (topic) {
            case "current_view_check_status":
                this.pushEdit();
                break;
            case "view_closed":
                this.removeView(subject, this.lastEditStack.items);
                this.removeView(subject, this.nextEditStack.items);
                this.updateCommands();
                break;
            case "tabswitcher_pref_changed":
                this.init();
        }
        } catch (err) {
            alert(topic + "--" + data + "\n" + err);
        }
    },

    removeView : function(view, arr) {
        for (var i = arr.length - 1; i >= 0; i--) {
            if (arr[i].view == view) {
                DafizillaCommon.log("Removing " + i);
                arr.splice(i, 1);
            }
        }
    },

    pushEdit : function() {
        var currView = ko.views.manager.currentView;
    
        if (!currView.document) {
            return;
        }
            
        if (!currView.document.isDirty) {
            return;
        }
    
        var scimoz = currView.scintilla.scimoz;
        var last = null;

        if (this.lastEditStack.length) {
            var last = this.lastEditStack.peek();
        }

        if (last && last.view == currView) {
            last.position = scimoz.currentPos;
        } else {
            if (!this.isEditOnCurrentView(this.lastEditStack.peek())) {
                DafizillaCommon.log(">>>Pushing " + currView.title);
                this.lastEditStack.push({ view : currView, position : scimoz.currentPos});
                this.updateCommands();
            }
        }
    },
    
    goToLastEdit : function(index) {
        DafizillaCommon.log("***before goToLastEdit\n"
            + "\neditStack\n"
            + "\nnextEditStack\n");

        this._popEditPosition(this.lastEditStack, index, this.nextEditStack);

        DafizillaCommon.log("***after goToLastEdit\n"
            + "\neditStack\n" + this.lastEditStack
            + "\nnextEditStack\n" + this.nextEditStack);
    },

    goToNextEdit : function(index) {
        DafizillaCommon.log("+++before goToNextEdit\n"
            + "\neditStack\n" + this.lastEditStack
            + "\nnextEditStack\n" + this.nextEditStack);

        this._popEditPosition(this.nextEditStack, index, this.lastEditStack);

        DafizillaCommon.log("+++after goToNextEdit\n"
            + "\neditStack\n" + this.lastEditStack
            + "\nnextEditStack\n" + this.nextEditStack);
    },
    
    updateCommands : function() {
        this.enable("cmd_tabswitcher_goto_last_edit_position", this.lastEditStack.length > 0);
        this.enable("cmd_tabswitcher_goto_next_edit_position", this.nextEditStack.length > 0);
        DafizillaCommon.log("\nupdateCommands lastEditStack = "
                            + this.lastEditStack.length
                            + " nextEditStack " + this.nextEditStack.length);
    },
    
    enable : function(elementId, isEnabled) {
        var el = document.getElementById(elementId);

        if (el) {
            if (isEnabled) {
                el.removeAttribute("disabled");
            } else {
                el.setAttribute("disabled", true);
            }
        }
    },
    
    _popEditPosition : function(fromStack, fromIndex, toStack) {
        try {


        DafizillaCommon.log("_popEditPosition1 length = " + fromStack.length + " fromIndex " + fromIndex);
        if (fromStack.length == 0) {
            return false;
        }

        if (fromIndex == 0 && this.isEditOnCurrentView(fromStack.peek())) {
            fromIndex = 1;
        DafizillaCommon.log("_popEditPosition2 fromIndex " + fromIndex);
        }

        // elements are retrieved starting from end of array
        // if fromIndex < 0 editPos is undefined
        fromIndex = fromStack.items.length - 1 - fromIndex;

        DafizillaCommon.log("_popEditPosition3 fromIndex " + fromIndex);
        var editPos = fromStack.items[fromIndex];
    
        if (!editPos) {
            return false;
        }
        
        var elementToMoveCount = fromStack.items.length;
        for (var i = elementToMoveCount - 1; i >= fromIndex ; i--) {
        DafizillaCommon.log("_popEditPosition4 i = " + i + "--" + fromStack.items[i].view.title);
            toStack.push(fromStack.items[i]);
        }
        fromStack.items.splice(fromIndex, elementToMoveCount - fromIndex);
        editPos.view.makeCurrent();
        var scimoz = editPos.view.scintilla.scimoz;
        scimoz.setSel(-1, editPos.position);

        this.updateCommands();

        } catch(e) {
            DafizillaCommon.log("_popEditPosition err " + e);
        }
        
        return true;
    },

    removeAll : function() {
        this.lastEditStack.clear();
        this.nextEditStack.clear();
        this.updateCommands();
    },
    
    initLastEditPopupMenu : function(menu) {
        this.initPopupMenu(menu,
                           this.lastEditStack,
                           "gEditPosition.goToLastEdit(%1)");
    },
    
    initNextEditPopupMenu : function(menu) {
        this.initPopupMenu(menu,
                           this.nextEditStack,
                           "gEditPosition.goToNextEdit(%1)");
    },

    initPopupMenu : function(menuPrefix, stack, command) {
        var menu = document.getElementById(menuPrefix + "-menubox");
        DafizillaCommon.removeMenuItems(menu);

        var items = stack.items;
        var count = items.length - 1;
        var index = 0;

        // don't show current view
        if (this.isEditOnCurrentView(items[count])) {
            index = 1;
        }
        var itemsToAdd = this.prefs.maxVisibleMenuItems;
        for (; index <= count && itemsToAdd > 0; index++, --itemsToAdd) {
            var view = items[count - index].view;
            var mi = document.createElement("menuitem");
            mi.setAttribute("label", view.title);
            mi.setAttribute("crop", "center");
            mi.setAttribute("tooltiptext", view.document.displayPath);
            mi.setAttribute("oncommand", command.replace("%1", index));
            menu.appendChild(mi);
        }
        
        if (menu.hasChildNodes()) {
            document.getElementById(menuPrefix + "-menuseparator")
                .removeAttribute("collapsed");
        } else {
            document.getElementById(menuPrefix + "-menuseparator")
                .setAttribute("collapsed", "true");
        }
    },

    isEditOnCurrentView : function(editPos) {
        if (editPos) {
            var currView = ko.views.manager.currentView;
    
            if (currView.document) {
                var currPos = currView.scintilla.scimoz.currentPos;
                
                if (currView == editPos.view && currPos == editPos.position) {
                    return true;
                }
            }
        }
        return false;
    },

    addListeners : function() {
        var self = this;

        this.handle_current_view_check_status_setup = function(event) {
            self.onCurrentViewCheckStatus(event);
        };

        this.handle_view_closed_setup = function(event) {
            self.onViewClosed(event);
        };

        window.addEventListener('current_view_check_status',
                                this.handle_current_view_check_status_setup, false);
        window.addEventListener('view_closed',
                                this.handle_view_closed_setup, false);
    },

    removeListeners : function() {
        window.removeEventListener('current_view_check_status',
                                this.handle_current_view_check_status_setup, false);
        window.removeEventListener('view_closed',
                                this.handle_view_closed_setup, false);
    },

    onCurrentViewCheckStatus : function(event) {
        this.pushEdit();
    },

    onViewClosed : function(event) {
        this.removeView(subject, this.lastEditStack.items);
        this.removeView(subject, this.nextEditStack.items);
        this.updateCommands();
    }
}

window.addEventListener("load", function(event) {gEditPosition.onLoad(event)}, false);
window.addEventListener("unload", function(event) {gEditPosition.onUnLoad(event)}, false);
