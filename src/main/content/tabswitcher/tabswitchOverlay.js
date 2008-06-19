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
    editStack : [],

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
            var last = this.editStack[this.editStack.length - 1];
        }
        if (last && last.view == currView) {
            last.position = scimoz.currentPos;
        } else {
            this.editStack.push({ view : currView, position : scimoz.currentPos});
        }
    },
    
    popEdit : function() {
        if (!this.editStack.length) {
            return;
        }
        var editPos = this.editStack[this.editStack.length - 1];
    
        if (!editPos) {
            return;
        }

        var currView = ko.views.manager.currentView;
        if (currView.document) {
            var currPos = currView.scintilla.scimoz.currentPos;
            
            // If cursor is over last modification skip it and move to previous one
            if (currView == editPos.view && currPos == editPos.position) {
                this.editStack.pop();
            }
        }
        if (!editPos) {
            return;
        }
        editPos = this.editStack.pop();
        editPos.view.makeCurrent();
        var scimoz = editPos.view.scintilla.scimoz;
        scimoz.setSel(-1, editPos.position);
    },

    onShowSelectView : function(event) {
        window.openDialog("chrome://tabswitcher/content/selectView.xul",
                          "_blank",
                          "chrome,modal,resizable=yes,dependent=yes");
    }
}

window.addEventListener("load", function(event) {gTabSwitcher.onLoad(event)}, false);
window.addEventListener("unload", function(event) {gTabSwitcher.onUnLoad(event)}, false);
