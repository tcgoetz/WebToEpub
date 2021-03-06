/*
  Parser for World Literature Publishing websites
*/

"use strict";

parserFactory.register("finestories.com", () => new WLPublishingParser());
parserFactory.register("scifistories.com", () => new WLPublishingParser());
parserFactory.register("storiesonline.net", () => new WLPublishingParser());

parserFactory.registerManualSelect(
    "Default",
    function() { return new WLPublishingParser() }
);

class WLPublishingParser extends Parser{
    constructor() {
        super();
    }

    getChapterUrls(dom) {
        let index = dom.querySelector("div#index-list");
        for(let link of index.querySelectorAll("a")) {
            if (link.hasAttribute("title") && (link.getAttribute("title") === "download")) {
                link.remove();
            }
        }
        return Promise.resolve(util.hyperlinksToChapterList(index));
    };

    findContent(dom) {
        return dom.querySelector("article");
    };

    extractTitleImpl(dom) {
        return dom.querySelector("h1");
    };

    extractAuthor(dom) {
        let title = dom.querySelector("title").textContent;
        if (title != null) {
            return title.substring(0, title.indexOf(":"));
        }
        return super.extractAuthor(dom);
    };

    removeUnwantedElementsFromContentElement(element) {
        util.removeChildElementsMatchingCss(element, "div.date");
        util.removeChildElementsMatchingCss(element, "span.conTag");
        util.removeChildElementsMatchingCss(element, "span.curr");
        util.removeChildElementsMatchingCss(element, "div.pager");
        util.removeChildElementsMatchingCss(element, "div.end-note");
        util.removeChildElementsMatchingCss(element, "div.vform");
        util.removeChildElementsMatchingCss(element, "div.sale-link");
        util.removeChildElementsMatchingCss(element, "div.reco");
        util.removeChildElementsMatchingCss(element, ".end");
        util.removeChildElementsMatchingCss(element, "h4.c");
        util.removeMicrosoftWordCrapElements(element);
        util.removeScriptableElements(element);
        util.removeComments(element);
        super.removeUnwantedElementsFromContentElement(element);
    }

    findChapterTitle(dom) {
        return dom.querySelector("h2");
    }

    fetchChapter(url) {
        let that = this;
        return HttpClient.wrapFetch(url).then(function (xhr) {
            let dom = xhr.responseXML;
            let extraURLs = WLPublishingParser.findURLsOfChapterPages(dom);
            extraURLs.forEach(function(url) {
                dom = that.fetchChapterPage(dom, url);
            })
            return Promise.resolve(dom);
        });
    }

    /*
      Chapters are composed of multiple pages.
      There are links to all of the pages in the chapter at the top and bottom of each page.
      Along with the link to each page of the chapter, there is a link to the next page, which is a duplicate.
      Single page chapters have no pager element.
    */
    static findURLsOfChapterPages(dom) {
        let urls = [];
        let pager = dom.querySelector("div.pager");
        if (pager) {
            for(let link of pager.querySelectorAll("a")) {
                if (link.textContent != "Next") {
                    urls.push(link.href);
                }
            }
        }
        return urls;
    }

    fetchChapterPage(chapterDom, url) {
        let that = this;
        let chapterContent = this.findContent(chapterDom);
        return HttpClient.wrapFetch(url).then(function (xhr) {
            let pageDom = xhr.responseXML;
            let pageContent = that.findContent(pageDom);
            while (pageContent.childNodes.length > 0) {
                let child = pageContent.childNodes[0];
                // The chapter title appears on each page in the chapter and we only want it from the first.
                if ((child.tagName == "H1") || (child.tagName == "H2")) {
                    child.remove()
                } else {
                    chapterContent.appendChild(child);
                }
            }
            return chapterDom;
        });
    }
}
