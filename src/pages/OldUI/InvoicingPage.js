import { expect,test } from "@playwright/test";
import { VerifyConfirmationMessage } from "../../utils/VerifyConfirmationMessage";
import { fetchEmails } from "../../utils/emailFetcher";
import { default as config } from "../../../playwright.config.js";
import { createTestLogger } from "../../logging/logger.js";

export class Invoicing {
  constructor(page) {
    this.page = page;
    this.newPage = null;
    this.expectedDueDate = null;
    this.totalInvoiceAmount = null;
    this.logger = createTestLogger(test.info().file);
    this.invoicingSideLink = "//p[normalize-space()='Invoicing']";
    this.selectCus = "//div[@name='customer']";
    this.selectCusDrpdown = "(//div[@role='option'])[2]";
    this.duedatedrpdown = "//div[contains(text(),'Due upon receipt')]";
    this.dueDate = "//input[@inputmode='text']";
    this.productNamedrpdown = "(//input[@type='text'])[2]";
    this.productName = "(//div[@role='option'])[2]";
    this.proSelCurrencyDrpDown = "(//div[@role='combobox'])[2]";
    this.CurrencyValue = `//li[normalize-space()='${process.env.CURRENCY}']`;
    this.totalAmount =
      "//div[contains(@class, 'MuiStack-root')]//h6[@class='MuiTypography-root MuiTypography-subtitle1 css-lcsmgs'][contains(text(), '$')]";
    this.sendBtn = "//button/span[normalize-space()='Send']";
    this.previewAmount = "(//td[contains(text(), '$')])[2]";
    this.previewSendBtn = "(//button/span[normalize-space()='Send'])[2]";
    this.validationToster = "//div[@id='notistack-snackbar']";
    this.stripeFrame =
      "(//iframe[starts-with(@name, '__privateStripeFrame')])[2]";
    this.cardNum = "//input[@name='cardnumber']";
    this.expDate = "//input[@name='exp-date']";
    this.cardCVC = "//input[@name='cvc']";
    this.zipCode = "//input[@name='postal']";
    this.confirmChkbox = "//input[@type='checkbox']";
    this.payBtn = "//button[@type='submit']";
    this.invoiceAmount =
      "//h5[contains(.,'$')]"; //In Email
  }

  async SendInvoice() {
    await this.page.click(this.invoicingSideLink);

    //Selecting Customer
    await this.page.click(this.selectCus);
    await this.page.click(this.selectCusDrpdown);

    // Checking the Due Date
    const actualDueDate = await this.page.$eval(
      this.dueDate,
      (element) => element.value
    );
    console.log(actualDueDate);

    // Getting expected due date in the same format
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1); // Incrementing the date by 1 to get tomorrow's date

    // Formatting day with leading zero if necessary
    const day = tomorrow.getDate();
    const dayString = day <= 9 ? "0" + day : day;

    // Formatting month with leading zero if necessary
    const month = tomorrow.getMonth() + 1;
    const monthString = month <= 9 ? "0" + month : month;

    const expDueDate =
      dayString + "/" + monthString + "/" + tomorrow.getFullYear();
    console.log(expDueDate);

    // Comparing dates
    if (actualDueDate === expDueDate) {
      expect(this.dueDate).toBeTruthy();
    } else {
      expect(this.dueDate).toBeFalsy();
    }

    //Product Selection
    await this.page.click(this.productNamedrpdown);
    await this.page.click(this.productName);

    await this.page.click(this.proSelCurrencyDrpDown);
    await this.page.click(this.CurrencyValue);

    let totalPrice = await this.page.locator(this.totalAmount).textContent();
    totalPrice = totalPrice.split(" ").join("");
    console.log(totalPrice);

    await this.page.click(this.sendBtn);

    let previewPrice = await this.page
      .locator(this.previewAmount)
      .textContent();
    previewPrice = previewPrice.split(" ").join("");
    console.log(previewPrice);

    expect(previewPrice).toBe(totalPrice);

    await this.page.click(this.previewSendBtn);
    await VerifyConfirmationMessage(
      this.page,
      this.validationToster,
      "Invoice sent successfully."
    );

   //Check email is sent or not
   const EXPECTED_SUBJECT = `Invoice from ${process.env.BUSINESS_NAME}`;
   console.log(EXPECTED_SUBJECT);

   console.log("Fetching emails...");
   const link = await fetchEmails(EXPECTED_SUBJECT);

   if (link) {
     console.log("Opening link in new tab...");
     this.newPage = await this.page.context().newPage();
     await this.newPage.goto(link);
     await this.newPage.waitForLoadState();
     await expect(this.newPage).toHaveURL(
       `${config.use.baseURL}/pay-invoice`
     );
     this.logger.info("Successfully opened the invoice link in a new tab.");
   } else {
     console.log("No matching email or link found.");
   }

    await this.newPage.waitForSelector(this.invoiceAmount);

    //invoice Amount in email
    let invoiceAmount = await this.newPage.locator(this.invoiceAmount).textContent();
    invoiceAmount = invoiceAmount.split(" ").join("");
    console.log(invoiceAmount);

    expect(invoiceAmount).toBe(totalPrice);

    //Entering the Payment Details
    const cardDetailsFrame = await this.newPage.waitForSelector(this.stripeFrame); // Wait for the iframe to appear

    // Switch to the iframe context
    const frame = await cardDetailsFrame.contentFrame();

    // Now interact with elements inside the iframe
    await frame.waitForSelector(this.cardNum);
    await frame.fill(this.cardNum, process.env.CARD_NUMBER);
    await frame.fill(this.expDate, process.env.CARD_EXP_DATE);
    await frame.fill(this.cardCVC, process.env.CARD_CVC);;

    // Exiting the iframe
    await this.newPage.bringToFront();

    await this.newPage.click(this.confirmChkbox);

    await this.newPage.locator(this.payBtn).isEnabled();
    await this.newPage.click(this.payBtn);

    //Payment successful!
    await VerifyConfirmationMessage(
      this.newPage,
      this.validationToster,
      "Payment successful!"
    );
    // Close the new tab
    await this.newPage.close();

    // Switch back to the old tab
    await this.page.bringToFront();
  }
};
