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
    editStack : new FixedSizeStack(100),
    nextEditStack : new FixedSizeStack(100),

    onLoad : function() {
        try {
            var obs = DafizillaCommon.getObserverService();
            obs.addObserver(this, "current_view_check_status", false);
        } catch (err) {
            alert("gTabSwitcher onLoad " + err);
        }
    },

    onUnLoad : function() {
        var obs = DafizillaCommon.getObserverService();
        obs.addObserver(this, "current_view_check_status", false);
    },

    observe : function(subject, topic, data) {
        try {
        switch (topic) {
            case "current_view_check_status":
                this.pushEdit();
                break;
        }
        } catch (err) {
            alert(topic + "--" + data + "\n" + err);
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

        if (this.editStack.length) {
            var last = this.editStack.peek();
        }

        if (last && last.view == currView) {
            last.position = scimoz.currentPos;
        } else {
            if (!this.isEditOnCurrentView(this.editStack.peek())) {
                this.editStack.push({ view : currView, position : scimoz.currentPos});
                this.updateCommands();
            }
        }
    },
    
    popEdit : function() {
        DafizillaCommon.log("***before popEdit");
        DafizillaCommon.log("\neditStack\n" + this.editStack);
        DafizillaCommon.log("\nnextEditStack\n" + this.nextEditStack);

        if (this._popEditPosition(this.editStack, this.nextEditStack)) {
            this.updateCommands();
        }

        DafizillaCommon.log("***after popEdit");
        DafizillaCommon.log("\neditStack\n" + this.editStack);
        DafizillaCommon.log("\nnextEditStack\n" + this.nextEditStack);
    },

    moveNextEdit : function() {
        DafizillaCommon.log("+++before moveNextEdit");
        DafizillaCommon.log("\neditStack\n" + this.editStack);
        DafizillaCommon.log("\nnextEditStack\n" + this.nextEditStack);

        if (this._popEditPosition(this.nextEditStack, this.editStack)) {
            this.updateCommands();
        }

        DafizillaCommon.log("+++after moveNextEdit");
        DafizillaCommon.log("\neditStack\n" + this.editStack);
        DafizillaCommon.log("\nnextEditStack\n" + this.nextEditStack);
    },
    
    updateCommands : function() {
        this.enable("cmd_tabswitcher_goto_last_edit_position", this.editStack.length > 0);
        this.enable("cmd_tabswitcher_goto_next_edit_position", this.nextEditStack.length > 0);
        DafizillaCommon.log("\nupdateCommands editStack = "
                            + this.editStack.length
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
    
    _popEditPosition : function(fromArr, toArr) {
        if (!fromArr.length) {
            return false;
        }
        var editPos = this.popValidView(fromArr);
    
        if (!editPos) {
            return false;
        }

        if (this.isEditOnCurrentView(editPos)) {
            // cursor is already on current position so move element to other array
            // and pop the next element
            toArr.push(editPos);
            editPos = this.popValidView(fromArr);
        }

        if (editPos) {
            toArr.push(editPos);
            editPos.view.makeCurrent();
            var scimoz = editPos.view.scintilla.scimoz;
            scimoz.setSel(-1, editPos.position);
        }
        
        return true;
    },

    /**
     * Ensure the popped element points to a not-closed view
     */
    popValidView : function(arr) {
        while (arr.length) {
            var editPos = arr.pop();
            if (editPos && editPos.view.document) {
                return editPos;
            }
        }
        return null;
    },
    
    isEditOnCurrentView : function(editPos) {
        DafizillaCommon.log("isEditOnCurrentView1 " + editPos);
        if (editPos) {
        DafizillaCommon.log("isEditOnCurrentView2 " + editPos.view.title);
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

    onShowSelectView : function(event) {
        window.openDialog("chrome://tabswitcher/content/selectView.xul",
                          "_blank",
                          "chrome,modal,resizable=yes,dependent=yes");
    }
}

window.addEventListener("load", function(event) {gTabSwitcher.onLoad(event)}, false);
window.addEventListener("unload", function(event) {gTabSwitcher.onUnLoad(event)}, false);
