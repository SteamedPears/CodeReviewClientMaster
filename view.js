/******************************************************************************
* view.js                                                                     *
* Copyright 2012, Simon Pratt                                                 *
******************************************************************************/
(function() {
    function print(text) {
	var div = $('div#code');
	div.append(text);
    }
    
    function get(id,success_fn,error_fn) {
	$.get('do/code',{id:id},success_fn);
    }
    
    // run when ready
    $(document).ready(function() {
	var query = URI(document.URL).query(true);
	if(query.id === undefined) {
	    print('No ID specified');
	    return;
	}
	get(query.id,function(ob) { // success
	    print(ob.text);
	},function() { // error
	    print('An error occured');
	});
    });
})();