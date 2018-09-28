const JEST_TIMEOUT_MS = 60 * 1000;

describe("End-to-end", () => {
  beforeEach(async () => {
    // It can take a while for servers to start up
    jest.setTimeout(JEST_TIMEOUT_MS);
    await waitForElasticsearchIndex();
    await page.goto("http://localhost:4400");
    await page.waitForSelector("span.datasetName");
  });

  test("Header", async () => {
    await expect(page).toMatch("1000 Genomes");
    await assertHeaderTotalCount("3714");
  });

  test("Gender facet", async () => {
    await assertFacet("Gender", "3500", "female", "1760");
  });

  test("Click on participant facet", async () => {
    // Click on a participant facet.
    let facetValueRow = await getFacetValueRow("Super Population", "African");
    await facetValueRow.click("input");
    // Wait for data to be returned from backend.
    // See #63 for why we can't wait for div.grayText.
    await page.waitForXPath(
      "//div[contains(@class, 'totalCountText') and text() = '1018']"
    );

    // Assert page updated correctly.
    await assertHeaderTotalCount("1018");
    await assertFacet("Gender", "1018", "male", "518");
    await assertFacet("Total Exome Sequence", "707", "0B-10B", "435");

    // Make sure non-selected facet values are gray.
    facetValueRow = await getFacetValueRow("Super Population", "European");
    const grayDiv = await facetValueRow.$("div.grayText");
    expect(grayDiv).toBeTruthy();
  });

  test("Click on sample facet", async () => {
    // Click on a sample facet.
    let facetValueRow = await getFacetValueRow("Total Low Coverage Sequence", "10B-20B");
    await facetValueRow.click("input");
    // Wait for data to be returned from backend.
    // See #63 for why we can't wait for div.grayText.
    await page.waitForXPath(
      "//div[contains(@class, 'totalCountText') and text() = '1122']"
    );

    // Assert page updated correctly.
    await assertHeaderTotalCount("1122");
    await assertFacet("Super Population", "1122", "African", "281");
    await assertFacet("Total Exome Sequence", "1108", "0B-10B", "682");

    // Make sure non-selected facet values are gray.
    facetValueRow = await getFacetValueRow("Total Low Coverage Sequence", "0B-10B");
    const grayDiv = await facetValueRow.$("div.grayText");
    expect(grayDiv).toBeTruthy();
  });

  test("Samples Overview facet", async () => {
    // Click on Samples Overview facet.
    let facetValueRow = await getFacetValueRow("Samples Overview", "Has WGS Low Coverage BAM");
    await facetValueRow.click("input");
    // Wait for data to be returned from backend.
    // See #63 for why we can't wait for div.grayText.
    await page.waitForXPath(
      "//div[contains(@class, 'totalCountText') and text() = '2535']"
    );

    // Assert page updated correctly.
    await assertHeaderTotalCount("2535");
    await assertFacet("Gender", "2535", "female", "1291");
    await assertFacet("Total Exome Sequence", "2535", "0B-10B", "1429");

    // Make sure non-selected facet values are gray.
    facetValueRow = await getFacetValueRow("Samples Overview", "Has Exome BAM");
    const grayDiv = await facetValueRow.$("div.grayText");
    expect(grayDiv).toBeTruthy();

    // Test exporting to saturn.
    await page.click("button[title='Send to Saturn']");
    await page.waitForSelector("#name");
    await page.type("#name", "samples-cohort");
    await Promise.all([page.click("#save"), page.waitFor(15000)]);
    expect(await page.url()).toBe("https://bvdp-saturn-prod.appspot.com/");
  });

  test("Export to Saturn - no selected cohort", async () => {
    await Promise.all([
      page.click("button[title='Send to Saturn']"),
      page.waitFor(15000)
    ]);
    expect(await page.url()).toBe("https://bvdp-saturn-prod.appspot.com/");
  });

  test("Export to Saturn - selected cohort", async () => {
    // Click first Super Population facet value.
    let facetValueRow = await getFacetValueRow("Super Population", "African");
    await facetValueRow.click("input");
    // Wait for data to be returned from backend.
    // See #63 for why we can't wait for div.grayText.
    await page.waitForXPath(
      "//div[contains(@class, 'totalCountText') and text() = '1018']"
    );
    await page.click("button[title='Send to Saturn']");
    await page.waitForSelector("#name");

    await page.type("#name", "test-cohort");
    await Promise.all([page.click("#save"), page.waitFor(15000)]);
    expect(await page.url()).toBe("https://bvdp-saturn-prod.appspot.com/");
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
        await page.waitForXPath("//*[contains(text(), '3714')]");
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
    const totalCount = await page.$eval("div.totalCountText", e => e.innerText);
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
      await facetCard.$eval("span.totalFacetValueCount", node => node.innerText)
    ).toBe(totalCount);
    expect(
      await facetCard.$eval("div.facetValueName", node => node.innerText)
    ).toBe(firstValueName);
    expect(
      await facetCard.$eval("div.facetValueCount", node => node.innerText)
    ).toBe(firstValueCount);
  }

  /**
   * Returns Promise of JSHandle of facetValueRow label.
   */
  async function getFacetValueRow(facetName, valueName) {
    let facetCard = await getFacetCard(facetName);
    let facetValueRow = (await page.evaluateHandle(
      (facetCard, valueName) => {
        let divs = facetCard.querySelectorAll("label");
        for (let div of divs) {
          if (div.innerText.match(valueName)) return div;
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
      const divs = document.querySelectorAll("div.facetCard");
      for (const div of divs) {
        const name = div.querySelector("span").innerText;
        if (name.match(innerFacetName)) return div;
      }
      return null;
    }, facetName)).asElement();
    expect(facetCard).toBeTruthy();
    return facetCard;
  }
});
