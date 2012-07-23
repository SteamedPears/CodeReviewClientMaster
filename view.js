/******************************************************************************
* view.js                                                                     *
* Copyright 2012                                                              *
* For details about the copyright holders, see the COPYRIGHT file.            *
* This software is freely distributed under the ISC License.                  *
* For details about the license, see the LICENSE file.                        *
******************************************************************************/
var CodeReview = (function( CodeReview ) {
	var comments_div,
	highlight_start = -1,
	highlight_end 	= -1,
	selection_start = -1,
	selection_end 	= -1,
	comment_ob 		= null,
	comment_box_ob 	= null,
	selection_ob 	= null,
	num_lines 		= -1,
	comments 		= {},
	language_data 	= null,
	codeArea 		= null,
	diffArea 		= null,
	mergeArea	 	= null,
	noSelect 		= false,
	codeOptions 	= null,
	diffOptions 	= null,
	commentOptions 	= null,
	commentAreas 	= [],
	diffComputer 	= new diff_match_patch(),
	appliedDiffs 	= [];
	var codeId = null;
	

	CodeReview.codeArea = undefined;

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

	function include(filename) {
		if(filename.indexOf('.js') != -1) {
			$('<script>').attr('src',filename).appendTo($('head'));
		} else if(filename.indexOf('.css') != -1) {
			$('<link>')
				.attr('rel','stylesheet')
				.attr('href',filename)
				.appendTo($('head'));
		} else {
			logError('failed to include file: '+filename);
		}
	}

	function resolveRequirements(languages,language,requirements,req_list){
		var lang = languages[language];
		var requires = lang.requires;
		if(requires){
			for(var requirement in requires){
				var name = requires[requirement];
				if(!requirements[name]){
					requirements[name] = true;
					resolveRequirements(languages,name,requirements,req_list);
					req_list.push(name);
				}
			}
		}
	}

	// taken from
	// http://www.quirksmode.org/js/cookies.html
	function createCookie(name,value,days) {
		var expires = "";
		if (days) {
			var date = new Date();
			date.setTime(date.getTime()+(days*24*60*60*1000));
			var expires = "; expires="+date.toGMTString();
		}
		document.cookie = name+"="+value+expires+"; path=/";
	}

	// taken from
	// http://www.quirksmode.org/js/cookies.html
	function readCookie(name) {
		var nameEQ = name + "=";
		var ca = document.cookie.split(';');
		for(var i=0;i < ca.length;i++) {
			var c = ca[i];
			while (c.charAt(0)==' ') c = c.substring(1,c.length);
			if (c.indexOf(nameEQ) == 0)
				return c.substring(nameEQ.length,c.length);
		}
		return null;
	}

/******************************************************************************
* Data retrieval                                                              *
******************************************************************************/

	function getCode(id,success_fn,error_fn) {
		$.ajax('/do/code',{
			data:	 {id:id},
			dataType: 'json',
			error:	error_fn,
			success:  success_fn
		});
	}

	function getComments(id,success_fn,error_fn) {
		$.ajax('/do/comments',{
			data:	 {code_id:id},
			dataType: 'json',
			error:	error_fn,
			success:  success_fn
		});
	}

	function getLanguage(id,success_fn,error_fn) {
		$.ajax('/do/language',{
			data:	 {id:id},
			dataType: 'json',
			error:	error_fn,
			success:  success_fn
		});
	}

	function getLanguageData(success_fn,error_fn) {
		$.ajax('languages.json',{
			dataType: 'json',
			error:	error_fn,
			success:  success_fn
		});
	}

/******************************************************************************
* Highlighting                                                                *
******************************************************************************/

	function handleSelection(){
		if(!noSelect){
			if(somethingSelected(codeArea)){
				var lines = getSelectedLines(codeArea);
				
				var top = getPositionOfLine(codeArea,lines.start);
				
				$('#comment-new').css("top", top);
				hideComments();
				showCommentBox(lines.start+1,lines.end+1);
			}else{
				closeCommentBox();
			}
		}
	}

	function setSelection(event){
		var startLine = event.data.startLine-1;
		var endLine = event.data.endLine;
		noSelect = true;
		setSelectedLines(codeArea,startLine,endLine);
		noSelect = false;
	}
	
	function clearCodeSelection(event){
		clearSelection(codeArea);
	}

/******************************************************************************
* Comment Input                                                               *
******************************************************************************/

	function showCommentBox(start,end) {
		selection_start = start;
		selection_end = end;
		$('input#line-start').val(start);
		$('input#line-end').val(end);
		$('#line-start-num').text(start);
		$('#line-end-num').text(end);
		setFirstLineNumber(diffArea,start);
		var text = getTextOnLines(codeArea,start,end);
		setText(diffArea,text);
		$('#comment-new').slideDown();
	}

	function closeCommentBox() {
		$('#comment-new').hide();
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
			buildCommentSet(Number(i),comments[i]);
		}
	}

	function buildCommentSet(lineNumber,commentSet) {
		if(codeArea == null) {
			logError('Tried to build comment set while codeArea null');
			return;
		}
		commentAreas[lineNumber] = [];
		
		var commentInfo = $("#comment-info");
		var commentInfoBtn =  $("<button class='commentButton'>");
		commentInfoBtn.text(commentSet.length+" comments");
		commentInfoBtn.css("position","absolute");
		var top = getPositionOfLine(codeArea,lineNumber-1);
		
		commentInfoBtn.css("top",top);
		commentInfoBtn.click(lineNumber,showComments);
		commentInfoBtn.attr("lineNumber",lineNumber-1);
		commentInfo.append(commentInfoBtn);
		
		var set = $("<div class='comment-set'>");
		set.attr("lineNumber",lineNumber);
		var rawDiffsList = {};
		for(var i=0;i<commentSet.length;i++){
			var comment = commentSet[i];
			var commentDiv = $("<div class='comment-box'>");
			commentDiv.mouseover({startLine:comment.line_start, 
				endLine:comment.line_end},setSelection);
			commentDiv.mouseout(clearCodeSelection);
			var title = $("<div class='comment-title'>");
			title.text(comment.user);
			var body = $("<div class='comment-body'>");
			body.text(comment.text);
			
			commentDiv.append(title);
			commentDiv.append(body);
			
			set.append(commentDiv);
			
			if(comment.diffs){
				var diffTextArea = $("<textarea class='comment-diffs'>");
				var originalText = getTextOnLines(codeArea,
					comment.line_start, comment.line_end);
				var newText = comment.diffs.replace(/\r/gm,'');
				
				if(originalText != newText){	
					var rawDiffs = computeDiffs(originalText,newText);
					rawDiffs.range = getRangeOfLines(comment.line_start-1,
					comment.line_end-1);
					
					var diffs = computeDiffText(rawDiffs);
					
					rawDiffsList[i]=rawDiffs;
					commentDiv.append(diffTextArea);
					diffTextArea.text(diffs);
				
					var area = createArea(diffTextArea.get(0),commentOptions);
				
					styleDiffArea(area,rawDiffs);
					setFirstLineNumber(area,lineNumber);
					commentAreas[lineNumber].push(area);
					
					var useIt = $("<input type='checkbox'>");
					useIt.attr("value",i);
					useIt.click(function(){
						var diffNum = $(this).attr("value");
						if($(this).is(":checked")){
							appliedDiffs.push(rawDiffsList[diffNum]);	
						}else{
							appliedDiffs.splice(
								appliedDiffs.indexOf(rawDiffsList[diffNum]),1);
						}
					})
					commentDiv.append($("<label>Use this diff &nbsp;</label>"));
					commentDiv.append(useIt);
				}
			}
			
		}

		$("#comment-view").append(set);
		set.hide();
	}

	function showComments(event){
		var lineNumber = event.data;
		closeCommentBox();
		hideComments();
		discardMerge();
		var top = getPositionOfLine(codeArea,lineNumber-1);
		var set = $(".comment-set[lineNumber='"+lineNumber+"']");
		set.css('top',$(event.target).css("top"));
		set.slideDown(400,function(){
			var areas = commentAreas[lineNumber];
			for(var index in areas){
				reRender(areas[index]);
			}
		});
	}

	function hideComments(){
		$(".comment-set").hide();
	}
	
/*********************
* TextArea Utilities *
*********************/
	function createArea(area,options){
		return CodeMirror.fromTextArea(area,options);
	}

	function getSelectedLines(area){
		var result = {};
		result.start = area.getCursor(true).line;
		result.end = area.getCursor(false).line;
		if(area.getCursor(false).ch==0){
			result.end--;
		}
		return result;
	}
	
	function setSelectedLines(area,startLine,endLine){
		area.setSelection({line:startLine,ch:0},{line:endLine,ch:0});
	}
	
	function clearSelection(area){
		area.setSelection({line:0},{line:0});
	}
	
	function somethingSelected(area){
		return area.somethingSelected();
	}
	
	function getPositionOfLine(area,line){
		var pos = getPositionOfLineAbsolute(area,line);
		var parent = $(area.getTextArea()).parent();
		if(parent.position()){
			pos-=parent.position().top;
		}
		return pos;
	}
	
	function getPositionOfLineAbsolute(area,line){
		return area.charCoords({line:line,ch:0},"page").y;
	}
	
	function setFirstLineNumber(area,number){
		area.setOption("firstLineNumber",number);
	}
	
	function getText(area){
		return area.getValue();
	}
	
	function setText(area,text){
		area.setValue(text);
		area.refresh();
	}
	
	function getTextOnLines(area,startLine,endLine){
		return area.getRange(
			{line:startLine-1,ch:0},
			{line:endLine-1,ch:999999});
	}
	
	function setTextOnLines(area,startLine,endLine,text){
		area.replaceRange(text,startLine,endLine);
	}
	
	function getTextOnRange(area,range){
		return area.getRange(
			{line:range.start-1,ch:0},
			{line:range.end-1,ch:999999});
	}
	
	function setTextOnRange(area,range,text){
		area.replaceRange(text,range.start,range.end);
	}
	
	function getRangeOfLines(startLine,endLine){
		var range = {};
		range.start = {line:startLine,ch:0};
		range.end = {line:endLine,ch:999999};
		return range;
	}
	
	function getPosFromIndex(area,index){
		var pos = area.posFromIndex(index);
		if(pos.ch==0 && pos.line!=0){
			pos.line--;
			pos.ch=999999;
		}
		return pos;
	}
	
	function styleText(area,startPos,endPos,style){
		area.markText(startPos,endPos,style);
	}
	
	function reRender(area){
		area.refresh();
	}
	
	function saveChanges(area){
		area.save();
	}
	
	function comparePositions(a,b){
		return b.range.start.line-a.range.start.line;
	}
	
/********************
* Merging/Diffs		*
********************/
	function forkCode(){
		var codeToSubmit;
		var parent = codeId;
		if(mergeArea){
			codeToSubmit = getText(mergeArea);  
		}else{
			codeToSubmit = getText(codeArea);
		}
		//submit code with POST somehow
	}

	function computeMerge(){
		if(!mergeArea){
			var area = $("<textarea>");
			$("#merge-output").append(area);
			mergeArea = createArea(area.get(0),codeOptions);
		}
		setText(mergeArea,getText(codeArea));
		appliedDiffs.sort(comparePositions);
		for(var i in appliedDiffs){
			var diffSet = appliedDiffs[i];
			var result = "";
			for(var j=0; j<diffSet.length; j++){
				var diff = diffSet[j];
				var type = diff[0];
				var text = diff[1];
				if(type!=-1){
					result+=text;
				}
			}
			setTextOnRange(mergeArea,diffSet.range,result);
		}
		reRender(mergeArea);
		hideComments();
		closeCommentBox();
		$("#merge-discard-button").show();
	}
	
	function discardMerge(){
		$("#merge-output").empty();
		$("#merge-discard-button").hide();
		mergeArea = null;
	}
	
	function computeDiffs(originalText,newText){
		var rawDiffs = diffComputer.diff_main(originalText,newText);
		diffComputer.diff_cleanupSemantic(rawDiffs);
		return rawDiffs;
	}
	
	function computeDiffText(rawDiffs){
		var str = "";
		for(var index = 0; index<rawDiffs.length; index++){
			var diff = rawDiffs[index];
			str+=diff[1];
		}
		return str;
	}
	
	function styleDiffArea(area,rawDiffs){
		var curIndex = 0;
		var curPos = getPosFromIndex(area,curIndex);
		for(var index = 0; index<rawDiffs.length; index++){
			var diff = rawDiffs[index];
			var type = diff[0];
			var text = diff[1];
			var newIndex = curIndex+text.length;
			var newPos = getPosFromIndex(area,newIndex);
			styleText(area,curPos,newPos,"diffStyle_"+type);
			curIndex = newIndex;
			curPos = newPos;
		}
	}

/******************************************************************************
* Code Display                                                                *
******************************************************************************/

	function writeCodeLines(code) {
		if(code === null) return;
		if((typeof code) === "string"){
			code = jQuery.parseJSON(code);
		}
		codeId = code.id;
		$('#code-id').val(code.id);
		var lines = code.text.split('\n');
		num_lines = lines.length;
		$("#code-view").text(code.text);
		if(!codeArea){
			getLanguage(code.language_id,function(language_ob) {
				var language = language_data.data[language_ob.mode];
				var req_ob = {};
				var requirements = [];
				resolveRequirements(language_data.data,
									language_ob.mode,
									req_ob,
									requirements);
				if(req_ob[language_ob.mode] === undefined)
					requirements.push(language_ob.mode);
				for(var index in requirements) {
					var lang = requirements[index];
					var file = language_data.data[lang].file;
					if(file !== undefined) {
						include(language_data.include_path+file);
					}
				}
				
				//codeOptions, diffOptions, commentOptions are globals
				codeOptions = {
					lineNumbers: true,
					lineWrapping: true,
					fixedGutter: true,
					readOnly: true,
					mode: language.mode,
					onCursorActivity: handleSelection
				};
				diffOptions = {
					lineNumbers: true,
					lineWrapping: true,
					fixedGutter: true,
					readOnly: false,
					smartIndent:false,
					mode: language.mode
				};
				commentOptions = {
					lineNumbers: true,
					lineWrapping: true,
					fixedGutter: true,
					readOnly: true,
					mode: language.mode
				};
				
				for(var index in language.options) {
					diffOptions[index] = 
						codeOptions[index] = 
						commentOptions[index] = language.options[index];
				}
				
				codeArea = createArea(
					document.getElementById("code-view"),codeOptions);
				diffArea = createArea(
					document.getElementById("diffs"),diffOptions);

				// TODO: Make the code appear in the minimap
				
				getComments(code.id,writeComments,handleAjaxError);
				setTimeout(rustleMyJimmmies,1000);
			},handleAjaxError);
		}else{
			comments = [];
			$(".comment-set").remove();
			getComments(code.id,writeComments,handleAjaxError);
		}
	}


	function rustleMyJimmmies(){ //cludge to try to fix code mirror issues
		console.log("rustling all the jimmies");
		reRender(codeArea);
		reRender(diffArea);
		for(var lineNumber in commentAreas){
			var areaList = commentAreas[lineNumber];
			for(var i=0;i<areaList.length;i++){
				reRender(areaList[i]);
			}
		} 
		$(".commentButton").each(function(){
			var btn = $(this);
			var top_line = getPositionOfLine(codeArea,
				Number(btn.attr("lineNumber"))); 
			btn.css("top",top_line);
		});
	}

/******************************************************************************
* Run when display ready                                                      *
******************************************************************************/

	$(document).ready(function() {
		var userName = readCookie('username');
		if(userName !== null) {
			$('#user').val(userName);
		}
		$('#user').change(function() {
			createCookie('username',$('#user').val());
		});
		$('#comment-new').hide();
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
		$('#comment-form').ajaxForm({
			beforeSerialize: function() {
				saveChanges(diffArea);
			},
			success:function(){
				getCode(query.id,writeCodeLines,handleAjaxError);
				$('#text').val('');
				closeCommentBox();
			},
			error:handleAjaxError
		});
		
		$('#merge-compute-button').click(computeMerge);
		$('#merge-discard-button').click(discardMerge).hide();
		$('#fork-code-button').click(forkCode);
		
		getLanguageData(function(language_ob) {
			language_data = language_ob;
			getCode(query.id,writeCodeLines,handleAjaxError);
		},handleAjaxError);
	});
	
	return CodeReview;
})( CodeReview || {});
