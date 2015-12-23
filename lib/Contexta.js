'use strict';

module.exports = Contexta;

var clone = require('./util/clone');


var CONTEXTA_LINK_CLASSNAME = 'contexta-link';

function Contexta(options) {
	var fullOptions = Object.keys(Contexta.defaults).reduce(function (defaults, s, key) {
		if (!s.hasOwnProperty(key)) {
			s[key] = defaults[key];
		}

		return s;
	}.bind(null, Contexta.defaults), clone(options));

	Contexta.assertOptionsIsValid(fullOptions);

	this.options = fullOptions;

	this.rxDict_ = this.options['dict'].map(function (item) {
		if (typeof item === 'string') {
			return new RegExp(item, 'igm');
		}
	});

	this.dictMatcher_ = Contexta.createDictMatcher(this.rxDict_);
	this.nodeWrapper_ = Contexta.createNodeWrapper(this.options['endpoint']);
}

Object.defineProperties(Contexta, {
	defaults: {
		value: {
			'endpoint': null,
			'dict': null
		}
	},

	assertOptionsIsValid: {
		value: function (options) {
			function optionIsRequired(key) {
				if (!options[key]) {
					throw new Error('Option "' + key + '" is required but was not specified.');
				}
			}

			optionIsRequired('endpoint');
			optionIsRequired('dict');
		}
	},

	isElementEmbeddable: {
		value: function (element) {
			var tagName = element.tagName;

			switch (tagName) {
				case 'A':
				case 'BUTTON':
				case 'INPUT':
					return false
				
				default:
					return true;
			}
		}
	},

	createDictMatcher: {
		value: function (rxDict) {
			return function dictMatcher(text) {
				for (var i = 0, l = rxDict.length; i < l; ++i) {
					var dictItem = rxDict[i];
					dictItem.lastIndex = 0;

					if (dictItem.test(text)) {
						return true;
					}
				}

				return false;
			};
		}
	},

	createNodeWrapper: {
		value: function (endpoint) {
			var marker = /%text/i;
			var urlParts = endpoint.split(marker);

			return function nodeWrapper(node) {
				var link = node.ownerDocument.createElement('a');
				link.href = urlParts.join(encodeURIComponent(node.textContent));
				link.className = CONTEXTA_LINK_CLASSNAME;
				link.appendChild(node);

				return link;
			};
		}
	},

	collectMatchedTextNodes: {
		value: function (rootElement, matcher) {
			var nodes = [];

			function nextElement(element) {
				if (!Contexta.isElementEmbeddable(element)) {
					return;
				}

				var node = element.firstChild;

				while (node) {
					switch (node.nodeType) {
						case Node.ELEMENT_NODE:
							nextElement(node);
							break;

						case Node.TEXT_NODE:
							if (matcher(node.textContent)) {
								nodes.push(node);
							}
							break;
					}

					node = node.nextSibling;
				}
			}

			nextElement(rootElement);

			return nodes;
		}
	},

	replaceNodeText: {
		value: function replaceNodeText(node, rx, replacer) {
			switch (node.nodeType) {
				case Node.TEXT_NODE:
					var text = node.textContent;

					if (!rx.test(text)) {
						return;
					}

					var doc = node.ownerDocument;
					var nodeReplace = doc.createDocumentFragment();
					var matchEnd = 0;

					rx.lastIndex = 0;

					var match;
					while (match = rx.exec(text)) {
						var matchText = match[0];
						var matchIndex = match.index;
						var textBefore = text.slice(matchEnd, matchIndex);

						var nodeBefore = doc.createTextNode(textBefore);
						nodeReplace.appendChild(nodeBefore);


						var replaced = replacer(doc.createTextNode(matchText));
						nodeReplace.appendChild(replaced);

						matchEnd = matchIndex + matchText.length;
					}

					var textAfter = text.slice(matchEnd);
					nodeReplace.appendChild(doc.createTextNode(textAfter));

					node.parentNode.replaceChild(nodeReplace, node);
				break;

				case Node.DOCUMENT_FRAGMENT_NODE:
					var child = node.firstChild;

					while (child) {
						replaceNodeText(child, rx, replacer);
						child = child.nextSibling;
					}
				break;
			}
		}
	},

	'deactivateAll': {
		value: function (container) {
			var links = container.querySelectorAll('.' + CONTEXTA_LINK_CLASSNAME.split(' ').join('.'));
			links = Array.prototype.slice.call(links);

			links.forEach(function (link) {
				var linkContent = link.ownerDocument.createDocumentFragment();
				var child = link.firstChild;

				while (child = link.firstChild) {
					linkContent.appendChild(child);
				}

				link.parentNode.replaceChild(linkContent, link);
			});
		}
	}
});

Object.defineProperties(Contexta.prototype, {
	'activate': {
		value: function (container) {
			if (!(container instanceof Element)) {
				throw new Error('Can not activate on non-element container.');
			}

			var rxDict = this.rxDict_;
			var nodeWrapper = this.nodeWrapper_;
			var dictMatcher = this.dictMatcher_;

			var matchedTextNodes = Contexta.collectMatchedTextNodes(container, dictMatcher);

			matchedTextNodes.forEach(function (node) {
				var nodeFragment = node.ownerDocument.createDocumentFragment();
				nodeFragment.appendChild(node.cloneNode());

				rxDict.forEach(function (rx) {
					Contexta.replaceNodeText(nodeFragment, rx, nodeWrapper);
				});

				node.parentNode.replaceChild(nodeFragment, node);
			});
		}
	}
});
