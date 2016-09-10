/*
  Parses gravitytales.com
*/
"use strict";

parserFactory.register("gravitytales.com", function() { return new GravityTalesParser() });

class GravityTalesParser extends Parser {
    constructor() {
        super();
    }

    getChapterUrls(dom) {
        let that = this;
        let content = that.findContent(dom);
        let chapters = util.hyperlinksToChapterList(content, that.isChapterHref);
        return Promise.resolve(chapters);
    }

    isChapterHref(link) {
        return (link.hostname === "gravitytales.com") &&
            (link.search === "");
    }

    extractTitle(dom) {
        return util.getElement(dom, "meta", e => (e.getAttribute("property") === "og:title")).getAttribute("content");
    }

    // find the node(s) holding the story content
    findContent(dom) {
        return util.getElement(dom, "div", e => e.className.startsWith("entry-content"));
    }

    removeUnwantedElementsFromContentElement(element) {
        let that = this;
        super.removeUnwantedElementsFromContentElement(element);

        that.removeNextAndPreviousChapterHyperlinks(element);
        util.removeUnwantedWordpressElements(element);
        util.removeLeadingWhiteSpace(element);
    }

    findParentNodeOfChapterLinkToRemoveAt(link) {
        // "previous" chapter may be immediate child of <p> tag to remove
        // "next" chapter has a <strong> tag wrapping it, then the maybe a <p> tag
        let toRemove = util.moveIfParent(link, "strong");
        return util.moveIfParent(toRemove, "p");
    }

    populateUI(dom) {
        super.populateUI(dom);
        CoverImageUI.showCoverImageUrlInput(true);
    }
}