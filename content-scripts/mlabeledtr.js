/* -*- Mode: Java; tab-width: 2; indent-tabs-mode:nil; c-basic-offset: 2 -*- */
/* vim: set ts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

(function () {
  "use strict";

  const namespaceURI = "http://www.w3.org/1998/Math/MathML";

  function isMathMLElement(element, localName) {
    if (element.namespaceURI !== namespaceURI)
      return false;
    return element.localName === localName;
  }

  function newMathMLElement(localName) {
    return document.createElementNS(namespaceURI, localName);
  }

  function transformLabeledRow(mlabeledtr) {
    let mtr = newMathMLElement("mtr");

    // Copy attributes.
    let isLeftHandSide = false;
    for (let i = 0; i < mlabeledtr.attributes.length; i++) {
      let attribute = mlabeledtr.attributes[i];
      if (!attribute.namespaceURI && attribute.localName === "side") {
        isLeftHandSide = (attribute.value === "left");
      } else {
        mtr.setAttributeNS(attribute.namespaceURI, attribute.localName, attribute.value);
      }
    }

    // Move children from the mlabeledtr.
    for (let child = mlabeledtr.firstChild; child; child = mlabeledtr.firstChild)  {
      mtr.appendChild(mlabeledtr.removeChild(child));
    }

    // No label (invalid markup).
    if (mtr.childElementCount === 0)
      return mtr;

    // Duplicate the label to preserve correct alignments and positions.
    mtr.appendChild(mtr.firstElementChild.cloneNode(true));

    // Hide the label according to the desired side.
    // FIXME: Use mphantom to avoid overriding the style attribute?
    let mtd = isLeftHandSide ? mtr.lastElementChild : mtr.firstElementChild;
    mtd.setAttribute("style", "visibility: hidden");

    return mtr;
  }

  function transformTable(table) {
    for (let child = table.firstElementChild; child; child = child.nextElementSibling) {
      if (isMathMLElement(child, "mlabeledtr")) {
        // Replace mlabeledtr with a mtr.
        let newChild = transformLabeledRow(child);
        table.replaceChild(newChild, child);
        child = newChild;
      } else {
        // Add empty cells to preserve correct alignments with labeled rows.
        child.insertBefore(newMathMLElement("mtd"), child.firstChild);
        child.appendChild(newMathMLElement("mtd"));
      }
    }
  }

  function transformLabeledRows() {
    // Replace all the <mlabeledtr> elements with an <mtr> element.
    let mlabeledtrElements = document.body.getElementsByTagNameNS(namespaceURI, "mlabeledtr");
    while (mlabeledtrElements.length) {
      transformTable(mlabeledtrElements[0].parentNode);
    }
  };

  transformLabeledRows();
}());
