import { test, expect } from "@playwright/test";
import { createTestLogger } from "../../logging/logger.js";
import { ElementHelper } from "../../utils/ElementHelper.js";
import { default as config } from "../../../playwright.config.js";
import { generateRandomString } from "../../utils/GenerateRandomString.js";

export class CheckoutPage {
  constructor(page) {
    this.page = page;
    this.logger = createTestLogger(test.info().file);
    this.elementHelper = new ElementHelper(page, this.logger);
    this.newPage = null;
    this.copiedCheckoutLink = null;
    this.totalCheckoutAmount = null;
    this.totalCheckoutAmountOnPayment = null;

    //locators
    this.locators = {
      getPaidSidebarOption: "//button[@aria-label='Get Paid']",
      checkoutSidebarOption: "(//button[contains(.,'Checkout')])[2]",
      createCheckoutBtn: "//button[.='+ Create Checkout']",
      productDropdown: "//input[@placeholder='Product/Service']",
      productSelectDropdown: "(//ul/li[@role='option'])[1]",
      checkoutAmount: `//div/p[starts-with(., '$') and contains(., '${process.env.CURRENCY}')]`,
      checkoutAmountOnPayment:
        `//div/p[starts-with(., '$') and contains(., '${process.env.CURRENCY}')]`,
      sendAndCreateCheckoutBtn: "//button[.='Create Checkout']",
      copyIconCheckoutLink: "//tbody//tr[1]/td[4]/div/button",
      firstNameInput: "//input[@name='firstName']",
      lastNameInput: "//input[@name='lastName']",
      emailInput: "//input[@name='email']",
      stripeIframe:
        "(//iframe[starts-with(@name, '__privateStripeFrame')][1])[2]",
      cardNum: "//input[@name='cardnumber']",
      expDate: "//input[@name='exp-date']",
      cardCVC: "//input[@name='cvc']",
      confirmPayRadioBtn: "//input[@type='checkbox']",
      payBtn: "//button[contains(.,'Pay')]",
      paidConfirmation: "//p[.='Paid!']",
    };
  }

  async navigateToCheckout() {
    try {
      const { getPaidSidebarOption, checkoutSidebarOption } = this.locators;
      await this.elementHelper.clickElement(
        getPaidSidebarOption,
        "Get Paid sidebar option"
      );
      await this.elementHelper.clickElement(
        checkoutSidebarOption,
        "Checkout sidebar option"
      );
    } catch (error) {
      this.logger.error("Error navigating to the checkout module", error);
      expect(this.page).toBeFalsy();
    }
  }

  async createCheckout() {
    try {
      const {
        createCheckoutBtn,
        productDropdown,
        productSelectDropdown,
        checkoutAmount,
        sendAndCreateCheckoutBtn,
        copyIconCheckoutLink,
      } = this.locators;

      // Grant clipboard permissions to avoid the popup
      await this.page
        .context()
        .grantPermissions(["clipboard-read", "clipboard-write"], {
          origin: config.use.baseURL,
        });

      await this.elementHelper.clickElement(
        createCheckoutBtn,
        "Create checkout button"
      );
      expect(this.page).toHaveURL(
        `${config.use.baseURL}/payments/create?mode=checkout`,
        {
          timeout: 5000,
        }
      );

      //Select Product
      await this.elementHelper.clickElement(
        productDropdown,
        "Product dropdown"
      );
      await this.elementHelper.clickElement(
        productSelectDropdown,
        "Product select option"
      );
      this.logger.info("Product selected successfully in checkout page.");

      const checkoutAmountElement = await this.elementHelper.waitForElement(
        checkoutAmount,
        "Checkout amount"
      );

      this.totalCheckoutAmount = await checkoutAmountElement.textContent();

      console.log(this.totalCheckoutAmount);

      // Click on the Create Checkout button
      await this.elementHelper.clickElement(
        sendAndCreateCheckoutBtn,
        "Create checkout button"
      );

      // Click on copy icon
      await this.elementHelper.clickElement(
        copyIconCheckoutLink,
        "copied on the Checkout link"
      );

      // Wait for clipboard to be updated and retrieve the copied link
      this.copiedCheckoutLink = await this.page.evaluate(() =>
        navigator.clipboard.readText()
      );

      console.log("Copied Checkout Link:", this.copiedCheckoutLink);
    } catch (error) {
      this.logger.error("Error creating the checkout", error);
      expect(this.page).toBeFalsy();
    }
  }

  async payCheckout() {
    try {
      const {
        checkoutAmountOnPayment,
        firstNameInput,
        lastNameInput,
        emailInput,
        stripeIframe,
        cardNum,
        expDate,
        cardCVC,
        confirmPayRadioBtn,
        payBtn,
        paidConfirmation,
      } = this.locators;
      this.newPage = await this.page.context().newPage();

      console.log(this.copiedCheckoutLink);

      await this.newPage.goto(this.copiedCheckoutLink);
      await this.newPage.waitForLoadState();
      this.logger.info("Successfully opened the checkout link in a new tab.");

      const newPageHelper = new ElementHelper(this.newPage, this.logger);

      const checkoutAmountElementOnPayment = await newPageHelper.waitForElement(
        checkoutAmountOnPayment,
        "Checkout amount on payment page"
      );

      this.totalCheckoutAmountOnPayment =
        await checkoutAmountElementOnPayment.textContent();

      console.log(this.totalCheckoutAmountOnPayment);

      expect(this.totalCheckoutAmount).toBe(this.totalCheckoutAmountOnPayment);
      this.logger.info("Checkout amount is display correct in Payment page.");

      await newPageHelper.fillInput(
        firstNameInput,
        generateRandomString(5),
        "First Name input"
      );
      await newPageHelper.fillInput(
        lastNameInput,
        generateRandomString(5),
        "Last Name input"
      );
      await newPageHelper.fillInput(
        emailInput,
        `qapaid+${generateRandomString(5)}@gmail.com`,
        "Email input"
      );

      //Switch to the iframe
      const cardDetailsIframe = await newPageHelper.waitForElement(
        stripeIframe,
        "Stripe iframe"
      );
      const frame = await cardDetailsIframe.contentFrame();

      // Now interact with elements inside the iframe
      await frame.locator(cardNum).fill(process.env.CARD_NUMBER);
      await frame.locator(expDate).fill(process.env.CARD_EXP_DATE);
      await frame.locator(cardCVC).fill(process.env.CARD_CVC);
      this.logger.info("Successfully entered card details on Stripe iframe.");

      //checkbox for confirm payment
      await newPageHelper.clickElement(
        confirmPayRadioBtn,
        "Confirm payment checkbox"
      );

      //click on pay button
      await newPageHelper.clickElement(payBtn, "Pay button");

      //check for paid confirmation
      await newPageHelper.waitForElement(paidConfirmation, "Paid confirmation");
    } catch (error) {
      this.logger.error("Error navigating to the checkout module", error);
      expect(this.page).toBeFalsy();
    }
  }
}
