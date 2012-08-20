var BaseView = require('views/base');
var Vm = require('models/vm');
var Img = require('models/image');
var Server = require('models/server');
var User = require('models/user');
var Probes = require('models/probes');

var VMDeleteModal = require('views/vm-delete-modal');
var CreateProbeController = require('controllers/create-probe');

/**
 * VmView
 *
 * options.uuid uuid of VM
 * options.vm vm attrs
 */
var VmView = BaseView.extend({
  template: 'vm',

  sidebar: 'vms',

  appEvents: {
    'probe:added': 'onProbeAdded'
  },

  events: {
    'click .server-hostname': 'clickedServerHostname',
    'click .start': 'clickedStartVm',
    'click .stop': 'clickedStopVm',
    'click .reboot': 'clickedRebootVm',
    'click .delete': 'clickedDeleteVm',
    'click .create-probe': 'clickedCreateProbe'
  },

  uri: function() {
    return _.str.sprintf('vms/%s', this.vm.get('uuid'));
  },

  initialize: function(options) {
    _.bindAll(this);

    if (options.uuid)
      this.vm = new Vm({uuid: options.uuid});
    if (options.vm)
      this.vm = options.vm;

    this.owner = new User();
    this.image = new Img();
    this.server = new Server();
    this.probes = new Probes();

    this.image.on('change', this.renderImage, this);
    this.server.on('change', this.renderServer, this);
    this.owner.on('change', this.renderOwner, this);

    this.probes.on('reset', this.renderProbes, this);
    this.image.set({ uuid: this.vm.get('image_uuid') });
    if (! this.image.get('updated_at'))
      this.image.fetch();

    this.server.set({ uuid: this.vm.get('server_uuid') });
    if (! this.server.get('last_modified')) {
      this.server.fetch();
    }

    this.owner.set({ uuid: this.vm.get('owner_uuid') });
    if (! this.owner.get('cn')) {
      this.owner.fetch();
    }


    this.vm.on('change:image_uuid', function(m) {
      this.image.set({uuid: m.get('image_uuid')});
      this.image.fetch();
    }, this);

    this.vm.on('change:owner_uuid', function(m) {
      this.fetchProbes();
      this.owner.set({uuid: m.get('owner_uuid')});
      this.owner.fetch();
    }, this);

    this.vm.on('change:server_uuid', function(m) {
      this.server.set({uuid: m.get('server_uuid')});
      this.server.fetch();
    }, this);

    this.vm.on('change:alias', this.render, this);
    this.vm.fetch();
  },

  compileTemplate: function() {
    return this.template({
      vm: this.vm,
      image: this.image,
      server: this.server,
      owner: this.owner
    });
  },

  clickedStartVm: function(e) {
    var self = this;
    this.vm.start(function(res) {
      res.name = 'Start VM';
      self.eventBus.trigger('watch-job', job);
    });
  },

  clickedCreateProbe: function() {
    var createProbeController = new CreateProbeController({ vm: this.vm });
  },

  clickedStopVm: function(e) {
    var self = this;
    this.vm.stop(function(res) {
      res.name = 'Stop VM';
      self.eventBus.trigger('watch-job', job);
    });
  },

  clickedRebootVm: function(e) {
    var self = this;
    this.vm.reboot(function(job) {
      job.name = 'Reboot VM';
      self.eventBus.trigger('watch-job', job);
    });
  },

  clickedDeleteVm: function(e) {
    var vmDeleteView = new VMDeleteModal({ vm: this.vm, owner: this.owner });
    vmDeleteView.render();
  },

  clickedServerHostname: function() {
    this.eventBus.trigger('wants-view', 'server', { server:this.server });
  },

  renderImage: function() {
    this.$('.image-name-version').html(this.image.nameWithVersion());
    this.$('.image-uuid').html(this.image.get('uuid'));

    return this;
  },

  renderServer: function() {
    this.$('.server-hostname').html(this.server.get('hostname'));
    this.$('.server-uuid').html(this.server.get('uuid'));
  },

  renderOwner: function() {
    this.$('.owner-name').html(this.owner.get('cn'));
    this.$('.owner-uuid').html(this.owner.get('uuid'));
    return this;
  },

  renderProbes: function() {
    this.$('.probes tbody').empty();
    this.probes.each(function(m) {
      this.$('.probes tbody')
      .append(
        _.str.sprintf('<tr><td>%s</td><td>%s</td></tr>',
          m.get('name'), m.get('type'))
        );
    }, this);
  },

  render: function() {
    this.$el.html(this.compileTemplate());
    console.log('render');

    this.renderImage();
    this.fetchProbes();
    return this;
  },

  onProbeAdded: function(probe) {
    this.fetchProbes();
  },

  fetchProbes: function() {
    if (this.vm.get('owner_uuid') && this.vm.get('uuid')) {
      this.probes.fetch({
        data: $.param({
          user: this.vm.get('owner_uuid'),
          machine: this.vm.get('uuid')
        })
      });
    }
  }

});

module.exports = VmView;
