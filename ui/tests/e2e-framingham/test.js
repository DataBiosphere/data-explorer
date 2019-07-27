const JEST_TIMEOUT_MS = 120 * 1000;

// Print test name at the beginning of each test
jasmine.getEnv().addReporter({
  specStarted: function(result) {
    console.log(result.fullName);
  }
});

describe("End-to-end framingham heart study teaching", () => {
  beforeAll(async () => {
    // It can take a while for servers to start up
    jest.setTimeout(JEST_TIMEOUT_MS);
    await waitForElasticsearchIndex();

    // Hide snackbar because it prevents clicking on some facet bars
    await page.goto("http://localhost:4400", { timeout: 120000 });
    await page.waitForSelector("[class*='datasetName']");
    await page.evaluate(() => {
      localStorage.setItem("hasShownSnackbarv2", "true");
    });
  });

  beforeEach(async () => {
    await page.goto("http://localhost:4400", { timeout: 120000 });
    await page.waitForSelector("[class*='datasetName']");
  });

  test("Age facet", async () => {
    // Assert facet rendered correctly
    await assertFacet("AGE", "80-89", ["0", "0", "9"]);

    // Click on facet bar and assert page updated correctly
    let facetBar = await getFacetBar("AGE", "60-69", "2");
    await facetBar.click("");
    await waitForFacetsUpdate(1083);
    await assertFacet("AGE", "70-79", ["0", "231", "440"]);
    await assertFacet("GLUCOSE", "400-449", ["0", "1", "0"]);

    // Make sure unselected facet value bar is dimmed
    facetBar = await getFacetBar("AGE", "50-59", "2");
    const barColor = await page.evaluate(bar => bar.style.fill, facetBar);
    // Vega translates our hex colors to rgb so it must be validated this way.
    expect(barColor).toBe("rgb(191, 225, 240)");
  });

  test("Glucose facet", async () => {
    // Assert facet rendered correctly
    await assertFacet("GLUCOSE", "450-499", ["0", "0", "1"]);

    // Click on facet bar and assert page updated correctly
    let facetBar = await getFacetBar("GLUCOSE", "150-199", "3");
    await facetBar.click("");
    await waitForFacetsUpdate(42);
    await assertFacet("TIME", "4000-4999", ["0", "0", "41"]);

    // Make sure unselected facet value bar is dimmed
    facetBar = await getFacetBar("GLUCOSE", "50-99", "3");
    const barColor = await page.evaluate(bar => bar.style.fill, facetBar);
    // Vega translates our hex colors to rgb so it must be validated this way.
    expect(barColor).toBe("rgb(191, 225, 240)");
  });

  test("Search box - time series chips", async () => {
    // Click on facet bar and assert chip is added
    let facetBar = await getFacetBar("AGE", "40-49", "1");
    await facetBar.click("");
    await waitForFacetsUpdate(1692);
    await waitForChip("AGE (Period 1)=40-49");

    // Click on facet bar again and assert chip is deleted
    facetBar = await getFacetBar("AGE", "40-49", "1");
    await facetBar.click("");
    await waitForFacetsUpdate(4434);
    chips = await page.$x("//div[text()='AGE (Period 1)=40-49']");
    expect(chips.length).toBe(0);

    // Click on facet bar, click on chip "x", assert facet value is unselected
    facetBar = await getFacetBar("AGE", "40-49", "1");
    await facetBar.click("");
    await waitForFacetsUpdate(1692);
    let chipX = await page.waitForXPath(
      "//div[text()[contains(.,'AGE (Period 1)=40-49')]]/../div[2]"
    );
    chipX.click();
    await waitForFacetsUpdate(4434);
  });

  test("Search box - add facet", async () => {
    // Type "bm" into search box and select result that adds BMI
    // facet.
    let searchBox = await page.$x(
      "//div[contains(text(), 'Search to add a facet')]"
    );
    await searchBox[0].click();
    await searchBox[0].type("bm");
    let searchResult = await page.waitForXPath("//span[contains(., 'BMI')]");
    await searchResult.click();

    // Select a bar in BMI facet
    await waitForFacet("BMI");
    let facetBar = await getFacetBar("BMI", "30-39", "1");
    await facetBar.click("");

    // Assert BMI facet was added
    await waitForFacetsUpdate(548);
    await assertFacet("BMI", "50-59", ["2", "0", "0"]);

    // Click on 'x' in facet header, make sure filter was removed
    let header = await page.waitForXPath(
      "//div[contains(@class, 'FacetHeader-facetHeader') and contains(., 'BMI')]"
    );
    await header.hover();
    let closeIcon = await page.waitForSelector(
      "div[class^='FacetHeader-closeIcon-']"
    );
    await closeIcon.click();
    await waitForFacetsUpdate(4434);
  });

  test("Framingham Teaching Data Explorer URL works", async () => {
    // Add BPMEDS extra facet and select BPMEDS=0 at Period 2.
    let searchBox = await page.$x(
      "//div[contains(text(), 'Search to add a facet')]"
    );
    await searchBox[0].click();
    await searchBox[0].type("BPMEDS");
    let result = await page.waitForXPath("//span[contains(text(), 'Add')]");
    await result.click();
    await waitForFacet("BPMEDS");
    let facetBar = await getFacetBar("BPMEDS", "0", "2");
    await facetBar.click();
    await waitForFacetsUpdate(3473);

    // Select 0-49, 50-99, 100-149 for GLUCOSE in Period 2, and select
    // 50-99 for GLUCOSE in Period 1.
    facetBar = await getFacetBar("GLUCOSE", "0-49", "2");
    await facetBar.click("");
    await waitForFacetsUpdate(9);
    facetBar = await getFacetBar("GLUCOSE", "50-99", "2");
    await facetBar.click("");
    await waitForFacetsUpdate(2743);
    facetBar = await getFacetBar("GLUCOSE", "100-149", "2");
    await facetBar.click("");
    await waitForFacetsUpdate(3000);
    facetBar = await getFacetBar("GLUCOSE", "50-99", "1");
    await facetBar.click("");
    await waitForFacetsUpdate(2521);

    // Reload page with current URL. This simulates exporting URL to Terra and
    // opening exported URL.
    await page.goto(page.url());

    // This confirms the right extra facets and filters were rendered.
    await waitForFacetsUpdate(2521);
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
        await page.goto(
          "http://localhost:9200/framingham_heart_study_teaching_dataset/type/_count"
        );
        await page.waitForXPath("//*[contains(text(), '4434')]");
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
  async function assertFacet(facetName, firstValueName, firstValueCounts) {
    const facet = await getFacet(facetName);
    expect(
      await facet.$eval(
        "*[class*='FacetHeader-facetName-']",
        node => node.innerText
      )
    ).toBe(facetName);

    for (let col = 0; col < firstValueCounts.length; col++) {
      // Get the first bar element in each column of the facet and hover over it.
      const topBar = (await page.evaluateHandle(
        (facet, firstValueName, col) => {
          const barsContainer = facet.querySelectorAll(
            "*[class*='mark-rect role-mark child_marks']"
          )[col];
          let valueIdx = 0;
          // For numeric facets, paths are in reverse order; the top facet bar is
          // the last path.
          if ("0123456789".includes(firstValueName[0])) {
            valueIdx = barsContainer.childElementCount / 2 - 1;
          }
          // Hover over transparent bar instead of visible bar, so
          // that this function works when the count is 0.
          valueIdx += barsContainer.childElementCount / 2;
          return barsContainer.querySelectorAll("path")[valueIdx];
        },
        facet,
        firstValueName,
        col
      )).asElement();
      await topBar.hover();

      // Wait for the tooltip to show up and assert the text is correct.
      await page.waitForXPath("//*[contains(text(), 'cursor: pointer')]");
      const tooltipText = await page.evaluate(
        () => document.querySelector("*[class*='vg-tooltip']").innerHTML
      );
      expect(tooltipText).toBe(firstValueName + ": " + firstValueCounts[col]);
    }
  }

  /**
   * Returns Promise of JSHandle of facet value bar.
   * facet value name is checked against axis label. Do NOT use for values where
   * axis label is truncated with ellipses (eg "Has WGS Low Cov...").
   */
  async function getFacetBar(facetName, value, tsv) {
    let facet = await getFacet(facetName);

    // Get facet value (row) index
    let valueIdx = await page.evaluate(
      (facet, value) => {
        const labelsContainer = facet.querySelectorAll(
          "*[class*='mark-text role-axis-label']"
        )[0];
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

    // Get time series value (column) index
    let tsvIdx = await page.evaluate(
      (facet, tsv) => {
        const labelsContainer = facet.querySelectorAll(
          "*[class*='mark-group role-column-footer column_footer']"
        )[0];
        const labels = labelsContainer.querySelectorAll("text");
        var tsvIdx;
        for (let i = 0; i < labels.length; i++) {
          if (labels[i].innerHTML == tsv) {
            tsvIdx = i;
          }
        }
        return tsvIdx;
      },
      facet,
      tsv
    );

    // Select the path element at this index
    const facetBar = (await page.evaluateHandle(
      (facet, row, col) => {
        const barsContainer = facet.querySelectorAll(
          "*[class*='mark-rect role-mark child_marks']"
        )[col];
        return barsContainer.querySelectorAll("path")[row];
      },
      facet,
      valueIdx,
      tsvIdx
    )).asElement();
    expect(facetBar).toBeTruthy();
    return facetBar;
  }

  async function getFacet(facetName) {
    const facet = (await page.evaluateHandle(innerFacetName => {
      const divs = document.querySelectorAll(
        "*[class*='TimeSeriesFacet-timeSeriesFacet-']"
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

  async function waitForFacet(facetName) {
    await page.waitForXPath(
      "//*[contains(@class, 'FacetHeader-facetName-') and contains(text(),'" +
        facetName +
        "')]"
    );
  }
});
