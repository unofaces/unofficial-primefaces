/**
 * PrimeFaces Mobile DataList Widget
 */
PrimeFaces.widget.DataList = PrimeFaces.widget.BaseWidget.extend({
    
    init: function(cfg) {
        this._super(cfg);
        
        this.jq.listview();
    }
});

/**
 * PrimeFaces Mobile Panel Widget
 */
PrimeFaces.widget.Panel = PrimeFaces.widget.BaseWidget.extend({
    
    init: function(cfg) {
        this._super(cfg);
        this.header = this.jq.children('.ui-panel-m-titlebar');
        this.content = this.jq.children('.ui-panel-m-content');
        this.onshowHandlers = this.onshowHandlers||{};
        
        this.bindEvents();
    },
    
    bindEvents: function() {
        var $this = this;
        
        if(this.cfg.toggleable) {
            this.toggler = this.header.children('.ui-panel-m-titlebar-icon');
            this.toggleStateHolder = $(this.jqId + '_collapsed');
            
            this.toggler.on('click', function(e) {
                $this.toggle();
                
                e.preventDefault();
            });
        }
    },
    
    toggle: function() {
        if(this.content.is(':visible'))
            this.collapse();
        else
            this.expand();
    },
    
    collapse: function() {
        this.toggleState(true, 'ui-icon-minus', 'ui-icon-plus');
        this.content.hide();
    },
    
    expand: function() {
        this.toggleState(false, 'ui-icon-plus', 'ui-icon-minus');
        this.content.show();
        this.invokeOnshowHandlers();
    },
    
    toggleState: function(collapsed, removeIcon, addIcon) {
        this.toggler.removeClass(removeIcon).addClass(addIcon);
        this.cfg.collapsed = collapsed;
        this.toggleStateHolder.val(collapsed);
        this.fireToggleEvent();
    },
    
    fireToggleEvent: function() {
        if(this.cfg.behaviors) {
            var toggleBehavior = this.cfg.behaviors['toggle'];
            
            if(toggleBehavior) {
                toggleBehavior.call(this);
            }
        }
    },
    
    addOnshowHandler: function(id, fn) {
        this.onshowHandlers[id] = fn;
    },
    
    invokeOnshowHandlers: function() {
        for(var id in this.onshowHandlers) {
            if(this.onshowHandlers.hasOwnProperty(id)) {
                var fn = this.onshowHandlers[id];
                
                if(fn.call()) {
                    delete this.onshowHandlers[id];
                }
            }
        }
    }
});

/**
 * PrimeFaces Mobile AccordionPanel Widget
 */
PrimeFaces.widget.AccordionPanel = PrimeFaces.widget.BaseWidget.extend({
    
    init: function(cfg) {
        this._super(cfg);
        this.tabs = this.jq.children('.ui-collapsible');
        this.headers = this.tabs.children('.ui-collapsible-heading');
        this.contents = this.tabs.children('.ui-collapsible-content');
        this.stateHolder = $(this.jqId + '_active');
        
        this.initActive();
        this.bindEvents();
        
        if(this.cfg.dynamic && this.cfg.cache) {
            this.markLoadedPanels();
        }
    },
    
    initActive: function() {
        if(this.cfg.multiple) {
            var indexes = this.stateHolder.val().split(',');
            for(var i = 0; i < indexes.length; i++) {
                indexes[i] = parseInt(indexes[i]);
            }
            
            this.cfg.active = indexes;
        }
        else {
            this.cfg.active = parseInt(this.stateHolder.val());
        }
    },
    
    bindEvents: function() {
        var $this = this;
    
        this.headers.on('click.accordionPanel', function(e) {            
            var element = $(this);
            if(!element.hasClass('ui-state-disabled')) {
                var tabIndex = element.parent().index();

                if(element.hasClass('ui-collapsible-heading-collapsed'))
                    $this.select(tabIndex);
                else
                    $this.unselect(tabIndex);
            }

            e.preventDefault();
        });
    },
    
    markLoadedPanels: function() {
        if(this.cfg.multiple) {
            for(var i = 0; i < this.cfg.active.length; i++) {
                if(this.cfg.active[i] >= 0)
                    this.markAsLoaded(this.tabs.eq(this.cfg.active[i]));
            }
        } else {
            if(this.cfg.active >= 0)
                this.markAsLoaded(this.tabs.eq(this.cfg.active));
        }
    },
    
    select: function(index) {
        var tab = this.tabs.eq(index);

        if(this.cfg.onTabChange) {
            var result = this.cfg.onTabChange.call(this, tab);
            if(result === false)
                return false;
        }

        var shouldLoad = this.cfg.dynamic && !this.isLoaded(tab);

        if(this.cfg.multiple)
            this.addToSelection(index);
        else
            this.cfg.active = index;

        this.saveState();

        if(shouldLoad) {
            this.loadDynamicTab(tab);
        }
        else {
            this.show(tab);
            this.fireTabChangeEvent(tab);
        }

        return true;
    },
    
    show: function(tab) {
        var header = tab.children('.ui-collapsible-heading'),
        content = tab.children('.ui-collapsible-content');

        //deactivate current
        if(!this.cfg.multiple) {
            this.close(this.tabs.filter(':not(.ui-collapsible-collapsed)'));
        }

        tab.removeClass('ui-collapsible-collapsed').attr('aria-expanded', true);
        header.removeClass('ui-collapsible-heading-collapsed')
                .children('.ui-collapsible-heading-toggle').removeClass('ui-icon-plus').addClass('ui-icon-minus');
        content.removeClass('ui-collapsible-content-collapsed').attr('aria-hidden', false).show();
    },
    
    close: function(tab) {
        tab.addClass('ui-collapsible-collapsed').attr('aria-expanded', false);
        tab.children('.ui-collapsible-heading').addClass('ui-collapsible-heading-collapsed')
                .children('.ui-collapsible-heading-toggle').addClass('ui-collapsible-heading-collapsed').removeClass('ui-icon-minus').addClass('ui-icon-plus');
        tab.children('.ui-collapsible-content').attr('aria-hidden', true)
                .addClass('ui-collapsible-content-collapsed').attr('aria-hidden', true).hide();
    },

    unselect: function(index) {
        this.close(this.tabs.eq(index))

        this.removeFromSelection(index);
        this.saveState();
        
        if(this.hasBehavior('tabClose')) {
            this.fireTabCloseEvent(tab);
        }
    },
    
    addToSelection: function(nodeId) {
        this.cfg.active.push(nodeId);
    },

    removeFromSelection: function(index) {
        this.cfg.active = $.grep(this.cfg.active, function(r) {
            return (r !== index);
        });
    },
    
    saveState: function() {
        if(this.cfg.multiple)
            this.stateHolder.val(this.cfg.active.join(','));
        else
            this.stateHolder.val(this.cfg.active);
    },
    
    loadDynamicTab: function(tab) {
        var $this = this,
        options = {
            source: this.id,
            process: this.id,
            update: this.id,
            params: [
                {name: this.id + '_contentLoad', value: true},
                {name: this.id + '_newTab', value: tab.attr('id')},
                {name: this.id + '_tabindex', value: tab.index()}
            ],
            onsuccess: function(responseXML, status, xhr) {
                PrimeFaces.ajax.Response.handle(responseXML, status, xhr, {
                        widget: $this,
                        handle: function(content) {
                            tab.find('> .ui-collapsible-content > p').html(content);

                            if(this.cfg.cache) {
                                this.markAsLoaded(tab);
                            }   
                        }
                    });

                return true;
            },
            oncomplete: function() {
                $this.show(tab);
            }
        };

        if(this.hasBehavior('tabChange')) {
            this.cfg.behaviors['tabChange'].call(this, options);
        }
        else {
            PrimeFaces.ajax.AjaxRequest(options);
        }
    },
    
    fireTabChangeEvent : function(tab) {
        if(this.hasBehavior('tabChange')) {
            var tabChangeBehavior = this.cfg.behaviors['tabChange'],
            ext = {
                params: [
                    {name: this.id + '_newTab', value: tab.attr('id')},
                    {name: this.id + '_tabindex', value: parseInt(tab.index())}
                ]
            };

            tabChangeBehavior.call(this, ext);
        }        
    },

    fireTabCloseEvent : function(tab) {
        var tabCloseBehavior = this.cfg.behaviors['tabClose'],
        ext = {
            params: [
                {name: this.id + '_tabId', value: tab.attr('id')},
                {name: this.id + '_tabindex', value: parseInt(tab.index())}
            ]
        };
        
        tabCloseBehavior.call(this, ext);
    },
    
    markAsLoaded: function(tab) {
        tab.data('loaded', true);
    },

    isLoaded: function(tab) {
        return tab.data('loaded') === true;
    },
    
    hasBehavior: function(event) {
        if(this.cfg.behaviors) {
            return this.cfg.behaviors[event] != undefined;
        }

        return false;
    }
    
});

/**
 * PrimeFaces Mobile Growl Widget
 */
PrimeFaces.widget.Growl = PrimeFaces.widget.BaseWidget.extend({
    
    init: function(cfg) {
        this._super(cfg);
        this.initOptions(cfg);
        
        this.jq.popup({
            positionTo: 'window',
            theme: 'b'
        });
        
        this.container = $(this.jqId + '-popup');
        this.popupContainer = this.container.find('> div.ui-popup');
        this.popupContainer.append('<p></p>');
        this.messageContainer = this.popupContainer.children('p');
        this.placeholder = $(this.jqId + '-placeholder');
        
        this.popupContainer.removeAttr('id');
        this.placeholder.attr('id', this.id);
        
        this.show(this.cfg.msgs);
    },
    
    initOptions: function(cfg) {
        this.cfg = cfg;
        this.cfg.sticky = this.cfg.sticky||false;
        this.cfg.life = this.cfg.life||6000;
        this.cfg.escape = (this.cfg.escape === false) ? false : true;
    },
    
    refresh: function(cfg) {
    	this.initOptions(cfg);
        this.show(cfg.msgs);
    },
    
    show: function(msgs) {
        var $this = this;

        this.removeAll();

        if(msgs.length) {
            $.each(msgs, function(index, msg) {
                $this.renderMessage(msg);
            });

            this.jq.popup('open', {transition:'pop'});
            
            if(!this.cfg.sticky) {
                this.setRemovalTimeout();
            }
        }
    },
    
    removeAll: function() {
        this.messageContainer.children().remove();
    },
    
    renderMessage: function(msg) {
        var markup = '<div class="ui-growl-item ui-grid-a">';
        markup += '<div class="ui-growl-severity ui-block-a"><a class="ui-btn ui-shadow ui-corner-all ui-btn-icon-notext ui-btn-b ui-btn-inline" href="#"></a></div>';
        markup += '<div class="ui-growl-message ui-block-b">';
        markup += '<div class="ui-growl-summary"></div>';
        markup += '<div class="ui-growl-detail"></div>';
        markup += '</div></div>';
        
        var item = $(markup),
        severityEL = item.children('.ui-growl-severity'),
        summaryEL = item.find('> .ui-growl-message > .ui-growl-summary'),
        detailEL = item.find('> .ui-growl-message > .ui-growl-detail');

        severityEL.children('a').addClass(this.getSeverityIcon(msg.severity));
        
        if(this.cfg.escape) {
            summaryEL.text(msg.summary);
            detailEL.text(msg.detail);
        }
        else {
            summaryEL.html(msg.summary);
            detailEL.html(msg.detail);
        }
                
        this.messageContainer.append(item);
    },
    
    getSeverityIcon: function(severity) {
        var icon;
        
        switch(severity) {
            case 'info':
                icon = 'ui-icon-info';
                break;
            break;
    
            case 'warn':
                icon = 'ui-icon-alert';
                break;
            break;
    
            case 'error':
                icon = 'ui-icon-delete';
                break;
            break;
    
            case 'fatal':
                icon = 'ui-icon-delete';
                break;
            break;
        }
        
        return icon;
    },
        
    setRemovalTimeout: function() {
        var $this = this;
        
        if(this.timeout) {
            clearTimeout(this.timeout);
        }
        
        this.timeout = setTimeout(function() {
            $this.jq.popup('close');
        }, this.cfg.life);
    }
});

/**
 * PrimeFaces Mobile Dialog Widget
 */
PrimeFaces.widget.Dialog = PrimeFaces.widget.BaseWidget.extend({
    
    init: function(cfg) {
        this._super(cfg);
        this.content = this.jq.children('.ui-content');
        this.titlebar = this.jq.children('.ui-header');
        this.closeIcon = this.titlebar.children('.ui-icon-delete');
        
        this.jq.popup({
            positionTo: 'window',
            dismissible: false,
            overlayTheme: 'b'
        });
    
        this.bindEvents();
    },
        
    bindEvents: function() {
        var $this = this;
        
        this.closeIcon.on('click', function(e) {
            $this.hide();
            e.preventDefault();
        });
    },
    
    show: function() {
        this.jq.removeClass('ui-dialog-container').popup('open', {transition:this.cfg.showEffect});
    },
    
    hide: function() {
        this.jq.popup('close');
    }
});

/**
 * PrimeFaces Mobile TabView Widget
 */
PrimeFaces.widget.TabView = PrimeFaces.widget.BaseWidget.extend({
    
    GRID_MAP: {
        '2': 'a',
        '3': 'b',
        '4': 'c',
        '5': 'd'
    },
    
    BLOCK_MAP: {
        '0': 'a',
        '1': 'b',
        '2': 'c',
        '3': 'd',
        '4': 'e'
    },
    
    init: function(cfg) {
        this._super(cfg);
        this.navbar = this.jq.children('.ui-navbar');
        this.navContainer = this.navbar.children('.ui-tabs-nav');
        this.headers = this.navContainer.children('.ui-tabs-header');
        this.panelContainer = this.jq.children('.ui-tabs-panels');
        this.stateHolder = $(this.jqId + '_activeIndex');
        this.cfg.selected = parseInt(this.stateHolder.val());
        this.onshowHandlers = this.onshowHandlers||{};
        this.initGrid();
        
        this.bindEvents();
        
        if(this.cfg.dynamic && this.cfg.cache) {
            this.markAsLoaded(this.panelContainer.children().eq(this.cfg.selected));
        }
        
    },
    
    initGrid: function() {
        var tabcount = this.headers.length;
        
        this.navContainer.addClass('ui-grid-' + this.GRID_MAP[tabcount.toString()]);
        
        for(var i = 0; i < tabcount; i++) {
            this.headers.eq(i).addClass('ui-block-' + this.BLOCK_MAP[(i % 5).toString()]);
        }
    },
    
    bindEvents: function() {
        var $this = this;

        //Tab header events
        this.headers.children('a')
                .on('click.tabView', function(e) {
                    var element = $(this),
                    index = element.parent().index();

                    if(!element.hasClass('ui-state-disabled') && (index !== $this.cfg.selected)) {
                        $this.select(index);
                    }

                    e.preventDefault();
                });

    },
    
    select: function(index, silent) {
        if(this.cfg.onTabChange && !silent) {
            var result = this.cfg.onTabChange.call(this, index);
            if(result === false)
                return false;
        }

        var newPanel = this.panelContainer.children().eq(index),
        shouldLoad = this.cfg.dynamic && !this.isLoaded(newPanel);

        this.stateHolder.val(index);
        this.cfg.selected = index;

        if(shouldLoad) {
            this.loadDynamicTab(newPanel);
        }
        else {
            this.show(newPanel);
            
            if(this.hasBehavior('tabChange') && !silent) {
                this.fireTabChangeEvent(newPanel);
            }
        }

        return true;
    },
    
    show: function(newPanel) {
        var oldHeader = this.headers.filter('.ui-tabs-active'),
        newHeader = this.headers.eq(newPanel.index()),
        oldPanel = this.panelContainer.children(':visible');

        oldPanel.attr('aria-hidden', true);
        oldHeader.attr('aria-expanded', false);
        newPanel.attr('aria-hidden', false);
        newHeader.attr('aria-expanded', true);

        oldHeader.removeClass('ui-tabs-active').children('a').removeClass('ui-btn-active');
        oldPanel.hide();

        newHeader.addClass('ui-tabs-active').children('a').addClass('ui-btn-active');
        newPanel.show();

        this.postTabShow(newPanel);
    },
    
    fireTabChangeEvent: function(panel) {
        var tabChangeBehavior = this.cfg.behaviors['tabChange'],
        ext = {
            params: [
                {name: this.id + '_newTab', value: panel.attr('id')},
                {name: this.id + '_tabindex', value: panel.index()}
            ]
        };
        
        tabChangeBehavior.call(this, ext);
    },
    
    loadDynamicTab: function(newPanel) {
        var $this = this,
        tabindex = newPanel.index(),
        options = {
            source: this.id,
            process: this.id,
            update: this.id,
            params: [
                {name: this.id + '_contentLoad', value: true},
                {name: this.id + '_newTab', value: newPanel.attr('id')},
                {name: this.id + '_tabindex', value: tabindex}
            ],
            onsuccess: function(responseXML, status, xhr) {
                PrimeFaces.ajax.Response.handle(responseXML, status, xhr, {
                        widget: $this,
                        handle: function(content) {
                            newPanel.children('p').html(content);

                            if(this.cfg.cache) {
                                this.markAsLoaded(newPanel);
                            }
                        }
                    });

                return true;
            },
            oncomplete: function() {
                $this.show(newPanel);
            }
        };

        if(this.hasBehavior('tabChange')) {
            this.cfg.behaviors['tabChange'].call(this, options);
        }
        else {
            PrimeFaces.ajax.Request.handle(options);
        }
    },
    
    postTabShow: function(newPanel) {    
        //execute user defined callback
        if(this.cfg.onTabShow) {
            this.cfg.onTabShow.call(this, newPanel.index());
        }

        //execute onshowHandlers and remove successful ones
        for(var id in this.onshowHandlers) {
            if(this.onshowHandlers.hasOwnProperty(id)) {
                var fn = this.onshowHandlers[id];
                
                if(fn.call()) {
                    delete this.onshowHandlers[id];
                }
            }
        }
    },
    
    hasBehavior: function(event) {
        if(this.cfg.behaviors) {
            return this.cfg.behaviors[event] !== undefined;
        }

        return false;
    },
    
    markAsLoaded: function(panel) {
        panel.data('loaded', true);
    },
    
    isLoaded: function(panel) {
        return panel.data('loaded') === true;
    }
    
});

/**
 * PrimeFaces Mobile OverlayPanel Widget
 */
PrimeFaces.widget.OverlayPanel = PrimeFaces.widget.BaseWidget.extend({
    
    init: function(cfg) {
        this._super(cfg);
        this.cfg.visible = false;
        this.cfg.showEvent = this.cfg.showEvent||'click.overlaypanel';
        this.cfg.hideEvent = this.cfg.hideEvent||'click.overlaypanel';
        this.cfg.target = this.cfg.targetId ? $(PrimeFaces.escapeClientId(this.cfg.targetId)): null;
        
        this.jq.panel({
            position: this.cfg.at,
            display: this.cfg.showEffect,
            dismissable: this.cfg.dismissable
        });
        
        if(this.cfg.dynamic) {
            this.jq.append('<div class="ui-panel-inner"></div>');
            this.content = this.jq.children('div.ui-panel-inner');
        }

        this.bindEvents();
    },
    
    bindEvents: function() {
        var $this = this;
        
        if(this.cfg.target) {
            if(this.cfg.showEvent === this.cfg.hideEvent) {
                this.cfg.target.on(this.cfg.showEvent, function(e) {
                    $this.toggle();
                });
            }
            else {
                this.cfg.target.on(this.cfg.showEvent, function(e) {
                    $this.show();
                })
                .on(this.cfg.hideEffect, function(e) {
                    $this.hide();
                })
            }
        }
    },
    
    show: function() {
        if(!this.loaded && this.cfg.dynamic)
            this.loadContents();
        else
            this._show();
    },
    
    _show: function() {
        this.jq.panel('open');
        this.cfg.visible = true;
        
        if(this.cfg.onShow) {
            this.cfg.onShow.call(this);
        }
    },
    
    hide: function() {
        this.jq.panel('close');
        this.cfg.visible = false;
        
        if(this.cfg.onHide) {
            this.cfg.onHide.call(this);
        }
    },
    
    toggle: function() {
        if(this.cfg.visible)
            this.hide();
        else
            this.show();
    },
    
    loadContents: function() {
        var $this = this,
        options = {
            source: this.id,
            process: this.id,
            update: this.id,
            params: [
                {name: this.id + '_contentLoad', value: true}
            ],
            onsuccess: function(responseXML, status, xhr) {
                PrimeFaces.ajax.Response.handle(responseXML, status, xhr, {
                        widget: $this,
                        handle: function(content) {
                            this.content.html(content);
                            this.loaded = true;
                        }
                    });

                return true;
            },
            oncomplete: function() {
                $this._show();
            }
        };

        PrimeFaces.ajax.Request.handle(options);
    }
});

/**
 * PrimeFaces Calendar Widget
 */
PrimeFaces.widget.Calendar = PrimeFaces.widget.BaseWidget.extend({
    
    init: function(cfg) {
        this._super(cfg);
        
        this.cfg.inline = !this.cfg.popup;
        this.input = $(this.jqId + '_input');
        var $this = this;

        this.configureLocale();

        //disabled dates
        this.cfg.beforeShowDay = function(date) { 
            if($this.cfg.preShowDay)
                return $this.cfg.preShowDay(date);
            else if($this.cfg.disabledWeekends)
                return $.datepicker.noWeekends(date);
            else
                return [true,''];
        }
        
        this.bindEvents();

        if(!this.cfg.disabled) {
            this.input.date(this.cfg);
        }
                        
        //pfs metadata
        this.input.data(PrimeFaces.CLIENT_ID_DATA, this.id);
    },
        
    refresh: function(cfg) {
        this.init(cfg);
    },
    
    configureLocale: function() {
        var localeSettings = PrimeFaces.locales[this.cfg.locale];

        if(localeSettings) {
            for(var setting in localeSettings) {
                if(localeSettings.hasOwnProperty(setting)) {
                    this.cfg[setting] = localeSettings[setting];
                }
            }
        }
    },
    
    bindEvents: function() {
        var $this = this;

        this.cfg.onSelect = function() {
            $this.fireDateSelectEvent();
            
            setTimeout( function(){
                $this.input.date( "addMobileStyle" );
            },0);
        };
    },
    
    fireDateSelectEvent: function() {
        if(this.cfg.behaviors) {
            var dateSelectBehavior = this.cfg.behaviors['dateSelect'];

            if(dateSelectBehavior) {
                dateSelectBehavior.call(this);
            }
        }
    },
    
    setDate: function(date) {
        this.input.date('setDate', date);
    },
    
    getDate: function() {
        return this.input.date('getDate');
    },
    
    enable: function() {
        this.input.date('enable');
    },
    
    disable: function() {
        this.input.date('disable');
    }
    
});

/**
 * PrimeFaces Mobile AutoComplete Widget
 */
PrimeFaces.widget.AutoComplete = PrimeFaces.widget.BaseWidget.extend({
    
    init: function(cfg) {
        this._super(cfg);
        this.cfg.minLength = (this.cfg.minLength !== undefined) ? this.cfg.minLength : 1;
        this.cfg.delay = (this.cfg.delay !== undefined) ? this.cfg.delay : 300;
        this.inputContainer = this.jq.children('.ui-input-search');
        this.input = $(this.jqId + '_input');
        this.hinput = $(this.jqId + '_hinput');
        this.clearIcon = this.inputContainer.children('.ui-input-clear');
        this.cfg.pojo = (this.hinput.length === 1);
        this.panel = this.jq.children('.ui-controlgroup');
        this.itemContainer = this.panel.children('.ui-controlgroup-controls');
        
        this.bindEvents();
        
        //pfs metadata
        this.input.data(PrimeFaces.CLIENT_ID_DATA, this.id);
        this.hinput.data(PrimeFaces.CLIENT_ID_DATA, this.id);
    },
    
    bindEvents: function() {
        var $this = this;

        this.input.on('keyup.autoComplete', function(e) {
            var value = $this.input.val();

            if(value.length === 0) {
                $this.hide();
            }
            else {
                $this.showClearIcon();
            }

            if(value.length >= $this.cfg.minLength) {
                //Cancel the search request if user types within the timeout
                if($this.timeout) {
                    clearTimeout($this.timeout);
                }

                $this.timeout = setTimeout(function() {
                    $this.search(value);
                }, $this.cfg.delay);
            }
        });
        
        this.clearIcon.on('click.autoComplete', function(e) {
            $this.input.val('');
            $this.hinput.val('');
            $this.hide();
        });
    },
    
    bindDynamicEvents: function() {
        var $this = this;

        //visuals and click handler for items
        this.items.on('click.autoComplete', function(event) {
            var item = $(this),
            itemValue = item.attr('data-item-value');

            $this.input.val(item.attr('data-item-label')).focus();

            if($this.cfg.pojo) {
                $this.hinput.val(itemValue); 
            }

            $this.fireItemSelectEvent(event, itemValue);
            $this.hide();
        });
    },
    
    search: function(query) {
        //allow empty string but not undefined or null
        if(query === undefined || query === null) {
            return;
        }

        var $this = this,
        options = {
            source: this.id,
            process: this.id,
            update: this.id,
            formId: this.cfg.formId,
            onsuccess: function(responseXML, status, xhr) {
                PrimeFaces.ajax.Response.handle(responseXML, status, xhr, {
                    widget: $this,
                    handle: function(content) {
                        this.itemContainer.html(content);

                        this.showSuggestions();
                    }
                });
                
                return true;
            }
        };

        options.params = [
            {name: this.id + '_query', value: query}  
        ];
        
        if(this.hasBehavior('query')) {
            var queryBehavior = this.cfg.behaviors['query'];
            queryBehavior.call(this, options);
        } 
        else {
            PrimeFaces.ajax.Request.handle(options); 
        }
    },
    
    show: function() {
        this.panel.removeClass('ui-screen-hidden');
    },
    
    hide: function() {        
        this.panel.addClass('ui-screen-hidden');
        this.hideClearIcon();
    },
    
    showSuggestions: function() {
        this.items = this.itemContainer.children('.ui-autocomplete-item');                   
        this.bindDynamicEvents();
                
        if(this.items.length) {
            this.items.first().addClass('ui-first-child');
            this.items.last().addClass('ui-last-child');
            
            if(this.panel.is(':hidden')) {
                this.show();
            }
        }
        else {
            if(this.cfg.emptyMessage) { 
                var emptyText = '<div class="ui-autocomplete-emptyMessage ui-widget">'+this.cfg.emptyMessage+'</div>';
                this.itemContainer.html(emptyText);
            }
            else {
                this.hide();
            }
        }
    },
    
    fireItemSelectEvent: function(event, itemValue) {
        if(this.hasBehavior('itemSelect')) {
            var ext = {
                params : [
                    {name: this.id + '_itemSelect', value: itemValue}
                ]
            };

            this.cfg.behaviors['itemSelect'].call(this, ext);
        }
    },
    
    hasBehavior: function(event) {
        if(this.cfg.behaviors) {
            return this.cfg.behaviors[event] !== undefined;
        }
    
        return false;
    },
    
    showClearIcon: function() {
        this.clearIcon.removeClass('ui-input-clear-hidden');
    },
    
    hideClearIcon: function() {
        this.clearIcon.addClass('ui-input-clear-hidden');
    }
    
});