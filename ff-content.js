// content.js
/*chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
    	if( request.message === "clicked_browser_action" ) {
    		var firstHref = $("a[href^='http']").eq(0).attr("href");

    		console.log(firstHref);
		}
	}
);*/

/*
	content_wrapper_inner -> id for div just outside of story list
	z-list zhover zpointer -> class for story divs
	z-list zhover zpointer z-list_hover -> class when story image is hovered over
	story images do not follow a predictable pattern (they are lazt loaded so the url is not generated until later -> investigate this later)
	z-indent z-padtop -> class for div with story description
		z-padtop2 xgray -> class for div with story properties (rating, words, chapters etc.) -> child of descsription div
*/

function Story(div) {
	// Class to represent story
	// div is html element for story -> used to construct Story object
	if (!div || div.children.length < 3) { return false; } // invalid element
	this.div = div;
	
	// title
	if (div.children[0].className !== 'stitle') { console.log("Couldn't find story title element"); return false; }
	this.title = div.children[0].textContent;
	
	//description
	if (div.children[div.children.length - 1].className !== 'z-indent z-padtop') { console.log("Couldn't find story description element"); return false; }
	var description_element = div.children[div.children.length - 1];
	
	// story info
	if (description_element.children.length === 0 || description_element.children[0].className !== 'z-padtop2 xgray') { console.log("Description element does not have story information!"); return false; }
	this.info_text = description_element.children[0].textContent;
	
	// actual description text
	if (description_element.childNodes[0].nodeType === Node.TEXT_NODE) {
		this.description = description_element.childNodes[0].nodeValue.trim();	//extract only story description
	} else {
		this.description = '';
		console.log("story description not found -> assuming empty description");
	}
	// Example info_text: 
	// 'Rated: T - French - Adventure/Drama - Chapters: 29 - Words: 144,912 - Reviews: 150 - Favs: 80 - Follows: 120 - Updated: Nov 4 - Published: Dec 25, 2015 - Harry P., Ron W., Hermione G., Daphne G. - Complete'
	// Minimum text seems to be:
	// Rated: K - French - Chapters: 1 - Words: 365 - Published: 1h ago
	var min_detail_results = Story.regex.min_details.exec(this.info_text);

	this.rating = min_detail_results[1].trim();
	this.language = min_detail_results[2].trim();
	this.chapters = parseInt(min_detail_results[3].trim().replace(',', ''), 10);
	this.words = parseInt(min_detail_results[4].trim().replace(',', ''), 10);
	
	// publish dates and upload dates have data-xutime set -> this is unix epoch. Convert to date obj by * 1000 and creating date
	var date_elements = description_element.children[0].getElementsByTagName('span');
	var dates = [];
	var date;
	for (var i = date_elements.length - 1; i >= 0; i--) {
		date = new Date(date_elements[i].dataset.xutime * 1000); // convert unix epoch into epoch, then convert it into date
		dates.push(date);
	}
	this.publish_date = dates[0];
	this.update_date = dates.length > 1 ? dates[1] : dates[0];
	
	// reviews
	var regex_result = Story.regex.reviews.exec(this.info_text);
	if (regex_result) { this.reviews = parseInt(regex_result[1].trim().replace(',', ''), 10); } else { this.reviews = 0; }
	// favs
	regex_result = Story.regex.favourites.exec(this.info_text);
	if (regex_result) { this.favourites = parseInt(regex_result[1].trim().replace(',', ''), 10); } else { this.favourites = 0; }
	// follows
	regex_result = Story.regex.follows.exec(this.info_text);
	if (regex_result) { this.follows = parseInt(regex_result[1].trim().replace(',', ''), 10); } else { this.follows = 0; }
	// complete
	regex_result = Story.regex.complete.exec(this.info_text);
	this.complete = (regex_result != null);
	// genres
	regex_result = Story.regex.genres.exec(this.info_text);
	if (regex_result) { this.genres = regex_result[1].trim(); } else { this.genres = ''; }

	// characters
	regex_result = Story.regex.all_characters.exec(this.info_text);
	// charcaters text is kept so that it can be used to process pairings
	this.all_characters = [];
	this.pairings = [];
	if (regex_result) { this.characters_text = regex_result[1].trim(); } else { return; }

	this.all_characters = this.characters_text.replace('[','').replace(']','').split(',');
	for (var i = this.all_characters.length - 1; i >= 0; i--) { this.all_characters[i] = this.all_characters[i].trim();	}
	// process pairings
	regex_result = Story.regex.pairings.exec(this.characters_text);
	if (regex_result) {
		var pairs = [];
		for (var i = regex_result.length - 1; i >= 1; i--) {
			pairs = regex_result[1].split(',');
			for (var j = 0; j < pairs.length; j++) { pairs[j] = pairs[j].trim(); }
			this.pairings.push(pairs);
		}
	}
}

Story.regex = {
	min_details: /Rated: (.{1,2}) - (\w+) -.+Chapters: (\d+) - Words: ([0-9,]+)/,
	reviews: /Reviews: (\d+)/,
	favourites: /Favs: (\d+)/,
	follows: /Follows: (\d+)/,
	complete: /- Complete$/,
	genres: /Rated: .{1,2} - \w+ - ([a-zA-Z\/]+) - Chapters:/,
	all_characters: /Published:[a-zA-Z,0-9\ ]+ - (?!Complete)([a-zA-Z0-9,\.,\[\]\-\s]+)/,
	pairings: /\[(.+?)\]/
};

Story.prototype.show = function() {	this.div.style.display = 'block'; };
Story.prototype.hide = function() {	this.div.style.display = 'none'; };

function Tag(text, case_sensitive, include_tag) {
	// Class to represent a Tag to include / exclude from list of stories
	// case_sensitive and include_tag should be booleans
	// text should be the string to check
	this.case_sensitive = case_sensitive;
	this.text = text;
	this.text_regex = this.case_sensitive ? new RegExp(text) : new RegExp(text, "i");
	this.include = include_tag;
	this.pairings_regex_test = /(\w{1,})\/(\w{1,})/;
	this.pairings_exp = [];
	this.pairing_name1 = ''; this.pairing_name2 = '';
	this.isPairing = this.pairings_regex_test.exec(this.text);
	if (this.isPairing) {
		this._expand_pairings();
	}
}

Tag.prototype._expand_pairings = function() {
	if (this.pairings_exp.length !== 0) { return; }
	var regex_result = this.pairings_regex_test.exec(this.text);
	if (regex_result !== null) {
		var name1 = regex_result[1];
		var name2 = regex_result[2];
		var names = [];
		names.push(name1 + name2); //barfoo
		names.push(name1 + "/" + name2); //bar/foo
		names.push(name1 + "x" + name2); //barxfoo
		names.push(name1 + "X" + name2); //barXfoo
		names.push(name1 + "-" + name2); //barfoo
		// names.push(name1 + " " + name2); //bar foo
		names.push(name1 + "!" + name2); //bar!foo
		for (var i = 0; i < names.length; i++) {
			if (this.case_sensitive) {
				this.pairings_exp.push(new RegExp(names[i]));
			} else {
				this.pairings_exp.push(new RegExp(names[i], "i"));
			}
			
		}
		this.pairing_name1 = this.case_sensitive ? new RegExp(name1) : new RegExp(name1, "i");
		this.pairing_name2 = this.case_sensitive ? new RegExp(name2) : new RegExp(name2, "i");
	} 
};

Tag.prototype.match = function(story) {
	// returns true if this Tag matches the story_text
	// E.g. if story_text = "tags to match" and this.text = "tag", result is true
	// If this.include = false, then the result is false
	var story_text = story.description, story_pairings = story.pairings;
	var result = false;
	if (this.isPairing) {
		for (var i = this.pairings_exp.length - 1; i >= 0; i--) {
			result = story_text.search(this.pairings_exp[i]) !== -1;
			if (result) { break; }
		}
		if (!result) {
			for (var i = story_pairings.length - 1; i >= 0; i--) {
				for (var j = story_pairings[j].length - 1; j >= 0; j--) {
					result = story_pairings[i][j].search(this.pairing_name1) !== -1 || story_pairings[i][j].search(this.pairing_name2) !== -1;
					if (result) { break; }
				}
			}
		}
	} else {
		result = story_text.search(this.text_regex) !== -1;
	}
	return result ? this.include : !this.include;
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
	}
}

function Criteria(type, operator, value) {
	// Type MUST be equal to one of the properites of CRIT_TYPE or RATIO_TYPE. i.e. type === CRIT_TYPE.words
	// operator should be the operator enclosed in a string. i.e. '>', '<', '='
	// value must be valid for the type chosen
	this.type = type;
	var test = new RATIO_TYPE(this.type);
	if (test.num) {
		this.type = new RATIO_TYPE(this.type);
	}
	this.operator = operator;
	this.value = value;
	if (this.type ==- CRIT_TYPE.publish_date || this.type === CRIT_TYPE.update_date) {
		this.value = getDateFromCriteriaValue(value);
	}
}

Criteria.prototype.match = function(story) {
	var getValue = function(story, type) {
		switch (type) {
			case CRIT_TYPE.words:
				return story.words;
			case CRIT_TYPE.chapters:
				return story.chapters;
			case CRIT_TYPE.reviews:
				return story.reviews; 
			case CRIT_TYPE.follows: 
				return story.follows;
			case CRIT_TYPE.favourites:
				return story.favourites;
			case CRIT_TYPE.publish_date: 
				return story.publish_date;
			case CRIT_TYPE.update_date:
				return story.update_date;
			default:
				return null;
		}
	};

	var compare = function(story_val, operator, my_val) {
		if (!story_val) { return false; }
		switch (operator) {
			case '<':
				return story_val < my_val;
			case '=':
				return story_val == my_val;
			case '>':
				return story_val > my_val;
			default:
				return false;
		}
	};

	switch (this.type) {
		case CRIT_TYPE.words:
		case CRIT_TYPE.chapters:
		case CRIT_TYPE.reviews: 
		case CRIT_TYPE.follows: 
		case CRIT_TYPE.favourites:
		case CRIT_TYPE.publish_date: 
		case CRIT_TYPE.update_date:
			return compare(getValue(story, this.type), this.operator, this.value);
			break;
		default:
			return compare(getValue(story, this.type.num) / getValue(story, this.type.denom), this.operator, this.value);
	}
	return false;
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
			return new Date(year, month - 1, day, 0, 0, 0, 0); // month -1 because accepted range is 0 - 11
		} else {
			return false;
		}
	}
	return false;
}

debugger;
// document.addEventListener('DOMContentLoaded', () => {
	
// });
var story_holder = document.getElementById("content_wrapper_inner");
if (story_holder === null) { console.log("NO STORIES HOLDER"); }
var story_div = null;
var story = null;
var stories = [];
for (var i = 0; i < story_holder.childNodes.length; i++) {
	if (story_holder.childNodes[i].className === 'z-list zhover zpointer ') {
		story_div = story_holder.childNodes[i];
		story = new Story(story_div);
		stories.push(story);
	}
}

// var tags = [new Tag("slash", false, false), new Tag("Harry", true, true), new Tag("Harry/Hermione", false, false), new Tag("Harry/Ginny", true, false)];
// var criterias = [new Criteria("words", ">", 13510), new Criteria("words", "<", 99510), new Criteria("chapters", ">", 10), new Criteria("words/chapters", ">", 1000)];
var tags = [];
var criterias = [];
var matched_stories = [];

var no_matches_element = document.createElement("p");
no_matches_element.textContent = "No matches were found for the selected filters on this page. Either continue checking the next page until there are stories that match your filter settings, or remove (or loosen) your some of your filters."

function filter_stories() {
	var matched = true;
	var num_hidden = 0;
	for (var i = 0; i < stories.length; i++) {
		matched = true;
		for (var j = 0; j < criterias.length; j++) {
			if (!criterias[j].match(stories[i])) { matched = false; break; }
		}
		if (!matched) { 
			stories[i].hide();
			num_hidden++;
			continue;
		}
		for (var j = 0; j < tags.length; j++) {
			if (!tags[j].match(stories[i])) { matched = false; break; }
		}
		if (matched) {
			stories[i].show();
			matched_stories.push(stories[i]); 
		} else {
			stories[i].hide();
			num_hidden++;
		}
	}
	if (num_hidden == stories.length) {
		// show message to user suggesting they loosen their filter settings, or go to next page.
		story_holder.appendChild(no_matches_element);
	}
}

function resetStories() {
	if (matched_stories.length != stories.length) {
		for (var i = stories.length - 1; i >= 0; i--) {
			stories[i].show();
		}
		story_holder.removeChild(no_matches_element);
	}
}


chrome.runtime.sendMessage({message: "get_filters"});

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request.message == "filters") {
			if (request.tags) {
				tags = [];
				for (var i = 0; i < request.tags.length; i++) {
					tags.push(new Tag(request.tags[i].text, request.tags[i].case_sensitive, request.tags[i].include));
				}
			}
			if (request.criterias) {
				criterias = [];
				for (var i = 0; i < request.criterias.length; i++) {
					criterias.push(new Criteria(request.criterias[i].type, request.criterias[i].operator, request.criterias[i].value));
				}
			}
			filter_stories();
		} else if (request.message == "disabled") {
			resetStories();
		}
	}
);