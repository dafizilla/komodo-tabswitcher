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
    onLoad : function() {
        try {
            this.isInputInProgress = false;
            this.tabTreeView = new TabTreeView(
                        document.getElementById("view-tree"),
                        this.getAllOpenDocumentViews());
            this.tabTreeView.currentWindow = ko.windowManager.getMainWindow();
            this.tabTreeView.refresh();
            document.getElementById("view-title").focus();
            
            this.caseCheckbox = document.getElementById("switch-case");

            this.prefs = new TabSwitcherPrefs();
            this.prefs.load();
            this.setSearchCase(this.prefs.caseType);

            if (this.prefs.showLastUsedPattern) {
                document.getElementById("view-title").value = window.arguments[0].searchPattern;
                document.getElementById("view-title").select();
                this.onInput(document.getElementById("view-title"));
            }
        } catch (err) {
            alert(err);
        }
    },

    getAllOpenDocumentViews : function() {
        var views = [];
        var windows = ko.windowManager.getWindows();
        var winInfo = {
            win : null,
            number : 0,
            hasNumberWindow : windows.length > 1
        };
        
        for (var i in windows) {
            var w = windows[i];

            winInfo.win = w;
            ++winInfo.number;
            var arr = w.ko.views.manager.topView.getDocumentViews(true);
            arr.forEach(this.addWindowAttribute, winInfo);
            views = views.concat(arr);
        }
        return views;
    },
    
    addWindowAttribute : function(element, index, array) {
        element._ts_window = this.win;
        element._ts_title = this.hasNumberWindow
            ? "[" + this.number + "] " + element.title
            : element.title;
    },
    
    toogleSearchCase : function (event) {
        switch (this.caseCheckbox.value) {
            case "ic":
                this.setSearchCase("mc");
                break;
            case "mc":
                this.setSearchCase("sc");
                break;
            case "sc":
                this.setSearchCase("ic");
                break;
            default:
                return;
        }
        this.onInput(document.getElementById("view-title"));
    },
    
    setSearchCase : function(caseType, optionCaseType) {
        var isCaseTypeValid = caseType == "ic" || caseType == "mc" || caseType == "sc";
        
        if (!isCaseTypeValid) {
            caseType = "ic";
        }
        this.caseCheckbox.label = this.caseCheckbox.getAttribute("label-" + caseType);
        this.caseCheckbox.value = this.caseCheckbox.getAttribute("value-" + caseType);
        this.caseCheckbox.accessKey = this.caseCheckbox.getAttribute("accessKey-" + caseType);
        this.caseCheckbox.checked = this.caseCheckbox.getAttribute("checked-" + caseType) == "true";
    },

    onInput : function(text) {
        this.isInputInProgress = true;
        this.tabTreeView.selectText(text.value, this.caseCheckbox.value);
        this.tabTreeView.refresh();
        this.tabTreeView.selectAndEnsureVisible(0);

        var selectedItem = this.tabTreeView.currentSelectedItem;
        var path = "";
        if (selectedItem) {
            path = selectedItem.document.file.dirName;
        }
        document.getElementById("view-path").value = path;
        this.isInputInProgress = false;
        
        return true;
    },

    onKeyPress : function(event) {
        if (event.keyCode == KeyEvent.DOM_VK_UP) {
            this.tabTreeView.moveSelection(true);
        } else if (event.keyCode == KeyEvent.DOM_VK_DOWN) {
            this.tabTreeView.moveSelection(false);
        }
        return true;
    },

    onWindowKeyPress : function(event) {
        if (event.keyCode == KeyEvent.DOM_VK_RETURN
            || event.keyCode == KeyEvent.DOM_VK_ENTER) {
            this.onAccept();
        } else if (event.keyCode == KeyEvent.DOM_VK_ESCAPE) {
            window.close();
        }
        return true;
    },

    onSelect : function() {
        if (!this.isInputInProgress) {
            var selectedItem = this.tabTreeView.currentSelectedItem;
            if (selectedItem) {
                document.getElementById("view-path").value = selectedItem.document.file.dirName;
            }
        }
    },
    
    onDblClick : function() {
        this.onAccept();
    },

    onAccept : function() {
        if (this.tabTreeView.currentSelectedItem) {
            this.tabTreeView.currentSelectedItem._ts_window.focus();
            this.tabTreeView.currentSelectedItem.makeCurrent();
        }
        this.prefs.caseType = this.caseCheckbox.value;
        this.prefs.save();

        if (this.prefs.showLastUsedPattern) {
            window.arguments[0].searchPattern = document.getElementById("view-title").value;
        }
        window.close();
    }
}