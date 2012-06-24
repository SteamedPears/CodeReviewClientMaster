/******************************************************************************
* view.js                                                                     *
* Copyright 2012, Alexis Beingessner and Simon Pratt                          *
******************************************************************************/
(function() {
    var comments_div,
    highlight_start = -1,
    highlight_end = -1,
    selection_start = -1,
    selection_end = -1,
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
	logError(text);
	$('#error').text(text);
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

    function handleAjaxError(jqXHR, textStatus, errorThrown) {
	reportError(errorThrown);
    }

    
/******************************************************************************
* Highlighting                                                                *
******************************************************************************/

    function highlightLines(start,end,highlighted) {
	highlight_start = start;
	highlight_end = end;
	while(start <= end) {
	    $('#line_pre' + start).toggleClass('highlighted',highlighted);
	    $('#line' + start).toggleClass('highlighted',highlighted);
	    ++start;
	}
    }

    function clearHighlighting() {
	highlightLines(highlight_start,highlight_end,false);
	highlight_start = -1;
	highlight_end = -1;
    }

    function highlightComment(comment) {
	clearHighlighting();
	highlightLines(comment.line_start,
		       comment.line_end,
		       true);
    }

/******************************************************************************
* Data retrieval                                                              *
******************************************************************************/

    function getCode(id,success_fn,error_fn) {
	$.ajax('do/code',{
	    data:     {id:id},
	    dataType: 'json',
	    error:    error_fn,
	    success:  success_fn
	});
    }

    function getComments(id,success_fn,error_fn) {
	$.ajax('do/comments',{
	    data:     {code_id:id},
	    dataType: 'json',
	    error:    error_fn,
	    success:  success_fn
	});
    }

    function getLanguage(id,success_fn,error_fn) {
	$.ajax('do/language',{
	    data:     {id:id},
	    dataType: 'json',
	    error:    error_fn,
	    success:  success_fn
	});
    }

/******************************************************************************
* Comment Input                                                               *
******************************************************************************/

    function showCommentBox(start,end) {
	closeComments();
	highlightLines(start,end,true);
	selection_start = start;
	selection_end = end;
	$('input#line_start').val(start);
	$('input#line_end').val(end);
	var comment_box = $('#comment_box');
	
	var top = Number($('#line'+start).position().top);
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
	$('#comment_box').hide();
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
	if((typeof comments_ob) == "string"){
    	    comments_ob = jQuery.parseJSON(comments_ob);
	}
	buildCommentStructure(comments_ob);
	logError('closing comments');
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

	// make the comment box bigger
	var text_height = comment_text_ob.height();
	comment_text_ob.css('height',text_height+300);
	
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
    
    function buildCodeTable(n,line,language_code) {
	var toPrint = $('<tr>');
	var line_num = $('<td>');
	line_num.text(n);
	line_num.addClass('small');
	toPrint.append(line_num);
	var line_cell = $('<td>');
	line_cell.addClass('code');
	line_cell.data('line',n);
	line_cell.attr('id','line_cell'+n);
	toPrint.append(line_cell);
	var line_pre = $('<pre class="codeBlock">');
	line_pre.data('line',n);
	line_pre.attr('id','line_pre'+n);
	line_cell.append(line_pre);
	var line_code = $('<code class="codeBlock">')
	line_code.attr('id','line'+n);
	line_code.text(line);
	line_code.data('line',n);
	line_code.attr('data-language',language_code);
	line_pre.append(line_code);
	toPrint.append($('<td>').attr('id','comment'+n));
	$('#code_table').append(toPrint);
    }

    function writeCodeLines(code) {
	if(code === null) return;
	if((typeof code) == "string"){
	    code = jQuery.parseJSON(code);
	}
	var lines = code.text.split('\n');
	num_lines = lines.length;
	getLanguage(code.language_id,function(language) {
	    for(var i in lines) {
		buildCodeTable(Number(i)+1,lines[i]+'\n',language.code);
	    }
	    $('input#code_id').val(code.id);
	    highlightSyntax(language);
	},handleAjaxError);
	getComments(code.id,writeComments,handleAjaxError);
    }

    function highlightSyntax(language) {
	if(language === null ||
	   language.code === undefined ||
	   language.code === 'none')
	    return;
	// load the appropriate language script
	var language_script = $('<script>');
	language_script.attr('src',
			     'include/rainbow/js/language/'+language.code+'.js');
	$('head').append(language_script);
	// call rainbow
	Rainbow.color();
    }
    
/******************************************************************************
* Run when display ready                                                      *
******************************************************************************/

    $(document).ready(function() {
	$('#comment_box').hide();
	// retrieve and display code
	var query = URI(document.URL).query(true);
	if(query.error != undefined) {
	    reportError(query.error);
	}
	if(query.id === undefined) {
	    reportError("Code ID not found");
	    return;
	}
	getCode(query.id,writeCodeLines,handleAjaxError);

	// handle text selection
	$(document).mouseup(function() {
	    var selected = getSelected();
	    var range = getRangeObject(selected);
	    var start_ob = $(range.startContainer.parentElement);
	    var end_ob = $(range.endContainer.parentElement);
	    var line_start = start_ob.data('line');
	    var line_end = end_ob.data('line');
	    if(line_start === undefined || line_end === undefined) {
		start_ob = start_ob.parent().parent();
		end_ob = end_ob.parent().parent();
		line_start = start_ob.data('line');
		line_end = end_ob.data('line');
		if(line_start === undefined || line_end === undefined) {
		    closeCommentBox();
		    return;
		}
	    }
	    showCommentBox(line_start,line_end);
	});
	$('#comment_form').mouseup(function() { return false; });
    });
})();
