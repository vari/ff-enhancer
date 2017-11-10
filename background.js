// Called when the user clicks on the browser action.
// chrome.browserAction.onClicked.addListener(function(tab) {
//     // Send a message to the active tab
//     chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
//         var activeTab = tabs[0];
//         chrome.tabs.sendMessage(activeTab.id, {"message": "clicked_browser_action"});
//     });
// });

// Author: Varun Gupta
// This file contains basic structures to hold filter settings and handles saving/retrieving of settings from storage.
// This file also contains methods for validating user input and interacting with the settings popup.
// Actual prcoessing based on data is in the ff-content.js file.

function TagData(text, case_sensitive, include_tag) {
	// Class to represent a Tag to include / exclude from list of stories
	// case_sensitive and include_tag should be booleans
	// text should be the string to check
	// This is only used to organize the data
	this.case_sensitive = case_sensitive;
	this.text = text;
	this.include = include_tag;
}

TagData.prototype.validate = function() {
	return this.text.length > 0 && (this.case_sensitive === true || this.case_sensitive === false) && (this.include === true || this.include === false);
};


var CRIT_TYPE = {
	words: "words", //int
	chapters: "chapters", //int
	reviews: "reviews", //int
	follows: "follows", //int
	favourites: "favourites", //int
	publish_date: "publish_date", //date
	update_date: "update_date" //date
};

function RATIO_TYPE(text) {
	this.num = null;
	this.denom = null;
	
	this.regex = /(\w{1,})\/(\w{1,})/;
	var results = this.regex.exec(text);
	if (results !== null) {
		this.num = results[1];
		this.denom = results[2];
	} else {
		 return false;
	}
}

var operators = ["<", "=", ">"];

function CriteriaData(type, operator, value) {
	// Type MUST be equal to one of the properites of CRIT_TYPE i.e. type === CRIT_TYPE.words, OR must be <type1>/<type2> i.e. CRIT_TYPE.words/CRIT_TYPE.chapters
	// operator should be the operator enclosed in a string. i.e. '>', '<', '='
	// value must be valid for the type chosen
	this.type = type;
	this.operator = operator;
	this.value = value;
}

CriteriaData.prototype.validateType = function(type, test_ratio) {
	var test_val = this.type;
	if (type) {
		test_val = type;
	}
	switch (test_val) {
		case CRIT_TYPE.words:
		case CRIT_TYPE.chapters:
		case CRIT_TYPE.reviews: 
		case CRIT_TYPE.follows: 
		case CRIT_TYPE.favourites: 
		case CRIT_TYPE.publish_date: 
		case CRIT_TYPE.update_date:
			return true;
			break;
		default:
			if (test_ratio === false) {
				// prevent recursive ratio check calls
				return false;
			}
			var ratio_test = new RATIO_TYPE(this.type);
			if (ratio_test instanceof RATIO_TYPE && this.validateType(ratio_test.num, false) && this.validateType(ratio_test.denom, false)) {
				return true;
			}
			return false;
	}
	return false;
};

CriteriaData.prototype.validateOperator = function() {
	var result = false;
	for (var i = operators.length - 1; i >= 0; i--) {
		result = result || this.op === operators[i];
	}
	return result;
};

CriteriaData.prototype.validateValue = function() {
	switch (this.type) {
		case CRIT_TYPE.words:
		case CRIT_TYPE.chapters:
		case CRIT_TYPE.reviews: 
		case CRIT_TYPE.follows: 
		case CRIT_TYPE.favourites:
			return !isNaN(this.value) && parseInt(Number(this.value)) == this.value && !isNaN(parseInt(this.value, 10));
			break;
		case CRIT_TYPE.publish_date:
		case CRIT_TYPE.update_date:
			return isDate(this.value);
			break;
		default:
			if (this.type instanceof RATIO_TYPE) {
				return !isNaN(this.value) && parseFloat(Number(this.value)) == this.value && !isNaN(parseFloat(this.value, 10));
			}
			return false;
	}
	return false;
};

CriteriaData.prototype.validate = function() {
	return this.validateType() && this.validateOperator() && this.validateValue();
};

function getDateFromCriteriaValue(value) {
	if (value.length === 0) { return false; }
	// determine if value is a date string
	// expect strings in YYYY/MM/DD format
	var date_regex = /([0-9]{4})\/([0-9]{2})\/([0-9]{2})/;
	var date = date_regex.exec(value);
	var daysInMonth = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
	if (date !== null) {
		var year = parseInt(date[1], 10);
		// leap year
		if (!isNaN(year) && (year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0))) { daysInMonth[2] = 29; }
		var month = parseInt(date[2], 10);
		var day = parseInt(date[3], 10);
		var today = new Date();
		var is_valid_date = !isNaN(year) && !isNaN(month) && !isNaN(day) &&
				year >= 1998 && year <= today.getFullYear() &&
				month >= 1 && month <= 12 &&
				day >= 1 && day <= daysInMonth[month];
		if (is_valid_date) {
			return {
				year: year,
				month: month,
				day: day
			};
		} else {
			return false;
		}
	}
	return false;
}

var isDate = function(value) {
	var date = getDateFromCriteriaValue(value);
	if (date === false) { return date; }
	return true;
};

function Config(enabled) {
	this.enabled = enabled;
}

// These arrays store tagdata from the UI. They are all validated before being sent to content script or saved in storage.
var tags = [];
var criteria = [];
var config = new Config(true);


function createEmptyCriteriaData() {
	return new CriteriaData("", "<", "");
}

function createEmptyTagData() {
	return new TagData("", false, false);
}

// Functions + variables relating to the storage and retrieval of data from chrome storage:
var CRITERIA_KEY = "__FF_ENHANCER_CRITERIA_KEY__", TAGS_KEY = "__FF_ENHANCER_TAGS_KEY__", CONFIG_KEY = "__FF_ENHANCER_CONFIG_KEY__";


function save_data() {
	var data_obj = {};
	data_obj[CRITERIA_KEY] = criteria;
	data_obj[TAGS_KEY] = tags;
	data_obj[CONFIG_KEY] = config;
	chrome.storage.sync.set();
}

chrome.storage.sync.get(CRITERIA_KEY, function(result) {
	if(Object.hasOwnProperty.call(result, CRITERIA_KEY)) {
		console.log('Criteria found from storage:');
		console.log(result[CRITERIA_KEY]);
		//_crits.loadCrits(result[CRITS]);
	}
	else {
		console.log('No criteria found in storage');
	}
});

chrome.storage.sync.get(TAGS_KEY, function(result) {
	if(Object.hasOwnProperty.call(result, TAGS_KEY)) {
		console.log('Tags found in storage:');
		console.log(result[TAGS_KEY]);
	}
	else {
		console.log('No tags found in storage');
	}
});

chrome.storage.sync.get(CONFIG_KEY, function(result) {
	if(Object.hasOwnProperty.call(result, CONFIG_KEY)) {
		console.log('Config from storage:');
		console.log(result[CONFIG_KEY]);
	}
});

