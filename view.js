/******************************************************************************
* view.js                                                                     *
* Copyright 2012                                                              *
* For details about the copyright holders, see the COPYRIGHT file.            *
* This software is freely distributed under the ISC License.                  *
* For details about the license, see the LICENSE file.                        *
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
    codeMirror = null,
    noSelect = false;
    

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

function handleAjaxError(jqXHR, textStatus, errorThrown) {
	reportError(errorThrown);
}

    
/******************************************************************************
* Highlighting                                                                *
******************************************************************************/

function getSelection(codeMirror){
	if(!noSelect){
		if(codeMirror.somethingSelected){
			var start = codeMirror.getCursor(true).line + 1;
			var end = codeMirror.getCursor(false).line + 1;
			showCommentBox(start,end);
		}else{
			hideCommentBox();
		}
	}
}

function setSelection(event){
	var startLine = event.data.startLine-1;
	var endLine = event.data.endLine;
	noSelect = true;
	codeMirror.setSelection({line:startLine,ch:0},{line:endLine,ch:0});
	noSelect = false;
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
	selection_start = start;
	selection_end = end;
	$('input#line_start').val(start);
	$('input#line_end').val(end);
	$('#lineStartNum').text(start);
	$('#lineEndNum').text(end);
	var comment_box = $('#comment_box');
	comment_box.slideDown();
}

function closeCommentBox() {
	$('#comment_box').hide();
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
		commentDiv.mouseover({startLine:comment.line_start,endLine:comment.line_end},setSelection);
		var title = $("<div class='commentTitle'>");
		title.text(comment.user);
		var body = $("<div class='commentBody'>");
		body.text(comment.text);
		commentDiv.append(title);
		commentDiv.append(body);
		set.append(commentDiv);
	}
	
	$("#commentsDiv").append(set);
	set.hide();
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
	if(!codeMirror){
		getLanguage(code.language_id,function(language) {
			codeMirror = CodeMirror.fromTextArea(document.getElementById("code"),{
				lineNumbers: true,
				lineWrapping: true,
				fixedGutter: true,
				readOnly: true,
				onGutterClick: showComments,
				onCursorActivity: getSelection,
			
			});
		},handleAjaxError);
	}else{
		comments = [];
		$(".commentSet").remove();
	}
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
	$('#comment_form').ajaxForm(function(){
		getCode(query.id,writeCodeLines,handleAjaxError);
		closeCommentBox();
	}); 
});
})();
