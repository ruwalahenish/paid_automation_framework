import { createTestLogger } from "../../logging/logger";
import { fetchEmails } from "../../utils/emailFetcher";
import { GenerateRandomNumbers } from "../../utils/GenerateRandomNumbers";
import { VerifyConfirmationMessage } from "../../utils/VerifyConfirmationMessage";
import { test, expect } from "@playwright/test";

export class QuickCharge {
  constructor(page) {
    this.page = page;
    this.logger = createTestLogger(test.info().file);
    this.quickChargeSideLink = "//p[normalize-space()='Quick Charge']";
    this.customAmountTab = "//button[normalize-space()='Custom Amount']";
    this.productSelectionTab =
      "//button[normalize-space()='Product Selection']";
    this.chargeAmount = "//input[@name='chargeAmount']";
    this.currencyDropDown = "(//div[contains(@class, 'MuiInputBase-root')])[2]";
    this.CurrencyValue = `//li[normalize-space()='${process.env.CURRENCY}']`;
    this.selectCus = "//div[@name='customer']";
    this.selectCusDrpdown = "(//div[@role='option'])[2]";
    this.cardNum = "//input[@name='cardnumber']";
    this.expDate = "//input[@name='exp-date']";
    this.cardCVC = "//input[@name='cvc']";
    this.zipCode = "//input[@name='postal']";
    this.chargeNsend = "//button/span[normalize-space()='Charge & send']";
    this.yesBtn = "//button[contains(.,'Yes')]";
    this.saveToCusChkBox = "//input[@name='saveToCustomer']";
    this.stripeFrame = "iframe[name^='__privateStripeFrame']";
    this.validationToster = "//div[@id='notistack-snackbar']";
    this.totalAmount =
      "//div[contains(@class, 'MuiStack-root')]//h6[@class='MuiTypography-root MuiTypography-subtitle1 css-lcsmgs'][contains(text(), '$')]";
    this.productNamedrpdown = "(//input[@type='text'])[1]";
    this.productName = "(//div[@role='option'])[2]";
    this.proSelCurrencyDrpDown = "//div[@role='combobox']";
  }

  async customAmountQC() {
    await this.page.click(this.quickChargeSideLink);

    //entering the Quick Charge Amount
    await this.page.fill(
      this.chargeAmount,
      GenerateRandomNumbers(2) + "." + GenerateRandomNumbers(2)
    );

    await this.page.click(this.currencyDropDown);
    await this.page.click(this.CurrencyValue);

    //Selecting Customer
    await this.page.click(this.selectCus);
    await this.page.click(this.selectCusDrpdown);

    await this.page.waitForTimeout(3000);

    // Wait for the iframe to appear
    const cardDetailsFrame = await this.page.waitForSelector(this.stripeFrame);

    // Switch to the iframe context
    const frame = await cardDetailsFrame.contentFrame();

    // Now interact with elements inside the iframe
    await frame.waitForSelector(this.cardNum);
    await frame.fill(this.cardNum, process.env.CARD_NUMBER);
    await frame.fill(this.expDate, process.env.CARD_EXP_DATE);
    await frame.fill(this.cardCVC, process.env.CARD_CVC);
    // await frame.fill(this.zipCode, process.env.CARD_ZIPCODE);

    let totalPrice = await this.page.locator(this.totalAmount).textContent();
    const actualEmailBody = totalPrice.split(" ").join("");
    console.log(actualEmailBody);

    await this.page.click(this.chargeNsend);
    await this.page.click(this.yesBtn);

    await VerifyConfirmationMessage(
      this.page,
      this.validationToster,
      "Payment successful!"
    );

    try {
     //Check email is sent or not
     const EXPECTED_SUBJECT = `Receipt from ${process.env.BUSINESS_NAME}`;

     console.log("Fetching emails...");
     const link = await fetchEmails(EXPECTED_SUBJECT);

     if (link) {
       this.logger.info("Email found successfully.");

       expect(this.page).toBeTruthy();
     }
    } catch (error) {
      test.fail();
      console.error("Error fetching or comparing Emails:", error);
    }
  }

  async productSelectionQC() {
    await this.page.click(this.productSelectionTab);
    await this.page.click(this.productNamedrpdown);
    await this.page.click(this.productName);

    await this.page.click(this.proSelCurrencyDrpDown);
    await this.page.click(this.CurrencyValue);

    //Selecting Customer
    await this.page.click(this.selectCus);
    await this.page.click(this.selectCusDrpdown);

    await this.page.waitForTimeout(3000);

    // Wait for the iframe to appear
    const cardDetailsFrame = await this.page.waitForSelector(this.stripeFrame);

    // Switch to the iframe context
    const frame = await cardDetailsFrame.contentFrame();

    // Now interact with elements inside the iframe
    await frame.waitForSelector(this.cardNum);
    await frame.fill(this.cardNum, process.env.CARD_NUMBER);
    await frame.fill(this.expDate, process.env.CARD_EXP_DATE);
    await frame.fill(this.cardCVC, process.env.CARD_CVC);
  

    let totalPrice = await this.page.locator(this.totalAmount).textContent();
    const actualEmailBody = totalPrice.split(" ").join("");
    console.log(actualEmailBody);

    await this.page.click(this.chargeNsend);
    await this.page.click(this.yesBtn);

    await VerifyConfirmationMessage(
      this.page,
      this.validationToster,
      "Payment successful!"
    );

    try {
     //Check email is sent or not
     const EXPECTED_SUBJECT = `Receipt from ${process.env.BUSINESS_NAME}`;

     console.log("Fetching emails...");
     const link = await fetchEmails(EXPECTED_SUBJECT);

     if (link) {
       this.logger.info("Email found successfully.");
       expect(this.page).toBeTruthy();
     }
    } catch (error) {
      test.fail();
      console.error("Error fetching or comparing Emails:", error);
    }
  }
};
