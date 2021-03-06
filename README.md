# FF Enhancer
FF Enhancer is a Google Chrome extension for enhancing the filtering options on www.fanfiction.net. 
It allows you to define filters used to include/exclude stories based on story properties (word count, chapter count, etc.) and tags in the story descriptions.

### Features:
- Advanced filtering of stories based on its properties (Criteria):
  - Filter based on words, chapters, reviews, favourites, follows, publish date and update date
    For example you can filter to show only stories that have **between 20000 to 50000 words** and more than 10 chapters and published **between Apr 30 2010 and Sep 4 2017**. (**You can't do this with the existing filter options on fanfiction.net!**)
- Filter by words in the story description (Tags):
  - Remove stories that contain **certain words in the story description**. For example you can remove all stories with "ham" in its description.
  - Show only stories that have certain words in the description. E.g. show only stories with "pizza" in the description.
  - A mixture of the above!
  - You can also filter in/out various relationship names (specified by "Char1/Char2") - more info about this will be added later.
- Import/export filter settings:
  - You can export your criteria and filter settings and save it to a file. You can then import this file later - this allows you to create "profiles" of various criteria and tags (perhaps have one settings file for Harry Potter fanfics and one for Percy Jackson fanfics)

### Planned features / Improvements / TODOs:
The following is a list of planned features and improvements for the extension. I will be working on them as time permits.
Priorities: H (high), M (medium), L (low/nice to have)
- Add help and use text for filtering by character relationships - **L**
- Modify tag filtering code to search for tags in story titles as well as descriptions - **L**
- Add option to do "fuzzy search" for tag exclusions: - **M**
  - E.g. filter out stories that have "slash" in the description, but keep stories that say "no slash" or "not slash" in the description
  - Or, include stuff that has "pizza" in the description, but don't inlcude stories that have "no pizza"
- Auto-fetch next page until at least one story matching the filters is found - **M**
- By default, the extension runs only on the main story lists. Need to add support for filtering profile page story lists and community story lists. - **M**
- Import/export settings directly from/to a file. - **L**


### Use instructions:
Note, this extension is not yet released - as such it should be treated as **beta** release software.
Until it is published on the Chrome store, you will need to install the extension in Chrome developer mode as follows: 
1. Download the repository code as zip file. 
2. Unzip the downloaded file.
3. Open Chrome, select the three vertical dots in the top right, go to More Tools -> Extensions.
4. On the Extensions page, ensure the checkbox for Developer mode is checked.
5. Refresh the page using F5, and select Load unpacked extension...
6. Browse to the unzipped folder and select it.
7. Extension should now be loaded -> go to www.fanfiction.net and start using it.
8. To use the extension, select the extension icon, enter criteria and/or tags, specify options and ensure that the "Enabled" checkbox is set. (Read the help text for each section for more information on entering criteria and tags)
9. After specifying desired options, start browsing stories -> the extension will apply your filters. If you see an empty story list, then there were no matches on the current page based on your settings -> try checking the next page.

You will need to refresh the story list page after making changes to your filter settings.

### Feedback:
Add your feedback, feature requests, and/or bugs by creating an issue if it does not already exist. Please ensure to provide relevant details so that I can reproduce the issue / understand your feature request.

#### Code quality disclaimer:
This is my first Chrome extension project and my first time doing any significant work with JavaScript. As a result, there may be issues with the code, for example, not following JS/Chrome extension code conventions. Feel free to open an issue to tell me about any best practices or implemenation issues - I appreciate the chance to learn more and I'll be sure to look into it/fix it as soon as I can!

