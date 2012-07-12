init_minimap = function( codeMirror ) {
	minimap.disableSelection();
	minimap.append( codeMirror.getValue() );
	$('body').append( minimap );
};