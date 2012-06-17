/******************************************************************************
* view.js                                                                     *
* Copyright 2012, Simon Pratt                                                 *
******************************************************************************/
(function() {
    var comments_div,
    selected_line_start = -1,
    selected_line_end = -1,
    highlightColour = 'LightSalmon';
    
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
	comments_div.append(text);
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
	    // highlight first comment
	    
	    // header
	    var ob = $('<h4>');
	    ob.append('<a href="#">User: ' + comments[index].user + '</a></h4>');
	    ob.data('start',comments[index].line_start);
	    ob.data('end',comments[index].line_end);
	    printComments(ob);
	    if(index == 0)
		commentChange(undefined,{newHeader:ob});
	    
	    // content
	    ob = $('<div>');
	    ob.append(comments[index].text);
	    ob.append('</div>');
	    printComments(ob);
	}
	setupAccordion();
    }

    function highlightLines(start,end,colour) {
	while(start <= end) {
	    $('#line' + start).css('background',colour);
	    ++start;
	}
    }

    function commentChange(event, ui) {
	var start = ui.newHeader.data('start');
	var end = ui.newHeader.data('end');
	highlightLines(selected_line_start,selected_line_end,'');
	highlightLines(start,end,highlightColour);
	selected_line_start = start;
	selected_line_end = end;
    }

    function setupAccordion() {
	comments_div.accordion({
	    header: "h4",
	    change: commentChange
	});
    }

    function writeCommentsError() {
	printComments("An error occured while retrieving comments");
    }
    
    // run when ready
    $(document).ready(function() {
	comments_div = $('div#comments');
	var query = URI(document.URL).query(true);
	if(query.id === undefined) {
	    printCode('No ID specified');
	    return;
	}
	getCode(query.id,writeCode,writeCodeError);
    });
})();