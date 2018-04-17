describe("End-to-end", () => {
  beforeAll(async () => {
    await page.goto("http://localhost:4400");
  });

  test("Header", async () => {
    await expect(page).toMatch("Test data");
    await assertHeaderTotalCount("1338");
  });

  test("Age facet", async () => {
    await assertFacet("Age", "1338", "10-19", "137");
  });

  test("Faceted search", async () => {
    // Click first checkbox in Age facet
    await page.click("input");
    await assertHeaderTotalCount("137");
    await assertFacet("Age", "137", "10-19", "137");
    // Make second Age facet value is gray
    const grayFacetValue = await page.$eval("div.grayText", e => e.innerText);
    await expect(grayFacetValue).toMatch("20-29"); // Facet value name
    await expect(grayFacetValue).toMatch("280"); // Facet value count
    // Make sure Gender facet was updated correctly
    await assertFacet("Gender", "137", "male", "71");
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
    const facetCard = (await page.evaluateHandle(facetName => {
      const divs = document.querySelectorAll("div.facetCard");
      for (const div of divs) {
        if (div.innerText.match(facetName)) return div;
      }
      return null;
    }, facetName)).asElement();
    expect(facetCard).toBeTruthy();

    // TODO: Simplify after
    // https://github.com/GoogleChrome/puppeteer/issues/2401 is fixed.
    expect(
      await page.evaluate(card => {
        return card.querySelector("span.totalFacetValueCount").innerText;
      }, facetCard)
    ).toBe(totalCount);
    expect(
      await page.evaluate(card => {
        return card.querySelector("div.facetValueName").innerText;
      }, facetCard)
    ).toBe(firstValueName);
    expect(
      await page.evaluate(card => {
        return card.querySelector("div.facetValueCount").innerText;
      }, facetCard)
    ).toBe(firstValueCount);
  }
});
