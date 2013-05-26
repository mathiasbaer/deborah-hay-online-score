
var CellView = require('js/views/cell-view');
var CellViewContext = module.exports = require('js/views/cell-view').extend({
	
	initialize: function () {

		// call initialize on super!
		CellView.prototype.initialize.apply(this,arguments);

		this.respondToSceneChange = this.respondToRecordingChange = false;
	},

	activate : function () {
		this.$el.addClass( 'active' );
		this.isActive = true;

		var self = this;
		var iframe = jQuery( '<iframe id="iframe-'+this.cid+'" '+
									 'src="http://player.vimeo.com/video/'+this.cell.get('vimeo-id')+'?api=1" '+
									 'frameborder="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe>' );
		iframe.load(function(){
			var win = document.getElementById('iframe-'+self.cid).contentWindow;
			var app = self.gridView.getApp();
			var postmessenger = app.getPostMessenger();
			app.on( 'vimeo:finish', function(req, resp){
				if ( req.message.source === win ) {
					self.gridView.playNextByAttr('vimeo-id',self.cell.get('play-next'));
					self.deactivate();
				}
			});
			app.on( 'vimeo:ready', function(req,resp){
				postmessenger.send({
					name: 'play', data: null, 
					receiver: win, receiverOrigin: 'http://player.vimeo.com',
					nameAlias: 'method', dataAlias: 'value'
				});
			});
			postmessenger.send({
				name: 'addEventListener', data: 'finish', 
				receiver: win, receiverOrigin: 'http://player.vimeo.com',
				nameAlias: 'method', dataAlias: 'value'
			});
		});
		this.$container.empty();
		this.$container.append(iframe);
	},

});