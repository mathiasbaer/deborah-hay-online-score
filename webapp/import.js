
var express 	= require('express'),
	_			= require('underscore'),
	orm 		= require('orm'),
	app 		= express();

/*
 +	set up APP
 +
 L + + + + + + + + + + + + + + + + + + + + + + + + */

app.use( orm.express( {
	database : "dhayapp",
	protocol : "mysql",
	host     : "localhost",
	port     : 3306,
	user 	 : "dhay",
	password : "dhay",
	query    : {
		pool     : false,
		debug    : true
	}
}, {
    define: function (db, models) {
        models = require('./models/models')(db, models, true);
    }
} ) );

app.get('/import-sets',reqLoadUser,function(req,rs){
	var path = __dirname + '/../app_off/data';
	var collection = require( path + '/collections/' + 'motionbank' );
	var cbs = [];
	_.map(collection,function(f,p){
		var data = require( path + '/sets/' + f.replace('.js','') );
		data.link = p;
		cbs.push((function(data,models,user){
			return function (next) {
				models.sets.create([{
					title: data.title,
					description: data.description || '',
					path: data.link,
					thumb_s: data.thumbs && data.thumbs.small || '',
					thumb_m: data.thumbs && data.thumbs.medium || '',
					thumb_l: data.thumbs && data.thumbs.large || '',
					grid_x: data.grid.x,
					grid_y: data.grid.y,
					creator_id: user.id
				}],function(err,sets){
					if (err) {
						console.log(err);
						next();
					} else if (sets.length === 1) {
						var set = sets[0];
						var cbs2 = [];
						var savedCells = [];
						_.map(data.cells,function(cell){
							cbs2.push((function(cell){
								return function(next2){
									var cellData = {
										type: cell.type,
										title: cell.title,
										preview: cell.preview
									};
									models.cells.create([cellData],function(err,cells){
										if (err) {
											console.log(err, cells);
											next2();
										} else {
											console.log(cells);
											var cellSaved = cells[0];
											savedCells.push(cellSaved);
											_.map(cell,function(v,k){
												if ( k in cellSaved || !cell.hasOwnProperty(k) ) return;
												models.fields.create([{
													name: k, value: v
												}],function(err,fields){
													if (err) throw(err);
													else {
														cellSaved.addFields(fields,function(){
															cellSaved.save(function(){
															});
														});
													}
												});
											});
											next2();
										}
									});
								};
							})(cell));
						});
						cbs2.push(function(){
							set.addCells(savedCells);
							set.save(function(err,set){
								if (err) {
									console.log(err);
								}
								next();
							});
						});
						var cb2 = cbs2.shift();
						var nextCb2 = function () {
							if ( cbs2.length > 0 ) {
								cb2 = cbs2.shift();
								cb2(nextCb2);
							}
						}
						cb2(nextCb2);
					}
				});
			}
		})(data,req.models,req.user));
	});
	var cb = cbs.shift();
	var nextCb = function () {
		if ( cbs.length > 0 ) {
			cb = cbs.shift();
			cb(nextCb);
		}
	}
	cb(nextCb);
	rs.send('OK');
});

app.listen( 5555 );
