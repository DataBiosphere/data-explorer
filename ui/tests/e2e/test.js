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

    // Hide snackbar because it prevents clicking on some facet bars
    await page.goto("http://localhost:4400");
    await page.evaluate(() => {
      localStorage.setItem("hasShownSnackbarv2", "true");
    });
  });

  beforeEach(async () => {
    await page.goto("http://localhost:4400");
    await page.waitForSelector("[class*='datasetName']");
  });

  test("Participant facet", async () => {
    // Assert facet rendered correctly
    await assertFacet("Super Population", "3500", "African", "1018");

    // Click on facet bar and assert page updated correctly
    let facetBar = await getFacetBar("Super Population", "African");
    await facetBar.click("");
    await waitForFacetsUpdate(1018);
    await assertFacet("Gender", "1018", "male", "518");

    // Make sure unselected facet value bar is dimmed
    facetBar = await getFacetBar("Super Population", "European");
    const barColor = await page.evaluate(bar => bar.style.fill, facetBar);
    // Vega translates our hex colors to rgb so it must be validated this way.
    expect(barColor).toBe("rgb(191, 225, 240)");
  });

  test("Sample facet", async () => {
    // Assert facet rendered correctly
    await assertFacet("% covered 20x or greater", "2551", "0.9-1.0", "1108");

    // Click on facet bar and assert page updated correctly
    let facetBar = await getFacetBar("% covered 20x or greater", "0.9-1.0");
    await facetBar.click("");
    await waitForFacetsUpdate(1108);
    await assertFacet("Gender", "1108", "female", "563");

    // Make sure unselected facet value bar is dimmed
    facetBar = await getFacetBar("% covered 20x or greater", "0.8-0.9");
    const barColor = await page.evaluate(bar => bar.style.fill, facetBar);
    // Vega translates our hex colors to rgb so it must be validated this way.
    expect(barColor).toBe("rgb(191, 225, 240)");
  });

  test("Samples Overview facet", async () => {
    // Skip asserting facet rendered correctly, because this facet doesn't have
    // totalFacetValueCount span.

    // Click on facet bar and assert page updated correctly
    let facetBar = await getFacetBar("Samples Overview", "Has Exome CRAM");
    await facetBar.click("");
    await waitForFacetsUpdate(2534);
    await assertFacet("Gender", "2534", "female", "1290");

    await saveInTerra;
  });

  test("Save in Terra", async () => {
    let facetBar = await getFacetBar("Super Population", "African");
    await facetBar.click("");
    await waitForFacetsUpdate(1018);

    await saveInTerra();
  });

  test("Search box - chips", async () => {
    // Click on facet bar and assert chip is added
    let facetBar = await getFacetBar("Gender", "female");
    await facetBar.click("");
    await waitForFacetsUpdate(1760);
    await waitForChip("Gender=female");

    // Click on facet bar again and assert chip is deleted
    facetBar = await getFacetBar("Gender", "female");
    await facetBar.click("");
    await waitForFacetsUpdate(3500);
    chips = await page.$x("//div[text()='Gender=female']");
    expect(chips.length).toBe(0);

    // Click on facet bar, click on chip "x", assert facet value is unselected
    facetBar = await getFacetBar("Gender", "female");
    await facetBar.click("");
    await waitForFacetsUpdate(1760);
    let chipX = await page.waitForXPath(
      "//div[text()[contains(.,'Gender=female')]]/../div[2]"
    );
    chipX.click();
    await waitForFacetsUpdate(3500);
  });

  test("Search box - select row with facet value", async () => {
    // Type "pat" into search box and select result that adds
    // Relationship facet with 'pat grandmother; mother' selected.
    let searchBox = await page.$x(
      "//div[contains(text(), 'Search to add a facet')]"
    );
    await searchBox[0].click();
    await searchBox[0].type("pat");
    let searchResult = await page.waitForXPath(
      "//span[contains(., 'pat grandmother; mother')]"
    );
    await searchResult.click();

    // Assert Relationship facet was added and value was selected
    await waitForFacetsUpdate(1);
    await assertFacet("Relationship", "1", "mother", "831");

    // Click on 'x' in facet header, make sure filter was removed
    let header = await page.waitForXPath(
      "//div[contains(@class, 'FacetHeader-facetHeader') and contains(., 'Relationship')]"
    );
    await header.hover();
    let closeIcon = await page.waitForSelector(
      "div[class^='FacetHeader-closeIcon-']"
    );
    await closeIcon.click();
    await waitForFacetsUpdate(3500);
  });

  test("Data Explorer URL works", async () => {
    // Add Relationship extra facet and select Relationship=mother.
    let searchBox = await page.$x(
      "//div[contains(text(), 'Search to add a facet')]"
    );
    await searchBox[0].click();
    await searchBox[0].type("mother");
    await page.waitForXPath("//span[contains(text(), 'Add')]");
    // waitForXPath() returns only first result. Call $x to get all results.
    let results = await page.$x("//span[contains(text(), 'Add')]");
    await results[0].click();
    await waitForFacetsUpdate(831);

    // Select Super Population=African, Super Population=South Asian
    let facetBar = await getFacetBar("Super Population", "African");
    await facetBar.click("");
    await waitForFacetsUpdate(279);
    facetBar = await getFacetBar("Super Population", "South Asian");
    await facetBar.click("");
    await waitForFacetsUpdate(477);

    // Reload page with current URL. This simulates exporting URL to Terra and
    // opening exported URL.
    await page.goto(page.url());

    // This confirms the right extra facets and filters were rendered.
    await waitForFacetsUpdate(477);
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

  // Only use this for facets whose top bar is more than zero pixels -- eg not
  // Total Exome Sequence. (The hover won't work if top bar is zero pixels.)
  async function assertFacet(
    facetName,
    totalCount,
    firstValueName,
    firstValueCount
  ) {
    const facet = await getFacet(facetName);
    expect(
      await facet.$eval(
        "*[class*='FacetHeader-totalFacetValueCount-']",
        node => node.innerText
      )
    ).toBe(totalCount);

    // Get the first bar element in the facet and hover over it.
    const topBar = (await page.evaluateHandle(
      (facet, firstValueName) => {
        const barsContainer = facet.querySelector(
          "*[class*='mark-rect role-mark marks']"
        );
        let valueIdx = 0;
        // For numeric facets, paths are in reverse order; the top facet bar is
        // the last path.
        if ("0123456789".includes(firstValueName[0])) {
          valueIdx = barsContainer.childElementCount / 2 - 1;
        }
        return barsContainer.querySelectorAll("path")[valueIdx];
      },
      facet,
      firstValueName
    )).asElement();
    await topBar.hover();

    // Wait for the tooltip to show up and assert the text is correct.
    await page.waitForXPath("//*[contains(text(), 'cursor: pointer')]");
    const tooltipText = await page.evaluate(
      () => document.querySelector("*[class*='vg-tooltip']").innerHTML
    );
    expect(tooltipText).toBe(firstValueName + ": " + firstValueCount);
  }

  /**
   * Returns Promise of JSHandle of facet value bar.
   * facet value name is checked against axis label. Do NOT use for values where
   * axis label is truncated with ellipses (eg "Has WGS Low Cov...").
   */
  async function getFacetBar(facetName, value) {
    let facet = await getFacet(facetName);

    // Get facet value index
    let valueIdx = await page.evaluate(
      (facet, value) => {
        const labelsContainer = facet.querySelectorAll(
          "*[class*='mark-text role-axis-label']"
        )[1];
        const labels = labelsContainer.querySelectorAll("text");
        var valueIdx;
        for (let i = 0; i < labels.length; i++) {
          if (labels[i].innerHTML == value) {
            valueIdx = i;
          }
        }
        // For numeric facets, paths are in reverse order; the top facet bar is
        // the last path.
        if ("0123456789".includes(value[0])) {
          valueIdx = labels.length - 1 - valueIdx;
        }
        return valueIdx;
      },
      facet,
      value
    );

    // Select the path element at this index
    const facetBar = (await page.evaluateHandle(
      (facet, i) => {
        const barsContainer = facet.querySelector(
          "*[class*='mark-rect role-mark marks']"
        );
        return barsContainer.querySelectorAll("path")[i];
      },
      facet,
      valueIdx
    )).asElement();
    expect(facetBar).toBeTruthy();
    return facetBar;
  }

  async function getFacet(facetName) {
    const facet = (await page.evaluateHandle(innerFacetName => {
      const divs = document.querySelectorAll(
        "*[class*='HistogramFacet-histogramFacet-']"
      );
      for (const div of divs) {
        const name = div.querySelector("div").innerText;
        if (name.includes(innerFacetName)) return div;
      }
      return null;
    }, facetName)).asElement();
    expect(facet).toBeTruthy();
    return facet;
  }

  /**
   * Waits for new facets data from backend, and Data Explorer UI to update.
   */
  async function waitForFacetsUpdate(newTotalCount) {
    await page.waitForXPath(
      "//*[contains(@class, 'totalCount') and contains(text(),'" +
        newTotalCount +
        "')]"
    );
  }

  async function waitForChip(chipText) {
    await page.waitForXPath("//div[text()='" + chipText + "']");
  }

  async function saveInTerra() {
    await page.click("button[title~='Save']");
    // Wait for cohort name dialog
    await page.waitForSelector("#name");

    await page.type("#name", "c");
    // Look for span with exact text 'Save'. This matches on dialog save button
    // and not "Save cohort" button
    let saveButton = await page.waitForXPath("//span[./text()='Save']");
    await saveButton.click();
    await page.waitForRequest("https://app.terra.bio/");
  }
});
