/******************************************************************************
 * view.js                                                                     *
 * Copyright 2012, Simon Pratt                                                 *
 ******************************************************************************/
(function() {
    var comments_div,
    selected_line_start = -1,
    selected_line_end = -1,
    highlightColour = 'LightSalmon',
    comments = {};

/******************************************************************************
* Utility Functions                                                           *
******************************************************************************/

    function modulo(n,m) {
	while(n < 0)
	    n += m;
	return n%m;
    }

    function reportError(error) {
	console.log(error); // good enough for now
    }

/******************************************************************************
* Highlighting
******************************************************************************/

    function highlightLines(start,end,colour) {
	while(start <= end) {
	    $('#line' + start).css('background',colour);
	    ++start;
	}
    }

    function clearHighlighting() {
	highlightLines(selected_line_start,selected_line_end,'');
	selected_line_start = -1;
	selected_line_end = -1;
    }

    function highlightComment(comment) {
	clearHighlighting();
	highlightLines(comment.line_start,
		       comment.line_end,
		       highlightColour);
	selected_line_start = comment.line_start;
	selected_line_end = comment.line_end;
    }

/******************************************************************************
* Data retrieval                                                              *
******************************************************************************/

    function getCode(id,success_fn,error_fn) {
	$.get('do/code',{id:id},success_fn);
    }

    function getComments(id,success_fn,error_fn) {
	$.get('do/comments',{code_id:id},success_fn);
    }
    
/******************************************************************************
* Comment Display                                                             *
******************************************************************************/

    function buildCommentStructure(comments_ob) {
	var comments_list = comments_ob.comments;
	for(var index in comments_list) {
	    var comment = comments_list[index];
	    var line_start = comment.line_start;
	    if(comments[line_start] === undefined)
		comments[line_start] = [];
	    comments[line_start].push(comment);
	}
    }

    function clearComments() {
	for(var i in comments) {
	    $('#comment'+i).text('');
	}
    }

    function displayComment(dom_ob,comment_ob) {
	dom_ob.text('');
	dom_ob.append($('<h3>').text(comment_ob.user));
	dom_ob.append($('<span>').text(comment_ob.text));
    }

    function closeComments() {
	clearComments();
	clearHighlighting();
	for(var i in comments) {
	    writeComment(i,comments[i]);
	}
    }

    function writeComments(comments_ob) {
	buildCommentStructure(comments_ob);
	closeComments();
    }

    function openComment(n) {
	clearComments();
	var i = -1;
	var num = comments[n].length;
	var ob = $('<div>');
	
	// actual comment
	var comment = $('<div>');
	comment.attr('id','selected_comment');
	comment.css('position','absolute');
	
	var top = Number($('#line'+n).position().top);
	var height = $('#line'+n).css('height');
	height = height.substring(0,height.indexOf('px'));
	top += Number(height);
	comment.css('top',top);
	var left = $('#comment'+n).position().left;
	comment.css('left',left);
	comment.appendTo($('body'));
	
	// previous button
	var prev = $('<span>');
	prev.attr('class','button');
	prev.append('Previous');
	prev.click(function() {
	    i = modulo(i-1,num);
	    highlightComment(comments[n][i]);
	    displayComment(comment,comments[n][i]);
	});
	ob.append(prev);
	ob.append(' ');
	
	// next button
	var next = $('<span>');
	next.attr('class','button');
	next.append('Next');
	next.click(function() {
	    i = modulo(i+1,num);
	    highlightComment(comments[n][i]);
	    displayComment(comment,comments[n][i]);
	});
	next.click();
	ob.append(next);
	ob.append(' ');

	// close button
	var close = $('<span>');
	close.attr('class','button');
	close.append('X');
	close.click(function() {
	    comment.remove();
	    closeComments()
	});
	ob.append(close);
	
	// add all to document
	$('#comment'+n).append(ob);
    }

    function writeComment(n,comment) {
	var ob = $('<div>');
	ob.attr('class','button');
	var text = comment.length + " comment";
	if(comment.length > 1)
	    text += "s";
	ob.text(text);
	ob.click(function() {
	    openComment(n);
	});
	$('#comment'+n).append(ob);
    }
    
/******************************************************************************
* Code Display                                                                *
******************************************************************************/
    
    function buildCodeTable(n,line) {
	var toPrint = $('<tr>');
	toPrint.append($('<td>').append($('<input>')
					.attr('name','line_start')
					.attr('type','radio')
					.val(n)));
	toPrint.append($('<td>').append($('<input>')
					.attr('name','line_end')
					.attr('type','radio')
					.val(n)));
	toPrint.append($('<td>').text(n));
	toPrint.append($('<td>').attr('id','line'+n).attr('class','pre'));
	toPrint.append($('<td>').attr('id','comment'+n));
	$('#code_table').append(toPrint);
	$('td#line'+n).text(line);
    }

    function writeCodeLines(code) {
	if(code === null) return;
	var lines = code.text.split('\n');
	for(var i in lines) {
	    buildCodeTable(Number(i)+1,lines[i]+'\n');
	}
	$('input#code_id').val(code.id);
	getComments(code.id,writeComments,reportError);
    }
    
/******************************************************************************
* Run when display ready                                                      *
******************************************************************************/

    $(document).ready(function() {
	var query = URI(document.URL).query(true);
	if(query.id === undefined) {
	    reportError("Code ID not found");
	    return;
	}
	getCode(query.id,writeCodeLines,reportError);
    });
})();