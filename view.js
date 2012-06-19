/******************************************************************************
 * view.js                                                                     *
 * Copyright 2012, Simon Pratt                                                 *
 ******************************************************************************/
(function() {
    var comments_div,
    highlight_start = -1,
    highlight_end = -1,
    selection_start = -1,
    selection_end = -1,
    backgroundColour = 'White',
    highlightColour = 'LightSalmon',
    comment_text_ob = null,
    comment_box_ob = null,
    num_lines = -1,
    comments = {};

/******************************************************************************
* Utility Functions                                                           *
******************************************************************************/

    function modulo(n,m) {
	while(n < 0)
	    n += m;
	return n%m;
    }

    function logError(text) {
	console.log('ERROR: ' + text);
    }

    function reportError(text) {
	logError(text); // good enough for now
    }

    // http://www.quirksmode.org/dom/range_intro.html
    function getSelected() {
	if(window.getSelection)
	    return window.getSelection();
	if(document.getSelection)
	    return document.getSelection();
	if(document.selection) // opera
	    return document.selection.createRange();
	logError("Couldn't get selected range");
    }
    
    function getRangeObject(selectionObject) {
	if (selectionObject.getRangeAt)
	    return selectionObject.getRangeAt(0);
	else { // Safari!
	    var range = document.createRange();
	    range.setStart(selectionObject.anchorNode,
			   selectionObject.anchorOffset);
	    range.setEnd(selectionObject.focusNode,
			 selectionObject.focusOffset);
	    return range;
	}
    }

/******************************************************************************
* Highlighting
******************************************************************************/

    function highlightLines(start,end,colour) {
	highlight_start = start;
	highlight_end = end;
	while(start <= end) {
	    $('#line' + start).css('background',colour);
	    ++start;
	}
    }

    function clearHighlighting() {
	highlightLines(highlight_start,highlight_end,'');
	highlight_start = -1;
	highlight_end = -1;
    }

    function highlightComment(comment) {
	clearHighlighting();
	highlightLines(comment.line_start,
		       comment.line_end,
		       highlightColour);
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
* Comment Input                                                               *
******************************************************************************/

    function showCommentBox(start,end) {
	closeComments();
	highlightLines(start,end,highlightColour);
	selection_start = start;
	selection_end = end;
	$('input#line_start').val(start);
	$('input#line_end').val(end);
	var comment_box = $('div#comment_box');
	comment_box.css('position','absolute');
	comment_box.css('background',backgroundColour);
	var top = Number($('#line1').position().top);
	comment_box.css('top',top);
	var comment_ob = $('#comment1');
	var left = comment_ob.position().left;
	comment_box.css('left',left);
	var width = comment_ob.css('width');
	width = width.substring(0,width.indexOf('px'));
	comment_box.css('width',width);
	$('input#user').css('width',width);
	var last_line_ob = $('#line'+num_lines);
	var height = last_line_ob.css('height');
	height = Number(height.substring(0,height.indexOf('px')));
	height += Number(last_line_ob.position().top);
	comment_box.css('height',height);
	comment_box.show();
    }

    function closeCommentBox() {
	$('div#comment_box').hide();
	clearHighlighting();
	selection_start = -1;
	selection_end = -1;
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
	if(comment_text_ob === null)
	    return;
	comment_text_ob.remove()
	comment_text_ob = null;
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
	comment_text_ob = $('<div>');
	comment_text_ob.attr('id','selected_comment');
	comment_text_ob.css('position','absolute');
	
	var top = Number($('#line'+n).position().top);
	var height = $('#line'+n).css('height');
	height = height.substring(0,height.indexOf('px'));
	top += Number(height);
	comment_text_ob.css('top',top);
	var left = $('#comment'+n).position().left;
	comment_text_ob.css('left',left);
	comment_text_ob.appendTo($('body'));
	
	// previous button
	var prev = $('<span>');
	prev.attr('class','button');
	prev.append('Previous');
	prev.click(function() {
	    i = modulo(i-1,num);
	    highlightComment(comments[n][i]);
	    displayComment(comment_text_ob,comments[n][i]);
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
	    displayComment(comment_text_ob,comments[n][i]);
	});
	next.click();
	ob.append(next);
	ob.append(' ');

	// close button
	var close = $('<span>');
	close.attr('class','button');
	close.append('X');
	close.click(function() {
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
	var line_num = $('<td>');
	line_num.text(n);
	line_num.attr('class','small');
	toPrint.append(line_num);
	var line_cell = $('<td>');
	line_cell.attr('id','line'+n);
	line_cell.attr('class','pre');
	line_cell.text(line);
	line_cell.data('line',n);
	toPrint.append(line_cell);
	toPrint.append($('<td>').attr('id','comment'+n));
	$('#code_table').append(toPrint);
    }

    function writeCodeLines(code) {
	if(code === null) return;
	var lines = code.text.split('\n');
	num_lines = lines.length;
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
	// retrieve and display code
	var query = URI(document.URL).query(true);
	if(query.id === undefined) {
	    reportError("Code ID not found");
	    return;
	}
	getCode(query.id,writeCodeLines,reportError);

	// handle text selection
	$(document).mouseup(function() {
	    var selected = getSelected();
	    var range = getRangeObject(selected);
	    var start_ob = $(range.startContainer.parentElement);
	    var end_ob = $(range.endContainer.parentElement);
	    var line_start = start_ob.data('line');
	    var line_end = end_ob.data('line');
	    if(line_start === undefined || line_end === undefined) {
		closeCommentBox();
		return;
	    }
	    showCommentBox(line_start,line_end);
	});
	$('#comment_form').mouseup(function() { return false; });
	closeCommentBox();
    });
})();