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
    comment_ob = null,
    comment_box_ob = null,
    num_lines = -1,
    comments = {},
    codeMirror = null;

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
	$('#error').text(text).show();
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

function setSelection(codeMirror){
	if(codeMirror.somethingSelected){
		var start = codeMirror.getCursor(true).line + 1;
		var end = codeMirror.getCursor(false).line + 1;
		console.log(start,end);
		showCommentBox(start,end);
	}else{
	}
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
	hideComments();
	highlightLines(start,end,true);
	selection_start = start;
	selection_end = end;
	$('input#line_start').val(start);
	$('input#line_end').val(end);
	var comment_box = $('#comment_box');
	
	/*var top = Number($('#line'+start).position().top);
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
	comment_box.css('height',height);*/
	comment_box.slideDown();
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

function writeComments(comments_ob) {
	if((typeof comments_ob) === "string"){
    	    comments_ob = jQuery.parseJSON(comments_ob);
	}
	buildCommentStructure(comments_ob);
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
	for(var i in comments){
		buildCommentSet(Number(i)-1,comments[i]);
	}
}

function buildCommentSet(lineNumber,commentSet) {
	//console.log(lineNumber,commentSet.length,commentSet);
	codeMirror.setMarker(lineNumber, "<span class='commentNumber'>("+commentSet.length+")</span> %N%");
	var set = $("<div class='commentSet'>");
	set.attr("lineNumber",lineNumber);
	for(var i=0;i<commentSet.length;i++){
		var comment = commentSet[i];
		var commentDiv = $("<div class='commentBox'>");
		var title = $("<div class='commentTitle'>");
		title.text(comment.user);
		var body = $("<div class='commentBody'>");
		body.text(comment.text);
		commentDiv.append(title);
		commentDiv.append(body);
		set.append(commentDiv);
	}
	//var top = Number($('#line'+n).position().top);
	//set.css('top',top);
	
	
	$("#commentsDiv").append(set);
	set.hide();
	/*var ob = $('<div>');
	ob.addClass('window');
	var text = comment.length + ""// comment";
	/*if(comment.length > 1)
	    text += "s";
	ob.text(text);
	ob.click(function() {
	    openComment(n);
	});
	var comments = $('<div>');
	*/
	
	/*
	var left = $('#comment'+n).position().left;
	comment_ob.css('left',left);
	var width = $('#comment'+n).css('width');
	comment_ob.css('width',width);
	comment_ob.show();
	
	var name_ob = $('#user_name');
	var comment_text_ob = $('#comment_text');
	
	for(comment in commentSet){
		var commentDiv = $('<div>');
	}
	$('#comment'+n).append(ob);
	*/
	//$('#comment'+n).
}

function showComments(codeMirror, lineNumber){
	closeCommentBox();
	hideComments();
	$(".commentSet[lineNumber='"+lineNumber+"']").slideDown();
}

function hideComments(){
	$(".commentSet").hide();
}
    
/******************************************************************************
* Code Display                                                                *
******************************************************************************/
    
function writeCodeLines(code) {
	if(code === null) return;
	if((typeof code) === "string"){
	    code = jQuery.parseJSON(code);
	}
	var lines = code.text.split('\n');
	num_lines = lines.length;
	$("#code").text(code.text);
	
	getLanguage(code.language_id,function(language) {
		codeMirror = CodeMirror.fromTextArea(document.getElementById("code"),{
			lineNumbers: true,
			lineWrapping: true,
			fixedGutter: true,
			readOnly: true,
			onGutterClick: showComments,
			onCursorActivity: setSelection,
			
		});
	},handleAjaxError);
	getComments(code.id,writeComments,handleAjaxError);
}
    
/******************************************************************************
* Run when display ready                                                      *
******************************************************************************/

$(document).ready(function() {
	//comment_ob = $('#comment_window');
	//comment_ob.hide();
	$('#comment_box').hide();
	$('#error').hide();
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
	/*
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
	});*/
	$('#comment_form').mouseup(function() { return false; });
});
})();
