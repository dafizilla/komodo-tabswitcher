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

function EditPosFixedSizeStack(maxItems) {
    this.items = new Array();
    this.maxItems = maxItems ? maxItems : 100;
}

//special stack, clearing markers on item deletion
EditPosFixedSizeStack.prototype = {
    push : function(item) {
        if (this.items.length >= this.maxItems) {
            scimoz = this.items[0].view.scimoz;
            scimoz.markerDeleteHandle(this.items[0].marker);
            this.items.splice(0, 1);
        }
        this.items.push(item);
    },

    pop : function() {
        return this.items.pop();
    },

    peek : function() {
        return this.items[this.items.length - 1];
    },

    get length() {
        return this.items.length;
    },

    clear : function() {
        for (var i = 0; i < this.items.length; i++) {
            //remove markers first
            scimoz = this.items[i].view.scimoz;
            scimoz.markerDeleteHandle(this.items[i].marker);
        }
        this.items.splice(0, this.items.length);
    },

    resize : function(newSize) {
        this.maxItems = newSize;
        //TODO: discard items when newSize < maxItems
    },

    toString : function() {
        var arr = new Array();
        for (var i = 0; i < this.items.length; i++) {
            arr.push(i + ":"
                     + this.items[i].view.title
                     +" l:"+(this.items[i].line+1)
                     +" c:"+(this.items[i].col+1)+"\n");
        }
        return arr.join("\n");
    }
}

const MARKNUM_EDITPOSLOC = 14;
const SC_MOD_INSERTTEXT = Components.interfaces.ISciMoz.SC_MOD_INSERTTEXT;
const SC_MOD_DELETETEXT = Components.interfaces.ISciMoz.SC_MOD_DELETETEXT;

var gEditPosition = {
    lastEditStack : new EditPosFixedSizeStack(10),
    nextEditStack : new EditPosFixedSizeStack(10),
    mode : null,
    editClearNextStack: null,
    fgColor : null,
    bgColor : null,

    onLoad : function() {
        try {
            var obs = DafizillaCommon.getObserverService();
            obs.addObserver(this, "view_opened", false);
            obs.addObserver(this, "view_closed", false);
            obs.addObserver(this, "tabswitcher_pref_changed", false);

            this.prefs = new TabSwitcherPrefs();
            this.init();

            if (this.prefs.editCompatibility) {
                obs.addObserver(this, "current_view_check_status", false);
            };

            this.addListeners();

            xtk.include("color");

            this.fgColor = xtk.color.RGB(0x00, 0x00, 0x00); // black
            this.bgColor = xtk.color.RGB(0x00, 0xFF, 0xFF); // cyan

            //DafizillaCommon.log("onLoad done");
        } catch (err) {
            DafizillaCommon.exception(err);
        }
    },

    init : function() {
        try {
            this.prefs.load();

            //cache some prefs
            var mode = this.prefs.editGranularity;

            if (mode == "s") {
                this.mode = mode;
            } else {
                this.mode = parseInt(mode) - 1;
            }

            this.editClearNextStack = this.prefs.editClearNextStack;

            this.lastEditStack.resize(this.prefs.maxSizeEditPositionStack);
            this.nextEditStack.resize(this.prefs.maxSizeEditPositionStack);
        } catch (err) {
            DafizillaCommon.exception(err);
        }
    },

    onUnLoad : function() {
        try {
            var obs = DafizillaCommon.getObserverService();
            if (this.prefs.editCompatibility) {
                obs.removeObserver(this, "current_view_check_status");
            };
            obs.removeObserver(this, "view_opened");
            obs.removeObserver(this, "view_closed");
            obs.removeObserver(this, "tabswitcher_pref_changed");
            this.removeListeners();
        } catch (err) {
            DafizillaCommon.exception(err);
        }
    },

    observe : function(subject, topic, data) {
        try {
            switch (topic) {
                case "current_view_check_status":
                    //StatusBar_AddMessage("current_view_check_status", "debugger",5000,true);
                    this.pushEdit();
                    break;
                case "view_closed":
                    this.viewClosed(subject);
                    break;
                case "view_opened":
                    this.viewOpened(subject);
                    break;
                case "tabswitcher_pref_changed":
                    this.init();
            }
        } catch (err) {
            DafizillaCommon.exception(err);
        }
    },

    removeView : function(view, arr) {
        try {
            for (var i = arr.length - 1; i >= 0; i--) {
                if (arr[i].view == view) {
                    try {
                        //remove markers first
                        scimoz = arr[i].view.scimoz;
                        scimoz.markerDeleteHandle(arr[i].marker);
                    } catch (e) {}

                    arr.splice(i, 1);
                }
            }
        } catch (err) {
            DafizillaCommon.exception(err);
        }
    },

    pushEdit : function(view, position) {
        //keep this function bloody FAST
        try {
            if (view) {
                var currentView = view;
            } else {
                var currentView = ko.views.manager.currentView;
            };
            //DafizillaCommon.log("pushEdit");

            if (!currentView.document) {
                return;
            }

            if (!currentView.document.isDirty) {
                return;
            }

            if (this.lastEditStack.length) {
                var last = this.lastEditStack.peek();
            } else {
                var last = null;
            }

            var scimoz = currentView.scimoz;
            if (position) {
                var currentPos = position;
            } else {
                var currentPos = scimoz.currentPos;
            }

            if (last && last.view == currentView) {
                // seems to happen that pushEdit is called multiple times
                // with the same position
                if (last.position != currentPos) {
                    var currentLine = scimoz.lineFromPosition(currentPos);
                    if (this.mode == "s") {
                        //track ONLY the last line in a file
                        this.movePosition(last, scimoz, currentPos, currentLine);
                    } else {
                        var cnt = this.mode;
                        var diff = last.line - currentLine;
                        var absdiff = diff < 0 ? -diff : diff;
                        if (absdiff <= cnt) {
                            //var msg = "modifypos: "+cnt+" "+absdiff+" "+last.position+" "+currentPos;
                            //StatusBar_AddMessage(msg, "debugger",5000,true);

                            this.movePosition(last, scimoz, currentPos, currentLine);
                        } else {
                            //var msg = "addpos: "+cnt+" "+absdiff+" "+currentPos;
                            //StatusBar_AddMessage(msg, "debugger",5000,true);

                            this.addPositionToStack(this.lastEditStack,
                                                    currentView, currentPos);
                        }
                    }
                }
            } else {
                this.addPositionToStack(this.lastEditStack,
                                        currentView, currentPos);
            }
        } catch (err) {
            DafizillaCommon.exception(err);
        }
    },

    movePosition : function(item, scimoz, position, currentLine) {
        //keep this function bloody FAST
        try {
            item.position = position;
            item.col = scimoz.getColumn(position);

            if (item.line != currentLine) {
                item.line = currentLine;

                //move marker too
                scimoz.markerDeleteHandle(item.marker);
                item.marker = scimoz.markerAdd(currentLine,
                                              MARKNUM_EDITPOSLOC);
            }

            if (this.editClearNextStack) {
                if (this.nextEditStack.length > 0) {
                    this.nextEditStack.clear();
                    this.updateCommands();
                }
            }
        } catch (err) {
            DafizillaCommon.exception(err);
        }
    },

    addPositionToStack : function(toStack, view, position) {
        //keep this function bloody FAST
        try {
            var cleared = false;
            if (this.editClearNextStack) {
                if (this.nextEditStack.length > 0) {
                    this.nextEditStack.clear();
                    cleared = true;
                }
            }

            var scimoz = view.scimoz;
            var line = scimoz.lineFromPosition(position);
            var marker = scimoz.markerAdd(line, MARKNUM_EDITPOSLOC);

            //var msg = "new marker: "+line;
            //StatusBar_AddMessage(msg, "debugger",5000,true);

            toStack.push({
                view : view,
                position : position,
                line: line,
                col: scimoz.getColumn(position),
                marker: marker});

            if (toStack.length == 1 || cleared) {
                // status will change only when the length was 0 and got 1
                this.updateCommands();
            }
        } catch (err) {
            DafizillaCommon.exception(err);
        }
    },

    updateCommands : function() {
        this.enable("cmd_tabswitcher_goto_last_edit_position",
                    this.lastEditStack.length > 0);
        this.enable("cmd_tabswitcher_goto_next_edit_position",
                    this.nextEditStack.length > 0);
    },

    enable : function(elementId, isEnabled) {
        try {
            var el = document.getElementById(elementId);

            if (el) {
                if (isEnabled) {
                    el.removeAttribute("disabled");
                } else {
                    el.setAttribute("disabled", true);
                }
            }
        } catch (err) {
            DafizillaCommon.exception(err);
        }
    },

    goToLastEdit : function(index) {
        this._popEditPosition(this.lastEditStack, index, this.nextEditStack,
                              this.prefs.editRememberCurrentPos);
    },

    goToNextEdit : function(index) {
        this._popEditPosition(this.nextEditStack, index, this.lastEditStack,
                              false);
    },

    _showStacks : function(msg) {
        try {
            var last = this.lastEditStack.toString();
            var next = this.nextEditStack.toString();

            alert(msg+'\nlast:'+last+'\nnext:'+next);
        } catch (err) {
            DafizillaCommon.exception(err);
        }
    },

    _popEditPosition : function(fromStack, fromIndex, toStack, saveCurrent) {
        try {

            if (fromStack.length == 0) {
                return false;
            }

            if (fromIndex == 0 && this.isEditOnCurrentView(fromStack.peek())) {
                fromIndex = 1;
            }

            // elements are retrieved starting from end of array
            // if fromIndex < 0 editPos is undefined
            fromIndex = fromStack.items.length - 1 - fromIndex;

            var editPos = fromStack.items[fromIndex];

            if (!editPos) {
                return false;
            }

            if (saveCurrent && toStack.length == 0){
                //this._showStacks('before');
                if (!this.isEditOnCurrentView(fromStack.peek())) {
                    var currentView = ko.views.manager.currentView;
                    this.addPositionToStack(toStack,
                                            currentView, currentView.scimoz.currentPos);
                    //this._showStacks('after');
                }
            }

            var elementToMoveCount = fromStack.items.length;
            for (var i = elementToMoveCount - 1; i >= fromIndex ; i--) {
                toStack.push(fromStack.items[i]);
            }

            //no need to delete the marker here, because the whole
            //item moves to the other stack
            fromStack.items.splice(fromIndex, elementToMoveCount - fromIndex);
            editPos.view.makeCurrent();
            var scimoz = editPos.view.scimoz;

            var line = scimoz.markerLineFromHandle(editPos.marker);
            if (line == -1) {
                //marker gone or whatever
                scimoz.setSel(-1, editPos.position);
            } else {
                scimoz.gotoPos(scimoz.positionAtColumn(line, editPos.col));
            }

            this.updateCommands();

        } catch (err) {
            DafizillaCommon.exception(err);
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
        try {
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
                var item = items[count - index];
                var view = item.view;
                var mi = document.createElement("menuitem");
                // show line and column, but scimoz is 0 based
                var text = view.title+" l:"+(item.line+1)+" c:"+(item.col+1);
                mi.setAttribute("label", text);
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
        } catch (err) {
            DafizillaCommon.exception(err);
        }
    },

    isEditOnCurrentView : function(editPos) {
        //check if the passed position IS the current
        try {
            if (editPos) {
                var currentView = ko.views.manager.currentView;

                if (currentView.document) {
                    var currPos = currentView.scimoz.currentPos;
                    var currLine = currentView.scimoz.lineFromPosition(currPos);

                    //if (currentView == editPos.view && currPos == editPos.position) {
                    if (currentView == editPos.view && currLine == editPos.line) {
                        return true;
                    }
                }
            }
        } catch (err) {
            DafizillaCommon.exception(err);
        }
        return false;
    },

    addListeners : function() {
        try {
            var self = this;

            this.handle_current_view_check_status_setup = function(event) {
                //StatusBar_AddMessage("handle_current_view_check_status_setup", "debugger",5000,true);

                self.pushEdit();
            };

            this.handle_view_opened_setup = function(event) {
                self.viewOpened(event.originalTarget);
            };

            this.handle_view_closed_setup = function(event) {
                self.viewClosed(event.originalTarget);
            };

            if (this.prefs.editCompatibility) {
                window.addEventListener('current_view_check_status',
                                        this.handle_current_view_check_status_setup, false);
            };

            window.addEventListener('view_opened',
                                    this.handle_view_opened_setup, false);
            window.addEventListener('view_closed',
                                    this.handle_view_closed_setup, false);

            //DafizillaCommon.log("addEventListener done");
        } catch (err) {
            DafizillaCommon.exception(err);
        }
    },

    removeListeners : function() {
        try {
            if (this.prefs.editCompatibility) {
                window.removeEventListener('current_view_check_status',
                                        this.handle_current_view_check_status_setup, false);
            };
            window.removeEventListener('view_opened',
                                    this.handle_view_opened_setup, false);
            window.removeEventListener('view_closed',
                                    this.handle_view_closed_setup, false);
        } catch (err) {
            DafizillaCommon.exception(err);
        }
    },

    viewClosed : function(view) {
        try {
            try {
                view.onModifiedHandler = view.gEditPositionOrigHandler;
            } catch (e) {};
            this.removeView(view, this.lastEditStack.items);
            this.removeView(view, this.nextEditStack.items);
            this.updateCommands();
        } catch (err) {
            DafizillaCommon.exception(err);
        }
    },

    viewOpened : function(view) {
        try {
            if (view.document) {
                if (this.prefs.editShowMarkers) {
                    var scimoz = view.scimoz;

                    scimoz.markerDefine(MARKNUM_EDITPOSLOC, scimoz.SC_MARK_CIRCLEPLUS);
                    scimoz.markerSetFore(MARKNUM_EDITPOSLOC, this.fgColor); // black
                    scimoz.markerSetBack(MARKNUM_EDITPOSLOC, this.bgColor); // cyan

                    //scimoz.setMarginMaskN(2, 0x0FFFF);
                    scimoz.setMarginMaskN(2,
                                          ko.markers.MARKERS_MASK_SYMBOLS |
                                          (1 << MARKNUM_EDITPOSLOC));

                    //ko.statusBar.AddMessage(
                    //    "history marker patch done",
                    //    "open_errs", 3000, true);
                }

                if (!this.prefs.editCompatibility) {
                    view.gEditPositionOrigHandler = view.onModifiedHandler;

                    view.onModifiedHandler = function(position, modificationType,
                        text, length, linesAdded, line, foldLevelNow, foldLevelPrev) {

                        if (modificationType & (SC_MOD_INSERTTEXT | SC_MOD_DELETETEXT)) {
                            try {
                                gEditPosition.pushEdit(this, position);
                            } catch (err) {
                                DafizillaCommon.exception(err);
                            };
                        }

                        if (typeof(this.gEditPositionOrigHandler) == "function") {
                            return this.gEditPositionOrigHandler(position, modificationType,
                                            text, length, linesAdded, line,
                                            foldLevelNow, foldLevelPrev);
                        }
                        return false;
                    };
                    //DafizillaCommon.log("patch done");
                };
                //DafizillaCommon.log("viewOpened");
            };
        } catch (err) {
            DafizillaCommon.exception(err);
        }
    }
}

window.addEventListener("load", function(event) {gEditPosition.onLoad(event)}, false);
window.addEventListener("unload", function(event) {gEditPosition.onUnLoad(event)}, false);