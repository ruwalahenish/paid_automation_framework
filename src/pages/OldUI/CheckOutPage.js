import { expect,test } from "@playwright/test";
import { VerifyConfirmationMessage } from "../../utils/VerifyConfirmationMessage";
import { generateRandomString } from "../../utils/GenerateRandomString";
import { createTestLogger } from "../../logging/logger";

export class Checkout {
  constructor(page) {
    this.page = page;
    this.newPage=null;
    this.copiedCheckoutLink = null;
    this.logger = createTestLogger(test.info().file);
    this.checkoutSideLink = "//p[normalize-space()='Checkout']";
    this.productNamedrpdown = "//input[@role='combobox']";
    this.productName = "(//div[@role='option'])[2]";
    this.totalAmount =
      "//div[contains(@class, 'MuiStack-root')]//h6[@class='MuiTypography-root MuiTypography-subtitle1 css-lcsmgs'][contains(text(), '$')]";
    this.validationToster = "//div[@id='notistack-snackbar']";
    this.saveCheckoutBtn = "//span[normalize-space()='Save and Turn On']";
    this.copyLinkBtn = "//span[normalize-space()='Copy to clipboard']";
    this.copyLink = "//p[contains(text(),'https://dev.paid.com')]";
    this.checkoutAmount =
      "//h5[contains(.,'$')]";
    this.cusFirstName = "//input[@name='firstName']";
    this.cusLastName = "//input[@name='lastName']";
    this.cusEmail = "//input[@name='email']";
    this.stripeFrame =
      "(//iframe[starts-with(@name, '__privateStripeFrame')])[2]";
    this.cardNum = "//input[@name='cardnumber']";
    this.expDate = "//input[@name='exp-date']";
    this.cardCVC = "//input[@name='cvc']";
    this.zipCode = "//input[@name='postal']";
    this.confirmChkbox = "//input[@type='checkbox']";
    this.payBtn = "//button[@type='submit']";
    this.confirmMessage =
      "//h5[contains(.,'Checkout has been paid successfully.')]";
  }

  async addCheckOut() {
    await this.page.click(this.checkoutSideLink);

    //Product Selection
    await this.page.click(this.productNamedrpdown);
    await this.page.click(this.productName);

    //Total Amount
    let totalPrice = await this.page.locator(this.totalAmount).textContent();
    totalPrice = totalPrice.split(" ").join("");
    console.log(totalPrice);

    await this.page.click(this.saveCheckoutBtn);

    await VerifyConfirmationMessage(
      this.page,
      this.validationToster,
      "Checkout added successfully!"
    );

    await this.page.waitForSelector(this.copyLinkBtn);
    await this.page.click(this.copyLinkBtn);

    // Wait for clipboard to be updated and retrieve the copied link
      this.copiedCheckoutLink = await this.page.evaluate(() =>
        navigator.clipboard.readText()
      );

      console.log("Copied Checkout Link:", this.copiedCheckoutLink);

    // Modify the copied link by replacing "dev" with "sandbox" only if "dev" is present
    let modifiedLink = this.copiedCheckoutLink;
    if (this.copiedCheckoutLink.includes("dev")) {
      modifiedLink = this.copiedCheckoutLink.replace("dev", "sandbox");
    }
    // Log the modified link if it's different from the original link
    if (modifiedLink !== this.copiedCheckoutLink) {
      console.log(modifiedLink);
    }

    // Wait for the new page to open
    this.newPage = await this.page.context().newPage();
    console.log(this.copiedCheckoutLink);

    await this.newPage.goto(this.copiedCheckoutLink)

    await this.newPage.waitForSelector(this.checkoutAmount);

    //invoice Amount in email
    let checkoutAmount = await this.newPage
      .locator(this.checkoutAmount)
      .textContent();
    checkoutAmount = checkoutAmount.split(" ").join("");
    console.log(checkoutAmount);

    expect(checkoutAmount).toBe(totalPrice);

    //Entering the Customer Details
    await this.newPage.fill(this.cusFirstName, generateRandomString(5));
    await this.newPage.fill(this.cusLastName, generateRandomString(5));
    await this.newPage.fill(
      this.cusEmail,
      "qapaid+" + generateRandomString(5) + "@gmail.com"
    );

    //Entering the Payment Details
    const cardDetailsFrame = await this.newPage.waitForSelector(this.stripeFrame); // Wait for the iframe to appear

    // Switch to the iframe context
    const frame = await cardDetailsFrame.contentFrame();

    // Now interact with elements inside the iframe
    await frame.waitForSelector(this.cardNum);
    await frame.fill(this.cardNum, process.env.CARD_NUMBER);
    await frame.fill(this.expDate, process.env.CARD_EXP_DATE);
    await frame.fill(this.cardCVC, process.env.CARD_CVC);

    // Exiting the iframe
    await this.newPage.bringToFront();

    await this.newPage.click(this.confirmChkbox);

    await this.newPage.locator(this.payBtn).isEnabled();
    await this.newPage.click(this.payBtn);

    await this.newPage.waitForSelector(this.confirmMessage);

    // Close the new tab
    await this.newPage.close();

    // Switch back to the old tab
    await this.page.bringToFront();

  }
};
