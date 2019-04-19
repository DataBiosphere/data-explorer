const JEST_TIMEOUT_MS = 60 * 1000;

// Print test name at the beginning of each test
jasmine.getEnv().addReporter({
  specStarted: function(result) {
    console.log(result.fullName);
  }
});

describe("End-to-end", () => {
  beforeAll(async () => {
    // It can take a while for servers to start up
    jest.setTimeout(JEST_TIMEOUT_MS);
    await waitForElasticsearchIndex();
  });

  beforeEach(async () => {
    await page.goto("http://localhost:4400");
    await page.waitForSelector("[class*='datasetName']");
  });

  test("Header", async () => {
    await expect(page).toMatch("1000 Genomes");
    await assertHeaderTotalCount("3500");
  });

  test("[TextFacet] Participant facet", async () => {
    await showTextFacets();

    // Assert facet rendered correctly
    await assertTextFacet("Super Population", "3500", "African", "1018");

    // Click on facet value
    let facetValueRow = await getTextFacetValueRow(
      "Super Population",
      "African"
    );
    await facetValueRow.click("input");
    await waitForFacetsUpdate(1018);

    // Assert page updated correctly.
    await assertHeaderTotalCount("1018");
    await assertTextFacet("Gender", "1018", "male", "518");

    // Make sure non-selected facet values are gray.
    facetValueRow = await getTextFacetValueRow("Super Population", "European");
    const grayDiv = await facetValueRow.$(
      "*[class*='TextFacet-lightGrayText-']"
    );

    expect(grayDiv).toBeTruthy();
  });

  test("[TextFacet] Sample facet", async () => {
    await showTextFacets();

    // Assert facet rendered correctly
    await assertTextFacet("Total Low Coverage Sequence", "2688", "0B-9B", "10");

    // Click on facet value
    let facetValueRow = await getTextFacetValueRow(
      "Total Low Coverage Sequence",
      "10B-19B"
    );
    await facetValueRow.click("input");
    // Wait for data to be returned from backend.
    // See #63 for why we can't wait for .grayText.
    await page.waitForXPath(
      "//*[contains(@class, 'totalCount') and text() = '1122']"
    );

    // Assert page updated correctly.
    await assertHeaderTotalCount("1122");
    await assertTextFacet("Gender", "1122", "female", "569");
  });

  test("[TextFacet] Samples Overview facet", async () => {
    await showTextFacets();

    // Skip asserting facet rendered correctly, because this facet doesn't have
    // totalFacetValueCount span.

    // Click on facet value
    let facetValueRow = await getTextFacetValueRow(
      "Samples Overview",
      "Has WGS Low Coverage BAM"
    );
    await facetValueRow.click("input");
    await waitForFacetsUpdate(2535);

    // Assert page updated correctly.
    await assertHeaderTotalCount("2535");
    await assertTextFacet("Gender", "2535", "female", "1291");

    // Test exporting to saturn.
    await exportToSaturn;
  });

  test("[TextFacet] Export to Saturn", async () => {
    await showTextFacets();

    // Click first Super Population facet value.
    let facetValueRow = await getTextFacetValueRow(
      "Super Population",
      "African"
    );
    await facetValueRow.click("input");
    await waitForFacetsUpdate(1018);

    await exportToSaturn();
  });

  test("[TextFacet] Search box - chips", async () => {
    await showTextFacets();

    // Select the 'Gender - female' facet value.
    let facetValueRow = await getTextFacetValueRow("Gender", "female");
    await facetValueRow.click("input");
    await waitForFacetsUpdate(1760);

    // Assert chip is added
    await waitForChip("Gender=female");

    // Unselect the 'Gender - female' facet value.
    facetValueRow = await getTextFacetValueRow("Gender", "female");
    await facetValueRow.click("input");
    await waitForFacetsUpdate(3500);

    // Assert chip is deleted.
    chip = await page.$x("//div[text()='Gender=female']");
    expect(chip.length).toBe(0);

    // Select the 'Gender - female' facet value.
    facetValueRow = await getTextFacetValueRow("Gender", "female");
    await facetValueRow.click("input");
    await waitForFacetsUpdate(1760);

    // Click on 'x' on the chip.
    let chipX = await page.$x(
      "//div[text()[contains(.,'Gender=female')]]/../div[2]"
    );
    chipX[0].click();

    // Assert that female is unselected. (3500 includes males and females).
    await waitForFacetsUpdate(3500);
  });

  test("[TextFacet] Search box - select row with facet value", async () => {
    await showTextFacets();

    // Type "pat" in search box.
    let initial_select = await page.$x(
      "//div[contains(text(), 'Search to add a facet')]"
    );
    await initial_select[0].click();
    await initial_select[0].type("pat");

    // Select second result
    await page.waitForXPath("//span[contains(text(), 'Add')]");
    let results = await page.$x("//span[contains(text(), 'Add')]");
    await results[1].click();

    // Assert Relationship facet is added
    await waitForTextFacet("Relationship");
    // Move mouse away from the facet header (so X isn't displayed)
    await page.hover("input");
    await assertTextFacet("Relationship", "1", "mother", "831");

    // Make sure facet value is selected
    await assertTextFacetValueSelected("Relationship", "paternal grandmother");

    // Click on 'x' on the facet header
    await page.hover("div[class^='FacetHeader-facetName-']");
    await page.click("div[class^='FacetHeader-closeIcon-']");

    // Make sure the facet filters were removed
    await waitForFacetsUpdate(3500);
  });

  test("[HistogramFacet] Participant facet", async () => {
    // Assert facet rendered correctly
    await assertHistogramFacet("Super Population", "3500", "African", "1018");

    // Click on facet value
    let facetBar = await getHistogramFacetBar("Super Population", "African");
    await facetBar.click("input");
    await waitForFacetsUpdate(1018);

    // Assert page updated correctly.
    await assertHeaderTotalCount("1018");
    await assertHistogramFacet("Gender", "1018", "male", "518");

    // Make sure non-selected facet values are dimmed.
    facetBar = await getHistogramFacetBar("Super Population", "European");
    const barColor = await page.evaluate(bar => bar.style.fill, facetBar);
    // Vega translates our hex colors to rgb so it must be validated this way.
    expect(barColor).toBe("rgb(191, 225, 240)");
  });

  test("[HistogramFacet] Data Explorer URL works", async () => {
    // Add Relationship extra facet and select Relationship=mother.
    let initial_select = await page.$x(
      "//div[contains(text(), 'Search to add a facet')]"
    );
    await initial_select[0].click();
    await initial_select[0].type("mother");
    await page.waitForXPath("//span[contains(text(), 'Add')]");
    let results = await page.$x("//span[contains(text(), 'Add')]");
    await results[0].click();
    await waitForFacetsUpdate(831);

    // Select Super Population=African, Super Population=South Asian
    let facetBar = await getHistogramFacetBar("Super Population", "African");
    await facetBar.click("input");
    await waitForFacetsUpdate(279);
    facetBar = await getHistogramFacetBar("Super Population", "South Asian");
    await facetBar.click("input");
    await waitForFacetsUpdate(477);

    // Reload page with current URL. This simulates exporting URL to Terra and
    // opening exported URL.
    await page.goto(page.url());
    await page.waitForSelector("[class*='datasetName']");

    // This confirms the right extra facets and filters were rendered.
    await assertHeaderTotalCount("477");
  });

  async function waitForElasticsearchIndex() {
    var waitOneSec = function() {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve();
        }, 1000);
      });
    };
    const MAX_RETRIES = 60;
    console.log("Waiting for servers to come up and test data to be indexed.");
    for (let i = 0; i <= MAX_RETRIES; i++) {
      try {
        var result = await page.goto(
          "http://localhost:9200/_cluster/health?wait_for_status=yellow"
        );
        // Elasticsearch has come up. Now wait for test data to be indexed.
        await page.goto("http://localhost:9200/1000_genomes/type/_count");
        await page.waitForXPath("//*[contains(text(), '3500')]");
        console.log(
          "Servers up and test data indexed after " + i + " seconds."
        );
        return result;
      } catch (err) {
        await waitOneSec();
      }
    }
    errorMsg =
      "Servers failed to come up/test data failed to be " +
      "indexed after " +
      MAX_RETRIES +
      " seconds.";
    console.log(errorMsg);
    return Promise.reject(errorMsg);
  }

  async function showTextFacets() {
    await page.click("input[type='checkbox']");
  }

  async function assertHeaderTotalCount(count) {
    // e.innerText looks like "3500 Participants"
    const totalCount = await page.$eval(
      "[class*='totalCount']",
      e => e.innerText.split(" ")[0]
    );
    await expect(totalCount).toBe(count);
  }

  async function assertTextFacet(
    facetName,
    totalCount,
    firstValueName,
    firstValueCount
  ) {
    const textFacet = await getTextFacet(facetName);

    expect(
      await textFacet.$eval(
        "*[class*='FacetHeader-totalFacetValueCount-']",
        node => node.innerText
      )
    ).toBe(totalCount);
    expect(
      await textFacet.$eval(
        "*[class*='TextFacet-facetValueName-']",
        node => node.innerText
      )
    ).toBe(firstValueName);
    expect(
      await textFacet.$eval(
        "*[class*='TextFacet-facetValueCount-']",
        node => node.innerText
      )
    ).toBe(firstValueCount);
  }

  async function assertHistogramFacet(
    facetName,
    totalCount,
    firstValueName,
    firstValueCount
  ) {
    const histogramFacet = await getHistogramFacet(facetName);
    expect(
      await histogramFacet.$eval(
        "*[class*='FacetHeader-totalFacetValueCount-']",
        node => node.innerText
      )
    ).toBe(totalCount);

    // Get the first bar element in the facet and hover over it.
    const firstBar = (await page.evaluateHandle(facet => {
      const barsContainer = facet.querySelector(
        "*[class*='mark-rect role-mark marks']"
      );
      return barsContainer.querySelector("path");
    }, histogramFacet)).asElement();
    await firstBar.hover();

    // Wait for the tooltip to show up and assert the text is correct.
    await page.waitForXPath("//*[contains(text(), 'cursor: pointer')]");
    const tooltipText = await page.evaluate(
      () => document.querySelector("*[class*='vg-tooltip']").innerHTML
    );
    expect(tooltipText).toBe(firstValueName + ": " + firstValueCount);
  }

  async function assertTextFacetValueSelected(facetName, valueName) {
    facetValueRow = await getTextFacetValueRow(facetName, valueName);
    const checkedBox = await facetValueRow.$(
      "*[class*='MuiCheckbox-checked-']"
    );
    expect(checkedBox).toBeTruthy();
  }

  /**
   * Returns Promise of JSHandle of facetValueRow label.
   */
  async function getTextFacetValueRow(facetName, valueName) {
    let textFacet = await getTextFacet(facetName);
    let facetValueRow = (await page.evaluateHandle(
      (textFacet, valueName) => {
        let divs = textFacet.querySelectorAll("*[class*='MuiListItem-']");
        for (let div of divs) {
          if (div.innerText.includes(valueName)) return div;
        }
        return null;
      },
      textFacet,
      valueName
    )).asElement();
    expect(facetValueRow).toBeTruthy();
    return facetValueRow;
  }

  /**
   * Returns Promise of JSHandle of textFacet div.
   */
  async function getTextFacet(facetName) {
    const textFacet = (await page.evaluateHandle(innerFacetName => {
      const divs = document.querySelectorAll(
        "*[class*='TextFacet-textFacet-']"
      );
      for (const div of divs) {
        const name = div.querySelector("div").innerText;
        if (name.includes(innerFacetName)) return div;
      }
      return null;
    }, facetName)).asElement();
    expect(textFacet).toBeTruthy();
    return textFacet;
  }

  /**
   * Returns Promise of JSHandle of barFacet path element.
   */
  async function getHistogramFacetBar(facetName, valueName) {
    let histogramFacet = await getHistogramFacet(facetName);
    // First get the index of the facet with this name.
    let facetIdx = await page.evaluate(
      (facet, value) => {
        // The first labels class is the 'tick marks' axis, the labels are the second.
        const labelsContainer = facet.querySelectorAll(
          "*[class*='mark-text role-axis-label']"
        )[1];
        const labels = labelsContainer.querySelectorAll("text");
        for (let i = 0; i <= labels.length; i++) {
          if (labels[i].innerHTML == value) return i;
        }
        return null;
      },
      histogramFacet,
      valueName
    );
    // Select the path element at the correct index.
    const facetBar = (await page.evaluateHandle(
      (facet, idx) => {
        const barsContainer = facet.querySelector(
          "*[class*='mark-rect role-mark marks']"
        );
        return barsContainer.querySelectorAll("path")[idx];
      },
      histogramFacet,
      facetIdx
    )).asElement();
    expect(facetBar).toBeTruthy();
    return facetBar;
  }

  /**
   * Returns Promise of JSHandle of textFacet div.
   */
  async function getHistogramFacet(facetName) {
    const textFacet = (await page.evaluateHandle(innerFacetName => {
      const divs = document.querySelectorAll(
        "*[class*='HistogramFacet-histogramFacet-']"
      );
      for (const div of divs) {
        const name = div.querySelector("div").innerText;
        if (name.includes(innerFacetName)) return div;
      }
      return null;
    }, facetName)).asElement();
    expect(textFacet).toBeTruthy();
    return textFacet;
  }

  /**
   * Waits for new facets data from backend, and Data Explorer UI to update.
   */
  async function waitForFacetsUpdate(newTotalCount) {
    // See #63 for why we can't wait for .grayText.
    await page.waitForXPath(
      "//*[contains(@class, 'totalCount') and contains(text(),'" +
        newTotalCount +
        "')]"
    );
  }

  /**
   * Waits for facet card to be rendered.
   */
  async function waitForTextFacet(facetName) {
    await page.waitForXPath("//*[contains(text(),'" + facetName + "')]");
  }

  async function waitForChip(chipText) {
    await page.waitForXPath("//div[text()='" + chipText + "']");
  }

  async function exportToSaturn() {
    await page.click("svg[title='Save in Terra']");
    // Wait for cohort name dialog
    await page.waitForSelector("#name");

    await page.type("#name", "c");
    await page.click("#save");
    await page.waitForRequest("https://app.terra.bio/");
  }
});
