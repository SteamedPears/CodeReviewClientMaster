/******************************************************************************
* view.js                                                                     *
* Copyright 2012, Simon Pratt                                                 *
******************************************************************************/
(function() {
    function printCode(n,line) {
	var toPrint = '<tr>';
	toPrint += '<td><input name="line_start" type="radio" value="'+n+'"></td>';
	toPrint += '<td><input name="line_end" type="radio" value="'+n+'"></td>';
	toPrint += '<td>'+n+'</td>';
	toPrint += '<td id="line'+n+'" class="pre"></td></tr>';
	$('#code_table').append(toPrint);
	$('td#line'+n).text(line);
    }

    function printComments(text) {
	$('div#comments').append(text);
    }
    
    function getCode(id,success_fn,error_fn) {
	$.get('do/code',{id:id},success_fn);
    }

    function getComments(id,success_fn,error_fn) {
	$.get('do/comments',{code_id:id},success_fn);
    }

    function writeCode(code) {
	var lines = code.text.split('\n');
	for(var i in lines) {
	    printCode(Number(i)+1,lines[i]+'\n');
	}
	$('input#code_id').val(code.id);
	getComments(code.id,writeComments,writeCommentsError);
    }

    function writeCodeError() {
	printCode("An error occured while retrieving code");
    }

    function writeComments(comments_ob) {
	var comments = comments_ob.comments;
	for(var index in comments) {
	    var toPrint = '';
	    toPrint += 'User: ' + comments[index].user + '<br>';
	    toPrint += 'Start: ' + comments[index].line_start + '<br>';
	    toPrint += 'End: ' + comments[index].line_end + '<br>';
	    toPrint += 'Comment: ' + comments[index].text + '<br><br>';
	    printComments(toPrint);
	}
    }

    function writeCommentsError() {
	printComments("An error occured while retrieving comments");
    }
    
    // run when ready
    $(document).ready(function() {
	var query = URI(document.URL).query(true);
	if(query.id === undefined) {
	    printCode('No ID specified');
	    return;
	}
	getCode(query.id,writeCode,writeCodeError);
    });
})();