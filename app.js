var getter = require( './getter' ),
	fs = require( 'fs' ),
	_ = require( 'lodash' ),
	json2csv = require('./json2csv'),
	conf = JSON.parse( fs.readFileSync( './conf.json' ) );
var App = function ( ) {
	var $this = this;
	$this.getFriends = function ( me_id, cb ) {
		getter.get( conf.access_token, '/me/friends', function ( data ) {
			data = JSON.parse( data );
			data = _.map( data.data, function ( fr ) {
				return {
					uid1: me_id,
					uid2: fr.id
				};
			} );
			console.log( 'got: ' + data.length + ' direct friends' );
			console.log( data );
			cb( null, data.data );
		} );
	};
	$this.getMutualFriends = function ( _friends, cb ) {
		var r = {}, c = 0;
		_.each( _friends, function ( friend ) {
			getter.get( conf.access_token, '/me/mutualfriends/' + friend.id, function ( ffd ) {
				c++;
				ffd = JSON.parse( ffd );
				ffd = ffd.data;
				console.log( friend.name + 'has a total of: ' + ffd.length + ' mutual friends' );
				ffd = _.map( ffd, function ( f ) {
					return f.id;
				} );
				r[ friend.id ] = ffd;
				if ( c == _friends.length ) {
					cb( null, r );
				}
			} );
		} );
	};
	return $this;
};
var app = new App( );
app.getFriends( conf.me_id, function ( err, friends ) {
	if ( err ) throw err;
	else {
		getter.query( conf.access_token, 'SELECT uid1, uid2 FROM friend WHERE uid1 IN (SELECT uid2 FROM friend WHERE uid1=me()) AND uid2 IN (SELECT uid2 FROM friend WHERE uid1=me())', function ( err, m ) {
			if ( err ) throw err;
			else
				var finalM = _.union( m, friends );
			console.log( finalM );
			fs.writeFileSync( 'result.json', JSON.stringify(finalM) );
			var csvContent ;
				json2csv.parse(finalM,['uid1','uid2'], function(err, row){
					csvContent += row;
				});
				fs.writeFileSync('result.csv', csvContent);
		} );
		//app.getMutualFriends( friends, function ( err, mutualFriends ) {} );
	}
} );