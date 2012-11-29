define(function(require) {
    /**
    * views/servers.js
    */


    var adminui = require('adminui');
    var Servers = require('models/servers');
    var tplServers = require('text!tpl/servers.html');

    var ServersListItem = Backbone.Marionette.ItemView.extend({
        template: require('text!tpl/servers-list-item.html'),
        tagName: 'tr',

        events: {
            'click td':'navigateToServerDetails',
            'click button.setup':'setupServer'
        },

        url: function() {
            return 'servers';
        },
        templateHelpers: {
            running: function() {
                return this.status == 'running';
            },
            not_setup: function() {
                return this.setup == 'false';
            },
            memory_percent: function() {
                var free = (this.memory_total_bytes-this.memory_available_bytes);
                return _.str.sprintf("%0.1f", free / this.memory_total_bytes * 100);
            },
            'memory_available_mb': function() {
                return _.str.sprintf("%0.1f", this.memory_available_bytes/1024/1024);
            },
            'memory_total_mb': function() {
                return _.str.sprintf("%0.1f", this.memory_total_bytes/1024/1024);
            }
        },
        setupServer: function(e) {
            e.stopPropagation();

            console.log('Setup server');

            this.model.setup(function(res) {
                console.log('Setup Server returned');
                console.log(res);
            });
        },

        navigateToServerDetails: function() {
            adminui.vent.trigger('showview', 'server', { server:this.model });
        }
    });

    var FilterForm = Backbone.View.extend({
        events: {
            'submit form': 'onSubmit',
            'change input': 'onSubmit',
            'change select': 'onSubmit'
        },
        onSubmit: function(e) {
            e.preventDefault();

            var params = this.$('form').serializeObject();
            this.trigger('query', params);
        }
    });

    var ServersView = Backbone.Marionette.CompositeView.extend({
        name: 'servers',
        template: tplServers,
        itemView: ServersListItem,
        itemViewContainer: 'tbody',
        url: function() {
            return 'servers';
        },

        initialize: function(options) {
            this.filterForm = new FilterForm();
            this.collection = new Servers();
        },
        filter: function(params) {
            this.collection.fetch({data: params});
        },
        onError: function(model, xhr) {
            adminui.vent.trigger('error', {
                context: 'servers / cnapi',
                xhr: xhr
            });
        },
        onRender: function() {
            this.filterForm.setElement(this.$('.servers-filter'));
            this.bindTo(this.filterForm, 'query', this.filter, this);
            this.bindTo(this.collection, 'error', this.onError, this);
            
            this.collection.fetch();
        }
    });

    return ServersView;
});
