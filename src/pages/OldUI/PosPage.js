import { expect } from "@playwright/test";


export class POS {
  constructor(page) {
    this.page = page;
    this.posSideLink = "//p[normalize-space()='Point Of Sale']";
    this.posLogo = "//p[.='Point of Sale']";
  }

  async CheckPOSRedirection() {
    // Click the link to open the new page
    await this.page.click(this.posSideLink);

    const newTabPromise = this.page.waitForEvent("popup");
    const newTab = await newTabPromise;
    //wait for Load
    await newTab.waitForLoadState();

    await newTab.waitForSelector(this.posLogo);

    // Get the URL of the new page
    const newPageUrl = newTab.url();

    const expectedUrl = "https://devpos.paid.com/checkout";

    expect(newPageUrl).toBe(expectedUrl);

    // Close the new page
    await newTab.close();
  }
};
