/*

Simple load test. Does 100 simultaneous searches on NHS.
Use NHS because it is a large dataset. (UKBB is also large, but is mostly
numbers. NHS has strings and so is more realistic.)

- Uncomment headless in jest-puppeteer.config.js
- cd ui && ./node_modules/.bin/jest tests/load
- In test window that popped up, login as channing user
- In test window, Ctrl-Pgdown to scroll through all tabs. (See XXX for why
this manual step is needed.) Each tab (except for first) should say "Loading..."
in search box. This means search has started.

*/

const JEST_TIMEOUT_MS = 600 * 1000;

//const DATA_EXPLORER_URL = "https://test-data-explorer.appspot.com";
const DATA_EXPLORER_URL = "http://nhs-explorer.appspot.com";

// Print test name at the beginning of each test
jasmine.getEnv().addReporter({
  specStarted: function(result) {
    console.log(result.fullName);
  }
});

describe("Load test", () => {
  beforeAll(async () => {
    jest.setTimeout(JEST_TIMEOUT_MS);

    debugger;

    await page.goto(DATA_EXPLORER_URL);
    await page.waitForXPath("//div[contains(string(), 'Data Explorer')]", {
      timeout: 0
    });

    // Hide snackbar because it prevents clicking on some facet bars
    await page.evaluate(() => {
      localStorage.setItem("hasShownSnackbarv2", "true");
    });

    await page.reload();
    await page.waitForXPath("//div[contains(string(), 'Data Explorer')]", {
      timeout: 0
    });
  });

  test("Load test", async () => {
    const queries = [
      "pre",
      "men",
      "E950",
      "K559",
      "npar",
      "ova",
      "his",
      "hous",
      "smok",
      "lun",
      "miss",
      "6",
      "fam",
      "surg",
      "preg",
      "vit",
      "can",
      "val",
      "spin",
      "mem"
    ];
    const oneHundredQueries = queries
      .concat(queries)
      .concat(queries)
      .concat(queries)
      .concat(queries);
    await Promise.all(queries.map(q => search(q)));
  });

  async function search(query) {
    const page = await browser.newPage();
    await page.goto(DATA_EXPLORER_URL);
    await page.waitForXPath(
      "//div[contains(text(), 'Search to add a facet')]",
      { timeout: 0 }
    );

    let searchBox = await page.$x(
      "//div[contains(text(), 'Search to add a facet')]"
    );
    await searchBox[0].click();
    await searchBox[0].type(query);
    console.log(`${query} begin ${new Date().getTime()}`);
    let start = Date.now();
    await page.waitForXPath(
      "(//*[text()='No options' or contains(text(), 'Add')])",
      { timeout: 0 }
    );
    console.log(`${query} end ${new Date().getTime()}`);
    let elapsedSec = (Date.now() - start) / 1000;
    console.log(`Search for ${query} took ${elapsedSec} sec`);
    await page.close();
  }
});
