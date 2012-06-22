/******************************************************************************
* index.js                                                                    *
* Copyright 2012, Simon Pratt                                                 *
******************************************************************************/
(function() {
/******************************************************************************
* Run when display ready                                                      *
******************************************************************************/
    $(document).ready(function() {
	// display error message, if any
	var query = URI(document.URL).query(true);
	if(query.error != undefined) {
	    $('#error').text(query.error);
	}
    });
})();