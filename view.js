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
    
    function printCode(n,line) {
	var toPrint = '<tr>';
	toPrint += '<td><input name="line_start" type="radio" value="'+n+'"></td>';
	toPrint += '<td><input name="line_end" type="radio" value="'+n+'"></td>';
	toPrint += '<td>'+n+'</td>';
	toPrint += '<td id="line'+n+'" class="pre"></td>';
	toPrint += '<td id="comment'+n+'"></td>';
	toPrint += '</tr>';
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
	if(code === null) return;
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

    function writeComments(comments_ob) {
	buildCommentStructure(comments_ob);
	closeComments();
    }

    function clearComments() {
	for(var i in comments) {
	    $('#comment'+i).text('');
	}
    }

    function closeComments() {
	clearComments();
	clearHighlighting();
	for(var i in comments) {
	    writeComment(i,comments[i]);
	}
    }

    function modulo(n,m) {
	while(n < 0)
	    n += m;
	return n%m;
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
	var top = $('#line'+(1+Number(n))).position().top;
	comment.css('top',top);
	var left = $('#comment'+n).position().left;
	comment.css('left',left);
	comment.appendTo($('body'));
	
	// previous button
	var prev = $('<span class="button">');
	prev.append('Previous');
	prev.click(function() {
	    i = modulo(i-1,num);
	    highlightComment(comments[n][i]);
	    displayComment(comment,comments[n][i]);
	});
	ob.append(prev);
	ob.append(' ');
	
	// next button
	var next = $('<span class="button">');
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
	var close = $('<span class="button">');
	close.append('X');
	close.click(function() {
	    comment.remove();
	    closeComments()
	});
	ob.append(close);
	
	// add all to document
	$('#comment'+n).append(ob);
    }

    function displayComment(dom_ob,comment_ob) {
	dom_ob.text('');
	dom_ob.append($('<h3>').text(comment_ob.user));
	dom_ob.append($('<span>').text(comment_ob.text));
    }

    function clearHighlighting() {
	highlightLines(selected_line_start,selected_line_end,'');
    }

    function highlightComment(comment) {
	clearHighlighting();
	highlightLines(comment.line_start,
		       comment.line_end,
		       highlightColour);
	selected_line_start = comment.line_start;
	selected_line_end = comment.line_end;
    }

    function writeComment(n,comment) {
	var ob = $('<div class="button">');
	ob.text(comment.length + " comment(s)");
	ob.click(function() {
	    openComment(n);
	});
	$('#comment'+n).append(ob);
    }

    function highlightLines(start,end,colour) {
	while(start <= end) {
	    $('#line' + start).css('background',colour);
	    ++start;
	}
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