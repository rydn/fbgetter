var getter = require( './getter' ),
	fs = require( 'fs' ),
	_ = require( 'lodash' ),
	json2csv = require( './json2csv' ),
	conf = JSON.parse( fs.readFileSync( './conf.json' ) );
var App = function ( ) {
	var $this = {};
	$this.getFriends = function ( me_id, cb ) {
		getter.get( conf.access_token, '/me/friends', function ( data ) {
			data = JSON.parse( data );
			data = _.map( data.data, function ( fr ) {
				return {
					uid1: String(me_id),
					uid2: String(fr.id)
				};
			} );
			console.log( 'got: ' + data.length + ' direct friends' );
			cb( null, data );
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
					return String(f.id);
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

		if ( err ) throw err;
		getter.query( conf.access_token, 'SELECT uid1, uid2 FROM friend WHERE uid1 IN (SELECT uid2 FROM friend WHERE uid1=me() ) AND uid2 IN (SELECT uid2 FROM friend WHERE uid1=me())', function ( err, m ) {
			if ( err ) throw err;
			else {
				var finalM = _.union( friends, m );
				var relationshipScript = _.map( finalM, function ( item ) {
					return "start n1=node:node_auto_index(uid='" + item.uid1 + "'),n2=node:node_auto_index(uid='" + item.uid2 + "') CREATE n1-[:IS_A_FRIEND_OF]->n2;";
				} );
				relationshipScript = 'begin transaction\n'+relationshipScript.join('\n')+'\ncommit';
				var createNodesScript = _.map(friends, function($f){
					return "create (n{uid:'"+$f.uid2+"', type:'Facebook'});";
				});
				createNodesScript = 'begin transaction\n'+createNodesScript.join('\n')+'\ncommit';


				console.log( 'got ' + finalM.length + ' edges' );
				fs.writeFileSync('create-nodes.cyf', createNodesScript);
				fs.writeFileSync('create-relationships.cyf', relationshipScript);
				fs.writeFileSync( 'result.json', JSON.stringify( finalM ) );

			}
		} );
	}
} );