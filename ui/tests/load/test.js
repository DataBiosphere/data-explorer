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

    /*
    await loginGoogle();
    await loginDataExplorer();
*/

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
    //    const queries = ["pre", "men"];
    await Promise.all(queries.map(q => search(q)));
  });

  async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function loginGoogle() {
    console.log("Logging into Google");
    const page = await browser.newPage();
    // If this isn't set, get different login pages depending on headless
    //    await page.setJavaScriptEnabled(false);
    debugger;
    const navigationPromise = page.waitForNavigation({
      waitUntil: "networkidle2"
    });

    // This login page is same regardless of headless
    // https://accounts.google.com/login?hl=en is different for headless
    //    await page.goto("https://accounts.google.com/ServiceLogin?nojavascript=1", { waitUntil: 'networkidle2' });
    await page.goto("https://accounts.google.com/login?hl=en", {
      waitUntil: "networkidle2"
    });

    await page.waitForSelector("input[type=email]");
    await page.type("input[type=email]", process.argv[3]);
    await page.click("#next");
    await navigationPromise;

    await page.waitForSelector("input[type=password]", { visible: true });
    await page.type("input[type=password]", process.argv[4]);
    await page.click("#signIn");

    // 2FA
    await page.screenshot({ path: "login1.png" });
    await page.waitForSelector("input[type=tel]", { visible: true });
    await page.type("input[type=tel]", process.argv[5]);
    await page.click("#submit");
    page.close();
  }

  async function loginDataExplorer() {
    console.log("Logging into " + DATA_EXPLORER_URL);
    const page = await browser.newPage();
    const navigationPromise = page.waitForNavigation({
      waitUntil: "networkidle2"
    });

    await page.goto(DATA_EXPLORER_URL, { waitUntil: "networkidle2" });

    await page.waitForSelector("input[type=email]");
    await page.type("input[type=email]", process.argv[3]);
    await page.click("span.snByac");
    await navigationPromise;

    await page.waitForSelector("input[type=password]", { visible: true });
    await page.type("input[type=password]", process.argv[4]);
    await page.click("span.snByac");
  }

  async function search(query) {
    //    const context = await browser.createIncognitoBrowserContext();
    //   const page = await context.newPage();
    const page = await browser.newPage();
    await page.goto(DATA_EXPLORER_URL);
    await page.waitForXPath("//div[contains(text(), 'Search to add a facet')]");
    //    await page.waitForSelector(".jss110");
    //   await page.click(".jss110");
    //await page.evaluate(() => {
    //document.querySelector('.jss110').click();
    //});

    let searchBox = await page.$x(
      "//div[contains(text(), 'Search to add a facet')]"
    );
    await searchBox[0].click();
    await searchBox[0].type(query);
    //await page.screenshot({ path: `${query} 1.png` });
    console.log(`${query} begin ${new Date().getTime()}`);
    let start = Date.now();
    await page.waitForXPath(
      "(//*[text()='No options' or contains(text(), 'Add')])"
    );
    console.log(`${query} end ${new Date().getTime()}`);
    let elapsedSec = (Date.now() - start) / 1000;
    console.log(`Search for ${query} took ${elapsedSec} sec`);
    //await page.screenshot({ path: `${query} 2.png` });
    await page.close();
  }
});
