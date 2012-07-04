/******************************************************************************
* index.js                                                                    *
* Copyright 2012                                                              *
* For details about the copyright holders, see the COPYRIGHT file.            *
* This software is freely distributed under the ISC License.                  *
* For details about the license, see the LICENSE file.                        *
******************************************************************************/
(function() {
	function reportError(errorText) {
		$('#error').text(errorText).show();
	}

	function buildLanguageSelect(jqo, data) {
		var languages = data.languages;
		if(languages === undefined) {
			reportError("Couldn't load languages.");
			return;
		}
		for(var index in languages) {
			var language = languages[index];
			console.log('loading '+language.description+'...');
			var option = $('<option>');
			option.val(language.id);
			option.text(language.description);
			jqo.append(option);
		}
		return;
	}

/******************************************************************************
* Run when display ready                                                      *
******************************************************************************/

	$(document).ready(function() {
		$('#error').hide();
		// display error message, if any
		var query = URI(document.URL).query(true);
		if(query.error != undefined) {
			reportError(query.error);
		}
		console.log('Loading languages....');
		$.get('/do/languages',function(data) {
			buildLanguageSelect($('#language_id'),data);
		});
		CodeMirror.fromTextArea(document.getElementById("code"),{
			lineNumbers: true,
			lineWrapping: true,
			fixedGutter: true
		});
	});
})();