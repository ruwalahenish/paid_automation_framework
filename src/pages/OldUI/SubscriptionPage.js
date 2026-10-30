import { expect, test } from "@playwright/test";
import { VerifyConfirmationMessage } from "../../utils/VerifyConfirmationMessage";
import { fetchEmails } from "../../utils/emailFetcher";
import { createTestLogger } from "../../logging/logger";
import { default as config } from "../../../playwright.config.js";

export class Subscription {
  constructor(page) {
    this.page = page;
    this.newPage = null;
    
    this.logger = createTestLogger(test.info().file);    
    this.subscriptionSideLink = "//p[normalize-space()='Subscriptions']";
    this.selectCus = "//div[@name='customer']";
    this.selectCusDrpdown = "(//div[@role='option'])[2]";
    this.productNamedrpdown = "(//input[@type='text'])[2]";
    this.productName = "(//div[@role='option'])[2]";
    this.startBtn = "//button[.='Start']";
    this.scheduleBtn = "//span[normalize-space()='Schedule']";
    this.scheduleBtnPopup = "//button[@type='submit']";
    this.yesBtn = "//span[normalize-space()='Yes']";
    this.validationToster = "//div[@id='notistack-snackbar']";
    this.addPaymentMethod = "//span[normalize-space()='Add a payment method']";
    this.stripeFrame = "(//iframe[starts-with(@name, '__privateStripeFrame')])[2]";
    this.cardNum = "//input[@name='cardnumber']";
    this.expDate = "//input[@name='exp-date']";
    this.cardCVC = "//input[@name='cvc']";
    this.zipCode = "//input[@name='postal']";
    this.saveBtn = "//span[normalize-space()='Save']";
    this.radioBtnAuto = "//input[@value='charge_automatically']";
    this.radioBtnManual = "//input[@value='send_invoice']";
    this.dueDate = "//input[@inputmode='text']";
    this.subscritionAmount = "//h5[contains(.,'$')]";
    this.totalAmount = "//h6[@class='MuiTypography-root MuiTypography-subtitle1 css-lcsmgs'][contains(.,'$')]";
    this.confirmChkbox = "//input[@type='checkbox']";
    this.payBtn = "//button[@type='submit']";
  }

  async fillCardDetails(frame) {
    await frame.waitForSelector(this.cardNum);
    await frame.fill(this.cardNum, process.env.CARD_NUMBER);
    await frame.fill(this.expDate, process.env.CARD_EXP_DATE);
    await frame.fill(this.cardCVC, process.env.CARD_CVC);
  }

  async startSubscription() {
    await this.page.click(this.subscriptionSideLink);
    await this.page.click(this.selectCus);
    await this.page.click(this.selectCusDrpdown);
    await this.page.click(this.radioBtnManual);
    await this.page.waitForSelector(this.dueDate);

    const actualDueDate = await this.page.$eval(this.dueDate, el => el.value);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const dayString = tomorrow.getDate().toString().padStart(2, "0");
    const monthString = (tomorrow.getMonth() + 1).toString().padStart(2, "0");
    const expDueDate = `${dayString}/${monthString}/${tomorrow.getFullYear()}`;
    console.log({ actualDueDate, expDueDate });

    expect(actualDueDate).toBe(expDueDate);

    await this.page.click(this.productNamedrpdown);
    await this.page.click(this.productName);

    let totalPrice = await this.page.locator(this.totalAmount).textContent();
    totalPrice = totalPrice.replace(/\s/g, "");
    console.log(`Total Price: ${totalPrice}`);

    await this.page.click(this.startBtn);
    await this.page.click(this.yesBtn);

    await VerifyConfirmationMessage(this.page, this.validationToster, "Subscription created successfully!");

    const EXPECTED_SUBJECT = `Invoice for Subscription from ${process.env.BUSINESS_NAME}`;
    const link = await fetchEmails(EXPECTED_SUBJECT);

    if (!link) throw new Error("No matching email or link found.");

    console.log("Opening link in new tab...");
    this.newPage = await this.page.context().newPage();
    await this.newPage.goto(link);
    await this.newPage.waitForLoadState();
    await expect(this.newPage).toHaveURL(`${config.use.baseURL}/pay-invoice`);

    await this.logger.info("Successfully opened the invoice link in a new tab.");

    await this.newPage.waitForSelector(this.subscritionAmount);
    let subscritionAmount = await this.newPage.locator(this.subscritionAmount).textContent();
    subscritionAmount = subscritionAmount.replace(/\s/g, "");
    console.log(`Email Invoice Amount: ${subscritionAmount}`);

    expect(subscritionAmount).toBe(totalPrice);

    const cardDetailsFrame = await this.newPage.waitForSelector(this.stripeFrame);
    const frame = await cardDetailsFrame.contentFrame();

    await this.fillCardDetails(frame);

    await this.newPage.bringToFront();
    await this.newPage.click(this.confirmChkbox);
    await this.newPage.locator(this.payBtn).isEnabled();
    await this.newPage.click(this.payBtn);

    await VerifyConfirmationMessage(this.newPage, this.validationToster, "Payment successful!");
    await this.newPage.close();
    await this.page.bringToFront();
  }

  async scheduleSubscription() {
    await this.page.click(this.subscriptionSideLink);
    await this.page.click(this.selectCus);
    await this.page.click(this.selectCusDrpdown);
    await this.page.click(this.radioBtnManual);
    await this.page.waitForSelector(this.dueDate);

    const actualDueDate = await this.page.$eval(this.dueDate, el => el.value);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const dayString = tomorrow.getDate().toString().padStart(2, "0");
    const monthString = (tomorrow.getMonth() + 1).toString().padStart(2, "0");
    const expDueDate = `${dayString}/${monthString}/${tomorrow.getFullYear()}`;
    console.log({ actualDueDate, expDueDate });

    expect(actualDueDate).toBe(expDueDate);

    await this.page.click(this.productNamedrpdown);
    await this.page.click(this.productName);

    let totalPrice = await this.page.locator(this.totalAmount).textContent();
    totalPrice = totalPrice.replace(/\s/g, "");
    console.log(`Total Price: ${totalPrice}`);

    await this.page.click(this.scheduleBtn);
    await this.page.click(this.scheduleBtnPopup);
    await this.page.click(this.yesBtn);

    await VerifyConfirmationMessage(this.page, this.validationToster, "Subscription scheduled successfully!");

    const EXPECTED_SUBJECT = `Invoice for Subscription from ${process.env.BUSINESS_NAME}`;
    const link = await fetchEmails(EXPECTED_SUBJECT);

    if (!link) throw new Error("No matching email or link found.");

    console.log("Opening link in new tab...");
    this.newPage = await this.page.context().newPage();
    
    await this.newPage.goto(link);
    await this.newPage.waitForLoadState();

    let currentUrl = this.newPage.url();
    console.log("Initial URL from email:", currentUrl);

    if (currentUrl.includes("https://dev.paid.com")) {
      const stagingUrl = currentUrl.replace("https://dev.paid.com", "https://staging.paid.com");
      console.log("Redirecting to staging URL:", stagingUrl);

      await this.newPage.goto(stagingUrl);
      await this.newPage.waitForLoadState();

      currentUrl = this.newPage.url(); // update to new URL
    } 

    
    await expect(currentUrl).toMatch(/^https:\/\/staging\.paid\.com\/pay-invoice/);
    await this.logger.info("Successfully opened the invoice link in staging.");

  await this.logger.info("Successfully opened the invoice link in a new tab.");

  await this.newPage.waitForSelector(this.subscritionAmount);
  let subscritionAmount = await this.newPage.locator(this.subscritionAmount).textContent();
  subscritionAmount = subscritionAmount.replace(/\s/g, "");
  console.log(`Email Invoice Amount: ${subscritionAmount}`);

    expect(subscritionAmount).toBe(totalPrice);

    const cardDetailsFrame = await this.newPage.waitForSelector(this.stripeFrame);
    const frame = await cardDetailsFrame.contentFrame();

    await this.fillCardDetails(frame);

    await this.newPage.bringToFront();




    
    await this.newPage.click(this.confirmChkbox);
    await this.newPage.locator(this.payBtn).isEnabled();
  await this.newPage.click(this.payBtn);

    await VerifyConfirmationMessage(this.newPage, this.validationToster, "Payment successful!");
    await this.newPage.close();
    await this.page.bringToFront();
  }
}
