# ff enhancer
FF Enhancer is a Google Chrome extension for enhancing the filtering options for www.fanfiction.net. 
It allows you to specifiy more specific filters and filter by tags to include/exclude.  
  It is designed to be customizable based on the user's needs, but as this is a work in progress, features may be added or removed.  

### Features:
- Better filtering based on Story properties:
  - Filter based on words, chapters, reviews, favourites, follows, publish date and update date
    For example you can filter to show only stories that have 20000 to 50000 words and more than 10 chapters and published between Apr 30 2010 and Sep 4 2017.
- Filter by tags:
  - Remove stories that contain certain words in the story description. For example you can remove all stories with "ham" in its description.
  - Show only stories that have certain words in the description. E.g. show only stories with "pizza" in the description.
  - A mixture of the above!
  - You can also filter in/out various relationship names (specified by "Char1/Char2") - more info about this to be added later.
- Import/export filter settings:
  - You can export your criteria and filter settings and save it to a file. You can then import this file later - this allows you to create "profiles" of various criteria and tags (perhaps have one settings file for Harry Potter fanfics and one for Percy Jackson fanfics)

### Planned features / improvements / TODOs:
The following is a list of planned features and improvements for the extension. I will be working on them as time permits.
Priorities: H (high), M (medium), L (low/nice to have)
- Add help/use text for filtering by character relationships - **L**
- Change tag filtering to search for tags in story titles - **L**
- Add option to do fuzzy negative tag exclusions: - **M**
  - E.g. filter our stories that have slash in the description, but don't filter out things that say no slash, not slash
  - Or, include stuff that has "pizza" in the description, but don't inlcude things that have "no pizza"
- Auto-fetch next page until at least one story matching the filters is found - **M**
- Investigate behaviour of extension on story list when browsing an author's profile page -> add option to enable/disable filtering on author profile pages. **M**
- Import/export settings directly from/to a file. - **L**


### Use instructions:
You will need to install the extension in Chrome developer mode as it is not yet published on the Chrome store.
1. Download the repository code as zip file. 
2. Unzip the downloaded file.
3. Open Chrome, click the three vertical dots in the top right, go to More Tools -> Extensions.
4. On the Extensions page, click the checkbox for Developer mode.
5. Refresh the page using F5, and click Load unpacked extension...
6. Browse to the unzipped folder and select it.
7. Extension should now be loaded -> go to FF.net and start using it.
8. To use the extension, click the extension icon, enter criteria and/or tags, specify options and ensure that the "Enabled" checkbox is set.
9. After specifying tags, start browsing stories -> the extension will apply your filters. If you see an empty story list, then there were no matches on the current page based on your settings -> try checking the next page.

