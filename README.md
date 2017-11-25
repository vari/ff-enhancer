# ff-enhancer
FF-Enhancer (ALPHA) is a chrome extension for extending the filtering options for FF.net. 
It allows you to specifiy more specific filters and filter by tags to include/exclude.  
  It is designed to be customizable based on the user's needs, but as this is a work in progress, so features may be added or removed.  

### Features:
- Better filtering based on Story properties:
  - Filter based on words, chapters, reviews, favourites, follows, publish date and update date
    For example you can filter to show only stories that have 20000 to 50000 words and more than 10 chapters and published between Apr 30 2010 and Sep 4 2017.
- Filter by tags:
  - Remove stories that contain certain words in the story description. For example you can remove all stories with "ham" in its description.
  - Show only stories that have certain words in the description. E.g. show only stories with "pizza" in the description.
  - A mixture of the above!
  - You can also filter in/out various ship names (specified by "Char1/Char2") - more info about this to be added later.
- Import/export filter settings:
  - You can export your criteria and filter settings and save it to a file. You can then import this file later - this allows you to create "profiles" of various criteria and tags (perhaps have one settings file for Harry Potter fanfics and one for Percy Jackson fanfics)

### Planned features / improvements / TODOs:
Below items have priorities assigned to them: H (high), M (medium), L (nice to have, but not urgent)
- Add help/use text for the ship names - **L**
- Change tag filtering to serch for tags in story titles and character names - **L**
- Add option to do fuzzy negative tag exclusions: - **M**
  - E.g. filter our stories that have slash in the description, but don't filter out things that say no slash, not slash
  - Or, include stuff that has "pizza" in the description, but don't inlcude things that have "no pizza"
- Auto-fetch next page until at least one story matching the filters is found - **H**
- Investigate behaviour of extension on story list when browsing an author's profile -> add option to enable/disable filtering on the author's profile. **M**
- Import/export settings from/to a file. -> not sure if this is really needed or will be worth the development headache. - **L**


### Testing instructions:
1. Download the repository code as zip file. 
2. Unzip the downloaded file.
3. Open Chrome, click the three vertical dots, go to More Tools -> Extensions.
4. On the Extensions page, click the checkbox for Developer mode.
5. Refresh the page using F5, and click Load unpacked extension...
6. Browse to the unzipped folder and select it.
7. Extension should now be loaded -> go to FF.net and start using it. (Extension has a icon which says Hello - Icon will be updated later)
8. To use the extension, click the extension icon, enter criteria and/or tags, specify options and ensure that the "Enabled" checkbox is set.
9. After specifying tags, start browsing stories -> the extension will apply your filters. If you see an empty story list, then there were no matches based on your settings -> try checking the next page.

