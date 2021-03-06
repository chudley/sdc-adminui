/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var React = require('react');
var Notifications = React.createClass({
    propTypes: {
        bus: React.PropTypes.object.isRequired
    },
    getInitialState: function() {
        return {notifications: []};
    },
    componentWillMount: function() {
        this.props.bus.on('notification', this.notify, this);
    },
    componentWillUnmount: function() {
        this.props.bus.off('notification', this.notify);
    },
    notify: function(n) {
        this.setState({notification: n});
    },
    _handleDismissNotification: function(n) {
        this.setState({notification: null});
    },
    render: function() {
        var n = this.state.notification;

        if (!n) { return null; }
        return <div id="notifications">
            <div className={'notification ' + (n.level || 'info')}>
                <span dangerouslySetInnerHTML={{__html: n.message}}></span>
                <a onClick={this._handleDismissNotification}><i className="fa fa-times"></i></a>
            </div>
        </div>;
    }
});

module.exports = Notifications;
