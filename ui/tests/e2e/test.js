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
    await page.waitForSelector(".datasetName");
  });

  test("Header", async () => {
    await expect(page).toMatch("1000 Genomes");
    await assertHeaderTotalCount("3500");
  });

  test("Participant facet", async () => {
    // Assert facet rendered correctly
    await assertFacet("Super Population", "3500", "African", "1018");

    // Click on facet value
    let facetValueRow = await getFacetValueRow("Super Population", "African");
    await facetValueRow.click("input");
    await waitForFacetsUpdate(1018);

    // Assert page updated correctly.
    await assertHeaderTotalCount("1018");
    await assertFacet("Gender", "1018", "male", "518");

    // Make sure non-selected facet values are gray.
    facetValueRow = await getFacetValueRow("Super Population", "European");
    const grayDiv = await facetValueRow.$("*[class*='FacetCard-grayText-']");

    expect(grayDiv).toBeTruthy();
  });

  test("Sample facet", async () => {
    // Assert facet rendered correctly
    await assertFacet("Total Low Coverage Sequence", "2688", "0B-10B", "10");

    // Click on facet value
    let facetValueRow = await getFacetValueRow(
      "Total Low Coverage Sequence",
      "10B-20B"
    );
    await facetValueRow.click("input");
    // Wait for data to be returned from backend.
    // See #63 for why we can't wait for .grayText.
    await page.waitForXPath(
      "//*[contains(@class, 'totalCountText') and text() = '1122']"
    );

    // Assert page updated correctly.
    await assertHeaderTotalCount("1122");
    await assertFacet("Gender", "1122", "female", "569");

    // Make sure non-selected facet values are gray.
    facetValueRow = await getFacetValueRow(
      "Total Low Coverage Sequence",
      "0B-10B"
    );
    const grayDiv = await facetValueRow.$("*[class*='FacetCard-grayText-']");
    expect(grayDiv).toBeTruthy();
  });

  test("Samples Overview facet", async () => {
    // Skip asserting facet rendered correctly, because this facet doesn't have
    // totalFacetValueCount span.

    // Click on facet value
    let facetValueRow = await getFacetValueRow(
      "Samples Overview",
      "Has WGS Low Coverage BAM"
    );
    await facetValueRow.click("input");
    await waitForFacetsUpdate(2535);

    // Assert page updated correctly.
    await assertHeaderTotalCount("2535");
    await assertFacet("Gender", "2535", "female", "1291");

    // Make sure non-selected facet values are gray.
    facetValueRow = await getFacetValueRow("Samples Overview", "Has Exome BAM");
    const grayDiv = await facetValueRow.$("*[class*='FacetCard-grayText-']");
    expect(grayDiv).toBeTruthy();

    // Test exporting to saturn.
    await exportToSaturn_selectedCohort();
  });

  test("Export to Saturn - no selected cohort", async () => {
    await exportToSaturn_noSelectedCohort();
  });

  test("Export to Saturn - selected cohort", async () => {
    // Click first Super Population facet value.
    let facetValueRow = await getFacetValueRow("Super Population", "African");
    await facetValueRow.click("input");
    await waitForFacetsUpdate(1018);

    await exportToSaturn_selectedCohort();
  });

  test("Search box - chips", async () => {
    // Select the 'Gender - female' facet value.
    let facetValueRow = await getFacetValueRow("Gender", "female");
    await facetValueRow.click("input");
    await waitForFacetsUpdate(1760);

    // Assert chip is added
    await waitForChip("Gender=female");

    // Unselect the 'Gender - female' facet value.
    facetValueRow = await getFacetValueRow("Gender", "female");
    await facetValueRow.click("input");
    await waitForFacetsUpdate(3500);

    // Assert chip is deleted.
    chip = await page.$x("//div[text()='Gender=female']");
    expect(chip.length).toBe(0);

    // Select the 'Gender - female' facet value.
    facetValueRow = await getFacetValueRow("Gender", "female");
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

  test("Search box - select row with facet value", async () => {
    // Type "pat" in search box.
    let initial_select = await page.$x("//div[text()='Search center or pat']");
    await initial_select[0].click();
    await initial_select[0].type("pat");

    // Select first result
    await page.waitForXPath("//span[contains(text(), 'Add')]");
    let results = await page.$x("//span[contains(text(), 'Add')]");
    await results[0].click();

    // Assert Relationship facet is added
    await waitForFacetCard("Relationship");
    await assertFacet("Relationship", "1", "mother", "831");

    // Make sure the selected facet value is checked.
    facetValueRow = await getFacetValueRow(
      "Relationship",
      "paternal grandmother"
    );
    const checkedBox = await facetValueRow.$(
      "*[class*='MuiCheckbox-checked-']"
    );
    expect(checkedBox).toBeTruthy();
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

  async function assertHeaderTotalCount(count) {
    // e.innerText looks like "3500 Participants"
    const totalCount = await page.$eval(
      ".totalCountText",
      e => e.innerText.split(" ")[0]
    );
    await expect(totalCount).toBe(count);
  }

  async function assertFacet(
    facetName,
    totalCount,
    firstValueName,
    firstValueCount
  ) {
    const facetCard = await getFacetCard(facetName);

    expect(
      await facetCard.$eval(
        "*[class*='FacetCard-totalFacetValueCount-']",
        node => node.innerText
      )
    ).toBe(totalCount);
    expect(
      await facetCard.$eval(
        "*[class*='FacetCard-facetValueName-']",
        node => node.innerText
      )
    ).toBe(firstValueName);
    expect(
      await facetCard.$eval(
        "*[class*='FacetCard-facetValueCount-']",
        node => node.innerText
      )
    ).toBe(firstValueCount);
  }

  /**
   * Returns Promise of JSHandle of facetValueRow label.
   */
  async function getFacetValueRow(facetName, valueName) {
    let facetCard = await getFacetCard(facetName);
    let facetValueRow = (await page.evaluateHandle(
      (facetCard, valueName) => {
        let divs = facetCard.querySelectorAll("*[class*='MuiListItem-']");
        for (let div of divs) {
          if (div.innerText.includes(valueName)) return div;
        }
        return null;
      },
      facetCard,
      valueName
    )).asElement();
    expect(facetValueRow).toBeTruthy();
    return facetValueRow;
  }

  /**
   * Returns Promise of JSHandle of facetCard div.
   */
  async function getFacetCard(facetName) {
    const facetCard = (await page.evaluateHandle(innerFacetName => {
      const divs = document.querySelectorAll(
        "*[class*='FacetCard-facetCard-']"
      );
      for (const div of divs) {
        const name = div.querySelector("p").innerText;
        if (name.includes(innerFacetName)) return div;
      }
      return null;
    }, facetName)).asElement();
    expect(facetCard).toBeTruthy();
    return facetCard;
  }

  /**
   * Waits for new facets data from backend, and Data Explorer UI to update.
   */
  async function waitForFacetsUpdate(newTotalCount) {
    // See #63 for why we can't wait for .grayText.
    await page.waitForXPath(
      "//*[contains(@class, 'totalCountText') and contains(text(),'" +
        newTotalCount +
        "')]"
    );
  }

  /**
   * Waits for facet card to be rendered.
   */
  async function waitForFacetCard(facetName) {
    await page.waitForXPath("//*[contains(text(),'" + facetName + "')]");
  }

  async function waitForChip(chipText) {
    await page.waitForXPath("//div[text()='" + chipText + "']");
  }

  async function exportToSaturn_noSelectedCohort() {
    await page.click("button[title='Send to Terra']");
    // Jest documentation says to use waitForNavigation():
    // https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pageclickselector-options
    // Here we use waitForRequest() instead. waitForRequest() is slightly
    // faster because it doesn't wait for the Saturn page to finish (or start?)
    // loading.
    await page.waitForRequest("https://app.terra.bio/");
  }

  async function exportToSaturn_selectedCohort() {
    await page.click("button[title='Send to Terra']");
    // Wait for cohort name dialog
    await page.waitForSelector("#name");

    await page.type("#name", "c");
    await page.click("#save");
    await page.waitForRequest("https://app.terra.bio/");
  }
});
