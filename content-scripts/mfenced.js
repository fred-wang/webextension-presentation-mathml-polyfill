/* -*- Mode: Java; tab-width: 2; indent-tabs-mode:nil; c-basic-offset: 2 -*- */
/* vim: set ts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const namespaceURI = "http://www.w3.org/1998/Math/MathML";

function collapseWhiteSpace(text) {
  // Collapse the whitespace as specified by the MathML specification.
  // See https://www.w3.org/TR/MathML/chapter2.html#fund.collapse
  return text.replace(/^[\s]+|[\s]+$/g, '').replace(/[\s]+/g, ' ');
}

function newOperator(text, separator) {
  // Create <mo fence="true">text</mo> or <mo separator="true">text</mo>.
  let operator = document.createElementNS(namespaceURI, "mo");
  operator.appendChild(document.createTextNode(text));
  operator.setAttribute(separator ? "separator" : "fence", "true");
  return operator;
}

function newMrow() {
  // Create an empty <mrow>.
  return document.createElementNS(namespaceURI, "mrow");
}

function getSeparatorList(text) {
  // Split the separators attribute into a list of characters.
  // We ignore whitespace and handle surrogate pairs.
  if (text === null) {
    return [","];
  }
  let separatorList = [];
  for (let i = 0; i < text.length; i++) {
    if (!/\s/g.test(text.charAt(i))) {
      let c = text.charCodeAt(i);
      if (c >= 0xD800 && c < 0xDC00 && i + 1 < text.length) {
        separatorList.push(text.substr(i, 2));
        i++;
      } else {
        separatorList.push(text.charAt(i));
      }
    }
  }
  return separatorList;
}

function shouldCopyAttribute(attribute) {
  // The <mfenced> and <mrow> elements have the same attributes except
  // that dir is only accepted on <mrow> and open/close/separators are
  // only accepted on <mfenced>. See https://www.w3.org/Math/RelaxNG/
  const excludedAttributes = ["dir", "open", "close", "separators"];
  return attribute.namespaceURI || !excludedAttributes.includes(attribute.localName);
}

function expandFencedElement(mfenced) {
  // Return an <mrow> element representing the expanded <mfenced>.
  // See https://www.w3.org/TR/MathML/chapter3.html#presm.fenced
  let outerMrow = newMrow();
  outerMrow.appendChild(newOperator(collapseWhiteSpace(mfenced.getAttribute("open") || "(")));
  if (mfenced.childElementCount === 1) {
    outerMrow.appendChild(mfenced.firstElementChild.cloneNode(true));
  } else if (mfenced.childElementCount > 1) {
    let separatorList = getSeparatorList(mfenced.getAttribute("separators")),
      innerMrow = newMrow(),
      child = mfenced.firstElementChild;
    while (child) {
      innerMrow.appendChild(child.cloneNode(true));
      child = child.nextElementSibling;
      if (child && separatorList.length) {
        innerMrow.appendChild(newOperator(separatorList.length >  1 ? separatorList.shift() : separatorList[0]));
      }
    }
    outerMrow.appendChild(innerMrow);
  }
  outerMrow.appendChild(newOperator(collapseWhiteSpace(mfenced.getAttribute("close") || ")")));
  for (let i = 0; i < mfenced.attributes.length; i++) {
    let attribute = mfenced.attributes[i];
    if (shouldCopyAttribute(attribute)) {
      outerMrow.setAttributeNS(attribute.namespaceURI, attribute.localName, attribute.value);
    }
  }
  return outerMrow;
}

function expandMathMLFencedElements() {
  // Replace all the <mfenced> elements with their expanded equivalent.
  let mfencedElements = document.body.getElementsByTagNameNS(namespaceURI, "mfenced");
  while (mfencedElements.length) {
    let fenced = mfencedElements[0];
    fenced.parentNode.replaceChild(expandFencedElement(fenced), fenced);
  }
};

expandMathMLFencedElements();
