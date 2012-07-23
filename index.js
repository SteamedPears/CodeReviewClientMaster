/******************************************************************************
* index.js                                                                    *
* Copyright 2012                                                              *
* For details about the copyright holders, see the COPYRIGHT file.            *
* This software is freely distributed under the ISC License.                  *
* For details about the license, see the LICENSE file.                        *
******************************************************************************/
(function() {
	var language_data = null,
	codeMirror = null;

	function logError(errorText) {
		console.log(errorText);
	}
	function reportError(errorText) {
		$('#error').text(errorText).show();
	}

	function getLanguageData(success_fn,error_fn) {
		$.ajax('languages.json',{
			dataType: 'json',
			error:	error_fn,
			success:  success_fn
		});
	}

	function resolveRequirements(languages,language,requirements,req_list){
		logError(language);
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

	function buildLanguageSelect(jqo, data) {
		var languages = data.languages;
		if(languages === undefined) {
			reportError("Couldn't load languages.");
			return;
		}
		for(var index in languages) {
			var language = languages[index];
			var option = $('<option>');
			option.data('lang',language.mode);
			option.val(language.id);
			option.text(language.description);
			jqo.append(option);
		}
	}

	function startCodeMirror(mode) {
		var language = language_data.data[mode];
		var options = {
			lineNumbers: true,
			lineWrapping: true,
			fixedGutter: true,
			mode: language.mode
		};
		for(var index in language.options) {
			options[index] = language.options[index];
		}
		codeMirror = CodeMirror.fromTextArea(document.getElementById("code"),
											 options);
	}

	function stopCodeMirror() {
		if(codeMirror === null) {
			logError('tried to stop null code mirror instance');
			return;
		}
		codeMirror.save();
		codeMirror.toTextArea();
	}

	function highlightLanguage(language) {
		var req_ob = {};
		var requirements = [];
		resolveRequirements(language_data.data,
							language,
							req_ob,
							requirements);
		if(req_ob[language] === undefined)
			requirements.push(language);
		for(var index in requirements) {
			var lang = requirements[index];
			var file = language_data.data[lang].file;
			if(file !== undefined) {
				include(language_data.include_path+file);
			}
		}

		stopCodeMirror();
		startCodeMirror(language);
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

		// load language data
		$.get('/do/languages',function(data) {
			buildLanguageSelect($('#language_id'),data);
		});
		
		$('#encryption').click(function(){
			var encrypt = $(this);
			if(encrypt.is(':checked')){
				$('#encryptDiv').slideDown();
			}else{
				$('#encryptDiv').slideUp();
			}
		});
		
		$('#encryptDiv').hide();

		// language data
		getLanguageData(function(language_ob) {
			language_data = language_ob;

			// initialize code mirror
			startCodeMirror('none');

			// initialize syntax highlighting
			var select = $('#language_id');
			select.change(function(eventObject) {
				var selected_lang_id = select.val();
				highlightLanguage(select
								  .children('[value='+selected_lang_id+']')
								  .data('lang'));
			});
		});
	});
})();
