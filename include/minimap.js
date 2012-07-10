apply_minimap = function( codeMirror ) {
	var minimap = $('<div>');
	minimap.css({
			'width': 			'100px',
			'height': 			'99.99%',
			'background-color': '#000000',
			'z-index': 			3,
			'position': 		'absolute',
			'top': 				'0px',
			'right': 			'0px',
			'color': 			'#FFFFFF',
			'opacity': 			'0.2',
			'font-size': 		'3px',
			'cursor': 			'default'
			});
	minimap.attr( 'id', 'minimap' );
	minimap.disableSelection();

	minimap.append( codeMirror.getValue() );
	$('body').append( minimap );
};