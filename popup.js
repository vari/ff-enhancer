/*jsl:option explicit*/

// // Copyright (c) 2014 The Chromium Authors. All rights reserved.
// // Use of this source code is governed by a BSD-style license that can be
// // found in the LICENSE file.

// /**
//  * Get the current URL.
//  *
//  * @param {function(string)} callback called when the URL of the current tab
//  *   is found.
//  */
// function getCurrentTabUrl(callback) {
//   // Query filter to be passed to chrome.tabs.query - see
//   // https://developer.chrome.com/extensions/tabs#method-query
//   var queryInfo = {
// 	active: true,
// 	currentWindow: true
//   };

//   chrome.tabs.query(queryInfo, (tabs) => {
// 	// chrome.tabs.query invokes the callback with a list of tabs that match the
// 	// query. When the popup is opened, there is certainly a window and at least
// 	// one tab, so we can safely assume that |tabs| is a non-empty array.
// 	// A window can only have one active tab at a time, so the array consists of
// 	// exactly one tab.
// 	var tab = tabs[0];

// 	// A tab is a plain object that provides information about the tab.
// 	// See https://developer.chrome.com/extensions/tabs#type-Tab
// 	var url = tab.url;

// 	// tab.url is only available if the "activeTab" permission is declared.
// 	// If you want to see the URL of other tabs (e.g. after removing active:true
// 	// from |queryInfo|), then the "tabs" permission is required to see their
// 	// "url" properties.
// 	console.assert(typeof url == 'string', 'tab.url should be a string');

// 	callback(url);
//   });

//   // Most methods of the Chrome extension APIs are asynchronous. This means that
//   // you CANNOT do something like this:
//   //
//   // var url;
//   // chrome.tabs.query(queryInfo, (tabs) => {
//   //   url = tabs[0].url;
//   // });
//   // alert(url); // Shows "undefined", because chrome.tabs.query is async.
// }

// /**
//  * Change the background color of the current page.
//  *
//  * @param {string} color The new background color.
//  */
// function changeBackgroundColor(color) {
//   var script = 'document.body.style.backgroundColor="' + color + '";';
//   // See https://developer.chrome.com/extensions/tabs#method-executeScript.
//   // chrome.tabs.executeScript allows us to programmatically inject JavaScript
//   // into a page. Since we omit the optional first argument "tabId", the script
//   // is inserted into the active tab of the current window, which serves as the
//   // default.
//   chrome.tabs.executeScript({
// 	code: script
//   });
// }

// /**
//  * Gets the saved background color for url.
//  *
//  * @param {string} url URL whose background color is to be retrieved.
//  * @param {function(string)} callback called with the saved background color for
//  *     the given url on success, or a falsy value if no color is retrieved.
//  */
// function getSavedBackgroundColor(url, callback) {
//   // See https://developer.chrome.com/apps/storage#type-StorageArea. We check
//   // for chrome.runtime.lastError to ensure correctness even when the API call
//   // fails.
//   chrome.storage.sync.get(url, (items) => {
// 	callback(chrome.runtime.lastError ? null : items[url]);
//   });
// }

// /**
//  * Sets the given background color for url.
//  *
//  * @param {string} url URL for which background color is to be saved.
//  * @param {string} color The background color to be saved.
//  */
// function saveBackgroundColor(url, color) {
//   var items = {};
//   items[url] = color;
//   // See https://developer.chrome.com/apps/storage#type-StorageArea. We omit the
//   // optional callback since we don't need to perform any action once the
//   // background color is saved.
//   chrome.storage.sync.set(items);
// }

// // This extension loads the saved background color for the current tab if one
// // exists. The user can select a new background color from the dropdown for the
// // current page, and it will be saved as part of the extension's isolated
// // storage. The chrome.storage API is used for this purpose. This is different
// // from the window.localStorage API, which is synchronous and stores data bound
// // to a document's origin. Also, using chrome.storage.sync instead of
// // chrome.storage.local allows the extension data to be synced across multiple
// // user devices.
// document.addEventListener('DOMContentLoaded', () => {
//   getCurrentTabUrl((url) => {
// 	var dropdown = document.getElementById('dropdown');

// 	// Load the saved background color for this page and modify the dropdown
// 	// value, if needed.
// 	getSavedBackgroundColor(url, (savedColor) => {
// 	  if (savedColor) {
// 		changeBackgroundColor(savedColor);
// 		dropdown.value = savedColor;
// 	  }
// 	});

// 	// Ensure the background color is changed and saved when the dropdown
// 	// selection changes.
// 	dropdown.addEventListener('change', () => {
// 	  changeBackgroundColor(dropdown.value);
// 	  saveBackgroundColor(url, dropdown.value);
// 	});
//   });
// });



var LOCAL_TEST = false;
var bg = null;
if (LOCAL_TEST) {
	// Classes for testing:
	function TagData(text, case_sensitive, include_tag) {
		// Class to represent a Tag to include / exclude from list of stories
		// case_insensitive and include_tag should be booleans
		// text should be the string to check
		// This is only used to organize the data
		this.case_sensitive = case_sensitive;
		this.text = text;
		this.include = include_tag;
	}

	function CriteriaData(type, operator, value) {
		// Type MUST be instantiable to one of the properites of CRIT_TYPE or RATIO_TYPE. i.e. type === CRIT_TYPE.words 
		this.type = type;
		this.operator = operator;
		this.value = value;
	}

	function FakeBg() {
		this.operators = ["<", "=", ">"];
		this.criteria = [];
		var fakeDataCriteria = ["words", "chapters", "reviews", "follows", "favourites", "publish_date", "update_date"];
		for (var i = 0; i < fakeDataCriteria.length; i++) {
			this.criteria.push(new CriteriaData(fakeDataCriteria[i], i % 2 === 0 ? ">" : "=", "20171103"));
		}
		
		this.tags = [];
		var fakeTags = ["words", "chapters", "reviews", "follows", "favourites", "publish_date", "update_date"];
		for (var i = 0; i < fakeTags.length; i++) {
			this.tags.push(new TagData(fakeTags[i], i % 2 === 0, i % 2 !== 0));
		}
	}
	
	FakeBg.prototype.createEmptyCriteriaData = function () {
		return new CriteriaData("", "<", "");
	};
	FakeBg.prototype.createEmptyTagData = function() {
		return new TagData("", false, false);
	};

	bg = new FakeBg();
} else {
	bg = chrome.extension.getBackgroundPage();
}

// Base class for the HTML manager for filter tables
function FilterTableHTMLManager(table_id, header_values, header_id, row_prefix, table_data_array, add_btn_id, show_help_id, help_text_id) {
	this.table_holder = null;
	this.header = null;
	this.table_holder_id = table_id;
	this.table_header_id = header_id;
	this.header_values = header_values;
	this.row_id_prefix = row_prefix;
	this.row_class = "table_row";
	this.table_data_array = table_data_array;
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
		console.error("show_help_btn with id: " + show_help_btn + " not found!");
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

FilterTableHTMLManager.prototype.updateTable = function() {
	var table_row;
	var row_id;
	// id is row_id_prefix + i
	for (var i = 0; i < this.table_data_array.length; i++) {
		row_id = this.row_id_prefix + i;
		table_row = document.getElementById(row_id);
		if (table_row === null) {
			table_row = this.createDivForRow(this.table_data_array[i], row_id);
			this.table_holder.children[i].insertAdjacentElement('afterend', table_row);
		} else {
			this.updateDivForRow(this.table_data_array[i], table_row);
		}
	}
};

FilterTableHTMLManager.prototype.createDivForRow = function(data_obj, row_id) {	console.error("SUBCLASS MUST OVERRIDE createDivForRow METHOD!"); };
FilterTableHTMLManager.prototype.updateDivForRow = function(data_obj, row_div) { console.error("SUBCLASS MUST OVERRIDE updateDivForRow METHOD!"); };

FilterTableHTMLManager.prototype.addRemoveRowBtn = function (element, row_id) {
	// element is the element to which removerowbtn should be appended to
	// row_id is row_id to pass to eventlistener
	var remove_row_btn = this.remove_row_btn_template.cloneNode(true);
	var mngr = this; //can't use this since that refers to the HTML element
	remove_row_btn.addEventListener('click', function () { mngr.removeRowBtnClick(row_id); }, {once: true});
	element.appendChild(remove_row_btn);
};

FilterTableHTMLManager.prototype.removeRowBtnClick = function(row_id) {
	var row = document.getElementById(row_id);
	if (row === null) {
		console.error("Could not get row element to remove!");
	}
	var index = parseInt(row_id.slice(this.row_id_prefix.length) , 10);
	this.table_data_array.splice(index, 1); //remove element from the array
	row.parentNode.removeChild(row);
};

FilterTableHTMLManager.prototype.createNewDataElement = function() { console.error("SUBCLASS MUST OVERRIDE createNewDataElement METHOD!"); };

FilterTableHTMLManager.prototype.addRowBtnClick = function() {
	var data = this.createNewDataElement();
	var index = this.table_data_array.length;
	var id = this.row_id_prefix + index;
	var row = this.createDivForRow(data, id);
	this.table_data_array.push(data);	//This should update the original data array as well since we are not creating a copy.
	this.table_holder.children[index].insertAdjacentElement('afterend', row);
};



function CriteriaHTMLManager() {
	FilterTableHTMLManager.call(this, 
		"criteria_holder", //table id
		["Property", "Comparator", "Value", ""], //header values
		"criteria_holder_header", //header id
		"criteria_entry_", //row prefix
		bg.criteria, //table data array
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

	this.addRemoveRowBtn(row, row_id);

	// setup event listeners
	// update vars to point to input element rather than outer div
	property = property.children[0];
	comparator = comparator.children[0];
	value = value.children[0];
	var inputChangeListener = function (text_changed) {
		crit.operator = comparator.value();
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
		bg.tags, //table data array
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

	this.addRemoveRowBtn(row, row_id);

	// setup event listeners
	// update vars to point to input element rather than outer div
	tag = tag.children[0];
	match_case = match_case.children[0];
	include = include.children[0];
	var inputChangeListener = function (text_changed) {
		tag_obj.case_sensitive = match_case.checked;
		tag_obj.include = include.checked;
		if (text_changed !== true) { return; }
		tag_obj.text = tag.value.toLowerCase();
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
	
});