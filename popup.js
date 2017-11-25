/*jsl:option explicit*/

var bg = chrome.extension.getBackgroundPage();

// Base class for the HTML manager for filter tables
function FilterTableHTMLManager(table_id, header_values, header_id, row_prefix, add_btn_id, show_help_id, help_text_id) {
	this.table_holder = null;
	this.header = null;
	this.table_holder_id = table_id;
	this.table_header_id = header_id;
	this.header_values = header_values;
	this.row_id_prefix = row_prefix;
	this.row_class = "table_row";
	this.table_created = false;

	this.add_btn = document.getElementById(add_btn_id);
	if (this.add_btn === null) {
		console.error("add_btn with id: " + add_btn_id + " not found!");
	} else {
		var mngr = this;
		this.add_btn.addEventListener('click', function () { mngr.addRowBtnClick(); });
	}
	this.show_help_btn = document.getElementById(show_help_id);
	if (this.show_help_btn === null) {
		console.error("show_help_btn with id: " + show_help_id + " not found!");
	} else {
		this.show_help_btn.addEventListener('click', function () { 
			var text = document.getElementById(help_text_id);
			if (text) {
				if (text.style.display === 'block') {
					this.className = "show_btn";
					text.style.display = 'none';
					this.textContent = "Show help";
				} else {
					this.className = "hide_btn";
					text.style.display = 'block';
					this.textContent = 'Hide help';
				}
			}
		});
	}

	this.remove_row_btn_template = document.createElement("div");
	this.remove_row_btn_template.textContent = "x";
	this.remove_row_btn_template.className = "btn";

}

FilterTableHTMLManager.prototype.generateTable = function() {
	if (this.table_holder === null) {
		this.table_holder = document.getElementById(this.table_holder_id);
	}
	if (this.table_created) { return; }

	this.header = document.createElement("div");
	this.header.id = this.table_header_id;
	this.header.className = this.row_class;
	var header_div;
	for (var i = 0; i < this.header_values.length; i++) {
		header_div = document.createElement("div");
		header_div.innerHTML = this.header_values[i];
		this.header.appendChild(header_div);
	}

	this.table_holder.appendChild(this.header);
	this.updateTable();
	this.table_created = true;
};
FilterTableHTMLManager.prototype.getData = function() { console.error("SUBCLASS MUST OVERRIDE getData METHOD!"); };
FilterTableHTMLManager.prototype.updateTable = function() {
	var table_row;
	var row_id;
	// id is row_id_prefix + i
	for (var i = 0; i < this.getData().length; i++) {
		row_id = this.row_id_prefix + i;
		table_row = document.getElementById(row_id);
		if (table_row === null) {
			table_row = this.createDivForRow(this.getData()[i], row_id);
			this.table_holder.children[i].insertAdjacentElement('afterend', table_row);
		} else {
			this.updateDivForRow(this.getData()[i], table_row);
		}
	}
	var diff = this.table_holder.children.length - 1 - this.getData().length;
	if (diff) {
		// the table has extra entries which need to be removed
		for (var i = this.table_holder.children.length - 1; i > this.getData().length; i--) {
			this.table_holder.children[i].parentNode.removeChild(this.table_holder.children[i]);
		}
	}
};

FilterTableHTMLManager.prototype.createDivForRow = function(data_obj, row_id) {	console.error("SUBCLASS MUST OVERRIDE createDivForRow METHOD!"); };
FilterTableHTMLManager.prototype.updateDivForRow = function(data_obj, row_div) { console.error("SUBCLASS MUST OVERRIDE updateDivForRow METHOD!"); };

FilterTableHTMLManager.prototype.addRemoveRowBtn = function (element) {
	// element is the element to which removerowbtn should be appended to
	var remove_row_btn = this.remove_row_btn_template.cloneNode(true);
	var mngr = this; //can't use this since that refers to the HTML element
	remove_row_btn.addEventListener('click', function () { mngr.removeRowBtnClick(element, mngr); }, {once: true});
	element.appendChild(remove_row_btn);
};

FilterTableHTMLManager.prototype.removeRowBtnClick = function(row, mngr) {
	var row_id = row.id;
	if (row === null) {
		console.error("Could not get row element to remove!");
		return;
	}
	var index = parseInt(row_id.slice(mngr.row_id_prefix.length) , 10);
	mngr.getData().splice(index, 1); //remove element from the array
	row.parentNode.removeChild(row);
	// update id nums for remaining rows
	curr_id = /(\d+)/.exec(row_id);
	if (!curr_id) { return; }
	curr_id = parseInt(curr_id[1].trim(), 10);
	for (var i = curr_id; i + 1 < mngr.table_holder.children.length; i++) {
		mngr.table_holder.children[i + 1].id = mngr.row_id_prefix + i; // i + 1 needed since header is the first row
	}
};

FilterTableHTMLManager.prototype.createNewDataElement = function() { console.error("SUBCLASS MUST OVERRIDE createNewDataElement METHOD!"); };

FilterTableHTMLManager.prototype.addRowBtnClick = function() {
	var data = this.createNewDataElement();
	var index = this.getData().length;
	var id = this.row_id_prefix + index;
	var row = this.createDivForRow(data, id);
	this.getData().push(data);	//This should update the original data array as well since we are not creating a copy.
	this.table_holder.children[index].insertAdjacentElement('afterend', row);
};



function CriteriaHTMLManager() {
	FilterTableHTMLManager.call(this, 
		"criteria_holder", //table id
		["Property", "Comparator", "Value", ""], //header values
		"criteria_holder_header", //header id
		"criteria_entry_", //row prefix
		"criteria_add_btn", //add btn id
		"criteria_show_help_btn", //show help btn id
		"criteria_help" //help text id
		);

	this.property_suffix = "_property";
	this.comparator_suffix = "_op";
	this.value_suffix = "_value";

	// Template divs for creation of criteria filter rows
	this.property_template = document.createElement("div");
	var property_text = document.createElement("input");
	property_text.type = "text";
	property_text.maxLength = 21;
	this.property_template.appendChild(property_text);
	
	this.comparator_template = document.createElement("div");
	var comparator_select = document.createElement("select");
	var comp_option;
	for (var i = 0; i < bg.operators.length; i++) {
		comp_option = document.createElement("option");
		comp_option.value = bg.operators[i];
		comp_option.innerHTML = bg.operators[i];
		comparator_select.appendChild(comp_option);
	}
	this.comparator_template.appendChild(comparator_select);

	this.value_template = document.createElement("div");
	var value_text = document.createElement("input");
	value_text.type = "text";
	value_text.maxLength = 15;
	this.value_template.appendChild(value_text);
}

// Needed for proper subclassing
CriteriaHTMLManager.prototype = Object.create(FilterTableHTMLManager.prototype);
CriteriaHTMLManager.prototype.constructor = CriteriaHTMLManager;

CriteriaHTMLManager.prototype.getData = function() { return bg.criteria; };
CriteriaHTMLManager.prototype.createDivForRow = function(crit, row_id) {
	var row = document.createElement("div");
	row.id = row_id;
	row.className = this.row_class;
	
	var property = this.property_template.cloneNode(true);
	property.children[0].id = row_id + this.property_suffix;
	property.children[0].value = crit.type;
	row.appendChild(property);

	var comparator = this.comparator_template.cloneNode(true);
	comparator.children[0].id = row_id + this.comparator_suffix;
	comparator.children[0].value = crit.operator;
	row.appendChild(comparator);

	var value = this.value_template.cloneNode(true);
	value.children[0].id = row_id + this.value_suffix;
	value.children[0].value = crit.value;
	row.appendChild(value);

	this.addRemoveRowBtn(row);

	// setup event listeners
	// update vars to point to input element rather than outer div
	property = property.children[0];
	comparator = comparator.children[0];
	value = value.children[0];
	var inputChangeListener = function (text_changed) {
		crit.operator = comparator.value;
		if (text_changed !== true) { return; }
		crit.type = property.value.toLowerCase();
		crit.value = value.value.toLowerCase();
		if (!crit.validateType()) {
			property.style.backgroundColor = 'Tomato';
		} else {
			property.style.backgroundColor = 'White';
		}
		if (!crit.validateValue()) {
			value.style.backgroundColor = 'Tomato';
		} else {
			value.style.backgroundColor = 'White';
		}
	};
	property.addEventListener('input', function() { inputChangeListener(true); });
	comparator.addEventListener('change', inputChangeListener);
	value.addEventListener('input', function() { inputChangeListener(true); });
	return row;
};

CriteriaHTMLManager.prototype.updateDivForRow = function(crit, row_div) {
	if (row_div === null || row_div.children.length !== 4) {
		console.error("Expected row_div to exist and have 4 children.");
		console.error("\t row_div is: " + row_div);
		return;
	}
	var property = row_div.children[0];
	property.children[0].value = crit.type;
	var comparator = row_div.children[1];
	comparator.children[0].value = crit.operator;
	var value = row_div.children[2];
	value.children[0].value = crit.value;
};

CriteriaHTMLManager.prototype.createNewDataElement = function() { return bg.createEmptyCriteriaData(); };

var criteria_manager = null;

function TagsHTMLManager() {
	FilterTableHTMLManager.call(this, 
		"tags_holder", //table id
		["Tag", "Match case?", "Include?", ""], //header values
		"tags_holder_header", //header id
		"tags_entry_", //row prefix
		"tags_add_btn", //add btn id
		"tags_show_help_btn", //show help btn id
		"tags_help" //help text id
		);

	this.tag_suffix = "_tag";
	this.match_case_suffix = "_match_case";
	this.include_suffix = "_include";

	// Template divs for creation of tag filter rows
	this.tag_template = document.createElement("div");
	var tag_text = document.createElement("input");
	tag_text.type = "text";
	this.tag_template.appendChild(tag_text);

	this.match_case_template = document.createElement("div");
	var match_case_checkbox = document.createElement("input");
	match_case_checkbox.type = "checkbox";
	match_case_checkbox.checked = false;
	this.match_case_template.appendChild(match_case_checkbox);

	this.include_template = document.createElement("div");
	var include_checkbox = document.createElement("input");
	include_checkbox.type = "checkbox";
	include_checkbox.checked = false;
	this.include_template.appendChild(include_checkbox);
}

// Needed for proper subclassing
TagsHTMLManager.prototype = Object.create(FilterTableHTMLManager.prototype);
TagsHTMLManager.prototype.constructor = TagsHTMLManager;

TagsHTMLManager.prototype.getData = function() { return bg.tags; };
TagsHTMLManager.prototype.createDivForRow = function(tag_obj, row_id) {
	var row = document.createElement("div");
	row.id = row_id;
	row.className = this.row_class;
	
	var tag = this.tag_template.cloneNode(true);
	tag.children[0].id = row_id + this.tag_suffix;
	tag.children[0].value = tag_obj.text;
	row.appendChild(tag);

	var match_case = this.match_case_template.cloneNode(true);
	match_case.children[0].id = row_id + this.match_case_suffix;
	match_case.children[0].checked = tag_obj.case_sensitive;
	row.appendChild(match_case);

	var include = this.include_template.cloneNode(true);
	include.children[0].id = row_id + this.include_suffix;
	include.children[0].checked = tag_obj.include;
	row.appendChild(include);

	this.addRemoveRowBtn(row);

	// setup event listeners
	// update vars to point to input element rather than outer div
	tag = tag.children[0];
	match_case = match_case.children[0];
	include = include.children[0];
	var inputChangeListener = function (text_changed) {
		tag_obj.case_sensitive = match_case.checked;
		tag_obj.include = include.checked;
		if (text_changed !== true) { return; }
		tag_obj.text = tag.value;
		if (!tag_obj.validate()) {
			tag.style.backgroundColor = 'Tomato';
		} else {
			tag.style.backgroundColor = 'White';
		}
	};
	tag.addEventListener('input', function() { inputChangeListener(true); });
	match_case.addEventListener('change', inputChangeListener);
	include.addEventListener('change', inputChangeListener);
	return row;
};

TagsHTMLManager.prototype.updateDivForRow = function(tag_obj, row_div) {
	if (row_div === null || row_div.children.length !== 4) {
		console.error("Expected row_div to exist and have 4 children.");
		console.error("\t row_div is: " + row_div);
		return;
	}
	var tag = row_div.children[0];
	tag.children[0].value = tag_obj.text;
	var matchCase = row_div.children[1];
	matchCase.children[0].checked = tag_obj.case_sensitive;
	var include = row_div.children[2];
	include.children[0].checked = tag_obj.include;
};

TagsHTMLManager.prototype.createNewDataElement = function() { return bg.createEmptyTagData(); };

var tags_manager = null;



document.addEventListener('DOMContentLoaded', () => {
	criteria_manager = new CriteriaHTMLManager();
	tags_manager = new TagsHTMLManager();
	criteria_manager.generateTable();
	tags_manager.generateTable();
	var enabled_chkbox = document.getElementById("config_enable_box");
	enabled_chkbox.addEventListener('change', function() {
		bg.config.enabled = this.checked;
	});
	enabled_chkbox.checked = bg.config.enabled;
	setupImportExport()

});

function setupImportExport() {
	// export filters
	export_btn_id = "export_filters_btn"
	export_filters_btn = document.getElementById(export_btn_id);
	if (export_filters_btn === null) {
		console.error("export_filters_btn with id: " + export_btn_id + " not found!");
	} else {
		export_filters_btn.addEventListener('click', function () { 
			var text = document.getElementById("filter_export_help");
			var export_text_div = document.getElementById("filter_export_text");
			if (text) {
				if (text.style.display === 'block') {
					this.className = "show_btn";
					text.style.display = 'none';
					this.textContent = "Export filters";
					export_text_div.style.display = 'none';
				} else {
					this.className = "hide_btn";
					text.style.display = 'block';
					export_text_div.style.display = 'block';
					this.textContent = 'Hide export filters text';
					var filters_text = JSON.stringify({"tags":bg.tags, "criteria":bg.criteria});
					export_text_div.textContent = filters_text;
				}
			}
		});
	}
	// import filters
	import_btn_id = "import_filters_btn"
	import_filters_btn = document.getElementById(import_btn_id);
	if (import_filters_btn === null) {
		console.error("import_filters_btn with id: " + import_btn_id + " not found!");
	} else {
		import_filters_btn.addEventListener('click', function () { 
			var text = document.getElementById("filter_import_text");
			if (text) {
				if (text.textLength > 0) {
					var _crits = [];
					var _tags = [];
					var json_data = JSON.parse(text.value);
					if (json_data.tags && json_data.tags.length) {
						for (var i = 0; i < json_data.tags.length; i++) {
							if (json_data.tags[i].hasOwnProperty('case_sensitive') && json_data.tags[i].hasOwnProperty('text') && json_data.tags[i].hasOwnProperty('include')) {
								_tags.push(json_data.tags[i]);
							}
						}	
					}
					if (json_data.criteria && json_data.criteria.length) {
						for (var i = 0; i < json_data.criteria.length; i++) {
							if (json_data.criteria[i].hasOwnProperty('type') && json_data.criteria[i].hasOwnProperty('operator') && json_data.criteria[i].hasOwnProperty('value')) {
								_crits.push(json_data.criteria[i]);
							}
						}	
					}
					bg.criteria = _crits;
					bg.tags = _tags;
					criteria_manager.updateTable();
					tags_manager.updateTable();
				}
			}
		});
	}

}

var port = chrome.runtime.connect({name: "__FF_ENHANCER_POPUP_"});

/*
Sample import text for testing filter import
{"tags":[{"case_sensitive":false,"text":"draco","include":false},{"case_sensitive":true,"text":"HHr","include":false},{"case_sensitive":false,"text":"harry","include":true}],"criteria":[{"type":"words","operator":">","value":"12500"},{"type":"chapters","operator":"<","value":"50"}]}
*/
