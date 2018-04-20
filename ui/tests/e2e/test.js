describe("End-to-end", () => {
  beforeAll(async () => {
    await page.goto("http://localhost:4400");
    await page.waitForSelector("span.datasetName");
  });

  test("Header", async () => {
    await expect(page).toMatch("Test data");
    await assertHeaderTotalCount("1338");
  });

  test("Age facet", async () => {
    await assertFacet("Age", "1338", "10-19", "137");
  });

  test("Faceted search", async () => {
    // Click first Age facet value
    let facetValueRow = await getFacetValueRow("Age", "10-19");
    await facetValueRow.click("input");
    // Wait for data to be returned from backend.
    // See #63 for why we can't wait for div.grayText.
    await page.waitForXPath(
      "//div[contains(@class, 'totalCountText') and text() = '137']"
    );

    // Assert page updated correctly
    await assertHeaderTotalCount("137");
    await assertFacet("Age", "137", "10-19", "137");
    await assertFacet("Gender", "137", "male", "71");

    // Make sure second Age facet value is gray
    facetValueRow = await getFacetValueRow("Age", "20-29");
    const grayDiv = await facetValueRow.$("div.grayText");
    expect(grayDiv).toBeTruthy();
  });

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
    let facetCard = await getFacetCard(facetName);

    // TODO: Simplify after
    // https://github.com/GoogleChrome/puppeteer/issues/2401 is fixed.
    expect(
      await page.evaluate(facetCard => {
        return facetCard.querySelector("span.totalFacetValueCount").innerText;
      }, facetCard)
    ).toBe(totalCount);
    expect(
      await page.evaluate(facetCard => {
        return facetCard.querySelector("div.facetValueName").innerText;
      }, facetCard)
    ).toBe(firstValueName);
    expect(
      await page.evaluate(facetCard => {
        return facetCard.querySelector("div.facetValueCount").innerText;
      }, facetCard)
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
    let facetCard = (await page.evaluateHandle(facetName => {
      let divs = document.querySelectorAll("div.facetCard");
      for (let div of divs) {
        if (div.innerText.match(facetName)) return div;
      }
      return null;
    }, facetName)).asElement();
    expect(facetCard).toBeTruthy();
    return facetCard;
  }
});
